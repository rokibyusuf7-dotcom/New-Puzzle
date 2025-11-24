import { submitScore, getTopScores } from './firebase.js';

let level = parseInt(localStorage.getItem("level")) || 1;
let moves = 0;
let timer = 0;
let timerInterval = null;
let theme = localStorage.getItem("theme") || "Light";
let country = localStorage.getItem("country") || "🌍";
let playerName = localStorage.getItem("playerName") || "";
let selectedIndex = 0;

const emojis = ["😀","😎","😍","🤖","🐱","🐶","🍕","⚽","👽","👻","🌟","🔥","🎮","❤️","🚀","✨"];
let cards = [];
let firstCard = null, secondCard = null;
let lock = false;

document.body.className = theme.toLowerCase();

function askPlayerName(){
  if(!playerName){
    playerName = prompt('Enter your player name (visible on leaderboard):') || 'Player';
    localStorage.setItem('playerName', playerName);
  }
  document.getElementById('playerNameDisplay').textContent = playerName + ' ' + (localStorage.getItem('country')||'🌍');
}

function generateCards(){
  const pairs = Math.min(4 + Math.floor(level/2), emojis.length);
  cards = [];
  for(let i=0;i<pairs;i++){ cards.push(emojis[i], emojis[i]); }
  cards.sort(()=>Math.random() - 0.5);
}

function startGame(){
  const game = document.getElementById('game');
  game.innerHTML = '';
  generateCards();
  moves = 0; timer = 0;
  updateHUD();
  clearInterval(timerInterval);
  timerInterval = setInterval(()=>{ timer++; updateHUD(); },1000);

  cards.forEach((emoji, idx) => {
    const card = document.createElement('button');
    card.className = 'card';
    card.dataset.emoji = emoji;
    card.dataset.index = idx;
    card.addEventListener('click', ()=> flipCard(card));
    card.addEventListener('keydown', (e)=>{/* allow focus enter */});
    game.appendChild(card);
  });

  selectCard(0);
}

function selectCard(i){
  const all = document.querySelectorAll('.card');
  if(!all.length) return;
  i = (i + all.length) % all.length;
  all.forEach(c=>c.classList.remove('selected'));
  all[i].classList.add('selected');
  selectedIndex = i;
  // ensure visible focus
  all[i].focus();
}

function flipSelected(){
  const all = document.querySelectorAll('.card');
  if(!all[selectedIndex]) return;
  flipCard(all[selectedIndex]);
}

function flipCard(card){
  if(lock || card === firstCard || card.textContent) return;
  card.textContent = card.dataset.emoji;
  card.classList.add('flip');
  if(!firstCard){ firstCard = card; }
  else { secondCard = card; moves++; updateHUD(); checkMatch(); }
}

function checkMatch(){
  lock = true;
  if(firstCard.dataset.emoji === secondCard.dataset.emoji){
    firstCard = null; secondCard = null; lock = false;
    checkWin();
  } else {
    setTimeout(()=>{
      firstCard.textContent = ''; secondCard.textContent = '';
      firstCard.classList.remove('flip'); secondCard.classList.remove('flip');
      firstCard = secondCard = null; lock = false;
    },700);
  }
}

function checkWin(){
  const all = document.querySelectorAll('.card');
  if([...all].every(c=>c.textContent)){
    clearInterval(timerInterval);
    document.getElementById('results').textContent = `Player: ${playerName} | Time: ${timer}s | Moves: ${moves}`;
    document.getElementById('winOverlay').style.display = 'flex';
  }
}

function updateHUD(){
  document.getElementById('level').textContent = 'Level: ' + level;
  document.getElementById('moves').textContent = 'Moves: ' + moves;
  document.getElementById('time').textContent = 'Time: ' + timer + 's';
}

// leaderboard UI
async function openLeaderboard(){
  const listEl = document.getElementById('leaderboardList');
  listEl.innerHTML = '<li>Loading…</li>';
  try{
    const top = await getTopScores(100);
    listEl.innerHTML = top.map(e=>`<li>${e.name} ${e.country||''} — ${e.score}s</li>`).join('');
  }catch(err){
    listEl.innerHTML = '<li>Unable to load leaderboard</li>';
  }
  document.getElementById('leaderboardPopup').style.display = 'flex';
}

// submit online score
async function submitOnline(){
  const playerId = (playerName||'player').replace(/\s+/g,'_').toLowerCase();
  const bestTime = timer;
  await submitScore(playerId, playerName, localStorage.getItem('country')||'🌍', bestTime);
  await openLeaderboard();
}

document.getElementById('nextLevelBtn').addEventListener('click', ()=>{
  document.getElementById('winOverlay').style.display = 'none';
  level = Math.min(level + 1, 100); localStorage.setItem('level', level);
  startGame();
});

document.getElementById('submitScoreBtn').addEventListener('click', submitOnline);
document.getElementById('leaderboardBtn').addEventListener('click', openLeaderboard);
document.getElementById('closeLeaderboard').addEventListener('click', ()=>document.getElementById('leaderboardPopup').style.display='none');

document.getElementById('settingsBtn').addEventListener('click', ()=>document.getElementById('settingsPopup').style.display='flex');
document.getElementById('closeSettings') && document.getElementById('closeSettings').addEventListener('click', ()=>document.getElementById('settingsPopup').style.display='none');
document.getElementById('saveSettings').addEventListener('click', ()=>{
  const t = document.getElementById('theme').value;
  const c = document.getElementById('country').value;
  localStorage.setItem('theme', t); localStorage.setItem('country', c);
  document.body.className = t.toLowerCase();
  document.getElementById('settingsPopup').style.display = 'none';
});

document.addEventListener('keydown', e=>{
  const all = document.querySelectorAll('.card');
  if(!all.length) return;
  const cols = Math.max(1, Math.round(Math.sqrt(all.length)));
  if(e.key==='ArrowRight') selectCard(selectedIndex+1);
  if(e.key==='ArrowLeft') selectCard(selectedIndex-1);
  if(e.key==='ArrowDown') selectCard(selectedIndex+cols);
  if(e.key==='ArrowUp') selectCard(selectedIndex-cols);
  if(e.key==='Enter' || e.key===' ') flipSelected();
});

// init
askPlayerName();
startGame();
