import { useRef, useEffect, useCallback } from "react";

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
            {scene.title && scene.title !== scene.label ? scene.title : scene.label}
            {myLines > 0 && <span style={{ marginLeft: 4, fontSize: 10, opacity: active ? 0.8 : 0.5 }}>({myLines})</span>}
          </button>
        );
      })}
    </div>
  );
}

export function SearchBar({ query, onQueryChange, matchCount, activeMatchIdx, onNext, onPrev, onClose }) {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKey = (e) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "Enter") { e.shiftKey ? onPrev() : onNext(); }
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
      background: "rgba(255,255,255,0.04)", border: "1px solid #444", borderRadius: 5,
      marginBottom: 14, animation: "fadeIn 0.15s ease",
    }}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Search script..."
        style={{
          flex: 1, background: "transparent", border: "none", outline: "none",
          color: "#eee", fontSize: 13, fontFamily: "inherit",
        }}
      />
      {query && (
        <span style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>
          {matchCount > 0 ? `${activeMatchIdx + 1} of ${matchCount}` : "No matches"}
        </span>
      )}
      <button onClick={onPrev} disabled={matchCount === 0} style={SEARCH_BTN} title="Previous (Shift+Enter)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
      </button>
      <button onClick={onNext} disabled={matchCount === 0} style={SEARCH_BTN} title="Next (Enter)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <button onClick={onClose} style={SEARCH_BTN} title="Close (Esc)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

const SEARCH_BTN = {
  background: "transparent", border: "none", color: "#888", cursor: "pointer",
  padding: 4, borderRadius: 3, display: "flex", alignItems: "center",
};

function HighlightText({ text, query, isActive }) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} style={{
        background: isActive ? "#c9a227" : "rgba(201,162,39,0.35)",
        color: isActive ? "#111" : "inherit",
        borderRadius: 2, padding: "0 1px",
      }}>{part}</mark>
    ) : part
  );
}

export function ScriptViewer({ scene, selectedCharacter, searchQuery = "", activeMatchLineId = null, highlightStyle = "search" }) {
  const scrollRef = useRef(null);
  const activeLineRef = useRef(null);
  const isRehearsal = highlightStyle === "rehearsal";

  // Scroll to top when scene changes (only when not searching/rehearsing)
  useEffect(() => {
    if (!searchQuery && !isRehearsal && scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [scene.label, searchQuery, isRehearsal]);

  // Scroll to active match / rehearsal line
  useEffect(() => {
    if (activeMatchLineId && activeLineRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeLineRef.current;
      const elTop = el.offsetTop - container.offsetTop;
      const elBottom = elTop + el.offsetHeight;
      const visTop = container.scrollTop;
      const visBottom = visTop + container.clientHeight;
      if (elTop < visTop || elBottom > visBottom) {
        container.scrollTop = elTop - 80;
      }
    }
  }, [activeMatchLineId]);

  // Highlight helpers for rehearsal vs search
  const directionBg = (active) => {
    if (!active) return "rgba(255,255,255,0.02)";
    return isRehearsal ? "rgba(201,162,39,0.15)" : "rgba(201,162,39,0.1)";
  };
  const dialogueBg = (active, isMe) => {
    if (active) return isRehearsal ? "rgba(201,162,39,0.18)" : "rgba(201,162,39,0.12)";
    return isMe ? "rgba(201,162,39,0.06)" : "transparent";
  };
  const dialogueBorder = (active, isMe) => {
    if (active && isRehearsal) return `3px solid ${GOLD}`;
    return isMe ? `2px solid ${GOLD}` : "none";
  };

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
        const isActiveMatch = line.id === activeMatchLineId;
        const hasMatch = searchQuery && line.text.toLowerCase().includes(searchQuery.toLowerCase());

        // Stage direction / action block
        if (line.type === "direction") {
          return (
            <div key={line.id} ref={isActiveMatch ? activeLineRef : null} style={{
              fontStyle: "italic", color: "#bbb", fontSize: 13, lineHeight: 1.75,
              padding: "8px 16px", marginBottom: 14, whiteSpace: "pre-wrap",
              background: directionBg(isActiveMatch), borderRadius: 4,
              transition: "background 0.2s ease",
            }}>
              <HighlightText text={line.text} query={hasMatch ? searchQuery : ""} isActive={isActiveMatch} />
            </div>
          );
        }

        // Dialogue
        const isMe = line.character === selectedCharacter;
        return (
          <div key={line.id} ref={isActiveMatch ? activeLineRef : null} style={{ marginBottom: 20 }}>
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
              background: dialogueBg(isActiveMatch, isMe),
              borderLeft: dialogueBorder(isActiveMatch, isMe),
              borderRadius: isMe ? "0 3px 3px 0" : 0,
              transition: "background 0.2s ease, border-left 0.2s ease",
            }}>
              <HighlightText text={line.text} query={hasMatch ? searchQuery : ""} isActive={isActiveMatch} />
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
