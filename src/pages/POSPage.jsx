import React, { useMemo, useState } from 'react';
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
  Filter
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

const menuCategories = [
  { id: 'milktea_classic', name: 'Milktea (Classic)', icon: '🧋', type: 'drink' },
  { id: 'milktea_premium', name: 'Milktea (Premium)', icon: '✨', type: 'drink' },
  { id: 'fruit_tea', name: 'Fruit Tea Series', icon: '🍎', type: 'drink' },
  { id: 'yakult', name: 'Yakult Series', icon: '🥛', type: 'drink' },
  { id: 'cheesecake', name: 'Cheesecake Series', icon: '🍰', type: 'drink' },
  { id: 'ice_coffee', name: 'Ice Coffee', icon: '☕', type: 'drink' },
  { id: 'estudyante', name: 'Estudyante Blend', icon: '🎒', type: 'drink' },
  { id: 'fruity_soda', name: 'Fruity Soda', icon: '🥤', type: 'drink' },
  { id: 'rice_meals', name: 'Rice Meals', icon: '🍛', type: 'food' },
  { id: 'sandwiches', name: 'Sandwiches', icon: '🥪', type: 'food' },
  { id: 'burgers', name: 'Burgers', icon: '🍔', type: 'food' },
  { id: 'snacks', icon: '🍟', name: 'Snacks', type: 'food' },
  { id: 'waffles', icon: '🧇', name: 'Waffles', type: 'food' },
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
    removeFromCart,
    clearCart,
    cartTotal,
    processCheckout,
    addNotification,
    checkProductAvailability,
    checkCartAvailability,
    categories,
    products,
    addons,
    productAddons
  } = useApp();
  const [currentView, setCurrentView] = useState('categories'); // 'categories', 'products'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isCheckoutSuccessOpen, setIsCheckoutSuccessOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Customization State
  const [customSize, setCustomSize] = useState('');
  const [customSugar, setCustomSugar] = useState('100%');
  const [customAddons, setCustomAddons] = useState([]);

  const availableAddons = useMemo(() => {
    const pid = selectedProduct?.id;
    if (!pid) return [];
    const ids = (productAddons || []).filter(r => Number(r.product_id) === Number(pid)).map(r => r.addon_id);
    return (addons || []).filter(a => ids.includes(a.id));
  }, [addons, productAddons, selectedProduct]);

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
    setCustomSize(product.sizes[0]);
    setCustomSugar('100%');
    setCustomAddons([]);
  };

  const handleAddtoCheckout = () => {
    const addonsTotal = customAddons.reduce((sum, a) => sum + Number(a.unit_price || 0) * Number(a.quantity || 0), 0);
    const finalItem = {
      ...selectedProduct,
      product_id: selectedProduct.id,
      id: `${selectedProduct.id}_${Date.now()}`,
      displaySize: customSize,
      displaySugar: selectedProduct.hasSugarLevel ? customSugar : null,
      displayAddons: customAddons.map(a => ({ name: a.name, price: a.unit_price, quantity: a.quantity })),
      addons: customAddons.map(a => ({ addon_id: a.addon_id, unit_price: a.unit_price, quantity: a.quantity })),
      price: selectedProduct.basePrice + addonsTotal,
      quantity: 1
    };
    addToCart(finalItem);
    setSelectedProduct(null);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const cartCheck = checkCartAvailability(cart);
    if (!cartCheck.ok) {
      addNotification(`Insufficient stock: ${cartCheck.missing.map(m => m.name).join(', ')}`, 'error');
      return;
    }

    const transactionData = {
      items: cart.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        details: `${item.displaySize}${item.displaySugar ? ` | ${item.displaySugar}` : ''}`,
        addons: item.displayAddons || []
      })),
      total: cartTotal,
      paymentMethod
    };

    const checkoutItems = cart.map(item => ({
      product_id: item.product_id,
      name: item.name,
      price: item.basePrice ?? item.price,
      quantity: item.quantity,
      addons: item.addons || []
    }));

    const result = await processCheckout({
      items: checkoutItems,
      paymentMethod,
      referenceNumber: null
    });
    if (!result.ok) {
      addNotification('Checkout failed. Please try again.', 'error');
      return;
    }

    setLastTransaction({ ...transactionData, date: new Date().toISOString() });
    
    // Reset state
    clearCart();
    setIsCheckoutModalOpen(false);
    setIsCheckoutSuccessOpen(true);
  };

  const setAddonQuantity = (addon, qty) => {
    const addonId = addon?.id ?? addon?.addon_id;
    const unitPrice = Number(addon?.price_per_unit ?? addon?.unit_price ?? 0);
    const nextQty = Math.max(0, Math.floor(Number(qty || 0)));
    setCustomAddons(prev => {
      const filtered = prev.filter(a => a.addon_id !== addonId);
      if (nextQty <= 0) return filtered;
      return [
        ...filtered,
        { addon_id: addonId, name: addon?.name ?? 'Addon', unit_price: unitPrice, quantity: nextQty }
      ];
    });
  };

  const categoryIcon = (name) => {
    const n = String(name || '').toLowerCase();
    if (n.includes('drink')) return '🥤';
    if (n.includes('snack')) return '🍟';
    if (n.includes('meal') || n.includes('rice')) return '🍛';
    return '📦';
  };

  const posProducts = useMemo(() => {
    return (products || []).map(p => ({
      ...p,
      basePrice: Number(p.price || 0),
      sizes: ['Standard'],
      hasSugarLevel: false,
      icon: '📦'
    }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return [];
    const term = String(searchTerm || '').toLowerCase();
    return posProducts
      .filter(p => Number(p.category_id) === Number(selectedCategory.id))
      .filter(p => p.name.toLowerCase().includes(term));
  }, [posProducts, searchTerm, selectedCategory]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] lg:h-[calc(100vh-120px)] relative">
      {/* Left: Main Area (Categories or Products) */}
      <div className={`flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden ${isMobileCartOpen ? 'hidden lg:flex' : 'flex'}`}>
        {/* Header with Search & Navigation */}
        <div className="p-4 lg:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {currentView === 'products' && (
              <button 
                onClick={() => setCurrentView('categories')}
                className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-primary-50 hover:text-primary-600 transition-all"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight uppercase truncate">
              {currentView === 'categories' ? 'Menu Categories' : selectedCategory?.name}
            </h1>
          </div>
          
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Quick Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                  <span className="text-4xl lg:text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">{categoryIcon(cat.name)}</span>
                  <span className="font-bold text-slate-700 uppercase tracking-tight text-xs lg:text-sm text-center">{cat.name}</span>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {filteredProducts.map(product => (
                (() => {
                  const isAvailable = checkProductAvailability(product, 1);
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
                    <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl lg:text-2xl group-hover:bg-primary-50 transition-colors">
                      {categoryIcon(selectedCategory?.name)}
                    </div>
                    <span className="text-primary-600 font-bold text-sm lg:text-lg">₱{product.basePrice}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 leading-tight mb-1 text-sm lg:text-base line-clamp-2">{product.name}</h3>
                  <p className="text-[10px] lg:text-xs text-slate-400 font-bold uppercase tracking-wide">
                    {isAvailable ? 'Available' : 'Unavailable'}
                  </p>
                  {!isAvailable && (
                    <span className="mt-3 inline-flex w-fit rounded-lg bg-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-slate-600">
                      Not Available
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
                    onClick={() => setPreviewItem(item)}
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
                          <span className="text-[10px] font-medium text-primary-500">+{item.displayAddons.map(a => a.name).join(', ')}</span>
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
              onClick={() => setSelectedProduct(null)}
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
                  <button onClick={() => setSelectedProduct(null)} className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Sizes */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                      <Filter size={14} /> Select Size
                    </h4>
                    <div className="flex flex-col gap-2">
                      {selectedProduct.sizes.map(size => (
                        <button
                          key={size}
                          onClick={() => setCustomSize(size)}
                          className={`p-4 rounded-2xl text-left font-bold transition-all border-2 ${
                            customSize === size 
                              ? 'bg-primary-50 border-primary-600 text-primary-700 shadow-md' 
                              : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sugar Levels & Addons */}
                  <div className="space-y-8">
                    {selectedProduct.hasSugarLevel && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Sugar Level</h4>
                        <div className="flex flex-wrap gap-2">
                          {['0%', '25%', '50%', '75%', '100%'].map(lvl => (
                            <button
                              key={lvl}
                              onClick={() => setCustomSugar(lvl)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                                customSugar === lvl 
                                  ? 'bg-slate-900 border-slate-900 text-white' 
                                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Add-ons</h4>
                      <div className="space-y-2">
                        {(availableAddons.length > 0 ? availableAddons : commonAddons).map(addon => {
                          const addonId = addon.id ?? addon.addon_id;
                          const selected = customAddons.find(a => a.addon_id === addonId);
                          const unitPrice = Number(addon.price_per_unit ?? addon.unit_price ?? addon.price ?? 0);
                          const variable = Boolean(addon.variable_quantity);
                          const qty = Number(selected?.quantity || 0);

                          if (variable) {
                            return (
                              <div key={addonId} className="flex items-center justify-between gap-3 p-3 rounded-2xl border-2 border-slate-200 bg-white">
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 truncate">{addon.name}</p>
                                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">₱{unitPrice.toLocaleString()} / unit</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setAddonQuantity(addon, qty - 1)}
                                    className="h-10 w-10 rounded-xl border-2 border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-700 transition-all flex items-center justify-center"
                                  >
                                    <Minus size={16} />
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={qty}
                                    onChange={(e) => setAddonQuantity(addon, e.target.value)}
                                    className="w-16 h-10 text-center rounded-xl border-2 border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                  />
                                  <button
                                    onClick={() => setAddonQuantity(addon, qty + 1)}
                                    className="h-10 w-10 rounded-xl border-2 border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-700 transition-all flex items-center justify-center"
                                  >
                                    <Plus size={16} />
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          const checked = qty > 0;
                          return (
                            <button
                              key={addonId}
                              onClick={() => setAddonQuantity(addon, checked ? 0 : 1)}
                              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all border-2 ${
                                checked
                                  ? 'bg-primary-600 border-primary-600 text-white shadow-md' 
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-primary-300'
                              }`}
                            >
                              <span className="truncate">{addon.name}</span>
                              <span>₱{unitPrice.toLocaleString()}</span>
                            </button>
                          );
                        })}

                        {availableAddons.length === 0 && commonAddons.length === 0 && (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                            No add-ons available for this product.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleAddtoCheckout}
                  className="w-full bg-primary-600 text-white py-6 rounded-[30px] font-bold uppercase tracking-wide text-lg hover:bg-primary-700 shadow-2xl shadow-primary-200 transition-all active:scale-[0.98] flex items-center justify-center gap-4"
                >
                  Add to Checkout
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
                {previewItem.displaySugar && (
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <span className="font-bold text-slate-400 uppercase text-[10px]">Sugar Level</span>
                    <span className="font-bold text-slate-900">{previewItem.displaySugar}</span>
                  </div>
                )}
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Add-ons</span>
                  <div className="text-right">
                    {previewItem.displayAddons.length > 0 ? (
                      previewItem.displayAddons.map(a => (
                        <div key={a.name} className="font-bold text-slate-900">{a.name} (₱{a.price})</div>
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
                  className="flex-2 py-5 bg-primary-600 text-white font-bold rounded-3xl uppercase tracking-wide text-sm hover:bg-primary-700 shadow-xl shadow-primary-200 transition-all flex items-center justify-center gap-3"
                >
                  <CheckCircle2 size={20} />
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
                    <span className="text-sm font-bold text-slate-900">{lastTransaction.paymentMethod}</span>
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
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
              <div className="p-10 bg-emerald-50 text-emerald-600 text-center border-b border-emerald-100">
                <div className="h-20 w-20 bg-white text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <CheckCircle2 size={48} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2 uppercase">Payment Successful!</h2>
                <p className="text-emerald-700 font-bold uppercase tracking-wide text-[10px]">Transaction Completed</p>
              </div>

              <div className="p-10 flex-1 overflow-y-auto space-y-8 scrollbar-hide">
                <div className="text-center space-y-1">
                  <p className="text-xl font-bold text-slate-900 tracking-tight">POS<span className="text-primary-600">Flex</span></p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Main Branch - Quezon City</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-dashed border-slate-200 pb-2">
                    <span>Item</span>
                    <span>Total</span>
                  </div>
                  <div className="space-y-4">
                    {lastTransaction.items.map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-800 uppercase leading-tight">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{item.quantity}x @ ₱{item.price}</p>
                            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tight">{item.details}</p>
                            {item.addons && item.addons.length > 0 && (
                              <div className="mt-1 pl-2 border-l border-slate-200">
                                {item.addons.map((addon, ai) => (
                                  <p key={ai} className="text-[8px] text-primary-600 font-bold uppercase tracking-wide">+ {addon.name} (₱{addon.price})</p>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-900">₱{item.price * item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t-2 border-dashed border-slate-100 space-y-3">
                  <div className="flex justify-between items-center text-sm font-bold text-slate-400 uppercase">
                    <span>Subtotal</span>
                    <span className="text-slate-900 font-bold">₱{lastTransaction.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">Total Paid ({lastTransaction.paymentMethod})</span>
                    <span className="text-2xl font-bold text-primary-600 tracking-tight">₱{lastTransaction.total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-center space-y-2 pt-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Thank you for your order!</p>
                  <p className="text-[8px] text-slate-300 font-medium">Trans ID: {Date.now().toString().slice(-8)} | {new Date().toLocaleString()}</p>
                </div>
              </div>

              <div className="p-10 pt-0 flex gap-3">
                <button 
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="flex-1 py-5 bg-slate-900 text-white font-bold rounded-3xl uppercase tracking-wide text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                >
                  Done
                </button>
                <button 
                  onClick={() => window.print()}
                  className="p-5 bg-slate-100 text-slate-400 rounded-3xl hover:bg-slate-200 transition-all"
                >
                  <Receipt size={24} />
                </button>
              </div>
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
