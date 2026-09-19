import type { ReactElement } from "react";
import { ARM, EAR, HEAD, LEG, NECK, TORSO, VIEWBOX, shade } from "./bodyGeometry";
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
export function AvatarLayers({
  look,
  uid = "main",
  animate = true,
}: {
  look: AvatarLook;
  uid?: string;
  animate?: boolean;
}): ReactElement {
  const hair = HAIR_STYLES[look.hairId] ?? HAIR_STYLES.long;
  const eyes = EYE_STYLES[look.eyesId] ?? EYE_STYLES.round;
  const mouth = MOUTH_STYLES[look.mouthId] ?? MOUTH_STYLES.smile;

  const topCoversLegs = look.topId !== null && COVERS_LEGS.has(look.topId);
  // Whether the motif actually shows is up to each top — some have their own decoration.
  const motif = look.motifId && MOTIF_STYLES[look.motifId] ? MOTIF_STYLES[look.motifId]() : null;

  const pop = animate ? "av-pop" : undefined;

  return (
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
          {TOP_STYLES[look.topId]({ colour: look.topColour, skin: look.skin, motif, uid })}
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

      <g key={"mouth-" + look.mouthId} className={pop}>
        {mouth()}
      </g>

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

      {look.jewelsId && JEWEL_STYLES[look.jewelsId] && (
        <g key={"jw-" + look.jewelsId + look.jewelsColour} className={pop}>
          {JEWEL_STYLES[look.jewelsId]({ colour: look.jewelsColour })}
        </g>
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
