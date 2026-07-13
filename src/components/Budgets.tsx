import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Calendar, 
  TrendingUp, 
  HelpCircle, 
  Sparkles, 
  PieChart, 
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Budget, Category, Transaction } from '../types';
import { IconResolver } from './Dashboard';

interface BudgetsProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  currencySymbol: string;
  onAddBudget: (budget: any) => void;
  onDeleteBudget: (id: string) => void;
}

export default function Budgets({
  budgets,
  categories,
  transactions,
  currencySymbol,
  onAddBudget,
  onDeleteBudget
}: BudgetsProps) {

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryId, setCategoryId] = useState('all');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  // --- Calculations Helper ---
  const getBudgetDetails = (budget: Budget) => {
    const now = new Date();
    const currentMonthStr = now.toISOString().substring(0, 7); // "YYYY-MM"

    // Calculate actual spent this month
    const spent = transactions
      .filter(t => {
        // Must be expense
        if (t.type !== 'expense') return false;
        
        // Filter by date matching current month
        if (!t.date.startsWith(currentMonthStr)) return false;

        // Match category
        if (budget.categoryId !== 'all' && t.categoryId !== budget.categoryId) return false;

        return true;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const remaining = Math.max(0, budget.amount - spent);
    const percent = budget.amount > 0 ? Math.min(Math.round((spent / budget.amount) * 100), 100) : 0;

    // Days remaining in month
    const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = totalDaysInMonth - now.getDate();

    return { spent, remaining, percent, daysRemaining };
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const now = new Date();
    const startDate = now.toISOString().split('T')[0];
    
    // Set EndDate based on period
    const endDate = new Date();
    if (period === 'daily') endDate.setDate(now.getDate() + 1);
    else if (period === 'weekly') endDate.setDate(now.getDate() + 7);
    else endDate.setMonth(now.getMonth() + 1);

    const payload = {
      categoryId,
      amount: parsedAmount,
      period,
      startDate,
      endDate: endDate.toISOString().split('T')[0]
    };

    onAddBudget(payload);
    setModalOpen(false);
    setAmount('');
  };

  const formatCurrency = (val: number) => {
    return `${currencySymbol}${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  return (
    <div id="budgets-view" className="p-6 md:p-8 space-y-6 animate-fade-in no-print">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Active Limits</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure limits on specific taxonomies to prevent structural depletion.</p>
        </div>

        <button 
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/15 transition-all cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Establish Limit</span>
        </button>
      </div>

      {/* Grid of budgets */}
      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => {
            const { spent, remaining, percent, daysRemaining } = getBudgetDetails(budget);
            const isOver = spent > budget.amount;
            const isWarning = percent >= 75 && percent < 100;

            const categoryDetail = categories.find(c => c.id === budget.categoryId);

            return (
              <div 
                key={budget.id} 
                className={`
                  bg-white dark:bg-slate-900 rounded-3xl border p-6 flex flex-col justify-between transition-all hover:shadow-md relative overflow-hidden
                  ${isOver 
                    ? 'border-red-500/30' 
                    : isWarning 
                      ? 'border-amber-500/30' 
                      : 'border-slate-200/60 dark:border-slate-800/80'}
                `}
              >
                
                {/* Header detail */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ 
                      borderColor: categoryDetail ? `${categoryDetail.color}25` : 'rgba(59,130,246,0.15)',
                      backgroundColor: categoryDetail ? `${categoryDetail.color}10` : 'rgba(59,130,246,0.05)',
                      color: categoryDetail ? categoryDetail.color : '#3B82F6'
                    }}>
                      {budget.categoryId === 'all' ? (
                        <PieChart className="w-5 h-5" />
                      ) : (
                        <IconResolver name={categoryDetail?.icon || 'HelpCircle'} className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[140px]">{budget.categoryName}</h3>
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400">{budget.period} limit</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => { if (confirm('Are you sure you want to remove this budget?')) onDeleteBudget(budget.id); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    title="Remove budget"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Circle & Metrics Row */}
                <div className="my-2 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remaining Buffer</p>
                    <h2 className="text-xl font-bold font-mono text-slate-800 dark:text-white">
                      {isOver ? formatCurrency(0) : formatCurrency(remaining)}
                    </h2>
                    <p className="text-[10px] text-slate-400">
                      Spent {formatCurrency(spent)} of {formatCurrency(budget.amount)}
                    </p>
                  </div>

                  {/* Absolute visual gauge */}
                  <div className="relative w-16 h-16 flex items-center justify-center font-mono">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="26" stroke="rgba(241,245,249,0.5)" strokeWidth="4" fill="transparent" className="dark:stroke-slate-800/50" />
                      <circle 
                        cx="32" 
                        cy="32" 
                        r="26" 
                        stroke={isOver ? '#EF4444' : isWarning ? '#F59E0B' : '#3B82F6'} 
                        strokeWidth="4.5" 
                        fill="transparent" 
                        strokeDasharray={2 * Math.PI * 26}
                        strokeDashoffset={2 * Math.PI * 26 * (1 - percent / 100)}
                        className="transition-all duration-500 ease-out"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className={`absolute text-xs font-bold ${isOver ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-blue-500'}`}>{percent}%</span>
                  </div>
                </div>

                {/* Progression Bar indicators */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{daysRemaining} days remaining</span>
                  </div>

                  {isOver ? (
                    <span className="flex items-center gap-1 text-red-500 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Exceeded Limit</span>
                    </span>
                  ) : isWarning ? (
                    <span className="text-amber-500 font-bold">Warning Threshold</span>
                  ) : (
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Under Limit</span>
                    </span>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl py-16 text-center text-slate-400">
          <PieChart className="w-16 h-16 stroke-1 text-slate-200 mb-3 mx-auto" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">No active budgets established.</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto leading-relaxed">Assign budget limits on specific spend categories to generate real-time usage alarms.</p>
        </div>
      )}

      {/* BUDGET CONFIGURATION CREATE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span>Establish Limit Cap</span>
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              
              {/* Category mapping selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Taxonomy / Scope</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="all">All Combined Spending</option>
                  {categories.filter(c => c.type === 'expense').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Amount Cap input */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Assigned Limit Cap</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Cycle period */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Billing cycle period</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['daily', 'weekly', 'monthly'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriod(p)}
                      className={`
                        py-2 rounded-xl text-[10px] font-bold capitalize border transition-all
                        ${period === p 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/10' 
                          : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-slate-50'}
                      `}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal action */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/15 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                <span>Establish Limit Cap</span>
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
