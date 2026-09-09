import React from 'react';
import {
  X,
  Receipt,
  Download,
  Share2,
  CheckCircle2,
  Calendar,
  Building2,
  CreditCard,
  FileText,
  User,
  ExternalLink,
} from 'lucide-react';
import { Payment } from '../../types';
import { db } from '../../server/db';
import { formatINR, numberToIndianWords } from '../../utils/money';
import { downloadPaymentReceiptPDF } from '../../utils/pdfService';

interface PaymentReceiptModalProps {
  payment: Payment;
  onClose: () => void;
  onOpenShare: (payment: Payment) => void;
  onViewInvoice?: (invoiceId: string) => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  payment,
  onClose,
  onOpenShare,
  onViewInvoice,
}) => {
  const org = db.organization;
  const customer = db.customers.find((c) => c.id === payment.customerId);
  const receiptNo = `REC-${payment.id.replace('pay-', '').substring(0, 8).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        
        {/* Header Bar */}
        <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Payment Receipt Voucher</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                  Rule 50 CGST
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                {receiptNo} &bull; Recorded on {new Date(payment.paymentDate).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* Main Amount Card */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 text-center relative overflow-hidden">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Payment Received & Reconciled</span>
            </div>
            <div className="text-3xl font-extrabold text-emerald-950 font-mono tracking-tight">
              {formatINR(payment.amount)}
            </div>
            <p className="text-xs font-medium text-emerald-700 mt-1">
              {numberToIndianWords(payment.amount)}
            </p>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-400 block font-medium">Payment Mode</span>
              <span className="font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                {payment.paymentMethod.replace('_', ' ')}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-400 block font-medium">Reference / UTR</span>
              <span className="font-mono font-bold text-slate-800 mt-0.5 truncate block">
                {payment.reference || payment.notes || 'Direct Bank Settlement'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-400 block font-medium">Payer (Customer)</span>
              <span className="font-bold text-slate-800 mt-0.5 truncate block">
                {payment.customerName}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-400 block font-medium">Deposited Into Account</span>
              <span className="font-bold text-slate-800 mt-0.5 truncate block">
                {payment.bankAccountName || 'HDFC Bank Current A/c'}
              </span>
            </div>
          </div>

          {/* Settled Against Invoice Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">
                  {payment.invoiceNumber ? `Linked Invoice: ${payment.invoiceNumber}` : 'Recorded On Account (Advance)'}
                </span>
              </div>

              {payment.invoiceId && onViewInvoice && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewInvoice(payment.invoiceId!);
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                >
                  <span>View Invoice</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Double-entry journal has been auto-posted to General Ledger debiting Bank and crediting Accounts Receivable.
            </p>
          </div>

          {/* Seller / Organization Info */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-[11px] text-slate-500">
            <div>
              <p className="font-bold text-slate-800">{org.legalName || org.name}</p>
              <p>GSTIN: {org.gstin || 'N/A'} &bull; State Code: {org.stateCode}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-emerald-700">Audit-Ready Voucher</p>
              <p>Valid for Indian Income Tax & GST</p>
            </div>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => downloadPaymentReceiptPDF(payment)}
              className="flex-1 sm:flex-initial px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenShare(payment)}
              className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              <span>Send Receipt</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
