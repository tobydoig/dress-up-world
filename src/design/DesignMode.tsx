import { useState } from "react";
import { Avatar } from "../avatar/Avatar";
import { COVERS_LEGS } from "../avatar/clothingParts";
import {
  ACCESSORY_COLOURS,
  CATEGORIES,
  FABRIC_COLOURS,
  HAIR_COLOURS,
  IRIS_COLOURS,
  MAKEUP_COLOURS,
  SKIN_TONES,
  type AvatarLook,
  type CategoryId,
} from "../data/wardrobe";
import type { SavedCharacter } from "../lib/storage";
import { playPop, playSparkle, playSwatch, playTap } from "../lib/sound";

/** Each tab previews the part of the body it changes, so thumbnails aren't tiny full bodies. */
const CROPS: Record<CategoryId, string> = {
  top: "26 116 148 148",
  bottom: "26 214 148 148",
  shoes: "26 296 148 116",
  motif: "40 150 120 104",
  hair: "10 6 180 180",
  head: "10 0 180 150",
  glasses: "34 40 132 110",
  jewels: "40 86 120 100",
  eyes: "34 40 132 110",
  nose: "50 70 100 80",
  mouth: "44 66 112 94",
  blush: "34 56 132 100",
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
    case "head":
      return { ...look, headId: itemId };
    case "glasses":
      return { ...look, glassesId: itemId };
    case "jewels":
      return { ...look, jewelsId: itemId };
    case "eyes":
      return { ...look, eyesId: itemId ?? look.eyesId };
    case "nose":
      return { ...look, noseId: itemId };
    case "mouth":
      return { ...look, mouthId: itemId ?? look.mouthId };
    case "blush":
      return { ...look, blushId: itemId };
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
    case "head":
      return { ...look, headColour: hex };
    case "glasses":
      return { ...look, glassesColour: hex };
    case "jewels":
      return { ...look, jewelsColour: hex };
    case "eyes":
      return { ...look, irisColour: hex };
    case "blush":
      return { ...look, blushColour: hex };
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
    case "head":
      return look.headId;
    case "glasses":
      return look.glassesId;
    case "jewels":
      return look.jewelsId;
    case "eyes":
      return look.eyesId;
    case "nose":
      return look.noseId;
    case "mouth":
      return look.mouthId;
    case "blush":
      return look.blushId;
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
    case "head":
      return look.headColour;
    case "glasses":
      return look.glassesColour;
    case "jewels":
      return look.jewelsColour;
    case "eyes":
      return look.irisColour;
    case "blush":
      return look.blushColour;
    default:
      return null;
  }
}

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function maybe(chance: number, value: string): string | null {
  return Math.random() < chance ? value : null;
}

function randomLook(): AvatarLook {
  const byId = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!.items;
  const topColour = pick(FABRIC_COLOURS);
  // Same colour top and bottom merges into one shapeless block.
  const bottomColour = pick(FABRIC_COLOURS.filter((c) => c !== topColour));
  return {
    skin: pick(SKIN_TONES),
    hairId: pick(byId("hair")).id,
    hairColour: pick(HAIR_COLOURS),
    eyesId: pick(byId("eyes")).id,
    irisColour: pick(IRIS_COLOURS),
    noseId: pick(byId("nose")).id,
    mouthId: pick(byId("mouth")).id,
    blushId: maybe(0.8, pick(byId("blush")).id),
    blushColour: pick(MAKEUP_COLOURS),
    topId: pick(byId("top")).id,
    topColour,
    motifId: maybe(0.7, pick(byId("motif")).id),
    bottomId: pick(byId("bottom")).id,
    bottomColour,
    shoesId: pick(byId("shoes")).id,
    shoesColour: pick(FABRIC_COLOURS),
    headId: maybe(0.5, pick(byId("head")).id),
    headColour: pick(ACCESSORY_COLOURS),
    glassesId: maybe(0.25, pick(byId("glasses")).id),
    glassesColour: pick(ACCESSORY_COLOURS),
    jewelsId: maybe(0.45, pick(byId("jewels")).id),
    jewelsColour: pick(ACCESSORY_COLOURS),
  };
}

export function DesignMode({
  look,
  onChange,
  characters,
  editingId,
  onSave,
  onSelect,
  onDelete,
  onBack,
}: {
  look: AvatarLook;
  onChange: (next: AvatarLook) => void;
  characters: SavedCharacter[];
  editingId: string | null;
  onSave: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  /** Absent on the very first run, when there's no room to go back to yet. */
  onBack: (() => void) | null;
}) {
  const [activeId, setActiveId] = useState<CategoryId>("top");
  const [showCharacters, setShowCharacters] = useState(false);
  const active = CATEGORIES.find((c) => c.id === activeId)!;
  const selectedItem = currentItem(look, activeId);
  const selectedColour = currentColour(look, activeId);
  const dressCoversLegs = look.topId !== null && COVERS_LEGS.has(look.topId);

  return (
    <div className="screen">
      <header className="topbar">
        {onBack ? (
          <button
            className="chip-btn chip-ghost"
            onClick={() => {
              playTap();
              onBack();
            }}
          >
            ‹ Back
          </button>
        ) : (
          <h1 className="logo">
            Dress Up <span>World</span>
          </h1>
        )}
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

        {showCharacters && (
          <div className="items">
            {characters.length === 0 && <p className="hint">No saved characters yet — tap Save to keep this one.</p>}
            {characters.map((c) => (
              <div key={c.id} className={"item item-saved" + (c.id === editingId ? " is-active" : "")}>
                <button
                  className="item-pick"
                  onClick={() => {
                    onSelect(c.id);
                    playPop();
                  }}
                >
                  <span className="item-art">
                    <Avatar look={c.look} uid={"saved-" + c.id} animate={false} />
                  </span>
                  <span className="item-name">{c.name}</span>
                </button>
                <button
                  className="item-delete"
                  aria-label={"Delete " + c.name}
                  onClick={() => {
                    onDelete(c.id);
                    playTap();
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="actions">
          <button
            className="btn-secondary"
            onClick={() => {
              setShowCharacters((v) => !v);
              playTap();
            }}
          >
            {showCharacters ? "▾ Hide" : "👥 Characters (" + characters.length + ")"}
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              onSave();
              playSparkle();
            }}
          >
            Save &amp; play ▶
          </button>
        </div>
      </div>
    </div>
  );
}
