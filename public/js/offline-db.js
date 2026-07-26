// IndexedDB Manager for Offline Support
class OfflineDB {
  constructor() {
    this.dbName = 'CountoryDB';
    this.dbVersion = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Pending scans store
        if (!db.objectStoreNames.contains('pendingScans')) {
          const scanStore = db.createObjectStore('pendingScans', { keyPath: 'id', autoIncrement: true });
          scanStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          scanStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Offline data store
        if (!db.objectStoreNames.contains('offlineData')) {
          const dataStore = db.createObjectStore('offlineData', { keyPath: 'id' });
          dataStore.createIndex('type', 'type', { unique: false });
        }

        // Cache store for products, warehouses, etc.
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
    });
  }

  async addPendingScan(scanData) {
    const db = this.db || await this.init();
    const tx = db.transaction('pendingScans', 'readwrite');
    const store = tx.objectStore('pendingScans');

    return new Promise((resolve, reject) => {
      const request = store.add({
        data: scanData,
        syncStatus: 'pending',
        createdAt: new Date().toISOString(),
      });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingScans() {
    const db = this.db || await this.init();
    const tx = db.transaction('pendingScans', 'readonly');
    const store = tx.objectStore('pendingScans');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePendingScan(id) {
    const db = this.db || await this.init();
    const tx = db.transaction('pendingScans', 'readwrite');
    const store = tx.objectStore('pendingScans');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearPendingScans() {
    const db = this.db || await this.init();
    const tx = db.transaction('pendingScans', 'readwrite');
    const store = tx.objectStore('pendingScans');

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async cacheData(key, data) {
    const db = this.db || await this.init();
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');

    return new Promise((resolve, reject) => {
      const request = store.put({ key, data, cachedAt: new Date().toISOString() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedData(key) {
    const db = this.db || await this.init();
    const tx = db.transaction('cache', 'readonly');
    const store = tx.objectStore('cache');

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.data || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveOfflineData(type, data) {
    const db = this.db || await this.init();
    const tx = db.transaction('offlineData', 'readwrite');
    const store = tx.objectStore('offlineData');

    return new Promise((resolve, reject) => {
      const request = store.add({
        type,
        data,
        createdAt: new Date().toISOString(),
      });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getOfflineData(type) {
    const db = this.db || await this.init();
    const tx = db.transaction('offlineData', 'readonly');
    const store = tx.objectStore('offlineData');
    const index = store.index('type');

    return new Promise((resolve, reject) => {
      const request = index.getAll(type);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton
const offlineDB = new OfflineDB();
export default offlineDB;
