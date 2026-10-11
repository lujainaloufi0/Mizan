/**
 * ملفي: the permanent profile. Set once in onboarding, edited here any time,
 * never asked again in the weekly flow. Edits apply to the current week live.
 */
import { router } from 'expo-router';
import { Ban, ChevronLeft, CookingPot, RotateCcw, ShieldAlert, ShieldCheck, Sparkles, Vibrate, Volume2, Wheat } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AllergyPicker, AppliancePicker, BannedList, GOAL_ICON, GoalPicker, StaplesPicker } from '@/features/profile-pickers';
import { ALLERGENS, GOAL_BY_ID, INGREDIENTS, RECIPES } from '@/lib/data';
import { useMizan, type Profile as ProfileT } from '@/store/mizan';
import { MizanMark } from '@/ui/brand';
import { feel } from '@/ui/feel';
import { EQUIPMENT, type LineIcon } from '@/ui/icon-map';
import { Button, Icon, Screen, T, Tap } from '@/ui/kit';
import { Sheet, toast } from '@/ui/overlays';
import { DUR, ease } from '@/ui/motion';
import { colors, radius, space } from '@/ui/theme';

type Editor = 'goal' | 'allergies' | 'kitchen' | 'staples' | 'dislikes' | null;

const names = (ids: string[], from: { id: string; name: string }[], max = 3) => {
  const list = ids.map((id) => from.find((x) => x.id === id)?.name).filter(Boolean) as string[];
  if (!list.length) return '';
  return list.length > max ? `${list.slice(0, max).join('، ')} +${list.length - max}` : list.join('، ');
};

export default function Profile() {
  const profile = useMizan((s) => s.profile);
  const saveProfile = useMizan((s) => s.saveProfile);
  const resetAll = useMizan((s) => s.resetAll);
  const hasWeek = useMizan((s) => !!s.week);
  const [open, setOpen] = useState<Editor>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const set = <K extends keyof ProfileT>(key: K) => (v: ProfileT[K]) => saveProfile({ [key]: v } as Partial<ProfileT>);
  const appliances = (Object.keys(EQUIPMENT) as (keyof typeof EQUIPMENT)[]).filter((id) => profile.appliances.includes(id));

  const goal = GOAL_BY_ID[profile.goal ?? 'balanced'];
  const rows: { id: Exclude<Editor, null>; icon: LineIcon; title: string; summary: string; count: number }[] = [
    { id: 'goal', icon: GOAL_ICON[goal.id], title: `الهدف: ${goal.name}`, summary: goal.hint, count: 0 },
    { id: 'allergies', icon: ShieldAlert, title: 'الحساسية', summary: names(profile.allergies, ALLERGENS) || 'لا شيء', count: profile.allergies.length },
    { id: 'kitchen', icon: CookingPot, title: 'أجهزة المطبخ', summary: appliances.map((id) => EQUIPMENT[id].name).join('، ') || 'الأساسيات فقط', count: appliances.length },
    { id: 'staples', icon: Wheat, title: 'دائماً عندي', summary: names(profile.staples, INGREDIENTS) || 'لا شيء', count: profile.staples.length },
    { id: 'dislikes', icon: Ban, title: 'ما نحبها', summary: names(profile.blacklist, RECIPES.map((r) => ({ id: r.id, name: r.title })), 2) || 'لا شيء · استبعد أي طبق من بطاقته', count: profile.blacklist.length },
  ];

  return (
    <Screen>
      <View style={{ gap: space(1) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <T v="hero">ملفي</T>
          <MizanMark size={40} />
        </View>
        <T v="small" tone="inkSoft">
          يُضبط مرة وحدة. نطبّقه على كل خطة تلقائياً.
        </T>
      </View>

      <View style={group}>
        {rows.map((r, i) => (
          <Tap
            key={r.id}
            feedback="tap"
            pressScale={0.98}
            onPress={() => setOpen(r.id)}
            accessibilityRole="button"
            accessibilityLabel={`${r.title}: ${r.summary}`}
            style={[rowStyle, i > 0 && divider]}
          >
            <View style={iconWell}>
              <Icon as={r.icon} size={20} color={colors.sand} />
            </View>

            <View style={{ flex: 1 }}>
              <T v="bodyBold">{r.title}</T>
              <T v="caption" tone="inkSoft" numberOfLines={1}>
                {r.summary}
              </T>
            </View>
            {r.count > 0 && (
              <View style={{ minWidth: space(3), height: space(3), paddingHorizontal: space(1), borderRadius: radius.full, backgroundColor: colors.sandWash, alignItems: 'center', justifyContent: 'center' }}>
                <T v="captionBold" tone="sand">
                  {r.count}
                </T>
              </View>
            )}
            <Icon as={ChevronLeft} size={20} color={colors.inkFaint} />
          </Tap>
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space(1), marginTop: -space(1) }}>
        <Icon as={ShieldCheck} size={16} color={colors.mint300} />
        <T v="caption" tone="inkSoft" style={{ flex: 1 }}>
          محفوظ على جوالك. ما نسألك عنه مرة ثانية عند تخطيط الأسبوع.
        </T>
      </View>

      <View style={{ gap: space(1) }}>
        <T v="smallBold" tone="inkSoft">
          الإحساس
        </T>
        <View style={group}>
          <ToggleRow icon={Volume2} title="أصوات خفيفة" hint="نقرات هادئة عند الاختيار والإنجاز" on={profile.sound} onChange={set('sound')} />
          <ToggleRow icon={Vibrate} title="اهتزاز" hint="لمسة خفيفة مع كل تفاعل" on={profile.haptics} onChange={set('haptics')} divided />
        </View>
      </View>

      <View style={{ gap: space(1) }}>
        <Button label={hasWeek ? 'خطة أسبوع جديد' : 'ابدأ أسبوعك'} icon={Sparkles} variant="mint" onPress={() => router.push('/new-week')} />
        <Button label="ابدأ من الصفر" icon={RotateCcw} variant="ghost" onPress={() => setConfirmReset(true)} />
      </View>

      <T v="caption" tone="inkFaint" style={{ textAlign: 'center' }}>
        مِيزان · الأسعار تقديرية بالريال السعودي
      </T>

      {/* editors */}
      <EditorSheet open={open === 'goal'} onClose={() => setOpen(null)} eyebrow="هدفك" title="وش هدفك من الأكل؟" subtitle="يحدد الأطباق اللي تدخل خطتك وحجم الحصص. يطبّق على الأسبوع الحالي مباشرة.">
        <GoalPicker value={profile.goal ?? 'balanced'} onChange={set('goal')} />
      </EditorSheet>
      <EditorSheet open={open === 'allergies'} onClose={() => setOpen(null)} eyebrow="سلامة الأسرة" title="الحساسية" subtitle="نستبعد أي طبق فيه هذي المكوّنات.">
        <AllergyPicker value={profile.allergies} onChange={set('allergies')} />
      </EditorSheet>
      <EditorSheet open={open === 'kitchen'} onClose={() => setOpen(null)} eyebrow="مطبخك" title="أجهزة المطبخ" subtitle="القدر والمقلاة والثلاجة موجودة دائماً. نقترح وصفات تناسب اللي عندك.">
        <AppliancePicker value={profile.appliances} onChange={set('appliances')} />
      </EditorSheet>
      <EditorSheet open={open === 'staples'} onClose={() => setOpen(null)} eyebrow="ما ينقطع" title="دائماً عندي" subtitle="ما نضيفها للمقاضي أبداً.">
        <StaplesPicker value={profile.staples} onChange={set('staples')} />
      </EditorSheet>
      <EditorSheet open={open === 'dislikes'} onClose={() => setOpen(null)} eyebrow="قائمة الاستبعاد" title="ما نحبها" subtitle="الأطباق اللي استبعدتها من بطاقات الوصفات. رجّع أي طبق بضغطة.">
        <BannedList value={profile.blacklist} onChange={set('blacklist')} />
      </EditorSheet>

      <Sheet
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        eyebrow="تأكيد"
        title="نبدأ من الصفر؟"
        subtitle="نمسح الملف والخطة الحالية والأسبوع الماضي. ما نقدر نرجعها."
        footer={
          <View style={{ flexDirection: 'row', gap: space(1) }}>
            <Button
              label="امسح كل شي"
              icon={RotateCcw}
              variant="primary"
              feedback="none"
              style={{ flex: 1, backgroundColor: colors.clay }}
              onPress={() => {
                feel.warn();
                setConfirmReset(false);
                resetAll();
                toast({ message: 'بدأنا من جديد' });
                router.replace('/welcome');
              }}
            />
            <Button label="إلغاء" variant="ghost" onPress={() => setConfirmReset(false)} />
          </View>
        }
      >
        <View />
      </Sheet>
    </Screen>
  );
}

function EditorSheet({ open, onClose, eyebrow, title, subtitle, children }: { open: boolean; onClose: () => void; eyebrow: string; title: string; subtitle: string; children: ReactNode }) {
  return (
    <Sheet open={open} onClose={onClose} eyebrow={eyebrow} title={title} subtitle={subtitle} footer={<Button label="تم" variant="primary" feedback="pop" onPress={onClose} />}>
      {children}
    </Sheet>
  );
}

function ToggleRow({ icon, title, hint, on, onChange, divided }: { icon: LineIcon; title: string; hint: string; on: boolean; onChange: (v: boolean) => void; divided?: boolean }) {
  return (
    <Tap
      feedback="none"
      pressScale={0.98}
      onPress={() => {
        onChange(!on);
        // after the setting flips, so turning sound ON is heard
        setTimeout(() => feel.toggle(!on), 0);
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={title}
      style={[rowStyle, divided && divider]}
    >
      <View style={iconWell}>
        <Icon as={icon} size={20} color={colors.sand} />
      </View>
      <View style={{ flex: 1 }}>
        <T v="bodyBold">{title}</T>
        <T v="caption" tone="inkSoft">
          {hint}
        </T>
      </View>
      <Switch on={on} />
    </Tap>
  );
}

/** RTL-aware switch: the knob sits at the start (right) when off. */
function Switch({ on }: { on: boolean }) {
  const W = space(6);
  const K = space(3);
  const p = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    p.set(withTiming(on ? 1 : 0, ease(DUR.base)));
  }, [on, p]);
  const travel = W - K - space(1); // computed on the JS thread; worklets can't call space()
  const knob = useAnimatedStyle(() => ({
    transform: [{ translateX: -p.value * travel }],
    backgroundColor: interpolateColor(p.value, [0, 1], [colors.ink, colors.canvas]),
  }));
  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(p.value, [0, 1], [colors.lineStrong, colors.mint]) }));
  return (
    <Animated.View style={[{ width: W, height: space(4), borderRadius: radius.full, paddingHorizontal: space(0.5), justifyContent: 'center', alignItems: 'flex-start' }, track]}>
      <Animated.View style={[{ width: K, height: K, borderRadius: radius.full }, knob]} />
    </Animated.View>
  );
}

const group = { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, overflow: 'hidden' } as const;
const rowStyle = { flexDirection: 'row', alignItems: 'center', gap: space(2), paddingHorizontal: space(2), minHeight: space(9) } as const;
const divider = { borderTopWidth: 1, borderTopColor: colors.line } as const;
const iconWell = { width: space(5), height: space(5), borderRadius: radius.md, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' } as const;
