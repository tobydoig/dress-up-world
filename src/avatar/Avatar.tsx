import { useEffect, useState, type ReactElement } from "react";
import {
  ARM,
  EAR,
  HEAD,
  LEG,
  MOUTH,
  NECK,
  TORSO,
  VIEWBOX,
  legSegments,
  shade,
  type Pose,
} from "./bodyGeometry";
import { BLUSH_STYLES, EYE_STYLES, MOUTH_STYLES, NOSE_STYLES } from "./faceParts";
import { HAIR_STYLES } from "./hairParts";
import { BOTTOM_STYLES, COVERS_LEGS, MOTIF_STYLES, SHOE_STYLES, TOP_STYLES } from "./clothingParts";
import { GLASSES_STYLES, HEAD_STYLES, JEWEL_STYLES } from "./accessoryParts";
import type { AvatarLook } from "../data/wardrobe";

/**
 * The character as a bare <g>, so it can be dropped into any SVG scene — the design stage or
 * a room in explore mode — without nesting one <svg> inside another.
 *
 * Layer order is the whole trick: hair-back, body, clothes, head, face, hair-front, then
 * accessories on top — so long hair falls behind the shoulders, a hood tucks in behind the
 * head, and a hairband sits on the hair rather than under it.
 *
 * Each slot gets a `key` built from its own state, so swapping one garment remounts just that
 * group and replays the pop animation on it rather than on the whole character.
 */
/**
 * Standing, sitting on something, or lying down. Sitting bends the legs at the knee; lying is
 * the standing figure turned on its side, which reads perfectly well at this cartoon scale and
 * avoids a second set of artwork for every garment.
 */
export type { Pose };

/**
 * The little things a character does when left alone, and how long each one runs for. They
 * fire one at a time with a gap in between rather than looping: something that fidgets
 * constantly reads as broken, something that fidgets now and then reads as alive.
 */
const IDLES: Record<string, number> = {
  look: 3000,
  shift: 4000,
  shuffle: 2400,
  wring: 2600,
  scratch: 2000,
  hair: 1700,
  nose: 1900,
  wave: 1900,
  bounce: 1500,
  dance: 3000,
  stretch: 2100,
};

/**
 * Weighted by repetition rather than by probabilities, because a list is easier to read than
 * a table of numbers. The quiet ones fill most of it: someone standing about mostly shifts
 * their weight and looks around, and only occasionally breaks into a dance.
 */
const STANDING = [
  "look", "look", "look",
  "shift", "shift", "shift",
  "shuffle", "shuffle",
  "wring", "wring",
  "scratch", "hair", "nose", "wave",
  "bounce", "dance", "stretch",
];

/** Sitting down rules out everything that needs feet on the floor. */
const SEATED = ["look", "look", "wring", "wring", "scratch", "nose", "wave"];

const GAP_MIN = 4000;
const GAP_SPREAD = 6000;

/**
 * Picks a fidget, plays it, waits, picks another. Lying down gets none at all — they are
 * having a rest.
 */
function useIdle(active: boolean, pose: Pose): string | null {
  const [idle, setIdle] = useState<string | null>(null);

  useEffect(() => {
    if (!active || pose === "lie") {
      setIdle(null);
      return;
    }
    const choices = pose === "sit" ? SEATED : STANDING;
    let timer = 0;

    const schedule = (delay: number) => {
      timer = window.setTimeout(() => {
        const pick = choices[Math.floor(Math.random() * choices.length)];
        setIdle(pick);
        timer = window.setTimeout(() => {
          setIdle(null);
          schedule(GAP_MIN + Math.random() * GAP_SPREAD);
        }, IDLES[pick]);
      }, delay);
    };

    // The first wait is random so that two characters sharing a room don't fidget in lockstep.
    schedule(Math.random() * GAP_SPREAD);
    return () => clearTimeout(timer);
  }, [active, pose]);

  return idle;
}

/**
 * An invisible rect covering the whole canvas.
 *
 * A CSS transform on an SVG group pivots around that group's own bounding box, which moves
 * about as hats and hairstyles change size — a head would tilt around a different point
 * depending on whether it was wearing a crown. Pinning the box to the full canvas makes a
 * percentage transform-origin mean the same place in avatar coordinates whatever is worn.
 */
function pin(): ReactElement {
  return <rect x={0} y={0} width={200} height={430} fill="none" />;
}

export function AvatarLayers({
  look,
  uid = "main",
  animate = true,
  pose = "stand",
  chewing = false,
  mouthOpen = false,
  carrying = false,
  carried,
}: {
  look: AvatarLook;
  uid?: string;
  animate?: boolean;
  pose?: Pose;
  /** Mid-mouthful: the mouth works away instead of holding its usual expression. */
  chewing?: boolean;
  /** Something edible is being held over the face — open wide. */
  mouthOpen?: boolean;
  /** Both arms up and in, because there is a baby in them. */
  carrying?: boolean;
  /**
   * Whatever is being carried, drawn inside the figure rather than beside it. In here it
   * inherits every transform the body has, so it sways with a fidget and travels with a
   * drag without being told to — and it can be put between the two arms, which is the only
   * way one of them gets to be underneath it.
   */
  carried?: ReactElement | null;
}): ReactElement {
  const hair = HAIR_STYLES[look.hairId] ?? HAIR_STYLES.long;
  const eyes = EYE_STYLES[look.eyesId] ?? EYE_STYLES.round;
  const mouth = MOUTH_STYLES[look.mouthId] ?? MOUTH_STYLES.smile;

  const topCoversLegs = look.topId !== null && COVERS_LEGS.has(look.topId);
  // Whether the motif actually shows is up to each top — some have their own decoration.
  const motif =
    look.motifId && MOTIF_STYLES[look.motifId]
      ? MOTIF_STYLES[look.motifId]({ colour: look.motifColour })
      : null;

  const pop = animate ? "av-pop" : undefined;

  const seated = pose === "sit";
  const idle = useIdle(animate, pose);

  return (
    // Three nested groups, because each carries its own transform and they would otherwise
    // fight over it: the outer one is whatever fidget is running, then breathing, then the
    // character. Only the whole-body fidgets touch the outer group; the rest reach inside.
    // Carrying beats fidgeting: an arm that wanders off to scratch an ear drops the baby.
    <g className={carrying ? "av-carrying" : idle ? "av-idle av-idle-" + idle : undefined}>
      {(idle || carrying) && pin()}
      <g className={animate && !seated ? "av-breathe" : undefined}>
        {hair.back && (
          <g className="av-hair-back">
            {pin()}
            <g key={"hb-" + look.hairId + look.hairColour} className={pop}>
              {hair.back({ colour: look.hairColour })}
            </g>
          </g>
        )}

      {/* Bare body underneath everything it wears. */}
      <g key={"body-" + look.skin}>
        <Legs skin={look.skin} pose={pose} />
        <rect x={NECK.x} y={NECK.y} width={NECK.w} height={NECK.h} rx={NECK.r} fill={shade(look.skin, -22)} />
        <path d={TORSO.path} fill={look.skin} />
      </g>

      {!topCoversLegs && look.bottomId && BOTTOM_STYLES[look.bottomId] && (
        <g key={"bot-" + look.bottomId + look.bottomColour} className={pop}>
          {BOTTOM_STYLES[look.bottomId]({ colour: look.bottomColour, pose })}
        </g>
      )}

      {look.topId && TOP_STYLES[look.topId] && (
        <g key={"top-" + look.topId + look.topColour + look.motifId + look.motifColour} className={pop}>
          {TOP_STYLES[look.topId].body({ colour: look.topColour, skin: look.skin, motif, uid })}
        </g>
      )}

      {look.shoesId && SHOE_STYLES[look.shoesId] && (
        <g key={"shoe-" + look.shoesId + look.shoesColour} className={pop}>
          {SHOE_STYLES[look.shoesId]({ colour: look.shoesColour, pose })}
        </g>
      )}

      {/* Head goes over the clothes so collars and hoods tuck in behind it. Everything from
          here to the glasses turns as one when the head does — jewellery is deliberately
          outside it, since a necklace sits on the chest and shouldn't swing with the chin. */}
      <g className="av-head">
      {pin()}
      <g key={"head-" + look.skin}>
        <ellipse cx={EAR.leftCx} cy={EAR.cy} rx={EAR.rx} ry={EAR.ry} fill={shade(look.skin, -18)} />
        <ellipse cx={EAR.rightCx} cy={EAR.cy} rx={EAR.rx} ry={EAR.ry} fill={shade(look.skin, -18)} />
        <circle className="av-face" cx={HEAD.cx} cy={HEAD.cy} r={HEAD.r} fill={look.skin} />
      </g>

      {look.blushId && BLUSH_STYLES[look.blushId] && (
        <g key={"blush-" + look.blushId + look.blushColour} className={pop}>
          {BLUSH_STYLES[look.blushId]({ colour: look.blushColour })}
        </g>
      )}

      <g key={"eyes-" + look.eyesId + look.irisColour} className={animate ? "av-blink" : undefined}>
        {eyes({ iris: look.irisColour, skin: look.skin })}
      </g>

      {look.noseId && NOSE_STYLES[look.noseId] && (
        <g key={"nose-" + look.noseId} className={pop}>
          {NOSE_STYLES[look.noseId]({ iris: look.irisColour, skin: look.skin })}
        </g>
      )}

      {mouthOpen ? (
        <g>
          <ellipse cx={MOUTH.cx} cy={MOUTH.cy + 4} rx={17} ry={15} fill="#8a3a52" />
          <ellipse cx={MOUTH.cx} cy={MOUTH.cy + 11} rx={10} ry={6} fill="#ff8fa8" />
          <path d={"M" + (MOUTH.cx - 13) + "," + (MOUTH.cy - 7) + " h26"} stroke="#fffdfa" strokeWidth={4} strokeLinecap="round" />
        </g>
      ) : chewing ? (
        <g className="av-chew">
          <ellipse cx={MOUTH.cx} cy={MOUTH.cy + 2} rx={13} ry={9.5} fill="#8a3a52" />
          <ellipse cx={MOUTH.cx} cy={MOUTH.cy + 5.5} rx={7.5} ry={4} fill="#ff8fa8" />
        </g>
      ) : (
        <g key={"mouth-" + look.mouthId} className={pop}>
          {mouth()}
        </g>
      )}

      <g key={"hf-" + look.hairId + look.hairColour} className={pop}>
        {hair.front({ colour: look.hairColour })}
      </g>

      {look.headId && HEAD_STYLES[look.headId] && (
        <g key={"acc-" + look.headId + look.headColour} className={pop}>
          {HEAD_STYLES[look.headId]({ colour: look.headColour })}
        </g>
      )}

      {look.glassesId && GLASSES_STYLES[look.glassesId] && (
        <g key={"gl-" + look.glassesId + look.glassesColour} className={pop}>
          {GLASSES_STYLES[look.glassesId]({ colour: look.glassesColour })}
        </g>
      )}
      </g>

      {look.jewelsId && JEWEL_STYLES[look.jewelsId] && (
        <g key={"jw-" + look.jewelsId + look.jewelsColour} className={pop}>
          {JEWEL_STYLES[look.jewelsId]({ colour: look.jewelsColour })}
        </g>
      )}

      {/* Arms come last, over everything including the head. A hand raised to scratch an ear
          or wave belongs in front of the hair, and there is no pose where an arm hanging at
          rest overlaps the head at all — so always-in-front costs nothing and fixes the
          raised case. This is the whole reason a top's sleeves are separate from its body:
          the body still has to go behind the head for collars to tuck in. */}
      <g key={"arms-" + look.skin}>
        <line
          className="av-arm-l"
          x1={ARM.left.x1}
          y1={ARM.left.y1}
          x2={ARM.left.x2}
          y2={ARM.left.y2}
          stroke={look.skin}
          strokeWidth={ARM.width}
          strokeLinecap="round"
        />
        <line
          className="av-arm-r"
          x1={ARM.right.x1}
          y1={ARM.right.y1}
          x2={ARM.right.x2}
          y2={ARM.right.y2}
          stroke={look.skin}
          strokeWidth={ARM.width}
          strokeLinecap="round"
        />
      </g>

      {look.topId && TOP_STYLES[look.topId]?.sleeves && (
        <g key={"sl-" + look.topId + look.topColour} className={pop}>
          {TOP_STYLES[look.topId].sleeves!({
            colour: look.topColour,
            skin: look.skin,
            motif: null,
            uid,
          })}
        </g>
      )}

      {carried && (
        <>
          {carried}
          {/*
           * The left arm a second time, over what is being held. One arm goes under a baby
           * and the other over it, and with the baby drawn as one whole figure there is no
           * way to slip a limb behind it except to draw that limb twice — once below, where
           * it is hidden, and once here on top.
           */}
          <line
            className="av-arm-l"
            x1={ARM.left.x1}
            y1={ARM.left.y1}
            x2={ARM.left.x2}
            y2={ARM.left.y2}
            stroke={look.skin}
            strokeWidth={ARM.width}
            strokeLinecap="round"
          />
        </>
      )}
      </g>
    </g>
  );
}

/**
 * One straight line when standing, thigh plus shin when sitting — built from the same
 * segments the trousers and shoes use, so the three can never disagree about where a knee is.
 */
function Legs({ skin, pose }: { skin: string; pose: Pose }): ReactElement {
  return (
    <g>
      {(["left", "right"] as const).map((side) =>
        legSegments(side, pose).map((segment, i) => (
          <line
            key={side + i}
            x1={segment.x1}
            y1={segment.y1}
            x2={segment.x2}
            y2={segment.y2}
            stroke={skin}
            strokeWidth={LEG.width}
            strokeLinecap="round"
          />
        ))
      )}
    </g>
  );
}

/** The character on its own, for the design stage and item thumbnails. */
export function Avatar({
  look,
  uid = "main",
  animate = true,
  crop,
}: {
  look: AvatarLook;
  uid?: string;
  animate?: boolean;
  /** Override the viewBox to zoom a thumbnail onto one region (a face, a pair of shoes). */
  crop?: string;
}): ReactElement {
  return (
    <svg viewBox={crop ?? VIEWBOX} className="avatar-svg" role="img" aria-label="Your character">
      <AvatarLayers look={look} uid={uid} animate={animate} />
    </svg>
  );
}
