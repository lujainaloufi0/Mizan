/* Native test environment for the Android preset. */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
require('react-native-gesture-handler/jestSetup');
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
require('react-native-reanimated').setUpTests();
jest.mock('expo-audio', () => ({
  createAudioPlayer: () => ({ volume: 1, seekTo: () => Promise.resolve(), play: () => {} }),
  setAudioModeAsync: () => Promise.resolve(),
}));
jest.mock('expo-haptics', () => {
  const ok = () => Promise.resolve();
  return {
    selectionAsync: ok, impactAsync: ok, notificationAsync: ok, performAndroidHapticsAsync: ok,
    ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
    NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
    AndroidHaptics: { Clock_Tick: 'clock-tick', Toggle_On: 'toggle-on', Toggle_Off: 'toggle-off', Confirm: 'confirm', Reject: 'reject' },
  };
});
jest.mock('expo-clipboard', () => ({ setStringAsync: () => Promise.resolve(true) }));
jest.mock('expo-font', () => ({ ...jest.requireActual('expo-font'), useFonts: () => [true, null], isLoaded: () => true, loadAsync: () => Promise.resolve() }));
jest.mock('expo-intent-launcher', () => ({ openApplication: () => {}, getApplicationIconAsync: () => Promise.resolve('') }));
