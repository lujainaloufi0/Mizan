/**
 * Tactile feedback: haptics first, a whisper of sound second.
 *
 *   feel.tap()      buttons, chips, tabs           light tick
 *   feel.toggle(on) selections and checkboxes      toggle on / off
 *   feel.step()     moving forward in a flow       confirm + rising two-note
 *   feel.success()  تم الطبخ, plan ready            success + three-note chime
 *   feel.pop()      swap, copy, ban                medium impact + pop
 *   feel.warn()     blocked actions                warning
 *
 * Sounds are four tiny bundled WAVs (assets/sounds) played at low volume and
 * mixed with whatever else is playing, so they never pause the user's music.
 * Both channels obey the toggles in ملفي (Profile).
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

type SoundName = 'tick' | 'pop' | 'step' | 'success';

const SOURCES: Record<SoundName, number> = {
  tick: require('../../assets/sounds/tick.wav'),
  pop: require('../../assets/sounds/pop.wav'),
  step: require('../../assets/sounds/step.wav'),
  success: require('../../assets/sounds/success.wav'),
};

const VOLUME: Record<SoundName, number> = { tick: 0.25, pop: 0.35, step: 0.35, success: 0.45 };

const settings = { sound: true, haptics: true };
const players: Partial<Record<SoundName, AudioPlayer>> = {};
let ready = false;

/** Called once from the root layout. Safe to call again. */
export async function initFeel() {
  if (ready) return;
  ready = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' });
  } catch {
    /* audio mode is best effort */
  }
  (Object.keys(SOURCES) as SoundName[]).forEach((name) => {
    try {
      const p = createAudioPlayer(SOURCES[name]);
      p.volume = VOLUME[name];
      players[name] = p;
    } catch {
      /* a missing player just means no sound for that cue */
    }
  });
}

export function setFeelSettings(next: Partial<typeof settings>) {
  Object.assign(settings, next);
}

function play(name: SoundName) {
  if (!settings.sound) return;
  const p = players[name];
  if (!p) return;
  try {
    p.seekTo(0).catch(() => undefined);
    p.play();
  } catch {
    /* never let feedback break an interaction */
  }
}

const android = Platform.OS === 'android';

function haptic(run: () => Promise<void>) {
  if (!settings.haptics || Platform.OS === 'web') return;
  try {
    run().catch(() => undefined);
  } catch {
    /* some devices lack an effect; feedback must never break an interaction */
  }
}

export const feel = {
  tap() {
    haptic(() => (android ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Clock_Tick) : Haptics.selectionAsync()));
    play('tick');
  },
  toggle(on: boolean) {
    haptic(() =>
      android
        ? Haptics.performAndroidHapticsAsync(on ? Haptics.AndroidHaptics.Toggle_On : Haptics.AndroidHaptics.Toggle_Off)
        : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    );
    play('tick');
  },
  step() {
    haptic(() => (android ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)));
    play('step');
  },
  pop() {
    haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    play('pop');
  },
  success() {
    haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    play('success');
  },
  warn() {
    haptic(() => (android ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject) : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)));
  },
};
