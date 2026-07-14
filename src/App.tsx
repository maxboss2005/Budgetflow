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
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Budgets from './components/Budgets';
import Subscriptions from './components/Subscriptions';
import Savings from './components/Savings';
import Insights from './components/Insights';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Auth from './components/Auth';
import NotificationsDrawer from './components/NotificationsDrawer';
import Rewards from './components/Rewards';

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
  AppNotification 
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

  // Financial Datasets States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [dataLoading, setDataLoading] = useState(false);

  // PWA installation states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(() => {
    return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      setTimeout(() => {
        awardPoints(150, "PWA Installed! BudgetFlow is now a fully native app! 📱✨");
      }, 1500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
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
  };

  // PWA/Network synchronization states
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueueLength, setSyncQueueLength] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Global Transaction modal states (FAB shortcut)
  const [globalTxModalOpen, setGlobalTxModalOpen] = useState(false);
  const [globalTxAmount, setGlobalTxAmount] = useState('');
  const [globalTxType, setGlobalTxType] = useState<'income' | 'expense'>('expense');
  const [globalTxCategoryId, setGlobalTxCategoryId] = useState('');
  const [globalTxDate, setGlobalTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [globalTxNotes, setGlobalTxNotes] = useState('');

  // --- Theme Toggle Side-effects ---
  useEffect(() => {
    localStorage.setItem('budgetflow_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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
          const [catRes, txRes, bRes, gRes, subRes, notRes] = await Promise.all([
            fetch('/api/finance/categories', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/finance/transactions', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/finance/budgets', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/finance/goals', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/finance/subscriptions', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/finance/notifications', { headers: { 'Authorization': `Bearer ${token}` } })
          ]);

          if (catRes.ok && txRes.ok && bRes.ok && gRes.ok && subRes.ok && notRes.ok) {
            const [cats, txs, buds, gls, subs, notifs] = await Promise.all([
              catRes.json(), txRes.json(), bRes.json(), gRes.json(), subRes.json(), notRes.json()
            ]);

            // Cache batch replacement inside IndexedDB
            await localDb.cacheAll(
              txs.transactions,
              buds.budgets,
              gls.goals,
              subs.subscriptions,
              cats.categories
            );

            // Populate React States
            setTransactions(txs.transactions);
            setBudgets(buds.budgets);
            setGoals(gls.goals);
            setSubscriptions(subs.subscriptions);
            setCategories(cats.categories);
            setNotifications(notifs.notifications);
            
            // Set first matching category as global default
            const defaultExpense = cats.categories.find((c: Category) => c.type === 'expense');
            if (defaultExpense) setGlobalTxCategoryId(defaultExpense.id);

            return;
          }
        }

        // 2. Offline Fallback: hydrate entirely from IndexedDB
        console.log('Hydrating workspace from offline IndexedDB stores...');
        const [cats, txs, buds, gls, subs] = await Promise.all([
          localDb.getAll<Category>('categories'),
          localDb.getAll<Transaction>('transactions'),
          localDb.getAll<Budget>('budgets'),
          localDb.getAll<SavingsGoal>('goals'),
          localDb.getAll<Subscription>('subscriptions')
        ]);

        setTransactions(txs);
        setBudgets(buds);
        setGoals(gls);
        setSubscriptions(subs);
        setCategories(cats);
        
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

  // --- Queue Tracking Helpers ---
  const updateLocalQueueCount = async () => {
    const queue = await localDb.getQueue();
    setSyncQueueLength(queue.length);
  };

  const triggerAutomaticSync = () => {
    // If online and queue exists, run synchronizer
    localDb.getQueue().then(queue => {
      if (queue.length > 0 && navigator.onLine && token) {
        handleTriggerSync();
      }
    });
  };

  // --- Synchronization Trigger pipeline ---
  const handleTriggerSync = async () => {
    if ((!isOnline && !navigator.onLine) || !token) return;
    setIsSyncing(true);
    try {
      const queue = await localDb.getQueue();
      if (queue.length === 0) {
        setIsSyncing(false);
        return;
      }

      const response = await fetch('/api/finance/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ queue })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Reset local queue completely
        await localDb.clearQueue();
        setSyncQueueLength(0);

        // Batch replace IndexedDB cache with server's clean reconciled datasets
        await localDb.cacheAll(
          result.transactions,
          result.budgets,
          result.goals,
          result.subscriptions,
          result.categories
        );

        // Update React states
        setTransactions(result.transactions);
        setBudgets(result.budgets);
        setGoals(result.goals);
        setSubscriptions(result.subscriptions);
        setCategories(result.categories);

        // Award points for successful local ledger sync
        awardPoints(75, 'Synchronized local transaction logs with cloud ledger');

        // Fetch notifications
        const notifRes = await fetch('/api/finance/notifications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (notifRes.ok) {
          const notifs = await notifRes.json();
          setNotifications(notifs.notifications);
        }
      } else {
        throw new Error('Cloud sync engine returned non-ok status.');
      }
    } catch (err) {
      console.error('Offline queue sync pipeline failure:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // --- AUTH HANDLERS ---
  const handleLoginSuccess = (newUser: User, newToken: string) => {
    localStorage.setItem('budgetflow_token', newToken);
    setToken(newToken);
    setUser(newUser);
    setCurrencySymbol(getSymbolByCode(newUser.currency || 'USD'));
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('budgetflow_token');
    setToken(null);
    setUser(null);
    setTransactions([]);
    setBudgets([]);
    setGoals([]);
    setSubscriptions([]);
    setNotifications([]);
    localDb.clearQueue();
    localDb.cacheAll([], [], [], [], []);
    setSyncQueueLength(0);
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

  // --- LEDGER OPERATIONS ---

  // 1. Transactions
  const handleAddTransaction = async (tx: any) => {
    const tempId = 'tx_temp_' + Math.random().toString(36).substring(2, 9);
    const category = categories.find(c => c.id === tx.categoryId);

    const fullTx: Transaction = {
      id: tempId,
      userId: user?.id || 'guest',
      amount: tx.amount,
      type: tx.type,
      categoryId: tx.categoryId,
      categoryName: category?.name || 'Retail',
      categoryColor: category?.color || '#3B82F6',
      categoryIcon: category?.icon || 'HelpCircle',
      date: tx.date,
      notes: tx.notes,
      isRecurring: tx.isRecurring,
      recurrenceRule: tx.recurrenceRule,
      receiptUrl: tx.receiptUrl,
      isSynced: false,
      createdAt: new Date().toISOString()
    };

    // Calculate daily streak bonus
    const preStreak = calculateStreak(transactions);
    const postStreak = calculateStreak([fullTx, ...transactions]);

    // Update Local States first
    setTransactions(prev => [fullTx, ...prev]);
    await localDb.put('transactions', fullTx);
    awardPoints(25, `Logged expense: ${fullTx.categoryName}`);

    // Check if this is the first transaction of today, and extends or starts a streak
    if (!preStreak.activeToday && postStreak.activeToday) {
      if (postStreak.currentStreak >= 2) {
        let bonusAmount = 50;
        let bonusReason = '';
        if (postStreak.currentStreak === 2) {
          bonusAmount = 50;
          bonusReason = `2-Day Daily Streak! Keep logging daily to build your momentum! 🔥`;
        } else if (postStreak.currentStreak === 3) {
          bonusAmount = 75;
          bonusReason = `3-Day Daily Streak! You are a financial habit champion! 🔥`;
        } else if (postStreak.currentStreak === 4) {
          bonusAmount = 100;
          bonusReason = `4-Day Daily Streak! Incredible discipline! 🔥`;
        } else {
          bonusAmount = 150;
          bonusReason = `${postStreak.currentStreak}-Day Daily Streak! UNSTOPPABLE HABIT MASTER! 👑🔥`;
        }
        setTimeout(() => {
          awardPoints(bonusAmount, bonusReason);
        }, 1000);
      } else {
        setTimeout(() => {
          awardPoints(15, `Started a new daily tracking streak! Keep logging tomorrow to build momentum! 🌱`);
        }, 1000);
      }
    }

    if (isOnline && token) {
      try {
        const response = await fetch('/api/finance/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(tx)
        });
        if (response.ok) {
          const result = await response.json();
          // Update temp ID with server ID
          setTransactions(prev => prev.map(item => item.id === tempId ? { ...result.transaction, isSynced: true } : item));
          await localDb.delete('transactions', tempId);
          await localDb.put('transactions', { ...result.transaction, isSynced: true });
          return;
        }
      } catch (err) {
        console.warn('API logging failed, queuing locally:', err);
      }
    }

    // Queue Offline Action
    await localDb.addToQueue('create', 'transaction', { ...tx, id: tempId });
    await updateLocalQueueCount();
  };

  const handleUpdateTransaction = async (id: string, updates: any) => {
    // Update Local States first
    setTransactions(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    const localItem = transactions.find(t => t.id === id);
    if (localItem) {
      await localDb.put('transactions', { ...localItem, ...updates });
    }

    if (isOnline && token && !id.startsWith('tx_temp_')) {
      try {
        const response = await fetch(`/api/finance/transactions/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updates)
        });
        if (response.ok) {
          const result = await response.json();
          setTransactions(prev => prev.map(item => item.id === id ? { ...result.transaction, isSynced: true } : item));
          await localDb.put('transactions', { ...result.transaction, isSynced: true });
          return;
        }
      } catch (err) {
        console.warn('API edit failed, queuing locally:', err);
      }
    }

    // Queue Offline Action
    await localDb.addToQueue('update', 'transaction', { id, updates });
    await updateLocalQueueCount();
  };

  const handleDeleteTransaction = async (id: string) => {
    setTransactions(prev => prev.filter(item => item.id !== id));
    await localDb.delete('transactions', id);

    if (isOnline && token && !id.startsWith('tx_temp_')) {
      try {
        const response = await fetch(`/api/finance/transactions/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) return;
      } catch (err) {
        console.warn('API deletion failed, queuing locally:', err);
      }
    }

    // Queue Offline Action
    await localDb.addToQueue('delete', 'transaction', { id });
    await updateLocalQueueCount();
  };

  // 2. Budgets
  const handleAddBudget = async (budget: any) => {
    const tempId = 'b_temp_' + Math.random().toString(36).substring(2, 9);
    const category = categories.find(c => c.id === budget.categoryId);

    const fullBudget: Budget = {
      id: tempId,
      userId: user?.id || 'guest',
      categoryId: budget.categoryId,
      categoryName: budget.categoryId === 'all' ? 'All Spending' : (category?.name || 'Unknown'),
      amount: budget.amount,
      period: budget.period,
      startDate: budget.startDate,
      endDate: budget.endDate,
      createdAt: new Date().toISOString()
    };

    setBudgets(prev => [...prev, fullBudget]);
    await localDb.put('budgets', fullBudget);
    awardPoints(50, `Configured budget for ${fullBudget.categoryName}`);

    if (isOnline && token) {
      try {
        const response = await fetch('/api/finance/budgets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(budget)
        });
        if (response.ok) {
          const result = await response.json();
          setBudgets(prev => prev.map(item => item.id === tempId ? result.budget : item));
          await localDb.delete('budgets', tempId);
          await localDb.put('budgets', result.budget);
          return;
        }
      } catch (err) {
        console.warn('Budget logging failed, queuing offline:', err);
      }
    }

    await localDb.addToQueue('create', 'budget', { ...budget, id: tempId });
    await updateLocalQueueCount();
  };

  const handleDeleteBudget = async (id: string) => {
    setBudgets(prev => prev.filter(item => item.id !== id));
    await localDb.delete('budgets', id);

    if (isOnline && token && !id.startsWith('b_temp_')) {
      try {
        const response = await fetch(`/api/finance/budgets/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) return;
      } catch (err) {
        console.warn('Budget deletion failed, queuing offline:', err);
      }
    }

    await localDb.addToQueue('delete', 'budget', { id });
    await updateLocalQueueCount();
  };

  // 3. Goals
  const handleAddGoal = async (goal: any) => {
    const tempId = 'g_temp_' + Math.random().toString(36).substring(2, 9);
    
    const fullGoal: SavingsGoal = {
      id: tempId,
      userId: user?.id || 'guest',
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: goal.targetDate,
      deadline: goal.targetDate, // Compatibility
      color: goal.color,
      icon: goal.icon,
      status: goal.status,
      createdAt: new Date().toISOString()
    };

    setGoals(prev => [...prev, fullGoal]);
    await localDb.put('goals', fullGoal);

    if (isOnline && token) {
      try {
        // Remap to API expected name
        const apiPayload = { ...goal, deadline: goal.targetDate };
        const response = await fetch('/api/finance/goals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(apiPayload)
        });
        if (response.ok) {
          const result = await response.json();
          const mappedGoal = { ...result.goal, targetDate: result.goal.deadline };
          setGoals(prev => prev.map(item => item.id === tempId ? mappedGoal : item));
          await localDb.delete('goals', tempId);
          await localDb.put('goals', mappedGoal);
          return;
        }
      } catch (err) {
        console.warn('Goal creation failed, queuing offline:', err);
      }
    }

    await localDb.addToQueue('create', 'goal', { ...goal, id: tempId });
    await updateLocalQueueCount();
  };

  const handleUpdateGoal = async (id: string, updates: any) => {
    const beforeGoal = goals.find(g => g.id === id);
    setGoals(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    const localItem = goals.find(g => g.id === id);
    if (localItem) {
      const mergedGoal = { ...localItem, ...updates };
      await localDb.put('goals', mergedGoal);
      
      // Award XP for updates (funding or finishing a goal)
      if (updates.currentAmount !== undefined && beforeGoal) {
        const addedAmount = Number(updates.currentAmount) - Number(beforeGoal.currentAmount);
        if (addedAmount > 0) {
          if (Number(updates.currentAmount) >= Number(beforeGoal.targetAmount) && beforeGoal.currentAmount < beforeGoal.targetAmount) {
            awardPoints(150, `Fully funded your savings vault "${beforeGoal.name}"! 🎉`);
          } else {
            awardPoints(40, `Deposited funds to savings goal "${beforeGoal.name}"`);
          }
        }
      } else if (updates.status === 'reached' && (!beforeGoal || beforeGoal.status !== 'reached')) {
        awardPoints(150, `Goal "${beforeGoal?.name || 'Savings'}" completed successfully! 🏆`);
      }
    }

    if (isOnline && token && !id.startsWith('g_temp_')) {
      try {
        const apiUpdates = { ...updates };
        if (updates.targetDate) apiUpdates.deadline = updates.targetDate;

        const response = await fetch(`/api/finance/goals/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(apiUpdates)
        });
        if (response.ok) {
          const result = await response.json();
          const mappedGoal = { ...result.goal, targetDate: result.goal.deadline };
          setGoals(prev => prev.map(item => item.id === id ? mappedGoal : item));
          await localDb.put('goals', mappedGoal);
          return;
        }
      } catch (err) {
        console.warn('Goal modification failed, queuing offline:', err);
      }
    }

    await localDb.addToQueue('update', 'goal', { id, updates });
    await updateLocalQueueCount();
  };

  const handleDeleteGoal = async (id: string) => {
    setGoals(prev => prev.filter(item => item.id !== id));
    await localDb.delete('goals', id);

    if (isOnline && token && !id.startsWith('g_temp_')) {
      try {
        const response = await fetch(`/api/finance/goals/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) return;
      } catch (err) {
        console.warn('Goal deletion failed, queuing offline:', err);
      }
    }

    await localDb.addToQueue('delete', 'goal', { id });
    await updateLocalQueueCount();
  };

  // 4. Subscriptions
  const handleAddSubscription = async (sub: any) => {
    const tempId = 'sub_temp_' + Math.random().toString(36).substring(2, 9);
    
    const fullSub: Subscription = {
      id: tempId,
      userId: user?.id || 'guest',
      name: sub.name,
      amount: sub.amount,
      billingCycle: sub.billingCycle,
      nextBillingDate: sub.nextBillingDate,
      status: 'active',
      categoryId: sub.categoryId,
      notes: sub.notes,
      renewalReminderEnabled: sub.renewalReminderEnabled,
      createdAt: new Date().toISOString()
    };

    setSubscriptions(prev => [...prev, fullSub]);
    await localDb.put('subscriptions', fullSub);
    awardPoints(35, `Added recurring subscription tracker: ${fullSub.name}`);

    if (isOnline && token) {
      try {
        const response = await fetch('/api/finance/subscriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(sub)
        });
        if (response.ok) {
          const result = await response.json();
          setSubscriptions(prev => prev.map(item => item.id === tempId ? result.subscription : item));
          await localDb.delete('subscriptions', tempId);
          await localDb.put('subscriptions', result.subscription);
          return;
        }
      } catch (err) {
        console.warn('Subscription tracking failed, queuing offline:', err);
      }
    }

    await localDb.addToQueue('create', 'subscription', { ...sub, id: tempId });
    await updateLocalQueueCount();
  };

  const handleUpdateSubscription = async (id: string, updates: any) => {
    setSubscriptions(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    const localItem = subscriptions.find(s => s.id === id);
    if (localItem) {
      await localDb.put('subscriptions', { ...localItem, ...updates });
    }

    if (isOnline && token && !id.startsWith('sub_temp_')) {
      try {
        const response = await fetch(`/api/finance/subscriptions/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updates)
        });
        if (response.ok) {
          const result = await response.json();
          setSubscriptions(prev => prev.map(item => item.id === id ? result.subscription : item));
          await localDb.put('subscriptions', result.subscription);
          return;
        }
      } catch (err) {
        console.warn('Subscription edit failed, queuing offline:', err);
      }
    }

    await localDb.addToQueue('update', 'subscription', { id, updates });
    await updateLocalQueueCount();
  };

  const handleDeleteSubscription = async (id: string) => {
    setSubscriptions(prev => prev.filter(item => item.id !== id));
    await localDb.delete('subscriptions', id);

    if (isOnline && token && !id.startsWith('sub_temp_')) {
      try {
        const response = await fetch(`/api/finance/subscriptions/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) return;
      } catch (err) {
        console.warn('Subscription deletion failed, queuing offline:', err);
      }
    }

    await localDb.addToQueue('delete', 'subscription', { id });
    await updateLocalQueueCount();
  };

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
      notes: globalTxNotes.trim()
    });

    // Reset fields
    setGlobalTxAmount('');
    setGlobalTxNotes('');
    setGlobalTxModalOpen(false);
  };

  // --- Auth Guards Loader Render block ---
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center animate-bounce shadow-lg shadow-blue-500/25">
          <Wallet className="w-6 h-6 text-white" />
        </div>
        <p className="text-xs font-bold font-mono tracking-widest uppercase text-slate-400 animate-pulse">Replicating Environment...</p>
      </div>
    );
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
            transactions={transactions}
            budgets={budgets}
            goals={goals}
            subscriptions={subscriptions}
            categories={categories}
            currencySymbol={currencySymbol}
            onAddTxClick={() => openGlobalTxModal('expense')}
            setActiveTab={setActiveTab}
            loading={dataLoading}
          />
        );
      case 'transactions':
        return (
          <Transactions
            transactions={transactions}
            categories={categories}
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
            onAddBudget={handleAddBudget}
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
            onUpdateUser={handleUpdateUser}
            onDeleteAccount={handleDeleteAccount}
            currencySymbol={currencySymbol}
            setCurrencySymbol={setCurrencySymbol}
            isAppInstalled={isAppInstalled}
            deferredPrompt={deferredPrompt}
            onInstallApp={handleInstallApp}
            categories={categories}
            onUpdateCategory={handleUpdateCategory}
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
                <span className="font-bold text-sm text-slate-900 dark:text-white">BudgetFlow</span>
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
