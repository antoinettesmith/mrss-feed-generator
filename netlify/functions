const DEFAULT_MAX = 2000;

async function getChannelInfo(channelId, apiKey) {
  const url = new URL('https://www.googleapis.com/youtube/v3/channels');
  url.searchParams.set('part', 'contentDetails,snippet');
  url.searchParams.set('id', channelId);
  url.searchParams.set('key', apiKey);
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `channels.list failed: ${res.status}`);
  const item = data.items?.[0];
  if (!item) throw new Error('Channel not found');
  return {
    uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads,
    channelTitle: item.snippet.title,
    channelDescription: item.snippet.description || '',
  };
}

async function getPlaylistItems(playlistId, maxItems, apiKey) {
  const items = [];
  let pageToken;
  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('maxResults', '50');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    url.searchParams.set('key', apiKey);
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `playlistItems.list failed: ${res.status}`);
    items.push(...(data.items || []));
    pageToken = data.nextPageToken;
  } while (pageToken && items.length < maxItems);
  return items.slice(0, maxItems);
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
      return `\n    <item>\n      <title>${escapeXml(sn.title)}</title>\n      <link>${escapeXml(link)}</link>\n      <guid isPermaLink="true">${escapeXml(link)}</guid>\n      <pubDate>${pubDate}</pubDate>\n      <description>${escapeXml(sn.description || '')}</description>${thumb ? `\n      <media:thumbnail url="${escapeXml(thumb.url)}" width="${thumb.width || ''}" height="${thumb.height || ''}" />` : ''}\n    </item>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">\n  <channel>\n    <title>${escapeXml(channelTitle)}</title>\n    <link>${escapeXml(channelLink)}</link>\n    <description>${escapeXml(channelDescription)}</description>${itemXml}\n  </channel>\n</rss>`;
}

async function generateFeed({ channelId, max, apiKey }) {
  const cappedMax = Math.min(parseInt(max, 10) || DEFAULT_MAX, 2000);
  const { uploadsPlaylistId, channelTitle, channelDescription } = await getChannelInfo(channelId, apiKey);
  const items = await getPlaylistItems(uploadsPlaylistId, cappedMax, apiKey);
  return buildMrss({ channelId, channelTitle, channelDescription, items });
}

exports.handler = async function (event) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'YOUTUBE_API_KEY is not configured. Add it in your Netlify site environment variables.',
    };
  }
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
    const xml = await generateFeed({ channelId, max, apiKey });
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
