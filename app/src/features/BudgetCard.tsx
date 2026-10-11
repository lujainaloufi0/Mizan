import { PiggyBank, Recycle, Wallet } from 'lucide-react-native';
import { View } from 'react-native';
import { CURRENCY, fmtMoney, fmtWhole, itemsNoun } from '@/lib/format';
import type { WeeklyPlan } from '@/lib/types';
import { MizanMark, StoreMark } from '@/ui/brand';
import { Bar, Icon, Money, T } from '@/ui/kit';
import { colors, radius, shadow, space } from '@/ui/theme';

/** This week's basket against the budget, what the deals saved, and how it splits by store. */
export function BudgetCard({ plan }: { plan: WeeklyPlan }) {
  const used = plan.budget > 0 ? plan.total / plan.budget : 0;
  const left = plan.budget - plan.total;
  return (
    <View style={[{ padding: space(3), gap: space(2), borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, overflow: 'hidden' }, shadow.card]}>
      <View style={{ position: 'absolute', left: -space(3), bottom: -space(4), opacity: 0.06 }}>
        <MizanMark size={160} color={colors.sand} jewel={colors.sand} tilt={Math.max(-10, Math.min(10, (left / Math.max(plan.total, 1)) * 30))} />
      </View>
      <T v="smallBold" tone="mint300">
        سلة هذا الأسبوع
      </T>
      <Money value={plan.total} v="figure" />
      <T v="small" tone="inkSoft">
        من ميزانية {fmtWhole(plan.budget)} {CURRENCY} · {Math.round(used * 100)}%
      </T>
      <Bar value={used} tone={plan.overBudget ? colors.clay : colors.mint} />
      <View style={{ flexDirection: 'row', gap: space(1) }}>
        <Stat icon={PiggyBank} label="وفّرت" value={plan.saved} accent />
        <Stat icon={Wallet} label={left >= 0 ? 'المتبقي' : 'الزيادة'} value={Math.abs(left)} />
      </View>
      {plan.stockSaved > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space(1), alignSelf: 'flex-start', height: space(4), paddingHorizontal: space(2), borderRadius: radius.full, backgroundColor: colors.mintWash }}>
          <Icon as={Recycle} size={16} color={colors.mint300} />
          <T v="smallBold" tone="mint300">
            البواقي وفّرت {fmtMoney(plan.stockSaved)} {CURRENCY}
          </T>
        </View>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space(1) }}>
        {plan.byStore.map(({ store, total, items }) => (
          <View key={store.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space(1), height: space(4), paddingStart: space(0.5), paddingEnd: space(2), borderRadius: radius.full, backgroundColor: colors.raised }}>
            <StoreMark id={store.id} size="sm" />
            <T v="smallBold">{store.name}</T>
            <T v="small" tone="inkSoft">
              {fmtMoney(total)} · {items} {itemsNoun(items)}
            </T>
          </View>
        ))}
      </View>
    </View>
  );
}

function Stat({ icon, label, value, accent }: { icon: Parameters<typeof Icon>[0]['as']; label: string; value: number; accent?: boolean }) {
  return (
    <View style={{ flex: 1, padding: space(2), gap: space(1), borderRadius: radius.md, backgroundColor: accent ? colors.mint : colors.raised }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space(1) }}>
        <Icon as={icon} size={16} color={accent ? colors.canvas : colors.inkSoft} />
        <T v="captionBold" style={{ color: accent ? colors.canvas : colors.inkSoft }}>
          {label}
        </T>
      </View>
      <Money value={value} v="title" tone={accent ? 'canvas' : 'ink'} unitTone={accent ? 'canvas' : 'inkSoft'} />
    </View>
  );
}
