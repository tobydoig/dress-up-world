import { useState } from "react";
import { Avatar } from "../avatar/Avatar";
import { COVERS_LEGS } from "../avatar/clothingParts";
import {
  CATEGORIES,
  FABRIC_COLOURS,
  HAIR_COLOURS,
  IRIS_COLOURS,
  SKIN_TONES,
  type AvatarLook,
  type CategoryId,
} from "../data/wardrobe";
import { playPop, playSwatch, playTap } from "../lib/sound";

/** Each tab previews the part of the body it changes, so thumbnails aren't tiny full bodies. */
const CROPS: Record<CategoryId, string> = {
  top: "26 116 148 148",
  bottom: "26 214 148 148",
  shoes: "26 296 148 116",
  motif: "40 150 120 104",
  hair: "16 12 168 168",
  eyes: "34 40 132 110",
  mouth: "44 66 112 94",
  skin: "16 12 168 168",
};

function applyItem(look: AvatarLook, cat: CategoryId, itemId: string | null): AvatarLook {
  switch (cat) {
    case "top":
      return { ...look, topId: itemId };
    case "bottom":
      return { ...look, bottomId: itemId };
    case "shoes":
      return { ...look, shoesId: itemId };
    case "motif":
      return { ...look, motifId: itemId };
    case "hair":
      return { ...look, hairId: itemId ?? look.hairId };
    case "eyes":
      return { ...look, eyesId: itemId ?? look.eyesId };
    case "mouth":
      return { ...look, mouthId: itemId ?? look.mouthId };
    case "skin":
      return { ...look, skin: itemId ?? look.skin };
  }
}

function applyColour(look: AvatarLook, cat: CategoryId, hex: string): AvatarLook {
  switch (cat) {
    case "top":
      return { ...look, topColour: hex };
    case "bottom":
      return { ...look, bottomColour: hex };
    case "shoes":
      return { ...look, shoesColour: hex };
    case "hair":
      return { ...look, hairColour: hex };
    case "eyes":
      return { ...look, irisColour: hex };
    default:
      return look;
  }
}

function currentItem(look: AvatarLook, cat: CategoryId): string | null {
  switch (cat) {
    case "top":
      return look.topId;
    case "bottom":
      return look.bottomId;
    case "shoes":
      return look.shoesId;
    case "motif":
      return look.motifId;
    case "hair":
      return look.hairId;
    case "eyes":
      return look.eyesId;
    case "mouth":
      return look.mouthId;
    case "skin":
      return look.skin;
  }
}

function currentColour(look: AvatarLook, cat: CategoryId): string | null {
  switch (cat) {
    case "top":
      return look.topColour;
    case "bottom":
      return look.bottomColour;
    case "shoes":
      return look.shoesColour;
    case "hair":
      return look.hairColour;
    case "eyes":
      return look.irisColour;
    default:
      return null;
  }
}

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function randomLook(): AvatarLook {
  const byId = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!.items;
  const topId = pick(byId("top")).id;
  const topColour = pick(FABRIC_COLOURS);
  const bottomColour = pick(FABRIC_COLOURS.filter((c) => c !== topColour));
  return {
    skin: pick(SKIN_TONES),
    hairId: pick(byId("hair")).id,
    hairColour: pick(HAIR_COLOURS),
    eyesId: pick(byId("eyes")).id,
    irisColour: pick(IRIS_COLOURS),
    mouthId: pick(byId("mouth")).id,
    topId,
    topColour,
    motifId: Math.random() < 0.7 ? pick(byId("motif")).id : null,
    bottomId: pick(byId("bottom")).id,
    bottomColour,
    shoesId: pick(byId("shoes")).id,
    shoesColour: pick(FABRIC_COLOURS),
  };
}

export function DesignMode({
  look,
  onChange,
}: {
  look: AvatarLook;
  onChange: (next: AvatarLook) => void;
}) {
  const [activeId, setActiveId] = useState<CategoryId>("top");
  const active = CATEGORIES.find((c) => c.id === activeId)!;
  const selectedItem = currentItem(look, activeId);
  const selectedColour = currentColour(look, activeId);
  const dressCoversLegs = look.topId !== null && COVERS_LEGS.has(look.topId);

  return (
    <div className="screen">
      <header className="topbar">
        <h1 className="logo">
          Dress Up <span>World</span>
        </h1>
        <button
          className="chip-btn"
          onClick={() => {
            onChange(randomLook());
            playPop();
          }}
        >
          🎲 Surprise me
        </button>
      </header>

      <div className="stage">
        <div className="stage-glow" />
        <Avatar look={look} />
        <div className="stage-shadow" />
      </div>

      <div className="drawer">
        <div className="tabs" role="tablist">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={c.id === activeId}
              className={"tab" + (c.id === activeId ? " is-active" : "")}
              onClick={() => {
                setActiveId(c.id);
                playTap();
              }}
            >
              <span className="tab-icon">{c.icon}</span>
              <span className="tab-label">{c.label}</span>
            </button>
          ))}
        </div>

        {activeId === "bottom" && dressCoversLegs && (
          <p className="hint">Your dress covers your legs — pick a different outfit to show these.</p>
        )}

        <div className="items">
          {active.allowNone && (
            <button
              className={"item" + (selectedItem === null ? " is-active" : "")}
              onClick={() => {
                onChange(applyItem(look, activeId, null));
                playPop();
              }}
            >
              <span className="item-none">🚫</span>
              <span className="item-name">None</span>
            </button>
          )}

          {active.items.map((item) => (
            <button
              key={item.id}
              className={"item" + (selectedItem === item.id ? " is-active" : "")}
              onClick={() => {
                onChange(applyItem(look, activeId, item.id));
                playPop();
              }}
            >
              <span className="item-art">
                <Avatar
                  look={applyItem(look, activeId, item.id)}
                  uid={"thumb-" + activeId + "-" + item.id}
                  animate={false}
                  crop={CROPS[activeId]}
                />
              </span>
              <span className="item-name">{item.name}</span>
            </button>
          ))}
        </div>

        <div className="swatches">
          {active.palette?.map((hex) => (
            <button
              key={hex}
              aria-label={"Colour " + hex}
              className={"swatch" + (selectedColour === hex ? " is-active" : "")}
              style={{ background: hex }}
              onClick={() => {
                onChange(applyColour(look, activeId, hex));
                playSwatch();
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
