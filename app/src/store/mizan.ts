/**
 * Mizan app state — one persisted store (AsyncStorage).
 *
 * profile  permanent, set up once: allergies, dislikes (blacklist), appliances,
 *          always-stocked staples, sound & haptics. Applies live to every week.
 * draft    the weekly answers we pre-fill next time (stores, household, budget…).
 * week     this week: frozen settings + exact dish per slot + progress.
 * lastWeek the week before, kept for "repeat" and leftovers.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useMemo } from 'react';
import { banRecipe, pinAll, planWeek, poolSize, slotKey, type Choices } from '@/lib/planner';
import type { AllergenId, CuisineId, DayId, EquipmentId, GoalId, PlannedMeal, Preferences, StoreId, WeeklyPlan } from '@/lib/types';

export interface Profile {
  setupDone: boolean;
  /** eating goal: balanced / high-protein / cut / bulk */
  goal: GoalId;
  allergies: AllergenId[];
  blacklist: string[];
  appliances: EquipmentId[];
  /** always in the kitchen, never on the list (salt, oil…) */
  staples: string[];
  sound: boolean;
  haptics: boolean;
}

/** The answers the 3-step weekly setup asks for (plus defaults it doesn't). */
export interface WeekDraft {
  stores: StoreId[];
  adults: number;
  kids: number;
  budget: number;
  days: DayId[];
  mealsPerDay: 1 | 2 | 3;
  /** kitchens to plan from; empty = a mix of all */
  cuisines: CuisineId[];
}

export interface Week {
  draft: WeekDraft;
  /** varies the dishes each new week picks (fixed for the life of the week) */
  seed?: number;
  /** leftovers carried in at the start of the week */
  stock: Record<string, number>;
  choices: Choices;
  checked: string[];
  cooked: string[];
  createdAt: string;
}

interface State {
  profile: Profile;
  draft: WeekDraft;
  week?: Week;
  lastWeek?: Week;

  saveProfile: (patch: Partial<Profile>) => void;
  setDraft: (patch: Partial<WeekDraft>) => void;
  /** start a new week; the current one becomes lastWeek */
  startWeek: (draft: WeekDraft, stock: Record<string, number>, choices?: Choices) => void;
  swap: (meal: PlannedMeal, recipeId: string) => { before: number; after: number };
  /** returns an undo function, or null when the dish can't be banned */
  ban: (meal: PlannedMeal) => (() => void) | null;
  unban: (recipeId: string) => void;
  toggleCooked: (meal: PlannedMeal) => boolean;
  setChecked: (ids: string[]) => void;
  resetAll: () => void;
}

export const DEFAULT_PROFILE: Profile = {
  setupDone: false,
  goal: 'balanced',
  allergies: [],
  blacklist: [],
  appliances: ['oven', 'blender', 'microwave'],
  staples: ['salt', 'black_pepper', 'veg_oil'],
  sound: true,
  haptics: true,
};

export const DEFAULT_DRAFT: WeekDraft = {
  stores: ['carrefour', 'panda'],
  adults: 2,
  kids: 1,
  budget: 600,
  days: ['sun', 'mon', 'tue', 'wed', 'thu'],
  mealsPerDay: 2,
  cuisines: [],
};

/** Planner preferences = this week's draft + the permanent profile. */
export function toPrefs(draft: WeekDraft, profile: Profile, stock: Record<string, number> = {}, seed?: number): Preferences {
  return {
    ...draft,
    seed,
    allergies: profile.allergies,
    goal: profile.goal,
    blacklist: profile.blacklist,
    appliances: profile.appliances,
    pantry: profile.staples,
    stock,
  };
}

export function weekPrefs(state: Pick<State, 'profile'>, week: Week) {
  return toPrefs(week.draft, state.profile, week.stock, week.seed);
}

export function planFor(state: Pick<State, 'profile'>, week: Week): WeeklyPlan {
  return planWeek(weekPrefs(state, week), week.choices);
}

export const useMizan = create<State>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PROFILE,
      draft: DEFAULT_DRAFT,

      saveProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
      setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),

      startWeek: (draft, stock, choices = {}) =>
        set((s) => {
          const seed = Math.floor(Math.random() * 2 ** 31);
          const week: Week = { draft, seed, stock, choices: {}, checked: [], cooked: [], createdAt: new Date().toISOString() };
          // freeze the generated dishes so later profile edits don't reshuffle the week
          week.choices = pinAll(planWeek(toPrefs(draft, s.profile, stock, seed), choices));
          return { draft, week, lastWeek: s.week ?? s.lastWeek };
        }),

      swap: (meal, recipeId) => {
        const s = get();
        if (!s.week) return { before: 0, after: 0 };
        const plan = planFor(s, s.week);
        const choices = { ...pinAll(plan), [slotKey(meal.day, meal.slot)]: recipeId };
        const after = planWeek(weekPrefs(s, s.week), choices).total;
        set({ week: { ...s.week, choices } });
        return { before: plan.total, after };
      },

      ban: (meal) => {
        const s = get();
        if (!s.week) return null;
        const plan = planFor(s, s.week);
        const prefs = weekPrefs(s, s.week);
        // never ban the last dishes that can fill this kind of meal
        if (poolSize(prefs, meal.slot, meal.recipe.id) < 2) return null;
        const result = banRecipe(prefs, plan, meal.recipe.id, s.week.cooked);
        const before = { profile: s.profile, week: s.week };
        set({
          profile: { ...s.profile, blacklist: result.prefs.blacklist ?? s.profile.blacklist },
          week: { ...s.week, choices: result.choices },
        });
        return () => set({ profile: before.profile, week: before.week });
      },

      unban: (recipeId) => set((s) => ({ profile: { ...s.profile, blacklist: s.profile.blacklist.filter((id) => id !== recipeId) } })),

      toggleCooked: (meal) => {
        const s = get();
        if (!s.week) return false;
        const key = slotKey(meal.day, meal.slot);
        const on = !s.week.cooked.includes(key);
        set({ week: { ...s.week, cooked: on ? [...s.week.cooked, key] : s.week.cooked.filter((k) => k !== key) } });
        return on;
      },

      setChecked: (ids) => set((s) => (s.week ? { week: { ...s.week, checked: ids } } : {})),

      resetAll: () => set({ profile: DEFAULT_PROFILE, draft: DEFAULT_DRAFT, week: undefined, lastWeek: undefined }),
    }),
    {
      name: 'mizan:v1',
      version: 2,
      // profiles saved by older versions get any new fields (e.g. goal) from the defaults
      migrate: (persisted) => persisted as State,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return { ...current, ...p, profile: { ...DEFAULT_PROFILE, ...p.profile }, draft: { ...DEFAULT_DRAFT, ...p.draft } };
      },
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ profile: s.profile, draft: s.draft, week: s.week, lastWeek: s.lastWeek }),
    },
  ),
);

/** The week shown on Home, derived (and memoised by callers). */
export function useCurrentPlan() {
  const profile = useMizan((s) => s.profile);
  const week = useMizan((s) => s.week);
  return useMemo(
    () => ({ profile, week, plan: week ? planFor({ profile }, week) : null, prefs: week ? toPrefs(week.draft, profile, week.stock) : null }),
    [profile, week],
  );
}
