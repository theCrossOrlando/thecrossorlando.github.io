import Masonry from 'masonry-layout';

// Read straight from the Firestore REST API instead of loading the Firebase SDK
// — these are public, read-only queries, so a plain fetch avoids pulling ~tens
// of KB of SDK from gstatic (and the extra cross-origin connection) before any
// lyric can render. Security rules are enforced server-side either way.
const API_KEY = 'AIzaSyAb3tuVXmuobrVZr_n1JuKYoapmocCx078';
const BASE = 'https://firestore.googleapis.com/v1/projects/thecross-music/databases/(default)/documents';

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

function renderLyrics(lyrics) {
  const grid = document.getElementById('lyrics-grid');
  if (!grid) return null;

  const fragment = document.createDocumentFragment();

  for (const lyric of lyrics) {
    const col = document.createElement('div');
    col.className = 'col col-lg-6';

    const card = document.createElement('article');
    card.className = 'card';

    const body = document.createElement('div');
    body.className = 'card-body';

    const title = document.createElement('h2');
    title.textContent = lyric.song;

    body.append(title);

    // Only show the byline when there's actually an artist — otherwise a
    // song with a blank artist renders a dangling "by ".
    const artist = lyric.artist?.trim();
    if (artist) {
      const author = document.createElement('span');
      author.className = 'author';
      author.textContent = `by ${artist}`;
      body.append(author);
    }

    const text = document.createElement('p');
    text.style.whiteSpace = 'pre-wrap';
    text.textContent = lyric.lyrics;

    body.append(text);
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

  lyrics.sort((a, b) => a.order - b.order);

  renderScripture(scripture[0]?.verse);
  layoutMasonry(renderLyrics(lyrics));
} catch (error) {
  console.error('Failed to load lyrics', error);
  showError();
}
