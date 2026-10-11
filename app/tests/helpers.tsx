/**
 * Shared helpers for the end-to-end smoke tests in the Android environment (jest-expo/android).
 * Renders the real router from src/app and taps through every main flow,
 * failing on any thrown error or console.error.
 */
import { expect, jest, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
export { screen };
import { useMizan } from '@/store/mizan';

const errors: string[] = [];
const origError = console.error;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = args.map(String).join(' ');
    // act() noise from async store hydration is not an app error
    if (/not wrapped in act|inside a test was not wrapped/.test(msg)) return;
    errors.push(msg);
  };
});
afterAll(() => {
  console.error = origError;
});
beforeEach(async () => {
  jest.useFakeTimers();
  errors.length = 0;
  await AsyncStorage.clear();
  useMizan.getState().resetAll();
});
afterEach(() => {
  jest.useRealTimers();
  expect(errors).toEqual([]);
});

export const tick = async (ms = 400) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};
export const press = async (node: Parameters<typeof fireEvent.press>[0]) => {
  await act(async () => {
    fireEvent.press(node);
  });
  await tick();
};
export const text = (t: string | RegExp) => screen.getAllByText(t)[0];
export const label = (t: string | RegExp) => screen.getAllByLabelText(t)[0];
export const lastLabel = (t: string | RegExp) => screen.getAllByLabelText(t).at(-1)!;

export async function boot() {
  await act(async () => {
    renderRouter('./src/app', { initialUrl: '/' });
  });
  await tick(800);
}

export async function onboardAndPlan() {
  await boot();
  // first run: goal → allergies → kitchen → staples (no dislikes page)
  expect(text('وش هدفك من الأكل؟')).toBeTruthy();
  await press(text('عالي البروتين'));
  for (let i = 0; i < 3; i++) await press(lastLabel('التالي'));
  expect(screen.queryAllByText('أكلات ما تحبونها؟')).toHaveLength(0);
  await press(lastLabel(/تخطّ وابدأ|احفظ وابدأ/));
  await tick(800);
  // weekly plan: kitchens → stores → household & budget → days
  expect(text('وش نطبخ هالأسبوع؟')).toBeTruthy();
  await press(label(/^سعودي،/));
  await press(label(/^شامي،/));
  await press(lastLabel('التالي'));
  expect(text('من وين تتسوّق؟')).toBeTruthy();
  await press(lastLabel('التالي'));
  expect(text('مين بياكل، وكم الميزانية؟')).toBeTruthy();
  await press(label('زيادة البالغون'));
  await press(lastLabel('التالي'));
  expect(text('متى تطبخ؟')).toBeTruthy();
  await press(lastLabel('اصنع خطتي'));
  for (let i = 0; i < 10; i++) await tick(400); // build checklist, one step at a time
  expect(text('أسبوعك جاهز!')).toBeTruthy();
  await press(lastLabel('تمام، يلا'));
  await tick(800);
}

