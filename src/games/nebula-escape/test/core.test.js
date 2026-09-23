import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateKillScore, difficultyAt, enemyTypeFor, formatTime, resultXp } from '../src/core.js';

test('difficulty rises in readable 15 second waves', () => {
  assert.deepEqual(difficultyAt(0), { wave: 1, spawnEvery: .72, speedScale: 1, fireEvery: .48 });
  assert.equal(difficultyAt(89).wave, 6);
  assert.ok(difficultyAt(89).spawnEvery < difficultyAt(0).spawnEvery);
});
test('combo and hyperdrive increase a kill score', () => {
  assert.equal(calculateKillScore('drone', 1, false), 80);
  assert.ok(calculateKillScore('drone', 10, true) > 200);
});
test('enemy selection unlocks tougher types over time', () => {
  assert.equal(enemyTypeFor(0, 0), 'drone');
  assert.equal(enemyTypeFor(20, .2), 'comet');
  assert.equal(enemyTypeFor(50, .2), 'hunter');
  assert.equal(enemyTypeFor(80, .02), 'overlord');
});
test('time and xp stay bounded', () => {
  assert.equal(formatTime(90), '01:30');
  assert.equal(formatTime(-3), '00:00');
  assert.equal(resultXp({ score: 999999, threats: 999 }), 400);
});
