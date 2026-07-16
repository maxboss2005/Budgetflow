import React, { useState, useEffect, useMemo } from 'react';
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
  AlertCircle,
  Flame,
  Target,
  Award,
  Activity,
  X,
  Smartphone,
  Download,
  Share,
  CalendarDays,
  Percent,
  Compass,
  ArrowUpRight
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
import { Transaction, Subscription, Category, User, Budget, SavingsGoal } from '../types';

interface RewardsProps {
  user: User;
  transactions: Transaction[];
  subscriptions: Subscription[];
  categories: Category[];
  budgets: Budget[];
  goals: SavingsGoal[];
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
  budgets,
  goals,
  currencySymbol,
  awardPoints,
  onUpdateUser,
  token
}: RewardsProps) {
  // Navigation tabs for the rewards view
  const [activeRewardsTab, setActiveRewardsTab] = useState<'hub' | 'badges' | 'sandbox'>('hub');

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
    awardPoints(15, `Refreshed financial interface theme to premium layout!`);
    window.location.reload();
  };

  // --- GAMIFICATION ADDITIONS: MONTHLY FINANCIAL SCORE ---
  const financialScoreMetrics = useMemo(() => {
    // 1. Savings Rate Score (Max 30)
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    let savingsScore = 15; // default moderate score if no records
    if (totalIncome > 0) {
      if (savingsRate >= 30) savingsScore = 30;
      else if (savingsRate >= 15) savingsScore = 25;
      else if (savingsRate >= 5) savingsScore = 18;
      else if (savingsRate >= 0) savingsScore = 10;
      else savingsScore = 5;
    }

    // 2. Budget Compliance Score (Max 30)
    let budgetScore = 15; // default starter score
    let activeBudgets = budgets.length;
    let nonExceededBudgets = 0;
    if (activeBudgets > 0) {
      budgets.forEach(b => {
        // Find total expenses in this budget's category
        const spent = transactions
          .filter(t => t.type === 'expense' && (b.categoryId === 'all' || t.categoryId === b.categoryId))
          .reduce((sum, t) => sum + t.amount, 0);
        if (spent <= b.amount) {
          nonExceededBudgets++;
        }
      });
      budgetScore = Math.round((nonExceededBudgets / activeBudgets) * 30);
    }

    // 3. Log Consistency (Max 20)
    // Count unique days with transactions in the last 30 days
    const uniqueDaysSet = new Set<string>();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    transactions.forEach(t => {
      if (t.date >= thirtyDaysAgoStr) {
        uniqueDaysSet.add(t.date);
      }
    });

    let logScore = 5;
    if (uniqueDaysSet.size >= 8) logScore = 20;
    else if (uniqueDaysSet.size >= 4) logScore = 15;
    else if (uniqueDaysSet.size >= 1) logScore = 10;

    // 4. Subscription Ratio (Max 20)
    let subScore = 20;
    if (totalIncome > 0) {
      const totalSubMonthly = subscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + (s.billingCycle === 'yearly' ? s.amount / 12 : s.amount), 0);
      const subRatio = (totalSubMonthly / totalIncome) * 100;

      if (subRatio < 5) subScore = 20;
      else if (subRatio < 12) subScore = 15;
      else if (subRatio < 25) subScore = 10;
      else subScore = 5;
    } else if (subscriptions.length > 0) {
      subScore = 10;
    }

    const totalScore = Math.min(100, Math.max(20, savingsScore + budgetScore + logScore + subScore));

    return {
      totalScore,
      savingsScore,
      savingsRate,
      budgetScore,
      activeBudgets,
      nonExceededBudgets,
      logScore,
      loggedDaysCount: uniqueDaysSet.size,
      subScore
    };
  }, [transactions, budgets, subscriptions]);

  // --- SAVINGS STREAK CALCULATION ---
  const [dailySpendingThreshold, setDailySpendingThreshold] = useState(() => {
    const saved = localStorage.getItem('devfint_spending_threshold');
    return saved ? parseFloat(saved) : 75;
  });

  const handleUpdateThreshold = (val: number) => {
    setDailySpendingThreshold(val);
    localStorage.setItem('devfint_spending_threshold', val.toString());
  };

  const streakDaysData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i)); // Index 6 is today, 0 is 6 days ago
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString(undefined, { weekday: 'short' });
      
      const dailyExpenses = transactions
        .filter(t => t.type === 'expense' && t.date === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);

      // Passed if daily expenses stay under the self-selected threshold
      const passed = dailyExpenses <= dailySpendingThreshold;
      const isToday = i === 6;

      return { dateStr, dayLabel, dailyExpenses, passed, isToday };
    });
  }, [transactions, dailySpendingThreshold]);

  const activeSavingsStreak = useMemo(() => {
    let calculatedStreak = 0;
    // Iterate backwards from today (Index 6)
    for (let i = 6; i >= 0; i--) {
      if (streakDaysData[i].passed) {
        calculatedStreak++;
      } else {
        break;
      }
    }
    return calculatedStreak;
  }, [streakDaysData]);

  // --- WEEKLY CHALLENGES SYSTEM ---
  const weeklyChallenges = useMemo(() => {
    // Current Week Range (Sunday to Saturday)
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);
    startOfWeek.setHours(0,0,0,0);

    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

    // Challenge 1: The Ledger Sentinel (Log 3 transactions this week)
    const weeklyTxCount = transactions.filter(t => t.date >= startOfWeekStr).length;
    const ch1Completed = weeklyTxCount >= 3;

    // Challenge 2: The Vault Builder (Accumulate at least $50 in savings goals)
    const totalSavingsDeposited = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const ch2Completed = totalSavingsDeposited >= 50;

    // Challenge 3: Budget Guardian (Zero overruns on active budgets)
    const overruns = budgets.some(b => {
      const spent = transactions
        .filter(t => t.type === 'expense' && (b.categoryId === 'all' || t.categoryId === b.categoryId))
        .reduce((sum, s) => sum + s.amount, 0);
      return spent > b.amount;
    });
    const ch3Completed = budgets.length > 0 && !overruns;

    // Challenge 4: Disposable Subscription Hunt (Flag at least 1 sub as Disposable)
    const hasDisposable = Object.values(subPriorities).includes('disposable');
    const ch4Completed = hasDisposable;

    return [
      {
        id: 'challenge_ledger_sentinel',
        title: 'Ledger Sentinel',
        desc: 'Log at least 3 financial transactions in the current weekly ledger cycle.',
        progressText: `${Math.min(3, weeklyTxCount)} / 3 logged`,
        pct: Math.min(100, (weeklyTxCount / 3) * 100),
        xpReward: 150,
        isCompleted: ch1Completed
      },
      {
        id: 'challenge_vault_builder',
        title: 'Fortune Builder',
        desc: 'Fund savings goals with a combined cumulative balance of $50 or more.',
        progressText: `${currencySymbol}${totalSavingsDeposited} / ${currencySymbol}50`,
        pct: Math.min(100, (totalSavingsDeposited / 50) * 100),
        xpReward: 200,
        isCompleted: ch2Completed
      },
      {
        id: 'challenge_budget_guardian',
        title: 'Budget Guardian',
        desc: 'Maintain all active category budget limits with absolutely zero budget overruns.',
        progressText: budgets.length > 0 ? (overruns ? 'Limit exceeded' : 'Shields active (100%)') : 'No active budgets established',
        pct: budgets.length > 0 && !overruns ? 100 : 0,
        xpReward: 250,
        isCompleted: ch3Completed
      },
      {
        id: 'challenge_subscription_audit',
        title: 'Optimization Architect',
        desc: 'Engage SaaS labor hours audit to mark at least 1 subscription as "Disposable".',
        progressText: hasDisposable ? 'Identified (100%)' : '0 / 1 identified',
        pct: hasDisposable ? 100 : 0,
        xpReward: 150,
        isCompleted: ch4Completed
      }
    ];
  }, [transactions, goals, budgets, subPriorities, currencySymbol]);

  const [claimedChallenges, setClaimedChallenges] = useState<string[]>(() => {
    const saved = localStorage.getItem('devfint_claimed_challenges');
    return saved ? JSON.parse(saved) : [];
  });

  const handleClaimChallenge = (id: string, xpReward: number, title: string) => {
    if (claimedChallenges.includes(id)) return;
    const updated = [...claimedChallenges, id];
    setClaimedChallenges(updated);
    localStorage.setItem('devfint_claimed_challenges', JSON.stringify(updated));
    awardPoints(xpReward, `Completed weekly challenge: ${title}! 🏆`);
  };

  // --- ACHIEVEMENT BADGES LIST ---
  const allBadges = useMemo(() => {
    const userAchievements = user.achievements ?? ['Budget Pioneer'];

    // Define badge items dynamically matching actual transaction states
    const badgesDef = [
      {
        id: 'Budget Pioneer',
        title: 'Ledger Pioneer',
        desc: 'Logged your very first transaction into the cloud asset registry.',
        condition: 'transactions.length > 0',
        color: 'from-blue-500 to-indigo-600',
        unlocked: transactions.length > 0 || userAchievements.includes('Budget Pioneer')
      },
      {
        id: 'Budget Sentinel',
        title: 'Budget Sentinel',
        desc: 'Configured at least 2 structured category spend limits.',
        condition: 'budgets.length >= 2',
        color: 'from-purple-500 to-violet-700',
        unlocked: budgets.length >= 2
      },
      {
        id: 'Dream Achiever',
        title: 'Dream Achiever',
        desc: 'Successfully funded any custom savings goal vault to 100% capacity.',
        condition: 'Any savings goal current amount >= target amount',
        color: 'from-emerald-400 to-teal-600',
        unlocked: goals.some(g => g.currentAmount >= g.targetAmount) || userAchievements.includes('Dream Achiever')
      },
      {
        id: 'SaaS Samurai',
        title: 'SaaS Samurai',
        desc: 'Marked a recurring contract as disposable to reclaim working hours.',
        condition: 'Mark at least 1 subscription as "Disposable" in the audit sandbox.',
        color: 'from-rose-500 to-pink-600',
        unlocked: Object.values(subPriorities).includes('disposable')
      },
      {
        id: 'Savings Hero',
        title: 'Compound Wizard',
        desc: 'Unlocked and explored the compound interest wealth simulator at Level 5.',
        condition: 'Reach Level 5 or engage in the simulator tool.',
        color: 'from-amber-500 to-orange-600',
        unlocked: currentLevel >= 5 || userAchievements.includes('Savings Hero')
      },
      {
        id: 'Risk Modeler',
        title: 'Risk Modeler',
        desc: 'Unlocked the Level 8 Monte Carlo market forecaster to simulate uncertainty bounds.',
        condition: 'Reach Level 8 or run a probability model.',
        color: 'from-fuchsia-500 to-indigo-700',
        unlocked: currentLevel >= 8
      },
      {
        id: 'Cost Audit Specialist',
        title: 'Audit Specialist',
        desc: 'Unlocked the Level 12 Subscription working hours overhead optimizer.',
        condition: 'Reach Level 12 or configure subscription priorities.',
        color: 'from-sky-400 to-blue-600',
        unlocked: currentLevel >= 12
      },
      {
        id: 'Empire Sovereign',
        title: 'Empire Sovereign',
        desc: 'Reached Level 17, gaining absolute power to style the platform with neon themes.',
        condition: 'Reach Level 17.',
        color: 'from-yellow-400 to-amber-600',
        unlocked: currentLevel >= 17
      }
    ];

    return badgesDef;
  }, [user, transactions, budgets, goals, subPriorities, currentLevel]);

  // Synchronize dynamic badges with user profiles back to cloud firestore
  useEffect(() => {
    const unlockedBadgeIds = allBadges.filter(b => b.unlocked).map(b => b.id);
    const existingBadges = user.achievements ?? ['Budget Pioneer'];
    
    // Check if there is any badge that has been unlocked but is not in user achievements
    const needsUpdate = unlockedBadgeIds.some(id => !existingBadges.includes(id));
    if (needsUpdate) {
      const mergedBadges = Array.from(new Set([...existingBadges, ...unlockedBadgeIds]));
      onUpdateUser({ achievements: mergedBadges }).catch(e => console.warn('Could not update badges profile:', e));
    }
  }, [allBadges, user, onUpdateUser]);

  // Milestone locked rules helper for Sandbox tab
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

  // SVGs for Score Meter Gauge Arc
  const scoreRadius = 40;
  const strokeWidth = 7;
  const scoreCircumference = 2 * Math.PI * scoreRadius;
  const strokeDashoffset = scoreCircumference - (financialScoreMetrics.totalScore / 100) * scoreCircumference;

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
            Build saving streaks, master challenges, audit overheads, and unlock high-fidelity simulators.
          </p>
        </div>
      </div>

      {/* Dynamic Sub-tab Selector */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl max-w-xl border border-slate-250/20">
        <button
          onClick={() => setActiveRewardsTab('hub')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeRewardsTab === 'hub' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <Target className="w-4 h-4" />
          <span>Gamification Hub</span>
        </button>
        <button
          onClick={() => setActiveRewardsTab('badges')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeRewardsTab === 'badges' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <Award className="w-4 h-4" />
          <span>Badges & Levels</span>
        </button>
        <button
          onClick={() => setActiveRewardsTab('sandbox')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeRewardsTab === 'sandbox' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Premium Sandbox</span>
        </button>
      </div>

      {/* TAB 1: GAMIFICATION HUB */}
      {activeRewardsTab === 'hub' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Columns (Challenges and Streaks) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Weekly Challenges */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  <h2 className="font-extrabold text-base text-slate-900 dark:text-white">Active Weekly Challenges</h2>
                </div>
                <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-900/10 text-blue-600 px-2.5 py-0.5 rounded-full font-bold">
                  RESets Sunday
                </span>
              </div>

              <div className="space-y-4">
                {weeklyChallenges.map((ch) => {
                  const isClaimed = claimedChallenges.includes(ch.id);
                  return (
                    <div 
                      key={ch.id} 
                      className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${ch.isCompleted ? 'bg-emerald-50/20 dark:bg-emerald-950/5 border-emerald-500/20' : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-150 dark:border-slate-850/60'}`}
                    >
                      <div className="space-y-1.5 max-w-md">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${ch.isCompleted ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">{ch.title}</h4>
                          <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5 bg-amber-500/10 px-2 py-0.5 rounded-md">
                            <Zap className="w-3 h-3 fill-amber-500" />
                            <span>+{ch.xpReward} XP</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{ch.desc}</p>
                        
                        {/* Progress slider bar */}
                        <div className="space-y-1 pt-1.5">
                          <div className="flex justify-between text-[10px] font-mono text-slate-400">
                            <span>Completeness</span>
                            <span>{ch.progressText}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200/55 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${ch.isCompleted ? 'bg-emerald-500 shadow-sm shadow-emerald-500/20' : 'bg-blue-500'}`} 
                              style={{ width: `${ch.pct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isClaimed ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-white shadow-xs">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Claimed</span>
                          </div>
                        ) : ch.isCompleted ? (
                          <button
                            onClick={() => handleClaimChallenge(ch.id, ch.xpReward, ch.title)}
                            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95 animate-pulse"
                          >
                            <Trophy className="w-4 h-4 text-slate-950" />
                            <span>Claim XP</span>
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-200/30 dark:bg-slate-800/40 px-3 py-2 rounded-xl">
                            <Clock className="w-3.5 h-3.5" />
                            <span>In Progress</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Savings discipline streak */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-5 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
                  <div>
                    <h2 className="font-extrabold text-base text-slate-900 dark:text-white">Savings Discipline Streak</h2>
                    <p className="text-[11px] text-slate-400">Build streaks by keeping daily spending below your alert threshold.</p>
                  </div>
                </div>

                {/* Edit daily threshold input */}
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800/80 shrink-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Threshold:</span>
                  <input 
                    type="number"
                    value={dailySpendingThreshold}
                    onChange={(e) => handleUpdateThreshold(Math.max(1, parseFloat(e.target.value) || 0))}
                    className="w-14 bg-transparent font-mono text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-0 text-center"
                  />
                  <span className="text-[10px] text-slate-400">{currencySymbol}</span>
                </div>
              </div>

              {/* Streak info box */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white space-y-1 relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-15">
                    <Flame className="w-20 h-20 fill-white stroke-none" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-100 block">Active Streak</span>
                  <span className="text-3xl font-black font-mono block">{activeSavingsStreak} Days</span>
                  <span className="text-[10px] text-amber-50 mt-1 block">Consecutive days under threshold</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Next Milestone</span>
                  <span className="text-xl font-black text-slate-800 dark:text-white font-mono block">7-Day Streak</span>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div className="h-full bg-orange-500" style={{ width: `${Math.min(100, (activeSavingsStreak / 7) * 100)}%` }} />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Streak Reward</span>
                    <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 block mt-1">+500 XP Milestone Bonus</span>
                  </div>
                  <p className="text-[9px] text-slate-400">Unlock at level milestones</p>
                </div>
              </div>

              {/* Calendar list checkmarks */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">Discipline Audit Calendar (Last 7 Days)</span>
                <div className="grid grid-cols-7 gap-2.5">
                  {streakDaysData.map((day, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-2xl border text-center relative flex flex-col items-center justify-center gap-1.5 transition-all ${day.passed ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600' : 'bg-rose-500/5 border-rose-500/20 text-rose-500'}`}
                    >
                      <span className="text-[10px] font-bold uppercase block">{day.dayName}</span>
                      {day.passed ? (
                        <Check className="w-5 h-5 stroke-[3px]" />
                      ) : (
                        <span className="font-mono text-[9px] font-extrabold text-rose-500 block">Exceeded</span>
                      )}
                      <span className="text-[9px] font-mono text-slate-400 block">{formatCurrency(day.dailyExpenses)}</span>
                      {day.isToday && (
                        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase bg-blue-600 text-white tracking-widest">
                          Today
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column (Financial Score Gauge) */}
          <div className="space-y-8">
            
            {/* Monthly Financial Score Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
              <div className="text-center pb-2 border-b border-slate-100 dark:border-slate-800/60">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center justify-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500 animate-pulse" />
                  <span>Monthly Financial Score</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Real-time health indicator calculated dynamically</p>
              </div>

              {/* Score Arc SVGs */}
              <div className="flex flex-col items-center justify-center relative">
                <svg className="w-40 h-40 transform -rotate-90">
                  {/* Background Track */}
                  <circle
                    cx="80"
                    cy="80"
                    r={scoreRadius}
                    className="stroke-slate-100 dark:stroke-slate-800/60 fill-none"
                    strokeWidth={strokeWidth}
                  />
                  {/* Progress Indicator */}
                  <circle
                    cx="80"
                    cy="80"
                    r={scoreRadius}
                    className={`fill-none transition-all duration-700 ease-out ${financialScoreMetrics.totalScore >= 80 ? 'stroke-emerald-500' : financialScoreMetrics.totalScore >= 50 ? 'stroke-amber-500' : 'stroke-rose-500'}`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={scoreCircumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Score text absolute centered */}
                <div className="absolute text-center">
                  <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">
                    {financialScoreMetrics.totalScore}
                  </span>
                  <span className="text-xs text-slate-400 block font-bold mt-0.5">/ 100 Grade</span>
                </div>
              </div>

              {/* Score classification indicator */}
              <div className={`p-3.5 rounded-2xl border text-center font-bold text-xs ${financialScoreMetrics.totalScore >= 80 ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500/20 text-emerald-600' : financialScoreMetrics.totalScore >= 50 ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-500/20 text-amber-500' : 'bg-rose-50 dark:bg-rose-900/10 border-rose-500/20 text-rose-500'}`}>
                {financialScoreMetrics.totalScore >= 80 ? '👑 Outstanding Assets Health' : financialScoreMetrics.totalScore >= 50 ? '🌱 Moderate Financial Stability' : '⚠️ Critical Overhead Exposure'}
              </div>

              {/* Score break-down components */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">Score Breakdown</span>
                
                {/* 1. Savings Ratio */}
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span>Savings Rate ({Math.round(financialScoreMetrics.savingsRate)}%)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{financialScoreMetrics.savingsScore} / 30 pts</span>
                </div>

                {/* 2. Budget Discipline */}
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                    <span>Budget Compliance ({financialScoreMetrics.nonExceededBudgets} / {financialScoreMetrics.activeBudgets})</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{financialScoreMetrics.budgetScore} / 30 pts</span>
                </div>

                {/* 3. Log Consistency */}
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                    <span>Logging Density ({financialScoreMetrics.loggedDaysCount} / 30 days)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{financialScoreMetrics.logScore} / 20 pts</span>
                </div>

                {/* 4. Subscription Overhead */}
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                    <span>Subscription Overhead</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{financialScoreMetrics.subScore} / 20 pts</span>
                </div>
              </div>

              {/* Tips for improvement */}
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-1.5">
                <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 block">Score Improvement Recommendation</span>
                <p className="text-[11px] text-slate-500 leading-normal">
                  {financialScoreMetrics.totalScore >= 80 
                    ? 'Excellent job! Keep managing consistent entries and funding goals to retain empire elite ranks.' 
                    : 'To increase your score immediately: configure active budgets with zero overruns, and mark redundant subscriptions as Disposable in your labor hours auditor.'}
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: BADGES & LEVELS */}
      {activeRewardsTab === 'badges' && (
        <div className="space-y-8">
          
          {/* Level Progress Banner */}
          <div className="bg-gradient-to-tr from-slate-900 via-blue-950 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 rounded-3xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl"></div>
            
            <div className="space-y-3 flex-1">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400">FINANCIAL RANKING SUMMARY</span>
                <h2 className="text-2xl font-black mt-0.5">Level {currentLevel} • {currentLevel >= 17 ? 'Empire Sovereign 👑' : currentLevel >= 12 ? 'Wealth Champion 🏆' : currentLevel >= 8 ? 'Ledger Specialist ⚔️' : currentLevel >= 5 ? 'Savings Engineer 🛡️' : 'Novice Accumulator 🧭'}</h2>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Level progress to Level {currentLevel + 1}</span>
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

            <div className="flex flex-col bg-white/5 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/15 min-w-[200px] text-center shrink-0">
              <span className="text-xs text-slate-300">Total Accumulation</span>
              <span className="text-2xl font-black font-mono mt-0.5 text-blue-300">{currentXP} XP</span>
              <span className="text-[10px] text-slate-400 mt-1 font-mono">{nextLevelXP - currentXP} XP required to level up</span>
            </div>
          </div>

          {/* Achievement Badges Grid */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">Financial Achievement Badges</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Completing financial targets rewards prestigious permanent profile badges.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {allBadges.map((badge) => (
                <div 
                  key={badge.id}
                  className={`relative p-5 rounded-3xl border transition-all overflow-hidden flex flex-col justify-between group h-64 ${badge.unlocked ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md' : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-150 dark:border-slate-850/40 opacity-70'}`}
                >
                  {/* Subtle vector badge emblem backdrop */}
                  <div className={`absolute -right-4 -bottom-4 w-28 h-28 bg-gradient-to-br ${badge.unlocked ? badge.color : 'from-slate-300 to-slate-400'} opacity-10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500`}></div>

                  <div>
                    <div className="flex justify-between items-start mb-4">
                      {badge.unlocked ? (
                        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-r ${badge.color} text-white flex items-center justify-center shadow-md shadow-blue-500/10`}>
                          <Award className="w-6 h-6 animate-pulse" />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 flex items-center justify-center">
                          <Lock className="w-5 h-5" />
                        </div>
                      )}

                      {badge.unlocked ? (
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full">
                          Unlocked
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-200/50 dark:bg-slate-850 px-2.5 py-0.5 rounded-full">
                          Locked
                        </span>
                      )}
                    </div>

                    <h4 className={`text-sm font-extrabold ${badge.unlocked ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{badge.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{badge.desc}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">How to Unlock:</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">{badge.condition}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Level Progression Road Block */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">Account Progression Path</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Levels unlock core planning sandboxes and personalization options.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {milestones.map((m) => (
                <button
                  key={m.level}
                  disabled={!m.unlocked}
                  onClick={() => {
                    if (m.tab) {
                      setActiveSandboxTab(m.tab);
                      setActiveRewardsTab('sandbox');
                    }
                  }}
                  className={`
                    p-4 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group/m hover:scale-[1.02] h-40
                    ${m.unlocked 
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white cursor-pointer hover:border-slate-350'
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
                    <h4 className={`text-xs font-extrabold ${m.unlocked ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-650'}`}>{m.title}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 leading-normal">{m.desc}</p>
                  </div>

                  {m.unlocked && m.tab && (
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-500 mt-2 flex items-center gap-1 group-hover/m:translate-x-1 transition-transform">
                      <span>Launch Sandbox</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: ELITE SANDBOX */}
      {activeRewardsTab === 'sandbox' && (
        <div className="space-y-6">
          
          {/* Quick Sandbox Navigation row */}
          <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/60">
            <button
              onClick={() => setActiveSandboxTab('simulator')}
              disabled={currentLevel < 5}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${currentLevel < 5 ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' : activeSandboxTab === 'simulator' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
            >
              <span>Wealth Simulator</span>
              {currentLevel < 5 ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>
            <button
              onClick={() => setActiveSandboxTab('montecarlo')}
              disabled={currentLevel < 8}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${currentLevel < 8 ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' : activeSandboxTab === 'montecarlo' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
            >
              <span>Monte Carlo</span>
              {currentLevel < 8 ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>
            <button
              onClick={() => setActiveSandboxTab('audit')}
              disabled={currentLevel < 12}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${currentLevel < 12 ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' : activeSandboxTab === 'audit' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
            >
              <span>SaaS Hours Audit</span>
              {currentLevel < 12 ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>
            <button
              onClick={() => setActiveSandboxTab('themes')}
              disabled={currentLevel < 17}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${currentLevel < 17 ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' : activeSandboxTab === 'themes' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
            >
              <span>Premium Accents</span>
              {currentLevel < 17 ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-xs">
            
            {/* Tab Header Banner */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/50 dark:border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="w-4.5 h-4.5 text-blue-500" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Active Sandbox Widget: {milestones.find(m => m.tab === activeSandboxTab)?.title || 'Sandbox Tool'}
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
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate" title="Total Capital Paid">Total Capital Paid</span>
                          <span className="text-base font-black text-slate-800 dark:text-white font-mono block mt-1 truncate" title={formatCurrency(finalSimInvested)}>
                            {formatCurrency(finalSimInvested)}
                          </span>
                        </div>
                        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate" title="Compounded Interest">Compounded Interest</span>
                          <span className="text-base font-black text-emerald-500 font-mono block mt-1 truncate" title={`+${formatCurrency(finalSimInterest)}`}>
                            +{formatCurrency(finalSimInterest)}
                          </span>
                        </div>
                        <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 min-w-0">
                          <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider block truncate" title="Total Future Worth">Total Future Worth</span>
                          <span className="text-base font-black text-blue-600 dark:text-blue-400 font-mono block mt-1 truncate" title={formatCurrency(finalSimBalance)}>
                            {formatCurrency(finalSimBalance)}
                          </span>
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
                      <div className="border border-slate-150 dark:border-slate-850 rounded-2xl overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
                        <table className="w-full text-xs text-left min-w-[550px] sm:min-w-0">
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
                                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{row.name}</td>
                                <td className="p-3 font-mono font-bold whitespace-nowrap">{formatCurrency(row.monthlyCost)}</td>
                                <td className="p-3 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-md font-mono text-[10px]">
                                    <Clock className="w-3 h-3" />
                                    {row.hoursLabor.toFixed(1)} hrs work
                                  </span>
                                </td>
                                <td className="p-3 text-right whitespace-nowrap">
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
      )}

    </div>
  );
}
