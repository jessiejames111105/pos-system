import React, { useMemo, useState } from 'react';
import { 
  Plus,
  Search, 
  AlertTriangle, 
  Edit2,
  Trash2,
  AlertOctagon,
  X,
  CheckCircle2,
  Package,
  Layers,
  Settings2
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

const Inventory = () => {
  const {
    ingredients,
    addons,
    addonIngredients,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    adjustIngredientStock,
    createAddon,
    updateAddon,
    deleteAddon,
    setAddonBOM,
    user
  } = useApp();
  const [activeTab, setActiveTab] = useState('ingredients');
  const [searchTerm, setSearchTerm] = useState('');
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState(null);
  const [isAddonBomModalOpen, setIsAddonBomModalOpen] = useState(false);
  const [editingAddonBom, setEditingAddonBom] = useState(null);
  const [addonBomLines, setAddonBomLines] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  const isAdmin = user?.role === 'admin';

  const initialIngredientForm = {
    name: '',
    unit: 'pcs',
    quantity: '',
    min_stock: ''
  };
  const [ingredientForm, setIngredientForm] = useState(initialIngredientForm);

  const initialAddonForm = {
    name: '',
    price_per_unit: '',
    variable_quantity: true
  };
  const [addonForm, setAddonForm] = useState(initialAddonForm);

  const filteredIngredients = useMemo(() => {
    const term = String(searchTerm || '').toLowerCase();
    return (ingredients || []).filter(i => String(i.name || '').toLowerCase().includes(term));
  }, [ingredients, searchTerm]);

  const filteredAddons = useMemo(() => {
    const term = String(searchTerm || '').toLowerCase();
    return (addons || []).filter(a => String(a.name || '').toLowerCase().includes(term));
  }, [addons, searchTerm]);

  const openNewIngredient = () => {
    setEditingIngredient(null);
    setIngredientForm(initialIngredientForm);
    setIsIngredientModalOpen(true);
  };

  const openEditIngredient = (ing) => {
    setEditingIngredient(ing);
    setIngredientForm({
      name: ing.name || '',
      unit: ing.unit || 'pcs',
      quantity: String(Number(ing.quantity || 0)),
      min_stock: String(Number(ing.min_stock || 0))
    });
    setIsIngredientModalOpen(true);
  };

  const submitIngredient = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: ingredientForm.name,
        unit: ingredientForm.unit,
        quantity: Number(ingredientForm.quantity || 0),
        min_stock: Number(ingredientForm.min_stock || 0)
      };
      if (!payload.name) return;

      if (!editingIngredient) {
        await createIngredient(payload);
        setIsIngredientModalOpen(false);
        return;
      }

      const prevQty = Number(editingIngredient.quantity || 0);
      const nextQty = Number(payload.quantity || 0);
      const delta = nextQty - prevQty;
      await updateIngredient(editingIngredient.id, { name: payload.name, unit: payload.unit, min_stock: payload.min_stock });
      if (delta !== 0) {
        await adjustIngredientStock({ ingredientId: editingIngredient.id, change: delta, reason: 'adjustment' });
      }
      setIsIngredientModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openNewAddon = () => {
    setEditingAddon(null);
    setAddonForm(initialAddonForm);
    setIsAddonModalOpen(true);
  };

  const openEditAddon = (addon) => {
    setEditingAddon(addon);
    setAddonForm({
      name: addon.name || '',
      price_per_unit: String(Number(addon.price_per_unit || 0)),
      variable_quantity: Boolean(addon.variable_quantity)
    });
    setIsAddonModalOpen(true);
  };

  const submitAddon = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: addonForm.name,
        price_per_unit: Number(addonForm.price_per_unit || 0),
        variable_quantity: Boolean(addonForm.variable_quantity)
      };
      if (!payload.name) return;

      if (editingAddon) {
        await updateAddon(editingAddon.id, payload);
      } else {
        await createAddon(payload);
      }
      setIsAddonModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddonBom = (addon) => {
    setEditingAddonBom(addon);
    const lines = (addonIngredients || [])
      .filter(r => Number(r.addon_id) === Number(addon.id))
      .map(r => ({ ingredient_id: r.ingredient_id, quantity: r.quantity }));
    setAddonBomLines(lines);
    setIsAddonBomModalOpen(true);
  };

  const submitAddonBom = async (e) => {
    e.preventDefault();
    if (!editingAddonBom) return;
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await setAddonBOM(editingAddonBom.id, addonBomLines);
      setIsAddonBomModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    if (deleteTarget.kind === 'ingredient') {
      await deleteIngredient(deleteTarget.id);
    } else if (deleteTarget.kind === 'addon') {
      await deleteAddon(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-500 text-sm">Manage ingredients and add-ons used for checkout.</p>
        </div>
        {isAdmin && (
          <div className="flex gap-3">
            {activeTab === 'ingredients' ? (
              <button onClick={openNewIngredient} className="btn btn-primary flex items-center gap-2">
                <Plus size={18} />
                Add Ingredient
              </button>
            ) : (
              <button onClick={openNewAddon} className="btn btn-primary flex items-center gap-2">
                <Plus size={18} />
                Add Add-on
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 pt-4">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('ingredients')}
              className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 ${
                activeTab === 'ingredients' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Ingredients
            </button>
            <button
              onClick={() => setActiveTab('addons')}
              className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 ${
                activeTab === 'addons' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Add-ons
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={activeTab === 'ingredients' ? 'Search ingredients...' : 'Search add-ons...'}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider">
                {activeTab === 'ingredients' ? (
                  <>
                    <th className="px-6 py-4">Ingredient</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Min</th>
                    {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4">Add-on</th>
                    <th className="px-6 py-4">Price/Unit</th>
                    <th className="px-6 py-4">Qty Type</th>
                    {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeTab === 'ingredients' ? (
                filteredIngredients.map((ing) => {
                  const qty = Number(ing.quantity || 0);
                  const min = Number(ing.min_stock || 0);
                  const isLow = min > 0 && qty <= min;
                  return (
                    <tr key={ing.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{ing.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${isLow ? 'text-amber-600' : 'text-slate-700'}`}>
                          {qty.toLocaleString()} {ing.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                            <AlertTriangle size={12} />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle2 size={12} />
                            OK
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-bold">
                        {min.toLocaleString()} {ing.unit}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditIngredient(ing)}
                              className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ kind: 'ingredient', id: ing.id, name: ing.name })}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                filteredAddons.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{a.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">₱{Number(a.price_per_unit || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        {a.variable_quantity ? 'Variable' : 'Fixed'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openAddonBom(a)}
                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                          >
                            <Layers size={16} />
                          </button>
                          <button
                            onClick={() => openEditAddon(a)}
                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                          >
                            <Settings2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ kind: 'addon', id: a.id, name: a.name })}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isIngredientModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsIngredientModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">{editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}</h3>
                <button 
                  onClick={() => setIsIngredientModalOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={submitIngredient} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Name</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bold"
                    value={ingredientForm.name}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Unit</label>
                    <select
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all appearance-none font-bold"
                      value={ingredientForm.unit}
                      onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
                    >
                      <option value="pcs">pcs</option>
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="L">L</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Min Stock</label>
                    <input
                      required
                      type="number"
                      step="0.001"
                      min="0"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                      value={ingredientForm.min_stock}
                      onChange={(e) => setIngredientForm({ ...ingredientForm, min_stock: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Stock Quantity</label>
                  <input
                    required
                    type="number"
                    step="0.001"
                    min="0"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bold"
                    value={ingredientForm.quantity}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, quantity: e.target.value })}
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsIngredientModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all disabled:bg-slate-200 disabled:shadow-none"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddonModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddonModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">{editingAddon ? 'Edit Add-on' : 'Add Add-on'}</h3>
                <button onClick={() => setIsAddonModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={submitAddon} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Name</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bold"
                    value={addonForm.name}
                    onChange={(e) => setAddonForm({ ...addonForm, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Price per Unit</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bold"
                    value={addonForm.price_per_unit}
                    onChange={(e) => setAddonForm({ ...addonForm, price_per_unit: e.target.value })}
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Variable Quantity</p>
                    <p className="text-xs text-slate-500">Allows user to choose quantity (e.g., scoops).</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddonForm(prev => ({ ...prev, variable_quantity: !prev.variable_quantity }))}
                    className={`h-10 w-16 rounded-full transition-all ${addonForm.variable_quantity ? 'bg-primary-600' : 'bg-slate-200'}`}
                  >
                    <span
                      className={`block h-8 w-8 rounded-full bg-white shadow translate-y-1 transition-all ${addonForm.variable_quantity ? 'translate-x-7' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddonModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all disabled:bg-slate-200 disabled:shadow-none"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddonBomModalOpen && editingAddonBom && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddonBomModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">Add-on BOM: {editingAddonBom.name}</h3>
                <button onClick={() => setIsAddonBomModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={submitAddonBom} className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700 font-bold uppercase tracking-wider text-xs">
                    <Package size={14} />
                    Ingredients per Unit
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddonBomLines(prev => [...prev, { ingredient_id: '', quantity: '' }])}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Line
                  </button>
                </div>

                <div className="space-y-3">
                  {addonBomLines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-7">
                        <select
                          className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all bg-white"
                          value={line.ingredient_id}
                          onChange={(e) => {
                            const v = e.target.value;
                            setAddonBomLines(prev => prev.map((x, i) => i === idx ? { ...x, ingredient_id: v } : x));
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
                          placeholder="Qty per add-on unit"
                          value={line.quantity}
                          onChange={(e) => {
                            const v = e.target.value;
                            setAddonBomLines(prev => prev.map((x, i) => i === idx ? { ...x, quantity: v } : x));
                          }}
                        />
                      </div>
                      <div className="md:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setAddonBomLines(prev => prev.filter((_, i) => i !== idx))}
                          className="p-3 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {addonBomLines.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                      No BOM lines yet.
                    </div>
                  )}
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddonBomModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all disabled:bg-slate-200 disabled:shadow-none"
                  >
                    {isSubmitting ? 'Saving...' : 'Save BOM'}
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
                <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3">
                  <div className="h-10 w-10 rounded-xl bg-white text-rose-600 flex items-center justify-center border border-rose-100">
                    <AlertOctagon size={22} />
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

export default Inventory;
