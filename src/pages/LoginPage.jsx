import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { motion } from 'framer-motion';
import { User, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const { login } = useApp();
  const [accountId, setAccountId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await login({ accountId, password });
    if (!result.success) {
      setError(result.message); 
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-primary-600 text-white rounded-[24px] flex items-center justify-center font-bold text-3xl mb-4 shadow-2xl shadow-primary-200">
            Z
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
            Zwit<span className="text-primary-600">BlakTea</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-wide text-xs mt-2">Premium POS Solution</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Account ID</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="text"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:border-primary-500 focus:bg-white transition-all tracking-wide"
                    placeholder="ADM000001"
                    disabled={isLoading}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:border-primary-500 focus:bg-white transition-all tracking-wide"
                    placeholder="Enter password"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-red-500 text-xs font-bold mt-2 ml-1"
                >
                  <AlertCircle size={14} />
                  {error}
                </motion.div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-slate-900 text-white py-5 rounded-2xl font-bold uppercase tracking-wide transition-all shadow-xl shadow-slate-200 active:scale-[0.98] flex items-center justify-center gap-3 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-800'}`}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
              {isLoading ? 'Verifying...' : 'Login'}
            </button>
          </form>
          
        </div>
        
        <p className="text-center text-slate-400 text-xs mt-8">
          &copy; 2026 ZwitBlakTea. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
