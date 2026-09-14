// Substack 403s GitHub Actions runners, so the build fetches Ben's feed through here.
export default {
  async fetch() {
    const res = await fetch("https://tcandk.substack.com/feed", { cf: { cacheTtl: 900 } });
    return new Response(res.body, { status: res.status, headers: { "content-type": res.headers.get("content-type") || "application/xml" } });
  },
};
