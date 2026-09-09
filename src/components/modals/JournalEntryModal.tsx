import React, { useState } from 'react';
import { X, BookOpen, Plus, Trash2, CheckCircle2, AlertCircle, Scale } from 'lucide-react';
import { db } from '../../server/db';
import { createJournalEntry } from '../../services/accountingService';
import { formatINR } from '../../utils/money';

interface JournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (journalId: string) => void;
}

interface LineInput {
  accountId: string;
  debit: number;
  credit: number;
  description: string;
}

export const JournalEntryModal: React.FC<JournalEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState<string>('MANUAL-' + Date.now().toString().slice(-4));
  const [narration, setNarration] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [lines, setLines] = useState<LineInput[]>([
    { accountId: 'acc-1010', debit: 1000, credit: 0, description: '' },
    { accountId: 'acc-4000', debit: 0, credit: 1000, description: '' },
  ]);

  const handleAddLine = () => {
    setLines([
      ...lines,
      { accountId: db.accounts[0]?.id || '', debit: 0, credit: 0, description: '' },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: keyof LineInput, val: any) => {
    const newLines = [...lines];
    newLines[idx] = { ...newLines[idx], [field]: val };
    setLines(newLines);
  };

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const difference = Number(Math.abs(totalDebit - totalCredit).toFixed(2));
  const isBalanced = totalDebit > 0 && totalCredit > 0 && difference === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!narration.trim()) throw new Error('Please enter a narration for this journal entry.');
      if (!isBalanced) throw new Error('Journal is unbalanced. Double-entry requires Debit == Credit.');

      const cleanLines = lines.map((l) => ({
        accountId: l.accountId,
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
        description: l.description || narration,
      }));

      const entry = createJournalEntry({
        date: new Date(entryDate).toISOString(),
        referenceType: 'MANUAL',
        referenceDisplay: reference,
        description: narration,
        lines: cleanLines,
        status: 'POSTED',
      });

      onSuccess(entry.id);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-6 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Record Manual Journal Entry</h2>
              <p className="text-xs text-slate-500">Double-entry General Ledger transaction</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Date & Ref */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Entry Date</label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / Doc #</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Narration */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Narration (Description) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder="e.g. Office rent paid for the month via HDFC Bank"
              className="w-full text-xs p-2 border border-slate-300 rounded-lg"
              required
            />
          </div>

          {/* Lines Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Debit & Credit Allocation
              </span>
              <button
                type="button"
                onClick={handleAddLine}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Line
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-2.5">Account</th>
                    <th className="p-2.5 w-32 text-right">Debit (₹)</th>
                    <th className="p-2.5 w-32 text-right">Credit (₹)</th>
                    <th className="p-2.5">Line Description</th>
                    <th className="p-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((line, idx) => (
                    <tr key={idx}>
                      {/* Account select */}
                      <td className="p-2">
                        <select
                          value={line.accountId}
                          onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-300 rounded-md font-medium bg-white"
                        >
                          {db.accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.code} - {acc.name} ({acc.type})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Debit */}
                      <td className="p-2">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={line.debit || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            handleLineChange(idx, 'debit', val);
                            if (val > 0) handleLineChange(idx, 'credit', 0);
                          }}
                          placeholder="0.00"
                          className="w-full text-xs p-1.5 border border-slate-300 rounded-md text-right font-mono font-medium"
                        />
                      </td>

                      {/* Credit */}
                      <td className="p-2">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={line.credit || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            handleLineChange(idx, 'credit', val);
                            if (val > 0) handleLineChange(idx, 'debit', 0);
                          }}
                          placeholder="0.00"
                          className="w-full text-xs p-1.5 border border-slate-300 rounded-md text-right font-mono font-medium"
                        />
                      </td>

                      {/* Line note */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={line.description}
                          onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                          placeholder="Optional memo"
                          className="w-full text-xs p-1.5 border border-slate-200 rounded-md text-slate-600"
                        />
                      </td>

                      {/* Delete */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          disabled={lines.length <= 2}
                          className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Balanced / Imbalance Bar */}
          <div className="p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-slate-500" />
              <span>
                Total Debit: <strong className="font-mono">{formatINR(totalDebit)}</strong> | Total
                Credit: <strong className="font-mono">{formatINR(totalCredit)}</strong>
              </span>
            </div>

            <div>
              {isBalanced ? (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Balanced (Debit == Credit)
                </span>
              ) : (
                <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full font-bold">
                  Difference: {formatINR(difference)}
                </span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isBalanced}
              className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Post Journal to Ledger
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
