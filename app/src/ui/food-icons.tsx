/**
 * Mizan line icons for React Native — the food and kitchen shapes Lucide
 * doesn't draw. Same 24px grid, round caps and joins as lucide-react-native,
 * same props (size, color, strokeWidth), so both families mix freely.
 */
import type { ReactElement } from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

export type IconProps = { size?: number; color?: string; strokeWidth?: number };
export type IconComponent = (props: IconProps) => ReactElement;

function make(name: string, body: (color: string) => ReactElement): IconComponent {
  const Icon = ({ size = 24, color = 'currentColor', strokeWidth = 1.75 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {body(color)}
    </Svg>
  );
  Icon.displayName = name;
  return Icon;
}

const dot = (x: number, y: number, color: string) => <Circle key={`${x}-${y}`} cx={x} cy={y} r={0.9} fill={color} stroke="none" />;

export const Onion = make('Onion', (c) => (
  <>
    <Path d="M12 5.5c-1.5 2.8-7.5 5-7.5 9.8a7.5 6 0 0 0 15 0c0-4.8-6-7-7.5-9.8Z" />
    <Path d="M12 8.5c-1.6 2-2.6 4.3-2.6 6.8s1 4.2 2.6 5.5" />
    <Path d="M12 5.5c0-1.6.9-2.8 2.6-3.3" />
    <Path d="M10.5 21.4 10 22.8M13.5 21.4l.5 1.4" />
  </>
));

export const Garlic = make('Garlic', (c) => (
  <>
    <Path d="M12 4.5c-1.5 2.5-7 4.5-7 10a7 6.5 0 0 0 14 0c0-5.5-5.5-7.5-7-10Z" />
    <Path d="M12 9c-1.8 2-2.6 4.5-2.6 7.5M12 9c1.8 2 2.6 4.5 2.6 7.5" />
    <Path d="M12 4.5V2" />
  </>
));

export const Tomato = make('Tomato', (c) => (
  <>
    <Circle cx="12" cy="13.5" r="7.5" />
    <Path d="M8.5 7.2 10.3 8.6 12 6.8l1.7 1.8 1.8-1.4" />
    <Path d="M12 6.8V3.5" />
  </>
));

export const Cucumber = make('Cucumber', (c) => (
  <>
    <Rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-35 12 12)" />
    {dot(9, 13.5, c)}
    {dot(12, 11.5, c)}
    {dot(15, 9.5, c)}
  </>
));

export const Eggplant = make('Eggplant', (c) => (
  <>
    <Path d="M16.8 7.2c2 2 1.7 5.6-.9 9-2.8 3.7-7.2 5.6-9.6 3.8-2.6-2-1.7-6.2 1.6-8.4 2.2-1.5 3.8-2.2 5-3.4 1.4-1.3 2.4-2.4 3.9-1Z" />
    <Path d="M16.8 7.2 19.5 4.5" />
    <Path d="M12.6 8.6c1.2.1 2.4-.3 3.3-1.2M16.8 7.2c.3 1.3.1 2.7-.6 3.8" />
  </>
));

export const Potato = make('Potato', (c) => (
  <>
    <Path d="M6.5 7.5c2.8-3.4 9.2-3.6 12-.6s2.4 8.6-.8 11.6-9.4 2.8-12-.6-2-7.1.8-10.4Z" />
    {dot(9.5, 10, c)}
    {dot(14.5, 11.5, c)}
    {dot(10.5, 15.5, c)}
  </>
));

export const BellPepper = make('BellPepper', (c) => (
  <>
    <Path d="M8 9C6 9 4.5 11 4.5 14c0 4 2.5 7 5 7 1 0 1.5-.5 2.5-.5s1.5.5 2.5.5c2.5 0 5-3 5-7 0-3-1.5-5-3.5-5-1.5 0-2.5.7-4 .7S9.5 9 8 9Z" />
    <Path d="M12 9.7V6.5C12 5 13 4 14.5 4" />
    <Path d="M12 13v6" />
  </>
));

export const DateFruit = make('DateFruit', (c) => (
  <>
    <Ellipse cx="12" cy="13" rx="5" ry="8" transform="rotate(-25 12 13)" />
    <Path d="M14.5 5.5c.8-1.4 2-2.3 3.5-2.5" />
    <Path d="M10 10c.6 2 .8 4.2.5 6.5" />
  </>
));

export const Olive = make('Olive', (c) => (
  <>
    <Ellipse cx="10" cy="14" rx="5.5" ry="6.5" transform="rotate(-20 10 14)" />
    <Path d="M13.5 8C15 5 17.5 3.5 21 3.5c-.5 3-2.6 5-6 5.5" />
  </>
));

export const RiceBowl = make('RiceBowl', (c) => (
  <>
    <Path d="M3 12.5h18c0 4.5-4 8-9 8s-9-3.5-9-8Z" />
    <Path d="M5.5 12.5c.6-3 3.4-5 6.5-5s5.9 2 6.5 5" />
    <Path d="M9.2 10.2l.5.6M12 9.2v.8M14.8 10.2l-.5.6" />
  </>
));

export const Pasta = make('Pasta', (c) => (
  <>
    <Path d="M12 12 4.5 7v10L12 12l7.5-5v10L12 12Z" />
    <Path d="M7 9.5v5M17 9.5v5" />
  </>
));

export const Flatbread = make('Flatbread', (c) => (
  <>
    <Ellipse cx="12" cy="12" rx="9.5" ry="7.5" />
    <Ellipse cx="12" cy="12" rx="6" ry="4.2" />
  </>
));

export const SpiceJar = make('SpiceJar', (c) => (
  <>
    <Rect x="7" y="2.5" width="10" height="4" rx="1" />
    <Path d="M7.5 6.5h9l1 3v9.5a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2V9.5l1-3Z" />
    <Rect x="9" y="12" width="6" height="5" rx="1" />
  </>
));

export const SaltShaker = make('SaltShaker', (c) => (
  <>
    <Path d="M8 9.5c0-3.8 1.8-6.5 4-6.5s4 2.7 4 6.5" />
    <Path d="M7.5 9.5h9l.8 9.7a1.8 1.8 0 0 1-1.8 1.8h-7a1.8 1.8 0 0 1-1.8-1.8l.8-9.7Z" />
    {dot(10.8, 6.5, c)}
    {dot(13.2, 6.5, c)}
    {dot(12, 4.8, c)}
  </>
));

export const PepperMill = make('PepperMill', (c) => (
  <>
    <Path d="M12 2v2" />
    <Rect x="8.5" y="4" width="7" height="3" rx="1" />
    <Path d="M9.5 7c-1.4 2.2-1.4 4.8 0 7-1.3 1.6-2 3.4-2 5v2h9v-2c0-1.6-.7-3.4-2-5 1.4-2.2 1.4-4.8 0-7" />
  </>
));

export const OilBottle = make('OilBottle', (c) => (
  <>
    <Rect x="10" y="2" width="4" height="3" rx="0.5" />
    <Path d="M10 5c0 2-4 3-4 6v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8c0-3-4-4-4-6" />
    <Path d="M12 12.5c-1.2 1.6-2 2.6-2 3.5a2 2 0 0 0 4 0c0-.9-.8-1.9-2-3.5Z" />
  </>
));

export const Can = make('Can', (c) => (
  <>
    <Ellipse cx="12" cy="5.5" rx="6.5" ry="2.5" />
    <Path d="M5.5 5.5v13c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-13" />
    <Path d="M5.5 10c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5M5.5 14.5c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5" />
  </>
));

export const Jar = make('Jar', (c) => (
  <>
    <Rect x="6" y="2.5" width="12" height="3.5" rx="1" />
    <Path d="M6.5 6h11v13a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2V6Z" />
    <Path d="M6.5 11h11M6.5 16h11" />
  </>
));

export const YogurtCup = make('YogurtCup', (c) => (
  <>
    <Rect x="4" y="4.5" width="16" height="3" rx="1" />
    <Path d="M5.5 7.5h13l-1.4 12a1.8 1.8 0 0 1-1.8 1.5H8.7a1.8 1.8 0 0 1-1.8-1.5l-1.4-12Z" />
    <Path d="M7 12h10" />
  </>
));

export const Cardamom = make('Cardamom', (c) => (
  <>
    <Path d="M12 3c3 3 4.5 6 4.5 9s-1.5 6-4.5 9c-3-3-4.5-6-4.5-9S9 6 12 3Z" />
    <Path d="M12 6v12" />
  </>
));

export const Cinnamon = make('Cinnamon', (c) => (
  <>
    <Rect x="2.5" y="6" width="17" height="4.5" rx="2.25" transform="rotate(-18 11 8.25)" />
    <Rect x="4.5" y="13" width="17" height="4.5" rx="2.25" transform="rotate(-18 13 15.25)" />
  </>
));

export const DriedLime = make('DriedLime', (c) => (
  <>
    <Circle cx="12" cy="12.5" r="8" />
    <Path d="M12 4.5V3" />
    <Path d="M8.5 7.5c2.6 2.4 4 6.2 3.2 12.8" />
  </>
));

export const Root = make('Root', (c) => (
  <>
    <Path d="M5 15c2-4 5-6 9-6.5 3-.4 5 .5 5.5 2 .5 1.6-1 3-3.5 3.5-2.5.5-4 1.5-5.5 3.5S7 20 5.5 19 4 17 5 15Z" />
    <Path d="M14 8.5c.5-2 1.6-3.5 3.5-4.5M9.5 14l1.5 1.5M13.5 12.5l1 1.5" />
  </>
));

export const Seeds = make('Seeds', (c) => (
  <>
    <Path d="M7 5c1.8 1.4 2.4 3.2 1.6 4.8S5.8 11.4 5 10 5.2 6.4 7 5Z" />
    <Path d="M16.5 6c1.8 1.4 2.4 3.2 1.6 4.8s-2.8 1.6-3.6.2.2-3.6 2-5Z" />
    <Path d="M11.5 13c1.8 1.4 2.4 3.2 1.6 4.8s-2.8 1.6-3.6.2.2-3.6 2-5Z" />
    <Path d="M3 21 21 3" />
  </>
));

export const Oven = make('Oven', (c) => (
  <>
    <Rect x="3" y="3" width="18" height="18" rx="2" />
    <Path d="M3 8h18" />
    <Rect x="7" y="11" width="10" height="7" rx="1" />
    {dot(7, 5.5, c)}
    {dot(10, 5.5, c)}
    <Path d="M15 5.5h3" />
  </>
));

export const Pan = make('Pan', (c) => (
  <>
    <Circle cx="10" cy="12" r="7" />
    <Circle cx="10" cy="12" r="4" />
    <Path d="M17 12h5" />
  </>
));
