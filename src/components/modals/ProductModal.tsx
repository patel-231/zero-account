import React, { useState } from 'react';
import { X, Package, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '../../server/db';
import { Product, ProductType } from '../../types';
import { recordStockMovement } from '../../services/inventoryService';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: Product) => void;
  productToEdit?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  productToEdit,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(productToEdit?.name || '');
  const [sku, setSku] = useState(productToEdit?.sku || '');
  const [type, setType] = useState<ProductType>(productToEdit?.type || 'PRODUCT');
  const [hsnSac, setHsnSac] = useState(productToEdit?.hsnSac || '8414');
  const [unit, setUnit] = useState(productToEdit?.unit || 'pcs');
  const [sellingPrice, setSellingPrice] = useState(productToEdit?.sellingPrice || 1000);
  const [purchasePrice, setPurchasePrice] = useState(productToEdit?.purchasePrice || 600);
  const [gstRate, setGstRate] = useState(productToEdit?.gstRate || 18);
  const [initialStock, setInitialStock] = useState(productToEdit?.currentStock || 10);
  const [minimumStock, setMinimumStock] = useState(productToEdit?.minimumStock || 5);
  const [description, setDescription] = useState(productToEdit?.description || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!name.trim()) throw new Error('Product name is required.');
      const finalSku = sku.trim() || `SKU-${Date.now().toString().slice(-4)}`;

      let product: Product;

      if (productToEdit) {
        product = {
          ...productToEdit,
          name,
          sku: finalSku,
          type,
          hsnSac,
          unit,
          sellingPrice: Number(sellingPrice),
          purchasePrice: Number(purchasePrice),
          gstRate: Number(gstRate),
          minimumStock: Number(minimumStock),
          description,
          updatedAt: new Date().toISOString(),
        };

        const idx = db.products.findIndex((p) => p.id === productToEdit.id);
        if (idx !== -1) db.products[idx] = product;
        db.addAuditLog('PRODUCT_UPDATED', 'Product', product.id, `Updated product ${product.name}`);
      } else {
        product = {
          id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          organizationId: db.organization.id,
          sku: finalSku,
          name,
          description,
          type,
          hsnSac,
          unit,
          sellingPrice: Number(sellingPrice),
          purchasePrice: Number(purchasePrice),
          gstRate: Number(gstRate),
          trackInventory: type === 'PRODUCT',
          allowNegativeStock: false,
          openingStock: type === 'SERVICE' ? 0 : Number(initialStock),
          minimumStock: type === 'SERVICE' ? 0 : Number(minimumStock),
          mrp: Number(sellingPrice),
          warehouseId: db.warehouses[0]?.id || 'wh-1',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        db.products.unshift(product);

        // If product with stock, record opening stock movement
        if (type === 'PRODUCT' && Number(initialStock) > 0) {
          recordStockMovement({
            productId: product.id,
            warehouseId: db.warehouses[0]?.id || 'wh-1',
            movementType: 'OPENING',
            quantity: Number(initialStock),
            referenceType: 'OPENING',
            referenceId: 'OPENING-BALANCE',
            unitCost: Number(purchasePrice),
          });
        }

        db.addAuditLog('PRODUCT_CREATED', 'Product', product.id, `Created product ${product.name} (${product.sku})`);
      }

      db.save();
      onSuccess(product);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl my-6 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {productToEdit ? 'Edit Product / Service' : 'New Product / Service'}
              </h2>
              <p className="text-xs text-slate-500">GST HSN/SAC, pricing, and stock tracking</p>
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

          {/* Type & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Item Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ProductType)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="PRODUCT">Physical Good / Product</option>
                <option value="SERVICE">Service</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Item Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Phone Cooler Pro"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-medium"
                required
              />
            </div>
          </div>

          {/* SKU, HSN/SAC, Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SKU / Item Code</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="COOL-PRO-01"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">HSN / SAC Code</label>
              <input
                type="text"
                value={hsnSac}
                onChange={(e) => setHsnSac(e.target.value)}
                placeholder="8414 or 9983"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="box">Boxes (box)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="mtr">Meters (mtr)</option>
                <option value="hrs">Hours (hrs)</option>
                <option value="nos">Numbers (nos)</option>
              </select>
            </div>
          </div>

          {/* Prices & GST */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-800">Pricing & GST Rate</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Selling Price (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase / Cost Price (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GST Tax Rate</label>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(parseFloat(e.target.value))}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option value={0}>0% (Exempt / Nil)</option>
                  <option value={5}>5% GST</option>
                  <option value={12}>12% GST</option>
                  <option value={18}>18% GST (Standard)</option>
                  <option value={28}>28% GST</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stock Tracking (only if PRODUCT) */}
          {type === 'PRODUCT' && (
            <div className="grid grid-cols-2 gap-3">
              {!productToEdit && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Opening Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={initialStock}
                    onChange={(e) => setInitialStock(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg font-medium"
                  />
                </div>
              )}

              <div className={productToEdit ? 'col-span-2' : ''}>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reorder Level / Minimum Stock
                </label>
                <input
                  type="number"
                  value={minimumStock}
                  onChange={(e) => setMinimumStock(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg font-medium"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Product technical specifications, description..."
              className="w-full text-xs p-2 border border-slate-300 rounded-lg"
            />
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
              className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs flex items-center gap-1.5 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              {productToEdit ? 'Save Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
