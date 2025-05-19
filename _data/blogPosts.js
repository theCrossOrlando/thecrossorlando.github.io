import rssParser from 'rss-parser';

const parser = new rssParser();

export default async function () {
	const url = "https://tcandk.wordpress.com/feed/";
  const feed = await parser.parseURL(url);

  return feed.items.map(p => ({
    'blog': feed.title,
    'title': p.title,
    'summary': p.contentSnippet,
    'author': p.creator,
    'link': p.link,
    'pubDate': p.pubDate,
    'timestamp': p.isoDate,
  }));
};
