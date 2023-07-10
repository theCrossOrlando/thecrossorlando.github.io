import { createApp } from 'https://unpkg.com/petite-vue?module'
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.12.1/firebase-app.js';
import { getFirestore, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/9.12.1/firebase-firestore.js';

var config = {
  apiKey: 'AIzaSyAb3tuVXmuobrVZr_n1JuKYoapmocCx078',
  authDomain: 'thecross-music.firebaseapp.com',
  projectId: "thecross-music",
};
const app = initializeApp(config);
const db = getFirestore(app);

const colRefScripture = collection(db, 'scripture')
const scriptureDoc = query(colRefScripture)
const scriptureSnapshot = await getDocs(scriptureDoc);
let scripture = [];
scriptureSnapshot.forEach((doc) => scripture.push({ ...doc.data(), id: doc.id }));

const colRefLyrics = collection(db, 'lyrics');
const activeLyrics = query(colRefLyrics, where("enabled", "==", true));
const lyricsSnapshot = await getDocs(activeLyrics);

let lyrics = [];
lyricsSnapshot.forEach((doc) => lyrics.push({ ...doc.data(), id: doc.id }));
lyrics.sort((a, b) => {
  if (a.order < b.order) return -1
  if (a.order > b.order) return 1
  return 0
})

createApp({
  lyrics: lyrics,
  scripture: scripture[0].verse,
}).mount()
  var msnry = new Masonry('#content .row:not(.no-masonry)', {
    itemSelector: '.col',
  });
