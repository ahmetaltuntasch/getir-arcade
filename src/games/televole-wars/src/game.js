import { RUN_DURATION, WORLD, ENEMY_TYPES, calculateKillScore, clamp, difficultyAt, enemyTypeFor, formatTime, resultXp } from './core.js';

const TAU = Math.PI * 2;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const unit = (from, to) => { const dx = to.x - from.x, dy = to.y - from.y, len = Math.hypot(dx, dy) || 1; return { x: dx / len, y: dy / len }; };

export class TelevoleWars {
  constructor(canvas, events = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.events = events;
    this.input = { x: 0, y: 0 };
    this.frame = this.frame.bind(this);
    this.reset();
    this.draw();
  }
  reset() {
    this.running = false;
    this.elapsed = 0;
    this.score = 0;
    this.headlines = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.lastKillAt = -10;
    this.bursts = 0;
    this.charge = 0;
    this.primeUntil = 0;
    this.spawnClock = 0;
    this.fireClock = 0;
    this.survivalClock = 0;
    this.player = { x: WORLD.width / 2, y: WORLD.height / 2, r: 19, energy: 100, hit: 0 };
    this.enemies = [];
    this.shots = [];
    this.particles = [];
    this.flashes = [];
  }
  start() { this.reset(); this.running = true; this.last = performance.now(); this.raf = requestAnimationFrame(this.frame); }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }
  setInput(x, y) { const len = Math.hypot(x, y); this.input = len > 1 ? { x: x / len, y: y / len } : { x, y }; }
  triggerBurst() {
    if (!this.running || this.charge < 1) return false;
    this.charge = 0; this.bursts++; this.primeUntil = this.elapsed + 6;
    this.flashes.push({ x: this.player.x, y: this.player.y, r: 12, life: .55 });
    for (const enemy of this.enemies) if (distance(enemy, this.player) < 260) enemy.hp -= 4;
    this.events.sound?.('burst');
    return true;
  }
  frame(now) {
    if (!this.running) return;
    const dt = Math.min(.05, Math.max(0, (now - this.last) / 1000)); this.last = now;
    this.update(dt); this.draw();
    if (this.running) this.raf = requestAnimationFrame(this.frame);
  }
  update(dt) {
    this.elapsed += dt;
    const timeLeft = RUN_DURATION - this.elapsed;
    if (timeLeft <= 0) return this.end('time');
    const d = difficultyAt(this.elapsed);
    const p = this.player;
    p.x = clamp(p.x + this.input.x * 230 * dt, 28, WORLD.width - 28);
    p.y = clamp(p.y + this.input.y * 230 * dt, 54, WORLD.height - 28);
    p.hit = Math.max(0, p.hit - dt);
    this.spawnClock += dt;
    while (this.spawnClock >= d.spawnEvery) { this.spawnClock -= d.spawnEvery; this.spawnEnemy(d.speedScale); }
    this.fireClock += dt;
    if (this.fireClock >= d.fireEvery && this.enemies.length) { this.fireClock = 0; this.fire(); }
    this.survivalClock += dt;
    if (this.survivalClock >= 1) { this.survivalClock -= 1; this.score += this.elapsed >= this.primeUntil ? 10 : 20; }
    for (const shot of this.shots) { shot.x += shot.vx * dt; shot.y += shot.vy * dt; shot.life -= dt; }
    for (const enemy of this.enemies) {
      const dir = unit(enemy, p); enemy.x += dir.x * enemy.speed * dt; enemy.y += dir.y * enemy.speed * dt;
      enemy.wobble += dt * 5;
      if (!enemy.hit && distance(enemy, p) < enemy.r + p.r) {
        enemy.hit = true; enemy.dead = true; p.energy = Math.max(0, p.energy - enemy.damage); p.hit = .35;
        this.events.sound?.('hit'); this.burstParticles(p.x, p.y, '#ff4f78', 12);
      }
    }
    for (const shot of this.shots) for (const enemy of this.enemies) {
      if (shot.dead || enemy.dead || distance(shot, enemy) > shot.r + enemy.r) continue;
      shot.dead = true; enemy.hp--; enemy.flash = .12;
    }
    for (const enemy of this.enemies) {
      enemy.flash = Math.max(0, (enemy.flash || 0) - dt);
      if (!enemy.dead && enemy.hp <= 0) this.defeat(enemy);
    }
    for (const particle of this.particles) { particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.vy += 35 * dt; particle.life -= dt; }
    for (const flash of this.flashes) { flash.r += 720 * dt; flash.life -= dt; }
    this.shots = this.shots.filter(s => !s.dead && s.life > 0 && s.x > -40 && s.x < 1000 && s.y > -40 && s.y < 640);
    this.enemies = this.enemies.filter(e => !e.dead);
    this.particles = this.particles.filter(particle => particle.life > 0);
    this.flashes = this.flashes.filter(flash => flash.life > 0);
    if (p.energy <= 0) return this.end('energy');
    this.events.hud?.({ time: formatTime(timeLeft), score: this.score, energy: p.energy, headlines: this.headlines, combo: this.combo, charge: this.charge, wave: d.wave, prime: this.elapsed < this.primeUntil });
  }
  spawnEnemy(speedScale) {
    const edge = Math.floor(Math.random() * 4), pad = 34;
    let x = Math.random() * WORLD.width, y = Math.random() * WORLD.height;
    if (edge === 0) y = -pad; if (edge === 1) x = WORLD.width + pad; if (edge === 2) y = WORLD.height + pad; if (edge === 3) x = -pad;
    const type = enemyTypeFor(this.elapsed), spec = ENEMY_TYPES[type];
    this.enemies.push({ x, y, type, r: spec.radius, hp: spec.hp, maxHp: spec.hp, speed: spec.speed * speedScale * (.9 + Math.random() * .2), damage: spec.damage, color: spec.color, wobble: Math.random() * TAU });
  }
  fire() {
    const target = this.enemies.reduce((best, enemy) => !best || distance(enemy, this.player) < distance(best, this.player) ? enemy : best, null);
    if (!target) return;
    const dir = unit(this.player, target), speed = 480;
    this.shots.push({ x: this.player.x, y: this.player.y, vx: dir.x * speed, vy: dir.y * speed, r: 7, life: 1.6, angle: Math.atan2(dir.y, dir.x) });
    this.events.sound?.('shot');
  }
  defeat(enemy) {
    enemy.dead = true; this.headlines++;
    this.combo = this.elapsed - this.lastKillAt < 2.2 ? this.combo + 1 : 1;
    this.lastKillAt = this.elapsed; this.bestCombo = Math.max(this.bestCombo, this.combo);
    const prime = this.elapsed < this.primeUntil;
    this.score += calculateKillScore(enemy.type, this.combo, prime);
    this.charge = Math.min(1, this.charge + (enemy.type === 'finale' ? .32 : .045));
    this.burstParticles(enemy.x, enemy.y, enemy.color, enemy.type === 'finale' ? 28 : 9);
    this.events.sound?.(enemy.type === 'finale' ? 'boss' : 'pop');
  }
  burstParticles(x, y, color, count) { for (let i = 0; i < count; i++) { const a = Math.random() * TAU, speed = 45 + Math.random() * 130; this.particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, color, life: .35 + Math.random() * .45, size: 2 + Math.random() * 5 }); } }
  end(reason) {
    if (!this.running) return; this.running = false; cancelAnimationFrame(this.raf); this.draw();
    this.events.end?.({ score: this.score, headlines: this.headlines, bestCombo: this.bestCombo, bursts: this.bursts, durationSeconds: Math.max(1, Math.min(RUN_DURATION, Math.round(this.elapsed))), reason, xp: resultXp({ score: this.score, headlines: this.headlines }) });
  }
  draw() {
    const c = this.ctx, p = this.player; c.clearRect(0, 0, WORLD.width, WORLD.height);
    const bg = c.createLinearGradient(0, 0, WORLD.width, WORLD.height); bg.addColorStop(0, '#160a32'); bg.addColorStop(.55, '#3c155d'); bg.addColorStop(1, '#8f245f'); c.fillStyle = bg; c.fillRect(0, 0, WORLD.width, WORLD.height);
    c.save(); c.globalAlpha = .13; c.strokeStyle = '#f5dcff'; c.lineWidth = 2;
    for (let y = 90; y < 600; y += 62) { c.beginPath(); c.moveTo(0, y); c.lineTo(960, y); c.stroke(); }
    for (let x = -200; x < 1160; x += 90) { c.beginPath(); c.moveTo(480, 55); c.lineTo(x, 600); c.stroke(); } c.restore();
    this.spotlight(170, 0, '#ff4f9a'); this.spotlight(790, 0, '#ffd300');
    c.fillStyle = '#ffffff12'; c.beginPath(); c.ellipse(480, 326, 220, 110, 0, 0, TAU); c.fill(); c.strokeStyle = '#ffffff32'; c.lineWidth = 3; c.stroke();
    for (const flash of this.flashes) { c.save(); c.globalAlpha = Math.max(0, flash.life); c.strokeStyle = '#fff7ae'; c.lineWidth = 14; c.beginPath(); c.arc(flash.x, flash.y, flash.r, 0, TAU); c.stroke(); c.restore(); }
    for (const shot of this.shots) this.drawShot(shot);
    for (const enemy of this.enemies) this.drawEnemy(enemy);
    for (const particle of this.particles) { c.save(); c.globalAlpha = Math.min(1, particle.life * 2); c.fillStyle = particle.color; c.beginPath(); c.arc(particle.x, particle.y, particle.size, 0, TAU); c.fill(); c.restore(); }
    this.drawPlayer(p);
    if (!this.running && !this.elapsed) { c.fillStyle = '#ffffff0d'; c.fillRect(0, 0, 960, 600); }
  }
  spotlight(x, y, color) { const c = this.ctx, g = c.createRadialGradient(x, y, 20, x, y, 340); g.addColorStop(0, `${color}55`); g.addColorStop(1, `${color}00`); c.fillStyle = g; c.fillRect(0, 0, 960, 600); }
  drawPlayer(p) {
    const c = this.ctx; c.save(); c.translate(p.x, p.y); c.rotate(Math.sin(this.elapsed * 5) * .035); c.shadowColor = this.elapsed < this.primeUntil ? '#ffd300' : '#ff64b1'; c.shadowBlur = 28; c.fillStyle = p.hit ? '#ff4068' : '#ffd300';
    c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 13 : 24; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill();
    c.shadowBlur = 0; c.fillStyle = '#301342'; c.beginPath(); c.arc(-7, -2, 2.6, 0, TAU); c.arc(7, -2, 2.6, 0, TAU); c.fill(); c.strokeStyle = '#301342'; c.lineWidth = 2.5; c.beginPath(); c.arc(0, 2, 8, .2, Math.PI - .2); c.stroke();
    c.rotate(-.55); c.fillStyle = '#fff'; c.fillRect(17, -4, 26, 8); c.fillStyle = '#ff4f9a'; c.beginPath(); c.arc(46, 0, 9, 0, TAU); c.fill(); c.restore();
  }
  drawShot(shot) { const c = this.ctx; c.save(); c.translate(shot.x, shot.y); c.rotate(shot.angle); c.shadowColor = '#fff'; c.shadowBlur = 14; c.fillStyle = '#fff7b0'; c.beginPath(); c.moveTo(12, 0); c.lineTo(-8, -6); c.lineTo(-3, 0); c.lineTo(-8, 6); c.closePath(); c.fill(); c.restore(); }
  drawEnemy(enemy) {
    const c = this.ctx; c.save(); c.translate(enemy.x, enemy.y + Math.sin(enemy.wobble) * 3); c.shadowColor = enemy.color; c.shadowBlur = enemy.flash ? 30 : 12; c.fillStyle = enemy.flash ? '#fff' : enemy.color; c.strokeStyle = '#fff'; c.lineWidth = 3;
    if (enemy.type === 'rumor') { c.beginPath(); c.roundRect(-18, -13, 36, 26, 7); c.fill(); c.stroke(); c.fillStyle = '#40113e'; c.fillRect(-10, -5, 20, 3); c.fillRect(-10, 2, 14, 3); }
    else if (enemy.type === 'paparazzi') { c.beginPath(); c.roundRect(-22, -15, 44, 30, 7); c.fill(); c.stroke(); c.fillStyle = '#341545'; c.beginPath(); c.arc(0, 0, 10, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 4, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.fillRect(10, -21, 10, 8); }
    else if (enemy.type === 'troll') { c.beginPath(); c.arc(0, 0, 24, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#2b1246'; c.beginPath(); c.arc(-8, -4, 4, 0, TAU); c.arc(8, -4, 4, 0, TAU); c.fill(); c.lineWidth = 4; c.beginPath(); c.moveTo(-10, 11); c.lineTo(10, 7); c.stroke(); }
    else { c.beginPath(); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, r = i % 2 ? 28 : 39; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#28134a'; c.font = '900 16px sans-serif'; c.textAlign = 'center'; c.fillText('FİNAL', 0, 6); }
    if (enemy.hp < enemy.maxHp) { c.fillStyle = '#251036'; c.fillRect(-enemy.r, -enemy.r - 12, enemy.r * 2, 4); c.fillStyle = '#66f1cd'; c.fillRect(-enemy.r, -enemy.r - 12, enemy.r * 2 * enemy.hp / enemy.maxHp, 4); }
    c.restore();
  }
}
