import { DEFAULT_LOOK, type AvatarLook } from "../data/wardrobe";
import { ROOMS, ROOM_ORDER, type RoomId } from "../data/rooms";

export interface SavedCharacter {
  id: string;
  name: string;
  look: AvatarLook;
}

/**
 * Furniture positions are stored as an OFFSET from where the piece is drawn in furniture.tsx,
 * not as an absolute position. A brand new room therefore has every offset at zero and looks
 * exactly as authored, and the art can be nudged later without invalidating saved rooms.
 */
export interface PlacedFurniture {
  id: string;
  dx: number;
  dy: number;
}

export interface RoomState {
  items: PlacedFurniture[];
  /** Where the character is standing, in room coordinates (their feet). */
  avatarX: number;
  avatarY: number;
}

export interface GameSave {
  characters: SavedCharacter[];
  activeId: string | null;
  rooms: Record<RoomId, RoomState>;
  lastRoom: RoomId;
}

const KEY = "dress-up-world:save:v1";

export const AVATAR_HOME = { x: 200, y: 408 };

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function validIds(room: RoomId): Set<string> {
  return new Set(ROOMS[room].furniture.map((f) => f.id));
}

function starterRoom(room: RoomId): RoomState {
  return {
    items: ROOMS[room].startWith.map((id) => ({ id, dx: 0, dy: 0 })),
    avatarX: AVATAR_HOME.x,
    avatarY: AVATAR_HOME.y,
  };
}

function starterRooms(): Record<RoomId, RoomState> {
  return {
    playroom: starterRoom("playroom"),
    kitchen: starterRoom("kitchen"),
    bedroom: starterRoom("bedroom"),
  };
}

export function emptySave(): GameSave {
  return { characters: [], activeId: null, rooms: starterRooms(), lastRoom: "playroom" };
}

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Accepts both the original shape (a plain list of furniture ids) and the current one. */
function normaliseRoom(raw: unknown, room: RoomId): RoomState {
  const allowed = validIds(room);

  if (Array.isArray(raw)) {
    return {
      items: raw
        .filter((id): id is string => typeof id === "string" && allowed.has(id))
        .map((id) => ({ id, dx: 0, dy: 0 })),
      avatarX: AVATAR_HOME.x,
      avatarY: AVATAR_HOME.y,
    };
  }

  if (raw && typeof raw === "object") {
    const r = raw as Partial<RoomState>;
    const items = Array.isArray(r.items)
      ? r.items
          .filter((i): i is PlacedFurniture => !!i && typeof i.id === "string" && allowed.has(i.id))
          .map((i) => ({ id: i.id, dx: num(i.dx, 0), dy: num(i.dy, 0) }))
      : starterRoom(room).items;
    return {
      items,
      avatarX: num(r.avatarX, AVATAR_HOME.x),
      avatarY: num(r.avatarY, AVATAR_HOME.y),
    };
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
          .map((c) => ({
            id: c.id,
            name: typeof c.name === "string" && c.name ? c.name : "My character",
            // Merge over the default so a save written by an older version still loads with
            // any newly added slots present.
            look: { ...DEFAULT_LOOK, ...c.look },
          }))
      : [];

    const rooms = {} as Record<RoomId, RoomState>;
    for (const id of ROOM_ORDER) {
      rooms[id] = normaliseRoom(parsed.rooms?.[id], id);
    }

    const activeId = characters.some((c) => c.id === parsed.activeId) ? parsed.activeId! : characters[0]?.id ?? null;
    const lastRoom = ROOM_ORDER.includes(parsed.lastRoom as RoomId) ? (parsed.lastRoom as RoomId) : "playroom";

    return { characters, activeId, rooms, lastRoom };
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
