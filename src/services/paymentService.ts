import Decimal from 'decimal.js';
import { db } from '../server/db';
import { createJournalEntry } from './accountingService';
import { Payment, PaymentMethod } from '../types';

export class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentError';
  }
}

/**
 * Record a customer payment against an invoice
 */
export function recordCustomerPayment(params: {
  customerId: string;
  invoiceId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  bankAccountId?: string;
  paymentDate?: string;
  reference?: string;
  notes?: string;
}): Payment {
  const customer = db.customers.find((c) => c.id === params.customerId);
  if (!customer) {
    throw new PaymentError(`Customer '${params.customerId}' not found.`);
  }

  const paymentAmountDec = new Decimal(params.amount);
  if (paymentAmountDec.lessThanOrEqualTo(0)) {
    throw new PaymentError('Payment amount must be greater than zero.');
  }

  let invoice = null;
  if (params.invoiceId) {
    invoice = db.invoices.find((inv) => inv.id === params.invoiceId);
    if (!invoice) {
      throw new PaymentError(`Invoice '${params.invoiceId}' not found.`);
    }

    if (invoice.status === 'DRAFT') {
      throw new PaymentError(`Cannot record payment against a DRAFT invoice. Please post the invoice first.`);
    }

    if (invoice.status === 'CANCELLED') {
      throw new PaymentError(`Cannot record payment against a CANCELLED invoice.`);
    }

    const currentDue = new Decimal(invoice.amountDue);
    if (paymentAmountDec.greaterThan(currentDue)) {
      throw new PaymentError(
        `Payment amount (₹${paymentAmountDec.toFixed(2)}) exceeds invoice outstanding amount (₹${currentDue.toFixed(2)}).`
      );
    }
  }

  // Determine Deposit Account:
  // If CASH: Cash on Hand (acc-1000)
  // If BANK_TRANSFER/UPI/CARD/CHEQUE: HDFC Bank Current A/c (acc-1010)
  const depositAccountId = params.paymentMethod === 'CASH' ? 'acc-1000' : 'acc-1010';
  const depositAcc = db.accounts.find((a) => a.id === depositAccountId) || db.accounts[1];

  const paymentDate = params.paymentDate || new Date().toISOString();
  const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  // Snapshot for transactional safety
  const snapshot = {
    invoices: JSON.parse(JSON.stringify(db.invoices)),
    payments: JSON.parse(JSON.stringify(db.payments)),
    journalEntries: JSON.parse(JSON.stringify(db.journalEntries)),
  };

  try {
    // 1. Create Balanced Journal Entry
    // DEBIT Bank / Cash (Asset increases)
    // CREDIT Accounts Receivable (Asset decreases)
    const journalDesc = invoice
      ? `Payment received from ${customer.customerName} for ${invoice.invoiceNumber}`
      : `On-account payment received from ${customer.customerName}`;

    const journal = createJournalEntry({
      date: paymentDate,
      referenceType: 'PAYMENT',
      referenceId: paymentId,
      referenceDisplay: params.reference || (invoice ? invoice.invoiceNumber : 'Payment'),
      description: journalDesc,
      lines: [
        {
          accountId: depositAccountId,
          description: `${params.paymentMethod} payment received into ${depositAcc.name}`,
          debit: paymentAmountDec.toNumber(),
          credit: 0,
        },
        {
          accountId: 'acc-1100',
          description: `Reduction in Accounts Receivable for ${customer.customerName}`,
          debit: 0,
          credit: paymentAmountDec.toNumber(),
        },
      ],
      status: 'POSTED',
    });

    // 2. Update Invoice outstanding
    if (invoice) {
      const currentPaid = new Decimal(invoice.amountPaid);
      const newPaid = currentPaid.plus(paymentAmountDec);
      const newDue = new Decimal(invoice.total).minus(newPaid);

      invoice.amountPaid = newPaid.toDecimalPlaces(2).toNumber();
      invoice.amountDue = newDue.toDecimalPlaces(2).toNumber();

      if (newDue.isZero()) {
        invoice.status = 'PAID';
      } else if (newDue.isPositive()) {
        invoice.status = 'PARTIALLY_PAID';
      }
      invoice.updatedAt = new Date().toISOString();
    }

    // 3. Create Payment record
    const payment: Payment = {
      id: paymentId,
      organizationId: db.organization.id,
      customerId: customer.id,
      customerName: customer.customerName,
      invoiceId: invoice?.id,
      invoiceNumber: invoice?.invoiceNumber,
      paymentDate,
      amount: paymentAmountDec.toNumber(),
      paymentMethod: params.paymentMethod,
      bankAccountId: depositAccountId,
      bankAccountName: depositAcc.name,
      reference: params.reference,
      notes: params.notes,
      journalEntryId: journal.id,
      createdBy: db.currentUser.name,
      createdAt: new Date().toISOString(),
    };

    db.payments.unshift(payment);
    db.addAuditLog(
      'PAYMENT_RECORDED',
      'Payment',
      payment.id,
      `Received ₹${payment.amount} from ${customer.customerName} via ${params.paymentMethod}. Journal: ${journal.entryNumber}`
    );
    db.save();

    return payment;
  } catch (err) {
    db.invoices = snapshot.invoices;
    db.payments = snapshot.payments;
    db.journalEntries = snapshot.journalEntries;
    db.save();
    throw new PaymentError(`Payment failed and was rolled back: ${(err as Error).message}`);
  }
}
