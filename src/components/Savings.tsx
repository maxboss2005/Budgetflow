import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  Calendar, 
  PiggyBank, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  X, 
  Sparkles, 
  TrendingDown,
  Gift,
  Award,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Edit2
} from 'lucide-react';
import { SavingsGoal } from '../types';
import { IconResolver } from './Dashboard';

interface SavingsProps {
  goals: SavingsGoal[];
  currencySymbol: string;
  accounts?: any[];
  categories?: any[];
  onAddTransaction?: (tx: any) => void;
  onAddGoal: (goal: any) => void;
  onUpdateGoal: (id: string, updates: any) => void;
  onDeleteGoal: (id: string) => void;
}

export default function Savings({
  goals,
  currencySymbol,
  accounts = [],
  categories = [],
  onAddTransaction,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal
}: SavingsProps) {

  // Custom Delete & Selection State
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id?: string; ids?: string[] } | null>(null);

  // Modal State for Goals creation
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [icon, setIcon] = useState('PiggyBank');
  const [color, setColor] = useState('#3B82F6');

  // Modal State for Deposit/Withdrawal adjustment
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [adjustType, setAdjustType] = useState<'deposit' | 'withdraw'>('deposit');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Modal State for Editing goal
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [accountId, setAccountId] = useState('');
  // Confetti celebration state
  const [showConfetti, setShowConfetti] = useState(false);

  const triggerCelebration = () => {
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
    }, 4500);
  };

  // --- Aggregate Stats Calculations ---
  const aggregateTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const aggregateCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const aggregatePercent = aggregateTarget > 0 ? Math.round((aggregateCurrent / aggregateTarget) * 100) : 0;
  const remainingGap = Math.max(0, aggregateTarget - aggregateCurrent);

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseFloat(targetAmount);
    const parsedCurrent = parseFloat(currentAmount) || 0;

    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      alert('Please enter a valid target amount.');
      return;
    }

    const payload: any = {
      name: name.trim(),
      targetAmount: parsedTarget,
      currentAmount: parsedCurrent,
      targetDate,
      icon,
      color,
      status: parsedCurrent >= parsedTarget ? 'reached' : 'active',
      accountId: accountId || undefined
    };

    if (editingGoal) {
      onUpdateGoal(editingGoal.id, payload);
    } else {
      onAddGoal(payload);
    }

    setModalOpen(false);
    setEditingGoal(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setAccountId('');
  };

  const handleOpenCreateGoal = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetDate(new Date().toISOString().split('T')[0]);
    setIcon('PiggyBank');
    setColor('#3B82F6');
    setAccountId('');
    setModalOpen(true);
  };

  const openEditModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setTargetDate(goal.targetDate || goal.deadline || '');
    setIcon(goal.icon || 'PiggyBank');
    setColor(goal.color || '#3B82F6');
    setAccountId(goal.accountId || '');
    setModalOpen(true);
  };

  const handleAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;

    const parsedAdjust = parseFloat(adjustAmount);
    if (isNaN(parsedAdjust) || parsedAdjust <= 0) {
      alert('Please enter a valid transfer amount.');
      return;
    }

    let nextAmount = selectedGoal.currentAmount;
    if (adjustType === 'deposit') {
      nextAmount += parsedAdjust;
      // Trigger confetti if this deposit crosses 100% threshold
      if (nextAmount >= selectedGoal.targetAmount && selectedGoal.currentAmount < selectedGoal.targetAmount) {
        triggerCelebration();
      }
    } else {
      nextAmount = Math.max(0, nextAmount - parsedAdjust);
    }

    const updates: Partial<SavingsGoal> = {
      currentAmount: nextAmount,
      status: nextAmount >= selectedGoal.targetAmount ? 'reached' : 'active'
    };

    onUpdateGoal(selectedGoal.id, updates);

    // If an account is selected, log a corresponding transaction to deduct/add balance
    if (selectedAccountId && onAddTransaction) {
      const targetType = adjustType === 'deposit' ? 'expense' : 'income';
      const cat = categories.find(c => c.type === targetType && c.name.toLowerCase().includes('saving')) ||
                  categories.find(c => c.type === targetType);
      
      onAddTransaction({
        amount: parsedAdjust,
        type: targetType,
        categoryId: cat?.id || '',
        date: new Date().toISOString().split('T')[0],
        notes: `${adjustType === 'deposit' ? 'Allocation to' : 'Withdrawal from'} savings goal: ${selectedGoal.name}`,
        accountId: selectedAccountId
      });
    }

    setAdjustModalOpen(false);
    setAdjustAmount('');
    setSelectedAccountId('');
    setSelectedGoal(null);
  };

  const getMilestoneLabel = (percent: number) => {
    if (percent >= 100) return { text: 'Milestone Achieved! 🏆', color: 'text-emerald-500 bg-emerald-500/10' };
    if (percent >= 75) return { text: 'Almost Unlocked! 💎', color: 'text-indigo-500 bg-indigo-500/10' };
    if (percent >= 50) return { text: 'Halfway Mark Passed! 🚀', color: 'text-blue-500 bg-blue-500/10' };
    if (percent >= 25) return { text: 'Quarter Milestone! 🎉', color: 'text-amber-500 bg-amber-500/10' };
    return { text: 'Asset Accrual Initiated 🪵', color: 'text-slate-400 bg-slate-100 dark:bg-slate-950' };
  };

  const formatCurrency = (val: number) => {
    return `${currencySymbol}${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  return (
    <div id="savings-view" className="p-6 md:p-8 space-y-6 animate-fade-in no-print">
      
      {/* Header and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Savings Vaults</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Designate structural targets, log direct deposits, and track unlocks.</p>
        </div>

        <button 
          onClick={handleOpenCreateGoal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/15 transition-all cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Designate Target</span>
        </button>
      </div>

      {/* Aggregate Overview Bento Card */}
      <div className="bg-gradient-to-tr from-slate-900 to-slate-850 dark:from-slate-950 dark:to-slate-900 rounded-3xl p-6 text-white border border-slate-800 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Aggregated Vault Positions</span>
            <h2 className="text-3xl font-bold font-mono">{formatCurrency(aggregateCurrent)} <span className="text-sm font-sans text-slate-400">saved</span></h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              You are currently holding <strong>{aggregateCurrent > 0 ? `${aggregatePercent}%` : '0%'}</strong> of your collective target goal sum of <strong>{formatCurrency(aggregateTarget)}</strong>, with a residual funding gap of <strong>{formatCurrency(remainingGap)}</strong>.
            </p>
          </div>

          {/* Large dynamic gauge bar */}
          <div className="flex-1 w-full max-w-sm space-y-2 font-mono">
            <div className="flex justify-between items-center text-xs font-bold">
              <span>Overall Progress</span>
              <span>{aggregatePercent}%</span>
            </div>
            
            <div className="w-full h-3 rounded-full bg-slate-800/80 overflow-hidden p-[2px] border border-slate-700/50">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                style={{ width: `${aggregatePercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Savings Milestones Map & Celebrations */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        
        {/* LIGHTWEIGHT PURE-CSS CONFETTI GENERATOR */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
            {Array.from({ length: 60 }).map((_, idx) => {
              const left = Math.floor(Math.random() * 100);
              const delay = Math.random() * 2.5;
              const duration = 2.5 + Math.random() * 2;
              const size = 6 + Math.floor(Math.random() * 10);
              const colors = ['#3B82F6', '#10B981', '#EC4899', '#EF4444', '#F59E0B', '#8B5CF6', '#14B8A6'];
              const color = colors[Math.floor(Math.random() * colors.length)];
              return (
                <div
                  key={idx}
                  className="absolute rounded-sm animate-[savings-fall_3s_infinite_linear]"
                  style={{
                    left: `${left}%`,
                    top: `-20px`,
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: color,
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                  }}
                />
              );
            })}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes savings-fall {
                0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
                100% { transform: translateY(500px) rotate(720deg); opacity: 0; }
              }
            `}} />
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-500 animate-bounce" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Milestones Map</h3>
              <p className="text-[10px] text-slate-400">Chronological visual mapping of your savings targets towards completion.</p>
            </div>
          </div>

          <button
            onClick={triggerCelebration}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Simulate Milestone Celebration 🎉</span>
          </button>
        </div>

        {/* Milestone Map Track */}
        <div className="py-6 px-4">
          <div className="relative h-2.5 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50">
            
            {/* Base Milestone Notches */}
            {[25, 50, 75, 100].map((mMark) => (
              <div 
                key={mMark} 
                className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${mMark}%` }}
              >
                <div className={`w-3.5 h-3.5 rounded-full border-2 ${
                  aggregatePercent >= mMark 
                    ? 'bg-indigo-500 border-indigo-400 dark:border-indigo-600 shadow-sm shadow-indigo-500/20' 
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800'
                }`} />
                <span className="text-[9px] font-bold font-mono text-slate-450 mt-1.5">{mMark}%</span>
                <span className="text-[8px] font-medium text-slate-400 max-w-[40px] text-center leading-none mt-0.5">
                  {mMark === 25 && 'Quarter'}
                  {mMark === 50 && 'Halfway'}
                  {mMark === 75 && 'Near'}
                  {mMark === 100 && 'Vaulted 🏆'}
                </span>
              </div>
            ))}

            {/* Overall aggregate filling trail */}
            <div 
              className="absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 opacity-20 pointer-events-none"
              style={{ width: `${Math.min(100, aggregatePercent)}%` }}
            />

            {/* Individual active Goal bubbles plotted onto the timeline track */}
            {goals.map((g) => {
              const gPercent = Math.min(100, g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0);
              return (
                <div 
                  key={g.id}
                  className="absolute top-1/2 -translate-y-1/2 -ml-3 z-20 group"
                  style={{ left: `${gPercent}%` }}
                >
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center border shadow-md hover:scale-125 transition-all cursor-help relative"
                    style={{ 
                      backgroundColor: g.color, 
                      borderColor: 'rgba(255,255,255,0.4)',
                      color: '#ffffff'
                    }}
                  >
                    <IconResolver name={g.icon || 'PiggyBank'} className="w-3 h-3" />
                    
                    {/* Floating Info Tooltip */}
                    <div className="absolute hidden group-hover:block bottom-8 left-1/2 -translate-x-1/2 bg-slate-950 text-white p-2.5 rounded-xl shadow-2xl border border-slate-800 z-30 min-w-[140px] text-left">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-0.5">{g.name}</p>
                      <div className="flex justify-between items-baseline font-mono text-[10px]">
                        <span>Progress:</span>
                        <span className="font-bold">{gPercent}%</span>
                      </div>
                      <div className="flex justify-between items-baseline font-mono text-[9px] text-slate-300 mt-0.5">
                        <span>Balance:</span>
                        <span>{formatCurrency(g.currentAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

          </div>
        </div>

      </div>

      {/* Mass Delete Selection Alert Banner */}
      {selectedGoalIds.length > 0 && (
        <div className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-between animate-fade-in no-print">
          <span className="text-xs font-bold text-red-600 dark:text-red-400">
            Selected {selectedGoalIds.length} savings goal{selectedGoalIds.length > 1 ? 's' : ''} for mass deletion
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedGoalIds([])}
              className="px-3 py-1 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setDeleteTarget({ type: 'mass_goals', ids: selectedGoalIds });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all hover:shadow-md cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Mass Delete ({selectedGoalIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid of goals */}
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const percent = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
            const milestone = getMilestoneLabel(percent);
            
            const daysLeft = Math.ceil((new Date(goal.targetDate || goal.deadline || '').getTime() - new Date().getTime()) / (1000 * 3600 * 24));

            return (
              <div 
                key={goal.id} 
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 p-6 flex flex-col justify-between transition-all hover:shadow-md relative overflow-hidden"
              >
                
                {/* Upper Details */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      {/* Checkbox for mass selection */}
                      <input 
                        type="checkbox"
                        className="rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4 mr-1"
                        checked={selectedGoalIds.includes(goal.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGoalIds(prev => [...prev, goal.id]);
                          } else {
                            setSelectedGoalIds(prev => prev.filter(id => id !== goal.id));
                          }
                        }}
                      />
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ 
                        borderColor: `${goal.color}25`,
                        backgroundColor: `${goal.color}10`,
                        color: goal.color
                      }}>
                        <IconResolver name={goal.icon} className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[140px]">{goal.name}</h3>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Deadline: {goal.targetDate || goal.deadline || 'No target'}</span>
                        {goal.accountId && (
                          <div className="text-[9px] text-blue-500 dark:text-blue-400 font-bold flex items-center gap-1 mt-0.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            Linked: {accounts.find(a => a.id === goal.accountId)?.name || 'External'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button 
                        onClick={() => openEditModal(goal)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                        title="Edit target details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteTarget({ type: 'goal', id: goal.id })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                        title="Delete target"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Milestone status indicator tag */}
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold mb-4 ${milestone.color}`}>
                    <Award className="w-3 h-3" />
                    <span>{milestone.text}</span>
                  </div>

                  {/* Balance details */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acquired Balance</p>
                    <h2 className="text-2xl font-bold font-mono text-slate-850 dark:text-white">
                      {formatCurrency(goal.currentAmount)}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Target limit {formatCurrency(goal.targetAmount)} | residual gap {formatCurrency(remaining)}
                    </p>
                  </div>
                </div>

                {/* Lower progressions */}
                <div className="mt-6 space-y-4">
                  {/* Progress Line */}
                  <div className="space-y-1.5 font-mono">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                      <span>Progression rate</span>
                      <span>{percent}%</span>
                    </div>
                    
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: goal.color }}></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between text-xs font-semibold text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{daysLeft > 0 ? `${daysLeft} days remaining` : 'Target deadline met'}</span>
                    </div>

                    {/* Deposit/Withdraw trigger buttons */}
                    <button
                      onClick={() => { setSelectedGoal(goal); setAdjustModalOpen(true); }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-blue-500 dark:text-blue-400 transition-colors cursor-pointer"
                    >
                      <span>Adjust Funds</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl py-16 text-center">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/10 rounded-2xl flex items-center justify-center mx-auto mb-5 text-blue-500 shadow-sm animate-pulse">
            <PiggyBank className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No savings goals recorded.</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-[280px] mx-auto leading-relaxed">Establish structured vault targets, allocate milestone milestones, and track deposit allocations.</p>
          <button 
            onClick={handleOpenCreateGoal}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/15 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Designate Your First Target</span>
          </button>
        </div>
      )}

      {/* SAVINGS GOAL GENERATOR MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span>{editingGoal ? 'Modify Vault Target' : 'Establish Vault Target'}</span>
              </h3>
              <button onClick={() => { setModalOpen(false); setEditingGoal(null); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="p-6 space-y-4">
              
              {/* Goal name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Target Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tesla Down Payment, Emergency Reserves..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Targets and Initial values */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Target Cap</label>
                  <input
                    type="number"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="10000"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Initial Deposit</label>
                  <input
                    type="number"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Deadline Target Date */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Target Deadline Date</label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Interactive Icon Selector row */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Visual Emblem Icon</label>
                <div className="grid grid-cols-4 gap-2">
                  {['PiggyBank', 'Gift', 'Home', 'Car'].map((emblem) => (
                    <button
                      key={emblem}
                      type="button"
                      onClick={() => setIcon(emblem)}
                      className={`
                        py-2 rounded-xl border flex justify-center items-center transition-all
                        ${icon === emblem 
                          ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-500 text-blue-500' 
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50'}
                      `}
                    >
                      <IconResolver name={emblem} className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color selectors */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Goal Accent Palette Color</label>
                <div className="flex gap-2">
                  {['#3B82F6', '#10B981', '#EC4899', '#8B5CF6', '#F59E0B'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'scale-115 ring-2 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
                      style={{ backgroundColor: c, ringColor: c }}
                    />
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
                  You can establish this savings target now and link an account later when you have one in Core Finance.
                </p>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/15 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                <span>{editingGoal ? 'Save Target Changes' : 'Establish Target'}</span>
              </button>

            </form>
          </div>
        </div>
      )}

      {/* FUNDS ADJUSTMENT MODAL */}
      {adjustModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-blue-500" />
                <span>Adjust Funds: {selectedGoal.name}</span>
              </h3>
              <button onClick={() => { setAdjustModalOpen(false); setSelectedGoal(null); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustmentSubmit} className="p-6 space-y-4">
              
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                <button
                  type="button"
                  onClick={() => setAdjustType('deposit')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${adjustType === 'deposit' ? 'bg-white dark:bg-slate-800 text-emerald-500 shadow-sm' : 'text-slate-400'}`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Allocate Deposit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('withdraw')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${adjustType === 'withdraw' ? 'bg-white dark:bg-slate-800 text-red-500 shadow-sm' : 'text-slate-400'}`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Execute Withdrawal</span>
                </button>
              </div>

              {/* Amount value */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Adjustment value</label>
                <input
                   type="number"
                   required
                   value={adjustAmount}
                   onChange={(e) => setAdjustAmount(e.target.value)}
                   placeholder="0.00"
                   className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Linked Account */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  {adjustType === 'deposit' ? 'Funding Source Account (Deduct)' : 'Destination Account (Add)'}
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">None (Cash / External)</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({currencySymbol}{acc.balance})
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/15 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                <span>Commit Fund Adjustment</span>
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
                {deleteTarget.ids ? 'Mass Delete Records' : 'Confirm Deletion'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {deleteTarget.ids 
                  ? `Are you sure you want to permanently delete these ${deleteTarget.ids.length} selected items? This action cannot be undone.`
                  : 'Are you sure you want to permanently delete this record? This action cannot be undone.'}
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
                  if (deleteTarget.ids) {
                    deleteTarget.ids.forEach(id => onDeleteGoal(id));
                    setSelectedGoalIds([]);
                  } else if (deleteTarget.id) {
                    onDeleteGoal(deleteTarget.id);
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
