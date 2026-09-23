import { TelevoleWars } from './game.js';
import { arcadeStore } from '../../../shared/platform/store.js';
import { getPlayerIdentity } from '../../../shared/platform/player.js';
import { backendAvailable, getLeaderboard, syncRuns } from '../../../shared/platform/api.js';

const $ = id => document.getElementById(id);
const canvas = $('game');
const player = getPlayerIdentity(arcadeStore);
$('player-name').value = player.name;
const localLeaders = [
  { nickname: 'Prime Time Kralı', score: 18420 }, { nickname: 'Flaş Fırtınası', score: 16150 },
  { nickname: 'Mor Mikrofon', score: 14380 }, { nickname: 'Manşet Avcısı', score: 12620 },
  { nickname: 'Stüdyo Yıldızı', score: 10940 },
];
const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);

function paintLeaderboard(rows, status) {
  $('leaderboard-status').textContent = `● ${status}`;
  $('leaderboard-status').classList.toggle('local', status !== 'CANLI');
  $('leaderboard').innerHTML = rows.slice(0, 7).map((row, index) => `<li class="${row.is_current ? 'current' : ''}"><span class="rank">${row.rank ?? index + 1}</span><span class="avatar">${['🏆','📺','🎤','⚡','✨'][index % 5]}</span><div><b>${escapeHtml(row.nickname)}</b><small>Televole Wars</small></div><strong>${Number(row.score || 0).toLocaleString('tr-TR')}</strong></li>`).join('');
}
async function renderLeaderboard() {
  const best = Number(localStorage.getItem('televole-wars-best') || 0);
  const fallback = [...localLeaders, ...(best ? [{ nickname: player.name, score: best, is_current: true }] : [])].sort((a, b) => b.score - a.score).map((row, index) => ({ ...row, rank: index + 1 }));
  paintLeaderboard(fallback, 'YEREL');
  if (!backendAvailable) return;
  try { const rows = await getLeaderboard('televole-wars', player.account ? player.name : ''); if (rows.length) paintLeaderboard(rows, 'CANLI'); } catch { paintLeaderboard(fallback, 'YEREL'); }
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
  const notes = { shot: 520, pop: 260, hit: 105, burst: 740, boss: 160 };
  osc.frequency.setValueAtTime(notes[name] || 300, audioContext.currentTime);
  if (name === 'burst') osc.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + .16);
  gain.gain.setValueAtTime(name === 'shot' ? .018 : .055, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + (name === 'burst' ? .24 : .09));
  osc.connect(gain).connect(audioContext.destination); osc.start(); osc.stop(audioContext.currentTime + .25);
}
$('sound').addEventListener('click', () => { audioEnabled = !audioEnabled; $('sound').textContent = `SES: ${audioEnabled ? 'AÇIK' : 'KAPALI'}`; });

const game = new TelevoleWars(canvas, {
  sound,
  hud(state) {
    $('time').textContent = state.time; $('score').textContent = state.score.toLocaleString('tr-TR'); $('headlines').textContent = state.headlines; $('combo').textContent = `x${state.combo}`;
    $('energy').style.width = `${state.energy}%`; $('wave').textContent = `Dalga ${state.wave}`;
    const ready = state.charge >= 1, prime = state.prime;
    $('burst').disabled = !ready; $('burst').style.setProperty('--charge', state.charge);
    $('prime').textContent = prime ? 'PRIME TIME! 2× PUAN' : ready ? 'Flaş hazır!' : `Flaş %${Math.round(state.charge * 100)}`;
    document.querySelector('.prime-card').classList.toggle('ready', ready || prime);
  },
  end(result) {
    releaseInput(); document.body.classList.remove('game-running');
    arcadeStore?.recordRun({ clientRunId: `televole-${Date.now()}-${result.score}`, gameId: 'televole-wars', score: result.score, durationSeconds: result.durationSeconds, completedAt: new Date().toISOString(), metrics: { headlines: result.headlines, bestCombo: result.bestCombo, bursts: result.bursts, reason: result.reason } });
    syncPendingScores();
    const best = Math.max(result.score, Number(localStorage.getItem('televole-wars-best') || 0)); localStorage.setItem('televole-wars-best', best); renderLeaderboard();
    $('end-label').textContent = result.reason === 'energy' ? 'YAYIN ERKEN KESİLDİ' : 'YAYIN TAMAMLANDI';
    $('final-score').textContent = `${result.score.toLocaleString('tr-TR')} PUAN`;
    $('end-copy').textContent = result.reason === 'energy' ? 'Manşetler stüdyoyu bastı. Rövanşta mikrofon sende.' : 'Prime time kapandı; gecenin yıldızı sensin.';
    $('summary').innerHTML = `<span><b>${result.headlines}</b>Manşet</span><span><b>x${result.bestCombo}</b>En iyi kombo</span><span><b>${result.bursts}</b>Flaş</span><span><b>+${result.xp}</b>Arcade XP</span>`;
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
