'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { spring } from '@/components/ui/primitives';

/** Shown only when the browser refuses clipboard access: the list, pre-selected, ready to copy by hand. */
export function CopySheet({ text, onClose }: { text: string | null; onClose: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!text) return;
    const t = setTimeout(() => ref.current?.select(), 120);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [text, onClose]);

  return (
    <AnimatePresence>
      {text && (
        <div className="fixed inset-0 z-30 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="copy-title">
          <motion.button type="button" aria-label="إغلاق" className="absolute inset-0 cursor-default bg-canvas/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div initial={{ y: 48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 48, opacity: 0 }} transition={spring} className="relative flex w-full max-w-[560px] flex-col gap-2 rounded-t-lg bg-surface p-3 shadow-lift sm:rounded-lg">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 id="copy-title" className="font-display text-2xl font-bold">
                  انسخ القائمة
                </h2>
                <p className="text-sm text-ink-soft">المتصفح منع النسخ التلقائي. النص محدد، اضغط نسخ من قائمة جهازك.</p>
              </div>
              <button type="button" onClick={onClose} aria-label="إغلاق" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-raised hover:bg-line">
                <X size={20} />
              </button>
            </div>
            <label htmlFor="copy-text" className="sr-only">
              قائمة المقاضي
            </label>
            <textarea id="copy-text" ref={ref} readOnly value={text} rows={12} className="w-full resize-none rounded-md border border-line-strong bg-raised p-2 text-sm leading-6" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
