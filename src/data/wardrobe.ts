/** Everything the design mode offers, and the shape of a saved character. */

export interface AvatarLook {
  skin: string;
  hairId: string;
  hairColour: string;
  eyesId: string;
  irisColour: string;
  mouthId: string;
  topId: string | null;
  topColour: string;
  motifId: string | null;
  bottomId: string | null;
  bottomColour: string;
  shoesId: string | null;
  shoesColour: string;
}

export type CategoryId =
  | "top"
  | "bottom"
  | "shoes"
  | "motif"
  | "hair"
  | "eyes"
  | "mouth"
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
  /** Whether "none" is a valid choice (bare feet, no picture on the shirt). */
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

export const CATEGORIES: CategoryDef[] = [
  {
    id: "top",
    label: "Outfit",
    icon: "👗",
    allowNone: false,
    palette: FABRIC_COLOURS,
    items: [
      { id: "tshirt", name: "T-shirt" },
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
      { id: "skirt", name: "Skirt" },
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
    items: [
      { id: "heart", name: "Heart" },
      { id: "star", name: "Star" },
      { id: "rainbow", name: "Rainbow" },
      { id: "flower", name: "Flower" },
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
    id: "mouth",
    label: "Mouth",
    icon: "😀",
    allowNone: false,
    items: [
      { id: "smile", name: "Smile" },
      { id: "grin", name: "Big laugh" },
      { id: "open", name: "Ooh!" },
      { id: "surprised", name: "Surprised" },
      { id: "frown", name: "Grumpy" },
      { id: "sad", name: "Sad" },
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

export const DEFAULT_LOOK: AvatarLook = {
  skin: SKIN_TONES[1],
  hairId: "long",
  hairColour: HAIR_COLOURS[3],
  eyesId: "sparkle",
  irisColour: IRIS_COLOURS[3],
  mouthId: "smile",
  topId: "tshirt",
  topColour: "#ff6fae",
  motifId: "heart",
  bottomId: "jeans",
  bottomColour: "#3aa0ff",
  shoesId: "trainers",
  shoesColour: "#fffdfa",
};
