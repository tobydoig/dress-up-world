export type RoomId = "playroom" | "kitchen" | "bedroom" | "study";

export interface RoomDef {
  id: RoomId;
  name: string;
  icon: string;
  wall: string;
  wallTrim: string;
  floor: string;
  floorBoards: string;
  /** Pieces that start placed the first time the room is opened. */
  startWith: string[];
}

/** Left-to-right order — the arrows walk along this list and stop at each end. */
export const ROOM_ORDER: RoomId[] = ["playroom", "kitchen", "bedroom", "study"];

export const ROOMS: Record<RoomId, RoomDef> = {
  playroom: {
    id: "playroom",
    name: "Play room",
    icon: "🧸",
    wall: "#ffd9e8",
    wallTrim: "#ffb3d1",
    floor: "#f0b97e",
    floorBoards: "#d99a5e",
    startWith: ["playRug", "toyBox", "teddy"],
  },

  kitchen: {
    id: "kitchen",
    name: "Kitchen",
    icon: "🍳",
    wall: "#d6f0e4",
    wallTrim: "#a8dcc6",
    floor: "#e0e4ee",
    floorBoards: "#c3c9d8",
    startWith: ["counter", "fridge", "diningTable", "chairLeft", "chairRight"],
  },

  bedroom: {
    id: "bedroom",
    name: "Bedroom",
    icon: "🛏️",
    wall: "#dfe0ff",
    wallTrim: "#b9bbf5",
    floor: "#e8c9a8",
    floorBoards: "#cfa87e",
    startWith: ["bedroomRug", "bed", "wardrobe", "bedsideLamp"],
  },

  study: {
    id: "study",
    name: "Study",
    icon: "📚",
    wall: "#e8e2d2",
    wallTrim: "#c9bfa6",
    floor: "#9c7b5c",
    floorBoards: "#7d6047",
    startWith: ["desk", "computer", "bookcase", "shelves", "plantBig", "deskLamp"],
  },
};

/**
 * The whole furniture catalogue. Grouping is just how the menu is organised — any piece can go
 * in any room, so a bed can end up in the kitchen if that's what you want. Each room's
 * `startWith` only decides what is already there the first time you open it.
 */
export interface FurnitureGroup {
  label: string;
  icon: string;
  items: Array<{ id: string; name: string }>;
}

export const FURNITURE_GROUPS: FurnitureGroup[] = [
  {
    label: "Play room",
    icon: "🧸",
    items: [
      { id: "playRug", name: "Round rug" },
      { id: "toyBox", name: "Toy box" },
      { id: "blocks", name: "Blocks" },
      { id: "teddy", name: "Teddy" },
      { id: "easel", name: "Easel" },
      { id: "balloons", name: "Balloons" },
    ],
  },
  {
    label: "Kitchen",
    icon: "🍳",
    items: [
      { id: "counter", name: "Counter" },
      { id: "fridge", name: "Fridge" },
      { id: "diningTable", name: "Table" },
      { id: "chairLeft", name: "Chair" },
      { id: "chairRight", name: "Chair 2" },
      { id: "fruitBowl", name: "Fruit bowl" },
      { id: "kitchenPlant", name: "Plant" },
    ],
  },
  {
    label: "Study",
    icon: "📚",
    items: [
      { id: "desk", name: "Desk" },
      { id: "computer", name: "Computer" },
      { id: "deskLamp", name: "Desk lamp" },
      { id: "bookcase", name: "Bookcase" },
      { id: "shelves", name: "Shelves" },
      { id: "plantBig", name: "Big plant" },
      { id: "plantSmall", name: "Little plant" },
    ],
  },
  {
    label: "Bedroom",
    icon: "🛏️",
    items: [
      { id: "bedroomRug", name: "Oval rug" },
      { id: "bed", name: "Bed" },
      { id: "wardrobe", name: "Wardrobe" },
      { id: "bedsideLamp", name: "Lamp" },
      { id: "poster", name: "Poster" },
      { id: "plushie", name: "Plushie" },
    ],
  },
];

export const ALL_FURNITURE_IDS = new Set(FURNITURE_GROUPS.flatMap((g) => g.items.map((i) => i.id)));
