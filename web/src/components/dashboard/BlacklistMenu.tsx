'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Ban, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { RECIPES } from '@/lib/data';
import { RecipeIcon } from '@/components/ui/FoodTile';
import { spring } from '@/components/ui/primitives';

/** Dishes the household asked us never to suggest, with a way back. */
export function BlacklistMenu({ ids, onRestore }: { ids: string[]; onRestore: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!ids.length) setOpen(false);
  }, [ids.length]);

  const recipes = ids.map((id) => RECIPES.find((r) => r.id === id)).filter((r): r is (typeof RECIPES)[number] => Boolean(r));

  return (
    <AnimatePresence>
      {recipes.length > 0 && (
        <motion.div ref={ref} className="relative" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={spring}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="true"
            className="flex h-7 items-center gap-1 rounded-full border border-line-strong px-2 text-sm font-bold text-ink-soft transition-colors hover:bg-raised"
          >
            <Ban size={16} aria-hidden="true" />
            <span className="hidden sm:inline">المستبعدة</span>
            <span className="tabular">{recipes.length}</span>
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={spring}
                className="absolute end-0 top-full z-20 mt-1 w-[280px] origin-top-left rounded-md border border-line bg-surface p-2 shadow-lift"
              >
                <p className="px-1 pb-1 text-xs font-bold text-sand">لن نقترحها في أي خطة</p>
                <ul className="flex flex-col gap-1">
                  <AnimatePresence initial={false}>
                    {recipes.map((r) => (
                      <motion.li key={r.id} layout exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2 overflow-hidden rounded-sm p-1 hover:bg-raised">
                        <RecipeIcon id={r.id} size={24} />
                        <span className="min-w-0 flex-1 truncate text-sm font-bold">{r.title}</span>
                        <button
                          type="button"
                          onClick={() => onRestore(r.id)}
                          className="flex h-4 shrink-0 items-center gap-1 rounded-full px-1 text-xs font-bold text-mint-300 hover:bg-mint/15"
                        >
                          <RotateCcw size={16} aria-hidden="true" />
                          استرجاع
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
