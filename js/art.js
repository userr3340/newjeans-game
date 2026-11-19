import { TILE, GROUND, ROWS } from './level.js';

export const INK = '#22336e';

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function blob(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y) + 0.35);
    ctx.fillRect(cx - half, cy + y, half * 2 + 1, 1);
  }
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

const CHECK_A = '#ffd9ec';
const CHECK_B = '#f7c4df';
const CHECK_LINE = '#eeb2d3';

function groundFill(ctx, px, py, w, h) {
  for (let y = py; y < py + h; y += 8) {
    for (let x = px; x < px + w; x += 8) {
      const odd = ((x >> 3) + (y >> 3)) & 1;
      rect(ctx, x, y, 8, 8, odd ? CHECK_B : CHECK_A);
    }
  }
  ctx.fillStyle = CHECK_LINE;
  for (let y = py; y < py + h; y += 16) ctx.fillRect(px, y, w, 1);
}

function drawGrounds(ctx, L, r) {
  for (const g of L.grounds) {
    const px = g.x0 * TILE;
    const w = (g.x1 - g.x0 + 1) * TILE;
    const top = g.top * TILE;
    const h = L.height - top;
    groundFill(ctx, px, top, w, h);
    rect(ctx, px, top, w, 1, INK);
    rect(ctx, px, top + 1, w, 4, '#b4f0d2');
    rect(ctx, px, top + 1, w, 1, '#e4fff2');
    for (let x = px; x < px + w; x++) {
      const drip = (x * 7 + (x >> 2)) % 5 === 0 ? 2 : ((x * 13) % 7 === 0 ? 1 : 0);
      rect(ctx, x, top + 5, 1, 1 + drip, '#86dbb3');
    }
    if (!isSolidAt(L, g.x0 - 1, g.top)) {
      rect(ctx, px, top, 1, h, INK);
      rect(ctx, px + 1, top + 6, 1, h - 6, '#fff0f8');
    }
    if (!isSolidAt(L, g.x1 + 1, g.top)) {
      rect(ctx, px + w - 1, top, 1, h, INK);
      rect(ctx, px + w - 2, top + 6, 1, h - 6, '#e5a6c9');
    }
    for (let tx = g.x0; tx <= g.x1; tx++) {
      if (r() < 0.32) flower(ctx, tx * TILE + 2 + Math.floor(r() * 11), top, r);
      else if (r() < 0.25) tuft(ctx, tx * TILE + 3 + Math.floor(r() * 9), top);
    }
  }
}

function isSolidAt(L, tx, ty) {
  if (tx < 0 || tx >= L.cols) return true;
  return L.grid[ty * L.cols + tx] === 1;
}

const FLOWER_COLORS = ['#ff8fc0', '#fff38a', '#ffffff', '#b9a6ff', '#8fd3ff'];

function flower(ctx, x, top, r) {
  const c = FLOWER_COLORS[Math.floor(r() * FLOWER_COLORS.length)];
  rect(ctx, x + 1, top - 2, 1, 2, '#55b98c');
  rect(ctx, x, top - 4, 3, 1, c);
  rect(ctx, x + 1, top - 5, 1, 3, c);
  rect(ctx, x + 1, top - 4, 1, 1, c === '#fff38a' ? '#ff9ec8' : '#fff38a');
}

function tuft(ctx, x, top) {
  rect(ctx, x, top - 2, 1, 2, '#6fcfa1');
  rect(ctx, x + 2, top - 3, 1, 3, '#6fcfa1');
  rect(ctx, x + 4, top - 2, 1, 2, '#6fcfa1');
}

function drawBlocks(ctx, L) {
  for (const b of L.blocks) {
    for (let ty = b.y0; ty <= b.y1; ty++) {
      for (let tx = b.x0; tx <= b.x1; tx++) brick(ctx, tx * TILE, ty * TILE);
    }
  }
}

function brick(ctx, x, y) {
  rect(ctx, x, y, 16, 16, INK);
  rect(ctx, x + 1, y + 1, 14, 14, '#9fd0ff');
  rect(ctx, x + 1, y + 1, 14, 2, '#e3f2ff');
  rect(ctx, x + 1, y + 1, 2, 13, '#e3f2ff');
  rect(ctx, x + 2, y + 13, 13, 2, '#6aa4ea');
  rect(ctx, x + 13, y + 3, 2, 11, '#6aa4ea');
  rect(ctx, x + 7, y + 5, 2, 6, '#ffffff');
  rect(ctx, x + 5, y + 7, 6, 2, '#ffffff');
  rect(ctx, x + 7, y + 7, 2, 2, '#ffb3d6');
}

const BUILDING_STYLES = [
  { wall: '#ffc8e1', trim: '#f29cc6', dark: '#d97aab', glass: '#c3e7ff', lit: '#fff2b0' },
  { wall: '#dccbff', trim: '#b49cf0', dark: '#9479d9', glass: '#c3e7ff', lit: '#ffd0e6' },
  { wall: '#c2f1dc', trim: '#8ed8b8', dark: '#64bd98', glass: '#d6f0ff', lit: '#fff2b0' },
  { wall: '#fff0b8', trim: '#f2cf6b', dark: '#d6a843', glass: '#c3e7ff', lit: '#ffd0e6' },
  { wall: '#c9dbff', trim: '#96b3f2', dark: '#6f8fd9', glass: '#ffffff', lit: '#ffd0e6' },
  { wall: '#ffd3f1', trim: '#e9a3d6', dark: '#c77bb6', glass: '#c3e7ff', lit: '#fff2b0' },
];

function drawBuildings(ctx, L, r) {
  for (const b of L.buildings) {
    const s = BUILDING_STYLES[b.style % BUILDING_STYLES.length];
    const x = b.x0 * TILE;
    const w = (b.x1 - b.x0 + 1) * TILE;
    const y = b.y0 * TILE;
    const facadeBottom = Math.min((b.y1 + 1) * TILE, GROUND * TILE);
    const h = facadeBottom - y;
    rect(ctx, x, y, w, h, s.wall);
    for (let yy = y + 8; yy < y + h; yy += 4) rect(ctx, x + 1, yy, w - 2, 1, mix(s.wall, s.trim, 0.18));
    rect(ctx, x, y, w, 5, s.trim);
    rect(ctx, x, y + 1, w, 1, '#ffffff');
    rect(ctx, x, y + 5, w, 1, s.dark);
    rect(ctx, x, y, w, 1, INK);
    rect(ctx, x, y, 1, h, INK);
    rect(ctx, x + w - 1, y, 1, h, INK);
    const winTop = y + 12;
    const winBottom = b.arcade ? y + h - 14 : y + h - (facadeBottom >= GROUND * TILE ? 30 : 8);
    for (let wy = winTop; wy + 9 <= winBottom; wy += 16) {
      for (let wx = x + 5; wx + 8 <= x + w - 4; wx += 16) {
        windowPane(ctx, wx, wy, s, r() < 0.25);
      }
    }
    if (b.arcade) {
      const by = y + h;
      rect(ctx, x, by - 6, w, 6, s.trim);
      for (let sx = x; sx < x + w; sx += 8) rect(ctx, sx, by - 6, 4, 6, '#ffffff');
      rect(ctx, x, by - 6, w, 1, INK);
      for (let sx = x + 2; sx < x + w; sx += 4) rect(ctx, sx, by, 2, 2, (sx >> 2) % 2 ? s.trim : '#ffffff');
      rect(ctx, x, by, w, 1, INK);
      const passTop = by + 2;
      const passBottom = GROUND * TILE;
      rect(ctx, x + 1, passTop, w - 2, passBottom - passTop, '#bdb3ec');
      for (let lx = x + 6; lx < x + w - 4; lx += 24) {
        rect(ctx, lx, passTop + 3, 1, 1, '#fff2b0');
        rect(ctx, lx + 12, passTop + 5, 10, 14, '#d8cffa');
        rect(ctx, lx + 13, passTop + 6, 8, 12, '#ffc8e1');
        rect(ctx, lx + 15, passTop + 9, 4, 4, '#ffffff');
      }
      for (let lx = x + 4; lx < x + w - 2; lx += 6) rect(ctx, lx, passTop + 1, 2, 2, (lx / 6) % 2 < 1 ? '#fff2b0' : '#ffb3d6');
    } else if (facadeBottom >= GROUND * TILE) {
      const dx = x + Math.floor(w / 2) - 7;
      const dy = facadeBottom - 24;
      rect(ctx, dx - 3, dy - 4, 20, 4, s.dark);
      for (let i = 0; i < 20; i += 4) rect(ctx, dx - 3 + i, dy - 4, 2, 4, '#ffffff');
      rect(ctx, dx, dy, 14, 24, INK);
      rect(ctx, dx + 1, dy + 1, 12, 23, s.glass);
      rect(ctx, dx + 7, dy + 1, 1, 23, INK);
      rect(ctx, dx + 2, dy + 2, 2, 8, '#ffffff');
    }
    if (b.y1 >= GROUND) {
      groundFill(ctx, x, GROUND * TILE, w, L.height - GROUND * TILE);
      rect(ctx, x, GROUND * TILE, w, 1, INK);
      rect(ctx, x, GROUND * TILE, 1, L.height, INK);
      rect(ctx, x + w - 1, GROUND * TILE, 1, L.height, INK);
    }
    if (b.style === 5) {
      const hx = x + Math.floor(w / 2) - 12;
      bigHeart(ctx, hx, y + 20, '#ff7fb0', '#ffd0e4');
    }
  }
}

function windowPane(ctx, x, y, s, lit) {
  rect(ctx, x, y, 8, 9, s.dark);
  rect(ctx, x + 1, y + 1, 6, 7, lit ? s.lit : s.glass);
  rect(ctx, x + 1, y + 1, 2, 2, '#ffffff');
  rect(ctx, x - 1, y + 9, 10, 1, s.trim);
}

function drawClouds(ctx, L) {
  for (const c of L.clouds) {
    const x = c.x0 * TILE;
    const w = (c.x1 - c.x0 + 1) * TILE;
    const y = c.row * TILE;
    rect(ctx, x + 2, y - 1, w - 4, 11, '#8fb0e6');
    rect(ctx, x, y + 2, w, 6, '#8fb0e6');
    rect(ctx, x + 3, y, w - 6, 9, '#ffffff');
    rect(ctx, x + 1, y + 3, w - 2, 4, '#ffffff');
    rect(ctx, x + 3, y + 7, w - 6, 2, '#d7e8ff');
    for (let bx = x + 6; bx < x + w - 6; bx += 10) {
      blob(ctx, bx, y - 1, 3, '#8fb0e6');
      blob(ctx, bx, y, 2, '#ffffff');
    }
    rect(ctx, x + 4, y + 1, 3, 1, '#eef6ff');
  }
}

function drawSpikes(ctx, L) {
  for (const s of L.spikes) {
    for (let tx = s.x0; tx <= s.x1; tx++) thorn(ctx, tx * TILE, (s.row + 1) * TILE);
  }
}

function thorn(ctx, x, base) {
  const shard = (sx, h, w) => {
    for (let i = 0; i < h; i++) {
      const half = Math.max(0, Math.floor(((i + 1) / h) * w));
      const yy = base - h + i;
      rect(ctx, sx - half - 1, yy, half * 2 + 3, 1, '#5a1a4a');
    }
    for (let i = 1; i < h; i++) {
      const half = Math.max(0, Math.floor(((i + 1) / h) * w) - 0);
      const yy = base - h + i;
      rect(ctx, sx - half, yy, half * 2 + 1, 1, '#ff8fc0');
      rect(ctx, sx - half, yy, Math.max(1, half), 1, '#ffd1e6');
      rect(ctx, sx + Math.max(1, half - 1), yy, 1, 1, '#d0478a');
    }
  };
  shard(x + 4, 10, 3);
  shard(x + 11, 12, 3);
  rect(ctx, x, base - 2, 16, 2, '#7a2c63');
}

export function makeStarBlock() {
  const c = canvas(16, 16);
  const ctx = c.getContext('2d');
  rect(ctx, 0, 0, 16, 16, '#b04c86');
  rect(ctx, 1, 1, 14, 14, '#ffe89a');
  rect(ctx, 1, 1, 14, 2, '#fff8d8');
  rect(ctx, 1, 1, 2, 14, '#fff8d8');
  rect(ctx, 2, 13, 13, 2, '#f5c25e');
  rect(ctx, 13, 2, 2, 12, '#f5c25e');
  const star = ['...p...', '...p...', 'ppppppp', '.ppwpp.', '..ppp..', '.pp.pp.', '.p...p.'];
  star.forEach((row, yy) => {
    for (let xx = 0; xx < row.length; xx++) {
      if (row[xx] === 'p') rect(ctx, 4 + xx, 4 + yy, 1, 1, '#ff8fc0');
      if (row[xx] === 'w') rect(ctx, 4 + xx, 4 + yy, 1, 1, '#ffffff');
    }
  });
  return c;
}

function bigHeart(ctx, x, y, fill, shine) {
  const rows = [
    '..oooo....oooo..',
    '.offffo..offffo.',
    'offsffffoffffffo',
    'ofssffffffffffffo',
    'offsfffffffffffo',
    'offfffffffffffffo',
    '.offfffffffffffo.',
    '..offfffffffffo..',
    '...offfffffffo...',
    '....offfffffo....',
    '.....offfffo.....',
    '......offfo......',
    '.......ofo.......',
    '........o........',
  ];
  rows.forEach((row, yy) => {
    for (let xx = 0; xx < row.length; xx++) {
      const ch = row[xx];
      if (ch === 'o') rect(ctx, x + xx, y + yy, 1, 1, INK);
      else if (ch === 'f') rect(ctx, x + xx, y + yy, 1, 1, fill);
      else if (ch === 's') rect(ctx, x + xx, y + yy, 1, 1, shine);
    }
  });
}

function drawDecor(ctx, L, r) {
  for (const d of L.decor) {
    const x = d.x * TILE;
    const base = d.row * TILE;
    switch (d.type) {
      case 'house': house(ctx, x, base); break;
      case 'tree': tree(ctx, x, base); break;
      case 'lamp': lamp(ctx, x + 7, base); break;
      case 'sign': sign(ctx, x + 2, base, d.arrow); break;
      case 'bench': bench(ctx, x, base); break;
      case 'vending': vending(ctx, x, base); break;
      case 'booth': booth(ctx, x, base); break;
      case 'antenna': antenna(ctx, x, base); break;
      case 'balloons': balloons(ctx, x, base); break;
      case 'arch': arch(ctx, x, base); break;
      case 'stage': stage(ctx, x, base, r); break;
      default: break;
    }
  }
}

function house(ctx, x, base) {
  const w = 84;
  const h = 46;
  const top = base - h;
  rect(ctx, x, top, w, h, INK);
  rect(ctx, x + 1, top + 1, w - 2, h - 1, '#cfe7ff');
  for (let yy = top + 4; yy < base; yy += 4) rect(ctx, x + 1, yy, w - 2, 1, '#bcdcfb');
  for (let i = 0; i < 8; i++) {
    const rw = w + 12 - i * 10;
    rect(ctx, x - 6 + i * 5, top - 2 - i * 2, rw, 3, i % 2 ? '#ff9ec8' : '#ffb7d6');
    rect(ctx, x - 6 + i * 5, top - 2 - i * 2, rw, 1, INK);
  }
  rect(ctx, x + 60, top - 22, 8, 12, INK);
  rect(ctx, x + 61, top - 21, 6, 11, '#ffd0e6');
  rect(ctx, x + 34, base - 24, 16, 24, INK);
  rect(ctx, x + 35, base - 23, 14, 23, '#ffb3d6');
  rect(ctx, x + 46, base - 12, 2, 2, '#fff2b0');
  bigHeartSmall(ctx, x + 39, base - 20);
  for (const wx of [x + 8, x + 60]) {
    rect(ctx, wx, top + 10, 16, 14, INK);
    rect(ctx, wx + 1, top + 11, 14, 12, '#ffffff');
    rect(ctx, wx + 2, top + 12, 12, 10, '#c3e7ff');
    rect(ctx, wx + 7, top + 11, 1, 12, INK);
    rect(ctx, wx + 1, top + 17, 14, 1, INK);
    rect(ctx, wx - 1, top + 24, 18, 3, '#ff9ec8');
    rect(ctx, wx, top + 23, 2, 2, '#fff38a');
    rect(ctx, wx + 6, top + 23, 2, 2, '#ffffff');
    rect(ctx, wx + 12, top + 23, 2, 2, '#fff38a');
  }
}

function bigHeartSmall(ctx, x, y) {
  const rows = ['.o.o.', 'ooooo', 'ooooo', '.ooo.', '..o..'];
  rows.forEach((row, yy) => {
    for (let xx = 0; xx < 5; xx++) if (row[xx] === 'o') rect(ctx, x + xx, y + yy, 1, 1, '#ffffff');
  });
}

function tree(ctx, x, base) {
  rect(ctx, x + 6, base - 20, 5, 20, '#8a5a4a');
  rect(ctx, x + 7, base - 20, 2, 20, '#b07a5a');
  blob(ctx, x + 8, base - 30, 13, INK);
  blob(ctx, x + 8, base - 30, 12, '#ffc1dc');
  blob(ctx, x + 3, base - 34, 6, '#ffd8ea');
  blob(ctx, x + 13, base - 26, 5, '#ffadd0');
  const dots = [[-4, -38], [4, -36], [10, -32], [-6, -28], [2, -24], [12, -36], [6, -40]];
  for (const [dx, dy] of dots) rect(ctx, x + 8 + dx, base + dy, 2, 2, '#ffffff');
}

function lamp(ctx, x, base) {
  rect(ctx, x - 1, base - 46, 3, 46, '#5b5f9e');
  rect(ctx, x, base - 46, 1, 46, '#8f93d1');
  rect(ctx, x - 3, base - 3, 7, 3, '#5b5f9e');
  rect(ctx, x - 1, base - 46, 8, 2, '#5b5f9e');
  rect(ctx, x + 4, base - 46, 6, 2, INK);
  rect(ctx, x + 4, base - 44, 6, 5, INK);
  rect(ctx, x + 5, base - 44, 4, 4, '#fff3a8');
  rect(ctx, x + 5, base - 44, 2, 2, '#ffffff');
  rect(ctx, x - 4, base - 30, 9, 8, INK);
  rect(ctx, x - 3, base - 29, 7, 6, '#ff9ec8');
  bigHeartSmall(ctx, x - 2, base - 28);
}

function sign(ctx, x, base, arrow) {
  rect(ctx, x + 5, base - 20, 3, 20, '#8a5a4a');
  rect(ctx, x - 2, base - 30, 17, 12, INK);
  rect(ctx, x - 1, base - 29, 15, 10, '#ffffff');
  const ay = base - 25;
  for (let i = 0; i < 4; i++) rect(ctx, x + 7 + i, ay - 3 + i, 1, 7 - i * 2, '#ff7fb0');
  rect(ctx, x + 1, ay - 1, 7, 3, '#ff7fb0');
  if (arrow === 2) {
    rect(ctx, x + 1, ay - 5, 2, 1, '#ffd84d');
    rect(ctx, x + 3, ay + 4, 2, 1, '#ffd84d');
  }
}

function bench(ctx, x, base) {
  rect(ctx, x + 1, base - 14, 22, 3, INK);
  rect(ctx, x + 2, base - 13, 20, 1, '#ffb7d6');
  rect(ctx, x, base - 9, 24, 3, INK);
  rect(ctx, x + 1, base - 8, 22, 1, '#ffb7d6');
  rect(ctx, x + 3, base - 6, 2, 6, INK);
  rect(ctx, x + 19, base - 6, 2, 6, INK);
}

function vending(ctx, x, base) {
  rect(ctx, x, base - 34, 18, 34, INK);
  rect(ctx, x + 1, base - 33, 16, 33, '#ff9ec8');
  rect(ctx, x + 1, base - 33, 16, 2, '#ffd0e6');
  rect(ctx, x + 3, base - 29, 10, 16, INK);
  rect(ctx, x + 4, base - 28, 8, 14, '#e6f4ff');
  const cans = ['#8fd3ff', '#fff38a', '#b9a6ff', '#ffffff', '#7fe0b8', '#ff8fc0'];
  for (let i = 0; i < 9; i++) rect(ctx, x + 5 + (i % 3) * 2 + (i % 3), base - 27 + Math.floor(i / 3) * 5, 2, 3, cans[i % cans.length]);
  rect(ctx, x + 14, base - 26, 2, 2, '#fff38a');
  rect(ctx, x + 14, base - 22, 2, 2, '#7fe0b8');
  rect(ctx, x + 4, base - 9, 10, 4, INK);
  rect(ctx, x + 5, base - 8, 8, 2, '#c75a96');
}

function booth(ctx, x, base) {
  rect(ctx, x, base - 40, 18, 40, INK);
  rect(ctx, x + 1, base - 39, 16, 39, '#c9b8ff');
  rect(ctx, x + 1, base - 39, 16, 6, '#a58ef0');
  rect(ctx, x + 4, base - 37, 10, 2, '#ffffff');
  rect(ctx, x + 3, base - 31, 12, 26, INK);
  rect(ctx, x + 4, base - 30, 10, 24, '#e6f4ff');
  rect(ctx, x + 5, base - 29, 2, 10, '#ffffff');
  rect(ctx, x + 9, base - 24, 4, 6, '#ff9ec8');
  rect(ctx, x + 10, base - 23, 2, 1, INK);
}

function antenna(ctx, x, base) {
  rect(ctx, x + 6, base - 26, 2, 26, '#5b5f9e');
  rect(ctx, x, base - 22, 14, 1, '#5b5f9e');
  rect(ctx, x + 2, base - 16, 10, 1, '#5b5f9e');
  rect(ctx, x + 5, base - 29, 4, 4, '#ff7fb0');
  rect(ctx, x + 6, base - 28, 1, 1, '#ffffff');
}

function balloons(ctx, x, base) {
  const list = [[0, -46, '#ff9ec8', 6], [10, -54, '#9fd0ff', 10], [20, -44, '#fff38a', 13]];
  for (const [dx, dy, c, balloonDx] of list) {
    for (let yy = base + dy + 8; yy < base; yy += 1) rect(ctx, x + 8 + Math.round((dx - 8) * (1 - (yy - base - dy) / -dy) * 0.4), yy, 1, 1, '#8a8fcf');
    blob(ctx, x + balloonDx, base + dy, 6, INK);
    blob(ctx, x + balloonDx, base + dy, 5, c);
    rect(ctx, x + balloonDx - 2, base + dy - 3, 2, 2, '#ffffff');
    rect(ctx, x + balloonDx - 1, base + dy + 6, 3, 2, INK);
  }
}

function arch(ctx, x, base) {
  const w = 64;
  const h = 84;
  for (const px of [x, x + w - 10]) {
    rect(ctx, px, base - h, 10, h, INK);
    for (let yy = base - h + 1; yy < base; yy += 1) {
      const band = Math.floor((yy - (base - h)) / 6) % 2;
      rect(ctx, px + 1, yy, 8, 1, band ? '#ffffff' : '#ff9ec8');
    }
  }
  rect(ctx, x - 4, base - h - 10, w + 8, 14, INK);
  rect(ctx, x - 3, base - h - 9, w + 6, 12, '#ffd0e6');
  rect(ctx, x - 3, base - h - 9, w + 6, 2, '#ffffff');
  for (let i = 0; i < 8; i++) {
    const c = ['#ff7fb0', '#9fd0ff', '#fff38a', '#b9a6ff'][i % 4];
    rect(ctx, x + 2 + i * 8, base - h - 5, 4, 4, c);
  }
  bigHeart(ctx, x + w / 2 - 8, base - h - 28, '#ff7fb0', '#ffd0e4');
  for (let i = 0; i < 6; i++) {
    const fx = x + 10 + i * 9;
    rect(ctx, fx, base - h + 4, 6, 1, INK);
    for (let k = 0; k < 4; k++) rect(ctx, fx + 1 + Math.floor(k / 2), base - h + 5 + k, 4 - Math.floor(k / 2) * 2, 1, ['#ff9ec8', '#9fd0ff', '#fff38a'][i % 3]);
  }
}

function stage(ctx, x, base, r) {
  const w = 18 * TILE;
  const h = 96;
  const top = base - h;
  rect(ctx, x, top, w, h, INK);
  rect(ctx, x + 2, top + 2, w - 4, h - 2, '#b9a6ff');
  for (let yy = top + 2; yy < base; yy += 8) {
    for (let xx = x + 2; xx < x + w - 2; xx += 8) {
      if (((xx - x) / 8 + (yy - top) / 8) % 2 < 1) rect(ctx, xx, yy, 8, 8, '#c6b7ff');
    }
  }
  for (let i = 0; i < 26; i++) {
    const sx = x + 8 + Math.floor(r() * (w - 16));
    const sy = top + 10 + Math.floor(r() * (h - 30));
    const c = r() < 0.5 ? '#ffffff' : '#fff38a';
    rect(ctx, sx, sy, 1, 1, c);
    if (r() < 0.4) {
      rect(ctx, sx - 1, sy, 3, 1, c);
      rect(ctx, sx, sy - 1, 1, 3, c);
    }
  }
  bigHeart(ctx, x + w / 2 - 8, top + 22, '#ff7fb0', '#ffd0e4');
  rect(ctx, x - 6, top - 6, w + 12, 8, INK);
  rect(ctx, x - 5, top - 5, w + 10, 6, '#ff9ec8');
  rect(ctx, x - 5, top - 5, w + 10, 1, '#ffd0e6');
  for (let i = 0; i < w + 8; i += 12) {
    const c = ['#fff38a', '#9fd0ff', '#ffffff', '#7fe0b8'][(i / 12) % 4];
    for (let k = 0; k < 6; k++) rect(ctx, x - 4 + i + k, top + 2 + k, Math.max(1, 10 - k * 2), 1, c);
  }
  for (let i = 0; i < w; i += 10) rect(ctx, x + i + 3, top + 12, 2, 2, (i / 10) % 2 ? '#fff38a' : '#ffffff');
  for (const sx of [x + 6, x + w - 22]) {
    rect(ctx, sx, base - 28, 16, 28, INK);
    rect(ctx, sx + 1, base - 27, 14, 27, '#5b5f9e');
    blob(ctx, sx + 8, base - 18, 4, '#2e3170');
    blob(ctx, sx + 8, base - 18, 2, '#8f93d1');
    blob(ctx, sx + 8, base - 6, 2, '#2e3170');
  }
  rect(ctx, x + 24, base - 2, w - 48, 2, '#ff7fb0');
  rect(ctx, x + 24, base - 2, w - 48, 1, '#ffb7d6');
}

export function buildLevelCanvas(L) {
  const c = canvas(L.width, L.height);
  const ctx = c.getContext('2d');
  const r = rng(20251115);
  drawDecor(ctx, L, r);
  drawBuildings(ctx, L, r);
  drawGrounds(ctx, L, r);
  drawBlocks(ctx, L);
  drawClouds(ctx, L);
  drawSpikes(ctx, L);
  return c;
}

function skyCloud(ctx, x, y, s) {
  const parts = [[0, 0, 7], [8, -3, 9], [17, 0, 7], [24, 2, 5], [-7, 2, 5]].map(([dx, dy, rr]) => [x + dx * s, y + dy * s, Math.round(rr * s)]);
  for (const [cx, cy, rr] of parts) blob(ctx, cx, cy, rr + 1, '#c9defa');
  for (const [cx, cy, rr] of parts) blob(ctx, cx, cy, rr, '#ffffff');
  const bottom = y + Math.round(5 * s);
  rect(ctx, x - Math.round(8 * s), bottom - 1, Math.round(37 * s), 3, '#e3eeff');
}

export function buildParallax() {
  const r = rng(77);
  const clouds = canvas(640, 120);
  {
    const ctx = clouds.getContext('2d');
    const spots = [[40, 30, 1], [170, 70, 0.7], [260, 22, 1.3], [400, 60, 0.8], [520, 34, 1.1], [600, 90, 0.6]];
    for (const [x, y, s] of spots) skyCloud(ctx, x, y, s);
  }
  const skyline = canvas(768, 110);
  {
    const ctx = skyline.getContext('2d');
    let x = 0;
    while (x < 768) {
      const w = 24 + Math.floor(r() * 30);
      const h = 40 + Math.floor(r() * 60);
      const top = 110 - h;
      rect(ctx, x, top, w, h, '#cfc7f4');
      const roof = r();
      if (roof < 0.25) blob(ctx, x + w / 2 | 0, top, Math.min(10, w / 2 - 2) | 0, '#cfc7f4');
      else if (roof < 0.45) rect(ctx, x + (w >> 1), top - 12, 2, 12, '#cfc7f4');
      else if (roof < 0.6) {
        for (let i = 0; i < 6; i++) rect(ctx, x + 3 + i * 2, top - 6 + i, w - 6 - i * 4, 1, '#cfc7f4');
      }
      for (let wy = top + 6; wy < 106; wy += 7) {
        for (let wx = x + 4; wx < x + w - 4; wx += 6) if (r() < 0.55) rect(ctx, wx, wy, 2, 3, '#e4defd');
      }
      x += w + Math.floor(r() * 6);
    }
  }
  const city = canvas(1024, 150);
  const cityWindows = [];
  {
    const ctx = city.getContext('2d');
    const pal = [
      ['#ffd3e8', '#f2b0d1'], ['#d6e9ff', '#a9c8f2'], ['#e6dbff', '#c2b0f0'],
      ['#d2f5e6', '#a1dcc4'], ['#fff2c6', '#ecd28a'],
    ];
    let x = 0;
    let i = 0;
    while (x < 1024) {
      const w = 40 + Math.floor(r() * 36);
      const h = 60 + Math.floor(r() * 80);
      const top = 150 - h;
      const [wall, trim] = pal[i++ % pal.length];
      rect(ctx, x, top, w, h, '#9a97d4');
      rect(ctx, x + 1, top + 1, w - 2, h - 1, wall);
      rect(ctx, x + 1, top + 1, w - 2, 3, trim);
      for (let wy = top + 9; wy < 150 - 18; wy += 12) {
        for (let wx = x + 5; wx < x + w - 8; wx += 10) {
          rect(ctx, wx, wy, 6, 7, trim);
          rect(ctx, wx + 1, wy + 1, 4, 5, r() < 0.2 ? '#fff6cc' : '#eef7ff');
          cityWindows.push({ x: wx + 1, y: wy + 1 });
        }
      }
      const deco = r();
      if (deco < 0.3) {
        const sx = x + (w >> 1) - 8;
        rect(ctx, sx, top - 12, 16, 10, '#9a97d4');
        rect(ctx, sx + 1, top - 11, 14, 8, '#ffffff');
        bigHeartSmallColor(ctx, sx + 5, top - 10, '#ff8fc0');
        rect(ctx, sx + 7, top - 2, 2, 2, '#9a97d4');
      } else if (deco < 0.55) {
        rect(ctx, x + 4, 150 - 20, w - 8, 4, trim);
        for (let k = x + 4; k < x + w - 4; k += 4) rect(ctx, k, 150 - 16, 2, 2, '#ffffff');
      } else if (deco < 0.7) {
        rect(ctx, x + w - 10, top - 8, 2, 8, '#9a97d4');
        rect(ctx, x + w - 12, top - 10, 6, 3, '#ffb3d6');
      }
      x += w;
    }
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(214, 232, 255, 0.38)';
    ctx.fillRect(0, 0, city.width, city.height);
    ctx.globalCompositeOperation = 'source-over';
  }
  return { clouds, skyline, city, cityWindows };
}

function bigHeartSmallColor(ctx, x, y, c) {
  const rows = ['.o.o.', 'ooooo', 'ooooo', '.ooo.', '..o..'];
  rows.forEach((row, yy) => {
    for (let xx = 0; xx < 5; xx++) if (row[xx] === 'o') rect(ctx, x + xx, y + yy, 1, 1, c);
  });
}

const SKY_DAY = ['#9fd0ff', '#b2daff', '#c5e4ff', '#d8eeff', '#eaf6ff'];
const SKY_DUSK = ['#bfb0ff', '#d8b4f6', '#efbfe9', '#ffcfe2', '#ffe2e8'];

export function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s) => {
    const x = (pa >> s) & 255;
    const y = (pb >> s) & 255;
    return Math.round(x + (y - x) * t);
  };
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
}

export function buildSky(w, h, t) {
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  const bands = SKY_DAY.map((col, i) => mix(col, SKY_DUSK[i], t));
  const bh = Math.ceil(h / bands.length);
  for (let i = 0; i < bands.length; i++) {
    rect(ctx, 0, i * bh, w, bh, bands[i]);
    if (i > 0) {
      ctx.fillStyle = bands[i];
      for (let x = 0; x < w; x += 2) ctx.fillRect(x, i * bh - 1, 1, 1);
      ctx.fillStyle = bands[i - 1];
      for (let x = 1; x < w; x += 2) ctx.fillRect(x, i * bh, 1, 1);
      for (let x = 0; x < w; x += 4) ctx.fillRect(x, i * bh + 1, 1, 1);
    }
  }
  return c;
}

export const CITY_BASE = '#d3d4f6';
export { ROWS };
