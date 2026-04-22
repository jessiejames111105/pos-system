import React, { useEffect, useMemo, useState } from 'react';
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
  
  Settings2,
  Loader2
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import SearchableSelect from '../components/SearchableSelect';

const Inventory = () => {
  const {
    ingredients,
    ingredientCategories,
    materials,
    materialCategories,
    addons,
    addonCategories,
    addonIngredients,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    adjustIngredientStock,
    addIngredientCategory,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    adjustMaterialStock,
    addMaterialCategory,
    createAddon,
    updateAddon,
    deleteAddon,
    setAddonBOM,
    addAddonCategory,
    renameIngredientCategory,
    renameMaterialCategory,
    renameAddonCategory,
    deleteIngredientCategory,
    deleteMaterialCategory,
    deleteAddonCategory,
    user,
    globalSearchTerm,
    setGlobalSearchTerm
  } = useApp();

  const ingredientOptions = useMemo(() => {
    const list = ingredients || [];
    const isMaterial = (ing) => {
      const unit = String(ing?.unit || '').trim().toLowerCase();
      return unit === 'pcs' || unit === 'pc' || unit === 'piece' || unit === 'pieces';
    };
    return [
      ...list.filter(i => !isMaterial(i)).map(ing => ({ value: ing.id, label: ing.name, group: 'Ingredients' })),
      ...list.filter(isMaterial).map(ing => ({ value: ing.id, label: ing.name, group: 'Materials' }))
    ];
  }, [ingredients]);
  const [activeTab, setActiveTab] = useState('ingredients');
  const [searchTerm, setSearchTerm] = useState('');
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState(null);
  const [isAddonBomModalOpen, setIsAddonBomModalOpen] = useState(false);
  const [editingAddonBom, setEditingAddonBom] = useState(null);
  const [addonBomLines, setAddonBomLines] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [addonFormBomLines, setAddonFormBomLines] = useState([]);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryModalKind, setCategoryModalKind] = useState('ingredient');
  const [categoryName, setCategoryName] = useState('');
  const [editCategoryModalOpen, setEditCategoryModalOpen] = useState(false);
  const [editCategoryKind, setEditCategoryKind] = useState('ingredient');
  const [editFromCategory, setEditFromCategory] = useState('');
  const [editToCategory, setEditToCategory] = useState('');
  const [deleteCategoryModalOpen, setDeleteCategoryModalOpen] = useState(false);
  const [deleteCategoryKind, setDeleteCategoryKind] = useState('ingredient');
  const [deleteCategoryName, setDeleteCategoryName] = useState('');
  const [ingredientCategoryFilter, setIngredientCategoryFilter] = useState('all');
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState('all');
  const [addonCategoryFilter, setAddonCategoryFilter] = useState('all');
  
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    setSearchTerm(globalSearchTerm || '');
  }, [globalSearchTerm]);

  useEffect(() => {
    if (!successOpen) return;
    const t = setTimeout(() => setSuccessOpen(false), 2000);
    return () => clearTimeout(t);
  }, [successOpen]);

  const initialIngredientForm = {
    name: '',
    category: 'General',
    unit: 'g',
    quantity: '',
    min_stock: ''
  };
  const [ingredientForm, setIngredientForm] = useState(initialIngredientForm);

  const initialMaterialForm = {
    name: '',
    category: 'General',
    unit: 'pcs',
    quantity: '',
    min_stock: ''
  };
  const [materialForm, setMaterialForm] = useState(initialMaterialForm);

  const initialAddonForm = {
    name: '',
    category: 'General',
    price_per_unit: '',
    variable_quantity: true
  };
  const [addonForm, setAddonForm] = useState(initialAddonForm);

  const filteredIngredients = useMemo(() => {
    const term = String(searchTerm || '').toLowerCase();
    return (ingredients || []).filter(i => {
      const unit = String(i?.unit || '').trim().toLowerCase();
      const isMaterial = unit === 'pcs' || unit === 'pc' || unit === 'piece' || unit === 'pieces';
      if (isMaterial) return false;
      if (String(i.name || '').toLowerCase().includes(term)) return true;
      if (String(i.category || '').toLowerCase().includes(term)) return true;
      return false;
    }).filter(i => {
      if (ingredientCategoryFilter === 'all') return true;
      const cat = String(i.category || '').trim() || 'Uncategorized';
      return cat === ingredientCategoryFilter;
    });
  }, [ingredients, searchTerm, ingredientCategoryFilter]);

  const filteredAddons = useMemo(() => {
    const term = String(searchTerm || '').toLowerCase();
    return (addons || []).filter(a => {
      if (String(a.name || '').toLowerCase().includes(term)) return true;
      if (String(a.category || '').toLowerCase().includes(term)) return true;
      return false;
    }).filter(a => {
      if (addonCategoryFilter === 'all') return true;
      const cat = String(a.category || '').trim() || 'Uncategorized';
      return cat === addonCategoryFilter;
    });
  }, [addons, searchTerm, addonCategoryFilter]);

  const filteredMaterials = useMemo(() => {
    const term = String(searchTerm || '').toLowerCase();
    return (materials || []).filter(m => {
      if (String(m.name || '').toLowerCase().includes(term)) return true;
      if (String(m.category || '').toLowerCase().includes(term)) return true;
      return false;
    }).filter(m => {
      if (materialCategoryFilter === 'all') return true;
      const cat = String(m.category || '').trim() || 'Uncategorized';
      return cat === materialCategoryFilter;
    });
  }, [materials, searchTerm, materialCategoryFilter]);

  const openNewIngredient = () => {
    setEditingIngredient(null);
    setIngredientForm(initialIngredientForm);
    setIsIngredientModalOpen(true);
  };

  const openEditIngredient = (ing) => {
    setEditingIngredient(ing);
    setIngredientForm({
      name: ing.name || '',
      category: ing.category || 'General',
      unit: ing.unit || 'pcs',
      quantity: String(Number(ing.quantity || 0)),
      min_stock: String(Number(ing.min_stock || 0))
    });
    setIsIngredientModalOpen(true);
  };

  const ingredientCategoryOptions = useMemo(() => {
    const defaults = ['General', 'Others'];
    const existing = (ingredients || []).filter(i => {
      const unit = String(i?.unit || '').trim().toLowerCase();
      const isMaterial = unit === 'pcs' || unit === 'pc' || unit === 'piece' || unit === 'pieces';
      return !isMaterial;
    }).map(i => String(i.category || '').trim()).filter(Boolean);
    const stored = (ingredientCategories || []).map(x => String(x).trim()).filter(Boolean);
    return Array.from(new Set([...defaults, ...stored, ...existing])).sort((a, b) => a.localeCompare(b));
  }, [ingredients, ingredientCategories]);

  const materialCategoryOptions = useMemo(() => {
    const defaults = ['General', 'Misc'];
    const existing = (materials || []).map(m => String(m.category || '').trim()).filter(Boolean);
    const stored = (materialCategories || []).map(x => String(x).trim()).filter(Boolean);
    return Array.from(new Set([...defaults, ...stored, ...existing])).sort((a, b) => a.localeCompare(b));
  }, [materials, materialCategories]);

  const addonCategoryOptions = useMemo(() => {
    const defaults = ['General', 'Others'];
    const existing = (addons || []).map(a => String(a.category || '').trim()).filter(Boolean);
    const stored = (addonCategories || []).map(x => String(x).trim()).filter(Boolean);
    return Array.from(new Set([...defaults, ...stored, ...existing])).sort((a, b) => a.localeCompare(b));
  }, [addons, addonCategories]);

  const openCategoryModal = (kind) => {
    setCategoryModalKind(kind);
    setCategoryName('');
    setCategoryModalOpen(true);
  };

  const openEditCategoryModal = (kind) => {
    setEditCategoryKind(kind);
    setEditFromCategory('');
    setEditToCategory('');
    setEditCategoryModalOpen(true);
  };

  const openDeleteCategoryModal = (kind) => {
    setDeleteCategoryKind(kind);
    setDeleteCategoryName('');
    setDeleteCategoryModalOpen(true);
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const name = String(categoryName || '').trim();
      if (!name) return;
      if (categoryModalKind === 'ingredient') {
        const res = await addIngredientCategory(name);
        if (!res?.ok) return;
        setIngredientForm(prev => ({ ...prev, category: name }));
      } else if (categoryModalKind === 'material') {
        const res = await addMaterialCategory(name);
        if (!res?.ok) return;
        setMaterialForm(prev => ({ ...prev, category: name }));
      } else {
        const res = await addAddonCategory(name);
        if (!res?.ok) return;
        setAddonForm(prev => ({ ...prev, category: name }));
      }
      setCategoryModalOpen(false);
      setSuccessMessage('Add Category Success');
      setSuccessOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveCategoryEdit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const from = String(editFromCategory || '').trim();
      const to = String(editToCategory || '').trim();
      if (!from || !to) return;
      if (editCategoryKind === 'ingredient') {
        const res = await renameIngredientCategory({ from, to });
        if (!res?.ok) return;
        if (ingredientCategoryFilter === from) setIngredientCategoryFilter(to);
      } else if (editCategoryKind === 'material') {
        const res = await renameMaterialCategory({ from, to });
        if (!res?.ok) return;
        if (materialCategoryFilter === from) setMaterialCategoryFilter(to);
      } else {
        const res = await renameAddonCategory({ from, to });
        if (!res?.ok) return;
        if (addonCategoryFilter === from) setAddonCategoryFilter(to);
      }
      setEditCategoryModalOpen(false);
      setSuccessMessage('Edit Category Success');
      setSuccessOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveCategoryDelete = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const name = String(deleteCategoryName || '').trim();
      if (!name) return;
      if (deleteCategoryKind === 'ingredient') {
        const res = await deleteIngredientCategory({ name });
        if (!res?.ok) return;
        if (ingredientCategoryFilter === name) setIngredientCategoryFilter('all');
      } else if (deleteCategoryKind === 'material') {
        const res = await deleteMaterialCategory({ name });
        if (!res?.ok) return;
        if (materialCategoryFilter === name) setMaterialCategoryFilter('all');
      } else {
        const res = await deleteAddonCategory({ name });
        if (!res?.ok) return;
        if (addonCategoryFilter === name) setAddonCategoryFilter('all');
      }
      setDeleteCategoryModalOpen(false);
      setSuccessMessage('Delete Category Success');
      setSuccessOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openNewMaterial = () => {
    setEditingMaterial(null);
    setMaterialForm(initialMaterialForm);
    setIsMaterialModalOpen(true);
  };

  const openEditMaterial = (m) => {
    setEditingMaterial(m);
    setMaterialForm({
      name: m.name || '',
      category: m.category || 'General',
      unit: m.unit || 'pcs',
      quantity: String(Number(m.quantity || 0)),
      min_stock: String(Number(m.min_stock || 0))
    });
    setIsMaterialModalOpen(true);
  };

  const submitIngredient = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: ingredientForm.name,
        category: ingredientForm.category,
        unit: ingredientForm.unit,
        quantity: Number(ingredientForm.quantity || 0),
        min_stock: Number(ingredientForm.min_stock || 0)
      };
      if (!payload.name) return;

      if (!editingIngredient) {
        const res = await createIngredient(payload);
        if (!res?.ok) return;
        setIsIngredientModalOpen(false);
        setSuccessMessage('Add Ingredient Success');
        setSuccessOpen(true);
        return;
      }

      const prevQty = Number(editingIngredient.quantity || 0);
      const nextQty = Number(payload.quantity || 0);
      const delta = nextQty - prevQty;
      const upd = await updateIngredient(editingIngredient.id, { name: payload.name, category: payload.category, unit: payload.unit, min_stock: payload.min_stock });
      if (!upd?.ok) return;
      if (delta !== 0) {
        const reason = delta > 0 ? 'restock' : 'adjustment';
        const adj = await adjustIngredientStock({ ingredientId: editingIngredient.id, change: delta, reason });
        if (!adj?.ok) return;
      }
      setIsIngredientModalOpen(false);
      setSuccessMessage('Update Ingredient Success');
      setSuccessOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitMaterial = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: materialForm.name,
        category: materialForm.category,
        unit: materialForm.unit,
        quantity: Number(materialForm.quantity || 0),
        min_stock: Number(materialForm.min_stock || 0)
      };
      if (!payload.name) return;

      if (!editingMaterial) {
        const res = await createMaterial(payload);
        if (!res?.ok) return;
        setIsMaterialModalOpen(false);
        setSuccessMessage('Add Material Success');
        setSuccessOpen(true);
        return;
      }

      const prevQty = Number(editingMaterial.quantity || 0);
      const nextQty = Number(payload.quantity || 0);
      const delta = nextQty - prevQty;
      const upd = await updateMaterial(editingMaterial.id, { name: payload.name, category: payload.category, unit: payload.unit, min_stock: payload.min_stock });
      if (!upd?.ok) return;
      if (delta !== 0) {
        const reason = delta > 0 ? 'restock' : 'adjustment';
        const adj = await adjustMaterialStock({ materialId: editingMaterial.id, change: delta, reason });
        if (!adj?.ok) return;
      }
      setIsMaterialModalOpen(false);
      setSuccessMessage('Update Material Success');
      setSuccessOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openNewAddon = () => {
    setEditingAddon(null);
    setAddonForm(initialAddonForm);
    setAddonFormBomLines([]);
    setIsAddonModalOpen(true);
  };

  const openEditAddon = (addon) => {
    setEditingAddon(addon);
    setAddonForm({
      name: addon.name || '',
      category: addon.category || 'General',
      price_per_unit: String(Number(addon.price_per_unit || 0)),
      variable_quantity: Boolean(addon.variable_quantity)
    });
    setAddonFormBomLines(
      (addonIngredients || [])
        .filter(r => Number(r.addon_id) === Number(addon.id))
        .map(r => ({ ingredient_id: r.ingredient_id, quantity: r.quantity }))
    );
    setIsAddonModalOpen(true);
  };

  const submitAddon = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: addonForm.name,
        category: addonForm.category,
        price_per_unit: Number(addonForm.price_per_unit || 0),
        variable_quantity: Boolean(addonForm.variable_quantity)
      };
      if (!payload.name) return;

      if (editingAddon) {
        const upd = await updateAddon(editingAddon.id, payload);
        if (!upd?.ok) return;
        const bom = await setAddonBOM(editingAddon.id, addonFormBomLines);
        if (!bom?.ok) return;
      } else {
        const res = await createAddon(payload);
        const addonId = res?.addon?.id ?? null;
        if (addonId) await setAddonBOM(addonId, addonFormBomLines);
      }
      setIsAddonModalOpen(false);
      setSuccessMessage(editingAddon ? 'Update Add-on Success' : 'Add Add-on Success');
      setSuccessOpen(true);
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
      const bom = await setAddonBOM(editingAddonBom.id, addonBomLines);
      if (!bom?.ok) return;
      setIsAddonBomModalOpen(false);
      setSuccessMessage('Update Add-on Materials Success');
      setSuccessOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    if (deleteTarget.kind === 'ingredient') {
      const res = await deleteIngredient(deleteTarget.id);
      if (!res?.ok) return;
      setSuccessMessage('Delete Ingredient Success');
      setSuccessOpen(true);
    } else if (deleteTarget.kind === 'material') {
      const res = await deleteMaterial(deleteTarget.id);
      if (!res?.ok) return;
      setSuccessMessage('Delete Material Success');
      setSuccessOpen(true);
    } else if (deleteTarget.kind === 'addon') {
      const res = await deleteAddon(deleteTarget.id);
      if (!res?.ok) return;
      setSuccessMessage('Delete Add-on Success');
      setSuccessOpen(true);
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {successOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[90] px-5 py-3 rounded-2xl bg-emerald-600 text-white font-bold uppercase tracking-wide text-xs shadow-2xl shadow-emerald-200"
          >
            {successMessage || 'Success'}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {categoryModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCategoryModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">Add Category</h3>
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={saveCategory} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Category Name</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bold"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                  />
                </div>
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setCategoryModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all disabled:bg-slate-200 disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editCategoryModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditCategoryModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">Edit Category</h3>
                <button
                  type="button"
                  onClick={() => setEditCategoryModalOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={saveCategoryEdit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Select Category</label>
                  <select
                    className="select-system w-full"
                    value={editFromCategory}
                    onChange={(e) => setEditFromCategory(e.target.value)}
                    required
                  >
                    <option value="">Select...</option>
                    {(editCategoryKind === 'ingredient'
                      ? ingredientCategoryOptions
                      : editCategoryKind === 'material'
                        ? materialCategoryOptions
                        : addonCategoryOptions
                    ).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">New Category Name</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bold"
                    value={editToCategory}
                    onChange={(e) => setEditToCategory(e.target.value)}
                  />
                </div>
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setEditCategoryModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all disabled:bg-slate-200 disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteCategoryModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteCategoryModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">Delete Category</h3>
                <button
                  type="button"
                  onClick={() => setDeleteCategoryModalOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={saveCategoryDelete} className="p-6 space-y-4">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 font-semibold">
                  Items under this category will become Uncategorized.
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Select Category</label>
                  <select
                    className="select-system w-full"
                    value={deleteCategoryName}
                    onChange={(e) => setDeleteCategoryName(e.target.value)}
                    required
                  >
                    <option value="">Select...</option>
                    {(deleteCategoryKind === 'ingredient'
                      ? ingredientCategoryOptions
                      : deleteCategoryKind === 'material'
                        ? materialCategoryOptions
                        : addonCategoryOptions
                    ).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setDeleteCategoryModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all disabled:bg-slate-200 disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                    {isSubmitting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-500 text-sm">Manage ingredients, materials, and add-ons used for checkout.</p>
        </div>
        {isAdmin && (
          <div className="flex gap-3">
            {activeTab === 'ingredients' ? (
              <button onClick={openNewIngredient} className="btn btn-primary flex items-center gap-2">
                <Plus size={18} />
                Add Ingredient
              </button>
            ) : activeTab === 'materials' ? (
              <button onClick={openNewMaterial} className="btn btn-primary flex items-center gap-2">
                <Plus size={18} />
                Add Material
              </button>
            ) : (
              <button onClick={openNewAddon} className="btn btn-primary flex items-center gap-2">
                <Plus size={18} />
                Add Add-on
              </button>
            )}
            <button
              onClick={() => openCategoryModal(activeTab === 'ingredients' ? 'ingredient' : activeTab === 'materials' ? 'material' : 'addon')}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Plus size={18} />
              Add Category
            </button>
            <button
              onClick={() => openEditCategoryModal(activeTab === 'ingredients' ? 'ingredient' : activeTab === 'materials' ? 'material' : 'addon')}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Settings2 size={18} />
              Edit Category
            </button>
            <button
              onClick={() => openDeleteCategoryModal(activeTab === 'ingredients' ? 'ingredient' : activeTab === 'materials' ? 'material' : 'addon')}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Trash2 size={18} />
              Delete Category
            </button>
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
              onClick={() => setActiveTab('materials')}
              className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 ${
                activeTab === 'materials' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Materials
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
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder={
                  activeTab === 'ingredients'
                    ? 'Search ingredients...'
                    : activeTab === 'materials'
                      ? 'Search materials...'
                      : 'Search add-ons...'
                }
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setGlobalSearchTerm(e.target.value);
                }}
              />
            </div>

            <div className="w-full md:w-64">
              {activeTab === 'ingredients' ? (
                <select
                  value={ingredientCategoryFilter}
                  onChange={(e) => setIngredientCategoryFilter(e.target.value)}
                  className="select-system w-full"
                >
                  <option value="all">All Categories</option>
                  {(ingredientCategoryOptions || []).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : activeTab === 'materials' ? (
                <select
                  value={materialCategoryFilter}
                  onChange={(e) => setMaterialCategoryFilter(e.target.value)}
                  className="select-system w-full"
                >
                  <option value="all">All Categories</option>
                  {(materialCategoryOptions || []).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <select
                  value={addonCategoryFilter}
                  onChange={(e) => setAddonCategoryFilter(e.target.value)}
                  className="select-system w-full"
                >
                  <option value="all">All Categories</option>
                  {(addonCategoryOptions || []).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {activeTab === 'ingredients' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Ingredient</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Min</th>
                  {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIngredients.map((ing) => {
                  const qty = Number(ing.quantity || 0);
                  const min = Number(ing.min_stock || 0);
                  const isOut = qty <= 0;
                  const isLow = !isOut && min > 0 && qty <= min;
                  return (
                    <tr key={ing.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{ing.name}</div>
                        {ing.category ? (
                          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-1">
                            {ing.category}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-700'}`}>
                          {qty.toLocaleString()} {ing.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
                            <AlertOctagon size={12} />
                            No Stock
                          </span>
                        ) : isLow ? (
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
                          <div className="flex justify-end gap-2">
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
                })}
                {filteredIngredients.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="px-6 py-10 text-center text-slate-500 font-bold">
                      No ingredients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  {activeTab === 'materials' ? (
                    <>
                      <th className="px-6 py-4">Material</th>
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
              {activeTab === 'materials' ? (
                filteredMaterials.map((m) => {
                  const qty = Number(m.quantity || 0);
                  const min = Number(m.min_stock || 0);
                  const isOut = qty <= 0;
                  const isLow = !isOut && min > 0 && qty <= min;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{m.name}</div>
                        {m.category ? (
                          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-1">
                            {m.category}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-700'}`}>
                          {qty.toLocaleString()} {m.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
                            <AlertOctagon size={12} />
                            No Stock
                          </span>
                        ) : isLow ? (
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
                        {min.toLocaleString()} {m.unit}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditMaterial(m)}
                              className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ kind: 'material', id: m.id, name: m.name })}
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
                      {a.category ? (
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-1">
                          {a.category}
                        </div>
                      ) : null}
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
                        <div className="flex justify-end gap-2">
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
        )}
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
                    <label className="text-sm font-bold text-slate-700">Category</label>
                    <select
                      required
                      className="select-system w-full"
                      value={ingredientForm.category}
                      onChange={(e) => setIngredientForm({ ...ingredientForm, category: e.target.value })}
                    >
                      {(ingredientCategoryOptions || []).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => openCategoryModal('ingredient')}
                      className="mt-2 text-[10px] font-bold uppercase tracking-wide text-primary-600 hover:text-primary-700"
                    >
                      + Add Category
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Unit</label>
                    <select
                      className="select-system w-full"
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
                    className="flex-1 px-4 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all disabled:bg-slate-200 disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMaterialModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMaterialModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">{editingMaterial ? 'Edit Material' : 'Add Material'}</h3>
                <button 
                  onClick={() => setIsMaterialModalOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={submitMaterial} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Name</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bold"
                    value={materialForm.name}
                    onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Category</label>
                    <select
                      required
                      className="select-system w-full"
                      value={materialForm.category}
                      onChange={(e) => setMaterialForm({ ...materialForm, category: e.target.value })}
                    >
                      {(materialCategoryOptions || []).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => openCategoryModal('material')}
                      className="mt-2 text-[10px] font-bold uppercase tracking-wide text-primary-600 hover:text-primary-700"
                    >
                      + Add Category
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Unit</label>
                    <select
                      className="select-system w-full"
                      value={materialForm.unit}
                      onChange={(e) => setMaterialForm({ ...materialForm, unit: e.target.value })}
                    >
                      <option value="pcs">pcs</option>
                      <option value="pack">pack</option>
                      <option value="box">box</option>
                      <option value="roll">roll</option>
                      <option value="set">set</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Min Stock</label>
                    <input
                      required
                      type="number"
                      step="1"
                      min="0"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                      value={materialForm.min_stock}
                      onChange={(e) => setMaterialForm({ ...materialForm, min_stock: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Stock Quantity</label>
                  <input
                    required
                    type="number"
                    step="1"
                    min="0"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bold"
                    value={materialForm.quantity}
                    onChange={(e) => setMaterialForm({ ...materialForm, quantity: e.target.value })}
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsMaterialModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all disabled:bg-slate-200 disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
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
                  <label className="text-sm font-bold text-slate-700">Category</label>
                  <select
                    required
                    className="select-system w-full"
                    value={addonForm.category}
                    onChange={(e) => setAddonForm({ ...addonForm, category: e.target.value })}
                  >
                    {(addonCategoryOptions || []).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => openCategoryModal('addon')}
                    className="mt-2 text-[10px] font-bold uppercase tracking-wide text-primary-600 hover:text-primary-700"
                  >
                    + Add Category
                  </button>
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

                <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-700 font-bold uppercase tracking-wider text-xs">
                      <Package size={14} />
                      Ingredients per Unit
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddonFormBomLines(prev => [...prev, { ingredient_id: '', quantity: '' }])}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add Line
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    {addonFormBomLines.map((line, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-7">
                          <select
                            className="select-system w-full"
                            value={line.ingredient_id}
                            onChange={(e) => {
                              const v = e.target.value;
                              setAddonFormBomLines(prev => prev.map((x, i) => i === idx ? { ...x, ingredient_id: v } : x));
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
                            placeholder="Qty per unit"
                            value={line.quantity}
                            onChange={(e) => {
                              const v = e.target.value;
                              setAddonFormBomLines(prev => prev.map((x, i) => i === idx ? { ...x, quantity: v } : x));
                            }}
                          />
                        </div>
                        <div className="md:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setAddonFormBomLines(prev => prev.filter((_, i) => i !== idx))}
                            className="p-3 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {addonFormBomLines.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                        Set how many ingredients are used per 1 add-on unit (example: Pearl = 10g per unit).
                      </div>
                    )}
                  </div>
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
                    className="flex-1 px-4 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all disabled:bg-slate-200 disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
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
                        <SearchableSelect
                          value={line.ingredient_id}
                          options={ingredientOptions}
                          placeholder="Type to search..."
                          onChange={(v) => {
                            const nextId = v === '' ? '' : Number(v);
                            setAddonBomLines(prev => prev.map((x, i) => i === idx ? { ...x, ingredient_id: nextId } : x));
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
                    className="flex-1 px-4 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all disabled:bg-slate-200 disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
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
