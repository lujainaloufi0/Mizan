/** Android smoke test (jest-expo/android). */
import { test, expect } from '@jest/globals';
import { useMizan } from '@/store/mizan';
import { tick, press, text, lastLabel, onboardAndPlan } from './helpers';

test('reset from ملفي goes back to first run', async () => {
  await onboardAndPlan();
  await press(lastLabel('ملفي'));
  await press(lastLabel('ابدأ من الصفر'));
  await press(lastLabel('امسح كل شي'));
  await tick(800);
  expect(useMizan.getState().profile.setupDone).toBe(false);
  expect(text('وش هدفك من الأكل؟')).toBeTruthy();
});
