import React, { useState } from 'react';
import {
  ListTree,
  BookOpen,
  Layers,
  Scale,
  Plus,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react';
import { db } from '../../server/db';
import {
  getTrialBalance,
  getGeneralLedger,
  reverseJournalEntry,
} from '../../services/accountingService';
import { formatINR } from '../../utils/money';

interface AccountingViewProps {
  onOpenCreateJournal: () => void;
  defaultSubTab?: 'chart' | 'journals' | 'ledger' | 'trial';
}

export const AccountingView: React.FC<AccountingViewProps> = ({
  onOpenCreateJournal,
  defaultSubTab = 'chart',
}) => {
  const [activeTab, setActiveTab] = useState<'chart' | 'journals' | 'ledger' | 'trial'>(
    defaultSubTab
  );
  const [selectedLedgerAccountId, setSelectedLedgerAccountId] = useState<string>(
    db.accounts[0]?.id || ''
  );
  const [expandedJournalId, setExpandedJournalId] = useState<string | null>(null);

  const trialBalance = getTrialBalance();
  const selectedLedger = getGeneralLedger({ accountId: selectedLedgerAccountId });

  // Group accounts by account category
  const categorizedAccounts = {
    ASSET: db.accounts.filter((a) => a.type === 'ASSET'),
    LIABILITY: db.accounts.filter((a) => a.type === 'LIABILITY'),
    EQUITY: db.accounts.filter((a) => a.type === 'EQUITY'),
    INCOME: db.accounts.filter((a) => a.type === 'INCOME'),
    EXPENSE: db.accounts.filter((a) => a.type === 'EXPENSE'),
  };

  const handleReverseJournal = (journalId: string) => {
    const reason = prompt('Enter reason for journal entry reversal:');
    if (!reason) return;
    try {
      reverseJournalEntry(journalId, reason);
      alert('Journal entry reversed successfully.');
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Accounting Engine & Ledgers</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Double-entry General Ledger, Chart of Accounts, Journal Entries, and verified Trial Balance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              trialBalance.isBalanced
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Trial Balance: {trialBalance.isBalanced ? 'Balanced' : 'Imbalance'}</span>
          </div>

          <button
            onClick={onOpenCreateJournal}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Record Journal Entry</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('chart')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'chart'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListTree className="w-4 h-4" />
          <span>Chart of Accounts ({db.accounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('journals')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'journals'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Journal Entries ({db.journalEntries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'ledger'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>General Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('trial')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'trial'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Trial Balance</span>
        </button>
      </div>

      {/* 1. CHART OF ACCOUNTS */}
      {activeTab === 'chart' && (
        <div className="space-y-6">
          {Object.entries(categorizedAccounts).map(([category, accs]) => (
            <div key={category} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {category} ACCOUNTS
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {accs.length} Accounts
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-3 w-28">Code</th>
                      <th className="p-3">Account Name</th>
                      <th className="p-3">Type</th>
                      <th className="p-3 text-right">Debit Balance</th>
                      <th className="p-3 text-right">Credit Balance</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {accs.map((acc) => {
                      const tbItem = trialBalance.items.find((i) => i.code === acc.code);
                      const debit = tbItem?.debit || 0;
                      const credit = tbItem?.credit || 0;

                      return (
                        <tr key={acc.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-mono font-bold text-indigo-700">{acc.code}</td>
                          <td className="p-3 font-semibold text-slate-900">{acc.name}</td>
                          <td className="p-3 text-slate-500">{acc.type}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-800">
                            {debit > 0 ? formatINR(debit) : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-800">
                            {credit > 0 ? formatINR(credit) : '-'}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedLedgerAccountId(acc.id);
                                setActiveTab('ledger');
                              }}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                            >
                              Ledger &rarr;
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. JOURNAL ENTRIES */}
      {activeTab === 'journals' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Double-Entry Journal Register
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                Debit Total must strictly match Credit Total
              </span>
            </div>

            <div className="divide-y divide-slate-200">
              {db.journalEntries.map((je) => {
                const isExpanded = expandedJournalId === je.id;

                return (
                  <div key={je.id} className="p-4 hover:bg-slate-50/50 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-600 text-xs">
                            {je.entryNumber}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">
                            {new Date(je.date).toLocaleDateString('en-IN')}
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                              je.status === 'POSTED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {je.status}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-slate-800">{je.description}</div>
                        {je.referenceDisplay && (
                          <div className="text-[10px] font-mono text-slate-500">
                            Ref: {je.referenceDisplay}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right text-xs">
                          <div className="font-mono font-bold text-slate-900">
                            {formatINR(je.totalDebit)}
                          </div>
                          <div className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Balanced
                          </div>
                        </div>

                        <button
                          onClick={() => setExpandedJournalId(isExpanded ? null : je.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Drill-down Lines */}
                    {isExpanded && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <table className="w-full text-left text-xs bg-slate-50 rounded-lg overflow-hidden">
                          <thead className="text-slate-500 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="p-2.5">Account</th>
                              <th className="p-2.5">Description</th>
                              <th className="p-2.5 text-right">Debit</th>
                              <th className="p-2.5 text-right">Credit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/60">
                            {je.lines.map((line, idx) => (
                              <tr key={idx}>
                                <td className="p-2.5 font-bold text-slate-800">
                                  {line.accountCode} - {line.accountName}
                                </td>
                                <td className="p-2.5 text-slate-500">{line.description || '-'}</td>
                                <td className="p-2.5 text-right font-mono font-bold text-indigo-700">
                                  {line.debit > 0 ? formatINR(line.debit) : '-'}
                                </td>
                                <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                                  {line.credit > 0 ? formatINR(line.credit) : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. GENERAL LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Account selector toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="text-xs font-bold text-slate-700 uppercase">Select Account:</label>
              <select
                value={selectedLedgerAccountId}
                onChange={(e) => setSelectedLedgerAccountId(e.target.value)}
                className="text-xs font-semibold p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
              >
                {db.accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Closing Balance: </span>
                <strong className="font-mono text-indigo-700">{formatINR(selectedLedger.closingBalance)}</strong>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {selectedLedger.account.code} - {selectedLedger.account.name}
                </h2>
                <div className="text-xs text-slate-500">{selectedLedger.account.type}</div>
              </div>
              <div className="text-xs text-slate-600 font-mono">
                Opening Balance: {formatINR(selectedLedger.openingBalance)}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Entry #</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Debit (₹)</th>
                    <th className="p-3 text-right">Credit (₹)</th>
                    <th className="p-3 text-right">Running Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedLedger.entries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No transactions recorded in this ledger account yet.
                      </td>
                    </tr>
                  ) : (
                    selectedLedger.entries.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-3 text-slate-500">
                          {new Date(entry.date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="p-3 font-mono font-bold text-indigo-600">
                          {entry.entryNumber}
                        </td>
                        <td className="p-3 text-slate-800">{entry.description}</td>
                        <td className="p-3 text-right font-mono font-medium text-slate-900">
                          {entry.debit > 0 ? formatINR(entry.debit) : '-'}
                        </td>
                        <td className="p-3 text-right font-mono font-medium text-slate-900">
                          {entry.credit > 0 ? formatINR(entry.credit) : '-'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-indigo-700">
                          {formatINR(entry.runningBalance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. TRIAL BALANCE */}
      {activeTab === 'trial' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Trial Balance Sheet</h2>
                <div className="text-xs text-slate-500">
                  As of {new Date().toLocaleDateString('en-IN')} • Summary of all account balances
                </div>
              </div>

              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${
                  trialBalance.isBalanced
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {trialBalance.isBalanced
                    ? 'Balanced: Total Debits == Total Credits'
                    : `Imbalance: ${formatINR(trialBalance.imbalance)}`}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3.5 w-28">Code</th>
                    <th className="p-3.5">Account Title</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5 text-right w-40">Debit Balance (₹)</th>
                    <th className="p-3.5 text-right w-40">Credit Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trialBalance.items.map((it) => (
                    <tr key={it.accountId} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-mono font-bold text-indigo-700">{it.code}</td>
                      <td className="p-3.5 font-semibold text-slate-900">{it.name}</td>
                      <td className="p-3.5 text-slate-500">{it.type}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                        {it.debit > 0 ? formatINR(it.debit) : '-'}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                        {it.credit > 0 ? formatINR(it.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                  <tr>
                    <td colSpan={3} className="p-3.5 text-right uppercase tracking-wider text-xs">
                      Grand Total:
                    </td>
                    <td className="p-3.5 text-right font-mono text-sm text-indigo-800">
                      {formatINR(trialBalance.totalDebit)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-sm text-indigo-800">
                      {formatINR(trialBalance.totalCredit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
