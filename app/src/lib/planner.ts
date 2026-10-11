import { DAYS, GOAL_BY_ID, INGREDIENT_BY_ID, RECIPES, SLOTS_FOR_MEALS, STORES, STORE_BY_ID, keepsOf, type Keeps } from './data';
import type { AllergenId, CuisineId, DayId, EquipmentId, GoalId, GroceryItem, Slot, Ingredient, PlannedMeal, Preferences, Recipe, Store, WeeklyPlan } from './types';

type SafeRecipe = Recipe & { removed: string[] };

/** The user's own picks, keyed by slotKey(day, slot) → recipe id. */
export type Choices = Record<string, string>;
const SKIP = '__skip__';

export const slotKey = (day: DayId, slot: Slot) => `${day}-${slot}`;

const hasAllergen = (ingredientId: string, allergies: AllergenId[]) =>
  (INGREDIENT_BY_ID[ingredientId].allergens ?? []).some((a) => allergies.includes(a));

/**
 * Recipes safe for this household. A recipe that needs an allergen is
 * excluded; one where the allergen is only an optional side (bread, a
 * yogurt dip) keeps its place with that side removed.
 */
/** Equipment every kitchen is assumed to have; the profile only asks about the rest. */
export const BASIC_EQUIPMENT: EquipmentId[] = ['pot', 'pan', 'fridge'];

export function safeRecipes(allergies: AllergenId[], blacklist: string[] = [], appliances?: EquipmentId[]) {
  const safe: SafeRecipe[] = [];
  let excluded = 0;
  const owned = appliances ? [...BASIC_EQUIPMENT, ...appliances] : undefined;
  for (const r of RECIPES) {
    if (blacklist.includes(r.id)) continue;
    if (owned && !r.equipment.every((e) => owned.includes(e))) continue;
    const blocking = r.ingredients.some((ri) => !ri.optional && hasAllergen(ri.id, allergies));
    if (blocking) {
      excluded++;
      continue;
    }
    const dropped = r.ingredients.filter((ri) => ri.optional && hasAllergen(ri.id, allergies));
    safe.push({
      ...r,
      ingredients: r.ingredients.filter((ri) => !dropped.includes(ri)),
      removed: dropped.map((ri) => INGREDIENT_BY_ID[ri.id].name),
    });
  }
  return { safe, excluded };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Kids count as half a portion; rounded to the nearest half. */
export function portionsFor(adults: number, kids: number) {
  return Math.max(1, Math.round((adults + kids * 0.5) * 2) / 2);
}

/** Servings per meal for this household and goal (bulking adults eat a bigger portion). */
export function servingsFor(adults: number, kids: number, goal: GoalId = 'balanced') {
  return portionsFor(adults * GOAL_BY_ID[goal].adultPortion, kids);
}

/* ───────── Goals ─────────
 * A goal never adds a question to the week: it narrows the rotation to the
 * dishes that suit it best (keeping enough variety), and bulking scales
 * adult portions. Allergies and dislikes are applied before this. */

function goalScore(r: Recipe, goal: GoalId) {
  const { kcal, protein } = r.macros;
  if (goal === 'protein') return protein;
  if (goal === 'cut') return (protein * 4 * 100) / kcal - kcal / 100; // protein share of calories, lighter first
  if (goal === 'bulk') return kcal + protein * 8;
  return 0;
}

/** The best-fitting ~60% of a pool for the goal (never fewer than `floor`), best first. */
export function goalPool<R extends Recipe>(pool: R[], goal: GoalId = 'balanced', floor = 3): R[] {
  if (goal === 'balanced' || pool.length <= floor) return pool;
  const keep = Math.max(floor, Math.ceil(pool.length * 0.6));
  return [...pool].sort((a, b) => goalScore(b, goal) - goalScore(a, goal)).slice(0, keep);
}

/** Protein and calories one adult eats across a set of meals. */
export function nutritionFor(meals: PlannedMeal[], goal: GoalId = 'balanced') {
  const k = GOAL_BY_ID[goal].adultPortion;
  return meals.reduce((t, m) => ({ kcal: t.kcal + m.recipe.macros.kcal * k, protein: t.protein + m.recipe.macros.protein * k }), { kcal: 0, protein: 0 });
}

/** Price of one full pack at a store, with this week's deals applied. */
function packPriceAt(ing: Ingredient, store: Store, withDeals = true) {
  const deal = withDeals ? store.deals[ing.aisle] ?? 1 : 1;
  return ing.pack.price * store.factor * deal;
}

/** Cheapest selected store for an ingredient this week. */
function bestStoreFor(ing: Ingredient, stores: Store[]) {
  let best = stores[0];
  let bestPrice = packPriceAt(ing, best);
  for (const s of stores.slice(1)) {
    const p = packPriceAt(ing, s);
    if (p < bestPrice) {
      best = s;
      bestPrice = p;
    }
  }
  return { store: best, packPrice: bestPrice };
}

function resolveStores(ids: Preferences['stores']) {
  const list = ids.map((id) => STORE_BY_ID[id]).filter(Boolean);
  return list.length ? list : [STORES[0]];
}

/** Cost of one serving using the cheapest selected store for each ingredient. */
export function costPerServing(recipe: Recipe, stores: Store[]) {
  return recipe.ingredients.reduce((sum, ri) => {
    const ing = INGREDIENT_BY_ID[ri.id];
    const { packPrice } = bestStoreFor(ing, stores);
    return sum + (packPrice / ing.pack.size) * ri.qty;
  }, 0);
}

/** Round-robin recipes over the week so no dish repeats on the same day
 *  and repeats are as far apart as possible. */
function schedule(prefs: Preferences, mains: SafeRecipe[], breakfasts: SafeRecipe[], stores: Store[], servings: number, choices: Choices, byId: Map<string, SafeRecipe>) {
  const slots = SLOTS_FOR_MEALS[prefs.mealsPerDay];
  const days = DAYS.filter((d) => prefs.days.includes(d.id));
  const meals: PlannedMeal[] = [];
  let mainCursor = 0;
  let breakfastCursor = 0;

  for (const day of days) {
    for (const slot of slots) {
      let recipe: SafeRecipe | undefined;
      if (slot === 'breakfast') {
        recipe = breakfasts.length ? breakfasts[breakfastCursor % breakfasts.length] : undefined;
        breakfastCursor++;
      } else {
        recipe = mains.length ? mains[mainCursor % mains.length] : undefined;
        mainCursor++;
      }
      const picked = choices[slotKey(day.id, slot)];
      if (picked === SKIP) continue;
      if (picked && byId.has(picked)) recipe = byId.get(picked);
      if (!recipe) continue;
      const cps = costPerServing(recipe, stores);
      meals.push({
        day: day.id,
        slot,
        recipe,
        servings,
        costPerServing: round2(cps),
        totalCost: round2(cps * servings),
        removed: recipe.removed,
        usesStock: recipe.ingredients.filter((ri) => (prefs.stock?.[ri.id] ?? 0) > 0).map((ri) => INGREDIENT_BY_ID[ri.id].name),
      });
    }
  }
  return meals;
}

function buildGrocery(meals: PlannedMeal[], prefs: Preferences, stores: Store[]) {
  const needed = new Map<string, number>();
  for (const m of meals) {
    for (const ri of m.recipe.ingredients) {
      needed.set(ri.id, (needed.get(ri.id) ?? 0) + ri.qty * m.servings);
    }
  }

  const grocery: GroceryItem[] = [];
  const skippedFromPantry: Ingredient[] = [];
  const coveredByStock: { ingredient: Ingredient; qty: number }[] = [];

  for (const [id, qty] of needed) {
    const ing = INGREDIENT_BY_ID[id];
    if (prefs.pantry.includes(id)) {
      skippedFromPantry.push(ing);
      continue;
    }
    // leftovers first: buy only what they don't cover
    const onHand = prefs.stock?.[id] ?? 0;
    const toBuy = qty - onHand;
    if (toBuy <= 1e-6) {
      coveredByStock.push({ ingredient: ing, qty });
      continue;
    }
    const packs = Math.max(1, Math.ceil(toBuy / ing.pack.size - 1e-9));
    const { store, packPrice } = bestStoreFor(ing, stores);
    const avgRegular = stores.reduce((s, st) => s + packPriceAt(ing, st, false), 0) / stores.length;
    grocery.push({
      ingredient: ing,
      needed: qty,
      fromStock: Math.min(onHand, qty),
      leftover: packs * ing.pack.size - toBuy,
      packs,
      store,
      price: round2(packPrice * packs),
      regularPrice: round2(avgRegular * packs),
    });
  }
  return { grocery, skippedFromPantry, coveredByStock };
}

function assemble(prefs: Preferences, mains: SafeRecipe[], breakfasts: SafeRecipe[], trimmed: number, excluded: number, choices: Choices, byId: Map<string, SafeRecipe>): WeeklyPlan {
  const stores = resolveStores(prefs.stores);
  const servings = servingsFor(prefs.adults, prefs.kids, prefs.goal);
  const meals = schedule(prefs, mains, breakfasts, stores, servings, choices, byId);
  const { grocery, skippedFromPantry, coveredByStock } = buildGrocery(meals, prefs, stores);

  const total = round2(grocery.reduce((s, g) => s + g.price, 0));
  const hasStock = Object.keys(prefs.stock ?? {}).length > 0;
  const withoutStock = hasStock ? buildGrocery(meals, { ...prefs, stock: {} }, stores).grocery.reduce((s, g) => s + g.price, 0) : total;
  const stockSaved = round2(Math.max(0, withoutStock - total));
  const regularTotal = round2(grocery.reduce((s, g) => s + g.regularPrice, 0));

  const byStore = stores
    .map((store) => {
      const items = grocery.filter((g) => g.store.id === store.id);
      return { store, total: round2(items.reduce((s, g) => s + g.price, 0)), items: items.length };
    })
    .filter((s) => s.items > 0)
    .sort((a, b) => b.total - a.total);

  return {
    meals,
    grocery,
    skippedFromPantry,
    coveredByStock,
    stockSaved,
    servings,
    total,
    regularTotal,
    saved: round2(Math.max(0, regularTotal - total)),
    budget: prefs.budget,
    overBudget: total > prefs.budget,
    trimmed,
    allergies: prefs.allergies,
    excludedForAllergies: excluded,
    byStore,
  };
}

/* ───────── Choosing the week's dishes ─────────
 * 1. Safe dishes only (allergies, dislikes, kitchen equipment).
 * 2. The household's kitchens (cuisines) first; others only to keep variety.
 * 3. The goal narrows to the best-fitting dishes.
 * 4. A per-week seed shuffles, so every new week is different; leftovers
 *    still pull the dishes that use them to the front.
 * 5. Only as many dishes as there are open slots go into rotation. If the
 *    basket is over budget, the priciest dish is swapped for a cheaper one from
 *    the same pool, and only then is variety reduced (down to a floor). */

/** Small deterministic PRNG (mulberry32), so a week's seed always gives the same week. */
function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(list: T[], seed: number): T[] {
  const out = [...list];
  const rand = rng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Dishes from the chosen kitchens (all kitchens when none chosen). */
export function inCuisines(r: Recipe, cuisines?: CuisineId[]) {
  return !cuisines?.length || cuisines.includes(r.cuisine);
}

/**
 * Ordered candidates for one slot type: preferred kitchens first (goal-fitted,
 * shuffled, leftovers first), then the other kitchens as a reserve.
 */
function candidates(pool: SafeRecipe[], prefs: Preferences, seed: number, stockScore?: (r: Recipe) => number) {
  const order = (list: SafeRecipe[], s: number) => {
    const mixed = shuffled(list, s);
    return stockScore ? mixed.sort((a, b) => stockScore(b) - stockScore(a)) : mixed;
  };
  const preferred = goalPool(pool.filter((r) => inCuisines(r, prefs.cuisines)), prefs.goal, 5);
  const others = goalPool(pool.filter((r) => !inCuisines(r, prefs.cuisines)), prefs.goal, 5);
  return { preferred: order(preferred, seed), others: order(others, seed + 7) };
}

/**
 * Build the week. Picks a rotation sized to the open slots, then, if the basket
 * is over budget, swaps the priciest dish for the cheapest cheaper reserve;
 * when no cheaper dish is left it trims variety down to 3 mains / 2 breakfasts.
 */
export function planWeek(prefs: Preferences, choices: Choices = {}): WeeklyPlan {
  const stores = resolveStores(prefs.stores);
  const costCache = new Map<string, number>();
  const cost = (r: Recipe) => {
    let c = costCache.get(r.id);
    if (c === undefined) {
      c = costPerServing(r, stores);
      costCache.set(r.id, c);
    }
    return c;
  };

  const { safe, excluded } = safeRecipes(prefs.allergies ?? [], prefs.blacklist, prefs.appliances);
  // pins may hold a dish banned later (e.g. one already cooked); the rotation never does
  const byId = new Map(safeRecipes(prefs.allergies ?? []).safe.map((r) => [r.id, r]));

  let stockScore: ((r: Recipe) => number) | undefined;
  if (prefs.stock && Object.keys(prefs.stock).length) {
    const servings = servingsFor(prefs.adults, prefs.kids, prefs.goal);
    const scores = new Map<string, number>();
    stockScore = (r: Recipe) => {
      let v = scores.get(r.id);
      if (v === undefined) {
        v = r.ingredients.reduce((s, ri) => {
          const have = prefs.stock?.[ri.id] ?? 0;
          if (!have) return s;
          const ing = INGREDIENT_BY_ID[ri.id];
          return s + Math.min(have, ri.qty * servings) * (bestStoreFor(ing, stores).packPrice / ing.pack.size);
        }, 0);
        scores.set(r.id, v);
      }
      return v;
    };
  }

  // open (unpinned) slots decide how many distinct dishes the week needs
  const slots = SLOTS_FOR_MEALS[prefs.mealsPerDay];
  const dayIds = DAYS.filter((d) => prefs.days.includes(d.id)).map((d) => d.id);
  let openMain = 0;
  let openBreakfast = 0;
  for (const day of dayIds) {
    for (const slot of slots) {
      if (choices[slotKey(day, slot)]) continue;
      if (slot === 'breakfast') openBreakfast++;
      else openMain++;
    }
  }

  const seed = prefs.seed ?? 0;
  const pick = (pool: SafeRecipe[], open: number, minDistinct: number, s: number) => {
    const { preferred, others } = candidates(pool, prefs, s, stockScore);
    const want = Math.min(open, Math.max(preferred.length, Math.min(open, minDistinct)));
    const ordered = [...preferred, ...others];
    return { rotation: ordered.slice(0, Math.max(want, open > 0 ? 1 : 0)), reserve: ordered.slice(want) };
  };
  const mainPool = safe.filter((r) => !r.slots.includes('breakfast'));
  const breakfastPool = safe.filter((r) => r.slots.includes('breakfast'));
  const m = pick(mainPool, openMain, 5, seed);
  const b = pick(breakfastPool, openBreakfast, 3, seed + 1);
  let mains = m.rotation;
  let breakfasts = b.rotation;
  const mainReserve = m.reserve;
  const breakfastReserve = b.reserve;

  let trimmed = 0;
  let plan = assemble(prefs, mains, breakfasts, trimmed, excluded, choices, byId);
  const usesBreakfast = prefs.mealsPerDay === 3;

  // Over budget? Change one dish at a time, gentlest first:
  //   1. the priciest dish → the next-cheaper dish from the chosen kitchens
  //   2. fewer distinct dishes (repeat favourites), keeping at least 5 mains / 3 breakfasts
  //   3. the next-cheaper dish from other kitchens
  //   4. fewer distinct dishes down to 3 mains / 2 breakfasts
  const priciest = (list: SafeRecipe[]) => list.reduce<SafeRecipe | undefined>((p, r) => (!p || cost(r) > cost(p) ? r : p), undefined);
  // among the three closest cheaper dishes, take the one this week's shuffle put first
  // (keeps meals hearty, and different weeks still differ)
  const nextCheaper = (reserve: SafeRecipe[], than: SafeRecipe, preferredOnly: boolean) => {
    const cheaper = reserve
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => preferredOnly === inCuisines(r, prefs.cuisines) && cost(r) < cost(than))
      .sort((x, y) => cost(y.r) - cost(x.r))
      .slice(0, 3);
    return cheaper.length ? Math.min(...cheaper.map((c) => c.i)) : -1;
  };
  const tryStep = (stage: 1 | 2 | 3 | 4, kind: 'main' | 'breakfast') => {
    const rot = kind === 'main' ? mains : breakfasts;
    const reserve = kind === 'main' ? mainReserve : breakfastReserve;
    const worst = priciest(rot);
    if (!worst) return false;
    if (stage === 1 || stage === 3) {
      const i = nextCheaper(reserve, worst, stage === 1);
      if (i < 0) return false;
      const [cheaper] = reserve.splice(i, 1);
      const next = rot.map((r) => (r === worst ? cheaper : r));
      if (kind === 'main') mains = next;
      else breakfasts = next;
      return true;
    }
    const floor = stage === 2 ? (kind === 'main' ? 5 : 3) : kind === 'main' ? 3 : 2;
    if (rot.length <= floor) return false;
    if (kind === 'main') mains = mains.filter((r) => r !== worst);
    else breakfasts = breakfasts.filter((r) => r !== worst);
    return true;
  };

  for (let guard = 0; plan.overBudget && guard < 300; guard++) {
    // work on whichever slot type holds the priciest dish
    const pm = priciest(mains);
    const pb = usesBreakfast ? priciest(breakfasts) : undefined;
    const kinds: ('main' | 'breakfast')[] = pb && (!pm || cost(pb) > cost(pm)) ? ['breakfast', 'main'] : usesBreakfast ? ['main', 'breakfast'] : ['main'];
    let changed = false;
    for (const stage of [1, 2, 3, 4] as const) {
      for (const kind of kinds) {
        if (tryStep(stage, kind)) {
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
    if (!changed) break;
    trimmed++;
    plan = assemble(prefs, mains, breakfasts, trimmed, excluded, choices, byId);
  }
  return plan;
}

/** Pin every meal in a plan so a single swap never reshuffles the rest of the week. */
export function pinAll(plan: WeeklyPlan): Choices {
  return Object.fromEntries(plan.meals.map((m) => [slotKey(m.day, m.slot), m.recipe.id]));
}

export interface SwapOption {
  recipe: Recipe;
  costPerServing: number;
  /** extra basket cost to cook this here, given what the rest of the week already buys */
  extra: number;
  /** ingredients that would need another pack — i.e. not enough left in the basket */
  needs: string[];
  current: boolean;
  /** already on the menu the same day, in another slot */
  sameDay: boolean;
  /** among the dishes that best suit the household's goal (always true for "balanced") */
  goalFit: boolean;
  /** from one of this week's chosen kitchens */
  inCuisine: boolean;
}

/**
 * Alternatives for one slot, ranked by what's already in the basket.
 * Packs are bought whole, so the rest of the week leaves leftovers (most of a
 * tray of eggs, half a bag of rice). A dish those leftovers cover costs
 * nothing extra; a dish that needs something that ran out is flagged.
 */
export function swapOptions(prefs: Preferences, plan: WeeklyPlan, meal: PlannedMeal, limit = 30): SwapOption[] {
  const pinned = pinAll(plan);
  const key = slotKey(meal.day, meal.slot);
  const without = planWeek(prefs, { ...pinned, [key]: SKIP });
  const packsWithout = new Map(without.grocery.map((g) => [g.ingredient.id, g.packs]));
  const spare = new Map(without.grocery.map((g) => [g.ingredient.id, g.leftover]));
  const stores = resolveStores(prefs.stores);
  const { safe } = safeRecipes(prefs.allergies ?? [], prefs.blacklist, prefs.appliances);
  const isBreakfast = meal.slot === 'breakfast';
  const pool = safe.filter((r) => (isBreakfast ? r.slots.includes('breakfast') : !r.slots.includes('breakfast')));
  const fits = new Set(goalPool(pool, prefs.goal, isBreakfast ? 3 : 4).map((r) => r.id));
  const sameDay = (r: Recipe) => plan.meals.some((m) => m.day === meal.day && m.slot !== meal.slot && m.recipe.id === r.id);

  // cheap first pass: share of the dish the basket already covers (spare packs, pantry, leftovers)
  const covered = (r: Recipe) =>
    r.ingredients.filter((ri) => prefs.pantry.includes(ri.id) || (prefs.stock?.[ri.id] ?? 0) > 0 || (spare.get(ri.id) ?? 0) >= ri.qty * meal.servings).length / r.ingredients.length;
  const shortlist = pool
    .map((r) => ({ r, current: r.id === meal.recipe.id, same: sameDay(r), cuisine: inCuisines(r, prefs.cuisines), fit: fits.has(r.id), cov: covered(r) }))
    .sort((a, b) => Number(b.current) - Number(a.current) || Number(a.same) - Number(b.same) || Number(b.cuisine) - Number(a.cuisine) || Number(b.fit) - Number(a.fit) || b.cov - a.cov)
    .slice(0, limit);

  // full pricing only for the shortlist
  return shortlist
    .map(({ r, current, same, cuisine, fit }) => {
      const withIt = planWeek(prefs, { ...pinned, [key]: r.id });
      const needs = withIt.grocery.filter((g) => g.packs > (packsWithout.get(g.ingredient.id) ?? 0)).map((g) => g.ingredient.name);
      return {
        recipe: r,
        costPerServing: round2(costPerServing(r, stores)),
        extra: round2(Math.max(0, withIt.total - without.total)),
        needs,
        current,
        sameDay: same,
        goalFit: fit,
        inCuisine: cuisine,
      };
    })
    .sort(
      (a, b) =>
        Number(b.current) - Number(a.current) ||
        Number(a.sameDay) - Number(b.sameDay) ||
        Number(b.inCuisine) - Number(a.inCuisine) ||
        Number(b.goalFit) - Number(a.goalFit) ||
        a.needs.length - b.needs.length ||
        a.extra - b.extra,
    );
}

/** Recipes still available for a slot type after allergies and the blacklist. */
export function poolSize(prefs: Preferences, slot: Slot, extraBan?: string) {
  const { safe } = safeRecipes(prefs.allergies ?? [], [...(prefs.blacklist ?? []), ...(extraBan ? [extraBan] : [])], prefs.appliances);
  return safe.filter((r) => (slot === 'breakfast' ? r.slots.includes('breakfast') : !r.slots.includes('breakfast'))).length;
}

/**
 * Never suggest `recipeId` again: add it to the blacklist and replace it in
 * every slot it occupies this week, preferring dishes the basket already covers.
 * Everything else in the week stays exactly as it was.
 */
export function banRecipe(prefs: Preferences, plan: WeeklyPlan, recipeId: string, keep: string[] = []) {
  const next: Preferences = { ...prefs, blacklist: Array.from(new Set([...(prefs.blacklist ?? []), recipeId])) };
  const affected = plan.meals.filter((m) => m.recipe.id === recipeId).map((m) => slotKey(m.day, m.slot)).filter((k) => !keep.includes(k));
  let choices = pinAll(plan);
  let current = planWeek(next, choices);
  for (const key of affected) {
    const meal = current.meals.find((m) => slotKey(m.day, m.slot) === key);
    if (!meal) continue;
    const opts = swapOptions(next, current, meal);
    const fresh = opts.filter((o) => !o.current && !o.sameDay);
    const best = fresh.find((o) => o.needs.length === 0) ?? fresh[0] ?? opts.find((o) => !o.current) ?? opts[0];
    choices = { ...pinAll(current), [key]: best.recipe.id };
    current = planWeek(next, choices);
  }
  return { prefs: next, choices: pinAll(current), plan: current, replaced: affected.length };
}

/* ───────────────────────── Kitchen inventory ───────────────────────── */

export interface InventoryRow {
  ingredient: Ingredient;
  /** bought this week (whole packs) + leftovers carried in */
  have: number;
  /** used by meals marked cooked */
  used: number;
  remaining: number;
}

/** What should be in the kitchen right now: bought + carried over − cooked. */
export function kitchenInventory(plan: WeeklyPlan, cooked: string[], stock: Record<string, number> = {}): InventoryRow[] {
  const have = new Map<string, number>();
  for (const g of plan.grocery) have.set(g.ingredient.id, g.packs * g.ingredient.pack.size);
  for (const [id, q] of Object.entries(stock)) have.set(id, (have.get(id) ?? 0) + q);

  const used = new Map<string, number>();
  for (const m of plan.meals) {
    if (!cooked.includes(slotKey(m.day, m.slot))) continue;
    for (const ri of m.recipe.ingredients) used.set(ri.id, (used.get(ri.id) ?? 0) + ri.qty * m.servings);
  }

  return Array.from(have.entries())
    .map(([id, h]) => {
      const u = Math.min(h, used.get(id) ?? 0);
      return { ingredient: INGREDIENT_BY_ID[id], have: h, used: u, remaining: Math.max(0, h - u) };
    })
    .sort((a, b) => b.used / b.have - a.used / a.have);
}

export interface Leftover {
  ingredient: Ingredient;
  qty: number;
  keeps: Keeps;
}

/**
 * What a finished week probably left behind. Uses the cooked log when the
 * household kept one; otherwise assumes the plan was followed. Only food
 * that keeps is offered.
 */
export function estimateLeftovers(week: { prefs: Preferences; choices: Choices; cooked?: string[] }): Leftover[] {
  const plan = planWeek(week.prefs, week.choices);
  const cooked = week.cooked?.length ? week.cooked : plan.meals.map((m) => slotKey(m.day, m.slot));
  return kitchenInventory(plan, cooked, week.prefs.stock)
    // countable items carry over as whole pieces
    .map((r) => ({ ingredient: r.ingredient, qty: r.ingredient.unit === 'pc' ? Math.floor(r.remaining) : r.remaining, keeps: keepsOf(r.ingredient.id) }))
    .filter((l) => l.keeps !== 'short' && l.qty >= (l.ingredient.unit === 'pc' ? 1 : l.ingredient.pack.size * 0.08))
    .sort((a, b) => (a.keeps === b.keeps ? 0 : a.keeps === 'long' ? -1 : 1));
}

/** Full-variety cost estimate and the leanest achievable cost, for the budget step. */
export function estimateRange(prefs: Omit<Preferences, 'budget'>) {
  const full = planWeek({ ...prefs, budget: Number.POSITIVE_INFINITY }).total;
  const lean = planWeek({ ...prefs, budget: 0 }).total;
  return { full, lean };
}

export type BudgetMood = 'lean' | 'balanced' | 'comfortable';

export function budgetMood(budget: number, estimate: number): BudgetMood {
  if (estimate <= 0) return 'balanced';
  const ratio = budget / estimate;
  if (ratio < 0.92) return 'lean';
  if (ratio <= 1.15) return 'balanced';
  return 'comfortable';
}
