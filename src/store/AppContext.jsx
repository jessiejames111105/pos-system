import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

const supabaseUrlEnv = import.meta.env.VITE_SUPABASE_URL;
const supabaseKeyEnv =
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const isSupabaseConfigured = Boolean(
  supabaseUrlEnv &&
    supabaseKeyEnv &&
    !String(supabaseUrlEnv).includes('your-project-url') &&
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
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState(() => {
    try {
      const raw = localStorage.getItem('pos_ingredients');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
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
      return { open_time, close_time, days_open, day_overrides };
    } catch {
      return { open_time: '09:00', close_time: '21:00', days_open: [0, 1, 2, 3, 4, 5, 6], day_overrides: {} };
    }
  });
  const [productSizes, setProductSizes] = useState([]);
  const [productSizeIngredients, setProductSizeIngredients] = useState([]);
  const [productIngredients, setProductIngredients] = useState([]);
  const [productAddons, setProductAddons] = useState([]);
  const [addonIngredients, setAddonIngredients] = useState([]);
  const [sales, setSales] = useState([]);
  const [dailySales, setDailySales] = useState(0);
  const [salesReport, setSalesReport] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const lowStockNotified = useRef(new Set());

  const normalizedUser = useMemo(() => {
    if (!user) return null;
    return user;
  }, [user]);

  const ingredientById = useMemo(() => {
    return new Map((ingredients || []).map(i => [i.id, i]));
  }, [ingredients]);

  const addonById = useMemo(() => {
    return new Map((addons || []).map(a => [a.id, a]));
  }, [addons]);

  const productBomByProductId = useMemo(() => {
    const map = new Map();
    for (const row of productIngredients || []) {
      const list = map.get(row.product_id) || [];
      list.push(row);
      map.set(row.product_id, list);
    }
    return map;
  }, [productIngredients]);

  const addonBomByAddonId = useMemo(() => {
    const map = new Map();
    for (const row of addonIngredients || []) {
      const list = map.get(row.addon_id) || [];
      list.push(row);
      map.set(row.addon_id, list);
    }
    return map;
  }, [addonIngredients]);

  const addonIdsByProductId = useMemo(() => {
    const map = new Map();
    for (const row of productAddons || []) {
      const list = map.get(row.product_id) || [];
      list.push(row.addon_id);
      map.set(row.product_id, list);
    }
    return map;
  }, [productAddons]);

  const sizeById = useMemo(() => {
    return new Map((productSizes || []).map(s => [s.id, s]));
  }, [productSizes]);

  const sizesByProductId = useMemo(() => {
    const map = new Map();
    for (const s of productSizes || []) {
      const list = map.get(s.product_id) || [];
      list.push(s);
      map.set(s.product_id, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || String(a.name).localeCompare(String(b.name)));
    }
    return map;
  }, [productSizes]);

  const sizeIngredientsBySizeId = useMemo(() => {
    const map = new Map();
    for (const row of productSizeIngredients || []) {
      const list = map.get(row.product_size_id) || [];
      list.push(row);
      map.set(row.product_size_id, list);
    }
    return map;
  }, [productSizeIngredients]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, read: false, created_at: new Date().toISOString() }]);
    const ttl = type === 'warning' || type === 'error' ? 15000 : 6000;
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, ttl);
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

  const persistIngredients = (next) => {
    try {
      localStorage.setItem('pos_ingredients', JSON.stringify(next));
    } catch {}
  };

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

  const fetchStoreSettings = async () => {
    if (!isSupabaseConfigured) return storeSettings;
    try {
      const selectWithOverrides = 'open_time,close_time,days_open,day_overrides,updated_at';
      const selectNoOverrides = 'open_time,close_time,days_open,updated_at';

      let data = null;
      let error = null;

      const preferred = await withTimeout(
        supabase.from('store_settings').select(selectWithOverrides).eq('id', 1).limit(1),
        5000
      );
      data = preferred.data;
      error = preferred.error;

      if (error && String(error.message || '').toLowerCase().includes('day_overrides')) {
        const retry = await withTimeout(
          supabase.from('store_settings').select(selectNoOverrides).eq('id', 1).limit(1),
          5000
        );
        data = retry.data;
        error = retry.error;
      }

      if (error || !data?.[0]) {
        const fallback = await withTimeout(
          supabase
            .from('store_settings')
            .select(selectWithOverrides)
            .order('updated_at', { ascending: false })
            .limit(1),
          5000
        );
        data = fallback.data;
        error = fallback.error;

        if (error && String(error.message || '').toLowerCase().includes('day_overrides')) {
          const retry = await withTimeout(
            supabase
              .from('store_settings')
              .select(selectNoOverrides)
              .order('updated_at', { ascending: false })
              .limit(1),
            5000
          );
          data = retry.data;
          error = retry.error;
        }
      }

      if (error || !data?.[0]) return storeSettings;

      const row = data[0];
      const next = {
        open_time: row.open_time ? String(row.open_time) : storeSettings.open_time,
        close_time: row.close_time ? String(row.close_time) : storeSettings.close_time,
        days_open: Array.isArray(row.days_open)
          ? row.days_open.map(n => Number(n)).filter(n => Number.isFinite(n))
          : storeSettings.days_open,
        day_overrides:
          row.day_overrides && typeof row.day_overrides === 'object' ? row.day_overrides : storeSettings.day_overrides || {}
      };
      setStoreSettings(next);
      persistStoreSettings(next);
      return next;
    } catch {
      return storeSettings;
    }
  };

  const updateStoreSettings = async (updates) => {
    const next = {
      open_time: updates?.open_time ? String(updates.open_time) : storeSettings.open_time,
      close_time: updates?.close_time ? String(updates.close_time) : storeSettings.close_time,
      days_open: Array.isArray(updates?.days_open)
        ? updates.days_open.map(n => Number(n)).filter(n => Number.isFinite(n))
        : storeSettings.days_open,
      day_overrides:
        updates?.day_overrides && typeof updates.day_overrides === 'object' ? updates.day_overrides : storeSettings.day_overrides || {}
    };
    setStoreSettings(next);
    persistStoreSettings(next);

    if (!isSupabaseConfigured) {
      addNotification('Store hours updated.', 'success');
      await logActivity({ action: 'Updated store operational hours', area: 'settings', entityType: 'store_settings', entityId: 'default' });
      return { ok: true };
    }

    try {
      const updated_at = new Date().toISOString();
      const basePayload = { ...next, updated_at };
      const preferredPayload = { id: 1, ...basePayload };

      const { error: upsertErr } = await withTimeout(
        supabase.from('store_settings').upsert([preferredPayload], { onConflict: 'id' }),
        5000
      );

      if (upsertErr) {
        const { error: insErr } = await withTimeout(
          supabase.from('store_settings').insert([basePayload]),
          5000
        );
        if (insErr) throw insErr;
      }

      addNotification('Store hours updated.', 'success');
      await logActivity({ action: 'Updated store operational hours', area: 'settings', entityType: 'store_settings', entityId: 'default' });
      return { ok: true };
    } catch {
      addNotification('Store hours saved locally (database not available).', 'warning');
      await logActivity({ action: 'Updated store operational hours', area: 'settings', entityType: 'store_settings', entityId: 'default' });
      return { ok: true };
    }
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

  const fetchCategories = async () => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
    if (error) return [];
    setCategories(data || []);
    return data || [];
  };

  const fetchProducts = async () => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('products')
      .select('id,name,category_id,price,stock,barcode,created_at,categories(name)')
      .order('created_at', { ascending: false });
    if (error) return [];
    const mapped = (data || []).map(row => ({
      ...row,
      categoryName: row.categories?.name ?? null
    }));
    setProducts(mapped);
    return mapped;
  };

  const fetchIngredients = async () => {
    if (!isSupabaseConfigured) return [];
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
        min_stock: Number(r.min_stock)
      }));
      setIngredients(mapped);
      persistIngredients(mapped);
      notifyLowStockIngredients(mapped);
      return mapped;
    } catch {
      return ingredients || [];
    }
  };

  const fetchMaterials = async () => {
    if (!isSupabaseConfigured) return [];
    try {
      let { data, error } = await withTimeout(
        supabase
          .from('materials')
          .select('id,name,category,unit,quantity,min_stock,created_at')
          .order('name', { ascending: true }),
        5000
      );
      if (error && String(error.message || '').toLowerCase().includes('category')) {
        const retry = await withTimeout(
          supabase
            .from('materials')
            .select('id,name,unit,quantity,min_stock,created_at')
            .order('name', { ascending: true }),
          5000
        );
        data = retry.data;
        error = retry.error;
      }
      if (error) return materials || [];
      const mapped = (data || []).map(r => ({
        ...r,
        category: r.category ?? null,
        quantity: Number(r.quantity),
        min_stock: Number(r.min_stock)
      }));
      setMaterials(mapped);
      persistMaterials(mapped);
      return mapped;
    } catch {
      return materials || [];
    }
  };

  const fetchAddons = async () => {
    if (!isSupabaseConfigured) return [];
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
        variable_quantity: Boolean(r.variable_quantity)
      }));
      setAddons(mapped);
      persistAddons(mapped);
      return mapped;
    } catch {
      return addons || [];
    }
  };

  const fetchProductSizes = async () => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('product_sizes')
      .select('id,product_id,name,price,sort_order,created_at')
      .order('product_id', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    if (error) return [];
    const mapped = (data || []).map(r => ({
      ...r,
      price: Number(r.price || 0),
      sort_order: r.sort_order ?? 0
    }));
    setProductSizes(mapped);
    return mapped;
  };

  const fetchProductSizeIngredients = async () => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('product_size_ingredients')
      .select('product_size_id,ingredient_id,quantity');
    if (error) return [];
    const mapped = (data || []).map(r => ({
      product_size_id: r.product_size_id,
      ingredient_id: r.ingredient_id,
      quantity: Number(r.quantity)
    }));
    setProductSizeIngredients(mapped);
    return mapped;
  };

  const fetchProductIngredients = async () => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.from('product_ingredients').select('product_id,ingredient_id,quantity');
    if (error) return [];
    const mapped = (data || []).map(r => ({
      product_id: r.product_id,
      ingredient_id: r.ingredient_id,
      quantity: Number(r.quantity)
    }));
    setProductIngredients(mapped);
    return mapped;
  };

  const fetchProductAddons = async () => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.from('product_addons').select('product_id,addon_id');
    if (error) return [];
    const mapped = (data || []).map(r => ({ product_id: r.product_id, addon_id: r.addon_id }));
    setProductAddons(mapped);
    return mapped;
  };

  const fetchAddonIngredients = async () => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.from('addon_ingredients').select('addon_id,ingredient_id,quantity');
    if (error) return [];
    const mapped = (data || []).map(r => ({
      addon_id: r.addon_id,
      ingredient_id: r.ingredient_id,
      quantity: Number(r.quantity)
    }));
    setAddonIngredients(mapped);
    return mapped;
  };

  const fetchSales = async () => {
    if (!isSupabaseConfigured) return [];
    let { data, error } = await supabase
      .from('sales')
      .select('id,account_id,total_amount,payment_method,reference_number,cash_received,change_amount,created_at,accounts(name,account_id,email),transactions(id,product_id,quantity,price,subtotal,product_size_id,size_name,products(name,category_id),transaction_addons(quantity,unit_price,subtotal,addons(name)))')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error && (String(error.message || '').toLowerCase().includes('cash_received') || String(error.message || '').toLowerCase().includes('change_amount'))) {
      const retry = await supabase
        .from('sales')
        .select('id,account_id,total_amount,payment_method,reference_number,created_at,accounts(name,account_id,email),transactions(id,product_id,quantity,price,subtotal,product_size_id,size_name,products(name,category_id),transaction_addons(quantity,unit_price,subtotal,addons(name)))')
        .order('created_at', { ascending: false })
        .limit(500);
      data = retry.data;
      error = retry.error;
    }

    if (error && (String(error.message || '').toLowerCase().includes('product_size_id') || String(error.message || '').toLowerCase().includes('size_name'))) {
      const retry = await supabase
        .from('sales')
        .select('id,account_id,total_amount,payment_method,reference_number,cash_received,change_amount,created_at,accounts(name,account_id,email),transactions(id,product_id,quantity,price,subtotal,products(name,category_id),transaction_addons(quantity,unit_price,subtotal,addons(name)))')
        .order('created_at', { ascending: false })
        .limit(500);
      data = retry.data;
      error = retry.error;
    }
    if (error && String(error.message || '').toLowerCase().includes('account_id') && String(error.message || '').toLowerCase().includes('accounts')) {
      const retry = await supabase
        .from('sales')
        .select('id,account_id,total_amount,payment_method,reference_number,cash_received,change_amount,created_at,accounts(name,email),transactions(id,product_id,quantity,price,subtotal,product_size_id,size_name,products(name,category_id),transaction_addons(quantity,unit_price,subtotal,addons(name)))')
        .order('created_at', { ascending: false })
        .limit(500);
      data = retry.data;
      error = retry.error;
    }
    if (error) return [];
    const mapped = (data || []).map(s => ({
      id: s.id,
      created_at: s.created_at,
      total_amount: Number(s.total_amount),
      payment_method: s.payment_method,
      reference_number: s.reference_number,
      cash_received: s.cash_received ?? null,
      change_amount: s.change_amount ?? null,
      cashier: s.accounts?.name ?? 'Unknown',
      cashier_account_id: s.accounts?.account_id ?? s.accounts?.email ?? null,
      items: (s.transactions || []).map(t => ({
        name: t.products?.name ?? 'Unknown',
        category_id: t.products?.category_id ?? null,
        quantity: t.quantity,
        price: Number(t.price),
        subtotal: Number(t.subtotal),
        size_name: t.size_name ?? null,
        addons: (t.transaction_addons || []).map(a => ({
          name: a.addons?.name ?? 'Unknown',
          quantity: Number(a.quantity),
          unit_price: Number(a.unit_price),
          subtotal: Number(a.subtotal)
        }))
      }))
    }));
    setSales(mapped);
    return mapped;
  };

  const getBusinessDayStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    let openTimeStr = storeSettings?.open_time || '00:00';
    if (storeSettings?.day_overrides?.[dayOfWeek]?.open_time) {
      openTimeStr = storeSettings.day_overrides[dayOfWeek].open_time;
    }
    const [openHour, openMinute] = openTimeStr.split(':').map(Number);
    const todayOpenTime = new Date(now);
    todayOpenTime.setHours(openHour || 0, openMinute || 0, 0, 0);

    let businessDayStart = new Date(todayOpenTime);
    if (now < todayOpenTime) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yDayOfWeek = yesterday.getDay();
      let yOpenTimeStr = storeSettings?.open_time || '00:00';
      if (storeSettings?.day_overrides?.[yDayOfWeek]?.open_time) {
        yOpenTimeStr = storeSettings.day_overrides[yDayOfWeek].open_time;
      }
      const [yOpenHour, yOpenMinute] = yOpenTimeStr.split(':').map(Number);
      businessDayStart = new Date(yesterday);
      businessDayStart.setHours(yOpenHour || 0, yOpenMinute || 0, 0, 0);
    }
    return businessDayStart;
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

    const { data, error } = await supabase
      .from('sales_report')
      .select('sale_date,total_transactions,total_revenue')
      .gte('sale_date', sinceStr)
      .order('sale_date', { ascending: false });

    if (error) return [];
    const mapped = (data || []).map(r => ({
      sale_date: r.sale_date,
      total_transactions: Number(r.total_transactions || 0),
      total_revenue: Number(r.total_revenue || 0)
    }));
    setSalesReport(mapped);
    return mapped;
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

  const createAccount = async ({ name, password, role }) => {
    const normalizedRole = role === 'admin' ? 'admin' : 'cashier';
    const accountId = await generateAccountId(normalizedRole);
    const payload = {
      name: (name || '').toString().trim(),
      password: (password || '').toString(),
      role: normalizedRole,
      account_id: accountId,
      email: accountId
    };
    if (!payload.name || !payload.password) {
      addNotification('Please fill out name and password.', 'warning');
      return { ok: false };
    }

    if (!isSupabaseConfigured) {
      const local = { id: `demo-${Date.now()}`, name: payload.name, role: payload.role, account_id: payload.account_id };
      setAccounts(prev => [local, ...prev]);
      await logActivity({ action: `Created account: ${local.account_id} (${local.role})`, area: 'user_management', entityType: 'account', entityId: local.id });
      return { ok: true, account: local };
    }

    let { data, error } = await supabase.from('accounts').insert([payload]).select('*');
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
    await logActivity({
      action: `Created account: ${(data[0].account_id || data[0].email || payload.account_id)} (${data[0].role || payload.role})`,
      area: 'user_management',
      entityType: 'account',
      entityId: data[0].id
    });
    return { ok: true, account: data[0] };
  };

  const deleteAccount = async (id) => {
    if (normalizedUser?.id === id) return { ok: false };
    const acct = accounts.find(a => a.id === id);

    if (!isSupabaseConfigured) {
      setAccounts(prev => prev.filter(a => a.id !== id));
      await logActivity({ action: `Deleted account: ${(acct?.account_id || acct?.email || id)}`, area: 'user_management', entityType: 'account', entityId: id });
      return { ok: true };
    }

    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) return { ok: false };
    setAccounts(prev => prev.filter(a => a.id !== id));
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
          { id: 'demo-admin', name: 'Admin User', account_id: 'ADM000001', role: 'admin' },
          { id: 'demo-cashier', name: 'Cashier User', account_id: 'CSH000001', role: 'cashier' }
        ]);
        setCategories([
          { id: 1, name: 'Drinks' },
          { id: 2, name: 'Snacks' },
          { id: 3, name: 'Meals' }
        ]);
        setProducts([
          { id: 1, name: 'Coke', category_id: 1, categoryName: 'Drinks', price: 20, stock: 50, barcode: null },
          { id: 2, name: 'Pepsi', category_id: 1, categoryName: 'Drinks', price: 20, stock: 40, barcode: null },
          { id: 3, name: 'Chips', category_id: 2, categoryName: 'Snacks', price: 15, stock: 30, barcode: null },
          { id: 4, name: 'Burger', category_id: 3, categoryName: 'Meals', price: 50, stock: 25, barcode: null }
        ]);
        if (!Array.isArray(ingredients) || ingredients.length === 0) {
          const demoIngredients = [
            { id: 1, name: 'Sugar', category: 'General', unit: 'g', quantity: 2000, min_stock: 500, created_at: new Date().toISOString() },
            { id: 2, name: 'Milk', category: 'Milk', unit: 'ml', quantity: 5000, min_stock: 1000, created_at: new Date().toISOString() }
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
        setProductSizes([
          { id: 101, product_id: 1, name: 'Standard', price: 20, sort_order: 0, created_at: new Date().toISOString() },
          { id: 102, product_id: 2, name: 'Standard', price: 20, sort_order: 0, created_at: new Date().toISOString() },
          { id: 103, product_id: 3, name: 'Standard', price: 15, sort_order: 0, created_at: new Date().toISOString() },
          { id: 104, product_id: 4, name: 'Standard', price: 50, sort_order: 0, created_at: new Date().toISOString() }
        ]);
        setProductSizeIngredients([]);
        setProductIngredients([]);
        setProductAddons([]);
        setAddonIngredients([]);
        setSales([]);
        setDailySales(0);
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

    if (!isSupabaseConfigured) {
      const demoAdmin = normalizedAccountId === 'ADM000001' && normalizedPassword === 'admin123';
      const demoCashier = normalizedAccountId === 'CSH000001' && normalizedPassword === 'cashier123';
      if (!demoAdmin && !demoCashier) return { success: false, message: 'Invalid account ID or password' };
      const demoUser = demoAdmin
        ? { id: 'demo-admin', name: 'Admin User', account_id: 'ADM000001', role: 'admin' }
        : { id: 'demo-cashier', name: 'Cashier User', account_id: 'CSH000001', role: 'cashier' };
      setUser(demoUser);
      localStorage.setItem('pos_user', JSON.stringify(demoUser));
      await logActivity({ actor: demoUser, action: 'Account login', area: 'auth' });
      return { success: true, role: demoUser.role };
    }

    try {
      let { data, error } = await supabase
        .from('accounts')
        .select('id,name,role,account_id,email')
        .eq('account_id', normalizedAccountId)
        .eq('password', normalizedPassword)
        .limit(1);

      if (error && String(error.message || '').toLowerCase().includes('account_id')) {
        const retry = await supabase
          .from('accounts')
          .select('id,name,role,email')
          .eq('email', normalizedAccountId)
          .eq('password', normalizedPassword)
          .limit(1);
        data = retry.data;
        error = retry.error;
      }
      if (error) throw error;
      const found = data && data[0];
      if (!found) return { success: false, message: 'Invalid account ID or password' };
      setUser(found);
      localStorage.setItem('pos_user', JSON.stringify(found));
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
        .select('id,account_id,email')
        .eq('account_id', normalizedAccountId)
        .eq('password', normalizedPassword)
        .limit(1);

      if (error && String(error.message || '').toLowerCase().includes('account_id')) {
        const retry = await supabase
          .from('accounts')
          .select('id,email')
          .eq('email', normalizedAccountId)
          .eq('password', normalizedPassword)
          .limit(1);
        data = retry.data;
        error = retry.error;
      }
      if (error) return { ok: false };
      const found = data?.[0];
      if (!found) return { ok: false };
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

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const createCategory = async (name) => {
    const trimmed = (name || '').toString().trim();
    if (!trimmed) return { ok: false };
    if (!isSupabaseConfigured) {
      const local = { id: Date.now(), name: trimmed };
      setCategories(prev => [local, ...prev]);
      await logActivity({ action: `Created category: ${trimmed}`, area: 'product_management', entityType: 'category', entityId: local.id });
      return { ok: true, category: local };
    }
    const { data, error } = await supabase.from('categories').insert([{ name: trimmed }]).select();
    if (error || !data) return { ok: false };
    setCategories(prev => [data[0], ...prev]);
    await logActivity({ action: `Created category: ${trimmed}`, area: 'product_management', entityType: 'category', entityId: data[0].id });
    return { ok: true, category: data[0] };
  };

  const deleteCategory = async (id) => {
    const name = categories.find(c => c.id === id)?.name ?? null;
    if (!isSupabaseConfigured) {
      setCategories(prev => prev.filter(c => c.id !== id));
      await logActivity({ action: `Deleted category: ${name || id}`, area: 'product_management', entityType: 'category', entityId: id });
      return { ok: true };
    }
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) return { ok: false };
    setCategories(prev => prev.filter(c => c.id !== id));
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
      const local = { ...insertPayload, id: Date.now(), categoryName: categories.find(c => c.id === insertPayload.category_id)?.name ?? null };
      setProducts(prev => [local, ...prev]);
      await logActivity({ action: `Created product: ${local.name}`, area: 'product_management', entityType: 'product', entityId: local.id });
      return { ok: true, product: local };
    }
    const { data, error } = await supabase.from('products').insert([insertPayload]).select();
    if (error || !data) return { ok: false };
    const created = { ...data[0], categoryName: categories.find(c => c.id === data[0].category_id)?.name ?? null };
    setProducts(prev => [created, ...prev]);
    await logActivity({ action: `Created product: ${created.name}`, area: 'product_management', entityType: 'product', entityId: created.id });
    return { ok: true, product: created };
  };

  const updateProduct = async (id, updates) => {
    const name = products.find(p => p.id === id)?.name ?? null;
    const payload = { ...updates };
    if (payload.price !== undefined) payload.price = Number(payload.price);
    if (payload.stock !== undefined) payload.stock = Number(payload.stock);
    if (!isSupabaseConfigured) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...payload } : p));
      await logActivity({ action: `Updated product: ${name || id}`, area: 'product_management', entityType: 'product', entityId: id });
      return { ok: true };
    }
    const { error } = await supabase.from('products').update(payload).eq('id', id);
    if (error) return { ok: false };
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...payload } : p));
    await logActivity({ action: `Updated product: ${name || id}`, area: 'product_management', entityType: 'product', entityId: id });
    return { ok: true };
  };

  const deleteProduct = async (id) => {
    const name = products.find(p => p.id === id)?.name ?? null;
    if (!isSupabaseConfigured) {
      setProducts(prev => prev.filter(p => p.id !== id));
      await logActivity({ action: `Deleted product: ${name || id}`, area: 'product_management', entityType: 'product', entityId: id });
      return { ok: true };
    }
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return { ok: false };
    setProducts(prev => prev.filter(p => p.id !== id));
    await logActivity({ action: `Deleted product: ${name || id}`, area: 'product_management', entityType: 'product', entityId: id });
    return { ok: true };
  };

  const createIngredient = async (payload) => {
    const insertPayload = {
      name: (payload.name || '').toString().trim(),
      category: (payload.category || 'General').toString().trim(),
      unit: (payload.unit || 'pcs').toString(),
      quantity: Number(payload.quantity || 0),
      min_stock: Number(payload.min_stock || 0)
    };
    if (!insertPayload.name) return { ok: false };
    ensureCategory('ingredient', insertPayload.category);

    if (!isSupabaseConfigured) {
      const local = { ...insertPayload, id: Date.now(), created_at: new Date().toISOString() };
      setIngredients(prev => {
        const next = [local, ...(prev || [])];
        persistIngredients(next);
        return next;
      });
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
    const name = ingredients.find(i => i.id === id)?.name ?? null;
    const payload = { ...updates };
    if (payload.category !== undefined) payload.category = (payload.category || '').toString();
    if (payload.quantity !== undefined) payload.quantity = Number(payload.quantity);
    if (payload.min_stock !== undefined) payload.min_stock = Number(payload.min_stock);

    if (!isSupabaseConfigured) {
      setIngredients(prev => {
        const next = (prev || []).map(i => i.id === id ? { ...i, ...payload } : i);
        persistIngredients(next);
        return next;
      });
      await logActivity({ action: `Updated ingredient: ${name || id}`, area: 'inventory', entityType: 'ingredient', entityId: id });
      return { ok: true };
    }

    try {
      const { error } = await withTimeout(supabase.from('ingredients').update(payload).eq('id', id), 5000);
      if (error) throw error;
      setIngredients(prev => {
        const next = (prev || []).map(i => i.id === id ? { ...i, ...payload } : i);
        persistIngredients(next);
        return next;
      });
      await logActivity({ action: `Updated ingredient: ${name || id}`, area: 'inventory', entityType: 'ingredient', entityId: id });
      return { ok: true };
    } catch {
      setIngredients(prev => {
        const next = (prev || []).map(i => i.id === id ? { ...i, ...payload } : i);
        persistIngredients(next);
        return next;
      });
      addNotification('Ingredient updated locally (database not available).', 'warning');
      await logActivity({ action: `Updated ingredient: ${name || id}`, area: 'inventory', entityType: 'ingredient', entityId: id });
      return { ok: true };
    }
  };

  const deleteIngredient = async (id) => {
    const name = ingredients.find(i => i.id === id)?.name ?? null;
    if (!isSupabaseConfigured) {
      setIngredients(prev => {
        const next = (prev || []).filter(i => i.id !== id);
        persistIngredients(next);
        return next;
      });
      setProductIngredients(prev => prev.filter(r => r.ingredient_id !== id));
      setAddonIngredients(prev => prev.filter(r => r.ingredient_id !== id));
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
      const next = (prev || []).filter(i => i.id !== id);
      persistIngredients(next);
      return next;
    });
    setProductIngredients(prev => prev.filter(r => r.ingredient_id !== id));
    setAddonIngredients(prev => prev.filter(r => r.ingredient_id !== id));
    await logActivity({ action: `Deleted ingredient: ${name || id}`, area: 'inventory', entityType: 'ingredient', entityId: id });
    return { ok: true };
  };

  const adjustIngredientStock = async ({ ingredientId, change, reason }) => {
    const ing = ingredients.find(x => x.id === ingredientId);
    if (!ing) return { ok: false };
    const nextQty = Number(ing.quantity) + Number(change);
    if (nextQty < 0) return { ok: false };

    if (!isSupabaseConfigured) {
      const updated = { ...ing, quantity: nextQty };
      setIngredients(prev => {
        const next = (prev || []).map(x => x.id === ingredientId ? updated : x);
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
    const updated = { ...ing, quantity: nextQty };
    setIngredients(prev => {
      const next = (prev || []).map(x => x.id === ingredientId ? updated : x);
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
    const insertPayload = {
      name: (payload.name || '').toString().trim(),
      category: (payload.category || 'General').toString().trim(),
      unit: (payload.unit || 'pcs').toString(),
      quantity: Number(payload.quantity || 0),
      min_stock: Number(payload.min_stock || 0)
    };
    if (!insertPayload.name) return { ok: false };
    ensureCategory('material', insertPayload.category);

    if (!isSupabaseConfigured) {
      const local = { ...insertPayload, id: Date.now(), created_at: new Date().toISOString() };
      setMaterials(prev => {
        const next = [local, ...(prev || [])];
        persistMaterials(next);
        return next;
      });
      await logActivity({ action: `Created material: ${local.name}`, area: 'inventory', entityType: 'material', entityId: local.id });
      return { ok: true, material: local };
    }

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('materials')
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
      setMaterials(prev => {
        const next = [created, ...(prev || [])];
        persistMaterials(next);
        return next;
      });
      await logActivity({ action: `Created material: ${created.name}`, area: 'inventory', entityType: 'material', entityId: created.id });
      return { ok: true, material: created };
    } catch {
      const local = { ...insertPayload, id: Date.now(), created_at: new Date().toISOString() };
      setMaterials(prev => {
        const next = [local, ...(prev || [])];
        persistMaterials(next);
        return next;
      });
      addNotification('Material saved locally (database not available).', 'warning');
      await logActivity({ action: `Created material: ${local.name}`, area: 'inventory', entityType: 'material', entityId: local.id });
      return { ok: true, material: local };
    }
  };

  const updateMaterial = async (id, updates) => {
    const name = materials.find(m => m.id === id)?.name ?? null;
    const payload = { ...updates };
    if (payload.category !== undefined) payload.category = (payload.category || '').toString();
    if (payload.quantity !== undefined) payload.quantity = Number(payload.quantity);
    if (payload.min_stock !== undefined) payload.min_stock = Number(payload.min_stock);
    if (payload.category) ensureCategory('material', payload.category);

    if (!isSupabaseConfigured) {
      setMaterials(prev => {
        const next = (prev || []).map(m => m.id === id ? { ...m, ...payload } : m);
        persistMaterials(next);
        return next;
      });
      await logActivity({ action: `Updated material: ${name || id}`, area: 'inventory', entityType: 'material', entityId: id });
      return { ok: true };
    }

    try {
      const { error } = await withTimeout(supabase.from('materials').update(payload).eq('id', id), 5000);
      if (error) throw error;
      setMaterials(prev => {
        const next = (prev || []).map(m => m.id === id ? { ...m, ...payload } : m);
        persistMaterials(next);
        return next;
      });
      await logActivity({ action: `Updated material: ${name || id}`, area: 'inventory', entityType: 'material', entityId: id });
      return { ok: true };
    } catch {
      setMaterials(prev => {
        const next = (prev || []).map(m => m.id === id ? { ...m, ...payload } : m);
        persistMaterials(next);
        return next;
      });
      addNotification('Material updated locally (database not available).', 'warning');
      await logActivity({ action: `Updated material: ${name || id}`, area: 'inventory', entityType: 'material', entityId: id });
      return { ok: true };
    }
  };

  const deleteMaterial = async (id) => {
    const name = materials.find(m => m.id === id)?.name ?? null;
    if (!isSupabaseConfigured) {
      setMaterials(prev => {
        const next = (prev || []).filter(m => m.id !== id);
        persistMaterials(next);
        return next;
      });
      await logActivity({ action: `Deleted material: ${name || id}`, area: 'inventory', entityType: 'material', entityId: id });
      return { ok: true };
    }
    try {
      const { error } = await withTimeout(supabase.from('materials').delete().eq('id', id), 5000);
      if (error) throw error;
      setMaterials(prev => {
        const next = (prev || []).filter(m => m.id !== id);
        persistMaterials(next);
        return next;
      });
      await logActivity({ action: `Deleted material: ${name || id}`, area: 'inventory', entityType: 'material', entityId: id });
      return { ok: true };
    } catch {
      setMaterials(prev => {
        const next = (prev || []).filter(m => m.id !== id);
        persistMaterials(next);
        return next;
      });
      addNotification('Material deleted locally (database not available).', 'warning');
      await logActivity({ action: `Deleted material: ${name || id}`, area: 'inventory', entityType: 'material', entityId: id });
      return { ok: true };
    }
  };

  const adjustMaterialStock = async ({ materialId, change, reason }) => {
    const m = materials.find(x => x.id === materialId);
    if (!m) return { ok: false };
    const nextQty = Number(m.quantity) + Number(change);
    if (nextQty < 0) return { ok: false };

    if (!isSupabaseConfigured) {
      const updated = { ...m, quantity: nextQty };
      setMaterials(prev => {
        const next = (prev || []).map(x => x.id === materialId ? updated : x);
        persistMaterials(next);
        return next;
      });
      if (String(reason || '').toLowerCase() !== 'sale') {
        const unit = m.unit ? ` ${m.unit}` : '';
        const sign = Number(change) >= 0 ? '+' : '';
        await logActivity({ action: `Adjusted material stock: ${m.name} (${sign}${Number(change)}${unit})`, area: 'inventory', entityType: 'material', entityId: materialId });
      }
      return { ok: true };
    }

    try {
      const { error: updErr } = await withTimeout(supabase.from('materials').update({ quantity: nextQty }).eq('id', materialId), 5000);
      if (updErr) throw updErr;
      const updated = { ...m, quantity: nextQty };
      setMaterials(prev => {
        const next = (prev || []).map(x => x.id === materialId ? updated : x);
        persistMaterials(next);
        return next;
      });
      if (String(reason || '').toLowerCase() !== 'sale') {
        const unit = m.unit ? ` ${m.unit}` : '';
        const sign = Number(change) >= 0 ? '+' : '';
        await logActivity({ action: `Adjusted material stock: ${m.name} (${sign}${Number(change)}${unit})`, area: 'inventory', entityType: 'material', entityId: materialId });
      }
      return { ok: true };
    } catch {
      const updated = { ...m, quantity: nextQty };
      setMaterials(prev => {
        const next = (prev || []).map(x => x.id === materialId ? updated : x);
        persistMaterials(next);
        return next;
      });
      addNotification('Material stock adjusted locally (database not available).', 'warning');
      if (String(reason || '').toLowerCase() !== 'sale') {
        const unit = m.unit ? ` ${m.unit}` : '';
        const sign = Number(change) >= 0 ? '+' : '';
        await logActivity({ action: `Adjusted material stock: ${m.name} (${sign}${Number(change)}${unit})`, area: 'inventory', entityType: 'material', entityId: materialId });
      }
      return { ok: true };
    }
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
    const name = addons.find(a => a.id === id)?.name ?? null;
    const payload = { ...updates };
    if (payload.category !== undefined) payload.category = (payload.category || '').toString();
    if (payload.price_per_unit !== undefined) payload.price_per_unit = Number(payload.price_per_unit);
    if (payload.variable_quantity !== undefined) payload.variable_quantity = Boolean(payload.variable_quantity);
    if (payload.category) ensureCategory('addon', payload.category);

    if (!isSupabaseConfigured) {
      setAddons(prev => {
        const next = (prev || []).map(a => a.id === id ? { ...a, ...payload } : a);
        persistAddons(next);
        return next;
      });
      await logActivity({ action: `Updated add-on: ${name || id}`, area: 'inventory', entityType: 'addon', entityId: id });
      return { ok: true };
    }

    try {
      const { error } = await withTimeout(supabase.from('addons').update(payload).eq('id', id), 5000);
      if (error) throw error;
      setAddons(prev => {
        const next = (prev || []).map(a => a.id === id ? { ...a, ...payload } : a);
        persistAddons(next);
        return next;
      });
      await logActivity({ action: `Updated add-on: ${name || id}`, area: 'inventory', entityType: 'addon', entityId: id });
      return { ok: true };
    } catch {
      setAddons(prev => {
        const next = (prev || []).map(a => a.id === id ? { ...a, ...payload } : a);
        persistAddons(next);
        return next;
      });
      addNotification('Add-on updated locally (database not available).', 'warning');
      await logActivity({ action: `Updated add-on: ${name || id}`, area: 'inventory', entityType: 'addon', entityId: id });
      return { ok: true };
    }
  };

  const deleteAddon = async (id) => {
    const name = addons.find(a => a.id === id)?.name ?? null;
    if (!isSupabaseConfigured) {
      setAddons(prev => {
        const next = (prev || []).filter(a => a.id !== id);
        persistAddons(next);
        return next;
      });
      setProductAddons(prev => prev.filter(r => r.addon_id !== id));
      setAddonIngredients(prev => prev.filter(r => r.addon_id !== id));
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
      const next = (prev || []).filter(a => a.id !== id);
      persistAddons(next);
      return next;
    });
    setProductAddons(prev => prev.filter(r => r.addon_id !== id));
    setAddonIngredients(prev => prev.filter(r => r.addon_id !== id));
    await logActivity({ action: `Deleted add-on: ${name || id}`, area: 'inventory', entityType: 'addon', entityId: id });
    return { ok: true };
  };

  const setProductSizesWithBOM = async (productId, sizes) => {
    const productName = products.find(p => Number(p.id) === Number(productId))?.name ?? null;
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
      setProductSizes(prev => [...prev.filter(s => s.product_id !== productId), ...localSizes]);
      setProductSizeIngredients(prev => [
        ...prev.filter(r => !localSizes.some(sz => sz.id === r.product_size_id)),
        ...localIngredients
      ]);
      await logActivity({ action: `Updated product sizes/BOM: ${productName || productId}`, area: 'product_management', entityType: 'product', entityId: productId });
      return { ok: true };
    }

    const { error: delErr } = await supabase.from('product_sizes').delete().eq('product_id', productId);
    if (delErr) return { ok: false, error: delErr.message };

    if (normalized.length === 0) {
      await fetchProductSizes();
      await fetchProductSizeIngredients();
      return { ok: true };
    }

    const { data: sizeData, error: sizeErr } = await supabase
      .from('product_sizes')
      .insert(normalized.map(s => ({
        product_id: productId,
        name: s.name,
        price: s.price,
        sort_order: s.sort_order
      })))
      .select('id,product_id,name,price,sort_order,created_at');
    if (sizeErr || !sizeData) return { ok: false, error: sizeErr?.message || 'Failed to save sizes' };

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
      const { error: ingErr } = await supabase.from('product_size_ingredients').insert(ingredientRows);
      if (ingErr) return { ok: false, error: ingErr.message || 'Failed to save size ingredients' };
    }

    await fetchProductSizes();
    await fetchProductSizeIngredients();
    await logActivity({ action: `Updated product sizes/BOM: ${productName || productId}`, area: 'product_management', entityType: 'product', entityId: productId });
    return { ok: true };
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
      setProductIngredients(prev => [...prev.filter(r => r.product_id !== productId), ...rows]);
      return { ok: true };
    }

    const { error: delErr } = await supabase.from('product_ingredients').delete().eq('product_id', productId);
    if (delErr) return { ok: false };
    if (rows.length > 0) {
      const { error: insErr } = await supabase.from('product_ingredients').insert(rows);
      if (insErr) return { ok: false };
    }
    await fetchProductIngredients();
    return { ok: true };
  };

  const setAddonBOM = async (addonId, lines) => {
    const addonName = addons.find(a => Number(a.id) === Number(addonId))?.name ?? null;
    const rows = (lines || [])
      .filter(l => l.ingredient_id && Number(l.quantity) > 0)
      .map(l => ({
        addon_id: addonId,
        ingredient_id: Number(l.ingredient_id),
        quantity: Number(l.quantity)
      }));

    if (!isSupabaseConfigured) {
      setAddonIngredients(prev => [...prev.filter(r => r.addon_id !== addonId), ...rows]);
      await logActivity({ action: `Updated add-on BOM: ${addonName || addonId}`, area: 'inventory', entityType: 'addon', entityId: addonId });
      return { ok: true };
    }

    const { error: delErr } = await supabase.from('addon_ingredients').delete().eq('addon_id', addonId);
    if (delErr) return { ok: false };
    if (rows.length > 0) {
      const { error: insErr } = await supabase.from('addon_ingredients').insert(rows);
      if (insErr) return { ok: false };
    }
    await fetchAddonIngredients();
    await logActivity({ action: `Updated add-on BOM: ${addonName || addonId}`, area: 'inventory', entityType: 'addon', entityId: addonId });
    return { ok: true };
  };

  const setProductAddonsForProduct = async (productId, addonIds) => {
    const productName = products.find(p => Number(p.id) === Number(productId))?.name ?? null;
    const ids = (addonIds || []).map(x => Number(x)).filter(Boolean);
    const rows = ids.map(aid => ({ product_id: productId, addon_id: aid }));

    if (!isSupabaseConfigured) {
      setProductAddons(prev => [...prev.filter(r => r.product_id !== productId), ...rows]);
      await logActivity({ action: `Updated product add-ons: ${productName || productId}`, area: 'product_management', entityType: 'product', entityId: productId });
      return { ok: true };
    }

    const { error: delErr } = await supabase.from('product_addons').delete().eq('product_id', productId);
    if (delErr) return { ok: false };
    if (rows.length > 0) {
      const { error: insErr } = await supabase.from('product_addons').insert(rows);
      if (insErr) return { ok: false };
    }
    await fetchProductAddons();
    await logActivity({ action: `Updated product add-ons: ${productName || productId}`, area: 'product_management', entityType: 'product', entityId: productId });
    return { ok: true };
  };

  const adjustProductStock = async ({ productId, change, reason }) => {
    const p = products.find(x => x.id === productId);
    if (!p) return { ok: false };
    const nextStock = Number(p.stock) + Number(change);
    if (nextStock < 0) return { ok: false };

    if (!isSupabaseConfigured) {
      setProducts(prev => prev.map(x => x.id === productId ? { ...x, stock: nextStock } : x));
      if (String(reason || '').toLowerCase() !== 'sale') {
        const sign = Number(change) >= 0 ? '+' : '';
        await logActivity({ action: `Adjusted product stock: ${p.name} (${sign}${Number(change)})`, area: 'product_management', entityType: 'product', entityId: productId });
      }
      return { ok: true };
    }

    const { error: updErr } = await supabase.from('products').update({ stock: nextStock }).eq('id', productId);
    if (updErr) return { ok: false, error: updErr.message || 'Failed to update product stock' };
    const { error: logErr } = await supabase
      .from('inventory_logs')
      .insert([{ product_id: productId, change: Number(change), reason }]);
    if (logErr) return { ok: false, error: logErr.message || 'Failed to write inventory log' };
    setProducts(prev => prev.map(x => x.id === productId ? { ...x, stock: nextStock } : x));
    if (String(reason || '').toLowerCase() !== 'sale') {
      const sign = Number(change) >= 0 ? '+' : '';
      await logActivity({ action: `Adjusted product stock: ${p.name} (${sign}${Number(change)})`, area: 'product_management', entityType: 'product', entityId: productId });
    }
    return { ok: true };
  };

  const checkProductAvailability = (product, qty = 1, productSizeId = null) => {
    const requiredQty = Number(qty || 1);
    if (product?.stock != null && Number(product.stock || 0) <= 0) return false;
    const pid = product?.id;
    const sizes = pid ? (sizesByProductId.get(pid) || []) : [];
    const resolvedSizeId = Number(productSizeId || sizes[0]?.id || 0) || null;
    const sizeBom = resolvedSizeId ? (sizeIngredientsBySizeId.get(resolvedSizeId) || []) : [];
    const productBom = productBomByProductId.get(pid) || [];
    const bom = sizeBom.length > 0 ? sizeBom : productBom;

    if (bom.length === 0 || ingredients.length === 0) {
      return Number(product?.stock || 0) >= requiredQty;
    }

    for (const row of bom) {
      const ing = ingredientById.get(row.ingredient_id);
      const available = Number(ing?.quantity || 0);
      const required = Number(row.quantity || 0) * requiredQty;
      if (available < required) return false;
    }
    return true;
  };

  const checkCartAvailability = (cartItems) => {
    const bomEnabled = ingredients.length > 0 && (productSizeIngredients.length > 0 || productIngredients.length > 0);
    if (!bomEnabled) {
      const missing = [];
      const totals = new Map();
      for (const item of cartItems || []) {
        const productId = item.product_id ?? item.id;
        totals.set(productId, (totals.get(productId) || 0) + Number(item.quantity || 0));
      }

      for (const [productId, requiredQty] of totals.entries()) {
        const p = products.find(x => x.id === productId);
        const available = p ? Number(p.stock || 0) : 0;
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

    const totals = new Map();
    for (const item of cartItems || []) {
      const productId = item.product_id ?? item.id;
      totals.set(productId, (totals.get(productId) || 0) + Number(item.quantity || 0));
    }
    for (const [productId, requiredQty] of totals.entries()) {
      const p = products.find(x => x.id === productId);
      if (p?.stock != null) {
        const available = Number(p.stock || 0);
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
    }

    const requiredByIngredient = new Map();
    for (const item of cartItems || []) {
      const productId = Number(item.product_id ?? item.id);
      const qty = Number(item.quantity || 0);
      const sizeId = Number(item.product_size_id ?? item.size_id ?? 0) || null;
      const sizeBom = sizeId ? (sizeIngredientsBySizeId.get(sizeId) || []) : [];
      const bom = sizeBom.length > 0 ? sizeBom : (productBomByProductId.get(productId) || []);
      for (const row of bom) {
        const key = row.ingredient_id;
        requiredByIngredient.set(key, (requiredByIngredient.get(key) || 0) + Number(row.quantity || 0) * qty);
      }
      for (const a of item.addons || item.displayAddons || []) {
        const addonId = Number(a.addon_id ?? a.id);
        const perUnitQty = Number(a.quantity || 1);
        const addonBom = addonBomByAddonId.get(addonId) || [];
        for (const row of addonBom) {
          const key = row.ingredient_id;
          requiredByIngredient.set(
            key,
            (requiredByIngredient.get(key) || 0) + Number(row.quantity || 0) * perUnitQty * qty
          );
        }
      }
    }

    const missing = [];
    for (const [ingredientId, required] of requiredByIngredient.entries()) {
      const ing = ingredientById.get(ingredientId);
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

    return { ok: missing.length === 0, missing };
  };

  const processCheckout = async ({ items, paymentMethod, referenceNumber, cashReceived }) => {
    const cartItems = items || [];
    if (cartItems.length === 0) return { ok: false };

    const bomMode = ingredients.length > 0 && (productSizeIngredients.length > 0 || productIngredients.length > 0);
    if (bomMode) {
      const cartCheck = checkCartAvailability(cartItems);
      if (!cartCheck.ok) {
        addNotification(`Insufficient stock: ${cartCheck.missing.map(m => m.name).join(', ')}`, 'error');
        return { ok: false, missing: cartCheck.missing };
      }
    } else {
      for (const line of cartItems) {
        const p = products.find(x => x.id === line.product_id);
        if (!p || Number(p.stock) < Number(line.quantity)) {
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
        const unit = Number(a.unit_price ?? addonById.get(Number(a.addon_id))?.price_per_unit ?? 0);
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

    if (!isSupabaseConfigured) {
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
            name: addonById.get(Number(a.addon_id))?.name ?? 'Addon',
            quantity: Number(a.quantity || 0) * Number(l.quantity || 0),
            unit_price: Number(a.unit_price ?? 0),
            subtotal: Number(a.unit_price ?? 0) * Number(a.quantity || 0) * Number(l.quantity || 0)
          }))
        }))
      };
      setSales(prev => [fakeSale, ...prev]);
      setDailySales(prev => Number(prev || 0) + totalAmount);
      return { ok: true, sale: fakeSale };
    }

    const salePayload = {
      account_id: normalizedUser?.id ?? null,
      total_amount: totalAmount,
      payment_method: normalizedPayment,
      reference_number: normalizedPayment === 'Cash' ? null : normalizedReference,
      cash_received: cashReceivedNum,
      change_amount: changeAmount
    };

    let { data: saleData, error: saleErr } = await supabase.from('sales').insert([salePayload]).select();
    if (saleErr && (String(saleErr.message || '').toLowerCase().includes('cash_received') || String(saleErr.message || '').toLowerCase().includes('change_amount'))) {
      const fallback = { ...salePayload };
      delete fallback.cash_received;
      delete fallback.change_amount;
      const retry = await supabase.from('sales').insert([fallback]).select();
      saleData = retry.data;
      saleErr = retry.error;
    }

    if (saleErr || !saleData?.[0]) {
      addNotification(saleErr?.message || 'Failed to save sale', 'error');
      return { ok: false, error: saleErr?.message || 'Failed to save sale' };
    }

    const saleId = saleData[0].id;

    const requiredByIngredient = new Map();
    if (bomMode) {
      for (const item of cartItems) {
        const productId = Number(item.product_id);
        const qty = Number(item.quantity || 0);
        const sizeId = Number(item.product_size_id ?? item.size_id ?? 0) || null;
        const sizeBom = sizeId ? (sizeIngredientsBySizeId.get(sizeId) || []) : [];
        const bom = sizeBom.length > 0 ? sizeBom : (productBomByProductId.get(productId) || []);
        for (const row of bom) {
          requiredByIngredient.set(
            row.ingredient_id,
            (requiredByIngredient.get(row.ingredient_id) || 0) + Number(row.quantity || 0) * qty
          );
        }
        for (const a of item.addons || []) {
          const addonId = Number(a.addon_id);
          const perUnitQty = Number(a.quantity || 0);
          const addonBom = addonBomByAddonId.get(addonId) || [];
          for (const row of addonBom) {
            requiredByIngredient.set(
              row.ingredient_id,
              (requiredByIngredient.get(row.ingredient_id) || 0) + Number(row.quantity || 0) * perUnitQty * qty
            );
          }
        }
      }
    }

    for (const item of cartItems) {
      const qty = Number(item.quantity || 0);
      const unitBase = Number(item.price || 0);
      const lineAddonTotal = (item.addons || []).reduce((sum, a) => {
        const unit = Number(a.unit_price ?? addonById.get(Number(a.addon_id))?.price_per_unit ?? 0);
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
        addNotification(trxErr?.message || 'Failed to save sale items', 'error');
        return { ok: false, error: trxErr?.message || 'Failed to save sale items' };
      }

      const trxId = trxData[0].id;
      const addonRows = (item.addons || [])
        .filter(a => a.addon_id && Number(a.quantity) > 0)
        .map(a => {
          const perUnitQty = Math.floor(Number(a.quantity || 0));
          const totalQty = Math.floor(perUnitQty * qty);
          const unit = Number(a.unit_price ?? addonById.get(Number(a.addon_id))?.price_per_unit ?? 0);
          return {
            transaction_id: trxId,
            addon_id: Number(a.addon_id),
            quantity: totalQty,
            unit_price: unit,
            subtotal: unit * totalQty
          };
        });

      if (addonRows.length > 0) {
        const { error: addErr } = await supabase.from('transaction_addons').insert(addonRows);
        if (addErr) {
          addNotification(addErr?.message || 'Failed to save add-ons', 'error');
          return { ok: false, error: addErr?.message || 'Failed to save add-ons' };
        }
      }
    }

    if (bomMode) {
      for (const [ingredientId, required] of requiredByIngredient.entries()) {
        const ok = await adjustIngredientStock({ ingredientId, change: -Number(required), reason: 'sale' });
        if (!ok.ok) {
          addNotification(ok.error || 'Failed to deduct ingredient inventory', 'error');
          return { ok: false, error: ok.error || 'Failed to deduct ingredient inventory' };
        }
      }
      await fetchIngredients();
    } else {
      for (const line of cartItems) {
        const ok = await adjustProductStock({ productId: line.product_id, change: -Number(line.quantity), reason: 'sale' });
        if (!ok.ok) {
          addNotification(ok.error || 'Failed to deduct product stock', 'error');
          return { ok: false, error: ok.error || 'Failed to deduct product stock' };
        }
      }
    }

    await refreshDailySales();
    await fetchSalesReport({ days: 30 });
    await fetchSales();
    return { ok: true, sale: { id: saleId } };
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
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
    fetchIngredients,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    adjustIngredientStock,
    materials,
    materialCategories,
    addMaterialCategory,
    fetchMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    adjustMaterialStock,
    addons,
    addonCategories,
    addAddonCategory,
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
