/** The week: pick a day, see its meals, cook / swap / ban from the cards. */
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { RecipeCard } from '@/features/RecipeCard';
import { DAYS } from '@/lib/data';
import { CURRENCY, fmtWhole } from '@/lib/format';
import { nutritionFor, slotKey } from '@/lib/planner';
import type { DayId } from '@/lib/types';
import { useCurrentPlan } from '@/store/mizan';
import { feel } from '@/ui/feel';
import { Button, Ring, Screen, T, Tap } from '@/ui/kit';
import { enter } from '@/ui/motion';
import { colors, radius, space } from '@/ui/theme';

export default function Week() {
  const { week, plan, prefs } = useCurrentPlan();
  const days = plan ? DAYS.filter((d) => plan.meals.some((m) => m.day === d.id)) : [];
  const [active, setActive] = useState<DayId | undefined>(days[0]?.id);

  if (!week || !plan || !prefs) {
    return (
      <Screen>
        <T v="hero">لا توجد خطة بعد</T>
        <Button label="خطة جديدة" icon={Plus} variant="mint" onPress={() => router.push('/new-week')} />
      </Screen>
    );
  }

  const day = days.find((d) => d.id === active)?.id ?? days[0]?.id;
  const meals = plan.meals.filter((m) => m.day === day);
  const dayNutrition = nutritionFor(meals, prefs.goal);
  const done = plan.meals.filter((m) => week.cooked.includes(slotKey(m.day, m.slot))).length;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <T v="smallBold" tone="mint300">
            {plan.meals.length} وجبة · {plan.servings} حصة لكل وجبة
          </T>
          <T v="hero">وصفات الأسبوع</T>
        </View>
        <View style={{ alignItems: 'center', gap: space(1) }}>
          <Ring value={plan.meals.length ? done / plan.meals.length : 0} size={space(6)} />
          <T v="caption" tone="inkSoft">
            طبخت {done} من {plan.meals.length}
          </T>
        </View>
      </View>

      {/* day selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space(1) }} style={{ marginHorizontal: -space(2) }}>
        <View style={{ width: space(1) }} />
        {days.map((d) => {
          const on = d.id === day;
          const dayMeals = plan.meals.filter((m) => m.day === d.id);
          const cost = dayMeals.reduce((s, m) => s + m.totalCost, 0);
          return (
            <Tap
              key={d.id}
              feedback="none"
              onPress={() => {
                if (!on) feel.tap();
                setActive(d.id);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={d.name}
              style={{
                minWidth: space(11),
                paddingVertical: space(1),
                paddingHorizontal: space(2),
                borderRadius: radius.md,
                alignItems: 'center',
                gap: space(1),
                backgroundColor: on ? colors.sand : colors.surface,
                borderWidth: 1,
                borderColor: on ? colors.sand : colors.line,
              }}
            >
              <T v="smallBold" style={{ color: on ? colors.canvas : colors.ink }}>
                {d.name}
              </T>
              <T v="caption" style={{ color: on ? 'rgba(18,20,23,0.7)' : colors.inkSoft }}>
                {fmtWhole(cost)} {CURRENCY}
              </T>
              <View style={{ flexDirection: 'row', gap: space(1) }}>
                {dayMeals.map((m) => {
                  const c = week.cooked.includes(slotKey(m.day, m.slot));
                  return <View key={m.slot} style={{ width: space(1), height: space(1), borderRadius: radius.full, backgroundColor: c ? colors.mint : on ? 'rgba(18,20,23,0.3)' : colors.lineStrong }} />;
                })}
              </View>
            </Tap>
          );
        })}
        <View style={{ width: space(1) }} />
      </ScrollView>

      <Animated.View key={day} entering={enter} style={{ gap: space(2) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space(2), paddingHorizontal: space(2), height: space(6), borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
          <T v="caption" tone="inkSoft" style={{ flex: 1 }}>
            لكل شخص بالغ اليوم
          </T>
          <T v="smallBold" tone="mint300">
            {fmtWhole(dayNutrition.protein)}غ بروتين
          </T>
          <T v="smallBold" tone="inkSoft">
            {fmtWhole(dayNutrition.kcal)} سعرة
          </T>
        </View>
        {meals.map((meal) => (
          <RecipeCard key={`${meal.day}-${meal.slot}-${meal.recipe.id}`} meal={meal} plan={plan} prefs={prefs} />
        ))}
      </Animated.View>
    </Screen>
  );
}
