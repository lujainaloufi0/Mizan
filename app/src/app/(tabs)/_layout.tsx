import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { CalendarDays, House, ShoppingCart, UserRound } from 'lucide-react-native';
import { Easing, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { feel } from '@/ui/feel';
import type { LineIcon } from '@/ui/icon-map';
import { Icon, T, Tap } from '@/ui/kit';
import { colors, radius, shadow, space } from '@/ui/theme';

const TABS: Record<string, { label: string; icon: LineIcon }> = {
  index: { label: 'الرئيسية', icon: House },
  week: { label: 'الأسبوع', icon: CalendarDays },
  list: { label: 'المقاضي', icon: ShoppingCart },
  profile: { label: 'ملفي', icon: UserRound },
};

/**
 * Floating tab bar. Every tab always shows its icon and label (nothing moves,
 * nothing resizes); the active one is simply lit in sand on a soft pill.
 */
function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: insets.bottom + space(1), paddingHorizontal: space(2) }}>
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: space(9),
            paddingHorizontal: space(1),
            borderRadius: radius.full,
            backgroundColor: 'rgba(30,34,40,0.96)',
            borderWidth: 1,
            borderColor: colors.line,
          },
          shadow.lift,
        ]}
      >
        {state.routes.map((route, i) => {
          const tab = TABS[route.name];
          if (!tab) return null;
          const focused = state.index === i;
          return (
            <Tap
              key={route.key}
              feedback="none"
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.label}
              onPress={() => {
                const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !e.defaultPrevented) {
                  feel.tap();
                  navigation.navigate(route.name);
                }
              }}
              style={{ flex: 1, height: space(7), alignItems: 'center', justifyContent: 'center' }}
            >
              <View style={{ width: space(8), height: space(4), borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? colors.sandWash : 'transparent' }}>
                <Icon as={tab.icon} size={24} color={focused ? colors.sand : colors.inkFaint} />
              </View>
              <T v={focused ? 'captionBold' : 'caption'} style={{ color: focused ? colors.sand : colors.inkFaint }}>
                {tab.label}
              </T>
            </Tap>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{
        headerShown: false,
        // a short cross-fade between tabs: no sideways movement
        animation: 'fade',
        transitionSpec: { animation: 'timing', config: { duration: 140, easing: Easing.out(Easing.cubic) } },
        sceneStyle: { backgroundColor: colors.canvas },
      }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="week" />
      <Tabs.Screen name="list" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
