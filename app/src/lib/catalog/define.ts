/**
 * Compact recipe authoring. Each cuisine file lists rows like:
 *
 *   { id, t: 'كبسة دجاج', k: 'rice', s: 'LD', m: 50, e: 'pot',
 *     i: 'chicken:250 basmati:100 bread:1?',   // qty per serving; "?" = optional side
 *     x: [38, 68, 22],                          // protein, carbs, fat (g); kcal is derived
 *     st: ['…', '…'], tip: '…' }
 */
import type { CuisineId, DishKind, EquipmentId, Recipe, Slot } from '../types';

export interface Row {
  id: string;
  t: string;
  k: DishKind;
  /** B = breakfast, LD = lunch & dinner */
  s: 'B' | 'LD';
  m: number;
  e: string;
  i: string;
  x: [protein: number, carbs: number, fat: number];
  st: string[];
  tip: string;
}

const SLOTS: Record<Row['s'], Slot[]> = { B: ['breakfast'], LD: ['lunch', 'dinner'] };

export function kitchen(cuisine: CuisineId, rows: Row[]): Recipe[] {
  return rows.map((r) => {
    const [protein, carbs, fat] = r.x;
    return {
      id: r.id,
      title: r.t,
      cuisine,
      kind: r.k,
      slots: SLOTS[r.s],
      minutes: r.m,
      equipment: r.e.split(' ').filter(Boolean) as EquipmentId[],
      macros: { kcal: Math.round((protein * 4 + carbs * 4 + fat * 9) / 10) * 10, protein, carbs, fat },
      ingredients: r.i
        .split(/\s+/)
        .filter(Boolean)
        .map((tok) => {
          const optional = tok.endsWith('?');
          const [id, qty] = tok.replace('?', '').split(':');
          return optional ? { id, qty: Number(qty), optional: true } : { id, qty: Number(qty) };
        }),
      steps: r.st,
      coachTip: r.tip,
    };
  });
}
