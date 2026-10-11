/** Android smoke test (jest-expo/android). */
import { test, expect } from '@jest/globals';
import { useMizan } from '@/store/mizan';
import { press, text, lastLabel, onboardAndPlan, screen } from './helpers';

test('first run, weekly plan, and every tab render on Android', async () => {
  await onboardAndPlan();
  expect(useMizan.getState().profile.goal).toBe('protein');
  expect(useMizan.getState().week).toBeTruthy();

  await press(lastLabel('الأسبوع'));
  expect(text('وصفات الأسبوع')).toBeTruthy();
  expect(text(/بروتين/)).toBeTruthy();

  await press(lastLabel('المقاضي'));
  await press(text('في مطبخي'));
  await press(text(/للشراء/));

  await press(lastLabel('ملفي'));
  expect(text('محفوظ على جوالك. ما نسألك عنه مرة ثانية عند تخطيط الأسبوع.')).toBeTruthy();
  await press(lastLabel('أصوات خفيفة'));
  await press(lastLabel('اهتزاز'));
  expect(useMizan.getState().profile.sound).toBe(false);
  await press(text(/الهدف:/));
  await press(text('تضخيم'));
  await press(lastLabel('تم'));
  expect(useMizan.getState().profile.goal).toBe('bulk');
  for (const row of ['الحساسية', 'أجهزة المطبخ', 'دائماً عندي', 'ما نحبها']) {
    await press(screen.getAllByText(row)[0]);
    await press(lastLabel('تم'));
  }

  await press(lastLabel('الرئيسية'));
  expect(text('وش نطبخ؟')).toBeTruthy();
});
