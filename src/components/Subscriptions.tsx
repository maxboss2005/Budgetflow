import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Calendar, 
  AlertCircle, 
  TrendingUp, 
  Clock, 
  X, 
  Sparkles, 
  CalendarDays, 
  Power,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Subscription, Category } from '../types';

interface SubscriptionsProps {
  subscriptions: Subscription[];
  categories: Category[];
  currencySymbol: string;
  onAddSubscription: (sub: any) => void;
  onUpdateSubscription: (id: string, updates: any) => void;
  onDeleteSubscription: (id: string) => void;
}

export default function Subscriptions({
  subscriptions,
  categories,
  currencySymbol,
  onAddSubscription,
  onUpdateSubscription,
  onDeleteSubscription
}: SubscriptionsProps) {

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled'>('active');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  // Custom Delete State
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'custom'>('monthly');
  const [nextBillingDate, setNextBillingDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [renewalReminderEnabled, setRenewalReminderEnabled] = useState(true);

  // Calendar State (Days of the current month)
  const today = new Date();
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(today.getMonth());
  const [currentCalendarYear, setCurrentCalendarYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  // Calculations: Total Subscription Costs
  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const totalCostMonthly = activeSubs.reduce((sum, s) => {
    let cost = s.amount;
    if (s.billingCycle === 'yearly') cost = s.amount / 12;
    // Assume custom are monthly proxies for simplicity
    return sum + cost;
  }, 0);

  const renewalsThisWeekCount = activeSubs.filter(s => {
    const daysLeft = Math.ceil((new Date(s.nextBillingDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return daysLeft >= 0 && daysLeft <= 7;
  }).length;

  const largestSub = activeSubs.sort((a, b) => b.amount - a.amount)[0];

  // Filtering list
  const filteredSubs = subscriptions.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // --- Subscriptions Calendar Matrix calculation ---
  const getCalendarDays = () => {
    const firstDayOfMonth = new Date(currentCalendarYear, currentCalendarMonth, 1).getDay();
    const totalDaysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();
    
    const days = [];
    // Padding from previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    // Days in current month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      days.push(d);
    }
    return days;
  };

  const calendarDays = getCalendarDays();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const getSubsDueOnDay = (day: number) => {
    const dateStr = `${currentCalendarYear}-${(currentCalendarMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return activeSubs.filter(s => {
      // In a real PWA/app, we evaluate the recurrence. Here, we can map direct match on YYYY-MM-DD or billing day
      const subDay = new Date(s.nextBillingDate).getDate();
      const subMonth = new Date(s.nextBillingDate).getMonth();
      const subYear = new Date(s.nextBillingDate).getFullYear();
      
      if (s.billingCycle === 'monthly') {
        return subDay === day;
      }
      return subDay === day && subMonth === currentCalendarMonth;
    });
  };

  const handlePrevMonth = () => {
    if (currentCalendarMonth === 0) {
      setCurrentCalendarMonth(11);
      setCurrentCalendarYear(currentCalendarYear - 1);
    } else {
      setCurrentCalendarMonth(currentCalendarMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentCalendarMonth === 11) {
      setCurrentCalendarMonth(0);
      setCurrentCalendarYear(currentCalendarYear + 1);
    } else {
      setCurrentCalendarMonth(currentCalendarMonth + 1);
    }
  };

  // --- Form Actions ---
  const openAddModal = () => {
    setEditingSub(null);
    setName('');
    setAmount('');
    setBillingCycle('monthly');
    setNextBillingDate(new Date().toISOString().split('T')[0]);
    setCategoryId(categories.filter(c => c.type === 'expense')[0]?.id || '');
    setNotes('');
    setRenewalReminderEnabled(true);
    setModalOpen(true);
  };

  const openEditModal = (sub: Subscription) => {
    setEditingSub(sub);
    setName(sub.name);
    setAmount(sub.amount.toString());
    setBillingCycle(sub.billingCycle);
    setNextBillingDate(sub.nextBillingDate);
    setCategoryId(sub.categoryId);
    setNotes(sub.notes || '');
    setRenewalReminderEnabled(sub.renewalReminderEnabled);
    setModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const payload = {
      name: name.trim(),
      amount: parsedAmount,
      billingCycle,
      nextBillingDate,
      categoryId,
      notes: notes.trim(),
      renewalReminderEnabled
    };

    if (editingSub) {
      onUpdateSubscription(editingSub.id, payload);
    } else {
      onAddSubscription(payload);
    }
    setModalOpen(false);
  };

  const handleToggleStatus = (sub: Subscription) => {
    const updatedStatus = sub.status === 'active' ? 'cancelled' : 'active';
    onUpdateSubscription(sub.id, { status: updatedStatus });
  };

  const formatCurrency = (val: number) => {
    return `${currencySymbol}${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  return (
    <div id="subscriptions-view" className="p-6 md:p-8 space-y-6 animate-fade-in no-print">
      
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Recurring Overhead</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Audit active service pipelines, renewal cycles, and cancellation strategies.</p>
        </div>

        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/15 transition-all cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Register Subscription</span>
        </button>
      </div>

      {/* Subscription Overviews Bento row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Total monthly cost */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800 p-5 space-y-1.5 shadow-sm">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Overhead Rate</span>
          <h2 className="text-2xl font-bold font-mono text-slate-800 dark:text-white">{formatCurrency(totalCostMonthly)}<span className="text-xs font-normal font-sans text-slate-400">/mo</span></h2>
          <p className="text-[10px] text-slate-400">Cumulative rate across active schedules</p>
        </div>

        {/* Weekly renewals */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800 p-5 space-y-1.5 shadow-sm">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Renewals This Week</span>
          <h2 className="text-2xl font-bold font-mono text-slate-800 dark:text-white">{renewalsThisWeekCount} bills</h2>
          <p className="text-[10px] text-slate-400">Requiring liquidity inside the next 7 days</p>
        </div>

        {/* Largest overhead */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800 p-5 space-y-1.5 shadow-sm">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Peak Expense Node</span>
          <h2 className="text-2xl font-bold font-mono text-slate-800 dark:text-white truncate max-w-[180px]">
            {largestSub ? `${largestSub.name} (${formatCurrency(largestSub.amount)})` : 'None established'}
          </h2>
          <p className="text-[10px] text-slate-400">Single highest costing subscription contract</p>
        </div>

      </div>

      {/* Subscription Calendar View Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 p-6 shadow-sm">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Column 1: Monthly Interactive Calendar Grid */}
          <div className="lg:col-span-8 space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Renewal Calendar</h3>
                  <p className="text-[10px] text-slate-400">Interactive node grid mapping upcoming automated billing dates.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrevMonth} 
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 min-w-[100px] text-center font-mono uppercase tracking-wider">{months[currentCalendarMonth]} {currentCalendarYear}</span>
                <button 
                  onClick={handleNextMonth} 
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar grid */}
            <div>
              <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold font-mono text-slate-400 border-b border-slate-100 dark:border-slate-800/40 pb-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <span key={d}>{d}</span>)}
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-xs">
                {calendarDays.map((day, idx) => {
                  if (!day) return <div key={idx} className="h-14 bg-transparent border-transparent" />;

                  const isToday = day === today.getDate() && currentCalendarMonth === today.getMonth() && currentCalendarYear === today.getFullYear();
                  const isSelected = selectedDay === day;
                  const dueSubs = getSubsDueOnDay(day);
                  const hasDue = dueSubs.length > 0;

                  // Heavy bill day check: 2 or more subs OR total daily bill exceeds 100
                  const totalDailyCost = dueSubs.reduce((sum, s) => sum + s.amount, 0);
                  const isHeavyBillDay = dueSubs.length >= 2 || totalDailyCost >= 100;

                  return (
                    <button 
                      key={idx} 
                      onClick={() => setSelectedDay(day)}
                      className={`
                        h-14 rounded-xl flex flex-col justify-between p-1.5 border relative group/cell transition-all text-left cursor-pointer
                        ${isSelected 
                          ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-500 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20' 
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'}
                        ${isToday ? 'border-amber-400 dark:border-amber-500' : ''}
                        ${isHeavyBillDay && hasDue ? 'border-red-500/30 bg-red-50/20 dark:bg-red-950/5' : ''}
                      `}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className={`text-[10px] font-mono font-bold ${isToday ? 'text-amber-500' : isSelected ? 'text-blue-500' : 'text-slate-450'}`}>{day}</span>
                        {isToday && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Today"></span>}
                      </div>
                      
                      {hasDue && (
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-[7px] sm:text-[8px] font-mono font-bold px-1 py-0.2 rounded ${isHeavyBillDay ? 'bg-red-150 text-red-600 dark:bg-red-950/40 dark:text-red-400 animate-pulse' : 'bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400'}`}>
                            <span className="inline sm:hidden">{dueSubs.length}</span>
                            <span className="hidden sm:inline">{dueSubs.length} bill{dueSubs.length > 1 ? 's' : ''}</span>
                          </span>
                          {isHeavyBillDay && <AlertCircle className="w-3 h-3 text-red-500 shrink-0" title="Heavy Bill Day Indicator" />}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected day focused node information */}
            {selectedDay && (
              <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span>Focus Day Ledger · {months[currentCalendarMonth]} {selectedDay}, {currentCalendarYear}</span>
                  </h4>
                  {getSubsDueOnDay(selectedDay).length > 0 && (
                    <span className="text-[10px] font-mono font-bold text-red-500">
                      Total Bills: {formatCurrency(getSubsDueOnDay(selectedDay).reduce((sum, s) => sum + s.amount, 0))}
                    </span>
                  )}
                </div>
                
                {(() => {
                  const daySubs = getSubsDueOnDay(selectedDay);
                  if (daySubs.length === 0) {
                    return <p className="text-xs text-slate-400 italic">Clear sky day. No subscription bills scheduled to draw liquidity on this date.</p>;
                  }
                  return (
                    <div className="space-y-2">
                      {daySubs.map((s, idx) => {
                        const isCancelled = s.status === 'cancelled';
                        return (
                          <div key={idx} className="flex justify-between items-center p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{s.name}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full uppercase tracking-wider bg-slate-100 dark:bg-slate-850 text-slate-400 font-bold">{s.billingCycle}</span>
                            </div>
                            <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">{formatCurrency(s.amount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

          </div>

          {/* Column 2: Subscription Renewal Timeline Sidebar */}
          <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800/80 lg:pl-6 space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">Renewals Timeline</h3>
              <p className="text-[10px] text-slate-400">Chronological pipeline of upcoming active SaaS billings.</p>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {activeSubs
                .map(sub => {
                  const daysLeft = Math.ceil((new Date(sub.nextBillingDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                  return { ...sub, daysLeft };
                })
                .sort((a, b) => {
                  // Keep positive days first, sorted ascending
                  if (a.daysLeft >= 0 && b.daysLeft < 0) return -1;
                  if (a.daysLeft < 0 && b.daysLeft >= 0) return 1;
                  return a.daysLeft - b.daysLeft;
                })
                .slice(0, 5)
                .map((sub, idx) => {
                  const isSoon = sub.daysLeft >= 0 && sub.daysLeft <= 5;
                  return (
                    <div 
                      key={sub.id} 
                      className={`p-3 rounded-2xl border transition-all relative overflow-hidden ${
                        isSoon 
                          ? 'border-red-500/20 bg-red-50/10 dark:bg-red-950/5' 
                          : 'border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-950/20'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="truncate pr-2">
                          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 block truncate">{sub.name}</span>
                          <span className="text-[9px] font-semibold text-slate-400 capitalize">{sub.billingCycle} cycle</span>
                        </div>
                        <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">{formatCurrency(sub.amount)}</span>
                      </div>

                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-150 dark:border-slate-850">
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Due {sub.nextBillingDate}</span>
                        </div>

                        {sub.daysLeft < 0 ? (
                          <span className="text-[10px] font-extrabold text-slate-400">Drafted</span>
                        ) : sub.daysLeft === 0 ? (
                          <span className="text-[10px] font-extrabold text-red-500 animate-pulse">DUE TODAY</span>
                        ) : (
                          <span className={`text-[10px] font-extrabold ${isSoon ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                            {sub.daysLeft} day{sub.daysLeft > 1 ? 's' : ''} left
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              {activeSubs.length === 0 && (
                <p className="text-xs text-slate-400 italic py-6 text-center">No active automated subscriptions registered.</p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Filters & Grid representation */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 p-6 shadow-sm space-y-6">
        
        {/* Sub Header Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subscriptions by provider name..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
            {(['all', 'active', 'cancelled'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setStatusFilter(mode)}
                className={`
                  px-3 py-1 text-xs font-bold capitalize transition-all
                  ${statusFilter === mode 
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-950'}
                `}
              >
                {mode === 'all' ? 'All Contracts' : mode}
              </button>
            ))}
          </div>
        </div>

        {/* Subscription cards list */}
        {filteredSubs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSubs.map((sub) => {
              const daysLeft = Math.ceil((new Date(sub.nextBillingDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
              const isCancelled = sub.status === 'cancelled';

              return (
                <div 
                  key={sub.id} 
                  className={`
                    p-5 rounded-3xl border flex items-start gap-4 justify-between transition-all relative overflow-hidden
                    ${isCancelled 
                      ? 'border-slate-200 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-950/20 opacity-60' 
                      : 'border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md'}
                  `}
                >
                  <div className="flex items-start gap-4">
                    {/* Visual icon box */}
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${isCancelled ? 'bg-slate-200 text-slate-400' : 'bg-purple-500/10 text-purple-500'}`}>
                      <Calendar className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{sub.name}</h4>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${isCancelled ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20'}`}>
                          {sub.status}
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {sub.billingCycle} Cycle | Next renewal: {sub.nextBillingDate}
                      </p>

                      {sub.notes && (
                        <p className="text-xs text-slate-500 mt-2 italic">"{sub.notes}"</p>
                      )}

                      {!isCancelled && daysLeft >= 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-500 uppercase mt-3 tracking-wider">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Renewal triggers in {daysLeft} days</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Panel */}
                  <div className="text-right flex flex-col justify-between h-full space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(sub.amount)}</h3>
                      <span className="text-[10px] text-slate-400 capitalize">{sub.billingCycle}</span>
                    </div>

                    <div className="flex items-center justify-end gap-1">
                      {/* Toggle status: Cancel or Re-Activate */}
                      <button
                        onClick={() => handleToggleStatus(sub)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${isCancelled ? 'text-emerald-500 hover:bg-emerald-50 border-emerald-500/20' : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border-slate-200 dark:border-slate-800'}`}
                        title={isCancelled ? 'Activate Subscription' : 'Cancel Subscription'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Sub details */}
                      <button
                        onClick={() => openEditModal(sub)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                        title="Edit schedule"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete node completely */}
                      <button
                        onClick={() => setDeleteTarget({ type: 'subscription', id: sub.id })}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-550/10 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                        title="Delete registry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-12 h-12 stroke-1 text-slate-200 mb-2.5 mx-auto" />
            <span className="text-sm">No recurring schedules found matching selected parameters.</span>
          </div>
        )}

      </div>

      {/* CREATE / EDIT SUBSCRIPTION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span>{editingSub ? 'Modify Subscription' : 'Register Subscription'}</span>
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              
              {/* Name input */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">SaaS provider name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Netflix, Github Copilot, AWS..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Amount & Renewal Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Billing Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Renewal Date</label>
                  <input
                    type="date"
                    required
                    value={nextBillingDate}
                    onChange={(e) => setNextBillingDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Category mapping</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {categories.filter(c => c.type === 'expense').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Cycle frequency */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Cycle frequency</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['monthly', 'yearly', 'custom'] as const).map(cycle => (
                    <button
                      key={cycle}
                      type="button"
                      onClick={() => setBillingCycle(cycle)}
                      className={`
                        py-2 rounded-xl text-[10px] font-bold capitalize border transition-all
                        ${billingCycle === cycle 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/15' 
                          : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-slate-50'}
                      `}
                    >
                      {cycle}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Administrative Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 4K Family plan, work expense..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Renewal reminder */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Renewal alarm alert before billing</span>
                <input
                  type="checkbox"
                  checked={renewalReminderEnabled}
                  onChange={(e) => setRenewalReminderEnabled(e.target.checked)}
                  className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500/20"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/15 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                <span>{editingSub ? 'Save Subscription' : 'Register Subscription'}</span>
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
                Are you sure you want to permanently delete this subscription registry? This action cannot be undone.
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
                    onDeleteSubscription(deleteTarget.id);
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
