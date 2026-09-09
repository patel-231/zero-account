import Decimal from 'decimal.js';
import { db } from '../server/db';
import { calculateInvoiceTotals } from '../utils/money';
import { recordStockMovement } from './inventoryService';
import { createJournalEntry, reverseJournalEntry } from './accountingService';
import { Invoice, InvoiceItem, InvoiceStatus } from '../types';

export class InvoiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvoiceError';
  }
}

/**
 * Generate next unique invoice number
 */
export function getNextInvoiceNumber(): string {
  const prefix = db.organization.invoicePrefix || 'INV-2026-';
  const num = db.organization.nextInvoiceNumber || 1001;
  return `${prefix}${String(num).padStart(4, '0')}`;
}

/**
 * Create a new draft or directly post an invoice
 */
export function createInvoice(params: {
  customerId: string;
  invoiceDate?: string;
  dueDate?: string;
  placeOfSupply?: string;
  billingAddress?: string;
  shippingAddress?: string;
  notes?: string;
  terms?: string;
  quoteId?: string;
  salesOrderId?: string;
  items: Array<{
    productId?: string;
    productName: string;
    description?: string;
    hsnSac?: string;
    quantity: number;
    unit?: string;
    rate: number;
    discount?: number;
    taxRate: number;
  }>;
  autoPost?: boolean;
}): Invoice {
  // Step 1: Validate customer
  const customer = db.customers.find((c) => c.id === params.customerId);
  if (!customer) {
    throw new InvoiceError(`Customer with ID '${params.customerId}' was not found.`);
  }

  if (!params.items || params.items.length === 0) {
    throw new InvoiceError('An invoice must contain at least one line item.');
  }

  // Determine intra-state vs inter-state
  // Comparison between Business State Code and Customer State Code / Place of Supply
  const businessStateCode = db.organization.stateCode;
  const targetPlace = params.placeOfSupply || customer.state;
  const isIntraState = customer.stateCode === businessStateCode;

  // Step 2: Server-side recalculation of line items and totals
  const recalculatedTotals = calculateInvoiceTotals(params.items, isIntraState);

  const invoiceNumber = getNextInvoiceNumber();
  db.organization.nextInvoiceNumber += 1;

  const invoiceId = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const invoiceDate = params.invoiceDate || new Date().toISOString();
  // Due date default: +15 days
  const dueDate =
    params.dueDate ||
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

  // Create calculated items
  const invoiceItems: InvoiceItem[] = params.items.map((item, idx) => {
    const qty = new Decimal(item.quantity);
    const rate = new Decimal(item.rate);
    const disc = new Decimal(item.discount || 0);
    const taxable = qty.times(rate).minus(disc).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const taxPct = new Decimal(item.taxRate);

    let cgst = new Decimal(0);
    let sgst = new Decimal(0);
    let igst = new Decimal(0);

    if (isIntraState) {
      cgst = taxable.times(taxPct.dividedBy(2)).dividedBy(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      sgst = taxable.times(taxPct.dividedBy(2)).dividedBy(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    } else {
      igst = taxable.times(taxPct).dividedBy(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    }

    const lineTotal = taxable.plus(cgst).plus(sgst).plus(igst);

    return {
      id: `inv-item-${invoiceId}-${idx + 1}`,
      invoiceId,
      productId: item.productId,
      productName: item.productName,
      description: item.description,
      hsnSac: item.hsnSac,
      quantity: item.quantity,
      unit: item.unit || 'pcs',
      rate: item.rate,
      discount: item.discount || 0,
      taxRate: item.taxRate,
      taxableAmount: taxable.toNumber(),
      cgst: cgst.toNumber(),
      sgst: sgst.toNumber(),
      igst: igst.toNumber(),
      total: lineTotal.toNumber(),
    };
  });

  const invoice: Invoice = {
    id: invoiceId,
    organizationId: db.organization.id,
    invoiceNumber,
    customerId: customer.id,
    customerName: customer.customerName,
    invoiceDate,
    dueDate,
    status: 'DRAFT',
    billingAddress: params.billingAddress || customer.billingAddress,
    shippingAddress: params.shippingAddress || customer.shippingAddress || customer.billingAddress,
    gstin: customer.gstin,
    placeOfSupply: targetPlace,
    isIntraState,
    items: invoiceItems,
    subtotal: recalculatedTotals.subtotal,
    discount: recalculatedTotals.discount,
    taxableAmount: recalculatedTotals.taxableAmount,
    cgst: recalculatedTotals.cgst,
    sgst: recalculatedTotals.sgst,
    igst: recalculatedTotals.igst,
    roundOff: recalculatedTotals.roundOff,
    total: recalculatedTotals.total,
    amountPaid: 0,
    amountDue: recalculatedTotals.total,
    notes: params.notes,
    terms: params.terms || db.organization.defaultPaymentTerms,
    quoteId: params.quoteId,
    salesOrderId: params.salesOrderId,
    createdBy: db.currentUser.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Add invoice to database
  db.invoices.unshift(invoice);
  db.addAuditLog('INVOICE_CREATED', 'Invoice', invoice.id, `Created draft invoice ${invoice.invoiceNumber} for ${customer.customerName}`);
  db.save();

  // If autoPost is requested, post transactionally
  if (params.autoPost) {
    postInvoice(invoice.id);
  }

  return invoice;
}

/**
 * Transactional posting of an invoice:
 * - Validates inventory stock
 * - Creates StockMovements
 * - Posts balanced Journal Entry (Debit Accounts Receivable, Credit Sales Revenue, Credit Output CGST/SGST or IGST)
 * - Sets status = 'SENT' or 'POSTED'
 * - If anything fails, rollback state!
 */
export function postInvoice(invoiceId: string): Invoice {
  const invoiceIndex = db.invoices.findIndex((inv) => inv.id === invoiceId);
  if (invoiceIndex === -1) {
    throw new InvoiceError(`Invoice '${invoiceId}' not found.`);
  }

  const invoice = db.invoices[invoiceIndex];
  if (invoice.status !== 'DRAFT') {
    throw new InvoiceError(`Invoice '${invoice.invoiceNumber}' is already posted or closed (status: ${invoice.status}).`);
  }

  // Snapshot database state for complete transactional rollback on any error
  const stateSnapshot = {
    invoices: JSON.parse(JSON.stringify(db.invoices)),
    stockMovements: JSON.parse(JSON.stringify(db.stockMovements)),
    journalEntries: JSON.parse(JSON.stringify(db.journalEntries)),
    auditLogs: JSON.parse(JSON.stringify(db.auditLogs)),
  };

  try {
    // 1. Validate & Record stock movements (decrement stock)
    for (const item of invoice.items) {
      if (item.productId) {
        // Record negative quantity movement for Sale
        recordStockMovement({
          productId: item.productId,
          quantity: -item.quantity,
          movementType: 'SALE',
          referenceType: 'INVOICE',
          referenceId: invoice.id,
        });
      }
    }

    // 2. Build Balanced Journal Entry Lines
    // Accounts needed:
    // Receivable (acc-1100): DEBIT (Total invoice amount)
    // Sales Revenue (acc-4000): CREDIT (Taxable amount)
    // Output CGST (acc-2120): CREDIT (CGST amount)
    // Output SGST (acc-2121): CREDIT (SGST amount)
    // Output IGST (acc-2122): CREDIT (IGST amount)
    // Round Off (acc-5900 or 4200): If roundOff is non-zero
    const journalLines: Array<{
      accountId: string;
      description: string;
      debit: number;
      credit: number;
    }> = [];

    // DEBIT: Accounts Receivable (Grand Total)
    journalLines.push({
      accountId: 'acc-1100',
      description: `Sales Receivable from ${invoice.customerName} for ${invoice.invoiceNumber}`,
      debit: invoice.total,
      credit: 0,
    });

    // CREDIT: Sales Revenue (Taxable Amount)
    journalLines.push({
      accountId: 'acc-4000',
      description: `Sales Revenue - ${invoice.invoiceNumber}`,
      debit: 0,
      credit: invoice.taxableAmount,
    });

    // CREDIT: Output Taxes
    if (invoice.isIntraState) {
      if (invoice.cgst > 0) {
        journalLines.push({
          accountId: 'acc-2120',
          description: `Output CGST collected on ${invoice.invoiceNumber}`,
          debit: 0,
          credit: invoice.cgst,
        });
      }
      if (invoice.sgst > 0) {
        journalLines.push({
          accountId: 'acc-2121',
          description: `Output SGST collected on ${invoice.invoiceNumber}`,
          debit: 0,
          credit: invoice.sgst,
        });
      }
    } else {
      if (invoice.igst > 0) {
        journalLines.push({
          accountId: 'acc-2122',
          description: `Output IGST collected on ${invoice.invoiceNumber}`,
          debit: 0,
          credit: invoice.igst,
        });
      }
    }

    // Round Off adjustment if present
    if (invoice.roundOff !== 0) {
      if (invoice.roundOff > 0) {
        // Grand total increased due to round up -> credit other income
        journalLines.push({
          accountId: 'acc-4200',
          description: `Round off credit - ${invoice.invoiceNumber}`,
          debit: 0,
          credit: invoice.roundOff,
        });
      } else {
        // Grand total decreased due to round down -> debit expense
        journalLines.push({
          accountId: 'acc-5900',
          description: `Round off adjustment - ${invoice.invoiceNumber}`,
          debit: Math.abs(invoice.roundOff),
          credit: 0,
        });
      }
    }

    // 3. Create & Post Journal Entry
    const journalEntry = createJournalEntry({
      date: invoice.invoiceDate,
      referenceType: 'INVOICE',
      referenceId: invoice.id,
      referenceDisplay: invoice.invoiceNumber,
      description: `Sales Invoice ${invoice.invoiceNumber} to ${invoice.customerName}`,
      lines: journalLines,
      status: 'POSTED',
    });

    // 4. Update Invoice status
    invoice.status = 'SENT';
    invoice.journalEntryId = journalEntry.id;
    invoice.postedAt = new Date().toISOString();
    invoice.updatedAt = new Date().toISOString();

    db.addAuditLog(
      'INVOICE_POSTED',
      'Invoice',
      invoice.id,
      `Posted invoice ${invoice.invoiceNumber} for ${invoice.customerName} (₹${invoice.total}). Journal: ${journalEntry.entryNumber}`
    );
    db.save();

    return invoice;
  } catch (error) {
    // TRANSACTION ROLLBACK
    db.invoices = stateSnapshot.invoices;
    db.stockMovements = stateSnapshot.stockMovements;
    db.journalEntries = stateSnapshot.journalEntries;
    db.auditLogs = stateSnapshot.auditLogs;
    db.save();

    throw new InvoiceError(`Invoice posting transaction failed and was rolled back: ${(error as Error).message}`);
  }
}

/**
 * Cancel a posted invoice:
 * - Reverses the journal entry
 * - Reverses the stock movements (adds back items)
 * - Updates invoice status to CANCELLED
 */
export function cancelInvoice(invoiceId: string, reason: string): Invoice {
  const invoice = db.invoices.find((i) => i.id === invoiceId);
  if (!invoice) throw new InvoiceError(`Invoice not found: ${invoiceId}`);

  if (invoice.status === 'CANCELLED') {
    throw new InvoiceError(`Invoice '${invoice.invoiceNumber}' is already cancelled.`);
  }

  if (invoice.amountPaid > 0) {
    throw new InvoiceError(
      `Cannot cancel invoice '${invoice.invoiceNumber}' because payments of ₹${invoice.amountPaid} have already been recorded. Revert payments first.`
    );
  }

  // If invoice was posted with a journal entry, reverse it
  if (invoice.journalEntryId) {
    reverseJournalEntry(invoice.journalEntryId, `Invoice cancelled: ${reason}`);

    // Revert stock movements
    for (const item of invoice.items) {
      if (item.productId) {
        recordStockMovement({
          productId: item.productId,
          quantity: item.quantity, // positive to return to stock
          movementType: 'SALES_RETURN',
          referenceType: 'INVOICE_CANCEL',
          referenceId: invoice.id,
        });
      }
    }
  }

  invoice.status = 'CANCELLED';
  invoice.updatedAt = new Date().toISOString();

  db.addAuditLog('INVOICE_CANCELLED', 'Invoice', invoice.id, `Invoice ${invoice.invoiceNumber} cancelled. Reason: ${reason}`);
  db.save();

  return invoice;
}
