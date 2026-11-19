export function makeSprite(rows, palette) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const col = palette[row[x]];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

const COOKIE = [
  '....oooo....',
  '..oohhhboo..',
  '.ohhbbbbbbo.',
  '.ohcbbbbcbo.',
  'ohbbbbbbbbso',
  'obbbcbbbbbso',
  'obbbbbbcbbso',
  'obcbbbbbbbso',
  '.obbbbcbbso.',
  '.osbbbbbsso.',
  '..oossssoo..',
  '....oooo....',
];

const CRITTER_BODY = [
  '.....oooooo.....',
  '...ooLLLLLLoo...',
  '..oLLwwwwwwwwo..',
  '.oLwwwwwwwwwwwo.',
  '.oLwwwwwwwwwwso.',
  'oLwwKwwwwwwKwwso',
  'owwwwKwwwwKwwwso',
  'owwwweewweewwwso',
  'owwwweewweewwsso',
  'owppwwwwwwwwppso',
  '.owwwwwKKwwwwso.',
  '..osswwwwwwsso..',
  '...oooooooooo...',
];

const HEART = [
  '.ooo.ooo.',
  'ohhpopppo',
  'ohppppppo',
  'opppppppo',
  '.opppppo.',
  '..opppo..',
  '...opo...',
  '....o....',
];

const ICON_SPEED = [
  '......oooo..',
  '.....oyyyo..',
  '....oywyo...',
  '...oywyo....',
  '..oyyyoooo..',
  '.oyyyyyyyo..',
  '.oooooyyo...',
  '....oyyo....',
  '...oyyo.....',
  '..oyyo......',
  '..oyo.......',
  '..oo........',
];

const ICON_DOUBLE = [
  '.....oo.....',
  '....ohho....',
  '...oggggo...',
  '..oggooggo..',
  '.oggo..oggo.',
  '.ooo....ooo.',
  '.....oo.....',
  '....ohho....',
  '...oggggo...',
  '..oggooggo..',
  '.oggo..oggo.',
  '.ooo....ooo.',
];

const ICON_GLIDE = [
  '..oo....oo..',
  '.owwo..owwo.',
  '.owpo..opwo.',
  '.owpo..opwo.',
  '.owpo..opwo.',
  '.owpo..opwo.',
  '.owwo..owwo.',
  '..owwoowwo..',
  '..owwwwwwo..',
  '.owwwwwwwwo.',
  '.owewwwwewo.',
  '..oooooooo..',
];

const ICON_SHIELD = [
  '...oooooo...',
  '..obbbbbbo..',
  '.obwwbbbbbo.',
  'obwwbbbbbbbo',
  'obwbbbbbbbbo',
  'obbbppbppbbo',
  'obbbpppppbbo',
  'obbbbpppbbbo',
  'obbbbbpbbbbo',
  '.obbbbbbbbo.',
  '..obbbbbbo..',
  '...oooooo...',
];

const ICON_REVEAL = [
  '.....oo.....',
  '....oyyo....',
  '....oyyo....',
  'oooooyyooooo',
  'oyyyyyyyyyyo',
  '.oyyywwyyyo.',
  '..oyyyyyyo..',
  '..oyyyyyyo..',
  '.oyyyooyyyo.',
  '.oyyo..oyyo.',
  'oyyo....oyyo',
  'ooo......ooo',
];

const UI_MUSIC = [
  '...oooooo',
  '...oooooo',
  '...o....o',
  '...o....o',
  '...o....o',
  '.ooo..ooo',
  'oooo.oooo',
  'oooo.oooo',
  '.oo...oo.',
];

const UI_SPEAKER = [
  '....o....',
  '...oo..o.',
  'oooooo..o',
  'oooooo..o',
  'oooooo..o',
  'oooooo..o',
  'oooooo..o',
  '...oo..o.',
  '....o....',
];

const UI_PAUSE = [
  '.........',
  '.ooo.ooo.',
  '.ooo.ooo.',
  '.ooo.ooo.',
  '.ooo.ooo.',
  '.ooo.ooo.',
  '.ooo.ooo.',
  '.ooo.ooo.',
  '.........',
];

const UI_PLAY = [
  '.oo......',
  '.oooo....',
  '.oooooo..',
  '.ooooooo.',
  '.oooooooo',
  '.ooooooo.',
  '.oooooo..',
  '.oooo....',
  '.oo......',
];

const UI_LEFT = [
  '....oo...',
  '...ooo...',
  '..oooo...',
  '.oooooooo',
  'ooooooooo',
  '.oooooooo',
  '..oooo...',
  '...ooo...',
  '....oo...',
];

const UI_UP = [
  '....o....',
  '...ooo...',
  '..ooooo..',
  '.ooooooo.',
  'ooooooooo',
  '..ooooo..',
  '..ooooo..',
  '..ooooo..',
  '..ooooo..',
];

const INK = '#22336e';

export function buildPixelArt() {
  const cookiePal = { o: '#6b3a1e', b: '#e7a659', h: '#f8d596', c: '#4a2412', s: '#c9803c' };
  const critterPal = { o: '#3a3470', L: '#efeaff', w: '#cdc5f3', s: '#a39ad8', K: '#3a3470', e: '#1c1840', p: '#ff9ec8', f: '#3a3470' };
  const critterA = makeSprite([...CRITTER_BODY, '...ff.....ff....'], critterPal);
  const critterB = makeSprite([...CRITTER_BODY, '....ff...ff.....'], critterPal);
  return {
    cookie: makeSprite(COOKIE, cookiePal),
    critter: [critterA, critterB],
    heart: makeSprite(HEART, { o: '#5a1a3e', h: '#ffd0e4', p: '#ff6fa8' }),
    heartEmpty: makeSprite(HEART, { o: '#5a4a86', h: '#d6d0ee', p: '#b9b2dc' }),
    icons: [
      makeSprite(ICON_SPEED, { o: '#7a4300', y: '#ffd84d', w: '#fffbe0' }),
      makeSprite(ICON_DOUBLE, { o: '#1f5a4a', g: '#7fe0b8', h: '#d8fff0' }),
      makeSprite(ICON_GLIDE, { o: INK, w: '#ffffff', p: '#ffb3d1', e: INK }),
      makeSprite(ICON_SHIELD, { o: '#2a6f9e', b: '#a6ecff', w: '#ffffff', p: '#ff7fb0' }),
      makeSprite(ICON_REVEAL, { o: '#8a3b6a', y: '#ffe27a', w: '#ffffff' }),
    ],
    ui: {
      music: makeSprite(UI_MUSIC, { o: INK }),
      speaker: makeSprite(UI_SPEAKER, { o: INK }),
      pause: makeSprite(UI_PAUSE, { o: INK }),
      play: makeSprite(UI_PLAY, { o: INK }),
      left: makeSprite(UI_LEFT, { o: INK }),
      right: mirror(makeSprite(UI_LEFT, { o: INK })),
      up: makeSprite(UI_UP, { o: INK }),
    },
    guideUp: makeSprite(UI_UP, { o: '#ff6fa8' }),
    guideRight: mirror(makeSprite(UI_LEFT, { o: '#ff6fa8' })),
  };
}

export function mirror(src) {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const ctx = c.getContext('2d');
  ctx.translate(src.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(src, 0, 0);
  return c;
}

export function iconCanvas(src, crossed = false) {
  const pad = 1;
  const c = document.createElement('canvas');
  c.width = src.width + pad * 2;
  c.height = src.height + pad * 2;
  const ctx = c.getContext('2d');
  ctx.drawImage(src, pad, pad);
  if (crossed) {
    ctx.fillStyle = '#ff5f9e';
    for (let i = 0; i < c.width; i++) {
      ctx.fillRect(i, c.height - 1 - i, 1, 1);
      ctx.fillRect(i, c.height - 2 - i, 1, 1);
    }
  }
  c.setAttribute('aria-hidden', 'true');
  return c;
}

export function circleSprite(r, fill, edge, shine) {
  const d = r * 2 + 1;
  const c = document.createElement('canvas');
  c.width = d;
  c.height = d;
  const ctx = c.getContext('2d');
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const dist = Math.sqrt(x * x + y * y);
      if (dist > r + 0.3) continue;
      if (dist > r - 1) ctx.fillStyle = edge;
      else if (x < -r * 0.3 && y < -r * 0.3 && dist > r - 3.2 && dist < r - 1.8) ctx.fillStyle = shine;
      else ctx.fillStyle = fill;
      ctx.fillRect(x + r, y + r, 1, 1);
    }
  }
  return c;
}

const RARE_HEART = [
  '.ooo.ooo.',
  'ohhpopppo',
  'ohpcpppco',
  'opppppppo',
  '.opcpppo.',
  '..opppo..',
  '...opo...',
  '....o....',
];

const RARE_CLOUD = [
  '...oooo.....',
  '..ohhhho.oo.',
  '.ohhbbbbohho',
  'oohbcbbbbbbo',
  'ohbbbbbcbbbo',
  'obbcbbbbbbbo',
  '.obbbbbcbbo.',
  '..oooooooo..',
];

const RARE_STAR = [
  '.....oo.....',
  '....oyyo....',
  '....oyyo....',
  'oooooyyooooo',
  'oyyhyyyycyyo',
  '.oyyyyyyyyo.',
  '..oyycyyyo..',
  '..oyyyyyyo..',
  '.oyyyooyyyo.',
  '.oyyo..oyyo.',
  'oyyo....oyyo',
  'ooo......ooo',
];

const RARE_BUNNY = [
  '..oo..oo..',
  '.ogo..ogo.',
  '.oggoogggo',
  'oggggggggo',
  'oggcggcggo',
  'oggpggpggo',
  '.ogggcggo.',
  '..oooooo..',
];

const RARE_MACARON = [
  '...oooooo...',
  '.oohhvvvvoo.',
  'ohhvvsvvvvvo',
  'ovvvvvvvsvvo',
  'ommmmmmmmmmo',
  'ovvvsvvvvvvo',
  '.oovvvvvvoo.',
  '...oooooo...',
];

const MINI_HEART = ['.p.p.', 'ppppp', '.ppp.', '..p..'];

export function buildRareArt() {
  return {
    cookies: [
      makeSprite(RARE_HEART, { o: '#7a2450', h: '#ffe0ee', p: '#ff8fbf', c: '#a8326a' }),
      makeSprite(RARE_CLOUD, { o: '#2f4f9e', h: '#e8f3ff', b: '#9fd0ff', c: '#3f63c4' }),
      makeSprite(RARE_STAR, { o: '#8a5a00', y: '#ffe066', h: '#fffbe0', c: '#c98a00' }),
      makeSprite(RARE_BUNNY, { o: '#1f5a3a', g: '#9fe3b8', c: '#2f6b47', p: '#ff9ec8' }),
      makeSprite(RARE_MACARON, { o: '#4a2f86', h: '#efe6ff', v: '#b9a0ff', s: '#ffffff', m: '#fff6e0' }),
    ],
    colors: ['#ff8fbf', '#9fd0ff', '#ffe066', '#9fe3b8', '#b9a0ff'],
    miniHearts: ['#ff8fbf', '#ffb3d6', '#ffffff'].map((c) => makeSprite(MINI_HEART, { p: c })),
  };
}
