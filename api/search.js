// Vercel Serverless Function — /api/search
// Uses CommonJS so Vercel Node runtime picks it up correctly.
// Set SERPAPI_KEY in Vercel dashboard > Settings > Environment Variables.

module.exports = async function handler(req, res) {
  const key = process.env.SERPAPI_KEY;
  if (!key) {
    return res.status(500).json({ error: 'SERPAPI_KEY environment variable not set.' });
  }

  const q = req.query.q || 'akcio elektronika';
  const params = new URLSearchParams({
    engine: 'google_shopping',
    q,
    gl: 'hu',
    hl: 'hu',
    api_key: key
  });

  try {
    const upstream = await fetch(`https://serpapi.com/search.json?${params}`);
    if (!upstream.ok) {
      const text = await upstream.text();
      return res.status(upstream.status).json({ error: text });
    }
    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ shopping_results: data.shopping_results || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
