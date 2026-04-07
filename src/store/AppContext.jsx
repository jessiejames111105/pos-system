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
  const [notifications, setNotifications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [addons, setAddons] = useState([]);
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
    setNotifications(prev => [...prev, { id, message, type }]);
    const ttl = type === 'warning' || type === 'error' ? 15000 : 6000;
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, ttl);
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
    const { data, error } = await supabase
      .from('ingredients')
      .select('id,name,unit,quantity,min_stock,created_at')
      .order('name', { ascending: true });
    if (error) return [];
    const mapped = (data || []).map(r => ({
      ...r,
      quantity: Number(r.quantity),
      min_stock: Number(r.min_stock)
    }));
    setIngredients(mapped);
    notifyLowStockIngredients(mapped);
    return mapped;
  };

  const fetchAddons = async () => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('addons')
      .select('id,name,price_per_unit,variable_quantity,created_at')
      .order('name', { ascending: true });
    if (error) return [];
    const mapped = (data || []).map(r => ({
      ...r,
      price_per_unit: Number(r.price_per_unit),
      variable_quantity: Boolean(r.variable_quantity)
    }));
    setAddons(mapped);
    return mapped;
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
      .select('id,account_id,total_amount,payment_method,reference_number,created_at,accounts(name),transactions(id,quantity,price,subtotal,product_size_id,size_name,products(name),transaction_addons(quantity,unit_price,subtotal,addons(name)))')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error && (String(error.message || '').toLowerCase().includes('product_size_id') || String(error.message || '').toLowerCase().includes('size_name'))) {
      const retry = await supabase
        .from('sales')
        .select('id,account_id,total_amount,payment_method,reference_number,created_at,accounts(name),transactions(id,quantity,price,subtotal,products(name),transaction_addons(quantity,unit_price,subtotal,addons(name)))')
        .order('created_at', { ascending: false })
        .limit(200);
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
      cashier: s.accounts?.name ?? 'Unknown',
      items: (s.transactions || []).map(t => ({
        name: t.products?.name ?? 'Unknown',
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

  const refreshDailySales = async () => {
    if (!isSupabaseConfigured) return 0;
    const todayStr = new Date().toISOString().slice(0, 10);
    const { data: reportData, error: reportErr } = await supabase
      .from('sales_report')
      .select('sale_date,total_revenue')
      .eq('sale_date', todayStr)
      .limit(1);

    if (!reportErr) {
      const total = Number(reportData?.[0]?.total_revenue || 0);
      setDailySales(total);
      return total;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data, error } = await supabase.from('sales').select('total_amount').gte('created_at', today.toISOString());
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
      return { ok: true };
    }
    setAccounts(prev => [data[0], ...prev]);
    return { ok: true, account: data[0] };
  };

  const deleteAccount = async (id) => {
    if (normalizedUser?.id === id) return { ok: false };

    if (!isSupabaseConfigured) {
      setAccounts(prev => prev.filter(a => a.id !== id));
      return { ok: true };
    }

    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) return { ok: false };
    setAccounts(prev => prev.filter(a => a.id !== id));
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
        setIngredients([
          { id: 1, name: 'Sugar', unit: 'g', quantity: 2000, min_stock: 500, created_at: new Date().toISOString() },
          { id: 2, name: 'Milk', unit: 'ml', quantity: 5000, min_stock: 1000, created_at: new Date().toISOString() }
        ]);
        setAddons([
          { id: 1, name: 'Pearls', price_per_unit: 10, variable_quantity: true, created_at: new Date().toISOString() }
        ]);
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
          fetchAddons(),
          fetchProductSizes(),
          fetchProductSizeIngredients(),
          fetchProductIngredients(),
          fetchProductAddons(),
          fetchAddonIngredients(),
          fetchSales(),
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
      return { success: true, role: found.role };
    } catch (err) {
      return { success: false, message: 'Cannot reach server. Check Supabase .env settings.' };
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
      return { ok: true, category: local };
    }
    const { data, error } = await supabase.from('categories').insert([{ name: trimmed }]).select();
    if (error || !data) return { ok: false };
    setCategories(prev => [data[0], ...prev]);
    return { ok: true, category: data[0] };
  };

  const deleteCategory = async (id) => {
    if (!isSupabaseConfigured) {
      setCategories(prev => prev.filter(c => c.id !== id));
      return { ok: true };
    }
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) return { ok: false };
    setCategories(prev => prev.filter(c => c.id !== id));
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
      return { ok: true, product: local };
    }
    const { data, error } = await supabase.from('products').insert([insertPayload]).select();
    if (error || !data) return { ok: false };
    const created = { ...data[0], categoryName: categories.find(c => c.id === data[0].category_id)?.name ?? null };
    setProducts(prev => [created, ...prev]);
    return { ok: true, product: created };
  };

  const updateProduct = async (id, updates) => {
    const payload = { ...updates };
    if (payload.price !== undefined) payload.price = Number(payload.price);
    if (payload.stock !== undefined) payload.stock = Number(payload.stock);
    if (!isSupabaseConfigured) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...payload } : p));
      return { ok: true };
    }
    const { error } = await supabase.from('products').update(payload).eq('id', id);
    if (error) return { ok: false };
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...payload } : p));
    return { ok: true };
  };

  const deleteProduct = async (id) => {
    if (!isSupabaseConfigured) {
      setProducts(prev => prev.filter(p => p.id !== id));
      return { ok: true };
    }
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return { ok: false };
    setProducts(prev => prev.filter(p => p.id !== id));
    return { ok: true };
  };

  const createIngredient = async (payload) => {
    const insertPayload = {
      name: (payload.name || '').toString().trim(),
      unit: (payload.unit || 'pcs').toString(),
      quantity: Number(payload.quantity || 0),
      min_stock: Number(payload.min_stock || 0)
    };
    if (!insertPayload.name) return { ok: false };

    if (!isSupabaseConfigured) {
      const local = { ...insertPayload, id: Date.now(), created_at: new Date().toISOString() };
      setIngredients(prev => [local, ...prev]);
      notifyLowStockIngredients([local]);
      return { ok: true, ingredient: local };
    }

    const { data, error } = await supabase
      .from('ingredients')
      .insert([insertPayload])
      .select('id,name,unit,quantity,min_stock,created_at');
    if (error || !data?.[0]) return { ok: false };
    const created = { ...data[0], quantity: Number(data[0].quantity), min_stock: Number(data[0].min_stock) };
    setIngredients(prev => [created, ...prev]);
    notifyLowStockIngredients([created]);
    return { ok: true, ingredient: created };
  };

  const updateIngredient = async (id, updates) => {
    const payload = { ...updates };
    if (payload.quantity !== undefined) payload.quantity = Number(payload.quantity);
    if (payload.min_stock !== undefined) payload.min_stock = Number(payload.min_stock);

    if (!isSupabaseConfigured) {
      setIngredients(prev => prev.map(i => i.id === id ? { ...i, ...payload } : i));
      return { ok: true };
    }

    const { error } = await supabase.from('ingredients').update(payload).eq('id', id);
    if (error) return { ok: false };
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, ...payload } : i));
    return { ok: true };
  };

  const deleteIngredient = async (id) => {
    if (!isSupabaseConfigured) {
      setIngredients(prev => prev.filter(i => i.id !== id));
      setProductIngredients(prev => prev.filter(r => r.ingredient_id !== id));
      setAddonIngredients(prev => prev.filter(r => r.ingredient_id !== id));
      return { ok: true };
    }
    const { error } = await supabase.from('ingredients').delete().eq('id', id);
    if (error) return { ok: false };
    setIngredients(prev => prev.filter(i => i.id !== id));
    setProductIngredients(prev => prev.filter(r => r.ingredient_id !== id));
    setAddonIngredients(prev => prev.filter(r => r.ingredient_id !== id));
    return { ok: true };
  };

  const adjustIngredientStock = async ({ ingredientId, change, reason }) => {
    const ing = ingredients.find(x => x.id === ingredientId);
    if (!ing) return { ok: false };
    const nextQty = Number(ing.quantity) + Number(change);
    if (nextQty < 0) return { ok: false };

    if (!isSupabaseConfigured) {
      const updated = { ...ing, quantity: nextQty };
      setIngredients(prev => prev.map(x => x.id === ingredientId ? updated : x));
      notifyLowStockIngredients([updated]);
      return { ok: true };
    }

    const { error: updErr } = await supabase.from('ingredients').update({ quantity: nextQty }).eq('id', ingredientId);
    if (updErr) return { ok: false, error: updErr.message || 'Failed to update ingredient' };
    const { error: logErr } = await supabase
      .from('ingredient_logs')
      .insert([{ ingredient_id: ingredientId, change: Number(change), reason }]);
    if (logErr) return { ok: false, error: logErr.message || 'Failed to write ingredient log' };
    const updated = { ...ing, quantity: nextQty };
    setIngredients(prev => prev.map(x => x.id === ingredientId ? updated : x));
    notifyLowStockIngredients([updated]);
    return { ok: true };
  };

  const createAddon = async (payload) => {
    const insertPayload = {
      name: (payload.name || '').toString().trim(),
      price_per_unit: Number(payload.price_per_unit || 0),
      variable_quantity: Boolean(payload.variable_quantity)
    };
    if (!insertPayload.name) return { ok: false };

    if (!isSupabaseConfigured) {
      const local = { ...insertPayload, id: Date.now(), created_at: new Date().toISOString() };
      setAddons(prev => [local, ...prev]);
      return { ok: true, addon: local };
    }

    const { data, error } = await supabase
      .from('addons')
      .insert([insertPayload])
      .select('id,name,price_per_unit,variable_quantity,created_at');
    if (error || !data?.[0]) return { ok: false };
    const created = {
      ...data[0],
      price_per_unit: Number(data[0].price_per_unit),
      variable_quantity: Boolean(data[0].variable_quantity)
    };
    setAddons(prev => [created, ...prev]);
    return { ok: true, addon: created };
  };

  const updateAddon = async (id, updates) => {
    const payload = { ...updates };
    if (payload.price_per_unit !== undefined) payload.price_per_unit = Number(payload.price_per_unit);
    if (payload.variable_quantity !== undefined) payload.variable_quantity = Boolean(payload.variable_quantity);

    if (!isSupabaseConfigured) {
      setAddons(prev => prev.map(a => a.id === id ? { ...a, ...payload } : a));
      return { ok: true };
    }

    const { error } = await supabase.from('addons').update(payload).eq('id', id);
    if (error) return { ok: false };
    setAddons(prev => prev.map(a => a.id === id ? { ...a, ...payload } : a));
    return { ok: true };
  };

  const deleteAddon = async (id) => {
    if (!isSupabaseConfigured) {
      setAddons(prev => prev.filter(a => a.id !== id));
      setProductAddons(prev => prev.filter(r => r.addon_id !== id));
      setAddonIngredients(prev => prev.filter(r => r.addon_id !== id));
      return { ok: true };
    }
    const { error } = await supabase.from('addons').delete().eq('id', id);
    if (error) return { ok: false };
    setAddons(prev => prev.filter(a => a.id !== id));
    setProductAddons(prev => prev.filter(r => r.addon_id !== id));
    setAddonIngredients(prev => prev.filter(r => r.addon_id !== id));
    return { ok: true };
  };

  const setProductSizesWithBOM = async (productId, sizes) => {
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
    const rows = (lines || [])
      .filter(l => l.ingredient_id && Number(l.quantity) > 0)
      .map(l => ({
        addon_id: addonId,
        ingredient_id: Number(l.ingredient_id),
        quantity: Number(l.quantity)
      }));

    if (!isSupabaseConfigured) {
      setAddonIngredients(prev => [...prev.filter(r => r.addon_id !== addonId), ...rows]);
      return { ok: true };
    }

    const { error: delErr } = await supabase.from('addon_ingredients').delete().eq('addon_id', addonId);
    if (delErr) return { ok: false };
    if (rows.length > 0) {
      const { error: insErr } = await supabase.from('addon_ingredients').insert(rows);
      if (insErr) return { ok: false };
    }
    await fetchAddonIngredients();
    return { ok: true };
  };

  const setProductAddonsForProduct = async (productId, addonIds) => {
    const ids = (addonIds || []).map(x => Number(x)).filter(Boolean);
    const rows = ids.map(aid => ({ product_id: productId, addon_id: aid }));

    if (!isSupabaseConfigured) {
      setProductAddons(prev => [...prev.filter(r => r.product_id !== productId), ...rows]);
      return { ok: true };
    }

    const { error: delErr } = await supabase.from('product_addons').delete().eq('product_id', productId);
    if (delErr) return { ok: false };
    if (rows.length > 0) {
      const { error: insErr } = await supabase.from('product_addons').insert(rows);
      if (insErr) return { ok: false };
    }
    await fetchProductAddons();
    return { ok: true };
  };

  const adjustProductStock = async ({ productId, change, reason }) => {
    const p = products.find(x => x.id === productId);
    if (!p) return { ok: false };
    const nextStock = Number(p.stock) + Number(change);
    if (nextStock < 0) return { ok: false };

    if (!isSupabaseConfigured) {
      setProducts(prev => prev.map(x => x.id === productId ? { ...x, stock: nextStock } : x));
      return { ok: true };
    }

    const { error: updErr } = await supabase.from('products').update({ stock: nextStock }).eq('id', productId);
    if (updErr) return { ok: false, error: updErr.message || 'Failed to update product stock' };
    const { error: logErr } = await supabase
      .from('inventory_logs')
      .insert([{ product_id: productId, change: Number(change), reason }]);
    if (logErr) return { ok: false, error: logErr.message || 'Failed to write inventory log' };
    setProducts(prev => prev.map(x => x.id === productId ? { ...x, stock: nextStock } : x));
    return { ok: true };
  };

  const checkProductAvailability = (product, qty = 1, productSizeId = null) => {
    const requiredQty = Number(qty || 1);
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

  const processCheckout = async ({ items, paymentMethod, referenceNumber }) => {
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

    if (!isSupabaseConfigured) {
      const fakeSale = {
        id: Date.now(),
        created_at: new Date().toISOString(),
        total_amount: totalAmount,
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
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

    const { data: saleData, error: saleErr } = await supabase.from('sales').insert([{
      account_id: normalizedUser?.id ?? null,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      reference_number: referenceNumber || null
    }]).select();

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
    dailySales,
    salesReport,
    notifications,
    addNotification,
    checkProductAvailability,
    checkCartAvailability,
    processCheckout,
    isDataLoaded,
    accounts,
    fetchAccounts,
    createAccount,
    deleteAccount,
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
    ingredients,
    fetchIngredients,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    adjustIngredientStock,
    addons,
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
    fetchSalesReport
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
