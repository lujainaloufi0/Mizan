import { INGREDIENTS } from './catalog/ingredients';
import { RECIPES as ALL_RECIPES } from './catalog/recipes';
import type { AisleId, Allergen, DayId, GoalId, Ingredient, Slot, Store } from './types';

/* ───────────────────────── Stores ─────────────────────────
 * Prototype pricing model: each store has a shelf-price factor against a
 * market baseline, plus this week's aisle deals. Swap for live feeds later. */

export const STORES: Store[] = [
  { id: 'carrefour', name: 'كارفور', nameEn: 'Carrefour', factor: 1.0, deals: { grains: 0.85, dairy: 0.95 }, dealNote: 'خصم 15% على الأرز والحبوب', tint: '#7FA7E8' },
  { id: 'panda', name: 'بنده', nameEn: 'Panda', factor: 0.98, deals: { meat: 0.82 }, dealNote: 'خصم 18% على الدواجن واللحوم', tint: '#F08F6F' },
  { id: 'othaim', name: 'العثيم', nameEn: 'Othaim', factor: 0.95, deals: { produce: 0.88 }, dealNote: 'خضار الأسبوع بخصم 12%', tint: '#F2C46B' },
  { id: 'danube', name: 'الدانوب', nameEn: 'Danube', factor: 1.08, deals: { fish: 0.85, bakery: 0.9 }, dealNote: 'الأسماك الطازجة بخصم 15%', tint: '#6CC4C4' },
  { id: 'tamimi', name: 'التميمي', nameEn: 'Tamimi', factor: 1.06, deals: { dairy: 0.85 }, dealNote: 'الألبان بخصم 15%', tint: '#B39DE0' },
  { id: 'lulu', name: 'لولو', nameEn: 'LuLu', factor: 0.97, deals: { spices: 0.8, fish: 0.92 }, dealNote: 'البهارات بخصم 20%', tint: '#E58FAE' },
];

export const STORE_BY_ID = Object.fromEntries(STORES.map((s) => [s.id, s])) as Record<Store['id'], Store>;

/* ───────────────────────── Calendar ───────────────────────── */

export const DAYS: { id: DayId; name: string; short: string }[] = [
  { id: 'sun', name: 'الأحد', short: 'أحد' },
  { id: 'mon', name: 'الإثنين', short: 'إثنين' },
  { id: 'tue', name: 'الثلاثاء', short: 'ثلاثاء' },
  { id: 'wed', name: 'الأربعاء', short: 'أربعاء' },
  { id: 'thu', name: 'الخميس', short: 'خميس' },
  { id: 'fri', name: 'الجمعة', short: 'جمعة' },
  { id: 'sat', name: 'السبت', short: 'سبت' },
];

export const SLOT_LABEL: Record<Slot, string> = {
  breakfast: 'فطور',
  lunch: 'غداء',
  dinner: 'عشاء',
};

export const SLOTS_FOR_MEALS: Record<1 | 2 | 3, Slot[]> = {
  1: ['lunch'],
  2: ['lunch', 'dinner'],
  3: ['breakfast', 'lunch', 'dinner'],
};

/* ───────────────────────── Aisles (walking order) ───────────────────────── */

export const AISLES: { id: AisleId; name: string }[] = [
  { id: 'produce', name: 'الخضار والفواكه' },
  { id: 'bakery', name: 'المخبوزات' },
  { id: 'meat', name: 'اللحوم والدواجن' },
  { id: 'fish', name: 'الأسماك' },
  { id: 'dairy', name: 'الألبان والبيض' },
  { id: 'grains', name: 'الأرز والحبوب' },
  { id: 'pantry', name: 'المعلبات والزيوت' },
  { id: 'spices', name: 'البهارات والتوابل' },
];

/* ───────────────────────── Catalog ─────────────────────────
 * Ingredients, cuisines and recipes live in ./catalog. */

export { INGREDIENTS } from './catalog/ingredients';
export { RECIPES } from './catalog/recipes';
export { CUISINES, CUISINE_BY_ID } from './catalog/cuisines';

/* ───────────────────────── Shelf life ─────────────────────────
 * What realistically carries over to next week. Short-life items (fresh meat,
 * leafy greens, bread, fresh dairy) are never offered as leftovers. */

export type Keeps = 'short' | 'medium' | 'long';

const KEEPS_BY_AISLE: Record<AisleId, Keeps> = {
  produce: 'short',
  bakery: 'short',
  meat: 'short',
  fish: 'short',
  dairy: 'short',
  grains: 'long',
  pantry: 'long',
  spices: 'long',
};

const KEEPS_OVERRIDE: Record<string, Keeps> = {
  onion: 'medium',
  garlic: 'medium',
  potato: 'medium',
  carrot: 'medium',
  lemon: 'medium',
  dates: 'long',
  eggs: 'medium',
  ginger: 'medium',
  sweet_potato: 'medium',
  cabbage: 'medium',
  lime: 'medium',
  ghee: 'long',
  butter: 'medium',
  parmesan: 'medium',
  molokhia: 'long',
  peas: 'long',
  tortilla: 'medium',
  toast: 'medium',
};

export const keepsOf = (id: string): Keeps => KEEPS_OVERRIDE[id] ?? KEEPS_BY_AISLE[INGREDIENT_BY_ID[id].aisle];

/* ───────────────────────── Allergies ───────────────────────── */

/** Eating goals. `adultPortion` scales an adult's serving (kids stay at half). */
export const GOALS: { id: GoalId; name: string; hint: string; adultPortion: number }[] = [
  { id: 'balanced', name: 'متوازن', hint: 'أكل بيتي متنوّع لكل العائلة', adultPortion: 1 },
  { id: 'protein', name: 'عالي البروتين', hint: 'للنادي والرياضة: بروتين أعلى بكل وجبة', adultPortion: 1 },
  { id: 'cut', name: 'تنشيف', hint: 'سعرات أقل وبروتين عالي لنزول الوزن', adultPortion: 1 },
  { id: 'bulk', name: 'تضخيم', hint: 'سعرات وبروتين أعلى وحصص أكبر للبالغين', adultPortion: 1.25 },
];
export const GOAL_BY_ID = Object.fromEntries(GOALS.map((g) => [g.id, g])) as Record<GoalId, (typeof GOALS)[number]>;

export const ALLERGENS: Allergen[] = [
  { id: 'gluten', name: 'الغلوتين', hint: 'خبز، معكرونة، جريش' },
  { id: 'dairy', name: 'الألبان', hint: 'حليب، لبن، زبادي' },
  { id: 'egg', name: 'البيض', hint: 'شكشوكة، أومليت' },
  { id: 'fish', name: 'الأسماك', hint: 'هامور وغيره' },
  { id: 'shellfish', name: 'القشريات', hint: 'روبيان، سلطعون' },
  { id: 'nuts', name: 'المكسرات', hint: 'لوز، كاجو، فول سوداني' },
  { id: 'sesame', name: 'السمسم', hint: 'طحينة' },
  { id: 'legumes', name: 'البقوليات', hint: 'عدس، فول' },
];

export const RECIPE_BY_ID = Object.fromEntries(ALL_RECIPES.map((r) => [r.id, r])) as Record<string, (typeof ALL_RECIPES)[number]>;

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i])) as Record<string, Ingredient>;

/** Pantry step sections, in the order people scan a kitchen: spices first. */
export const PANTRY_SECTIONS: { aisle: AisleId; name: string }[] = [
  { aisle: 'spices', name: 'البهارات والتوابل' },
  { aisle: 'produce', name: 'الخضار والفواكه' },
  { aisle: 'meat', name: 'اللحوم والدواجن' },
  { aisle: 'fish', name: 'الأسماك' },
  { aisle: 'dairy', name: 'الألبان والبيض' },
  { aisle: 'grains', name: 'الأرز والحبوب' },
  { aisle: 'pantry', name: 'المعلبات والزيوت' },
  { aisle: 'bakery', name: 'المخبوزات' },
];
