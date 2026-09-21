/**
 * What there is to look at through the telescope.
 *
 * The point of this is that the night sky has things in it and they are different from one
 * another — a planet with rings is not a planet with stripes, and some of the stars join up
 * into a picture. So every sight is drawn distinctly enough to tell apart at a glance,
 * because that is the whole of the lesson at this age; the names come later and are mostly
 * for whoever is reading them out.
 *
 * Drawn into a 200x200 eyepiece, so everything is measured from a centre at (100,100).
 */
export interface Sight {
  id: string;
  name: string;
  /** A word or two for a grown-up to read out. Nothing depends on it being read. */
  note: string;
  art: () => string;
}

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

/** Joins a run of stars up, then draws them over the top so the line never crosses a point. */
function joined(points: Array<[number, number, number]>): string {
  const line =
    '<path d="M' +
    points.map(([x, y]) => x + "," + y).join(" L") +
    '" stroke="#7fb6ff" stroke-width="1.6" fill="none" opacity="0.7"/>';
  return line + points.map(([x, y, r]) => star(x, y, r)).join("");
}

export const SIGHTS: Sight[] = [
  {
    id: "moon",
    name: "The Moon",
    note: "Ours. The dark patches are flat plains.",
    art: () =>
      '<circle cx="100" cy="100" r="62" fill="#f4eede"/>' +
      '<circle cx="78" cy="80" r="16" fill="#ded7c4"/>' +
      '<circle cx="118" cy="118" r="11" fill="#ded7c4"/>' +
      '<circle cx="124" cy="74" r="7" fill="#ded7c4"/>' +
      '<circle cx="86" cy="124" r="5" fill="#ded7c4"/>' +
      '<circle cx="104" cy="98" r="4" fill="#e6dfcd"/>',
  },
  {
    id: "saturn",
    name: "Saturn",
    note: "The one with rings.",
    art: () =>
      '<ellipse cx="100" cy="104" rx="76" ry="20" fill="none" stroke="#d9c07a" stroke-width="7" opacity="0.5"/>' +
      '<circle cx="100" cy="100" r="40" fill="#e8cf92"/>' +
      '<path d="M62,90 a40,40 0 0 0 76,0 z" fill="#dcbd74" opacity="0.5"/>' +
      '<ellipse cx="100" cy="104" rx="76" ry="20" fill="none" stroke="#f0dca8" stroke-width="7"' +
      ' stroke-dasharray="120 200" stroke-dashoffset="60"/>',
  },
  {
    id: "mars",
    name: "Mars",
    note: "The red one. It has ice at the top and bottom.",
    art: () =>
      '<circle cx="100" cy="100" r="44" fill="#d9603f"/>' +
      '<path d="M76,82 q14,-8 26,2 q-12,10 -26,-2 z" fill="#b34a2e"/>' +
      '<path d="M108,116 q18,-6 24,6 q-16,8 -24,-6 z" fill="#b34a2e"/>' +
      '<ellipse cx="100" cy="62" rx="14" ry="6" fill="#f5ece6"/>' +
      '<ellipse cx="100" cy="138" rx="11" ry="5" fill="#f5ece6"/>',
  },
  {
    id: "jupiter",
    name: "Jupiter",
    note: "The biggest. The red spot is a storm.",
    art: () =>
      '<circle cx="100" cy="100" r="52" fill="#e0c49a"/>' +
      '<path d="M52,86 h96" stroke="#c9a173" stroke-width="11" opacity="0.8"/>' +
      '<path d="M54,112 h92" stroke="#c9a173" stroke-width="9" opacity="0.7"/>' +
      '<path d="M62,130 h76" stroke="#b8926a" stroke-width="7" opacity="0.6"/>' +
      '<ellipse cx="122" cy="112" rx="13" ry="8" fill="#c4553c"/>',
  },
  {
    id: "plough",
    name: "The Plough",
    note: "Seven stars. The last two point at the North Star.",
    art: () =>
      joined([
        [42, 128, 5],
        [68, 136, 4],
        [94, 130, 4.5],
        [118, 116, 4],
        [126, 92, 5],
        [104, 78, 4],
        [80, 88, 4.5],
      ]) + star(158, 58, 6, "#ffe9a8"),
  },
  {
    id: "hunter",
    name: "The Hunter",
    note: "Orion. Three stars in a row make his belt.",
    art: () =>
      joined([
        [64, 48, 5],
        [58, 92, 4],
        [82, 100, 5],
        [100, 104, 5],
        [118, 108, 5],
        [140, 100, 4],
        [148, 54, 5],
      ]) +
      joined([
        [58, 92, 0.1],
        [70, 150, 4],
      ]) +
      joined([
        [140, 100, 0.1],
        [132, 152, 4],
      ]),
  },
  {
    id: "w",
    name: "The W",
    note: "Cassiopeia. A big letter W in the sky.",
    art: () =>
      joined([
        [40, 74, 4.5],
        [66, 118, 5],
        [98, 82, 4],
        [130, 122, 5],
        [158, 76, 4.5],
      ]),
  },
];
