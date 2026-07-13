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
  AlertCircle
} from 'lucide-react';
import { User as UserType } from '../types';

interface SettingsProps {
  user: UserType;
  onUpdateUser: (updates: any) => Promise<any>;
  onDeleteAccount: () => void;
  currencySymbol: string;
  setCurrencySymbol: (sym: string) => void;
}

export default function Settings({
  user,
  onUpdateUser,
  onDeleteAccount,
  currencySymbol,
  setCurrencySymbol
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
