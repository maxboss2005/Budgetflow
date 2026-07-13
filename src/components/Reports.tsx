import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Calendar, 
  SlidersHorizontal, 
  ChevronRight, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  HelpCircle,
  FileText
} from 'lucide-react';
import { Transaction, Category, Budget, SavingsGoal } from '../types';
import { IconResolver } from './Dashboard';

interface ReportsProps {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: SavingsGoal[];
  currencySymbol: string;
}

export default function Reports({
  transactions,
  categories,
  budgets,
  goals,
  currencySymbol
}: ReportsProps) {

  // States
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'quarter' | 'year'>('month');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // --- Filtering ---
  const filteredTransactions = transactions.filter(t => {
    // 1. Date Range
    let matchesDate = true;
    const txDate = new Date(t.date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - txDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

    if (dateRange === 'month') matchesDate = diffDays <= 30;
    else if (dateRange === 'quarter') matchesDate = diffDays <= 90;
    else if (dateRange === 'year') matchesDate = diffDays <= 365;

    // 2. Category
    const matchesCategory = categoryFilter === 'all' || t.categoryId === categoryFilter;

    return matchesDate && matchesCategory;
  });

  // --- Calculations ---
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSurplus = totalIncome - totalExpense;

  // --- Actions ---
  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('No transactions match the selected filters for CSV export.');
      return;
    }

    // CSV formulation
    const headers = ['ID', 'Date', 'Type', 'Amount', 'Category', 'Notes', 'Recurring', 'Recurrence Cycle'];
    const rows = filteredTransactions.map(t => [
      t.id,
      t.date,
      t.type,
      t.amount,
      t.categoryName || 'Unknown',
      t.notes || '',
      t.isRecurring ? 'YES' : 'NO',
      t.recurrenceRule || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BudgetFlow_Audit_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) => {
    return `${currencySymbol}${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  return (
    <div id="reports-view" className="p-6 md:p-8 space-y-6 animate-fade-in">
      
      {/* Header and print button (hidden in print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Audit & Export</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Formulate balance sheets, download spreadsheets, or trigger tax printing.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold border border-slate-200/50 dark:border-slate-800 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>

          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/15 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* PRINT-ONLY HEADER HEADER (Only visible during print) */}
      <div className="hidden print:block space-y-2 border-b border-slate-200 pb-6">
        <h1 className="text-4xl font-extrabold text-slate-950 font-sans">BudgetFlow Statement of Accounts</h1>
        <p className="text-xs text-slate-400 font-mono">REPORT GENERATED: {new Date().toLocaleDateString()} | CLASSIFICATION: CONFIDENTIAL FINANCIAL AUDIT</p>
      </div>

      {/* Filtering configuration card (hidden in print) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-5 shadow-sm space-y-4 no-print">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Formulation Parameters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Timeframe selector */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Statement Timeframe</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="month">Past 30 Days (Monthly Cycle)</option>
              <option value="quarter">Past 90 Days (Quarterly Cycle)</option>
              <option value="year">Past 365 Days (Annual Cycle)</option>
              <option value="all">Complete Database History</option>
            </select>
          </div>

          {/* Category scope */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Taxonomy Scope</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Slices Combined</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Aggregate balance sheet row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Total Income */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-5 space-y-1 relative overflow-hidden shadow-sm">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Statement Revenue</span>
          <h2 className="text-2xl font-bold font-mono text-emerald-500">{formatCurrency(totalIncome)}</h2>
          <p className="text-[10px] text-slate-400">Aggregated cash inflows for this period</p>
        </div>

        {/* Total expense */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-5 space-y-1 relative overflow-hidden shadow-sm">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Statement Outflows</span>
          <h2 className="text-2xl font-bold font-mono text-slate-800 dark:text-white">{formatCurrency(totalExpense)}</h2>
          <p className="text-[10px] text-slate-400">Aggregated cash expenditures for this period</p>
        </div>

        {/* Net surplus */}
        <div className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 space-y-1 relative overflow-hidden shadow-sm ${netSurplus >= 0 ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Statement Net Profit/Loss</span>
          <h2 className={`text-2xl font-bold font-mono ${netSurplus >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(netSurplus)}</h2>
          <p className="text-[10px] text-slate-400">Current active profit delta margin</p>
        </div>

      </div>

      {/* Table Audit Statement list */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Financial Ledger Entry Statements</h3>
            <p className="text-xs text-slate-400 mt-0.5">Surgically itemized list of transfers audited within parameter boundaries.</p>
          </div>
          
          <span className="text-xs text-slate-400 font-mono font-bold">{filteredTransactions.length} items audited</span>
        </div>

        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800/60 pb-3">
                  <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Notes / Reference</th>
                  <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Recurrence</th>
                  <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {filteredTransactions.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/25 transition-colors">
                    <td className="py-3 text-xs text-slate-500 dark:text-slate-400 font-mono">{t.date}</td>
                    <td className="py-3 text-xs font-bold text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-[200px]">
                      {t.notes || (t.type === 'income' ? 'Direct Deposit' : 'Retail Outflow')}
                    </td>
                    <td className="py-3 text-xs font-medium text-slate-600 dark:text-slate-400">
                      <div className="inline-flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.categoryColor }}></span>
                        <span>{t.categoryName || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-3 text-xs text-slate-400 hidden sm:table-cell">
                      {t.isRecurring ? `Recurring (${t.recurrenceRule})` : 'Single Settlement'}
                    </td>
                    <td className={`py-3 text-xs font-bold font-mono text-right ${t.type === 'income' ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-200'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400">
            <FileSpreadsheet className="w-12 h-12 stroke-1 text-slate-200 mb-2 mx-auto" />
            <span className="text-sm">No ledger entries audited in chosen range. Adjust dates and retry!</span>
          </div>
        )}
      </div>

    </div>
  );
}
