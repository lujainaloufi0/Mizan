import { colors } from './theme';
import type { LineIcon } from './icon-map';

/** The only way icons are drawn: one stroke weight (1.75 at mobile density), theme colours. */
export const STROKE = 1.75;

export function Icon({ as: Glyph, size = 24, color = colors.ink, bold }: { as: LineIcon; size?: number; color?: string; bold?: boolean }) {
  return <Glyph size={size} color={color} strokeWidth={bold ? 2.75 : STROKE} />;
}
