import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/**
 * Lưu trữ cho zustand persist bằng IndexedDB.
 * localStorage chỉ cho ~5MB/trang web nên dữ liệu đơn hàng lớn sẽ bị lỗi
 * "exceeded the quota". IndexedDB cho phép hàng trăm MB trở lên.
 *
 * Tự động chuyển dữ liệu cũ: nếu IndexedDB chưa có key thì đọc từ localStorage,
 * chép sang IndexedDB rồi xóa bản trong localStorage để giải phóng dung lượng.
 */

const DB_NAME = 'hkt-app-db';
const STORE_NAME = 'kv';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const req = fn(tx.objectStore(STORE_NAME));
        tx.oncomplete = () => resolve(req.result as T);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      }),
  );
}

function safeLocalGet(name: string): string | null {
  try {
    return localStorage.getItem(name);
  } catch {
    return null;
  }
}

function safeLocalRemove(name: string) {
  try {
    localStorage.removeItem(name);
  } catch {
    /* bỏ qua */
  }
}

const hasIdb = typeof indexedDB !== 'undefined';

export const idbStateStorage: StateStorage = {
  getItem: async (name) => {
    if (!hasIdb) return safeLocalGet(name);
    try {
      const value = await run<string | undefined>('readonly', (s) => s.get(name));
      if (value !== undefined && value !== null) return value;

      // Chuyển dữ liệu cũ từ localStorage sang IndexedDB
      const legacy = safeLocalGet(name);
      if (legacy !== null) {
        await run('readwrite', (s) => s.put(legacy, name));
        safeLocalRemove(name);
      }
      return legacy;
    } catch (err) {
      console.error('[idbStorage] getItem lỗi, dùng localStorage', err);
      return safeLocalGet(name);
    }
  },
  setItem: async (name, value) => {
    if (!hasIdb) {
      localStorage.setItem(name, value);
      return;
    }
    await run('readwrite', (s) => s.put(value, name));
    // Đảm bảo không còn bản cũ chiếm chỗ trong localStorage
    safeLocalRemove(name);
  },
  removeItem: async (name) => {
    safeLocalRemove(name);
    if (!hasIdb) return;
    await run('readwrite', (s) => s.delete(name));
  },
};

export const idbJSONStorage = createJSONStorage(() => idbStateStorage);

type PersistedStore = {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (fn: () => void) => () => void;
  };
};

/** Chờ tất cả store đã nạp xong dữ liệu từ IndexedDB (nạp bất đồng bộ). */
/** Trả về true nếu tất cả đã nạp xong, false nếu quá thời gian chờ. */
export function waitForHydration(stores: PersistedStore[], timeoutMs = 20000): Promise<boolean> {
  const pending = stores.map(
    (store) =>
      new Promise<void>((resolve) => {
        if (store.persist.hasHydrated()) return resolve();
        const unsub = store.persist.onFinishHydration(() => {
          unsub();
          resolve();
        });
      }),
  );
  const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs));
  return Promise.race([Promise.all(pending).then(() => true), timeout]);
}
