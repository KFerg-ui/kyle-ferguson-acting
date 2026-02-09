import { useRef, useEffect } from "react";

const GOLD = "#c9a227";

export function SceneNav({ scenes, activeScene, onSelect, selectedCharacter }) {
  const navRef = useRef(null);
  const btnRefs = useRef([]);

  // Auto-scroll active tab into view
  useEffect(() => {
    const btn = btnRefs.current[activeScene];
    if (btn && navRef.current) {
      btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeScene]);

  return (
    <div ref={navRef} style={{
      display: "flex", gap: 5, overflowX: "auto", paddingBottom: 8,
      marginBottom: 16, borderBottom: "1px solid #333", WebkitOverflowScrolling: "touch",
    }}>
      {scenes.map((scene, idx) => {
        const myLines = scene.lines.filter((l) => l.type === "dialogue" && l.character === selectedCharacter).length;
        const active = activeScene === idx;
        return (
          <button ref={(el) => (btnRefs.current[idx] = el)} key={idx} onClick={() => onSelect(idx)} style={{
            padding: "5px 12px", borderRadius: 4, border: "none",
            background: active ? GOLD : "rgba(255,255,255,0.04)",
            color: active ? "#111" : "#888", fontSize: 13, fontWeight: active ? 700 : 400,
            cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
          }}>
            {scene.label}
            {myLines > 0 && <span style={{ marginLeft: 4, fontSize: 10, opacity: active ? 0.8 : 0.5 }}>({myLines})</span>}
          </button>
        );
      })}
    </div>
  );
}

export function ScriptViewer({ scene, selectedCharacter }) {
  const scrollRef = useRef(null);

  // Scroll to top when scene changes
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [scene.label]);

  return (
    <div ref={scrollRef} key={scene.label} style={{
      background: "#1a1a1a", borderRadius: 6, padding: "28px 20px",
      maxHeight: "62vh", overflowY: "auto", border: "1px solid #333", WebkitOverflowScrolling: "touch",
      animation: "fadeIn 0.25s ease",
    }}>
      {/* Scene heading */}
      <div style={{ textAlign: "center", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #333" }}>
        <div style={{ fontSize: 11, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>{scene.label}</div>
        <div style={{ fontSize: 15, color: "#eee", fontWeight: 700, textTransform: "uppercase" }}>{scene.title}</div>
      </div>

      {scene.lines.map((line) => {
        // Stage direction / action block
        if (line.type === "direction") {
          return (
            <div key={line.id} style={{
              fontStyle: "italic", color: "#bbb", fontSize: 13, lineHeight: 1.75,
              padding: "8px 16px", marginBottom: 14, whiteSpace: "pre-wrap",
              background: "rgba(255,255,255,0.02)", borderRadius: 4,
            }}>
              {line.text}
            </div>
          );
        }

        // Dialogue
        const isMe = line.character === selectedCharacter;
        return (
          <div key={line.id} style={{ marginBottom: 20 }}>
            {/* Character name - centered, screenplay style */}
            <div style={{
              fontSize: 13, fontWeight: 700, textTransform: "uppercase",
              textAlign: "center", letterSpacing: "0.14em", marginBottom: 3,
              color: isMe ? GOLD : "#999",
            }}>
              {line.character}
              {isMe && (
                <span style={{
                  marginLeft: 7, fontSize: 9, background: GOLD, color: "#111",
                  padding: "1px 5px", borderRadius: 3, fontWeight: 800, verticalAlign: "middle",
                }}>YOU</span>
              )}
            </div>
            {/* Dialogue text */}
            <div style={{
              fontSize: 14, lineHeight: 1.75, maxWidth: 440, margin: "0 auto",
              color: isMe ? "#fff" : "#ddd",
              padding: isMe ? "5px 14px" : "2px 14px",
              background: isMe ? "rgba(201,162,39,0.06)" : "transparent",
              borderLeft: isMe ? `2px solid ${GOLD}` : "none",
              borderRadius: isMe ? "0 3px 3px 0" : 0,
            }}>
              {line.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ScriptStats({ scenes, selectedCharacter }) {
  const totalLines = scenes.reduce(
    (s, sc) => s + sc.lines.filter((l) => l.type === "dialogue" && l.character === selectedCharacter).length, 0
  );
  const totalWords = scenes.reduce(
    (s, sc) =>
      s + sc.lines
        .filter((l) => l.type === "dialogue" && l.character === selectedCharacter)
        .reduce((w, l) => w + l.text.split(/\s+/).length, 0), 0
  );
  const activeSections = scenes.filter((s) =>
    s.lines.some((l) => l.type === "dialogue" && l.character === selectedCharacter)
  ).length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, margin: "18px 0" }}>
      {[
        { label: "Lines", value: totalLines },
        { label: "Words", value: totalWords.toLocaleString() },
        { label: "Scenes", value: activeSections },
      ].map((s) => (
        <div key={s.label} style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid #333",
          borderRadius: 5, padding: "12px 8px", textAlign: "center",
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: GOLD }}>{s.value}</div>
          <div style={{ fontSize: 10, color: "#888", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}
