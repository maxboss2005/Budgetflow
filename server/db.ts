import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, Category, Transaction, Budget, SavingsGoal, Subscription, AppNotification } from '../src/types.js';

interface UserDBRecord extends Omit<User, 'password'> {
  passwordHash: string;
  salt: string;
}

interface DatabaseSchema {
  users: Record<string, UserDBRecord>;
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  subscriptions: Subscription[];
  notifications: AppNotification[];
}

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Default premium categories
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-salary', name: 'Salary', type: 'income', color: '#10B981', icon: 'Briefcase' },
  { id: 'cat-freelance', name: 'Freelance', type: 'income', color: '#34D399', icon: 'Laptop' },
  { id: 'cat-food', name: 'Food', type: 'expense', color: '#EF4444', icon: 'Utensils' },
  { id: 'cat-transport', name: 'Transport', type: 'expense', color: '#3B82F6', icon: 'Car' },
  { id: 'cat-shopping', name: 'Shopping', type: 'expense', color: '#EC4899', icon: 'ShoppingBag' },
  { id: 'cat-bills', name: 'Bills & Utilities', type: 'expense', color: '#F59E0B', icon: 'FileText' },
  { id: 'cat-health', name: 'Health', type: 'expense', color: '#10B981', icon: 'Heart' },
  { id: 'cat-education', name: 'Education', type: 'expense', color: '#8B5CF6', icon: 'GraduationCap' },
  { id: 'cat-entertainment', name: 'Entertainment', type: 'expense', color: '#6366F1', icon: 'Play' },
  { id: 'cat-rent', name: 'Rent', type: 'expense', color: '#A855F7', icon: 'Home' },
  { id: 'cat-others', name: 'Others', type: 'expense', color: '#6B7280', icon: 'Sparkles' },
];

export class Database {
  private schema: DatabaseSchema = {
    users: {},
    categories: [...DEFAULT_CATEGORIES],
    transactions: [],
    budgets: [],
    goals: [],
    subscriptions: [],
    notifications: [],
  };

  constructor() {
    this.ensureDirectory();
    this.load();
    this.ensureSeedData();
  }

  private ensureDirectory() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private load() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        this.schema = JSON.parse(data);
      } else {
        this.save();
      }
    } catch (e) {
      console.error('Failed to load database. Initializing empty schema.', e);
      this.save();
    }
  }

  public save() {
    try {
      this.ensureDirectory();
      fs.writeFileSync(DB_PATH, JSON.stringify(this.schema, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save database.', e);
    }
  }

  // --- Password Hashing ---
  public hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  }

  public generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  // --- User Operations ---
  public createUser(email: string, password: string, name: string): UserDBRecord {
    const emailLower = email.toLowerCase().trim();
    if (this.schema.users[emailLower]) {
      throw new Error('User already exists');
    }

    const salt = this.generateSalt();
    const passwordHash = this.hashPassword(password, salt);
    const id = 'usr_' + crypto.randomBytes(8).toString('hex');

    const newUser: UserDBRecord = {
      id,
      email: emailLower,
      name,
      currency: 'USD',
      language: 'en',
      theme: 'dark',
      notificationsEnabled: true,
      createdAt: new Date().toISOString(),
      points: 150,
      level: 1,
      achievements: ['Budget Pioneer'],
      passwordHash,
      salt,
    };

    this.schema.users[emailLower] = newUser;
    this.save();
    return newUser;
  }

  public findUserByEmail(email: string): UserDBRecord | null {
    return this.schema.users[email.toLowerCase().trim()] || null;
  }

  public findUserById(id: string): UserDBRecord | null {
    const user = Object.values(this.schema.users).find((u) => u.id === id);
    return user || null;
  }

  public updateUser(userId: string, updates: Partial<User>): User {
    const user = Object.values(this.schema.users).find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    Object.assign(user, updates);
    this.save();

    // Return without hash & salt
    const { passwordHash, salt, ...cleanUser } = user;
    return cleanUser;
  }

  public deleteUserAccount(userId: string) {
    const user = Object.values(this.schema.users).find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    delete this.schema.users[user.email];
    this.schema.transactions = this.schema.transactions.filter(t => t.userId !== userId);
    this.schema.budgets = this.schema.budgets.filter(b => b.userId !== userId);
    this.schema.goals = this.schema.goals.filter(g => g.userId !== userId);
    this.schema.subscriptions = this.schema.subscriptions.filter(s => s.userId !== userId);
    this.schema.notifications = this.schema.notifications.filter(n => n.userId !== userId);
    this.schema.categories = this.schema.categories.filter(c => !c.isCustom || c.userId !== userId);
    this.save();
  }

  // --- Category Operations ---
  public getCategories(userId: string): Category[] {
    return this.schema.categories.filter(c => !c.isCustom || c.userId === userId);
  }

  public createCategory(userId: string, name: string, type: 'income' | 'expense', color: string, icon: string): Category {
    const categories = this.getCategories(userId);
    const exists = categories.find(c => c.name.toLowerCase() === name.toLowerCase() && c.type === type);
    if (exists) return exists;

    const newCat: Category = {
      id: 'cat_' + crypto.randomBytes(8).toString('hex'),
      name,
      type,
      color,
      icon,
      isCustom: true,
      userId,
    };

    this.schema.categories.push(newCat);
    this.save();
    return newCat;
  }

  public updateCategory(userId: string, categoryId: string, updates: Partial<Category>): Category {
    const idx = this.schema.categories.findIndex(c => c.id === categoryId);
    if (idx === -1) throw new Error('Category not found');

    const updated = {
      ...this.schema.categories[idx],
      ...updates,
    };
    this.schema.categories[idx] = updated;
    this.save();
    return updated;
  }

  // --- Transaction Operations ---
  public getTransactions(userId: string): Transaction[] {
    return this.schema.transactions
      .filter(t => t.userId === userId)
      .map(t => {
        const cat = this.schema.categories.find(c => c.id === t.categoryId);
        return {
          ...t,
          categoryName: cat?.name || 'Unknown',
          categoryIcon: cat?.icon || 'HelpCircle',
          categoryColor: cat?.color || '#9CA3AF',
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public createTransaction(userId: string, tx: Omit<Transaction, 'id' | 'userId' | 'createdAt'>): Transaction {
    const newTx: Transaction = {
      ...tx,
      id: 'tx_' + crypto.randomBytes(8).toString('hex'),
      userId,
      createdAt: new Date().toISOString(),
      isSynced: true,
    };
    this.schema.transactions.push(newTx);
    this.save();
    return newTx;
  }

  public updateTransaction(userId: string, txId: string, updates: Partial<Transaction>): Transaction {
    const idx = this.schema.transactions.findIndex(t => t.id === txId && t.userId === userId);
    if (idx === -1) throw new Error('Transaction not found');

    const updated = {
      ...this.schema.transactions[idx],
      ...updates,
      userId, // guarantee safety
      isSynced: true,
    };

    this.schema.transactions[idx] = updated;
    this.save();
    return updated;
  }

  public deleteTransaction(userId: string, txId: string): boolean {
    const originalLength = this.schema.transactions.length;
    this.schema.transactions = this.schema.transactions.filter(t => !(t.id === txId && t.userId === userId));
    const success = this.schema.transactions.length < originalLength;
    if (success) this.save();
    return success;
  }

  // --- Budget Operations ---
  public getBudgets(userId: string): Budget[] {
    return this.schema.budgets
      .filter(b => b.userId === userId)
      .map(b => {
        const cat = this.schema.categories.find(c => c.id === b.categoryId);
        return {
          ...b,
          categoryName: b.categoryId === 'all' ? 'All Spending' : (cat?.name || 'Unknown'),
        };
      });
  }

  public createBudget(userId: string, budget: Omit<Budget, 'id' | 'userId'>): Budget {
    const id = 'bdg_' + crypto.randomBytes(8).toString('hex');
    const newBudget: Budget = {
      ...budget,
      id,
      userId,
    };
    this.schema.budgets.push(newBudget);
    this.save();
    return newBudget;
  }

  public deleteBudget(userId: string, budgetId: string): boolean {
    const originalLength = this.schema.budgets.length;
    this.schema.budgets = this.schema.budgets.filter(b => !(b.id === budgetId && b.userId === userId));
    const success = this.schema.budgets.length < originalLength;
    if (success) this.save();
    return success;
  }

  // --- Savings Goals Operations ---
  public getGoals(userId: string): SavingsGoal[] {
    return this.schema.goals.filter(g => g.userId === userId);
  }

  public createGoal(userId: string, goal: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt'>): SavingsGoal {
    const id = 'goal_' + crypto.randomBytes(8).toString('hex');
    const newGoal: SavingsGoal = {
      ...goal,
      id,
      userId,
      createdAt: new Date().toISOString(),
    };
    this.schema.goals.push(newGoal);
    this.save();
    return newGoal;
  }

  public updateGoal(userId: string, goalId: string, updates: Partial<SavingsGoal>): SavingsGoal {
    const idx = this.schema.goals.findIndex(g => g.id === goalId && g.userId === userId);
    if (idx === -1) throw new Error('Savings goal not found');

    const updated = {
      ...this.schema.goals[idx],
      ...updates,
      userId,
    };
    this.schema.goals[idx] = updated;
    this.save();
    return updated;
  }

  public deleteGoal(userId: string, goalId: string): boolean {
    const originalLength = this.schema.goals.length;
    this.schema.goals = this.schema.goals.filter(g => !(g.id === goalId && g.userId === userId));
    const success = this.schema.goals.length < originalLength;
    if (success) this.save();
    return success;
  }

  // --- Subscriptions Operations ---
  public getSubscriptions(userId: string): Subscription[] {
    return this.schema.subscriptions.filter(s => s.userId === userId);
  }

  public createSubscription(userId: string, sub: Omit<Subscription, 'id' | 'userId' | 'createdAt'>): Subscription {
    const id = 'sub_' + crypto.randomBytes(8).toString('hex');
    const newSub: Subscription = {
      ...sub,
      id,
      userId,
      createdAt: new Date().toISOString(),
    };
    this.schema.subscriptions.push(newSub);
    this.save();
    return newSub;
  }

  public updateSubscription(userId: string, subId: string, updates: Partial<Subscription>): Subscription {
    const idx = this.schema.subscriptions.findIndex(s => s.id === subId && s.userId === userId);
    if (idx === -1) throw new Error('Subscription not found');

    const updated = {
      ...this.schema.subscriptions[idx],
      ...updates,
      userId,
    };
    this.schema.subscriptions[idx] = updated;
    this.save();
    return updated;
  }

  public deleteSubscription(userId: string, subId: string): boolean {
    const originalLength = this.schema.subscriptions.length;
    this.schema.subscriptions = this.schema.subscriptions.filter(s => !(s.id === subId && s.userId === userId));
    const success = this.schema.subscriptions.length < originalLength;
    if (success) this.save();
    return success;
  }

  // --- Notifications Operations ---
  public getNotifications(userId: string): AppNotification[] {
    return this.schema.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createNotification(userId: string, type: AppNotification['type'], message: string): AppNotification {
    const newNotif: AppNotification = {
      id: 'notif_' + crypto.randomBytes(8).toString('hex'),
      userId,
      type,
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.schema.notifications.push(newNotif);
    this.save();
    return newNotif;
  }

  public markNotificationRead(userId: string, notifId: string): boolean {
    const notif = this.schema.notifications.find(n => n.id === notifId && n.userId === userId);
    if (notif) {
      notif.isRead = true;
      this.save();
      return true;
    }
    return false;
  }

  public markAllNotificationsRead(userId: string) {
    this.schema.notifications.forEach(n => {
      if (n.userId === userId) n.isRead = true;
    });
    this.save();
  }

  // --- Offline Synchronization Queue Handler ---
  public synchronizeQueue(userId: string, queue: any[]): { success: boolean, syncedCount: number } {
    let syncedCount = 0;
    
    // Sort transactions/actions chronologically to ensure consistency
    const sortedQueue = [...queue].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    for (const item of sortedQueue) {
      const { action, entityType, payload } = item;
      try {
        if (entityType === 'transaction') {
          if (action === 'create') {
            // Check for potential duplicate by matching offlineId or date+amount+notes
            const duplicate = this.schema.transactions.find(t => {
              if (t.userId !== userId) return false;
              if (payload.id) {
                return t.offlineId === payload.id || t.id === payload.id;
              }
              return t.amount === payload.amount && 
                     t.date === payload.date && 
                     t.categoryId === payload.categoryId &&
                     t.notes === payload.notes;
            });
            if (!duplicate) {
              const { id, isSynced, offlineId, ...cleanPayload } = payload;
              this.createTransaction(userId, {
                ...cleanPayload,
                offlineId: payload.id
              });
              syncedCount++;
            }
          } else if (action === 'update') {
            const dbTx = this.schema.transactions.find(t => t.userId === userId && (t.id === payload.id || t.offlineId === payload.id));
            if (dbTx) {
              this.updateTransaction(userId, dbTx.id, payload.updates || payload);
              syncedCount++;
            }
          } else if (action === 'delete') {
            const dbTx = this.schema.transactions.find(t => t.userId === userId && (t.id === payload.id || t.offlineId === payload.id));
            if (dbTx) {
              this.deleteTransaction(userId, dbTx.id);
              syncedCount++;
            }
          }
        } else if (entityType === 'budget') {
          if (action === 'create') {
            const { id, isSynced, offlineId, ...cleanPayload } = payload;
            this.createBudget(userId, {
              ...cleanPayload,
              offlineId: payload.id
            } as any);
            syncedCount++;
          } else if (action === 'delete') {
            const dbBudget = this.schema.budgets.find(b => b.userId === userId && (b.id === payload.id || b.offlineId === payload.id));
            if (dbBudget) {
              this.deleteBudget(userId, dbBudget.id);
              syncedCount++;
            }
          }
        } else if (entityType === 'goal') {
          if (action === 'create') {
            const { id, isSynced, offlineId, ...cleanPayload } = payload;
            this.createGoal(userId, {
              ...cleanPayload,
              offlineId: payload.id
            } as any);
            syncedCount++;
          } else if (action === 'update') {
            const dbGoal = this.schema.goals.find(g => g.userId === userId && (g.id === payload.id || g.offlineId === payload.id));
            if (dbGoal) {
              this.updateGoal(userId, dbGoal.id, payload.updates || payload);
              syncedCount++;
            }
          } else if (action === 'delete') {
            const dbGoal = this.schema.goals.find(g => g.userId === userId && (g.id === payload.id || g.offlineId === payload.id));
            if (dbGoal) {
              this.deleteGoal(userId, dbGoal.id);
              syncedCount++;
            }
          }
        } else if (entityType === 'subscription') {
          if (action === 'create') {
            const { id, isSynced, offlineId, ...cleanPayload } = payload;
            this.createSubscription(userId, {
              ...cleanPayload,
              offlineId: payload.id
            } as any);
            syncedCount++;
          } else if (action === 'update') {
            const dbSub = this.schema.subscriptions.find(s => s.userId === userId && (s.id === payload.id || s.offlineId === payload.id));
            if (dbSub) {
              this.updateSubscription(userId, dbSub.id, payload.updates || payload);
              syncedCount++;
            }
          } else if (action === 'delete') {
            const dbSub = this.schema.subscriptions.find(s => s.userId === userId && (s.id === payload.id || s.offlineId === payload.id));
            if (dbSub) {
              this.deleteSubscription(userId, dbSub.id);
              syncedCount++;
            }
          }
        } else if (entityType === 'category') {
          if (action === 'create') {
            this.createCategory(userId, payload.name, payload.type, payload.color, payload.icon);
            syncedCount++;
          } else if (action === 'update') {
            this.updateCategory(userId, payload.id, payload.updates || payload);
            syncedCount++;
          }
        }
      } catch (err) {
        console.error(`Error syncing queue item of type ${entityType} and action ${action}:`, err);
      }
    }

    if (syncedCount > 0) {
      this.save();
    }
    
    return { success: true, syncedCount };
  }

  // --- Seed Data Setup ---
  private ensureSeedData() {
    // If we have no users, we create the pre-populated premium user account
    const demoEmail = 'user@budgetflow.com';
    let demoUser = this.findUserByEmail(demoEmail);

    if (!demoUser) {
      console.log('Seeding database with premium demo account user@budgetflow.com (password123)...');
      demoUser = this.createUser(demoEmail, 'password123', 'John Doe');
      const userId = demoUser.id;
      
      this.updateUser(userId, {
        points: 2450,
        level: 3,
        achievements: ['Budget Pioneer', 'Savings Hero', 'AI Mind explorer']
      });

      // Seed categories (the defaults are already registered, let's add one custom)
      this.createCategory(userId, 'Gym & Fitness', 'expense', '#EC4899', 'Dumbbell');

      // Seed transactions over the last 30 days
      const now = new Date();
      const getPastDate = (daysAgo: number) => {
        const d = new Date(now);
        d.setDate(d.getDate() - daysAgo);
        return d.toISOString().split('T')[0];
      };

      // Income records
      this.createTransaction(userId, {
        amount: 5400,
        type: 'income',
        categoryId: 'cat-salary',
        date: getPastDate(25),
        notes: 'Monthly principal corporate salary payment',
        isRecurring: true,
        recurrenceRule: 'monthly'
      });
      this.createTransaction(userId, {
        amount: 1200,
        type: 'income',
        categoryId: 'cat-freelance',
        date: getPastDate(12),
        notes: 'SaaS landing page redesign project payment',
      });
      this.createTransaction(userId, {
        amount: 850,
        type: 'income',
        categoryId: 'cat-freelance',
        date: getPastDate(2),
        notes: 'Consulting call advisory hours',
      });

      // Expense records
      this.createTransaction(userId, {
        amount: 1500,
        type: 'expense',
        categoryId: 'cat-rent',
        date: getPastDate(28),
        notes: 'Downtown luxury apartment monthly rent',
        isRecurring: true,
        recurrenceRule: 'monthly'
      });
      this.createTransaction(userId, {
        amount: 120,
        type: 'expense',
        categoryId: 'cat-food',
        date: getPastDate(20),
        notes: 'Whole Foods organic weekly groceries run',
      });
      this.createTransaction(userId, {
        amount: 45,
        type: 'expense',
        categoryId: 'cat-transport',
        date: getPastDate(18),
        notes: 'Uber Premium trips downtown',
      });
      this.createTransaction(userId, {
        amount: 250,
        type: 'expense',
        categoryId: 'cat-shopping',
        date: getPastDate(15),
        notes: 'Designer clothing store purchases',
      });
      this.createTransaction(userId, {
        amount: 189,
        type: 'expense',
        categoryId: 'cat-bills',
        date: getPastDate(14),
        notes: 'Smart Home high speed broadband internet & grid electricity',
        isRecurring: true,
        recurrenceRule: 'monthly'
      });
      this.createTransaction(userId, {
        amount: 85,
        type: 'expense',
        categoryId: 'cat-entertainment',
        date: getPastDate(10),
        notes: 'Cinematic IMAX movie ticket and concession snacks',
      });
      this.createTransaction(userId, {
        amount: 140,
        type: 'expense',
        categoryId: 'cat-food',
        date: getPastDate(8),
        notes: 'Premium rooftop sushi dinner with friends',
      });
      this.createTransaction(userId, {
        amount: 60,
        type: 'expense',
        categoryId: 'cat-health',
        date: getPastDate(5),
        notes: 'Pharmacy prescription remedies',
      });
      this.createTransaction(userId, {
        amount: 35,
        type: 'expense',
        categoryId: 'cat-transport',
        date: getPastDate(4),
        notes: 'Train travel commuter card refill',
      });
      this.createTransaction(userId, {
        amount: 15,
        type: 'expense',
        categoryId: 'cat-entertainment',
        date: getPastDate(3),
        notes: 'Premium music streaming service subscription',
        isRecurring: true,
        recurrenceRule: 'monthly'
      });
      this.createTransaction(userId, {
        amount: 110,
        type: 'expense',
        categoryId: 'cat-shopping',
        date: getPastDate(1),
        notes: 'Home decor workspace accessories',
      });

      // Seed budgets
      this.createBudget(userId, {
        categoryId: 'all',
        amount: 3500,
        period: 'monthly',
        startDate: getPastDate(30),
        endDate: getPastDate(-30)
      });
      this.createBudget(userId, {
        categoryId: 'cat-food',
        amount: 500,
        period: 'monthly',
        startDate: getPastDate(30),
        endDate: getPastDate(-30)
      });
      this.createBudget(userId, {
        categoryId: 'cat-transport',
        amount: 150,
        period: 'monthly',
        startDate: getPastDate(30),
        endDate: getPastDate(-30)
      });

      // Seed savings goals
      this.createGoal(userId, {
        name: 'Tesla Model Y Premium',
        targetAmount: 52000,
        currentAmount: 14500,
        deadline: getPastDate(-365),
        color: '#3B82F6',
        icon: 'Car'
      });
      this.createGoal(userId, {
        name: 'Japan Autumn Escape',
        targetAmount: 8500,
        currentAmount: 6200,
        deadline: getPastDate(-90),
        color: '#EF4444',
        icon: 'Plane'
      });
      this.createGoal(userId, {
        name: 'Emergency Fund (6 Months)',
        targetAmount: 24000,
        currentAmount: 18000,
        deadline: getPastDate(-180),
        color: '#10B981',
        icon: 'ShieldCheck'
      });

      // Seed subscriptions
      this.createSubscription(userId, {
        name: 'Netflix Premium UHD',
        amount: 22.99,
        billingCycle: 'monthly',
        nextBillingDate: getPastDate(-14),
        status: 'active',
        categoryId: 'cat-entertainment',
        notes: '4K multi-device family subscription stream',
        renewalReminderEnabled: true
      });
      this.createSubscription(userId, {
        name: 'Github Copilot Pro',
        amount: 10.00,
        billingCycle: 'monthly',
        nextBillingDate: getPastDate(-5),
        status: 'active',
        categoryId: 'cat-education',
        notes: 'AI auto-completions pair programmer workspace',
        renewalReminderEnabled: true
      });
      this.createSubscription(userId, {
        name: 'Adobe Creative Suite',
        amount: 54.99,
        billingCycle: 'monthly',
        nextBillingDate: getPastDate(-10),
        status: 'active',
        categoryId: 'cat-freelance',
        notes: 'Photoshop, Illustrator & Premiere design workstation',
        renewalReminderEnabled: true
      });

      // Seed notifications
      this.createNotification(userId, 'system', 'Welcome to BudgetFlow! Explore your pre-populated high-net-worth developer workspace.');
      this.createNotification(userId, 'savings_milestone', 'Emergency Fund Goal milestone: You have reached 75% of your target savings!');
      this.createNotification(userId, 'budget_alert', 'Warning: Food budget has reached 52% utilization for this billing period.');
    }
  }
}

export const db = new Database();
