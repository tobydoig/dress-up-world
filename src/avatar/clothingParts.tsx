import type { ReactElement } from "react";
import {
  ARM,
  LEG,
  MOTIF,
  TORSO,
  along,
  footFor,
  legSegments,
  shade,
  type Pose,
  type Segment,
} from "./bodyGeometry";

export interface TopProps {
  colour: string;
  skin: string;
  motif: ReactElement | null;
  /** Unique per rendered avatar, so SVG clip ids do not collide between previews. */
  uid: string;
}

export interface GarmentProps {
  colour: string;
  /** Garments below the waist are built from the leg as it actually is in this pose. */
  pose: Pose;
}

/**
 * Sleeves are keyed "sl"/"sr" everywhere, so that key also decides which arm's class they
 * carry. A sleeve has to swing with the arm inside it, and the two are drawn in different
 * groups — the bare arm with the body, the sleeve with the top — so they can't share a
 * wrapper and have to be animated as a matched pair instead.
 */
const SLEEVE_ARM: Record<string, string> = { sl: "av-arm-l", sr: "av-arm-r" };

function limb(
  line: Segment,
  width: number,
  colour: string,
  key?: string
): ReactElement {
  return (
    <line
      key={key}
      className={key ? SLEEVE_ARM[key] : undefined}
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

/** Every tie is the same navy: it has to read as a tie against any shirt colour she picks. */
const TIE = "#2f3a6b";

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
      {/* Straps over the shoulders, then a scoop-necked body. Drawing the full torso and
          painting skin back over the shoulders gave the character a second set of shoulders. */}
      <rect x={76} y={150} width={11} height={34} rx={5.5} fill={p.colour} />
      <rect x={113} y={150} width={11} height={34} rx={5.5} fill={p.colour} />
      <path
        d="M70,176 Q100,192 130,176 L128,244 C128,254 72,254 72,244 Z"
        fill={p.colour}
      />
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

  /** Soft and floaty: a yoke across the shoulders and a pointed collar sitting on it. */
  blouse: (p) => (
    <g>
      {limb(along(ARM.left, 0.6), SLEEVE_W, p.colour, "sl")}
      {limb(along(ARM.right, 0.6), SLEEVE_W, p.colour, "sr")}
      <path d={TORSO.path} fill={p.colour} />
      <path d="M67,158 C67,146 133,146 133,158 L131,173 Q100,183 69,173 Z" fill={shade(p.colour, 18)} />
      {collar(p.skin)}
      <path d="M88,148 L100,171 L92,150 Z" fill={shade(p.colour, 30)} />
      <path d="M112,148 L100,171 L108,150 Z" fill={shade(p.colour, 30)} />
      {p.motif}
    </g>
  ),

  /** A proper shirt, buttoned to the top, with a tie down the front. */
  shirtTie: (p) => (
    <g>
      {limb(ARM.left, SLEEVE_W, p.colour, "sl")}
      {limb(ARM.right, SLEEVE_W, p.colour, "sr")}
      <path d={TORSO.path} fill={p.colour} />
      <rect x={95} y={158} width={10} height={88} fill={shade(p.colour, -14)} />
      {collar(p.skin)}
      <path d="M86,147 L100,167 L92,149 Z" fill={shade(p.colour, -24)} />
      <path d="M114,147 L100,167 L108,149 Z" fill={shade(p.colour, -24)} />
      <path d="M100,164 l-7,8 l7,10 l7,-10 z" fill={TIE} />
      <path d="M94,181 l6,-7 l6,7 l-3,44 q-3,6 -6,0 z" fill={TIE} />
      <path d="M95,194 l10,9 M95,209 l10,9" stroke={shade(TIE, 46)} strokeWidth={3} strokeLinecap="round" />
    </g>
  ),

  /** A suit jacket worn open, so the shirt and tie show in the V between the lapels. */
  jacket: (p) => (
    <g>
      {limb(ARM.left, SLEEVE_W + 3, p.colour, "sl")}
      {limb(ARM.right, SLEEVE_W + 3, p.colour, "sr")}
      <path d={TORSO.path} fill={p.colour} />
      {/* The shirt has to be wide enough to still read as white once the lapels are folded
          back over it and the tie is laid down the middle of what's left. */}
      <path d="M82,152 L100,216 L118,152 Z" fill="#fffdfa" />
      <path d="M100,170 l-6,7 l6,9 l6,-9 z" fill={TIE} />
      <path d="M95,185 l5,-6 l5,6 l-2,26 q-3,5 -6,0 z" fill={TIE} />
      <path d="M78,146 L100,213 L88,151 Z" fill={shade(p.colour, 24)} />
      <path d="M122,146 L100,213 L112,151 Z" fill={shade(p.colour, 24)} />
      <circle cx={105} cy={226} r={3.2} fill={shade(p.colour, 36)} />
      <rect x={76} y={218} width={17} height={4} rx={2} fill={shade(p.colour, -26)} />
      <rect x={107} y={218} width={17} height={4} rx={2} fill={shade(p.colour, -26)} />
      {collar(p.skin)}
    </g>
  ),
};

/** Tops that cover the legs, so the bottoms slot is hidden while they are worn. */
export const COVERS_LEGS = new Set(["dress", "partyDress"]);

const BOTTOM_W = LEG.width + 5;

/**
 * A trouser leg, drawn over however many segments the leg has in this pose. `reach` under 1 is
 * for shorts: standing that is a fraction of the whole leg, but sitting the thigh is all there
 * is above the knee, so short legwear simply covers it.
 */
function legLimbs(
  side: "left" | "right",
  pose: Pose,
  width: number,
  colour: string,
  reach = 1
): ReactElement[] {
  const segments = legSegments(side, pose);
  const drawn =
    reach >= 1 ? segments : pose === "sit" ? [segments[0]] : [along(segments[0], reach)];
  return drawn.map((segment, i) => limb(segment, width, colour, side + i));
}

/**
 * The pleated skirt's hem zigzags instead of curving, which is what makes it read as folded
 * fabric rather than a bell. Both the outline and the fold lines are generated from these, so
 * the creases always land exactly on the points of the hem.
 */
const HEM_LEFT = 48;
const HEM_RIGHT = 152;
const HEM_Y = 294;
const DROP = 12;
const TEETH = 8;
const PLEATS = [76, 88, 100, 112, 124];

/** The x of the i-th downward point of the hem, counting from the left. */
function pleatHemX(i: number): number {
  return HEM_LEFT + ((HEM_RIGHT - HEM_LEFT) * (i * 2 + 1)) / TEETH;
}

function pleatedSkirtPath(): string {
  let d = "M68,238 L132,238";
  // Walked right to left, so the hem joins back up with the left of the waistband.
  for (let i = TEETH; i >= 0; i--) {
    const x = HEM_LEFT + ((HEM_RIGHT - HEM_LEFT) * i) / TEETH;
    d += " L" + x.toFixed(1) + "," + (HEM_Y + (i % 2 === 1 ? DROP : 0));
  }
  return d + " Z";
}

export const BOTTOM_STYLES: Record<string, (p: GarmentProps) => ReactElement> = {
  jeans: (p) => (
    <g>
      {legLimbs("left", p.pose, BOTTOM_W, p.colour)}
      {legLimbs("right", p.pose, BOTTOM_W, p.colour)}
      <path d="M68,238 L132,238 L135,270 Q100,281 65,270 Z" fill={p.colour} />
      <path d="M100,250 v34" stroke={shade(p.colour, -30)} strokeWidth={3} strokeLinecap="round" />
    </g>
  ),

  leggings: (p) => (
    <g>
      {legLimbs("left", p.pose, LEG.width + 1, p.colour)}
      {legLimbs("right", p.pose, LEG.width + 1, p.colour)}
      <path d="M69,238 L131,238 L133,268 Q100,279 67,268 Z" fill={p.colour} />
    </g>
  ),

  shorts: (p) => (
    <g>
      {legLimbs("left", p.pose, BOTTOM_W + 2, p.colour, 0.42)}
      {legLimbs("right", p.pose, BOTTOM_W + 2, p.colour, 0.42)}
      <path d="M68,238 L132,238 L135,272 Q100,283 65,272 Z" fill={p.colour} />
    </g>
  ),

  skirt: (p) => (
    <g>
      <path d="M68,238 L132,238 L152,298 Q100,316 48,298 Z" fill={p.colour} />
      <path d="M68,238 L132,238 L133,250 L67,250 Z" fill={shade(p.colour, -30)} />
    </g>
  ),

  trousers: (p) => (
    <g>
      {legLimbs("left", p.pose, BOTTOM_W + 2, p.colour)}
      {legLimbs("right", p.pose, BOTTOM_W + 2, p.colour)}
      <path d="M66,238 L134,238 L137,272 Q100,284 63,272 Z" fill={p.colour} />
      <rect x={65} y={236} width={70} height={9} rx={3} fill={shade(p.colour, -34)} />
      <rect x={96} y={236} width={8} height={9} rx={2} fill={shade(p.colour, 28)} />
      {/* A crease down the front of each leg is what makes trousers look pressed — but only
          while the leg is straight enough to have one. */}
      {p.pose !== "sit" && (
        <path
          d="M85,266 L83,346 M115,266 L117,346"
          stroke={shade(p.colour, 26)}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      )}
    </g>
  ),

  pleatedSkirt: (p) => (
    <g>
      <path d={pleatedSkirtPath()} fill={p.colour} />
      {PLEATS.map((x, i) => (
        <path
          key={x}
          d={"M" + x + ",248 L" + pleatHemX(i) + "," + (HEM_Y + DROP) + ""}
          stroke={shade(p.colour, -26)}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      ))}
      <path d="M68,238 L132,238 L133,250 L67,250 Z" fill={shade(p.colour, -34)} />
    </g>
  ),

  pencilSkirt: (p) => (
    <g>
      <path d="M69,238 L131,238 L135,302 Q100,311 65,302 Z" fill={p.colour} />
      <rect x={68} y={236} width={64} height={10} rx={3} fill={shade(p.colour, -32)} />
      {/* The vent at the back — the detail that says "smart" rather than "summer". */}
      <path d="M100,288 v18" stroke={shade(p.colour, -26)} strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
};

/**
 * Shoes are drawn once in local coordinates with the toe pointing +x, then mirrored for the
 * left foot. Drawing each shoe twice by hand is how you end up with two right feet.
 *
 * The feet are passed in rather than read from FOOT, because sitting bends the knees and takes
 * them with it — shoes pinned to the standing position get left behind on the floor.
 */
function pair(pose: Pose, render: (key: string) => ReactElement): ReactElement {
  const foot = footFor(pose);
  return (
    <g>
      {([
        [foot.leftCx, -1],
        [foot.rightCx, 1],
      ] as Array<[number, number]>).map(([cx, dir]) => (
        // The class goes on an outer wrapper rather than on the positioned group: a CSS
        // transform replaces an element's transform attribute outright, so animating this
        // group directly would throw the shoe back to the origin.
        <g key={cx} className={dir < 0 ? "av-foot-l" : "av-foot-r"}>
          <g transform={"translate(" + cx + " " + foot.cy + ") scale(" + dir + " 1) translate(-4 0)"}>
            {render("s" + cx)}
          </g>
        </g>
      ))}
    </g>
  );
}

export const SHOE_STYLES: Record<string, (p: GarmentProps) => ReactElement> = {
  trainers: (p) =>
    pair(p.pose, (k) => (
      <g key={k}>
        <path d="M-15,-17 L2,-17 Q20,-15 24,-3 L24,3 L-16,3 Q-18,-8 -15,-17 Z" fill={p.colour} />
        <rect x={-18} y={1} width={44} height={10} rx={5} fill="#fffdfa" />
        <path d="M-5,-3 Q7,-9 18,-5" stroke="#fffdfa" strokeWidth={3.6} strokeLinecap="round" fill="none" />
        <rect x={-15} y={-19} width={22} height={8} rx={4} fill={shade(p.colour, 38)} />
      </g>
    )),

  boots: (p) =>
    pair(p.pose, (k) => (
      <g key={k}>
        {/* The shaft has to be wider than the trouser leg it swallows (BOTTOM_W is 32),
            otherwise the leg shows either side of the boot. */}
        <rect x={-18} y={-48} width={37} height={44} rx={9} fill={p.colour} />
        <path d="M-18,-14 L2,-14 Q20,-12 24,-2 L24,3 L-19,3 Q-20,-6 -18,-14 Z" fill={p.colour} />
        <rect x={-20} y={1} width={45} height={10} rx={4.5} fill={shade(p.colour, -50)} />
        <rect x={-20} y={-51} width={41} height={9} rx={4.5} fill={shade(p.colour, 42)} />
      </g>
    )),

  flats: (p) =>
    pair(p.pose, (k) => (
      <g key={k}>
        <path d="M-11,-9 L0,-9 Q16,-8 20,0 L20,4 Q4,8 -13,4 Q-14,-4 -11,-9 Z" fill={p.colour} />
        <path d="M9,-6 l4,-3 4,3 -4,3 z" fill="#fffdfa" />
      </g>
    )),
};

export interface MotifProps {
  colour: string;
}

/**
 * The picture on the front of a top. Each one is drawn around MOTIF so it lands on the chest
 * whatever the garment, and takes the colour she picked — except the rainbow, which has no one
 * colour to change without it stopping being a rainbow.
 */
export const MOTIF_STYLES: Record<string, (p: MotifProps) => ReactElement> = {
  heart: (p) => (
    <path
      transform={"translate(" + MOTIF.cx + " " + MOTIF.cy + ") scale(1.05)"}
      d="M0,-4 C-5,-13 -18,-11 -18,-1 C-18,9 -6,15 0,22 C6,15 18,9 18,-1 C18,-11 5,-13 0,-4 Z"
      fill={p.colour}
      stroke="#fffdfa"
      strokeWidth={2.5}
    />
  ),

  star: (p) => (
    <path
      transform={"translate(" + MOTIF.cx + " " + MOTIF.cy + ") scale(1.15)"}
      d="M0,-18 L5.3,-5.6 18.5,-4.4 8.5,4.3 11.4,17.2 0,10.4 -11.4,17.2 -8.5,4.3 -18.5,-4.4 -5.3,-5.6 Z"
      fill={p.colour}
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

  flower: (p) => (
    <g transform={"translate(" + MOTIF.cx + " " + MOTIF.cy + ")"}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={0} cy={-11} rx={6.5} ry={9} fill={p.colour} transform={"rotate(" + a + ")"} />
      ))}
      <circle cx={0} cy={0} r={6.5} fill="#ffd23f" />
    </g>
  ),

  butterfly: (p) => (
    <g transform={"translate(" + MOTIF.cx + " " + MOTIF.cy + ")"}>
      <ellipse cx={-11} cy={-6} rx={9} ry={11} fill={p.colour} transform="rotate(-22 -11 -6)" />
      <ellipse cx={11} cy={-6} rx={9} ry={11} fill={p.colour} transform="rotate(22 11 -6)" />
      <ellipse cx={-9} cy={9} rx={7} ry={8} fill={shade(p.colour, -34)} transform="rotate(-14 -9 9)" />
      <ellipse cx={9} cy={9} rx={7} ry={8} fill={shade(p.colour, -34)} transform="rotate(14 9 9)" />
      <rect x={-1.7} y={-13} width={3.4} height={28} rx={1.7} fill="#3a3346" />
      <path
        d="M-1,-13 q-4,-7 -8,-9 M1,-13 q4,-7 8,-9"
        stroke="#3a3346"
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
    </g>
  ),

  cat: (p) => (
    <g transform={"translate(" + MOTIF.cx + " " + MOTIF.cy + ")"}>
      <path d="M-15,-7 l-3,-14 l13,7 z" fill={p.colour} />
      <path d="M15,-7 l3,-14 l-13,7 z" fill={p.colour} />
      <circle cx={0} cy={2} r={15} fill={p.colour} />
      <circle cx={-6} cy={0} r={2.4} fill="#2b2b3a" />
      <circle cx={6} cy={0} r={2.4} fill="#2b2b3a" />
      <path d="M-3,6 l3,3 l3,-3 z" fill="#ff8fc0" />
      <path
        d="M-8,7 l-8,-2 M-8,10 l-7,3 M8,7 l8,-2 M8,10 l7,3"
        stroke="#fffdfa"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </g>
  ),

  sun: (p) => (
    <g transform={"translate(" + MOTIF.cx + " " + MOTIF.cy + ")"}>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <rect
          key={a}
          x={-2}
          y={-20}
          width={4}
          height={8}
          rx={2}
          fill={p.colour}
          transform={"rotate(" + a + ")"}
        />
      ))}
      <circle cx={0} cy={0} r={11} fill={p.colour} />
      <circle cx={-3.5} cy={-1} r={1.7} fill="#3a3346" />
      <circle cx={3.5} cy={-1} r={1.7} fill="#3a3346" />
      <path d="M-4,4 q4,4 8,0" stroke="#3a3346" strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </g>
  ),

  moon: (p) => (
    <g transform={"translate(" + MOTIF.cx + " " + MOTIF.cy + ")"}>
      <path d="M5,-15 A15,15 0 1 0 5,15 A12,12 0 1 1 5,-15 Z" fill={p.colour} />
      <path d="M13,-14 l1.6,3.8 3.8,1.6 -3.8,1.6 -1.6,3.8 -1.6,-3.8 -3.8,-1.6 3.8,-1.6 z" fill="#fffdfa" />
      <path d="M15,4 l1.2,2.8 2.8,1.2 -2.8,1.2 -1.2,2.8 -1.2,-2.8 -2.8,-1.2 2.8,-1.2 z" fill="#fffdfa" />
    </g>
  ),

  cloud: (p) => (
    <g transform={"translate(" + MOTIF.cx + " " + (MOTIF.cy - 3) + ")"}>
      <circle cx={-9} cy={0} r={9} fill={p.colour} />
      <circle cx={3} cy={-5} r={11} fill={p.colour} />
      <circle cx={13} cy={1} r={8} fill={p.colour} />
      <rect x={-13} y={0} width={27} height={9} rx={4.5} fill={p.colour} />
      {[-8, 1, 10].map((x, i) => (
        <path
          key={x}
          d={"M" + x + "," + (13 + i % 2 * 3) + " l-2.5,7 a2.5,2.5 0 0 0 5,0 z"}
          fill={shade(p.colour, 46)}
        />
      ))}
    </g>
  ),

  lightning: (p) => (
    <path
      transform={"translate(" + MOTIF.cx + " " + MOTIF.cy + ")"}
      d="M5,-20 L-10,3 L-1,3 L-5,20 L12,-4 L3,-4 Z"
      fill={p.colour}
      stroke="#fffdfa"
      strokeWidth={2.2}
      strokeLinejoin="round"
    />
  ),

  iceCream: (p) => (
    <g transform={"translate(" + MOTIF.cx + " " + MOTIF.cy + ")"}>
      <path d="M-9,1 L9,1 L0,21 Z" fill="#e8ab5c" />
      <path d="M-5,5 l6,6 M2,4 l5,5" stroke="#c98a3f" strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={-4} cy={-5} r={8.5} fill={p.colour} />
      <circle cx={5} cy={-7} r={8} fill={shade(p.colour, 40)} />
      <circle cx={2} cy={-17} r={3.4} fill="#ff4d5e" />
      <path d="M2,-20 q3,-4 6,-3" stroke="#3fae5a" strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </g>
  ),

  music: (p) => (
    <g transform={"translate(" + MOTIF.cx + " " + MOTIF.cy + ")"}>
      <ellipse cx={-8} cy={13} rx={7.5} ry={5.8} transform="rotate(-20 -8 13)" fill={p.colour} />
      <rect x={-1.6} y={-17} width={3.6} height={31} fill={p.colour} />
      <path d="M2,-17 q13,3 13,13 q-4,-8 -13,-7 z" fill={p.colour} />
      <path d="M2,-6 q13,3 13,13 q-4,-8 -13,-7 z" fill={shade(p.colour, -30)} />
    </g>
  ),
};
