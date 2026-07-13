import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  AlertTriangle, 
  Lightbulb, 
  TrendingUp, 
  Award, 
  RefreshCw, 
  ChevronRight, 
  CheckCircle2, 
  Cpu,
  HelpCircle,
  TrendingDown,
  Coins,
  ShieldCheck,
  Calendar,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Category, Transaction } from '../types';

interface InsightItem {
  type: 'warning' | 'tip' | 'milestone' | 'prediction';
  title: string;
  description: string;
}

interface InsightsData {
  summaryText: string;
  insights: InsightItem[];
  recommendations: string[];
}

interface InsightsProps {
  token: string | null;
  isOnline: boolean;
  transactions: Transaction[];
  categories: Category[];
  budgets: any[];
  goals: any[];
  subscriptions: any[];
  currencySymbol: string;
}

// Highly sophisticated client-side rule-based financial advisor
function generateHeuristicInsights(
  transactions: Transaction[],
  categories: Category[],
  budgets: any[],
  goals: any[],
  subscriptions: any[],
  currencySymbol: string
): InsightsData {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter for current month's transactions
  const monthTxs = transactions.filter(t => {
    if (!t.date) return false;
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const activeTxs = monthTxs.length > 0 ? monthTxs : transactions;

  const totalExpenses = activeTxs
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = activeTxs
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  const insights: InsightItem[] = [];
  const recommendations: string[] = [];

  // Summary Text Constructor
  let summaryText = "";
  if (transactions.length === 0) {
    summaryText = `Welcome to your Interactive Wealth Advisor! Add your first transactions or upload a statement to unlock dynamic financial metrics.`;
  } else {
    const formattedExpenses = `${currencySymbol}${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formattedIncome = `${currencySymbol}${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    if (netSavings > 0) {
      summaryText = `You are maintaining a strong positive cash flow. Out of ${formattedIncome} in earnings, you spent ${formattedExpenses}, securing a ${savingsRate.toFixed(1)}% net monthly savings rate.`;
    } else if (netSavings < 0) {
      summaryText = `Your monthly outflows of ${formattedExpenses} exceed your registered incomes of ${formattedIncome} by ${currencySymbol}${Math.abs(netSavings).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. This represents a negative cash yield.`;
    } else {
      summaryText = `Your monthly outflows and inflows are perfectly balanced at ${formattedExpenses}. Generating a cash surplus is critical to satisfying long-term goals.`;
    }
  }

  // Insight 1: Savings Cushion Rate
  if (transactions.length > 0) {
    if (savingsRate > 25) {
      insights.push({
        type: 'milestone',
        title: 'Elite Savings Quotient',
        description: `Your net savings rate is sitting at a stellar ${savingsRate.toFixed(1)}%. This is well above the baseline 20% recommended by leading certified financial planners.`
      });
      recommendations.push(`Set up an automatic transfer of 15% of your remaining surplus (${currencySymbol}${(netSavings * 0.15).toFixed(2)}) into your top savings portfolio.`);
    } else if (savingsRate > 0) {
      insights.push({
        type: 'tip',
        title: 'Expand Savings Velocity',
        description: `Your current savings rate is ${savingsRate.toFixed(1)}%. Increasing this rate by just 5% can expedite your target goals and create a robust buffer against economic downturns.`
      });
      recommendations.push(`Audit recurring small outflows to recover an extra ${currencySymbol}${(totalExpenses * 0.05).toFixed(2)} next month.`);
    } else if (totalIncome > 0) {
      insights.push({
        type: 'warning',
        title: 'Budget Deficit Risk',
        description: `You are running a budget deficit this cycle. This requires relying on credit cards or drawing down savings, which reduces your baseline net worth.`
      });
      recommendations.push(`Review non-essential categories (like dining or leisure shopping) to immediately trim ${currencySymbol}${Math.min(totalExpenses * 0.1, Math.abs(netSavings)).toFixed(2)} this week.`);
    }
  }

  // Insight 2: High Spender Category Mapping
  if (totalExpenses > 0) {
    const catExpenses: { [key: string]: number } = {};
    activeTxs.filter(t => t.type === 'expense').forEach(t => {
      const catId = t.categoryId;
      const catName = t.categoryName || categories.find(c => c.id === catId)?.name || 'Shopping & Others';
      catExpenses[catName] = (catExpenses[catName] || 0) + t.amount;
    });

    const sortedCats = Object.entries(catExpenses).sort((a, b) => b[1] - a[1]);
    if (sortedCats.length > 0) {
      const [topCat, topAmt] = sortedCats[0];
      const percent = (topAmt / totalExpenses) * 100;
      insights.push({
        type: 'prediction',
        title: `Dominant Outflow: ${topCat}`,
        description: `Your largest single expenditure is ${topCat}, capturing ${percent.toFixed(0)}% of your entire monthly outflows (${currencySymbol}${topAmt.toLocaleString(undefined, { maximumFractionDigits: 2 })}).`
      });
      recommendations.push(`Establish a custom spending budget for ${topCat} starting tomorrow to compress this outflow by 10% (saving ${currencySymbol}${(topAmt * 0.1).toFixed(2)}).`);
    }
  }

  // Insight 3: Dynamic Budget Warning Triggers
  if (budgets.length > 0 && transactions.length > 0) {
    let budgetOverruns = 0;
    let budgetWarnings = 0;

    budgets.forEach(b => {
      const catTxs = transactions.filter(t => t.categoryId === b.categoryId && t.type === 'expense');
      const spent = catTxs.reduce((sum, t) => sum + t.amount, 0);
      const ratio = spent / b.amount;
      const catName = b.categoryName || categories.find(c => c.id === b.categoryId)?.name || 'Uncategorized';

      if (ratio >= 1.0) {
        budgetOverruns++;
        if (insights.length < 4) {
          insights.push({
            type: 'warning',
            title: `Blown Budget: ${catName}`,
            description: `You spent ${currencySymbol}${spent.toFixed(2)} on ${catName}, breaking your configured cap of ${currencySymbol}${b.amount} by ${currencySymbol}${(spent - b.amount).toFixed(2)} (${(ratio * 100).toFixed(0)}% spent).`
          });
        }
      } else if (ratio >= 0.8) {
        budgetWarnings++;
        if (insights.length < 4) {
          insights.push({
            type: 'tip',
            title: `Critical Margin: ${catName}`,
            description: `Spending for ${catName} is at ${(ratio * 100).toFixed(0)}% (${currencySymbol}${spent.toFixed(2)} of ${currencySymbol}${b.amount}). Only ${currencySymbol}${(b.amount - spent).toFixed(2)} remaining.`
          });
        }
      }
    });

    if (budgetOverruns > 0) {
      recommendations.push(`Reallocate unused funds from other non-critical categories to cover the ${budgetOverruns} overdrawn budget(s) immediately.`);
    }
    if (budgetWarnings > 0) {
      recommendations.push(`Set mobile notifications or daily caps for the remaining ${budgetWarnings} budget categories approaching their limit.`);
    }
  }

  // Insight 4: Subscriptions Overhead Diagnostic
  if (subscriptions.length > 0) {
    const totalSubs = subscriptions.reduce((sum, s) => sum + s.amount, 0);
    const subPercent = totalIncome > 0 ? (totalSubs / totalIncome) * 100 : (totalExpenses > 0 ? (totalSubs / totalExpenses) * 100 : 0);

    if (totalSubs > 0) {
      insights.push({
        type: 'prediction',
        title: 'Recurring overhead',
        description: `You have ${subscriptions.length} active recurring contracts costing ${currencySymbol}${totalSubs.toFixed(2)} per cycle. This consumes ${subPercent.toFixed(1)}% of your financial footprint.`
      });

      if (subPercent > 10) {
        recommendations.push(`Prune underutilized subscription packages. Consolidating entertainment/streaming apps can yield up to ${currencySymbol}240 in annual cash recovery.`);
      } else {
        recommendations.push(`Verify renewal timelines for active contracts to prevent unexpected billing spikes.`);
      }
    }
  }

  // Insight 5: Savings Goal Progress Milestones
  if (goals.length > 0) {
    const goalList = [...goals].map(g => ({
      ...g,
      pct: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0
    })).sort((a, b) => b.pct - a.pct);

    const topGoal = goalList[0];
    if (topGoal && topGoal.pct >= 80 && topGoal.pct < 100) {
      insights.push({
        type: 'milestone',
        title: `Goal Target: ${topGoal.name}`,
        description: `Your "${topGoal.name}" savings goal is sitting at a wonderful ${topGoal.pct.toFixed(0)}%! You are only ${currencySymbol}${(topGoal.targetAmount - topGoal.currentAmount).toLocaleString()} away from securing this milestone.`
      });
      recommendations.push(`Inject a small extra transfer into "${topGoal.name}" to expedite closure before this cycle ends.`);
    } else if (goals.length > 0) {
      insights.push({
        type: 'tip',
        title: 'Micro-Saving Compounder',
        description: `Tracking ${goals.length} active goals. Consistent weekly transfers of even small amounts ($10) leverage the momentum effect, speeding up completion.`
      });
      recommendations.push('Establish a weekly recurring transfer trigger to automatically fund your goals without thinking.');
    }
  }

  // Insight 6: Weekend Impulse Spikes
  if (activeTxs.length > 0) {
    let weekendAmt = 0;
    let weekdayAmt = 0;
    activeTxs.filter(t => t.type === 'expense').forEach(t => {
      if (!t.date) return;
      const d = new Date(t.date);
      const day = d.getDay();
      if (day === 0 || day === 6) {
        weekendAmt += t.amount;
      } else {
        weekdayAmt += t.amount;
      }
    });

    const totalSpent = weekendAmt + weekdayAmt;
    if (totalSpent > 0) {
      const weekendPct = (weekendAmt / totalSpent) * 100;
      if (weekendPct > 45) {
        insights.push({
          type: 'tip',
          title: 'Weekend spending surge',
          description: `Discretionary spend spikes by ${weekendPct.toFixed(0)}% on Saturdays and Sundays. This indicates weekend dining, leisure, or social purchases are cluster spending.`
        });
        recommendations.push(`Set a customized weekend ceiling of ${currencySymbol}50.00 to prevent recreational shopping leaks.`);
      }
    }
  }

  // Fallbacks if empty
  if (insights.length === 0) {
    insights.push({
      type: 'tip',
      title: 'Wealth Engine Initialized',
      description: `Create active budgets, log expenses, or link savings goals. The dynamic rule-based advisor will analyze your cash flows in real time.`
    });
  }
  if (recommendations.length === 0) {
    recommendations.push('Establish a secondary cash buffer target to safeguard against surprise monthly expenditures.');
    recommendations.push('Prune inactive subscriptions to instantly release cash flow back to your goals.');
  }

  return {
    summaryText,
    insights: insights.slice(0, 4),
    recommendations: recommendations.slice(0, 4)
  };
}

export default function Insights({ 
  token, 
  isOnline, 
  transactions, 
  categories, 
  budgets, 
  goals, 
  subscriptions, 
  currencySymbol 
}: InsightsProps) {
  // Engine Mode Toggle: 'heuristic' (Live Rule-Based) vs 'ai' (Gemini Flash)
  const [engineMode, setEngineMode] = useState<'heuristic' | 'ai'>('heuristic');
  
  const [loading, setLoading] = useState(false);
  const [aiData, setAiData] = useState<InsightsData | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [fallbackWarning, setFallbackWarning] = useState<string | null>(null);

  // Generate live heuristic data in real-time
  const heuristicData = generateHeuristicInsights(
    transactions,
    categories,
    budgets,
    goals,
    subscriptions,
    currencySymbol
  );

  // Fetch online AI insights
  const fetchAiInsights = async () => {
    if (!token) {
      setAiError("You must be logged in to compile AI analysis.");
      return;
    }
    setLoading(true);
    setAiError(null);
    setFallbackWarning(null);
    try {
      const response = await fetch('/api/insights', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || 'The Gemini 3.5 AI gateway is busy or offline.');
      }
      const report = await response.json();
      
      // Check if server served hardcoded/mock insights because of missing API key, or actual
      setAiData(report);
      
      // Cache insights locally in localStorage
      localStorage.setItem('budgetflow_cached_insights', JSON.stringify(report));
    } catch (err: any) {
      console.warn('AI compilation failed. Gracefully recovering with local heuristic insights:', err);
      
      // Try to recover from previous local storage cache
      const cached = localStorage.getItem('budgetflow_cached_insights');
      if (cached) {
        try {
          setAiData(JSON.parse(cached));
          setFallbackWarning(`Gemini model is under heavy load or offline. Loaded your last cached AI advisor, or you can switch to Real-Time Diagnostics.`);
        } catch (e) {
          fallbackToHeuristics(err.message);
        }
      } else {
        fallbackToHeuristics(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fallbackToHeuristics = (errMsg: string) => {
    setEngineMode('heuristic');
    setFallbackWarning(`Gemini model is currently experiencing high demand (${errMsg}). Seamlessly fell back to your Real-Time Local Financial Diagnostics!`);
    // Diminish alert after 8 seconds
    setTimeout(() => {
      setFallbackWarning(null);
    }, 8000);
  };

  useEffect(() => {
    // When switching tabs to AI for the first time, fetch data if we don't have it
    if (engineMode === 'ai' && !aiData) {
      fetchAiInsights();
    }
  }, [engineMode]);

  // Which data to render based on selection
  const activeData = engineMode === 'heuristic' ? heuristicData : (aiData || heuristicData);

  // Dynamic icon resolver for type
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'tip': return <Lightbulb className="w-5 h-5 text-amber-500" />;
      case 'milestone': return <Award className="w-5 h-5 text-emerald-500" />;
      case 'prediction': return <TrendingUp className="w-5 h-5 text-blue-500" />;
      default: return <Sparkles className="w-5 h-5 text-purple-500" />;
    }
  };

  const getInsightBadgeStyle = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      case 'tip': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'milestone': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'prediction': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default: return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    }
  };

  return (
    <div id="insights-view" className="p-6 md:p-8 space-y-6 animate-fade-in no-print">
      
      {/* Header and Controller */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-slate-100 dark:border-slate-800/60">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white flex items-center gap-2.5">
            <Cpu className="w-8 h-8 text-blue-600" />
            <span>Interactive Wealth Advisor</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time financial telemetry diagnostics fused with high-tier cognitive planning.
          </p>
        </div>

        {/* Engine Switcher Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-850 self-start lg:self-center">
          <button
            onClick={() => setEngineMode('heuristic')}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer
              ${engineMode === 'heuristic' 
                ? 'bg-white dark:bg-slate-850 text-slate-900 dark:text-white shadow-xs border border-slate-200/40 dark:border-slate-800' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}
            `}
          >
            <Coins className="w-3.5 h-3.5 text-blue-500" />
            <span>⚡ Live Telemetry</span>
          </button>
          
          <button
            onClick={() => setEngineMode('ai')}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer
              ${engineMode === 'ai' 
                ? 'bg-white dark:bg-slate-850 text-slate-900 dark:text-white shadow-xs border border-slate-200/40 dark:border-slate-800' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}
            `}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>🤖 AI Cognitive</span>
          </button>
        </div>
      </div>

      {/* Warning/Fallback Notifications */}
      <AnimatePresence mode="wait">
        {fallbackWarning && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-3 shadow-xs"
          >
            <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">Engine Notification</span>
              <span className="leading-relaxed text-slate-600 dark:text-slate-400">{fallbackWarning}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Online indicator panel */}
      {!isOnline && engineMode === 'ai' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 flex items-center gap-3 text-xs shadow-xs animate-pulse">
          <AlertTriangle className="w-4.5 h-4.5 text-amber-500 flex-shrink-0" />
          <span>Currently operating offline. Showing cached advisor insights. Switch to <strong>Live Telemetry</strong> for instant live mathematical insights.</span>
        </div>
      )}

      {/* Loading Skeleton State */}
      {loading && engineMode === 'ai' ? (
        <div className="space-y-6">
          <div className="h-28 rounded-3xl animate-pulse bg-slate-100 dark:bg-slate-850 border border-slate-200/50 p-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-44 rounded-3xl animate-pulse bg-slate-100 dark:bg-slate-850 border border-slate-200/50 p-6"></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Summary Banner */}
          <div className="bg-gradient-to-tr from-slate-900 via-blue-950 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 rounded-3xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  {engineMode === 'heuristic' ? (
                    <Coins className="w-5.5 h-5.5 text-blue-400" />
                  ) : (
                    <BrainCircuit className="w-5.5 h-5.5 text-purple-400" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400">
                    {engineMode === 'heuristic' ? 'Live Telemetry Insight' : 'Cognitive Brain Report'}
                  </span>
                  <span className="text-[9px] block text-slate-400 mt-0.5">Calculated: Instantly updated</span>
                </div>
              </div>

              {engineMode === 'ai' && (
                <button
                  onClick={fetchAiInsights}
                  disabled={loading}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              )}
            </div>
            
            <p className="text-sm md:text-base leading-relaxed font-semibold text-slate-100 italic">
              "{activeData.summaryText}"
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeData.insights.map((insight, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 p-6 flex flex-col justify-between transition-all hover:border-blue-500/45 hover:shadow-md group"
              >
                <div>
                  {/* Title & Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      {getInsightIcon(insight.type)}
                      <h3 className="text-sm font-extrabold text-slate-950 dark:text-white truncate max-w-[150px] sm:max-w-[220px]">{insight.title}</h3>
                    </div>
                    
                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${getInsightBadgeStyle(insight.type)}`}>
                      {insight.type}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {insight.description}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between text-[11px] font-bold text-blue-500 group-hover:text-blue-600">
                  <span>Target optimization vector</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>

          {/* Actionable Blueprint Recommendation Bullets */}
          {activeData.recommendations && activeData.recommendations.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" />
                  <span>Actionable Wealth Blueprint</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Calculated tactical operations to trim overheads and speed up active portfolios.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {activeData.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 flex items-start gap-3.5 hover:border-slate-300 dark:hover:border-slate-750 transition-colors">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-extrabold font-mono mt-0.5 border border-blue-500/15">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-750 dark:text-slate-300 leading-relaxed">{rec}</p>
                    </div>
                    <CheckCircle2 className="w-4.5 h-4.5 text-slate-300 dark:text-slate-700 hover:text-emerald-500 cursor-pointer transition-colors self-center flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Empty State Handler */}
      {!loading && !activeData && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl py-16 text-center text-slate-400">
          <BrainCircuit className="w-16 h-16 stroke-1 text-slate-200 mb-3 mx-auto animate-pulse" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">No Intelligence Report active</h3>
          {aiError ? (
            <p className="text-xs text-red-500 mt-2 max-w-[280px] mx-auto leading-relaxed">{aiError}</p>
          ) : (
            <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto leading-relaxed">Please add transactions or budgets to allow compiling recommendations.</p>
          )}
        </div>
      )}

    </div>
  );
}
