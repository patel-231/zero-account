import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Layers,
  Warehouse,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Edit2,
  SlidersHorizontal,
} from 'lucide-react';
import { db } from '../../server/db';
import { Product } from '../../types';
import { formatINR } from '../../utils/money';
import { getProductStock } from '../../services/inventoryService';

interface ProductsInventoryViewProps {
  onOpenCreateProduct: () => void;
  onEditProduct: (product: Product) => void;
  onOpenStockAdjustment: (product?: Product) => void;
  defaultSubTab?: 'products' | 'movements' | 'warehouses';
}

export const ProductsInventoryView: React.FC<ProductsInventoryViewProps> = ({
  onOpenCreateProduct,
  onEditProduct,
  onOpenStockAdjustment,
  defaultSubTab = 'products',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'movements' | 'warehouses'>(defaultSubTab);

  React.useEffect(() => {
    setActiveSubTab(defaultSubTab);
  }, [defaultSubTab]);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = db.products.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.hsnSac && p.hsnSac.includes(q))
    );
  });

  const lowStockCount = db.products.filter((p) => {
    if (p.type !== 'PRODUCT') return false;
    const stock = getProductStock(p.id).currentStock;
    return stock <= p.minimumStock;
  }).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inventory & Catalog</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage goods, services, GST HSN/SAC codes, warehouses, and stock movements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenStockAdjustment()}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Stock Adjustment</span>
          </button>

          <button
            onClick={onOpenCreateProduct}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Item</span>
          </button>
        </div>
      </div>

      {/* Low stock warning banner */}
      {lowStockCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Inventory Warning:</strong> {lowStockCount} items have reached or breached their minimum safety stock threshold.
            </span>
          </div>
          <button
            onClick={() => onOpenStockAdjustment()}
            className="font-bold underline hover:text-amber-950"
          >
            Adjust Stock Now &rarr;
          </button>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('products')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition ${
            activeSubTab === 'products'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Catalog Items ({db.products.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('movements')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition ${
            activeSubTab === 'movements'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Stock Ledger & Movements ({db.stockMovements.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('warehouses')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition ${
            activeSubTab === 'warehouses'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>Warehouses & Locations ({db.warehouses.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: PRODUCTS LIST */}
      {activeSubTab === 'products' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400 ml-2" />
            <input
              type="text"
              placeholder="Search items by name, SKU, or HSN/SAC code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3.5">SKU</th>
                    <th className="p-3.5">Item Name & Type</th>
                    <th className="p-3.5">HSN/SAC</th>
                    <th className="p-3.5 text-right">Selling Price</th>
                    <th className="p-3.5 text-right">Cost Price</th>
                    <th className="p-3.5 text-center">GST Rate</th>
                    <th className="p-3.5 text-right">Stock</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const stockInfo = getProductStock(p.id);
                    const isLowStock = p.type === 'PRODUCT' && stockInfo.isLowStock;
                    const isOutOfStock = p.type === 'PRODUCT' && stockInfo.isOutOfStock;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        {/* SKU */}
                        <td className="p-3.5 font-mono font-bold text-slate-500">{p.sku}</td>

                        {/* Name & Type */}
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {p.type === 'SERVICE' ? 'Service' : `Physical Good (${p.unit})`}
                          </div>
                        </td>

                        {/* HSN/SAC */}
                        <td className="p-3.5 font-mono text-slate-600">{p.hsnSac || '-'}</td>

                        {/* Selling Price */}
                        <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                          {formatINR(p.sellingPrice)}
                        </td>

                        {/* Cost Price */}
                        <td className="p-3.5 text-right font-mono text-slate-500">
                          {p.purchasePrice ? formatINR(p.purchasePrice) : '-'}
                        </td>

                        {/* GST */}
                        <td className="p-3.5 text-center font-medium text-slate-700">
                          {p.gstRate}%
                        </td>

                        {/* Stock */}
                        <td className="p-3.5 text-right font-mono font-bold">
                          {p.type === 'SERVICE' ? (
                            <span className="text-slate-400 font-normal">N/A</span>
                          ) : (
                            <span
                              className={
                                isOutOfStock
                                  ? 'text-rose-600'
                                  : isLowStock
                                  ? 'text-amber-600'
                                  : 'text-emerald-700'
                              }
                            >
                              {stockInfo.currentStock} {p.unit}
                            </span>
                          )}
                        </td>

                        {/* Status badge */}
                        <td className="p-3.5 text-center">
                          {p.type === 'SERVICE' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
                              Service
                            </span>
                          ) : isOutOfStock ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              In Stock
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {p.type === 'PRODUCT' && (
                              <button
                                onClick={() => onOpenStockAdjustment(p)}
                                title="Adjust Stock"
                                className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => onEditProduct(p)}
                              title="Edit Item"
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: STOCK LEDGER MOVEMENTS */}
      {activeSubTab === 'movements' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Immutable Stock Movement Log
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              FIFO Inventory Valuation Tracking
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Product Name</th>
                  <th className="p-3.5">Movement Type</th>
                  <th className="p-3.5">Reference / Doc</th>
                  <th className="p-3.5 text-right">Quantity</th>
                  <th className="p-3.5 text-right">Unit Cost (₹)</th>
                  <th className="p-3.5">Warehouse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {db.stockMovements.map((sm) => {
                  const prod = db.products.find((p) => p.id === sm.productId);
                  const wh = db.warehouses.find((w) => w.id === sm.warehouseId);
                  const isPositive = sm.quantity > 0;

                  return (
                    <tr key={sm.id} className="hover:bg-slate-50">
                      <td className="p-3.5 text-slate-500 font-mono">
                        {new Date(sm.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">{prod?.name || sm.productId}</td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sm.movementType === 'SALE'
                              ? 'bg-rose-50 text-rose-700'
                              : sm.movementType === 'PURCHASE' || sm.movementType === 'OPENING'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3 text-rose-600" />
                          )}
                          {sm.movementType}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-blue-600 font-semibold">
                        {sm.referenceId || sm.referenceType || '-'}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold">
                        <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                          {isPositive ? `+${sm.quantity}` : sm.quantity} {prod?.unit}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-700">
                        {sm.unitCost ? formatINR(sm.unitCost) : '-'}
                      </td>
                      <td className="p-3.5 text-slate-500">{wh?.name || sm.warehouseId || 'Main'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: WAREHOUSES */}
      {activeSubTab === 'warehouses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {db.warehouses.map((wh) => (
            <div key={wh.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Warehouse className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">{wh.name}</h3>
                </div>
                {wh.isActive && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                    Primary / Active
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-600">
                <div>{wh.address}</div>
                <div>
                  {wh.city}, {wh.state} - {wh.pinCode}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                <span>Code: {wh.code}</span>
                <span className="text-emerald-600 font-semibold">Active Facility</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
