import React from 'react';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  PieChart, 
  CalendarClock, 
  TrendingUp, 
  BrainCircuit, 
  FileSpreadsheet, 
  Settings, 
  LogOut, 
  Wallet,
  Wifi,
  WifiOff,
  CloudLightning,
  Sun,
  Moon,
  Bell,
  Menu,
  X
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  isOnline: boolean;
  syncQueueLength: number;
  isSyncing: boolean;
  onTriggerSync: () => void;
  unreadNotificationsCount: number;
  setIsNotificationOpen: (open: boolean) => void;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  user,
  theme,
  setTheme,
  isOnline,
  syncQueueLength,
  isSyncing,
  onTriggerSync,
  unreadNotificationsCount,
  setIsNotificationOpen,
  onLogout,
  isOpen,
  setIsOpen
}: SidebarProps) {

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', name: 'Transactions', icon: ArrowLeftRight },
    { id: 'budgets', name: 'Budgets', icon: PieChart },
    { id: 'subscriptions', name: 'Subscriptions', icon: CalendarClock },
    { id: 'savings', name: 'Savings Goals', icon: TrendingUp },
    { id: 'insights', name: 'AI Smart Insights', icon: BrainCircuit, badge: 'Gemini' },
    { id: 'reports', name: 'Export Reports', icon: FileSpreadsheet },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const handleMenuClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpen(false); // Close mobile drawer
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <>
      {/* Mobile top sticky header */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/80 shadow-sm transition-colors duration-200">
        <div className="flex items-center gap-2">
          <Menu className="w-6 h-6 text-slate-600 dark:text-slate-300 cursor-pointer" onClick={() => setIsOpen(true)} />
          <div className="flex items-center gap-1.5 ml-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-slate-900 dark:text-white">BudgetFlow</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme} 
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Notifications Dropdown Selector */}
          <button 
            onClick={() => setIsNotificationOpen(true)} 
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Backdrop for mobile drawer */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Sidebar Component Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 md:sticky md:z-10 w-64 h-screen flex flex-col justify-between 
        bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800/80
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Upper Sidebar Brand block */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                <Wallet className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">BudgetFlow</span>
            </div>
            
            <button className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Sync Status Overlay Module */}
          <div className="mt-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-emerald-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-amber-500" />
                )}
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isOnline ? 'Online Grid' : 'Offline Engine'}
                </span>
              </div>
              
              {syncQueueLength > 0 && (
                <button 
                  onClick={onTriggerSync}
                  disabled={isSyncing || !isOnline}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40"
                >
                  <CloudLightning className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sync ({syncQueueLength})
                </button>
              )}
            </div>
            {syncQueueLength > 0 && (
              <p className="text-[10px] text-slate-400 mt-1">
                {isSyncing ? 'Re-playing queued transactions...' : `${syncQueueLength} structural actions queued locally.`}
              </p>
            )}
          </div>
        </div>

        {/* Lower/Middle Sidebar Navigation Links block */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/15 text-blue-600 dark:text-blue-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Sidebar Profile Block */}
        <div className="p-4 border-t border-slate-200/60 dark:border-slate-800/80 space-y-3">
          
          {/* Header Action controls */}
          <div className="hidden md:flex items-center justify-between px-2">
            {/* Theme selector */}
            <button 
              onClick={toggleTheme} 
              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* In app alert list dropdown selector */}
            <button 
              onClick={() => setIsNotificationOpen(true)} 
              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate font-mono">{user.email}</p>
            </div>
            
            <button 
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Logout Account"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
