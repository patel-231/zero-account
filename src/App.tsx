import React, { useState, useEffect } from 'react';
import { db } from './server/db';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardView } from './components/views/DashboardView';
import { InvoicesView } from './components/views/InvoicesView';
import { PaymentsView } from './components/views/PaymentsView';
import { CustomersView } from './components/views/CustomersView';
import { ProductsInventoryView } from './components/views/ProductsInventoryView';
import { AccountingView } from './components/views/AccountingView';
import { ReportsView } from './components/views/ReportsView';
import { QuotesOrdersView } from './components/views/QuotesOrdersView';
import { VendorsView } from './components/views/VendorsView';
import { SettingsView } from './components/views/SettingsView';

// Modals
import { InvoiceCreateModal } from './components/modals/InvoiceCreateModal';
import { InvoiceDetailModal } from './components/modals/InvoiceDetailModal';
import { PaymentModal } from './components/modals/PaymentModal';
import { CustomerModal } from './components/modals/CustomerModal';
import { ProductModal } from './components/modals/ProductModal';
import { StockAdjustmentModal } from './components/modals/StockAdjustmentModal';
import { JournalEntryModal } from './components/modals/JournalEntryModal';
import { TestRunnerModal } from './components/modals/TestRunnerModal';
import { CommandPalette } from './components/CommandPalette';

import { Customer, Invoice, Product } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTestRunnerOpen, setIsTestRunnerOpen] = useState(false);
  const [isInvoiceCreateOpen, setIsInvoiceCreateOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [initialCustomerIdForInvoice, setInitialCustomerIdForInvoice] = useState<string | undefined>(undefined);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isStockAdjustmentOpen, setIsStockAdjustmentOpen] = useState(false);
  const [selectedProductForAdjustment, setSelectedProductForAdjustment] = useState<Product | null>(null);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);

  // Force re-render helper when DB mutates
  const refreshApp = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Keyboard shortcut for Command Palette (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResetSeed = () => {
    if (window.confirm('Reset database to clean seed demo data? All temporary test entries will be re-initialized.')) {
      db.resetToSeed();
      refreshApp();
    }
  };

  const handleOpenQuickCreate = (type: 'invoice' | 'customer' | 'product' | 'payment' | 'journal') => {
    if (type === 'invoice') {
      setInitialCustomerIdForInvoice(undefined);
      setIsInvoiceCreateOpen(true);
    } else if (type === 'customer') {
      setCustomerToEdit(null);
      setIsCustomerModalOpen(true);
    } else if (type === 'product') {
      setProductToEdit(null);
      setIsProductModalOpen(true);
    } else if (type === 'payment') {
      // Find first invoice with outstanding balance
      const dueInv = db.invoices.find((i) => i.amountDue > 0 && i.status !== 'DRAFT');
      if (dueInv) {
        setPaymentInvoice(dueInv);
      } else {
        alert('No pending invoices with balance due found to record payment.');
      }
    } else if (type === 'journal') {
      setIsJournalModalOpen(true);
    }
  };

  const selectedInvoice = selectedInvoiceId
    ? db.invoices.find((i) => i.id === selectedInvoiceId) || null
    : null;

  return (
    <div key={refreshKey} className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-800 font-sans">
      <div className="flex flex-1 min-h-screen">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar with Search & Quick Actions */}
          <TopBar
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenQuickCreate={handleOpenQuickCreate}
            onOpenTestRunner={() => setIsTestRunnerOpen(true)}
            onResetSeed={handleResetSeed}
          />

          {/* Primary View Router */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                onNavigate={setActiveTab}
                onOpenQuickCreate={handleOpenQuickCreate}
                onViewInvoice={(id) => setSelectedInvoiceId(id)}
              />
            )}

            {activeTab === 'invoices' && (
              <InvoicesView
                onOpenCreate={() => {
                  setInitialCustomerIdForInvoice(undefined);
                  setIsInvoiceCreateOpen(true);
                }}
                onViewInvoice={(id) => setSelectedInvoiceId(id)}
                onRecordPayment={(inv) => setPaymentInvoice(inv)}
              />
            )}

            {(activeTab === 'quotes' || activeTab === 'orders' || activeTab === 'credit-notes') && (
              <QuotesOrdersView
                defaultSubTab={
                  activeTab === 'quotes' ? 'quotes' : activeTab === 'orders' ? 'orders' : 'credit-notes'
                }
                onViewInvoice={(id) => setSelectedInvoiceId(id)}
                onRefresh={refreshApp}
              />
            )}

            {activeTab === 'payments' && (
              <PaymentsView
                onOpenRecordPayment={() => handleOpenQuickCreate('payment')}
                onViewInvoice={(id) => setSelectedInvoiceId(id)}
              />
            )}

            {(activeTab === 'products' || activeTab === 'stock-movements' || activeTab === 'warehouses') && (
              <ProductsInventoryView
                defaultSubTab={
                  activeTab === 'stock-movements'
                    ? 'movements'
                    : activeTab === 'warehouses'
                    ? 'warehouses'
                    : 'products'
                }
                onOpenCreateProduct={() => {
                  setProductToEdit(null);
                  setIsProductModalOpen(true);
                }}
                onEditProduct={(p) => {
                  setProductToEdit(p);
                  setIsProductModalOpen(true);
                }}
                onOpenStockAdjustment={(p) => {
                  setSelectedProductForAdjustment(p || null);
                  setIsStockAdjustmentOpen(true);
                }}
              />
            )}

            {activeTab === 'customers' && (
              <CustomersView
                onOpenCreateCustomer={() => {
                  setCustomerToEdit(null);
                  setIsCustomerModalOpen(true);
                }}
                onEditCustomer={(cust) => {
                  setCustomerToEdit(cust);
                  setIsCustomerModalOpen(true);
                }}
                onCreateInvoiceForCustomer={(customerId) => {
                  setInitialCustomerIdForInvoice(customerId);
                  setIsInvoiceCreateOpen(true);
                }}
                onViewInvoice={(id) => setSelectedInvoiceId(id)}
              />
            )}

            {activeTab === 'vendors' && <VendorsView />}

            {(activeTab === 'chart-of-accounts' ||
              activeTab === 'journal-entries' ||
              activeTab === 'general-ledger' ||
              activeTab === 'trial-balance') && (
              <AccountingView
                defaultSubTab={
                  activeTab === 'chart-of-accounts'
                    ? 'chart'
                    : activeTab === 'journal-entries'
                    ? 'journals'
                    : activeTab === 'general-ledger'
                    ? 'ledger'
                    : 'trial'
                }
                onOpenCreateJournal={() => setIsJournalModalOpen(true)}
              />
            )}

            {(activeTab === 'profit-loss' ||
              activeTab === 'balance-sheet' ||
              activeTab === 'customer-outstanding') && (
              <ReportsView
                defaultReport={
                  activeTab === 'profit-loss'
                    ? 'pnl'
                    : activeTab === 'balance-sheet'
                    ? 'balance-sheet'
                    : 'receivables'
                }
                onViewInvoice={(id) => setSelectedInvoiceId(id)}
              />
            )}

            {activeTab === 'audit-logs' && <SettingsView defaultSubTab="audit" />}
            {activeTab === 'settings' && <SettingsView defaultSubTab="profile" />}
          </main>
        </div>
      </div>

      {/* Global Modals */}
      {/* 1. Create Invoice Modal */}
      <InvoiceCreateModal
        isOpen={isInvoiceCreateOpen}
        onClose={() => setIsInvoiceCreateOpen(false)}
        initialCustomerId={initialCustomerIdForInvoice}
        onSuccess={(newInvId) => {
          refreshApp();
          setSelectedInvoiceId(newInvId);
        }}
      />

      {/* 2. Invoice Detail View Modal */}
      <InvoiceDetailModal
        isOpen={!!selectedInvoiceId}
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoiceId(null)}
        onRecordPayment={(inv) => {
          setSelectedInvoiceId(null);
          setPaymentInvoice(inv);
        }}
        onViewJournal={(jid) => {
          setSelectedInvoiceId(null);
          setActiveTab('journal-entries');
        }}
        onRefresh={refreshApp}
      />

      {/* 3. Record Payment Modal */}
      <PaymentModal
        isOpen={!!paymentInvoice}
        invoice={paymentInvoice}
        onClose={() => setPaymentInvoice(null)}
        onSuccess={() => {
          refreshApp();
        }}
      />

      {/* 4. Customer Modal (Add/Edit) */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        customerToEdit={customerToEdit}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={() => {
          refreshApp();
        }}
      />

      {/* 5. Product Modal (Add/Edit) */}
      <ProductModal
        isOpen={isProductModalOpen}
        productToEdit={productToEdit}
        onClose={() => setIsProductModalOpen(false)}
        onSuccess={() => {
          refreshApp();
        }}
      />

      {/* 6. Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isStockAdjustmentOpen}
        selectedProduct={selectedProductForAdjustment}
        onClose={() => setIsStockAdjustmentOpen(false)}
        onSuccess={() => {
          refreshApp();
        }}
      />

      {/* 7. Journal Entry Modal */}
      <JournalEntryModal
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
        onSuccess={() => {
          refreshApp();
        }}
      />

      {/* 8. Accounting Automated Invariants Test Runner */}
      <TestRunnerModal
        isOpen={isTestRunnerOpen}
        onClose={() => setIsTestRunnerOpen(false)}
      />

      {/* 9. Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
        onViewInvoice={(id) => setSelectedInvoiceId(id)}
        onOpenQuickCreate={handleOpenQuickCreate}
      />
    </div>
  );
}
