'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { INGREDIENTS, PANTRY_SECTIONS } from '@/lib/data';
import { cx, itemsNoun } from '@/lib/format';
import { AisleTile, IngredientIcon } from '@/components/ui/FoodTile';
import { spring } from '@/components/ui/primitives';
import { sound } from '@/lib/sound';

const SECTIONS = PANTRY_SECTIONS.map((s) => ({ ...s, items: INGREDIENTS.filter((i) => i.aisle === s.aisle) })).filter((s) => s.items.length);

export function PantryStep({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (id: string) => {
    sound.tick();
    onChange(value.includes(id) ? value.filter((p) => p !== id) : [...value, id]);
  };

  return (
    <div className="flex flex-col gap-4">
      {SECTIONS.map((section, si) => {
        const ids = section.items.map((i) => i.id);
        const picked = ids.filter((id) => value.includes(id)).length;
        const all = picked === ids.length;
        return (
          <motion.section
            key={section.aisle}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.05 * si }}
            aria-labelledby={`pantry-${section.aisle}`}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 id={`pantry-${section.aisle}`} className="flex items-center gap-1 text-base font-bold">
                <AisleTile aisle={section.aisle} size="md" />
                {section.name}
                {picked > 0 && <span className="tabular flex h-3 min-w-[24px] items-center justify-center rounded-full bg-mint/15 px-1 text-xs font-bold text-mint-300">{picked}</span>}
              </h2>
              <button
                type="button"
                onClick={() => onChange(all ? value.filter((v) => !ids.includes(v)) : Array.from(new Set([...value, ...ids])))}
                className="rounded-full px-1 text-xs font-bold text-ink-soft underline decoration-ink-faint underline-offset-4 hover:text-ink"
              >
                {all ? 'إلغاء الكل' : 'عندي الكل'}
              </button>
            </div>

            <div className="flex flex-wrap gap-1">
              {section.items.map((ing) => {
                const on = value.includes(ing.id);
                return (
                  <motion.button
                    key={ing.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(ing.id)}
                    whileTap={{ scale: 0.94 }}
                    className={cx(
                      'flex h-5 items-center gap-1 rounded-full border ps-1 pe-2 text-sm font-medium transition-colors duration-200',
                      on ? 'border-sand bg-sand text-canvas' : 'border-line-strong bg-surface text-ink hover:border-ink-faint',
                    )}
                  >
                    <span className={cx('flex h-4 w-4 items-center justify-center rounded-full transition-colors', on ? 'bg-surface' : 'bg-raised')}>
                      <IngredientIcon id={ing.id} size={20} />
                    </span>
                    {ing.name}
                    <motion.span
                      initial={false}
                      animate={{ width: on ? 16 : 0, opacity: on ? 1 : 0 }}
                      transition={spring}
                      className="flex items-center overflow-hidden text-mint-300"
                    >
                      <Check size={16} className="icon-bold" />
                    </motion.span>
                  </motion.button>
                );
              })}
            </div>
          </motion.section>
        );
      })}

      <p className="rounded-md bg-raised p-2 text-sm text-ink-soft">
        {value.length === 0 ? (
          'لا شيء؟ لا بأس، سنضيف كل المقادير لقائمتك.'
        ) : (
          <>
            في مطبخك <strong className="tabular text-ink">{value.length}</strong> {itemsNoun(value.length)}، لن نكرّر شراءها.
          </>
        )}
      </p>
    </div>
  );
}
