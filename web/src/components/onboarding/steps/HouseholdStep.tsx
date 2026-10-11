'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Baby, User } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { portionsFor } from '@/lib/planner';
import { NumberStepper } from '@/components/ui/primitives';
import { C } from '@/lib/palette';

export function HouseholdStep({
  adults,
  kids,
  onChange,
}: {
  adults: number;
  kids: number;
  onChange: (v: { adults: number; kids: number }) => void;
}) {
  const portions = portionsFor(adults, kids);
  // stagger the family in on first view only; later changes pop in instantly
  const [firstPaint, setFirstPaint] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setFirstPaint(false), 800);
    return () => clearTimeout(t);
  }, []);
  const people = [
    ...Array.from({ length: adults }, (_, i) => ({ key: `a${i}`, kid: false })),
    ...Array.from({ length: kids }, (_, i) => ({ key: `k${i}`, kid: true })),
  ];

  return (
    <div className="flex flex-col gap-3">
      <Row icon={<User size={24} />} title="البالغون" hint="13 سنة فأكثر">
        <NumberStepper label="البالغين" value={adults} min={1} max={12} onChange={(n) => onChange({ adults: n, kids })} />
      </Row>
      <Row icon={<Baby size={24} />} title="الأطفال" hint="أقل من 13 · نصف حصة">
        <NumberStepper label="الأطفال" value={kids} min={0} max={10} onChange={(n) => onChange({ adults, kids: n })} />
      </Row>

      <div className="mt-1 flex flex-col gap-3 rounded-md border border-line bg-surface p-3 text-ink">
        {/* the family pops up from behind the table */}
        <div className="relative flex h-12 items-end gap-1 overflow-hidden border-b-2 border-line-strong px-1" aria-hidden="true">
          <AnimatePresence mode="popLayout">
            {people.map((p, i) => (
              <motion.div
                key={p.key}
                layout
                initial={{ y: '110%' }}
                animate={{ y: 0, transition: { type: 'spring', stiffness: 380, damping: 15, delay: firstPaint ? i * 0.06 : 0 } }}
                exit={{ y: '110%', transition: { duration: 0.22, ease: 'easeIn' } }}
                className="flex min-w-[16px] items-end"
                style={{ flex: p.kid ? '0 1 30px' : '0 1 40px' }}
              >
                <Person kid={p.kid} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <p className="text-base text-ink-soft">
          سنطبخ{' '}
          <motion.strong key={portions} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="tabular inline-block font-display text-xl text-mint-300">
            {portions}
          </motion.strong>{' '}
          حصة لكل وجبة، ونضبط المقادير تلقائياً.
        </p>
      </div>
    </div>
  );
}

/** Line-art figure: adults in mint, kids smaller in sand. */
function Person({ kid }: { kid: boolean }) {
  const color = kid ? C.sand : C.mint;
  return kid ? (
    <svg viewBox="0 0 30 52" className="block h-auto w-full" fill={C.surface} stroke={color} strokeWidth="1.75" strokeLinejoin="round">
      <circle cx="15" cy="10" r="7.5" />
      <path d="M3.5 52V38a11.5 11.5 0 0 1 23 0v14" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 40 72" className="block h-auto w-full" fill={C.surface} stroke={color} strokeWidth="1.75" strokeLinejoin="round">
      <circle cx="20" cy="14" r="9.5" />
      <path d="M4.5 72V46a15.5 15.5 0 0 1 31 0v26" strokeLinecap="round" />
    </svg>
  );
}

function Row({ icon, title, hint, children }: { icon: ReactNode; title: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-line bg-surface p-2 shadow-card sm:p-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-raised text-ink">{icon}</span>
        <div>
          <div className="text-lg font-bold">{title}</div>
          <div className="text-xs text-ink-soft sm:text-sm">{hint}</div>
        </div>
      </div>
      {children}
    </div>
  );
}
