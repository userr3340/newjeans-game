const STORE_MUSIC = 'njz-game-music';
const STORE_SFX = 'njz-game-sfx';

function readPref(key) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? true : v === '1';
  } catch {
    return true;
  }
}

function writePref(key, on) {
  try {
    localStorage.setItem(key, on ? '1' : '0');
  } catch {
  }
}

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

const MUSIC_LEVEL = 0.62;
const TRACK_VOLUME = 1;

export class GameAudio {
  constructor(trackUrl = '') {
    this.trackUrl = trackUrl;
    this.track = null;
    this.trackFailed = false;
    this.ctx = null;
    this.musicOn = readPref(STORE_MUSIC);
    this.sfxOn = readPref(STORE_SFX);
    this.playing = false;
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const c = this.ctx;
      this.master = c.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(c.destination);
      this.musicGain = c.createGain();
      this.musicGain.gain.value = this.musicOn ? MUSIC_LEVEL : 0;
      this.musicGain.connect(this.master);
      this.sfxGain = c.createGain();
      this.sfxGain.gain.value = this.sfxOn ? 0.55 : 0;
      this.sfxGain.connect(this.master);
      const real = new Float32Array(32);
      const imag25 = new Float32Array(32);
      const imag12 = new Float32Array(32);
      for (let n = 1; n < 32; n++) {
        imag25[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * 0.25);
        imag12[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * 0.125);
      }
      this.pulse25 = c.createPeriodicWave(real, imag25);
      this.pulse12 = c.createPeriodicWave(real, imag12);
      const len = c.sampleRate * 0.5;
      this.noise = c.createBuffer(1, len, c.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      if (this.trackUrl) this.setupTrack();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  setupTrack() {
    const el = new Audio();
    el.loop = true;
    el.preload = 'auto';
    el.addEventListener('error', () => this.markFailed());
    el.src = this.trackUrl;
    try {
      const src = this.ctx.createMediaElementSource(el);
      const g = this.ctx.createGain();
      g.gain.value = TRACK_VOLUME;
      src.connect(g);
      g.connect(this.musicGain);
    } catch {
      el.volume = TRACK_VOLUME;
    }
    this.track = el;
  }

  get usingTrack() {
    return !!this.track && !this.trackFailed;
  }

  markFailed() {
    if (this.trackFailed) return;
    this.trackFailed = true;
    this.playing = false;
    if (this.track) this.track.pause();
  }

  playTrack() {
    const r = this.track.play();
    if (r && r.catch) {
      r.catch((err) => {
        if (err && err.name === 'AbortError') return;
        if (err && err.name === 'NotAllowedError') {
          this.playing = false;
          return;
        }
        this.markFailed();
      });
    }
  }

  setMusic(on) {
    this.musicOn = on;
    writePref(STORE_MUSIC, on);
    if (!this.ctx) return;
    this.musicGain.gain.setTargetAtTime(on ? MUSIC_LEVEL : 0, this.ctx.currentTime, 0.03);
    if (on && this.wantMusic) this.startMusic();
    if (!on) this.stopMusic(true);
  }

  setSfx(on) {
    this.sfxOn = on;
    writePref(STORE_SFX, on);
    if (this.ctx) this.sfxGain.gain.setTargetAtTime(on ? 0.55 : 0, this.ctx.currentTime, 0.02);
  }

  startMusic() {
    this.wantMusic = true;
    if (!this.ctx || !this.musicOn || this.playing || !this.usingTrack) return;
    this.playing = true;
    this.playTrack();
  }

  ensureMusic() {
    this.wantMusic = true;
    if (!this.ctx || !this.musicOn || !this.usingTrack) return;
    if (!this.playing) {
      this.playing = true;
      this.playTrack();
    } else if (this.track.paused) {
      this.playTrack();
    }
  }

  stopMusic(keepWanted = false) {
    if (!keepWanted) this.wantMusic = false;
    this.playing = false;
    if (this.track) this.track.pause();
  }

  restartSong() {
    if (this.track) {
      try { this.track.currentTime = 0; } catch {  }
    }
  }

  suspend() {
    if (this.track) this.track.pause();
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {});
  }

  resume() {
    if (!this.ctx) return;
    if (this.playing && this.usingTrack) this.playTrack();
    this.ctx.resume().catch(() => {});
  }

  tone(dest, wave, freq, t, dur, vol, attack = 0.005, vibrato = false) {
    const c = this.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    if (typeof wave === 'string') o.type = wave;
    else o.setPeriodicWave(wave);
    o.frequency.setValueAtTime(freq, t);
    if (vibrato && dur > 0.3) {
      const lfo = c.createOscillator();
      const lg = c.createGain();
      lfo.frequency.value = 5.5;
      lg.gain.setValueAtTime(0, t);
      lg.gain.linearRampToValueAtTime(freq * 0.008, t + dur);
      lfo.connect(lg);
      lg.connect(o.frequency);
      lfo.start(t);
      lfo.stop(t + dur + 0.05);
    }
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.setTargetAtTime(vol * 0.6, t + attack, dur * 0.4);
    g.gain.setTargetAtTime(0, t + dur, 0.025);
    o.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + dur + 0.15);
  }

  noiseHit(dest, t, dur, vol, type, freq) {
    const c = this.ctx;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    src.start(t, Math.random() * 0.3);
    src.stop(t + dur + 0.02);
  }

  sweep(wave, f0, f1, dur, vol, delay = 0) {
    const c = this.ctx;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    if (typeof wave === 'string') o.type = wave;
    else o.setPeriodicWave(wave);
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.04);
    o.connect(g);
    g.connect(this.sfxGain);
    o.start(t);
    o.stop(t + dur + 0.06);
  }

  notes(list, wave, vol, gap) {
    const t0 = this.ctx.currentTime;
    list.forEach((n, i) => {
      if (n !== null) this.tone(this.sfxGain, wave, midi(n), t0 + i * gap, gap * 0.95, vol, 0.004);
    });
  }

  sfx(name) {
    if (!this.ctx || !this.sfxOn || this.ctx.state !== 'running') return;
    const sq = this.pulse25;
    switch (name) {
      case 'jump': this.sweep(sq, 330, 700, 0.12, 0.16); break;
      case 'djump': this.sweep(sq, 520, 1150, 0.12, 0.14); this.sweep('triangle', 1040, 1600, 0.1, 0.08, 0.05); break;
      case 'cookie': this.notes([83, 88], sq, 0.13, 0.065); break;
      case 'item': this.notes([72, 76, 79, 84, 88], 'triangle', 0.24, 0.06); this.notes([null, 84, 88, 91, 96], this.pulse12, 0.06, 0.06); break;
      case 'power': this.notes([79, 83, 86, 91, 95, 98], this.pulse12, 0.1, 0.045); break;
      case 'reveal': this.notes([96, 91, 88, 84, 88, 91, 96, 100], 'triangle', 0.16, 0.07); break;
      case 'hurt':
        this.sweep(sq, 500, 120, 0.28, 0.18);
        this.noiseHit(this.sfxGain, this.ctx.currentTime, 0.18, 0.18, 'lowpass', 1200);
        break;
      case 'shieldhit': this.sweep('triangle', 900, 1500, 0.1, 0.16); break;
      case 'stomp':
        this.sweep('triangle', 320, 70, 0.14, 0.3);
        this.noiseHit(this.sfxGain, this.ctx.currentTime, 0.08, 0.14, 'lowpass', 900);
        break;
      case 'fall': this.sweep(sq, 700, 140, 0.45, 0.14); break;
      case 'expire': this.notes([79, 74], 'triangle', 0.14, 0.08); break;
      case 'glide': this.noiseHit(this.sfxGain, this.ctx.currentTime, 0.3, 0.07, 'bandpass', 700); break;
      case 'click': this.sweep('triangle', 880, 1320, 0.05, 0.12); break;
      case 'victory': {
        this.notes([72, 76, 79, 84, null, 79, 84, 84, 84], sq, 0.14, 0.11);
        this.notes([60, 64, 67, 72, null, 67, 72, 76, 76], 'triangle', 0.22, 0.11);
        this.notes([null, null, null, null, null, null, null, 88, 91, 96], this.pulse12, 0.08, 0.11);
        break;
      }
      default: break;
    }
  }
}
