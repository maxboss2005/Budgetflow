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
  Info
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

  // Currencies list map
  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro Union' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }
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
    if (confirm('Are you sure you want to reset your local offline cache? This will clear all pending local transactions in your sync queue and refresh from the server.')) {
      localStorage.clear();
      // Drop IndexedDB
      const req = indexedDB.deleteDatabase('BudgetFlowDB');
      req.onsuccess = () => {
        alert('Local cache database drop complete. Reloading workspace...');
        window.location.reload();
      };
      req.onerror = () => {
        alert('Could not delete local stores.');
      };
    }
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

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
          
          {/* Credentials Guide */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
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
          <div className="bg-white dark:bg-slate-900 border border-red-500/20 rounded-3xl p-6 shadow-sm space-y-4 relative overflow-hidden">
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
                onClick={() => { if (confirm('CRITICAL ALERT: Are you sure you want to permanently delete your user account? This will wipe your financial databases on the cloud.')) onDeleteAccount(); }}
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

      </div>

    </div>
  );
}
