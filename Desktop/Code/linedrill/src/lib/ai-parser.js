/**
 * AI-First Script Analysis
 *
 * Sends script text to our server-side API route, which proxies to Claude Sonnet.
 * The API key never touches the browser.
 */
export async function analyzeScriptWithAI(rawText) {
  try {
    const response = await fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: rawText }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("AI API error:", data.error || `Status ${response.status}`);
      return null;
    }

    return data;
  } catch (err) {
    console.error("AI analysis failed:", err);
    return null;
  }
}
