'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Clock, PackageCheck, ShoppingCart, X } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { DAYS, SLOT_LABEL } from '@/lib/data';
import { CURRENCY, cx, fmtMoney } from '@/lib/format';
import { swapOptions, type SwapOption } from '@/lib/planner';
import type { PlannedMeal, Preferences, WeeklyPlan } from '@/lib/types';
import { RecipeIcon } from '@/components/ui/FoodTile';
import { easeOut, spring } from '@/components/ui/primitives';
import { sound } from '@/lib/sound';

export function SwapSheet({
  meal,
  plan,
  prefs,
  onPick,
  onClose,
}: {
  meal: PlannedMeal | null;
  plan: WeeklyPlan;
  prefs: Preferences;
  onPick: (meal: PlannedMeal, recipeId: string) => void;
  onClose: () => void;
}) {
  const options = useMemo(() => (meal ? swapOptions(prefs, plan, meal) : []), [meal, plan, prefs]);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!meal) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [meal, onClose]);

  const dayName = meal ? DAYS.find((d) => d.id === meal.day)?.name : '';

  return (
    <AnimatePresence>
      {meal && (
        <div className="fixed inset-0 z-30 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="swap-title">
          <motion.button
            type="button"
            aria-label="إغلاق"
            className="absolute inset-0 cursor-default bg-canvas/70 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 48, opacity: 0, transition: { duration: 0.2, ease: easeOut } }}
            transition={spring}
            className="relative flex max-h-[88vh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-lg bg-surface shadow-lift sm:rounded-lg"
          >
            <header className="flex items-start justify-between gap-2 border-b border-line p-3">
              <div>
                <p className="text-sm font-bold text-mint-300">
                  {SLOT_LABEL[meal.slot]} · {dayName}
                </p>
                <h2 id="swap-title" className="font-display text-2xl font-bold">
                  اختر وجبتك
                </h2>
                <p className="text-sm text-ink-soft">مرتّبة حسب المتوفر في سلتك بعد باقي وجبات الأسبوع.</p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="إغلاق"
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-raised transition-colors hover:bg-line"
              >
                <X size={20} />
              </button>
            </header>

            <ul className="flex flex-col gap-1 overflow-y-auto p-2 pb-[max(16px,env(safe-area-inset-bottom,0px))]">
              {options.map((o, i) => (
                <motion.li key={o.recipe.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.03 * i }}>
                  <OptionRow
                    option={o}
                    onPick={() => {
                      if (!o.current) {
                        sound.pop();
                        onPick(meal, o.recipe.id);
                      }
                      onClose();
                    }}
                  />
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function OptionRow({ option: o, onPick }: { option: SwapOption; onPick: () => void }) {
  const covered = o.needs.length === 0;
  return (
    <button
      type="button"
      onClick={onPick}
      aria-current={o.current || undefined}
      className={cx(
        'flex w-full items-center gap-2 rounded-md border p-2 text-start transition-colors duration-150',
        o.current ? 'border-sand bg-raised' : 'border-transparent hover:border-line-strong hover:bg-raised',
      )}
    >
      <span className={cx('flex h-6 w-6 shrink-0 items-center justify-center rounded-md', covered ? 'bg-mint/10 text-mint-300' : 'bg-raised text-ink-soft')}>
        <RecipeIcon id={o.recipe.id} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-bold">{o.recipe.title}</span>
        <span className="tabular flex flex-wrap items-center gap-x-2 text-xs text-ink-soft">
          <span className="inline-flex items-center gap-1">
            <Clock size={16} aria-hidden="true" />
            {o.recipe.minutes} د
          </span>
          <span>{o.recipe.macros.kcal} سعرة</span>
          <span>
            {fmtMoney(o.costPerServing)} {CURRENCY} للحصة
          </span>
        </span>
        {o.sameDay && !o.current && <span className="mt-px block text-xs text-ink-soft">موجودة في نفس اليوم</span>}
        {!covered && !o.current && (
          <span className="mt-px block truncate text-xs text-clay-300">يحتاج شراء: {o.needs.join('، ')}</span>
        )}
      </span>

      <span className="flex shrink-0 flex-col items-end gap-px">
        {o.current ? (
          <span className="inline-flex h-3 items-center gap-1 rounded-full bg-sand px-1 text-xs font-bold text-canvas">
            <Check size={16} aria-hidden="true" />
            الحالية
          </span>
        ) : covered ? (
          <span className="inline-flex h-3 items-center gap-1 rounded-full bg-mint/15 px-1 text-xs font-bold text-mint-300">
            <PackageCheck size={16} aria-hidden="true" />
            من سلتك
          </span>
        ) : (
          <span className="inline-flex h-3 items-center gap-1 rounded-full bg-clay/15 px-1 text-xs font-bold text-clay-300">
            <ShoppingCart size={16} aria-hidden="true" />
            +{fmtMoney(o.extra)}
          </span>
        )}
      </span>
    </button>
  );
}
