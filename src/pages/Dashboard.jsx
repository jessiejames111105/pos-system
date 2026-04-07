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
  Search
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { motion } from 'framer-motion';
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
  const { user, dailySales, salesReport, sales, ingredients, categories, products } = useApp();
  const [reportType, setReportType] = useState('Weekly'); // Daily, Weekly, Monthly
  const [topCategoryFilter, setTopCategoryFilter] = useState('all');
  const [isLowStockOpen, setIsLowStockOpen] = useState(false);
  const isAdmin = user?.role === 'admin';

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
  const revenueChange = pctChange(periodRevenue, prevRevenue);
  const ordersChange = pctChange(periodOrders, prevOrders);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = (sales || []).filter(s => String(s.created_at || '').slice(0, 10) === todayStr).length;
  const avgTransaction = todayOrders > 0 ? Number(dailySales || 0) / todayOrders : 0;
  const lowStockIngredients = (ingredients || []).filter(i => Number(i.min_stock || 0) > 0 && Number(i.quantity || 0) <= Number(i.min_stock || 0));
  const periodAvgTransaction = periodOrders > 0 ? periodRevenue / periodOrders : 0;
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

  const handleExport = () => {
    const title = 'Dashboard Report';
    const periodLabel = isAdmin ? reportType : 'Daily';

    const revenue = isAdmin ? periodRevenue : Number(dailySales || 0);
    const orders = isAdmin ? periodOrders : todayOrders;
    const avg = orders > 0 ? revenue / orders : 0;
    downloadStructuredPdf({
      filename: `ZwitBlakTea-dashboard_${periodLabel.toLowerCase()}_${new Date().toISOString().slice(0, 10)}`,
      title,
      subtitle: 'ZwitBlakTea',
      meta: [
        `Period: ${periodLabel}`,
        `Period Start: ${startDate.toISOString().slice(0, 10)}`,
        `Period End: ${new Date().toISOString().slice(0, 10)}`,
        `Generated: ${new Date().toLocaleString()}`
      ],
      sections: [
        {
          title: 'Summary',
          columns: ['Total Sales', 'Total Transactions', 'Avg Transaction'],
          rows: [[
            pdfFormats.formatPeso(revenue || 0),
            Number(orders || 0).toLocaleString(),
            pdfFormats.formatPeso(avg || 0)
          ]]
        },
        ...(isAdmin ? [{
          title: 'Sales Report (by day)',
          columns: ['Date', 'Transactions', 'Revenue'],
          columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
          rows: (reportRows || []).map(r => ([
            String(r.sale_date),
            Number(r.total_transactions || 0).toLocaleString(),
            pdfFormats.formatPeso(r.total_revenue || 0)
          ]))
        }] : []),
        {
          title: 'Top Sellers',
          columns: ['Product', 'Category', 'Qty Sold'],
          columnStyles: { 2: { halign: 'right' } },
          rows: (topProductsRaw || []).map(p => ([
            String(p.name),
            String(p.categoryName || ''),
            Number(p.qty || 0).toLocaleString()
          ]))
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
              <>Real-time insights for your <span className="text-slate-900 font-bold">store</span></>
            ) : (
              <>Real-time insights for your <span className="text-slate-900 font-bold">shift</span></>
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
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs uppercase tracking-wide"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
          )}
          <button onClick={handleExport} className="p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 font-bold uppercase tracking-wide text-[10px]">
            <Download size={18} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={isAdmin ? `Total Sales (${reportType})` : "Total Sales Today"}
          value={`₱${Number(isAdmin ? periodRevenue : dailySales || 0).toLocaleString()}`} 
          change={isAdmin && revenueChange !== null ? formatPct(revenueChange) : null}
          trend={revenueChange !== null && revenueChange >= 0 ? 'up' : 'down'}
          icon={DollarSign} 
        />
        <StatCard
          title={isAdmin ? `Total Transactions (${reportType})` : "Total Transactions"}
          value={Number(isAdmin ? periodOrders : todayOrders).toLocaleString()}
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
          onClick={isAdmin ? () => setIsLowStockOpen(true) : undefined}
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
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary-600"></div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-slate-200"></div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Previous</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-1 flex items-end gap-4 min-h-[300px]">
            {(isAdmin ? [65, 45, 75, 55, 90, 70, 85] : [30, 45, 60, 50, 40, 55, 45]).map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                <div className="w-full relative flex items-end justify-center">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    className={`w-full max-w-[40px] ${isAdmin ? 'bg-primary-600/10' : 'bg-emerald-600/10'} rounded-t-2xl group-hover:${isAdmin ? 'bg-primary-600' : 'bg-emerald-600'} transition-all duration-500 relative`}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      ₱{h}K
                    </div>
                  </motion.div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {isAdmin 
                    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]
                    : ['9AM', '11AM', '1PM', '3PM', '5PM', '7PM', '9PM'][i]}
                </span>
              </div>
            ))}
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
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs uppercase tracking-wide"
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

      {isAdmin && isLowStockOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsLowStockOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Low-stock Ingredients</h3>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-1">
                  Ingredients at or below minimum stock
                </p>
              </div>
              <button
                onClick={() => setIsLowStockOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {lowStockIngredients.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-bold">No low-stock ingredients.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                      <th className="px-6 py-4">Ingredient</th>
                      <th className="px-6 py-4">Remaining</th>
                      <th className="px-6 py-4">Min</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lowStockIngredients
                      .slice()
                      .sort((a, b) => {
                        const aPct = Number(a.min_stock || 0) > 0 ? Number(a.quantity || 0) / Number(a.min_stock || 1) : 0;
                        const bPct = Number(b.min_stock || 0) > 0 ? Number(b.quantity || 0) / Number(b.min_stock || 1) : 0;
                        return aPct - bPct;
                      })
                      .map(ing => (
                        <tr key={ing.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{ing.name}</div>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-1">{ing.unit}</div>
                          </td>
                          <td className="px-6 py-4 font-bold text-rose-600">
                            {Number(ing.quantity || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-700">
                            {Number(ing.min_stock || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-white flex justify-end">
              <button
                onClick={() => setIsLowStockOpen(false)}
                className="px-5 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-wide hover:bg-slate-800 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
