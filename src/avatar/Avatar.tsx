import type { ReactElement } from "react";
import { ARM, EAR, HEAD, LEG, NECK, TORSO, VIEWBOX, shade } from "./bodyGeometry";
import { Blush, EYE_STYLES, MOUTH_STYLES } from "./faceParts";
import { HAIR_STYLES } from "./hairParts";
import { BOTTOM_STYLES, COVERS_LEGS, MOTIF_STYLES, SHOE_STYLES, TOP_STYLES } from "./clothingParts";
import type { AvatarLook } from "../data/wardrobe";

/**
 * Draws a look as layered SVG. Layer order is the whole trick: hair-back, body, clothes, head,
 * face, hair-front — so long hair falls behind the shoulders and a hood sits behind the head.
 *
 * Each slot gets a `key` built from its own state, so swapping a garment remounts just that
 * group and replays the pop animation on it rather than the whole character.
 */
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
  const hair = HAIR_STYLES[look.hairId] ?? HAIR_STYLES.long;
  const eyes = EYE_STYLES[look.eyesId] ?? EYE_STYLES.round;
  const mouth = MOUTH_STYLES[look.mouthId] ?? MOUTH_STYLES.smile;

  const topCoversLegs = look.topId !== null && COVERS_LEGS.has(look.topId);
  // Whether the motif actually shows is up to each top — some have their own decoration.
  const motif = look.motifId && MOTIF_STYLES[look.motifId] ? MOTIF_STYLES[look.motifId]() : null;

  const pop = animate ? "av-pop" : undefined;

  return (
    <svg viewBox={crop ?? VIEWBOX} className="avatar-svg" role="img" aria-label="Your character">
      <g className={animate ? "av-breathe" : undefined}>
        {hair.back && (
          <g key={"hb-" + look.hairId + look.hairColour} className={pop}>
            {hair.back({ colour: look.hairColour })}
          </g>
        )}

        {/* Bare body underneath everything it wears. */}
        <g key={"body-" + look.skin}>
          <line
            x1={LEG.left.x1}
            y1={LEG.left.y1}
            x2={LEG.left.x2}
            y2={LEG.left.y2}
            stroke={look.skin}
            strokeWidth={LEG.width}
            strokeLinecap="round"
          />
          <line
            x1={LEG.right.x1}
            y1={LEG.right.y1}
            x2={LEG.right.x2}
            y2={LEG.right.y2}
            stroke={look.skin}
            strokeWidth={LEG.width}
            strokeLinecap="round"
          />
          <line
            x1={ARM.left.x1}
            y1={ARM.left.y1}
            x2={ARM.left.x2}
            y2={ARM.left.y2}
            stroke={look.skin}
            strokeWidth={ARM.width}
            strokeLinecap="round"
          />
          <line
            x1={ARM.right.x1}
            y1={ARM.right.y1}
            x2={ARM.right.x2}
            y2={ARM.right.y2}
            stroke={look.skin}
            strokeWidth={ARM.width}
            strokeLinecap="round"
          />
          <rect x={NECK.x} y={NECK.y} width={NECK.w} height={NECK.h} rx={NECK.r} fill={shade(look.skin, -22)} />
          <path d={TORSO.path} fill={look.skin} />
        </g>

        {!topCoversLegs && look.bottomId && BOTTOM_STYLES[look.bottomId] && (
          <g key={"bot-" + look.bottomId + look.bottomColour} className={pop}>
            {BOTTOM_STYLES[look.bottomId]({ colour: look.bottomColour })}
          </g>
        )}

        {look.topId && TOP_STYLES[look.topId] && (
          <g key={"top-" + look.topId + look.topColour + look.motifId} className={pop}>
            {TOP_STYLES[look.topId]({
              colour: look.topColour,
              skin: look.skin,
              motif,
              uid,
            })}
          </g>
        )}

        {look.shoesId && SHOE_STYLES[look.shoesId] && (
          <g key={"shoe-" + look.shoesId + look.shoesColour} className={pop}>
            {SHOE_STYLES[look.shoesId]({ colour: look.shoesColour })}
          </g>
        )}

        {/* Head goes over the clothes so collars and hoods tuck in behind it. */}
        <g key={"head-" + look.skin}>
          <ellipse cx={EAR.leftCx} cy={EAR.cy} rx={EAR.rx} ry={EAR.ry} fill={shade(look.skin, -18)} />
          <ellipse cx={EAR.rightCx} cy={EAR.cy} rx={EAR.rx} ry={EAR.ry} fill={shade(look.skin, -18)} />
          <circle cx={HEAD.cx} cy={HEAD.cy} r={HEAD.r} fill={look.skin} />
        </g>

        <Blush />

        <g key={"eyes-" + look.eyesId + look.irisColour} className={animate ? "av-blink" : undefined}>
          {eyes({ iris: look.irisColour, skin: look.skin })}
        </g>

        <g key={"mouth-" + look.mouthId} className={pop}>
          {mouth()}
        </g>

        <g key={"hf-" + look.hairId + look.hairColour} className={pop}>
          {hair.front({ colour: look.hairColour })}
        </g>
      </g>
    </svg>
  );
}
