import React, { useMemo, useRef, useState } from 'react';
import { Calendar, Download, TrendingUp, AlertTriangle } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { downloadStructuredPdf, pdfFormats } from '../lib/exportPdf';

const toDateInputValue = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const Reports = () => {
  const { sales, ingredients } = useApp();
  const today = new Date();
  const [from, setFrom] = useState(toDateInputValue(today));
  const [to, setTo] = useState(toDateInputValue(today));
  const fromRef = useRef(null);
  const toRef = useRef(null);

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

  const exportPdf = () => {
    downloadStructuredPdf({
      filename: `ZwitBlakTea-report_${from}_to_${to}`,
      title: 'Sales Report',
      subtitle: 'ZwitBlakTea',
      meta: [`Date Range: ${from} to ${to}`, `Generated: ${new Date().toLocaleString()}`],
      sections: [
        {
          title: 'Summary',
          columns: ['Total Revenue', 'Total Transactions', 'Low-stock Alerts'],
          rows: [[
            pdfFormats.formatPeso(totals.totalRevenue || 0),
            Number(totals.totalTransactions || 0).toLocaleString(),
            Number(lowStockIngredients.length).toLocaleString()
          ]]
        },
        {
          title: 'Sales',
          columns: ['Sale ID', 'Date', 'Cashier', 'Payment', 'Items', 'Total'],
          columnStyles: { 5: { halign: 'right' } },
          rows: filteredSales.map(s => ([
            String(s.id),
            new Date(s.created_at).toLocaleString(),
            String(s.cashier || ''),
            String(s.payment_method || ''),
            formatSaleItems(s),
            pdfFormats.formatPeso(s.total_amount || 0)
          ]))
        },
        {
          title: 'Top Products',
          columns: ['Product', 'Qty Sold'],
          columnStyles: { 1: { halign: 'right' } },
          rows: (totals.topProducts || []).map(p => ([String(p.name), Number(p.qty || 0).toLocaleString()]))
        },
        {
          title: 'Low-stock Ingredients',
          columns: ['Ingredient', 'Remaining', 'Unit', 'Min'],
          columnStyles: { 1: { halign: 'right' }, 3: { halign: 'right' } },
          rows: (lowStockIngredients || []).map(i => ([
            String(i.name),
            Number(i.quantity || 0).toLocaleString(),
            String(i.unit || ''),
            Number(i.min_stock || 0).toLocaleString()
          ]))
        }
      ]
    });
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
          <button
            type="button"
            onClick={() => fromRef.current?.showPicker ? fromRef.current.showPicker() : fromRef.current?.focus()}
            className="text-slate-500"
          >
            <Calendar size={14} />
          </button>
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
              ref={fromRef}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">To</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900"
                ref={toRef}
              />
              <button
                type="button"
                onClick={() => toRef.current?.showPicker ? toRef.current.showPicker() : toRef.current?.focus()}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              >
                <Calendar size={14} />
              </button>
            </div>
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
