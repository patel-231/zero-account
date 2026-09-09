import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  FileText,
  CreditCard,
  Building,
  Phone,
  Mail,
  ArrowUpRight,
  Edit2,
  X,
} from 'lucide-react';
import { db } from '../../server/db';
import { Customer } from '../../types';
import { formatINR } from '../../utils/money';

interface CustomersViewProps {
  onOpenCreateCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
  onCreateInvoiceForCustomer: (customerId: string) => void;
  onViewInvoice: (invoiceId: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  onOpenCreateCustomer,
  onEditCustomer,
  onCreateInvoiceForCustomer,
  onViewInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const filteredCustomers = db.customers.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      c.customerName.toLowerCase().includes(q) ||
      (c.companyName && c.companyName.toLowerCase().includes(q)) ||
      c.customerCode.toLowerCase().includes(q) ||
      (c.gstin && c.gstin.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    );
  });

  const selectedCustomer = db.customers.find((c) => c.id === selectedCustomerId);
  const customerInvoices = selectedCustomer
    ? db.invoices.filter((i) => i.customerId === selectedCustomer.id)
    : [];
  const customerPayments = selectedCustomer
    ? db.payments.filter((p) => p.customerId === selectedCustomer.id)
    : [];

  const customerTotalBilled = customerInvoices
    .filter((i) => i.status !== 'CANCELLED' && i.status !== 'DRAFT')
    .reduce((acc, i) => acc + i.total, 0);

  const customerTotalPaid = customerInvoices.reduce((acc, i) => acc + i.amountPaid, 0);
  const customerOutstanding = customerInvoices
    .filter((i) => i.status !== 'CANCELLED' && i.status !== 'DRAFT')
    .reduce((acc, i) => acc + i.amountDue, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage Indian buyers, place of supply, GSTIN credentials, and receivables.
          </p>
        </div>

        <button
          onClick={onOpenCreateCustomer}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Main Layout: List Table + Customer Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Customer List */}
        <div className={`space-y-4 ${selectedCustomer ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {/* Search bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search customers by name, company, GSTIN, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <span className="text-xs text-slate-400 font-semibold px-2">
              {filteredCustomers.length} Customers
            </span>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3.5">Code</th>
                    <th className="p-3.5">Customer & Company</th>
                    <th className="p-3.5">Place of Supply</th>
                    <th className="p-3.5">GSTIN</th>
                    <th className="p-3.5">Contact</th>
                    <th className="p-3.5 text-right">Outstanding</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((cust) => {
                    const invoices = db.invoices.filter((i) => i.customerId === cust.id);
                    const due = invoices
                      .filter((i) => i.status !== 'CANCELLED' && i.status !== 'DRAFT')
                      .reduce((acc, i) => acc + i.amountDue, 0);

                    const isSelected = selectedCustomerId === cust.id;

                    return (
                      <tr
                        key={cust.id}
                        onClick={() => setSelectedCustomerId(cust.id)}
                        className={`hover:bg-slate-50 cursor-pointer transition ${
                          isSelected ? 'bg-blue-50/70 border-l-4 border-blue-600' : ''
                        }`}
                      >
                        <td className="p-3.5 font-mono font-bold text-slate-500">{cust.customerCode}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{cust.customerName}</div>
                          {cust.companyName && (
                            <div className="text-[11px] text-slate-500">{cust.companyName}</div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="font-medium text-slate-700">{cust.state}</div>
                          <div className="text-[10px] text-slate-400">Code: {cust.stateCode}</div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-700">
                          {cust.gstin || <span className="text-slate-400 italic">Unregistered</span>}
                        </td>
                        <td className="p-3.5 text-slate-600">
                          <div>{cust.phone || '-'}</div>
                          {cust.email && <div className="text-[10px] text-slate-400">{cust.email}</div>}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold">
                          {due > 0 ? (
                            <span className="text-rose-600">{formatINR(due)}</span>
                          ) : (
                            <span className="text-emerald-600">₹0.00</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditCustomer(cust);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Customer Detail Drawer */}
        {selectedCustomer && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5 h-fit sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">
                  {selectedCustomer.customerCode}
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-1">{selectedCustomer.customerName}</h2>
                <div className="text-xs text-slate-500">{selectedCustomer.companyName}</div>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Billed</div>
                <div className="font-bold text-slate-900 mt-0.5">{formatINR(customerTotalBilled)}</div>
              </div>
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-100">
                <div className="text-[10px] text-rose-700 uppercase font-semibold">Outstanding</div>
                <div className="font-bold text-rose-800 mt-0.5">{formatINR(customerOutstanding)}</div>
              </div>
            </div>

            {/* Actions for this Customer */}
            <div className="flex gap-2">
              <button
                onClick={() => onCreateInvoiceForCustomer(selectedCustomer.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Invoice</span>
              </button>
              <button
                onClick={() => onEditCustomer(selectedCustomer)}
                className="py-2 px-3 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700"
              >
                Edit
              </button>
            </div>

            {/* Customer Details */}
            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
              <div>
                <strong className="text-slate-800">GSTIN:</strong>{' '}
                <span className="font-mono">{selectedCustomer.gstin || 'Unregistered'}</span>
              </div>
              <div>
                <strong className="text-slate-800">State / Code:</strong> {selectedCustomer.state} (
                {selectedCustomer.stateCode})
              </div>
              <div>
                <strong className="text-slate-800">Address:</strong> {selectedCustomer.billingAddress},{' '}
                {selectedCustomer.city} - {selectedCustomer.pinCode}
              </div>
              {selectedCustomer.phone && (
                <div>
                  <strong className="text-slate-800">Phone:</strong> {selectedCustomer.phone}
                </div>
              )}
              {selectedCustomer.email && (
                <div>
                  <strong className="text-slate-800">Email:</strong> {selectedCustomer.email}
                </div>
              )}
              <div>
                <strong className="text-slate-800">Payment Terms:</strong>{' '}
                {selectedCustomer.paymentTerms || 'Net 15 Days'}
              </div>
            </div>

            {/* Invoices History for this customer */}
            <div className="border-t border-slate-100 pt-3">
              <div className="text-xs font-bold text-slate-800 mb-2">Invoice History</div>
              {customerInvoices.length === 0 ? (
                <div className="text-xs text-slate-400">No invoices yet for this customer.</div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {customerInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => onViewInvoice(inv.id)}
                      className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-100 text-xs flex items-center justify-between cursor-pointer transition"
                    >
                      <div>
                        <div className="font-bold text-blue-600">{inv.invoiceNumber}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(inv.invoiceDate).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">{formatINR(inv.total)}</div>
                        <div className="text-[10px] font-semibold text-slate-500">{inv.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
