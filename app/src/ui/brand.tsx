/**
 * Brand pieces: the Mizan mark, the wordmark, the balance scale and the
 * aisle-tinted food tiles.
 */
import { useEffect, useRef, useState } from 'react';
import { Image, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { INGREDIENT_BY_ID, RECIPE_BY_ID, STORE_BY_ID } from '@/lib/data';
import type { AisleId, StoreId } from '@/lib/types';
import { Icon } from './Icon';
import { AISLE_HUE, AISLE_ICON, DISH_ICON, INGREDIENT_ICON, type LineIcon } from './icon-map';
import { T } from './kit';
import { STORE_LOGOS } from './store-logos';
import { colors, radius, space } from './theme';

export function MizanMark({ size = 32, color = colors.sand, jewel = colors.mint, tilt = 0 }: { size?: number; color?: string; jewel?: string; tilt?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <G rotation={tilt} origin="16, 11">
        <Path d="M4 10.75 H28" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        <Path d="M4 12 L1 20 H9 Z" fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
        <Path d="M28 12 L23 20 H31 Z" fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      </G>
      <Circle cx={16} cy={7} r={2.5} fill={jewel} />
      <Path d="M16 11 V27 M11 28 H21" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function Wordmark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space(1) }}>
      <MizanMark size={size === 'lg' ? 40 : 28} />
      <T v={size === 'lg' ? 'hero' : 'heading'}>مِيزان</T>
    </View>
  );
}

/* ───────── Balance scale: budget (mint, right) vs expected basket (sand, left) ───────── */

/** JS spring for small SVGs, critically damped: follows the value smoothly, never wobbles. */
function useSpringNumber(target: number) {
  const [v, setV] = useState(target);
  const state = useRef({ x: target, vel: 0 });
  useEffect(() => {
    let raf = 0;
    let last = Date.now();
    const step = () => {
      const now = Date.now();
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      const s = state.current;
      const force = -170 * (s.x - target) - 26 * s.vel;
      s.vel += force * dt;
      s.x += s.vel * dt;
      setV(s.x);
      if (Math.abs(s.x - target) > 0.01 || Math.abs(s.vel) > 0.01) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}

export function BalanceScale({ budget, cost, width = 288 }: { budget: number; cost: number; width?: number }) {
  const diff = cost > 0 ? (budget - cost) / cost : 0;
  const angle = useSpringNumber(Math.max(-12, Math.min(12, diff * 36)));
  const W = 320;
  const P = { x: 160, y: 48 };
  const ARM = 112;
  const S = 40;
  const rad = (angle * Math.PI) / 180;
  const pan = (side: 1 | -1, stroke: string, fill: string) => {
    const x = P.x + side * ARM * Math.cos(rad);
    const y = P.y + side * ARM * Math.sin(rad);
    return (
      <G x={x} y={y}>
        <Path d={`M0 0 L-32 ${S} M0 0 L32 ${S}`} stroke={colors.sandDim} strokeWidth={1.25} />
        <Path d={`M-40 ${S} H40 A40 18 0 0 1 -40 ${S} Z`} fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />
        <Circle r={3} fill={colors.sand} />
      </G>
    );
  };
  return (
    <Svg width={width} height={(width * 176) / W} viewBox={`0 0 ${W} 176`} accessibilityLabel="ميزان الميزانية مقابل التكلفة المتوقعة">
      <Path d={`M${P.x} ${P.y} V160 M${P.x - 40} 164 H${P.x + 40}`} stroke={colors.sandDim} strokeWidth={2} strokeLinecap="round" />
      <G rotation={angle} origin={`${P.x}, ${P.y}`}>
        <Path d={`M${P.x - ARM} ${P.y} H${P.x + ARM}`} stroke={colors.sand} strokeWidth={2.5} strokeLinecap="round" />
      </G>
      {pan(1, colors.mint, 'rgba(16,185,129,0.14)')}
      {pan(-1, colors.sand, 'rgba(229,212,192,0.08)')}
      <Circle cx={P.x} cy={P.y} r={7} fill={colors.canvas} stroke={colors.sand} strokeWidth={2} />
      <Circle cx={P.x} cy={P.y} r={2.5} fill={colors.mint} />
    </Svg>
  );
}

/* ───────── Food tiles ───────── */

const SIZES = { sm: { box: space(3), icon: 16, r: radius.sm }, md: { box: space(5), icon: 20, r: radius.sm }, lg: { box: space(7), icon: 28, r: radius.md } } as const;
type TileSize = keyof typeof SIZES;

function Tile({ glyph, hue, size = 'md', style }: { glyph: LineIcon; hue: string; size?: TileSize; style?: StyleProp<ViewStyle> }) {
  const s = SIZES[size];
  return (
    <View
      style={[
        { width: s.box, height: s.box, borderRadius: s.r, backgroundColor: `${hue}1A`, borderWidth: 1, borderColor: `${hue}33`, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      <Icon as={glyph} size={s.icon} color={hue} />
    </View>
  );
}

export const ingredientIcon = (id: string): LineIcon => INGREDIENT_ICON[id] ?? AISLE_ICON[INGREDIENT_BY_ID[id].aisle];
export const ingredientHue = (id: string) => AISLE_HUE[INGREDIENT_BY_ID[id].aisle];

export function IngredientTile({ id, size, style }: { id: string; size?: TileSize; style?: StyleProp<ViewStyle> }) {
  return <Tile glyph={ingredientIcon(id)} hue={ingredientHue(id)} size={size} style={style} />;
}

export function AisleTile({ aisle, size }: { aisle: AisleId; size?: TileSize }) {
  return <Tile glyph={AISLE_ICON[aisle]} hue={AISLE_HUE[aisle]} size={size} />;
}

export function RecipeTile({ id, size = 'lg', tone = colors.sand }: { id: string; size?: TileSize; tone?: string }) {
  return <Tile glyph={DISH_ICON[RECIPE_BY_ID[id]?.kind ?? 'rice']} hue={tone} size={size} />;
}

/* ───────── Store mark: official logo if provided (store-logos.ts), else a monogram ───────── */

export function StoreMark({ id, size = 'md' }: { id: StoreId; size?: 'sm' | 'md' }) {
  const store = STORE_BY_ID[id];
  const px = size === 'sm' ? space(3) : space(5);
  const logo = STORE_LOGOS[id];
  if (logo) {
    return <Image source={logo} style={{ width: px, height: px, borderRadius: radius.sm, backgroundColor: '#FFFFFF' }} resizeMode="contain" accessibilityLabel={store.name} />;
  }
  return (
    <View
      accessibilityLabel={store.name}
      style={{ width: px, height: px, borderRadius: size === 'sm' ? radius.full : radius.sm, backgroundColor: `${store.tint}1A`, borderWidth: 1, borderColor: `${store.tint}40`, alignItems: 'center', justifyContent: 'center' }}
    >
      <T v={size === 'sm' ? 'captionBold' : 'heading'} style={{ color: store.tint }}>
        {store.name.replace(/^ال/, '').charAt(0)}
      </T>
    </View>
  );
}
