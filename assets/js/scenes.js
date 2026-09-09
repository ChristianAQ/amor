/* =============================================================
   ESCENARIOS — los 9 recuerdos del viaje hasta la cita
   Todo se dibuja con rectangulos sobre un canvas de baja
   resolucion (480x270) escalado con "pixelated" => pixel art.
   ============================================================= */

const VIEW_W = 480;
const VIEW_H = 270;
const GROUND_Y = 200; // altura del suelo (y del "pie" del jugador)

/* ---------- utilidades de dibujo ---------- */
function rect(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function circle(ctx, cx, cy, r, c) {
  ctx.fillStyle = c;
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(Math.max(0, r * r - y * y)));
    ctx.fillRect(Math.round(cx - half), Math.round(cy + y), half * 2 + 1, 1);
  }
}

function ring(ctx, cx, cy, r, thick, c) {
  ctx.fillStyle = c;
  for (let y = -r; y <= r; y++) {
    const outer = Math.floor(Math.sqrt(Math.max(0, r * r - y * y)));
    const ri = r - thick;
    const inner = Math.abs(y) < ri ? Math.floor(Math.sqrt(Math.max(0, ri * ri - y * y))) : 0;
    if (inner === 0) {
      ctx.fillRect(Math.round(cx - outer), Math.round(cy + y), outer * 2 + 1, 1);
    } else {
      ctx.fillRect(Math.round(cx - outer), Math.round(cy + y), outer - inner + 1, 1);
      ctx.fillRect(Math.round(cx + inner), Math.round(cy + y), outer - inner + 1, 1);
    }
  }
}

function skyGradient(ctx, top, bottom, bands) {
  bands = bands || 9;
  const t = hexToRgb(top), b = hexToRgb(bottom);
  const bandH = Math.ceil(GROUND_Y / bands);
  for (let i = 0; i < bands; i++) {
    const k = i / (bands - 1);
    const col = 'rgb(' +
      Math.round(t[0] + (b[0] - t[0]) * k) + ',' +
      Math.round(t[1] + (b[1] - t[1]) * k) + ',' +
      Math.round(t[2] + (b[2] - t[2]) * k) + ')';
    rect(ctx, 0, i * bandH, VIEW_W, bandH + 1, col);
  }
}

function hexToRgb(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

function rnd(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/* repite un elemento a lo largo del scroll */
function tile(off, spacing, cb) {
  const start = Math.floor((-off) / spacing) - 1;
  const count = Math.ceil(VIEW_W / spacing) + 3;
  for (let i = start; i < start + count; i++) cb(i * spacing + off, i);
}

/* piramide escalonada / lisa */
function pyramid(ctx, cx, baseY, halfW, h, light, dark) {
  const steps = h;
  for (let i = 0; i < steps; i++) {
    const k = i / steps;
    const w = Math.round(halfW * (1 - k));
    rect(ctx, cx - w, baseY - i, w * 2, 1, light);
    rect(ctx, cx, baseY - i, w, 1, dark);
  }
}

function palm(ctx, x, baseY, h, trunk, leaf) {
  rect(ctx, x, baseY - h, 3, h, trunk);
  for (let i = 0; i < 5; i++) {
    const dir = i < 2 ? -1 : (i > 2 ? 1 : 0);
    const len = 12 - Math.abs(i - 2) * 2;
    for (let j = 0; j < len; j++) {
      rect(ctx, x + 1 + dir * j, baseY - h - 3 + Math.floor(j * j / 18) + (i % 2), 2, 2, leaf);
    }
  }
}

function pine(ctx, x, baseY, h, c, c2) {
  rect(ctx, x + 2, baseY - 4, 2, 4, '#4a3527');
  for (let i = 0; i < h; i++) {
    const w = Math.max(1, Math.round((h - i) * 0.55));
    rect(ctx, x + 3 - w, baseY - 4 - i, w * 2, 1, i % 3 === 0 ? c2 : c);
  }
}

function stars(ctx, seed) {
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(rnd(i + seed) * VIEW_W);
    const y = Math.floor(rnd(i * 3.3 + seed) * 130);
    rect(ctx, x, y, 1, 1, rnd(i * 7.7) > 0.7 ? '#ffffff' : '#cdd6ff');
  }
}

/* =============================================================
   OBSTACULOS
   air:true  => hay que AGACHARSE (deslizar)
   air:false => hay que SALTAR
   ============================================================= */
const AIR_Y = GROUND_Y - 46;

const OBSTACLES = {
  /* --- Egipto --- */
  stone: { w: 22, h: 20, draw(c, x, y) {
    rect(c, x, y, 22, 20, '#c9a273'); rect(c, x, y, 22, 3, '#e0bd8e');
    rect(c, x + 11, y + 3, 11, 17, '#a9834f');
    rect(c, x + 3, y + 8, 5, 4, '#8a6a40'); rect(c, x + 14, y + 12, 4, 4, '#8a6a40');
  } },
  urn: { w: 16, h: 24, draw(c, x, y) {
    rect(c, x + 4, y, 8, 4, '#b9713f'); rect(c, x + 2, y + 4, 12, 14, '#d2854c');
    rect(c, x + 9, y + 4, 5, 14, '#a9662f'); rect(c, x + 4, y + 18, 8, 6, '#b9713f');
    rect(c, x + 3, y + 9, 10, 2, '#f0d8a8');
  } },
  scarab: { w: 20, h: 12, draw(c, x, y, t) {
    const b = Math.sin(t / 6) > 0 ? 0 : 1;
    rect(c, x + 2, y + 3 + b, 16, 8, '#2e6b5a'); rect(c, x + 9, y + 3 + b, 2, 8, '#173c33');
    rect(c, x, y + 6, 3, 2, '#173c33'); rect(c, x + 17, y + 6, 3, 2, '#173c33');
    rect(c, x + 5, y + b, 4, 3, '#3f8f78'); rect(c, x + 11, y + b, 4, 3, '#3f8f78');
  } },
  falcon: { air: true, w: 24, h: 20, draw(c, x, y, t) {
    const f = Math.sin(t / 5) > 0 ? -3 : 3;
    rect(c, x + 8, y + 8, 10, 6, '#8a6a3f'); rect(c, x + 17, y + 7, 5, 4, '#c9a273');
    rect(c, x + 20, y + 8, 3, 2, '#e8b34a');
    rect(c, x + 2, y + 8 + f, 9, 3, '#6b4f2c'); rect(c, x + 0, y + 9 + f, 4, 3, '#6b4f2c');
  } },

  /* --- Londres --- */
  bus: { w: 34, h: 26, draw(c, x, y) {
    rect(c, x, y + 2, 34, 20, '#c0392b'); rect(c, x, y + 2, 34, 3, '#8e2a20');
    rect(c, x + 3, y + 6, 8, 7, '#bfe4f2'); rect(c, x + 13, y + 6, 8, 7, '#bfe4f2');
    rect(c, x + 23, y + 6, 8, 7, '#bfe4f2');
    rect(c, x + 3, y + 15, 28, 4, '#8e2a20');
    rect(c, x + 4, y + 22, 6, 4, '#22242a'); rect(c, x + 24, y + 22, 6, 4, '#22242a');
  } },
  phonebox: { w: 16, h: 30, draw(c, x, y) {
    rect(c, x, y, 16, 30, '#b8302a'); rect(c, x + 2, y + 4, 12, 18, '#9ec9d6');
    rect(c, x + 7, y + 4, 2, 18, '#b8302a');
    rect(c, x + 2, y + 12, 12, 2, '#b8302a');
    rect(c, x, y, 16, 4, '#d4443c'); rect(c, x + 4, y + 1, 8, 2, '#f0e0b0');
  } },
  puddle: { w: 30, h: 10, draw(c, x, y, t) {
    rect(c, x, y + 5, 30, 5, '#5b7f96'); rect(c, x + 2, y + 4, 26, 2, '#7ea6bb');
    const s = Math.sin(t / 8) * 2;
    rect(c, x + 6 + s, y + 6, 6, 1, '#cfe6f0'); rect(c, x + 18 - s, y + 7, 5, 1, '#cfe6f0');
  } },
  pigeonUK: { air: true, w: 22, h: 18, draw(c, x, y, t) {
    const f = Math.sin(t / 4) > 0 ? -3 : 2;
    rect(c, x + 6, y + 8, 10, 6, '#8f98a6'); rect(c, x + 15, y + 6, 5, 4, '#a8b1bd');
    rect(c, x + 19, y + 7, 2, 2, '#e0a13a');
    rect(c, x + 2, y + 7 + f, 8, 3, '#6f7885');
  } },

  /* --- Rumania (spa) --- */
  towels: { w: 22, h: 18, draw(c, x, y) {
    rect(c, x, y + 12, 22, 6, '#f2f2f7'); rect(c, x + 2, y + 6, 18, 6, '#dbe7f2');
    rect(c, x + 4, y, 14, 6, '#f7d9e4');
    rect(c, x, y + 14, 22, 1, '#c7c7d2'); rect(c, x + 2, y + 8, 18, 1, '#b9cbdd');
  } },
  bucket: { w: 16, h: 18, draw(c, x, y) {
    rect(c, x + 1, y + 4, 14, 14, '#9c6b3f'); rect(c, x + 9, y + 4, 6, 14, '#7d5330');
    rect(c, x, y + 3, 16, 3, '#c08a52');
    rect(c, x + 2, y + 6, 12, 3, '#6fc3d8');
  } },
  lounger: { w: 30, h: 16, draw(c, x, y) {
    rect(c, x + 2, y + 10, 26, 4, '#e8f0f5'); rect(c, x + 16, y, 12, 11, '#e8f0f5');
    rect(c, x + 17, y + 1, 10, 9, '#8fd0e0');
    rect(c, x + 3, y + 14, 3, 2, '#8a6a4a'); rect(c, x + 24, y + 14, 3, 2, '#8a6a4a');
  } },
  clothesline: { air: true, w: 30, h: 22, draw(c, x, y, t) {
    const s = Math.sin(t / 10);
    rect(c, x, y, 30, 1, '#c9b79a');
    rect(c, x + 3 + s, y + 1, 8, 16, '#f7d9e4');
    rect(c, x + 16 - s, y + 1, 9, 18, '#dbe7f2');
  } },

  /* --- Ecuador (Galapagos) --- */
  tortoise: { w: 30, h: 20, draw(c, x, y, t) {
    const b = Math.sin(t / 12) > 0 ? 0 : 1;
    rect(c, x + 4, y + 4, 22, 11, '#6b5b3e'); rect(c, x + 6, y + 2, 18, 3, '#8a7550');
    rect(c, x + 8, y + 5, 5, 4, '#a89066'); rect(c, x + 16, y + 6, 5, 4, '#a89066');
    rect(c, x + 25, y + 8, 5, 5, '#7d8f5e'); rect(c, x + 28, y + 9, 2, 1, '#2b2b1f');
    rect(c, x + 6, y + 15 + b, 4, 5, '#7d8f5e'); rect(c, x + 19, y + 15 - b, 4, 5, '#7d8f5e');
  } },
  volcRock: { w: 22, h: 22, draw(c, x, y) {
    rect(c, x + 2, y + 6, 18, 16, '#3f3b3a'); rect(c, x + 6, y, 10, 8, '#4e4948');
    rect(c, x + 11, y + 6, 9, 16, '#2c2928');
    rect(c, x + 4, y + 12, 4, 3, '#5e5857');
  } },
  iguana: { w: 26, h: 12, draw(c, x, y, t) {
    const b = Math.sin(t / 7) > 0 ? 0 : 1;
    rect(c, x + 4, y + 5, 16, 5, '#5a6b4a'); rect(c, x + 19, y + 4, 6, 4, '#6c7f58');
    rect(c, x, y + 6, 5, 2, '#4a5a3e');
    for (let i = 0; i < 6; i++) rect(c, x + 5 + i * 3, y + 3, 1, 2, '#8a9a70');
    rect(c, x + 6, y + 10 + b, 3, 2, '#4a5a3e'); rect(c, x + 15, y + 10 - b, 3, 2, '#4a5a3e');
  } },
  booby: { air: true, w: 24, h: 18, draw(c, x, y, t) {
    const f = Math.sin(t / 4) > 0 ? -3 : 2;
    rect(c, x + 6, y + 7, 11, 6, '#f2f2ee'); rect(c, x + 16, y + 5, 5, 4, '#f2f2ee');
    rect(c, x + 20, y + 6, 3, 2, '#5fa8c9');
    rect(c, x + 2, y + 6 + f, 8, 3, '#8a8f92');
    rect(c, x + 8, y + 13, 3, 3, '#5fa8c9'); rect(c, x + 13, y + 13, 3, 3, '#5fa8c9');
  } },

  /* --- Mexico --- */
  snake: { w: 26, h: 12, draw(c, x, y, t) {
    const s = Math.sin(t / 6) > 0 ? 0 : 1;
    for (let i = 0; i < 7; i++) {
      rect(c, x + i * 3, y + 6 + (i % 2 === 0 ? s : -s) + 2, 4, 4, i % 2 ? '#4f9a4a' : '#3d7a3a');
    }
    rect(c, x + 20, y + 4, 6, 5, '#5fb055'); rect(c, x + 24, y + 5, 2, 1, '#e8d24a');
  } },
  stela: { w: 16, h: 28, draw(c, x, y) {
    rect(c, x + 1, y, 14, 28, '#9a9384'); rect(c, x + 9, y, 6, 28, '#7d7668');
    rect(c, x + 3, y + 4, 8, 3, '#6a6459'); rect(c, x + 3, y + 11, 8, 3, '#6a6459');
    rect(c, x + 3, y + 18, 8, 3, '#6a6459');
  } },
  cactusMx: { w: 18, h: 26, draw(c, x, y) {
    rect(c, x + 6, y, 6, 26, '#4b8f4a'); rect(c, x + 9, y, 3, 26, '#3a7239');
    rect(c, x + 1, y + 8, 5, 3, '#4b8f4a'); rect(c, x + 1, y + 8, 3, 10, '#4b8f4a');
    rect(c, x + 12, y + 13, 5, 3, '#4b8f4a'); rect(c, x + 14, y + 13, 3, 9, '#3a7239');
    rect(c, x + 7, y - 3, 4, 4, '#e8637f');
  } },
  quetzal: { air: true, w: 24, h: 20, draw(c, x, y, t) {
    const f = Math.sin(t / 4) > 0 ? -3 : 2;
    rect(c, x + 8, y + 7, 10, 6, '#2fa07a'); rect(c, x + 16, y + 5, 5, 4, '#2fa07a');
    rect(c, x + 20, y + 6, 2, 2, '#e8b34a'); rect(c, x + 8, y + 13, 4, 7, '#1f7a5c');
    rect(c, x + 3, y + 6 + f, 8, 3, '#26886a');
  } },

  /* --- Italia --- */
  vespa: { w: 30, h: 22, draw(c, x, y) {
    rect(c, x + 6, y + 8, 18, 8, '#3fa9a0'); rect(c, x + 4, y + 12, 22, 4, '#2f8079');
    rect(c, x + 20, y + 2, 3, 8, '#5a5f66'); rect(c, x + 17, y + 1, 9, 2, '#5a5f66');
    rect(c, x + 2, y + 16, 6, 6, '#22242a'); rect(c, x + 21, y + 16, 6, 6, '#22242a');
    rect(c, x + 4, y + 18, 2, 2, '#8a8f95'); rect(c, x + 23, y + 18, 2, 2, '#8a8f95');
  } },
  gelato: { w: 24, h: 28, draw(c, x, y) {
    rect(c, x + 2, y + 10, 20, 12, '#f2efe6'); rect(c, x + 2, y + 10, 20, 3, '#d9d3c4');
    rect(c, x + 2, y + 6, 20, 4, '#e8637f'); rect(c, x + 8, y + 6, 4, 4, '#f2efe6');
    rect(c, x + 14, y + 6, 4, 4, '#f2efe6');
    rect(c, x + 4, y + 22, 3, 6, '#8a8478'); rect(c, x + 17, y + 22, 3, 6, '#8a8478');
  } },
  cat: { w: 22, h: 14, draw(c, x, y, t) {
    const tl = Math.sin(t / 9) > 0 ? 0 : 2;
    rect(c, x + 3, y + 6, 13, 6, '#3b3b40'); rect(c, x + 14, y + 3, 6, 6, '#3b3b40');
    rect(c, x + 14, y, 2, 3, '#3b3b40'); rect(c, x + 18, y, 2, 3, '#3b3b40');
    rect(c, x + 18, y + 5, 1, 1, '#e8d24a');
    rect(c, x + 1, y + 3 - tl, 2, 5, '#3b3b40');
    rect(c, x + 4, y + 12, 2, 2, '#2a2a2e'); rect(c, x + 12, y + 12, 2, 2, '#2a2a2e');
  } },
  pigeonIT: { air: true, w: 22, h: 18, draw(c, x, y, t) {
    const f = Math.sin(t / 4) > 0 ? -3 : 2;
    rect(c, x + 6, y + 8, 10, 6, '#9aa3ae'); rect(c, x + 15, y + 6, 5, 4, '#b3bcc6');
    rect(c, x + 19, y + 7, 2, 2, '#e0a13a'); rect(c, x + 2, y + 7 + f, 8, 3, '#7b8490');
  } },

  /* --- Paris --- */
  bench: { w: 30, h: 18, draw(c, x, y) {
    rect(c, x + 2, y + 8, 26, 3, '#8a5f3c'); rect(c, x + 2, y + 12, 26, 3, '#8a5f3c');
    rect(c, x + 2, y, 26, 3, '#9c6d47'); rect(c, x + 2, y + 4, 26, 3, '#9c6d47');
    rect(c, x + 1, y, 3, 18, '#4a4a52'); rect(c, x + 26, y, 3, 18, '#4a4a52');
  } },
  easel: { w: 24, h: 30, draw(c, x, y) {
    rect(c, x + 3, y + 4, 18, 14, '#f2ead8'); rect(c, x + 5, y + 6, 14, 10, '#7fb8d8');
    rect(c, x + 7, y + 11, 10, 5, '#5f8f4a');
    rect(c, x + 2, y, 3, 30, '#a07a4a'); rect(c, x + 19, y, 3, 30, '#a07a4a');
    rect(c, x + 4, y + 18, 16, 2, '#8a6a3f');
  } },
  crepeCart: { w: 28, h: 26, draw(c, x, y) {
    rect(c, x + 2, y + 8, 24, 12, '#e8e2d4'); rect(c, x + 2, y + 4, 24, 4, '#d84f63');
    rect(c, x + 8, y + 4, 4, 4, '#f2efe6'); rect(c, x + 16, y + 4, 4, 4, '#f2efe6');
    rect(c, x + 5, y + 11, 8, 5, '#c99a55');
    rect(c, x + 4, y + 20, 6, 6, '#3b3b40'); rect(c, x + 18, y + 20, 6, 6, '#3b3b40');
  } },
  pigeonFR: { air: true, w: 22, h: 18, draw(c, x, y, t) {
    const f = Math.sin(t / 4) > 0 ? -3 : 2;
    rect(c, x + 6, y + 8, 10, 6, '#a6aeb8'); rect(c, x + 15, y + 6, 5, 4, '#bfc7d0');
    rect(c, x + 19, y + 7, 2, 2, '#e0a13a'); rect(c, x + 2, y + 7 + f, 8, 3, '#868f9a');
  } },

  /* --- Marruecos --- */
  camel: { w: 34, h: 34, draw(c, x, y, t) {
    const b = Math.sin(t / 10) > 0 ? 0 : 1;
    rect(c, x + 4, y + 12, 22, 9, '#c99a63'); rect(c, x + 8, y + 8, 7, 5, '#c99a63');
    rect(c, x + 17, y + 9, 6, 4, '#c99a63');
    rect(c, x + 24, y + 4, 5, 10, '#c99a63'); rect(c, x + 26, y + 1, 7, 5, '#d8ab72');
    rect(c, x + 31, y + 3, 2, 1, '#2b1d14');
    rect(c, x + 6, y + 21 + b, 4, 13, '#b1854f'); rect(c, x + 19, y + 21 - b, 4, 13, '#b1854f');
    rect(c, x + 9, y + 10, 6, 3, '#c0392b');
  } },
  rug: { w: 22, h: 20, draw(c, x, y) {
    rect(c, x + 2, y + 2, 18, 18, '#b8443f'); rect(c, x + 5, y + 5, 12, 12, '#e0a13a');
    rect(c, x + 8, y + 8, 6, 6, '#2f6f8f');
    rect(c, x, y, 22, 3, '#8f342f'); rect(c, x, y + 17, 22, 3, '#8f342f');
  } },
  tajine: { w: 20, h: 20, draw(c, x, y) {
    rect(c, x + 1, y + 13, 18, 7, '#b06a3a'); rect(c, x + 4, y + 4, 12, 9, '#d18a4e');
    rect(c, x + 6, y + 1, 8, 4, '#d18a4e'); rect(c, x + 8, y - 2, 4, 3, '#8a4f28');
    rect(c, x + 5, y + 7, 10, 2, '#f0d8a8');
  } },
  hawk: { air: true, w: 26, h: 20, draw(c, x, y, t) {
    const f = Math.sin(t / 5) > 0 ? -4 : 3;
    rect(c, x + 9, y + 8, 10, 6, '#6b4f2c'); rect(c, x + 18, y + 7, 5, 4, '#8a6a3f');
    rect(c, x + 22, y + 8, 3, 2, '#e8b34a');
    rect(c, x + 1, y + 8 + f, 10, 3, '#54401f'); rect(c, x + 14, y + 8 - f, 8, 3, '#54401f');
  } },

  /* --- Madrid --- */
  scooter: { w: 24, h: 26, draw(c, x, y) {
    rect(c, x + 4, y + 20, 16, 3, '#3b3f4a');
    rect(c, x + 16, y, 3, 21, '#5a5f6b'); rect(c, x + 11, y, 12, 2, '#5a5f6b');
    rect(c, x + 2, y + 21, 5, 5, '#22242a'); rect(c, x + 17, y + 21, 5, 5, '#22242a');
    rect(c, x + 18, y + 3, 3, 2, '#ffe9a8');
  } },
  suitcase: { w: 22, h: 22, draw(c, x, y) {
    rect(c, x + 8, y, 6, 5, '#8a8f9a'); rect(c, x + 1, y + 5, 20, 17, '#8f4f7a');
    rect(c, x + 1, y + 10, 20, 2, '#6e3a5e'); rect(c, x + 13, y + 5, 8, 17, '#7a4268');
    rect(c, x + 4, y + 14, 4, 3, '#e8c86a');
  } },
  cone: { w: 18, h: 20, draw(c, x, y) {
    rect(c, x, y + 16, 18, 4, '#e0762f');
    for (let i = 0; i < 16; i++) {
      const w = Math.max(2, 12 - i);
      rect(c, x + 9 - Math.round(w / 2), y + 16 - i, w, 1, (i > 5 && i < 9) ? '#f2f2f2' : '#e0762f');
    }
  } },
  balloons: { air: true, w: 24, h: 26, draw(c, x, y, t) {
    const s = Math.round(Math.sin(t / 12) * 2);
    rect(c, x + 6, y + s, 9, 11, '#e8637f'); rect(c, x + 14, y + 4 + s, 8, 10, '#f2b13f');
    rect(c, x + 2, y + 6 + s, 8, 10, '#7fb8d8');
    rect(c, x + 10, y + 11 + s, 1, 12, '#f2f2f2');
  } }
};

/* =============================================================
   LAS 9 ESCENAS
   ============================================================= */
const SCENES = [
  {
    id: 'egipto', name: 'EGIPTO', sub: 'Las piramides de Giza',
    memory: 'Donde el desierto nos dio la primera aventura.',
    obstacles: ['stone', 'urn', 'scarab', 'falcon', 'stone', 'scarab'],
    groundTop: '#e8be80', groundBody: '#c2914f', groundDeep: '#9c7239',
    sky: ['#f7cf8b', '#f0a05c'],
    far(c, s) {
      skyGradient(c, this.sky[0], this.sky[1], 8);
      circle(c, 390, 54, 22, '#ffe9a0');
      const fx = -s * 0.12;
      pyramid(c, 300 + fx, 152, 78, 74, '#dcb173', '#b98d52');
      pyramid(c, 200 + fx, 152, 52, 50, '#d3a468', '#ad814a');
      pyramid(c, 388 + fx, 152, 40, 38, '#cfa066', '#a87d47');
      rect(c, 0, 152, VIEW_W, 4, '#c99a5f');
    },
    mid(c, s) {
      const mx = -s * 0.35;
      tile(mx, 150, (x, i) => {
        palm(c, x + 20, GROUND_Y - 2, 26 + Math.round(rnd(i) * 10), '#6b4f2c', '#3f6b3a');
        for (let k = 0; k < 4; k++) rect(c, x + 92 + k * 9, GROUND_Y - 8, 8, 8, k % 2 ? '#a8834f' : '#b58e58');
        rect(c, x + 88, GROUND_Y - 10, 5, 10, '#96743f');
      });
      tile(mx * 0.7, 96, (x, i) => {
        const h = 8 + Math.round(rnd(i) * 7);
        for (let j = 0; j < h; j++) {
          const w = Math.round((h - j) * 3.4) + 8;
          rect(c, x + 30 - w, GROUND_Y - j, w * 2, 1, '#dcae72');
        }
      });
    }
  },
  {
    id: 'londres', name: 'LONDRES', sub: 'El Big Ben bajo la lluvia',
    memory: 'Nos mojamos enteros y no paramos de reir.',
    obstacles: ['puddle', 'phonebox', 'bus', 'pigeonUK', 'puddle', 'phonebox'],
    groundTop: '#7b8291', groundBody: '#5d6472', groundDeep: '#464c58',
    sky: ['#8e9caa', '#ccd4da'], rain: true,
    far(c, s) {
      skyGradient(c, this.sky[0], this.sky[1], 8);
      const fx = -s * 0.12;
      tile(fx * 0.6, 60, (x, i) => {
        const h = 40 + rnd(i) * 34;
        rect(c, x, 160 - h, 46, h, '#7d8593');
        for (let w = 0; w < 4; w++) rect(c, x + 5 + w * 10, 168 - h, 5, 6, '#a9b2bd');
      });
      // Big Ben
      const bx = 300 + fx;
      rect(c, bx, 60, 28, 100, '#b9a884'); rect(c, bx + 18, 60, 10, 100, '#9c8d6c');
      rect(c, bx + 4, 74, 20, 20, '#e8dfc4'); rect(c, bx + 12, 78, 2, 8, '#4a4436');
      rect(c, bx + 12, 84, 7, 2, '#4a4436');
      rect(c, bx + 2, 52, 24, 8, '#a4936f');
      for (let i = 0; i < 14; i++) rect(c, bx + 6 + i / 2, 52 - i, 16 - i, 1, '#8f8060');
      rect(c, bx + 12, 34, 2, 6, '#c9b98f');
      // London Eye
      const ex = 130 + fx;
      ring(c, ex, 116, 34, 4, '#b3bdc8');
      for (let a = 0; a < 12; a++) {
        const an = a * Math.PI / 6;
        for (let k = 0; k < 30; k += 3) {
          rect(c, ex + Math.cos(an) * k, 116 + Math.sin(an) * k, 1, 1, '#9aa5b0');
        }
        rect(c, ex + Math.cos(an) * 31 - 1, 116 + Math.sin(an) * 31 - 1, 3, 3, '#d8e0e8');
      }
      rect(c, ex - 2, 116, 4, 44, '#8e98a3');
      rect(c, 0, 158, VIEW_W, 6, '#6a7280');
    },
    mid(c, s) {
      const mx = -s * 0.35;
      tile(mx, 120, (x) => {
        rect(c, x + 30, GROUND_Y - 42, 3, 42, '#33363d');
        rect(c, x + 27, GROUND_Y - 50, 9, 9, '#ffe9a8');
        rect(c, x + 74, GROUND_Y - 20, 13, 20, '#6e3833');
        rect(c, x + 73, GROUND_Y - 23, 15, 4, '#552a26');
        rect(c, x + 100, GROUND_Y - 13, 11, 13, '#3a4049');
        rect(c, x + 99, GROUND_Y - 15, 13, 3, '#4c535e');
      });
    }
  },
  {
    id: 'rumania', name: 'RUMANIA', sub: 'El spa de los Carpatos',
    memory: 'Vapor, silencio y tu mano bajo el agua.',
    obstacles: ['bucket', 'lounger', 'towels', 'clothesline', 'bucket', 'lounger'],
    groundTop: '#b98a5a', groundBody: '#95693e', groundDeep: '#704e2c',
    sky: ['#a9d6e8', '#e6f3f7'],
    far(c, s) {
      skyGradient(c, this.sky[0], this.sky[1], 8);
      const fx = -s * 0.12;
      tile(fx * 0.5, 170, (x, i) => {
        const h = 70 + rnd(i) * 24;
        for (let j = 0; j < h; j++) {
          const w = Math.round((h - j) * 1.15);
          rect(c, x + 85 - w, 160 - j, w * 2, 1, j > h - 14 ? '#f2f7fa' : '#8fa3b5');
          rect(c, x + 85, 160 - j, w, 1, j > h - 14 ? '#dde8ef' : '#77899a');
        }
      });
      // edificio balneario
      const bx = 300 + fx;
      rect(c, bx, 116, 76, 44, '#e6dccb'); rect(c, bx, 116, 76, 5, '#b9483f');
      for (let i = 0; i < 4; i++) rect(c, bx + 8 + i * 17, 126, 10, 14, '#7fb8c9');
      rect(c, bx + 30, 106, 16, 12, '#e6dccb'); rect(c, bx + 30, 104, 16, 4, '#b9483f');
      rect(c, 0, 158, VIEW_W, 6, '#8aa06f');
    },
    mid(c, s) {
      const mx = -s * 0.35;
      tile(mx, 128, (x, i) => {
        pine(c, x, GROUND_Y, 22 + rnd(i) * 10, '#2f5d3f', '#3c7350');
        pine(c, x + 30, GROUND_Y, 15 + rnd(i * 3) * 7, '#275036', '#356645');
      });
      // piscina de vapor
      tile(mx, 220, (x) => {
        rect(c, x + 120, GROUND_Y - 8, 60, 8, '#6fc3d8');
        rect(c, x + 122, GROUND_Y - 8, 56, 2, '#a8e0ea');
      });
    }
  },
  {
    id: 'ecuador', name: 'ECUADOR', sub: 'Islas Galapagos',
    memory: 'Tortugas lentas y nosotros sin prisa.',
    obstacles: ['volcRock', 'tortoise', 'iguana', 'booby', 'volcRock', 'tortoise'],
    groundTop: '#e8d9b0', groundBody: '#c9b689', groundDeep: '#a89768',
    sky: ['#7fd2ea', '#dbf3ef'],
    far(c, s) {
      skyGradient(c, this.sky[0], this.sky[1], 8);
      circle(c, 408, 46, 16, '#fff3c4');
      const fx = -s * 0.12;
      // islas volcanicas
      tile(fx * 0.6, 200, (x, i) => {
        const h = 44 + rnd(i) * 20;
        for (let j = 0; j < h; j++) {
          const w = Math.round((h - j) * 1.5);
          rect(c, x + 70 - w, 150 - j, w * 2, 1, '#4f5a52');
          rect(c, x + 70, 150 - j, w, 1, '#3c443e');
        }
      });
      // mar
      rect(c, 0, 150, VIEW_W, 14, '#2f9fc4');
      for (let i = 0; i < 40; i++) {
        const wx = (i * 27 - s * 0.5) % VIEW_W;
        rect(c, wx < 0 ? wx + VIEW_W : wx, 153 + (i % 3) * 4, 9, 1, '#7fd0e8');
      }
      rect(c, 0, 162, VIEW_W, GROUND_Y - 162, '#efe0ba');
      rect(c, 0, 162, VIEW_W, 3, '#f7ecd0');
    },
    mid(c, s) {
      const mx = -s * 0.35;
      tile(mx, 130, (x, i) => {
        palm(c, x + 10, GROUND_Y, 24 + rnd(i) * 8, '#7a5c38', '#3f7a4a');
        rect(c, x + 70, GROUND_Y - 7, 22, 7, '#7d8a80');
        rect(c, x + 96, GROUND_Y - 4, 14, 4, '#6b776e');
      });
    }
  },
  {
    id: 'mexico', name: 'MEXICO', sub: 'Chichen Itza',
    memory: 'Subimos mil escalones solo por la vista contigo.',
    obstacles: ['cactusMx', 'snake', 'stela', 'quetzal', 'cactusMx', 'snake'],
    groundTop: '#6ba054', groundBody: '#4f7c3f', groundDeep: '#3a5c2f',
    sky: ['#6fc6ea', '#d6eef4'],
    far(c, s) {
      skyGradient(c, this.sky[0], this.sky[1], 8);
      const fx = -s * 0.12;
      // jungla lejana
      tile(fx * 0.5, 40, (x, i) => {
        circle(c, x + 20, 150 - rnd(i) * 10, 16 + rnd(i * 2) * 6, '#3f6b46');
      });
      // piramide de Kukulcan
      const px = 300 + fx;
      const steps = 9;
      for (let i = 0; i < steps; i++) {
        const w = 82 - i * 8;
        rect(c, px - w, 152 - i * 8, w * 2, 8, '#c9b98f');
        rect(c, px, 152 - i * 8, w, 8, '#a89a72');
        rect(c, px - w, 152 - i * 8, w * 2, 1, '#e0d3ac');
      }
      rect(c, px - 14, 152 - steps * 8 - 14, 28, 14, '#c9b98f');
      rect(c, px, 152 - steps * 8 - 14, 14, 14, '#a89a72');
      for (let i = 0; i < steps * 8; i += 2) rect(c, px - 6, 152 - i, 12, 1, '#8f8163');
      rect(c, 0, 158, VIEW_W, 6, '#4f7c3f');
    },
    mid(c, s) {
      const mx = -s * 0.35;
      tile(mx, 110, (x, i) => {
        rect(c, x + 8, GROUND_Y - 30, 8, 30, '#5c4630');
        circle(c, x + 12, GROUND_Y - 34, 14, '#2f6b3f');
        circle(c, x + 24, GROUND_Y - 28, 10, '#3a7a49');
        circle(c, x + 78, GROUND_Y - 6, 9, '#37693f');
        circle(c, x + 88, GROUND_Y - 4, 7, '#40794a');
      });
    }
  },
  {
    id: 'italia', name: 'ITALIA', sub: 'El Coliseo de Roma',
    memory: 'Gelato de pistacho y un beso en cada esquina.',
    obstacles: ['cat', 'gelato', 'vespa', 'pigeonIT', 'cat', 'vespa'],
    groundTop: '#b0a596', groundBody: '#8c8274', groundDeep: '#6b6357',
    sky: ['#f7cf94', '#fae7c9'],
    far(c, s) {
      skyGradient(c, this.sky[0], this.sky[1], 8);
      circle(c, 60, 60, 20, '#ffeec0');
      const fx = -s * 0.12;
      tile(fx * 0.55, 90, (x, i) => {
        const h = 30 + rnd(i) * 20;
        rect(c, x, 160 - h, 54, h, '#d8b98f');
        rect(c, x, 160 - h, 54, 4, '#b8703f');
        for (let w = 0; w < 3; w++) rect(c, x + 8 + w * 15, 168 - h, 7, 8, '#9c8560');
      });
      // Coliseo
      const cx = 300 + fx;
      const topAt = i => {
        const k = Math.abs(i) / 62;
        let t = 94 + Math.round(k * k * 16);
        if (i > 22) t += Math.round((i - 22) * 0.75); // parte derrumbada
        return t;
      };
      for (let i = -62; i <= 62; i++) {
        const t = topAt(i);
        rect(c, cx + i, t, 1, 160 - t, i > 16 ? '#c2ad84' : '#d9c49a');
        rect(c, cx + i, t, 1, 3, '#b09a72');
      }
      for (let row = 0; row < 3; row++) {
        for (let i = 0; i < 8; i++) {
          const ox = -56 + i * 15, ay = 104 + row * 19;
          if (ay < topAt(ox) + 6) continue;
          rect(c, cx + ox, ay + 4, 10, 12, '#7d6c4f');
          rect(c, cx + ox + 1, ay, 8, 6, '#7d6c4f');
        }
      }
      rect(c, 0, 158, VIEW_W, 6, '#a89a80');
    },
    mid(c, s) {
      const mx = -s * 0.35;
      tile(mx, 120, (x, i) => {
        // cipres
        for (let j = 0; j < 34; j++) {
          const w = Math.max(2, Math.round(7 - Math.abs(j - 17) * 0.25));
          rect(c, x + 12 - w, GROUND_Y - j, w * 2, 1, j % 4 === 0 ? '#2c5238' : '#25462f');
        }
        rect(c, x + 60, GROUND_Y - 14, 4, 14, '#6b6357');
        rect(c, x + 56, GROUND_Y - 20, 12, 7, '#8c8274');
      });
    }
  },
  {
    id: 'paris', name: 'PARIS', sub: 'La Torre Eiffel',
    memory: 'Te dije que era la vista mas bonita. Mentia: eras tu.',
    obstacles: ['bench', 'crepeCart', 'easel', 'pigeonFR', 'bench', 'crepeCart'],
    groundTop: '#c7b6a0', groundBody: '#a2917c', groundDeep: '#7d6f5e',
    sky: ['#f5a6bb', '#fde2d6'],
    far(c, s) {
      skyGradient(c, this.sky[0], this.sky[1], 8);
      circle(c, 410, 70, 18, '#ffd9c2');
      const fx = -s * 0.12;
      tile(fx * 0.55, 70, (x, i) => {
        const h = 34 + rnd(i) * 16;
        rect(c, x, 158 - h, 58, h, '#cfc0ad');
        rect(c, x, 158 - h, 58, 4, '#7f7466');
        for (let w = 0; w < 4; w++) rect(c, x + 6 + w * 13, 166 - h, 6, 8, '#8e8375');
      });
      // Torre Eiffel
      const tx = 300 + fx, base = 158;
      const col = '#8a6f52';
      for (let i = 0; i < 108; i++) {
        const k = i / 108;
        const w = Math.round(34 * Math.pow(1 - k, 2.1)) + 2;
        rect(c, tx - w, base - i, 2, 1, col);
        rect(c, tx + w - 2, base - i, 2, 1, col);
        if (i % 12 === 0 && i < 40) rect(c, tx - w, base - i, w * 2, 1, col);
      }
      rect(c, tx - 22, base - 34, 44, 4, col);
      rect(c, tx - 12, base - 66, 24, 3, col);
      rect(c, tx - 1, base - 118, 2, 12, col);
      rect(c, tx - 2, base - 122, 4, 4, '#ffe9a8');
      rect(c, 0, 158, VIEW_W, 6, '#9a8b76');
    },
    mid(c, s) {
      const mx = -s * 0.35;
      tile(mx, 100, (x, i) => {
        rect(c, x + 20, GROUND_Y - 36, 3, 36, '#3f3a34');
        rect(c, x + 17, GROUND_Y - 44, 9, 9, '#ffeeb0');
        for (let j = 0; j < 20; j++) {
          const w = Math.max(3, Math.round(9 - Math.abs(j - 12) * 0.4));
          rect(c, x + 66 - w, GROUND_Y - 14 - j, w * 2, 1, '#3f6b46');
        }
        rect(c, x + 64, GROUND_Y - 14, 4, 14, '#5c4630');
      });
    }
  },
  {
    id: 'marruecos', name: 'MARRUECOS', sub: 'El desierto y los camellos',
    memory: 'Dormimos bajo mil estrellas en medio de la nada.',
    obstacles: ['tajine', 'rug', 'camel', 'hawk', 'tajine', 'camel'],
    groundTop: '#f0cd8c', groundBody: '#d3a761', groundDeep: '#ab8146',
    sky: ['#fbd48a', '#f39a5c'],
    far(c, s) {
      skyGradient(c, this.sky[0], this.sky[1], 8);
      circle(c, 240, 66, 30, '#ffe6a0'); circle(c, 240, 66, 24, '#fff4c9');
      const fx = -s * 0.12;
      tile(fx * 0.5, 210, (x, i) => {
        for (let j = 0; j < 46; j++) {
          const w = Math.round((46 - j) * 2.6) + 20;
          rect(c, x + 100 - w, 160 - j, w * 2, 1, '#e0b878');
          rect(c, x + 100, 160 - j, w, 1, '#c99f5f');
        }
      });
      tile(fx * 0.8 - 90, 160, (x) => {
        for (let j = 0; j < 30; j++) {
          const w = Math.round((30 - j) * 2.4) + 16;
          rect(c, x + 70 - w, 164 - j, w * 2, 1, '#eec489');
        }
      });
      rect(c, 0, 160, VIEW_W, 6, '#e6b877');
    },
    mid(c, s) {
      const mx = -s * 0.35;
      tile(mx, 160, (x, i) => {
        palm(c, x + 12, GROUND_Y, 30 + rnd(i) * 8, '#7a5c38', '#4f7a3f');
        // jaima bereber
        for (let j = 0; j < 22; j++) {
          const w = Math.round(j * 1.5) + 2;
          rect(c, x + 90 - w, GROUND_Y - 22 + j, w * 2, 1, j % 5 === 0 ? '#b8443f' : '#d9cbb0');
        }
      });
    }
  },
  {
    id: 'madrid', name: 'MADRID', sub: 'La cita',
    memory: 'Aqui empieza (otra vez) todo.',
    obstacles: ['cone', 'suitcase', 'scooter', 'balloons', 'cone', 'scooter'],
    groundTop: '#585268', groundBody: '#413c52', groundDeep: '#2e2a3c',
    sky: ['#1b1b3a', '#4a3260'], night: true,
    far(c, s) {
      skyGradient(c, this.sky[0], this.sky[1], 8);
      stars(c, 3);
      circle(c, 400, 44, 14, '#f7f0d0');
      circle(c, 394, 40, 12, '#2a2748');
      const fx = -s * 0.12;
      tile(fx * 0.55, 76, (x, i) => {
        const h = 44 + rnd(i) * 40;
        rect(c, x, 160 - h, 62, h, '#2b2740');
        rect(c, x, 160 - h, 62, 3, '#3a3554');
        for (let r = 0; r < 5; r++) for (let w = 0; w < 4; w++) {
          if (rnd(i * 9 + r * 4 + w) > 0.45) {
            rect(c, x + 7 + w * 14, 168 - h + r * 13, 7, 8, '#ffe08a');
          }
        }
      });
      rect(c, 0, 158, VIEW_W, 6, '#332e46');
    },
    mid(c, s) {
      const mx = -s * 0.35;
      // guirnalda de luces
      tile(mx * 0.9, 60, (x, i) => {
        for (let j = 0; j < 60; j += 2) {
          const y = 58 + Math.sin((j / 60) * Math.PI) * 16;
          rect(c, x + j, y, 1, 1, '#5a5470');
        }
        const bx = x + 30, by = 58 + 16;
        rect(c, bx, by, 3, 3, ['#ffd97a', '#ff9aa8', '#9fd8ff'][i % 3]);
      });
      tile(mx, 130, (x) => {
        rect(c, x + 24, GROUND_Y - 40, 3, 40, '#2e2a3c');
        rect(c, x + 21, GROUND_Y - 48, 9, 9, '#ffe9a8');
        rect(c, x + 80, GROUND_Y - 10, 26, 3, '#4a4160');
        rect(c, x + 80, GROUND_Y - 15, 26, 3, '#524770');
        rect(c, x + 81, GROUND_Y - 15, 3, 15, '#332e46');
        rect(c, x + 103, GROUND_Y - 15, 3, 15, '#332e46');
        rect(c, x + 112, GROUND_Y - 12, 5, 12, '#3a3550');
        rect(c, x + 111, GROUND_Y - 16, 7, 5, '#ffcf7a');
      });
    }
  }
];

/* dibuja el suelo con textura */
function drawGround(ctx, scene, scroll) {
  rect(ctx, 0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y, scene.groundBody);
  rect(ctx, 0, GROUND_Y, VIEW_W, 4, scene.groundTop);
  rect(ctx, 0, VIEW_H - 16, VIEW_W, 16, scene.groundDeep);
  const off = -(scroll % 32);
  for (let i = -1; i < VIEW_W / 32 + 2; i++) {
    const x = i * 32 + off;
    rect(ctx, x, GROUND_Y + 4, 16, 2, scene.groundDeep);
    rect(ctx, x + 20, GROUND_Y + 12, 10, 2, scene.groundDeep);
    rect(ctx, x + 6, GROUND_Y + 22, 14, 2, scene.groundDeep);
  }
}

/* meta: la casa romantica de Madrid */
function drawGoal(ctx, x, t) {
  const y = GROUND_Y - 92;
  rect(ctx, x - 4, y + 30, 96, 62, '#c9b7a0');
  rect(ctx, x - 4, y + 30, 96, 4, '#e0d0ba');
  // tejado
  for (let i = 0; i < 30; i++) rect(ctx, x - 8 + i * 1.6, y + 30 - i, 100 - i * 3.2, 1, '#8f4a44');
  // puerta
  rect(ctx, x + 34, y + 60, 20, 32, '#6b4028');
  rect(ctx, x + 43, y + 60, 2, 32, '#523020');
  rect(ctx, x + 38, y + 74, 2, 2, '#e8c86a');
  // ventanas con luz calida
  rect(ctx, x + 6, y + 44, 20, 16, '#ffd98a'); rect(ctx, x + 62, y + 44, 20, 16, '#ffd98a');
  rect(ctx, x + 15, y + 44, 2, 16, '#a8814a'); rect(ctx, x + 71, y + 44, 2, 16, '#a8814a');
  // cartel corazon
  const p = Math.sin(t / 10) > 0 ? 1 : 0;
  const hx = x + 36, hy = y + 12 - p;
  const heart = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
  for (let r = 0; r < heart.length; r++) for (let cc = 0; cc < heart[r].length; cc++) {
    if (heart[r][cc] === 'X') rect(ctx, hx + cc * 2, hy + r * 2, 2, 2, '#ff5b7a');
  }
  // mesa con velas fuera
  rect(ctx, x + 96, GROUND_Y - 16, 26, 3, '#e8e2d4');
  rect(ctx, x + 100, GROUND_Y - 13, 3, 13, '#8a8478');
  rect(ctx, x + 115, GROUND_Y - 13, 3, 13, '#8a8478');
  rect(ctx, x + 106, GROUND_Y - 22, 3, 6, '#f2efe6');
  rect(ctx, x + 106, GROUND_Y - 25, 3, 3, '#ffcf5b');
}
