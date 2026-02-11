# MRSS Feed URL Generator

A simple web app that generates **MRSS (Media RSS) feed URLs** from a YouTube channel ID or playlist ID. Includes a Node.js backend and serverless functions that use the YouTube Data API to serve feeds with **up to 2000 videos**.

## Features

- **YouTube** – Two feed options:
  - **Official feed** – `https://www.youtube.com/feeds/videos.xml?channel_id=...` (15 most recent videos only)
  - **API-backed feed** – Up to **2000 videos** via the Node server or serverless (Vercel/Netlify)

## Quick start (frontend only)

Open `index.html` in a browser or serve the folder with any static server. No build step required for the official feed.

---

## Deploy to Vercel or Netlify

### 1. Get a YouTube API key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select an existing one
3. Enable **YouTube Data API v3** (APIs & Services → Library)
4. Create credentials → **API key**
5. **API restrictions:** Choose "Restrict key" and select **YouTube Data API v3** only
6. **Application restrictions:** Use **None** — Vercel and Netlify run on dynamic IPs, so IP restriction is not practical for serverless. Restricting the key to YouTube Data API v3 is sufficient.
7. Copy the API key

### 2. Deploy

**Vercel**

1. Push your code to GitHub and [import the repo in Vercel](https://vercel.com/new)
2. Add environment variable: `YOUTUBE_API_KEY` = your API key
3. Deploy

**Netlify**

1. Push your code to GitHub and [add the site in Netlify](https://app.netlify.com/start)
2. Set the publish directory to `.` (or leave default)
3. Add environment variable: `YOUTUBE_API_KEY` = your API key
4. Deploy

### 3. Feed URL after deploy

```
https://your-app.vercel.app/feed?channel_id=UCxxxxx&max=2000
```
or
```
https://your-app.netlify.app/feed?channel_id=UCxxxxx&max=2000
```

- `channel_id` (required) – YouTube channel ID
- `max` (optional) – Max videos to include (default: 2000, capped at 2000)

---

## Local development

```bash
cd "MRSS Feed"
cp youtube.env.example youtube.env
# Edit youtube.env and add your YOUTUBE_API_KEY

npm install
npm start
```

The server runs at `http://localhost:3000`. The **API-backed feed** output will use `http://localhost:3000/feed?channel_id=...`.

---

## API quota

YouTube Data API has a daily quota (default 10,000 units). Each feed request costs roughly 1 + ceil(videos/50) units (e.g. ~41 for 2000 videos). For heavy use, request a quota increase in Google Cloud Console.

## Finding a YouTube channel ID

Channel IDs usually start with `UC`. To find one:

1. Open the channel on YouTube.
2. View page source (e.g. right-click → "View page source" or `view-source:` in the URL).
3. Search for `"channelId"` or `browse_id` and copy the value.

## License

Use and modify as you like.
