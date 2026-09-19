import type { ReactElement } from "react";
import { ARM, FOOT, LEG, MOTIF, TORSO, along, shade } from "./bodyGeometry";

export interface TopProps {
  colour: string;
  skin: string;
  motif: ReactElement | null;
  /** Unique per rendered avatar, so SVG clip ids do not collide between previews. */
  uid: string;
}

export interface GarmentProps {
  colour: string;
}

function limb(
  line: { x1: number; y1: number; x2: number; y2: number },
  width: number,
  colour: string,
  key?: string
): ReactElement {
  return (
    <line
      key={key}
      x1={line.x1}
      y1={line.y1}
      x2={line.x2}
      y2={line.y2}
      stroke={colour}
      strokeWidth={width}
      strokeLinecap="round"
    />
  );
}

/** The open collar — a bit of skin showing at the neckline stops tops looking like bibs. */
function collar(skin: string): ReactElement {
  return <ellipse cx={100} cy={152} rx={12} ry={6.5} fill={skin} />;
}

const SLEEVE_W = ARM.width + 6;

export const TOP_STYLES: Record<string, (p: TopProps) => ReactElement> = {
  tshirt: (p) => (
    <g>
      {limb(along(ARM.left, ARM.shortSleeveEnd), SLEEVE_W, p.colour, "sl")}
      {limb(along(ARM.right, ARM.shortSleeveEnd), SLEEVE_W, p.colour, "sr")}
      <path d={TORSO.path} fill={p.colour} />
      {collar(p.skin)}
      {p.motif}
    </g>
  ),

  tank: (p) => (
    <g>
      <path d={TORSO.path} fill={p.colour} />
      {/* Cut the straps in by overlaying skin at the shoulders. */}
      <path d="M67,158 C67,146 82,143 88,150 L84,172 Q72,170 69,176 Z" fill={p.skin} />
      <path d="M133,158 C133,146 118,143 112,150 L116,172 Q128,170 131,176 Z" fill={p.skin} />
      {collar(p.skin)}
      {p.motif}
    </g>
  ),

  hoodie: (p) => (
    <g>
      {/* Hood sits behind the head, which is drawn later, so it reads as a collar. */}
      <path
        d="M52,172 C44,128 68,106 100,106 C132,106 156,128 148,172 Q100,186 52,172 Z"
        fill={shade(p.colour, -22)}
      />
      {limb(ARM.left, SLEEVE_W, p.colour, "sl")}
      {limb(ARM.right, SLEEVE_W, p.colour, "sr")}
      <path d={TORSO.path} fill={p.colour} />
      <path
        d="M74,206 h52 a6,6 0 0 1 6,7 l-4,17 a7,7 0 0 1 -7,6 h-42 a7,7 0 0 1 -7,-6 l-4,-17 a6,6 0 0 1 6,-7 z"
        fill={shade(p.colour, -24)}
      />
      <path d="M92,156 l-3,26 M108,156 l3,26" stroke="#fffdfa" strokeWidth={3.5} strokeLinecap="round" />
      <circle cx={89} cy={184} r={3.4} fill="#fffdfa" />
      <circle cx={111} cy={184} r={3.4} fill="#fffdfa" />
      {collar(p.skin)}
    </g>
  ),

  stripes: (p) => (
    <g>
      <defs>
        <clipPath id={"torso-" + p.uid}>
          <path d={TORSO.path} />
        </clipPath>
      </defs>
      {limb(ARM.left, SLEEVE_W, p.colour, "sl")}
      {limb(ARM.right, SLEEVE_W, p.colour, "sr")}
      <path d={TORSO.path} fill={p.colour} />
      <g clipPath={"url(#torso-" + p.uid + ")"}>
        {[164, 186, 208, 230].map((y) => (
          <rect key={y} x={60} y={y} width={80} height={11} fill="#fffdfa" opacity={0.92} />
        ))}
      </g>
      {collar(p.skin)}
    </g>
  ),

  dress: (p) => (
    <g>
      {limb(along(ARM.left, 0.3), SLEEVE_W, p.colour, "sl")}
      {limb(along(ARM.right, 0.3), SLEEVE_W, p.colour, "sr")}
      <path
        d="M67,158 C67,146 133,146 133,158 L130,234 L154,304 Q100,324 46,304 L70,234 Z"
        fill={p.colour}
      />
      <path d="M70,234 L130,234 L132,245 L68,245 Z" fill={shade(p.colour, -28)} />
      {collar(p.skin)}
      {p.motif}
    </g>
  ),

  partyDress: (p) => (
    <g>
      <path
        d="M67,158 C67,146 133,146 133,158 L129,230 L162,306 Q148,300 138,310 Q124,300 112,310 Q100,300 88,310 Q76,300 62,310 Q52,300 38,306 L71,230 Z"
        fill={p.colour}
      />
      <path d="M71,230 L129,230 L131,242 L69,242 Z" fill="#ffd23f" />
      <circle cx={100} cy={236} r={7} fill="#ffe89a" />
      {[
        [78, 268],
        [122, 272],
        [100, 290],
        [60, 292],
        [140, 288],
      ].map(([cx, cy], i) => (
        <path
          key={i}
          d={
            "M" + cx + "," + (cy - 6) +
            " l1.8,4.2 4.2,1.8 -4.2,1.8 -1.8,4.2 -1.8,-4.2 -4.2,-1.8 4.2,-1.8 z"
          }
          fill="#fffdfa"
          opacity={0.85}
        />
      ))}
      {collar(p.skin)}
    </g>
  ),
};

/** Tops that cover the legs, so the bottoms slot is hidden while they are worn. */
export const COVERS_LEGS = new Set(["dress", "partyDress"]);

const BOTTOM_W = LEG.width + 5;

export const BOTTOM_STYLES: Record<string, (p: GarmentProps) => ReactElement> = {
  jeans: (p) => (
    <g>
      {limb(LEG.left, BOTTOM_W, p.colour, "ll")}
      {limb(LEG.right, BOTTOM_W, p.colour, "lr")}
      <path d="M68,238 L132,238 L135,270 Q100,281 65,270 Z" fill={p.colour} />
      <path d="M100,250 v34" stroke={shade(p.colour, -30)} strokeWidth={3} strokeLinecap="round" />
    </g>
  ),

  leggings: (p) => (
    <g>
      {limb(LEG.left, LEG.width + 1, p.colour, "ll")}
      {limb(LEG.right, LEG.width + 1, p.colour, "lr")}
      <path d="M69,238 L131,238 L133,268 Q100,279 67,268 Z" fill={p.colour} />
    </g>
  ),

  shorts: (p) => (
    <g>
      {limb(along(LEG.left, 0.42), BOTTOM_W + 2, p.colour, "ll")}
      {limb(along(LEG.right, 0.42), BOTTOM_W + 2, p.colour, "lr")}
      <path d="M68,238 L132,238 L135,272 Q100,283 65,272 Z" fill={p.colour} />
    </g>
  ),

  skirt: (p) => (
    <g>
      <path d="M68,238 L132,238 L152,298 Q100,316 48,298 Z" fill={p.colour} />
      <path d="M68,238 L132,238 L133,250 L67,250 Z" fill={shade(p.colour, -30)} />
    </g>
  ),
};

/**
 * Shoes are drawn once in local coordinates with the toe pointing +x, then mirrored for the
 * left foot. Drawing each shoe twice by hand is how you end up with two right feet.
 */
function pair(render: (key: string) => ReactElement): ReactElement {
  return (
    <g>
      {([
        [FOOT.leftCx, -1],
        [FOOT.rightCx, 1],
      ] as Array<[number, number]>).map(([cx, dir]) => (
        <g key={cx} transform={"translate(" + cx + " " + FOOT.cy + ") scale(" + dir + " 1)"}>
          {render("s" + cx)}
        </g>
      ))}
    </g>
  );
}

export const SHOE_STYLES: Record<string, (p: GarmentProps) => ReactElement> = {
  trainers: (p) =>
    pair((k) => (
      <g key={k}>
        <path d="M-12,-16 L2,-16 Q19,-14 23,-3 L23,3 L-14,3 Q-16,-8 -12,-16 Z" fill={p.colour} />
        <rect x={-16} y={1} width={40} height={10} rx={5} fill="#fffdfa" />
        <path d="M-5,-3 Q7,-9 18,-5" stroke="#fffdfa" strokeWidth={3.6} strokeLinecap="round" fill="none" />
        <rect x={-13} y={-18} width={17} height={7} rx={3.5} fill={shade(p.colour, 38)} />
      </g>
    )),

  boots: (p) =>
    pair((k) => (
      <g key={k}>
        <rect x={-12} y={-48} width={26} height={42} rx={8} fill={p.colour} />
        <path d="M-12,-13 L2,-13 Q18,-11 21,-2 L21,3 L-14,3 Q-15,-6 -12,-13 Z" fill={p.colour} />
        <rect x={-15} y={1} width={37} height={10} rx={4.5} fill={shade(p.colour, -50)} />
        <rect x={-14} y={-50} width={30} height={8} rx={4} fill={shade(p.colour, 42)} />
      </g>
    )),

  flats: (p) =>
    pair((k) => (
      <g key={k}>
        <path d="M-11,-9 L0,-9 Q16,-8 20,0 L20,4 Q4,8 -13,4 Q-14,-4 -11,-9 Z" fill={p.colour} />
        <path d="M9,-6 l4,-3 4,3 -4,3 z" fill="#fffdfa" />
      </g>
    )),
};

export const MOTIF_STYLES: Record<string, () => ReactElement> = {
  heart: () => (
    <path
      transform={"translate(" + MOTIF.cx + " " + MOTIF.cy + ") scale(1.05)"}
      d="M0,-4 C-5,-13 -18,-11 -18,-1 C-18,9 -6,15 0,22 C6,15 18,9 18,-1 C18,-11 5,-13 0,-4 Z"
      fill="#ff4d7e"
      stroke="#fffdfa"
      strokeWidth={2.5}
    />
  ),

  star: () => (
    <path
      transform={"translate(" + MOTIF.cx + " " + MOTIF.cy + ") scale(1.15)"}
      d="M0,-18 L5.3,-5.6 18.5,-4.4 8.5,4.3 11.4,17.2 0,10.4 -11.4,17.2 -8.5,4.3 -18.5,-4.4 -5.3,-5.6 Z"
      fill="#ffd23f"
      stroke="#fffdfa"
      strokeWidth={2.5}
    />
  ),

  rainbow: () => (
    <g transform={"translate(" + MOTIF.cx + " " + (MOTIF.cy + 8) + ")"}>
      {([
        ["#ff4d5e", 20],
        ["#ff9040", 15.5],
        ["#ffd23f", 11],
      ] as Array<[string, number]>).map(([c, r], i) => (
        <path
          key={i}
          d={"M" + -r + ",0 a" + r + "," + r + " 0 0 1 " + r * 2 + ",0"}
          stroke={c}
          strokeWidth={4.6}
          fill="none"
          strokeLinecap="round"
        />
      ))}
      <circle cx={0} cy={4} r={3} fill="#7fd4ff" />
    </g>
  ),

  flower: () => (
    <g transform={"translate(" + MOTIF.cx + " " + MOTIF.cy + ")"}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={0} cy={-11} rx={6.5} ry={9} fill="#fffdfa" transform={"rotate(" + a + ")"} />
      ))}
      <circle cx={0} cy={0} r={6.5} fill="#ffd23f" />
    </g>
  ),
};
