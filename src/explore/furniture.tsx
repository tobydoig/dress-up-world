import type { ReactElement } from "react";

/**
 * Furniture is drawn in room coordinates with the back wall bottom at y=232. These are the
 * positions a piece takes when it's first added; from there it can be dragged anywhere, and
 * only the offset from this authored spot is saved.
 */
export type FurnitureRender = () => ReactElement;

/**
 * How a piece is allowed to be placed. The default (everything not listed) is floor-standing:
 * its BASE must stay on the floor, while its top is free to reach up the wall — which is how a
 * wardrobe stands against a wall without floating.
 */

/** Hangs on the wall; never comes below the floor line. */
export const WALL_MOUNTED = new Set(["poster", "shelves"]);

/** Drifts about in the air, above the floor or the wall. */
export const FLOATING = new Set(["balloons"]);

/**
 * Lies flat on the floor. Constrained by its TOP edge rather than its base, because a rug whose
 * base is merely on the floor line still has the rest of itself spread up the wall.
 */
export const FLAT_ON_FLOOR = new Set(["playRug", "bedroomRug"]);

/** Small enough to put on top of other furniture, so the base may leave the floor. */
export const STACKABLE = new Set([
  "teddy", "plushie", "fruitBowl", "blocks", "bedsideLamp", "computer", "deskLamp", "plantSmall",
]);

const WOOD = "#b5763f";
const WOOD_DARK = "#8d5a2c";

/**
 * A side-on chair: back post with a rail, seat, and two legs. Drawn once in local coordinates
 * with the seat facing +x and mirrored for the chair on the other side of the table, so the
 * pair face each other. Legs end at local y=35, which places the base on the floor line.
 */
function chair(x: number, colour: string, facing: number): ReactElement {
  return (
    <g transform={"translate(" + x + " 197) scale(" + facing + " 1)"}>
      <rect x={-6} y={-52} width={11} height={60} rx={5.5} fill={colour} />
      {/* A cap centred on the post. An earlier version curved off to one side and read as a hook. */}
      <rect x={-10} y={-57} width={19} height={10} rx={5} fill={shade(colour, 16)} />
      <rect x={-6} y={0} width={39} height={10} rx={5} fill={shade(colour, 14)} />
      <rect x={25} y={8} width={8} height={27} rx={4} fill={shade(colour, -28)} />
      <rect x={-5} y={8} width={8} height={27} rx={4} fill={shade(colour, -28)} />
    </g>
  );
}

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((n >> 16) & 255) + amount);
  const g = clamp(((n >> 8) & 255) + amount);
  const b = clamp((n & 255) + amount);
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}

/**
 * The moment after a balloon goes pop: a starburst of spikes and curled rubber flying outward,
 * which animates away in half a second and leaves the bare strings behind. An earlier version
 * just swapped in some static shreds, which read as leaves rather than a pop.
 */
export const POPPED_BALLOONS: FurnitureRender = () => (
  <g>
    <path d="M356,150 q6,22 -3,42 M374,146 q-5,24 3,46" stroke="#ffffff" strokeWidth={2} opacity={0.5} fill="none" />
    {([
      [356, 136, "#ff4d7e"],
      [378, 128, "#3aa0ff"],
    ] as Array<[number, number, string]>).map(([cx, cy, colour]) => (
      <g key={cx} className="balloon-burst" style={{ transformOrigin: cx + "px " + cy + "px" }}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <path
            key={angle}
            transform={"translate(" + cx + " " + cy + ") rotate(" + angle + ")"}
            d="M8,0 L26,-4 L26,4 Z"
            fill={colour}
          />
        ))}
        {[22, 112, 205, 300].map((angle, i) => (
          <path
            key={"s" + angle}
            transform={"translate(" + cx + " " + cy + ") rotate(" + angle + ") translate(20 0)"}
            d="M0,0 q7,-6 13,0 q-6,7 -13,0 z"
            fill={i % 2 === 0 ? colour : "#ffffff"}
            opacity={0.9}
          />
        ))}
      </g>
    ))}
  </g>
);

/** The desk lamp is the one piece with a state of its own, so it isn't a plain render. */
export function deskLamp(on: boolean): ReactElement {
  return (
    <g>
      {on && <ellipse cx={300} cy={214} rx={54} ry={34} fill="#ffe89a" opacity={0.42} />}
      <ellipse cx={300} cy={230} rx={18} ry={6} fill="#5b6180" />
      <path d="M300,228 l-2,-34 l6,0 l-2,34 z" fill="#8b93b5" />
      <path d="M298,196 q0,-18 18,-24" stroke="#8b93b5" strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d="M302,166 l24,-8 l10,22 l-26,8 z" fill={on ? "#ffd23f" : "#9aa2c0"} />
      <circle cx={318} cy={182} r={5} fill={on ? "#fff6c9" : "#7d85a5"} />
    </g>
  );
}

export const FURNITURE: Record<string, FurnitureRender> = {
  // ---------------- play room ----------------
  toyBox: () => (
    <g>
      <rect x={20} y={186} width={78} height={46} rx={7} fill="#ff7aa8" />
      <rect x={16} y={176} width={86} height={16} rx={7} fill="#ff4d7e" />
      <circle cx={59} cy={210} r={7} fill="#ffd23f" />
      <path d="M34,200 h12 M72,200 h12" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
    </g>
  ),

  blocks: () => (
    <g>
      <rect x={116} y={210} width={22} height={22} rx={4} fill="#ff4d5e" />
      <rect x={140} y={210} width={22} height={22} rx={4} fill="#3aa0ff" />
      <rect x={128} y={188} width={22} height={22} rx={4} fill="#ffd23f" />
      <rect x={152} y={188} width={22} height={22} rx={4} fill="#5ed64a" />
      <rect x={140} y={166} width={22} height={22} rx={4} fill="#c77dff" />
    </g>
  ),

  teddy: () => (
    <g>
      <circle cx={318} cy={200} r={11} fill="#c98a5b" />
      <circle cx={309} cy={189} r={5.5} fill="#c98a5b" />
      <circle cx={327} cy={189} r={5.5} fill="#c98a5b" />
      <ellipse cx={318} cy={222} rx={15} ry={13} fill="#b5763f" />
      <ellipse cx={318} cy={224} rx={8} ry={7} fill="#e8c9a8" />
      <circle cx={314} cy={199} r={1.8} fill="#2b2b3a" />
      <circle cx={322} cy={199} r={1.8} fill="#2b2b3a" />
      <ellipse cx={318} cy={205} rx={3.4} ry={2.4} fill="#8d5a2c" />
    </g>
  ),

  easel: () => (
    <g>
      <path d="M244,232 L258,150 M300,232 L286,150" stroke={WOOD} strokeWidth={6} strokeLinecap="round" />
      <rect x={244} y={136} width={56} height={48} rx={4} fill="#fffdfa" stroke={WOOD_DARK} strokeWidth={3} />
      <path d="M254,172 q10,-22 20,-6 q8,-14 16,6 z" fill="#5ed64a" />
      <circle cx={264} cy={150} r={6} fill="#ffd23f" />
      <rect x={240} y={182} width={64} height={7} rx={3.5} fill={WOOD_DARK} />
    </g>
  ),

  balloons: () => (
    <g>
      <path d="M356,150 q6,30 -2,54 M374,146 q-4,32 2,58" stroke="#ffffff" strokeWidth={2} opacity={0.6} fill="none" />
      <ellipse cx={356} cy={136} rx={16} ry={19} fill="#ff4d7e" />
      <ellipse cx={378} cy={128} rx={14} ry={17} fill="#3aa0ff" />
      <ellipse cx={351} cy={130} rx={5} ry={6} fill="#ffffff" opacity={0.45} />
      <ellipse cx={373} cy={123} rx={4} ry={5} fill="#ffffff" opacity={0.45} />
    </g>
  ),

  playRug: () => (
    <g>
      <ellipse cx={200} cy={300} rx={120} ry={34} fill="#7b5cf6" opacity={0.85} />
      <ellipse cx={200} cy={300} rx={86} ry={24} fill="#9b7bff" />
      <ellipse cx={200} cy={300} rx={50} ry={14} fill="#c77dff" />
    </g>
  ),

  // ---------------- kitchen ----------------
  counter: () => (
    <g>
      <rect x={14} y={168} width={122} height={64} rx={6} fill="#e8e3f2" />
      <rect x={10} y={160} width={130} height={14} rx={7} fill="#b9b2cf" />
      <rect x={30} y={186} width={40} height={36} rx={4} fill="#cfc8e0" />
      <rect x={80} y={186} width={40} height={36} rx={4} fill="#cfc8e0" />
      <circle cx={64} cy={204} r={3} fill="#8b84a8" />
      <circle cx={86} cy={204} r={3} fill="#8b84a8" />
    </g>
  ),

  fridge: () => (
    <g>
      <rect x={330} y={116} width={58} height={116} rx={8} fill="#dfe6f0" />
      <rect x={330} y={116} width={58} height={40} rx={8} fill="#eef2f8" />
      <path d="M330,158 h58" stroke="#b9c2d0" strokeWidth={3} />
      <rect x={378} y={128} width={5} height={20} rx={2.5} fill="#98a3b5" />
      <rect x={378} y={168} width={5} height={26} rx={2.5} fill="#98a3b5" />
      <rect x={340} y={126} width={16} height={12} rx={2} fill="#ffd23f" />
      <circle cx={350} cy={180} r={7} fill="#ff6fae" />
    </g>
  ),

  diningTable: () => (
    <g>
      <rect x={150} y={198} width={116} height={11} rx={5.5} fill={WOOD} />
      <rect x={160} y={209} width={9} height={40} rx={4} fill={WOOD_DARK} />
      <rect x={247} y={209} width={9} height={40} rx={4} fill={WOOD_DARK} />
      <rect x={180} y={186} width={26} height={12} rx={3} fill="#3aa0ff" />
      <circle cx={232} cy={190} r={9} fill="#fffdfa" />
      <circle cx={232} cy={190} r={5} fill="#ff9040" />
    </g>
  ),

  chairLeft: () => chair(124, "#2ed6b8", 1),
  chairRight: () => chair(288, "#ff9040", -1),

  fruitBowl: () => (
    <g>
      <path d="M182,186 q22,16 44,0 z" fill="#c77dff" />
      <circle cx={196} cy={180} r={7} fill="#ff4d5e" />
      <circle cx={210} cy={177} r={7} fill="#ffd23f" />
      <circle cx={222} cy={181} r={6} fill="#5ed64a" />
    </g>
  ),

  kitchenPlant: () => (
    <g>
      <path d="M296,232 l5,-26 h20 l5,26 z" fill="#d98452" />
      <path
        d="M311,206 q-22,-6 -20,-30 q20,2 20,30 M311,206 q22,-8 22,-30 q-22,4 -22,30 M311,206 q-2,-24 0,-34 q4,12 2,34"
        fill="#3fae5a"
      />
    </g>
  ),

  // ---------------- study ----------------
  desk: () => (
    <g>
      <rect x={128} y={190} width={150} height={12} rx={6} fill={WOOD} />
      <rect x={134} y={202} width={10} height={30} rx={5} fill={WOOD_DARK} />
      <rect x={262} y={202} width={10} height={30} rx={5} fill={WOOD_DARK} />
      <rect x={196} y={202} width={76} height={30} rx={4} fill={shade(WOOD, 12)} />
      <rect x={204} y={210} width={60} height={5} rx={2.5} fill={WOOD_DARK} />
      <rect x={204} y={221} width={60} height={5} rx={2.5} fill={WOOD_DARK} />
    </g>
  ),

  computer: () => (
    <g>
      <rect x={168} y={140} width={72} height={48} rx={5} fill="#3a3a52" />
      <rect x={173} y={145} width={62} height={38} rx={3} fill="#1d1f38" />
      {/* The screen "runs" — a cheap loop of bars and a blinking cursor reads as a computer. */}
      <g className="screen-glow">
        <rect x={177} y={150} width={30} height={4} rx={2} fill="#4fe0c0" />
        <rect x={177} y={158} width={44} height={4} rx={2} fill="#7fb6ff" />
        <rect x={177} y={166} width={22} height={4} rx={2} fill="#ffd23f" />
        <rect x={177} y={174} width={36} height={4} rx={2} fill="#ff8fc0" />
      </g>
      <rect className="screen-cursor" x={215} y={173} width={7} height={6} fill="#4fe0c0" />
      <rect x={196} y={188} width={16} height={8} fill="#3a3a52" />
      <rect x={184} y={196} width={40} height={5} rx={2.5} fill="#2a2a40" />
    </g>
  ),

  bookcase: () => (
    <g>
      <rect x={20} y={100} width={86} height={132} rx={6} fill={WOOD} />
      <rect x={26} y={106} width={74} height={120} rx={3} fill={shade(WOOD, -30)} />
      {[112, 148, 184].map((y) => (
        <rect key={y} x={26} y={y} width={74} height={7} rx={3} fill={WOOD} />
      ))}
      {[
        [30, 118, "#ff4d5e"], [37, 118, "#ffd23f"], [44, 118, "#3aa0ff"], [51, 118, "#5ed64a"],
        [30, 154, "#c77dff"], [37, 154, "#2ed6b8"], [44, 154, "#ff9040"],
        [30, 190, "#7fb6ff"], [37, 190, "#ff6fae"], [44, 190, "#ffd23f"], [51, 190, "#5ed64a"],
      ].map(([x, y, c], i) => (
        <rect key={i} x={x as number} y={y as number} width={6} height={30} rx={1.5} fill={c as string} />
      ))}
    </g>
  ),

  shelves: () => (
    <g>
      <rect x={288} y={84} width={94} height={8} rx={4} fill={WOOD} />
      <rect x={288} y={126} width={94} height={8} rx={4} fill={WOOD} />
      {[
        [296, 60, "#ff6fae"], [304, 60, "#ffd23f"], [312, 60, "#3aa0ff"],
        [300, 102, "#5ed64a"], [308, 102, "#c77dff"],
      ].map(([x, y, c], i) => (
        <rect key={i} x={x as number} y={y as number} width={7} height={24} rx={2} fill={c as string} />
      ))}
      <ellipse cx={352} cy={76} rx={14} ry={9} fill="#3fae5a" />
      <path d="M345,84 l4,-8 h8 l4,8 z" fill="#d98452" />
      <circle cx={344} cy={120} r={8} fill="#ff9040" />
    </g>
  ),

  plantBig: () => (
    <g>
      <path d="M116,232 l7,-34 h30 l7,34 z" fill="#d98452" />
      <path d="M116,198 h44 l-2,10 h-40 z" fill={shade("#d98452", -30)} />
      <path
        d="M138,198 q-30,-10 -28,-44 q28,4 28,44 M138,198 q30,-12 30,-46 q-30,6 -30,46 M138,198 q-4,-38 0,-54 q6,20 2,54"
        fill="#3fae5a"
      />
    </g>
  ),

  plantSmall: () => (
    <g>
      <path d="M246,232 l4,-20 h18 l4,20 z" fill="#c77dff" />
      <path
        d="M259,212 q-16,-6 -15,-24 q15,3 15,24 M259,212 q16,-7 16,-24 q-16,4 -16,24"
        fill="#5ed64a"
      />
    </g>
  ),

  // ---------------- bedroom ----------------
  /** Side-on single bed: tall headboard at the left, low footboard at the right. */
  bed: () => (
    <g>
      <rect x={190} y={122} width={20} height={108} rx={9} fill={WOOD} />
      <rect x={194} y={130} width={12} height={58} rx={6} fill={shade(WOOD, -22)} />
      <rect x={366} y={170} width={18} height={60} rx={8} fill={WOOD} />
      <rect x={200} y={196} width={172} height={18} rx={6} fill={WOOD_DARK} />
      <rect x={202} y={176} width={168} height={24} rx={11} fill="#fffdfa" />
      <path d="M252,172 h108 a11,11 0 0 1 11,11 v10 a8,8 0 0 1 -8,8 H252 z" fill="#ff8fc0" />
      <rect x={250} y={172} width={122} height={9} rx={4.5} fill="#ffc2dc" />
      <rect x={210} y={164} width={54} height={22} rx={11} fill="#fffdfa" transform="rotate(-4 237 175)" />
      <rect x={204} y={214} width={10} height={18} rx={4} fill={WOOD_DARK} />
      <rect x={358} y={214} width={10} height={18} rx={4} fill={WOOD_DARK} />
    </g>
  ),

  wardrobe: () => (
    <g>
      <rect x={22} y={108} width={92} height={124} rx={7} fill={WOOD} />
      <rect x={30} y={118} width={36} height={104} rx={4} fill={WOOD_DARK} />
      <rect x={70} y={118} width={36} height={104} rx={4} fill={WOOD_DARK} />
      <circle cx={62} cy={170} r={3.4} fill="#ffd23f" />
      <circle cx={74} cy={170} r={3.4} fill="#ffd23f" />
    </g>
  ),

  bedsideLamp: () => (
    <g>
      <rect x={140} y={196} width={40} height={36} rx={5} fill={WOOD} />
      <rect x={148} y={206} width={24} height={9} rx={3} fill={WOOD_DARK} />
      <rect x={157} y={168} width={6} height={28} rx={3} fill="#8b84a8" />
      <path d="M144,168 l8,-22 h16 l8,22 z" fill="#ffd23f" />
      <ellipse cx={160} cy={172} rx={26} ry={9} fill="#ffe89a" opacity={0.35} />
    </g>
  ),

  poster: () => (
    <g>
      <rect x={236} y={60} width={62} height={56} rx={5} fill="#fffdfa" />
      <rect x={241} y={65} width={52} height={46} rx={3} fill="#7b5cf6" />
      <path
        transform="translate(267 88) scale(1.5)"
        d="M0,-9 L2.6,-2.8 9.2,-2.2 4.2,2.1 5.7,8.6 0,5.2 -5.7,8.6 -4.2,2.1 -9.2,-2.2 -2.6,-2.8 Z"
        fill="#ffd23f"
      />
    </g>
  ),

  plushie: () => (
    <g>
      <ellipse cx={300} cy={182} rx={13} ry={11} fill="#ffd23f" />
      <circle cx={300} cy={166} r={10} fill="#ffd23f" />
      <circle cx={292} cy={158} r={4.5} fill="#ffd23f" />
      <circle cx={308} cy={158} r={4.5} fill="#ffd23f" />
      <circle cx={297} cy={165} r={1.7} fill="#2b2b3a" />
      <circle cx={303} cy={165} r={1.7} fill="#2b2b3a" />
      <path d="M297,170 q3,3 6,0" stroke="#8d5a2c" strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </g>
  ),

  bedroomRug: () => (
    <g>
      <ellipse cx={170} cy={296} rx={104} ry={30} fill="#2ed6b8" opacity={0.8} />
      <ellipse cx={170} cy={296} rx={70} ry={20} fill="#66e6cf" />
    </g>
  ),
};
