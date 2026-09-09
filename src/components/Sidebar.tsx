import React from 'react';
import {
  LayoutDashboard,
  FileText,
  FileSpreadsheet,
  ShoppingCart,
  CreditCard,
  RotateCcw,
  Package,
  Layers,
  Warehouse,
  Users,
  Building,
  BookOpen,
  ListTree,
  Scale,
  TrendingUp,
  PieChart,
  FileBarChart,
  Settings,
  History,
  Coins,
  ChevronRight,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'invoices'
  | 'quotes'
  | 'orders'
  | 'payments'
  | 'credit-notes'
  | 'products'
  | 'stock-movements'
  | 'warehouses'
  | 'customers'
  | 'vendors'
  | 'chart-of-accounts'
  | 'journal-entries'
  | 'general-ledger'
  | 'trial-balance'
  | 'profit-loss'
  | 'balance-sheet'
  | 'customer-outstanding'
  | 'audit-logs'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
}) => {
  const navSections = [
    {
      title: 'CORE',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'SALES & REVENUE',
      items: [
        { id: 'invoices', label: 'Tax Invoices', icon: FileText },
        { id: 'quotes', label: 'Quotations', icon: FileSpreadsheet },
        { id: 'orders', label: 'Sales Orders', icon: ShoppingCart },
        { id: 'payments', label: 'Customer Payments', icon: CreditCard },
        { id: 'credit-notes', label: 'Credit Notes', icon: RotateCcw },
      ],
    },
    {
      title: 'INVENTORY & ASSETS',
      items: [
        { id: 'products', label: 'Products & Services', icon: Package },
        { id: 'stock-movements', label: 'Stock Movements', icon: Layers },
        { id: 'warehouses', label: 'Warehouses', icon: Warehouse },
      ],
    },
    {
      title: 'RELATIONSHIPS',
      items: [
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'vendors', label: 'Vendors', icon: Building },
      ],
    },
    {
      title: 'ACCOUNTING ENGINE',
      items: [
        { id: 'chart-of-accounts', label: 'Chart of Accounts', icon: ListTree },
        { id: 'journal-entries', label: 'Journal Entries', icon: BookOpen },
        { id: 'general-ledger', label: 'General Ledger', icon: Layers },
        { id: 'trial-balance', label: 'Trial Balance', icon: Scale },
      ],
    },
    {
      title: 'FINANCIAL REPORTS',
      items: [
        { id: 'profit-loss', label: 'Profit & Loss', icon: TrendingUp },
        { id: 'balance-sheet', label: 'Balance Sheet', icon: PieChart },
        { id: 'customer-outstanding', label: 'Customer Receivables', icon: FileBarChart },
      ],
    },
    {
      title: 'SYSTEM & AUDIT',
      items: [
        { id: 'audit-logs', label: 'Audit Trail', icon: History },
        { id: 'settings', label: 'Settings & GST', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden backdrop-blur-xs"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 h-full w-64 bg-slate-900 text-slate-300 z-40 flex flex-col transition-transform duration-200 ease-in-out border-r border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo Banner */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-base shadow-sm">
              ₹
            </div>
            <div>
              <div className="text-white font-extrabold tracking-tight text-base leading-none">
                ZERO<span className="text-blue-400">BOOKS</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5 uppercase">
                Indian ERP & Accounting
              </div>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 text-xs">
          {navSections.map((section) => (
            <div key={section.title}>
              <div className="px-3 text-[10px] font-bold text-slate-500 tracking-wider mb-1.5 uppercase">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as ActiveTab);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom GST / Status tag */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Double-Entry Engine</span>
          </div>
          <span className="font-mono text-slate-400">v2.4 GST</span>
        </div>
      </aside>
    </>
  );
};
