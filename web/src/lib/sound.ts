/**
 * Tactile audio: microscopic sounds synthesized with the Web Audio API.
 * No files, no network. The context starts on the first user gesture (browsers
 * require that), sounds are quiet (peak gain ≈ 0.06) and a muted state is
 * remembered per device.
 *
 *   sound.tick()     counters, chips, toggles
 *   sound.pop()      swaps, copies, opening trays
 *   sound.step()     moving through the wizard
 *   sound.success()  "تم الطبخ", finishing the wizard
 */

const MUTE_KEY = 'mizan:muted';
let ctx: AudioContext | null = null;
let muted = false;
const listeners = new Set<(m: boolean) => void>();

try {
  muted = typeof window !== 'undefined' && window.localStorage.getItem(MUTE_KEY) === '1';
} catch {
  /* storage blocked: default to sound on */
}

function audio(): AudioContext | null {
  if (muted || typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** One enveloped oscillator: a fast attack and an exponential fall. */
type BlipOptions = { to?: number; dur?: number; gain?: number; type?: OscillatorType; at?: number };

function blip(freq: number, { to, dur = 0.06, gain = 0.05, type = 'sine', at = 0 }: BlipOptions = {}) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + at;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + 0.004);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(amp).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const sound = {
  tick: () => blip(1800, { dur: 0.025, gain: 0.035, type: 'triangle' }),
  pop: () => blip(680, { to: 340, dur: 0.08, gain: 0.05 }),
  step: () => {
    blip(520, { dur: 0.05, gain: 0.04 });
    blip(780, { dur: 0.06, gain: 0.035, at: 0.045 });
  },
  success: () => {
    blip(660, { dur: 0.09, gain: 0.05 });
    blip(880, { dur: 0.09, gain: 0.05, at: 0.07 });
    blip(1320, { dur: 0.16, gain: 0.04, at: 0.14 });
  },
  isMuted: () => muted,
  setMuted(next: boolean) {
    muted = next;
    try {
      window.localStorage.setItem(MUTE_KEY, next ? '1' : '0');
    } catch {
      /* not remembered, still applied for this session */
    }
    listeners.forEach((l) => l(next));
  },
  subscribe(fn: (m: boolean) => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};
