import { SyncQueueItem, Transaction, Budget, SavingsGoal, Subscription, Category } from '../types';

const DB_NAME = 'budgetflow_indexeddb';
const DB_VERSION = 1;

export class LocalDatabase {
  private db: IDBDatabase | null = null;

  public init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB failed to open.');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
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

        // Action queue for offline sync
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id' });
        }
      };
    });
  }

  // --- Generic Store CRUD Helpers ---
  private getStore(storeName: string, mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  public getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore(storeName, 'readonly');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  public put<T>(storeName: string, item: T): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore(storeName, 'readwrite');
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  public delete(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore(storeName, 'readwrite');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  public clearStore(storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore(storeName, 'readwrite');
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  // --- Cache Batch Replacers (invoked on sync complete) ---
  public async cacheAll(
    transactions: Transaction[],
    budgets: Budget[],
    goals: SavingsGoal[],
    subscriptions: Subscription[],
    categories: Category[]
  ): Promise<void> {
    await this.clearStore('transactions');
    await this.clearStore('budgets');
    await this.clearStore('goals');
    await this.clearStore('subscriptions');
    await this.clearStore('categories');

    for (const t of transactions) await this.put('transactions', t);
    for (const b of budgets) await this.put('budgets', b);
    for (const g of goals) await this.put('goals', g);
    for (const s of subscriptions) await this.put('subscriptions', s);
    for (const c of categories) await this.put('categories', c);
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
