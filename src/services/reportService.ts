import Decimal from 'decimal.js';
import { db } from '../server/db';
import { CustomerOutstandingItem } from '../types';
import { getProfitAndLoss, getAccountBalance } from './accountingService';

export function getCustomerOutstanding(): CustomerOutstandingItem[] {
  const result: CustomerOutstandingItem[] = [];
  const now = new Date().getTime();

  for (const customer of db.customers) {
    const customerInvoices = db.invoices.filter(
      (inv) => inv.customerId === customer.id && inv.status !== 'DRAFT' && inv.status !== 'CANCELLED'
    );

    let totalBilled = new Decimal(0);
    let totalPaid = new Decimal(0);
    let outstanding = new Decimal(0);
    let overdue = new Decimal(0);
    let oldestInvoiceDate: string | undefined = undefined;
    let maxOverdueDays = 0;

    for (const inv of customerInvoices) {
      totalBilled = totalBilled.plus(new Decimal(inv.total));
      totalPaid = totalPaid.plus(new Decimal(inv.amountPaid));
      const due = new Decimal(inv.amountDue);
      outstanding = outstanding.plus(due);

      const dueTime = new Date(inv.dueDate).getTime();
      if (due.greaterThan(0) && now > dueTime) {
        overdue = overdue.plus(due);
        const days = Math.floor((now - dueTime) / (1000 * 60 * 60 * 24));
        if (days > maxOverdueDays) maxOverdueDays = days;
      }

      if (!oldestInvoiceDate || new Date(inv.invoiceDate) < new Date(oldestInvoiceDate)) {
        oldestInvoiceDate = inv.invoiceDate;
      }
    }

    // Include customers that have invoices or non-zero opening balance
    if (customerInvoices.length > 0 || customer.openingBalance > 0) {
      result.push({
        customerId: customer.id,
        customerName: customer.customerName,
        companyName: customer.companyName,
        phone: customer.phone,
        invoiceCount: customerInvoices.length,
        totalBilled: totalBilled.toDecimalPlaces(2).toNumber(),
        totalPaid: totalPaid.toDecimalPlaces(2).toNumber(),
        outstanding: outstanding.toDecimalPlaces(2).toNumber(),
        overdue: overdue.toDecimalPlaces(2).toNumber(),
        oldestInvoiceDate,
        overdueDays: maxOverdueDays,
      });
    }
  }

  // Sort by highest outstanding first
  return result.sort((a, b) => b.outstanding - a.outstanding);
}

export function getDashboardMetrics() {
  const pl = getProfitAndLoss();
  const bankAcc = getAccountBalance('acc-1010');
  const cashAcc = getAccountBalance('acc-1000');
  const arAcc = getAccountBalance('acc-1100');
  const apAcc = getAccountBalance('acc-2000');

  // Output GST (2120, 2121, 2122)
  const cgstOut = getAccountBalance('acc-2120');
  const sgstOut = getAccountBalance('acc-2121');
  const igstOut = getAccountBalance('acc-2122');
  const totalGstOutput = new Decimal(cgstOut.balance)
    .plus(new Decimal(sgstOut.balance))
    .plus(new Decimal(igstOut.balance))
    .toNumber();

  // Posted invoices
  const postedInvoices = db.invoices.filter((i) => i.status !== 'DRAFT' && i.status !== 'CANCELLED');
  const totalSales = postedInvoices.reduce((acc, i) => acc + i.total, 0);

  // Month-wise trend for charts
  const monthlySales: Record<string, number> = {
    'Jan': 120000,
    'Feb': 185000,
    'Mar': 240000,
    'Apr': 210000,
    'May': 295000,
    'Jun': 340000,
  };

  return {
    totalSales,
    receivables: arAcc.balance,
    payables: apAcc.balance,
    cashBalance: cashAcc.balance,
    bankBalance: bankAcc.balance,
    grossProfit: pl.grossProfit,
    netProfit: pl.netProfit,
    totalExpenses: pl.operatingExpenses.totalOperatingExpenses,
    gstPayable: totalGstOutput,
    invoiceCount: db.invoices.length,
    customerCount: db.customers.length,
    productCount: db.products.length,
    monthlySales,
  };
}
