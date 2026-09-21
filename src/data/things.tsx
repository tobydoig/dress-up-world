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

/**
 * One cake, three flavours. Drawing them from the same shape is the point: a chocolate cake
 * is visibly the same cake as a plain one in a different colour, which is exactly the idea
 * the recipes are trying to get across.
 */
function cakeArt(sponge: string, icing: string, topper: string): ReactElement {
  return (
    <g>
      <rect x={-16} y={-1} width={32} height={16} rx={3} fill={sponge} />
      <rect x={-16} y={5} width={32} height={4} fill={icing} opacity={0.8} />
      <path d="M-16,-1 q4,-8 8,-1 q4,-7 8,-1 q4,-7 8,-1 q4,-6 8,3 z" fill={icing} />
      <circle cx={0} cy={-6} r={3.4} fill={topper} />
    </g>
  );
}

/**
 * A seed packet, with a picture of what it grows on the front. That picture is the only
 * label a child needs to tell one packet from another, and it says what will come up.
 */
function seedPacket(inside: () => ReactElement): ReactElement {
  return (
    <g>
      <path d="M-13,-17 L13,-17 L13,17 L-13,17 Z" fill="#e8dcc4" />
      <path d="M-13,-17 L13,-17 L13,-9 L-13,-9 Z" fill="#cbb994" />
      <path d="M-13,-9 h26" stroke="#b5a37e" strokeWidth={1.4} strokeDasharray="3 3" />
      <g transform="translate(0 5) scale(0.44)">{inside()}</g>
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
        <ellipse cx={0} cy={1} rx={12} ry={16} fill="#f5e3c8" />
        <ellipse cx={-4} cy={-5} rx={4} ry={6} fill="#fffdfa" opacity={0.6} />
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
  butter: {
    id: "butter",
    name: "Butter",
    taste: "yuck",
    art: () => (
      <g>
        <path d="M-16,4 L-10,-6 L16,-6 L16,8 L-16,8 Z" fill="#ffd96b" />
        <path d="M-16,4 L-10,-6 L16,-6 L10,4 Z" fill="#ffe89a" />
        <path d="M10,4 L16,-6 L16,8 L10,8 Z" fill="#e8bd4e" />
      </g>
    ),
  },

  sugar: {
    id: "sugar",
    name: "Sugar",
    taste: "yum",
    art: () => (
      <g>
        {([
          [-8, 4], [6, 4], [-1, -8],
        ] as Array<[number, number]>).map(([x, y]) => (
          <g key={x}>
            <rect x={x - 7} y={y - 6} width={14} height={12} rx={2} fill="#fffdfa" />
            <rect x={x - 7} y={y - 6} width={14} height={4} rx={2} fill="#e8eef5" />
          </g>
        ))}
      </g>
    ),
  },

  cocoa: {
    id: "cocoa",
    name: "Cocoa",
    taste: "yuck",
    art: () => (
      <g>
        <rect x={-11} y={-6} width={22} height={22} rx={3} fill="#7b4a2d" />
        <rect x={-13} y={-11} width={26} height={7} rx={3} fill="#5c3520" />
        <circle cx={0} cy={4} r={6} fill="#a9713f" />
        <path d="M-3,2 q3,-4 6,0 q-3,4 -6,0 z" fill="#5c3520" />
      </g>
    ),
  },

  lemon: {
    id: "lemon",
    name: "Lemon",
    taste: "yuck",
    art: () => (
      <g>
        <ellipse cx={0} cy={2} rx={15} ry={11} fill="#ffd93f" />
        <path d="M-15,2 q-4,0 -5,-2 q3,-2 5,-1 z M15,2 q4,0 5,-2 q-3,-2 -5,-1 z" fill="#e8bd2c" />
        <ellipse cx={-5} cy={-2} rx={4} ry={3} fill="#fff0a0" opacity={0.7} />
        <path d="M2,-8 q8,-6 13,-5 q-4,7 -12,6 z" fill={LEAF} />
      </g>
    ),
  },

  friedEgg: {
    id: "friedEgg",
    name: "Fried egg",
    taste: "yum",
    art: () => (
      <g>
        <ellipse cx={0} cy={3} rx={17} ry={12} fill="#fffdfa" />
        <ellipse cx={-10} cy={-2} rx={7} ry={6} fill="#fffdfa" />
        <ellipse cx={9} cy={7} rx={6} ry={5} fill="#fffdfa" />
        <circle cx={2} cy={2} r={7} fill="#ffb300" />
        <circle cx={0} cy={0} r={2.6} fill="#ffd979" />
      </g>
    ),
  },

  boiledEgg: {
    id: "boiledEgg",
    name: "Boiled egg",
    taste: "yum",
    art: () => (
      <g>
        <path d="M-11,6 q0,-16 11,-16 q11,0 11,16 z" fill="#fffdfa" />
        <ellipse cx={0} cy={-10} rx={11} ry={4} fill="#ffe08a" />
        <ellipse cx={0} cy={-10} rx={5} ry={2.4} fill="#ffb300" />
        <path d="M-13,6 h26 l-3,10 h-20 z" fill="#3aa0ff" />
      </g>
    ),
  },

  chips: {
    id: "chips",
    name: "Chips",
    taste: "yum",
    art: () => (
      <g>
        {([
          [-9, -4, -14], [-2, -8, -4], [5, -6, 8], [11, -1, 18],
        ] as Array<[number, number, number]>).map(([x, y, r]) => (
          <rect
            key={x}
            x={x - 3.5}
            y={y - 12}
            width={7}
            height={24}
            rx={2}
            fill="#ffc94d"
            transform={"rotate(" + r + " " + x + " " + y + ")"}
          />
        ))}
        <path d="M-14,4 L14,4 L11,17 L-11,17 Z" fill="#ff4d5e" />
        <path d="M-14,4 L14,4 L13,9 L-13,9 Z" fill="#ff7a8a" />
      </g>
    ),
  },

  mash: {
    id: "mash",
    name: "Mashed potato",
    taste: "yum",
    art: () => (
      <g>
        <path d="M-14,0 q3,-14 14,-14 q11,0 14,14 z" fill="#fff4dc" />
        <path d="M-7,-5 q3,-5 7,-4 M3,-8 q4,-1 5,3" stroke="#e8d8b8" strokeWidth={2} fill="none" strokeLinecap="round" />
        {bowl("#5ed64a")}
      </g>
    ),
  },

  bakedPotato: {
    id: "bakedPotato",
    name: "Jacket potato",
    taste: "yum",
    art: () => (
      <g>
        <ellipse cx={0} cy={2} rx={17} ry={12} fill="#a9713f" />
        <path d="M-11,2 q11,-7 22,0 q-11,6 -22,0 z" fill="#fff4dc" />
        <rect x={-4} y={-3} width={9} height={6} rx={1.5} fill="#ffd96b" />
        {[-13, -6, 8, 14].map((x) => (
          <ellipse key={x} cx={x} cy={7} rx={2} ry={1.4} fill="#7b4a2d" />
        ))}
      </g>
    ),
  },

  toast: {
    id: "toast",
    name: "Toast",
    taste: "yum",
    art: () => (
      <g>
        <path d="M-14,14 L-14,-2 q0,-12 14,-12 q14,0 14,12 L14,14 Z" fill="#c98a3f" />
        <path d="M-10,10 L-10,-1 q0,-8 10,-8 q10,0 10,8 L10,10 Z" fill="#e8ab5c" />
        <rect x={-5} y={-4} width={10} height={7} rx={2} fill="#ffd96b" />
      </g>
    ),
  },

  pancakeBatter: {
    id: "pancakeBatter",
    name: "Pancake batter",
    taste: "yuck",
    art: () => (
      <g>
        <path d="M6,-14 q9,-7 13,-2 q-5,7 -13,4 z" fill="#b9b2cf" />
        <ellipse cx={0} cy={-1} rx={15} ry={4} fill="#fff0cc" />
        {bowl("#3aa0ff")}
      </g>
    ),
  },

  cakeBatter: {
    id: "cakeBatter",
    name: "Cake mix",
    taste: "yuck",
    art: () => (
      <g>
        <ellipse cx={0} cy={-2} rx={15} ry={5} fill="#ffe08a" />
        <ellipse cx={-4} cy={-4} rx={5} ry={2.4} fill="#fff0cc" />
        {bowl("#ff6fae")}
      </g>
    ),
  },

  omelette: {
    id: "omelette",
    name: "Omelette",
    taste: "yum",
    art: () => (
      <g>
        <path d="M-17,8 q2,-18 17,-18 q15,0 17,18 z" fill="#ffd23f" />
        <path d="M-17,8 q17,7 34,0 z" fill="#e8bd2c" />
        <path d="M-6,-2 q6,-5 12,0" stroke="#ffb300" strokeWidth={2.4} fill="none" strokeLinecap="round" />
      </g>
    ),
  },

  hotChocolate: {
    id: "hotChocolate",
    name: "Hot chocolate",
    taste: "yum",
    art: () => (
      <g>
        <path
          className="steam-wisp"
          d="M-5,-12 q5,-5 0,-9 M5,-12 q5,-5 0,-9"
          stroke="#ffffff"
          strokeWidth={2.4}
          fill="none"
          strokeLinecap="round"
          opacity={0.65}
        />
        <path d="M-12,-8 h24 l-3,22 h-18 z" fill="#fffdfa" />
        <ellipse cx={0} cy={-8} rx={12} ry={4} fill="#7b4a2d" />
        <path d="M12,-4 q8,2 6,9 q-2,4 -7,3" stroke="#fffdfa" strokeWidth={3} fill="none" />
      </g>
    ),
  },

  applePie: {
    id: "applePie",
    name: "Apple pie",
    taste: "yum",
    art: () => (
      <g>
        <path d="M-18,12 q0,-18 18,-18 q18,0 18,18 z" fill="#e8ab5c" />
        <path d="M-12,2 h24 M-9,8 h18 M-4,-4 v18 M6,-4 v18" stroke="#c98a3f" strokeWidth={2.4} strokeLinecap="round" />
        <path d="M-20,12 h40 l-2,6 h-36 z" fill="#c98a3f" />
      </g>
    ),
  },

  chocolateCake: {
    id: "chocolateCake",
    name: "Chocolate cake",
    taste: "yum",
    art: () => cakeArt("#7b4a2d", "#5c3520", "#ff4d5e"),
  },

  lemonCake: {
    id: "lemonCake",
    name: "Lemon cake",
    taste: "yum",
    art: () => cakeArt("#ffe08a", "#ffd93f", "#9be07a"),
  },
  // ---------------- seeds ----------------
  lettuceSeeds: {
    id: "lettuceSeeds",
    name: "Lettuce seeds",
    taste: "yuck",
    art: () => seedPacket(THINGS.lettuce.art),
  },

  carrotSeeds: {
    id: "carrotSeeds",
    name: "Carrot seeds",
    taste: "yuck",
    art: () => seedPacket(THINGS.carrot.art),
  },

  strawberrySeeds: {
    id: "strawberrySeeds",
    name: "Strawberry seeds",
    taste: "yuck",
    art: () => seedPacket(THINGS.strawberry.art),
  },

  tomatoSeeds: {
    id: "tomatoSeeds",
    name: "Tomato seeds",
    taste: "yuck",
    art: () => seedPacket(THINGS.tomato.art),
  },

  potatoSeeds: {
    id: "potatoSeeds",
    name: "Potato seeds",
    taste: "yuck",
    art: () => seedPacket(THINGS.potato.art),
  },

  appleSeeds: {
    id: "appleSeeds",
    name: "Apple pips",
    taste: "yuck",
    art: () => seedPacket(THINGS.apple.art),
  },

  lemonSeeds: {
    id: "lemonSeeds",
    name: "Lemon pips",
    taste: "yuck",
    art: () => seedPacket(THINGS.lemon.art),
  },
};

/**
 * How something is cooked, which matters as much as what goes in it: a potato fried, boiled
 * and baked is three different dinners. Each one is a thing in the kitchen rather than a word
 * on a button, so none of it has to be read.
 */
export type Method = "bowl" | "pan" | "pot" | "oven";

export const APPLIANCES: Array<{ id: Method; name: string; icon: string }> = [
  { id: "bowl", name: "Mix", icon: "🥣" },
  { id: "pan", name: "Fry", icon: "🍳" },
  { id: "pot", name: "Boil", icon: "🍲" },
  { id: "oven", name: "Bake", icon: "🔥" },
];

/** As many things as will go in at once. */
export const MAX_POT = 4;

export interface Recipe {
  method: Method;
  needs: string[];
  makes: string;
}

/**
 * Real recipes, as far as they go. If the point is to pick up what actually goes into a cake
 * then a wrong recipe teaches a wrong thing just as well as a right one teaches a right one,
 * so these are the genuine ingredients — a sponge really is flour, egg, butter and sugar.
 *
 * Two ideas are doing the teaching. One is that the method changes the food: the same potato
 * is chips, mash or a jacket potato depending on where it goes. The other is that things you
 * have made can be used again — a batter is a real step, and it is what leaves room for a
 * variation to fit inside four slots. Cake plus cocoa would be five.
 */
export const RECIPES: Recipe[] = [
  // Mixed in a bowl, no heat.
  { method: "bowl", needs: ["apple", "banana"], makes: "fruitSalad" },
  { method: "bowl", needs: ["tomato", "lettuce"], makes: "salad" },
  { method: "bowl", needs: ["strawberry", "milk"], makes: "milkshake" },
  { method: "bowl", needs: ["bread", "cheese"], makes: "sandwich" },
  { method: "bowl", needs: ["flour", "egg", "milk"], makes: "pancakeBatter" },
  { method: "bowl", needs: ["flour", "egg", "butter", "sugar"], makes: "cakeBatter" },

  // Fried in a pan.
  { method: "pan", needs: ["egg"], makes: "friedEgg" },
  { method: "pan", needs: ["potato"], makes: "chips" },
  { method: "pan", needs: ["egg", "cheese"], makes: "omelette" },
  { method: "pan", needs: ["pancakeBatter"], makes: "pancakes" },

  // Boiled in a pot.
  { method: "pot", needs: ["egg"], makes: "boiledEgg" },
  { method: "pot", needs: ["potato"], makes: "mash" },
  { method: "pot", needs: ["potato", "carrot"], makes: "soup" },
  { method: "pot", needs: ["milk", "cocoa"], makes: "hotChocolate" },

  // Baked in the oven.
  { method: "oven", needs: ["bread"], makes: "toast" },
  { method: "oven", needs: ["potato"], makes: "bakedPotato" },
  { method: "oven", needs: ["cakeBatter"], makes: "cake" },
  { method: "oven", needs: ["cakeBatter", "cocoa"], makes: "chocolateCake" },
  { method: "oven", needs: ["cakeBatter", "lemon"], makes: "lemonCake" },
  { method: "oven", needs: ["flour", "tomato", "cheese"], makes: "pizza" },
  { method: "oven", needs: ["apple", "flour", "butter", "sugar"], makes: "applePie" },
];

function tally(ids: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return counts;
}

/** Counting rather than set logic, so two of the same thing is a different bowl from one. */
function fitsInside(part: string[], whole: string[]): boolean {
  const have = tally(whole);
  for (const [id, n] of tally(part)) if ((have.get(id) ?? 0) < n) return false;
  return true;
}

function sortedKey(ids: string[]): string {
  return [...ids].sort().join("+");
}

/** Nothing cares what order things went in, so both sides are sorted before comparing. */
export function recipeFor(method: Method, ids: string[]): Recipe | null {
  if (ids.length === 0) return null;
  const key = sortedKey(ids);
  return RECIPES.find((r) => r.method === method && sortedKey(r.needs) === key) ?? null;
}

/**
 * How many more things the nearest recipe is waiting for — 0 when what's in there already
 * makes something, and null when nothing starts this way at all.
 *
 * This is the whole discovery mechanism. There are thousands of combinations of sixteen
 * ingredients across four slots, so guessing blind would mean five failures and a child who
 * has gone to do something else instead. Showing that a bowl is short of something, without
 * saying what, keeps it a puzzle rather than a lottery.
 */
export function stillMissing(ids: string[]): number | null {
  if (ids.length === 0) return null;
  let best: number | null = null;
  for (const recipe of RECIPES) {
    if (recipe.needs.length < ids.length) continue;
    if (!fitsInside(ids, recipe.needs)) continue;
    const gap = recipe.needs.length - ids.length;
    if (best === null || gap < best) best = gap;
  }
  return best;
}

/** Which stall sells what. Also decides what is drawn on the front of each stall. */
export const STALL_STOCK: Record<string, string[]> = {
  fruitStall: ["apple", "banana", "strawberry", "lemon"],
  vegStall: ["carrot", "tomato", "potato", "lettuce"],
  bakeryStall: ["bread", "flour", "sugar", "cocoa"],
  dairyStall: ["milk", "cheese", "egg", "butter"],
  // In the garden rather than the market: the market's four stalls already fill the width,
  // and a seed table belongs where the growing happens anyway.
  seedTable: [
    "lettuceSeeds",
    "carrotSeeds",
    "strawberrySeeds",
    "tomatoSeeds",
    "potatoSeeds",
    "appleSeeds",
    "lemonSeeds",
  ],
};

export const ALL_THING_IDS = new Set(Object.keys(THINGS));
