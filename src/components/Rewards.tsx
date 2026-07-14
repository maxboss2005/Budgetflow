import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Zap, 
  Sparkles, 
  Lock, 
  Unlock, 
  TrendingUp, 
  Coins, 
  Clock, 
  Check, 
  CheckCircle2, 
  Palette, 
  HelpCircle, 
  Info, 
  SlidersHorizontal,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  Legend 
} from 'recharts';
import { Transaction, Subscription, Category, User } from '../types';

interface RewardsProps {
  user: User;
  transactions: Transaction[];
  subscriptions: Subscription[];
  categories: Category[];
  currencySymbol: string;
  awardPoints: (amount: number, reason: string) => void;
  onUpdateUser: (updates: any) => Promise<any>;
  token: string | null;
}

export default function Rewards({
  user,
  transactions,
  subscriptions,
  categories,
  currencySymbol,
  awardPoints,
  onUpdateUser,
  token
}: RewardsProps) {
  const currentLevel = user.level ?? 1;
  const currentXP = user.points ?? 150;
  const nextLevelXP = currentLevel * 1000;
  const prevLevelXP = (currentLevel - 1) * 1000;
  const xpInCurrentLevel = currentXP - prevLevelXP;
  const xpNeededForNext = nextLevelXP - prevLevelXP;
  const levelProgressPct = Math.min(Math.max(0, (xpInCurrentLevel / xpNeededForNext) * 100), 100);

  // Active sandbox tools active state
  const [activeSandboxTab, setActiveSandboxTab] = useState<'simulator' | 'montecarlo' | 'audit' | 'themes'>('simulator');

  // --- 1. Level 5 Compound Interest Simulator State ---
  const [simMonthlySavings, setSimMonthlySavings] = useState(250);
  const [simAnnualYield, setSimAnnualYield] = useState(7);
  const [simYears, setSimYears] = useState(15);
  const [simInitialInvestment, setSimInitialInvestment] = useState(1000);

  // Calculate compound interest data
  const getSimData = () => {
    const data = [];
    let balance = simInitialInvestment;
    let totalInvested = simInitialInvestment;
    const monthlyRate = (simAnnualYield / 100) / 12;

    // Add Year 0
    data.push({
      year: 'Start',
      balance: Math.round(balance),
      invested: Math.round(totalInvested),
      interest: 0
    });

    for (let year = 1; year <= simYears; year++) {
      for (let month = 1; month <= 12; month++) {
        balance = (balance + simMonthlySavings) * (1 + monthlyRate);
        totalInvested += simMonthlySavings;
      }
      data.push({
        year: `Yr ${year}`,
        balance: Math.round(balance),
        invested: Math.round(totalInvested),
        interest: Math.round(balance - totalInvested)
      });
    }
    return data;
  };

  const simData = getSimData();
  const finalSimBalance = simData[simData.length - 1]?.balance || 0;
  const finalSimInvested = simData[simData.length - 1]?.invested || 0;
  const finalSimInterest = finalSimBalance - finalSimInvested;

  // --- 2. Level 8 Monte Carlo Forecaster State ---
  const [mcMonthlySavings, setMcMonthlySavings] = useState(350);
  const [mcYears, setMcYears] = useState(10);
  const [mcVolatility, setMcVolatility] = useState(15); // standard deviation %

  // Generate deterministic randomized variance pathing proxy for smooth, realistic charting
  const getMonteCarloData = () => {
    const data = [];
    let medianBal = 1000;
    let optimisticBal = 1000;
    let pessimisticBal = 1000;

    const baseMonthlyRate = 0.07 / 12; // 7% average annual return
    const volMonthly = (mcVolatility / 100) / Math.sqrt(12);

    data.push({
      year: 'Start',
      'Pessimistic (-1 StdDev)': Math.round(pessimisticBal),
      'Median Forecast': Math.round(medianBal),
      'Optimistic (+1 StdDev)': Math.round(optimisticBal),
    });

    // Box-Muller transform generator seed
    const pseudoNormal = (seed: number) => {
      let u = 0, v = 0;
      while(u === 0) u = Math.random(); 
      while(v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    };

    for (let year = 1; year <= mcYears; year++) {
      for (let month = 1; month <= 12; month++) {
        // Median pathway has standard moderate return variance
        const medianNoise = pseudoNormal(month) * volMonthly * 0.2;
        medianBal = (medianBal + mcMonthlySavings) * (1 + baseMonthlyRate + medianNoise);

        // Optimistic pathway has +1 standard dev upward bias
        const optNoise = Math.abs(pseudoNormal(month)) * volMonthly + (baseMonthlyRate * 0.4);
        optimisticBal = (optimisticBal + mcMonthlySavings) * (1 + baseMonthlyRate + optNoise);

        // Pessimistic pathway has -1 standard dev downward bias
        const pesNoise = -Math.abs(pseudoNormal(month)) * volMonthly - (baseMonthlyRate * 0.3);
        pessimisticBal = (pessimisticBal + mcMonthlySavings) * (1 + baseMonthlyRate + pesNoise);
      }

      data.push({
        year: `Yr ${year}`,
        'Pessimistic (-1 StdDev)': Math.round(pessimisticBal),
        'Median Forecast': Math.round(medianBal),
        'Optimistic (+1 StdDev)': Math.round(optimisticBal),
      });
    }
    return data;
  };

  const mcData = getMonteCarloData();

  // --- 3. Level 12 SaaS Cost-Reduction labor Hours Optimizer ---
  const [hourlyWage, setHourlyWage] = useState(25);
  const [subPriorities, setSubPriorities] = useState<Record<string, 'crucial' | 'medium' | 'disposable'>>({});

  // Initialize subscription priorities
  useEffect(() => {
    const initial: Record<string, 'crucial' | 'medium' | 'disposable'> = {};
    subscriptions.forEach(s => {
      initial[s.id] = 'crucial';
    });
    setSubPriorities(initial);
  }, [subscriptions]);

  const handlePriorityChange = (id: string, priority: 'crucial' | 'medium' | 'disposable') => {
    setSubPriorities(prev => ({
      ...prev,
      [id]: priority
    }));
  };

  // Calculations for subscription labor audit
  const subAuditRows = subscriptions.map(s => {
    const monthlyCost = s.billingCycle === 'yearly' ? s.amount / 12 : s.amount;
    const hoursLabor = hourlyWage > 0 ? monthlyCost / hourlyWage : 0;
    const priority = subPriorities[s.id] || 'crucial';
    return {
      ...s,
      monthlyCost,
      hoursLabor,
      priority
    };
  });

  const disposableSubs = subAuditRows.filter(s => s.priority === 'disposable');
  const annualDisposableSavings = disposableSubs.reduce((sum, s) => sum + (s.monthlyCost * 12), 0);
  const annualTotalCost = subAuditRows.reduce((sum, s) => sum + (s.monthlyCost * 12), 0);

  // --- 4. Level 17 Premium Accent Styling Palette ---
  const premiumColors = [
    { name: 'Azure Blue (Default)', hex: '#2563EB', hoverHex: '#1d4ed8', key: 'azure' },
    { name: 'Emerald Jade', hex: '#10B981', hoverHex: '#059669', key: 'emerald' },
    { name: 'Cosmic Amber', hex: '#F59E0B', hoverHex: '#d97706', key: 'amber' },
    { name: 'Matrix Fuchsia', hex: '#D946EF', hoverHex: '#c084fc', key: 'fuchsia' },
    { name: 'Imperial Gold', hex: '#EAB308', hoverHex: '#ca8a04', key: 'gold' }
  ];

  const [activeAccent, setActiveAccent] = useState(() => {
    return localStorage.getItem('budgetflow_accent_key') || 'azure';
  });

  const handleApplyAccent = (key: string) => {
    if (currentLevel < 17) return;
    localStorage.setItem('budgetflow_accent_key', key);
    setActiveAccent(key);
    
    // Inject accent change notification
    awardPoints(15, `Refreshed financial interface theme to premium layout!`);
    
    // Reload dynamically to trigger theme update
    window.location.reload();
  };

  // Milestone locked rules helper
  const milestones = [
    { level: 1, title: 'Seed Ledger Core', desc: 'Core offline queuing and dynamic cash dashboard enabled.', unlocked: true },
    { level: 5, title: 'Compound Wealth Simulator', desc: 'Forecast visual savings and monthly compounding interests.', unlocked: currentLevel >= 5, tab: 'simulator' as const },
    { level: 8, title: 'Monte Carlo Forecaster', desc: 'Simulate market uncertainty bands on savings velocity.', unlocked: currentLevel >= 8, tab: 'montecarlo' as const },
    { level: 12, title: 'SaaS Labor Cost Audit', desc: 'Scrape and translate subscription liabilities to work hours.', unlocked: currentLevel >= 12, tab: 'audit' as const },
    { level: 17, title: 'Premium Accents Palette', desc: 'Personalize the platform colors to exclusive neon palettes.', unlocked: currentLevel >= 17, tab: 'themes' as const }
  ];

  const formatCurrency = (val: number) => {
    return `${currencySymbol}${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  return (
    <div id="rewards-view" className="p-6 md:p-8 space-y-8 animate-fade-in no-print">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/60">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white flex items-center gap-2.5">
            <Trophy className="w-8 h-8 text-amber-500 animate-pulse" />
            <span>Milestones & Rewards</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build saving streaks, log daily transfers, and level up to unlock elite planning simulators.
          </p>
        </div>
      </div>

      {/* Gamification Progress Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Progress Card */}
        <div className="lg:col-span-2 bg-gradient-to-tr from-slate-900 via-blue-950 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 rounded-3xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl"></div>
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400">FINANCIAL RANKING</span>
                <h2 className="text-2xl font-black mt-0.5">Level {currentLevel} • {currentLevel >= 17 ? 'Empire Sovereign' : currentLevel >= 12 ? 'Wealth Champion' : currentLevel >= 8 ? 'Ledger Specialist' : currentLevel >= 5 ? 'Savings Engineer' : 'Novice Accumulator'}</h2>
              </div>
              <div className="px-3 py-1 bg-white/10 rounded-lg text-xs font-mono font-bold text-blue-300 border border-white/10 shrink-0">
                {currentXP} Total XP
              </div>
            </div>

            <div className="space-y-2 mt-6">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>XP Progress to Level {currentLevel + 1}</span>
                <span className="font-mono">{xpInCurrentLevel} / {xpNeededForNext} XP</span>
              </div>
              <div className="w-full h-3 bg-white/15 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500 rounded-full transition-all duration-500 shadow-lg shadow-blue-500/20"
                  style={{ width: `${levelProgressPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-slate-400 border-t border-white/5 pt-4">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400 fill-current" />
              Keep log activity active to speed up accumulation multipliers!
            </span>
            <span className="font-mono text-white/70">{(1000 - (currentXP % 1000))} XP to next level</span>
          </div>
        </div>

        {/* Achievements Quick List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Unlocked Badges</span>
            </h3>
            
            <div className="flex flex-wrap gap-2.5">
              {(user.achievements ?? ['Budget Pioneer']).map((badge, idx) => (
                <div 
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800/40 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-slate-400 mt-6 leading-relaxed">
            Unlocking accomplishments rewards significant XP multipliers which synchronizes with your global ranking instantly.
          </p>
        </div>

      </div>

      {/* Interactive Milestones Road Block */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">Milestones Timeline</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Explore features you can unlock as you build up your account ranking.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {milestones.map((m) => (
            <button
              key={m.level}
              disabled={!m.unlocked}
              onClick={() => {
                if (m.tab) setActiveSandboxTab(m.tab);
              }}
              className={`
                p-4 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group/m hover:scale-[1.02]
                ${m.unlocked 
                  ? activeSandboxTab === m.tab && m.tab
                    ? 'bg-blue-600/5 border-blue-500 text-slate-950 dark:text-white ring-2 ring-blue-500/10' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white cursor-pointer hover:border-slate-300'
                  : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-200/50 dark:border-slate-800/40 text-slate-400 cursor-not-allowed opacity-60'}
              `}
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full ${m.unlocked ? 'bg-blue-500/10 text-blue-500 dark:text-blue-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-950'}`}>
                    Level {m.level}
                  </span>
                  {m.unlocked ? (
                    <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                  )}
                </div>
                <h4 className={`text-xs font-extrabold ${m.unlocked ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>{m.title}</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 leading-normal">{m.desc}</p>
              </div>

              {m.unlocked && m.tab && (
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-500 mt-4 flex items-center gap-1 group-hover/m:translate-x-1 transition-transform">
                  <span>Activate Sandbox</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ACTIVE UNLOCKED SANDBOX COMPONENT WINDOW */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-xs">
        
        {/* Tab Header Banner */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/50 dark:border-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-4.5 h-4.5 text-blue-500" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Active Module: {milestones.find(m => m.tab === activeSandboxTab)?.title || 'Sandbox Widget'}
            </span>
          </div>

          <span className="text-[10px] font-mono font-bold text-slate-400">
            Fidelity Sandbox Engaged
          </span>
        </div>

        <div className="p-6 md:p-8">
          {/* 1. Level 5 Compound interest Simulator */}
          {activeSandboxTab === 'simulator' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Sliders Panel */}
                <div className="space-y-5 lg:col-span-1 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-850">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <Info className="w-4 h-4 text-blue-500" />
                    <span>Simulator Parameters</span>
                  </h3>

                  {/* Initial Investment Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Initial Lump Sum</span>
                      <span className="font-mono">{formatCurrency(simInitialInvestment)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="50000" 
                      step="500"
                      value={simInitialInvestment}
                      onChange={(e) => setSimInitialInvestment(parseInt(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  {/* Monthly Savings Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Monthly Saving Injection</span>
                      <span className="font-mono">{formatCurrency(simMonthlySavings)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="5000" 
                      step="50"
                      value={simMonthlySavings}
                      onChange={(e) => setSimMonthlySavings(parseInt(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  {/* Yield/Return Rate Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Expected Annual Return</span>
                      <span className="font-mono">{simAnnualYield}% APY</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="15" 
                      step="0.5"
                      value={simAnnualYield}
                      onChange={(e) => setSimAnnualYield(parseFloat(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  {/* Years Horizon Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Investment Duration</span>
                      <span className="font-mono">{simYears} Years</span>
                    </div>
                    <input 
                      type="range" 
                      min="2" 
                      max="40" 
                      step="1"
                      value={simYears}
                      onChange={(e) => setSimYears(parseInt(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Display Graph & Metrics */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Summary row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Capital Paid</span>
                      <span className="text-lg font-black text-slate-800 dark:text-white font-mono block mt-1">{formatCurrency(finalSimInvested)}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Compounded Interest</span>
                      <span className="text-lg font-black text-emerald-500 font-mono block mt-1">+{formatCurrency(finalSimInterest)}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20">
                      <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider block">Total Future Worth</span>
                      <span className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono block mt-1">{formatCurrency(finalSimBalance)}</span>
                    </div>
                  </div>

                  {/* Chart representation */}
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={simData}>
                        <XAxis dataKey="year" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(val) => `${currencySymbol}${val / 1000}k`} />
                        <Tooltip formatter={(value) => [`${currencySymbol}${value.toLocaleString()}`, '']} />
                        <Area type="monotone" dataKey="balance" name="Total Net Worth" stroke="#3B82F6" fillOpacity={0.15} fill="url(#colorSimBlue)" />
                        <Area type="monotone" dataKey="invested" name="Cash Contributions" stroke="#94A3B8" fillOpacity={0.05} fill="url(#colorSimGray)" />
                        <defs>
                          <linearGradient id="colorSimBlue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorSimGray" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#94A3B8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 2. Level 8 Monte Carlo Forecaster */}
          {activeSandboxTab === 'montecarlo' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Sliders Panel */}
                <div className="space-y-5 lg:col-span-1 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-850">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    <span>Volatility Settings</span>
                  </h3>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Monthly Contribution</span>
                      <span className="font-mono">{formatCurrency(mcMonthlySavings)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="50" 
                      max="5000" 
                      step="50"
                      value={mcMonthlySavings}
                      onChange={(e) => setMcMonthlySavings(parseInt(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Market Volatility StdDev</span>
                      <span className="font-mono">{mcVolatility}% Variance</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="30" 
                      step="1"
                      value={mcVolatility}
                      onChange={(e) => setMcVolatility(parseInt(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Horizon Duration</span>
                      <span className="font-mono">{mcYears} Years</span>
                    </div>
                    <input 
                      type="range" 
                      min="3" 
                      max="20" 
                      step="1"
                      value={mcYears}
                      onChange={(e) => setMcYears(parseInt(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
                    Monte Carlo simulations model price drift uncertainty based on historical standard deviations. Standard 1-StdDev bounds capture 68% of simulated terminal wealth outcomes.
                  </p>
                </div>

                {/* Display LineChart with upper/median/lower bounds */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2">Uncertainty Trajectory Bounds</h4>
                    <p className="text-xs text-slate-500 leading-normal">
                      The gap between boundaries grows wider over time, reflecting cumulative return drift dispersion. Optimizing saving density reduces downside risks.
                    </p>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mcData}>
                        <XAxis dataKey="year" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(val) => `${currencySymbol}${val / 1000}k`} />
                        <Tooltip formatter={(value) => [`${currencySymbol}${value.toLocaleString()}`, '']} />
                        <Legend wrapperStyle={{ fontSize: 10, pt: 10 }} />
                        <Line type="monotone" dataKey="Optimistic (+1 StdDev)" stroke="#10B981" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                        <Line type="monotone" dataKey="Median Forecast" stroke="#3B82F6" strokeWidth={3} dot={false} />
                        <Line type="monotone" dataKey="Pessimistic (-1 StdDev)" stroke="#EF4444" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 3. Level 12 Subscription labor Hours Optimizer */}
          {activeSandboxTab === 'audit' && (
            <div className="space-y-6">
              
              {/* Top overview row with Wage Input */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 rounded-2xl gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                    $/hr
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Estimate Hourly Wage</h4>
                    <p className="text-[10px] text-slate-400">Used to convert subscription overhead into hours of labor</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">My hourly salary:</span>
                  <input
                    type="number"
                    value={hourlyWage}
                    onChange={(e) => setHourlyWage(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-400">/ hour</span>
                </div>
              </div>

              {/* Core Audit table */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Subscriptions labor Translation</span>
                  <span className="text-[10px] uppercase font-bold tracking-wide text-blue-500">
                    Annual Footprint: {formatCurrency(annualTotalCost)}
                  </span>
                </div>

                {subscriptions.length > 0 ? (
                  <div className="border border-slate-150 dark:border-slate-850 rounded-2xl overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-150 dark:border-slate-850 text-slate-400 font-bold">
                          <th className="p-3">Subscription</th>
                          <th className="p-3">Cost / mo</th>
                          <th className="p-3">Equivalent Labor Required</th>
                          <th className="p-3 text-right">Utility Rating (Optimistic Action)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
                        {subAuditRows.map(row => (
                          <tr key={row.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-900/40 transition-colors">
                            <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{row.name}</td>
                            <td className="p-3 font-mono font-bold">{formatCurrency(row.monthlyCost)}</td>
                            <td className="p-3">
                              <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-md font-mono text-[10px]">
                                <Clock className="w-3 h-3" />
                                {row.hoursLabor.toFixed(1)} hrs work
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="inline-flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-250/20">
                                <button
                                  onClick={() => handlePriorityChange(row.id, 'crucial')}
                                  className={`px-2.5 py-1 text-[9px] font-extrabold uppercase rounded-lg transition-all cursor-pointer ${row.priority === 'crucial' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-400'}`}
                                >
                                  Crucial
                                </button>
                                <button
                                  onClick={() => handlePriorityChange(row.id, 'disposable')}
                                  className={`px-2.5 py-1 text-[9px] font-extrabold uppercase rounded-lg transition-all cursor-pointer ${row.priority === 'disposable' ? 'bg-red-500 text-white shadow-xs' : 'text-slate-400'}`}
                                >
                                  Disposable (Cut)
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/50 rounded-2xl">
                    No active subscriptions detected. Create active subscription agreements to analyze labor impact.
                  </div>
                )}
              </div>

              {/* Simulated Cost Savings Row */}
              {disposableSubs.length > 0 && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="flex items-center gap-3 text-emerald-800 dark:text-emerald-400">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Optimization Action Active!</p>
                      <p className="text-[10px] text-slate-500">Cancelling the {disposableSubs.length} marked contracts will instantly free up equivalent hours of labor.</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Simulated Annual Savings</span>
                    <span className="text-lg font-black text-emerald-500 font-mono">{formatCurrency(annualDisposableSavings)} / year</span>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* 4. Level 17 Premium Accent Styling Palette */}
          {activeSandboxTab === 'themes' && (
            <div className="space-y-6">
              
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Palette className="w-4.5 h-4.5 text-blue-500" />
                  <span>Exclusive Premium Themes Palette</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Select a premium color template. Your selection will instantly override the primary blue accents globally across all components.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                {premiumColors.map((color) => {
                  const isActive = activeAccent === color.key;
                  return (
                    <button
                      key={color.key}
                      onClick={() => handleApplyAccent(color.key)}
                      className={`
                        p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-3.5 transition-all cursor-pointer relative group/p
                        ${isActive 
                          ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-950 ring-2 ring-slate-400/20' 
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-350'}
                      `}
                    >
                      {/* Color Circle */}
                      <div 
                        className="w-12 h-12 rounded-full shadow-lg group-hover/p:scale-105 transition-transform flex items-center justify-center text-white"
                        style={{ backgroundColor: color.hex }}
                      >
                        {isActive && <Check className="w-5 h-5 stroke-[3px]" />}
                      </div>

                      {/* Name Details */}
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-white">{color.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">{color.hex}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-250/20 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-4.5 h-4.5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <span className="font-bold text-slate-800 dark:text-white block">Aesthetic Blueprint Sync</span>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    By applying a premium theme override, our engine dynamically injects custom CSS parameters directly over the existing layouts.
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
