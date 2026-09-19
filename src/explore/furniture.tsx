import type { ReactElement } from "react";

/**
 * Furniture is drawn in room coordinates (viewBox 0 0 400 340; back wall down to y=232, floor
 * below that). Each piece is positioned where it looks right rather than being draggable —
 * on a phone, tapping a piece to place it beats fighting a drag gesture, and the room always
 * ends up looking deliberate.
 */
export type FurnitureRender = () => ReactElement;

const WOOD = "#b5763f";
const WOOD_DARK = "#8d5a2c";

export const FURNITURE: Record<string, FurnitureRender> = {
  // ---------------- play room ----------------
  toyBox: () => (
    <g>
      <rect x={20} y={186} width={78} height={46} rx={7} fill="#ff7aa8" />
      <rect x={16} y={176} width={86} height={16} rx={7} fill="#ff4d7e" />
      <circle cx={59} cy={210} r={7} fill="#ffd23f" />
      <path d="M34,200 h12 M72,200 h12" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
    </g>
  ),

  blocks: () => (
    <g>
      <rect x={116} y={210} width={22} height={22} rx={4} fill="#ff4d5e" />
      <rect x={140} y={210} width={22} height={22} rx={4} fill="#3aa0ff" />
      <rect x={128} y={188} width={22} height={22} rx={4} fill="#ffd23f" />
      <rect x={152} y={188} width={22} height={22} rx={4} fill="#5ed64a" />
      <rect x={140} y={166} width={22} height={22} rx={4} fill="#c77dff" />
    </g>
  ),

  teddy: () => (
    <g>
      <circle cx={318} cy={200} r={11} fill="#c98a5b" />
      <circle cx={309} cy={189} r={5.5} fill="#c98a5b" />
      <circle cx={327} cy={189} r={5.5} fill="#c98a5b" />
      <ellipse cx={318} cy={222} rx={15} ry={13} fill="#b5763f" />
      <ellipse cx={318} cy={224} rx={8} ry={7} fill="#e8c9a8" />
      <circle cx={314} cy={199} r={1.8} fill="#2b2b3a" />
      <circle cx={322} cy={199} r={1.8} fill="#2b2b3a" />
      <ellipse cx={318} cy={205} rx={3.4} ry={2.4} fill="#8d5a2c" />
    </g>
  ),

  easel: () => (
    <g>
      <path d="M244,232 L258,150 M300,232 L286,150" stroke={WOOD} strokeWidth={6} strokeLinecap="round" />
      <rect x={244} y={136} width={56} height={48} rx={4} fill="#fffdfa" stroke={WOOD_DARK} strokeWidth={3} />
      <path d="M254,172 q10,-22 20,-6 q8,-14 16,6 z" fill="#5ed64a" />
      <circle cx={264} cy={150} r={6} fill="#ffd23f" />
      <rect x={240} y={182} width={64} height={7} rx={3.5} fill={WOOD_DARK} />
    </g>
  ),

  balloons: () => (
    <g>
      <path d="M356,150 q6,30 -2,54 M374,146 q-4,32 2,58" stroke="#ffffff" strokeWidth={2} opacity={0.6} fill="none" />
      <ellipse cx={356} cy={136} rx={16} ry={19} fill="#ff4d7e" />
      <ellipse cx={378} cy={128} rx={14} ry={17} fill="#3aa0ff" />
      <ellipse cx={351} cy={130} rx={5} ry={6} fill="#ffffff" opacity={0.45} />
      <ellipse cx={373} cy={123} rx={4} ry={5} fill="#ffffff" opacity={0.45} />
    </g>
  ),

  playRug: () => (
    <g>
      <ellipse cx={200} cy={300} rx={120} ry={34} fill="#7b5cf6" opacity={0.85} />
      <ellipse cx={200} cy={300} rx={86} ry={24} fill="#9b7bff" />
      <ellipse cx={200} cy={300} rx={50} ry={14} fill="#c77dff" />
    </g>
  ),

  // ---------------- kitchen ----------------
  counter: () => (
    <g>
      <rect x={14} y={168} width={122} height={64} rx={6} fill="#e8e3f2" />
      <rect x={10} y={160} width={130} height={14} rx={7} fill="#b9b2cf" />
      <rect x={30} y={186} width={40} height={36} rx={4} fill="#cfc8e0" />
      <rect x={80} y={186} width={40} height={36} rx={4} fill="#cfc8e0" />
      <circle cx={64} cy={204} r={3} fill="#8b84a8" />
      <circle cx={86} cy={204} r={3} fill="#8b84a8" />
    </g>
  ),

  fridge: () => (
    <g>
      <rect x={330} y={116} width={58} height={116} rx={8} fill="#dfe6f0" />
      <rect x={330} y={116} width={58} height={40} rx={8} fill="#eef2f8" />
      <path d="M330,158 h58" stroke="#b9c2d0" strokeWidth={3} />
      <rect x={378} y={128} width={5} height={20} rx={2.5} fill="#98a3b5" />
      <rect x={378} y={168} width={5} height={26} rx={2.5} fill="#98a3b5" />
      <rect x={340} y={126} width={16} height={12} rx={2} fill="#ffd23f" />
      <circle cx={350} cy={180} r={7} fill="#ff6fae" />
    </g>
  ),

  diningTable: () => (
    <g>
      <rect x={150} y={198} width={116} height={11} rx={5.5} fill={WOOD} />
      <rect x={160} y={209} width={9} height={40} rx={4} fill={WOOD_DARK} />
      <rect x={247} y={209} width={9} height={40} rx={4} fill={WOOD_DARK} />
      <rect x={180} y={186} width={26} height={12} rx={3} fill="#3aa0ff" />
      <circle cx={232} cy={190} r={9} fill="#fffdfa" />
      <circle cx={232} cy={190} r={5} fill="#ff9040" />
    </g>
  ),

  chairs: () => (
    <g>
      <rect x={132} y={186} width={9} height={52} rx={4} fill="#2ed6b8" />
      <rect x={122} y={200} width={28} height={9} rx={4} fill="#2ed6b8" />
      <rect x={274} y={186} width={9} height={52} rx={4} fill="#ff9040" />
      <rect x={266} y={200} width={28} height={9} rx={4} fill="#ff9040" />
    </g>
  ),

  fruitBowl: () => (
    <g>
      <path d="M182,186 q22,16 44,0 z" fill="#c77dff" />
      <circle cx={196} cy={180} r={7} fill="#ff4d5e" />
      <circle cx={210} cy={177} r={7} fill="#ffd23f" />
      <circle cx={222} cy={181} r={6} fill="#5ed64a" />
    </g>
  ),

  kitchenPlant: () => (
    <g>
      <path d="M296,232 l5,-26 h20 l5,26 z" fill="#d98452" />
      <path
        d="M311,206 q-22,-6 -20,-30 q20,2 20,30 M311,206 q22,-8 22,-30 q-22,4 -22,30 M311,206 q-2,-24 0,-34 q4,12 2,34"
        fill="#3fae5a"
      />
    </g>
  ),

  // ---------------- bedroom ----------------
  bed: () => (
    <g>
      <rect x={196} y={182} width={180} height={12} rx={6} fill={WOOD_DARK} />
      <rect x={196} y={140} width={16} height={54} rx={6} fill={WOOD} />
      <rect x={360} y={152} width={16} height={42} rx={6} fill={WOOD} />
      <rect x={206} y={194} width={164} height={34} rx={8} fill="#ff8fc0" />
      <rect x={206} y={190} width={62} height={22} rx={9} fill="#fffdfa" />
      <path d="M268,196 h102" stroke="#ff5fa8" strokeWidth={5} strokeLinecap="round" />
      <rect x={214} y={228} width={8} height={16} rx={4} fill={WOOD_DARK} />
      <rect x={354} y={228} width={8} height={16} rx={4} fill={WOOD_DARK} />
    </g>
  ),

  wardrobe: () => (
    <g>
      <rect x={22} y={108} width={92} height={124} rx={7} fill={WOOD} />
      <rect x={30} y={118} width={36} height={104} rx={4} fill={WOOD_DARK} />
      <rect x={70} y={118} width={36} height={104} rx={4} fill={WOOD_DARK} />
      <circle cx={62} cy={170} r={3.4} fill="#ffd23f" />
      <circle cx={74} cy={170} r={3.4} fill="#ffd23f" />
    </g>
  ),

  bedsideLamp: () => (
    <g>
      <rect x={140} y={196} width={40} height={36} rx={5} fill={WOOD} />
      <rect x={148} y={206} width={24} height={9} rx={3} fill={WOOD_DARK} />
      <rect x={157} y={168} width={6} height={28} rx={3} fill="#8b84a8" />
      <path d="M144,168 l8,-22 h16 l8,22 z" fill="#ffd23f" />
      <ellipse cx={160} cy={172} rx={26} ry={9} fill="#ffe89a" opacity={0.35} />
    </g>
  ),

  poster: () => (
    <g>
      <rect x={236} y={60} width={62} height={56} rx={5} fill="#fffdfa" />
      <rect x={241} y={65} width={52} height={46} rx={3} fill="#7b5cf6" />
      <path
        transform="translate(267 88) scale(1.5)"
        d="M0,-9 L2.6,-2.8 9.2,-2.2 4.2,2.1 5.7,8.6 0,5.2 -5.7,8.6 -4.2,2.1 -9.2,-2.2 -2.6,-2.8 Z"
        fill="#ffd23f"
      />
    </g>
  ),

  plushie: () => (
    <g>
      <ellipse cx={300} cy={182} rx={13} ry={11} fill="#ffd23f" />
      <circle cx={300} cy={166} r={10} fill="#ffd23f" />
      <circle cx={292} cy={158} r={4.5} fill="#ffd23f" />
      <circle cx={308} cy={158} r={4.5} fill="#ffd23f" />
      <circle cx={297} cy={165} r={1.7} fill="#2b2b3a" />
      <circle cx={303} cy={165} r={1.7} fill="#2b2b3a" />
      <path d="M297,170 q3,3 6,0" stroke="#8d5a2c" strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </g>
  ),

  bedroomRug: () => (
    <g>
      <ellipse cx={170} cy={296} rx={104} ry={30} fill="#2ed6b8" opacity={0.8} />
      <ellipse cx={170} cy={296} rx={70} ry={20} fill="#66e6cf" />
    </g>
  ),
};
