import express from 'express';
import dotenv from 'dotenv';
import { generateFeed } from './lib/feed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('.'));

app.get('/feed', async (req, res) => {
  try {
    const channelId = req.query.channel_id?.trim();
    const max = req.query.max;

    if (!channelId) {
      res.status(400).send('Missing channel_id. Use ?channel_id=UCxxxx');
      return;
    }

    const xml = await generateFeed({ channelId, max });
    res.set('Content-Type', 'application/rss+xml; charset=utf-8').send(xml);
  } catch (err) {
    console.error(err);
    res.status(500).send(`Error: ${err.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`MRSS server at http://localhost:${PORT}`);
});
