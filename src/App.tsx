import { useEffect, useState } from "react";
import { DesignMode } from "./design/DesignMode";
import { ExploreMode } from "./explore/ExploreMode";
import { DEFAULT_LOOK, type AvatarLook } from "./data/wardrobe";
import type { RoomId } from "./data/rooms";
import { AVATAR_HOME, loadSave, newId, persist, type GameSave } from "./lib/storage";
import { isMuted, setMuted } from "./lib/sound";

type Mode = "design" | "explore";

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

  useEffect(() => {
    persist(save);
  }, [save]);

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
        : [...room.items, { id: furnitureId, dx: 0, dy: 0 }],
    }));
  }

  function moveFurniture(furnitureId: string, dx: number, dy: number) {
    updateRoom((room) => ({
      ...room,
      items: room.items.map((i) => (i.id === furnitureId ? { ...i, dx, dy } : i)),
    }));
  }

  function moveAvatar(x: number, y: number) {
    updateRoom((room) => ({ ...room, avatarX: x, avatarY: y }));
  }

  /** Put everything back where it started, for when the room gets into a state. */
  function tidyUp() {
    updateRoom((room) => ({
      items: room.items.map((i) => ({ ...i, dx: 0, dy: 0 })),
      avatarX: AVATAR_HOME.x,
      avatarY: AVATAR_HOME.y,
    }));
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
          onBack={save.characters.length > 0 ? () => setMode("explore") : null}
        />
      ) : (
        <ExploreMode
          look={activeLook}
          roomId={save.lastRoom}
          room={save.rooms[save.lastRoom]}
          onRoomChange={changeRoom}
          onToggleFurniture={toggleFurniture}
          onMoveFurniture={moveFurniture}
          onMoveAvatar={moveAvatar}
          onTidyUp={tidyUp}
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
