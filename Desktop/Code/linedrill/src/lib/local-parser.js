/**
 * Local Script Parser (Fallback)
 *
 * Regex-based parser that detects characters, scene breaks, and dialogue.
 * Used when the AI parser is unavailable or as a complement to merge with AI results.
 */

// --- Character name normalization & filtering ---

const NON_CHARACTER_EXACT = new Set([
  "DRAMATIS PERSONAE", "CAST OF CHARACTERS", "CHARACTERS", "CAST",
  "SETTING", "SETTINGS", "TIME", "PLACE", "SCENE", "SYNOPSIS",
  "NOTES", "NOTE", "PROLOGUE", "EPILOGUE", "INTERMISSION",
  "CURTAIN", "BLACKOUT", "END", "THE END", "FIN",
  "FADE IN", "FADE OUT", "CUT TO", "CONTINUED", "CONT'D", "MORE",
  "END OF ACT", "AUTHOR'S NOTE", "TRANSLATOR'S NOTE",
]);

const NON_CHARACTER_PATTERNS = [
  /^BY\s/,
  /^TRANSLATED\s/,
  /^ADAPTED\s/,
  /^WRITTEN\s/,
  /^DIRECTED\s/,
  /^ACT\s/,
  /^SCENE\s/,
  /^PART\s/,
  /^(INT|EXT|INT\/EXT)\./,
  /^(COLD OPEN|TEASER)\b/,
  /^COPYRIGHT/,
  /^\d+\.?\s*$/,
];

export function normalizeCharacterName(raw) {
  let name = raw.trim().toUpperCase();
  // Strip parentheticals: (cont'd), (V.O.), (O.S.), etc.
  name = name.replace(/\s*\(.*?\)\s*/g, " ");
  // Strip trailing periods
  name = name.replace(/\.+$/, "");
  // Normalize common abbreviated titles: MRS. → MRS, DR. → DR, etc.
  name = name.replace(/\b(MRS?|DR|ST|SGT|CPT|LT|GEN|COL|PROF|REV|SR|JR)\./g, "$1");
  // Collapse whitespace
  name = name.replace(/\s{2,}/g, " ").trim();
  return name;
}

function isBlockedCharacter(name) {
  if (!name || name.length < 2) return true;
  if (NON_CHARACTER_EXACT.has(name)) return true;
  if (NON_CHARACTER_PATTERNS.some((p) => p.test(name))) return true;
  return false;
}

export function groupSimilarCharacters(characters) {
  const sorted = [...characters].sort((a, b) => a.length - b.length);
  const groups = new Map();
  const assigned = new Set();

  for (let i = 0; i < sorted.length; i++) {
    if (assigned.has(sorted[i])) continue;

    const base = sorted[i];
    const group = [base];
    assigned.add(base);

    for (let j = i + 1; j < sorted.length; j++) {
      if (assigned.has(sorted[j])) continue;
      if (
        sorted[j].startsWith(base + " ") ||
        sorted[j].startsWith(base + ".")
      ) {
        group.push(sorted[j]);
        assigned.add(sorted[j]);
      }
    }

    groups.set(base, group);
  }

  return groups;
}

/**
 * Auto-merge ALL prefix-variant characters into their canonical (shortest) form.
 * Called after character selection to ensure partner characters are clean.
 * Returns updated characters, dialogueEntries, and characterMeta.
 */
export function autoMergeAllCharacters(parsed) {
  const groups = groupSimilarCharacters(parsed.characters);
  const merges = new Map(); // variant → canonical

  for (const [canonical, variants] of groups) {
    for (const v of variants) {
      if (v !== canonical) merges.set(v, canonical);
    }
  }

  // Nothing to merge
  if (merges.size === 0) return parsed;

  // Merge dialogue entries
  const updatedEntries = parsed.dialogueEntries.map((d) => {
    if (d.type === "dialogue" && merges.has(d.character)) {
      return { ...d, character: merges.get(d.character) };
    }
    return d;
  });

  // Merge character list
  const seen = new Set();
  const updatedChars = [];
  for (const c of parsed.characters) {
    const canonical = merges.get(c) || c;
    if (!seen.has(canonical)) {
      seen.add(canonical);
      updatedChars.push(canonical);
    }
  }

  // Merge characterMeta — canonical keeps its meta, variants' meta is discarded
  // (canonical is the shortest name, which is usually the correct one)
  const updatedMeta = { ...(parsed.characterMeta || {}) };
  for (const [variant, canonical] of merges) {
    if (updatedMeta[variant] && !updatedMeta[canonical]) {
      updatedMeta[canonical] = updatedMeta[variant];
    }
    delete updatedMeta[variant];
  }

  return {
    ...parsed,
    characters: updatedChars.sort(),
    dialogueEntries: updatedEntries,
    characterMeta: updatedMeta,
  };
}

// --- Main parser ---

export function localParseScript(rawText) {
  const lines = rawText.split("\n");
  const characters = new Set();
  const breaks = [];
  const dialogueEntries = [];
  let currentCharacter = null;
  let currentDialogue = "";
  let currentLineIdx = 0;

  const breakPatterns = [
    {
      pattern:
        /^ACT\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|\d+|I{1,3}V?|IV|VI{0,3})\b/i,
      type: "act",
    },
    { pattern: /^(SCENE|SECTION)\s+(\w+)/i, type: "scene" },
    { pattern: /^PART\s+(\w+)/i, type: "part" },
    { pattern: /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s+/i, type: "slugline" },
    {
      pattern:
        /^(COLD OPEN|TEASER|PROLOGUE|EPILOGUE|INTERMISSION|INTERLUDE)\b/i,
      type: "scene",
    },
    { pattern: /^(FADE IN|FADE OUT)\s*[:.]?\s*$/i, type: "transition" },
  ];

  const charColonPattern = /^([A-Z][A-Z\s.'\-]{0,28})\s*[:]\s*(.*)/;
  const charPeriodPattern = /^([A-Z]{2,25})\.\s+(.*)/;
  const charParenPattern = /^([A-Z][A-Z\s.'\-]{1,25})\s*(\(.*?\))?\s*$/;

  function flush() {
    if (currentCharacter && currentDialogue.trim()) {
      const normalized = normalizeCharacterName(currentCharacter);
      if (normalized && !isBlockedCharacter(normalized)) {
        characters.add(normalized);
        dialogueEntries.push({
          type: "dialogue",
          character: normalized,
          text: currentDialogue.trim(),
          srcLine: currentLineIdx,
        });
      }
    }
    currentDialogue = "";
  }

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      flush();
      currentCharacter = null;
      continue;
    }

    // Check break patterns
    let isBreak = false;
    for (const bp of breakPatterns) {
      if (bp.pattern.test(trimmed)) {
        flush();
        currentCharacter = null;
        breaks.push({
          exactText: trimmed,
          type: bp.type,
          suggestedName: trimmed,
          suggestedLabel: `${breaks.length + 1}`,
          srcLine: i,
        });
        isBreak = true;
        break;
      }
    }
    if (isBreak) continue;

    // Skip residual page numbers (bare numbers that survived extraction cleanup)
    if (/^\d{1,4}$/.test(trimmed)) continue;

    // Stage directions in brackets/parens
    if (/^\s*[\[\(]/.test(trimmed) && /[\]\)]\s*$/.test(trimmed)) {
      flush();
      currentCharacter = null;
      dialogueEntries.push({ type: "direction", text: trimmed, srcLine: i });
      continue;
    }

    // CHARACTER: dialogue
    const cm1 = trimmed.match(charColonPattern);
    if (cm1) {
      flush();
      currentCharacter = cm1[1].trim();
      currentDialogue = cm1[2] || "";
      currentLineIdx = i;
      continue;
    }

    // CHARACTER. dialogue
    const cm2 = trimmed.match(charPeriodPattern);
    if (cm2 && cm2[1].length >= 2) {
      flush();
      currentCharacter = cm2[1].trim();
      currentDialogue = cm2[2] || "";
      currentLineIdx = i;
      continue;
    }

    // Centered CHARACTER NAME (all caps alone, next line is dialogue)
    if (charParenPattern.test(trimmed) && trimmed.length <= 30) {
      const nextLine = (lines[i + 1] || "").trim();
      if (
        nextLine &&
        !/^[A-Z]{2,25}\s*$/.test(nextLine) &&
        !breakPatterns.some((bp) => bp.pattern.test(nextLine))
      ) {
        flush();
        currentCharacter = trimmed.replace(/\s*\(.*?\)\s*$/, "").trim();
        currentDialogue = "";
        currentLineIdx = i;
        continue;
      }
    }

    // Continuation of current dialogue
    if (currentCharacter) {
      currentDialogue += " " + trimmed;
      continue;
    }

    // Likely continuation after a page break — if the last entry was dialogue
    // and either: this line starts lowercase (mid-sentence) or the previous
    // dialogue ended without terminal punctuation (period, !, ?)
    const lastEntry = dialogueEntries[dialogueEntries.length - 1];
    const startsLower = /^[a-z]/.test(trimmed);
    const lastEndsMidSentence = lastEntry?.type === "dialogue" &&
      !/[.!?…"')\]]$/.test(lastEntry.text.trim());
    if (lastEntry?.type === "dialogue" && (startsLower || lastEndsMidSentence)) {
      // Reopen the dialogue so subsequent lines also merge
      currentCharacter = lastEntry.character;
      currentDialogue = lastEntry.text + " " + trimmed;
      currentLineIdx = lastEntry.srcLine;
      dialogueEntries.pop();
      continue;
    }

    // Unattributed text = stage direction
    dialogueEntries.push({ type: "direction", text: trimmed, srcLine: i });
  }

  flush();

  return {
    characters: Array.from(characters).sort(),
    breaks,
    dialogueEntries,
    format: "unknown",
  };
}

/**
 * Merge AI results with local parser results.
 * AI provides better break detection; local parser provides line-by-line dialogue.
 */
export function mergeResults(aiResult, localResult, rawText) {
  const lines = rawText.split("\n");

  // Characters: union of both, normalized and filtered
  // AI may return objects {name, gender, ageRange, description} or plain strings
  const charSet = new Set();
  const characterMeta = {};

  (localResult.characters || []).forEach((c) => {
    const norm = normalizeCharacterName(c);
    if (norm && !isBlockedCharacter(norm)) {
      charSet.add(norm);
      if (!characterMeta[norm]) {
        characterMeta[norm] = { gender: "unknown", ageRange: "unknown", description: "" };
      }
    }
  });
  if (aiResult?.characters) {
    aiResult.characters.forEach((c) => {
      const isObj = typeof c === "object" && c !== null;
      const rawName = isObj ? c.name : c;
      const norm = normalizeCharacterName(rawName || "");
      if (norm && !isBlockedCharacter(norm)) {
        charSet.add(norm);
        if (isObj) {
          characterMeta[norm] = {
            gender: c.gender || "unknown",
            ageRange: c.ageRange || "unknown",
            description: c.description || "",
          };
        } else if (!characterMeta[norm]) {
          characterMeta[norm] = { gender: "unknown", ageRange: "unknown", description: "" };
        }
      }
    });
  }

  // Normalize dialogue entry character names as safety net
  const dialogueEntries = (localResult.dialogueEntries || []).map((d) => {
    if (d.type === "dialogue" && d.character) {
      return { ...d, character: normalizeCharacterName(d.character) };
    }
    return d;
  });

  // Breaks: prefer AI, fall back to local
  let breaks = [];
  if (aiResult?.breaks?.length > 0) {
    breaks = aiResult.breaks
      .map((brk, idx) => {
        let srcLine = -1;
        const searchText = brk.exactText.trim().toLowerCase();

        // Exact match
        for (let i = 0; i < lines.length; i++) {
          if (
            lines[i].trim().toLowerCase().includes(searchText) ||
            lines[i].trim().toLowerCase() === searchText
          ) {
            srcLine = i;
            break;
          }
        }

        // Fuzzy: first few words
        if (srcLine === -1) {
          const words = searchText.split(/\s+/).slice(0, 3).join(" ");
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().toLowerCase().startsWith(words)) {
              srcLine = i;
              break;
            }
          }
        }

        return {
          ...brk,
          srcLine,
          suggestedLabel: brk.suggestedLabel || `${idx + 1}`,
          suggestedName: brk.suggestedName || brk.exactText,
        };
      })
      .filter((b) => b.srcLine >= 0);
  }

  if (breaks.length === 0) {
    breaks = localResult.breaks || [];
  }

  // Auto-merge character variants that normalized to identical names
  // (e.g., "MRS. JONES" and "MRS JONES" both normalize to "MRS JONES")
  // Also merge prefix variants: dialogue from "ROMEO (CONT'D)" already normalized to "ROMEO"
  // Consolidate characterMeta — prefer the entry with actual metadata
  const finalChars = Array.from(charSet).sort();

  // Deduplicate dialogue entries by re-normalizing character names
  const finalEntries = dialogueEntries.map((d) => {
    if (d.type === "dialogue" && d.character) {
      const norm = normalizeCharacterName(d.character);
      if (norm !== d.character) return { ...d, character: norm };
    }
    return d;
  });

  // Rebuild charSet from actual dialogue to eliminate phantom characters
  const activeChars = new Set();
  for (const d of finalEntries) {
    if (d.type === "dialogue" && d.character) activeChars.add(d.character);
  }
  // Keep AI-only characters (may appear later in script beyond our 25K window)
  for (const c of finalChars) {
    activeChars.add(c);
  }

  return {
    characters: Array.from(activeChars).sort(),
    characterMeta,
    breaks,
    dialogueEntries: finalEntries,
    format: aiResult?.format || "unknown",
    formatDescription: aiResult?.formatDescription || "",
  };
}
