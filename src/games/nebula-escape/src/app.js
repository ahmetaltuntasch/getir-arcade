import { NebulaEscape } from './game.js';
import { arcadeStore } from '../../../shared/platform/store.js';
import { getPlayerIdentity } from '../../../shared/platform/player.js';
import { backendAvailable, getLeaderboard, syncRuns } from '../../../shared/platform/api.js';

const $ = id => document.getElementById(id);
const canvas = $('game');
const player = getPlayerIdentity(arcadeStore);
$('player-name').value = player.name;
const localLeaders = [
  { nickname: 'Nebula Pilotu', score: 18420 }, { nickname: 'Hiper Gezgin', score: 16150 },
  { nickname: 'Mor Komet', score: 14380 }, { nickname: 'Yıldız Avcısı', score: 12620 },
  { nickname: 'Galaksi Kaşifi', score: 10940 },
];
const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);

function paintLeaderboard(rows, status) {
  $('leaderboard-status').textContent = `● ${status}`;
  $('leaderboard-status').classList.toggle('local', status !== 'CANLI');
  $('leaderboard').innerHTML = rows.slice(0, 7).map((row, index) => `<li class="${row.is_current ? 'current' : ''}"><span class="rank">${row.rank ?? index + 1}</span><span class="avatar">${['🏆','🚀','☄️','🪐','✨'][index % 5]}</span><div><b>${escapeHtml(row.nickname)}</b><small>Nebula Escape</small></div><strong>${Number(row.score || 0).toLocaleString('tr-TR')}</strong></li>`).join('');
}
async function renderLeaderboard() {
  const legacyBest = Number(localStorage.getItem('televole-wars-best') || 0);
  const best = Math.max(legacyBest, Number(localStorage.getItem('nebula-escape-best') || 0));
  const fallback = [...localLeaders, ...(best ? [{ nickname: player.name, score: best, is_current: true }] : [])].sort((a, b) => b.score - a.score).map((row, index) => ({ ...row, rank: index + 1 }));
  paintLeaderboard(fallback, 'YEREL');
  if (!backendAvailable) return;
  try { const rows = await getLeaderboard('nebula-escape', player.account ? player.name : ''); if (rows.length) paintLeaderboard(rows, 'CANLI'); } catch { paintLeaderboard(fallback, 'YEREL'); }
}
function syncPendingScores() {
  const pending = arcadeStore?.getSnapshot().outbox || [];
  if (!pending.length || !backendAvailable) return;
  syncRuns(pending).then(({ synced, rejected }) => { arcadeStore.markSynced(synced, rejected); renderLeaderboard(); }).catch(() => {});
}
renderLeaderboard(); syncPendingScores();

let audioEnabled = true, audioContext;
function sound(name) {
  if (!audioEnabled) return;
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioContext.createOscillator(), gain = audioContext.createGain();
  const notes = { laser: 620, pop: 260, hit: 105, burst: 740, boss: 160 };
  osc.frequency.setValueAtTime(notes[name] || 300, audioContext.currentTime);
  if (name === 'burst') osc.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + .16);
  gain.gain.setValueAtTime(name === 'laser' ? .018 : .055, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + (name === 'burst' ? .24 : .09));
  osc.connect(gain).connect(audioContext.destination); osc.start(); osc.stop(audioContext.currentTime + .25);
}
$('sound').addEventListener('click', () => { audioEnabled = !audioEnabled; $('sound').textContent = `SES: ${audioEnabled ? 'AÇIK' : 'KAPALI'}`; });

const game = new NebulaEscape(canvas, {
  sound,
  hud(state) {
    $('time').textContent = state.time; $('score').textContent = state.score.toLocaleString('tr-TR'); $('threats').textContent = state.threats; $('combo').textContent = `x${state.combo}`;
    $('energy').style.width = `${state.energy}%`; $('wave').textContent = `Dalga ${state.wave}`;
    const ready = state.charge >= 1, hyper = state.hyper;
    $('burst').disabled = !ready; $('burst').style.setProperty('--charge', state.charge);
    $('hyper').textContent = hyper ? 'HİPER SÜRÜŞ! 2× PUAN' : ready ? 'Hiper atlayış hazır!' : `Hiper yük %${Math.round(state.charge * 100)}`;
    document.querySelector('.hyper-card').classList.toggle('ready', ready || hyper);
  },
  end(result) {
    releaseInput(); document.body.classList.remove('game-running');
    arcadeStore?.recordRun({ clientRunId: `nebula-${Date.now()}-${result.score}`, gameId: 'nebula-escape', score: result.score, durationSeconds: result.durationSeconds, completedAt: new Date().toISOString(), metrics: { threats: result.threats, bestCombo: result.bestCombo, jumps: result.jumps, reason: result.reason } });
    syncPendingScores();
    const best = Math.max(result.score, Number(localStorage.getItem('nebula-escape-best') || 0)); localStorage.setItem('nebula-escape-best', best); renderLeaderboard();
    $('end-label').textContent = result.reason === 'energy' ? 'GEMİ SİSTEMLERİ KAPANDI' : 'NEBULADAN KAÇTIN';
    $('final-score').textContent = `${result.score.toLocaleString('tr-TR')} PUAN`;
    $('end-copy').textContent = result.reason === 'energy' ? 'Uzay sürüsü gemiyi yakaladı. Yeni rotayla tekrar dene.' : 'Hiper kapı açıldı; güvenli sektöre ulaştın.';
    $('summary').innerHTML = `<span><b>${result.threats}</b>Tehdit</span><span><b>x${result.bestCombo}</b>En iyi kombo</span><span><b>${result.jumps}</b>Hiper atlayış</span><span><b>+${result.xp}</b>Arcade XP</span>`;
    $('end').classList.remove('hidden'); $('hud').classList.add('hidden'); $('burst').classList.add('hidden');
  },
});

function start() {
  audioContext?.resume(); $('start').classList.add('hidden'); $('end').classList.add('hidden'); $('hud').classList.remove('hidden'); $('burst').classList.remove('hidden'); document.body.classList.add('game-running'); game.start();
}
$('start-button').addEventListener('click', start); $('restart').addEventListener('click', start); $('burst').addEventListener('pointerdown', event => { event.preventDefault(); game.triggerBurst(); });

const keys = new Set();
function updateKeys() { game.setInput((keys.has('ArrowRight') || keys.has('d') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('a') ? 1 : 0), (keys.has('ArrowDown') || keys.has('s') ? 1 : 0) - (keys.has('ArrowUp') || keys.has('w') ? 1 : 0)); }
addEventListener('keydown', event => { const key = event.key.toLowerCase(); if (['arrowleft','arrowright','arrowup','arrowdown','w','a','s','d',' '].includes(key)) event.preventDefault(); if (key === ' ') game.triggerBurst(); else { keys.add(key.startsWith('arrow') ? `Arrow${key.slice(5, 6).toUpperCase()}${key.slice(6)}` : key); updateKeys(); } });
addEventListener('keyup', event => { const key = event.key.toLowerCase(); keys.delete(key.startsWith('arrow') ? `Arrow${key.slice(5, 6).toUpperCase()}${key.slice(6)}` : key); updateKeys(); });
function releaseInput() { keys.clear(); game.setInput(0, 0); knob.style.transform = ''; touchId = null; }
addEventListener('blur', releaseInput);

const joystick = $('joystick'), knob = joystick.querySelector('span'); let touchId = null;
function moveJoystick(event) { const point = [...event.changedTouches].find(t => t.identifier === touchId); if (!point) return; const rect = joystick.getBoundingClientRect(), dx = point.clientX - (rect.left + rect.width / 2), dy = point.clientY - (rect.top + rect.height / 2), len = Math.hypot(dx, dy), limit = 32, scale = len > limit ? limit / len : 1; knob.style.transform = `translate(${dx * scale}px,${dy * scale}px)`; game.setInput(dx / Math.max(limit, len), dy / Math.max(limit, len)); }
joystick.addEventListener('touchstart', event => { event.preventDefault(); touchId = event.changedTouches[0].identifier; moveJoystick(event); }, { passive: false });
joystick.addEventListener('touchmove', event => { event.preventDefault(); moveJoystick(event); }, { passive: false });
joystick.addEventListener('touchend', event => { if ([...event.changedTouches].some(t => t.identifier === touchId)) releaseInput(); });
