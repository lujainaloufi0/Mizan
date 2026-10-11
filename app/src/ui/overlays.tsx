/**
 * Bottom sheets and toasts.
 *
 * Sheet: rises with an ease-out (no bounce), backdrop fades, closes on backdrop tap, the
 * Android back button, or a downward swipe on the handle area.
 * Toast: one at a time, replaces the previous, optional action (e.g. تراجع).
 */
import { useEffect, useState, type ReactNode } from 'react';
import { BackHandler, Modal, Platform, Pressable, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { feel } from './feel';
import { T, Tap } from './kit';
import { DUR, ease, enter, exit, scrimIn, scrimOut, sheetIn, sheetOut } from './motion';
import { colors, radius, shadow, space } from './theme';

// built once on the JS thread: the pan worklet captures this object (worklets can't call ease())
const DRAG_TIMING = ease(DUR.base);

export function Sheet({
  open,
  onClose,
  title,
  eyebrow,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const drag = useSharedValue(0);

  useEffect(() => {
    if (open) drag.set(0);
  }, [open, drag]);

  const pan = Gesture.Pan()
    .activeOffsetY(8)
    .onUpdate((e) => {
      drag.set(Math.max(0, e.translationY));
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 900) {
        drag.set(withTiming(height, DRAG_TIMING, () => scheduleOnRN(onClose)));
      } else {
        drag.set(withTiming(0, DRAG_TIMING));
      }
    });

  const follow = useAnimatedStyle(() => ({ transform: [{ translateY: drag.value }] }));

  return (
    <Modal visible={open} transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <GestureHandlerRootView style={[{ flex: 1 }, Platform.OS === 'web' && ({ direction: 'rtl' } as object)]}>
        {open && (
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <Animated.View entering={scrimIn} exiting={scrimOut} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: colors.scrim }}>
              <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="إغلاق" />
            </Animated.View>
            <Animated.View
              entering={sheetIn}
              exiting={sheetOut}
              style={[
                {
                  maxHeight: height * 0.88,
                  backgroundColor: colors.surface,
                  borderTopLeftRadius: radius.xl,
                  borderTopRightRadius: radius.xl,
                  borderWidth: 1,
                  borderColor: colors.line,
                  paddingBottom: insets.bottom,
                },
                shadow.lift,
                follow,
              ]}
            >
              <GestureDetector gesture={pan}>
                <View style={{ paddingHorizontal: space(3), paddingTop: space(1), paddingBottom: space(2) }}>
                  <View style={{ alignSelf: 'center', width: space(5), height: 4, borderRadius: 2, backgroundColor: colors.lineStrong, marginBottom: space(2) }} />
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space(2) }}>
                    <View style={{ flex: 1 }}>
                      {!!eyebrow && (
                        <T v="smallBold" tone="mint300">
                          {eyebrow}
                        </T>
                      )}
                      <T v="display">{title}</T>
                      {!!subtitle && (
                        <T v="small" tone="inkSoft">
                          {subtitle}
                        </T>
                      )}
                    </View>
                    <Tap
                      onPress={onClose}
                      accessibilityLabel="إغلاق"
                      style={{ width: space(5), height: space(5), borderRadius: radius.full, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X size={20} color={colors.ink} strokeWidth={1.75} />
                    </Tap>
                  </View>
                </View>
              </GestureDetector>
              <Animated.ScrollView contentContainerStyle={{ paddingHorizontal: space(3), paddingBottom: space(3), gap: space(2) }} showsVerticalScrollIndicator={false}>
                {children}
              </Animated.ScrollView>
              {footer && <View style={{ borderTopWidth: 1, borderColor: colors.line, padding: space(2) }}>{footer}</View>}
            </Animated.View>
          </View>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

/* ───────── Toasts ───────── */

type ToastInput = { message: string; icon?: ReactNode; action?: { label: string; run: () => void }; tone?: 'default' | 'error' };
type Toast = ToastInput & { id: number };

let push: ((t: Toast | null) => void) | null = null;
let seq = 0;

export function toast(t: ToastInput) {
  push?.({ ...t, id: ++seq });
}

export function ToastHost() {
  const [current, setCurrent] = useState<Toast | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    push = setCurrent;
    return () => {
      push = null;
    };
  }, []);

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => setCurrent(null), current.action ? 6000 : 3000);
    return () => clearTimeout(t);
  }, [current]);

  // the back button dismisses a toast before leaving the screen
  useEffect(() => {
    if (!current) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setCurrent(null);
      return true;
    });
    return () => sub.remove();
  }, [current]);

  if (!current) return null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + space(12), alignItems: 'center', paddingHorizontal: space(2) }}>
      <Animated.View
        key={current.id}
        entering={enter}
        exiting={exit}
        accessibilityLiveRegion="polite"
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: space(1),
            maxWidth: 480,
            minHeight: space(6),
            borderRadius: radius.full,
            paddingStart: space(2),
            paddingEnd: current.action ? space(1) : space(2),
            backgroundColor: current.tone === 'error' ? '#3D2219' : colors.raised,
            borderWidth: 1,
            borderColor: current.tone === 'error' ? colors.clay : colors.lineStrong,
          },
          shadow.lift,
        ]}
      >
        {current.icon}
        <T v="small" style={{ flexShrink: 1, paddingVertical: space(1) }}>
          {current.message}
        </T>
        {current.action && (
          <Tap
            feedback="none"
            accessibilityLabel={current.action.label}
            onPress={() => {
              feel.tap();
              current.action?.run();
              setCurrent(null);
            }}
            style={{ height: space(4), paddingHorizontal: space(2), borderRadius: radius.full, backgroundColor: colors.mint, justifyContent: 'center' }}
          >
            <T v="smallBold" tone="canvas">
              {current.action.label}
            </T>
          </Tap>
        )}
      </Animated.View>
    </View>
  );
}
