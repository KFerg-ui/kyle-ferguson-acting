import { useState, useMemo } from "react";
import { groupSimilarCharacters } from "../lib/local-parser";

const GOLD = "#c9a227";

const BTN_SECONDARY = {
  padding: "9px 18px",
  borderRadius: 5,
  border: "1px solid #444",
  background: "transparent",
  color: "#aaa",
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
  textTransform: "uppercase",
};

export default function CharacterStep({ characters, formatInfo, dialogueEntries, onSelect }) {
  const [mergeTarget, setMergeTarget] = useState(null);

  const groups = useMemo(
    () => groupSimilarCharacters(characters),
    [characters]
  );

  const lineCounts = useMemo(() => {
    const counts = {};
    (dialogueEntries || []).forEach((d) => {
      if (d.type === "dialogue" && d.character) {
        counts[d.character] = (counts[d.character] || 0) + 1;
      }
    });
    return counts;
  }, [dialogueEntries]);

  const handleClick = (char) => {
    let canonical = char;
    let variants = [char];
    for (const [key, members] of groups) {
      if (members.includes(char)) {
        canonical = key;
        variants = members;
        break;
      }
    }

    if (variants.length === 1) {
      onSelect(char, [char]);
      return;
    }

    setMergeTarget({
      canonical,
      variants,
      checked: new Set(variants),
    });
  };

  const toggleVariant = (name) => {
    setMergeTarget((prev) => {
      const next = new Set(prev.checked);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return { ...prev, checked: next };
    });
  };

  const confirmMerge = () => {
    const merged = Array.from(mergeTarget.checked);
    onSelect(mergeTarget.canonical, merged);
    setMergeTarget(null);
  };

  const rejectMerge = () => {
    onSelect(mergeTarget.canonical, [mergeTarget.canonical]);
    setMergeTarget(null);
  };

  // --- Merge dialog ---
  if (mergeTarget) {
    return (
      <div style={{ animation: "fadeIn 0.2s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <p style={{ fontSize: 16, color: "#eee", fontWeight: 700, marginBottom: 4 }}>
            Same character?
          </p>
          <p style={{ fontSize: 12, color: "#888" }}>
            We found similar names. Check all that refer to the same person.
          </p>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid #333",
          borderRadius: 8,
          padding: "14px 16px",
          marginBottom: 14,
        }}>
          {mergeTarget.variants.map((name, i) => (
            <label
              key={name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderBottom: i < mergeTarget.variants.length - 1 ? "1px solid #222" : "none",
                cursor: "pointer",
                fontSize: 14,
                color: mergeTarget.checked.has(name) ? "#eee" : "#666",
              }}
            >
              <input
                type="checkbox"
                checked={mergeTarget.checked.has(name)}
                onChange={() => toggleVariant(name)}
                style={{ accentColor: GOLD }}
              />
              <span style={{ flex: 1, textTransform: "uppercase" }}>{name}</span>
              <span style={{ fontSize: 11, color: "#666" }}>
                {lineCounts[name] || 0} lines
              </span>
            </label>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={confirmMerge}
            disabled={mergeTarget.checked.size === 0}
            style={{
              ...BTN_SECONDARY,
              flex: 1,
              background: GOLD,
              color: "#111",
              fontWeight: 700,
              border: "none",
              opacity: mergeTarget.checked.size === 0 ? 0.4 : 1,
            }}
          >
            Confirm &mdash; I am {mergeTarget.canonical}
          </button>
          <button
            onClick={rejectMerge}
            style={{ ...BTN_SECONDARY, flex: 1 }}
          >
            No, different people
          </button>
        </div>
      </div>
    );
  }

  // --- Normal character grid ---
  const displayCharacters = Array.from(groups.keys()).sort();

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>&#127917;</div>
        <p style={{ fontSize: 16, color: "#eee", fontWeight: 700, marginBottom: 4 }}>
          Who are you playing?
        </p>
        <p style={{ fontSize: 12, color: "#888" }}>
          {displayCharacters.length} characters detected
          {formatInfo && <span> &middot; {formatInfo}</span>}
        </p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        {displayCharacters.map((char) => {
          const group = groups.get(char);
          const hasVariants = group && group.length > 1;
          return (
            <button
              key={char}
              onClick={() => handleClick(char)}
              style={BTN_SECONDARY}
            >
              {char}
              {hasVariants && (
                <span style={{ marginLeft: 6, fontSize: 10, color: GOLD, opacity: 0.7 }}>
                  +{group.length - 1}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
