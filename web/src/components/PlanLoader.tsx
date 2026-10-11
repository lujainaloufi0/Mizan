'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { STORE_BY_ID } from '@/lib/data';
import type { StoreId } from '@/lib/types';
import { INGREDIENT_ICON, APP_ICON, AISLE_HUE } from '@/components/ui/icon-map';
import { INGREDIENT_BY_ID } from '@/lib/data';
import { MizanMark, easeOut } from '@/components/ui/primitives';

const BASKET = ['tomato', 'chicken', 'basmati', 'eggs', 'milk', 'bread', 'lemon', 'carrot'];

const STEP_MS = 1300;

function joinStores(names: string[]) {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join('، ')} و${names.at(-1)}`;
}

export function PlanLoader({ stores, onDone, variant = 'new' }: { stores: StoreId[]; onDone: () => void; variant?: 'new' | 'repeat' }) {
  const names = stores.slice(0, 2).map((id) => STORE_BY_ID[id].name);
  const messages = variant === 'repeat' ? [
    'نجهّز خطتك المعتادة…',
    `نحدّث الأسعار بعروض ${joinStores(names)} لهذا الأسبوع…`,
  ] : [
    `نراجع عروض الأسبوع في ${joinStores(names)}${stores.length > 2 ? ' وغيرها' : ''}…`,
    'نوازن سلّتك بين السعر والتنوّع…',
    'نضع اللمسات الأخيرة على خطة ميزان…',
  ];
  const [i, setI] = useState(0);

  useEffect(() => {
    const timers = messages.map((_, k) => setTimeout(() => setI(k), k * STEP_MS));
    const done = setTimeout(onDone, messages.length * STEP_MS);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grain flex min-h-screen flex-col items-center justify-center bg-canvas px-3 text-ink" role="status" aria-live="polite">
      <motion.div
        animate={{ rotate: [-6, 6, -6] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="text-sand"
      >
        <MizanMark className="h-12 w-12" />
      </motion.div>

      <div className="mt-5 h-8 w-full max-w-[480px] text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -16, filter: 'blur(4px)' }}
            transition={{ duration: 0.45, ease: easeOut }}
            className="font-display text-2xl font-bold sm:text-3xl"
          >
            {messages[i]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="mt-4 h-1 w-full max-w-[240px] overflow-hidden rounded-full bg-line-strong">
        <motion.div
          className="h-full rounded-full bg-mint-400"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: (messages.length * STEP_MS) / 1000, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>

      {/* groceries hop into the cart while the plan is built */}
      <div className="mt-5 flex items-end gap-1" aria-hidden="true">
        <APP_ICON.cart size={40} className="me-1 text-sand" />
        {BASKET.map((name, k) => (
          <motion.span
            key={name}
            initial={{ y: -40, opacity: 0, scale: 0.6 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 14, delay: 0.25 + k * ((messages.length * STEP_MS) / 1000 - 0.8) / BASKET.length }}
          >
            {(() => {
              const Icon = INGREDIENT_ICON[name];
              return <Icon size={24} style={{ color: AISLE_HUE[INGREDIENT_BY_ID[name].aisle] }} />;
            })()}
          </motion.span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-1">
        {stores.map((id, k) => (
          <motion.span
            key={id}
            initial={{ opacity: 0.25 }}
            animate={{ opacity: [0.25, 1, 0.6] }}
            transition={{ duration: 1.2, delay: 0.15 * k, ease: easeOut }}
            className="rounded-full border border-line-strong px-2 text-sm text-ink-soft"
          >
            {STORE_BY_ID[id].name}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
