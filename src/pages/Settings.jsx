import React, { useEffect, useMemo, useState } from 'react';
import { Clock, Save } from 'lucide-react';
import { useApp } from '../store/AppContext';

const dayOptions = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' }
];

export default function Settings() {
  const { storeSettings, updateStoreSettings } = useApp();
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('21:00');
  const [daysOpen, setDaysOpen] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [dayOverrides, setDayOverrides] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!storeSettings) return;
    setOpenTime(storeSettings.open_time || '09:00');
    setCloseTime(storeSettings.close_time || '21:00');
    setDaysOpen(Array.isArray(storeSettings.days_open) && storeSettings.days_open.length > 0 ? storeSettings.days_open : [0, 1, 2, 3, 4, 5, 6]);
    setDayOverrides(storeSettings.day_overrides && typeof storeSettings.day_overrides === 'object' ? storeSettings.day_overrides : {});
  }, [storeSettings]);

  const normalizedDays = useMemo(() => {
    const set = new Set((daysOpen || []).map(n => Number(n)).filter(n => Number.isFinite(n)));
    return Array.from(set).sort((a, b) => a - b);
  }, [daysOpen]);

  const normalizedOverrides = useMemo(() => {
    const out = {};
    for (const [k, v] of Object.entries(dayOverrides || {})) {
      const day = Number(k);
      if (!Number.isFinite(day)) continue;
      const open_time = v?.open_time ? String(v.open_time) : openTime;
      const close_time = v?.close_time ? String(v.close_time) : closeTime;
      out[String(day)] = { open_time, close_time };
    }
    return out;
  }, [dayOverrides, openTime, closeTime]);

  const toggleDay = (v) => {
    setDaysOpen(prev => {
      const set = new Set((prev || []).map(n => Number(n)).filter(n => Number.isFinite(n)));
      if (set.has(v)) set.delete(v);
      else set.add(v);
      return Array.from(set);
    });
    setDayOverrides(prev => {
      const next = { ...(prev || {}) };
      if (!normalizedDays.includes(v)) return next;
      delete next[String(v)];
      return next;
    });
  };

  const toggleCustom = (day) => {
    setDayOverrides(prev => {
      const next = { ...(prev || {}) };
      const key = String(day);
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = { open_time: openTime, close_time: closeTime };
      }
      return next;
    });
  };

  const setOverrideTime = (day, field, value) => {
    setDayOverrides(prev => {
      const key = String(day);
      const base = prev?.[key] || { open_time: openTime, close_time: closeTime };
      return { ...(prev || {}), [key]: { ...base, [field]: value } };
    });
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    if (!openTime || !closeTime) return;
    if (normalizedDays.length === 0) return;
    setIsSaving(true);
    try {
      const allowed = new Set(normalizedDays.map(n => String(n)));
      const day_overrides = {};
      for (const [k, v] of Object.entries(normalizedOverrides || {})) {
        if (!allowed.has(String(Number(k)))) continue;
        day_overrides[String(Number(k))] = { open_time: v.open_time, close_time: v.close_time };
      }
      await updateStoreSettings({ open_time: openTime, close_time: closeTime, days_open: normalizedDays, day_overrides });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm">Configure store operational hours.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
          <Clock size={18} className="text-slate-500" />
          <div className="text-sm font-bold text-slate-900 uppercase tracking-wide">Operational Hours</div>
        </div>

        <form onSubmit={onSave} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Opening Time</label>
              <input
                required
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Closing Time</label>
              <input
                required
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bold"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-bold text-slate-700">Per-day Schedule</div>
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-slate-50/60 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <div className="col-span-2">Day</div>
                <div className="col-span-2">Open</div>
                <div className="col-span-3">Custom</div>
                <div className="col-span-2">Open Time</div>
                <div className="col-span-3">Close Time</div>
              </div>
              <div className="divide-y divide-slate-100">
                {dayOptions.map(d => {
                  const isOpen = normalizedDays.includes(d.value);
                  const key = String(d.value);
                  const hasCustom = Boolean(normalizedOverrides?.[key]);
                  const currentOpen = hasCustom ? normalizedOverrides[key].open_time : openTime;
                  const currentClose = hasCustom ? normalizedOverrides[key].close_time : closeTime;
                  return (
                    <div key={d.value} className="grid grid-cols-12 gap-3 px-4 py-4 items-center">
                      <div className="col-span-2 font-bold text-slate-900">{d.label}</div>
                      <div className="col-span-2">
                        <button
                          type="button"
                          onClick={() => toggleDay(d.value)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all ${
                            isOpen ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {isOpen ? 'Open' : 'Closed'}
                        </button>
                      </div>
                      <div className="col-span-3">
                        <button
                          type="button"
                          disabled={!isOpen}
                          onClick={() => toggleCustom(d.value)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 ${
                            hasCustom ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {hasCustom ? 'Custom On' : 'Custom Off'}
                        </button>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="time"
                          value={currentOpen}
                          disabled={!isOpen || !hasCustom}
                          onChange={(e) => setOverrideTime(d.value, 'open_time', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bold disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="time"
                          value={currentClose}
                          disabled={!isOpen || !hasCustom}
                          onChange={(e) => setOverrideTime(d.value, 'close_time', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bold disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary flex items-center gap-2 disabled:bg-slate-200 disabled:shadow-none"
            >
              <Save size={18} />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
