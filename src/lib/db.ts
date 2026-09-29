/* Minimal promise-based IndexedDB wrapper. */

const DB_NAME = 'nova-db';
const DB_VERSION = 1;

export type StoreName = 'routines' | 'tasks' | 'sessions' | 'kv';

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('routines'))
        db.createObjectStore('routines', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('tasks')) db.createObjectStore('tasks', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('sessions'))
        db.createObjectStore('sessions', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  run: (s: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = run(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

export function dbGetAll<T>(store: StoreName): Promise<T[]> {
  return tx<T[]>(store, 'readonly', (s) => s.getAll() as IDBRequest<T[]>);
}

export function dbPut<T>(store: StoreName, value: T): Promise<unknown> {
  return tx(store, 'readwrite', (s) => s.put(value as never));
}

export function dbDelete(store: StoreName, id: string): Promise<unknown> {
  return tx(store, 'readwrite', (s) => s.delete(id));
}

export function dbClear(store: StoreName): Promise<unknown> {
  return tx(store, 'readwrite', (s) => s.clear());
}

/* ---- key/value helpers (settings etc.) ---- */

export function kvGet<T>(key: string): Promise<T | undefined> {
  return tx<{ key: string; value: T } | undefined>('kv', 'readonly', (s) =>
    s.get(key)
  ).then((row) => (row ? row.value : undefined));
}

export function kvSet<T>(key: string, value: T): Promise<unknown> {
  return dbPut('kv', { key, value });
}

/* ---- high-level repositories ---- */

export interface Repos {
  loadSettings<T>(): Promise<T | undefined>;
  saveSettings<T>(v: T): Promise<unknown>;
  loadRoutines<T>(): Promise<T[]>;
  saveRoutine<T extends { id: string }>(v: T): Promise<unknown>;
  deleteRoutine(id: string): Promise<unknown>;
  loadTaskInstances<T>(): Promise<T[]>;
  saveTaskInstance<T extends { id: string }>(v: T): Promise<unknown>;
  deleteTaskInstancesFor(routineId: string): Promise<void>;
  loadSessions<T>(): Promise<T[]>;
  saveSession<T extends { id: string }>(v: T): Promise<unknown>;
  deleteSession(id: string): Promise<unknown>;
}

export const repos: Repos = {
  loadSettings: () => kvGet('settings'),
  saveSettings: (v) => kvSet('settings', v),
  loadRoutines: () => dbGetAll('routines'),
  saveRoutine: (v) => dbPut('routines', v),
  deleteRoutine: (id) => dbDelete('routines', id),
  loadTaskInstances: () => dbGetAll('tasks'),
  saveTaskInstance: (v) => dbPut('tasks', v),
  deleteTaskInstancesFor: async (routineId) => {
    const all = await dbGetAll<{ id: string; routineId: string }>('tasks');
    await Promise.all(all.filter((t) => t.routineId === routineId).map((t) => dbDelete('tasks', t.id)));
  },
  loadSessions: () => dbGetAll('sessions'),
  saveSession: (v) => dbPut('sessions', v),
  deleteSession: (id) => dbDelete('sessions', id),
};
