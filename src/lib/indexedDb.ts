import { SyncQueueItem, Transaction, Budget, SavingsGoal, Subscription, Category, Account, Debt } from '../types';

const DB_NAME = 'devfint_indexeddb';
const DB_VERSION = 2;

export class LocalDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private isFallback = false;
  private memoryStores: Record<string, Map<string, any>> = {};

  private initMemoryStores() {
    this.isFallback = true;
    const stores = ['transactions', 'budgets', 'goals', 'subscriptions', 'categories', 'accounts', 'debts', 'sync_queue'];
    stores.forEach(s => {
      this.memoryStores[s] = new Map();
    });
  }

  public init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve) => {
      if (this.db || this.isFallback) {
        resolve();
        return;
      }

      if (typeof indexedDB === 'undefined') {
        console.warn('indexedDB is not available in this environment. Falling back to in-memory database.');
        this.initMemoryStores();
        resolve();
        return;
      }

      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
          console.warn('IndexedDB failed to open. Falling back to in-memory database.', event);
          this.initMemoryStores();
          resolve();
        };

        request.onsuccess = () => {
          const dbInstance = request.result;
          this.db = dbInstance;

          dbInstance.onversionchange = () => {
            console.warn('IndexedDB version change detected. Closing connection to prevent blocking.');
            dbInstance.close();
            if (this.db === dbInstance) {
              this.db = null;
              this.initPromise = null;
            }
          };

          dbInstance.onclose = () => {
            console.warn('IndexedDB connection closed.');
            if (this.db === dbInstance) {
              this.db = null;
              this.initPromise = null;
            }
          };

          resolve();
        };

        request.onupgradeneeded = () => {
          const db = request.result;
          
          // Caching stores
          if (!db.objectStoreNames.contains('transactions')) {
            db.createObjectStore('transactions', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('budgets')) {
            db.createObjectStore('budgets', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('goals')) {
            db.createObjectStore('goals', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('subscriptions')) {
            db.createObjectStore('subscriptions', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('categories')) {
            db.createObjectStore('categories', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('accounts')) {
            db.createObjectStore('accounts', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('debts')) {
            db.createObjectStore('debts', { keyPath: 'id' });
          }

          // Action queue for offline sync
          if (!db.objectStoreNames.contains('sync_queue')) {
            db.createObjectStore('sync_queue', { keyPath: 'id' });
          }
        };
      } catch (err) {
        console.warn('Exception during IndexedDB initialization. Falling back to in-memory database.', err);
        this.initMemoryStores();
        resolve();
      }
    });

    return this.initPromise;
  }

  // --- Generic Store CRUD Helpers ---
  private async getStore(storeName: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
    await this.init();
    if (this.isFallback) {
      throw new Error('Database is running in in-memory fallback mode');
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    try {
      const transaction = this.db.transaction(storeName, mode);
      return transaction.objectStore(storeName);
    } catch (err: any) {
      if (
        err.name === 'InvalidStateError' || 
        err.message?.includes('closing') || 
        err.message?.includes('closed')
      ) {
        console.warn('Database connection is in invalid or closing state. Attempting clean recovery...', err);
        try {
          this.db?.close();
        } catch (e) {}
        this.db = null;
        this.initPromise = null;
        
        // Retry once with new connection
        await this.init();
        if (this.isFallback) {
          throw new Error('Database is running in in-memory fallback mode');
        }
        if (!this.db) {
          throw new Error('Database recovery failed: could not re-initialize');
        }
        const transaction = this.db.transaction(storeName, mode);
        return transaction.objectStore(storeName);
      }
      throw err;
    }
  }

  public async getAll<T>(storeName: string): Promise<T[]> {
    if (this.isFallback) {
      const map = this.memoryStores[storeName];
      return map ? (Array.from(map.values()) as T[]) : [];
    }
    const store = await this.getStore(storeName, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public async put<T>(storeName: string, item: T): Promise<void> {
    if (this.isFallback) {
      const map = this.memoryStores[storeName];
      if (map) {
        const id = (item as any).id || 'key_' + Math.random().toString(36).substring(2, 11);
        map.set(id, item);
      }
      return;
    }
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async delete(storeName: string, id: string): Promise<void> {
    if (this.isFallback) {
      const map = this.memoryStores[storeName];
      if (map) {
        map.delete(id);
      }
      return;
    }
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async clearStore(storeName: string): Promise<void> {
    if (this.isFallback) {
      const map = this.memoryStores[storeName];
      if (map) {
        map.clear();
      }
      return;
    }
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- Cache Batch Replacers (invoked on sync complete) ---
  public async cacheAll(
    transactions: Transaction[],
    budgets: Budget[],
    goals: SavingsGoal[],
    subscriptions: Subscription[],
    categories: Category[],
    accounts?: Account[],
    debts?: Debt[]
  ): Promise<void> {
    await this.clearStore('transactions');
    await this.clearStore('budgets');
    await this.clearStore('goals');
    await this.clearStore('subscriptions');
    await this.clearStore('categories');
    try {
      await this.clearStore('accounts');
      await this.clearStore('debts');
    } catch (e) {
      console.warn('Accounts or debts clear store failed.', e);
    }

    for (const t of transactions) await this.put('transactions', t);
    for (const b of budgets) await this.put('budgets', b);
    for (const g of goals) await this.put('goals', g);
    for (const s of subscriptions) await this.put('subscriptions', s);
    for (const c of categories) await this.put('categories', c);

    if (accounts) {
      for (const a of accounts) await this.put('accounts', a);
    }
    if (debts) {
      for (const d of debts) await this.put('debts', d);
    }
  }

  // --- Offline Sync Queue Helpers ---
  public async addToQueue(action: SyncQueueItem['action'], entityType: SyncQueueItem['entityType'], payload: any): Promise<void> {
    const item: SyncQueueItem = {
      id: 'sync_' + Math.random().toString(36).substring(2, 11),
      action,
      entityType,
      payload,
      timestamp: new Date().toISOString()
    };
    await this.put('sync_queue', item);
  }

  public getQueue(): Promise<SyncQueueItem[]> {
    return this.getAll<SyncQueueItem>('sync_queue');
  }

  public async removeFromQueue(id: string): Promise<void> {
    await this.delete('sync_queue', id);
  }

  public async clearQueue(): Promise<void> {
    await this.clearStore('sync_queue');
  }
}

export const localDb = new LocalDatabase();
