import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  ArrowRightLeft, 
  Shield, 
  Landmark, 
  CreditCard, 
  Coins, 
  DollarSign, 
  Wallet2, 
  Award, 
  Calendar, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  ArrowDownRight, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Calculator, 
  ShieldCheck, 
  Zap,
  HelpCircle,
  FileSpreadsheet,
  Edit,
  X
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { Account, Debt, Transaction, Category } from '../types';

interface CoreFinanceProps {
  accounts: Account[];
  debts: Debt[];
  transactions: Transaction[];
  categories: Category[];
  currencySymbol: string;
  onAddAccount: (acc: any) => void;
  onUpdateAccount: (id: string, updates: any) => void;
  onDeleteAccount: (id: string) => void;
  onAddDebt: (debt: any) => void;
  onUpdateDebt: (id: string, updates: any) => void;
  onDeleteDebt: (id: string) => void;
  onAddTransaction: (tx: any) => void;
}

export default function CoreFinance({
  accounts,
  debts,
  transactions,
  categories,
  currencySymbol,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onAddDebt,
  onUpdateDebt,
  onDeleteDebt,
  onAddTransaction
}: CoreFinanceProps) {

  // Global Hub Navigation Tabs
  const [activeTab, setActiveTab] = useState<'accounts' | 'debts' | 'emergency' | 'forecasting'>('accounts');

  // --- 1. Accounts & Transfers State ---
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<'cash' | 'bank' | 'savings' | 'crypto' | 'wallet'>('bank');
  const [accountBalance, setAccountBalance] = useState('');
  const [accountColor, setAccountColor] = useState('#3B82F6');

  // --- Accounts Edit State ---
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editAccountName, setEditAccountName] = useState('');
  const [editAccountType, setEditAccountType] = useState<'cash' | 'bank' | 'savings' | 'crypto' | 'wallet'>('bank');
  const [editAccountBalance, setEditAccountBalance] = useState('');
  const [editAccountColor, setEditAccountColor] = useState('#3B82F6');

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');

  // --- 2. Debt Planner State ---
  const [addDebtOpen, setAddDebtOpen] = useState(false);
  const [debtName, setDebtName] = useState('');
  const [debtType, setDebtType] = useState<'loan' | 'credit_card' | 'mortgage' | 'other'>('loan');
  const [debtPrincipal, setDebtPrincipal] = useState('');
  const [debtBalance, setDebtBalance] = useState('');
  const [debtRate, setDebtRate] = useState('');
  const [debtMinPay, setDebtMinPay] = useState('');
  const [debtDueDate, setDebtDueDate] = useState('');

  const [debtStrategy, setDebtStrategy] = useState<'avalanche' | 'snowball'>('avalanche');
  const [extraDebtPayment, setExtraDebtPayment] = useState(300); // extra monthly payment slider

  // Debt payment state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentDebtId, setPaymentDebtId] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentError, setPaymentError] = useState('');

  // --- 3. Emergency Fund State ---
  const [emergencyMonths, setEmergencyMonths] = useState(6); // slider for target runway
  const [overrideExpenseSlider, setOverrideExpenseSlider] = useState(false);
  
  // Calculate average expenses from last 30 days
  const actualAverageExpenses = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const expenseTxs = transactions.filter(t => t.type === 'expense' && new Date(t.date) >= thirtyDaysAgo);
    const sum = expenseTxs.reduce((acc, t) => acc + t.amount, 0);
    return Math.round(sum) || 2800; // fallback default
  }, [transactions]);

  const [manualExpenseTarget, setManualExpenseTarget] = useState(3000);
  const monthlyExpenseRate = overrideExpenseSlider ? manualExpenseTarget : actualAverageExpenses;

  // --- 4. Forecasting State ---
  const [forecastHorizon, setForecastHorizon] = useState<6 | 12 | 24>(12);
  const [forecastIncomeOverride, setForecastIncomeOverride] = useState(5500);
  const [forecastExpenseOverride, setForecastExpenseOverride] = useState(3800);
  const [overrideForecastingDefaults, setOverrideForecastingDefaults] = useState(false);

  // Prefill default forecasting parameters from transaction logs
  const actualAverageIncome = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const incomeTxs = transactions.filter(t => t.type === 'income' && new Date(t.date) >= thirtyDaysAgo);
    const sum = incomeTxs.reduce((acc, t) => acc + t.amount, 0);
    return Math.round(sum) || 6000;
  }, [transactions]);

  const projectedMonthlyIncome = overrideForecastingDefaults ? forecastIncomeOverride : actualAverageIncome;
  const projectedMonthlyExpense = overrideForecastingDefaults ? forecastExpenseOverride : monthlyExpenseRate;

  // --- Calculated Core Metrics ---
  const netWorth = useMemo(() => {
    const assetsSum = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const liabilitySum = debts.reduce((sum, d) => sum + d.currentBalance, 0);
    return assetsSum - liabilitySum;
  }, [accounts, debts]);

  const totalAssets = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
  }, [accounts]);

  const totalLiabilities = useMemo(() => {
    return debts.reduce((sum, d) => sum + d.currentBalance, 0);
  }, [debts]);

  // --- Accounts Helpers ---
  const handleCreateAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName || !accountBalance) return;
    onAddAccount({
      name: accountName,
      type: accountType,
      balance: parseFloat(accountBalance),
      color: accountColor
    });
    setAccountName('');
    setAccountBalance('');
    setAddAccountOpen(false);
  };

  const startEditAccount = (acc: Account) => {
    setEditingAccount(acc);
    setEditAccountName(acc.name);
    setEditAccountType(acc.type);
    setEditAccountBalance(acc.balance.toString());
    setEditAccountColor(acc.color || '#3B82F6');
  };

  const handleEditAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount || !editAccountName || !editAccountBalance) return;
    onUpdateAccount(editingAccount.id, {
      name: editAccountName,
      type: editAccountType,
      balance: parseFloat(editAccountBalance),
      color: editAccountColor
    });
    setEditingAccount(null);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    setTransferSuccess('');

    if (!transferFrom || !transferTo || !transferAmount) {
      setTransferError('Please configure all transfer parameters.');
      return;
    }

    if (transferFrom === transferTo) {
      setTransferError('Source and Destination accounts must be different.');
      return;
    }

    const amountNum = parseFloat(transferAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setTransferError('Transfer amount must be a positive number.');
      return;
    }

    const sourceAcc = accounts.find(a => a.id === transferFrom);
    if (!sourceAcc) {
      setTransferError('Selected source account not found.');
      return;
    }

    if (sourceAcc.balance < amountNum) {
      if (!confirm(`Warning: ${sourceAcc.name} only contains ${currencySymbol}${sourceAcc.balance}. This transfer will result in an overdraft. Proceed?`)) {
        return;
      }
    }

    // Record transfer transaction
    // Let's find/create a category or use cat-bills/transfer. Default default is salary//all.
    // Let's associate cat-transfer or categoryId "all"
    const transferCat = categories.find(c => c.name.toLowerCase().includes('transfer')) || categories[0];

    onAddTransaction({
      amount: amountNum,
      type: 'transfer',
      categoryId: transferCat?.id || 'all',
      date: new Date().toISOString().split('T')[0],
      notes: transferNotes || `Transferred from ${sourceAcc.name} to ${accounts.find(a => a.id === transferTo)?.name}`,
      accountId: transferFrom,
      toAccountId: transferTo
    });

    setTransferAmount('');
    setTransferNotes('');
    setTransferSuccess('Transfer recorded successfully! Balances updated.');
    setTimeout(() => {
      setTransferOpen(false);
      setTransferSuccess('');
    }, 2000);
  };

  // --- Debts Helpers ---
  const handleCreateDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtName || !debtPrincipal || !debtBalance) return;
    onAddDebt({
      name: debtName,
      type: debtType,
      totalPrincipal: parseFloat(debtPrincipal),
      currentBalance: parseFloat(debtBalance),
      interestRate: parseFloat(debtRate || '0'),
      minMonthlyPayment: parseFloat(debtMinPay || '0'),
      dueDate: debtDueDate || new Date().toISOString().split('T')[0]
    });
    setDebtName('');
    setDebtPrincipal('');
    setDebtBalance('');
    setDebtRate('');
    setDebtMinPay('');
    setDebtDueDate('');
    setAddDebtOpen(false);
  };

  const openPaymentModal = (debtId: string) => {
    setPaymentDebtId(debtId);
    setPaymentAmount('');
    setPaymentError('');
    setPaymentModalOpen(true);
    // Select first account as default source
    if (accounts.length > 0) {
      setPaymentAccountId(accounts[0].id);
    }
  };

  const handleMakeDebtPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');

    if (!paymentAccountId || !paymentAmount) {
      setPaymentError('Select an account and enter a payment amount.');
      return;
    }

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setPaymentError('Amount must be positive.');
      return;
    }

    const sourceAcc = accounts.find(a => a.id === paymentAccountId);
    if (!sourceAcc) {
      setPaymentError('Account not found.');
      return;
    }

    const targetDebt = debts.find(d => d.id === paymentDebtId);
    if (!targetDebt) {
      setPaymentError('Debt configuration not found.');
      return;
    }

    if (sourceAcc.balance < amt) {
      if (!confirm(`Warning: Selected account balance is lower than payment. Proceed with overdraft?`)) {
        return;
      }
    }

    // 1. Decrement debt balance
    const newBalance = Math.max(0, targetDebt.currentBalance - amt);
    onUpdateDebt(paymentDebtId, { currentBalance: newBalance });

    // 2. Log expense transaction to decrement source account balance
    const billsCat = categories.find(c => c.id === 'cat-bills') || categories[0];
    onAddTransaction({
      amount: amt,
      type: 'expense',
      categoryId: billsCat?.id || 'all',
      date: new Date().toISOString().split('T')[0],
      notes: `Debt Payment: ${targetDebt.name}`,
      accountId: paymentAccountId
    });

    setPaymentModalOpen(false);
  };

  // --- Simulation: Debt Snowball vs Avalanche Paydown Engine ---
  const paydownSimulation = useMemo(() => {
    if (debts.length === 0) return null;

    // Deep copy active debts
    const getDebtsCopy = (): Array<Debt & { simulatedBalance: number }> => {
      return debts.map(d => ({
        ...d,
        simulatedBalance: d.currentBalance
      }));
    };

    const runSim = (strategy: 'snowball' | 'avalanche') => {
      const activeSimDebts = getDebtsCopy();
      let monthCount = 0;
      let totalInterestPaid = 0;
      const monthlySchedules: Array<{ month: number; payments: Record<string, number>; remainingBalance: number }> = [];
      const MAX_MONTHS = 360; // 30 year safety cap

      while (activeSimDebts.some(d => d.simulatedBalance > 0) && monthCount < MAX_MONTHS) {
        monthCount++;
        let availablePool = extraDebtPayment;
        let monthlyInterestThisMonth = 0;

        // 1. Apply interest & gather min payments
        for (const d of activeSimDebts) {
          if (d.simulatedBalance > 0) {
            const monthlyRate = (d.interestRate / 100) / 12;
            const interest = d.simulatedBalance * monthlyRate;
            d.simulatedBalance += interest;
            monthlyInterestThisMonth += interest;
            totalInterestPaid += interest;
          }
        }

        const paymentsThisMonth: Record<string, number> = {};

        // 2. Pay minimums first
        for (const d of activeSimDebts) {
          if (d.simulatedBalance > 0) {
            const minPay = Math.min(d.simulatedBalance, d.minMonthlyPayment);
            d.simulatedBalance -= minPay;
            paymentsThisMonth[d.name] = minPay;
          }
        }

        // 3. Sort remaining debts based on chosen strategy
        const remainingToPay = activeSimDebts.filter(d => d.simulatedBalance > 0);
        if (strategy === 'snowball') {
          // smallest balance first
          remainingToPay.sort((a, b) => a.simulatedBalance - b.simulatedBalance);
        } else {
          // highest interest rate first
          remainingToPay.sort((a, b) => b.interestRate - a.interestRate);
        }

        // 4. Apply extra payment to priority target
        if (availablePool > 0 && remainingToPay.length > 0) {
          const priorityDebt = remainingToPay[0];
          const extraPay = Math.min(priorityDebt.simulatedBalance, availablePool);
          priorityDebt.simulatedBalance -= extraPay;
          paymentsThisMonth[priorityDebt.name] = (paymentsThisMonth[priorityDebt.name] || 0) + extraPay;
          availablePool -= extraPay;
        }

        const remainingTotal = activeSimDebts.reduce((sum, d) => sum + d.simulatedBalance, 0);
        monthlySchedules.push({
          month: monthCount,
          payments: paymentsThisMonth,
          remainingBalance: Math.round(remainingTotal)
        });
      }

      return {
        months: monthCount,
        totalInterest: Math.round(totalInterestPaid),
        schedules: monthlySchedules
      };
    };

    const avalancheResults = runSim('avalanche');
    const snowballResults = runSim('snowball');

    const interestSaved = Math.max(0, snowballResults.totalInterest - avalancheResults.totalInterest);
    const monthsSaved = Math.max(0, snowballResults.months - avalancheResults.months);

    return {
      avalanche: avalancheResults,
      snowball: snowballResults,
      interestSaved,
      monthsSaved
    };
  }, [debts, extraDebtPayment]);

  // --- Simulation: Emergency Fund runway & earmark calculations ---
  const emergencyFundReport = useMemo(() => {
    // Standard approach: Sum accounts of type 'savings' as earmarked emergency cash
    const cashAndSavings = accounts
      .filter(a => a.type === 'savings' || a.type === 'cash')
      .reduce((sum, a) => sum + a.balance, 0);

    const targetGoal = monthlyExpenseRate * emergencyMonths;
    const progressPercent = targetGoal > 0 ? Math.min(100, Math.round((cashAndSavings / targetGoal) * 100)) : 100;
    const monthsRunway = monthlyExpenseRate > 0 ? parseFloat((cashAndSavings / monthlyExpenseRate).toFixed(1)) : 99;

    let advice = "Build your fund to achieve a 3-6 month buffer.";
    let statusColor = "text-amber-500";
    if (monthsRunway < 3) {
      advice = `Warning: Your financial runway is critically low (${monthsRunway} months). Focus on depositing extra earnings here to shield against surprises.`;
      statusColor = "text-red-500";
    } else if (monthsRunway >= 3 && monthsRunway < 6) {
      advice = `Looking Good! A runway of ${monthsRunway} months covers short-term transitions or emergencies. Keep it up!`;
      statusColor = "text-blue-500";
    } else {
      advice = `Excellent! ${monthsRunway} months of expenses is a robust vault. You can confidently navigate any career transition or medical event.`;
      statusColor = "text-emerald-500";
    }

    return {
      fundsEarmarked: cashAndSavings,
      targetGoal,
      progressPercent,
      monthsRunway,
      advice,
      statusColor
    };
  }, [accounts, monthlyExpenseRate, emergencyMonths]);

  // --- Simulation: Net Worth & Cash Balance 24-Month Forecasting Dataset ---
  const forecastingData = useMemo(() => {
    const data = [];
    let currentBalanceAccumulator = totalAssets;

    // Start with current month
    data.push({
      monthLabel: 'Current',
      ProjectedCash: Math.round(currentBalanceAccumulator),
      OptimisticGrowth: Math.round(currentBalanceAccumulator),
      ConservativeGrowth: Math.round(currentBalanceAccumulator)
    });

    const monthlySurplus = projectedMonthlyIncome - projectedMonthlyExpense;

    for (let i = 1; i <= forecastHorizon; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      const label = date.toLocaleString('default', { month: 'short', year: '2-digit' });

      // Baseline linear growth
      currentBalanceAccumulator += monthlySurplus;

      // Optimistic growth (e.g., adds 1.5% compounded monthly crypto/investment yield or higher income)
      const optMonthlyYield = 0.005; // 0.5% monthly compound growth
      const optimisticAccumulator = totalAssets + (i * monthlySurplus) * 1.05;

      // Conservative growth (e.g. higher unexpected costs)
      const conservativeAccumulator = totalAssets + (i * (monthlySurplus - 400));

      data.push({
        monthLabel: label,
        ProjectedCash: Math.round(Math.max(0, currentBalanceAccumulator)),
        OptimisticGrowth: Math.round(Math.max(0, optimisticAccumulator)),
        ConservativeGrowth: Math.round(Math.max(0, conservativeAccumulator))
      });
    }

    return data;
  }, [totalAssets, projectedMonthlyIncome, projectedMonthlyExpense, forecastHorizon]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-0 py-4" id="core-finance-root">
      
      {/* Upper Hub Dashboard Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-blue-500/20 text-blue-400 text-xs font-bold font-mono tracking-widest uppercase">Double-Entry Engine</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-tight" id="core-finance-header">Core Financial Hub</h1>
          <p className="text-xs text-slate-400">Calibrate cash balances, map liabilities, secure emergency runway, and simulate future wealth projection.</p>
        </div>
        
        {/* Net Worth Summary Widgets */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 shrink-0">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Current Net Worth</p>
            <p className={`text-lg font-black font-mono mt-0.5 ${netWorth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {netWorth < 0 ? '-' : ''}{currencySymbol}{Math.abs(Math.round(netWorth)).toLocaleString()}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Liquid Assets</p>
            <p className="text-lg font-black font-mono text-blue-400 mt-0.5">
              {currencySymbol}{Math.round(totalAssets).toLocaleString()}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Active Debt Load</p>
            <p className="text-lg font-black font-mono text-amber-400 mt-0.5">
              {currencySymbol}{Math.round(totalLiabilities).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Internal Navigation Sub-tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2 pb-1">
        <button 
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'accounts' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
          id="tab-accounts"
        >
          <Wallet2 className="w-4.5 h-4.5" />
          <span>Accounts & Transfers</span>
        </button>
        <button 
          onClick={() => setActiveTab('debts')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'debts' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
          id="tab-debts"
        >
          <CreditCard className="w-4.5 h-4.5" />
          <span>Debt Paydown Planner</span>
        </button>
        <button 
          onClick={() => setActiveTab('emergency')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'emergency' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
          id="tab-emergency"
        >
          <Shield className="w-4.5 h-4.5" />
          <span>Emergency Runway</span>
        </button>
        <button 
          onClick={() => setActiveTab('forecasting')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'forecasting' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
          id="tab-forecasting"
        >
          <TrendingUp className="w-4.5 h-4.5" />
          <span>Cash Forecasting</span>
        </button>
      </div>

      {/* --- TAB VIEW 1: Accounts & Transfers --- */}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="panel-accounts">
          
          {/* Main Accounts Ledger Grid (Left Side) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Asset Accounts</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setTransferOpen(!transferOpen)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Transfer Funds
                </button>
                <button 
                  onClick={() => setAddAccountOpen(!addAccountOpen)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Account
                </button>
              </div>
            </div>

            {/* Quick Add Form Overlay */}
            {addAccountOpen && (
              <form onSubmit={handleCreateAccountSubmit} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Register New Financial Account</h3>
                  <button type="button" onClick={() => setAddAccountOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs">Cancel</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Account Name</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Chase Checkings"
                      value={accountName}
                      onChange={e => setAccountName(e.target.value)}
                      className="w-full text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Account Type</label>
                    <select 
                      value={accountType}
                      onChange={e => setAccountType(e.target.value as any)}
                      className="w-full text-sm px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none"
                    >
                      <option value="bank">Bank Checking/Debit</option>
                      <option value="savings">High-Yield Savings</option>
                      <option value="cash">Hard Cash Wallet</option>
                      <option value="crypto">Crypto Exchange/Cold wallet</option>
                      <option value="wallet">Other Digtial Wallet</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Starting Balance</label>
                    <input 
                      type="number"
                      required
                      placeholder="e.g. 5000"
                      value={accountBalance}
                      onChange={e => setAccountBalance(e.target.value)}
                      className="w-full text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Visual Theme Color</label>
                    <div className="flex gap-2 items-center">
                      <input 
                        type="color"
                        value={accountColor}
                        onChange={e => setAccountColor(e.target.value)}
                        className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700 cursor-pointer overflow-hidden p-0"
                      />
                      <span className="text-xs font-mono text-slate-500">{accountColor}</span>
                    </div>
                  </div>
                </div>
                <button type="submit" className="w-full text-xs font-bold py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors">
                  Create Asset Account
                </button>
              </form>
            )}

            {/* Account Card Panels list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {accounts.map(acc => {
                const isSavings = acc.type === 'savings';
                const isCrypto = acc.type === 'crypto';
                const isCash = acc.type === 'cash';

                return (
                  <div 
                    key={acc.id} 
                    className="p-5 rounded-2xl relative border overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group"
                  >
                    {/* Glowing Accent Top Bar */}
                    <div className="absolute top-0 inset-x-0 h-1.5" style={{ backgroundColor: acc.color }} />
                    
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {acc.type === 'bank' ? 'Bank' : acc.type === 'savings' ? 'HY Savings' : acc.type === 'crypto' ? 'Crypto' : acc.type === 'cash' ? 'Hard Cash' : 'Wallet'}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">{acc.name}</h3>
                      </div>
                      
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: acc.color }}>
                        {isSavings ? <Landmark className="w-4 h-4" /> : isCrypto ? <Coins className="w-4 h-4" /> : isCash ? <DollarSign className="w-4 h-4" /> : <Wallet2 className="w-4 h-4" />}
                      </div>
                    </div>

                    <div className="flex items-end justify-between mt-4">
                      <div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Current Balance</p>
                        <p className="text-xl font-black font-mono text-slate-900 dark:text-white">{currencySymbol}{acc.balance.toLocaleString()}</p>
                      </div>
                      
                      {/* Edit & Delete buttons */}
                      <div className="flex gap-1 items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
                        <button 
                          onClick={() => startEditAccount(acc)}
                          className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                          title="Edit Account"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove the ${acc.name} account? Associated seed transactions may lose references.`)) {
                              onDeleteAccount(acc.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                          title="Delete Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Double-Entry Transfer Form (Right Side Sidebar Panel) */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Double-Entry Ledger Transfer</h2>
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100/40 dark:border-blue-800/40 rounded-xl">
                <ArrowRightLeft className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-[11px] text-blue-700 dark:text-blue-400">
                  Moving money between accounts is recorded as a double-entry transaction. This decreases the source balance and increases the target in real-time.
                </p>
              </div>

              <form onSubmit={handleTransferSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">From Source Account</label>
                  <select 
                    value={transferFrom}
                    onChange={e => setTransferFrom(e.target.value)}
                    required
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none"
                  >
                    <option value="">-- Choose Account --</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({currencySymbol}{a.balance})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">To Destination Account</label>
                  <select 
                    value={transferTo}
                    onChange={e => setTransferTo(e.target.value)}
                    required
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none"
                  >
                    <option value="">-- Choose Account --</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({currencySymbol}{a.balance})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Transfer Amount ({currencySymbol})</label>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={transferAmount}
                    onChange={e => setTransferAmount(e.target.value)}
                    required
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Transfer Notes (Optional)</label>
                  <input 
                    type="text"
                    placeholder="e.g. Earmark to savings"
                    value={transferNotes}
                    onChange={e => setTransferNotes(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none"
                  />
                </div>

                {transferError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-1.5 font-semibold">
                    <AlertCircle className="w-4 h-4" />
                    <span>{transferError}</span>
                  </div>
                )}

                {transferSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{transferSuccess}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-colors shadow-lg shadow-blue-500/10"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Execute Transfer</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {editingAccount && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-500" />
                <span>Edit Asset Account</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingAccount(null)} 
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditAccountSubmit} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Account Name</label>
                  <input 
                    type="text"
                    required
                    value={editAccountName}
                    onChange={e => setEditAccountName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Account Type</label>
                  <select 
                    value={editAccountType}
                    onChange={e => setEditAccountType(e.target.value as any)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="bank">Bank Checking/Debit</option>
                    <option value="savings">High-Yield Savings</option>
                    <option value="cash">Hard Cash Wallet</option>
                    <option value="crypto">Crypto Exchange/Cold wallet</option>
                    <option value="wallet">Other Digital Wallet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Account Balance</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={editAccountBalance}
                    onChange={e => setEditAccountBalance(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Visual Theme Color</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color"
                      value={editAccountColor}
                      onChange={e => setEditAccountColor(e.target.value)}
                      className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-750 cursor-pointer overflow-hidden p-0"
                    />
                    <span className="text-xs font-mono text-slate-500">{editAccountColor}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Are you sure you want to remove the ${editingAccount.name} account? Associated seed transactions may lose references.`)) {
                      onDeleteAccount(editingAccount.id);
                      setEditingAccount(null);
                    }
                  }}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl text-red-600 bg-red-55/10 hover:bg-red-500/10 dark:bg-red-950/20 dark:hover:bg-red-950/30 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-450 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-blue-500 hover:bg-blue-600 transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- TAB VIEW 2: Debt Paydown Planner & Simulation --- */}
      {activeTab === 'debts' && (
        <div className="space-y-6" id="panel-debts">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Active Debts Tracker & Pay Off Action List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Active Debt Ledger</h2>
                  <p className="text-xs text-slate-400">Outstanding liabilities, interest structures, and payment controllers.</p>
                </div>
                <button 
                  onClick={() => setAddDebtOpen(!addDebtOpen)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Debt
                </button>
              </div>

              {/* Add Debt Quick Inline Panel */}
              {addDebtOpen && (
                <form onSubmit={handleCreateDebtSubmit} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Register Active Liability</h3>
                    <button type="button" onClick={() => setAddDebtOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs">Cancel</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Lender Name</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Sallie Mae Loan"
                        value={debtName}
                        onChange={e => setDebtName(e.target.value)}
                        className="w-full text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Debt Category</label>
                      <select 
                        value={debtType}
                        onChange={e => setDebtType(e.target.value as any)}
                        className="w-full text-sm px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none"
                      >
                        <option value="loan">Personal/Student Loan</option>
                        <option value="credit_card">High-Interest Credit Card</option>
                        <option value="mortgage">Mortgage</option>
                        <option value="other">Other Liability</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total Principal Amount</label>
                      <input 
                        type="number"
                        required
                        placeholder="e.g. 15000"
                        value={debtPrincipal}
                        onChange={e => setDebtPrincipal(e.target.value)}
                        className="w-full text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Current Balance Due</label>
                      <input 
                        type="number"
                        required
                        placeholder="e.g. 9400"
                        value={debtBalance}
                        onChange={e => setDebtBalance(e.target.value)}
                        className="w-full text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Annual Interest Rate (APR %)</label>
                      <input 
                        type="number"
                        step="0.01"
                        placeholder="e.g. 5.5"
                        value={debtRate}
                        onChange={e => setDebtRate(e.target.value)}
                        className="w-full text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Minimum Monthly Payment</label>
                      <input 
                        type="number"
                        placeholder="e.g. 150"
                        value={debtMinPay}
                        onChange={e => setDebtMinPay(e.target.value)}
                        className="w-full text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Next Payment Due Date</label>
                      <input 
                        type="date"
                        value={debtDueDate}
                        onChange={e => setDebtDueDate(e.target.value)}
                        className="w-full text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full text-xs font-bold py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors">
                    Add Active Liability
                  </button>
                </form>
              )}

              {/* Payment Overlay Modal */}
              {paymentModalOpen && (
                <form onSubmit={handleMakeDebtPayment} className="p-5 rounded-3xl border-2 border-blue-500 bg-white dark:bg-slate-900 shadow-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      Make Interactive Payment
                    </h3>
                    <button type="button" onClick={() => setPaymentModalOpen(false)} className="text-slate-400 text-xs">Cancel</button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Entering a payment reduces this debt and registers a cash outflow on the selected asset account.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Pay From Account</label>
                      <select 
                        required
                        value={paymentAccountId}
                        onChange={e => setPaymentAccountId(e.target.value)}
                        className="w-full text-sm px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none"
                      >
                        <option value="">-- Select Source --</option>
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>{a.name} ({currencySymbol}{a.balance})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Payment Amount ({currencySymbol})</label>
                      <input 
                        type="number"
                        required
                        step="0.01"
                        placeholder="e.g. 250"
                        value={paymentAmount}
                        onChange={e => setPaymentAmount(e.target.value)}
                        className="w-full text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  {paymentError && (
                    <p className="text-xs text-red-500 font-bold">{paymentError}</p>
                  )}

                  <button type="submit" className="w-full text-xs font-bold py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors uppercase tracking-wider">
                    Post Debt Paydown
                  </button>
                </form>
              )}

              {/* Active Debts display */}
              <div className="space-y-3">
                {debts.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">No active debts registered. Cheers to debt-free living!</div>
                ) : (
                  debts.map(d => {
                    const payPct = Math.round(((d.totalPrincipal - d.currentBalance) / d.totalPrincipal) * 100);
                    return (
                      <div key={d.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {d.type === 'credit_card' ? 'Credit Card' : d.type === 'mortgage' ? 'Mortgage' : 'Loan'}
                            </span>
                            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mt-1">{d.name}</h3>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400">APR %</p>
                            <p className="text-sm font-black font-mono text-slate-800 dark:text-slate-200">{d.interestRate}%</p>
                          </div>
                        </div>

                        {/* Payoff Progress Tracker */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-400">Payoff Progress: {payPct}%</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300">
                              {currencySymbol}{Math.round(d.totalPrincipal - d.currentBalance).toLocaleString()} paid / {currencySymbol}{Math.round(d.totalPrincipal).toLocaleString()} original
                            </span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                              style={{ width: `${Math.max(0, Math.min(100, payPct))}%` }}
                            />
                          </div>
                        </div>

                        {/* Debt details and controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-800/80">
                          <div className="flex flex-wrap gap-4 text-slate-500">
                            <div>
                              <span className="font-semibold block text-[10px] uppercase text-slate-400">Monthly Min</span>
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{currencySymbol}{d.minMonthlyPayment}</span>
                            </div>
                            <div>
                              <span className="font-semibold block text-[10px] uppercase text-slate-400">Next Due Date</span>
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{d.dueDate}</span>
                            </div>
                            <div>
                              <span className="font-semibold block text-[10px] uppercase text-slate-400">Remaining Balance</span>
                              <span className="font-mono font-bold text-red-500">{currencySymbol}{Math.round(d.currentBalance).toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 shrink-0">
                            <button 
                              onClick={() => openPaymentModal(d.id)}
                              className="flex items-center gap-1 px-3 py-1.5 font-bold rounded-xl bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/25 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 cursor-pointer"
                            >
                              <Coins className="w-3.5 h-3.5" />
                              Pay Debt
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm(`Delete the debt ${d.name}?`)) {
                                  onDeleteDebt(d.id);
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              title="Delete Debt"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Snowball vs Avalanche Simulator Card Panel */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Paydown Strategies</h2>
              <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-indigo-400" />
                    <span className="font-black text-sm tracking-tight">Strategy Simulator</span>
                  </div>
                  
                  {/* Strategy toggle switch */}
                  <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10 text-[10px] font-bold font-mono uppercase">
                    <button 
                      onClick={() => setDebtStrategy('avalanche')}
                      className={`px-2 py-1 rounded ${debtStrategy === 'avalanche' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Avalanche
                    </button>
                    <button 
                      onClick={() => setDebtStrategy('snowball')}
                      className={`px-2 py-1 rounded ${debtStrategy === 'snowball' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Snowball
                    </button>
                  </div>
                </div>

                {/* Extra monthly payment slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Extra Monthly Payment</span>
                    <span className="font-mono text-indigo-400">+{currencySymbol}{extraDebtPayment}/mo</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="2000"
                    step="50"
                    value={extraDebtPayment}
                    onChange={e => setExtraDebtPayment(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500 block">Adding extra payments multiplies your savings rate and crushes interest accumulation.</span>
                </div>

                {/* Simulation Output Dashboard */}
                {paydownSimulation ? (
                  <div className="space-y-4 pt-2">
                    
                    {/* Key metrics panel */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                        <p className="text-[9px] uppercase font-bold text-slate-400">Simulated Months</p>
                        <p className="text-lg font-black font-mono text-indigo-300 mt-0.5">
                          {debtStrategy === 'avalanche' ? paydownSimulation.avalanche.months : paydownSimulation.snowball.months} months
                        </p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                        <p className="text-[9px] uppercase font-bold text-slate-400">Total Interest Paid</p>
                        <p className="text-lg font-black font-mono text-red-400 mt-0.5">
                          {currencySymbol}{debtStrategy === 'avalanche' ? paydownSimulation.avalanche.totalInterest.toLocaleString() : paydownSimulation.snowball.totalInterest.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Compare strategies box */}
                    <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 space-y-2">
                      <p className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                        Interactive Strategy Yields
                      </p>
                      <div className="text-xs text-slate-300 space-y-1">
                        <p>
                          <strong className="text-white">Avalanche</strong> targets highest APR first, minimizing accumulation. Total interest: <strong className="font-mono">{currencySymbol}{paydownSimulation.avalanche.totalInterest}</strong>.
                        </p>
                        <p>
                          <strong className="text-white">Snowball</strong> clears lowest balances first, generating quick wins. Total interest: <strong className="font-mono">{currencySymbol}{paydownSimulation.snowball.totalInterest}</strong>.
                        </p>
                      </div>
                      
                      {paydownSimulation.interestSaved > 0 ? (
                        <div className="mt-3 text-xs p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                          🎯 Choosing the <strong className="text-white uppercase font-mono">Avalanche Strategy</strong> saves you <strong className="font-mono text-emerald-400">{currencySymbol}{paydownSimulation.interestSaved.toLocaleString()}</strong> in interest and gets you debt-free <strong className="font-mono">{paydownSimulation.monthsSaved} months</strong> sooner!
                        </div>
                      ) : (
                        <div className="mt-3 text-[10px] text-slate-400 text-center">Both strategies resolve identically for single or balanced debts.</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 text-slate-500 text-xs">Add liability records to run strategic projections.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB VIEW 3: Emergency Fund Runway --- */}
      {activeTab === 'emergency' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="panel-emergency">
          
          {/* Emergency Fund configuration parameters */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Emergency Fund Runway Planner</h2>
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
              
              {/* Configuration sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Months buffer target */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Target Coverage Months</span>
                    <span className="text-blue-500 font-bold">{emergencyMonths} Months</span>
                  </div>
                  <input 
                    type="range"
                    min="3"
                    max="12"
                    step="3"
                    value={emergencyMonths}
                    onChange={e => setEmergencyMonths(parseInt(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>3 Mo (Starter)</span>
                    <span>6 Mo (Secure)</span>
                    <span>12 Mo (Max Safe)</span>
                  </div>
                </div>

                {/* Monthly expense calculator/override */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Projected Monthly Expense</span>
                    <span className="text-blue-500 font-bold font-mono">{currencySymbol}{monthlyExpenseRate}/mo</span>
                  </div>
                  
                  <input 
                    type="range"
                    min="1000"
                    max="10000"
                    step="250"
                    disabled={!overrideExpenseSlider}
                    value={overrideExpenseSlider ? manualExpenseTarget : actualAverageExpenses}
                    onChange={e => setManualExpenseTarget(parseInt(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer disabled:opacity-40"
                  />

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={overrideExpenseSlider}
                        onChange={e => setOverrideExpenseSlider(e.target.checked)}
                        className="rounded accent-blue-500"
                      />
                      <span>Override Calculated Expenses</span>
                    </label>
                    <span className="text-[9px] font-mono text-slate-400">
                      {overrideExpenseSlider ? 'Custom Sliders' : 'Real Past 30 Days Expense'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual Runway circular/percentage progress display */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center gap-6">
                
                {/* Circular Percentage gauge */}
                <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle 
                      cx="56" 
                      cy="56" 
                      r="46" 
                      className="stroke-slate-200 dark:stroke-slate-800 fill-none" 
                      strokeWidth="8"
                    />
                    <circle 
                      cx="56" 
                      cy="56" 
                      r="46" 
                      className="stroke-blue-500 fill-none transition-all duration-500" 
                      strokeWidth="8"
                      strokeDasharray="289"
                      strokeDashoffset={289 - (289 * emergencyFundReport.progressPercent) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-black font-mono text-slate-800 dark:text-white">{emergencyFundReport.progressPercent}%</span>
                    <span className="text-[9px] uppercase font-bold text-slate-400">of Goal</span>
                  </div>
                </div>

                {/* Runway explanation stats */}
                <div className="space-y-3 flex-1">
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">Emergency Buffer Status</h3>
                  <p className="text-xs text-slate-500 leading-normal">{emergencyFundReport.advice}</p>
                  
                  <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Fund Earmarked</p>
                      <p className="text-sm font-black font-mono text-blue-600 dark:text-blue-400">{currencySymbol}{emergencyFundReport.fundsEarmarked.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Safe Target Goal</p>
                      <p className="text-sm font-black font-mono text-slate-700 dark:text-slate-300">{currencySymbol}{emergencyFundReport.targetGoal.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Runway months status indicators */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Financial Runway Index</h2>
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="text-center py-4 space-y-1">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Calculated Cash Runway</p>
                <p className={`text-4xl font-black font-mono ${emergencyFundReport.monthsRunway >= 6 ? 'text-emerald-500' : emergencyFundReport.monthsRunway >= 3 ? 'text-blue-500' : 'text-red-500'}`}>
                  {emergencyFundReport.monthsRunway}
                </p>
                <p className="text-xs font-semibold text-slate-500">Months of complete survival</p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center p-2 rounded-lg bg-emerald-500/5 text-emerald-600 font-medium">
                  <span>🚀 Exceptional Buffer (6+ Mo)</span>
                  <span className="font-mono font-bold">{currencySymbol}{(monthlyExpenseRate * 6).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-blue-500/5 text-blue-600 font-medium">
                  <span>🛡️ Safe Standard (3-6 Mo)</span>
                  <span className="font-mono font-bold">{currencySymbol}{(monthlyExpenseRate * 3).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-red-500/5 text-red-500 font-medium">
                  <span>⚠️ Danger Zone (&lt; 3 Mo)</span>
                  <span className="font-mono font-bold">&lt; {currencySymbol}{(monthlyExpenseRate * 3).toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-400">
                💡 <strong className="text-slate-600 dark:text-slate-300">How this is calculated:</strong> We aggregate accounts of type <em>'cash'</em> and <em>'savings'</em> and divide them by your monthly expenditure rate.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB VIEW 4: Income vs Expense Forecasting --- */}
      {activeTab === 'forecasting' && (
        <div className="space-y-6" id="panel-forecasting">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Visual Projection Chart Panel (Left Side) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Net Worth Growth Projection</h2>
                  <p className="text-xs text-slate-400">Simulating future cash expansion based on current monthly metrics.</p>
                </div>
                
                {/* Horizontal scale chooser */}
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-800 text-xs font-semibold font-mono">
                  <button 
                    onClick={() => setForecastHorizon(6)}
                    className={`px-2.5 py-1 rounded-md ${forecastHorizon === 6 ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    6M
                  </button>
                  <button 
                    onClick={() => setForecastHorizon(12)}
                    className={`px-2.5 py-1 rounded-md ${forecastHorizon === 12 ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    12M
                  </button>
                  <button 
                    onClick={() => setForecastHorizon(24)}
                    className={`px-2.5 py-1 rounded-md ${forecastHorizon === 24 ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    24M
                  </button>
                </div>
              </div>

              {/* Main Line Recharts Canvas */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastingData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                    <XAxis dataKey="monthLabel" stroke="#94a3b8" fontSize={11} fontStyle="bold" />
                    <YAxis stroke="#94a3b8" fontSize={11} fontStyle="bold" tickFormatter={(v) => `${currencySymbol}${Math.round(v/1000)}k`} />
                    <Tooltip 
                      formatter={(value) => [`${currencySymbol}${value}`, '']}
                      contentStyle={{ borderRadius: '12px', padding: '10px', fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    <Line type="monotone" dataKey="OptimisticGrowth" stroke="#10b981" strokeWidth={3} name="Optimistic Proj" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="ProjectedCash" stroke="#3b82f6" strokeWidth={4} name="Core Baseline" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="ConservativeGrowth" stroke="#ec4899" strokeWidth={2} name="Conservative Proj" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Configurable Projection control Panel (Right Side Sidebar) */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Simulation Controls</h2>
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Projection Engine Config</span>
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={overrideForecastingDefaults}
                      onChange={e => setOverrideForecastingDefaults(e.target.checked)}
                      className="rounded accent-blue-500"
                    />
                    <span>Custom Inputs</span>
                  </label>
                </div>

                {/* Simulated Monthly Income slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Projected Monthly Income</span>
                    <span className="text-emerald-500 font-bold font-mono">+{currencySymbol}{projectedMonthlyIncome}/mo</span>
                  </div>
                  <input 
                    type="range"
                    min="1000"
                    max="15000"
                    step="500"
                    disabled={!overrideForecastingDefaults}
                    value={overrideForecastingDefaults ? forecastIncomeOverride : actualAverageIncome}
                    onChange={e => setForecastIncomeOverride(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer disabled:opacity-40"
                  />
                  <span className="text-[9px] text-slate-400 block">
                    {!overrideForecastingDefaults ? `Auto-calculated from monthly income transactions.` : 'Manual projection parameters active.'}
                  </span>
                </div>

                {/* Simulated Monthly Expenses slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Projected Monthly Expense</span>
                    <span className="text-red-500 font-bold font-mono">-{currencySymbol}{projectedMonthlyExpense}/mo</span>
                  </div>
                  <input 
                    type="range"
                    min="1000"
                    max="10000"
                    step="250"
                    disabled={!overrideForecastingDefaults}
                    value={overrideForecastingDefaults ? forecastExpenseOverride : monthlyExpenseRate}
                    onChange={e => setForecastExpenseOverride(parseInt(e.target.value))}
                    className="w-full accent-red-500 cursor-pointer disabled:opacity-40"
                  />
                  <span className="text-[9px] text-slate-400 block">
                    {!overrideForecastingDefaults ? `Synchronized with Emergency Runway expense target.` : 'Manual projection parameters active.'}
                  </span>
                </div>

                {/* Forecast summary metrics */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 text-xs space-y-2">
                  <p className="font-bold text-slate-700 dark:text-slate-300">Runway Insights</p>
                  <div className="space-y-1 text-slate-500 leading-relaxed text-[11px]">
                    <p>
                      Monthly Net Savings: <strong className={`font-mono ${projectedMonthlyIncome - projectedMonthlyExpense >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {currencySymbol}{projectedMonthlyIncome - projectedMonthlyExpense}
                      </strong>
                    </p>
                    <p>
                      Savings Rate: <strong className="text-slate-700 dark:text-slate-300 font-mono">
                        {projectedMonthlyIncome > 0 ? Math.round(((projectedMonthlyIncome - projectedMonthlyExpense) / projectedMonthlyIncome) * 100) : 0}%
                      </strong>
                    </p>
                    <p>
                      Expected Net Worth in {forecastHorizon} Months: <strong className="text-blue-500 font-mono">
                        {currencySymbol}{Math.round(totalAssets - totalLiabilities + (forecastHorizon * (projectedMonthlyIncome - projectedMonthlyExpense))).toLocaleString()}
                      </strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
