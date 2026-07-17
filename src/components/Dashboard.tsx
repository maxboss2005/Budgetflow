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
  Wallet,
  Flame,
  X,
  Smartphone,
  Download,
  Info,
  Share,
  MoreVertical,
  Check,
  Monitor,
  Gift
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
import { Transaction, Budget, SavingsGoal, Subscription, Category, User } from '../types';
import { calculateStreak } from '../lib/streak';

// Dynamic Icon Resolver mapping strings to Lucide Components
export const IconResolver = ({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) => {
  const map: Record<string, any> = {
    Briefcase, Laptop, Utensils, Car, ShoppingBag, FileText, Heart, GraduationCap, Play, Home, Sparkles, Dumbbell, CarFront: Car, HelpCircle, Wallet
  };
  const Comp = map[name] || HelpCircle;
  return <Comp className={className} style={style} />;
};

interface DashboardProps {
  user?: User | null;
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  subscriptions: Subscription[];
  categories: Category[];
  currencySymbol: string;
  onAddTxClick: () => void;
  setActiveTab: (tab: string) => void;
  loading: boolean;
  deferredPrompt?: any;
  onInstallApp?: () => void;
  isAppInstalled?: boolean;
  setIsAppInstalled?: (val: boolean) => void;
  awardPoints?: (amount: number, reason: string) => void;
}

export default function Dashboard({
  user,
  transactions,
  budgets,
  goals,
  subscriptions,
  categories,
  currencySymbol,
  onAddTxClick,
  setActiveTab,
  loading,
  deferredPrompt,
  onInstallApp,
  isAppInstalled = false,
  setIsAppInstalled,
  awardPoints
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

  const todayStr = new Date().toISOString().split('T')[0];
  const { currentStreak, longestStreak, activeToday } = calculateStreak(transactions, todayStr);

  // Generate the last 7 days status for habit visualization
  const last7DaysStreak = [];
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const oneDayMs = 24 * 60 * 60 * 1000;
  const nowMs = new Date().getTime();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(nowMs - (i * oneDayMs));
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = weekdayNames[d.getDay()];
    const hasTx = transactions.some(t => t.date && t.date.substring(0, 10) === dateStr);
    const isToday = dateStr === todayStr;
    last7DaysStreak.push({ dateStr, dayLabel, hasTx, isToday });
  }

  const [installDismissed, setInstallDismissed] = React.useState(() => {
    return localStorage.getItem('devfint_install_dismissed') === 'true';
  });
  const [showGuideModal, setShowGuideModal] = React.useState(false);
  const [guideTab, setGuideTab] = React.useState<'android' | 'ios' | 'desktop'>('android');
  const isInIframe = React.useMemo(() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }, []);

  return (
    <div id="dashboard-view" className="p-6 md:p-8 space-y-8 animate-fade-in no-print">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Workspace Intelligence
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time financial positions, automated budgeting alerts, and asset progress.
          </p>
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

      {/* PWA Install Alert Banner */}
      {!isAppInstalled && !installDismissed && (
        <div className={`border rounded-3xl p-5 md:p-6 shadow-lg relative overflow-hidden animate-fade-in group/pwa transition-all duration-300 ${
          isInIframe 
            ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-slate-900 border-amber-500/20 text-white' 
            : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 border-blue-500/10 text-white'
        }`}>
          {/* Ambient animations */}
          <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none group-hover/pwa:scale-110 transition-transform duration-700"></div>
          <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl backdrop-blur-md text-white flex items-center justify-center shrink-0 border shadow-inner ${
                isInIframe ? 'bg-amber-500/20 border-amber-400/25' : 'bg-white/10 border-white/10'
              }`}>
                <Smartphone className="w-6 h-6 animate-bounce" style={{ animationDuration: '3s' }} />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500 text-slate-950 tracking-wider shadow-sm animate-pulse">
                    <Sparkles className="w-3 h-3 fill-slate-950 text-slate-950" />
                    <span>+150 XP Reward</span>
                  </span>
                  <span className="text-xs text-blue-100 font-bold font-mono uppercase tracking-widest bg-blue-500/20 px-2 py-0.5 rounded-md">
                    {isInIframe ? 'Preview Frame Active' : 'Native PWA'}
                  </span>
                </div>
                
                {isInIframe ? (
                  <>
                    <h3 className="text-base font-extrabold text-white tracking-tight mt-1 flex items-center gap-2">
                      <span>⚠️ App Installation Restricted by Preview Frame</span>
                    </h3>
                    <p className="text-xs text-orange-100 max-w-2xl leading-relaxed">
                      You are viewing DevFint inside the AI Studio preview window. **Web browsers strictly block app installation inside iframes!** Launch the app in a standalone tab below to install it directly onto your phone.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-base font-extrabold text-white tracking-tight mt-1">Install DevFint on Your Device</h3>
                    <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
                      Enjoy blazing-fast startup speed, a standalone app window, home screen launching, offline capabilities, and a native application experience.
                    </p>
                  </>
                )}
              </div>
            </div>

            <button 
              onClick={() => {
                localStorage.setItem('devfint_install_dismissed', 'true');
                setInstallDismissed(true);
              }}
              className="p-1.5 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-all cursor-pointer border border-transparent hover:border-white/10"
              title="Dismiss prompt"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 relative z-10 border-t border-white/10 pt-4">
            {isInIframe ? (
              <button
                onClick={() => window.open(window.location.href, '_blank')}
                className="px-5 py-2.5 bg-white text-orange-600 hover:bg-slate-50 text-xs font-extrabold rounded-xl shadow-md shadow-slate-950/20 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95 animate-pulse"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>🚀 Launch in New Tab to Install</span>
              </button>
            ) : deferredPrompt ? (
              <button
                onClick={onInstallApp}
                className="px-5 py-2.5 bg-white text-blue-600 hover:bg-slate-50 text-xs font-bold rounded-xl shadow-md shadow-slate-950/20 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Install Native App</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setGuideTab('android');
                  setShowGuideModal(true);
                }}
                className="px-5 py-2.5 bg-blue-500/30 text-white hover:bg-blue-500/40 text-xs font-bold rounded-xl border border-white/10 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Open Install Assistant</span>
              </button>
            )}

            <button
              onClick={() => {
                setGuideTab('android');
                setShowGuideModal(true);
              }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/90 text-xs font-bold rounded-xl border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Interactive Guide</span>
            </button>
          </div>
        </div>
      )}

      {/* PWA Interactive Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in no-print overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl relative my-8">
            
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">In-App PWA Install Center</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Complete setup to earn 150 XP instantly! 🏆</p>
                </div>
              </div>
              <button 
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Embed / Iframe Warning in Modal */}
            {isInIframe && (
              <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 text-xs flex gap-2.5 items-start">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div className="space-y-1">
                  <p className="font-bold">Currently Running in Iframe Preview</p>
                  <p className="leading-relaxed opacity-90">
                    Chrome blocks installation options in this preview pane. Please click the button below to launch in a full browser tab to install directly.
                  </p>
                  <button 
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="mt-1.5 px-3 py-1 bg-amber-500 dark:bg-amber-600 text-slate-950 dark:text-white font-bold rounded-lg hover:bg-amber-600 dark:hover:bg-amber-500 transition-colors inline-flex items-center gap-1"
                  >
                    <span>Launch in New Tab</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Device Tabs */}
            <div className="px-6 pt-4 flex gap-1.5 border-b border-slate-100 dark:border-slate-800/80">
              <button
                onClick={() => setGuideTab('android')}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  guideTab === 'android' 
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/10' 
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Android / Chrome
              </button>
              <button
                onClick={() => setGuideTab('ios')}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  guideTab === 'ios' 
                    ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/20 dark:bg-rose-950/10' 
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                iPhone / Safari
              </button>
              <button
                onClick={() => setGuideTab('desktop')}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  guideTab === 'desktop' 
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/20 dark:bg-blue-950/10' 
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Desktop PC
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[55vh] overflow-y-auto">
              {/* Tab Content: Android / Chrome */}
              {guideTab === 'android' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">1</span>
                      Tap the Chrome 3-Dots Menu
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 pl-7 leading-relaxed">
                      Tap the <strong className="text-slate-900 dark:text-white">Three-Dots Menu (<MoreVertical className="w-3 h-3 inline-block" />)</strong> icon in the top right corner of your Chrome browser address bar.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">2</span>
                      Find & Tap "Install App" or "Add to Home screen"
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 pl-7 leading-relaxed">
                      Look down the list. Select <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Install app</strong> or <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Add to Home screen</strong> and tap it!
                    </p>
                  </div>

                  {/* Chrome Browser Dropdown Simulator */}
                  <div className="p-4 rounded-2xl border border-emerald-500/25 bg-emerald-50/5 dark:bg-emerald-950/5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Interactive Menu Simulator</span>
                      <span className="text-[10px] text-slate-400 font-mono">Chrome Browser</span>
                    </div>

                    {/* Address bar simulator */}
                    <div className="bg-slate-100 dark:bg-slate-950 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono shadow-inner border border-slate-200/50 dark:border-slate-800">
                      <span className="truncate">https://devfint-wealth.web.app</span>
                      <MoreVertical className="w-4 h-4 text-slate-900 dark:text-slate-100 animate-pulse bg-emerald-500/10 rounded-full" />
                    </div>

                    {/* Simulator Dropdown box */}
                    <div className="max-w-xs mx-auto bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xl divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden font-sans">
                      <div className="p-2.5 text-[11px] text-slate-400 flex justify-between">
                        <span>⭐️ Star</span>
                        <span>⬇️ Download</span>
                        <span>ℹ️ Info</span>
                        <span>🔄 Reload</span>
                      </div>
                      <div className="p-2.5 text-xs text-slate-700 dark:text-slate-300">New tab</div>
                      <div className="p-2.5 text-xs text-slate-700 dark:text-slate-300">New Incognito tab</div>
                      <div className="p-2.5 text-xs text-slate-700 dark:text-slate-300">History</div>
                      <div className="p-2.5 text-xs text-slate-700 dark:text-slate-300">Downloads</div>
                      
                      {/* Highlighted simulator option */}
                      <div 
                        onClick={() => {
                          localStorage.setItem('devfint_pwa_installed', 'true');
                          if (setIsAppInstalled) setIsAppInstalled(true);
                          if (awardPoints) {
                            awardPoints(150, "PWA Installed! Enjoy standalone launching and offline analytics! 📱✨");
                          }
                          setShowGuideModal(false);
                        }}
                        className="p-3 bg-gradient-to-r from-emerald-500/10 via-emerald-500/20 to-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-between cursor-pointer hover:from-emerald-500/20 hover:to-emerald-500/20 animate-pulse border-y-2 border-emerald-500"
                      >
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 animate-bounce text-emerald-600 dark:text-emerald-400" />
                          <span>📲 Install App (or Add to Home)</span>
                        </div>
                        <span className="text-[9px] bg-emerald-500 text-white font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">TAP HERE</span>
                      </div>

                      <div className="p-2.5 text-xs text-slate-400 dark:text-slate-500">Desktop site</div>
                      <div className="p-2.5 text-xs text-slate-400 dark:text-slate-500">Settings</div>
                    </div>
                    <p className="text-[10px] text-center text-slate-400 italic">
                      💡 Click "Install App" inside the simulator box above to complete installation instantly!
                    </p>
                  </div>
                </div>
              )}

              {/* Tab Content: iOS Safari */}
              {guideTab === 'ios' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold">1</span>
                      Tap the iOS Share Button
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 pl-7 leading-relaxed">
                      Tap the <strong className="text-slate-900 dark:text-white">Share Button (<Share className="w-4 h-4 inline-block text-blue-500" />)</strong> at the bottom of Safari's browser page.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold">2</span>
                      Tap "Add to Home Screen"
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 pl-7 leading-relaxed">
                      Scroll down past copy options and tap the <strong className="text-rose-600 dark:text-rose-400 font-bold">Add to Home Screen</strong> option.
                    </p>
                  </div>

                  {/* Safari Simulator Preview */}
                  <div className="p-4 rounded-2xl border border-rose-500/25 bg-rose-50/5 dark:bg-rose-950/5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600 dark:text-rose-400">iOS Share Simulator</span>
                      <span className="text-[10px] text-slate-400 font-mono">Safari Browser</span>
                    </div>

                    <div className="max-w-xs mx-auto bg-slate-100 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="text-center font-bold text-slate-900 dark:text-white text-xs py-1">Share Sheet</div>
                      <div className="space-y-2">
                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-600 dark:text-slate-400 flex justify-between">
                          <span>Copy Link</span>
                          <span>🔗</span>
                        </div>
                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-600 dark:text-slate-400 flex justify-between">
                          <span>Add to Reading List</span>
                          <span>📖</span>
                        </div>
                        {/* Interactive Item */}
                        <div 
                          onClick={() => {
                            localStorage.setItem('devfint_pwa_installed', 'true');
                            if (setIsAppInstalled) setIsAppInstalled(true);
                            if (awardPoints) {
                              awardPoints(150, "PWA shortcut active on iOS! Welcome back! 🍎✨");
                            }
                            setShowGuideModal(false);
                          }}
                          className="p-3 bg-rose-500/10 border-2 border-rose-500 rounded-xl text-xs text-rose-700 dark:text-rose-400 font-bold flex justify-between items-center cursor-pointer hover:bg-rose-500/20 animate-pulse"
                        >
                          <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4 bg-rose-500 text-white rounded p-0.5" />
                            <span>Add to Home Screen</span>
                          </div>
                          <span className="text-[9px] bg-rose-500 text-white font-black px-1.5 py-0.5 rounded-full">TAP HERE</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Desktop Chrome */}
              {guideTab === 'desktop' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold">1</span>
                      Look at the Chrome URL Bar
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 pl-7 leading-relaxed">
                      On computers running Google Chrome, Microsoft Edge, or Brave, look at the right end of your web address bar.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold">2</span>
                      Click the Install Button
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 pl-7 leading-relaxed">
                      Click the small computer-monitor-download icon (<Download className="w-3.5 h-3.5 inline-block" />) or the screens button in the URL bar, and click <strong className="text-blue-500">Install</strong>!
                    </p>
                  </div>

                  {/* Desktop Simulator */}
                  <div className="p-4 rounded-2xl border border-blue-500/25 bg-blue-50/5 dark:bg-blue-950/5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">Desktop Address Bar</span>
                      <span className="text-[10px] text-slate-400 font-mono">PC Simulator</span>
                    </div>

                    <div className="max-w-md mx-auto bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between font-mono text-[11px] text-slate-500 shadow-inner">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-emerald-500">🔒</span>
                        <span>https://devfint-wealth.web.app/dashboard</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Interactive monitor icon */}
                        <div 
                          onClick={() => {
                            localStorage.setItem('devfint_pwa_installed', 'true');
                            if (setIsAppInstalled) setIsAppInstalled(true);
                            if (awardPoints) {
                              awardPoints(150, "PWA Installed on desktop! standalone window activated! 🖥️✨");
                            }
                            setShowGuideModal(false);
                          }}
                          className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold border border-blue-500 rounded-lg flex items-center gap-1.5 cursor-pointer animate-pulse"
                        >
                          <Monitor className="w-3.5 h-3.5" />
                          <Download className="w-3 h-3" />
                          <span className="text-[9px] uppercase font-black">Install</span>
                        </div>
                        <span className="text-slate-400">⋮</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Bypass Setup Block */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <Gift className="w-4 h-4 text-amber-500 animate-bounce" />
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Shortcut already created?</span>
              </div>
              
              <button 
                onClick={() => {
                  localStorage.setItem('devfint_pwa_installed', 'true');
                  if (setIsAppInstalled) {
                    setIsAppInstalled(true);
                  }
                  if (awardPoints) {
                    awardPoints(150, "Direct App Shortcut Setup Active! +150 XP rewarded! 📱🚀");
                  }
                  setShowGuideModal(false);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-extrabold rounded-xl shadow-md shadow-blue-500/15 cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.01] transition-transform"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>Force Manual XP Claim (+150 XP)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Daily Habit Streak Banner */}
      <div id="habit-streak-banner" className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden transition-all hover:shadow-md">
        {/* Ambient subtle flame glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex items-center gap-4 z-10">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            currentStreak > 0 
              ? 'bg-amber-500/10 text-amber-500 shadow-md shadow-amber-500/10' 
              : 'bg-slate-50 dark:bg-slate-850 text-slate-400'
          }`}>
            <Flame className={`w-8 h-8 ${currentStreak > 0 ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-amber-500 dark:text-amber-400">DAILY LOGGING HABIT</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Record: {longestStreak} Days
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <span>{currentStreak} Day{currentStreak === 1 ? '' : 's'} Streak</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${activeToday ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                {activeToday ? 'Secured' : 'Needs Logging'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              {activeToday 
                ? 'Habit secured for today! Keep logging transactions daily to lock in point multipliers and level up your financial rank.' 
                : 'Log a new transaction (expense or income) today to extend your streak and secure extra bonus XP.'}
            </p>
          </div>
        </div>

        {/* 7-Day Habit Tracker Timeline Grid */}
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-2 lg:pb-0 z-10 scrollbar-none shrink-0 border-t border-slate-100 dark:border-slate-800/60 pt-4 lg:border-t-0 lg:pt-0">
          {last7DaysStreak.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5 min-w-[42px] relative">
              <span className={`text-[10px] font-bold tracking-tight ${day.isToday ? 'text-amber-500 dark:text-amber-400 font-extrabold' : 'text-slate-400 dark:text-slate-500'}`}>
                {day.isToday ? 'Today' : day.dayLabel}
              </span>
              
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2
                ${day.hasTx 
                  ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-sm shadow-amber-500/10' 
                  : day.isToday 
                    ? 'bg-slate-50 dark:bg-slate-950 border-amber-500/30 border-dashed text-slate-400' 
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700'}
              `}>
                {day.hasTx ? (
                  <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
                ) : (
                  <span className="text-xs font-mono font-bold">•</span>
                )}
              </div>

              {day.isToday && !day.hasTx && (
                <span className="absolute -bottom-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
              )}
            </div>
          ))}
        </div>

      </div>

      {/* 1. Core Financial summary bento bards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Net Liquidity Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Net Liquidity
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
              {formatCurrency(currentBalance)}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              All-time unified capital balance
            </p>
          </div>
        </div>

        {/* Monthly Income Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Monthly Income
            </span>
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
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Monthly Expenses
            </span>
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
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Savings Vault
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
              {formatCurrency(totalSavings)}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Accumulated across active goals
            </p>
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
