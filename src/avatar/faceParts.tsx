import type { ReactElement } from "react";
import { BLUSH, EYE, MOUTH } from "./bodyGeometry";

export interface FaceProps {
  iris: string;
  skin: string;
}

const LINE = "#3c3350";
const MOUTH_DARK = "#8f2d46";
const TONGUE = "#ff7d9c";

/** One open eye, mirrored by the caller for the other side. */
function openEye(cx: number, p: FaceProps, scale: number): ReactElement {
  return (
    <g key={cx}>
      <ellipse cx={cx} cy={EYE.cy} rx={10 * scale} ry={11.5 * scale} fill="#fffdfa" />
      <circle cx={cx} cy={EYE.cy + 0.5} r={6.6 * scale} fill={p.iris} />
      <circle cx={cx} cy={EYE.cy + 0.5} r={3.3 * scale} fill="#221f2e" />
      <circle cx={cx - 2.6 * scale} cy={EYE.cy - 3.4 * scale} r={2.7 * scale} fill="#fff" />
      <circle cx={cx + 2.8 * scale} cy={EYE.cy + 3.6 * scale} r={1.4 * scale} fill="#fff" opacity={0.75} />
    </g>
  );
}

function closedArc(cx: number): ReactElement {
  return (
    <path
      key={cx}
      d={`M${cx - 10},${EYE.cy + 3} Q${cx},${EYE.cy - 9} ${cx + 10},${EYE.cy + 3}`}
      stroke={LINE}
      strokeWidth={4.6}
      strokeLinecap="round"
      fill="none"
    />
  );
}

export const EYE_STYLES: Record<string, (p: FaceProps) => ReactElement> = {
  round: (p) => (
    <g>
      {openEye(EYE.leftCx, p, 1)}
      {openEye(EYE.rightCx, p, 1)}
    </g>
  ),

  sparkle: (p) => (
    <g>
      {openEye(EYE.leftCx, p, 1.24)}
      {openEye(EYE.rightCx, p, 1.24)}
      {/* Extra glints are what make these read as "sparkly" rather than just big. */}
      <circle cx={EYE.leftCx + 5} cy={EYE.cy - 8} r={2} fill="#fff" />
      <circle cx={EYE.rightCx + 5} cy={EYE.cy - 8} r={2} fill="#fff" />
      <circle cx={EYE.leftCx - 7} cy={EYE.cy + 6} r={1.6} fill="#fff" opacity={0.8} />
      <circle cx={EYE.rightCx - 7} cy={EYE.cy + 6} r={1.6} fill="#fff" opacity={0.8} />
    </g>
  ),

  happy: () => (
    <g>
      {closedArc(EYE.leftCx)}
      {closedArc(EYE.rightCx)}
    </g>
  ),

  wink: (p) => (
    <g>
      {closedArc(EYE.leftCx)}
      {openEye(EYE.rightCx, p, 1)}
    </g>
  ),

  sleepy: (p) => (
    <g>
      {openEye(EYE.leftCx, p, 1)}
      {openEye(EYE.rightCx, p, 1)}
      {/* Lids drop over the top half, in skin tone so they read as eyelids. */}
      <path
        d={`M${EYE.leftCx - 11},${EYE.cy - 1} a11,12 0 0 1 22,0 z`}
        fill={p.skin}
      />
      <path
        d={`M${EYE.rightCx - 11},${EYE.cy - 1} a11,12 0 0 1 22,0 z`}
        fill={p.skin}
      />
      <path
        d={`M${EYE.leftCx - 10},${EYE.cy - 1} h20 M${EYE.rightCx - 10},${EYE.cy - 1} h20`}
        stroke={LINE}
        strokeWidth={3.4}
        strokeLinecap="round"
      />
    </g>
  ),
};

export const MOUTH_STYLES: Record<string, () => ReactElement> = {
  smile: () => (
    <path
      d={`M${MOUTH.cx - 16},${MOUTH.cy - 5} Q${MOUTH.cx},${MOUTH.cy + 12} ${MOUTH.cx + 16},${MOUTH.cy - 5}`}
      stroke="#6b2b3d"
      strokeWidth={5}
      strokeLinecap="round"
      fill="none"
    />
  ),

  grin: () => (
    <g>
      <path
        d={`M${MOUTH.cx - 18},${MOUTH.cy - 6} Q${MOUTH.cx},${MOUTH.cy - 10} ${MOUTH.cx + 18},${MOUTH.cy - 6}
            Q${MOUTH.cx + 18},${MOUTH.cy + 20} ${MOUTH.cx},${MOUTH.cy + 20}
            Q${MOUTH.cx - 18},${MOUTH.cy + 20} ${MOUTH.cx - 18},${MOUTH.cy - 6} Z`}
        fill={MOUTH_DARK}
      />
      <path
        d={`M${MOUTH.cx - 16},${MOUTH.cy - 5} Q${MOUTH.cx},${MOUTH.cy - 8} ${MOUTH.cx + 16},${MOUTH.cy - 5}
            L${MOUTH.cx + 15},${MOUTH.cy + 2} Q${MOUTH.cx},${MOUTH.cy + 5} ${MOUTH.cx - 15},${MOUTH.cy + 2} Z`}
        fill="#fffdfa"
      />
      <ellipse cx={MOUTH.cx} cy={MOUTH.cy + 13} rx={10} ry={5.5} fill={TONGUE} />
    </g>
  ),

  open: () => (
    <g>
      <ellipse cx={MOUTH.cx} cy={MOUTH.cy + 3} rx={9} ry={11} fill={MOUTH_DARK} />
      <ellipse cx={MOUTH.cx} cy={MOUTH.cy + 9} rx={5.5} ry={4} fill={TONGUE} />
    </g>
  ),

  frown: () => (
    <path
      d={`M${MOUTH.cx - 15},${MOUTH.cy + 9} Q${MOUTH.cx},${MOUTH.cy - 5} ${MOUTH.cx + 15},${MOUTH.cy + 9}`}
      stroke="#6b2b3d"
      strokeWidth={5}
      strokeLinecap="round"
      fill="none"
    />
  ),

  sad: () => (
    <g>
      <path
        d={`M${MOUTH.cx - 15},${MOUTH.cy + 10} Q${MOUTH.cx},${MOUTH.cy - 6} ${MOUTH.cx + 15},${MOUTH.cy + 10}`}
        stroke="#6b2b3d"
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />
      {/* A single tear, because a sad face with no tear reads as merely grumpy. */}
      <path
        d="M133,99 c3,5 4.5,7.5 4.5,9.5 a4.6,4.6 0 0 1 -9,0 c0,-2 1.5,-4.5 4.5,-9.5 z"
        fill="#7fd4ff"
      />
    </g>
  ),

  surprised: () => <ellipse cx={MOUTH.cx} cy={MOUTH.cy + 3} rx={8} ry={9.5} fill={MOUTH_DARK} />,
};

export function Blush(): ReactElement {
  return (
    <g opacity={0.3}>
      <ellipse cx={BLUSH.leftCx} cy={BLUSH.cy} rx={BLUSH.rx} ry={BLUSH.ry} fill="#ff6f8f" />
      <ellipse cx={BLUSH.rightCx} cy={BLUSH.cy} rx={BLUSH.rx} ry={BLUSH.ry} fill="#ff6f8f" />
    </g>
  );
}
