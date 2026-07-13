import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  ChevronRight, 
  Sparkles, 
  Plus, 
  AlertCircle,
  Clock,
  Dumbbell,
  Briefcase,
  Laptop,
  Utensils,
  Car,
  ShoppingBag,
  FileText,
  Heart,
  GraduationCap,
  Play,
  Home,
  CheckCircle2,
  HelpCircle,
  Wallet
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from 'recharts';
import { Transaction, Budget, SavingsGoal, Subscription, Category } from '../types';

// Dynamic Icon Resolver mapping strings to Lucide Components
export const IconResolver = ({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) => {
  const map: Record<string, any> = {
    Briefcase, Laptop, Utensils, Car, ShoppingBag, FileText, Heart, GraduationCap, Play, Home, Sparkles, Dumbbell, CarFront: Car, HelpCircle, Wallet
  };
  const Comp = map[name] || HelpCircle;
  return <Comp className={className} style={style} />;
};

interface DashboardProps {
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  subscriptions: Subscription[];
  categories: Category[];
  currencySymbol: string;
  onAddTxClick: () => void;
  setActiveTab: (tab: string) => void;
  loading: boolean;
}

export default function Dashboard({
  transactions,
  budgets,
  goals,
  subscriptions,
  categories,
  currencySymbol,
  onAddTxClick,
  setActiveTab,
  loading
}: DashboardProps) {

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-8 animate-fade-in no-print">
        {/* Skeleton Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-48 rounded-lg skeleton-box"></div>
            <div className="h-4 w-64 rounded-lg skeleton-box"></div>
          </div>
          <div className="h-10 w-32 rounded-xl skeleton-box"></div>
        </div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-6 space-y-4">
              <div className="flex justify-between">
                <div className="h-4 w-20 rounded skeleton-box"></div>
                <div className="h-8 w-8 rounded-full skeleton-box"></div>
              </div>
              <div className="h-8 w-32 rounded skeleton-box"></div>
            </div>
          ))}
        </div>

        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-6 skeleton-box"></div>
          <div className="h-96 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-6 skeleton-box"></div>
        </div>
      </div>
    );
  }

  // --- Calculations ---
  
  // 1. Core Totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = totalIncome - totalExpense;

  // 2. Current Month Totals
  const currentMonthStr = new Date().toISOString().substring(0, 7); // "YYYY-MM"
  const monthlyTransactions = transactions.filter(t => t.date.startsWith(currentMonthStr));
  
  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpense = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // 3. Savings Calculation
  const totalSavings = goals.reduce((sum, g) => sum + g.currentAmount, 0);

  // 4. Budget Utilization Meter
  const overallBudget = budgets.find(b => b.categoryId === 'all');
  const overallLimit = overallBudget ? overallBudget.amount : 0;
  const overallSpent = monthlyExpense; // Compare monthly expense to overall budget
  const overallPercent = overallLimit > 0 ? Math.min(Math.round((overallSpent / overallLimit) * 100), 100) : 0;

  // 5. Chart Data Prep: Spending By Category (Donut)
  const categorySpendingMap: Record<string, { name: string; value: number; color: string }> = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const catName = t.categoryName || 'Unknown';
      const catColor = t.categoryColor || '#9CA3AF';
      if (!categorySpendingMap[catName]) {
        categorySpendingMap[catName] = { name: catName, value: 0, color: catColor };
      }
      categorySpendingMap[catName].value += t.amount;
    });
  const categorySpendingData = Object.values(categorySpendingMap).sort((a, b) => b.value - a.value);

  // 6. Chart Data Prep: Income vs Expense Over Time (Area Chart)
  // Group by month-year for the last 6 months
  const monthlyAggregation: Record<string, { month: string; income: number; expense: number }> = {};
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Seed last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = `${months[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
    const key = d.toISOString().substring(0, 7);
    monthlyAggregation[key] = { month: label, income: 0, expense: 0 };
  }

  transactions.forEach(t => {
    const key = t.date.substring(0, 7);
    if (monthlyAggregation[key]) {
      if (t.type === 'income') monthlyAggregation[key].income += t.amount;
      if (t.type === 'expense') monthlyAggregation[key].expense += t.amount;
    }
  });
  const incomeVsExpenseData = Object.values(monthlyAggregation);

  // 7. Weekly Trends Grouping (Last 7 Days)
  const last7DaysAggregation: Record<string, { day: string; amount: number }> = {};
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = weekday[d.getDay()];
    const key = d.toISOString().split('T')[0];
    last7DaysAggregation[key] = { day: label, amount: 0 };
  }
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      if (last7DaysAggregation[t.date]) {
        last7DaysAggregation[t.date].amount += t.amount;
      }
    });
  const weeklyTrendData = Object.values(last7DaysAggregation);

  // 8. Upcoming Subscriptions and Bills
  const activeSubs = subscriptions
    .filter(s => s.status === 'active')
    .sort((a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime())
    .slice(0, 3);

  // Format currency helper
  const formatCurrency = (val: number) => {
    return `${currencySymbol}${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  return (
    <div id="dashboard-view" className="p-6 md:p-8 space-y-8 animate-fade-in no-print">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Workspace Intelligence</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time financial positions, automated budgeting alerts, and asset progress.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('insights')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold border border-slate-200/50 dark:border-slate-800 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>AI Smart Insights</span>
          </button>

          <button 
            onClick={onAddTxClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/15 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* 1. Core Financial summary bento bards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Net Liquidity Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Net Liquidity</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
              {formatCurrency(currentBalance)}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">All-time unified capital balance</p>
          </div>
        </div>

        {/* Monthly Income Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Income</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
              {formatCurrency(monthlyIncome)}
            </h3>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Income this current month</span>
            </div>
          </div>
        </div>

        {/* Monthly Outflow Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Expenses</span>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 dark:bg-red-500/15 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
              {formatCurrency(monthlyExpense)}
            </h3>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-red-400">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Outflows this current month</span>
            </div>
          </div>
        </div>

        {/* Unified Savings Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Savings Vault</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
              {formatCurrency(totalSavings)}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">Accumulated across active goals</p>
          </div>
        </div>

      </div>

      {/* 2. Budget Utilization Warnings banner if limit exists */}
      {overallLimit > 0 && (
        <div className={`
          p-4 rounded-2xl border flex items-start gap-4 transition-all
          ${overallPercent >= 90 
            ? 'bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-200' 
            : overallPercent >= 75 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200' 
              : 'bg-blue-500/5 border-blue-500/15 text-slate-700 dark:text-slate-200'}
        `}>
          <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${overallPercent >= 90 ? 'text-red-500' : overallPercent >= 75 ? 'text-amber-500' : 'text-blue-500'}`} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-sm font-semibold tracking-tight">
                {overallPercent >= 90 
                  ? 'CRITICAL ALERT: Budget depletion imminent!' 
                  : overallPercent >= 75 
                    ? 'WARNING: Spending threshold exceeded!' 
                    : 'Operational Budget Utilization status'}
              </span>
              <span className="text-xs font-mono font-bold">{overallPercent}% of {formatCurrency(overallLimit)} used</span>
            </div>
            
            {/* Progression Bar */}
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 mt-2.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${overallPercent >= 90 ? 'bg-red-500' : overallPercent >= 75 ? 'bg-amber-500' : 'bg-blue-500'}`}
                style={{ width: `${overallPercent}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              You have spent <strong>{formatCurrency(overallSpent)}</strong> of your <strong>{formatCurrency(overallLimit)}</strong> master budget limit for this monthly cycle. You have <strong>{formatCurrency(Math.max(0, overallLimit - overallSpent))}</strong> remaining liquidity buffer.
            </p>
          </div>
        </div>
      )}

      {/* 3. Primary Charts layout grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Income vs Expense Over Time Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Capital Flow Trends</h3>
              <p className="text-xs text-slate-400 mt-0.5">Ratio analysis comparing revenues versus expenditures over 6 months</p>
            </div>
            
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-500">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                <span className="text-slate-500">Expenses</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={incomeVsExpenseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748B" strokeWidth={0.5} tickLine={false} />
                <YAxis stroke="#64748B" strokeWidth={0.5} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                    borderColor: 'rgba(51, 65, 85, 0.5)', 
                    borderRadius: '16px',
                    color: 'white'
                  }} 
                />
                <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown Pie Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Expenditures Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">Slicing overall expenses across categories</p>
          </div>

          {categorySpendingData.length > 0 ? (
            <div className="h-56 relative flex items-center justify-center font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySpendingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categorySpendingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Spent']}
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      borderColor: 'rgba(51, 65, 85, 0.5)', 
                      borderRadius: '12px',
                      color: 'white'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Abs center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Total Outflow</span>
                <span className="text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(totalExpense)}</span>
              </div>
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-slate-400">
              <AlertCircle className="w-8 h-8 mb-2 stroke-1 text-slate-300" />
              <span className="text-xs">No active expense data recorded.</span>
            </div>
          )}

          {/* Slices Indicators legend list */}
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {categorySpendingData.slice(0, 4).map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                  <span className="text-slate-600 dark:text-slate-400 truncate max-w-[120px]">{entry.name}</span>
                </div>
                <span className="text-slate-800 dark:text-slate-200 font-mono">{formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. Secondary Bento Grid Section: Weekly Trends, Sub bills & Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Weekly Trend Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>Weekly Spending Intensity</span>
          </h4>
          
          <div className="h-52 w-full font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrendData}>
                <XAxis dataKey="day" stroke="#64748B" strokeWidth={0.5} tickLine={false} />
                <YAxis stroke="#64748B" strokeWidth={0.5} tickLine={false} />
                <Tooltip 
                  formatter={(value) => [`$${value}`, 'Outflow']}
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                    borderColor: 'rgba(51, 65, 85, 0.5)', 
                    borderRadius: '12px',
                    color: 'white'
                  }}
                />
                <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Subscription Bills */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                <span>Upcoming Scheduled Bills</span>
              </h4>
              <button 
                onClick={() => setActiveTab('subscriptions')}
                className="text-xs text-blue-500 hover:text-blue-600 font-semibold"
              >
                Manage
              </button>
            </div>

            {activeSubs.length > 0 ? (
              <div className="space-y-3">
                {activeSubs.map((sub, idx) => {
                  const daysLeft = Math.ceil((new Date(sub.nextBillingDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                  return (
                    <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                          <CreditCard className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{sub.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Due {sub.nextBillingDate}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 font-mono">{formatCurrency(sub.amount)}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase font-mono ${daysLeft <= 3 ? 'bg-red-100 text-red-600 dark:bg-red-950/20' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                          {daysLeft <= 0 ? 'Due today' : `${daysLeft} days`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400">
                <CreditCard className="w-8 h-8 mb-2 stroke-1 text-slate-300" />
                <span className="text-xs">No active recurring bills scheduled.</span>
              </div>
            )}
          </div>
        </div>

        {/* Savings progress summaries */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-emerald-500" />
                <span>Savings Targets</span>
              </h4>
              <button 
                onClick={() => setActiveTab('savings')}
                className="text-xs text-blue-500 hover:text-blue-600 font-semibold"
              >
                View Goals
              </button>
            </div>

            {goals.length > 0 ? (
              <div className="space-y-3">
                {goals.slice(0, 3).map((goal, idx) => {
                  const percent = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <div className="flex items-center gap-2 truncate max-w-[150px]">
                          <IconResolver name={goal.icon} className="w-3.5 h-3.5" style={{ color: goal.color }} />
                          <span className="text-slate-700 dark:text-slate-300 truncate">{goal.name}</span>
                        </div>
                        <span className="text-slate-900 dark:text-slate-100 font-mono">{percent}%</span>
                      </div>
                      
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: goal.color }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400">
                <PiggyBank className="w-8 h-8 mb-2 stroke-1 text-slate-300" />
                <span className="text-xs">Establish your savings goal portfolio.</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 5. Recent Transactions table list section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
            <p className="text-xs text-slate-400 mt-0.5">Surgically monitored transfers logged inside active sessions</p>
          </div>
          
          <button 
            onClick={() => setActiveTab('transactions')}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-600"
          >
            <span>Launch Ledger</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/50">
                  <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Transaction / Date</th>
                  <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Notes</th>
                  <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/30">
                {transactions.slice(0, 5).map((t, idx) => (
                  <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-950/25 transition-colors">
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {t.type === 'income' ? <ArrowUpRight className="w-4.5 h-4.5" /> : <ArrowDownRight className="w-4.5 h-4.5" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-[180px]">{t.notes || (t.type === 'income' ? 'Direct Deposit' : 'Retail Outflow')}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{t.date}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-bold border" style={{ borderColor: `${t.categoryColor}30`, backgroundColor: `${t.categoryColor}10`, color: t.categoryColor }}>
                        <IconResolver name={t.categoryIcon || 'HelpCircle'} className="w-3 h-3" />
                        <span>{t.categoryName || 'Unknown'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 text-xs text-slate-400 dark:text-slate-500 hidden sm:table-cell truncate max-w-[200px]">
                      {t.isRecurring ? `Recurring (${t.recurrenceRule})` : 'Single Settlement'}
                    </td>

                    <td className="py-3.5 text-right">
                      <span className={`text-xs font-bold font-mono ${t.type === 'income' ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-200'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 stroke-1 text-slate-200 mb-2" />
            <span className="text-sm">No transaction sessions logged. Initialize your ledger!</span>
          </div>
        )}
      </div>

    </div>
  );
}
