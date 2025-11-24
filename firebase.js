import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, get, child, push, query, orderByChild, limitToFirst } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA7zRMgzwzjcMnKn8rwKidmE4n00HDkzuU",
  authDomain: "memorypuzzlegame-515e7.firebaseapp.com",
  databaseURL: "https://memorypuzzlegame-515e7-default-rtdb.firebaseio.com",
  projectId: "memorypuzzlegame-515e7",
  storageBucket: "memorypuzzlegame-515e7.firebasestorage.app",
  messagingSenderId: "297828819562",
  appId: "1:297828819562:web:699f8df9e89db4542b2013"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// submit a player's best score (time); keeps only best per player by using playerId key
export async function submitScore(playerId, name, country, time){
  if(!playerId) return;
  // basic validation
  if(typeof time !== 'number' || time < 0 || time > 86400) return;
  const scoreRef = ref(db, 'scores/' + playerId);
  // fetch existing
  const snap = await get(scoreRef);
  const existing = snap.exists() ? snap.val().score : null;
  if(existing === null || time < existing){
    await set(scoreRef, { name, country, score: time, updated: Date.now() });
  }
}

// get top N scores
export async function getTopScores(limit = 100){
  const snap = await get(ref(db, 'scores'));
  const data = snap.exists() ? Object.values(snap.val()) : [];
  data.sort((a,b) => a.score - b.score);
  return data.slice(0, limit);
}

// get rank for a player by time
export async function getRank(playerId){
  const snap = await get(ref(db, 'scores'));
  const data = snap.exists() ? Object.values(snap.val()) : [];
  data.sort((a,b) => a.score - b.score);
  const idx = data.findIndex(d => d.playerId === playerId || d.name === playerId);
  return idx >= 0 ? idx + 1 : null;
}

export { db };
