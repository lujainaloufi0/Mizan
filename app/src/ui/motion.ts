/**
 * Mizan motion: quiet by default.
 *
 * Rules
 * - Things fade, they don't fly. No sideways slides, no zooms, no overshoot.
 * - Feedback is fast (≤ 120 ms), state changes are short (180 ms), nothing
 *   is longer than 240 ms except a bottom sheet rising (260 ms).
 * - One curve everywhere: ease-out, so motion starts responsive and settles.
 * - Every preset honours the system "Remove animations" setting.
 */
import { Easing, FadeIn, FadeOut, LinearTransition, ReduceMotion, SlideInDown, SlideOutDown } from 'react-native-reanimated';

export const DUR = { press: 100, fast: 120, base: 180, slow: 240, sheet: 260 } as const;

const out = Easing.out(Easing.cubic);

/** `withTiming` config. */
export const ease = (duration: number = DUR.base) => ({ duration, easing: out, reduceMotion: ReduceMotion.System });

/** Content appearing (a screen's body, a step, an expanded section). */
export const enter = FadeIn.duration(DUR.base).easing(out).reduceMotion(ReduceMotion.System);
/** Content leaving. */
export const exit = FadeOut.duration(DUR.fast).reduceMotion(ReduceMotion.System);
/** Rows moving when a list changes. */
export const layout = LinearTransition.duration(DUR.base).easing(out).reduceMotion(ReduceMotion.System);

/** Bottom sheets rise without bounce. */
export const sheetIn = SlideInDown.duration(DUR.sheet).easing(out).reduceMotion(ReduceMotion.System);
export const sheetOut = SlideOutDown.duration(DUR.base).reduceMotion(ReduceMotion.System);
export const scrimIn = FadeIn.duration(DUR.base).reduceMotion(ReduceMotion.System);
export const scrimOut = FadeOut.duration(DUR.fast).reduceMotion(ReduceMotion.System);

/** How far a pressed control sinks. Barely, so it reads as touch, not as animation. */
export const PRESS_SCALE = 0.98;
