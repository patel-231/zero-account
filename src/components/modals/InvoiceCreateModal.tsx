import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Building,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { db } from '../../server/db';
import { createInvoice } from '../../services/invoiceService';
import { formatINR, numberToIndianWords, calculateLineItem } from '../../utils/money';
import { Customer, Product } from '../../types';

interface InvoiceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (invoiceId: string) => void;
  initialCustomerId?: string;
}

interface LineItemInput {
  productId?: string;
  productName: string;
  description: string;
  hsnSac: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  taxRate: number;
}

export const InvoiceCreateModal: React.FC<InvoiceCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCustomerId,
}) => {
  if (!isOpen) return null;

  const [customerId, setCustomerId] = useState<string>(
    initialCustomerId || db.customers[0]?.id || ''
  );
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('Thank you for your business!');
  const [terms, setTerms] = useState<string>(db.organization.defaultPaymentTerms);
  const [autoPost, setAutoPost] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Line items state
  const [items, setItems] = useState<LineItemInput[]>([
    {
      productId: db.products[0]?.id,
      productName: db.products[0]?.name || 'Phone Cooler Pro',
      description: db.products[0]?.description || '',
      hsnSac: db.products[0]?.hsnSac || '8414',
      quantity: 1,
      unit: db.products[0]?.unit || 'pcs',
      rate: db.products[0]?.sellingPrice || 10000,
      discount: 0,
      taxRate: db.products[0]?.gstRate || 18,
    },
  ]);

  const selectedCustomer = db.customers.find((c) => c.id === customerId);
  const isIntraState = selectedCustomer?.stateCode === db.organization.stateCode;

  // Handle product dropdown change on a line
  const handleProductSelect = (index: number, prodId: string) => {
    const prod = db.products.find((p) => p.id === prodId);
    if (!prod) return;

    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: prod.id,
      productName: prod.name,
      description: prod.description || '',
      hsnSac: prod.hsnSac || '',
      unit: prod.unit,
      rate: prod.sellingPrice,
      taxRate: prod.gstRate,
    };
    setItems(newItems);
  };

  const handleAddItem = () => {
    const defaultProd = db.products[1] || db.products[0];
    setItems([
      ...items,
      {
        productId: defaultProd?.id,
        productName: defaultProd?.name || 'Custom Product / Service',
        description: '',
        hsnSac: defaultProd?.hsnSac || '',
        quantity: 1,
        unit: defaultProd?.unit || 'pcs',
        rate: defaultProd?.sellingPrice || 1000,
        discount: 0,
        taxRate: defaultProd?.gstRate || 18,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof LineItemInput, val: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: val };
    setItems(newItems);
  };

  // Live calculation of totals
  let subtotal = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  items.forEach((item) => {
    const calc = calculateLineItem(item.quantity, item.rate, item.discount, item.taxRate, isIntraState);
    subtotal += calc.taxableAmount;
    totalCGST += calc.cgst;
    totalSGST += calc.sgst;
    totalIGST += calc.igst;
  });

  const totalTax = totalCGST + totalSGST + totalIGST;
  const unroundedTotal = subtotal + totalTax;
  const grandTotal = Math.round(unroundedTotal);
  const roundOff = Number((grandTotal - unroundedTotal).toFixed(2));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!customerId) throw new Error('Please select a customer.');
      if (items.length === 0) throw new Error('Please add at least one line item.');

      for (const item of items) {
        if (!item.productName) throw new Error('All items must have a product name.');
        if (item.quantity <= 0) throw new Error('Item quantity must be greater than zero.');
        if (item.rate < 0) throw new Error('Item rate cannot be negative.');
      }

      const created = createInvoice({
        customerId,
        invoiceDate: new Date(invoiceDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        placeOfSupply: selectedCustomer?.state || 'Gujarat',
        notes,
        terms,
        items: items.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          description: it.description,
          hsnSac: it.hsnSac,
          quantity: Number(it.quantity),
          unit: it.unit,
          rate: Number(it.rate),
          discount: Number(it.discount || 0),
          taxRate: Number(it.taxRate),
        })),
        autoPost,
      });

      onSuccess(created.id);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-6 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Create Tax Invoice (GST)</h2>
              <p className="text-xs text-slate-500">
                {isIntraState
                  ? `Intra-State Supply (CGST + SGST applied) • State Code: ${selectedCustomer?.stateCode || '24'}`
                  : `Inter-State Supply (IGST applied) • Place of Supply: ${selectedCustomer?.state || 'Other State'}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Error creating invoice: </span>
                {error}
              </div>
            </div>
          )}

          {/* Customer & Invoice Meta Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            {/* Customer Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer <span className="text-rose-500">*</span>
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                required
              >
                {db.customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customerName} {c.companyName ? `(${c.companyName})` : ''} - {c.state} ({c.stateCode})
                  </option>
                ))}
              </select>
              {selectedCustomer && (
                <div className="mt-1.5 text-[11px] text-slate-500">
                  <span>GSTIN: <strong className="font-mono text-slate-700">{selectedCustomer.gstin || 'Unregistered'}</strong></span>
                </div>
              )}
            </div>

            {/* Invoice Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Line Items & Tax Breakdown
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-64">Item / Product</th>
                      <th className="p-2.5 w-24">HSN/SAC</th>
                      <th className="p-2.5 w-20">Qty</th>
                      <th className="p-2.5 w-28">Rate (₹)</th>
                      <th className="p-2.5 w-24">Tax Rate</th>
                      <th className="p-2.5 text-right w-28">Taxable</th>
                      <th className="p-2.5 text-right w-28">
                        {isIntraState ? 'CGST + SGST' : 'IGST'}
                      </th>
                      <th className="p-2.5 text-right w-28">Total (₹)</th>
                      <th className="p-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => {
                      const calc = calculateLineItem(
                        item.quantity,
                        item.rate,
                        item.discount,
                        item.taxRate,
                        isIntraState
                      );

                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          {/* Product select or custom name */}
                          <td className="p-2">
                            <select
                              value={item.productId || ''}
                              onChange={(e) => handleProductSelect(idx, e.target.value)}
                              className="w-full text-xs p-1.5 border border-slate-300 rounded-md font-medium"
                            >
                              <option value="">-- Custom Item --</option>
                              {db.products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.sku})
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={item.productName}
                              onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                              placeholder="Product or service name"
                              className="w-full text-[11px] p-1 border border-slate-200 rounded-md mt-1 text-slate-600"
                              required
                            />
                          </td>

                          {/* HSN/SAC */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.hsnSac}
                              onChange={(e) => handleItemChange(idx, 'hsnSac', e.target.value)}
                              placeholder="8414"
                              className="w-full text-xs p-1.5 border border-slate-300 rounded-md font-mono"
                            />
                          </td>

                          {/* Quantity */}
                          <td className="p-2">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full text-xs p-1.5 border border-slate-300 rounded-md text-right font-medium"
                              required
                            />
                          </td>

                          {/* Rate */}
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.rate}
                              onChange={(e) => handleItemChange(idx, 'rate', parseFloat(e.target.value) || 0)}
                              className="w-full text-xs p-1.5 border border-slate-300 rounded-md text-right font-medium"
                              required
                            />
                          </td>

                          {/* Tax Rate */}
                          <td className="p-2">
                            <select
                              value={item.taxRate}
                              onChange={(e) => handleItemChange(idx, 'taxRate', parseFloat(e.target.value))}
                              className="w-full text-xs p-1.5 border border-slate-300 rounded-md font-medium"
                            >
                              <option value={0}>0%</option>
                              <option value={5}>5%</option>
                              <option value={12}>12%</option>
                              <option value={18}>18%</option>
                              <option value={28}>28%</option>
                            </select>
                          </td>

                          {/* Taxable */}
                          <td className="p-2 text-right font-mono font-medium text-slate-700">
                            {formatINR(calc.taxableAmount)}
                          </td>

                          {/* Taxes */}
                          <td className="p-2 text-right font-mono text-slate-600">
                            {isIntraState ? (
                              <div>
                                <span className="text-[10px] text-slate-400">C:</span> {formatINR(calc.cgst)}
                                <br />
                                <span className="text-[10px] text-slate-400">S:</span> {formatINR(calc.sgst)}
                              </div>
                            ) : (
                              <div>
                                <span className="text-[10px] text-slate-400">I:</span> {formatINR(calc.igst)}
                              </div>
                            )}
                          </td>

                          {/* Total */}
                          <td className="p-2 text-right font-mono font-bold text-slate-900">
                            {formatINR(calc.total)}
                          </td>

                          {/* Delete */}
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              disabled={items.length <= 1}
                              className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                            >
                              <Trash2 className="w-4 h-4" />
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

          {/* Bottom Row: Notes & Totals Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Notes & Terms */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes to appear on invoice"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  rows={2}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Terms of payment"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoPost"
                  checked={autoPost}
                  onChange={(e) => setAutoPost(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="autoPost" className="text-xs text-blue-900 font-semibold cursor-pointer">
                  Post Immediately (Creates balanced journal entry & decreases stock)
                </label>
              </div>
            </div>

            {/* Totals Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Amount:</span>
                <span className="font-mono font-medium">{formatINR(subtotal)}</span>
              </div>

              {isIntraState ? (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Central GST (CGST):</span>
                    <span className="font-mono font-medium">{formatINR(totalCGST)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>State GST (SGST):</span>
                    <span className="font-mono font-medium">{formatINR(totalSGST)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-slate-600">
                  <span>Integrated GST (IGST):</span>
                  <span className="font-mono font-medium">{formatINR(totalIGST)}</span>
                </div>
              )}

              {roundOff !== 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Round-off Adjustment:</span>
                  <span className="font-mono">{formatINR(roundOff)}</span>
                </div>
              )}

              <div className="border-t border-slate-300 pt-2 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-900">Grand Total:</span>
                <span className="text-lg font-extrabold font-mono text-blue-700">
                  {formatINR(grandTotal)}
                </span>
              </div>

              <div className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
                {numberToIndianWords(grandTotal)}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {autoPost ? 'Post Invoice & Create Journal' : 'Save as Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
