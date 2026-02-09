/**
 * AI-First Script Analysis
 *
 * Sends script text to Claude Sonnet for intelligent structure detection.
 * Handles stage plays, screenplays, TV scripts, musicals, and mixed formats.
 */
export async function analyzeScriptWithAI(rawText) {
  const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn("No Anthropic API key set — falling back to local parser only.");
    return null;
  }

  try {
    const chunk = rawText.substring(0, 25000);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: `You are analyzing a play or screenplay script that was extracted from a PDF or Word document. The extraction may have lost formatting like centering, indentation, and page breaks, so you need to infer structure from context.

IMPORTANT: Scripts come in many formats:
- Stage plays: Use "ACT I", "ACT ONE", "Act 1" headings, then "Scene 1" etc. Character names may be centered ALL CAPS on their own line, or "CHARACTER:" at left margin.
- Screenplays: Use slug lines like "INT. LOCATION - DAY". Character names centered ALL CAPS.
- TV scripts: May have "COLD OPEN", "TEASER", act breaks.
- Musical theater: May have song numbers as breaks.
- Some scripts use "PART" instead of "ACT".
- Some scripts number scenes without act numbers.
- Stage directions may be in (parentheses), [brackets], or italicized.

Your job:
1. Identify ALL characters who speak dialogue. A character name appears before dialogue — either on its own line in ALL CAPS, or as "NAME:" or "NAME." at the start of a line.
2. Identify every structural break in the script — acts, scenes, parts, slug lines, or any other division the author uses. For each break, give me the EXACT text from the script that marks it and roughly where it falls.
3. Tell me what format this script uses.

Return ONLY a JSON object with this exact structure:
{
  "format": "stage_play" | "screenplay" | "tv_script" | "other",
  "formatDescription": "brief description of how this script is formatted",
  "characters": ["CHARACTER1", "CHARACTER2", ...],
  "characterFormat": "centered_caps" | "name_colon" | "name_period" | "mixed",
  "breaks": [
    {
      "exactText": "the exact line from the script marking this break",
      "type": "act" | "scene" | "slugline" | "part" | "song" | "other",
      "suggestedLabel": "1.1",
      "suggestedName": "Act 1, Scene 1 - The Drawing Room"
    }
  ]
}

For suggestedLabel, use the format "ActNumber.SceneNumber" (e.g. "1.1", "1.2", "2.1"). If there are no acts, just use scene numbers like "1", "2", "3". If there are acts but no scenes within them, use "1", "2", "3" for the acts.

Be thorough — find EVERY break, even subtle ones. Include the EXACT text as it appears.

Here is the script text:

${chunk}`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data.error?.message || `API returned ${response.status}`;
      console.error("AI API error:", msg);
      return null;
    }

    const text = data.content?.[0]?.text || "";
    if (!text) {
      console.error("AI returned empty response");
      return null;
    }

    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch (err) {
    console.error("AI analysis failed:", err);
    return null;
  }
}
