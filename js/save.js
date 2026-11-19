import { PHOTOCARDS } from './photocards-data.js';

const KEY = 'njz-game-save-v1';

export const RARE_COUNT = 5;

const CARD_IDS = new Set(PHOTOCARDS.map((c) => c.id));

function fresh() {
  return { cards: {}, rare: [], tvDone: false, collectionDone: false };
}

function sanitize(raw) {
  const s = fresh();
  if (!raw || typeof raw !== 'object') return s;
  if (raw.cards && typeof raw.cards === 'object') {
    for (const [id, n] of Object.entries(raw.cards)) {
      if (CARD_IDS.has(id) && Number.isInteger(n) && n > 0) s.cards[id] = Math.min(n, 9999);
    }
  }
  if (Array.isArray(raw.rare)) {
    s.rare = [...new Set(raw.rare.filter((i) => Number.isInteger(i) && i >= 0 && i < RARE_COUNT))];
  }
  s.tvDone = raw.tvDone === true;
  return s;
}

let state = fresh();

export function loadSave() {
  try {
    const txt = localStorage.getItem(KEY);
    state = sanitize(txt ? JSON.parse(txt) : null);
  } catch {
    state = fresh();
  }
  updateCompletion();
  return state;
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('njz-save-status', { detail: { saved: true } }));
  } catch {
    window.dispatchEvent(new CustomEvent('njz-save-status', { detail: { saved: false } }));
  }
}

export function getSave() {
  return state;
}

export function uniqueCardCount() {
  return Object.keys(state.cards).length;
}

function updateCompletion() {
  const before = state.collectionDone;
  state.collectionDone = uniqueCardCount() >= PHOTOCARDS.length;
  return !before && state.collectionDone;
}

export function addRare(i) {
  if (state.rare.includes(i)) return;
  state.rare.push(i);
  persist();
}

export function markTvDone() {
  const first = !state.tvDone;
  state.tvDone = true;
  persist();
  return { first };
}

function randomIndex(n) {
  const limit = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % n;
}

export function pickRewardCard() {
  const missing = PHOTOCARDS.filter((c) => !state.cards[c.id]);
  const pool = missing.length ? missing : PHOTOCARDS;
  return pool[randomIndex(pool.length)];
}

export function awardCard(card) {
  const isNew = !state.cards[card.id];
  state.cards[card.id] = (state.cards[card.id] || 0) + 1;
  const completedNow = updateCompletion();
  persist();
  return { isNew, count: state.cards[card.id], completedNow };
}
