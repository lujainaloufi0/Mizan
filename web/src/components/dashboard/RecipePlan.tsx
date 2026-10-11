'use client';

import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useState } from 'react';
import { DAYS } from '@/lib/data';
import { CURRENCY, cx, fmtWhole } from '@/lib/format';
import { slotKey } from '@/lib/planner';
import type { DayId, PlannedMeal } from '@/lib/types';
import { APP_ICON } from '@/components/ui/icon-map';
import { C } from '@/lib/palette';
import { sound } from '@/lib/sound';
import { spring } from '@/components/ui/primitives';
import { RecipeCard, type CardActions } from './RecipeCard';

export function RecipePlan({ meals, actions, cooked }: { meals: PlannedMeal[]; actions: CardActions; cooked: string[] }) {
  const done = meals.filter((m) => cooked.includes(slotKey(m.day, m.slot))).length;
  const pct = meals.length ? done / meals.length : 0;
  const days = DAYS.filter((d) => meals.some((m) => m.day === d.id));
  const [active, setActive] = useState<DayId>(days[0]?.id ?? 'sun');
  const today = meals.filter((m) => m.day === active);

  return (
    <section aria-labelledby="recipes-title" className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-2">
        <h2 id="recipes-title" className="flex items-center gap-1 font-display text-2xl font-bold">
          <APP_ICON.week size={28} className="text-sand" />
          وصفات الأسبوع
        </h2>
        {/* weekly progress */}
        <div className="flex items-center gap-1" aria-label={`طبخت ${done} من ${meals.length} وجبة هذا الأسبوع`}>
          <svg viewBox="0 0 36 36" className="h-4 w-4 -rotate-90" aria-hidden="true">
            <circle cx="18" cy="18" r="15" fill="none" stroke={C.line} strokeWidth="5" />
            <motion.circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke={C.mint}
              strokeWidth="5"
              strokeLinecap="round"
              initial={false}
              animate={{ pathLength: pct }}
              transition={spring}
            />
          </svg>
          <span className="tabular text-sm text-ink-soft">
            طبخت{' '}
            <motion.strong key={done} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={spring} className="inline-block text-ink">
              {done}
            </motion.strong>{' '}
            من {meals.length}
          </span>
        </div>
      </div>

      <LayoutGroup id="day-tabs">
        <div role="tablist" aria-label="أيام الأسبوع" className="scrollbar-none -mx-3 flex gap-1 overflow-x-auto px-3 sm:mx-0 sm:px-0">
          {days.map((d) => {
            const on = d.id === active;
            const dayCost = meals.filter((m) => m.day === d.id).reduce((s, m) => s + m.totalCost, 0);
            return (
              <button
                key={d.id}
                role="tab"
                aria-selected={on}
                onClick={() => {
                  if (active !== d.id) sound.tick();
                  setActive(d.id);
                }}
                className={cx(
                  'relative flex h-9 min-w-[88px] shrink-0 flex-col items-center justify-center rounded-md px-2 transition-colors duration-200',
                  on ? 'text-canvas' : 'text-ink hover:bg-line',
                )}
              >
                {on && <motion.span layoutId="day-pill" transition={spring} className="absolute inset-0 rounded-md bg-sand" />}
                <span className="relative text-sm font-bold">{d.name}</span>
                <span className={cx('tabular relative text-xs', on ? 'text-canvas/70' : 'text-ink-soft')}>{fmtWhole(dayCost)} {CURRENCY}</span>
                <span className="relative mt-px flex gap-1" aria-hidden="true">
                  {meals
                    .filter((m) => m.day === d.id)
                    .map((m) => {
                      const c = cooked.includes(slotKey(m.day, m.slot));
                      return (
                        <motion.span
                          key={m.slot}
                          initial={false}
                          animate={{ scale: c ? 1 : 0.7, backgroundColor: c ? C.mint : on ? 'rgba(18,20,23,0.35)' : C.lineStrong }}
                          transition={spring}
                          className="h-1 w-1 rounded-full"
                        />
                      );
                    })}
                </span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      <div role="tabpanel" className="grid items-start gap-2 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {today.map((meal) => (
            <RecipeCard key={`${meal.day}-${meal.slot}-${meal.recipe.id}`} meal={meal} actions={actions} />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
