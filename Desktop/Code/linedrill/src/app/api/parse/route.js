/**
 * Server-side API route for AI script parsing.
 * Proxies requests to Claude Sonnet so the API key stays server-side.
 */
export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Server misconfigured — no ANTHROPIC_API_KEY" },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { text } = body;
  if (!text || typeof text !== "string") {
    return Response.json({ error: "Missing 'text' field" }, { status: 400 });
  }

  const chunk = text.substring(0, 25000);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
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
      const msg = data.error?.message || `Anthropic API returned ${response.status}`;
      return Response.json({ error: msg }, { status: response.status });
    }

    const resultText = data.content?.[0]?.text || "";
    if (!resultText) {
      return Response.json({ error: "AI returned empty response" }, { status: 502 });
    }

    const parsed = JSON.parse(resultText.replace(/```json|```/g, "").trim());
    return Response.json(parsed);
  } catch (err) {
    console.error("AI parse route error:", err);
    return Response.json(
      { error: "AI analysis failed" },
      { status: 500 }
    );
  }
}
