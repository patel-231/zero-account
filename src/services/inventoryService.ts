import Decimal from 'decimal.js';
import { db } from '../server/db';
import { StockMovement, StockMovementType, Product } from '../types';

export class InventoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InventoryError';
  }
}

/**
 * Calculate accurate current stock for a product from stock movements
 */
export function getProductStock(productId: string, warehouseId?: string): {
  productId: string;
  currentStock: number;
  minimumStock: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
} {
  const prod = db.products.find((p) => p.id === productId);
  if (!prod) throw new InventoryError(`Product not found: ${productId}`);

  if (prod.type === 'SERVICE') {
    return {
      productId: prod.id,
      currentStock: 999999, // Services have unlimited virtual stock
      minimumStock: 0,
      isLowStock: false,
      isOutOfStock: false,
    };
  }

  let totalQty = new Decimal(0);

  for (const mov of db.stockMovements) {
    if (mov.productId !== productId) continue;
    if (warehouseId && mov.warehouseId !== warehouseId) continue;

    totalQty = totalQty.plus(new Decimal(mov.quantity));
  }

  const stock = totalQty.toDecimalPlaces(3).toNumber();
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= prod.minimumStock;

  return {
    productId: prod.id,
    currentStock: stock,
    minimumStock: prod.minimumStock,
    isLowStock,
    isOutOfStock,
  };
}

/**
 * Record a validated stock movement transaction
 */
export function recordStockMovement(params: {
  productId: string;
  warehouseId?: string;
  quantity: number; // positive to add, negative to deduct
  movementType: StockMovementType;
  referenceType?: string;
  referenceId?: string;
  unitCost?: number;
}): StockMovement {
  const prod = db.products.find((p) => p.id === params.productId);
  if (!prod) throw new InventoryError(`Product not found: ${params.productId}`);

  // If service, ignore inventory movement
  if (prod.type === 'SERVICE') {
    return {
      id: `mov-srv-${Date.now()}`,
      organizationId: db.organization.id,
      productId: prod.id,
      warehouseId: '',
      quantity: 0,
      movementType: params.movementType,
      unitCost: 0,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }

  const warehouseId = params.warehouseId || prod.warehouseId || db.warehouses[0]?.id || 'wh-1';

  // Check negative stock prevention if quantity is negative
  if (params.quantity < 0 && !prod.allowNegativeStock) {
    const currentStock = getProductStock(prod.id, warehouseId).currentStock;
    const proposedStock = new Decimal(currentStock).plus(new Decimal(params.quantity));

    if (proposedStock.isNegative()) {
      throw new InventoryError(
        `Insufficient stock for '${prod.name}' (SKU: ${prod.sku}). Available: ${currentStock} ${prod.unit}, Requested: ${Math.abs(params.quantity)} ${prod.unit}. Negative stock is disabled for this item.`
      );
    }
  }

  const movement: StockMovement = {
    id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    organizationId: db.organization.id,
    productId: prod.id,
    warehouseId,
    quantity: params.quantity,
    movementType: params.movementType,
    referenceType: params.referenceType,
    referenceId: params.referenceId,
    unitCost: params.unitCost ?? prod.purchasePrice,
    date: new Date().toISOString(),
    createdBy: db.currentUser.name,
    createdAt: new Date().toISOString(),
  };

  db.stockMovements.unshift(movement);
  db.addAuditLog(
    'STOCK_MOVEMENT_RECORDED',
    'Product',
    prod.id,
    `${params.movementType}: ${params.quantity > 0 ? '+' : ''}${params.quantity} ${prod.unit} for ${prod.name}`
  );
  db.save();

  return movement;
}

/**
 * Get all low stock products for dashboard alerts
 */
export function getLowStockProducts(): Array<Product & { currentStock: number }> {
  const result: Array<Product & { currentStock: number }> = [];

  for (const prod of db.products) {
    if (prod.type === 'SERVICE' || !prod.trackInventory) continue;
    const stockInfo = getProductStock(prod.id);
    if (stockInfo.isLowStock || stockInfo.isOutOfStock) {
      result.push({
        ...prod,
        currentStock: stockInfo.currentStock,
      });
    }
  }

  return result;
}
