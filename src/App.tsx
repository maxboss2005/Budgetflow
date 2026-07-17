import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Wifi, 
  WifiOff, 
  CloudLightning,
  Wallet,
  X,
  Sparkles,
  HelpCircle,
  Trophy,
  Zap,
  Menu,
  Sun,
  Moon,
  Bell
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

// Components
import Sidebar from './components/Sidebar';
import { useLedger } from './hooks/useLedger';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Budgets from './components/Budgets';
import Subscriptions from './components/Subscriptions';
import Savings from './components/Savings';
import Insights from './components/Insights';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Auth from './components/Auth';
import LoadingScreen from './components/LoadingScreen';
import NotificationsDrawer from './components/NotificationsDrawer';
import Rewards from './components/Rewards';
import CoreFinance from './components/CoreFinance';

// Offline DB and types
import { localDb } from './lib/indexedDb';
import { calculateStreak } from './lib/streak';
import { 
  User, 
  Transaction, 
  Budget, 
  SavingsGoal, 
  Subscription, 
  Category, 
  AppNotification,
  Account,
  Debt
} from './types';

const ACCENT_STYLES: Record<string, { primary: string; hover: string; rgb: string }> = {
  azure: { primary: '#2563EB', hover: '#1d4ed8', rgb: '37, 99, 235' },
  emerald: { primary: '#10B981', hover: '#059669', rgb: '16, 185, 129' },
  amber: { primary: '#F59E0B', hover: '#d97706', rgb: '245, 158, 11' },
  fuchsia: { primary: '#D946EF', hover: '#c084fc', rgb: '217, 70, 239' },
  gold: { primary: '#EAB308', hover: '#ca8a04', rgb: '234, 179, 8' }
};

export default function App() {
  
  // Premium accent theme overrides
  const [accentKey] = useState(() => {
    return localStorage.getItem('budgetflow_accent_key') || 'azure';
  });

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('budgetflow_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Authentication states
  const [token, setToken] = useState<string | null>(localStorage.getItem('budgetflow_token'));
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Layout states
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('budgetflow_sidebar_collapsed') === 'true');
  const [pointsAlert, setPointsAlert] = useState<{ amount: number; reason: string; id: string; isLevelUp?: boolean; level?: number } | null>(null);

  // --- Sidebar Collapse Side-effect ---
  useEffect(() => {
    localStorage.setItem('budgetflow_sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // --- Points Alert Dismiss Side-effect ---
  useEffect(() => {
    if (pointsAlert) {
      const timer = setTimeout(() => {
        setPointsAlert(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [pointsAlert]);

  // Network online state
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // --- GAMIFICATION / REWARDS SYSTEM ---
  const awardPoints = async (amount: number, reason: string) => {
    if (!user || !token) return;

    const currentPoints = user.points ?? 150;
    const currentLevel = user.level ?? 1;
    const currentAchievements = user.achievements ?? ['Budget Pioneer'];

    const newPoints = currentPoints + amount;
    
    let newLevel = currentLevel;
    let nextLevelThreshold = newLevel * 1000;
    let isLevelUp = false;

    while (newPoints >= nextLevelThreshold) {
      newLevel += 1;
      nextLevelThreshold = newLevel * 1000;
      isLevelUp = true;
    }

    const newAchievements = [...currentAchievements];
    
    if (reason.toLowerCase().includes('goal') || reason.toLowerCase().includes('savings') || reason.toLowerCase().includes('vault')) {
      if (!newAchievements.includes('Savings Hero')) {
        newAchievements.push('Savings Hero');
      }
    }
    if (reason.toLowerCase().includes('funded') || reason.toLowerCase().includes('reached') || reason.toLowerCase().includes('completed')) {
      if (!newAchievements.includes('Dream Achiever')) {
        newAchievements.push('Dream Achiever');
      }
    }
    if (reason.toLowerCase().includes('insight')) {
      if (!newAchievements.includes('AI Mind explorer')) {
        newAchievements.push('AI Mind explorer');
      }
    }
    if (newLevel >= 2 && !newAchievements.includes('Bronze Budgeter')) {
      newAchievements.push('Bronze Budgeter');
    }
    if (newLevel >= 3 && !newAchievements.includes('Silver Saver')) {
      newAchievements.push('Silver Saver');
    }
    if (newLevel >= 5 && !newAchievements.includes('Gold Wealthmaster')) {
      newAchievements.push('Gold Wealthmaster');
    }

    const updates = {
      points: newPoints,
      level: newLevel,
      achievements: newAchievements
    };

    // Optimistically update
    setUser(prev => prev ? { ...prev, ...updates } : null);

    setPointsAlert({
      amount,
      reason,
      id: Math.random().toString(36).substring(2, 9),
      isLevelUp,
      level: newLevel
    });

    try {
      const notifMsg = isLevelUp 
        ? `🎉 LEVEL UP! You've reached Level ${newLevel}! Outstanding wealth accumulation progress!` 
        : `Earned +${amount} XP: ${reason}.`;
      
      const responseNotif = await fetch('/api/finance/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: isLevelUp ? 'system' : 'savings_milestone',
          message: notifMsg
        })
      });
      if (responseNotif.ok) {
        const result = await responseNotif.json();
        setNotifications(prev => [result.notification, ...prev]);
      }
    } catch (err) {
      console.warn('Notification posting failed:', err);
    }

    try {
      await fetch('/api/auth/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
    } catch (err) {
      console.warn('Points sync failed:', err);
    }
  };

  // Financial Datasets States
  const [categories, setCategories] = useState<Category[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  const [currencySymbol, setCurrencySymbol] = useState('$');

  const {
    transactions,
    setTransactions,
    budgets,
    setBudgets,
    goals,
    setGoals,
    subscriptions,
    setSubscriptions,
    accounts,
    setAccounts,
    debts,
    setDebts,
    syncQueueLength,
    setSyncQueueLength,
    isSyncing,
    dataLoading,
    setDataLoading,
    updateLocalQueueCount,
    handleTriggerSync,
    handleAddTransaction,
    handleUpdateTransaction,
    handleDeleteTransaction,
    handleAddBudget,
    handleUpdateBudget,
    handleDeleteBudget,
    handleAddAccount,
    handleUpdateAccount,
    handleDeleteFinanceAccount,
    handleAddDebt,
    handleUpdateDebt,
    handleDeleteDebt,
    handleAddGoal,
    handleUpdateGoal,
    handleDeleteGoal,
    handleAddSubscription,
    handleUpdateSubscription,
    handleDeleteSubscription
  } = useLedger(token, isOnline, user, categories, setCategories, awardPoints);

  // PWA installation states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(() => {
    return (window as any).getDeferredInstallPrompt?.() || null;
  });
  const [isAppInstalled, setIsAppInstalled] = useState(() => {
    return window.matchMedia('(display-mode: standalone)').matches || 
           (navigator as any).standalone === true || 
           localStorage.getItem('devfint_pwa_installed') === 'true';
  });

  useEffect(() => {
    const earlyPrompt = (window as any).getDeferredInstallPrompt?.();
    if (earlyPrompt) {
      setDeferredPrompt(earlyPrompt);
    }

    // Register global hook for early capture callbacks
    (window as any).onBeforeInstallPromptReady = (e: any) => {
      setDeferredPrompt(e);
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      (window as any).clearDeferredInstallPrompt?.();
      setTimeout(() => {
        awardPoints(150, "PWA Installed! DevFint is now a fully native app! 📱✨");
      }, 1500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      (window as any).onBeforeInstallPromptReady = null;
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Install choice outcome: ${outcome}`);
    setDeferredPrompt(null);
    (window as any).clearDeferredInstallPrompt?.();
  };

  // PWA/Network synchronization states (Managed by useLedger hook)

  // Global Transaction modal states (FAB shortcut)
  const [globalTxModalOpen, setGlobalTxModalOpen] = useState(false);
  const [globalTxAmount, setGlobalTxAmount] = useState('');
  const [globalTxType, setGlobalTxType] = useState<'income' | 'expense'>('expense');
  const [globalTxCategoryId, setGlobalTxCategoryId] = useState('');
  const [globalTxDate, setGlobalTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [globalTxNotes, setGlobalTxNotes] = useState('');
  const [globalTxAccountId, setGlobalTxAccountId] = useState('');

  // --- Theme Toggle Side-effects ---
  useEffect(() => {
    localStorage.setItem('budgetflow_theme', theme);
    const root = document.documentElement;
    root.classList.add('theme-transition');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    const timer = setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 500);
    return () => clearTimeout(timer);
  }, [theme]);

  // --- Network Event Listeners ---
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerAutomaticSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [token]);

  // --- Startup Authentication check ---
  useEffect(() => {
    const initAuthAndDB = async () => {
      try {
        // Initialize local IndexedDB store
        await localDb.init();
        await updateLocalQueueCount();

        if (token) {
          // Verify current user details against cloud auth me
          const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            const result = await response.json();
            setUser(result.user);
            setCurrencySymbol(getSymbolByCode(result.user.currency || 'USD'));
          } else {
            // Session invalid, flush state
            handleLogout();
          }
        }
      } catch (err) {
        console.error('Failed initialization cycle:', err);
      } finally {
        setAuthLoading(false);
      }
    };

    initAuthAndDB();
  }, [token]);

  // --- Hydrate datasets once authenticated ---
  useEffect(() => {
    if (!token || authLoading) return;

    const hydrateData = async () => {
      setDataLoading(true);
      try {
        if (isOnline) {
          // Sync any offline queued operations first before fetching clean datasets
          const queue = await localDb.getQueue();
          if (queue.length > 0) {
            await handleTriggerSync();
            setDataLoading(false);
            return;
          }

          // 1. Fetch live from Express cloud gateway
          const [catRes, txRes, bRes, gRes, subRes, notRes, accRes, debtRes] = await Promise.all([
            fetch('/api/finance/categories', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/finance/transactions', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/finance/budgets', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/finance/goals', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/finance/subscriptions', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/finance/notifications', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/finance/accounts', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/finance/debts', { headers: { 'Authorization': `Bearer ${token}` } })
          ]);

          if (catRes.ok && txRes.ok && bRes.ok && gRes.ok && subRes.ok && notRes.ok && accRes.ok && debtRes.ok) {
            const [cats, txs, buds, gls, subs, notifs, accs, dbts] = await Promise.all([
              catRes.json(), txRes.json(), bRes.json(), gRes.json(), subRes.json(), notRes.json(), accRes.json(), debtRes.json()
            ]);

            // Cache batch replacement inside IndexedDB
            await localDb.cacheAll(
              txs.transactions,
              buds.budgets,
              gls.goals,
              subs.subscriptions,
              cats.categories,
              accs.accounts,
              dbts.debts
            );

            // Populate React States
            setTransactions(txs.transactions);
            setBudgets(buds.budgets);
            setGoals(gls.goals);
            setSubscriptions(subs.subscriptions);
            setCategories(cats.categories);
            setNotifications(notifs.notifications);
            setAccounts(accs.accounts || []);
            setDebts(dbts.debts || []);
            
            // Set first matching category as global default
            const defaultExpense = cats.categories.find((c: Category) => c.type === 'expense');
            if (defaultExpense) setGlobalTxCategoryId(defaultExpense.id);

            return;
          }
        }

        // 2. Offline Fallback: hydrate entirely from IndexedDB
        console.log('Hydrating workspace from offline IndexedDB stores...');
        const [cats, txs, buds, gls, subs, accs, dbts] = await Promise.all([
          localDb.getAll<Category>('categories'),
          localDb.getAll<Transaction>('transactions'),
          localDb.getAll<Budget>('budgets'),
          localDb.getAll<SavingsGoal>('goals'),
          localDb.getAll<Subscription>('subscriptions'),
          localDb.getAll<Account>('accounts'),
          localDb.getAll<Debt>('debts')
        ]);

        setTransactions(txs);
        setBudgets(buds);
        setGoals(gls);
        setSubscriptions(subs);
        setCategories(cats);
        setAccounts(accs || []);
        setDebts(dbts || []);
        
        const defaultExpense = cats.find((c: Category) => c.type === 'expense');
        if (defaultExpense) setGlobalTxCategoryId(defaultExpense.id);

      } catch (err) {
        console.error('Data hydration failure:', err);
      } finally {
        setDataLoading(false);
      }
    };

    hydrateData();
  }, [token, isOnline, authLoading]);

  // --- Currency mapping helper ---
  const getSymbolByCode = (code: string) => {
    const map: Record<string, string> = { 'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'AUD': 'A$', 'NGN': '₦' };
    return map[code] || '$';
  };

  const getCodeBySymbol = (sym: string) => {
    const map: Record<string, string> = { '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY', 'A$': 'AUD', '₦': 'NGN' };
    return map[sym] || 'USD';
  };

  // --- Synchronization Trigger pipeline ---
  const triggerAutomaticSync = () => {
    // If online and queue exists, run synchronizer
    localDb.getQueue().then(queue => {
      if (queue.length > 0 && navigator.onLine && token) {
        handleTriggerSync();
      }
    });
  };

  // --- AUTH HANDLERS ---
  const handleLoginSuccess = (newUser: User, newToken: string) => {
    localStorage.setItem('budgetflow_token', newToken);
    setToken(newToken);
    setUser(newUser);
    setCurrencySymbol(getSymbolByCode(newUser.currency || 'USD'));
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    localStorage.removeItem('budgetflow_token');
    setToken(null);
    setUser(null);
    setTransactions([]);
    setBudgets([]);
    setGoals([]);
    setSubscriptions([]);
    setNotifications([]);
    setSyncQueueLength(0);
    try {
      await localDb.clearQueue();
      await localDb.cacheAll([], [], [], [], []);
    } catch (err) {
      console.warn('IndexedDB logout cleanup warning:', err);
    }
  };

  const handleUpdateUser = async (updates: any) => {
    if (!token) return;
    const response = await fetch('/api/auth/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    if (response.ok) {
      const result = await response.json();
      setUser(result.user);
      setCurrencySymbol(getSymbolByCode(result.user.currency || 'USD'));
      return result.user;
    } else {
      throw new Error('Failed to update profile settings.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!token) return;
    const response = await fetch('/api/auth/delete', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      handleLogout();
    } else {
      alert('Could not terminate user profile on the cloud.');
    }
  };

  const handleBackupData = () => {
    try {
      const backupObj = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        accounts,
        debts,
        transactions,
        budgets,
        goals,
        subscriptions,
        categories
      };
      const jsonStr = JSON.stringify(backupObj, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", url);
      downloadAnchor.setAttribute("download", `devfint_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
      awardPoints(50, "Data security backup successfully generated! 🔒💎");
    } catch (err) {
      console.error('Backup failure:', err);
    }
  };

  const handleRestoreData = async (data: any): Promise<boolean> => {
    try {
      if (!data || typeof data !== 'object') return false;

      if (isOnline && token) {
        try {
          const response = await fetch('/api/finance/restore', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ data })
          });
          if (response.ok) {
            const result = await response.json();
            await localDb.cacheAll(
              result.transactions,
              result.budgets,
              result.goals,
              result.subscriptions,
              result.categories,
              result.accounts,
              result.debts
            );

            setTransactions(result.transactions);
            setBudgets(result.budgets);
            setGoals(result.goals);
            setSubscriptions(result.subscriptions);
            setCategories(result.categories);
            setAccounts(result.accounts || []);
            setDebts(result.debts || []);

            awardPoints(150, "Financial data ledger successfully restored and synchronized with Cloud database! 🌐📈");
            return true;
          } else {
            console.warn('Cloud restore failed, falling back to local restoration.');
          }
        } catch (err) {
          console.error('Cloud restore request error:', err);
        }
      }

      const restoredAccounts = Array.isArray(data.accounts) ? data.accounts : [];
      const restoredDebts = Array.isArray(data.debts) ? data.debts : [];
      const restoredTransactions = Array.isArray(data.transactions) ? data.transactions : [];
      const restoredBudgets = Array.isArray(data.budgets) ? data.budgets : [];
      const restoredGoals = Array.isArray(data.goals) ? data.goals : [];
      const restoredSubscriptions = Array.isArray(data.subscriptions) ? data.subscriptions : [];
      const restoredCategories = Array.isArray(data.categories) ? data.categories : [];

      // cacheAll into localDb
      await localDb.cacheAll(
        restoredTransactions,
        restoredBudgets,
        restoredGoals,
        restoredSubscriptions,
        restoredCategories,
        restoredAccounts,
        restoredDebts
      );

      // Populate React States instantly
      setAccounts(restoredAccounts);
      setDebts(restoredDebts);
      setTransactions(restoredTransactions);
      setBudgets(restoredBudgets);
      setGoals(restoredGoals);
      setSubscriptions(restoredSubscriptions);
      setCategories(restoredCategories);

      awardPoints(150, "Financial data ledger successfully restored from secure backup document! 🌐📈");
      return true;
    } catch (err) {
      console.error('Restore failure:', err);
      return false;
    }
  };



  // --- LEDGER OPERATIONS DELEGATED TO HOOK ---

  // All CRUD Operations, Offline Queuing, and Sync triggers are encapsulated in the useLedger custom hook above.

  const handleUpdateCategory = async (id: string, updates: any) => {
    setCategories(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    const localItem = categories.find(c => c.id === id);
    if (localItem) {
      await localDb.put('categories', { ...localItem, ...updates });
    }

    if (isOnline && token) {
      try {
        const response = await fetch(`/api/finance/categories/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updates)
        });
        if (response.ok) {
          const result = await response.json();
          setCategories(prev => prev.map(item => item.id === id ? result.category : item));
          await localDb.put('categories', result.category);
          return;
        }
      } catch (err) {
        console.warn('Category update failed on cloud, queuing offline:', err);
      }
    }

    await localDb.addToQueue('update', 'category', { id, updates });
    await updateLocalQueueCount();
  };

  // 5. Notifications Mark Read
  const handleMarkNotificationsRead = async (id?: string) => {
    if (id) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }

    if (isOnline && token) {
      try {
        await fetch('/api/finance/notifications/read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ id })
        });
      } catch (err) {
        console.warn('Failed marking notifications read on cloud:', err);
      }
    }
  };

  const openGlobalTxModal = (type: 'expense' | 'income' = 'expense') => {
    setGlobalTxAmount('');
    setGlobalTxType(type);
    const firstCat = categories.find(c => c.type === type);
    setGlobalTxCategoryId(firstCat?.id || '');
    setGlobalTxDate(new Date().toISOString().split('T')[0]);
    setGlobalTxNotes('');
    setGlobalTxAccountId(accounts[0]?.id || '');
    setGlobalTxModalOpen(true);
  };

  // --- GLOBAL TRANSACTION MODAL ACTION FORM SUBMIT (FAB Shortcut) ---
  const handleGlobalTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(globalTxAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid transfer amount.');
      return;
    }

    handleAddTransaction({
      amount: parsedAmount,
      type: globalTxType,
      categoryId: globalTxCategoryId,
      date: globalTxDate,
      notes: globalTxNotes.trim(),
      accountId: globalTxAccountId || undefined
    });

    // Reset fields
    setGlobalTxAmount('');
    setGlobalTxNotes('');
    setGlobalTxAccountId('');
    setGlobalTxModalOpen(false);
  };

  // --- Auth Guards Loader Render block ---
  if (authLoading) {
    return <LoadingScreen />;
  }

  // Auth screen display if not logged in
  if (!token || !user) {
    return <Auth onAuthSuccess={handleLoginSuccess} />;
  }

  // --- View Selector Matrix router ---
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            user={user}
            transactions={transactions}
            budgets={budgets}
            goals={goals}
            subscriptions={subscriptions}
            categories={categories}
            currencySymbol={currencySymbol}
            onAddTxClick={() => openGlobalTxModal('expense')}
            setActiveTab={setActiveTab}
            loading={dataLoading}
            deferredPrompt={deferredPrompt}
            onInstallApp={handleInstallApp}
            isAppInstalled={isAppInstalled}
            setIsAppInstalled={setIsAppInstalled}
            awardPoints={awardPoints}
          />
        );
      case 'accounts':
        return (
          <CoreFinance
            accounts={accounts}
            debts={debts}
            transactions={transactions}
            categories={categories}
            currencySymbol={currencySymbol}
            onAddAccount={handleAddAccount}
            onUpdateAccount={handleUpdateAccount}
            onDeleteAccount={handleDeleteFinanceAccount}
            onAddDebt={handleAddDebt}
            onUpdateDebt={handleUpdateDebt}
            onDeleteDebt={handleDeleteDebt}
            onAddTransaction={handleAddTransaction}
          />
        );
      case 'transactions':
        return (
          <Transactions
            transactions={transactions}
            categories={categories}
            accounts={accounts}
            currencySymbol={currencySymbol}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            isOnline={isOnline}
            token={token}
            awardPoints={awardPoints}
          />
        );
      case 'budgets':
        return (
          <Budgets
            budgets={budgets}
            categories={categories}
            transactions={transactions}
            currencySymbol={currencySymbol}
            accounts={accounts}
            onAddBudget={handleAddBudget}
            onUpdateBudget={handleUpdateBudget}
            onDeleteBudget={handleDeleteBudget}
          />
        );
      case 'subscriptions':
        return (
          <Subscriptions
            subscriptions={subscriptions}
            categories={categories}
            currencySymbol={currencySymbol}
            onAddSubscription={handleAddSubscription}
            onUpdateSubscription={handleUpdateSubscription}
            onDeleteSubscription={handleDeleteSubscription}
          />
        );
      case 'savings':
        return (
          <Savings
            goals={goals}
            currencySymbol={currencySymbol}
            accounts={accounts}
            categories={categories}
            onAddTransaction={handleAddTransaction}
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        );
      case 'insights':
        return (
          <Insights 
            token={token} 
            isOnline={isOnline} 
            transactions={transactions}
            categories={categories}
            budgets={budgets}
            goals={goals}
            subscriptions={subscriptions}
            currencySymbol={currencySymbol}
          />
        );
      case 'rewards':
        return (
          <Rewards
            user={user}
            transactions={transactions}
            subscriptions={subscriptions}
            categories={categories}
            budgets={budgets}
            goals={goals}
            currencySymbol={currencySymbol}
            awardPoints={awardPoints}
            onUpdateUser={handleUpdateUser}
            token={token}
          />
        );
      case 'reports':
        return (
          <Reports
            transactions={transactions}
            categories={categories}
            budgets={budgets}
            goals={goals}
            currencySymbol={currencySymbol}
          />
        );
      case 'settings':
        return (
          <Settings
            user={user}
            token={token}
            onUpdateUser={handleUpdateUser}
            onDeleteAccount={handleDeleteAccount}
            currencySymbol={currencySymbol}
            setCurrencySymbol={setCurrencySymbol}
            isAppInstalled={isAppInstalled}
            deferredPrompt={deferredPrompt}
            onInstallApp={handleInstallApp}
            categories={categories}
            onUpdateCategory={handleUpdateCategory}
            onBackupData={handleBackupData}
            onRestoreData={handleRestoreData}
          />
        );
      default:
        return <div className="p-8 text-slate-500">Unresolved section scope</div>;
    }
  };

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {accentKey !== 'azure' && ACCENT_STYLES[accentKey] && (
        <style>{`
          .bg-blue-600 { background-color: ${ACCENT_STYLES[accentKey].primary} !important; }
          .bg-blue-500 { background-color: ${ACCENT_STYLES[accentKey].primary} !important; }
          .text-blue-600 { color: ${ACCENT_STYLES[accentKey].primary} !important; }
          .text-blue-500 { color: ${ACCENT_STYLES[accentKey].primary} !important; }
          .border-blue-500 { border-color: ${ACCENT_STYLES[accentKey].primary} !important; }
          .border-blue-600 { border-color: ${ACCENT_STYLES[accentKey].primary} !important; }
          .hover\\:bg-blue-600:hover { background-color: ${ACCENT_STYLES[accentKey].hover} !important; }
          .hover\\:bg-blue-700:hover { background-color: ${ACCENT_STYLES[accentKey].hover} !important; }
          .focus\\:ring-blue-500:focus { --tw-ring-color: ${ACCENT_STYLES[accentKey].primary} !important; }
          .shadow-blue-500\\/25 { --tw-shadow-color: rgba(${ACCENT_STYLES[accentKey].rgb}, 0.25) !important; }
          .shadow-blue-500\\/20 { --tw-shadow-color: rgba(${ACCENT_STYLES[accentKey].rgb}, 0.2) !important; }
          .bg-blue-50 { background-color: rgba(${ACCENT_STYLES[accentKey].rgb}, 0.05) !important; }
          .dark\\:bg-blue-900\\/15 { background-color: rgba(${ACCENT_STYLES[accentKey].rgb}, 0.15) !important; }
          .text-blue-400 { color: ${ACCENT_STYLES[accentKey].primary} !important; }
        `}</style>
      )}
      
      {/* 1. Side Drawer Panel */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        theme={theme}
        setTheme={setTheme}
        isOnline={isOnline}
        syncQueueLength={syncQueueLength}
        isSyncing={isSyncing}
        onTriggerSync={handleTriggerSync}
        unreadNotificationsCount={unreadNotificationsCount}
        setIsNotificationOpen={setNotificationsOpen}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        deferredPrompt={deferredPrompt}
        onInstallApp={handleInstallApp}
      />

      {/* 2. Main content view block */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Mobile top fixed header and offline banner container */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex flex-col">
          <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/80 shadow-sm transition-colors duration-200">
            <div className="flex items-center gap-2">
              <Menu className="w-6 h-6 text-slate-600 dark:text-slate-300 cursor-pointer" onClick={() => setSidebarOpen(true)} />
              <div className="flex items-center gap-1.5 ml-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-sm text-slate-900 dark:text-white">DevFint</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>

              {/* Notifications Dropdown Selector */}
              <button 
                onClick={() => setNotificationsOpen(true)} 
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative cursor-pointer"
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
          
          {/* Mobile dynamic network alarm banner if offline (hidden in print) */}
          {!isOnline && (
            <div className="bg-amber-500 text-white px-4 py-1.5 text-[10px] font-bold flex items-center justify-center gap-2 shadow-sm no-print">
              <WifiOff className="w-3.5 h-3.5 text-white" />
              <span className="truncate">Operating Offline. local queue holds active ledgers.</span>
            </div>
          )}
        </div>
        
        {/* Desktop dynamic network alarm banner if offline (hidden in print) */}
        {!isOnline && (
          <div className="hidden md:flex bg-amber-500 text-white px-4 py-2 text-xs font-bold items-center justify-center gap-2 shadow-sm no-print">
            <WifiOff className="w-4 h-4 text-white" />
            <span>Currently Operating Offline. Ledger additions are held locally and automatically queued for synchronization.</span>
          </div>
        )}

        {/* Dynamic view component mount */}
        <div className={`flex-1 overflow-y-auto pb-16 md:pb-6 ${isOnline ? 'pt-[53px]' : 'pt-[85px]'} md:pt-0`}>
          {renderView()}
        </div>

      </main>

      {/* 3. In-App Notifications list drawer */}
      <NotificationsDrawer
        notifications={notifications}
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onMarkRead={handleMarkNotificationsRead}
      />

      {/* 4. Persistent Floating Action Button Shortcut (FAB) */}
      <button
        onClick={() => openGlobalTxModal('expense')}
        className="fixed bottom-6 right-6 z-40 md:z-10 w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xl hover:shadow-blue-600/35 hover:scale-105 active:scale-95 transition-all cursor-pointer no-print"
        title="Log transaction instantly"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* 5. Global FAB Transaction logger modal */}
      {globalTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span>Instant Transfer Logger</span>
              </h3>
              <button onClick={() => setGlobalTxModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGlobalTxSubmit} className="p-6 space-y-4">
              
              {/* Type selector */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                <button
                  type="button"
                  onClick={() => {
                    setGlobalTxType('expense');
                    const firstExp = categories.find(c => c.type === 'expense');
                    setGlobalTxCategoryId(firstExp?.id || '');
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${globalTxType === 'expense' ? 'bg-white dark:bg-slate-800 text-red-500 shadow-sm' : 'text-slate-400'}`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGlobalTxType('income');
                    const firstInc = categories.find(c => c.type === 'income');
                    setGlobalTxCategoryId(firstInc?.id || '');
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${globalTxType === 'income' ? 'bg-white dark:bg-slate-800 text-emerald-500 shadow-sm' : 'text-slate-400'}`}
                >
                  Income
                </button>
              </div>

              {/* Value and date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Value Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={globalTxAmount}
                    onChange={(e) => setGlobalTxAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Settle Date</label>
                  <input
                    type="date"
                    required
                    value={globalTxDate}
                    onChange={(e) => setGlobalTxDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Taxonomy category */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Taxonomy / Category</label>
                <select
                  value={globalTxCategoryId}
                  onChange={(e) => setGlobalTxCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {categories.filter(c => c.type === globalTxType).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Linked Account */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Linked Account (Core Finance)</label>
                <select
                  value={globalTxAccountId}
                  onChange={(e) => setGlobalTxAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">None (Cash / External)</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({currencySymbol}{acc.balance})</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Notes Reference</label>
                <input
                  type="text"
                  value={globalTxNotes}
                  onChange={(e) => setGlobalTxNotes(e.target.value)}
                  placeholder="e.g. Uber rides, salary transfer..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/15 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                <span>Commit Ledger Entry</span>
              </button>

            </form>
          </div>
        </div>
      )}

      {/* 6. Points / Level Up Toast Alert */}
      <AnimatePresence>
        {pointsAlert && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`fixed bottom-24 right-6 z-50 max-w-sm rounded-2xl border p-4 shadow-2xl flex items-start gap-4 transition-all duration-200 ${
              pointsAlert.isLevelUp
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 border-amber-400 text-white shadow-amber-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-white shadow-blue-500/10'
            }`}
          >
            {pointsAlert.isLevelUp ? (
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0 animate-bounce">
                <Trophy className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Zap className="w-5 h-5 fill-current animate-pulse" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${pointsAlert.isLevelUp ? 'text-yellow-100' : 'text-blue-500 dark:text-blue-400'}`}>
                  {pointsAlert.isLevelUp ? 'Level Unlocked! 🎉' : 'XP Acquired! ⚡'}
                </span>
                <button 
                  onClick={() => setPointsAlert(null)}
                  className={`p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${pointsAlert.isLevelUp ? 'text-white/80 hover:bg-white/10' : 'text-slate-400'}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <h4 className="text-sm font-bold mt-0.5 leading-snug">
                {pointsAlert.isLevelUp 
                  ? `Promoted to Level ${pointsAlert.level}!` 
                  : `+${pointsAlert.amount} XP gained`}
              </h4>
              
              <p className={`text-xs mt-1 ${pointsAlert.isLevelUp ? 'text-white/90 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                {pointsAlert.reason}
              </p>
              
              {!pointsAlert.isLevelUp && (
                <div className="mt-2.5 flex items-center gap-1.5">
                  <div className="text-[10px] text-slate-400 font-mono shrink-0">
                    Total: {user?.points ?? 150} XP
                  </div>
                  <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-300"
                      style={{ width: `${(((user?.points ?? 150) % 1000) / 1000) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
