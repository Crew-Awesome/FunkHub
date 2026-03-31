if (!window.launcher) window.launcher = {};
if (!window.launcher.discover) window.launcher.discover = {};
if (!window.launcher.discover.utils) window.launcher.discover.utils = {};

window.launcher.discover.utils.cache = {
  dbName: "FunkHubCache",
  storeName: "discoverData",

  /**
   * Initializes the IndexedDB connection.
   * @returns {Promise<IDBDatabase>}
   */
  init: function () {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = () => reject(new Error("IndexedDB initialization failed"));
    });
  },

  /**
   * Saves data into the local cache with an expiration time.
   * @param {string} key
   * @param {*} value
   * @param {number} ttlMs
   * @returns {Promise<void>}
   */
  set: async function (key, value, ttlMs = 300000) {
    try {
      const db = await this.init();
      return new Promise((resolve) => {
        const tx = db.transaction(this.storeName, "readwrite");
        const store = tx.objectStore(this.storeName);
        store.put({ data: value, expiry: Date.now() + ttlMs }, key);
        tx.oncomplete = () => resolve();
      });
    } catch (err) {
      console.warn("Cache save failed", err);
    }
  },

  /**
   * Retrieves data from cache if it exists and hasn't expired.
   * @param {string} key
   * @returns {Promise<*|null>}
   */
  get: async function (key) {
    try {
      const db = await this.init();
      return new Promise((resolve) => {
        const tx = db.transaction(this.storeName, "readonly");
        const store = tx.objectStore(this.storeName);
        const request = store.get(key);
        
        request.onsuccess = () => {
          const result = request.result;
          if (result && Date.now() < result.expiry) {
            resolve(result.data);
          } else {
            if (result) this.remove(key); // Auto-cleanup expired
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      });
    } catch (err) {
      console.warn("Cache read failed", err);
      return null;
    }
  },

  /**
   * Removes a specific key from the cache.
   * @param {string} key
   */
  remove: async function (key) {
    const db = await this.init();
    const tx = db.transaction(this.storeName, "readwrite");
    tx.objectStore(this.storeName).delete(key);
  }
};