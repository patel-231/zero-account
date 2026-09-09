import React, { useState } from 'react';
import { X, Building, AlertCircle } from 'lucide-react';
import { db } from '../../server/db';
import { Vendor, GSTRegistrationType } from '../../types';

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (vendor: Vendor) => void;
  vendorToEdit?: Vendor | null;
}

export const VendorModal: React.FC<VendorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  vendorToEdit,
}) => {
  if (!isOpen) return null;

  const [vendorName, setVendorName] = useState(vendorToEdit?.vendorName || '');
  const [companyName, setCompanyName] = useState(vendorToEdit?.companyName || '');
  const [contactPerson, setContactPerson] = useState(vendorToEdit?.contactPerson || '');
  const [email, setEmail] = useState(vendorToEdit?.email || '');
  const [phone, setPhone] = useState(vendorToEdit?.phone || '');
  const [address, setAddress] = useState(vendorToEdit?.address || '');
  const [city, setCity] = useState(vendorToEdit?.city || 'Surat');
  const [state, setState] = useState(vendorToEdit?.state || 'Gujarat');
  const [stateCode, setStateCode] = useState(vendorToEdit?.stateCode || '24');
  const [pinCode, setPinCode] = useState(vendorToEdit?.pinCode || '395002');
  const [gstin, setGstin] = useState(vendorToEdit?.gstin || '');
  const [pan, setPan] = useState(vendorToEdit?.pan || '');
  const [gstType, setGstType] = useState<GSTRegistrationType>(vendorToEdit?.gstRegistrationType || 'REGULAR');
  const [paymentTerms, setPaymentTerms] = useState(vendorToEdit?.paymentTerms || 'Net 30 Days');
  const [notes, setNotes] = useState(vendorToEdit?.notes || '');
  const [error, setError] = useState<string | null>(null);

  const indianStates = [
    { name: 'Gujarat', code: '24' },
    { name: 'Maharashtra', code: '27' },
    { name: 'Delhi', code: '07' },
    { name: 'Karnataka', code: '29' },
    { name: 'Tamil Nadu', code: '33' },
    { name: 'Uttar Pradesh', code: '09' },
    { name: 'Rajasthan', code: '08' },
    { name: 'West Bengal', code: '19' },
    { name: 'Haryana', code: '06' },
    { name: 'Telangana', code: '36' },
    { name: 'Madhya Pradesh', code: '23' },
    { name: 'Punjab', code: '03' },
  ];

  const handleStateChange = (selectedName: string) => {
    setState(selectedName);
    const found = indianStates.find((s) => s.name === selectedName);
    if (found) setStateCode(found.code);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) {
      setError('Vendor Name is mandatory');
      return;
    }

    if (gstin && gstin.trim().length !== 15) {
      setError('GSTIN must be 15 characters long');
      return;
    }

    try {
      if (vendorToEdit) {
        const updated: Vendor = {
          ...vendorToEdit,
          vendorName,
          companyName: companyName || undefined,
          contactPerson: contactPerson || undefined,
          email: email || undefined,
          phone: phone || undefined,
          address: address || undefined,
          city: city || undefined,
          state,
          stateCode,
          pinCode: pinCode || undefined,
          gstin: gstin.toUpperCase() || undefined,
          pan: pan.toUpperCase() || (gstin ? gstin.substring(2, 12).toUpperCase() : undefined),
          gstRegistrationType: gstType,
          paymentTerms,
          notes: notes || undefined,
          updatedAt: new Date().toISOString(),
        };

        const idx = db.vendors.findIndex((v) => v.id === vendorToEdit.id);
        if (idx >= 0) {
          db.vendors[idx] = updated;
          db.addAuditLog('VENDOR_UPDATED', 'Vendor', updated.id, `Updated vendor ${updated.vendorName}`);
          db.save();
        }
        onSuccess(updated);
      } else {
        const newCode = `VND-${String(db.vendors.length + 101).padStart(3, '0')}`;
        const newVendor: Vendor = {
          id: `vnd-${Date.now()}`,
          organizationId: db.organization.id,
          vendorCode: newCode,
          vendorName,
          companyName: companyName || undefined,
          contactPerson: contactPerson || undefined,
          email: email || undefined,
          phone: phone || undefined,
          address: address || undefined,
          city: city || undefined,
          state,
          stateCode,
          country: 'India',
          pinCode: pinCode || undefined,
          gstin: gstin.toUpperCase() || undefined,
          pan: pan.toUpperCase() || (gstin ? gstin.substring(2, 12).toUpperCase() : undefined),
          gstRegistrationType: gstType,
          paymentTerms,
          creditLimit: 0,
          openingBalance: 0,
          notes: notes || undefined,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        db.vendors.push(newVendor);
        db.addAuditLog('VENDOR_CREATED', 'Vendor', newVendor.id, `Created vendor ${newVendor.vendorName} (${newVendor.vendorCode})`);
        db.save();
        onSuccess(newVendor);
      }
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              {vendorToEdit ? `Edit Vendor: ${vendorToEdit.vendorCode}` : 'Add New Vendor / Supplier'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Vendor Name *
              </label>
              <input
                type="text"
                required
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="e.g. Apex Industrial Supplies"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company / Legal Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apex Industrial Solutions Pvt Ltd"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Rajesh Shah"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rajesh@apexsupplies.in"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98250 12345"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* GST Details */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              GSTIN & Taxation Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">GSTIN (15 Digits)</label>
                <input
                  type="text"
                  maxLength={15}
                  value={gstin}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase();
                    setGstin(v);
                    if (v.length >= 2) {
                      const code = v.substring(0, 2);
                      const matched = indianStates.find((s) => s.code === code);
                      if (matched) {
                        setState(matched.name);
                        setStateCode(matched.code);
                      }
                    }
                  }}
                  placeholder="24AAACA1234A1Z5"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">GST Registration Type</label>
                <select
                  value={gstType}
                  onChange={(e) => setGstType(e.target.value as GSTRegistrationType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="REGULAR">Regular Taxpayer</option>
                  <option value="COMPOSITION">Composition Scheme</option>
                  <option value="UNREGISTERED">Unregistered Business</option>
                  <option value="OVERSEAS">Overseas / Import</option>
                  <option value="SEZ">SEZ Developer / Unit</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">PAN Number</label>
                <input
                  type="text"
                  maxLength={10}
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  placeholder="AAACA1234A"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Location & Payment terms */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">State & Place of Supply *</label>
              <select
                value={state}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {indianStates.map((s) => (
                  <option key={s.code} value={s.name}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">PIN Code</label>
              <input
                type="text"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="395002"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Office / Factory Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Plot 45, GIDC Industrial Estate, Road No. 8"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="Immediate">Immediate / Advance</option>
                <option value="Net 15 Days">Net 15 Days</option>
                <option value="Net 30 Days">Net 30 Days</option>
                <option value="Net 45 Days">Net 45 Days</option>
                <option value="Net 60 Days">Net 60 Days</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Internal Notes / Ledger Remarks</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key contact or component catalog references"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition"
            >
              {vendorToEdit ? 'Update Vendor' : 'Save Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
