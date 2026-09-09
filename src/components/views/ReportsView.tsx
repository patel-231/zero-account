import React, { useState } from 'react';
import {
  TrendingUp,
  PieChart,
  FileBarChart,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  getProfitAndLoss,
  getBalanceSheet,
} from '../../services/accountingService';
import { getCustomerOutstanding } from '../../services/reportService';
import { formatINR } from '../../utils/money';

interface ReportsViewProps {
  defaultReport?: 'pnl' | 'balance-sheet' | 'receivables';
  onViewInvoice?: (id: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  defaultReport = 'pnl',
}) => {
  const [activeReport, setActiveReport] = useState<'pnl' | 'balance-sheet' | 'receivables'>(
    defaultReport
  );

  const pnl = getProfitAndLoss();
  const bs = getBalanceSheet();
  const receivables = getCustomerOutstanding();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Financial Statements & Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-ready Profit & Loss, Balance Sheet, and Customer Outstanding statements.
          </p>
        </div>

        {/* Report Selector Pill */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveReport('pnl')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeReport === 'pnl' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Profit & Loss
          </button>
          <button
            onClick={() => setActiveReport('balance-sheet')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeReport === 'balance-sheet' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Balance Sheet
          </button>
          <button
            onClick={() => setActiveReport('receivables')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeReport === 'receivables' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customer Receivables
          </button>
        </div>
      </div>

      {/* REPORT 1: PROFIT & LOSS */}
      {activeReport === 'pnl' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs max-w-4xl mx-auto overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                Financial Statement
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">Profit & Loss Statement (Income Statement)</h2>
              <p className="text-xs text-slate-500">For the period ending {new Date().toLocaleDateString('en-IN')}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Net Profit</span>
              <span className={`text-xl font-black font-mono ${pnl.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatINR(pnl.netProfit)}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6 text-xs">
            {/* Revenue section */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                1. Operating Revenue
              </div>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between text-slate-700">
                  <span>Sales Revenue (Domestic & Interstate)</span>
                  <span className="font-mono font-medium">{formatINR(pnl.revenue.salesRevenue)}</span>
                </div>
                {pnl.revenue.serviceRevenue > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Service Revenue</span>
                    <span className="font-mono font-medium">{formatINR(pnl.revenue.serviceRevenue)}</span>
                  </div>
                )}
                {pnl.revenue.otherIncome > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Other Operating Income</span>
                    <span className="font-mono font-medium">{formatINR(pnl.revenue.otherIncome)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                  <span>Total Revenue:</span>
                  <span className="font-mono text-emerald-700">{formatINR(pnl.revenue.totalRevenue)}</span>
                </div>
              </div>
            </div>

            {/* COGS section */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                2. Cost of Goods Sold (COGS)
              </div>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between text-slate-700">
                  <span>Purchases & Material Costs</span>
                  <span className="font-mono font-medium">{formatINR(pnl.costOfGoodsSold.purchases)}</span>
                </div>
                {pnl.costOfGoodsSold.directExpenses > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Direct Production Expenses</span>
                    <span className="font-mono font-medium">{formatINR(pnl.costOfGoodsSold.directExpenses)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                  <span>Total Cost of Sales:</span>
                  <span className="font-mono text-rose-700">{formatINR(pnl.costOfGoodsSold.totalCOGS)}</span>
                </div>
              </div>
            </div>

            {/* Gross Profit bar */}
            <div className="p-3.5 rounded-xl bg-slate-100 flex justify-between items-center font-bold text-slate-900">
              <span className="text-sm">Gross Profit (Revenue - COGS):</span>
              <span className="font-mono text-base text-blue-800">{formatINR(pnl.grossProfit)}</span>
            </div>

            {/* Operating Expenses */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                3. Operating Expenses
              </div>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between text-slate-700">
                  <span>Office Rent</span>
                  <span className="font-mono">{formatINR(pnl.operatingExpenses.rent)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Staff Salaries</span>
                  <span className="font-mono">{formatINR(pnl.operatingExpenses.salary)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Utilities & Internet</span>
                  <span className="font-mono">{formatINR(pnl.operatingExpenses.utilities)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Office & Administrative Expenses</span>
                  <span className="font-mono">{formatINR(pnl.operatingExpenses.officeExpenses)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                  <span>Total Operating Expenses:</span>
                  <span className="font-mono text-rose-700">{formatINR(pnl.operatingExpenses.totalOperatingExpenses)}</span>
                </div>
              </div>
            </div>

            {/* Net Profit Summary */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex justify-between items-center font-black text-slate-900">
              <div>
                <span className="text-sm text-emerald-950">Net Profit for the Period:</span>
                <div className="text-[11px] text-emerald-700 font-normal mt-0.5">
                  Gross Profit minus All Operating Expenses
                </div>
              </div>
              <span className="font-mono text-xl text-emerald-700">{formatINR(pnl.netProfit)}</span>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: BALANCE SHEET */}
      {activeReport === 'balance-sheet' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs max-w-4xl mx-auto overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                Financial Statement
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">Balance Sheet (Statement of Financial Position)</h2>
              <p className="text-xs text-slate-500">As of {new Date().toLocaleDateString('en-IN')}</p>
            </div>

            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${
                bs.isBalanced
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{bs.isBalanced ? 'Balanced: Assets = Liabilities + Equity' : 'Imbalance Detected'}</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8 text-xs">
            {/* ASSETS SECTION */}
            <div className="space-y-3">
              <div className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-1 border-b-2 border-slate-800 flex justify-between">
                <span>Assets</span>
                <span className="font-mono text-blue-700">{formatINR(bs.assets.totalAssets)}</span>
              </div>

              {/* Current Assets */}
              <div className="pl-4 space-y-2">
                <div className="font-semibold text-slate-600 uppercase text-[11px]">Current Assets</div>
                <div className="flex justify-between text-slate-700 pl-4">
                  <span>Cash on Hand</span>
                  <span className="font-mono">{formatINR(bs.assets.currentAssets.cash)}</span>
                </div>
                <div className="flex justify-between text-slate-700 pl-4">
                  <span>Bank Accounts (Liquid Funds)</span>
                  <span className="font-mono font-medium">{formatINR(bs.assets.currentAssets.bank)}</span>
                </div>
                <div className="flex justify-between text-slate-700 pl-4">
                  <span>Accounts Receivable (Customer Outstandings)</span>
                  <span className="font-mono font-medium">{formatINR(bs.assets.currentAssets.accountsReceivable)}</span>
                </div>
                <div className="flex justify-between text-slate-700 pl-4">
                  <span>Inventory Valuation (Warehouse Stock)</span>
                  <span className="font-mono font-medium">{formatINR(bs.assets.currentAssets.inventory)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100 pl-2">
                  <span>Total Current Assets:</span>
                  <span className="font-mono text-blue-700">{formatINR(bs.assets.currentAssets.totalCurrentAssets)}</span>
                </div>
              </div>

              {/* Fixed Assets */}
              {bs.assets.fixedAssets > 0 && (
                <div className="pl-4 space-y-2 pt-2 border-t border-slate-100">
                  <div className="font-semibold text-slate-600 uppercase text-[11px]">Non-Current / Fixed Assets</div>
                  <div className="flex justify-between text-slate-700 pl-4">
                    <span>Office Equipment & Machinery</span>
                    <span className="font-mono">{formatINR(bs.assets.fixedAssets)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* LIABILITIES SECTION */}
            <div className="space-y-3">
              <div className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-1 border-b-2 border-slate-800 flex justify-between">
                <span>Liabilities</span>
                <span className="font-mono text-slate-800">{formatINR(bs.liabilities.totalLiabilities)}</span>
              </div>

              {/* Current Liabilities */}
              <div className="pl-4 space-y-2">
                <div className="font-semibold text-slate-600 uppercase text-[11px]">Current Liabilities & GST</div>
                <div className="flex justify-between text-slate-700 pl-4">
                  <span>Accounts Payable (Vendors)</span>
                  <span className="font-mono">{formatINR(bs.liabilities.currentLiabilities.accountsPayable)}</span>
                </div>
                <div className="flex justify-between text-slate-700 pl-4">
                  <span>GST Payable (Net Output Tax)</span>
                  <span className="font-mono font-medium">{formatINR(bs.liabilities.currentLiabilities.gstPayable)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100 pl-2">
                  <span>Total Current Liabilities:</span>
                  <span className="font-mono text-slate-800">{formatINR(bs.liabilities.currentLiabilities.totalCurrentLiabilities)}</span>
                </div>
              </div>

              {/* Long Term */}
              {bs.liabilities.longTermLoans > 0 && (
                <div className="pl-4 space-y-2 pt-2 border-t border-slate-100">
                  <div className="font-semibold text-slate-600 uppercase text-[11px]">Long-Term Liabilities</div>
                  <div className="flex justify-between text-slate-700 pl-4">
                    <span>Bank Term Loans</span>
                    <span className="font-mono">{formatINR(bs.liabilities.longTermLoans)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* EQUITY SECTION */}
            <div className="space-y-3">
              <div className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-1 border-b-2 border-slate-800 flex justify-between">
                <span>Owner's Equity</span>
                <span className="font-mono text-slate-800">{formatINR(bs.equity.totalEquity)}</span>
              </div>

              <div className="pl-4 space-y-2">
                <div className="flex justify-between text-slate-700 pl-4">
                  <span>Founder Capital Contribution</span>
                  <span className="font-mono">{formatINR(bs.equity.ownerCapital)}</span>
                </div>
                <div className="flex justify-between text-slate-700 pl-4">
                  <span>Retained Earnings</span>
                  <span className="font-mono">{formatINR(bs.equity.retainedEarnings)}</span>
                </div>
                <div className="flex justify-between text-slate-700 pl-4">
                  <span>Current Period Profit / (Loss)</span>
                  <span className="font-mono font-bold text-emerald-600">{formatINR(bs.equity.currentProfit)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100 pl-2">
                  <span>Total Equity:</span>
                  <span className="font-mono text-slate-800">{formatINR(bs.equity.totalEquity)}</span>
                </div>
              </div>
            </div>

            {/* VERIFICATION SUMMARY FOOTER */}
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Accounting Equation Integrity: Assets = Liabilities + Equity
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Assets: {formatINR(bs.assets.totalAssets)} vs Liab + Equity: {formatINR(bs.totalLiabilitiesAndEquity)}
                </div>
              </div>

              <div className="font-mono font-bold text-sm text-blue-900">
                Difference: {formatINR(bs.difference)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: CUSTOMER RECEIVABLES AGING */}
      {activeReport === 'receivables' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                Accounts Receivable
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">Customer Outstanding & Aging Summary</h2>
              <p className="text-xs text-slate-500">Live reconciliation against posted invoices and payments</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3.5">Customer Name</th>
                  <th className="p-3.5 text-right">Total Invoiced (₹)</th>
                  <th className="p-3.5 text-right">Total Paid (₹)</th>
                  <th className="p-3.5 text-right">Outstanding Balance (₹)</th>
                  <th className="p-3.5 text-right">Overdue Amount (₹)</th>
                  <th className="p-3.5 text-center">Unpaid Invoices</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receivables.map((r) => (
                  <tr key={r.customerId} className="hover:bg-slate-50 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{r.customerName}</div>
                      {r.companyName && <div className="text-[11px] text-slate-500">{r.companyName}</div>}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-700">{formatINR(r.totalBilled)}</td>
                    <td className="p-3.5 text-right font-mono text-emerald-600">{formatINR(r.totalPaid)}</td>
                    <td className="p-3.5 text-right font-mono font-bold">
                      <span className={r.outstanding > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                        {formatINR(r.outstanding)}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-semibold text-amber-700">
                      {r.overdue > 0 ? formatINR(r.overdue) : '-'}
                    </td>
                    <td className="p-3.5 text-center font-medium text-slate-700">
                      {r.invoiceCount} invoices
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
