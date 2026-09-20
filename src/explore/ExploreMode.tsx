import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import { Avatar, AvatarLayers } from "../avatar/Avatar";
import {
  CATALOGUE_CTX,
  CONTAINERS,
  FLAT_ON_FLOOR,
  FLOATING,
  LAMPS,
  LIGHT_GLOW,
  PAD,
  POPPED_BALLOONS,
  STACKABLE,
  STALLS,
  WALL_MOUNTED,
  CONTAINER_DROP,
  capacityOf,
  facingCount,
  isLit,
  renderFurniture,
  seatShift,
  slotAt,
} from "./furniture";
import { FURNITURE_GROUPS, ROOMS, ROOM_ORDER, type RoomDef, type RoomId } from "../data/rooms";
import { STALL_STOCK, THINGS, recipeFor } from "../data/things";
import type { AvatarLook } from "../data/wardrobe";
import {
  BASKET_LIMIT,
  type AvatarPose,
  type PlacedFurniture,
  type RoomState,
  type SavedCharacter,
  type Stroke,
  type TimeOfDay,
} from "../lib/storage";
import {
  playBang,
  playChime,
  playCoin,
  playCreak,
  playNom,
  playPop,
  playSparkle,
  playTap,
  playThud,
  playTurn,
  playWhoosh,
  playYuck,
} from "../lib/sound";

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
  chairLeft: { zoneX: 124, zoneY: 328, x: 124, y: 324, pose: "sit" },
  chairRight: { zoneX: 288, zoneY: 328, x: 288, y: 324, pose: "sit" },
  bed: { zoneX: 286, zoneY: 330, x: 369, y: 220, pose: "lie" },
};

/**
 * Where you end up on a piece, and where you aim to land on it — both measured from the piece
 * as it currently is, which means following it when it is dragged AND when it is turned. A
 * chair seen side on has its seat off to one side of the back post; turned to face you, the
 * seat is centred, and a sitter left at the old spot ends up beside the chair rather than on it.
 */
function seatPlaceAt(
  id: string,
  facing: number,
  dx: number,
  dy: number
): { x: number; y: number; pose: AvatarPose } | null {
  const seat = SEATS[id];
  if (!seat) return null;
  return { x: seat.x + dx + seatShift(id, facing), y: seat.y + dy, pose: seat.pose };
}

function seatPlace(item: PlacedFurniture): { x: number; y: number; pose: AvatarPose } | null {
  return seatPlaceAt(item.id, item.facing, item.dx, item.dy);
}

function seatZone(item: PlacedFurniture): { x: number; y: number } | null {
  const seat = SEATS[item.id];
  if (!seat) return null;
  return { x: seat.zoneX + item.dx + seatShift(item.id, item.facing), y: seat.zoneY + item.dy };
}

/** How close the character has to be dropped for it to count as sitting on something. */
const SEAT_SNAP = 78;

/** How long a popped balloon stays popped. */
const REINFLATE_MS = 2200;

/** How long "Yum!" hangs in the air after something is eaten. */
const REACTION_MS = 1100;

/** How long the mouth keeps working after a mouthful. */
const CHEW_MS = 1500;

/**
 * How dark the whole scene goes. Day adds nothing at all, so the rooms look exactly as they
 * did before anyone thought about time of day.
 */
const TINT: Record<TimeOfDay, { colour: string; opacity: number }> = {
  day: { colour: "#000000", opacity: 0 },
  dusk: { colour: "#3a2a6b", opacity: 0.28 },
  night: { colour: "#0d1240", opacity: 0.54 },
};

/**
 * Icon only. Spelling out "Teatime" next to the character picker and the dress-up button was
 * enough to wrap the room name onto a second line on a phone, which is the size this is played
 * at. The name goes in the label instead.
 */
const TIME_ICON: Record<TimeOfDay, string> = {
  day: "☀️",
  dusk: "🌆",
  night: "🌙",
};

const TIME_NAME: Record<TimeOfDay, string> = {
  day: "Daytime",
  dusk: "Teatime",
  night: "Night",
};

/** What's behind the window, which is the quickest way to tell what time it is. */
const SKY: Record<TimeOfDay, string> = {
  day: "#bfe8ff",
  dusk: "#ffb37a",
  night: "#28306b",
};

/** Fixed so the stars don't jump about every time the room re-renders. */
const STARS: Array<[number, number, number]> = [
  [46, 34, 2.2], [92, 58, 1.6], [128, 26, 2], [260, 40, 1.8],
  [306, 22, 2.4], [352, 52, 1.6], [196, 18, 2], [22, 72, 1.7],
];

type DragTarget = { kind: "avatar" } | { kind: "furniture"; id: string };

/**
 * Which panel is showing. Cupboards deliberately don't have one: you open them and drag things
 * in, which is a great deal more fun than picking from a list.
 */
type Tray = { kind: "stall"; id: string } | { kind: "cooker"; id: string };

/** A thing being carried by a fingertip, and where it was picked up from. */
type ThingSource =
  | { kind: "basket"; index: number }
  | { kind: "container"; id: string; index: number };

interface ThingDrag {
  thingId: string;
  from: ThingSource;
  startX: number;
  startY: number;
  /** The open container currently under the finger, if any. */
  over: string | null;
  move: (e: PointerEvent) => void;
  end: (e?: PointerEvent) => void;
}

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
  /**
   * Whether the finger is currently over the bin. Kept on the drag rather than in React state
   * because the drop handler needs the value as it is NOW, not as it was when the handler was
   * created.
   */
  overBin: boolean;
  /**
   * The nodes the drag writes to directly. Every move used to update React state, which
   * redrew the scene to move one thing; now the move sets a transform and the save is told
   * once, on drop.
   */
  node: SVGGElement;
  /** The wrapper holding what is inside an open container, which travels with it. */
  contents: SVGGElement | null;
  /** Set when someone is sitting on the dragged piece and has to be carried along. */
  rider: { node: SVGGElement; id: string; facing: number } | null;
  /** Where the drag has got to: a piece's offset, or the character's position. */
  x: number;
  y: number;
  pose: AvatarPose;
  /**
   * The bin's box, measured on the first move that finds it. It cannot move while a drag is
   * running, and re-measuring it every move forces a layout on each one.
   */
  binRect: DOMRect | null;
  /** Kept so exactly these listeners can be detached again when the drag ends. */
  move: (e: PointerEvent) => void;
  end: () => void;
}

/**
 * Where a piece and the character are drawn. The drag writes these straight to the DOM rather
 * than going through React, so both have to come from here — if the two ever disagreed, a
 * piece would jump the moment it was let go.
 */
function pieceTransform(dx: number, dy: number): string {
  return "translate(" + dx + " " + (FURNITURE_DROP + dy) + ")";
}

function characterTransform(x: number, y: number, pose: AvatarPose): string {
  return (
    "translate(" + x + " " + y + ")" +
    (pose === "lie" ? " rotate(-90)" : "") +
    " scale(0.47) translate(-100 -380)"
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function rgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + alpha + ")";
}

/** A thing's own artwork, sized to fit a square button or slot. */
function ThingArt({ id }: { id: string }): ReactElement | null {
  const thing = THINGS[id];
  if (!thing) return null;
  return (
    <svg viewBox="-22 -22 44 44" className="thing-svg" role="img" aria-label={thing.name}>
      {thing.art()}
    </svg>
  );
}

/**
 * One piece of furniture, plus whatever is on its shelves.
 *
 * Memoised, and that is the whole reason it is a component at all. Dragging updates the room
 * on every pointer move, and redrawing thirteen pieces — each of which builds a few dozen SVG
 * nodes — to move one of them put the dragged piece a frame or two behind the finger. Moving a
 * piece replaces only that item object, so every other `item` prop keeps its identity and this
 * skips the work entirely.
 */
const Piece = memo(function Piece({
  item,
  dragging,
  popped,
  onGrab,
  onGrabThing,
}: {
  item: PlacedFurniture;
  dragging: boolean;
  popped: boolean;
  onGrab: (e: ReactPointerEvent<SVGGElement>, id: string) => void;
  onGrabThing: (e: ReactPointerEvent<SVGGElement>, from: ThingSource, thingId: string) => void;
}): ReactElement | null {
  const art = popped ? POPPED_BALLOONS() : renderFurniture(item.id, item);
  if (!art) return null;

  return (
    <Fragment>
      {/* The positioning transform and the pop animation live on separate groups: a CSS
          animation on `transform` would otherwise override the attribute and snap the piece
          back to where it was authored. */}
      <g
        className={"draggable" + (dragging ? " is-dragging" : "")}
        transform={pieceTransform(item.dx, item.dy)}
        onPointerDown={(e) => onGrab(e, item.id)}
      >
        <g className="furniture-in">{art}</g>
      </g>

      {/* What is inside an open container is a layer of its own rather than part of the piece:
          anything drawn inside the furniture's group would drag the furniture instead of
          itself. */}
      {/* One wrapper carrying the piece's offset, with each thing placed in its slot inside
          it, so dragging the cupboard moves everything in it by moving a single node. */}
      {item.open && item.stored.length > 0 && (
        <g data-contents={item.id} transform={pieceTransform(item.dx, item.dy)}>
          {item.stored.map((thingId, i) => {
            const slot = slotAt(item.id, i);
            const thing = THINGS[thingId];
            if (!slot || !thing) return null;
            return (
              <g
                key={thingId + "-" + i}
                className="draggable"
                transform={"translate(" + slot.x + " " + slot.y + ") scale(" + slot.scale + ")"}
                onPointerDown={(e) =>
                  onGrabThing(e, { kind: "container", id: item.id, index: i }, thingId)
                }
              >
                {/* A pad the size of the slot — a carrot drawn this small is far too little to
                    aim a finger at. */}
                <rect x={-24} y={-24} width={48} height={48} fill="transparent" />
                {thing.art()}
              </g>
            );
          })}
        </g>
      )}
    </Fragment>
  );
});

/** Memoised for the same reason: dragging the furniture must not redraw the whole character. */
const Character = memo(function Character({
  look,
  uid,
  x,
  y,
  pose,
  chewing,
  dragging,
  onGrab,
}: {
  look: AvatarLook;
  uid: string;
  x: number;
  y: number;
  pose: AvatarPose;
  chewing: boolean;
  dragging: boolean;
  onGrab: (e: ReactPointerEvent<SVGGElement>) => void;
}): ReactElement {
  return (
    <g
      className={"draggable character" + (dragging ? " is-dragging" : "")}
      transform={characterTransform(x, y, pose)}
      onPointerDown={onGrab}
    >
      <AvatarLayers look={look} uid={uid} pose={pose} chewing={chewing} />
    </g>
  );
});

/** The window, or — outdoors — the sky, both of which change with the time of day. */
const RoomFittings = memo(function RoomFittings({ room, time }: { room: RoomDef; time: TimeOfDay }): ReactElement {
  if (room.outdoor) {
    return (
      <g>
        {time === "night" ? (
          <g>
            {STARS.map(([x, y, r]) => (
              <circle key={x + ":" + y} cx={x} cy={y} r={r} fill="#fffdfa" opacity={0.9} />
            ))}
            <circle cx={324} cy={62} r={22} fill="#fff3c4" />
            <circle cx={314} cy={54} r={19} fill={room.wall} />
          </g>
        ) : (
          <g>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
              <rect
                key={a}
                x={-3}
                y={-34}
                width={6}
                height={11}
                rx={3}
                fill={time === "dusk" ? "#ff9040" : "#ffe067"}
                transform={"translate(324 62) rotate(" + a + ")"}
              />
            ))}
            <circle cx={324} cy={62} r={21} fill={time === "dusk" ? "#ff7a3f" : "#ffd23f"} />
          </g>
        )}
        {([
          [70, 60, 1],
          [188, 36, 0.8],
          [252, 86, 0.6],
        ] as Array<[number, number, number]>).map(([x, y, s]) => (
          <g key={x} transform={"translate(" + x + " " + y + ") scale(" + s + ")"} opacity={0.85}>
            <circle cx={-16} cy={4} r={11} fill="#fffdfa" />
            <circle cx={0} cy={-3} r={15} fill="#fffdfa" />
            <circle cx={16} cy={5} r={10} fill="#fffdfa" />
            <rect x={-22} y={4} width={44} height={11} rx={5.5} fill="#fffdfa" />
          </g>
        ))}
      </g>
    );
  }

  return (
    <g>
      <rect x={160} y={74} width={80} height={68} rx={7} fill={SKY[time]} stroke={room.wallTrim} strokeWidth={7} />
      <path d="M200,76 v64 M162,108 h76" stroke={room.wallTrim} strokeWidth={5} />
      {time === "night" ? (
        <g>
          <circle cx={222} cy={92} r={9} fill="#fff3c4" />
          <circle cx={218} cy={88} r={7.5} fill={SKY.night} />
          <circle cx={176} cy={90} r={1.8} fill="#fffdfa" />
          <circle cx={186} cy={124} r={1.6} fill="#fffdfa" />
          <circle cx={226} cy={126} r={1.7} fill="#fffdfa" />
        </g>
      ) : (
        <circle cx={222} cy={92} r={9} fill={time === "dusk" ? "#ff7a3f" : "#fff3b0"} />
      )}
      <path d={"M0,44 h" + ROOM_W} stroke={room.wallTrim} strokeWidth={6} opacity={0.65} />
    </g>
  );
});

export function ExploreMode({
  look,
  roomId,
  room: roomState,
  basket,
  timeOfDay,
  onRoomChange,
  onToggleFurniture,
  onMoveFurniture,
  onUpdateFurniture,
  onRemoveFurniture,
  onMoveAvatar,
  onTidyUp,
  onCycleTime,
  onBuy,
  onEat,
  onStore,
  onTakeOut,
  onCook,
  characters,
  activeId,
  onSwitchCharacter,
  onNewCharacter,
  onDesign,
}: {
  look: AvatarLook | null;
  roomId: RoomId;
  room: RoomState;
  basket: string[];
  timeOfDay: TimeOfDay;
  onRoomChange: (next: RoomId) => void;
  onToggleFurniture: (furnitureId: string) => void;
  onMoveFurniture: (furnitureId: string, dx: number, dy: number) => void;
  onUpdateFurniture: (furnitureId: string, patch: Partial<PlacedFurniture>) => void;
  onRemoveFurniture: (furnitureId: string) => void;
  onMoveAvatar: (
    x: number,
    y: number,
    settle?: { pose: AvatarPose; seat: string | null }
  ) => void;
  onTidyUp: () => void;
  onCycleTime: () => void;
  onBuy: (thingId: string) => void;
  onEat: (index: number) => void;
  onStore: (furnitureId: string, index: number) => void;
  onTakeOut: (furnitureId: string, index: number) => void;
  onCook: (indexA: number, indexB: number, dishId: string) => void;
  characters: SavedCharacter[];
  activeId: string | null;
  onSwitchCharacter: (id: string) => void;
  onNewCharacter: () => void;
  onDesign: () => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [poppedAt, setPoppedAt] = useState<number | null>(null);
  const [castOpen, setCastOpen] = useState(false);
  const [tray, setTray] = useState<Tray | null>(null);
  /** Which basket slots are waiting in the pot. Indices, so two of the same thing still work. */
  const [pot, setPot] = useState<number[]>([]);
  const [padId, setPadId] = useState<string | null>(null);
  const [reaction, setReaction] = useState<string | null>(null);
  const [chewing, setChewing] = useState(false);
  /** A thing being carried on a fingertip, in client pixels, for drawing it under the finger. */
  const [held, setHeld] = useState<{
    thingId: string;
    /** Which basket slot it came out of, so only that one dims — not every apple she owns. */
    index: number | null;
    x: number;
    y: number;
    over: string | null;
  } | null>(null);
  const [overBin, setOverBin] = useState(false);
  /** When the sheet opened, to ignore the click that opened it arriving on the new backdrop. */
  const sheetOpenedAt = useRef(0);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const binRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const thingDragRef = useRef<ThingDrag | null>(null);
  /**
   * The drag's move/end handlers are closures made when the drag starts, so reading roomState
   * directly from them sees where things were BEFORE the drag. This ref always holds the
   * current state.
   */
  const roomStateRef = useRef(roomState);
  roomStateRef.current = roomState;
  // Same reason: a drop handler made when the drag started would otherwise read the basket as
  // it was before anything moved.
  const basketRef = useRef(basket);
  basketRef.current = basket;

  const room = ROOMS[roomId];

  const index = ROOM_ORDER.indexOf(roomId);
  const prev = index > 0 ? ROOM_ORDER[index - 1] : null;
  const next = index < ROOM_ORDER.length - 1 ? ROOM_ORDER[index + 1] : null;

  const trayItem = tray ? roomState.items.find((i) => i.id === tray.id) : undefined;
  const padItem = padId ? roomState.items.find((i) => i.id === padId) : undefined;

  function go(to: RoomId | null) {
    if (!to) return;
    playWhoosh();
    closeTray();
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

  function releaseThingListeners() {
    const drag = thingDragRef.current;
    if (!drag) return;
    window.removeEventListener("pointermove", drag.move);
    window.removeEventListener("pointerup", drag.end);
    window.removeEventListener("pointercancel", drag.end);
  }

  useEffect(
    () => () => {
      releaseListeners();
      releaseThingListeners();
    },
    []
  );

  function closeTray() {
    if (tray?.kind === "cooker") onUpdateFurniture(tray.id, { open: false });
    setTray(null);
    setPot([]);
  }

  /** Put the dragged things where the pointer has taken them, without going through React. */
  function applyDrag(drag: DragState) {
    if (drag.target.kind === "avatar") {
      drag.node.setAttribute("transform", characterTransform(drag.x, drag.y, drag.pose));
      return;
    }
    const placed = pieceTransform(drag.x, drag.y);
    drag.node.setAttribute("transform", placed);
    drag.contents?.setAttribute("transform", placed);
    if (drag.rider) {
      const place = seatPlaceAt(drag.rider.id, drag.rider.facing, drag.x, drag.y);
      if (place) {
        drag.rider.node.setAttribute("transform", characterTransform(place.x, place.y, place.pose));
      }
    }
  }

  /**
   * A render that happens in the middle of a drag for some unrelated reason — a timer running
   * out, the bin lighting up — redraws the piece from the save, which has not been told about
   * the drag yet and would snap it back to where it started. Putting it back after every
   * render costs nothing and removes the whole class of problem.
   */
  useEffect(() => {
    if (dragRef.current) applyDrag(dragRef.current);
  });

  function isOverBin(drag: DragState, ev: PointerEvent): boolean {
    if (!drag.binRect) {
      // It only exists from the render after the drag started, so the first move or two may
      // find nothing there yet.
      const el = binRef.current;
      if (!el) return false;
      drag.binRect = el.getBoundingClientRect();
    }
    const r = drag.binRect;
    return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
  }

  function startDrag(e: ReactPointerEvent<SVGGElement>, target: DragTarget) {
    // Deliberately no preventDefault: cancelling the pointerdown of a touch made Chromium
    // suppress the click of the NEXT tap, so the first button pressed after any drag did
    // nothing. touch-action: none on the stage already stops the browser claiming the gesture.
    const scale = currentScale();
    const node = e.currentTarget;
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

    // Anything that has to travel with the dragged piece, found once now rather than looked up
    // on every move.
    let contents: SVGGElement | null = null;
    let rider: DragState["rider"] = null;
    if (target.kind === "furniture") {
      const svg = svgRef.current;
      contents = svg?.querySelector<SVGGElement>('[data-contents="' + target.id + '"]') ?? null;
      const current = roomStateRef.current;
      if (current.avatarSeat === target.id) {
        const riderNode = svg?.querySelector<SVGGElement>("g.character") ?? null;
        const item = current.items.find((i) => i.id === target.id);
        if (riderNode && item) rider = { node: riderNode, id: target.id, facing: item.facing };
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

      drag.x = clamp(
        drag.originX + (ev.clientX - drag.clientX) / drag.scale,
        drag.bounds.minX,
        drag.bounds.maxX
      );
      drag.y = clamp(
        drag.originY + (ev.clientY - drag.clientY) / drag.scale,
        drag.bounds.minY,
        drag.bounds.maxY
      );
      applyDrag(drag);

      if (drag.target.kind === "furniture") {
        const over = isOverBin(drag, ev);
        if (over !== drag.overBin) {
          drag.overBin = over;
          setOverBin(over);
        }
      }
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
      setOverBin(false);

      // The moves only moved the DOM, so this is where the save finds out where things are.
      if (drag.target.kind === "avatar") {
        onMoveAvatar(drag.x, drag.y);
      } else {
        onMoveFurniture(drag.target.id, drag.x, drag.y);
        if (drag.rider) {
          const place = seatPlaceAt(drag.rider.id, drag.rider.facing, drag.x, drag.y);
          if (place) onMoveAvatar(place.x, place.y);
        }
      }

      // A finger wobbles; 5px counted honest taps as drags, which re-seated a character the
      // moment you tried to tap them off a chair.
      const travelled = ev ? Math.hypot(ev.clientX - drag.clientX, ev.clientY - drag.clientY) : 0;
      if (travelled < 11) {
        onTap(drag.target, drag.x, drag.y);
        return;
      }

      // Dropped on the bin: the piece goes away. Only ever reached after a real drag, so a tap
      // on something that happens to sit under the bin can't delete it by accident.
      if (drag.target.kind === "furniture" && drag.overBin) {
        binFurniture(drag.target.id);
        return;
      }

      if (drag.target.kind === "avatar") settleAvatar(drag.x, drag.y);
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
      node,
      contents,
      rider,
      x: originX,
      y: originY,
      pose: roomStateRef.current.avatarPose,
      overBin: false,
      binRect: null,
      move,
      end,
    };

    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);

    setDraggingKey(target.kind === "avatar" ? "avatar" : target.id);
    playTap();
  }

  /** Throw a piece away, standing the character up first if they were sitting on it. */
  function binFurniture(id: string) {
    const current = roomStateRef.current;
    if (current.avatarSeat === id) {
      onMoveAvatar(current.avatarX, current.avatarY, { pose: "stand", seat: null });
    }
    if (tray?.id === id) closeTray();
    if (padId === id) setPadId(null);
    onRemoveFurniture(id);
    playThud();
  }

  /**
   * A press that never really moved: treat it as a tap on whatever was pressed. The position
   * is passed in because the save has only just been told about it and won't have caught up.
   */
  function onTap(target: DragTarget, x: number, y: number) {
    const current = roomStateRef.current;
    if (target.kind === "avatar") {
      // Tap the character to get them back up again.
      if (current.avatarPose !== "stand") {
        onMoveAvatar(x, y - 18, { pose: "stand", seat: null });
        playSparkle();
      } else {
        playPop();
      }
      return;
    }

    const id = target.id;
    const item = current.items.find((i) => i.id === id);
    if (!item) return;

    // Each kind of thing does its own thing when tapped, and only one of them can apply: a
    // cupboard opens, a lamp lights, a chair turns.
    if (id === "pictureFrame") {
      setPadId(id);
      playTap();
      return;
    }

    if (CONTAINERS.has(id)) {
      onUpdateFurniture(id, { open: !item.open });
      playCreak();
      return;
    }

    if (STALLS.has(id)) {
      setTray({ kind: "stall", id });
      playTap();
      return;
    }

    if (id === "cooker") {
      const opening = !item.open;
      onUpdateFurniture(id, { open: opening });
      setTray(opening ? { kind: "cooker", id } : null);
      if (!opening) setPot([]);
      playTap();
      return;
    }

    if (LAMPS.has(id)) {
      onUpdateFurniture(id, { on: !item.on });
      playTap();
      return;
    }

    if (id === "balloons") {
      if (poppedAt === null) {
        setPoppedAt(Date.now());
        playBang();
      }
      return;
    }

    const turns = facingCount(id);
    if (turns > 1) {
      const facing = (item.facing + 1) % turns;
      onUpdateFurniture(id, { facing });
      // The seat moves when the chair turns, so whoever is on it has to move too.
      if (current.avatarSeat === id) {
        const place = seatPlace({ ...item, facing });
        if (place) onMoveAvatar(place.x, place.y, { pose: place.pose, seat: id });
      }
      playTurn();
      return;
    }

    playPop();
  }

  /** After the character is dropped, sit or lie them on whatever they landed on. */
  function settleAvatar(x: number, y: number) {
    const current = roomStateRef.current;

    // Dragging someone who is already sitting or lying always frees them. Otherwise the snap
    // radius grabs them straight back onto the seat and there's no way off it.
    if (current.avatarPose !== "stand") {
      onMoveAvatar(x, y, { pose: "stand", seat: null });
      playPop();
      return;
    }

    let best: { id: string; x: number; y: number; pose: AvatarPose } | null = null;
    let bestDistance = SEAT_SNAP;

    for (const item of current.items) {
      const zone = seatZone(item);
      const place = seatPlace(item);
      if (!zone || !place) continue;
      const distance = Math.hypot(x - zone.x, y - zone.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { id: item.id, ...place };
      }
    }

    if (best) {
      onMoveAvatar(best.x, best.y, { pose: best.pose, seat: best.id });
      playSparkle();
    }
  }

  /** Every container standing open in this room, which is what a thing can be dropped into. */
  function openContainers(): PlacedFurniture[] {
    return roomStateRef.current.items.filter((i) => i.open && CONTAINER_DROP[i.id]);
  }

  /** Client pixels to room coordinates. The scene is width-limited and anchored to the top. */
  function toRoom(clientX: number, clientY: number): { x: number; y: number } | null {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return null;
    const scale = rect.width / ROOM_W;
    return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
  }

  /** Which open container the finger is over, if any. */
  function containerUnder(clientX: number, clientY: number): string | null {
    const at = toRoom(clientX, clientY);
    if (!at) return null;
    for (const item of openContainers()) {
      const box = CONTAINER_DROP[item.id];
      const x = box.x + item.dx;
      const y = FURNITURE_DROP + box.y + item.dy;
      if (at.x >= x && at.x <= x + box.w && at.y >= y && at.y <= y + box.h) return item.id;
    }
    return null;
  }

  /**
   * Picking a thing up — out of the basket, or off a shelf inside an open cupboard. The same
   * short-travel rule the furniture uses decides afterwards whether this was really a tap.
   */
  function startThingDrag(e: ReactPointerEvent<Element>, from: ThingSource, thingId: string) {
    const move = (ev: PointerEvent) => {
      const drag = thingDragRef.current;
      if (!drag) return;
      drag.over = containerUnder(ev.clientX, ev.clientY);
      setHeld({
        thingId: drag.thingId,
        index: drag.from.kind === "basket" ? drag.from.index : null,
        x: ev.clientX,
        y: ev.clientY,
        over: drag.over,
      });
    };

    const end = (ev?: PointerEvent) => {
      const drag = thingDragRef.current;
      if (!drag) return;
      releaseThingListeners();
      thingDragRef.current = null;
      setHeld(null);

      const travelled = ev ? Math.hypot(ev.clientX - drag.startX, ev.clientY - drag.startY) : 0;
      if (travelled < 11) {
        if (drag.from.kind === "basket") tapBasket(drag.from.index);
        else takeOut(drag.from.id, drag.from.index);
        return;
      }
      dropThing(drag.from, drag.over);
    };

    thingDragRef.current = { thingId, from, startX: e.clientX, startY: e.clientY, over: null, move, end };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    setHeld({
      thingId,
      index: from.kind === "basket" ? from.index : null,
      x: e.clientX,
      y: e.clientY,
      over: null,
    });
    playTap();
  }

  function dropThing(from: ThingSource, over: string | null) {
    if (from.kind === "basket") {
      // Let go over the room rather than over a cupboard: nothing happens, it stays in hand.
      if (!over) return;
      const item = roomStateRef.current.items.find((i) => i.id === over);
      if (item) putIn(item, from.index);
      return;
    }
    // Out of a cupboard: dropped anywhere but back where it came from, it goes in the basket.
    if (over === from.id) return;
    takeOut(from.id, from.index);
  }

  function putIn(item: PlacedFurniture, index: number) {
    if (item.stored.length >= capacityOf(item.id)) {
      setReaction("That's full!");
      playYuck();
      return;
    }
    onStore(item.id, index);
    playCreak();
  }

  function takeOut(id: string, index: number) {
    if (basketRef.current.length >= BASKET_LIMIT) {
      setReaction("Your hands are full!");
      playYuck();
      return;
    }
    onTakeOut(id, index);
    playPop();
  }

  function eat(index: number) {
    const thing = THINGS[basketRef.current[index]];
    if (!thing) return;
    if (thing.taste === "yuck") {
      setReaction("Yuck! Cook it first");
      playYuck();
      return;
    }
    setReaction("Yum!");
    setChewing(true);
    playNom();
    onEat(index);
  }

  /** Tapping something in the basket: into the pot, into whatever is open, or into your mouth. */
  function tapBasket(i: number) {
    if (!basketRef.current[i]) return;

    if (tray?.kind === "cooker") {
      setPot((p) => (p.includes(i) ? p.filter((n) => n !== i) : p.length < 2 ? [...p, i] : p));
      playTap();
      return;
    }

    // With exactly one cupboard standing open, a tap obviously means "put it away". Dragging
    // is the real gesture, but a small child shouldn't have to be accurate to tidy up. A full
    // cupboard falls through to eating rather than refusing — dragging into it still says so.
    const open = openContainers();
    const room = open.find((c) => c.stored.length < capacityOf(c.id));
    if (open.length === 1 && room) {
      putIn(room, i);
      return;
    }

    eat(i);
  }

  function cook() {
    if (pot.length < 2) return;
    const a = basket[pot[0]];
    const b = basket[pot[1]];
    const match = a && b ? recipeFor(a, b) : null;
    if (!match) {
      setReaction("Those two don't go together");
      playYuck();
      setPot([]);
      return;
    }
    onCook(pot[0], pot[1], match.makes);
    setPot([]);
    setReaction("You made " + THINGS[match.makes].name.toLowerCase() + "!");
    playChime();
  }

  // Balloons come back a couple of seconds after they're popped.
  useEffect(() => {
    if (poppedAt === null) return;
    const timer = setTimeout(() => setPoppedAt(null), REINFLATE_MS);
    return () => clearTimeout(timer);
  }, [poppedAt]);

  useEffect(() => {
    if (reaction === null) return;
    const timer = setTimeout(() => setReaction(null), REACTION_MS);
    return () => clearTimeout(timer);
  }, [reaction]);

  useEffect(() => {
    if (!chewing) return;
    const timer = setTimeout(() => setChewing(false), CHEW_MS);
    return () => clearTimeout(timer);
  }, [chewing]);

  /**
   * The scene's pieces are memoised, which only works if the handler they are given keeps its
   * identity. These read the current implementation out of a ref, so they never change while
   * still calling the latest version.
   */
  const startDragRef = useRef(startDrag);
  startDragRef.current = startDrag;
  const startThingDragRef = useRef(startThingDrag);
  startThingDragRef.current = startThingDrag;

  const grabPiece = useCallback((e: ReactPointerEvent<SVGGElement>, id: string) => {
    startDragRef.current(e, { kind: "furniture", id });
  }, []);

  const grabAvatar = useCallback((e: ReactPointerEvent<SVGGElement>) => {
    startDragRef.current(e, { kind: "avatar" });
  }, []);

  const grabThing = useCallback(
    (e: ReactPointerEvent<SVGGElement>, from: ThingSource, thingId: string) => {
      startThingDragRef.current(e, from, thingId);
    },
    []
  );

  const tint = TINT[timeOfDay];
  const lit = timeOfDay !== "day" ? roomState.items.filter((i) => LIGHT_GLOW[i.id] && isLit(i.id, i)) : [];
  /**
   * The scene is anchored to the top of the stage and the stage below it is painted floor
   * colour, so nightfall has to be laid over that background too — tinting only inside the
   * viewBox left a brightly lit strip of floor along the bottom of the screen.
   */
  const stageBackground =
    tint.opacity > 0
      ? "linear-gradient(" + rgba(tint.colour, tint.opacity) + "," + rgba(tint.colour, tint.opacity) + "), " + room.floor
      : room.floor;

  return (
    <div className="screen">
      <header className="topbar">
        <h1 className="logo">
          {room.icon} {room.name}
        </h1>
        <span className="version">v{__APP_VERSION__}</span>
        <div className="topbar-actions">
          <button
            className="chip-btn chip-ghost chip-icon"
            aria-label={TIME_NAME[timeOfDay] + " — tap to change the time of day"}
            onClick={() => {
              onCycleTime();
              playWhoosh();
            }}
          >
            {TIME_ICON[timeOfDay]}
          </button>
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

      <div className="room-stage" style={{ background: stageBackground }}>
        <div key={roomId} className="room-slide">
          <svg
            ref={svgRef}
            viewBox={ROOM_VIEWBOX}
            preserveAspectRatio="xMidYMin meet"
            className="room-svg"
            role="img"
            aria-label={room.name}
          >
            <defs>
              <radialGradient id="lamp-glow">
                <stop offset="0%" stopColor="#fff0c0" stopOpacity={0.92} />
                <stop offset="55%" stopColor="#ffd98a" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#ffd98a" stopOpacity={0} />
              </radialGradient>
            </defs>

            <rect x={0} y={0} width={ROOM_W} height={WALL_BOTTOM} fill={room.wall} />
            <rect x={0} y={WALL_BOTTOM} width={ROOM_W} height={ROOM_H - WALL_BOTTOM} fill={room.floor} />
            <rect x={0} y={WALL_BOTTOM - 8} width={ROOM_W} height={10} fill={room.wallTrim} />
            {room.outdoor
              ? // Paving rather than boards, so the market reads as outside.
                [0, 1, 2, 3].map((i) => (
                  <path
                    key={i}
                    d={"M0," + (WALL_BOTTOM + 14 + i * 28) + " h" + ROOM_W}
                    stroke={room.floorBoards}
                    strokeWidth={2.5}
                    opacity={0.6}
                  />
                ))
              : [70, 150, 230, 310].map((x) => (
                  <path
                    key={x}
                    d={"M" + x + "," + (WALL_BOTTOM + 2) + " L" + (x - 34) + "," + ROOM_H}
                    stroke={room.floorBoards}
                    strokeWidth={2.5}
                    opacity={0.7}
                  />
                ))}

            {/* Wall fittings, so every room has something on it even with nothing placed. */}
            <RoomFittings room={room} time={timeOfDay} />

            {roomState.items.map((item) => (
              <Piece
                key={item.id}
                item={item}
                dragging={draggingKey === item.id}
                popped={item.id === "balloons" && poppedAt !== null}
                onGrab={grabPiece}
                onGrabThing={grabThing}
              />
            ))}

            {look && (
              <Character
                look={look}
                uid={"room-" + roomId}
                x={roomState.avatarX}
                y={roomState.avatarY}
                pose={roomState.avatarPose}
                chewing={chewing}
                dragging={draggingKey === "avatar"}
                onGrab={grabAvatar}
              />
            )}

            {/* Where the thing on the end of her finger can be let go. */}
            {held &&
              roomState.items
                .filter((i) => i.open && CONTAINER_DROP[i.id])
                .map((item) => {
                  const box = CONTAINER_DROP[item.id];
                  return (
                    <rect
                      key={item.id}
                      className={"drop-zone" + (held.over === item.id ? " is-over" : "")}
                      x={box.x + item.dx}
                      y={FURNITURE_DROP + box.y + item.dy}
                      width={box.w}
                      height={box.h}
                      rx={8}
                      pointerEvents="none"
                    />
                  );
                })}

            {/* Nightfall goes over the whole scene, and the lamps then punch back through it. */}
            {tint.opacity > 0 && (
              <rect
                x={0}
                y={0}
                width={ROOM_W}
                height={ROOM_H}
                fill={tint.colour}
                opacity={tint.opacity}
                pointerEvents="none"
              />
            )}
            {lit.length > 0 && (
              <g style={{ mixBlendMode: "screen" }} pointerEvents="none">
                {lit.map((item) => {
                  const glow = LIGHT_GLOW[item.id];
                  return (
                    <ellipse
                      key={item.id}
                      cx={glow.cx + item.dx}
                      cy={FURNITURE_DROP + glow.cy + item.dy}
                      rx={glow.rx}
                      ry={glow.ry}
                      fill="url(#lamp-glow)"
                    />
                  );
                })}
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

        {/* Only while something is being dragged, so it never sits in the way of the room. */}
        {draggingKey !== null && draggingKey !== "avatar" && (
          <div ref={binRef} className={"bin" + (overBin ? " is-over" : "")} aria-hidden="true">
            <span className="bin-icon">🗑️</span>
            <span className="bin-label">Drop to remove</span>
          </div>
        )}

        {reaction && <div className="reaction">{reaction}</div>}

        {held && (
          <div className="held-thing" style={{ left: held.x, top: held.y }} aria-hidden="true">
            <ThingArt id={held.thingId} />
          </div>
        )}

        {basket.length > 0 && tray === null && (
          <div className="basket">
            <span className="basket-icon" aria-hidden="true">🧺</span>
            <div className="basket-items">
              {basket.map((thingId, i) => (
                <button
                  key={thingId + "-" + i}
                  className={"basket-item" + (held?.index === i ? " is-held" : "")}
                  aria-label={THINGS[thingId]?.name ?? thingId}
                  // Pointer down rather than click: the same press has to be able to become a
                  // drag into a cupboard, and a click firing as well would act twice.
                  onPointerDown={(e) => startThingDrag(e, { kind: "basket", index: i }, thingId)}
                >
                  <ThingArt id={thingId} />
                </button>
              ))}
            </div>
          </div>
        )}

      {tray && trayItem && (
          <div className="tray">
            <div className="tray-head">
              <strong>{trayTitle(tray)}</strong>
              <button
                className="sheet-close"
                aria-label="Close"
                onClick={() => {
                  closeTray();
                  playTap();
                }}
              >
                ✕
              </button>
            </div>

            {tray.kind === "stall" && (
              <div className="tray-row">
                {(STALL_STOCK[tray.id] ?? []).map((thingId) => (
                  <button
                    key={thingId}
                    className="tray-item"
                    disabled={basket.length >= BASKET_LIMIT}
                    onClick={() => {
                      onBuy(thingId);
                      playCoin();
                    }}
                  >
                    <ThingArt id={thingId} />
                    <span className="tray-name">{THINGS[thingId].name}</span>
                  </button>
                ))}
              </div>
            )}

            {tray.kind === "cooker" && (
              <>
                <p className="tray-hint">Pick two things from your basket and cook them.</p>
                <div className="tray-row">
                  {[0, 1].map((slot) => {
                    const thingId = pot[slot] !== undefined ? basket[pot[slot]] : undefined;
                    return thingId ? (
                      <button
                        key={slot}
                        className="tray-item"
                        onClick={() => {
                          setPot((p) => p.filter((_, n) => n !== slot));
                          playPop();
                        }}
                      >
                        <ThingArt id={thingId} />
                        <span className="tray-name">{THINGS[thingId].name}</span>
                      </button>
                    ) : (
                      <span key={slot} className="tray-slot" />
                    );
                  })}
                  <button className="tray-cook" disabled={pot.length < 2} onClick={cook}>
                    🍳 Cook!
                  </button>
                </div>
              </>
            )}

            <div className="tray-basket">
              <span className="tray-label">🧺 Your basket</span>
              <div className="tray-row">
                {basket.length === 0 && <span className="tray-empty">Nothing yet — try the market.</span>}
                {basket.map((thingId, i) => (
                  <button
                    key={thingId + "-" + i}
                    className={"tray-item" + (pot.includes(i) ? " is-in-pot" : "")}
                    onClick={() => tapBasket(i)}
                  >
                    <ThingArt id={thingId} />
                    <span className="tray-name">{THINGS[thingId]?.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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

      {padId && padItem && (
        <DrawingPad
          strokes={padItem.strokes}
          onChange={(strokes) => onUpdateFurniture(padId, { strokes })}
          onClose={() => {
            setPadId(null);
            playTap();
          }}
        />
      )}

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
                                {renderFurniture(f.id, CATALOGUE_CTX)}
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

function trayTitle(tray: Tray): string {
  return tray.kind === "stall" ? "What would you like?" : "What shall we cook?";
}

/* ---------------- the drawing pad ---------------- */

const PAD_COLOURS = [
  "#ff4d5e", "#ff9040", "#ffd23f", "#5ed64a", "#2ed6b8",
  "#3aa0ff", "#7b5cf6", "#ff6fae", "#8d6e5c", "#2b2b3a",
];

const PAD_WIDTHS = [3, 6, 11];

/**
 * A full-size pad rather than drawing straight onto the frame in the room: the frame is barely
 * a thumbnail on a phone, and a small child needs room to move.
 *
 * Strokes are handed back up after every line rather than on close, so a drawing survives the
 * tab being shut mid-scribble.
 */
function DrawingPad({
  strokes,
  onChange,
  onClose,
}: {
  strokes: Stroke[];
  onChange: (next: Stroke[]) => void;
  onClose: () => void;
}): ReactElement {
  const [colour, setColour] = useState(PAD_COLOURS[0]);
  const [width, setWidth] = useState(PAD_WIDTHS[1]);
  const [live, setLive] = useState<Stroke | null>(null);
  const drawingRef = useRef(false);

  /** Client pixels to pad coordinates. The pad keeps PAD's aspect, so this is a plain scale. */
  function at(e: ReactPointerEvent<SVGSVGElement>): [number, number] {
    const rect = e.currentTarget.getBoundingClientRect();
    return [
      clamp(((e.clientX - rect.left) / rect.width) * PAD.w, 0, PAD.w),
      clamp(((e.clientY - rect.top) / rect.height) * PAD.h, 0, PAD.h),
    ];
  }

  function start(e: ReactPointerEvent<SVGSVGElement>) {
    const [x, y] = at(e);
    drawingRef.current = true;
    setLive({ colour, width, points: [round(x), round(y)] });
  }

  function extend(e: ReactPointerEvent<SVGSVGElement>) {
    if (!drawingRef.current) return;
    const [x, y] = at(e);
    setLive((s) => {
      if (!s) return s;
      const lastX = s.points[s.points.length - 2];
      const lastY = s.points[s.points.length - 1];
      // Skip points the finger barely moved to: they add nothing and bloat the save.
      if (Math.hypot(x - lastX, y - lastY) < 1.4) return s;
      return { ...s, points: [...s.points, round(x), round(y)] };
    });
  }

  function finish() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    // Handing the finished stroke up has to happen out here, not inside a setLive updater:
    // an updater runs during render, and calling onChange from there updates App while this
    // component is still rendering.
    if (live) {
      // A tap with no movement still leaves a dot, which is what a child expects.
      const dot =
        live.points.length === 2
          ? { ...live, points: [...live.points, live.points[0], live.points[1]] }
          : live;
      onChange([...strokes, dot]);
    }
    setLive(null);
  }

  const shown = live ? [...strokes, live] : strokes;

  return (
    <div className="sheet-backdrop pad-backdrop">
      <div className="sheet pad-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <strong>Draw a picture</strong>
          <button className="sheet-close" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>

        <svg
          viewBox={"0 0 " + PAD.w + " " + PAD.h}
          className="pad"
          onPointerDown={start}
          onPointerMove={extend}
          onPointerUp={finish}
          onPointerLeave={finish}
          onPointerCancel={finish}
        >
          <rect x={0} y={0} width={PAD.w} height={PAD.h} fill="#fffdfa" />
          {shown.map((s, i) => (
            <polyline
              key={i}
              points={s.points.join(" ")}
              fill="none"
              stroke={s.colour}
              strokeWidth={s.width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>

        <div className="pad-tools">
          <div className="swatches pad-swatches">
            {PAD_COLOURS.map((hex) => (
              <button
                key={hex}
                aria-label={"Colour " + hex}
                className={"swatch" + (colour === hex ? " is-active" : "")}
                style={{ background: hex }}
                onClick={() => {
                  setColour(hex);
                  playTap();
                }}
              />
            ))}
          </div>
          <div className="pad-row">
            <div className="pad-widths">
              {PAD_WIDTHS.map((w) => (
                <button
                  key={w}
                  aria-label={"Brush size " + w}
                  className={"pad-width" + (width === w ? " is-active" : "")}
                  onClick={() => {
                    setWidth(w);
                    playTap();
                  }}
                >
                  <span style={{ width: w * 2.2, height: w * 2.2, background: colour }} />
                </button>
              ))}
            </div>
            <button
              className="btn-secondary pad-clear"
              onClick={() => {
                onChange([]);
                playWhoosh();
              }}
            >
              🧽 Clear
            </button>
            <button className="btn-primary pad-done" onClick={onClose}>
              Done ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
