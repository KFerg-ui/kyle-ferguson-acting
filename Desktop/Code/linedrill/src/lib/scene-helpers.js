/**
 * Scene Helpers
 *
 * Utilities for working with parsed script data: building final scenes,
 * getting dialogue for a scene, generating previews, etc.
 */

/**
 * Get all dialogue entries that fall within a specific scene break.
 */
export function getSceneDialogue(dialogueEntries, allBreaks, breakIndex) {
  const brk = allBreaks[breakIndex];
  const nextBrk =
    breakIndex + 1 < allBreaks.length ? allBreaks[breakIndex + 1] : null;
  const nextLine = nextBrk ? nextBrk.srcLine : Infinity;
  return dialogueEntries.filter(
    (d) => d.srcLine > brk.srcLine && d.srcLine < nextLine
  );
}

/**
 * Get a few lines of raw text after a break point for preview context.
 */
export function getScenePreview(rawText, srcLine, maxLines = 5) {
  const lines = rawText.split("\n");
  const preview = [];
  for (let i = srcLine + 1; i < lines.length && preview.length < maxLines; i++) {
    const t = lines[i].trim();
    if (t) preview.push(t);
  }
  return preview;
}

/**
 * Build the final array of scenes from confirmed break selections.
 */
export function buildFinalScenes(dialogueEntries, confirmedBreaks) {
  const sorted = [...confirmedBreaks].sort((a, b) => a.srcLine - b.srcLine);
  const scenes = [];

  for (let i = 0; i < sorted.length; i++) {
    const brk = sorted[i];
    const nextLine =
      i + 1 < sorted.length ? sorted[i + 1].srcLine : Infinity;

    const sceneLines = dialogueEntries
      .filter((d) => d.srcLine > brk.srcLine && d.srcLine < nextLine)
      .map((d, idx) => ({ ...d, id: `${brk.label}-${idx}` }));

    scenes.push({
      label: brk.label,
      title: brk.name,
      lines: sceneLines,
    });
  }

  return scenes;
}
