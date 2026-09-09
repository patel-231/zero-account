import { db } from '../server/db';
import { createInvoice, postInvoice } from '../services/invoiceService';
import { recordCustomerPayment } from '../services/paymentService';
import { getProductStock } from '../services/inventoryService';
import { getTrialBalance, getProfitAndLoss, getBalanceSheet } from '../services/accountingService';
import { getCustomerOutstanding } from '../services/reportService';
import { calculateLineItem, calculateInvoiceTotals } from '../utils/money';

export interface TestResult {
  title: string;
  category: string;
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Execute all automated accounting tests against the transactional engine
 */
export function runAccountingTestSuite(): {
  allPassed: boolean;
  passedCount: number;
  failedCount: number;
  results: TestResult[];
} {
  const results: TestResult[] = [];

  function record(title: string, category: string, condition: boolean, message: string, details?: Record<string, unknown>) {
    results.push({
      title,
      category,
      passed: condition,
      message: condition ? `PASSED: ${message}` : `FAILED: ${message}`,
      details,
    });
  }

  // Backup DB state before test execution
  const backup = {
    invoices: JSON.parse(JSON.stringify(db.invoices)),
    stockMovements: JSON.parse(JSON.stringify(db.stockMovements)),
    journalEntries: JSON.parse(JSON.stringify(db.journalEntries)),
    payments: JSON.parse(JSON.stringify(db.payments)),
  };

  try {
    // -------------------------------------------------------------
    // TEST 1: GST Intra-state Math (CGST 9% + SGST 9% on ₹10,000)
    // -------------------------------------------------------------
    const intraCalc = calculateLineItem(1, 10000, 0, 18, true);
    record(
      'Intra-State GST Calculation (18%)',
      'GST & Tax Math',
      intraCalc.cgst === 900 && intraCalc.sgst === 900 && intraCalc.igst === 0 && intraCalc.total === 11800,
      `₹10,000 @ 18% intra-state gives CGST=₹${intraCalc.cgst}, SGST=₹${intraCalc.sgst}, Total=₹${intraCalc.total}`,
      { ...intraCalc }
    );

    // -------------------------------------------------------------
    // TEST 2: GST Inter-state Math (IGST 18% on ₹20,000)
    // -------------------------------------------------------------
    const interCalc = calculateLineItem(1, 20000, 0, 18, false);
    record(
      'Inter-State GST Calculation (18%)',
      'GST & Tax Math',
      interCalc.igst === 3600 && interCalc.cgst === 0 && interCalc.sgst === 0 && interCalc.total === 23600,
      `₹20,000 @ 18% inter-state gives IGST=₹${interCalc.igst}, Total=₹${interCalc.total}`,
      { ...interCalc }
    );

    // -------------------------------------------------------------
    // TEST 3: Invoice Post Transaction & Balanced Journal
    // -------------------------------------------------------------
    const initialStock = getProductStock('prod-1').currentStock;
    const inv1 = createInvoice({
      customerId: 'cust-1', // ABC Traders (Gujarat intra-state)
      items: [
        {
          productId: 'prod-1',
          productName: 'Phone Cooler Pro',
          quantity: 1,
          rate: 10000,
          discount: 0,
          taxRate: 18,
        },
      ],
      autoPost: true,
    });

    const postedInv = db.invoices.find((i) => i.id === inv1.id);
    const je1 = db.journalEntries.find((j) => j.id === postedInv?.journalEntryId);
    const afterStock = getProductStock('prod-1').currentStock;

    record(
      'Invoice Posting: Journal Balance (Debit = Credit)',
      'Double-Entry Accounting',
      !!je1 && je1.totalDebit === 11800 && je1.totalCredit === 11800 && je1.totalDebit === je1.totalCredit,
      `Journal ${je1?.entryNumber} Total Debit (₹${je1?.totalDebit}) == Total Credit (₹${je1?.totalCredit})`,
      { totalDebit: je1?.totalDebit, totalCredit: je1?.totalCredit }
    );

    record(
      'Invoice Posting: Inventory Stock Movement',
      'Inventory Engine',
      afterStock === initialStock - 1,
      `Stock reduced from ${initialStock} to ${afterStock} (-1 unit sold)`,
      { before: initialStock, after: afterStock }
    );

    // -------------------------------------------------------------
    // TEST 4: Customer Partial Payment (₹5,000 on ₹11,800)
    // -------------------------------------------------------------
    const pay1 = recordCustomerPayment({
      customerId: 'cust-1',
      invoiceId: inv1.id,
      amount: 5000,
      paymentMethod: 'BANK_TRANSFER',
      reference: 'UPI/HDFC/554433',
    });

    const invAfterPartPay = db.invoices.find((i) => i.id === inv1.id);
    record(
      'Partial Payment: Invoice Status & Outstanding',
      'Accounts Receivable',
      invAfterPartPay?.amountPaid === 5000 &&
        invAfterPartPay?.amountDue === 6800 &&
        invAfterPartPay?.status === 'PARTIALLY_PAID',
      `Paid: ₹${invAfterPartPay?.amountPaid}, Remaining Due: ₹${invAfterPartPay?.amountDue}, Status: ${invAfterPartPay?.status}`,
      { paid: invAfterPartPay?.amountPaid, due: invAfterPartPay?.amountDue, status: invAfterPartPay?.status }
    );

    // -------------------------------------------------------------
    // TEST 5: Second Payment & Full Settlement (Remaining ₹6,800)
    // -------------------------------------------------------------
    const pay2 = recordCustomerPayment({
      customerId: 'cust-1',
      invoiceId: inv1.id,
      amount: 6800,
      paymentMethod: 'BANK_TRANSFER',
      reference: 'NEFT/HDFC/998877',
    });

    const invAfterFullPay = db.invoices.find((i) => i.id === inv1.id);
    record(
      'Full Payment: Complete Settlement',
      'Accounts Receivable',
      invAfterFullPay?.amountPaid === 11800 &&
        invAfterFullPay?.amountDue === 0 &&
        invAfterFullPay?.status === 'PAID',
      `Fully paid: ₹${invAfterFullPay?.amountPaid}, Due: ₹${invAfterFullPay?.amountDue}, Status: ${invAfterFullPay?.status}`,
      { status: invAfterFullPay?.status, amountDue: invAfterFullPay?.amountDue }
    );

    // -------------------------------------------------------------
    // TEST 6: Interstate Invoice (Customer 2: Shree Enterprises, MH 27)
    // -------------------------------------------------------------
    const inv2 = createInvoice({
      customerId: 'cust-2', // Shree Enterprises (Maharashtra, 27)
      items: [
        {
          productId: 'prod-1',
          productName: 'Phone Cooler Pro',
          quantity: 2,
          rate: 10000, // 2 x 10,000 = 20,000
          taxRate: 18,
        },
      ],
      autoPost: true,
    });

    const je2 = db.journalEntries.find((j) => j.id === inv2.journalEntryId);
    record(
      'Interstate Invoice: IGST Journal Entry',
      'GST & Double-Entry',
      inv2.igst === 3600 && inv2.total === 23600 && je2?.totalDebit === 23600 && je2?.totalCredit === 23600,
      `Interstate Invoice ${inv2.invoiceNumber}: IGST=₹${inv2.igst}, Grand Total=₹${inv2.total}. Journal balanced at ₹${je2?.totalDebit}`,
      { igst: inv2.igst, total: inv2.total, debit: je2?.totalDebit, credit: je2?.totalCredit }
    );

    // -------------------------------------------------------------
    // TEST 7: Trial Balance Integrity (Grand Debit = Grand Credit)
    // -------------------------------------------------------------
    const tb = getTrialBalance();
    record(
      'Trial Balance Integrity Check',
      'Financial Reports',
      tb.isBalanced && tb.totalDebit === tb.totalCredit,
      `Trial Balance Total Debits (₹${tb.totalDebit}) equals Total Credits (₹${tb.totalCredit}). Imbalance: ₹${tb.imbalance}`,
      { totalDebit: tb.totalDebit, totalCredit: tb.totalCredit, imbalance: tb.imbalance }
    );

    // -------------------------------------------------------------
    // TEST 8: Balance Sheet Equation (Assets = Liabilities + Equity)
    // -------------------------------------------------------------
    const bs = getBalanceSheet();
    record(
      'Balance Sheet Equation (Assets = Liabilities + Equity)',
      'Financial Reports',
      bs.isBalanced,
      `Total Assets (₹${bs.assets.totalAssets}) == Total Liabilities & Equity (₹${bs.totalLiabilitiesAndEquity})`,
      { totalAssets: bs.assets.totalAssets, totalLiabilitiesAndEquity: bs.totalLiabilitiesAndEquity, isBalanced: bs.isBalanced }
    );

    // -------------------------------------------------------------
    // TEST 9: Negative Stock Protection
    // -------------------------------------------------------------
    let caughtInsufficientStock = false;
    try {
      createInvoice({
        customerId: 'cust-3',
        items: [
          {
            productId: 'prod-1',
            productName: 'Phone Cooler Pro',
            quantity: 99999, // Way more than available stock
            rate: 10000,
            taxRate: 18,
          },
        ],
        autoPost: true, // Auto post should trigger stock verification and throw!
      });
    } catch (e) {
      caughtInsufficientStock = true;
    }

    record(
      'Inventory Engine: Negative Stock Protection',
      'Inventory Engine',
      caughtInsufficientStock,
      'System correctly rejected overselling when requested quantity exceeds available stock.',
      { caughtInsufficientStock }
    );
  } finally {
    // Restore clean state after automated test verification so demo data is clean
    db.invoices = backup.invoices;
    db.stockMovements = backup.stockMovements;
    db.journalEntries = backup.journalEntries;
    db.payments = backup.payments;
    db.save();
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    allPassed: failedCount === 0,
    passedCount,
    failedCount,
    results,
  };
}
