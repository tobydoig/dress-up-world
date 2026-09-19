import { DEFAULT_LOOK, type AvatarLook } from "../data/wardrobe";
import { ROOMS, ROOM_ORDER, type RoomId } from "../data/rooms";

export interface SavedCharacter {
  id: string;
  name: string;
  look: AvatarLook;
}

export interface GameSave {
  characters: SavedCharacter[];
  activeId: string | null;
  /** Furniture placed in each room, by furniture id. */
  rooms: Record<RoomId, string[]>;
  lastRoom: RoomId;
}

const KEY = "dress-up-world:save:v1";

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function starterRooms(): Record<RoomId, string[]> {
  return {
    playroom: [...ROOMS.playroom.startWith],
    kitchen: [...ROOMS.kitchen.startWith],
    bedroom: [...ROOMS.bedroom.startWith],
  };
}

export function emptySave(): GameSave {
  return { characters: [], activeId: null, rooms: starterRooms(), lastRoom: "playroom" };
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
    const base = emptySave();

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

    const rooms = base.rooms;
    for (const id of ROOM_ORDER) {
      const stored = parsed.rooms?.[id];
      if (Array.isArray(stored)) {
        rooms[id] = stored.filter((f) => typeof f === "string" && f in FURNITURE_IDS(id));
      }
    }

    const activeId = characters.some((c) => c.id === parsed.activeId) ? parsed.activeId! : characters[0]?.id ?? null;
    const lastRoom = ROOM_ORDER.includes(parsed.lastRoom as RoomId) ? (parsed.lastRoom as RoomId) : "playroom";

    return { characters, activeId, rooms, lastRoom };
  } catch {
    return emptySave();
  }
}

function FURNITURE_IDS(room: RoomId): Record<string, true> {
  const map: Record<string, true> = {};
  for (const f of ROOMS[room].furniture) map[f.id] = true;
  return map;
}

export function persist(save: GameSave): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // Storage full or blocked — the session still works, it just won't survive a reload.
  }
}
