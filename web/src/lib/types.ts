export type StoreId = 'carrefour' | 'panda' | 'othaim' | 'danube' | 'tamimi' | 'lulu';

export type DayId = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export type Slot = 'breakfast' | 'lunch' | 'dinner';

export type AisleId = 'produce' | 'meat' | 'fish' | 'dairy' | 'bakery' | 'grains' | 'pantry' | 'spices';

export type Unit = 'g' | 'ml' | 'pc';

export type EquipmentId = 'pot' | 'pan' | 'oven' | 'blender' | 'microwave' | 'fridge';

export type AllergenId = 'gluten' | 'dairy' | 'egg' | 'fish' | 'shellfish' | 'nuts' | 'sesame' | 'legumes';

export interface Allergen {
  id: AllergenId;
  name: string;
  hint: string;
}

export interface Store {
  id: StoreId;
  name: string;
  nameEn: string;
  /** shelf-price multiplier vs. market baseline */
  factor: number;
  /** this week's aisle promotions, as price multipliers */
  deals: Partial<Record<AisleId, number>>;
  /** short human description of the headline deal */
  dealNote: string;
  tint: string;
}

export interface Ingredient {
  id: string;
  name: string;
  aisle: AisleId;
  unit: Unit;
  pack: { size: number; label: string; price: number };
  allergens?: AllergenId[];
}

export interface RecipeIngredient {
  id: string;
  /** quantity per one serving, in the ingredient's unit */
  qty: number;
  /** a side or garnish the dish works without (dropped for allergies) */
  optional?: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  slots: Slot[];
  minutes: number;
  /** kitchen equipment the method needs */
  equipment: EquipmentId[];
  macros: { kcal: number; protein: number; carbs: number; fat: number };
  ingredients: RecipeIngredient[];
  steps: string[];
  coachTip: string;
}

export interface Preferences {
  stores: StoreId[];
  adults: number;
  kids: number;
  days: DayId[];
  mealsPerDay: 1 | 2 | 3;
  allergies: AllergenId[];
  /** recipe ids the household never wants suggested */
  blacklist?: string[];
  pantry: string[];
  /** measured leftovers on hand (ingredient id → quantity in its unit), deducted from the list */
  stock?: Record<string, number>;
  budget: number;
}

export interface PlannedMeal {
  day: DayId;
  slot: Slot;
  recipe: Recipe;
  servings: number;
  costPerServing: number;
  totalCost: number;
  /** optional ingredients left out because of allergies */
  removed: string[];
  /** leftover ingredients this dish uses up */
  usesStock: string[];
}

export interface GroceryItem {
  ingredient: Ingredient;
  needed: number;
  /** what the whole packs leave over after this week's meals */
  leftover: number;
  /** part of the need covered by leftovers already in the kitchen */
  fromStock: number;
  packs: number;
  store: Store;
  price: number;
  /** average regular shelf price across the selected stores, no deals */
  regularPrice: number;
}

export interface WeeklyPlan {
  meals: PlannedMeal[];
  grocery: GroceryItem[];
  skippedFromPantry: Ingredient[];
  /** needs fully covered by last week's leftovers */
  coveredByStock: { ingredient: Ingredient; qty: number }[];
  /** SAR the leftovers saved on this week's basket */
  stockSaved: number;
  servings: number;
  total: number;
  regularTotal: number;
  saved: number;
  budget: number;
  overBudget: boolean;
  /** recipes dropped to fit the budget */
  trimmed: number;
  allergies: AllergenId[];
  /** recipes excluded because they contain an allergen */
  excludedForAllergies: number;
  byStore: { store: Store; total: number; items: number }[];
}
