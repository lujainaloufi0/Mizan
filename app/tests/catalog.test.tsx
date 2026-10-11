/** Catalog integrity: every recipe is complete, consistent, halal and plannable. */
import { describe, expect, test } from '@jest/globals';
import { ALLERGENS, CUISINES, INGREDIENTS, INGREDIENT_BY_ID, RECIPES } from '@/lib/data';
import { safeRecipes } from '@/lib/planner';

const EQUIPMENT = ['pot', 'pan', 'oven', 'blender', 'microwave', 'fridge'];
const NOT_HALAL = /\b(pork|bacon|ham|lard|wine|beer|rum|mirin|sake|gelatin)\b|(?<![\u0600-\u06FF])(خنزير|نبيذ|كحول|بيرة|خمر|جيلاتين)(?![\u0600-\u06FF])/i;

describe('catalog', () => {
  test('has at least 150 recipes and 25 breakfasts', () => {
    expect(RECIPES.length).toBeGreaterThanOrEqual(150);
    expect(RECIPES.filter((r) => r.slots.includes('breakfast')).length).toBeGreaterThanOrEqual(25);
  });

  test('ids and titles are unique', () => {
    expect(new Set(RECIPES.map((r) => r.id)).size).toBe(RECIPES.length);
    expect(new Set(RECIPES.map((r) => r.title)).size).toBe(RECIPES.length);
    expect(new Set(INGREDIENTS.map((i) => i.id)).size).toBe(INGREDIENTS.length);
  });

  test('every recipe is complete and uses known ingredients and equipment', () => {
    for (const r of RECIPES) {
      expect({ id: r.id, ok: r.title.length > 2 && r.steps.length >= 3 && r.coachTip.length > 10 && r.minutes > 0 }).toEqual({ id: r.id, ok: true });
      expect(r.equipment.length).toBeGreaterThan(0);
      for (const e of r.equipment) expect(EQUIPMENT).toContain(e);
      expect(r.ingredients.length).toBeGreaterThanOrEqual(3);
      for (const ri of r.ingredients) {
        expect({ recipe: r.id, ingredient: ri.id, known: !!INGREDIENT_BY_ID[ri.id] }).toEqual({ recipe: r.id, ingredient: ri.id, known: true });
        expect(ri.qty).toBeGreaterThan(0);
      }
      expect(new Set(r.ingredients.map((i) => i.id)).size).toBe(r.ingredients.length);
    }
  });

  test('macros are plausible per serving', () => {
    for (const r of RECIPES) {
      const { kcal, protein } = r.macros;
      expect({ id: r.id, kcal: kcal >= 150 && kcal <= 1100, protein: protein >= 5 }).toEqual({ id: r.id, kcal: true, protein: true });
    }
  });

  test('everything is halal', () => {
    for (const i of INGREDIENTS) expect({ id: i.id, ok: !NOT_HALAL.test(i.id) && !NOT_HALAL.test(i.name) }).toEqual({ id: i.id, ok: true });
    for (const r of RECIPES) expect({ id: r.id, ok: !NOT_HALAL.test(r.title) && !r.steps.some((s) => NOT_HALAL.test(s)) }).toEqual({ id: r.id, ok: true });
  });

  test('every ingredient in the catalog is used by some recipe', () => {
    const used = new Set(RECIPES.flatMap((r) => r.ingredients.map((i) => i.id)));
    expect(INGREDIENTS.filter((i) => !used.has(i.id)).map((i) => i.id)).toEqual([]);
  });

  test('every cuisine has enough mains to plan a week', () => {
    for (const c of CUISINES) {
      const mains = RECIPES.filter((r) => r.cuisine === c.id && !r.slots.includes('breakfast')).length;
      expect({ cuisine: c.id, mains: mains >= 4 }).toEqual({ cuisine: c.id, mains: true });
    }
  });

  test('any single allergy still leaves a varied menu', () => {
    for (const a of ALLERGENS) {
      const { safe } = safeRecipes([a.id]);
      expect({ allergen: a.id, mains: safe.filter((r) => !r.slots.includes('breakfast')).length >= 40 }).toEqual({ allergen: a.id, mains: true });
      expect({ allergen: a.id, breakfasts: safe.filter((r) => r.slots.includes('breakfast')).length >= 6 }).toEqual({ allergen: a.id, breakfasts: true });
    }
  });
});
