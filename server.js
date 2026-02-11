import express from 'express';
import dotenv from 'dotenv';
import { generateFeed } from './lib/feed.js';

dotenv.config({ path: 'youtube.env' });

const app = express();
const API_KEY = process.env.YOUTUBE_API_KEY;
const PORT = process.env.PORT || 3000;

app.use(express.static('.'));

app.get('/feed', async (req, res) => {
  if (!API_KEY) {
    res.status(500).send('YOUTUBE_API_KEY is not configured. Add it to .env and restart.');
    return;
  }

  try {
    const channelId = req.query.channel_id?.trim();
    const max = req.query.max;

    if (!channelId) {
      res.status(400).send('Missing channel_id. Use ?channel_id=UCxxxx');
      return;
    }

    const xml = await generateFeed({ channelId, max, apiKey: API_KEY });
    res.set('Content-Type', 'application/rss+xml; charset=utf-8').send(xml);
  } catch (err) {
    console.error(err);
    res.status(500).send(`Error: ${err.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`MRSS server at http://localhost:${PORT}`);
  if (!API_KEY) {
    console.warn('WARNING: YOUTUBE_API_KEY not set. Add it to .env for /feed to work.');
  }
});
