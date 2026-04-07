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

const StatCard = ({ title, value, change, icon: Icon, trend }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-primary-100/20 transition-all duration-500"
  >
    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
      <Icon size={80} className="text-primary-600" />
    </div>
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-6">
        <div className="p-4 rounded-2xl bg-primary-50 text-primary-600">
          <Icon size={28} />
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full ${
          trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        }`}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </div>
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{title}</p>
      <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mt-2 tracking-tight">{value}</h3>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const { user, dailySales, salesReport, sales, ingredients } = useApp();
  const [reportType, setReportType] = useState('Weekly'); // Daily, Weekly, Monthly
  const isAdmin = user?.role === 'admin';

  const rangeDays = reportType === 'Monthly' ? 30 : reportType === 'Daily' ? 1 : 7;
  const reportRows = (salesReport || []).slice(0, rangeDays);
  const adminRevenue = reportRows.reduce((sum, r) => sum + Number(r.total_revenue || 0), 0);
  const adminOrders = reportRows.reduce((sum, r) => sum + Number(r.total_transactions || 0), 0);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = (sales || []).filter(s => String(s.created_at || '').slice(0, 10) === todayStr).length;
  const avgTransaction = todayOrders > 0 ? Number(dailySales || 0) / todayOrders : 0;
  const lowStockIngredients = (ingredients || []).filter(i => Number(i.min_stock || 0) > 0 && Number(i.quantity || 0) <= Number(i.min_stock || 0));

  const startDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - (rangeDays - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  }, [rangeDays]);

  const topProducts = useMemo(() => {
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
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [sales, startDate]);

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary-600 font-bold uppercase tracking-wide text-xs mb-2">
            <TrendingUp size={14} />
            Analytics Overview
          </div>
          <h1 className="text-3xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            {isAdmin ? 'Branch Performance' : 'My Daily Summary'}
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            Real-time sales insights for <span className="text-slate-900 font-bold">Main Branch (Quezon City)</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
              {['Daily', 'Weekly', 'Monthly'].map(type => (
                <button
                  key={type}
                  onClick={() => setReportType(type)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
                    reportType === type 
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' 
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
          <button className="p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 font-bold uppercase tracking-wide text-[10px]">
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Sales Today"
          value={`₱${Number(dailySales || 0).toLocaleString()}`} 
          change="+12.5%" 
          trend="up" 
          icon={DollarSign} 
        />
        <StatCard title="Total Transactions" value={todayOrders.toLocaleString()} change="+8.2%" trend="up" icon={ShoppingBag} />
        <StatCard title="Low-stock Alerts" value={lowStockIngredients.length.toLocaleString()} change="-2.4%" trend="down" icon={AlertTriangle} />
        <StatCard title="Avg Transaction" value={`₱${avgTransaction.toFixed(2)}`} change="+4.1%" trend="up" icon={Clock} />
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
            <button className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-primary-600 transition-colors">
              <Filter size={18} />
            </button>
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
    </div>
  );
};

export default Dashboard;
