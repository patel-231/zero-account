import React, { useState } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  ArrowDownLeft,
  Calendar,
  Building2,
  FileText,
  DollarSign,
  Receipt,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { db } from '../../server/db';
import { Payment, Invoice } from '../../types';
import { formatINR } from '../../utils/money';

interface PaymentsViewProps {
  onOpenRecordPayment: () => void;
  onViewInvoice: (invoiceId: string) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  onOpenRecordPayment,
  onViewInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');

  const filteredPayments = db.payments.filter((p) => {
    const matchesSearch =
      p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.reference && p.reference.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMethod = methodFilter === 'ALL' || p.paymentMethod === methodFilter;

    return matchesSearch && matchesMethod;
  });

  const totalCollected = db.payments.reduce((sum, p) => sum + p.amount, 0);
  const bankCollected = db.payments
    .filter((p) => p.paymentMethod === 'BANK_TRANSFER' || p.paymentMethod === 'CHEQUE')
    .reduce((sum, p) => sum + p.amount, 0);
  const upiCollected = db.payments
    .filter((p) => p.paymentMethod === 'UPI')
    .reduce((sum, p) => sum + p.amount, 0);
  const cashCollected = db.payments
    .filter((p) => p.paymentMethod === 'CASH')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Payments Received & Receipts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time receipt registry with auto-posted double-entry bank/cash journals and customer reconciliation.
          </p>
        </div>

        <button
          onClick={onOpenRecordPayment}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Record Customer Payment</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Collections</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono mt-2">
            {formatINR(totalCollected)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across {db.payments.length} transactions</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Bank Transfers (NEFT/RTGS)</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono mt-2">
            {formatINR(bankCollected)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Direct to HDFC Operating A/c</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">UPI Instant Receipts</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono mt-2">
            {formatINR(upiCollected)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Instant VPA Settlement</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Cash & Counter Receipts</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono mt-2">
            {formatINR(cashCollected)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Petty cash on hand</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by customer name, invoice #, or payment reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Method:</span>
          {(['ALL', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'CASH'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setMethodFilter(mode)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                methodFilter === mode
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {mode === 'ALL'
                ? 'All Modes'
                : mode === 'BANK_TRANSFER'
                ? 'Bank'
                : mode === 'UPI'
                ? 'UPI'
                : mode === 'CHEQUE'
                ? 'Cheque'
                : 'Cash'}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Linked Invoice</th>
                <th className="p-3.5">Payment Mode</th>
                <th className="p-3.5">Account / Destination</th>
                <th className="p-3.5">Reference / UTR</th>
                <th className="p-3.5 text-right">Amount Received</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No payment receipts found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-mono text-slate-600">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="p-3.5 font-bold text-slate-900">{p.customerName}</td>

                      <td className="p-3.5">
                        {p.invoiceId ? (
                          <button
                            onClick={() => onViewInvoice(p.invoiceId!)}
                            className="font-mono text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {p.invoiceNumber || 'View Invoice'}
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">On Account (Advance)</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.paymentMethod === 'BANK_TRANSFER'
                              ? 'bg-blue-100 text-blue-800'
                              : p.paymentMethod === 'UPI'
                              ? 'bg-purple-100 text-purple-800'
                              : p.paymentMethod === 'CHEQUE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          <ArrowDownLeft className="w-3 h-3" />
                          {p.paymentMethod.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-600">
                        {p.bankAccountName || 'HDFC Bank (A/c ...8821)'}
                      </td>

                      <td className="p-3.5 font-mono text-slate-500">
                        {p.reference || p.notes || '-'}
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-emerald-700 text-sm">
                        {formatINR(p.amount)}
                      </td>

                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Reconciled
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
