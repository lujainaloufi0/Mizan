import { DAYS, INGREDIENT_BY_ID, RECIPES, SLOTS_FOR_MEALS, STORES, STORE_BY_ID, keepsOf, type Keeps } from './data';
import type { AllergenId, DayId, GroceryItem, Slot, Ingredient, PlannedMeal, Preferences, Recipe, Store, WeeklyPlan } from './types';

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
export function safeRecipes(allergies: AllergenId[], blacklist: string[] = []) {
  const safe: SafeRecipe[] = [];
  let excluded = 0;
  for (const r of RECIPES) {
    if (blacklist.includes(r.id)) continue;
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
  const servings = portionsFor(prefs.adults, prefs.kids);
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

/**
 * Build the week. If the basket overshoots the budget, drop the most
 * expensive main dish from rotation and rebuild — down to a floor of three
 * mains and two breakfasts so the week never becomes monotonous.
 */
export function planWeek(prefs: Preferences, choices: Choices = {}): WeeklyPlan {
  const stores = resolveStores(prefs.stores);
  const byCost = (a: Recipe, b: Recipe) => costPerServing(a, stores) - costPerServing(b, stores);

  const { safe, excluded } = safeRecipes(prefs.allergies ?? [], prefs.blacklist);
  // pins may hold a dish banned later (e.g. one already cooked); the rotation never does
  const byId = new Map(safeRecipes(prefs.allergies ?? []).safe.map((r) => [r.id, r]));
  let mains = safe.filter((r) => r.slots.includes('lunch') || r.slots.includes('dinner'));
  let breakfasts = safe.filter((r) => r.slots.includes('breakfast'));
  // zero waste: dishes that use up the most leftovers (by SAR value) go first in the rotation
  if (prefs.stock && Object.keys(prefs.stock).length) {
    const servings = portionsFor(prefs.adults, prefs.kids);
    const score = (r: Recipe) =>
      r.ingredients.reduce((s, ri) => {
        const have = prefs.stock?.[ri.id] ?? 0;
        if (!have) return s;
        const ing = INGREDIENT_BY_ID[ri.id];
        return s + Math.min(have, ri.qty * servings) * (bestStoreFor(ing, stores).packPrice / ing.pack.size);
      }, 0);
    const byScore = (a: Recipe, b: Recipe) => score(b) - score(a);
    mains = [...mains].sort(byScore);
    breakfasts = [...breakfasts].sort(byScore);
  }
  const mainFloor = Math.min(3, mains.length);
  const breakfastFloor = Math.min(2, breakfasts.length);
  let trimmed = 0;
  let plan = assemble(prefs, mains, breakfasts, trimmed, excluded, choices, byId);

  while (plan.overBudget && (mains.length > mainFloor || breakfasts.length > breakfastFloor)) {
    const priciestMain = [...mains].sort(byCost).at(-1)!;
    const priciestBreakfast = [...breakfasts].sort(byCost).at(-1)!;
    const usesBreakfast = prefs.mealsPerDay === 3;
    if (mains.length > mainFloor && (!usesBreakfast || breakfasts.length <= breakfastFloor || costPerServing(priciestMain, stores) >= costPerServing(priciestBreakfast, stores))) {
      mains = mains.filter((r) => r !== priciestMain);
    } else if (usesBreakfast && breakfasts.length > breakfastFloor) {
      breakfasts = breakfasts.filter((r) => r !== priciestBreakfast);
    } else {
      break;
    }
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
}

/**
 * Alternatives for one slot, ranked by what's already in the basket.
 * Packs are bought whole, so the rest of the week leaves leftovers (most of a
 * tray of eggs, half a bag of rice). A dish those leftovers cover costs
 * nothing extra; a dish that needs something that ran out is flagged.
 */
export function swapOptions(prefs: Preferences, plan: WeeklyPlan, meal: PlannedMeal): SwapOption[] {
  const pinned = pinAll(plan);
  const key = slotKey(meal.day, meal.slot);
  const without = planWeek(prefs, { ...pinned, [key]: SKIP });
  const packsWithout = new Map(without.grocery.map((g) => [g.ingredient.id, g.packs]));
  const stores = resolveStores(prefs.stores);
  const { safe } = safeRecipes(prefs.allergies ?? [], prefs.blacklist);
  const isBreakfast = meal.slot === 'breakfast';
  const pool = safe.filter((r) => (isBreakfast ? r.slots.includes('breakfast') : !r.slots.includes('breakfast')));

  return pool
    .map((r) => {
      const withIt = planWeek(prefs, { ...pinned, [key]: r.id });
      const needs = withIt.grocery
        .filter((g) => g.packs > (packsWithout.get(g.ingredient.id) ?? 0))
        .map((g) => g.ingredient.name);
      return {
        recipe: r,
        costPerServing: round2(costPerServing(r, stores)),
        extra: round2(Math.max(0, withIt.total - without.total)),
        needs,
        current: r.id === meal.recipe.id,
        sameDay: plan.meals.some((m) => m.day === meal.day && m.slot !== meal.slot && m.recipe.id === r.id),
      };
    })
    .sort(
      (a, b) =>
        Number(b.current) - Number(a.current) ||
        Number(a.sameDay) - Number(b.sameDay) ||
        a.needs.length - b.needs.length ||
        a.extra - b.extra,
    );
}

/** Recipes still available for a slot type after allergies and the blacklist. */
export function poolSize(prefs: Preferences, slot: Slot, extraBan?: string) {
  const { safe } = safeRecipes(prefs.allergies ?? [], [...(prefs.blacklist ?? []), ...(extraBan ? [extraBan] : [])]);
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
