/* =============================================================
   LLEGANDO A LA CITA  —  motor del juego
   ============================================================= */

/* >>> TEXTOS PERSONALIZABLES <<< */
const CONFIG = {
  TIME_LIMIT: 95,     // segundos para llegar a la cita
  HIT_PENALTY: 3,     // segundos que cuesta cada golpe
  HEART_BONUS: 3,     // segundos que da cada corazon
  TITLE: 'LLEGAMOS TARDE',
  SUBTITLE: 'a nuestra cita',
  WIN_TITLE: 'LLEGASTEIS A TIEMPO',
  WIN_LETTER:
    'Nueve paises, mil recuerdos y siempre la misma conclusion: ' +
    'contigo hasta llegar tarde merece la pena. Feliz cita, Melissa.',
  LOSE_TITLE: 'LLEGASTEIS TARDE...',
  LOSE_LETTER: 'Pero ella os guardo la mesa. Vuelve a intentarlo.'
};

const SCENE_LEN = 1000;
const TOTAL = SCENES.length * SCENE_LEN;
const GOAL_ZONE = 420;

/* ---------- canvas ---------- */
const cvs = document.getElementById('game');
const ctx = cvs.getContext('2d');
ctx.imageSmoothingEnabled = false;

/* ---------- sonido ---------- */
const Sound = {
  ac: null, muted: false,
  init() { if (!this.ac) { try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } },
  beep(freq, dur, type, vol) {
    if (this.muted || !this.ac) return;
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type || 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.06, this.ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ac.currentTime + dur);
    o.connect(g); g.connect(this.ac.destination);
    o.start(); o.stop(this.ac.currentTime + dur);
  },
  jump() { this.beep(520, 0.10); this.beep(760, 0.08); },
  duck() { this.beep(220, 0.07, 'triangle'); },
  hit() { this.beep(150, 0.22, 'sawtooth', 0.09); },
  heart() { this.beep(880, 0.08); setTimeout(() => this.beep(1180, 0.10), 70); },
  step() { this.beep(120, 0.03, 'triangle', 0.02); },
  scene() { [520, 660, 784].forEach((f, i) => setTimeout(() => this.beep(f, 0.12, 'square', 0.05), i * 90)); },
  win() { [523, 659, 784, 1046, 784, 1046].forEach((f, i) => setTimeout(() => this.beep(f, 0.22, 'square', 0.07), i * 160)); },
  lose() { [400, 330, 260, 190].forEach((f, i) => setTimeout(() => this.beep(f, 0.25, 'sawtooth', 0.07), i * 170)); }
};

/* ---------- estado ---------- */
const S = {
  mode: 'title',       // title | play | over | win
  hero: 'christian',
  dist: 0, time: CONFIG.TIME_LIMIT, speed: 2.5,
  t: 0, score: 0, heartsTaken: 0, hits: 0,
  obstacles: [], pickups: [], parts: [],
  sceneIdx: 0, card: 0, flash: 0, shake: 0,
  nextSpawn: 260, nextHeart: 420, lastAir: -999,
  trail: [], goalReached: false, endTimer: 0
};

const player = {
  x: 104, y: GROUND_Y, vy: 0, onGround: true, crouch: false,
  invul: 0, coyote: 0, buffer: 0, anim: 0
};
const mate = { x: 46, y: GROUND_Y, crouch: false, anim: 0 };

/* ---------- entrada ---------- */
const keys = { jump: false, down: false };
let jumpHeld = false;

function pressJump() {
  if (S.mode !== 'play') return;
  player.buffer = 8;
  Sound.init();
  jumpHeld = true;
}
function releaseJump() {
  jumpHeld = false;
  if (player.vy < -3) player.vy = -3;
}
function setDuck(v) { keys.down = v; if (v) Sound.init(); }

addEventListener('keydown', e => {
  if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) { e.preventDefault(); if (!keys.jump) pressJump(); keys.jump = true; }
  if (['ArrowDown', 'KeyS'].includes(e.code)) { e.preventDefault(); setDuck(true); }
  if (e.code === 'Enter' || e.code === 'KeyR') {
    if (S.mode === 'over' || S.mode === 'win') startGame(S.hero);
  }
  if (e.code === 'KeyM') toggleMute();
});
addEventListener('keyup', e => {
  if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) { keys.jump = false; releaseJump(); }
  if (['ArrowDown', 'KeyS'].includes(e.code)) setDuck(false);
});

/* toques sobre el canvas: mitad izquierda = agacharse, derecha = saltar */
const stage = document.getElementById('stage');
const activeTouch = {};
stage.addEventListener('pointerdown', e => {
  if (S.mode !== 'play') return;
  e.preventDefault();
  const r = stage.getBoundingClientRect();
  const left = (e.clientX - r.left) < r.width / 2;
  activeTouch[e.pointerId] = left ? 'duck' : 'jump';
  if (left) setDuck(true); else pressJump();
});
function endTouch(e) {
  const a = activeTouch[e.pointerId];
  if (!a) return;
  delete activeTouch[e.pointerId];
  if (a === 'duck') { if (!Object.values(activeTouch).includes('duck')) setDuck(false); }
  else releaseJump();
}
stage.addEventListener('pointerup', endTouch);
stage.addEventListener('pointercancel', endTouch);
stage.addEventListener('pointerleave', endTouch);
stage.addEventListener('contextmenu', e => e.preventDefault());

function bindButton(id, onDown, onUp) {
  const el = document.getElementById(id);
  el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); el.classList.add('on'); onDown(); });
  const up = e => { e.preventDefault(); e.stopPropagation(); el.classList.remove('on'); if (onUp) onUp(); };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('pointerleave', up);
}
bindButton('btn-jump', pressJump, releaseJump);
bindButton('btn-duck', () => setDuck(true), () => setDuck(false));

function toggleMute() {
  Sound.muted = !Sound.muted;
  document.getElementById('btn-sound').textContent = Sound.muted ? '♪ OFF' : '♪ ON';
}
const soundBtn = document.getElementById('btn-sound');
soundBtn.addEventListener('pointerdown', e => e.stopPropagation());
soundBtn.addEventListener('click', e => { e.stopPropagation(); toggleMute(); });

/* ---------- pantallas (DOM) ---------- */
const screens = {
  title: document.getElementById('screen-title'),
  over: document.getElementById('screen-over'),
  win: document.getElementById('screen-win')
};
function showScreen(name) {
  for (const k in screens) screens[k].classList.toggle('show', k === name);
  document.getElementById('touch').classList.toggle('show', name === null);
}

/* ---------- arranque de partida ---------- */
function startGame(hero) {
  Sound.init();
  S.hero = hero;
  S.mode = 'play';
  S.dist = 0; S.time = CONFIG.TIME_LIMIT; S.speed = 2.5;
  S.score = 0; S.heartsTaken = 0; S.hits = 0;
  S.obstacles = []; S.pickups = []; S.parts = []; S.trail = [];
  S.sceneIdx = 0; S.card = 170; S.flash = 0; S.shake = 0;
  S.nextSpawn = 430; S.nextHeart = 620; S.lastAir = -999;
  S.goalReached = false; S.endTimer = 0;
  player.y = GROUND_Y; player.vy = 0; player.onGround = true;
  player.invul = 0; player.buffer = 0; player.coyote = 0;
  mate.y = GROUND_Y; mate.crouch = false;
  keys.down = false; jumpHeld = false;
  showScreen(null);
  Sound.scene();
}

document.querySelectorAll('[data-hero]').forEach(el => {
  el.addEventListener('click', () => startGame(el.getAttribute('data-hero')));
});
document.querySelectorAll('[data-retry]').forEach(el => {
  el.addEventListener('click', () => startGame(S.hero));
});
document.querySelectorAll('[data-menu]').forEach(el => {
  el.addEventListener('click', () => { S.mode = 'title'; showScreen('title'); });
});

/* ---------- helpers ---------- */
function heroKey() { return S.hero; }
function mateKey() { return S.hero === 'christian' ? 'melissa' : 'christian'; }

function addParts(x, y, n, color, spread, up) {
  for (let i = 0; i < n; i++) {
    S.parts.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * spread,
      vy: -Math.random() * (up || 2),
      life: 18 + Math.random() * 16, color: color, s: Math.random() > 0.6 ? 2 : 1
    });
  }
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function playerBox() {
  const crouching = player.crouch && player.onGround;
  return crouching
    ? { x: player.x + 4, y: player.y - 20, w: 18, h: 20 }
    : { x: player.x + 5, y: player.y - 30, w: 14, h: 30 };
}

/* ---------- logica ---------- */
function update() {
  S.t++;

  if (S.mode !== 'play') { updateParts(); return; }

  S.sceneIdx = Math.min(SCENES.length - 1, Math.floor(S.dist / SCENE_LEN));
  S.speed = 2.5 + S.sceneIdx * 0.14;

  /* tiempo */
  S.time -= 1 / 60;
  if (S.time <= 0 && !S.goalReached) {
    S.time = 0;
    S.mode = 'over';
    Sound.lose();
    fillOver();
    showScreen('over');
    return;
  }

  /* avance */
  const prevScene = Math.floor(S.dist / SCENE_LEN);
  S.dist += S.speed;
  S.score += 0.4;
  const newScene = Math.floor(S.dist / SCENE_LEN);
  if (newScene !== prevScene && newScene < SCENES.length) {
    S.card = 170; S.flash = 12; Sound.scene();
  }

  /* meta */
  if (S.dist >= TOTAL && !S.goalReached) {
    S.goalReached = true;
    S.mode = 'win';
    Sound.win();
    fillWin();
    showScreen('win');
    return;
  }

  /* fisica del jugador */
  player.crouch = keys.down && player.onGround;
  if (player.buffer > 0) player.buffer--;
  if (player.coyote > 0) player.coyote--;

  if (player.buffer > 0 && (player.onGround || player.coyote > 0)) {
    player.vy = -8.0;
    player.onGround = false;
    player.coyote = 0; player.buffer = 0;
    player.crouch = false;
    addParts(player.x + 12, GROUND_Y, 6, '#ffffff', 2, 1);
    Sound.jump();
  }

  if (!player.onGround) {
    player.vy += jumpHeld && player.vy < 0 ? 0.42 : 0.56;
    if (player.vy > 9) player.vy = 9;
    player.y += player.vy;
    if (player.y >= GROUND_Y) {
      player.y = GROUND_Y; player.vy = 0; player.onGround = true;
      player.coyote = 0;
      addParts(player.x + 12, GROUND_Y, 8, '#ffffff', 2.6, 1.4);
    }
  } else {
    player.coyote = 6;
    player.anim += S.speed;
    if (S.t % 14 === 0) Sound.step();
  }

  if (player.invul > 0) player.invul--;

  /* rastro para el acompanante (imita tus movimientos con retardo) */
  S.trail.push({ y: player.y, crouch: player.crouch, ground: player.onGround });
  if (S.trail.length > 200) S.trail.shift();
  const delay = Math.max(1, Math.round((player.x - mate.x) / S.speed));
  const past = S.trail[S.trail.length - 1 - delay];
  if (past) { mate.y = past.y; mate.crouch = past.crouch; }
  mate.anim += S.speed;

  /* generar obstaculos */
  const spawning = S.dist < TOTAL - GOAL_ZONE;
  if (spawning && S.dist > S.nextSpawn) {
    const list = SCENES[S.sceneIdx].obstacles;
    let kind = list[Math.floor(Math.random() * list.length)];
    if (OBSTACLES[kind].air && S.dist - S.lastAir < 700) {
      kind = list.filter(k => !OBSTACLES[k].air)[0] || kind;
    }
    const def = OBSTACLES[kind];
    if (def.air) S.lastAir = S.dist;
    const h = def.h;
    S.obstacles.push({
      kind: kind, x: VIEW_W + 24,
      y: def.air ? AIR_Y : GROUND_Y - h,
      w: def.w, h: h,
      colH: def.air ? Math.min(h, 22) : h,
      hit: false
    });
    const base = 150 + Math.random() * 110 + (def.air ? 60 : 0);
    S.nextSpawn = S.dist + base * (S.speed / 2.5);
  }

  /* corazones */
  if (spawning && S.dist > S.nextHeart) {
    S.pickups.push({ x: VIEW_W + 20, y: GROUND_Y - (Math.random() > 0.5 ? 52 : 26), got: false });
    S.nextHeart = S.dist + 520 + Math.random() * 320;
  }

  /* mover y colisionar */
  const pb = playerBox();
  for (let i = S.obstacles.length - 1; i >= 0; i--) {
    const o = S.obstacles[i];
    o.x -= S.speed;
    if (o.x < -70) { S.obstacles.splice(i, 1); continue; }
    if (!o.hit && player.invul <= 0) {
      const inset = Math.min(9, 4 + Math.round(o.w * 0.10));
      const box = { x: o.x + inset, y: o.y + (o.h - o.colH), w: o.w - inset * 2, h: o.colH };
      if (overlap(pb, box)) {
        o.hit = true;
        S.hits++;
        S.time = Math.max(0, S.time - CONFIG.HIT_PENALTY);
        player.invul = 70;
        S.shake = 10;
        Sound.hit();
        addParts(player.x + 12, player.y - 16, 16, '#ff6b6b', 4, 3);
      }
    }
  }
  for (let i = S.pickups.length - 1; i >= 0; i--) {
    const p = S.pickups[i];
    p.x -= S.speed;
    if (p.x < -30) { S.pickups.splice(i, 1); continue; }
    const box = { x: p.x, y: p.y, w: 14, h: 12 };
    if (overlap(pb, box)) {
      S.pickups.splice(i, 1);
      S.heartsTaken++;
      S.score += 60;
      S.time = Math.min(CONFIG.TIME_LIMIT, S.time + CONFIG.HEART_BONUS);
      Sound.heart();
      addParts(p.x + 7, p.y + 6, 12, '#ff5b7a', 3, 2.5);
    }
  }

  if (S.card > 0) S.card--;
  if (S.flash > 0) S.flash--;
  if (S.shake > 0) S.shake--;
  updateParts();
}

function updateParts() {
  for (let i = S.parts.length - 1; i >= 0; i--) {
    const p = S.parts[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.14; p.life--;
    if (p.life <= 0) S.parts.splice(i, 1);
  }
}

/* ---------- dibujo ---------- */
function drawText(text, x, y, color, size, align) {
  ctx.font = (size || 8) + 'px "Press Start 2P", monospace';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = color;
  ctx.fillText(text, Math.round(x), Math.round(y));
  ctx.textAlign = 'left';
}

function drawHeart(x, y, scale, color) {
  const heart = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
  for (let r = 0; r < heart.length; r++)
    for (let c = 0; c < heart[r].length; c++)
      if (heart[r][c] === 'X') rect(ctx, x + c * scale, y + r * scale, scale, scale, color);
}

function render() {
  const scene = SCENES[Math.min(S.sceneIdx, SCENES.length - 1)];
  ctx.save();
  if (S.shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * S.shake), Math.round((Math.random() - 0.5) * S.shake));

  const local = S.dist - S.sceneIdx * SCENE_LEN;
  scene.far(ctx, local);
  scene.mid(ctx, S.dist);
  drawGround(ctx, scene, S.dist);

  /* lluvia de Londres */
  if (scene.rain) {
    for (let i = 0; i < 70; i++) {
      const x = (i * 53 + S.t * 6) % (VIEW_W + 60) - 30;
      const y = (i * 37 + S.t * 11) % VIEW_H;
      rect(ctx, x, y, 1, 5, 'rgba(210,230,245,0.55)');
    }
  }

  /* meta */
  if (S.dist > TOTAL - GOAL_ZONE) drawGoal(ctx, 66 + (TOTAL - S.dist), S.t);

  /* corazones */
  for (const p of S.pickups) {
    const bob = Math.sin((S.t + p.x) / 12) * 2;
    drawHeart(p.x, p.y + bob, 2, '#ff5b7a');
    rect(ctx, p.x + 2, p.y + bob + 2, 2, 2, '#ffc2cf');
  }

  /* obstaculos */
  for (const o of S.obstacles) {
    if (!OBSTACLES[o.kind].air) rect(ctx, o.x + 2, GROUND_Y - 1, o.w - 4, 3, 'rgba(0,0,0,0.22)');
    OBSTACLES[o.kind].draw(ctx, o.x, o.y, S.t);
  }

  /* personajes */
  const mateSpr = SPRITES[mateKey()], mateP = LOOKS[mateKey()].palette;
  drawChar(mateSpr, mateP, mate, false);
  const heroSpr = SPRITES[heroKey()], heroP = LOOKS[heroKey()].palette;
  const blink = player.invul > 0 && Math.floor(S.t / 4) % 2 === 0;
  if (!blink) drawChar(heroSpr, heroP, player, true);

  /* particulas */
  for (const p of S.parts) rect(ctx, p.x, p.y, p.s, p.s, p.color);

  ctx.restore();

  if (S.mode === 'play' || S.mode === 'win' || S.mode === 'over') drawHUD();
  if (S.card > 0 && S.mode === 'play') drawCard(scene);
  if (S.flash > 0) {
    ctx.fillStyle = 'rgba(255,255,255,' + (S.flash / 26) + ')';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  if (S.mode !== 'play') {
    ctx.fillStyle = 'rgba(12,10,20,0.55)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

function drawChar(frames, palette, who, isHero) {
  let rows, scale = 2, feet = who.y;
  const running = who === player ? player.onGround : true;
  if (who.crouch) {
    rows = frames.crouch;
    drawSprite(ctx, rows, palette, who.x - 2, feet - rows.length * scale, scale, false);
  } else if (isHero && !player.onGround) {
    rows = frames.jump;
    drawSprite(ctx, rows, palette, who.x, feet - rows.length * scale, scale, false);
  } else if (!isHero && !mateOnGround()) {
    rows = frames.jump;
    drawSprite(ctx, rows, palette, who.x, feet - rows.length * scale, scale, false);
  } else {
    const step = Math.floor(who.anim / 9) % 2;
    rows = step === 0 ? frames.runA : frames.runB;
    drawSprite(ctx, rows, palette, who.x, feet - rows.length * scale, scale, false);
  }
  /* sombra */
  rect(ctx, who.x + 2, GROUND_Y - 1, 20, 2, 'rgba(0,0,0,0.18)');
}

function mateOnGround() { return mate.y >= GROUND_Y - 0.5; }

function drawHUD() {
  /* barra de tiempo */
  const low = S.time < 15;
  rect(ctx, 8, 8, 122, 12, 'rgba(10,8,18,0.55)');
  rect(ctx, 10, 10, 118, 8, '#2b2740');
  const w = Math.max(0, Math.round(118 * (S.time / CONFIG.TIME_LIMIT)));
  rect(ctx, 10, 10, w, 8, low && Math.floor(S.t / 6) % 2 === 0 ? '#ff5b5b' : (low ? '#ff9a5b' : '#5fd08a'));
  drawText('T ' + Math.ceil(S.time), 136, 10, low ? '#ff9a9a' : '#ffffff', 8);

  /* corazones y puntos (a la izquierda del boton de sonido) */
  drawHeart(VIEW_W - 132, 9, 2, '#ff5b7a');
  drawText('x' + S.heartsTaken, VIEW_W - 116, 10, '#ffffff', 8);
  drawText(String(Math.floor(S.score)).padStart(5, '0'), VIEW_W - 10, 10, '#ffffff', 8, 'right');

  /* progreso del viaje */
  const px = 8, py = 26, pw = VIEW_W - 16;
  rect(ctx, px, py, pw, 8, 'rgba(10,8,18,0.5)');
  for (let i = 0; i < SCENES.length; i++) {
    const x = px + 4 + (pw - 12) * (i / (SCENES.length - 1));
    rect(ctx, x, py + 2, 4, 4, i < S.sceneIdx ? '#ffd97a' : (i === S.sceneIdx ? '#ffffff' : '#6b6580'));
  }
  const dx = px + 4 + (pw - 12) * Math.min(1, S.dist / TOTAL);
  drawHeart(dx - 5, py - 3, 1, '#ff5b7a');
  drawText(SCENES[S.sceneIdx].name, 11, 39, 'rgba(0,0,0,0.45)', 8);
  drawText(SCENES[S.sceneIdx].name, 10, 38, '#ffe9b0', 8);
}

function drawCard(scene) {
  const a = Math.min(1, S.card / 30);
  ctx.globalAlpha = a;
  rect(ctx, 40, 74, VIEW_W - 80, 62, 'rgba(12,10,22,0.82)');
  rect(ctx, 40, 74, VIEW_W - 80, 2, '#ffd97a');
  rect(ctx, 40, 134, VIEW_W - 80, 2, '#ffd97a');
  drawText(scene.name, VIEW_W / 2, 84, '#ffd97a', 12, 'center');
  drawText(scene.sub, VIEW_W / 2, 104, '#ffffff', 8, 'center');
  wrapText(scene.memory, VIEW_W / 2, 118, 46, '#ffb8c8', 8);
  ctx.globalAlpha = 1;
}

function wrapText(text, cx, y, maxChars, color, size) {
  const words = text.split(' ');
  const lines = []; let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) { lines.push(cur.trim()); cur = w; }
    else cur += ' ' + w;
  }
  if (cur.trim()) lines.push(cur.trim());
  lines.forEach((l, i) => drawText(l, cx, y + i * (size + 4), color, size, 'center'));
}

/* ---------- pantallas finales ---------- */
function fillWin() {
  const secs = Math.ceil(S.time);
  document.getElementById('win-stats').innerHTML =
    'Tiempo de sobra: <b>' + secs + 's</b> &nbsp;·&nbsp; Recuerdos: <b>' + S.heartsTaken + '</b>' +
    ' &nbsp;·&nbsp; Tropiezos: <b>' + S.hits + '</b> &nbsp;·&nbsp; Puntos: <b>' + Math.floor(S.score) + '</b>';
  const best = Number(localStorage.getItem('amor-best') || 0);
  if (Math.floor(S.score) > best) localStorage.setItem('amor-best', String(Math.floor(S.score)));
  document.getElementById('win-best').textContent = 'Record: ' + Math.max(best, Math.floor(S.score));
  const list = document.getElementById('win-memories');
  list.innerHTML = SCENES.map(s => '<li><span>' + s.name + '</span>' + s.memory + '</li>').join('');
}

function fillOver() {
  document.getElementById('over-stats').textContent =
    'Llegasteis al ' + Math.round((S.dist / TOTAL) * 100) + '% del camino · ' +
    SCENES[S.sceneIdx].name;
}

/* ---------- retratos del menu ---------- */
function drawPortrait(id, who) {
  const c = document.getElementById(id), x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.clearRect(0, 0, c.width, c.height);
  const rows = SPRITES[who].stand;
  const scale = 5;
  drawSprite(x, rows, LOOKS[who].palette, (c.width - rows[0].length * scale) / 2, 4, scale, false);
}

/* ---------- bucle ---------- */
let acc = 0, last = performance.now();
function loop(now) {
  const dt = Math.min(100, now - last); last = now;
  acc += dt;
  while (acc >= 1000 / 60) { update(); acc -= 1000 / 60; }
  if (S.mode === 'title') renderTitle(); else render();
  requestAnimationFrame(loop);
}

function renderTitle() {
  const scene = SCENES[8];
  scene.far(ctx, S.t * 0.5);
  scene.mid(ctx, S.t * 0.9);
  drawGround(ctx, scene, S.t * 1.4);
  const a = SPRITES.christian, b = SPRITES.melissa;
  const step = Math.floor(S.t / 9) % 2;
  drawSprite(ctx, step ? a.runA : a.runB, LOOKS.christian.palette, 150, GROUND_Y - 32, 2, false);
  drawSprite(ctx, step ? b.runB : b.runA, LOOKS.melissa.palette, 190, GROUND_Y - 32, 2, false);
  drawGoal(ctx, 300, S.t);
  ctx.fillStyle = 'rgba(12,10,22,0.45)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

/* arranque */
function boot() {
  drawPortrait('pic-christian', 'christian');
  drawPortrait('pic-melissa', 'melissa');
  showScreen('title');
  requestAnimationFrame(loop);
}

if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot);
else boot();
