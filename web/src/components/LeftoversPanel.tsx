'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Recycle } from 'lucide-react';
import { CURRENCY, cx, fmtQty, itemsNoun } from '@/lib/format';
import type { Leftover } from '@/lib/planner';
import { IngredientTile } from '@/components/ui/FoodTile';
import { AnimatedNumber, spring } from '@/components/ui/primitives';
import { sound } from '@/lib/sound';

/**
 * "بواقي الأسبوع": tap what's still in the kitchen. Checked quantities are
 * deducted from the new list, and the planner puts dishes that use them first.
 */
export function LeftoversPanel({
  items,
  value,
  onChange,
  saved,
}: {
  items: Leftover[];
  value: Record<string, number>;
  onChange: (v: Record<string, number>) => void;
  saved: number;
}) {
  const picked = Object.keys(value).length;
  const toggle = (l: Leftover) => {
    sound.tick();
    const next = { ...value };
    if (next[l.ingredient.id] !== undefined) delete next[l.ingredient.id];
    else next[l.ingredient.id] = l.qty;
    onChange(next);
  };
  const groups = [
    { keeps: 'long' as const, title: 'تدوم طويلاً', hint: 'زيوت وبهارات وحبوب ومعلبات' },
    { keeps: 'medium' as const, title: 'استخدمها قريباً', hint: 'نقدّم الوصفات اللي تحتاجها أول الأسبوع' },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="glow-mint flex items-center justify-between gap-2 rounded-md border border-line bg-surface p-3 text-ink">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint-400 text-canvas">
            <Recycle size={24} />
          </span>
          <div>
            <p className="text-sm text-ink-soft">ستوفّر من البواقي</p>
            <p className="flex items-baseline gap-1">
              <AnimatedNumber value={saved} className="font-display text-3xl font-bold text-mint-300" />
              <span className="text-sm text-ink-soft">{CURRENCY}</span>
            </p>
          </div>
        </div>
        <p className="tabular text-end text-sm text-ink-soft">
          <strong className="text-ink">{picked}</strong> {itemsNoun(picked)}
          <br />
          من {items.length}
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => onChange(Object.fromEntries(items.map((l) => [l.ingredient.id, l.qty])))}
          className="h-4 rounded-full border border-line-strong px-2 text-sm font-bold hover:bg-raised"
        >
          كله موجود
        </button>
        <button type="button" onClick={() => onChange({})} className="h-4 rounded-full border border-line-strong px-2 text-sm font-bold hover:bg-raised">
          ما بقي شي
        </button>
      </div>

      {groups.map((g) => {
        const rows = items.filter((l) => l.keeps === g.keeps);
        if (!rows.length) return null;
        return (
          <section key={g.keeps} aria-label={g.title} className="flex flex-col gap-1">
            <h3 className="text-sm font-bold">
              {g.title} <span className="font-medium text-ink-soft">· {g.hint}</span>
            </h3>
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {rows.map((l, i) => {
                const on = value[l.ingredient.id] !== undefined;
                return (
                  <motion.li key={l.ingredient.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.02 * i }}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => toggle(l)}
                      className={cx(
                        'flex w-full items-center gap-2 rounded-md border p-1 text-start transition-colors duration-200',
                        on ? 'border-mint-500 bg-mint/10' : 'border-line bg-surface opacity-70 hover:opacity-100',
                      )}
                    >
                      <IngredientTile id={l.ingredient.id} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{l.ingredient.name}</span>
                        <span className="tabular block text-xs text-ink-soft">
                          تقريباً {fmtQty(l.qty, l.ingredient.unit)}
                          {l.ingredient.unit === 'pc' ? ' حبة' : ''}
                        </span>
                      </span>
                      <span className={cx('flex h-3 w-3 shrink-0 items-center justify-center rounded-full border-2 transition-colors', on ? 'border-mint-500 bg-mint-500 text-canvas' : 'border-line-strong')}>
                        <AnimatePresence>
                          {on && (
                            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring}>
                              <Check size={16} className="icon-bold" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </span>
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
