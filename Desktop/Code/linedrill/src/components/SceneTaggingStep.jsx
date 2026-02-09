import { useState, useEffect, useCallback } from "react";
import { getSceneDialogue, getScenePreview } from "../lib/scene-helpers";

const GOLD = "#c9a227";
const BTN = {
  primary: { padding: "10px 20px", borderRadius: 5, border: "none", background: GOLD, color: "#111", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.06em" },
  secondary: { padding: "10px 20px", borderRadius: 5, border: "1px solid #444", background: "transparent", color: "#aaa", fontSize: 14, cursor: "pointer", fontFamily: "inherit" },
  small: { padding: "4px 12px", borderRadius: 4, border: "1px solid #444", background: "transparent", color: "#aaa", fontSize: 11, cursor: "pointer", fontFamily: "inherit" },
};

export default function SceneTaggingStep({ allBreaks, dialogueEntries, selectedCharacter, rawText, onComplete }) {
  // Filter to only breaks where the user's character has lines
  const relevantBreaks = allBreaks.map((brk, originalIdx) => {
    const entries = getSceneDialogue(dialogueEntries, allBreaks, originalIdx);
    const myLines = entries.filter((d) => d.type === "dialogue" && d.character === selectedCharacter).length;
    const totalDlg = entries.filter((d) => d.type === "dialogue").length;
    return { ...brk, originalIdx, myLines, totalDlg };
  }).filter((b) => b.myLines > 0);

  const [items, setItems] = useState(() =>
    relevantBreaks.map((b) => ({
      ...b,
      included: true,
      name: b.suggestedName,
      label: b.suggestedLabel,
      reviewed: false,
    }))
  );
  const [idx, setIdx] = useState(0);
  const [editName, setEditName] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [viewAll, setViewAll] = useState(false);

  const cur = items[idx];
  const total = items.length;
  const reviewed = items.filter((b) => b.reviewed).length;
  const skippedCount = allBreaks.length - relevantBreaks.length;

  useEffect(() => {
    if (cur) {
      setEditName(cur.name);
      setEditLabel(cur.label);
    }
  }, [idx, cur?.name, cur?.label]);

  const confirm = () => {
    const u = [...items];
    u[idx] = { ...cur, name: editName, label: editLabel, included: true, reviewed: true };
    setItems(u);
    if (idx < total - 1) setIdx(idx + 1);
  };

  const skip = () => {
    const u = [...items];
    u[idx] = { ...cur, included: false, reviewed: true };
    setItems(u);
    if (idx < total - 1) setIdx(idx + 1);
  };

  const confirmedCount = items.filter((b) => b.included).length;

  // Keyboard shortcuts: Enter = confirm, Escape = skip
  const handleKey = useCallback((e) => {
    if (viewAll) return;
    const tag = e.target.tagName;
    if (tag === "INPUT" && e.key !== "Enter" && e.key !== "Escape") return;
    if (e.key === "Enter") { e.preventDefault(); confirm(); }
    if (e.key === "Escape") { e.preventDefault(); skip(); }
  }, [viewAll, idx, items, editName, editLabel]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const finish = () => {
    if (confirmedCount === 0) return;
    onComplete(
      items.filter((b) => b.included).map((b) => ({
        srcLine: b.srcLine,
        label: b.label,
        name: b.name,
      }))
    );
  };

  const preview = cur ? getScenePreview(rawText, cur.srcLine, 5) : [];

  // ── View All mode ──
  if (viewAll) {
    return (
      <div style={{ animation: "fadeIn 0.2s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <p style={{ fontSize: 14, color: "#eee", fontWeight: 700 }}>Your Scenes ({items.length})</p>
          <button onClick={() => setViewAll(false)} style={BTN.small}>← Back</button>
        </div>
        {skippedCount > 0 && (
          <p style={{ fontSize: 11, color: "#666", marginBottom: 10 }}>
            {skippedCount} scene{skippedCount !== 1 ? "s" : ""} without your lines hidden
          </p>
        )}
        <div style={{ maxHeight: "55vh", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          {items.map((b, i) => (
            <div key={i} style={{
              padding: "10px 12px", marginBottom: 5, borderRadius: 5,
              border: `1px solid ${b.included ? "#333" : "#222"}`,
              background: b.included ? "rgba(255,255,255,0.03)" : "transparent",
              opacity: b.included ? 1 : 0.45,
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "#eee", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <span style={{ color: GOLD, marginRight: 6 }}>{b.label}</span>{b.name}
                </div>
                <div style={{ fontSize: 11, color: "#777", marginTop: 2 }}>
                  {b.myLines} of your lines · {b.totalDlg} total
                </div>
              </div>
              <button onClick={() => {
                const u = [...items]; u[i] = { ...b, included: !b.included, reviewed: true }; setItems(u);
              }} style={{ ...BTN.small, color: b.included ? GOLD : "#666", borderColor: b.included ? GOLD : "#444" }}>
                {b.included ? "✓" : "○"}
              </button>
            </div>
          ))}
        </div>
        <button onClick={finish} disabled={confirmedCount === 0} style={{ ...BTN.primary, marginTop: 14, width: "100%", opacity: confirmedCount === 0 ? 0.4 : 1 }}>
          {confirmedCount === 0 ? "Select at least one scene" : "Done — View Script →"}
        </button>
      </div>
    );
  }

  // ── Step-by-step mode ──
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* Progress */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <p style={{ fontSize: 14, color: "#eee", fontWeight: 700 }}>Tag Your Scenes</p>
          <p style={{ fontSize: 12, color: "#888" }}>{reviewed}/{total}</p>
        </div>
        <div style={{ height: 3, background: "#333", borderRadius: 2 }}>
          <div style={{ height: "100%", width: `${(reviewed / total) * 100}%`, background: GOLD, transition: "width 0.3s", borderRadius: 2 }} />
        </div>
        <p style={{ fontSize: 11, color: "#777", marginTop: 6, lineHeight: 1.5 }}>
          Showing {total} scene{total !== 1 ? "s" : ""} where{" "}
          <span style={{ color: GOLD }}>{selectedCharacter}</span> has lines.
          {skippedCount > 0 && <span> ({skippedCount} without your lines hidden.)</span>}
        </p>
      </div>

      {/* Current break card */}
      {cur && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #333", borderRadius: 8, padding: "18px 16px", marginBottom: 14 }}>
          <div style={{ marginBottom: 10 }}>
            <span style={{
              fontSize: 10, color: "#111", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
              background: cur.type === "act" ? GOLD : cur.type === "scene" ? "#7a7aff" : cur.type === "slugline" ? "#4a9" : "#888",
              padding: "2px 7px", borderRadius: 3,
            }}>{cur.type}</span>
            <span style={{ fontSize: 11, color: "#666", marginLeft: 8 }}>#{idx + 1} of {total}</span>
            <span style={{ fontSize: 11, color: GOLD, marginLeft: 8 }}>{cur.myLines} of your lines</span>
          </div>

          {/* Break heading */}
          <div style={{
            fontSize: 14, color: "#eee", fontWeight: 700, padding: "8px 14px",
            background: "rgba(255,255,255,0.03)", borderRadius: 4, borderLeft: `2px solid ${GOLD}`, marginBottom: 10,
          }}>
            {cur.exactText || cur.suggestedName}
          </div>

          {/* Preview lines */}
          {preview.length > 0 && (
            <div style={{
              fontSize: 12, color: "#999", lineHeight: 1.6, padding: "10px 14px",
              background: "rgba(0,0,0,0.2)", borderRadius: 4, marginBottom: 14,
              maxHeight: 120, overflowY: "auto", fontStyle: "italic",
            }}>
              {preview.map((line, li) => (
                <div key={li} style={{ marginBottom: 3 }}>
                  {line.length > 80 ? line.substring(0, 80) + "..." : line}
                </div>
              ))}
            </div>
          )}

          {/* Label + Name inputs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 80 }}>
              <label style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 3 }}>Label</label>
              <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} placeholder="1.1"
                style={{ width: "100%", padding: "7px 10px", borderRadius: 4, border: "1px solid #444", background: "#1a1a1a", color: GOLD, fontSize: 15, fontFamily: "inherit", fontWeight: 700, textAlign: "center", outline: "none" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 3 }}>Scene name</label>
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", borderRadius: 4, border: "1px solid #444", background: "#1a1a1a", color: "#eee", fontSize: 14, fontFamily: "inherit", outline: "none" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={confirm} style={{ ...BTN.primary, flex: 1 }}>✓ Confirm</button>
            <button onClick={skip} style={{ ...BTN.secondary, flex: 1 }}>Skip</button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0} style={{ ...BTN.small, opacity: idx === 0 ? 0.3 : 1 }}>← Prev</button>
          <button onClick={() => setIdx(Math.min(total - 1, idx + 1))} disabled={idx === total - 1} style={{ ...BTN.small, opacity: idx === total - 1 ? 0.3 : 1 }}>Next →</button>
        </div>
        <button onClick={() => setViewAll(true)} style={BTN.small}>View All</button>
      </div>

      {items.every((b) => b.reviewed) && (
        <button onClick={finish} disabled={confirmedCount === 0} style={{ ...BTN.primary, marginTop: 14, width: "100%", fontSize: 15, opacity: confirmedCount === 0 ? 0.4 : 1 }}>
          {confirmedCount === 0 ? "No scenes confirmed — go back or View All" : "Done — View Script →"}
        </button>
      )}
      {!items.every((b) => b.reviewed) && reviewed > 0 && confirmedCount > 0 && (
        <button onClick={finish} style={{ ...BTN.secondary, marginTop: 10, width: "100%", fontSize: 12 }}>
          Finish early ({confirmedCount} confirmed)
        </button>
      )}
    </div>
  );
}
