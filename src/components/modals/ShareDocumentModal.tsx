import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Send,
  MessageSquare,
  Mail,
  Download,
  Printer,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Receipt,
  QrCode,
  Phone,
  Briefcase,
  Building,
  User,
  Sparkles,
} from 'lucide-react';
import { Invoice, Payment, Quote, SalesOrder } from '../../types';
import { db } from '../../server/db';
import {
  DocumentShareInfo,
  getInvoiceShareInfo,
  getPaymentReceiptShareInfo,
  getQuoteShareInfo,
  downloadInvoicePDF,
  downloadPaymentReceiptPDF,
  downloadQuotePDF,
  downloadSalesOrderPDF,
  getInvoicePDFBlob,
  getPaymentReceiptPDFBlob,
  formatPhoneForWhatsApp,
  generateInvoicePDF,
  generatePaymentReceiptPDF,
  generateQuotePDF,
} from '../../utils/pdfService';

export type ShareDocType = 'INVOICE' | 'RECEIPT' | 'QUOTE' | 'SALES_ORDER';

interface ShareDocumentModalProps {
  type: ShareDocType;
  data: Invoice | Payment | Quote | SalesOrder;
  onClose: () => void;
}

export const ShareDocumentModal: React.FC<ShareDocumentModalProps> = ({
  type,
  data,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email' | 'device' | 'download'>('whatsapp');
  const [recipientRole, setRecipientRole] = useState<'customer' | 'ca' | 'internal' | 'custom'>('customer');
  const [copied, setCopied] = useState<string | null>(null);
  const [isSharingDevice, setIsSharingDevice] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Compute share info based on type
  const baseShareInfo = React.useMemo<DocumentShareInfo>(() => {
    switch (type) {
      case 'INVOICE':
        return getInvoiceShareInfo(data as Invoice);
      case 'RECEIPT':
        return getPaymentReceiptShareInfo(data as Payment);
      case 'QUOTE':
        return getQuoteShareInfo(data as Quote);
      case 'SALES_ORDER':
        return {
          title: `Sales Order ${(data as SalesOrder).orderNumber}`,
          recipientName: (data as SalesOrder).customerName,
          recipientEmail: '',
          recipientPhone: '',
          whatsappText: `*Sales Order: ${(data as SalesOrder).orderNumber}*\nCustomer: ${(data as SalesOrder).customerName}`,
          emailSubject: `Sales Order ${(data as SalesOrder).orderNumber}`,
          emailBody: `Sales Order confirmation for ${(data as SalesOrder).customerName}.`,
          downloadFilename: `${(data as SalesOrder).orderNumber}.pdf`,
          amountFormatted: `₹${(data as SalesOrder).total}`,
        };
      default:
        throw new Error('Unknown document type');
    }
  }, [type, data]);

  // Form states allowing dynamic customization before sending
  const [targetPhone, setTargetPhone] = useState(baseShareInfo.recipientPhone || '');
  const [targetEmail, setTargetEmail] = useState(baseShareInfo.recipientEmail || '');
  const [targetCc, setTargetCc] = useState('');
  const [customMessage, setCustomMessage] = useState(baseShareInfo.whatsappText);
  const [customEmailSubject, setCustomEmailSubject] = useState(baseShareInfo.emailSubject);
  const [customEmailBody, setCustomEmailBody] = useState(baseShareInfo.emailBody);

  // Switch recipient preset
  const handleSelectRole = (role: 'customer' | 'ca' | 'internal' | 'custom') => {
    setRecipientRole(role);
    if (role === 'customer') {
      setTargetPhone(baseShareInfo.recipientPhone || '');
      setTargetEmail(baseShareInfo.recipientEmail || '');
      setTargetCc('');
    } else if (role === 'ca') {
      setTargetEmail('ca.audit@taxconsultants.in');
      setTargetCc(db.organization.email);
      setCustomEmailSubject(`[For Audit/GST Filing] ${baseShareInfo.emailSubject}`);
    } else if (role === 'internal') {
      setTargetEmail('finance@zerobooks.corp');
      setTargetCc('');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2500);
  };

  // 1. WhatsApp Handler
  const handleOpenWhatsApp = () => {
    const cleanNumber = formatPhoneForWhatsApp(targetPhone);
    const encodedText = encodeURIComponent(customMessage);
    const url = cleanNumber
      ? `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 2. Email Handler (mailto)
  const handleOpenEmail = () => {
    const subject = encodeURIComponent(customEmailSubject);
    const body = encodeURIComponent(customEmailBody);
    let mailtoUrl = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
    if (targetCc) {
      mailtoUrl += `&cc=${encodeURIComponent(targetCc)}`;
    }
    window.location.href = mailtoUrl;
  };

  // 3. Web Share API (native share with PDF attachment)
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleDeviceShare = async () => {
    setIsSharingDevice(true);
    try {
      if (type === 'INVOICE') {
        const { file } = await getInvoicePDFBlob(data as Invoice);
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: baseShareInfo.title,
            text: `Please find attached ${baseShareInfo.title} from ${db.organization.name}`,
            files: [file],
          });
          return;
        }
      } else if (type === 'RECEIPT') {
        const { file } = await getPaymentReceiptPDFBlob(data as Payment);
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: baseShareInfo.title,
            text: `Please find attached official ${baseShareInfo.title} from ${db.organization.name}`,
            files: [file],
          });
          return;
        }
      }

      // Fallback to text share
      if (navigator.share) {
        await navigator.share({
          title: baseShareInfo.title,
          text: customMessage,
        });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Native share failed or dismissed', err);
      }
    } finally {
      setIsSharingDevice(false);
    }
  };

  // 4. Download PDF
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      if (type === 'INVOICE') await downloadInvoicePDF(data as Invoice);
      else if (type === 'RECEIPT') await downloadPaymentReceiptPDF(data as Payment);
      else if (type === 'QUOTE') await downloadQuotePDF(data as Quote);
      else if (type === 'SALES_ORDER') await downloadSalesOrderPDF(data as SalesOrder);
    } finally {
      setIsDownloading(false);
    }
  };

  // 5. Print PDF
  const handlePrint = async () => {
    let doc;
    if (type === 'INVOICE') doc = await generateInvoicePDF(data as Invoice);
    else if (type === 'RECEIPT') doc = await generatePaymentReceiptPDF(data as Payment);
    else if (type === 'QUOTE') doc = await generateQuotePDF(data as Quote);

    if (doc) {
      doc.autoPrint();
      const blobUrl = doc.output('bloburl');
      window.open(blobUrl as unknown as string, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {type === 'RECEIPT' ? <Receipt className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">{baseShareInfo.title}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300">
                  {baseShareInfo.amountFormatted}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dispatch verified PDF and notifications to customer, accountant, or finance team
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recipient Quick Selector */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Send Document To:
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Primary: <strong className="text-slate-800">{baseShareInfo.recipientName}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleSelectRole('customer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                recipientRole === 'customer'
                  ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">Customer</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRole('ca')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                recipientRole === 'ca'
                  ? 'bg-purple-50 border-purple-300 text-purple-800 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="truncate">CA / Auditor</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRole('internal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                recipientRole === 'internal'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Internal Team</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRole('custom')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                recipientRole === 'custom'
                  ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">Custom Contact</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-5 pt-2 bg-white">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'whatsapp'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp Dispatch</span>
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'email'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email Client</span>
          </button>

          {canNativeShare && (
            <button
              onClick={() => setActiveTab('device')}
              className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold border-b-2 transition ${
                activeTab === 'device'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>Device Share</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('download')}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'download'
                ? 'border-slate-800 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Download & Print</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          
          {/* 1. WHATSAPP TAB */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recipient WhatsApp Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={targetPhone}
                    onChange={(e) => setTargetPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter 10-digit Indian number or international format (+91).
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Message Preview (Formatted WhatsApp Markdown)
                  </label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(customMessage, 'whatsapp')}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                  >
                    {copied === 'whatsapp' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied === 'whatsapp' ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full text-xs p-3 font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF First</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send on WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </button>
              </div>
            </div>
          )}

          {/* 2. EMAIL TAB */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Email (To)</label>
                  <input
                    type="email"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    placeholder="customer@company.com"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CC Email (Optional)</label>
                  <input
                    type="email"
                    value={targetCc}
                    onChange={(e) => setTargetCc(e.target.value)}
                    placeholder="ca@taxfirm.in, accounts@zerobooks.local"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject Line</label>
                <input
                  type="text"
                  value={customEmailSubject}
                  onChange={(e) => setCustomEmailSubject(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Email Body</label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(customEmailBody, 'email')}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {copied === 'email' ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied === 'email' ? 'Copied Body!' : 'Copy Body'}</span>
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={customEmailBody}
                  onChange={(e) => setCustomEmailBody(e.target.value)}
                  className="w-full text-xs p-3 font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF to Attach</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenEmail}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition"
                >
                  <Mail className="w-4 h-4" />
                  <span>Open in Mail Client</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </button>
              </div>
            </div>
          )}

          {/* 3. DEVICE SHARE TAB */}
          {activeTab === 'device' && (
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto border border-purple-200 shadow-xs">
                <Share2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">Native System Share</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Instantly dispatch this high-resolution document PDF and summary directly into WhatsApp contacts, Gmail, AirDrop, Slack, or Google Drive via your device's native sharing sheet.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDeviceShare}
                  disabled={isSharingDevice}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 mx-auto transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{isSharingDevice ? 'Preparing Document...' : 'Open Device Share Sheet'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. DOWNLOAD & PRINT TAB */}
          {activeTab === 'download' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <div>
                  <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 w-fit mb-3">
                    <Download className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">High-Resolution PDF</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    GST-compliant, multi-page vector PDF with QR Code and double-entry reconciliation stamps.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloading ? 'Generating...' : `Save ${baseShareInfo.downloadFilename}`}</span>
                </button>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <div>
                  <div className="p-2.5 rounded-xl bg-slate-200 text-slate-700 w-fit mb-3">
                    <Printer className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Direct Print Preview</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Send directly to connected office thermal or laser printers on standard A4 paper.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document</span>
                </button>
              </div>
            </div>
          )}

          {/* UPI Direct Link Card (If invoice) */}
          {baseShareInfo.upiPaymentLink && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-blue-900">
                <QrCode className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-semibold">UPI Payment VPA:</span>
                <span className="font-mono text-blue-700">zerodemo@hdfcbank</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(baseShareInfo.upiPaymentLink!, 'upi')}
                className="px-2.5 py-1 bg-white border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-50 font-bold text-[11px] shrink-0 transition"
              >
                {copied === 'upi' ? 'Copied UPI!' : 'Copy UPI Link'}
              </button>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted vector PDF with auto-calculated GST and QR</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
