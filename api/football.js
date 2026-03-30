// Vercel serverless function — proxies to api-football.com (api-sports.io)
// API key stays server-side; never exposed to the browser.
// Usage: /api/football?endpoint=standings&league=341&season=2025

const BASE_URL = "https://v3.football.api-sports.io";

export default async function handler(req, res) {
  try {
    const { endpoint, ...params } = req.query;

    if (!endpoint || typeof endpoint !== "string") {
      return res.status(400).json({ error: "Missing required query param: endpoint" });
    }

    if (!/^[\w\-/]+$/.test(endpoint)) {
      return res.status(400).json({ error: "Invalid endpoint" });
    }

    const token = process.env.API_FOOTBALL_TOKEN;
    if (!token) {
      console.error("[football] API_FOOTBALL_TOKEN is not set");
      return res.status(500).json({ error: "API_FOOTBALL_TOKEN env var not set" });
    }

    const qs = new URLSearchParams(params).toString();
    const url = `${BASE_URL}/${endpoint}${qs ? "?" + qs : ""}`;
    console.log(`[football] → ${url}`);

    const upstream = await fetch(url, {
      headers: { "x-apisports-key": token },
    });

    const data = await upstream.json();
    console.log(`[football] ← ${upstream.status}, errors:`, data.errors);

    const isLive = endpoint === "fixtures" && params.live;
    const maxAge = isLive ? 60 : 3600;
    res.setHeader("Cache-Control", `s-maxage=${maxAge}, stale-while-revalidate`);

    res.status(upstream.status).json(data);
  } catch (err) {
    console.error("[football] Unhandled error:", err);
    res.status(500).json({ error: err.message });
  }
}
