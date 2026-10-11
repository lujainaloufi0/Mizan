'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CURRENCY, cx, fmtWhole } from '@/lib/format';
import type { BudgetMood } from '@/lib/planner';
import { BalanceScale } from '@/components/ui/BalanceScale';
import { spring } from '@/components/ui/primitives';

export const BUDGET_MIN = 150;
export const BUDGET_MAX = 3000;
export const BUDGET_STEP = 10;

const MOODS: Record<BudgetMood, { ar: string; en: string; hint: string; tone: string }> = {
  lean: {
    ar: 'ذكي ومقتصد',
    en: 'Smart & Lean',
    hint: 'سنقدّم الوصفات الأوفر ونستبدل الأغلى حتى تبقى السلة داخل ميزانيتك.',
    tone: 'bg-line text-ink',
  },
  balanced: {
    ar: 'أسبوع متوازن',
    en: 'Balanced week',
    hint: 'تنوّع كامل في الوصفات، والسلة تقريباً بقدر ميزانيتك.',
    tone: 'bg-mint/15 text-mint-300',
  },
  comfortable: {
    ar: 'مريح للميزانية',
    en: 'Budget-friendly',
    hint: 'تنوّع كامل ويتبقى معك فائض نهاية الأسبوع.',
    tone: 'bg-mint text-canvas',
  },
};

export function BudgetStep({
  value,
  onChange,
  estimate,
  lean,
  mood,
}: {
  value: number;
  onChange: (v: number) => void;
  estimate: number;
  lean: number;
  mood: BudgetMood;
}) {
  const fill = ((value - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100;
  const m = MOODS[mood];
  const belowFloor = value < lean;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col items-center gap-1 text-center">
        <div className="flex items-baseline gap-1">
          <span className="tabular font-display text-6xl font-black tracking-tight">{fmtWhole(value)}</span>
          <span className="text-xl font-bold text-ink-soft">{CURRENCY}</span>
        </div>
        <div className="h-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={mood}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={spring}
              className={cx('inline-flex h-4 items-center gap-1 rounded-full px-2 text-sm font-bold', m.tone)}
            >
              {m.ar}
              <span className="text-xs font-medium opacity-70" dir="ltr">
                {m.en}
              </span>
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <div>
        <label htmlFor="budget" className="sr-only">
          ميزانية الأسبوع بالريال السعودي
        </label>
        <input
          id="budget"
          type="range"
          className="mizan-range"
          min={BUDGET_MIN}
          max={BUDGET_MAX}
          step={BUDGET_STEP}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ ['--fill' as string]: `${fill}%` }}
          aria-valuetext={`${value} ريال`}
        />
        <div className="flex justify-between text-xs text-ink-soft tabular">
          <span>{fmtWhole(BUDGET_MIN)}</span>
          <span>{fmtWhole(BUDGET_MAX)}</span>
        </div>
      </div>

      <div className="-mt-1 flex justify-center">
        <BalanceScale budget={value} cost={estimate} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <div>
          <div className="text-xs font-bold text-mint-300">ميزانيتك</div>
          <div className="tabular text-lg font-bold">
            {fmtWhole(value)} {CURRENCY}
          </div>
        </div>
        <div>
          <div className="text-xs font-bold text-sand">سلة الأسبوع المتوقعة</div>
          <div className="tabular text-lg font-bold">
            {fmtWhole(estimate)} {CURRENCY}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={belowFloor ? 'floor' : mood}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cx('rounded-md p-2 text-center text-sm', belowFloor ? 'bg-clay/15 text-clay-300' : 'bg-raised text-ink-soft')}
        >
          {belowFloor
            ? `أقل سلة ممكنة لعائلتك تقارب ${fmtWhole(lean)} ${CURRENCY}. سنقترب منها قدر الإمكان.`
            : m.hint}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
