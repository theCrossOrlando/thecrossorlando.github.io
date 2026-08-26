import Masonry from 'masonry-layout';

// Read straight from the Firestore REST API instead of loading the Firebase SDK
// — these are public, read-only queries, so a plain fetch avoids pulling ~tens
// of KB of SDK from gstatic (and the extra cross-origin connection) before any
// lyric can render. Security rules are enforced server-side either way.
const API_KEY = 'AIzaSyAb3tuVXmuobrVZr_n1JuKYoapmocCx078';
const BASE = 'https://firestore.googleapis.com/v1/projects/thecross-music/databases/(default)/documents';

// theCross sits under Holy Cross Lutheran Church's CCLI licence. CCLI expects
// the licence number displayed wherever licensed lyrics are reproduced.
const CCLI_LICENCE = '1073963';

// Firestore REST wraps every field in a typed value object, e.g.
// { stringValue: "..." } / { integerValue: "1" } / { booleanValue: true }.
// Note integers arrive as strings, so coerce them.
function unwrap(value) {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('nullValue' in value) return null;
  return undefined;
}

// Flatten a Firestore document ({ name, fields }) into a plain object.
function toObject(doc) {
  const out = { id: doc.name.split('/').pop() };
  for (const [key, value] of Object.entries(doc.fields ?? {})) {
    out[key] = unwrap(value);
  }
  return out;
}

async function fetchScripture() {
  const res = await fetch(`${BASE}/scripture?key=${API_KEY}`);
  if (!res.ok) throw new Error(`scripture request failed: ${res.status}`);
  const data = await res.json();
  return (data.documents ?? []).map(toObject);
}

async function fetchLyrics() {
  // runQuery (not a plain list) so the enabled==true filter runs server-side.
  // Sorting stays client-side, so a single-field filter needs no composite index.
  const res = await fetch(`${BASE}:runQuery?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'lyrics' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'enabled' },
            op: 'EQUAL',
            value: { booleanValue: true },
          },
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`lyrics request failed: ${res.status}`);
  const rows = await res.json();
  // runQuery streams rows; entries without a `document` (e.g. read-time markers) are skipped.
  return rows.filter((row) => row.document).map((row) => toObject(row.document));
}

function renderScripture(verse) {
  const row = document.getElementById('scripture-row');
  if (!row || !verse) return;

  const col = document.createElement('div');
  col.className = 'col';

  const heading = document.createElement('h3');
  heading.textContent = `This week's scripture: ${verse}`;

  col.append(heading);
  row.append(col);
}

// Section labels as SongSelect and ChordPro exports write them: the label alone
// on its own line, optionally numbered, optionally with a trailing colon.
const SECTION_LABEL =
  /^\s*((?:pre-?chorus|chorus|verse|bridge|refrain|interlude|instrumental|intro|outro|ending|tag|vamp|coda)(?:\s+\d+)?)\s*:?\s*$/i;

// Split lyrics into labelled sections. Returns null when the song has no
// labels at all, so older songs keep rendering exactly as they always have
// rather than being restructured by a parser they were never written for.
function parseSections(text) {
  const lines = (text ?? '').split('\n');
  if (!lines.some((line) => SECTION_LABEL.test(line))) return null;

  const sections = [];
  let current = { label: null, lines: [] };

  for (const line of lines) {
    const match = line.match(SECTION_LABEL);
    if (match) {
      if (current.label || current.lines.some((l) => l.trim())) sections.push(current);
      current = { label: match[1].trim(), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  sections.push(current);

  // Drop the blank padding that sits either side of a label.
  return sections
    .map((section) => ({ ...section, body: section.lines.join('\n').replace(/^\n+|\n+$/g, '') }))
    .filter((section) => section.label || section.body.trim());
}

function renderLyricBody(body, lyric) {
  const sections = parseSections(lyric.lyrics);

  const wrap = document.createElement('div');
  wrap.className = 'lyric-body';
  body.append(wrap);

  // No labels — one preformatted block, byte for byte what this page has
  // always produced.
  if (!sections) {
    const text = document.createElement('p');
    text.style.whiteSpace = 'pre-wrap';
    text.textContent = lyric.lyrics;
    wrap.append(text);
    return;
  }

  for (const section of sections) {
    const wrapper = document.createElement('section');
    wrapper.className = 'lyric-section';

    if (section.label) {
      const heading = document.createElement('h3');
      heading.className = 'lyric-section-label';
      heading.textContent = section.label;
      wrapper.append(heading);
    }

    const text = document.createElement('p');
    text.style.whiteSpace = 'pre-wrap';
    text.textContent = section.body;
    wrapper.append(text);

    wrap.append(wrapper);
  }
}

// Per-song attribution. Only renders what the song actually carries, so songs
// imported before these fields existed look exactly as they do now.
function renderCredits(body, lyric) {
  const parts = [];
  if (lyric.copyright) parts.push(`© ${lyric.copyright}`);
  if (lyric.ccliNumber) parts.push(`CCLI Song # ${lyric.ccliNumber}`);
  if (!parts.length) return;

  const credits = document.createElement('footer');
  credits.className = 'lyric-credits';
  credits.textContent = parts.join(' · ');
  body.append(credits);
}

// One licence statement for the page, rather than repeating it on every card.
function renderLicence(anyCredited) {
  const grid = document.getElementById('lyrics-grid');
  if (!grid || !anyCredited) return;

  const note = document.createElement('p');
  note.className = 'lyric-licence';
  note.textContent = `Used by permission. CCLI License # ${CCLI_LICENCE}`;
  grid.after(note);
}

function renderLyrics(lyrics) {
  const grid = document.getElementById('lyrics-grid');
  if (!grid) return null;

  const fragment = document.createDocumentFragment();

  for (const lyric of lyrics) {
    const col = document.createElement('div');
    col.className = 'col col-12 col-lg-6';

    const card = document.createElement('article');
    card.className = 'card';

    const body = document.createElement('div');
    body.className = 'card-body';

    const head = document.createElement('header');
    head.className = 'lyric-head';

    const title = document.createElement('h2');
    title.textContent = lyric.song;
    head.append(title);

    // Only show the byline when there's actually an artist — 2 of the enabled
    // songs have none. The field is an author credit, not a performer.
    const artist = lyric.artist?.trim();
    if (artist) {
      const byline = document.createElement('p');
      byline.className = 'lyric-byline';
      byline.textContent = artist;
      head.append(byline);
    }

    body.append(head);

    renderLyricBody(body, lyric);
    renderCredits(body, lyric);

    card.append(body);
    col.append(card);
    fragment.append(col);
  }

  grid.append(fragment);
  return grid;
}

// Masonry measures card heights up front, but the cards use web fonts that load
// after first paint and change those heights — so re-lay-out once the fonts
// settle, otherwise the grid stays misaligned until a resize/rotation.
function layoutMasonry(grid) {
  if (!grid) return;

  const msnry = new Masonry(grid, { itemSelector: '.col' });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => msnry.layout());
  }
}

function showError() {
  const grid = document.getElementById('lyrics-grid');
  if (!grid) return;

  const message = document.createElement('p');
  message.textContent = 'Sorry — the song list couldn’t be loaded. Please refresh to try again.';
  grid.append(message);
}

try {
  const [scripture, lyrics] = await Promise.all([fetchScripture(), fetchLyrics()]);

  // ?? 0 because a song enabled before `order` existed sorts as NaN, which
  // makes the running order unpredictable rather than merely wrong.
  lyrics.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  renderScripture(scripture[0]?.verse);
  layoutMasonry(renderLyrics(lyrics));
  renderLicence(lyrics.some((l) => l.copyright || l.ccliNumber));
} catch (error) {
  console.error('Failed to load lyrics', error);
  showError();
}
