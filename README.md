# PricePulse HU

**Open source price comparison and deal tracker for Hungarian shoppers.**
Search across electronics, watches, skincare, fashion, home, beauty, sports and more — all in one place.

🌐 **Live site:** https://hu-deals-finder.vercel.app

---

## Features

- 🔍 Search any product in Hungarian or English
- 🛍️ Results from 100+ Hungarian shops via Google Shopping
- 📦 Categories: Electronics, Watches, Skincare, Fashion, Beauty, Home, Sports, Toys
- 💰 Price comparison with discount badges
- 👁️ Watchlist — save deals to localStorage
- 🌍 Hungarian / English language toggle
- ⚡ Skeleton loading for smooth UX
- 🔒 API key never exposed client-side (Vercel serverless proxy)
- 🚫 No ads, no tracking, no paywall

---

## How it works

The app fetches live product data using the **SerpApi Google Shopping API**, filtered to Hungarian retailers (`gl=hu&hl=hu`).
A Vercel serverless function at `/api/search` acts as a secure proxy so the API key is never exposed in client-side code or this repository.

---

## Self-hosting

### 1. Get a SerpApi key

- Go to https://serpapi.com
- Create a free account (100 searches/month free)
- Copy your API key from https://serpapi.com/manage-api-key

### 2. Clone the repo

```bash
git clone https://github.com/oliprovscode/hu-deals-finder.git
cd hu-deals-finder
```

### 3. Set environment variable

For local dev, create a `.env` file (never commit this):

```
SERPAPI_KEY=your_key_here
```

For Vercel deployment:
1. Open your project in the Vercel dashboard
2. Go to **Settings > Environment Variables**
3. Add `SERPAPI_KEY` → your key
4. Redeploy

### 4. Deploy

```bash
npm i -g vercel
vercel
```

Or import the GitHub repo directly at https://vercel.com/new.

---

## Project structure

```
hu-deals-finder/
├── index.html        # Homepage with search + category grid + watchlist
├── search.html       # Dedicated search results page
├── app.js            # Homepage watchlist logic
├── search.js         # Search results, skeleton loading, filters, sort
├── styles.css        # All styles (flat design, responsive)
├── api/
│   └── search.js     # Vercel serverless proxy for SerpApi
├── package.json
└── vercel.json
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript (no framework) |
| Data | SerpApi Google Shopping API |
| Backend proxy | Vercel serverless function (Node.js) |
| Persistence | localStorage (watchlist) |
| Hosting | Vercel |
| i18n | Built-in HU/EN toggle |

---

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss.

```bash
# Fork → clone → make changes → open PR
git checkout -b feature/my-improvement
git commit -m "Add my improvement"
git push origin feature/my-improvement
```

---

## License

MIT — see [LICENSE](LICENSE) file.
