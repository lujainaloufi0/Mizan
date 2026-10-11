/**
 * The shell every step-by-step flow uses (first-run profile, weekly plan).
 *
 *   [‹]  ━━━━━━━━━━────────  [تخطّ]
 *   eyebrow
 *   One clear question
 *   a short line of why
 *   …content…
 *   [            one big button            ]
 *
 * Steps change with a short cross-fade (no sideways slide) and the page
 * scrolls back to the top, so every question starts in the same place.
 */
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { useEffect, useRef, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bar, Button, Icon, T, Tap } from '@/ui/kit';
import { enter } from '@/ui/motion';
import { colors, radius, space } from '@/ui/theme';

export function Wizard({
  stepKey,
  progress,
  onBack,
  aside,
  eyebrow,
  title,
  subtitle,
  children,
  cta,
}: {
  stepKey: string | number;
  /** 0–1 */
  progress: number;
  onBack?: () => void;
  aside?: ReactNode;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  cta: { label: string; onPress: () => void; disabled?: boolean; variant?: 'primary' | 'mint'; icon?: LucideIcon };
}) {
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [stepKey]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* top bar: back · progress · skip */}
      <View style={{ paddingTop: insets.top + space(1), paddingHorizontal: space(2), paddingBottom: space(1), flexDirection: 'row', alignItems: 'center', gap: space(2) }}>
        <View style={{ width: space(5) }}>
          {onBack && (
            <Tap onPress={onBack} accessibilityLabel="رجوع" style={{ width: space(5), height: space(5), borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' }}>
              <Icon as={ChevronRight} size={24} color={colors.inkSoft} />
            </Tap>
          )}
        </View>
        <View style={{ flex: 1 }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}>
          <Bar value={progress} height={4} />
        </View>
        <View style={{ minWidth: space(5), alignItems: 'flex-end' }}>{aside}</View>
      </View>

      <ScrollView ref={scroll} contentContainerStyle={{ paddingHorizontal: space(2), paddingTop: space(2), paddingBottom: insets.bottom + space(14) }} showsVerticalScrollIndicator={false}>
        <Animated.View key={stepKey} entering={enter} style={{ gap: space(3) }}>
          <View style={{ gap: space(1) }}>
            {!!eyebrow && (
              <T v="smallBold" tone="mint300">
                {eyebrow}
              </T>
            )}
            <T v="hero">{title}</T>
            {!!subtitle && <T tone="inkSoft">{subtitle}</T>}
          </View>
          {children}
        </Animated.View>
      </ScrollView>

      {/* one action */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space(2), paddingTop: space(2), paddingBottom: insets.bottom + space(2), backgroundColor: 'rgba(18,20,23,0.96)' }}>
        <Button label={cta.label} icon={cta.icon} variant={cta.variant ?? 'primary'} feedback="none" disabled={cta.disabled} onPress={cta.onPress} />
      </View>
    </View>
  );
}

/** Small text button for the top-end slot (تخطّ / إغلاق). */
export function TopAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Tap onPress={onPress} accessibilityLabel={label} style={{ height: space(5), paddingHorizontal: space(1), justifyContent: 'center' }}>
      <T v="smallBold" tone="inkSoft">
        {label}
      </T>
    </Tap>
  );
}
