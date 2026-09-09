import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { db } from '../../server/db';
import { Customer, GSTRegistrationType } from '../../types';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: Customer) => void;
  customerToEdit?: Customer | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customerToEdit,
}) => {
  if (!isOpen) return null;

  const [customerName, setCustomerName] = useState(customerToEdit?.customerName || '');
  const [companyName, setCompanyName] = useState(customerToEdit?.companyName || '');
  const [contactPerson, setContactPerson] = useState(customerToEdit?.contactPerson || '');
  const [email, setEmail] = useState(customerToEdit?.email || '');
  const [phone, setPhone] = useState(customerToEdit?.phone || '');
  const [whatsapp, setWhatsapp] = useState(customerToEdit?.whatsapp || '');
  const [billingAddress, setBillingAddress] = useState(customerToEdit?.billingAddress || '');
  const [city, setCity] = useState(customerToEdit?.city || 'Ahmedabad');
  const [state, setState] = useState(customerToEdit?.state || 'Gujarat');
  const [stateCode, setStateCode] = useState(customerToEdit?.stateCode || '24');
  const [pinCode, setPinCode] = useState(customerToEdit?.pinCode || '380015');
  const [gstin, setGstin] = useState(customerToEdit?.gstin || '');
  const [pan, setPan] = useState(customerToEdit?.pan || '');
  const [gstType, setGstType] = useState<GSTRegistrationType>(customerToEdit?.gstRegistrationType || 'REGULAR');
  const [creditLimit, setCreditLimit] = useState(customerToEdit?.creditLimit || 100000);
  const [paymentTerms, setPaymentTerms] = useState(customerToEdit?.paymentTerms || 'Net 15 Days');
  const [notes, setNotes] = useState(customerToEdit?.notes || '');
  const [error, setError] = useState<string | null>(null);

  // States of India with State Codes
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
    setError(null);

    try {
      if (!customerName.trim()) throw new Error('Customer name is required.');

      // Auto-extract PAN from GSTIN if provided (10 characters from index 2 to 12)
      let finalPan = pan;
      if (gstin.trim().length === 15 && !finalPan) {
        finalPan = gstin.trim().substring(2, 12).toUpperCase();
      }

      let customer: Customer;

      if (customerToEdit) {
        customer = {
          ...customerToEdit,
          customerName,
          companyName,
          contactPerson,
          email,
          phone,
          whatsapp,
          billingAddress,
          city,
          state,
          stateCode,
          pinCode,
          gstin: gstin.toUpperCase(),
          pan: finalPan.toUpperCase(),
          gstRegistrationType: gstType,
          creditLimit: Number(creditLimit),
          paymentTerms,
          notes,
          updatedAt: new Date().toISOString(),
        };

        const idx = db.customers.findIndex((c) => c.id === customerToEdit.id);
        if (idx !== -1) db.customers[idx] = customer;
        db.addAuditLog('CUSTOMER_UPDATED', 'Customer', customer.id, `Updated customer ${customer.customerName}`);
      } else {
        const nextCode = `CUST-${String(db.customers.length + 1).padStart(3, '0')}`;
        customer = {
          id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          organizationId: db.organization.id,
          customerCode: nextCode,
          customerName,
          companyName,
          contactPerson,
          email,
          phone,
          whatsapp,
          billingAddress,
          city,
          state,
          stateCode,
          country: 'India',
          pinCode,
          gstin: gstin.toUpperCase(),
          pan: finalPan.toUpperCase(),
          gstRegistrationType: gstType,
          paymentTerms,
          creditLimit: Number(creditLimit),
          openingBalance: 0,
          notes,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        db.customers.unshift(customer);
        db.addAuditLog('CUSTOMER_CREATED', 'Customer', customer.id, `Created customer ${customer.customerName} (${customer.customerCode})`);
      }

      db.save();
      onSuccess(customer);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-6 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {customerToEdit ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <p className="text-xs text-slate-500">GST details & place of supply configuration</p>
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

          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer / Trade Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. ABC Traders"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Legal Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. ABC Traders Pvt Ltd"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Ramesh Patel"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone / Mobile</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98250 11223"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="billing@abctraders.in"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* GSTIN & Tax Details */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-800">Tax & GST Identification</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN (15 digits)</label>
                <input
                  type="text"
                  maxLength={15}
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="24AABCA1122D1Z8"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PAN</label>
                <input
                  type="text"
                  maxLength={10}
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  placeholder="AABCA1122D"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GST Registration</label>
                <select
                  value={gstType}
                  onChange={(e) => setGstType(e.target.value as GSTRegistrationType)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="REGULAR">Regular Taxpayer</option>
                  <option value="COMPOSITION">Composition Scheme</option>
                  <option value="UNREGISTERED">Unregistered / Consumer</option>
                  <option value="SEZ">Special Economic Zone (SEZ)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Address & Place of Supply */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Address</label>
              <input
                type="text"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                placeholder="Office address, street, landmark"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State & POS</label>
                <select
                  value={state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  {indianStates.map((s) => (
                    <option key={s.code} value={s.name}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>
          </div>

          {/* Credit & Terms */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Limit (₹)</label>
              <input
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms</label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="Net 15 Days"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Footer Actions */}
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
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs flex items-center gap-1.5 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              {customerToEdit ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
