import { AnalysisResult } from '../types';

export interface SavedConversion {
  id: string;
  title: string;
  createdAt: number; // Unix timestamp in ms
  expiresAt: number; // Unix timestamp in ms (createdAt + 90 days)
  transcript: string;
  contextNotes: string;
  analysisResult: AnalysisResult;
  audioFileName?: string;
  languages: string[];
  conceptCount: number;
  keyTakeawayCount: number;
}

const DB_NAME = 'PolyglotScribeDB';
const DB_VERSION = 1;
const STORE_NAME = 'conversions';
const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds

// Open or initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

// Fallback to localStorage if IndexedDB is blocked
const LOCAL_STORAGE_KEY = 'polyglot_saved_conversions_backup';

function fallbackGet(): SavedConversion[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const list: SavedConversion[] = JSON.parse(raw);
    const now = Date.now();
    // Prune expired
    const active = list.filter((item) => item.expiresAt > now);
    if (active.length !== list.length) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(active));
    }
    return active;
  } catch (e) {
    console.warn('LocalStorage fallback error:', e);
    return [];
  }
}

function fallbackSave(item: SavedConversion): void {
  try {
    const list = fallbackGet();
    const updated = [item, ...list.filter((x) => x.id !== item.id)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated.slice(0, 50)));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

function fallbackDelete(id: string): void {
  try {
    const list = fallbackGet();
    const updated = list.filter((x) => x.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage delete error:', e);
  }
}

/**
 * Save a newly converted discussion.
 * Automatically computes expiration at 90 days (3 months) from now.
 * Prunes any old records that have exceeded 90 days.
 */
export async function saveConversion(params: {
  id?: string;
  transcript: string;
  contextNotes?: string;
  analysisResult: AnalysisResult;
  audioFileName?: string;
}): Promise<SavedConversion> {
  const now = Date.now();
  const expiresAt = now + THREE_MONTHS_MS;

  // Generate a title based on top core concepts or languages
  const topConcept = params.analysisResult.coreConcepts?.[0]?.title;
  const languages = params.analysisResult.detectedLanguages?.map((l) => l.name) || [];
  
  let title = 'Discussion Conversion';
  if (topConcept) {
    title = topConcept;
  } else if (languages.length > 0) {
    title = `${languages.slice(0, 2).join(' & ')} Discussion`;
  } else if (params.audioFileName) {
    title = params.audioFileName.replace(/\.[^/.]+$/, '');
  }

  const savedItem: SavedConversion = {
    id: params.id || `conv_${now}_${Math.random().toString(36).substring(2, 9)}`,
    title,
    createdAt: now,
    expiresAt,
    transcript: params.transcript,
    contextNotes: params.contextNotes || '',
    analysisResult: params.analysisResult,
    audioFileName: params.audioFileName,
    languages,
    conceptCount: params.analysisResult.coreConcepts?.length || 0,
    keyTakeawayCount: params.analysisResult.structuredNotes?.keyTakeaways?.length || 0,
  };

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(savedItem);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Prune expired records in the background
    pruneExpiredConversions().catch((err) => console.warn('Prune error:', err));
  } catch (err) {
    console.warn('IndexedDB failed, falling back to localStorage:', err);
    fallbackSave(savedItem);
  }

  return savedItem;
}

/**
 * Retrieve all active (non-expired) conversions, sorted newest first.
 * Items older than 3 months (expiresAt < now) are filtered and deleted.
 */
export async function getSavedConversions(): Promise<SavedConversion[]> {
  const now = Date.now();

  try {
    const db = await openDB();
    const items = await new Promise<SavedConversion[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    const activeItems: SavedConversion[] = [];
    const expiredIds: string[] = [];

    items.forEach((item) => {
      if (item.expiresAt && item.expiresAt > now) {
        activeItems.push(item);
      } else {
        expiredIds.push(item.id);
      }
    });

    // Remove expired records
    if (expiredIds.length > 0) {
      pruneSpecificIds(expiredIds).catch(console.warn);
    }

    return activeItems.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.warn('IndexedDB read failed, using localStorage fallback:', err);
    return fallbackGet().sort((a, b) => b.createdAt - a.createdAt);
  }
}

/**
 * Delete a specific conversion by ID.
 */
export async function deleteConversion(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete failed, using localStorage fallback:', err);
    fallbackDelete(id);
  }
}

/**
 * Prune all conversions where expiresAt <= Date.now() (older than 3 months).
 */
export async function pruneExpiredConversions(): Promise<number> {
  const now = Date.now();
  let deletedCount = 0;

  try {
    const db = await openDB();
    const items = await new Promise<SavedConversion[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    const expiredIds = items.filter((x) => x.expiresAt && x.expiresAt <= now).map((x) => x.id);

    if (expiredIds.length > 0) {
      await pruneSpecificIds(expiredIds);
      deletedCount = expiredIds.length;
    }
  } catch (err) {
    console.warn('Prune error:', err);
  }

  return deletedCount;
}

async function pruneSpecificIds(ids: string[]): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      ids.forEach((id) => store.delete(id));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('Prune specific error:', e);
  }
}

/**
 * Helper to compute how many days or hours remain before a conversion expires.
 */
export function formatTimeRemaining(expiresAt: number): { days: number; text: string; isExpiringSoon: boolean } {
  const diffMs = expiresAt - Date.now();
  if (diffMs <= 0) {
    return { days: 0, text: 'Expired', isExpiringSoon: true };
  }

  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  if (days > 1) {
    return { days, text: `${days} days remaining`, isExpiringSoon: days < 7 };
  }
  if (days === 1) {
    return { days, text: '1 day remaining', isExpiringSoon: true };
  }
  return { days: 0, text: `${hours} hours remaining`, isExpiringSoon: true };
}
