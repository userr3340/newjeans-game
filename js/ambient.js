import { makeSprite } from './pixels.js';

const CAT = [
  'o...o',
  'oo.oo',
  'ooooo',
  'oyoyo',
  'ooooo',
];

const PLANE = [
  'w.......',
  'www.....',
  'wwwww...',
  'wllllwww',
  '.lll....',
  '..l.....',
];

const BUNNY_CLOUD = [
  '...ww...ww....',
  '..wwww.wwww...',
  '..wwww.wwww...',
  '..wwww.wwww...',
  '...www.www....',
  '..wwwwwwwww...',
  '.wwwwwwwwwwww.',
  'wwwwwwwwwwwwww',
  'wwwwwwwwwwwwww',
  '.wwwwwwwwwwww.',
  '..ssssssssss..',
];

const HEART = ['.p.p.', 'ppppp', 'ppppp', '.ppp.', '..p..'];

const VIEW_W = 384;

export class Ambient {
  constructor(reducedMotion, cityWindows) {
    this.reduced = reducedMotion;
    this.windows = cityWindows;
    this.events = [];
    this.timer = 6 + Math.random() * 6;
    this.cat = makeSprite(CAT, { o: '#4a4470', y: '#fff38a' });
    this.catBlink = makeSprite(CAT, { o: '#4a4470', y: '#4a4470' });
    this.plane = makeSprite(PLANE, { w: '#ffffff', l: '#c9d6f5' });
    this.bunnyCloud = makeSprite(BUNNY_CLOUD, { w: '#ffffff', s: '#dbe9ff' });
    this.heart = makeSprite(HEART, { p: '#ffb3d6' });
  }

  reset() {
    this.events = [];
    this.timer = 6 + Math.random() * 6;
  }

  spawn(camX) {
    const pool = this.reduced ? ['cat', 'bunnycloud'] : ['star', 'star', 'cat', 'cat', 'plane', 'bunnycloud', 'hearts'];
    const type = pool[Math.floor(Math.random() * pool.length)];
    if (this.events.some((e) => e.type === type)) return;
    if (type === 'star') {
      this.events.push({ type, t: 0, dur: 0.7, x: 120 + Math.random() * 240, y: 6 + Math.random() * 30 });
    } else if (type === 'cat') {
      const off = -((camX * 0.42) % 1024);
      const visible = this.windows.filter((w) => {
        const sx = ((w.x + off) % 1024 + 1024) % 1024;
        return sx > 40 && sx < VIEW_W - 40;
      });
      if (!visible.length) return;
      const w = visible[Math.floor(Math.random() * visible.length)];
      this.events.push({ type, t: 0, dur: 4, wx: w.x, wy: w.y });
    } else if (type === 'plane') {
      this.events.push({ type, t: 0, dur: 9, y: 30 + Math.random() * 30 });
    } else if (type === 'bunnycloud') {
      this.events.push({ type, t: 0, dur: 40, y: 18 + Math.random() * 20 });
    } else if (type === 'hearts') {
      const x = 60 + Math.random() * 260;
      this.events.push({ type, t: 0, dur: 4, items: [0, 1, 2].map((n) => ({ x: x + n * 9 - 9, d: n * 0.5 })) });
    }
  }

  update(dt, camX) {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = this.reduced ? 22 + Math.random() * 12 : 8 + Math.random() * 8;
      this.spawn(camX);
    }
    for (const e of this.events) e.t += dt;
    this.events = this.events.filter((e) => e.t < e.dur);
  }

  drawSky(ctx, time) {
    for (const e of this.events) {
      const p = e.t / e.dur;
      if (e.type === 'star') {
        const x = Math.round(e.x - p * 90);
        const y = Math.round(e.y + p * 36);
        ctx.globalAlpha = Math.sin(p * Math.PI);
        for (let i = 0; i < 10; i++) {
          ctx.fillStyle = i < 2 ? '#ffffff' : '#fff38a';
          ctx.globalAlpha = Math.sin(p * Math.PI) * (1 - i / 10);
          ctx.fillRect(x + i * 2, y - i, 1, 1);
        }
      } else if (e.type === 'plane') {
        const x = Math.round(-12 + p * (VIEW_W + 24));
        const y = Math.round(e.y + Math.sin(e.t * 1.5) * 4);
        ctx.globalAlpha = 0.9;
        ctx.drawImage(this.plane, x, y);
      } else if (e.type === 'bunnycloud') {
        const x = Math.round(VIEW_W + 4 - p * (VIEW_W + 24));
        ctx.globalAlpha = Math.min(1, e.t / 2, (e.dur - e.t) / 2) * 0.9;
        ctx.drawImage(this.bunnyCloud, x, Math.round(e.y + Math.sin(time * 0.5) * 1.5));
      }
    }
    ctx.globalAlpha = 1;
  }

  drawCity(ctx, camX, cityTop) {
    for (const e of this.events) {
      if (e.type === 'cat') {
        const off = -((camX * 0.42) % 1024);
        let sx = e.wx + off;
        while (sx < -8) sx += 1024;
        while (sx > VIEW_W + 8) sx -= 1024;
        const fade = Math.min(1, e.t / 0.4, (e.dur - e.t) / 0.4);
        const rise = Math.round((1 - fade) * 3);
        ctx.save();
        ctx.beginPath();
        ctx.rect(Math.round(sx) - 1, Math.round(cityTop + e.wy), 6, 5);
        ctx.clip();
        ctx.globalAlpha = 0.85;
        const blink = Math.floor(e.t * 3) % 5 === 0;
        ctx.drawImage(blink ? this.catBlink : this.cat, Math.round(sx) - 0.5, Math.round(cityTop + e.wy) + rise, 5, 5);
        ctx.restore();
      } else if (e.type === 'hearts') {
        for (const h of e.items) {
          const t = e.t - h.d;
          if (t < 0) continue;
          ctx.globalAlpha = Math.max(0, 0.8 - t / 4);
          ctx.drawImage(this.heart, Math.round(h.x + Math.sin(t * 2 + h.d) * 3), Math.round(150 - t * 14));
        }
        ctx.globalAlpha = 1;
      }
    }
  }
}
