import { useEffect, useState, type ReactElement } from "react";
import { shade } from "./bodyGeometry";
import { BLUSH_STYLES, EYE_STYLES, MOUTH_STYLES, NOSE_STYLES } from "./faceParts";
import type { AvatarLook } from "../data/wardrobe";

/*
 * A baby is drawn in the same 200x430 box a grown character is, sitting on the floor at the
 * same line their feet stand on — so the room can position one with exactly the transform it
 * already uses for everybody else, and a baby put down next to a character stands on the
 * same ground rather than floating over it.
 *
 * It is a fresh drawing rather than the adult shrunk. A baby is not a small adult: the head
 * is nearly half of it, there is no neck to speak of, and the legs are tucked underneath.
 * Only the face is shared, scaled onto the bigger head, so the eyes, nose and mouth she picks
 * are the same ones she knows from dressing everybody else.
 */

/**
 * The baby's head, in the shared canvas. The face below is mapped onto it — and the room
 * needs it too, to know where to aim a bottle.
 */
export const BABY_HEAD = { cx: 100, cy: 296, r: 47 };
const HEAD = BABY_HEAD;

/** Where the adult face is authored, so it can be moved and scaled onto the head above. */
const FACE_FROM = { cx: 100, cy: 88, r: 54 };

const FACE_SCALE = HEAD.r / FACE_FROM.r;

/**
 * What a baby wears. Its own list rather than the grown-up one — nobody puts a baby in a
 * suit jacket, and the shapes are different anyway: one piece with poppers, or a romper
 * with the arms and legs out.
 *
 * Each returns the body and legs together, because on a baby they are one garment as often
 * as not, and the legs have to know whether they are covered.
 */
export interface BabySuit {
  body: (colour: string, skin: string) => ReactElement;
  /** Bare arms and legs, for the ones that don't reach. */
  bareArms?: boolean;
  bareLegs?: boolean;
}

function legs(colour: string, toes: string): ReactElement {
  return (
    <g>
      <ellipse cx={78} cy={374} rx={19} ry={12} fill={colour} />
      <ellipse cx={122} cy={374} rx={19} ry={12} fill={colour} />
      <ellipse cx={64} cy={376} rx={9} ry={7} fill={toes} />
      <ellipse cx={136} cy={376} rx={9} ry={7} fill={toes} />
    </g>
  );
}

const TUMMY = "M68,344 q32,-12 64,0 l6,26 q-38,12 -76,0 z";

export const BABY_SUITS: Record<string, BabySuit> = {
  babygro: {
    body: (c) => (
      <g>
        {legs(c, shade(c, -28))}
        <path d={TUMMY} fill={c} />
        <path d="M72,352 q28,8 56,0" stroke={shade(c, -22)} strokeWidth={2.4} fill="none" />
        {/* Poppers along the bottom, which is the detail that says babygro. */}
        {[84, 100, 116].map((x) => (
          <circle key={x} cx={x} cy={368} r={2.4} fill={shade(c, 40)} />
        ))}
      </g>
    ),
  },

  romper: {
    bareArms: true,
    bareLegs: true,
    body: (c, skin) => (
      <g>
        {legs(skin, shade(skin, -24))}
        <path d={TUMMY} fill={c} />
        {/* Short legs cut off above the knee, so the bare ones below read as bare. */}
        <path d="M70,360 q30,10 60,0 l3,10 q-33,10 -66,0 z" fill={shade(c, -16)} />
      </g>
    ),
  },

  sleepsuit: {
    body: (c) => (
      <g>
        {legs(c, shade(c, 30))}
        <path d={TUMMY} fill={c} />
        {/* Stars, because a sleepsuit with nothing on it is just a plain babygro. */}
        {([[84, 352], [104, 358], [118, 348]] as Array<[number, number]>).map(([x, y]) => (
          <path
            key={x}
            d={"M" + x + "," + (y - 4) + " l1.4,3 l3.2,0.3 l-2.4,2.2 l0.8,3.1 l-3,-1.7 l-3,1.7 l0.8,-3.1 l-2.4,-2.2 l3.2,-0.3 z"}
            fill={shade(c, 52)}
          />
        ))}
      </g>
    ),
  },

  dungarees: {
    bareArms: true,
    body: (c, skin) => (
      <g>
        {legs(c, shade(skin, -24))}
        <path d={TUMMY} fill="#fffdfa" />
        <path d="M74,352 q26,10 52,0 l5,18 q-31,10 -62,0 z" fill={c} />
        <path d="M84,340 l4,14 M116,340 l-4,14" stroke={c} strokeWidth={6} strokeLinecap="round" />
        <circle cx={88} cy={354} r={2.6} fill={shade(c, 44)} />
        <circle cx={112} cy={354} r={2.6} fill={shade(c, 44)} />
      </g>
    ),
  },

  sunDress: {
    bareArms: true,
    bareLegs: true,
    body: (c, skin) => (
      <g>
        {legs(skin, shade(skin, -24))}
        <path d="M70,342 q30,-10 60,0 l10,30 q-40,12 -80,0 z" fill={c} />
        <path d="M74,356 q26,8 52,0" stroke={shade(c, 30)} strokeWidth={2.6} fill="none" />
      </g>
    ),
  },
};

/** Fidgets a baby does, and how long each runs. */
const IDLES: Record<string, number> = {
  kick: 1800,
  reach: 2000,
  wobble: 2400,
  look: 2600,
  yawn: 2200,
};

const NAMES = Object.keys(IDLES);
const GAP_MIN = 2600;
const GAP_SPREAD = 4200;

function useBabyIdle(active: boolean, held: boolean): string | null {
  const [idle, setIdle] = useState<string | null>(null);

  useEffect(() => {
    // Being carried is its own animation, and a baby kicking its legs in mid-air while
    // someone rocks it looks like a struggle rather than a cuddle.
    if (!active || held) {
      setIdle(null);
      return;
    }
    let timer = 0;
    const schedule = (delay: number) => {
      timer = window.setTimeout(() => {
        const pick = NAMES[Math.floor(Math.random() * NAMES.length)];
        setIdle(pick);
        timer = window.setTimeout(() => {
          setIdle(null);
          schedule(GAP_MIN + Math.random() * GAP_SPREAD);
        }, IDLES[pick]);
      }, delay);
    };
    schedule(Math.random() * GAP_SPREAD);
    return () => clearTimeout(timer);
  }, [active, held]);

  return idle;
}

/** Full-canvas and unpainted, so a fidget's pivot doesn't move with the baby's own outline. */
function pin(): ReactElement {
  return <rect x={0} y={0} width={200} height={430} fill="none" />;
}

export function BabyLayers({
  look,
  animate = true,
  held = false,
  crying = false,
}: {
  look: AvatarLook;
  animate?: boolean;
  /** In somebody's arms: it lies still and is rocked by whoever is holding it. */
  held?: boolean;
  /** Wants something. Squeezed eyes, an open mouth and tears, and no fidgeting. */
  crying?: boolean;
}): ReactElement {
  const idle = useBabyIdle(animate, held || crying);
  const suit = look.topColour;
  // An outfit picked for a grown-up means nothing here, so anything unrecognised is a
  // babygro rather than nothing at all.
  const worn = (look.topId && BABY_SUITS[look.topId]) || BABY_SUITS.babygro;
  const eyes = EYE_STYLES[look.eyesId] ?? EYE_STYLES.round;
  const mouth = MOUTH_STYLES[look.mouthId] ?? MOUTH_STYLES.smile;

  return (
    <g className={crying ? "bb-crying" : idle ? "bb-idle bb-idle-" + idle : undefined}>
      {crying && pin()}
      {idle && pin()}

      {/* Legs and body together: on a baby they are one garment as often as not. */}
      <g className="bb-legs">
        {pin()}
        {worn.body(suit, look.skin)}
      </g>

      {/* Arms, stubby and out to the sides. */}
      <g className="bb-arm-l">
        {pin()}
        <ellipse
          cx={58}
          cy={348}
          rx={10}
          ry={13}
          fill={worn.bareArms ? look.skin : suit}
          transform="rotate(-24 58 348)"
        />
        <circle cx={51} cy={359} r={8} fill={look.skin} />
      </g>
      <g className="bb-arm-r">
        {pin()}
        <ellipse
          cx={142}
          cy={348}
          rx={10}
          ry={13}
          fill={worn.bareArms ? look.skin : suit}
          transform="rotate(24 142 348)"
        />
        <circle cx={149} cy={359} r={8} fill={look.skin} />
      </g>

      {/* Head. Big on purpose — it is most of what says "baby" before anything else does. */}
      <g className="bb-head">
        {pin()}
        <circle cx={HEAD.cx} cy={HEAD.cy} r={HEAD.r} fill={look.skin} />
        <ellipse cx={58} cy={HEAD.cy + 6} rx={7} ry={9} fill={look.skin} />
        <ellipse cx={142} cy={HEAD.cy + 6} rx={7} ry={9} fill={look.skin} />

        {/* One curl. A whole hairstyle on a head this size reads as a wig. */}
        <path
          d={"M" + (HEAD.cx - 4) + "," + (HEAD.cy - HEAD.r + 4) + " q-6,-16 10,-13 q-10,3 -4,13 z"}
          fill={look.hairColour}
        />

        <g
          transform={
            "translate(" + HEAD.cx + " " + HEAD.cy + ") scale(" + FACE_SCALE.toFixed(3) + ") " +
            "translate(" + -FACE_FROM.cx + " " + -FACE_FROM.cy + ")"
          }
        >
          {look.blushId && BLUSH_STYLES[look.blushId] && BLUSH_STYLES[look.blushId]({ colour: look.blushColour })}
          {crying ? (
            /* Its own face while it is upset. Whatever eyes and mouth she chose are still
               its face; they simply aren't what a crying baby's look like. */
            <g>
              <path
                d="M67,90 q11,-9 22,0 M111,90 q11,-9 22,0"
                stroke="#3c3350"
                strokeWidth={4.6}
                strokeLinecap="round"
                fill="none"
              />
              <ellipse cx={100} cy={120} rx={13} ry={15} fill="#8f2d46" />
              <ellipse cx={100} cy={128} rx={7} ry={5} fill="#ff7d9c" />
              <g className="bb-tear">
                <path d="M74,98 q5,9 0,13 q-5,-4 0,-13 z" fill="#7fd4ff" />
                <path d="M126,98 q5,9 0,13 q-5,-4 0,-13 z" fill="#7fd4ff" />
              </g>
            </g>
          ) : (
            <g>
              <g className={animate ? "av-blink" : undefined}>
                {eyes({ iris: look.irisColour, skin: look.skin })}
              </g>
              {look.noseId && NOSE_STYLES[look.noseId] &&
                NOSE_STYLES[look.noseId]({ iris: look.irisColour, skin: look.skin })}
              {mouth()}
            </g>
          )}
        </g>
      </g>
    </g>
  );
}
