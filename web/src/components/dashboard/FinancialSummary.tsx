'use client';

import { motion } from 'framer-motion';
import { Info, PiggyBank, Recycle, Utensils, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import { CURRENCY, cx, fmtMoney, fmtWhole, itemsNoun } from '@/lib/format';
import type { WeeklyPlan } from '@/lib/types';
import { AnimatedNumber, MizanMark, easeOut } from '@/components/ui/primitives';

export function FinancialSummary({ plan }: { plan: WeeklyPlan }) {
  const used = plan.budget > 0 ? plan.total / plan.budget : 0;
  const remaining = plan.budget - plan.total;
  const servingsTotal = plan.meals.reduce((s, m) => s + m.servings, 0);
  const perServing = servingsTotal ? plan.total / servingsTotal : 0;
  const tilt = Math.max(-10, Math.min(10, ((plan.budget - plan.total) / Math.max(plan.total, 1)) * 30));

  return (
    <section aria-labelledby="summary-title" className="glow-mint relative overflow-hidden rounded-lg border border-line bg-surface p-3 text-ink shadow-lift sm:p-5">
      {/* oversized watermark mark */}
      <MizanMark className="pointer-events-none absolute -bottom-6 -left-4 h-32 w-32 text-raised" jewel="currentColor" tilt={tilt} />

      <div className="relative grid gap-4 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <h2 id="summary-title" className="text-sm font-bold text-mint-300">
            سلة هذا الأسبوع
          </h2>
          <div className="mt-1 flex items-baseline gap-1">
            <AnimatedNumber value={plan.total} className="font-display text-5xl font-black tracking-tight sm:text-6xl" />
            <span className="text-xl font-bold text-ink-soft">{CURRENCY}</span>
          </div>
          <p className="tabular mt-1 text-base text-ink-soft">
            من ميزانية {fmtWhole(plan.budget)} {CURRENCY}
          </p>

          {/* budget bar */}
          <div className="mt-3">
            <div className="relative h-2 overflow-hidden rounded-full bg-line-strong">
              <motion.div
                className={cx('h-full rounded-full', plan.overBudget ? 'bg-clay-500' : 'bg-mint-400')}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, used * 100)}%` }}
                transition={{ duration: 1.1, ease: easeOut, delay: 0.15 }}
              />
            </div>
            <div className="tabular mt-1 flex justify-between text-xs text-ink-faint">
              <span>{Math.round(used * 100)}% من الميزانية</span>
              <span>{plan.overBudget ? 'تجاوز' : 'ضمن الميزانية'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 sm:gap-2 lg:col-span-5">
          <Stat icon={<PiggyBank size={20} />} label="وفّرت" value={plan.saved} accent />
          <Stat icon={<Wallet size={20} />} label={remaining >= 0 ? 'المتبقي' : 'الزيادة'} value={Math.abs(remaining)} />
          <Stat icon={<Utensils size={20} />} label="سعر الحصة" value={perServing} />
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap items-center gap-1 border-t border-line-strong pt-3">
        <span className="me-1 text-xs font-bold text-ink-faint">توزيع السلة</span>
        {plan.byStore.map(({ store, total, items }) => (
          <span key={store.id} className="tabular inline-flex h-4 items-center gap-1 rounded-full bg-raised px-2 text-sm">
            <span className="font-bold">{store.name}</span>
            <span className="text-ink-faint">
              {fmtMoney(total)} · {items} {itemsNoun(items)}
            </span>
          </span>
        ))}
        {plan.stockSaved > 0 && (
          <span className="tabular inline-flex h-4 items-center gap-1 rounded-full bg-mint-400 px-2 text-sm font-bold text-canvas">
            <Recycle size={16} aria-hidden="true" />
            البواقي وفّرت {fmtMoney(plan.stockSaved)}
          </span>
        )}
        {plan.trimmed > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-ink-soft sm:ms-auto">
            <Info size={16} aria-hidden="true" />
            استبعدنا {plan.trimmed} من الوصفات الأغلى لتبقى قريباً من ميزانيتك
          </span>
        )}
      </div>
    </section>
  );
}

function Stat({ icon, label, value, accent }: { icon: ReactNode; label: string; value: number; accent?: boolean }) {
  return (
    <div className={cx('flex flex-col gap-1 rounded-md p-2', accent ? 'bg-mint text-canvas' : 'border border-line bg-raised text-ink')}>
      <span className={cx('flex items-center gap-1 text-xs font-bold', accent ? 'text-canvas/70' : 'text-ink-faint')}>
        {icon}
        {label}
      </span>
      <span className="flex items-baseline gap-1">
        <AnimatedNumber value={value} className="font-display text-xl font-bold sm:text-2xl" />
        <span className="text-xs opacity-70">{CURRENCY}</span>
      </span>
    </div>
  );
}
