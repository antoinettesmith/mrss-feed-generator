# MRSS Feed URL Generator

A simple web app that generates **MRSS (Media RSS) feed URLs** from a YouTube channel ID or playlist ID.

## Features

- **YouTube** – Generate the official feed URL: `https://www.youtube.com/feeds/videos.xml?channel_id=...` or `?playlist_id=...`
- **15 most recent videos** – The official YouTube feed includes the 15 most recent videos for a channel or playlist

## Quick start

Open `index.html` in a browser or serve the folder with any static server. No build step required.

```bash
# Option 1: Open directly
open index.html

# Option 2: Serve with a static server
npx serve .
```

## Deploy

Deploy the folder to any static host (Netlify, Vercel, GitHub Pages, etc.). No environment variables or build step required—the app uses YouTube's public feed URLs.

## Finding a YouTube channel ID

Channel IDs usually start with `UC`. To find one:

1. Open the channel on YouTube.
2. View page source (e.g. right-click → "View page source" or `view-source:` in the URL).
3. Search for `"channelId"` or `browse_id` and copy the value.

## License

Use and modify as you like.
