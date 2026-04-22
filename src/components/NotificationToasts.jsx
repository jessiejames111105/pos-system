import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../store/AppContext';

const typeStyles = (type) => {
  if (type === 'success') return { dot: 'bg-emerald-500', ring: 'ring-emerald-100', bg: 'bg-emerald-50/80', text: 'text-emerald-900' };
  if (type === 'warning') return { dot: 'bg-amber-500', ring: 'ring-amber-100', bg: 'bg-amber-50/80', text: 'text-amber-900' };
  if (type === 'error') return { dot: 'bg-rose-500', ring: 'ring-rose-100', bg: 'bg-rose-50/80', text: 'text-rose-900' };
  return { dot: 'bg-slate-400', ring: 'ring-slate-200', bg: 'bg-white/80', text: 'text-slate-900' };
};

const NotificationToasts = () => {
  const { notifications, dismissNotificationToast } = useApp();

  const items = useMemo(() => {
    return (notifications || []).filter(n => !n?.toast_dismissed).slice().reverse().slice(0, 4);
  }, [notifications]);

  if (items.length === 0) return null;

  return (
    <div className="fixed right-4 top-20 z-[80] w-[92vw] max-w-sm space-y-3">
      {items.map((n) => {
        const s = typeStyles(n.type);
        return (
          <div
            key={n.id}
            className={`rounded-2xl border border-slate-200 shadow-xl backdrop-blur-md ${s.bg}`}
          >
            <div className="flex items-start gap-3 px-4 py-3">
              <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${s.dot} ring-4 ${s.ring}`} />
              <div className="flex-1">
                <p className={`text-sm font-bold leading-snug ${s.text}`}>{n.message}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{String(n.type || 'info')}</p>
              </div>
              <button
                type="button"
                onClick={() => dismissNotificationToast(n.id)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationToasts;
