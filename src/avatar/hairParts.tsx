import type { ReactElement } from "react";
import { shade } from "./bodyGeometry";

export interface HairProps {
  colour: string;
}

/**
 * Hair is drawn in two layers: `back` sits behind the whole body (length falling past the
 * shoulders), `front` sits over the head circle (crown and fringe). Splitting them is what
 * stops long hair from looking glued to the front of the torso.
 *
 * The crown deliberately sits OUTSIDE the head circle (head is r=54 at 100,88 — these shapes
 * reach past x=34..166 and above y=24). Hair that exactly follows the skull reads as a swim
 * cap; real cartoon hair has volume and an uneven edge.
 */
export interface HairStyle {
  back: ((p: HairProps) => ReactElement) | null;
  front: (p: HairProps) => ReactElement;
}

/** A thin gloss streak following the crown — cheap way to stop flat fills looking like plastic. */
function gloss(d: string, colour: string): ReactElement {
  return <path d={d} stroke={shade(colour, 52)} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.3} />;
}

export const HAIR_STYLES: Record<string, HairStyle> = {
  long: {
    back: (p) => (
      <path
        d="M100,28 C154,28 172,70 170,116 C172,180 164,238 154,268 Q146,284 134,264
           Q118,244 100,256 Q82,268 66,264 Q54,284 46,268 C36,238 28,180 30,116
           C28,70 46,28 100,28 Z"
        fill={p.colour}
      />
    ),
    front: (p) => (
      <g>
        <path
          d="M100,24 C156,24 172,66 168,116 C167,128 164,136 161,142
             C163,112 156,84 140,72 C125,76 113,80 100,80 C87,80 75,76 60,66
             C44,84 37,112 39,142 C36,136 33,128 32,116 C28,66 44,24 100,24 Z"
          fill={p.colour}
        />
        {gloss("M70,42 C84,34 108,33 122,37", p.colour)}
      </g>
    ),
  },

  bob: {
    back: (p) => (
      <path
        d="M100,28 C152,28 168,68 166,112 C166,140 160,158 152,172 Q100,190 48,172
           C40,158 34,140 34,112 C32,68 48,28 100,28 Z"
        fill={p.colour}
      />
    ),
    front: (p) => (
      <g>
        <path
          d="M100,24 C154,24 170,64 166,112 C165,134 160,152 153,166
             C157,132 152,92 138,76 C122,80 112,84 100,84 C88,84 78,80 62,70
             C48,92 43,132 47,166 C40,152 35,134 34,112 C30,64 46,24 100,24 Z"
          fill={p.colour}
        />
        {gloss("M72,40 C86,32 110,31 124,36", p.colour)}
      </g>
    ),
  },

  bunches: {
    back: (p) => (
      <g>
        <circle cx={26} cy={112} r={29} fill={p.colour} />
        <circle cx={174} cy={112} r={29} fill={p.colour} />
        <circle cx={22} cy={128} r={20} fill={shade(p.colour, -14)} />
        <circle cx={178} cy={128} r={20} fill={shade(p.colour, -14)} />
        <path
          d="M100,28 C150,28 164,66 162,108 C162,130 158,142 152,152 Q100,168 48,152
             C42,142 38,130 38,108 C36,66 50,28 100,28 Z"
          fill={p.colour}
        />
      </g>
    ),
    front: (p) => (
      <g>
        <path
          d="M100,24 C152,24 168,62 164,106 C163,118 160,126 156,132
             C158,104 150,82 136,72 C120,90 112,86 100,78 C88,86 80,90 64,72
             C50,82 42,104 44,132 C40,126 37,118 36,106 C32,62 48,24 100,24 Z"
          fill={p.colour}
        />
        {gloss("M74,40 C88,32 110,32 124,37", p.colour)}
        <ellipse cx={46} cy={106} rx={8} ry={10} fill="#ff5fa8" />
        <ellipse cx={154} cy={106} rx={8} ry={10} fill="#ff5fa8" />
      </g>
    ),
  },

  curly: {
    back: (p) => (
      <g>
        {[
          [52, 48], [86, 30], [118, 30], [150, 50],
          [170, 82], [174, 116], [166, 148],
          [30, 82], [26, 116], [34, 148], [56, 168], [144, 168],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={28} fill={p.colour} />
        ))}
      </g>
    ),
    front: (p) => (
      <g>
        {[
          [60, 54], [90, 38], [122, 40], [148, 60], [158, 92], [42, 92],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={24} fill={p.colour} />
        ))}
        {[
          [74, 46], [104, 34], [134, 50],
        ].map(([cx, cy], i) => (
          <circle key={"g" + i} cx={cx} cy={cy} r={15} fill={shade(p.colour, 30)} opacity={0.55} />
        ))}
      </g>
    ),
  },

  ponytail: {
    back: (p) => (
      <g>
        <path
          d="M100,28 C150,28 166,66 164,110 C164,132 160,144 154,154 Q100,170 46,154
             C40,144 36,132 36,110 C34,66 50,28 100,28 Z"
          fill={p.colour}
        />
        <path
          d="M154,96 C192,106 202,156 188,206 C181,236 164,262 150,270 Q134,278 139,259
             C154,242 168,210 170,176 C172,144 163,118 146,108 Z"
          fill={p.colour}
        />
        <ellipse cx={160} cy={108} rx={12} ry={14} fill="#ffd23f" transform="rotate(-20 160 108)" />
      </g>
    ),
    front: (p) => (
      <g>
        <path
          d="M100,24 C152,24 168,62 164,108 C163,120 160,128 156,134
             C159,104 150,80 136,70 C118,90 104,84 92,76 C76,84 46,96 44,134
             C40,128 37,120 36,108 C32,62 48,24 100,24 Z"
          fill={p.colour}
        />
        {gloss("M72,40 C86,32 108,31 122,36", p.colour)}
      </g>
    ),
  },
};
