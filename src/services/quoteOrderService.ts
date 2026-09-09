import Decimal from 'decimal.js';
import { db } from '../server/db';
import { Quote, SalesOrder, CreditNote } from '../types';
import { calculateLineItem } from '../utils/money';
import { createInvoice } from './invoiceService';
import { createJournalEntry } from './accountingService';
import { recordStockMovement } from './inventoryService';

export function createQuote(params: {
  customerId: string;
  date?: string;
  expiryDate?: string;
  items: Array<{
    productId?: string;
    description: string;
    quantity: number;
    unit?: string;
    rate: number;
    discount?: number;
    taxRate: number;
  }>;
  notes?: string;
  terms?: string;
}): Quote {
  const customer = db.customers.find((c) => c.id === params.customerId);
  if (!customer) throw new Error('Customer not found');

  const quoteNumber = `QT-2026-${String(db.quotes.length + 101).padStart(3, '0')}`;
  let subtotal = new Decimal(0);
  let totalTax = new Decimal(0);

  const isIntraState = customer.stateCode === db.organization.stateCode;

  const quoteItems = params.items.map((item, idx) => {
    const calc = calculateLineItem(item.quantity, item.rate, item.discount || 0, item.taxRate, isIntraState);
    subtotal = subtotal.plus(new Decimal(calc.taxableAmount));
    totalTax = totalTax.plus(new Decimal(calc.totalTax));

    return {
      id: `qti-${Date.now()}-${idx}`,
      productId: item.productId,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit || 'pcs',
      rate: item.rate,
      discount: item.discount || 0,
      taxRate: item.taxRate,
      taxableAmount: calc.taxableAmount,
      total: calc.total,
    };
  });

  const quote: Quote = {
    id: `qt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    organizationId: db.organization.id,
    quoteNumber,
    customerId: customer.id,
    customerName: customer.customerName,
    date: params.date || new Date().toISOString(),
    expiryDate: params.expiryDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    status: 'DRAFT',
    items: quoteItems,
    subtotal: subtotal.toNumber(),
    discount: 0,
    tax: totalTax.toNumber(),
    total: subtotal.plus(totalTax).toNumber(),
    notes: params.notes,
    terms: params.terms,
    createdAt: new Date().toISOString(),
  };

  db.quotes.unshift(quote);
  db.addAuditLog('QUOTE_CREATED', 'Quote', quote.id, `Created quotation ${quote.quoteNumber} for ${customer.customerName}`);
  db.save();

  return quote;
}

export function convertQuoteToInvoice(quoteId: string) {
  const quote = db.quotes.find((q) => q.id === quoteId);
  if (!quote) throw new Error(`Quote not found: ${quoteId}`);

  const invoice = createInvoice({
    customerId: quote.customerId,
    quoteId: quote.id,
    notes: `Converted from Quotation ${quote.quoteNumber}. ${quote.notes || ''}`,
    items: quote.items.map((it) => ({
      productId: it.productId,
      productName: it.description,
      description: it.description,
      quantity: it.quantity,
      unit: it.unit,
      rate: it.rate,
      discount: it.discount,
      taxRate: it.taxRate,
    })),
  });

  quote.status = 'ACCEPTED';
  quote.convertedInvoiceId = invoice.id;
  db.save();

  return invoice;
}

export function createSalesOrder(params: {
  customerId: string;
  date?: string;
  items: Array<{
    productId?: string;
    description: string;
    quantity: number;
    unit?: string;
    rate: number;
    discount?: number;
    taxRate: number;
  }>;
  notes?: string;
}): SalesOrder {
  const customer = db.customers.find((c) => c.id === params.customerId);
  if (!customer) throw new Error('Customer not found');

  const orderNumber = `SO-2026-${String(db.salesOrders.length + 101).padStart(3, '0')}`;
  let subtotal = new Decimal(0);
  let totalTax = new Decimal(0);

  const isIntraState = customer.stateCode === db.organization.stateCode;

  const items = params.items.map((item, idx) => {
    const calc = calculateLineItem(item.quantity, item.rate, item.discount || 0, item.taxRate, isIntraState);
    subtotal = subtotal.plus(new Decimal(calc.taxableAmount));
    totalTax = totalTax.plus(new Decimal(calc.totalTax));

    return {
      id: `soi-${Date.now()}-${idx}`,
      productId: item.productId,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit || 'pcs',
      rate: item.rate,
      discount: item.discount || 0,
      taxRate: item.taxRate,
      taxableAmount: calc.taxableAmount,
      total: calc.total,
    };
  });

  const order: SalesOrder = {
    id: `so-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    organizationId: db.organization.id,
    orderNumber,
    customerId: customer.id,
    customerName: customer.customerName,
    date: params.date || new Date().toISOString(),
    status: 'CONFIRMED',
    items,
    subtotal: subtotal.toNumber(),
    discount: 0,
    tax: totalTax.toNumber(),
    total: subtotal.plus(totalTax).toNumber(),
    notes: params.notes,
    createdAt: new Date().toISOString(),
  };

  db.salesOrders.unshift(order);
  db.addAuditLog('SALES_ORDER_CREATED', 'SalesOrder', order.id, `Created sales order ${order.orderNumber}`);
  db.save();

  return order;
}

export function convertSalesOrderToInvoice(orderId: string) {
  const order = db.salesOrders.find((o) => o.id === orderId);
  if (!order) throw new Error(`Sales Order not found: ${orderId}`);

  const invoice = createInvoice({
    customerId: order.customerId,
    salesOrderId: order.id,
    notes: `Converted from Sales Order ${order.orderNumber}. ${order.notes || ''}`,
    items: order.items.map((it) => ({
      productId: it.productId,
      productName: it.description,
      description: it.description,
      quantity: it.quantity,
      unit: it.unit,
      rate: it.rate,
      discount: it.discount,
      taxRate: it.taxRate,
    })),
  });

  order.status = 'FULFILLED';
  order.convertedInvoiceId = invoice.id;
  db.save();

  return invoice;
}

export function createCreditNote(params: {
  invoiceId: string;
  reason: string;
  amount?: number;
  returnStock?: boolean;
}): CreditNote {
  const invoice = db.invoices.find((i) => i.id === params.invoiceId);
  if (!invoice) throw new Error('Invoice not found');

  const creditNoteNumber = `CN-2026-${String(db.creditNotes.length + 1).padStart(4, '0')}`;
  const totalCredit = params.amount || invoice.total;
  const ratio = new Decimal(totalCredit).dividedBy(invoice.total || 1);
  const subtotal = new Decimal(invoice.taxableAmount).times(ratio).toDecimalPlaces(2).toNumber();
  const tax = new Decimal(totalCredit).minus(subtotal).toDecimalPlaces(2).toNumber();

  // Create Reversal Accounting Journal Entry
  // DEBIT Sales Revenue (acc-4000)
  // DEBIT Output Tax (acc-2120 / 2121 / 2122)
  // CREDIT Accounts Receivable (acc-1100)
  const lines: Array<{ accountId: string; description: string; debit: number; credit: number }> = [
    {
      accountId: 'acc-4000',
      description: `Reversal of Sales Revenue - ${creditNoteNumber}`,
      debit: subtotal,
      credit: 0,
    },
  ];

  if (invoice.isIntraState) {
    const halfTax = new Decimal(tax).dividedBy(2).toDecimalPlaces(2).toNumber();
    lines.push(
      {
        accountId: 'acc-2120',
        description: `Reversal of Output CGST - ${creditNoteNumber}`,
        debit: halfTax,
        credit: 0,
      },
      {
        accountId: 'acc-2121',
        description: `Reversal of Output SGST - ${creditNoteNumber}`,
        debit: tax - halfTax,
        credit: 0,
      }
    );
  } else {
    lines.push({
      accountId: 'acc-2122',
      description: `Reversal of Output IGST - ${creditNoteNumber}`,
      debit: tax,
      credit: 0,
    });
  }

  lines.push({
    accountId: 'acc-1100',
    description: `Credit Note reduction in Accounts Receivable for ${invoice.customerName}`,
    debit: 0,
    credit: totalCredit,
  });

  const je = createJournalEntry({
    referenceType: 'CREDIT_NOTE',
    referenceId: invoice.id,
    referenceDisplay: creditNoteNumber,
    description: `Credit Note ${creditNoteNumber} for Invoice ${invoice.invoiceNumber} (${params.reason})`,
    lines,
    status: 'POSTED',
  });

  // If return stock, add back items to inventory
  if (params.returnStock) {
    for (const item of invoice.items) {
      if (item.productId) {
        recordStockMovement({
          productId: item.productId,
          quantity: item.quantity,
          movementType: 'SALES_RETURN',
          referenceType: 'CREDIT_NOTE',
          referenceId: creditNoteNumber,
        });
      }
    }
  }

  // Update invoice outstanding
  invoice.amountDue = Math.max(0, invoice.amountDue - totalCredit);
  if (invoice.amountDue === 0) invoice.status = 'PAID';

  const creditNote: CreditNote = {
    id: `cn-${Date.now()}`,
    organizationId: db.organization.id,
    creditNoteNumber,
    customerId: invoice.customerId,
    customerName: invoice.customerName,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    date: new Date().toISOString(),
    reason: params.reason,
    subtotal,
    tax,
    total: totalCredit,
    journalEntryId: je.id,
    createdAt: new Date().toISOString(),
  };

  db.creditNotes.unshift(creditNote);
  db.addAuditLog('CREDIT_NOTE_CREATED', 'CreditNote', creditNote.id, `Created credit note ${creditNoteNumber} for ${invoice.invoiceNumber}`);
  db.save();

  return creditNote;
}
