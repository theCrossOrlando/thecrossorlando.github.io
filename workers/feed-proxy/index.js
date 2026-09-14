// Substack 403s GitHub runners and 429s bursts, so a cron keeps the last good feed in KV.
const SOURCE = "https://tcandk.substack.com/feed";

async function refresh(env) {
  const res = await fetch(SOURCE);
  const body = await res.text();
  if (!res.ok || !body.includes("<guid")) throw new Error(`Substack returned ${res.status}`);
  await env.FEED.put("feed", body, { metadata: { fetchedAt: new Date().toISOString() } });
  return body;
}

export default {
  async fetch(request, env) {
    let { value, metadata } = await env.FEED.getWithMetadata("feed");
    if (value === null) {
      try {
        value = await refresh(env);
        metadata = { fetchedAt: new Date().toISOString() };
      } catch (err) {
        return new Response(err.message, { status: 503 });
      }
    }
    return new Response(value, {
      headers: { "content-type": "application/xml; charset=utf-8", "x-feed-fetched-at": metadata?.fetchedAt ?? "" },
    });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(refresh(env));
  },
};
