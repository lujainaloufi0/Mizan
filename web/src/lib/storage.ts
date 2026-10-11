/**
 * Local persistence for a household's Mizan data.
 *
 * One versioned record in localStorage. Every access is wrapped: private
 * windows, blocked storage or a full quota must never break the app — it just
 * behaves like a first visit.
 */
import type { Choices } from './planner';
import type { Preferences } from './types';

const KEY = 'mizan:v1';

export interface SavedWeek {
  prefs: Preferences;
  /** the exact recipe in every slot, so a repeat reproduces the same week */
  choices: Choices;
  /** grocery items already ticked off */
  checked: string[];
  /** slot keys of meals marked cooked */
  cooked?: string[];
  createdAt: string;
  /** shown on the repeat card; recomputed with live prices on repeat */
  total: number;
  meals: number;
  recipeIds: string[];
}

export interface MizanStore {
  version: 1;
  lastWeek?: SavedWeek;
  blacklist: string[];
}

const EMPTY: MizanStore = { version: 1, blacklist: [] };

export function loadStore(): MizanStore {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const data = JSON.parse(raw) as Partial<MizanStore>;
    if (data.version !== 1) return EMPTY;
    return { ...EMPTY, ...data, blacklist: Array.isArray(data.blacklist) ? data.blacklist : [] };
  } catch {
    return EMPTY;
  }
}

export function saveStore(patch: Partial<Omit<MizanStore, 'version'>>) {
  try {
    const next: MizanStore = { ...loadStore(), ...patch, version: 1 };
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — the session still works, it just won't be remembered */
  }
}

export function clearLastWeek() {
  saveStore({ lastWeek: undefined });
}
