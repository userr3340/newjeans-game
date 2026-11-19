import { PHOTOCARDS } from './photocards-data.js';
import { getSave, uniqueCardCount } from './save.js';
import { makeLabel } from './font.js';

const INK = '#22336e';
export const MEMBERS = [
  { id: 'minji', name: 'MINJI' },
  { id: 'hanni', name: 'HANNI' },
  { id: 'danielle', name: 'DANIELLE' },
  { id: 'haerin', name: 'HAERIN' },
  { id: 'hyein', name: 'HYEIN' },
];

function pixCanvas(w, h, draw, cls) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.className = cls;
  c.setAttribute('aria-hidden', 'true');
  draw(c.getContext('2d'));
  return c;
}

function px(g, x, y, w, h, c) {
  g.fillStyle = c;
  g.fillRect(x, y, w, h);
}

function drawHeart(g, x, y, c) {
  ['.o.o.', 'ooooo', 'ooooo', '.ooo.', '..o..'].forEach((row, yy) => {
    for (let xx = 0; xx < 5; xx++) if (row[xx] === 'o') px(g, x + xx, y + yy, 1, 1, c);
  });
}

export function cardBack(cls = 'pc-back-art') {
  return pixCanvas(32, 50, (g) => {
    px(g, 0, 0, 32, 50, INK);
    px(g, 1, 1, 30, 48, '#c9b8ff');
    for (let y = 1; y < 49; y += 4) for (let x = 1 + ((y - 1) / 4) % 2 * 2; x < 31; x += 4) px(g, x, y, 2, 2, '#d8cbff');
    px(g, 3, 3, 26, 44, 'rgba(255,255,255,0.15)');
    px(g, 9, 15, 3, 9, INK);
    px(g, 20, 15, 3, 9, INK);
    px(g, 10, 16, 1, 7, '#ffb3d6');
    px(g, 21, 16, 1, 7, '#ffb3d6');
    px(g, 8, 23, 16, 12, INK);
    px(g, 9, 24, 14, 10, '#ffffff');
    px(g, 12, 27, 1, 2, INK);
    px(g, 19, 27, 1, 2, INK);
    px(g, 15, 30, 2, 1, '#ff9ec8');
    drawHeart(g, 4, 41, '#ff9ec8');
    drawHeart(g, 23, 5, '#fff38a');
  }, cls);
}

function packArt() {
  return pixCanvas(40, 60, (g) => {
    px(g, 0, 4, 40, 52, INK);
    px(g, 1, 5, 38, 50, '#ffb3d6');
    for (let x = 1; x < 39; x += 3) {
      px(g, x, 2, 2, 3, INK);
      px(g, x, 55, 2, 3, INK);
      px(g, x, 3, 2, 2, '#ff9ec8');
      px(g, x, 55, 2, 2, '#ff9ec8');
    }
    for (let i = 0; i < 6; i++) px(g, 2 + i * 6, 10, 3, 40, 'rgba(255,255,255,0.22)');
    px(g, 6, 18, 28, 24, INK);
    px(g, 7, 19, 26, 22, '#c9b8ff');
    px(g, 13, 21, 3, 8, INK);
    px(g, 24, 21, 3, 8, INK);
    px(g, 12, 28, 16, 11, INK);
    px(g, 13, 29, 14, 9, '#ffffff');
    px(g, 16, 32, 1, 2, INK);
    px(g, 23, 32, 1, 2, INK);
    drawHeart(g, 4, 8, '#fff38a');
    drawHeart(g, 31, 45, '#ffffff');
  }, 'pc-pack-art');
}

function el(tag, cls, ...children) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  e.append(...children);
  return e;
}

function memberName(id) {
  return MEMBERS.find((m) => m.id === id)?.name ?? id.toUpperCase();
}

function handleCardImage(img, card, retryable = true) {
  let fallback = null;
  img.addEventListener('error', () => {
    if (fallback) return;
    if (retryable) {
      fallback = el('button', 'pc-image-retry', cardBack());
      fallback.type = 'button';
      fallback.title = 'Retry loading photocard';
      fallback.setAttribute('aria-label', `Retry loading ${card.name} photocard`);
      fallback.append(el('span', 'pc-retry-label', 'Retry'));
      fallback.addEventListener('click', () => {
        img.removeAttribute('src');
        img.src = card.src;
      });
    } else {
      fallback = cardBack();
    }
    img.replaceWith(fallback);
  });
  img.addEventListener('load', () => {
    if (!fallback) return;
    const focused = document.activeElement === fallback;
    fallback.replaceWith(img);
    fallback = null;
    if (focused) img.closest('.panel')?.querySelector('button')?.focus({ preventScroll: true });
  });
}

export function buildReveal({ card, result, reduced, pixButton, playSfx, onCollection, onPlayAgain, extraRow, onComplete }) {
  const panel = el('div', 'panel pc-reveal');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Photocard reward');
  const title = makeLabel('WHO DID YOU GET?', { color: INK, scale: 1.6 });
  const stage = el('div', 'pc-stage');
  const pack = el('div', 'pc-pack', packArt());
  const flip = el('div', 'pc-flip');
  const img = document.createElement('img');
  handleCardImage(img, card);
  img.src = card.src;
  img.alt = `${card.name} photocard`;
  img.decoding = 'async';
  const front = el('div', 'pc-face pc-front', img);
  const back = el('div', 'pc-face pc-back', cardBack());
  flip.append(back, front);
  flip.hidden = true;
  stage.append(pack, flip);
  const info = el('div', 'row pc-info');
  info.hidden = true;
  info.append(makeLabel(memberName(card.member), { color: INK, scale: 2 }));
  const badge = makeLabel(result.isNew ? 'NEW!' : `DUPLICATE x${result.count}`, { color: '#ffffff', scale: 1.2 });
  info.append(el('span', `pc-badge ${result.isNew ? 'new' : 'dup'}`, badge));
  const done = el('div', 'pc-complete');
  done.hidden = true;
  if (result.completedNow) {
    done.append(makeLabel('COLLECTION COMPLETE!', { color: '#ff4f9a', scale: 1.4 }));
  }
  const buttons = el('div', 'row');
  const live = (t) => { panel.setAttribute('aria-description', t); };

  const showButtons = (...bs) => {
    buttons.replaceChildren(...bs);
    bs[0]?.focus({ preventScroll: true });
  };

  const reveal = () => {
    playSfx('reveal');
    flip.classList.add('flipped');
    const finish = () => {
      info.hidden = false;
      done.hidden = !result.completedNow;
      live(`${memberName(card.member)} photocard, ${result.isNew ? 'new' : 'duplicate'}`);
      if (result.completedNow) onComplete?.();
      showButtons(pixButton('COLLECTION', null, onCollection), pixButton('PLAY AGAIN', null, onPlayAgain));
      if (extraRow) panel.append(extraRow);
    };
    if (reduced) finish();
    else setTimeout(finish, 650);
  };

  const open = () => {
    playSfx('item');
    pack.classList.add('opened');
    const showBack = () => {
      pack.hidden = true;
      flip.hidden = false;
      showButtons(pixButton('REVEAL', null, reveal));
    };
    if (reduced) showBack();
    else setTimeout(showBack, 420);
  };

  panel.append(title, stage, info, done, buttons);
  showButtons(pixButton('OPEN', null, open));
  return panel;
}

export function buildGallery({ pixButton, onClose, startMember = 'minji' }) {
  const save = getSave();
  const panel = el('div', 'panel pc-gallery');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Photocard collection');
  const head = el('div', 'row pc-head');
  head.append(
    makeLabel('PHOTOCARDS', { color: INK, scale: 2 }),
    makeLabel(`${uniqueCardCount()} / ${PHOTOCARDS.length}`, { color: '#ff4f9a', scale: 1.6 }),
  );
  const close = pixButton('CLOSE', null, onClose);
  head.append(close);
  const tabs = el('div', 'row pc-tabs');
  tabs.setAttribute('role', 'tablist');
  const grid = el('div', 'pc-grid');
  const viewer = el('div', 'pc-viewer');
  viewer.hidden = true;

  const showMember = (id) => {
    for (const t of tabs.children) t.setAttribute('aria-selected', String(t.dataset.member === id));
    grid.replaceChildren();
    for (const card of PHOTOCARDS.filter((c) => c.member === id)) {
      const count = save.cards[card.id] || 0;
      if (count > 0) {
        const b = el('button', 'pc-tile');
        b.type = 'button';
        b.setAttribute('aria-label', `${card.name} card ${card.id.slice(-2)}${count > 1 ? `, ${count} copies` : ''}`);
        const img = document.createElement('img');
        handleCardImage(img, card, false);
        img.src = card.src;
        img.alt = '';
        img.loading = 'lazy';
        b.append(img);
        if (count > 1) b.append(el('span', 'pc-count', makeLabel(`x${count}`, { color: '#ffffff', scale: 1 })));
        b.addEventListener('click', () => inspect(card, count));
        grid.append(b);
      } else {
        const m = el('div', 'pc-tile missing', cardBack());
        m.setAttribute('role', 'img');
        m.setAttribute('aria-label', 'Missing card');
        grid.append(m);
      }
    }
  };

  const inspect = (card, count) => {
    const img = document.createElement('img');
    handleCardImage(img, card);
    img.src = card.src;
    img.alt = `${card.name} photocard`;
    const back = pixButton('BACK', null, () => {
      viewer.hidden = true;
      grid.hidden = false;
      tabs.hidden = false;
    });
    viewer.replaceChildren(img, el('div', 'row', makeLabel(memberName(card.member), { color: INK, scale: 1.6 }), makeLabel(`x${count}`, { color: '#ff4f9a', scale: 1.4 }), back));
    grid.hidden = true;
    tabs.hidden = true;
    viewer.hidden = false;
    back.focus({ preventScroll: true });
  };

  for (const m of MEMBERS) {
    const owned = PHOTOCARDS.filter((c) => c.member === m.id && save.cards[c.id]).length;
    const total = PHOTOCARDS.filter((c) => c.member === m.id).length;
    const t = pixButton(`${m.name} ${owned}/${total}`, null, () => showMember(m.id));
    t.dataset.member = m.id;
    t.setAttribute('role', 'tab');
    t.classList.add('pc-tab');
    tabs.append(t);
  }
  panel.append(head, tabs, grid, viewer);
  showMember(startMember);
  return { panel, focus: () => close.focus({ preventScroll: true }) };
}
