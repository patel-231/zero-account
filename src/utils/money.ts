import Decimal from 'decimal.js';

// Configure decimal.js for financial accuracy
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Format a number into Indian Currency format: ₹1,00,000.00
 */
export function formatINR(val: number | string | Decimal | undefined | null): string {
  if (val === undefined || val === null) return '₹0.00';
  const dec = new Decimal(val);
  const isNegative = dec.isNegative();
  const absDec = dec.abs();
  
  const parts = absDec.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian numbering format: 3 digits rightmost, then groups of 2 digits
  if (integerPart.length > 3) {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    const formattedOthers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    integerPart = formattedOthers + ',' + lastThree;
  }

  return `${isNegative ? '-' : ''}₹${integerPart}.${decimalPart}`;
}

/**
 * Format plain number with Indian comma separators
 */
export function formatIndianNumber(val: number | string | Decimal): string {
  const dec = new Decimal(val || 0);
  const parts = dec.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  if (integerPart.length > 3) {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    const formattedOthers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    integerPart = formattedOthers + ',' + lastThree;
  }

  return `${integerPart}.${decimalPart}`;
}

/**
 * Convert number to words in Indian Rupees (e.g. "Rupees Eleven Thousand Eight Hundred Only")
 */
export function numberToIndianWords(amount: number | string | Decimal): string {
  const dec = new Decimal(amount || 0);
  if (dec.isZero()) return 'Rupees Zero Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return `${tens[t]}${o > 0 ? ' ' + ones[o] : ''}`;
  }

  function convertThreeDigits(n: number): string {
    const h = Math.floor(n / 100);
    const rem = n % 100;
    let res = '';
    if (h > 0) {
      res += `${ones[h]} Hundred`;
      if (rem > 0) res += ' ';
    }
    if (rem > 0) {
      res += convertTwoDigits(rem);
    }
    return res;
  }

  const parts = dec.toFixed(2).split('.');
  const integerVal = parseInt(parts[0], 10);
  const paiseVal = parseInt(parts[1], 10);

  if (integerVal === 0 && paiseVal === 0) return 'Rupees Zero Only';

  let n = integerVal;
  let wordResult = '';

  // Crores (1,00,00,000)
  const crores = Math.floor(n / 10000000);
  n %= 10000000;

  // Lakhs (1,00,000)
  const lakhs = Math.floor(n / 100000);
  n %= 100000;

  // Thousands (1,000)
  const thousands = Math.floor(n / 1000);
  n %= 1000;

  // Remaining hundreds & tens (0-999)
  const remainder = n;

  if (crores > 0) {
    wordResult += `${convertTwoDigits(crores)} Crore `;
  }
  if (lakhs > 0) {
    wordResult += `${convertTwoDigits(lakhs)} Lakh `;
  }
  if (thousands > 0) {
    wordResult += `${convertTwoDigits(thousands)} Thousand `;
  }
  if (remainder > 0) {
    wordResult += `${convertThreeDigits(remainder)} `;
  }

  wordResult = wordResult.trim();
  let finalStr = wordResult ? `Rupees ${wordResult}` : '';

  if (paiseVal > 0) {
    const paiseWords = convertTwoDigits(paiseVal);
    finalStr += (finalStr ? ' and ' : '') + `${paiseWords} Paise`;
  }

  return `${finalStr} Only`;
}

/**
 * Calculate line item totals safely using Decimal
 */
export interface LineCalculationResult {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  total: number;
}

export function calculateLineItem(
  quantity: number | string,
  rate: number | string,
  discount: number | string = 0,
  taxRate: number | string = 18,
  isIntraState: boolean = true
): LineCalculationResult {
  const qty = new Decimal(quantity || 0);
  const unitRate = new Decimal(rate || 0);
  const disc = new Decimal(discount || 0);
  const taxPct = new Decimal(taxRate || 0);

  // Line Gross = qty * rate
  const gross = qty.times(unitRate);

  // Discount (support flat or percent up to gross)
  let discountAmount = disc;
  if (disc.isNegative()) discountAmount = new Decimal(0);
  if (discountAmount.greaterThan(gross)) discountAmount = gross;

  const taxable = gross.minus(discountAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  let cgst = new Decimal(0);
  let sgst = new Decimal(0);
  let igst = new Decimal(0);

  if (isIntraState) {
    // Half to CGST, half to SGST
    const halfRate = taxPct.dividedBy(2);
    cgst = taxable.times(halfRate).dividedBy(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    sgst = taxable.times(halfRate).dividedBy(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  } else {
    // Full to IGST
    igst = taxable.times(taxPct).dividedBy(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }

  const totalTax = cgst.plus(sgst).plus(igst);
  const total = taxable.plus(totalTax).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  return {
    taxableAmount: taxable.toNumber(),
    cgst: cgst.toNumber(),
    sgst: sgst.toNumber(),
    igst: igst.toNumber(),
    totalTax: totalTax.toNumber(),
    total: total.toNumber(),
  };
}

/**
 * Calculate whole invoice totals with round-off
 */
export function calculateInvoiceTotals(
  items: Array<{
    quantity: number;
    rate: number;
    discount?: number;
    taxRate: number;
  }>,
  isIntraState: boolean,
  globalDiscount: number = 0
) {
  let subtotal = new Decimal(0);
  let totalTaxable = new Decimal(0);
  let totalCGST = new Decimal(0);
  let totalSGST = new Decimal(0);
  let totalIGST = new Decimal(0);

  for (const item of items) {
    const calc = calculateLineItem(item.quantity, item.rate, item.discount || 0, item.taxRate, isIntraState);
    subtotal = subtotal.plus(new Decimal(item.quantity).times(new Decimal(item.rate)));
    totalTaxable = totalTaxable.plus(new Decimal(calc.taxableAmount));
    totalCGST = totalCGST.plus(new Decimal(calc.cgst));
    totalSGST = totalSGST.plus(new Decimal(calc.sgst));
    totalIGST = totalIGST.plus(new Decimal(calc.igst));
  }

  const discountDec = new Decimal(globalDiscount || 0);
  const taxTotal = totalCGST.plus(totalSGST).plus(totalIGST);
  const unroundedTotal = totalTaxable.minus(discountDec).plus(taxTotal);
  
  // Standard Indian auto-round off to nearest integer
  const roundedInteger = unroundedTotal.round();
  const roundOff = roundedInteger.minus(unroundedTotal).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const grandTotal = roundedInteger;

  return {
    subtotal: subtotal.toDecimalPlaces(2).toNumber(),
    discount: discountDec.toDecimalPlaces(2).toNumber(),
    taxableAmount: totalTaxable.toDecimalPlaces(2).toNumber(),
    cgst: totalCGST.toDecimalPlaces(2).toNumber(),
    sgst: totalSGST.toDecimalPlaces(2).toNumber(),
    igst: totalIGST.toDecimalPlaces(2).toNumber(),
    totalTax: taxTotal.toDecimalPlaces(2).toNumber(),
    roundOff: roundOff.toNumber(),
    total: grandTotal.toNumber(),
  };
}
