const DEFAULT_MAX = 15; // YouTube's public feed returns up to 15 videos

const YOUTUBE_FEED_URL = 'https://www.youtube.com/feeds/videos.xml';

async function fetchAtomFeed(channelId) {
  const url = `${YOUTUBE_FEED_URL}?channel_id=${channelId}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch feed: ${res.status}`);
  }
  return res.text();
}

function extractTag(xml, tagName, ns = '') {
  const prefix = ns ? `${ns}:` : '';
  const pattern = new RegExp(`<${prefix}${tagName}[^>]*>([\\s\\S]*?)<\\/${prefix}${tagName}>`, 'i');
  const match = xml.match(pattern);
  return match ? match[1].trim().replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') : '';
}

function extractAttr(xml, tagName, attr) {
  const pattern = new RegExp(`<${tagName}[^>]*${attr}=["']([^"']+)["']`, 'i');
  const match = xml.match(pattern);
  return match ? match[1] : '';
}

function parseAtomFeed(xml, maxItems) {
  const channelTitle = extractTag(xml, 'title');
  const channelDescription = extractTag(xml, 'subtitle') || '';

  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
  const items = [];
  let match;
  while ((match = entryRegex.exec(xml)) !== null && items.length < maxItems) {
    const entry = match[1];
    const videoId = extractTag(entry, 'videoId', 'yt') || (extractAttr(entry, 'link', 'href') || '').split('v=')[1]?.split('&')[0];
    if (!videoId) continue;

    const title = extractTag(entry, 'title');
    const link = extractAttr(entry, 'link', 'href') || `https://www.youtube.com/watch?v=${videoId}`;
    const published = extractTag(entry, 'published');
    const description = extractTag(entry, 'description', 'media') || '';

    const thumbMatch = entry.match(/<media:thumbnail[^>]*url=["']([^"']+)["'][^>]*(?:width=["']([^"']*)["'])?[^>]*(?:height=["']([^"']*)["'])?/i);
    const thumb = thumbMatch
      ? { url: thumbMatch[1], width: thumbMatch[2] || '', height: thumbMatch[3] || '' }
      : null;

    items.push({
      snippet: {
        title,
        description,
        publishedAt: published,
        resourceId: { videoId },
        thumbnails: thumb ? { high: thumb, medium: thumb, default: thumb } : {},
      },
    });
  }

  return { channelTitle, channelDescription, items };
}

function escapeXml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildMrss({ channelId, channelTitle, channelDescription, items }) {
  const channelLink = `https://www.youtube.com/channel/${channelId}`;
  const itemXml = items
    .map((it) => {
      const sn = it.snippet;
      const vid = sn.resourceId?.videoId;
      if (!vid) return '';
      const link = `https://www.youtube.com/watch?v=${vid}`;
      const pubDate = new Date(sn.publishedAt).toUTCString();
      const thumb = sn.thumbnails?.high || sn.thumbnails?.medium || sn.thumbnails?.default;
      const thumbXml = thumb ? `\n      <media:thumbnail url="${escapeXml(thumb.url)}" width="${thumb.width || ''}" height="${thumb.height || ''}" />` : '';
      return `\n    <item>\n      <title>${escapeXml(sn.title)}</title>\n      <link>${escapeXml(link)}</link>\n      <guid isPermaLink="true">${escapeXml(link)}</guid>\n      <pubDate>${pubDate}</pubDate>\n      <description>${escapeXml(sn.description || '')}</description>\n      <enclosure url="${escapeXml(link)}" type="video/youtube" length="0" />\n      <media:group>\n      <media:content url="${escapeXml(link)}" medium="video" type="video/youtube" />${thumbXml}\n      </media:group>\n    </item>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">\n  <channel>\n    <title>${escapeXml(channelTitle)}</title>\n    <link>${escapeXml(channelLink)}</link>\n    <description>${escapeXml(channelDescription)}</description>${itemXml}\n  </channel>\n</rss>`;
}

async function generateFeed({ channelId, max }) {
  const cappedMax = Math.min(parseInt(max, 10) || DEFAULT_MAX, 15);
  const xml = await fetchAtomFeed(channelId);
  const { channelTitle, channelDescription, items } = parseAtomFeed(xml, cappedMax);

  if (!channelTitle) {
    throw new Error('Channel not found');
  }

  return buildMrss({
    channelId,
    channelTitle,
    channelDescription,
    items,
  });
}

exports.handler = async function (event) {
  const params = event.queryStringParameters || {};
  const channelId = params.channel_id?.trim();
  const max = params.max;

  if (!channelId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Missing channel_id. Use ?channel_id=UCxxxx',
    };
  }

  try {
    const xml = await generateFeed({ channelId, max });
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
      body: xml,
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: `Error: ${err.message}`,
    };
  }
};
