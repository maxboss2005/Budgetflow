import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Trash2, 
  Edit2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  FileText, 
  Upload, 
  AlertCircle,
  Clock,
  X,
  FileImage,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { Transaction, Category } from '../types';
import { IconResolver } from './Dashboard';
import FileImport from './FileImport';

interface TransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  currencySymbol: string;
  onAddTransaction: (tx: any) => void;
  onUpdateTransaction: (id: string, updates: any) => void;
  onDeleteTransaction: (id: string) => void;
  isOnline: boolean;
  token: string | null;
  awardPoints?: (amount: number, reason: string) => void;
}

export default function Transactions({
  transactions,
  categories,
  currencySymbol,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  isOnline,
  token,
  awardPoints
}: TransactionsProps) {
  
  // States
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');
  
  // Custom Delete & Selection State
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id?: string; ids?: string[] } | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Add/Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  
  // Modal Fields
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [receiptBase64, setReceiptBase64] = useState('');
  const [receiptName, setReceiptName] = useState('');

  // Drag and drop ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // --- Filtering Logic ---
  const filteredTransactions = transactions.filter(t => {
    // 1. Search Query
    const query = search.toLowerCase();
    const matchesSearch = 
      (t.notes?.toLowerCase() || '').includes(query) ||
      (t.categoryName?.toLowerCase() || '').includes(query) ||
      t.amount.toString().includes(query);

    // 2. Type
    const matchesType = typeFilter === 'all' || t.type === typeFilter;

    // 3. Category
    const matchesCategory = categoryFilter === 'all' || t.categoryId === categoryFilter;

    // 4. Date
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const txDate = new Date(t.date);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - txDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (dateFilter === 'week') matchesDate = diffDays <= 7;
      else if (dateFilter === 'month') matchesDate = diffDays <= 30;
      else if (dateFilter === 'year') matchesDate = diffDays <= 365;
    }

    return matchesSearch && matchesType && matchesCategory && matchesDate;
  });

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // --- Modal Controllers ---
  const openAddModal = () => {
    setEditingTx(null);
    setAmount('');
    setType('expense');
    
    // Choose first matching category
    const defaultCats = categories.filter(c => c.type === 'expense');
    setCategoryId(defaultCats[0]?.id || '');
    
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setIsRecurring(false);
    setRecurrenceRule('monthly');
    setReceiptBase64('');
    setReceiptName('');
    setModalOpen(true);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setAmount(tx.amount.toString());
    setType(tx.type);
    setCategoryId(tx.categoryId);
    setDate(tx.date);
    setNotes(tx.notes || '');
    setIsRecurring(!!tx.isRecurring);
    setRecurrenceRule(tx.recurrenceRule || 'monthly');
    setReceiptBase64(tx.receiptUrl || '');
    setReceiptName(tx.receiptUrl ? 'Attached_Receipt.png' : '');
    setModalOpen(true);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const payload = {
      amount: parsedAmount,
      type,
      categoryId,
      date,
      notes: notes.trim(),
      isRecurring,
      recurrenceRule: isRecurring ? recurrenceRule : undefined,
      receiptUrl: receiptBase64 || undefined
    };

    if (editingTx) {
      onUpdateTransaction(editingTx.id, payload);
    } else {
      onAddTransaction(payload);
    }
    setModalOpen(false);
  };

  // --- Receipt File Uploader Helpers (Drag and Drop + Base64 conversion) ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Only image receipts (PNG, JPG, WEBP) are supported for local attachment caching.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptBase64(reader.result as string);
      setReceiptName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const formatCurrency = (val: number) => {
    return `${currencySymbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  return (
    <div id="transactions-view" className="p-6 md:p-8 space-y-6 animate-fade-in no-print">
      
      {/* Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Unified Ledger</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Surgically monitored transfers, recurring SaaS subscriptions, and digital receipts.</p>
        </div>

        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/15 transition-all cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Log Transaction</span>
        </button>
      </div>

      {/* Intelligent Document / Statement Ingestion Hub */}
      <FileImport
        categories={categories}
        isOnline={isOnline}
        token={token}
        onAddTransaction={onAddTransaction}
        awardPoints={awardPoints}
      />

      {/* Control Panel: Filters & Search bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-4 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search ledger by notes, category, amount..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Quick Type filter selectors */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
            {(['all', 'income', 'expense'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => { setTypeFilter(mode); setCurrentPage(1); }}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all
                  ${typeFilter === mode 
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-950'}
                `}
              >
                {mode === 'all' ? 'All Transfers' : mode}
              </button>
            ))}
          </div>

        </div>

        {/* Detailed filters drawer row */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
          
          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Timeframe Dropdown */}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Timeframe:</span>
            <select
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Time</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
              <option value="year">Past 365 Days</option>
            </select>
          </div>

          {/* Active filtered indicators counter */}
          <div className="ml-auto text-slate-400 text-[11px] font-mono">
            Filtered results: {filteredTransactions.length} of {transactions.length} records
          </div>

        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
        {selectedTxIds.length > 0 && (
          <div className="mb-4 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-between animate-fade-in no-print">
            <span className="text-xs font-bold text-red-600 dark:text-red-400">
              Selected {selectedTxIds.length} transaction{selectedTxIds.length > 1 ? 's' : ''} for mass deletion
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedTxIds([])}
                className="px-3 py-1 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setDeleteTarget({ type: 'mass_transactions', ids: selectedTxIds });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all hover:shadow-md cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Mass Delete ({selectedTxIds.length})</span>
              </button>
            </div>
          </div>
        )}

        {paginatedTransactions.length > 0 ? (
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-left border-collapse min-w-[640px] sm:min-w-0">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/50">
                  <th className="pb-3.5 pl-2 w-10">
                    <input 
                      type="checkbox"
                      className="rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                      checked={paginatedTransactions.length > 0 && paginatedTransactions.every(t => selectedTxIds.includes(t.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTxIds(prev => {
                            const newSelections = [...prev];
                            paginatedTransactions.forEach(t => {
                              if (!newSelections.includes(t.id)) newSelections.push(t.id);
                            });
                            return newSelections;
                          });
                        } else {
                          setSelectedTxIds(prev => prev.filter(id => !paginatedTransactions.some(t => t.id === id)));
                        }
                      }}
                    />
                  </th>
                  <th className="pb-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date / Reference</th>
                  <th className="pb-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="pb-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Recurrence</th>
                  <th className="pb-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Receipt</th>
                  <th className="pb-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Amount</th>
                  <th className="pb-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/30">
                {paginatedTransactions.map((t, idx) => (
                  <tr key={t.id || idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-950/25 transition-colors">
                    <td className="py-4 pl-2 w-10">
                      <input 
                        type="checkbox"
                        className="rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                        checked={selectedTxIds.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTxIds(prev => [...prev, t.id]);
                          } else {
                            setSelectedTxIds(prev => prev.filter(id => id !== t.id));
                          }
                        }}
                      />
                    </td>
                    
                    {/* Reference & Date */}
                    <td className="py-4">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {t.type === 'income' ? <ArrowUpRight className="w-4.5 h-4.5" /> : <ArrowDownRight className="w-4.5 h-4.5" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-[200px]">{t.notes || (t.type === 'income' ? 'Direct Deposit' : 'Retail Outflow')}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                            <span>{t.date}</span>
                            {!t.isSynced && (
                              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold">Offline Queue</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category Label */}
                    <td className="py-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-bold border" style={{ borderColor: `${t.categoryColor}30`, backgroundColor: `${t.categoryColor}10`, color: t.categoryColor }}>
                        <IconResolver name={t.categoryIcon || 'HelpCircle'} className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{t.categoryName || 'Unknown'}</span>
                      </div>
                    </td>

                    {/* Recurrence Period */}
                    <td className="py-4 hidden md:table-cell text-xs text-slate-500 font-medium">
                      {t.isRecurring ? (
                        <div className="flex items-center gap-1.5 text-purple-500 whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="capitalize">{t.recurrenceRule} cycle</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 whitespace-nowrap">Single Transfer</span>
                      )}
                    </td>

                    {/* Receipt image thumbnail check */}
                    <td className="py-4 hidden sm:table-cell whitespace-nowrap">
                      {t.receiptUrl ? (
                        <div className="relative group/thumb">
                          <img 
                            src={t.receiptUrl} 
                            alt="Receipt" 
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shadow-sm"
                          />
                          {/* Hover large view box */}
                          <div className="absolute hidden group-hover/thumb:block left-10 bottom-0 z-20 p-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl w-48 h-48 overflow-hidden">
                            <img src={t.receiptUrl} alt="Enlarged Receipt" className="w-full h-full object-contain" />
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700 text-xs">-</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-4 text-right whitespace-nowrap">
                      <span className={`text-xs font-bold font-mono ${t.type === 'income' ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-200'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </span>
                    </td>

                    {/* Actions panel */}
                    <td className="py-4 text-right pr-2 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => openEditModal(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setDeleteTarget({ type: 'transaction', id: t.id })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Delete transfer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <SlidersHorizontal className="w-12 h-12 stroke-1 text-slate-200 mb-2.5 mx-auto" />
            <span className="text-sm font-semibold">No transactions match your current filters. Clear parameters and retry!</span>
          </div>
        )}

        {/* Pagination Row */}
        {totalPages > 1 && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between">
            <span className="text-xs text-slate-400">Page <strong>{currentPage}</strong> of {totalPages}</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT TRANSACTION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span>{editingTx ? 'Modify Transaction Record' : 'Log New Transaction'}</span>
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                <button
                  type="button"
                  onClick={() => { setType('expense'); setCategoryId(categories.filter(c => c.type === 'expense')[0]?.id || ''); }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${type === 'expense' ? 'bg-white dark:bg-slate-800 text-red-500 shadow-sm' : 'text-slate-400'}`}
                >
                  Retail Outflow (Expense)
                </button>
                <button
                  type="button"
                  onClick={() => { setType('income'); setCategoryId(categories.filter(c => c.type === 'income')[0]?.id || ''); }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${type === 'income' ? 'bg-white dark:bg-slate-800 text-emerald-500 shadow-sm' : 'text-slate-400'}`}
                >
                  Direct Deposit (Income)
                </button>
              </div>

              {/* Amount & Date Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Value amount</label>
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
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Date settles</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Taxonomy / Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {categories.filter(c => c.type === type).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Reference notes */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Reference Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Whole foods groceries, advisory consult..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Recurrence Selector */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Set recurring transaction</span>
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4.5 h-4.5 text-blue-600 focus:ring-blue-500/25 border-slate-300 rounded"
                  />
                </div>

                {isRecurring && (
                  <div className="grid grid-cols-3 gap-2">
                    {(['weekly', 'monthly', 'yearly'] as const).map(rule => (
                      <button
                        key={rule}
                        type="button"
                        onClick={() => setRecurrenceRule(rule)}
                        className={`
                          py-1 rounded-lg text-[10px] font-bold capitalize border transition-all
                          ${recurrenceRule === rule 
                            ? 'bg-blue-500 text-white border-blue-500 shadow-sm' 
                            : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-slate-50'}
                        `}
                      >
                        {rule}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* RECEIPT DRAG AND DROP FILE UPLOADER */}
              <div 
                className={`
                  p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all cursor-pointer
                  ${dragActive 
                    ? 'border-blue-500 bg-blue-500/5' 
                    : receiptBase64 
                      ? 'border-emerald-500/40 bg-emerald-500/[0.02]' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/20'}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {receiptBase64 ? (
                  <div className="flex items-center gap-3 text-left w-full">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0">
                      <FileImage className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{receiptName || 'Attached_Receipt.png'}</p>
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setReceiptBase64(''); setReceiptName(''); }}
                        className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase mt-0.5"
                      >
                        Purge attachment
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Drag & drop receipt or click to browse</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">PNG, JPG, WEBP formats up to 4MB supported</p>
                  </>
                )}
              </div>

              {/* Form submit */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/15 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{editingTx ? 'Apply Changes' : 'Log Transaction'}</span>
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
                    deleteTarget.ids.forEach(id => onDeleteTransaction(id));
                    setSelectedTxIds([]);
                  } else if (deleteTarget.id) {
                    onDeleteTransaction(deleteTarget.id);
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
