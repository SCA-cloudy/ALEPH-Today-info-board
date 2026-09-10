export default async function handler(req, res) {
  try {
    const upstream = await fetch(
      "https://rss.marketingtools.apple.com/api/v2/kr/music/most-played/50/songs.json",
      { headers: { "Accept": "application/json" } }
    );

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: "upstream_error", status: upstream.status });
      return;
    }

    const data = await upstream.json();
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    res.status(200).json(data);
  } catch (e) {
    res.status(502).json({ error: "fetch_failed", message: String(e) });
  }
}
