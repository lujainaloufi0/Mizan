'use client';

import { motion } from 'framer-motion';
import { CalendarDays, ShieldCheck, ShoppingBasket, SlidersHorizontal } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { ALLERGENS } from '@/lib/data';
import { kitchenInventory, slotKey, swapOptions } from '@/lib/planner';
import { BlacklistMenu } from './BlacklistMenu';
import type { CardActions } from './RecipeCard';
import { cx, daysNoun, mealsNoun } from '@/lib/format';
import type { PlannedMeal, Preferences, WeeklyPlan } from '@/lib/types';
import { Button, SoundToggle, Wordmark, easeOut, spring } from '@/components/ui/primitives';
import { sound } from '@/lib/sound';
import { FinancialSummary } from './FinancialSummary';
import { GroceryList } from './GroceryList';
import { RecipePlan } from './RecipePlan';
import { SwapSheet } from './SwapSheet';

const rise = (i: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: easeOut, delay: 0.08 * i },
});

export function Dashboard({
  plan,
  prefs,
  checked,
  onCheckedChange,
  cooked,
  onToggleCooked,
  onEdit,
  onHome,
  onSwap,
  onBan,
  onRestore,
}: {
  plan: WeeklyPlan;
  prefs: Preferences;
  checked: string[];
  onCheckedChange: (ids: string[]) => void;
  cooked: string[];
  onToggleCooked: (meal: PlannedMeal) => void;
  onEdit: () => void;
  onHome: () => void;
  onSwap: (meal: PlannedMeal, recipeId: string) => void;
  onBan: (meal: PlannedMeal) => void;
  onRestore: (recipeId: string) => void;
}) {
  const dayCount = new Set(plan.meals.map((m) => m.day)).size;
  const [swapping, setSwapping] = useState<PlannedMeal | null>(null);
  const [tab, setTab] = useState<'recipes' | 'grocery'>('recipes');
  const close = useCallback(() => setSwapping(null), []);
  const actions = useMemo<CardActions>(
    () => ({
      onSwap: setSwapping,
      getOptions: (meal) => swapOptions(prefs, plan, meal),
      onPick: onSwap,
      onBan,
      onCook: onToggleCooked,
      isCooked: (meal) => cooked.includes(slotKey(meal.day, meal.slot)),
    }),
    [prefs, plan, onSwap, onBan, onToggleCooked, cooked],
  );
  const inventory = useMemo(() => kitchenInventory(plan, cooked, prefs.stock), [plan, cooked, prefs.stock]);
  const allergyNames = ALLERGENS.filter((a) => plan.allergies.includes(a.id)).map((a) => a.name);

  return (
    <div className="grain min-h-screen">
      <header className="mx-auto flex w-full max-w-app items-center justify-between gap-2 px-3 pt-4 sm:px-5">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onHome} aria-label="الرئيسية" className="rounded-sm">
            <Wordmark />
          </button>
          <span className="tabular hidden text-sm text-ink-soft sm:inline">
            خطة {dayCount} {daysNoun(dayCount)} · {plan.meals.length} {mealsNoun(plan.meals.length)} · {plan.servings} حصة لكل وجبة
          </span>
        </div>
        <div className="flex items-center gap-1">
          <SoundToggle />
          <BlacklistMenu ids={prefs.blacklist ?? []} onRestore={onRestore} />
          <Button variant="ghost" onClick={onEdit} className="border border-line-strong">
            <SlidersHorizontal size={20} />
            <span className="hidden sm:inline">تعديل الإعدادات</span>
            <span className="sm:hidden">الإعدادات</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-app flex-col gap-4 px-3 pb-10 pt-4 sm:px-5">
        {allergyNames.length > 0 && (
          <p className="-mb-2 flex flex-wrap items-center gap-1 text-sm text-mint-300">
            <ShieldCheck size={20} aria-hidden="true" />
            خطة آمنة بدون: {allergyNames.join('، ')}
            {plan.excludedForAllergies > 0 && <span className="text-ink-soft">· استبعدنا {plan.excludedForAllergies} وصفات</span>}
          </p>
        )}
        <motion.div {...rise(0)}>
          <FinancialSummary plan={plan} />
        </motion.div>

        {/* phones: one section at a time; desktop shows both side by side */}
        <div role="tablist" aria-label="أقسام الخطة" className="grid grid-cols-2 gap-1 rounded-full bg-line p-1 lg:hidden">
          {([
            ['recipes', 'الوصفات', CalendarDays, `${plan.meals.length}`],
            ['grocery', 'المشتريات', ShoppingBasket, `${plan.grocery.length}`],
          ] as const).map(([id, label, Icon, count]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => {
                if (tab !== id) sound.tick();
                setTab(id);
              }}
              className={cx('relative flex h-5 items-center justify-center gap-1 rounded-full text-sm font-bold', tab === id ? 'text-canvas' : 'text-ink')}
            >
              {tab === id && <motion.span layoutId="dash-tab" transition={spring} className="absolute inset-0 rounded-full bg-sand" />}
              <Icon size={16} className="relative" aria-hidden="true" />
              <span className="relative">{label}</span>
              <span className="tabular relative text-xs opacity-60">{count}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
          <motion.div
            {...rise(1)}
            className={cx('min-w-0', tab !== 'grocery' && 'hidden', 'lg:sticky lg:top-3 lg:col-span-5 lg:block lg:max-h-[calc(100vh-48px)] lg:overflow-y-auto lg:rounded-lg')}
          >
            <GroceryList
              items={plan.grocery}
              skipped={plan.skippedFromPantry}
              checkedIds={checked}
              onCheckedChange={onCheckedChange}
              inventory={inventory}
              covered={plan.coveredByStock}
              stockSaved={plan.stockSaved}
              cookedCount={cooked.length}
              meta={{ servings: plan.servings, meals: plan.meals.length }}
            />
          </motion.div>
          <motion.div {...rise(2)} className={cx('min-w-0 lg:col-span-7', tab !== 'recipes' && 'hidden', 'lg:block')}>
            <RecipePlan meals={plan.meals} actions={actions} cooked={cooked} />
          </motion.div>
        </div>
      </main>

      <SwapSheet meal={swapping} plan={plan} prefs={prefs} onPick={onSwap} onClose={close} />
    </div>
  );
}
