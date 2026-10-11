/** Android smoke test (jest-expo/android). */
import { test, expect } from '@jest/globals';
import { useMizan } from '@/store/mizan';
import { tick, press, text, label, lastLabel, onboardAndPlan, screen } from './helpers';

test('repeat with leftovers rollover, and "different plan"', async () => {
  await onboardAndPlan();
  // cook one meal so there are leftovers, then repeat
  await press(label(/^تم طبخ /));
  await press(lastLabel('كرّرها بنقرة'));
  await tick(600);
  if (screen.queryAllByText('وش بقي في مطبخك؟').length) {
    await press(lastLabel('كرّر بهذي البواقي'));
  }
  await tick(800);
  expect(useMizan.getState().lastWeek).toBeTruthy();

  await press(lastLabel('الرئيسية'));
  await press(lastLabel('خطة مختلفة'));
  await tick(800);
  expect(text('وش نطبخ هالأسبوع؟')).toBeTruthy();
  // the kitchens chosen last time are pre-selected
  expect(useMizan.getState().draft.cuisines).toEqual(['saudi', 'levant']);
  await press(lastLabel('مزيج من كل المطابخ'));
  for (let i = 0; i < 3; i++) await press(lastLabel('التالي'));
  await press(lastLabel('اصنع خطتي'));
  for (let i = 0; i < 10; i++) await tick(400);
  expect(text('أسبوعك جاهز!')).toBeTruthy();
});
