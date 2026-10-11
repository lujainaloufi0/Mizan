/**
 * المقاضي: what to buy (by aisle, tick as you shop, send to a delivery app)
 * and في مطبخي: what should be in the kitchen right now (bought + leftovers − cooked).
 */
import { router } from 'expo-router';
import { ChevronDown, ClipboardCopy, Plus, Recycle, Store } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { copyList } from '@/features/export';
import { SendListButton } from '@/features/SendToDelivery';
import { AISLES } from '@/lib/data';
import { CURRENCY, fmtMoney, fmtQty } from '@/lib/format';
import type { ListMode } from '@/lib/grocery-text';
import { kitchenInventory } from '@/lib/planner';
import type { GroceryItem } from '@/lib/types';
import { useCurrentPlan, useMizan } from '@/store/mizan';
import { AisleTile, IngredientTile } from '@/ui/brand';
import { feel } from '@/ui/feel';
import { Bar, Button, CheckDot, Icon, Screen, T, Tap } from '@/ui/kit';
import { toast } from '@/ui/overlays';
import { enter, layout } from '@/ui/motion';
import { colors, radius, space } from '@/ui/theme';

export default function List() {
  const { week, plan, prefs } = useCurrentPlan();
  const setChecked = useMizan((s) => s.setChecked);
  const [view, setView] = useState<'buy' | 'kitchen'>('buy');
  const [showCovered, setShowCovered] = useState(false);
  const inventory = useMemo(() => (plan && week ? kitchenInventory(plan, week.cooked, prefs?.stock) : []), [plan, week, prefs]);

  if (!week || !plan) {
    return (
      <Screen>
        <T v="hero">لا توجد قائمة بعد</T>
        <Button label="خطة جديدة" icon={Plus} variant="mint" onPress={() => router.push('/new-week')} />
      </Screen>
    );
  }

  const checked = new Set(week.checked);
  const done = plan.grocery.filter((g) => checked.has(g.ingredient.id)).length;
  const remaining = plan.grocery.filter((g) => !checked.has(g.ingredient.id)).reduce((s, g) => s + g.price, 0);
  const toggle = (id: string) => {
    const on = !checked.has(id);
    feel.toggle(on);
    setChecked(on ? [...week.checked, id] : week.checked.filter((x) => x !== id));
  };
  const copy = async (mode: ListMode) => {
    await copyList(plan, week.checked, mode);
    feel.pop();
    toast({ message: mode === 'aisle' ? 'نُسخت القائمة مرتّبة حسب الأقسام' : 'نُسخت القائمة مقسّمة حسب المتجر' });
  };

  return (
    <Screen>
      <View style={{ gap: space(2) }}>
        <T v="hero">المقاضي</T>
        <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.full, borderWidth: 1, borderColor: colors.line, padding: space(1) }}>
          {(
            [
              ['buy', `للشراء · ${plan.grocery.length - done}`],
              ['kitchen', 'في مطبخي'],
            ] as const
          ).map(([id, label]) => {
            const on = view === id;
            return (
              <Tap
                key={id}
                feedback="none"
                onPress={() => {
                  if (!on) feel.tap();
                  setView(id);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                style={{ flex: 1, height: space(5), borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.sand : 'transparent' }}
              >
                <T v="smallBold" style={{ color: on ? colors.canvas : colors.ink }}>
                  {label}
                </T>
              </Tap>
            );
          })}
        </View>
      </View>

      {view === 'buy' ? (
        <Animated.View key="buy" entering={enter} style={{ gap: space(3) }}>
          {/* progress + export */}
          <View style={{ gap: space(2), padding: space(2), borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <T v="bodyBold">
                {done} من {plan.grocery.length}
              </T>
              <T v="small" tone="inkSoft">
                {done === plan.grocery.length ? 'اكتملت السلة، بالعافية!' : `المتبقي ${fmtMoney(remaining)} ${CURRENCY}`}
              </T>
            </View>
            <Bar value={plan.grocery.length ? done / plan.grocery.length : 0} />
            <SendListButton plan={plan} checked={week.checked} />
            <View style={{ flexDirection: 'row', gap: space(1) }}>
              <Button label="انسخ القائمة" icon={ClipboardCopy} variant="outline" compact feedback="none" style={{ flex: 1 }} onPress={() => copy('aisle')} />
              <Button label="حسب المتجر" icon={Store} variant="outline" compact feedback="none" style={{ flex: 1 }} onPress={() => copy('store')} />
            </View>
            <T v="caption" tone="inkFaint">
              «أرسل» ينسخ القائمة ويفتح نعناع، نينجا، هنقرستيشن، تويو، كيتا، جاهز أو مرسول.
            </T>
          </View>

          {plan.coveredByStock.length > 0 && (
            <View style={{ borderRadius: radius.md, backgroundColor: colors.mintWash, borderWidth: 1, borderColor: colors.mintLine }}>
              <Tap onPress={() => setShowCovered((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: space(1), padding: space(2) }}>
                <Icon as={Recycle} size={20} color={colors.mint300} />
                <T v="smallBold" tone="mint300" style={{ flex: 1 }}>
                  من بواقيك ({plan.coveredByStock.length}) · وفّرت {fmtMoney(plan.stockSaved)} {CURRENCY}
                </T>
                <Icon as={ChevronDown} size={20} color={colors.mint300} />
              </Tap>
              {showCovered && (
                <Animated.View entering={enter} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space(1), paddingHorizontal: space(2), paddingBottom: space(2) }}>
                  {plan.coveredByStock.map((c) => (
                    <View key={c.ingredient.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space(1), paddingEnd: space(2), borderRadius: radius.full, backgroundColor: colors.surface }}>
                      <IngredientTile id={c.ingredient.id} size="sm" style={{ borderRadius: radius.full }} />
                      <T v="small">{c.ingredient.name}</T>
                    </View>
                  ))}
                </Animated.View>
              )}
            </View>
          )}

          {AISLES.map((aisle) => {
            const rows = plan.grocery.filter((g) => g.ingredient.aisle === aisle.id).sort((a, b) => b.price - a.price);
            if (!rows.length) return null;
            return (
              <View key={aisle.id} style={{ gap: space(1) }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space(1) }}>
                  <AisleTile aisle={aisle.id} size="sm" />
                  <T v="smallBold" tone="sand" style={{ flex: 1 }}>
                    {aisle.name}
                  </T>
                  <T v="caption" tone="inkFaint">
                    {rows.length}
                  </T>
                </View>
                {rows.map((g) => (
                  <Row key={g.ingredient.id} item={g} on={checked.has(g.ingredient.id)} onPress={() => toggle(g.ingredient.id)} />
                ))}
              </View>
            );
          })}
        </Animated.View>
      ) : (
        <Animated.View key="kitchen" entering={enter} style={{ gap: space(1) }}>
          <T v="small" tone="inkSoft">
            مشترياتك وبواقيك، ناقص اللي طبخته. يتحدّث مع كل «تم الطبخ».
          </T>
          {inventory.map((r) => {
            const out = r.remaining <= 1e-6;
            const unitWord = r.ingredient.unit === 'pc' ? ' حبة' : '';
            return (
              <Animated.View
                key={r.ingredient.id}
                layout={layout}
                style={{ flexDirection: 'row', alignItems: 'center', gap: space(2), padding: space(1), borderRadius: radius.md, backgroundColor: colors.surface, opacity: out ? 0.55 : 1 }}
              >
                <IngredientTile id={r.ingredient.id} />
                <View style={{ flex: 1, gap: space(1) }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <T v="bodyBold">{r.ingredient.name}</T>
                    {out ? (
                      <T v="captionBold" tone="clay">
                        نفد
                      </T>
                    ) : (
                      <T v="smallBold" tone="inkSoft">
                        {fmtQty(r.remaining, r.ingredient.unit)}
                        {unitWord}
                      </T>
                    )}
                  </View>
                  <Bar value={r.have ? r.remaining / r.have : 0} height={4} />
                  <T v="caption" tone="inkFaint">
                    {r.used > 0 ? `استُخدم ${fmtQty(r.used, r.ingredient.unit)}${unitWord} من ${fmtQty(r.have, r.ingredient.unit)}${unitWord}` : `لم يُستخدم بعد`}
                  </T>
                </View>
              </Animated.View>
            );
          })}
        </Animated.View>
      )}
    </Screen>
  );
}

function Row({ item, on, onPress }: { item: GroceryItem; on: boolean; onPress: () => void }) {
  const ing = item.ingredient;
  const deal = item.price < item.regularPrice - 0.005;
  return (
    <Tap
      feedback="none"
      pressScale={0.98}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={ing.name}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space(2), padding: space(1), borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: on ? colors.mintLine : colors.line }}
    >
      <CheckDot on={on} tone={colors.mint} />
      <IngredientTile id={ing.id} style={{ opacity: on ? 0.4 : 1 }} />
      <View style={{ flex: 1 }}>
        <T v="bodyBold" style={{ color: on ? colors.inkFaint : colors.ink, textDecorationLine: on ? 'line-through' : 'none' }}>
          {ing.name}
        </T>
        <T v="caption" tone="inkSoft">
          {item.packs} × {ing.pack.label}
          {item.fromStock > 0 ? ` · ${fmtQty(item.fromStock, ing.unit)} من بواقيك` : ''}
        </T>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <T v="smallBold" style={{ fontVariant: ['tabular-nums'], color: on ? colors.inkFaint : colors.ink }}>
          {fmtMoney(item.price)}
        </T>
        <T v="caption" style={{ color: deal ? colors.mint300 : colors.inkFaint }}>
          {item.store.name}
        </T>
      </View>
    </Tap>
  );
}
