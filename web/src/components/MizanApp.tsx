'use client';

import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { Ban, Check, ChefHat, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RECIPES } from '@/lib/data';
import { CURRENCY, fmtMoney } from '@/lib/format';
import { banRecipe, estimateLeftovers, pinAll, planWeek, poolSize, slotKey, type Choices, type Leftover } from '@/lib/planner';
import { loadStore, saveStore, type SavedWeek } from '@/lib/storage';
import type { PlannedMeal, Preferences } from '@/lib/types';
import { Dashboard } from './dashboard/Dashboard';
import { HomeScreen } from './HomeScreen';
import { OnboardingWizard } from './onboarding/OnboardingWizard';
import { PlanLoader } from './PlanLoader';
import { Toaster, toast } from './ui/Toaster';

type Phase = 'boot' | 'home' | 'wizard' | 'loading' | 'dashboard';

export const DEFAULT_PREFS: Preferences = {
  stores: ['carrefour', 'panda'],
  adults: 2,
  kids: 1,
  days: ['sun', 'mon', 'tue', 'wed', 'thu'],
  mealsPerDay: 2,
  allergies: [],
  blacklist: [],
  pantry: ['salt', 'black_pepper', 'veg_oil'],
  budget: 600,
};

const titleOf = (id: string) => RECIPES.find((r) => r.id === id)?.title ?? '';

export default function MizanApp() {
  const [phase, setPhase] = useState<Phase>('boot');
  const [loaderVariant, setLoaderVariant] = useState<'new' | 'repeat'>('new');
  // wizard draft
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  // the week on the dashboard: frozen settings + the user's exact picks
  const [snapshot, setSnapshot] = useState<Preferences | null>(null);
  const [choices, setChoices] = useState<Choices>({});
  const [checked, setChecked] = useState<string[]>([]);
  const [cooked, setCooked] = useState<string[]>([]);
  const [wizardLeftovers, setWizardLeftovers] = useState<Leftover[]>([]);
  const [createdAt, setCreatedAt] = useState(() => new Date().toISOString());
  const [lastWeek, setLastWeek] = useState<SavedWeek | undefined>();

  const plan = useMemo(() => (snapshot ? planWeek(snapshot, choices) : null), [snapshot, choices]);
  // what last week left in the kitchen (only needed on Home)
  const leftovers = useMemo(() => (phase === 'home' && lastWeek ? estimateLeftovers(lastWeek) : []), [phase, lastWeek]);

  /* ───────── boot: returning households land on Home ───────── */
  useEffect(() => {
    const store = loadStore();
    const blacklist = store.blacklist;
    setPrefs({ ...(store.lastWeek?.prefs ?? DEFAULT_PREFS), blacklist });
    setLastWeek(store.lastWeek);
    setPhase(store.lastWeek ? 'home' : 'wizard');
  }, []);

  /* ───────── persist the current week and the blacklist ───────── */
  useEffect(() => {
    if (phase !== 'dashboard' || !plan || !snapshot) return;
    const week: SavedWeek = {
      prefs: snapshot,
      choices: pinAll(plan),
      checked,
      cooked,
      createdAt,
      total: plan.total,
      meals: plan.meals.length,
      recipeIds: plan.meals.map((m) => m.recipe.id),
    };
    setLastWeek(week);
    saveStore({ lastWeek: week, blacklist: snapshot.blacklist ?? [] });
  }, [phase, plan, snapshot, checked, cooked, createdAt]);

  const startWeek = (p: Preferences, c: Choices, variant: 'new' | 'repeat') => {
    setSnapshot(p);
    setChoices(c);
    setChecked([]);
    setCooked([]);
    setCreatedAt(new Date().toISOString());
    setLoaderVariant(variant);
    setPhase('loading');
  };

  /* ───────── swap: change one slot, keep the rest of the week pinned ───────── */
  const swap = useCallback(
    (meal: PlannedMeal, recipeId: string) => {
      if (!plan || !snapshot) return;
      const next = { ...pinAll(plan), [slotKey(meal.day, meal.slot)]: recipeId };
      const diff = planWeek(snapshot, next).total - plan.total;
      setChoices(next);
      toast({
        icon: <Check size={20} className="text-mint-300" />,
        message: (
          <>
            {titleOf(recipeId)} بدل {meal.recipe.title}
            <span className="tabular ms-1 text-ink-soft">
              · السلة {Math.abs(diff) < 0.01 ? 'بدون تغيير' : `${diff > 0 ? '+' : '−'}${fmtMoney(Math.abs(diff))} ${CURRENCY}`}
            </span>
          </>
        ),
      });
    },
    [plan, snapshot],
  );

  /* ───────── never suggest again ───────── */
  const ban = useCallback(
    (meal: PlannedMeal) => {
      if (!plan || !snapshot) return;
      const id = meal.recipe.id;
      if (poolSize(snapshot, meal.slot, id) < 2) {
        toast({ tone: 'error', icon: <Ban size={20} />, message: 'هذه من آخر الوصفات المتاحة لهذه الوجبة، لا يمكن استبعادها.' });
        return;
      }
      const before = { snapshot, choices: pinAll(plan) };
      const result = banRecipe(snapshot, plan, id, cooked);
      setSnapshot(result.prefs);
      setChoices(result.choices);
      setPrefs((p) => ({ ...p, blacklist: result.prefs.blacklist }));
      toast({
        icon: <Ban size={20} className="text-clay-300" />,
        message: `لن نقترح «${meal.recipe.title}» مرة أخرى${result.replaced === 2 ? ' · استبدلناها في وجبتين' : result.replaced > 2 ? ` · استبدلناها في ${result.replaced} وجبات` : ''}`,
        action: {
          label: 'تراجع',
          run: () => {
            setSnapshot(before.snapshot);
            setChoices(before.choices);
            setPrefs((p) => ({ ...p, blacklist: before.snapshot.blacklist }));
            saveStore({ blacklist: before.snapshot.blacklist ?? [] });
          },
        },
      });
    },
    [plan, snapshot, cooked],
  );

  const restore = useCallback((recipeId: string) => {
    const remove = (p: Preferences) => ({ ...p, blacklist: (p.blacklist ?? []).filter((id) => id !== recipeId) });
    setSnapshot((s) => (s ? remove(s) : s));
    setPrefs(remove);
    toast({ icon: <RotateCcw size={20} className="text-mint-300" />, message: `سنقترح «${titleOf(recipeId)}» في الخطط القادمة` });
  }, []);

  /* ───────── تم الطبخ: log it, and the kitchen inventory deducts it ───────── */
  const toggleCooked = useCallback(
    (meal: PlannedMeal) => {
      const key = slotKey(meal.day, meal.slot);
      const was = cooked.includes(key);
      setCooked((c) => (was ? c.filter((k) => k !== key) : [...c, key]));
      if (!was) {
        toast({
          icon: <ChefHat size={20} className="text-mint-300" />,
          message: `بالعافية! خصمنا مقادير «${meal.recipe.title}» من مطبخك`,
          action: { label: 'تراجع', run: () => setCooked((c) => c.filter((k) => k !== key)) },
        });
      }
    },
    [cooked],
  );

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        <motion.div key={phase} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
          {phase === 'home' && lastWeek && (
            <HomeScreen
              week={lastWeek}
              leftovers={leftovers}
              // same dishes in the same slots (minus anything banned since), re-priced with this week's deals
              onRepeat={(stock) =>
                startWeek(
                  { ...lastWeek.prefs, blacklist: prefs.blacklist, stock },
                  Object.fromEntries(Object.entries(lastWeek.choices).filter(([, id]) => !(prefs.blacklist ?? []).includes(id))),
                  'repeat',
                )
              }
              onOpen={() => {
                setSnapshot({ ...lastWeek.prefs, blacklist: prefs.blacklist });
                setChoices(lastWeek.choices);
                setChecked(lastWeek.checked);
                setCooked(lastWeek.cooked ?? []);
                setCreatedAt(lastWeek.createdAt);
                setPhase('dashboard');
              }}
              onNew={() => {
                setPrefs((p) => ({ ...p, stock: Object.fromEntries(leftovers.map((l) => [l.ingredient.id, l.qty])) }));
                setWizardLeftovers(leftovers);
                setPhase('wizard');
              }}
            />
          )}
          {phase === 'wizard' && <OnboardingWizard prefs={prefs} setPrefs={setPrefs} leftovers={wizardLeftovers} onComplete={() => startWeek(prefs, {}, 'new')} />}
          {phase === 'loading' && snapshot && <PlanLoader stores={snapshot.stores} variant={loaderVariant} onDone={() => setPhase('dashboard')} />}
          {phase === 'dashboard' && plan && snapshot && (
            <Dashboard
              plan={plan}
              prefs={snapshot}
              checked={checked}
              onCheckedChange={setChecked}
              cooked={cooked}
              onToggleCooked={toggleCooked}
              onEdit={() => {
                setPrefs({ ...snapshot });
                setWizardLeftovers([]);
                setPhase('wizard');
              }}
              onHome={() => setPhase('home')}
              onSwap={swap}
              onBan={ban}
              onRestore={restore}
            />
          )}
        </motion.div>
      </AnimatePresence>
      <Toaster />
    </MotionConfig>
  );
}
