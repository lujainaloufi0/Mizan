/**
 * Mizan IconMap — one place that decides how everything is drawn.
 *
 * One family: minimalist line art. Lucide where it has the shape, Mizan's own
 * set (icons/food.tsx) where it doesn't, both on the same 24px grid and drawn
 * at the same stroke weight (globals.css → `.lucide`).
 *
 * Food icons take their colour from their aisle (AISLE_HUE), so the list stays
 * scannable without leaving the line-art style.
 */
import {
  Bean,
  BeanOff,
  Beef,
  CalendarDays,
  Carrot,
  Citrus,
  CookingPot,
  Drumstick,
  Egg,
  EggFried,
  EggOff,
  Fish,
  FishOff,
  Leaf,
  LeafyGreen,
  Microwave,
  Milk,
  MilkOff,
  Moon,
  NutOff,
  PiggyBank,
  Refrigerator,
  Salad,
  Scale,
  ShoppingCart,
  Shrimp,
  Soup,
  Sprout,
  Store,
  Sun,
  Sunrise,
  Wheat,
  WheatOff,
  Blender,
} from 'lucide-react';
import type { AisleId, AllergenId, EquipmentId, Slot } from '@/lib/types';
import {
  BellPepper,
  Can,
  Cardamom,
  Cinnamon,
  Cucumber,
  DateFruit,
  DriedLime,
  Eggplant,
  Flatbread,
  Garlic,
  Jar,
  OilBottle,
  Olive,
  Onion,
  Oven,
  Pan,
  Pasta,
  PepperMill,
  Potato,
  RiceBowl,
  Root,
  SaltShaker,
  Seeds,
  SpiceJar,
  Tomato,
  YogurtCup,
  type IconComponent,
} from './icons/food';

/** Any icon in the family: a Lucide icon or one of Mizan's own. */
export type LineIcon = IconComponent | typeof Carrot;

export const INGREDIENT_ICON: Record<string, LineIcon> = {
  // produce
  tomato: Tomato,
  onion: Onion,
  garlic: Garlic,
  cucumber: Cucumber,
  lettuce: LeafyGreen,
  eggplant: Eggplant,
  potato: Potato,
  carrot: Carrot,
  capsicum: BellPepper,
  lemon: Citrus,
  parsley: Sprout,
  dates: DateFruit,
  // bakery
  bread: Flatbread,
  // meat & fish
  chicken: Drumstick,
  chicken_breast: Drumstick,
  minced_beef: Beef,
  hamour: Fish,
  // dairy
  eggs: Egg,
  milk: Milk,
  laban: Milk,
  yogurt: YogurtCup,
  labneh: YogurtCup,
  // grains
  basmati: RiceBowl,
  jareesh: Wheat,
  oats: Wheat,
  pasta: Pasta,
  lentils: Bean,
  // pantry
  fava: Can,
  chickpeas: Can,
  tomato_paste: Can,
  tahini: Jar,
  olives: Olive,
  olive_oil: OilBottle,
  veg_oil: OilBottle,
  // spices
  salt: SaltShaker,
  black_pepper: PepperMill,
  cumin: SpiceJar,
  kabsa_spice: SpiceJar,
  paprika: SpiceJar,
  zaatar: Leaf,
  turmeric: Root,
  cardamom: Cardamom,
  cinnamon: Cinnamon,
  dried_lime: DriedLime,
};

export const AISLE_ICON: Record<AisleId, LineIcon> = {
  produce: Carrot,
  bakery: Flatbread,
  meat: Drumstick,
  fish: Fish,
  dairy: Milk,
  grains: RiceBowl,
  pantry: Can,
  spices: SpiceJar,
};

/** Each aisle's stroke colour on the dark surface: muted, warm, distinguishable. */
export const AISLE_HUE: Record<AisleId, string> = {
  produce: '#7FD4A6',
  bakery: '#E8C99A',
  meat: '#F0A08A',
  fish: '#8CC8E0',
  dairy: '#C3CCEB',
  grains: '#E5D4C0',
  pantry: '#D9B98C',
  spices: '#F2B272',
};

export const RECIPE_ICON: Record<string, LineIcon> = {
  kabsa: RiceBowl,
  maqluba: Eggplant,
  lentil_soup: Soup,
  jareesh: Wheat,
  pasta_beef: Pasta,
  hamour: Fish,
  kofta: Beef,
  lemon_chicken: Drumstick,
  fattoush: Salad,
  shakshuka: Tomato,
  foul: CookingPot,
  omelette: EggFried,
  boiled_eggs: Egg,
  labneh_zaatar: Leaf,
  oats_dates: DateFruit,
  hummus: Bean,
  spiced_potatoes: Potato,
};

export const SLOT_ICON: Record<Slot, LineIcon> = {
  breakfast: Sunrise,
  lunch: Sun,
  dinner: Moon,
};

export const APP_ICON = {
  cart: ShoppingCart,
  week: CalendarDays,
  budget: Scale,
  savings: PiggyBank,
  store: Store,
} as const;

export const EQUIPMENT: Record<EquipmentId, { name: string; icon: LineIcon }> = {
  pot: { name: 'قدر', icon: CookingPot },
  pan: { name: 'مقلاة', icon: Pan },
  oven: { name: 'فرن', icon: Oven },
  blender: { name: 'خلاط', icon: Blender },
  microwave: { name: 'مايكرويف', icon: Microwave },
  fridge: { name: 'ثلاجة', icon: Refrigerator },
};

export const ALLERGEN_ICON: Record<AllergenId, LineIcon> = {
  gluten: WheatOff,
  dairy: MilkOff,
  egg: EggOff,
  fish: FishOff,
  shellfish: Shrimp,
  nuts: NutOff,
  sesame: Seeds,
  legumes: BeanOff,
};
