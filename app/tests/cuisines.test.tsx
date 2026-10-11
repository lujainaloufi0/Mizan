/** Cuisine choice drives the week; the planner falls back gracefully when a kitchen is small. */
import { expect, test } from '@jest/globals';
import { RECIPES } from '@/lib/data';
import { planWeek, swapOptions } from '@/lib/planner';
import type { Preferences } from '@/lib/types';

const base: Preferences = { stores: ['carrefour', 'panda'], adults: 2, kids: 1, days: ['sun', 'mon', 'tue', 'wed', 'thu'], mealsPerDay: 2, allergies: [], pantry: [], budget: 5000, seed: 3 };

test('a single kitchen gives a week from that kitchen', () => {
  for (const c of ['saudi', 'italian', 'mexican', 'indian'] as const) {
    const plan = planWeek({ ...base, cuisines: [c] });
    expect({ c, all: plan.meals.every((m) => m.recipe.cuisine === c) }).toEqual({ c, all: true });
  }
});

test('a small kitchen still gives at least 5 different mains', () => {
  const plan = planWeek({ ...base, cuisines: ['korean'], days: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] });
  expect(new Set(plan.meals.map((m) => m.recipe.id)).size).toBeGreaterThanOrEqual(5);
  expect(plan.meals.filter((m) => m.recipe.cuisine === 'korean').length).toBeGreaterThanOrEqual(5);
});

test('a tight budget prefers cheaper dishes from the chosen kitchen before leaving it', () => {
  const plan = planWeek({ ...base, cuisines: ['saudi'], budget: 380 });
  const saudiShare = plan.meals.filter((m) => m.recipe.cuisine === 'saudi').length / plan.meals.length;
  expect(saudiShare).toBeGreaterThanOrEqual(0.6);
});

test('new weeks vary; the same week is stable', () => {
  const a = planWeek({ ...base, seed: 1 }).meals.map((m) => m.recipe.id);
  const b = planWeek({ ...base, seed: 2 }).meals.map((m) => m.recipe.id);
  expect(a).not.toEqual(b);
  expect(planWeek({ ...base, seed: 1 }).meals.map((m) => m.recipe.id)).toEqual(a);
});

test('swap options list the chosen kitchen first and stay fast to compute', () => {
  const prefs = { ...base, cuisines: ['italian' as const] };
  const plan = planWeek(prefs);
  const t = Date.now();
  const opts = swapOptions(prefs, plan, plan.meals[0]);
  expect(Date.now() - t).toBeLessThan(1500);
  const firstOther = opts.findIndex((o) => !o.inCuisine);
  const lastItalian = opts.map((o) => o.inCuisine).lastIndexOf(true);
  if (firstOther >= 0) expect(lastItalian).toBeLessThan(firstOther);
  expect(opts.length).toBeLessThanOrEqual(30);
});

test('recipes span many kitchens', () => {
  expect(new Set(RECIPES.map((r) => r.cuisine)).size).toBeGreaterThanOrEqual(15);
});
