import React, { useState } from 'react';
import { 
  UserPlus, 
  Shield, 
  User, 
  Trash2, 
  AlertTriangle,
  Filter,
  X, 
  Lock,
  Search,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

const UserManagement = () => {
  const { accounts, createAccount, deleteAccount, user: currentUser } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successUser, setSuccessUser] = useState(null);
  const [createConfirmOpen, setCreateConfirmOpen] = useState(false);
  const [pendingCreate, setPendingCreate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // all | admin | cashier
  const [formData, setFormData] = useState({
    name: '',
    role: 'cashier',
    password: ''
  });

  const handleOpenModal = () => {
    setFormData({ name: '', role: 'cashier', password: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPendingCreate({
      name: formData.name,
      role: formData.role,
      password: formData.password
    });
    setIsModalOpen(false);
    setCreateConfirmOpen(true);
  };

  const confirmCreate = async () => {
    if (!pendingCreate) return;
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await createAccount(pendingCreate);
      if (!result.ok) return;
      setSuccessUser({
        name: pendingCreate.name,
        role: pendingCreate.role,
        account_id: result.account?.account_id || result.account?.email || null
      });
      setCreateConfirmOpen(false);
      setPendingCreate(null);
      setIsSuccessOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = accounts.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    const q = searchTerm.toLowerCase();
    const acctId = String(u.account_id || u.email || '').toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      acctId.includes(q)
    );
  });

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    await deleteAccount(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 text-sm">Manage system access for Admins and Cashiers.</p>
        </div>
        <button 
          onClick={handleOpenModal}
          className="btn btn-primary flex items-center gap-2"
        >
          <UserPlus size={18} />
          Add New User
        </button>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or role..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2 py-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400 px-2">
              <Filter size={16} />
            </div>
            {[
              { key: 'all', label: 'All' },
              { key: 'admin', label: 'Admin' },
              { key: 'cashier', label: 'Cashier' }
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setRoleFilter(opt.key)}
                className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${
                  roleFilter === opt.key
                    ? 'bg-primary-600 text-white shadow'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Users</span>
          <span className="text-lg font-bold text-slate-900">{accounts.length}</span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-wide">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Account ID</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center ${u.role === 'admin' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                        {u.role === 'admin' ? <Shield size={18} /> : <User size={18} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                        {currentUser.id === u.id && <span className="text-[10px] text-primary-600 font-bold uppercase">You</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-700">{u.account_id || u.email || '—'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setDeleteTarget({ id: u.id, name: u.name, email: u.account_id || u.email || '—', role: u.role })}
                      disabled={currentUser.id === u.id}
                      className={`p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all ${currentUser.id === u.id ? 'opacity-0 pointer-events-none' : ''}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
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
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">Add New System User</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Full Name</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">System Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['cashier', 'admin'].map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFormData({ ...formData, role: r })}
                        className={`py-3 rounded-xl text-xs font-bold uppercase transition-all border-2 ${formData.role === r ? 'bg-primary-50 border-primary-600 text-primary-700 shadow-sm' : 'bg-white border-slate-100 text-slate-400'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Account ID</label>
                  <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-400">
                    Auto-generated (ADM / CSH)
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Password</label>
                  <div className="relative">
                    <input
                      required
                      type="password"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bold"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-xs uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all text-xs uppercase disabled:bg-slate-200 disabled:shadow-none"
                  >
                    Continue
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {createConfirmOpen && pendingCreate && (
          <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isSubmitting) setCreateConfirmOpen(false);
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">Confirm Create</h3>
                <button
                  onClick={() => {
                    if (!isSubmitting) setCreateConfirmOpen(false);
                  }}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Name</span>
                    <span className="text-sm font-bold text-slate-900">{pendingCreate.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Account ID</span>
                    <span className="text-sm font-bold text-slate-900">Auto-generated (ADM / CSH)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Role</span>
                    <span className="text-sm font-bold text-slate-900 uppercase">{pendingCreate.role}</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    disabled={isSubmitting}
                    onClick={() => {
                      setCreateConfirmOpen(false);
                      setIsModalOpen(true);
                    }}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all text-xs uppercase disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    Back
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={confirmCreate}
                    className="flex-1 px-4 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all text-xs uppercase disabled:bg-slate-200 disabled:shadow-none"
                  >
                    {isSubmitting ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSuccessOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSuccessOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">Account Created</h3>
                <button
                  onClick={() => setIsSuccessOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <div className="h-10 w-10 rounded-xl bg-white text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <CheckCircle2 size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">Success</p>
                    <p className="text-xs text-slate-600">New user is saved in the database.</p>
                  </div>
                </div>

                {successUser && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Name</span>
                      <span className="text-sm font-bold text-slate-900">{successUser.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Account ID</span>
                      <span className="text-sm font-bold text-slate-900">{successUser.account_id || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Role</span>
                      <span className="text-sm font-bold text-slate-900 uppercase">{successUser.role}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setIsSuccessOpen(false)}
                  className="w-full px-4 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all text-xs uppercase"
                >
                  Done
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
                    <p className="text-sm font-bold text-slate-900">Delete this account?</p>
                    <p className="text-xs text-slate-600">This action cannot be undone.</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Name</span>
                    <span className="text-sm font-bold text-slate-900">{deleteTarget.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Account ID</span>
                    <span className="text-sm font-bold text-slate-900">{deleteTarget.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Role</span>
                    <span className="text-sm font-bold text-slate-900 uppercase">{deleteTarget.role}</span>
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

export default UserManagement;
