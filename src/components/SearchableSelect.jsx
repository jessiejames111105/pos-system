import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const normalize = (v) => String(v ?? '').trim().toLowerCase();

const SearchableSelect = ({ value, options, placeholder, onChange, className }) => {
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const blurTimerRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [dropdownRect, setDropdownRect] = useState(null);

  const selected = useMemo(() => {
    const v = value == null ? '' : String(value);
    return (options || []).find(o => String(o.value) === v) || null;
  }, [options, value]);

  useEffect(() => {
    if (isTyping) return;
    setQuery(selected?.label || '');
  }, [selected?.label, isTyping]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    const list = options || [];
    if (!q) return list.slice(0, 60);
    return list.filter(o => normalize(o.label).includes(q)).slice(0, 60);
  }, [options, query]);

  const grouped = useMemo(() => {
    const byGroup = new Map();
    for (const o of filtered) {
      const g = o.group || '';
      const list = byGroup.get(g) || [];
      list.push(o);
      byGroup.set(g, list);
    }
    return Array.from(byGroup.entries());
  }, [filtered]);

  const closeSoon = () => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    blurTimerRef.current = setTimeout(() => {
      setOpen(false);
      setIsTyping(false);
      setQuery(selected?.label || '');
    }, 120);
  };

  const openNow = () => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const el = inputRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setDropdownRect({
        left: r.left,
        top: r.bottom + 8,
        width: r.width
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  const pick = (o) => {
    if (!o) return;
    setIsTyping(false);
    setQuery(o.label || '');
    setOpen(false);
    onChange?.(o.value);
  };

  return (
    <div ref={rootRef} className={`relative ${className || ''}`}>
      <input
        type="text"
        className="select-system w-full"
        ref={inputRef}
        value={query}
        placeholder={placeholder || 'Search...'}
        onFocus={() => openNow()}
        onBlur={() => closeSoon()}
        onChange={(e) => {
          setIsTyping(true);
          setQuery(e.target.value);
          setOpen(true);
          const next = e.target.value.trim();
          if (!next) onChange?.('');
        }}
      />

      {open && dropdownRect
        ? createPortal(
            <div
              className="fixed z-[200] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
              style={{ left: dropdownRect.left, top: dropdownRect.top, width: dropdownRect.width }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="max-h-72 overflow-auto p-2">
                {grouped.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-slate-500">No matches</div>
                ) : (
                  grouped.map(([group, list]) => (
                    <div key={group || 'default'}>
                      {group ? (
                        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          {group}
                        </div>
                      ) : null}
                      {list.map(o => {
                        const isSelected = selected && String(selected.value) === String(o.value);
                        return (
                          <button
                            key={`${group || 'g'}-${o.value}`}
                            type="button"
                            className={`w-full rounded-xl px-3 py-2 text-left text-sm font-bold transition-all ${
                              isSelected ? 'bg-primary-50 text-primary-700' : 'hover:bg-slate-50 text-slate-900'
                            }`}
                            onClick={() => pick(o)}
                          >
                            {o.label}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
};

export default SearchableSelect;
