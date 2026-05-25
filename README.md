# PricePulse HU

Open source price comparison and deal finder for Hungarian electronics stores.
Tracks Alza, MediaMarkt, eMAG, Extreme Digital, Euronics, iStyle and more.

Live site: https://pricepulse-hu.vercel.app

---

## How it works

The app fetches live product data using the SerpApi Google Shopping API, filtered to Hungarian retailers.
A Vercel serverless function at /api/search acts as a secure proxy so the API key is never exposed in client-side code or in this repository.

---

## Self-hosting

### 1. Get a SerpApi key

- Go to https://serpapi.com
- Create a free account (100 searches per month on the free plan)
- Copy your API key from the dashboard at https://serpapi.com/manage-api-key

### 2. Clone the repo

```
git clone https://github.com/oliprovscode/hu-deals-finder.git
cd hu-deals-finder
```

### 3. Set the environment variable

Create a `.env` file locally (never commit this file):

```
SERPAPI_KEY=your_key_here
```

Or if deploying to Vercel:
1. Open your project in the Vercel dashboard
2. Go to Settings > Environment Variables
3. Add key: `SERPAPI_KEY`, value: your key
4. Redeploy

### 4. Deploy

Vercel (recommended):
```
npm i -g vercel
vercel
```

Or import the GitHub repo directly at vercel.com/new.

---

## Tech stack

- Vanilla HTML, CSS, JavaScript (no framework, no build step)
- SerpApi Google Shopping API for live deal data
- Vercel serverless function for secure API key proxying
- localStorage for watchlist persistence
- Deployed on Vercel

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## License

MIT — see LICENSE file.
