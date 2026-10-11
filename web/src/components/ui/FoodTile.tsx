import { INGREDIENT_BY_ID } from '@/lib/data';
import { cx } from '@/lib/format';
import type { AisleId } from '@/lib/types';
import { AISLE_HUE, AISLE_ICON, INGREDIENT_ICON, RECIPE_ICON, type LineIcon } from './icon-map';

const SIZES = {
  sm: { box: 'h-3 w-3 rounded-sm', icon: 16 },
  md: { box: 'h-4 w-4 rounded-sm', icon: 20 },
  lg: { box: 'h-6 w-6 rounded-md', icon: 28 },
} as const;

type Size = keyof typeof SIZES;

/** A line icon on a tile washed in its own hue (≈8% tint), drawn in that hue. */
function Tile({ Icon, hue, size = 'md', className }: { Icon: LineIcon; hue: string; size?: Size; className?: string }) {
  const s = SIZES[size];
  return (
    <span
      className={cx('flex shrink-0 items-center justify-center', s.box, className)}
      style={{ backgroundColor: `${hue}14`, color: hue, boxShadow: `inset 0 0 0 1px ${hue}26` }}
      aria-hidden="true"
    >
      <Icon size={s.icon} />
    </span>
  );
}

const iconFor = (id: string): LineIcon => INGREDIENT_ICON[id] ?? AISLE_ICON[INGREDIENT_BY_ID[id].aisle];
const hueFor = (id: string) => AISLE_HUE[INGREDIENT_BY_ID[id].aisle];

export function IngredientTile({ id, size, className }: { id: string; size?: Size; className?: string }) {
  return <Tile Icon={iconFor(id)} hue={hueFor(id)} size={size} className={className} />;
}

export function AisleTile({ aisle, size, className }: { aisle: AisleId; size?: Size; className?: string }) {
  return <Tile Icon={AISLE_ICON[aisle]} hue={AISLE_HUE[aisle]} size={size} className={className} />;
}

/** Bare ingredient icon in its aisle hue — for chips. */
export function IngredientIcon({ id, size = 20, tinted = true }: { id: string; size?: number; tinted?: boolean }) {
  const Icon = iconFor(id);
  return <Icon size={size} style={tinted ? { color: hueFor(id) } : undefined} />;
}

/** A dish icon in the current text colour. */
export function RecipeIcon({ id, size = 28 }: { id: string; size?: number }) {
  const Icon = RECIPE_ICON[id] ?? AISLE_ICON.grains;
  return <Icon size={size} />;
}
