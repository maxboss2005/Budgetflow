import React, { useState, useCallback } from 'react';
import { Transaction, Budget, SavingsGoal, Subscription, Category, Account, Debt } from '../types';
import { localDb } from '../lib/indexedDb';
import { calculateStreak } from '../lib/streak';

export function useLedger(
  token: string | null,
  isOnline: boolean,
  user: any,
  categories: Category[],
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>,
  awardPoints: (amount: number, reason: string) => Promise<void>
) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [syncQueueLength, setSyncQueueLength] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // Helper helper to update queue count
  const updateLocalQueueCount = useCallback(async () => {
    const queue = await localDb.getQueue();
    setSyncQueueLength(queue.length);
  }, []);

  // Sync function
  const handleTriggerSync = useCallback(async () => {
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
          result.categories,
          result.accounts,
          result.debts
        );

        // Update React states
        setTransactions(result.transactions);
        setBudgets(result.budgets);
        setGoals(result.goals);
        setSubscriptions(result.subscriptions);
        setCategories(result.categories);
        setAccounts(result.accounts || []);
        setDebts(result.debts || []);

        // Award points for successful local ledger sync
        awardPoints(75, 'Synchronized local transaction logs with cloud ledger');
      } else {
        throw new Error('Cloud sync engine returned non-ok status.');
      }
    } catch (err) {
      console.error('Offline queue sync pipeline failure:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [token, isOnline, awardPoints, setCategories]);

  // Adjust account balance helper
  const adjustLocalAccountBalance = useCallback(async (accountId: string | undefined, amount: number) => {
    if (!accountId) return;
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        const nextBalance = Number((acc.balance + amount).toFixed(2));
        localDb.put('accounts', { ...acc, balance: nextBalance }).catch(e => console.error(e));
        return { ...acc, balance: nextBalance };
      }
      return acc;
    }));
  }, []);

  const processLocalTransactionEffect = useCallback(async (tx: any, factor: 1 | -1) => {
    const amount = Number(tx.amount) * factor;
    if (tx.type === 'income') {
      await adjustLocalAccountBalance(tx.accountId, amount);
    } else if (tx.type === 'expense') {
      await adjustLocalAccountBalance(tx.accountId, -amount);
    } else if (tx.type === 'transfer') {
      await adjustLocalAccountBalance(tx.accountId, -amount);
      await adjustLocalAccountBalance(tx.toAccountId, amount);
    }
  }, [adjustLocalAccountBalance]);

  // Add Transaction
  const handleAddTransaction = useCallback(async (tx: any) => {
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
      createdAt: new Date().toISOString(),
      accountId: tx.accountId,
      toAccountId: tx.toAccountId
    };

    // Calculate daily streak bonus
    const preStreak = calculateStreak(transactions);
    const postStreak = calculateStreak([fullTx, ...transactions]);

    // Update Local States first
    setTransactions(prev => [fullTx, ...prev]);
    await localDb.put('transactions', fullTx);
    await processLocalTransactionEffect(fullTx, 1);
    awardPoints(25, `Logged expense: ${fullTx.categoryName}`);

    // Check streak
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
          setTransactions(prev => prev.map(item => item.id === tempId ? { ...result.transaction, isSynced: true } : item));
          await localDb.delete('transactions', tempId);
          await localDb.put('transactions', { ...result.transaction, isSynced: true });
          return;
        }
      } catch (err) {
        console.warn('API logging failed, queuing locally:', err);
      }
    }

    await localDb.addToQueue('create', 'transaction', { ...tx, id: tempId });
    await updateLocalQueueCount();
  }, [categories, user, transactions, isOnline, token, awardPoints, processLocalTransactionEffect, updateLocalQueueCount]);

  // Update Transaction
  const handleUpdateTransaction = useCallback(async (id: string, updates: any) => {
    const localItem = transactions.find(t => t.id === id);
    if (localItem) {
      await processLocalTransactionEffect(localItem, -1);
      const updatedTx = { ...localItem, ...updates };
      setTransactions(prev => prev.map(item => item.id === id ? updatedTx : item));
      await localDb.put('transactions', updatedTx);
      await processLocalTransactionEffect(updatedTx, 1);
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

    await localDb.addToQueue('update', 'transaction', { id, updates });
    await updateLocalQueueCount();
  }, [transactions, isOnline, token, processLocalTransactionEffect, updateLocalQueueCount]);

  // Delete Transaction
  const handleDeleteTransaction = useCallback(async (id: string) => {
    const localItem = transactions.find(t => t.id === id);
    if (localItem) {
      await processLocalTransactionEffect(localItem, -1);
    }
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

    await localDb.addToQueue('delete', 'transaction', { id });
    await updateLocalQueueCount();
  }, [transactions, isOnline, token, processLocalTransactionEffect, updateLocalQueueCount]);

  // Add Budget
  const handleAddBudget = useCallback(async (budget: any) => {
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
  }, [categories, user, isOnline, token, awardPoints, updateLocalQueueCount]);

  // Update Budget
  const handleUpdateBudget = useCallback(async (id: string, updates: any) => {
    setBudgets(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    const localItem = budgets.find(b => b.id === id);
    if (localItem) {
      await localDb.put('budgets', { ...localItem, ...updates });
    }

    if (isOnline && token && !id.startsWith('b_temp_')) {
      try {
        const response = await fetch(`/api/finance/budgets/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updates)
        });
        if (response.ok) return;
      } catch (err) {
        console.warn('Budget update failed, queuing offline:', err);
      }
    }

    await localDb.addToQueue('update', 'budget', { id, updates });
    await updateLocalQueueCount();
  }, [budgets, isOnline, token, updateLocalQueueCount]);

  // Delete Budget
  const handleDeleteBudget = useCallback(async (id: string) => {
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
  }, [isOnline, token, updateLocalQueueCount]);

  // Add Account
  const handleAddAccount = useCallback(async (account: any) => {
    const tempId = 'acc_temp_' + Math.random().toString(36).substring(2, 9);
    const fullAccount: Account = {
      id: tempId,
      userId: user?.id || 'guest',
      name: account.name,
      type: account.type,
      balance: Number(account.balance || 0),
      color: account.color || '#3B82F6',
      createdAt: new Date().toISOString()
    };

    setAccounts(prev => [...prev, fullAccount]);
    await localDb.put('accounts', fullAccount);
    awardPoints(40, `Created ${account.name} account`);

    if (isOnline && token) {
      try {
        const response = await fetch('/api/finance/accounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(account)
        });
        if (response.ok) {
          const result = await response.json();
          setAccounts(prev => prev.map(item => item.id === tempId ? result.account : item));
          await localDb.delete('accounts', tempId);
          await localDb.put('accounts', result.account);
          return;
        }
      } catch (err) {
        console.warn('Account logging failed, queuing offline:', err);
      }
    }

    await localDb.addToQueue('create', 'account', { ...account, id: tempId });
    await updateLocalQueueCount();
  }, [user, isOnline, token, awardPoints, updateLocalQueueCount]);

  // Update Account
  const handleUpdateAccount = useCallback(async (id: string, updates: any) => {
    setAccounts(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    const localItem = accounts.find(item => item.id === id);
    if (localItem) {
      await localDb.put('accounts', { ...localItem, ...updates });
    }

    if (isOnline && token && !id.startsWith('acc_temp_')) {
      try {
        const response = await fetch(`/api/finance/accounts/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updates)
        });
        if (response.ok) {
          const result = await response.json();
          setAccounts(prev => prev.map(item => item.id === id ? result.account : item));
          await localDb.put('accounts', result.account);
          return;
        }
      } catch (err) {
        console.warn('Account update failed, queuing offline:', err);
      }
    }

    await localDb.addToQueue('update', 'account', { id, updates });
    await updateLocalQueueCount();
  }, [accounts, isOnline, token, updateLocalQueueCount]);

  // Delete Account
  const handleDeleteFinanceAccount = useCallback(async (id: string) => {
    setAccounts(prev => prev.filter(item => item.id !== id));
    await localDb.delete('accounts', id);

    if (isOnline && token && !id.startsWith('acc_temp_')) {
      try {
        const response = await fetch(`/api/finance/accounts/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) return;
      } catch (err) {
        console.warn('Account delete failed, queuing offline:', err);
      }
    }

    await localDb.addToQueue('delete', 'account', { id });
    await updateLocalQueueCount();
  }, [isOnline, token, updateLocalQueueCount]);

  // Add Debt
  const handleAddDebt = useCallback(async (debt: any) => {
    const tempId = 'debt_temp_' + Math.random().toString(36).substring(2, 9);
    const fullDebt: Debt = {
      id: tempId,
      userId: user?.id || 'guest',
      name: debt.name,
      type: debt.type,
      totalPrincipal: Number(debt.totalPrincipal),
      currentBalance: Number(debt.currentBalance),
      interestRate: Number(debt.interestRate || 0),
      minMonthlyPayment: Number(debt.minMonthlyPayment || 0),
      dueDate: debt.dueDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    setDebts(prev => [...prev, fullDebt]);
    await localDb.put('debts', fullDebt);
    awardPoints(50, `Registered liability: ${debt.name}`);

    if (isOnline && token) {
      try {
        const response = await fetch('/api/finance/debts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(debt)
        });
        if (response.ok) {
          const result = await response.json();
          setDebts(prev => prev.map(item => item.id === tempId ? result.debt : item));
          await localDb.delete('debts', tempId);
          await localDb.put('debts', result.debt);
          return;
        }
      } catch (err) {
        console.warn('Debt logging failed, queuing offline:', err);
      }
    }

    await localDb.addToQueue('create', 'debt', { ...debt, id: tempId });
    await updateLocalQueueCount();
  }, [user, isOnline, token, awardPoints, updateLocalQueueCount]);

  // Update Debt
  const handleUpdateDebt = useCallback(async (id: string, updates: any) => {
    setDebts(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    const localItem = debts.find(item => item.id === id);
    if (localItem) {
      await localDb.put('debts', { ...localItem, ...updates });
    }

    if (isOnline && token && !id.startsWith('debt_temp_')) {
      try {
        const response = await fetch(`/api/finance/debts/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updates)
        });
        if (response.ok) {
          const result = await response.json();
          setDebts(prev => prev.map(item => item.id === id ? result.debt : item));
          await localDb.put('debts', result.debt);
          return;
        }
      } catch (err) {
        console.warn('Debt update failed, queuing offline:', err);
      }
    }

    await localDb.addToQueue('update', 'debt', { id, updates });
    await updateLocalQueueCount();
  }, [debts, isOnline, token, updateLocalQueueCount]);

  // Delete Debt
  const handleDeleteDebt = useCallback(async (id: string) => {
    setDebts(prev => prev.filter(item => item.id !== id));
    await localDb.delete('debts', id);

    if (isOnline && token && !id.startsWith('debt_temp_')) {
      try {
        const response = await fetch(`/api/finance/debts/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) return;
      } catch (err) {
        console.warn('Debt delete failed, queuing offline:', err);
      }
    }

    await localDb.addToQueue('delete', 'debt', { id });
    await updateLocalQueueCount();
  }, [isOnline, token, updateLocalQueueCount]);

  // Add Goal
  const handleAddGoal = useCallback(async (goal: any) => {
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
  }, [user, isOnline, token, updateLocalQueueCount]);

  // Update Goal
  const handleUpdateGoal = useCallback(async (id: string, updates: any) => {
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
  }, [goals, isOnline, token, awardPoints, updateLocalQueueCount]);

  // Delete Goal
  const handleDeleteGoal = useCallback(async (id: string) => {
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
  }, [isOnline, token, updateLocalQueueCount]);

  // Add Subscription
  const handleAddSubscription = useCallback(async (sub: any) => {
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
  }, [user, isOnline, token, awardPoints, updateLocalQueueCount]);

  // Update Subscription
  const handleUpdateSubscription = useCallback(async (id: string, updates: any) => {
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
  }, [subscriptions, isOnline, token, updateLocalQueueCount]);

  // Delete Subscription
  const handleDeleteSubscription = useCallback(async (id: string) => {
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
  }, [isOnline, token, updateLocalQueueCount]);

  return {
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
    setIsSyncing,
    dataLoading,
    setDataLoading,
    updateLocalQueueCount,
    handleTriggerSync,
    adjustLocalAccountBalance,
    processLocalTransactionEffect,
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
    handleDeleteSubscription,
  };
}
