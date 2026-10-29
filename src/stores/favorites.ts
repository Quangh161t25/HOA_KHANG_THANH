import { useCallback, useSyncExternalStore } from 'react';

const KEY = 'app-favorite-modules';
const EMPTY: string[] = [];
let cachedRaw: string | null = null;
let cachedValue: string[] = EMPTY;
const listeners = new Set<() => void>();

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      cachedRaw = null;
      cachedValue = EMPTY;
      return EMPTY;
    }
    if (raw === cachedRaw) return cachedValue;
    const parsed = JSON.parse(raw);
    cachedRaw = raw;
    cachedValue = Array.isArray(parsed) && parsed.every((v) => typeof v === 'string') ? parsed : EMPTY;
    return cachedValue;
  } catch {
    return EMPTY;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Danh sách module được ghim (lưu localStorage, đồng bộ giữa các component). */
export function useFavoriteModules() {
  const favoriteIds = useSyncExternalStore(subscribe, read, read);

  const toggleFavorite = useCallback((id: string) => {
    const set = new Set(read());
    if (set.has(id)) set.delete(id);
    else set.add(id);
    try {
      localStorage.setItem(KEY, JSON.stringify([...set]));
    } catch {
      return;
    }
    listeners.forEach((l) => l());
  }, []);

  const isFavorite = useCallback((id: string) => favoriteIds.includes(id), [favoriteIds]);

  return { favoriteIds, toggleFavorite, isFavorite };
}
