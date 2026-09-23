export const RUN_DURATION = 90;
export const WORLD = { width: 960, height: 600 };

export const ENEMY_TYPES = {
  drone: { hp: 1, speed: 78, radius: 16, damage: 9, score: 80, color: '#ff5aa5' },
  comet: { hp: 2, speed: 62, radius: 20, damage: 13, score: 120, color: '#ffd300' },
  hunter: { hp: 3, speed: 48, radius: 24, damage: 18, score: 180, color: '#8e71ff' },
  overlord: { hp: 12, speed: 38, radius: 36, damage: 26, score: 900, color: '#33e6c4' },
};

export function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
export function formatTime(seconds) {
  const value = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}
export function difficultyAt(elapsed) {
  const wave = clamp(Math.floor(Math.max(0, elapsed) / 15), 0, 5);
  return {
    wave: wave + 1,
    spawnEvery: Math.max(.24, .72 - wave * .085),
    speedScale: 1 + wave * .11,
    fireEvery: Math.max(.24, .48 - wave * .025),
  };
}
export function enemyTypeFor(elapsed, roll = Math.random()) {
  if (elapsed > 74 && roll < .035) return 'overlord';
  if (elapsed > 42 && roll < .23) return 'hunter';
  if (elapsed > 16 && roll < .48) return 'comet';
  return 'drone';
}
export function calculateKillScore(type, combo = 1, primeTime = false) {
  const base = ENEMY_TYPES[type]?.score || 0;
  const comboMultiplier = 1 + Math.min(20, Math.max(0, combo - 1)) * .06;
  return Math.round(base * comboMultiplier * (primeTime ? 2 : 1));
}
export function resultXp({ score = 0, threats = 0 } = {}) {
  return Math.min(400, 50 + Math.max(0, threats) * 3 + Math.floor(Math.max(0, score) / 100));
}
