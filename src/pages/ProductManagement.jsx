import React, { useMemo, useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Package, 
  Settings2, 
  AlertTriangle,
  X,
  Save,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../store/AppContext';
import SearchableSelect from '../components/SearchableSelect';

const ProductManagement = () => {
  const {
    categories,
    products,
    ingredients,
    addons,
    productSizes,
    productSizeIngredients,
    productIngredients,
    productAddons,
    createCategory,
    deleteCategory,
    createProduct,
    updateProduct,
    deleteProduct,
    setProductSizesWithBOM,
    setProductAddonsForProduct
  } = useApp();
  const [activeTab, setActiveTab] = useState('products'); // products, categories
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [sizes, setSizes] = useState([{ name: 'Standard', price: '', bomLines: [] }]);
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Form state for a new product
  const initialProductState = {
    name: '',
    category: ''
  };

  const [productForm, setProductForm] = useState(initialProductState);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductForm(initialProductState);
    setSizes([{ name: 'Standard', price: '', bomLines: [{ ingredient_id: '', quantity: '' }] }]);
    setSelectedAddonIds([]);
    setIsModalOpen(true);
  };

  const handleAddCategory = () => {
    setCategoryName('');
    setIsCategoryModalOpen(true);
  };

  const submitCategory = async (e) => {
    e.preventDefault();
    if (isCreatingCategory) return;
    const name = (categoryName || '').toString().trim();
    if (!name) return;
    setIsCreatingCategory(true);
    try {
      await createCategory(name);
      setIsCategoryModalOpen(false);
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const categoryCards = useMemo(() => {
    const counts = new Map();
    for (const p of products) {
      if (!p.category_id) continue;
      counts.set(p.category_id, (counts.get(p.category_id) || 0) + 1);
    }
    return categories.map(c => ({ ...c, productCount: counts.get(c.id) || 0 }));
  }, [categories, products]);

  const productsSorted = useMemo(() => {
    return [...(products || [])].sort((a, b) => {
      const ad = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bd = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bd - ad;
    });
  }, [products]);

  const ingredientGroups = useMemo(() => {
    const list = ingredients || [];
    const isMaterial = (ing) => {
      const unit = String(ing?.unit || '').trim().toLowerCase();
      return unit === 'pcs' || unit === 'pc' || unit === 'piece' || unit === 'pieces';
    };
    return {
      materials: list.filter(isMaterial),
      ingredients: list.filter(i => !isMaterial(i))
    };
  }, [ingredients]);

  const ingredientOptions = useMemo(() => {
    return [
      ...ingredientGroups.ingredients.map(ing => ({ value: ing.id, label: ing.name, group: 'Ingredients' })),
      ...ingredientGroups.materials.map(ing => ({ value: ing.id, label: ing.name, group: 'Materials' }))
    ];
  }, [ingredientGroups.ingredients, ingredientGroups.materials]);

  const addonOptions = useMemo(() => {
    return (addons || []).map(a => ({ value: a.id, label: a.name, group: 'Add-ons' }));
  }, [addons]);

  const filteredProducts = useMemo(() => {
    if (categoryFilter === 'all') return productsSorted;
    return productsSorted.filter(p => String(p.category_id || '') === String(categoryFilter));
  }, [productsSorted, categoryFilter]);

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      ...initialProductState,
      name: product.name || '',
      category: product.categoryName || ''
    });
    const existingSizes = (productSizes || [])
      .filter(s => String(s.product_id) === String(product.id))
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || String(a.name).localeCompare(String(b.name)));
    if (existingSizes.length > 0) {
      setSizes(existingSizes.map(sz => ({
        id: sz.id,
        name: sz.name,
        price: sz.price == null ? '' : String(sz.price),
        bomLines: (productSizeIngredients || [])
          .filter(r => String(r.product_size_id) === String(sz.id))
          .map(r => ({ ingredient_id: r.ingredient_id == null ? '' : String(r.ingredient_id), quantity: r.quantity == null ? '' : String(r.quantity) }))
      })));
    } else {
      setSizes([{ name: 'Standard', price: product.price ?? '', bomLines: [{ ingredient_id: '', quantity: '' }] }]);
    }
    const existingAddonIds = (productAddons || [])
      .filter(r => String(r.product_id) === String(product.id))
      .map(r => r.addon_id);
    setSelectedAddonIds(existingAddonIds);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const categoryName = (productForm.category || '').toString();
    const categoryId = categories.find(c => c.name === categoryName)?.id ?? null;
    const numericPrices = (sizes || [])
      .map(s => Number(s.price || 0))
      .filter(p => Number.isFinite(p) && p >= 0);
    const computedBasePrice = numericPrices.length > 0 ? Math.min(...numericPrices) : 0;
    const payload = {
      name: productForm.name,
      category_id: categoryId,
      price: computedBasePrice
    };
    if (!payload.name) {
      setIsSaving(false);
      return;
    }

    try {
      let productId = editingProduct?.id ?? null;
      if (editingProduct) {
        const res = await updateProduct(editingProduct.id, payload);
        if (!res?.ok) return;
      } else {
        const res = await createProduct(payload);
        if (!res?.ok) return;
        productId = res?.product?.id ?? null;
      }

      if (productId) {
        const sizesRes = await setProductSizesWithBOM(productId, sizes);
        if (!sizesRes?.ok) return;
        const addonsRes = await setProductAddonsForProduct(productId, selectedAddonIds);
        if (!addonsRes?.ok) return;
      }

      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    if (deleteTarget.kind === 'category') {
      await deleteCategory(deleteTarget.id);
    } else if (deleteTarget.kind === 'product') {
      await deleteProduct(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Management</h1>
          <p className="text-slate-500">Organize your store catalog and product details.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleAddCategory}
            className="btn bg-white border border-slate-200 text-slate-700 flex items-center gap-2 hover:bg-slate-50"
          >
            Add Category
          </button>
          <button 
            onClick={handleAddProduct}
            className="btn btn-primary flex items-center gap-2"
          >
            Add Product
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 ${
            activeTab === 'products' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 ${
            activeTab === 'categories' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Categories
        </button>
      </div>

      {/* Content */}
      <div className="grid gap-6">
        {activeTab === 'categories' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categoryCards.map(cat => (
              <div key={cat.id} className="card p-5 group hover:border-primary-300 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setDeleteTarget({ kind: 'category', id: cat.id, name: cat.name })}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <h3 className="font-bold text-slate-900">{cat.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{cat.productCount} Products</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wide">Filter</span>
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="select-system select-filter"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{product.name}</span>
                        {product?.stock != null && Number(product.stock || 0) <= 0 ? (
                          <span className="inline-flex w-fit rounded-lg bg-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-slate-600">
                            No Stock
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                        {product.categoryName || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">₱{Number(product.price).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                        >
                          <Settings2 size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ kind: 'product', id: product.id, name: product.name })}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                  <p className="text-sm text-slate-500">Complete the details below to save your product.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-8 space-y-10">
                {/* Basic Info */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-primary-600 font-bold uppercase tracking-wider text-xs">
                    <Package size={14} />
                    Basic Information
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Product Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Vanilla Latte"
                        className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                        value={productForm.name}
                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Category</label>
                      <select 
                        className="select-system w-full"
                        value={productForm.category}
                        onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                      >
                        <option value="">Select a category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary-600 font-bold uppercase tracking-wider text-xs">
                      <Package size={14} />
                      Ingredients & Materials (Per Size)
                    </div>
                    <button
                      type="button"
                      onClick={() => setSizes(prev => [...prev, { name: '', price: '', bomLines: [{ ingredient_id: '', quantity: '' }] }])}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add Size
                    </button>
                  </div>

                  <div className="space-y-3">
                    {sizes.map((size, sizeIdx) => (
                      <div key={sizeIdx} className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
                        <div className="p-5 bg-slate-50/60 border-b border-slate-200 flex flex-col md:flex-row md:items-center gap-3 justify-between">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Size name (e.g. Small)"
                              className="w-full rounded-xl border border-slate-200 p-3 text-sm font-bold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all bg-white"
                              value={size.name}
                              onChange={(e) => {
                                const v = e.target.value;
                                setSizes(prev => prev.map((s, i) => i === sizeIdx ? { ...s, name: v } : s));
                              }}
                            />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Price (₱)"
                              className="w-full rounded-xl border border-slate-200 p-3 text-sm font-bold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all bg-white"
                              value={size.price}
                              onChange={(e) => {
                                const v = e.target.value;
                                setSizes(prev => prev.map((s, i) => i === sizeIdx ? { ...s, price: v } : s));
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSizes(prev => prev.map((s, i) => i === sizeIdx ? { ...s, bomLines: [...(s.bomLines || []), { ingredient_id: '', quantity: '' }] } : s))}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all flex items-center gap-2"
                            >
                              <Plus size={16} />
                              Add Item
                            </button>
                            <button
                              type="button"
                              onClick={() => setSizes(prev => prev.filter((_, i) => i !== sizeIdx))}
                              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>

                        <div className="p-5 space-y-3">
                          {(size.bomLines || []).map((line, idx) => (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                              <div className="md:col-span-7">
                                <SearchableSelect
                                  value={line.ingredient_id}
                                  options={ingredientOptions}
                                  placeholder="Type to search..."
                                  onChange={(v) => {
                                    const nextId = v === '' ? '' : Number(v);
                                    setSizes(prev => prev.map((s, i) => {
                                      if (i !== sizeIdx) return s;
                                      const nextLines = (s.bomLines || []).map((x, j) => j === idx ? { ...x, ingredient_id: nextId } : x);
                                      return { ...s, bomLines: nextLines };
                                    }));
                                  }}
                                />
                              </div>
                              <div className="md:col-span-4">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.001"
                                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                  placeholder={`Qty (${ingredients.find(ing => String(ing.id) === String(line.ingredient_id))?.unit || 'unit'})`}
                                  value={line.quantity}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setSizes(prev => prev.map((s, i) => {
                                      if (i !== sizeIdx) return s;
                                      const nextLines = (s.bomLines || []).map((x, j) => j === idx ? { ...x, quantity: v } : x);
                                      return { ...s, bomLines: nextLines };
                                    }));
                                  }}
                                />
                              </div>
                              <div className="md:col-span-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => setSizes(prev => prev.map((s, i) => {
                                    if (i !== sizeIdx) return s;
                                    const nextLines = (s.bomLines || []).filter((_, j) => j !== idx);
                                    return { ...s, bomLines: nextLines };
                                  }))}
                                  className="p-3 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          ))}
                          {(size.bomLines || []).filter(l => String(l?.ingredient_id || '').trim() !== '').length === 0 && (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                              No ingredients/materials for this size yet.
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {sizes.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                        No sizes yet.
                      </div>
                    )}
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-primary-600 font-bold uppercase tracking-wider text-xs">
                    <Package size={14} />
                    Available Add-ons
                  </div>
                  <SearchableSelect
                    value=""
                    options={addonOptions}
                    placeholder="Type add-on name..."
                    onChange={(v) => {
                      const id = v === '' ? null : Number(v);
                      if (!id) return;
                      const checked = selectedAddonIds.includes(id);
                      setSelectedAddonIds(prev => checked ? prev.filter(x => x !== id) : [...prev, id]);
                    }}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {addons.map(a => {
                      const checked = selectedAddonIds.includes(a.id);
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setSelectedAddonIds(prev => checked ? prev.filter(x => x !== a.id) : [...prev, a.id]);
                          }}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${
                            checked ? 'bg-primary-50 border-primary-600 text-primary-700' : 'bg-white border-slate-200 text-slate-700 hover:border-primary-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">{a.name}</span>
                            <span className="font-bold">₱{Number(a.price_per_unit).toLocaleString()}</span>
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-2">
                            {a.variable_quantity ? 'Variable Qty' : 'Fixed Qty'}
                          </div>
                        </button>
                      );
                    })}
                    {addons.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 md:col-span-2">
                        No add-ons yet.
                      </div>
                    )}
                  </div>
                </section>

              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 sticky bottom-0 z-10">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    handleSaveProduct();
                  }}
                  disabled={isSaving}
                  className="px-8 py-3 rounded-xl text-sm font-bold bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-200 flex items-center gap-2 transition-all active:scale-[0.98] disabled:bg-slate-200 disabled:shadow-none"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {isSaving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Add Category</h3>
                  <p className="text-xs text-slate-500 mt-1">Create a new menu category.</p>
                </div>
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={submitCategory} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Category Name</label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="e.g. Milk Tea"
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bold"
                    autoFocus
                    required
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    disabled={isCreatingCategory}
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all text-xs uppercase disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingCategory}
                    className="flex-1 px-4 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all text-xs uppercase disabled:bg-slate-200 disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {isCreatingCategory ? <Loader2 size={16} className="animate-spin" /> : null}
                    {isCreatingCategory ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">Confirm Delete</h3>
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                  <div className="h-10 w-10 rounded-xl bg-white text-amber-600 flex items-center justify-center border border-amber-100">
                    <AlertTriangle size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">Delete this {deleteTarget.kind}?</p>
                    <p className="text-xs text-slate-600">This action cannot be undone.</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Name</span>
                    <span className="text-sm font-bold text-slate-900">{deleteTarget.name}</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all text-xs uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all text-xs uppercase"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductManagement;
