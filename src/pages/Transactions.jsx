import React, { useEffect, useMemo, useState } from 'react';
import { 
  Search, 
  Download, 
  Calendar, 
  Receipt, 
  User, 
  Filter,
  CreditCard,
  Banknote,
  MoreVertical
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

const Transactions = () => {
  const { sales, user, globalSearchTerm, setGlobalSearchTerm } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all'); // all | Cash | GCash
  const [cashierFilter, setCashierFilter] = useState('all');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    setSearchTerm(globalSearchTerm || '');
  }, [globalSearchTerm]);

  const transactions = useMemo(() => {
    return (sales || []).map(s => ({
      id: s.id,
      cashier: s.cashier,
      date: s.created_at,
      total: Number(s.total_amount || 0),
      paymentMethod: s.payment_method,
      items: (s.items || []).map(i => ({
        name: i.name,
        quantity: i.quantity,
        price: Number(i.price || 0),
        details: i.size_name ? `Size: ${i.size_name}` : '',
        addons: (i.addons || []).map(a => ({
          name: a.name,
          quantity: Number(a.quantity || 0),
          price: Number(a.unit_price || 0),
          subtotal: Number(a.subtotal || 0)
        }))
      }))
    }));
  }, [sales]);

  const filteredTransactions = useMemo(() => {
    const q = String(searchTerm || '').toLowerCase();
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const to = toDate ? new Date(`${toDate}T23:59:59`) : null;

    return (transactions || []).filter(trx => {
      if (paymentFilter !== 'all' && trx.paymentMethod !== paymentFilter) return false;
      if (isAdmin && cashierFilter !== 'all' && String(trx.cashier || '') !== cashierFilter) return false;

      const dt = trx.date ? new Date(trx.date) : null;
      if (from && dt && dt < from) return false;
      if (to && dt && dt > to) return false;

      if (!q) return true;
      if (String(trx.id || '').toLowerCase().includes(q)) return true;
      if (String(trx.cashier || '').toLowerCase().includes(q)) return true;
      if (String(trx.paymentMethod || '').toLowerCase().includes(q)) return true;
      return (trx.items || []).some(i => String(i.name || '').toLowerCase().includes(q));
    });
  }, [transactions, searchTerm, fromDate, toDate, paymentFilter, cashierFilter, isAdmin]);

  const cashierOptions = useMemo(() => {
    const set = new Set();
    for (const t of transactions || []) {
      if (t.cashier) set.add(t.cashier);
    }
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
  }, [transactions]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExport = () => {
    alert('Generating PDF Report... (Mock Action)');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>
          <p className="text-slate-500 text-sm">View and manage all sales records.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={handleExport}
            className="btn bg-white border border-slate-200 text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={18} />
            Export Report
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by Order ID or Cashier..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setGlobalSearchTerm(e.target.value);
            }}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Calendar size={18} className="text-slate-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent font-bold text-slate-700 text-xs outline-none"
            />
            <span className="text-slate-300 font-bold">—</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent font-bold text-slate-700 text-xs outline-none"
            />
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
            <Filter size={18} className="text-slate-400" />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-white font-bold text-slate-900 text-xs uppercase tracking-wide outline-none"
            >
              <option value="all">All Payments</option>
              <option value="Cash">Cash</option>
              <option value="GCash">GCash</option>
            </select>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
              <User size={18} className="text-slate-400" />
              <select
                value={cashierFilter}
                onChange={(e) => setCashierFilter(e.target.value)}
                className="bg-white font-bold text-slate-900 text-xs uppercase tracking-wide outline-none"
              >
                <option value="all">All Cashiers</option>
                {cashierOptions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Transaction List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredTransactions.map((trx) => (
            <motion.div
              layout
              key={trx.id}
              onClick={() => setSelectedTrx(trx)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer group ${
                selectedTrx?.id === trx.id 
                ? 'bg-primary-50 border-primary-200 ring-1 ring-primary-100' 
                : 'bg-white border-slate-200 hover:border-primary-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    selectedTrx?.id === trx.id ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Receipt size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-slate-900">{trx.id}</h4>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md font-bold uppercase tracking-tight">
                        {trx.cashier}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{formatDate(trx.date)}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-medium">
                        {(trx.items || []).length} {(trx.items || []).length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 tracking-tight text-lg">₱{trx.total.toLocaleString()}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {trx.paymentMethod === 'Cash' ? <Banknote size={10} /> : <CreditCard size={10} />}
                    {trx.paymentMethod}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Transaction Detail View */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedTrx ? (
              <motion.div
                key={selectedTrx.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden sticky top-6"
              >
                <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-full tracking-wide">
                      Completed
                    </span>
                    <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">{selectedTrx.id}</h3>
                  <p className="text-sm text-slate-500">{formatDate(selectedTrx.date)}</p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <User size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Cashier</span>
                      </div>
                      <p className="font-bold text-slate-900 text-sm truncate">{selectedTrx.cashier}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <CreditCard size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Payment</span>
                      </div>
                      <p className="font-bold text-slate-900 text-sm">{selectedTrx.paymentMethod}</p>
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-3">Order Details</h4>
                    <div className="space-y-4">
                      {selectedTrx.items.map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 flex items-center justify-center bg-slate-100 text-slate-600 text-xs font-bold rounded-lg">
                                {item.quantity}
                              </span>
                              <div>
                                <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{item.details}</p>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-slate-900">₱{(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                          {item.addons && item.addons.length > 0 && (
                            <div className="pl-9 space-y-1">
                              {item.addons.map((addon, ai) => (
                                <div key={ai} className="flex justify-between items-center text-[10px]">
                                  <span className="text-primary-600 font-medium">+ {addon.name}</span>
                                  <span className="text-slate-400">₱{addon.price.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="pt-6 border-t border-dashed border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-500">Subtotal</span>
                      <span className="text-sm font-bold text-slate-900">₱{selectedTrx.total.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-slate-500">Tax (0%)</span>
                      <span className="text-sm font-bold text-slate-900">₱0.00</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-slate-900">Total</span>
                      <span className="text-2xl font-bold text-primary-600 tracking-tight">
                        ₱{selectedTrx.total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                    <Receipt size={20} />
                    Print Receipt
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-300 mb-4">
                  <Receipt size={48} />
                </div>
                <h4 className="text-lg font-bold text-slate-900">No Transaction Selected</h4>
                <p className="text-sm text-slate-400 mt-2">Select a transaction from the list to view its details.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
