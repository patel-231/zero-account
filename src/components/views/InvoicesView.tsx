import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  CreditCard,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileDown,
} from 'lucide-react';
import { db } from '../../server/db';
import { Invoice, InvoiceStatus } from '../../types';
import { formatINR } from '../../utils/money';
import { downloadInvoicePDF } from '../../utils/pdfInvoice';

interface InvoicesViewProps {
  onOpenCreate: () => void;
  onViewInvoice: (id: string) => void;
  onRecordPayment: (invoice: Invoice) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  onOpenCreate,
  onViewInvoice,
  onRecordPayment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredInvoices = db.invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalBilled = db.invoices
    .filter((i) => i.status !== 'CANCELLED' && i.status !== 'DRAFT')
    .reduce((acc, i) => acc + i.total, 0);

  const totalCollected = db.invoices.reduce((acc, i) => acc + i.amountPaid, 0);
  const totalOutstanding = db.invoices
    .filter((i) => i.status !== 'CANCELLED' && i.status !== 'DRAFT')
    .reduce((acc, i) => acc + i.amountDue, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Metric Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tax Invoices (Sales)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Indian GST Compliant Invoices with automatic journal entries and stock deduction.
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Tax Invoice</span>
        </button>
      </div>

      {/* Mini KPI summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Billed</div>
          <div className="text-lg font-bold text-slate-900 mt-1">{formatINR(totalBilled)}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Collected</div>
          <div className="text-lg font-bold text-emerald-600 mt-1">{formatINR(totalCollected)}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Outstanding</div>
          <div className="text-lg font-bold text-blue-700 mt-1">{formatINR(totalOutstanding)}</div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by invoice # or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto text-xs pb-1 md:pb-0">
          {['ALL', 'SENT', 'PARTIALLY_PAID', 'PAID', 'DRAFT', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-medium transition shrink-0 ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-semibold text-slate-700">No invoices found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No tax invoices match your current search or status filters. Click "New Tax Invoice" to create one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5 text-right">Taxable</th>
                  <th className="p-3.5 text-right">GST Total</th>
                  <th className="p-3.5 text-right">Total (₹)</th>
                  <th className="p-3.5 text-right">Paid</th>
                  <th className="p-3.5 text-right">Balance Due</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    {/* Invoice # */}
                    <td className="p-3.5 font-bold font-mono text-blue-600">
                      <button
                        onClick={() => onViewInvoice(inv.id)}
                        className="hover:underline flex items-center gap-1"
                      >
                        {inv.invoiceNumber}
                      </button>
                    </td>

                    {/* Customer */}
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900">{inv.customerName}</div>
                      <div className="text-[10px] text-slate-500">POS: {inv.placeOfSupply}</div>
                    </td>

                    {/* Date */}
                    <td className="p-3.5 text-slate-600">
                      {new Date(inv.invoiceDate).toLocaleDateString('en-IN')}
                    </td>

                    {/* Due Date */}
                    <td className="p-3.5 text-slate-600">
                      {new Date(inv.dueDate).toLocaleDateString('en-IN')}
                    </td>

                    {/* Taxable */}
                    <td className="p-3.5 text-right font-mono text-slate-700">
                      {formatINR(inv.taxableAmount)}
                    </td>

                    {/* GST Total */}
                    <td className="p-3.5 text-right font-mono text-slate-600">
                      {formatINR(inv.cgst + inv.sgst + inv.igst)}
                    </td>

                    {/* Grand Total */}
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                      {formatINR(inv.total)}
                    </td>

                    {/* Paid */}
                    <td className="p-3.5 text-right font-mono text-emerald-600 font-medium">
                      {formatINR(inv.amountPaid)}
                    </td>

                    {/* Due */}
                    <td className="p-3.5 text-right font-mono font-bold text-rose-600">
                      {formatINR(inv.amountDue)}
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'PARTIALLY_PAID'
                            ? 'bg-amber-100 text-amber-800'
                            : inv.status === 'SENT'
                            ? 'bg-blue-100 text-blue-800'
                            : inv.status === 'DRAFT'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewInvoice(inv.id)}
                          title="View Tax Invoice"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => downloadInvoicePDF(inv)}
                          title="Download PDF"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {inv.amountDue > 0 && inv.status !== 'DRAFT' && inv.status !== 'CANCELLED' && (
                          <button
                            onClick={() => onRecordPayment(inv)}
                            title="Record Payment"
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
