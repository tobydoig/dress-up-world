import { useState } from "react";
import { Avatar } from "../avatar/Avatar";
import { BabyLayers } from "../avatar/Baby";
import { COVERS_LEGS } from "../avatar/clothingParts";
import { BABY_TOPS, CATEGORIES, type AvatarLook, type CategoryId } from "../data/wardrobe";
import { NAME_MAX, type CharacterKind, type SavedCharacter } from "../lib/storage";
import { playPop, playSparkle, playSwatch, playTap } from "../lib/sound";

/** Each tab previews the part of the body it changes, so thumbnails aren't tiny full bodies. */
/**
 * What to frame on a baby for each sort of thing. The head is most of a baby, so a crop that
 * works for a grown-up's face leaves the body out of shot entirely and vice versa.
 */
const BABY_CROPS: Partial<Record<CategoryId, string>> = {
  top: "44 328 112 64",
  skin: "50 246 100 100",
};

const BABY_FACE_CROP = "58 252 84 84";

/** The only tabs that mean anything for a baby. */
const BABY_TABS = new Set<CategoryId>(["top", "eyes", "nose", "mouth", "blush", "skin"]);

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
    case "motif":
      return { ...look, motifColour: hex };
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
    case "motif":
      return look.motifColour;
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

export function DesignMode({
  look,
  onChange,
  name,
  onRename,
  editingKind,
  characters,
  editingId,
  onSave,
  onSelect,
  onDelete,
  onNew,
}: {
  look: AvatarLook;
  onChange: (next: AvatarLook) => void;
  name: string;
  onRename: (next: string) => void;
  /** Which sort of thing is being dressed, which decides what the drawer offers. */
  editingKind: CharacterKind;
  characters: SavedCharacter[];
  editingId: string | null;
  onSave: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: (kind: CharacterKind) => void;
}) {
  const [activeId, setActiveId] = useState<CategoryId>("top");
  /*
   * A baby has no shoes to fill, no hairstyle that would read as anything but a wig on a
   * head that size, and nobody puts lipstick on a baby. Hiding those tabs is kinder than
   * offering them and quietly doing nothing.
   */
  const tabs =
    editingKind === "baby" ? CATEGORIES.filter((c) => BABY_TABS.has(c.id)) : CATEGORIES;
  /*
   * Who you are dressing is chosen exactly the way a hat is: a tab at the far left of the
   * same strip, then a face in the same row of pictures. It used to be a button below the
   * drawer that unfolded a second list, which made picking a character the one thing in
   * here that worked differently from everything else.
   */
  const [showWho, setShowWho] = useState(false);
  const found = CATEGORIES.find((c) => c.id === activeId)!;
  // A baby's outfit list is its own; everything else it can have is shared.
  const active =
    editingKind === "baby" && activeId === "top" ? { ...found, items: BABY_TOPS } : found;
  const selectedItem = currentItem(look, activeId);
  const selectedColour = currentColour(look, activeId);
  const dressCoversLegs = look.topId !== null && COVERS_LEGS.has(look.topId);

  return (
    <div className="screen">
      <header className="topbar">
        {/* Inert text, exactly like the room name in explore mode — so the left of the bar
            never does anything, in either mode. */}
        <h1 className="logo">
          Dress Up <span>World</span>
        </h1>

        <span className="version">v{__APP_VERSION__}</span>

        {/* The same spot as explore's "Dress up", doing the mirror of it. Saves on the way
            out rather than discarding: a child who has just dressed someone up and taps the
            obvious button should not lose it. */}
        <button
          className="chip-btn chip-mode"
          onClick={() => {
            onSave();
            playSparkle();
          }}
        >
          🏠 Play
        </button>
      </header>

      <div className="stage">
        <div className="stage-glow" />
        {editingKind === "baby" ? (
          <svg viewBox="30 240 140 160" className="avatar-svg">
            <BabyLayers look={look} />
          </svg>
        ) : (
          <Avatar look={look} />
        )}
        <div className="stage-shadow" />
      </div>

      <div className="drawer">
        {/*
         * Whose this is. Typing is the one thing in the whole game that needs a grown-up, so
         * it is a plain field rather than anything cleverer — she decides the name, he types
         * it. Focusing selects what's there, so replacing the given name is one tap and then
         * typing, rather than a long-press and a fiddle with selection handles.
         */}
        <div className="name-row">
          <span className="name-icon" aria-hidden="true">🏷️</span>
          <input
            className="name-input"
            type="text"
            value={name}
            maxLength={NAME_MAX}
            placeholder="Give them a name"
            aria-label="Character name"
            onFocus={(e) => {
              // Deferred by a frame: focus lands first and the tap then places the caret,
              // which would undo a select made here and now.
              const field = e.currentTarget;
              requestAnimationFrame(() => field.select());
            }}
            onChange={(e) => onRename(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
          />
        </div>

        <div className="tabs" role="tablist">
          {/* First, because it is the thing the rest of the drawer is about. */}
          <button
            role="tab"
            aria-selected={showWho}
            className={"tab" + (showWho ? " is-active" : "")}
            onClick={() => {
              setShowWho(true);
              playTap();
            }}
          >
            <span className="tab-icon">🧒</span>
            <span className="tab-label">Avatar</span>
          </button>
          {tabs.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={!showWho && c.id === activeId}
              className={"tab" + (!showWho && c.id === activeId ? " is-active" : "")}
              onClick={() => {
                setShowWho(false);
                setActiveId(c.id);
                playTap();
              }}
            >
              <span className="tab-icon">{c.icon}</span>
              <span className="tab-label">{c.label}</span>
            </button>
          ))}
        </div>

        {/* One or the other fills the same space: the faces, or the clothes. */}
        {showWho ? (
          <>
            <div className="items">
              <button
                className="item"
                onClick={() => {
                  onNew("child");
                  playPop();
                }}
              >
                <span className="item-none">＋</span>
                <span className="item-name">New one</span>
              </button>
              <button
                className="item"
                onClick={() => {
                  onNew("baby");
                  playPop();
                }}
              >
                <span className="item-none">👶</span>
                <span className="item-name">New baby</span>
              </button>
              {characters.length === 0 && (
                <p className="hint">Nobody saved yet — tap Play and this one is kept.</p>
              )}
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
                      {c.kind === "baby" ? (
                        <svg viewBox="40 250 120 140" className="thing-svg">
                          <BabyLayers look={c.look} animate={false} />
                        </svg>
                      ) : (
                        <Avatar look={c.look} uid={"saved-" + c.id} animate={false} />
                      )}
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

              {/* Empty, but present: the swatch row is reserved on every tab so the drawer
                  keeps one height and the character doesn't change size as you flick along. */}
              <div className="swatches" />
            </>
          ) : (
            <>
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
                    {editingKind === "baby" ? (
                      <svg viewBox={BABY_CROPS[activeId] ?? BABY_FACE_CROP} className="thing-svg">
                        <BabyLayers look={applyItem(look, activeId, item.id)} animate={false} />
                      </svg>
                    ) : (
                      <Avatar
                        look={applyItem(look, activeId, item.id)}
                        uid={"thumb-" + activeId + "-" + item.id}
                        animate={false}
                        crop={CROPS[activeId]}
                      />
                    )}
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
          </>
        )}
      </div>
    </div>
  );
}
