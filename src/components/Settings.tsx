import React, { useState } from 'react';
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
  Smartphone,
  Monitor,
  Edit,
  X,
  Check
} from 'lucide-react';
import { User as UserType, Category } from '../types';
import { IconResolver } from './Dashboard';

interface SettingsProps {
  user: UserType;
  onUpdateUser: (updates: any) => Promise<any>;
  onDeleteAccount: () => void;
  currencySymbol: string;
  setCurrencySymbol: (sym: string) => void;
  isAppInstalled: boolean;
  deferredPrompt: any;
  onInstallApp: () => Promise<void>;
  categories: Category[];
  onUpdateCategory: (id: string, updates: any) => Promise<void>;
}

export default function Settings({
  user,
  onUpdateUser,
  onDeleteAccount,
  currencySymbol,
  setCurrencySymbol,
  isAppInstalled,
  deferredPrompt,
  onInstallApp,
  categories,
  onUpdateCategory
}: SettingsProps) {

  // States
  const [name, setName] = useState(user.name);
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Custom non-blocking modal confirmation states
  const [confirmTarget, setConfirmTarget] = useState<{ type: string; title: string; desc: string; action: () => void } | null>(null);

  // States for admin panel locker
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => {
    return sessionStorage.getItem('budgetflow_admin_unlocked') === 'true';
  });
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States for Category Customization
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatColor, setEditCatColor] = useState('');
  const [editCatIcon, setEditCatIcon] = useState('');

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

  const handleAdminUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'admin') {
      setIsAdminUnlocked(true);
      sessionStorage.setItem('budgetflow_admin_unlocked', 'true');
      setAdminError('');
    } else {
      setAdminError('Access denied: invalid password.');
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
        const req = indexedDB.deleteDatabase('BudgetFlowDB');
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card and general settings */}
        <div className="lg:col-span-2 space-y-6">
          
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

          {/* Progressive Web App (PWA) Install Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Smartphone className="w-4 h-4 text-blue-500" />
              <span>Native Desktop & Mobile App</span>
            </h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Install BudgetFlow directly to your system dock, desktop, or mobile home screen. Enjoy complete offline access, quick launcher shortcuts, and native application styling.
            </p>

            {isAppInstalled ? (
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-500">PWA STATUS: INSTALLED</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">BudgetFlow is running as a native standalone system application. Performance optimization active.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {deferredPrompt ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>150 XP BONUS</span>
                      </span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Native installer package is ready!</p>
                      <p className="text-[11px] text-slate-400">Click install to run BudgetFlow natively and earn bonus XP.</p>
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
                  <div className="space-y-4">
                    {/* IFrame Caution Banner */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <Info className="w-4.5 h-4.5 text-blue-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-950 dark:text-slate-50">Browser Sandbox Detected</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            PWAs cannot trigger custom install prompts inside sandboxed preview iframes. To install this app natively on your computer or phone, please open the standalone app in a new tab.
                          </p>
                        </div>
                      </div>
                      <div className="pt-1">
                        <button
                          onClick={() => window.open(window.location.href, '_blank')}
                          className="w-full py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 text-xs font-extrabold border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <Monitor className="w-4 h-4" />
                          <span>Open in Standalone Tab</span>
                        </button>
                      </div>
                    </div>

                    {/* Step-by-step device guides */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-850/50 bg-slate-50/50 dark:bg-slate-950/20">
                        <h4 className="text-[11px] font-bold text-slate-950 dark:text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                          <span>iOS / iPadOS Safari</span>
                        </h4>
                        <ol className="list-decimal pl-4 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                          <li>Open app link in <strong>Safari</strong></li>
                          <li>Tap the <strong>Share</strong> icon (box with up arrow)</li>
                          <li>Choose <strong>Add to Home Screen</strong></li>
                        </ol>
                      </div>

                      <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-850/50 bg-slate-50/50 dark:bg-slate-950/20">
                        <h4 className="text-[11px] font-bold text-slate-950 dark:text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Monitor className="w-3.5 h-3.5 text-blue-500" />
                          <span>Chrome / Edge / Opera</span>
                        </h4>
                        <ol className="list-decimal pl-4 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                          <li>Open app in a new tab</li>
                          <li>Click the <strong>Install</strong> icon in the address bar</li>
                          <li>Or open browser menu & select <strong>Install App</strong></li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Informative Walkthroughs & Credentials guides */}
        <div className="space-y-6">
          {!isAdminUnlocked ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4 text-center py-10 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Admin Credentials Required</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Access to the intelligence platform setup, live telemetry, and risk maintenance tools requires administrative clearance.
              </p>
              
              <form onSubmit={handleAdminUnlock} className="space-y-3 pt-2 max-w-xs mx-auto">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter Admin Password"
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      setAdminError('');
                    }}
                    className="w-full pl-3 pr-10 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-center font-mono placeholder:font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {adminError && <p className="text-[11px] text-red-500 font-semibold">{adminError}</p>}
                <button
                  type="submit"
                  className="w-full py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-98 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Authenticate Access</span>
                </button>
                <p className="text-[10px] text-slate-400 mt-2 font-mono bg-slate-50 dark:bg-slate-950/50 py-1 rounded-lg">
                  Default Hint: <span className="font-bold text-blue-500">admin</span>
                </p>
              </form>
            </div>
          ) : (
            <>
              {/* Unlock Banner */}
              <div className="flex items-center justify-between bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 rounded-2xl px-4 py-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Admin Mode Active</span>
                </div>
                <button
                  onClick={() => {
                    setIsAdminUnlocked(false);
                    setAdminPassword('');
                    sessionStorage.removeItem('budgetflow_admin_unlocked');
                  }}
                  className="px-2 py-1 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] rounded-lg transition-all cursor-pointer flex items-center gap-1 text-slate-700 dark:text-slate-300 shadow-sm"
                >
                  <Lock className="w-3 h-3 text-red-500" />
                  <span>Lock Panel</span>
                </button>
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
                  <p>BudgetFlow triggers the Google Gemini SDK completely <strong>server-side</strong> to protect API secrets.</p>
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
            </>
          )}
        </div>

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
