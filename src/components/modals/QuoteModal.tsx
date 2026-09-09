import React, { useState } from 'react';
import { X, Plus, Trash2, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { db } from '../../server/db';
import { Quote } from '../../types';
import { createQuote, createSalesOrder } from '../../services/quoteOrderService';
import { calculateLineItem, formatINR } from '../../utils/money';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (quote: Quote) => void;
  mode?: 'quote' | 'order';
}

export const QuoteModal: React.FC<QuoteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode = 'quote',
}) => {
  if (!isOpen) return null;

  const [customerId, setCustomerId] = useState(db.customers[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDays, setExpiryDays] = useState('30');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('Valid for 30 days. Payment terms Net 15 days upon invoice.');
  const [error, setError] = useState<string | null>(null);

  const selectedCustomer = db.customers.find((c) => c.id === customerId);
  const isIntraState = selectedCustomer?.stateCode === db.organization.stateCode;

  const [items, setItems] = useState<
    Array<{
      productId?: string;
      description: string;
      quantity: number;
      unit: string;
      rate: number;
      discount: number;
      taxRate: number;
    }>
  >([
    {
      productId: db.products[0]?.id,
      description: db.products[0]?.name || '',
      quantity: 1,
      unit: db.products[0]?.unit || 'pcs',
      rate: db.products[0]?.sellingPrice || 1000,
      discount: 0,
      taxRate: db.products[0]?.gstRate || 18,
    },
  ]);

  const handleProductSelect = (index: number, prodId: string) => {
    const prod = db.products.find((p) => p.id === prodId);
    if (!prod) return;

    const newItems = [...items];
    newItems[index] = {
      productId: prod.id,
      description: prod.name,
      quantity: 1,
      unit: prod.unit,
      rate: prod.sellingPrice,
      discount: 0,
      taxRate: prod.gstRate,
    };
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        productId: undefined,
        description: '',
        quantity: 1,
        unit: 'pcs',
        rate: 0,
        discount: 0,
        taxRate: 18,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Calculations
  const calculations = items.map((it) =>
    calculateLineItem(it.quantity || 1, it.rate || 0, it.discount || 0, it.taxRate || 0, isIntraState)
  );

  const subtotal = calculations.reduce((acc, c) => acc + c.taxableAmount, 0);
  const totalTax = calculations.reduce((acc, c) => acc + c.totalTax, 0);
  const grandTotal = subtotal + totalTax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError('Please select a customer.');
      return;
    }

    if (items.some((it) => !it.description.trim() || it.rate <= 0)) {
      setError('Each line item must have a valid description and positive rate.');
      return;
    }

    try {
      if (mode === 'quote') {
        const expiryDate = new Date(new Date(date).getTime() + parseInt(expiryDays) * 86400000).toISOString();
        const quote = createQuote({
          customerId,
          date: new Date(date).toISOString(),
          expiryDate,
          items: items.map((it) => ({
            productId: it.productId,
            description: it.description,
            quantity: Number(it.quantity),
            unit: it.unit,
            rate: Number(it.rate),
            discount: Number(it.discount),
            taxRate: Number(it.taxRate),
          })),
          notes,
          terms,
        });
        onSuccess(quote);
      } else {
        createSalesOrder({
          customerId,
          date: new Date(date).toISOString(),
          items: items.map((it) => ({
            productId: it.productId,
            description: it.description,
            quantity: Number(it.quantity),
            unit: it.unit,
            rate: Number(it.rate),
            discount: Number(it.discount),
            taxRate: Number(it.taxRate),
          })),
          notes,
        });
        // trigger success with any quote or refreshed callback
        onSuccess({} as any);
      }
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              {mode === 'quote' ? 'Create Sales Quotation' : 'Create Sales Order'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer and Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Customer *</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {db.customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customerName} ({c.state} - {c.stateCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quote Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {mode === 'quote' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Validity (Days)</label>
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="7">7 Days</option>
                  <option value="15">15 Days</option>
                  <option value="30">30 Days</option>
                  <option value="60">60 Days</option>
                </select>
              </div>
            )}
          </div>

          {/* Place of Supply Info banner */}
          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-blue-800 flex items-center justify-between">
            <span>
              Customer State: <strong>{selectedCustomer?.state}</strong> ({selectedCustomer?.stateCode})
            </span>
            <span className="font-bold text-xs">
              Tax Regime:{' '}
              {isIntraState
                ? 'Intra-State (CGST + SGST)'
                : 'Inter-State (IGST Integrated)'}
            </span>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Line Items
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-2.5 w-1/4">Catalog / Description</th>
                    <th className="p-2.5 w-20">Qty</th>
                    <th className="p-2.5 w-20">Unit</th>
                    <th className="p-2.5 w-28">Rate (₹)</th>
                    <th className="p-2.5 w-20">Disc (%)</th>
                    <th className="p-2.5 w-24">GST Rate</th>
                    <th className="p-2.5 text-right w-28">Total (₹)</th>
                    <th className="p-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => {
                    const lineTotal = calculations[idx]?.total || 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 space-y-1">
                          <select
                            value={item.productId || ''}
                            onChange={(e) => handleProductSelect(idx, e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded-md text-xs bg-slate-50"
                          >
                            <option value="">Custom Item...</option>
                            {db.products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (₹{p.sellingPrice})
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Item description..."
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded-md text-xs"
                          />
                        </td>

                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 1)}
                            className="w-full p-1.5 border border-slate-200 rounded-md font-mono text-center"
                          />
                        </td>

                        <td className="p-2">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded-md text-center"
                          />
                        </td>

                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => handleItemChange(idx, 'rate', parseFloat(e.target.value) || 0)}
                            className="w-full p-1.5 border border-slate-200 rounded-md font-mono"
                          />
                        </td>

                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount}
                            onChange={(e) => handleItemChange(idx, 'discount', parseFloat(e.target.value) || 0)}
                            className="w-full p-1.5 border border-slate-200 rounded-md font-mono text-center"
                          />
                        </td>

                        <td className="p-2">
                          <select
                            value={item.taxRate}
                            onChange={(e) => handleItemChange(idx, 'taxRate', parseFloat(e.target.value))}
                            className="w-full p-1.5 border border-slate-200 rounded-md font-mono"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>

                        <td className="p-2 text-right font-mono font-bold text-slate-800">
                          {formatINR(lineTotal)}
                        </td>

                        <td className="p-2 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="w-full sm:w-1/2 space-y-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Terms & Conditions</label>
                <textarea
                  rows={2}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Notes</label>
                <input
                  type="text"
                  placeholder="Additional notes for quotation..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="w-full sm:w-80 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 font-mono text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Subtotal:</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST ({isIntraState ? 'CGST+SGST' : 'IGST'}):</span>
                <span>{formatINR(totalTax)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-blue-700">{formatINR(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
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
              {mode === 'quote' ? 'Generate Quotation' : 'Confirm Sales Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
