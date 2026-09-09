/* =============================================================
   SPRITES — Pixel art de los personajes
   -------------------------------------------------------------
   Cada sprite es una lista de filas de texto. Cada letra es un
   color del "palette" de abajo. El punto "." es transparente.

   >>> PARA PARECERSE A LA FOTO, CAMBIA SOLO ESTOS COLORES <<<
   ============================================================= */

const LOOKS = {
  christian: {
    name: 'Christian',
    palette: {
      H: '#1b120d', // pelo (sombra)
      h: '#2f2018', // pelo
      s: '#e7b088', // piel
      S: '#c98c64', // piel sombra
      e: '#1a1013', // ojos
      m: '#3b2a1f', // barba / boca
      b: '#3f7cb4', // camiseta
      B: '#2c5c8a', // camiseta sombra
      p: '#2f3446', // pantalon
      o: '#efefef'  // zapatillas
    }
  },
  melissa: {
    name: 'Melissa',
    palette: {
      H: '#2e1a10', // pelo (sombra)
      h: '#4b2c1a', // pelo
      s: '#f0c39b', // piel
      S: '#d49f77', // piel sombra
      e: '#1a1013', // ojos
      m: '#c2566a', // labios
      d: '#e2586b', // vestido
      D: '#b83f52', // vestido sombra
      o: '#f6e3cb'  // zapatos
    }
  }
};

/* ---------- CHRISTIAN ---------- */
const C_TOP = [
  '............',
  '...HHHHHH...',
  '..HhhhhhhH..',
  '..HssssssH..',
  '...sesses...',
  '...smmmms...',
  '...bbbbbb...',
  '..sbbbbbbs..',
  '..sbbbbbbs..',
  '...bbbbbb...'
];

const C_LEGS = {
  stand: [
    '...pppppp...',
    '...pp..pp...',
    '...pp..pp...',
    '...pp..pp...',
    '..ooo..ooo..',
    '............'
  ],
  runA: [
    '...pppppp...',
    '...ppppp....',
    '..pp...pp...',
    '.pp.....pp..',
    'ooo.....ooo.',
    '............'
  ],
  runB: [
    '...pppppp...',
    '...pp.pp....',
    '...pp..pp...',
    '..pp....pp..',
    '.ooo....ooo.',
    '............'
  ],
  jump: [
    '...pppppp...',
    '..pp...ppp..',
    '.pp......pp.',
    '.oo......oo.',
    '............',
    '............'
  ]
};

const C_CROUCH = [
  '..............',
  '.....HHHHHH...',
  '....HhhhhhhH..',
  '....HssssssH..',
  '.....sesses...',
  '.....smmmms...',
  '...bbbbbbbss..',
  '..bbbbbbbbb...',
  '..pppppppp....',
  '..pp...pp.....',
  '.ooo..ooo.....'
];

/* ---------- MELISSA ---------- */
const M_TOP = [
  '............',
  '...HHHHHH...',
  '..HhhhhhhH..',
  '.HhssssssHh.',
  '.Hhsesseshh.',
  '.Hhssmmsshh.',
  '.Hhddddddhh.',
  '.shddddddhs.',
  '.sdddddddds.',
  '..dddddddd..'
];

const M_LEGS = {
  stand: [
    '.DDDDDDDDDD.',
    '...ss..ss...',
    '...ss..ss...',
    '...ss..ss...',
    '..ooo..ooo..',
    '............'
  ],
  runA: [
    '.DDDDDDDDDD.',
    '..ss...ss...',
    '.ss.....ss..',
    'ss.......ss.',
    'ooo.....ooo.',
    '............'
  ],
  runB: [
    '.DDDDDDDDDD.',
    '...ss.ss....',
    '...ss..ss...',
    '..ss....ss..',
    '.ooo....ooo.',
    '............'
  ],
  jump: [
    '.DDDDDDDDDD.',
    '..ss...sss..',
    '.ss......ss.',
    '.oo......oo.',
    '............',
    '............'
  ]
};

const M_CROUCH = [
  '..............',
  '.....HHHHHH...',
  '....HhhhhhhH..',
  '...HhssssssHh.',
  '...Hhsesseshh.',
  '...Hhssmmsshh.',
  '..ddddddddss..',
  '.dddddddddd...',
  '.DDDDDDDDD....',
  '..ss...ss.....',
  '.ooo..ooo.....'
];

function buildFrames(top, legs, crouch) {
  return {
    stand: top.concat(legs.stand),
    runA: top.concat(legs.runA),
    runB: top.concat(legs.runB),
    jump: top.concat(legs.jump),
    crouch: crouch
  };
}

const SPRITES = {
  christian: buildFrames(C_TOP, C_LEGS, C_CROUCH),
  melissa: buildFrames(M_TOP, M_LEGS, M_CROUCH)
};

/* Dibuja un sprite de texto en el canvas.
   x,y = esquina superior izquierda, en pixeles logicos.
   scale = cuantos pixeles logicos mide cada "pixel" del sprite. */
function drawSprite(ctx, rows, palette, x, y, scale, flip, tint) {
  x = Math.round(x);
  y = Math.round(y);
  const w = rows[0].length;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '.') continue;
      const color = tint || palette[ch];
      if (!color) continue;
      const cx = flip ? (w - 1 - c) : c;
      ctx.fillStyle = color;
      ctx.fillRect(x + cx * scale, y + r * scale, scale, scale);
    }
  }
}

function spriteSize(rows, scale) {
  return { w: rows[0].length * scale, h: rows.length * scale };
}
