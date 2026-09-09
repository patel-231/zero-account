import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { runAccountingTestSuite, TestResult } from '../../tests/accounting.test';

interface TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [testResults, setTestResults] = useState<{
    allPassed: boolean;
    passedCount: number;
    failedCount: number;
    results: TestResult[];
  } | null>(null);

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const outcome = runAccountingTestSuite();
      setTestResults(outcome);
      setIsRunning(false);
    }, 150);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                Accounting Engine Invariant Verification
              </h2>
              <p className="text-xs text-slate-500">
                Automated test suite verifying GST math, double-entry balance, and stock integrity.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Status summary banner */}
          {testResults && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                testResults.allPassed
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {testResults.allPassed ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                )}
                <div>
                  <div className="font-bold text-sm">
                    {testResults.allPassed
                      ? 'All Accounting Invariants PASSED'
                      : 'Some Invariants Failed'}
                  </div>
                  <div className="text-xs opacity-80 mt-0.5">
                    {testResults.passedCount} tests passed • {testResults.failedCount} failed
                  </div>
                </div>
              </div>

              <button
                onClick={runTests}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                <span>Re-run Suite</span>
              </button>
            </div>
          )}

          {/* Tests List */}
          <div className="space-y-2">
            {testResults?.results.map((res, idx) => {
              const isExpanded = expandedIndex === idx;

              return (
                <div
                  key={idx}
                  className={`border rounded-xl p-3 transition ${
                    res.passed
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-rose-50/40 border-rose-200'
                  }`}
                >
                  <div
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className="flex items-start justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-start gap-2.5">
                      {res.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>{res.title}</span>
                          <span className="text-[10px] font-normal px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                            {res.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">{res.message}</div>
                      </div>
                    </div>

                    {res.details && (
                      <button className="text-slate-400 hover:text-slate-600 p-1">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Expanded JSON details */}
                  {isExpanded && res.details && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <pre className="p-2 bg-slate-900 text-slate-100 rounded-lg text-[10px] font-mono overflow-x-auto">
                        {JSON.stringify(res.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 flex justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
