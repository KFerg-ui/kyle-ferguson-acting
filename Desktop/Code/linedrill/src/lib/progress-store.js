/**
 * Progress Store — persists rehearsal history in localStorage.
 *
 * Key structure: "linedrill:progress"
 * Value: { [sceneKey]: { runs: [ { score, lineCount, usedLineCount, elapsed, date, ... } ] } }
 *
 * sceneKey = `${character}::${sceneLabel}::${mode}` — unique per character+scene+mode combo.
 */

const STORAGE_KEY = "linedrill:progress";

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* quota exceeded, etc. */ }
}

function sceneKey(character, sceneLabel, mode = "standard") {
  return `${character}::${sceneLabel}::${mode}`;
}

/** Record a completed rehearsal run. */
export function saveRun(character, sceneLabel, { score, lineCount, usedLineCount, elapsed, mode = "standard", lineTimings = null }) {
  const data = load();
  const key = sceneKey(character, sceneLabel, mode);
  if (!data[key]) data[key] = { runs: [] };
  data[key].runs.push({
    score,
    lineCount,
    usedLineCount,
    elapsed,
    date: Date.now(),
    ...(lineTimings ? { lineTimings } : {}),
  });
  // Keep last 50 runs per scene to avoid unbounded growth
  if (data[key].runs.length > 50) {
    data[key].runs = data[key].runs.slice(-50);
  }
  save(data);
}

/** Get stats for a character+scene+mode. Returns null if no runs exist. */
export function getSceneStats(character, sceneLabel, mode = "standard") {
  const data = load();
  const key = sceneKey(character, sceneLabel, mode);
  let entry = data[key];

  // Fallback for legacy keys (before mode was added to key)
  if (!entry && mode === "standard") {
    const legacyKey = `${character}::${sceneLabel}`;
    entry = data[legacyKey];
  }

  if (!entry || entry.runs.length === 0) return null;

  const runs = entry.runs;
  const scores = runs.map((r) => r.score);
  const times = runs.map((r) => r.elapsed).filter(Boolean);
  const best = Math.max(...scores);
  const latest = runs[runs.length - 1];
  const avg = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);

  const result = {
    runCount: runs.length,
    best,
    latest: latest.score,
    average: avg,
    lastDate: latest.date,
  };

  // Add timing stats for speed drill
  if (mode === "speed" && times.length > 0) {
    result.bestTime = Math.min(...times);
    result.averageTime = Math.round(times.reduce((s, v) => s + v, 0) / times.length);
  }

  return result;
}

/** Clear all progress data. */
export function clearProgress() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
