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
const colRefLyrics = collection(db, 'lyrics');
const activeLyrics = query(colRefLyrics, where("enabled", "==", true));
const querySnapshot = await getDocs(activeLyrics);
let lyrics = [];
querySnapshot.forEach((doc) => lyrics.push({ ...doc.data(), id: doc.id }));

createApp({
  lyrics: lyrics
}).mount()
var msnry = new Masonry('#content .row', {
    itemSelector: '.col',
  });
