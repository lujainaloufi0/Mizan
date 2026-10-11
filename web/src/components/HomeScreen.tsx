'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, FolderOpen, Repeat2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { planWeek, type Leftover } from '@/lib/planner';
import { LeftoversPanel } from './LeftoversPanel';
import { STORE_BY_ID } from '@/lib/data';
import { CURRENCY, fmtMoney, mealsNoun } from '@/lib/format';
import type { SavedWeek } from '@/lib/storage';
import { RecipeIcon } from '@/components/ui/FoodTile';
import { APP_ICON } from '@/components/ui/icon-map';
import { SoundToggle, Wordmark, easeOut, spring } from '@/components/ui/primitives';
import { sound } from '@/lib/sound';

function ago(iso: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
  if (days === 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days === 2) return 'قبل يومين';
  if (days <= 10) return `قبل ${days} أيام`;
  return `قبل ${days} يوماً`;
}

export function HomeScreen({
  week,
  leftovers,
  onRepeat,
  onOpen,
  onNew,
}: {
  week: SavedWeek;
  leftovers: Leftover[];
  onRepeat: (stock: Record<string, number>) => void;
  onOpen: () => void;
  onNew: () => void;
}) {
  const [rollover, setRollover] = useState(false);
  const [stock, setStock] = useState<Record<string, number>>(() => Object.fromEntries(leftovers.map((l) => [l.ingredient.id, l.qty])));
  // same dishes, same slots: what do the checked leftovers take off the new basket?
  const saved = useMemo(() => {
    if (!rollover) return 0;
    const p = { ...week.prefs, budget: Number.POSITIVE_INFINITY };
    return Math.max(0, planWeek({ ...p, stock: {} }, week.choices).total - planWeek({ ...p, stock }, week.choices).total);
  }, [rollover, week, stock]);
  const stores = week.prefs.stores.map((id) => STORE_BY_ID[id]?.name).filter(Boolean).join(' · ');
  const dishes = Array.from(new Set(week.recipeIds)).slice(0, 8);

  return (
    <div className="grain min-h-screen">
      <header className="mx-auto flex w-full max-w-wizard items-center justify-between px-3 pt-4">
        <Wordmark />
        <SoundToggle />
      </header>

      <main className="mx-auto flex w-full max-w-wizard flex-col gap-4 px-3 pb-10 pt-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: easeOut }}>
          <h1 className="font-display text-5xl font-bold tracking-tight">أهلاً بعودتك</h1>
          <p className="mt-1 text-lg text-ink-soft">جاهزين لأسبوع جديد؟ كرّر خطتك بنقرة، أو ابدأ خطة مختلفة.</p>
        </motion.div>

        {/* the one-tap repeat */}
        <motion.section
          aria-labelledby="repeat-title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOut, delay: 0.08 }}
          className="glow-mint relative overflow-hidden rounded-lg border border-line bg-surface p-3 text-ink shadow-lift sm:p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-mint-300">خطتك الأخيرة · {ago(week.createdAt)}</p>
              <h2 id="repeat-title" className="mt-1 font-display text-3xl font-bold">
                كرّر خطة الأسبوع الماضي
              </h2>
            </div>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line bg-raised text-sand">
              <APP_ICON.week size={28} />
            </span>
          </div>

          <ul className="mt-3 flex flex-wrap gap-1" aria-label="أطباق الخطة">
            {dishes.map((id, i) => (
              <motion.li
                key={id}
                initial={{ opacity: 0, scale: 0.4, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ ...spring, delay: 0.25 + i * 0.05 }}
                className="flex h-6 w-6 items-center justify-center rounded-md border border-line bg-raised text-sand"
              >
                <RecipeIcon id={id} size={32} />
              </motion.li>
            ))}
          </ul>

          <dl className="mt-3 grid grid-cols-2 gap-1 sm:grid-cols-3">
            <Stat label="الوجبات" value={`${week.meals}`} hint={mealsNoun(week.meals)} />
            <Stat label="آخر سلة" value={fmtMoney(week.total)} hint={CURRENCY} />
            <Stat label="المتاجر" value={stores} small className="col-span-2 sm:col-span-1" />
          </dl>

          <div className="mt-4 flex flex-col gap-1 sm:flex-row">
            <motion.button
              type="button"
              onClick={() => {
                sound.pop();
                if (leftovers.length) setRollover(true);
                else onRepeat({});
              }}
              whileTap={{ scale: 0.97 }}
              className="flex h-7 items-center justify-center gap-1 rounded-full bg-mint-400 sm:flex-1 px-3 text-base font-bold text-canvas transition-colors hover:bg-mint-300"
            >
              <Repeat2 size={20} aria-hidden="true" />
              كرّرها بنقرة واحدة
            </motion.button>
            <button
              type="button"
              onClick={onOpen}
              className="flex h-7 items-center justify-center gap-1 rounded-full border border-line-strong px-3 text-base font-bold text-ink-soft transition-colors hover:bg-raised"
            >
              <FolderOpen size={20} aria-hidden="true" />
              افتحها كما هي
            </button>
          </div>
          <p className="mt-2 text-xs text-ink-faint">نفس الأطباق والمقادير، بأسعار وعروض هذا الأسبوع. وتقدر تبدّل أي وجبة بعدها.</p>
        </motion.section>

        <motion.button
          type="button"
          onClick={onNew}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOut, delay: 0.16 }}
          whileTap={{ scale: 0.99 }}
          className="group flex items-center gap-2 rounded-lg border border-line bg-surface p-3 text-start shadow-card transition-[box-shadow,border-color] hover:border-line-strong hover:shadow-lift"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-raised text-sand">
            <APP_ICON.cart size={28} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold">خطة جديدة</span>
            <span className="block text-sm text-ink-soft">غيّر الأيام أو الوجبات أو الميزانية. نبدأ من إعداداتك السابقة.</span>
          </span>
          <ChevronLeft size={24} className="shrink-0 text-ink-faint transition-transform group-hover:-translate-x-1" aria-hidden="true" />
        </motion.button>
      </main>

      <RolloverSheet open={rollover} onClose={() => setRollover(false)} onConfirm={() => onRepeat(stock)} onSkip={() => onRepeat({})}>
        <LeftoversPanel items={leftovers} value={stock} onChange={setStock} saved={saved} />
      </RolloverSheet>
    </div>
  );
}

function RolloverSheet({
  open,
  onClose,
  onConfirm,
  onSkip,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSkip: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-30 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="rollover-title">
          <motion.button type="button" aria-label="إغلاق" className="absolute inset-0 cursor-default bg-canvas/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 48, opacity: 0 }}
            transition={spring}
            className="relative flex max-h-[90vh] w-full max-w-[640px] flex-col overflow-hidden rounded-t-lg bg-surface shadow-lift sm:rounded-lg"
          >
            <header className="flex items-start justify-between gap-2 border-b border-line p-3">
              <div>
                <p className="text-sm font-bold text-mint-300">بواقي الأسبوع</p>
                <h2 id="rollover-title" className="font-display text-3xl font-bold">
                  وش بقي في مطبخك؟
                </h2>
                <p className="text-sm text-ink-soft">علّم اللي لسا موجود، ونخصمه من سلة الأسبوع الجديد.</p>
              </div>
              <button type="button" onClick={onClose} aria-label="إغلاق" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-raised hover:bg-line">
                <X size={20} />
              </button>
            </header>
            <div className="overflow-y-auto p-3">{children}</div>
            <footer className="flex gap-1 border-t border-line p-2 pb-[max(16px,env(safe-area-inset-bottom,0px))]">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  sound.success();
                  onConfirm();
                }}
                className="flex h-7 flex-1 items-center justify-center gap-1 rounded-full bg-sand px-3 text-base font-bold text-canvas"
              >
                <Repeat2 size={20} aria-hidden="true" />
                كرّر الخطة بهذي البواقي
              </motion.button>
              <button type="button" onClick={onSkip} className="h-7 rounded-full px-3 text-sm font-bold text-ink-soft hover:bg-raised">
                تخطّ
              </button>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Stat({ label, value, hint, small, className }: { label: string; value: string; hint?: string; small?: boolean; className?: string }) {
  return (
    <div className={`flex min-w-0 flex-col-reverse rounded-md bg-raised p-2 ${className ?? ''}`}>
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd className={small ? 'truncate text-sm font-bold' : 'tabular font-display text-2xl font-bold'}>
        {value}
        {hint && <span className="ms-1 font-sans text-xs font-medium text-ink-faint">{hint}</span>}
      </dd>
    </div>
  );
}
