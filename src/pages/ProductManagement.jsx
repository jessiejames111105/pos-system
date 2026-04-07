import React, { useMemo, useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Package, 
  Layers, 
  Settings2, 
  AlertTriangle,
  X,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../store/AppContext';

const ProductManagement = () => {
  const {
    categories,
    products,
    ingredients,
    addons,
    productIngredients,
    productAddons,
    createCategory,
    deleteCategory,
    createProduct,
    updateProduct,
    deleteProduct,
    setProductBOM,
    setProductAddonsForProduct
  } = useApp();
  const [activeTab, setActiveTab] = useState('products'); // products, categories
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [bomLines, setBomLines] = useState([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form state for a new product
  const initialProductState = {
    name: '',
    category: '',
    price: '',
    barcode: ''
  };

  const [productForm, setProductForm] = useState(initialProductState);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductForm(initialProductState);
    setBomLines([]);
    setSelectedAddonIds([]);
    setIsModalOpen(true);
  };

  const handleAddCategory = () => {
    const name = prompt('Enter Category Name:');
    if (name) {
      createCategory(name);
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

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      ...initialProductState,
      name: product.name || '',
      category: product.categoryName || '',
      price: product.price ?? '',
      barcode: product.barcode ?? ''
    });
    const existingBom = (productIngredients || [])
      .filter(r => Number(r.product_id) === Number(product.id))
      .map(r => ({ ingredient_id: r.ingredient_id, quantity: r.quantity }));
    setBomLines(existingBom);
    const existingAddonIds = (productAddons || [])
      .filter(r => Number(r.product_id) === Number(product.id))
      .map(r => r.addon_id);
    setSelectedAddonIds(existingAddonIds);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const categoryName = (productForm.category || '').toString();
    const categoryId = categories.find(c => c.name === categoryName)?.id ?? null;
    const payload = {
      name: productForm.name,
      category_id: categoryId,
      price: Number(productForm.price || 0),
      barcode: productForm.barcode || null
    };
    if (!payload.name) {
      setIsSaving(false);
      return;
    }

    try {
      let productId = editingProduct?.id ?? null;
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        const res = await createProduct(payload);
        productId = res?.product?.id ?? null;
      }

      if (productId) {
        await setProductBOM(productId, bomLines);
        await setProductAddonsForProduct(productId, selectedAddonIds);
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
            <Layers size={18} />
            Add Category
          </button>
          <button 
            onClick={handleAddProduct}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
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
                  <div className="p-2.5 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    <Layers size={20} />
                  </div>
                  <button
                    onClick={() => setDeleteTarget({ kind: 'category', id: cat.id, name: cat.name })}
                    className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
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
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-xl">📦</div>
                        <span className="font-semibold text-slate-900">{product.name}</span>
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
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  <h2 className="text-xl font-bold text-slate-900">Add New Product</h2>
                  <p className="text-sm text-slate-500">Complete the details below to create your product.</p>
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
                        className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all appearance-none bg-white"
                        value={productForm.category}
                        onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                      >
                        <option value="">Select a category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Barcode (optional)</label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                        value={productForm.barcode}
                        onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-primary-600 font-bold uppercase tracking-wider text-xs">
                    <Package size={14} />
                    Pricing
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Price (₱)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                        value={productForm.price ?? ''}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary-600 font-bold uppercase tracking-wider text-xs">
                      <Package size={14} />
                      BOM (Ingredients)
                    </div>
                    <button
                      type="button"
                      onClick={() => setBomLines(prev => [...prev, { ingredient_id: '', quantity: '' }])}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add Line
                    </button>
                  </div>

                  <div className="space-y-3">
                    {bomLines.map((line, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-7">
                          <select
                            className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all bg-white"
                            value={line.ingredient_id}
                            onChange={(e) => {
                              const v = e.target.value;
                              setBomLines(prev => prev.map((x, i) => i === idx ? { ...x, ingredient_id: v } : x));
                            }}
                          >
                            <option value="">Select ingredient</option>
                            {ingredients.map(ing => (
                              <option key={ing.id} value={ing.id}>{ing.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-4">
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                            placeholder="Qty per product"
                            value={line.quantity}
                            onChange={(e) => {
                              const v = e.target.value;
                              setBomLines(prev => prev.map((x, i) => i === idx ? { ...x, quantity: v } : x));
                            }}
                          />
                        </div>
                        <div className="md:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setBomLines(prev => prev.filter((_, i) => i !== idx))}
                            className="p-3 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {bomLines.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                        No BOM lines yet.
                      </div>
                    )}
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-primary-600 font-bold uppercase tracking-wider text-xs">
                    <Package size={14} />
                    Available Add-ons
                  </div>
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
                  <Save size={18} />
                  {isSaving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
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
