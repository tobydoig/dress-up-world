import type { ReactElement } from "react";
import { BLUSH, EYE, MOUTH, shade } from "./bodyGeometry";

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
      d={"M" + (cx - 10) + "," + (EYE.cy + 3) + " Q" + cx + "," + (EYE.cy - 9) + " " + (cx + 10) + "," + (EYE.cy + 3)}
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
      <path d={"M" + (EYE.leftCx - 11) + "," + (EYE.cy - 1) + " a11,12 0 0 1 22,0 z"} fill={p.skin} />
      <path d={"M" + (EYE.rightCx - 11) + "," + (EYE.cy - 1) + " a11,12 0 0 1 22,0 z"} fill={p.skin} />
      <path
        d={
          "M" + (EYE.leftCx - 10) + "," + (EYE.cy - 1) + " h20 " +
          "M" + (EYE.rightCx - 10) + "," + (EYE.cy - 1) + " h20"
        }
        stroke={LINE}
        strokeWidth={3.4}
        strokeLinecap="round"
      />
    </g>
  ),
};

/**
 * Noses sit between the eyes (cy 92) and the mouth (cy 117). They're deliberately tiny — a
 * big nose fights the cartoon proportions — but leaving one out entirely makes the face look
 * unsettling rather than stylised.
 */
export const NOSE_STYLES: Record<string, (p: FaceProps) => ReactElement> = {
  button: (p) => <ellipse cx={100} cy={104} rx={5.4} ry={4.2} fill={shade(p.skin, -34)} />,

  curve: (p) => (
    <path
      d="M96,98 Q99,106 105,104"
      stroke={shade(p.skin, -46)}
      strokeWidth={2.8}
      strokeLinecap="round"
      fill="none"
    />
  ),

  dots: (p) => (
    <g fill={shade(p.skin, -44)}>
      <circle cx={96} cy={104} r={2.1} />
      <circle cx={104} cy={104} r={2.1} />
    </g>
  ),

  freckles: (p) => (
    <g>
      <ellipse cx={100} cy={104} rx={5.4} ry={4.2} fill={shade(p.skin, -34)} />
      <g fill={shade(p.skin, -40)} opacity={0.8}>
        {[
          [70, 100], [78, 104], [70, 109], [84, 99],
          [130, 100], [122, 104], [130, 109], [116, 99],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={1.9} />
        ))}
      </g>
    </g>
  ),
};

export interface BlushProps {
  colour: string;
}

function cheeks(render: (cx: number, key: string) => ReactElement): ReactElement {
  return (
    <g>
      {render(BLUSH.leftCx, "bl")}
      {render(BLUSH.rightCx, "br")}
    </g>
  );
}

export const BLUSH_STYLES: Record<string, (p: BlushProps) => ReactElement> = {
  soft: (p) =>
    cheeks((cx, key) => (
      <ellipse key={key} cx={cx} cy={BLUSH.cy} rx={BLUSH.rx} ry={BLUSH.ry} fill={p.colour} opacity={0.32} />
    )),

  bold: (p) =>
    cheeks((cx, key) => (
      <ellipse key={key} cx={cx} cy={BLUSH.cy} rx={BLUSH.rx + 1.5} ry={BLUSH.ry + 1.5} fill={p.colour} opacity={0.62} />
    )),

  doll: (p) =>
    cheeks((cx, key) => <circle key={key} cx={cx} cy={BLUSH.cy} r={9.5} fill={p.colour} opacity={0.75} />),

  hearts: (p) =>
    cheeks((cx, key) => (
      <path
        key={key}
        transform={"translate(" + cx + " " + (BLUSH.cy - 2) + ") scale(0.42)"}
        d="M0,-4 C-5,-13 -18,-11 -18,-1 C-18,9 -6,15 0,22 C6,15 18,9 18,-1 C18,-11 5,-13 0,-4 Z"
        fill={p.colour}
      />
    )),

  stars: (p) =>
    cheeks((cx, key) => (
      <path
        key={key}
        transform={"translate(" + cx + " " + (BLUSH.cy - 1) + ") scale(0.42)"}
        d="M0,-18 L5.3,-5.6 18.5,-4.4 8.5,4.3 11.4,17.2 0,10.4 -11.4,17.2 -8.5,4.3 -18.5,-4.4 -5.3,-5.6 Z"
        fill={p.colour}
      />
    )),

  sparkle: (p) =>
    cheeks((cx, key) => (
      <g key={key} fill={p.colour}>
        <ellipse cx={cx} cy={BLUSH.cy} rx={BLUSH.rx} ry={BLUSH.ry} opacity={0.3} />
        {[
          [-6, -3, 2.6],
          [3, 2, 3.4],
          [8, -4, 2],
        ].map(([dx, dy, r], i) => (
          <path
            key={i}
            d={
              "M" + (cx + dx) + "," + (BLUSH.cy + dy - r) +
              " l" + r * 0.3 + "," + r * 0.7 + " " + r * 0.7 + "," + r * 0.3 +
              " -" + r * 0.7 + "," + r * 0.3 + " -" + r * 0.3 + "," + r * 0.7 +
              " -" + r * 0.3 + ",-" + r * 0.7 + " -" + r * 0.7 + ",-" + r * 0.3 +
              " " + r * 0.7 + ",-" + r * 0.3 + " z"
            }
            opacity={0.95}
          />
        ))}
      </g>
    )),
};

export const MOUTH_STYLES: Record<string, () => ReactElement> = {
  smile: () => (
    <path
      d={"M" + (MOUTH.cx - 16) + "," + (MOUTH.cy - 5) + " Q" + MOUTH.cx + "," + (MOUTH.cy + 12) + " " + (MOUTH.cx + 16) + "," + (MOUTH.cy - 5)}
      stroke="#6b2b3d"
      strokeWidth={5}
      strokeLinecap="round"
      fill="none"
    />
  ),

  grin: () => (
    <g>
      <path
        d={
          "M" + (MOUTH.cx - 18) + "," + (MOUTH.cy - 6) + " Q" + MOUTH.cx + "," + (MOUTH.cy - 10) + " " + (MOUTH.cx + 18) + "," + (MOUTH.cy - 6) +
          " Q" + (MOUTH.cx + 18) + "," + (MOUTH.cy + 20) + " " + MOUTH.cx + "," + (MOUTH.cy + 20) +
          " Q" + (MOUTH.cx - 18) + "," + (MOUTH.cy + 20) + " " + (MOUTH.cx - 18) + "," + (MOUTH.cy - 6) + " Z"
        }
        fill={MOUTH_DARK}
      />
      <path
        d={
          "M" + (MOUTH.cx - 16) + "," + (MOUTH.cy - 5) + " Q" + MOUTH.cx + "," + (MOUTH.cy - 8) + " " + (MOUTH.cx + 16) + "," + (MOUTH.cy - 5) +
          " L" + (MOUTH.cx + 15) + "," + (MOUTH.cy + 2) + " Q" + MOUTH.cx + "," + (MOUTH.cy + 5) + " " + (MOUTH.cx - 15) + "," + (MOUTH.cy + 2) + " Z"
        }
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
      d={"M" + (MOUTH.cx - 15) + "," + (MOUTH.cy + 9) + " Q" + MOUTH.cx + "," + (MOUTH.cy - 5) + " " + (MOUTH.cx + 15) + "," + (MOUTH.cy + 9)}
      stroke="#6b2b3d"
      strokeWidth={5}
      strokeLinecap="round"
      fill="none"
    />
  ),

  sad: () => (
    <g>
      <path
        d={"M" + (MOUTH.cx - 15) + "," + (MOUTH.cy + 10) + " Q" + MOUTH.cx + "," + (MOUTH.cy - 6) + " " + (MOUTH.cx + 15) + "," + (MOUTH.cy + 10)}
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
