'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import { spring } from './primitives';

/**
 * Tiny toast system. Call `toast(...)` from anywhere; one <Toaster /> renders them.
 * A new toast replaces the current one: Mizan's toasts confirm the last action.
 */
type ToastInput = { message: ReactNode; icon?: ReactNode; action?: { label: string; run: () => void }; tone?: 'default' | 'error' };
type Toast = ToastInput & { id: number };

let listener: ((t: Toast | null) => void) | null = null;
let seq = 0;

export function toast(t: ToastInput) {
  listener?.({ ...t, id: ++seq });
}

export function Toaster() {
  const [current, setCurrent] = useState<Toast | null>(null);

  useEffect(() => {
    listener = setCurrent;
    return () => {
      listener = null;
    };
  }, []);

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => setCurrent(null), current.action ? 6000 : 3200);
    return () => clearTimeout(t);
  }, [current]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(24px,env(safe-area-inset-bottom,0px))]" aria-live="polite" role="status">
      <AnimatePresence mode="popLayout">
        {current && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.18 } }}
            transition={spring}
            className={
              'pointer-events-auto flex min-h-6 max-w-[480px] items-center gap-2 rounded-full py-1 ps-2 pe-1 text-sm shadow-lift ' +
              (current.tone === 'error' ? 'border border-clay-500 bg-clay-900 text-ink' : 'border border-line-strong bg-raised text-ink')
            }
          >
            {current.icon && <span className="flex shrink-0 items-center">{current.icon}</span>}
            <span className="min-w-0 flex-1 py-1">{current.message}</span>
            {current.action ? (
              <button
                type="button"
                onClick={() => {
                  current.action?.run();
                  setCurrent(null);
                }}
                className="h-4 shrink-0 rounded-full bg-mint-400 px-2 text-sm font-bold text-canvas transition-transform active:scale-95"
              >
                {current.action.label}
              </button>
            ) : (
              <span className="w-1" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
