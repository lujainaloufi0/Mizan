/** Android smoke test (jest-expo/android). */
import { test, expect } from '@jest/globals';
import { useMizan } from '@/store/mizan';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { text, boot } from './helpers';

test('an older saved profile (no goal) loads without crashing', async () => {
  await AsyncStorage.setItem(
    'mizan:v1',
    JSON.stringify({
      state: {
        profile: { setupDone: true, allergies: [], blacklist: [], appliances: ['oven'], staples: ['salt'], sound: true, haptics: true },
        draft: { stores: ['panda'], adults: 2, kids: 0, budget: 400, days: ['sun', 'mon'], mealsPerDay: 2 },
      },
      version: 1,
    }),
  );
  await useMizan.persist.rehydrate();
  expect(useMizan.getState().profile.goal).toBe('balanced');
  await boot();
  expect(text('وش نطبخ هالأسبوع؟')).toBeTruthy();
  // an old saved draft gets the new field
  expect(useMizan.getState().draft.cuisines).toEqual([]);
});
