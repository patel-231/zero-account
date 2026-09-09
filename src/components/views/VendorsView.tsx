import React, { useState } from 'react';
import { Building, Plus, Search, Mail, Phone, Edit2, ShieldCheck } from 'lucide-react';
import { db } from '../../server/db';
import { Vendor } from '../../types';
import { VendorModal } from '../modals/VendorModal';

export const VendorsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<Vendor | null>(null);
  const [, setRefresh] = useState(0);

  const filteredVendors = db.vendors.filter((v) => {
    const q = searchTerm.toLowerCase();
    return (
      v.vendorName.toLowerCase().includes(q) ||
      (v.companyName && v.companyName.toLowerCase().includes(q)) ||
      (v.gstin && v.gstin.toLowerCase().includes(q)) ||
      v.vendorCode.toLowerCase().includes(q)
    );
  });

  const handleOpenCreate = () => {
    setVendorToEdit(null);
    setIsVendorModalOpen(true);
  };

  const handleOpenEdit = (vendor: Vendor) => {
    setVendorToEdit(vendor);
    setIsVendorModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Vendor Directory (Suppliers)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage raw material and component suppliers, GSTIN, place of supply, and payment terms.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier / Vendor</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search vendors by name, GSTIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <span className="text-xs text-slate-400 font-semibold">{filteredVendors.length} Suppliers</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="p-3.5">Vendor Code</th>
                <th className="p-3.5">Vendor Name</th>
                <th className="p-3.5">State & POS</th>
                <th className="p-3.5">GSTIN</th>
                <th className="p-3.5">Contact</th>
                <th className="p-3.5">Payment Terms</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No suppliers found matching your query.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-slate-500">{v.vendorCode}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{v.vendorName}</div>
                      {v.companyName && <div className="text-[11px] text-slate-500">{v.companyName}</div>}
                    </td>
                    <td className="p-3.5 text-slate-700">
                      {v.state} ({v.stateCode})
                    </td>
                    <td className="p-3.5 font-mono text-slate-700">
                      {v.gstin ? (
                        <span className="font-semibold text-slate-900">{v.gstin}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unregistered</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      <div>{v.phone || '-'}</div>
                      {v.email && <div className="text-[10px] text-slate-400">{v.email}</div>}
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium">{v.paymentTerms || 'Net 30'}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleOpenEdit(v)}
                        title="Edit Supplier"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor Modal */}
      <VendorModal
        isOpen={isVendorModalOpen}
        vendorToEdit={vendorToEdit}
        onClose={() => setIsVendorModalOpen(false)}
        onSuccess={() => {
          setRefresh((prev) => prev + 1);
        }}
      />
    </div>
  );
};
