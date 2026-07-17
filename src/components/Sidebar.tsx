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
  X,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Download
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
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  deferredPrompt?: any;
  onInstallApp?: () => void;
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
  setIsOpen,
  isCollapsed,
  onToggleCollapse,
  deferredPrompt,
  onInstallApp
}: SidebarProps) {

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', name: 'Core Finance', icon: Wallet },
    { id: 'transactions', name: 'Transactions', icon: ArrowLeftRight },
    { id: 'budgets', name: 'Budgets', icon: PieChart },
    { id: 'subscriptions', name: 'Subscriptions', icon: CalendarClock },
    { id: 'savings', name: 'Savings Goals', icon: TrendingUp },
    { id: 'insights', name: 'AI Smart Insights', icon: BrainCircuit, badge: 'Gemini' },
    { id: 'rewards', name: 'Milestones Hub', icon: Trophy, badge: user?.level && user.level >= 5 ? 'Unlocked' : 'Rank' },
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
      {/* Backdrop for mobile drawer */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Sidebar Component Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 md:sticky md:z-10 h-screen flex flex-col justify-between 
        bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800/80
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 w-64 md:w-auto'}
      `}>
        
        {/* Upper Sidebar Brand block */}
        <div className={`p-6 ${isCollapsed ? 'md:p-4 md:flex md:flex-col md:items-center' : ''}`}>
          <div className="flex items-center justify-between w-full">
            <div className={`flex items-center gap-2 ${isCollapsed ? 'md:justify-center' : ''}`}>
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <Wallet className="w-4.5 h-4.5 text-white" />
              </div>
              <span className={`font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent ${isCollapsed ? 'md:hidden' : ''}`}>DevFint</span>
            </div>
            
            {/* Desktop Collapse Button */}
            <button 
              onClick={onToggleCollapse}
              className={`hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${isCollapsed ? 'md:mt-3' : ''}`}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Mobile Close Button */}
            <button className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Sync Status Overlay Module */}
          <div className={`mt-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/40 ${isCollapsed ? 'md:hidden' : ''}`}>
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
        <nav className={`flex-1 px-4 space-y-1 overflow-y-auto ${isCollapsed ? 'md:px-2' : ''}`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors relative group/menu cursor-pointer
                  ${isCollapsed ? 'md:justify-center md:px-0' : ''}
                  ${isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/15 text-blue-600 dark:text-blue-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span className={`${isCollapsed ? 'md:hidden' : ''}`}>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-mono ${isCollapsed ? 'md:hidden' : ''}`}>
                    {item.badge}
                  </span>
                )}
                
                {/* Tooltip on Collapsed Hover */}
                {isCollapsed && (
                  <div className="absolute left-16 scale-0 group-hover/menu:scale-100 transition-all origin-left duration-200 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded px-2.5 py-1.5 shadow-xl whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* PWA Install Button Prompt (Directly requested by user) */}
        {deferredPrompt && (
          <div className="mx-4 mb-2 p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 relative group/install overflow-hidden">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/install:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col gap-1.5">
              {!isCollapsed && (
                <>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <CloudLightning className="w-4 h-4 text-amber-300 animate-pulse animate-duration-[2s]" />
                    <span>Run DevFint Native!</span>
                  </div>
                  <p className="text-[10px] text-blue-100 leading-normal">
                    Get standalone performance and earn 150 XP instantly!
                  </p>
                </>
              )}
              <button
                onClick={onInstallApp}
                className={`w-full flex items-center justify-center gap-2 py-1.5 rounded-lg bg-white text-blue-600 text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer ${isCollapsed ? 'p-1.5' : ''}`}
                title="Install DevFint App"
              >
                <Download className="w-3.5 h-3.5" />
                {!isCollapsed && <span>Install App</span>}
              </button>
            </div>
          </div>
        )}

        {/* Gamification Points & Level Section */}
        <div className="mt-4">
          {isCollapsed ? (
            /* Centered level circle badge when collapsed */
            <div className="flex flex-col items-center justify-center py-2 relative group cursor-pointer" title={`Level ${user.level ?? 1} (${user.points ?? 150} XP)`}>
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-blue-500/40 dark:border-blue-500/30 flex items-center justify-center bg-blue-50 dark:bg-blue-950/40 relative hover:scale-105 transition-transform">
                <span className="text-xs font-black text-blue-600 dark:text-blue-400 font-mono">{user.level ?? 1}</span>
                <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-amber-500 text-[10px] text-white flex items-center justify-center shadow-sm">
                  🏆
                </span>
              </div>
              
              {/* Tooltip on Hover */}
              <div className="absolute left-16 top-1/2 -translate-y-1/2 scale-0 group-hover:scale-100 transition-all origin-left duration-200 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs rounded-xl p-3 shadow-xl whitespace-nowrap z-50 border border-slate-200 dark:border-slate-800">
                <p className="font-bold flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  Level {user.level ?? 1} - Financial Savant
                </p>
                <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden my-1.5">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${((user.points ?? 150) % 1000) / 10}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  {user.points ?? 150} Total XP • {(user.achievements ?? ['Budget Pioneer']).length} achievements
                </p>
              </div>
            </div>
          ) : (
            /* Rich Points Card when expanded */
            <div className="mx-4 mb-4 p-3.5 rounded-2xl bg-gradient-to-tr from-blue-50/80 to-indigo-50/40 dark:from-slate-950/60 dark:to-slate-900/40 border border-blue-100/40 dark:border-slate-800/80 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Level {user.level ?? 1}</span>
                </div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 font-mono">{(user.points ?? 150) % 1000} / 1000 XP</span>
              </div>
              <div className="w-full h-2 bg-slate-200/60 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${((user.points ?? 150) % 1000) / 10}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                <span className="truncate max-w-[120px] font-medium text-slate-500 dark:text-slate-400">
                  🏆 {(user.achievements ?? ['Budget Pioneer']).length} Accomplishments
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-blue-500 font-bold dark:text-blue-400">
                  {(user.level ?? 1) === 1 ? 'Novice' : (user.level ?? 1) === 2 ? 'Bronze' : (user.level ?? 1) === 3 ? 'Silver' : 'Gold'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Sidebar Profile Block */}
        <div className={`p-4 border-t border-slate-200/60 dark:border-slate-800/80 space-y-3 ${isCollapsed ? 'md:p-2 md:flex md:flex-col md:items-center md:space-y-4' : ''}`}>
          
          {/* Header Action controls */}
          <div className={`hidden md:flex items-center justify-between px-2 w-full ${isCollapsed ? 'md:flex-col md:gap-3 md:px-0 md:justify-center' : ''}`}>
            {/* Theme selector */}
            <button 
              onClick={toggleTheme} 
              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* In app alert list dropdown selector */}
            <button 
              onClick={() => setIsNotificationOpen(true)} 
              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
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

          <div className={`flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors w-full relative group/profile
            ${isCollapsed ? 'md:justify-center md:flex-col md:gap-2' : ''}
          `}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm uppercase shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className={`flex-1 min-w-0 ${isCollapsed ? 'md:hidden' : ''}`}>
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-mono">{user.email}</p>
              <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 block mt-1 uppercase tracking-wider font-mono">
                👤 Personal Account
              </span>
            </div>
            
            <button 
              onClick={onLogout}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-red-500 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${isCollapsed ? 'md:mt-1' : ''}`}
              title="Logout Account"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Tooltip on Profile Hover */}
            {isCollapsed && (
              <div className="absolute left-16 scale-0 group-hover/profile:scale-100 transition-all origin-left duration-200 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium rounded px-2.5 py-1.5 shadow-xl whitespace-nowrap z-50 border border-slate-200 dark:border-slate-800">
                <p className="font-semibold">{user.name}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">{user.email}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
