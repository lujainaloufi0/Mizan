'use client';

import { C } from '@/lib/palette';

/**
 * The Mizan signature: a balance that weighs your budget (right pan, mint)
 * against the week's estimated basket (left pan, sand). It tips toward
 * whichever is heavier and settles level when the two match.
 */

const W = 320;
const PIVOT = { x: 160, y: 48 };
const ARM = 112;
const STRING = 40;
const settle = 'transform 900ms cubic-bezier(0.34, 1.4, 0.64, 1)';

export function BalanceScale({ budget, cost }: { budget: number; cost: number }) {
  // cost heavier → left pan drops (counter-clockwise, negative angle)
  const diff = cost > 0 ? (budget - cost) / cost : 0;
  const angle = Math.max(-12, Math.min(12, diff * 36));
  const rad = (angle * Math.PI) / 180;

  const right = { x: ARM * Math.cos(rad), y: ARM * Math.sin(rad) };
  const left = { x: -ARM * Math.cos(rad), y: -ARM * Math.sin(rad) };

  return (
    <svg viewBox={`0 0 ${W} 176`} className="h-auto w-full max-w-[320px]" role="img" aria-label="ميزان الميزانية مقابل التكلفة المتوقعة">
      {/* stand */}
      <path d={`M${PIVOT.x} ${PIVOT.y} V160`} stroke={C.sandDim} strokeWidth="2" strokeLinecap="round" />
      <path d={`M${PIVOT.x - 40} 164 H${PIVOT.x + 40}`} stroke={C.sandDim} strokeWidth="2" strokeLinecap="round" />

      {/* beam */}
      <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`, transition: settle }}>
        <path d={`M${PIVOT.x - ARM} ${PIVOT.y} H${PIVOT.x + ARM}`} stroke={C.sand} strokeWidth="2.5" strokeLinecap="round" />
      </g>

      <Pan x={PIVOT.x + right.x} y={PIVOT.y + right.y} stroke={C.mint} fill="rgba(16,185,129,0.14)" />
      <Pan x={PIVOT.x + left.x} y={PIVOT.y + left.y} stroke={C.sand} fill="rgba(229,212,192,0.08)" />

      {/* pivot jewel */}
      <circle cx={PIVOT.x} cy={PIVOT.y} r="7" fill={C.canvas} stroke={C.sand} strokeWidth="2" />
      <circle cx={PIVOT.x} cy={PIVOT.y} r="2.5" fill={C.mint} />
    </svg>
  );
}

function Pan({ x, y, stroke, fill }: { x: number; y: number; stroke: string; fill: string }) {
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, transition: settle }}>
      <path d={`M0 0 L-32 ${STRING} M0 0 L32 ${STRING}`} stroke={C.sandDim} strokeWidth="1.25" />
      <path d={`M-40 ${STRING} H40 A40 18 0 0 1 -40 ${STRING} Z`} fill={fill} stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      <circle r="3" fill={C.sand} />
    </g>
  );
}
