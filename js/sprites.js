const CHAR_PATH = 'assets/characters/';

export const CHARACTER_FILES = ['bunny.png', 'girl-01.png', 'girl-02.png', 'girl-03.png', 'girl-04.png', 'girl-05.png'];
export const GIRL_NAMES = ['Minji', 'Haerin', 'Hanni', 'Danielle', 'Hyein'];

const GIRL_CELL = [9, 9, 7.4, 9.2, 9.2];
const GIRL_PIXEL_EXACT = [true, true, false, false, false];
const GIRL_ART_PX = 1.25;
export const BUNNY_HEIGHT = 48;

const FACE = [
  [0.56, 0.43, 0.62],
  [0.6, 0.42, 0.62],
  [0.6, 0.5, 0.5],
  [0.52, 0.43, 0.56],
  [0.66, 0.52, 0.5],
];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

export async function loadCharacters() {
  const imgs = await Promise.all(CHARACTER_FILES.map((f) => loadImage(CHAR_PATH + f)));
  const [bunny, ...girls] = imgs;
  const bunnyH = BUNNY_HEIGHT;
  const bunnyW = (bunny.naturalWidth / bunny.naturalHeight) * bunnyH;
  return {
    bunny: { img: bunny, w: bunnyW, h: bunnyH },
    girls: girls.map((img, i) => {
      const s = GIRL_ART_PX / GIRL_CELL[i];
      return { img, w: img.naturalWidth * s, h: img.naturalHeight * s, face: FACE[i], exact: GIRL_PIXEL_EXACT[i] };
    }),
  };
}

export function scaleImage(src, sx, sy, sw, sh, outW, outH) {
  outW = Math.max(1, Math.round(outW));
  outH = Math.max(1, Math.round(outH));
  let cur = src;
  let cx = sx;
  let cy = sy;
  let cw = sw;
  let ch = sh;
  while (cw / 2 >= outW && ch / 2 >= outH) {
    const nw = Math.round(cw / 2);
    const nh = Math.round(ch / 2);
    const c = document.createElement('canvas');
    c.width = nw;
    c.height = nh;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(cur, cx, cy, cw, ch, 0, 0, nw, nh);
    cur = c;
    cx = 0;
    cy = 0;
    cw = nw;
    ch = nh;
  }
  const out = document.createElement('canvas');
  out.width = outW;
  out.height = outH;
  const octx = out.getContext('2d');
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(cur, cx, cy, cw, ch, 0, 0, outW, outH);
  return out;
}

export function scaleNearest(src, sx, sy, sw, sh, outW, outH) {
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(outW));
  out.height = Math.max(1, Math.round(outH));
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, out.width, out.height);
  return out;
}

export function buildScaledSet(chars, k) {
  const b = chars.bunny;
  const bunnyL = scaleImage(b.img, 0, 0, b.img.naturalWidth, b.img.naturalHeight, b.w * k, b.h * k);
  const bunnyR = flip(bunnyL);
  const girls = chars.girls.map((g) => {
    const scale = g.exact ? scaleNearest : scaleImage;
    const sprite = scale(g.img, 0, 0, g.img.naturalWidth, g.img.naturalHeight, g.w * k, g.h * k);
    const iw = g.img.naturalWidth;
    const ih = g.img.naturalHeight;
    const side = Math.min(iw, ih, g.face[2] * ih);
    const fx = Math.max(0, Math.min(iw - side, g.face[0] * iw - side / 2));
    const fy = Math.max(0, Math.min(ih - side, g.face[1] * ih - side / 2));
    const face = scale(g.img, fx, fy, side, side, 14 * k, 14 * k);
    return { sprite, face, faceDim: silhouette(face) };
  });
  return { bunnyR, bunnyL, girls };
}

function flip(src) {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const ctx = c.getContext('2d');
  ctx.translate(src.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(src, 0, 0);
  return c;
}

function silhouette(src) {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = 'rgba(122, 112, 190, 0.82)';
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
}
