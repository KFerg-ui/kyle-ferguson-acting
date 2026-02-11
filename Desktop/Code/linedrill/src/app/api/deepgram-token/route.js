export async function POST() {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) {
    return Response.json(
      { error: "Deepgram not configured" },
      { status: 503 }
    );
  }
  return Response.json({ key });
}
