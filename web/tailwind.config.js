/**
 * Mizan (مِيزان) — Tailwind design tokens · dark edition
 *
 * 8pt grid: every spacing key N maps to N × 8px.
 *   p-1 = 8px · p-2 = 16px · p-3 = 24px · gap-4 = 32px · h-6 = 48px …
 * There are deliberately NO 4px / 12px / 20px steps — if a value isn't on the
 * grid, it isn't in the scale. `px` (1px) exists only for hairlines.
 *
 * Colour is semantic, not a light/dark scale:
 *   canvas  page background          surface  cards
 *   raised  chips, tiles, inputs     line     borders and tracks
 *   ink     text (DEFAULT / soft / faint)
 *   sand    the warm accent: selection, primary actions, labels
 *   mint    money saved, success, cooked, health
 *   clay    warnings, allergies, over budget
 * Change a value here and the whole app follows.
 */

const unit = (n) => `${n * 8}px`;
const steps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96];
const spacing = Object.fromEntries(steps.map((n) => [n, unit(n)]));
spacing.px = '1px';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}', './preview/**/*.{ts,tsx}'],
  theme: {
    spacing,
    borderRadius: {
      none: '0px',
      sm: '8px',
      DEFAULT: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      full: '9999px',
    },
    fontSize: {
      xs: ['12px', { lineHeight: '16px' }],
      sm: ['14px', { lineHeight: '24px' }],
      base: ['16px', { lineHeight: '24px' }],
      lg: ['18px', { lineHeight: '32px' }],
      xl: ['20px', { lineHeight: '32px' }],
      '2xl': ['24px', { lineHeight: '32px' }],
      '3xl': ['32px', { lineHeight: '40px' }],
      '4xl': ['40px', { lineHeight: '48px' }],
      '5xl': ['48px', { lineHeight: '56px' }],
      '6xl': ['64px', { lineHeight: '72px' }],
    },
    fontFamily: {
      sans: ['thmanyahsans', 'system-ui', 'Segoe UI', 'Tahoma', 'sans-serif'],
      serif: ['thmanyahseriftext', 'thmanyahsans', 'serif'],
      display: ['thmanyahserifdisplay', 'thmanyahseriftext', 'serif'],
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      canvas: '#121417',
      surface: '#1E2228',
      raised: '#262B33',
      line: { DEFAULT: '#2A2E39', strong: '#3A3F4B' },
      ink: { DEFAULT: '#F4EFE8', soft: '#B9B3AA', faint: '#7E828C' },
      sand: { DEFAULT: '#E5D4C0', deep: '#CDB89E', dim: '#8F806E' },
      mint: {
        DEFAULT: '#10B981',
        200: '#A7F3D0',
        300: '#6EE7B7',
        400: '#34D399',
        500: '#10B981',
        600: '#059669',
        900: '#0B3B2E',
      },
      clay: { DEFAULT: '#E8805F', 300: '#F2A58E', 500: '#E8805F', 900: '#3D2219' },
    },
    extend: {
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 24px -16px rgba(0,0,0,0.6)',
        lift: '0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 48px -16px rgba(0,0,0,0.7)',
        ring: '0 0 0 1px #2A2E39',
        glow: '0 0 0 1px rgba(16,185,129,0.4), 0 8px 32px -8px rgba(16,185,129,0.35)',
      },
      maxWidth: {
        wizard: '640px',
        app: '1200px',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
