'use client';

import { motion } from 'framer-motion';
import { DAYS } from '@/lib/data';
import { cx } from '@/lib/format';
import type { DayId } from '@/lib/types';
import { spring } from '@/components/ui/primitives';
import { C } from '@/lib/palette';
import { sound } from '@/lib/sound';

const PRESETS: { label: string; days: DayId[] }[] = [
  { label: 'أيام الدوام', days: ['sun', 'mon', 'tue', 'wed', 'thu'] },
  { label: 'الأسبوع كله', days: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] },
  { label: 'الويكند فقط', days: ['fri', 'sat'] },
];

const same = (a: DayId[], b: DayId[]) => a.length === b.length && a.every((d) => b.includes(d));

export function DaysStep({ value, onChange }: { value: DayId[]; onChange: (v: DayId[]) => void }) {
  const toggle = (id: DayId) => (sound.tick(), onChange(value.includes(id) ? value.filter((d) => d !== id) : [...value, id]));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-1 sm:grid-cols-7">
        {DAYS.map((d, i) => {
          const on = value.includes(d.id);
          return (
            <motion.button
              key={d.id}
              type="button"
              aria-pressed={on}
              aria-label={d.name}
              onClick={() => toggle(d.id)}
              whileTap={{ scale: 0.94 }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.03 * i }}
              className={cx(
                'flex h-12 flex-col items-center justify-between rounded-full py-2 transition-colors duration-200',
                on ? 'bg-sand text-canvas' : 'border border-line bg-surface text-ink shadow-card hover:border-ink-faint',
              )}
            >
              <span className="text-sm font-bold">{d.short}</span>
              <motion.span
                initial={false}
                animate={{ scale: on ? 1 : 0.5, backgroundColor: on ? C.mint : C.lineStrong }}
                transition={spring}
                className="h-1 w-1 rounded-full"
              />
            </motion.button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {PRESETS.map((p) => {
          const on = same(value, p.days);
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(p.days)}
              className={cx(
                'h-5 rounded-full border px-2 text-sm font-bold transition-colors duration-200',
                on ? 'border-mint-500 bg-mint/10 text-mint-300' : 'border-line-strong text-ink-soft hover:bg-raised',
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <p className="text-base text-ink-soft">
        {value.length === 0 ? (
          'اختر يوماً واحداً على الأقل.'
        ) : (
          <>
            أيام الطبخ هذا الأسبوع: <strong className="tabular font-bold text-ink">{value.length}</strong>
          </>
        )}
      </p>
    </div>
  );
}
