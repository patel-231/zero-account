import React, { useState } from 'react';
import {
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Download,
  Share2,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { db } from '../../server/db';
import { recordCustomerPayment } from '../../services/paymentService';
import { formatINR } from '../../utils/money';
import { Invoice, Payment, PaymentMethod } from '../../types';
import { downloadPaymentReceiptPDF } from '../../utils/pdfService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoice: Invoice | null;
  onOpenShare?: (payment: Payment) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  invoice,
  onOpenShare,
}) => {
  if (!isOpen || !invoice) return null;

  const [amount, setAmount] = useState<number>(invoice.amountDue);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [bankAccountId, setBankAccountId] = useState<string>('bank-1');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState<string>('UPI/HDFC/' + Math.floor(100000 + Math.random() * 900000));
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [recordedPayment, setRecordedPayment] = useState<Payment | null>(null);

  const remainingDue = Math.max(0, Number((invoice.amountDue - (amount || 0)).toFixed(2)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (amount <= 0) throw new Error('Payment amount must be greater than zero.');
      if (amount > invoice.amountDue) {
        throw new Error(`Amount cannot exceed invoice outstanding of ${formatINR(invoice.amountDue)}`);
      }

      const payment = recordCustomerPayment({
        customerId: invoice.customerId,
        invoiceId: invoice.id,
        amount: Number(amount),
        paymentMethod,
        bankAccountId,
        paymentDate: new Date(paymentDate).toISOString(),
        reference,
        notes,
      });

      setRecordedPayment(payment);
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If payment succeeded, show confirmation & receipt sharing screen
  if (recordedPayment) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Payment Recorded Successfully!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Receipt voucher created and general ledger journal automatically reconciled.
              </p>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-emerald-900">
                <span>Amount Received:</span>
                <span className="font-mono font-bold text-sm text-emerald-800">{formatINR(recordedPayment.amount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Customer:</span>
                <span className="font-semibold text-slate-800">{recordedPayment.customerName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Invoice:</span>
                <span className="font-mono text-slate-800">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Mode / Ref:</span>
                <span className="font-mono text-slate-700">{recordedPayment.paymentMethod} ({recordedPayment.reference})</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {onOpenShare && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenShare(recordedPayment);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Send Receipt to Customer (WhatsApp / Email)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => downloadPaymentReceiptPDF(recordedPayment)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Official Receipt PDF (Rule 50)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Record Customer Payment</h2>
              <p className="text-xs text-slate-500 font-mono">Invoice: {invoice.invoiceNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Invoice Summary Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Customer:</span>
              <span className="font-semibold text-slate-800">{invoice.customerName}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Invoice Total:</span>
              <span className="font-mono">{formatINR(invoice.total)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Already Paid:</span>
              <span className="font-mono text-emerald-600">{formatINR(invoice.amountPaid)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>Current Outstanding:</span>
              <span className="font-mono text-blue-700">{formatINR(invoice.amountDue)}</span>
            </div>
          </div>

          {/* Payment Amount input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-xs font-bold">₹</span>
              <input
                type="number"
                min="1"
                max={invoice.amountDue}
                step="any"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full text-sm font-bold text-slate-900 pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>Remaining balance after payment:</span>
              <span className="font-mono font-bold text-slate-700">{formatINR(remainingDue)}</span>
            </div>
          </div>

          {/* Payment Method & Bank Account */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="CASH">Cash on Hand</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CARD">Credit / Debit Card</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Deposit To</label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
              >
                {db.bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} - {b.accountName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reference & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ref / UTR / Cheque No.
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="UTR No. or Txn ID"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received via NEFT / Client confirmed by email"
              className="w-full text-xs p-2 border border-slate-300 rounded-lg"
            />
          </div>

          {/* Action Buttons */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
