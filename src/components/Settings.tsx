import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Coins, 
  Trash2, 
  Database, 
  Key, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Info,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  AlertCircle,
  Download,
  Upload,
  Smartphone,
  Monitor,
  Edit,
  X,
  Check,
  Users,
  ShieldAlert
} from 'lucide-react';
import { User as UserType, Category } from '../types';
import { IconResolver } from './Dashboard';

interface SettingsProps {
  user: UserType;
  token?: string;
  onUpdateUser: (updates: any) => Promise<any>;
  onDeleteAccount: () => void;
  currencySymbol: string;
  setCurrencySymbol: (sym: string) => void;
  isAppInstalled: boolean;
  deferredPrompt: any;
  onInstallApp: () => Promise<void>;
  categories: Category[];
  onUpdateCategory: (id: string, updates: any) => Promise<void>;
  onBackupData?: () => void;
  onRestoreData?: (data: any) => Promise<boolean>;
}

export default function Settings({
  user,
  token,
  onUpdateUser,
  onDeleteAccount,
  currencySymbol,
  setCurrencySymbol,
  isAppInstalled,
  deferredPrompt,
  onInstallApp,
  categories,
  onUpdateCategory,
  onBackupData,
  onRestoreData
}: SettingsProps) {

  // States
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
  const [name, setName] = useState(user.name);
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Custom non-blocking modal confirmation states
  const [confirmTarget, setConfirmTarget] = useState<{ type: string; title: string; desc: string; action: () => void } | null>(null);

  // States for Category Customization
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatColor, setEditCatColor] = useState('');
  const [editCatIcon, setEditCatIcon] = useState('');

  // States and handler for Backup & Restore
  const [backupSuccess, setBackupSuccess] = useState('');
  const [backupError, setBackupError] = useState('');

  const handleFileImportChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setBackupSuccess('');
    setBackupError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = event.target?.result as string;
        const parsed = JSON.parse(jsonContent);
        if (!parsed || typeof parsed !== 'object') {
          setBackupError('Invalid backup file. Root must be a JSON object.');
          return;
        }
        if (onRestoreData) {
          const success = await onRestoreData(parsed);
          if (success) {
            setBackupSuccess('Data profile successfully restored from backup! 🚀');
            setTimeout(() => setBackupSuccess(''), 4500);
          } else {
            setBackupError('The data in the backup was rejected or could not be loaded.');
          }
        } else {
          setBackupError('Restore capability is not active on this view.');
        }
      } catch (err) {
        setBackupError('Failed to parse file as valid JSON ledger data.');
      }
    };
    reader.onerror = () => {
      setBackupError('Could not read the file from storage.');
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset selection
  };

  // States for Admin Registered Users list
  const [adminUsers, setAdminUsers] = useState<UserType[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsersError, setAdminUsersError] = useState('');

  // Fetch users when component mounts if the active session is an admin
  const fetchAdminUsers = async () => {
    if (user.role !== 'admin' || !token) return;
    setAdminUsersLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAdminUsers(data.users || []);
        setAdminUsersError('');
      } else {
        const errData = await response.json();
        setAdminUsersError(errData.error || 'Failed to fetch registered users list');
      }
    } catch (err) {
      setAdminUsersError('Offline/Network interruption while loading users list');
    } finally {
      setAdminUsersLoading(false);
    }
  };

  useEffect(() => {
    if (user.role === 'admin' && token) {
      fetchAdminUsers();
    }
  }, [user.role, token]);

  const handleUpdateUserRole = async (targetUserId: string, newRole: 'admin' | 'user') => {
    if (!token) return;
    try {
      const response = await fetch(`/api/admin/users/${targetUserId}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (response.ok) {
        setSuccessMsg('User administrative role successfully updated.');
        fetchAdminUsers();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const errData = await response.json();
        alert(errData.error || 'Failed to update user role');
      }
    } catch (err) {
      alert('Failed to update user role');
    }
  };

  const handleAdminDeleteUser = async (targetUserId: string) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/admin/users/${targetUserId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setSuccessMsg('User account database successfully purged from systems.');
        fetchAdminUsers();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const errData = await response.json();
        alert(errData.error || 'Failed to delete user account');
      }
    } catch (err) {
      alert('Failed to execute user account delete operation');
    }
  };

  const startCategoryEdit = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setEditCatName(cat.name);
    setEditCatColor(cat.color || '#3B82F6');
    setEditCatIcon(cat.icon || 'HelpCircle');
  };

  const handleSaveCategoryEdit = async () => {
    if (!editingCategoryId) return;
    if (!editCatName.trim()) {
      alert('Category name is required.');
      return;
    }
    try {
      await onUpdateCategory(editingCategoryId, {
        name: editCatName.trim(),
        color: editCatColor,
        icon: editCatIcon,
      });
      setEditingCategoryId(null);
      setSuccessMsg('Category updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update category.');
    }
  };

  // Currencies list map
  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro Union' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' }
  ];

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await onUpdateUser({ name });
      setSuccessMsg('User profile configurations successfully committed.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Profile updates failed.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCurrencyChange = (code: string, sym: string) => {
    setCurrencySymbol(sym);
    onUpdateUser({ currency: code });
  };

  const handleIndexedDBReset = () => {
    setConfirmTarget({
      type: 'reset_cache',
      title: 'Reset Client Cache',
      desc: 'Are you sure you want to reset your local offline cache? This will clear all pending local transactions in your sync queue and refresh from the server.',
      action: () => {
        localStorage.clear();
        // Drop IndexedDB
        indexedDB.deleteDatabase('BudgetFlowDB');
        indexedDB.deleteDatabase('budgetflow_indexeddb');
        const req = indexedDB.deleteDatabase('devfint_indexeddb');
        req.onsuccess = () => {
          setSuccessMsg('Local cache dropped. Reloading workspace...');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        };
        req.onerror = () => {
          setErrorMsg('Could not delete local stores.');
        };
      }
    });
  };

  return (
    <div id="settings-view" className="p-6 md:p-8 space-y-6 animate-fade-in no-print">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <SettingsIcon className="w-7 h-7 text-slate-700 dark:text-slate-300" />
          <span>System Settings</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure profile thresholds, regional currencies, and local databases.</p>
      </div>

      <div className={`grid grid-cols-1 ${user.role === 'admin' ? 'lg:grid-cols-3' : ''} gap-6`}>
        
        {/* Profile Card and general settings */}
        <div className={`${user.role === 'admin' ? 'lg:col-span-2' : 'w-full'} space-y-6`}>
          
          {/* Profile Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-blue-500" />
              <span>User Profile Parameters</span>
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* Profile Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">User Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Login Email (Read-Only)</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200/40 dark:border-slate-800/30 bg-slate-100/60 dark:bg-slate-950/40 text-slate-400 font-mono focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Success/Error displays */}
              {successMsg && (
                <p className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{successMsg}</span>
                </p>
              )}
              {errorMsg && <p className="text-xs text-red-500 font-semibold">{errorMsg}</p>}

              <button
                type="submit"
                disabled={updating}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${updating ? 'animate-spin' : ''}`} />
                <span>{updating ? 'Updating Profiles...' : 'Commit Settings'}</span>
              </button>
            </form>
          </div>

          {/* Currencies preferences */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Coins className="w-4 h-4 text-emerald-500" />
              <span>Preferred Currency Code</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">Adjust your preferred operational ledger currency symbol, used instantly throughout the workspace dashboards.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {currencies.map(c => {
                const isActive = currencySymbol === c.symbol;
                return (
                  <button
                    key={c.code}
                    onClick={() => handleCurrencyChange(c.code, c.symbol)}
                    className={`
                      p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer
                      ${isActive 
                        ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-500 text-blue-500' 
                        : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 hover:bg-slate-50 text-slate-600 dark:text-slate-400'}
                    `}
                  >
                    <span className="text-xs font-bold">{c.code}</span>
                    <span className="text-lg font-extrabold mt-1 font-mono">{c.symbol}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Colors & Icon Customizer */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <SettingsIcon className="w-4 h-4 text-purple-500" />
              <span>Category Colors & Icon Customizer</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Completely customize your transaction categories. Re-map their names, color markers, and Lucide iconography dynamically. These changes propagate instantly across charts, ledgers, and bento cards.
            </p>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isEditing = editingCategoryId === cat.id;
                return (
                  <div 
                    key={cat.id} 
                    className="p-3.5 rounded-2xl border border-slate-150 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                  >
                    {isEditing ? (
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Category Name</label>
                            <input
                              type="text"
                              value={editCatName}
                              onChange={(e) => setEditCatName(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Icon Type</label>
                            <select
                              value={editCatIcon}
                              onChange={(e) => setEditCatIcon(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                            >
                              <option value="Briefcase">💼 Salary (Briefcase)</option>
                              <option value="Laptop">💻 Freelance (Laptop)</option>
                              <option value="Utensils">🍴 Food (Utensils)</option>
                              <option value="Car">🚗 Transport (Car)</option>
                              <option value="ShoppingBag">🛍️ Shopping (ShoppingBag)</option>
                              <option value="FileText">📄 Bills (FileText)</option>
                              <option value="Heart">❤️ Health (Heart)</option>
                              <option value="GraduationCap">🎓 Education (GraduationCap)</option>
                              <option value="Play">🎮 Entertainment (Play)</option>
                              <option value="Home">🏠 Rent (Home)</option>
                              <option value="Sparkles">✨ Others (Sparkles)</option>
                              <option value="Dumbbell">💪 Fitness (Dumbbell)</option>
                              <option value="Wallet">💳 Wallet</option>
                            </select>
                          </div>
                        </div>

                        {/* Color Selector circles */}
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Color Palette Marker</label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              '#EF4444', // red
                              '#F59E0B', // amber
                              '#10B981', // emerald
                              '#3B82F6', // blue
                              '#6366F1', // indigo
                              '#8B5CF6', // purple
                              '#EC4899', // pink
                              '#6B7280', // gray
                              '#14B8A6', // teal
                              '#F43F5E', // rose
                            ].map((col) => (
                              <button
                                key={col}
                                type="button"
                                onClick={() => setEditCatColor(col)}
                                style={{ backgroundColor: col }}
                                className={`w-5 h-5 rounded-full transition-all cursor-pointer ${editCatColor === col ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'opacity-80 hover:opacity-100 hover:scale-105'}`}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={handleSaveCategoryEdit}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Apply Changes</span>
                          </button>
                          <button
                            onClick={() => setEditingCategoryId(null)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                          >
                            <IconResolver name={cat.icon || 'HelpCircle'} className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {cat.name}
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold">
                                {cat.type}
                              </span>
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: cat.color }}></span>
                              <span className="text-[10px] font-mono text-slate-400 uppercase">{cat.color}</span>
                              <span className="text-[10px] font-mono text-slate-400">· {cat.icon || 'HelpCircle'}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => startCategoryEdit(cat)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Edit className="w-3 h-3 text-slate-400" />
                          <span>Customize</span>
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data Backup & Portability Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-blue-500" />
              <span>Data Portability & Database Backups</span>
            </h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Export your entire user configuration, categorizations, ledger entries, goals, and savings profiles into a portable JSON document. You can restore this file anytime to recover your data or migrate between devices instantly.
            </p>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onBackupData}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-550/10 cursor-pointer flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Download className="w-4 h-4" />
                  <span>Export JSON Backup</span>
                </button>
                
                <button
                  onClick={() => document.getElementById('backup-upload-input')?.click()}
                  className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Restore from Backup</span>
                </button>
                
                <input
                  type="file"
                  id="backup-upload-input"
                  accept=".json"
                  onChange={handleFileImportChange}
                  className="hidden"
                />
              </div>

              {backupSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 animate-fade-in font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{backupSuccess}</span>
                </div>
              )}

              {backupError && (
                <div className="p-3.5 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center gap-2.5 text-xs text-red-500 animate-fade-in font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{backupError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Progressive Web App (PWA) Install Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Smartphone className="w-4 h-4 text-blue-500" />
              <span>Native Desktop & Mobile App</span>
            </h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Install DevFint directly to your system dock, desktop, or mobile home screen. Enjoy complete offline access, quick launcher shortcuts, and native application styling.
            </p>

            {isAppInstalled ? (
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-500">PWA STATUS: INSTALLED</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">DevFint is running as a native standalone system application. Performance optimization active.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Non-blocking friendly standalone tip */}
                {isInIframe && (
                  <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-start gap-2">
                      <Info className="w-4.5 h-4.5 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-relaxed">
                        <strong>Preview Mode Active:</strong> Open DevFint in a standalone window to enable instant 1-click home screen install.
                      </p>
                    </div>
                    <button
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 text-[10px] font-extrabold border border-slate-200 dark:border-slate-800 rounded-lg shrink-0 cursor-pointer"
                    >
                      Open Standalone
                    </button>
                  </div>
                )}

                {deferredPrompt ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>150 XP BONUS</span>
                      </span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">DevFint is installable!</p>
                      <p className="text-[11px] text-slate-450">Click below to install DevFint as a native app on your home screen or dock.</p>
                    </div>
                    <button
                      onClick={onInstallApp}
                      className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-650/15 cursor-pointer flex items-center justify-center gap-2 transition-all shrink-0 active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>Install App Now</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    <p className="font-bold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                      <Smartphone className="w-4 h-4 shrink-0" />
                      <span>Install on Your Device</span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      You can run DevFint as a lightweight native application directly on your phone, tablet, or desktop. Use the easy step-by-step instructions below!
                    </p>
                  </div>
                )}

                {/* Step-by-step device guides (Always visible for multi-platform support) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-850/50 bg-slate-50/50 dark:bg-slate-950/20">
                    <h4 className="text-[11px] font-bold text-slate-950 dark:text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                      <span>iOS / iPadOS Safari</span>
                    </h4>
                    <ol className="list-decimal pl-4 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <li>Open this URL in <strong>Safari</strong> browser</li>
                      <li>Tap the browser <strong>Share</strong> icon</li>
                      <li>Select <strong>Add to Home Screen</strong> option</li>
                    </ol>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-850/50 bg-slate-50/50 dark:bg-slate-950/20">
                    <h4 className="text-[11px] font-bold text-slate-950 dark:text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5 text-blue-500" />
                      <span>Android / Chrome</span>
                    </h4>
                    <ol className="list-decimal pl-4 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <li>Open this URL in <strong>Chrome</strong> browser</li>
                      <li>Tap the three-dots <strong>Menu</strong></li>
                      <li>Select <strong>Install App</strong> or <strong>Add to Home screen</strong></li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Informative Walkthroughs & Credentials guides (Only visible to authenticated administrators) */}
        {user.role === 'admin' && (
          <div className="space-y-6">
            {/* Active Admin Workspace Banner */}
            <div className="flex items-center justify-between bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 rounded-2xl px-4 py-3 text-xs text-emerald-600 dark:text-emerald-400 font-bold shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span>Active Administrator Workspace</span>
              </div>
              <span className="text-[9px] uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full font-extrabold text-emerald-600 dark:text-emerald-400">
                Secure Session
              </span>
            </div>

            {/* Registered Users Management database card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/40 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span>Registered Users ({adminUsers.length})</span>
                </h3>
                <button
                  onClick={fetchAdminUsers}
                  disabled={adminUsersLoading}
                  className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-500 transition-all cursor-pointer disabled:opacity-50"
                  title="Force refresh database logs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${adminUsersLoading ? 'animate-spin text-blue-500' : ''}`} />
                </button>
              </div>

              {adminUsersLoading && adminUsers.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 animate-pulse flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                  <span>Synchronizing database catalog...</span>
                </div>
              ) : adminUsersError ? (
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-center space-y-2">
                  <ShieldAlert className="w-6 h-6 text-red-500 mx-auto" />
                  <p className="text-xs text-red-500 font-semibold">{adminUsersError}</p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                  {adminUsers.map((u) => {
                    const isSelf = u.id === user.id;
                    return (
                      <div 
                        key={u.id} 
                        className={`p-3.5 rounded-2xl border transition-all ${isSelf ? 'border-blue-500/20 bg-blue-500/5' : 'border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 hover:border-slate-200 dark:hover:border-slate-800'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate leading-none">
                                {u.name}
                              </span>
                              {isSelf && (
                                <span className="text-[8px] bg-blue-500/10 text-blue-600 font-extrabold px-1.5 py-0.5 rounded-full uppercase shrink-0">
                                  YOU
                                </span>
                              )}
                              <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase shrink-0 ${u.role === 'admin' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                {u.role || 'user'}
                              </span>
                            </div>
                            <p className="text-[10px] font-mono text-slate-400 break-all leading-tight">{u.email}</p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500">
                              Registered: {u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                            </p>
                          </div>

                          {/* Action panel triggers */}
                          {!isSelf && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleUpdateUserRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                                title={`Toggle administrative clearance to ${u.role === 'admin' ? 'Regular User' : 'Administrator'}`}
                                className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 text-slate-400 hover:text-blue-500 hover:border-blue-500/20 transition-all cursor-pointer shadow-xs active:scale-90"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => {
                                  setConfirmTarget({
                                    type: 'admin_delete_user',
                                    title: 'Purge User Account Record',
                                    desc: `CRITICAL SECURITY OVERWRITE: Are you sure you want to permanently erase the user account and erase all financial transaction databases associated with "${u.name}" (${u.email})? This action cannot be revoked.`,
                                    action: () => handleAdminDeleteUser(u.id)
                                  });
                                }}
                                title="Erase user data catalog"
                                className="p-1.5 rounded-lg bg-red-500/5 hover:bg-red-500/10 border border-red-500/15 text-red-500 hover:text-red-600 transition-all cursor-pointer active:scale-90"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {adminUsers.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">No users cataloged on this database cluster.</p>
                  )}
                </div>
              )}
            </div>

            {/* Credentials Guide */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-500" />
                <span>Intelligence Platform Setup</span>
              </h3>

              <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/10 text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold">
                  <Sparkles className="w-4 h-4 text-purple-500 animate-bounce" />
                  <span>How is Gemini configured?</span>
                </div>
                <p>DevFint triggers the Google Gemini SDK completely <strong>server-side</strong> to protect API secrets.</p>
                <p>The system utilizes the <strong>GEMINI_API_KEY</strong> environment variable declared inside your workspace secrets manager.</p>
                <div className="pt-1.5 text-[10px] font-bold text-slate-400 uppercase">Configuration Checklist:</div>
                <ol className="list-decimal pl-4 text-[11px] text-slate-500 space-y-1">
                  <li>Open the <strong>Settings Menu</strong> in AI Studio UI</li>
                  <li>Navigate to the <strong>Secrets panel</strong></li>
                  <li>Assign your API key to <strong>GEMINI_API_KEY</strong></li>
                </ol>
              </div>
            </div>

            {/* Infrastructure status logs card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-500" />
                <span>Infrastructure telemetry</span>
              </h3>

              <div className="space-y-2 font-mono text-[10px] text-slate-400">
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/40 pb-1.5">
                  <span>LOCAL DATABASE:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">IndexedDB v1</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/40 pb-1.5">
                  <span>OFFLINE CACHE:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">PWA SW Cache</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/40 pb-1.5">
                  <span>SERVER ENGINE:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Node/Express v4</span>
                </div>
                <div className="flex justify-between">
                  <span>REPLICATED ENGINE:</span>
                  <span className="font-bold text-emerald-500">READY</span>
                </div>
              </div>
            </div>

            {/* Danger zone card */}
            <div className="bg-white dark:bg-slate-900 border border-red-500/20 rounded-3xl p-6 shadow-sm space-y-4 relative overflow-hidden animate-fade-in">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none"></div>
              
              <h3 className="text-sm font-bold text-red-500 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>High-Risk Maintenance</span>
              </h3>

              <div className="space-y-3">
                <button
                  onClick={handleIndexedDBReset}
                  className="w-full text-left px-3.5 py-2.5 rounded-2xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/15 text-red-600 text-xs font-bold transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <p>Reset local client cache</p>
                    <p className="text-[10px] font-normal text-slate-400 mt-0.5 font-sans">Clear IndexedDB and refresh browser</p>
                  </div>
                  <Database className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setConfirmTarget({
                      type: 'purge_account',
                      title: 'Purge Account Databases',
                      desc: 'CRITICAL ALERT: Are you sure you want to permanently delete your user account? This will wipe your financial databases on the cloud. This action is irreversible.',
                      action: () => {
                        onDeleteAccount();
                      }
                    });
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-between shadow-sm shadow-red-600/15"
                >
                  <div>
                    <p>Purge account databases</p>
                    <p className="text-[10px] font-normal text-red-100/80 mt-0.5 font-sans">Irreversible erase of user and ledgers</p>
                  </div>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-500 flex items-center justify-center mx-auto animate-pulse">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {confirmTarget.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {confirmTarget.desc}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmTarget.action();
                  setConfirmTarget(null);
                }}
                className="flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl hover:shadow-lg hover:shadow-red-500/15 transition-all cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
