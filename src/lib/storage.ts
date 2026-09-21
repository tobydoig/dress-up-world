import { DEFAULT_LOOK, LEGACY_MOTIF_COLOUR, type AvatarLook } from "../data/wardrobe";
import { ALL_FURNITURE_IDS, ROOMS, ROOM_ORDER, type RoomId } from "../data/rooms";
import { ALL_THING_IDS } from "../data/things";
import { CROPS } from "../data/growing";

export interface SavedCharacter {
  id: string;
  name: string;
  look: AvatarLook;
}

/** One finger-stroke in the picture frame: a colour and a flat [x,y,x,y,...] run of points. */
export interface Stroke {
  colour: string;
  width: number;
  points: number[];
}

/**
 * Furniture positions are stored as an OFFSET from where the piece is drawn in furniture.tsx,
 * not as an absolute position. A brand new room therefore has every offset at zero and looks
 * exactly as authored, and the art can be nudged later without invalidating saved rooms.
 *
 * The rest is whatever that particular piece remembers about itself: which way round it is
 * standing, whether its doors are open, whether its bulb is on, what has been put inside it,
 * and — for a picture frame — what has been drawn in it.
 */
export interface PlacedFurniture {
  id: string;
  dx: number;
  dy: number;
  /** Quarter turns about the upright axis, 0-3. Only pieces that can turn ever change it. */
  facing: number;
  open: boolean;
  on: boolean;
  /** Ids from THINGS that have been put inside this piece. */
  stored: string[];
  strokes: Stroke[];
  /** A growing bed: which crop is in it, how many waterings it has had, and when the last
   *  one was. Growth comes from the waterings; the timestamp only decides when the next
   *  drink is due. */
  planted: string | null;
  stage: number;
  wateredAt: number;
  /** Which of its looks the piece is showing; what that means is up to the piece. */
  mode: number;
}

export type AvatarPose = "stand" | "sit" | "lie";

/** One setting for the whole world, so walking into the next room doesn't change the time. */
export type TimeOfDay = "day" | "night";

export const TIME_ORDER: TimeOfDay[] = ["day", "night"];

/**
 * There used to be a teatime in the middle. Two states make the button a light switch — one
 * tap, one obvious result — where three made it a cycle you had to step through.
 */
const LEGACY_DUSK = "dusk";

/** Where one character is standing in one room. */
export interface Placement {
  /** Room coordinates, at their feet. */
  x: number;
  y: number;
  pose: AvatarPose;
  /**
   * Which piece they are sitting or lying on, by id. Worked out from coordinates once, which
   * broke the moment a chair could be turned: the seat moves, the saved position doesn't, and
   * the character is suddenly sitting on nothing. Remembering the piece makes it explicit.
   */
  seat: string | null;
}

export interface RoomState {
  items: PlacedFurniture[];
  /**
   * Where each character who is out is standing, by character id. Somebody who is out but has
   * never been in this room has no entry, and starts at their spot in the line-up.
   */
  places: Record<string, Placement>;
}

export interface GameSave {
  characters: SavedCharacter[];
  activeId: string | null;
  /** Who is out in the world, in the order they came out. At most MAX_CAST of them. */
  inScene: string[];
  rooms: Record<RoomId, RoomState>;
  lastRoom: RoomId;
  /** What the character is carrying. Follows them from room to room. */
  basket: string[];
  timeOfDay: TimeOfDay;
}

const KEY = "dress-up-world:save:v1";

export const AVATAR_HOME = { x: 200, y: 408 };

/**
 * How many can be out at once. Three fills the room without turning it into a crowd, and it
 * is few enough that she can still tell which one she is holding.
 */
export const MAX_CAST = 3;

/** Side by side, centred on the spot a lone character has always stood on. */
export const CAST_GAP = 86;

export function castHome(index: number, count: number): Placement {
  return {
    x: AVATAR_HOME.x + (index - (count - 1) / 2) * CAST_GAP,
    y: AVATAR_HOME.y,
    pose: "stand",
    seat: null,
  };
}

/**
 * Old saves put one character in each room without recording which one it was — there only
 * ever was one. Their position is parked under this key until the save knows who was active.
 */
const LEGACY_SOLO = "__solo";

/** Only so many things fit in two small hands. */
export const BASKET_LIMIT = 12;

/**
 * Caps on a saved drawing. A child scribbling happily for ten minutes would otherwise fill
 * localStorage, and the write that failed would be the one carrying her characters.
 */
const MAX_STROKES = 160;
const MAX_POINTS = 240;

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** A piece as it arrives in a room: where it was authored, shut, switched on and empty. */
export function placeFurniture(id: string): PlacedFurniture {
  return {
    id,
    dx: 0,
    dy: 0,
    facing: 0,
    open: false,
    on: true,
    stored: [],
    strokes: [],
    planted: null,
    stage: 0,
    wateredAt: 0,
    mode: 0,
  };
}

function starterRoom(room: RoomId): RoomState {
  return { items: ROOMS[room].startWith.map(placeFurniture), places: {} };
}

/** Built from ROOM_ORDER so adding a room can't silently miss one. */
function starterRooms(): Record<RoomId, RoomState> {
  const rooms = {} as Record<RoomId, RoomState>;
  for (const id of ROOM_ORDER) rooms[id] = starterRoom(id);
  return rooms;
}

export function emptySave(): GameSave {
  return {
    characters: [],
    activeId: null,
    inScene: [],
    rooms: starterRooms(),
    lastRoom: "playroom",
    basket: [],
    timeOfDay: "day",
  };
}

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/** Ids that no longer exist in the catalogue are dropped rather than carried around forever. */
function things(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((t): t is string => typeof t === "string" && ALL_THING_IDS.has(t))
    : [];
}

function strokes(value: unknown): Stroke[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((s): s is Stroke => !!s && typeof s.colour === "string" && Array.isArray(s.points))
    .slice(-MAX_STROKES)
    .map((s) => ({
      colour: s.colour,
      width: num(s.width, 6),
      // An odd number of coordinates would leave a dangling x with no y to pair it with.
      points: s.points.filter((n) => typeof n === "number" && Number.isFinite(n)).slice(0, MAX_POINTS * 2),
    }))
    .filter((s) => s.points.length >= 2);
}

/** Fills in everything a piece saved by an older version doesn't know about yet. */
function normaliseItem(raw: Partial<PlacedFurniture> & { id: string }): PlacedFurniture {
  return {
    id: raw.id,
    dx: num(raw.dx, 0),
    dy: num(raw.dy, 0),
    facing: ((Math.round(num(raw.facing, 0)) % 4) + 4) % 4,
    open: bool(raw.open, false),
    on: bool(raw.on, true),
    stored: things(raw.stored),
    strokes: strokes(raw.strokes),
    planted: typeof raw.planted === "string" && CROPS[raw.planted] ? raw.planted : null,
    stage: Math.max(0, Math.round(num(raw.stage, 0))),
    wateredAt: Math.max(0, num(raw.wateredAt, 0)),
    mode: Math.max(0, Math.round(num(raw.mode, 0))),
  };
}

/** Accepts both the original shape (a plain list of furniture ids) and the current one. */
function normaliseRoom(raw: unknown, room: RoomId): RoomState {
  // Any piece may live in any room, so ids are checked against the whole catalogue.
  const allowed = ALL_FURNITURE_IDS;

  if (Array.isArray(raw)) {
    return {
      items: raw
        .filter((id): id is string => typeof id === "string" && allowed.has(id))
        .map(placeFurniture),
      places: {},
    };
  }

  if (raw && typeof raw === "object") {
    const r = raw as Partial<RoomState>;
    const items = Array.isArray(r.items)
      ? r.items
          .filter((i): i is PlacedFurniture => !!i && typeof i.id === "string" && allowed.has(i.id))
          .map(normaliseItem)
      : starterRoom(room).items;
    const onFloor = (id: unknown) => typeof id === "string" && items.some((i) => i.id === id);
    const place = (from: {
      x?: unknown;
      y?: unknown;
      pose?: unknown;
      seat?: unknown;
    }): Placement => {
      const pose: AvatarPose = from.pose === "sit" || from.pose === "lie" ? from.pose : "stand";
      return {
        x: num(from.x, AVATAR_HOME.x),
        y: num(from.y, AVATAR_HOME.y),
        pose,
        // A seat that is no longer in the room, or that nobody is on, is no seat at all.
        seat: pose !== "stand" && onFloor(from.seat) ? (from.seat as string) : null,
      };
    };

    const places: Record<string, Placement> = {};
    const legacy = raw as { avatarX?: unknown; avatarPose?: unknown };
    if (legacy.avatarX !== undefined || legacy.avatarPose !== undefined) {
      const old = raw as Record<string, unknown>;
      places[LEGACY_SOLO] = place({
        x: old.avatarX,
        y: old.avatarY,
        pose: old.avatarPose,
        seat: old.avatarSeat,
      });
    }
    if (r.places && typeof r.places === "object") {
      for (const [id, saved] of Object.entries(r.places)) {
        if (saved && typeof saved === "object") places[id] = place(saved);
      }
    }

    return { items, places };
  }

  return starterRoom(room);
}

/**
 * Anything could be in storage — an older version, hand-edited JSON, a half-written record —
 * so every field is checked and patched rather than trusted. A child losing their characters
 * to a crash on load would be the worst possible bug here.
 */
export function loadSave(): GameSave {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return emptySave();
  }
  if (!raw) return emptySave();

  try {
    const parsed = JSON.parse(raw) as Partial<GameSave>;

    const characters = Array.isArray(parsed.characters)
      ? parsed.characters
          .filter((c): c is SavedCharacter => !!c && typeof c.id === "string" && !!c.look)
          .map((c) => {
            // Merge over the default so a save written by an older version still loads with
            // any newly added slots present.
            const look: AvatarLook = { ...DEFAULT_LOOK, ...c.look };
            if (typeof c.look.motifColour !== "string") {
              look.motifColour = LEGACY_MOTIF_COLOUR[look.motifId ?? ""] ?? DEFAULT_LOOK.motifColour;
            }
            return {
              id: c.id,
              name: typeof c.name === "string" && c.name ? c.name : "My character",
              look,
            };
          })
      : [];

    const rooms = {} as Record<RoomId, RoomState>;
    for (const id of ROOM_ORDER) {
      rooms[id] = normaliseRoom(parsed.rooms?.[id], id);
    }

    const activeId = characters.some((c) => c.id === parsed.activeId) ? parsed.activeId! : characters[0]?.id ?? null;

    const known = new Set(characters.map((c) => c.id));
    for (const id of ROOM_ORDER) {
      const places = rooms[id].places;
      // The one character an old save had in each room was whoever was active at the time.
      const solo = places[LEGACY_SOLO];
      delete places[LEGACY_SOLO];
      if (solo && activeId && !places[activeId]) places[activeId] = solo;
      // Somebody who has since been deleted leaves a spot behind; nobody stands on it.
      for (const who of Object.keys(places)) if (!known.has(who)) delete places[who];
    }

    const inScene = (Array.isArray(parsed.inScene) ? parsed.inScene : [])
      .filter((id): id is string => typeof id === "string" && known.has(id))
      .filter((id, i, all) => all.indexOf(id) === i);
    // Whoever "Dress up" would edit has to be somebody she can see.
    if (activeId && !inScene.includes(activeId)) inScene.unshift(activeId);
    const lastRoom = ROOM_ORDER.includes(parsed.lastRoom as RoomId) ? (parsed.lastRoom as RoomId) : "playroom";
    const savedTime = (parsed.timeOfDay as string) === LEGACY_DUSK ? "night" : parsed.timeOfDay;
    const timeOfDay = TIME_ORDER.includes(savedTime as TimeOfDay) ? (savedTime as TimeOfDay) : "day";

    return {
      characters,
      activeId,
      inScene: inScene.slice(0, MAX_CAST),
      rooms,
      lastRoom,
      basket: things(parsed.basket).slice(0, BASKET_LIMIT),
      timeOfDay,
    };
  } catch {
    return emptySave();
  }
}

export function persist(save: GameSave): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // Storage full or blocked — the session still works, it just won't survive a reload.
  }
}
