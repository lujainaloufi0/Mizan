/**
 * One-tap repeat: same dishes in the same slots, re-priced with this week's
 * deals. If the kitchen has leftovers, a quick rollover sheet comes first
 * (with "تخطّ" so it's still one more tap at most).
 */
import { router } from 'expo-router';
import { ArrowLeftRight, Repeat2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { CURRENCY, fmtMoney, mealsNoun } from '@/lib/format';
import { planWeek } from '@/lib/planner';
import { planFor, toPrefs, useMizan } from '@/store/mizan';
import { RecipeTile } from '@/ui/brand';
import { feel } from '@/ui/feel';
import { Button, Icon, T } from '@/ui/kit';
import { Sheet, toast } from '@/ui/overlays';
import { colors, radius, shadow, space } from '@/ui/theme';
import { LeftoversList, allLeftovers } from './LeftoversList';
import { useLeftovers, useTemplateWeek } from './useLeftovers';

export function RepeatBanner({ prominent }: { prominent: boolean }) {
  const profile = useMizan((s) => s.profile);
  const startWeek = useMizan((s) => s.startWeek);
  const isCurrent = useMizan((s) => !!s.week);
  const template = useTemplateWeek();
  const leftovers = useLeftovers();
  const [sheet, setSheet] = useState(false);
  const [stock, setStock] = useState<Record<string, number>>({});

  const plan = useMemo(() => (template ? planFor({ profile }, template) : null), [template, profile]);
  const saved = useMemo(() => {
    if (!template || !sheet) return 0;
    const d = { ...template.draft, budget: Number.POSITIVE_INFINITY };
    return Math.max(0, planWeek(toPrefs(d, profile, {}), template.choices).total - planWeek(toPrefs(d, profile, stock), template.choices).total);
  }, [template, profile, stock, sheet]);

  if (!template || !plan) return null;
  const dishes = Array.from(new Set(plan.meals.map((m) => m.recipe.id))).slice(0, 6);

  const repeat = (withStock: Record<string, number>) => {
    // drop dishes banned since; the planner fills those slots fresh
    const choices = Object.fromEntries(Object.entries(template.choices).filter(([, id]) => !profile.blacklist.includes(id)));
    startWeek(template.draft, withStock, choices);
    setSheet(false);
    feel.success();
    toast({ message: 'أسبوعك الجديد جاهز بأسعار هذا الأسبوع', icon: <Icon as={Repeat2} size={20} color={colors.mint300} /> });
    router.navigate('/(tabs)/week');
  };

  return (
    <View
      style={[
        {
          padding: space(3),
          gap: space(2),
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: prominent ? colors.mintLine : colors.line,
          backgroundColor: colors.surface,
        },
        prominent && shadow.glow,
      ]}
    >
      <View style={{ gap: space(1) }}>
        <T v="smallBold" tone="mint300">
          {prominent ? 'أسبوع جديد؟' : 'للأسبوع الجاي'}
        </T>
        <T v="display">{isCurrent ? 'كرّر خطة هذا الأسبوع' : 'كرّر خطة الأسبوع الماضي'}</T>
        <T v="small" tone="inkSoft">
          {plan.meals.length} {mealsNoun(plan.meals.length)} · آخر سلة {fmtMoney(plan.total)} {CURRENCY}
        </T>
      </View>
      <View style={{ flexDirection: 'row', gap: space(1) }}>
        {dishes.map((id) => (
          <RecipeTile key={id} id={id} size="md" />
        ))}
      </View>
      <View style={{ gap: space(1) }}>
        <Button
          label="كرّرها بنقرة"
          icon={Repeat2}
          variant={prominent ? 'mint' : 'primary'}
          feedback="pop"
          onPress={() => {
            if (leftovers.length) {
              setStock(allLeftovers(leftovers));
              setSheet(true);
            } else repeat({});
          }}
        />
        <Button label="خطة مختلفة" icon={ArrowLeftRight} variant="ghost" compact onPress={() => router.push('/new-week')} />
      </View>

      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        eyebrow="جرد بواقي الأسبوع"
        title="وش بقي في مطبخك؟"
        subtitle="علّم اللي لسا موجود، ونخصمه من السلة الجديدة."
        footer={
          <View style={{ flexDirection: 'row', gap: space(1) }}>
            <Button label="كرّر بهذي البواقي" icon={Repeat2} variant="mint" feedback="none" style={{ flex: 1 }} onPress={() => repeat(stock)} />
            <Button label="تخطّ" variant="ghost" feedback="none" onPress={() => repeat({})} />
          </View>
        }
      >
        <LeftoversList items={leftovers} value={stock} onChange={setStock} saved={saved} />
      </Sheet>
    </View>
  );
}
