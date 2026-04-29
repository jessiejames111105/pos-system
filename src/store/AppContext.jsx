import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

const supabaseUrlEnv = import.meta.env.VITE_SUPABASE_URL;
const supabaseKeyEnv =
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const isSupabaseConfigured = Boolean(
  supabaseUrlEnv &&
    supabaseKeyEnv &&
    !String(supabaseUrlEnv).includes('your-project-url.supabase.co') &&
    !['your-anon-key', 'your-anon-key-here'].includes(String(supabaseKeyEnv))
);

export function AppProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('pos_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [accounts, setAccounts] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activityLogs, setActivityLogs] = useState(() => {
    try {
      const raw = localStorage.getItem('activity_logs');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [categories, setCategories] = useState(() => {
    try {
      const raw = localStorage.getItem('pos_categories');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [products, setProducts] = useState(() => {
    try {
      const raw = localStorage.getItem('pos_products');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [ingredients, setIngredients] = useState(() => {
    try {
      const raw = localStorage.getItem('pos_ingredients');
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];

      try {
        const rawMaterials = localStorage.getItem('pos_materials');
        const parsedMaterials = rawMaterials ? JSON.parse(rawMaterials) : [];
        const mats = Array.isArray(parsedMaterials) ? parsedMaterials : [];

        const used = new Set(list.map(i => String(i?.id)));
        let nextId = 1;
        for (const i of list) {
          const n = Number(i?.id);
          if (Number.isFinite(n)) nextId = Math.max(nextId, n + 1);
        }

        const keyOf = (row) => `${String(row?.name || '').trim().toLowerCase()}|${String(row?.unit || '').trim().toLowerCase()}`;
        const existingKeys = new Set(list.map(keyOf));

        for (const m of mats) {
          const name = String(m?.name || '').trim();
          if (!name) continue;
          const unit = String(m?.unit || 'pcs');
          const key = `${name.toLowerCase()}|${String(unit || '').trim().toLowerCase()}`;
          if (existingKeys.has(key)) continue;

          while (used.has(String(nextId))) nextId += 1;
          used.add(String(nextId));
          existingKeys.add(key);
          list.push({
            ...m,
            id: nextId,
            name,
            unit,
            quantity: Number(m?.quantity || 0),
            min_stock: Number(m?.min_stock || 0)
          });
          nextId += 1;
        }
      } catch {}

      return list;
    } catch {
      return [];
    }
  });
  const [ingredientCategories, setIngredientCategories] = useState(() => {
    try {
      const raw = localStorage.getItem('pos_ingredient_categories');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [materials, setMaterials] = useState(() => {
    try {
      const raw = localStorage.getItem('pos_materials');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [materialCategories, setMaterialCategories] = useState(() => {
    try {
      const raw = localStorage.getItem('pos_material_categories');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [addons, setAddons] = useState(() => {
    try {
      const raw = localStorage.getItem('pos_addons');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [addonCategories, setAddonCategories] = useState(() => {
    try {
      const raw = localStorage.getItem('pos_addon_categories');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [storeSettings, setStoreSettings] = useState(() => {
    try {
      const raw = localStorage.getItem('pos_store_settings');
      const parsed = raw ? JSON.parse(raw) : null;
      const open_time = parsed?.open_time ? String(parsed.open_time) : '09:00';
      const close_time = parsed?.close_time ? String(parsed.close_time) : '21:00';
      const days_open = Array.isArray(parsed?.days_open) ? parsed.days_open.map(n => Number(n)).filter(n => Number.isFinite(n)) : [0, 1, 2, 3, 4, 5, 6];
      const day_overrides = parsed?.day_overrides && typeof parsed.day_overrides === 'object' ? parsed.day_overrides : {};
      const is_open = parsed?.is_open === false ? false : true;
      const opened_at = parsed?.opened_at ? String(parsed.opened_at) : null;
      const closed_at = parsed?.closed_at ? String(parsed.closed_at) : null;
      return { open_time, close_time, days_open, day_overrides, is_open, opened_at, closed_at };
    } catch {
      return { open_time: '09:00', close_time: '21:00', days_open: [0, 1, 2, 3, 4, 5, 6], day_overrides: {}, is_open: true, opened_at: null, closed_at: null };
    }
  });
  const [productSizes, setProductSizes] = useState(() => {
    try {
      const raw = localStorage.getItem('pos_product_sizes');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [productSizeIngredients, setProductSizeIngredients] = useState(() => {
    try {
      const raw = localStorage.getItem('pos_product_size_ingredients');
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      return list.map(r => {
        const rawId = r?.ingredient_id;
        const str = String(rawId ?? '');
        const normalized = str.startsWith('mat:') ? Number(str.slice(4)) : Number(rawId);
        return { ...r, ingredient_id: Number.isFinite(normalized) ? normalized : rawId };
      });
    } catch {
      return [];
    }
  });
  const [productIngredients, setProductIngredients] = useState(() => {
    try {
      const raw = localStorage.getItem('pos_product_ingredients');
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      return list.map(r => {
        const rawId = r?.ingredient_id;
        const str = String(rawId ?? '');
        const normalized = str.startsWith('mat:') ? Number(str.slice(4)) : Number(rawId);
        return { ...r, ingredient_id: Number.isFinite(normalized) ? normalized : rawId };
      });
    } catch {
      return [];
    }
  });
  const [productAddons, setProductAddons] = useState(() => {
    try {
      const raw = localStorage.getItem('pos_product_addons');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [addonIngredients, setAddonIngredients] = useState(() => {
    try {
      const raw = localStorage.getItem('pos_addon_ingredients');
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      return list.map(r => {
        const rawId = r?.ingredient_id;
        const str = String(rawId ?? '');
        const normalized = str.startsWith('mat:') ? Number(str.slice(4)) : Number(rawId);
        return { ...r, ingredient_id: Number.isFinite(normalized) ? normalized : rawId };
      });
    } catch {
      return [];
    }
  });
  const [sales, setSales] = useState(() => {
    try {
      const raw = localStorage.getItem('pos_sales');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [dailySales, setDailySales] = useState(0);
  const [salesReport, setSalesReport] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const lowStockNotified = useRef(new Set());

  const normalizedUser = useMemo(() => {
    if (!user) return null;
    return user;
  }, [user]);

  const ingredientById = useMemo(() => {
    return new Map((ingredients || []).map(i => [String(i.id), i]));
  }, [ingredients]);

  const materialById = useMemo(() => {
    return new Map((materials || []).map(m => [String(m.id), m]));
  }, [materials]);

  const addonById = useMemo(() => {
    return new Map((addons || []).map(a => [String(a.id), a]));
  }, [addons]);

  const parseBomRef = (raw) => {
    const v = String(raw ?? '').trim();
    if (!v) return { type: 'ingredient', id: '' };
    if (v.startsWith('mat:')) return { type: 'material', id: v.slice(4) };
    if (v.startsWith('ing:')) return { type: 'ingredient', id: v.slice(4) };
    if (materialById.has(v)) return { type: 'material', id: v };
    return { type: 'ingredient', id: v };
  };

  const productBomByProductId = useMemo(() => {
    const map = new Map();
    for (const row of productIngredients || []) {
      const list = map.get(String(row.product_id)) || [];
      list.push(row);
      map.set(String(row.product_id), list);
    }
    return map;
  }, [productIngredients]);

  const addonBomByAddonId = useMemo(() => {
    const map = new Map();
    for (const row of addonIngredients || []) {
      const list = map.get(String(row.addon_id)) || [];
      list.push(row);
      map.set(String(row.addon_id), list);
    }
    return map;
  }, [addonIngredients]);

  const addonIdsByProductId = useMemo(() => {
    const map = new Map();
    for (const row of productAddons || []) {
      const list = map.get(String(row.product_id)) || [];
      list.push(row.addon_id);
      map.set(String(row.product_id), list);
    }
    return map;
  }, [productAddons]);

  const sizeById = useMemo(() => {
    return new Map((productSizes || []).map(s => [s.id, s]));
  }, [productSizes]);

  const sizesByProductId = useMemo(() => {
    const map = new Map();
    for (const s of productSizes || []) {
      const list = map.get(String(s.product_id)) || [];
      list.push(s);
      map.set(String(s.product_id), list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || String(a.name).localeCompare(String(b.name)));
    }
    return map;
  }, [productSizes]);

  const sizeIngredientsBySizeId = useMemo(() => {
    const map = new Map();
    for (const row of productSizeIngredients || []) {
      const list = map.get(String(row.product_size_id)) || [];
      list.push(row);
      map.set(String(row.product_size_id), list);
    }
    return map;
  }, [productSizeIngredients]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setNotifications(prev => {
      const next = [...prev, { id, message, type, read: false, toast_dismissed: false, created_at: new Date().toISOString() }];
      const max = 200;
      if (next.length <= max) return next;
      return next.slice(next.length - max);
    });
    const ttl = type === 'warning' || type === 'error' ? 15000 : 6000;
    setTimeout(() => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, toast_dismissed: true } : n));
    }, ttl);
  };

  const dismissNotificationToast = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, toast_dismissed: true } : n));
  };

  const markNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const persistActivityLogs = (next) => {
    try {
      localStorage.setItem('activity_logs', JSON.stringify(next));
    } catch {}
  };

  const persistCategories = (next) => {
    try {
      localStorage.setItem('pos_categories', JSON.stringify(next));
    } catch {}
  };

  const persistProducts = (next) => {
    try {
      localStorage.setItem('pos_products', JSON.stringify(next));
    } catch {}
  };

  const persistProductSizes = (next) => {
    try {
      localStorage.setItem('pos_product_sizes', JSON.stringify(next));
    } catch {}
  };

  const persistProductSizeIngredients = (next) => {
    try {
      localStorage.setItem('pos_product_size_ingredients', JSON.stringify(next));
    } catch {}
  };

  const persistProductIngredients = (next) => {
    try {
      localStorage.setItem('pos_product_ingredients', JSON.stringify(next));
    } catch {}
  };

  const persistProductAddons = (next) => {
    try {
      localStorage.setItem('pos_product_addons', JSON.stringify(next));
    } catch {}
  };

  const persistAddonIngredients = (next) => {
    try {
      localStorage.setItem('pos_addon_ingredients', JSON.stringify(next));
    } catch {}
  };

  const persistSales = (next) => {
    try {
      localStorage.setItem('pos_sales', JSON.stringify(next));
    } catch {}
  };

  const persistIngredients = (next) => {
    try {
      localStorage.setItem('pos_ingredients', JSON.stringify(next));
    } catch {}
  };

  useEffect(() => {
    const derived = (ingredients || []).filter(i => isMaterialUnit(i?.unit));
    setMaterials(derived);
    persistMaterials(derived);
  }, [ingredients]);

  useEffect(() => {
    try {
      const rawMaterials = localStorage.getItem('pos_materials');
      const parsedMaterials = rawMaterials ? JSON.parse(rawMaterials) : [];
      const mats = Array.isArray(parsedMaterials) ? parsedMaterials : [];
      if (mats.length === 0) return;

      setIngredients(prev => {
        const list = Array.isArray(prev) ? [...prev] : [];
        const keyOf = (row) => `${String(row?.name || '').trim().toLowerCase()}|${String(row?.unit || '').trim().toLowerCase()}`;
        const existingKeys = new Set(list.map(keyOf));
        const used = new Set(list.map(i => String(i?.id)));
        let nextId = 1;
        for (const i of list) {
          const n = Number(i?.id);
          if (Number.isFinite(n)) nextId = Math.max(nextId, n + 1);
        }

        let changed = false;
        for (const m of mats) {
          const name = String(m?.name || '').trim();
          if (!name) continue;
          const unit = String(m?.unit || 'pcs');
          const key = `${name.toLowerCase()}|${String(unit || '').trim().toLowerCase()}`;
          if (existingKeys.has(key)) continue;
          while (used.has(String(nextId))) nextId += 1;
          used.add(String(nextId));
          existingKeys.add(key);
          list.push({
            ...m,
            id: nextId,
            name,
            unit,
            quantity: Number(m?.quantity || 0),
            min_stock: Number(m?.min_stock || 0)
          });
          nextId += 1;
          changed = true;
        }

        if (changed) persistIngredients(list);
        return changed ? list : prev;
      });
    } catch {}
  }, []);

  const persistIngredientCategories = (next) => {
    try {
      localStorage.setItem('pos_ingredient_categories', JSON.stringify(next));
    } catch {}
  };

  const persistMaterials = (next) => {
    try {
      localStorage.setItem('pos_materials', JSON.stringify(next));
    } catch {}
  };

  const persistMaterialCategories = (next) => {
    try {
      localStorage.setItem('pos_material_categories', JSON.stringify(next));
    } catch {}
  };

  const persistAddons = (next) => {
    try {
      localStorage.setItem('pos_addons', JSON.stringify(next));
    } catch {}
  };

  const persistAddonCategories = (next) => {
    try {
      localStorage.setItem('pos_addon_categories', JSON.stringify(next));
    } catch {}
  };

  const persistStoreSettings = (next) => {
    try {
      localStorage.setItem('pos_store_settings', JSON.stringify(next));
    } catch {}
  };

  const withTimeout = (promise, ms = 5000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
    ]);
  };

  const summarizeDbError = (err) => {
    const msg = String(err?.message || err || '').trim();
    const low = msg.toLowerCase();
    if (!msg) return 'unknown error';
    if (low.includes('timeout') || low.includes('failed to fetch') || low.includes('networkerror')) return 'cannot reach database';
    if (low.includes('violates row-level security') || low.includes('permission denied')) return 'RLS/permissions blocked';
    if (low.includes('does not exist') || low.includes('relation') || low.includes('undefined_table')) return 'missing table in database';
    if (low.includes('schema cache')) return 'schema cache not refreshed';
    return msg.length > 120 ? msg.slice(0, 120) + '…' : msg;
  };

  const LOGIN_THROTTLE_KEY = 'pos_login_throttle';
  const LOGIN_MAX_ATTEMPTS = 3;
  const LOGIN_LOCK_MS = 3 * 60 * 1000;

  const readLoginThrottle = () => {
    try {
      const raw = localStorage.getItem(LOGIN_THROTTLE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  const writeLoginThrottle = (next) => {
    try {
      localStorage.setItem(LOGIN_THROTTLE_KEY, JSON.stringify(next || {}));
    } catch {}
  };

  const getLoginThrottleState = (accountKey) => {
    const key = String(accountKey || '').trim().toUpperCase();
    if (!key) return { attempts: 0, lockUntil: 0 };
    const store = readLoginThrottle();
    const row = store[key] || {};
    const attempts = Math.max(0, Math.floor(Number(row.attempts || 0)));
    const lockUntil = Math.max(0, Number(row.lockUntil || 0));
    if (lockUntil && Date.now() >= lockUntil) {
      delete store[key];
      writeLoginThrottle(store);
      return { attempts: 0, lockUntil: 0 };
    }
    return { attempts, lockUntil };
  };

  const setLoginThrottleState = (accountKey, nextState) => {
    const key = String(accountKey || '').trim().toUpperCase();
    if (!key) return;
    const store = readLoginThrottle();
    store[key] = {
      attempts: Math.max(0, Math.floor(Number(nextState?.attempts || 0))),
      lockUntil: Math.max(0, Number(nextState?.lockUntil || 0))
    };
    writeLoginThrottle(store);
  };

  const clearLoginThrottleState = (accountKey) => {
    const key = String(accountKey || '').trim().toUpperCase();
    if (!key) return;
    const store = readLoginThrottle();
    if (store[key]) {
      delete store[key];
      writeLoginThrottle(store);
    }
  };

  const formatLockRemaining = (lockUntil) => {
    const ms = Math.max(0, Number(lockUntil || 0) - Date.now());
    const totalSeconds = Math.ceil(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${String(s).padStart(2, '0')}s`;
  };

  const fetchStoreSettings = async () => {
    return storeSettings;
  };

  const updateStoreSettings = async (updates) => {
    const next = {
      ...storeSettings,
      ...(updates || {}),
      open_time: updates?.open_time ? String(updates.open_time) : storeSettings.open_time,
      close_time: updates?.close_time ? String(updates.close_time) : storeSettings.close_time,
      days_open: Array.isArray(updates?.days_open)
        ? updates.days_open.map(n => Number(n)).filter(n => Number.isFinite(n))
        : storeSettings.days_open,
      day_overrides:
        updates?.day_overrides && typeof updates.day_overrides === 'object' ? updates.day_overrides : storeSettings.day_overrides || {},
      is_open: updates?.is_open === false ? false : (updates?.is_open === true ? true : storeSettings?.is_open !== false),
      opened_at: updates?.opened_at ? String(updates.opened_at) : storeSettings.opened_at ?? null,
      closed_at: updates?.closed_at ? String(updates.closed_at) : storeSettings.closed_at ?? null
    };
    setStoreSettings(next);
    persistStoreSettings(next);
    addNotification('Settings updated.', 'success');
    await logActivity({ action: 'Updated store settings', area: 'settings', entityType: 'store_settings', entityId: 'default' });
    return { ok: true };
  };

  const addIngredientCategory = async (name) => {
    const trimmed = (name || '').toString().trim();
    if (!trimmed) return { ok: false };
    setIngredientCategories(prev => {
      const set = new Set([...(prev || []).map(x => String(x))]);
      set.add(trimmed);
      const next = Array.from(set).sort((a, b) => a.localeCompare(b));
      persistIngredientCategories(next);
      return next;
    });
    await logActivity({ action: `Created ingredient category: ${trimmed}`, area: 'inventory', entityType: 'ingredient_category', entityId: trimmed });
    return { ok: true };
  };

  const addMaterialCategory = async (name) => {
    const trimmed = (name || '').toString().trim();
    if (!trimmed) return { ok: false };
    setMaterialCategories(prev => {
      const set = new Set([...(prev || []).map(x => String(x))]);
      set.add(trimmed);
      const next = Array.from(set).sort((a, b) => a.localeCompare(b));
      persistMaterialCategories(next);
      return next;
    });
    await logActivity({ action: `Created material category: ${trimmed}`, area: 'inventory', entityType: 'material_category', entityId: trimmed });
    return { ok: true };
  };

  const addAddonCategory = async (name) => {
    const trimmed = (name || '').toString().trim();
    if (!trimmed) return { ok: false };
    setAddonCategories(prev => {
      const set = new Set([...(prev || []).map(x => String(x))]);
      set.add(trimmed);
      const next = Array.from(set).sort((a, b) => a.localeCompare(b));
      persistAddonCategories(next);
      return next;
    });
    await logActivity({ action: `Created add-on category: ${trimmed}`, area: 'inventory', entityType: 'addon_category', entityId: trimmed });
    return { ok: true };
  };

  const ensureCategory = (kind, value) => {
    const trimmed = (value || '').toString().trim();
    if (!trimmed) return;
    if (kind === 'ingredient') {
      setIngredientCategories(prev => {
        const set = new Set([...(prev || []).map(x => String(x))]);
        set.add(trimmed);
        const next = Array.from(set).sort((a, b) => a.localeCompare(b));
        persistIngredientCategories(next);
        return next;
      });
      return;
    }
    if (kind === 'material') {
      setMaterialCategories(prev => {
        const set = new Set([...(prev || []).map(x => String(x))]);
        set.add(trimmed);
        const next = Array.from(set).sort((a, b) => a.localeCompare(b));
        persistMaterialCategories(next);
        return next;
      });
      return;
    }
    if (kind === 'addon') {
      setAddonCategories(prev => {
        const set = new Set([...(prev || []).map(x => String(x))]);
        set.add(trimmed);
        const next = Array.from(set).sort((a, b) => a.localeCompare(b));
        persistAddonCategories(next);
        return next;
      });
    }
  };

  const renameCategoryInList = (list, fromName, toName) => {
    const from = String(fromName || '').trim();
    const to = String(toName || '').trim();
    if (!from || !to) return Array.isArray(list) ? list : [];
    const next = (Array.isArray(list) ? list : []).map(x => String(x)).filter(Boolean);
    const set = new Set(next);
    set.delete(from);
    set.add(to);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  };

  const renameIngredientCategory = async ({ from, to }) => {
    const fromName = String(from || '').trim();
    const toName = String(to || '').trim();
    if (!fromName || !toName) return { ok: false };

    setIngredientCategories(prev => {
      const next = renameCategoryInList(prev, fromName, toName);
      persistIngredientCategories(next);
      return next;
    });

    setIngredients(prev => {
      const next = (prev || []).map(i => (String(i?.category || '') === fromName ? { ...i, category: toName, _localUpdatedAt: Date.now() } : i));
      persistIngredients(next);
      return next;
    });

    addNotification('Category updated.', 'success');
    await logActivity({ action: `Renamed ingredient category: ${fromName} -> ${toName}`, area: 'inventory', entityType: 'ingredient_category', entityId: toName });
    return { ok: true };
  };

  const renameMaterialCategory = async ({ from, to }) => {
    const fromName = String(from || '').trim();
    const toName = String(to || '').trim();
    if (!fromName || !toName) return { ok: false };

    setMaterialCategories(prev => {
      const next = renameCategoryInList(prev, fromName, toName);
      persistMaterialCategories(next);
      return next;
    });

    setIngredients(prev => {
      const next = (prev || []).map(i => (isMaterialUnit(i?.unit) && String(i?.category || '') === fromName ? { ...i, category: toName, _localUpdatedAt: Date.now() } : i));
      persistIngredients(next);
      return next;
    });

    addNotification('Category updated.', 'success');
    await logActivity({ action: `Renamed material category: ${fromName} -> ${toName}`, area: 'inventory', entityType: 'material_category', entityId: toName });
    return { ok: true };
  };

  const renameAddonCategory = async ({ from, to }) => {
    const fromName = String(from || '').trim();
    const toName = String(to || '').trim();
    if (!fromName || !toName) return { ok: false };

    setAddonCategories(prev => {
      const next = renameCategoryInList(prev, fromName, toName);
      persistAddonCategories(next);
      return next;
    });

    setAddons(prev => {
      const next = (prev || []).map(a => (String(a?.category || '') === fromName ? { ...a, category: toName, _localUpdatedAt: Date.now() } : a));
      persistAddons(next);
      return next;
    });

    addNotification('Category updated.', 'success');
    await logActivity({ action: `Renamed add-on category: ${fromName} -> ${toName}`, area: 'inventory', entityType: 'addon_category', entityId: toName });
    return { ok: true };
  };

  const deleteIngredientCategory = async ({ name }) => {
    const fromName = String(name || '').trim();
    if (!fromName) return { ok: false };

    setIngredientCategories(prev => {
      const next = (prev || []).map(x => String(x)).filter(Boolean).filter(x => x !== fromName);
      persistIngredientCategories(next);
      return next;
    });

    setIngredients(prev => {
      const next = (prev || []).map(i => (String(i?.category || '') === fromName ? { ...i, category: null, _localUpdatedAt: Date.now() } : i));
      persistIngredients(next);
      return next;
    });

    addNotification('Category deleted.', 'success');
    await logActivity({ action: `Deleted ingredient category: ${fromName}`, area: 'inventory', entityType: 'ingredient_category', entityId: fromName });
    return { ok: true };
  };

  const deleteMaterialCategory = async ({ name }) => {
    const fromName = String(name || '').trim();
    if (!fromName) return { ok: false };

    setMaterialCategories(prev => {
      const next = (prev || []).map(x => String(x)).filter(Boolean).filter(x => x !== fromName);
      persistMaterialCategories(next);
      return next;
    });

    setIngredients(prev => {
      const next = (prev || []).map(i => (isMaterialUnit(i?.unit) && String(i?.category || '') === fromName ? { ...i, category: null, _localUpdatedAt: Date.now() } : i));
      persistIngredients(next);
      return next;
    });

    addNotification('Category deleted.', 'success');
    await logActivity({ action: `Deleted material category: ${fromName}`, area: 'inventory', entityType: 'material_category', entityId: fromName });
    return { ok: true };
  };

  const deleteAddonCategory = async ({ name }) => {
    const fromName = String(name || '').trim();
    if (!fromName) return { ok: false };

    setAddonCategories(prev => {
      const next = (prev || []).map(x => String(x)).filter(Boolean).filter(x => x !== fromName);
      persistAddonCategories(next);
      return next;
    });

    setAddons(prev => {
      const next = (prev || []).map(a => (String(a?.category || '') === fromName ? { ...a, category: null, _localUpdatedAt: Date.now() } : a));
      persistAddons(next);
      return next;
    });

    addNotification('Category deleted.', 'success');
    await logActivity({ action: `Deleted add-on category: ${fromName}`, area: 'inventory', entityType: 'addon_category', entityId: fromName });
    return { ok: true };
  };

  const fetchActivityLogs = async () => {
    if (!isSupabaseConfigured) return activityLogs || [];
    let { data, error } = await supabase
      .from('activity_logs')
      .select('id,created_at,actor_account_id,actor_name,action,area,entity_type,entity_id')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error && String(error.message || '').toLowerCase().includes('activity_logs')) return activityLogs || [];
    if (error) return activityLogs || [];
    const mapped = (data || []).map(r => ({
      id: r.id,
      created_at: r.created_at,
      actor_account_id: r.actor_account_id ?? null,
      actor_name: r.actor_name ?? null,
      action: r.action ?? '',
      area: r.area ?? null,
      entity_type: r.entity_type ?? null,
      entity_id: r.entity_id ?? null
    }));
    setActivityLogs(mapped);
    persistActivityLogs(mapped);
    return mapped;
  };

  const logActivity = async ({ action, area = null, entityType = null, entityId = null, actor = null } = {}) => {
    const effectiveActor = actor || normalizedUser || null;
    const actorAccountId =
      effectiveActor?.account_id ?? effectiveActor?.accountId ?? effectiveActor?.email ?? effectiveActor?.id ?? null;
    const actorName = effectiveActor?.name ?? null;
    const entry = {
      id: Date.now(),
      created_at: new Date().toISOString(),
      actor_account_id: actorAccountId ? String(actorAccountId) : null,
      actor_name: actorName ? String(actorName) : null,
      action: String(action || ''),
      area,
      entity_type: entityType,
      entity_id: entityId == null ? null : String(entityId)
    };
    setActivityLogs(prev => {
      const next = [entry, ...(prev || [])].slice(0, 200);
      persistActivityLogs(next);
      return next;
    });

    if (!isSupabaseConfigured) return { ok: true };
    try {
      const { error } = await supabase.from('activity_logs').insert([{
        actor_account_id: entry.actor_account_id,
        actor_name: entry.actor_name,
        action: entry.action,
        area: entry.area,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id
      }]);
      if (error && String(error.message || '').toLowerCase().includes('activity_logs')) return { ok: true };
      if (error) return { ok: false };
      return { ok: true };
    } catch {
      return { ok: false };
    }
  };

  const notifyLowStockIngredients = (list) => {
    for (const ing of list || []) {
      const qty = Number(ing.quantity || 0);
      const min = Number(ing.min_stock || 0);
      const unitLabel = ing.unit ? ` ${ing.unit}` : '';
      const lowKey = `low:${ing.id}`;
      const outKey = `out:${ing.id}`;

      const isLow = min > 0 && qty <= min;
      const isOut = qty <= 0;

      if (!isLow) lowStockNotified.current.delete(lowKey);
      if (!isOut) lowStockNotified.current.delete(outKey);

      if (isOut && !lowStockNotified.current.has(outKey)) {
        lowStockNotified.current.add(outKey);
        addNotification(`Out of stock: ${ing.name} (0${unitLabel})`, 'error');
        continue;
      }

      if (isLow && !lowStockNotified.current.has(lowKey)) {
        lowStockNotified.current.add(lowKey);
        addNotification(`Low stock: ${ing.name} (${qty}${unitLabel})`, 'warning');
      }
    }
  };

  const mergeById = (remoteList, localList) => {
    const map = new Map();
    for (const item of remoteList || []) {
      if (!item) continue;
      map.set(String(item.id), item);
    }
    for (const item of localList || []) {
      if (!item) continue;
      const key = String(item.id);
      if (!map.has(key)) map.set(key, item);
    }
    return Array.from(map.values());
  };

  const mergeByIdPreferLocal = (remoteList, localList) => {
    const map = new Map();
    for (const item of remoteList || []) {
      if (!item) continue;
      map.set(String(item.id), item);
    }
    for (const item of localList || []) {
      if (!item) continue;
      const key = String(item.id);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, item);
        continue;
      }
      const localTs = Number(item?._localUpdatedAt || 0);
      const remoteTs = Number(existing?._localUpdatedAt || 0);
      if (localTs >= remoteTs) map.set(key, item);
    }
    return Array.from(map.values());
  };

  const mergeByKey = (remoteList, localList, keyFn) => {
    const map = new Map();
    for (const item of remoteList || []) {
      if (!item) continue;
      map.set(String(keyFn(item)), item);
    }
    for (const item of localList || []) {
      if (!item) continue;
      const key = String(keyFn(item));
      if (!map.has(key)) map.set(key, item);
    }
    return Array.from(map.values());
  };

  const sameId = (a, b) => String(a) === String(b);

  const isMaterialUnit = (unit) => {
    const u = String(unit || '').trim().toLowerCase();
    return u === 'pcs' || u === 'pc' || u === 'piece' || u === 'pieces';
  };

  const normalizeDbTimestamp = (raw) => {
    if (!raw) return null;
    const s = String(raw).trim();
    if (!s) return null;
    const hasTz = /z$/i.test(s) || /[+\-]\d{2}:?\d{2}$/.test(s);
    const isoCandidate = hasTz ? s : (s.includes('T') ? `${s}Z` : s);
    const d = new Date(isoCandidate);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  };

  const fetchCategories = async () => {
    if (!isSupabaseConfigured) return categories || [];
    try {
      const { data, error } = await withTimeout(
        supabase.from('categories').select('*').order('name', { ascending: true }),
        5000
      );
      if (error) return categories || [];
      const remote = (data || []).map(r => ({ ...r, _localUpdatedAt: 0 }));
      const merged = mergeByIdPreferLocal(remote, categories || [])
        .slice()
        .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')));
      setCategories(merged);
      persistCategories(merged);
      return merged;
    } catch {
      return categories || [];
    }
  };

  const fetchProducts = async () => {
    if (!isSupabaseConfigured) return products || [];
    try {
      const fullSelect = 'id,name,category_id,price,stock,barcode,created_at,categories(name)';
      const minimalSelect = 'id,name,category_id,created_at,categories(name)';

      let { data, error } = await withTimeout(
        supabase.from('products').select(fullSelect).order('created_at', { ascending: false }),
        5000
      );

      const msg = String(error?.message || '').toLowerCase();
      if (error && (msg.includes('price') || msg.includes('stock') || msg.includes('barcode') || msg.includes('column'))) {
        const retry = await withTimeout(
          supabase.from('products').select(minimalSelect).order('created_at', { ascending: false }),
          5000
        );
        data = retry.data;
        error = retry.error;
      }

      if (error) return products || [];

      const mapped = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        category_id: row.category_id ?? null,
        price: row.price == null ? 0 : Number(row.price || 0),
        stock: row.stock ?? null,
        barcode: row.barcode ?? null,
        created_at: row.created_at ?? null,
        categoryName: row.categories?.name ?? null,
        _localUpdatedAt: 0
      }));
      const merged = mergeByIdPreferLocal(mapped, products || [])
        .slice()
        .sort((a, b) => {
          const ad = a?.created_at ? new Date(a.created_at).getTime() : 0;
          const bd = b?.created_at ? new Date(b.created_at).getTime() : 0;
          return bd - ad || String(a?.name || '').localeCompare(String(b?.name || ''));
        });
      setProducts(merged);
      persistProducts(merged);
      return merged;
    } catch {
      return products || [];
    }
  };

  const fetchIngredients = async () => {
    if (!isSupabaseConfigured) return ingredients || [];
    try {
      let { data, error } = await withTimeout(
        supabase
          .from('ingredients')
          .select('id,name,category,unit,quantity,min_stock,created_at')
          .order('name', { ascending: true }),
        5000
      );
      if (error && String(error.message || '').toLowerCase().includes('category')) {
        const retry = await withTimeout(
          supabase
            .from('ingredients')
            .select('id,name,unit,quantity,min_stock,created_at')
            .order('name', { ascending: true }),
          5000
        );
        data = retry.data;
        error = retry.error;
      }
      if (error) return ingredients || [];

      const mapped = (data || []).map(r => ({
        ...r,
        category: r.category ?? null,
        quantity: Number(r.quantity),
        min_stock: Number(r.min_stock),
        _localUpdatedAt: 0
      }));
      const merged = mergeByIdPreferLocal(mapped, ingredients || [])
        .slice()
        .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')));
      setIngredients(merged);
      persistIngredients(merged);
      notifyLowStockIngredients(merged);
      return merged;
    } catch {
      return ingredients || [];
    }
  };

  const fetchMaterials = async () => {
    if (!isSupabaseConfigured) return (ingredients || []).filter(i => isMaterialUnit(i?.unit));
    try {
      const units = ['pcs', 'pc', 'piece', 'pieces'];
      const { data, error } = await withTimeout(
        supabase
          .from('ingredients')
          .select('id,name,unit,quantity,min_stock,created_at')
          .in('unit', units)
          .order('name', { ascending: true }),
        5000
      );
      if (error) return (ingredients || []).filter(i => isMaterialUnit(i?.unit));
      const mapped = (data || []).map(r => ({
        ...r,
        category: r.category ?? null,
        quantity: Number(r.quantity),
        min_stock: Number(r.min_stock),
        _localUpdatedAt: 0
      }));
      setMaterials(mapped);
      persistMaterials(mapped);
      return mapped;
    } catch {
      return (ingredients || []).filter(i => isMaterialUnit(i?.unit));
    }
  };

  const fetchAddons = async () => {
    if (!isSupabaseConfigured) return addons || [];
    try {
      let { data, error } = await withTimeout(
        supabase
          .from('addons')
          .select('id,name,category,price_per_unit,variable_quantity,created_at')
          .order('name', { ascending: true }),
        5000
      );
      if (error && String(error.message || '').toLowerCase().includes('category')) {
        const retry = await withTimeout(
          supabase
            .from('addons')
            .select('id,name,price_per_unit,variable_quantity,created_at')
            .order('name', { ascending: true }),
          5000
        );
        data = retry.data;
        error = retry.error;
      }
      if (error) return addons || [];
      const mapped = (data || []).map(r => ({
        ...r,
        category: r.category ?? null,
        price_per_unit: Number(r.price_per_unit),
        variable_quantity: Boolean(r.variable_quantity),
        _localUpdatedAt: 0
      }));
      const merged = mergeByIdPreferLocal(mapped, addons || [])
        .slice()
        .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')));
      setAddons(merged);
      persistAddons(merged);
      return merged;
    } catch {
      return addons || [];
    }
  };

  const fetchProductSizes = async () => {
    if (!isSupabaseConfigured) return productSizes || [];
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('product_sizes')
          .select('id,product_id,name,price,sort_order,created_at')
          .order('product_id', { ascending: true })
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true }),
        5000
      );
      if (error) return productSizes || [];
      const mapped = (data || []).map(r => ({
        ...r,
        price: Number(r.price || 0),
        sort_order: r.sort_order ?? 0
      }));
      const merged = mergeById(mapped, productSizes || []);
      setProductSizes(merged);
      persistProductSizes(merged);
      return merged;
    } catch {
      return productSizes || [];
    }
  };

  const fetchProductSizeIngredients = async () => {
    if (!isSupabaseConfigured) return productSizeIngredients || [];
    try {
      const { data, error } = await withTimeout(
        supabase.from('product_size_ingredients').select('product_size_id,ingredient_id,quantity'),
        5000
      );
      if (error) return productSizeIngredients || [];
      const mapped = (data || []).map(r => ({
        product_size_id: r.product_size_id,
        ingredient_id: r.ingredient_id,
        quantity: Number(r.quantity)
      }));
      const merged = mergeByKey(mapped, productSizeIngredients || [], r => `${r.product_size_id}|${r.ingredient_id}`);
      setProductSizeIngredients(merged);
      persistProductSizeIngredients(merged);
      return merged;
    } catch {
      return productSizeIngredients || [];
    }
  };

  const fetchProductIngredients = async () => {
    if (!isSupabaseConfigured) return productIngredients || [];
    try {
      const { data, error } = await withTimeout(
        supabase.from('product_ingredients').select('product_id,ingredient_id,quantity'),
        5000
      );
      if (error) return productIngredients || [];
      const mapped = (data || []).map(r => ({
        product_id: r.product_id,
        ingredient_id: r.ingredient_id,
        quantity: Number(r.quantity)
      }));
      const merged = mergeByKey(mapped, productIngredients || [], r => `${r.product_id}|${r.ingredient_id}`);
      setProductIngredients(merged);
      persistProductIngredients(merged);
      return merged;
    } catch {
      return productIngredients || [];
    }
  };

  const fetchProductAddons = async () => {
    if (!isSupabaseConfigured) return productAddons || [];
    try {
      const { data, error } = await withTimeout(
        supabase.from('product_addons').select('product_id,addon_id'),
        5000
      );
      if (error) return productAddons || [];
      const mapped = (data || []).map(r => ({ product_id: r.product_id, addon_id: r.addon_id }));
      const merged = mergeByKey(mapped, productAddons || [], r => `${r.product_id}|${r.addon_id}`);
      setProductAddons(merged);
      persistProductAddons(merged);
      return merged;
    } catch {
      return productAddons || [];
    }
  };

  const fetchAddonIngredients = async () => {
    if (!isSupabaseConfigured) return addonIngredients || [];
    try {
      const { data, error } = await withTimeout(
        supabase.from('addon_ingredients').select('addon_id,ingredient_id,quantity'),
        5000
      );
      if (error) return addonIngredients || [];
      const mapped = (data || []).map(r => ({
        addon_id: r.addon_id,
        ingredient_id: r.ingredient_id,
        quantity: Number(r.quantity)
      }));
      const merged = mergeByKey(mapped, addonIngredients || [], r => `${r.addon_id}|${r.ingredient_id}`);
      setAddonIngredients(merged);
      persistAddonIngredients(merged);
      return merged;
    } catch {
      return addonIngredients || [];
    }
  };

  const fetchSales = async () => {
    if (!isSupabaseConfigured) return [];
    const mapAndPersist = (rows) => {
      setSales(rows);
      persistSales(rows);
      return rows;
    };

    try {
      const baseSelect =
        'id,account_id,total_amount,payment_method,reference_number,cash_received,change_amount,created_at,' +
        'accounts(name,account_id,email),' +
        'transactions(id,sale_id,product_id,quantity,price,subtotal,product_size_id,size_name,' +
        'products(name,category_id),' +
        'transaction_addons(addon_id,quantity,unit_price,subtotal,addons(name)))';

      const cashFallbackSelect =
        'id,account_id,total_amount,payment_method,reference_number,created_at,' +
        'accounts(name,account_id,email),' +
        'transactions(id,sale_id,product_id,quantity,price,subtotal,product_size_id,size_name,' +
        'products(name,category_id),' +
        'transaction_addons(addon_id,quantity,unit_price,subtotal,addons(name)))';

      const sizeFallbackSelect =
        'id,account_id,total_amount,payment_method,reference_number,cash_received,change_amount,created_at,' +
        'accounts(name,account_id,email),' +
        'transactions(id,sale_id,product_id,quantity,price,subtotal,' +
        'products(name,category_id),' +
        'transaction_addons(addon_id,quantity,unit_price,subtotal,addons(name)))';

      const accountFallbackSelect =
        'id,account_id,total_amount,payment_method,reference_number,cash_received,change_amount,created_at,' +
        'accounts(name,email),' +
        'transactions(id,sale_id,product_id,quantity,price,subtotal,product_size_id,size_name,' +
        'products(name,category_id),' +
        'transaction_addons(addon_id,quantity,unit_price,subtotal,addons(name)))';

      let data = null;
      let error = null;

      const first = await withTimeout(
        supabase.from('sales').select(baseSelect).order('created_at', { ascending: false }).limit(500),
        5000
      );
      data = first.data;
      error = first.error;

      const msg = String(error?.message || '').toLowerCase();
      if (error && (msg.includes('cash_received') || msg.includes('change_amount'))) {
        const retry = await withTimeout(
          supabase.from('sales').select(cashFallbackSelect).order('created_at', { ascending: false }).limit(500),
          5000
        );
        data = retry.data;
        error = retry.error;
      }

      const msg2 = String(error?.message || '').toLowerCase();
      if (error && (msg2.includes('product_size_id') || msg2.includes('size_name'))) {
        const retry = await withTimeout(
          supabase.from('sales').select(sizeFallbackSelect).order('created_at', { ascending: false }).limit(500),
          5000
        );
        data = retry.data;
        error = retry.error;
      }

      const msg3 = String(error?.message || '').toLowerCase();
      if (error && msg3.includes('account_id') && msg3.includes('accounts')) {
        const retry = await withTimeout(
          supabase.from('sales').select(accountFallbackSelect).order('created_at', { ascending: false }).limit(500),
          5000
        );
        data = retry.data;
        error = retry.error;
      }

      if (!error && Array.isArray(data)) {
        const mapped = (data || []).map(s => ({
          id: s.id,
          created_at: normalizeDbTimestamp(s.created_at) || s.created_at,
          total_amount: Number(s.total_amount),
          payment_method: s.payment_method,
          reference_number: s.reference_number,
          cash_received: s.cash_received ?? null,
          change_amount: s.change_amount ?? null,
          cashier: s.accounts?.name ?? 'Unknown',
          cashier_account_id: s.accounts?.account_id ?? s.accounts?.email ?? null,
          items: (s.transactions || []).map(t => ({
            product_id: t.product_id ?? null,
            name: t.products?.name ?? 'Unknown',
            category_id: t.products?.category_id ?? null,
            quantity: t.quantity,
            price: Number(t.price),
            subtotal: Number(t.subtotal),
            size_name: t.size_name ?? null,
            addons: (t.transaction_addons || []).map(a => ({
              addon_id: a.addon_id ?? null,
              name: a.addons?.name ?? 'Unknown',
              quantity: Number(a.quantity),
              unit_price: Number(a.unit_price),
              subtotal: Number(a.subtotal)
            }))
          }))
        }));

        const unknownProductIds = new Set();
        const unknownAddonIds = new Set();
        for (const s of mapped) {
          for (const it of s.items || []) {
            if (it.name === 'Unknown' && it.product_id != null) unknownProductIds.add(String(it.product_id));
            for (const ad of it.addons || []) {
              if (ad.name === 'Unknown' && ad.addon_id != null) unknownAddonIds.add(String(ad.addon_id));
            }
          }
        }

        if (unknownProductIds.size === 0 && unknownAddonIds.size === 0) {
          return mapAndPersist(mapped);
        }

        const prodMap = new Map();
        if (unknownProductIds.size > 0) {
          const ids = Array.from(unknownProductIds);
          const { data: prodData } = await withTimeout(
            supabase.from('products').select('id,name,category_id').in('id', ids),
            5000
          );
          for (const p of prodData || []) prodMap.set(String(p.id), p);
        }

        const addonMap = new Map();
        if (unknownAddonIds.size > 0) {
          const ids = Array.from(unknownAddonIds);
          const { data: addonData } = await withTimeout(
            supabase.from('addons').select('id,name').in('id', ids),
            5000
          );
          for (const a of addonData || []) addonMap.set(String(a.id), a);
        }

        const fixed = mapped.map(s => ({
          ...s,
          items: (s.items || []).map(it => {
            const prod = it.product_id != null ? prodMap.get(String(it.product_id)) : null;
            return {
              ...it,
              name: it.name === 'Unknown' && prod?.name ? prod.name : it.name,
              category_id: it.category_id ?? prod?.category_id ?? null,
              addons: (it.addons || []).map(ad => {
                const row = ad.addon_id != null ? addonMap.get(String(ad.addon_id)) : null;
                return { ...ad, name: ad.name === 'Unknown' && row?.name ? row.name : ad.name };
              })
            };
          })
        }));

        return mapAndPersist(fixed);
      }
    } catch {}

    try {
      const { data: salesRows, error: salesErr } = await withTimeout(
        supabase
          .from('sales')
          .select('id,account_id,total_amount,payment_method,reference_number,cash_received,change_amount,created_at')
          .order('created_at', { ascending: false })
          .limit(500),
        5000
      );
      if (salesErr) return [];
      const saleIds = (salesRows || []).map(r => r.id).filter(Boolean);
      if (saleIds.length === 0) return mapAndPersist([]);

      const accountIds = Array.from(
        new Set((salesRows || []).map(r => r.account_id).filter(Boolean).map(x => String(x)))
      );
      const accountsMap = new Map();
      if (accountIds.length > 0) {
        const { data: acctData } = await withTimeout(
          supabase.from('accounts').select('id,name,account_id,email').in('id', accountIds),
          5000
        );
        for (const a of acctData || []) accountsMap.set(String(a.id), a);
      }

      const { data: trxRows, error: trxErr } = await withTimeout(
        supabase
          .from('transactions')
          .select('id,sale_id,product_id,quantity,price,subtotal,product_size_id,size_name')
          .in('sale_id', saleIds),
        5000
      );
      if (trxErr) return [];

      const trxIds = (trxRows || []).map(t => t.id).filter(Boolean);
      const { data: trxAddonRows } = trxIds.length
        ? await withTimeout(
            supabase.from('transaction_addons').select('transaction_id,addon_id,quantity,unit_price,subtotal').in('transaction_id', trxIds),
            5000
          )
        : { data: [] };

      const productIds = Array.from(new Set((trxRows || []).map(t => t.product_id).filter(Boolean).map(x => String(x))));
      const productsMap = new Map();
      if (productIds.length > 0) {
        const { data: prodData } = await withTimeout(
          supabase.from('products').select('id,name,category_id').in('id', productIds),
          5000
        );
        for (const p of prodData || []) productsMap.set(String(p.id), p);
      }

      const addonIds = Array.from(new Set((trxAddonRows || []).map(a => a.addon_id).filter(Boolean).map(x => String(x))));
      const addonsMap = new Map();
      if (addonIds.length > 0) {
        const { data: addonData } = await withTimeout(
          supabase.from('addons').select('id,name').in('id', addonIds),
          5000
        );
        for (const a of addonData || []) addonsMap.set(String(a.id), a);
      }

      const addonsByTrxId = new Map();
      for (const a of trxAddonRows || []) {
        const list = addonsByTrxId.get(String(a.transaction_id)) || [];
        list.push(a);
        addonsByTrxId.set(String(a.transaction_id), list);
      }

      const trxsBySaleId = new Map();
      for (const t of trxRows || []) {
        const list = trxsBySaleId.get(String(t.sale_id)) || [];
        list.push(t);
        trxsBySaleId.set(String(t.sale_id), list);
      }

      const mapped = (salesRows || []).map(s => {
        const acct = s.account_id != null ? accountsMap.get(String(s.account_id)) : null;
        const txs = trxsBySaleId.get(String(s.id)) || [];
        return {
          id: s.id,
          created_at: normalizeDbTimestamp(s.created_at) || s.created_at,
          total_amount: Number(s.total_amount),
          payment_method: s.payment_method,
          reference_number: s.reference_number,
          cash_received: s.cash_received ?? null,
          change_amount: s.change_amount ?? null,
          cashier: acct?.name ?? 'Unknown',
          cashier_account_id: acct?.account_id ?? acct?.email ?? null,
          items: txs.map(t => {
            const prod = t.product_id != null ? productsMap.get(String(t.product_id)) : null;
            const ads = addonsByTrxId.get(String(t.id)) || [];
            return {
              product_id: t.product_id ?? null,
              name: prod?.name ?? 'Unknown',
              category_id: prod?.category_id ?? null,
              quantity: t.quantity,
              price: Number(t.price),
              subtotal: Number(t.subtotal),
              size_name: t.size_name ?? null,
              addons: ads.map(a => ({
                addon_id: a.addon_id ?? null,
                name: a.addon_id != null ? (addonsMap.get(String(a.addon_id))?.name ?? 'Unknown') : 'Unknown',
                quantity: Number(a.quantity),
                unit_price: Number(a.unit_price),
                subtotal: Number(a.subtotal)
              }))
            };
          })
        };
      });

      return mapAndPersist(mapped);
    } catch {
      return [];
    }
  };

  const getBusinessDayStart = () => {
    const now = new Date();
    if (storeSettings?.is_open === false) {
      const closed = storeSettings?.closed_at ? new Date(storeSettings.closed_at) : null;
      if (closed && !Number.isNaN(closed.getTime())) return closed;
      return now;
    }
    const opened = storeSettings?.opened_at ? new Date(storeSettings.opened_at) : null;
    if (opened && !Number.isNaN(opened.getTime())) {
      const diff = now.getTime() - opened.getTime();
      if (diff >= 0 && diff <= 1000 * 60 * 60 * 36) return opened;
    }
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const refreshDailySales = async () => {
    const businessDayStart = getBusinessDayStart();

    if (!isSupabaseConfigured) {
      const total = (sales || [])
        .filter(s => new Date(s.created_at) >= businessDayStart)
        .reduce((sum, row) => sum + Number(row.total_amount), 0);
      setDailySales(total);
      return total;
    }

    const { data, error } = await supabase
      .from('sales')
      .select('total_amount')
      .gte('created_at', businessDayStart.toISOString());
    if (error) return 0;
    const total = (data || []).reduce((sum, row) => sum + Number(row.total_amount), 0);
    setDailySales(total);
    return total;
  };

  const fetchSalesReport = async ({ days = 30 } = {}) => {
    if (!isSupabaseConfigured) return [];
    const since = new Date();
    since.setDate(since.getDate() - Math.max(1, Number(days) || 30));
    const sinceStr = since.toISOString().slice(0, 10);

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('sales_report')
          .select('sale_date,total_transactions,total_revenue')
          .gte('sale_date', sinceStr)
          .order('sale_date', { ascending: false }),
        5000
      );
      if (!error) {
        const mapped = (data || []).map(r => ({
          sale_date: r.sale_date,
          total_transactions: Number(r.total_transactions || 0),
          total_revenue: Number(r.total_revenue || 0)
        }));
        setSalesReport(mapped);
        return mapped;
      }
    } catch {}

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('sales')
          .select('created_at,total_amount')
          .gte('created_at', since.toISOString()),
        5000
      );
      if (error) return [];

      const byDay = new Map();
      for (const row of data || []) {
        const dateKey = String(row?.created_at || '').slice(0, 10);
        if (!dateKey) continue;
        const existing = byDay.get(dateKey) || { sale_date: dateKey, total_transactions: 0, total_revenue: 0 };
        existing.total_transactions += 1;
        existing.total_revenue += Number(row?.total_amount || 0);
        byDay.set(dateKey, existing);
      }

      const mapped = Array.from(byDay.values())
        .sort((a, b) => String(b.sale_date).localeCompare(String(a.sale_date)));
      setSalesReport(mapped);
      return mapped;
    } catch {
      return [];
    }
  };

  const fetchAccounts = async () => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return [];
    setAccounts(data || []);
    return data || [];
  };

  const generateAccountId = async (role) => {
    const prefix = role === 'admin' ? 'ADM' : 'CSH';
    if (!isSupabaseConfigured) {
      return `${prefix}${String(Date.now()).slice(-6)}`;
    }

    for (let tries = 0; tries < 5; tries++) {
      const candidate = `${prefix}${Math.floor(100000 + Math.random() * 900000)}`;
      const { data, error } = await supabase.from('accounts').select('id').eq('account_id', candidate).limit(1);
      if (error) break;
      if (!data?.[0]) return candidate;
    }

    return `${prefix}${String(Date.now()).slice(-6)}`;
  };

  const createAccount = async ({ name, password, role, account_id }) => {
    const normalizedRole = role === 'admin' ? 'admin' : 'cashier';
    const desired = (account_id || '').toString().trim().toUpperCase();
    const accountId = desired ? desired : await generateAccountId(normalizedRole);
    const payload = {
      name: (name || '').toString().trim(),
      password: (password || '').toString(),
      role: normalizedRole,
      account_id: accountId,
      email: accountId,
      is_active: true
    };
    if (!payload.name || !payload.password) {
      addNotification('Please fill out name and password.', 'warning');
      return { ok: false };
    }

    if (!isSupabaseConfigured) {
      const exists = (accounts || []).some(a => String(a.account_id || a.email || '').toUpperCase() === accountId);
      if (exists) {
        addNotification('Account ID already exists.', 'error');
        return { ok: false };
      }
      const local = { id: `demo-${Date.now()}`, name: payload.name, role: payload.role, account_id: payload.account_id, is_active: true };
      setAccounts(prev => [local, ...prev]);
      addNotification('Account created.', 'success');
      await logActivity({ action: `Created account: ${local.account_id} (${local.role})`, area: 'user_management', entityType: 'account', entityId: local.id });
      return { ok: true, account: local };
    }

    if (desired) {
      const { data: existing, error: existingErr } = await withTimeout(
        supabase.from('accounts').select('id').eq('account_id', accountId).limit(1),
        5000
      );
      if (!existingErr && existing?.[0]) {
        addNotification('Account ID already exists.', 'error');
        return { ok: false };
      }
    }

    let { data, error } = await supabase.from('accounts').insert([payload]).select('*');
    if (error) {
      const msg = String(error.message || '').toLowerCase();
      if (msg.includes('is_active') && (msg.includes('schema cache') || msg.includes('column'))) {
        const retryPayload = { ...payload };
        delete retryPayload.is_active;
        const retry = await supabase.from('accounts').insert([retryPayload]).select('*');
        data = retry.data;
        error = retry.error;
        if (!error) {
          addNotification('Account created, but your database is missing accounts.is_active. Run the migration to enable activate/deactivate.', 'warning');
        }
      }
    }
    if (error && String(error.message || '').toLowerCase().includes('account_id')) {
      const fallback = {
        name: payload.name,
        password: payload.password,
        role: payload.role,
        email: payload.email
      };
      const retry = await supabase.from('accounts').insert([fallback]).select('*');
      data = retry.data;
      error = retry.error;
    }
    if (error) {
      addNotification(error.message || 'Failed to create account.', 'error');
      return { ok: false };
    }
    if (!data || !data[0]) {
      addNotification('Account created but not returned by server. Refreshing list...', 'warning');
      await fetchAccounts();
      await logActivity({ action: `Created account: ${payload.account_id} (${payload.role})`, area: 'user_management', entityType: 'account', entityId: payload.account_id });
      return { ok: true };
    }
    setAccounts(prev => [data[0], ...prev]);
    addNotification('Account created.', 'success');
    await logActivity({
      action: `Created account: ${(data[0].account_id || data[0].email || payload.account_id)} (${data[0].role || payload.role})`,
      area: 'user_management',
      entityType: 'account',
      entityId: data[0].id
    });
    return { ok: true, account: data[0] };
  };

  const setAccountActive = async ({ id, is_active }) => {
    if (!id) return { ok: false };
    if (String(normalizedUser?.id || '') === String(id)) return { ok: false };
    const nextActive = Boolean(is_active);
    const acct = accounts.find(a => String(a.id) === String(id));
    const label = acct?.account_id || acct?.email || id;
    const actionLabel = nextActive ? 'Activated' : 'Deactivated';

    if (!isSupabaseConfigured) {
      setAccounts(prev => (prev || []).map(a => String(a.id) === String(id) ? { ...a, is_active: nextActive } : a));
      addNotification(`Account ${nextActive ? 'activated' : 'deactivated'}.`, 'success');
      await logActivity({ action: `${actionLabel} account: ${label}`, area: 'user_management', entityType: 'account', entityId: id });
      return { ok: true };
    }

    let updated = false;
    try {
      const { error } = await withTimeout(supabase.from('accounts').update({ is_active: nextActive }).eq('id', id), 5000);
      if (error) throw error;
      updated = true;
    } catch (err) {
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('column') && msg.includes('is_active')) {
        addNotification('Database missing accounts.is_active. Run the migration to enable activate/deactivate.', 'error');
        return { ok: false };
      }
      addNotification('Failed to update account status.', 'error');
      return { ok: false };
    }

    if (updated) {
      setAccounts(prev => (prev || []).map(a => String(a.id) === String(id) ? { ...a, is_active: nextActive } : a));
      addNotification(`Account ${nextActive ? 'activated' : 'deactivated'}.`, 'success');
      await logActivity({ action: `${actionLabel} account: ${label}`, area: 'user_management', entityType: 'account', entityId: id });
      return { ok: true };
    }
    return { ok: false };
  };

  const deleteAccount = async (id) => {
    if (normalizedUser?.id === id) return { ok: false };
    const acct = accounts.find(a => a.id === id);

    if (!isSupabaseConfigured) {
      setAccounts(prev => prev.filter(a => a.id !== id));
      addNotification('Account deleted.', 'success');
      await logActivity({ action: `Deleted account: ${(acct?.account_id || acct?.email || id)}`, area: 'user_management', entityType: 'account', entityId: id });
      return { ok: true };
    }

    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) {
      addNotification(error.message || 'Failed to delete account.', 'error');
      return { ok: false };
    }
    setAccounts(prev => prev.filter(a => a.id !== id));
    addNotification('Account deleted.', 'success');
    await logActivity({ action: `Deleted account: ${(acct?.account_id || acct?.email || id)}`, area: 'user_management', entityType: 'account', entityId: id });
    return { ok: true };
  };

  const updateAccountPassword = async ({ id, password }) => {
    const nextPassword = (password || '').toString();
    if (!id || !nextPassword) {
      addNotification('Please enter a new password.', 'warning');
      return { ok: false };
    }
    const acct = accounts.find(a => a.id === id);

    if (!isSupabaseConfigured) {
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, password: nextPassword } : a));
      addNotification('Password updated.', 'success');
      await logActivity({ action: `Updated account password: ${(acct?.account_id || acct?.email || id)}`, area: 'user_management', entityType: 'account', entityId: id });
      return { ok: true };
    }

    const { error } = await supabase.from('accounts').update({ password: nextPassword }).eq('id', id);
    if (error) {
      addNotification(error.message || 'Failed to update password.', 'error');
      return { ok: false };
    }
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, password: nextPassword } : a));
    addNotification('Password updated.', 'success');
    await logActivity({ action: `Updated account password: ${(acct?.account_id || acct?.email || id)}`, area: 'user_management', entityType: 'account', entityId: id });
    return { ok: true };
  };

  // Initial Data Fetch from Supabase
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!isSupabaseConfigured) {
        addNotification('Supabase is not configured. Running in demo mode.', 'warning');
        setAccounts([
          { id: 'demo-admin', name: 'Admin User', account_id: 'ADM000001', role: 'admin', is_active: true },
          { id: 'demo-cashier', name: 'Cashier User', account_id: 'CSH000001', role: 'cashier', is_active: true }
        ]);
        if (!Array.isArray(categories) || categories.length === 0) {
          const demoCategories = [
            { id: 1, name: 'Drinks' },
            { id: 2, name: 'Snacks' },
            { id: 3, name: 'Meals' }
          ];
          setCategories(demoCategories);
          persistCategories(demoCategories);
        }
        if (!Array.isArray(products) || products.length === 0) {
          const demoProducts = [
            { id: 1, name: 'Coke', category_id: 1, categoryName: 'Drinks', price: 20, stock: 50, barcode: null },
            { id: 2, name: 'Pepsi', category_id: 1, categoryName: 'Drinks', price: 20, stock: 40, barcode: null },
            { id: 3, name: 'Chips', category_id: 2, categoryName: 'Snacks', price: 15, stock: 30, barcode: null },
            { id: 4, name: 'Burger', category_id: 3, categoryName: 'Meals', price: 50, stock: 25, barcode: null }
          ];
          setProducts(demoProducts);
          persistProducts(demoProducts);
        }
        if (!Array.isArray(ingredients) || ingredients.length === 0) {
          const demoIngredients = [
            { id: 1, name: 'Sugar', category: 'General', unit: 'g', quantity: 2000, min_stock: 500, created_at: new Date().toISOString() },
            { id: 2, name: 'Milk', category: 'Milk', unit: 'ml', quantity: 5000, min_stock: 1000, created_at: new Date().toISOString() },
            { id: 3, name: 'Pearls', category: 'Toppings', unit: 'g', quantity: 2000, min_stock: 500, created_at: new Date().toISOString() },
            { id: 4, name: 'Cups', category: 'Packaging', unit: 'pcs', quantity: 200, min_stock: 50, created_at: new Date().toISOString() },
            { id: 5, name: 'Straws', category: 'Packaging', unit: 'pcs', quantity: 300, min_stock: 100, created_at: new Date().toISOString() }
          ];
          setIngredients(demoIngredients);
          persistIngredients(demoIngredients);
        }
        if (!Array.isArray(ingredientCategories) || ingredientCategories.length === 0) {
          const next = ['General', 'Milk', 'Tea', 'Powder', 'Syrup', 'Fruit', 'Others'];
          setIngredientCategories(next);
          persistIngredientCategories(next);
        }
        if (!Array.isArray(materials) || materials.length === 0) {
          const demoMaterials = [
            { id: 1, name: 'Cups', category: 'Packaging', unit: 'pcs', quantity: 200, min_stock: 50, created_at: new Date().toISOString() },
            { id: 2, name: 'Straws', category: 'Packaging', unit: 'pcs', quantity: 300, min_stock: 100, created_at: new Date().toISOString() },
            { id: 3, name: 'Styro', category: 'Packaging', unit: 'pcs', quantity: 80, min_stock: 20, created_at: new Date().toISOString() }
          ];
          setMaterials(demoMaterials);
          persistMaterials(demoMaterials);
        }
        if (!Array.isArray(materialCategories) || materialCategories.length === 0) {
          const next = ['Packaging', 'Utensils', 'Misc'];
          setMaterialCategories(next);
          persistMaterialCategories(next);
        }
        if (!Array.isArray(addons) || addons.length === 0) {
          const demoAddons = [
            { id: 1, name: 'Pearls', category: 'Toppings', price_per_unit: 10, variable_quantity: true, created_at: new Date().toISOString() }
          ];
          setAddons(demoAddons);
          persistAddons(demoAddons);
        }
        if (!Array.isArray(addonCategories) || addonCategories.length === 0) {
          const next = ['Toppings', 'Extras', 'Others'];
          setAddonCategories(next);
          persistAddonCategories(next);
        }
        try {
          if (!localStorage.getItem('pos_store_settings')) {
            persistStoreSettings(storeSettings);
          }
        } catch {}
        if (!Array.isArray(productSizes) || productSizes.length === 0) {
          const demoSizes = [
            { id: 101, product_id: 1, name: 'Standard', price: 20, sort_order: 0, created_at: new Date().toISOString() },
            { id: 102, product_id: 2, name: 'Standard', price: 20, sort_order: 0, created_at: new Date().toISOString() },
            { id: 103, product_id: 3, name: 'Standard', price: 15, sort_order: 0, created_at: new Date().toISOString() },
            { id: 104, product_id: 4, name: 'Standard', price: 50, sort_order: 0, created_at: new Date().toISOString() }
          ];
          setProductSizes(demoSizes);
          persistProductSizes(demoSizes);
        }
        if (!Array.isArray(productSizeIngredients)) {
          setProductSizeIngredients([]);
          persistProductSizeIngredients([]);
        }
        if (!Array.isArray(productIngredients)) {
          setProductIngredients([]);
          persistProductIngredients([]);
        }
        if (!Array.isArray(productAddons)) {
          setProductAddons([]);
          persistProductAddons([]);
        }
        if (!Array.isArray(addonIngredients)) {
          setAddonIngredients([]);
          persistAddonIngredients([]);
        }
        if (!Array.isArray(sales) || sales.length === 0) {
          setSales([]);
          persistSales([]);
        }
        await refreshDailySales();
        setSalesReport([]);
        setIsDataLoaded(true);
        return;
      }

      try {
        await Promise.all([
          fetchAccounts(),
          fetchCategories(),
          fetchProducts(),
          fetchIngredients(),
          fetchMaterials(),
          fetchAddons(),
          fetchStoreSettings(),
          fetchProductSizes(),
          fetchProductSizeIngredients(),
          fetchProductIngredients(),
          fetchProductAddons(),
          fetchAddonIngredients(),
          fetchSales(),
          fetchActivityLogs(),
          refreshDailySales(),
          fetchSalesReport({ days: 30 })
        ]);
        setIsDataLoaded(true);
      } catch (err) {
        console.error('Supabase fetch error:', err);
        addNotification('Cannot reach Supabase. Check .env configuration.', 'error');
      }
    };

    fetchInitialData();
  }, []);

  const login = async ({ accountId, password }) => {
    const normalizedAccountId = (accountId || '').toString().trim().toUpperCase();
    const normalizedPassword = (password || '').toString();
    if (!normalizedAccountId || !normalizedPassword) return { success: false, message: 'Enter account ID and password' };

    const throttle = getLoginThrottleState(normalizedAccountId);
    if (throttle.lockUntil && Date.now() < throttle.lockUntil) {
      return { success: false, message: `Too many attempts. Try again in ${formatLockRemaining(throttle.lockUntil)}.` };
    }

    if (!isSupabaseConfigured) {
      const demoAdmin = normalizedAccountId === 'ADM000001' && normalizedPassword === 'admin123';
      const demoCashier = normalizedAccountId === 'CSH000001' && normalizedPassword === 'cashier123';
      if (!demoAdmin && !demoCashier) {
        const nextAttempts = (throttle.attempts || 0) + 1;
        if (nextAttempts >= LOGIN_MAX_ATTEMPTS) {
          const lockUntil = Date.now() + LOGIN_LOCK_MS;
          setLoginThrottleState(normalizedAccountId, { attempts: LOGIN_MAX_ATTEMPTS, lockUntil });
          return { success: false, message: `Too many attempts. Try again in ${formatLockRemaining(lockUntil)}.` };
        }
        setLoginThrottleState(normalizedAccountId, { attempts: nextAttempts, lockUntil: 0 });
        const remaining = Math.max(0, LOGIN_MAX_ATTEMPTS - nextAttempts);
        return { success: false, message: `Invalid account ID or password. Attempts left: ${remaining}.` };
      }
      const demoUser = demoAdmin
        ? { id: 'demo-admin', name: 'Admin User', account_id: 'ADM000001', role: 'admin' }
        : { id: 'demo-cashier', name: 'Cashier User', account_id: 'CSH000001', role: 'cashier' };
      setUser(demoUser);
      localStorage.setItem('pos_user', JSON.stringify(demoUser));
      clearLoginThrottleState(normalizedAccountId);
      await logActivity({ actor: demoUser, action: 'Account login', area: 'auth' });
      return { success: true, role: demoUser.role };
    }

    try {
      let { data, error } = await supabase
        .from('accounts')
        .select('id,name,role,account_id,email,is_active')
        .eq('account_id', normalizedAccountId)
        .eq('password', normalizedPassword)
        .limit(1);

      const errMsg = String(error?.message || '').toLowerCase();
      if (error && errMsg.includes('column') && errMsg.includes('is_active')) {
        const retry = await supabase
          .from('accounts')
          .select('id,name,role,account_id,email')
          .eq('account_id', normalizedAccountId)
          .eq('password', normalizedPassword)
          .limit(1);
        data = retry.data;
        error = retry.error;
      } else if (error && errMsg.includes('account_id')) {
        const retry = await supabase
          .from('accounts')
          .select('id,name,role,email,is_active')
          .eq('email', normalizedAccountId)
          .eq('password', normalizedPassword)
          .limit(1);
        data = retry.data;
        error = retry.error;
      }
      if (error) throw error;
      const found = data && data[0];
      if (!found) {
        const nextAttempts = (throttle.attempts || 0) + 1;
        if (nextAttempts >= LOGIN_MAX_ATTEMPTS) {
          const lockUntil = Date.now() + LOGIN_LOCK_MS;
          setLoginThrottleState(normalizedAccountId, { attempts: LOGIN_MAX_ATTEMPTS, lockUntil });
          return { success: false, message: `Too many attempts. Try again in ${formatLockRemaining(lockUntil)}.` };
        }
        setLoginThrottleState(normalizedAccountId, { attempts: nextAttempts, lockUntil: 0 });
        const remaining = Math.max(0, LOGIN_MAX_ATTEMPTS - nextAttempts);
        return { success: false, message: `Invalid account ID or password. Attempts left: ${remaining}.` };
      }
      if (Object.prototype.hasOwnProperty.call(found, 'is_active') && found.is_active === false) {
        return { success: false, message: 'Account is deactivated. Please contact the admin.' };
      }
      setUser(found);
      localStorage.setItem('pos_user', JSON.stringify(found));
      clearLoginThrottleState(normalizedAccountId);
      await logActivity({ actor: found, action: 'Account login', area: 'auth' });
      return { success: true, role: found.role };
    } catch (err) {
      return { success: false, message: 'Cannot reach server. Check Supabase .env settings.' };
    }
  };

  const verifyCredentials = async ({ accountId, password }) => {
    const normalizedAccountId = (accountId || '').toString().trim().toUpperCase();
    const normalizedPassword = (password || '').toString();
    if (!normalizedAccountId || !normalizedPassword) return { ok: false };

    if (!isSupabaseConfigured) {
      const demoAdmin = normalizedAccountId === 'ADM000001' && normalizedPassword === 'admin123';
      const demoCashier = normalizedAccountId === 'CSH000001' && normalizedPassword === 'cashier123';
      const ok = demoAdmin || demoCashier;
      if (!ok) return { ok: false };
      if (!normalizedUser) return { ok: false };
      const currentId = String(normalizedUser.account_id || normalizedUser.email || '').toUpperCase();
      if (currentId !== normalizedAccountId) return { ok: false };
      return { ok: true };
    }

    try {
      let { data, error } = await supabase
        .from('accounts')
        .select('id,account_id,email,is_active')
        .eq('account_id', normalizedAccountId)
        .eq('password', normalizedPassword)
        .limit(1);

      const errMsg = String(error?.message || '').toLowerCase();
      if (error && errMsg.includes('column') && errMsg.includes('is_active')) {
        const retry = await supabase
          .from('accounts')
          .select('id,account_id,email')
          .eq('account_id', normalizedAccountId)
          .eq('password', normalizedPassword)
          .limit(1);
        data = retry.data;
        error = retry.error;
      } else if (error && errMsg.includes('account_id')) {
        const retry = await supabase
          .from('accounts')
          .select('id,email,is_active')
          .eq('email', normalizedAccountId)
          .eq('password', normalizedPassword)
          .limit(1);
        data = retry.data;
        error = retry.error;
      }
      if (error) return { ok: false };
      const found = data?.[0];
      if (!found) return { ok: false };
      if (Object.prototype.hasOwnProperty.call(found, 'is_active') && found.is_active === false) return { ok: false };
      if (!normalizedUser) return { ok: false };
      if (String(found.id) !== String(normalizedUser.id)) return { ok: false };
      return { ok: true };
    } catch {
      return { ok: false };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pos_user');
    clearCart();
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'cashier') {
      const cashierPermissions = ['pos', 'inventory_view', 'transactions_view'];
      return cashierPermissions.includes(permission);
    }
    return false;
  };

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return removeFromCart(productId);
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const updateCartItem = (productId, updates) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, ...(updates || {}) } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const createCategory = async (name) => {
    const trimmed = (name || '').toString().trim();
    if (!trimmed) return { ok: false };
    if (!isSupabaseConfigured) {
      const local = { id: Date.now(), name: trimmed, _localUpdatedAt: Date.now() };
      setCategories(prev => {
        const next = [local, ...(prev || [])];
        persistCategories(next);
        return next;
      });
      addNotification('Category saved.', 'success');
      await logActivity({ action: `Created category: ${trimmed}`, area: 'product_management', entityType: 'category', entityId: local.id });
      return { ok: true, category: local };
    }
    const { data, error } = await withTimeout(supabase.from('categories').insert([{ name: trimmed }]).select(), 5000);
    if (error || !data?.[0]) {
      const local = { id: `local-${Date.now()}`, name: trimmed, _localUpdatedAt: Date.now() };
      setCategories(prev => {
        const next = [local, ...(prev || [])];
        persistCategories(next);
        return next;
      });
      addNotification('Category saved locally (database not available).', 'warning');
      await logActivity({ action: `Created category: ${trimmed}`, area: 'product_management', entityType: 'category', entityId: local.id });
      return { ok: true, category: local };
    }
    setCategories(prev => {
      const next = [data[0], ...(prev || [])];
      persistCategories(next);
      return next;
    });
    addNotification('Category saved.', 'success');
    await logActivity({ action: `Created category: ${trimmed}`, area: 'product_management', entityType: 'category', entityId: data[0].id });
    return { ok: true, category: data[0] };
  };

  const deleteCategory = async (id) => {
    const name = categories.find(c => c.id === id)?.name ?? null;
    if (!isSupabaseConfigured) {
      setCategories(prev => {
        const next = (prev || []).filter(c => c.id !== id);
        persistCategories(next);
        return next;
      });
      addNotification('Category deleted.', 'success');
      await logActivity({ action: `Deleted category: ${name || id}`, area: 'product_management', entityType: 'category', entityId: id });
      return { ok: true };
    }
    const { error } = await withTimeout(supabase.from('categories').delete().eq('id', id), 5000);
    if (error) {
      setCategories(prev => {
        const next = (prev || []).filter(c => !sameId(c.id, id));
        persistCategories(next);
        return next;
      });
      addNotification('Category removed locally (database not available).', 'warning');
      await logActivity({ action: `Deleted category: ${name || id}`, area: 'product_management', entityType: 'category', entityId: id });
      return { ok: true };
    }
    setCategories(prev => {
      const next = (prev || []).filter(c => c.id !== id);
      persistCategories(next);
      return next;
    });
    addNotification('Category deleted.', 'success');
    await logActivity({ action: `Deleted category: ${name || id}`, area: 'product_management', entityType: 'category', entityId: id });
    return { ok: true };
  };

  const createProduct = async (payload) => {
    const insertPayload = {
      name: payload.name,
      category_id: payload.category_id ?? null,
      price: Number(payload.price),
      stock: Number(payload.stock || 0),
      barcode: payload.barcode || null
    };
    if (!isSupabaseConfigured) {
      const local = {
        ...insertPayload,
        id: Date.now(),
        categoryName: categories.find(c => String(c.id) === String(insertPayload.category_id))?.name ?? null,
        _localUpdatedAt: Date.now()
      };
      setProducts(prev => {
        const next = [local, ...(prev || [])];
        persistProducts(next);
        return next;
      });
      addNotification('Product saved.', 'success');
      await logActivity({ action: `Created product: ${local.name}`, area: 'product_management', entityType: 'product', entityId: local.id });
      return { ok: true, product: local };
    }
    let { data, error } = await withTimeout(supabase.from('products').insert([insertPayload]).select(), 5000);
    if (error) {
      const msg = String(error.message || '').toLowerCase();
      let fallback = { ...insertPayload };
      if (msg.includes('barcode')) delete fallback.barcode;
      if (msg.includes('stock')) delete fallback.stock;
      if (msg.includes('price')) delete fallback.price;
      if (fallback !== insertPayload) {
        const retry = await withTimeout(supabase.from('products').insert([fallback]).select(), 5000);
        data = retry.data;
        error = retry.error;
      }
    }
    if (error || !data?.[0]) {
      const local = {
        ...insertPayload,
        id: `local-${Date.now()}`,
        categoryName: categories.find(c => String(c.id) === String(insertPayload.category_id))?.name ?? null,
        _localUpdatedAt: Date.now()
      };
      setProducts(prev => {
        const next = [local, ...(prev || [])];
        persistProducts(next);
        return next;
      });
      addNotification('Product saved locally (database not available).', 'warning');
      await logActivity({ action: `Created product: ${local.name}`, area: 'product_management', entityType: 'product', entityId: local.id });
      return { ok: true, product: local };
    }
    const created = {
      ...data[0],
      categoryName: categories.find(c => String(c.id) === String(data[0].category_id))?.name ?? null
    };
    setProducts(prev => {
      const next = [created, ...(prev || [])];
      persistProducts(next);
      return next;
    });
    addNotification('Product saved.', 'success');
    await logActivity({ action: `Created product: ${created.name}`, area: 'product_management', entityType: 'product', entityId: created.id });
    return { ok: true, product: created };
  };

  const updateProduct = async (id, updates) => {
    const name = products.find(p => String(p.id) === String(id))?.name ?? null;
    const payload = { ...updates };
    if (payload.price !== undefined) payload.price = Number(payload.price);
    if (payload.stock !== undefined) payload.stock = Number(payload.stock);
    if (!isSupabaseConfigured) {
      setProducts(prev => {
        const ts = Date.now();
        const next = (prev || []).map(p => sameId(p.id, id) ? { ...p, ...payload, _localUpdatedAt: ts } : p);
        persistProducts(next);
        return next;
      });
      addNotification('Product updated.', 'success');
      await logActivity({ action: `Updated product: ${name || id}`, area: 'product_management', entityType: 'product', entityId: id });
      return { ok: true };
    }
    const applyLocalUpdate = (updatesToApply) => {
      const ts = Date.now();
      const nextCategoryName =
        updatesToApply?.category_id !== undefined
          ? (categories || []).find(c => String(c.id) === String(updatesToApply.category_id))?.name ?? null
          : undefined;
      setProducts(prev => {
        const next = (prev || []).map(p => {
          if (String(p.id) !== String(id)) return p;
          const merged = { ...p, ...updatesToApply, _localUpdatedAt: ts };
          if (nextCategoryName !== undefined) merged.categoryName = nextCategoryName;
          return merged;
        });
        persistProducts(next);
        return next;
      });
    };

    const tryUpdate = async (updatesToApply) => {
      const { data, error } = await withTimeout(
        supabase.from('products').update(updatesToApply).eq('id', id).select('id').limit(1),
        5000
      );
      if (error) return { ok: false, error };
      if (!data?.[0]) return { ok: false, error: { message: 'No rows updated (permission denied or product not found).' } };
      applyLocalUpdate(updatesToApply);
      await logActivity({ action: `Updated product: ${name || id}`, area: 'product_management', entityType: 'product', entityId: id });
      return { ok: true };
    };

    let res = await tryUpdate(payload);
    if (!res.ok) {
      const msg = String(res.error?.message || '');
      const match = msg.match(/column \"([^\"]+)\"/i) || msg.match(/column '([^']+)'/i);
      if (match?.[1]) {
        const key = String(match[1]);
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
          const retryPayload = { ...payload };
          delete retryPayload[key];
          res = await tryUpdate(retryPayload);
          if (res.ok) return { ok: true };
        }
      }
      applyLocalUpdate(payload);
      addNotification('Product updated locally (database not available).', 'warning');
      await logActivity({ action: `Updated product: ${name || id}`, area: 'product_management', entityType: 'product', entityId: id });
      return { ok: true };
    }
    addNotification('Product updated.', 'success');
    return { ok: true };
  };

  const deleteProduct = async (id) => {
    const name = products.find(p => sameId(p.id, id))?.name ?? null;
    if (!isSupabaseConfigured) {
      setProducts(prev => {
        const next = (prev || []).filter(p => !sameId(p.id, id));
        persistProducts(next);
        return next;
      });
      addNotification('Product deleted.', 'success');
      await logActivity({ action: `Deleted product: ${name || id}`, area: 'product_management', entityType: 'product', entityId: id });
      return { ok: true };
    }
    const { error } = await withTimeout(supabase.from('products').delete().eq('id', id), 5000);
    if (error) {
      setProducts(prev => {
        const next = (prev || []).filter(p => !sameId(p.id, id));
        persistProducts(next);
        return next;
      });
      addNotification('Product removed locally (database not available).', 'warning');
      await logActivity({ action: `Deleted product: ${name || id}`, area: 'product_management', entityType: 'product', entityId: id });
      return { ok: true };
    }
    setProducts(prev => {
      const next = (prev || []).filter(p => !sameId(p.id, id));
      persistProducts(next);
      return next;
    });
    addNotification('Product deleted.', 'success');
    await logActivity({ action: `Deleted product: ${name || id}`, area: 'product_management', entityType: 'product', entityId: id });
    return { ok: true };
  };

  const createIngredient = async (payload) => {
    const insertPayload = {
      name: (payload.name || '').toString().trim(),
      category: (payload.category || 'General').toString().trim(),
      unit: (payload.unit || 'g').toString(),
      quantity: Number(payload.quantity || 0),
      min_stock: Number(payload.min_stock || 0)
    };
    if (!insertPayload.name) return { ok: false };
    ensureCategory(isMaterialUnit(insertPayload.unit) ? 'material' : 'ingredient', insertPayload.category);

    if (!isSupabaseConfigured) {
      const local = { ...insertPayload, id: Date.now(), created_at: new Date().toISOString() };
      setIngredients(prev => {
        const next = [local, ...(prev || [])];
        persistIngredients(next);
        return next;
      });
      addNotification('Ingredient saved.', 'success');
      notifyLowStockIngredients([local]);
      await logActivity({ action: `Created ingredient: ${local.name}`, area: 'inventory', entityType: 'ingredient', entityId: local.id });
      return { ok: true, ingredient: local };
    }

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('ingredients')
          .insert([insertPayload])
          .select('id,name,category,unit,quantity,min_stock,created_at'),
        5000
      );
      if (error || !data?.[0]) throw error || new Error('create failed');
      const created = {
        ...data[0],
        category: data[0].category ?? insertPayload.category ?? null,
        quantity: Number(data[0].quantity),
        min_stock: Number(data[0].min_stock)
      };
      setIngredients(prev => {
        const next = [created, ...(prev || [])];
        persistIngredients(next);
        return next;
      });
      addNotification('Ingredient saved.', 'success');
      notifyLowStockIngredients([created]);
      await logActivity({ action: `Created ingredient: ${created.name}`, area: 'inventory', entityType: 'ingredient', entityId: created.id });
      return { ok: true, ingredient: created };
    } catch {
      const local = { ...insertPayload, id: Date.now(), created_at: new Date().toISOString() };
      setIngredients(prev => {
        const next = [local, ...(prev || [])];
        persistIngredients(next);
        return next;
      });
      addNotification('Ingredient saved locally (database not available).', 'warning');
      notifyLowStockIngredients([local]);
      await logActivity({ action: `Created ingredient: ${local.name}`, area: 'inventory', entityType: 'ingredient', entityId: local.id });
      return { ok: true, ingredient: local };
    }
  };

  const updateIngredient = async (id, updates) => {
    const name = ingredients.find(i => sameId(i.id, id))?.name ?? null;
    const existing = ingredients.find(i => sameId(i.id, id)) || null;
    const payload = { ...updates };
    if (payload.category !== undefined) payload.category = (payload.category || '').toString();
    if (payload.quantity !== undefined) payload.quantity = Number(payload.quantity);
    if (payload.min_stock !== undefined) payload.min_stock = Number(payload.min_stock);
    if (payload.category !== undefined) {
      const effectiveUnit = payload.unit != null ? payload.unit : existing?.unit;
      ensureCategory(isMaterialUnit(effectiveUnit) ? 'material' : 'ingredient', payload.category);
    }

    if (!isSupabaseConfigured) {
      setIngredients(prev => {
        const next = (prev || []).map(i => sameId(i.id, id) ? { ...i, ...payload, _localUpdatedAt: Date.now() } : i);
        persistIngredients(next);
        return next;
      });
      addNotification('Ingredient updated.', 'success');
      await logActivity({ action: `Updated ingredient: ${name || id}`, area: 'inventory', entityType: 'ingredient', entityId: id });
      return { ok: true };
    }

    try {
      const { error } = await withTimeout(supabase.from('ingredients').update(payload).eq('id', id), 5000);
      if (error) throw error;
      setIngredients(prev => {
        const next = (prev || []).map(i => sameId(i.id, id) ? { ...i, ...payload, _localUpdatedAt: Date.now() } : i);
        persistIngredients(next);
        return next;
      });
      addNotification('Ingredient updated.', 'success');
      await logActivity({ action: `Updated ingredient: ${name || id}`, area: 'inventory', entityType: 'ingredient', entityId: id });
      return { ok: true };
    } catch {
      setIngredients(prev => {
        const next = (prev || []).map(i => sameId(i.id, id) ? { ...i, ...payload, _localUpdatedAt: Date.now() } : i);
        persistIngredients(next);
        return next;
      });
      addNotification('Ingredient updated locally (database not available).', 'warning');
      await logActivity({ action: `Updated ingredient: ${name || id}`, area: 'inventory', entityType: 'ingredient', entityId: id });
      return { ok: true };
    }
  };

  const deleteIngredient = async (id) => {
    const name = ingredients.find(i => sameId(i.id, id))?.name ?? null;
    if (!isSupabaseConfigured) {
      setIngredients(prev => {
        const next = (prev || []).filter(i => !sameId(i.id, id));
        persistIngredients(next);
        return next;
      });
      setProductIngredients(prev => prev.filter(r => r.ingredient_id !== id));
      setAddonIngredients(prev => prev.filter(r => r.ingredient_id !== id));
      addNotification('Ingredient deleted.', 'success');
      await logActivity({ action: `Deleted ingredient: ${name || id}`, area: 'inventory', entityType: 'ingredient', entityId: id });
      return { ok: true };
    }
    try {
      const { error } = await withTimeout(supabase.from('ingredients').delete().eq('id', id), 5000);
      if (error) throw error;
    } catch {
      addNotification('Ingredient deleted locally (database not available).', 'warning');
    }
    setIngredients(prev => {
      const next = (prev || []).filter(i => !sameId(i.id, id));
      persistIngredients(next);
      return next;
    });
    setProductIngredients(prev => prev.filter(r => r.ingredient_id !== id));
    setAddonIngredients(prev => prev.filter(r => r.ingredient_id !== id));
    addNotification('Ingredient deleted.', 'success');
    await logActivity({ action: `Deleted ingredient: ${name || id}`, area: 'inventory', entityType: 'ingredient', entityId: id });
    return { ok: true };
  };

  const adjustIngredientStock = async ({ ingredientId, change, reason }) => {
    const ing = ingredients.find(x => sameId(x.id, ingredientId));
    if (!ing) return { ok: false };
    const nextQty = Number(ing.quantity) + Number(change);
    if (nextQty < 0) return { ok: false };

    if (!isSupabaseConfigured) {
      const updated = { ...ing, quantity: nextQty, _localUpdatedAt: Date.now() };
      setIngredients(prev => {
        const next = (prev || []).map(x => sameId(x.id, ingredientId) ? updated : x);
        persistIngredients(next);
        return next;
      });
      notifyLowStockIngredients([updated]);
      if (String(reason || '').toLowerCase() !== 'sale') {
        const unit = ing.unit ? ` ${ing.unit}` : '';
        const sign = Number(change) >= 0 ? '+' : '';
        await logActivity({ action: `Adjusted ingredient stock: ${ing.name} (${sign}${Number(change)}${unit})`, area: 'inventory', entityType: 'ingredient', entityId: ingredientId });
      }
      return { ok: true };
    }

    try {
      const { error: updErr } = await withTimeout(supabase.from('ingredients').update({ quantity: nextQty }).eq('id', ingredientId), 5000);
      if (updErr) throw updErr;
      const { error: logErr } = await withTimeout(
        supabase.from('ingredient_logs').insert([{ ingredient_id: ingredientId, change: Number(change), reason }]),
        5000
      );
      if (logErr) throw logErr;
    } catch {
      addNotification('Ingredient stock adjusted locally (database not available).', 'warning');
    }
    const updated = { ...ing, quantity: nextQty, _localUpdatedAt: Date.now() };
    setIngredients(prev => {
      const next = (prev || []).map(x => sameId(x.id, ingredientId) ? updated : x);
      persistIngredients(next);
      return next;
    });
    notifyLowStockIngredients([updated]);
    if (String(reason || '').toLowerCase() !== 'sale') {
      const unit = ing.unit ? ` ${ing.unit}` : '';
      const sign = Number(change) >= 0 ? '+' : '';
      await logActivity({ action: `Adjusted ingredient stock: ${ing.name} (${sign}${Number(change)}${unit})`, area: 'inventory', entityType: 'ingredient', entityId: ingredientId });
    }
    return { ok: true };
  };

  const createMaterial = async (payload) => {
    const res = await createIngredient({
      ...payload,
      unit: payload?.unit ? payload.unit : 'pcs'
    });
    if (res?.ok && res.ingredient) return { ...res, material: res.ingredient };
    return res;
  };

  const updateMaterial = async (id, updates) => {
    return await updateIngredient(id, updates);
  };

  const deleteMaterial = async (id) => {
    return await deleteIngredient(id);
  };

  const adjustMaterialStock = async ({ materialId, change, reason }) => {
    return await adjustIngredientStock({ ingredientId: materialId, change, reason });
  };

  const createAddon = async (payload) => {
    const insertPayload = {
      name: (payload.name || '').toString().trim(),
      category: (payload.category || 'General').toString().trim(),
      price_per_unit: Number(payload.price_per_unit || 0),
      variable_quantity: Boolean(payload.variable_quantity)
    };
    if (!insertPayload.name) return { ok: false };
    ensureCategory('addon', insertPayload.category);

    if (!isSupabaseConfigured) {
      const local = { ...insertPayload, id: Date.now(), created_at: new Date().toISOString() };
      setAddons(prev => {
        const next = [local, ...(prev || [])];
        persistAddons(next);
        return next;
      });
      addNotification('Add-on saved.', 'success');
      await logActivity({ action: `Created add-on: ${local.name}`, area: 'inventory', entityType: 'addon', entityId: local.id });
      return { ok: true, addon: local };
    }

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('addons')
          .insert([insertPayload])
          .select('id,name,category,price_per_unit,variable_quantity,created_at'),
        5000
      );
      if (error || !data?.[0]) throw error || new Error('create failed');
      const created = {
        ...data[0],
        category: data[0].category ?? insertPayload.category ?? null,
        price_per_unit: Number(data[0].price_per_unit),
        variable_quantity: Boolean(data[0].variable_quantity)
      };
      setAddons(prev => {
        const next = [created, ...(prev || [])];
        persistAddons(next);
        return next;
      });
      addNotification('Add-on saved.', 'success');
      await logActivity({ action: `Created add-on: ${created.name}`, area: 'inventory', entityType: 'addon', entityId: created.id });
      return { ok: true, addon: created };
    } catch {
      const local = { ...insertPayload, id: Date.now(), created_at: new Date().toISOString() };
      setAddons(prev => {
        const next = [local, ...(prev || [])];
        persistAddons(next);
        return next;
      });
      addNotification('Add-on saved locally (database not available).', 'warning');
      await logActivity({ action: `Created add-on: ${local.name}`, area: 'inventory', entityType: 'addon', entityId: local.id });
      return { ok: true, addon: local };
    }
  };

  const updateAddon = async (id, updates) => {
    const name = addons.find(a => sameId(a.id, id))?.name ?? null;
    const payload = { ...updates };
    if (payload.category !== undefined) payload.category = (payload.category || '').toString();
    if (payload.price_per_unit !== undefined) payload.price_per_unit = Number(payload.price_per_unit);
    if (payload.variable_quantity !== undefined) payload.variable_quantity = Boolean(payload.variable_quantity);
    if (payload.category) ensureCategory('addon', payload.category);

    if (!isSupabaseConfigured) {
      setAddons(prev => {
        const next = (prev || []).map(a => sameId(a.id, id) ? { ...a, ...payload, _localUpdatedAt: Date.now() } : a);
        persistAddons(next);
        return next;
      });
      addNotification('Add-on updated.', 'success');
      await logActivity({ action: `Updated add-on: ${name || id}`, area: 'inventory', entityType: 'addon', entityId: id });
      return { ok: true };
    }

    try {
      const { error } = await withTimeout(supabase.from('addons').update(payload).eq('id', id), 5000);
      if (error) throw error;
      setAddons(prev => {
        const next = (prev || []).map(a => sameId(a.id, id) ? { ...a, ...payload, _localUpdatedAt: Date.now() } : a);
        persistAddons(next);
        return next;
      });
      addNotification('Add-on updated.', 'success');
      await logActivity({ action: `Updated add-on: ${name || id}`, area: 'inventory', entityType: 'addon', entityId: id });
      return { ok: true };
    } catch {
      setAddons(prev => {
        const next = (prev || []).map(a => sameId(a.id, id) ? { ...a, ...payload, _localUpdatedAt: Date.now() } : a);
        persistAddons(next);
        return next;
      });
      addNotification('Add-on updated locally (database not available).', 'warning');
      await logActivity({ action: `Updated add-on: ${name || id}`, area: 'inventory', entityType: 'addon', entityId: id });
      return { ok: true };
    }
  };

  const deleteAddon = async (id) => {
    const name = addons.find(a => sameId(a.id, id))?.name ?? null;
    if (!isSupabaseConfigured) {
      setAddons(prev => {
        const next = (prev || []).filter(a => !sameId(a.id, id));
        persistAddons(next);
        return next;
      });
      setProductAddons(prev => prev.filter(r => r.addon_id !== id));
      setAddonIngredients(prev => prev.filter(r => r.addon_id !== id));
      addNotification('Add-on deleted.', 'success');
      await logActivity({ action: `Deleted add-on: ${name || id}`, area: 'inventory', entityType: 'addon', entityId: id });
      return { ok: true };
    }
    try {
      const { error } = await withTimeout(supabase.from('addons').delete().eq('id', id), 5000);
      if (error) throw error;
    } catch {
      addNotification('Add-on deleted locally (database not available).', 'warning');
    }
    setAddons(prev => {
      const next = (prev || []).filter(a => !sameId(a.id, id));
      persistAddons(next);
      return next;
    });
    setProductAddons(prev => prev.filter(r => r.addon_id !== id));
    setAddonIngredients(prev => prev.filter(r => r.addon_id !== id));
    addNotification('Add-on deleted.', 'success');
    await logActivity({ action: `Deleted add-on: ${name || id}`, area: 'inventory', entityType: 'addon', entityId: id });
    return { ok: true };
  };

  const setProductSizesWithBOM = async (productId, sizes) => {
    const productName = products.find(p => String(p.id) === String(productId))?.name ?? null;
    const normalized = (sizes || [])
      .map((s, idx) => ({
        name: (s.name || '').toString().trim(),
        price: Number(s.price || 0),
        sort_order: idx,
        bomLines: s.bomLines || []
      }))
      .filter(s => s.name);

    if (!isSupabaseConfigured) {
      const base = Date.now();
      const localSizes = normalized.map((s, i) => ({
        id: base + i,
        product_id: productId,
        name: s.name,
        price: s.price,
        sort_order: s.sort_order,
        created_at: new Date().toISOString()
      }));
      const localIngredients = localSizes.flatMap((sz, i) => {
        const lines = normalized[i].bomLines || [];
        return lines
          .filter(l => l.ingredient_id && Number(l.quantity) > 0)
          .map(l => ({
            product_size_id: sz.id,
            ingredient_id: Number(l.ingredient_id),
            quantity: Number(l.quantity)
          }));
      });
      setProductSizes(prev => {
        const next = [...(prev || []).filter(s => String(s.product_id) !== String(productId)), ...localSizes];
        persistProductSizes(next);
        return next;
      });
      setProductSizeIngredients(prev => {
        const next = [
          ...(prev || []).filter(r => !localSizes.some(sz => String(sz.id) === String(r.product_size_id))),
          ...localIngredients
        ];
        persistProductSizeIngredients(next);
        return next;
      });
      addNotification('BOM saved.', 'success');
      await logActivity({ action: `Updated product sizes/BOM: ${productName || productId}`, area: 'product_management', entityType: 'product', entityId: productId });
      return { ok: true };
    }

    try {
      const { error: delErr } = await withTimeout(supabase.from('product_sizes').delete().eq('product_id', productId), 5000);
      if (delErr) throw delErr;

      if (normalized.length === 0) {
        await fetchProductSizes();
        await fetchProductSizeIngredients();
        await logActivity({ action: `Updated product sizes/BOM: ${productName || productId}`, area: 'product_management', entityType: 'product', entityId: productId });
        return { ok: true };
      }

      const { data: sizeData, error: sizeErr } = await withTimeout(
        supabase
          .from('product_sizes')
          .insert(normalized.map(s => ({
            product_id: productId,
            name: s.name,
            price: s.price,
            sort_order: s.sort_order
          })))
          .select('id,product_id,name,price,sort_order,created_at'),
        5000
      );
      if (sizeErr || !sizeData) throw sizeErr || new Error('Failed to save sizes');

      const ingredientRows = (sizeData || []).flatMap((sz, i) => {
        const lines = normalized[i]?.bomLines || [];
        return lines
          .filter(l => l.ingredient_id && Number(l.quantity) > 0)
          .map(l => ({
            product_size_id: sz.id,
          ingredient_id: Number(l.ingredient_id),
            quantity: Number(l.quantity)
          }));
      });

      if (ingredientRows.length > 0) {
        const { error: ingErr } = await withTimeout(supabase.from('product_size_ingredients').insert(ingredientRows), 5000);
        if (ingErr) throw ingErr;
      }

      await fetchProductSizes();
      await fetchProductSizeIngredients();
      addNotification('BOM saved.', 'success');
      await logActivity({ action: `Updated product sizes/BOM: ${productName || productId}`, area: 'product_management', entityType: 'product', entityId: productId });
      return { ok: true };
    } catch (err) {
      const base = Date.now();
      const localSizes = normalized.map((s, i) => ({
        id: base + i,
        product_id: productId,
        name: s.name,
        price: s.price,
        sort_order: s.sort_order,
        created_at: new Date().toISOString()
      }));
      const localIngredients = localSizes.flatMap((sz, i) => {
        const lines = normalized[i].bomLines || [];
        return lines
          .filter(l => l.ingredient_id && Number(l.quantity) > 0)
          .map(l => ({
            product_size_id: sz.id,
            ingredient_id: String(l.ingredient_id),
            quantity: Number(l.quantity)
          }));
      });
      setProductSizes(prev => {
        const next = [...(prev || []).filter(s => String(s.product_id) !== String(productId)), ...localSizes];
        persistProductSizes(next);
        return next;
      });
      setProductSizeIngredients(prev => {
        const next = [
          ...(prev || []).filter(r => !localSizes.some(sz => String(sz.id) === String(r.product_size_id))),
          ...localIngredients
        ];
        persistProductSizeIngredients(next);
        return next;
      });
      addNotification(`BOM saved locally (cannot save to database: ${summarizeDbError(err)}).`, 'warning');
      await logActivity({ action: `Updated product sizes/BOM: ${productName || productId}`, area: 'product_management', entityType: 'product', entityId: productId });
      return { ok: true, localOnly: true };
    }
  };

  const setProductBOM = async (productId, lines) => {
    const rows = (lines || [])
      .filter(l => l.ingredient_id && Number(l.quantity) > 0)
      .map(l => ({
        product_id: productId,
        ingredient_id: Number(l.ingredient_id),
        quantity: Number(l.quantity)
      }));

    if (!isSupabaseConfigured) {
      setProductIngredients(prev => {
        const next = [...(prev || []).filter(r => String(r.product_id) !== String(productId)), ...rows];
        persistProductIngredients(next);
        return next;
      });
      addNotification('BOM saved.', 'success');
      return { ok: true };
    }

    try {
      const { error: delErr } = await withTimeout(supabase.from('product_ingredients').delete().eq('product_id', productId), 5000);
      if (delErr) throw delErr;
      if (rows.length > 0) {
        const { error: insErr } = await withTimeout(supabase.from('product_ingredients').insert(rows), 5000);
        if (insErr) throw insErr;
      }
      await fetchProductIngredients();
      addNotification('BOM saved.', 'success');
      return { ok: true };
    } catch (err) {
      setProductIngredients(prev => {
        const next = [...(prev || []).filter(r => String(r.product_id) !== String(productId)), ...rows];
        persistProductIngredients(next);
        return next;
      });
      addNotification(`BOM saved locally (cannot save to database: ${summarizeDbError(err)}).`, 'warning');
      return { ok: true, localOnly: true };
    }
  };

  const setAddonBOM = async (addonId, lines) => {
    const addonName = addons.find(a => String(a.id) === String(addonId))?.name ?? null;
    const rows = (lines || [])
      .filter(l => l.ingredient_id && Number(l.quantity) > 0)
      .map(l => ({
        addon_id: addonId,
        ingredient_id: Number(l.ingredient_id),
        quantity: Number(l.quantity)
      }));

    if (!isSupabaseConfigured) {
      setAddonIngredients(prev => {
        const next = [...(prev || []).filter(r => String(r.addon_id) !== String(addonId)), ...rows];
        persistAddonIngredients(next);
        return next;
      });
      addNotification('BOM saved.', 'success');
      await logActivity({ action: `Updated add-on BOM: ${addonName || addonId}`, area: 'inventory', entityType: 'addon', entityId: addonId });
      return { ok: true };
    }
    try {
      const { error: delErr } = await withTimeout(supabase.from('addon_ingredients').delete().eq('addon_id', addonId), 5000);
      if (delErr) throw delErr;
      if (rows.length > 0) {
        const { error: insErr } = await withTimeout(supabase.from('addon_ingredients').insert(rows), 5000);
        if (insErr) throw insErr;
      }
      await fetchAddonIngredients();
      addNotification('BOM saved.', 'success');
      await logActivity({ action: `Updated add-on BOM: ${addonName || addonId}`, area: 'inventory', entityType: 'addon', entityId: addonId });
      return { ok: true };
    } catch (err) {
      setAddonIngredients(prev => {
        const next = [...(prev || []).filter(r => String(r.addon_id) !== String(addonId)), ...rows];
        persistAddonIngredients(next);
        return next;
      });
      addNotification(`BOM saved locally (cannot save to database: ${summarizeDbError(err)}).`, 'warning');
      await logActivity({ action: `Updated add-on BOM: ${addonName || addonId}`, area: 'inventory', entityType: 'addon', entityId: addonId });
      return { ok: true, localOnly: true };
    }
  };

  const setProductAddonsForProduct = async (productId, addonIds) => {
    const productName = products.find(p => String(p.id) === String(productId))?.name ?? null;
    const ids = (addonIds || []).map(x => String(x)).filter(Boolean);
    const rows = ids.map(aid => ({ product_id: productId, addon_id: aid }));

    if (!isSupabaseConfigured) {
      setProductAddons(prev => {
        const next = [...(prev || []).filter(r => String(r.product_id) !== String(productId)), ...rows];
        persistProductAddons(next);
        return next;
      });
      addNotification('Product add-ons saved.', 'success');
      await logActivity({ action: `Updated product add-ons: ${productName || productId}`, area: 'product_management', entityType: 'product', entityId: productId });
      return { ok: true };
    }

    try {
      const { error: delErr } = await withTimeout(supabase.from('product_addons').delete().eq('product_id', productId), 5000);
      if (delErr) throw delErr;
      if (rows.length > 0) {
        const { error: insErr } = await withTimeout(supabase.from('product_addons').insert(rows), 5000);
        if (insErr) throw insErr;
      }
      await fetchProductAddons();
      addNotification('Product add-ons saved.', 'success');
      await logActivity({ action: `Updated product add-ons: ${productName || productId}`, area: 'product_management', entityType: 'product', entityId: productId });
      return { ok: true };
    } catch {
      setProductAddons(prev => {
        const next = [...(prev || []).filter(r => String(r.product_id) !== String(productId)), ...rows];
        persistProductAddons(next);
        return next;
      });
      addNotification('Product add-ons saved locally (database not available).', 'warning');
      await logActivity({ action: `Updated product add-ons: ${productName || productId}`, area: 'product_management', entityType: 'product', entityId: productId });
      return { ok: true, localOnly: true };
    }
  };

  const adjustProductStock = async ({ productId, change, reason }) => {
    const p = products.find(x => sameId(x.id, productId));
    if (!p) return { ok: false };
    if (p.stock == null) return { ok: true };
    const nextStock = Number(p.stock) + Number(change);
    if (nextStock < 0) return { ok: false };

    if (!isSupabaseConfigured) {
      setProducts(prev => {
        const next = (prev || []).map(x => sameId(x.id, productId) ? { ...x, stock: nextStock } : x);
        persistProducts(next);
        return next;
      });
      if (String(reason || '').toLowerCase() !== 'sale') {
        const sign = Number(change) >= 0 ? '+' : '';
        await logActivity({ action: `Adjusted product stock: ${p.name} (${sign}${Number(change)})`, area: 'product_management', entityType: 'product', entityId: productId });
      }
      return { ok: true };
    }

    try {
      const { error: updErr } = await withTimeout(supabase.from('products').update({ stock: nextStock }).eq('id', productId), 5000);
      if (updErr) throw updErr;
      const { error: logErr } = await withTimeout(
        supabase.from('inventory_logs').insert([{ product_id: productId, change: Number(change), reason }]),
        5000
      );
      if (logErr) throw logErr;
    } catch (err) {
      setProducts(prev => {
        const next = (prev || []).map(x => sameId(x.id, productId) ? { ...x, stock: nextStock } : x);
        persistProducts(next);
        return next;
      });
      addNotification('Stock updated locally (database not available).', 'warning');
      if (String(reason || '').toLowerCase() !== 'sale') {
        const sign = Number(change) >= 0 ? '+' : '';
        await logActivity({ action: `Adjusted product stock: ${p.name} (${sign}${Number(change)})`, area: 'product_management', entityType: 'product', entityId: productId });
      }
      return { ok: true, localOnly: true, error: err?.message || null };
    }

    setProducts(prev => {
      const next = (prev || []).map(x => sameId(x.id, productId) ? { ...x, stock: nextStock } : x);
      persistProducts(next);
      return next;
    });
    if (String(reason || '').toLowerCase() !== 'sale') {
      const sign = Number(change) >= 0 ? '+' : '';
      await logActivity({ action: `Adjusted product stock: ${p.name} (${sign}${Number(change)})`, area: 'product_management', entityType: 'product', entityId: productId });
    }
    return { ok: true };
  };

  const checkProductAvailability = (product, qty = 1, productSizeId = null) => {
    const requiredQty = Number(qty || 1);
    const pid = product?.id;
    const sizes = pid != null ? (sizesByProductId.get(String(pid)) || []) : [];
    const resolvedSizeId = productSizeId ?? sizes[0]?.id ?? null;
    const sizeKey = resolvedSizeId == null ? null : String(resolvedSizeId);
    const sizeBom = sizeKey ? (sizeIngredientsBySizeId.get(sizeKey) || []) : [];
    const productBom = pid != null ? (productBomByProductId.get(String(pid)) || []) : [];
    const bom = [...productBom, ...sizeBom];

    if (bom.length === 0 || (ingredients.length === 0 && materials.length === 0)) {
      if (product?.stock == null) return true;
      if (Number(product.stock || 0) <= 0) return false;
      return Number(product?.stock || 0) >= requiredQty;
    }

    const requiredIngredients = new Map();
    const requiredMaterials = new Map();
    for (const row of bom) {
      const ref = parseBomRef(row.ingredient_id);
      const key = String(ref.id);
      const target = ref.type === 'material' ? requiredMaterials : requiredIngredients;
      target.set(key, (target.get(key) || 0) + Number(row.quantity || 0) * requiredQty);
    }
    for (const [id, required] of requiredIngredients.entries()) {
      const ing = ingredientById.get(String(id));
      const available = Number(ing?.quantity || 0);
      if (available < required) return false;
    }
    for (const [id, required] of requiredMaterials.entries()) {
      const m = materialById.get(String(id));
      const available = Number(m?.quantity || 0);
      if (available < required) return false;
    }
    return true;
  };

  const getCombinedBomRows = (productId, productSizeId = null) => {
    const sizeKey = productSizeId == null ? null : String(productSizeId);
    const sizeBom = sizeKey ? (sizeIngredientsBySizeId.get(sizeKey) || []) : [];
    const productBom = productBomByProductId.get(String(productId)) || [];
    return [...productBom, ...sizeBom];
  };

  const buildRequiredBOMFromCart = (cartItems) => {
    const requiredIngredients = new Map();
    const requiredMaterials = new Map();
    const requiredProductStock = new Map();

    for (const item of cartItems || []) {
      const productId = String(item.product_id ?? item.id);
      const qty = Number(item.quantity || 0);
      const sizeId = item.product_size_id ?? item.size_id ?? null;
      const bom = getCombinedBomRows(productId, sizeId);

      // Base recipe per drink + selected size recipe per drink.
      for (const row of bom) {
        const ref = parseBomRef(row.ingredient_id);
        const key = String(ref.id);
        const target = ref.type === 'material' ? requiredMaterials : requiredIngredients;
        target.set(key, (target.get(key) || 0) + Number(row.quantity || 0) * qty);
      }

      // Add-on servings are additive to base servings:
      // ingredient_used = addon_recipe_qty * addon_servings_per_drink * drink_qty
      for (const a of item.addons || item.displayAddons || []) {
        const addonId = String(a.addon_id ?? a.id);
        const perDrinkAddonServings = Math.max(0, Number(a.quantity || 0));
        const addonBom = addonBomByAddonId.get(String(addonId)) || [];
        if (addonBom.length > 0) {
          for (const row of addonBom) {
            const ref = parseBomRef(row.ingredient_id);
            const key = String(ref.id);
            const target = ref.type === 'material' ? requiredMaterials : requiredIngredients;
            target.set(
              key,
              (target.get(key) || 0) + Number(row.quantity || 0) * perDrinkAddonServings * qty
            );
          }
        } else {
          const addonMeta = addonById.get(String(addonId));
          const addonName = String(addonMeta?.name || '').trim().toLowerCase();
          if (addonName) {
            for (const row of bom) {
              const ref = parseBomRef(row.ingredient_id);
              const key = String(ref.id);
              const target = ref.type === 'material' ? requiredMaterials : requiredIngredients;
              const itemMeta = ref.type === 'material' ? materialById.get(key) : ingredientById.get(key);
              const baseName = String(itemMeta?.name || '').trim().toLowerCase();
              if (!baseName) continue;
              if (baseName === addonName || baseName.includes(addonName) || addonName.includes(baseName)) {
                target.set(key, (target.get(key) || 0) + Number(row.quantity || 0) * perDrinkAddonServings * qty);
              }
            }
          }
        }
      }

      // If no BOM lines are defined for this item, use product stock fallback.
      if (bom.length === 0) {
        requiredProductStock.set(productId, (requiredProductStock.get(productId) || 0) + qty);
      }
    }

    return { requiredIngredients, requiredMaterials, requiredProductStock };
  };

  const checkCartAvailability = (cartItems) => {
    const bomEnabled = (ingredients.length > 0 || materials.length > 0) && (productSizeIngredients.length > 0 || productIngredients.length > 0);
    if (!bomEnabled) {
      const missing = [];
      const totals = new Map();
      for (const item of cartItems || []) {
        const productId = item.product_id ?? item.id;
        totals.set(productId, (totals.get(productId) || 0) + Number(item.quantity || 0));
      }

      for (const [productId, requiredQty] of totals.entries()) {
        const p = products.find(x => sameId(x.id, productId));
        const available = p ? (p.stock == null ? Infinity : Number(p.stock || 0)) : 0;
        if (available < requiredQty) {
          missing.push({
            product_id: productId,
            name: p?.name ?? 'Unknown',
            required: requiredQty,
            available
          });
        }
      }

      return { ok: missing.length === 0, missing };
    }

    const { requiredIngredients, requiredMaterials, requiredProductStock } = buildRequiredBOMFromCart(cartItems);
    for (const [productId, requiredQty] of requiredProductStock.entries()) {
      const p = products.find(x => sameId(x.id, productId));
      const available = p ? Number(p.stock || 0) : 0;
      if (available < requiredQty) {
        return {
          ok: false,
          missing: [{
            product_id: productId,
            name: p?.name ?? 'Unknown',
            required: requiredQty,
            available
          }]
        };
      }
    }

    const missing = [];
    for (const [ingredientId, required] of requiredIngredients.entries()) {
      const ing = ingredientById.get(String(ingredientId));
      const available = Number(ing?.quantity || 0);
      if (available < required) {
        missing.push({
          ingredient_id: ingredientId,
          name: ing?.name ?? 'Unknown',
          required,
          available,
          unit: ing?.unit ?? null
        });
      }
    }
    for (const [materialId, required] of requiredMaterials.entries()) {
      const m = materialById.get(String(materialId));
      const available = Number(m?.quantity || 0);
      if (available < required) {
        missing.push({
          material_id: materialId,
          name: m?.name ?? 'Unknown',
          required,
          available,
          unit: m?.unit ?? null
        });
      }
    }

    return { ok: missing.length === 0, missing };
  };

  const processCheckout = async ({ items, paymentMethod, referenceNumber, cashReceived }) => {
    const cartItems = items || [];
    if (cartItems.length === 0) return { ok: false };

    if (storeSettings?.is_open === false) {
      addNotification('Store is closed. Open the store to process orders.', 'error');
      return { ok: false, reason: 'store_closed' };
    }

    const bomMode = (ingredients.length > 0 || materials.length > 0) && (productSizeIngredients.length > 0 || productIngredients.length > 0);
    if (bomMode) {
      const cartCheck = checkCartAvailability(cartItems);
      if (!cartCheck.ok) {
        addNotification(`Insufficient stock: ${cartCheck.missing.map(m => m.name).join(', ')}`, 'error');
        return { ok: false, missing: cartCheck.missing };
      }
    } else {
      for (const line of cartItems) {
        const p = products.find(x => sameId(x.id, line.product_id));
        if (!p) {
          addNotification(`Out of stock: ${line.name}`, 'error');
          return { ok: false };
        }
        if (p.stock != null && Number(p.stock) < Number(line.quantity)) {
          addNotification(`Out of stock: ${line.name}`, 'error');
          return { ok: false };
        }
      }
    }

    let totalAmount = 0;
    for (const line of cartItems) {
      const qty = Number(line.quantity || 0);
      const unitBase = Number(line.price || 0);
      const addonsTotalPerUnit = (line.addons || []).reduce((sum, a) => {
        const unit = Number(a.unit_price ?? addonById.get(String(a.addon_id))?.price_per_unit ?? 0);
        const q = Number(a.quantity || 0);
        return sum + unit * q;
      }, 0);
      totalAmount += (unitBase + addonsTotalPerUnit) * qty;
    }

    const normalizedPayment = String(paymentMethod || '').toLowerCase().includes('cash') ? 'Cash' : 'GCash';
    const normalizedReference = referenceNumber == null ? null : String(referenceNumber).replaceAll(/[^\d]/g, '');
    if (normalizedPayment !== 'Cash' && (!normalizedReference || normalizedReference.length !== 13)) {
      addNotification('GCash reference number is required (13 digits).', 'warning');
      return { ok: false };
    }
    const cashReceivedNum = normalizedPayment === 'Cash' ? Number(cashReceived || 0) : null;
    const changeAmount = normalizedPayment === 'Cash' ? Math.max(0, Number(cashReceivedNum || 0) - Number(totalAmount || 0)) : null;

    const commitLocalSale = async ({ warn = false, warnError = null } = {}) => {
      const fakeSale = {
        id: Date.now(),
        created_at: new Date().toISOString(),
        total_amount: totalAmount,
        payment_method: normalizedPayment,
        reference_number: referenceNumber || null,
        cash_received: cashReceivedNum,
        change_amount: changeAmount,
        cashier: normalizedUser?.name ?? 'Cashier',
        items: cartItems.map(l => ({
          name: l.name,
          quantity: l.quantity,
          price: l.price,
          subtotal: Number(l.price) * Number(l.quantity),
          addons: (l.addons || []).map(a => ({
            name: addonById.get(String(a.addon_id))?.name ?? 'Addon',
            quantity: Number(a.quantity || 0) * Number(l.quantity || 0),
            unit_price: Number(a.unit_price ?? 0),
            subtotal: Number(a.unit_price ?? 0) * Number(a.quantity || 0) * Number(l.quantity || 0)
          }))
        }))
      };
      setSales(prev => {
        const next = [fakeSale, ...(prev || [])];
        persistSales(next);
        return next;
      });

      if (bomMode) {
        const { requiredIngredients, requiredMaterials, requiredProductStock } = buildRequiredBOMFromCart(cartItems);
        for (const [ingredientId, required] of requiredIngredients.entries()) {
          await adjustIngredientStock({ ingredientId, change: -Number(required), reason: 'sale' });
        }
        for (const [materialId, required] of requiredMaterials.entries()) {
          await adjustMaterialStock({ materialId, change: -Number(required), reason: 'sale' });
        }
        for (const [productId, required] of requiredProductStock.entries()) {
          await adjustProductStock({ productId, change: -Number(required), reason: 'sale' });
        }
      } else {
        for (const line of cartItems) {
          await adjustProductStock({ productId: line.product_id, change: -Number(line.quantity), reason: 'sale' });
        }
      }

      setDailySales(prev => Number(prev || 0) + totalAmount);
      if (warn) {
        const reason = warnError ? summarizeDbError(warnError) : 'database not available';
        addNotification(`Checkout saved locally (cannot save to database: ${reason}).`, 'warning');
      }
      else addNotification('Checkout successful.', 'success');
      await logActivity({ action: `Checkout processed (${normalizedPayment})`, area: 'pos', entityType: 'sale', entityId: fakeSale.id });
      return { ok: true, sale: fakeSale };
    };

    if (!isSupabaseConfigured) return await commitLocalSale();

    const salePayload = {
      account_id: normalizedUser?.id ?? null,
      total_amount: totalAmount,
      payment_method: normalizedPayment,
      reference_number: normalizedPayment === 'Cash' ? null : normalizedReference,
      cash_received: cashReceivedNum,
      change_amount: changeAmount
    };

    let saleData = null;
    let saleErr = null;
    try {
      const first = await withTimeout(supabase.from('sales').insert([salePayload]).select(), 5000);
      saleData = first.data;
      saleErr = first.error;
    if (saleErr && (String(saleErr.message || '').toLowerCase().includes('cash_received') || String(saleErr.message || '').toLowerCase().includes('change_amount'))) {
      const fallback = { ...salePayload };
      delete fallback.cash_received;
      delete fallback.change_amount;
        const retry = await withTimeout(supabase.from('sales').insert([fallback]).select(), 5000);
      saleData = retry.data;
      saleErr = retry.error;
    }

    if (saleErr || !saleData?.[0]) {
        return await commitLocalSale({ warn: true, warnError: saleErr || new Error('Failed to insert sale') });
    }

    const saleId = saleData[0].id;

    let requiredIngredients = new Map();
    let requiredMaterials = new Map();
    let requiredProductStock = new Map();
    if (bomMode) {
      const required = buildRequiredBOMFromCart(cartItems);
      requiredIngredients = required.requiredIngredients;
      requiredMaterials = required.requiredMaterials;
      requiredProductStock = required.requiredProductStock;
    }

    for (const item of cartItems) {
      const qty = Number(item.quantity || 0);
      const unitBase = Number(item.price || 0);
      const lineAddonTotal = (item.addons || []).reduce((sum, a) => {
        const unit = Number(a.unit_price ?? addonById.get(String(a.addon_id))?.price_per_unit ?? 0);
        const q = Number(a.quantity || 0);
        return sum + unit * q;
      }, 0);

      const trxPayload = {
        sale_id: saleId,
        product_id: item.product_id,
        quantity: qty,
        price: unitBase,
        subtotal: (unitBase + lineAddonTotal) * qty,
        product_size_id: item.product_size_id ?? item.size_id ?? null,
        size_name: item.size_name ?? item.displaySize ?? null
      };

      let { data: trxData, error: trxErr } = await supabase
        .from('transactions')
        .insert([trxPayload])
        .select('id');

      if (trxErr && (String(trxErr.message || '').toLowerCase().includes('product_size_id') || String(trxErr.message || '').toLowerCase().includes('size_name'))) {
        const fallback = { ...trxPayload };
        delete fallback.product_size_id;
        delete fallback.size_name;
        const retry = await supabase.from('transactions').insert([fallback]).select('id');
        trxData = retry.data;
        trxErr = retry.error;
      }

      if (trxErr || !trxData?.[0]) {
          return await commitLocalSale({ warn: true, warnError: trxErr || new Error('Failed to insert transaction') });
      }

      const trxId = trxData[0].id;
      const addonRows = (item.addons || [])
        .filter(a => a.addon_id && Number(a.quantity) > 0)
        .map(a => {
          const perUnitQty = Math.floor(Number(a.quantity || 0));
          const totalQty = Math.floor(perUnitQty * qty);
          const unit = Number(a.unit_price ?? addonById.get(String(a.addon_id))?.price_per_unit ?? 0);
          return {
            transaction_id: trxId,
            addon_id: a.addon_id,
            quantity: totalQty,
            unit_price: unit,
            subtotal: unit * totalQty
          };
        });

      if (addonRows.length > 0) {
        const { error: addErr } = await supabase.from('transaction_addons').insert(addonRows);
        if (addErr) {
            return await commitLocalSale({ warn: true, warnError: addErr });
        }
      }
    }

    if (bomMode) {
      for (const [ingredientId, required] of requiredIngredients.entries()) {
        const ok = await adjustIngredientStock({ ingredientId, change: -Number(required), reason: 'sale' });
        if (!ok.ok) {
            return await commitLocalSale({ warn: true, warnError: new Error('Failed to adjust ingredient stock') });
        }
      }
      for (const [materialId, required] of requiredMaterials.entries()) {
        const ok = await adjustMaterialStock({ materialId, change: -Number(required), reason: 'sale' });
        if (!ok.ok) {
          return await commitLocalSale({ warn: true, warnError: new Error('Failed to adjust material stock') });
        }
      }
      for (const [productId, required] of requiredProductStock.entries()) {
        const ok = await adjustProductStock({ productId, change: -Number(required), reason: 'sale' });
        if (!ok.ok) {
          return await commitLocalSale({ warn: true, warnError: new Error('Failed to adjust product stock') });
        }
      }
      await fetchIngredients();
      await fetchMaterials();
    } else {
      for (const line of cartItems) {
        const ok = await adjustProductStock({ productId: line.product_id, change: -Number(line.quantity), reason: 'sale' });
        if (!ok.ok) {
            return await commitLocalSale({ warn: true, warnError: new Error('Failed to adjust product stock') });
        }
      }
    }

    await refreshDailySales();
    await fetchSalesReport({ days: 30 });
    await fetchSales();
    addNotification('Checkout successful.', 'success');
    return { ok: true, sale: { id: saleId } };
    } catch (err) {
      return await commitLocalSale({ warn: true, warnError: err });
    }
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateCartItem,
    clearCart,
    cartTotal,
    user: normalizedUser,
    setUser,
    login,
    logout,
    hasPermission,
    isSidebarOpen,
    setIsSidebarOpen,
    isSidebarHidden,
    setIsSidebarHidden,
    dailySales,
    salesReport,
    notifications,
    addNotification,
    dismissNotificationToast,
    markNotificationRead,
    deleteNotification,
    markAllNotificationsRead,
    clearNotifications,
    activityLogs,
    fetchActivityLogs,
    globalSearchTerm,
    setGlobalSearchTerm,
    checkProductAvailability,
    checkCartAvailability,
    processCheckout,
    isDataLoaded,
    accounts,
    fetchAccounts,
    createAccount,
    setAccountActive,
    deleteAccount,
    updateAccountPassword,
    verifyCredentials,
    categories,
    fetchCategories,
    createCategory,
    deleteCategory,
    products,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    adjustProductStock,
    storeSettings,
    fetchStoreSettings,
    updateStoreSettings,
    ingredients,
    ingredientCategories,
    addIngredientCategory,
    renameIngredientCategory,
    deleteIngredientCategory,
    fetchIngredients,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    adjustIngredientStock,
    materials,
    materialCategories,
    addMaterialCategory,
    renameMaterialCategory,
    deleteMaterialCategory,
    fetchMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    adjustMaterialStock,
    addons,
    addonCategories,
    addAddonCategory,
    renameAddonCategory,
    deleteAddonCategory,
    fetchAddons,
    createAddon,
    updateAddon,
    deleteAddon,
    productSizes,
    fetchProductSizes,
    productSizeIngredients,
    fetchProductSizeIngredients,
    setProductSizesWithBOM,
    productIngredients,
    fetchProductIngredients,
    setProductBOM,
    productAddons,
    fetchProductAddons,
    setProductAddonsForProduct,
    addonIngredients,
    fetchAddonIngredients,
    setAddonBOM,
    sales,
    fetchSales,
    refreshDailySales,
    fetchSalesReport,
    getBusinessDayStart
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
