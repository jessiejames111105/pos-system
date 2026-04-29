import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Calendar,
  Download,
  Search,
  X,
  Loader2
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadStructuredPdf, pdfFormats } from '../lib/exportPdf';

const StatCard = ({ title, value, change, icon: Icon, trend, subtitle, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    className={`bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-primary-100/20 transition-all duration-500 ${
      onClick ? 'cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary-500/10' : ''
    }`}
  >
    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
      <Icon size={80} className="text-primary-600" />
    </div>
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-6">
        <div className="p-4 rounded-2xl bg-primary-50 text-primary-600">
          <Icon size={28} />
        </div>
        {change ? (
          <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full ${
            trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {change}
          </div>
        ) : (
          <div />
        )}
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{title}</p>
      <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mt-2 tracking-tight">{value}</h3>
      {subtitle ? (
        <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-slate-500 line-clamp-2">{subtitle}</p>
      ) : null}
    </div>
  </motion.div>
);

const Dashboard = () => {
  const { user, dailySales, salesReport, sales, ingredients, categories, products, activityLogs, getBusinessDayStart } = useApp();
  const [reportType, setReportType] = useState('Daily'); // Daily, Weekly, Monthly
  const [topCategoryFilter, setTopCategoryFilter] = useState('all');
  const isAdmin = user?.role === 'admin';
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportPeriod, setExportPeriod] = useState('Daily');
  const [includeSales, setIncludeSales] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  React.useEffect(() => {
    if (!exportModalOpen) return;
    setExportPeriod(isAdmin ? reportType : 'Daily');
    setIncludeSales(true);
  }, [exportModalOpen, isAdmin, reportType]);

  const revenueTimeline = useMemo(() => {
    if (!isAdmin) return [];
    const days = reportType === 'Monthly' ? 90 : reportType === 'Weekly' ? 42 : 14;
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    const fmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: '2-digit' });
    const points = [];
    if (topCategoryFilter === 'all') {
      const byDate = new Map((salesReport || []).map(r => [String(r.sale_date), Number(r.total_revenue || 0)]));
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        points.push({ date: key, label: fmt.format(d), value: Number(byDate.get(key) || 0) });
      }
      return points;
    }

    const wantedCategoryId = Number(topCategoryFilter);
    const byDate = new Map();
    for (const s of sales || []) {
      const dt = s.created_at ? new Date(s.created_at) : null;
      if (!dt || Number.isNaN(dt.getTime())) continue;
      dt.setHours(0, 0, 0, 0);
      if (dt < start || dt > end) continue;
      const key = dt.toISOString().slice(0, 10);
      for (const item of s.items || []) {
        if (Number(item.category_id || 0) !== wantedCategoryId) continue;
        byDate.set(key, Number(byDate.get(key) || 0) + Number(item.subtotal || 0));
      }
    }
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      points.push({ date: key, label: fmt.format(d), value: Number(byDate.get(key) || 0) });
    }
    return points;
  }, [isAdmin, reportType, salesReport, sales, topCategoryFilter]);

  const revenueChart = useMemo(() => {
    const series = revenueTimeline || [];
    if (series.length === 0) return null;
    const w = 720;
    const h = 240;
    const padX = 18;
    const padY = 18;
    const max = Math.max(1, ...series.map(p => Number(p.value || 0)));
    const xFor = (i) => padX + (series.length === 1 ? 0 : (i * (w - padX * 2)) / (series.length - 1));
    const yFor = (v) => padY + (h - padY * 2) * (1 - Math.min(1, Math.max(0, Number(v || 0) / max)));
    const poly = series.map((p, i) => `${xFor(i)},${yFor(p.value)}`).join(' ');
    const ticks = [0.25, 0.5, 0.75, 1].map(r => ({ y: yFor(max * r), value: max * r }));
    return { w, h, poly, xFor, yFor, max, ticks };
  }, [revenueTimeline]);

  const rangeDays = reportType === 'Monthly' ? 30 : reportType === 'Daily' ? 1 : 7;
  const reportRows = (salesReport || []).slice(0, rangeDays);
  const prevRows = (salesReport || []).slice(rangeDays, rangeDays * 2);
  const periodRevenue = reportRows.reduce((sum, r) => sum + Number(r.total_revenue || 0), 0);
  const prevRevenue = prevRows.reduce((sum, r) => sum + Number(r.total_revenue || 0), 0);
  const periodOrders = reportRows.reduce((sum, r) => sum + Number(r.total_transactions || 0), 0);
  const prevOrders = prevRows.reduce((sum, r) => sum + Number(r.total_transactions || 0), 0);
  const pctChange = (cur, prev) => {
    if (!Number.isFinite(prev) || prev <= 0) return null;
    const pct = ((cur - prev) / prev) * 100;
    if (!Number.isFinite(pct)) return null;
    return pct;
  };
  const formatPct = (pct) => {
    const sign = pct > 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}%`;
  };

  const businessDayStart = useMemo(() => {
    if (getBusinessDayStart) return getBusinessDayStart();
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, [getBusinessDayStart]);

  const todayOrders = (sales || []).filter(s => new Date(s.created_at || 0) >= businessDayStart).length;
  const avgTransaction = todayOrders > 0 ? Number(dailySales || 0) / todayOrders : 0;
  const lowStockIngredients = (ingredients || []).filter(i => Number(i.min_stock || 0) > 0 && Number(i.quantity || 0) <= Number(i.min_stock || 0));
  const lowStockRows = useMemo(() => {
    return (ingredients || [])
      .filter(i => Number(i.quantity || 0) <= 0 || (Number(i.min_stock || 0) > 0 && Number(i.quantity || 0) <= Number(i.min_stock || 0)))
      .slice()
      .sort((a, b) => {
        const aMin = Number(a.min_stock || 0);
        const bMin = Number(b.min_stock || 0);
        const aPct = aMin > 0 ? Number(a.quantity || 0) / aMin : -1;
        const bPct = bMin > 0 ? Number(b.quantity || 0) / bMin : -1;
        return aPct - bPct;
      });
  }, [ingredients]);
  const lowStockSubtitle = useMemo(() => {
    if (lowStockIngredients.length === 0) return 'None';
    const names = lowStockIngredients.map(i => i.name).filter(Boolean);
    const shown = names.slice(0, 3);
    const rest = names.length - shown.length;
    return rest > 0 ? `${shown.join(', ')} +${rest}` : shown.join(', ');
  }, [lowStockIngredients]);

  const startDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - (rangeDays - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  }, [rangeDays]);

  const categoryStats = useMemo(() => {
    if (!isAdmin) return null;
    if (topCategoryFilter === 'all') return null;
    const wantedCategoryId = Number(topCategoryFilter);
    if (!Number.isFinite(wantedCategoryId)) return null;

    const currentStart = new Date(startDate);
    const currentEnd = new Date();
    currentEnd.setHours(23, 59, 59, 999);

    const prevEnd = new Date(currentStart);
    prevEnd.setMilliseconds(-1);
    const prevStart = new Date(currentStart);
    prevStart.setDate(prevStart.getDate() - rangeDays);

    const sumRange = (from, to) => {
      let revenue = 0;
      let orders = 0;
      for (const s of sales || []) {
        const dt = s.created_at ? new Date(s.created_at) : null;
        if (!dt || Number.isNaN(dt.getTime())) continue;
        if (dt < from || dt > to) continue;
        let saleSubtotal = 0;
        for (const item of s.items || []) {
          if (Number(item.category_id || 0) !== wantedCategoryId) continue;
          saleSubtotal += Number(item.subtotal || 0);
        }
        if (saleSubtotal > 0) {
          revenue += saleSubtotal;
          orders += 1;
        }
      }
      return { revenue, orders };
    };

    const cur = sumRange(currentStart, currentEnd);
    const prev = sumRange(prevStart, prevEnd);
    return { ...cur, prevRevenue: prev.revenue, prevOrders: prev.orders };
  }, [isAdmin, topCategoryFilter, sales, startDate, rangeDays]);

  const displayedRevenue = categoryStats ? categoryStats.revenue : periodRevenue;
  const displayedPrevRevenue = categoryStats ? categoryStats.prevRevenue : prevRevenue;
  const displayedOrders = categoryStats ? categoryStats.orders : periodOrders;
  const displayedPrevOrders = categoryStats ? categoryStats.prevOrders : prevOrders;
  const revenueChange = pctChange(displayedRevenue, displayedPrevRevenue);
  const ordersChange = pctChange(displayedOrders, displayedPrevOrders);
  const periodAvgTransaction = displayedOrders > 0 ? displayedRevenue / displayedOrders : 0;

  const productMetaByName = useMemo(() => {
    const map = new Map();
    for (const p of products || []) {
      if (!p?.name) continue;
      map.set(p.name, { category_id: p.category_id ?? null, categoryName: p.categoryName ?? null });
    }
    return map;
  }, [products]);

  const topProductsRaw = useMemo(() => {
    const map = new Map();
    for (const s of sales || []) {
      const dt = new Date(s.created_at);
      if (Number.isNaN(dt.getTime()) || dt < startDate) continue;
      for (const item of s.items || []) {
        const key = item.name || 'Unknown';
        map.set(key, (map.get(key) || 0) + Number(item.quantity || 0));
      }
    }
    return Array.from(map.entries())
      .map(([name, qty]) => ({
        name,
        qty,
        category_id: productMetaByName.get(name)?.category_id ?? null,
        categoryName: productMetaByName.get(name)?.categoryName ?? null
      }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 20);
  }, [sales, startDate, productMetaByName]);

  const topProducts = useMemo(() => {
    if (topCategoryFilter === 'all') return topProductsRaw.slice(0, 5);
    const catId = Number(topCategoryFilter);
    return topProductsRaw.filter(p => Number(p.category_id) === catId).slice(0, 5);
  }, [topProductsRaw, topCategoryFilter]);

  const getRangeForPeriod = (period) => {
    const days = period === 'Monthly' ? 30 : period === 'Weekly' ? 7 : 1;
    const end = new Date();
    const start = new Date(end);
    if (days === 1 && getBusinessDayStart) {
      return { start: getBusinessDayStart(), end };
    }
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);
    return { start, end };
  };

  const buildSalesRowsForPeriod = (period) => {
    const { start, end } = getRangeForPeriod(period);
    const wantedCategoryId = topCategoryFilter === 'all' ? null : Number(topCategoryFilter);
    const rows = [];
    for (const s of sales || []) {
      const dt = s?.created_at ? new Date(s.created_at) : null;
      if (!dt || Number.isNaN(dt.getTime())) continue;
      if (dt < start || dt > end) continue;

      let categoryMatch = true;
      if (wantedCategoryId != null && Number.isFinite(wantedCategoryId)) {
        categoryMatch = false;
        for (const item of s.items || []) {
          if (Number(item.category_id || 0) === wantedCategoryId) {
            categoryMatch = true;
            break;
          }
        }
      }
      if (!categoryMatch) continue;

      rows.push(s);
    }
    rows.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    return rows;
  };

  const buildPeriodSummary = (period) => {
    const saleRows = buildSalesRowsForPeriod(period);
    const wantedCategoryId = topCategoryFilter === 'all' ? null : Number(topCategoryFilter);
    const total = saleRows.reduce((sum, s) => {
      if (wantedCategoryId == null || !Number.isFinite(wantedCategoryId)) return sum + Number(s.total_amount || s.total || 0);
      let subtotal = 0;
      for (const item of s.items || []) {
        if (Number(item.category_id || 0) !== wantedCategoryId) continue;
        subtotal += Number(item.subtotal || 0);
      }
      return sum + subtotal;
    }, 0);
    const orders = saleRows.length;
    const avg = orders > 0 ? total / orders : 0;
    return { total, orders, avg, saleRows };
  };

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

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const period = isAdmin ? exportPeriod : 'Daily';
      const { start, end } = getRangeForPeriod(period);
      const summary = buildPeriodSummary(period);

      const sections = [{
        title: 'Summary',
        columns: ['Total Sales', 'Total Transactions', 'Avg Transaction'],
        rows: [[
          pdfFormats.formatPeso(summary.total || 0),
          Number(summary.orders || 0).toLocaleString(),
          pdfFormats.formatPeso(summary.avg || 0)
        ]]
      }];

      if (includeSales) {
        sections.push({
          title: 'Sales',
          columns: ['Date/Time', 'Sale ID', 'Cashier', 'Payment', 'Items', 'Total'],
          columnStyles: { 5: { halign: 'right' } },
          rows: (summary.saleRows || []).map(s => ([
            s.created_at ? new Date(s.created_at).toLocaleString() : '',
            String(s.id ?? ''),
            String(s.cashier || ''),
            String(s.payment_method || s.paymentMethod || ''),
            formatSaleItems(s),
            pdfFormats.formatPeso(s.total_amount ?? s.total ?? 0)
          ]))
        });
      }

      downloadStructuredPdf({
        filename: `ZwitBlakTea-dashboard_${String(period).toLowerCase()}_${new Date().toISOString().slice(0, 10)}`,
        title: 'Dashboard Report',
        subtitle: 'ZwitBlakTea',
        meta: [
          `Period: ${period}`,
          `Period Start: ${start.toISOString().slice(0, 10)}`,
          `Period End: ${end.toISOString().slice(0, 10)}`,
          `Generated: ${new Date().toLocaleString()}`
        ],
        sections
      });
      setExportModalOpen(false);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary-600 font-bold uppercase tracking-wide text-xs mb-2">
            <TrendingUp size={14} />
            Analytics Overview
          </div>
          <h1 className="text-3xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            {isAdmin ? 'Store Performance' : 'My Daily Summary'}
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            {isAdmin ? (
              <>Real-time insights for  <span className="text-slate-900 font-bold">ZwitBlakTea</span></>
            ) : (
              <>Real-time insights for  <span className="text-slate-900 font-bold">shift</span></>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
              <Calendar size={16} className="text-slate-400" />
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="select-system select-filter"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
          )}
          <button onClick={() => setExportModalOpen(true)} className="p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 font-bold uppercase tracking-wide text-[10px]">
            <Download size={18} />
            Export PDF
          </button>
        </div>
      </div>

      <AnimatePresence>
        {exportModalOpen ? (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExportModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">Export PDF</h3>
                <button
                  type="button"
                  onClick={() => setExportModalOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-5">
                {isAdmin ? (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Select period</div>
                    <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
                      <Calendar size={16} className="text-slate-400" />
                      <select
                        value={exportPeriod}
                        onChange={(e) => setExportPeriod(e.target.value)}
                        className="select-system select-filter"
                      >
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={includeSales}
                    onChange={(e) => setIncludeSales(Boolean(e.target.checked))}
                  />
                  <div className="text-sm font-semibold text-slate-700">Include sales list</div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isExporting}
                    onClick={() => setExportModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isExporting}
                    onClick={handleExport}
                    className="flex-1 px-4 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all disabled:bg-slate-200 disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {isExporting ? <Loader2 size={16} className="animate-spin" /> : null}
                    {isExporting ? 'Exporting...' : 'Export'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={isAdmin ? `Total Sales (${reportType})` : "Total Sales Today"}
          value={`₱${Number(isAdmin ? displayedRevenue : dailySales || 0).toLocaleString()}`} 
          change={isAdmin && revenueChange !== null ? formatPct(revenueChange) : null}
          trend={revenueChange !== null && revenueChange >= 0 ? 'up' : 'down'}
          icon={DollarSign} 
        />
        <StatCard
          title={isAdmin ? `Total Transactions (${reportType})` : "Total Transactions"}
          value={Number(isAdmin ? displayedOrders : todayOrders).toLocaleString()}
          change={isAdmin && ordersChange !== null ? formatPct(ordersChange) : null}
          trend={ordersChange !== null && ordersChange >= 0 ? 'up' : 'down'}
          icon={ShoppingBag}
        />
        <StatCard
          title="Low-stock Alerts"
          value={lowStockIngredients.length.toLocaleString()}
          subtitle={lowStockSubtitle}
          change={null}
          trend="down"
          icon={AlertTriangle}
        />
        <StatCard title="Avg Transaction" value={`₱${Number(isAdmin ? periodAvgTransaction : avgTransaction).toFixed(2)}`} change={null} trend="up" icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart Mockup */}
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-100 shadow-sm p-10 flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">
                {isAdmin ? 'Revenue Growth' : 'Sales Trends Today'}
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">
                {isAdmin ? 'Comparison by period' : 'Hourly breakdown'}
              </p>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-slate-400" />
                  <select
                    value={topCategoryFilter}
                    onChange={(e) => setTopCategoryFilter(e.target.value)}
                    className="select-system select-filter"
                  >
                    <option value="all">All Categories</option>
                    {(categories || []).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-h-[300px]">
            {isAdmin && revenueChart ? (
              <div className="w-full">
                <div className="relative w-full">
                  <svg viewBox={`0 0 ${revenueChart.w} ${revenueChart.h}`} className="w-full h-[260px]">
                    {revenueChart.ticks.map((t) => (
                      <g key={t.y}>
                        <line x1="0" y1={t.y} x2={revenueChart.w} y2={t.y} stroke="#e2e8f0" strokeWidth="1" />
                      </g>
                    ))}
                    <polyline
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="3"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      points={revenueChart.poly}
                    />
                    {(revenueTimeline || []).map((p, i) => (
                      <g key={p.date}>
                        <circle cx={revenueChart.xFor(i)} cy={revenueChart.yFor(p.value)} r="5" fill="#4f46e5" />
                        <circle cx={revenueChart.xFor(i)} cy={revenueChart.yFor(p.value)} r="9" fill="#4f46e5" opacity="0.12" />
                        <title>{`${p.date} • ₱${Number(p.value || 0).toLocaleString()}`}</title>
                      </g>
                    ))}
                  </svg>
                </div>
                <div className="flex justify-between gap-2 px-1">
                  {(revenueTimeline || []).map((p, i) => {
                    const step = revenueTimeline.length > 14 ? 7 : 2;
                    if (i % step !== 0 && i !== revenueTimeline.length - 1) return null;
                    return (
                      <span key={p.date} className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        {p.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-[260px] flex items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                No sales data yet.
              </div>
            )}
          </div>
        </div>

        {/* Best Selling Products */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">
              {isAdmin ? 'Top Sellers' : 'Popular Items'}
            </h2>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-400" />
              <select
                value={topCategoryFilter}
                onChange={(e) => setTopCategoryFilter(e.target.value)}
                className="select-system select-filter"
              >
                <option value="all">All</option>
                {(categories || []).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-8">
            {topProducts.map((p) => (
              <div key={p.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">{p.name}</span>
                  <span className="text-xs font-bold text-slate-900">{p.qty} sold</span>
                </div>
                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (p.qty / Math.max(1, topProducts[0]?.qty || 1)) * 100)}%` }}
                    className="h-full bg-primary-600 rounded-full"
                  />
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
                No sales yet for this period.
              </div>
            )}
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="space-y-8">
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">Low-stock Alerts</h2>
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                {(lowStockRows || []).length.toLocaleString()} items
              </span>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {(lowStockRows || []).length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
                  No low-stock items.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                      <th className="px-4 py-3">Ingredient</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Remaining</th>
                      <th className="px-4 py-3 text-right">Min</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(lowStockRows || []).slice(0, 80).map((ing) => {
                      const qty = Number(ing.quantity || 0);
                      const min = Number(ing.min_stock || 0);
                      const isOut = qty <= 0;
                      return (
                        <tr key={ing.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <div className="text-sm font-bold text-slate-900">{ing.name}</div>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-1">{ing.unit}</div>
                          </td>
                          <td className="px-4 py-3">
                            {isOut ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-rose-50 text-rose-700 border border-rose-100">
                                No Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-100">
                                Low Stock
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-700">
                            {qty.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-700">
                            {min.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">Activity Logs</h2>
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                {(activityLogs || []).length.toLocaleString()} logs
              </span>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {(activityLogs || []).length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
                  No activity logs yet.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                      <th className="px-4 py-3">Date / Time</th>
                      <th className="px-4 py-3">Account</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(activityLogs || []).slice(0, 80).map((l) => {
                      const dt = l.created_at ? new Date(l.created_at) : null;
                      const dateText = dt && !Number.isNaN(dt.getTime()) ? dt.toLocaleString() : String(l.created_at || '—');
                      const who = l.actor_name || l.actor_account_id || '—';
                      const acctId = l.actor_account_id && l.actor_name ? String(l.actor_account_id) : null;
                      return (
                        <tr key={l.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-sm font-bold text-slate-700">{dateText}</td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-bold text-slate-900">{who}</div>
                            {acctId ? (
                              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-1">{acctId}</div>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-800">{String(l.action || '')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
