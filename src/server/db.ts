import {
  Organization,
  User,
  Account,
  Customer,
  Vendor,
  Product,
  ProductCategory,
  Warehouse,
  StockMovement,
  Invoice,
  Payment,
  CreditNote,
  Quote,
  SalesOrder,
  JournalEntry,
  AuditLog,
  BankAccount,
} from '../types';

export const DEFAULT_ORG: Organization = {
  id: 'org-zerobooks-demo',
  name: 'Zero Demo Pvt Ltd',
  legalName: 'Zero Demo Private Limited',
  businessType: 'Private Limited Company',
  email: 'accounts@zerodemo.in',
  phone: '+91 98765 43210',
  website: 'https://zerodemo.in',
  address: 'Plot 104, GIDC Industrial Estate, Makarpura',
  city: 'Vadodara',
  state: 'Gujarat',
  stateCode: '24',
  country: 'India',
  pinCode: '390010',
  pan: 'AAACZ1234F',
  gstin: '24AAACZ1234F1Z5',
  gstRegistrationType: 'REGULAR',
  financialYear: '2025-2026',
  currency: 'INR',
  currencySymbol: '₹',
  invoicePrefix: 'INV-2026-',
  nextInvoiceNumber: 1004,
  defaultTaxRate: 18,
  defaultPaymentTerms: 'Net 15 Days',
};

export const CURRENT_USER: User = {
  id: 'usr-admin-1',
  email: 'ompatel787877@gmail.com',
  name: 'Om Patel',
  role: 'OWNER',
};

export const DEFAULT_CHART_OF_ACCOUNTS: Account[] = [
  // ASSETS (1000s)
  { id: 'acc-1000', organizationId: DEFAULT_ORG.id, code: '1000', name: 'Cash on Hand', type: 'ASSET', isSystemAccount: true, isActive: true },
  { id: 'acc-1010', organizationId: DEFAULT_ORG.id, code: '1010', name: 'HDFC Bank - Current A/c', type: 'ASSET', isSystemAccount: true, isActive: true },
  { id: 'acc-1100', organizationId: DEFAULT_ORG.id, code: '1100', name: 'Accounts Receivable', type: 'ASSET', isSystemAccount: true, isActive: true },
  { id: 'acc-1200', organizationId: DEFAULT_ORG.id, code: '1200', name: 'Inventory Asset', type: 'ASSET', isSystemAccount: true, isActive: true },
  { id: 'acc-1500', organizationId: DEFAULT_ORG.id, code: '1500', name: 'Fixed Assets & Machinery', type: 'ASSET', isSystemAccount: false, isActive: true },

  // LIABILITIES (2000s)
  { id: 'acc-2000', organizationId: DEFAULT_ORG.id, code: '2000', name: 'Accounts Payable', type: 'LIABILITY', isSystemAccount: true, isActive: true },
  { id: 'acc-2100', organizationId: DEFAULT_ORG.id, code: '2100', name: 'GST Payable', type: 'LIABILITY', isSystemAccount: true, isActive: true },
  { id: 'acc-2110', organizationId: DEFAULT_ORG.id, code: '2110', name: 'Input CGST', type: 'LIABILITY', isSystemAccount: true, isActive: true },
  { id: 'acc-2111', organizationId: DEFAULT_ORG.id, code: '2111', name: 'Input SGST', type: 'LIABILITY', isSystemAccount: true, isActive: true },
  { id: 'acc-2112', organizationId: DEFAULT_ORG.id, code: '2112', name: 'Input IGST', type: 'LIABILITY', isSystemAccount: true, isActive: true },
  { id: 'acc-2120', organizationId: DEFAULT_ORG.id, code: '2120', name: 'Output CGST', type: 'LIABILITY', isSystemAccount: true, isActive: true },
  { id: 'acc-2121', organizationId: DEFAULT_ORG.id, code: '2121', name: 'Output SGST', type: 'LIABILITY', isSystemAccount: true, isActive: true },
  { id: 'acc-2122', organizationId: DEFAULT_ORG.id, code: '2122', name: 'Output IGST', type: 'LIABILITY', isSystemAccount: true, isActive: true },
  { id: 'acc-2200', organizationId: DEFAULT_ORG.id, code: '2200', name: 'Bank Term Loans', type: 'LIABILITY', isSystemAccount: false, isActive: true },

  // EQUITY (3000s)
  { id: 'acc-3000', organizationId: DEFAULT_ORG.id, code: '3000', name: 'Owner Capital', type: 'EQUITY', isSystemAccount: true, isActive: true },
  { id: 'acc-3100', organizationId: DEFAULT_ORG.id, code: '3100', name: 'Retained Earnings', type: 'EQUITY', isSystemAccount: true, isActive: true },
  { id: 'acc-3200', organizationId: DEFAULT_ORG.id, code: '3200', name: 'Owner Drawings', type: 'EQUITY', isSystemAccount: false, isActive: true },

  // INCOME (4000s)
  { id: 'acc-4000', organizationId: DEFAULT_ORG.id, code: '4000', name: 'Sales Revenue', type: 'INCOME', isSystemAccount: true, isActive: true },
  { id: 'acc-4100', organizationId: DEFAULT_ORG.id, code: '4100', name: 'Service Revenue', type: 'INCOME', isSystemAccount: true, isActive: true },
  { id: 'acc-4200', organizationId: DEFAULT_ORG.id, code: '4200', name: 'Other Income', type: 'INCOME', isSystemAccount: false, isActive: true },

  // EXPENSES (5000s)
  { id: 'acc-5000', organizationId: DEFAULT_ORG.id, code: '5000', name: 'Cost of Goods Sold / Purchases', type: 'EXPENSE', isSystemAccount: true, isActive: true },
  { id: 'acc-5100', organizationId: DEFAULT_ORG.id, code: '5100', name: 'Office Rent Expense', type: 'EXPENSE', isSystemAccount: false, isActive: true },
  { id: 'acc-5200', organizationId: DEFAULT_ORG.id, code: '5200', name: 'Employee Salaries & Wages', type: 'EXPENSE', isSystemAccount: false, isActive: true },
  { id: 'acc-5300', organizationId: DEFAULT_ORG.id, code: '5300', name: 'Electricity & Power', type: 'EXPENSE', isSystemAccount: false, isActive: true },
  { id: 'acc-5400', organizationId: DEFAULT_ORG.id, code: '5400', name: 'Internet & Telecom', type: 'EXPENSE', isSystemAccount: false, isActive: true },
  { id: 'acc-5500', organizationId: DEFAULT_ORG.id, code: '5500', name: 'Marketing & Digital Ads', type: 'EXPENSE', isSystemAccount: false, isActive: true },
  { id: 'acc-5600', organizationId: DEFAULT_ORG.id, code: '5600', name: 'Transport & Courier', type: 'EXPENSE', isSystemAccount: false, isActive: true },
  { id: 'acc-5700', organizationId: DEFAULT_ORG.id, code: '5700', name: 'Office Supplies & Stationeries', type: 'EXPENSE', isSystemAccount: false, isActive: true },
  { id: 'acc-5800', organizationId: DEFAULT_ORG.id, code: '5800', name: 'Travel & Lodging', type: 'EXPENSE', isSystemAccount: false, isActive: true },
  { id: 'acc-5900', organizationId: DEFAULT_ORG.id, code: '5900', name: 'Miscellaneous Expenses', type: 'EXPENSE', isSystemAccount: false, isActive: true },
];

export const INITIAL_CATEGORIES: ProductCategory[] = [
  { id: 'cat-1', organizationId: DEFAULT_ORG.id, name: 'Electronics & Hardware', description: 'Gadgets, accessories and thermal hardware' },
  { id: 'cat-2', organizationId: DEFAULT_ORG.id, name: 'Packaging Supplies', description: 'Boxes, tapes, corrugated materials' },
  { id: 'cat-3', organizationId: DEFAULT_ORG.id, name: 'IT & Consulting Services', description: 'Software design and cloud consulting' },
];

export const INITIAL_WAREHOUSES: Warehouse[] = [
  { id: 'wh-1', organizationId: DEFAULT_ORG.id, name: 'Main Central Hub', code: 'WH-MAIN', address: 'Plot 104 GIDC Makarpura', city: 'Vadodara', state: 'Gujarat', pinCode: '390010', isActive: true },
  { id: 'wh-2', organizationId: DEFAULT_ORG.id, name: 'Bhiwandi Fulfillment Center', code: 'WH-WEST', address: 'Building B, Logistics Park', city: 'Thane', state: 'Maharashtra', pinCode: '421302', isActive: true },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    organizationId: DEFAULT_ORG.id,
    customerCode: 'CUST-001',
    customerName: 'ABC Traders',
    companyName: 'ABC Traders Pvt Ltd',
    contactPerson: 'Ramesh Patel',
    email: 'ramesh@abctraders.in',
    phone: '+91 98250 11223',
    whatsapp: '+91 98250 11223',
    billingAddress: '42 Sardar Patel Ring Road, Satellite',
    shippingAddress: '42 Sardar Patel Ring Road, Satellite',
    city: 'Ahmedabad',
    state: 'Gujarat',
    stateCode: '24', // Intra-state relative to Gujarat 24
    country: 'India',
    pinCode: '380015',
    gstin: '24AABCA1122D1Z8',
    pan: 'AABCA1122D',
    gstRegistrationType: 'REGULAR',
    paymentTerms: 'Net 15 Days',
    creditLimit: 200000,
    openingBalance: 0,
    notes: 'Premium distributor in Ahmedabad region',
    isActive: true,
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'cust-2',
    organizationId: DEFAULT_ORG.id,
    customerCode: 'CUST-002',
    customerName: 'Shree Enterprises',
    companyName: 'Shree Enterprises LLC',
    contactPerson: 'Sanjay Shah',
    email: 'contact@shree-ent.in',
    phone: '+91 94260 55667',
    billingAddress: '15 M.G. Road, Fort',
    city: 'Mumbai',
    state: 'Maharashtra',
    stateCode: '27', // Inter-state relative to Gujarat 24!
    country: 'India',
    pinCode: '400001',
    gstin: '27AABCS9988E1Z1',
    pan: 'AABCS9988E',
    gstRegistrationType: 'REGULAR',
    paymentTerms: 'Net 30 Days',
    creditLimit: 500000,
    openingBalance: 0,
    notes: 'Interstate client located in Mumbai',
    isActive: true,
    createdAt: '2026-01-15T11:30:00Z',
    updatedAt: '2026-01-15T11:30:00Z',
  },
  {
    id: 'cust-3',
    organizationId: DEFAULT_ORG.id,
    customerCode: 'CUST-003',
    customerName: 'Patel Electronics',
    companyName: 'Patel Electronics Retail',
    contactPerson: 'Bhavin Patel',
    email: 'info@patelelectronics.com',
    phone: '+91 98980 44332',
    billingAddress: 'Shop 12, Express Commercial Complex, Alkapuri',
    city: 'Vadodara',
    state: 'Gujarat',
    stateCode: '24',
    country: 'India',
    pinCode: '390007',
    gstin: '24AABCP4433K1Z4',
    pan: 'AABCP4433K',
    gstRegistrationType: 'REGULAR',
    paymentTerms: 'Immediate',
    creditLimit: 150000,
    openingBalance: 0,
    notes: 'Local retail partner',
    isActive: true,
    createdAt: '2026-02-01T09:15:00Z',
    updatedAt: '2026-02-01T09:15:00Z',
  },
];

export const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'vend-1',
    organizationId: DEFAULT_ORG.id,
    vendorCode: 'VEND-001',
    vendorName: 'XYZ Supplies',
    companyName: 'XYZ Supplies India Pvt Ltd',
    contactPerson: 'Kunal Verma',
    email: 'sales@xyzsupplies.com',
    phone: '+91 99090 88776',
    address: '88 Industrial Area, Phase II',
    city: 'Surat',
    state: 'Gujarat',
    stateCode: '24',
    country: 'India',
    pinCode: '395002',
    gstin: '24AABCX7788P1Z9',
    pan: 'AABCX7788P',
    gstRegistrationType: 'REGULAR',
    paymentTerms: 'Net 30 Days',
    creditLimit: 300000,
    openingBalance: 0,
    notes: 'Primary component fabricator',
    isActive: true,
    createdAt: '2026-01-05T08:00:00Z',
    updatedAt: '2026-01-05T08:00:00Z',
  },
  {
    id: 'vend-2',
    organizationId: DEFAULT_ORG.id,
    vendorCode: 'VEND-002',
    vendorName: 'Global Packaging',
    companyName: 'Global Paper & Carton Works',
    contactPerson: 'Pooja Mehta',
    email: 'orders@globalpackaging.in',
    phone: '+91 98240 77665',
    address: '4 GIDC Vapi',
    city: 'Vapi',
    state: 'Gujarat',
    stateCode: '24',
    country: 'India',
    pinCode: '396195',
    gstin: '24AABCG5544R1Z0',
    pan: 'AABCG5544R',
    gstRegistrationType: 'REGULAR',
    paymentTerms: 'Net 15 Days',
    creditLimit: 100000,
    openingBalance: 0,
    notes: 'Corrugated cartons supplier',
    isActive: true,
    createdAt: '2026-01-08T09:00:00Z',
    updatedAt: '2026-01-08T09:00:00Z',
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    organizationId: DEFAULT_ORG.id,
    sku: 'HW-COOL-001',
    barcode: '8901234567890',
    name: 'Phone Cooler Pro',
    description: 'Semiconductor mobile thermoelectric phone cooler with digital temperature LED display',
    type: 'PRODUCT',
    categoryId: 'cat-1',
    brand: 'FrostGear',
    unit: 'pcs',
    hsnSac: '8414',
    purchasePrice: 6500,
    sellingPrice: 10000,
    mrp: 12999,
    gstRate: 18,
    trackInventory: true,
    allowNegativeStock: false,
    openingStock: 100,
    minimumStock: 15,
    warehouseId: 'wh-1',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'prod-2',
    organizationId: DEFAULT_ORG.id,
    sku: 'HW-STAND-002',
    barcode: '8901234567891',
    name: 'Aluminium Laptop Stand',
    description: 'Ergonomic 360-degree rotating aluminium laptop riser with dual heat ventilation vents',
    type: 'PRODUCT',
    categoryId: 'cat-1',
    brand: 'DeskElevate',
    unit: 'pcs',
    hsnSac: '7616',
    purchasePrice: 1200,
    sellingPrice: 2200,
    mrp: 2999,
    gstRate: 18,
    trackInventory: true,
    allowNegativeStock: false,
    openingStock: 150,
    minimumStock: 20,
    warehouseId: 'wh-1',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'prod-3',
    organizationId: DEFAULT_ORG.id,
    sku: 'PKG-BOX-003',
    barcode: '8901234567892',
    name: 'Heavy Duty Packaging Box (Large)',
    description: '5-ply corrugated shipping box 14x10x6 inch for heavy components',
    type: 'PRODUCT',
    categoryId: 'cat-2',
    brand: 'PackSafe',
    unit: 'pcs',
    hsnSac: '4819',
    purchasePrice: 35,
    sellingPrice: 65,
    mrp: 80,
    gstRate: 12,
    trackInventory: true,
    allowNegativeStock: false,
    openingStock: 800,
    minimumStock: 100,
    warehouseId: 'wh-1',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'prod-4',
    organizationId: DEFAULT_ORG.id,
    sku: 'SRV-CONS-004',
    name: 'ERP & Cloud Architecture Consulting',
    description: 'Professional accounting system design, data migration, and cloud security consulting per sprint',
    type: 'SERVICE',
    categoryId: 'cat-3',
    brand: 'ZeroConsult',
    unit: 'hours',
    hsnSac: '998313',
    purchasePrice: 0,
    sellingPrice: 5000,
    mrp: 6000,
    gstRate: 18,
    trackInventory: false, // Services don't track physical stock
    allowNegativeStock: true,
    openingStock: 0,
    minimumStock: 0,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank-1',
    organizationId: DEFAULT_ORG.id,
    bankName: 'HDFC Bank',
    accountName: 'Zero Demo Pvt Ltd - Current A/c',
    accountNumber: '50200098765432',
    ifsc: 'HDFC0001024',
    openingBalance: 250000,
    currentBalance: 250000,
    isActive: true,
  },
  {
    id: 'bank-2',
    organizationId: DEFAULT_ORG.id,
    bankName: 'ICICI Bank',
    accountName: 'Zero Demo Pvt Ltd - Operations',
    accountNumber: '001205012345',
    ifsc: 'ICIC0000012',
    openingBalance: 120000,
    currentBalance: 120000,
    isActive: true,
  },
];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov-open-1',
    organizationId: DEFAULT_ORG.id,
    productId: 'prod-1',
    warehouseId: 'wh-1',
    quantity: 100,
    movementType: 'OPENING',
    referenceType: 'OPENING',
    referenceId: 'OPENING-2026',
    unitCost: 6500,
    date: '2026-01-01T00:00:00Z',
    createdBy: 'System Seed',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'mov-open-2',
    organizationId: DEFAULT_ORG.id,
    productId: 'prod-2',
    warehouseId: 'wh-1',
    quantity: 150,
    movementType: 'OPENING',
    referenceType: 'OPENING',
    referenceId: 'OPENING-2026',
    unitCost: 1200,
    date: '2026-01-01T00:00:00Z',
    createdBy: 'System Seed',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'mov-open-3',
    organizationId: DEFAULT_ORG.id,
    productId: 'prod-3',
    warehouseId: 'wh-1',
    quantity: 800,
    movementType: 'OPENING',
    referenceType: 'OPENING',
    referenceId: 'OPENING-2026',
    unitCost: 35,
    date: '2026-01-01T00:00:00Z',
    createdBy: 'System Seed',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

// Initial Opening Equity / Asset balanced journal
export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'je-seed-1',
    organizationId: DEFAULT_ORG.id,
    entryNumber: 'JE-2026-0001',
    date: '2026-01-01T00:00:00Z',
    referenceType: 'MANUAL',
    referenceId: 'OPENING-EQUITY',
    description: 'Opening balances: Bank capital and initial inventory valuation',
    status: 'POSTED',
    totalDebit: 1228000,
    totalCredit: 1228000,
    createdBy: 'Om Patel',
    postedAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    lines: [
      {
        id: 'jel-1',
        journalEntryId: 'je-seed-1',
        accountId: 'acc-1010',
        accountCode: '1010',
        accountName: 'HDFC Bank - Current A/c',
        description: 'Opening bank funds',
        debit: 370000,
        credit: 0,
      },
      {
        id: 'jel-2',
        journalEntryId: 'je-seed-1',
        accountId: 'acc-1200',
        accountCode: '1200',
        accountName: 'Inventory Asset',
        description: 'Opening warehouse inventory (100x6500 + 150x1200 + 800x35)',
        debit: 858000,
        credit: 0,
      },
      {
        id: 'jel-3',
        journalEntryId: 'je-seed-1',
        accountId: 'acc-3000',
        accountCode: '3000',
        accountName: 'Owner Capital',
        description: 'Founder equity contribution',
        debit: 0,
        credit: 1228000,
      },
    ],
  },
];

// Database state container that safely loads from localStorage or seeds
class ZeroBooksDatabase {
  private STORAGE_KEY = 'zerobooks_db_v1';
  
  organization: Organization = { ...DEFAULT_ORG };
  currentUser: User = { ...CURRENT_USER };
  accounts: Account[] = [...DEFAULT_CHART_OF_ACCOUNTS];
  categories: ProductCategory[] = [...INITIAL_CATEGORIES];
  warehouses: Warehouse[] = [...INITIAL_WAREHOUSES];
  customers: Customer[] = [...INITIAL_CUSTOMERS];
  vendors: Vendor[] = [...INITIAL_VENDORS];
  products: Product[] = [...INITIAL_PRODUCTS];
  bankAccounts: BankAccount[] = [...INITIAL_BANK_ACCOUNTS];
  stockMovements: StockMovement[] = [...INITIAL_STOCK_MOVEMENTS];
  quotes: Quote[] = [];
  salesOrders: SalesOrder[] = [];
  invoices: Invoice[] = [];
  payments: Payment[] = [];
  creditNotes: CreditNote[] = [];
  journalEntries: JournalEntry[] = [...INITIAL_JOURNAL_ENTRIES];
  auditLogs: AuditLog[] = [
    {
      id: 'log-1',
      organizationId: DEFAULT_ORG.id,
      userId: CURRENT_USER.id,
      userName: CURRENT_USER.name,
      action: 'SYSTEM_INITIALIZED',
      entityType: 'Organization',
      entityId: DEFAULT_ORG.id,
      timestamp: '2026-01-01T00:00:00Z',
      metadata: 'System initialized with Indian GST and Double-Entry Chart of Accounts.',
    },
  ];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.organization = parsed.organization || this.organization;
        this.accounts = parsed.accounts || this.accounts;
        this.categories = parsed.categories || this.categories;
        this.warehouses = parsed.warehouses || this.warehouses;
        this.customers = parsed.customers || this.customers;
        this.vendors = parsed.vendors || this.vendors;
        this.products = parsed.products || this.products;
        this.bankAccounts = parsed.bankAccounts || this.bankAccounts;
        this.stockMovements = parsed.stockMovements || this.stockMovements;
        this.quotes = parsed.quotes || this.quotes;
        this.salesOrders = parsed.salesOrders || this.salesOrders;
        this.invoices = parsed.invoices || this.invoices;
        this.payments = parsed.payments || this.payments;
        this.creditNotes = parsed.creditNotes || this.creditNotes;
        this.journalEntries = parsed.journalEntries || this.journalEntries;
        this.auditLogs = parsed.auditLogs || this.auditLogs;
      }
    } catch (e) {
      console.error('Failed to load database from localStorage:', e);
    }
  }

  save() {
    if (typeof window === 'undefined') return;
    try {
      const dump = {
        organization: this.organization,
        accounts: this.accounts,
        categories: this.categories,
        warehouses: this.warehouses,
        customers: this.customers,
        vendors: this.vendors,
        products: this.products,
        bankAccounts: this.bankAccounts,
        stockMovements: this.stockMovements,
        quotes: this.quotes,
        salesOrders: this.salesOrders,
        invoices: this.invoices,
        payments: this.payments,
        creditNotes: this.creditNotes,
        journalEntries: this.journalEntries,
        auditLogs: this.auditLogs,
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dump));
    } catch (e) {
      console.error('Failed to persist database to localStorage:', e);
    }
  }

  resetToSeed() {
    this.organization = { ...DEFAULT_ORG };
    this.accounts = [...DEFAULT_CHART_OF_ACCOUNTS];
    this.categories = [...INITIAL_CATEGORIES];
    this.warehouses = [...INITIAL_WAREHOUSES];
    this.customers = [...INITIAL_CUSTOMERS];
    this.vendors = [...INITIAL_VENDORS];
    this.products = [...INITIAL_PRODUCTS];
    this.bankAccounts = [...INITIAL_BANK_ACCOUNTS];
    this.stockMovements = [...INITIAL_STOCK_MOVEMENTS];
    this.quotes = [];
    this.salesOrders = [];
    this.invoices = [];
    this.payments = [];
    this.creditNotes = [];
    this.journalEntries = [...INITIAL_JOURNAL_ENTRIES];
    this.auditLogs = [
      {
        id: 'log-seed-reset',
        organizationId: DEFAULT_ORG.id,
        userId: CURRENT_USER.id,
        userName: CURRENT_USER.name,
        action: 'DATABASE_RESET_TO_SEED',
        entityType: 'Organization',
        entityId: DEFAULT_ORG.id,
        timestamp: new Date().toISOString(),
        metadata: 'Database reset to clean verified seed state.',
      },
    ];
    this.save();
  }

  addAuditLog(action: string, entityType: string, entityId: string, metadata?: string) {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      organizationId: this.organization.id,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      action,
      entityType,
      entityId,
      timestamp: new Date().toISOString(),
      metadata,
    };
    this.auditLogs.unshift(log);
    this.save();
  }
}

export const db = new ZeroBooksDatabase();
