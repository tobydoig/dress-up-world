import { useEffect, useRef, useState } from "react";
import { DesignMode } from "./design/DesignMode";
import { ExploreMode } from "./explore/ExploreMode";
import { capacityOf } from "./explore/furniture";
import { DEFAULT_LOOK, type AvatarLook } from "./data/wardrobe";
import type { RoomId } from "./data/rooms";
import {
  AVATAR_HOME,
  BASKET_LIMIT,
  TIME_ORDER,
  loadSave,
  newId,
  persist,
  placeFurniture,
  type AvatarPose,
  type GameSave,
  type PlacedFurniture,
} from "./lib/storage";
import { isMuted, setMuted } from "./lib/sound";

type Mode = "design" | "explore";

/**
 * How long to wait after the last change before writing to storage. A drag changes the save on
 * every pointer move, and each write is the whole thing — every room, every character, every
 * scribble — re-serialised. Waiting for things to settle turns a drag's worth of writes into
 * one, which matters most on the phone this is actually played on.
 */
const PERSIST_DELAY = 300;

/** Drop one entry by position, so two of the same thing in a basket stay distinguishable. */
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

  const activeLook = save.characters.find((c) => c.id === save.activeId)?.look ?? null;

  function saveAndPlay() {
    setSave((prev) => {
      const existing = editingId ? prev.characters.find((c) => c.id === editingId) : undefined;
      if (existing) {
        return {
          ...prev,
          characters: prev.characters.map((c) => (c.id === existing.id ? { ...c, look } : c)),
          activeId: existing.id,
        };
      }
      const id = newId();
      setEditingId(id);
      return {
        ...prev,
        characters: [...prev.characters, { id, name: "Character " + (prev.characters.length + 1), look }],
        activeId: id,
      };
    });
    setMode("explore");
  }

  /** Start designing a fresh character rather than editing the current one. */
  function newCharacter() {
    setEditingId(null);
    setLook(DEFAULT_LOOK);
  }

  /** Switch who is in the room, without going through design mode. */
  function switchCharacter(id: string) {
    if (!save.characters.some((c) => c.id === id)) return;
    setSave((prev) => ({ ...prev, activeId: id }));
    setEditingId(id);
  }

  function selectCharacter(id: string) {
    const chosen = save.characters.find((c) => c.id === id);
    if (!chosen) return;
    setEditingId(id);
    setLook(chosen.look);
    setSave((prev) => ({ ...prev, activeId: id }));
  }

  function deleteCharacter(id: string) {
    setSave((prev) => {
      const characters = prev.characters.filter((c) => c.id !== id);
      const activeId = prev.activeId === id ? characters[0]?.id ?? null : prev.activeId;
      return { ...prev, characters, activeId };
    });
    if (editingId === id) setEditingId(null);
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
  function moveAvatar(x: number, y: number, settle?: { pose: AvatarPose; seat: string | null }) {
    updateRoom((room) => ({
      ...room,
      avatarX: x,
      avatarY: y,
      avatarPose: settle ? settle.pose : room.avatarPose,
      avatarSeat: settle ? settle.seat : room.avatarSeat,
    }));
  }

  /** Put everything back where it started, for when the room gets into a state. */
  function tidyUp() {
    updateRoom((room) => ({
      items: room.items.map((i) => ({ ...i, dx: 0, dy: 0 })),
      avatarX: AVATAR_HOME.x,
      avatarY: AVATAR_HOME.y,
      avatarPose: "stand",
      avatarSeat: null,
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
          onChange={setLook}
          characters={save.characters}
          editingId={editingId}
          onSave={saveAndPlay}
          onSelect={selectCharacter}
          onDelete={deleteCharacter}
          onNew={newCharacter}
          onBack={save.characters.length > 0 ? () => setMode("explore") : null}
        />
      ) : (
        <ExploreMode
          look={activeLook}
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
          onStore={storeThing}
          onTakeOut={takeOutThing}
          onCook={cookThings}
          characters={save.characters}
          activeId={save.activeId}
          onSwitchCharacter={switchCharacter}
          onNewCharacter={() => {
            newCharacter();
            setMode("design");
          }}
          onDesign={() => {
            if (activeLook) setLook(activeLook);
            setEditingId(save.activeId);
            setMode("design");
          }}
        />
      )}

      <button
        className="mute-btn"
        aria-label={muted ? "Turn sound on" : "Turn sound off"}
        onClick={() => {
          const next = !muted;
          setMuted(next);
          setMutedState(next);
        }}
      >
        {muted ? "🔇" : "🔊"}
      </button>
    </>
  );
}
