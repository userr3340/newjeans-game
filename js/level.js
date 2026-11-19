export const TILE = 16;
export const ROWS = 23;
export const COLS = 480;
export const GROUND = 20;

export const T_EMPTY = 0;
export const T_SOLID = 1;
export const T_ONEWAY = 2;
export const T_HIDDEN = 3;

export function buildLevel() {
  const grid = new Uint8Array(COLS * ROWS);
  const L = {
    cols: COLS,
    rows: ROWS,
    width: COLS * TILE,
    height: ROWS * TILE,
    grid,
    grounds: [],
    blocks: [],
    buildings: [],
    clouds: [],
    spikes: [],
    hidden: [],
    cookies: [],
    critters: [],
    girls: [],
    decor: [],
    spawn: { x: 9 * TILE, y: GROUND * TILE },
    finishX: 0,
    stageX: 0,
  };

  let ox = 0;
  const set = (x, y, t) => {
    if (x >= 0 && x < COLS && y >= 0 && y < ROWS) grid[y * COLS + x] = t;
  };
  const fill = (x0, x1, y0, y1, t) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, t);
  };

  const ground = (x0, x1, top = GROUND) => {
    x0 += ox;
    x1 += ox;
    L.grounds.push({ x0, x1, top });
    fill(x0, x1, top, ROWS - 1, T_SOLID);
  };
  const block = (x0, x1, y0, y1) => {
    x0 += ox;
    x1 += ox;
    L.blocks.push({ x0, x1, y0, y1 });
    fill(x0, x1, y0, y1, T_SOLID);
  };
  const building = (x0, x1, y0, y1 = ROWS - 1, style = 0, arcade = null) => {
    x0 += ox;
    x1 += ox;
    L.buildings.push({ x0, x1, y0, y1, style, arcade });
    fill(x0, x1, y0, y1, T_SOLID);
  };
  const cloud = (x0, x1, row) => {
    x0 += ox;
    x1 += ox;
    L.clouds.push({ x0, x1, row });
    fill(x0, x1, row, row, T_ONEWAY);
  };
  const spikes = (x0, x1, row = GROUND - 1) => {
    x0 += ox;
    x1 += ox;
    L.spikes.push({ x0, x1, row });
  };
  const hidden = (x0, x1, row) => {
    x0 += ox;
    x1 += ox;
    for (let x = x0; x <= x1; x++) {
      L.hidden.push({ x, y: row, revealAt: Infinity });
      set(x, row, T_HIDDEN);
    }
  };
  const cookie = (tx, ty) => {
    tx += ox;
    L.cookies.push({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2, taken: false, phase: (tx * 0.7 + ty) % 6.28 });
  };
  const crow = (x0, x1, row, step = 1) => {
    for (let x = x0; x <= x1; x += step) cookie(x, row);
  };
  const carc = (x0, x1, rowBase, height) => {
    const n = x1 - x0;
    for (let i = 0; i <= n; i++) {
      const t = n === 0 ? 0.5 : i / n;
      cookie(x0 + i, rowBase - Math.round(Math.sin(t * Math.PI) * height));
    }
  };
  const critter = (x0, x1, row = GROUND) => {
    x0 += ox;
    x1 += ox;
    L.critters.push({
      x: ((x0 + x1) / 2) * TILE, y: row * TILE, minX: x0 * TILE + 8, maxX: (x1 + 1) * TILE - 8,
      dir: -1, alive: true, squash: 0, t: Math.random() * 2,
    });
  };
  const girl = (index, tx, row = GROUND) => {
    tx += ox;
    L.girls.push({ index, x: tx * TILE + TILE / 2, y: row * TILE, met: false, latch: false, glow: 0 });
  };
  const deco = (type, tx, row = GROUND, extra = {}) => L.decor.push({ type, x: tx + ox, row, ...extra });

  ground(0, 44);
  deco('house', 1);
  deco('tree', 7);
  deco('lamp', 15);
  deco('sign', 11, GROUND, { arrow: 1 });
  crow(12, 16, 18);
  block(19, 19, 19, 19);
  cookie(19, 17);
  block(24, 25, 18, 19);
  crow(24, 25, 16);
  cloud(30, 34, 16);
  crow(31, 33, 15);
  deco('bench', 28);
  critter(36, 43);
  deco('lamp', 42);

  carc(45, 48, 17, 1);
  ground(49, 60);
  block(52, 55, 16, 16);
  crow(52, 55, 15);
  spikes(57, 58);
  deco('vending', 50);
  cloud(62, 64, 17);
  crow(62, 64, 16);
  ground(66, 84);
  deco('tree', 68);
  critter(67, 74);
  block(76, 77, 18, 19);
  block(78, 79, 16, 19);
  crow(76, 77, 17);
  cloud(81, 84, 14);
  crow(81, 84, 13);

  ground(85, 92);
  deco('bench', 88);
  carc(93, 95, 17, 1);
  ground(96, 124);
  block(100, 101, 18, 19);
  block(102, 103, 16, 19);
  block(104, 105, 18, 19);
  crow(102, 103, 15);
  cloud(108, 111, 16);
  cloud(112, 115, 13);
  cloud(116, 119, 10);
  crow(108, 111, 15);
  crow(116, 119, 9);
  critter(106, 115);
  deco('tree', 113);
  spikes(121, 122);

  ox = 40;
  ground(85, 112);
  girl(0, 87);
  deco('lamp', 84);
  deco('booth', 90);
  crow(94, 110, 18, 2);
  deco('lamp', 100);
  deco('sign', 108, GROUND, { arrow: 2 });
  carc(113, 119, 15, 2);
  ground(120, 165);
  critter(123, 130);
  cloud(134, 138, 16);
  crow(135, 137, 15);
  critter(132, 140);
  spikes(142, 143);
  deco('tree', 145);
  spikes(147, 147);
  block(149, 150, 18, 19);
  crow(149, 150, 17);

  girl(1, 156);
  deco('lamp', 160);
  building(166, 171, 15, ROWS - 1, 0);
  crow(167, 170, 14);
  building(172, 181, 10, ROWS - 1, 1);
  crow(173, 180, 9);
  ground(182, 185);
  cloud(182, 185, 15);
  crow(182, 185, 14);
  building(186, 195, 11, ROWS - 1, 2);
  block(190, 191, 9, 10);
  crow(190, 191, 7);
  crow(187, 188, 10);
  crow(193, 194, 10);
  ground(196, 199);
  cloud(196, 199, 15);
  building(200, 213, 10, ROWS - 1, 3);
  deco('antenna', 202, 10);

  girl(2, 209, 10);
  for (let i = 0; i < 9; i++) cookie(215 + i * 2, 9 + Math.round(i * 0.95));
  ground(234, 288);

  girl(3, 240);
  deco('lamp', 237);
  building(247, 267, 3, 16, 4, { row: 17 });
  spikes(251, 260);
  crow(251, 260, 18, 3);
  deco('tree', 270);
  cloud(272, 275, 16);
  cloud(278, 281, 13);
  crow(278, 281, 12);
  critter(274, 283);
  deco('bench', 284);
  carc(289, 293, 17, 1);
  cloud(290, 292, 16);
  ground(294, 330);
  spikes(297, 298);
  critter(300, 307);
  block(302, 306, 16, 16);
  crow(302, 306, 15);
  block(311, 312, 18, 19);
  block(313, 316, 16, 19);
  crow(313, 316, 15);
  spikes(318, 319);
  critter(321, 329);
  deco('vending', 326);

  ox = 371;
  ground(0, 6);
  deco('tree', 3);
  cloud(7, 10, 17);
  crow(7, 10, 16);
  ground(11, 35);
  deco('lamp', 12);
  block(13, 14, 18, 19);
  block(15, 18, 16, 19);
  block(19, 20, 18, 19);
  crow(15, 18, 15);
  critter(22, 29);
  block(24, 28, 15, 15);
  crow(24, 28, 14);
  spikes(31, 32);
  deco('bench', 33);

  ox = 76;
  ground(331, 336);
  girl(4, 332);
  deco('lamp', 335);
  L.secret = { bridgeX: (337 + ox) * TILE, bridgeEnd: (359 + ox) * TILE, stepX: (342 + ox) * TILE, stepRow: 17, topRow: 11 };
  hidden(337, 358, GROUND);
  crow(339, 356, 18, 3);
  hidden(342, 343, 17);
  hidden(346, 347, 14);
  hidden(350, 354, 11);
  crow(350, 354, 10);

  ground(359, 403);
  crow(361, 371, 18, 2);
  deco('balloons', 364);
  deco('arch', 375);
  deco('stage', 379);
  deco('balloons', 398);
  building(400, 403, 6, ROWS - 1, 5);
  L.secret.doorX = (352 + ox) * TILE + TILE / 2;
  L.secret.doorY = 11 * TILE;
  L.rare = [[83, 11], [117, 7], [230.5, 5], [296, 18], [397, 11]].map(([tx, ty], i) => ({
    i, x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2, taken: false, phase: i,
  }));
  L.finishX = (376 + ox) * TILE;
  L.stageX = (388 + ox) * TILE;
  L.duskStart = (338 + ox) * TILE;
  L.duskEnd = (372 + ox) * TILE;

  return L;
}

export function tileAt(L, tx, ty) {
  if (tx < 0 || tx >= L.cols) return T_SOLID;
  if (ty < 0 || ty >= L.rows) return T_EMPTY;
  return L.grid[ty * L.cols + tx];
}
