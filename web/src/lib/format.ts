import type { Unit } from './types';

const money = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const oneDp = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

export const CURRENCY = 'ر.س';

/** 642.5 → "642.50" (pair with the ر.س suffix in UI). */
export const fmtMoney = (n: number) => money.format(n);
export const fmtWhole = (n: number) => whole.format(n);
export const fmtSAR = (n: number) => `${money.format(n)} ${CURRENCY}`;

/** Human quantity: 1600 g → "1.6 كجم", 450 ml → "450 مل", 2.5 pc → "2.5 حبة". */
export function fmtQty(qty: number, unit: Unit) {
  if (unit === 'g') return qty >= 1000 ? `${oneDp.format(qty / 1000)} كجم` : `${whole.format(qty)} غ`;
  if (unit === 'ml') return qty >= 1000 ? `${oneDp.format(qty / 1000)} لتر` : `${whole.format(qty)} مل`;
  return `${oneDp.format(qty)}`;
}

/** Arabic count noun for meals: 1 وجبة, 2 وجبتان, 3–10 وجبات, 11+ وجبة. */
export function mealsNoun(n: number) {
  if (n === 1) return 'وجبة';
  if (n === 2) return 'وجبتان';
  if (n >= 3 && n <= 10) return 'وجبات';
  return 'وجبة';
}

export function storesNoun(n: number) {
  if (n === 1) return 'متجر';
  if (n === 2) return 'متجران';
  if (n >= 3 && n <= 10) return 'متاجر';
  return 'متجراً';
}

export function itemsNoun(n: number) {
  if (n === 1) return 'صنف';
  if (n === 2) return 'صنفان';
  if (n >= 3 && n <= 10) return 'أصناف';
  return 'صنفاً';
}

export function daysNoun(n: number) {
  if (n === 1) return 'يوم';
  if (n === 2) return 'يومان';
  if (n >= 3 && n <= 10) return 'أيام';
  return 'يوماً';
}

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}
