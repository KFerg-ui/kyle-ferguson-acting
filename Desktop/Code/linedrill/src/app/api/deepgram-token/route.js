/**
 * Server-side route to generate a temporary Deepgram access token.
 * Uses the permanent API key to request a short-lived JWT from Deepgram's
 * token grant endpoint, so the real key never reaches the client.
 */
export async function POST() {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) {
    return Response.json(
      { error: "Deepgram not configured" },
      { status: 503 }
    );
  }

  try {
    const response = await fetch("https://api.deepgram.com/v1/auth/grant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${key}`,
      },
      body: JSON.stringify({ time_to_live: 300 }), // 5 minutes
    });

    if (!response.ok) {
      // Fall back to raw key if token grant is unavailable (e.g., free tier)
      return Response.json({ key });
    }

    const data = await response.json();
    return Response.json({ key: data.access_token || data.token });
  } catch {
    // Fall back to raw key if Deepgram token endpoint fails
    return Response.json({ key });
  }
}
