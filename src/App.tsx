import { useEffect, useRef, useState } from "react";
import { DesignMode } from "./design/DesignMode";
import { ExploreMode } from "./explore/ExploreMode";
import { capacityOf } from "./explore/furniture";
import { CROPS, isThirsty } from "./data/growing";
import { DEFAULT_LOOK, randomLook, type AvatarLook } from "./data/wardrobe";
import type { RoomId } from "./data/rooms";
import {
  BASKET_LIMIT,
  MAX_CAST,
  NAME_MAX,
  TIME_ORDER,
  castHome,
  loadSave,
  newId,
  persist,
  placeFurniture,
  type AvatarPose,
  type GameSave,
  type CharacterKind,
  type PlacedFurniture,
  type RoomState,
} from "./lib/storage";
import { isMuted, playPop, setMuted } from "./lib/sound";

type Mode = "design" | "explore";

/**
 * How long to wait after the last change before writing to storage. A drag changes the save on
 * every pointer move, and each write is the whole thing — every room, every character, every
 * scribble — re-serialised. Waiting for things to settle turns a drag's worth of writes into
 * one, which matters most on the phone this is actually played on.
 */
const PERSIST_DELAY = 300;

/** Drop one entry by position, so two of the same thing in a basket stay distinguishable. */
/** "Baby 2" rather than "Character 5", because that is what she will call it. */
function defaultName(kind: CharacterKind, save: GameSave): string {
  const same = save.characters.filter((c) => c.kind === kind).length + 1;
  return (kind === "baby" ? "Baby " : "Character ") + same;
}

function removeAt<T>(list: T[], index: number): T[] {
  return [...list.slice(0, index), ...list.slice(index + 1)];
}

export function App() {
  const [save, setSave] = useState<GameSave>(() => loadSave());
  // A brand new player has nothing to explore with, so they start by making someone.
  const [mode, setMode] = useState<Mode>(() => (loadSave().characters.length > 0 ? "explore" : "design"));
  const [editingId, setEditingId] = useState<string | null>(() => loadSave().activeId);
  const [look, setLook] = useState<AvatarLook>(() => {
    const s = loadSave();
    return s.characters.find((c) => c.id === s.activeId)?.look ?? DEFAULT_LOOK;
  });
  const [name, setName] = useState<string>(() => {
    const s = loadSave();
    return s.characters.find((c) => c.id === s.activeId)?.name ?? "";
  });
  /** Whether the thing being dressed is a baby, which decides what the drawer offers. */
  const [editingKind, setEditingKind] = useState<CharacterKind>(() => {
    const s = loadSave();
    return s.characters.find((c) => c.id === s.activeId)?.kind ?? "child";
  });
  const [muted, setMutedState] = useState(isMuted());

  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    const timer = setTimeout(() => persist(save), PERSIST_DELAY);
    return () => clearTimeout(timer);
  }, [save]);

  // A phone can close the tab without warning, and anything still waiting on that timer would
  // go with it. Write immediately whenever the page is put away.
  useEffect(() => {
    const flush = () => persist(saveRef.current);
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, []);


  function saveAndPlay() {
    setSave((prev) => {
      const existing = editingId ? prev.characters.find((c) => c.id === editingId) : undefined;
      const given = name.trim();
      if (existing) {
        return {
          ...prev,
          characters: prev.characters.map((c) =>
            c.id === existing.id ? { ...c, look, name: given || c.name } : c
          ),
          activeId: existing.id,
        };
      }
      const id = newId();
      setEditingId(id);
      const made: GameSave = {
        ...prev,
        characters: [
          ...prev.characters,
          { id, kind: editingKind, name: given || defaultName(editingKind, prev), look },
        ],
        activeId: id,
      };
      // Somebody just made is somebody she wants to see, so they are waiting in the room
      // she is about to be dropped back into.
      return bringTo(made, prev.lastRoom, id);
    });
    setMode("explore");
  }

  /**
   * Makes the character there and then rather than at the end of dressing them. Deferring it
   * meant tapping "New one" changed nothing you could see: the list you had just tapped in
   * stayed exactly as it was until you went out to the room and came back.
   */
  function newCharacter(kind: CharacterKind = "child") {
    const id = newId();
    const given = defaultName(kind, save);
    setName(given);
    setEditingKind(kind);
    setSave((prev) => {
      const made: GameSave = {
        ...prev,
        characters: [...prev.characters, { id, kind, name: given, look: DEFAULT_LOOK }],
        activeId: id,
      };
      // Making someone is the one act that does place them: she is about to press Play and
      // should find them standing there, not have to go and fetch what she just made.
      return bringTo(made, prev.lastRoom, id);
    });
    setEditingId(id);
    setLook(DEFAULT_LOOK);
  }

  /**
   * Dressing writes straight through to the character being dressed, so their thumbnail in
   * the list keeps up with the big one on the stage.
   */
  function changeLook(next: AvatarLook) {
    setLook(next);
    if (!editingId) return;
    setSave((prev) => ({
      ...prev,
      characters: prev.characters.map((c) => (c.id === editingId ? { ...c, look: next } : c)),
    }));
  }

  /**
   * Renaming writes through the same way. Held as typed — including empty, so the field can
   * be cleared and started again — and only turned into a stored name at the point it is
   * stored, where a blank falls back to what they were called before.
   */
  function changeName(next: string) {
    const trimmed = next.slice(0, NAME_MAX);
    setName(trimmed);
    if (!editingId) return;
    setSave((prev) => ({
      ...prev,
      characters: prev.characters.map((c) =>
        c.id === editingId ? { ...c, name: trimmed.trim() || c.name } : c
      ),
    }));
  }

  /**
   * Out into the room, or back in again — and whoever came out last is the one "Dress up"
   * will edit, so touching a face is all it takes to choose who you are dressing.
   *
   * A room may be left empty. That is just a room with nobody in it, which rooms are
   * allowed to be now that each has its own.
   */
  function toggleInScene(id: string) {
    if (!save.characters.some((c) => c.id === id)) return;
    setSave((prev) =>
      prev.rooms[prev.lastRoom].places[id]
        ? { ...prev, rooms: forgetPlaces(prev.rooms, [id]) }
        : { ...bringTo(prev, prev.lastRoom, id), activeId: id }
    );
    setEditingId(id);
  }

  /** Whoever she last touched in the room is the one "Dress up" edits. */
  function focusCharacter(id: string) {
    if (save.activeId === id) return;
    setSave((prev) => (prev.characters.some((c) => c.id === id) ? { ...prev, activeId: id } : prev));
    setEditingId(id);
  }

  function selectCharacter(id: string) {
    const chosen = save.characters.find((c) => c.id === id);
    if (!chosen) return;
    setEditingId(id);
    setLook(chosen.look);
    setName(chosen.name);
    setEditingKind(chosen.kind);
    // Dressing somebody does not move them. Their clothes change wherever they happen to
    // be standing, which is the whole point of them living in rooms.
    setSave((prev) => ({ ...prev, activeId: id }));
  }

  function deleteCharacter(id: string) {
    setSave((prev) => {
      const characters = prev.characters.filter((c) => c.id !== id);
      const activeId = prev.activeId === id ? characters[0]?.id ?? null : prev.activeId;
      return { ...prev, characters, activeId, rooms: forgetPlaces(prev.rooms, [id]) };
    });
    if (editingId === id) {
      setEditingId(null);
      setName("");
    }
  }

  /**
   * Somebody who has been sent back forgets where they were standing. They left; when she
   * brings them out again they join the line-up rather than reappearing in whatever corner
   * she put them away from — which is usually exactly the corner they were in the way in.
   */
  function forgetPlaces(rooms: GameSave["rooms"], gone: string[]): GameSave["rooms"] {
    if (gone.length === 0) return rooms;
    const next = {} as GameSave["rooms"];
    for (const [room, state] of Object.entries(rooms) as Array<[RoomId, RoomState]>) {
      const places = { ...state.places };
      for (const id of gone) delete places[id];
      next[room] = { ...state, places };
    }
    return next;
  }

  /**
   * Brings somebody to a room, from wherever in the house they were. A character stands in
   * one place at a time, so arriving somewhere is the same act as leaving everywhere else —
   * which means tapping a face always fetches her, rather than sometimes appearing to do
   * nothing because she is two rooms away.
   */
  function bringTo(prev: GameSave, room: RoomId, id: string): GameSave {
    const rooms = {} as GameSave["rooms"];
    for (const [key, state] of Object.entries(prev.rooms) as Array<[RoomId, RoomState]>) {
      const places = { ...state.places };
      const wasHere = places[id];
      delete places[id];
      if (key === room) {
        const others = Object.keys(places);
        // Full up: whoever has been in longest steps out to make room.
        if (others.length >= MAX_CAST) delete places[others[0]];
        places[id] = wasHere ?? castHome(Object.keys(places).length, MAX_CAST);
      }
      rooms[key] = { ...state, places };
    }
    return { ...prev, rooms };
  }

  function changeRoom(next: RoomId) {
    setSave((prev) => ({ ...prev, lastRoom: next }));
  }

  function updateRoom(change: (room: GameSave["rooms"][RoomId]) => GameSave["rooms"][RoomId]) {
    setSave((prev) => ({
      ...prev,
      rooms: { ...prev.rooms, [prev.lastRoom]: change(prev.rooms[prev.lastRoom]) },
    }));
  }

  function toggleFurniture(furnitureId: string) {
    updateRoom((room) => ({
      ...room,
      items: room.items.some((i) => i.id === furnitureId)
        ? room.items.filter((i) => i.id !== furnitureId)
        // New pieces land where they were authored, which is a sensible spot by construction.
        : [...room.items, placeFurniture(furnitureId)],
    }));
  }

  function moveFurniture(furnitureId: string, dx: number, dy: number) {
    updateRoom((room) => ({
      ...room,
      items: room.items.map((i) => (i.id === furnitureId ? { ...i, dx, dy } : i)),
    }));
  }

  /** Everything else a piece remembers: which way it faces, its door, its bulb, its drawing. */
  function updateFurniture(furnitureId: string, patch: Partial<PlacedFurniture>) {
    updateRoom((room) => ({
      ...room,
      items: room.items.map((i) => (i.id === furnitureId ? { ...i, ...patch } : i)),
    }));
  }

  function removeFurniture(furnitureId: string) {
    updateRoom((room) => ({ ...room, items: room.items.filter((i) => i.id !== furnitureId) }));
  }

  /**
   * `settle` is only passed when the character has finished moving and it has been decided
   * what they have landed on. Leaving it out — which is what every frame of a drag does —
   * moves them without disturbing what they are sitting on.
   */
  function moveAvatar(
    id: string,
    x: number,
    y: number,
    settle?: { pose: AvatarPose; seat: string | null; heldBy?: string | null }
  ) {
    updateRoom((room) => {
      const was = room.places[id];
      return {
        ...room,
        places: {
          ...room.places,
          [id]: {
            x,
            y,
            pose: settle ? settle.pose : was?.pose ?? "stand",
            seat: settle ? settle.seat : was?.seat ?? null,
            heldBy: settle ? settle.heldBy ?? null : was?.heldBy ?? null,
          },
        },
      };
    });
  }

  /** Put everything back where it started, for when the room gets into a state. */
  function tidyUp() {
    // Written against prev rather than the render's own save, so who is out is read at the
    // moment the room is rebuilt rather than whenever this handler was made.
    setSave((prev) => ({
      ...prev,
      rooms: {
        ...prev.rooms,
        [prev.lastRoom]: {
          items: prev.rooms[prev.lastRoom].items.map((i) => ({ ...i, dx: 0, dy: 0 })),
          // Whoever is in this room goes back into the line-up, standing, off whatever
          // they were sitting on. Tidying a room doesn't fetch anyone into it.
          places: Object.fromEntries(
            Object.keys(prev.rooms[prev.lastRoom].places).map((id, i, all) => [
              id,
              castHome(i, all.length),
            ])
          ),
        },
      },
    }));
  }

  function cycleTime() {
    setSave((prev) => ({
      ...prev,
      timeOfDay: TIME_ORDER[(TIME_ORDER.indexOf(prev.timeOfDay) + 1) % TIME_ORDER.length],
    }));
  }

  function buyThing(thingId: string) {
    setSave((prev) =>
      prev.basket.length >= BASKET_LIMIT ? prev : { ...prev, basket: [...prev.basket, thingId] }
    );
  }

  function eatThing(index: number) {
    setSave((prev) =>
      prev.basket[index] === undefined ? prev : { ...prev, basket: removeAt(prev.basket, index) }
    );
  }

  /** Basket into a cupboard. Both halves move in one update so nothing can be duplicated. */
  function storeThing(furnitureId: string, index: number) {
    setSave((prev) => {
      const thingId = prev.basket[index];
      const room = prev.rooms[prev.lastRoom];
      const item = room.items.find((i) => i.id === furnitureId);
      if (thingId === undefined || !item || item.stored.length >= capacityOf(furnitureId)) return prev;
      return {
        ...prev,
        basket: removeAt(prev.basket, index),
        rooms: {
          ...prev.rooms,
          [prev.lastRoom]: {
            ...room,
            items: room.items.map((i) =>
              i.id === furnitureId ? { ...i, stored: [...i.stored, thingId] } : i
            ),
          },
        },
      };
    });
  }

  function takeOutThing(furnitureId: string, index: number) {
    setSave((prev) => {
      const room = prev.rooms[prev.lastRoom];
      const item = room.items.find((i) => i.id === furnitureId);
      const thingId = item?.stored[index];
      if (!item || thingId === undefined || prev.basket.length >= BASKET_LIMIT) return prev;
      return {
        ...prev,
        basket: [...prev.basket, thingId],
        rooms: {
          ...prev.rooms,
          [prev.lastRoom]: {
            ...room,
            items: room.items.map((i) =>
              i.id === furnitureId ? { ...i, stored: removeAt(i.stored, index) } : i
            ),
          },
        },
      };
    });
  }

  /** Eaten without ever reaching the basket — dragged from a shelf straight to the mouth. */
  function eatFromContainer(furnitureId: string, index: number) {
    updateRoom((room) => ({
      ...room,
      items: room.items.map((i) =>
        i.id === furnitureId && i.stored[index] !== undefined
          ? { ...i, stored: removeAt(i.stored, index) }
          : i
      ),
    }));
  }

  /** Sow a seed packet from the basket into an empty bed. */
  function plantSeed(plotId: string, index: number) {
    setSave((prev) => {
      const seed = prev.basket[index];
      const room = prev.rooms[prev.lastRoom];
      const plot = room.items.find((i) => i.id === plotId);
      if (!seed || !CROPS[seed] || !plot || plot.planted) return prev;
      return {
        ...prev,
        basket: removeAt(prev.basket, index),
        rooms: {
          ...prev.rooms,
          [prev.lastRoom]: {
            ...room,
            items: room.items.map((i) =>
              // wateredAt 0 means "never watered", so a fresh bed is thirsty straight away
              // and the first drink can go in immediately.
              i.id === plotId ? { ...i, planted: seed, stage: 0, wateredAt: 0 } : i
            ),
          },
        },
      };
    });
  }

  /** One drink, one step. Growth comes from the watering, never from the clock alone. */
  function waterPlot(plotId: string) {
    updateRoom((room) => ({
      ...room,
      items: room.items.map((i) =>
        // Thirst is checked here and not only where this is called from. Watering happens
        // while the can is still moving now, and two of them can land before a render has
        // told the caller the first one counted. A plant takes one drink however many
        // times it is offered.
        i.id === plotId && i.planted && isThirsty(i.wateredAt, Date.now())
          ? { ...i, stage: i.stage + 1, wateredAt: Date.now() }
          : i
      ),
    }));
  }

  /** Picking it gives the crop and a seed back, so the next one doesn't need buying. */
  function harvestPlot(plotId: string) {
    setSave((prev) => {
      const room = prev.rooms[prev.lastRoom];
      const plot = room.items.find((i) => i.id === plotId);
      const crop = plot?.planted ? CROPS[plot.planted] : null;
      if (!plot || !crop) return prev;

      const picked = [crop.crop, crop.seed].slice(0, Math.max(0, BASKET_LIMIT - prev.basket.length));
      return {
        ...prev,
        basket: [...prev.basket, ...picked],
        rooms: {
          ...prev.rooms,
          [prev.lastRoom]: {
            ...room,
            items: room.items.map((i) =>
              i.id === plotId ? { ...i, planted: null, stage: 0, wateredAt: 0 } : i
            ),
          },
        },
      };
    });
  }

  function cookThings(indices: number[], dishId: string) {
    setSave((prev) => {
      if (indices.length === 0 || indices.some((i) => prev.basket[i] === undefined)) return prev;
      // Highest index first, or removing an earlier one shifts the rest out from under us.
      let basket = prev.basket;
      for (const i of [...indices].sort((a, b) => b - a)) basket = removeAt(basket, i);
      return { ...prev, basket: [...basket, dishId] };
    });
  }

  return (
    <>
      {mode === "design" ? (
        <DesignMode
          look={look}
          onChange={changeLook}
          name={name}
          onRename={changeName}
          editingKind={editingKind}
          characters={save.characters}
          editingId={editingId}
          onSave={saveAndPlay}
          onSelect={selectCharacter}
          onDelete={deleteCharacter}
          onNew={newCharacter}
        />
      ) : (
        <ExploreMode
          roomId={save.lastRoom}
          room={save.rooms[save.lastRoom]}
          basket={save.basket}
          timeOfDay={save.timeOfDay}
          onRoomChange={changeRoom}
          onToggleFurniture={toggleFurniture}
          onMoveFurniture={moveFurniture}
          onUpdateFurniture={updateFurniture}
          onRemoveFurniture={removeFurniture}
          onMoveAvatar={moveAvatar}
          onTidyUp={tidyUp}
          onCycleTime={cycleTime}
          onBuy={buyThing}
          onEat={eatThing}
          onEatFrom={eatFromContainer}
          onStore={storeThing}
          onTakeOut={takeOutThing}
          onCook={cookThings}
          onPlant={plantSeed}
          onWater={waterPlot}
          onHarvest={harvestPlot}
          characters={save.characters}
          activeId={save.activeId}
          onToggleInScene={toggleInScene}
          onFocusCharacter={focusCharacter}
          onNewCharacter={() => {
            newCharacter();
            setMode("design");
          }}
          onDesign={() => {
            const who = save.characters.find((c) => c.id === save.activeId);
            if (who) {
              setLook(who.look);
              setName(who.name);
              setEditingKind(who.kind);
            }
            setEditingId(save.activeId);
            setMode("design");
          }}
        />
      )}

      {/* The two things that float over the scene rather than living in the bar. Kept in one
          row here, rather than each positioning itself, so the spacing isn't two magic
          numbers that have to agree. */}
      <div className="float-controls">
        {mode === "design" && (
          <button
            className="float-btn"
            aria-label="Surprise me — dress this character at random"
            onClick={() => {
              setLook(randomLook());
              playPop();
            }}
          >
            🎲
          </button>
        )}
        <button
          className="float-btn"
          aria-label={muted ? "Turn sound on" : "Turn sound off"}
          onClick={() => {
            const next = !muted;
            setMuted(next);
            setMutedState(next);
          }}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>

    </>
  );
}
