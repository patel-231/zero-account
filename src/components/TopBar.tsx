import React, { useState } from 'react';
import {
  Search,
  PlusCircle,
  ShieldCheck,
  RotateCcw,
  Building2,
  FileText,
  UserPlus,
  Package,
  CreditCard,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { db } from '../server/db';
import { formatINR } from '../utils/money';

interface TopBarProps {
  onOpenSearch: () => void;
  onOpenQuickCreate: (type: 'invoice' | 'customer' | 'product' | 'payment' | 'journal') => void;
  onOpenTestRunner: () => void;
  onResetSeed: () => void;
  testPassedStatus?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenSearch,
  onOpenQuickCreate,
  onOpenTestRunner,
  onResetSeed,
  testPassedStatus = true,
}) => {
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showOrgMenu, setShowOrgMenu] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Organization Switcher & Search Bar */}
      <div className="flex items-center gap-3 md:gap-4 flex-1 max-w-2xl">
        <div className="relative">
          <button
            onClick={() => setShowOrgMenu(!showOrgMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-left"
          >
            <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              ZD
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-slate-800 leading-none">{db.organization.name}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                GSTIN: {db.organization.gstin?.substring(0, 8)}... ({db.organization.stateCode})
              </div>
            </div>
          </button>

          {showOrgMenu && (
            <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-30">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Active Organization
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 mb-2">
                <div className="font-bold text-sm text-blue-950">{db.organization.legalName}</div>
                <div className="text-xs text-blue-800 mt-0.5">{db.organization.address}</div>
                <div className="text-xs text-blue-700 font-mono mt-1 font-semibold">
                  GSTIN: {db.organization.gstin}
                </div>
                <div className="text-[11px] text-blue-600 mt-0.5">
                  State: {db.organization.state} (Code: {db.organization.stateCode})
                </div>
              </div>
              <div className="text-xs text-slate-500 px-1 pt-1 flex items-center justify-between">
                <span>FY: {db.organization.financialYear}</span>
                <span className="font-mono text-emerald-600 font-bold">Standard GST Regular</span>
              </div>
            </div>
          )}
        </div>

        {/* Global Search button (Ctrl+K) */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 w-full max-w-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition text-sm text-left"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span className="flex-1 text-xs">Search invoices, customers, products...</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-300 rounded text-slate-500">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Create, Automated Test Status & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Accounting Integrity Test Badge */}
        <button
          onClick={onOpenTestRunner}
          title="Run automated double-entry and GST accounting verification"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">Accounting Invariants</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </button>

        {/* Reset Seed Demo Data button */}
        <button
          onClick={onResetSeed}
          title="Reset database to clean seed demo state"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 text-xs transition"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden lg:inline">Reset Seed</span>
        </button>

        {/* Quick Create Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium text-xs shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Quick Create</span>
          </button>

          {showQuickMenu && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-30"
              onClick={() => setShowQuickMenu(false)}
            >
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Fast Actions
              </div>
              <button
                onClick={() => onOpenQuickCreate('invoice')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-left transition"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                New Tax Invoice
              </button>
              <button
                onClick={() => onOpenQuickCreate('payment')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-left transition"
              >
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Receive Customer Payment
              </button>
              <button
                onClick={() => onOpenQuickCreate('customer')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-left transition"
              >
                <UserPlus className="w-4 h-4 text-violet-600" />
                New Customer
              </button>
              <button
                onClick={() => onOpenQuickCreate('product')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-left transition"
              >
                <Package className="w-4 h-4 text-amber-600" />
                New Product / Service
              </button>
              <button
                onClick={() => onOpenQuickCreate('journal')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-left transition"
              >
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Manual Journal Entry
              </button>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            OP
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-none">{db.currentUser.name}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">
              {db.currentUser.role}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
