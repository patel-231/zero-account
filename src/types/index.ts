export type RoleType =
  | 'OWNER'
  | 'ADMIN'
  | 'ACCOUNTANT'
  | 'SALES_MANAGER'
  | 'SALES_STAFF'
  | 'INVENTORY_MANAGER'
  | 'VIEWER';

export type AccountType =
  | 'ASSET'
  | 'LIABILITY'
  | 'EQUITY'
  | 'INCOME'
  | 'EXPENSE';

export type JournalStatus = 'DRAFT' | 'POSTED' | 'REVERSED';

export type InvoiceStatus =
  | 'DRAFT'
  | 'SENT'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export type QuoteStatus =
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED';

export type SalesOrderStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'FULFILLED'
  | 'CANCELLED';

export type ProductType = 'PRODUCT' | 'SERVICE';

export type StockMovementType =
  | 'OPENING'
  | 'PURCHASE'
  | 'SALE'
  | 'SALES_RETURN'
  | 'PURCHASE_RETURN'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT';

export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'UPI'
  | 'CARD'
  | 'CHEQUE'
  | 'OTHER';

export type GSTRegistrationType =
  | 'REGULAR'
  | 'COMPOSITION'
  | 'UNREGISTERED'
  | 'OVERSEAS'
  | 'SEZ';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: RoleType;
}

export interface Organization {
  id: string;
  name: string;
  legalName?: string;
  businessType?: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state: string; // e.g. "Gujarat"
  stateCode: string; // e.g. "24"
  country: string;
  pinCode?: string;
  pan?: string;
  gstin?: string;
  gstRegistrationType: GSTRegistrationType;
  financialYear: string;
  currency: string;
  currencySymbol: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  defaultTaxRate: number;
  defaultPaymentTerms: string;
}

export interface Customer {
  id: string;
  organizationId: string;
  customerCode: string;
  customerName: string;
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  billingAddress?: string;
  shippingAddress?: string;
  city?: string;
  state: string;
  stateCode: string;
  country: string;
  pinCode?: string;
  gstin?: string;
  pan?: string;
  gstRegistrationType: GSTRegistrationType;
  paymentTerms?: string;
  creditLimit: number;
  openingBalance: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  organizationId: string;
  vendorCode: string;
  vendorName: string;
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  state: string;
  stateCode: string;
  country: string;
  pinCode?: string;
  gstin?: string;
  pan?: string;
  gstRegistrationType: GSTRegistrationType;
  paymentTerms?: string;
  creditLimit: number;
  openingBalance: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
}

export interface Warehouse {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  organizationId: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  type: ProductType;
  categoryId?: string;
  brand?: string;
  unit: string;
  hsnSac?: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  gstRate: number; // e.g. 18.0
  trackInventory: boolean;
  allowNegativeStock: boolean;
  openingStock: number;
  minimumStock: number;
  warehouseId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  organizationId: string;
  productId: string;
  warehouseId: string;
  quantity: number; // positive = added, negative = deducted
  movementType: StockMovementType;
  referenceType?: string; // INVOICE, PURCHASE, ADJUSTMENT, TRANSFER
  referenceId?: string;
  unitCost: number;
  date: string;
  createdBy?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId?: string;
  productName: string;
  description?: string;
  hsnSac?: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number; // in percentage or fixed
  discountType?: 'PERCENT' | 'FIXED';
  taxRate: number; // e.g. 18.0
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface Invoice {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  billingAddress?: string;
  shippingAddress?: string;
  gstin?: string;
  placeOfSupply: string; // state name or code
  isIntraState: boolean;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  roundOff: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  notes?: string;
  terms?: string;
  quoteId?: string;
  salesOrderId?: string;
  journalEntryId?: string;
  createdBy?: string;
  postedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  organizationId: string;
  customerId: string;
  customerName: string;
  invoiceId?: string;
  invoiceNumber?: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  bankAccountId?: string;
  bankAccountName?: string;
  reference?: string;
  notes?: string;
  journalEntryId?: string;
  createdBy?: string;
  createdAt: string;
}

export interface QuoteItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  taxRate: number;
  taxableAmount: number;
  total: number;
}

export interface Quote {
  id: string;
  organizationId: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  expiryDate?: string;
  status: QuoteStatus;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string;
  terms?: string;
  convertedInvoiceId?: string;
  createdAt: string;
}

export interface SalesOrderItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  taxRate: number;
  taxableAmount: number;
  total: number;
}

export interface SalesOrder {
  id: string;
  organizationId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  status: SalesOrderStatus;
  items: SalesOrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string;
  convertedInvoiceId?: string;
  createdAt: string;
}

export interface CreditNote {
  id: string;
  organizationId: string;
  creditNoteNumber: string;
  customerId: string;
  customerName: string;
  invoiceId: string;
  invoiceNumber: string;
  date: string;
  reason: string;
  subtotal: number;
  tax: number;
  total: number;
  journalEntryId?: string;
  createdAt: string;
}

export interface Account {
  id: string;
  organizationId: string;
  code: string; // e.g. "1000", "1100", "4000"
  name: string; // e.g. "Cash", "Bank", "Accounts Receivable"
  type: AccountType;
  parentId?: string;
  isSystemAccount: boolean;
  isActive: boolean;
  currentBalance?: number;
}

export interface JournalEntryLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  description?: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  organizationId: string;
  entryNumber: string;
  date: string;
  referenceType?: 'INVOICE' | 'PAYMENT' | 'CREDIT_NOTE' | 'REVERSAL' | 'MANUAL' | 'PURCHASE';
  referenceId?: string;
  referenceDisplay?: string;
  description: string;
  status: JournalStatus;
  reversalOfId?: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  createdBy?: string;
  postedAt?: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  organizationId: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  openingBalance: number;
  currentBalance: number;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId?: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  metadata?: string;
}

export interface GSTSummaryItem {
  rate: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
}

export interface TrialBalanceItem {
  accountId: string;
  code: string;
  name: string;
  type: AccountType;
  debit: number;
  credit: number;
}

export interface ProfitAndLossStatement {
  period: string;
  revenue: {
    salesRevenue: number;
    serviceRevenue: number;
    otherIncome: number;
    totalRevenue: number;
  };
  costOfGoodsSold: {
    purchases: number;
    directExpenses: number;
    totalCOGS: number;
  };
  grossProfit: number;
  operatingExpenses: {
    rent: number;
    salary: number;
    utilities: number;
    marketing: number;
    transport: number;
    officeExpenses: number;
    travel: number;
    miscellaneous: number;
    totalOperatingExpenses: number;
  };
  netProfit: number;
}

export interface BalanceSheetStatement {
  asOfDate: string;
  assets: {
    currentAssets: {
      cash: number;
      bank: number;
      accountsReceivable: number;
      inventory: number;
      totalCurrentAssets: number;
    };
    fixedAssets: number;
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: {
      accountsPayable: number;
      gstPayable: number;
      totalCurrentLiabilities: number;
    };
    longTermLoans: number;
    totalLiabilities: number;
  };
  equity: {
    ownerCapital: number;
    retainedEarnings: number;
    currentProfit: number;
    drawings: number;
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
  difference: number;
}

export interface CustomerOutstandingItem {
  customerId: string;
  customerName: string;
  companyName?: string;
  phone?: string;
  invoiceCount: number;
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
  overdue: number;
  oldestInvoiceDate?: string;
  overdueDays: number;
}
