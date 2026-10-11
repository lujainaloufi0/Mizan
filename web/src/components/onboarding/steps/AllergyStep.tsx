'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';
import { ALLERGENS } from '@/lib/data';
import { cx } from '@/lib/format';
import { safeRecipes } from '@/lib/planner';
import type { AllergenId } from '@/lib/types';
import { ALLERGEN_ICON } from '@/components/ui/icon-map';
import { sound } from '@/lib/sound';
import { CheckBadge, spring } from '@/components/ui/primitives';

export function AllergyStep({ value, onChange }: { value: AllergenId[]; onChange: (v: AllergenId[]) => void }) {
  const toggle = (id: AllergenId) => (sound.tick(), onChange(value.includes(id) ? value.filter((a) => a !== id) : [...value, id]));
  const none = value.length === 0;

  const impact = useMemo(() => {
    const { safe, excluded } = safeRecipes(value);
    const adjusted = safe.filter((r) => r.removed.length > 0).length;
    return { excluded, adjusted, available: safe.length };
  }, [value]);

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        aria-pressed={none}
        onClick={() => onChange([])}
        className={cx(
          'flex h-8 items-center justify-between rounded-md border px-2 text-start transition-colors duration-200',
          none ? 'border-mint-500 bg-mint/10' : 'border-line bg-surface shadow-card hover:border-ink-faint',
        )}
      >
        <span className="flex items-center gap-2">
          <span className={cx('flex h-4 w-4 items-center justify-center rounded-sm', none ? 'bg-mint-400 text-canvas' : 'bg-raised text-ink-soft')}>
            <ShieldCheck size={20} />
          </span>
          <span className="text-lg font-bold">لا توجد حساسية في البيت</span>
        </span>
        <CheckBadge on={none} />
      </button>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ALLERGENS.map((a, i) => {
          const on = value.includes(a.id);
          const Icon = ALLERGEN_ICON[a.id];
          return (
            <motion.button
              key={a.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(a.id)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.03 * i }}
              whileTap={{ scale: 0.96 }}
              className={cx(
                'flex flex-col items-start gap-1 rounded-md border p-2 text-start transition-[background-color,border-color,color] duration-200',
                on ? 'border-clay-500 bg-clay/15 text-clay-300' : 'border-line bg-surface text-ink shadow-card hover:border-ink-faint',
              )}
            >
              <span className="flex w-full items-center justify-between">
                <span className={cx('flex h-4 w-4 items-center justify-center rounded-sm transition-colors', on ? 'bg-clay-500 text-canvas' : 'bg-raised')}>
                  <Icon size={20} aria-hidden="true" />
                </span>
                <motion.span initial={false} animate={{ scale: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={spring} className="text-xs font-bold">
                  بدون
                </motion.span>
              </span>
              <span className="text-base font-bold">{a.name}</span>
              <span className={cx('text-xs', on ? 'text-clay-300' : 'text-ink-soft')}>{a.hint}</span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={none ? 'none' : `${impact.excluded}-${impact.adjusted}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="rounded-md bg-raised p-2 text-sm text-ink-soft"
        >
          {none ? (
            'كل الوصفات متاحة لكم.'
          ) : (
            <>
              <strong className="tabular text-ink">{impact.available}</strong> وصفة آمنة متاحة.
              {impact.excluded > 0 && <> استبعدنا <strong className="tabular text-ink">{impact.excluded}</strong> فيها مسبب الحساسية.</>}
              {impact.adjusted > 0 && <> وفي <strong className="tabular text-ink">{impact.adjusted}</strong> نشيل الطبق الجانبي فقط (مثل الخبز).</>}
            </>
          )}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
