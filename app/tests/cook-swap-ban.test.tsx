/** Android smoke test (jest-expo/android). */
import { test, expect } from '@jest/globals';
import { useMizan } from '@/store/mizan';
import { press, text, label, lastLabel, onboardAndPlan, screen } from './helpers';

test('cook, undo, swap, ban + undo, and the full swap sheet', async () => {
  await onboardAndPlan();
  const week = () => useMizan.getState().week!;

  // cook from Home, then undo from the card
  await press(label(/^تم طبخ /));
  expect(week().cooked.length).toBe(1);
  await press(label(/^تراجع عن طبخ /));
  expect(week().cooked.length).toBe(0);

  // quick swap
  const before = JSON.stringify(week().choices);
  await press(label(/^بدّل /));
  await press(text(/بدائل سريعة/));
  const option = screen.getAllByText(/للحصة/).find((n) => n.props.children && String(n.props.children).includes('د ·'));
  expect(option).toBeTruthy();
  await press(option!);
  expect(JSON.stringify(week().choices)).not.toBe(before);

  // all options sheet
  await press(label(/^بدّل /));
  await press(text(/كل الخيارات/));
  await press(lastLabel('إغلاق'));

  // ban with undo
  await press(label(/^لا تقترح /));
  expect(useMizan.getState().profile.blacklist.length).toBe(1);
  await press(lastLabel('تراجع'));
  expect(useMizan.getState().profile.blacklist.length).toBe(0);
});
