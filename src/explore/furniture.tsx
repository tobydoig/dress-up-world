import type { CSSProperties, ReactElement } from "react";
import { STALL_STOCK, THINGS } from "../data/things";
import { CROPS, ripeness, type Crop } from "../data/growing";
import type { Stroke } from "../lib/storage";

/**
 * Furniture is drawn in room coordinates with the back wall bottom at y=232. These are the
 * positions a piece takes when it's first added; from there it can be dragged anywhere, and
 * only the offset from this authored spot is saved.
 *
 * A piece is handed everything it might remember about itself rather than reading state from
 * anywhere: which way round it is standing, whether it is open, whether its bulb is on, what
 * has been put inside it, and what has been drawn on it. Almost every piece ignores all of it.
 */
export interface FurnitureCtx {
  /** Quarter turns from the authored direction, 0-3. */
  facing: number;
  open: boolean;
  on: boolean;
  stored: string[];
  strokes: Stroke[];
  /** A growing bed: what is in it and how many waterings it has had. */
  planted: string | null;
  stage: number;
  /** Worked out by the room rather than here, so drawing stays a pure function of state. */
  thirsty: boolean;
  /** Which of its looks the piece is showing. What that means is up to the piece. */
  mode: number;
  /** Held over a plant that is about to get a drink. Worked out by the room, like `thirsty`. */
  pouring: boolean;
  /** Just been knocked about: balloons filling back up, blocks in a heap on the floor. */
  knocked: boolean;
}

export type FurnitureRender = (ctx: FurnitureCtx) => ReactElement;

/** A piece as it appears in the catalogue: shut, switched on, and empty. */
export const CATALOGUE_CTX: FurnitureCtx = {
  facing: 0,
  open: false,
  on: true,
  stored: [],
  strokes: [],
  planted: null,
  stage: 0,
  thirsty: false,
  mode: 0,
  pouring: false,
  knocked: false,
};

/**
 * How a piece is allowed to be placed. The default (everything not listed) is floor-standing:
 * its BASE must stay on the floor, while its top is free to reach up the wall — which is how a
 * wardrobe stands against a wall without floating.
 */

/** Hangs on the wall; never comes below the floor line. */
export const WALL_MOUNTED = new Set(["poster", "shelves", "pictureFrame", "cupboard", "wallUnits"]);

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
  "plushieBunny", "plushieDino", "plushieDuck",
]);

/** Pieces you can open and put things inside. Tapping one opens it. */
export const CONTAINERS = new Set([
  "fridge", "wardrobe", "toyBox", "cupboard", "drawers",
  "tallCupboard", "sideboard", "tallDrawers",
  "wallUnits", "baseUnits", "larder",
]);

/** Pieces that sell things. Tapping one opens its stall. */
export const STALLS = new Set(Object.keys(STALL_STOCK));

/** Tapping one looks through it. There is only ever anything to see after dark. */
export const SKYWATCH = new Set(["telescope"]);

/** Lamps you can switch on and off. */
export const LAMPS = new Set(["deskLamp", "bedsideLamp", "floorLamp"]);

/**
 * Pieces with more than one look to cycle through on a tap, and how many. A screen is the
 * obvious thing to fiddle with in a room, and it costs nothing to let her: nothing else in
 * the game changes, so it's a knob that is safe to turn as many times as she likes.
 */
export const MODE_COUNT: Record<string, number> = { computer: 4 };

export function modeCount(id: string): number {
  return MODE_COUNT[id] ?? 1;
}

/**
 * Chairs are the one kind of thing with four hand-drawn views, so they genuinely turn on the
 * spot: side on, facing you, side on the other way, and seen from behind. There is no 3D here
 * and no projection maths — just four drawings, which is how sprite art has always done it.
 */
export const ROTATABLE = new Set(["chairLeft", "chairRight"]);

/**
 * Pieces that only turn to face the other way, mirrored about this x in authored coordinates.
 * Worth it only where a piece is visibly asymmetric — mirroring a bookcase achieves nothing.
 */
export const FLIP_AXIS: Record<string, number> = {
  desk: 203,
  easel: 272,
  counter: 75,
  teddy: 318,
  plushie: 300,
};

/** How many distinct ways round a piece can stand. 1 means tapping it won't turn it. */
export function facingCount(id: string): number {
  if (ROTATABLE.has(id)) return 4;
  if (FLIP_AXIS[id] !== undefined) return 2;
  return 1;
}

/**
 * The glass, as a nested svg. A nested svg clips its contents to its own box for free, which
 * is what lets both of these scroll and fly off the edges without a clipPath — and without an
 * id that would collide with the same computer drawn in the catalogue at the same time.
 */
function glass(children: ReactElement): ReactElement {
  return (
    <svg x={176} y={148} width={56} height={32}>
      {children}
    </svg>
  );
}

/*
 * The can is raised clear of the rim of the bed and tipped: two plain SVG transform
 * attributes, with a CSS transition over the top to ease between them.
 *
 * Attributes rather than CSS transforms because rotate() in an attribute takes its pivot in
 * user units — the handle, in the same authored coordinates the can is drawn from, which
 * stays the handle however far the can has been dragged. The CSS equivalent has to go
 * through transform-box, and getting that wrong is what sent the water off the side of the
 * garden below. Where the can ends up therefore does not depend on the transition running
 * at all; the transition only decides how quickly it gets there.
 */
/*
 * High enough that the drops have somewhere to fall. The can is raised clear of the rim by
 * the rim's own height again, so the gap between spout and soil is about as tall as the bed
 * is — which is what makes the water visible before the rim hides it.
 */
const CAN_LIFT = 61;
const CAN_TIP = 32;
const CAN_PIVOT = "356 197";
const CAN_EASE = { transition: "transform 0.25s ease-out" };

/** Lines of something scrolling past, in the local coordinates of `glass`. */
const CODE_ROWS: Array<[number, number, string]> = [
  [0, 26, "#4fe0c0"],
  [5, 34, "#7fb6ff"],
  [5, 17, "#ffd23f"],
  [11, 22, "#ff8fc0"],
  [0, 30, "#4fe0c0"],
  [5, 13, "#7fb6ff"],
  [11, 25, "#ffd23f"],
];

const ROW_GAP = 7;

function screenCode(): ReactElement {
  // Two copies stacked, so when the first has scrolled exactly its own height out of the top
  // the second is sitting where it started and the jump back is invisible.
  const block = CODE_ROWS.length * ROW_GAP;
  return glass(
    <g className="screen-code" style={{ ["--screen-block" as string]: -block + "px" }}>
      {[0, 1].map((copy) =>
        CODE_ROWS.map(([indent, width, colour], i) => (
          <rect
            key={copy + ":" + i}
            x={indent}
            y={copy * block + i * ROW_GAP}
            width={width}
            height={3}
            rx={1.5}
            fill={colour}
          />
        ))
      )}
    </g>
  );
}

/** Stars flying out of the middle of the screen, which is the screensaver everyone remembers. */
const STAR_ANGLES = [8, 52, 96, 140, 184, 228, 272, 316, 30, 210];

function screenStars(): ReactElement {
  return glass(
    <g transform="translate(28 16)">
      {STAR_ANGLES.map((angle, i) => (
        <g key={angle + ":" + i} transform={"rotate(" + angle + ")"}>
          <circle
            className="screen-star"
            cx={0}
            cy={0}
            r={1.5}
            fill="#fffdfa"
            style={{ animationDelay: (i * 0.24).toFixed(2) + "s" }}
          />
        </g>
      ))}
    </g>
  );
}

/**
 * The water, drawn apart from the can that is pouring it.
 *
 * It cannot live inside the can: the can is drawn after the beds, so its drops fell down the
 * FRONT of the pot and the water looked like it was missing. As a layer of its own, put
 * behind the beds, a drop is hidden by the rim on the way down and so reads as going in.
 * It is given the can's own transform by whoever draws it, which is what keeps it under the
 * spout while the can is being carried about.
 *
 * The coordinates are the can's, with the lift and the tip already worked in — this is where
 * the rose actually is once the can is up and tipped over.
 */
export function canWater(): ReactElement {
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <ellipse
          key={i}
          className="can-drop"
          cx={381 + i * 4}
          cy={160}
          rx={1.8}
          ry={2.7}
          fill="#7fd4ff"
          style={{ animationDelay: (i * 0.21).toFixed(2) + "s" }}
        />
      ))}
    </g>
  );
}

/** Where a lit piece pools its light, in authored coordinates. */
export interface Glow {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export const LIGHT_GLOW: Record<string, Glow> = {
  deskLamp: { cx: 316, cy: 206, rx: 74, ry: 56 },
  bedsideLamp: { cx: 160, cy: 180, rx: 70, ry: 58 },
  floorLamp: { cx: 368, cy: 132, rx: 86, ry: 76 },
  // The fridge only lights up because its door is open, which is the whole charm of it.
  fridge: { cx: 359, cy: 174, rx: 52, ry: 62 },
};

/**
 * Whether a placed piece is currently giving off light. Asks for only the two fields it
 * actually reads, so a plain saved piece can be handed straight to it.
 */
export function isLit(id: string, state: { open: boolean; on: boolean }): boolean {
  if (id === "fridge") return state.open;
  return LAMPS.has(id) && state.on;
}

/** Where the things inside an open container are stacked up. */
export interface Slots {
  x: number;
  y: number;
  cols: number;
  rows: number;
  stepX: number;
  stepY: number;
  scale: number;
}

export const CONTAINER_SLOTS: Record<string, Slots> = {
  fridge: { x: 348, y: 144, cols: 2, rows: 3, stepX: 26, stepY: 32, scale: 0.52 },
  wardrobe: { x: 50, y: 182, cols: 2, rows: 1, stepX: 34, stepY: 0, scale: 0.62 },
  toyBox: { x: 38, y: 208, cols: 3, rows: 1, stepX: 24, stepY: 0, scale: 0.5 },
  cupboard: { x: 44, y: 122, cols: 3, rows: 1, stepX: 28, stepY: 0, scale: 0.52 },
  drawers: { x: 138, y: 190, cols: 3, rows: 1, stepX: 22, stepY: 0, scale: 0.44 },
  tallCupboard: { x: 48, y: 126, cols: 3, rows: 2, stepX: 26, stepY: 46, scale: 0.46 },
  sideboard: { x: 146, y: 196, cols: 4, rows: 1, stepX: 24, stepY: 0, scale: 0.42 },
  tallDrawers: { x: 240, y: 146, cols: 2, rows: 3, stepX: 26, stepY: 30, scale: 0.4 },
  wallUnits: { x: 152, y: 114, cols: 4, rows: 1, stepX: 26, stepY: 0, scale: 0.42 },
  baseUnits: { x: 146, y: 200, cols: 4, rows: 1, stepX: 32, stepY: 0, scale: 0.46 },
  larder: { x: 266, y: 124, cols: 2, rows: 3, stepX: 26, stepY: 36, scale: 0.42 },
};

export function capacityOf(id: string): number {
  const s = CONTAINER_SLOTS[id];
  return s ? s.cols * s.rows : 0;
}

/**
 * Where the i-th thing inside a container sits. The room draws the contents itself rather than
 * the piece drawing them, because each thing has to be draggable on its own — anything inside
 * the furniture's own group would drag the furniture instead.
 */
export function slotAt(id: string, i: number): { x: number; y: number; scale: number } | null {
  const s = CONTAINER_SLOTS[id];
  if (!s || i >= s.cols * s.rows) return null;
  return {
    x: s.x + (i % s.cols) * s.stepX,
    y: s.y + Math.floor(i / s.cols) * s.stepY,
    scale: s.scale,
  };
}

/**
 * Where a thing has to be let go for it to land inside an open container, in authored
 * coordinates. Deliberately the whole front of the piece rather than the shelves alone: a
 * child aims at the fridge, not at a particular shelf in it.
 */
export const CONTAINER_DROP: Record<string, { x: number; y: number; w: number; h: number }> = {
  fridge: { x: 330, y: 116, w: 58, h: 116 },
  wardrobe: { x: 22, y: 108, w: 92, h: 124 },
  toyBox: { x: 16, y: 170, w: 86, h: 62 },
  cupboard: { x: 18, y: 90, w: 104, h: 60 },
  drawers: { x: 114, y: 156, w: 88, h: 76 },
  tallCupboard: { x: 30, y: 108, w: 94, h: 124 },
  sideboard: { x: 130, y: 182, w: 110, h: 50 },
  tallDrawers: { x: 226, y: 126, w: 74, h: 106 },
  wallUnits: { x: 136, y: 86, w: 110, h: 58 },
  baseUnits: { x: 126, y: 168, w: 144, h: 64 },
  larder: { x: 248, y: 98, w: 72, h: 134 },
};

/* Fitted kitchen units are painted, not wooden — it is what tells them from the bedroom
   cupboards at a glance, which all look the same shape from across a room. */
const KITCHEN = "#e3ded2";
const STEEL = "#9aa2b8";

const WOOD = "#b5763f";
const WOOD_DARK = "#8d5a2c";

/**
 * An invisible pad across a piece that has holes in it — the gap under a stall's awning, the
 * space between a chair's back and its legs, everything either side of a lamp's stem. A tap
 * only reaches a shape that is actually inked, so without this a child aiming at the middle of
 * a stall taps straight through it into the room behind. `transparent` is a colour, unlike
 * `none`, so it still counts as painted for hit testing.
 */
function hitPad(x: number, y: number, w: number, h: number): ReactElement {
  return <rect x={x} y={y} width={w} height={h} fill="transparent" />;
}

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((n >> 16) & 255) + amount);
  const g = clamp(((n >> 8) & 255) + amount);
  const b = clamp((n & 255) + amount);
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}

/* ---------------- chairs, from four sides ---------------- */

/** Side on: back post with a cap, seat facing +x, two legs. Base sits at local y=35. */
function chairSide(colour: string): ReactElement {
  return (
    <g>
      {hitPad(-23, -58, 57, 93)}
      <rect x={-6} y={-52} width={11} height={60} rx={5.5} fill={colour} />
      {/* A cap centred on the post. An earlier version curved off to one side and read as a hook. */}
      <rect x={-10} y={-57} width={19} height={10} rx={5} fill={shade(colour, 16)} />
      <rect x={-6} y={0} width={39} height={10} rx={5} fill={shade(colour, 14)} />
      <rect x={25} y={8} width={8} height={27} rx={4} fill={shade(colour, -28)} />
      <rect x={-5} y={8} width={8} height={27} rx={4} fill={shade(colour, -28)} />
    </g>
  );
}

/** Turned towards you: the seat comes forward and the back stands behind it. */
function chairFront(colour: string): ReactElement {
  return (
    <g>
      {hitPad(-23, -58, 57, 93)}
      <rect x={-17} y={-52} width={34} height={48} rx={7} fill={shade(colour, -10)} />
      <rect x={-20} y={-57} width={40} height={10} rx={5} fill={shade(colour, 16)} />
      <rect x={-19} y={6} width={8} height={29} rx={4} fill={shade(colour, -28)} />
      <rect x={11} y={6} width={8} height={29} rx={4} fill={shade(colour, -28)} />
      <rect x={-22} y={-6} width={44} height={12} rx={6} fill={shade(colour, 14)} />
    </g>
  );
}

/** Turned away: the back panel hides the seat, with just its edge showing underneath. */
function chairBack(colour: string): ReactElement {
  return (
    <g>
      {hitPad(-23, -58, 57, 93)}
      <rect x={-22} y={-5} width={44} height={11} rx={5.5} fill={shade(colour, -4)} />
      <rect x={-19} y={6} width={8} height={29} rx={4} fill={shade(colour, -28)} />
      <rect x={11} y={6} width={8} height={29} rx={4} fill={shade(colour, -28)} />
      <rect x={-17} y={-52} width={34} height={50} rx={7} fill={colour} />
      <rect x={-20} y={-57} width={40} height={10} rx={5} fill={shade(colour, 16)} />
    </g>
  );
}

/**
 * Where each chair was authored, and which way it was facing — the pair either side of the
 * table start facing each other, and `facing` counts quarter turns from there.
 */
const CHAIR_BASE: Record<string, { x: number; colour: string; dir: number }> = {
  chairLeft: { x: 124, colour: "#2ed6b8", dir: 1 },
  chairRight: { x: 288, colour: "#ff9040", dir: -1 },
};

function chairTurn(base: { dir: number }, facing: number): number {
  return (facing + (base.dir < 0 ? 2 : 0)) % 4;
}

/** How far the seat is from the back post, side on. */
const SEAT_OUT = 13;

/**
 * How far the place you sit is from the chair's own anchor. Seen side on the seat sticks out
 * to one side of the back post; turned to face you or away it is centred — so a chair that is
 * turned moves the sitter with it.
 */
export function seatShift(id: string, facing: number): number {
  const base = CHAIR_BASE[id];
  if (!base) return 0;
  const turn = chairTurn(base, facing);
  return turn === 0 ? SEAT_OUT : turn === 2 ? -SEAT_OUT : 0;
}

/**
 * A chair in whichever of its four views it is currently showing.
 *
 * Whoever is sitting on it is always drawn AFTER it, never between its parts. The character is
 * drawn front-on whatever the chair is doing, so any piece of chair laid over her — a back
 * panel, a seat, a pair of front legs — just reads as her being stuck behind the furniture.
 */
function chair(id: string, facing: number): ReactElement {
  const base = CHAIR_BASE[id];
  if (!base) return <g />;
  const turn = chairTurn(base, facing);
  // Only the side view has a direction to mirror; the other two are symmetrical.
  const mirror = turn === 2 ? -1 : 1;
  const view =
    turn === 1 ? chairFront(base.colour) : turn === 3 ? chairBack(base.colour) : chairSide(base.colour);
  return <g transform={"translate(" + base.x + " 197) scale(" + mirror + " 1)"}>{view}</g>;
}

/* ---------------- the garden ---------------- */

const PLOT_W = 78;
/** The top of the soil. Everything growing is measured up from here. */
const SOIL = 206;

/** Where the beds are authored, which also gives each one its drop box. */
export const PLOT_X: Record<string, number> = { plotOne: 6, plotTwo: 92, plotThree: 178 };

export const PLOTS = new Set(Object.keys(PLOT_X));

export const WATERING_CAN = "wateringCan";

/**
 * The whole bed, from the top of a fully grown tree down to the front of the soil — not just
 * the earth. Once something is growing, the plant IS the bed as far as a child is concerned,
 * and a box that only covered the soil meant aiming the can at the leaves hit nothing.
 */
function plotBox(x: number): { x: number; y: number; w: number; h: number } {
  return { x: x - 6, y: 108, w: PLOT_W + 12, h: 124 };
}

export function plotDrop(id: string): { x: number; y: number; w: number; h: number } | null {
  const x = PLOT_X[id];
  return x === undefined ? null : plotBox(x);
}

/**
 * A breath of wind. Everything green leans on the spot; see `.plant-sway` for the pivot.
 *
 * Each plant starts at its own point in the cycle, because three beds in a row nodding in
 * time looks like one object rather than three plants. A tree takes longer over it than a
 * lettuce, which is most of what makes it read as the heavier thing.
 */
function sway(phase: number, heavy = false): CSSProperties {
  const seconds = heavy ? 5.6 : 4.2;
  return {
    animationDuration: seconds + "s",
    animationDelay: -(((phase % 3) + 3) % 3) * (seconds / 3) + "s",
  };
}

/** A low crop: a stem and leaves that get bigger, with the crop itself on once it is ripe. */
function bush(cx: number, grown: number, crop: Crop): ReactElement {
  const h = 8 + grown * 30;
  const leaf = 5 + grown * 8;
  return (
    <g>
      <path d={"M" + cx + "," + SOIL + " v" + -h} stroke="#2f8c46" strokeWidth={3} strokeLinecap="round" />
      <ellipse cx={cx - leaf} cy={SOIL - h * 0.5} rx={leaf} ry={leaf * 0.6} fill="#3fae5a" />
      <ellipse cx={cx + leaf} cy={SOIL - h * 0.72} rx={leaf * 0.9} ry={leaf * 0.55} fill="#5ed64a" />
      {grown >= 1 && (
        <g transform={"translate(" + cx + " " + (SOIL - h - 7) + ") scale(0.55)"}>
          {THINGS[crop.crop].art()}
        </g>
      )}
    </g>
  );
}

/** A tree: a trunk that thickens and a canopy that spreads, fruiting at the end. */
function tree(cx: number, grown: number, crop: Crop): ReactElement {
  const h = 10 + grown * 52;
  const canopy = 6 + grown * 22;
  return (
    <g>
      <rect x={cx - 2 - grown * 2} y={SOIL - h} width={4 + grown * 4} height={h} rx={2} fill="#8d5a2c" />
      <circle cx={cx} cy={SOIL - h} r={canopy} fill="#3fae5a" />
      <circle cx={cx - canopy * 0.55} cy={SOIL - h + canopy * 0.35} r={canopy * 0.66} fill="#2f8c46" />
      <circle cx={cx + canopy * 0.55} cy={SOIL - h + canopy * 0.28} r={canopy * 0.6} fill="#5ed64a" />
      {grown >= 1 &&
        ([-0.55, 0.45] as const).map((side) => (
          <g
            key={side}
            transform={
              "translate(" + (cx + canopy * side) + " " + (SOIL - h + canopy * 0.2) + ") scale(0.4)"
            }
          >
            {THINGS[crop.crop].art()}
          </g>
        ))}
    </g>
  );
}

function plot(x: number, c: FurnitureCtx): ReactElement {
  const crop = c.planted ? CROPS[c.planted] : null;
  const grown = crop ? ripeness(crop, c.stage) : 0;
  const cx = x + PLOT_W / 2;
  return (
    <g>
      {/* The same box the can and the seeds are tested against, so what looks
          tappable and what is tappable are the same thing. */}
      {(() => { const b = plotBox(x); return hitPad(b.x, b.y, b.w, b.h); })()}
      <path d={"M" + (x + 4) + ",232 L" + x + "," + SOIL + " h" + PLOT_W + " l-4,26 z"} fill="#6b4a2f" />
      <ellipse cx={cx} cy={SOIL} rx={PLOT_W / 2} ry={6} fill="#7d5a3a" />
      <rect x={x - 3} y={SOIL - 5} width={PLOT_W + 6} height={9} rx={4} fill="#8d5a2c" />

      {!crop && <ellipse cx={cx} cy={SOIL - 3} rx={8} ry={4} fill="#5c3f28" />}
      {crop && grown === 0 && <ellipse cx={cx} cy={SOIL - 4} rx={9} ry={5} fill="#5c3f28" />}
      {crop && grown > 0 && (
        <g className="plant-sway" style={sway(Object.values(PLOT_X).indexOf(x), crop.kind === "tree")}>
          {crop.kind === "tree" ? tree(cx, grown, crop) : bush(cx, grown, crop)}
        </g>
      )}

      {/* A drop, not a wilt. Nothing here suffers for being left — it just asks. */}
      {crop && c.thirsty && (
        <g className="wants-water" transform={"translate(" + cx + " 122)"}>
          <path d="M0,-10 q8,10 0,16 q-8,-6 0,-16 z" fill="#3aa0ff" />
          <ellipse cx={-2.5} cy={1} rx={1.8} ry={2.6} fill="#bfe6ff" />
        </g>
      )}
    </g>
  );
}

/* ---------------- market stalls ---------------- */

const STALL_W = 92;

/** A striped awning on two posts with a cloth-covered table, and its stock laid out on top. */
function stall(x: number, colour: string, stock: string[]): ReactElement {
  const step = (STALL_W - 20) / stock.length;
  return (
    <g transform={"translate(" + x + " 0)"}>
      {hitPad(-4, 112, STALL_W + 8, 120)}
      <rect x={7} y={138} width={6} height={94} rx={3} fill={WOOD_DARK} />
      <rect x={STALL_W - 13} y={138} width={6} height={94} rx={3} fill={WOOD_DARK} />
      <path d={"M2,192 h" + (STALL_W - 4) + " l-7,36 h-" + (STALL_W - 18) + " z"} fill={shade(colour, -30)} />
      <rect x={0} y={182} width={STALL_W} height={11} rx={5.5} fill={WOOD} />
      {stock.map((id, i) => {
        const thing = THINGS[id];
        if (!thing) return null;
        return (
          <g key={id} transform={"translate(" + (10 + step * (i + 0.5)) + " 170) scale(0.5)"}>
            {thing.art()}
          </g>
        );
      })}
      <path d={"M-4,140 q" + (STALL_W / 2 + 4) + ",-30 " + (STALL_W + 8) + ",0 z"} fill={colour} />
      {[0, 1, 2, 3].map((i) => (
        <path
          key={i}
          d={
            "M" + (-4 + (i * 2 + 1) * ((STALL_W + 8) / 8)) + ",140 " +
            "l" + ((STALL_W + 8) / 8) + ",0 " +
            "l-" + ((STALL_W + 8) / 14) + ",-16 z"
          }
          fill="#fffdfa"
          opacity={0.75}
        />
      ))}
      <path d={"M-4,140 h" + (STALL_W + 8)} stroke={shade(colour, -34)} strokeWidth={4} />
    </g>
  );
}

/**
 * The moment after a balloon goes pop: a starburst of spikes and curled rubber flying outward,
 * which animates away in half a second and leaves the bare strings behind. An earlier version
 * just swapped in some static shreds, which read as leaves rather than a pop.
 */
export const POPPED_BALLOONS = (): ReactElement => (
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

/**
 * The drawing pad's own coordinate space. The pad she draws on and the mount inside the frame
 * are the same shape, so a drawing just scales down into the picture without distorting.
 */
export const PAD = { w: 200, h: 150 };
const FRAME_ART = { x: 68, y: 79, w: 70, h: 52.5 };

export function padScale(): number {
  return FRAME_ART.w / PAD.w;
}

function drawingArt(strokes: Stroke[]): ReactElement {
  return (
    <g transform={"translate(" + FRAME_ART.x + " " + FRAME_ART.y + ") scale(" + padScale() + ")"}>
      {strokes.map((s, i) => (
        <polyline
          key={i}
          points={s.points.join(" ")}
          fill="none"
          stroke={s.colour}
          strokeWidth={s.width}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </g>
  );
}

export const FURNITURE: Record<string, FurnitureRender> = {
  // ---------------- play room ----------------
  toyBox: (c) => (
    <g>
      {c.open && <rect x={20} y={186} width={78} height={46} rx={7} fill="#7d3357" />}
      {!c.open && <rect x={20} y={186} width={78} height={46} rx={7} fill="#ff7aa8" />}
      {c.open ? (
        // Propped up above the opening. Swinging it right out to one side read as a stick
        // lying next to the box rather than a lid that had been lifted.
        <g transform="rotate(-13 59 172)">
          <rect x={16} y={164} width={86} height={15} rx={7} fill="#ff4d7e" />
        </g>
      ) : (
        <rect x={16} y={176} width={86} height={16} rx={7} fill="#ff4d7e" />
      )}
      {!c.open && (
        <g>
          <circle cx={59} cy={210} r={7} fill="#ffd23f" />
          <path d="M34,200 h12 M72,200 h12" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
        </g>
      )}
      {c.open && <rect x={18} y={184} width={82} height={7} rx={3.5} fill="#ff9ec4" />}
    </g>
  ),

  /*
   * A stack that falls over when tapped and builds itself back up a moment later. The same
   * five blocks throughout, moved by a transition rather than swapped for a second drawing
   * — that is what makes them fall AND rise, for the price of one set of positions.
   *
   * The higher a block starts, the further and later it goes, which is roughly what happens
   * and reads far better than all five sliding together.
   */
  blocks: (c) => (
    <g>
      {([
        [116, 210, "#ff4d5e", -16, 20, -24, 0],
        [140, 210, "#3aa0ff", 18, 20, 16, 0.04],
        [128, 188, "#ffd23f", -34, 42, -42, 0.08],
        [152, 188, "#5ed64a", 38, 42, 30, 0.12],
        [140, 166, "#c77dff", 8, 64, 56, 0.16],
      ] as Array<[number, number, string, number, number, number, number]>).map(
        ([x, y, fill, dx, dy, spin, wait]) => (
          <rect
            key={x + ":" + y}
            x={x}
            y={y}
            width={22}
            height={22}
            rx={4}
            fill={fill}
            className="block-piece"
            style={{
              transform: c.knocked ? "translate(" + dx + "px, " + dy + "px) rotate(" + spin + "deg)" : "none",
              transitionDelay: wait + "s",
            }}
          />
        )
      )}
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
      {hitPad(240, 136, 64, 96)}
      <path d="M244,232 L258,150 M300,232 L286,150" stroke={WOOD} strokeWidth={6} strokeLinecap="round" />
      <rect x={244} y={136} width={56} height={48} rx={4} fill="#fffdfa" stroke={WOOD_DARK} strokeWidth={3} />
      <path d="M254,172 q10,-22 20,-6 q8,-14 16,6 z" fill="#5ed64a" />
      <circle cx={264} cy={150} r={6} fill="#ffd23f" />
      <rect x={240} y={182} width={64} height={7} rx={3.5} fill={WOOD_DARK} />
    </g>
  ),

  balloons: (c) => (
    <g>
      <path d="M356,150 q6,30 -2,54 M374,146 q-4,32 2,58" stroke="#ffffff" strokeWidth={2} opacity={0.6} fill="none" />
      {/* Each balloon swells from the knot at its bottom while it is filling, so they come
          back by being blown up rather than by simply being there again. */}
      <g className={c.knocked ? "balloon-fill" : undefined}>
        <ellipse cx={356} cy={136} rx={16} ry={19} fill="#ff4d7e" />
        <ellipse cx={351} cy={130} rx={5} ry={6} fill="#ffffff" opacity={0.45} />
      </g>
      <g className={c.knocked ? "balloon-fill balloon-fill-late" : undefined}>
        <ellipse cx={378} cy={128} rx={14} ry={17} fill="#3aa0ff" />
        <ellipse cx={373} cy={123} rx={4} ry={5} fill="#ffffff" opacity={0.45} />
      </g>
    </g>
  ),

  playRug: () => (
    <g>
      <ellipse cx={200} cy={300} rx={120} ry={34} fill="#7b5cf6" opacity={0.85} />
      <ellipse cx={200} cy={300} rx={86} ry={24} fill="#9b7bff" />
      <ellipse cx={200} cy={300} rx={50} ry={14} fill="#c77dff" />
    </g>
  ),

  /** A frame with a blank mount you can draw on. Tapping it opens the drawing pad. */
  pictureFrame: (c) => (
    <g>
      <rect x={58} y={68} width={90} height={76} rx={6} fill={WOOD} />
      <rect x={64} y={74} width={78} height={64} rx={4} fill="#fffdfa" />
      <rect x={FRAME_ART.x} y={FRAME_ART.y} width={FRAME_ART.w} height={FRAME_ART.h} fill="#fffdfa" />
      {drawingArt(c.strokes)}
      {c.strokes.length === 0 && (
        <g opacity={0.35}>
          <path d="M92,104 l9,-11 l7,9 l6,-6 l8,14 z" fill="#c8b6e8" />
          <circle cx={88} cy={92} r={5} fill="#ffd23f" />
        </g>
      )}
      <rect x={58} y={68} width={90} height={76} rx={6} fill="none" stroke={WOOD_DARK} strokeWidth={3} />
      <path d="M96,66 l7,-8 l7,8 z" fill={WOOD_DARK} />
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

  /** Where two things become one dinner. The rings and the oven light up while it's in use. */
  cooker: (c) => (
    <g>
      {c.open && (
        <path
          className="steam-wisp"
          d="M286,144 q7,-9 0,-18 q-7,-9 0,-17 M298,144 q7,-9 0,-18 q-7,-9 0,-17"
          stroke="#ffffff"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          opacity={0.75}
        />
      )}
      <path d="M276,150 h32 l-5,18 h-22 z" fill="#8b93b5" />
      <rect x={272} y={144} width={40} height={8} rx={4} fill="#a8b0cc" />
      <rect x={258} y={176} width={68} height={56} rx={6} fill="#cfd6e2" />
      <rect x={264} y={194} width={56} height={32} rx={4} fill={c.open ? "#ffcf7a" : "#4a4f63"} />
      <rect x={264} y={194} width={56} height={6} rx={3} fill="#3a3f52" opacity={0.5} />
      <rect x={258} y={166} width={68} height={12} rx={6} fill="#aab3c4" />
      <circle cx={268} cy={172} r={4} fill={c.open ? "#ff7a3f" : "#7d85a5"} />
      <circle cx={318} cy={172} r={4} fill={c.open ? "#ff7a3f" : "#7d85a5"} />
      <rect x={282} y={182} width={20} height={5} rx={2.5} fill="#8b93b5" />
    </g>
  ),

  fridge: (c) => (
    <g>
      {c.open ? (
        <g>
          <rect x={330} y={116} width={58} height={116} rx={8} fill="#b9c2d0" />
          <rect x={336} y={122} width={46} height={104} rx={4} fill="#fff6d8" />
          {[152, 186].map((y) => (
            <rect key={y} x={336} y={y} width={46} height={4} rx={2} fill="#e0d5b4" />
          ))}
          {/* The door stands open towards you, foreshortened into a narrow slab. */}
          <rect x={306} y={116} width={24} height={116} rx={6} fill="#dfe6f0" />
          <rect x={306} y={116} width={24} height={40} rx={6} fill="#eef2f8" />
          <rect x={309} y={166} width={5} height={26} rx={2.5} fill="#98a3b5" />
        </g>
      ) : (
        <g>
          <rect x={330} y={116} width={58} height={116} rx={8} fill="#dfe6f0" />
          <rect x={330} y={116} width={58} height={40} rx={8} fill="#eef2f8" />
          <path d="M330,158 h58" stroke="#b9c2d0" strokeWidth={3} />
          <rect x={378} y={128} width={5} height={20} rx={2.5} fill="#98a3b5" />
          <rect x={378} y={168} width={5} height={26} rx={2.5} fill="#98a3b5" />
          <rect x={340} y={126} width={16} height={12} rx={2} fill="#ffd23f" />
          <circle cx={350} cy={180} r={7} fill="#ff6fae" />
        </g>
      )}
    </g>
  ),

  /** A wall cupboard above the counter, so the kitchen has somewhere to put the shopping. */
  cupboard: (c) => (
    <g>
      <rect x={18} y={90} width={104} height={60} rx={6} fill={WOOD} />
      <rect x={24} y={96} width={92} height={48} rx={4} fill={shade(WOOD, -34)} />
      {c.open ? (
        <g>
          <rect x={4} y={92} width={16} height={56} rx={4} fill={shade(WOOD, 10)} />
          <rect x={120} y={92} width={16} height={56} rx={4} fill={shade(WOOD, 10)} />
        </g>
      ) : (
        <g>
          <rect x={26} y={98} width={42} height={44} rx={4} fill={shade(WOOD, 8)} />
          <rect x={72} y={98} width={42} height={44} rx={4} fill={shade(WOOD, 8)} />
          <circle cx={64} cy={120} r={3.2} fill="#ffd23f" />
          <circle cx={76} cy={120} r={3.2} fill="#ffd23f" />
        </g>
      )}
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

  chairLeft: (c) => chair("chairLeft", c.facing),
  chairRight: (c) => chair("chairRight", c.facing),

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
      {hitPad(128, 190, 150, 42)}
      <rect x={128} y={190} width={150} height={12} rx={6} fill={WOOD} />
      <rect x={134} y={202} width={10} height={30} rx={5} fill={WOOD_DARK} />
      <rect x={262} y={202} width={10} height={30} rx={5} fill={WOOD_DARK} />
      <rect x={196} y={202} width={76} height={30} rx={4} fill={shade(WOOD, 12)} />
      <rect x={204} y={210} width={60} height={5} rx={2.5} fill={WOOD_DARK} />
      <rect x={204} y={221} width={60} height={5} rx={2.5} fill={WOOD_DARK} />
    </g>
  ),

  computer: (c) => {
    const off = c.mode === 3;
    return (
      <g>
        {hitPad(166, 138, 76, 62)}
        <rect x={168} y={140} width={72} height={48} rx={5} fill="#3a3a52" />
        <rect x={173} y={145} width={62} height={38} rx={3} fill={off ? "#15162a" : "#1d1f38"} />
        {c.mode === 0 && (
          <g>
            {/* The look it has always had: a cheap loop of bars and a blinking cursor. */}
            <g className="screen-glow">
              <rect x={177} y={150} width={30} height={4} rx={2} fill="#4fe0c0" />
              <rect x={177} y={158} width={44} height={4} rx={2} fill="#7fb6ff" />
              <rect x={177} y={166} width={22} height={4} rx={2} fill="#ffd23f" />
              <rect x={177} y={174} width={36} height={4} rx={2} fill="#ff8fc0" />
            </g>
            <rect className="screen-cursor" x={215} y={173} width={7} height={6} fill="#4fe0c0" />
          </g>
        )}
        {c.mode === 1 && screenCode()}
        {c.mode === 2 && screenStars()}
        {off && (
          /* Not quite black: a dark screen still catches the light from the window. */
          <path d="M175,181 L233,151 L233,147 L175,177 Z" fill="#ffffff" opacity={0.05} />
        )}
        {/* The power light is the one part that says out loud whether it's on. */}
        <circle cx={236} cy={185} r={1.8} fill={off ? "#4a3a3a" : "#5ed64a"} />
        <rect x={196} y={188} width={16} height={8} fill="#3a3a52" />
        <rect x={184} y={196} width={40} height={5} rx={2.5} fill="#2a2a40" />
      </g>
    );
  },

  telescope: () => (
    <g>
      {hitPad(276, 120, 96, 112)}
      {/* Tripod */}
      <path
        d="M324,186 l-26,46 M324,186 l26,46 M324,186 v46"
        stroke="#5b6180"
        strokeWidth={5}
        strokeLinecap="round"
      />
      <circle cx={324} cy={184} r={7} fill="#8b93b5" />
      {/* The tube, tipped up at the sky. Everything about this piece is that angle. */}
      <g transform="rotate(-34 324 176)">
        <rect x={286} y={164} width={80} height={24} rx={12} fill="#3b2470" />
        <rect x={286} y={164} width={80} height={9} rx={4.5} fill="#5a3b9c" />
        <rect x={358} y={160} width={16} height={32} rx={6} fill="#8b93b5" />
        <circle cx={366} cy={176} r={11} fill="#7fd4ff" />
        <circle cx={366} cy={176} r={6} fill="#bfe8ff" />
        <rect x={276} y={168} width={14} height={16} rx={5} fill="#8b93b5" />
      </g>
    </g>
  ),

  deskLamp: (c) => (
    <g>
      {hitPad(280, 156, 60, 76)}
      <ellipse cx={300} cy={230} rx={18} ry={6} fill="#5b6180" />
      <path d="M300,228 l-2,-34 l6,0 l-2,34 z" fill="#8b93b5" />
      <path d="M298,196 q0,-18 18,-24" stroke="#8b93b5" strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d="M302,166 l24,-8 l10,22 l-26,8 z" fill={c.on ? "#ffd23f" : "#9aa2c0"} />
      <circle cx={318} cy={182} r={5} fill={c.on ? "#fff6c9" : "#7d85a5"} />
    </g>
  ),

  /** A floor stander, tall enough to light a whole corner once it gets dark. */
  floorLamp: (c) => (
    <g>
      {hitPad(344, 86, 48, 146)}
      <ellipse cx={368} cy={226} rx={22} ry={6} fill="#5b6180" />
      <rect x={365} y={118} width={6} height={108} rx={3} fill="#8b93b5" />
      <path d="M346,118 l9,-30 h26 l9,30 z" fill={c.on ? "#ffd23f" : "#9aa2c0"} />
      <rect x={344} y={114} width={48} height={8} rx={4} fill={c.on ? "#ffe89a" : "#8b93b5"} />
      <path d="M352,90 h28" stroke={shade("#ffd23f", -40)} strokeWidth={3} opacity={c.on ? 0.6 : 0.3} />
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

  plushieBunny: () => (
    <g>
      {hitPad(272, 176, 56, 56)}
      <ellipse cx={300} cy={214} rx={18} ry={17} fill="#f6c0dd" />
      <circle cx={300} cy={192} r={14} fill="#f6c0dd" />
      {/* The ears are the whole animal. Long, and leaning apart so it doesn't read as a cat. */}
      <ellipse cx={291} cy={174} rx={5} ry={13} fill="#f6c0dd" transform="rotate(-12 291 174)" />
      <ellipse cx={309} cy={174} rx={5} ry={13} fill="#f6c0dd" transform="rotate(12 309 174)" />
      <ellipse cx={291} cy={175} rx={2.4} ry={8} fill="#ffdfee" transform="rotate(-12 291 175)" />
      <ellipse cx={309} cy={175} rx={2.4} ry={8} fill="#ffdfee" transform="rotate(12 309 175)" />
      <circle cx={295} cy={190} r={2.2} fill="#3c3350" />
      <circle cx={305} cy={190} r={2.2} fill="#3c3350" />
      <ellipse cx={300} cy={196} rx={2.6} ry={2} fill="#e0709f" />
      <ellipse cx={300} cy={220} rx={9} ry={7} fill="#ffdfee" />
    </g>
  ),

  plushieDino: () => (
    <g transform="translate(-124 0)">
      {hitPad(268, 176, 66, 56)}
      <ellipse cx={298} cy={212} rx={21} ry={18} fill="#5ed64a" />
      <circle cx={282} cy={192} r={13} fill="#5ed64a" />
      {/* Plates down the back, getting smaller — a dino at a glance, even this small. */}
      {([[300, 190, 7], [310, 197, 6], [318, 206, 4.5]] as Array<[number, number, number]>).map(
        ([x, y, r]) => (
          <path key={x} d={"M" + x + "," + y + " l" + r + "," + r * 1.6 + " l" + -r * 2 + ",0 z"} fill="#2f8c46" />
        )
      )}
      <ellipse cx={322} cy={216} rx={11} ry={5} fill="#5ed64a" transform="rotate(18 322 216)" />
      <circle cx={277} cy={189} r={2.3} fill="#3c3350" />
      <circle cx={287} cy={189} r={2.3} fill="#3c3350" />
      <path d="M274,197 q8,5 16,0" stroke="#2f8c46" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <ellipse cx={298} cy={218} rx={10} ry={7} fill="#b6f0a6" />
    </g>
  ),

  plushieDuck: () => (
    <g transform="translate(-62 0)">
      {hitPad(276, 182, 50, 50)}
      <ellipse cx={300} cy={214} rx={17} ry={15} fill="#ffd23f" />
      <circle cx={300} cy={194} r={12} fill="#ffd23f" />
      <path d="M300,182 q7,-9 12,-2 q-6,3 -12,2 z" fill="#ffb347" />
      <circle cx={296} cy={192} r={2.2} fill="#3c3350" />
      <circle cx={305} cy={192} r={2.2} fill="#3c3350" />
      {/* The bill, which is the only bit that has to be right. */}
      <path d="M292,199 q8,7 16,0 q-8,4 -16,0 z" fill="#ff9f1c" />
      <ellipse cx={287} cy={214} rx={6} ry={9} fill="#ffdf7a" transform="rotate(-16 287 214)" />
      <path d="M294,229 h5 M303,229 h5" stroke="#ff9f1c" strokeWidth={3} strokeLinecap="round" />
    </g>
  ),

  plantBig: () => (
    <g>
      <path d="M116,232 l7,-34 h30 l7,34 z" fill="#d98452" />
      <path d="M116,198 h44 l-2,10 h-40 z" fill={shade("#d98452", -30)} />
      {/* Only the leaves lean; a pot that swayed with them would look like it was falling. */}
      <path
        className="plant-sway"
        style={sway(2, true)}
        d="M138,198 q-30,-10 -28,-44 q28,4 28,44 M138,198 q30,-12 30,-46 q-30,6 -30,46 M138,198 q-4,-38 0,-54 q6,20 2,54"
        fill="#3fae5a"
      />
    </g>
  ),

  plantSmall: () => (
    <g>
      <path d="M246,232 l4,-20 h18 l4,20 z" fill="#c77dff" />
      <path
        className="plant-sway"
        style={sway(1)}
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

  /* A second cupboard, on the floor rather than the wall, and deep enough for two shelves. */
  tallCupboard: (c) => (
    <g>
      <rect x={30} y={108} width={94} height={124} rx={7} fill="#7a9e6b" />
      <rect x={34} y={112} width={86} height={110} rx={5} fill={shade("#7a9e6b", -22)} />
      {c.open ? (
        <g>
          <rect x={38} y={116} width={78} height={102} rx={4} fill={shade("#7a9e6b", -52)} />
          <rect x={40} y={146} width={74} height={4} rx={2} fill="#d8c8a8" />
          <rect x={40} y={192} width={74} height={4} rx={2} fill="#d8c8a8" />
          <rect x={14} y={112} width={16} height={112} rx={5} fill={shade("#7a9e6b", 14)} />
          <rect x={124} y={112} width={16} height={112} rx={5} fill={shade("#7a9e6b", 14)} />
        </g>
      ) : (
        <g>
          <rect x={38} y={116} width={38} height={102} rx={4} fill={shade("#7a9e6b", -10)} />
          <rect x={78} y={116} width={38} height={102} rx={4} fill={shade("#7a9e6b", -10)} />
          <circle cx={71} cy={168} r={3.4} fill="#ffd23f" />
          <circle cx={83} cy={168} r={3.4} fill="#ffd23f" />
        </g>
      )}
      <rect x={36} y={228} width={10} height={4} rx={2} fill={shade("#7a9e6b", -46)} />
      <rect x={108} y={228} width={10} height={4} rx={2} fill={shade("#7a9e6b", -46)} />
    </g>
  ),

  /* Low and wide, with a long row of things along the top when it is open. */
  sideboard: (c) => (
    <g>
      {hitPad(130, 178, 110, 54)}
      <rect x={130} y={182} width={110} height={44} rx={6} fill="#c98a3f" />
      {c.open ? (
        <g>
          <rect x={136} y={188} width={98} height={32} rx={4} fill={shade("#c98a3f", -48)} />
          <rect x={112} y={186} width={22} height={34} rx={5} fill={shade("#c98a3f", 14)} />
          <rect x={236} y={186} width={22} height={34} rx={5} fill={shade("#c98a3f", 14)} />
        </g>
      ) : (
        <g>
          <rect x={136} y={188} width={46} height={32} rx={4} fill={shade("#c98a3f", -18)} />
          <rect x={188} y={188} width={46} height={32} rx={4} fill={shade("#c98a3f", -18)} />
          <rect x={152} y={202} width={16} height={4} rx={2} fill="#ffd23f" />
          <rect x={204} y={202} width={16} height={4} rx={2} fill="#ffd23f" />
        </g>
      )}
      <rect x={136} y={226} width={8} height={6} rx={3} fill={shade("#c98a3f", -46)} />
      <rect x={226} y={226} width={8} height={6} rx={3} fill={shade("#c98a3f", -46)} />
    </g>
  ),

  /* Tall and narrow: three deep drawers rather than the low three-across one. */
  tallDrawers: (c) => (
    <g>
      <rect x={226} y={126} width={74} height={106} rx={6} fill={WOOD} />
      {[0, 1, 2].map((row) => (
        <g key={row}>
          <rect
            x={232}
            y={132 + row * 33}
            width={62}
            height={28}
            rx={4}
            fill={c.open ? shade(WOOD, -50) : WOOD_DARK}
          />
          {c.open ? (
            // Pulled out: a lip along the front, so it reads as a drawer standing open
            // rather than as a darker rectangle.
            <rect x={228} y={152 + row * 33} width={70} height={7} rx={3.5} fill={shade(WOOD, 14)} />
          ) : (
            <rect x={250} y={143 + row * 33} width={26} height={5} rx={2.5} fill="#ffd23f" />
          )}
        </g>
      ))}
    </g>
  ),

  /*
   * Two beds and a ladder, and long enough to lie on: a grown-up laid down is about 180
   * across, and at the 156 this started at her head and feet hung off both ends.
   */
  bunkBed: () => (
    <g>
      {hitPad(200, 96, 200, 136)}
      <rect x={204} y={96} width={10} height={136} rx={5} fill={WOOD_DARK} />
      <rect x={386} y={96} width={10} height={136} rx={5} fill={WOOD_DARK} />
      {/* Top bunk */}
      <rect x={204} y={140} width={192} height={10} rx={5} fill={WOOD} />
      <rect x={210} y={122} width={180} height={20} rx={8} fill="#7fb6ff" />
      <rect x={216} y={113} width={42} height={15} rx={7} fill="#fffdfa" />
      <path d="M208,132 h184" stroke={shade("#7fb6ff", -34)} strokeWidth={2.5} />
      {/* Guard rail, which is what says "bunk" rather than "two beds" */}
      <rect x={220} y={104} width={160} height={5} rx={2.5} fill={WOOD} />
      {/* Bottom bunk */}
      <rect x={204} y={214} width={192} height={10} rx={5} fill={WOOD} />
      <rect x={210} y={196} width={180} height={20} rx={8} fill="#ff8fc0" />
      <rect x={216} y={187} width={42} height={15} rx={7} fill="#fffdfa" />
      <path d="M208,206 h184" stroke={shade("#ff8fc0", -34)} strokeWidth={2.5} />
      {/* Ladder */}
      <rect x={356} y={150} width={5} height={66} rx={2.5} fill={shade(WOOD, 18)} />
      <rect x={376} y={150} width={5} height={66} rx={2.5} fill={shade(WOOD, 18)} />
      {[160, 178, 196].map((y) => (
        <rect key={y} x={356} y={y} width={25} height={4} rx={2} fill={shade(WOOD, 18)} />
      ))}
    </g>
  ),

  /* A run of wall cupboards, up where a kitchen keeps its cups. */
  wallUnits: (c) => (
    <g>
      <rect x={136} y={86} width={110} height={58} rx={5} fill={KITCHEN} />
      <rect x={140} y={90} width={102} height={46} rx={4} fill={shade(KITCHEN, -18)} />
      {c.open ? (
        <g>
          <rect x={144} y={94} width={94} height={40} rx={3} fill={shade(KITCHEN, -54)} />
          <rect x={146} y={112} width={90} height={3} rx={1.5} fill={shade(KITCHEN, 18)} />
          <rect x={120} y={88} width={18} height={54} rx={4} fill={shade(KITCHEN, 10)} />
          <rect x={244} y={88} width={18} height={54} rx={4} fill={shade(KITCHEN, 10)} />
        </g>
      ) : (
        <g>
          <rect x={144} y={94} width={46} height={40} rx={3} fill={shade(KITCHEN, 8)} />
          <rect x={194} y={94} width={46} height={40} rx={3} fill={shade(KITCHEN, 8)} />
          <rect x={181} y={110} width={5} height={14} rx={2.5} fill={STEEL} />
          <rect x={199} y={110} width={5} height={14} rx={2.5} fill={STEEL} />
        </g>
      )}
      <rect x={134} y={142} width={114} height={5} rx={2.5} fill={shade(KITCHEN, -32)} />
    </g>
  ),

  /* Floor cupboards with a worktop over them, which is what the wall ones sit above. */
  baseUnits: (c) => (
    <g>
      <rect x={126} y={176} width={144} height={56} rx={4} fill={KITCHEN} />
      {/* The worktop. A run of units without one reads as a row of boxes. */}
      <rect x={122} y={168} width={152} height={12} rx={5} fill={WOOD_DARK} />
      {c.open ? (
        <g>
          <rect x={132} y={184} width={132} height={42} rx={3} fill={shade(KITCHEN, -54)} />
          <rect x={134} y={204} width={128} height={3} rx={1.5} fill={shade(KITCHEN, 18)} />
          <rect x={108} y={182} width={18} height={46} rx={4} fill={shade(KITCHEN, 10)} />
          <rect x={270} y={182} width={18} height={46} rx={4} fill={shade(KITCHEN, 10)} />
        </g>
      ) : (
        <g>
          <rect x={132} y={184} width={62} height={42} rx={3} fill={shade(KITCHEN, 8)} />
          <rect x={202} y={184} width={62} height={42} rx={3} fill={shade(KITCHEN, 8)} />
          <rect x={184} y={202} width={5} height={16} rx={2.5} fill={STEEL} />
          <rect x={207} y={202} width={5} height={16} rx={2.5} fill={STEEL} />
        </g>
      )}
    </g>
  ),

  /* A tall larder: the one kitchen cupboard you can get a whole week's shopping into. */
  larder: (c) => (
    <g>
      <rect x={248} y={98} width={72} height={134} rx={5} fill={KITCHEN} />
      <rect x={252} y={102} width={64} height={122} rx={4} fill={shade(KITCHEN, -18)} />
      {c.open ? (
        <g>
          <rect x={256} y={106} width={56} height={114} rx={3} fill={shade(KITCHEN, -54)} />
          {[138, 174, 210].map((y) => (
            <rect key={y} x={258} y={y} width={52} height={3} rx={1.5} fill={shade(KITCHEN, 18)} />
          ))}
          <rect x={230} y={104} width={18} height={118} rx={4} fill={shade(KITCHEN, 10)} />
        </g>
      ) : (
        <g>
          <rect x={256} y={106} width={56} height={114} rx={3} fill={shade(KITCHEN, 8)} />
          <rect x={302} y={152} width={5} height={22} rx={2.5} fill={STEEL} />
        </g>
      )}
      <rect x={252} y={228} width={12} height={4} rx={2} fill={shade(KITCHEN, -40)} />
      <rect x={304} y={228} width={12} height={4} rx={2} fill={shade(KITCHEN, -40)} />
    </g>
  ),

  wardrobe: (c) => (
    <g>
      <rect x={22} y={108} width={92} height={124} rx={7} fill={WOOD} />
      {c.open ? (
        <g>
          <rect x={30} y={118} width={76} height={104} rx={4} fill={shade(WOOD, -38)} />
          <rect x={34} y={134} width={68} height={4} rx={2} fill="#d8c8a8" />
          {/* Something hanging up, so an open wardrobe isn't just a dark hole. */}
          {[
            [48, "#ff6fae"], [68, "#3aa0ff"], [88, "#ffd23f"],
          ].map(([x, colour]) => (
            <g key={x as number}>
              <path
                d={"M" + x + ",138 l-9,20 h18 z"}
                fill={colour as string}
              />
              <path d={"M" + x + ",138 v-5"} stroke="#d8c8a8" strokeWidth={2} />
            </g>
          ))}
          <rect x={6} y={112} width={16} height={116} rx={5} fill={shade(WOOD, 12)} />
          <rect x={114} y={112} width={16} height={116} rx={5} fill={shade(WOOD, 12)} />
        </g>
      ) : (
        <g>
          <rect x={30} y={118} width={36} height={104} rx={4} fill={WOOD_DARK} />
          <rect x={70} y={118} width={36} height={104} rx={4} fill={WOOD_DARK} />
          <circle cx={62} cy={170} r={3.4} fill="#ffd23f" />
          <circle cx={74} cy={170} r={3.4} fill="#ffd23f" />
        </g>
      )}
    </g>
  ),

  /** A chest of drawers. The top drawer slides out; the other two stay shut. */
  drawers: (c) => (
    <g>
      <rect x={118} y={156} width={80} height={76} rx={6} fill={WOOD} />
      {[
        [192, 22],
        [216, 14],
      ].map(([y, h]) => (
        <g key={y}>
          <rect x={124} y={y} width={68} height={h} rx={3} fill={shade(WOOD, 14)} />
          <rect x={150} y={y + h / 2 - 2} width={16} height={4} rx={2} fill="#ffd23f" />
        </g>
      ))}
      {c.open ? (
        <g>
          <rect x={124} y={164} width={68} height={22} rx={3} fill={shade(WOOD, -40)} />
          <rect x={114} y={180} width={88} height={26} rx={4} fill={shade(WOOD, 18)} />
          <rect x={114} y={198} width={88} height={8} rx={4} fill={shade(WOOD, 4)} />
          <rect x={148} y={200} width={20} height={4} rx={2} fill="#ffd23f" />
        </g>
      ) : (
        <g>
          <rect x={124} y={164} width={68} height={22} rx={3} fill={shade(WOOD, 14)} />
          <rect x={150} y={173} width={16} height={4} rx={2} fill="#ffd23f" />
        </g>
      )}
    </g>
  ),

  bedsideLamp: (c) => (
    <g>
      <rect x={140} y={196} width={40} height={36} rx={5} fill={WOOD} />
      <rect x={148} y={206} width={24} height={9} rx={3} fill={WOOD_DARK} />
      <rect x={157} y={168} width={6} height={28} rx={3} fill="#8b84a8" />
      <path d="M144,168 l8,-22 h16 l8,22 z" fill={c.on ? "#ffd23f" : "#9aa2c0"} />
      {c.on && <ellipse cx={160} cy={172} rx={26} ry={9} fill="#ffe89a" opacity={0.35} />}
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

  // ---------------- garden ----------------
  plotOne: (c) => plot(PLOT_X.plotOne, c),
  plotTwo: (c) => plot(PLOT_X.plotTwo, c),
  plotThree: (c) => plot(PLOT_X.plotThree, c),

  /** Dragged onto a bed to water it. Furniture rather than something carried, so watering
   *  is picking the can up and tipping it over the plant. */
  wateringCan: (c) => (
    /* Two transforms, one each on its own group: the lift raises the whole can and its water
       together, the tip below only turns the can. Tipping alone put the rose an inch under
       the rim of the bed, so the water started below the pot and could never go in it. */
    <g style={CAN_EASE} transform={"translate(0 " + (c.pouring ? -CAN_LIFT : 0) + ")"}>
      <g style={CAN_EASE} transform={"rotate(" + (c.pouring ? CAN_TIP : 0) + " " + CAN_PIVOT + ")"}>
        {hitPad(330, 186, 66, 46)}
        <path d="M338,204 h34 l-4,28 h-26 z" fill="#5ed64a" />
        {/* Drawn from inside the body outwards, so the spout is part of the can rather than
            a shape floating alongside it — which is what the old one, starting past the
            body's edge and level with the collar, looked like. */}
        <path
          d="M366,214 L389,198"
          stroke="#3fae5a"
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
        />
        <rect x={334} y={199} width={42} height={8} rx={4} fill="#3fae5a" />
        <path d="M340,199 q9,-15 22,-2" stroke="#3fae5a" strokeWidth={4.5} fill="none" strokeLinecap="round" />
        <ellipse cx={391} cy={198} rx={6} ry={4.5} fill="#9be07a" transform="rotate(-32 391 198)" />
      </g>
    </g>
  ),

  /** Where seeds come from. The market's four stalls already fill its width, and seeds
   *  belong where the growing happens. */
  seedTable: (c) => (
    <g>
      {hitPad(264, 176, 62, 56)}
      <rect x={264} y={196} width={62} height={9} rx={4} fill={WOOD} />
      <rect x={270} y={205} width={7} height={27} rx={3} fill={WOOD_DARK} />
      <rect x={313} y={205} width={7} height={27} rx={3} fill={WOOD_DARK} />
      {(STALL_STOCK.seedTable ?? []).slice(0, 3).map((id, i) => {
        const thing = THINGS[id];
        if (!thing) return null;
        return (
          <g key={id} transform={"translate(" + (277 + i * 18) + " 186) scale(0.4)"}>
            {thing.art()}
          </g>
        );
      })}
      {c.open && <rect x={262} y={194} width={66} height={4} rx={2} fill="#ffd23f" />}
    </g>
  ),

  // ---------------- market ----------------
  fruitStall: () => stall(6, "#ff4d7e", STALL_STOCK.fruitStall),
  vegStall: () => stall(104, "#5ed64a", STALL_STOCK.vegStall),
  bakeryStall: () => stall(202, "#ff9040", STALL_STOCK.bakeryStall),
  dairyStall: () => stall(300, "#3aa0ff", STALL_STOCK.dairyStall),
};

/**
 * One way in for the room to draw a piece: look it up, hand it its own state, and mirror it if
 * it is a flippable piece standing the other way round.
 */
export function renderFurniture(id: string, ctx: FurnitureCtx): ReactElement | null {
  const render = FURNITURE[id];
  if (!render) return null;
  const art = render(ctx);
  const axis = FLIP_AXIS[id];
  if (axis === undefined || ctx.facing % 2 === 0) return art;
  return <g transform={"translate(" + axis * 2 + " 0) scale(-1 1)"}>{art}</g>;
}
