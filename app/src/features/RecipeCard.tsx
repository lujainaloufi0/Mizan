/**
 * The recipe card: everything about one meal in one place.
 * تم الطبخ → deducts ingredients from the kitchen · بدّل → top 3 swaps ranked by
 * what the basket already covers · 🚫 → never suggest again (undo in the toast).
 */
import { ArrowLeftRight, Ban, ChefHat, Globe, Target, ChevronDown, Clock, Lightbulb, PackageCheck, Recycle, ShieldCheck, ShoppingCart, Users } from 'lucide-react-native';
import { memo, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { interpolate, interpolateColor, useAnimatedProps, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { CUISINE_BY_ID, INGREDIENT_BY_ID, SLOT_LABEL } from '@/lib/data';
import { CURRENCY, fmtMoney, fmtQty } from '@/lib/format';
import { slotKey, swapOptions, type SwapOption } from '@/lib/planner';
import type { PlannedMeal, Preferences, WeeklyPlan } from '@/lib/types';
import { useMizan } from '@/store/mizan';
import { IngredientTile, RecipeTile } from '@/ui/brand';
import { feel } from '@/ui/feel';
import { EQUIPMENT, SLOT_ICON } from '@/ui/icon-map';
import { Icon, T, Tap } from '@/ui/kit';
import { Sheet, toast } from '@/ui/overlays';
import { DUR, ease, enter, exit, layout } from '@/ui/motion';
import { colors, radius, space } from '@/ui/theme';

export const RecipeCard = memo(function RecipeCard({ meal, plan, prefs, compact }: { meal: PlannedMeal; plan: WeeklyPlan; prefs: Preferences; compact?: boolean }) {
  const key = slotKey(meal.day, meal.slot);
  const cooked = useMizan((s) => !!s.week?.cooked.includes(key));
  const toggleCooked = useMizan((s) => s.toggleCooked);
  const swap = useMizan((s) => s.swap);
  const ban = useMizan((s) => s.ban);
  const [open, setOpen] = useState(false);
  const [tray, setTray] = useState(false);
  const [all, setAll] = useState(false);
  const { recipe } = meal;

  const options = useMemo(() => (tray || all ? swapOptions(prefs, plan, meal).filter((o) => !o.current) : []), [tray, all, prefs, plan, meal]);
  const quick = options.filter((o) => !o.sameDay).slice(0, 3);

  const pick = (o: SwapOption) => {
    feel.pop();
    const { before, after } = swap(meal, o.recipe.id);
    const diff = after - before;
    setTray(false);
    setAll(false);
    toast({
      message: `${o.recipe.title} بدل ${recipe.title} · ${Math.abs(diff) < 0.01 ? 'السلة بدون تغيير' : `السلة ${diff > 0 ? '+' : '−'}${fmtMoney(Math.abs(diff))} ${CURRENCY}`}`,
      icon: <Icon as={ArrowLeftRight} size={20} color={colors.mint300} />,
    });
  };

  const doBan = () => {
    const undo = ban(meal);
    if (!undo) {
      feel.warn();
      toast({ tone: 'error', message: 'هذه من آخر الوصفات المتاحة لهذه الوجبة.', icon: <Icon as={Ban} size={20} color={colors.clay} /> });
      return;
    }
    feel.pop();
    toast({
      message: `لن نقترح «${recipe.title}» مرة أخرى`,
      icon: <Icon as={Ban} size={20} color={colors.clay} />,
      action: { label: 'تراجع', run: undo },
    });
  };

  const cook = () => {
    const on = toggleCooked(meal);
    if (on) {
      feel.success();
      toast({
        message: `بالعافية! خصمنا مقادير «${recipe.title}» من مطبخك`,
        icon: <Icon as={ChefHat} size={20} color={colors.mint300} />,
        action: { label: 'تراجع', run: () => toggleCooked(meal) },
      });
    } else feel.tap();
  };

  const m = recipe.macros;
  const showGoal = !!prefs.goal && prefs.goal !== 'balanced';

  return (
    <Animated.View
      layout={layout}
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: cooked ? colors.mintLine : colors.line,
        overflow: 'hidden',
      }}
    >
      <View style={{ padding: space(2), gap: space(2), opacity: cooked ? 0.6 : 1 }}>
        {/* meta row */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space(1) }}>
          <Pill icon={SLOT_ICON[meal.slot]} label={SLOT_LABEL[meal.slot]} strong />
          <Pill icon={Clock} label={`${recipe.minutes} دقيقة`} />
          <Pill icon={Users} label={`${meal.servings} حصة`} />
          <Pill icon={Globe} label={CUISINE_BY_ID[recipe.cuisine].name} />
        </View>

        {/* title + cost */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space(2) }}>
          <RecipeTile id={recipe.id} />
          <T v="heading" style={{ flex: 1 }}>
            {recipe.title}
          </T>
          <View style={{ alignItems: 'flex-end' }}>
            <T v="heading" tone="mint300" style={{ fontVariant: ['tabular-nums'] }}>
              {fmtMoney(meal.costPerServing)}
            </T>
            <T v="caption" tone="inkSoft">
              {CURRENCY} للحصة
            </T>
          </View>
        </View>

        {!compact && (
          <View style={{ flexDirection: 'row', gap: space(1) }}>
            <Macro value={`${m.kcal}`} label="سعرة" />
            <Macro value={`${m.protein}غ`} label="بروتين" dot={colors.mint} />
            <Macro value={`${m.carbs}غ`} label="كربوهيدرات" dot={colors.sandDim} />
            <Macro value={`${m.fat}غ`} label="دهون" dot={colors.inkFaint} />
          </View>
        )}

        {meal.usesStock.length > 0 && !cooked && (
          <Note icon={Recycle} tone={colors.mint300} text={`يستخدم بواقيك: ${meal.usesStock.slice(0, 3).join('، ')}${meal.usesStock.length > 3 ? ` و${meal.usesStock.length - 3} غيرها` : ''}`} />
        )}
        {meal.removed.length > 0 && <Note icon={ShieldCheck} tone={colors.mint300} text={`بدون ${meal.removed.join('، ')} لأجل الحساسية`} />}
      </View>

      <View style={{ paddingHorizontal: space(2), paddingBottom: space(2) }}>
        <CookButton cooked={cooked} onPress={cook} title={recipe.title} />
      </View>

      {/* actions */}
      <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: colors.line }}>
        <Tap
          onPress={() => setOpen((v) => !v)}
          accessibilityState={{ expanded: open }}
          style={{ flex: 1, height: space(6), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space(2) }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space(1) }}>
            <Icon as={ChefHat} size={20} color={colors.sand} />
            <T v="smallBold">{open ? 'إخفاء الطريقة' : 'طريقة التحضير'}</T>
          </View>
          <Rotator on={open}>
            <Icon as={ChevronDown} size={20} color={colors.inkSoft} />
          </Rotator>
        </Tap>
        <Tap
          feedback="pop"
          disabled={cooked}
          onPress={() => setTray((v) => !v)}
          accessibilityLabel={`بدّل ${recipe.title}`}
          style={{ height: space(6), flexDirection: 'row', alignItems: 'center', gap: space(1), paddingHorizontal: space(2), borderStartWidth: 1, borderColor: colors.line, backgroundColor: tray ? colors.mintWash : 'transparent' }}
        >
          <Icon as={ArrowLeftRight} size={20} color={colors.mint300} />
          <T v="smallBold" tone="mint300">
            بدّل
          </T>
        </Tap>
        <Tap
          feedback="none"
          disabled={cooked}
          onPress={doBan}
          accessibilityLabel={`لا تقترح ${recipe.title} مجدداً`}
          style={{ width: space(6), height: space(6), alignItems: 'center', justifyContent: 'center', borderStartWidth: 1, borderColor: colors.line }}
        >
          <Icon as={Ban} size={20} color={colors.inkFaint} />
        </Tap>
      </View>

      {/* quick swap tray */}
      {tray && !cooked && (
        <Animated.View entering={enter} exiting={exit} style={{ padding: space(1), gap: space(1), backgroundColor: 'rgba(16,185,129,0.05)', borderTopWidth: 1, borderColor: colors.line }}>
          <T v="captionBold" tone="mint300" style={{ paddingHorizontal: space(1) }}>
            بدائل سريعة · مرتّبة حسب المتوفر في سلتك
          </T>
          {quick.map((o) => (
            <OptionRow key={o.recipe.id} option={o} showGoal={showGoal} onPress={() => pick(o)} />
          ))}
          {options.length > 3 && (
            <Tap onPress={() => setAll(true)} style={{ alignSelf: 'flex-start', paddingHorizontal: space(1), paddingVertical: space(1) }}>
              <T v="smallBold" tone="inkSoft" style={{ textDecorationLine: 'underline' }}>
                كل الخيارات ({options.length})
              </T>
            </Tap>
          )}
        </Animated.View>
      )}

      {/* method */}
      {open && (
        <Animated.View entering={enter} style={{ padding: space(2), gap: space(2), backgroundColor: colors.raised, borderTopWidth: 1, borderColor: colors.line }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space(1) }}>
            {recipe.equipment.map((id) => (
              <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: space(1), height: space(4), paddingHorizontal: space(2), borderRadius: radius.full, borderWidth: 1, borderColor: colors.lineStrong }}>
                <Icon as={EQUIPMENT[id].icon} size={16} color={colors.sand} />
                <T v="caption">{EQUIPMENT[id].name}</T>
              </View>
            ))}
          </View>
          <View>
            <T v="captionBold" tone="sand">
              المقادير لـ {meal.servings} حصة
            </T>
            {recipe.ingredients.map((ri) => {
              const ing = INGREDIENT_BY_ID[ri.id];
              const q = ri.qty * meal.servings;
              return (
                <View key={ri.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space(1), paddingVertical: space(1), borderBottomWidth: 1, borderColor: colors.line }}>
                  <IngredientTile id={ri.id} size="sm" />
                  <T v="small" style={{ flex: 1 }}>
                    {ing.name}
                  </T>
                  <T v="small" tone="inkSoft">
                    {ing.unit === 'pc' ? `× ${fmtQty(q, 'pc')}` : fmtQty(q, ing.unit)}
                  </T>
                </View>
              );
            })}
          </View>
          {recipe.steps.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: space(2) }}>
              <View style={{ width: space(3), height: space(3), borderRadius: radius.full, backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center' }}>
                <T v="captionBold" tone="canvas">
                  {i + 1}
                </T>
              </View>
              <T v="reading" style={{ flex: 1 }}>
                {s}
              </T>
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: space(1), padding: space(2), borderRadius: radius.md, backgroundColor: colors.mintWash, borderWidth: 1, borderColor: colors.mintLine }}>
            <Icon as={Lightbulb} size={20} color={colors.mint300} />
            <View style={{ flex: 1 }}>
              <T v="captionBold" tone="mint300">
                نصيحة المدرّب
              </T>
              <T v="reading">{recipe.coachTip}</T>
            </View>
          </View>
        </Animated.View>
      )}

      <Sheet open={all} onClose={() => setAll(false)} eyebrow={`${SLOT_LABEL[meal.slot]}`} title="اختر وجبتك" subtitle="مطابخك أولاً، ثم الأوفر حسب المتوفر في سلتك.">
        {options.map((o) => (
          <OptionRow key={o.recipe.id} option={o} showGoal={showGoal} onPress={() => pick(o)} />
        ))}
      </Sheet>
    </Animated.View>
  );
});

/* ───────── pieces ───────── */

function Pill({ icon, label, strong }: { icon: Parameters<typeof Icon>[0]['as']; label: string; strong?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space(1),
        height: space(3),
        paddingHorizontal: space(1),
        borderRadius: radius.full,
        backgroundColor: strong ? colors.sand : colors.raised,
      }}
    >
      <Icon as={icon} size={16} color={strong ? colors.canvas : colors.inkSoft} />
      <T v="captionBold" style={{ color: strong ? colors.canvas : colors.inkSoft }}>
        {label}
      </T>
    </View>
  );
}

function Macro({ value, label, dot }: { value: string; label: string; dot?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: space(1), borderRadius: radius.sm, backgroundColor: colors.raised }}>
      <T v="bodyBold">{value}</T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space(1) }}>
        {dot && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dot }} />}
        <T v="caption" tone="inkSoft">
          {label}
        </T>
      </View>
    </View>
  );
}

function Note({ icon, text, tone }: { icon: Parameters<typeof Icon>[0]['as']; text: string; tone: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space(1) }}>
      <Icon as={icon} size={16} color={tone} />
      <T v="caption" style={{ color: tone, flex: 1 }}>
        {text}
      </T>
    </View>
  );
}

function Rotator({ on, children }: { on: boolean; children: React.ReactNode }) {
  const r = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    r.set(withTiming(on ? 1 : 0, ease(DUR.base)));
  }, [on, r]);
  const s = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value * 180}deg` }] }));
  return <Animated.View style={s}>{children}</Animated.View>;
}

export function OptionRow({ option: o, onPress, showGoal }: { option: SwapOption; onPress: () => void; showGoal?: boolean }) {
  const covered = o.needs.length === 0;
  return (
    <Tap
      feedback="none"
      onPress={onPress}
      accessibilityLabel={o.recipe.title}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space(2), padding: space(1), borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}
    >
      <RecipeTile id={o.recipe.id} size="md" tone={covered ? colors.mint300 : colors.sand} />
      <View style={{ flex: 1 }}>
        <T v="bodyBold" numberOfLines={1}>
          {o.recipe.title}
        </T>
        <T v="caption" tone="inkSoft">
          {o.recipe.minutes} د · {fmtMoney(o.costPerServing)} {CURRENCY} للحصة
        </T>
        {showGoal && o.goalFit && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space(1) }}>
            <Icon as={Target} size={12} color={colors.sand} />
            <T v="captionBold" tone="sand">
              يناسب هدفك · {o.recipe.macros.protein}غ بروتين
            </T>
          </View>
        )}
        {!covered && (
          <T v="caption" tone="clay" numberOfLines={1}>
            يحتاج شراء: {o.needs.join('، ')}
          </T>
        )}
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space(1),
          height: space(3),
          paddingHorizontal: space(1),
          borderRadius: radius.full,
          backgroundColor: covered ? colors.mintWash : colors.clayWash,
        }}
      >
        <Icon as={covered ? PackageCheck : ShoppingCart} size={16} color={covered ? colors.mint300 : colors.clay} />
        <T v="captionBold" style={{ color: covered ? colors.mint300 : colors.clay }}>
          {covered ? 'من سلتك' : `+${fmtMoney(o.extra)}`}
        </T>
      </View>
    </Tap>
  );
}

/* ───────── تم الطبخ ─────────
 * One calm state change: the button eases to mint and the check draws
 * itself. The haptic and the toast carry the celebration. Tap again to undo. */

const APath = Animated.createAnimatedComponent(Path);

function CookButton({ cooked, onPress, title }: { cooked: boolean; onPress: () => void; title: string }) {
  const p = useSharedValue(cooked ? 1 : 0);

  useEffect(() => {
    p.set(withTiming(cooked ? 1 : 0, ease(DUR.slow)));
  }, [cooked, p]);

  const fill = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(p.value, [0, 1], ['rgba(0,0,0,0)', colors.mint]),
    borderColor: interpolateColor(p.value, [0, 1], [colors.lineStrong, colors.mint]),
  }));
  const circle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(p.value, [0, 1], ['rgba(0,0,0,0)', colors.canvas]),
    borderColor: interpolateColor(p.value, [0, 1], [colors.sandDim, colors.canvas]),
  }));
  const check = useAnimatedProps(() => ({ strokeDashoffset: interpolate(p.value, [0, 1], [24, 0]) }));

  return (
    <Tap feedback="none" onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: cooked }} accessibilityLabel={cooked ? `تراجع عن طبخ ${title}` : `تم طبخ ${title}`}>
      <Animated.View style={[{ height: space(6), borderRadius: radius.full, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space(1) }, fill]}>
        <Animated.View style={[{ width: space(3), height: space(3), borderRadius: radius.full, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' }, circle]}>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <APath d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={colors.mint300} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24" animatedProps={check} />
          </Svg>
        </Animated.View>
        <T v="bodyBold" style={{ color: cooked ? colors.canvas : colors.ink }}>
          {cooked ? 'طبختها' : 'تم الطبخ'}
        </T>
      </Animated.View>
    </Tap>
  );
}
