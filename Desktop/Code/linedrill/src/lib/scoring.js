/**
 * Scoring — word-level Levenshtein distance and line/scene scoring.
 */

/** Strip punctuation (keep apostrophes), lowercase, collapse whitespace. */
export function normalizeForScoring(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Word-level Levenshtein edit distance (insertions, deletions, substitutions). */
export function levenshteinWords(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Score a single line. Returns { score: 0-100, distance, total }.
 * `expected` and `spoken` are raw strings (will be normalized).
 */
export function scoreLine(expected, spoken) {
  const expWords = normalizeForScoring(expected).split(" ").filter(Boolean);
  const spkWords = normalizeForScoring(spoken).split(" ").filter(Boolean);

  if (expWords.length === 0) return { score: 100, distance: 0, total: 0 };
  if (spkWords.length === 0) return { score: 0, distance: expWords.length, total: expWords.length };

  const distance = levenshteinWords(expWords, spkWords);
  const total = expWords.length;
  const score = Math.max(0, Math.round(((total - distance) / total) * 100));

  return { score, distance, total };
}

/**
 * Check if the user has finished saying the line by comparing the tail of
 * the spoken transcript against the tail of the expected line.
 * Returns true when the spoken words cover most of the expected line AND
 * the last 2-3 words match the ending of the expected text.
 */
export function isLineComplete(expected, spoken) {
  const expWords = normalizeForScoring(expected).split(" ").filter(Boolean);
  const spkWords = normalizeForScoring(spoken).split(" ").filter(Boolean);

  if (expWords.length === 0) return true;
  if (spkWords.length === 0) return false;

  // Must have said at least 70% of the expected word count
  if (spkWords.length < expWords.length * 0.7) return false;

  // Check if the last N words of the spoken transcript match the tail of the expected line
  const tailLen = Math.min(3, expWords.length);
  const expTail = expWords.slice(-tailLen);
  const spkTail = spkWords.slice(-tailLen);

  if (spkTail.length < tailLen) return false;

  let matches = 0;
  for (let i = 0; i < tailLen; i++) {
    if (expTail[i] === spkTail[i]) matches++;
  }

  // At least 2 of the last 3 words match (or 1 of 1 for very short lines)
  return matches >= Math.max(1, tailLen - 1);
}

/**
 * Aggregate scene score from an array of line results.
 * Each entry: { lineId, expected, spoken, score, usedLine }
 * Returns { aggregate: 0-100, lineCount, usedLineCount }.
 */
export function scoreScene(lineScores) {
  if (lineScores.length === 0) return { aggregate: 0, lineCount: 0, usedLineCount: 0 };

  let totalPoints = 0;
  let maxPoints = 0;

  for (const ls of lineScores) {
    totalPoints += ls.usedLine ? Math.max(0, ls.score - 7) : ls.score;
    maxPoints += 100;
  }

  return {
    aggregate: maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0,
    lineCount: lineScores.length,
    usedLineCount: lineScores.filter((s) => s.usedLine).length,
  };
}
