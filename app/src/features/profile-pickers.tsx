/**
 * The permanent-profile pickers. Used once in onboarding (welcome.tsx) and
 * again in ملفي (Profile tab) — the household never sees them in the weekly flow.
 */
import { View } from 'react-native';
import { Ban, BicepsFlexed, Dumbbell, Flame, Globe, Salad } from 'lucide-react-native';
import { ALLERGENS, CUISINES, CUISINE_BY_ID, GOALS, INGREDIENTS, PANTRY_SECTIONS, RECIPES } from '@/lib/data';
import type { AllergenId, CuisineId, EquipmentId, GoalId } from '@/lib/types';
import { IngredientTile, RecipeTile } from '@/ui/brand';
import { feel } from '@/ui/feel';
import { ALLERGEN_ICON, EQUIPMENT, type LineIcon } from '@/ui/icon-map';
import { CheckDot, Chip, Icon, T, Tap } from '@/ui/kit';
import { colors, radius, space } from '@/ui/theme';

const toggle = <X,>(list: X[], x: X) => (list.includes(x) ? list.filter((v) => v !== x) : [...list, x]);

/* ───────── Goal ───────── */

export const GOAL_ICON: Record<GoalId, LineIcon> = { balanced: Salad, protein: Dumbbell, cut: Flame, bulk: BicepsFlexed };

export function GoalPicker({ value, onChange }: { value: GoalId; onChange: (v: GoalId) => void }) {
  return (
    <View style={{ gap: space(1) }} accessibilityRole="radiogroup">
      {GOALS.map((g) => {
        const on = value === g.id;
        return (
          <Tap
            key={g.id}
            feedback="none"
            onPress={() => {
              if (!on) feel.toggle(true);
              onChange(g.id);
            }}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={`${g.name}: ${g.hint}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space(2),
              padding: space(2),
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: on ? colors.sand : colors.line,
              backgroundColor: on ? colors.raised : colors.surface,
            }}
          >
            <View style={{ width: space(5), height: space(5), borderRadius: radius.sm, backgroundColor: on ? colors.sandWash : colors.raised, alignItems: 'center', justifyContent: 'center' }}>
              <Icon as={GOAL_ICON[g.id]} size={24} color={on ? colors.sand : colors.inkSoft} />
            </View>
            <View style={{ flex: 1 }}>
              <T v="bodyBold">{g.name}</T>
              <T v="caption" tone="inkSoft">
                {g.hint}
              </T>
            </View>
            <CheckDot on={on} />
          </Tap>
        );
      })}
    </View>
  );
}

/* ───────── Allergies ───────── */

export function AllergyPicker({ value, onChange }: { value: AllergenId[]; onChange: (v: AllergenId[]) => void }) {
  const none = value.length === 0;
  return (
    <View style={{ gap: space(2) }}>
      <Tap
        feedback="none"
        onPress={() => {
          feel.toggle(true);
          onChange([]);
        }}
        accessibilityRole="radio"
        accessibilityState={{ checked: none }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: space(2),
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: none ? colors.mint : colors.line,
          backgroundColor: none ? colors.mintWash : colors.surface,
        }}
      >
        <T v="bodyBold">لا توجد حساسية في البيت</T>
        <CheckDot on={none} tone={colors.mint} />
      </Tap>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space(1) }}>
        {ALLERGENS.map((a, i) => {
          const on = value.includes(a.id);
          return (
            <View key={a.id} style={{ width: '48.5%' }}>
              <Tap
                feedback="none"
                onPress={() => {
                  feel.toggle(!on);
                  onChange(toggle(value, a.id));
                }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`بدون ${a.name}`}
                style={{
                  padding: space(2),
                  gap: space(1),
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: on ? colors.clay : colors.line,
                  backgroundColor: on ? colors.clayWash : colors.surface,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Icon as={ALLERGEN_ICON[a.id]} size={24} color={on ? colors.clay : colors.sand} />
                  {on && (
                    <T v="captionBold" style={{ color: colors.clay }}>
                      بدون
                    </T>
                  )}
                </View>
                <T v="bodyBold">{a.name}</T>
                <T v="caption" tone="inkSoft">
                  {a.hint}
                </T>
              </Tap>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/* ───────── Appliances ───────── */

const ASKED: EquipmentId[] = ['oven', 'blender', 'microwave'];

export function AppliancePicker({ value, onChange }: { value: EquipmentId[]; onChange: (v: EquipmentId[]) => void }) {
  return (
    <View style={{ gap: space(1) }}>
      {ASKED.map((id) => {
        const on = value.includes(id);
        return (
          <Tap
            key={id}
            feedback="none"
            onPress={() => {
              feel.toggle(!on);
              onChange(toggle(value, id));
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={EQUIPMENT[id].name}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space(2),
              padding: space(2),
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: on ? colors.sand : colors.line,
              backgroundColor: colors.surface,
            }}
          >
            <View style={{ width: space(5), height: space(5), borderRadius: radius.sm, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' }}>
              <Icon as={EQUIPMENT[id].icon} size={24} color={on ? colors.sand : colors.inkFaint} />
            </View>
            <T v="bodyBold" style={{ flex: 1 }}>
              {EQUIPMENT[id].name}
            </T>
            <CheckDot on={on} />
          </Tap>
        );
      })}
      <T v="caption" tone="inkFaint">
        القدر والمقلاة والثلاجة نفترض إنها موجودة.
      </T>
    </View>
  );
}

/* ───────── Staples (always in the kitchen, never on the list) ───────── */

const STAPLE_AISLES = ['spices', 'pantry', 'grains'] as const;

export function StaplesPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <View style={{ gap: space(2) }}>
      {PANTRY_SECTIONS.filter((s) => (STAPLE_AISLES as readonly string[]).includes(s.aisle)).map((section) => (
        <View key={section.aisle} style={{ gap: space(1) }}>
          <T v="smallBold" tone="sand">
            {section.name}
          </T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space(1) }}>
            {INGREDIENTS.filter((i) => i.aisle === section.aisle).map((ing) => (
              <Chip
                key={ing.id}
                label={ing.name}
                on={value.includes(ing.id)}
                onPress={() => onChange(toggle(value, ing.id))}
                leading={<IngredientTile id={ing.id} size="sm" style={{ borderRadius: radius.full }} />}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

/* ───────── Kitchens for the week ───────── */

export function CuisinePicker({ value, onChange }: { value: CuisineId[]; onChange: (v: CuisineId[]) => void }) {
  const mix = value.length === 0;
  return (
    <View style={{ gap: space(2) }}>
      <Tap
        feedback="none"
        onPress={() => {
          if (!mix) feel.toggle(true);
          onChange([]);
        }}
        accessibilityRole="radio"
        accessibilityState={{ checked: mix }}
        accessibilityLabel="مزيج من كل المطابخ"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space(2),
          padding: space(2),
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: mix ? colors.mint : colors.line,
          backgroundColor: mix ? colors.mintWash : colors.surface,
        }}
      >
        <Icon as={Globe} size={24} color={mix ? colors.mint300 : colors.sand} />
        <View style={{ flex: 1 }}>
          <T v="bodyBold">مزيج من كل المطابخ</T>
          <T v="caption" tone="inkSoft">
            {RECIPES.length} طبق من {CUISINES.length} مطبخ، نختار لك منها
          </T>
        </View>
        <CheckDot on={mix} tone={colors.mint} />
      </Tap>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space(1) }}>
        {CUISINES.map((c) => {
          const on = value.includes(c.id);
          const count = RECIPES.filter((r) => r.cuisine === c.id).length;
          return (
            <Tap
              key={c.id}
              feedback="none"
              onPress={() => {
                feel.toggle(!on);
                onChange(toggle(value, c.id));
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${c.name}، ${count} طبق`}
              style={{
                width: '48.5%',
                padding: space(2),
                gap: space(1),
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: on ? colors.sand : colors.line,
                backgroundColor: on ? colors.raised : colors.surface,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <T v="title">{c.name}</T>
                <CheckDot on={on} />
              </View>
              <T v="caption" tone="inkSoft" numberOfLines={1}>
                {c.hint}
              </T>
              <T v="captionBold" tone="inkFaint">
                {count} طبق
              </T>
            </Tap>
          );
        })}
      </View>
    </View>
  );
}

/* ───────── Dishes the household asked never to see again ─────────
 * Dishes get here from the ban button on a recipe card; this list restores them. */

export function BannedList({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const banned = value.map((id) => RECIPES.find((r) => r.id === id)).filter((r): r is (typeof RECIPES)[number] => !!r);
  if (!banned.length) {
    return (
      <View style={{ alignItems: 'center', gap: space(1), paddingVertical: space(3) }}>
        <Icon as={Ban} size={32} color={colors.inkFaint} />
        <T v="bodyBold" center>
          ما في أطباق مستبعدة
        </T>
        <T v="small" tone="inkSoft" center>
          اضغط زر الاستبعاد على أي وصفة في خطتك، وما راح نقترحها مرة ثانية.
        </T>
      </View>
    );
  }
  return (
    <View style={{ gap: space(1) }}>
      {banned.map((r) => (
        <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space(2), padding: space(1), borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}>
          <RecipeTile id={r.id} size="md" tone={colors.clay} />
          <View style={{ flex: 1 }}>
            <T v="bodyBold" numberOfLines={1}>
              {r.title}
            </T>
            <T v="caption" tone="inkSoft">
              {CUISINE_BY_ID[r.cuisine].name}
            </T>
          </View>
          <Tap
            onPress={() => {
              feel.toggle(true);
              onChange(value.filter((id) => id !== r.id));
            }}
            accessibilityLabel={`رجّع ${r.title}`}
            style={{ height: space(4), paddingHorizontal: space(2), borderRadius: radius.full, borderWidth: 1, borderColor: colors.lineStrong, justifyContent: 'center' }}
          >
            <T v="smallBold">رجّعها</T>
          </Tap>
        </View>
      ))}
    </View>
  );
}
