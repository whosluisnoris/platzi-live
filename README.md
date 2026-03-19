# Platzi Live

A web app that monitors the [Platzi](https://platzi.com) YouTube channel for live streams and displays them as watchable cards — either embedded inline or opening on YouTube.

## Features

- Polls automatically every 5 minutes (no page refresh needed)
- Manual "Refresh" button for on-demand checks
- Embedded iframe player (stops when you close the modal)
- No YouTube Data API key required

## Stack

- **Next.js 15** (App Router) — server-side proxy + React frontend
- **TypeScript**
- **Tailwind CSS v4**
- YouTube channel page scraping as data source (no API key needed)

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Test the UI with a known video** (dev only):
```
http://localhost:3000?test=VIDEO_ID
```

## Deploy

Deploy to [Vercel](https://vercel.com) with zero configuration — connect this repo and it works out of the box.
