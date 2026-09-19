export type RoomId = "playroom" | "kitchen" | "bedroom";

export interface RoomDef {
  id: RoomId;
  name: string;
  icon: string;
  wall: string;
  wallTrim: string;
  floor: string;
  floorBoards: string;
  /** Furniture available in this room, in the order shown in the drawer. */
  furniture: Array<{ id: string; name: string }>;
  /** Pieces that start placed the first time the room is opened. */
  startWith: string[];
}

/** Left-to-right order — the arrows walk along this list and stop at each end. */
export const ROOM_ORDER: RoomId[] = ["playroom", "kitchen", "bedroom"];

export const ROOMS: Record<RoomId, RoomDef> = {
  playroom: {
    id: "playroom",
    name: "Play room",
    icon: "🧸",
    wall: "#ffd9e8",
    wallTrim: "#ffb3d1",
    floor: "#f0b97e",
    floorBoards: "#d99a5e",
    furniture: [
      { id: "playRug", name: "Rug" },
      { id: "toyBox", name: "Toy box" },
      { id: "blocks", name: "Blocks" },
      { id: "teddy", name: "Teddy" },
      { id: "easel", name: "Easel" },
      { id: "balloons", name: "Balloons" },
    ],
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
    furniture: [
      { id: "counter", name: "Counter" },
      { id: "fridge", name: "Fridge" },
      { id: "diningTable", name: "Table" },
      { id: "chairs", name: "Chairs" },
      { id: "fruitBowl", name: "Fruit" },
      { id: "kitchenPlant", name: "Plant" },
    ],
    startWith: ["counter", "fridge", "diningTable", "chairs"],
  },

  bedroom: {
    id: "bedroom",
    name: "Bedroom",
    icon: "🛏️",
    wall: "#dfe0ff",
    wallTrim: "#b9bbf5",
    floor: "#e8c9a8",
    floorBoards: "#cfa87e",
    furniture: [
      { id: "bedroomRug", name: "Rug" },
      { id: "bed", name: "Bed" },
      { id: "wardrobe", name: "Wardrobe" },
      { id: "bedsideLamp", name: "Lamp" },
      { id: "poster", name: "Poster" },
      { id: "plushie", name: "Plushie" },
    ],
    startWith: ["bedroomRug", "bed", "wardrobe", "bedsideLamp"],
  },
};
