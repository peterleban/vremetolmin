# Vreme Tolmin PWA

Weather app for vremetolmin.si — deployable as a PWA on Vercel.

## Quick start

```bash
npm install
npx vercel dev   # runs both Vite frontend + /api/weather serverless function locally
```

## Deploy to Vercel

```bash
npm install
npx vercel
```

Vercel auto-detects Vite and the `/api` serverless functions. Done.

## Install as Android app

1. Open your Vercel URL in Chrome on Android
2. Tap the "Add to Home screen" banner or Menu → Install app
3. Done — works like a native app

## Data source

All live weather data comes from:
  `https://www.vremetolmin.si/tag_main.html`

This is a pipe-separated text file written every minute by Weather Display
from the Davis weather station. No paid APIs, no LLM — pure scraping.

Nearby stations and forecast are scraped from the vremetolmin.si HTML pages.
