import React, { useState, useEffect } from 'react';
import {
  Search,
  FileText,
  Users,
  Package,
  CreditCard,
  BookOpen,
  Scale,
  TrendingUp,
  X,
  ArrowRight,
} from 'lucide-react';
import { db } from '../server/db';
import { formatINR } from '../utils/money';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: any) => void;
  onViewInvoice: (invoiceId: string) => void;
  onOpenQuickCreate: (type: any) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onViewInvoice,
  onOpenQuickCreate,
}) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const q = query.toLowerCase();

  const matchingInvoices = db.invoices
    .filter((i) => i.invoiceNumber.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q))
    .slice(0, 4);

  const matchingCustomers = db.customers
    .filter(
      (c) =>
        c.customerName.toLowerCase().includes(q) ||
        (c.companyName && c.companyName.toLowerCase().includes(q)) ||
        (c.gstin && c.gstin.toLowerCase().includes(q))
    )
    .slice(0, 4);

  const matchingProducts = db.products
    .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    .slice(0, 4);

  const actions = [
    { title: 'Create Tax Invoice', tab: 'invoices', icon: FileText, action: () => onOpenQuickCreate('invoice') },
    { title: 'Receive Customer Payment', tab: 'payments', icon: CreditCard, action: () => onOpenQuickCreate('payment') },
    { title: 'View Trial Balance', tab: 'trial-balance', icon: Scale, action: () => onNavigate('trial-balance') },
    { title: 'Profit & Loss Statement', tab: 'profit-loss', icon: TrendingUp, action: () => onNavigate('profit-loss') },
    { title: 'Balance Sheet', tab: 'balance-sheet', icon: BookOpen, action: () => onNavigate('balance-sheet') },
  ].filter((a) => a.title.toLowerCase().includes(q));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Search input */}
        <div className="p-3.5 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 ml-1" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, customer, invoice #, or product..."
            className="flex-1 text-sm bg-transparent border-none outline-none text-slate-800 placeholder-slate-400"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-slate-100 border border-slate-200 rounded text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3 text-xs">
          {/* Actions */}
          {actions.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1">
                Navigation & Actions
              </div>
              <div className="space-y-0.5">
                {actions.map((act, idx) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        act.action();
                        onClose();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold">{act.title}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Invoices */}
          {matchingInvoices.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1">
                Invoices
              </div>
              <div className="space-y-0.5">
                {matchingInvoices.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => {
                      onViewInvoice(inv.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition text-left"
                  >
                    <div>
                      <span className="font-mono font-bold text-blue-600 mr-2">{inv.invoiceNumber}</span>
                      <span className="text-slate-800">{inv.customerName}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">{formatINR(inv.total)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {matchingCustomers.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1">
                Customers
              </div>
              <div className="space-y-0.5">
                {matchingCustomers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onNavigate('customers');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition text-left"
                  >
                    <div>
                      <span className="font-bold text-slate-900 mr-2">{c.customerName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">({c.state})</span>
                    </div>
                    <span className="text-slate-400 text-[11px]">{c.customerCode}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {matchingProducts.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1">
                Products
              </div>
              <div className="space-y-0.5">
                {matchingProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onNavigate('products');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition text-left"
                  >
                    <div>
                      <span className="font-bold text-slate-900 mr-2">{p.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">[{p.sku}]</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">{formatINR(p.sellingPrice)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
