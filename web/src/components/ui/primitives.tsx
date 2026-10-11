'use client';

import { animate, motion, useAnimationControls, useMotionValue, useTransform, type HTMLMotionProps, type TargetAndTransition } from 'framer-motion';
import { Check, Minus, Plus, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { cx, fmtMoney } from '@/lib/format';
import { C } from '@/lib/palette';
import { sound } from '@/lib/sound';

/* ───────── Motion vocabulary ─────────
 * spring      selection, layout, anything the hand moved
 * softSpring  large surfaces settling
 * press       the tactile [1 → 1.15 → 1] bounce on counters and confirmations
 * easeOut     reveals and fades */
export const spring = { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 } as const;
export const softSpring = { type: 'spring', stiffness: 220, damping: 28 } as const;
export const barSpring = { type: 'spring', stiffness: 160, damping: 22 } as const;
export const easeOut = [0.16, 1, 0.3, 1] as const;
export const press: TargetAndTransition = { scale: [1, 1.15, 1], transition: { duration: 0.32, times: [0, 0.4, 1], ease: 'easeOut' } };

/* ───────── Brand mark: a minimal balance ───────── */

export function MizanMark({ className = '', tilt = 0, jewel = C.mint }: { className?: string; tilt?: number; jewel?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <g
        style={{
          transform: `rotate(${tilt}deg)`,
          transformOrigin: '16px 11px',
          transition: 'transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <rect x="4" y="10" width="24" height="1.5" rx="0.75" fill="currentColor" />
        <path d="M4 12 L1 20 H9 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M28 12 L23 20 H31 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      <circle cx="16" cy="7" r="2.5" fill={jewel} />
      <path d="M16 11 V27 M11 28 H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <div className={cx('flex items-center gap-1', className)}>
      <MizanMark className="h-4 w-4 text-sand" />
      <span className="font-display text-2xl font-bold tracking-tight text-ink">مِيزان</span>
    </div>
  );
}

/* ───────── Buttons ─────────
 * primary  sand on charcoal — the one action that moves you forward
 * mint     money and success moments
 * ghost    everything else */

type BtnProps = Omit<HTMLMotionProps<'button'>, 'children'> & { variant?: 'primary' | 'ghost' | 'mint'; children: ReactNode; silent?: boolean };

export function Button({ variant = 'primary', className, children, onClick, silent, ...rest }: BtnProps) {
  const styles = {
    primary: 'bg-sand text-canvas hover:bg-sand-deep disabled:bg-line disabled:text-ink-faint',
    mint: 'bg-mint text-canvas shadow-glow hover:bg-mint-400 disabled:bg-line disabled:text-ink-faint disabled:shadow-none',
    ghost: 'bg-transparent text-ink hover:bg-raised disabled:text-ink-faint',
  }[variant];
  return (
    <motion.button
      {...rest}
      onClick={(e) => {
        if (!silent) sound.tick();
        onClick?.(e);
      }}
      whileTap={rest.disabled ? undefined : { scale: 0.96 }}
      whileHover={rest.disabled ? undefined : { y: -1 }}
      transition={spring}
      className={cx(
        'inline-flex h-7 items-center justify-center gap-1 rounded-full px-3 text-base font-bold',
        'transition-[background-color,color,box-shadow] duration-200 ease-out-expo disabled:cursor-not-allowed',
        styles,
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

/* ───────── Check badge used by selectable tiles ───────── */

export function CheckBadge({ on, className = '' }: { on: boolean; className?: string }) {
  return (
    <motion.span
      initial={false}
      animate={on ? { scale: [1, 1.15, 1] } : { scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cx(
        'flex h-3 w-3 shrink-0 items-center justify-center rounded-full border transition-colors duration-200',
        on ? 'border-sand bg-sand text-canvas' : 'border-line-strong bg-raised text-transparent',
        className,
      )}
    >
      <motion.span initial={false} animate={{ scale: on ? 1 : 0.4, opacity: on ? 1 : 0 }} transition={spring}>
        <Check size={16} className="icon-bold" />
      </motion.span>
    </motion.span>
  );
}

/* ───────── Number stepper: tick + spring bounce on every change ───────── */

export function NumberStepper({
  value,
  min,
  max,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  label: string;
}) {
  const btn =
    'flex h-6 w-6 items-center justify-center rounded-full border border-line-strong bg-raised text-ink transition-colors duration-200 hover:border-sand hover:text-sand disabled:opacity-30';
  const step = (d: number) => {
    const next = Math.min(max, Math.max(min, value + d));
    if (next !== value) {
      sound.tick();
      onChange(next);
    }
  };
  return (
    <div className="flex shrink-0 items-center gap-1 sm:gap-2" role="group" aria-label={label}>
      <motion.button type="button" whileTap={value > min ? press : undefined} className={btn} onClick={() => step(-1)} disabled={value <= min} aria-label={`إنقاص ${label}`}>
        <Minus size={20} />
      </motion.button>
      <div className="relative h-6 w-6 overflow-hidden text-center">
        <motion.span
          key={value}
          initial={{ y: 16, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 520, damping: 22 }}
          className="tabular absolute inset-0 flex items-center justify-center font-display text-3xl font-bold"
          aria-live="polite"
        >
          {value}
        </motion.span>
      </div>
      <motion.button type="button" whileTap={value < max ? press : undefined} className={btn} onClick={() => step(1)} disabled={value >= max} aria-label={`زيادة ${label}`}>
        <Plus size={20} />
      </motion.button>
    </div>
  );
}

/* ───────── Animated money / number ───────── */

export function AnimatedNumber({ value, format = fmtMoney, className }: { value: number; format?: (n: number) => string; className?: string }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => format(v));
  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.1, ease: easeOut });
    return () => controls.stop();
  }, [mv, value]);
  return <motion.span className={cx('tabular', className)}>{text}</motion.span>;
}

/** Re-runs the press bounce whenever `trigger` changes — for values that update elsewhere. */
export function usePulse(trigger: unknown) {
  const controls = useAnimationControls();
  useEffect(() => {
    void controls.start({ scale: [1, 1.15, 1], transition: { duration: 0.32 } });
  }, [trigger, controls]);
  return controls;
}

/* ───────── Sound toggle ───────── */

export function SoundToggle({ className }: { className?: string }) {
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    setMuted(sound.isMuted());
    return sound.subscribe(setMuted);
  }, []);
  return (
    <motion.button
      type="button"
      whileTap={press}
      onClick={() => {
        sound.setMuted(!muted);
        if (muted) setTimeout(() => sound.tick(), 0);
      }}
      aria-pressed={!muted}
      aria-label={muted ? 'تشغيل الأصوات' : 'كتم الأصوات'}
      title={muted ? 'تشغيل الأصوات' : 'كتم الأصوات'}
      className={cx('flex h-5 w-5 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-raised hover:text-ink', className)}
    >
      {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
    </motion.button>
  );
}
