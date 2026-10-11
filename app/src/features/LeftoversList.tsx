/**
 * "جرد بواقي الأسبوع" — tick what's still in the kitchen. Shared by the weekly
 * setup's confirm step and the repeat sheet on Home.
 */
import { Recycle } from 'lucide-react-native';
import { View } from 'react-native';
import { fmtQty, itemsNoun } from '@/lib/format';
import type { Leftover } from '@/lib/planner';
import { IngredientTile } from '@/ui/brand';
import { feel } from '@/ui/feel';
import { CheckDot, Icon, Money, T, Tap } from '@/ui/kit';
import { colors, radius, space } from '@/ui/theme';

export const allLeftovers = (items: Leftover[]) => Object.fromEntries(items.map((l) => [l.ingredient.id, l.qty]));

export function LeftoversList({
  items,
  value,
  onChange,
  saved,
}: {
  items: Leftover[];
  value: Record<string, number>;
  onChange: (v: Record<string, number>) => void;
  saved: number;
}) {
  const picked = Object.keys(value).length;
  const toggle = (l: Leftover) => {
    const next = { ...value };
    const on = next[l.ingredient.id] === undefined;
    if (on) next[l.ingredient.id] = l.qty;
    else delete next[l.ingredient.id];
    feel.toggle(on);
    onChange(next);
  };

  return (
    <View style={{ gap: space(2) }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space(2),
          padding: space(2),
          borderRadius: radius.md,
          backgroundColor: colors.mintWash,
          borderWidth: 1,
          borderColor: colors.mintLine,
        }}
      >
        <View style={{ width: space(5), height: space(5), borderRadius: radius.full, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon as={Recycle} size={24} color={colors.canvas} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="small" tone="inkSoft">
            توفّر من البواقي
          </T>
          <Money value={saved} v="display" tone="mint300" />
        </View>
        <View style={{ alignItems: 'center' }}>
          <T v="bodyBold">
            {picked} من {items.length}
          </T>
          <T v="caption" tone="inkSoft">
            {itemsNoun(items.length)}
          </T>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: space(1) }}>
        {[
          ['كله موجود', () => onChange(allLeftovers(items))],
          ['ما بقي شي', () => onChange({})],
        ].map(([label, run]) => (
          <Tap
            key={label as string}
            onPress={run as () => void}
            style={{ height: space(4), paddingHorizontal: space(2), borderRadius: radius.full, borderWidth: 1, borderColor: colors.lineStrong, justifyContent: 'center' }}
          >
            <T v="smallBold">{label as string}</T>
          </Tap>
        ))}
      </View>

      {(['long', 'medium'] as const).map((keeps) => {
        const rows = items.filter((l) => l.keeps === keeps);
        if (!rows.length) return null;
        return (
          <View key={keeps} style={{ gap: space(1) }}>
            <T v="smallBold" tone="sand">
              {keeps === 'long' ? 'تدوم طويلاً' : 'استخدمها قريباً'}
            </T>
            {rows.map((l, i) => {
              const on = value[l.ingredient.id] !== undefined;
              return (
                <View key={l.ingredient.id}>
                  <Tap
                    feedback="none"
                    onPress={() => toggle(l)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={l.ingredient.name}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: space(2),
                      padding: space(1),
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: on ? colors.mintLine : colors.line,
                      backgroundColor: on ? colors.mintWash : colors.surface,
                      opacity: on ? 1 : 0.7,
                    }}
                  >
                    <IngredientTile id={l.ingredient.id} />
                    <View style={{ flex: 1 }}>
                      <T v="bodyBold">{l.ingredient.name}</T>
                      <T v="caption" tone="inkSoft">
                        تقريباً {fmtQty(l.qty, l.ingredient.unit)}
                        {l.ingredient.unit === 'pc' ? ' حبة' : ''}
                      </T>
                    </View>
                    <CheckDot on={on} tone={colors.mint} />
                  </Tap>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}
