import React, { useState } from 'react';
import { X, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '../../server/db';
import { recordStockMovement, getProductStock } from '../../services/inventoryService';
import { Product } from '../../types';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedProduct?: Product | null;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedProduct,
}) => {
  if (!isOpen) return null;

  const physicalProducts = db.products.filter((p) => p.type === 'PRODUCT');
  const [productId, setProductId] = useState<string>(
    selectedProduct?.id || physicalProducts[0]?.id || ''
  );
  const [warehouseId, setWarehouseId] = useState<string>(db.warehouses[0]?.id || 'wh-1');
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'REMOVE'>('ADD');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('PHYSICAL_COUNT_ADJUSTMENT');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const product = db.products.find((p) => p.id === productId);
  const currentStock = product ? getProductStock(product.id, warehouseId).currentStock : 0;
  const projectedStock =
    adjustmentType === 'ADD' ? currentStock + quantity : currentStock - quantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!productId) throw new Error('Please select a product.');
      if (quantity <= 0) throw new Error('Quantity must be greater than zero.');
      if (adjustmentType === 'REMOVE' && !product?.allowNegativeStock && quantity > currentStock) {
        throw new Error(`Cannot reduce stock below 0. Available: ${currentStock}`);
      }

      recordStockMovement({
        productId,
        warehouseId,
        movementType: adjustmentType === 'ADD' ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
        quantity: adjustmentType === 'ADD' ? quantity : -quantity,
        referenceType: 'ADJUSTMENT',
        referenceId: `ADJ-${Date.now().toString().slice(-6)}`,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Adjust Inventory Stock</h2>
              <p className="text-xs text-slate-500">Record stock increase or write-off</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Select */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Product</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              required
            >
              {physicalProducts.map((p) => {
                const stock = getProductStock(p.id).currentStock;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} (Current: {stock} {p.unit})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Adjustment Mode */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Adjustment Action</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('ADD')}
                className={`py-2 px-3 rounded-lg border text-center font-bold transition ${
                  adjustmentType === 'ADD'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                + Stock In (Increase)
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('REMOVE')}
                className={`py-2 px-3 rounded-lg border text-center font-bold transition ${
                  adjustmentType === 'REMOVE'
                    ? 'bg-rose-50 border-rose-500 text-rose-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                - Stock Out (Decrease)
              </button>
            </div>
          </div>

          {/* Quantity & Stock preview */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg text-right font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Warehouse</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                {db.warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Current vs Projected preview card */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-slate-500 text-[10px]">Current Stock</div>
              <div className="font-mono font-bold text-slate-800">{currentStock} {product?.unit}</div>
            </div>
            <div className="text-slate-400 font-bold">&rarr;</div>
            <div>
              <div className="text-slate-500 text-[10px]">New Projected Stock</div>
              <div className={`font-mono font-bold ${projectedStock < 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                {projectedStock} {product?.unit}
              </div>
            </div>
          </div>

          {/* Reason & Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="PHYSICAL_COUNT_ADJUSTMENT">Physical Stock Count Correction</option>
              <option value="DAMAGED_OR_EXPIRED">Damaged or Broken Goods</option>
              <option value="INTERNAL_USE">Internal Office / Testing Use</option>
              <option value="RETURN_TO_SUPPLIER">Return to Vendor</option>
              <option value="OTHER">Other Reason</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Audit verified by store manager"
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Apply Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
