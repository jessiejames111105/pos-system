import React, { useState } from 'react';
import { 
  Plus, 
  Store, 
  MapPin, 
  ChevronRight, 
  Search, 
  Trash2, 
  Edit2, 
  X,
  CheckCircle2,
  Package,
  Layers
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

const Branches = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingBranch, setEditingBranch] = useState(null);

  // Mock initial branches
  const [branches, setBranches] = useState([
    { 
      id: 1, 
      name: 'Main Branch', 
      location: 'Downtown City', 
      status: 'Active', 
      productsCount: 45,
      categories: ['Coffee', 'Tea', 'Rice Meals']
    },
    { 
      id: 2, 
      name: 'North Mall Branch', 
      location: 'Northside Shopping Center', 
      status: 'Active', 
      productsCount: 32,
      categories: ['Coffee', 'Tea', 'Snacks']
    },
  ]);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    categories: []
  });

  const availableCategories = ['Coffee', 'Tea', 'Rice Meals', 'Sandwiches', 'Burgers', 'Snacks', 'Waffles'];

  const handleOpenModal = (branch = null) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name,
        location: branch.location,
        categories: branch.categories
      });
    } else {
      setEditingBranch(null);
      setFormData({
        name: '',
        location: '',
        categories: []
      });
    }
    setIsModalOpen(true);
  };

  const handleToggleCategory = (cat) => {
    setFormData(prev => {
      const exists = prev.categories.includes(cat);
      if (exists) {
        return { ...prev, categories: prev.categories.filter(c => c !== cat) };
      } else {
        return { ...prev, categories: [...prev.categories, cat] };
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingBranch) {
      setBranches(branches.map(b => b.id === editingBranch.id ? { ...b, ...formData } : b));
    } else {
      setBranches([...branches, { ...formData, id: Date.now(), status: 'Active', productsCount: 0 }]);
    }
    setIsModalOpen(false);
  };

  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Branch Management</h1>
          <p className="text-slate-500 text-sm">Manage branch locations and product availability.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Add New Branch
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search branches..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBranches.map((branch) => (
          <motion.div
            layout
            key={branch.id}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-xl hover:border-primary-300 transition-all duration-300"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <Store size={24} />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleOpenModal(branch)}
                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{branch.name}</h3>
                <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1">
                  <MapPin size={14} />
                  {branch.location}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {branch.categories.map((cat, idx) => (
                  <span key={idx} className="px-2 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-wide rounded-md border border-slate-100">
                    {cat}
                  </span>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-slate-400" />
                  <span className="text-sm font-bold text-slate-900">{branch.productsCount} Products</span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <CheckCircle2 size={10} />
                  {branch.status}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    {editingBranch ? 'Edit Branch' : 'Add New Branch'}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-0.5">Location & Product Setup</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Branch Name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                      placeholder="e.g., SM Mall Branch"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Location Address</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                      placeholder="e.g., 2nd Floor, SM Mall North"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Layers size={16} />
                    Available Product Categories
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleToggleCategory(cat)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                          formData.categories.includes(cat)
                            ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-4 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-wide text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-4 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 shadow-xl shadow-primary-200 transition-all uppercase tracking-wide text-xs"
                  >
                    {editingBranch ? 'Update Branch' : 'Create Branch'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Branches;