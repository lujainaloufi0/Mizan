/**
 * Plain-text grocery lists for pasting into WhatsApp, Notes or a delivery
 * app's search/notes field. Emoji headers survive every messenger; quantities
 * use whole packs, the way you'd actually add them to a cart.
 */
import { AISLES, STORES } from './data';
import { CURRENCY, fmtMoney, itemsNoun } from './format';
import type { AisleId, GroceryItem } from './types';

const AISLE_EMOJI: Record<AisleId, string> = {
  produce: '🥬',
  bakery: '🫓',
  meat: '🍗',
  fish: '🐟',
  dairy: '🥛',
  grains: '🍚',
  pantry: '🥫',
  spices: '🧂',
};

const line = (g: GroceryItem) => `• ${g.ingredient.name} — ${g.packs} × ${g.ingredient.pack.label}`;

export type ListMode = 'aisle' | 'store';

export function groceryText(items: GroceryItem[], mode: ListMode, meta: { servings: number; meals: number }) {
  const total = items.reduce((s, g) => s + g.price, 0);
  const out: string[] = [`🛒 مقاضي الأسبوع — مِيزان`, `${meals(meta.meals)} · ${meta.servings} حصة لكل وجبة`, ''];

  if (mode === 'aisle') {
    for (const aisle of AISLES) {
      const rows = items.filter((g) => g.ingredient.aisle === aisle.id);
      if (!rows.length) continue;
      out.push(`${AISLE_EMOJI[aisle.id]} ${aisle.name}`, ...rows.map(line), '');
    }
  } else {
    for (const store of STORES) {
      const rows = items.filter((g) => g.store.id === store.id);
      if (!rows.length) continue;
      const sub = rows.reduce((s, g) => s + g.price, 0);
      out.push(`🏪 ${store.name} (${fmtMoney(sub)} ${CURRENCY})`);
      for (const aisle of AISLES) {
        rows.filter((g) => g.ingredient.aisle === aisle.id).forEach((g) => out.push(`${AISLE_EMOJI[aisle.id]} ${line(g).slice(2)}`));
      }
      out.push('');
    }
  }

  out.push(`المجموع التقريبي: ${fmtMoney(total)} ${CURRENCY}`, `${items.length} ${itemsNoun(items.length)}`);
  return out.join('\n');
}

function meals(n: number) {
  return n === 1 ? 'وجبة واحدة' : n === 2 ? 'وجبتان' : `${n} ${n <= 10 ? 'وجبات' : 'وجبة'}`;
}
