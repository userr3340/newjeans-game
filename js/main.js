import { buildLevel, TILE, GROUND, T_SOLID, T_ONEWAY, T_HIDDEN } from './level.js';
import { buildLevelCanvas, buildParallax, buildSky, makeStarBlock, CITY_BASE, INK } from './art.js';
import { buildPixelArt, iconCanvas, circleSprite, buildRareArt } from './pixels.js';
import { loadSave, getSave, addRare, markTvDone, awardCard, pickRewardCard, RARE_COUNT } from './save.js';
import { drawClosedEyes, drawEarGlints } from './bunny-overlays.js';
import { Ambient } from './ambient.js';
import { SecretRoom, TvGame, TV_TARGET, bubble, POSTER } from './room.js';
import { buildReveal, buildGallery } from './cards-ui.js';
import { loadCharacters, buildScaledSet, scaleImage, GIRL_NAMES } from './sprites.js';
import { MUSIC_FILE } from './config.js';
import { drawText, textWidth, makeLabel } from './font.js';
import { GameAudio } from './audio.js';

if (window.self !== window.top) {
  const message = document.createElement('p');
  message.className = 'noscript';
  message.textContent = 'Open NewJeans Game directly to play. ';
  const link = document.createElement('a');
  link.className = 'pix-btn';
  link.href = window.location.href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Open game';
  message.append(link);
  document.getElementById('app').replaceChildren(message);
} else {

const VIEW_W = 384;
const VIEW_H = 216;

const GRAV = 1150;
const JUMP_V = 390;
const DJUMP_V = 360;
const JUMP_CUT_V = 230;
const RUN = 118;
const SPEED_MUL = 1.75;
const MAX_FALL = 520;
const GLIDE_FALL = 46;
const ACC_GROUND = 1100;
const ACC_AIR = 800;
const DEC_GROUND = 1500;
const DEC_AIR = 420;
const COYOTE = 0.1;
const JUMP_BUFFER = 0.12;
const P_W = 18;
const P_H = 36;

const SPEED = 0;
const DOUBLE = 1;
const GLIDE = 2;
const SHIELD = 3;
const REVEAL = 4;

const ABILITIES = [
  { name: 'SPEED BOOST', dur: 14 },
  { name: 'DOUBLE JUMP', dur: 22 },
  { name: 'EAR GLIDE', dur: 22 },
  { name: 'SHIELD', dur: 12 },
  { name: 'STAR PATH', dur: 3 },
];

function abilityHint(i) {
  const touch = document.body.classList.contains('touch');
  if (i === DOUBLE) return touch ? 'TAP ^ AGAIN IN THE AIR' : 'PRESS JUMP AGAIN IN THE AIR';
  if (i === REVEAL) return 'FOLLOW THE STAR BLOCKS >';
  return null;
}

const ABILITY_SPOKEN = [
  'Speed boost. Run faster and jump farther.',
  'Double jump. Press jump again in the air.',
  'Ear glide. Hold jump while falling to float down.',
  'Shield. Thorns and critters cannot hurt you.',
  'Star path. A hidden bridge appears.',
];

const PASTELS = ['#ff9ec8', '#9fd0ff', '#fff38a', '#b9a6ff', '#7fe0b8', '#ffffff', '#ffc1dc'];

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
const stageEl = document.getElementById('stage');
const overlayEl = document.getElementById('overlay');
const hudButtons = document.getElementById('hud-buttons');
const btnMusic = document.getElementById('btn-music');
const btnSfx = document.getElementById('btn-sfx');
const btnPause = document.getElementById('btn-pause');
const liveEl = document.getElementById('live');

let saveNotice = null;
window.addEventListener('njz-save-status', ({ detail }) => {
  if (detail.saved) {
    saveNotice?.remove();
    saveNotice = null;
  } else if (!saveNotice) {
    saveNotice = document.createElement('p');
    saveNotice.className = 'save-notice';
    saveNotice.setAttribute('role', 'status');
    saveNotice.textContent = 'Progress cannot be saved. New progress will only remain available during the current session.';
    document.body.append(saveNotice);
  }
});

const audio = new GameAudio(MUSIC_FILE);
const art = buildPixelArt();
const starBlock = makeStarBlock();
const shieldBubble = circleSprite(26, 'rgba(166, 236, 255, 0.22)', 'rgba(120, 214, 255, 0.95)', 'rgba(255, 255, 255, 0.95)');
const parallax = buildParallax();
const rareArt = buildRareArt();
const ambient = new Ambient(reducedMotion, parallax.cityWindows);
const room = new SecretRoom();
const touchAction = document.getElementById('touch-action');
let tv = null;
let miniBunny = null;
let posterImg = null;
let audioHidden = false;

let chars = null;
let scaled = null;
let k = 1;
let levelCanvas = null;
let sky = null;
let skyT = -1;

const input = {
  left: false, right: false, jump: false, jumpPressed: false,
  tLeft: false, tRight: false, tJump: false, actionPressed: false,
};

let L = null;
let game = null;

function newGame() {
  L = buildLevel();
  const saved = getSave();
  for (const r of L.rare) r.ghost = saved.rare.includes(r.i);
  ambient.reset();
  const hiddenOn = new Uint8Array(L.cols * L.rows);
  game = {
    state: 'title',
    time: 0,
    cookies: 0,
    hearts: 3,
    metCount: 0,
    abil: [0, 0, 0, 0, 0],
    hudPop: [0, 0, 0, 0, 0],
    revealed: false,
    hiddenOn,
    particles: [],
    flyers: [],
    ghosts: [],
    banner: null,
    checkpoint: { x: L.spawn.x, y: L.spawn.y },
    fade: 0,
    respawnT: 0,
    victoryT: 0,
    victoryShown: false,
    victoryGirls: [],
    hintT: 0,
    idleT: 0,
    zT: 0,
    fxT: 0,
    bannerQueue: [],
    cardAwarded: false,
    reward: null,
    nearDoor: false,
    lookAhead: 0,
    cam: { x: 0, y: L.height - VIEW_H },
    player: makePlayer(L.spawn.x, L.spawn.y),
  };
}

function makePlayer(cx, bottom) {
  return {
    x: cx - P_W / 2, y: bottom - P_H, vx: 0, vy: 0,
    onGround: true, facing: 1, coyote: 0, jumpBuf: 0, canDouble: false,
    gliding: false, invuln: 0, land: 0, animT: 0, dead: false, dustT: 0, ghostT: 0,
  };
}

function isSolid(tx, ty) {
  if (tx < 0 || tx >= L.cols) return true;
  if (ty < 0 || ty >= L.rows) return false;
  return L.grid[ty * L.cols + tx] === T_SOLID;
}

function isOneWay(tx, ty) {
  if (tx < 0 || tx >= L.cols || ty < 0 || ty >= L.rows) return false;
  const idx = ty * L.cols + tx;
  const t = L.grid[idx];
  return t === T_ONEWAY || (t === T_HIDDEN && game.hiddenOn[idx] === 1);
}

function moveX(p, dx) {
  p.x += dx;
  const y0 = Math.floor(p.y / TILE);
  const y1 = Math.floor((p.y + P_H - 0.01) / TILE);
  if (dx > 0) {
    const tx = Math.floor((p.x + P_W - 0.01) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      if (isSolid(tx, ty)) { p.x = tx * TILE - P_W; p.vx = 0; break; }
    }
  } else if (dx < 0) {
    const tx = Math.floor(p.x / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      if (isSolid(tx, ty)) { p.x = (tx + 1) * TILE; p.vx = 0; break; }
    }
  }
}

function moveY(p, dy) {
  const prevBottom = p.y + P_H;
  p.y += dy;
  const x0 = Math.floor((p.x + 0.01) / TILE);
  const x1 = Math.floor((p.x + P_W - 0.01) / TILE);
  const wasGround = p.onGround;
  p.onGround = false;
  if (dy > 0) {
    const ty = Math.floor((p.y + P_H - 0.01) / TILE);
    for (let tx = x0; tx <= x1; tx++) {
      if (isSolid(tx, ty) || (isOneWay(tx, ty) && prevBottom <= ty * TILE + 0.5)) {
        if (!wasGround && p.vy > 260) p.land = 0.12;
        p.y = ty * TILE - P_H;
        p.vy = 0;
        p.onGround = true;
        break;
      }
    }
  } else if (dy < 0) {
    const ty = Math.floor(p.y / TILE);
    for (let tx = x0; tx <= x1; tx++) {
      if (isSolid(tx, ty)) { p.y = (ty + 1) * TILE; p.vy = 0; break; }
    }
  }
}

function stepPlayer(p, h) {
  const g = game;
  const left = input.left || input.tLeft;
  const right = input.right || input.tRight;
  const held = input.jump || input.tJump;
  const dir = (right ? 1 : 0) - (left ? 1 : 0);
  const maxV = RUN * (g.abil[SPEED] > 0 ? SPEED_MUL : 1);

  if (dir !== 0) {
    const acc = p.onGround ? ACC_GROUND : ACC_AIR;
    const target = dir * maxV;
    if (p.vx * dir < 0) p.vx += dir * (acc + DEC_GROUND * 0.5) * h;
    else p.vx += Math.sign(target - p.vx) * Math.min(Math.abs(target - p.vx), acc * h);
    p.facing = dir;
  } else {
    const dec = (p.onGround ? DEC_GROUND : DEC_AIR) * h;
    p.vx = Math.abs(p.vx) <= dec ? 0 : p.vx - Math.sign(p.vx) * dec;
  }
  if (Math.abs(p.vx) > maxV && p.onGround) p.vx = Math.sign(p.vx) * Math.max(maxV, Math.abs(p.vx) - DEC_GROUND * h);

  if (p.jumpBuf > 0) {
    if (p.onGround || p.coyote > 0) {
      p.vy = -JUMP_V;
      p.onGround = false;
      p.coyote = 0;
      p.jumpBuf = 0;
      p.canDouble = true;
      p.jumpCut = false;
      audio.sfx('jump');
      dust(p.x + P_W / 2, p.y + P_H, 4);
    } else if (g.abil[DOUBLE] > 0 && p.canDouble) {
      p.vy = -DJUMP_V;
      p.canDouble = false;
      p.jumpBuf = 0;
      p.jumpCut = true;
      audio.sfx('djump');
      ring(p.x + P_W / 2, p.y + P_H, '#7fe0b8', 10);
    }
  }
  p.jumpBuf = Math.max(0, p.jumpBuf - h);

  if (!held && !p.jumpCut && p.vy < -JUMP_CUT_V) {
    p.vy = -JUMP_CUT_V;
    p.jumpCut = true;
  }

  const wasGliding = p.gliding;
  p.vy = Math.min(p.vy + GRAV * h, MAX_FALL);
  p.gliding = g.abil[GLIDE] > 0 && held && p.vy > 0 && !p.onGround;
  if (p.gliding) p.vy = Math.min(p.vy, GLIDE_FALL);
  if (p.gliding && !wasGliding) audio.sfx('glide');

  moveX(p, p.vx * h);
  const wasGround = p.onGround;
  moveY(p, p.vy * h);
  if (wasGround && !p.onGround && p.vy >= 0) p.coyote = COYOTE;
  else if (!p.onGround) p.coyote = Math.max(0, p.coyote - h);
  if (p.onGround) p.canDouble = true;

  if (p.x < 0) { p.x = 0; p.vx = 0; }
  if (p.x > L.width - P_W) { p.x = L.width - P_W; p.vx = 0; }
}

function overlaps(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function hurt(fromX = null) {
  const g = game;
  const p = g.player;
  if (p.invuln > 0 || p.dead || g.state !== 'play') return;
  if (g.abil[SHIELD] > 0) {
    audio.sfx('shieldhit');
    p.invuln = 0.35;
    burst(p.x + P_W / 2, p.y + P_H / 2, 8, ['#a6ecff', '#ffffff']);
    return;
  }
  g.hearts -= 1;
  audio.sfx('hurt');
  p.invuln = 1.4;
  p.vy = -270;
  if (fromX !== null) p.vx = Math.sign(p.x + P_W / 2 - fromX || 1) * 150;
  burst(p.x + P_W / 2, p.y + P_H / 2, 8, ['#ff7fb0', '#ffffff']);
  if (g.hearts <= 0) gameOver();
}

function gameOver() {
  const g = game;
  if (g.state !== 'play') return;
  g.state = 'gameover';
  g.hearts = 0;
  g.flyers = [];
  g.banner = null;
  g.bannerQueue = [];
  for (let i = 0; i < 5; i++) g.abil[i] = 0;
  clearKeys();
  releaseTouch();
  audio.sfx('fall');
  showHudPause(false);
  showOverlay('gameover');
  liveEl.textContent = 'Game over. Press Try again to restart the level.';
}

function die(fell) {
  const p = game.player;
  if (p.dead) return;
  p.dead = true;
  game.respawnT = 0.9;
  if (fell) audio.sfx('fall');
}

function respawn() {
  const g = game;
  const cp = g.checkpoint;
  g.player = makePlayer(cp.x, cp.y);
  g.player.invuln = 1.2;
  for (let i = 0; i < 4; i++) g.abil[i] = 0;
  for (const girl of L.girls) girl.latch = false;
  g.cam.x = clampCamX(cp.x - VIEW_W * 0.42);
}

function clampCamX(x) {
  return Math.max(0, Math.min(L.width - VIEW_W, x));
}

function clampCamY(y) {
  return Math.max(0, Math.min(L.height - VIEW_H, y));
}

function updateCritters(dt) {
  const p = game.player;
  for (const c of L.critters) {
    if (!c.alive) {
      if (c.squash > 0) c.squash -= dt;
      continue;
    }
    c.t += dt;
    c.x += c.dir * 28 * dt;
    if (c.x < c.minX) { c.x = c.minX; c.dir = 1; }
    if (c.x > c.maxX) { c.x = c.maxX; c.dir = -1; }
    if (p.dead || game.state !== 'play') continue;
    const cx = c.x - 7;
    const cy = c.y - 12;
    if (overlaps(p.x + 2, p.y + 4, P_W - 4, P_H - 4, cx, cy, 14, 12)) {
      const prevBottom = p.y + P_H - p.vy * (1 / 60);
      if (p.vy > 0 && prevBottom <= cy + 7) {
        defeatCritter(c);
        p.vy = (input.jump || input.tJump) ? -400 : -300;
        p.jumpCut = true;
        p.canDouble = true;
        audio.sfx('stomp');
      } else if (game.abil[SHIELD] > 0) {
        defeatCritter(c);
        audio.sfx('shieldhit');
      } else {
        hurt(c.x);
      }
    }
  }
}

function defeatCritter(c) {
  c.alive = false;
  c.squash = 0.3;
  burst(c.x, c.y - 6, 10, ['#cdc5f3', '#ffffff', '#efeaff']);
}

function updateHazards() {
  const p = game.player;
  if (p.dead) return;
  for (const s of L.spikes) {
    const top = (s.row + 1) * TILE - 9;
    if (overlaps(p.x + 3, p.y, P_W - 6, P_H, s.x0 * TILE + 2, top, (s.x1 - s.x0 + 1) * TILE - 4, 9)) {
      if (game.abil[SHIELD] > 0) continue;
      hurt(null);
      return;
    }
  }
  if (p.y > L.height + 30) {
    game.hearts = Math.max(0, game.hearts - 1);
    if (game.hearts <= 0) gameOver();
    else die(true);
  }
}

function updateCookies(dt) {
  const p = game.player;
  for (const c of L.cookies) {
    if (c.taken) continue;
    c.phase += dt * 3;
    if (p.dead) continue;
    if (overlaps(p.x - 2, p.y, P_W + 4, P_H, c.x - 6, c.y - 6, 12, 12)) {
      c.taken = true;
      game.cookies += 1;
      audio.sfx('cookie');
      burst(c.x, c.y, reducedMotion ? 4 : 7, ['#f8d596', '#e7a659', '#ffffff']);
      game.particles.push({ kind: 'text', text: '+1', x: c.x - 5, y: c.y - 10, vx: 0, vy: -26, g: 0, life: 0.7, max: 0.7 });
    }
  }
}

function updateGirls(dt) {
  const p = game.player;
  const pcx = p.x + P_W / 2;
  const pb = p.y + P_H;
  for (const g of L.girls) {
    g.glow = Math.max(0, g.glow - dt);
    if (p.dead) continue;
    const near = Math.abs(pcx - g.x) < 26 && pb > g.y - 170 && pb < g.y + 12;
    if (near && !g.latch) {
      g.latch = true;
      if (!g.met) meetGirl(g);
      else if (g.index !== REVEAL && game.abil[g.index] < 2) sendItem(g, 0.45);
    }
    if (!near && Math.abs(pcx - g.x) > 56) g.latch = false;
  }
}

function meetGirl(g) {
  g.met = true;
  g.glow = 1.2;
  game.metCount += 1;
  game.checkpoint = { x: g.x + 22, y: g.y };
  audio.sfx('item');
  ring(g.x, g.y - 24, '#fff38a', 14);
  sendItem(g, 0.7);
  game.hudPop[g.index] = 1;
}

function sendItem(g, dur) {
  game.flyers.push({ icon: g.index, sx: g.x, sy: g.y - 34, t: 0, dur });
}

function grant(i) {
  const g = game;
  audio.sfx(i === REVEAL ? 'reveal' : 'power');
  g.abil[i] = ABILITIES[i].dur;
  const name = GIRL_NAMES[i];
  const hint = abilityHint(i);
  g.banner = { icon: i, text: `${name}: ${ABILITIES[i].name}`, hint, t: 0, dur: hint ? 4 : 2.2 };
  const p = g.player;
  burst(p.x + P_W / 2, p.y + P_H / 2, reducedMotion ? 6 : 14, PASTELS);
  liveEl.textContent = `${name} gave you ${ABILITY_SPOKEN[i]}`;
  if (i === REVEAL && !g.revealed) {
    g.revealed = true;
    const girl = L.girls[REVEAL];
    const sorted = [...L.hidden].sort((a, b) => Math.hypot(a.x * TILE - girl.x, a.y * TILE - girl.y) - Math.hypot(b.x * TILE - girl.x, b.y * TILE - girl.y));
    sorted.forEach((h, n) => { h.revealAt = g.time + 0.2 + n * 0.045; });
  }
}

function updateFlyers(dt) {
  const p = game.player;
  for (const f of game.flyers) {
    f.t += dt;
    if (!reducedMotion && Math.random() < 0.5) {
      const pos = flyerPos(f, p);
      game.particles.push({ kind: 'spark', x: pos.x, y: pos.y, vx: 0, vy: 0, g: 0, life: 0.3, max: 0.3, color: '#fff38a' });
    }
    if (f.t >= f.dur) {
      f.done = true;
      grant(f.icon);
    }
  }
  game.flyers = game.flyers.filter((f) => !f.done);
}

function flyerPos(f, p) {
  const t = Math.min(1, f.t / f.dur);
  const e = t * t * (3 - 2 * t);
  const tx = p.x + P_W / 2;
  const ty = p.y + 8;
  const mx = (f.sx + tx) / 2;
  const my = Math.min(f.sy, ty) - 40;
  const u = 1 - e;
  return { x: u * u * f.sx + 2 * u * e * mx + e * e * tx, y: u * u * f.sy + 2 * u * e * my + e * e * ty };
}

function updateHidden(dt) {
  const g = game;
  if (!g.revealed) {
    g.hintT -= dt;
    if (g.hintT <= 0 && L.hidden.length) {
      g.hintT = 0.5;
      const h = L.hidden[Math.floor(Math.random() * L.hidden.length)];
      if (visible(h.x * TILE)) g.particles.push({ kind: 'spark', x: h.x * TILE + 4 + Math.random() * 8, y: h.y * TILE + 4 + Math.random() * 8, vx: 0, vy: -4, g: 0, life: 0.6, max: 0.6, color: '#fff8d8', alpha: 0.6 });
    }
    return;
  }
  const p = g.player;
  if (!p.dead && p.onGround && p.y + P_H <= L.secret.topRow * TILE + 1 && p.x + P_W / 2 > L.secret.stepX) g.secretSeen = true;
  g.hintT -= dt;
  if (g.hintT <= 0) {
    g.hintT = 0.25;
    const h = L.hidden[Math.floor(Math.random() * L.hidden.length)];
    if (g.hiddenOn[h.y * L.cols + h.x] && visible(h.x * TILE)) g.particles.push({ kind: 'spark', x: h.x * TILE + 3 + Math.random() * 10, y: h.y * TILE - 2 + Math.random() * 6, vx: 0, vy: -10, g: 0, life: 0.5, max: 0.5, color: '#fff38a' });
  }
  for (const h of L.hidden) {
    const idx = h.y * L.cols + h.x;
    if (!g.hiddenOn[idx] && g.time >= h.revealAt) {
      g.hiddenOn[idx] = 1;
      burst(h.x * TILE + 8, h.y * TILE + 8, reducedMotion ? 2 : 4, ['#ffe89a', '#ff9ec8', '#ffffff']);
    }
  }
}

function updateAbilities(dt) {
  const g = game;
  for (let i = 0; i < 5; i++) {
    if (g.abil[i] > 0) {
      g.abil[i] -= dt;
      if (g.abil[i] <= 0) {
        g.abil[i] = 0;
        if (i !== REVEAL) audio.sfx('expire');
      }
    }
    g.hudPop[i] = Math.max(0, g.hudPop[i] - dt * 1.6);
  }
  if (g.banner) {
    g.banner.t += dt;
    if (g.banner.t > g.banner.dur) g.banner = g.bannerQueue.shift() || null;
  }
}

function updateCamera(dt, targetX, targetY, rate = 7) {
  const c = game.cam;
  c.x += (clampCamX(targetX) - c.x) * (1 - Math.exp(-dt * rate));
  c.y += (clampCamY(targetY) - c.y) * (1 - Math.exp(-dt * rate * 0.75));
}

function updatePlayCamera(dt) {
  const p = game.player;
  const g = game;
  g.lookAhead += (p.facing * 26 - g.lookAhead) * (1 - Math.exp(-dt * 2.5));
  updateCamera(dt, p.x + P_W / 2 - VIEW_W * 0.42 + g.lookAhead, p.y + P_H - 150);
  const c = g.cam;
  if (!p.dead) {
    if (p.y + P_H - c.y > VIEW_H - 12) c.y = clampCamY(p.y + P_H - VIEW_H + 12);
    if (p.y - c.y < 8) c.y = clampCamY(p.y - 8);
  }
}

function updateParticles(dt) {
  const list = game.particles;
  for (const q of list) {
    q.life -= dt;
    q.vy += (q.g ?? 220) * dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    if (q.sway) q.x += Math.sin(game.time * 4 + q.sway) * 12 * dt;
  }
  game.particles = list.filter((q) => q.life > 0);
  if (game.particles.length > 420) game.particles.splice(0, game.particles.length - 420);
  for (const gh of game.ghosts) gh.life -= dt;
  game.ghosts = game.ghosts.filter((gh) => gh.life > 0);
}

function burst(x, y, n, colors) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 40 + Math.random() * 70;
    game.particles.push({ kind: Math.random() < 0.35 ? 'spark' : 'px', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, g: 260, life: 0.5 + Math.random() * 0.3, max: 0.8, color: colors[i % colors.length] });
  }
}

function ring(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    game.particles.push({ kind: 'spark', x, y, vx: Math.cos(a) * 70, vy: Math.sin(a) * 35, g: 0, life: 0.4, max: 0.4, color });
  }
}

function dust(x, y, n) {
  for (let i = 0; i < n; i++) {
    game.particles.push({ kind: 'px', x: x + (Math.random() - 0.5) * 12, y: y - 1, vx: (Math.random() - 0.5) * 40, vy: -Math.random() * 30, g: 60, life: 0.35, max: 0.35, color: '#ffffff' });
  }
}

function updatePlay(dt) {
  const g = game;
  const p = g.player;
  if (input.jumpPressed) p.jumpBuf = JUMP_BUFFER;
  input.jumpPressed = false;

  if (p.dead) {
    g.respawnT -= dt;
    g.fade = Math.min(1, g.fade + dt * 3);
    if (g.respawnT <= 0) respawn();
  } else {
    g.fade = Math.max(0, g.fade - dt * 3);
    const n = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / n;
    for (let i = 0; i < n; i++) stepPlayer(p, h);
    p.invuln = Math.max(0, p.invuln - dt);
    p.land = Math.max(0, p.land - dt);
    p.animT += dt;
    if (p.onGround && Math.abs(p.vx) > 70) {
      p.dustT -= dt;
      if (p.dustT <= 0) {
        p.dustT = g.abil[SPEED] > 0 ? 0.05 : 0.1;
        dust(p.x + P_W / 2 - p.facing * 8, p.y + P_H, 1);
      }
    }
    if (g.abil[SPEED] > 0 && Math.abs(p.vx) > RUN * 0.8 && !reducedMotion) {
      p.ghostT -= dt;
      if (p.ghostT <= 0) {
        p.ghostT = 0.05;
        g.ghosts.push({ x: p.x, y: p.y, facing: p.facing, life: 0.22 });
      }
    }
    if (p.gliding && !reducedMotion && Math.random() < dt * 14) {
      g.particles.push({ kind: 'px', x: p.x + Math.random() * P_W, y: p.y + P_H, vx: -p.facing * 20, vy: 30, g: 0, life: 0.4, max: 0.4, color: '#ffffff' });
    }
  }

  updateIdle(dt);
  updatePowerFx(dt);
  updateCritters(dt);
  updateHazards();
  updateCookies(dt);
  updateRare(dt);
  updateGirls(dt);
  updateFlyers(dt);
  updateHidden(dt);
  updateAbilities(dt);
  updatePlayCamera(dt);
  g.nearDoor = nearDoor();
  if (g.nearDoor && input.actionPressed) enterRoom();
  input.actionPressed = false;

  if (!p.dead && g.metCount === L.girls.length && p.x + P_W / 2 > L.finishX + 32) startVictory();
}

function showBanner(b) {
  if (!game.banner) game.banner = b;
  else game.bannerQueue.push(b);
}

function playerBusy() {
  const p = game.player;
  return input.left || input.right || input.jump || input.tLeft || input.tRight || input.tJump
    || !p.onGround || Math.abs(p.vx) > 1 || p.invuln > 0 || p.dead || game.flyers.length > 0;
}

function updateIdle(dt) {
  const g = game;
  const p = g.player;
  if (playerBusy()) {
    g.idleT = 0;
    return;
  }
  g.idleT += dt;
  if (g.idleT > 12) {
    g.zT -= dt;
    if (g.zT <= 0) {
      g.zT = reducedMotion ? 2.8 : 1.4;
      const hx = p.x + P_W / 2 + (p.facing > 0 ? 5 : -5);
      g.particles.push({ kind: 'z', x: hx, y: p.y - 6, vx: p.facing * 5, vy: -12, g: 0, life: 2, max: 2 });
    }
  }
}

function updatePowerFx(dt) {
  const g = game;
  const p = g.player;
  if (reducedMotion || p.dead) return;
  g.fxT -= dt;
  if (g.fxT > 0) return;
  g.fxT = 0.12;
  const cx = p.x + P_W / 2;
  const cy = p.y + P_H / 2;
  if (g.abil[SPEED] > 0 && Math.abs(p.vx) > RUN * 0.8 && p.onGround) {
    g.particles.push({ kind: 'spark', x: cx - p.facing * 10, y: p.y + P_H - 3, vx: -p.facing * 30, vy: -10, g: 0, life: 0.3, max: 0.3, color: '#ffd84d' });
  }
  if (g.abil[DOUBLE] > 0 && !p.onGround && Math.random() < 0.5) {
    g.particles.push({ kind: 'px', x: cx + (Math.random() - 0.5) * 14, y: p.y + P_H, vx: 0, vy: 20, g: 0, life: 0.35, max: 0.35, color: '#7fe0b8' });
  }
  if (g.abil[GLIDE] > 0 && p.gliding) {
    g.particles.push({ kind: 'mheart', x: cx + (Math.random() - 0.5) * 16, y: p.y + 4, vx: (Math.random() - 0.5) * 10, vy: -14, g: 0, life: 0.9, max: 0.9, sprite: rareArt.miniHearts[Math.floor(Math.random() * 3)] });
  }
  if (g.abil[REVEAL] > 0) {
    g.particles.push({ kind: 'spark', x: cx + (Math.random() - 0.5) * 30, y: cy + (Math.random() - 0.5) * 36, vx: 0, vy: -8, g: 0, life: 0.5, max: 0.5, color: Math.random() < 0.5 ? '#ff9ed2' : '#d6c2ff' });
  }
}

function updateRare(dt) {
  const p = game.player;
  for (const r of L.rare) {
    r.phase += dt * 3;
    if (r.taken || r.ghost || p.dead) continue;
    if (overlaps(p.x - 2, p.y, P_W + 4, P_H, r.x - 7, r.y - 7, 14, 14)) {
      r.taken = true;
      addRare(r.i);
      const found = getSave().rare.length;
      audio.sfx('item');
      burst(r.x, r.y, reducedMotion ? 6 : 14, [rareArt.colors[r.i], '#ffffff', '#fff38a']);
      showBanner({ sprite: rareArt.cookies[r.i], text: `RARE COOKIE ${found}/${RARE_COUNT}`, t: 0, dur: 2.2 });
      liveEl.textContent = `Rare cookie found. ${found} of ${RARE_COUNT}.`;
    }
  }
}

function doorTileOn() {
  const s = L.secret;
  return game.revealed && game.hiddenOn[11 * L.cols + Math.floor(s.doorX / TILE)] === 1;
}

function nearDoor() {
  const p = game.player;
  const s = L.secret;
  return doorTileOn() && !p.dead && p.onGround && Math.abs(p.x + P_W / 2 - s.doorX) < 14 && Math.abs(p.y + P_H - s.doorY) < 2;
}

function enterRoom() {
  const g = game;
  g.state = 'room';
  g.fade = 1;
  room.reset();
  clearKeys();
  showHudPause(false);
  liveEl.textContent = 'Secret bedroom. Walk to the television to play, or to the door to leave.';
}

function exitRoom() {
  const g = game;
  const p = g.player;
  g.state = 'play';
  g.fade = 1;
  p.x = L.secret.doorX - P_W / 2;
  p.y = L.secret.doorY - P_H;
  p.vx = 0;
  p.vy = 0;
  p.onGround = true;
  clearKeys();
  showHudPause(true);
  liveEl.textContent = 'Back on the star path.';
}

function openTv() {
  game.state = 'tv';
  if (!tv) tv = new TvGame(miniBunny, art.icons[REVEAL], art.critter[0], reducedMotion);
  tv.phase = 'intro';
  tv.items = [];
  clearKeys();
  showOverlay('tvintro');
}

function startTv() {
  tv.start();
  clearOverlay();
  clearKeys();
}

function exitTv() {
  clearOverlay();
  game.state = 'room';
  clearKeys();
}

function tvFinished(res) {
  if (res === 'win') {
    markTvDone();
    showOverlay('tvresult', { won: true });
  } else {
    showOverlay('tvresult', { won: false });
  }
}

function celebrate() {
  audio.sfx('victory');
  const g = game;
  for (let i = 0; i < (reducedMotion ? 20 : 70); i++) {
    g.particles.push({ kind: 'px', x: g.cam.x + Math.random() * VIEW_W, y: g.cam.y - 4 - Math.random() * 40, vx: (Math.random() - 0.5) * 30, vy: 30 + Math.random() * 40, g: 10, life: 5, max: 5, color: PASTELS[i % PASTELS.length], sway: Math.random() * 6, size: 2 });
  }
}

function startVictory() {
  const g = game;
  if (!g.cardAwarded) {
    g.cardAwarded = true;
    const card = pickRewardCard();
    g.reward = { card, result: awardCard(card) };
  }
  g.state = 'victory';
  g.victoryT = 0;
  g.banner = null;
  g.flyers = [];
  for (let i = 0; i < 5; i++) g.abil[i] = 0;
  audio.stopMusic(true);
  audio.sfx('victory');
  setTimeout(() => {
    if (game === g && g.state === 'victory') {
      audio.restartSong();
      audio.startMusic();
    }
  }, 2600);
  const cx = L.stageX;
  const floor = GROUND * TILE;
  const slots = [[-122, floor], [-66, floor - 22], [0, floor - 58], [66, floor - 22], [122, floor]];
  g.victoryGirls = slots.map(([dx, y], i) => ({
    i, tx: cx + dx, ty: y,
    sx: cx + (i < 2 ? -260 : i > 2 ? 260 : 0), sy: i === 2 ? floor - 260 : floor - 120 - i * 10,
    delay: 0.5 + i * 0.16,
  }));
  liveEl.textContent = `Level complete! You collected ${g.cookies} of ${L.cookies.length} cookies.`;
  showHudPause(false);
}

function updateVictory(dt) {
  const g = game;
  const p = g.player;
  g.victoryT += dt;
  const targetX = L.stageX - P_W / 2;
  const dx = targetX - p.x;
  if (Math.abs(dx) > 2) {
    p.vx = Math.sign(dx) * Math.min(RUN, Math.abs(dx) * 4);
    p.facing = Math.sign(dx);
  } else {
    p.vx = 0;
    p.facing = -1;
  }
  const n = Math.max(1, Math.ceil(dt / (1 / 120)));
  for (let i = 0; i < n; i++) {
    const h = dt / n;
    p.vy = Math.min(p.vy + GRAV * h, MAX_FALL);
    moveX(p, p.vx * h);
    moveY(p, p.vy * h);
  }
  p.animT += dt;
  g.fade = Math.max(0, g.fade - dt * 3);

  const rate = reducedMotion ? 0.25 : 1;
  if (g.victoryT > 0.8 && Math.random() < dt * 40 * rate) {
    g.particles.push({ kind: 'px', x: g.cam.x + Math.random() * VIEW_W, y: g.cam.y - 4, vx: (Math.random() - 0.5) * 20, vy: 20 + Math.random() * 30, g: 10, life: 6, max: 6, color: PASTELS[Math.floor(Math.random() * PASTELS.length)], sway: Math.random() * 6, size: 2 });
  }
  if (g.victoryT > 1 && Math.random() < dt * 1.8 * rate) {
    const fx = g.cam.x + 40 + Math.random() * (VIEW_W - 80);
    const fy = g.cam.y + 30 + Math.random() * 50;
    const col = PASTELS[Math.floor(Math.random() * PASTELS.length)];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      g.particles.push({ kind: 'spark', x: fx, y: fy, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, g: 50, life: 0.9, max: 0.9, color: col });
    }
  }
  if (g.victoryT > 1.6 && Math.random() < dt * 3 * rate) {
    g.particles.push({ kind: 'heart', x: L.stageX + (Math.random() - 0.5) * 260, y: GROUND * TILE - 10, vx: 0, vy: -30, g: -4, life: 2.5, max: 2.5 });
  }
  updateParticles(dt);
  updateCamera(dt, L.stageX - VIEW_W / 2, GROUND * TILE - 152, 3);

  if (g.victoryT > 2.4 && !g.victoryShown) {
    g.victoryShown = true;
    showOverlay('reveal');
  }
}

function update(dt) {
  const g = game;
  g.time += dt;
  if (g.state === 'play') {
    updatePlay(dt);
    updateParticles(dt);
  } else if (g.state === 'victory') {
    updateVictory(dt);
  } else if (g.state === 'title') {
    g.player.animT += dt;
    for (const c of L.cookies) c.phase += dt * 3;
    updateCritters(dt);
  } else if (g.state === 'room') {
    g.fade = Math.max(0, g.fade - dt * 3);
    room.update(dt, input);
    if (input.actionPressed) {
      const near = room.nearby();
      if (near === 'door') exitRoom();
      else if (near === 'tv') openTv();
    }
    input.actionPressed = false;
  } else if (g.state === 'tv') {
    const res = tv.update(dt, input, (n) => audio.sfx(n));
    input.jumpPressed = false;
    input.actionPressed = false;
    if (res) tvFinished(res);
  }
  if (g.state === 'play' || g.state === 'title' || g.state === 'victory') ambient.update(dt, g.cam.x);
  updateTouchAction();
}

function updateTouchAction() {
  let label = '';
  const g = game;
  if (g.state === 'play' && g.nearDoor) label = 'ENTER';
  else if (g.state === 'room') {
    const near = room.nearby();
    if (near === 'door') label = 'EXIT';
    else if (near === 'tv') label = 'PLAY';
  }
  if (touchAction.dataset.label === label) return;
  touchAction.dataset.label = label;
  touchAction.hidden = !label;
  touchAction.replaceChildren();
  if (label) touchAction.append(makeLabel(label, { color: INK, scale: 1 }));
}

function isTouch() {
  return document.body.classList.contains('touch');
}

function sky01() {
  const t = (game.cam.x + VIEW_W / 2 - L.duskStart) / (L.duskEnd - L.duskStart);
  return Math.max(0, Math.min(1, t));
}

function drawStrip(img, px, bottomY, drift = 0) {
  const w = img.width;
  let off = -((game.cam.x * px + drift) % w);
  if (off > 0) off -= w;
  const y = Math.round((bottomY - img.height) * k) / k;
  for (let x = off; x < VIEW_W; x += w) ctx.drawImage(img, Math.round(x * k) / k, y);
}

function render() {
  const g = game;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  if (g.state === 'room' || (g.state === 'tv' && tv)) {
    renderRoom();
    return;
  }

  const st = Math.round(sky01() * 40) / 40;
  if (st !== skyT || !sky) {
    sky = buildSky(VIEW_W, VIEW_H, st);
    skyT = st;
  }
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.drawImage(sky, 0, 0);
  if (st > 0) drawStars(st);

  const lift = L.height - VIEW_H - g.cam.y;
  drawStrip(parallax.clouds, 0.08, 120 - g.cam.y * 0.05, g.time * 3);
  ambient.drawSky(ctx, g.time);
  drawStrip(parallax.skyline, 0.22, VIEW_H - 34 + lift * 0.2);
  const cityBottom = VIEW_H - 40 + lift * 0.35;
  drawStrip(parallax.city, 0.42, cityBottom);
  if (cityBottom < VIEW_H) {
    ctx.fillStyle = CITY_BASE;
    ctx.fillRect(0, Math.floor(cityBottom), VIEW_W, VIEW_H);
  }
  ambient.drawCity(ctx, g.cam.x, Math.round((cityBottom - parallax.city.height) * k) / k);

  const camX = Math.round(g.cam.x * k) / k;
  const camY = Math.round(g.cam.y * k) / k;
  const sx = Math.max(0, Math.floor(camX));
  const sy = Math.max(0, Math.floor(camY));
  const sw = Math.min(VIEW_W + 2, levelCanvas.width - sx);
  const sh = Math.min(VIEW_H + 2, levelCanvas.height - sy);
  ctx.drawImage(levelCanvas, sx, sy, sw, sh, sx - camX, sy - camY, sw, sh);

  ctx.setTransform(k, 0, 0, k, -camX * k, -camY * k);
  drawHidden();
  drawDoor();
  drawSecretGuide();
  drawCookies();
  drawRare();
  drawCritters();
  drawGirls();
  if (g.state === 'victory') drawVictoryGirls();
  drawFlyers();
  drawPlayer();
  drawParticles();

  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.imageSmoothingEnabled = false;
  if (g.state === 'play' || g.state === 'gameover') drawHud();
  if (g.banner) drawBanner();
  if (g.state === 'victory') drawVictoryTitle();
  if (g.fade > 0) {
    ctx.fillStyle = `rgba(255, 248, 252, ${g.fade})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

function drawStars(t) {
  const n = 40;
  for (let i = 0; i < n; i++) {
    const x = (i * 97.3 + 13) % VIEW_W;
    const y = (i * 53.7) % 80 + 4;
    const tw = Math.sin(game.time * 2 + i * 1.7);
    if (tw < -0.3) continue;
    ctx.globalAlpha = t * (0.5 + tw * 0.5);
    ctx.fillStyle = i % 3 ? '#ffffff' : '#fff38a';
    ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
    if (i % 5 === 0 && tw > 0.5) {
      ctx.fillRect(Math.floor(x) - 1, Math.floor(y), 3, 1);
      ctx.fillRect(Math.floor(x), Math.floor(y) - 1, 1, 3);
    }
  }
  ctx.globalAlpha = 1;
}

function visible(x, w = 32) {
  return x + w > game.cam.x - 8 && x - w < game.cam.x + VIEW_W + 8;
}

function drawHidden() {
  const g = game;
  if (!g.revealed) return;
  for (const h of L.hidden) {
    const x = h.x * TILE;
    if (!visible(x)) continue;
    const age = g.time - h.revealAt;
    if (age < 0) continue;
    const s = age < 0.18 ? age / 0.18 : 1;
    const pop = age < 0.3 ? 1 + Math.sin((age / 0.3) * Math.PI) * 0.15 : 1;
    const size = 16 * s * pop;
    ctx.drawImage(starBlock, x + 8 - size / 2, h.y * TILE + 8 - size / 2, size, size);
  }
}

function drawSecretGuide() {
  const g = game;
  if (!g.revealed || g.state !== 'play') return;
  const s = L.secret;
  const p = g.player;
  const pcx = p.x + P_W / 2;
  const bob = reducedMotion ? 0 : Math.round(Math.abs(Math.sin(g.time * 4)) * -3);
  if (pcx < s.bridgeX + 2 * TILE) {
    ctx.drawImage(art.guideRight, s.bridgeX + 4 + bob * -1, GROUND * TILE - 34);
  }
  if (pcx < s.bridgeEnd && !g.secretSeen) {
    ctx.drawImage(art.guideUp, s.stepX + 12, s.stepRow * TILE - 14 + bob);
  }
}

function renderRoom() {
  const g = game;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.imageSmoothingEnabled = false;
  if (g.state === 'tv') tv.draw(ctx, g.time);
  else room.draw(ctx, drawRoomBunny, g.time, isTouch());
  if (g.fade > 0) {
    ctx.fillStyle = `rgba(255, 248, 252, ${g.fade})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

function drawRoomBunny(rp) {
  const moving = Math.abs(rp.vx) > 5;
  const pose = { angle: moving ? rp.facing * 0.05 : 0, sx: 1, sy: 1, bob: moving ? -Math.abs(Math.sin(rp.animT * 11)) * 1.2 : Math.sin(rp.animT * 3) * 0.5 };
  if (reducedMotion) pose.bob *= 0.5;
  drawBunnyAt(rp.x, rp.y, rp.facing, pose);
}

function drawDoor() {
  if (!doorTileOn()) return;
  const x = Math.round(L.secret.doorX) - 12;
  const b = L.secret.doorY;
  ctx.fillStyle = INK;
  ctx.fillRect(x - 1, b - 41, 26, 41);
  ctx.fillRect(x + 3, b - 44, 18, 3);
  ctx.fillStyle = '#ff9ec8';
  ctx.fillRect(x, b - 40, 24, 40);
  ctx.fillRect(x + 4, b - 43, 16, 3);
  ctx.fillStyle = '#ffd0e6';
  ctx.fillRect(x + 3, b - 36, 18, 14);
  ctx.fillRect(x + 3, b - 19, 18, 16);
  ctx.fillStyle = '#fff38a';
  ctx.fillRect(x + 18, b - 21, 3, 3);
  ctx.drawImage(art.heart, x + 8, b - 33);
  const glow = Math.floor(game.time * 3) % 2;
  drawSpark(x - 4, b - 46 + glow, glow ? '#fff38a' : '#ffffff');
  drawSpark(x + 29, b - 38 - glow, glow ? '#ffffff' : '#ff9ec8');
}

function drawRare() {
  for (const r of L.rare) {
    if (r.taken || !visible(r.x)) continue;
    const s = rareArt.cookies[r.i];
    const bob = Math.round(Math.sin(r.phase) * 2);
    ctx.globalAlpha = r.ghost ? 0.3 : 1;
    if (!r.ghost && Math.floor(r.phase * 2) % 3 === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(r.x + 7), Math.round(r.y - 7 + bob), 1, 1);
      ctx.fillRect(Math.round(r.x - 8), Math.round(r.y + 3 + bob), 1, 1);
    }
    ctx.drawImage(s, Math.round(r.x - s.width / 2), Math.round(r.y - s.height / 2 + bob));
    ctx.globalAlpha = 1;
  }
}

function drawCookies() {
  for (const c of L.cookies) {
    if (c.taken || !visible(c.x)) continue;
    const bob = Math.round(Math.sin(c.phase) * 1.5);
    const squeeze = Math.abs(Math.cos(c.phase * 0.5));
    const w = Math.max(2, Math.round(12 * (0.55 + 0.45 * squeeze)));
    ctx.drawImage(art.cookie, Math.round(c.x - w / 2), Math.round(c.y - 6 + bob), w, 12);
  }
}

function drawCritters() {
  for (const c of L.critters) {
    if (!visible(c.x)) continue;
    if (!c.alive) {
      if (c.squash <= 0) continue;
      ctx.globalAlpha = Math.min(1, c.squash / 0.15);
      ctx.drawImage(art.critter[0], Math.round(c.x - 8), Math.round(c.y - 6), 16, 6);
      ctx.globalAlpha = 1;
      continue;
    }
    const frame = art.critter[Math.floor(c.t * 5) % 2];
    const bob = Math.floor(c.t * 5) % 2 ? 0 : -1;
    ctx.save();
    ctx.translate(Math.round(c.x), Math.round(c.y + bob));
    if (c.dir > 0) ctx.scale(-1, 1);
    ctx.drawImage(frame, -8, -14);
    ctx.restore();
  }
}

function snap(v) {
  return Math.round(v * k) / k;
}

function drawGirls() {
  const g = game;
  const p = g.player;
  for (const girl of L.girls) {
    const info = chars.girls[girl.index];
    if (!visible(girl.x, info.w)) continue;
    const float = reducedMotion ? 0 : Math.sin(g.time * 2.4 + girl.index * 1.3) * 2;
    const baseY = girl.y - 5;
    drawShadow(girl.x, girl.y, 10 - float);
    const spr = scaled.girls[girl.index].sprite;
    if (girl.glow > 0) {
      const a = (g.time * 4) % (Math.PI * 2);
      for (let i = 0; i < 6; i++) {
        const ang = a + (i / 6) * Math.PI * 2;
        ctx.fillStyle = i % 2 ? '#fff38a' : '#ffffff';
        ctx.fillRect(Math.round(girl.x + Math.cos(ang) * 28), Math.round(baseY - info.h / 2 + Math.sin(ang) * 22), 2, 2);
      }
    }
    ctx.drawImage(spr, snap(girl.x - info.w / 2), snap(baseY - info.h + float), info.w, info.h);
    if (!girl.met && g.state === 'play') {
      const d = Math.abs(p.x + P_W / 2 - girl.x);
      if (d < 150) drawBubble(girl.x + info.w / 2 - 4, baseY - info.h - 6 + float + Math.round(Math.sin(g.time * 6) * 1.5));
    }
  }
}

function drawShadow(x, groundY, width) {
  const w = Math.max(6, Math.round(width * 2));
  ctx.fillStyle = 'rgba(80, 60, 140, 0.18)';
  ctx.fillRect(Math.round(x - w / 2), groundY - 2, w, 2);
  ctx.fillRect(Math.round(x - w / 2 + 2), groundY - 3, w - 4, 1);
}

function drawBubble(x, y) {
  x = Math.round(x);
  y = Math.round(y);
  ctx.fillStyle = INK;
  ctx.fillRect(x - 7, y - 11, 15, 11);
  ctx.fillRect(x - 3, y, 3, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 6, y - 10, 13, 9);
  ctx.fillRect(x - 2, y - 1, 1, 2);
  ctx.drawImage(art.heart, x - 4, y - 10);
}

function drawFlyers() {
  const p = game.player;
  for (const f of game.flyers) {
    const pos = flyerPos(f, p);
    const s = 1 + Math.sin(Math.min(1, f.t / f.dur) * Math.PI) * 0.4;
    const size = Math.round(12 * s);
    ctx.drawImage(art.icons[f.icon], Math.round(pos.x - size / 2), Math.round(pos.y - size / 2), size, size);
  }
}

function playerPose(p) {
  const speed = Math.abs(p.vx) / RUN;
  let angle = 0;
  let sx = 1;
  let sy = 1;
  let bob = 0;
  const t = p.animT;
  if (game.state === 'title') {
    bob = Math.sin(t * 3) * 0.6;
  } else if (p.gliding) {
    angle = reducedMotion ? 0 : Math.sin(t * 5) * 0.07;
  } else if (!p.onGround) {
    if (p.vy < 0) { sy = 1.05; sx = 0.96; } else { sy = 0.98; sx = 1.02; }
    angle = p.facing * Math.min(1, speed) * 0.06;
  } else if (speed > 0.05) {
    bob = -Math.abs(Math.sin(t * 11)) * 1.2 * Math.min(1, speed);
    angle = p.facing * (0.05 + Math.sin(t * 5.5) * 0.03) * Math.min(1, speed);
  } else {
    bob = Math.sin(t * 3) * 0.5;
  }
  if (p.land > 0) { sy *= 0.9; sx *= 1.08; }
  if (game.state === 'play' && game.idleT > 12) {
    sy = 0.93;
    sx = 1.04;
    bob = Math.sin(t * 1.5) * 0.4;
    angle = 0;
  } else if (game.state === 'play' && game.idleT > 8) {
    angle = Math.sin(t * 2.2) * 0.025;
  }
  if (reducedMotion) { angle *= 0.5; bob *= 0.5; }
  return { angle, sx, sy, bob };
}

function drawBunnyAt(x, bottom, facing, pose, alpha = 1, opts = {}) {
  const c = ctx;
  const b = chars.bunny;
  const spr = facing > 0 ? scaled.bunnyR : scaled.bunnyL;
  c.save();
  c.globalAlpha = alpha;
  c.translate(snap(x), snap(bottom + 1 + pose.bob));
  if (pose.angle) c.rotate(pose.angle);
  if (pose.sx !== 1 || pose.sy !== 1) c.scale(pose.sx, pose.sy);
  c.imageSmoothingEnabled = pose.angle !== 0 || pose.sx !== 1;
  c.imageSmoothingQuality = 'high';
  c.drawImage(spr, -b.w / 2, -b.h, b.w, b.h);
  if (opts.eyesClosed) drawClosedEyes(c, b.w, b.h, facing);
  if (opts.glint) drawEarGlints(c, b.w, b.h, facing, opts.glint, game.time);
  c.restore();
  c.imageSmoothingEnabled = false;
}

function playerLook() {
  const g = game;
  let eyesClosed = false;
  if (g.state === 'play') {
    if (g.idleT > 12) eyesClosed = true;
    else if (g.idleT > 8) eyesClosed = g.idleT % 2.4 < 0.14;
  }
  let glint = null;
  if (g.abil[GLIDE] > 0) glint = '#ff9ec8';
  else if (g.abil[DOUBLE] > 0) glint = '#7fe0b8';
  else if (g.abil[SPEED] > 0) glint = '#ffd84d';
  return { eyesClosed, glint: reducedMotion ? null : glint };
}

function drawPlayer() {
  const g = game;
  const p = g.player;
  for (const gh of g.ghosts) {
    drawBunnyAt(gh.x + P_W / 2, gh.y + P_H, gh.facing, { angle: 0, sx: 1, sy: 1, bob: 0 }, (gh.life / 0.22) * 0.3);
  }
  if (p.dead && g.state === 'play') return;
  const blink = p.invuln > 0 && Math.floor(p.invuln * 12) % 2 === 0;
  const pose = playerPose(p);
  if (!blink) drawBunnyAt(p.x + P_W / 2, p.y + P_H, p.facing, pose, 1, playerLook());
  if (g.abil[SHIELD] > 0) {
    const low = g.abil[SHIELD] < 3 && Math.floor(g.time * 8) % 2 === 0;
    if (!low) {
      const pulse = reducedMotion ? 0 : Math.round(Math.sin(g.time * 5));
      const size = shieldBubble.width + pulse * 2;
      ctx.drawImage(shieldBubble, Math.round(p.x + P_W / 2 - size / 2), Math.round(p.y + P_H / 2 - 4 - size / 2), size, size);
      if (!reducedMotion) {
        for (let i = 0; i < 3; i++) {
          const a = g.time * 3 + i * 2.09;
          drawSpark(Math.round(p.x + P_W / 2 + Math.cos(a) * 24), Math.round(p.y + P_H / 2 - 4 + Math.sin(a) * 24), i ? '#ffd84d' : '#ffffff');
        }
      }
    }
  }
  if (g.abil[DOUBLE] > 0 && p.canDouble && !p.onGround && !reducedMotion) {
    if (Math.floor(g.time * 10) % 2 === 0) {
      ctx.fillStyle = '#7fe0b8';
      ctx.fillRect(Math.round(p.x - 2), Math.round(p.y + P_H - 4), 2, 2);
      ctx.fillRect(Math.round(p.x + P_W), Math.round(p.y + P_H - 4), 2, 2);
    }
  }
}

function drawSpark(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 1, y, 3, 1);
  ctx.fillRect(x, y - 1, 1, 3);
}

function drawParticles() {
  for (const q of game.particles) {
    const a = Math.min(1, (q.life / q.max) * 2) * (q.alpha ?? 1);
    ctx.globalAlpha = a;
    const x = Math.round(q.x);
    const y = Math.round(q.y);
    if (q.kind === 'spark') drawSpark(x, y, q.color);
    else if (q.kind === 'text') drawText(ctx, q.text, x, y, '#ffffff', INK);
    else if (q.kind === 'heart') ctx.drawImage(art.heart, x, y);
    else if (q.kind === 'mheart') ctx.drawImage(q.sprite, x, y);
    else if (q.kind === 'z') drawText(ctx, 'Z', x, y, '#b9a6ff', '#ffffff');
    else {
      ctx.fillStyle = q.color;
      const s = q.size ?? 1;
      ctx.fillRect(x, y, s, s);
    }
  }
  ctx.globalAlpha = 1;
}

function drawHud() {
  const g = game;
  for (let i = 0; i < 3; i++) ctx.drawImage(i < g.hearts ? art.heart : art.heartEmpty, 6 + i * 11, 6);
  ctx.drawImage(art.cookie, 6, 17);
  drawText(ctx, `x${String(g.cookies).padStart(2, '0')}`, 20, 20, '#ffffff', INK);
  const found = getSave().rare;
  for (let i = 0; i < RARE_COUNT; i++) {
    const rx = 44 + i * 9;
    if (found.includes(i)) {
      ctx.drawImage(rareArt.cookies[i], rx, 18, 8, 8);
    } else {
      ctx.fillStyle = 'rgba(34, 51, 110, 0.35)';
      ctx.fillRect(rx + 1, 19, 6, 6);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillRect(rx + 2, 20, 4, 4);
    }
  }
  if (g.nearDoor && !isTouch()) {
    bubble(ctx, 'DOWN: ENTER', L.secret.doorX - g.cam.x, L.secret.doorY - g.cam.y - 46 + Math.round(Math.sin(g.time * 5)));
  }

  const slots = L.girls.length;
  const slotW = 18;
  const x0 = Math.round(VIEW_W / 2 - (slots * slotW - 2) / 2);
  for (let i = 0; i < slots; i++) {
    const met = L.girls[i].met;
    const pop = g.hudPop[i];
    const s = 1 + Math.sin(pop * Math.PI) * 0.25;
    const size = 16 * s;
    const cx = x0 + i * slotW + 8;
    const cy = 13;
    ctx.fillStyle = INK;
    ctx.fillRect(Math.round(cx - size / 2), Math.round(cy - size / 2), Math.round(size), Math.round(size));
    ctx.fillStyle = met ? '#fff8fc' : '#d9d2f2';
    ctx.fillRect(Math.round(cx - size / 2) + 1, Math.round(cy - size / 2) + 1, Math.round(size) - 2, Math.round(size) - 2);
    const face = met ? scaled.girls[i].face : scaled.girls[i].faceDim;
    const fs = 14 * s;
    ctx.drawImage(face, snap(cx - fs / 2), snap(cy - fs / 2), fs, fs);
  }

  let n = 0;
  for (let i = 0; i < 5; i++) {
    const left = g.abil[i];
    if (left <= 0) continue;
    const x = 6 + n * 18;
    const y = 31;
    n++;
    const blink = i !== REVEAL && left < 3 && Math.floor(g.time * 8) % 2 === 0;
    ctx.fillStyle = INK;
    ctx.fillRect(x - 1, y - 1, 16, 16);
    ctx.fillStyle = '#fff8fc';
    ctx.fillRect(x, y, 14, 14);
    ctx.globalAlpha = blink ? 0.35 : 1;
    ctx.drawImage(art.icons[i], x + 1, y + 1);
    ctx.globalAlpha = 1;
    const frac = Math.max(0, Math.min(1, left / ABILITIES[i].dur));
    ctx.fillStyle = INK;
    ctx.fillRect(x - 1, y + 16, 16, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y + 17, 14, 2);
    ctx.fillStyle = ['#ffd84d', '#7fe0b8', '#ffb3d1', '#7fd8ff', '#ffe27a'][i];
    ctx.fillRect(x, y + 17, Math.round(14 * frac), 2);
  }
}

function drawBanner() {
  const b = game.banner;
  const t = b.t;
  const tw = textWidth(b.text);
  const hw = b.hint ? textWidth(b.hint) + 12 : 0;
  const w = Math.max(tw + 12 + 18, hw);
  const enter = Math.min(1, t / 0.25);
  const leave = t > b.dur - 0.4 ? (t - (b.dur - 0.4)) / 0.4 : 0;
  const y = Math.round(44 - (1 - enter) * 12 - leave * 8 + (reducedMotion ? 0 : Math.sin(Math.min(1, t / 0.5) * Math.PI) * -3));
  const x = Math.round(VIEW_W / 2 - w / 2);
  ctx.globalAlpha = Math.max(0, enter * (1 - leave));
  ctx.fillStyle = INK;
  ctx.fillRect(x, y, w, 18);
  ctx.fillRect(x + 1, y + 18, w - 2, 1);
  ctx.fillStyle = '#fff8fc';
  ctx.fillRect(x + 1, y + 1, w - 2, 16);
  ctx.fillStyle = '#ffe3f0';
  ctx.fillRect(x + 1, y + 13, w - 2, 4);
  ctx.drawImage(b.sprite || art.icons[b.icon], x + 4, y + 3, 12, 12);
  drawText(ctx, b.text, x + 21, y + 6, INK);
  if (b.hint) {
    const hx = Math.round(VIEW_W / 2 - hw / 2);
    ctx.fillStyle = INK;
    ctx.fillRect(hx, y + 21, hw, 13);
    ctx.fillStyle = '#ff9ec8';
    ctx.fillRect(hx + 1, y + 22, hw - 2, 11);
    drawText(ctx, b.hint, hx + 6, y + 24, '#ffffff');
  }
  ctx.globalAlpha = 1;
}

function drawVictoryGirls() {
  const g = game;
  const vt = g.victoryT;
  for (const v of g.victoryGirls) {
    const info = chars.girls[v.i];
    const t = Math.max(0, Math.min(1, (vt - v.delay) / 0.9));
    if (t <= 0) continue;
    const e = 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
    const x = v.sx + (v.tx - v.sx) * e;
    let y = v.sy + (v.ty - v.sy) * e;
    if (vt > 2 && !reducedMotion) y -= Math.abs(Math.sin(vt * 4 + v.i * 0.7)) * 5;
    drawShadow(v.tx, GROUND * TILE, 10);
    ctx.drawImage(scaled.girls[v.i].sprite, snap(x - info.w / 2), snap(y - info.h - 5), info.w, info.h);
  }
}

function drawVictoryTitle() {
  const vt = game.victoryT;
  if (vt < 1) return;
  const text = 'YOU DID IT!';
  const s = 2;
  const w = textWidth(text) * s;
  const drop = Math.min(1, (vt - 1) / 0.4);
  const y = Math.round(16 - (1 - drop) * 30 + (reducedMotion ? 0 : Math.sin(vt * 3) * 1.5));
  ctx.save();
  ctx.translate(Math.round(VIEW_W / 2 - w / 2), y);
  ctx.scale(s, s);
  drawText(ctx, text, 0, 0, '#ffffff', INK);
  ctx.restore();
}

function clearOverlay() {
  overlayEl.replaceChildren();
  overlayEl.className = '';
  overlayEl.hidden = true;
  document.body.classList.remove('overlay-open');
}

function pixButton(text, icon, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'pix-btn';
  b.setAttribute('aria-label', text.charAt(0) + text.slice(1).toLowerCase());
  if (icon) {
    const ic = iconCanvas(icon);
    ic.className = 'pix-label';
    ic.style.width = `calc(var(--u) * ${ic.width * 1.5})`;
    ic.style.height = `calc(var(--u) * ${ic.height * 1.5})`;
    b.append(ic);
  }
  b.append(makeLabel(text, { scale: 1.5 }));
  b.addEventListener('click', (e) => {
    audio.unlock();
    audio.sfx('click');
    onClick(e);
  });
  return b;
}

function el(tag, cls, ...children) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  e.append(...children);
  return e;
}

function label(text, scale = 1.2, color = INK) {
  return makeLabel(text, { color, scale });
}

function tallyRow() {
  const row = el('div', 'row');
  const cookie = iconCanvas(art.cookie);
  cookie.className = 'pix-label';
  cookie.style.width = 'calc(var(--u) * 14)';
  cookie.style.height = 'calc(var(--u) * 14)';
  row.append(cookie, makeLabel(`${game.cookies} / ${L.cookies.length}`, { color: INK, scale: 1.75 }));
  const rare = iconCanvas(rareArt.cookies[2]);
  rare.className = 'pix-label';
  rare.style.width = 'calc(var(--u) * 14)';
  rare.style.height = 'calc(var(--u) * 14)';
  row.append(rare, makeLabel(`${getSave().rare.length} / ${RARE_COUNT}`, { color: INK, scale: 1.75 }));
  return row;
}

function showOverlay(kind, opts = {}) {
  clearOverlay();
  overlayEl.hidden = false;
  document.body.classList.add('overlay-open');
  let focusEl = null;
  if (kind === 'title') {
    overlayEl.className = '';
    const panel = document.createElement('div');
    panel.className = 'panel flat';
    const title = makeLabel('NEWJEANS GAME', { color: '#ffffff', outline: INK, scale: 4, title: true });
    const play = pixButton('PLAY', art.ui.play, startGame);
    const cards = pixButton('PHOTOCARDS', null, () => showOverlay('gallery', { from: 'title' }));
    const menu = el('div', 'row menu', play, cards);
    menu.setAttribute('role', 'menu');
    const hint = document.createElement('div');
    hint.className = 'row';
    const touch = isTouch();
    hint.append(makeLabel(touch ? '< > MOVE' : '< > / A D MOVE', { color: '#ffffff', outline: INK, scale: 1.2 }));
    hint.append(makeLabel(touch ? '^ JUMP' : 'SPACE JUMP', { color: '#ffffff', outline: INK, scale: 1.2 }));
    panel.append(title, menu, hint);
    overlayEl.append(panel);
    focusEl = play;
  } else if (kind === 'gallery') {
    overlayEl.className = 'dim';
    const back = opts.from === 'victory' ? () => showOverlay('victoryend') : () => showOverlay('title');
    const gal = buildGallery({ pixButton, onClose: back, startMember: opts.member || 'minji' });
    overlayEl.append(gal.panel);
    gal.focus();
  } else if (kind === 'reveal') {
    overlayEl.className = 'dim';
    const { card, result } = game.reward;
    const panel = buildReveal({
      card, result, reduced: reducedMotion, pixButton,
      playSfx: (n) => audio.sfx(n),
      onCollection: () => showOverlay('gallery', { from: 'victory', member: card.member }),
      onPlayAgain: () => restartGame(),
      extraRow: tallyRow(),
      onComplete: celebrate,
    });
    overlayEl.append(panel);
    focusEl = panel.querySelector('button');
    liveEl.textContent = 'You earned a photocard. Who did you get?';
  } else if (kind === 'victoryend') {
    overlayEl.className = 'bottom';
    const panel = document.createElement('div');
    panel.className = 'panel compact';
    const again = pixButton('PLAY AGAIN', art.ui.play, () => restartGame());
    const coll = pixButton('COLLECTION', null, () => showOverlay('gallery', { from: 'victory' }));
    panel.append(el('div', 'row', tallyRow(), coll, again));
    overlayEl.append(panel);
    focusEl = again;
  } else if (kind === 'tvintro') {
    overlayEl.className = '';
    const panel = el('div', 'panel');
    const start = pixButton('START', art.ui.play, startTv);
    const exit = pixButton('EXIT', null, exitTv);
    panel.append(
      label('STAR CATCHER', 2),
      label(`CATCH ${TV_TARGET} STARS IN 20 SECONDS`, 1.1),
      label('DODGE THE STORM CLOUDS', 1.1, '#c2457f'),
      label(isTouch() ? 'MOVE WITH < >' : 'MOVE WITH < > OR A D', 1),
      el('div', 'row', start, exit),
    );
    overlayEl.append(panel);
    focusEl = start;
  } else if (kind === 'tvresult') {
    overlayEl.className = '';
    const panel = el('div', 'panel');
    const again = pixButton('REPLAY', art.ui.play, startTv);
    const exit = pixButton('EXIT', null, exitTv);
    panel.append(label(opts.won ? 'SUCCESS!' : 'TRY AGAIN!', 2.2, opts.won ? '#3f9a6e' : '#c2457f'), label(`STARS ${tv.score} / ${TV_TARGET}`, 1.4));
    panel.append(el('div', 'row', again, exit));
    overlayEl.append(panel);
    focusEl = again;
    liveEl.textContent = opts.won ? `Success! ${tv.score} stars.` : `Try again. ${tv.score} stars.`;
  } else if (kind === 'gameover') {
    overlayEl.className = 'dim';
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Game over');
    const again = pixButton('TRY AGAIN', art.ui.play, () => restartGame());
    panel.append(makeLabel('GAME OVER', { color: INK, scale: 3 }), again);
    overlayEl.append(panel);
    focusEl = again;
  } else if (kind === 'pause') {
    overlayEl.className = 'dim';
    const panel = document.createElement('div');
    panel.className = 'panel';
    const resume = pixButton('RESUME', art.ui.play, () => setPaused(false));
    const restart = pixButton('RESTART', null, () => restartGame());
    const row = document.createElement('div');
    row.className = 'row';
    row.append(resume, restart);
    panel.append(makeLabel('PAUSED', { color: INK, scale: 3 }), row);
    overlayEl.append(panel);
    focusEl = resume;
  }
  if (focusEl) focusEl.focus({ preventScroll: true });
}

function showHudPause(show) {
  btnPause.hidden = !show;
}

function startGame() {
  audio.unlock();
  audio.ensureMusic();
  clearOverlay();
  game.state = 'play';
  game.player.animT = 0;
  showHudPause(true);
  document.activeElement?.blur?.();
}

function restartGame() {
  newGame();
  startGame();
}

function setPaused(paused) {
  if (paused && game.state === 'play') {
    game.state = 'paused';
    audio.suspend();
    showOverlay('pause');
    btnPause.setAttribute('aria-label', 'Resume');
    setIcon(btnPause, art.ui.play);
  } else if (!paused && game.state === 'paused') {
    game.state = 'play';
    clearOverlay();
    audio.resume();
    btnPause.setAttribute('aria-label', 'Pause');
    setIcon(btnPause, art.ui.pause);
    document.activeElement?.blur?.();
  }
  clearKeys();
}

function setIcon(btn, sprite, crossed = false) {
  btn.replaceChildren(iconCanvas(sprite, crossed));
}

function syncAudioButtons() {
  setIcon(btnMusic, art.ui.music, !audio.musicOn);
  btnMusic.setAttribute('aria-pressed', String(audio.musicOn));
  setIcon(btnSfx, art.ui.speaker, !audio.sfxOn);
  btnSfx.setAttribute('aria-pressed', String(audio.sfxOn));
}

function toggleMusic() {
  audio.unlock();
  audio.setMusic(!audio.musicOn);
  if (audio.musicOn && (game.state === 'play' || game.state === 'victory')) audio.startMusic();
  syncAudioButtons();
}

function toggleSfx() {
  audio.unlock();
  audio.setSfx(!audio.sfxOn);
  syncAudioButtons();
  audio.sfx('click');
}

function blurAfterPointer(e) {
  if (e.detail > 0) e.currentTarget.blur();
}

btnMusic.addEventListener('click', (e) => { toggleMusic(); blurAfterPointer(e); });
btnSfx.addEventListener('click', (e) => { toggleSfx(); blurAfterPointer(e); });
btnPause.addEventListener('click', (e) => {
  audio.unlock();
  if (game.state === 'play') setPaused(true);
  else if (game.state === 'paused') setPaused(false);
  blurAfterPointer(e);
});

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Space: 'jump', ArrowUp: 'jump', KeyW: 'jump',
};

const NAV_KEYS = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 };
const ACTION_KEYS = new Set(['ArrowDown', 'KeyS', 'KeyE']);

function clearKeys() {
  input.left = input.right = input.jump = false;
  input.jumpPressed = false;
  input.actionPressed = false;
}

window.addEventListener('keydown', (e) => {
  if (!game) return;
  const onButton = e.target instanceof HTMLButtonElement;
  if (e.code === 'Escape' || e.code === 'KeyP') {
    if (game.state === 'play') setPaused(true);
    else if (game.state === 'paused') setPaused(false);
    else if (game.state === 'tv') exitTv();
    e.preventDefault();
    return;
  }
  if (!overlayEl.hidden && overlayEl.contains(document.activeElement) && NAV_KEYS[e.code]) {
    const list = [...overlayEl.querySelectorAll('button:not([disabled])')].filter((b) => b.offsetParent !== null);
    const i = list.indexOf(document.activeElement);
    if (i >= 0 && list.length) {
      list[(i + NAV_KEYS[e.code] + list.length) % list.length].focus({ preventScroll: true });
      e.preventDefault();
      return;
    }
  }
  if (ACTION_KEYS.has(e.code) && overlayEl.hidden) {
    e.preventDefault();
    if (!e.repeat) input.actionPressed = true;
    return;
  }
  if (e.code === 'KeyM' && !e.repeat) { toggleMusic(); return; }
  if (onButton && (e.code === 'Space' || e.code === 'Enter')) return;
  const action = KEYMAP[e.code];
  if (!action) return;
  e.preventDefault();
  if (!overlayEl.hidden || (game.state !== 'play' && game.state !== 'room' && game.state !== 'tv')) return;
  if (action === 'jump') {
    if (!input.jump && !e.repeat) input.jumpPressed = true;
    input.jump = true;
  } else {
    input[action] = true;
  }
});

window.addEventListener('keyup', (e) => {
  const action = KEYMAP[e.code];
  if (action) input[action] = false;
});

window.addEventListener('blur', () => {
  clearKeys();
  releaseTouch();
});

document.addEventListener('visibilitychange', () => {
  if (!game) return;
  if (document.hidden) {
    if (game.state === 'play') setPaused(true);
    else if (game.state !== 'paused') {
      audio.suspend();
      audioHidden = true;
    }
  } else if (audioHidden) {
    audioHidden = false;
    if (game.state !== 'paused') audio.resume();
  }
  if (game.state === 'tv') {
    last = 0;
    clearKeys();
    releaseTouch();
  }
});

const dpad = document.getElementById('dpad');
const jumpBtn = document.getElementById('touch-jump');
const dpadPointers = new Map();
const [padLeft, padRight] = dpad.querySelectorAll('.touch-btn');

function padDir(clientX) {
  const r = dpad.getBoundingClientRect();
  return clientX < r.left + r.width / 2 ? 'left' : 'right';
}

function syncPad() {
  const dirs = [...dpadPointers.values()];
  input.tLeft = dirs.includes('left');
  input.tRight = dirs.includes('right');
  padLeft.classList.toggle('on', input.tLeft);
  padRight.classList.toggle('on', input.tRight);
}

dpad.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  try { dpad.setPointerCapture(e.pointerId); } catch {  }
  dpadPointers.set(e.pointerId, padDir(e.clientX));
  syncPad();
});
dpad.addEventListener('pointermove', (e) => {
  if (!dpadPointers.has(e.pointerId)) return;
  dpadPointers.set(e.pointerId, padDir(e.clientX));
  syncPad();
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  dpad.addEventListener(type, (e) => {
    dpadPointers.delete(e.pointerId);
    syncPad();
  });
}

jumpBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  try { jumpBtn.setPointerCapture(e.pointerId); } catch {  }
  if (game && (game.state === 'play' || game.state === 'room') && !input.tJump) input.jumpPressed = true;
  input.tJump = true;
  jumpBtn.classList.add('on');
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  jumpBtn.addEventListener(type, () => {
    input.tJump = false;
    jumpBtn.classList.remove('on');
  });
}

function releaseTouch() {
  dpadPointers.clear();
  syncPad();
  input.tJump = false;
  jumpBtn.classList.remove('on');
}

touchAction.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  input.actionPressed = true;
});

for (const node of [dpad, jumpBtn, touchAction]) node.addEventListener('contextmenu', (e) => e.preventDefault());

padLeft.append(iconCanvas(art.ui.left));
padRight.append(iconCanvas(art.ui.right));
jumpBtn.append(iconCanvas(art.ui.up));

function detectTouch() {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (coarse || navigator.maxTouchPoints > 0) document.body.classList.add('touch');
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) document.body.classList.add('mobile');
}

const rotateEl = document.getElementById('rotate');
let rotated = false;

function buildRotateScreen() {
  const c = document.createElement('canvas');
  c.width = 30;
  c.height = 14;
  c.setAttribute('aria-hidden', 'true');
  const g = c.getContext('2d');
  const r = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  r(0, 1, 8, 13, INK);
  r(1, 2, 6, 9, '#bfe1ff');
  r(1, 11, 6, 2, '#fff8fc');
  r(3, 12, 2, 1, INK);
  r(10, 7, 5, 1, '#ff7fb0');
  r(13, 5, 1, 5, '#ff7fb0');
  r(14, 6, 1, 3, '#ff7fb0');
  r(16, 4, 14, 9, INK);
  r(17, 5, 9, 7, '#bfe1ff');
  r(26, 5, 3, 7, '#fff8fc');
  r(27, 8, 1, 1, INK);
  r(19, 7, 1, 1, '#ff9ec8');
  r(21, 7, 1, 1, '#ff9ec8');
  r(20, 6, 1, 1, '#ff9ec8');
  r(20, 8, 1, 1, '#ff9ec8');
  c.style.width = 'calc(var(--ru) * 60)';
  c.style.height = 'calc(var(--ru) * 28)';
  const label = makeLabel('ROTATE YOUR PHONE TO PLAY', { color: '#ffffff', outline: INK, scale: 1 });
  label.style.width = `calc(var(--ru) * ${label.width})`;
  label.style.height = `calc(var(--ru) * ${label.height})`;
  rotateEl.replaceChildren(c, label);
  rotateEl.setAttribute('aria-label', 'Rotate your phone to play');
}

function setRotated(on) {
  if (on === rotated) return;
  rotated = on;
  document.body.classList.toggle('rotate', on);
  rotateEl.hidden = !on;
  if (!game) return;
  if (on) {
    clearKeys();
    releaseTouch();
    if (game.state === 'play') setPaused(true);
    else audio.suspend();
  } else if (game.state !== 'paused') {
    audio.resume();
  }
}


window.addEventListener('touchstart', () => {
  if (!document.body.classList.contains('touch')) {
    document.body.classList.add('touch');
    layout();
  }
}, { passive: true, once: true });

document.addEventListener('touchmove', (e) => {
  if (e.target.closest && !e.target.closest('.panel')) e.preventDefault();
}, { passive: false });

const appEl = document.getElementById('app');
const portraitQuery = window.matchMedia('(orientation: portrait)');

function layout() {
  if (window.scrollX || window.scrollY) window.scrollTo(0, 0);
  const vv = window.visualViewport;
  const mobile = document.body.classList.contains('mobile');
  if (mobile) {
    const vw = vv ? vv.width : window.innerWidth;
    const vh = vv ? vv.height : window.innerHeight;
    const portrait = portraitQuery.matches || vh > vw;
    if (portrait) {
      document.documentElement.style.setProperty('--ru', `${Math.max(1, Math.min(2.4, (vw - 48) / 153)).toFixed(2)}px`);
    }
    setRotated(portrait);
    if (portrait) return;
  }
  const cs = getComputedStyle(appEl);
  const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
  const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
  let availW = appEl.clientWidth - padX;
  let availH = appEl.clientHeight - padY;
  if (vv && Math.abs(vv.scale - 1) < 0.01) {
    availW = Math.min(availW, vv.width - padX);
    availH = Math.min(availH, vv.height - padY);
  }
  availW = Math.max(1, availW);
  availH = Math.max(1, availH);
  if (mobile) {
    document.documentElement.style.setProperty('--tb', `${Math.round(Math.max(44, Math.min(60, availH * 0.15)))}px`);
  }
  const scale = Math.min(availW / VIEW_W, availH / VIEW_H);
  const cssW = Math.floor(VIEW_W * scale);
  const cssH = Math.floor(VIEW_H * scale);
  stageEl.style.width = `${cssW}px`;
  stageEl.style.height = `${cssH}px`;
  document.documentElement.style.setProperty('--u', `${(cssH / VIEW_H).toFixed(3)}px`);
  const dpr = window.devicePixelRatio || 1;
  const nk = Math.max(1, Math.min(8, Math.round((cssH * dpr) / VIEW_H)));
  if (nk !== k || !scaled) {
    k = nk;
    canvas.width = VIEW_W * k;
    canvas.height = VIEW_H * k;
    if (chars) scaled = buildScaledSet(chars, k);
    updatePoster();
  }
}

let layoutPending = false;
function requestLayout() {
  if (layoutPending) return;
  layoutPending = true;
  requestAnimationFrame(() => {
    layoutPending = false;
    layout();
  });
}

function settleLayout() {
  requestLayout();
  setTimeout(requestLayout, 150);
  setTimeout(requestLayout, 500);
}

window.addEventListener('resize', requestLayout);
window.visualViewport?.addEventListener('resize', requestLayout);
window.visualViewport?.addEventListener('scroll', requestLayout);
window.addEventListener('orientationchange', settleLayout);
portraitQuery.addEventListener?.('change', settleLayout);
window.addEventListener('pageshow', settleLayout);
window.addEventListener('focus', settleLayout);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) settleLayout();
});

let last = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
  last = now;
  if (rotated || (document.hidden && game.state === 'tv')) return;
  if (game.state !== 'paused') update(dt);
  render();
}

function loadPoster() {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = 'assets/room/newjeans-poster.png';
  });
}

function updatePoster() {
  if (!posterImg) return;
  const h = POSTER.h;
  const w = h * posterImg.naturalWidth / posterImg.naturalHeight;
  room.setPoster(scaleImage(posterImg, 0, 0, posterImg.naturalWidth, posterImg.naturalHeight, w * k, h * k), w, h);
}

function loadMiniBunny() {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = 'assets/tv-bunny.png';
  });
}

async function boot() {
  loadSave();
  detectTouch();
  buildRotateScreen();
  syncAudioButtons();
  setIcon(btnPause, art.ui.pause);
  layout();
  try {
    [chars, miniBunny] = await Promise.all([loadCharacters(), loadMiniBunny()]);
  } catch {
    const msg = makeLabel('COULD NOT LOAD GAME ART', { color: '#ffffff', outline: INK, scale: 2 });
    overlayEl.replaceChildren(msg);
    overlayEl.hidden = false;
    document.body.classList.add('ready');
    return;
  }
  scaled = buildScaledSet(chars, k);
  loadPoster().then((img) => {
    posterImg = img;
    updatePoster();
  });
  newGame();
  levelCanvas = buildLevelCanvas(L);
  hudButtons.hidden = false;
  showHudPause(false);
  showOverlay('title');
  overlayEl.querySelector('.panel')?.classList.add('instant');
  render();
  document.body.classList.add('ready');
  requestAnimationFrame(frame);
}

boot();
}
