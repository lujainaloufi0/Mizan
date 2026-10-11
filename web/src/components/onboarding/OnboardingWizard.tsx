'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { cx, mealsNoun, storesNoun } from '@/lib/format';
import { budgetMood, estimateRange, planWeek, portionsFor, type Leftover } from '@/lib/planner';
import { LeftoversPanel } from '@/components/LeftoversPanel';
import type { Preferences } from '@/lib/types';
import { Button, SoundToggle, Wordmark, barSpring, spring } from '@/components/ui/primitives';
import { C } from '@/lib/palette';
import { sound } from '@/lib/sound';
import { AllergyStep } from './steps/AllergyStep';
import { BudgetStep, BUDGET_MAX, BUDGET_MIN } from './steps/BudgetStep';
import { DaysStep } from './steps/DaysStep';
import { HouseholdStep } from './steps/HouseholdStep';
import { MealsStep } from './steps/MealsStep';
import { PantryStep } from './steps/PantryStep';
import { StoreStep } from './steps/StoreStep';

type StepDef = {
  key: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  valid: boolean;
  body: ReactNode;
};

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export function OnboardingWizard({
  prefs,
  setPrefs,
  onComplete,
  leftovers = [],
}: {
  prefs: Preferences;
  setPrefs: (updater: (p: Preferences) => Preferences) => void;
  onComplete: () => void;
  /** last week's carry-over; the rollover step only appears when there is some */
  leftovers?: Leftover[];
}) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [budgetTouched, setBudgetTouched] = useState(false);

  const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) => setPrefs((p) => ({ ...p, [key]: value }));

  // Live cost estimate from the real planner — everything except budget.
  const { stores, adults, kids, days, mealsPerDay, pantry, allergies, blacklist, stock } = prefs;
  const range = useMemo(
    () => (stores.length && days.length ? estimateRange({ stores, adults, kids, days, mealsPerDay, pantry, allergies, blacklist, stock }) : { full: 0, lean: 0 }),
    [stores, adults, kids, days, mealsPerDay, pantry, allergies, blacklist, stock],
  );
  const mood = budgetMood(prefs.budget, range.full);

  // live SAR saved by the checked leftovers, at full variety
  const stockSaved = useMemo(() => {
    if (!leftovers.length || !stores.length || !days.length) return 0;
    const p = { stores, adults, kids, days, mealsPerDay, pantry, allergies, blacklist, budget: Number.POSITIVE_INFINITY };
    return Math.max(0, planWeek({ ...p, stock: {} }).total - planWeek({ ...p, stock: stock ?? {} }).total);
  }, [leftovers.length, stores, adults, kids, days, mealsPerDay, pantry, allergies, blacklist, stock]);

  const steps: StepDef[] = [
    {
      key: 'stores',
      eyebrow: 'المتاجر',
      title: 'من وين تتسوّق عادةً؟',
      subtitle: 'نقارن عروض الأسبوع بين المتاجر اللي تختارها ونوزّع سلتك على الأوفر.',
      valid: prefs.stores.length > 0,
      body: <StoreStep value={prefs.stores} onChange={(v) => update('stores', v)} />,
    },
    {
      key: 'household',
      eyebrow: 'الأسرة',
      title: 'مين بياكل معك؟',
      subtitle: 'نحسب الحصص والمقادير على عدد أفراد البيت.',
      valid: prefs.adults > 0,
      body: <HouseholdStep adults={prefs.adults} kids={prefs.kids} onChange={(v) => setPrefs((p) => ({ ...p, ...v }))} />,
    },
    {
      key: 'allergies',
      eyebrow: 'الحساسية',
      title: 'فيه أحد عنده حساسية؟',
      subtitle: 'نستبعد أي وصفة فيها مسبب حساسية، ونشيل الأطباق الجانبية غير المناسبة.',
      valid: true,
      body: <AllergyStep value={prefs.allergies} onChange={(v) => update('allergies', v)} />,
    },
    {
      key: 'days',
      eyebrow: 'جدول الطبخ',
      title: 'أي أيام بتطبخ فيها؟',
      subtitle: 'الأيام اللي ما تطبخ فيها ما ندخلها في الخطة ولا في السلة.',
      valid: prefs.days.length > 0,
      body: <DaysStep value={prefs.days} onChange={(v) => update('days', v)} />,
    },
    {
      key: 'meals',
      eyebrow: 'الوجبات',
      title: 'كم وجبة نخطط لك يومياً؟',
      subtitle: 'تقدر تغيّرها لاحقاً من إعدادات الخطة.',
      valid: true,
      body: <MealsStep value={prefs.mealsPerDay} days={prefs.days.length} onChange={(v) => update('mealsPerDay', v)} />,
    },
    {
      key: 'pantry',
      eyebrow: 'المخزون',
      title: 'وش موجود عندك في المطبخ؟',
      subtitle: 'اضغط على اللي عندك، وما نضيفه لقائمة المشتريات.',
      valid: true,
      body: <PantryStep value={prefs.pantry} onChange={(v) => update('pantry', v)} />,
    },
    ...(leftovers.length
      ? [
          {
            key: 'leftovers',
            eyebrow: 'بواقي الأسبوع',
            title: 'وش بقي من الأسبوع الماضي؟',
            subtitle: 'علّم اللي لسا موجود. نخصمه من قائمة المشتريات ونقدّم الوصفات اللي تستخدمه.',
            valid: true,
            body: <LeftoversPanel items={leftovers} value={prefs.stock ?? {}} onChange={(v) => update('stock', v)} saved={stockSaved} />,
          },
        ]
      : []),
    {
      key: 'budget',
      eyebrow: 'الميزانية',
      title: 'كم ميزانية الأسبوع؟',
      subtitle: 'حرّك المؤشر وشوف الميزان يوازن بين ميزانيتك وسلتك المتوقعة.',
      valid: prefs.budget >= BUDGET_MIN,
      body: (
        <BudgetStep
          value={prefs.budget}
          estimate={range.full}
          lean={range.lean}
          mood={mood}
          onChange={(v) => {
            setBudgetTouched(true);
            update('budget', v);
          }}
        />
      ),
    },
  ];

  const step = steps[index];
  const isLast = index === steps.length - 1;

  // First time the budget step opens, start the slider at the real estimate.
  useEffect(() => {
    if (step.key === 'budget' && !budgetTouched && range.full > 0) {
      update('budget', Math.min(BUDGET_MAX, Math.max(BUDGET_MIN, roundTo(range.full, 50))));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.key]);

  const go = (delta: number) => {
    const next = index + delta;
    if (next < 0) return;
    if (next >= steps.length) {
      sound.success();
      return onComplete();
    }
    if (delta > 0) sound.step();
    setDirection(delta);
    setIndex(next);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalMeals = prefs.days.length * prefs.mealsPerDay;
  const portions = portionsFor(prefs.adults, prefs.kids);

  return (
    <div className="grain flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-wizard items-center justify-between px-3 pt-4">
        <Wordmark />
        <div className="flex items-center gap-1">
          <span className="tabular text-sm font-medium text-ink-soft">
            {index + 1} / {steps.length}
          </span>
          <SoundToggle />
        </div>
      </header>

      {/* segmented progress */}
      <div className="mx-auto mt-3 flex w-full max-w-wizard gap-1 px-3" aria-hidden="true">
        {steps.map((s, i) => (
          <div key={s.key} className="h-1 flex-1 overflow-hidden rounded-full bg-line">
            <motion.div
              className="h-full rounded-full"
              initial={false}
              // springs, not tweens: the bar overshoots a hair and settles, like a real fill
              animate={{ width: i <= index ? '100%' : '0%', backgroundColor: i === index ? C.mint : C.sand }}
              transition={{ width: { ...barSpring, delay: i === index ? 0.08 : 0 }, backgroundColor: { duration: 0.3 } }}
            />
          </div>
        ))}
      </div>

      <main className="relative mx-auto w-full max-w-wizard flex-1 px-3 pb-24 pt-5">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.section
            key={step.key}
            custom={direction}
            variants={{
              // RTL: moving forward slides content in from the left
              enter: (d: number) => ({ x: d > 0 ? -48 : 48, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d > 0 ? 48 : -48, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ x: spring, opacity: { duration: 0.2 } }}
            aria-labelledby={`step-${step.key}`}
          >
            <p className="text-sm font-bold text-mint-300">{step.eyebrow}</p>
            <h1 id={`step-${step.key}`} className="mt-1 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              {step.title}
            </h1>
            <p className="mt-2 max-w-[480px] text-lg text-ink-soft">{step.subtitle}</p>
            <div className="mt-5">{step.body}</div>
          </motion.section>
        </AnimatePresence>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-canvas/90 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md">
        <div className="mx-auto flex h-11 w-full max-w-wizard items-center justify-between gap-2 px-3">
          <Button variant="ghost" silent onClick={() => go(-1)} disabled={index === 0} className={cx(index === 0 && 'invisible')}>
            <ChevronRight size={20} />
            السابق
          </Button>

          <p className="tabular hidden text-sm text-ink-soft sm:block" aria-live="polite">
            {prefs.stores.length} {storesNoun(prefs.stores.length)} · {portions} حصة · {totalMeals} {mealsNoun(totalMeals)}
          </p>

          <Button variant={isLast ? 'mint' : 'primary'} silent onClick={() => go(1)} disabled={!step.valid} className="min-w-[136px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isLast ? 'finish' : 'next'}
                className="flex items-center gap-1"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.16 }}
              >
                {isLast ? (
                  <>
                    <Sparkles size={20} />
                    اصنع خطتي
                  </>
                ) : (
                  <>
                    التالي
                    <ChevronLeft size={20} />
                  </>
                )}
              </motion.span>
            </AnimatePresence>
          </Button>
        </div>
      </footer>
    </div>
  );
}
