import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AvatarLayers } from "../avatar/Avatar";
import { FURNITURE, WALL_MOUNTED } from "./furniture";
import { ROOMS, ROOM_ORDER, type RoomId } from "../data/rooms";
import type { AvatarLook } from "../data/wardrobe";
import type { RoomState } from "../lib/storage";
import { playPop, playTap, playWhoosh } from "../lib/sound";

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
/** How far above the floor line a floor-standing piece may be lifted (onto a bed, say). */
const LIFT_ALLOWANCE = 90;

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
  end: (e: PointerEvent) => void;
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
  onDesign,
}: {
  look: AvatarLook | null;
  roomId: RoomId;
  room: RoomState;
  onRoomChange: (next: RoomId) => void;
  onToggleFurniture: (furnitureId: string) => void;
  onMoveFurniture: (furnitureId: string, dx: number, dy: number) => void;
  onMoveAvatar: (x: number, y: number) => void;
  onTidyUp: () => void;
  onDesign: () => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const room = ROOMS[roomId];
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
    // Stops the browser starting its own drag of the SVG, which would swallow the gesture.
    e.preventDefault();
    const scale = currentScale();
    let originX: number;
    let originY: number;
    let bounds: DragState["bounds"];

    if (target.kind === "avatar") {
      originX = roomState.avatarX;
      originY = roomState.avatarY;
      bounds = AVATAR_BOUNDS;
    } else {
      const item = roomState.items.find((i) => i.id === target.id);
      if (!item) return;
      originX = item.dx;
      originY = item.dy;

      // Bound the OFFSET so the piece's own artwork stays inside the room. getBBox on the
      // inner art group gives the authored box, before this group's translate is applied.
      const art = e.currentTarget.firstElementChild as SVGGraphicsElement | null;
      const box = art?.getBBox();
      if (box) {
        const bottom = FURNITURE_DROP + box.y + box.height;
        bounds = {
          minX: EDGE - box.x,
          maxX: ROOM_W - EDGE - (box.x + box.width),
          minY: WALL_MOUNTED.has(target.id)
            ? EDGE - FURNITURE_DROP - box.y
            : WALL_BOTTOM - LIFT_ALLOWANCE - bottom,
          maxY: WALL_MOUNTED.has(target.id)
            ? WALL_BOTTOM + 20 - bottom
            : ROOM_H - EDGE - bottom,
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
      if (!drag || drag.pointerId !== ev.pointerId) return;
      ev.preventDefault();

      const x = clamp(drag.originX + (ev.clientX - drag.clientX) / drag.scale, drag.bounds.minX, drag.bounds.maxX);
      const y = clamp(drag.originY + (ev.clientY - drag.clientY) / drag.scale, drag.bounds.minY, drag.bounds.maxY);

      if (drag.target.kind === "avatar") onMoveAvatar(x, y);
      else onMoveFurniture(drag.target.id, x, y);
    };

    const end = (ev: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== ev.pointerId) return;
      releaseListeners();
      dragRef.current = null;
      setDraggingKey(null);
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

  const dragHandlers = (target: DragTarget) => ({
    onPointerDown: (e: ReactPointerEvent<SVGGElement>) => startDrag(e, target),
  });

  return (
    <div className="screen">
      <header className="topbar">
        <h1 className="logo">
          {room.icon} {room.name}
        </h1>
        <button
          className="chip-btn"
          onClick={() => {
            playTap();
            onDesign();
          }}
        >
          👗 Dress up
        </button>
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
              const render = FURNITURE[item.id];
              if (!render) return null;
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
                  <g className="furniture-in">{render()}</g>
                </g>
              );
            })}

            {look && (
              <g
                className={"draggable" + (draggingKey === "avatar" ? " is-dragging" : "")}
                transform={
                  "translate(" + roomState.avatarX + " " + roomState.avatarY + ") scale(0.47) translate(-100 -380)"
                }
                {...dragHandlers({ kind: "avatar" })}
              >
                <AvatarLayers look={look} uid={"room-" + roomId} />
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
              setDrawerOpen((v) => !v);
              playTap();
            }}
          >
            {drawerOpen ? "▾ Done" : "🪑 Add things"}
          </button>
          {drawerOpen && (
            <button
              className="drawer-handle drawer-handle-narrow"
              onClick={() => {
                onTidyUp();
                playWhoosh();
              }}
            >
              🧹 Tidy up
            </button>
          )}
        </div>

        {drawerOpen && (
          <>
            <p className="hint">Drag anything in the room to move it — even you!</p>
            <div className="items">
              {room.furniture.map((f) => {
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
                        <rect x={0} y={WALL_BOTTOM} width={ROOM_W} height={ROOM_H - WALL_BOTTOM} fill={room.floor} />
                        <g transform={"translate(0 " + FURNITURE_DROP + ")"}>{FURNITURE[f.id]?.()}</g>
                      </svg>
                    </span>
                    <span className="item-name">{f.name}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
