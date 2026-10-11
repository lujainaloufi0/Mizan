/**
 * Home: today first. What to cook now, where the money stands, and the
 * one-tap way into next week.
 */
import { router } from 'expo-router';
import { CalendarDays, ClipboardCopy, Send, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { BudgetCard } from '@/features/BudgetCard';
import { copyList } from '@/features/export';
import { DeliverySheet } from '@/features/SendToDelivery';
import { RecipeCard } from '@/features/RecipeCard';
import { RepeatBanner } from '@/features/RepeatBanner';
import { DAYS } from '@/lib/data';
import { mealsNoun } from '@/lib/format';
import { slotKey } from '@/lib/planner';
import type { DayId } from '@/lib/types';
import { useCurrentPlan, useMizan } from '@/store/mizan';
import { MizanMark, Wordmark } from '@/ui/brand';
import { feel } from '@/ui/feel';
import { Button, Icon, Ring, Screen, T, Tap } from '@/ui/kit';
import { toast } from '@/ui/overlays';
import { colors, radius, space } from '@/ui/theme';

const JS_DAY: DayId[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export default function Home() {
  const { week, plan, prefs } = useCurrentPlan();
  const hasTemplate = useMizan((s) => !!(s.week ?? s.lastWeek));
  const [now] = useState(() => Date.now());
  const [delivery, setDelivery] = useState(false);
  const hour = new Date(now).getHours();
  const greeting = hour < 12 ? 'صباح الخير' : hour < 17 ? 'يومك سعيد' : 'مساء الخير';

  if (!week || !plan || !prefs) {
    return (
      <Screen contentStyle={{ flexGrow: 1 }}>
        <Wordmark />
        <View style={{ flex: 1, justifyContent: 'center', gap: space(3) }}>
          <MizanMark size={64} />
          <T v="hero">ابدأ أسبوعك</T>
          <T tone="inkSoft">ثلاث خطوات: المتاجر، الأسرة والميزانية، وتأكيد. نجهّز لك الوجبات والمقاضي.</T>
          <Button label="خطة جديدة" icon={Sparkles} variant="mint" onPress={() => router.push('/new-week')} />
          {hasTemplate && <RepeatBanner prominent />}
        </View>
      </Screen>
    );
  }

  // today, or the next day the household cooks
  const todayIdx = new Date().getDay();
  const order = [...JS_DAY.slice(todayIdx), ...JS_DAY.slice(0, todayIdx)];
  const nextDay = order.find((d) => plan.meals.some((m) => m.day === d)) ?? plan.meals[0]?.day;
  const isToday = nextDay === JS_DAY[todayIdx];
  const todays = plan.meals.filter((m) => m.day === nextDay);
  const dayName = DAYS.find((d) => d.id === nextDay)?.name ?? '';

  const cookedCount = plan.meals.filter((m) => week.cooked.includes(slotKey(m.day, m.slot))).length;
  const progress = plan.meals.length ? cookedCount / plan.meals.length : 0;
  const ageDays = (now - new Date(week.createdAt).getTime()) / 86_400_000;
  const weekWrapping = progress >= 0.7 || ageDays >= 6;

  return (
    <Screen>
      {/* header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <T v="small" tone="inkSoft">
            {greeting}
          </T>
          <Wordmark />
        </View>
        <Tap onPress={() => router.navigate('/(tabs)/week')} accessibilityLabel={`طبخت ${cookedCount} من ${plan.meals.length}`} style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Ring value={progress} size={space(7)} stroke={5} />
          <View style={{ position: 'absolute', alignItems: 'center' }}>
            <T v="bodyBold">{cookedCount}</T>
          </View>
        </Tap>
      </View>

      {weekWrapping && (
        <View>
          <RepeatBanner prominent />
        </View>
      )}

      {/* today */}
      <View style={{ gap: space(2) }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View>
            <T v="smallBold" tone="mint300">
              {isToday ? 'اليوم' : 'التالي'} · {dayName}
            </T>
            <T v="display">وش نطبخ؟</T>
          </View>
          <T v="small" tone="inkSoft">
            طبخت {cookedCount} من {plan.meals.length} {mealsNoun(plan.meals.length)}
          </T>
        </View>
        {todays.map((meal) => (
          <RecipeCard key={`${meal.day}-${meal.slot}-${meal.recipe.id}`} meal={meal} plan={plan} prefs={prefs} compact />
        ))}
        <Tap onPress={() => router.navigate('/(tabs)/week')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space(1), height: space(5) }}>
          <Icon as={CalendarDays} size={20} color={colors.sand} />
          <T v="smallBold" tone="sand">
            كل وجبات الأسبوع
          </T>
        </Tap>
      </View>

      <View>
        <BudgetCard plan={plan} />
      </View>

      {/* send the list */}
      <View style={{ flexDirection: 'row', gap: space(1) }}>
        <QuickAction
          icon={ClipboardCopy}
          label="انسخ المقاضي"
          onPress={async () => {
            await copyList(plan, week.checked);
            feel.pop();
            toast({ message: 'نُسخت القائمة مرتّبة حسب الأقسام' });
          }}
        />
        <QuickAction icon={Send} label="أرسل للتوصيل" onPress={() => setDelivery(true)} />
      </View>

      {!weekWrapping && <RepeatBanner prominent={false} />}
      <DeliverySheet open={delivery} onClose={() => setDelivery(false)} plan={plan} checked={week.checked} />
    </Screen>
  );
}

function QuickAction({ icon, label, onPress }: { icon: Parameters<typeof Icon>[0]['as']; label: string; onPress: () => void }) {
  return (
    <Tap
      feedback="none"
      onPress={onPress}
      style={{ flex: 1, height: space(7), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space(1), borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}
    >
      <Icon as={icon} size={20} color={colors.sand} />
      <T v="smallBold">{label}</T>
    </Tap>
  );
}
