/**
 * Budget slider. Drag or tap anywhere on the track; snaps to `step`, gives a
 * haptic tick every `tickEvery` units, and fills from the right (RTL).
 * Positions use absolute left/right, which React Native never mirrors, so the
 * maths stays the same in every layout direction.
 */
import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { feel } from './feel';
import { DUR, ease } from './motion';
import { colors, radius, shadow, space } from './theme';

const THUMB = space(4);
// built once on the JS thread: worklets may capture this object but must not call ease()
const THUMB_TIMING = ease(DUR.fast);

export function Slider({
  value,
  min,
  max,
  step,
  tickEvery,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  tickEvery: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(false);
  const lastTick = useSharedValue(Math.floor(value / tickEvery));

  const frac = (value - min) / (max - min);

  const fromX = (x: number) => {
    if (!width) return;
    const usable = width - THUMB;
    const f = 1 - Math.max(0, Math.min(1, (x - THUMB / 2) / usable)); // RTL: right edge = min
    const raw = min + f * (max - min);
    const next = Math.round(raw / step) * step;
    if (next !== value) {
      const bucket = Math.floor(next / tickEvery);
      if (bucket !== lastTick.get()) {
        lastTick.set(bucket);
        feel.tap();
      }
      onChange(next);
    }
  };

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      scheduleOnRN(setActive, true);
      scheduleOnRN(fromX, e.x);
    })
    .onUpdate((e) => {
      scheduleOnRN(fromX, e.x);
    })
    .onFinalize(() => {
      scheduleOnRN(setActive, false);
    });

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ scale: withTiming(active ? 1.08 : 1, THUMB_TIMING) }] }), [active]);
  const usable = Math.max(0, width - THUMB);
  const thumbRight = frac * usable;

  return (
    <GestureDetector gesture={pan}>
      <View
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        style={{ height: space(6), justifyContent: 'center' }}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: value, text: `${value} ريال` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment') onChange(Math.min(max, value + tickEvery));
          if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(min, value - tickEvery));
        }}
      >
        <View style={{ height: space(1), marginHorizontal: THUMB / 2, borderRadius: radius.full, backgroundColor: colors.line, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${frac * 100}%`, backgroundColor: colors.sand, borderRadius: radius.full }} />
        </View>
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              right: thumbRight,
              width: THUMB,
              height: THUMB,
              borderRadius: radius.full,
              backgroundColor: colors.mint,
              borderWidth: 4,
              borderColor: colors.canvas,
            },
            shadow.glow,
            thumbStyle,
          ]}
        />
      </View>
    </GestureDetector>
  );
}
