// Shift every timestamp in a Whisper VTT by N seconds.
// Whisper transcribes the *bare* sermon, but the published audio has intro music
// and a spoken announcement in front of it — without this shift every seek button
// in the transcript lands early by exactly the intro length.
//   node offset-vtt.mjs <file.vtt> <seconds>   -> VTT on stdout
import { readFileSync } from 'node:fs';

const [file, offsetArg] = process.argv.slice(2);
const offset = Number(offsetArg);
if (!file || !Number.isFinite(offset)) {
  console.error('usage: offset-vtt.mjs <file.vtt> <seconds>');
  process.exit(1);
}

const pad = (n, w = 2) => String(n).padStart(w, '0');
const shift = (ts) => {
  const [hms, ms] = ts.split('.');
  const p = hms.split(':').map(Number);
  const secs = (p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1]) + Number(`0.${ms}`) + offset;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  const frac = Math.round((secs - Math.floor(secs)) * 1000);
  // keep the source's own shape: emit hours only when the source had them or we crossed an hour
  return (p.length === 3 || h > 0 ? `${pad(h)}:` : '') + `${pad(m)}:${pad(s)}.${pad(frac, 3)}`;
};

process.stdout.write(
  readFileSync(file, 'utf8').replace(
    /(\d{1,2}:\d{2}(?::\d{2})?\.\d{3})(\s*-->\s*)(\d{1,2}:\d{2}(?::\d{2})?\.\d{3})/g,
    (_, a, arrow, b) => shift(a) + arrow + shift(b),
  ),
);
