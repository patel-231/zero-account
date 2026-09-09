import React, { useState } from 'react';
import {
  FileSpreadsheet,
  ShoppingCart,
  RotateCcw,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { db } from '../../server/db';
import {
  convertQuoteToInvoice,
  convertSalesOrderToInvoice,
} from '../../services/quoteOrderService';
import { formatINR } from '../../utils/money';
import { QuoteModal } from '../modals/QuoteModal';

interface QuotesOrdersViewProps {
  onViewInvoice: (invoiceId: string) => void;
  onRefresh: () => void;
  defaultSubTab?: 'quotes' | 'orders' | 'credit-notes';
}

export const QuotesOrdersView: React.FC<QuotesOrdersViewProps> = ({
  onViewInvoice,
  onRefresh,
  defaultSubTab = 'quotes',
}) => {
  const [subTab, setSubTab] = useState<'quotes' | 'orders' | 'credit-notes'>(defaultSubTab);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'quote' | 'order'>('quote');

  const handleConvertQuote = (quoteId: string) => {
    try {
      const inv = convertQuoteToInvoice(quoteId);
      setActionSuccessMsg(`Quotation converted to Tax Invoice ${inv.invoiceNumber} successfully!`);
      onRefresh();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleConvertOrder = (orderId: string) => {
    try {
      const inv = convertSalesOrderToInvoice(orderId);
      setActionSuccessMsg(`Sales Order converted to Tax Invoice ${inv.invoiceNumber} successfully!`);
      onRefresh();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sales Cycle & Credit Notes</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quotations, Sales Orders, and GST Credit Notes with automated invoice conversion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setModalMode('order');
              setIsQuoteModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Sales Order</span>
          </button>

          <button
            onClick={() => {
              setModalMode('quote');
              setIsQuoteModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Quotation</span>
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-700 font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setSubTab('quotes')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition ${
            subTab === 'quotes'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Quotations ({db.quotes.length})</span>
        </button>

        <button
          onClick={() => setSubTab('orders')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition ${
            subTab === 'orders'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Sales Orders ({db.salesOrders.length})</span>
        </button>

        <button
          onClick={() => setSubTab('credit-notes')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition ${
            subTab === 'credit-notes'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Credit Notes ({db.creditNotes.length})</span>
        </button>
      </div>

      {/* 1. QUOTES */}
      {subTab === 'quotes' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            {db.quotes.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active quotations recorded.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3.5">Quote #</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Valid Until</th>
                    <th className="p-3.5 text-right">Subtotal (₹)</th>
                    <th className="p-3.5 text-right">Grand Total (₹)</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {db.quotes.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold font-mono text-blue-600">{q.quoteNumber}</td>
                      <td className="p-3.5 font-semibold text-slate-900">{q.customerName}</td>
                      <td className="p-3.5 text-slate-500">{new Date(q.date).toLocaleDateString('en-IN')}</td>
                      <td className="p-3.5 text-slate-500">
                        {q.expiryDate ? new Date(q.expiryDate).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-700">{formatINR(q.subtotal)}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">{formatINR(q.total)}</td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          {q.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {q.status !== 'ACCEPTED' ? (
                          <button
                            onClick={() => handleConvertQuote(q.id)}
                            className="flex items-center gap-1 ml-auto px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] transition"
                          >
                            <span>Convert to Invoice</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => q.convertedInvoiceId && onViewInvoice(q.convertedInvoiceId)}
                            className="text-[11px] text-emerald-600 hover:underline font-semibold"
                          >
                            View Invoice &rarr;
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 2. SALES ORDERS */}
      {subTab === 'orders' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            {db.salesOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active sales orders recorded.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3.5">Order #</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Order Date</th>
                    <th className="p-3.5 text-right">Subtotal (₹)</th>
                    <th className="p-3.5 text-right">Total (₹)</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {db.salesOrders.map((so) => (
                    <tr key={so.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold font-mono text-blue-600">{so.orderNumber}</td>
                      <td className="p-3.5 font-semibold text-slate-900">{so.customerName}</td>
                      <td className="p-3.5 text-slate-500">{new Date(so.date).toLocaleDateString('en-IN')}</td>
                      <td className="p-3.5 text-right font-mono text-slate-700">{formatINR(so.subtotal)}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">{formatINR(so.total)}</td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {so.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {so.status !== 'FULFILLED' ? (
                          <button
                            onClick={() => handleConvertOrder(so.id)}
                            className="flex items-center gap-1 ml-auto px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] transition"
                          >
                            <span>Convert to Invoice</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => so.convertedInvoiceId && onViewInvoice(so.convertedInvoiceId)}
                            className="text-[11px] text-emerald-600 hover:underline font-semibold"
                          >
                            View Invoice &rarr;
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 3. CREDIT NOTES */}
      {subTab === 'credit-notes' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Issued Credit Notes
            </h2>
            <span className="text-xs text-slate-400">
              Reverses customer receivables & reduces output tax liability
            </span>
          </div>

          <div className="overflow-x-auto">
            {db.creditNotes.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400">
                No credit notes issued. Credit notes can be issued against existing tax invoices for returns or discounts.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3.5">Credit Note #</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Original Invoice</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Reason</th>
                    <th className="p-3.5 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {db.creditNotes.map((cn) => (
                    <tr key={cn.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-mono font-bold text-rose-600">{cn.creditNoteNumber}</td>
                      <td className="p-3.5 font-semibold text-slate-900">{cn.customerName}</td>
                      <td className="p-3.5 font-mono text-blue-600 font-medium">
                        {cn.invoiceNumber || cn.invoiceId}
                      </td>
                      <td className="p-3.5 text-slate-500">{new Date(cn.date).toLocaleDateString('en-IN')}</td>
                      <td className="p-3.5 text-slate-700">{cn.reason}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-rose-600">
                        {formatINR(cn.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Quote / Sales Order Modal */}
      <QuoteModal
        isOpen={isQuoteModalOpen}
        mode={modalMode}
        onClose={() => setIsQuoteModalOpen(false)}
        onSuccess={() => {
          onRefresh();
          setActionSuccessMsg(
            modalMode === 'quote'
              ? 'New Quotation generated successfully!'
              : 'New Sales Order confirmed successfully!'
          );
        }}
      />
    </div>
  );
};
