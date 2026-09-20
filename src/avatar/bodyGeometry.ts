/**
 * The shared skeleton. Every body part, garment and hairstyle is drawn against these
 * coordinates, so a hoodie sleeve lands exactly on the arm it's covering. Change a number
 * here and the whole wardrobe moves with it — never hardcode positions in a part.
 *
 * Limbs are drawn as thick round-capped lines rather than outlined shapes: that gives chunky
 * cartoon arms/legs for free, and a sleeve is then just the same line in fabric colour at a
 * slightly greater width.
 */
export const VIEWBOX = "0 0 200 430";

export const HEAD = { cx: 100, cy: 88, r: 54 };

export const EAR = { cy: 96, rx: 9, ry: 12, leftCx: 47, rightCx: 153 };

export const NECK = { x: 88, y: 134, w: 24, h: 16, r: 8 };

/** Torso outline: slightly barrelled, rounded shoulders, tucked waist. */
export const TORSO = {
  top: 150,
  bottom: 252,
  // Waist tucks in a little so the arms read as separate shapes either side of it.
  path: "M67,158 C67,146 133,146 133,158 L128,244 C128,254 72,254 72,244 Z",
};

export const ARM = {
  width: 18,
  // Held out from the body: when a sleeve is the same colour as the top, arms tucked against
  // the torso merge into one silhouette and the character loses its shape entirely.
  left: { x1: 70, y1: 168, x2: 47, y2: 250 },
  right: { x1: 130, y1: 168, x2: 153, y2: 250 },
  /** Where a short sleeve stops (fraction along the arm from shoulder to hand). */
  shortSleeveEnd: 0.42,
};

export const LEG = {
  width: 27,
  left: { x1: 86, y1: 250, x2: 82, y2: 354 },
  right: { x1: 114, y1: 250, x2: 118, y2: 354 },
};

// Lined up with where the legs actually end (LEG.left.x2 / LEG.right.x2). Any gap here makes
// the shoes — boots especially — look splayed away from the legs.
export const FOOT = { leftCx: 82, rightCx: 118, cy: 368 };

export const EYE = { cy: 92, leftCx: 78, rightCx: 122 };
export const MOUTH = { cx: 100, cy: 117 };
export const BLUSH = { cy: 109, leftCx: 62, rightCx: 138, rx: 13, ry: 7.5 };

/** Chest area where a t-shirt motif/logo sits. */
export const MOTIF = { cx: 100, cy: 196 };

/**
 * Standing, sitting on something, or lying down. Lying is the standing figure turned on its
 * side, so only sitting actually changes the skeleton.
 */
export type Pose = "stand" | "sit" | "lie";

export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** How far the knee swings out and drops when sitting, and where the shin goes from there. */
const SIT = { kneeOut: 20, kneeDrop: 24, shinOut: 4, shinDrop: 66 };

/**
 * A leg as the segments it is actually made of: one straight line standing, a thigh and a shin
 * when sitting. Trousers, shorts and shoes are all built from these same segments rather than
 * from LEG directly — otherwise a seated character's knees bend while her jeans carry straight
 * on down through the chair and her shoes stay behind on the floor.
 */
export function legSegments(side: "left" | "right", pose: Pose): Segment[] {
  const leg = side === "left" ? LEG.left : LEG.right;
  if (pose !== "sit") return [leg];
  const out = side === "left" ? -1 : 1;
  const knee = { x: leg.x1 + out * SIT.kneeOut, y: leg.y1 + SIT.kneeDrop };
  return [
    { x1: leg.x1, y1: leg.y1, x2: knee.x, y2: knee.y },
    { x1: knee.x, y1: knee.y, x2: knee.x + out * SIT.shinOut, y2: knee.y + SIT.shinDrop },
  ];
}

/** Where the feet end up, which moves with the knees. */
export function footFor(pose: Pose): { leftCx: number; rightCx: number; cy: number } {
  if (pose !== "sit") return FOOT;
  const left = legSegments("left", "sit")[1];
  const right = legSegments("right", "sit")[1];
  // The same drop below the end of the leg that the standing figure uses.
  return { leftCx: left.x2, rightCx: right.x2, cy: left.y2 + (FOOT.cy - LEG.left.y2) };
}

/** Point some fraction along a limb line, for part-length sleeves and shorts. */
export function along(
  line: { x1: number; y1: number; x2: number; y2: number },
  t: number
): { x1: number; y1: number; x2: number; y2: number } {
  return {
    x1: line.x1,
    y1: line.y1,
    x2: line.x1 + (line.x2 - line.x1) * t,
    y2: line.y1 + (line.y2 - line.y1) * t,
  };
}

/** Lighten (positive) or darken (negative) a hex colour — for soles, shadows, folds. */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((n >> 16) & 255) + amount);
  const g = clamp(((n >> 8) & 255) + amount);
  const b = clamp((n & 255) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
