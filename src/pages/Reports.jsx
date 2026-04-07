import React, { useMemo, useState } from 'react';
import { Calendar, Download, TrendingUp, AlertTriangle } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { escapeHtml, openPrintPdf } from '../lib/printPdf';

const toDateInputValue = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const Reports = () => {
  const { sales, ingredients } = useApp();
  const today = new Date();
  const [from, setFrom] = useState(toDateInputValue(today));
  const [to, setTo] = useState(toDateInputValue(today));

  const range = useMemo(() => {
    const fromDate = new Date(`${from}T00:00:00`);
    const toDate = new Date(`${to}T23:59:59`);
    return { fromDate, toDate };
  }, [from, to]);

  const filteredSales = useMemo(() => {
    const { fromDate, toDate } = range;
    return (sales || []).filter(s => {
      const dt = new Date(s.created_at);
      if (Number.isNaN(dt.getTime())) return false;
      return dt >= fromDate && dt <= toDate;
    });
  }, [sales, range]);

  const totals = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
    const totalTransactions = filteredSales.length;
    const map = new Map();
    for (const s of filteredSales) {
      for (const item of s.items || []) {
        const key = item.name || 'Unknown';
        map.set(key, (map.get(key) || 0) + Number(item.quantity || 0));
      }
    }
    const topProducts = Array.from(map.entries())
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
    return { totalRevenue, totalTransactions, topProducts };
  }, [filteredSales]);

  const lowStockIngredients = useMemo(() => {
    return (ingredients || []).filter(i => Number(i.min_stock || 0) > 0 && Number(i.quantity || 0) <= Number(i.min_stock || 0));
  }, [ingredients]);

  const exportPdf = () => {
    const title = 'Sales Report';
    const filename = `ZwitBlakTea-report_${from}_to_${to}`;

    const salesRows = filteredSales.map(s => `
      <tr>
        <td>${escapeHtml(s.id)}</td>
        <td>${escapeHtml(new Date(s.created_at).toLocaleString())}</td>
        <td>${escapeHtml(s.cashier || '')}</td>
        <td>${escapeHtml(s.payment_method || '')}</td>
        <td class="right">₱${Number(s.total_amount || 0).toLocaleString()}</td>
      </tr>
    `).join('');

    const topRows = (totals.topProducts || []).map(p => `
      <tr>
        <td>${escapeHtml(p.name)}</td>
        <td class="right">${Number(p.qty || 0).toLocaleString()}</td>
      </tr>
    `).join('');

    const lowRows = (lowStockIngredients || []).map(i => `
      <tr>
        <td>${escapeHtml(i.name)}</td>
        <td class="right">${Number(i.quantity || 0).toLocaleString()}</td>
        <td>${escapeHtml(i.unit || '')}</td>
        <td class="right">${Number(i.min_stock || 0).toLocaleString()}</td>
      </tr>
    `).join('');

    const bodyHtml = `
      <div class="row">
        <div>
          <h1>${escapeHtml(title)}</h1>
          <div class="small muted">ZwitBlakTea</div>
        </div>
        <div class="right">
          <div class="pill">${escapeHtml(from)} → ${escapeHtml(to)}</div>
          <div class="xs muted" style="margin-top:6px;">Generated: ${escapeHtml(new Date().toLocaleString())}</div>
        </div>
      </div>

      <div class="section card">
        <div class="section-title">Summary</div>
        <div class="grid">
          <div class="card">
            <div class="xs muted">Total Revenue</div>
            <div style="font-weight:800; font-size:16px;">₱${Number(totals.totalRevenue || 0).toLocaleString()}</div>
          </div>
          <div class="card">
            <div class="xs muted">Total Transactions</div>
            <div style="font-weight:800; font-size:16px;">${Number(totals.totalTransactions || 0).toLocaleString()}</div>
          </div>
          <div class="card">
            <div class="xs muted">Low-stock Alerts</div>
            <div style="font-weight:800; font-size:16px;">${Number(lowStockIngredients.length).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Sales</div>
        <table>
          <thead>
            <tr>
              <th>Sale ID</th>
              <th>Date</th>
              <th>Cashier</th>
              <th>Payment</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${salesRows || `<tr><td colspan="5" class="muted">No sales found.</td></tr>`}
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Top Products</div>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th class="right">Qty Sold</th>
            </tr>
          </thead>
          <tbody>
            ${topRows || `<tr><td colspan="2" class="muted">No data.</td></tr>`}
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Low-stock Ingredients</div>
        <table>
          <thead>
            <tr>
              <th>Ingredient</th>
              <th class="right">Remaining</th>
              <th>Unit</th>
              <th class="right">Min</th>
            </tr>
          </thead>
          <tbody>
            ${lowRows || `<tr><td colspan="4" class="muted">None</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    openPrintPdf({ title, filename, bodyHtml });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary-600 font-bold uppercase tracking-wide text-xs mb-2">
            <TrendingUp size={14} />
            Reports
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Sales Reports</h1>
          <p className="text-slate-500 font-medium mt-2">Generate reports by date range and export.</p>
        </div>

        <button
          onClick={exportPdf}
          className="p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 font-bold uppercase tracking-wide text-[10px]"
        >
          <Download size={18} />
          Export PDF
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row gap-4 items-start md:items-end">
        <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wide text-[10px]">
          <Calendar size={14} />
          Date Range
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Sales</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">₱{totals.totalRevenue.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Transactions</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">{totals.totalTransactions.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Low-stock Ingredients</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">{lowStockIngredients.length.toLocaleString()}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight mb-6">Top-selling Products</h2>
          <div className="space-y-4">
            {totals.topProducts.map(p => (
              <div key={p.name} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="font-bold text-slate-900">{p.name}</span>
                <span className="text-sm font-bold text-slate-700">{p.qty} sold</span>
              </div>
            ))}
            {totals.topProducts.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                No sales in this date range.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle size={18} className="text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Low-stock Ingredients</h2>
          </div>
          <div className="space-y-4">
            {lowStockIngredients.map(i => (
              <div key={i.id} className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                <span className="font-bold text-slate-900">{i.name}</span>
                <span className="text-sm font-bold text-amber-700">
                  {Number(i.quantity || 0).toLocaleString()} {i.unit}
                </span>
              </div>
            ))}
            {lowStockIngredients.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                No low-stock ingredients.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
