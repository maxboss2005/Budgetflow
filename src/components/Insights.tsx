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
  HelpCircle
} from 'lucide-react';

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
  token: string;
  isOnline: boolean;
}

export default function Insights({ token, isOnline }: InsightsProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InsightsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/insights', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Intelligence gateway failed to compile report.');
      }
      const report = await response.json();
      setData(report);
      
      // Cache insights locally in localStorage to allow instant offline viewing
      localStorage.setItem('budgetflow_cached_insights', JSON.stringify(report));
    } catch (err: any) {
      console.warn('Failed to fetch online insights, falling back to cached state:', err);
      // Try to recover from local storage cache
      const cached = localStorage.getItem('budgetflow_cached_insights');
      if (cached) {
        setData(JSON.parse(cached));
      } else {
        setError(err.message || 'Unable to contact AI engine. Please verify connectivity.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Attempt to load from cache immediately to prevent visual flashing
    const cached = localStorage.getItem('budgetflow_cached_insights');
    if (cached) {
      setData(JSON.parse(cached));
    } else {
      fetchInsights();
    }
  }, [token]);

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
      
      {/* Header and trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Cpu className="w-7 h-7 text-blue-600 animate-pulse" />
            <span>AI Smart Insights</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personalized wealth advisor powered by <strong>Gemini 3.5 Flash</strong>.
          </p>
        </div>

        <button 
          onClick={() => fetchInsights(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-55 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/15 transition-all cursor-pointer self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Analyzing Telemetry...' : 'Refresh Advisor'}</span>
        </button>
      </div>

      {/* Online indicator panel */}
      {!isOnline && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex items-center gap-3 text-xs">
          <AlertTriangle className="w-4.5 h-4.5 text-amber-500 flex-shrink-0" />
          <span>Currently operating offline. Displaying cached advisor reports. Reconnect to launch fresh queries.</span>
        </div>
      )}

      {/* Loading Skeleton state */}
      {loading && (
        <div className="space-y-6">
          <div className="h-28 rounded-3xl skeleton-box bg-white dark:bg-slate-900 border border-slate-200/50 p-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-44 rounded-3xl skeleton-box bg-white dark:bg-slate-900 border border-slate-200/50 p-6"></div>
            ))}
          </div>
        </div>
      )}

      {/* Primary Report State */}
      {!loading && data && (
        <div className="space-y-6">
          
          {/* Summary Text block */}
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-3.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <BrainCircuit className="w-5.5 h-5.5 text-white" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Advisor Executive Summary</span>
            </div>
            <p className="text-sm md:text-base leading-relaxed font-medium">
              "{data.summaryText}"
            </p>
          </div>

          {/* Cards distribution grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.insights.map((insight, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 p-6 flex flex-col justify-between transition-all hover:shadow-md"
              >
                <div>
                  {/* Title & Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      {getInsightIcon(insight.type)}
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-[180px]">{insight.title}</h3>
                    </div>
                    
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${getInsightBadgeStyle(insight.type)}`}>
                      {insight.type}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {insight.description}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between text-[11px] font-semibold text-blue-500 cursor-pointer hover:text-blue-600">
                  <span>Take action</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>

          {/* Bullet recommendations details list */}
          {data.recommendations && data.recommendations.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Interactive Action Blueprint</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Tactical financial maneuvers calculated to optimize wealth speed.</p>
              </div>

              <div className="space-y-3">
                {data.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/40 flex items-start gap-3.5">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center text-xs font-bold font-mono mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{rec}</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-slate-300 dark:text-slate-700 hover:text-emerald-500 cursor-pointer transition-colors self-center flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Empty State / Error Handlers */}
      {!loading && !data && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl py-16 text-center text-slate-400">
          <BrainCircuit className="w-16 h-16 stroke-1 text-slate-200 mb-3 mx-auto" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">No Intelligence Report active</h3>
          {error ? (
            <p className="text-xs text-red-500 mt-2 max-w-[280px] mx-auto leading-relaxed">{error}</p>
          ) : (
            <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto leading-relaxed">Trigger the report constructor to analyze your offline financial posture and generate recommendations.</p>
          )}
        </div>
      )}

    </div>
  );
}
