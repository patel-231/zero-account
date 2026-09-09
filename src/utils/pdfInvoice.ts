import { jsPDF } from 'jspdf';
import { Invoice } from '../types';
import { db } from '../server/db';
import { formatINR, numberToIndianWords } from './money';

export function generateInvoicePDF(invoice: Invoice): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const org = db.organization;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 16;

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(14, y, pageWidth - 28, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ZEROBOOKS', 20, y + 9);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('TAX INVOICE', pageWidth - 20, y + 9, { align: 'right' });
  doc.text('(Original for Recipient)', pageWidth - 20, y + 16, { align: 'right' });

  y += 28;

  // Business & Invoice Header Info
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(org.legalName || org.name, 14, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`${org.address || ''}, ${org.city || ''}, ${org.state} - ${org.pinCode || ''}`, 14, y + 5);
  doc.text(`GSTIN: ${org.gstin || 'N/A'}  |  PAN: ${org.pan || 'N/A'}  |  State Code: ${org.stateCode}`, 14, y + 9);
  doc.text(`Email: ${org.email}  |  Phone: ${org.phone || ''}`, 14, y + 13);

  // Invoice Details Card (Right Side)
  const rightColX = pageWidth - 70;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Invoice Details:', rightColX, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Invoice No:`, rightColX, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(`${invoice.invoiceNumber}`, rightColX + 22, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.text(`Date:`, rightColX, y + 9);
  doc.text(`${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`, rightColX + 22, y + 9);

  doc.text(`Due Date:`, rightColX, y + 13);
  doc.text(`${new Date(invoice.dueDate).toLocaleDateString('en-IN')}`, rightColX + 22, y + 13);

  doc.text(`Place of Supply:`, rightColX, y + 17);
  doc.text(`${invoice.placeOfSupply}`, rightColX + 22, y + 17);

  y += 24;

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, pageWidth - 14, y);
  y += 6;

  // Customer / Bill To Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Billed To (Customer):', 14, y);

  doc.setFontSize(8);
  doc.text(invoice.customerName, 14, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${invoice.billingAddress || ''}`, 14, y + 9);
  doc.text(`GSTIN: ${invoice.gstin || 'Unregistered'}  |  Place of Supply: ${invoice.placeOfSupply}`, 14, y + 13);

  y += 20;

  // Line Items Table Header
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  doc.text('#', 16, y + 5);
  doc.text('Item & Description', 24, y + 5);
  doc.text('HSN/SAC', 85, y + 5);
  doc.text('Qty', 105, y + 5, { align: 'right' });
  doc.text('Rate', 125, y + 5, { align: 'right' });
  doc.text('Taxable', 148, y + 5, { align: 'right' });
  doc.text('GST Rate', 168, y + 5, { align: 'right' });
  doc.text('Total', pageWidth - 16, y + 5, { align: 'right' });

  y += 9;

  // Line items
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  invoice.items.forEach((item, index) => {
    // Row background zebra stripe
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 4, pageWidth - 28, 7, 'F');
    }

    doc.text(String(index + 1), 16, y);
    doc.text(item.productName.substring(0, 32), 24, y);
    doc.text(item.hsnSac || '-', 85, y);
    doc.text(`${item.quantity} ${item.unit}`, 105, y, { align: 'right' });
    doc.text(formatINR(item.rate), 125, y, { align: 'right' });
    doc.text(formatINR(item.taxableAmount), 148, y, { align: 'right' });
    doc.text(`${item.taxRate}%`, 168, y, { align: 'right' });
    doc.text(formatINR(item.total), pageWidth - 16, y, { align: 'right' });

    y += 7;
  });

  y += 4;
  doc.line(14, y, pageWidth - 14, y);
  y += 6;

  // Summary / Totals block on bottom right
  const summaryX = pageWidth - 80;

  doc.setFontSize(8);
  doc.text('Taxable Subtotal:', summaryX, y);
  doc.text(formatINR(invoice.taxableAmount), pageWidth - 16, y, { align: 'right' });
  y += 5;

  if (invoice.isIntraState) {
    doc.text(`Central GST (CGST):`, summaryX, y);
    doc.text(formatINR(invoice.cgst), pageWidth - 16, y, { align: 'right' });
    y += 5;

    doc.text(`State GST (SGST):`, summaryX, y);
    doc.text(formatINR(invoice.sgst), pageWidth - 16, y, { align: 'right' });
    y += 5;
  } else {
    doc.text(`Integrated GST (IGST):`, summaryX, y);
    doc.text(formatINR(invoice.igst), pageWidth - 16, y, { align: 'right' });
    y += 5;
  }

  if (invoice.roundOff !== 0) {
    doc.text(`Round-off Adjustment:`, summaryX, y);
    doc.text(formatINR(invoice.roundOff), pageWidth - 16, y, { align: 'right' });
    y += 5;
  }

  // Grand Total banner
  doc.setFillColor(30, 41, 59);
  doc.rect(summaryX - 4, y - 2, 70, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Grand Total:', summaryX, y + 4);
  doc.text(formatINR(invoice.total), pageWidth - 16, y + 4, { align: 'right' });

  // Left column: Amount in Words & Bank Details
  const leftBottomY = y - 18;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Amount in Words:', 14, leftBottomY);
  doc.setFont('helvetica', 'normal');
  doc.text(numberToIndianWords(invoice.total), 14, leftBottomY + 4);

  doc.setFont('helvetica', 'bold');
  doc.text('Bank Transfer Details:', 14, leftBottomY + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Bank: HDFC Bank  |  Account No: 50200098765432  |  IFSC: HDFC0001024`, 14, leftBottomY + 15);
  doc.text(`Branch: Makarpura, Vadodara  |  UPI: zerodemo@hdfcbank`, 14, leftBottomY + 19);

  y += 24;

  // Terms & Signatory
  doc.setDrawColor(203, 213, 225);
  doc.line(14, y, pageWidth - 14, y);
  y += 6;

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Terms & Conditions:', 14, y);
  doc.text('1. Goods once sold will not be accepted back or exchanged.', 14, y + 4);
  doc.text('2. Interest @ 18% p.a. will be charged if payment is delayed beyond due date.', 14, y + 8);
  doc.text('3. Subject to Vadodara jurisdiction only.', 14, y + 12);

  // Authorized Signatory
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`For ${org.name}`, pageWidth - 55, y);
  doc.text('Authorized Signatory', pageWidth - 55, y + 16);

  return doc;
}

export function downloadInvoicePDF(invoice: Invoice) {
  const doc = generateInvoicePDF(invoice);
  doc.save(`${invoice.invoiceNumber}.pdf`);
}
