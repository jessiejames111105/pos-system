import React, { useMemo, useState } from 'react';
import { DoorClosed, DoorOpen, Eye, EyeOff, Loader2, Lock, Power, User, X } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { downloadStructuredPdf, pdfFormats } from '../lib/exportPdf';

export default function Settings() {
  const { storeSettings, updateStoreSettings, user, verifyCredentials, sales, refreshDailySales } = useApp();
  const [isSaving, setIsSaving] = useState(false);
  const [reauthOpen, setReauthOpen] = useState(false);
  const [reauthAccountId, setReauthAccountId] = useState('');
  const [reauthPassword, setReauthPassword] = useState('');
  const [reauthError, setReauthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pendingNextOpen, setPendingNextOpen] = useState(true);

  const formatSaleItems = (s) => {
    return (s?.items || []).map(i => {
      const name = String(i?.name || 'Item');
      const qty = Number(i?.quantity || 0);
      const addons = (i?.addons || [])
        .filter(a => Number(a?.quantity || 0) > 0)
        .map(a => `${String(a?.name || 'Add-on')} x${Number(a?.quantity || 0)}`)
        .join(', ');
      const base = `${name} x${qty}`;
      return addons ? `${base} [+ ${addons}]` : base;
    }).join(' | ');
  };

  const isOpen = storeSettings?.is_open !== false;
  const openedAt = useMemo(() => {
    const s = storeSettings?.opened_at ? String(storeSettings.opened_at) : '';
    if (!s) return '';
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString();
  }, [storeSettings?.opened_at]);
  const closedAt = useMemo(() => {
    const s = storeSettings?.closed_at ? String(storeSettings.closed_at) : '';
    if (!s) return '';
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString();
  }, [storeSettings?.closed_at]);

  const requestToggleStore = () => {
    const account = user?.account_id || user?.email || '';
    setPendingNextOpen(!isOpen);
    setReauthAccountId(String(account || ''));
    setReauthPassword('');
    setReauthError('');
    setShowPassword(false);
    setReauthOpen(true);
  };

  const confirmToggleStore = async (e) => {
    e?.preventDefault?.();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const result = await verifyCredentials({ accountId: reauthAccountId, password: reauthPassword });
      if (!result?.ok) {
        setReauthError(result?.message || 'Invalid credentials.');
        return;
      }
      const now = new Date().toISOString();
      if (pendingNextOpen) {
        await updateStoreSettings({ is_open: true, opened_at: now, closed_at: null });
        await refreshDailySales();
      } else {
        const openedIso = storeSettings?.opened_at ? String(storeSettings.opened_at) : null;
        const start = openedIso ? new Date(openedIso) : null;
        const end = new Date(now);
        const startOk = start && !Number.isNaN(start.getTime()) ? start : null;

        const reportStart = startOk || new Date(end);
        if (!startOk) reportStart.setHours(0, 0, 0, 0);

        const reportSales = (sales || [])
          .filter(s => {
            const d = s?.created_at ? new Date(s.created_at) : null;
            if (!d || Number.isNaN(d.getTime())) return false;
            return d >= reportStart && d <= end;
          })
          .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

        const total = reportSales.reduce((sum, s) => sum + Number(s.total_amount ?? s.total ?? 0), 0);
        const txCount = reportSales.length;
        const avg = txCount > 0 ? total / txCount : 0;

        await updateStoreSettings({ is_open: false, closed_at: now });
        await refreshDailySales();

        downloadStructuredPdf({
          filename: `ZwitBlakTea-daily_report_${end.toISOString().slice(0, 10)}`,
          title: 'Daily Report',
          subtitle: 'ZwitBlakTea',
          meta: [
            `Period Start: ${reportStart.toISOString().replace('T', ' ').slice(0, 19)}`,
            `Period End: ${end.toISOString().replace('T', ' ').slice(0, 19)}`,
            `Generated: ${new Date().toLocaleString()}`
          ],
          sections: [
            {
              title: 'Summary',
              columns: ['Total Sales', 'Total Transactions', 'Avg Transaction'],
              rows: [[
                pdfFormats.formatPeso(total || 0),
                Number(txCount || 0).toLocaleString(),
                pdfFormats.formatPeso(avg || 0)
              ]]
            },
            {
              title: 'Sales',
              columns: ['Date/Time', 'Sale ID', 'Cashier', 'Payment', 'Items', 'Total'],
              columnStyles: { 5: { halign: 'right' } },
              rows: reportSales.map(s => ([
                s.created_at ? new Date(s.created_at).toLocaleString() : '',
                String(s.id ?? ''),
                String(s.cashier || ''),
                String(s.payment_method || s.paymentMethod || ''),
                formatSaleItems(s),
                pdfFormats.formatPeso(s.total_amount ?? s.total ?? 0)
              ]))
            }
          ]
        });
      }
      setReauthOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm">Open or close the store for transactions.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
          <Power size={18} className="text-slate-500" />
          <div className="text-sm font-bold text-slate-900 uppercase tracking-wide">Store Status</div>
        </div>

        <div className="p-6 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${isOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {isOpen ? <DoorOpen size={22} /> : <DoorClosed size={22} />}
                </div>
                <div>
                  <div className="text-lg font-black text-slate-900">{isOpen ? 'OPEN' : 'CLOSED'}</div>
                  <div className="text-sm text-slate-500 font-semibold">
                    {isOpen ? (openedAt ? `Opened: ${openedAt}` : 'Opened: —') : (closedAt ? `Closed: ${closedAt}` : 'Closed: —')}
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={isSaving}
                onClick={requestToggleStore}
                className={`px-5 py-3 rounded-2xl font-black uppercase tracking-wide text-xs transition-all shadow-sm flex items-center gap-2 disabled:bg-slate-200 disabled:text-slate-500 ${
                  isOpen
                    ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
                }`}
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                {isOpen ? 'Close Store' : 'Open Store'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {reauthOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            onClick={() => setReauthOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">
                {pendingNextOpen ? 'Open Store' : 'Close Store'} Confirmation
              </h3>
              <button
                type="button"
                onClick={() => setReauthOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={confirmToggleStore} className="p-6 space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 font-semibold">
                This action affects daily reports. Please confirm with your password.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Account ID</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="text"
                    value={reauthAccountId}
                    onChange={(e) => setReauthAccountId(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:border-primary-500 focus:bg-white transition-all tracking-wide"
                    disabled={isSaving}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={reauthPassword}
                    onChange={(e) => {
                      setReauthPassword(e.target.value);
                      if (reauthError) setReauthError('');
                    }}
                    className="block w-full pl-12 pr-12 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:border-primary-500 focus:bg-white transition-all tracking-wide"
                    placeholder="Enter password"
                    disabled={isSaving}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={isSaving}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {reauthError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-semibold">
                  {reauthError}
                </div>
              ) : null}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setReauthOpen(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all disabled:bg-slate-100 disabled:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`flex-1 px-4 py-3 text-white font-bold rounded-xl transition-all disabled:bg-slate-200 disabled:shadow-none flex items-center justify-center gap-2 ${
                    pendingNextOpen ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200' : 'bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200'
                  }`}
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                  {pendingNextOpen ? 'Open Store' : 'Close Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
