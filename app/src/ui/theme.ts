/**
 * Mizan design tokens for React Native.
 *
 * 8pt grid: `space(n)` is n × 8. Use it for every margin, padding, gap and
 * component size. Radii and line heights are multiples of 8 too.
 */
import { C } from '@/lib/palette';

export const colors = {
  canvas: C.canvas,
  surface: C.surface,
  raised: C.raised,
  line: C.line,
  lineStrong: C.lineStrong,
  ink: C.ink,
  inkSoft: C.inkSoft,
  inkFaint: C.inkFaint,
  sand: C.sand,
  sandDeep: C.sandDeep,
  sandDim: C.sandDim,
  mint: C.mint,
  mint300: C.mint300,
  mint400: C.mint400,
  mintWash: 'rgba(16,185,129,0.12)',
  mintLine: 'rgba(16,185,129,0.35)',
  sandWash: 'rgba(229,212,192,0.08)',
  clay: C.clay,
  clayWash: 'rgba(232,128,95,0.14)',
  scrim: 'rgba(8,9,11,0.72)',
} as const;

export const space = (n: number) => n * 8;

export const radius = { sm: 8, md: 16, lg: 24, xl: 32, full: 999 } as const;

/** Font family names match the files in assets/fonts (Android embeds them under these names). */
export const fonts = {
  sans: 'ThmanyahSans-Regular',
  sansMedium: 'ThmanyahSans-Medium',
  sansBold: 'ThmanyahSans-Bold',
  serif: 'ThmanyahSerifText-Regular',
  display: 'ThmanyahSerifDisplay-Bold',
  displayBlack: 'ThmanyahSerifDisplay-Black',
} as const;

/** Type scale: every line height on the 8pt grid. */
export const type = {
  caption: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 16 },
  captionBold: { fontFamily: fonts.sansBold, fontSize: 12, lineHeight: 16 },
  small: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 24 },
  smallBold: { fontFamily: fonts.sansBold, fontSize: 14, lineHeight: 24 },
  body: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24 },
  bodyMedium: { fontFamily: fonts.sansMedium, fontSize: 16, lineHeight: 24 },
  bodyBold: { fontFamily: fonts.sansBold, fontSize: 16, lineHeight: 24 },
  lead: { fontFamily: fonts.sans, fontSize: 18, lineHeight: 32 },
  title: { fontFamily: fonts.sansBold, fontSize: 20, lineHeight: 32 },
  reading: { fontFamily: fonts.serif, fontSize: 16, lineHeight: 32 },
  heading: { fontFamily: fonts.display, fontSize: 24, lineHeight: 32 },
  display: { fontFamily: fonts.display, fontSize: 32, lineHeight: 48 },
  hero: { fontFamily: fonts.display, fontSize: 40, lineHeight: 56 },
  figure: { fontFamily: fonts.displayBlack, fontSize: 48, lineHeight: 56 },
} as const;

export type TypeVariant = keyof typeof type;

export const shadow = {
  card: { shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  lift: { shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 24, shadowOffset: { width: 0, height: 16 }, elevation: 12 },
  glow: { shadowColor: C.mint, shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
} as const;

// Motion lives in ./motion.ts (fades and ease-out timings; no springs).
