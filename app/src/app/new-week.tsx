/**
 * Weekly plan — four short steps, nothing permanent (the profile is never asked here):
 *   1. Kitchens (cuisines)   2. Supermarkets   3. Household & SAR budget   4. Days & meals (+ optional leftovers)
 * Everything is pre-filled from last time, so a routine week is four taps.
 * Then: a short checklist while the plan builds, and a "your week is ready" summary.
 */
import { router } from 'expo-router';
import { Baby, Check, ChevronLeft, ShoppingCart, Sparkles, Tag, Target, User } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LeftoversList, allLeftovers } from '@/features/LeftoversList';
import { CuisinePicker } from '@/features/profile-pickers';
import { useLeftovers } from '@/features/useLeftovers';
import { TopAction, Wizard } from '@/features/Wizard';
import { CUISINE_BY_ID, DAYS, GOAL_BY_ID, SLOT_LABEL, STORES } from '@/lib/data';
import { CURRENCY, fmtMoney, fmtWhole, mealsNoun, storesNoun } from '@/lib/format';
import { budgetMood, estimateRange, planWeek, servingsFor } from '@/lib/planner';
import type { DayId } from '@/lib/types';
import { toPrefs, useCurrentPlan, useMizan, type WeekDraft } from '@/store/mizan';
import { BalanceScale, MizanMark, RecipeTile, StoreMark } from '@/ui/brand';
import { feel } from '@/ui/feel';
import { Bar, Button, CheckDot, Chip, Icon, Stepper, T, Tap } from '@/ui/kit';
import { enter, exit } from '@/ui/motion';
import { Slider } from '@/ui/Slider';
import { colors, radius, space } from '@/ui/theme';

const BUDGET = { min: 150, max: 3000, step: 10 };

const MOOD = {
  lean: { label: 'ذكي ومقتصد', hint: 'نقدّم الوصفات الأوفر حتى تبقى السلة داخل ميزانيتك.', bg: colors.line, fg: colors.ink },
  balanced: { label: 'أسبوع متوازن', hint: 'تنوّع كامل، والسلة تقريباً بقدر ميزانيتك.', bg: colors.mintWash, fg: colors.mint300 },
  comfortable: { label: 'مريح للميزانية', hint: 'تنوّع كامل ويتبقى معك فائض.', bg: colors.mint, fg: colors.canvas },
} as const;

const storesLabel = (n: number) => (n === 1 ? 'متجر واحد' : n === 2 ? 'متجران' : `${n} ${storesNoun(n)}`);

export default function NewWeek() {
  const profile = useMizan((s) => s.profile);
  const savedDraft = useMizan((s) => s.draft);
  const startWeek = useMizan((s) => s.startWeek);
  const hasWeek = useMizan((s) => !!s.week);
  const leftovers = useLeftovers();

  const [d, setD] = useState<WeekDraft>(savedDraft);
  const [stock, setStock] = useState<Record<string, number>>(() => allLeftovers(leftovers));
  const [useStock, setUseStock] = useState(leftovers.length > 0);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<'form' | 'building' | 'ready'>('form');
  const set = (patch: Partial<WeekDraft>) => setD((x) => ({ ...x, ...patch }));

  const activeStock = useMemo(() => (useStock ? stock : {}), [useStock, stock]);
  const range = useMemo(() => (d.stores.length && d.days.length ? estimateRange(toPrefs(d, profile, activeStock)) : { full: 0, lean: 0 }), [d, profile, activeStock]);
  const stockSaved = useMemo(() => {
    if (!leftovers.length || !d.stores.length || !d.days.length) return 0;
    const base = { ...d, budget: Number.POSITIVE_INFINITY };
    return Math.max(0, planWeek(toPrefs(base, profile, {})).total - planWeek(toPrefs(base, profile, stock)).total);
  }, [d, profile, stock, leftovers.length]);
  const mood = MOOD[budgetMood(d.budget, range.full)];
  const servings = servingsFor(d.adults, d.kids, profile.goal);
  const goal = GOAL_BY_ID[profile.goal ?? 'balanced'];
  const showReady = useCallback(() => setPhase('ready'), []);

  if (phase === 'building') return <Building stores={d.stores.map((id) => STORES.find((s) => s.id === id)?.name ?? '')} onDone={showReady} />;
  if (phase === 'ready') return <Ready />;

  const cuisineLabel = d.cuisines.length === 0 ? 'مزيج من كل المطابخ' : d.cuisines.map((c) => CUISINE_BY_ID[c].name).join('، ');
  const steps = [
    { title: 'وش نطبخ هالأسبوع؟', subtitle: 'اختر مطبخ أو أكثر، أو خلّها مزيج.', valid: true },
    { title: 'من وين تتسوّق؟', subtitle: 'نقارن عروض الأسبوع ونوزّع سلتك على الأوفر.', valid: d.stores.length > 0 },
    { title: 'مين بياكل، وكم الميزانية؟', subtitle: 'نحسب الحصص ونوازن السلة على ميزانيتك.', valid: d.adults > 0 },
    {
      title: 'متى تطبخ؟',
      subtitle: `${cuisineLabel} · ${storesLabel(d.stores.length)} · ${servings} حصة لكل وجبة · ${fmtWhole(d.budget)} ${CURRENCY}`,
      valid: d.days.length > 0,
    },
  ];
  const last = step === steps.length - 1;

  const finish = () => {
    feel.step();
    startWeek(d, activeStock);
    setPhase('building');
  };

  return (
    <Wizard
      stepKey={step}
      progress={(step + 1) / steps.length}
      onBack={step > 0 ? () => setStep(step - 1) : undefined}
      aside={hasWeek ? <TopAction label="إغلاق" onPress={() => router.back()} /> : undefined}
      eyebrow={`أسبوع جديد · ${step + 1} من ${steps.length}`}
      title={steps[step].title}
      subtitle={steps[step].subtitle}
      cta={{
        label: last ? 'اصنع خطتي' : 'التالي',
        icon: last ? Sparkles : undefined,
        variant: last ? 'mint' : 'primary',
        disabled: !steps[step].valid,
        onPress: () => {
          if (last) return finish();
          feel.step();
          setStep(step + 1);
        },
      }}
    >
      {step === 0 && <CuisinePicker value={d.cuisines} onChange={(cuisines) => set({ cuisines })} />}

      {step === 1 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space(1) }}>
          {STORES.map((s) => {
            const on = d.stores.includes(s.id);
            return (
              <Tap
                key={s.id}
                feedback="none"
                onPress={() => {
                  feel.toggle(!on);
                  set({ stores: on ? d.stores.filter((x) => x !== s.id) : [...d.stores, s.id] });
                }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={s.name}
                style={{ width: '48.5%', padding: space(2), gap: space(1), borderRadius: radius.md, borderWidth: 1, borderColor: on ? colors.sand : colors.line, backgroundColor: on ? colors.raised : colors.surface }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <StoreMark id={s.id} />
                  <CheckDot on={on} />
                </View>
                <View>
                  <T v="title">{s.name}</T>
                  <T v="caption" tone="inkFaint">
                    {s.nameEn}
                  </T>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space(1) }}>
                  <Icon as={Tag} size={16} color={colors.mint300} />
                  <T v="caption" tone="mint300" style={{ flex: 1 }}>
                    {s.dealNote}
                  </T>
                </View>
              </Tap>
            );
          })}
        </View>
      )}

      {step === 2 && (
        <>
          {[
            { icon: User, title: 'البالغون', hint: '13 سنة فأكثر', value: d.adults, min: 1, max: 12, key: 'adults' as const },
            { icon: Baby, title: 'الأطفال', hint: 'نصف حصة', value: d.kids, min: 0, max: 10, key: 'kids' as const },
          ].map((row) => (
            <View key={row.key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space(2), borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space(2), flexShrink: 1 }}>
                <View style={{ width: space(5), height: space(5), borderRadius: radius.full, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon as={row.icon} size={20} color={colors.sand} />
                </View>
                <View>
                  <T v="bodyBold">{row.title}</T>
                  <T v="caption" tone="inkSoft">
                    {row.hint}
                  </T>
                </View>
              </View>
              <Stepper label={row.title} value={row.value} min={row.min} max={row.max} onChange={(n) => set({ [row.key]: n })} />
            </View>
          ))}

          {profile.goal !== 'balanced' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space(1) }}>
              <Icon as={Target} size={16} color={colors.sand} />
              <T v="small" tone="inkSoft" style={{ flex: 1 }}>
                هدفك «{goal.name}»{goal.adultPortion > 1 ? ' · حصص البالغين أكبر' : ''} · يتغيّر من ملفي
              </T>
            </View>
          )}

          <View style={{ gap: space(2), padding: space(2), borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}>
            <View style={{ alignItems: 'center', gap: space(1) }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space(1) }}>
                <T v="figure" style={{ fontVariant: ['tabular-nums'] }}>
                  {fmtWhole(d.budget)}
                </T>
                <T v="title" tone="inkSoft">
                  {CURRENCY}
                </T>
              </View>
              <Animated.View key={mood.label} entering={enter} exiting={exit} style={{ paddingHorizontal: space(2), borderRadius: radius.full, backgroundColor: mood.bg }}>
                <T v="smallBold" style={{ color: mood.fg }}>
                  {mood.label}
                </T>
              </Animated.View>
            </View>
            <Slider label="ميزانية الأسبوع" value={d.budget} min={BUDGET.min} max={BUDGET.max} step={BUDGET.step} tickEvery={50} onChange={(budget) => set({ budget })} />
            <View style={{ alignItems: 'center' }}>
              <BalanceScale budget={d.budget} cost={range.full} />
            </View>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <T v="captionBold" tone="mint300">
                  ميزانيتك
                </T>
                <T v="bodyBold">
                  {fmtWhole(d.budget)} {CURRENCY}
                </T>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <T v="captionBold" tone="sand">
                  سلة متوقعة
                </T>
                <T v="bodyBold">
                  {fmtWhole(range.full)} {CURRENCY}
                </T>
              </View>
            </View>
            <T v="small" tone="inkSoft" center>
              {d.budget < range.lean ? `أقل سلة ممكنة تقارب ${fmtWhole(range.lean)} ${CURRENCY}، سنقترب منها قدر الإمكان.` : mood.hint}
            </T>
            <Tap
              onPress={() => set({ budget: Math.min(BUDGET.max, Math.max(BUDGET.min, Math.round(range.full / 50) * 50)) })}
              style={{ alignSelf: 'center', paddingHorizontal: space(2), height: space(4), borderRadius: radius.full, borderWidth: 1, borderColor: colors.lineStrong, justifyContent: 'center' }}
            >
              <T v="smallBold">اضبطها على السلة المتوقعة</T>
            </Tap>
          </View>
        </>
      )}

      {step === 3 && (
        <>
          <View style={{ gap: space(1) }}>
            <T v="title">أيام الطبخ</T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space(1) }}>
              {DAYS.map((day) => (
                <Chip
                  key={day.id}
                  label={day.short}
                  on={d.days.includes(day.id)}
                  onPress={() => set({ days: d.days.includes(day.id) ? d.days.filter((x) => x !== day.id) : ([...d.days, day.id] as DayId[]) })}
                />
              ))}
            </View>
          </View>

          <View style={{ gap: space(1) }}>
            <T v="title">وجبات في اليوم</T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space(1) }}>
              {([1, 2, 3] as const).map((n) => (
                <Chip key={n} label={n === 1 ? 'غداء' : n === 2 ? 'غداء وعشاء' : 'ثلاث وجبات'} on={d.mealsPerDay === n} onPress={() => set({ mealsPerDay: n })} />
              ))}
            </View>
            <T v="small" tone="inkSoft">
              {d.days.length * d.mealsPerDay} {mealsNoun(d.days.length * d.mealsPerDay)} هذا الأسبوع
            </T>
          </View>

          {leftovers.length > 0 && (
            <View style={{ gap: space(2) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space(2) }}>
                <View style={{ flex: 1 }}>
                  <T v="title">بواقي الأسبوع الماضي</T>
                  <T v="caption" tone="inkSoft">
                    نخصمها من القائمة ونقدّم الوصفات اللي تستخدمها.
                  </T>
                </View>
                <Tap onPress={() => setUseStock((v) => !v)} style={{ paddingHorizontal: space(2), height: space(4), borderRadius: radius.full, borderWidth: 1, borderColor: colors.lineStrong, justifyContent: 'center' }}>
                  <T v="smallBold">{useStock ? 'تخطّ الآن' : 'استخدمها'}</T>
                </Tap>
              </View>
              {useStock && <LeftoversList items={leftovers} value={stock} onChange={setStock} saved={stockSaved} />}
            </View>
          )}
        </>
      )}
    </Wizard>
  );
}

/* ───────── Building: a calm checklist, one line at a time ───────── */

function Building({ stores, onDone }: { stores: string[]; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const lines = [`نتصفّح عروض ${stores.slice(0, 2).join(' و')}`, 'نختار وصفاتك', 'نحسب سلّتك', 'نراجع الميزانية', 'نجهّز خطتك'];
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (done >= lines.length) {
      const t = setTimeout(onDone, 260);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      feel.tap();
      setDone((n) => n + 1);
    }, 340);
    return () => clearTimeout(t);
  }, [done, lines.length, onDone]);

  return (
    <Animated.View entering={enter} style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top + space(10), paddingHorizontal: space(3), gap: space(4) }}>
      <View style={{ alignItems: 'center', gap: space(2) }}>
        <MizanMark size={64} />
        <T v="heading" center>
          {lines[Math.min(done, lines.length - 1)]}…
        </T>
      </View>
      <View style={{ gap: space(1) }} accessibilityLiveRegion="polite">
        {lines.map((l, i) => {
          const state = i < done ? 'done' : i === done ? 'now' : 'next';
          return (
            <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: space(2), height: space(6), borderBottomWidth: 1, borderColor: colors.line }}>
              <View
                style={{
                  width: space(3),
                  height: space(3),
                  borderRadius: radius.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: state === 'done' ? colors.mint : 'transparent',
                  borderWidth: state === 'done' ? 0 : 1.5,
                  borderColor: state === 'now' ? colors.sand : colors.lineStrong,
                }}
              >
                {state === 'done' && <Check size={14} color={colors.canvas} strokeWidth={3} />}
              </View>
              <T v="body" tone={state === 'next' ? 'inkFaint' : 'ink'}>
                {l}
              </T>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

/* ───────── Ready: what you're getting, at a glance ───────── */

function Ready() {
  const insets = useSafeAreaInsets();
  const { plan, profile } = useCurrentPlan();
  useEffect(() => {
    feel.success();
  }, []);
  if (!plan) return null;
  const items = plan.grocery.length;
  const goal = GOAL_BY_ID[profile.goal ?? 'balanced'];
  const dayName = (id: DayId) => DAYS.find((x) => x.id === id)?.name ?? '';

  return (
    <Animated.View entering={enter} style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space(3), paddingHorizontal: space(2), paddingBottom: insets.bottom + space(14), gap: space(3) }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: space(1) }}>
          <T v="smallBold" tone="mint300">
            {plan.meals.length} {mealsNoun(plan.meals.length)} · {plan.servings} حصة لكل وجبة
            {profile.goal !== 'balanced' ? ` · ${goal.name}` : ''}
          </T>
          <T v="hero">أسبوعك جاهز!</T>
        </View>

        <View style={{ flexDirection: 'row', gap: space(1) }}>
          <View style={{ flex: 1, padding: space(2), gap: space(1), borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}>
            <T v="caption" tone="inkSoft">
              السلة من {fmtWhole(plan.budget)} {CURRENCY}
            </T>
            <T v="heading" style={{ fontVariant: ['tabular-nums'] }}>
              {fmtMoney(plan.total)}
            </T>
            <Bar value={plan.budget ? plan.total / plan.budget : 0} tone={plan.overBudget ? colors.clay : colors.mint} height={4} />
            <T v="captionBold" tone="mint300">
              وفّرت {fmtMoney(plan.saved + plan.stockSaved)} {CURRENCY}
            </T>
          </View>
          <Tap
            onPress={() => router.replace('/(tabs)/list')}
            accessibilityLabel={`قائمة المقاضي، ${items} صنف`}
            style={{ flex: 1, padding: space(2), gap: space(1), borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, justifyContent: 'space-between' }}
          >
            <View style={{ width: space(5), height: space(5), borderRadius: radius.md, backgroundColor: colors.sandWash, alignItems: 'center', justifyContent: 'center' }}>
              <Icon as={ShoppingCart} size={20} color={colors.sand} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View>
                <T v="bodyBold">المقاضي</T>
                <T v="caption" tone="inkSoft">
                  {items} صنف
                </T>
              </View>
              <Icon as={ChevronLeft} size={20} color={colors.inkFaint} />
            </View>
          </Tap>
        </View>

        <View style={{ borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, overflow: 'hidden' }}>
          {plan.meals.map((m, i) => (
            <View key={`${m.day}-${m.slot}`} style={{ flexDirection: 'row', alignItems: 'center', gap: space(2), padding: space(2), borderTopWidth: i ? 1 : 0, borderColor: colors.line }}>
              <RecipeTile id={m.recipe.id} size="md" />
              <View style={{ flex: 1 }}>
                <T v="captionBold" tone="inkFaint">
                  {dayName(m.day)} · {SLOT_LABEL[m.slot]} · {CUISINE_BY_ID[m.recipe.cuisine].name}
                </T>
                <T v="bodyBold" numberOfLines={1}>
                  {m.recipe.title}
                </T>
                <T v="caption" tone="inkSoft">
                  {fmtMoney(m.costPerServing)} {CURRENCY} · {m.recipe.minutes} د · {m.recipe.macros.kcal} سعرة · {m.recipe.macros.protein}غ بروتين
                </T>
              </View>
            </View>
          ))}
        </View>
        <T v="caption" tone="inkFaint" center>
          تقدر تبدّل أي وجبة من صفحة الأسبوع.
        </T>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space(2), paddingTop: space(2), paddingBottom: insets.bottom + space(2), backgroundColor: 'rgba(18,20,23,0.96)' }}>
        <Button label="تمام، يلا" variant="mint" feedback="none" onPress={() => router.replace('/(tabs)')} />
      </View>
    </Animated.View>
  );
}
