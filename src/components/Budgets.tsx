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
  AlertCircle,
  ShieldCheck,
  ShoppingBag,
  PiggyBank,
  Coins,
  Sliders,
  Shuffle,
  Check,
  Edit2
} from 'lucide-react';
import { Budget, Category, Transaction } from '../types';
import { IconResolver } from './Dashboard';

interface BudgetsProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  currencySymbol: string;
  accounts?: any[];
  onAddBudget: (budget: any) => void;
  onUpdateBudget?: (id: string, updates: any) => void;
  onDeleteBudget: (id: string) => void;
}

export default function Budgets({
  budgets,
  categories,
  transactions,
  currencySymbol,
  accounts = [],
  onAddBudget,
  onUpdateBudget,
  onDeleteBudget
}: BudgetsProps) {

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryId, setCategoryId] = useState('all');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [accountId, setAccountId] = useState('');

  // Custom Delete State
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null);

  // Tab selector state
  const [activeTab, setActiveTab] = useState<'limits' | 'envelopes'>('limits');

  // Envelope Allocator states
  const [envelopeIncome, setEnvelopeIncome] = useState<number>(5000);
  const [envelopePreset, setEnvelopePreset] = useState<'50-30-20' | '70-20-10' | 'custom'>('50-30-20');
  const [envelopes, setEnvelopes] = useState<Array<{ id: string; name: string; percent: number; color: string; icon: string; categoryId: string }>>([
    { id: 'env-needs', name: 'Essential Needs (50%)', percent: 50, color: '#3B82F6', icon: 'ShieldCheck', categoryId: 'cat-rent' },
    { id: 'env-wants', name: 'Personal Wants (30%)', percent: 30, color: '#EC4899', icon: 'ShoppingBag', categoryId: 'cat-shopping' },
    { id: 'env-savings', name: 'Future Savings (20%)', percent: 20, color: '#10B981', icon: 'PiggyBank', categoryId: 'cat-salary' }
  ]);

  const [customEnvName, setCustomEnvName] = useState('');
  const [customEnvCategory, setCustomEnvCategory] = useState('all');
  const [customEnvColor, setCustomEnvColor] = useState('#8B5CF6');
  const [customEnvIcon, setCustomEnvIcon] = useState('Sparkles');

  const handlePresetChange = (preset: '50-30-20' | '70-20-10' | 'custom') => {
    setEnvelopePreset(preset);
    if (preset === '50-30-20') {
      setEnvelopes([
        { id: 'env-needs', name: 'Essential Needs (50%)', percent: 50, color: '#3B82F6', icon: 'ShieldCheck', categoryId: 'cat-rent' },
        { id: 'env-wants', name: 'Personal Wants (30%)', percent: 30, color: '#EC4899', icon: 'ShoppingBag', categoryId: 'cat-shopping' },
        { id: 'env-savings', name: 'Future Savings (20%)', percent: 20, color: '#10B981', icon: 'PiggyBank', categoryId: 'cat-salary' }
      ]);
    } else if (preset === '70-20-10') {
      setEnvelopes([
        { id: 'env-needs', name: 'Essential Needs (70%)', percent: 70, color: '#3B82F6', icon: 'ShieldCheck', categoryId: 'cat-rent' },
        { id: 'env-wants', name: 'Personal Wants (20%)', percent: 20, color: '#EC4899', icon: 'ShoppingBag', categoryId: 'cat-shopping' },
        { id: 'env-savings', name: 'Future Savings (10%)', percent: 10, color: '#10B981', icon: 'PiggyBank', categoryId: 'cat-salary' }
      ]);
    }
  };

  const handleEnvelopeSliderChange = (id: string, value: number) => {
    setEnvelopes(prev => prev.map(e => e.id === id ? { ...e, percent: value } : e));
    setEnvelopePreset('custom');
  };

  const handleNormalizeEnvelopes = () => {
    const total = envelopes.reduce((sum, e) => sum + e.percent, 0);
    if (total === 0) return;
    setEnvelopes(prev => prev.map(e => ({
      ...e,
      percent: Math.round((e.percent / total) * 100)
    })));
    setEnvelopePreset('custom');
  };

  const handleAddCustomEnvelope = () => {
    if (!customEnvName.trim()) return;
    const newId = 'env_' + Math.random().toString(36).substring(2, 9);
    setEnvelopes(prev => [
      ...prev,
      {
        id: newId,
        name: customEnvName.trim(),
        percent: 0,
        color: customEnvColor,
        icon: customEnvIcon,
        categoryId: customEnvCategory
      }
    ]);
    setCustomEnvName('');
    setEnvelopePreset('custom');
  };

  const handleDeleteEnvelope = (id: string) => {
    setEnvelopes(prev => prev.filter(e => e.id !== id));
    setEnvelopePreset('custom');
  };

  const handleEstablishEnvelopeLimits = () => {
    let establishedCount = 0;
    envelopes.forEach(env => {
      const dollarAmount = Math.round((envelopeIncome * env.percent) / 100);
      if (dollarAmount > 0) {
        onAddBudget({
          categoryId: env.categoryId || 'all',
          amount: dollarAmount,
          period: 'monthly',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
        });
        establishedCount++;
      }
    });
    alert(`Success: ${establishedCount} active budgets successfully committed to the database ledger.`);
    setActiveTab('limits');
  };

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

    const payload: any = {
      categoryId,
      amount: parsedAmount,
      period,
      startDate,
      endDate: endDate.toISOString().split('T')[0],
      accountId: accountId || undefined
    };

    if (editingBudget && onUpdateBudget) {
      onUpdateBudget(editingBudget.id, payload);
    } else {
      onAddBudget(payload);
    }
    
    setModalOpen(false);
    setAmount('');
    setAccountId('');
    setEditingBudget(null);
  };

  const handleOpenAddModal = () => {
    setEditingBudget(null);
    setCategoryId('all');
    setAmount('');
    setPeriod('monthly');
    setAccountId('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (budget: Budget) => {
    setEditingBudget(budget);
    setCategoryId(budget.categoryId);
    setAmount(budget.amount.toString());
    setPeriod(budget.period);
    setAccountId(budget.accountId || '');
    setModalOpen(true);
  };

  const formatCurrency = (val: number) => {
    return `${currencySymbol}${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  return (
    <div id="budgets-view" className="p-6 md:p-8 space-y-6 animate-fade-in no-print">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {activeTab === 'limits' ? 'Active Limits' : 'Interactive Envelope Planner'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {activeTab === 'limits' 
              ? 'Configure limits on specific taxonomies to prevent structural depletion.' 
              : 'Allocate monthly income proactively using high-fidelity envelope indicators.'}
          </p>
        </div>

        {activeTab === 'limits' && (
          <button 
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/15 transition-all cursor-pointer self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Establish Limit</span>
          </button>
        )}
      </div>

      {/* Switcher Tab Buttons */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-0.5 gap-4">
        <button
          onClick={() => setActiveTab('limits')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'limits' 
              ? 'border-blue-500 text-blue-500' 
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          Active Limits
        </button>
        <button
          onClick={() => setActiveTab('envelopes')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'envelopes' 
              ? 'border-blue-500 text-blue-500' 
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
          <span>Interactive Envelope Planner</span>
        </button>
      </div>

      {activeTab === 'limits' ? (
        <>
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

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleOpenEditModal(budget)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                          title="Edit budget"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteTarget({ type: 'budget', id: budget.id })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                          title="Remove budget"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
                        {budget.accountId && (
                          <div className="mt-1 text-[10px] text-blue-500 dark:text-blue-400 font-semibold flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            Linked: {accounts.find(a => a.id === budget.accountId)?.name || 'External'}
                          </div>
                        )}
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl py-16 text-center text-slate-450">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/10 rounded-2xl flex items-center justify-center mx-auto mb-5 text-blue-500 shadow-sm animate-pulse">
                <PieChart className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No active budgets established.</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-[280px] mx-auto leading-relaxed">Assign budget limits on specific spend categories to generate real-time usage alarms.</p>
              <button 
                onClick={() => setModalOpen(true)}
                className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/15 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Establish Your First Limit</span>
              </button>
            </div>
          )}
        </>
      ) : (
        /* INTERACTIVE ENVELOPE BUDGET ALLOCATOR VIEW */
        <div className="space-y-6 animate-fade-in">
          
          {/* Income & Presets Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              <div className="md:col-span-4">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Operational Monthly Income</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400 font-mono">{currencySymbol}</span>
                  <input
                    type="number"
                    value={envelopeIncome}
                    onChange={(e) => setEnvelopeIncome(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full pl-8 pr-4 py-2 text-sm font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="md:col-span-8">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Budget Allocation Presets</label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    onClick={() => handlePresetChange('50-30-20')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex flex-col items-center ${
                      envelopePreset === '50-30-20'
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                        : 'bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-950/50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-855'
                    }`}
                  >
                    <span>50/30/20 Rule</span>
                    <span className="text-[10px] font-normal opacity-80">Balanced</span>
                  </button>
                  <button
                    onClick={() => handlePresetChange('70-20-10')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex flex-col items-center ${
                      envelopePreset === '70-20-10'
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                        : 'bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-950/50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-855'
                    }`}
                  >
                    <span>70/20/10 Rule</span>
                    <span className="text-[10px] font-normal opacity-80">High Saving</span>
                  </button>
                  <button
                    onClick={() => setEnvelopePreset('custom')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex flex-col items-center ${
                      envelopePreset === 'custom'
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                        : 'bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-950/50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-855'
                    }`}
                  >
                    <span>Custom Sliders</span>
                    <span className="text-[10px] font-normal opacity-80">Manual</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Allocation Math & Buffer Banner */}
          {(() => {
            const totalPercent = envelopes.reduce((sum, e) => sum + e.percent, 0);
            const isPerfect = totalPercent === 100;
            const isOver = totalPercent > 100;
            const remainingPercent = 100 - totalPercent;
            const remainingDollar = Math.round((envelopeIncome * remainingPercent) / 100);

            return (
              <div className={`p-4.5 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isPerfect 
                  ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : isOver
                    ? 'bg-red-500/5 dark:bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                    : 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isPerfect ? 'bg-emerald-500/15' : isOver ? 'bg-red-500/15' : 'bg-blue-500/15'
                  }`}>
                    <Coins className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider">
                      {isPerfect && 'Perfect Allocation Active! 🎯'}
                      {isOver && 'Critical Over-Allocation! ⚠️'}
                      {!isPerfect && !isOver && 'Buffer Available for Envelopes 🏦'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {isPerfect && 'Awesome! 100% of your income is assigned to custom envelopes. Ready to lock.'}
                      {isOver && `You've allocated ${totalPercent}% of your income. Trim allocations by ${totalPercent - 100}% to balance.`}
                      {!isPerfect && !isOver && `You've allocated ${totalPercent}% ($${(envelopeIncome * totalPercent / 100).toLocaleString()}). Remaining buffer: ${remainingPercent}% ($${remainingDollar.toLocaleString()}).`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-center">
                  {!isPerfect && (
                    <button
                      onClick={handleNormalizeEnvelopes}
                      className="px-3 py-2 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-slate-500" />
                      <span>Normalize to 100%</span>
                    </button>
                  )}
                  <button
                    onClick={handleEstablishEnvelopeLimits}
                    disabled={isOver}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                      isOver
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-500'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Establish Limits</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Envelopes Visual Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {envelopes.map((env) => {
              const allocatedDollar = Math.round((envelopeIncome * env.percent) / 100);
              const isCustom = !env.id.startsWith('env-');

              return (
                <div 
                  key={env.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden"
                >
                  
                  {/* Visual Paper Envelope Flap Header Accent */}
                  <div className="absolute top-0 inset-x-0 h-2" style={{ backgroundColor: env.color }} />
                  
                  {/* Pocket Wave Fill Indicator */}
                  <div 
                    className="absolute bottom-0 inset-x-0 transition-all duration-700 ease-out pointer-events-none"
                    style={{ 
                      height: `${env.percent}%`, 
                      backgroundColor: `${env.color}10`,
                      borderTop: `1.5px dashed ${env.color}40`
                    }}
                  />

                  {/* Envelope Identity Card */}
                  <div className="flex items-start justify-between gap-4 mb-5 pt-2 relative z-10">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${env.color}15`, color: env.color }}
                      >
                        <IconResolver name={env.icon || 'HelpCircle'} className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-[140px]">{env.name}</h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold">
                          {env.percent}% allocated
                        </span>
                      </div>
                    </div>

                    {isCustom && (
                      <button
                        onClick={() => handleDeleteEnvelope(env.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                        title="Remove Envelope"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Allocations & Controls */}
                  <div className="space-y-4 mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/40 relative z-10">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Envelope Amount:</span>
                      <span className="text-lg font-extrabold font-mono text-slate-900 dark:text-white">{formatCurrency(allocatedDollar)}</span>
                    </div>

                    {/* Interactive Slider element */}
                    <div className="space-y-1 pt-1">
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        value={env.percent}
                        onChange={(e) => handleEnvelopeSliderChange(env.id, parseInt(e.target.value) || 0)}
                        style={{ accentColor: env.color }}
                        className="w-full h-1.5 rounded-lg appearance-none cursor-ew-resize bg-slate-100 dark:bg-slate-800"
                      />
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold font-mono">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}

            {/* Custom Envelope Creator Box */}
            <div className="bg-slate-50/40 dark:bg-slate-950/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-center min-h-[220px]">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>Create Custom Envelope</span>
              </h4>

              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Envelope Name (e.g., Dining Out)"
                    value={customEnvName}
                    onChange={(e) => setCustomEnvName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] font-bold uppercase text-slate-400 mb-1">Mapping Category</label>
                    <select
                      value={customEnvCategory}
                      onChange={(e) => setCustomEnvCategory(e.target.value)}
                      className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="all">All Combined</option>
                      {categories.filter(c => c.type === 'expense').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[8px] font-bold uppercase text-slate-400 mb-1">Envelope Icon</label>
                    <select
                      value={customEnvIcon}
                      onChange={(e) => setCustomEnvIcon(e.target.value)}
                      className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="Sparkles">✨ Sparkles</option>
                      <option value="Utensils">🍴 Food</option>
                      <option value="ShoppingBag">🛍️ Shopping</option>
                      <option value="Car">🚗 Car</option>
                      <option value="Dumbbell">💪 Fitness</option>
                      <option value="Heart">❤️ Health</option>
                      <option value="Play">🎮 Play</option>
                      <option value="Home">🏠 Rent</option>
                    </select>
                  </div>
                </div>

                {/* Color swatch selector */}
                <div className="flex gap-2.5 justify-center py-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850">
                  {['#3B82F6', '#EF4444', '#10B981', '#EC4899', '#8B5CF6', '#F59E0B'].map(col => (
                    <button
                      key={col}
                      onClick={() => setCustomEnvColor(col)}
                      style={{ backgroundColor: col }}
                      className={`w-4 h-4 rounded-full cursor-pointer transition-all ${
                        customEnvColor === col ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddCustomEnvelope}
                  disabled={!customEnvName.trim()}
                  className={`w-full py-2 text-xs font-bold text-white rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    customEnvName.trim()
                      ? 'bg-blue-600 hover:bg-blue-500 hover:shadow-lg shadow-blue-500/10'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insert Envelope</span>
                </button>
              </div>
            </div>

          </div>

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
                <span>{editingBudget ? 'Modify Limit Cap' : 'Establish Limit Cap'}</span>
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

              {/* Linked Account */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Linked Account (Core Finance)</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">None (Cash / External)</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({currencySymbol}{acc.balance})</option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                  You can establish this limit now and link an account later when you have one in Core Finance.
                </p>
              </div>

              {/* Modal action */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/15 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                <span>{editingBudget ? 'Save Changes' : 'Establish Limit Cap'}</span>
              </button>

            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM DELETE MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Confirm Deletion
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Are you sure you want to permanently delete this budget limit? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteTarget.id) {
                    onDeleteBudget(deleteTarget.id);
                  }
                  setDeleteTarget(null);
                }}
                className="flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl hover:shadow-lg hover:shadow-red-500/15 transition-all cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
