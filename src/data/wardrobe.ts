/** Everything the design mode offers, and the shape of a saved character. */

export interface AvatarLook {
  skin: string;
  hairId: string;
  hairColour: string;
  eyesId: string;
  irisColour: string;
  noseId: string | null;
  mouthId: string;
  blushId: string | null;
  blushColour: string;
  topId: string | null;
  topColour: string;
  motifId: string | null;
  motifColour: string;
  bottomId: string | null;
  bottomColour: string;
  shoesId: string | null;
  shoesColour: string;
  headId: string | null;
  headColour: string;
  glassesId: string | null;
  glassesColour: string;
  jewelsId: string | null;
  jewelsColour: string;
}

export type CategoryId =
  | "top"
  | "bottom"
  | "shoes"
  | "motif"
  | "hair"
  | "head"
  | "glasses"
  | "jewels"
  | "eyes"
  | "nose"
  | "mouth"
  | "blush"
  | "skin";

export interface WardrobeItem {
  id: string;
  name: string;
}

export interface CategoryDef {
  id: CategoryId;
  label: string;
  icon: string;
  items: WardrobeItem[];
  /** Whether "none" is a valid choice (bare feet, no glasses). */
  allowNone: boolean;
  /** Swatches shown under the items; absent when the item itself carries the colour. */
  palette?: string[];
}

export const FABRIC_COLOURS = [
  "#ff6fae", "#ff4d5e", "#ff9040", "#ffd23f", "#5ed64a", "#2ed6b8",
  "#3aa0ff", "#7b5cf6", "#c77dff", "#fffdfa", "#8d6e5c", "#3a3a4a",
];

export const HAIR_COLOURS = [
  "#2f2418", "#6b4226", "#a9713f", "#c98a3f", "#e8c064", "#f3dd9a",
  "#e8e8f0", "#ff6fae", "#7b5cf6", "#3aa0ff", "#2ed6b8", "#ff4d5e",
];

export const SKIN_TONES = [
  "#ffdcc0", "#f6c79d", "#e8ab77", "#c98a5b", "#a06840", "#7a4a2b", "#53331d",
];

export const IRIS_COLOURS = [
  "#5b3a1e", "#8b5a2b", "#2f7d4f", "#2f6fb0", "#4fb8c9", "#7b5cf6", "#3a3346",
];

export const MAKEUP_COLOURS = [
  "#ff6f8f", "#ff4d7e", "#ff8f6f", "#ffb3c1", "#e0566f", "#c77dff", "#7b5cf6", "#ffd23f",
];

/** Golds and silvers first — most jewellery reads better in a metal than a bright. */
export const ACCESSORY_COLOURS = [
  "#ffd23f", "#e6e9f2", "#ffb3a0", "#ff6fae", "#ff4d5e", "#c77dff",
  "#7b5cf6", "#3aa0ff", "#2ed6b8", "#5ed64a", "#fffdfa", "#3a3a4a",
];

export const CATEGORIES: CategoryDef[] = [
  {
    id: "top",
    label: "Outfit",
    icon: "👗",
    allowNone: false,
    palette: FABRIC_COLOURS,
    items: [
      { id: "tshirt", name: "T-shirt" },
      { id: "blouse", name: "Blouse" },
      { id: "shirtTie", name: "Shirt & tie" },
      { id: "jacket", name: "Suit jacket" },
      { id: "hoodie", name: "Hoodie" },
      { id: "stripes", name: "Stripes" },
      { id: "tank", name: "Vest top" },
      { id: "dress", name: "Dress" },
      { id: "partyDress", name: "Party dress" },
    ],
  },
  {
    id: "bottom",
    label: "Legs",
    icon: "👖",
    allowNone: false,
    palette: FABRIC_COLOURS,
    items: [
      { id: "jeans", name: "Jeans" },
      { id: "trousers", name: "Trousers" },
      { id: "skirt", name: "Skirt" },
      { id: "pleatedSkirt", name: "Pleated skirt" },
      { id: "pencilSkirt", name: "Smart skirt" },
      { id: "shorts", name: "Shorts" },
      { id: "leggings", name: "Leggings" },
    ],
  },
  {
    id: "shoes",
    label: "Shoes",
    icon: "👟",
    allowNone: true,
    palette: FABRIC_COLOURS,
    items: [
      { id: "trainers", name: "Trainers" },
      { id: "boots", name: "Boots" },
      { id: "flats", name: "Pumps" },
    ],
  },
  {
    id: "motif",
    label: "Picture",
    icon: "⭐",
    allowNone: true,
    // The rainbow is the one picture that keeps its own colours — it has no single colour to
    // change without stopping being a rainbow.
    palette: FABRIC_COLOURS,
    items: [
      { id: "heart", name: "Heart" },
      { id: "star", name: "Star" },
      { id: "rainbow", name: "Rainbow" },
      { id: "flower", name: "Flower" },
      { id: "butterfly", name: "Butterfly" },
      { id: "cat", name: "Cat" },
      { id: "sun", name: "Sun" },
      { id: "moon", name: "Moon" },
      { id: "cloud", name: "Cloud" },
      { id: "lightning", name: "Lightning" },
      { id: "iceCream", name: "Ice cream" },
      { id: "music", name: "Music" },
    ],
  },
  {
    id: "hair",
    label: "Hair",
    icon: "💇",
    allowNone: false,
    palette: HAIR_COLOURS,
    items: [
      { id: "long", name: "Long" },
      { id: "bob", name: "Bob" },
      { id: "bunches", name: "Bunches" },
      { id: "curly", name: "Curly" },
      { id: "ponytail", name: "Ponytail" },
    ],
  },
  {
    id: "head",
    label: "Head",
    icon: "👑",
    allowNone: true,
    palette: ACCESSORY_COLOURS,
    items: [
      { id: "hairband", name: "Hairband" },
      { id: "bow", name: "Bow" },
      { id: "crown", name: "Crown" },
      { id: "catEars", name: "Cat ears" },
      { id: "flower", name: "Flower" },
      { id: "sunHat", name: "Sun hat" },
    ],
  },
  {
    id: "glasses",
    label: "Glasses",
    icon: "👓",
    allowNone: true,
    palette: ACCESSORY_COLOURS,
    items: [
      { id: "round", name: "Round" },
      { id: "square", name: "Square" },
      { id: "sunnies", name: "Shades" },
      { id: "heartSunnies", name: "Hearts" },
    ],
  },
  {
    id: "jewels",
    label: "Jewels",
    icon: "💎",
    allowNone: true,
    palette: ACCESSORY_COLOURS,
    items: [
      { id: "pendant", name: "Pendant" },
      { id: "heartNecklace", name: "Heart" },
      { id: "pearls", name: "Pearls" },
      { id: "hoops", name: "Hoops" },
      { id: "studsAndChain", name: "Studs" },
    ],
  },
  {
    id: "eyes",
    label: "Eyes",
    icon: "👀",
    allowNone: false,
    palette: IRIS_COLOURS,
    items: [
      { id: "round", name: "Round" },
      { id: "sparkle", name: "Sparkly" },
      { id: "happy", name: "Happy" },
      { id: "wink", name: "Wink" },
      { id: "sleepy", name: "Sleepy" },
    ],
  },
  {
    id: "nose",
    label: "Nose",
    icon: "👃",
    allowNone: true,
    items: [
      { id: "button", name: "Button" },
      { id: "curve", name: "Curvy" },
      { id: "dots", name: "Dots" },
      { id: "freckles", name: "Freckles" },
    ],
  },
  {
    id: "mouth",
    label: "Mouth",
    icon: "😀",
    allowNone: false,
    items: [
      { id: "smile", name: "Smile" },
      { id: "grin", name: "Big laugh" },
      { id: "open", name: "Ooh!" },
      { id: "surprised", name: "Surprised" },
      { id: "smirk", name: "Smirk" },
      { id: "blank", name: "Blank" },
      { id: "frown", name: "Grumpy" },
      { id: "sad", name: "Sad" },
    ],
  },
  {
    id: "blush",
    label: "Makeup",
    icon: "💄",
    allowNone: true,
    palette: MAKEUP_COLOURS,
    items: [
      { id: "soft", name: "Soft" },
      { id: "bold", name: "Bold" },
      { id: "doll", name: "Dolly" },
      { id: "hearts", name: "Hearts" },
      { id: "stars", name: "Stars" },
      { id: "sparkle", name: "Sparkle" },
    ],
  },
  {
    id: "skin",
    label: "Skin",
    icon: "🎨",
    allowNone: false,
    items: SKIN_TONES.map((hex, i) => ({ id: hex, name: "Tone " + (i + 1) })),
  },
];

/**
 * Before pictures had a colour of their own, each one was drawn in a fixed colour. A character
 * saved back then is given the colour she was actually looking at, so loading this version
 * doesn't quietly turn her yellow star pink.
 */
export const LEGACY_MOTIF_COLOUR: Record<string, string> = {
  heart: "#ff4d7e",
  star: "#ffd23f",
  flower: "#fffdfa",
  rainbow: "#ff4d7e",
};

export const DEFAULT_LOOK: AvatarLook = {
  skin: SKIN_TONES[1],
  hairId: "long",
  hairColour: HAIR_COLOURS[3],
  eyesId: "sparkle",
  irisColour: IRIS_COLOURS[3],
  noseId: "button",
  mouthId: "smile",
  blushId: "soft",
  blushColour: MAKEUP_COLOURS[0],
  topId: "tshirt",
  topColour: "#ff6fae",
  motifId: "heart",
  motifColour: "#ff4d7e",
  bottomId: "jeans",
  bottomColour: "#3aa0ff",
  shoesId: "trainers",
  shoesColour: "#fffdfa",
  headId: null,
  headColour: ACCESSORY_COLOURS[0],
  glassesId: null,
  glassesColour: ACCESSORY_COLOURS[0],
  jewelsId: null,
  jewelsColour: ACCESSORY_COLOURS[0],
};

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function maybe(chance: number, value: string): string | null {
  return Math.random() < chance ? value : null;
}

export function randomLook(): AvatarLook {
  const byId = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!.items;
  const topColour = pick(FABRIC_COLOURS);
  // Same colour top and bottom merges into one shapeless block.
  const bottomColour = pick(FABRIC_COLOURS.filter((c) => c !== topColour));
  return {
    skin: pick(SKIN_TONES),
    hairId: pick(byId("hair")).id,
    hairColour: pick(HAIR_COLOURS),
    eyesId: pick(byId("eyes")).id,
    irisColour: pick(IRIS_COLOURS),
    noseId: pick(byId("nose")).id,
    mouthId: pick(byId("mouth")).id,
    blushId: maybe(0.8, pick(byId("blush")).id),
    blushColour: pick(MAKEUP_COLOURS),
    topId: pick(byId("top")).id,
    topColour,
    motifId: maybe(0.7, pick(byId("motif")).id),
    // A picture the same colour as the top it sits on would be invisible.
    motifColour: pick(FABRIC_COLOURS.filter((c) => c !== topColour)),
    bottomId: pick(byId("bottom")).id,
    bottomColour,
    shoesId: pick(byId("shoes")).id,
    shoesColour: pick(FABRIC_COLOURS),
    headId: maybe(0.5, pick(byId("head")).id),
    headColour: pick(ACCESSORY_COLOURS),
    glassesId: maybe(0.25, pick(byId("glasses")).id),
    glassesColour: pick(ACCESSORY_COLOURS),
    jewelsId: maybe(0.45, pick(byId("jewels")).id),
    jewelsColour: pick(ACCESSORY_COLOURS),
  };
}
