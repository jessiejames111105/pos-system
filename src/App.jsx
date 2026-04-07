import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './store/AppContext';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import POSPage from './pages/POSPage';
import ProductManagement from './pages/ProductManagement';
import Inventory from './pages/Inventory';
import Transactions from './pages/Transactions';
import UserManagement from './pages/UserManagement';
import Reports from './pages/Reports';
import LoginPage from './pages/LoginPage';

const ProtectedRoute = ({ children, roleRequired }) => {
  const { user } = useApp();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (roleRequired === 'admin' && user.role !== 'admin') {
    return <Navigate to="/pos" replace />;
  }
  
  return children;
};

function AppRoutes() {
  const { user } = useApp();

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={user?.role === 'cashier' ? "/pos" : "/"} replace />} />
      <Route path="/" element={
        <ProtectedRoute>
          {user?.role === 'cashier' ? <Navigate to="/pos" replace /> : <Dashboard />}
        </ProtectedRoute>
      } />
      <Route path="/pos" element={
        <ProtectedRoute>
          <POSPage />
        </ProtectedRoute>
      } />
      <Route path="/products" element={
        <ProtectedRoute roleRequired="admin">
          <ProductManagement />
        </ProtectedRoute>
      } />
      <Route path="/inventory" element={
        <ProtectedRoute roleRequired="admin">
          <Inventory />
        </ProtectedRoute>
      } />
      <Route path="/transactions" element={
        <ProtectedRoute>
          <Transactions />
        </ProtectedRoute>
      } />
      <Route path="/sales" element={
        <ProtectedRoute>
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">Daily Sales Reports</div>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute roleRequired="admin">
          <Reports />
        </ProtectedRoute>
      } />
      <Route path="/customers" element={
        <ProtectedRoute roleRequired="admin">
          <UserManagement />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute roleRequired="admin">
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">Settings Page (Admin Only)</div>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
}

function AppContent() {
  const { user } = useApp();
  
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <AppRoutes />
    </Layout>
  );
}

export default App;
