import { useState } from "react";
import { AvatarLayers } from "../avatar/Avatar";
import { FURNITURE } from "./furniture";
import { ROOMS, ROOM_ORDER, type RoomId } from "../data/rooms";
import type { AvatarLook } from "../data/wardrobe";
import { playPop, playTap, playWhoosh } from "../lib/sound";

/**
 * Room scene coordinates. Furniture was authored against a wall bottom of 232, so it all sits
 * inside one translate rather than being renumbered.
 *
 * The scene is anchored to the TOP of the stage (xMidYMin) and the stage itself is painted the
 * room's floor colour, so the leftover space below simply reads as more floor instead of
 * letterboxing the room into a band with dead space above and below.
 *
 * The viewBox is deliberately shorter than the stage is ever tall (ratio 1.1 against a stage
 * that runs 1.16-1.40): scaling is then always width-limited, so the room fills the screen
 * edge to edge and never gains side bars when the furniture drawer opens and shortens it.
 */
const ROOM_VIEWBOX = "0 0 400 440";
const FURNITURE_DROP = 68;
const WALL_BOTTOM = 232 + FURNITURE_DROP;
/** Frames just the furnished part of the room for the drawer thumbnails. */
const THUMB_VIEWBOX = "0 120 400 260";

function RoomScene({
  roomId,
  placed,
  look,
}: {
  roomId: RoomId;
  placed: string[];
  look: AvatarLook | null;
}) {
  const room = ROOMS[roomId];

  return (
    <svg
      viewBox={ROOM_VIEWBOX}
      preserveAspectRatio="xMidYMin meet"
      className="room-svg"
      role="img"
      aria-label={room.name}
    >
      <rect x={0} y={0} width={400} height={WALL_BOTTOM} fill={room.wall} />
      <rect x={0} y={WALL_BOTTOM} width={400} height={440 - WALL_BOTTOM} fill={room.floor} />
      <rect x={0} y={WALL_BOTTOM - 8} width={400} height={10} fill={room.wallTrim} />
      {[70, 150, 230, 310].map((x) => (
        <path
          key={x}
          d={"M" + x + "," + (WALL_BOTTOM + 2) + " L" + (x - 34) + ",440"}
          stroke={room.floorBoards}
          strokeWidth={2.5}
          opacity={0.7}
        />
      ))}

      {/* Wall furniture, so every room has something on it even with nothing placed. */}
      <g>
        <rect x={160} y={74} width={80} height={68} rx={7} fill="#bfe8ff" stroke={room.wallTrim} strokeWidth={7} />
        <path d="M200,76 v64 M162,108 h76" stroke={room.wallTrim} strokeWidth={5} />
        <circle cx={222} cy={92} r={9} fill="#fff3b0" />
        <path d="M0,44 h400" stroke={room.wallTrim} strokeWidth={6} opacity={0.65} />
      </g>

      <g transform={"translate(0 " + FURNITURE_DROP + ")"}>
        {placed.map((id) => {
          const render = FURNITURE[id];
          return render ? <g key={id} className="furniture-in">{render()}</g> : null;
        })}
      </g>

      {look && (
        <g transform="translate(200 408) scale(0.47) translate(-100 -380)">
          <AvatarLayers look={look} uid={"room-" + roomId} />
        </g>
      )}
    </svg>
  );
}

export function ExploreMode({
  look,
  roomId,
  placed,
  onRoomChange,
  onToggleFurniture,
  onDesign,
}: {
  look: AvatarLook | null;
  roomId: RoomId;
  placed: string[];
  onRoomChange: (next: RoomId) => void;
  onToggleFurniture: (furnitureId: string) => void;
  onDesign: () => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const room = ROOMS[roomId];
  const index = ROOM_ORDER.indexOf(roomId);
  const prev = index > 0 ? ROOM_ORDER[index - 1] : null;
  const next = index < ROOM_ORDER.length - 1 ? ROOM_ORDER[index + 1] : null;

  function go(to: RoomId | null) {
    if (!to) return;
    playWhoosh();
    onRoomChange(to);
  }

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
          <RoomScene roomId={roomId} placed={placed} look={look} />
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
        <button
          className="drawer-handle"
          onClick={() => {
            setDrawerOpen((v) => !v);
            playTap();
          }}
        >
          {drawerOpen ? "▾ Done" : "🪑 Add things to this room"}
        </button>

        {drawerOpen && (
          <div className="items">
            {room.furniture.map((f) => {
              const on = placed.includes(f.id);
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
                      <rect x={0} y={0} width={400} height={WALL_BOTTOM} fill={room.wall} />
                      <rect x={0} y={WALL_BOTTOM} width={400} height={440 - WALL_BOTTOM} fill={room.floor} />
                      <g transform={"translate(0 " + FURNITURE_DROP + ")"}>{FURNITURE[f.id]?.()}</g>
                    </svg>
                  </span>
                  <span className="item-name">{f.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
