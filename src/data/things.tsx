import type { ReactElement } from "react";

/**
 * The little things a character can carry: what you buy at the market, and what you cook from
 * it. Every piece of art here is drawn centred on the origin inside roughly a 36-unit square,
 * so the same drawing works in a basket slot, inside an open cupboard and on a market stall
 * just by being translated and scaled.
 */

export interface Thing {
  id: string;
  name: string;
  /** Raw flour and a raw egg are funny rather than nice; everything else is a treat. */
  taste: "yum" | "yuck";
  art: () => ReactElement;
}

const LEAF = "#3fae5a";
const LEAF_DARK = "#2f8c46";

/** A short stalk with a leaf, shared by the fruit that grows on a tree. */
function stalk(): ReactElement {
  return (
    <g>
      <path d="M0,-10 v-6" stroke="#8d5a2c" strokeWidth={3} strokeLinecap="round" />
      <path d="M1,-14 q9,-5 13,-11 q-1,11 -11,14 z" fill={LEAF} />
    </g>
  );
}

/** The bowl that a cooked dish is served in — same shape every time so dishes read as a set. */
function bowl(colour: string): ReactElement {
  return (
    <g>
      <path d="M-17,0 q17,20 34,0 z" fill={colour} />
      <rect x={-18} y={-3} width={36} height={6} rx={3} fill="#ffffff" opacity={0.85} />
    </g>
  );
}

export const THINGS: Record<string, Thing> = {
  // ---------------- fruit ----------------
  apple: {
    id: "apple",
    name: "Apple",
    taste: "yum",
    art: () => (
      <g>
        <path d="M0,-9 C-4,-17 -16,-13 -16,-2 C-16,9 -8,17 0,17 C8,17 16,9 16,-2 C16,-13 4,-17 0,-9 Z" fill="#ff4d5e" />
        <ellipse cx={-7} cy={-1} rx={3.4} ry={5} fill="#ffffff" opacity={0.35} />
        {stalk()}
      </g>
    ),
  },

  banana: {
    id: "banana",
    name: "Banana",
    taste: "yum",
    art: () => (
      <g>
        <path d="M-15,-9 q1,20 15,24 q11,3 15,-6 q-6,4 -14,1 q-12,-5 -11,-19 z" fill="#ffd23f" />
        <path d="M-15,-9 q-3,-3 -1,-5 q4,-1 5,4 z" fill="#8d5a2c" />
        <path d="M-10,-4 q2,15 13,19" stroke="#e8b52c" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      </g>
    ),
  },

  strawberry: {
    id: "strawberry",
    name: "Strawberry",
    taste: "yum",
    art: () => (
      <g>
        <path d="M0,17 C-13,8 -15,-3 -9,-9 C-5,-13 5,-13 9,-9 C15,-3 13,8 0,17 Z" fill="#ff4d5e" />
        <path d="M-11,-9 q11,-6 22,0 q-5,4 -11,4 q-6,0 -11,-4 z" fill={LEAF} />
        <path d="M0,-13 v-4" stroke={LEAF_DARK} strokeWidth={2.5} strokeLinecap="round" />
        {[
          [-5, -2], [4, -3], [0, 4], [-6, 6], [6, 5],
        ].map(([x, y]) => (
          <circle key={x + ":" + y} cx={x} cy={y} r={1.5} fill="#ffe89a" />
        ))}
      </g>
    ),
  },

  // ---------------- vegetables ----------------
  carrot: {
    id: "carrot",
    name: "Carrot",
    taste: "yum",
    art: () => (
      <g>
        <path d="M0,18 L-8,-4 q8,-5 16,0 Z" fill="#ff9040" />
        <path d="M-5,2 h9 M-3,8 h6" stroke="#e0752c" strokeWidth={2} strokeLinecap="round" />
        <path
          d="M0,-4 q-2,-12 -9,-14 q2,10 7,14 M0,-4 q0,-14 2,-17 q3,11 1,17 M0,-4 q4,-11 12,-12 q-4,9 -10,12"
          fill={LEAF}
        />
      </g>
    ),
  },

  tomato: {
    id: "tomato",
    name: "Tomato",
    taste: "yum",
    art: () => (
      <g>
        <circle cx={0} cy={3} r={14} fill="#ff4d5e" />
        <ellipse cx={-5} cy={-2} rx={3.4} ry={4.6} fill="#ffffff" opacity={0.32} />
        <path d="M0,-11 l-9,-4 l5,7 l-8,0 l7,5 M0,-11 l9,-4 l-5,7 l8,0 l-7,5" fill={LEAF} />
        <path d="M0,-11 v-5" stroke={LEAF_DARK} strokeWidth={3} strokeLinecap="round" />
      </g>
    ),
  },

  potato: {
    id: "potato",
    name: "Potato",
    taste: "yuck",
    art: () => (
      <g>
        <ellipse cx={0} cy={2} rx={16} ry={12} transform="rotate(-12)" fill="#c99a5b" />
        {[
          [-7, -2], [3, -5], [7, 4], [-3, 6],
        ].map(([x, y]) => (
          <ellipse key={x + ":" + y} cx={x} cy={y} rx={2.2} ry={1.5} fill="#9c7340" />
        ))}
      </g>
    ),
  },

  lettuce: {
    id: "lettuce",
    name: "Lettuce",
    taste: "yum",
    art: () => (
      <g>
        <circle cx={0} cy={3} r={15} fill={LEAF_DARK} />
        <path d="M-13,1 q6,-11 13,-3 q7,-8 13,3 q-4,12 -13,12 q-9,0 -13,-12 z" fill={LEAF} />
        <path d="M0,-2 v13 M-7,2 l5,7 M7,2 l-5,7" stroke="#9be07a" strokeWidth={2} strokeLinecap="round" />
      </g>
    ),
  },

  // ---------------- larder ----------------
  cheese: {
    id: "cheese",
    name: "Cheese",
    taste: "yum",
    art: () => (
      <g>
        <path d="M-17,10 L-17,-2 L15,-11 L17,10 Z" fill="#ffd23f" />
        <path d="M-17,-2 L15,-11 L17,-1 L-17,6 Z" fill="#ffe480" />
        <circle cx={-7} cy={4} r={2.8} fill="#e8b52c" />
        <circle cx={6} cy={2} r={2.2} fill="#e8b52c" />
        <circle cx={11} cy={7} r={1.8} fill="#e8b52c" />
      </g>
    ),
  },

  egg: {
    id: "egg",
    name: "Egg",
    taste: "yuck",
    art: () => (
      <g>
        <ellipse cx={0} cy={2} rx={16} ry={12} fill="#fffdfa" />
        <ellipse cx={-10} cy={-3} rx={6} ry={5} fill="#fffdfa" />
        <circle cx={2} cy={1} r={7} fill="#ffb300" />
        <circle cx={0} cy={-1} r={2.6} fill="#ffd979" />
      </g>
    ),
  },

  milk: {
    id: "milk",
    name: "Milk",
    taste: "yum",
    art: () => (
      <g>
        <path d="M-10,-6 L0,-16 L10,-6 L10,16 L-10,16 Z" fill="#fffdfa" />
        <rect x={-10} y={0} width={20} height={9} fill="#3aa0ff" />
        <path d="M-10,-6 L0,-16 L10,-6 Z" fill="#e4ecf6" />
        <circle cx={0} cy={4.5} r={3} fill="#fffdfa" />
      </g>
    ),
  },

  flour: {
    id: "flour",
    name: "Flour",
    taste: "yuck",
    art: () => (
      <g>
        <path d="M-12,-6 L12,-6 L14,16 L-14,16 Z" fill="#e8dcc4" />
        <path d="M-12,-6 q6,-6 12,-2 q6,-4 12,2 z" fill="#fffdfa" />
        <rect x={-7} y={2} width={14} height={9} rx={2} fill="#cbb994" />
      </g>
    ),
  },

  bread: {
    id: "bread",
    name: "Bread",
    taste: "yum",
    art: () => (
      <g>
        <path d="M-17,14 L-17,0 q17,-16 34,0 L17,14 Z" fill="#c98a3f" />
        <path d="M-17,1 q17,-15 34,0 q-17,7 -34,0 z" fill="#e8ab5c" />
        <path d="M-8,-4 l4,-5 M0,-6 l4,-5 M8,-4 l4,-4" stroke="#a9713f" strokeWidth={2.2} strokeLinecap="round" />
      </g>
    ),
  },

  // ---------------- cooked ----------------
  fruitSalad: {
    id: "fruitSalad",
    name: "Fruit salad",
    taste: "yum",
    art: () => (
      <g>
        <circle cx={-8} cy={-6} r={5} fill="#ff4d5e" />
        <circle cx={1} cy={-9} r={5} fill="#ffd23f" />
        <circle cx={9} cy={-5} r={4.5} fill="#ff9040" />
        <circle cx={-2} cy={-2} r={4} fill="#ff6fae" />
        {bowl("#c77dff")}
      </g>
    ),
  },

  milkshake: {
    id: "milkshake",
    name: "Milkshake",
    taste: "yum",
    art: () => (
      <g>
        <path d="M-11,-6 L11,-6 L8,17 L-8,17 Z" fill="#ffc2dc" />
        <path d="M-11,-6 L11,-6 L10,2 L-10,2 Z" fill="#ff8fc0" />
        <path d="M3,-8 q7,-6 4,-14" stroke="#ff4d7e" strokeWidth={3.5} fill="none" strokeLinecap="round" />
        <circle cx={-3} cy={-9} r={5.5} fill="#fffdfa" />
        <circle cx={4} cy={-11} r={4.5} fill="#fffdfa" />
        <circle cx={0} cy={-15} r={2.6} fill="#ff4d5e" />
      </g>
    ),
  },

  cake: {
    id: "cake",
    name: "Cake",
    taste: "yum",
    art: () => (
      <g>
        <rect x={-16} y={-1} width={32} height={16} rx={3} fill="#e8ab5c" />
        <rect x={-16} y={5} width={32} height={4} fill="#ff8fc0" />
        <path d="M-16,-1 q4,-8 8,-1 q4,-7 8,-1 q4,-7 8,-1 q4,-6 8,3 z" fill="#fffdfa" />
        <rect x={-1.5} y={-14} width={3} height={9} rx={1.5} fill="#3aa0ff" />
        <ellipse cx={0} cy={-16} rx={2.4} ry={3.4} fill="#ffd23f" />
      </g>
    ),
  },

  sandwich: {
    id: "sandwich",
    name: "Sandwich",
    taste: "yum",
    art: () => (
      <g>
        <path d="M-16,13 L0,-14 L16,13 Z" fill="#e8ab5c" />
        <path d="M-9,3 L0,-13 L9,3 Z" fill="#ffd23f" />
        <path d="M-12,7 q12,5 24,0 l-2,-4 q-10,4 -20,0 z" fill={LEAF} />
        <path d="M-16,13 h32" stroke="#c98a3f" strokeWidth={4} strokeLinecap="round" />
      </g>
    ),
  },

  salad: {
    id: "salad",
    name: "Salad",
    taste: "yum",
    art: () => (
      <g>
        <path d="M-13,-3 q5,-9 11,-3 q6,-7 11,3 z" fill={LEAF} />
        <circle cx={-6} cy={-5} r={3.4} fill="#ff4d5e" />
        <circle cx={7} cy={-6} r={3} fill="#ff9040" />
        {bowl("#2ed6b8")}
      </g>
    ),
  },

  soup: {
    id: "soup",
    name: "Soup",
    taste: "yum",
    art: () => (
      <g>
        <path
          className="steam-wisp"
          d="M-6,-8 q5,-5 0,-10 q-5,-5 0,-9 M6,-8 q5,-5 0,-10 q-5,-5 0,-9"
          stroke="#ffffff"
          strokeWidth={2.4}
          fill="none"
          strokeLinecap="round"
          opacity={0.7}
        />
        {bowl("#ff9040")}
        <ellipse cx={0} cy={1} rx={15} ry={4} fill="#ffc46b" />
      </g>
    ),
  },

  pancakes: {
    id: "pancakes",
    name: "Pancakes",
    taste: "yum",
    art: () => (
      <g>
        <ellipse cx={0} cy={11} rx={17} ry={5.5} fill="#e8ab5c" />
        <ellipse cx={0} cy={3} rx={16} ry={5.5} fill="#f0bb72" />
        <ellipse cx={0} cy={-5} rx={15} ry={5.5} fill="#e8ab5c" />
        <path d="M-12,-6 q6,8 13,2 q4,6 10,0 l1,5 q-12,6 -24,0 z" fill="#c98a3f" />
        <rect x={-5} y={-12} width={10} height={6} rx={2} fill="#ffd23f" />
      </g>
    ),
  },

  pizza: {
    id: "pizza",
    name: "Pizza",
    taste: "yum",
    art: () => (
      <g>
        <path d="M0,-15 L16,14 q-16,6 -32,0 Z" fill="#ffd23f" />
        <path d="M-16,14 q16,6 32,0 l2,4 q-18,7 -36,0 z" fill="#e8ab5c" />
        <circle cx={-4} cy={4} r={3.4} fill="#ff4d5e" />
        <circle cx={6} cy={8} r={3} fill="#ff4d5e" />
        <circle cx={1} cy={-4} r={2.6} fill="#ff4d5e" />
      </g>
    ),
  },
};

/**
 * What the pot turns two things into. Deliberately obvious pairs: the whole point is that a
 * small child can guess them without being told, and be right.
 */
export interface Recipe {
  needs: [string, string];
  makes: string;
}

export const RECIPES: Recipe[] = [
  { needs: ["apple", "banana"], makes: "fruitSalad" },
  { needs: ["strawberry", "milk"], makes: "milkshake" },
  { needs: ["flour", "egg"], makes: "cake" },
  { needs: ["bread", "cheese"], makes: "sandwich" },
  { needs: ["tomato", "lettuce"], makes: "salad" },
  { needs: ["potato", "carrot"], makes: "soup" },
  { needs: ["flour", "milk"], makes: "pancakes" },
  { needs: ["tomato", "cheese"], makes: "pizza" },
];

/** The pot doesn't care which order two things went in, so pairs are matched both ways round. */
export function recipeFor(a: string, b: string): Recipe | null {
  return (
    RECIPES.find(
      (r) => (r.needs[0] === a && r.needs[1] === b) || (r.needs[0] === b && r.needs[1] === a)
    ) ?? null
  );
}

/** Which stall sells what. Also decides what is drawn on the front of each stall. */
export const STALL_STOCK: Record<string, string[]> = {
  fruitStall: ["apple", "banana", "strawberry"],
  vegStall: ["carrot", "tomato", "potato", "lettuce"],
  bakeryStall: ["bread", "flour"],
  dairyStall: ["milk", "cheese", "egg"],
};

export const ALL_THING_IDS = new Set(Object.keys(THINGS));
