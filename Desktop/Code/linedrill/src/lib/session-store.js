/**
 * Session Store — persists script session state in localStorage.
 *
 * Key: "linedrill:session"
 * Stores: step, rawText, parsed, selectedCharacter, finalScenes, fileName, zoom, hideMyLines.
 * Does NOT store transient UI state (loading, errors, search, rehearsal).
 *
 * Designed so saveSession/loadSession can later be swapped to API calls
 * for cloud sync without changing the calling code in page.jsx.
 */

const STORAGE_KEY = "linedrill:session";
const SCHEMA_VERSION = 1;

export function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.version !== SCHEMA_VERSION) return null;
    if (!data.step || !data.rawText) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveSession({ step, rawText, parsed, selectedCharacter, finalScenes, fileName, zoom, hideMyLines }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: SCHEMA_VERSION,
      savedAt: Date.now(),
      step,
      rawText: rawText || "",
      parsed: parsed || null,
      selectedCharacter: selectedCharacter || "",
      finalScenes: finalScenes || [],
      fileName: fileName || "",
      zoom: zoom ?? 1.0,
      hideMyLines: hideMyLines ?? false,
    }));
  } catch {
    // Quota exceeded or other localStorage failure — silently ignore
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
