import { drawText, textWidth } from './font.js';

const W = 384;
const H = 216;
const FLOOR = 176;
const INK = '#22336e';

const DOOR_X = 32;
const TV_X = 326;
export const POSTER = { x: 225, y: 18, h: 80 };

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function rect(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

function blob(ctx, cx, cy, r, c) {
  ctx.fillStyle = c;
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y) + 0.35);
    ctx.fillRect(cx - half, cy + y, half * 2 + 1, 1);
  }
}

function heart(ctx, x, y, c) {
  ['.o.o.', 'ooooo', 'ooooo', '.ooo.', '..o..'].forEach((row, yy) => {
    for (let xx = 0; xx < 5; xx++) if (row[xx] === 'o') rect(ctx, x + xx, y + yy, 1, 1, c);
  });
}

function star(ctx, x, y, c) {
  ['..o..', '.ooo.', 'ooooo', '.ooo.', '.o.o.'].forEach((row, yy) => {
    for (let xx = 0; xx < 5; xx++) if (row[xx] === 'o') rect(ctx, x + xx, y + yy, 1, 1, c);
  });
}

function buildRoom() {
  const c = canvas(W, H);
  const g = c.getContext('2d');
  rect(g, 0, 0, W, FLOOR, '#e6dcff');
  for (let x = 0; x < W; x += 16) rect(g, x, 0, 8, FLOOR, '#ede5ff');
  for (let y = 22; y < FLOOR - 10; y += 24) {
    for (let x = (y / 24) % 2 ? 4 : 12; x < W; x += 16) heart(g, x, y, '#f7cde6');
  }
  rect(g, 0, 0, W, 8, '#c9b8ff');
  for (let x = 6; x < W; x += 12) {
    rect(g, x, 9 + ((x / 12) % 2), 1, 3, '#7f86c8');
    rect(g, x - 1, 12 + ((x / 12) % 2), 3, 3, ['#fff38a', '#ff9ec8', '#9fd0ff', '#7fe0b8'][(x / 12) % 4]);
  }
  rect(g, 0, FLOOR - 4, W, 4, '#b9a6ff');
  rect(g, 0, FLOOR - 4, W, 1, INK);
  rect(g, 0, FLOOR, W, H - FLOOR, '#f3c9b5');
  for (let y = FLOOR + 6; y < H; y += 8) rect(g, 0, y, W, 1, '#e3b29c');
  for (let y = FLOOR; y < H; y += 8) for (let x = ((y / 8) % 2) * 20; x < W; x += 40) rect(g, x, y, 1, 8, '#e3b29c');

  rect(g, DOOR_X - 13, FLOOR - 46, 26, 46, INK);
  rect(g, DOOR_X - 12, FLOOR - 45, 24, 45, '#ffb3d6');
  rect(g, DOOR_X - 9, FLOOR - 41, 18, 16, '#ffd0e6');
  rect(g, DOOR_X - 9, FLOOR - 21, 18, 16, '#ffd0e6');
  rect(g, DOOR_X + 7, FLOOR - 24, 3, 3, '#fff38a');
  heart(g, DOOR_X - 2, FLOOR - 36, '#ff6fa8');

  rect(g, 66, 34, 52, 42, INK);
  rect(g, 67, 35, 50, 40, '#bfe1ff');
  blob(g, 82, 52, 5, '#ffffff');
  blob(g, 90, 50, 6, '#ffffff');
  blob(g, 104, 62, 4, '#ffffff');
  rect(g, 91, 35, 2, 40, INK);
  rect(g, 67, 54, 50, 2, INK);
  rect(g, 60, 30, 64, 4, '#ff9ec8');
  for (let i = 0; i < 10; i++) {
    rect(g, 61 + (i % 2), 34 + i * 4, 7, 4, '#ffc1dc');
    rect(g, 116 - (i % 2), 34 + i * 4, 7, 4, '#ffc1dc');
  }

  rect(g, 56, FLOOR - 30, 88, 4, INK);
  rect(g, 56, FLOOR - 30, 4, 30, INK);
  rect(g, 140, FLOOR - 20, 4, 20, INK);
  rect(g, 60, FLOOR - 22, 80, 14, '#ffffff');
  rect(g, 60, FLOOR - 26, 80, 6, '#ff9ec8');
  for (let x = 62; x < 140; x += 8) heart(g, x, FLOOR - 19, '#ffc1dc');
  rect(g, 62, FLOOR - 32, 22, 8, INK);
  rect(g, 63, FLOOR - 31, 20, 6, '#fff8fc');
  rect(g, 60, FLOOR - 8, 80, 8, '#c9b8ff');

  const px = 118;
  const py = FLOOR - 26;
  rect(g, px - 3, py - 22, 3, 10, INK);
  rect(g, px + 3, py - 22, 3, 10, INK);
  rect(g, px - 2, py - 21, 1, 8, '#ffb3d6');
  rect(g, px + 4, py - 21, 1, 8, '#ffb3d6');
  blob(g, px + 1, py - 9, 6, INK);
  blob(g, px + 1, py - 9, 5, '#ffffff');
  blob(g, px + 1, py - 2, 5, INK);
  blob(g, px + 1, py - 2, 4, '#ffffff');
  rect(g, px - 2, py - 10, 1, 1, INK);
  rect(g, px + 3, py - 10, 1, 1, INK);
  rect(g, px, py - 8, 2, 1, '#ff9ec8');

  rect(g, 150, 30, 26, 34, INK);
  rect(g, 151, 31, 24, 32, '#fff38a');
  star(g, 160, 38, '#ff6fa8');
  star(g, 154, 50, '#9fd0ff');
  star(g, 166, 52, '#ffffff');
  rect(g, 184, 36, 22, 28, INK);
  rect(g, 185, 37, 20, 26, '#9fd0ff');
  heart(g, 192, 44, '#ffffff');
  rect(g, 188, 54, 14, 2, '#ffffff');
  rect(g, 188, 58, 10, 2, '#ffffff');

  rect(g, 148, 92, 62, 3, INK);
  rect(g, 149, 92, 60, 2, '#c9a27e');
  rect(g, 152, 80, 24, 12, INK);
  rect(g, 153, 81, 22, 10, '#ff9ec8');
  blob(g, 158, 86, 3, '#ffffff');
  blob(g, 158, 86, 1, '#9fd0ff');
  blob(g, 169, 86, 3, '#ffffff');
  blob(g, 169, 86, 1, '#9fd0ff');
  rect(g, 160, 79, 8, 2, INK);
  ['#9fd0ff', '#fff38a', '#7fe0b8', '#b9a6ff'].forEach((col, i) => {
    rect(g, 182 + i * 6, 78, 5, 14, INK);
    rect(g, 183 + i * 6, 79, 3, 12, col);
  });

  rect(g, 208, FLOOR - 36, 68, 4, INK);
  rect(g, 209, FLOOR - 35, 66, 2, '#ffffff');
  rect(g, 212, FLOOR - 32, 3, 32, INK);
  rect(g, 269, FLOOR - 32, 3, 32, INK);
  rect(g, 220, FLOOR - 70, 38, 32, INK);
  rect(g, 221, FLOOR - 69, 36, 30, '#f2e6d8');
  rect(g, 225, FLOOR - 66, 28, 20, INK);
  rect(g, 226, FLOOR - 65, 26, 18, '#7fe0b8');
  heart(g, 236, FLOOR - 60, '#ff6fa8');
  rect(g, 228, FLOOR - 63, 6, 1, '#d8fff0');
  rect(g, 233, FLOOR - 38, 12, 2, INK);
  rect(g, 222, FLOOR - 42, 4, 2, '#7fe0b8');
  rect(g, 226, FLOOR - 39, 30, 3, INK);
  rect(g, 227, FLOOR - 39, 28, 2, '#e8dccd');
  rect(g, 262, FLOOR - 40, 6, 4, INK);
  rect(g, 263, FLOOR - 39, 4, 2, '#ffb3d6');

  blob(g, 214, FLOOR + 6, 6, '#ffd0e6');
  rect(g, 150, FLOOR + 2, 130, 8, '#ffb3d6');
  rect(g, 152, FLOOR + 3, 126, 6, '#ffd0e6');
  for (let x = 156; x < 276; x += 10) rect(g, x, FLOOR + 5, 4, 1, '#ffffff');
  rect(g, 283, FLOOR - 14, 10, 14, INK);
  rect(g, 284, FLOOR - 13, 8, 13, '#ff9ec8');
  blob(g, 285, FLOOR - 20, 5, '#5fbf8a');
  blob(g, 292, FLOOR - 24, 5, '#7fe0b8');

  rect(g, TV_X - 30, FLOOR - 26, 60, 26, INK);
  rect(g, TV_X - 29, FLOOR - 25, 58, 25, '#c9a27e');
  rect(g, TV_X - 26, FLOOR - 21, 24, 18, '#b88c66');
  rect(g, TV_X + 2, FLOOR - 21, 24, 18, '#b88c66');
  rect(g, TV_X - 28, FLOOR - 70, 56, 44, INK);
  rect(g, TV_X - 27, FLOOR - 69, 54, 42, '#ff9ec8');
  rect(g, TV_X - 27, FLOOR - 69, 54, 3, '#ffd0e6');
  rect(g, TV_X - 22, FLOOR - 64, 36, 30, INK);
  rect(g, TV_X + 17, FLOOR - 62, 6, 6, '#ffffff');
  rect(g, TV_X + 17, FLOOR - 52, 6, 6, '#ffd0e6');
  rect(g, TV_X + 18, FLOOR - 42, 4, 6, INK);
  for (let i = 0; i < 12; i++) {
    rect(g, TV_X - 10 - i, FLOOR - 70 - i, 1, 1, INK);
    rect(g, TV_X + 10 + i, FLOOR - 70 - i, 1, 1, INK);
  }
  blob(g, TV_X - 22, FLOOR - 82, 1, '#ff6fa8');
  blob(g, TV_X + 22, FLOOR - 82, 1, '#ff6fa8');
  return c;
}

export class SecretRoom {
  constructor() {
    this.bg = buildRoom();
    this.reset();
  }

  setPoster(scaledCanvas, w, h) {
    this.poster = { img: scaledCanvas, w, h };
  }

  drawPoster(ctx) {
    if (!this.poster) return;
    const { img, w, h } = this.poster;
    const x = POSTER.x;
    const y = POSTER.y;
    const m = 1.5;
    ctx.fillStyle = 'rgba(122, 106, 190, 0.35)';
    ctx.fillRect(x - m + 2, y - m + 2, w + m * 2, h + m * 2);
    ctx.fillStyle = '#fff8fc';
    ctx.fillRect(x - m, y - m, w + m * 2, h + m * 2);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, x, y, w, h);
    ctx.fillStyle = 'rgba(255, 236, 190, 0.85)';
    ctx.fillRect(x - 4, y - 4, 9, 3);
    ctx.fillRect(x + w - 5, y - 4, 9, 3);
  }

  reset() {
    this.p = { x: DOOR_X + 20, y: FLOOR, vx: 0, vy: 0, onGround: true, facing: 1, animT: 0, jumpBuf: 0 };
  }

  nearby() {
    if (Math.abs(this.p.x - DOOR_X) < 18) return 'door';
    if (Math.abs(this.p.x - TV_X) < 26) return 'tv';
    return null;
  }

  update(dt, input) {
    const p = this.p;
    const dir = ((input.right || input.tRight) ? 1 : 0) - ((input.left || input.tLeft) ? 1 : 0);
    const target = dir * 110;
    p.vx += Math.sign(target - p.vx) * Math.min(Math.abs(target - p.vx), 900 * dt);
    if (dir) p.facing = dir;
    if (input.jumpPressed && p.onGround) {
      p.vy = -300;
      p.onGround = false;
    }
    input.jumpPressed = false;
    p.vy += 1150 * dt;
    p.x = Math.max(14, Math.min(W - 14, p.x + p.vx * dt));
    p.y += p.vy * dt;
    if (p.y >= FLOOR) {
      p.y = FLOOR;
      p.vy = 0;
      p.onGround = true;
    }
    p.animT += dt;
  }

  draw(ctx, drawBunny, time, touch) {
    ctx.drawImage(this.bg, 0, 0);
    this.drawPoster(ctx);
    const tvGlow = 0.5 + Math.sin(time * 3) * 0.2;
    ctx.fillStyle = `rgba(255, 248, 252, ${tvGlow})`;
    ctx.fillRect(TV_X - 21, FLOOR - 63, 34, 28);
    ctx.fillStyle = '#ff6fa8';
    for (let i = 0; i < 3; i++) ctx.fillRect(TV_X - 14 + i * 9, FLOOR - 50 + Math.round(Math.sin(time * 4 + i) * 2), 4, 4);
    drawBunny(this.p);
    const near = this.nearby();
    if (near && !touch) {
      const label = near === 'door' ? 'DOWN: EXIT' : 'DOWN: PLAY';
      const x = near === 'door' ? DOOR_X : TV_X;
      bubble(ctx, label, x, FLOOR - (near === 'door' ? 60 : 96) + Math.round(Math.sin(time * 5)));
    }
  }
}

function bubble(ctx, text, cx, y) {
  const w = textWidth(text) + 8;
  const x = Math.max(2, Math.min(W - w - 2, Math.round(cx - w / 2)));
  ctx.fillStyle = INK;
  ctx.fillRect(x, y, w, 13);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 1, y + 1, w - 2, 11);
  drawText(ctx, text, x + 4, y + 3, INK);
}

export { bubble };

const GAME_TIME = 20;
export const TV_TARGET = 12;
const SCREEN = { x: 36, y: 18, w: 312, h: 170 };

export class TvGame {
  constructor(bunnyImg, starSprite, cloudSprite, reduced) {
    this.bunny = bunnyImg;
    this.star = starSprite;
    this.cloud = cloudSprite;
    this.reduced = reduced;
    this.phase = 'intro';
  }

  start() {
    this.phase = 'count';
    this.count = 3;
    this.time = GAME_TIME;
    this.score = 0;
    this.items = [];
    this.spawnStar = 0.3;
    this.spawnCloud = 1.2;
    this.flash = 0;
    this.px = SCREEN.w / 2;
  }

  update(dt, input, sfx) {
    if (this.phase === 'count') {
      this.count -= dt;
      if (this.count <= 0) this.phase = 'play';
      return null;
    }
    if (this.phase !== 'play') return null;
    const dir = ((input.right || input.tRight) ? 1 : 0) - ((input.left || input.tLeft) ? 1 : 0);
    this.px = Math.max(10, Math.min(SCREEN.w - 10, this.px + dir * 165 * dt));
    this.time -= dt;
    this.flash = Math.max(0, this.flash - dt);
    const ramp = 1 + (GAME_TIME - this.time) / GAME_TIME * 0.5;
    this.spawnStar -= dt;
    this.spawnCloud -= dt;
    if (this.spawnStar <= 0) {
      this.spawnStar = 0.42;
      this.items.push({ kind: 'star', x: 10 + Math.random() * (SCREEN.w - 20), y: -10, v: (55 + Math.random() * 30) * ramp });
    }
    if (this.spawnCloud <= 0) {
      this.spawnCloud = 1.1 / ramp;
      this.items.push({ kind: 'cloud', x: 10 + Math.random() * (SCREEN.w - 20), y: -12, v: (60 + Math.random() * 30) * ramp });
    }
    const by = SCREEN.h - 22;
    for (const it of this.items) {
      it.y += it.v * dt;
      if (!it.done && it.y > by - 6 && it.y < by + 16 && Math.abs(it.x - this.px) < 13) {
        it.done = true;
        if (it.kind === 'star') {
          this.score += 1;
          sfx('cookie');
        } else {
          this.score = Math.max(0, this.score - 2);
          this.flash = 0.4;
          sfx('hurt');
        }
      }
    }
    this.items = this.items.filter((it) => !it.done && it.y < SCREEN.h + 16);
    if (this.time <= 0) {
      this.time = 0;
      this.phase = 'result';
      this.won = this.score >= TV_TARGET;
      return this.won ? 'win' : 'lose';
    }
    return null;
  }

  draw(ctx, time) {
    ctx.fillStyle = '#ff9ec8';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffd0e6';
    ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = INK;
    ctx.fillRect(SCREEN.x - 4, SCREEN.y - 4, SCREEN.w + 8, SCREEN.h + 8);
    ctx.save();
    ctx.translate(SCREEN.x, SCREEN.y);
    ctx.beginPath();
    ctx.rect(0, 0, SCREEN.w, SCREEN.h);
    ctx.clip();
    ctx.fillStyle = this.flash > 0 ? '#5a3a7a' : '#2d2f6e';
    ctx.fillRect(0, 0, SCREEN.w, SCREEN.h);
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = i % 3 ? '#4a4f9e' : '#8f93d1';
      ctx.fillRect((i * 97) % SCREEN.w, (i * 53 + Math.floor(time * 6)) % SCREEN.h, 1, 1);
    }
    ctx.imageSmoothingEnabled = false;
    if (this.phase === 'play' || this.phase === 'count' || this.phase === 'result') {
      for (const it of this.items) {
        const s = it.kind === 'star' ? this.star : this.cloud;
        ctx.drawImage(s, Math.round(it.x - s.width / 2), Math.round(it.y - s.height / 2));
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      const bw = 15;
      const bh = this.bunny ? Math.round(bw * this.bunny.naturalHeight / this.bunny.naturalWidth) : 18;
      const bob = this.phase === 'play' && !this.reduced ? Math.round(Math.sin(time * 14) * 0.6) : 0;
      if (this.bunny) ctx.drawImage(this.bunny, Math.round(this.px - bw / 2), SCREEN.h - 4 - bh + bob, bw, bh);
      else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.round(this.px - bw / 2), SCREEN.h - 4 - bh + bob, bw, bh);
      }
      ctx.imageSmoothingEnabled = false;
      drawText(ctx, `TIME ${Math.ceil(this.time)}`, 6, 6, '#ffffff', INK);
      const sc = `STARS ${this.score}/${TV_TARGET}`;
      drawText(ctx, sc, SCREEN.w - textWidth(sc) - 6, 6, this.score >= TV_TARGET ? '#fff38a' : '#ffffff', INK);
      if (this.phase === 'count') {
        const n = String(Math.max(1, Math.ceil(this.count)));
        ctx.save();
        ctx.translate(SCREEN.w / 2 - 8, SCREEN.h / 2 - 20);
        ctx.scale(4, 4);
        drawText(ctx, n, 0, 0, '#fff38a', INK);
        ctx.restore();
      }
    }
    for (let y = 0; y < SCREEN.h; y += 3) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(0, y, SCREEN.w, 1);
    }
    ctx.restore();
    ctx.fillStyle = INK;
    ctx.fillRect(W - 30, H - 22, 8, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(W - 29, H - 21, 6, 6);
  }
}
