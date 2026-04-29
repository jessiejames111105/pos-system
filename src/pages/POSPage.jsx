import React, { useEffect, useMemo, useState } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Receipt,
  Smartphone,
  CheckCircle2,
  X,
  ShoppingCart,
  ChevronRight,
  Info,
  ChevronLeft,
  Filter,
  Loader2
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import ReceiptPanel from '../components/ReceiptPanel';
import SearchableSelect from '../components/SearchableSelect';

const menuCategories = [
  { id: 'milktea_classic', name: 'Milktea (Classic)', type: 'drink' },
  { id: 'milktea_premium', name: 'Milktea (Premium)', type: 'drink' },
  { id: 'fruit_tea', name: 'Fruit Tea Series', type: 'drink' },
  { id: 'yakult', name: 'Yakult Series', type: 'drink' },
  { id: 'cheesecake', name: 'Cheesecake Series', type: 'drink' },
  { id: 'ice_coffee', name: 'Ice Coffee', type: 'drink' },
  { id: 'estudyante', name: 'Estudyante Blend', type: 'drink' },
  { id: 'fruity_soda', name: 'Fruity Soda', type: 'drink' },
  { id: 'rice_meals', name: 'Rice Meals', type: 'food' },
  { id: 'sandwiches', name: 'Sandwiches', type: 'food' },
  { id: 'burgers', name: 'Burgers', type: 'food' },
  { id: 'snacks', name: 'Snacks', type: 'food' },
  { id: 'waffles', name: 'Waffles', type: 'food' },
];

const mockProducts = {
  milktea_classic: Array.from({ length: 15 }, (_, i) => ({
    id: `classic_${i}`,
    name: `Classic Flavor ${i + 1}`,
    basePrice: 80,
    sizes: ['Regular', 'Large', 'Liter'],
    hasSugarLevel: true,
    ingredients: [
      { name: 'Tea Leaves', quantity: 15 },
      { name: 'Milk', quantity: 0.2 },
      { name: 'Sugar', quantity: 20 },
      { name: 'Cups (12oz)', quantity: 1 }
    ]
  })),
  milktea_premium: Array.from({ length: 10 }, (_, i) => ({
    id: `premium_${i}`,
    name: `Premium Flavor ${i + 1}`,
    basePrice: 110,
    sizes: ['Regular', 'Large', 'Liter'],
    hasSugarLevel: true,
    ingredients: [
      { name: 'Tea Leaves', quantity: 20 },
      { name: 'Milk', quantity: 0.3 },
      { name: 'Sugar', quantity: 25 },
      { name: 'Cups (12oz)', quantity: 1 }
    ]
  })),
  ice_coffee: Array.from({ length: 8 }, (_, i) => ({
    id: `coffee_${i}`,
    name: `Coffee Flavor ${i + 1}`,
    basePrice: 95,
    sizes: ['One Size'],
    hasSugarLevel: false,
    ingredients: [
      { name: 'Coffee Beans', quantity: 18 },
      { name: 'Milk', quantity: 0.15 },
      { name: 'Sugar', quantity: 10 },
      { name: 'Cups (12oz)', quantity: 1 }
    ]
  })),
  rice_meals: [
    { 
      id: 'siomai_silog', 
      name: 'Siomai Silog', 
      basePrice: 75, 
      sizes: ['Serving'], 
      hasSugarLevel: false,
      ingredients: [{ name: 'Rice', quantity: 200 }, { name: 'Siomai', quantity: 4 }]
    },
    { 
      id: 'hotsilog', 
      name: 'Hotsilog', 
      basePrice: 75, 
      sizes: ['Serving'], 
      hasSugarLevel: false,
      ingredients: [{ name: 'Rice', quantity: 200 }, { name: 'Hotdog', quantity: 2 }]
    },
    { 
      id: 'lumpia_silog', 
      name: 'Lumpia Silog', 
      basePrice: 85, 
      sizes: ['Serving'], 
      hasSugarLevel: false,
      ingredients: [{ name: 'Rice', quantity: 200 }, { name: 'Lumpia', quantity: 3 }]
    },
  ],
  waffles: [
    { 
      id: 'waffle_3', 
      name: 'Waffle 3pcs', 
      basePrice: 20, 
      sizes: ['Serving'], 
      hasSugarLevel: false,
      ingredients: [{ name: 'Waffle Mix', quantity: 50 }]
    },
    { 
      id: 'waffle_6', 
      name: 'Waffle 6pcs', 
      basePrice: 35, 
      sizes: ['Serving'], 
      hasSugarLevel: false,
      ingredients: [{ name: 'Waffle Mix', quantity: 100 }]
    },
    { 
      id: 'sq_waffle_1', 
      name: 'Square Waffle 1pc', 
      basePrice: 20, 
      sizes: ['Serving'], 
      hasSugarLevel: false,
      ingredients: [{ name: 'Waffle Mix', quantity: 60 }]
    },
  ]
};

const commonAddons = [];

const POSPage = () => {
  const {
    cart,
    addToCart,
    updateQuantity,
    updateCartItem,
    removeFromCart,
    clearCart,
    cartTotal,
    processCheckout,
    addNotification,
    globalSearchTerm,
    setGlobalSearchTerm,
    checkProductAvailability,
    checkCartAvailability,
    categories,
    products,
    productSizes,
    addons,
    productAddons
  } = useApp();
  const [currentView, setCurrentView] = useState('categories'); // 'categories', 'products'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [editingCartItemId, setEditingCartItemId] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isCheckoutSuccessOpen, setIsCheckoutSuccessOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [cashReceived, setCashReceived] = useState('');
  const [gcashReference, setGcashReference] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Customization State
  const [customSize, setCustomSize] = useState('');
  const [customSugar, setCustomSugar] = useState('100%');
  const [customAddons, setCustomAddons] = useState([]);
  const [addonSearchPick, setAddonSearchPick] = useState('');

  const closeCustomizer = () => {
    setSelectedProduct(null);
    setEditingCartItemId(null);
    setAddonSearchPick('');
  };

  useEffect(() => {
    setSearchTerm(globalSearchTerm || '');
  }, [globalSearchTerm]);

  useEffect(() => {
    if (!isCheckoutModalOpen) return;
    if (paymentMethod !== 'Cash') {
      setCashReceived('');
    } else {
      setCashReceived(String(cartTotal || ''));
    }
    if (paymentMethod !== 'GCash') {
      setGcashReference('');
    }
  }, [isCheckoutModalOpen, paymentMethod, cartTotal]);

  const cashReceivedNumber = Number(cashReceived || 0);
  const cashChange = cashReceivedNumber - Number(cartTotal || 0);
  const cashInvalid = paymentMethod === 'Cash' && (Number.isNaN(cashReceivedNumber) || cashReceivedNumber < Number(cartTotal || 0));
  const gcashReferenceClean = String(gcashReference || '').replaceAll(/[^\d]/g, '');
  const gcashInvalid = paymentMethod === 'GCash' && gcashReferenceClean.length !== 13;

  const availableAddons = useMemo(() => {
    const pid = selectedProduct?.product_id ?? selectedProduct?.id;
    if (!pid) return [];
    const ids = (productAddons || []).filter(r => String(r.product_id) === String(pid)).map(r => r.addon_id);
    return (addons || []).filter(a => ids.some(x => String(x) === String(a.id)));
  }, [addons, productAddons, selectedProduct]);

  const visibleAddons = useMemo(() => {
    const map = new Map();
    for (const a of availableAddons || []) {
      const key = String(a.id ?? a.addon_id);
      if (!key) continue;
      map.set(key, a);
    }
    for (const picked of customAddons || []) {
      const key = String(picked.addon_id ?? picked.id ?? '');
      if (!key || map.has(key)) continue;
      const meta = (addons || []).find(x => String(x.id) === key);
      if (meta) map.set(key, meta);
    }
    return Array.from(map.values());
  }, [addons, availableAddons, customAddons]);

  const addonOptions = useMemo(() => {
    return (visibleAddons || []).map(a => ({
      value: a.id ?? a.addon_id,
      label: a.name,
      group: 'Add-ons'
    }));
  }, [visibleAddons]);

  const addonByKey = useMemo(() => {
    const map = new Map();
    for (const a of (visibleAddons || [])) {
      const key = String(a.id ?? a.addon_id);
      map.set(key, a);
    }
    return map;
  }, [visibleAddons]);

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setCurrentView('products');
  };

  const handleProductClick = (product) => {
    const isAvailable = checkProductAvailability(product, 1);
    if (!isAvailable) {
      addNotification(`Out of stock: ${product?.name}`, 'warning');
      return;
    }
    setSelectedProduct(product);
    setCustomSize(product.sizeOptions?.[0]?.key || '');
    setCustomSugar('100%');
    setCustomAddons([]);
    setAddonSearchPick('');
    setEditingCartItemId(null);
  };

  const handleCartItemClick = (item) => {
    setEditingCartItemId(item.id);
    setSelectedProduct(item);
    const sizeKey = (() => {
      const opts = item.sizeOptions || [];
      if (item.product_size_id != null) {
        const found = opts.find(o => String(o.id) === String(item.product_size_id));
        if (found?.key) return found.key;
      }
      if (item.size_name || item.displaySize) {
        const found = opts.find(o => String(o.name) === String(item.size_name || item.displaySize));
        if (found?.key) return found.key;
      }
      return opts[0]?.key || '';
    })();
    setCustomSize(sizeKey);
    setCustomSugar(item.displaySugar || '100%');
    const fromDisplay = (item.displayAddons || []).map(a => ({
      addon_id: a.addon_id ?? a.id ?? null,
      name: a.name,
      unit_price: a.unit_price ?? a.price ?? 0,
      quantity: a.quantity
    })).filter(a => a.addon_id != null);
    const fromRaw = (item.addons || []).map(a => ({
      addon_id: a.addon_id,
      name: (addons || []).find(x => String(x.id) === String(a.addon_id))?.name ?? 'Addon',
      unit_price: a.unit_price ?? 0,
      quantity: a.quantity
    }));
    setCustomAddons(fromDisplay.length > 0 ? fromDisplay : fromRaw);
    setAddonSearchPick('');
  };

  const handleAddtoCheckout = () => {
    const addonsTotal = customAddons.reduce((sum, a) => sum + Number(a.unit_price || 0) * Number(a.quantity || 0), 0);
    const selectedSize =
      selectedProduct?.sizeOptions?.find(s => s.key === customSize) ||
      selectedProduct?.sizeOptions?.[0] ||
      { id: null, name: 'Standard', price: Number(selectedProduct?.basePrice || 0) };
    const basePrice = Number(selectedSize.price || 0);
    const patch = {
      product_id: selectedProduct?.product_id ?? selectedProduct?.id,
      product_size_id: selectedSize.id,
      size_name: selectedSize.name,
      displaySize: selectedSize.name,
      displaySugar: customSugar,
      displayAddons: customAddons.map(a => ({ name: a.name, price: a.unit_price, quantity: a.quantity })),
      addons: customAddons.map(a => ({ addon_id: a.addon_id, unit_price: a.unit_price, quantity: a.quantity })),
      basePrice,
      price: basePrice + addonsTotal
    };

    if (editingCartItemId) {
      updateCartItem(editingCartItemId, patch);
      closeCustomizer();
      return;
    }

    const finalItem = {
      ...selectedProduct,
      ...patch,
      id: `${selectedProduct.id}_${Date.now()}`,
      quantity: 1
    };
    addToCart(finalItem);
    closeCustomizer();
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (isCheckingOut) return;

    const cartCheck = checkCartAvailability(cart);
    if (!cartCheck.ok) {
      addNotification(`Insufficient stock: ${cartCheck.missing.map(m => m.name).join(', ')}`, 'error');
      return;
    }

    if (paymentMethod === 'Cash' && cashInvalid) {
      addNotification('Enter the cash amount received (must be at least the total).', 'warning');
      return;
    }
    if (paymentMethod === 'GCash' && gcashInvalid) {
      addNotification('Enter a valid 13-digit GCash reference number.', 'warning');
      return;
    }

    const transactionData = {
      items: cart.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        details: `${item.displaySize}`,
        addons: (item.displayAddons || []).map(a => ({
          ...a,
          quantity: Number(a.quantity || 0) * Number(item.quantity || 0)
        }))
      })),
      total: cartTotal,
      paymentMethod,
      referenceNumber: paymentMethod === 'GCash' ? gcashReferenceClean : null,
      cashReceived: paymentMethod === 'Cash' ? cashReceivedNumber : null,
      changeAmount: paymentMethod === 'Cash' ? Math.max(0, cashChange) : null
    };

    const checkoutItems = cart.map(item => ({
      product_id: item.product_id,
      product_size_id: item.product_size_id ?? null,
      size_name: item.size_name ?? item.displaySize ?? null,
      name: item.name,
      price: item.basePrice ?? item.price,
      quantity: item.quantity,
      addons: item.addons || []
    }));

    setIsCheckingOut(true);
    try {
      const result = await processCheckout({
        items: checkoutItems,
        paymentMethod,
        referenceNumber: paymentMethod === 'GCash' ? gcashReferenceClean : null,
        cashReceived: paymentMethod === 'Cash' ? cashReceivedNumber : null
      });
      if (!result.ok) {
        addNotification('Checkout failed. Please try again.', 'error');
        return;
      }

      setLastTransaction({ ...transactionData, id: result.sale?.id ?? null, date: new Date().toISOString() });
      
      clearCart();
      setIsCheckoutModalOpen(false);
      setIsCheckoutSuccessOpen(false);
      setIsReceiptModalOpen(true);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const setAddonQuantity = (addon, qty) => {
    const addonId = addon?.id ?? addon?.addon_id;
    const unitPrice = Number(addon?.price_per_unit ?? addon?.unit_price ?? 0);
    const nextQty = Math.max(0, Math.floor(Number(qty || 0)));
    setCustomAddons(prev => {
      const filtered = prev.filter(a => String(a.addon_id) !== String(addonId));
      if (nextQty <= 0) return filtered;
      return [
        ...filtered,
        { addon_id: addonId, name: addon?.name ?? 'Addon', unit_price: unitPrice, quantity: nextQty }
      ];
    });
  };

  const posProducts = useMemo(() => {
    return (products || []).map(p => ({
      ...p,
      sizeOptions: (() => {
        const sizes = (productSizes || [])
          .filter(s => String(s.product_id) === String(p.id))
          .map(s => ({
            key: String(s.id),
            id: s.id,
            name: s.name,
            price: Number(s.price || 0)
          }));
        if (sizes.length > 0) return sizes;
        return [{
          key: `default-${p.id}`,
          id: null,
          name: 'Standard',
          price: Number(p.price || 0)
        }];
      })(),
      basePrice: Number(p.price || 0),
      icon: ''
    }));
  }, [products, productSizes]);

  const filteredProducts = useMemo(() => {
    const term = String(searchTerm || '').toLowerCase();
    const base = selectedCategory
      ? posProducts.filter(p => String(p.category_id) === String(selectedCategory.id))
      : posProducts;
    if (!term) {
      return selectedCategory ? base : [];
    }
    return base.filter(p => p.name.toLowerCase().includes(term));
  }, [posProducts, searchTerm, selectedCategory]);

  useEffect(() => {
    const term = String(searchTerm || '').trim();
    if (term) {
      setCurrentView('products');
      return;
    }
    if (!selectedCategory) {
      setCurrentView('categories');
    }
  }, [searchTerm, selectedCategory]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] lg:h-[calc(100vh-120px)] relative">
      {/* Left: Main Area (Categories or Products) */}
      <div className={`flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden ${isMobileCartOpen ? 'hidden lg:flex' : 'flex'}`}>
        {/* Header with Search & Navigation */}
        <div className="p-4 lg:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {currentView === 'products' && selectedCategory && (
              <button 
                onClick={() => setCurrentView('categories')}
                className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-primary-50 hover:text-primary-600 transition-all"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight uppercase truncate">
              {currentView === 'categories' ? 'Menu Categories' : (selectedCategory?.name || 'Search Results')}
            </h1>
          </div>
          
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Quick Search..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setGlobalSearchTerm(e.target.value);
              }}
              className="w-full sm:w-64 lg:w-80 rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-hide">
          {currentView === 'categories' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
              {categories.map(cat => (
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat)}
                  className="flex flex-col items-center justify-center p-6 lg:p-8 rounded-3xl border-2 border-slate-100 bg-slate-50 hover:border-primary-300 hover:bg-white transition-all group"
                >
                  <span className="font-bold text-slate-700 uppercase tracking-tight text-xs lg:text-sm text-center">{cat.name}</span>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {filteredProducts.map(product => (
                (() => {
                  const isAvailable = checkProductAvailability(product, 1);
                  const isNoStock = product?.stock != null && Number(product.stock || 0) <= 0;
                  return (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={product.id}
                  disabled={!isAvailable}
                  onClick={() => handleProductClick(product)}
                  className={`flex flex-col p-4 lg:p-5 rounded-3xl border-2 transition-all text-left group shadow-sm ${
                    isAvailable
                      ? 'border-slate-100 bg-white hover:border-primary-500'
                      : 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-primary-600 font-bold text-sm lg:text-lg">₱{product.basePrice}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 leading-tight mb-1 text-sm lg:text-base line-clamp-2">{product.name}</h3>
                  <p className="text-[10px] lg:text-xs text-slate-400 font-bold uppercase tracking-wide">
                    {isAvailable ? 'Available' : (isNoStock ? 'No Stock' : 'Unavailable')}
                  </p>
                  {!isAvailable && (
                    <span className="mt-3 inline-flex w-fit rounded-lg bg-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-slate-600">
                      {isNoStock ? 'No Stock' : 'Not Available'}
                    </span>
                  )}
                </motion.button>
                  );
                })()
              ))}
            </div>
          )}
        </div>

        {/* Footer Category Bar */}
        {currentView === 'products' && (
          <div className="p-3 lg:p-4 border-t border-slate-100 flex gap-2 lg:gap-3 overflow-x-auto bg-slate-50/50 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat)}
                className={`px-3 lg:px-4 py-2 rounded-xl text-[10px] lg:text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap border-2 ${
                  selectedCategory?.id === cat.id 
                    ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-200' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-primary-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Checkout Sidebar */}
      <div className={`w-full lg:w-[400px] flex flex-col gap-6 ${isMobileCartOpen ? 'flex' : 'hidden lg:flex'}`}>
        <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <ShoppingCart size={22} className="text-primary-600" />
              Checkout List
            </h2>
            <div className="flex items-center gap-3">
              <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-bold">
                {cart.length} ITEMS
              </span>
              <button 
                onClick={() => setIsMobileCartOpen(false)}
                className="lg:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          {/* ... (rest of cart items) ... */}

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-40">
                <ShoppingCart size={64} className="mb-4 text-slate-300" />
                <p className="font-bold text-slate-400 uppercase tracking-wide">No orders yet</p>
              </div>
            ) : (
              <AnimatePresence>
                {cart.map(item => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={item.id}
                    onClick={() => handleCartItemClick(item)}
                    className="group relative flex flex-col p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary-300 hover:bg-white transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-900 truncate flex-1">{item.name}</h4>
                      <span className="font-bold text-primary-600">₱{item.price * item.quantity}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{item.displaySize} {item.displaySugar && `| ${item.displaySugar}`}</span>
                        {item.displayAddons.length > 0 && (
                          <span className="text-[10px] font-medium text-primary-500">
                            +{item.displayAddons.map(a => `${a.name} x${Number(a.quantity || 0)}`).join(', ')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-1 shadow-sm" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-4 text-center font-bold text-sm">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Checkout Footer */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-400 uppercase tracking-wide">Subtotal</span>
                <span className="font-bold text-slate-900">₱{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-lg pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900 uppercase tracking-tight">Total Payable</span>
                <span className="font-bold text-primary-600 text-2xl tracking-tight">₱{cartTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => setIsCancelModalOpen(true)}
                className="col-span-1 bg-white border-2 border-red-100 text-red-500 py-4 rounded-2xl font-bold uppercase text-xs hover:bg-red-50 hover:border-red-200 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button 
                disabled={cart.length === 0}
                onClick={() => setIsCheckoutModalOpen(true)}
                className="col-span-2 bg-primary-600 text-white py-4 rounded-2xl font-bold uppercase tracking-wide text-sm hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all active:scale-95 disabled:bg-slate-200 disabled:shadow-none flex items-center justify-center gap-3"
              >
                <CreditCard size={20} />
                Checkout ₱{cartTotal.toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Middle: Product Selection Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={closeCustomizer}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">{selectedProduct.name}</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-wide text-xs">Customize your order</p>
                  </div>
                  <button onClick={closeCustomizer} className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                      <Filter size={14} /> Select Size <span className="text-rose-500">*</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(selectedProduct.sizeOptions || []).map(size => {
                        const selected = customSize === size.key;
                        return (
                          <button
                            key={size.key}
                            type="button"
                            onClick={() => setCustomSize(size.key)}
                            className={`p-4 rounded-2xl text-left font-bold transition-all border-2 ${
                              selected
                                ? 'bg-white border-primary-600 text-slate-900 shadow-md shadow-primary-100/40'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${selected ? 'border-primary-600' : 'border-slate-300'}`}>
                                  {selected ? <span className="h-2.5 w-2.5 rounded-full bg-primary-600" /> : null}
                                </span>
                                <span className="truncate">{size.name}</span>
                              </div>
                              <span className="font-extrabold">₱{Number(size.price || 0).toLocaleString()}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Sugar Level</h4>
                    <div className="flex items-center justify-between gap-2">
                      {['0%', '25%', '50%', '75%', '100%'].map(lvl => {
                        const selected = customSugar === lvl;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setCustomSugar(lvl)}
                            className="flex flex-col items-center gap-2"
                          >
                            <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${selected ? 'border-primary-600' : 'border-slate-300'}`}>
                              {selected ? <span className="h-2.5 w-2.5 rounded-full bg-primary-600" /> : null}
                            </span>
                            <span className={`text-xs font-bold uppercase tracking-wide ${selected ? 'text-primary-700' : 'text-slate-500'}`}>
                              {lvl}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {visibleAddons.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                        Add-ons
                      </h4>
                      <SearchableSelect
                        value={addonSearchPick}
                        options={addonOptions}
                        placeholder="Type add-on name..."
                        onChange={(v) => {
                          setAddonSearchPick(v);
                          const key = String(v || '');
                          if (!key) return;
                          const addon = addonByKey.get(key);
                          if (!addon) return;
                          const addonId = addon.id ?? addon.addon_id;
                          const selected = customAddons.find(a => String(a.addon_id) === String(addonId));
                          const qty = Number(selected?.quantity || 0);
                          setAddonQuantity(addon, qty > 0 ? qty + 1 : 1);
                        }}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {visibleAddons.map(addon => {
                        const addonId = addon.id ?? addon.addon_id;
                        const selected = customAddons.find(a => a.addon_id === addonId);
                        const unitPrice = Number(addon.price_per_unit ?? addon.unit_price ?? addon.price ?? 0);
                        const qty = Number(selected?.quantity || 0);
                        const isSelected = qty > 0;
                        return (
                          <div
                            key={addonId}
                            className={`rounded-2xl border-2 p-4 transition-all ${
                              isSelected ? 'border-primary-600 bg-primary-50/40' : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setAddonQuantity(addon, isSelected ? 0 : 1)}
                              className="w-full flex items-center gap-3 text-left"
                            >
                              <span className={`h-5 w-5 rounded-md border-2 flex items-center justify-center ${isSelected ? 'border-primary-600 bg-primary-600' : 'border-slate-300 bg-white'}`}>
                                {isSelected ? <span className="h-2 w-2 rounded-sm bg-white" /> : null}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-900 truncate">{addon.name}</div>
                                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">+ ₱{unitPrice.toLocaleString()}</div>
                              </div>
                              <div className="text-xs font-extrabold text-slate-900">{isSelected ? `x${qty}` : ''}</div>
                            </button>
                            {isSelected && (
                              <div className="mt-3 flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setAddonQuantity(addon, qty - 1)}
                                  className="h-9 w-9 rounded-xl border-2 border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-700 transition-all flex items-center justify-center bg-white"
                                >
                                  <Minus size={16} />
                                </button>
                                <div className="min-w-10 text-center font-bold text-slate-900">{qty}</div>
                                <button
                                  type="button"
                                  onClick={() => setAddonQuantity(addon, qty + 1)}
                                  className="h-9 w-9 rounded-xl border-2 border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-700 transition-all flex items-center justify-center bg-white"
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleAddtoCheckout}
                  className="w-full bg-primary-600 text-white py-6 rounded-[30px] font-bold uppercase tracking-wide text-lg hover:bg-primary-700 shadow-2xl shadow-primary-200 transition-all active:scale-[0.98] flex items-center justify-center gap-4"
                >
                  {editingCartItemId ? 'Save Changes' : 'Add to Checkout'}
                  <ChevronRight size={24} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setPreviewItem(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl text-center"
            >
              <div className="h-20 w-20 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Info size={40} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2 uppercase">{previewItem.name}</h2>
              <p className="text-slate-400 font-bold uppercase tracking-wide text-xs mb-8">Item Summary</p>
              
              <div className="bg-slate-50 rounded-3xl p-6 space-y-4 mb-8 text-left">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Selected Size</span>
                  <span className="font-bold text-slate-900">{previewItem.displaySize}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Sugar Level</span>
                  <span className="font-bold text-slate-900">{previewItem.displaySugar || '100%'}</span>
                </div>
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Add-ons</span>
                  <div className="text-right">
                    {previewItem.displayAddons.length > 0 ? (
                      previewItem.displayAddons.map(a => (
                        <div key={a.name} className="font-bold text-slate-900">
                          {a.name} x{Number(a.quantity || 0)} (₱{Number(a.price || 0).toLocaleString()})
                        </div>
                      ))
                    ) : (
                      <span className="font-bold text-slate-300">NONE</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-slate-900 uppercase text-sm">Unit Price</span>
                  <span className="font-bold text-primary-600 text-xl tracking-tight">₱{previewItem.price}</span>
                </div>
              </div>

              <button 
                onClick={() => setPreviewItem(null)}
                className="w-full bg-slate-900 text-white py-5 rounded-[25px] font-bold uppercase tracking-wide hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
              >
                Close Preview
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Order Confirmation */}
      <AnimatePresence>
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-red-900/40 backdrop-blur-sm" onClick={() => setIsCancelModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white w-full max-w-sm rounded-[40px] p-10 shadow-2xl text-center">
              <div className="h-20 w-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2 uppercase">Cancel Transaction?</h2>
              <p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed">This will clear all items in the current checkout list. This action cannot be undone.</p>
              
              <div className="flex gap-3">
                <button onClick={() => setIsCancelModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold uppercase text-xs hover:bg-slate-200 transition-all">Keep Order</button>
                <button onClick={() => { clearCart(); setIsCancelModalOpen(false); }} className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-bold uppercase text-xs hover:bg-red-600 shadow-lg shadow-red-200 transition-all">Yes, Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout Selection Modal */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsCheckoutModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-lg rounded-[40px] p-10 shadow-2xl">
              <div className="text-center mb-8">
                <div className="h-20 w-20 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <CreditCard size={40} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2 uppercase">Complete Checkout</h2>
                <p className="text-slate-500 font-bold uppercase tracking-wide text-xs">Total Amount: ₱{cartTotal.toLocaleString()}</p>
              </div>

              <div className="space-y-4 mb-8">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Select Payment Method</h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'Cash', icon: CreditCard, label: 'Cash Payment' },
                    { id: 'GCash', icon: Smartphone, label: 'E-Wallet / GCash' },
                  ].map(method => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${
                        paymentMethod === method.id 
                          ? 'bg-primary-50 border-primary-600 text-primary-700 shadow-lg' 
                          : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <method.icon size={32} />
                      <span className="font-bold text-xs uppercase tracking-tight">{method.label}</span>
                    </button>
                  ))}
                </div>

                {paymentMethod === 'Cash' && (
                  <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Cash Received</span>
                      <span className="text-xs font-bold text-slate-900">Total: ₱{Number(cartTotal || 0).toLocaleString()}</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className={`w-full rounded-2xl border-2 p-4 text-lg font-bold focus:ring-4 focus:ring-primary-500/10 outline-none transition-all ${
                        cashInvalid ? 'border-rose-300 bg-rose-50/30 focus:border-rose-400' : 'border-slate-200 bg-slate-50 focus:border-primary-500'
                      }`}
                      placeholder="Enter amount"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Change</span>
                      <span className={`text-sm font-bold ${cashInvalid ? 'text-slate-300' : 'text-emerald-600'}`}>
                        ₱{cashInvalid ? '0' : Number(Math.max(0, cashChange)).toLocaleString()}
                      </span>
                    </div>
                    {cashInvalid && (
                      <div className="text-xs font-bold text-rose-600 uppercase tracking-wide">
                        Cash received must be at least the total.
                      </div>
                    )}
                  </div>
                )}
                {paymentMethod === 'GCash' && (
                  <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Reference Number</span>
                      <span className="text-xs font-bold text-slate-900">13 digits</span>
                    </div>
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={13}
                      value={gcashReference}
                      onChange={(e) => setGcashReference(e.target.value)}
                      className={`w-full rounded-2xl border-2 p-4 text-lg font-bold focus:ring-4 focus:ring-primary-500/10 outline-none transition-all ${
                        gcashInvalid ? 'border-rose-300 bg-rose-50/30 focus:border-rose-400' : 'border-slate-200 bg-slate-50 focus:border-primary-500'
                      }`}
                      placeholder="Enter 13-digit reference"
                    />
                    {gcashInvalid && (
                      <div className="text-xs font-bold text-rose-600 uppercase tracking-wide">
                        Reference number must be exactly 13 digits.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="flex-1 py-5 border-2 border-slate-100 text-slate-400 font-bold rounded-3xl uppercase tracking-wide text-xs hover:bg-slate-50 transition-all"
                >
                  Go Back
                </button>
                <button 
                  onClick={handleCheckout}
                  disabled={isCheckingOut || (paymentMethod === 'Cash' && cashInvalid) || (paymentMethod === 'GCash' && gcashInvalid)}
                  className="flex-2 py-5 bg-primary-600 text-white font-bold rounded-3xl uppercase tracking-wide text-sm hover:bg-primary-700 shadow-xl shadow-primary-200 transition-all flex items-center justify-center gap-3"
                >
                  {isCheckingOut ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                  Confirm ₱{cartTotal.toLocaleString()}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout Success Modal */}
      <AnimatePresence>
        {isCheckoutSuccessOpen && lastTransaction && (
          <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-md"
              onClick={() => setIsCheckoutSuccessOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-10 bg-emerald-50 text-center border-b border-emerald-100">
                <div className="h-20 w-20 bg-white text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <CheckCircle2 size={48} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2 uppercase">Checkout Completed</h2>
                <p className="text-emerald-700 font-bold uppercase tracking-wide text-[10px]">Payment Confirmed</p>
              </div>

              <div className="p-10 space-y-6">
                <div className="rounded-3xl bg-slate-50 border border-slate-200 p-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Payment Method</span>
                    <span className="text-sm font-bold text-slate-900">{String(lastTransaction.paymentMethod || '').toUpperCase()}</span>
                  </div>
                  {lastTransaction.referenceNumber ? (
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Reference Number</span>
                      <span className="text-sm font-bold text-slate-900">{lastTransaction.referenceNumber}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Cash Received</span>
                    <span className="text-sm font-bold text-slate-900">
                      ₱{Number((String(lastTransaction.paymentMethod || '').toLowerCase().includes('cash') ? lastTransaction.cashReceived : lastTransaction.total) || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Change</span>
                    <span className="text-sm font-bold text-emerald-600">
                      ₱{Number((String(lastTransaction.paymentMethod || '').toLowerCase().includes('cash') ? lastTransaction.changeAmount : 0) || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Items</span>
                    <span className="text-sm font-bold text-slate-900">{lastTransaction.items.length}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Total Paid</span>
                    <span className="text-xl font-bold text-primary-600 tracking-tight">₱{lastTransaction.total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsCheckoutSuccessOpen(false)}
                    className="flex-1 py-5 bg-slate-900 text-white font-bold rounded-3xl uppercase tracking-wide text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => {
                      setIsCheckoutSuccessOpen(false);
                      setIsReceiptModalOpen(true);
                    }}
                    className="flex-1 py-5 bg-primary-600 text-white font-bold rounded-3xl uppercase tracking-wide text-xs hover:bg-primary-700 transition-all shadow-xl shadow-primary-200 flex items-center justify-center gap-2"
                  >
                    <Receipt size={18} />
                    View Receipt
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {isReceiptModalOpen && lastTransaction && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="relative">
              <ReceiptPanel
                transaction={lastTransaction}
                onClose={() => setIsReceiptModalOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Floating Cart Button */}
      {cart.length > 0 && !isMobileCartOpen && (
        <motion.button
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          onClick={() => setIsMobileCartOpen(true)}
          className="lg:hidden fixed bottom-24 right-6 h-16 w-16 bg-primary-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 border-4 border-white"
        >
          <div className="relative">
            <ShoppingCart size={28} />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
              {cart.length}
            </span>
          </div>
        </motion.button>
      )}
    </div>
  );
};

export default POSPage;
