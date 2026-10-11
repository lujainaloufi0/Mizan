'use client';

import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';
import { STORES } from '@/lib/data';
import { cx } from '@/lib/format';
import type { StoreId } from '@/lib/types';
import { CheckBadge, spring } from '@/components/ui/primitives';
import { sound } from '@/lib/sound';

export function StoreStep({ value, onChange }: { value: StoreId[]; onChange: (v: StoreId[]) => void }) {
  const toggle = (id: StoreId) => (sound.tick(), onChange(value.includes(id) ? value.filter((s) => s !== id) : [...value, id]));
  const all = value.length === STORES.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {STORES.map((store, i) => {
          const on = value.includes(store.id);
          return (
            <motion.button
              key={store.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(store.id)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.04 * i }}
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -2 }}
              className={cx(
                'relative flex flex-col items-start gap-2 rounded-md border bg-surface p-2 text-start transition-[border-color,box-shadow] duration-200',
                on ? 'border-sand shadow-lift' : 'border-line shadow-card hover:border-ink-faint',
              )}
            >
              <div className="flex w-full items-start justify-between">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-sm font-display text-2xl font-bold"
                  style={{ color: store.tint, backgroundColor: `${store.tint}1A`, boxShadow: `inset 0 0 0 1px ${store.tint}33` }}
                  aria-hidden="true"
                >
                  {store.name.replace('ال', '').charAt(0)}
                </span>
                <CheckBadge on={on} />
              </div>
              <div>
                <div className="text-lg font-bold">{store.name}</div>
                <div className="text-xs text-ink-soft" dir="ltr">
                  {store.nameEn}
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-mint-300">
                <Tag size={16} aria-hidden="true" />
                <span>{store.dealNote}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => onChange(all ? [] : STORES.map((s) => s.id))}
        className="self-start rounded-full px-2 text-sm font-bold text-ink-soft underline decoration-ink-faint underline-offset-4 hover:text-ink"
      >
        {all ? 'إلغاء تحديد الكل' : 'أتسوّق من أي متجر — اختر الكل'}
      </button>
    </div>
  );
}
