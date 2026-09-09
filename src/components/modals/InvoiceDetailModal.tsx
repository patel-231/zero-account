import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Send,
  Building,
} from 'lucide-react';
import { Invoice } from '../../types';
import { db } from '../../server/db';
import { postInvoice, cancelInvoice } from '../../services/invoiceService';
import { formatINR, numberToIndianWords } from '../../utils/money';
import { downloadInvoicePDF } from '../../utils/pdfInvoice';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onRecordPayment: (invoice: Invoice) => void;
  onViewJournal: (journalId: string) => void;
  onRefresh: () => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onRecordPayment,
  onViewJournal,
  onRefresh,
}) => {
  if (!isOpen || !invoice) return null;

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const org = db.organization;

  const handlePost = () => {
    try {
      setIsProcessing(true);
      setError(null);
      postInvoice(invoice.id);
      onRefresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    const reason = prompt('Please enter cancellation reason for this invoice:');
    if (!reason) return;
    try {
      setIsProcessing(true);
      setError(null);
      cancelInvoice(invoice.id, reason);
      onRefresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-6 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Action Bar */}
        <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                invoice.status === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800'
                  : invoice.status === 'PARTIALLY_PAID'
                  ? 'bg-amber-100 text-amber-800'
                  : invoice.status === 'SENT'
                  ? 'bg-blue-100 text-blue-800'
                  : invoice.status === 'DRAFT'
                  ? 'bg-slate-200 text-slate-700'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {invoice.status}
            </span>
            <span className="text-xs text-slate-500 font-mono">ID: {invoice.id}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Download PDF button */}
            <button
              onClick={() => downloadInvoicePDF(invoice)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            {/* If Draft: Post button */}
            {invoice.status === 'DRAFT' && (
              <button
                onClick={handlePost}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post & Post to Ledger</span>
              </button>
            )}

            {/* If Outstanding: Record Payment button */}
            {invoice.amountDue > 0 && invoice.status !== 'DRAFT' && invoice.status !== 'CANCELLED' && (
              <button
                onClick={() => onRecordPayment(invoice)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>
            )}

            {/* Cancel Invoice button */}
            {invoice.status !== 'CANCELLED' && invoice.amountPaid === 0 && (
              <button
                onClick={handleCancel}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs font-semibold transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}

            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* Invoice Printable View Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Header Banner */}
          <div className="border border-slate-800 rounded-xl p-6 bg-white space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>ZEROBOOKS</span>
                  <span className="text-xs font-semibold bg-slate-900 text-white px-2 py-0.5 rounded">
                    TAX INVOICE
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-800 mt-2">{org.legalName}</div>
                <div className="text-xs text-slate-600">{org.address}, {org.city}, {org.state} - {org.pinCode}</div>
                <div className="text-xs text-slate-600 font-mono mt-0.5">
                  GSTIN: {org.gstin} | PAN: {org.pan} | State Code: {org.stateCode}
                </div>
                <div className="text-xs text-slate-600">Email: {org.email} | Phone: {org.phone}</div>
              </div>

              {/* Invoice Meta */}
              <div className="text-left sm:text-right bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1 w-full sm:w-64">
                <div className="text-sm font-bold text-blue-700 font-mono">{invoice.invoiceNumber}</div>
                <div className="text-slate-600">Date: {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</div>
                <div className="text-slate-600">Due: {new Date(invoice.dueDate).toLocaleDateString('en-IN')}</div>
                <div className="text-slate-600">
                  Place of Supply: <strong>{invoice.placeOfSupply}</strong>
                </div>
                <div className="text-[11px] font-semibold text-emerald-700 mt-1">
                  {invoice.isIntraState ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}
                </div>
              </div>
            </div>

            {/* Billed To Customer */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Billed To (Recipient)
              </div>
              <div className="text-sm font-bold text-slate-900">{invoice.customerName}</div>
              <div className="text-slate-600 mt-0.5">{invoice.billingAddress}</div>
              <div className="text-slate-700 font-mono mt-1">
                GSTIN: <span className="font-semibold">{invoice.gstin || 'Unregistered Buyer'}</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Item & Description</th>
                    <th className="p-3">HSN/SAC</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Rate</th>
                    <th className="p-3 text-right">Taxable</th>
                    <th className="p-3 text-right">{invoice.isIntraState ? 'CGST + SGST' : 'IGST'}</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-medium text-slate-900">
                        {item.productName}
                        {item.description && (
                          <div className="text-[11px] text-slate-500">{item.description}</div>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-600">{item.hsnSac || '-'}</td>
                      <td className="p-3 text-right font-medium text-slate-800">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-700">{formatINR(item.rate)}</td>
                      <td className="p-3 text-right font-mono font-medium text-slate-900">
                        {formatINR(item.taxableAmount)}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-600">
                        {invoice.isIntraState ? (
                          <div>
                            C: {formatINR(item.cgst)} <br />
                            S: {formatINR(item.sgst)}
                          </div>
                        ) : (
                          <div>I: {formatINR(item.igst)}</div>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {formatINR(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals & Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3 text-xs">
                <div>
                  <div className="font-semibold text-slate-700">Amount in Words:</div>
                  <div className="text-slate-800 font-medium italic mt-0.5">
                    {numberToIndianWords(invoice.total)}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-800">Bank Transfer Details</div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Bank: HDFC Bank | A/c No: 50200098765432 | IFSC: HDFC0001024
                  </div>
                  <div className="text-[11px] text-slate-600">UPI ID: zerodemo@hdfcbank</div>
                </div>

                {/* Journal Link */}
                {invoice.journalEntryId && (
                  <button
                    onClick={() => onViewJournal(invoice.journalEntryId!)}
                    className="flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>View Posted Journal Entry Lines &rarr;</span>
                  </button>
                )}
              </div>

              {/* Numbers summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Subtotal:</span>
                  <span className="font-mono font-medium">{formatINR(invoice.taxableAmount)}</span>
                </div>

                {invoice.isIntraState ? (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Central GST (CGST):</span>
                      <span className="font-mono font-medium">{formatINR(invoice.cgst)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>State GST (SGST):</span>
                      <span className="font-mono font-medium">{formatINR(invoice.sgst)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-slate-600">
                    <span>Integrated GST (IGST):</span>
                    <span className="font-mono font-medium">{formatINR(invoice.igst)}</span>
                  </div>
                )}

                {invoice.roundOff !== 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Round-off Adjustment:</span>
                    <span className="font-mono">{formatINR(invoice.roundOff)}</span>
                  </div>
                )}

                <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>Grand Total:</span>
                  <span className="font-mono text-base text-blue-700">{formatINR(invoice.total)}</span>
                </div>

                <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                  <span>Amount Paid:</span>
                  <span className="font-mono">{formatINR(invoice.amountPaid)}</span>
                </div>

                <div className="flex justify-between text-rose-700 font-bold">
                  <span>Balance Due:</span>
                  <span className="font-mono">{formatINR(invoice.amountDue)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
