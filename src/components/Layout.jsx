import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Bell,
  User,
  History,
  TrendingUp,
  Check,
  CheckCheck,
  Trash2,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import NotificationToasts from './NotificationToasts';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/', role: 'admin' },
  { name: 'Take Order', icon: ShoppingCart, path: '/pos', role: 'cashier' },
  { name: 'Transactions', icon: History, path: '/transactions', role: 'cashier' },
  { name: 'Product Management', icon: Package, path: '/products', role: 'admin' },
  { name: 'Inventory', icon: Package, path: '/inventory', role: 'admin' },
  { name: 'User Management', icon: Users, path: '/customers', role: 'admin' },
  { name: 'Settings', icon: Settings, path: '/settings', role: 'admin' },
];

const Sidebar = () => {
  const { isSidebarOpen, isSidebarHidden, user, logout } = useApp();
  const location = useLocation();
  const [hoverOpen, setHoverOpen] = useState(false);

  const filteredNavItems = navItems.filter(item => 
    user?.role === 'admin' || item.role === 'cashier'
  );

  if (isSidebarHidden) return null;
  const effectiveOpen = isSidebarOpen || hoverOpen;

  return (
    <aside
      onMouseEnter={() => {
        if (!isSidebarOpen) setHoverOpen(true);
      }}
      onMouseLeave={() => setHoverOpen(false)}
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out border-r border-slate-200 bg-white shadow-2xl shadow-slate-200/50",
        effectiveOpen ? "w-72" : "w-24",
        "hidden lg:block"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo Section */}
        <div className="flex h-24 items-center justify-center px-8">
          {effectiveOpen ? (
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Zwit<span className="text-primary-600">BlakTea</span>
            </h1>
          ) : (
            <div className="mx-auto h-12 w-12 bg-primary-600 text-white rounded-2xl flex items-center justify-center font-bold shadow-lg shadow-primary-200">
              Z
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={cn(
                  "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon
                  className={cn(
                    "shrink-0 transition-colors",
                    effectiveOpen ? "mr-3" : "mx-auto",
                    isActive ? "text-primary-600" : "text-slate-400 group-hover:text-slate-600"
                  )}
                  size={20}
                />
                {effectiveOpen && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4">
          <button
            onClick={logout}
            className={cn(
              "flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-all",
              !effectiveOpen && "justify-center"
            )}
          >
            <LogOut
              className={cn("shrink-0", effectiveOpen ? "mr-3" : "")}
              size={20}
            />
            {effectiveOpen && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

const Navbar = ({ setIsMobileMenuOpen }) => {
  const { user, logout, dailySales, notifications, markNotificationRead, deleteNotification, markAllNotificationsRead, clearNotifications } = useApp();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const location = useLocation();

  const filteredNavItems = navItems.filter(item => 
    user?.role === 'admin' || item.role === 'cashier'
  );

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <Menu size={24} />
          </button>
          
          <div className="hidden sm:flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Today's Sales</span>
              <span className="text-lg font-bold text-primary-600">₱{dailySales.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 relative">
          <div
            onMouseEnter={() => setIsNotificationsOpen(true)}
            onMouseLeave={() => setIsNotificationsOpen(false)}
          >
            <button
              onClick={() => setIsNotificationsOpen(v => !v)}
              className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            >
              <Bell size={20} />
              {notifications.some(n => !n.read) && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              )}
            </button>
            {isNotificationsOpen && (
              <div className="absolute right-0 top-12 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                <span className="text-sm font-bold text-slate-900">Notifications</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => markAllNotificationsRead()}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200"
                    title="Mark all as read"
                  >
                    <CheckCheck size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => clearNotifications()}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200"
                    title="Delete all"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-slate-500 text-center">
                    No notifications
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.slice().reverse().map((n) => (
                      <div key={n.id} className="px-4 py-3 flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-1 h-2.5 w-2.5 rounded-full",
                            n.read
                              ? "bg-slate-200"
                              : n.type === 'warning'
                                ? "bg-amber-500"
                                : n.type === 'error'
                                  ? "bg-rose-500"
                                  : n.type === 'success'
                                    ? "bg-emerald-500"
                                    : "bg-slate-400"
                          )}
                        ></span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800 leading-snug">{n.message}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-1">{n.type}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!n.read ? (
                            <button
                              type="button"
                              onClick={() => markNotificationRead(n.id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                              title="Mark as read"
                            >
                              <Check size={16} />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => deleteNotification(n.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
          
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="flex items-center gap-3 pl-2">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.name}</p>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-tight">
                {user?.role}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold border-2 border-white shadow-sm">
              <User size={20} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export const Layout = ({ children }) => {
  const { isSidebarOpen, setIsSidebarOpen, isSidebarHidden, setIsSidebarHidden, user, logout } = useApp();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const filteredNavItems = navItems.filter(item => 
    user?.role === 'admin' || item.role === 'cashier'
  );

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      <Sidebar />
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isSidebarHidden ? "lg:ml-0" : (isSidebarOpen ? "lg:ml-72" : "lg:ml-24")
        )}
      >
        <Navbar setIsMobileMenuOpen={setIsMobileMenuOpen} />
        <NotificationToasts />
        <main className="p-4 sm:p-6 lg:p-10">
          <div className="mx-auto max-w-[1600px]">
            {children}
          </div>
        </main>
        
        {/* Sidebar Toggle for Desktop */}
        {!isSidebarHidden ? (
          <div className="fixed bottom-10 left-8 z-50 hidden lg:flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSidebarHidden(true)}
              className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xl text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all flex items-center justify-center"
              title="Hide sidebar"
            >
              <X size={20} />
            </button>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xl text-slate-400 hover:text-primary-600 hover:border-primary-600 transition-all flex items-center justify-center"
              title="Collapse/expand"
            >
              {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsSidebarHidden(false)}
            className="fixed bottom-10 left-4 z-50 p-3 rounded-2xl bg-white border border-slate-200 shadow-xl text-slate-400 hover:text-primary-600 hover:border-primary-600 transition-all hidden lg:flex items-center justify-center"
            title="Show sidebar"
          >
            <Menu size={20} />
          </button>
        )}
      </div>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-[200] flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="relative flex h-full w-full max-w-xs flex-col bg-white p-4 shadow-xl overflow-y-auto">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xl font-bold text-slate-900 tracking-tight leading-none">
                  Zwit<span className="text-primary-600">BlakTea</span>
                </span>
                <span className="mt-1 text-xs text-slate-400 font-bold uppercase tracking-wide">{user?.role}</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              >
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 space-y-2">
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center rounded-xl px-4 py-3 text-base font-medium transition-all",
                      isActive
                        ? "bg-primary-50 text-primary-700 shadow-sm"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <item.icon className={cn("mr-4", isActive ? "text-primary-600" : "text-slate-400")} size={24} />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
            <div className="mt-auto border-t border-slate-100 pt-4">
              <button
                onClick={logout}
                className="flex w-full items-center rounded-xl px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="mr-4" size={24} />
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : null}
      
      {/* Mobile Tab Bar (Bottom Nav) */}
      {!isMobileMenuOpen ? (
      <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-slate-200 bg-white/95 backdrop-blur-md lg:hidden">
        <div className={`grid h-16 px-2`} style={{ gridTemplateColumns: `repeat(${filteredNavItems.length}, 1fr)` }}>
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-1 transition-all",
                  isActive ? "text-primary-600" : "text-slate-500"
                )}
              >
                <item.icon size={20} className={isActive ? "animate-pulse" : ""} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
      ) : null}
    </div>
  );
};
