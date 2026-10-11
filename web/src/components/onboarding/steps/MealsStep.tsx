'use client';

import { motion } from 'framer-motion';
import { SLOT_ICON, type LineIcon } from '@/components/ui/icon-map';
import { sound } from '@/lib/sound';
import { cx, mealsNoun } from '@/lib/format';
import { spring } from '@/components/ui/primitives';

const OPTIONS: { n: 1 | 2 | 3; title: string; detail: string; art: LineIcon[] }[] = [
  { n: 1, title: 'وجبة واحدة', detail: 'الغداء فقط', art: [SLOT_ICON.lunch] },
  { n: 2, title: 'وجبتان', detail: 'غداء وعشاء', art: [SLOT_ICON.lunch, SLOT_ICON.dinner] },
  { n: 3, title: 'ثلاث وجبات', detail: 'فطور وغداء وعشاء', art: [SLOT_ICON.breakfast, SLOT_ICON.lunch, SLOT_ICON.dinner] },
];

export function MealsStep({ value, days, onChange }: { value: 1 | 2 | 3; days: number; onChange: (v: 1 | 2 | 3) => void }) {
  const total = value * days;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2" role="radiogroup" aria-label="عدد الوجبات في اليوم">
        {OPTIONS.map((o) => {
          const on = o.n === value;
          return (
            <button
              key={o.n}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                if (o.n !== value) sound.tick();
                onChange(o.n);
              }}
              className={cx(
                'relative flex h-10 items-center justify-between overflow-hidden rounded-md border px-3 text-start transition-[border-color,color] duration-200',
                on ? 'border-sand text-canvas' : 'border-line bg-surface text-ink shadow-card hover:border-ink-faint',
              )}
            >
              {on && <motion.span layoutId="meals-active" transition={spring} className="absolute inset-0 bg-sand" />}
              <span className="relative flex items-center gap-2">
                <span className={cx('font-display text-4xl font-bold tabular', on ? 'text-canvas' : 'text-ink-faint')}>{o.n}</span>
                <span>
                  <span className="block text-lg font-bold">{o.title}</span>
                  <span className={cx('block text-sm', on ? 'text-canvas/70' : 'text-ink-soft')}>{o.detail}</span>
                </span>
              </span>
              <span className="relative flex items-center gap-1" aria-hidden="true">
                {o.art.map((Icon, k) => (
                  <span key={k} className={cx('flex h-4 w-4 items-center justify-center rounded-full', on ? 'bg-canvas/10 text-canvas' : 'bg-raised text-sand')}>
                    <Icon size={20} />
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-base text-ink-soft">
        المجموع:{' '}
        <motion.strong key={total} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="tabular inline-block font-bold text-ink">
          {total}
        </motion.strong>{' '}
        {mealsNoun(total)} في الأسبوع
      </p>
    </div>
  );
}
