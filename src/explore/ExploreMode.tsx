import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Avatar, AvatarLayers } from "../avatar/Avatar";
import {
  FLAT_ON_FLOOR,
  FLOATING,
  FURNITURE,
  POPPED_BALLOONS,
  STACKABLE,
  WALL_MOUNTED,
  deskLamp,
} from "./furniture";
import { FURNITURE_GROUPS, ROOMS, ROOM_ORDER, type RoomId } from "../data/rooms";
import type { AvatarLook } from "../data/wardrobe";
import type { AvatarPose, RoomState, SavedCharacter } from "../lib/storage";
import { playBang, playPop, playSparkle, playTap, playWhoosh } from "../lib/sound";

/**
 * Room scene coordinates. Furniture was authored against a wall bottom of 232, so it all sits
 * at a fixed vertical offset rather than being renumbered.
 *
 * The scene is anchored to the TOP of the stage (xMidYMin) and the stage itself is painted the
 * room's floor colour, so the leftover space below simply reads as more floor.
 *
 * The viewBox is deliberately shorter than the stage is ever tall (ratio 1.1 against a stage
 * that runs 1.16-1.40): scaling is then always width-limited, so the room fills the screen
 * edge to edge and never gains side bars when the furniture drawer opens and shortens it.
 */
const ROOM_W = 400;
const ROOM_H = 440;
const ROOM_VIEWBOX = "0 0 " + ROOM_W + " " + ROOM_H;
const FURNITURE_DROP = 68;
const WALL_BOTTOM = 232 + FURNITURE_DROP;
/** Frames just the furnished part of the room for the drawer thumbnails. */
const THUMB_VIEWBOX = "0 120 400 260";

/** Keep the character's feet on the floor and fully on screen. */
const AVATAR_BOUNDS = { minX: 64, maxX: 336, minY: 318, maxY: 434 };
const EDGE = 4;
/** How far a stackable item's base may leave the floor, so it can sit on a bed or a table. */
const STACK_LIFT = 110;

/**
 * Furniture you can be on. `zone` is where you drop the character to trigger it — at floor
 * level, where a child would aim — while `x`/`y` is where they actually end up, which for a bed
 * is up on the mattress. Keeping them separate is what stops "drop on the bed" needing you to
 * hit a point floating in mid-air.
 *
 * The character's anchor is their feet, and lying rotates them about it, so a lying anchor sits
 * at the FOOT of the bed with the body extending back towards the pillow.
 */
const SEATS: Record<
  string,
  { zoneX: number; zoneY: number; x: number; y: number; pose: AvatarPose }
> = {
  chairLeft: { zoneX: 137, zoneY: 328, x: 137, y: 324, pose: "sit" },
  chairRight: { zoneX: 275, zoneY: 328, x: 275, y: 324, pose: "sit" },
  bed: { zoneX: 286, zoneY: 330, x: 369, y: 220, pose: "lie" },
};

/** How close the character has to be dropped for it to count as sitting on something. */
const SEAT_SNAP = 78;

/** How long a popped balloon stays popped. */
const REINFLATE_MS = 2200;

type DragTarget = { kind: "avatar" } | { kind: "furniture"; id: string };

interface DragState {
  target: DragTarget;
  pointerId: number;
  /** Pointer position at grab time, in client pixels. */
  clientX: number;
  clientY: number;
  /** The dragged thing's position at grab time, in room units. */
  originX: number;
  originY: number;
  /** Client pixels per room unit, so pointer movement maps onto the scene. */
  scale: number;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  /** Kept so exactly these listeners can be detached again when the drag ends. */
  move: (e: PointerEvent) => void;
  end: () => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function ExploreMode({
  look,
  roomId,
  room: roomState,
  onRoomChange,
  onToggleFurniture,
  onMoveFurniture,
  onMoveAvatar,
  onTidyUp,
  characters,
  activeId,
  onSwitchCharacter,
  onNewCharacter,
  onDesign,
}: {
  look: AvatarLook | null;
  roomId: RoomId;
  room: RoomState;
  onRoomChange: (next: RoomId) => void;
  onToggleFurniture: (furnitureId: string) => void;
  onMoveFurniture: (furnitureId: string, dx: number, dy: number) => void;
  onMoveAvatar: (x: number, y: number, pose?: AvatarPose) => void;
  onTidyUp: () => void;
  characters: SavedCharacter[];
  activeId: string | null;
  onSwitchCharacter: (id: string) => void;
  onNewCharacter: () => void;
  onDesign: () => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [poppedAt, setPoppedAt] = useState<number | null>(null);
  const [castOpen, setCastOpen] = useState(false);
  const [lampOn, setLampOn] = useState(true);
  /** When the sheet opened, to ignore the click that opened it arriving on the new backdrop. */
  const sheetOpenedAt = useRef(0);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | null>(null);
  /**
   * The drag's move/end handlers are closures made when the drag starts, so reading roomState
   * directly from them sees where things were BEFORE the drag. This ref always holds the
   * current state.
   */
  const roomStateRef = useRef(roomState);
  roomStateRef.current = roomState;

  const room = ROOMS[roomId];

  /**
   * The chair the character is sitting on, drawn after them so its back and legs overlap and
   * they read as being IN it rather than stuck on top. Only for sitting: you lie ON a bed, so
   * drawing the bed in front would bury them (and swallow the tap that gets them up again).
   */
  const occupiedId =
    roomState.avatarPose !== "sit"
      ? null
      : roomState.items.find((item) => {
          const seat = SEATS[item.id];
          if (!seat) return false;
          return (
            Math.abs(seat.x + item.dx - roomState.avatarX) < 2 &&
            Math.abs(seat.y + item.dy - roomState.avatarY) < 2
          );
        })?.id ?? null;

  const occupied = occupiedId ? roomState.items.find((i) => i.id === occupiedId) : undefined;

  const index = ROOM_ORDER.indexOf(roomId);
  const prev = index > 0 ? ROOM_ORDER[index - 1] : null;
  const next = index < ROOM_ORDER.length - 1 ? ROOM_ORDER[index + 1] : null;

  function go(to: RoomId | null) {
    if (!to) return;
    playWhoosh();
    onRoomChange(to);
  }

  /** Client pixels per room unit — the scene scales uniformly, so one number covers both axes. */
  function currentScale(): number {
    const rect = svgRef.current?.getBoundingClientRect();
    return rect && rect.width > 0 ? rect.width / ROOM_W : 1;
  }

  /** Detach whatever a drag attached, whether it ended normally or the component went away. */
  function releaseListeners() {
    const drag = dragRef.current;
    if (!drag) return;
    window.removeEventListener("pointermove", drag.move);
    window.removeEventListener("pointerup", drag.end);
    window.removeEventListener("pointercancel", drag.end);
  }

  useEffect(() => releaseListeners, []);

  function startDrag(e: ReactPointerEvent<SVGGElement>, target: DragTarget) {
    // Deliberately no preventDefault: cancelling the pointerdown of a touch made Chromium
    // suppress the click of the NEXT tap, so the first button pressed after any drag did
    // nothing. touch-action: none on the stage already stops the browser claiming the gesture.
    const scale = currentScale();
    let originX: number;
    let originY: number;
    let bounds: DragState["bounds"];

    if (target.kind === "avatar") {
      originX = roomStateRef.current.avatarX;
      originY = roomStateRef.current.avatarY;
      bounds = AVATAR_BOUNDS;
    } else {
      const item = roomStateRef.current.items.find((i) => i.id === target.id);
      if (!item) return;
      originX = item.dx;
      originY = item.dy;

      // Bound the OFFSET so the piece's own artwork stays inside the room. getBBox on the
      // inner art group gives the authored box, before this group's translate is applied.
      const art = e.currentTarget.firstElementChild as SVGGraphicsElement | null;
      const box = art?.getBBox();
      if (box) {
        const top = FURNITURE_DROP + box.y;
        const bottom = top + box.height;
        const id = target.id;

        // Vertical limits depend on what the piece is. The default, floor-standing case pins
        // the BASE to the floor while leaving the top free to reach up the wall, which is how
        // a wardrobe stands against a wall without being able to float off up it.
        let minY: number;
        let maxY: number;
        if (WALL_MOUNTED.has(id)) {
          minY = EDGE - top;
          maxY = WALL_BOTTOM - bottom;
        } else if (FLOATING.has(id)) {
          minY = EDGE - top;
          maxY = WALL_BOTTOM + 90 - bottom;
        } else if (FLAT_ON_FLOOR.has(id)) {
          // Pinned by its top edge: a rug whose base is merely on the floor line still has the
          // rest of itself spread up the wall.
          minY = WALL_BOTTOM - top;
          maxY = ROOM_H - EDGE - bottom;
        } else if (STACKABLE.has(id)) {
          minY = WALL_BOTTOM - STACK_LIFT - bottom;
          maxY = ROOM_H - EDGE - bottom;
        } else {
          minY = WALL_BOTTOM - bottom;
          maxY = ROOM_H - EDGE - bottom;
        }

        bounds = {
          minX: EDGE - box.x,
          maxX: ROOM_W - EDGE - (box.x + box.width),
          // A piece authored below its own limit would otherwise get a min above its max.
          minY: Math.min(minY, 0),
          maxY: Math.max(maxY, 0),
        };
      } else {
        bounds = { minX: -160, maxX: 160, minY: -120, maxY: 120 };
      }
    }

    // Listeners go on the window rather than the dragged element. Pointer capture on an SVG
    // child plus React's delegated events is fragile — a touch that the browser decides is a
    // scroll fires pointercancel and the drag dies after a few pixels.
    const move = (ev: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      // No preventDefault here: touch-action: none on the stage already stops the browser
      // treating this as a scroll, and cancelling these moves made Chromium suppress the click
      // from the NEXT tap, so the first button press after any drag did nothing.

      const x = clamp(drag.originX + (ev.clientX - drag.clientX) / drag.scale, drag.bounds.minX, drag.bounds.maxX);
      const y = clamp(drag.originY + (ev.clientY - drag.clientY) / drag.scale, drag.bounds.minY, drag.bounds.maxY);

      if (drag.target.kind === "avatar") onMoveAvatar(x, y);
      else onMoveFurniture(drag.target.id, x, y);
    };

    // Deliberately not matched against the starting pointerId: if the matching pointerup is
    // ever missed, the listeners stay attached and the next tap anywhere gets eaten by this
    // drag instead of reaching the button it was aimed at.
    const end = (ev?: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      releaseListeners();
      dragRef.current = null;
      setDraggingKey(null);

      // A finger wobbles; 5px counted honest taps as drags, which re-seated a character the
      // moment you tried to tap them off a chair.
      const travelled = ev ? Math.hypot(ev.clientX - drag.clientX, ev.clientY - drag.clientY) : 0;
      if (travelled < 11) {
        onTap(drag.target);
        return;
      }

      if (drag.target.kind === "avatar") settleAvatar();
      playPop();
    };

    dragRef.current = {
      target,
      pointerId: e.pointerId,
      clientX: e.clientX,
      clientY: e.clientY,
      originX,
      originY,
      scale,
      bounds,
      move,
      end,
    };

    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);

    setDraggingKey(target.kind === "avatar" ? "avatar" : target.id);
    playTap();
  }

  /** A press that never really moved: treat it as a tap on whatever was pressed. */
  function onTap(target: DragTarget) {
    const current = roomStateRef.current;
    if (target.kind === "avatar") {
      // Tap the character to get them back up again.
      if (current.avatarPose !== "stand") {
        onMoveAvatar(current.avatarX, current.avatarY - 18, "stand");
        playSparkle();
      } else {
        playPop();
      }
      return;
    }

    if (target.id === "deskLamp") {
      setLampOn((v) => !v);
      playTap();
      return;
    }

    if (target.id === "balloons") {
      if (poppedAt === null) {
        setPoppedAt(Date.now());
        playBang();
      }
      return;
    }

    playPop();
  }

  /** After the character is dropped, sit or lie them on whatever they landed on. */
  function settleAvatar() {
    const current = roomStateRef.current;

    // Dragging someone who is already sitting or lying always frees them. Otherwise the snap
    // radius grabs them straight back onto the seat and there's no way off it.
    if (current.avatarPose !== "stand") {
      onMoveAvatar(current.avatarX, current.avatarY, "stand");
      playPop();
      return;
    }

    let best: { x: number; y: number; pose: AvatarPose } | null = null;
    let bestDistance = SEAT_SNAP;

    for (const item of current.items) {
      const seat = SEATS[item.id];
      if (!seat) continue;
      const distance = Math.hypot(
        current.avatarX - (seat.zoneX + item.dx),
        current.avatarY - (seat.zoneY + item.dy)
      );
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { x: seat.x + item.dx, y: seat.y + item.dy, pose: seat.pose };
      }
    }

    if (best) {
      onMoveAvatar(best.x, best.y, best.pose);
      playSparkle();
    } else if (current.avatarPose !== "stand") {
      onMoveAvatar(current.avatarX, current.avatarY, "stand");
    }
  }

  // Balloons come back a couple of seconds after they're popped.
  useEffect(() => {
    if (poppedAt === null) return;
    const timer = setTimeout(() => setPoppedAt(null), REINFLATE_MS);
    return () => clearTimeout(timer);
  }, [poppedAt]);

  const dragHandlers = (target: DragTarget) => ({
    onPointerDown: (e: ReactPointerEvent<SVGGElement>) => startDrag(e, target),
  });

  return (
    <div className="screen">
      <header className="topbar">
        <h1 className="logo">
          {room.icon} {room.name}
        </h1>
        <div className="topbar-actions">
          <button
            className="chip-btn chip-ghost"
            aria-label="Choose who is here"
            onClick={() => {
              sheetOpenedAt.current = Date.now();
              setCastOpen(true);
              playTap();
            }}
          >
            👥 {characters.length}
          </button>
          <button
            className="chip-btn"
            onClick={() => {
              playTap();
              onDesign();
            }}
          >
            👗 Dress up
          </button>
        </div>
      </header>

      <div className="room-stage" style={{ background: room.floor }}>
        <div key={roomId} className="room-slide">
          <svg
            ref={svgRef}
            viewBox={ROOM_VIEWBOX}
            preserveAspectRatio="xMidYMin meet"
            className="room-svg"
            role="img"
            aria-label={room.name}
          >
            <rect x={0} y={0} width={ROOM_W} height={WALL_BOTTOM} fill={room.wall} />
            <rect x={0} y={WALL_BOTTOM} width={ROOM_W} height={ROOM_H - WALL_BOTTOM} fill={room.floor} />
            <rect x={0} y={WALL_BOTTOM - 8} width={ROOM_W} height={10} fill={room.wallTrim} />
            {[70, 150, 230, 310].map((x) => (
              <path
                key={x}
                d={"M" + x + "," + (WALL_BOTTOM + 2) + " L" + (x - 34) + "," + ROOM_H}
                stroke={room.floorBoards}
                strokeWidth={2.5}
                opacity={0.7}
              />
            ))}

            {/* Wall fittings, so every room has something on it even with nothing placed. */}
            <g>
              <rect x={160} y={74} width={80} height={68} rx={7} fill="#bfe8ff" stroke={room.wallTrim} strokeWidth={7} />
              <path d="M200,76 v64 M162,108 h76" stroke={room.wallTrim} strokeWidth={5} />
              <circle cx={222} cy={92} r={9} fill="#fff3b0" />
              <path d={"M0,44 h" + ROOM_W} stroke={room.wallTrim} strokeWidth={6} opacity={0.65} />
            </g>

            {roomState.items.map((item) => {
              const render = item.id === "deskLamp" ? () => deskLamp(lampOn) : FURNITURE[item.id];
              if (!render) return null;
              if (item.id === occupiedId) return null;
              return (
                // The positioning transform and the pop animation live on separate groups: a
                // CSS animation on `transform` would otherwise override the attribute and snap
                // the piece back to where it was authored.
                <g
                  key={item.id}
                  className={"draggable" + (draggingKey === item.id ? " is-dragging" : "")}
                  transform={"translate(" + item.dx + " " + (FURNITURE_DROP + item.dy) + ")"}
                  {...dragHandlers({ kind: "furniture", id: item.id })}
                >
                  <g className="furniture-in">
                    {item.id === "balloons" && poppedAt !== null ? POPPED_BALLOONS() : render()}
                  </g>
                </g>
              );
            })}

            {look && (
              <g
                className={"draggable" + (draggingKey === "avatar" ? " is-dragging" : "")}
                transform={
                  "translate(" + roomState.avatarX + " " + roomState.avatarY + ")" +
                  (roomState.avatarPose === "lie" ? " rotate(-90)" : "") +
                  " scale(0.47) translate(-100 -380)"
                }
                {...dragHandlers({ kind: "avatar" })}
              >
                <AvatarLayers look={look} uid={"room-" + roomId} pose={roomState.avatarPose} />
              </g>
            )}

            {occupied && FURNITURE[occupied.id] && (
              <g
                className={"draggable" + (draggingKey === occupied.id ? " is-dragging" : "")}
                transform={"translate(" + occupied.dx + " " + (FURNITURE_DROP + occupied.dy) + ")"}
                {...dragHandlers({ kind: "furniture", id: occupied.id })}
              >
                <g className="furniture-in">{FURNITURE[occupied.id]()}</g>
              </g>
            )}
          </svg>
        </div>

        <button
          className="room-arrow room-arrow-left"
          disabled={!prev}
          aria-label={prev ? "Go to " + ROOMS[prev].name : "No room this way"}
          onClick={() => go(prev)}
        >
          ‹
        </button>
        <button
          className="room-arrow room-arrow-right"
          disabled={!next}
          aria-label={next ? "Go to " + ROOMS[next].name : "No room this way"}
          onClick={() => go(next)}
        >
          ›
        </button>

        <div className="room-dots">
          {ROOM_ORDER.map((id) => (
            <span key={id} className={"room-dot" + (id === roomId ? " is-active" : "")} />
          ))}
        </div>
      </div>

      <div className="drawer">
        <div className="drawer-row">
          <button
            className="drawer-handle"
            onClick={() => {
              sheetOpenedAt.current = Date.now();
              setDrawerOpen(true);
              playTap();
            }}
          >
            🪑 Add things
          </button>
          <button
            className="drawer-handle drawer-handle-narrow"
            onClick={() => {
              onTidyUp();
              playWhoosh();
            }}
          >
            🧹 Tidy up
          </button>
        </div>
      </div>

      {castOpen && (
        <div
          className="sheet-backdrop"
          onClick={() => {
            if (Date.now() - sheetOpenedAt.current < 350) return;
            setCastOpen(false);
          }}
        >
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <strong>Who is playing?</strong>
              <button className="sheet-close" aria-label="Close" onClick={() => setCastOpen(false)}>
                ✕
              </button>
            </div>
            <div className="sheet-scroll">
              <div className="sheet-grid">
                {characters.map((c) => (
                  <button
                    key={c.id}
                    className={"item" + (c.id === activeId ? " is-active" : "")}
                    onClick={() => {
                      onSwitchCharacter(c.id);
                      setCastOpen(false);
                      playSparkle();
                    }}
                  >
                    <span className="item-art">
                      <Avatar look={c.look} uid={"cast-" + c.id} animate={false} crop="10 6 180 220" />
                    </span>
                    <span className="item-name">{c.name}</span>
                  </button>
                ))}
                <button
                  className="item"
                  onClick={() => {
                    setCastOpen(false);
                    onNewCharacter();
                  }}
                >
                  <span className="item-none">＋</span>
                  <span className="item-name">New one</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {drawerOpen && (
        <div
          className="sheet-backdrop"
          onClick={() => {
            // A touch device can deliver the click that opened the sheet to whatever is now
            // under the finger — which is this backdrop — shutting it again immediately.
            if (Date.now() - sheetOpenedAt.current < 350) return;
            setDrawerOpen(false);
            playTap();
          }}
        >
          {/* Stop a tap inside the sheet from closing it via the backdrop. */}
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <strong>Add things to the {room.name.toLowerCase()}</strong>
              <button
                className="sheet-close"
                aria-label="Close"
                onClick={() => {
                  setDrawerOpen(false);
                  playTap();
                }}
              >
                ✕
              </button>
            </div>
            <p className="hint sheet-hint">
              Anything can go in any room. Tap to add or take away, then drag it where you like.
            </p>

            <div className="sheet-scroll">
              {FURNITURE_GROUPS.map((group) => (
                <section key={group.label}>
                  <h3 className="sheet-group">
                    {group.icon} {group.label}
                  </h3>
                  <div className="sheet-grid">
                    {group.items.map((f) => {
                      const on = roomState.items.some((i) => i.id === f.id);
                      return (
                        <button
                          key={f.id}
                          className={"item" + (on ? " is-active" : "")}
                          onClick={() => {
                            onToggleFurniture(f.id);
                            playPop();
                          }}
                        >
                          <span className="item-art">
                            <svg viewBox={THUMB_VIEWBOX} className="avatar-svg">
                              <rect x={0} y={0} width={ROOM_W} height={WALL_BOTTOM} fill={room.wall} />
                              <rect
                                x={0}
                                y={WALL_BOTTOM}
                                width={ROOM_W}
                                height={ROOM_H - WALL_BOTTOM}
                                fill={room.floor}
                              />
                              <g transform={"translate(0 " + FURNITURE_DROP + ")"}>
                                {f.id === "deskLamp" ? deskLamp(true) : FURNITURE[f.id]?.()}
                              </g>
                            </svg>
                          </span>
                          <span className="item-name">{f.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
