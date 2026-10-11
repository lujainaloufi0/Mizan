/**
 * Mizan RN kit — the handful of primitives every screen is built from.
 * All spacing comes from `space(n)` (8pt grid); all colour from `colors`.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type PressableProps,
  type ScrollViewProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, { interpolate, useAnimatedProps, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { Check, Minus, Plus } from 'lucide-react-native';
import { CURRENCY, fmtMoney } from '@/lib/format';
import { feel } from './feel';
import { Icon } from './Icon';
import type { LineIcon } from './icon-map';
import { DUR, ease, PRESS_SCALE } from './motion';
import { colors, radius, shadow, space, type, type TypeVariant } from './theme';

/* ───────── Text ───────── */

type Tone = keyof typeof colors;

export function T({
  v = 'body',
  tone = 'ink',
  style,
  center,
  ...rest
}: TextProps & { v?: TypeVariant; tone?: Tone; center?: boolean; style?: StyleProp<TextStyle> }) {
  return <Text {...rest} style={[type[v], { color: colors[tone] }, center && { textAlign: 'center' }, style]} />;
}

/* ───────── Tap: the one pressable ─────────
 * Sinks a hair (0.98) and dims slightly under the finger, settles on release,
 * and fires the matching haptic + sound. `feedback` picks the cue (or 'none'
 * when the caller plays a more specific one itself). */

const APressable = Animated.createAnimatedComponent(Pressable);

export function Tap({
  children,
  onPress,
  style,
  feedback = 'tap',
  pressScale = PRESS_SCALE,
  disabled,
  ...rest
}: Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  feedback?: 'tap' | 'pop' | 'none';
  pressScale?: number;
}) {
  const s = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: 1 - s.value * (1 - pressScale) }], opacity: 1 - s.value * 0.12 }));
  return (
    <APressable
      {...rest}
      disabled={disabled}
      accessibilityRole={rest.accessibilityRole ?? 'button'}
      accessibilityState={{ disabled: !!disabled, ...rest.accessibilityState }}
      onPressIn={(e) => {
        s.set(withTiming(1, ease(DUR.press)));
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.set(withTiming(0, ease(DUR.base)));
        rest.onPressOut?.(e);
      }}
      onPress={(e) => {
        if (feedback === 'tap') feel.tap();
        if (feedback === 'pop') feel.pop();
        onPress?.(e);
      }}
      style={[anim, style, disabled && { opacity: 0.4 }]}
    >
      {children}
    </APressable>
  );
}

/* ───────── Buttons ───────── */

type ButtonVariant = 'primary' | 'mint' | 'ghost' | 'outline';

export function Button({
  label,
  icon,
  trailing,
  variant = 'primary',
  onPress,
  disabled,
  style,
  feedback,
  compact,
}: {
  label: string;
  icon?: LineIcon;
  /** icon after the label, e.g. a forward chevron */
  trailing?: LineIcon;
  variant?: ButtonVariant;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  feedback?: 'tap' | 'pop' | 'none';
  compact?: boolean;
}) {
  const bg = { primary: colors.sand, mint: colors.mint, ghost: 'transparent', outline: 'transparent' }[variant];
  const fg = variant === 'primary' || variant === 'mint' ? colors.canvas : colors.ink;
  return (
    <Tap
      onPress={onPress}
      disabled={disabled}
      feedback={feedback}
      accessibilityLabel={label}
      style={[
        {
          height: compact ? space(5) : space(7),
          paddingHorizontal: compact ? space(2) : space(3),
          borderRadius: radius.full,
          backgroundColor: bg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: space(1),
        },
        variant === 'outline' && { borderWidth: 1, borderColor: colors.lineStrong },
        variant === 'mint' && shadow.glow,
        style,
      ]}
    >
      {icon && <Icon as={icon} size={compact ? 16 : 20} color={fg} />}
      <T v={compact ? 'smallBold' : 'bodyBold'} style={{ color: fg }}>
        {label}
      </T>
      {trailing && <Icon as={trailing} size={compact ? 16 : 20} color={fg} />}
    </Tap>
  );
}

/* ───────── Surfaces ───────── */

export function Card({ children, style, glow }: { children: ReactNode; style?: StyleProp<ViewStyle>; glow?: boolean }) {
  return (
    <View
      style={[
        { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: glow ? colors.mintLine : colors.line, padding: space(3) },
        shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Scrollable screen with safe-area padding and room for the tab bar. */
export function Screen({ children, tabBar = true, contentStyle, ...rest }: ScrollViewProps & { children: ReactNode; tabBar?: boolean; contentStyle?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      {...rest}
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={[
        { paddingTop: insets.top + space(2), paddingBottom: insets.bottom + (tabBar ? space(14) : space(4)), paddingHorizontal: space(2), gap: space(3) },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function SectionTitle({ title, icon, aside }: { title: string; icon?: LineIcon; aside?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space(1) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space(1) }}>
        {icon && <Icon as={icon} size={24} color={colors.sand} />}
        <T v="heading">{title}</T>
      </View>
      {aside}
    </View>
  );
}

/* ───────── Selection ───────── */

export function Chip({
  label,
  on,
  onPress,
  leading,
  tone = 'sand',
}: {
  label: string;
  on: boolean;
  onPress: () => void;
  leading?: ReactNode;
  tone?: 'sand' | 'mint' | 'clay';
}) {
  const fill = { sand: colors.sand, mint: colors.mint, clay: colors.clay }[tone];
  return (
    <Tap
      feedback="none"
      onPress={() => {
        feel.toggle(!on);
        onPress();
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      style={{
        height: space(5),
        paddingStart: leading ? space(1) : space(2),
        paddingEnd: space(2),
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: on ? fill : colors.lineStrong,
        backgroundColor: on ? fill : colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space(1),
      }}
    >
      {leading}
      <T v="smallBold" style={{ color: on ? colors.canvas : colors.ink }}>
        {label}
      </T>
    </Tap>
  );
}

/** Round check. Fills instantly; the tick itself is the feedback (haptic + sound come from the caller). */
export function CheckDot({ on, size = 24, tone = colors.sand }: { on: boolean; size?: number; tone?: string }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: on ? 0 : 1.5,
        borderColor: colors.lineStrong,
        backgroundColor: on ? tone : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {on && <Check size={size * 0.62} color={colors.canvas} strokeWidth={3} />}
    </View>
  );
}

/* ───────── Counter ───────── */

export function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (n: number) => void; label: string }) {
  const change = (d: number) => {
    const next = Math.min(max, Math.max(min, value + d));
    if (next === value) return feel.warn();
    feel.tap();
    onChange(next);
  };
  const btn: ViewStyle = {
    width: space(6),
    height: space(6),
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space(1) }} accessibilityLabel={label}>
      <Tap feedback="none" pressScale={0.94} onPress={() => change(-1)} disabled={value <= min} accessibilityLabel={`إنقاص ${label}`} style={btn}>
        <Minus size={20} color={colors.ink} strokeWidth={1.75} />
      </Tap>
      <View style={{ width: space(6), alignItems: 'center' }}>
        <T v="display" accessibilityLiveRegion="polite" style={{ fontVariant: ['tabular-nums'] }}>
          {value}
        </T>
      </View>
      <Tap feedback="none" pressScale={0.94} onPress={() => change(1)} disabled={value >= max} accessibilityLabel={`زيادة ${label}`} style={btn}>
        <Plus size={20} color={colors.ink} strokeWidth={1.75} />
      </Tap>
    </View>
  );
}

/* ───────── Progress ───────── */

/** Bar that eases to its value. RTL: fills from the start edge. */
export function Bar({ value, tone = colors.mint, height = space(1), track = colors.line }: { value: number; tone?: string; height?: number; track?: string }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withTiming(Math.max(0, Math.min(1, value)), ease(DUR.slow)));
  }, [value, p]);
  const anim = useAnimatedStyle(() => ({ width: `${Math.max(0, p.value) * 100}%` }));
  return (
    <View style={{ height, borderRadius: radius.full, backgroundColor: track, overflow: 'hidden' }}>
      <Animated.View style={[{ height: '100%', borderRadius: radius.full, backgroundColor: tone }, anim]} />
    </View>
  );
}

const ACircle = Animated.createAnimatedComponent(Circle);

export function Ring({ value, size = space(5), stroke = 4, tone = colors.mint }: { value: number; size?: number; stroke?: number; tone?: string }) {
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withTiming(Math.max(0, Math.min(1, value)), ease(DUR.slow)));
  }, [value, p]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: interpolate(p.value, [0, 1], [len, 0]) }));
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.line} strokeWidth={stroke} fill="none" />
      <ACircle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={tone}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${len} ${len}`}
        animatedProps={props}
      />
    </Svg>
  );
}

/* ───────── Money ───────── */

/** Counts to the new value with a short ease-out whenever it changes. */
export function useTween(value: number, duration = 420) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = Date.now();
    const a = from.current;
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      const v = a + (value - a) * eased;
      setShown(v);
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      from.current = value;
    };
  }, [value, duration]);
  return shown;
}

export function Money({ value, v = 'display', tone = 'ink', unitTone = 'inkSoft', animate = true }: { value: number; v?: TypeVariant; tone?: Tone; unitTone?: Tone; animate?: boolean }) {
  const tweened = useTween(value);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space(1) }}>
      <T v={v} tone={tone} style={{ fontVariant: ['tabular-nums'] }}>
        {fmtMoney(animate ? tweened : value)}
      </T>
      <T v="smallBold" tone={unitTone}>
        {CURRENCY}
      </T>
    </View>
  );
}

/* ───────── Tiny check-mark path for celebratory moments ───────── */

export function DrawnCheck({ size = 16, color = colors.mint300 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={color} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export { Icon };
