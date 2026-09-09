import React, { useState } from 'react';
import {
  Settings,
  Building2,
  ShieldCheck,
  History,
  CheckCircle2,
  Save,
  Database,
  Lock,
} from 'lucide-react';
import { db } from '../../server/db';

interface SettingsViewProps {
  defaultSubTab?: 'profile' | 'audit' | 'inventory';
}

export const SettingsView: React.FC<SettingsViewProps> = ({ defaultSubTab = 'profile' }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'audit' | 'inventory'>(defaultSubTab);

  React.useEffect(() => {
    setActiveTab(defaultSubTab);
  }, [defaultSubTab]);

  const [legalName, setLegalName] = useState(db.organization.legalName || db.organization.name);
  const [gstin, setGstin] = useState(db.organization.gstin || '');
  const [pan, setPan] = useState(db.organization.pan || '');
  const [address, setAddress] = useState(db.organization.address || '');
  const [phone, setPhone] = useState(db.organization.phone || '');
  const [email, setEmail] = useState(db.organization.email || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    db.organization.legalName = legalName;
    db.organization.gstin = gstin.toUpperCase();
    db.organization.pan = pan.toUpperCase();
    db.organization.address = address;
    db.organization.phone = phone;
    db.organization.email = email;
    db.addAuditLog('SETTINGS_UPDATED', 'Organization', db.organization.id, 'Updated company profile and legal GST details');
    db.save();

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Organization Settings & Audit</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            GSTIN configuration, business identity, inventory policies, and immutable audit logs.
          </p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Business Profile & GST</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Trail ({db.auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'inventory'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Architecture & Policies</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Settings saved successfully and logged to audit trail.</span>
        </div>
      )}

      {/* 1. BUSINESS PROFILE */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6 max-w-3xl">
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Legal Business Entity (India)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trade Name</label>
                <input
                  type="text"
                  value={db.organization.name}
                  disabled
                  className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Legal Name</label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">GSTIN (15 Digits)</label>
                <input
                  type="text"
                  maxLength={15}
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono uppercase font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">PAN</label>
                <input
                  type="text"
                  maxLength={10}
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono uppercase"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">State & State Code</label>
                <input
                  type="text"
                  value={`${db.organization.state} (${db.organization.stateCode})`}
                  disabled
                  className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Registered Address</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* 2. AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Immutable System Audit Trail
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Captures every posting, modification & financial transaction
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Entity</th>
                  <th className="p-3.5">Details</th>
                  <th className="p-3.5">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {db.auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800">{log.entityType}</td>
                    <td className="p-3.5 text-slate-600">{log.metadata || '-'}</td>
                    <td className="p-3.5 text-slate-500 font-medium">{log.userName || 'System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. INVENTORY & ARCHITECTURE POLICIES */}
      {activeTab === 'inventory' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Inventory Movement Policies</h3>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">Negative Stock Protection (Overselling Guard)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Products with <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">allowNegativeStock: false</code> cannot be invoiced or dispatched beyond physical on-hand quantity.
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                Enforced
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <span>Full-Stack Database Architecture (Prisma PostgreSQL)</span>
            </h3>
            <p className="text-slate-600">
              ZeroBooks is designed for enterprise scale. The data models defined in{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">
                /prisma/schema.prisma
              </code>{' '}
              map 1-to-1 to all entities: Organizations, Users, Accounts, Journals, Invoices, Payments, and Stock Movements.
            </p>
            <div className="p-3 bg-blue-50 text-blue-900 rounded-lg text-[11px] font-medium">
              Financial Precision: Powered by Decimal.js with banker's rounding to 2 decimal places to eliminate floating point rounding drift.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
