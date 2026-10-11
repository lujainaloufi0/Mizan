/** Android smoke test (jest-expo/android). */
import { expect, jest, test } from '@jest/globals';
import { useMizan } from '@/store/mizan';
import { press, label, lastLabel, onboardAndPlan, screen, text } from './helpers';

const opened: string[] = [];
jest.mock('expo-intent-launcher', () => ({
  openApplication: (pkg: string) => {
    opened.push(pkg);
  },
  getApplicationIconAsync: () => Promise.resolve(''),
}));

test('shopping list: tick, export buttons, kitchen view', async () => {
  await onboardAndPlan();
  await press(lastLabel('المقاضي'));
  const first = screen.getAllByRole('checkbox')[0];
  await press(first);
  expect(useMizan.getState().week!.checked.length).toBe(1);
  await press(lastLabel('انسخ القائمة'));
  await press(lastLabel('حسب المتجر'));
  // send to a delivery app: list copied, app opened by its Android package
  await press(lastLabel('أرسل للتوصيل'));
  expect(text('وين تطلب؟')).toBeTruthy();
  for (const app of ['نعناع', 'نينجا', 'هنقرستيشن', 'تويو', 'كيتا', 'جاهز', 'مرسول']) expect(label(`أرسل إلى ${app}`)).toBeTruthy();
  await press(label('أرسل إلى نعناع'));
  expect(opened).toEqual(['com.exa.nanamarket']);
  expect(text(/الصقها في بحث نعناع/)).toBeTruthy();
});
