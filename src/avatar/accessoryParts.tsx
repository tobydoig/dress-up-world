import type { ReactElement } from "react";
import { EAR, EYE, shade } from "./bodyGeometry";

export interface AccessoryProps {
  colour: string;
}

/**
 * Accessories draw AFTER the front hair layer, so a hairband sits on top of the hair rather
 * than disappearing under it. Head pieces hug the crown arc (the head is r=54 at 100,88, and
 * the hair crown reaches out to roughly x=34..166), so these are sized to sit just outside it.
 */
export const HEAD_STYLES: Record<string, (p: AccessoryProps) => ReactElement> = {
  hairband: (p) => (
    <path
      d="M42,86 C44,40 156,40 158,86 L150,86 C148,52 52,52 50,86 Z"
      fill={p.colour}
      stroke={shade(p.colour, -40)}
      strokeWidth={1.5}
    />
  ),

  bow: (p) => (
    <g transform="translate(140 46) rotate(16)">
      <path d="M0,0 C-8,-14 -30,-12 -30,0 C-30,12 -8,14 0,0 Z" fill={p.colour} />
      <path d="M0,0 C8,-14 30,-12 30,0 C30,12 8,14 0,0 Z" fill={p.colour} />
      <circle cx={0} cy={0} r={7} fill={shade(p.colour, -34)} />
      <path d="M-4,6 l-6,18 M4,6 l6,18" stroke={p.colour} strokeWidth={5} strokeLinecap="round" />
    </g>
  ),

  crown: (p) => (
    <g>
      <path
        d="M62,58 L72,30 L86,50 L100,22 L114,50 L128,30 L138,58 Z"
        fill={p.colour}
        stroke={shade(p.colour, -45)}
        strokeWidth={1.5}
      />
      <rect x={60} y={56} width={80} height={11} rx={5.5} fill={shade(p.colour, -14)} />
      <circle cx={100} cy={40} r={4.5} fill="#ff4d7e" />
      <circle cx={76} cy={48} r={3.4} fill="#7fd4ff" />
      <circle cx={124} cy={48} r={3.4} fill="#7fd4ff" />
    </g>
  ),

  catEars: (p) => (
    <g>
      <path d="M50,60 L58,16 L92,44 Z" fill={p.colour} />
      <path d="M150,60 L142,16 L108,44 Z" fill={p.colour} />
      <path d="M60,52 L64,28 L82,44 Z" fill="#ff8fb8" />
      <path d="M140,52 L136,28 L118,44 Z" fill="#ff8fb8" />
      <path d="M42,86 C44,44 156,44 158,86 L150,86 C148,56 52,56 50,86 Z" fill={p.colour} />
    </g>
  ),

  flower: (p) => (
    <g transform="translate(138 52)">
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={0} cy={-11} rx={7} ry={10} fill={p.colour} transform={"rotate(" + a + ")"} />
      ))}
      <circle cx={0} cy={0} r={6.5} fill="#ffd23f" />
    </g>
  ),

  sunHat: (p) => (
    <g>
      <ellipse cx={100} cy={62} rx={78} ry={19} fill={p.colour} />
      <path d="M62,60 C62,22 138,22 138,60 Z" fill={shade(p.colour, 16)} />
      <rect x={61} y={50} width={78} height={11} rx={5.5} fill={shade(p.colour, -40)} />
    </g>
  ),
};

export const GLASSES_STYLES: Record<string, (p: AccessoryProps) => ReactElement> = {
  round: (p) => (
    <g fill="none" stroke={p.colour} strokeWidth={4}>
      <circle cx={EYE.leftCx} cy={EYE.cy} r={15} fill="#ffffff" fillOpacity={0.22} />
      <circle cx={EYE.rightCx} cy={EYE.cy} r={15} fill="#ffffff" fillOpacity={0.22} />
      <path d={"M" + (EYE.leftCx + 15) + "," + EYE.cy + " h" + (EYE.rightCx - EYE.leftCx - 30)} />
      <path d={"M" + (EYE.leftCx - 15) + "," + EYE.cy + " L48,90 M" + (EYE.rightCx + 15) + "," + EYE.cy + " L152,90"} />
    </g>
  ),

  square: (p) => (
    <g fill="none" stroke={p.colour} strokeWidth={4}>
      <rect x={EYE.leftCx - 16} y={EYE.cy - 13} width={32} height={26} rx={7} fill="#ffffff" fillOpacity={0.22} />
      <rect x={EYE.rightCx - 16} y={EYE.cy - 13} width={32} height={26} rx={7} fill="#ffffff" fillOpacity={0.22} />
      <path d={"M" + (EYE.leftCx + 16) + "," + EYE.cy + " h" + (EYE.rightCx - EYE.leftCx - 32)} />
      <path d={"M" + (EYE.leftCx - 16) + "," + EYE.cy + " L48,90 M" + (EYE.rightCx + 16) + "," + EYE.cy + " L152,90"} />
    </g>
  ),

  sunnies: (p) => (
    <g>
      <path
        d={
          "M" + (EYE.leftCx - 17) + "," + (EYE.cy - 12) + " h34 v12 q0,13 -17,13 q-17,0 -17,-13 z " +
          "M" + (EYE.rightCx - 17) + "," + (EYE.cy - 12) + " h34 v12 q0,13 -17,13 q-17,0 -17,-13 z"
        }
        fill={p.colour}
      />
      <path
        d={"M" + (EYE.leftCx + 17) + "," + (EYE.cy - 8) + " h" + (EYE.rightCx - EYE.leftCx - 34)}
        stroke={p.colour}
        strokeWidth={5}
      />
      <path
        d={"M" + (EYE.leftCx - 17) + "," + (EYE.cy - 9) + " L48,88 M" + (EYE.rightCx + 17) + "," + (EYE.cy - 9) + " L152,88"}
        stroke={p.colour}
        strokeWidth={4}
        fill="none"
      />
    </g>
  ),

  heartSunnies: (p) => (
    <g>
      {[EYE.leftCx, EYE.rightCx].map((cx) => (
        <path
          key={cx}
          transform={"translate(" + cx + " " + (EYE.cy - 6) + ") scale(0.85)"}
          d="M0,-4 C-5,-13 -18,-11 -18,-1 C-18,9 -6,15 0,22 C6,15 18,9 18,-1 C18,-11 5,-13 0,-4 Z"
          fill={p.colour}
        />
      ))}
      <path
        d={"M" + (EYE.leftCx + 14) + "," + (EYE.cy - 6) + " h" + (EYE.rightCx - EYE.leftCx - 28)}
        stroke={p.colour}
        strokeWidth={5}
      />
    </g>
  ),
};

/**
 * Jewellery sets: one tap gives a coordinated look rather than making a nine-year-old assemble
 * a necklace and earrings separately.
 */
export const JEWEL_STYLES: Record<string, (p: AccessoryProps) => ReactElement> = {
  pendant: (p) => (
    <g>
      <path d="M84,152 Q100,170 116,152" stroke={p.colour} strokeWidth={3.2} fill="none" strokeLinecap="round" />
      <circle cx={100} cy={166} r={5.5} fill={p.colour} stroke={shade(p.colour, -45)} strokeWidth={1.2} />
    </g>
  ),

  heartNecklace: (p) => (
    <g>
      <path d="M84,152 Q100,170 116,152" stroke={p.colour} strokeWidth={3.2} fill="none" strokeLinecap="round" />
      <path
        transform="translate(100 168) scale(0.32)"
        d="M0,-4 C-5,-13 -18,-11 -18,-1 C-18,9 -6,15 0,22 C6,15 18,9 18,-1 C18,-11 5,-13 0,-4 Z"
        fill={p.colour}
      />
    </g>
  ),

  pearls: (p) => (
    <g fill={p.colour}>
      {[
        [86, 154], [91, 161], [96, 165], [100, 166], [104, 165], [109, 161], [114, 154],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={3.4} />
      ))}
    </g>
  ),

  hoops: (p) => (
    <g fill="none" stroke={p.colour} strokeWidth={3}>
      <circle cx={EAR.leftCx - 1} cy={EAR.cy + 12} r={7} />
      <circle cx={EAR.rightCx + 1} cy={EAR.cy + 12} r={7} />
    </g>
  ),

  studsAndChain: (p) => (
    <g>
      <circle cx={EAR.leftCx} cy={EAR.cy + 8} r={4} fill={p.colour} />
      <circle cx={EAR.rightCx} cy={EAR.cy + 8} r={4} fill={p.colour} />
      <path d="M84,152 Q100,168 116,152" stroke={p.colour} strokeWidth={3} fill="none" strokeLinecap="round" />
    </g>
  ),
};
