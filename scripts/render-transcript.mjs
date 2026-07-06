// Render a Whisper VTT into transcript HTML: ~30s paragraphs, each led by a
// clickable timestamp button (<button class="seek" data-t="seconds">M:SS</button>)
// that the page JS uses to seek the audio player. Button form + aria-label match
// the a11y-fixed corpus (commit 60ef088).
//   node render-transcript.mjs <file.vtt>   -> HTML on stdout
import { readFileSync } from 'node:fs';

const GROUP_SECONDS = 30;

const toSeconds = (ts) => {
  const p = ts.trim().split(':').map(Number);
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  if (p.length === 2) return p[0] * 60 + p[1];
  return p[0] || 0;
};
const fmt = (s) => {
  s = Math.floor(s);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return (h ? h + ':' : '') + mm + ':' + String(sec).padStart(2, '0');
};
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const raw = readFileSync(process.argv[2], 'utf8').replace(/\r/g, '');
const cues = [];
for (const block of raw.split('\n\n')) {
  const m = block.match(/(\d{1,2}:\d{2}(?::\d{2})?\.\d{3})\s*-->/);
  if (!m) continue;
  const text = block.split('\n').slice(block.split('\n').findIndex((l) => l.includes('-->')) + 1).join(' ').trim();
  if (text) cues.push({ start: toSeconds(m[1]), text });
}

const paras = [];
let cur = null;
for (const c of cues) {
  if (!cur || c.start - cur.start >= GROUP_SECONDS) {
    cur = { start: c.start, parts: [] };
    paras.push(cur);
  }
  cur.parts.push(c.text);
}

const html = paras
  .map((p) => {
    const sec = Math.floor(p.start), label = fmt(p.start);
    return `<p><button type="button" class="seek" data-t="${sec}" aria-label="Play from ${label}">${label}</button> ${esc(p.parts.join(' '))}</p>`;
  })
  .join('\n');
process.stdout.write(html + '\n');
