import type { AisleId, Allergen, DayId, Ingredient, Recipe, Slot, Store } from './types';

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

/* ───────────────────────── Ingredients ─────────────────────────
 * pack.price is the baseline regular shelf price in SAR. */

export const INGREDIENTS: Ingredient[] = [
  // meat & fish
  { id: 'chicken', name: 'دجاج كامل مقطّع', aisle: 'meat', unit: 'g', pack: { size: 1000, label: '1 كجم', price: 22 } },
  { id: 'chicken_breast', name: 'صدور دجاج', aisle: 'meat', unit: 'g', pack: { size: 1000, label: '1 كجم', price: 32 } },
  { id: 'minced_beef', name: 'لحم بقري مفروم', aisle: 'meat', unit: 'g', pack: { size: 500, label: '500 غ', price: 28 } },
  { id: 'hamour', name: 'سمك هامور', aisle: 'fish', unit: 'g', pack: { size: 1000, label: '1 كجم', price: 65 }, allergens: ['fish'] },
  // grains
  { id: 'basmati', name: 'أرز بسمتي', aisle: 'grains', unit: 'g', pack: { size: 5000, label: '5 كجم', price: 58 } },
  { id: 'jareesh', name: 'جريش', aisle: 'grains', unit: 'g', pack: { size: 1000, label: '1 كجم', price: 12 }, allergens: ['gluten'] },
  { id: 'pasta', name: 'معكرونة', aisle: 'grains', unit: 'g', pack: { size: 500, label: '500 غ', price: 6 }, allergens: ['gluten'] },
  { id: 'lentils', name: 'عدس أحمر', aisle: 'grains', unit: 'g', pack: { size: 1000, label: '1 كجم', price: 9 }, allergens: ['legumes'] },
  // produce
  { id: 'onion', name: 'بصل', aisle: 'produce', unit: 'g', pack: { size: 1000, label: '1 كجم', price: 4 } },
  { id: 'garlic', name: 'ثوم', aisle: 'produce', unit: 'g', pack: { size: 250, label: '250 غ', price: 4 } },
  { id: 'tomato', name: 'طماطم', aisle: 'produce', unit: 'g', pack: { size: 1000, label: '1 كجم', price: 6 } },
  { id: 'cucumber', name: 'خيار', aisle: 'produce', unit: 'g', pack: { size: 1000, label: '1 كجم', price: 6 } },
  { id: 'lettuce', name: 'خس', aisle: 'produce', unit: 'pc', pack: { size: 1, label: 'حبة', price: 4 } },
  { id: 'eggplant', name: 'باذنجان', aisle: 'produce', unit: 'g', pack: { size: 1000, label: '1 كجم', price: 7 } },
  { id: 'potato', name: 'بطاطس', aisle: 'produce', unit: 'g', pack: { size: 1000, label: '1 كجم', price: 5 } },
  { id: 'carrot', name: 'جزر', aisle: 'produce', unit: 'g', pack: { size: 1000, label: '1 كجم', price: 5 } },
  { id: 'capsicum', name: 'فلفل رومي', aisle: 'produce', unit: 'g', pack: { size: 500, label: '500 غ', price: 7 } },
  { id: 'lemon', name: 'ليمون', aisle: 'produce', unit: 'g', pack: { size: 500, label: '500 غ', price: 5 } },
  { id: 'parsley', name: 'بقدونس', aisle: 'produce', unit: 'pc', pack: { size: 1, label: 'ربطة', price: 2 } },
  // bakery
  { id: 'bread', name: 'خبز عربي', aisle: 'bakery', unit: 'pc', pack: { size: 6, label: 'كيس 6 أرغفة', price: 3 }, allergens: ['gluten'] },
  // dairy
  { id: 'eggs', name: 'بيض', aisle: 'dairy', unit: 'pc', pack: { size: 30, label: 'طبق 30', price: 22 }, allergens: ['egg'] },
  { id: 'milk', name: 'حليب طازج', aisle: 'dairy', unit: 'ml', pack: { size: 2000, label: '2 لتر', price: 12 }, allergens: ['dairy'] },
  { id: 'laban', name: 'لبن', aisle: 'dairy', unit: 'ml', pack: { size: 2000, label: '2 لتر', price: 11 }, allergens: ['dairy'] },
  { id: 'yogurt', name: 'زبادي', aisle: 'dairy', unit: 'g', pack: { size: 1000, label: '1 كجم', price: 10 }, allergens: ['dairy'] },
  // pantry
  { id: 'fava', name: 'فول مدمس', aisle: 'pantry', unit: 'g', pack: { size: 400, label: 'علبة 400 غ', price: 3.5 }, allergens: ['legumes'] },
  { id: 'tahini', name: 'طحينة', aisle: 'pantry', unit: 'g', pack: { size: 400, label: '400 غ', price: 12 }, allergens: ['sesame'] },
  { id: 'tomato_paste', name: 'معجون طماطم', aisle: 'pantry', unit: 'g', pack: { size: 400, label: '400 غ', price: 6 } },
  { id: 'olive_oil', name: 'زيت زيتون', aisle: 'pantry', unit: 'ml', pack: { size: 1000, label: '1 لتر', price: 38 } },
  { id: 'veg_oil', name: 'زيت نباتي', aisle: 'pantry', unit: 'ml', pack: { size: 1500, label: '1.5 لتر', price: 18 } },
  // spices
  { id: 'kabsa_spice', name: 'بهارات كبسة', aisle: 'spices', unit: 'g', pack: { size: 100, label: '100 غ', price: 8 } },
  { id: 'cumin', name: 'كمون', aisle: 'spices', unit: 'g', pack: { size: 100, label: '100 غ', price: 6 } },
  { id: 'black_pepper', name: 'فلفل أسود', aisle: 'spices', unit: 'g', pack: { size: 100, label: '100 غ', price: 7 } },
  { id: 'salt', name: 'ملح', aisle: 'spices', unit: 'g', pack: { size: 1000, label: '1 كجم', price: 2 } },
  { id: 'zaatar', name: 'زعتر', aisle: 'spices', unit: 'g', pack: { size: 200, label: '200 غ', price: 9 }, allergens: ['sesame'] },
  { id: 'labneh', name: 'لبنة', aisle: 'dairy', unit: 'g', pack: { size: 500, label: '500 غ', price: 14 }, allergens: ['dairy'] },
  { id: 'oats', name: 'شوفان', aisle: 'grains', unit: 'g', pack: { size: 500, label: '500 غ', price: 9 }, allergens: ['gluten'] },
  { id: 'dates', name: 'تمر', aisle: 'produce', unit: 'g', pack: { size: 1000, label: '1 كجم', price: 20 } },
  { id: 'chickpeas', name: 'حمص حب', aisle: 'pantry', unit: 'g', pack: { size: 400, label: 'علبة 400 غ', price: 4 }, allergens: ['legumes'] },
  { id: 'olives', name: 'زيتون', aisle: 'pantry', unit: 'g', pack: { size: 500, label: '500 غ', price: 14 } },
  { id: 'turmeric', name: 'كركم', aisle: 'spices', unit: 'g', pack: { size: 100, label: '100 غ', price: 5 } },
  { id: 'paprika', name: 'بابريكا', aisle: 'spices', unit: 'g', pack: { size: 100, label: '100 غ', price: 7 } },
  { id: 'cardamom', name: 'هيل', aisle: 'spices', unit: 'g', pack: { size: 100, label: '100 غ', price: 18 } },
  { id: 'cinnamon', name: 'قرفة', aisle: 'spices', unit: 'g', pack: { size: 100, label: '100 غ', price: 6 } },
  { id: 'dried_lime', name: 'لومي', aisle: 'spices', unit: 'pc', pack: { size: 10, label: 'كيس 10 حبات', price: 6 } },
];

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
};

export const keepsOf = (id: string): Keeps => KEEPS_OVERRIDE[id] ?? KEEPS_BY_AISLE[INGREDIENT_BY_ID[id].aisle];

/* ───────────────────────── Allergies ───────────────────────── */

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

/* ───────────────────────── Recipes ───────────────────────── */

export const RECIPES: Recipe[] = [
  {
    id: 'kabsa',
    title: 'كبسة دجاج',
    slots: ['lunch', 'dinner'],
    minutes: 50,
    equipment: ['pot'],
    macros: { kcal: 640, protein: 38, carbs: 68, fat: 22 },
    ingredients: [
      { id: 'chicken', qty: 250 }, { id: 'basmati', qty: 100 }, { id: 'onion', qty: 50 },
      { id: 'tomato', qty: 60 }, { id: 'tomato_paste', qty: 10 }, { id: 'garlic', qty: 5 },
      { id: 'kabsa_spice', qty: 4 }, { id: 'cardamom', qty: 1 }, { id: 'dried_lime', qty: 0.3 }, { id: 'veg_oil', qty: 15 }, { id: 'salt', qty: 3 },
    ],
    steps: [
      'اغسل الأرز وانقعه في ماء فاتر عشرين دقيقة.',
      'حمّر البصل والثوم في الزيت، ثم أضف الدجاج وقلّبه حتى يتغيّر لونه.',
      'أضف الطماطم والمعجون والبهارات، ثم الماء المغلي واتركه ينضج 25 دقيقة.',
      'ارفع الدجاج وأضف الأرز إلى المرق، وغطِّه على نار هادئة حتى ينضج.',
    ],
    coachTip: 'حمّص الدجاج في الفرن على أعلى حرارة خمس دقائق قبل التقديم، يأخذ لوناً ذهبياً من غير زيت زيادة.',
  },
  {
    id: 'lentil_soup',
    title: 'شوربة عدس بالليمون',
    slots: ['lunch', 'dinner'],
    minutes: 30,
    equipment: ['pot', 'blender'],
    macros: { kcal: 380, protein: 18, carbs: 56, fat: 10 },
    ingredients: [
      { id: 'lentils', qty: 70 }, { id: 'onion', qty: 40 }, { id: 'carrot', qty: 40 },
      { id: 'garlic', qty: 4 }, { id: 'cumin', qty: 2 }, { id: 'turmeric', qty: 1 }, { id: 'olive_oil', qty: 10 },
      { id: 'lemon', qty: 20 }, { id: 'salt', qty: 2 }, { id: 'bread', qty: 1, optional: true },
    ],
    steps: [
      'شوّح البصل والجزر المقطّع في زيت الزيتون خمس دقائق.',
      'أضف العدس المغسول والثوم والكمون وغطّه بالماء.',
      'اتركه ينضج عشرين دقيقة، ثم اهرسه بالخلاط حتى يصير ناعماً.',
      'قدّمه مع عصرة ليمون وخبز محمّص.',
    ],
    coachTip: 'حمّص الخبز المتبقي من أمس بالفرن ليصير مقرمشاً بدل ما ترميه.',
  },
  {
    id: 'fattoush',
    title: 'فتوش مع دجاج مشوي',
    slots: ['lunch', 'dinner'],
    minutes: 25,
    equipment: ['pan', 'oven'],
    macros: { kcal: 450, protein: 36, carbs: 30, fat: 20 },
    ingredients: [
      { id: 'chicken_breast', qty: 150 }, { id: 'lettuce', qty: 0.25 }, { id: 'tomato', qty: 60 },
      { id: 'cucumber', qty: 60 }, { id: 'parsley', qty: 0.2 }, { id: 'lemon', qty: 15 },
      { id: 'olive_oil', qty: 15 }, { id: 'bread', qty: 1, optional: true },
    ],
    steps: [
      'تبّل صدور الدجاج بالليمون والملح واشوِها ست دقائق لكل جهة.',
      'قطّع الخس والطماطم والخيار والبقدونس قطعاً كبيرة.',
      'حمّص الخبز في الفرن حتى يقرمش ثم كسّره فوق السلطة.',
      'اخلط زيت الزيتون والليمون وصبّه قبل التقديم مباشرة.',
    ],
    coachTip: 'اشوِ كمية دجاج مضاعفة، والنصف الثاني يصير حشوة سندويتشات لغداء الغد.',
  },
  {
    id: 'maqluba',
    title: 'مقلوبة باذنجان بالدجاج',
    slots: ['lunch', 'dinner'],
    minutes: 60,
    equipment: ['pot', 'oven'],
    macros: { kcal: 690, protein: 34, carbs: 74, fat: 28 },
    ingredients: [
      { id: 'chicken', qty: 200 }, { id: 'basmati', qty: 90 }, { id: 'eggplant', qty: 150 },
      { id: 'potato', qty: 80 }, { id: 'onion', qty: 40 }, { id: 'veg_oil', qty: 25 },
      { id: 'cumin', qty: 2 }, { id: 'cinnamon', qty: 0.5 }, { id: 'salt', qty: 3 }, { id: 'yogurt', qty: 80, optional: true },
    ],
    steps: [
      'اسلق الدجاج مع البصل والملح واحتفظ بالمرق.',
      'اشوِ شرائح الباذنجان والبطاطس في الفرن بقليل من الزيت.',
      'رصّ الدجاج ثم الخضار ثم الأرز في القدر، وأضف المرق الساخن.',
      'اطبخه على نار هادئة 25 دقيقة، ثم اقلبه في صينية وقدّمه مع الزبادي.',
    ],
    coachTip: 'شوي الباذنجان في الفرن بدل القلي يوفّر نصف الزيت ويعطي نفس الطعم.',
  },
  {
    id: 'jareesh',
    title: 'جريش بالدجاج',
    slots: ['lunch', 'dinner'],
    minutes: 70,
    equipment: ['pot'],
    macros: { kcal: 520, protein: 32, carbs: 54, fat: 16 },
    ingredients: [
      { id: 'jareesh', qty: 80 }, { id: 'chicken', qty: 150 }, { id: 'laban', qty: 150 },
      { id: 'onion', qty: 40 }, { id: 'garlic', qty: 4 }, { id: 'cumin', qty: 2 },
      { id: 'salt', qty: 3 }, { id: 'veg_oil', qty: 10 },
    ],
    steps: [
      'انقع الجريش ساعة على الأقل ثم اغسله جيداً.',
      'اسلق الدجاج مع نصف البصل، ثم أضف الجريش إلى المرق.',
      'اتركه على نار هادئة مع التحريك حتى يتماسك، ثم أضف اللبن.',
      'زيّنه بالبصل المحمّر والثوم والكمون قبل التقديم.',
    ],
    coachTip: 'انقع الجريش من الليلة السابقة، ينضج في نصف الوقت.',
  },
  {
    id: 'pasta_beef',
    title: 'معكرونة بصلصة الطماطم واللحم',
    slots: ['lunch', 'dinner'],
    minutes: 30,
    equipment: ['pot', 'pan'],
    macros: { kcal: 610, protein: 32, carbs: 70, fat: 20 },
    ingredients: [
      { id: 'pasta', qty: 110 }, { id: 'minced_beef', qty: 120 }, { id: 'tomato', qty: 100 },
      { id: 'tomato_paste', qty: 15 }, { id: 'onion', qty: 40 }, { id: 'garlic', qty: 5 },
      { id: 'olive_oil', qty: 10 }, { id: 'black_pepper', qty: 1 }, { id: 'salt', qty: 2 },
    ],
    steps: [
      'اسلق المعكرونة في ماء مملّح حسب التعليمات واحتفظ بكوب من مائها.',
      'حمّر اللحم المفروم مع البصل والثوم حتى يتبخّر سائله.',
      'أضف الطماطم المبشورة والمعجون واتركها تتسبّك عشر دقائق.',
      'اخلط المعكرونة بالصلصة مع قليل من ماء السلق حتى تلمع.',
    ],
    coachTip: 'ماء سلق المعكرونة هو سرّ الصلصة الكريمية، لا تصبّه كله في المغسلة.',
  },
  {
    id: 'hamour',
    title: 'هامور مشوي مع أرز صيادية',
    slots: ['lunch', 'dinner'],
    minutes: 45,
    equipment: ['pan', 'oven'],
    macros: { kcal: 590, protein: 40, carbs: 62, fat: 18 },
    ingredients: [
      { id: 'hamour', qty: 200 }, { id: 'basmati', qty: 90 }, { id: 'onion', qty: 50 },
      { id: 'cumin', qty: 2 }, { id: 'lemon', qty: 20 }, { id: 'veg_oil', qty: 15 },
      { id: 'salt', qty: 3 },
    ],
    steps: [
      'تبّل السمك بالليمون والكمون والملح واتركه ربع ساعة.',
      'كرمِل البصل في الزيت حتى يغمق لونه، ثم أضف الماء والأرز.',
      'اشوِ السمك في الفرن على 220 درجة لمدة 15 دقيقة.',
      'قدّم السمك فوق الأرز مع شرائح الليمون.',
    ],
    coachTip: 'البصل المكرمل الغامق هو لون الصيادية الحقيقي، اصبر عليه ولا ترفع النار.',
  },
  {
    id: 'kofta',
    title: 'كفتة بالفرن مع البطاطس',
    slots: ['lunch', 'dinner'],
    minutes: 45,
    equipment: ['oven'],
    macros: { kcal: 560, protein: 34, carbs: 46, fat: 26 },
    ingredients: [
      { id: 'minced_beef', qty: 150 }, { id: 'potato', qty: 150 }, { id: 'tomato', qty: 80 },
      { id: 'onion', qty: 40 }, { id: 'parsley', qty: 0.15 }, { id: 'tomato_paste', qty: 10 },
      { id: 'black_pepper', qty: 1 }, { id: 'salt', qty: 2 }, { id: 'bread', qty: 1, optional: true },
    ],
    steps: [
      'اخلط اللحم مع البصل المبشور والبقدونس والفلفل وشكّله أصابع.',
      'رصّ الكفتة مع شرائح البطاطس والطماطم في صينية.',
      'صبّ فوقها المعجون مذاباً في كوب ماء.',
      'اخبزها على 200 درجة لمدة 35 دقيقة حتى تتحمّر.',
    ],
    coachTip: 'بلّل يديك بالماء وأنت تشكّل الكفتة، ما يلصق اللحم وتطلع الأصابع متساوية.',
  },
  {
    id: 'lemon_chicken',
    title: 'دجاج بالليمون مع خضار مشوية',
    slots: ['lunch', 'dinner'],
    minutes: 40,
    equipment: ['oven'],
    macros: { kcal: 520, protein: 42, carbs: 34, fat: 22 },
    ingredients: [
      { id: 'chicken', qty: 250 }, { id: 'potato', qty: 120 }, { id: 'carrot', qty: 60 },
      { id: 'capsicum', qty: 50 }, { id: 'lemon', qty: 25 }, { id: 'garlic', qty: 5 },
      { id: 'paprika', qty: 2 }, { id: 'olive_oil', qty: 15 }, { id: 'salt', qty: 2 },
    ],
    steps: [
      'تبّل الدجاج بالليمون والثوم والبابريكا والملح واتركه ربع ساعة.',
      'قطّع البطاطس والجزر والفلفل قطعاً متساوية ورشّها بزيت الزيتون.',
      'رصّ الدجاج فوق الخضار في صينية واحدة.',
      'اشوِها على 210 درجة لمدة 35 دقيقة مع التقليب مرة واحدة.',
    ],
    coachTip: 'صينية واحدة للوجبة كلها، يعني غسيل أقل ووقت أقل في المطبخ.',
  },
  {
    id: 'shakshuka',
    title: 'شكشوكة',
    slots: ['breakfast'],
    minutes: 15,
    equipment: ['pan'],
    macros: { kcal: 360, protein: 17, carbs: 30, fat: 19 },
    ingredients: [
      { id: 'eggs', qty: 2 }, { id: 'tomato', qty: 120 }, { id: 'capsicum', qty: 50 },
      { id: 'onion', qty: 30 }, { id: 'cumin', qty: 1 }, { id: 'olive_oil', qty: 10 },
      { id: 'bread', qty: 1, optional: true }, { id: 'salt', qty: 1 },
    ],
    steps: [
      'شوّح البصل والفلفل في زيت الزيتون حتى يذبل.',
      'أضف الطماطم المقطّعة والكمون واتركها تتسبّك خمس دقائق.',
      'اعمل فجوات صغيرة واكسر البيض فيها، ثم غطِّ المقلاة.',
      'ارفعها حين يتماسك البياض وقدّمها مع الخبز.',
    ],
    coachTip: 'جهّز صلصة الطماطم مساءً في علبة، والفطور يصير جاهزاً في خمس دقائق.',
  },
  {
    id: 'foul',
    title: 'فول بالطحينة والليمون',
    slots: ['breakfast'],
    minutes: 10,
    equipment: ['pot'],
    macros: { kcal: 410, protein: 18, carbs: 48, fat: 16 },
    ingredients: [
      { id: 'fava', qty: 150 }, { id: 'tahini', qty: 15, optional: true }, { id: 'lemon', qty: 15 },
      { id: 'garlic', qty: 3 }, { id: 'olive_oil', qty: 10 }, { id: 'cumin', qty: 1 },
      { id: 'tomato', qty: 40 }, { id: 'bread', qty: 1, optional: true },
    ],
    steps: [
      'سخّن الفول مع ماء العلبة على نار متوسطة.',
      'اهرسه جزئياً، واترك بعض الحبات كاملة.',
      'أضف الطحينة والليمون والثوم المهروس والكمون.',
      'زيّنه بالطماطم المقطّعة ورشّة زيت زيتون.',
    ],
    coachTip: 'خفّف الطحينة بالليمون قبل إضافتها، تختلط بسرعة وما تتكتّل.',
  },
  {
    id: 'spiced_potatoes',
    title: 'بطاطس بالكمون والليمون',
    slots: ['breakfast'],
    minutes: 20,
    equipment: ['pot', 'pan'],
    macros: { kcal: 340, protein: 7, carbs: 52, fat: 12 },
    ingredients: [
      { id: 'potato', qty: 200 }, { id: 'onion', qty: 30 }, { id: 'cumin', qty: 1 },
      { id: 'lemon', qty: 15 }, { id: 'olive_oil', qty: 10 }, { id: 'parsley', qty: 0.1 },
      { id: 'salt', qty: 1 }, { id: 'bread', qty: 1, optional: true },
    ],
    steps: [
      'قطّع البطاطس مكعبات صغيرة واسلقها خمس دقائق.',
      'حمّرها في زيت الزيتون مع البصل حتى تتحمّر أطرافها.',
      'أضف الكمون والملح وعصرة ليمون.',
      'زيّنها بالبقدونس وقدّمها ساخنة.',
    ],
    coachTip: 'اسلق البطاطس من الليلة السابقة واحفظها في الثلاجة، تتحمّر أسرع وأقرمش.',
  },
  {
    id: 'labneh_zaatar',
    title: 'لبنة بالزعتر والزيتون',
    slots: ['breakfast'],
    minutes: 5,
    equipment: ['pan'],
    macros: { kcal: 380, protein: 14, carbs: 32, fat: 22 },
    ingredients: [
      { id: 'labneh', qty: 80 }, { id: 'zaatar', qty: 5, optional: true }, { id: 'olive_oil', qty: 10 },
      { id: 'olives', qty: 30 }, { id: 'cucumber', qty: 60 }, { id: 'tomato', qty: 50 },
      { id: 'bread', qty: 1, optional: true },
    ],
    steps: [
      'افرد اللبنة في صحن واعمل فيها تجويفاً بظهر الملعقة.',
      'صبّ زيت الزيتون ورشّ الزعتر فوقها.',
      'قطّع الخيار والطماطم شرائح ورتّبها بجانبها مع الزيتون.',
      'قدّمها مع خبز دافئ.',
    ],
    coachTip: 'سخّن الخبز على الصاج أو المقلاة دقيقة واحدة، يفرق كثير مع اللبنة.',
  },
  {
    id: 'oats_dates',
    title: 'شوفان بالحليب والتمر',
    slots: ['breakfast'],
    minutes: 10,
    equipment: ['pot'],
    macros: { kcal: 390, protein: 13, carbs: 66, fat: 9 },
    ingredients: [
      { id: 'oats', qty: 50 }, { id: 'milk', qty: 200 }, { id: 'dates', qty: 30 },
      { id: 'cinnamon', qty: 0.5 },
    ],
    steps: [
      'سخّن الحليب على نار متوسطة حتى يبدأ يغلي.',
      'أضف الشوفان وحرّكه خمس دقائق حتى يتماسك.',
      'افرم التمر وأضفه مع رشّة قرفة.',
      'اتركه دقيقة يرتاح ثم قدّمه.',
    ],
    coachTip: 'التمر يحلّي الشوفان، ما تحتاج سكر أبداً.',
  },
  {
    id: 'hummus',
    title: 'حمص بالطحينة',
    slots: ['breakfast'],
    minutes: 10,
    equipment: ['pot', 'blender'],
    macros: { kcal: 420, protein: 16, carbs: 46, fat: 20 },
    ingredients: [
      { id: 'chickpeas', qty: 130 }, { id: 'tahini', qty: 20 }, { id: 'lemon', qty: 15 },
      { id: 'garlic', qty: 3 }, { id: 'olive_oil', qty: 10 }, { id: 'paprika', qty: 0.5 },
      { id: 'bread', qty: 1, optional: true },
    ],
    steps: [
      'اسلق الحمص المعلّب مع مائه خمس دقائق حتى يطرى.',
      'اخلطه في الخلاط مع الطحينة والليمون والثوم وقليل من مائه.',
      'افرده في صحن واعمل خطوطاً بالملعقة.',
      'رشّ البابريكا وزيت الزيتون وقدّمه.',
    ],
    coachTip: 'أضف مكعب ثلج وأنت تخلط الحمص، يطلع أنعم وأفتح لوناً.',
  },
  {
    id: 'boiled_eggs',
    title: 'بيض مسلوق مع خضار',
    slots: ['breakfast'],
    minutes: 12,
    equipment: ['pot', 'fridge'],
    macros: { kcal: 300, protein: 16, carbs: 26, fat: 14 },
    ingredients: [
      { id: 'eggs', qty: 2 }, { id: 'cucumber', qty: 60 }, { id: 'tomato', qty: 60 },
      { id: 'olives', qty: 20 }, { id: 'salt', qty: 0.5 }, { id: 'cumin', qty: 0.5 },
      { id: 'bread', qty: 1, optional: true },
    ],
    steps: [
      'ضع البيض في ماء بارد واتركه يغلي ثم احسب 9 دقائق.',
      'انقله مباشرة إلى ماء مثلّج دقيقتين.',
      'قشّره وقطّعه أنصافاً مع رشّة ملح وكمون.',
      'قدّمه مع الخيار والطماطم والزيتون.',
    ],
    coachTip: 'اسلق 6 بيضات مرة وحدة، تبقى في الثلاجة 5 أيام وتوفّر عليك صباحات كثيرة.',
  },
  {
    id: 'omelette',
    title: 'أومليت بالخضار',
    slots: ['breakfast'],
    minutes: 10,
    equipment: ['pan'],
    macros: { kcal: 330, protein: 17, carbs: 28, fat: 16 },
    ingredients: [
      { id: 'eggs', qty: 2 }, { id: 'capsicum', qty: 40 }, { id: 'tomato', qty: 40 },
      { id: 'onion', qty: 20 }, { id: 'milk', qty: 30 }, { id: 'olive_oil', qty: 5 },
      { id: 'bread', qty: 1, optional: true }, { id: 'salt', qty: 1 },
    ],
    steps: [
      'اخفق البيض مع الحليب ورشّة ملح.',
      'شوّح الخضار المقطّعة ناعماً دقيقتين.',
      'صبّ البيض فوقها واتركه على نار هادئة حتى يتماسك.',
      'اطوِه نصفين وقدّمه مع الخبز.',
    ],
    coachTip: 'استخدم بقايا خضار الأمس هنا، الأومليت يقبل أي شيء.',
  },
];
