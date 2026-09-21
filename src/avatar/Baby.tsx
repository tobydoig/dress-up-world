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

/** The baby's head, in the shared canvas. The face below is mapped onto it. */
const HEAD = { cx: 100, cy: 296, r: 47 };

/** Where the adult face is authored, so it can be moved and scaled onto the head above. */
const FACE_FROM = { cx: 100, cy: 88, r: 54 };

const FACE_SCALE = HEAD.r / FACE_FROM.r;

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
}: {
  look: AvatarLook;
  animate?: boolean;
  /** In somebody's arms: it lies still and is rocked by whoever is holding it. */
  held?: boolean;
}): ReactElement {
  const idle = useBabyIdle(animate, held);
  const suit = look.topColour;
  const eyes = EYE_STYLES[look.eyesId] ?? EYE_STYLES.round;
  const mouth = MOUTH_STYLES[look.mouthId] ?? MOUTH_STYLES.smile;

  return (
    <g className={idle ? "bb-idle bb-idle-" + idle : undefined}>
      {idle && pin()}

      {/* Legs, tucked out in front the way a sitting baby's are. */}
      <g className="bb-legs">
        {pin()}
        <ellipse cx={78} cy={374} rx={19} ry={12} fill={suit} />
        <ellipse cx={122} cy={374} rx={19} ry={12} fill={suit} />
        <ellipse cx={64} cy={376} rx={9} ry={7} fill={shade(suit, -28)} />
        <ellipse cx={136} cy={376} rx={9} ry={7} fill={shade(suit, -28)} />
      </g>

      {/* Body: one rounded babygro, because a baby has no waist to speak of. */}
      <path d="M68,344 q32,-12 64,0 l6,26 q-38,12 -76,0 z" fill={suit} />
      <path d="M72,352 q28,8 56,0" stroke={shade(suit, -22)} strokeWidth={2.4} fill="none" />

      {/* Arms, stubby and out to the sides. */}
      <g className="bb-arm-l">
        {pin()}
        <ellipse cx={58} cy={348} rx={10} ry={13} fill={suit} transform="rotate(-24 58 348)" />
        <circle cx={51} cy={359} r={8} fill={look.skin} />
      </g>
      <g className="bb-arm-r">
        {pin()}
        <ellipse cx={142} cy={348} rx={10} ry={13} fill={suit} transform="rotate(24 142 348)" />
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
          <g className={animate ? "av-blink" : undefined}>
            {eyes({ iris: look.irisColour, skin: look.skin })}
          </g>
          {look.noseId && NOSE_STYLES[look.noseId] &&
            NOSE_STYLES[look.noseId]({ iris: look.irisColour, skin: look.skin })}
          {mouth()}
        </g>
      </g>
    </g>
  );
}
