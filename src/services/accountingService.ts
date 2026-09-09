import Decimal from 'decimal.js';
import { db } from '../server/db';
import {
  Account,
  JournalEntry,
  JournalEntryLine,
  JournalStatus,
  TrialBalanceItem,
  ProfitAndLossStatement,
  BalanceSheetStatement,
} from '../types';

export class AccountingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccountingError';
  }
}

/**
 * Fundamental invariant check:
 * Total Debit must exactly equal Total Credit for every posted transaction.
 */
export function assertJournalBalanced(
  lines: Array<{ debit: number | string; credit: number | string }>
): { totalDebit: number; totalCredit: number; isBalanced: boolean } {
  let sumDebit = new Decimal(0);
  let sumCredit = new Decimal(0);

  for (let i = 0; i < lines.length; i++) {
    const d = new Decimal(lines[i].debit || 0);
    const c = new Decimal(lines[i].credit || 0);

    if (d.isNegative() || c.isNegative()) {
      throw new AccountingError(`Journal line ${i + 1} has negative amounts which is forbidden.`);
    }
    if (d.isPositive() && !d.isZero() && c.isPositive() && !c.isZero()) {
      throw new AccountingError(`Journal line ${i + 1} cannot have both debit and credit specified.`);
    }

    sumDebit = sumDebit.plus(d);
    sumCredit = sumCredit.plus(c);
  }

  // Check equality to 2 decimal places
  const debitRounded = sumDebit.toDecimalPlaces(2);
  const creditRounded = sumCredit.toDecimalPlaces(2);

  if (!debitRounded.equals(creditRounded)) {
    throw new AccountingError(
      `Unbalanced Journal Entry detected! Total Debits (₹${debitRounded}) does not equal Total Credits (₹${creditRounded}). Imbalance: ₹${debitRounded.minus(creditRounded).abs()}`
    );
  }

  return {
    totalDebit: debitRounded.toNumber(),
    totalCredit: creditRounded.toNumber(),
    isBalanced: true,
  };
}

/**
 * Create and post a balanced journal entry
 */
export function createJournalEntry(params: {
  date?: string;
  referenceType?: 'INVOICE' | 'PAYMENT' | 'CREDIT_NOTE' | 'REVERSAL' | 'MANUAL' | 'PURCHASE';
  referenceId?: string;
  referenceDisplay?: string;
  description: string;
  lines: Array<{
    accountId: string;
    description?: string;
    debit: number;
    credit: number;
  }>;
  status?: JournalStatus;
}): JournalEntry {
  // Validate accounts exist
  const validatedLines: JournalEntryLine[] = [];
  
  for (const line of params.lines) {
    const acc = db.accounts.find((a) => a.id === line.accountId || a.code === line.accountId);
    if (!acc) {
      throw new AccountingError(`Account ID/Code '${line.accountId}' was not found in the Chart of Accounts.`);
    }

    validatedLines.push({
      id: `jel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      journalEntryId: '',
      accountId: acc.id,
      accountCode: acc.code,
      accountName: acc.name,
      description: line.description || params.description,
      debit: new Decimal(line.debit || 0).toDecimalPlaces(2).toNumber(),
      credit: new Decimal(line.credit || 0).toDecimalPlaces(2).toNumber(),
    });
  }

  // Validate balance
  const balanceCheck = assertJournalBalanced(validatedLines);

  const entryNumber = `JE-2026-${String(db.journalEntries.length + 1).padStart(4, '0')}`;
  const journalId = `je-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  // Link lines to entry
  for (const line of validatedLines) {
    line.journalEntryId = journalId;
  }

  const newEntry: JournalEntry = {
    id: journalId,
    organizationId: db.organization.id,
    entryNumber,
    date: params.date || new Date().toISOString(),
    referenceType: params.referenceType || 'MANUAL',
    referenceId: params.referenceId,
    referenceDisplay: params.referenceDisplay,
    description: params.description,
    status: params.status || 'POSTED',
    lines: validatedLines,
    totalDebit: balanceCheck.totalDebit,
    totalCredit: balanceCheck.totalCredit,
    createdBy: db.currentUser.name,
    postedAt: (params.status || 'POSTED') === 'POSTED' ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
  };

  db.journalEntries.unshift(newEntry);
  db.addAuditLog('JOURNAL_ENTRY_POSTED', 'JournalEntry', newEntry.id, `Entry ${entryNumber}: ${params.description} (₹${balanceCheck.totalDebit})`);
  db.save();

  return newEntry;
}

/**
 * Reverse an existing posted journal entry
 */
export function reverseJournalEntry(journalId: string, reason: string): JournalEntry {
  const original = db.journalEntries.find((j) => j.id === journalId);
  if (!original) {
    throw new AccountingError(`Journal Entry '${journalId}' not found.`);
  }
  if (original.status !== 'POSTED') {
    throw new AccountingError(`Cannot reverse a journal entry with status '${original.status}'.`);
  }

  // Invert lines: debits become credits, credits become debits
  const reversedLines = original.lines.map((l) => ({
    accountId: l.accountId,
    description: `Reversal of ${original.entryNumber}: ${l.description || ''}`,
    debit: l.credit,
    credit: l.debit,
  }));

  const reversalEntry = createJournalEntry({
    referenceType: 'REVERSAL',
    referenceId: original.id,
    referenceDisplay: `Reversal: ${original.entryNumber}`,
    description: `Reversal of ${original.entryNumber} - ${reason}`,
    lines: reversedLines,
    status: 'POSTED',
  });

  reversalEntry.reversalOfId = original.id;
  original.status = 'REVERSED';

  db.addAuditLog('JOURNAL_REVERSED', 'JournalEntry', original.id, `Reversed by ${reversalEntry.entryNumber}. Reason: ${reason}`);
  db.save();

  return reversalEntry;
}

/**
 * Calculate Account Balance from all POSTED journal entry lines
 */
export function getAccountBalance(accountId: string): {
  accountId: string;
  code: string;
  name: string;
  type: Account['type'];
  balance: number;
  totalDebit: number;
  totalCredit: number;
} {
  const acc = db.accounts.find((a) => a.id === accountId);
  if (!acc) throw new AccountingError(`Account not found: ${accountId}`);

  let sumDebit = new Decimal(0);
  let sumCredit = new Decimal(0);

  for (const je of db.journalEntries) {
    if (je.status !== 'POSTED') continue;
    for (const line of je.lines) {
      if (line.accountId === accountId) {
        sumDebit = sumDebit.plus(new Decimal(line.debit));
        sumCredit = sumCredit.plus(new Decimal(line.credit));
      }
    }
  }

  // Normal balance rules:
  // Asset & Expense: Debit increases, Credit decreases (Balance = Debit - Credit)
  // Liability, Equity, Income: Credit increases, Debit decreases (Balance = Credit - Debit)
  let netBalance: Decimal;
  if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
    netBalance = sumDebit.minus(sumCredit);
  } else {
    netBalance = sumCredit.minus(sumDebit);
  }

  return {
    accountId: acc.id,
    code: acc.code,
    name: acc.name,
    type: acc.type,
    balance: netBalance.toDecimalPlaces(2).toNumber(),
    totalDebit: sumDebit.toDecimalPlaces(2).toNumber(),
    totalCredit: sumCredit.toDecimalPlaces(2).toNumber(),
  };
}

/**
 * Generate General Ledger for an account
 */
export function getGeneralLedger(params: {
  accountId: string;
  startDate?: string;
  endDate?: string;
}) {
  const acc = db.accounts.find((a) => a.id === params.accountId);
  if (!acc) throw new AccountingError(`Account not found: ${params.accountId}`);

  const start = params.startDate ? new Date(params.startDate) : new Date(0);
  const end = params.endDate ? new Date(params.endDate) : new Date(8640000000000000);

  // Calculate opening balance before startDate
  let openingDebit = new Decimal(0);
  let openingCredit = new Decimal(0);
  const periodEntries: Array<{
    date: string;
    entryNumber: string;
    journalEntryId: string;
    referenceType?: string;
    referenceId?: string;
    description: string;
    debit: number;
    credit: number;
    runningBalance: number;
  }> = [];

  // Sort journal entries by date ascending
  const sortedJournals = [...db.journalEntries]
    .filter((j) => j.status === 'POSTED')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningBalance = new Decimal(0);

  for (const je of sortedJournals) {
    const entryDate = new Date(je.date);

    for (const line of je.lines) {
      if (line.accountId !== params.accountId) continue;

      const d = new Decimal(line.debit);
      const c = new Decimal(line.credit);

      if (entryDate < start) {
        openingDebit = openingDebit.plus(d);
        openingCredit = openingCredit.plus(c);
      } else if (entryDate <= end) {
        // Calculate running balance based on normal balance rule
        if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
          runningBalance = runningBalance.plus(d).minus(c);
        } else {
          runningBalance = runningBalance.plus(c).minus(d);
        }

        periodEntries.push({
          date: je.date,
          entryNumber: je.entryNumber,
          journalEntryId: je.id,
          referenceType: je.referenceType,
          referenceId: je.referenceId,
          description: line.description || je.description,
          debit: d.toNumber(),
          credit: c.toNumber(),
          runningBalance: runningBalance.toDecimalPlaces(2).toNumber(),
        });
      }
    }
  }

  let openingBalance = new Decimal(0);
  if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
    openingBalance = openingDebit.minus(openingCredit);
  } else {
    openingBalance = openingCredit.minus(openingDebit);
  }

  const closingBalance = openingBalance.plus(runningBalance);

  return {
    account: acc,
    openingBalance: openingBalance.toDecimalPlaces(2).toNumber(),
    entries: periodEntries,
    closingBalance: closingBalance.toDecimalPlaces(2).toNumber(),
  };
}

/**
 * Generate Trial Balance across all active accounts
 */
export function getTrialBalance(): {
  items: TrialBalanceItem[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  imbalance: number;
} {
  let grandDebit = new Decimal(0);
  let grandCredit = new Decimal(0);
  const items: TrialBalanceItem[] = [];

  for (const acc of db.accounts) {
    let debitSum = new Decimal(0);
    let creditSum = new Decimal(0);

    for (const je of db.journalEntries) {
      if (je.status !== 'POSTED') continue;
      for (const line of je.lines) {
        if (line.accountId === acc.id) {
          debitSum = debitSum.plus(new Decimal(line.debit));
          creditSum = creditSum.plus(new Decimal(line.credit));
        }
      }
    }

    // In Trial Balance:
    // Net Debit if Debit > Credit
    // Net Credit if Credit > Debit
    let netDebit = new Decimal(0);
    let netCredit = new Decimal(0);

    if (debitSum.greaterThan(creditSum)) {
      netDebit = debitSum.minus(creditSum);
    } else if (creditSum.greaterThan(debitSum)) {
      netCredit = creditSum.minus(debitSum);
    }

    if (!netDebit.isZero() || !netCredit.isZero()) {
      grandDebit = grandDebit.plus(netDebit);
      grandCredit = grandCredit.plus(netCredit);

      items.push({
        accountId: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debit: netDebit.toDecimalPlaces(2).toNumber(),
        credit: netCredit.toDecimalPlaces(2).toNumber(),
      });
    }
  }

  // Sort by account code ascending
  items.sort((a, b) => a.code.localeCompare(b.code));

  const totalDebit = grandDebit.toDecimalPlaces(2).toNumber();
  const totalCredit = grandCredit.toDecimalPlaces(2).toNumber();
  const diff = grandDebit.minus(grandCredit).abs().toDecimalPlaces(2).toNumber();

  return {
    items,
    totalDebit,
    totalCredit,
    isBalanced: diff === 0,
    imbalance: diff,
  };
}

/**
 * Generate Profit and Loss Statement from POSTED journal entries
 */
export function getProfitAndLoss(period: string = 'Current Financial Year'): ProfitAndLossStatement {
  // Income accounts (4000s)
  let salesRevenue = new Decimal(0);
  let serviceRevenue = new Decimal(0);
  let otherIncome = new Decimal(0);

  // Expense accounts (5000s)
  let purchases = new Decimal(0);
  let directExpenses = new Decimal(0);

  let rent = new Decimal(0);
  let salary = new Decimal(0);
  let utilities = new Decimal(0);
  let marketing = new Decimal(0);
  let transport = new Decimal(0);
  let officeExpenses = new Decimal(0);
  let travel = new Decimal(0);
  let miscellaneous = new Decimal(0);

  for (const je of db.journalEntries) {
    if (je.status !== 'POSTED') continue;
    for (const line of je.lines) {
      const d = new Decimal(line.debit);
      const c = new Decimal(line.credit);

      // Income: Credit - Debit
      if (line.accountCode === '4000') salesRevenue = salesRevenue.plus(c.minus(d));
      else if (line.accountCode === '4100') serviceRevenue = serviceRevenue.plus(c.minus(d));
      else if (line.accountCode.startsWith('4')) otherIncome = otherIncome.plus(c.minus(d));

      // COGS / Purchases: Debit - Credit
      else if (line.accountCode === '5000') purchases = purchases.plus(d.minus(c));

      // Operating Expenses: Debit - Credit
      else if (line.accountCode === '5100') rent = rent.plus(d.minus(c));
      else if (line.accountCode === '5200') salary = salary.plus(d.minus(c));
      else if (line.accountCode === '5300' || line.accountCode === '5400') utilities = utilities.plus(d.minus(c));
      else if (line.accountCode === '5500') marketing = marketing.plus(d.minus(c));
      else if (line.accountCode === '5600') transport = transport.plus(d.minus(c));
      else if (line.accountCode === '5700') officeExpenses = officeExpenses.plus(d.minus(c));
      else if (line.accountCode === '5800') travel = travel.plus(d.minus(c));
      else if (line.accountCode.startsWith('5')) miscellaneous = miscellaneous.plus(d.minus(c));
    }
  }

  const totalRevenue = salesRevenue.plus(serviceRevenue).plus(otherIncome);
  const totalCOGS = purchases.plus(directExpenses);
  const grossProfit = totalRevenue.minus(totalCOGS);

  const totalOperatingExpenses = rent
    .plus(salary)
    .plus(utilities)
    .plus(marketing)
    .plus(transport)
    .plus(officeExpenses)
    .plus(travel)
    .plus(miscellaneous);

  const netProfit = grossProfit.minus(totalOperatingExpenses);

  return {
    period,
    revenue: {
      salesRevenue: salesRevenue.toDecimalPlaces(2).toNumber(),
      serviceRevenue: serviceRevenue.toDecimalPlaces(2).toNumber(),
      otherIncome: otherIncome.toDecimalPlaces(2).toNumber(),
      totalRevenue: totalRevenue.toDecimalPlaces(2).toNumber(),
    },
    costOfGoodsSold: {
      purchases: purchases.toDecimalPlaces(2).toNumber(),
      directExpenses: directExpenses.toDecimalPlaces(2).toNumber(),
      totalCOGS: totalCOGS.toDecimalPlaces(2).toNumber(),
    },
    grossProfit: grossProfit.toDecimalPlaces(2).toNumber(),
    operatingExpenses: {
      rent: rent.toDecimalPlaces(2).toNumber(),
      salary: salary.toDecimalPlaces(2).toNumber(),
      utilities: utilities.toDecimalPlaces(2).toNumber(),
      marketing: marketing.toDecimalPlaces(2).toNumber(),
      transport: transport.toDecimalPlaces(2).toNumber(),
      officeExpenses: officeExpenses.toDecimalPlaces(2).toNumber(),
      travel: travel.toDecimalPlaces(2).toNumber(),
      miscellaneous: miscellaneous.toDecimalPlaces(2).toNumber(),
      totalOperatingExpenses: totalOperatingExpenses.toDecimalPlaces(2).toNumber(),
    },
    netProfit: netProfit.toDecimalPlaces(2).toNumber(),
  };
}

/**
 * Generate Balance Sheet Statement
 * Enforces fundamental accounting equation: ASSETS = LIABILITIES + EQUITY
 */
export function getBalanceSheet(asOfDate: string = new Date().toLocaleDateString('en-IN')): BalanceSheetStatement {
  // Current Assets
  let cash = new Decimal(0);
  let bank = new Decimal(0);
  let accountsReceivable = new Decimal(0);
  let inventory = new Decimal(0);
  let fixedAssets = new Decimal(0);

  // Liabilities
  let accountsPayable = new Decimal(0);
  let gstPayable = new Decimal(0);
  let loans = new Decimal(0);

  // Equity
  let ownerCapital = new Decimal(0);
  let retainedEarnings = new Decimal(0);
  let drawings = new Decimal(0);

  for (const je of db.journalEntries) {
    if (je.status !== 'POSTED') continue;
    for (const line of je.lines) {
      const d = new Decimal(line.debit);
      const c = new Decimal(line.credit);

      // Assets (Debit - Credit)
      if (line.accountCode === '1000') cash = cash.plus(d.minus(c));
      else if (line.accountCode === '1010') bank = bank.plus(d.minus(c));
      else if (line.accountCode === '1100') accountsReceivable = accountsReceivable.plus(d.minus(c));
      else if (line.accountCode === '1200') inventory = inventory.plus(d.minus(c));
      else if (line.accountCode.startsWith('15')) fixedAssets = fixedAssets.plus(d.minus(c));

      // Liabilities (Credit - Debit)
      else if (line.accountCode === '2000') accountsPayable = accountsPayable.plus(c.minus(d));
      // GST: Outputs (2120, 2121, 2122) are Credit, Inputs (2110, 2111, 2112) are Debit
      else if (line.accountCode.startsWith('212')) gstPayable = gstPayable.plus(c.minus(d));
      else if (line.accountCode.startsWith('211')) gstPayable = gstPayable.minus(d.minus(c));
      else if (line.accountCode === '2100') gstPayable = gstPayable.plus(c.minus(d));
      else if (line.accountCode.startsWith('22')) loans = loans.plus(c.minus(d));

      // Equity (Credit - Debit)
      else if (line.accountCode === '3000') ownerCapital = ownerCapital.plus(c.minus(d));
      else if (line.accountCode === '3100') retainedEarnings = retainedEarnings.plus(c.minus(d));
      else if (line.accountCode === '3200') drawings = drawings.plus(d.minus(c)); // drawings reduce equity
    }
  }

  // Calculate current year Net Profit from P&L to include in Equity
  const pl = getProfitAndLoss();
  const currentProfit = new Decimal(pl.netProfit);

  const totalCurrentAssets = cash.plus(bank).plus(accountsReceivable).plus(inventory);
  const totalAssets = totalCurrentAssets.plus(fixedAssets);

  const totalCurrentLiabilities = accountsPayable.plus(gstPayable);
  const totalLiabilities = totalCurrentLiabilities.plus(loans);

  const totalEquity = ownerCapital.plus(retainedEarnings).plus(currentProfit).minus(drawings);

  const totalLiabilitiesAndEquity = totalLiabilities.plus(totalEquity);

  const diff = totalAssets.minus(totalLiabilitiesAndEquity).abs().toDecimalPlaces(2);
  const isBalanced = diff.isZero();

  return {
    asOfDate,
    assets: {
      currentAssets: {
        cash: cash.toDecimalPlaces(2).toNumber(),
        bank: bank.toDecimalPlaces(2).toNumber(),
        accountsReceivable: accountsReceivable.toDecimalPlaces(2).toNumber(),
        inventory: inventory.toDecimalPlaces(2).toNumber(),
        totalCurrentAssets: totalCurrentAssets.toDecimalPlaces(2).toNumber(),
      },
      fixedAssets: fixedAssets.toDecimalPlaces(2).toNumber(),
      totalAssets: totalAssets.toDecimalPlaces(2).toNumber(),
    },
    liabilities: {
      currentLiabilities: {
        accountsPayable: accountsPayable.toDecimalPlaces(2).toNumber(),
        gstPayable: gstPayable.toDecimalPlaces(2).toNumber(),
        totalCurrentLiabilities: totalCurrentLiabilities.toDecimalPlaces(2).toNumber(),
      },
      longTermLoans: loans.toDecimalPlaces(2).toNumber(),
      totalLiabilities: totalLiabilities.toDecimalPlaces(2).toNumber(),
    },
    equity: {
      ownerCapital: ownerCapital.toDecimalPlaces(2).toNumber(),
      retainedEarnings: retainedEarnings.toDecimalPlaces(2).toNumber(),
      currentProfit: currentProfit.toDecimalPlaces(2).toNumber(),
      drawings: drawings.toDecimalPlaces(2).toNumber(),
      totalEquity: totalEquity.toDecimalPlaces(2).toNumber(),
    },
    totalLiabilitiesAndEquity: totalLiabilitiesAndEquity.toDecimalPlaces(2).toNumber(),
    isBalanced,
    difference: diff.toNumber(),
  };
}
