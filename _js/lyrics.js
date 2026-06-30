import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.12.1/firebase-app.js';
import { getFirestore, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/9.12.1/firebase-firestore.js';

const config = {
  apiKey: 'AIzaSyAb3tuVXmuobrVZr_n1JuKYoapmocCx078',
  authDomain: 'thecross-music.firebaseapp.com',
  projectId: 'thecross-music',
};

const db = getFirestore(initializeApp(config));

async function fetchAll(ref) {
  const snapshot = await getDocs(ref);
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
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

    const author = document.createElement('span');
    author.className = 'author';
    author.textContent = `by ${lyric.artist}`;

    const text = document.createElement('p');
    text.style.whiteSpace = 'pre-wrap';
    text.textContent = lyric.lyrics;

    body.append(title, author, text);
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
  if (!grid || typeof Masonry === 'undefined') return;

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
  const [scripture, lyrics] = await Promise.all([
    fetchAll(query(collection(db, 'scripture'))),
    fetchAll(query(collection(db, 'lyrics'), where('enabled', '==', true))),
  ]);

  lyrics.sort((a, b) => (a.order > b.order ? 1 : a.order < b.order ? -1 : 0));

  renderScripture(scripture[0]?.verse);
  layoutMasonry(renderLyrics(lyrics));
} catch (error) {
  console.error('Failed to load lyrics', error);
  showError();
}
