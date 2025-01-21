import Fetch from "@11ty/eleventy-fetch";
import xpath from 'xpath';
import { DOMParser } from 'xmldom';

export default async function () {
  const select = xpath.useNamespaces({"xlink":"http://www.w3.org/1999/xlink", "ODM":"http://www.cdisc.org/ns/odm/v1.3", "def":"http://www.cdisc.org/ns/def/v2.0"});
	const url = "https://tcandk.wordpress.com/feed/";

	const xml = await Fetch(url, {
		duration: "1d",
		type: "xml",
	});

  const doc = new DOMParser().parseFromString(xml);
  const blog_title = select('/rss/channel/title', doc)[0].firstChild.data;
  const blog_posts = select('/rss//item', doc);

  return blog_posts.map(p => ({
    'blog': blog_title,
    'title': p.getElementsByTagName('title')[0].childNodes[0].data,
    'summary': p.getElementsByTagName('description')[0].childNodes[0].data,
    'author': p.getElementsByTagName('dc:creator')[0].childNodes[0].data,
    'link': p.getElementsByTagName('link')[0].childNodes[0].data,
    'pubDate': p.getElementsByTagName('pubDate')[0].childNodes[0].data,
    'timestamp': new Date(p.getElementsByTagName('pubDate')[0].childNodes[0].data),
  }));
};
