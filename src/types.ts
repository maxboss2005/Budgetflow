/**
 * Shared Type Definitions for BudgetFlow FinTech SaaS
 */

export interface User {
  id: string;
  email: string;
  name: string;
  currency: string;      // e.g., "USD", "EUR", "GBP", "NGN"
  language: string;      // e.g., "en", "es", "fr"
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  createdAt: string;
  points?: number;
  level?: number;
  achievements?: string[];
  role?: 'admin' | 'user';
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;         // Hex code or Tailwind color class
  icon: string;          // Lucide icon name
  isCustom?: boolean;
  userId?: string;       // Present if user-created
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  categoryId: string;    // Maps to Category.id
  categoryName?: string;  // Resolved name for ease of rendering
  categoryIcon?: string;  // Resolved icon for ease of rendering
  categoryColor?: string; // Resolved color for ease of rendering
  date: string;          // ISO string YYYY-MM-DD
  notes?: string;
  receiptUrl?: string;   // Local Base64 or mock file path
  isRecurring?: boolean;
  recurrenceRule?: 'weekly' | 'monthly' | 'yearly';
  offlineId?: string;    // Temporary local ID
  isSynced?: boolean;    // For offline-first syncing
  createdAt: string;
  accountId?: string;    // Source account ID
  toAccountId?: string;  // Destination account ID (for transfers)
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;    // 'all' or specific Category.id
  categoryName?: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  offlineId?: string;    // Temporary local ID
  createdAt?: string;
  accountId?: string;   // Optional core finance account linkage
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;     // YYYY-MM-DD
  targetDate?: string;   // UI Alias YYYY-MM-DD
  color: string;
  icon: string;
  status?: string;       // Active or Completed status flags
  offlineId?: string;    // Temporary local ID
  createdAt: string;
  accountId?: string;   // Optional core finance account linkage
}

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly' | 'custom';
  customDays?: number;
  nextBillingDate: string; // YYYY-MM-DD
  status: 'active' | 'cancelled';
  categoryId: string;
  notes?: string;
  renewalReminderEnabled: boolean;
  offlineId?: string;    // Temporary local ID
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'budget_alert' | 'spending_alert' | 'bill_reminder' | 'subscription_reminder' | 'savings_milestone' | 'summary' | 'system';
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  entityType: 'transaction' | 'budget' | 'goal' | 'subscription' | 'category' | 'account' | 'debt';
  payload: any;
  timestamp: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: 'cash' | 'bank' | 'savings' | 'crypto' | 'wallet';
  balance: number;
  color?: string; // Optional hex or Tailwind color class
  createdAt: string;
  offlineId?: string;
}

export interface Debt {
  id: string;
  userId: string;
  name: string;
  type: 'loan' | 'credit_card' | 'mortgage' | 'other';
  totalPrincipal: number;
  currentBalance: number;
  interestRate: number; // e.g., 5.5 for 5.5% annual interest
  minMonthlyPayment: number;
  dueDate?: string; // YYYY-MM-DD
  createdAt: string;
  offlineId?: string;
}
