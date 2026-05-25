// Vercel Serverless Function — /api/product
// Fetches google_product details: price history + reviews
// Usage: /api/product?id=<product_id>

module.exports = async function handler(req, res) {
  const key = process.env.SERPAPI_KEY;
  if (!key) return res.status(500).json({ error: 'SERPAPI_KEY not set.' });

  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'Missing product id.' });

  const params = new URLSearchParams({
    engine: 'google_product',
    product_id: id,
    gl: 'hu',
    hl: 'hu',
    reviews: '1',
    api_key: key
  });

  try {
    const upstream = await fetch(`https://serpapi.com/search.json?${params}`);
    if (!upstream.ok) {
      const text = await upstream.text();
      return res.status(upstream.status).json({ error: text });
    }
    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Normalise price history: array of { date, price } from SerpAPI's prices_history
    const rawHistory = (data.product_results && data.product_results.prices_history) || [];
    // SerpAPI returns prices_history as array of [timestamp_ms, price_usd] or [{date,price}]
    // Normalise both shapes and convert to HUF (approximate: *390)
    const EUR_TO_HUF = 390;
    const priceHistory = rawHistory.map(function(p) {
      if (Array.isArray(p)) {
        return { date: p[0], price: Math.round(p[1] * EUR_TO_HUF) };
      }
      return { date: p.date, price: typeof p.price === 'number' ? Math.round(p.price * EUR_TO_HUF) : p.price };
    }).slice(-12); // keep last 12 data points

    // Reviews
    const pr = (data.product_results) || {};
    const reviews = {
      rating: pr.rating || null,
      reviews: pr.reviews || null,
      review_snippets: (data.reviews_results && data.reviews_results.ratings) || []
    };

    return res.status(200).json({ priceHistory, reviews });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
