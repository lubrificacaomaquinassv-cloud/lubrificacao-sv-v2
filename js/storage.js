const DB_NAME = "lub_sv_v2";
const DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("pending")) {
        db.createObjectStore("pending", { keyPath: "client_id" });
      }
      if (!db.objectStoreNames.contains("recent")) {
        db.createObjectStore("recent", { keyPath: "client_id" });
      }
      if (!db.objectStoreNames.contains("catalog")) {
        db.createObjectStore("catalog", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

async function idbGet(store, key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(store, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(store, key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbAll(store) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

const Storage = {
  async savePending(record) {
    await idbPut("pending", { ...record, status: "pending" });
  },
  async getPendingAll() {
    return idbAll("pending");
  },
  async removePending(clientId) {
    await idbDelete("pending", clientId);
  },
  async saveRecent(record) {
    await idbPut("recent", record);
    const all = await idbAll("recent");
    all.sort((a, b) => new Date(b.data_servico) - new Date(a.data_servico));
    for (const r of all.slice(3)) {
      await idbDelete("recent", r.client_id);
    }
  },
  async getRecent() {
    const all = await idbAll("recent");
    return all.sort((a, b) => new Date(b.data_servico) - new Date(a.data_servico)).slice(0, 3);
  },
  async saveCatalog(key, data) {
    await idbPut("catalog", { key, data, updated_at: new Date().toISOString() });
  },
  async getCatalog(key) {
    const row = await idbGet("catalog", key);
    return row ? row.data : null;
  },
  async getOperatorsHistory() {
    const row = await idbGet("meta", "operators");
    return row ? row.list : [];
  },
  async addOperator(name) {
    const list = await this.getOperatorsHistory();
    const n = name.trim().toUpperCase();
    if (!n) return;
    const next = [n, ...list.filter((x) => x !== n)].slice(0, 30);
    await idbPut("meta", { key: "operators", list: next });
  },
};

window.Storage = Storage;
