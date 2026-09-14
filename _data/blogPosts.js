import rssParser from 'rss-parser';

const parser = new rssParser();

// Substack's description is just the subtitle, so excerpt the full post body instead.
function excerpt(text, max = 300) {
  const flat = (text || '').replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  return flat.slice(0, flat.lastIndexOf(' ', max)) + '…';
}

export default async function () {
	const url = "https://tcandk.substack.com/feed";
  const feed = await parser.parseURL(url);

  return feed.items.slice(0, 10).map(p => ({
    'blog': feed.title,
    'title': p.title,
    'summary': excerpt(p['content:encodedSnippet'] || p.contentSnippet),
    'author': p.creator,
    'link': p.link,
    'pubDate': p.pubDate,
    'timestamp': p.isoDate,
  }));
};
