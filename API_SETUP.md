# API Setup Guide

This app supports three data sources. Configure `CONFIG` at the top of `app.js`.

---

## Option 1 — eMAG Affiliate Feed (Best for Hungarian deals)

**What you get:** Real product listings with prices and images from eMAG.hu, Hungary's largest electronics retailer.

**How to get access:**
1. Go to https://affiliate.emag.hu
2. Register as an affiliate publisher (free, takes 1–3 business days to approve)
3. Once approved, go to your dashboard → **Product Feeds**
4. Copy your **Affiliate ID** (e.g. `AB1234`)
5. In `app.js`, set: `EMAG_AFFILIATE_ID: 'YOUR_ID_HERE'`
6. Set `DATA_SOURCE: 'emag'`

**Feed URL format:**
```
https://affiliate.emag.hu/feeds/{AFFILIATE_ID}/products.xml
```

---

## Option 2 — SerpApi Google Shopping (Easiest, multi-store)

**What you get:** Real-time Google Shopping results from all Hungarian stores — Alza, MediaMarkt, eMAG, etc.

**How to get access:**
1. Go to https://serpapi.com
2. Create a free account (100 searches/month free)
3. Copy your **API Key** from the dashboard
4. In `app.js`, set: `SERPAPI_KEY: 'YOUR_KEY_HERE'`
5. Set `DATA_SOURCE: 'serpapi'`

**Note:** SerpApi costs $50/mo for 5,000 searches if you exceed free tier.

---

## Option 3 — Árukereső.hu (Important note)

Árukereső's API is **seller-only** (Marketplace API). It is designed for shops that want to list products and receive orders on Árukereső — **not** for reading prices from their comparison index.

- Partner portal: https://www.arukereso.hu/admin/
- Marketplace API docs: https://www.arukereso.hu/static/marketplace-api.html
- Requirements: You must be a registered business (Hungarian company/VAT number), have a webshop, and upload a product XML feed.

For a **price comparison reader** use eMAG Affiliate or SerpApi instead.

---

## Option 4 — Mock data (default, no key needed)

Always works out of the box. Set `DATA_SOURCE: 'mock'`.
