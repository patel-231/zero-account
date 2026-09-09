import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { Invoice, Payment, Quote, SalesOrder } from '../types';
import { db } from '../server/db';
import { formatINR, numberToIndianWords } from './money';

/**
 * Generate standard NPCI Indian UPI payment URL
 */
export function generateUPILink(
  payeeVpa: string,
  payeeName: string,
  amount: number,
  transactionNote: string
): string {
  const cleanAmount = Number(amount.toFixed(2));
  const params = new URLSearchParams({
    pa: payeeVpa,
    pn: payeeName,
    am: cleanAmount.toString(),
    cu: 'INR',
    tn: transactionNote.substring(0, 40),
  });
  return `upi://pay?${params.toString()}`;
}

/**
 * Helper to generate QR Code Data URL
 */
export async function generateQRCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      margin: 1,
      width: 256,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.warn('QR code generation failed, returning empty', err);
    return '';
  }
}

// ----------------------------------------------------------------------
// 1. INVOICE PDF GENERATOR (High Fidelity)
// ----------------------------------------------------------------------

export async function generateInvoicePDF(invoice: Invoice): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const org = db.organization;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  // 1. Top Decorative Brand Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 22, 'F');

  // Brand Name & Tagline
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('ZEROBOOKS', margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('ENTERPRISE ACCOUNTING & GST PLATFORM', margin + 6, y + 15);

  // Document Title Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('TAX INVOICE', pageWidth - margin - 6, y + 9, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('(Original for Recipient - Sec 31 CGST Act)', pageWidth - margin - 6, y + 15, { align: 'right' });

  y += 26;

  // 2. Organization Details (Left) and Invoice Meta Box (Right)
  const metaBoxWidth = 72;
  const orgWidth = contentWidth - metaBoxWidth - 6;

  // Left: Seller Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(org.legalName || org.name, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105); // slate-600

  let orgY = y + 4.5;
  doc.text(`${org.address || ''}, ${org.city || ''}, ${org.state} - ${org.pinCode || ''}`, margin, orgY);
  orgY += 3.8;
  doc.text(`GSTIN: ${org.gstin || 'N/A'}   |   PAN: ${org.pan || 'N/A'}   |   State Code: ${org.stateCode}`, margin, orgY);
  orgY += 3.8;
  doc.text(`Email: ${org.email}   |   Phone: ${org.phone || '+91 98765 43210'}`, margin, orgY);

  // Right: Invoice Meta Box
  const metaX = pageWidth - margin - metaBoxWidth;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(metaX, y - 3, metaBoxWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, metaX + 4, y + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Invoice Date:`, metaX + 4, y + 6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`, metaX + 32, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Payment Due:`, metaX + 4, y + 11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${new Date(invoice.dueDate).toLocaleDateString('en-IN')}`, metaX + 32, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Place of Supply:`, metaX + 4, y + 15.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${invoice.placeOfSupply}`, metaX + 32, y + 15.5);

  y += 24;

  // 3. Customer / Bill To Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('BILLED TO (RECIPIENT / CUSTOMER):', margin + 4, y + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.customerName, margin + 4, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${invoice.billingAddress || 'Commercial Complex, Sector 4'}, Place of Supply: ${invoice.placeOfSupply}`, margin + 4, y + 13.5);

  const customerGstin = invoice.gstin ? `GSTIN: ${invoice.gstin}` : 'GSTIN: Unregistered Consumer';
  doc.setFont('helvetica', 'bold');
  doc.text(customerGstin, pageWidth - margin - 50, y + 9);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.isIntraState ? 'Tax Type: Intra-State (CGST + SGST)' : 'Tax Type: Inter-State (IGST)', pageWidth - margin - 50, y + 13.5);

  y += 22;

  // 4. Line Items Table using autoTable
  const tableRows = invoice.items.map((item, index) => {
    const taxLabel = invoice.isIntraState
      ? `${item.taxRate}% (C:${item.taxRate / 2}% S:${item.taxRate / 2}%)`
      : `${item.taxRate}% IGST`;

    return [
      String(index + 1),
      item.productName + (item.description ? `\n${item.description}` : ''),
      item.hsnSac || '998311',
      `${item.quantity} ${item.unit || 'Nos'}`,
      formatINR(item.rate),
      formatINR(item.taxableAmount),
      taxLabel,
      formatINR(item.total),
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['#', 'Item & Description', 'HSN/SAC', 'Qty', 'Unit Rate', 'Taxable Amt', 'GST Rate', 'Total']],
    body: tableRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: { top: 2.2, right: 2.5, bottom: 2.2, left: 2.5 },
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'left', cellWidth: 'auto' }, // Item & Description
      2: { halign: 'center', cellWidth: 16 }, // HSN/SAC
      3: { halign: 'right', cellWidth: 16 }, // Qty
      4: { halign: 'right', cellWidth: 22 }, // Rate
      5: { halign: 'right', cellWidth: 24 }, // Taxable
      6: { halign: 'right', cellWidth: 26 }, // GST Rate
      7: { halign: 'right', cellWidth: 26 }, // Total
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  let currentY = (doc as any).lastAutoTable?.finalY || y + 50;

  // Check if summary and payment fit on current page; if not, add page
  if (currentY > pageHeight - 75) {
    doc.addPage();
    currentY = margin;
  } else {
    currentY += 4;
  }

  // 5. Totals Block (Right Column) & Payment Details + QR (Left Column)
  const summaryBoxWidth = 76;
  const summaryBoxX = pageWidth - margin - summaryBoxWidth;

  // Right: Totals Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryBoxX, currentY, summaryBoxWidth, 48, 2, 2, 'FD');

  let rowY = currentY + 5;
  const drawSummaryRow = (label: string, value: string, isBold: boolean = false, color: number[] = [71, 85, 105]) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(label, summaryBoxX + 4, rowY);
    doc.text(value, pageWidth - margin - 4, rowY, { align: 'right' });
    rowY += 4.5;
  };

  drawSummaryRow('Taxable Value:', formatINR(invoice.taxableAmount));
  if (invoice.isIntraState) {
    drawSummaryRow(`Central GST (CGST):`, formatINR(invoice.cgst));
    drawSummaryRow(`State GST (SGST):`, formatINR(invoice.sgst));
  } else {
    drawSummaryRow(`Integrated GST (IGST):`, formatINR(invoice.igst));
  }

  if (invoice.roundOff !== 0) {
    drawSummaryRow('Round Off (+/-):', formatINR(invoice.roundOff));
  }

  // Grand Total Banner
  rowY += 1;
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(summaryBoxX + 2, rowY - 3, summaryBoxWidth - 4, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Grand Total:', summaryBoxX + 4, rowY + 2.5);
  doc.text(formatINR(invoice.total), pageWidth - margin - 4, rowY + 2.5, { align: 'right' });

  rowY += 10;
  drawSummaryRow('Amount Received / Paid:', formatINR(invoice.amountPaid), true, [16, 185, 129]);
  drawSummaryRow('Balance Amount Due:', formatINR(invoice.amountDue), true, [225, 29, 72]);

  // Left: Amount in Words, Bank Info, & Dynamic UPI QR Code
  const leftX = margin;
  const leftWidth = contentWidth - summaryBoxWidth - 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Invoice Amount in Words:', leftX, currentY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text(numberToIndianWords(invoice.total), leftX, currentY + 8);

  // Bank & UPI Box
  const bankBoxY = currentY + 12;
  const bankBoxHeight = 36;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(leftX, bankBoxY, leftWidth, bankBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Bank & UPI Transfer Information:', leftX + 4, bankBoxY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Bank Name: HDFC Bank Ltd.`, leftX + 4, bankBoxY + 9.5);
  doc.text(`A/c Name: ${org.legalName || org.name}`, leftX + 4, bankBoxY + 13.5);
  doc.text(`A/c Number: 50200098765432 (Current A/c)`, leftX + 4, bankBoxY + 17.5);
  doc.text(`IFSC Code: HDFC0001024   |   Branch: Makarpura`, leftX + 4, bankBoxY + 21.5);
  doc.text(`UPI VPA: zerodemo@hdfcbank`, leftX + 4, bankBoxY + 25.5);

  // Generate & Render dynamic UPI QR Code
  try {
    const upiLink = generateUPILink(
      'zerodemo@hdfcbank',
      org.legalName || org.name,
      invoice.amountDue > 0 ? invoice.amountDue : invoice.total,
      `Inv ${invoice.invoiceNumber}`
    );
    const qrDataUrl = await generateQRCodeDataUrl(upiLink);
    if (qrDataUrl) {
      const qrSize = 25;
      const qrX = leftX + leftWidth - qrSize - 4;
      const qrY = bankBoxY + 3;
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(37, 99, 235);
      doc.text('SCAN TO PAY (UPI)', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' });
    }
  } catch (qrErr) {
    console.warn('Could not render QR code in PDF', qrErr);
  }

  // 6. Status Stamp Watermark
  if (invoice.status === 'PAID') {
    doc.setDrawColor(16, 185, 129); // emerald
    doc.setLineWidth(0.8);
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(summaryBoxX + 4, currentY + 36, summaryBoxWidth - 8, 8, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(5, 150, 105);
    doc.text('PAID IN FULL - RECONCILED', summaryBoxX + summaryBoxWidth / 2, currentY + 41.5, { align: 'center' });
  } else if (invoice.status === 'PARTIALLY_PAID') {
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.8);
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(summaryBoxX + 4, currentY + 36, summaryBoxWidth - 8, 8, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(180, 83, 9);
    doc.text('PARTIALLY PAID', summaryBoxX + summaryBoxWidth / 2, currentY + 41.5, { align: 'center' });
  }

  currentY += 54;

  // 7. Terms & Conditions and Authorized Signatory
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = margin;
  }

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 4;

  // Left: Terms
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Terms & Conditions:', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('1. Goods once sold will not be accepted back or exchanged after delivery confirmation.', margin, currentY + 3.5);
  doc.text('2. Delayed payments attract interest @ 18% p.a. from due date until actual settlement.', margin, currentY + 7);
  doc.text('3. All disputes subject to Vadodara, Gujarat jurisdiction only.', margin, currentY + 10.5);

  // Right: Authorized Signatory
  const sigX = pageWidth - margin - 55;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`For ${org.legalName || org.name}`, sigX, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Signatory / Digital Seal', sigX, currentY + 14);

  // 8. Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `ZeroBooks Tax Invoice  |  Generated on ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}  |  Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  return doc;
}

export async function downloadInvoicePDF(invoice: Invoice) {
  const doc = await generateInvoicePDF(invoice);
  doc.save(`${invoice.invoiceNumber}.pdf`);
}

export async function getInvoicePDFBlob(invoice: Invoice): Promise<{ blob: Blob; file: File }> {
  const doc = await generateInvoicePDF(invoice);
  const blob = doc.output('blob');
  const filename = `${invoice.invoiceNumber}.pdf`;
  const file = new File([blob], filename, { type: 'application/pdf' });
  return { blob, file };
}

// ----------------------------------------------------------------------
// 2. PAYMENT RECEIPT PDF GENERATOR (GST Rule 50 Compliant)
// ----------------------------------------------------------------------

export async function generatePaymentReceiptPDF(payment: Payment): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const org = db.organization;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  // Header Banner
  doc.setFillColor(5, 150, 105); // emerald-600
  doc.rect(margin, y, contentWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('ZEROBOOKS', margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(209, 250, 229); // emerald-100
  doc.text('OFFICIAL PAYMENT RECEIPT & RECONCILIATION VOUCHER', margin + 6, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('RECEIPT VOUCHER', pageWidth - margin - 6, y + 9, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(209, 250, 229);
  doc.text('(Rule 50 of CGST Rules, 2017)', pageWidth - margin - 6, y + 15, { align: 'right' });

  y += 28;

  // Organization info (Left) and Receipt Meta (Right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(org.legalName || org.name, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${org.address || ''}, ${org.city || ''}, ${org.state} - ${org.pinCode || ''}`, margin, y + 4.5);
  doc.text(`GSTIN: ${org.gstin || 'N/A'}  |  PAN: ${org.pan || 'N/A'}  |  State: ${org.state} (${org.stateCode})`, margin, y + 8.5);
  doc.text(`Email: ${org.email}  |  Phone: ${org.phone || ''}`, margin, y + 12.5);

  // Meta Box
  const metaX = pageWidth - margin - 72;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(metaX, y - 3, 72, 22, 2, 2, 'FD');

  const receiptNo = `REC-${payment.id.replace('pay-', '').substring(0, 8).toUpperCase()}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  doc.text(`Receipt No: ${receiptNo}`, metaX + 4, y + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Receipt Date:`, metaX + 4, y + 6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${new Date(payment.paymentDate).toLocaleDateString('en-IN')}`, metaX + 28, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Payment Mode:`, metaX + 4, y + 11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${payment.paymentMethod.replace('_', ' ')}`, metaX + 28, y + 11);

  y += 24;

  // Received From Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('RECEIVED WITH THANKS FROM (PAYER):', margin + 4, y + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(payment.customerName, margin + 4, y + 9.5);

  const customerObj = db.customers.find((c) => c.id === payment.customerId);
  const customerGstin = customerObj?.gstin ? `GSTIN: ${customerObj.gstin}` : 'Unregistered Recipient';
  const customerCity = customerObj?.city ? `${customerObj.city}, ${customerObj.state}` : 'India';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${customerCity}  |  ${customerGstin}`, margin + 4, y + 14);

  y += 24;

  // Payment Breakdown Table
  const tableData = [
    [
      'Payment Amount Received',
      formatINR(payment.amount),
    ],
    [
      'Amount in Words',
      numberToIndianWords(payment.amount),
    ],
    [
      'Payment Instrument / Mode',
      payment.paymentMethod.replace('_', ' '),
    ],
    [
      'Transaction Reference / UTR',
      payment.reference || 'Bank Settlement Ref / Direct',
    ],
    [
      'Deposited Into Bank / Account',
      payment.bankAccountName || 'HDFC Bank Current Account',
    ],
    [
      'Settled Against Invoice',
      payment.invoiceNumber ? `Tax Invoice ${payment.invoiceNumber}` : 'On Account (Advance Payment)',
    ],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Particulars', 'Payment Details']],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55 },
      1: { cellWidth: 'auto' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  let currentY = (doc as any).lastAutoTable?.finalY || y + 60;
  currentY += 8;

  // Verified Receipt Stamp Box
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, currentY, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(5, 150, 105);
  doc.text('PAYMENT RECEIVED & GENERAL LEDGER RECONCILED', margin + 6, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `This voucher confirms receipt of ₹${formatINR(payment.amount)}. Thank you for your business!`,
    margin + 6,
    currentY + 13
  );

  currentY += 28;

  // Signatory Box
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;

  const sigX = pageWidth - margin - 60;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`For ${org.legalName || org.name}`, sigX, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Finance Signatory', sigX, currentY + 12);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Official GST Receipt Voucher  |  ZeroBooks Cloud ERP  |  Page 1 of 1`,
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );

  return doc;
}

export async function downloadPaymentReceiptPDF(payment: Payment) {
  const doc = await generatePaymentReceiptPDF(payment);
  doc.save(`Receipt_${payment.reference || payment.id}.pdf`);
}

export async function getPaymentReceiptPDFBlob(payment: Payment): Promise<{ blob: Blob; file: File }> {
  const doc = await generatePaymentReceiptPDF(payment);
  const blob = doc.output('blob');
  const filename = `Receipt_${payment.reference || payment.id}.pdf`;
  const file = new File([blob], filename, { type: 'application/pdf' });
  return { blob, file };
}

// ----------------------------------------------------------------------
// 3. QUOTATION / ESTIMATE PDF GENERATOR
// ----------------------------------------------------------------------

export async function generateQuotePDF(quote: Quote): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const org = db.organization;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  // Header Banner
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(margin, y, contentWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('ZEROBOOKS', margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(191, 219, 254);
  doc.text('COMMERCIAL ESTIMATE & PROPOSAL', margin + 6, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('QUOTATION', pageWidth - margin - 6, y + 9, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(191, 219, 254);
  doc.text(`Status: ${quote.status}`, pageWidth - margin - 6, y + 15, { align: 'right' });

  y += 28;

  // Org Info & Meta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(org.legalName || org.name, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${org.address || ''}, ${org.city || ''}, ${org.state} - ${org.pinCode || ''}`, margin, y + 4.5);
  doc.text(`GSTIN: ${org.gstin || 'N/A'}  |  Email: ${org.email}`, margin, y + 8.5);

  // Meta Box
  const metaX = pageWidth - margin - 72;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(metaX, y - 3, 72, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(37, 99, 235);
  doc.text(`Quote No: ${quote.quoteNumber}`, metaX + 4, y + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Date: ${new Date(quote.date).toLocaleDateString('en-IN')}`, metaX + 4, y + 6.5);
  doc.text(
    `Valid Until: ${quote.expiryDate ? new Date(quote.expiryDate).toLocaleDateString('en-IN') : '30 Days'}`,
    metaX + 4,
    y + 11
  );

  y += 22;

  // Recipient Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('PREPARED FOR (PROSPECT / CUSTOMER):', margin + 4, y + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(quote.customerName, margin + 4, y + 9.5);

  y += 18;

  // Table
  const tableRows = quote.items.map((it, idx) => [
    String(idx + 1),
    it.description,
    `${it.quantity} ${it.unit}`,
    formatINR(it.rate),
    formatINR(it.taxableAmount),
    `${it.taxRate}%`,
    formatINR(it.total),
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['#', 'Item Description', 'Qty', 'Unit Rate', 'Taxable Amt', 'GST %', 'Total Amount']],
    body: tableRows,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2.2 },
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'left', cellWidth: 'auto' },
      2: { halign: 'right', cellWidth: 18 },
      3: { halign: 'right', cellWidth: 24 },
      4: { halign: 'right', cellWidth: 26 },
      5: { halign: 'right', cellWidth: 18 },
      6: { halign: 'right', cellWidth: 28 },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || y + 40;
  const summaryBoxX = pageWidth - margin - 72;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryBoxX, finalY + 4, 72, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal:', summaryBoxX + 4, finalY + 9);
  doc.text(formatINR(quote.subtotal), pageWidth - margin - 4, finalY + 9, { align: 'right' });

  doc.text('Estimated GST Tax:', summaryBoxX + 4, finalY + 14);
  doc.text(formatINR(quote.tax), pageWidth - margin - 4, finalY + 14, { align: 'right' });

  doc.setFillColor(37, 99, 235);
  doc.rect(summaryBoxX + 2, finalY + 17, 68, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Total Quotation:', summaryBoxX + 4, finalY + 22);
  doc.text(formatINR(quote.total), pageWidth - margin - 4, finalY + 22, { align: 'right' });

  return doc;
}

export async function downloadQuotePDF(quote: Quote) {
  const doc = await generateQuotePDF(quote);
  doc.save(`${quote.quoteNumber}.pdf`);
}

// ----------------------------------------------------------------------
// 4. SALES ORDER PDF GENERATOR
// ----------------------------------------------------------------------

export async function generateSalesOrderPDF(order: SalesOrder): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const org = db.organization;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  // Header Banner
  doc.setFillColor(109, 40, 217); // purple-700
  doc.rect(margin, y, contentWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('ZEROBOOKS', margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(233, 213, 255);
  doc.text('SALES ORDER CONFIRMATION', margin + 6, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('SALES ORDER', pageWidth - margin - 6, y + 9, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(233, 213, 255);
  doc.text(`Status: ${order.status}`, pageWidth - margin - 6, y + 15, { align: 'right' });

  y += 28;

  // Meta Box
  const metaX = pageWidth - margin - 72;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(metaX, y - 3, 72, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(109, 40, 217);
  doc.text(`Order No: ${order.orderNumber}`, metaX + 4, y + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Order Date: ${new Date(order.date).toLocaleDateString('en-IN')}`, metaX + 4, y + 6.5);
  doc.text(`Customer: ${order.customerName}`, metaX + 4, y + 11);

  y += 24;

  const tableRows = order.items.map((it, idx) => [
    String(idx + 1),
    it.description,
    `${it.quantity} ${it.unit}`,
    formatINR(it.rate),
    formatINR(it.taxableAmount),
    `${it.taxRate}%`,
    formatINR(it.total),
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['#', 'Item Description', 'Qty', 'Rate', 'Taxable', 'GST %', 'Total Amount']],
    body: tableRows,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2.2 },
    headStyles: { fillColor: [109, 40, 217], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'left', cellWidth: 'auto' },
      2: { halign: 'right', cellWidth: 18 },
      3: { halign: 'right', cellWidth: 24 },
      4: { halign: 'right', cellWidth: 26 },
      5: { halign: 'right', cellWidth: 18 },
      6: { halign: 'right', cellWidth: 28 },
    },
  });

  return doc;
}

export async function downloadSalesOrderPDF(order: SalesOrder) {
  const doc = await generateSalesOrderPDF(order);
  doc.save(`${order.orderNumber}.pdf`);
}

// ----------------------------------------------------------------------
// 5. DOCUMENT SHARING HELPER COMPILATIONS (WhatsApp, Email, Copy)
// ----------------------------------------------------------------------

export interface DocumentShareInfo {
  title: string;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  whatsappText: string;
  emailSubject: string;
  emailBody: string;
  upiPaymentLink?: string;
  downloadFilename: string;
  amountFormatted: string;
}

/**
 * Format phone number into clean WhatsApp international format (+91...)
 */
export function formatPhoneForWhatsApp(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return digits;
  return digits;
}

export function getInvoiceShareInfo(invoice: Invoice): DocumentShareInfo {
  const org = db.organization;
  const customer = db.customers.find((c) => c.id === invoice.customerId);
  const upiLink = generateUPILink(
    'zerodemo@hdfcbank',
    org.legalName || org.name,
    invoice.amountDue > 0 ? invoice.amountDue : invoice.total,
    `Inv ${invoice.invoiceNumber}`
  );

  const phone = customer?.phone || '';
  const email = customer?.email || '';

  const whatsappText = `*Tax Invoice: ${invoice.invoiceNumber}*
Dear *${invoice.customerName}*,

Please find the details of your Tax Invoice from *${org.legalName || org.name}*:

*Invoice No:* ${invoice.invoiceNumber}
*Invoice Date:* ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
*Due Date:* ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}
*Invoice Total:* ${formatINR(invoice.total)}
*Amount Paid:* ${formatINR(invoice.amountPaid)}
*Balance Due:* ${formatINR(invoice.amountDue)}

*Bank Transfer Details:*
Bank: HDFC Bank Ltd.
A/c No: 50200098765432
IFSC: HDFC0001024
UPI ID: zerodemo@hdfcbank

*Pay instantly via UPI:*
${upiLink}

Thank you for your business!`;

  const emailSubject = `Tax Invoice ${invoice.invoiceNumber} from ${org.legalName || org.name} [${formatINR(invoice.total)}]`;

  const emailBody = `Dear ${invoice.customerName},

Greetings from ${org.legalName || org.name}!

We have issued Tax Invoice ${invoice.invoiceNumber} dated ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')} for your account.

INVOICE SUMMARY:
----------------------------------------
Invoice Number : ${invoice.invoiceNumber}
Invoice Date   : ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
Due Date       : ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}
Total Amount   : ${formatINR(invoice.total)}
Amount Paid    : ${formatINR(invoice.amountPaid)}
Balance Due    : ${formatINR(invoice.amountDue)}
Amount in Words: ${numberToIndianWords(invoice.total)}
----------------------------------------

PAYMENT INSTRUCTIONS:
Direct Bank Transfer (NEFT / RTGS / IMPS):
- Bank Name   : HDFC Bank Ltd.
- Account Name: ${org.legalName || org.name}
- Account No  : 50200098765432
- IFSC Code   : HDFC0001024
- Branch      : Makarpura, Vadodara

UPI Payment:
- VPA: zerodemo@hdfcbank

Please reply to this email or send payment confirmation UTR once transferred.

Warm regards,
Accounts Department
${org.legalName || org.name}
Phone: ${org.phone || '+91 98765 43210'}
Email: ${org.email}`;

  return {
    title: `Tax Invoice ${invoice.invoiceNumber}`,
    recipientName: invoice.customerName,
    recipientEmail: email,
    recipientPhone: phone,
    whatsappText,
    emailSubject,
    emailBody,
    upiPaymentLink: upiLink,
    downloadFilename: `${invoice.invoiceNumber}.pdf`,
    amountFormatted: formatINR(invoice.total),
  };
}

export function getPaymentReceiptShareInfo(payment: Payment): DocumentShareInfo {
  const org = db.organization;
  const customer = db.customers.find((c) => c.id === payment.customerId);
  const phone = customer?.phone || '';
  const email = customer?.email || '';
  const receiptNo = `REC-${payment.id.replace('pay-', '').substring(0, 8).toUpperCase()}`;

  const whatsappText = `*Payment Receipt: ${receiptNo}*
Dear *${payment.customerName}*,

We gratefully acknowledge receipt of your payment of *${formatINR(payment.amount)}* (${numberToIndianWords(payment.amount)}).

*Receipt Details:*
Receipt No: ${receiptNo}
Date: ${new Date(payment.paymentDate).toLocaleDateString('en-IN')}
Payment Mode: ${payment.paymentMethod.replace('_', ' ')}
Reference / UTR: ${payment.reference || 'Bank Settlement Ref'}
${payment.invoiceNumber ? `Settled Against Invoice: ${payment.invoiceNumber}` : 'Recorded on Account'}

Your ledger account has been credited and reconciled. Thank you for prompt settlement!

Best regards,
*${org.legalName || org.name}*`;

  const emailSubject = `Payment Receipt ${receiptNo} from ${org.legalName || org.name} - ${formatINR(payment.amount)}`;

  const emailBody = `Dear ${payment.customerName},

Thank you for your payment to ${org.legalName || org.name}.

We are pleased to confirm that payment has been successfully received and credited to your ledger account.

RECEIPT VOUCHER DETAILS:
----------------------------------------
Receipt Number : ${receiptNo}
Date Received  : ${new Date(payment.paymentDate).toLocaleDateString('en-IN')}
Amount Received: ${formatINR(payment.amount)}
Amount in Words: ${numberToIndianWords(payment.amount)}
Payment Method : ${payment.paymentMethod.replace('_', ' ')}
Reference/UTR  : ${payment.reference || 'N/A'}
${payment.invoiceNumber ? `Against Invoice: ${payment.invoiceNumber}` : 'Account Credit'}
----------------------------------------

The official PDF receipt voucher is generated and available for your tax and accounting audit records.

Sincerely,
Finance & Accounts Team
${org.legalName || org.name}`;

  return {
    title: `Payment Receipt ${receiptNo}`,
    recipientName: payment.customerName,
    recipientEmail: email,
    recipientPhone: phone,
    whatsappText,
    emailSubject,
    emailBody,
    downloadFilename: `Receipt_${receiptNo}.pdf`,
    amountFormatted: formatINR(payment.amount),
  };
}

export function getQuoteShareInfo(quote: Quote): DocumentShareInfo {
  const org = db.organization;
  const customer = db.customers.find((c) => c.id === quote.customerId);
  const phone = customer?.phone || '';
  const email = customer?.email || '';

  const whatsappText = `*Quotation: ${quote.quoteNumber}*
Dear *${quote.customerName}*,

Please find the commercial proposal from *${org.legalName || org.name}*:

*Quote No:* ${quote.quoteNumber}
*Quote Date:* ${new Date(quote.date).toLocaleDateString('en-IN')}
*Valid Until:* ${quote.expiryDate ? new Date(quote.expiryDate).toLocaleDateString('en-IN') : '30 Days'}
*Total Estimated Value:* ${formatINR(quote.total)}

We look forward to partnering with you! Please let us know if you have any questions or to confirm this proposal.

Best regards,
*${org.legalName || org.name}*`;

  const emailSubject = `Quotation ${quote.quoteNumber} from ${org.legalName || org.name}`;

  const emailBody = `Dear ${quote.customerName},

Thank you for your interest in our products and services.

We are pleased to present Quotation ${quote.quoteNumber} dated ${new Date(quote.date).toLocaleDateString('en-IN')} with an estimated total of ${formatINR(quote.total)}.

Please find the itemized details in the quotation. Do let us know if you require any clarifications or modifications.

Warm regards,
Sales Department
${org.legalName || org.name}`;

  return {
    title: `Quotation ${quote.quoteNumber}`,
    recipientName: quote.customerName,
    recipientEmail: email,
    recipientPhone: phone,
    whatsappText,
    emailSubject,
    emailBody,
    downloadFilename: `${quote.quoteNumber}.pdf`,
    amountFormatted: formatINR(quote.total),
  };
}
