import React from 'react';
import {
  TrendingUp,
  CreditCard,
  Building2,
  AlertTriangle,
  FileText,
  Users,
  Package,
  PlusCircle,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { getDashboardMetrics } from '../../services/reportService';
import { getLowStockProducts } from '../../services/inventoryService';
import { getTrialBalance } from '../../services/accountingService';
import { db } from '../../server/db';
import { formatINR } from '../../utils/money';

interface DashboardViewProps {
  onNavigate: (tab: any) => void;
  onOpenQuickCreate: (type: 'invoice' | 'customer' | 'product' | 'payment' | 'journal') => void;
  onViewInvoice: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenQuickCreate,
  onViewInvoice,
}) => {
  const metrics = getDashboardMetrics();
  const lowStockProducts = getLowStockProducts();
  const trialBalance = getTrialBalance();

  const recentInvoices = db.invoices.slice(0, 5);
  const recentPayments = db.payments.slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Accounting Engine Status & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Executive Financial Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time financial status for <span className="font-semibold text-slate-700">{db.organization.name}</span> — Double-Entry Bookkeeping & GST Enabled.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
            trialBalance.isBalanced
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            <ShieldCheck className="w-4 h-4" />
            <span>Trial Balance: {trialBalance.isBalanced ? 'Balanced (Debits = Credits)' : 'Imbalance Detected'}</span>
          </div>

          <button
            onClick={() => onOpenQuickCreate('invoice')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            New Tax Invoice
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner if any items are low */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900">
                Inventory Reorder Alert: {lowStockProducts.length} Product(s) Below Minimum Stock Level
              </div>
              <div className="text-[11px] text-amber-700 mt-0.5">
                {lowStockProducts.map((p) => `${p.name} (${p.currentStock}/${p.minimumStock} ${p.unit})`).join(', ')}
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('stock-movements')}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shrink-0 transition"
          >
            View Stock
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sales (Billed)</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2">{formatINR(metrics.totalSales)}</div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Posted Invoices: {metrics.invoiceCount}</span>
            <span className="text-emerald-600 font-semibold flex items-center">
              Active <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Receivables Outstanding */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Accounts Receivable</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold text-indigo-900 mt-2">{formatINR(metrics.receivables)}</div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Customer Pending</span>
            <button
              onClick={() => onNavigate('customer-outstanding')}
              className="text-indigo-600 font-semibold hover:underline"
            >
              View Aging &rarr;
            </button>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Profit (P&L)</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-xl font-bold mt-2 ${metrics.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {formatINR(metrics.netProfit)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Gross: {formatINR(metrics.grossProfit)}</span>
            <button onClick={() => onNavigate('profit-loss')} className="text-emerald-600 font-semibold hover:underline">
              P&L Report &rarr;
            </button>
          </div>
        </div>

        {/* Bank & Cash Balances */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Liquid Funds</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2">{formatINR(metrics.bankBalance + metrics.cashBalance)}</div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Bank: {formatINR(metrics.bankBalance)}</span>
            <span>Cash: {formatINR(metrics.cashBalance)}</span>
          </div>
        </div>
      </div>

      {/* Secondary Row: GST & Expense summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase">GST Output Liability</div>
          <div className="text-lg font-bold text-slate-900 mt-1">{formatINR(metrics.gstPayable)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Calculated from Output CGST, SGST, IGST ledger balances</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase">Operating Expenses</div>
          <div className="text-lg font-bold text-slate-900 mt-1">{formatINR(metrics.totalExpenses)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Rent, salaries, electricity, marketing & utilities</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase">Active Master Records</div>
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-800 mt-2">
            <span>{metrics.customerCount} Customers</span>
            <span>•</span>
            <span>{metrics.productCount} Products</span>
            <span>•</span>
            <span>{db.accounts.length} Accounts</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Single source of truth in PostgreSQL schema</div>
        </div>
      </div>

      {/* Tables Row: Recent Invoices & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800">Recent Tax Invoices</h2>
            </div>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              View All ({db.invoices.length}) &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            {recentInvoices.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No invoices created yet. Click "New Tax Invoice" above.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-3">Invoice</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => onViewInvoice(inv.id)}
                      className="hover:bg-slate-50 cursor-pointer transition"
                    >
                      <td className="p-3 font-semibold text-blue-600">{inv.invoiceNumber}</td>
                      <td className="p-3 text-slate-800">{inv.customerName}</td>
                      <td className="p-3 text-right font-bold text-slate-900">{formatINR(inv.total)}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'PARTIALLY_PAID'
                              ? 'bg-amber-100 text-amber-800'
                              : inv.status === 'SENT'
                              ? 'bg-blue-100 text-blue-800'
                              : inv.status === 'DRAFT'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Payments Received */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-800">Recent Payments Received</h2>
            </div>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              View All ({db.payments.length}) &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            {recentPayments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No customer payments recorded yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Method / Ref</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentPayments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-semibold text-slate-800">{pay.customerName}</td>
                      <td className="p-3 text-slate-500">
                        <span className="font-medium text-slate-700">{pay.paymentMethod}</span>
                        {pay.reference && <div className="text-[10px] font-mono text-slate-400">{pay.reference}</div>}
                      </td>
                      <td className="p-3 text-slate-500">{new Date(pay.paymentDate).toLocaleDateString('en-IN')}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">{formatINR(pay.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
