/**
 * What there is to find in the night sky, and whereabouts it is.
 *
 * The point is that the sky has things in it and they are different from one another — a
 * planet with rings is not a planet with stripes, and some of the stars join up into a
 * picture. So every sight is drawn distinctly enough to tell apart at a glance, which is the
 * whole of the lesson at this age; the names are for whoever is reading them out.
 *
 * They are scattered across a sky several eyepieces wide and found by sweeping across it.
 * Nothing announces itself: the reward for looking is the finding.
 *
 * Each art() is drawn around its own (0,0) and placed by `x`/`y` below.
 */
export interface Sight {
  id: string;
  name: string;
  /** A word or two for a grown-up to read out. Nothing depends on it being read. */
  note: string;
  x: number;
  y: number;
  art: () => string;
}

/** How big the whole sky is, and how much of it the eyepiece shows at once. */
export const SKY_W = 860;
export const SKY_H = 560;
export const EYE = 200;

/** Near enough to the middle of the eyepiece to count as having found it. */
export const FOUND_WITHIN = 62;

/** A star as a four-pointed twinkle, which reads better small than a circle does. */
function star(x: number, y: number, r: number, fill = "#fffdfa"): string {
  return (
    '<path d="M' + x + ',' + (y - r) +
    ' Q' + x + ',' + y + ' ' + (x + r) + ',' + y +
    ' Q' + x + ',' + y + ' ' + x + ',' + (y + r) +
    ' Q' + x + ',' + y + ' ' + (x - r) + ',' + y +
    ' Q' + x + ',' + y + ' ' + x + ',' + (y - r) + ' z" fill="' + fill + '"/>'
  );
}

/** Joins a run of stars up, then draws them over the line so it never crosses a point. */
function joined(points: Array<[number, number, number]>): string {
  return (
    '<path d="M' + points.map(([x, y]) => x + "," + y).join(" L") +
    '" stroke="#7fb6ff" stroke-width="1.6" fill="none" opacity="0.7"/>' +
    points.map(([x, y, r]) => star(x, y, r)).join("")
  );
}

export const SIGHTS: Sight[] = [
  {
    id: "moon",
    name: "The Moon",
    note: "Ours. The dark patches are flat plains.",
    x: 150,
    y: 140,
    art: () =>
      '<circle cx="0" cy="0" r="54" fill="#f4eede"/>' +
      '<circle cx="-20" cy="-18" r="14" fill="#ded7c4"/>' +
      '<circle cx="17" cy="19" r="10" fill="#ded7c4"/>' +
      '<circle cx="23" cy="-25" r="6" fill="#ded7c4"/>' +
      '<circle cx="-14" cy="24" r="4.5" fill="#ded7c4"/>' +
      '<circle cx="3" cy="-2" r="3.5" fill="#e6dfcd"/>',
  },
  {
    id: "saturn",
    name: "Saturn",
    note: "The one with rings.",
    x: 470,
    y: 120,
    art: () =>
      '<ellipse cx="0" cy="4" rx="68" ry="18" fill="none" stroke="#d9c07a" stroke-width="7" opacity="0.5"/>' +
      '<circle cx="0" cy="0" r="36" fill="#e8cf92"/>' +
      '<path d="M-36,-10 a36,36 0 0 0 72,0 z" fill="#dcbd74" opacity="0.5"/>' +
      '<ellipse cx="0" cy="4" rx="68" ry="18" fill="none" stroke="#f0dca8" stroke-width="7"' +
      ' stroke-dasharray="108 180" stroke-dashoffset="54"/>',
  },
  {
    id: "jupiter",
    name: "Jupiter",
    note: "The biggest. The red spot is a storm.",
    x: 742,
    y: 170,
    art: () =>
      '<circle cx="0" cy="0" r="46" fill="#e0c49a"/>' +
      '<path d="M-42,-14 h84" stroke="#c9a173" stroke-width="10" opacity="0.8"/>' +
      '<path d="M-44,10 h88" stroke="#c9a173" stroke-width="8" opacity="0.7"/>' +
      '<path d="M-36,28 h72" stroke="#b8926a" stroke-width="6" opacity="0.6"/>' +
      '<ellipse cx="20" cy="10" rx="12" ry="7" fill="#c4553c"/>',
  },
  {
    id: "mars",
    name: "Mars",
    note: "The red one. It has ice at the top and bottom.",
    x: 260,
    y: 420,
    art: () =>
      '<circle cx="0" cy="0" r="38" fill="#d9603f"/>' +
      '<path d="M-22,-16 q13,-7 24,2 q-11,9 -24,-2 z" fill="#b34a2e"/>' +
      '<path d="M8,16 q16,-5 22,6 q-15,7 -22,-6 z" fill="#b34a2e"/>' +
      '<ellipse cx="0" cy="-33" rx="12" ry="5" fill="#f5ece6"/>' +
      '<ellipse cx="0" cy="33" rx="9" ry="4" fill="#f5ece6"/>',
  },
  {
    id: "plough",
    name: "The Plough",
    note: "Seven stars. The last two point at the North Star.",
    x: 590,
    y: 360,
    art: () =>
      joined([
        [-58, 28, 5],
        [-32, 36, 4],
        [-6, 30, 4.5],
        [18, 16, 4],
        [26, -8, 5],
        [4, -22, 4],
        [-20, -12, 4.5],
      ]) + star(58, -42, 6, "#ffe9a8"),
  },
  {
    id: "hunter",
    name: "The Hunter",
    note: "Orion. Three stars in a row make his belt.",
    x: 130,
    y: 400,
    art: () =>
      joined([
        [-36, -52, 5],
        [-42, -8, 4],
        [-18, 0, 5],
        [0, 4, 5],
        [18, 8, 5],
        [40, 0, 4],
        [48, -46, 5],
      ]) +
      joined([[-42, -8, 0.1], [-30, 50, 4]]) +
      joined([[40, 0, 0.1], [32, 52, 4]]),
  },
  {
    id: "w",
    name: "The W",
    note: "Cassiopeia. A big letter W in the sky.",
    x: 730,
    y: 430,
    art: () =>
      joined([
        [-59, -24, 4.5],
        [-33, 20, 5],
        [-1, -16, 4],
        [31, 24, 5],
        [59, -22, 4.5],
      ]),
  },
];

/**
 * Fixed specks across the whole sky, so it never looks empty between the sights and there is
 * always something moving past to show that dragging is doing anything.
 */
export const SKY_DUST: Array<[number, number, number]> = (() => {
  const out: Array<[number, number, number]> = [];
  // A cheap repeatable shuffle: the sky must look the same every time she opens it.
  let seed = 20260921;
  const next = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let i = 0; i < 150; i++) {
    out.push([
      Math.round(next() * SKY_W),
      Math.round(next() * SKY_H),
      +(0.9 + next() * 1.3).toFixed(2),
    ]);
  }
  return out;
})();
