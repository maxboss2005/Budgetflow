import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Trash2, 
  Check, 
  Sparkles, 
  HelpCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  ListFilter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Category, Transaction } from '../types';

interface FileImportProps {
  categories: Category[];
  isOnline: boolean;
  token: string | null;
  onAddTransaction: (tx: any) => void;
  awardPoints?: (amount: number, reason: string) => void;
}

interface ParsedTransaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  date: string;
  notes: string;
  selected: boolean;
}

interface QueuedFile {
  id: string;
  name: string;
  type: string;
  data: string; // Base64
  timestamp: string;
}

export default function FileImport({
  categories,
  isOnline,
  token,
  onAddTransaction,
  awardPoints
}: FileImportProps) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Parsed Transactions waiting for user approval
  const [parsedTxs, setParsedTxs] = useState<ParsedTransaction[]>([]);
  const [importingFile, setImportingFile] = useState<string>('');

  // Local Storage Queue for offline docs (Word, Excel, PDF)
  const [offlineQueue, setOfflineQueue] = useState<QueuedFile[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hydrate offline queue on load
  useEffect(() => {
    const saved = localStorage.getItem('budgetflow_offline_imports');
    if (saved) {
      try {
        setOfflineQueue(JSON.parse(saved));
      } catch (err) {
        console.warn('Could not parse offline imports queue');
      }
    }
  }, []);

  // Save offline queue changes
  const saveOfflineQueue = (queue: QueuedFile[]) => {
    setOfflineQueue(queue);
    localStorage.setItem('budgetflow_offline_imports', JSON.stringify(queue));
  };

  // Automatically process offline queue when we transition back online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0 && token) {
      processNextOfflineFile();
    }
  }, [isOnline, offlineQueue, token]);

  const processNextOfflineFile = async () => {
    const nextFile = offlineQueue[0];
    if (!nextFile) return;

    // Remove from queue optimistically or after success
    const updatedQueue = offlineQueue.slice(1);
    saveOfflineQueue(updatedQueue);

    setLoading(true);
    setLoadingStep(`Processing queued offline file: ${nextFile.name}...`);
    try {
      const response = await fetch('/api/finance/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileName: nextFile.name,
          fileType: nextFile.type,
          fileData: nextFile.data
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server parsing error');
      }

      const result = await response.json();
      if (result.transactions && result.transactions.length > 0) {
        const txsWithIds = result.transactions.map((tx: any) => ({
          ...tx,
          id: 'parsed_' + Math.random().toString(36).substring(2, 9),
          selected: true
        }));
        setParsedTxs(prev => [...prev, ...txsWithIds]);
        setImportingFile(nextFile.name);
        if (awardPoints) {
          awardPoints(50, `Successfully synced and processed offline file: ${nextFile.name}`);
        }
      }
    } catch (err: any) {
      console.error('Failed processing queued offline file:', err);
      setError(`Failed to parse queued file "${nextFile.name}": ${err.message || 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setError(null);
    setSuccessMsg(null);
    const name = file.name;
    const lowerName = name.toLowerCase();
    const validExtensions = ['.csv', '.xlsx', '.xls', '.pdf', '.docx', '.doc', '.json'];
    const hasValidExt = validExtensions.some(ext => lowerName.endsWith(ext));

    if (!hasValidExt) {
      setError('Unsupported file type. Please upload a CSV, Excel, Word, PDF, or JSON file.');
      return;
    }

    setLoading(true);
    setImportingFile(name);

    const reader = new FileReader();
    
    // Check if we should process locally (Offline CSV/JSON)
    const isJson = lowerName.endsWith('.json');
    const isCsv = lowerName.endsWith('.csv');

    if (!isOnline && !isJson && !isCsv) {
      // Offline binary files must be queued
      setLoadingStep('Saving document in offline queue...');
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const queued: QueuedFile = {
          id: 'offline_' + Math.random().toString(36).substring(2, 9),
          name: file.name,
          type: file.type,
          data: base64,
          timestamp: new Date().toISOString()
        };
        const newQueue = [...offlineQueue, queued];
        saveOfflineQueue(newQueue);
        setLoading(false);
        setSuccessMsg(`"${file.name}" has been queued. We will automatically parse this document via AI when your network connection returns!`);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Local parsing if offline JSON or CSV
    if (isJson && (!isOnline || !token)) {
      setLoadingStep('Parsing JSON data locally...');
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsedObj = JSON.parse(text);
          const rawItems = Array.isArray(parsedObj) ? parsedObj : (parsedObj.transactions || [parsedObj]);
          
          const mapped = mapRawToParsed(rawItems);
          if (mapped.length === 0) {
            throw new Error('No valid financial transactions detected in JSON file structure.');
          }
          setParsedTxs(mapped);
          setSuccessMsg(`Locally parsed ${mapped.length} records! Review and import them below.`);
        } catch (err: any) {
          setError(`Local JSON parse error: ${err.message}`);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsText(file);
      return;
    }

    if (isCsv && (!isOnline || !token)) {
      setLoadingStep('Parsing CSV columns locally...');
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const rows = parseLocalCsv(text);
          const mapped = mapRawToParsed(rows);
          if (mapped.length === 0) {
            throw new Error('Could not identify transactions in CSV file structure.');
          }
          setParsedTxs(mapped);
          setSuccessMsg(`Locally parsed ${mapped.length} records from CSV! Review and import below.`);
        } catch (err: any) {
          setError(`Local CSV parse error: ${err.message}`);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsText(file);
      return;
    }

    // Online parsing via backend Express router & Gemini
    setLoadingStep('Decoding file content...');
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setLoadingStep('Sending to AI-powered gateway parser...');
      try {
        const response = await fetch('/api/finance/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileData: base64
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Server gateway rejected parsing.');
        }

        const result = await response.json();
        if (!result.transactions || result.transactions.length === 0) {
          throw new Error('The secure parser could not find any transaction records in this file.');
        }

        const formatted = result.transactions.map((tx: any) => ({
          id: 'parsed_' + Math.random().toString(36).substring(2, 9),
          amount: parseFloat(tx.amount) || 0,
          type: tx.type === 'income' ? 'income' : 'expense',
          categoryId: tx.categoryId || categories.find(c => c.type === (tx.type || 'expense'))?.id || '',
          date: tx.date || new Date().toISOString().split('T')[0],
          notes: tx.notes || 'Imported Transaction',
          selected: true
        }));

        setParsedTxs(formatted);
        if (result.fallbackUsed) {
          setSuccessMsg(result.message || 'The AI model is experiencing peak demand. Successfully parsed spreadsheet using our smart offline rule-based parser!');
        } else {
          setSuccessMsg(`"${file.name}" has been successfully parsed and structured via Gemini 3.5 Flash!`);
        }
        if (awardPoints) {
          awardPoints(30, result.fallbackUsed ? `Scanned document statement: ${file.name}` : `AI-Scanned document statement: ${file.name}`);
        }
      } catch (err: any) {
        console.error('API parsing fail:', err);
        setError(`AI parsing failed: ${err.message || 'Ensure your server is running and API key is set.'}`);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  // Simple local CSV parser
  const parseLocalCsv = (text: string): any[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
    const records: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const currentline = lines[i].split(',');
      if (currentline.length < headers.length) continue;

      const obj: any = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentline[j]?.trim().replace(/["']/g, '') || '';
      }
      records.push(obj);
    }
    return records;
  };

  // Maps loose raw JSON objects to standard layout
  const mapRawToParsed = (raw: any[]): ParsedTransaction[] => {
    return raw.map((item: any) => {
      let amount = parseFloat(item.amount || item.value || item.cost || item.price || 0);
      let type: 'income' | 'expense' = 'expense';
      
      // Attempt to infer type
      const typeStr = String(item.type || item.category || '').toLowerCase();
      if (typeStr.includes('income') || typeStr.includes('deposit') || typeStr.includes('salary') || amount < 0) {
        type = 'income';
      }
      if (amount < 0) amount = Math.abs(amount);

      // Match categories
      const notes = item.notes || item.description || item.payee || item.merchant || 'Imported Entry';
      const categoryId = matchCategoryByName(item.category || notes, type);

      return {
        id: 'parsed_' + Math.random().toString(36).substring(2, 9),
        amount,
        type,
        categoryId,
        date: item.date || item.timestamp || new Date().toISOString().split('T')[0],
        notes,
        selected: true
      };
    }).filter(tx => tx.amount > 0);
  };

  const matchCategoryByName = (name: string, type: 'income' | 'expense'): string => {
    const lower = String(name).toLowerCase();
    const typeCats = categories.filter(c => c.type === type);

    for (const cat of typeCats) {
      if (lower.includes(cat.name.toLowerCase())) {
        return cat.id;
      }
    }
    // Fallbacks
    if (type === 'income') {
      return categories.find(c => c.id === 'cat-salary')?.id || categories.find(c => c.type === 'income')?.id || '';
    }
    return categories.find(c => c.id === 'cat-others')?.id || categories.find(c => c.type === 'expense')?.id || '';
  };

  // Transaction mutation handlers inside Preview
  const toggleSelect = (id: string) => {
    setParsedTxs(prev => prev.map(t => t.id === id ? { ...t, selected: !t.selected } : t));
  };

  const toggleAll = () => {
    const allSelected = parsedTxs.every(t => t.selected);
    setParsedTxs(prev => prev.map(t => ({ ...t, selected: !allSelected })));
  };

  const updateParsedField = (id: string, field: keyof ParsedTransaction, value: any) => {
    setParsedTxs(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const deleteParsedItem = (id: string) => {
    setParsedTxs(prev => prev.filter(t => t.id !== id));
  };

  const handleFinalImport = () => {
    const selected = parsedTxs.filter(t => t.selected);
    if (selected.length === 0) {
      setError('Please select at least one transaction to import.');
      return;
    }

    selected.forEach(tx => {
      onAddTransaction({
        amount: tx.amount,
        type: tx.type,
        categoryId: tx.categoryId,
        date: tx.date,
        notes: tx.notes
      });
    });

    if (awardPoints) {
      awardPoints(selected.length * 15, `Batch imported ${selected.length} transfers from ${importingFile}`);
    }

    setSuccessMsg(`Successfully imported ${selected.length} records into your transaction ledger!`);
    setParsedTxs([]);
    setImportingFile('');
  };

  const handleCancelImport = () => {
    setParsedTxs([]);
    setImportingFile('');
    setError(null);
  };

  // Stats for the active review panel
  const selectedCount = parsedTxs.filter(t => t.selected).length;
  const totalExpense = parsedTxs.filter(t => t.selected && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = parsedTxs.filter(t => t.selected && t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div id="file-import-module" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-6 shadow-sm space-y-6">
      
      {/* Action Title Row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <span>Smart Ingestion Hub</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Instantly map bank records, PDF invoices, Word receipts, Excel statements, and JSON schemas directly to your active ledger.
          </p>
        </div>

        {/* Offline & Queue Status Badges */}
        <div className="flex flex-col items-end gap-1.5">
          {!isOnline && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-lg uppercase tracking-wide">
              <Clock className="w-3 h-3 animate-spin" />
              Offline Scanner Mode
            </span>
          )}
          {offlineQueue.length > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-lg uppercase tracking-wide">
              {offlineQueue.length} Document{offlineQueue.length > 1 ? 's' : ''} Queued
            </span>
          )}
        </div>
      </div>

      {/* Main Drag & Drop Zone */}
      {parsedTxs.length === 0 && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all
            ${dragActive 
              ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/10' 
              : 'border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-800/80 bg-slate-50/40 dark:bg-slate-950/10'}
          `}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv, .xlsx, .xls, .pdf, .docx, .doc, .json"
            className="hidden"
          />

          {loading ? (
            <div className="space-y-3 flex flex-col items-center">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{loadingStep}</p>
              <p className="text-[10px] text-slate-400 animate-pulse">Running advanced schema transformations...</p>
            </div>
          ) : (
            <div className="space-y-3 flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-500 dark:text-slate-400">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Drag and drop statement files here, or <span className="text-blue-500 font-bold">browse</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  Supports CSV, Excel (XLSX), Word (DOCX), PDF, and JSON
                </p>
              </div>
              
              {/* Feature Tags Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40 w-full max-w-sm flex items-center justify-center gap-4 text-[10px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-500" /> Offline CSV/JSON Parsing
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-blue-500" /> Online Multimodal AI Mapping
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages Feed */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{error}</span>
          </motion.div>
        )}

        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-900/50 text-green-600 dark:text-green-400 text-xs flex items-center gap-2.5"
          >
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline Pending Queue Display */}
      {!isOnline && offlineQueue.length > 0 && (
        <div className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10 space-y-2">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Queued Binary Statements ({offlineQueue.length})</span>
          </p>
          <div className="space-y-1.5">
            {offlineQueue.map((file) => (
              <div key={file.id} className="flex items-center justify-between text-xs px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/40 dark:border-slate-800/55">
                <span className="text-slate-600 dark:text-slate-400 font-medium">{file.name}</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md uppercase">
                  Pending Sync
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review and Approval Panel */}
      {parsedTxs.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* List Title Control Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-850">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ListFilter className="w-4 h-4 text-blue-500" />
                <span>Verify Extracted Entries ({importingFile})</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Please review matching categories, types, and values before filing into the ledger.</p>
            </div>

            <button
              onClick={toggleAll}
              className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {parsedTxs.every(t => t.selected) ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Transactions List Container */}
          <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1 border border-slate-100 dark:border-slate-850 p-2 rounded-xl">
            {parsedTxs.map((tx) => (
              <div 
                key={tx.id}
                className={`
                  flex flex-col md:flex-row items-stretch md:items-center gap-3.5 p-3.5 rounded-xl border transition-all
                  ${tx.selected 
                    ? 'border-blue-200/80 dark:border-blue-900/40 bg-blue-500/[0.015] dark:bg-blue-500/[0.01]' 
                    : 'border-slate-100 dark:border-slate-800 opacity-60'}
                `}
              >
                {/* Checkbox Select Toggle */}
                <button
                  onClick={() => toggleSelect(tx.id)}
                  className={`
                    w-5 h-5 rounded-md flex items-center justify-center shrink-0 border cursor-pointer transition-colors
                    ${tx.selected 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'}
                  `}
                >
                  {tx.selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                {/* Input Fields Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 flex-1">
                  
                  {/* Notes / Description */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Notes / Merchant</span>
                    <input
                      type="text"
                      value={tx.notes}
                      onChange={(e) => updateParsedField(tx.id, 'notes', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Type Toggle & Amount */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Type & Value</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateParsedField(tx.id, 'type', tx.type === 'income' ? 'expense' : 'income')}
                        className={`
                          px-2 py-1.5 rounded-lg text-[10px] font-extrabold uppercase shrink-0 transition-colors cursor-pointer
                          ${tx.type === 'income' 
                            ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                            : 'bg-red-500/10 text-red-600 border border-red-500/20'}
                        `}
                      >
                        {tx.type}
                      </button>
                      <input
                        type="number"
                        value={tx.amount || ''}
                        onChange={(e) => updateParsedField(tx.id, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                      />
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Category Category</span>
                    <select
                      value={tx.categoryId}
                      onChange={(e) => updateParsedField(tx.id, 'categoryId', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    >
                      <option value="">No Category</option>
                      {categories
                        .filter(c => c.type === tx.type)
                        .map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                  </div>

                  {/* Date Input */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Posting Date</span>
                    <input
                      type="date"
                      value={tx.date}
                      onChange={(e) => updateParsedField(tx.id, 'date', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>

                </div>

                {/* Delete Entry Button */}
                <button
                  onClick={() => deleteParsedItem(tx.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors shrink-0 cursor-pointer self-end md:self-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Import Dashboard Summary Panel */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Left stats counters */}
            <div className="flex items-center gap-5 text-xs text-slate-600 dark:text-slate-400 font-semibold">
              <div>
                Selected: <span className="text-slate-950 dark:text-white font-extrabold">{selectedCount}</span> of {parsedTxs.length}
              </div>
              <div className="flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                Income: <span className="text-green-600 dark:text-green-400 font-extrabold">${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4 text-red-500" />
                Expense: <span className="text-red-600 dark:text-red-400 font-extrabold">${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelImport}
                className="px-4 py-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Discard
              </button>
              <button
                onClick={handleFinalImport}
                disabled={selectedCount === 0}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white text-xs font-extrabold shadow-sm hover:shadow-blue-500/10 transition-all cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve & Import {selectedCount} Record{selectedCount === 1 ? '' : 's'}</span>
              </button>
            </div>

          </div>
        </motion.div>
      )}

    </div>
  );
}
