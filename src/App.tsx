import { useState } from "react";
import { DesignMode } from "./design/DesignMode";
import { DEFAULT_LOOK, type AvatarLook } from "./data/wardrobe";
import { isMuted, setMuted } from "./lib/sound";

export function App() {
  const [look, setLook] = useState<AvatarLook>(DEFAULT_LOOK);
  const [muted, setMutedState] = useState(isMuted());

  return (
    <>
      <DesignMode look={look} onChange={setLook} />
      <button
        className="mute-btn"
        aria-label={muted ? "Turn sound on" : "Turn sound off"}
        onClick={() => {
          const next = !muted;
          setMuted(next);
          setMutedState(next);
        }}
      >
        {muted ? "🔇" : "🔊"}
      </button>
    </>
  );
}
