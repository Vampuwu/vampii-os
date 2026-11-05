
(function () {
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const expo = (a, b, t) => a * Math.pow(b / a, t);
    const idx = (v, n) => Math.min(n - 1, Math.floor(v * n));
    const db2g = d => Math.pow(10, d / 20);
    const SYNC = [['off', 0], ['4 bars', 16], ['2 bars', 8], ['1 bar', 4], ['1/2', 2], ['1/4', 1], ['1/8', 0.5], ['1/16', 0.25]];
    const DTIME = [['1/32', 0.125], ['1/16', 0.25], ['1/8', 0.5], ['1/4', 1], ['1/2', 2], ['1 bar', 4]];
    const LENS = [['1/16', 0.25], ['1/8', 0.5], ['1/4', 1], ['1/2', 2], ['1 bar', 4], ['2 bars', 8], ['4 bars', 16]];
    const PHS = [['free', 0], ['4 bars', 16], ['2 bars', 8], ['1 bar', 4], ['1/2', 2], ['1/4', 1], ['1/8', 0.5]];
    const SHAPES = {
        'PUMP': () => Array.from({ length: 16 }, (z, i) => i === 0 ? 0 : Math.round((1 - Math.exp(-i / 3)) / (1 - Math.exp(-15 / 3)) * 100) / 100),
        'RAMP UP': () => Array.from({ length: 16 }, (z, i) => Math.round(i / 15 * 100) / 100), 'RAMP DOWN': () => Array.from({ length: 16 }, (z, i) => Math.round((1 - i / 15) * 100) / 100),
        'SINE': () => Array.from({ length: 16 }, (z, i) => Math.round((0.5 - 0.5 * Math.cos(2 * Math.PI * i / 16)) * 100) / 100), 'SQUARE': () => Array.from({ length: 16 }, (z, i) => i < 8 ? 1 : 0),
        'ENTRANCED': () => [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1], 'OFFBEAT': () => Array.from({ length: 16 }, (z, i) => i % 4 >= 2 ? 1 : 0), 'STAIRS': () => Array.from({ length: 16 }, (z, i) => Math.floor(i / 4) / 3),
        'RANDOM': () => Array.from({ length: 16 }, () => Math.round(Math.random() * 100) / 100)
    };
    const F = {
        pct: v => Math.round(v * 100) + '%',
        hz: (a, b) => v => { let f = expo(a, b, v); return f >= 1000 ? (f / 1000).toFixed(1) + 'k' : Math.round(f) + ''; },
        db: (a, b) => v => { let d = a + (b - a) * v; return (d > 0 ? '+' : '') + d.toFixed(1) + 'dB'; },
        ms: (a, b, p) => v => { let s = a + (b - a) * Math.pow(v, p || 1); return s >= 1 ? s.toFixed(2) + 's' : (s * 1000).toFixed(s < 0.01 ? 1 : 0) + 'ms'; },
        pick: names => v => names[idx(v, names.length)],
        x: (a, b) => v => (a + (b - a) * v).toFixed(1) + ':1'
    };
    const SWSY = [['free', 0], ['1/16', 0.25], ['1/8', 0.5], ['1/4', 1], ['1/2', 2], ['1 bar', 4], ['2 bars', 8], ['4 bars', 16], ['8 bars', 32]];
    const CGST = [16, 15, 14, 12, 10, 9, 8, 7, 6, 5, 4, 3];
    const CGLR = ['same', 'PING PONG', 'right a step late', 'right 2 late', 'right half way'];
    const SHM = [['free'], ['8 BIT CONSOLE', 6, 32000, 0, 0, 0, 30, [1000, 0], 0], ['12 BIT SAMPLER', 12, 26040, 2, 0, 0, 25, [3000, 1], 2], ['GRITTY SAMPLER', 8, 22050, 3, 1, 0.02, 40, [2500, 2], 4], ['TELEPHONE', 8, 8000, 3, 1, 0, 420, [1700, 7], 9, 3200], ['TOY', 4, 6000, 0, 0, 0.25, 280, [2200, 6], 6, 5000], ['16 BIT LOW RATE', 16, 11025, 3, 0, 0, 20, [1000, 0], 0]];
    const TGR = [['1/16', 0.25], ['1/8', 0.5], ['1/4', 1], ['1/2', 2], ['1 bar', 4], ['2 bars', 8]];
    const PKN = ['CLOSET', 'JAR', 'PIPE', 'LOCKER', 'BELL JAR', 'MOUTH', 'STAIRWELL', 'CAR', 'BATHROOM'];
    const RSC = [['ROOT', [0, 0, 12, 12, 24]], ['5THS', [0, 7, 12, 19, 24]], ['MINOR', [0, 3, 7, 12, 15]], ['MINOR 7', [0, 3, 7, 10, 15]], ['SUS', [0, 5, 7, 12, 17]], ['OCTAVES', [0, 12, 24, 12, 0]], ['CLUSTER', [0, 1, 3, 5, 7]],
        ['IN KEY', null], ['MAJOR', [0, 4, 7, 12, 16]], ['MAJOR 7', [0, 4, 7, 11, 16]], ['ADD 9', [0, 7, 14, 16, 19]], ['POWER', [0, 7, 12, 19, 31]]];
    const offline = ctx => typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext;

    const WK = `
const live = p => { p.port.onmessage = e => { if (e.data === 'kill') p.dead = true; }; };
const BEND = { name: 'bend', defaultValue: 0, minValue: -4800, maxValue: 4800, automationRate: 'k-rate' };
const bendOf = P => P && P.bend && P.bend[0] ? Math.pow(2, P.bend[0] / 1200) : 1;
class Ladder extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{ name: 'cut', defaultValue: 1000, minValue: 20, maxValue: 20000 }, { name: 'res', defaultValue: 0.3, minValue: 0, maxValue: 1.15 }, { name: 'drive', defaultValue: 1, minValue: 0.3, maxValue: 30 }, { name: 'mode', defaultValue: 0, minValue: 0, maxValue: 1 }]; }
  constructor() { super(); live(this); this.s = [[0, 0, 0, 0], [0, 0, 0, 0]]; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0]; if (!i || !i.length) { for (const c of o) c.fill(0); return true; }
    const N = o[0].length, fs = sampleRate, md = P.mode[0] > 0.5;
    for (let ch = 0; ch < o.length; ch++) {
      const x = i[ch] || i[0], y = o[ch], s = this.s[ch];
      let g = 0, G = 0;
      for (let n = 0; n < N; n++) {
        if (n === 0 || P.cut.length > 1) { g = Math.tan(Math.PI * Math.min(P.cut.length > 1 ? P.cut[n] : P.cut[0], fs * 0.45) / fs); G = g / (1 + g); }
        const r = P.res.length > 1 ? P.res[n] : P.res[0], dr = P.drive.length > 1 ? P.drive[n] : P.drive[0];
        const k = r * (md ? 3.6 : 4.1);
        let u = Math.tanh((x[n] * dr - k * s[3]) * (md ? 1.4 : 1));
        for (let st = 0; st < 4; st++) { const v = (u - s[st]) * G, out = v + s[st]; s[st] = out + v; u = md ? Math.tanh(out * 1.15) : out; }
        y[n] = u * (1 + k * 0.45) / Math.max(1, dr * 0.35);
      }
    }
    return true;
  }
}
registerProcessor('nb-ladder', Ladder);
class Crush extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{ name: 'bits', defaultValue: 8, minValue: 1, maxValue: 16 }, { name: 'down', defaultValue: 1, minValue: 1, maxValue: 64 }, { name: 'jitter', defaultValue: 0, minValue: 0, maxValue: 1 },
    { name: 'pre', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' }, { name: 'post', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' }, { name: 'mode', defaultValue: 0, minValue: 0, maxValue: 2, automationRate: 'k-rate' },
    { name: 'dither', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' }, { name: 'drive', defaultValue: 1, minValue: 0.1, maxValue: 16, automationRate: 'k-rate' }]; }
  constructor() { super(); live(this); this.h = [0, 0]; this.c = 0; this.n = 1; this.ph = 1; this.f = [0, 1].map(() => [[0, 0], [0, 0], [0, 0], [0, 0]]); this.seed = 3; }
  rnd() { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; }
  lpc(fc) { const sr = sampleRate, w = Math.tan(Math.PI * Math.min(fc, sr * 0.45) / sr), q = 0.7071, n = 1 / (1 + w / q + w * w); return [w * w * n, 2 * w * w * n, w * w * n, 2 * (w * w - 1) * n, (1 - w / q + w * w) * n]; }
  bq(s, x, c) { const y = c[0] * x + s[0]; s[0] = c[1] * x - c[3] * y + s[1]; s[1] = c[2] * x - c[4] * y; return y; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0]; if (!i || !i.length) { for (const c of o) c.fill(0); return true; }
    const N = o[0].length, sr = sampleRate, pre = P.pre[0], post = P.post[0], mode = Math.round(P.mode[0]), dth = P.dither[0], drv = P.drive[0], d0 = P.down[0];
    const nyq = sr / d0 * 0.45, cp = pre > 0.001 ? this.lpc(sr * 0.45 * Math.pow(nyq / (sr * 0.45), pre)) : null, co = post > 0.001 ? this.lpc(sr * 0.45 * Math.pow(nyq / (sr * 0.45), post)) : null;
    const simple = !cp && !co && mode === 0 && dth < 0.001 && Math.abs(drv - 1) < 1e-6;
    for (let n = 0; n < N; n++) {
      if (simple) {
        if (++this.c >= this.n) {
          this.c = 0; const d = P.down.length > 1 ? P.down[n] : P.down[0], j = P.jitter[0], b = P.bits.length > 1 ? P.bits[n] : P.bits[0];
          this.n = Math.max(1, d * (1 + (this.rnd() - 0.5) * j * 1.5)); const q = Math.pow(2, b - 1);
          for (let ch = 0; ch < o.length; ch++) { const x = (i[ch] || i[0])[n]; this.h[ch] = Math.round(x * q) / q; }
        }
        for (let ch = 0; ch < o.length; ch++) o[ch][n] = this.h[ch];
        continue;
      }
      const d = P.down.length > 1 ? P.down[n] : d0, b = P.bits.length > 1 ? P.bits[n] : P.bits[0], q = Math.pow(2, b - 1);
      let xs = [0, 0]; for (let ch = 0; ch < o.length; ch++) { let x = (i[ch] || i[0])[n] * drv; if (cp) { const F = this.f[ch]; x = this.bq(F[1], this.bq(F[0], x, cp), cp); } xs[ch] = x; }
      this.ph += 1 / Math.max(1, d * (1 + (this.rnd() - 0.5) * P.jitter[0] * 1.5));
      if (this.ph >= 1) { this.ph -= Math.floor(this.ph);
        for (let ch = 0; ch < o.length; ch++) { let x = xs[ch]; x = x > 1.5 ? 1.5 : x < -1.5 ? -1.5 : x; const r = dth > 0 ? (this.rnd() + this.rnd() - 1) * dth / q : 0; let y;
          if (mode === 1) { const mu = 255, a = Math.abs(x), c = Math.log(1 + mu * Math.min(1, a)) / Math.log(1 + mu); let cq = Math.round(c * q + r * q) / q; cq = Math.max(0, cq); y = Math.sign(x) * (Math.pow(1 + mu, cq) - 1) / mu; }
          else if (mode === 2) { const a = Math.abs(x); if (a < 1e-9) y = 0; else { const e = Math.ceil(Math.log2(a)), m = a / Math.pow(2, e); y = Math.sign(x) * (Math.round(m * q + r * q) / q) * Math.pow(2, e); } }
          else y = Math.round((x + r) * q) / q;
          this.h[ch] = y; } }
      for (let ch = 0; ch < o.length; ch++) { let y = this.h[ch]; if (co) { const F = this.f[ch]; y = this.bq(F[3], this.bq(F[2], y, co), co); } o[ch][n] = y; }
    }
    return true;
  }
}
registerProcessor('nb-crush', Crush);
class Back extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{ name: 'len', defaultValue: 0.5, minValue: 0.02, maxValue: 3.9, automationRate: 'k-rate' }, { name: 'fb', defaultValue: 0.3, minValue: 0, maxValue: 0.95, automationRate: 'k-rate' }, { name: 'xf', defaultValue: 0.1, minValue: 0.01, maxValue: 0.5, automationRate: 'k-rate' }]; }
  constructor() { super(); live(this); this.N = Math.ceil(sampleRate * 8); this.b = [new Float32Array(this.N), new Float32Array(this.N)]; this.w = 0; this.c = 0; this.L = 1; this.s = 0; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], N = this.N, L0 = Math.max(64, Math.floor(P.len[0] * sampleRate)), xf = P.xf[0], fb = P.fb[0];
    for (let n = 0; n < o[0].length; n++) {
      if (this.c <= 0) { this.L = L0; this.c = this.L; this.s = (this.w - 1 + N) % N; }
      const k = this.L - this.c, u = k / this.L, env = Math.max(0, Math.min(1, u / xf, (1 - u) / xf)), r = (this.s - k + N) % N;
      for (let ch = 0; ch < 2; ch++) { const x = i && i.length ? (i[ch] || i[0])[n] : 0, y = this.b[ch][r] * env; if (o[ch]) o[ch][n] = y; this.b[ch][this.w] = x + y * fb; }
      this.w = (this.w + 1) % N; this.c--;
    }
    return true;
  }
}
registerProcessor('nb-back', Back);
class MLid extends AudioWorkletProcessor {
  constructor(o) { super(); live(this); const p = (o && o.processorOptions) || {};
    this.la = Math.max(1, Math.floor(sampleRate * (p.la || 0.006))); this.th = p.th == null ? -0.8 : p.th; this.r = p.ratio || 20;
    this.mk = Math.pow(10, -0.6 * this.th * (1 - 1 / this.r) / 20);
    this.aA = Math.exp(-1 / (sampleRate * (p.att || 0.0015))); this.aR = Math.exp(-1 / (sampleRate * (p.rel || 0.06)));
    this.d = [new Float64Array(this.la), new Float64Array(this.la)]; this.w = 0;
    const Q = this.la + 2; this.Q = Q; this.qv = new Float64Array(Q); this.qi = new Float64Array(Q); this.qh = 0; this.qt = 0; this.k = 0; this.g = 0; this.gr = 0;
  }
  process(ins, outs) { if (this.dead) return false;
    const i = ins[0], o = outs[0], n0 = o[0].length, L = i && i.length ? i[0] : null, R = i && i.length ? (i[1] || i[0]) : null, Q = this.Q, qv = this.qv, qi = this.qi, la = this.la, th = this.th, r = this.r;
    let lo = 0;
    for (let n = 0; n < n0; n++) {
      const xl = L ? L[n] : 0, xr = R ? R[n] : 0, x = Math.max(Math.abs(xl), Math.abs(xr)), k = this.k++;
      while (this.qt > this.qh && qv[(this.qt - 1) % Q] <= x) this.qt--;
      qv[this.qt % Q] = x; qi[this.qt % Q] = k; this.qt++;
      while (qi[this.qh % Q] <= k - la - 1) this.qh++;
      const pk = qv[this.qh % Q], db = pk > 1e-10 ? 20 * Math.log10(pk) : -200, want = db > th ? (th + (db - th) / r) - db : 0;
      this.g = want < this.g ? want + (this.g - want) * this.aA : want + (this.g - want) * this.aR;
      const gn = Math.pow(10, this.g / 20) * this.mk, w = this.w, yl = this.d[0][w], yr = this.d[1][w];
      this.d[0][w] = xl; this.d[1][w] = xr; this.w = w + 1 === la ? 0 : w + 1;
      o[0][n] = yl * gn; if (o[1]) o[1][n] = yr * gn; if (this.g < lo) lo = this.g;
    }
    this.gr = lo; return true;
  }
}
registerProcessor('nb-mlid', MLid);
class Grain extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [['size', 0.08, 0.005, 0.5], ['dens', 12, 0.5, 80], ['pitch', 0, -24, 24], ['spray', 0.3, 0, 1], ['rev', 0, 0, 1], ['freeze', 0, 0, 1], ['shape', 0, 0, 3], ['det', 0, 0, 100], ['width', 0.5, 0, 1], ['pos', 0, 0, 1]].map(([name, d, a, b]) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' })); }
  constructor() { super(); live(this); this.N = Math.ceil(sampleRate * 3); this.b = [new Float32Array(this.N), new Float32Array(this.N)]; this.w = 0; this.g = []; this.acc = 0; this.seed = 11; }
  rnd() { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; }
  env(s, u) { if (s === 1) return u < 0.25 ? 0.5 - 0.5 * Math.cos(Math.PI * u * 4) : u > 0.75 ? 0.5 - 0.5 * Math.cos(Math.PI * (1 - u) * 4) : 1; if (s === 2) return Math.min(1, u * 40) * Math.exp(-u * 5); if (s === 3) return Math.min(1, (1 - u) * 40) * Math.exp(-(1 - u) * 5); return 0.5 - 0.5 * Math.cos(6.2831853 * u); }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], N = this.N, sr = sampleRate;
    const size = P.size[0], dens = P.dens[0], ratio = Math.pow(2, P.pitch[0] / 12), spray = P.spray[0], rev = P.rev[0], frz = P.freeze[0] > 0.5, sh = Math.round(P.shape[0]), det = P.det[0], wid = P.width[0], pos = P.pos[0];
    const len = Math.max(64, Math.floor(size * sr)), norm = 1.4 / Math.sqrt(Math.max(1, dens * size)) * (sh === 2 || sh === 3 ? 1.6 : sh === 1 ? 0.8 : 1);
    for (let n = 0; n < o[0].length; n++) {
      if (!frz) { for (let ch = 0; ch < 2; ch++) this.b[ch][this.w] = i && i.length ? (i[ch] || i[0])[n] : 0; this.w = (this.w + 1) % N; }
      this.acc += dens / sr;
      while (this.acc >= 1) {
        this.acc -= 1;
        if (this.g.length < 96) { const r = ratio * (det > 0 ? Math.pow(2, (this.rnd() * 2 - 1) * det / 1200) : 1), room = N - len * 3 - 256, back = len * Math.max(1, r) + 128 + pos * room * 0.9 * (1 - spray * 0.5) + this.rnd() * spray * room * 0.9 * (1 - pos * 0.5), rv = this.rnd() < rev;
          this.g.push({ p: (this.w - back + N) % N, inc: rv ? -r : r, len, a: 0, pan: (this.rnd() - 0.5) * (0.3 + spray) * wid * 2 }); }
      }
      let l = 0, rr = 0;
      for (let k = this.g.length - 1; k >= 0; k--) {
        const G = this.g[k], e = this.env(sh, G.a / G.len), p0 = Math.floor(G.p), f = G.p - p0, a0 = ((p0 % N) + N) % N, a1 = (a0 + 1) % N, pn = G.pan > 1 ? 1 : G.pan < -1 ? -1 : G.pan;
        l += (this.b[0][a0] + (this.b[0][a1] - this.b[0][a0]) * f) * e * (1 - pn); rr += (this.b[1][a0] + (this.b[1][a1] - this.b[1][a0]) * f) * e * (1 + pn);
        G.p += G.inc; G.a++; if (G.a >= G.len) this.g.splice(k, 1);
      }
      o[0][n] = l * norm; if (o[1]) o[1][n] = rr * norm;
    }
    return true;
  }
}
registerProcessor('nb-grain', Grain);
class Stut extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [['aT', 0, -1e9, 1e9], ['aB', 0, -1e9, 1e9], ['spb', 0.5, 0.05, 4], ['run', 0, 0, 1], ['chance', 0.5, 0, 1], ['slice', 0.25, 0.01, 4], ['every', 4, 0.25, 64], ['len', 0.25, 0, 1], ['mode', 0, 0, 3], ['decay', 0, 0, 1], ['pitch', 0, -12, 12], ['gate', 1, 0.25, 1]].map(([name, d, a, b]) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' })); }
  constructor() { super(); live(this); this.N = Math.ceil(sampleRate * 8); this.b = [new Float32Array(this.N), new Float32Array(this.N)]; this.w = 0; this.zone = -1; this.cap = 0; this.zn = 0; this.rp = 0; this.mx = 0; }
  rd(c, x) { const N = this.N, i0 = Math.floor(x), f = x - i0, a = ((i0 % N) + N) % N, b = (a + 1) % N; return this.b[c][a] + (this.b[c][b] - this.b[c][a]) * f; }
  h(k) { const x = Math.sin(k * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], N = this.N, sr = sampleRate, run = P.run[0] > 0.5, spb = P.spb[0], ev = P.every[0], slice = Math.max(64, Math.floor(P.slice[0] * spb * sr)), md = Math.round(P.mode[0]), len = P.len[0], zl = Math.max(1, ev * len * spb * sr);
    const fd = Math.max(8, Math.floor(sr * 0.003)), pst = P.pitch[0], gate = P.gate[0], xa = 1 / fd;
    for (let n = 0; n < o[0].length; n++) {
      const x0 = i && i.length ? i[0][n] : 0, x1 = i && i.length ? (i[1] || i[0])[n] : 0;
      this.b[0][this.w] = x0; this.b[1][this.w] = x1;
      let y0 = x0, y1 = x1;
      if (run) {
        const b = P.aB[0] + (currentTime + n / sr - P.aT[0]) / spb, k = Math.floor(b / ev + 1e-9), u = b - k * ev;
        if (this.h(k + 0.123) < P.chance[0] && u >= ev * (1 - len)) {
          if (this.zone !== k) { this.zone = k; this.cap = this.w; this.zn = 0; this.rp = 0; }
          const z = this.zn, si = Math.floor(z / slice), off = z % slice, dk = Math.pow(1 - P.decay[0] * 0.6, si);
          const rt = md < 3 && si > 0 && pst ? Math.min(Math.pow(2, si * pst / 12), z / Math.max(1, off)) : 1, ro = off * rt, gl = slice * gate;
          let idx;
          if (md === 0) idx = this.cap + ro;
          else if (md === 1) idx = this.cap - ro - 1;
          else if (md === 2) idx = this.cap - slice - Math.floor(this.h(k * 7.1 + si) * Math.min(ev * spb * sr, N / 2 - slice * 2)) + ro;
          else { this.rp += Math.pow(Math.max(0, 1 - z / zl), 1.5); idx = this.cap + this.rp; }
          const e = md === 3 ? 1 : Math.max(0, Math.min(si ? off * xa : 1, (gl - off) * xa, 1));
          y0 = this.rd(0, idx) * dk * e; y1 = this.rd(1, idx) * dk * e; this.zn++;
          this.mx = Math.min(1, this.mx + xa);
        } else { this.zone = -1; this.mx = Math.max(0, this.mx - xa); }
      }
      if (this.mx < 1 && this.mx > 0 && this.zone === -1 && this.lv) { y0 = x0 * (1 - this.mx) + this.lv[0] * this.mx; y1 = x1 * (1 - this.mx) + this.lv[1] * this.mx; }
      else if (this.mx < 1 && this.zone !== -1) { y0 = x0 * (1 - this.mx) + y0 * this.mx; y1 = x1 * (1 - this.mx) + y1 * this.mx; }
      if (this.zone !== -1) this.lv = [y0, y1];
      o[0][n] = y0; if (o[1]) o[1][n] = y1;
      this.w = (this.w + 1) % N;
    }
    return true;
  }
}
registerProcessor('nb-stut', Stut);
class Pitch extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{ name: 'shift', defaultValue: 0, minValue: -36, maxValue: 36, automationRate: 'k-rate' }, { name: 'win', defaultValue: 0.06, minValue: 0.01, maxValue: 0.3, automationRate: 'k-rate' }]; }
  constructor() { super(); live(this); this.N = 32768; this.b = [new Float32Array(this.N), new Float32Array(this.N)]; this.w = 0; this.ph = 0; }
  rd(c, d) { const N = this.N, M = N - 1, p = this.w - d, i0 = Math.floor(p), f = p - i0, b = this.b[c], y0 = b[(i0 - 1) & M], y1 = b[i0 & M], y2 = b[(i0 + 1) & M], y3 = b[(i0 + 2) & M], c1 = 0.5 * (y2 - y0), c2 = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3, c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2); return ((c3 * f + c2) * f + c1) * f + y1; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], sr = sampleRate, ratio = Math.pow(2, P.shift[0] / 12), W = P.win[0] * sr, step = (1 - ratio) / W;
    for (let n = 0; n < o[0].length; n++) {
      for (let c = 0; c < 2; c++) this.b[c][this.w] = i && i.length ? (i[c] || i[0])[n] : 0;
      this.ph = (this.ph + step) % 1; if (this.ph < 0) this.ph += 1;
      const p2 = (this.ph + 0.5) % 1, s1 = Math.sin(Math.PI * this.ph), s2 = Math.sin(Math.PI * p2), g1 = s1 * s1, g2 = s2 * s2;
      for (let c = 0; c < o.length; c++) o[c][n] = this.rd(c, this.ph * W + 2) * g1 + this.rd(c, p2 * W + 2) * g2;
      this.w = (this.w + 1) % this.N;
    }
    return true;
  }
}
registerProcessor('nb-pitch', Pitch);
class Follow extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{ name: 'att', defaultValue: 0.005, minValue: 0.0005, maxValue: 0.5, automationRate: 'k-rate' }, { name: 'rel', defaultValue: 0.15, minValue: 0.005, maxValue: 2, automationRate: 'k-rate' }]; }
  constructor() { super(); live(this); this.e = 0; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], sr = sampleRate, a = Math.exp(-1 / (P.att[0] * sr)), r = Math.exp(-1 / (P.rel[0] * sr));
    for (let n = 0; n < o[0].length; n++) { let x = 0; if (i && i.length) for (const c of i) x = Math.max(x, Math.abs(c[n])); this.e = x > this.e ? a * this.e + (1 - a) * x : r * this.e + (1 - r) * x; for (const c of o) c[n] = this.e; }
    return true;
  }
}
registerProcessor('nb-follow', Follow);
class Vocode extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [['n', 16, 4, 32], ['q', 0.5, 0, 1], ['fmt', 1, 0.25, 4], ['bright', 0.5, 0, 1], ['att', 0.005, 0.0005, 0.2], ['rel', 0.1, 0.005, 2], ['frz', 0, 0, 1], ['hiss', 0, 0, 1]].map(([name, d, a, b]) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' })); }
  constructor() { super(); live(this); this.key = ''; this.B = []; this.post = 0; this.hs = [0, 0]; }
  bp(f, Q) { const sr = sampleRate, w = 2 * Math.PI * Math.min(f, sr * 0.45) / sr, al = Math.sin(w) / (2 * Q), a0 = 1 + al; return [al / a0, 0, -al / a0, -2 * Math.cos(w) / a0, (1 - al) / a0]; }
  run(st, x, c) { const y = c[0] * x + st[0]; st[0] = c[1] * x - c[3] * y + st[1]; st[1] = c[2] * x - c[4] * y; return y; }
  build(n, q, fmt, bright) {
    const N = Math.round(n), Q = (2 + q * 18) * N / 16, old = this.B; this.B = [];
    for (let i = 0; i < N; i++) { const fr = 100 * Math.pow(80, i / (N - 1)), o = old[i] && old.length === N ? old[i] : null;
      this.B.push({ m: this.bp(fr, Q), c: this.bp(Math.min(18000, fr * fmt), Q), sm: o ? o.sm : [[0, 0], [0, 0]], sc: o ? o.sc : [[[0, 0], [0, 0]], [[0, 0], [0, 0]]], e: o ? o.e : 0, g: (8 + Q * 16 / N * 2) * (0.4 + (i / N) * bright * 2) * 1.55 }); } }
  process(ins, outs, P) { if (this.dead) return false;
    const c0 = ins[0], m0 = ins[1], o = outs[0], N = o[0].length, sr = sampleRate, key = Math.round(P.n[0]) + ':' + P.q[0].toFixed(3) + ':' + P.fmt[0].toFixed(4) + ':' + P.bright[0].toFixed(3);
    if (key !== this.key) { this.key = key; this.build(P.n[0], P.q[0], P.fmt[0], P.bright[0]); }
    const A = 1 - Math.exp(-1 / (P.att[0] * sr)), R = 1 - Math.exp(-1 / (P.rel[0] * sr)), frz = P.frz[0] > 0.5, hz = P.hiss[0] * 0.8, B = this.B, L = B.length;
    const hk = Math.exp(-2 * Math.PI * 6000 / sr);
    for (let n = 0; n < N; n++) {
      let m = 0; if (m0 && m0.length) { m = m0[0][n]; if (m0[1]) m = (m + m0[1][n]) * 0.5; }
      const xl = c0 && c0.length ? c0[0][n] : 0, xr = c0 && c0.length ? (c0[1] || c0[0])[n] : 0;
      let yl = 0, yr = 0;
      for (let k = 0; k < L; k++) { const b = B[k];
        if (!frz) { const v = Math.abs(this.run(b.sm[1], this.run(b.sm[0], m, b.m), b.m)); b.e += (v - b.e) * (v > b.e ? A : R); }
        const g = b.e * b.g; if (g < 1e-7) { this.run(b.sc[0][0], xl, b.c); this.run(b.sc[1][0], xr, b.c); continue; }
        yl += this.run(b.sc[0][1], this.run(b.sc[0][0], xl, b.c), b.c) * g; yr += this.run(b.sc[1][1], this.run(b.sc[1][0], xr, b.c), b.c) * g; }
      this.hs[0] = hk * this.hs[0] + (1 - hk) * m; const hi = (m - this.hs[0]) * hz;
      o[0][n] = yl + hi; if (o[1]) o[1][n] = yr + hi;
    }
    this.post += N; if (this.post > sr / 30) { this.post = 0; this.port.postMessage(B.map(b => b.e)); }
    return true;
  }
}
registerProcessor('nb-vocode', Vocode);
class Rotor extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [['fast', 0, 0, 1], ['drive', 0, 0, 1], ['mics', 0.7, 0, 1], ['dop', 0.4, 0, 1], ['depth', 0.7, 0, 1]].map(([name, d, a, b]) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' })); }
  constructor() { super(); live(this); this.hs = 0.8; this.ds = 0.67; this.th = 0; this.td = 0.9; this.N = 2048; this.buf = new Float32Array(this.N); this.w = 0; this.lp = [0, 0, 0, 0]; this.hp = [0, 0, 0, 0]; this.post = 0;
    const sr = sampleRate, w0 = Math.tan(Math.PI * 800 / sr), q = Math.SQRT1_2, nn = 1 / (1 + w0 / q + w0 * w0);
    this.cl = [w0 * w0 * nn, 2 * w0 * w0 * nn, w0 * w0 * nn, 2 * (w0 * w0 - 1) * nn, (1 - w0 / q + w0 * w0) * nn]; this.ch = [nn, -2 * nn, nn, this.cl[3], this.cl[4]]; this.sl = [[0, 0], [0, 0]]; this.sh = [[0, 0], [0, 0]]; }
  bq(st, x, c) { const y = c[0] * x + st[0]; st[0] = c[1] * x - c[3] * y + st[1]; st[1] = c[2] * x - c[4] * y; return y; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], sr = sampleRate, N = o[0].length, fast = P.fast[0] > 0.5, dr = P.drive[0], mic = P.mics[0] * Math.PI * 0.5, dop = P.dop[0], dep = P.depth[0];
    const hT = fast ? 6.7 : 0.8, dT = fast ? 5.9 : 0.67, ha = 1 - Math.exp(-1 / ((hT > this.hs ? 0.7 : 1.1) * sr)), da = 1 - Math.exp(-1 / ((dT > this.ds ? 3.5 : 4.5) * sr)), g = 1 + dr * 6, gn = 1 / Math.sqrt(g), M = this.N;
    for (let n = 0; n < N; n++) {
      let x = 0; if (i && i.length) { x = i[0][n]; if (i[1]) x = (x + i[1][n]) * 0.5; }
      if (dr > 0.001) x = Math.tanh(x * g) * gn;
      const lo = this.bq(this.sl[1], this.bq(this.sl[0], x, this.cl), this.cl), hi = this.bq(this.sh[1], this.bq(this.sh[0], x, this.ch), this.ch);
      this.hs += (hT - this.hs) * ha; this.ds += (dT - this.ds) * da; this.th += this.hs / sr; this.td += this.ds / sr; this.th -= Math.floor(this.th); this.td -= Math.floor(this.td);
      this.buf[this.w] = hi;
      if ((this.k = (this.k || 0) + 1) % 4 === 1) for (let c = 0; c < 2; c++) { const ang = c ? mic : -mic, ah = 2 * Math.PI * this.th - ang, ad = 2 * Math.PI * this.td - ang, T = this.T || (this.T = [[0, 0, 0], [0, 0, 0]]);
        T[c][0] = 0.0012 * sr + Math.sin(ah) * dop * 0.00042 * sr; T[c][1] = 1 - dep * 0.45 * (1 - Math.cos(ah)) * 0.5; T[c][2] = 1 - dep * 0.28 * (1 - Math.cos(ad)) * 0.5; }
      for (let c = 0; c < o.length; c++) { const T = this.T[c], rp = this.w - T[0], i0 = Math.floor(rp), fr = rp - i0, a0 = ((i0 % M) + M) % M, a1 = (a0 + 1) % M, h = this.buf[a0] + (this.buf[a1] - this.buf[a0]) * fr;
        o[c][n] = (h * T[1] + lo * T[2]) * 0.95; }
      this.w = (this.w + 1) % M;
    }
    this.post += N; if (this.post > sr / 30) { this.post = 0; this.port.postMessage([this.hs, this.ds, this.th, this.td]); }
    return true;
  }
}
registerProcessor('nb-rotor', Rotor);
class Wah extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{ name: 'env', defaultValue: 0, minValue: -10, maxValue: 10 }].concat([['base', 400, 20, 20000], ['span', 3600, -36000, 36000], ['cap', 1.5, 0.05, 2], ['k', 1, 0, 20], ['sm', 100, 5, 1000], ['lfo', 0, 0, 36000], ['lrate', 1, 0.01, 50], ['qa', 2, 0.1, 60], ['qb', 0.7, 0.1, 60], ['poles', 0, 0, 1], ['kind', 0, 0, 2], ['trim', 1, 0, 4], ['hit', 0, 0, 1], ['hr', 0.2, 0.005, 2]].map(([name, d, a, b]) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' }))); }
  constructor() { super(); live(this); this.s = [new Float64Array(4), new Float64Array(4)]; this.e = 0; this.e2 = 0; this.sl = 0; this.ph = 0; this.post = 0; this.fc = 0; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], N = o[0].length, sr = sampleRate, has = i && i.length;
    const base = P.base[0], span = P.span[0], C = P.cap[0], kk = P.k[0], lc = P.lfo[0], dph = P.lrate[0] / sr, kind = Math.round(P.kind[0]), four = P.poles[0] > 0.5 && kind !== 2, trim = P.trim[0];
    const hit = P.hit[0] > 0.5, hk = 1 - Math.exp(-1 / (P.hr[0] * sr)), hd = 1 - Math.exp(-1 / (0.012 * sr)), am = Math.exp(-6.2831853 * P.sm[0] / sr), A = 1.9953, ka = kind === 2 ? 1 / (P.qa[0] * A) : 1 / P.qa[0], kb = 1 / P.qb[0], top = sr * 0.45;
    for (let n = 0; n < N; n++) {
      let ev = P.env.length > 1 ? P.env[n] : P.env[0]; if (hit) { this.sl += (ev - this.sl) * (ev > this.sl ? hk : hd); ev = ev > this.sl ? ev - this.sl : 0; }
      this.e = am * this.e + (1 - am) * ev; this.e2 = am * this.e2 + (1 - am) * this.e;
      let fc = base * Math.pow(2, (span * C * Math.tanh(this.e2 * kk / C) + (lc > 0 ? lc * Math.sin(6.2831853 * this.ph) * (this.e2 * kk > 1 ? 1 : this.e2 * kk) : 0)) / 1200);
      fc = fc < 20 ? 20 : fc > top ? top : fc; this.fc = fc; this.ph += dph; if (this.ph >= 1) this.ph -= 1;
      const g = Math.tan(Math.PI * fc / sr), a1 = 1 / (1 + g * (g + ka)), a2 = g * a1, a3 = g * a2, b1 = 1 / (1 + g * (g + kb)), b2 = g * b1, b3 = g * b2;
      for (let ch = 0; ch < o.length; ch++) {
        const s = this.s[ch], x = has ? (i[ch] || i[0])[n] : 0;
        let v3 = x - s[1], v1 = a1 * s[0] + a2 * v3, v2 = s[1] + a2 * s[0] + a3 * v3; s[0] = 2 * v1 - s[0]; s[1] = 2 * v2 - s[1];
        let y = kind === 0 ? v2 : kind === 1 ? ka * v1 : x + ka * (A * A - 1) * v1;
        if (four) { v3 = y - s[3]; v1 = b1 * s[2] + b2 * v3; v2 = s[3] + b2 * s[2] + b3 * v3; s[2] = 2 * v1 - s[2]; s[3] = 2 * v2 - s[3]; y = kind === 0 ? v2 : kb * v1; }
        y *= trim; const a = y < 0 ? -y : y; if (a > 0.8) y = (y < 0 ? -1 : 1) * (0.8 + 0.2 * Math.tanh((a - 0.8) / 0.2));
        o[ch][n] = y;
      }
    }
    if (!has) for (let ch = 0; ch < o.length; ch++) { const s = this.s[ch]; for (let j = 0; j < 4; j++) if (Math.abs(s[j]) < 1e-20) s[j] = 0; }
    this.post += N; if (this.post > sr / 30) { this.post = 0; this.port.postMessage(this.fc); }
    return true;
  }
}
registerProcessor('nb-wah', Wah);
class Fang extends AudioWorkletProcessor {
  static get parameterDescriptors() { const k = (name, d, a, b) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' }); return [k('attack', 0, -1, 1), k('sustain', 0, -1, 1), k('speed', 0.5, 0, 1), k('focus', 0, 0, 2), k('xo', 200, 40, 8000), k('clip', 0, 0, 1)]; }
  constructor() { super(); live(this); this.f = 0; this.s = 0; this.t = 0; this.F = [0, 1].map(() => [[0, 0], [0, 0], [0, 0], [0, 0]]); this.kx = -1; this.post = 0; this.gx = 1; this.gn = 1; }
  bw(fc, hi) { const sr = sampleRate, w = Math.tan(Math.PI * Math.min(fc, sr * 0.45) / sr), q = Math.SQRT1_2, n = 1 / (1 + w / q + w * w); return hi ? [n, -2 * n, n, 2 * (w * w - 1) * n, (1 - w / q + w * w) * n] : [w * w * n, 2 * w * w * n, w * w * n, 2 * (w * w - 1) * n, (1 - w / q + w * w) * n]; }
  bq(s, x, c) { const y = c[0] * x + s[0]; s[0] = c[1] * x - c[3] * y + s[1]; s[1] = c[2] * x - c[4] * y; return y; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], sr = sampleRate, sp = P.speed[0], A = P.attack[0], S = P.sustain[0], fo = Math.round(P.focus[0]), cl = P.clip[0] >= 0.5;
    if (fo && this.kx !== P.xo[0]) { this.kx = P.xo[0]; this.cl = this.bw(this.kx, 0); this.ch = this.bw(this.kx, 1); }
    const k = ms => Math.exp(-1 / (ms * 0.001 * sr)), fa = k(0.3 + sp * 2), fr = k(12 + sp * 40), sa = k(12 + sp * 50), sr2 = k(12 + sp * 40), ta = k(0.4), tr = k(120 + sp * 400);
    for (let n = 0; n < o[0].length; n++) {
      let x = 0; if (i && i.length) for (const c of i) x = Math.max(x, Math.abs(c[n]));
      this.f = x > this.f ? fa * this.f + (1 - fa) * x : fr * this.f + (1 - fr) * x;
      this.s = x > this.s ? sa * this.s + (1 - sa) * x : sr2 * this.s + (1 - sr2) * x;
      this.t = x > this.t ? ta * this.t + (1 - ta) * x : tr * this.t + (1 - tr) * x;
      const e = 1e-5, att = Math.max(0, this.f - this.s) / (this.f + e), sus = Math.max(0, this.t - this.f) / (this.t + e);
      const g = Math.max(0, Math.min(6, (1 + A * 3 * att) * (1 + S * 2.5 * sus))); if (g > this.gx) this.gx = g; if (g < this.gn) this.gn = g;
      for (let c = 0; c < o.length; c++) { const v = i && i.length ? (i[c] || i[0])[n] : 0; let y;
        if (fo) { const F = this.F[Math.min(1, c)], lo = this.bq(F[1], this.bq(F[0], v, this.cl), this.cl), hi = this.bq(F[3], this.bq(F[2], v, this.ch), this.ch); y = fo === 1 ? lo * g + hi : lo + hi * g; }
        else y = v * g;
        if (cl) { const a = Math.abs(y); if (a > 0.8) y = Math.sign(y) * (0.8 + 0.2 * Math.tanh((a - 0.8) / 0.2)); }
        o[c][n] = y; }
    }
    this.post += o[0].length; if (this.post > sr / 30) { this.post = 0; const up = 20 * Math.log10(this.gx), dn = 20 * Math.log10(Math.max(1e-4, this.gn)); this.port.postMessage(up > -dn ? up : dn); this.gx = 1; this.gn = 1; }
    return true;
  }
}
registerProcessor('nb-fang', Fang);
class Vice extends AudioWorkletProcessor {
  static get parameterDescriptors() { const k = (name, d, a, b) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' });
    return [k('thr', -20, -80, 0), k('ratio', 4, 1, 50), k('att', 0.01, 0.00001, 1), k('rel', 0.2, 0.005, 5), k('knee', 6, 0, 40), k('make', 0, -24, 48), k('mix', 1, 0, 1), k('style', 0, 0, 5), k('sc', 0, 0, 1000), k('look', 0, 0, 0.01), k('auto', 0, 0, 1), k('ctype', 0, 0, 3), k('cdrive', 0, 0, 1), k('cpost', 1, 0, 1)]; }
  constructor() { super(); this.port.onmessage = e => { if (e.data === 'kill') this.dead = true; };
    this.yl = 0; this.ys = 0; this.mem = 0; this.rms = 0; this.lastG = 1; this.lastY = 0; this.hp = new Float64Array(8); this.N = 1024; this.buf = [new Float32Array(1024), new Float32Array(1024)]; this.w = 0;
    this.post = 0; this.pk = 0; this.pkO = 0; this.grMax = 0; this.lt = [0, 0]; }
  gc(x, T, R, W, st) {
    if (st === 5) { if (x < -70 || x >= T) return 0; const u = (T - x) * (1 - 1 / R); return Math.min(18, u); }
    if (st === 4) { const over = Math.max(0, x - T); R = 1 + (R - 1) * Math.min(1, 0.25 + over / 14); }
    if (2 * (x - T) < -W) return 0;
    if (2 * Math.abs(x - T) <= W && W > 0) { const q = x - T + W / 2; return (1 / R - 1) * q * q / (2 * W); }
    return (T + (x - T) / R) - x;
  }
  col(x, t, d) { if (d < 0.001) return x; const g = 1 + d * 5;
    if (t === 1) { const y = Math.tanh(g * (x + 0.12 * x * x)) / Math.tanh(g); return y; }
    if (t === 2) { const a = g * x; return (a > 1 ? 1 - 0.25 / a : a < -1 ? -1 + 0.25 / -a : a - a * a * a * 0.25) / Math.min(g, 1.6); }
    if (t === 3) { const y = Math.tanh(g * x) / Math.tanh(g); this.lt[0] += (y - this.lt[0]) * 0.18; return y + (y - this.lt[0]) * d * 0.6; }
    return Math.tanh(x * g) / Math.tanh(g) * 0.98 + x * 0.02; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], sr = sampleRate, n0 = o[0].length, st = Math.round(P.style[0]), T = P.thr[0], R = P.ratio[0], W = P.knee[0], mix = P.mix[0], ct = Math.round(P.ctype[0]), cd = P.cdrive[0], cpost = P.cpost[0] >= 0.5;
    const cf = x => Math.exp(-1 / (Math.max(0.00001, x) * sr)), aA = cf(P.att[0]), rel = P.rel[0], aR = cf(rel), aRf = cf(Math.min(rel, 0.06)), aRs = cf(rel * 4), aRMS = cf(st === 4 ? 0.03 : 0.005);
    const fc = P.sc[0], hpOn = fc > 10, K = hpOn ? Math.tan(Math.PI * Math.min(fc, sr * 0.45) / sr) : 0, nq = 1 / (1 + K * 1.4142 + K * K), hb0 = nq, hb1 = -2 * nq, ha1 = 2 * (K * K - 1) * nq, ha2 = (1 - K * 1.4142 + K * K) * nq;
    const L = Math.min(this.N - 1, Math.round(P.look[0] * sr)), make = Math.pow(10, P.make[0] / 20), auto = P.auto[0] >= 0.5;
    const inL = i && i[0] ? i[0] : null, inR = i && i[1] ? i[1] : inL;
    for (let n = 0; n < n0; n++) {
      let l = inL ? inL[n] : 0, r = inR ? inR[n] : 0;
      if (!cpost && cd > 0.001) { l = this.col(l, ct, cd); r = this.col(r, ct, cd); }
      let det = Math.max(Math.abs(l), Math.abs(r));
      if (hpOn) { const H = this.hp; let m = 0; for (let c = 0; c < 2; c++) { const x = c ? r : l, q = c * 4, y = hb0 * x + hb1 * H[q] + hb0 * H[q + 1] - ha1 * H[q + 2] - ha2 * H[q + 3]; H[q + 1] = H[q]; H[q] = x; H[q + 3] = H[q + 2]; H[q + 2] = y; m = Math.max(m, Math.abs(y)); } det = m; }
      if (st === 1 || st === 4 || st === 5) { this.rms = aRMS * this.rms + (1 - aRMS) * det * det; det = Math.sqrt(this.rms) * 1.414; }
      const xdB = 20 * Math.log10(det + 1e-9), want = -this.gc(xdB, T, R, W, st);
      let rc = aR;
      if (st === 2) { this.mem = Math.min(1, this.mem + (this.yl > 2 ? 1 / (sr * 3) : -1 / (sr * 6))); rc = this.yl > want + 3 ? aRf : aRf + (aRs - aRf) * this.mem; }
      if (auto) { this.ys = 0.9995 * this.ys + 0.0005 * this.yl; rc = this.yl > this.ys + 3 ? cf(rel * 0.35) : cf(rel * 1.6); }
      this.yl = want > this.yl ? aA * this.yl + (1 - aA) * want : rc * this.yl + (1 - rc) * want;
      const g = Math.pow(10, -this.yl / 20) * make;
      const B = this.buf, wI = this.w; B[0][wI] = l; B[1][wI] = r; const rI = (wI - L + this.N) % this.N; this.w = (wI + 1) % this.N;
      let dl = B[0][rI], dr = B[1][rI], yl2 = dl * g, yr2 = dr * g;
      if (cpost && cd > 0.001) { yl2 = this.col(yl2, ct, cd); yr2 = this.col(yr2, ct, cd); }
      this.lastY = Math.max(Math.abs(yl2), Math.abs(yr2)) / Math.max(1e-6, make);
      o[0][n] = dl * (1 - mix) + yl2 * mix; if (o[1]) o[1][n] = dr * (1 - mix) + yr2 * mix;
      this.pk = Math.max(this.pk, Math.abs(dl), Math.abs(dr)); this.pkO = Math.max(this.pkO, Math.abs(o[0][n])); this.grMax = Math.max(this.grMax, this.yl);
    }
    this.post += n0; if (this.post > sr / 60) { this.post = 0; this.port.postMessage({ i: this.pk, o: this.pkO, g: this.grMax, g2: this.yl }); this.pk = 0; this.pkO = 0; this.grMax = -99; }
    return true;
  }
}
registerProcessor('nb-vice', Vice);
class Scorch extends AudioWorkletProcessor {
  static get parameterDescriptors() { const k = (name, d, a, b) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' }); return [k('style', 0, 0, 4), k('g', 1, 0, 400), k('nm', 1, 0.01, 10)]; }
  constructor() { super(); this.port.onmessage = e => { if (e.data === 'kill') this.dead = true; };
    const mk = () => ({ u1: new Float64Array(16), u2: new Float64Array(16), i1: 0, i2: 0, d1: { i: 0, e: new Float64Array(16), o: new Float64Array(16) }, d2: { i: 0, e: new Float64Array(16), o: new Float64Array(16) }, m: 0, env: 0, sag: 0 });
    this.C = [mk(), mk()]; this.sc = new Float32Array(512); this.sn = 0; this.post = 0; this.h = Float64Array.from(Serp.HB.slice(0, 6)); }
  static curve(st, x) {
    if (st === 0) return Math.tanh(x * 1.2) / 0.8337;
    if (st === 1) return Math.tanh(x + 0.15 * x * x);
    if (st === 2) return Math.sign(x) * (1 - Math.exp(-Math.abs(x) * 1.6));
    if (st === 3) return x >= 0 ? Math.tanh(x * 1.1) : Math.tanh(x * 0.75) * 1.15;
    const y = Math.max(-1, Math.min(1, x * 1.6)); return Math.sin(y * Math.PI * 0.5 + Math.sin(x * 4) * 0.08); }
  up(R, x, k) { const h = this.h, B = k ? R.u2 : R.u1; let i = (k ? R.i2 : R.i1); i = (i + 1) & 15; if (k) R.i2 = i; else R.i1 = i; B[i] = x;
    R.uo = h[0] * (B[(i - 11) & 15] + B[i]) + h[1] * (B[(i - 10) & 15] + B[(i - 1) & 15]) + h[2] * (B[(i - 9) & 15] + B[(i - 2) & 15]) + h[3] * (B[(i - 8) & 15] + B[(i - 3) & 15]) + h[4] * (B[(i - 7) & 15] + B[(i - 4) & 15]) + h[5] * (B[(i - 6) & 15] + B[(i - 5) & 15]); R.ue = B[(i - 6) & 15]; }
  down(R, e, o) { const h = this.h, O = R.o; let i = R.i = (R.i + 1) & 15; R.e[i] = e; O[i] = o;
    return 0.5 * (R.e[(i - 6) & 15] + h[0] * (O[(i - 1) & 15] + O[(i - 12) & 15]) + h[1] * (O[(i - 2) & 15] + O[(i - 11) & 15]) + h[2] * (O[(i - 3) & 15] + O[(i - 10) & 15]) + h[3] * (O[(i - 4) & 15] + O[(i - 9) & 15]) + h[4] * (O[(i - 5) & 15] + O[(i - 8) & 15]) + h[5] * (O[(i - 6) & 15] + O[(i - 7) & 15])); }
  nl(R, x, st, g, nm) {
    if (st === 0) { const y = Serp_.tape(R, x * g); return y / nm; }
    if (st === 3) { R.env += (Math.abs(x * g) - R.env) * 0.0006; R.sag += (Math.abs(x * g) - R.sag) * 0.00008; const gg = g / (1 + 0.35 * R.sag), b = 0.22 * Math.min(2, R.env); return (Scorch.curve(3, x * gg + b) - Scorch.curve(3, b)) / nm; }
    return Scorch.curve(st, x * g) / nm; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], st = Math.round(P.style[0]), g = P.g[0], nm = P.nm[0];
    let nc = o.length; if (!i || i.length < 2) nc = 1; else { const a0 = i[0], a1 = i[1]; let same = true; for (let n = 0; n < a0.length; n++) if (a0[n] !== a1[n]) { same = false; break; } if (same) nc = 1; }
    for (let c = 0; c < nc; c++) { const x0 = i && i.length ? (i[c] || i[0]) : null, R = this.C[c], out = o[c];
      for (let n = 0; n < out.length; n++) { const x = x0 ? x0[n] : 0; this.up(R, x, 0); const a0 = R.ue, a1 = R.uo; this.up(R, a0, 1); const b10 = R.ue, b11 = R.uo; this.up(R, a1, 1); const b20 = R.ue, b21 = R.uo;
        const y0 = this.nl(R, b10, st, g, nm), y1 = this.nl(R, b11, st, g, nm), y2 = this.nl(R, b20, st, g, nm), y3 = this.nl(R, b21, st, g, nm);
        const h0 = this.down(R.d2, y0, y1), h1 = this.down(R.d2, y2, y3), y = this.down(R.d1, h0, h1); out[n] = y;
        if (!c && (n & 3) === 0) { const q = (this.sn++ % 256) * 2; this.sc[q] = x; this.sc[q + 1] = y; } } }
    for (let c = nc; c < o.length; c++) o[c].set(o[0]);
    this.post += o[0].length; if (this.post > sampleRate / 30) { this.post = 0; this.port.postMessage(this.sc.slice(0)); }
    return true;
  }
}
const Serp_ = { tape(R, u) { const target = Math.tanh(u * 1.1 + 0.45 * R.m); R.m += (target - R.m) * 0.35; return Math.tanh(u * 0.9 + 0.25 * R.m) * 1.05; } };
registerProcessor('nb-scorch', Scorch);
class Sieve extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{ name: 'cut', defaultValue: 1000, minValue: 10, maxValue: 22000, automationRate: 'a-rate' }, { name: 'res', defaultValue: 0.2, minValue: 0, maxValue: 1, automationRate: 'k-rate' }, { name: 'type', defaultValue: 10, minValue: 0, maxValue: 16, automationRate: 'k-rate' }]; }
  constructor() { super(); this.port.onmessage = e => { if (e.data === 'kill') this.dead = true; };
    const H = this.H = Object.create(Serp.prototype); H.sr = sampleRate; H.lad = [0, 1, 2, 3].map(() => [0, 0, 0, 0, 0]); H.k35 = [0, 1, 2, 3].map(() => new Float64Array(4)); H.dio = [0, 1, 2, 3].map(() => new Float64Array(4));
    H.cb = [0, 1, 2, 3].map(() => new Float32Array(4096)); H.cw = 0; H.fmz = [0, 1, 2, 3].map(() => new Float64Array(6)); H.phz = [0, 1, 2, 3].map(() => new Float64Array(8));
    H.fs = [{ fg: [0, 0, 0], fk: [1, 1, 1], fa: [1, 0.5, 0.3], pg: [0, 0, 0, 0, 0, 0], pf: 0 }, { fg: [0, 0, 0], fk: [1, 1, 1], fa: [1, 0.5, 0.3], pg: [0, 0, 0, 0, 0, 0], pf: 0 }];
    this.z = [new Float64Array(8), new Float64Array(8)]; this.g = 0.1; this.n = 0; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], H = this.H, sr = sampleRate, t = Math.round(P.type[0]), res = P.res[0], k = 2 - 1.96 * Math.min(0.995, res), cut = P.cut;
    for (let n = 0; n < o[0].length; n++) {
      if ((this.n++ & 15) === 0) { const c = Math.max(20, Math.min(sr * 0.45, cut.length > 1 ? cut[n] : cut[0])); this.g = Math.tan(Math.PI * c / sr); if (t === 13 || t === 14) Serp.prototype.slot.call(H, 0, { t }, c, res); }
      for (let c = 0; c < o.length; c++) { const x = i && i.length ? (i[c] || i[0])[n] : 0; o[c][n] = Serp.prototype.svf.call(H, x, this.z[c], 0, this.g, k, t, c) * (t === 14 ? 1.8 : t === 13 ? 0.55 : 1); }
      H.cw = (H.cw + 1) & 4095;
    }
    return true;
  }
}
registerProcessor('nb-sieve', Sieve);
class Lid extends AudioWorkletProcessor {
  static get parameterDescriptors() { const k = (name, d, a, b) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' }); return [k('push', 1, 0, 64), k('ceil', 1, 0.01, 1), k('char', 0, 0, 2), k('rel', 0.1, 0.005, 1), k('tp', 1, 0, 1), k('auto', 1, 0, 1)]; }
  constructor() { super(); this.port.onmessage = e => { if (e.data === 'kill') this.dead = true; };
    this.L = Math.max(16, Math.round(sampleRate * 0.002)); const N = this.N = 256; this.dl = [new Float32Array(N), new Float32Array(N)]; this.gq = new Float32Array(N); this.w = 0;
    this.mq = []; this.g = 1; this.ga = 1; this.slow = 1; this.p = [[0, 0, 0], [0, 0, 0]]; this.post = 0; this.grm = 0; this.pk = 0; this.sm = new Float32Array(this.L).fill(1); this.ss = this.L; this.mi = 0; }
  tpk(h, x) { h[0] = h[1]; h[1] = h[2]; h[2] = x; const p0 = h[0], p1 = h[1], p2 = h[2], p3 = 2 * p2 - p1; let m = Math.abs(p2);
    for (let t = 0.25; t < 1; t += 0.25) { const y = 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t); m = Math.max(m, Math.abs(y)); } return m; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], push = P.push[0], ce = P.ceil[0], ch = Math.round(P.char[0]), tp = P.tp[0] >= 0.5, L = this.L, N = this.N, sr = sampleRate, rel = P.rel[0];
    const aR = Math.exp(-1 / (rel * sr)), aS = Math.exp(-1 / (rel * 6 * sr)), auto = P.auto[0] >= 0.5;
    for (let n = 0; n < o[0].length; n++) {
      let peak = 0; const xs = [0, 0];
      for (let c = 0; c < 2; c++) { let x = i && i.length ? (i[c] || i[0])[n] * push : 0;
        if (ch === 1) { const t = x / ce, a = Math.abs(t); x = a < 0.5 ? x : Math.sign(t) * ce * (0.5 + 0.5 * Math.tanh((a - 0.5) * 2)); }
        if (ch === 2) x = Math.max(-ce * 1.02, Math.min(ce * 1.02, x));
        xs[c] = x; peak = Math.max(peak, tp ? this.tpk(this.p[c], x) : Math.abs(x)); }
      const need = peak > ce ? ce / peak : 1, w = this.w, q = this.mq; this.gq[w] = need;
      while (q.length && this.gq[q[q.length - 1]] >= need) q.pop(); q.push(w); while (((w - q[0] + N) % N) >= L) q.shift();
      const hold = this.gq[q[0]];
      const mi = this.mi = (this.mi + 1) % L; this.ss += hold - this.sm[mi]; this.sm[mi] = hold; const eased = this.ss / L;
      let tgt = Math.min(hold, eased);
      this.slow = tgt < this.slow ? tgt : aS * this.slow + (1 - aS) * tgt;
      this.g = tgt < this.g ? tgt : Math.min(tgt, aR * this.g + (1 - aR) * (auto ? Math.max(tgt, this.slow * 0.5 + tgt * 0.5) : tgt));
      const r = (w + N - L) % N;
      for (let c = 0; c < o.length; c++) { this.dl[c][w] = xs[c]; o[c][n] = this.dl[c][r] * this.g; }
      this.w = (w + 1) % N; this.grm = Math.max(this.grm, -20 * Math.log10(this.g)); this.pk = Math.max(this.pk, Math.abs(o[0][n]));
    }
    this.post += o[0].length; if (this.post > sampleRate / 60) { this.post = 0; this.port.postMessage({ g: this.grm, o: this.pk }); this.grm = 0; this.pk = 0; }
    return true;
  }
}
registerProcessor('nb-lid', Lid);
class Three extends AudioWorkletProcessor {
  static get parameterDescriptors() { const k = (name, d, a, b) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' }); return [k('depth', 0.5, 0, 1), k('time', 0.4, 0, 1), k('lo', 0.6, 0, 1), k('mid', 0.6, 0, 1), k('hi', 0.6, 0, 1), k('xl', 150, 40, 1000), k('xh', 2500, 800, 12000)]; }
  constructor() { super(); this.port.onmessage = e => { if (e.data === 'kill') this.dead = true; };
    this.S = [0, 1].map(() => new Float64Array(64)); this.env = new Float64Array(3); this.gd = new Float64Array(3); this.gu = new Float64Array(3); this.co = null; this.ck = ''; this.post = 0; this.mx = [0, 0, 0, 0, 0, 0]; }
  static bw(f, hp) { const K = Math.tan(Math.PI * f / sampleRate), n = 1 / (1 + K * 1.41421356 + K * K); return hp ? [n, -2 * n, n, 2 * (K * K - 1) * n, (1 - K * 1.41421356 + K * K) * n] : [K * K * n, 2 * K * K * n, K * K * n, 2 * (K * K - 1) * n, (1 - K * 1.41421356 + K * K) * n]; }
  static bq(c, s, o, x) { const y = c[0] * x + s[o]; s[o] = c[1] * x - c[3] * y + s[o + 1]; s[o + 1] = c[2] * x - c[4] * y; return y; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], sr = sampleRate, xl = P.xl[0], xh = P.xh[0], dep = P.depth[0], tm = P.time[0], A = [P.lo[0], P.mid[0], P.hi[0]];
    const ck = xl + ':' + xh; if (ck !== this.ck) { this.ck = ck; this.co = { L: Three.bw(xl, 0), H: Three.bw(xl, 1), L2: Three.bw(xh, 0), H2: Three.bw(xh, 1) }; }
    const C = this.co, Bq = Three.bq, att = Math.exp(-1 / ((0.0008 + tm * 0.02) * sr)), rel = Math.exp(-1 / ((0.03 + tm * 0.3) * sr));
    for (let n = 0; n < o[0].length; n++) {
      const bands = [[0, 0], [0, 0], [0, 0]];
      for (let c = 0; c < 2; c++) { const x = i && i.length ? (i[c] || i[0])[n] : 0, s = this.S[c];
        let lo = Bq(C.L, s, 0, Bq(C.L, s, 2, x)), rest = Bq(C.H, s, 4, Bq(C.H, s, 6, x));
        const lap = Bq(C.L2, s, 8, Bq(C.L2, s, 10, lo)) + Bq(C.H2, s, 12, Bq(C.H2, s, 14, lo));
        const mid = Bq(C.L2, s, 16, Bq(C.L2, s, 18, rest)), hi = Bq(C.H2, s, 20, Bq(C.H2, s, 22, rest));
        bands[0][c] = lap; bands[1][c] = mid; bands[2][c] = hi; }
      let yl = 0, yr = 0;
      for (let b = 0; b < 3; b++) { const lv = Math.max(Math.abs(bands[b][0]), Math.abs(bands[b][1])), e = this.env[b] = lv > this.env[b] ? att * this.env[b] + (1 - att) * lv : rel * this.env[b] + (1 - rel) * lv, db = 20 * Math.log10(e + 1e-9), dbNow = 20 * Math.log10(Math.max(e, lv * 0.7) + 1e-9);
        const a = A[b] * dep, top = -10 - a * 14, bot = -40 + a * 14, rD = 1 + a * 9, rU = 1 + a * 3;
        const down = db > top ? (db - top) * (1 - 1 / rD) : 0, up = dbNow < bot && db > -70 ? Math.min(24 * a, (bot - dbNow) * (1 - 1 / rU)) : 0;
        this.gd[b] = down; this.gu[b] = up; const g = Math.pow(10, (up - down) / 20);
        yl += bands[b][0] * g; yr += bands[b][1] * g; this.mx[b] = Math.max(this.mx[b], down); this.mx[b + 3] = Math.max(this.mx[b + 3], up); }
      o[0][n] = yl; if (o[1]) o[1][n] = yr;
    }
    this.post += o[0].length; if (this.post > sampleRate / 30) { this.post = 0; this.port.postMessage(this.mx.slice()); this.mx.fill(0); }
    return true;
  }
}
registerProcessor('nb-three', Three);
class Door extends AudioWorkletProcessor {
  static get parameterDescriptors() { const k = (name, d, a, b) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' }); return [k('thr', -30, -80, 0), k('range', -80, -90, 0), k('att', 0.001, 0.0001, 0.1), k('rel', 0.2, 0.005, 3), k('hold', 0.02, 0, 0.5), k('hyst', 6, 0, 20), k('exp', 0, 0, 1), k('klo', 0, 0, 2000), k('khi', 0, 0, 20000), k('look', 0.002, 0, 0.005)]; }
  constructor() { super(); this.port.onmessage = e => { if (e.data === 'kill') this.dead = true; };
    this.open = false; this.hc = 0; this.g = 0; this.e = 0; this.N = 512; this.dl = [new Float32Array(512), new Float32Array(512)]; this.w = 0; this.f = new Float64Array(8); this.post = 0; this.mx = 0; this.lv = 0; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], sr = sampleRate, thr = P.thr[0], hy = P.hyst[0], range = Math.pow(10, P.range[0] / 20), ex = P.exp[0] >= 0.5;
    const aA = Math.exp(-1 / (P.att[0] * sr)), aR = Math.exp(-1 / (P.rel[0] * sr)), holdN = P.hold[0] * sr, L = Math.min(this.N - 1, Math.round(P.look[0] * sr));
    const klo = P.klo[0], khi = P.khi[0], kl = klo > 10 ? 1 - Math.exp(-2 * Math.PI * klo / sr) : 0, kh = khi > 10 ? 1 - Math.exp(-2 * Math.PI * khi / sr) : 0;
    for (let n = 0; n < o[0].length; n++) {
      const l = i && i.length ? i[0][n] : 0, r = i && i.length ? (i[1] || i[0])[n] : 0;
      let x = Math.max(Math.abs(l), Math.abs(r)) * (Math.abs(l) >= Math.abs(r) ? Math.sign(l) || 1 : Math.sign(r) || 1); const F = this.f;
      if (kl) { F[0] += (x - F[0]) * kl; F[1] += (F[0] - F[1]) * kl; x -= F[1]; }
      if (kh) { F[2] += (x - F[2]) * kh; F[3] += (F[2] - F[3]) * kh; x = F[3]; }
      const a = Math.abs(x); this.e = a > this.e ? a : this.e * 0.9995 + a * 0.0005; const db = 20 * Math.log10(this.e + 1e-9);
      if (!this.open && db > thr) { this.open = true; this.hc = holdN; } else if (this.open) { if (db > thr - hy) this.hc = holdN; else if (this.hc > 0) this.hc--; else this.open = false; }
      let tgt = this.open ? 1 : ex ? Math.max(range, Math.pow(10, Math.min(0, db - thr) / 20)) : range;
      this.g = tgt > this.g ? aA * this.g + (1 - aA) * tgt : aR * this.g + (1 - aR) * tgt;
      const w = this.w, rr = (w + this.N - L) % this.N; this.dl[0][w] = l; this.dl[1][w] = r; this.w = (w + 1) % this.N;
      o[0][n] = this.dl[0][rr] * this.g; if (o[1]) o[1][n] = this.dl[1][rr] * this.g; this.mx = Math.max(this.mx, 1 - this.g); this.lv = Math.max(this.lv, db);
    }
    this.post += o[0].length; if (this.post > sr / 60) { this.post = 0; this.port.postMessage({ shut: this.mx, lv: this.lv, open: this.open }); this.mx = 0; this.lv = -120; }
    return true;
  }
}
registerProcessor('nb-door', Door);
class Hush extends AudioWorkletProcessor {
  static get parameterDescriptors() { const k = (name, d, a, b) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' }); return [k('freq', 6000, 1000, 16000), k('thr', 0.5, 0, 1), k('depth', 10, 0, 24), k('listen', 0, 0, 1), k('split', 1, 0, 1), k('rel', 1, 0, 1)]; }
  constructor() { super(); this.port.onmessage = e => { if (e.data === 'kill') this.dead = true; };
    this.z = new Float64Array(16); this.es = 0; this.ef = 0; this.g = 1; this.N = 128; this.dl = [new Float32Array(128), new Float32Array(128)]; this.w = 0; this.post = 0; this.mx = 0; this.ck = 0; this.c = null; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], sr = sampleRate, f = Math.min(sr * 0.45, P.freq[0]), dep = P.depth[0], lis = P.listen[0] >= 0.5, split = P.split[0] >= 0.5, relM = P.rel[0] >= 0.5;
    if (f !== this.ck) { this.ck = f; const K = Math.tan(Math.PI * f / sr), Q = 1.2, n = 1 / (1 + K / Q + K * K), K2 = Math.tan(Math.PI * f * 0.8 / sr), n2 = 1 / (1 + K2 * 1.4142 + K2 * K2);
      this.c = { b0: K / Q * n, a1: 2 * (K * K - 1) * n, a2: (1 - K / Q + K * K) * n, h0: n2, h1: -2 * n2, ha1: 2 * (K2 * K2 - 1) * n2, ha2: (1 - K2 * 1.4142 + K2 * K2) * n2 }; }
    const C = this.c, aA = Math.exp(-1 / (0.0005 * sr)), aR = Math.exp(-1 / (0.06 * sr)), L = Math.round(0.001 * sr);
    const thrDb = -P.thr[0] * 30, z = this.z;
    for (let n = 0; n < o[0].length; n++) {
      const l = i && i.length ? i[0][n] : 0, r = i && i.length ? (i[1] || i[0])[n] : 0, m = (l + r) * 0.5;
      const bp = C.b0 * m - C.b0 * z[1] - C.a1 * z[2] - C.a2 * z[3]; z[1] = z[0]; z[0] = m; z[3] = z[2]; z[2] = bp;
      const as = Math.abs(bp), af = Math.abs(m); this.es = as > this.es ? aA * this.es + (1 - aA) * as : aR * this.es + (1 - aR) * as; this.ef = af > this.ef ? aA * this.ef + (1 - aA) * af : aR * this.ef + (1 - aR) * af;
      const over = relM ? 20 * Math.log10((this.es + 1e-9) / (this.ef + 1e-9)) - thrDb : 20 * Math.log10(this.es + 1e-9) - (thrDb - 12);
      const tgt = Math.pow(10, -Math.min(dep, Math.max(0, over) * 1.5) / 20); this.g = tgt < this.g ? 0.9 * this.g + 0.1 * tgt : 0.9995 * this.g + 0.0005 * tgt;
      const w = this.w, rr = (w + this.N - L) % this.N; this.dl[0][w] = l; this.dl[1][w] = r; this.w = (w + 1) % this.N;
      for (let c = 0; c < o.length; c++) { const x = this.dl[c][rr], q = 4 + c * 4;
        const hp = C.h0 * x + C.h1 * z[q] + C.h0 * z[q + 1] - C.ha1 * z[q + 2] - C.ha2 * z[q + 3]; z[q + 1] = z[q]; z[q] = x; z[q + 3] = z[q + 2]; z[q + 2] = hp;
        o[c][n] = lis ? hp * (1 - this.g) * 2 : split ? x - hp * (1 - this.g) : x * this.g; }
      this.mx = Math.max(this.mx, -20 * Math.log10(this.g));
    }
    this.post += o[0].length; if (this.post > sr / 60) { this.post = 0; this.port.postMessage(this.mx); this.mx = 0; }
    return true;
  }
}
registerProcessor('nb-hush', Hush);
class Clipper extends AudioWorkletProcessor {
  static get parameterDescriptors() { const k = (name, d, a, b) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' }); return [k('drive', 1, 0, 64), k('ceil', 1, 0.01, 1), k('shape', 0, 0, 3), k('os', 4, 1, 8), k('knee', 0.3, 0, 1)]; }
  constructor() { super(); this.port.onmessage = e => { if (e.data === 'kill') this.dead = true; };
    const mk = () => ({ s: [0, 1, 2].map(() => ({ u: new Float64Array(16), i: 0, d: { i: 0, e: new Float64Array(16), o: new Float64Array(16) } })), dc: 0, dx: 0 });
    this.C = [mk(), mk()]; this.post = 0; this.cut = 0; this.n = 0; this.sh = 0; this.h = Float64Array.from(Serp.HB.slice(0, 6)); }
  up(S, x) { const h = this.h, B = S.u, i = S.i = (S.i + 1) & 15; B[i] = x;
    this.uo = h[0] * (B[(i - 11) & 15] + B[i]) + h[1] * (B[(i - 10) & 15] + B[(i - 1) & 15]) + h[2] * (B[(i - 9) & 15] + B[(i - 2) & 15]) + h[3] * (B[(i - 8) & 15] + B[(i - 3) & 15]) + h[4] * (B[(i - 7) & 15] + B[(i - 4) & 15]) + h[5] * (B[(i - 6) & 15] + B[(i - 5) & 15]); this.ue = B[(i - 6) & 15]; }
  down(R, e, o) { const h = this.h, O = R.o; let i = R.i = (R.i + 1) & 15; R.e[i] = e; O[i] = o;
    return 0.5 * (R.e[(i - 6) & 15] + h[0] * (O[(i - 1) & 15] + O[(i - 12) & 15]) + h[1] * (O[(i - 2) & 15] + O[(i - 11) & 15]) + h[2] * (O[(i - 3) & 15] + O[(i - 10) & 15]) + h[3] * (O[(i - 4) & 15] + O[(i - 9) & 15]) + h[4] * (O[(i - 5) & 15] + O[(i - 8) & 15]) + h[5] * (O[(i - 6) & 15] + O[(i - 7) & 15])); }
  nl(u) { const sh = this.sh, a = Math.abs(u); let y;
    if (sh === 0) y = u > 1 ? 1 : u < -1 ? -1 : u;
    else if (sh === 1) y = Math.tanh(u);
    else if (sh === 2) { const k = this.kn, lo = 1 - k; y = a <= lo ? u : a >= 1 + k ? Math.sign(u) : Math.sign(u) * (lo + (a - lo) - (a - lo) * (a - lo) / (4 * k)); }
    else y = u >= 0 ? Math.tanh(u) : Math.tanh(u * 1.25) / 1.25;
    if (a > 1) this.cut++; return y; }
  run(R, x, lv) { if (lv === 0) return this.nl(x);
    const S = R.s[lv - 1]; this.up(S, x); const e = this.ue, o = this.uo; return this.down(S.d, this.run(R, e, lv - 1), this.run(R, o, lv - 1)); }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], dr = P.drive[0], ce = P.ceil[0], os = P.os[0]; this.sh = Math.round(P.shape[0]); this.kn = Math.max(0.02, P.knee[0] * 0.5);
    const lv = os >= 8 ? 3 : os >= 4 ? 2 : os >= 2 ? 1 : 0;
    let nc = o.length; if (!i || i.length < 2) nc = 1; else { const a0 = i[0], a1 = i[1]; let same = true; for (let n = 0; n < a0.length; n++) if (a0[n] !== a1[n]) { same = false; break; } if (same) nc = 1; }
    const k = dr / ce;
    for (let c = 0; c < nc; c++) { const xin = i && i.length ? (i[c] || i[0]) : null, R = this.C[c], out = o[c];
      for (let n = 0; n < out.length; n++) { let y = this.run(R, (xin ? xin[n] : 0) * k, lv) * ce;
        if (this.sh === 3) { R.dc = y - R.dx + 0.9995 * R.dc; R.dx = y; y = R.dc; } out[n] = y; } this.n += out.length; }
    for (let c = nc; c < o.length; c++) o[c].set(o[0]);
    this.post += o[0].length; if (this.post > sampleRate / 60) { this.post = 0; this.port.postMessage(this.cut / Math.max(1, this.n * (1 << lv))); this.cut = 0; this.n = 0; }
    return true;
  }
}
registerProcessor('nb-clip', Clipper);
class Amp extends AudioWorkletProcessor {
  static get parameterDescriptors() { const k = (name, d, a, b) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' }); return [k('gain', 4, 0.5, 400), k('model', 1, 0, 4), k('sag', 0.4, 0, 1), k('tight', 120, 20, 600)]; }
  constructor() { super(); this.port.onmessage = e => { if (e.data === 'kill') this.dead = true; };
    const mk = () => ({ u: new Float64Array(16), i: 0, d: { i: 0, e: new Float64Array(16), o: new Float64Array(16) }, hp: 0, hx: 0, l1: 0, l2: 0, dc: 0, dx: 0, env: 0 }); this.C = [mk(), mk()]; this.post = 0; this.pk = 0; this.h = Float64Array.from(Serp.HB.slice(0, 6)); }
  up(S, x) { const h = this.h, B = S.u, i = S.i = (S.i + 1) & 15; B[i] = x;
    this.uo = h[0] * (B[(i - 11) & 15] + B[i]) + h[1] * (B[(i - 10) & 15] + B[(i - 1) & 15]) + h[2] * (B[(i - 9) & 15] + B[(i - 2) & 15]) + h[3] * (B[(i - 8) & 15] + B[(i - 3) & 15]) + h[4] * (B[(i - 7) & 15] + B[(i - 4) & 15]) + h[5] * (B[(i - 6) & 15] + B[(i - 5) & 15]); this.ue = B[(i - 6) & 15]; }
  down(R, e, o) { const h = this.h, O = R.o; let i = R.i = (R.i + 1) & 15; R.e[i] = e; O[i] = o;
    return 0.5 * (R.e[(i - 6) & 15] + h[0] * (O[(i - 1) & 15] + O[(i - 12) & 15]) + h[1] * (O[(i - 2) & 15] + O[(i - 11) & 15]) + h[2] * (O[(i - 3) & 15] + O[(i - 10) & 15]) + h[3] * (O[(i - 4) & 15] + O[(i - 9) & 15]) + h[4] * (O[(i - 5) & 15] + O[(i - 8) & 15]) + h[5] * (O[(i - 6) & 15] + O[(i - 7) & 15])); }
  static th(x) { return x > 3 ? 1 : x < -3 ? -1 : x * (27 + x * x) / (27 + 9 * x * x); }
  static tri(u, o) { return (u > 0 ? Amp.th(u) : Amp.th(u * 1.6) * 0.625) - o; }
  static rest(b) { return b > 0 ? Amp.th(b) : Amp.th(b * 1.6) * 0.625; }
  stage(R, x) { const k2 = this.k2, m = this.m;
    let y = Amp.tri(x * this.g1 + this.b1, this.o1);
    R.l1 += (y - R.l1) * k2; y = R.l1;
    if (m >= 1) { y = Amp.tri(y * this.g2 + this.b2, this.o2); R.l2 += (y - R.l2) * k2; y = R.l2; }
    if (m === 3) y = Math.max(-0.7, Math.min(0.7, y * 1.4)) / 0.7;
    const ay = y < 0 ? -y : y; R.env += (ay - R.env) * (ay > R.env ? 0.002 : 0.0002);
    return Amp.th(y * 1.2 / (1 + this.sag * 1.5 * R.env)) * 0.8333; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], sr = sampleRate, m = this.m = Math.round(P.model[0]); this.sag = P.sag[0]; this.k2 = 1 - Math.exp(-2 * Math.PI * [12000, 9000, 7000, 6000, 5000][m] / (sr * 2));
    this.g1 = P.gain[0] * [0.35, 0.9, 2.2, 3.5, 0.6][m]; this.b1 = [0.05, 0.12, 0.18, 0.4, 0.08][m]; this.o1 = Amp.rest(this.b1);
    this.g2 = [1, 2.2, 4, 6, 1.6][m]; this.b2 = [0, 0.1, 0.15, -0.3, 0.05][m]; this.o2 = Amp.rest(this.b2);
    const kh = 1 - Math.exp(-2 * Math.PI * P.tight[0] / sr), mono = !i || i.length < 2, nc = mono ? 1 : o.length;
    for (let c = 0; c < nc; c++) { const xin = i && i.length ? (i[c] || i[0]) : null, R = this.C[c], out = o[c];
      for (let n = 0; n < out.length; n++) { let x = xin ? xin[n] : 0; R.hp += (x - R.hp) * kh; x -= R.hp; this.up(R, x); const e = this.ue, od = this.uo;
        let y = this.down(R.d, this.stage(R, e), this.stage(R, od)); R.dc = y - R.dx + 0.9995 * R.dc; R.dx = y; out[n] = R.dc; const ay = R.dc < 0 ? -R.dc : R.dc; if (ay > this.pk) this.pk = ay; } }
    for (let c = nc; c < o.length; c++) o[c].set(o[0]);
    this.post += o[0].length; if (this.post > sr / 30) { this.post = 0; this.port.postMessage(this.pk); this.pk = 0; }
    return true;
  }
}
registerProcessor('nb-amp', Amp);
class Fold extends Amp {
  static get parameterDescriptors() { const k = (name, d, a, b) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' }); return [k('gain', 2, 0.5, 40), k('bias', 0, -1, 1), k('shape', 0, 0, 2)]; }
  static fo(u, m) { if (m === 1) return 0.6366198 * Math.asin(Math.sin(1.5707963 * u)); const y = Math.sin(1.5707963 * u); return m === 2 ? Math.sin(1.5707963 * y * 2.2) : y; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], g = P.gain[0], b = P.bias[0], m = Math.round(P.shape[0]), rest = Fold.fo(b, m), mono = !i || i.length < 2, nc = mono ? 1 : o.length;
    for (let c = 0; c < nc; c++) { const xin = i && i.length ? (i[c] || i[0]) : null, R = this.C[c], out = o[c];
      for (let n = 0; n < out.length; n++) { const x = xin ? xin[n] : 0; this.up(R, x); const e = this.ue, od = this.uo;
        let y = this.down(R.d, Fold.fo(e * g + b, m) - rest, Fold.fo(od * g + b, m) - rest); R.dc = y - R.dx + 0.9995 * R.dc; R.dx = y; out[n] = R.dc; } }
    for (let c = nc; c < o.length; c++) o[c].set(o[0]);
    return true;
  }
}
registerProcessor('nb-fold', Fold);
class Root extends AudioWorkletProcessor {
  static get parameterDescriptors() { const k = (name, d, a, b) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' }); return [k('xo', 100, 30, 300), k('sub', 0, 0, 2), k('harm', 0, 0, 2), k('cut', 0, 0, 1), k('drive', 1, 0.5, 8)]; }
  constructor() { super(); live(this); this.f = []; for (let k = 0; k < 6; k++) this.f.push({ x1: 0, x2: 0, y1: 0, y2: 0 }); this.ff = 1; this.arm = 0; this.env = 0; this.lx = -1; }
  co(type, f) { const w = 2 * Math.PI * Math.min(f, sampleRate * 0.45) / sampleRate, cs = Math.cos(w), al = Math.sin(w) / (2 * 0.7071), a0 = 1 + al;
    return type ? [(1 + cs) / 2 / a0, -(1 + cs) / a0, (1 + cs) / 2 / a0, -2 * cs / a0, (1 - al) / a0] : [(1 - cs) / 2 / a0, (1 - cs) / a0, (1 - cs) / 2 / a0, -2 * cs / a0, (1 - al) / a0]; }
  static bq(S, c, x) { const y = c[0] * x + c[1] * S.x1 + c[2] * S.x2 - c[3] * S.y1 - c[4] * S.y2; S.x2 = S.x1; S.x1 = x; S.y2 = S.y1; S.y1 = y; return y; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], n0 = o[0].length, xo = P.xo[0], sub = P.sub[0], harm = P.harm[0], cut = P.cut[0], dr = P.drive[0], sr = sampleRate, F = this.f;
    if (this.lx !== xo) { this.lx = xo; this.cL = this.co(0, xo); this.cS = this.co(0, xo * 0.8); this.cR = this.co(0, xo * 0.6); this.cH = this.co(1, xo * 1.3); this.cT = this.co(0, xo * 6); }
    const ka = 1 - Math.exp(-1 / (sr * 0.005)), kr = 1 - Math.exp(-1 / (sr * 0.08));
    for (let n = 0; n < n0; n++) {
      const l = i && i[0] ? i[0][n] : 0, r = i && i[1] ? i[1][n] : l, m = (l + r) * 0.5;
      const lb = Root.bq(F[0], this.cL, m), s2 = Root.bq(F[1], this.cS, Root.bq(F[2], this.cS, lb));
      const a = s2 < 0 ? -s2 : s2; this.env += (a - this.env) * (a > this.env ? ka : kr);
      const th = this.env * 0.08; if (this.arm && s2 > th) { this.arm = 0; this.ff = -this.ff; } else if (s2 < -th) this.arm = 1;
      const so = Root.bq(F[3], this.cR, this.ff * this.env * 1.2);
      const u = lb * dr, h = Root.bq(F[5], this.cT, Root.bq(F[4], this.cH, Math.tanh(u) + 0.6 * u * Math.abs(u) / (1 + u * u)));
      const add = so * sub + h * harm * 0.8 - lb * cut;
      o[0][n] = l + add; if (o[1]) o[1][n] = r + add;
    }
    return true;
  }
}
registerProcessor('nb-root', Root);
class PV extends AudioWorkletProcessor {
  static get parameterDescriptors() { const k = (name, d, a, b) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' }); return [k('shift', 0, -36, 36), k('formant', 0, -24, 24), k('keep', 0, 0, 1)]; }
  constructor() { super(); this.port.onmessage = e => { if (e.data === 'kill') this.dead = true; };
    const N = this.N = 4096, H = this.H = 1024, K = N / 2; this.win = new Float32Array(N); for (let i = 0; i < N; i++) this.win[i] = Math.sqrt(0.5 - 0.5 * Math.cos(2 * Math.PI * i / N));
    const M = this.M = N / 2; this.rev = new Uint16Array(M); for (let i = 0, j = 0; i < M; i++) { this.rev[i] = j; let b = M >> 1; while (j & b) { j ^= b; b >>= 1; } j |= b; }
    this.cs = new Float64Array(M / 2); this.sn = new Float64Array(M / 2); for (let i = 0; i < M / 2; i++) { this.cs[i] = Math.cos(2 * Math.PI * i / M); this.sn[i] = -Math.sin(2 * Math.PI * i / M); }
    this.wc = new Float64Array(M + 1); this.ws = new Float64Array(M + 1); for (let k = 0; k <= M; k++) { this.wc[k] = Math.cos(2 * Math.PI * k / N); this.ws[k] = -Math.sin(2 * Math.PI * k / N); }
    this.zr = new Float64Array(M); this.zi = new Float64Array(M);
    const ch = () => ({ inp: new Float32Array(N), acc: new Float32Array(N + H), re: new Float64Array(K + 1), im: new Float64Array(K + 1), x: new Float64Array(N), pph: new Float64Array(K + 1), rpsi: new Float64Array(K + 1), yr: new Float64Array(K + 1), yi: new Float64Array(K + 1) });
    this.C = [ch(), ch()]; this.pos = 0; this.oc = 0; this.quiet = 1e9;
    this.mag = new Float64Array(K + 1); this.ph = new Float64Array(K + 1); this.om = new Float64Array(K + 1); this.lg = new Float64Array(K + 1); this.env = new Float64Array(K + 1); this.ps = new Float64Array(K + 2); this.tmp = new Float64Array(K + 1);
    this.pk = new Int32Array(K + 1); this.own = new Int32Array(K + 1); this.npsi = new Float64Array(K + 1); }
  fft(re, im, inv) { const N = this.M, rv = this.rev, cs = this.cs, sn = this.sn;
    for (let i = 0; i < N; i++) { const j = rv[i]; if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let size = 2; size <= N; size <<= 1) { const half = size >> 1, step = N / size;
      for (let j = 0; j < half; j++) { const c = cs[j * step], s = inv ? -sn[j * step] : sn[j * step];
        for (let a = j; a < N; a += size) { const b = a + half, tr = re[b] * c - im[b] * s, ti = re[b] * s + im[b] * c; re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti; } } } }
  rfft(x, Xr, Xi) { const M = this.M, zr = this.zr, zi = this.zi, wc = this.wc, ws = this.ws; for (let n = 0; n < M; n++) { zr[n] = x[2 * n]; zi[n] = x[2 * n + 1]; } this.fft(zr, zi, false);
    for (let k = 0; k <= M; k++) { const a = k % M, b = (M - k) % M, er = (zr[a] + zr[b]) * 0.5, ei = (zi[a] - zi[b]) * 0.5, or = (zi[a] + zi[b]) * 0.5, oi = -(zr[a] - zr[b]) * 0.5;
      Xr[k] = er + wc[k] * or - ws[k] * oi; Xi[k] = ei + wc[k] * oi + ws[k] * or; } }
  irfft(Xr, Xi, x) { const M = this.M, zr = this.zr, zi = this.zi, wc = this.wc, ws = this.ws;
    for (let k = 0; k < M; k++) { const cr = Xr[M - k], ci = -Xi[M - k], er = (Xr[k] + cr) * 0.5, ei = (Xi[k] + ci) * 0.5, dr = (Xr[k] - cr) * 0.5, di = (Xi[k] - ci) * 0.5, or = dr * wc[k] + di * ws[k], oi = di * wc[k] - dr * ws[k];
      zr[k] = er - oi; zi[k] = ei + or; }
    this.fft(zr, zi, true); for (let n = 0; n < M; n++) { x[2 * n] = zr[n] / M; x[2 * n + 1] = zi[n] / M; } }
  outline(src, dst) { const K = this.N / 2, ps = this.ps, t = this.tmp, w = Math.max(2, Math.round(150 / sampleRate * this.N));
    for (let pass = 0; pass < 2; pass++) { const a = pass ? t : src, b = pass ? dst : t; ps[0] = 0; for (let k = 0; k <= K; k++) ps[k + 1] = ps[k] + a[k];
      for (let k = 0; k <= K; k++) { const lo = Math.max(0, k - w), hi = Math.min(K, k + w); b[k] = (ps[hi + 1] - ps[lo]) / (hi - lo + 1); } } }
  frame(r, rf, keep, nc) { const N = this.N, H = this.H, K = N / 2, w = this.win, mag = this.mag, ph = this.ph, om = this.om, lg = this.lg, env = this.env, pk = this.pk, own = this.own, TAU = 2 * Math.PI;
    for (let c = 0; c < nc; c++) { const S = this.C[c], x = S.x;
      for (let i = 0, j = this.pos; i < N; i++, j = (j + 1) & (N - 1)) x[i] = S.inp[j] * w[i];
      this.rfft(x, S.re, S.im);
      let top = 0; for (let k = 0; k <= K; k++) { const a = S.re[k], b = S.im[k]; mag[k] = Math.sqrt(a * a + b * b); ph[k] = Math.atan2(b, a); if (mag[k] > top) top = mag[k];
        let d = ph[k] - S.pph[k] - TAU * k * H / N; d -= TAU * Math.round(d / TAU); om[k] = TAU * k * H / N + d; S.pph[k] = ph[k]; }
      const yr = S.yr, yi = S.yi; yr.fill(0); yi.fill(0);
      let en = 0; for (let k = 0; k <= K; k++) en += mag[k] * mag[k]; if (en > 4 * (S.en || 0) + 1e-9) for (let k = 0; k <= K; k++) S.rpsi[k] = ph[k] - om[k] * r; S.en = en;
      if (Math.abs(r - 1) < 1e-4 && !keep) { for (let k = 0; k <= K; k++) { yr[k] = S.re[k]; yi[k] = S.im[k]; S.rpsi[k] = ph[k]; } }
      else {
        let np = 0; const fl = top * 1e-5; for (let k = 2; k < K - 1; k++) if (mag[k] > fl && mag[k] > mag[k - 1] && mag[k] >= mag[k + 1] && mag[k] > mag[k - 2] && mag[k] >= mag[k + 2]) pk[np++] = k;
        if (keep && np && top > 1e-4) { for (let p = 0; p <= np; p++) { const k0 = p ? pk[p - 1] : 0, k1 = p < np ? pk[p] : K, v0 = Math.log(mag[p ? k0 : pk[0]] + 1e-9), v1 = Math.log(mag[p < np ? k1 : pk[np - 1]] + 1e-9);
            for (let k = k0; k <= k1; k++) lg[k] = k1 > k0 ? v0 + (v1 - v0) * (k - k0) / (k1 - k0) : v1; }
          this.outline(lg, env); }
        if (!np) { for (let k = 0; k <= K; k++) S.rpsi[k] = ph[k]; }
        const npsi = this.npsi;
        const shr = Math.min(1, r);
        for (let p = 0; p < np; p++) { const kp = pk[p], a = p ? Math.max(0, kp - Math.floor((kp - pk[p - 1]) * 0.5 * shr)) : Math.max(0, kp - Math.floor(kp * shr)), b = p < np - 1 ? Math.min(K, kp + Math.floor((pk[p + 1] - kp) * 0.5 * shr)) : Math.min(K, kp + Math.floor((K - kp) * shr)), kn = Math.round(kp * r), sh = kn - kp;
          const psi = S.rpsi[kp] + om[kp] * r;
          for (let k = a; k <= b; k++) { own[k] = kp; npsi[k] = psi; const kk = k + sh; if (kk < 1 || kk >= K) continue;
            let g = mag[k]; if (keep && np && top > 1e-4) { const src = kk / rf; let e2; if (src >= K) e2 = env[K]; else { const i0 = Math.floor(src), f = src - i0; e2 = env[i0] + (env[Math.min(K, i0 + 1)] - env[i0]) * f; }
              let d = (e2 - env[k]) * 0.8; d = d > 0.7 ? 0.7 : d < -0.9 ? -0.9 : d; g *= Math.exp(d); }
            const th = psi + ph[k] - ph[kp]; yr[kk] += g * Math.cos(th); yi[kk] += g * Math.sin(th); } }
        for (let k = 0; k <= K; k++) S.rpsi[k] = np ? npsi[k] : S.rpsi[k];
      }
      this.irfft(yr, yi, x);
      for (let i = 0; i < N; i++) S.acc[i] += x[i] * w[i] * 0.5; } }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], n0 = o[0].length, N = this.N, H = this.H, r = Math.pow(2, P.shift[0] / 12), rf = Math.pow(2, P.formant[0] / 12), keep = P.keep[0] >= 0.5;
    let nc = !i || i.length < 2 ? 1 : 2; if (nc === 2) { const a0 = i[0], a1 = i[1]; let same = true; for (let n = 0; n < a0.length; n++) if (a0[n] !== a1[n]) { same = false; break; } if (same) nc = 1; }
    for (let n = 0; n < n0; n++) {
      let q = 0; for (let c = 0; c < nc; c++) { const v = i && i.length ? (i[c] || i[0])[n] : 0; this.C[c].inp[this.pos] = v; if (v !== 0) q = 1; } this.quiet = q ? 0 : this.quiet + 1;
      this.pos = (this.pos + 1) & (N - 1);
      for (let c = 0; c < o.length; c++) o[c][n] = this.C[Math.min(c, nc - 1)].acc[this.oc];
      if (++this.oc >= H) { for (let c = 0; c < nc; c++) { const A = this.C[c].acc; A.copyWithin(0, H); A.fill(0, N); } this.oc = 0; if (this.quiet < N + H) this.frame(r, rf, keep, nc); }
    }
    return true;
  }
}
registerProcessor('nb-pv', PV);
class Micro extends AudioWorkletProcessor {
  static get parameterDescriptors() { const k = (name, d, a, b) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' }); return [k('n', 2, 1, 4), k('cents', 8, 0, 60), k('ms', 10, 1, 40), k('drift', 0.3, 0, 1), k('tape', 0, 0, 1)]; }
  constructor() { super(); this.port.onmessage = e => { if (e.data === 'kill') this.dead = true; }; this.N = 16384; this.b = new Float32Array(this.N); this.w = 0; this.seed = 9;
    this.V = [0, 1, 2, 3].map(j => ({ ph: j * 0.25, dr: 0, dt: 0, nx: 0 })); this.t = 0; }
  rnd() { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296 * 2 - 1; }
  rd(d) { const p = this.w - d, i = Math.floor(p), f = p - i, M = this.N - 1, y0 = this.b[(i - 1) & M], y1 = this.b[i & M], y2 = this.b[(i + 1) & M], y3 = this.b[(i + 2) & M];
    const c1 = 0.5 * (y2 - y0), c2 = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3, c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2); return ((c3 * f + c2) * f + c1) * f + y1; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], n0 = o[0].length, sr = sampleRate, nv = Math.round(P.n[0]), ce = P.cents[0], ms = P.ms[0] * sr / 1000, dft = P.drift[0], tape = P.tape[0] >= 0.5, W = 0.06 * sr;
    const C = [[1, 1, 0], [-1, 1.38, 1], [-0.62, 1.71, 0], [0.62, 2.05, 1]];
    for (let n = 0; n < n0; n++) {
      const x = i && i.length ? ((i[0][n] || 0) + ((i[1] || i[0])[n] || 0)) * 0.5 : 0; this.b[this.w] = x; this.t++;
      let L = 0, R = 0;
      for (let j = 0; j < nv; j++) { const V = this.V[j], c = C[j];
        if (--V.nx <= 0) { V.nx = Math.round(sr * (0.25 + 0.25 * (this.rnd() + 1))); V.dt = this.rnd(); } V.dr += (V.dt - V.dr) * 0.00008;
        let cents = ce * c[0] + V.dr * dft * 4, dly = ms * c[1] + V.dr * dft * 0.002 * sr;
        if (tape && j === 0) { cents = Math.sin(this.t / sr * 2 * Math.PI * 0.9) * 6 + Math.sin(this.t / sr * 2 * Math.PI * 5.3) * 1.5; dly = 0.03 * sr; }
        const r = Math.pow(2, cents / 1200); V.ph += (1 - r) / W; V.ph -= Math.floor(V.ph);
        const p2 = (V.ph + 0.5) % 1, g1 = Math.sin(Math.PI * V.ph), g2 = Math.sin(Math.PI * p2), y = this.rd(V.ph * W + dly + 4) * g1 * g1 + this.rd(p2 * W + dly + 4) * g2 * g2;
        if (tape && nv === 1) { L += y; R += y; } else if (c[2]) R += y; else L += y; }
      const g = nv >= 3 ? 0.75 : 1; o[0][n] = L * g; if (o[1]) o[1][n] = R * g;
      this.w = (this.w + 1) & (this.N - 1);
    }
    return true;
  }
}
registerProcessor('nb-micro', Micro);
class Sway extends AudioWorkletProcessor {
  static get parameterDescriptors() { const k = (name, d, a, b) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' }); return [k('kind', 0, 0, 6), k('rate', 0.5, 0.01, 40), k('depth', 0.5, 0, 1), k('fb', 0, -0.97, 0.97), k('manual', 0.5, 0, 1), k('stages', 8, 2, 12), k('width', 1, 0, 1), k('tone', 0.6, 0, 1)]; }
  constructor() { super(); this.port.onmessage = e => { if (e.data === 'kill') this.dead = true; if (e.data && e.data.at != null) this.ph = e.data.at; };
    this.N = 4096; this.M = this.N - 1; this.bL = new Float32Array(this.N); this.bR = new Float32Array(this.N); this.w = 0; this.ph = 0; this.ph2 = 0;
    this.lpL = [0, 0]; this.lpR = [0, 0]; this.oL2 = [0, 0]; this.oR2 = [0, 0]; this.fbL = 0; this.fbR = 0; this.dampL = 0; this.dampR = 0;
    this.apx = [new Float32Array(12), new Float32Array(12)]; this.apy = [new Float32Array(12), new Float32Array(12)]; this.aL = 0; this.aR = 0; this.pfL = 0; this.pfR = 0;
    this.post = 0; this.taps = [0, 0, 0]; this.fnow = [0, 0]; this.lp = null; this.lpk = -1; }
  rd(b, d) { let p = this.w - d, i = Math.floor(p), f = p - i; const M = this.M, y0 = b[(i - 1) & M], y1 = b[i & M], y2 = b[(i + 1) & M], y3 = b[(i + 2) & M];
    const c1 = 0.5 * (y2 - y0), c2 = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3, c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2); return ((c3 * f + c2) * f + c1) * f + y1; }
  bbd(x) { const a = x < 0 ? -x : x; if (a <= 0.7) return x; const e = a - 0.7, y = 0.7 + e / (1 + 2 * e); return x < 0 ? -y : y; }
  tri(p) { p -= Math.floor(p); return p < 0.5 ? 4 * p - 1 : 3 - 4 * p; }
  lpf(fc) { const sr = sampleRate, w = Math.tan(Math.PI * Math.min(fc, sr * 0.45) / sr), q = 0.7071, n = 1 / (1 + w / q + w * w); return [w * w * n, 2 * w * w * n, w * w * n, 2 * (w * w - 1) * n, (1 - w / q + w * w) * n]; }
  lo(s, x, c) { const y = c[0] * x + s[0]; s[0] = c[1] * x - c[3] * y + s[1]; s[1] = c[2] * x - c[4] * y; return y; }
  process(ins, outs, P) { if (this.dead) return false;
    const i0 = ins[0], o = outs[0], oL = o[0], oR = o[1] || o[0], n0 = oL.length, sr = sampleRate, ms = sr / 1000;
    const iL = i0 && i0.length ? i0[0] : null, iR = i0 && i0.length > 1 ? i0[1] : iL;
    const kind = Math.round(P.kind[0]), rate = P.rate[0], dep = P.depth[0], fb = P.fb[0], man = P.manual[0], st = Math.round(P.stages[0]), wid = P.width[0] * 0.5, tone = P.tone[0];
    const inc = rate / sr, bL = this.bL, bR = this.bR, M = this.M;
    if (this.lpk !== tone) { this.lpk = tone; this.lp = this.lpf(3000 * Math.pow(6, tone)); }
    const C = this.lp;
    if (kind === 4) {
      const fc = 100 * Math.pow(40, man), oct = dep * 3, ax = this.apx, ay = this.apy;
      for (let n = 0; n < n0; n++) {
        if ((n & 15) === 0) { const s1 = Math.sin(2 * Math.PI * this.ph), s2 = Math.sin(2 * Math.PI * (this.ph + wid));
          const fL = fc * Math.pow(2, oct * s1), fR = fc * Math.pow(2, oct * s2), tL = Math.tan(Math.PI * Math.min(fL, sr * 0.45) / sr), tR = Math.tan(Math.PI * Math.min(fR, sr * 0.45) / sr);
          this.taL = (tL - 1) / (tL + 1); this.taR = (tR - 1) / (tR + 1); this.dL = (this.taL - this.aL) / 16; this.dR = (this.taR - this.aR) / 16; this.fnow[0] = fL; this.fnow[1] = fR; }
        this.aL += this.dL; this.aR += this.dR; this.ph += inc; if (this.ph >= 1) this.ph -= 1;
        const xl = iL ? iL[n] : 0, xr = iR ? iR[n] : 0;
        let u = xl + fb * this.pfL, v = xr + fb * this.pfR; u = u > 2 ? 2 : u < -2 ? -2 : u; v = v > 2 ? 2 : v < -2 ? -2 : v;
        for (let s = 0; s < st; s++) { const yl = this.aL * u + ax[0][s] - this.aL * ay[0][s]; ax[0][s] = u; ay[0][s] = yl; u = yl; const yr = this.aR * v + ax[1][s] - this.aR * ay[1][s]; ax[1][s] = v; ay[1][s] = yr; v = yr; }
        this.pfL = u; this.pfR = v; oL[n] = u; if (o[1]) oR[n] = v; }
    } else {
      for (let n = 0; n < n0; n++) {
        const xl = iL ? iL[n] : 0, xr = iR ? iR[n] : 0; let yl = 0, yr = 0;
        this.ph += inc; if (this.ph >= 1) this.ph -= 1;
        if (kind <= 2) {
          const c = 3.5 * ms, sw = (kind === 0 ? 0.5 : kind === 1 ? 1.1 : 0.3) * ms * dep * 2, a = this.tri(this.ph), b2 = this.tri(this.ph + wid);
          bL[this.w] = this.bbd(this.lo(this.lpL, xl, C)); bR[this.w] = this.bbd(this.lo(this.lpR, xr, C));
          const dl = c + sw * a, dr = c + sw * b2; yl = this.rd(bL, dl); yr = this.rd(bR, dr); this.taps[0] = dl; this.taps[1] = dr; this.taps[2] = 0;
        } else if (kind === 5) {
          const m = (xl + xr) * 0.5, c = 4 * ms, sw = (0.2 + dep * 1.6) * ms, a = this.tri(this.ph), x = 0.25 + dep * 0.35;
          bL[this.w] = this.bbd(this.lo(this.lpL, m, C)); const d1 = c + sw * a, d2 = c - sw * a, w1 = this.rd(bL, d1), w2 = this.rd(bL, d2);
          yl = w1 - x * w2; yr = w2 - x * w1; this.taps[0] = d1; this.taps[1] = d2; this.taps[2] = 0;
        } else if (kind === 6) {
          this.ph2 += 6.1 / sr; if (this.ph2 >= 1) this.ph2 -= 1;
          const m = (xl + xr) * 0.5, c = 5 * ms, s1 = (0.4 + dep * 2.2) * ms, s2 = (0.05 + dep * 0.3) * ms;
          bL[this.w] = this.bbd(this.lo(this.lpL, m, C)); let v3 = [0, 0, 0];
          for (let k = 0; k < 3; k++) { const d = c + s1 * Math.sin(2 * Math.PI * (this.ph + k / 3)) + s2 * Math.sin(2 * Math.PI * (this.ph2 + k / 3)); this.taps[k] = d; v3[k] = this.rd(bL, d); }
          yl = (v3[0] + 0.5 * v3[1]) * 0.8; yr = (v3[2] + 0.5 * v3[1]) * 0.8;
        } else {
          const d0 = 0.2 * Math.pow(40, man) * ms, r = 1 + dep * 7, a = 0.5 + 0.5 * Math.sin(2 * Math.PI * this.ph), b2 = 0.5 + 0.5 * Math.sin(2 * Math.PI * (this.ph + wid));
          const dl = Math.min(this.N - 4, d0 * Math.pow(r, a)), dr = Math.min(this.N - 4, d0 * Math.pow(r, b2)), k = 0.15 + tone * 0.85;
          this.dampL += (this.fbL - this.dampL) * k; this.dampR += (this.fbR - this.dampR) * k;
          bL[this.w] = xl + fb * Math.tanh(this.dampL); bR[this.w] = xr + fb * Math.tanh(this.dampR);
          yl = this.rd(bL, Math.max(1, dl)); yr = this.rd(bR, Math.max(1, dr)); this.fbL = yl; this.fbR = yr; this.taps[0] = dl; this.taps[1] = dr; this.taps[2] = 0;
        }
        if (kind !== 3) { yl = this.lo(this.oL2, yl, C); yr = this.lo(this.oR2, yr, C); }
        oL[n] = yl; if (o[1]) oR[n] = yr; this.w = (this.w + 1) & M;
      }
    }
    this.post += n0; if (this.post > sr / 30) { this.post = 0; this.port.postMessage({ d: [this.taps[0] / ms, this.taps[1] / ms, this.taps[2] / ms], f: [this.fnow[0], this.fnow[1]], ph: this.ph }); }
    return true;
  }
}
registerProcessor('nb-sway', Sway);
class Spread extends AudioWorkletProcessor {
  static get parameterDescriptors() { const k = (name, d, a, b) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' }); return [k('width', 1, 0, 2), k('lw', 1, 0, 2), k('mw', 1, 0, 2), k('hw', 1, 0, 2), k('x1', 200, 20, 2000), k('x2', 4000, 500, 18000), k('mono', 0, 0, 500), k('st', 0, 0, 1), k('haas', 0, 0, 0.03)]; }
  constructor() { super(); this.port.onmessage = e => { if (e.data === 'kill') this.dead = true; };
    this.F = [0, 1].map(() => Array.from({ length: 16 }, () => [0, 0])); this.fx = 0; this.c1 = null; this.c2 = null; this.c3 = null; this.k1 = -1; this.k2 = -1; this.k3 = -1;
    const sr = sampleRate; this.ad = [Math.round(sr * 0.0031), Math.round(sr * 0.0047), Math.round(sr * 0.0073)]; this.ab = this.ad.map(d => new Float32Array(d)); this.ai = [0, 0, 0];
    this.hp = 0; this.hx = 0; this.N = 4096; this.hb = new Float32Array(this.N); this.hw = 0; this.acc = [0, 0, 0, 0]; this.post = 0; }
  bw(fc, hi) { const sr = sampleRate, w = Math.tan(Math.PI * Math.min(fc, sr * 0.45) / sr), q = Math.SQRT1_2, n = 1 / (1 + w / q + w * w);
    return hi ? [n, -2 * n, n, 2 * (w * w - 1) * n, (1 - w / q + w * w) * n] : [w * w * n, 2 * w * w * n, w * w * n, 2 * (w * w - 1) * n, (1 - w / q + w * w) * n]; }
  run(s, x, c) { const y = c[0] * x + s[0]; s[0] = c[1] * x - c[3] * y + s[1]; s[1] = c[2] * x - c[4] * y; return y; }
  process(ins, outs, P) { if (this.dead) return false;
    const i0 = ins[0], o = outs[0], oL = o[0], oR = o[1] || o[0], n0 = oL.length, sr = sampleRate;
    const iL = i0 && i0.length ? i0[0] : null, iR = i0 && i0.length > 1 ? i0[1] : iL;
    const W = P.width[0], lw = P.lw[0], mw = P.mw[0], hw = P.hw[0], x1 = P.x1[0], x2 = Math.max(P.x2[0], x1 * 1.5), mf = P.mono[0], st = P.st[0], hz = Math.round(P.haas[0] * sr);
    if (this.k1 !== x1) { this.k1 = x1; this.c1 = this.bw(x1, 0); this.c1h = this.bw(x1, 1); }
    if (this.k2 !== x2) { this.k2 = x2; this.c2 = this.bw(x2, 1); this.c2l = this.bw(x2, 0); }
    if (mf > 0 && this.k3 !== mf) { this.k3 = mf; this.c3 = this.bw(mf, 0); this.c3h = this.bw(mf, 1); }
    const need = lw !== mw || hw !== mw || mf > 0, ka = 1 - Math.exp(-2 * Math.PI * 150 / sr), A = this.acc, hb = this.hb, HM = this.N - 1, kf = 1 - Math.exp(-1 / (sr * 0.004));
    const c1 = this.c1, h1 = this.c1h, c2 = this.c2, l2 = this.c2l, c3 = this.c3, h3 = this.c3h, F = this.F;
    for (let n = 0; n < n0; n++) {
      const l = iL ? iL[n] : 0, r = iR ? iR[n] : 0; let m = (l + r) * 0.5, s = (l - r) * 0.5;
      this.fx += ((need ? 1 : 0) - this.fx) * kf;
      if (this.fx > 1e-4) {
        let mo = 0, so = 0;
        for (let j = 0; j < 2; j++) { const x = j ? s : m, f = F[j];
          let lo = this.run(f[1], this.run(f[0], x, c1), c1), rs = this.run(f[3], this.run(f[2], x, h1), h1);
          let md = this.run(f[5], this.run(f[4], rs, l2), l2), hi = this.run(f[7], this.run(f[6], rs, c2), c2);
          lo = this.run(f[9], this.run(f[8], lo, l2), l2) + this.run(f[11], this.run(f[10], lo, c2), c2);
          let y = j ? lw * lo + mw * md + hw * hi : lo + md + hi;
          if (mf > 0) { const yl = this.run(f[13], this.run(f[12], y, c3), c3), yh = this.run(f[15], this.run(f[14], y, h3), h3); y = j ? yh : yl + yh; }
          if (j) so = y; else mo = y; }
        m = m + (mo - m) * this.fx; s = s * mw + (so - s * mw) * this.fx;
      } else s *= mw;
      s *= W;
      if (st > 0) {
        this.hp += (m - this.hp) * ka; let u = m - this.hp;
        for (let k = 0; k < 3; k++) { const b = this.ab[k], i = this.ai[k], d = b[i], y = -0.6 * u + d; b[i] = u + 0.6 * y; this.ai[k] = (i + 1) % b.length; u = y; }
        s += st * 0.8 * u; }
      let L = m + s, R = m - s;
      if (hz > 0) { hb[this.hw] = R; R = hb[(this.hw - hz + this.N) & HM]; this.hw = (this.hw + 1) & HM; } else { hb[this.hw] = R; this.hw = (this.hw + 1) & HM; }
      oL[n] = L; if (o[1]) oR[n] = R; A[0] += L * R; A[1] += L * L; A[2] += R * R; }
    this.post += n0; if (this.post > sr / 30) { this.post = 0; const d = Math.sqrt(A[1] * A[2]); this.port.postMessage({ c: d > 1e-12 ? A[0] / d : 1, l: A[1], r: A[2] }); A[0] = A[1] = A[2] = 0; }
    return true;
  }
}
registerProcessor('nb-spread', Spread);
class Puppet extends AudioWorkletProcessor {
  static get parameterDescriptors() { const k = (name, d, a, b) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' }); return [k('shape', 0, 0, 7), k('rate', 1, 0.001, 50), k('phase', 0, 0, 1), k('smooth', 0, 0, 1), k('att', 0.01, 0.0005, 1), k('rel', 0.15, 0.005, 3), k('gain', 1, 0, 40)]; }
  constructor(opt) { super(); const P = (opt && opt.processorOptions) || {}; this.port.onmessage = e => { if (e.data === 'kill') this.dead = true; if (e.data && e.data.at != null) { this.ph = e.data.at; } };
    this.ph = P.at || 0; this.seed = (P.seed || 777) >>> 0; this.cur = this.rnd() * 2 - 1; this.nxt = this.rnd() * 2 - 1; this.y = 0; this.env = 0; this.post = 0; this.last = 0; }
  rnd() { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; }
  process(ins, outs, P) { if (this.dead) return false;
    const o = outs[0][0], i = ins[0], n0 = o.length, sr = sampleRate, sh = Math.round(P.shape[0]), inc = P.rate[0] / sr, ph0 = P.phase[0], sm = P.smooth[0], ks = sm > 0.001 ? 1 - Math.exp(-1 / (sr * (0.0005 + sm * sm * 0.25))) : 1;
    const ka = 1 - Math.exp(-1 / (sr * P.att[0])), kr = 1 - Math.exp(-1 / (sr * P.rel[0])), gn = P.gain[0];
    for (let n = 0; n < n0; n++) {
      let v;
      if (sh === 7) { let x = 0; if (i && i.length) { for (let c = 0; c < i.length; c++) { const q = i[c][n]; x += q < 0 ? -q : q; } x /= i.length; } this.env += (x - this.env) * (x > this.env ? ka : kr); v = Math.min(1, this.env * gn); }
      else { this.ph += inc; if (this.ph >= 1) { this.ph -= 1; this.cur = this.nxt; this.nxt = this.rnd() * 2 - 1; }
        let p = this.ph + ph0; p -= Math.floor(p);
        v = sh === 0 ? Math.sin(2 * Math.PI * p) : sh === 1 ? (p < 0.5 ? 4 * p - 1 : 3 - 4 * p) : sh === 2 ? 2 * p - 1 : sh === 3 ? 1 - 2 * p : sh === 4 ? (p < 0.5 ? 1 : -1) : sh === 5 ? this.cur : this.cur + (this.nxt - this.cur) * (0.5 - 0.5 * Math.cos(Math.PI * this.ph)); }
      this.y += (v - this.y) * ks; o[n] = this.y; }
    this.post += n0; if (this.post > sr / 30) { this.post = 0; this.port.postMessage(this.y); }
    return true;
  }
}
registerProcessor('nb-puppet', Puppet);
class Salve extends AudioWorkletProcessor {
  static get parameterDescriptors() { const k = (name, d, a, b) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' }); return [k('depth', 6, 0, 24), k('sense', 6, 0.5, 18), k('sharp', 0.5, 0, 1), k('lo', 200, 20, 20000), k('hi', 12000, 20, 20000), k('speed', 0.5, 0, 1), k('delta', 0, 0, 1), k('mix', 1, 0, 1)]; }
  constructor() { super(); this.port.onmessage = e => { if (e.data === 'kill') this.dead = true; };
    const N = this.N = 1024, H = this.H = 256; this.win = new Float32Array(N); for (let i = 0; i < N; i++) this.win[i] = Math.sqrt(0.5 - 0.5 * Math.cos(2 * Math.PI * i / N));
    const M = this.M = N / 2; this.rev = new Uint16Array(M); for (let i = 0, j = 0; i < M; i++) { this.rev[i] = j; let b = M >> 1; while (j & b) { j ^= b; b >>= 1; } j |= b; }
    this.cs = new Float64Array(M / 2); this.sn = new Float64Array(M / 2); for (let i = 0; i < M / 2; i++) { this.cs[i] = Math.cos(2 * Math.PI * i / M); this.sn[i] = -Math.sin(2 * Math.PI * i / M); }
    this.wc = new Float64Array(M + 1); this.ws = new Float64Array(M + 1); for (let k = 0; k <= M; k++) { this.wc[k] = Math.cos(2 * Math.PI * k / N); this.ws[k] = -Math.sin(2 * Math.PI * k / N); }
    this.zr = new Float64Array(M); this.zi = new Float64Array(M); this.lin = new Float64Array(M + 1);
    const ch = () => ({ inp: new Float32Array(N), acc: new Float32Array(N + H), re: new Float64Array(M + 1), im: new Float64Array(M + 1), x: new Float64Array(N) });
    this.C = [ch(), ch()]; this.pos = 0; this.oc = 0; this.mag = new Float64Array(N / 2 + 1); this.lg = new Float64Array(N / 2 + 1); this.ps = new Float64Array(N / 2 + 2); this.g = new Float64Array(N / 2 + 1);
    this.show = new Float32Array(48); this.post = 0; this.mixd = 1; }
  fft(re, im, inv) { const N = this.M, rv = this.rev, cs = this.cs, sn = this.sn;
    for (let i = 0; i < N; i++) { const j = rv[i]; if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let size = 2; size <= N; size <<= 1) { const half = size >> 1, step = N / size;
      for (let j = 0; j < half; j++) { const c = cs[j * step], s = inv ? -sn[j * step] : sn[j * step];
        for (let a = j; a < N; a += size) { const b = a + half, tr = re[b] * c - im[b] * s, ti = re[b] * s + im[b] * c; re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti; } } } }
  rfft(x, Xr, Xi) { const M = this.M, zr = this.zr, zi = this.zi, wc = this.wc, ws = this.ws; for (let n = 0; n < M; n++) { zr[n] = x[2 * n]; zi[n] = x[2 * n + 1]; } this.fft(zr, zi, false);
    for (let k = 0; k <= M; k++) { const a = k % M, b = (M - k) % M, er = (zr[a] + zr[b]) * 0.5, ei = (zi[a] - zi[b]) * 0.5, or = (zi[a] + zi[b]) * 0.5, oi = -(zr[a] - zr[b]) * 0.5;
      Xr[k] = er + wc[k] * or - ws[k] * oi; Xi[k] = ei + wc[k] * oi + ws[k] * or; } }
  irfft(Xr, Xi, x) { const M = this.M, zr = this.zr, zi = this.zi, wc = this.wc, ws = this.ws;
    for (let k = 0; k < M; k++) { const cr = Xr[M - k], ci = -Xi[M - k], er = (Xr[k] + cr) * 0.5, ei = (Xi[k] + ci) * 0.5, dr = (Xr[k] - cr) * 0.5, di = (Xi[k] - ci) * 0.5, or = dr * wc[k] + di * ws[k], oi = di * wc[k] - dr * ws[k];
      zr[k] = er - oi; zi[k] = ei + or; }
    this.fft(zr, zi, true); for (let n = 0; n < M; n++) { x[2 * n] = zr[n] / M; x[2 * n + 1] = zi[n] / M; } }
  frame(P, nc) { const N = this.N, K = N / 2, sr = sampleRate, w = this.win, C = this.C;
    for (let c = 0; c < nc; c++) { const S = C[c], x = S.x; for (let i = 0, j = this.pos; i < N; i++, j = (j + 1) & (N - 1)) x[i] = S.inp[j] * w[i]; this.rfft(x, S.re, S.im); }
    const mag = this.mag, lg = this.lg, ps = this.ps, g = this.g;
    for (let k = 0; k <= K; k++) { let m = 0; for (let c = 0; c < nc; c++) m += C[c].re[k] * C[c].re[k] + C[c].im[k] * C[c].im[k]; mag[k] = m; lg[k] = 10 * Math.log10(m + 1e-20); }
    ps[0] = 0; for (let k = 0; k <= K; k++) ps[k + 1] = ps[k] + mag[k];
    const depth = P.depth, sense = P.sense, frac = 0.06 + (1 - P.sharp) * 0.3, lo = Math.floor(P.lo / sr * N), hi = Math.ceil(P.hi / sr * N);
    const att = 0.6, rel = 0.04 + (1 - P.speed) * 0.02 + P.speed * 0.3;
    for (let k = 1; k < K; k++) {
      const wk = Math.max(12, Math.round(k * frac)), a = Math.max(1, k - wk), b = Math.min(K, k + wk), ea = Math.max(a, k - 3), eb = Math.min(b, k + 3), ref = 10 * Math.log10((ps[b + 1] - ps[a] - (ps[eb + 1] - ps[ea])) / Math.max(1, (b - a + 1) - (eb - ea + 1)) + 1e-20);
      let t = 0; if (k >= lo && k <= hi) { const ex = lg[k] - ref - sense; if (ex > 0) t = -Math.min(depth, ex * 0.8); }
      g[k] += (t - g[k]) * (t < g[k] ? att : rel); }
    g[0] = g[1]; g[K] = g[K - 1];
    const gs = this.gs || (this.gs = new Float64Array(K + 1)); for (let k = 1; k < K; k++) gs[k] = g[k - 1] * 0.25 + g[k] * 0.5 + g[k + 1] * 0.25; gs[0] = gs[1]; gs[K] = gs[K - 1];
    const delta = P.delta >= 0.5;
    const lin = this.lin; for (let k = 0; k <= K; k++) { let l = Math.pow(10, gs[k] / 20); lin[k] = delta ? 1 - l : l; }
    for (let c = 0; c < nc; c++) { const S = C[c], x = S.x;
      for (let k = 0; k <= K; k++) { S.re[k] *= lin[k]; S.im[k] *= lin[k]; }
      this.irfft(S.re, S.im, x);
      for (let i = 0; i < N; i++) S.acc[i] += x[i] * w[i] * 0.5; }
    const sh = this.show; for (let j = 0; j < 48; j++) { const f0 = 40 * Math.pow(500, j / 48), f1 = 40 * Math.pow(500, (j + 1) / 48); let m = 0; for (let k = Math.max(1, Math.floor(f0 / sr * N)); k <= Math.min(K, Math.ceil(f1 / sr * N)); k++) m = Math.min(m, g[k]); sh[j] = sh[j] * 0.6 + m * 0.4; }
  }
  process(ins, outs, P0) { if (this.dead) return false;
    const i = ins[0], o = outs[0], n0 = o[0].length, N = this.N, H = this.H;
    const P = { depth: P0.depth[0], sense: P0.sense[0], sharp: P0.sharp[0], lo: P0.lo[0], hi: P0.hi[0], speed: P0.speed[0], delta: P0.delta[0], mix: P0.mix[0] };
    let nc = !i || i.length < 2 ? 1 : 2; if (nc === 2) { const a0 = i[0], a1 = i[1]; let same = true; for (let n = 0; n < a0.length; n++) if (a0[n] !== a1[n]) { same = false; break; } if (same) nc = 1; }
    for (let n = 0; n < n0; n++) {
      for (let c = 0; c < nc; c++) { const S = this.C[c], x = i && i.length ? (i[c] || i[0])[n] : 0; S.inp[this.pos] = x; }
      this.pos = (this.pos + 1) % N;
      for (let c = 0; c < o.length; c++) { const S = this.C[Math.min(c, nc - 1)], dry = S.inp[this.pos], wet = S.acc[this.oc]; o[c][n] = P.delta >= 0.5 ? wet : wet * P.mix + dry * (1 - P.mix); }
      this.oc++;
      if (this.oc >= H) { for (let c = 0; c < nc; c++) { const A = this.C[c].acc; A.copyWithin(0, H); A.fill(0, N); } this.oc = 0; this.frame(P, nc); }
    }
    this.post += n0; if (this.post > sampleRate / 30) { this.post = 0; this.port.postMessage(this.show.slice(0)); }
    return true;
  }
}
registerProcessor('nb-salve', Salve);
class Brass extends AudioWorkletProcessor {
  constructor(opt) {
    super(); const P = (opt && opt.processorOptions) || {}, s = P.s || {}, d = (v, x) => v == null ? x : v, ix = (v, n) => Math.min(n - 1, Math.max(0, Math.floor((v || 0) * n)));
    this.port.onmessage = e => { const m = e.data; if (m === 'kill') this.dead = true; if (m === 'off' && this.relAt < 0) this.relAt = currentTime; };
    const sr = sampleRate; this.start = P.start || 0; this.relAt = P.dur == null || P.dur < 0 ? -1 : this.start + P.dur;
    const f = this.f = P.f || 220, vel = this.vel = d(P.vel, 0.8), md = this.md = ix(d(s.model, 0), 5); this.seed = (P.seed || 4242) >>> 0;
    this.at = md <= 2 ? 0.0015 + Math.pow(d(s.att, 0.25), 2) * 0.4 : 0.008 + Math.pow(d(s.att, 0.25), 2) * 1.5; this.rt = 0.02 + Math.pow(d(s.rel, 0.25), 2) * 2; this.env = 0;
    this.vd = d(s.vib, 0.2) * 0.005; this.vr = 4.8 + d(s.vrate, 0.4) * 2.5; this.vdel = 0.15 + d(s.vdelay, 0.4) * 0.8; this.vph = this.rnd();
    this.breath = d(s.breath, 0.2) * 0.06;
    this.scoop = d(s.scoop, 0.2) * 2; this.sct = 0.03 + d(s.scoop, 0.2) * 0.12;
    if (md <= 2) {
      if (!Brass.T) { const N = 4096, t = new Float64Array(N + 1); for (let i = 0; i <= N; i++) t[i] = Math.sin(2 * Math.PI * i / N); Brass.T = t; }
      const n = md === 2 ? 3 : 1, spread = d(s.spread, 0.3) * 14, F = (md === 1 ? 450 : 1250) * Math.pow(2, (d(s.tone, 0.5) - 0.5) * 1.5);
      this.beta = 0.12 + d(s.edge, 0.5) * 0.3 * (md === 1 ? 0.7 : 1); this.blow = 0.35 + vel * 0.65;
      this.V = [];
      for (let k = 0; k < n; k++) { const fk = f * Math.pow(2, (n === 1 ? 0 : (k - 1) * spread) / 1200), H = Math.max(1, Math.min(40, Math.floor(sr * 0.45 / fk))), W = new Float64Array(H + 1); let ss = 0;
        for (let h = 1; h <= H; h++) { const lg = Math.log2(h * fk / F); W[h] = Math.pow(h, -0.6) * (1 + 2.5 * Math.exp(-lg * lg / 0.8)); ss += W[h] * W[h]; }
        const nm = 1 / Math.sqrt(ss); for (let h = 1; h <= H; h++) W[h] *= nm;
        this.V.push({ inc: fk / sr, ph: this.rnd(), H, W, del: k * 0.015 * sr, gain: (k === 1 ? 1 : 0.8) / Math.sqrt(n), pan: n === 1 ? 0 : (k - 1) * 0.6, jit: 0 }); }
      const w = 2 * Math.PI * Math.min(sr * 0.4, F * 1.4) / sr, al = Math.sin(w) / 2.4; this.nb = { b0: al / (1 + al), b2: -al / (1 + al), a1: -2 * Math.cos(w) / (1 + al), a2: (1 - al) / (1 + al), x1: 0, x2: 0, y1: 0, y2: 0 };
    } else {
      const spread = 3 + d(s.spread, 0.3) * 14; this.O = [-1, 0, 1].map(k => ({ ph: this.rnd(), inc: f * Math.pow(2, k * spread / 1200) / sr, pan: k * 0.7 }));
      this.fc0 = 200 + d(s.tone, 0.5) * 900; this.fca = (md === 4 ? 6000 : 3500) * (0.3 + vel * 0.7) * (0.5 + d(s.edge, 0.5)); this.fat = md === 4 ? 0.004 : this.at * 1.6 + 0.02;
      this.fdt = md === 4 ? 0.09 : 0.35; this.fs = md === 4 ? 0.15 : 0.55; this.res = md === 4 ? 0.45 : 0.15; this.fe = 0; this.fst = 0;
      this.Z = [0, 0, 0, 0]; this.ZR = [0, 0, 0, 0];
    }
    this.vol = d(s.vol, 0.75) * [0.6, 0.65, 0.6, 1.6, 1.8][md]; this.done = 0; this.t0 = -1; this.dcl = 0; this.dxl = 0; this.dcr = 0; this.dxr = 0; this.kdc = 1 - 2 * Math.PI * 15 / sr;
    this.wid = d(s.wide, 0.5);
  }
  rnd() { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; }
  static rd(b, m, w, L) { const p = w - L, i = Math.floor(p), fr = p - i; return b[i & m] * (1 - fr) + b[(i + 1) & m] * fr; }
  static lad(Z, x, g, res) { const fb = Z[3] * res * 4; let u = Math.tanh(x - fb); for (let i = 0; i < 4; i++) { Z[i] += g * (u - Z[i]); u = Z[i]; } return Z[3]; }
  static get parameterDescriptors() { return [BEND]; }
  process(ins, outs, P) { if (this.dead) return false; const bm = bendOf(P);
    const o = outs[0], Lo = o[0], Ro = o[1] || null, n0 = Lo.length, sr = sampleRate, md = this.md;
    let loud = 0;
    for (let n = 0; n < n0; n++) { const tt = currentTime + n / sr;
      if (tt < this.start) { Lo[n] = 0; if (Ro) Ro[n] = 0; continue; }
      if (this.t0 < 0) this.t0 = tt; const age = tt - this.t0, rel = this.relAt >= 0 && tt >= this.relAt;
      if (!rel) this.env += (1 - this.env) * (3 / (this.at * sr)); else this.env -= this.env * (3 / (this.rt * sr));
      const vfade = Math.min(1, Math.max(0, (age - this.vdel) / 0.4)), vib = Math.sin(2 * Math.PI * this.vph) * vfade; this.vph += this.vr / sr;
      const sc = Math.pow(2, -this.scoop * Math.exp(-age / this.sct) / 12) * bm;
      let y = 0, yr = 0;
      if (md <= 2) { const V = this.V, T = Brass.T, L = this.env * this.blow, b = this.beta;
        const nz = this.rnd() * 2 - 1, B = this.nb, nv = B.b0 * nz + B.b2 * B.x2 - B.a1 * B.y1 - B.a2 * B.y2; B.x2 = B.x1; B.x1 = nz; B.y2 = B.y1; B.y1 = nv; const breath = nv * this.breath * 6 * L;
        for (let k = 0; k < V.length; k++) { const v = V[k]; if (age * sr < v.del) continue;
          v.jit += ((this.rnd() - 0.5) * 0.004 - v.jit) * 0.002;
          v.ph += v.inc * sc * (1 + vib * this.vd + v.jit); if (v.ph >= 1) v.ph -= 1;
          let out = 0, Lp = L, step = Math.pow(Math.max(1e-6, L), b);
          for (let h = 1; h <= v.H; h++) { const p = v.ph * h, fr = p - Math.floor(p), x = fr * 4096, i = x | 0; out += v.W[h] * Lp * (T[i] + (T[i + 1] - T[i]) * (x - i)); Lp *= step; }
          out = out * v.gain + breath; y += out * (1 - v.pan) * 0.7; yr += out * (1 + v.pan) * 0.7; }
        if (V.length === 1) yr = y;
      } else {
        let l = 0, r = 0; for (const q of this.O) { const inc = q.inc * sc * (1 + vib * this.vd); q.ph += inc; if (q.ph >= 1) q.ph -= 1; let v = 2 * q.ph - 1, t = q.ph; if (t < inc) { t /= inc; v -= t + t - t * t - 1; } else if (t > 1 - inc) { t = (t - 1) / inc; v -= t * t + t + t + 1; } l += v * (1 - q.pan * this.wid); r += v * (1 + q.pan * this.wid); }
        if (!rel) { if (this.fst === 0) { this.fe += (1 - this.fe) * (3 / (this.fat * sr)); if (this.fe > 0.98) this.fst = 1; } else this.fe += (this.fs - this.fe) * (3 / (this.fdt * sr)); } else this.fe -= this.fe * (3 / (this.rt * sr));
        const fc = Math.min(sr * 0.4, this.fc0 + this.fca * this.fe), g = 1 - Math.exp(-2 * Math.PI * fc / sr);
        y = Brass.lad(this.Z, l * 0.25 * this.env, g, this.res); yr = Brass.lad(this.ZR, r * 0.25 * this.env, g, this.res);
      }
      y *= this.vol; yr *= this.vol;
      this.dcl = this.kdc * (this.dcl + y - this.dxl); this.dxl = y; this.dcr = this.kdc * (this.dcr + yr - this.dxr); this.dxr = yr;
      const a = this.dcl, b2 = this.dcr, aa = a < 0 ? -a : a; if (aa > loud) loud = aa;
      Lo[n] = a; if (Ro) Ro[n] = b2;
    }
    if (this.relAt >= 0 && currentTime > this.relAt && loud < 2e-5) { if (++this.done > 8) return false; } else this.done = 0;
    return true;
  }
}
registerProcessor('nb-brass', Brass);
class Bow extends AudioWorkletProcessor {
  constructor(opt) {
    super(); const P = (opt && opt.processorOptions) || {}, s = P.s || {}, d = (v, x) => v == null ? x : v, ix = (v, n) => Math.min(n - 1, Math.max(0, Math.floor((v || 0) * n)));
    this.port.onmessage = e => { const m = e.data; if (m === 'kill') this.dead = true; if (m === 'off' && this.relAt < 0) this.relAt = currentTime; };
    const sr = sampleRate; this.start = P.start || 0; this.relAt = P.dur == null || P.dur < 0 ? -1 : this.start + P.dur;
    const f = this.f = P.f || 220, vel = this.vel = d(P.vel, 0.8), md = this.md = ix(d(s.model, 0), 5);
    this.seed = (P.seed || 99991) >>> 0;
    this.at = 0.005 + Math.pow(d(s.att, 0.3), 2) * 2.5; this.rt = 0.03 + Math.pow(d(s.rel, 0.3), 2) * 3; this.bw = 0;
    this.bmax = 0.03 + vel * 0.22;
    const mm = 69 + 12 * Math.log2(f / 440), pe = Math.min(1, d(s.press, 0.5) + Math.max(0, mm - (md === 1 ? 55 : 67)) / 24 * 0.4); this.slope = 5 - pe * 3.8; this.pos = 0.05 + d(s.spot, 0.35) * 0.25;
    this.vd = d(s.vib, 0.3) * 0.006; this.vr = 4.5 + d(s.vrate, 0.4) * 3; this.vdel = 0.1 + d(s.vdelay, 0.35) * 0.8; this.vph = this.rnd() * 0.5 + 0.5;
    const bodyScale = md === 1 ? 0.5 : 1;
    const n = md === 2 ? 3 : 1, spread = d(s.spread, 0.3) * 12;
    this.S = [];
    if (md <= 2) for (let k = 0; k < n; k++) {
      const fk = f * Math.pow(2, (n === 1 ? 0 : (k - 1) * spread) / 1200), w0 = 2 * Math.PI * fk / sr, L = sr / fk - Math.atan2(0.66 * Math.sin(w0), 1 - 0.66 * Math.cos(w0)) / w0, size = (() => { let z = 1; while (z < L * 2 + 8) z <<= 1; return z; })();
      this.S.push({ L, nk: new Float32Array(size), br: new Float32Array(size), m: size - 1, w: 0, lp: 0, f: fk, del: k * 0.012 * sr, gain: (k === 1 ? 1 : 0.8) / Math.sqrt(n), vph: this.rnd() });
    }
    else if (md === 3) {
      this.osc = [0, 1].map(k => ({ ph: this.rnd(), inc: f * Math.pow(2, (k ? 1 : -1) * (2 + spread) / 1200) / sr }));
      const cd = Math.ceil(sr * 0.03); this.cb = new Float32Array(cd); this.cm = cd; this.cw = 0; this.cph = [0, 1 / 3, 2 / 3]; this.cinc = 0.6 / sr; this.cinc2 = 6.5 / sr;
      this.lp1 = 0; this.lp2 = 0; this.kl = 1 - Math.exp(-2 * Math.PI * Math.min(9000, 2200 + d(s.tone, 0.5) * 5000) / sr);
    } else {
      const L = sr / f - 1.2; let size = 1; while (size < L * 2 + 8) size <<= 1;
      this.Pz = { b: new Float32Array(size), m: size - 1, w: 0, L, lp: 0, g: Math.pow(10, -3 / ((0.4 + d(s.rel, 0.3) * 1.5) * Math.pow(2, -(Math.log2(f / 220)) * 0.4) * f)) };
      const pl = Math.round(sr / f * 0.45); for (let i = 0; i < pl; i++) this.Pz.b[i] = Math.sin(Math.PI * i / pl) * vel * 0.9;
      this.Pz.w = pl;
    }
    const bq = (fc, q, gain) => { const w = 2 * Math.PI * fc / sr, al = Math.sin(w) / (2 * q), A = Math.pow(10, gain / 40), a0 = 1 + al / A; return { b0: (1 + al * A) / a0, b1: -2 * Math.cos(w) / a0, b2: (1 - al * A) / a0, a1: -2 * Math.cos(w) / a0, a2: (1 - al / A) / a0, x1: 0, x2: 0, y1: 0, y2: 0 }; };
    const bd = d(s.body, 0.5);
    this.B = md <= 2 || md === 4 ? [bq(280 * bodyScale, 4, 6 * bd + 2), bq(460 * bodyScale, 3, 5 * bd), bq(550 * bodyScale, 3.5, 6 * bd), bq(2500 * (md === 1 ? 0.7 : 1), 1.2, 4 * bd), bq(4200, 1, -4)]
      : [bq(600, 1.4, 4 * bd), bq(1800, 2, 3 * bd), bq(3500, 2, -2)];
    this.BR = this.B.map(F => Object.assign({}, F));
    this.kt = 1 - Math.exp(-2 * Math.PI * (1800 * Math.pow(8, d(s.tone, 0.5))) / sr); this.tl = 0; this.tr = 0; this.dcr = 0; this.dxr = 0;
    this.vol = d(s.vol, 0.75) * [1.5, 1.5, 1.4, 0.55, 1][md]; this.dc = 0; this.dx = 0; this.kdc = 1 - 2 * Math.PI * 15 / sr; this.done = 0; this.t0 = -1;
    this.wid = d(s.wide, 0.5); this.chL = 0; this.chR = 0;
  }
  rnd() { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; }
  biq(F, x) { const y = F.b0 * x + F.b1 * F.x1 + F.b2 * F.x2 - F.a1 * F.y1 - F.a2 * F.y2; F.x2 = F.x1; F.x1 = x; F.y2 = F.y1; F.y1 = y; return y; }
  static rd(b, m, w, L) { const p = w - L, i = Math.floor(p), fr = p - i; return b[i & m] * (1 - fr) + b[(i + 1) & m] * fr; }
  static get parameterDescriptors() { return [BEND]; }
  process(ins, outs, P) { if (this.dead) return false; const bm = Math.max(0.55, bendOf(P));
    const o = outs[0], Lo = o[0], Ro = o[1] || null, n0 = Lo.length, sr = sampleRate, md = this.md;
    let loud = 0;
    for (let n = 0; n < n0; n++) { const tt = currentTime + n / sr;
      if (tt < this.start) { Lo[n] = 0; if (Ro) Ro[n] = 0; continue; }
      if (this.t0 < 0) this.t0 = tt; const age = tt - this.t0, rel = this.relAt >= 0 && tt >= this.relAt;
      if (!rel) this.bw += (1 - this.bw) * (1 / (this.at * sr)) * 3; else this.bw -= this.bw * (1 / (this.rt * sr)) * 3;
      const vfade = Math.min(1, Math.max(0, (age - this.vdel) / 0.4)), vib = (1 + Math.sin(2 * Math.PI * this.vph) * this.vd * vfade) * bm; this.vph += this.vr / sr;
      let y = 0, yr = 0;
      if (md <= 2) { const S = this.S, vb = this.bmax * this.bw;
        for (let k = 0; k < S.length; k++) { const st = S[k]; if (age * sr < st.del) continue;
          const L = st.L / (vib * (1 + Math.sin(2 * Math.PI * (st.vph += 0.3 / sr)) * 0.0004)), Ln = L * (1 - this.pos), Lb = L * this.pos;
          const nk = Bow.rd(st.nk, st.m, st.w, Ln), brv = Bow.rd(st.br, st.m, st.w, Lb);
          st.lp = st.lp + (brv - st.lp) * 0.34; const bref = -st.lp * 0.95, nref = -nk;
          const sv = bref + nref, dv = vb - sv, tb = Math.min(1, Math.pow(Math.abs(dv * this.slope + 0.001) + 0.75, -4)), nv = dv * tb;
          st.nk[st.w] = bref + nv; st.br[st.w] = nref + nv; st.w = (st.w + 1) & st.m;
          const out = brv * st.gain; if (k === 0) y += out; else if (k === 1) { y += out * 0.7; yr += out * 0.7; } else yr += out;
        }
        if (S.length === 1) yr = y; else { const mid = (y + yr) * 0.5, side = (y - yr) * 0.5 * this.wid; y = mid + side; yr = mid - side; }
      } else if (md === 3) {
        let sw = 0; for (const q of this.osc) { q.ph += q.inc * vib; if (q.ph >= 1) q.ph -= 1; let v = 2 * q.ph - 1, t = q.ph, dt = q.inc; if (t < dt) { t /= dt; v -= t + t - t * t - 1; } else if (t > 1 - dt) { t = (t - 1) / dt; v -= t * t + t + t + 1; } sw += v; }
        const env = this.bw; this.lp1 += (sw * env - this.lp1) * this.kl; this.lp2 += (this.lp1 - this.lp2) * this.kl;
        const x = this.lp2 * 0.5, cb = this.cb, cm = this.cm; cb[this.cw] = x;
        let l = 0, r = 0; for (let j = 0; j < 3; j++) { const ph = this.cph[j], dl = (0.006 + 0.00063 * Math.sin(2 * Math.PI * ph) + 0.00012 * Math.sin(2 * Math.PI * (ph * 10.8))) * sr; let p = this.cw - dl; while (p < 0) p += cm; const i = Math.floor(p), fr = p - i, v = cb[i % cm] * (1 - fr) + cb[(i + 1) % cm] * fr; if (j === 0) l += v; else if (j === 1) r += v; else { l += v * 0.5; r += v * 0.5; } this.cph[j] = (ph + this.cinc) % 1; }
        this.cw = (this.cw + 1) % cm; y = x * 0.4 + l * 0.6; yr = x * 0.4 + r * 0.6;
        const w2 = this.wid; const mid = (y + yr) * 0.5, side = (y - yr) * 0.5 * (0.4 + w2 * 1.2); y = mid + side; yr = mid - side;
      } else { const z = this.Pz, v = Bow.rd(z.b, z.m, z.w, z.L / vib); z.lp += (v - z.lp) * 0.5; let nv = z.lp * z.g; if (rel) nv *= 0.9995; z.b[z.w] = nv; z.w = (z.w + 1) & z.m; y = yr = v; }
      let a = y, b2 = yr; const B = this.B, BR = this.BR; for (let q = 0; q < B.length; q++) { a = this.biq(B[q], a); b2 = this.biq(BR[q], b2); }
      this.tl += (a - this.tl) * this.kt; this.tr += (b2 - this.tr) * this.kt; a = this.tl * this.vol; b2 = this.tr * this.vol;
      this.dc = this.kdc * (this.dc + a - this.dx); this.dx = a; this.dcr = this.kdc * (this.dcr + b2 - this.dxr); this.dxr = b2; a = this.dc; b2 = this.dcr;
      const aa = a < 0 ? -a : a; if (aa > loud) loud = aa;
      Lo[n] = a; if (Ro) Ro[n] = b2;
    }
    if (this.relAt >= 0 && currentTime > this.relAt && loud < 2e-5) { if (++this.done > 8) return false; } else this.done = 0;
    return true;
  }
}
registerProcessor('nb-bow', Bow);
class Keys extends AudioWorkletProcessor {
  constructor(opt) {
    super(); const P = (opt && opt.processorOptions) || {}, s = P.s || {}, d = (v, x) => v == null ? x : v, ix = (v, n) => Math.min(n - 1, Math.max(0, Math.floor((v || 0) * n)));
    this.port.onmessage = e => { const m = e.data; if (m === 'kill') this.dead = true; if (m === 'off' && this.relAt < 0) this.relAt = currentTime; };
    const sr = sampleRate; this.start = P.start || 0; this.relAt = P.dur == null || P.dur < 0 ? -1 : this.start + P.dur;
    const f = this.f = P.f || 261.6, vel = d(P.vel, 0.8), m = 69 + 12 * Math.log2(f / 440), md = this.md = ix(d(s.model, 0), 6);
    const hard = Math.min(1, d(s.hard, 0.5) * 0.6 + vel * 0.55), tone = d(s.tone, 0.5), dec = Math.pow(4, d(s.decay, 0.5) * 2 - 1), stiff = d(s.stretch, 0.4), pedal = d(s.pedal, 0);
    this.vel = vel; this.bark = d(s.bark, 0.3); this.pedal = pedal;
    const hl = Math.max(4, Math.round(sr * (0.0006 + (1 - hard) * 0.0034) * (md === 4 ? 0.4 : 1))), ex = new Float32Array(hl + 1);
    let lp = 0; const kh = 1 - Math.exp(-2 * Math.PI * Math.min(sr * 0.45, 600 + hard * hard * 9000) / sr);
    for (let i = 0; i < hl; i++) { const v = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / hl); lp += (v - lp) * kh; ex[i] = lp * vel; }
    this.ex = ex; this.ei = 0;
    this.S = []; this.R = [];
    if (md === 0 || md === 1 || md === 4) {
      const ns = md === 4 ? 1 : m < 34 ? 1 : m < 46 ? 2 : 3, spread = 0.25 + d(s.detune, 0.15) * d(s.detune, 0.15) * 14 + (md === 1 ? 1.2 : 0);
      const t60 = (md === 4 ? 1.4 * Math.pow(2, -(m - 48) / 30) : 16 * Math.pow(2, -(m - 21) / 21) * (md === 1 ? 0.6 : 1)) * dec;
      const cst = -(0.08 + 0.5 * stiff) * (0.35 + 0.65 * Math.min(1, Math.max(0, (m - 21) / 87))) * (md === 4 ? 0.4 : 1);
      for (let k = 0; k < ns; k++) {
        const det = ns === 1 ? 0 : (k / (ns - 1) - 0.5) * 2 * spread, fk = f * Math.pow(2, det / 1200), w0 = 2 * Math.PI * fk / sr;
        const per = sr / fk, a = Math.min(0.6, (0.03 + 0.4 * (1 - tone) + (md === 1 ? 0.12 : 0)) * Math.min(1, per / 160) + 0.005), g = Math.pow(10, -3 / (t60 * (1 + k * 0.15) * fk));
        const pd = (re, im) => -Math.atan2(im, re) / w0;
        const lre = 1 - a * Math.cos(w0), lim = a * Math.sin(w0), Dl = Math.atan2(lim, lre) / w0;
        const apd = c => { const nr = c + Math.cos(w0), ni = -Math.sin(w0), dr = 1 + c * Math.cos(w0), di = -c * Math.sin(w0); return pd(nr * dr + ni * di, ni * dr - nr * di); };
        const Dd = 2 * apd(cst), want = per - Dl - Dd, N = Math.max(2, Math.floor(want - 0.5)), fr = want - N, eta = (1 - fr) / (1 + fr);
        let size = 1; while (size < N * 2 + 8) size <<= 1;
        this.S.push({ per, Df: Dl + Dd, b: new Float32Array(size), m: size - 1, w: 0, N, eta, g, gd: Math.pow(10, -3 / ((md === 4 ? 0.03 : 0.12) * fk)), a, c: cst, t1: 0, ty: 0, l1: 0, x1: 0, y1: 0, x2: 0, y2: 0, pos: Math.max(1, Math.round(N / (md === 4 ? 4.5 : 8.3))) });
      }
      this.amp = 1.6 / ns;
    } else {
      const B = md === 2 ? [[1, 1, 7], [2, 0.08, 1.5], [7.1, 0.25 * hard, 0.06], [3.01, 0.03, 0.8]] : md === 3 ? [[1, 1, 3.2], [2, 0.18, 1.2], [3, 0.12, 0.6], [5.1, 0.06 * hard, 0.05]] : [[1, 1, 3.5], [2.76, 0.3, 0.8], [5.4, 0.18 * hard, 0.2], [8.93, 0.08 * hard, 0.08]];
      const sc = Math.pow(2, -(m - 60) / 24) * dec;
      for (const [r, a0, tt] of B) { const fr = f * r; if (fr > sr * 0.45) continue; const T = tt * sc, rr = Math.pow(10, -3 / (T * sr)), w = 2 * Math.PI * fr / sr;
        this.R.push({ w, c1: 2 * rr * Math.cos(w), c2: -rr * rr, g: a0 * (1 - rr * rr) * 30, y1: 0, y2: 0, rd: Math.pow(10, -3 / (0.25 * sr)) }); }
      this.amp = md === 4 ? 1 : 0.9;
    }
    const bq = (fc, q, gain) => { const w = 2 * Math.PI * fc / sr, al = Math.sin(w) / (2 * q), A = Math.pow(10, gain / 40), a0 = 1 + al / A; return { b0: (1 + al * A) / a0, b1: -2 * Math.cos(w) / a0, b2: (1 - al * A) / a0, a1: -2 * Math.cos(w) / a0, a2: (1 - al / A) / a0, x1: 0, x2: 0, y1: 0, y2: 0 }; };
    const body = d(s.body, 0.5) * (md <= 1 ? 1 : 0.4);
    this.bq = [bq(md === 1 ? 140 : 105, 1.4, body * 7), bq(md === 1 ? 420 : 310, 1.6, body * 5)];
    this.kt = 1 - Math.exp(-2 * Math.PI * (1500 * Math.pow(12, tone)) / sr); this.tl = 0;
    this.nz = d(s.noise, 0.25) * 0.08 * vel; this.nk = Math.exp(-1 / (0.012 * sr)); this.ne = 1; this.seed = (P.seed || 12345) >>> 0;
    const wide = d(s.wide, 0.4); this.pan = md <= 1 ? Math.max(-1, Math.min(1, (m - 64) / 30)) * wide : 0;
    this.tr = d(s.trem, 0) * (md === 2 || md === 3 ? 1 : 0); this.tri = Math.pow(2, d(s.trate, 0.45) * 4 - 1) * 2 / sr; this.tph = 0; this.gl = Math.sqrt(0.5 - this.pan * 0.5) * 1.414; this.gr = Math.sqrt(0.5 + this.pan * 0.5) * 1.414;
    const LV = [[0.36, 0.8, 57], [0.36, 0.8, 57], [0.8, 1, 57], [1.25, 0.3, 57], [0.45, 0.25, 57], [0.3, 1.1, 63]][md], mm = md === 5 ? m : Math.max(m, LV[2]);
    this.vol = d(s.vol, 0.75) * 1.2 * LV[0] * Math.pow(2, LV[1] * (mm - LV[2]) / 12); this.done = 0; this.dc = 0; this.dx = 0; this.kdc = 1 - 2 * Math.PI * 12 / sr; this.rel = false;
  }
  rnd() { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 2147483648 - 1; }
  biq(F, x) { const y = F.b0 * x + F.b1 * F.x1 + F.b2 * F.x2 - F.a1 * F.y1 - F.a2 * F.y2; F.x2 = F.x1; F.x1 = x; F.y2 = F.y1; F.y1 = y; return y; }
  static get parameterDescriptors() { return [BEND]; }
  process(ins, outs, P) { if (this.dead) return false;
    const o = outs[0], L = o[0], Rt = o[1] || null, n0 = L.length, sr = sampleRate, md = this.md, S = this.S, R = this.R;
    const bm = Math.max(0.55, bendOf(P)); if (bm !== (this.kb || 1)) { this.kb = bm;
      for (const st of S) { const want = st.per / bm - st.Df, N = Math.max(2, Math.min(st.m - 4, Math.floor(want - 0.5))), fr = want - N; st.N = N; st.eta = (1 - fr) / (1 + fr); }
      for (const r of R) r.c1 = 2 * Math.sqrt(Math.max(0, -r.c2)) * Math.cos(Math.min(Math.PI * 0.98, r.w * bm)); }
    let loud = 0;
    for (let n = 0; n < n0; n++) { const tt = currentTime + n / sr;
      if (tt < this.start) { L[n] = 0; if (Rt) Rt[n] = 0; continue; }
      if (!this.rel && this.relAt >= 0 && tt >= this.relAt) { this.rel = true; const lift = this.pedal;
        for (const st of S) { if (md === 4 || this.f < 1400) st.g = st.gd + (st.g - st.gd) * lift; }
        for (const r of R) { const k = r.rd + (1 - r.rd) * (0.6 + 0.4 * lift); r.c1 *= k; r.c2 *= k * k; } if (md === 4) this.ne = 1.5; }
      const ni = this.ei++, EX = this.ex, e = ni < EX.length ? EX[ni] : 0;
      let y = 0;
      if (S.length) for (let k = 0; k < S.length; k++) { const st = S[k], b = st.b, mk = st.m;
        const r = b[(st.w - st.N) & mk];
        const t = st.eta * r + st.t1 - st.eta * st.ty; st.t1 = r; st.ty = t;
        st.l1 = (1 - st.a) * t + st.a * st.l1; const l = st.g * st.l1;
        const c = st.c, u = c * l + st.x1 - c * st.y1; st.x1 = l; st.y1 = u; const v = c * u + st.x2 - c * st.y2; st.x2 = u; st.y2 = v;
        const dp = ni - st.pos, ein = e - (dp >= 0 && dp < EX.length ? EX[dp] * 0.85 : 0);
        b[st.w] = v + ein; st.w = (st.w + 1) & mk; y += v; }
      else for (let k = 0; k < R.length; k++) { const r = R[k], v = r.c1 * r.y1 + r.c2 * r.y2 + e * r.g; r.y2 = r.y1; r.y1 = v; y += v; }
      y *= this.amp;
      if (md === 2 || md === 3) { const k = 1 + this.bark * 5 * (md === 3 ? 1.4 : 1), bb = md === 2 ? 0.35 : -0.25; y = (Math.tanh(k * y + bb) - Math.tanh(bb)) / k; }
      if (this.ne > 1e-4) { y += this.rnd() * this.nz * this.ne * (md === 4 ? 3 : 1); this.ne *= this.nk; }
      if (md <= 1) for (let q = 0; q < 2; q++) y = this.biq(this.bq[q], y);
      this.tl += (y - this.tl) * this.kt; y = this.tl * this.vol;
      this.dc = this.kdc * (this.dc + y - this.dx); this.dx = y; y = this.dc;
      const ay = y < 0 ? -y : y; if (ay > loud) loud = ay;
      if (this.tr > 0) { this.tph += this.tri; if (this.tph > 1) this.tph -= 1; const pl = Math.sin(2 * Math.PI * this.tph) * this.tr; this.gl = Math.sqrt(0.5 - pl * 0.5) * 1.414; this.gr = Math.sqrt(0.5 + pl * 0.5) * 1.414; }
      if (Rt) { L[n] = y * this.gl; Rt[n] = y * this.gr; } else L[n] = y;
    }
    for (let c = 2; c < o.length; c++) o[c].set(L);
    if (this.rel && loud < 2e-5) { if (++this.done > 8) return false; } else this.done = 0;
    return true;
  }
}
registerProcessor('nb-keys', Keys);
class Fm4 extends AudioWorkletProcessor {
  constructor(opt) {
    super(); const P = (opt && opt.processorOptions) || {}, s = P.s || {}, d = (v, x) => v == null ? x : v, ex = (a, b, v) => a * Math.pow(b / a, v), ix = (v, n) => Math.min(n - 1, Math.max(0, Math.floor((v || 0) * n)));
    this.port.onmessage = e => { const m = e.data; if (m === 'kill') this.dead = true; if (m === 'off' && this.relAt < 0) this.relAt = currentTime; };
    this.os = P.off ? 4 : 2; const sr = this.sr = sampleRate * this.os; this.start = P.start || 0; this.relAt = P.dur == null || P.dur < 0 ? -1 : this.start + P.dur; this.f = P.f || 220;
    const vel = d(P.vel, 0.8), m = 69 + 12 * Math.log2(this.f / 440), ks = d(s.ks, 0.3), kt = Math.pow(2, -(m - 60) / 12 * ks * 1.5);
    if (!Fm4.T) { const N = 4096, t = new Float64Array(N + 1); for (let i = 0; i <= N; i++) t[i] = Math.sin(2 * Math.PI * i / N); Fm4.T = t; }
    const kl = m > 60 ? Math.pow(2, -(m - 60) / 12 * d(s.kl, 0.3) * 1.5) : 1;
    const RAT = Fm4.RAT, alg = ix(d(s.alg, 0), 8), br = Math.pow(2, (d(s.bright, 0.5) - 0.5) * 2);
    this.alg = alg; this.C = Fm4.CAR[alg]; this.M = Fm4.MOD[alg];
    this.op = [1, 2, 3, 4].map(k => {
      const q = RAT[ix(d(s['q' + k], k === 1 ? 0.1 : 0.1), RAT.length)], dt = (d(s['dt' + k], 0.5) - 0.5) * 50, l = d(s['l' + k], k === 1 ? 0.9 : 0), vs = d(s['v' + k], 0.3);
      const car = this.C.indexOf(k) >= 0, L = l <= 0.001 ? 0 : Math.pow(2, (l * 99 - 99) / 8) * (1 - vs * (1 - vel));
      const amp = car ? L : L * 2 * br * kl;
      const at = ex(0.0005, 10, d(s['ea' + k], 0)) * kt, dc = ex(0.005, 20, d(s['ed' + k], 0.5)) * kt, su = d(s['es' + k], car ? 0.7 : 0.3), rl = ex(0.005, 15, d(s['er' + k], 0.3)) * kt;
      return { inc: q * Math.pow(2, dt / 1200) / sr, amp, w: ix(d(s['w' + k], 0), 4), ph: 0, e: 0, st: 0, ai: 1 / Math.max(1, at * sr), kd: Math.exp(-4.6 / (dc * sr)), su: su * su, kr: Math.exp(-4.6 / (rl * sr)), y: 0, car };
    });
    this.fb = Math.pow(d(s.fb, 0), 1.5) * 0.55; this.y1 = 0; this.y2 = 0;
    this.lr = ex(0.1, 12, d(s.lfr, 0.45)) / sampleRate; this.lp = d(s.lfp, 0) * d(s.lfp, 0) * 60; this.la = d(s.lfa, 0) * 0.9; this.lb = d(s.lfb, 0) * 1.5; this.ld = ex(0.01, 4, d(s.lfd, 0.2)); this.lph = 0;
    this.pe = (d(s.pe, 0.5) - 0.5) * 48; this.pk = Math.exp(-4.6 / (ex(0.003, 1.5, d(s.pt, 0.3)) * sampleRate / 16));
    this.pev = this.pe; this.vol = d(s.vol, 0.75) * 1.0 / Math.pow(this.C.length, 0.6);
    this.h = Float64Array.from(Serp.HB.slice(0, 6)); const dn = () => ({ i: 0, e: new Float64Array(16), o: new Float64Array(16) }); this.dn = dn(); this.dn2 = dn(); this.dc = 0; this.dx = 0; this.kdc = 1 - 2 * Math.PI * 8 / sampleRate; this.done = 0;
    this.pm = 1; this.am = 1; this.bm = 1; this.cnt = 0; this.fn = this.f;
  }
  down(R, e, o) { const h = this.h, O = R.o; let i = R.i = (R.i + 1) & 15; R.e[i] = e; O[i] = o;
    return 0.5 * (R.e[(i - 6) & 15] + h[0] * (O[(i - 1) & 15] + O[(i - 12) & 15]) + h[1] * (O[(i - 2) & 15] + O[(i - 11) & 15]) + h[2] * (O[(i - 3) & 15] + O[(i - 10) & 15]) + h[3] * (O[(i - 4) & 15] + O[(i - 9) & 15]) + h[4] * (O[(i - 5) & 15] + O[(i - 8) & 15]) + h[5] * (O[(i - 6) & 15] + O[(i - 7) & 15])); }
  static wav(p, w) { const T = Fm4.T; p -= Math.floor(p); const x = p * 4096, i = x | 0, s = T[i] + (T[i + 1] - T[i]) * (x - i);
    return w === 0 ? s : w === 1 ? (s > 0 ? s : 0) : w === 2 ? (s < 0 ? -s : s) : s * (s < 0 ? -s : s) * 1.3; }
  tick(rel) { const O = this.op, M = this.M, pm = this.pm, bm = this.bm; let out = 0, alive = 0;
    for (let k = 3; k >= 0; k--) { const o = O[k];
      if (o.st === 0) { o.e += o.ai; if (o.e >= 1) { o.e = 1; o.st = 1; } } else if (o.st === 1) o.e = o.su + (o.e - o.su) * o.kd; else o.e *= o.kr;
      if (rel && o.st < 2) o.st = 2;
      let mod = 0; const ms = M[k]; for (let j = 0; j < ms.length; j++) mod += O[ms[j]].y;
      if (k === 3 && this.fb > 0) mod += this.fb * (this.y1 + this.y2) * 0.5;
      const raw = Fm4.wav(o.ph + mod, o.w) * o.e, y = raw * (o.car ? o.amp : o.amp * bm);
      if (k === 3) { this.y2 = this.y1; this.y1 = raw; }
      o.y = y; o.ph += o.inc * this.fn * pm; if (o.ph > 1) o.ph -= 1;
      if (o.car) { out += y; if (o.e > 1e-4 || o.st < 2) alive = 1; } }
    if (!alive) this.done++; return out * this.am; }
  static get parameterDescriptors() { return [BEND]; }
  process(ins, outs, P) { if (this.dead) return false; this.pbm = bendOf(P);
    const o = outs[0], n0 = o[0].length, sr = sampleRate;
    for (let n = 0; n < n0; n++) { const tt = currentTime + n / sr;
      if (tt < this.start) { o[0][n] = 0; continue; }
      if ((this.cnt++ & 15) === 0) { const age = tt - this.start, fade = Math.min(1, age / this.ld), lv = Math.sin(2 * Math.PI * this.lph) * fade; this.lph += this.lr * 16; if (this.lph > 1) this.lph -= 1;
        this.pev *= this.pk; this.pm = Math.pow(2, (this.pev + lv * this.lp / 100) / 12) * this.pbm; this.am = 1 - this.la * (0.5 + 0.5 * lv); this.bm = Math.max(0, 1 + this.lb * lv); this.fn = this.f; }
      const rel = this.relAt >= 0 && tt >= this.relAt; let a, b;
      if (this.os === 4) { const p = this.tick(rel), q = this.tick(rel), r = this.tick(rel), u = this.tick(rel); a = this.down(this.dn2, p, q); b = this.down(this.dn2, r, u); } else { a = this.tick(rel); b = this.tick(rel); }
      let y = this.down(this.dn, a, b) * this.vol; this.dc = this.kdc * (this.dc + y - this.dx); this.dx = y; o[0][n] = this.dc; }
    for (let c = 1; c < o.length; c++) o[c].set(o[0]);
    const dead = this.done >= n0 * this.os; this.done = 0; if (this.relAt >= 0 && currentTime > this.relAt && dead) return false;
    return true;
  }
}
Fm4.RAT = [0.5, 0.71, 1, 1.41, 1.5, 2, 2.5, 3, 3.14, 3.5, 4, 4.24, 5, 5.19, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
Fm4.CAR = [[1], [1], [1], [1], [1, 3], [1, 2, 3], [1, 2, 3], [1, 2, 3, 4]].map(a => a);
Fm4.MOD = [[[1], [2], [3], []], [[1], [2, 3], [], []], [[1, 3], [2], [], []], [[1, 2], [], [3], []], [[1], [], [3], []], [[3], [3], [3], []], [[], [], [3], []], [[], [], [], []]];
registerProcessor('nb-fm', Fm4);
class Res extends AudioWorkletProcessor {
  static get parameterDescriptors() { const a = []; for (let k = 0; k < 5; k++) a.push({ name: 'f' + k, defaultValue: 110 * (k + 1), minValue: 20, maxValue: 8000, automationRate: 'k-rate' }); a.push({ name: 'fb', defaultValue: 0.9, minValue: 0, maxValue: 0.995, automationRate: 'k-rate' }, { name: 'damp', defaultValue: 0.3, minValue: 0, maxValue: 0.95, automationRate: 'k-rate' }, { name: 'spread', defaultValue: 0.5, minValue: 0, maxValue: 1, automationRate: 'k-rate' }); return a; }
  constructor() { super(); live(this); this.N = 4096; this.b = []; this.lp = []; for (let k = 0; k < 5; k++) { this.b.push(new Float32Array(this.N)); this.lp.push(0); } this.w = 0; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], N = this.N, fb = P.fb[0], d = P.damp[0], sp = P.spread[0], sr = sampleRate, L = [], pan = [];
    for (let k = 0; k < 5; k++) { L.push(Math.max(2, Math.min(N - 2, sr / P['f' + k][0] - d / (1 - d)))); pan.push((k / 4 - 0.5) * sp); }
    for (let n = 0; n < o[0].length; n++) {
      let x = 0; if (i && i.length) { x = i[0][n]; if (i[1]) x = (x + i[1][n]) * 0.5; }
      let l = 0, r = 0;
      for (let k = 0; k < 5; k++) { const rp = this.w - L[k], i0 = Math.floor(rp), f = rp - i0, a = ((i0 % N) + N) % N, b2 = (a + 1) % N, buf = this.b[k]; let y = buf[a] + (buf[b2] - buf[a]) * f; this.lp[k] += (y - this.lp[k]) * (1 - d); y = this.lp[k]; buf[this.w] = x * 0.3 + y * fb; l += y * (0.5 - pan[k]); r += y * (0.5 + pan[k]); }
      o[0][n] = l * 0.6; if (o[1]) o[1][n] = r * 0.6; this.w = (this.w + 1) % N;
    }
    return true;
  }
}
registerProcessor('nb-res', Res);
class Pluck extends AudioWorkletProcessor {
  constructor(opt) {
    super(); live(this); const p = (opt && opt.processorOptions) || {};
    this.rs = (p.seed >>> 0) || (1 + Math.floor(Math.random() * 2147483645)); const rnd = () => (this.rs = this.rs * 16807 % 2147483647) / 2147483647;
    this.f = p.f || 220; this.br = p.br == null ? 0.5 : p.br; this.life = Math.floor(sampleRate * (p.life || 4)); this.age = 0;
    this.buzz = p.buzz || 0; this.stiff = p.stiff || 0; this.ap = 0; this.apx = 0;
    const fill = (L, seed) => {
      const N = Math.ceil(L) + 4, b = new Float32Array(N), exc = p.exc || 0, hard = p.hard == null ? 0.5 : p.hard, pos = p.pos == null ? 0.5 : p.pos;
      let lp = 0;
      for (let k = 0; k < N; k++) {
        const r = rnd() * 2 - 1, u = k / N;
        let x;
        if (exc === 1) { lp += (r - lp) * (0.4 + hard * 0.6); x = lp * 0.6 + (1 - 2 * u) * 0.5 * hard; }
        else if (exc === 2) { lp += (r - lp) * (0.05 + hard * 0.25); x = Math.sin(Math.PI * u) * 0.8 + lp * 0.3; }
        else { lp += (r - lp) * (0.15 + this.br * 0.85); x = lp; }
        b[k] = x * (p.v || 0.8) * (1 - pos * Math.cos(6.2831853 * k / N) * 0.6);
      }
      return { L, L0: L, N, b, w: 0, last: 0 };
    };
    this.bend = p.bend ? Math.pow(2, -p.bend / 1200) : 1; this.vib = (p.vib || 0) * 0.006; this.ph = 0; this.vr = 5.3 + rnd();
    this.S = [fill(Math.max(2, sampleRate / this.f))];
    if (p.dbl) this.S.push(fill(Math.max(2, sampleRate / (this.f * p.dbl))));
    this.S.forEach(S => { const N2 = Math.ceil(S.L0 * 2.2) + 8, b2 = new Float32Array(N2); b2.set(S.b, N2 - S.N); S.b = b2; S.N = N2; });
    const sm = 0.5 + (1 - this.br) * 0.45; this.S.forEach((S, q) => { const om = 6.2831853 / S.L0; let d = Math.atan2(sm * Math.sin(om), 1 - sm * Math.cos(om)) / om;
      if (this.stiff && q === 0) { const c = this.stiff * 0.6, re = c + Math.cos(om), im = -Math.sin(om), re2 = 1 + c * Math.cos(om), im2 = -c * Math.sin(om); d += -(Math.atan2(im, re) - Math.atan2(im2, re2)) / om; }
      S.c = Math.min(S.L0 - 1, d); });
    this.g = Math.pow(0.001, 1 / (this.f * (p.dec || 2)));
    this.start = p.start || 0;
    this.port.onmessage = e => { if (e.data === 'kill') this.dead = true; if (e.data === 'off') this.g = Math.min(this.g, Math.pow(0.001, 1 / (this.f * 0.12))); };
  }
  static get parameterDescriptors() { return [BEND]; }
  process(ins, outs, P) { if (this.dead) return false; const bm = Math.max(0.5, bendOf(P));
    if (currentTime + 0.003 < this.start) { for (const ch of outs[0]) ch.fill(0); return true; }
    const o = outs[0], s = 0.5 + (1 - this.br) * 0.45, sr = sampleRate, bz = this.buzz, nS = this.S.length;
    for (let n = 0; n < o[0].length; n++) {
      if (currentTime + n / sr < this.start) { for (const c of o) c[n] = 0; continue; }
      let sum = 0;
      if (this.bend < 0.9999 || this.vib || bm !== 1 || this.lbm !== bm) { this.lbm = bm; this.bend += (1 - this.bend) * (1 - Math.exp(-1 / (sr * 0.06))); this.ph += this.vr / sr; const w = 1 + this.vib * Math.sin(this.ph * 6.2831853) * Math.min(1, this.age / sr * 3); for (let q = 0; q < nS; q++) this.S[q].L = Math.min(this.S[q].N - 3, this.S[q].L0 * this.bend * w / bm); }
      for (let q = 0; q < nS; q++) {
        const S = this.S[q], N = S.N, rp = S.w - Math.max(1, S.L - S.c), i0 = Math.floor(rp), fr = rp - i0, a = ((i0 % N) + N) % N, b = (a + 1) % N;
        let y = S.b[a] + (S.b[b] - S.b[a]) * fr; y = (y * (1 - s) + S.last * s); S.last = y; y *= this.g;
        if (bz) { const t = 0.18 - bz * 0.12; if (y > t) y = t + (y - t) * (1 - bz * 0.8); else if (y < -t) y = -t + (y + t) * (1 - bz * 0.8); }
        if (this.stiff && q === 0) { const c = this.stiff * 0.6, z = c * (y - this.apx) + this.ap; this.apx = z; this.ap = y; y = z; }
        S.b[S.w] = y; S.w = (S.w + 1) % N; sum += y;
      }
      const y = nS > 1 ? sum * 0.7 : sum;
      for (const c of o) c[n] = y;
    }
    if (currentTime + o[0].length / sr >= this.start) { this.age += o[0].length; let mx = 0; const c0 = o[0]; for (let n = 0; n < c0.length; n += 4) { const a = c0[n] < 0 ? -c0[n] : c0[n]; if (a > mx) mx = a; } this.qb = mx < 3e-5 && this.age > sr * 0.1 ? (this.qb || 0) + 1 : 0; if (this.qb > 8) return false; }
    return this.age < this.life;
  }
}
registerProcessor('nb-pluck', Pluck);
class Razor extends AudioWorkletProcessor {
  constructor(opt) {
    super(); const p = (opt && opt.processorOptions) || {}, sr = sampleRate;
    this.port.onmessage = e => { if (e.data === 'kill') this.dead = true; if (e.data === 'off') this.off = 1; };
    this.start = p.start || 0; this.relAt = p.dur == null || p.dur < 0 ? -1 : this.start + p.dur; this.age = 0; this.life = Math.floor(sr * (p.life || 8)); this.quiet = 0;
    this.rs = (p.seed >>> 0) || 7; const f = p.f || 110, vel = p.vel == null ? 0.8 : p.vel, mute = Math.max(0, Math.min(1, p.mute || 0));
    const sus = Math.exp(Math.log(p.sus || 3) * (1 - mute) + Math.log(0.07) * mute), br = Math.max(0, Math.min(1, (p.br == null ? 0.6 : p.br) * (1 - mute * 0.75)));
    this.vib = (p.vib || 0) * 0.0045; this.vph = 0; this.vr = 5.2 + this.rnd() * 0.8; this.dbl = Math.max(0, Math.min(1, p.dbl || 0)); this.scr = (p.scrape || 0) * vel * (1 - mute * 0.4);
    this.T = [this.take(f, vel, sus, br, p.hard == null ? 0.6 : p.hard, p.pos == null ? 0.18 : p.pos, 0)];
    if (this.dbl > 0.001) this.T.push(this.take(f * Math.pow(2, (3 + this.rnd() * 4) * (this.rnd() < 0.5 ? -1 : 1) / 1200), vel * (0.92 + this.rnd() * 0.12), sus, br, p.hard == null ? 0.6 : p.hard, p.pos == null ? 0.18 : p.pos, 0.008 + this.rnd() * 0.012));
    this.nz = 0;
  }
  rnd() { this.rs = (this.rs * 1664525 + 1013904223) >>> 0; return this.rs / 4294967296; }
  take(f, vel, sus, br, hard, pos, late) {
    const sr = sampleRate, L = Math.max(4, sr / f), N = Math.ceil(L * 2.2) + 8, b = new Float32Array(N), n0 = Math.ceil(L);
    const at = 0.08 + (1 - hard) * 0.12; let lp = 0, k1 = 0.25 + hard * 0.7;
    for (let k = 0; k < n0; k++) { const u = k / n0, tri = u < at ? u / at : (1 - u) / (1 - at); lp += (this.rnd() * 2 - 1 - lp) * k1; b[N - n0 + k] = (tri * 0.55 + lp * 0.45 * (0.4 + hard)) * vel; }
    let m = 0; for (let k = N - n0; k < N; k++) m += b[k]; m /= n0; for (let k = N - n0; k < N; k++) b[k] -= m;
    const kk = 0.08 + (1 - br) * 0.42, g = Math.pow(10, -3 / (f * sus));
    return { L, N, b, w: 0, x1: 0, kk, g, g0: g, f, P: Math.max(1, Math.round(L * pos * 0.5)), late: Math.floor(late * sr) };
  }
  static get parameterDescriptors() { return [BEND]; }
  process(ins, outs, P) { if (this.dead) return false; const bm = Math.max(0.5, bendOf(P));
    const o = outs[0], L0 = o[0], R0 = o[1] || null, n0 = L0.length, sr = sampleRate;
    if (currentTime + n0 / sr < this.start) { L0.fill(0); if (R0) R0.fill(0); return true; }
    let pk = 0;
    for (let n = 0; n < n0; n++) {
      const tt = currentTime + n / sr; if (tt < this.start) { L0[n] = 0; if (R0) R0[n] = 0; continue; }
      const age = this.age++, rel = this.off || (this.relAt >= 0 && tt >= this.relAt);
      let wob = 1; if (this.vib) { this.vph += this.vr / sr; wob = 1 + this.vib * Math.sin(6.2831853 * this.vph) * Math.min(1, Math.max(0, (age / sr - 0.3) * 2)); }
      let oa = 0, ob = 0;
      for (let q = 0; q < this.T.length; q++) { const S = this.T[q];
        if (age < S.late) continue;
        if (rel && S.g === S.g0) S.g = Math.pow(10, -3 / (S.f * 0.07));
        const D = Math.max(2, S.L / (bm * wob) - S.kk), N = S.N, rp = S.w - D, i0 = Math.floor(rp), fr = rp - i0, a = ((i0 % N) + N) % N, c = (a + 1) % N;
        const x = S.b[a] + (S.b[c] - S.b[a]) * fr, y = (x * (1 - S.kk) + S.x1 * S.kk) * S.g; S.x1 = x;
        const pu = y - S.b[((S.w - S.P) % N + N) % N];
        S.b[S.w] = y; S.w = (S.w + 1) % N; if (q) ob = pu; else oa = pu;
      }
      let sc = 0; if (this.scr && age < sr * 0.012) { this.nz += (this.rnd() * 2 - 1 - this.nz) * 0.6; sc = (this.rnd() * 2 - 1 - this.nz) * this.scr * 0.35 * (1 - age / (sr * 0.012)); }
      const A = oa + sc, B = this.T.length > 1 ? ob + sc * 0.8 : A;
      L0[n] = A; if (R0) R0[n] = A * (1 - this.dbl) + B * this.dbl;
      const aa = A < 0 ? -A : A; if (aa > pk) pk = aa;
    }
    this.quiet = pk < 2e-5 && this.age > sr * 0.05 ? this.quiet + 1 : 0;
    return this.age < this.life && this.quiet < 40;
  }
}
registerProcessor('nb-razor', Razor);
class Bass extends AudioWorkletProcessor {
  constructor(opt) {
    super(); const p = (opt && opt.processorOptions) || {}, sr = sampleRate;
    this.port.onmessage = e => { if (e.data === 'kill') this.dead = true; if (e.data === 'off') this.off = 1; };
    this.start = p.start || 0; this.relAt = p.dur == null || p.dur < 0 ? -1 : this.start + p.dur; this.age = 0; this.life = Math.floor(sr * (p.life || 8)); this.quiet = 0;
    this.rs = (p.seed >>> 0) || 7;
    const f = p.f || 55, vel = p.vel == null ? 0.8 : p.vel, hard = Math.max(0, Math.min(1, p.hard == null ? 0.3 : p.hard)), mute = Math.max(0, Math.min(1, p.mute || 0)), br = Math.max(0, Math.min(1, p.br == null ? 0.5 : p.br));
    this.f = f; this.vel = vel; this.hard = hard;
    const nt = p.nt == null ? 69 + 12 * Math.log2(f / 440) : p.nt; let op = 23; [28, 33, 38, 43].forEach(o => { if (nt >= o) op = o; });
    const r = Math.pow(2, -Math.max(0, nt - op) / 12), B = Math.min(2e-3, 6e-5 * (op === 23 ? 1.3 : 1) / (r * r));
    const mw = Math.sqrt(mute), T0 = Math.exp(Math.log(p.sus || 3) * (1 - mw) + Math.log(0.14) * mw), Tr = Math.max(0.02, T0 * (0.035 + 0.17 * br) * (1 - 0.7 * mw));
    this.setLoss(T0, Tr);
    const L = sr / f; this.L = L;
    const M = 4, w0 = 2 * Math.PI * f / sr; let best = null;
    for (let a = -0.9; a <= 0.0001; a += 0.01) {
      let t = [], sum = 0, n = 0;
      for (let k = 1; k <= 40; k++) { const fk = k * f * Math.sqrt(1 + B * k * k), w = 2 * Math.PI * fk / sr; if (w > 0.9 * Math.PI) break;
        const d = L / Math.sqrt(1 + B * k * k) - M * Bass.apd(a, w) - Bass.lpd(this.a1, w); t.push([d, 1 / k]); sum += d / k; n += 1 / k; }
      if (!n) { best = { a: 0, D: L - Bass.lpd(this.a1, w0) }; break; }
      const D = sum / n; let err = 0; t.forEach(([d, wt]) => { err += wt * (d - D) * (d - D); });
      if (!best || err < best.err) best = { a, D, err };
    }
    { const w1 = w0 * Math.sqrt(1 + B); if (best.err != null) best.D = L / Math.sqrt(1 + B) - M * Bass.apd(best.a, w1) - Bass.lpd(this.a1, w1); }
    this.ad = best.a; this.M = M; this.ap = new Float64Array(M * 2);
    this.Dfix = M * Bass.apd(this.ad, w0 * Math.sqrt(1 + B)) + Bass.lpd(this.a1, w0 * Math.sqrt(1 + B)); this.Db = Math.max(4, best.D);
    const beta = 0.08 + (1 - hard) * 0.17, n0 = Math.max(6, Math.round(this.Db)), N = Math.ceil(L * 1.6) + 16, b = new Float32Array(N), sh = new Float64Array(n0);
    for (let k = 0; k < n0; k++) { const u = k / n0; sh[k] = u < beta ? u / beta : (1 - u) / (1 - beta); }
    const wd = Math.max(1, Math.round((0.004 + 0.022 * (1 - hard)) * n0)); let sm = new Float64Array(n0);
    for (let k = 0; k < n0; k++) { let acc = 0, ww = 0; for (let j = -wd; j <= wd; j++) { const h = 0.5 + 0.5 * Math.cos(Math.PI * j / (wd + 1)); acc += sh[(k + j + n0) % n0] * h; ww += h; } sm[k] = acc / ww; }
    let lp = 0, m = 0; for (let k = 0; k < n0; k++) { lp += (this.rnd() * 2 - 1 - lp) * 0.5; sm[k] = sm[k] + lp * 0.12 * hard; m += sm[k]; } m /= n0;
    let A0 = 0; for (let k = 0; k < n0; k++) { const v = (sm[k] - m) * vel; b[N - n0 + k] = v; A0 = Math.max(A0, Math.abs(v)); }
    this.b = b; this.N = N; this.w = 0; this.l1 = 0;
    this.th = A0 * (1.3 - 0.85 * Math.max(0, Math.min(1, p.clank == null ? 0.5 : p.clank)) * (0.3 + 0.7 * vel)); this.A0 = A0;
    this.tm = 0.001 + 0.008 * vel * vel * (0.35 + 0.65 * hard); this.e = 0; this.E0 = 0; this.yp = 0;
    const pu = p.pu == null ? 0.17 : p.pu; this.P = Math.max(1, Math.round(pu * this.Db)); this.pu1 = 0;
    const fc = 2600 + 900 * (1 - pu / 0.3), q = 1.1, cw = Math.cos(2 * Math.PI * fc / sr), al = Math.sin(2 * Math.PI * fc / sr) / (2 * q), a0 = 1 + al;
    this.c = [(1 - cw) / 2 / a0, (1 - cw) / a0, (1 - cw) / 2 / a0, -2 * cw / a0, (1 - al) / a0]; this.z = [0, 0, 0, 0];
    this.gain = Math.pow(sr / (2 * Math.PI * f), 0.92) * 0.55;
    this.nz = 0; this.th1 = 0;
  }
  static apd(a, w) { const ph = Math.atan2(-Math.sin(w), a + Math.cos(w)) - Math.atan2(-a * Math.sin(w), 1 + a * Math.cos(w)); return -ph / w; }
  static lpd(a, w) { return Math.atan2(-a * Math.sin(w), 1 + a * Math.cos(w)) / w; }
  setLoss(T0, Tr) {
    const f = this.f, sr = sampleRate, G0 = Math.pow(10, -3 / (T0 * f)), Gr = Math.pow(10, -3 / (Tr * f)), wr = 2 * Math.PI * Math.min(2000, sr * 0.4) / sr, want = Math.min(0.9999, Gr / G0);
    let lo = -0.999, hi = 0; for (let i = 0; i < 50; i++) { const a = (lo + hi) / 2, r = (1 + a) / Math.sqrt(1 + 2 * a * Math.cos(wr) + a * a); if (r > want) hi = a; else lo = a; }
    this.g = G0; this.a1 = (lo + hi) / 2;
  }
  rnd() { this.rs = (this.rs * 1664525 + 1013904223) >>> 0; return this.rs / 4294967296; }
  static get parameterDescriptors() { return [BEND]; }
  process(ins, outs, P) { if (this.dead) return false; const bm = Math.max(0.5, bendOf(P));
    const o = outs[0], L0 = o[0], R0 = o[1] || null, n0 = L0.length, sr = sampleRate, b = this.b, N = this.N, M = this.M, ad = this.ad, ap = this.ap, c = this.c, z = this.z;
    if (currentTime + n0 / sr < this.start) { L0.fill(0); if (R0) R0.fill(0); return true; }
    let pk = 0;
    for (let n = 0; n < n0; n++) {
      const tt = currentTime + n / sr; if (tt < this.start) { L0[n] = 0; if (R0) R0[n] = 0; continue; }
      const age = this.age++, rel = this.off || (this.relAt >= 0 && tt >= this.relAt);
      if (rel && !this.rd) { this.rd = 1; const g0 = this.g, a0 = this.a1; this.setLoss(0.11, 0.035); this.Dfix += Bass.lpd(this.a1, 2 * Math.PI * this.f / sr) - Bass.lpd(a0, 2 * Math.PI * this.f / sr); }
      const En = this.E0 > 0 ? Math.min(1.6, this.e / this.E0) : 1, sc = 1 / (bm * (1 + this.tm * En)), D = Math.max(3, (this.Db + this.Dfix) * sc - this.Dfix);
      const rp = this.w - D, i0 = Math.floor(rp), d = rp - i0, i1 = ((i0 % N) + N) % N, im = (i1 - 1 + N) % N, i2 = (i1 + 1) % N, i3 = (i1 + 2) % N;
      let x = -d * (d - 1) * (d - 2) / 6 * b[im] + (d + 1) * (d - 1) * (d - 2) / 2 * b[i1] - (d + 1) * d * (d - 2) / 2 * b[i2] + (d + 1) * d * (d - 1) / 6 * b[i3];
      let y = this.g * (1 + this.a1) * x - this.a1 * this.l1; this.l1 = y;
      for (let k = 0; k < M; k++) { const xi = y; y = ad * xi + ap[k * 2] - ad * ap[k * 2 + 1]; ap[k * 2] = xi; ap[k * 2 + 1] = y; }
      if (y > this.th) y = this.th + (y - this.th) * 0.3;
      b[this.w] = y; this.w = (this.w + 1) % N;
      const sl = y - this.yp; this.yp = y; this.e += (sl * sl - this.e) / this.L; if (!this.E0 && age > this.L * 1.5) this.E0 = Math.max(1e-12, this.e);
      const at = y - b[((this.w - 1 - this.P) % N + N) % N], v = at - this.pu1; this.pu1 = at;
      const q = c[0] * v + c[1] * z[0] + c[2] * z[1] - c[3] * z[2] - c[4] * z[3]; z[1] = z[0]; z[0] = v; z[3] = z[2]; z[2] = q;
      let th = 0; if (age < sr * 0.02) { this.nz += (this.rnd() * 2 - 1 - this.nz) * (this.hard > 0.5 ? 0.7 : 0.03); const env = 1 - age / (sr * 0.02); th = this.nz * env * env * this.vel * (this.hard > 0.5 ? 0.05 * this.hard : 0.5 * (1 - this.hard)); }
      const A = q * this.gain + th;
      L0[n] = A; if (R0) R0[n] = A;
      const aa = A < 0 ? -A : A; if (aa > pk) pk = aa;
    }
    this.quiet = pk < 2e-5 && this.age > sr * 0.05 ? this.quiet + 1 : 0;
    return this.age < this.life && this.quiet < 40;
  }
}
registerProcessor('nb-bass', Bass);
class SideEar extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{ name: 'att', defaultValue: 0.005, minValue: 0.0005, maxValue: 1, automationRate: 'k-rate' }, { name: 'rel', defaultValue: 0.2, minValue: 0.005, maxValue: 3, automationRate: 'k-rate' }, { name: 'sens', defaultValue: 4, minValue: 0, maxValue: 60, automationRate: 'k-rate' }]; }
  constructor() { super(); live(this); this.e = 0; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0] && ins[0][0], o = outs[0][0], sr = sampleRate, ca = 1 - Math.exp(-1 / (P.att[0] * sr)), cr = 1 - Math.exp(-1 / (P.rel[0] * sr)), g = P.sens[0];
    let e = this.e;
    for (let n = 0; n < o.length; n++) { const x = i ? Math.abs(i[n]) * g : 0; e += (x - e) * (x > e ? ca : cr); o[n] = e > 1 ? 1 : e; }
    this.e = e; return true;
  }
}
registerProcessor('nb-ear', SideEar);
class FShift extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{ name: 'hz', defaultValue: 0, minValue: -5000, maxValue: 5000 }, { name: 'spread', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' }, { name: 'fb', defaultValue: 0, minValue: 0, maxValue: 0.95, automationRate: 'k-rate' }, { name: 'dt', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' }, { name: 'damp', defaultValue: 20000, minValue: 200, maxValue: 20000, automationRate: 'k-rate' }]; }
  constructor() { super(); live(this); const A = [0.6923878, 0.9360654322959, 0.9882295226860, 0.9987488452737], B = [0.4021921162426, 0.8561710882420, 0.9722909545651, 0.9952884791278];
    this.A = A.map(a => a * a); this.B = B.map(b => b * b); this.st = [0, 1].map(() => ({ a: this.A.map(() => [0, 0, 0, 0]), b: this.B.map(() => [0, 0, 0, 0]), d: 0, fb: 0, lb: new Float32Array(65536), lw: 0, lp: 0 })); this.ph = [0, 0]; }
  chain(cs, s, x) { for (let k = 0; k < cs.length; k++) { const c = cs[k], z = s[k], y = c * (x + z[3]) - z[1]; z[1] = z[0]; z[0] = x; z[3] = z[2]; z[2] = y; x = y; } return x; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], sr = sampleRate, sp = P.spread[0], fb = P.fb[0], H = P.hz, dt = Math.min(65000, Math.round(P.dt[0] * sr)), kd = 1 - Math.exp(-2 * Math.PI * P.damp[0] / sr);
    for (let c = 0; c < o.length; c++) { const inp = i && i[c] ? i[c] : (i && i[0]), out = o[c], S = this.st[c] || this.st[0];
      for (let n = 0; n < out.length; n++) {
        let back = S.fb; if (dt > 0) back = S.lb[(S.lw - dt + 65536) & 65535]; S.lp += (back - S.lp) * kd;
        const hz = (H.length > 1 ? H[n] : H[0]) * (c === 1 ? 1 - 2 * sp : 1), x = (inp ? inp[n] : 0) + S.lp * fb;
        const re = this.chain(this.A, S.a, x), im = this.chain(this.B, S.b, x), I = S.d; S.d = re;
        this.ph[c] += hz / sr; this.ph[c] -= Math.floor(this.ph[c]); const a = this.ph[c] * 6.283185307;
        const y = I * Math.cos(a) - im * Math.sin(a); S.fb = y; S.lb[S.lw] = y; S.lw = (S.lw + 1) & 65535; out[n] = y;
      } }
    return true; }
}
registerProcessor('nb-fshift', FShift);
const CLK = [['aT', 0, -1e9, 1e9], ['aB', 0, -1e9, 1e9], ['spb', 0.5, 0.05, 4], ['run', 0, 0, 1], ['seed', 0, 0, 1000]];
const prm = a => CLK.concat(a).map(([name, d, lo, hi]) => ({ name, defaultValue: d, minValue: lo, maxValue: hi, automationRate: 'k-rate' }));
const hsh = k => { const x = Math.sin(k * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
class Tape8 extends AudioWorkletProcessor {
  constructor() { super(); live(this); this.N = Math.ceil(sampleRate * 10); this.b = [new Float32Array(this.N), new Float32Array(this.N)]; this.w = 0; this.k = NaN; this.z = 0; this.cap = 0; }
  rd(c, p) { const N = this.N, i0 = Math.floor(p), f = p - i0, a = ((i0 % N) + N) % N, b = (a + 1) % N, B = this.b[c]; return B[a] + (B[b] - B[a]) * f; }
  beat(P, n) { return P.aB[0] + (currentTime + n / sampleRate - P.aT[0]) / P.spb[0]; }
}
class Heat extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{ name: 'att', defaultValue: 4, minValue: 0.05, maxValue: 60, automationRate: 'k-rate' }, { name: 'rel', defaultValue: 4, minValue: 0.05, maxValue: 60, automationRate: 'k-rate' }]; }
  constructor() { super(); live(this); this.e = 0; this.f = 0; }
  process(ins, outs, P) {
    if (this.dead) return false;
    const i = ins[0], o = outs[0], sr = sampleRate, a = Math.exp(-1 / (P.att[0] * sr)), r = Math.exp(-1 / (P.rel[0] * sr)), q = Math.exp(-1 / (0.03 * sr));
    for (let n = 0; n < o[0].length; n++) { let x = 0; if (i && i.length) for (const c of i) x = Math.max(x, Math.abs(c[n])); this.f = Math.max(x, this.f * q); this.e = this.f > this.e ? a * this.e + (1 - a) * this.f : r * this.e + (1 - r) * this.f; for (const c of o) c[n] = this.e; }
    return true;
  }
}
registerProcessor('nb-heat', Heat);
class Drip extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [['sens', 0.5, 0, 1], ['fall', 12, 0, 36], ['len', 1, 0.1, 4], ['thick', 0.5, 0, 1], ['hang', 0, 0, 0.4], ['n', 4, 1, 8]].map(([name, d, lo, hi]) => ({ name, defaultValue: d, minValue: lo, maxValue: hi, automationRate: 'k-rate' })); }
  constructor() { super(); live(this); this.N = Math.ceil(sampleRate * 6); this.b = [new Float32Array(this.N), new Float32Array(this.N)]; this.w = 0; this.ef = 0; this.es = 0; this.cool = 0; this.v = []; this.side = 1; }
  rnd() { this.seed = ((this.seed || 5) * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; }
  rd(c, p) { const N = this.N, i0 = Math.floor(p), f = p - i0, a = ((i0 % N) + N) % N, b = (a + 1) % N, B = this.b[c]; return B[a] + (B[b] - B[a]) * f; }
  process(ins, outs, P) {
    if (this.dead) return false;
    const i = ins[0], o = outs[0], sr = sampleRate, ratio = 3.2 - P.sens[0] * 2.4, thr = 0.02 + (1 - P.sens[0]) * 0.12, fall = P.fall[0], L = P.len[0] * sr, hang = Math.floor(P.hang[0] * sr), th = P.thick[0], maxV = Math.round(P.n[0]);
    const fa = Math.exp(-1 / (0.001 * sr)), fr = Math.exp(-1 / (0.012 * sr)), sa = Math.exp(-1 / (0.06 * sr));
    for (let n = 0; n < o[0].length; n++) {
      const x0 = i && i.length ? i[0][n] : 0, x1 = i && i.length ? (i[1] || i[0])[n] : 0, ax = Math.max(Math.abs(x0), Math.abs(x1));
      this.b[0][this.w] = x0; this.b[1][this.w] = x1;
      this.ef = ax > this.ef ? fa * this.ef + (1 - fa) * ax : fr * this.ef + (1 - fr) * ax; this.es = sa * this.es + (1 - sa) * ax;
      if (this.cool > 0) this.cool--;
      else if (this.ef > thr && this.ef > this.es * ratio) { if (this.v.length >= maxV) this.v.shift(); this.side = -this.side; this.v.push({ s: this.w - 96, p: 0, z: 0, lp: [0, 0], pan: this.side * (0.2 + this.rnd() * 0.4) }); this.cool = Math.floor(sr * 0.09); }
      let l = 0, r = 0;
      for (let k = this.v.length - 1; k >= 0; k--) {
        const V = this.v[k];
        if (V.z >= hang) {
          const z = V.z - hang, u = z / L, rate = Math.pow(2, -fall * Math.pow(u, 0.7) / 12), e = Math.pow(Math.max(0, 1 - u), 1.4) * Math.min(1, z / 64), cf = 0.5 * (1 - th * 0.85) * (1 - u * 0.8) + 0.02;
          for (let c = 0; c < 2; c++) { const y = this.rd(c, V.s + V.p) * e; V.lp[c] += (y - V.lp[c]) * cf; }
          l += V.lp[0] * (1 - V.pan); r += V.lp[1] * (1 + V.pan); V.p += rate;
          if (u >= 1) { this.v.splice(k, 1); continue; }
        }
        V.z++;
      }
      o[0][n] = l * 0.55; if (o[1]) o[1][n] = r * 0.55;
      this.w = (this.w + 1) % this.N;
    }
    return true;
  }
}
registerProcessor('nb-drip', Drip);
const MSRC = ['none', 'ENV 2', 'ENV 3', 'LFO 1', 'LFO 2', 'VELOCITY', 'NOTE', 'RANDOM', 'ENV 1', 'MACRO 1', 'MACRO 2', 'MACRO 3', 'MACRO 4', 'ENV 4', 'LFO 3', 'LFO 4', 'PRESS', 'SLIDE', 'WHEEL'];
const MDST = ['POS A', 'POS B', 'POS C', 'WARP A', 'WARP B', 'WARP C', 'CUT 1', 'RES 1', 'CUT 2', 'PITCH', 'FINE', 'FM', 'LEVEL A', 'LEVEL B', 'LEVEL C', 'PAN', 'VOLUME', 'DETUNE', 'NOISE', 'SUB', 'RES 2', 'NOISE CUT', 'DIST', 'LFO 1 SPEED', 'LFO 2 SPEED', 'WIDTH', 'LFO 3 SPEED', 'LFO 4 SPEED', 'SPEC A', 'SPEC B', 'SPEC C', 'GRAIN SIZE', 'GRAIN DENSITY', 'GRAIN SPRAY', 'HIVE', 'TENSION', 'VOWEL', 'SIZE', 'GROWL'];
const NBSMP = {};
function smpIn(o) {
  if (!o || !o.id) return null; if (NBSMP[o.id]) return NBSMP[o.id]; if (!o.d) return null;
  const L = [o.d]; let a = o.d;
  const h = [], I0 = x => { let s = 1, t = 1; for (let k = 1; k < 30; k++) { t *= (x / (2 * k)) * (x / (2 * k)); s += t; } return s; };
  let sum = 0; for (let j = 0; j < 12; j++) { const m = 2 * j - 11, w = I0(7 * Math.sqrt(1 - Math.pow(m / 12, 2))) / I0(7), v = Math.sin(Math.PI * m / 2) / (Math.PI * m) * w; h.push(v); sum += v; }
  for (let j = 0; j < 12; j++) h[j] /= sum;
  for (let l = 1; l < 6 && a.length > 64; l++) { const n = a.length >> 1, b = new Float32Array(n);
    for (let i = 0; i < n; i++) { const c = 2 * i; let y = 0.5 * a[c]; for (let j = 0; j < 12; j++) { const q = c + 2 * j - 11; if (q >= 0 && q < a.length) y += 0.5 * h[j] * a[q]; } b[i] = y; }
    L.push(b); a = b; }
  let pk = 1e-4; for (let i = 0; i < o.d.length; i++) { const a = o.d[i] < 0 ? -o.d[i] : o.d[i]; if (a > pk) pk = a; }
  return (NBSMP[o.id] = { L, sr: o.sr || 48000, n: o.d.length, g: Math.min(30, 0.8 / pk) });
}
const WIN = (() => { const w = new Float32Array(1026); for (let i = 0; i <= 1024; i++) w[i] = 0.5 - 0.5 * Math.cos(Math.PI * 2 * i / 1024); w[1025] = 0; return w; })();
const FMT = [[300, 870, 2240], [570, 840, 2410], [730, 1090, 2440], [530, 1840, 2480], [270, 2290, 3010]];
class Serp extends AudioWorkletProcessor {
  constructor(opt) {
    super(); live(this);
    const P = (opt && opt.processorOptions) || {}, s = P.s || {}, ix = (v, n) => Math.min(n - 1, Math.max(0, Math.floor((v || 0) * n))), ex = (a, b, v) => a * Math.pow(b / a, v), d = (v, x) => v == null ? x : v, on = v => d(v, 0.75) >= 0.5;
    const hq = ix(s.hq, 4); this.os = hq === 0 ? (P.off ? 2 : 1) : hq === 1 ? 1 : hq === 2 ? 2 : (P.off ? 4 : 1);
    const sr = this.sr = sampleRate * this.os;
    this.start = P.start || 0; this.dur = P.dur == null ? 0.5 : P.dur; this.f = P.f || 220; this.f0 = P.from || this.f; this.vel = d(P.vel, 0.8); this.seed = P.seed || 1;
    const X8 = a => Array.isArray(a) && a.length ? a : null; this.xb = X8(P.ex && P.ex.b); this.xp = X8(P.ex && P.ex.p); this.xs = X8(P.ex && P.ex.s);
    this.pbr = [2, 12, 24, 48][ix(d(s.pbr, 0.9), 4)]; this.lx = null; this.lxs = [0, 0, 0]; this.wh = d(P.wh, 0);
    this.port.onmessage = e => { const m = e.data; if (m === 'kill') this.dead = true; if (m === 'off' && this.rel < 0) this.relAt = currentTime; if (m === 'cut') { this.relAt = currentTime; this.e1[3] = 0.015; this.E[0].kr = Math.exp(-4.6 / (0.015 * this.sr)); this.E[0].cut = 1; }
      if (m && m.x) this.lx = m.x; if (m && m.w != null) this.wh = m.w; };
    const N = 2048, L = WT.HL.length, tab = (t, K) => { const id = Math.min(WT.NAMES.length - 1, Math.max(0, Math.round(t || 0))), wa = s['wau' + K] && s['wau' + K].f ? s['wau' + K] : s.wau; if (id === WT.TAPED && !(wa && wa.f)) return WT.table(0, N, L); return WT.table(id, N, L, id === 24 ? (s.wdk && s.wdk.length ? s.wdk : s.wd1) : id === WT.TAPED ? wa : null, id === 24 && !(s.wdk && s.wdk.length) ? s.wd2 : null); };
    const gave = K => { const o = P['smp' + K] || P.smp; if (!o) return null; const S = smpIn(o); if (!S) return null; const st = Math.max(0, Math.min(0.99, o.st || 0));
      const G = { S, sst: st, sen: Math.max(st + 0.01, Math.min(1, o.en == null ? 1 : o.en)), root: o.root || 261.63, w: 0 };
      if (o.x && o.w > 0.001) { const S2 = smpIn(o.x); if (S2) { const s2 = Math.max(0, Math.min(0.99, o.x.st || 0)); G.B = { S: S2, sst: s2, sen: Math.max(s2 + 0.01, Math.min(1, o.x.en == null ? 1 : o.x.en)), root: o.x.root || 261.63 }; G.w = Math.min(1, o.w); } }
      return G; };
    const osc = (k, o, t, pos, w, wa, u, dt, l, se, bl, fn, pn, ph, sk) => ({ on: on(o), kind: ix(s['ok' + k], 7), ht: d(s['ht' + k], 0.3), hp: d(s['hp' + k], 0), K: k.toUpperCase(), G: gave(k.toUpperCase()), kd: d(s['kd' + k], 0.5), kb: d(s['kb' + k], 0.5), kx: d(s['kx' + k], 0.3), sm: ix(s['sm' + k], 9), sx: d(s['sx' + k], 0.5), gz: d(s['gz' + k], 0.35), gd: d(s['gd' + k], 0.4), gs: d(s['gs' + k], 0.1),
      tab: tab(t, k.toUpperCase()), pos: pos || 0, warp: ix(w, 14), wamt: wa || 0, w2: ix(s['v' + k], 14), w2a: d(s['y' + k], 0.3), uni: 1 + Math.round((u || 0) * 15), stack: ix(sk, 8), det: (dt || 0) * 60, lvl: l || 0, ratio: Math.pow(2, (Math.round(d(se, 0.5) * 48) - 24) / 12 + (d(fn, 0.5) - 0.5) * 200 / 1200), blend: d(bl, 0.6), pan: (d(pn, 0.5) - 0.5) * 2, rst: ix(ph, 2) === 1 });
    this.O = [osc('a', s.onA, P.tA, s.pa, s.wa, s.xa, s.ua, s.da, d(s.la, 0.8), s.sa, s.ba, s.fna, s.pna, s.pha, s.ska), osc('b', s.onB, P.tB, s.pb, s.wb, s.xb, s.ub, s.db, s.lb || 0, s.sb, s.bb, s.fnb, s.pnb, s.phb, s.skb), osc('c', s.onC, P.tC, s.pc, s.wc, s.xc, s.uc, s.dc, s.lc3 || 0, s.sc, s.bc, s.fnc, s.pnc, s.phc, s.skc)];
    this.O.forEach(O => { if ((O.kind === 2 || O.kind === 3) && !O.G) O.kind = 0; if (O.kind === 1) O.dyn = { a: null, b: null, x: 1, key: '', n: 0 }; });
    this.fmm = ix(s.fmm, 10); this.fma = s.fma || 0; this.fbA = 0; this.fbA1 = 0; this.fbk = 0; this.fsub = 0;
    this.sub = on(s.onS) ? (s.sub || 0) : 0; this.subw = ix(s.subw, 3); this.subo = ix(s.subo, 2); this.subDry = ix(s.srt, 2) === 1;
    this.noise = on(s.onN) ? (s.noise || 0) : 0; this.ntone = d(s.nc, 0.5); this.nty = ix(s.nty, 9); this.nft = ix(s.nft, 5); this.nfc = ex(30, 18000, d(s.nfc, 0.6)); this.nfr = s.nfr == null ? 0.2 : s.nfr; this.nkt = s.nkt || 0; this.nenv3 = ix(s.nen, 2) === 1; this.nDry = ix(s.nrt, 2) === 1;
    const FT = (t, c, r) => ({ t: ix(t, 17), cut: ex(30, 18000, d(c, 0.7)), res: r || 0 });
    this.F1 = FT(s.ft, s.fc, s.fr); this.F1on = on(s.onF); this.F2 = FT(s.ft2, s.fc2, s.fr2); this.f2 = ix(s.f2on, 3); this.drive = 1 + (s.fd || 0) * 8; this.tdrive = Math.tanh(this.drive); this.fenv = (d(s.fe, 0.5) - 0.5) * 12; this.key = s.fk || 0;
    this.dty = on(s.onD) ? ix(s.dty, 10) : 0; this.dam = d(s.dam, 0.35); this.dmx = d(s.dmx, 1); this.dpre = ix(s.dpo, 2) === 1; this.dlp = 1 - Math.exp(-2 * Math.PI * ex(400, 18000, d(s.dtn, 1)) / sr);
    const tm = (v, lo, hi) => lo + Math.pow(v || 0, 2) * (hi - lo);
    this.e1 = [tm(s.a1, 0.001, 4), tm(d(s.d1, 0.3), 0.005, 6), d(s.s1, 0.7), tm(d(s.r1, 0.3), 0.005, 8)];
    this.e2 = [tm(s.ma, 0.001, 4), tm(d(s.md, 0.4), 0.005, 6), d(s.ms, 0.3), tm(d(s.mr, 0.3), 0.005, 8)];
    this.e3 = [tm(s.na, 0.001, 4), tm(d(s.nd, 0.4), 0.005, 6), d(s.ns, 0.5), tm(d(s.nr, 0.3), 0.005, 8)];
    this.e4 = [tm(s.qa, 0.001, 4), tm(d(s.qd, 0.4), 0.005, 6), d(s.qs, 0.5), tm(d(s.qr, 0.3), 0.005, 8)];
    this.E = [[this.e1, s.e1c], [this.e2, s.e2c], [this.e3, s.e3c], [this.e4, s.e4c]].map(([E, c]) => ({ E, st: 0, v: 0, o: 0, lr: 1, or: 1, p: Math.pow(2, (d(c, 0.5) - 0.5) * 4), ka: 1 - Math.exp(-1.466 / (Math.max(0.0005, E[0]) * sr)), kd: Math.exp(-4.6 / (E[1] * sr)), kr: -1 }));
    this.e2a = (d(s.ea, 0.5) - 0.5) * 2; this.e2b = (d(s.eb, 0.5) - 0.5) * 2;
    this.npi = (d(s.npi, 0.5) - 0.5) * 8;
    const bpm = P.bpm || 120, rate = (r, free) => free ? 0.05 + Math.pow(r || 0, 2) * 18 : bpm / 60 / [0.25, 0.5, 1, 2, 4, 8, 16][ix(d(r, 0.4), 7)];
    const pts = a => Array.isArray(a) && a.length ? a.map(v => v * 2 - 1) : [0, 0.7, 1, 0.7, 0, -0.7, -1, -0.7];
    const cps = a => Array.isArray(a) && a.length >= 2 && Array.isArray(a[0]) ? a.map(p => [Math.max(0, Math.min(1, +p[0] || 0)), Math.max(0, Math.min(1, +p[1] || 0)), Math.max(-1, Math.min(1, +p[2] || 0))]).sort((x, y) => x[0] - y[0]) : null;
    const lf = (o, r, f, sh, md, fd, w, k, cp, sg) => ({ on: on(o), hz: rate(r, f >= 0.5), sh: ix(sh, 8), cx: 0.1, cy: 0, cz: 0, once: ix(md, 2) === 1, fade: tm(fd, 0, 4), pts: pts(w), k: Math.pow(2, (d(k, 0.5) - 0.5) * 4), cp: cps(cp), shared: ix(sg, 2) === 1 });
    this.l1 = lf(s.onL1, s.lr, s.lf, s.ls, s.l1m, s.l1d, s.lw1, s.l1k, s.lq1, s.l1g); this.l2 = lf(s.onL2, s.l2r, s.l2f, s.l2s, s.l2m, s.l2d, s.lw2, s.l2k, s.lq2, s.l2g);
    this.l3 = lf(s.onL3, d(s.l3r, 0.4), s.l3f, s.l3s, s.l3m, s.l3d, s.lw3, s.l3k, s.lq3, s.l3g); this.l4 = lf(s.onL4, d(s.l4r, 0.6), s.l4f, s.l4s, s.l4m, s.l4d, s.lw4, s.l4k, s.lq4, s.l4g);
    this.lp = (d(s.lp, 0.5) - 0.5) * 2; this.lc = (d(s.lc, 0.5) - 0.5) * 2; this.lv = (s.lv || 0) * 0.04; this.la = s.la2 || 0;
    this.l2p = (d(s.l2p, 0.5) - 0.5) * 2; this.l2c = (d(s.l2c, 0.5) - 0.5) * 2; this.l2v = (s.l2v || 0) * 0.04; this.l2a = s.l2a || 0;
    this.mc = [s.mc1 || 0, s.mc2 || 0, s.mc3 || 0, s.mc4 || 0];
    this.mx = []; if (on(s.onM)) for (let k = 1; k <= 16; k++) { const src = ix(s['m' + k + 's'], MSRC.length), dst = ix(s['m' + k + 'd'], MDST.length), amt = (d(s['m' + k + 'a'], 0.5) - 0.5) * 2, cv = Math.pow(2, (d(s['m' + k + 'c'], 0.5) - 0.5) * -4), ax = ix(s['m' + k + 'x'], MSRC.length); if (src && Math.abs(amt) > 0.005) this.mx.push([src, dst, amt, cv, ax]); }
    this.u3 = this.mx.some(q => q[0] === 14 || q[4] === 14); this.u4 = this.mx.some(q => q[0] === 15 || q[4] === 15); this.mxPlain = this.mx.every(q => q[3] === 1 && !q[4]);
    this.hive = s.hiv || 0; this.hvt = tm(s.hvt, 0, 8);
    this.nmk = this.O.every(o => !o.on || o.lvl < 0.001) && this.sub < 0.001 ? 3.2 : 1;
    this.vcut = ((s.vcut == null ? 0.5 : s.vcut) - 0.5) * 2 * (this.vel - 0.6) * 5;
    this.thr = s.onT != null && s.onT >= 0.5; if (this.thr) { const g0 = d(s.thg, 0); this.th = { v: d(s.thv, 0.5), z: d(s.thz, 0.5), g: Math.min(1, g0 + d(s.thh, 0) * this.vel), b: d(s.thb, 0), mx: d(s.thm, 1), zs: new Float64Array(16), a1: new Float64Array(4), a2: new Float64Array(4), a3: new Float64Array(4), k: new Float64Array(4), gp: 0, rf: 0, rf2: 0, jt: 0, ev: 0, n: 0, bn: 0, lp: new Float64Array(2), lk: 1 - Math.exp(-2 * Math.PI * 7500 / sr) }; }
    this.width = d(s.wd, 0.6); this.gain = Math.pow(d(s.vol, 0.7), 1.5) * 1.1; this.glide = (s.gl || 0) * 0.6; this.vs = d(s.vs, 1);
    let r = this.seed >>> 0 || 7; const rnd = () => { r ^= r << 13; r ^= r >>> 17; r ^= r << 5; return (r >>> 0) / 4294967296; }; this.rnd = rnd;
    this.rand = rnd() * 2 - 1; this.note = Math.log2(this.f / 261.6) / 4;
    const STK = [[0], [0, 12], [0, 7], [0, 12, 24], [0, -12], [0, 7, 12], [0, 3, 7], [0, 4, 7]];
    const SZ = [-1, -0.5716, -0.1775, 0, 0.1810, 0.5650, 0.9766], szAt = u => { const q = u * 6, i = Math.min(5, Math.floor(q)), f = q - i; return SZ[i] + (SZ[i + 1] - SZ[i]) * f; };
    const vox = O => { const v = [], st = STK[O.stack || 0], n = Math.max(O.uni, st.length), x = O.blend, gC = (-0.55366 * x + 0.99785) * 1.504, gS = (-0.73764 * x * x + 1.2841 * x + 0.044372) * 1.504;
      for (let k = 0; k < n; k++) { const sp = n > 1 ? (st.length > 1 && O.uni <= st.length ? k / (n - 1) * 2 - 1 : szAt(k / (n - 1))) : 0, mid = Math.abs(sp) < 0.01 || st.length > 1;
        v.push({ ph: O.rst ? k * 0.013 : rnd(), mul: Math.pow(2, sp * O.det / 1200 + st[k % st.length] / 12), sp, g: st.length > 1 ? 1 : mid ? gC : gS, mulD: Math.pow(2, sp * O.det / 1200 + st[k % st.length] / 12), lev: 0, gl: 0.5, gr: 0.5, ax: 0, dr: 0, drv: 0,
          G: O.kind === 2 ? [0, 1, 2, 3, 4, 5, 6, 7].map(() => ({ a: 0, p: 0, inc: 0, t: 0, len: 1, l: 0 })) : null, gt: 1 + ((k * 97) % 400), sp0: -1, sp1: -1, W: O.kind === 4 ? { b: new Float32Array(8192), w: 0, lp: 0, ap: 0, ex: 0, ph: 0 } : null, Md: O.kind === 5 ? { y1: new Float64Array(12), y2: new Float64Array(12), t: 0, nz: 0 } : null, Ht: O.kind === 6 ? { x: 2 * (0.5 + rnd() * 0.5) * (O.rst ? 1 : (rnd() < 0.5 ? -1 : 1)), y: 0, t: 0 } : null }); } return v; };
    this.V = this.O.map(vox); this.subph = 0; this.l1.ph = rnd(); this.l2.ph = rnd(); this.l1.v = rnd() * 2 - 1; this.l2.v = rnd() * 2 - 1; this.l1.sv = this.l1.v; this.l2.sv = this.l2.v;
    if (this.l1.once) this.l1.ph = 0; if (this.l2.once) this.l2.ph = 0;
    [this.l3, this.l4].forEach(L => { L.ph = L.once ? 0 : this.rnd(); L.v = this.rnd() * 2 - 1; L.sv = L.v; });
    [this.l1, this.l2, this.l3, this.l4].forEach(L => { L.cx = 0.1 + L.v * 6; L.cy = L.sv * 3; });
    [this.l1, this.l2, this.l3, this.l4].forEach(L => { if (!L.shared || L.once) return; const c = this.start * L.hz; L.ph = c - Math.floor(c); const h = q => { const x = Math.sin(q * 12.9898 + 4.1) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; }; L.cyc = Math.floor(c); L.v = h(L.cyc); L.sv = h(L.cyc - 1); });
    this.drf = (s.drf || 0) * 7;
    this.fvar = 1 + (rnd() * 2 - 1) * (s.drf || 0) * 0.03;
    this.z = [[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]]; this.lad = [0, 1, 2, 3].map(() => [0, 0, 0, 0, 0]); this.k35 = [0, 1, 2, 3].map(() => new Float64Array(4)); this.dio = [0, 1, 2, 3].map(() => new Float64Array(4)); this.zn = [0, 0];
    this.cb = [0, 1, 2, 3].map(() => new Float32Array(4096)); this.cw = 0; this.fmz = [0, 1, 2, 3].map(() => new Float64Array(6)); this.phz = [0, 1, 2, 3].map(() => new Float64Array(8));
    this.fs = [{ fg: [0, 0, 0], fk: [1, 1, 1], fa: [1, 0.5, 0.3], pg: [0, 0, 0, 0, 0, 0], pf: 0 }, { fg: [0, 0, 0], fk: [1, 1, 1], fa: [1, 0.5, 0.3], pg: [0, 0, 0, 0, 0, 0], pf: 0 }];
    this.pk = [0, 0, 0]; this.drop = { a: 0, ph: 0, hz: 2000, k: 0.999 }; this.crk = 0; this.mph = [0, 0, 0, 0, 0, 0];
    this.wng = { ph: 0, hz: 16 + this.ntone * 44, j: 0, rest: 0, a: 1 }; this.chn = { left: 0, wait: 0, n: 0, amp: 0, ex: 0, exa: 0, c: new Float64Array(12), rq: new Float64Array(12), g: new Float64Array(12), y1: new Float64Array(12), y2: new Float64Array(12) }; this.fur = { b: 0, l: 0.5 };
    this.dh = [0, 0]; this.dc = [0, 0]; this.dz = [0, 0]; this.dn = 0; this.dx1 = [0, 0]; this.dF = [0, 0]; this.dg = [-1, -1]; this.dk = [-1, -1]; const ring = () => ({ i: 0, x: new Float64Array(16), e: new Float64Array(16), o: new Float64Array(16) }); this.osr = [ring(), ring()]; this.dcb = [0, 0, 0, 0]; this.kdc = Math.exp(-2 * Math.PI * 8 / sampleRate);
    this.dec = [ring(), ring(), ring(), ring()]; this.ob = [0, 0, 0, 0];
    this.env1 = 0; this.env2 = 0; this.env3 = 0; this.env4 = 0; this.rel = -1; this.relAt = this.dur >= 0 ? this.start + this.dur : Infinity; this.gk = 0; this.ncol = 0; this.nprev = 0; this.g1 = 0; this.g2 = 0; this.k1 = 2; this.k2 = 2; this.gn = 0.1; this.kn = 1.6;
    this.wide = this.V.map(V => V.reduce((a, v) => Math.max(a, v.mul), 1));
    this.lev = [0, 0, 0]; this.m = new Float64Array(MDST.length); this.src = new Float64Array(MSRC.length); this.pos = new Float64Array(3); this.raw = new Float64Array(3);
    this.oL = 0; this.oR = 0; this.vib = 1; this.pickLev(this.f > this.f0 ? this.f : this.f0, 1);
  }
  pickLev(fb, vib) {
    const top = sampleRate * 0.45, HL = WT.HL;
    for (let q = 0; q < 3; q++) { const O = this.O[q]; if (!O.on || O.kind === 2 || O.kind === 3) continue; const w = Math.max(0, Math.min(1, O.wamt + this.m[3 + q]));
      const wk = (W, w) => [1, 1 + 4 * w, 1 + 7 * w, 1 + 3 * w, 0.5 / (0.5 - w * 0.45), 1 + w, 1, 1 + 3 * w, 2, 1.5, 1, 1 + w, 1 / (2 * Math.max(0.01, 0.5 - 0.49 * w)), 1 + 9 * w][W] || 1;
      let k = wk(O.warp, w) * (O.w2 ? wk(O.w2, O.w2a) : 1);
      let H = top / (fb * O.ratio * vib * k * 1.06);
      const fm = this.fmm, md = q === 0 && (fm === 1 || fm === 5) ? 1 : q === 0 && fm === 3 ? 2 : q === 1 && fm === 4 ? 2 : -1, own = q === 0 && fm >= 6;
      let rr = 0, idx = 0; if (md >= 0 || own) { const fl = Math.max(0, Math.min(1, this.fma + this.m[11])); idx = 6.2832 * (fm === 5 ? 0.15 : 2.5) * fl * fl; rr = own ? (fm === 6 ? (this.subo ? 0.25 : 0.5) / O.ratio : fm === 7 ? 6 : 1) : this.O[md].ratio * this.wide[md] / O.ratio; }
      for (const v of this.V[q]) { let Hv = H / v.mulD; if (rr) Hv = (Hv - rr / v.mulD) / (1 + idx * rr / v.mulD); let l = 0; while (l < HL.length - 1 && HL[l] > Hv) l++; v.lev = l; } }
  }
  static get HB() { if (Serp._hb) return Serp._hb; const I0 = x => { let s = 1, t = 1; for (let k = 1; k < 30; k++) { t *= (x / (2 * k)) * (x / (2 * k)); s += t; } return s; }, h = [];
    let sum = 0; for (let j = 0; j < 12; j++) { const m = 2 * j - 11, w = I0(7 * Math.sqrt(1 - Math.pow(m / 12, 2))) / I0(7), v = Math.sin(Math.PI * m / 2) / (Math.PI * m) * w; h.push(v); sum += v; }
    return (Serp._hb = h.map(v => v / sum)); }
  static lc(z) { const a = Math.abs(z); return a + Math.log1p(Math.exp(-2 * a)) - 0.6931471805599453; }
  static rq(U) { const a = Math.abs(U), j = Math.round(a); return j * (a - j + 0.5) + j * (j - 1) / 2; }
  read(O, a, b, fr, ph, wamt, v) {
    let p = ph - Math.floor(ph); if (!(p < 1)) p = 0;
    const W = O.warp;
    if (W === 1) { const k = 1 + wamt * 4; p = p < 0.5 ? Math.pow(p * 2, k) * 0.5 : 1 - Math.pow((1 - p) * 2, k) * 0.5; }
    else if (W === 2) { p = (p * (1 + wamt * 7)) % 1; }
    else if (W === 4) { const m = 0.5 - wamt * 0.45; p = p < m ? p / m * 0.5 : 0.5 + (p - m) / (1 - m) * 0.5; }
    else if (W === 5) { p = p < 0.5 ? p * 2 : 2 - p * 2; p *= 0.5 + wamt * 0.5; }
    else if (W === 7) { p = Math.pow(p, 1 + wamt * 3); }
    else if (W >= 12) p = Serp.pdw(W, p, wamt, O);
    const W2 = O.w2; if (W2 && W2 !== 3 && W2 !== 6 && W2 !== 8 && W2 !== 9 && W2 !== 10 && W2 !== 11) p = Serp.pw(W2, p - Math.floor(p), O.w2a, O);
    if (W >= 12 || W2) p -= Math.floor(p);
    if (!(p < 1)) p = 0.999999;
    const N = a.length - 1, x = p * N, i = Math.floor(x), t = x - i, va = a[i] + (a[i + 1] - a[i]) * t, vb = b[i] + (b[i + 1] - b[i]) * t;
    let y = va + (vb - va) * fr;
    if (W === 3 || W === 8 || W === 11) {
      const x1 = v.ax; v.ax = y; const dx = y - x1;
      if (W === 3) { const g = (1 + wamt * 5) * 1.5708; y = Math.abs(dx) > 1e-6 ? (Math.cos(g * x1) - Math.cos(g * y)) / (g * dx) : Math.sin(g * (y + x1) * 0.5); }
      else if (W === 8) { const q = 2 + Math.round((1 - wamt) * 30); y = Math.abs(dx) > 1e-6 ? (Serp.rq(y * q) - Serp.rq(x1 * q)) / (q * q * dx) : Math.round((y + x1) * 0.5 * q) / q; }
      else { const F = z => (1 - wamt) * z * z * 0.5 + wamt * (z * Math.abs(z) - z); y = Math.abs(dx) > 1e-6 ? (F(y) - F(x1)) / dx : (y + x1) * 0.5 + ((Math.abs(y + x1) - 1 - (y + x1) * 0.5) * wamt); }
    }
    else if (W === 6 || W === 10) {
      const rd2 = q => { q -= Math.floor(q); const xx = q * N, ii = Math.floor(xx), tt2 = xx - ii, aa = a[ii] + (a[ii + 1] - a[ii]) * tt2, bb = b[ii] + (b[ii + 1] - b[ii]) * tt2; return aa + (bb - aa) * fr; };
      if (W === 6) y = (y - rd2(p + 0.05 + wamt * 0.9)) * 0.6; else y = (y + rd2(p + wamt * 0.03) + rd2(p - wamt * 0.03)) / 3;
    }
    else if (W === 9) { if (p > 1 - wamt * 0.99) y = -y; }
    if (W2 === 3 || W2 === 8 || W2 === 11) { const x1 = v.ax2 || 0; v.ax2 = y; const dx = y - x1, q2 = O.w2a;
      if (W2 === 3) { const g = (1 + q2 * 5) * 1.5708; y = Math.abs(dx) > 1e-6 ? (Math.cos(g * x1) - Math.cos(g * y)) / (g * dx) : Math.sin(g * (y + x1) * 0.5); }
      else if (W2 === 8) { const q = 2 + Math.round((1 - q2) * 30); y = Math.abs(dx) > 1e-6 ? (Serp.rq(y * q) - Serp.rq(x1 * q)) / (q * q * dx) : Math.round((y + x1) * 0.5 * q) / q; }
      else { const F = z => (1 - q2) * z * z * 0.5 + q2 * (z * Math.abs(z) - z); y = Math.abs(dx) > 1e-6 ? (F(y) - F(x1)) / dx : (y + x1) * 0.5 + ((Math.abs(y + x1) - 1 - (y + x1) * 0.5) * q2); } }
    else if (W2 === 9) { if (p > 1 - O.w2a * 0.99) y = -y; }
    if (W === 2 && !v.nofade) y *= Math.min(1, (1 - ph + Math.floor(ph)) * 40);
    return y;
  }
  static pw(W, p, a, O) {
    if (W === 1) { const k = 1 + a * 4; return p < 0.5 ? Math.pow(p * 2, k) * 0.5 : 1 - Math.pow((1 - p) * 2, k) * 0.5; }
    if (W === 2) return (p * (1 + a * 7)) % 1;
    if (W === 4) { const m = 0.5 - a * 0.45; return p < m ? p / m * 0.5 : 0.5 + (p - m) / (1 - m) * 0.5; }
    if (W === 5) { const q = p < 0.5 ? p * 2 : 2 - p * 2; return q * (0.5 + a * 0.5); }
    if (W === 7) return Math.pow(p, 1 + a * 3);
    if (W >= 12) return Serp.pdw(W, p, a, O);
    return p;
  }
  static pdw(W, p, a, O) {
    if (W === 12) { const d = Math.max(0.01, 0.5 - 0.49 * a), s1 = 1 / (2 * d), s2 = 1 / (2 * (1 - d)), dl = Math.min(0.25 * Math.min(d, 1 - d), 2 * (O.fnow || 0) / sampleRate);
      if (dl > 1e-6) { const x = p - d; if (x > -dl && x < dl) return 0.5 + s1 * x + (s2 - s1) * (x + dl) * (x + dl) / (4 * dl);
        const xw = p < dl ? p : p > 1 - dl ? p - 1 : 2; if (xw < 1) return s2 * xw + (s1 - s2) * (xw + dl) * (xw + dl) / (4 * dl); }
      return p < d ? p * s1 : 0.5 + (p - d) * s2; }
    const other = O.warp === 13 ? (O.w2 === 12 ? O.w2a : -1) : (O.warp === 12 ? O.wamt : -1), d = other >= 0 ? Math.max(0.01, 0.5 - 0.49 * other) : 0.5,
      Im = Math.max(0, 0.45 * sampleRate * Math.min(d, 1 - d) / Math.max(1, O.fnow || 1) - 2), I = Math.min(a * 6, Im);
    const w = t => Math.sin(Math.PI * Math.max(0, Math.min(1, t)));
    if (p < d) { const t = p / d; return p / (2 * d) + w(d / 2) * w(t) * I * Math.sin(2 * Math.PI * t) / (2 * Math.PI); }
    const t = (p - d) / (1 - d); return 0.5 + (p - d) / (2 * (1 - d)) + w(1 - d / 2) * w(t) * I * Math.sin(2 * Math.PI * t) / (2 * Math.PI);
  }
  spectral(q, pos, amt, H) {
    const O = this.O[q], D = O.dyn, T = O.tab, sp = WT.spectra(T), F = WT.F, fp = Math.max(0, Math.min(1, pos)) * (F - 1), fi = Math.floor(fp), tf = fp - fi, A = sp[fi], B = sp[Math.min(F - 1, fi + 1)];
    const a = Math.max(0, Math.min(1, amt)), key = O.sm + ':' + Math.round(fp * 400) + ':' + Math.round(a * 400) + ':' + H;
    if (key === D.key && D.a) return;
    if (D.a && D.n > 0) return; D.key = key; D.n = 256;
    const N = 2048, re = WT.buf.re, im = WT.buf.im, M = WT.buf.m; re.fill(0); im.fill(0);
    const top = Math.min(H, 1000);
    for (let k = 1; k <= top; k++) M[k] = A.m[k] + (B.m[k] - A.m[k]) * tf;
    const md = O.sm;
    const mag = k => { if (md === 3) { const sf = Math.pow(2, (a - 0.5) * 4), u = k / sf; if (u < 1) return 0; const i = Math.floor(u), f = u - i; return i + 1 <= top ? M[i] + (M[i + 1] - M[i]) * f : 0; }
      if (md === 8) { const sh = Math.round((a - 0.5) * 32), j = k - sh; return j >= 1 && j <= top ? M[j] : 0; }
      let g = M[k];
      if (md === 1) { const hc = 1 + a * a * 255; g *= 1 / (1 + Math.pow(k / hc, 8)) * (1 + 1.5 * Math.exp(-Math.pow((k - hc) / (1 + hc * 0.1), 2))); }
      else if (md === 2) { const hc = 1 + a * a * 255; g *= 1 - 1 / (1 + Math.pow(k / hc, 8)); }
      else if (md === 4) { if (a < 0.5) { if (k % 2 === 0) g *= a * 2; } else if (k > 1 && k % 2 === 1) g *= (1 - a) * 2; }
      else if (md === 5) { const n = 1 + Math.round(a * 7); if ((k - 1) % n) g = 0; }
      else if (md === 6) g *= Math.pow(k, (a - 0.5) * 3);
      return g; };
    const G = WT.buf.g; let e0 = 0, e1 = 0; for (let k = 1; k <= top; k++) { G[k] = mag(k); e0 += M[k] * M[k]; e1 += G[k] * G[k]; }
    const nm = (md === 3 || md === 6 || md === 8) && e1 > 1e-12 ? Math.min(4, Math.sqrt(e0 / e1)) : 1;
    for (let k = 1; k <= top; k++) { let ph = (tf < 0.5 ? A : B).p[k]; if (md === 7) { const x = Math.sin(k * 12.9898 + 78.233) * 43758.5453; ph += a * (x - Math.floor(x)) * 6.2832; }
      const g = G[k] * nm * N / 2; re[k] = g * Math.cos(ph); im[k] = g * Math.sin(ph); re[N - k] = re[k]; im[N - k] = -im[k]; }
    WT.ifft(re, im);
    const w = D.b && D.b.length === N + 1 ? D.b : new Float32Array(N + 1); for (let n = 0; n < N; n++) w[n] = re[n]; w[N] = w[0];
    D.b = D.a; D.a = w; D.x = D.b ? 0 : 1;
  }
  lvl(S, inc) { let l = 0, a = Math.abs(inc); const top = S.L.length - 1; while (a > 1 && l < top) { a *= 0.5; l++; } return l; }
  rs(S, p, inc, lv) { const l = lv == null ? this.lvl(S, inc) : lv, B = S.L[l], x = p / (1 << l), i = Math.floor(x), f = x - i, n = B.length;
    if (i < 1 || i + 2 >= n) return i >= 0 && i < n ? B[i] : 0;
    const y0 = B[i - 1], y1 = B[i], y2 = B[i + 1], y3 = B[i + 2], c1 = 0.5 * (y2 - y0), c2 = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3, c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2); return ((c3 * f + c2) * f + c1) * f + y1; }
  grain(O, v, inc, pos, sz, dn, spr) {
    const len = Math.max(64, (0.01 + sz * sz * 0.49) * this.sr), ov = 1 + dn * 7;
    if (--v.gt <= 0) { v.gt = len / ov * (0.75 + this.rnd() * 0.5); const G = O.G.B && this.rnd() < O.G.w ? O.G.B : O.G, S = G.S, n = S.n, a0 = G.sst * n, span = (G.sen - G.sst) * n, gi = inc * O.G.root / G.root * S.sr / O.G.S.sr;
      for (const g of v.G) if (!g.a) { g.a = 1; g.t = 0; g.len = len; g.inc = gi; g.S = S; g.a0 = a0; g.l = this.lvl(S, gi); let c = pos + (this.rnd() * 2 - 1) * spr * 0.5; c -= Math.floor(c); g.p = a0 + c * span; break; } }
    let y = 0; for (const g of v.G) { if (!g.a) continue; const u = g.t / g.len; if (u >= 1) { g.a = 0; continue; } const w = WIN[(u * 1024) | 0]; y += this.rs(g.S, g.p, g.inc, g.l) * w; g.p += g.inc; if (g.p >= g.S.n - 3 || g.p < 1) g.p = g.a0; g.t++; }
    return y / Math.sqrt(Math.max(1, ov * 0.5));
  }
  smp(O, v, inc, pos) { if (!O.G.B) return this.smp1(O.G, v, 'sp0', inc, pos);
    const w = O.G.w * 1.5708, B = O.G.B; return this.smp1(O.G, v, 'sp0', inc, pos) * Math.cos(w) + this.smp1(B, v, 'sp1', inc * O.G.root / B.root * B.S.sr / O.G.S.sr, pos) * Math.sin(w); }
  smp1(G, v, kk, inc, pos) {
    const S = G.S, n = S.n, a0 = G.sst * n, e = Math.min(n - 3, G.sen * n), ls = a0 + Math.max(0, Math.min(0.98, pos)) * (e - a0), X = Math.min(0.03 * S.sr * Math.max(1, inc), (e - ls) * 0.3);
    if (v[kk] < 0) v[kk] = ls;
    let p = v[kk], y = this.rs(S, p, inc);
    if (p > e - X) { const w = (p - (e - X)) / X * 1.5708; y = y * Math.cos(w) + this.rs(S, ls + (p - (e - X)), inc) * Math.sin(w); }
    p += inc; if (p >= e) p = ls + X + (p - e); v[kk] = p; return y;
  }
  str(O, v, f, wave) {
    const W = v.W, sr = this.sr, B = W.b, M = B.length, per = Math.max(2, Math.min(M - 4, sr / Math.max(20, f)));
    const a = 0.08 + Math.pow(O.kb, 1.5) * 0.92, lag = (1 - a) / a, Lg = Math.max(1.5, per - lag);
    if (W.ex < per) {
      const n = W.ex, th = n / per, N = wave.length - 1, x = th * N, i = Math.floor(x), t2 = x - i, tv = wave[i] + (wave[i + 1] - wave[i]) * t2, nz = this.rnd() * 2 - 1;
      B[W.w] = (tv * (1 - O.kx) + nz * O.kx) * 0.9; W.ex++; const y0 = B[W.w]; W.w = (W.w + 1) % M; return y0; }
    let rp = W.w - Lg; while (rp < 0) rp += M; const i0 = Math.floor(rp), fr = rp - i0, x0 = B[i0 % M], x1 = B[(i0 + 1) % M], y = x0 + (x1 - x0) * fr;
    const T60 = 0.15 + Math.pow(O.kd, 2) * 20, gl = Math.pow(10, -3 * (per / sr) / T60);
    W.lp += (y - W.lp) * a; const out = W.lp * gl;
    B[W.w] = out; W.w = (W.w + 1) % M; return out * 1.6;
  }
  static seg(c, p) { const n = c.length; let i = n - 1; for (let j = 0; j < n; j++) if (c[j][0] > p) { i = j - 1; break; }
    let a, b, x0, x1; if (i < 0) { a = c[n - 1]; b = c[0]; x0 = a[0] - 1; x1 = b[0]; } else if (i === n - 1) { a = c[n - 1]; b = c[0]; x0 = a[0]; x1 = b[0] + 1; } else { a = c[i]; b = c[i + 1]; x0 = a[0]; x1 = b[0]; }
    let u = x1 - x0 > 1e-6 ? (p - x0) / (x1 - x0) : 1; if (u < 0) u += 1 / Math.max(1e-6, x1 - x0); u = Math.max(0, Math.min(1, u)); const k = a[2] * 8; if (Math.abs(k) > 1e-3) u = (Math.exp(k * u) - 1) / (Math.exp(k) - 1);
    return (a[1] + (b[1] - a[1]) * u) * 2 - 1; }
  hiveK(q, V, inc) {
    const age = this.tnow - this.start, k0 = Math.max(0, Math.min(1, this.hive + this.m[34])) * (this.hvt > 0 ? Math.min(1, age / this.hvt) : 1);
    if (k0 < 0.002 || V.length < 2) return 0; const O = this.O[q];
    if ((this.gk & 3) === 0 || O.hpsi == null) { let c = 0, s2 = 0; for (const v of V) { c += Math.cos(6.2832 * v.ph); s2 += Math.sin(6.2832 * v.ph); } c /= V.length; s2 /= V.length; O.hR = Math.hypot(c, s2); O.hpsi = Math.atan2(s2, c) / 6.2832; }
    return k0 * k0 * inc * 0.09 * (0.3 + O.hR);
  }
  heart(O, v, f, ten, wave) {
    const H = v.Ht, sr = this.sr, hm = Math.min(1, Math.max(0, (sr * 0.45 / Math.max(20, f) - 6) / 60)), mu = 0.05 + ten * ten * 7.95 * hm, T = Serp.vdpT(mu), dt = T * f / sr, n = Math.max(1, Math.ceil(dt / (mu > 3 ? 0.02 : 0.06))), h = dt / n;
    H.t += f * 1.618 / sr; H.t -= Math.floor(H.t); const N = wave.length - 1, xx = H.t * N, i = Math.floor(xx), tv = wave[i] + (wave[i + 1] - wave[i]) * (xx - i), F = O.hp * O.hp * 3 * tv;
    let x = H.x, y = H.y; const fx = (x2, y2) => y2, fy = (x2, y2) => mu * (1 - x2 * x2) * y2 - x2 + F;
    for (let k = 0; k < n; k++) { const k1x = fx(x, y), k1y = fy(x, y), k2x = fx(x + h * k1x / 2, y + h * k1y / 2), k2y = fy(x + h * k1x / 2, y + h * k1y / 2), k3x = fx(x + h * k2x / 2, y + h * k2y / 2), k3y = fy(x + h * k2x / 2, y + h * k2y / 2), k4x = fx(x + h * k3x, y + h * k3y), k4y = fy(x + h * k3x, y + h * k3y);
      x += h * (k1x + 2 * k2x + 2 * k3x + k4x) / 6; y += h * (k1y + 2 * k2y + 2 * k3y + k4y) / 6; }
    if (!isFinite(x) || Math.abs(x) > 20) { x = 2; y = 0; } H.x = x; H.y = y; return x * 0.55;
  }
  static get VWL() { return Serp._vw || (Serp._vw = [[300, 870, 2240, 3300], [430, 780, 2500, 3400], [730, 1090, 2440, 3400], [530, 1840, 2480, 3500], [280, 2250, 2950, 3700]]); }
  static get VWG() { return Serp._vg || (Serp._vg = [1, 0.63, 0.3, 0.16]); }
  static vdpT(mu) { const L = Serp._vdp || (Serp._vdp = (() => { const out = []; for (let j = 0; j <= 40; j++) { const m2 = 0.05 + j / 40 * 7.95; let x = 2, y = 0, h = Math.min(0.01, 0.2 / (1 + m2)), t = 0, last = -1, per = [], px = x;
        for (let s2 = 0; s2 < 400000 && per.length < 4; s2++) { const ax = y, ay = m2 * (1 - x * x) * y - x, bx = y + h * ay / 2, by = m2 * (1 - (x + h * ax / 2) ** 2) * (y + h * ay / 2) - (x + h * ax / 2); x += h * bx; y += h * by; t += h; if (px < 0 && x >= 0 && y > 0) { if (last >= 0 && t > 40) per.push(t - last); last = t; } px = x; }
        out.push(per.length ? per.reduce((a, b) => a + b) / per.length : 6.2832); } return out; })()); const u = Math.max(0, Math.min(40, (mu - 0.05) / 7.95 * 40)), i = Math.min(39, Math.floor(u)); return L[i] + (L[i + 1] - L[i]) * (u - i); }
  modal(O, v, f, pos) {
    const M = v.Md, sr = this.sr, MAT = Serp.MAT, u = pos * (MAT.length - 1), i = Math.min(MAT.length - 2, Math.floor(u)), fr = u - i;
    if (!M.c || Math.abs(M.f - f) > f * 0.002 || M.u !== u) { M.f = f; M.u = u; M.c = M.c || new Float64Array(12); M.r = M.r || new Float64Array(12); M.g = M.g || new Float64Array(12);
      const T60 = 0.08 + Math.pow(O.kd, 2) * 12;
      for (let k = 0; k < 12; k++) { const rt = MAT[i][k] + (MAT[i + 1][k] - MAT[i][k]) * fr, fk = f * rt; if (fk > sr * 0.45 || fk < 10) { M.g[k] = 0; continue; }
        const tk = T60 / Math.pow(rt, 1.4 - O.kb), rr = Math.pow(10, -3 / (tk * sr)); M.r[k] = rr; M.c[k] = 2 * rr * Math.cos(2 * Math.PI * fk / sr); M.g[k] = Math.sin(2 * Math.PI * fk / sr) / Math.pow(k + 1, 1.2 - O.kb * 0.9); } }
    const age = M.t++, ms = age / sr * 1000, hard = 0.2 + O.kb * 0.8;
    const mw = 0.25 + (1 - hard) * 2.5; let x = 0; if (ms < mw) { const q = Math.sin(Math.PI * ms / mw); x += (1 - O.kx) * (q * q * 0.25 + (this.rnd() * 2 - 1) * 0.03 * hard); }
    if (O.kx > 0.02 && this.rel < 0) { M.nz += ((this.rnd() * 2 - 1) - M.nz) * (0.05 + O.kb * 0.5); x += M.nz * O.kx * 0.12; }
    let y = 0; for (let k = 0; k < 12; k++) { if (!M.g[k]) continue; const yk = M.c[k] * M.y1[k] - M.r[k] * M.r[k] * M.y2[k] + x * M.g[k]; M.y2[k] = M.y1[k]; M.y1[k] = yk; y += yk; }
    return y * 0.12;
  }
  static get MAT() { return Serp._mat || (Serp._mat = [
    [1, 2.756, 5.404, 8.933, 13.34, 18.64, 24.81, 31.87, 39.81, 48.61, 58.3, 68.9],
    [1, 3.99, 9.14, 10.0, 14.6, 20.2, 26.9, 34.6, 43.2, 52.8, 63.4, 74.9],
    [0.5, 1, 1.183, 1.506, 2, 2.514, 2.662, 3.011, 4.166, 5.433, 6.796, 8.215],
    [1, 1.594, 2.136, 2.296, 2.653, 2.918, 3.156, 3.501, 3.6, 4.06, 4.154, 4.601],
    [1, 2.32, 4.25, 6.63, 9.38, 12.5, 16.0, 19.8, 24.0, 28.5, 33.3, 38.4]]); }
  lfo(L, sr, mul, age) {
    if (!L.on) return 0;
    if (!(L.once && L.ph >= 1)) { L.ph += L.hz * mul / sr; if (L.ph >= 1) { if (L.once) L.ph = 1; else { L.ph -= 1; L.sv = L.v; if (L.shared) { L.cyc++; const x = Math.sin(L.cyc * 12.9898 + 4.1) * 43758.5453; L.v = (x - Math.floor(x)) * 2 - 1; } else L.v = this.rnd() * 2 - 1; } } }
    let p = Math.min(0.99999, L.ph); if (L.k !== 1) p = Math.pow(p, L.k); let y;
    switch (L.sh) { case 0: y = Math.sin(p * 6.2832); break; case 1: y = 1 - 4 * Math.abs(p - 0.5); break; case 2: y = p * 2 - 1; break; case 3: y = p < 0.5 ? 1 : -1; break; case 4: y = L.v; break;
      case 6: case 7: { const dt = Math.min(0.02, L.hz * mul / sr * (L.sh === 6 ? 2.2 : 6)); if (L.sh === 6) { const dx = 10 * (L.cy - L.cx), dy = L.cx * (28 - L.cz) - L.cy, dz = L.cx * L.cy - 2.667 * L.cz; L.cx += dx * dt; L.cy += dy * dt; L.cz += dz * dt; y = Math.max(-1, Math.min(1, L.cx / 19)); }
        else { const dx = -L.cy - L.cz, dy = L.cx + 0.2 * L.cy, dz = 0.2 + L.cz * (L.cx - 5.7); L.cx += dx * dt; L.cy += dy * dt; L.cz += dz * dt; y = Math.max(-1, Math.min(1, L.cx / 10)); } break; }
      default: { if (L.cp) { y = Serp.seg(L.cp, p); break; } const a = L.pts, q = p * a.length, i = Math.floor(q), f = q - i, s2 = 0.5 - 0.5 * Math.cos(f * Math.PI); y = a[i % a.length] + (a[(i + 1) % a.length] - a[i % a.length]) * s2; } }
    return L.fade > 0 ? y * Math.min(1, age / L.fade) : y;
  }
  ladder(x, s, g, k) {
    const G = g / (1 + g), res = (2 - k) / 1.96 * 4.4; let u = Math.tanh((x - res * s[4]) * 1.3);
    for (let i = 0; i < 4; i++) { const v = (u - s[i]) * G, y = v + s[i]; s[i] = y + v; u = i === 3 ? y : Math.tanh(y); }
    s[4] = u; return u * (1 + res * 0.25);
  }
  ms20(x, s, g, k, hp) {
    const G = g / (1 + g), K = 0.02 + (2 - k) / 1.96 * 1.96, a0 = 1 / (1 - K * G + K * G * G);
    if (!hp) {
      let v = (x - s[0]) * G; const y1 = v + s[0]; s[0] = y1 + v;
      const S = s[1] * (K - K * G) / (1 + g) - s[2] / (1 + g), u = Math.tanh(a0 * (y1 + S) * 1.4) / 1.4;
      v = (u - s[1]) * G; const lp = v + s[1]; s[1] = lp + v; const y = K * lp;
      v = (y - s[2]) * G; const l3 = v + s[2]; s[2] = l3 + v;
      return y / K;
    }
    let v = (x - s[0]) * G; const l1 = v + s[0]; s[0] = l1 + v; const y1 = x - l1;
    const S = -s[1] * G / (1 + g) + s[2] / (1 + g), u = Math.tanh(a0 * (y1 + S) * 1.4) / 1.4, y = K * u;
    v = (y - s[1]) * G; const l2 = v + s[1]; s[1] = l2 + v; const h2 = y - l2;
    v = (h2 - s[2]) * G; const l3 = v + s[2]; s[2] = l3 + v;
    return y / K;
  }
  diode(x, s, g0, k) {
    const g = Math.tan(Math.min(1.5, Math.atan(g0) * 1.42)), G4 = 0.5 * g / (1 + g), G3 = 0.5 * g / (1 + g - 0.5 * g * G4), G2 = 0.5 * g / (1 + g - 0.5 * g * G3), G1 = g / (1 + g - g * G2), GM = G4 * G3 * G2 * G1, A = g / (1 + g);
    const b1 = 1 / (1 + g - g * G2), b2 = 1 / (1 + g - 0.5 * g * G3), b3 = 1 / (1 + g - 0.5 * g * G4), b4 = 1 / (1 + g);
    const K = Math.pow((2 - k) / 1.96, 1.3) * 19;
    const fb4 = 0, fo4 = b4 * s[3], fb3 = fo4, fo3 = b3 * (s[2] + fb3 * 0.5 * g), fb2 = fo3, fo2 = b2 * (s[1] + fb2 * 0.5 * g), fb1 = fo2, fo1 = b1 * (s[0] + fb1 * g);
    const sig = G4 * G3 * G2 * fo1 + G4 * G3 * fo2 + G4 * fo3 + fo4;
    let u = ((1 + K * 0.3) * x - K * sig) / (1 + K * GM); u = Math.tanh(u);
    let xn = u * (1 + G1 * G2) + fb1 + G2 * fo1, vn = (xn - s[0]) * A, o = vn + s[0]; s[0] = vn + o;
    xn = o * (1 + G2 * G3) + fb2 + G3 * fo2; vn = (0.5 * xn - s[1]) * A; o = vn + s[1]; s[1] = vn + o;
    xn = o * (1 + G3 * G4) + fb3 + G4 * fo3; vn = (0.5 * xn - s[2]) * A; o = vn + s[2]; s[2] = vn + o;
    xn = o + fb4; vn = (0.5 * xn - s[3]) * A; o = vn + s[3]; s[3] = vn + o;
    return o * 2;
  }
  bp(x, z, j, g, k) { const a1 = 1 / (1 + g * (g + k)), a2 = g * a1, a3 = g * a2, v3 = x - z[j + 1], v1 = a1 * z[j] + a2 * v3, v2 = z[j + 1] + a2 * z[j] + a3 * v3; z[j] = 2 * v1 - z[j]; z[j + 1] = 2 * v2 - z[j + 1]; return v1; }
  svf(x, z, j, g, k, t, ch) {
    const sl = j >= 4 ? 1 : 0, w = ch * 2 + sl;
    if (t === 8) return this.ladder(x, this.lad[w], g, k);
    if (t === 10 || t === 11) return this.ms20(x, this.k35[w], g, k, t === 11);
    if (t === 12) return this.diode(x, this.dio[w], g, k);
    if (t === 9) { const y = this.svf(Math.tanh(x * 1.8), z, j, g, k, 0, ch); z[j] = Math.tanh(z[j]); return Math.tanh(y * 1.3); }
    if (t === 5 || t === 15 || t === 16) { const cb = this.cb[w], N = 4096, dly = Math.max(2, Math.min(N - 2, this.sr / Math.max(30, g))), rp = this.cw - dly, i0 = Math.floor(rp), f = rp - i0, a = ((i0 % N) + N) % N, b = (a + 1) % N, y = cb[a] + (cb[b] - cb[a]) * f, R = (2 - k) / 1.96;
      if (t === 5) { cb[this.cw] = x * 0.6 + y * (0.25 + R * 0.7); return (x + y) * 0.5; }
      if (t === 15) { cb[this.cw] = x + y * R * 0.7; return (x + y) * 0.6; }
      cb[this.cw] = x * 0.6 - y * (0.25 + R * 0.7); return (x - y) * 0.5; }
    if (t === 13) { const F = this.fs[sl], st = this.fmz[w]; return (this.bp(x, st, 0, F.fg[0], F.fk[0]) * F.fa[0] + this.bp(x, st, 2, F.fg[1], F.fk[1]) * F.fa[1] + this.bp(x, st, 4, F.fg[2], F.fk[2]) * F.fa[2]) * 1.6; }
    if (t === 14) { const F = this.fs[sl], st = this.phz[w]; let u = x + st[6] * F.pf; for (let i = 0; i < 6; i++) { const G = F.pg[i], v = (u - st[i]) * G, lp = v + st[i]; st[i] = lp + v; u = 2 * lp - u; } st[6] = Math.tanh(u); return (x + u) * 0.5; }
    const a1 = 1 / (1 + g * (g + k)), a2 = g * a1, a3 = g * a2, v3 = x - z[j + 1], v1 = a1 * z[j] + a2 * v3, v2 = z[j + 1] + a2 * z[j] + a3 * v3; z[j] = 2 * v1 - z[j]; z[j + 1] = 2 * v2 - z[j + 1];
    return t === 2 ? x - k * v1 - v2 : t === 3 ? v1 : t === 4 ? x - k * v1 : t === 6 ? v1 * 3.2 + v2 * 0.25 : t === 7 ? x + v1 * k * 2 : v2;
  }
  slot(sl, F, c, res) {
    const S = this.fs[sl], sr = this.sr;
    if (F.t === 13) { const u = Math.max(0, Math.min(1, Math.log(c / 30) / Math.log(600))) * 4, i = Math.min(3, Math.floor(u)), f = u - i;
      for (let j = 0; j < 3; j++) { const hz = Math.min(sr * 0.45, FMT[i][j] + (FMT[i + 1][j] - FMT[i][j]) * f); S.fg[j] = Math.tan(Math.PI * hz / sr); S.fk[j] = Math.max(0.03, 0.32 - 0.29 * res); } }
    else if (F.t === 14) { const sp = [0.5, 0.75, 1, 1.4, 2, 2.8]; for (let j = 0; j < 6; j++) { const g = Math.tan(Math.PI * Math.min(sr * 0.45, c * sp[j]) / sr); S.pg[j] = g / (1 + g); } S.pf = res * 0.85; }
  }
  throatK(fbase, m) {
    const T = this.th, sr = this.sr, g = Math.max(0, Math.min(1, T.g + m[38]));
    if ((T.n++ & 15) === 0) { const VW = Serp.VWL, u = Math.max(0, Math.min(1, T.v + m[36])) * 4, i = Math.min(3, Math.floor(u)), fr = u - i, sc = Math.pow(2, (Math.max(0, Math.min(1, T.z + m[37])) - 0.5) * 2.8);
      for (let j = 0; j < 4; j++) { const F = Math.max(40, Math.min(sr * 0.45, (VW[i][j] + (VW[i + 1][j] - VW[i][j]) * fr) * sc)), bw = [70, 95, 130, 170][j] * Math.sqrt(sc) + F * 0.06, gg = Math.tan(Math.PI * F / sr), k = bw / F;
        const a1 = 1 / (1 + gg * (gg + k)); T.a1[j] = a1; T.a2[j] = gg * a1; T.a3[j] = gg * gg * a1; T.k[j] = k; } }
    T.jt += (this.rnd() - 0.5 - T.jt * 0.02) * 0.02; T.gp += fbase * 0.5 * (1 + T.jt * 0.06 * g) / sr; T.gp -= Math.floor(T.gp);
    T.rf += (this.rnd() * 2 - 1 - T.rf) * Math.min(1, 420 / sr); T.rf2 += (T.rf - T.rf2) * Math.min(1, 420 / sr);
    T.gm = g; T.am = g > 0.001 ? (1 - g * 0.75 * (0.5 - 0.5 * Math.sin(6.2832 * T.gp))) * (1 + g * 1.8 * T.rf2) : 1;
  }
  throat(x, o) {
    const T = this.th, zs = T.zs, g = T.gm; let y = x * T.am; if (g > 0.001) y = Math.tanh(y * (1 + g * 2.6)) / (1 + g * 0.8);
    T.ev += (Math.abs(x) - T.ev) * 0.003; T.bn += (this.rnd() * 2 - 1 - T.bn) * 0.35; const inp = y + T.b * T.bn * 1.6 * (T.ev * 1.6 + 0.02);
    let w = 0; for (let j = 0; j < 4; j++) { const q = o + j * 2, v3 = inp - zs[q + 1], v1 = T.a1[j] * zs[q] + T.a2[j] * v3, v2 = zs[q + 1] + T.a2[j] * zs[q] + T.a3[j] * v3; zs[q] = 2 * v1 - zs[q]; zs[q + 1] = 2 * v2 - zs[q + 1]; w += v1 * T.k[j] * Serp.VWG[j]; }
    const lp = T.lp[o >> 3] += (w - T.lp[o >> 3]) * T.lk; return y * (1 - T.mx) + lp * T.mx * 4.6;
  }
  nz(fbase) {
    const w = this.rnd() * 2 - 1, k = this.nty, R = sampleRate / this.sr;
    if (k === 1) { const p = this.pk; p[0] = 0.99765 * p[0] + w * 0.099046; p[1] = 0.963 * p[1] + w * 0.2965164; p[2] = 0.57 * p[2] + w * 1.0526913; return (p[0] + p[1] + p[2] + w * 0.1848) * 0.25; }
    if (k === 2) { if (this.rnd() < (0.0006 + this.ntone * 0.002) * R) this.crk = (this.rnd() < 0.5 ? -1 : 1) * (0.5 + this.rnd() * 0.5); this.crk *= Math.pow(0.82, R); return this.crk * 1.6 + w * 0.04; }
    if (k === 3) { const y = (w - this.nprev) * 0.6; this.nprev = w; return y; }
    if (k === 4) { let y = 0; const Rr = [1, 1.483, 1.932, 2.546, 2.63, 3.897], f = Math.max(110, fbase); for (let i = 0; i < 6; i++) { this.mph[i] += f * Rr[i] * 2.3 / this.sr; this.mph[i] -= Math.floor(this.mph[i]); y += this.mph[i] < 0.5 ? 1 : -1; } return y * 0.13 + w * 0.05; }
    if (k === 5) { const D = this.drop; if (D.a < 0.02 && this.rnd() < (0.0012 + this.ntone * 0.002) * R) { D.a = 0.3 + this.rnd() * 0.7; D.hz = 1200 + this.rnd() * 4200; D.k = Math.exp(-1 / (this.sr * (0.01 + this.rnd() * 0.03))); D.ph = 0; } D.ph += D.hz / this.sr; const y = Math.sin(D.ph * 6.2832) * D.a; D.a *= D.k; D.hz *= Math.pow(1.00003, R); return y * 0.8 + w * 0.08; }
    if (k === 6) { const W = this.wng; W.ph += W.hz * (1 + W.j) / this.sr; if (W.ph >= 1) { W.ph -= 1; W.j = (this.rnd() - 0.5) * 0.5; if (this.rnd() < 0.005) W.rest = Math.floor(this.sr * (0.03 + this.rnd() * 0.07)); }
      if (W.rest > 0) { W.rest--; W.a *= 1 - 0.006 * R; } else W.a += (1 - W.a) * 0.01 * R; const sn = Math.sin(Math.PI * W.ph), y = (w - this.nprev) * 0.7; this.nprev = w; return y * sn * sn * sn * sn * W.a * 2.6; }
    if (k === 7) { const C = this.chn, sr = this.sr; if (C.left <= 0 && this.rnd() < (0.0004 + this.ntone * 0.0016) * R) { C.left = 6 + Math.floor(this.rnd() * 14); C.amp = 0.6 + this.rnd() * 0.4; C.wait = 1; }
      if (C.left > 0 && --C.wait <= 0) { C.left--; C.wait = Math.floor(sr * (0.003 + this.rnd() * 0.018)); C.amp *= 0.82 + this.rnd() * 0.2; const j0 = (C.n = (C.n + 1) % 4) * 3, base = 2400 + this.rnd() * 4200, RT = [1, 1.47 + this.rnd() * 0.2, 2.09 + this.rnd() * 0.35];
        for (let q = 0; q < 3; q++) { const hz = Math.min(sr * 0.45, base * RT[q]), rr = Math.exp(-1 / (sr * (0.0012 + this.rnd() * 0.005) / (1 + q * 0.6))), om = 2 * Math.PI * hz / sr; C.c[j0 + q] = 2 * rr * Math.cos(om); C.rq[j0 + q] = rr * rr; C.g[j0 + q] = (0.3 + this.rnd() * 0.7) * (1 - rr); }
        C.ex = Math.max(1, Math.floor(sr * (0.0004 + this.rnd() * 0.0008))); C.exa = C.amp * (0.5 + this.rnd() * 0.5); }
      let e = 0; if (C.ex > 0) { C.ex--; e = (w - this.nprev) * C.exa; this.nprev = w; }
      let y = 0; for (let j = 0; j < 12; j++) { const y0 = C.c[j] * C.y1[j] - C.rq[j] * C.y2[j] + e * C.g[j] * 40; C.y2[j] = C.y1[j]; C.y1[j] = y0; y += y0; } return y * 0.5 + e * 0.9; }
    if (k === 8) { const U = this.fur; U.b = (U.b + w * 0.025 * Math.sqrt(R)) * Math.pow(0.9985, R); U.l += (this.rnd() - U.l) * 0.0006 * R;
      if (this.rnd() < (0.00008 + this.ntone * 0.0006) * R) this.crk = (this.rnd() < 0.5 ? -1 : 1) * (0.4 + this.rnd() * 0.6); this.crk *= Math.pow(0.78, R); return U.b * (0.3 + U.l * 1.4) * 1.3 + this.crk; }
    return w;
  }
  static AD(z, k, a, g) {
    if (k === 1) return Serp.lc(g * z) / (g * (1 + a * 0.6));
    if (k === 2) { const u = Math.abs(z * g); return (u <= 1 ? z * z * g * 0.5 : (u - 0.5) / g) * 0.75; }
    if (k === 3) { const h = g * 1.4; return -Math.cos(h * z) / h * 0.8; }
    if (k === 6) return (1 + a * 3) * z * Math.abs(z) * 0.5;
    if (k === 8) { const h = g * 0.6, u = h * z; return (u > 0 ? u + Math.exp(-u) - 1 : -0.7 * (u - 0.7 * (Math.exp(u / 0.7) - 1))) / h; }
    if (k === 9) { const h = 1 + a * 6, u = (((h * z + 1) % 4) + 4) % 4; return ((u <= 2 ? u * u / 2 - u : 3 * u - u * u / 2 - 4) + 0.5) / h * 0.9; }
    const h = g * 0.5; return z > 0 ? Serp.lc(h * z) / h : 0.9 * Serp.lc(0.55 * h * z) / (0.55 * h);
  }
  static CV(m, k, a, g) {
    if (k === 1) return Math.tanh(g * m) / (1 + a * 0.6);
    if (k === 2) return Math.max(-1, Math.min(1, m * g)) * 0.75;
    if (k === 3) return Math.sin(g * 1.4 * m) * 0.8;
    if (k === 6) return Math.abs(m * (1 + a * 3));
    if (k === 8) { const u = g * 0.6 * m; return u > 0 ? 1 - Math.exp(-u) : -0.7 * (1 - Math.exp(u / 0.7)); }
    if (k === 9) { const u = ((((1 + a * 6) * m + 1) % 4) + 4) % 4; return (1 - Math.abs(u - 2)) * 0.9; }
    const m2 = m * g * 0.5; return m2 > 0 ? Math.tanh(m2) : Math.tanh(m2 * 0.55) * 0.9;
  }
  shape(x, c, k, a, g) {
    const x1 = this.dx1[c], dx = x - x1, Fx = Serp.AD(x, k, a, g), F1 = this.dg[c] === g && this.dk[c] === k ? this.dF[c] : Serp.AD(x1, k, a, g);
    this.dx1[c] = x; this.dF[c] = Fx; this.dg[c] = g; this.dk[c] = k;
    return Math.abs(dx) > 1e-7 ? (Fx - F1) / dx : Serp.CV((x + x1) * 0.5, k, a, g);
  }
  dist(x, c, amt) {
    const k = this.dty; if (!k) return x;
    const a = Math.max(0, Math.min(1, this.dam + amt)), g = 1 + a * 20; let y, dry = x;
    if (k === 4) { const q = Math.pow(2, 16 - a * 14); y = Math.round(x * q) / q; }
    else if (k === 5) { if (c === 0) this.dn++; const hold = 1 + Math.floor(a * 40 * this.os); if (this.dn % hold === 0) this.dh[c] = x; y = this.dh[c]; }
    else {
      const H = Serp.HB, R = this.osr[c]; let i = R.i = (R.i + 1) & 15; R.x[i] = x;
      let xo = 0; for (let j = 0; j < 12; j++) xo += H[j] * R.x[(i - j) & 15];
      const de = this.shape(R.x[(i - 6) & 15], c, k, a, g), dO = this.shape(xo, c, k, a, g); R.e[i] = de; R.o[i] = dO;
      y = 0.5 * R.e[(i - 6) & 15]; for (let j = 0; j < 12; j++) y += H[j] * 0.5 * R.o[(i - 1 - j) & 15];
      dry = R.x[(i - 12) & 15];
      if (k === 6) { this.dc[c] += (y - this.dc[c]) * 0.0015 / this.os; y = (y - this.dc[c]) * 1.4; }
      else if (k === 7 || k === 8) { this.dc[c] += (y - this.dc[c]) * 0.001 / this.os; y = (y - this.dc[c]) / (1 + a * 0.4); }
    }
    this.dz[c] += (y - this.dz[c]) * this.dlp; y = this.dz[c];
    return dry + (y - dry) * this.dmx;
  }
  chan(x, z, c, m22) {
    if (this.dpre) x = this.dist(x, c, m22);
    let y = x;
    if (this.F1on) { x = Math.tanh(x * this.drive) / this.tdrive; const F1 = this.F1; y = this.svf(x, z, 0, this.g1, this.k1, F1.t === 1 ? 0 : F1.t, c); if (F1.t === 1) y = this.svf(y, z, 2, this.g1, this.k1, 0, c); }
    if (this.f2 === 1) y = this.svf(y, z, 4, this.g2, this.k2, this.F2.t === 1 ? 0 : this.F2.t, c); else if (this.f2 === 2) y = (y + this.svf(x, z, 4, this.g2, this.k2, this.F2.t === 1 ? 0 : this.F2.t, c)) * 0.6;
    if (!this.dpre) y = this.dist(y, c, m22);
    return y;
  }
  env(e) {
    if (e.st === 0) { e.v += (1.3 - e.v) * e.ka; if (e.v >= 1) { e.v = 1; e.st = 1; } e.o = e.p === 1 ? e.v : Math.pow(e.v, 1 / e.p); }
    else if (e.st === 1) { const S = e.E[2]; e.v = S + (e.v - S) * e.kd; e.o = e.p === 1 || S >= 0.999 ? e.v : S + (1 - S) * Math.pow(Math.max(0, (e.v - S) / (1 - S)), e.p); }
    else { e.v *= e.kr; e.o = e.p === 1 ? e.v : e.or * Math.pow(e.v / e.lr, e.p); }
    return e.o;
  }
  xat(a, u) { if (!a) return 0; const q = Math.max(0, Math.min(1, u)) * (a.length - 1), i = Math.floor(q), f = q - i; return a[i] + ((a[Math.min(a.length - 1, i + 1)] || 0) - a[i]) * f; }
  tick(tt) {
    this.tnow = tt;
    const sr = this.sr, O = this.O, m = this.m, src = this.src, pos = this.pos, raw = this.raw, EN = this.E;
    const age = tt - this.start;
    if (this.rel < 0 && tt >= this.relAt) { this.rel = tt; for (const e of EN) { e.st = 2; e.lr = Math.max(1e-6, e.v); e.or = e.o; if (!e.cut) e.kr = Math.exp(-4.6 / (e.E[3] * sr)); } }
    this.env1 = this.env(EN[0]); this.env2 = this.env(EN[1]); this.env3 = this.env(EN[2]); this.env4 = this.env(EN[3]);
    const l1 = this.lfo(this.l1, sr, m[23] ? Math.pow(4, m[23]) : 1, age), l2 = this.lfo(this.l2, sr, m[24] ? Math.pow(4, m[24]) : 1, age);
    const l3 = this.u3 ? this.lfo(this.l3, sr, m[26] ? Math.pow(4, m[26]) : 1, age) : 0, l4 = this.u4 ? this.lfo(this.l4, sr, m[27] ? Math.pow(4, m[27]) : 1, age) : 0;
    const u = this.dur > 0 ? age / this.dur : 0, LX = this.lx, ks = 1 - Math.exp(-1 / (0.005 * sr));
    const xb = LX ? (this.lxs[0] += (LX[0] - this.lxs[0]) * ks) : this.xat(this.xb, u), xp = LX ? (this.lxs[1] += (LX[1] - this.lxs[1]) * ks) : this.xat(this.xp, u), xs = LX ? (this.lxs[2] += (LX[2] - this.lxs[2]) * ks) : this.xat(this.xs, u);
    if (this.mx.length) { m.fill(0); src[1] = this.env2; src[2] = this.env3; src[3] = l1; src[4] = l2; src[5] = this.vel; src[6] = this.note; src[7] = this.rand; src[8] = this.env1; src[9] = this.mc[0]; src[10] = this.mc[1]; src[11] = this.mc[2]; src[12] = this.mc[3];
      src[13] = this.env4; src[14] = l3; src[15] = l4; src[16] = xp; src[17] = xs; src[18] = this.wh;
      if (this.mxPlain) { for (const [sI, dI, a] of this.mx) m[dI] += src[sI] * a; } else for (const [sI, dI, a, cv, ax] of this.mx) { let x = src[sI]; if (cv !== 1) x = x < 0 ? -Math.pow(-x, cv) : Math.pow(x, cv); if (ax) x *= src[ax]; m[dI] += x * a; } }
    const gl = this.glide > 0 ? Math.exp(-age / (this.glide / 3)) : 0, fbase = gl ? this.f * Math.pow(this.f0 / this.f, gl) : this.f;
    const vib = (l1 && this.lv) || (l2 && this.l2v) || m[9] || m[10] || this.npi || xb || this.bc ? Math.pow(2, l1 * this.lv + l2 * this.l2v + m[9] + m[10] / 12 + this.env3 * this.npi + xb * this.pbr / 12 + (this.bc || 0) / 1200) : 1;
    const lsh = l1 * this.lp * 0.5 + l2 * this.l2p * 0.5;
    pos[0] = O[0].pos + this.env2 * this.e2a + lsh + m[0]; pos[1] = O[1].pos + this.env2 * this.e2b + lsh + m[1]; pos[2] = O[2].pos + m[2];
    if ((this.gk & 15) === 0) {
      const width = Math.max(0, Math.min(1, this.width + m[25])), dmul = 1 + m[17] * 0.5, dk = this.drf ? 1 - Math.exp(-16 * 1.2 / sr) : 0, dn = Math.sqrt(dk) * 2.4;
      for (let q = 0; q < 3; q++) { if (!O[q].on) continue; for (const v of this.V[q]) { const pn = Math.max(-1, Math.min(1, v.sp * width + O[q].pan)); v.gl = (1 - pn) * 0.5; v.gr = (1 + pn) * 0.5;
        let mu = dmul === 1 ? v.mul : Math.pow(v.mul, dmul); if (dk) { v.drv += (this.rnd() * 2 - 1) * dn - v.drv * dk; mu *= Math.pow(2, v.drv * this.drf / 1200); } v.mulD = mu; } }
      this.pickLev(fbase, vib);
    }
    let l = 0, r = 0, dl = 0, dr = 0;
    const sub = this.sub + m[19], subOn = sub > 0.001 || this.fmm === 6;
    let sw = 0; if (subOn) { this.subph += fbase * (this.subo ? 0.25 : 0.5) * vib / sr; this.subph -= Math.floor(this.subph); const p = this.subph; sw = this.subw === 0 ? Math.sin(p * 6.2832) : this.subw === 1 ? (p < 0.5 ? 0.7 : -0.7) : 1 - 4 * Math.abs(p - 0.5); }
    for (let q = 2; q >= 0; q--) {
      const Oq = O[q]; raw[q] = 0; if (!Oq.on) continue;
      const lv = Oq.lvl + m[12 + q], modOnly = this.fmm && ((q === 1 && (this.fmm === 1 || this.fmm === 2 || this.fmm === 5)) || (q === 2 && (this.fmm === 3 || this.fmm === 4)));
      if (lv < 0.001 && !modOnly) continue;
      const V = this.V[q], inc = fbase * Oq.ratio * vib / sr; Oq.fnow = fbase * Oq.ratio * vib * this.wide[q]; const g = Math.max(0, lv) / Math.sqrt(V.length), wamt = Math.max(0, Math.min(1, Oq.wamt + m[3 + q]));
      let mono = 0; const audible = lv >= 0.001;
      if (Oq.kind === 6) {
        const T = Oq.tab, fp = Math.max(0, Math.min(1, pos[q] || 0)) * (WT.F - 1), FA = T.fr[Math.round(fp)], ten = Math.max(0, Math.min(1, Oq.ht + m[35]));
        for (const v of V) { const y = this.heart(Oq, v, fbase * Oq.ratio * vib * v.mulD, ten, FA[Math.min(WT.HL.length - 1, 6)]); mono += y * v.g; if (audible) { const yg = y * g * v.g; l += yg * v.gl; r += yg * v.gr; } }
        raw[q] = mono / V.length; continue;
      }
      if (Oq.kind === 5) {
        const cu = 1 / Math.sqrt(V.length);
        for (const v of V) { const y = this.modal(Oq, v, fbase * Oq.ratio * vib * v.mulD, Math.max(0, Math.min(1, pos[q] || 0))) * cu; mono += y * v.g; if (audible) { const yg = y * g * v.g; l += yg * v.gl; r += yg * v.gr; } }
        raw[q] = mono / V.length; continue;
      }
      if (Oq.kind === 4) {
        const T = Oq.tab, fp = Math.max(0, Math.min(1, pos[q] || 0)) * (WT.F - 1), FA = T.fr[Math.round(fp)];
        const cu = 1 / Math.sqrt(V.length);
        for (const v of V) { const y = this.str(Oq, v, fbase * Oq.ratio * vib * v.mulD, FA[Math.min(WT.HL.length - 1, v.lev + 2)]) * cu; mono += y * v.g; if (audible) { const yg = y * g * v.g; l += yg * v.gl; r += yg * v.gr; } }
        raw[q] = mono / V.length; continue;
      }
      if (Oq.kind >= 2) {
        const S = Oq.G.S, ip = fbase * Oq.ratio * vib / Oq.G.root * S.sr / sr, ps = Math.max(0, Math.min(1, pos[q] || 0));
        const sz = Math.max(0, Math.min(1, Oq.gz + m[31])), dn = Math.max(0, Math.min(1, Oq.gd + m[32])), spr = Math.max(0, Math.min(1, Oq.gs + m[33]));
        for (const v of V) { const y = (Oq.kind === 2 ? this.grain(Oq, v, ip * v.mulD, ps, sz, dn, spr) : this.smp(Oq, v, ip * v.mulD, ps)) * S.g; mono += y * v.g; if (audible) { const yg = y * g * v.g; l += yg * v.gl; r += yg * v.gr; } }
        raw[q] = mono / V.length; continue;
      }
      const fmL = Math.max(0, Math.min(1, this.fma + m[11])), fmA = fmL * fmL;
      let pmod = 0;
      if (q === 0) { const F = this.fmm;
        if (F === 1 || F === 5) pmod = raw[1] * fmA * (F === 5 ? 0.15 : 2.5); else if (F === 3) pmod = raw[2] * fmA * 2.5;
        else if (F === 6) pmod = sw * fmA * 2.5; else if (F === 7) pmod = this.nz(fbase) * fmA * 0.6; else if (F === 8) pmod = this.fbk * fmA * 1.5; else if (F === 9) pmod = (this.fbA + this.fbA1) * 0.5 * fmA * 1.2; }
      if (q === 1 && this.fmm === 4) pmod = raw[2] * fmA * 2.5;
      const ring = q === 0 && this.fmm === 2;
      if (Oq.kind === 1) { const D = Oq.dyn; let lv2 = 0; for (const v of V) lv2 = Math.max(lv2, v.lev); this.spectral(q, pos[q] || 0, Oq.sx + m[28 + q], WT.HL[lv2]); if (D.n > 0) D.n--;
        const A = D.a, B = D.b || D.a, xf = D.x; if (D.x < 1) D.x = Math.min(1, D.x + 1 / 256);
        const hv = this.hiveK(q, V, inc), hg = hv ? 1 / (1 + Oq.hR * Oq.hR * (Math.sqrt(V.length) - 1)) : 1;
        for (const v of V) { const dI = inc * v.mulD + (hv ? hv * Math.sin(6.2832 * (Oq.hpsi - v.ph)) : 0); let ph = v.ph + dI; if (ph >= 1) ph -= Math.floor(ph); else if (hv && ph < 0) ph += 1; v.ph = ph; v.nofade = false;
          let y = this.read(Oq, A, A, 0, ph + pmod, wamt, v); if (xf < 1) y = y * xf + this.read(Oq, B, B, 0, ph + pmod, wamt, v) * (1 - xf);
          if (ring) y *= raw[1] * fmL * 2 + (1 - fmL); mono += y * v.g; if (audible) { const yg = y * g * v.g * hg; l += yg * v.gl; r += yg * v.gr; } }
        raw[q] = mono / V.length; if (q === 0) { this.fbA1 = this.fbA; this.fbA = raw[0]; } continue; }
      const T = Oq.tab, fp = Math.max(0, Math.min(1, pos[q] || 0)) * (WT.F - 1), fi = Math.floor(fp), FA = T.fr[fi], FB = T.fr[Math.min(WT.F - 1, fi + 1)], tf = fp - fi, TN = T.N, plain = Oq.warp === 0 && !Oq.w2 && !pmod;
      const blep = Oq.warp === 2 && !pmod;
      const hv = this.hiveK(q, V, inc), hg = hv ? 1 / (1 + Oq.hR * Oq.hR * (Math.sqrt(V.length) - 1)) : 1;
      for (const v of V) { const dI = inc * v.mulD + (hv ? hv * Math.sin(6.2832 * (Oq.hpsi - v.ph)) : 0); let ph = v.ph + dI, wr = false; if (ph >= 1) { ph -= Math.floor(ph); wr = true; } else if (hv && ph < 0) ph += 1; v.ph = ph; let y; const ta = FA[v.lev], tb = FB[v.lev]; v.nofade = blep;
        if (plain) { const xx = ph * TN, ii = xx | 0, t2 = xx - ii, va = ta[ii] + (ta[ii + 1] - ta[ii]) * t2; y = va + (tb[ii] + (tb[ii + 1] - tb[ii]) * t2 - va) * tf; }
        else y = this.read(Oq, ta, tb, tf, ph + pmod, wamt, v);
        if (blep) { const out = v.hold || 0;
          if (wr) { const rdS = q2 => { const xx = q2 * TN, ii = xx | 0, t2 = xx - ii, va = ta[ii] + (ta[ii + 1] - ta[ii]) * t2; return va + (tb[ii] + (tb[ii + 1] - tb[ii]) * t2 - va) * tf; }, sk = 1 + wamt * 7, e = sk - Math.floor(sk), d = Math.min(1, ph / dI), h = (rdS(0) - rdS(e < 1 ? e : 0)) * 0.5;
            v.hold = y - h * (1 - d) * (1 - d); y = out + h * d * d; }
          else { v.hold = y; y = out; } }
        if (ring) y *= raw[1] * fmL * 2 + (1 - fmL); mono += y * v.g; if (audible) { const yg = y * g * v.g * hg; l += yg * v.gl; r += yg * v.gr; } }
      raw[q] = mono / V.length; if (q === 0) { this.fbA1 = this.fbA; this.fbA = raw[0]; }
    }
    if (sub > 0.001) { const y = sw * sub * 0.6; if (this.subDry) { dl += y * 0.5; dr += y * 0.5; } else { l += y * 0.5; r += y * 0.5; } }
    const nzl = this.noise + m[18];
    if (nzl > 0.001) {
      const w = this.nz(fbase); this.ncol += (w - this.ncol) * (0.05 + this.ntone * 0.95); let y = this.ncol;
      if (this.nft) { if ((this.gk & 15) === 0) { const c = Math.max(20, Math.min(sr * 0.45, this.nfc * Math.pow(2, m[21] * 4) * Math.pow(fbase / 261.6, this.nkt))); this.gn = Math.tan(Math.PI * c / sr); this.kn = 2 - 1.96 * this.nfr; } y = this.svf(y, this.zn, 0, this.gn, this.kn, this.nft === 1 ? 0 : this.nft === 2 ? 2 : this.nft === 3 ? 3 : 7, 0); }
      y *= nzl * 0.55 * this.nmk * [1, 1, 1.6, 1.5, 0.8, 1.3, 2.4, 1.6, 1][this.nty] * (this.nenv3 ? Math.min(8, this.env3 / Math.max(0.0001, this.env1)) : 1);
      if (this.nDry) { dl += y * 0.5; dr += y * 0.5; } else { l += y * 0.5; r += y * 0.5; }
    }
    if ((this.gk++ & 15) === 0) {
      const kt = Math.pow(fbase / 261.6, this.key), F1 = this.F1, F2 = this.F2, mv = (this.env2 * this.fenv + l1 * this.lc * 2 + l2 * this.l2c * 2 + m[6] * 4) + this.vcut;
      const c1 = Math.max(20, Math.min(sr * 0.45, F1.cut * Math.pow(2, mv) * kt * this.fvar)), c2 = Math.max(20, Math.min(sr * 0.45, F2.cut * Math.pow(2, m[8] * 4 + this.env2 * this.fenv * 0.5) * kt * this.fvar));
      const hz = t => t === 5 || t === 15 || t === 16;
      this.g1 = hz(F1.t) ? c1 : Math.tan(Math.PI * c1 / sr); this.g2 = hz(F2.t) ? c2 : Math.tan(Math.PI * c2 / sr);
      const q1 = Math.max(0, Math.min(1, F1.res + m[7])), q2 = Math.max(0, Math.min(1, F2.res + m[20]));
      this.k1 = 2 - 1.96 * q1; this.k2 = 2 - 1.96 * q2;
      if (F1.t === 13 || F1.t === 14) this.slot(0, F1, c1, q1); if (this.f2 && (F2.t === 13 || F2.t === 14)) this.slot(1, F2, c2, q2);
    }
    const amp = this.env1 * (1 - this.vs + this.vs * this.vel) * this.gain * Math.max(0, 1 - this.la * (0.5 + 0.5 * l1) - this.l2a * (0.5 + 0.5 * l2) + m[16]), pan = Math.max(-1, Math.min(1, m[15]));
    if (this.thr) { this.throatK(fbase, m); l = this.throat(l, 0); r = this.throat(r, 8); }
    const cl = this.chan(l, this.z[0], 0, m[22]), cr = this.chan(r, this.z[1], 1, m[22]); if (this.fmm === 8) this.fbk = Math.tanh((cl + cr) * 0.5);
    let yl = (cl + dl) * amp, yr = (cr + dr) * amp;
    if (pan) { yl *= 1 - Math.max(0, pan); yr *= 1 + Math.min(0, pan); }
    this.cw = (this.cw + 1) & 4095;
    this.oL = yl; this.oR = yr;
  }
  down(R, e, o) { const H = Serp.HB; let i = R.i = (R.i + 1) & 15; R.e[i] = e; R.o[i] = o; let y = 0.5 * R.e[(i - 6) & 15]; for (let j = 0; j < 12; j++) y += H[j] * 0.5 * R.o[(i - 1 - j) & 15]; return y; }
  static get parameterDescriptors() { return [BEND]; }
  process(ins, outs, P) {
    if (this.dead) return false; this.bc = P && P.bend ? P.bend[0] : 0;
    const o = outs[0], n0 = o[0].length, os = this.os, isr = 1 / this.sr;
    for (let n = 0; n < n0; n++) {
      const tt = currentTime + n / sampleRate;
      if (tt < this.start) { o[0][n] = 0; if (o[1]) o[1][n] = 0; continue; }
      let yl, yr;
      if (os === 1) { this.tick(tt); yl = this.oL; yr = this.oR; }
      else if (os === 2) { this.tick(tt); const a = this.oL, b = this.oR; this.tick(tt + isr); yl = this.down(this.dec[0], a, this.oL); yr = this.down(this.dec[1], b, this.oR); }
      else { const ob = this.ob;
        for (let h = 0; h < 2; h++) { this.tick(tt + 2 * h * isr); const a = this.oL, b = this.oR; this.tick(tt + (2 * h + 1) * isr); ob[h * 2] = this.down(this.dec[2], a, this.oL); ob[h * 2 + 1] = this.down(this.dec[3], b, this.oR); }
        yl = this.down(this.dec[0], ob[0], ob[2]); yr = this.down(this.dec[1], ob[1], ob[3]); }
      const D = this.dcb, kd = this.kdc; D[1] = kd * (D[1] + yl - D[0]); D[0] = yl; D[3] = kd * (D[3] + yr - D[2]); D[2] = yr;
      o[0][n] = D[1]; if (o[1]) o[1][n] = D[3];
    }
    if (this.rel >= 0 && currentTime - this.rel > this.e1[3] + 0.05) return false;
    return true;
  }
}
registerProcessor('nb-wt', Serp);
class Fault extends Tape8 {
  static get parameterDescriptors() { const a = [['rate', 0.25, 0.03, 2], ['chance', 1, 0, 1], ['div', 4, 1, 16], ['wild', 0, 0, 1], ['len', 16, 1, 16]]; for (let k = 0; k < 16; k++) a.push(['s' + k, 0, 0, 11]); return prm(a); }
  constructor() { super(); live(this); this.e = 0; this.rp = 0; this.hold = [0, 0]; this.gs = 1; this.dl = [0, 0]; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], sr = sampleRate, run = P.run[0] > 0.5, rate = P.rate[0], sd = P.seed[0], len = Math.round(P.len[0]);
    for (let n = 0; n < o[0].length; n++) {
      const x0 = i && i.length ? i[0][n] : 0, x1 = i && i.length ? (i[1] || i[0])[n] : 0;
      this.b[0][this.w] = x0; this.b[1][this.w] = x1;
      let y0 = x0, y1 = x1;
      if (run) {
        const k = Math.floor(this.beat(P, n) / rate + 1e-9);
        if (k !== this.k) {
          this.k = k; this.z = 0; this.cap = this.w; this.rp = 0; this.L = Math.max(128, rate * P.spb[0] * sr);
          let e = Math.round(P['s' + (((k % len) + len) % len)][0]);
          if (e && hsh(k * 1.37 + sd) >= P.chance[0]) e = 0;
          if (e && hsh(k * 3.11 + sd + 0.5) < P.wild[0]) e = 1 + Math.floor(hsh(k * 5.71 + sd) * 11);
          this.e = e; this.sh = this.L * (1 + Math.floor(hsh(k * 9.13 + sd) * 7)); this.sh = Math.min(this.sh, this.N - this.L - 256); if (e === 11) { this.dl[0] = x0; this.dl[1] = x1; }
        }
        const e = this.e, z = this.z, L = this.L;
        if (e) {
          const cap = this.cap, sub = Math.max(64, Math.floor(L / Math.max(1, P.div[0]))), m = z % sub;
          let idx = cap + z, g = 1, raw = false;
          if (e === 1) { idx = cap + m; g = Math.min(1, m / 48, (sub - m) / 48); }
          else if (e === 2) idx = cap - 1 - z;
          else if (e === 3) { this.rp += Math.pow(Math.max(0, 1 - z / L), 1.6); idx = cap + this.rp; g = 1 - 0.4 * z / L; }
          else if (e === 4) idx = cap + z * 0.5;
          else if (e === 5) { const q = (z * 2) % L; idx = cap - L + q; g = Math.min(1, q / 48, (L - q) / 48); }
          else if (e === 6) raw = true;
          else if (e === 7) raw = true;
          else if (e === 8) { const Lh = Math.min(L, sr * 0.3), s = 0.5 - 0.5 * Math.cos(6.2831853 * z / L * 2); idx = cap - Lh + Lh * s; }
          else if (e === 9) idx = cap - this.sh + z;
          else if (e === 10) { const q = (z * 2) % L; idx = cap - L + q; g = Math.min(1, q / 48, (L - q) / 48); }
          let f0, f1;
          if (e === 11) { const fc = 150 * Math.pow(120, 1 - z / L), a = 1 - Math.exp(-6.2831853 * fc / sr); this.dl[0] += (x0 - this.dl[0]) * a; this.dl[1] += (x1 - this.dl[1]) * a; f0 = this.dl[0]; f1 = this.dl[1]; }
          else if (e === 6) { const on = Math.floor(z / (L / 8)) % 2 === 0 ? 1 : 0; this.gs += (on - this.gs) * 0.02; f0 = x0 * this.gs; f1 = x1 * this.gs; }
          else if (e === 7) { if (z % 11 === 0) { this.hold[0] = Math.round(x0 * 12) / 12; this.hold[1] = Math.round(x1 * 12) / 12; } f0 = this.hold[0] * 1.1; f1 = this.hold[1] * 1.1; }
          else { f0 = this.rd(0, idx) * g; f1 = this.rd(1, idx) * g; }
          const env = Math.min(1, z / 96, (L - z) / 96);
          y0 = x0 * (1 - env) + f0 * env; y1 = x1 * (1 - env) + f1 * env;
        } else this.gs = 1;
        this.z++;
      } else this.k = NaN;
      o[0][n] = y0; if (o[1]) o[1][n] = y1;
      this.w = (this.w + 1) % this.N;
    }
    return true;
  }
}
registerProcessor('nb-fault', Fault);
class Broke extends Tape8 {
  static get parameterDescriptors() { return prm([['slot', 0.25, 0.03, 1], ['amt', 0.3, 0, 1], ['wd', 1, 0, 1], ['wb', 1, 0, 1], ['ws', 1, 0, 1], ['wc', 1, 0, 1], ['size', 0.5, 0, 1], ['ww', 0, 0, 1]]); }
  constructor() { super(); live(this); this.e = 0; this.hold = [0, 0]; this.gs = 1; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], sr = sampleRate, run = P.run[0] > 0.5, slot = P.slot[0], sd = P.seed[0];
    for (let n = 0; n < o[0].length; n++) {
      const x0 = i && i.length ? i[0][n] : 0, x1 = i && i.length ? (i[1] || i[0])[n] : 0;
      this.b[0][this.w] = x0; this.b[1][this.w] = x1;
      let y0 = x0, y1 = x1;
      if (run) {
        const k = Math.floor(this.beat(P, n) / slot + 1e-9);
        if (k !== this.k) {
          this.k = k; this.z = 0; this.cap = this.w; this.L = Math.max(128, slot * P.spb[0] * sr); this.e = 0;
          if (hsh(k * 2.17 + sd) < P.amt[0]) {
            const W = [P.wd[0], P.wb[0], P.ws[0], P.wc[0], P.ww[0]], tot = W[0] + W[1] + W[2] + W[3] + W[4];
            if (tot > 0) { let r = hsh(k * 4.33 + sd + 0.2) * tot, e = 0; while (e < 4 && r >= W[e]) { r -= W[e]; e++; } this.e = e + 1; }
            this.part = this.L * (0.25 + hsh(k * 6.7 + sd) * 0.75 * (0.3 + P.size[0] * 0.7)); this.g = Math.floor(sr * (0.003 + hsh(k * 8.9 + sd) * 0.028));
          }
        }
        const z = this.z;
        if (this.e && z < this.part) {
          let f0, f1; const cap = this.cap;
          if (this.e === 1) { f0 = f1 = 0; }
          else if (this.e === 2) { const m = z % this.g, gg = Math.min(1, m / 16, (this.g - m) / 16); f0 = this.rd(0, cap + m) * gg; f1 = this.rd(1, cap + m) * gg; }
          else if (this.e === 3) { f0 = this.rd(0, cap - this.L * 2 + z); f1 = this.rd(1, cap - this.L * 2 + z); }
          else if (this.e === 5) { const dly = sampleRate * (0.012 + 0.008 * Math.sin(6.2831853 * z / this.part * 3)); f0 = this.rd(0, cap + z - dly); f1 = this.rd(1, cap + z - dly); }
          else { if (z % 37 === 0) { this.hold[0] = Math.round(x0 * 4) / 4; this.hold[1] = Math.round(x1 * 4) / 4; } f0 = Math.max(-0.9, Math.min(0.9, this.hold[0] * 2)); f1 = Math.max(-0.9, Math.min(0.9, this.hold[1] * 2)); }
          const env = Math.min(1, z / 24, (this.part - z) / 24);
          y0 = x0 * (1 - env) + f0 * env; y1 = x1 * (1 - env) + f1 * env;
        }
        this.z++;
      } else this.k = NaN;
      o[0][n] = y0; if (o[1]) o[1][n] = y1;
      this.w = (this.w + 1) % this.N;
    }
    return true;
  }
}
registerProcessor('nb-broke', Broke);
class Rip extends Tape8 {
  static get parameterDescriptors() { return prm([['every', 16, 1, 64], ['len', 0.25, 0.02, 1], ['from', 0.5, 0.0625, 2], ['to', 0.0625, 0.015, 1], ['rise', 0, 0, 24], ['chance', 1, 0, 1], ['smooth', 0, 0, 1], ['sweep', 0, 0, 1], ['swell', 0, 0, 1]]); }
  constructor() { super(); live(this); this.p = 0; this.first = true; this.lp = [0, 0]; this.on = false; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], sr = sampleRate, run = P.run[0] > 0.5, ev = P.every[0], len = P.len[0], sd = P.seed[0], spb = P.spb[0];
    const fr = P.from[0], to = Math.min(fr, P.to[0]), steps = Math.max(1, Math.round(Math.log2(fr / to)) + 1);
    for (let n = 0; n < o[0].length; n++) {
      const x0 = i && i.length ? i[0][n] : 0, x1 = i && i.length ? (i[1] || i[0])[n] : 0;
      this.b[0][this.w] = x0; this.b[1][this.w] = x1;
      let y0 = x0, y1 = x1;
      if (run) {
        const b = this.beat(P, n), k = Math.floor(b / ev + 1e-9), u = b - k * ev, zs = ev * (1 - len);
        if (u >= zs && hsh(k * 0.77 + sd) < P.chance[0]) {
          if (k !== this.k) { this.k = k; this.cap = this.w; this.p = 0; this.first = true; this.z = 0; }
          const q = Math.min(1, (u - zs) / (ev * len)), sl = P.smooth[0] > 0.5 ? fr * Math.pow(to / fr, q) : fr / Math.pow(2, Math.min(steps - 1, Math.floor(q * steps))), S = Math.max(64, sl * spb * sr);
          const r = this.first ? 1 : Math.pow(2, P.rise[0] * q / 12);
          if (this.p >= S) { this.p = 0; this.first = false; }
          const m = this.p, g = Math.min(1, m / 40, (S - m) / 40);
          let f0 = this.rd(0, this.cap + m) * g, f1 = this.rd(1, this.cap + m) * g;
          const sw = P.sweep[0] * q; if (sw > 0) { const a = 0.01 + sw * 0.5; this.lp[0] += (f0 - this.lp[0]) * a; this.lp[1] += (f1 - this.lp[1]) * a; f0 -= this.lp[0] * sw * 0.95; f1 -= this.lp[1] * sw * 0.95; }
          const sv = P.swell[0] > 0 ? Math.pow(10, -P.swell[0] * 24 * (1 - q) / 20) : 1; f0 *= sv; f1 *= sv;
          const env = Math.min(1, this.z / 64, (ev - u) * spb * sr / 64); y0 = x0 * (1 - env) + f0 * env; y1 = x1 * (1 - env) + f1 * env;
          this.p += r; this.z++; this.on = true;
        } else { this.k = NaN; this.on = false; }
      } else this.k = NaN;
      o[0][n] = y0; if (o[1]) o[1][n] = y1;
      this.w = (this.w + 1) % this.N;
    }
    return true;
  }
}
registerProcessor('nb-rip', Rip);
class Phase extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{ name: 'rate', defaultValue: 0.3, minValue: 0.001, maxValue: 20, automationRate: 'k-rate' }, { name: 'depth', defaultValue: 0.6, minValue: 0, maxValue: 1, automationRate: 'k-rate' }, { name: 'center', defaultValue: 800, minValue: 40, maxValue: 8000, automationRate: 'k-rate' },
    { name: 'fb', defaultValue: 0.4, minValue: -0.97, maxValue: 0.97, automationRate: 'k-rate' }, { name: 'stages', defaultValue: 8, minValue: 2, maxValue: 16, automationRate: 'k-rate' }, { name: 'spread', defaultValue: 0.25, minValue: 0, maxValue: 0.5, automationRate: 'k-rate' },
    { name: 'phase', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' }, { name: 'env', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    { name: 'kind', defaultValue: 0, minValue: 0, maxValue: 2, automationRate: 'k-rate' }, { name: 'wave', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' }]; }
  constructor() { super(); live(this); this.z = [new Float32Array(16), new Float32Array(16)]; this.y = [0, 0]; this.ph = 0; this.e = 0; this.n = 0;
    this.bz = [0, 1, 2].map(() => [new Float32Array(16), new Float32Array(16)]); this.by = [0, 1, 2].map(() => [0, 0]); this.bc = [0, 1, 2].map(() => [[0, 0], [0, 0]]); }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], sr = sampleRate, N = o[0].length, st = Math.max(2, Math.min(16, Math.round(P.stages[0] / 2) * 2)), dep = P.depth[0], cen = P.center[0], fb = P.fb[0], sp = P.spread[0], env = P.env[0], kind = Math.round(P.kind[0]), wave = P.wave[0] > 0.5;
    const inc = P.rate[0] / sr;
    for (let n = 0; n < N; n++) {
      let lvl = 0; if (i && i.length) for (const c of i) lvl = Math.max(lvl, Math.abs(c[n])); this.e += (lvl - this.e) * (lvl > this.e ? 0.01 : 0.0005);
      this.ph += inc; if (this.ph >= 1) this.ph -= 1;
      for (let c = 0; c < o.length; c++) {
        const x = i && i.length ? (i[c] || i[0])[n] : 0, z = this.z[c];
        if (kind) { let acc = 0;
          for (let v = 0; v < 3; v++) { let q = this.ph + c * sp + v / 3; q -= Math.floor(q); const zz = this.bz[v][c], cc = this.bc[v][c];
            if ((this.n & 3) === 0) { const sw = kind === 1 ? q * 2 - 1 : 1 - q * 2, f = Math.min(sr * 0.45, cen * Math.pow(2, sw * dep * 3)), t = Math.tan(Math.PI * f / sr), wv = Math.sin(Math.PI * q); cc[0] = (t - 1) / (t + 1); cc[1] = wv * wv; }
            const a = cc[0], wv2 = cc[1];
            let s2 = x + this.by[v][c] * fb; for (let k = 0; k < st; k++) { const y = a * s2 + zz[k]; zz[k] = s2 - a * y; s2 = y; } this.by[v][c] = s2; acc += s2 * wv2; }
          o[c][n] = (x + acc / 1.5) * 0.5; continue; }
        let q0 = this.ph + c * sp; q0 -= Math.floor(q0);
        const lf = wave ? 1 - 4 * Math.abs(q0 - 0.5) : Math.sin(2 * Math.PI * q0), sweep = (env > 0 ? (1 - env) * lf + env * (Math.min(1, this.e * 4) * 2 - 1) : lf);
        const f = Math.min(sr * 0.45, cen * Math.pow(2, sweep * dep * 3)), t = Math.tan(Math.PI * f / sr), a = (t - 1) / (t + 1);
        let s = x + this.y[c] * fb;
        for (let k = 0; k < st; k++) { const y = a * s + z[k]; z[k] = s - a * y; s = y; }
        this.y[c] = s; o[c][n] = (x + s) * 0.5;
      }
      this.n++;
    }
    return true;
  }
}
registerProcessor('nb-phase', Phase);
class Psola {
  constructor(N) { this.N = N; this.acc = new Float32Array(N); this.nrm = new Float32Array(N); this.s = 0; this.a = 0; }
  run(b, tin, tout, T, r, rf, late) { const N = this.N, M = N - 1, acc = this.acc, nrm = this.nrm;
    if (this.s < tout) this.s = tout;
    const Th = Math.max(8, Math.min(T * Math.max(1, 1 / r), (2048 - T * 0.6 - late) / (1 + rf)));
    while (this.s - Th <= tout) {
      if (this.a < this.s - 2000) this.a = this.s;
      while (this.a + T * 0.5 < this.s) this.a += T; while (this.a - T * 0.5 > this.s) this.a -= T;
      const s0 = Math.round(this.s), ab = this.a - late, h = Math.floor(Th);
      for (let d = -h; d <= h; d++) { const w = 0.5 + 0.5 * Math.cos(Math.PI * d / Th), p = ab + d * rf, i0 = Math.floor(p), f = p - i0, x0 = b[i0 & M], x1 = b[(i0 + 1) & M], o = (s0 + d) & M; acc[o] += (x0 + (x1 - x0) * f) * w; nrm[o] += w; }
      this.s += T / r; }
    const o = tout & M, n = nrm[o], y = n > 0.25 ? acc[o] / n : acc[o] / 0.25; acc[o] = 0; nrm[o] = 0; return y; }
}
class Ear {
  constructor() { this.D = new Float32Array(1024); this.dw = 0; this.dec = 0; this.f0 = 0; this.d = new Float32Array(520); }
  push(v) { if ((this.dec ^= 1)) { this.D[this.dw] = v; this.dw = (this.dw + 1) & 1023; } }
  detect() { const sr2 = sampleRate / 2, W = 512, tmin = Math.floor(sr2 / 1000), tmax = Math.min(W - 2, Math.floor(sr2 / 70)), D = this.D, d = this.d;
    const x = k => D[(this.dw - W - tmax + k + 4096) & 1023];
    let e = 0; for (let k = 0; k < W; k++) e += x(k) * x(k); if (e < 1e-4) { this.f0 = 0; return 0; }
    let run = 0, best = -1; for (let t = 1; t <= tmax; t++) { let s = 0; for (let k = 0; k < W; k += 2) { const q = x(k) - x(k + t); s += q * q; } run += s; d[t] = run > 0 ? s * t / run : 1; }
    for (let t = tmin; t < tmax; t++) if (d[t] < 0.18 && d[t] < d[t - 1] && d[t] <= d[t + 1]) { best = t; break; }
    if (best < 0) { this.f0 = 0; return 0; }
    const a = d[best - 1], b = d[best], c = d[best + 1], den = a - 2 * b + c, off = den ? 0.5 * (a - c) / den : 0;
    this.f0 = sr2 / (best + off); return this.f0; }
}
class Collar extends AudioWorkletProcessor {
  static get parameterDescriptors() { const k = (name, d, a, b) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' }); return [k('amount', 1, 0, 1), k('speed', 0.05, 0, 0.5), k('mask', 4095, 0, 4095), k('root', 0, 0, 11), k('shift', 0, -24, 24), k('formant', 0, -12, 12), k('vib', 0, 0, 1)]; }
  constructor() { super(); this.port.onmessage = e => { if (e.data === 'kill') this.dead = true; }; this.N = 16384; this.b = [new Float32Array(this.N), new Float32Array(this.N)]; this.t = 0; this.L = 2048;
    this.V = [new Psola(this.N), new Psola(this.N)]; this.ear = new Ear(); this.hop = 0; this.ratio = 1; this.want = 1; this.T = 0.008 * sampleRate; this.note = null; this.slow = 0; this.held = 0; this.tick = 0; this.q = []; this.wq = 1; this.Tq = 0; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], sr = sampleRate, n0 = o[0].length, M = this.N - 1, rf = Math.pow(2, P.formant[0] / 12), k = P.speed[0] <= 0.001 ? 1 : 1 - Math.exp(-1 / (P.speed[0] * sr)), sh = Math.pow(2, P.shift[0] / 12);
    for (let n = 0; n < n0; n++) {
      let m = 0; for (let c = 0; c < 2; c++) { const v = i && i.length ? (i[c] || i[0])[n] : 0; this.b[c][this.t & M] = v; m += v; } this.ear.push(m * 0.5);
      if (++this.hop >= 256) { this.hop = 0; const f0 = this.ear.detect();
        if (f0 > 0) { this.held = 0; this.T = sr / f0; const mid = 69 + 12 * Math.log2(f0 / 440);
          this.slow = this.slow ? this.slow + (mid - this.slow) * 0.018 : mid; const ref = mid + (this.slow - mid) * P.vib[0];
          const mask = Math.round(P.mask[0]) || 4095, root = Math.round(P.root[0]), inK = nn => mask & (1 << (((nn - root) % 12 + 12) % 12));
          if (this.note == null || !inK(this.note) || Math.abs(ref - this.note) > 0.62) { let bn = Math.round(ref), bd = 99; for (let q = -6; q <= 6; q++) { const nn = Math.round(ref) + q; if (inK(nn) && Math.abs(nn - ref) < bd) { bd = Math.abs(nn - ref); bn = nn; } } this.note = bn; }
          this.want = Math.pow(2, (this.note - ref) * P.amount[0] / 12) * sh; }
        else if (++this.held > 6) { this.note = null; this.slow = 0; this.want = sh; }
        this.q.push([this.want, this.T]); if (this.q.length > 3) { const z = this.q.shift(); this.wq = z[0]; this.Tq = z[1]; } }
      this.ratio += ((this.wq || 1) - this.ratio) * k;
      const tout = this.t - this.L; for (let c = 0; c < o.length; c++) o[c][n] = tout < 0 ? 0 : this.V[c].run(this.b[c], this.t, tout, this.Tq || this.T, this.ratio, rf, 0);
      this.t++;
    }
    if ((++this.tick & 7) === 0) this.port.postMessage({ f0: this.ear.f0, r: this.ratio });
    return true;
  }
}
registerProcessor('nb-collar', Collar);
class Choir extends AudioWorkletProcessor {
  static get parameterDescriptors() { const k = (name, d, a, b) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' }); return [k('mask', 1709, 0, 4095), k('root', 9, 0, 11), k('n', 2, 1, 3), k('i0', 2, -14, 14), k('i1', 4, -14, 14), k('i2', -7, -14, 14),
    k('glide', 0.03, 0, 0.5), k('human', 0.3, 0, 1), k('spread', 0.7, 0, 1), k('formant', 0, -12, 12)]; }
  constructor() { super(); this.port.onmessage = e => { if (e.data === 'kill') this.dead = true; }; this.N = 16384; this.b = new Float32Array(this.N); this.t = 0; this.L = 2048; this.ear = new Ear(); this.hop = 0; this.T = 0.008 * sampleRate;
    this.V = [new Psola(this.N), new Psola(this.N), new Psola(this.N)]; this.r = [1, 1, 1]; this.want = [1, 1, 1]; this.sh = [0, 0, 0]; this.lp = [0, 0, 0]; this.on = 0; this.held = 0; this.tick = 0; this.q = []; this.wq = [1, 1, 1]; this.Tq = 0; this.onq = 0; }
  walk(nn, k, mask, root) { const inK = m => mask & (1 << (((m - root) % 12 + 12) % 12)); let m = nn, g = 0; while (!inK(m) && g++ < 12) m--; let dir = Math.sign(k), s = Math.abs(k); while (s-- > 0) { do { m += dir; } while (!inK(m) && Math.abs(m - nn) < 40); } return m; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], sr = sampleRate, n0 = o[0].length, M = this.N - 1, nv = Math.round(P.n[0]), hu = P.human[0], sp = P.spread[0], rf = Math.pow(2, P.formant[0] / 12);
    const pan = [[Math.cos((0.5 - sp * 0.5) * Math.PI / 2), Math.sin((0.5 - sp * 0.5) * Math.PI / 2)], [Math.cos((0.5 + sp * 0.5) * Math.PI / 2), Math.sin((0.5 + sp * 0.5) * Math.PI / 2)], [0.707, 0.707]];
    const late = [0.011 * hu * sr, 0.019 * hu * sr, 0.027 * hu * sr], gk = P.glide[0] <= 0.001 ? 1 : 1 - Math.exp(-1 / (P.glide[0] * sr));
    for (let n = 0; n < n0; n++) {
      const v = i && i.length ? ((i[0][n] || 0) + ((i[1] || i[0])[n] || 0)) * 0.5 : 0; this.b[this.t & M] = v; this.ear.push(v);
      if (++this.hop >= 256) { this.hop = 0; const f0 = this.ear.detect();
        if (f0 > 0) { this.held = 0; this.on = 1; this.T = sr / f0; const mid = 69 + 12 * Math.log2(f0 / 440), mask = Math.round(P.mask[0]) || 4095, root = Math.round(P.root[0]), nn = Math.round(mid);
          [P.i0[0], P.i1[0], P.i2[0]].forEach((k, j) => { const tgt = this.walk(nn, Math.round(k), mask, root); this.sh[j] = tgt - mid; this.want[j] = Math.pow(2, this.sh[j] / 12); }); }
        else if (++this.held > 6) this.on = 0;
        this.q.push([this.want.slice(), this.T, this.on]); if (this.q.length > 3) { const z = this.q.shift(); this.wq = z[0]; this.Tq = z[1]; this.onq = z[2]; } }
      this.g = (this.g || 0) + ((this.onq ? 1 : 0) - (this.g || 0)) * 0.0015;
      let L = 0, R = 0; const tout = this.t - this.L;
      if (tout >= 0) for (let j = 0; j < nv; j++) {
        this.r[j] += (this.wq[j] - this.r[j]) * gk;
        const vib = 1 + Math.sin(this.t / sr * (4.6 + j * 0.7) * 6.2832 + j * 2) * 0.006 * hu, y = this.V[j].run(this.b, this.t, tout, this.Tq || this.T, this.r[j] * vib, rf, late[j]) * 0.9 * this.g;
        L += y * pan[j][0]; R += y * pan[j][1]; }
      o[0][n] = L; if (o[1]) o[1][n] = R; this.t++;
    }
    if ((++this.tick & 7) === 0) this.port.postMessage({ f0: this.ear.f0, sh: this.sh.slice(0, nv) });
    return true;
  }
}
registerProcessor('nb-choir', Choir);
class Ride extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{ name: 'target', defaultValue: -18, minValue: -40, maxValue: 0, automationRate: 'k-rate' }, { name: 'range', defaultValue: 9, minValue: 0, maxValue: 18, automationRate: 'k-rate' },
    { name: 'speed', defaultValue: 0.25, minValue: 0.02, maxValue: 2, automationRate: 'k-rate' }, { name: 'breath', defaultValue: -90, minValue: -90, maxValue: -20, automationRate: 'k-rate' }, { name: 'bdip', defaultValue: 10, minValue: 0, maxValue: 24, automationRate: 'k-rate' },
    { name: 'ahead', defaultValue: 0, minValue: 0, maxValue: 0.03, automationRate: 'k-rate' }, { name: 'ear', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' }]; }
  constructor() { super(); live(this); this.e = 0; this.g = 0; this.want = 0; this.k = 0; this.lvl = -90; this.port.onmessage = e => { if (e.data === 'kill') this.dead = true; }; this.D = [new Float32Array(2048), new Float32Array(2048)]; this.dw = 0; this.h1 = [0, 0]; this.h2 = [0, 0]; this.lp = [0, 0]; this.ef = 0; this.hold = -90; this.gd = 24; }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], sr = sampleRate, N = o[0].length, a = 1 - Math.exp(-1 / (0.08 * sr)), af = 1 - Math.exp(-1 / (0.01 * sr)), sk = 1 - Math.exp(-1 / (P.speed[0] * sr)), skd = 1 - Math.exp(-3 / (P.speed[0] * sr)), gr = 1 - Math.exp(-1 / (0.15 * sr)), ga = 1 - Math.exp(-1 / (0.0015 * sr)), tg = P.target[0];
    for (let n = 0; n < N; n++) {
      const x0 = i && i.length ? i[0][n] || 0 : 0, x1 = i && i.length ? (i[1] || i[0])[n] || 0 : 0, ear = P.ear[0] >= 0.5;
      let e0 = x0, e1 = x1; if (ear) { const kh = 1 - Math.exp(-2 * Math.PI * 150 / sr), kl = 1 - Math.exp(-2 * Math.PI * 8000 / sr); this.h1[0] += (x0 - this.h1[0]) * kh; this.h1[1] += (x1 - this.h1[1]) * kh; e0 = x0 - this.h1[0]; e1 = x1 - this.h1[1]; this.lp[0] += (e0 - this.lp[0]) * kl; this.lp[1] += (e1 - this.lp[1]) * kl; e0 = this.lp[0]; e1 = this.lp[1]; }
      const pw = (e0 * e0 + e1 * e1) * 0.5 * (ear ? 1.4 : 1); this.e += (pw - this.e) * a; this.ef += (pw - this.ef) * af;
      const la = Math.round(P.ahead[0] * sr); this.D[0][this.dw] = x0; this.D[1][this.dw] = x1; const ri = (this.dw - la + 2048) & 2047, y0 = la ? this.D[0][ri] : x0, y1 = la ? this.D[1][ri] : x1; this.dw = (this.dw + 1) & 2047;
      if (++this.k >= 64) { this.k = 0; const lvl = this.lvl = 10 * Math.log10(this.e + 1e-12), rg = P.range[0], lf = 10 * Math.log10(this.ef + 1e-12);
        this.hold = Math.max(lvl, this.hold - 64 / sr * 20);
        if (lvl < -70) this.want = Math.min(this.want, 0);
        else if (lvl < P.breath[0]) this.want = -P.bdip[0];
        else if (lvl > this.hold - 8) { const t = Math.max(-rg, Math.min(rg, tg - lvl)); if (Math.abs(t - this.want) > 1) this.want = t; }
        this.gt = lf > -60 ? Math.min(24, tg + 3 - lf) : 24; }
      this.g += (this.want - this.g) * (this.want < this.g ? skd : sk);
      const gt = this.gt == null ? 24 : this.gt; this.gd += (gt - this.gd) * (gt < this.gd ? ga : gr);
      const gg = Math.pow(10, Math.min(this.g, this.gd) / 20); o[0][n] = y0 * gg; if (o[1]) o[1][n] = y1 * gg;
    }
    if ((this.tick = (this.tick || 0) + 1) % 6 === 0) this.port.postMessage({ g: this.g, lvl: this.lvl });
    return true;
  }
}
registerProcessor('nb-ride', Ride);
class Yield extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{ name: 'amount', defaultValue: 0.6, minValue: 0, maxValue: 1, automationRate: 'k-rate' }, { name: 'range', defaultValue: 12, minValue: 0, maxValue: 36, automationRate: 'k-rate' },
    { name: 'att', defaultValue: 0.01, minValue: 0.001, maxValue: 0.5, automationRate: 'k-rate' }, { name: 'rel', defaultValue: 0.15, minValue: 0.01, maxValue: 2, automationRate: 'k-rate' },
    { name: 'lo', defaultValue: 20, minValue: 20, maxValue: 20000, automationRate: 'k-rate' }, { name: 'hi', defaultValue: 20000, minValue: 20, maxValue: 20000, automationRate: 'k-rate' },
    { name: 'sense', defaultValue: 9, minValue: -12, maxValue: 24, automationRate: 'k-rate' }, { name: 'sides', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' }]; }
  constructor() { super(); live(this); this.kd = new Float32Array(32); const N = 1024; this.N = N; this.H = 256; this.win = new Float32Array(N); for (let k = 0; k < N; k++) this.win[k] = 0.5 - 0.5 * Math.cos(2 * Math.PI * k / N);
    this.inb = [new Float32Array(N), new Float32Array(N), new Float32Array(N)]; this.pos = 0; this.cnt = 0;
    this.re = new Float32Array(N); this.im = new Float32Array(N); this.sr2 = new Float32Array(N); this.si2 = new Float32Array(N);
    this.B = 32; this.g = new Float32Array(this.B).fill(1); this.band = new Int16Array(N / 2 + 1); this.gl = new Float32Array(this.B); }
  fft(re, im, inv) { const n = re.length; for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let len = 2; len <= n; len <<= 1) { const a = (inv ? 2 : -2) * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a); for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let j = 0; j < len / 2; j++) { const ur = re[i + j], ui = im[i + j], vr = re[i + j + len / 2] * cr - im[i + j + len / 2] * ci, vi = re[i + j + len / 2] * ci + im[i + j + len / 2] * cr; re[i + j] = ur + vr; im[i + j] = ui + vi; re[i + j + len / 2] = ur - vr; im[i + j + len / 2] = ui - vi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } } }
  frame(P) {
    const N = this.N, sr = sampleRate, B = this.B, w = this.win, start = this.pos;
    if (!this.bandOk) { this.bandOk = 1; for (let k = 0; k <= N / 2; k++) { const f = k * sr / N; this.band[k] = Math.max(0, Math.min(B - 1, Math.floor(Math.log(Math.max(20, f) / 20) / Math.log(1000) * B))); } }
    const sR = this.sr2, sI = this.si2; for (let k = 0; k < N; k++) { sR[k] = this.inb[2][(start + k) % N] * w[k]; sI[k] = 0; } this.fft(sR, sI, false);
    const se = new Float32Array(B), me = new Float32Array(B);
    if (!this.re2) { this.re2 = new Float32Array(N); this.im2 = new Float32Array(N); }
    for (let c = 0; c < 2; c++) { const re = c ? this.re2 : this.re, im = c ? this.im2 : this.im;
      for (let k = 0; k < N; k++) { re[k] = this.inb[c][(start + k) % N] * w[k]; im[k] = 0; } this.fft(re, im, false);
      for (let k = 1; k <= N / 2; k++) me[this.band[k]] += re[k] * re[k] + im[k] * im[k]; }
    for (let k = 1; k <= N / 2; k++) se[this.band[k]] += sR[k] * sR[k] + sI[k] * sI[k];
    const hopT = this.H / sr, ka = 1 - Math.exp(-hopT / P.att[0]), kr = 1 - Math.exp(-hopT / P.rel[0]), rng = P.range[0], am = P.amount[0], lo = P.lo[0], hi = P.hi[0];
    for (let b = 0; b < B; b++) { const fb = 20 * Math.pow(1000, (b + 0.5) / B); let want = 1;
      if (fb >= lo && fb <= hi) { const sd = 10 * Math.log10(se[b] + 1e-12), md = 10 * Math.log10(me[b] / 2 + 1e-12); if (sd > -75) want = Math.pow(10, -Math.min(rng, Math.max(0, sd - md + P.sense[0]) * am) / 20); this.kd[b] = sd; } else this.kd[b] = -90;
      this.g[b] += (want - this.g[b]) * (want < this.g[b] ? ka : kr); this.gl[b] = this.g[b]; }
    if (P.sides[0] >= 0.5) { const R0 = this.re, I0 = this.im, R1 = this.re2, I1 = this.im2;
      for (let k = 0; k < N; k++) { const kk = k <= N / 2 ? k : N - k, g = this.g[this.band[kk]], mr = (R0[k] + R1[k]) * 0.5, mi = (I0[k] + I1[k]) * 0.5, sr0 = (R0[k] - R1[k]) * 0.5 * g, si0 = (I0[k] - I1[k]) * 0.5 * g; R0[k] = mr + sr0; I0[k] = mi + si0; R1[k] = mr - sr0; I1[k] = mi - si0; }
      for (let c = 0; c < 2; c++) { const re = c ? this.re2 : this.re, im = c ? this.im2 : this.im, acc = this.outb[c]; this.fft(re, im, true); for (let k = 0; k < N; k++) acc[(this.op + k) % N] += re[k] / N * w[k] * (2 / 3); }
      return; }
    for (let c = 0; c < 2; c++) { const re = c ? this.re2 : this.re, im = c ? this.im2 : this.im, acc = this.outb[c];
      for (let k = 0; k <= N / 2; k++) { const g = this.g[this.band[k]]; re[k] *= g; im[k] *= g; if (k && k < N / 2) { re[N - k] *= g; im[N - k] *= g; } }
      this.fft(re, im, true);
      for (let k = 0; k < N; k++) acc[(this.op + k) % N] += re[k] / N * w[k] * (2 / 3); }
  }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], s = ins[1], o = outs[0], n0 = o[0].length, N = this.N;
    if (this.op == null) { this.op = 0; this.outb = [new Float32Array(N), new Float32Array(N)]; }
    for (let n = 0; n < n0; n++) {
      for (let c = 0; c < 2; c++) this.inb[c][this.pos] = i && i.length ? (i[c] || i[0])[n] : 0;
      let sv = 0; if (s && s.length) { for (const c of s) sv += c[n]; sv /= s.length; } this.inb[2][this.pos] = sv;
      this.pos = (this.pos + 1) % N;
      if (++this.cnt >= this.H) { this.cnt = 0; this.frame(P); }
      for (let c = 0; c < o.length; c++) { const acc = this.outb[Math.min(1, c)]; o[c][n] = acc[this.op]; }
      this.outb[0][this.op] = 0; this.outb[1][this.op] = 0; this.op = (this.op + 1) % N;
    }
    if ((this.t2 = ((this.t2 || 0) + 1) % 6) === 0) this.port.postMessage({ g: Array.from(this.gl), k: Array.from(this.kd) });
    return true;
  }
}
registerProcessor('nb-yield', Yield);
class Chasm extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{ name: 'size', defaultValue: 0.5, minValue: 0, maxValue: 1, automationRate: 'k-rate' }, { name: 'fb', defaultValue: 0.7, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    { name: 'damp', defaultValue: 6000, minValue: 200, maxValue: 20000, automationRate: 'k-rate' }, { name: 'mod', defaultValue: 0.3, minValue: 0, maxValue: 1, automationRate: 'k-rate' }, { name: 'rate', defaultValue: 0.3, minValue: 0.01, maxValue: 5, automationRate: 'k-rate' },
    { name: 'diff', defaultValue: 0.6, minValue: 0, maxValue: 1, automationRate: 'k-rate' }, { name: 'base', defaultValue: 0, minValue: 0, maxValue: 4, automationRate: 'k-rate' }, { name: 'spread', defaultValue: 1, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    { name: 'frz', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' }, { name: 'duck', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' }, { name: 'width', defaultValue: 1, minValue: 0, maxValue: 1, automationRate: 'k-rate' }]; }
  constructor() { super(); live(this); this.dk = 0; this.fz = 1; this.L = 8; this.M = 1 << 18; this.buf = []; for (let k = 0; k < 8; k++) this.buf.push(new Float32Array(this.M)); this.w = 0; this.lp = new Float32Array(8); this.ph = new Float32Array(8).map((_, k) => k * 0.37);
    this.ap = [0, 1, 2, 3].map(() => ({ b: new Float32Array(4096), w: 0 })); this.apL = [0.0047, 0.0036, 0.0127, 0.0093]; this.rel = [1, 1.13, 1.27, 1.41, 1.59, 1.71, 1.87, 2.03]; this.out = new Float32Array(8); }
  process(ins, outs, P) { if (this.dead) return false;
    const i = ins[0], o = outs[0], sr = sampleRate, N = o[0].length, size = P.size[0], frz = P.frz[0] > 0.5, fb = frz ? 1 : Math.min(0.995, P.fb[0] * 1.02), dm = P.damp[0], md = frz ? 0 : P.mod[0], rt = P.rate[0], df = P.diff[0], base = P.base[0], spr = P.spread[0], du = P.duck[0], wd = P.width[0];
    const dk = frz ? 1 : 1 - Math.exp(-2 * Math.PI * dm / sr), M = this.M, L = this.L, da = 1 - Math.exp(-1 / (0.005 * sr)), dr = 1 - Math.exp(-1 / (0.35 * sr)), wa = (1 + wd) / 2, wc = (1 - wd) / 2;
    const len = new Float32Array(8); for (let k = 0; k < 8; k++) { const s = base > 0 ? base * (1 + (this.rel[k] - 1) * 0.08 * spr) : (0.012 + Math.pow(size, 1.6) * 0.32) * this.rel[k]; len[k] = Math.min(M - 4, Math.max(32, s * sr)); }
    for (let n = 0; n < N; n++) {
      let xl = i && i.length ? i[0][n] : 0, xr = i && i.length ? (i[1] || i[0])[n] : 0;
      const ax = Math.max(Math.abs(xl), Math.abs(xr)); this.dk += (ax - this.dk) * (ax > this.dk ? da : dr);
      this.fz += ((frz ? 0 : 1) - this.fz) * 0.002; xl *= this.fz; xr *= this.fz;
      let s = (xl + xr) * 0.5; for (let a = 0; a < 4; a++) { const A = this.ap[a], D = Math.floor(this.apL[a] * sr * (0.5 + size)), g = 0.65 * df; const r = A.b[(A.w - D + 4096) % 4096], y = -g * s + r; A.b[A.w] = s + g * y; A.w = (A.w + 1) % 4096; s = y * (df > 0.01 ? 1 : 0) + s * (df > 0.01 ? 0 : 1); }
      let sum = 0; for (let k = 0; k < L; k++) { this.ph[k] += rt * (1 + k * 0.13) / sr; const d = len[k] * (1 + md * 0.012 * Math.sin(2 * Math.PI * this.ph[k])), p = this.w - d, i0 = Math.floor(p), f = p - i0, b = this.buf[k], a0 = ((i0 % M) + M) % M, a1 = (a0 + 1) % M;
        let v = b[a0] + (b[a1] - b[a0]) * f; this.lp[k] += (v - this.lp[k]) * dk; this.out[k] = this.lp[k]; sum += this.lp[k]; }
      const hs = sum * 2 / L;
      for (let k = 0; k < L; k++) { const inj = k < 4 ? (xl * (1 - df) + s * df) : (xr * (1 - df) + s * df); this.buf[k][this.w] = (this.out[k] - hs) * fb + inj * 0.35; }
      let ol = 0, or = 0; for (let k = 0; k < L; k++) { if (k % 2) or += this.out[k]; else ol += this.out[k]; }
      const dg = du > 0 ? 1 / (1 + du * this.dk * 12) : 1; ol *= 0.5 * dg; or *= 0.5 * dg;
      o[0][n] = ol * wa + or * wc; if (o[1]) o[1][n] = or * wa + ol * wc;
      this.w = (this.w + 1) % M;
    }
    return true;
  }
}
registerProcessor('nb-chasm', Chasm);
class Sing extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    const k = (name, def, mn, mx) => ({ name, defaultValue: def, minValue: mn, maxValue: mx, automationRate: 'k-rate' });
    const a = (name, def, mn, mx) => ({ name, defaultValue: def, minValue: mn, maxValue: mx, automationRate: 'a-rate' });
    return [BEND, a('f0', 220, 20, 2000), a('av', 0, 0, 2), a('ah', 0, 0, 2), a('af', 0, 0, 4), k('ab', 0, 0, 2),
      k('vib', 0, 0, 200), k('vrate', 5.5, 0.5, 12), k('drift', 0.5, 0, 2), k('jit', 0.5, 0, 2), k('oq', 0.6, 0.25, 0.95), k('tilt', 0.3, 0, 1), k('growl', 0, 0, 1),
      k('F1', 700, 100, 5000), k('F2', 1200, 200, 6000), k('F3', 2600, 500, 7000), k('F4', 3500, 1000, 8000), k('F5', 4500, 1000, 9000),
      k('B1', 80, 20, 1000), k('B2', 100, 20, 1500), k('B3', 150, 20, 2000), k('B4', 200, 20, 2500), k('B5', 260, 20, 3000),
      k('nz', 270, 150, 4000), k('ff', 5000, 500, 10000), k('fb', 1500, 100, 6000), k('nb', 100, 50, 800), k('robo', 0, 0, 1), k('metal', 0, 0, 1), k('scr', 0, 0, 1), k('sk', 0, 0, 9), k('gl', 0, 0, 1), k('twg', 0, 0, 1.5), k('fry', 0, 0, 1)];
  }
  constructor(o) { super(); live(this);
    let s = (o && o.processorOptions && o.processorOptions.seed) || 12345; this.rs = (s >>> 0) || 1;
    this.ph = 0; this.pf = 1; this.sa = 1; this.alt = false; this.oqc = 0.6; this.tl = 0; this.an = 0; this.vp = (s % 628) / 100; this.vw = 0; this.d1 = 0; this.d2 = 0; this.quiet = 1e9; this.k = 0; this.go = false; this.cf = 1;
    this.R = []; for (let j = 0; j < 8; j++) this.R.push(new Float64Array(9));
    this.cy = 0; this.sn = 2; this.ev = 0; this.Ek = 0; this.lg = 0.37; this.cm = 1; this.cmS = 1; this.mo = 0; this.ma = 1; this.h1 = 0; this.h2 = 0; this.x1 = 0; this.x2 = 0; this.hpa = 0.9; this.nh = 0; this.bb = 0; this.bb2 = 1; this.lf = 0; this.wb = 0; this.wb2 = 0; this.ck = 0; this.st = 0;
    this.np = new Float64Array(8); this.set(this.np, 270, 100); this.hp = 0; this.u1 = 0; this.u2 = 0; this.e1 = 0; this.e2 = 0; this.Zo = new Float64Array(9); this.zf = 1; this.pr = 0; this.cb = new Float32Array(4096); this.ci = 0; this.l1 = 0; this.l2 = 0; this.kl = 0.9;
  }
  rnd() { let x = this.rs; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.rs = x >>> 0; return this.rs / 4294967296 * 2 - 1; }
  set(r, F, B) { const sr = sampleRate, rr = Math.exp(-Math.PI * B / sr), th = 2 * Math.PI * Math.min(F, sr * 0.45) / sr, b = 2 * rr * Math.cos(th), c = -rr * rr;
    r[0] = F; r[1] = B; r[2] = 1 - b - c; r[3] = b; r[4] = c; r[7] = (1 - rr) * Math.sqrt(1 - 2 * rr * Math.cos(2 * th) + rr * rr); r[8] = r[7] / (2 * Math.sin(th)); }
  process(ins, outs, P) { if (this.dead) return false; this.sbm = bendOf(P);
    const o = outs[0][0], N = o.length, sr = sampleRate, R = this.R;
    if (P.av.length === 1 && P.ah.length === 1 && P.af.length === 1 && P.av[0] < 1e-5 && P.ah[0] < 1e-5 && P.af[0] < 1e-5 && P.ab[0] < 1e-5 && this.quiet > sr * 0.15) {
      for (const ch of outs[0]) ch.fill(0); this.go = false; return true; }
    const FP = [P.F1[0], P.F2[0], P.F3[0], P.F4[0], P.F5[0]], BP = [P.B1[0], P.B2[0], P.B3[0], P.B4[0], P.B5[0]], nzP = P.nz[0], ffP = P.ff[0], fbP = P.fb[0], nbP = P.nb[0];
    if (!this.go) { for (let j = 0; j < 5; j++) this.set(R[j], FP[j], BP[j]); this.set(R[5], nzP, nbP); this.set(R[6], ffP, fbP); this.set(R[7], Math.min(ffP * 1.45, sr * 0.44), fbP * 1.3); this.go = true; this.k = 0; }
    const vib = P.vib[0], vr = P.vrate[0], dr = P.drift[0], jit = P.jit[0], gr = P.growl[0], ab = P.ab[0], ro = P.robo[0], me = P.metal[0], sc = P.scr[0], sk = Math.round(P.sk[0]);
    const SK = [[0,    2, 0.6,  0.35, 0.004, 0, 0.7, 1,   0.15, 0.3,  0,   1,    0.8, 0.5],
                [0.15, 2, 1.1,  0.6,  0.012, 0, 0.8, 0.5, 0.35, 0.2,  0,   0.95, 0.8, 0.6],
                [0.2,  0, 1.2,  0.8,  0.03,  1, 0.6, 0.3, 0.5,  0.15, 120, 0.8,  0.7, 0.8],
                [0.8,  2, 1.15, 0.7,  0.015, 1, 1,   0.2, 0.5,  0.15, 20,  0.85, 1,   0.9],
                [0.1,  3, 1.2,  0.7,  0.02,  0, 0.8, 0.6, 0.45, 0.2,  0,   0.95, 0.9, 0.5],
                [0.2,  2, 1.1,  0.6,  0.015, 0, 0.5, 0.3, 0.8,  0.05, 0,   0.7,  0.5, 0.9],
                [0.1,  2, 1.2,  0.6,  0.015, 0, 0.8, 1.4, 0.35, 0.15, 0,   1,    0.6, 0.9],
                [0.6,  3, 1.0,  0.6,  0.02,  1, 0.5, 0,   0.25, 0.15, 0,   0.9,  0.8, 1.05],
                [0,    2, 0.5,  0.3,  0.01,  0, 0.3, 0.2, 0.2,  0.05, 0,   0.95, 0.2, 0.3],
                [0,    2, 0.55, 0.3,  0.005, 0, 0.5, 0.4, 0.1,  0.3,  0,   1,    0.4, 0]][sk] || [0, 2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0];
    const WD = [25, 30, 20, 20, 70, 40, 45, 25, 0, 0][sk] || 0, WA = [0.15, 0.18, 0.15, 0.15, 0.3, 0.2, 0.2, 0.15, 0, 0.12][sk] || 0, RG = [0.25, 0.3, 0.1, 0.1, 0.5, 0.3, 0.15, 0.1, 0.15, 0.2][sk] || 0;
    const GG = sk === 7 ? 1 + 0.75 * Math.sqrt(P.scr[0]) : 1;
    const se = Math.sqrt(sc), sa = SK[0] * se, cd = SK[3] * se * 0.5, ct = SK[4] * se * 0.4, fv = SK[6] * se, tw = SK[7] * se, pn = SK[8] * se, cr = SK[10] * se, vk = 1 - (1 - SK[11]) * se, dv = SK[12] * sc, gl = P.gl[0];
    const ka = 1 - Math.exp(-2 * Math.PI * 14000 * Math.pow(0.07, Math.max(0, Math.min(1, P.tilt[0] - 0.22 * ((this.Ek || 0) - 0.85) - 0.15 * se))) / sr), kd = 1 - Math.exp(-2 * Math.PI * 2.2 * 16 / sr), khp = Math.exp(-2 * Math.PI * 2500 / sr), khi = Math.exp(-2 * Math.PI * 4500 / sr);
    const f0 = P.f0, avP = P.av, ahP = P.ah, afP = P.af, np = this.np, Z = R[5], H1 = R[6], H2 = R[7];
    for (let n = 0; n < N; n++) {
      if (this.k === 0) { const fz0 = (f0.length > 1 ? f0[n] : f0[0]) * this.sbm;
        { const t2 = Math.min(1.4, (tw + P.twg[0]) * (0.4 + 0.6 * (this.Ek || 0))) * Math.min(1, 1.2 / (1 + Math.pow(fz0 / 450, 2))); let F = FP.slice(), B = BP.slice();
          if (t2 > 0.01) { const c = Math.max(2600, Math.min(3400, FP[2] * 1.05)); F[2] += (c * 0.93 - F[2]) * Math.min(1, t2 * 0.6); F[3] += (c * 1.08 - F[3]) * Math.min(1, t2 * 0.7); F[4] += (c * 1.28 - F[4]) * Math.min(1, t2 * 0.5); for (let j = 2; j < 5; j++) B[j] *= 1 - Math.min(0.45, t2 * 0.35); }
          if (sk === 6 && sc > 0) { const br = this.br || 0; F[1] += (Math.max(F[1], 2500) - F[1]) * br * se; F[0] *= 1 - 0.35 * br * se; F[2] += (Math.max(F[2], 3200) - F[2]) * br * se * 0.6; this.br = br * 0.9985; }
          for (let j = 0; j < 5; j++) this.set(R[j], R[j][0] + (F[j] - R[j][0]) * 0.3, R[j][1] + (B[j] - R[j][1]) * 0.3); }
        if (Math.abs(nzP - Z[0]) > 150) { this.Zo.set(Z); this.set(Z, nzP, nbP); this.zf = 0; } else this.set(Z, Z[0] + (nzP - Z[0]) * 0.3, Z[1] + (nbP - Z[1]) * 0.3);
        const fq = H1[0] + (ffP - H1[0]) * 0.4, fw = H1[1] + (fbP - H1[1]) * 0.4; this.set(H1, fq, fw); this.set(H2, Math.min(fq * 1.45, sr * 0.44), fw * 1.3); this.kl = Math.exp(-2 * Math.PI * fq * 0.5 / sr);
        this.vw += (this.rnd() * 0.5 - this.vw) * 0.002; this.vp += 2 * Math.PI * vr * (1 + this.vw * 0.08) * 16 / sr; if (this.vp > 6.2832) this.vp -= 6.2832;
        this.d1 += (this.rnd() - this.d1) * kd; this.d2 += (this.d1 - this.d2) * kd;
        if (sc > 0) { if ((this.wt = (this.wt || 0) - 16) <= 0) { this.wt = sr * (0.08 + 0.17 * (this.rnd() * 0.5 + 0.5)); this.wg = this.rnd(); }
          const a1 = 1 - Math.exp(-16 / (0.045 * sr)); this.wa = (this.wa || 0) + ((this.wg || 0) - (this.wa || 0)) * a1; this.wa2 = (this.wa2 || 0) + (this.wa - (this.wa2 || 0)) * a1; }
        this.wm = 1 + WA * se * (this.wa2 || 0); this.hiR = Math.max(0.15, Math.min(1, (fz0 - 180) / 320));
        if (sk === 4 && sc > 0) { this.wb += (this.rnd() * 1.6 - this.wb) * 0.05; this.wb2 += (this.wb - this.wb2) * 0.06; }
        let ex = 0;
        if (sk === 8 && sc > 0) { this.lf += 6.2832 * 5.2 * 16 / sr; if (this.lf > 6.2832) this.lf -= 6.2832; ex += Math.sin(this.lf) * 10 * se;
          if ((this.sbt = (this.sbt || 0) - 16) <= 0) { this.sbt = sr * (0.14 + (this.rnd() * 0.5 + 0.5) * 0.28); this.sbv = 1; } this.sbv = (this.sbv || 0) * 0.982; ex -= this.sbv * 28 * se; }
        if (sk === 7 && sc > 0) this.bb2 += ((this.gc || 0) * (this.bb || 0) - this.bb2) * 0.3;
        if (gl > 0.001) { if (this.ck <= 0 && this.st <= 0 && this.rnd() > 1 - 0.0022 * gl) { if (this.rnd() > 0.45) this.ck = Math.floor(sr * (0.04 + 0.07 * (this.rnd() * 0.5 + 0.5)) / 16); else this.st = Math.floor(sr * (0.02 + 0.04 * (this.rnd() * 0.5 + 0.5)) / 16); }
          if (this.ck > 0) { this.ck--; ex += 700 * gl; } if (this.st > 0) this.st--; }
        this.cf = Math.pow(2, (vib * Math.sin(this.vp) + this.d2 * dr * 28 + (sk === 4 ? this.wb2 * sc * 150 : 0) + WD * se * (this.wa2 || 0) + ex) / 1200);
        { const fz = (f0.length > 1 ? f0[n] : f0[0]) * this.cf; const deep = sk === 3 || sk === 7; this.hpa = Math.exp(-2 * Math.PI * Math.min(sr * 0.4, deep ? Math.max(240, 2.5 * fz) : Math.max(700, 4 * fz)) / sr); this.lo = Math.max(0.3, Math.min(1, (fz - 50) / 150)); this.kc = Math.exp(-2 * Math.PI * 800 / sr); }
      }
      this.k = (this.k + 1) & 15;
      const f = Math.min(sr * 0.3, (f0.length > 1 ? f0[n] : f0[0]) * this.cf * this.pf * this.sbm), dt = f / sr;
      const av = (avP.length > 1 ? avP[n] : avP[0]) * (sc > 0.001 ? this.wm || 1 : 1), ah = ahP.length > 1 ? ahP[n] : ahP[0], af = afP.length > 1 ? afP[n] : afP[0];
      this.ph += dt;
      if (this.ph >= 1) { this.ph -= 1;
        this.alt = !this.alt; this.pf = 1 + this.rnd() * 0.005 * jit + (gr > 0 ? (this.alt ? 1 : -1) * gr * 0.006 : 0);
        this.sa = (1 + this.rnd() * 0.05 * jit) * (gr > 0 && this.alt ? 1 - gr * 0.12 : 1); this.oqc = P.oq[0];
        if (sc > 0 || gr > 0) { this.cy++; if (this.cy >= this.sn) { this.cy = 0; this.sn = sc > 0 ? SK[1] || 2 + Math.floor((this.rnd() * 0.5 + 0.5) * 2.99) : 2; this.mo = this.rnd() * 0.03; this.ma = Math.pow(10, this.rnd() * 3 / 20); }
          const r = 2.8 + SK[2] * 0.82 * se * Math.pow(Math.min(1.2, this.Ek || 0), 1.4); let l = this.lg || 0.37; l = r * l * (1 - l); if (!(l > 0.001 && l < 0.999)) l = 0.37; this.lg = l;
          const dev = Math.max(-1, Math.min(1, (l - (1 - 1 / r)) * 2.2));
          this.cm = 1 + cd * dev; this.pf += ct * dev; this.oqc = Math.max(0.25, Math.min(0.9, this.oqc + cd * 0.12 * dev)); }
        const fy = P.fry[0]; if (fy > 0.01) { this.pf *= 1 + fy * (1.4 + (this.rnd() * 0.5 + 0.5) * 2.2); this.oqc = Math.max(0.22, this.oqc - 0.3 * fy); this.sa *= 1 - fy * 0.5 * (this.rnd() * 0.5 + 0.5); } }
      const oq = this.oqc, ph = this.ph;
      let g = 0; if (ph < oq) { const x = ph / oq; g = 2 * x - 3 * x * x; }
      let q = ph - oq; if (q < 0) q += 1;
      if (q < dt) { const t = q / dt; g += 0.5 * (t + t - t * t - 1); } else if (q > 1 - dt) { const t = (q - 1) / dt; g += 0.5 * (t * t + t + t + 1); }
      if (ro > 0) { let sw = 2 * ph - 1; if (ph < dt) { const t = ph / dt; sw -= t + t - t * t - 1; } else if (ph > 1 - dt) { const t = (ph - 1) / dt; sw -= t * t + t + t + 1; } g = (g * (1 - ro) + sw * ro * 0.5) * (1 + ro * (1 - ro) * 1.6); }
      this.tl += (g * this.sa - this.tl) * ka;
      let vo = this.tl * av, fn2 = 0, gg = GG;
      if (this.st > 0) vo *= 0.08;
      const vc = vo;
      this.ev += (Math.abs(vc) - this.ev) * 0.35; this.Ek = (this.Ek || 0) + (Math.min(1.3, av) - (this.Ek || 0)) * 0.0015;
      if (sc > 0.001 || gr > 0.001) {
        const kL = 0.45 + 0.55 * Math.min(1.25, av);
        if (dv > 0.01) { const d = 1 + dv * 3 * kL; vo = (Math.tanh(d * vo + 0.1) - Math.tanh(0.1)) / d * (1 + dv * 0.5); }
        if (av > 0.4 && (this.pav || 0) < 0.2) this.br = 1; this.pav = (this.pav || 0) + (av - (this.pav || 0)) * 0.002;
        if (sk === 6) { const rt = 3.7 + Math.sin((this.sq2 = (this.sq2 || 0) + 0.00002) * 6.2832) * 0.35 + (this.cm - 1) * 1.6; this.bph = ((this.bph || 0) + f * rt / sr) % 1;
          vo *= 1 + 0.5 * se * kL * Math.sin(6.2832 * this.bph); }
        if (sk === 7) { if ((this.gp = (this.gp || 0) - 1) <= 0) { const u = this.rnd() * 0.5 + 0.5; this.gN = this.gp = Math.floor(sr / (18 + 14 * u)); this.bb = this.gd = (0.5 + 0.5 * (this.rnd() * 0.5 + 0.5)) * Math.min(1, (this.Ek || 0) * 1.3);
            const B = this.bub || (this.bub = []); if (B.length < 4 && this.rnd() > -0.2) { const rad = 0.004 + (this.rnd() * 0.5 + 0.5) * 0.008, fb = 3.26 / rad, d = 2.5 * (0.13 * fb + 0.0072 * Math.pow(fb, 1.5));
              B.push({ w: 6.2832 * fb / sr, dw: 6.2832 * fb * 0.1 * d / (sr * sr), k: Math.exp(-d / sr), a: (0.5 + 0.5 * (this.rnd() * 0.5 + 0.5)) * 0.7 * av * this.gd, p: 0 }); } }
          const gq = 1 - this.gp / this.gN, cl = gq < 0.4 ? Math.sin(Math.PI * gq / 0.4) : 0; this.gc = cl; vo *= 1 - 0.5 * se * this.gd * cl; gg *= 1 - 0.75 * se * this.gd * cl;
          const B = this.bub || []; let bs = 0; for (let i = B.length - 1; i >= 0; i--) { const b = B[i]; b.p += b.w; b.w += b.dw; b.a *= b.k; bs += Math.sin(b.p) * b.a; if (b.a < 0.002) B.splice(i, 1); }
          this.wn = (this.wn || 0) + (this.rnd() - (this.wn || 0)) * 0.5; fn2 += bs * se + this.wn * cl * this.gd * se * av * 0.3 * (0.5 + 0.7 * (this.hiR || 0.5)); }
        if (RG > 0) { this.rp = (this.rp || 0) + (this.rr || 60) / sr; if (this.rp >= 1) { this.rp -= 1; this.rr = 40 + 70 * (this.rnd() * 0.5 + 0.5); this.ra = 0.5 + 0.5 * (this.rnd() * 0.5 + 0.5); }
          gg *= 1 - RG * se * Math.min(1, (this.Ek || 0) * 1.2) * (this.hiR || 0.5) * (this.ra || 1) * (0.5 - 0.5 * Math.cos(6.2832 * this.rp)); }
        this.cmS = (this.cmS || 1) + ((this.cm || 1) - (this.cmS || 1)) * 0.08;
        if (SK[5]) vo *= this.cmS; else { this.lw = (this.lw || 0) * this.kc + vo * (1 - this.kc); vo = this.lw + (vo - this.lw) * this.cmS; }
        if (fv > 0.01) { const bq = this.bpf || (this.bpf = new Float64Array(9)); if (!bq.on) { this.set(bq, 1800, 2200); bq.on = 1; } const y = bq[8] * (vo - (this.bx2 || 0)) + bq[3] * bq[5] + bq[4] * bq[6]; bq[6] = bq[5]; bq[5] = y; this.bx2 = this.bx1 || 0; this.bx1 = vo;
          vo += y * (Math.pow(10, 8 * fv * Math.min(1.2, this.Ek) / 20) - 1); }
        const m = Math.cos(6.2832 * ((this.cy + ph) / this.sn + this.mo)), sb = vo * m;
        const a = this.hpa; this.h1 = a * (this.h1 + sb - this.x1); this.x1 = sb; this.h2 = a * (this.h2 + this.h1 - this.x2); this.x2 = this.h1;
        vo += this.h2 * (sa + gr * 0.55) * this.ma * 2.6 * kL * (this.lo || 1) * (sk === 7 ? 0.4 + this.bb2 * 1.2 : 1);
        const nr = this.rnd(); this.nh += (nr - this.nh) * 0.45; const fl2 = this.ev * 6 * Math.min(1.3, av), tb = Math.max(0, fl2 * fl2 - SK[9]);
        fn2 += (nr - this.nh) * tb * pn * 0.8 * (sk === 7 ? 0.5 + this.bb2 : 1) * (0.55 + 0.45 * (this.lo || 1));
        vo *= vk;
        if (cr > 0 && this.rnd() > 1 - 2 * cr / sr) this.cp = (this.rnd() > 0 ? 1 : -1) * (0.5 + 0.5 * Math.abs(this.rnd())) * av * 0.45;
        if (this.cp) { fn2 += this.cp; this.cp *= -0.55; if (Math.abs(this.cp) < 0.004) this.cp = 0; }
        if (sk === 8) vo *= (1 + Math.sin(this.lf) * 0.08 * se) * (1 - 0.45 * (this.sbv || 0) * se);
      }
      this.an += (this.rnd() - this.an) * 0.55;
      const asp = this.an * ah * (av > 0.05 ? (ph < oq ? 1 : 0.3) : 1) * 0.5 * (1 - sc * 0.5) + (gr > 0 && ph < 0.06 ? this.rnd() * gr * 0.25 * av : 0) + fn2;
      let x = vo + asp;
      let y0 = (x - Z[3] * Z[5] - Z[4] * Z[6]) / Z[2];
      if (this.zf < 1) { const Zo = this.Zo, yo = (x - Zo[3] * Z[5] - Zo[4] * Z[6]) / Zo[2]; y0 = yo + (y0 - yo) * this.zf; this.zf = Math.min(1, this.zf + 1 / (0.008 * sr)); }
      Z[6] = Z[5]; Z[5] = x; x = y0;
      const pp = np[2] * x + np[3] * np[5] + np[4] * np[6]; np[6] = np[5]; np[5] = pp; x = pp;
      for (let j = 0; j < 5; j++) { const r = R[j], y = r[2] * x + r[3] * r[5] + r[4] * r[6]; r[6] = r[5]; r[5] = y; x = y; }
      const fn = this.rnd(), e = fn * af;
      const s1 = H1[8] * (e - this.e2) + H1[3] * H1[5] + H1[4] * H1[6]; H1[6] = H1[5]; H1[5] = s1;
      const s2 = H2[8] * (e - this.e2) + H2[3] * H2[5] + H2[4] * H2[6]; H2[6] = H2[5]; H2[5] = s2; this.e2 = this.e1; this.e1 = e;
      let sf = s1 + s2 * 0.4; this.l1 += (1 - this.kl) * (sf - this.l1); sf -= this.l1; this.l2 += (1 - this.kl) * (sf - this.l2); sf -= this.l2;
      this.hp = khp * this.hp + (1 - khp) * fn; const hs = (fn - this.hp) * ab;
      this.u1 = khi * this.u1 + (1 - khi) * vc; this.u2 = khi * this.u2 + (1 - khi) * (vc - this.u1); const top = (vc - this.u1 - this.u2) * (1 - sc * 0.6);
      let y = x * 0.05 + top * 0.04, hiss = sf * 0.5 + hs * 0.3;
      if (me > 0.001) { this.pr += f * 2.414 / sr; if (this.pr > 1) this.pr -= 1; y = y * (1 - 0.45 * me) + y * Math.sin(6.2832 * this.pr) * me * 0.9;
        const D = Math.max(8, Math.min(4000, Math.round(sr / (f * 2.76)))), cb = this.cb; y += cb[(this.ci - D + 4096) & 4095] * me * 0.55; cb[this.ci] = y; this.ci = (this.ci + 1) & 4095; }
      if (sc > 0.01) { const d2 = 1 + sc * (0.5 + dv); y = Math.tanh(y * d2 * 5) / (5 * d2) * (1 + sc * SK[9]); hiss *= 1 - 0.55 * Math.min(1, sc * 1.2); }
      y += hiss;
      if (sc > 0.01) y = Math.tanh(y * 2.6) / 2.6 * (1 + sc * 0.15);
      if (gr > 0.01) y = Math.tanh(y * (1 + gr * 3)) / (1 + gr * 1.5);
      o[n] = y * gg;
      if (Math.abs(vc) + Math.abs(asp) + Math.abs(e) + Math.abs(hs) > 1e-6) this.quiet = 0; else this.quiet++;
    }
    for (let c = 1; c < outs[0].length; c++) outs[0][c].set(o);
    return true;
  }
}
registerProcessor('nb-sing', Sing);
class Meter extends AudioWorkletProcessor {
  constructor() { super(); live(this); const fs = sampleRate;
    let f0 = 1681.974450955533, G = 3.999843853973347, Q = 0.7071752369554196, K = Math.tan(Math.PI * f0 / fs), Vh = Math.pow(10, G / 20), Vb = Math.pow(Vh, 0.4996667741545416), a0 = 1 + K / Q + K * K;
    this.s1 = [(Vh + Vb * K / Q + K * K) / a0, 2 * (K * K - Vh) / a0, (Vh - Vb * K / Q + K * K) / a0, 2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0];
    f0 = 38.13547087602444; Q = 0.5003270373238773; K = Math.tan(Math.PI * f0 / fs); a0 = 1 + K / Q + K * K;
    this.s2 = [1, -2, 1, 2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0];
    const H = new Float64Array(48); for (let m = 0; m < 48; m++) { const x = (m - 23.5) / 4, w = 0.42 - 0.5 * Math.cos(2 * Math.PI * (m + 0.5) / 48) + 0.08 * Math.cos(4 * Math.PI * (m + 0.5) / 48); H[m] = (x === 0 ? 1 : Math.sin(Math.PI * x * 0.92) / (Math.PI * x)) * w; }
    this.ph = [0, 1, 2, 3].map(p => { const a = new Float64Array(12); let t = 0; for (let j = 0; j < 12; j++) { a[j] = H[4 * j + p]; t += a[j]; } for (let j = 0; j < 12; j++) a[j] /= t; return a; });
    this.hx = [new Float64Array(12), new Float64Array(12)]; this.hi = 0;
    this.z = new Float64Array(16); this.blk = Math.round(fs / 10); this.bn = 0; this.bs = 0; this.done = [];
    const w0 = 2 * Math.PI * 150 / fs, al = Math.sin(w0) / (2 * 0.707), c = Math.cos(w0), b0 = 1 + al; this.lp = [(1 - c) / 2 / b0, (1 - c) / b0, (1 - c) / 2 / b0, -2 * c / b0, (1 - al) / b0]; this.lz = new Float64Array(8);
    this.post = Math.round(fs / 40); this.pn = 0; this.reset();
  }
  reset() { this.A = { pL: 0, pR: 0, tL: 0, tR: 0, sL: 0, sR: 0, aL: 0, aR: 0, lr: 0, mm: 0, ss: 0, ll: 0, rr: 0, bl: 0, bll: 0, brr: 0, n: 0 }; }
  bq(c, z, o, x) { const y = c[0] * x + c[1] * z[o] + c[2] * z[o + 1] - c[3] * z[o + 2] - c[4] * z[o + 3]; z[o + 1] = z[o]; z[o] = x; z[o + 3] = z[o + 2]; z[o + 2] = y; return y; }
  process(ins) { if (this.dead) return false;
    const i0 = ins[0], N = 128, A = this.A, z = this.z, s1 = this.s1, s2 = this.s2, P = this.ph, lz = this.lz, lp = this.lp;
    if (!i0 || !i0.length) { this.pn += N; if (this.pn >= this.post) { this.pn = 0; this.port.postMessage({ idle: 1 }); } return true; }
    const L = i0[0], R = i0[1] || i0[0];
    for (let n = 0; n < L.length; n++) { const l = L[n], r = R[n];
      const kl = this.bq(s2, z, 4, this.bq(s1, z, 0, l)), kr = this.bq(s2, z, 12, this.bq(s1, z, 8, r)); this.bs += kl * kl + kr * kr;
      if (++this.bn >= this.blk) { this.done.push(this.bs / this.blk); this.bs = 0; this.bn = 0; }
      const al = l < 0 ? -l : l, ar = r < 0 ? -r : r; if (al > A.pL) A.pL = al; if (ar > A.pR) A.pR = ar;
      A.sL += l * l; A.sR += r * r; A.aL += al; A.aR += ar; A.lr += l * r; const m = l + r, d = l - r; A.mm += m * m; A.ss += d * d;
      const hL = this.hx[0], hR = this.hx[1], hi = this.hi = (this.hi + 11) % 12; hL[hi] = l; hR[hi] = r;
      for (let p = 0; p < 4; p++) { const c = P[p]; let yl = 0, yr = 0; for (let j = 0; j < 12; j++) { const k = (hi + j) % 12; yl += c[j] * hL[k]; yr += c[j] * hR[k]; } if (yl < 0) yl = -yl; if (yr < 0) yr = -yr; if (yl > A.tL) A.tL = yl; if (yr > A.tR) A.tR = yr; }
      const bl = this.bq(lp, lz, 0, l), br = this.bq(lp, lz, 4, r); A.bl += bl * br; A.bll += bl * bl; A.brr += br * br; }
    A.n += L.length; this.pn += L.length;
    if (this.pn >= this.post) { this.pn = 0; A.b = this.done; this.done = []; this.port.postMessage(A); this.reset(); }
    return true;
  }
}
registerProcessor('nb-meter', Meter);
class Acid extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    const k = (name, def, mn, mx) => ({ name, defaultValue: def, minValue: mn, maxValue: mx, automationRate: 'k-rate' });
    return [BEND, { name: 'freq', defaultValue: 110, minValue: 10, maxValue: 8000, automationRate: 'a-rate' }, { name: 'gate', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
      k('trig', 0, 0, 1e9), k('acc', 0, 0, 1), k('cut', 300, 20, 12000), k('res', 0.6, 0, 1), k('env', 0.6, 0, 1), k('dec', 0.4, 0, 1), k('wave', 0, 0, 1), k('accamt', 0.5, 0, 1), k('drive', 0.3, 0, 1), k('sub', 0, 0, 1), k('vel', 0.8, 0, 1.5)];
  }
  constructor() { super(); live(this); this.ph = 0; this.sp = 0; this.meg = 0; this.veg = 0; this.vt = 0; this.cap = 0; this.ac = 0; this.lt = -1; this.s = new Float64Array(4); this.g = 0.1; this.n = 0; this.hp = 0; this.hx = 0; this.quiet = 0; }
  blep(t, dt) { if (t < dt) { t /= dt; return t + t - t * t - 1; } if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; } return 0; }
  dio(x, g0, k) {
    const s = this.s, g = Math.tan(Math.min(1.5, Math.atan(g0) * 1.42)), G4 = 0.5 * g / (1 + g), G3 = 0.5 * g / (1 + g - 0.5 * g * G4), G2 = 0.5 * g / (1 + g - 0.5 * g * G3), G1 = g / (1 + g - g * G2), GM = G4 * G3 * G2 * G1, A = g / (1 + g);
    const b1 = 1 / (1 + g - g * G2), b2 = 1 / (1 + g - 0.5 * g * G3), b3 = 1 / (1 + g - 0.5 * g * G4), b4 = 1 / (1 + g), K = Math.pow((2 - k) / 1.96, 1.3) * 19;
    const fo4 = b4 * s[3], fb3 = fo4, fo3 = b3 * (s[2] + fb3 * 0.5 * g), fb2 = fo3, fo2 = b2 * (s[1] + fb2 * 0.5 * g), fb1 = fo2, fo1 = b1 * (s[0] + fb1 * g);
    const sig = G4 * G3 * G2 * fo1 + G4 * G3 * fo2 + G4 * fo3 + fo4;
    let u = Math.tanh(((1 + K * 0.3) * x - K * sig) / (1 + K * GM));
    let xn = u * (1 + G1 * G2) + fb1 + G2 * fo1, vn = (xn - s[0]) * A, o = vn + s[0]; s[0] = vn + o;
    xn = o * (1 + G2 * G3) + fb2 + G3 * fo2; vn = (0.5 * xn - s[1]) * A; o = vn + s[1]; s[1] = vn + o;
    xn = o * (1 + G3 * G4) + fb3 + G4 * fo3; vn = (0.5 * xn - s[2]) * A; o = vn + s[2]; s[2] = vn + o;
    xn = o; vn = (0.5 * xn - s[3]) * A; o = vn + s[3]; s[3] = vn + o;
    return o * 2;
  }
  process(ins, outs, P) { if (this.dead) return false; const abm = bendOf(P);
    const y = outs[0][0], N = y.length, sr = sampleRate, F = P.freq, Gt = P.gate;
    const tr = P.trig[0], res = P.res[0], env = P.env[0], cut = P.cut[0], wave = P.wave[0], aa = P.accamt[0], dr = P.drive[0], sub = P.sub[0], vel = P.vel[0];
    if (tr === this.lt && Gt[0] < 0.5 && Gt[Gt.length - 1] < 0.5 && this.veg < 1e-6) { y.fill(0); this.ph = (this.ph + F[0] / sr * N) % 1; this.sp = (this.sp + F[0] / sr * N * 0.5) % 1; this.meg *= Math.pow(0.999, N); return true; }
    if (tr !== this.lt) { this.lt = tr; this.ac = P.acc[0] > 0.5 ? 1 : 0; this.meg = 1; this.vt = 1; this.quiet = 0; }
    const td = this.ac ? 0.2 : 0.2 + Math.pow(P.dec[0], 1.5) * 2.3, md = Math.exp(-4.6 / (td * sr)), ta = 0.03 + res * 0.12, ca = 1 - Math.exp(-1 / (ta * sr));
    const vd = Math.exp(-1 / (1.6 * sr)), vr = 1 - Math.exp(-1 / (0.0028 * sr)), vf = 1 - Math.exp(-1 / (0.01 * sr)), k = 2 - 1.96 * Math.min(0.995, res * 0.97);
    const dg = 1 + dr * 7, dn = 1 / Math.tanh(dg * 0.6), hpc = 1 - Math.exp(-2 * Math.PI * 25 / sr);
    for (let n = 0; n < N; n++) {
      const f = (F.length > 1 ? F[n] : F[0]) * abm, gate = (Gt.length > 1 ? Gt[n] : Gt[0]) > 0.5, dt = f / sr;
      this.ph += dt; if (this.ph >= 1) this.ph -= 1; this.sp += dt * 0.5; if (this.sp >= 1) this.sp -= 1;
      const saw = 2 * this.ph - 1 - this.blep(this.ph, dt), pw = 0.45 + 0.26 * Math.min(1, Math.max(0, (90 - f) / 50));
      let p2 = this.ph - pw; if (p2 < 0) p2 += 1; const sq = (this.ph < pw ? 1 : -1) + this.blep(this.ph, dt) - this.blep(p2, dt);
      const subv = this.sp < 0.5 ? 1 : -1;
      const osc = saw * (1 - wave) + sq * wave * 0.85 + subv * sub * 0.5;
      this.meg *= md; this.cap += ((this.ac ? this.meg : 0) - this.cap) * ca;
      if (gate) { this.veg += (this.vt - this.veg) * vr; this.vt *= vd; } else { this.veg += (0 - this.veg) * vf; this.vt = 0; }
      if ((n & 3) === 0) { const fc = Math.min(sr * 0.45, cut * Math.pow(2, env * 4.6 * this.meg + aa * 3.2 * this.cap * (0.5 + env))); this.g = Math.tan(Math.PI * fc / sr); }
      let o = this.dio(osc * 0.7, this.g, k);
      o *= this.veg * vel * (1 + this.ac * aa * (0.6 + this.meg * 0.6));
      o = Math.tanh(o * dg * 0.6) * dn;
      this.hp += (o - this.hp) * hpc; y[n] = (o - this.hp) * 0.95;
    }
    return true;
  }
}
registerProcessor('nb-acid', Acid);
class Tex extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    const k = (name, def, mn, mx) => ({ name, defaultValue: def, minValue: mn, maxValue: mx, automationRate: 'k-rate' });
    return [k('kind', 0, 0, 5), k('tone', 0.5, 0, 1), k('dens', 0.5, 0, 1), k('motion', 0.4, 0, 1), k('pitch', 0, 0, 8000)];
  }
  constructor(o) { super(); live(this); const p = (o && o.processorOptions) || {}; this.len = p.len;
    this.rs = (p.seed >>> 0) || 777; this.end = p.end || 1e9; this.start = p.start || 0; this.ev = []; this.g = 0.3; this.tg = 0.3; this.gt = 0; this.fl = 0.5; this.ft = 0.5;
    this.z = [new Float64Array(8), new Float64Array(8)]; this.lp = [0, 0, 0, 0]; this.hp = [0, 0]; this.rum = 0; this.n = 0; this.gr = 0; this.gg = 0; this.gc = 0; this.bf = 3000; this.wp = 0; this.wT = 0.5; this.tb = 0; }
  rnd() { this.rs = this.rs * 16807 % 2147483647; return this.rs / 2147483647; }
  bp(x, z, j, f, q) { const g = Math.tan(Math.PI * Math.min(f, sampleRate * 0.45) / sampleRate), k = 1 / q, a1 = 1 / (1 + g * (g + k)), a2 = g * a1, a3 = g * a2, v3 = x - z[j + 1], v1 = a1 * z[j] + a2 * v3, v2 = z[j + 1] + a2 * z[j] + a3 * v3; z[j] = 2 * v1 - z[j]; z[j + 1] = 2 * v2 - z[j + 1]; return v1; }
  process(ins, outs, P) { if (this.dead || currentTime > this.end) return false;
    if (currentTime + 0.003 < this.start) { for (const ch of outs[0]) ch.fill(0); return true; }
    const L = outs[0][0], R = outs[0][1] || outs[0][0], N = L.length, sr = sampleRate, kd = Math.round(P.kind[0]), tone = P.tone[0], dens = P.dens[0], mo = P.motion[0];
    for (let n = 0; n < N; n++) {
      const w0 = this.rnd() * 2 - 1, w1 = this.rnd() * 2 - 1; let l = 0, r = 0;
      if (kd === 0) {
        this.hp[0] += (w0 - this.hp[0]) * 0.14; this.hp[1] += (w1 - this.hp[1]) * 0.14; l += (w0 - this.hp[0]) * 0.02 * (0.3 + tone); r += (w1 - this.hp[1]) * 0.02 * (0.3 + tone);
        this.rum += (w0 - this.rum) * 0.0008; const rm = this.rum * 0.6 * mo * (1 + 0.5 * Math.sin(2 * Math.PI * 0.55 * this.n / sr)); l += rm; r += rm;
        if (this.rnd() < (2 + dens * 90) / sr && this.ev.length < 32) { const a = Math.pow(this.rnd(), 3.5) * (this.rnd() < 0.06 ? 1.6 : 0.6), pn = this.rnd(); this.ev.push({ a, d: Math.exp(-1 / (sr * (0.00015 + this.rnd() * 0.0006))), pn }); }
      } else if (kd === 1) {
        if (--this.gt <= 0) { this.tg = 0.15 + this.rnd() * 0.85; this.gt = Math.floor(sr * (1 + (1 - mo) * 4 * this.rnd())); }
        this.g += (this.tg - this.g) * (0.6 / sr); this.fl += (this.g - this.fl) * (0.8 / sr); const g = this.fl, fc = 150 * Math.pow(12, tone) * (0.6 + g * 0.9);
        this.lp[0] += (w0 - this.lp[0]) * 0.012; this.lp[1] += (w1 - this.lp[1]) * 0.012; l += this.lp[0] * 2.2 * g; r += this.lp[1] * 2.2 * g;
        l += this.bp(w0, this.z[0], 0, fc, 0.5 + g * 1.2) * (0.2 + g) * 1.6 + this.bp(w0, this.z[0], 2, fc * 2.7, 0.9) * g * 0.4;
        r += this.bp(w1, this.z[1], 0, fc * 1.07, 0.5 + g * 1.2) * (0.2 + g) * 1.6 + this.bp(w1, this.z[1], 2, fc * 2.5, 0.9) * g * 0.4;
        const wh = Math.max(0, g - 0.7) * 2; if (wh > 0) { const s = this.bp(w0 + w1, this.z[0], 4, fc * 3.3 * (0.95 + g * 0.1), 18) * wh * 0.8; l += s; r += s * 0.8; }
      } else if (kd === 2) {
        if (!this.rin) { this.rin = 1; this.g = 1; this.tg = 1; this.rb = [0, 0, 0, 0, 0, 0]; }
        if (--this.gt <= 0) { this.tg = 1 + (this.rnd() - 0.5) * (0.2 + mo * 0.8); this.gt = Math.floor(sr * (0.5 + this.rnd() * 2)); }
        this.g += (this.tg - this.g) * (1.5 / sr); const B = this.rb, ch = 1 - Math.exp(-6.2831853 * 180 / sr), cl = 1 - Math.exp(-6.2831853 * (3000 + tone * 4000) / sr), bg = 0.21 * (0.35 + dens * 0.65) * this.g;
        B[0] += (w0 - B[0]) * ch; B[1] += (w0 - B[0] - B[1]) * cl; B[2] += (B[1] - B[2]) * cl; B[3] += (w1 - B[3]) * ch; B[4] += (w1 - B[3] - B[4]) * cl; B[5] += (B[4] - B[5]) * cl;
        l += B[2] * bg; r += B[5] * bg;
        if (this.rnd() < (6 + dens * 70) / sr && this.ev.length < 64) { const f = (1000 + Math.pow(this.rnd(), 1.5) * 3500) * (0.8 + tone * 0.4), rr = Math.exp(-Math.PI * f * 0.9 / sr), a = (0.012 + Math.pow(this.rnd(), 5) * 0.09) * (0.6 + dens * 0.6);
          this.ev.push({ pat: 1, a, d: Math.exp(-1 / (sr * (0.0008 + this.rnd() * 0.0025))), b1: 2 * rr * Math.cos(6.2831853 * f / sr), b2: -rr * rr, gg: 1 - rr, y1: 0, y2: 0, pn: this.rnd() });
          if (this.rnd() < tone * 0.06) { const fb = 1000 + this.rnd() * 2000; this.ev.push({ f: fb, d: 0.13 * fb + 0.0072 * Math.pow(fb, 1.5), a: a * 0.35, t: 0, ph: 0, pn: this.rnd(), bub: 1 }); } }
      } else if (kd === 5) {
        if (!this.cin) { this.cin = 1; this.cb = []; const fb = 1150 * Math.pow(2, (tone - 0.5) * 1.6), RT = [0.7, 1, 1.08, 1.32, 1.88, 2.69, 3.36, 3.63], AM = [-12, 0, -4, -6, -6, -3, -3, -11];
          for (let b = 0; b < 4; b++) { const sc = 1 + (this.rnd() - 0.5) * 0.08, M = [];
            for (let m = 0; m < 8; m++) { const f = Math.min(sr * 0.45, fb * RT[m] * sc * (1 + (this.rnd() - 0.5) * 0.02)), tau = (0.05 + this.rnd() * 0.04) / (1 + m * 0.18), rr = Math.exp(-1 / (tau * sr));
              M.push({ b1: 2 * rr * Math.cos(6.2831853 * f / sr), b2: -rr * rr, g: Math.pow(10, AM[m] / 20) * Math.sin(6.2831853 * f / sr) * 0.45, y1: 0, y2: 0 }); }
            this.cb.push({ M, pi: 0, pn: 0, pa: 0, pan: b / 3 }); }
          this.cj = 0; this.cjt = 0; this.ct = 0; }
        this.ct += 1 / sr; const ln = this.len || 0.6, A = Math.min(1, this.ct / 0.008) * Math.exp(-this.ct / (0.15 + ln * 0.45));
        if (--this.cjt <= 0) { this.cj = 0.35 + this.rnd() * 0.9; this.cjt = Math.floor(sr * (0.04 + this.rnd() * 0.11)); } this.cj *= Math.exp(-1 / (0.03 * sr));
        if (this.rnd() < (20 + dens * 90) * A * (0.15 + this.cj) / sr) { const bk = this.cb[Math.floor(this.rnd() * 4)]; bk.pn = Math.max(2, Math.round(sr * (0.00005 + this.rnd() * 0.00015) * (1.4 - tone * 0.6))); bk.pi = 0; bk.pa = (0.02 + Math.pow(this.rnd(), 3) * 0.6) * Math.sqrt(A);
          if (this.rnd() < 0.05 * A && this.ev.length < 32) { const f = 150 + this.rnd() * 120, rr = Math.exp(-Math.PI * f * 0.6 / sr); this.ev.push({ pat: 1, a: bk.pa * 0.25, d: Math.exp(-1 / (sr * 0.006)), b1: 2 * rr * Math.cos(6.2831853 * f / sr), b2: -rr * rr, gg: 1 - rr, y1: 0, y2: 0, pn: 0.5 }); } }
        for (const bk of this.cb) { let x = 0; if (bk.pi < bk.pn) { x = Math.sin(Math.PI * (bk.pi + 0.5) / bk.pn) * bk.pa; bk.pi++; } let o = 0;
          for (const q of bk.M) { const y = q.g * x + q.b1 * q.y1 + q.b2 * q.y2; q.y2 = q.y1; q.y1 = y; o += y; }
          l += o * (1 - bk.pan * 0.7) * 0.5; r += o * (0.3 + bk.pan * 0.7) * 0.5; }
      } else if (kd === 4) {
        if (this.sT == null || --this.sT <= 0) { this.sT = Math.floor(sr * (0.28 + (1 - mo) * 0.45) * (0.75 + this.rnd() * 0.5)); this.sa = 0.6 + this.rnd() * 0.4; this.stt = 0; this.sdk = 0.16 + this.rnd() * 0.14; this.sat = 0.035 + this.rnd() * 0.04; }
        this.stt += 1 / sr; const be = this.sa * Math.min(1, Math.pow(this.stt / this.sat, 2)) * Math.exp(-Math.max(0, this.stt - this.sat) / this.sdk);
        const B = this.sb || (this.sb = [0, 0, 0, 0]), lc = 1 - Math.exp(-6.2831853 * 1800 / sr), hc = 1 - Math.exp(-6.2831853 * 300 / sr);
        B[0] += (w0 - B[0]) * lc; B[1] += (B[0] - B[1]) * hc; B[2] += (w1 - B[2]) * lc; B[3] += (B[2] - B[3]) * hc;
        l += (B[0] - B[1]) * be * 0.15; r += (B[2] - B[3]) * be * 0.15;
        if (this.rnd() < (250 + dens * 900) * be / sr && this.ev.length < 256) {
          const r0 = 0.0007 * Math.pow(7, Math.pow(this.rnd(), 1.4)), f0 = 3 / r0 * (0.75 + tone * 0.5), d = 0.13 * f0 + 0.0072 * Math.pow(f0, 1.5), ek = Math.pow(this.rnd(), 2.5);
          this.ev.push({ f: f0, d, a: (0.2 + ek * 1.6) * Math.sqrt(d / 1000) * 0.3 * be, t: 0, ph: 0, pn: this.rnd(), bub: 1 }); }
        if (this.rnd() < 1.5 * be / sr && this.ev.length < 256) this.ev.push({ f: 180 + this.rnd() * 220, d: 25 + this.rnd() * 10, a: 0.12 * be, t: 0, ph: 0, pn: 0.5, bub: 1 });
      } else {
        if (--this.gt <= 0) { this.ft = 0.2 + this.rnd() * 0.8; this.gt = Math.floor(sr * (0.05 + this.rnd() * 0.25)); }
        this.fl += (this.ft - this.fl) * (20 / sr);
        this.lp[0] += (w0 - this.lp[0]) * (0.004 + tone * 0.01); this.lp[1] += (w1 - this.lp[1]) * (0.004 + tone * 0.01);
        this.lp[2] += (this.lp[0] - this.lp[2]) * 0.02; this.lp[3] += (this.lp[1] - this.lp[3]) * 0.02;
        l += this.lp[2] * 9 * this.fl; r += this.lp[3] * 9 * this.fl;
        this.tb = (this.tb || 0) + ((this.rnd() * 2 - 1) - (this.tb || 0)) * (60 / sr); const lap = Math.max(0, 0.5 + this.tb * 4) * this.fl;
        l += this.bp(w0, this.z[0], 0, 380 * (0.7 + tone * 0.6), 0.8) * lap * 0.9; r += this.bp(w1, this.z[1], 0, 420 * (0.7 + tone * 0.6), 0.8) * lap * 0.9;
        this.hp[0] += (w0 - this.hp[0]) * 0.5; l += (w0 - this.hp[0]) * 0.03 * this.fl * (0.5 + tone); this.hp[1] += (w1 - this.hp[1]) * 0.5; r += (w1 - this.hp[1]) * 0.03 * this.fl * (0.5 + tone);
        if (this.rnd() < (1 + dens * 45) / sr && this.ev.length < 24) { const big = this.rnd() < 0.12; this.ev.push({ a: (big ? 1 : 0.25 + this.rnd() * 0.4), d: Math.exp(-1 / (sr * (0.001 + this.rnd() * (big ? 0.008 : 0.003)))), pn: this.rnd(), bf: 1000 + this.rnd() * 5000, zz: new Float64Array(2) });
          if (big && this.rnd() < 0.5) this.ev.push({ a: 0.5, d: Math.exp(-1 / (sr * 0.002)), pn: this.rnd(), bf: 2500, zz: new Float64Array(2), wait: Math.floor(sr * (0.006 + this.rnd() * 0.02)) }); }
      }
      for (let i = this.ev.length - 1; i >= 0; i--) { const e = this.ev[i]; if (e.wait > 0) { e.wait--; continue; }
        let v;
        if (e.tick) { const y = e.n / (e.N - 1); v = e.a * (1 - 4 * (y - 0.5) * (y - 0.5)); if (++e.n >= e.N) { this.ev.splice(i, 1); continue; } }
        else if (e.drop) { e.t += 1 / sr; if (e.t > e.life) { this.ev.splice(i, 1); continue; } const u = e.t / e.life; e.ph += e.f * Math.exp(e.up * e.t) / sr; v = Math.sin(6.2831853 * e.ph) * e.a * Math.min(1, e.t / 0.001) * (1 - u) * (1 - u); if (e.clk && e.t < 0.002) v += w0 * e.a * (1 - e.t / 0.002) * 0.6; }
        else if (e.pat) { let xi = w0; if (e.hp) { xi = w0 - e.x1; e.x1 = w0; } const y = e.gg * xi * e.a + e.b1 * e.y1 + e.b2 * e.y2; e.y2 = e.y1; e.y1 = y; v = y * 2; e.a *= e.d; if (e.a < 1e-4) { this.ev.splice(i, 1); continue; } }
        else if (e.bub) { e.t += 1 / sr; const f = e.f * (1 + 0.1 * e.d * e.t); e.ph += f / sr; v = Math.sin(2 * Math.PI * e.ph) * e.a * Math.exp(-e.d * e.t); if (e.t * e.d > 7) { this.ev.splice(i, 1); continue; } }
        else if (kd === 3) { v = this.bp(w0 * e.a, e.zz, 0, e.bf, 1.2) * 3; e.a *= e.d; if (e.a < 1e-4) { this.ev.splice(i, 1); continue; } }
        else { v = w0 * e.a; e.a *= e.d; if (e.a < 1e-4) { this.ev.splice(i, 1); continue; } }
        l += v * (1 - e.pn * 0.8); r += v * (0.2 + e.pn * 0.8);
      }
      L[n] = l; if (R !== L) R[n] = r; this.n++;
    }
    return true;
  }
}
registerProcessor('nb-tex', Tex);
class Bottle extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [BEND, { name: 'press', defaultValue: 0, minValue: 0, maxValue: 1.5, automationRate: 'a-rate' }, { name: 'freq', defaultValue: 440, minValue: 20, maxValue: 6000, automationRate: 'k-rate' }, { name: 'noise', defaultValue: 0.3, minValue: 0, maxValue: 1, automationRate: 'k-rate' }]; }
  constructor(o) { super(); live(this); const p = (o && o.processorOptions) || {}; this.rs = (p.seed >>> 0) || 99; this.end = p.end || 1e9; this.start = p.start || 0; this.y1 = 0; this.y2 = 0; this.x1v = 0; this.x2v = 0; this.dx = 0; this.dy = 0; this.vp = 0; }
  process(ins, outs, P) { if (this.dead || currentTime > this.end) return false;
    if (currentTime + 0.003 < this.start) { for (const ch of outs[0]) ch.fill(0); return true; }
    const y = outs[0][0], N = y.length, sr = sampleRate, Pr = P.press, f = Math.min(sr * 0.45, P.freq[0] * bendOf(P)), ng = P.noise[0] * 20, r = 0.999;
    const a1 = 2 * r * Math.cos(2 * Math.PI * f / sr), a2 = r * r, b0 = 0.5 - 0.5 * r * r;
    for (let n = 0; n < N; n++) {
      const bp = Pr.length > 1 ? Pr[n] : Pr[0]; this.rs = this.rs * 16807 % 2147483647; this.vp += 5.9 / sr; if (this.vp > 1) this.vp -= 1;
      const rp = ng * (this.rs / 1073741823.5 - 1) * bp * (1 + 0.04 * Math.sin(6.2831853 * this.vp));
      const diff = bp - this.y1; let jet = diff * (diff * diff - 1); if (jet > 1) jet = 1; else if (jet < -1) jet = -1;
      const x = bp + rp - jet * diff, o = b0 * x + a1 * this.y1 - a2 * this.y2 - b0 * this.x2v; this.x2v = this.x1v; this.x1v = x; this.y2 = this.y1; this.y1 = o;
      const d = diff - this.dx + 0.995 * this.dy; this.dx = diff; this.dy = d; y[n] = d * 0.2;
    }
    return true;
  }
}
registerProcessor('nb-bottle', Bottle);
class Dco extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    const k = (name, def, mn, mx) => ({ name, defaultValue: def, minValue: mn, maxValue: mx, automationRate: 'k-rate' });
    return [BEND, { name: 'freq', defaultValue: 220, minValue: 10, maxValue: 12000, automationRate: 'a-rate' }, k('saw', 1, 0, 1), k('pulse', 0, 0, 1), k('psaw', 0, 0, 1), k('sub', 0, 0, 1), k('noise', 0, 0, 1),
      k('pw', 0.5, 0.05, 0.95), k('pwm', 0, 0, 1), k('pwmr', 0.6, 0.02, 12), k('uni', 1, 1, 4), k('det', 0, 0, 100), k('spread', 0.6, 0, 1)];
  }
  constructor(o) { super(); live(this); const p = (o && o.processorOptions) || {}; this.rs = (p.seed >>> 0) || 4242; this.start = p.start || 0; this.end = p.end || 1e9;
    { const k = this.port.onmessage; this.port.onmessage = e => { if (e.data && e.data.end) this.end = e.data.end; else k(e); }; }
    this.ph = [0, 0, 0, 0].map(() => this.rnd()); this.lf = this.rnd(); this.sp = 0; }
  rnd() { this.rs = this.rs * 16807 % 2147483647; return this.rs / 2147483647; }
  blep(t, dt) { if (t < dt) { t /= dt; return t + t - t * t - 1; } if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; } return 0; }
  process(ins, outs, P) { if (this.dead || currentTime > this.end) return false; const dbm = bendOf(P);
    const L = outs[0][0], R = outs[0][1] || outs[0][0], N = L.length, sr = sampleRate;
    if (currentTime + 0.003 < this.start) { L.fill(0); if (R !== L) R.fill(0); return true; }
    const F = P.freq, sw = P.saw[0], pu = P.pulse[0], ps = P.psaw[0], sb = P.sub[0], nz = P.noise[0], pw0 = P.pw[0], pwm = P.pwm[0], lr = P.pwmr[0] / sr, U = Math.max(1, Math.min(4, Math.round(P.uni[0]))), det = P.det[0], spr = P.spread[0];
    const OF = [[0], [-1, 1], [-1, 0, 1], [-1, -0.33, 0.33, 1]][U - 1], g = 1 / Math.sqrt(U);
    for (let n = 0; n < N; n++) {
      const f = (F.length > 1 ? F[n] : F[0]) * dbm; this.lf += lr; if (this.lf >= 1) this.lf -= 1; let l = 0, r = 0;
      for (let u = 0; u < U; u++) {
        const fu = f * Math.pow(2, OF[u] * det / 1200), dt = Math.min(0.45, fu / sr); let ph = this.ph[u] + dt; if (ph >= 1) ph -= 1; this.ph[u] = ph;
        let lfu = this.lf + u * 0.25; if (lfu >= 1) lfu -= 1; const tri = lfu < 0.5 ? lfu * 4 - 1 : 3 - lfu * 4, pw = Math.max(0.05, Math.min(0.95, pw0 + pwm * 0.42 * tri));
        let v = 0;
        if (sw > 0) v += sw * (2 * ph - 1 - this.blep(ph, dt));
        if (pu > 0) { let p2 = ph - pw; if (p2 < 0) p2 += 1; v += pu * ((ph < pw ? 1 : -1) + this.blep(ph, dt) - this.blep(p2, dt)) * 0.8; }
        if (ps > 0) { let p2 = ph + pw; if (p2 >= 1) p2 -= 1; v += ps * 0.5 * ((2 * ph - 1 - this.blep(ph, dt)) + (2 * p2 - 1 - this.blep(p2, dt))); }
        const pn = U > 1 ? OF[u] * spr : 0; l += v * g * (1 - pn) * 0.7071; r += v * g * (1 + pn) * 0.7071;
      }
      if (sb > 0) { const dt = Math.min(0.45, f * 0.5 / sr); this.sp += dt; if (this.sp >= 1) this.sp -= 1; let p2 = this.sp - 0.5; if (p2 < 0) p2 += 1; const s = ((this.sp < 0.5 ? 1 : -1) + this.blep(this.sp, dt) - this.blep(p2, dt)) * sb * 0.7; l += s; r += s; }
      if (nz > 0) { const w = (this.rnd() * 2 - 1) * nz * 0.5; l += w; r += w; }
      L[n] = l; if (R !== L) R[n] = r;
    }
    return true;
  }
}
registerProcessor('nb-dco', Dco);
const HGAIN = 0.8;
class Moan extends AudioWorkletProcessor {
  constructor(o) { super(); live(this); const p = (o && o.processorOptions) || {}; this.port.onmessage = e => { if (e.data === 'kill') this.dead = true; else if (e.data && e.data.end) this.stop = Math.min(this.stop, e.data.end); };
    this.rs = (p.seed >>> 0) || 7; this.start = p.start || 0; this.f0 = p.f0 || 262; this.k = p.kind | 0; this.h = p.heat || 0; this.air = p.air == null ? 0.5 : p.air;
    this.vw = p.vowel | 0; this.sc = p.scoop || 0; this.fl = p.fall || 0; this.sh = p.shake || 0; this.cat = p.cat || 0; this.vel = p.vel == null ? 0.8 : p.vel; this.att = p.att || 0.02;
    this.fs = 1 + (this.r() - 0.5) * 0.06; this.ev = []; this.plan(p.dur || 1); let last = 0; for (const e of this.ev) last = Math.max(last, e.t0 + e.L); this.stop = this.start + last + 0.25;
    this.ph = 0; this.T = 100; this.oq = 0.7; this.amp = 0; this.pv = 0; this.ip = 0; this.cP = 0; this.cAV = 0; this.cAH = 0; this.cIN = 0; this.cM = 1; this.cFry = 0; this.cOQ = 0.7; this.cTi = 0.5;
    this.sAV = 0; this.sAH = 0; this.sIN = 0; this.d1 = 0; this.d2 = 0; this.d3 = 0; this.da = 0; this.tr = 0; this.trf = 5.5 + this.r() * 1.5;  this.prevM = 1;
    this.FF = [880, 1450, 2850, 3900, 4900]; this.FB = [200, 200, 250, 300, 350]; this.HT = new Float64Array(49); this.HP = new Float64Array(49); this.R = []; for (let i = 0; i < 5; i++) this.R.push({ a: 0, b: 0, c: 0, y1: 0, y2: 0 }); this.Z = { a: 1, b: 0, c: 0, x1: 0, x2: 0 }; this.I1 = { a: 0, b: 0, c: 0, y1: 0, y2: 0 }; this.I2 = { a: 0, b: 0, c: 0, y1: 0, y2: 0 };
    this.res(this.I1, 1900, 1300); this.res(this.I2, 3600, 1600); this.HB = { a: 0, b: 0, c: 0, y1: 0, y2: 0 }; this.res(this.HB, 5600, 3200); this.lo = 0; this.ipv = 0; this.p0 = 0; this.p1 = 0; this.p2 = 0; this.dcx = 0; this.dcy = 0; this.cx = 0; }
  r() { this.rs = this.rs * 16807 % 2147483647; return this.rs / 2147483647; }
  g() { return (this.r() + this.r() + this.r() + this.r() - 2) * 1.732; }
  res(q, f, bw) { const sr = sampleRate, r = Math.exp(-Math.PI * bw / sr); q.c = -r * r; q.b = 2 * r * Math.cos(2 * Math.PI * Math.min(f, sr * 0.45) / sr); q.a = 1 - q.b - q.c; }
  plan(D) { const h = this.h, r = () => this.r(), E = this.ev, k = this.k, sc = this.sc, fl = this.fl;
    const inh = (t0, L, a) => E.push({ ty: 0, t0, L, a });
    if (k === 1) { let t = 0, base = 0; while (t < D - 0.2) { let L = Math.min(D - t, (0.55 + r() * 0.6) * (1 + h * 0.3)); if (D - t - L < 0.45) L = D - t;
        const rf = r() < 0.3, pk = 1 + r() * 2 + h * 1.5 + base, dr = 3 + fl * 0.4 + r() * 3.5;
        E.push({ ty: 1, t0: t, L, K: rf ? [[0, pk - 2.5 - sc * 0.4], [0.35, pk + 1], [0.75, pk - dr * 0.6], [1, pk - dr]] : [[0, pk - 1.2 - sc * 0.4], [0.1, pk], [0.6, pk - dr * 0.55], [1, pk - dr]],
            rg: false ? [0.15 + r() * 0.4, 0.08 + r() * 0.15] : null, cr: null,
            upk: rf ? 0.35 : 0.1, mc: r() < 0.55 ? 0.06 + r() * 0.12 : 0, me: r() < 0.25, ve: 0.8 + r() * 0.1 });
        t += L; base = (r() - 0.5) * 2.5; if (t < D - 0.5) { let gp = (0.3 + r() * 0.5) * (1 - h * 0.45), li = 0.25 + r() * 0.25 - h * 0.1; inh(t + gp, li, 0.07 + h * 0.08); t += gp + li + 0.05 + r() * 0.1; } } }
    else if (k === 0) { let t = 0; while (t < D - 0.3) { if (D - t > 1.1 && (t > 0 || r() < 0.6)) { let li = 0.32 + r() * 0.25; inh(t, li, 0.1 + h * 0.06); t += li + 0.04; }
        let L = Math.min(D - t, 1.3 + r() * 0.9); if (D - t - L < 1) L = D - t; const lo = -6 - r() * 4 + sc * 0.3; E.push({ ty: 2, t0: t, L, p0: lo + 1.5, p2: lo - 2 - fl * 0.3, av: 0.6 + h * 0.3 + (1 - this.air) * 0.2, uc: 0.06 + r() * 0.06, w: (0.12 + r() * 0.08) / Math.max(0.6, L) }); t += L + 0.05; } }
    else if (k === 2) { let t = 0; while (t < D - 0.2) { let L = Math.min(D - t, 2.5 + r() * 1.5); if (D - t - L < 1) L = D - t;
        E.push({ ty: 3, t0: t, L, p0: -1 - r(), pk: 0.5 + r(), p3: (r() - 0.5) * 1.5, p2: -2 - r() * 2 }); t += L; if (t < D - 0.6) { inh(t + 0.02, 0.35, 0.06); t += 0.42; } } }
  }
  ss(x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }
  kn(K, u) { if (u <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (u <= K[i][0]) { let a = K[i - 1], b = K[i], x = (u - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * (0.5 - 0.5 * Math.cos(Math.PI * x)); } return K[K.length - 1][1]; }
  ctl(tt) { let rough = 0, jump = 0, op = 1, AV = 0, AH = 0, IN = 0, M = this.cM, fry = 0, oq = 0.72, ti = 500, P = this.cP, any = false, sm = this.ss, air = 0.35 + this.air * 0.65, ua = Math.max(0.04, this.att);
    for (let i = this.ip; i < this.ev.length; i++) { const e = this.ev[i]; if (e.t0 > tt) break; if (tt > e.t0 + e.L) { if (i === this.ip) this.ip++; continue; }
      const u = (tt - e.t0) / e.L, L = e.L;
      if (e.ty === 0) { IN += Math.pow(Math.sin(Math.PI * u), 1.3) * e.a; continue; }
      any = true;
      if (e.ty === 1) {
        if (e.rg && u > e.rg[0] && u < e.rg[0] + e.rg[1]) rough = Math.sin(Math.PI * (u - e.rg[0]) / e.rg[1]); if (e.cr && u > e.cr[0] && u < e.cr[0] + e.cr[1]) jump = e.cr[2] * Math.sin(Math.PI * (u - e.cr[0]) / e.cr[1]);
        P = this.kn(e.K, u); let a = Math.min(0.3, ua / L), on = sm(u / a), off = 1 - sm((u - e.ve) / 0.1); AV = 0.72 * on * off * (1 - 0.35 * Math.max(0, (u - e.upk) / (1 - e.upk)));
        AH = air * 0.32 * (0.6 + 0.4 * on) + (e.mc === 0 ? (1 - sm(u / 0.07)) * 0.35 : 0) + air * 0.18 * sm((u - e.ve + 0.04) / 0.12) * (1 - sm((u - 0.97) / 0.03));
        M = e.mc > 0 ? sm((u - e.mc) / Math.max(0.06, 0.09 / L)) : 1; op = sm(u / 0.3) * (1 - 0.6 * sm((u - 0.55) / 0.45)); if (e.me) M *= 1 - sm((u - 0.8) / 0.1); fry = sm((u - e.ve + 0.2) / 0.12) * 0.3; oq = 0.8 - this.h * 0.1; ti = 260 + this.h * 380; }
      else if (e.ty === 2) { if (!e.K) e.K = [[0, e.p0], [0.3, e.p0 * 0.3], [1, e.p2]]; P = this.kn(e.K, u); let b = Math.exp(-Math.pow((u - e.uc) / e.w, 2) * 2.2);
        AV = e.av * b * sm(u / 0.03); AH = (0.6 + air * 0.75) * sm(u / 0.03) * Math.exp(-u * L * 2.4) * (1 - sm((u - 0.92) / 0.08)); M = 1; fry = sm((u - e.uc) / Math.max(0.02, e.w)) * 0.3; oq = 0.85; ti = 380; }
      else if (e.ty === 3) { if (!e.K) e.K = [[0, e.p0], [0.3, e.pk], [0.7, e.p3], [1, e.p2]]; P = this.kn(e.K, u); AV = 0.85 * sm(u / Math.min(0.3, ua / L + 0.03)) * (1 - sm((u - 0.9) / 0.1));
        AH = air * 0.22 + 0.15 * (1 - sm((u - 0.02) / 0.05)); M = 0; fry = sm((u - 0.84) / 0.1) * 0.4; oq = 0.7; ti = 600; }
    }
    if (!any) M = this.cM;
    this.cRg = rough; this.cJp = jump; this.cOp = op; this.cP = P; this.cAV = AV; this.cAH = AH; this.cIN = IN; this.cM = M; this.cFry = fry; this.cOQ = oq; this.cTi = ti; }
  static get parameterDescriptors() { return [BEND]; }
  process(ins, outs, P) { if (this.dead || currentTime > this.stop) return false; this.mbm = bendOf(P);
    if (currentTime + 0.003 < this.start) { for (const ch of outs[0]) ch.fill(0); return true; }
    const y = outs[0][0], N = y.length, sr = sampleRate, h = this.h, sh = this.sh, BK = 32;
    const VW = [[880, 1450, 2850, 3900, 4900], [600, 1000, 2800, 3800, 4800], [540, 1150, 2750, 3800, 4800], [700, 1450, 2850, 3900, 4900], [620, 1400, 2850, 3900, 4900]], NS = [260, 1150, 2350, 3500, 4600];
    const BW0 = [260, 240, 320, 400, 450], SW = [650, 1500, 2800, 3900, 4900];
    for (let n0 = 0; n0 < N; n0 += BK) {
      const tt = currentTime - this.start + n0 / sr, dt = BK / sr; this.ing = 0; this.ctl(tt);
      const s = 0.6 + h * 0.15 + sh * 0.3; this.d1 += -this.d1 * dt / 0.06 + 0.07 * s * Math.sqrt(2 * dt / 0.06) * this.g(); this.d2 += -this.d2 * dt / 0.25 + 0.16 * s * Math.sqrt(2 * dt / 0.25) * this.g(); this.d3 += -this.d3 * dt / 1.0 + 0.35 * s * Math.sqrt(2 * dt / 1.0) * this.g();
      this.da += -this.da * dt / 0.08 + (0.03 + sh * 0.04 + h * 0.02) * Math.sqrt(2 * dt / 0.08) * this.g(); this.tr += dt * this.trf * (1 + 0.2 * this.d1);
      const trem = Math.sin(2 * Math.PI * this.tr) * (sh * 0.06 + h * 0.02), rg = this.cRg || 0, st = (this.cJp || 0) + this.cP + this.d1 + this.d2 + this.d3 + trem * 0.5, f0 = this.f0 * Math.pow(2, st / 12) * this.mbm;
      const M = this.cM, V = VW[this.k === 0 ? 0 : this.vw], br = Math.min(1, this.cAH * 0.8);
      for (let i = 0; i < 5; i++) { let vv = this.k === 5 || this.k === 2 ? V[i] : V[i] * 0.55 + SW[i] * 0.45, op = this.cOp == null ? 1 : this.cOp; vv = vv * (0.55 + 0.45 * op) + VW[1][i] * 0.45 * (1 - op); let f = (vv * M + NS[i] * (1 - M)) * this.fs * (i === 0 ? 1 + h * 0.08 * M : 1), bw = BW0[i] * (1 + br * (i === 0 ? 1.0 : 0.6)) + (1 - M) * (i === 0 ? -60 : 80); this.res(this.R[i], f, bw); this.FF[i] = f; this.FB[i] = bw * (i === 0 ? 1.4 : 1); }
      { const z = this.Z, r = Math.exp(-Math.PI * 180 / sr), b = 2 * r * Math.cos(2 * Math.PI * 950 * this.fs / sr), c = -r * r, a = 1 - b - c; z.a = 1 / a; z.b = -b / a; z.c = -c / a; }
      { const HT = this.HT, HP = this.HP; HP.set(HT); const NH = Math.min(48, Math.floor(Math.min(7500, sr * 0.45) / f0)), ro = -(21 - 5 * Math.min(1, this.cAV) - h * 1.5 - this.vel * 1.5), zm = 1 - M;
        for (let k = 1; k <= 48; k++) { if (k > NH) { HT[k] = 0; continue; } const fk = k * f0; let T = Math.pow(k, ro / 6.0206);
          for (let i = 0; i < 5; i++) { const F = this.FF[i], B = this.FB[i], x = fk / F; T /= Math.sqrt((1 - x * x) * (1 - x * x) + (fk * B / (F * F)) * (fk * B / (F * F))); }
          if (zm > 0.01) { const Fz = 950 * this.fs, Bz = 180, x = fk / Fz, Z = Math.sqrt((1 - x * x) * (1 - x * x) + (fk * Bz / (Fz * Fz)) * (fk * Bz / (Fz * Fz))); T *= 1 - zm + zm * Math.min(1, Z); }
          if (fk > 4000) T *= Math.exp(-(fk - 4000) / 2500); HT[k] = T; }
        if (!this.hinit) { this.hinit = 1; HP.set(HT); } this.NH = NH; }
      this.prevM = M;
      const kA = 1 - Math.exp(-1 / (0.004 * sr)), tAV = this.cAV * (1 + this.da + trem * 0.6) * (0.6 + 0.5 * this.vel), tAH = this.cAH, tIN = this.cIN, fry = this.cFry, ti = Math.exp(-2 * Math.PI * this.cTi * (0.7 + this.vel * 0.6) * (0.6 + 0.7 * Math.min(1, this.cAV)) / sr);
      this.rp = (this.rp || 0) + dt * 65; const jit = (0.012 + h * 0.005 + sh * 0.005) * (1 + rg * 2), shim = 0.04 + h * 0.012 + sh * 0.01, nE = Math.min(N, n0 + BK), mix = 1 - M, ing = this.ing;
      for (let n = n0; n < nE; n++) {
        this.sAV += (tAV - this.sAV) * kA; this.sAH += (tAH - this.sAH) * kA; this.sIN += (tIN - this.sIN) * kA;
        const dp = 1 / this.T; this.ph += dp;
        if (this.ph >= 1) { this.ph -= 1; let T = sr / f0 * (1 + jit * this.g()), a = 1 + shim * this.g(), oq = this.cOQ;
          this.alt = !this.alt; if (fry > 0.05) { if (this.alt) { T *= 1 + 0.25 * fry; a *= 1 - 0.6 * fry; } else T *= 1 - 0.1 * fry; oq -= 0.25 * fry; if (this.r() < fry * 0.04) { T *= 1.5 + this.r() * 0.5; a *= 0.7; } }
          this.T = Math.max(8, T); this.oq = oq; this.amp = Math.max(0, a); }
        const oqn = this.oq, tau = this.ph / oqn; let fl = 0;
        if (tau < 1) fl = (tau * tau - tau * tau * tau) * 6.75;
        const th = 2 * Math.PI * this.ph, c2 = 2 * Math.cos(th), wq = (n - n0) / BK, HT = this.HT, HP = this.HP; let s0 = 0, s1 = Math.sin(th), hs = 0;
        for (let k = 1; k <= this.NH; k++) { hs += (HP[k] + (HT[k] - HP[k]) * wq) * s1; const s2 = c2 * s1 - s0; s0 = s1; s1 = s2; }
        const vo = hs * this.amp * this.sAV * HGAIN * (1 - rg * 0.12 * (0.5 + 0.5 * Math.sin(2 * Math.PI * (this.rp + (n - n0) * 65 / sr))));
        const wn = this.g(); this.p0 = 0.99765 * this.p0 + wn * 0.099046; this.p1 = 0.963 * this.p1 + wn * 0.2965164; this.p2 = 0.57 * this.p2 + wn * 1.0526913;
        const nz = (this.p0 + this.p1 + this.p2 + wn * 0.1848) * 0.16, md = Math.min(0.4, this.sAV * 0.6), asp = nz * this.sAH * (1 - md + md * fl * 1.3) * 0.55;
        let v = asp, hb = this.HB, hv = hb.a * wn * 0.5 * this.sAH + hb.b * hb.y1 + hb.c * hb.y2; hb.y2 = hb.y1; hb.y1 = hv; this.lo += (wn * 0.5 * this.sAH - this.lo) * 0.02;
        for (let i = 0; i < 5; i++) { const q = this.R[i], o2 = q.a * v + q.b * q.y1 + q.c * q.y2; q.y2 = q.y1; q.y1 = o2; v = o2; }
        if (mix > 0.001) { const z = this.Z, w = z.a * v + z.b * z.x1 + z.c * z.x2; z.x2 = z.x1; z.x1 = v; v = v * (1 - mix) + w * mix * (1 - 0.4 * mix); } else { this.Z.x2 = this.Z.x1; this.Z.x1 = v; }
        v += vo;
        if (this.sIN > 0.0005) { const ni = this.g() * this.sIN * 0.5, q1 = this.I1, q2 = this.I2, a1 = q1.a * ni + q1.b * q1.y1 + q1.c * q1.y2, a2 = q2.a * ni + q2.b * q2.y1 + q2.c * q2.y2; q1.y2 = q1.y1; q1.y1 = a1; q2.y2 = q2.y1; q2.y1 = a2; v += ing ? a1 * 0.35 + a2 * 1.1 + (ni - this.ipv) * 0.5 : a1 * 0.7 + a2 * 0.5; this.ipv = ni; }
        v += hv * 0.09 + this.lo * 1.1;
        const dc = v - this.dcx + 0.995 * this.dcy; this.dcx = v; this.dcy = dc; const ya = Math.abs(dc * 0.4); y[n] = ya < 0.9 ? dc * 0.4 : Math.sign(dc) * (0.9 + 0.1 * Math.tanh((ya - 0.9) * 10));
      }
    }
    for (let c = 1; c < outs[0].length; c++) outs[0][c].set(y);
    return true;
  }
}
registerProcessor('nb-moan', Moan);
`;

    const WT_SRC = `
const WT = (function () {
  const NAMES = [['基本', 'BASIC'], ['脈', 'PULSE'], ['声', 'VOICE'], ['玻璃', 'GLASS'], ['唸', 'GROWL'], ['掃', 'SWEEP'], ['粒', 'BITS'], ['折', 'FOLD'], ['祈', 'HYMN'], ['空', 'HOLLOW'], ['噴', 'SPRAY'], ['壁', 'MURAL'], ['墨', 'INK'], ['灯', 'NEON'], ['呪', 'CURSE'], ['骸', 'MARROW'], ['聖歌', 'CHOIR'], ['鐘', 'BELL'], ['金管', 'BRASS'], ['弦', 'STRINGS'], ['酸', 'ACID'], ['重ね', 'SAW STACK'], ['機声', 'DIGIVOX'], ['正弦の山', 'SINE STACK'], ['私の', 'MINE'],
    ['電子音', 'CHIP'], ['可愛', 'SUGAR'], ['悲鳴', 'SCREECH'], ['吸', 'THE VAC'], ['獣', 'BEAST'], ['蜜', 'HONEY'], ['八粒', 'STEP TRI'], ['金属', 'METAL'], ['毛羽', 'FUZZ'], ['録', 'TAPED']];
  const F = 16, HL = [512, 362, 256, 181, 128, 90, 64, 45, 32, 22, 16, 11, 8, 6, 4, 3, 2, 1];
  function fft(re, im, inv) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let len = 2; len <= n; len <<= 1) { const a = 2 * Math.PI / len * (inv ? 1 : -1), wr = Math.cos(a), wi = Math.sin(a), h = len >> 1;
      for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let j = 0; j < h; j++) { const p = i + j, q = p + h, vr = re[q] * cr - im[q] * ci, vi = re[q] * ci + im[q] * cr; re[q] = re[p] - vr; im[q] = im[p] - vi; re[p] += vr; im[p] += vi; const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr; } } }
    if (inv) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
  }
  const VOW = [[730, 1090, 2440], [530, 1840, 2480], [270, 2290, 3010], [570, 840, 2410], [300, 870, 2240]];
  const PR = [1, 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
  const hs = k => { const x = Math.sin(k * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
  function spec(id, u, k) {
    const odd = k % 2 === 1;
    if (id === 0) { const sh = [k === 1 ? 1 : 0, odd ? 0.81 / (k * k) * (((k - 1) / 2) % 2 ? -1 : 1) : 0, 0.64 / k, odd ? 1.27 / k : 0], x = u * 3, i = Math.min(2, Math.floor(x)), f = x - i; return [sh[i] + (sh[i + 1] - sh[i]) * f, 0]; }
    if (id === 1) { const w = 0.5 - 0.46 * u; return [0.64 * Math.sin(Math.PI * k * w) / k, 1]; }
    if (id === 2) { const x = u * 4, i = Math.min(3, Math.floor(x)), f = x - i, fr = k * 110; let a = 0.25 / Math.sqrt(k); for (let j = 0; j < 3; j++) { const F0 = VOW[i][j] + (VOW[i + 1][j] - VOW[i][j]) * f, bw = 70 + F0 * 0.07; a += [1, 0.55, 0.3][j] * Math.exp(-Math.pow((fr - F0) / bw, 2)); } return [a, 0]; }
    if (id === 3) { const r = PR.indexOf(k); if (r < 0) return [0, 0]; return [(k === 1 ? 0.6 : 0) + Math.exp(-Math.pow(Math.log2(k) - u * 6, 2) / 0.7) / Math.pow(k, 0.3), 0]; }
    if (id === 4) return [0.7 / k * Math.pow(Math.abs(Math.cos(Math.PI * k * (0.07 + u * 0.43))), 1.5), 0];
    if (id === 5) { const kc = 1.5 + u * u * 120; return [(1 / k) / (1 + Math.pow(k / kc, 4)) + 0.7 * Math.exp(-Math.pow((k - kc) / (1 + kc * 0.08), 2)) / Math.pow(k, 0.3), 0]; }
    if (id === 8) { const bars = { 1: 1, 2: 0.75, 3: 0.5, 4: 0.45, 6: 0.3, 8: 0.25 }, ch = { 5: 0.35, 7: 0.25, 9: 0.2, 10: 0.15, 12: 0.12 }; return [((bars[k] || 0) + (ch[k] || 0) * u) * (1 + 0.6 * Math.exp(-Math.pow((k * 110 - 520) / 160, 2))), 0]; }
    if (id === 9) return [odd ? 1 / Math.pow(k, 2 - 1.4 * u) : 0, 0];
    if (id === 10) return [hs(k * 3.1 + Math.floor(u * 15)) * (0.2 + u) / Math.pow(k, 0.9 - u * 0.5), 0];
    if (id === 11) { const band = 2 + Math.floor(u * 6), on = (k % band === 0 || k === 1) ? 1 : 0.15; return [on / Math.pow(k, 0.8), (k + Math.floor(u * 4)) % 2]; }
    if (id === 12) return [Math.pow(hs(k * 0.7 + 1), 3) * Math.exp(-k / (3 + u * 60)) * 2, 1];
    if (id === 13) { const pk = 4 + u * 40; return [0.5 / k + Math.exp(-Math.pow((k - pk) / 2.5, 2)) + 0.6 * Math.exp(-Math.pow((k - pk * 1.5) / 2.5, 2)), 0]; }
    if (id === 14) { const tw = Math.sin(k * (1.3 + u * 2.7)) * Math.sin(k * 0.37 + u * 5); return [Math.abs(tw) / Math.pow(k, 0.7) * (odd ? 1 : 0.4), k % 3 === 0 ? 1 : 0]; }
    if (id === 15) return [(odd ? 1 : -0.6) * Math.pow(k, -1.3 + u * 0.6) * (1 + Math.sin(k * u * 2.1)), 0];
    if (id === 16) { const x = u * 4, i = Math.min(3, Math.floor(x)), f = x - i, fr = k * 98; let a = 0.12 / k; for (let j = 0; j < 3; j++) { const F0 = VOW[(i + 2) % 5][j] + (VOW[(i + 3) % 5][j] - VOW[(i + 2) % 5][j]) * f, bw = 110 + F0 * 0.1; a += [1, 0.7, 0.4][j] * Math.exp(-Math.pow((fr - F0) / bw, 2)); } return [a * (k % 2 ? 1 : 0.8), 0]; }
    if (id === 17) { const set = [1, 2, 3, 5, 7, 9, 12, 15, 19, 24], r = set.indexOf(k); if (r < 0) return [0, 0]; return [Math.pow(0.72 + u * 0.2, r) * (r === 0 ? 1 : 0.8), r % 2]; }
    if (id === 18) { const kc = 3 + u * 22; return [(1 / k) * (1 + 1.5 * Math.exp(-Math.pow((k - kc) / (2 + kc * 0.3), 2))) / (1 + Math.pow(k / (kc * 2), 3)), 0]; }
    if (id === 19) return [(1 / Math.pow(k, 0.9)) * (0.6 + 0.4 * Math.cos(k * (0.6 + u * 1.4))) / (1 + Math.pow(k / (20 + u * 120), 2)), 0];
    if (id === 20) { const sq = odd ? 1 : 1 - u, kc = 4 + u * u * 60; return [sq / k / (1 + Math.pow(k / kc, 4)) + 0.9 * Math.exp(-Math.pow(k - kc, 2) / 3) / k * kc * 0.2, 0]; }
    if (id === 21) { let a = 1 / k; if (k % 2 === 0) a += 0.6 / (k / 2); if (k % 3 === 0) a += u * 0.5 / (k / 3); if (k % 4 === 0) a += u * 0.3 / (k / 4); return [a * 0.6, 0]; }
    if (id === 22) { const x = u * 4, i = Math.min(3, Math.floor(x)), f = x - i, fr = k * 140; let a = 0.05; for (let j = 0; j < 2; j++) { const F0 = VOW[i][j] + (VOW[i + 1][j] - VOW[i][j]) * f; a += Math.exp(-Math.pow((fr - F0) / 60, 2)); } return [a * (k % 4 === 1 ? 1.4 : 1), k % 2]; }
    if (id === 23) { const n = 1 + Math.floor(u * 63); return [k <= n ? 1 / Math.sqrt(n) : 0, 0]; }
    if (id === 26) { const fr = k * 260, F2 = 800 + u * 1600; return [(k === 1 ? 1 : 0) + (k === 2 ? 0.35 : 0) + (k === 3 ? 0.08 * (1 - u) : 0) + 0.25 * Math.exp(-Math.pow((fr - F2) / 300, 2)) / k, 0]; }
    if (id === 27) { const pk = 6 + u * 70; return [0.6 / k + 2.2 * Math.exp(-Math.pow((k - pk) / (1.2 + pk * 0.04), 2)) + 0.8 * Math.exp(-Math.pow((k - pk * 2) / 2, 2)), (k % 2)]; }
    if (id === 28) { const w = 0.5 - u * 0.42; let a = 0.64 * Math.sin(Math.PI * k * w) / k; if (k % 2 === 0) a += 0.5 / (k / 2); return [a, 1]; }
    if (id === 29) { const x = u * 2, i = Math.min(1, Math.floor(x)), f = x - i, OR = [[400, 800], [800, 1200], [500, 1700]], fr = k * 55; let a = 0.35 / Math.sqrt(k); for (let j = 0; j < 2; j++) { const F0 = OR[i][j] + (OR[i + 1][j] - OR[i][j]) * f; a += [1.4, 0.8][j] * Math.exp(-Math.pow((fr - F0) / 90, 2)); } return [a, 0]; }
    if (id === 30) return [(1 / k) * Math.exp(-k / (2 + (1 - u) * 40)) * (k % 2 ? 1 : 1.15), 0];
    return [0, 0];
  }
  function timeDomain(id, u, N) {
    const x = new Float64Array(N);
    for (let n = 0; n < N; n++) { const th = 2 * Math.PI * n / N;
      if (id === 6) { const lv = 2 + Math.round((1 - u) * 12), st = 6 + Math.round((1 - u) * 58), q = Math.floor(n / N * st) / st * 2 * Math.PI; x[n] = Math.round(Math.sin(q) * lv) / lv; }
      else if (id === 25) { const w = [0.125, 0.25, 0.5, 0.75][Math.min(3, Math.floor(u * 4))]; x[n] = (n / N < w ? 1 : -1) * (u > 0.9 ? 0.75 : 1); }
      else if (id === 31) { const st = Math.max(3, Math.round(16 - u * 12)), tri = 1 - 4 * Math.abs(n / N - 0.5); x[n] = Math.round(tri * st) / st; }
      else if (id === 32) { const r = [2, 3, 4, 5, 7][Math.min(4, Math.floor(u * 5))], I = 1 + u * 6; x[n] = Math.sin(th + I * Math.sin(r * th)); }
      else if (id === 33) { const g = 1 + u * 30; x[n] = Math.tanh(g * Math.sin(th) + u * 0.6) - Math.tanh(u * 0.6); }
      else { const g = 1 + u * 7; x[n] = Math.sin(g * Math.sin(th)); } }
    return x;
  }
  function drawn(a, b, u, N) { if (a && a.length && Array.isArray(a[0])) { const ks = a, K = ks.length, fp = Math.max(0, Math.min(1, u)) * (K - 1), k0 = Math.floor(fp), k1 = Math.min(K - 1, k0 + 1); a = ks[k0]; b = ks[k1]; u = fp - k0; }
    const x = new Float64Array(N), A = a && a.length ? a : null, B = b && b.length ? b : A; for (let n = 0; n < N; n++) { const q = n / N, rd = arr => { if (!arr) return Math.sin(q * 6.2832); const p = q * arr.length, i = Math.floor(p), f = p - i, v0 = arr[i % arr.length], v1 = arr[(i + 1) % arr.length], s = 0.5 - 0.5 * Math.cos(f * Math.PI); return (v0 + (v1 - v0) * s) * 2 - 1; }; x[n] = rd(A) * (1 - u) + rd(B) * u; } let m = 0; for (let n = 0; n < N; n++) m += x[n]; m /= N; for (let n = 0; n < N; n++) x[n] -= m; return x; }
  let MINE = [null, null], TAPE = null;
  function frameSpec(id, u, N, Hmax) {
    const re = new Float64Array(N), im = new Float64Array(N);
    if (id === 34) { const fr = TAPE && TAPE.f, K = fr ? fr.length : 0; if (!K) return [re, im]; const fp = Math.max(0, Math.min(1, u)) * (K - 1), i = Math.floor(fp), t = fp - i, A = fr[i], B = fr[Math.min(K - 1, i + 1)], H = Math.min(Hmax, A[0].length);
      for (let k = 1; k <= H && k < N / 2; k++) { const a = (A[0][k - 1] || 0) * (1 - t) + (B[0][k - 1] || 0) * t, ph = t < 0.5 ? A[1][k - 1] || 0 : B[1][k - 1] || 0; re[k] = a * Math.cos(ph) * N / 2; im[k] = a * Math.sin(ph) * N / 2; }
      return [re, im]; }
    if (id === 24) { const x = drawn(MINE[0], MINE[1], u, N); for (let n = 0; n < N; n++) re[n] = x[n]; fft(re, im, false); for (let k = Hmax + 1; k < N; k++) { re[k] = 0; im[k] = 0; } re[0] = 0; im[0] = 0; return [re, im]; }
    if (id === 6 || id === 7 || id === 25 || id === 31 || id === 32 || id === 33) { const x = timeDomain(id, u, N); for (let n = 0; n < N; n++) re[n] = x[n]; fft(re, im, false); for (let k = Hmax + 1; k < N; k++) { re[k] = 0; im[k] = 0; } re[0] = 0; im[0] = 0; return [re, im]; }
    for (let k = 1; k <= Hmax && k < N / 2; k++) { const [a, c] = spec(id, u, k); if (c) re[k] = a * N / 2; else im[k] = -a * N / 2; }
    return [re, im];
  }
  function build(re0, im0, N, H) {
    const re = new Float64Array(N), im = new Float64Array(N);
    for (let k = 1; k <= H && k < N / 2; k++) { re[k] = re0[k]; im[k] = im0[k]; re[N - k] = re0[k]; im[N - k] = -im0[k]; }
    fft(re, im, true); const out = new Float32Array(N + 1); for (let n = 0; n < N; n++) out[n] = re[n]; out[N] = out[0]; return out;
  }
  const cache = {};
  function table(id, N, levels, a, b) {
    if (id === 24) MINE = [a || null, b || null];
    if (id === 34) TAPE = a || null;
    const flat = v => Array.isArray(v) ? v.map(q => Array.isArray(q) ? q.map(z => Math.round(z * 99)).join(',') : Math.round(q * 99)).join(Array.isArray(v[0]) ? ';' : ',') : '';
    const key = id + ':' + N + ':' + levels + (id === 24 ? ':' + flat(a || []) + '|' + flat(b || []) : id === 34 ? ':' + ((a && a.k) || '') : ''); if (cache[key]) return cache[key];
    const fr = [];
    for (let f = 0; f < F; f++) {
      const u = f / (F - 1), [re, im] = frameSpec(id, u, N, Math.min(HL[0], N / 2 - 1)), lv = [];
      for (let l = 0; l < levels; l++) lv.push(build(re, im, N, Math.min(HL[l], N / 2 - 1)));
      const ref = Math.max(0, Math.min(levels - 1, HL.indexOf(256))); let pk = 1e-6; for (let n = 0; n < N; n++) pk = Math.max(pk, Math.abs(lv[ref][n]));
      lv.forEach(a => { for (let n = 0; n <= N; n++) a[n] /= pk; }); fr.push(lv);
    }
    return (cache[key] = { N, F, fr });
  }
  function spectra(T) { if (T.sp) return T.sp; const N = T.N, re = new Float64Array(N), im = new Float64Array(N);
    T.sp = T.fr.map(lv => { const x = lv[0]; for (let n = 0; n < N; n++) { re[n] = x[n]; im[n] = 0; } fft(re, im, false); const m = new Float64Array(N / 2 + 1), p = new Float64Array(N / 2 + 1);
      for (let k = 1; k <= N / 2; k++) { m[k] = Math.hypot(re[k], im[k]) / (N / 2); p[k] = Math.atan2(im[k], re[k]); } return { m, p }; }); return T.sp; }
  const buf = { re: new Float64Array(2048), im: new Float64Array(2048), m: new Float64Array(1025), g: new Float64Array(1025) };
  return { NAMES, F, HL, table, spectra, buf, ifft: (re, im) => fft(re, im, true), MINE_ID: 24, TAPED: 34 };
})();
`;
    let wkURL = null; const wkP = new WeakMap();
    function ready(ctx) {
        if (!ctx.audioWorklet || typeof AudioWorkletNode === 'undefined') return Promise.resolve(false);
        if (wkP.has(ctx)) return wkP.get(ctx);
        try { wkURL = wkURL || URL.createObjectURL(new Blob([WT_SRC, WK], { type: 'application/javascript' })); } catch (e) { wkURL = null; }
        const viaData = () => ctx.audioWorklet.addModule('data:application/javascript;charset=utf-8,' + encodeURIComponent(WT_SRC + WK));
        let p = (wkURL ? ctx.audioWorklet.addModule(wkURL).catch(viaData) : viaData()).then(() => { ctx._nbwk = true; return true; }).catch(e => { console.warn('noisebox: no worklet', e && e.message); return false; });
        wkP.set(ctx, p); return p;
    }
    const wkNode = (ctx, name, ch) => { try { let n = new AudioWorkletNode(ctx, name, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [ch || 2] }); (ctx._nbw = ctx._nbw || new Set()).add(n); return n; } catch (e) { return null; } };
    const bury = list => list.forEach(n => { if (!n || !n.port) return; try { n.port.postMessage('kill'); n.disconnect(); } catch (e) {} if (n.context && n.context._nbw) n.context._nbw.delete(n); });

    const CHOIRI = [['3rd up', 2], ['5th up', 4], ['octave up', 7], ['4th up', 3], ['6th up', 5], ['2nd up', 1], ['3rd down', -2], ['5th down', -4], ['octave down', -7], ['4th down', -3], ['6th down', -5]];
    function curveOf(fn, n) { n = n || 2048; let c = new Float32Array(n); for (let i = 0; i < n; i++) c[i] = clamp(fn(i / (n - 1) * 2 - 1), -1, 1); return c; }
    const rootOf = info => info && info.root != null ? info.root : 9;
    const noiseFill = (d, seed) => { let x = seed; for (let i = 0; i < d.length; i++) { x = (x * 16807) % 2147483647; d[i] = x / 1073741823.5 - 1; } return d; };
    function widener(ctx, b) {
        let sp = ctx.createChannelSplitter(2), mg = ctx.createChannelMerger(2), inn = b.g(1), ll = b.g(1), rr = b.g(1), lr = b.g(0), rl = b.g(0);
        inn.channelCount = 2; inn.channelCountMode = 'explicit'; inn.connect(sp); sp.connect(ll, 0); sp.connect(lr, 0); sp.connect(rr, 1); sp.connect(rl, 1);
        ll.connect(mg, 0, 0); rl.connect(mg, 0, 0); rr.connect(mg, 0, 1); lr.connect(mg, 0, 1);
        return { in: inn, out: mg, set(w) { let a = (1 + w) / 2, c = (1 - w) / 2; ll.gain.value = rr.gain.value = a; lr.gain.value = rl.gain.value = c; } };
    }
    function irBuf(ctx, o) {
        let seed = 2166136261; for (const ch of JSON.stringify(o)) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0; seed = seed % 2147483646 + 1;
        const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        let len = o.len, sr = ctx.sampleRate, n = Math.max(1, Math.floor(sr * len)), b = ctx.createBuffer(2, n, sr), kind = o.kind || 0, size = o.size == null ? 0.5 : o.size, dark = o.dark || 0, w = o.width == null ? 1 : o.width;
        const p = o.decay || 2.2, tM = len * (1 - Math.pow(10, -3 / p)) * 0.8, tL = tM * (o.lowt == null ? 1 : o.lowt), tH = tM * Math.max(0.12, 1 - dark * [0.55, 0.8, 0.8, 0.85, 0.6, 0.85][kind]);
        const dense = [0.004, 0.035, 0.05, 0.11, 0.025, 0.16][kind] * (0.4 + size * 1.2), rho0 = [2200, 250, 400, 180, 600, 120][kind], rho1 = 2600;
        const dims = [[0, 0, 0], [5, 7, 3], [8, 12, 5], [22, 34, 14], [6, 9, 4], [26, 48, 22]][kind].map(v => v * (0.45 + size * 1.1)), absorb = [0, 0.75, 0.82, 0.86, 0.94, 0.88][kind];
        const lpk = f => 1 - Math.exp(-2 * Math.PI * f / sr), shared = new Float32Array(n), ers = [];
        { let t = 0; while (true) { const tt = t / sr, rho = tt < dense ? rho0 + (rho1 - rho0) * Math.pow(tt / dense, 1.5) : rho1, cell = sr / rho, at = Math.floor(t + rnd() * cell); if (at >= n) break; shared[at] = (rnd() < 0.5 ? -1 : 1) * (0.6 + rnd() * 0.4); t += cell; } }
        for (let ch = 0; ch < 2; ch++) {
            const d = b.getChannelData(ch), x = new Float32Array(n);
            let t = 0; while (true) { const tt = t / sr, rho = tt < dense ? rho0 + (rho1 - rho0) * Math.pow(tt / dense, 1.5) : rho1, cell = sr / rho, at = Math.floor(t + rnd() * cell); if (at >= n) break; x[at] += (rnd() < 0.5 ? -1 : 1) * (0.6 + rnd() * 0.4) * w; t += cell; }
            if (w < 1) for (let i = 0; i < n; i++) x[i] += shared[i] * (1 - w);
            let l1 = 0, l2 = 0, h1 = 0, eL = 1, eM = 1, eH = 1; const kl = lpk(300), kh = lpk(3200), aL = Math.exp(-6.91 / (tL * sr)), aM = Math.exp(-6.91 / (tM * sr)), aH = Math.exp(-6.91 / (tH * sr));
            for (let i = 0; i < n; i++) { const v = x[i]; l1 += (v - l1) * kl; l2 += (l1 - l2) * kl; const rest = v - l2; h1 += (rest - h1) * kh; d[i] = l2 * eL + h1 * eM + (rest - h1) * eH; eL *= aL; eM *= aM; eH *= aH; }
            if (kind) { const W = dims[0], L = dims[1], H = dims[2], src = [W * 0.3, L * 0.25, H * 0.5], lis = [W * (0.55 + ch * 0.04), L * 0.7, H * 0.45];
                for (let a = -2; a <= 2; a++) for (let c = -2; c <= 2; c++) for (let e = -1; e <= 1; e++) { const ord = Math.abs(a) + Math.abs(c) + Math.abs(e); if (!ord || ord > 2) continue;
                    const ix = a * W + (a % 2 ? W - src[0] : src[0]), iy = c * L + (c % 2 ? L - src[1] : src[1]), iz = e * H + (e % 2 ? H - src[2] : src[2]), dist = Math.hypot(ix - lis[0], iy - lis[1], iz - lis[2]), at = Math.floor(sr * dist / 343);
                    if (at >= n) continue; const gg = Math.pow(absorb, ord) * 3.2 / Math.max(1, dist) * (rnd() < 0.5 ? -1 : 1), k2 = lpk(9000 / ord); let y = 0;
                    if (!ch) ers.push([at / sr, Math.abs(gg)]); for (let j = 0; j < 24 && at + j < n; j++) { y += ((j === 0 ? gg : 0) - y) * k2; d[at + j] += y; } } }
            if (kind === 4) { let D = Math.floor(sr * (0.0041 + ch * 0.0007)), D2 = Math.floor(sr * 0.0067); for (let i = Math.max(D, D2); i < n; i++) d[i] += d[i - D] * 0.55 - d[i - D2] * 0.3; }
        }
        b._t = [tL, tM, tH]; b._er = ers;
        return b;
    }
    function box(ctx) {
        const g = v => { let n = ctx.createGain(); n.gain.value = v; return n; };
        let b = { g, in: g(1), out: g(1), dry: g(0), wet: g(1) };
        b.in.channelCount = 2; b.in.channelCountMode = 'explicit';
        b.in.connect(b.dry); b.dry.connect(b.out); b.wet.connect(b.out);
        return b;
    }
    let AT = null; const touched = new Set();
    if (typeof AudioParam !== 'undefined') {
        const dv = Object.getOwnPropertyDescriptor(AudioParam.prototype, 'value');
        if (dv && dv.set && dv.configurable) Object.defineProperty(AudioParam.prototype, 'value', { configurable: true, enumerable: dv.enumerable, get() { return dv.get.call(this); },
            set(v) { if (AT != null && isFinite(v)) { try { this.setValueAtTime(v, AT); touched.add(this); } catch (e) {} } else dv.set.call(this, v); } });
    }
    function at(t, fn) { AT = t; try { fn(); } finally { AT = null; } }
    const when = ctx => AT != null ? AT : ctx.currentTime;
    function untouch(t) { touched.forEach(p => { try { p.cancelScheduledValues(t); } catch (e) {} }); touched.clear(); }
    function exact(ctx, now, skip) {
        return (key, prm, v) => { if (!prm || (skip && skip[key])) return; let t = AT != null ? AT : ctx.currentTime; try { prm.cancelScheduledValues(t); prm.setValueAtTime(v, t); } catch (e) {} if (now && AT == null) prm.value = v; };
    }
    function setter(ctx, now, skip) {
        return (key, prm, v) => { if (!prm || (skip && skip[key]) || !isFinite(v)) return; if (AT != null) { prm.setTargetAtTime(v, AT, 0.008); touched.add(prm); } else if (now) prm.value = v; else prm.setTargetAtTime(v, ctx.currentTime, 0.025); };
    }
    // feedback loops were rendering differently every time. this fixes it somehow
    function oneOut(ctx, outs, to) {
        let n = outs.length, mg = ctx.createChannelMerger(n * 2), sp2 = ctx.createChannelSplitter(n * 2), L = ctx.createGain(), R = ctx.createGain(), fin = ctx.createChannelMerger(2), parts = [mg, sp2, L, R, fin];
        outs.forEach((o, i) => { let up = ctx.createGain(), sp = ctx.createChannelSplitter(2); up.channelCount = 2; up.channelCountMode = 'explicit'; up.channelInterpretation = 'speakers'; o.connect(up); up.connect(sp); sp.connect(mg, 0, i * 2); sp.connect(mg, 1, i * 2 + 1); parts.push(up, sp); });
        mg.connect(sp2); for (let i = 0; i < n; i++) { sp2.connect(L, i * 2); sp2.connect(R, i * 2 + 1); }
        [L, R].forEach(x => { x.channelCount = 1; x.channelCountMode = 'explicit'; });
        L.connect(fin, 0, 0); R.connect(fin, 0, 1); fin.connect(to); return parts;
    }
    function bq(ctx, type, f, q) { let b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q != null) b.Q.value = q; return b; }
    function respOf(list, fr) {
        let m = new Float32Array(fr.length).fill(1), tm = new Float32Array(fr.length), ph = new Float32Array(fr.length);
        list.forEach(f => { if (!f || f.type === 'allpass') return; f.getFrequencyResponse(fr, tm, ph); for (let i = 0; i < fr.length; i++) m[i] *= tm[i]; });
        return m;
    }
    const mixAp = b => [[b.wet.gain, v => v], [b.dry.gain, v => 1 - v]];
    const stopAll = (b, extra) => () => { (extra || []).forEach(n => { try { n.stop(); } catch (e) {} }); try { b.in.disconnect(); b.out.disconnect(); } catch (e) {} };
    const tap = (ctx, node, size) => { if (offline(ctx)) return null; let a = ctx.createAnalyser(); a.fftSize = size || 2048; a.smoothingTimeConstant = 0.8; node.connect(a); return a; };
    const hsh = k => { const v = Math.sin(k * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
    const clockOf = (ctx, w) => ({
        sched(b0, b1, tb) { if (!w) return; let Q = n => w.parameters.get(n), t = tb(b0); Q('aT').setValueAtTime(t, t); Q('aB').setValueAtTime(b0, t); Q('spb').setValueAtTime((tb(b1) - t) / Math.max(1e-6, b1 - b0), t); Q('run').setValueAtTime(1, t); },
        rest() { if (!w) return; let r = w.parameters.get('run'); r.cancelScheduledValues(ctx.currentTime); r.setValueAtTime(0, ctx.currentTime); }
    });
    const DICE = v => '#' + String(Math.round(v * 99)).padStart(2, '0');
    const FAULTS = [['·', 'nothing', '#333'], ['RPT', 'repeat', '#ff3b6b'], ['REV', 'reverse', '#b06bff'], ['STP', 'tape stop', '#ff9a2a'], ['½', 'half speed', '#3bb0ff'], ['2×', 'double', '#3bffd0'], ['GTE', 'gate', '#e8e8e8'], ['CRS', 'crush', '#c8ff3b'], ['SCR', 'scratch', '#ff5ad8'], ['SHF', 'shuffle', '#ffe03b'], ['OCT', 'octave up', '#7dff9a'], ['DRP', 'drop', '#4a6bff']];
    const BROKE = [['', '#000'], ['CUT', '#ff2a40'], ['BZZ', '#ffd23b'], ['SKP', '#3bc8ff'], ['SPT', '#ff7ad8'], ['WRB', '#9dff6b']];

    const BGC = new Map();
    const S = {
        bg(x, w, h) {
            let k = w + 'x' + h, c = BGC.get(k);
            if (!c) { c = document.createElement('canvas'); c.width = w; c.height = h; let g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#070a09'); gr.addColorStop(1, '#020303'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
                g.strokeStyle = 'rgba(140,255,190,0.035)'; g.lineWidth = 1; for (let i = 1; i < 16; i++) { if (i % 2 === 0) continue; g.beginPath(); g.moveTo(Math.round(i * w / 16) + 0.5, 0); g.lineTo(Math.round(i * w / 16) + 0.5, h); g.stroke(); }
                g.strokeStyle = 'rgba(140,255,190,0.075)'; for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(Math.round(i * w / 8) + 0.5, 0); g.lineTo(Math.round(i * w / 8) + 0.5, h); g.stroke(); } for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(0, Math.round(i * h / 4) + 0.5); g.lineTo(w, Math.round(i * h / 4) + 0.5); g.stroke(); }
                let v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = v; g.fillRect(0, 0, w, h);
                let gl = g.createLinearGradient(0, 0, 0, h * 0.45); gl.addColorStop(0, 'rgba(255,255,255,0.045)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.fillRect(0, 0, w, h * 0.45);
                if (BGC.size > 40) BGC.clear(); BGC.set(k, c); }
            x.drawImage(c, 0, 0);
        },
        line(x, pts, col, wd) { if (!pts.length) return; wd = wd || 1.8; x.lineJoin = 'round'; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]));
            x.strokeStyle = col; x.globalAlpha = 0.18; x.lineWidth = wd * 4; x.stroke(); x.globalAlpha = 0.35; x.lineWidth = wd * 2; x.stroke(); x.globalAlpha = 1; x.lineWidth = wd; x.stroke(); x.lineWidth = 1; },
        txt(x, s, X0, Y, col, sz) { x.font = 'bold ' + (sz || 9) + 'px Courier New'; x.fillStyle = 'rgba(0,0,0,0.6)'; x.fillText(s, X0 + 1, Y + 1); x.fillStyle = col || '#9dffc8'; x.fillText(s, X0, Y); },
        logx: (f, w) => Math.log(f / 20) / Math.log(1000) * w,
        spec(x, an, w, h, col) {
            if (!an) return; let d = an._d || (an._d = new Uint8Array(an.frequencyBinCount)); an.getByteFrequencyData(d);
            let sr = an.context.sampleRate, bins = d.length, sm = an._s && an._s.length === w ? an._s : (an._s = new Float32Array(w));
            for (let X0 = 0; X0 < w; X0++) { let b0 = Math.min(bins - 1, Math.floor(20 * Math.pow(1000, X0 / w) / (sr / 2) * bins)), b1 = Math.min(bins - 1, Math.max(b0, Math.floor(20 * Math.pow(1000, (X0 + 1) / w) / (sr / 2) * bins))), v = 0; for (let b = b0; b <= b1; b++) v = Math.max(v, d[b]); v /= 255; sm[X0] = Math.max(v, sm[X0] * 0.88 + v * 0.12); }
            x.beginPath(); x.moveTo(0, h); for (let X0 = 0; X0 < w; X0++) x.lineTo(X0, h - sm[X0] * h); x.lineTo(w, h); x.closePath();
            x.fillStyle = col; x.globalAlpha = 0.16; x.fill(); x.globalAlpha = 0.45; x.strokeStyle = col; x.lineWidth = 1; x.stroke(); x.globalAlpha = 1;
        },
        meter(x, an, w, h, col) { if (!an) return 0; let d = an._f || (an._f = new Float32Array(an.fftSize)); an.getFloatTimeDomainData(d); let p = 0; for (let i = 0; i < d.length; i += 4) p = Math.max(p, Math.abs(d[i])); return p; }
    };

    function wob(ctx, b) {
        let o = ctx.createOscillator(), cs = ctx.createConstantSource ? ctx.createConstantSource() : null, inv = b.g(1), out = b.g(0), shape = -1, step = 1;
        o.connect(inv); if (cs) { cs.offset.value = 0; cs.connect(out); cs.start(); }
        inv.connect(out); o.start();
        return {
            out, o, cs,
            set(sh, beats, bpm) {
                shape = sh; step = beats;
                o.type = ['sine', 'triangle', 'sawtooth', 'sawtooth', 'square', 'sine'][sh];
                inv.gain.value = sh === 5 ? 0 : sh === 3 ? -1 : 1;
                if (beats) o.frequency.value = bpm / 60 / beats;
            },
            sched(b0, b1, tb) { if (shape !== 5 || !cs || !step) return; let st = step / 4; for (let k = Math.ceil(b0 / st - 1e-9); k * st < b1; k++) { let h = Math.imul(k ^ 0x9e3779b9, 2654435761); h ^= h >>> 15; h = Math.imul(h, 2246822519); h ^= h >>> 13; cs.offset.setValueAtTime(((h >>> 0) / 4294967296) * 2 - 1, tb(k * st)); } },
            stop() { try { o.stop(); if (cs) cs.stop(); } catch (e) {} }
        };
    }

    const LIST = [
        { id: 'sieve', jp: '篩', en: 'SIEVE', sub: 'filter. clean, ladder, acid squelch, comb, MS-20, 303 diode, formant, phaser, dirty, + a tempo synced wobble', face: 'steel',
            p: [['mode', 'KIND', 0, F.pick(['LOW 12', 'LOW 24', 'LADDER', 'SQUELCH', 'HIGH', 'BAND', 'NOTCH', 'COMB', 'MS-20 LOW', 'MS-20 HIGH', 'DIODE 303', 'FORMANT', 'PHASER', 'DIRTY LOW'])], ['cut', 'CUT', 0.75, F.hz(20, 20000)], ['res', 'RES', 0.2, F.pct], ['drive', 'DRIVE', 0, F.pct],
                ['rate', 'WOBBLE', 0, F.pick(SYNC.map(s => s[0]))], ['shape', 'SHAPE', 0, F.pick(['sine', 'tri', 'saw up', 'saw down', 'square', 'random'])], ['depth', 'AMOUNT', 0.3, F.pct], ['mix', 'MIX', 1, F.pct]],
            ver: 2, fix(p) { if ((p._v || 1) < 2) { if (p.mode != null) p.mode = (Math.min(7, Math.floor(p.mode * 8)) + 0.5) / 14; p._v = 2; } return p; },
            make(ctx) {
                let b = box(ctx), sh = ctx.createWaveShaper(), W = wob(ctx, b), mode = -1, parts = [], M = {}, wk = !!ctx._nbwk, an = tap(ctx, b.out, 2048);
                sh.oversample = '2x'; b.in.connect(sh);
                function build(m) {
                    if (M.lad) bury([M.lad]); if (M.sv) bury([M.sv]); parts.forEach(n => { try { n.disconnect(); } catch (e) {} }); parts = []; try { sh.disconnect(); W.out.disconnect(); } catch (e) {}
                    M = { m };
                    if ((m === 2 || m === 3) && wk) {
                        let L = wkNode(ctx, 'nb-ladder'); if (L) { M.lad = L; L.parameters.get('mode').value = m === 3 ? 1 : 0; sh.connect(L); L.connect(b.wet); M.ldHz = b.g(0); W.out.connect(M.ldHz); M.ldHz.connect(L.parameters.get('cut')); parts.push(L, M.ldHz); return; }
                    }
                    if (m >= 8 && wk) {
                        let L = wkNode(ctx, 'nb-sieve'); if (L) { M.sv = L; L.parameters.get('type').value = [10, 11, 12, 13, 14, 9][m - 8]; sh.connect(L); L.connect(b.wet); M.ldHz = b.g(0); W.out.connect(M.ldHz); M.ldHz.connect(L.parameters.get('cut')); parts.push(L, M.ldHz); return; }
                    }
                    if (m >= 8) m = m === 9 ? 4 : m === 11 ? 5 : m === 12 ? 6 : 1;
                    if (m === 7) {
                        let d = ctx.createDelay(0.06), fb = b.g(0.7), lp = bq(ctx, 'lowpass', 9000), ld = b.g(0);
                        sh.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); d.connect(b.wet); W.out.connect(ld); ld.connect(d.delayTime);
                        Object.assign(M, { d, fb, ld }); parts.push(d, fb, lp, ld); return;
                    }
                    let type = ['lowpass', 'lowpass', 'lowpass', 'lowpass', 'highpass', 'bandpass', 'notch'][m], f1 = bq(ctx, type, 8000), f2 = bq(ctx, m === 1 || m === 2 || m === 3 ? type : 'allpass', 8000), ld = b.g(0);
                    sh.connect(f1); f1.connect(f2); f2.connect(b.wet); W.out.connect(ld); ld.connect(f1.detune); ld.connect(f2.detune);
                    Object.assign(M, { f1, f2, ld }); parts.push(f1, f2, ld);
                }
                let dk = -1, P0 = null;
                const I = { in: b.in, out: b.out, wk: !wk,
                    set(p, now, info, skip) {
                        P0 = p; let m = idx(p.mode, 14); if (m !== mode) { mode = m; build(m); }
                        let S2 = setter(ctx, now, skip), f = expo(20, 20000, p.cut), beats = SYNC[idx(p.rate, SYNC.length)][1];
                        W.set(idx(p.shape, 6), beats, info.bpm);
                        let k = Math.round(p.drive * 40); if (k !== dk) { dk = k; sh.curve = k ? curveOf(x => Math.tanh(x * (1 + p.drive * 8)) / Math.tanh(1 + p.drive * 8)) : null; }
                        if (M.sv) { S2('cut', M.sv.parameters.get('cut'), f); M.sv.parameters.get('res').value = p.res; S2('depth', M.ldHz.gain, beats ? f * p.depth * 0.9 : 0); }
                        else if (M.lad) { S2('cut', M.lad.parameters.get('cut'), f); S2('res', M.lad.parameters.get('res'), p.res * 1.12); M.lad.parameters.get('drive').value = 1 + p.drive * 6; S2('depth', M.ldHz.gain, beats ? f * p.depth * 0.9 : 0); }
                        else if (M.d) { S2('cut', M.d.delayTime, 1 / f); M.fb.gain.value = 0.3 + p.res * 0.68; S2('depth', M.ld.gain, beats ? (1 / f) * p.depth * 0.5 : 0); }
                        else { S2('cut', M.f1.frequency, f); S2('cut', M.f2.frequency, f); let q = M.f1.type === 'notch' ? 0.3 + p.res * 10 : 0.5 + p.res * 18; S2('res', M.f1.Q, q); S2('res', M.f2.Q, Math.min(q, 6)); S2('depth', M.ld.gain, beats ? p.depth * 2400 : 0); }
                        S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix);
                    },
                    get ap() {
                        let a = { mix: mixAp(b) };
                        if (M.sv) a.cut = [[M.sv.parameters.get('cut'), v => expo(20, 20000, v)]];
                        else if (M.lad) { a.cut = [[M.lad.parameters.get('cut'), v => expo(20, 20000, v)]]; a.res = [[M.lad.parameters.get('res'), v => v * 1.12]]; }
                        else if (M.d) a.cut = [[M.d.delayTime, v => 1 / expo(20, 20000, v)]];
                        else { a.cut = [[M.f1.frequency, v => expo(20, 20000, v)], [M.f2.frequency, v => expo(20, 20000, v)]]; a.res = [[M.f1.Q, v => 0.5 + v * 18]]; }
                        return a;
                    },
                    sched: (b0, b1, tb) => W.sched(b0, b1, tb),
                    draw(x, w, h, D) {
                        S.bg(x, w, h); S.spec(x, an, w, h, D.B); if (!P0) return;
                        let pts = [], f0 = expo(20, 20000, P0.cut), m = mode, q = P0.res;
                        if (m >= 8 && M.sv) { const FM = [[300, 870, 2240], [570, 840, 2410], [730, 1090, 2440], [530, 1840, 2480], [270, 2290, 3010]], u = clamp(Math.log(f0 / 30) / Math.log(600), 0, 1) * 4, iu = Math.min(3, Math.floor(u)), fu = u - iu, Fq = 0.6 + q * 6;
                            for (let i = 0; i < w; i++) { let f = 20 * Math.pow(1000, i / (w - 1)), r = f / f0, a;
                                if (m === 9) a = r * r / Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(r / Fq, 2));
                                else if (m === 11) { a = 0; for (let j = 0; j < 3; j++) { let fc = FM[iu][j] + (FM[iu + 1][j] - FM[iu][j]) * fu, Q = fc / Math.max(30, fc * (0.32 - 0.29 * q)), rr = f / fc - fc / f; a += [1, 0.5, 0.3][j] / Math.sqrt(1 + Q * Q * rr * rr); } a *= 1.6; }
                                else if (m === 12) { a = 1; [0.5, 0.75, 1, 1.4, 2, 2.8].forEach(sp => { let rr = f / (f0 * sp); a *= Math.abs(1 - rr * rr) / Math.sqrt(Math.pow(1 - rr * rr, 2) + rr * rr * 0.6) * 0.5 + 0.5; }); }
                                else a = Math.min(1 / Math.sqrt(Math.pow(1 - r * r, 2) * (m === 10 ? 1.4 : 1) + Math.pow(r / Fq, 2)) * (m === 10 ? Math.pow(Math.max(1, r), -1.2) : 1), 1 + q * 8);
                                pts.push([i, clamp(h * 0.55 - 20 * Math.log10(Math.max(1e-4, a)) / 24 * h * 0.45, 1, h - 1)]); }
                            S.line(x, pts, D.A); S.txt(x, ['LOW 12', 'LOW 24', 'LADDER', 'SQUELCH', 'HIGH', 'BAND', 'NOTCH', 'COMB', 'MS-20 LOW', 'MS-20 HIGH', 'DIODE 303', 'FORMANT', 'PHASER', 'DIRTY LOW'][m], 6, 11, D.A); return; }
                        if (M.f1) { let fr = new Float32Array(w); for (let i = 0; i < w; i++) fr[i] = 20 * Math.pow(1000, i / (w - 1)); let r = respOf([M.f1, M.f2], fr); for (let i = 0; i < w; i++) pts.push([i, clamp(h * 0.55 - 20 * Math.log10(Math.max(1e-4, r[i])) / 24 * h * 0.45, 1, h - 1)]); }
                        else for (let i = 0; i < w; i++) { let f = 20 * Math.pow(1000, i / (w - 1)), y;
                            if (m === 7) y = h * 0.55 - Math.pow(Math.abs(Math.cos(Math.PI * f / f0)), 6) * h * 0.3 * (0.4 + q);
                            else { let r = f / f0, lp = 1 / Math.sqrt(Math.pow(1 - r * r, 2) * 1 + Math.pow(r / (0.6 + q * 6), 2)); y = h * 0.55 - 20 * Math.log10(Math.max(1e-4, Math.pow(Math.min(lp, 1 + q * 8), 2))) / 24 * h * 0.45; }
                            pts.push([i, clamp(y, 1, h - 1)]); }
                        S.line(x, pts, D.A);
                        S.txt(x, ['LOW 12', 'LOW 24', 'LADDER', 'SQUELCH', 'HIGH', 'BAND', 'NOTCH', 'COMB', 'MS-20 LOW', 'MS-20 HIGH', 'DIODE 303', 'FORMANT', 'PHASER', 'DIRTY LOW'][m] + (M.lad || ((m < 2 || m > 3) && m < 8) ? '' : ' (clean, no worklet)'), 6, 11, D.A);
                        if (SYNC[idx(P0.rate, SYNC.length)][1]) { let ph = (D.pos || 0) / SYNC[idx(P0.rate, SYNC.length)][1] % 1; x.fillStyle = D.B; x.beginPath(); x.arc(6 + ph * (w - 12), h - 6, 3, 0, 7); x.fill(); }
                    },
                    kill() { W.stop(); if (M.lad) bury([M.lad]); if (M.sv) bury([M.sv]); stopAll(b)(); } };
                return I;
            } },
        { id: 'scalpel', jp: '刃', en: 'SCALPEL', sub: 'eq. drag the dots (scroll on one = width). the two mid bands can be DYNAMIC: they only cut or boost when that range gets loud, from ABOVE. WHERE puts a band on the MID or SIDE only', face: 'enamel',
            nodes: [{ f: 'lcut', fr: [20, 1000], label: 'C' }, { f: 'lf', g: 'lg', fr: [30, 500], label: 'L' }, { f: 'mf', g: 'mg', q: 'mq', fr: [80, 6000], label: '1' }, { f: 'm2f', g: 'm2g', q: 'm2q', fr: [300, 14000], label: '2' }, { f: 'hf', g: 'hg', fr: [1500, 16000], label: 'H' }, { f: 'hcut', fr: [1500, 22000], label: 'C' }],
            p: [['lcut', 'LOW CUT', 0, F.hz(20, 1000)], ['lf', 'LOW AT', 0.4, F.hz(30, 500)], ['lg', 'LOW', 0.5, F.db(-15, 15)], ['mf', 'MID 1 AT', 0.4, F.hz(80, 6000)], ['mg', 'MID 1', 0.5, F.db(-15, 15)], ['mq', 'MID 1 WIDTH', 0.4, F.pick(['wide', 'wide', 'medium', 'medium', 'tight', 'needle'])],
                ['m2f', 'MID 2 AT', 0.55, F.hz(300, 14000)], ['m2g', 'MID 2', 0.5, F.db(-15, 15)], ['m2q', 'MID 2 WIDTH', 0.4, F.pick(['wide', 'wide', 'medium', 'medium', 'tight', 'needle'])], ['hf', 'HIGH AT', 0.5, F.hz(1500, 16000)], ['hg', 'HIGH', 0.5, F.db(-15, 15)], ['hcut', 'HIGH CUT', 1, F.hz(1500, 22000)],
                ['d1', 'MID 1 DYNAMIC', 0.5, v => Math.abs(v - 0.5) < 0.02 ? 'off' : ((v - 0.5) * 30 > 0 ? '+' : '') + ((v - 0.5) * 30).toFixed(1) + 'dB'], ['t1', 'MID 1 ABOVE', 0.6, F.db(-60, 0)], ['d2', 'MID 2 DYNAMIC', 0.5, v => Math.abs(v - 0.5) < 0.02 ? 'off' : ((v - 0.5) * 30 > 0 ? '+' : '') + ((v - 0.5) * 30).toFixed(1) + 'dB'], ['t2', 'MID 2 ABOVE', 0.6, F.db(-60, 0)],
                ['lw', 'LOW WHERE', 0, F.pick(['BOTH', 'MID', 'SIDE'])], ['m1w', 'MID 1 WHERE', 0, F.pick(['BOTH', 'MID', 'SIDE'])], ['m2w', 'MID 2 WHERE', 0, F.pick(['BOTH', 'MID', 'SIDE'])], ['hw', 'HIGH WHERE', 0, F.pick(['BOTH', 'MID', 'SIDE'])]],
            make(ctx) {
                let b = box(ctx), hp = bq(ctx, 'highpass', 20, 0.7), hp2 = bq(ctx, 'highpass', 20, 0.7), ls = bq(ctx, 'lowshelf', 120), pk = bq(ctx, 'peaking', 1000, 1), pk2 = bq(ctx, 'peaking', 3000, 1), hs = bq(ctx, 'highshelf', 6000), lp = bq(ctx, 'lowpass', 22000, 0.7);
                let stG = b.g(1), msG = b.g(0), up = ctx.createGain(); up.channelCount = 2; up.channelCountMode = 'explicit'; up.channelInterpretation = 'speakers';
                let sp = ctx.createChannelSplitter(2), mg2 = ctx.createChannelMerger(2), Mi = b.g(1), Si = b.g(1), inv = b.g(-1), lM = b.g(0.5), rM = b.g(0.5), lS = b.g(0.5), rS = b.g(-0.5);
                const cp = () => [bq(ctx, 'lowshelf', 120), bq(ctx, 'peaking', 1000, 1), bq(ctx, 'peaking', 3000, 1), bq(ctx, 'highshelf', 6000)], MB = cp(), SB = cp();
                b.in.connect(hp); hp.connect(hp2); hp2.connect(stG); stG.connect(ls); ls.connect(pk); pk.connect(pk2); pk2.connect(hs); hs.connect(lp); lp.connect(b.wet);
                hp2.connect(msG); msG.connect(up); up.connect(sp); sp.connect(lM, 0); sp.connect(rM, 1); sp.connect(lS, 0); sp.connect(rS, 1); lM.connect(Mi); rM.connect(Mi); lS.connect(Si); rS.connect(Si);
                [Mi].concat(MB).reduce((p2, n2) => { p2.connect(n2); return n2; }); [Si].concat(SB).reduce((p2, n2) => { p2.connect(n2); return n2; });
                MB[3].connect(mg2, 0, 0); MB[3].connect(mg2, 0, 1); SB[3].connect(mg2, 0, 0); SB[3].connect(inv); inv.connect(mg2, 0, 1); mg2.connect(lp);
                let msK = '';
                let an = tap(ctx, b.out, 4096), anI = tap(ctx, b.in, 4096), P0 = null, list = [hp, hp2, ls, pk, pk2, hs, lp];
                let dyn = [pk, pk2].map(f2 => { let det = bq(ctx, 'bandpass', 1000, 1), fo = ctx._nbwk ? wkNode(ctx, 'nb-follow', 1) : null, cv = ctx.createWaveShaper(), k = '';
                    if (fo) { b.in.connect(det); det.connect(fo); fo.connect(cv); cv.connect(f2.gain); fo.parameters.get('att').value = 0.004; fo.parameters.get('rel').value = 0.12; } return { det, fo, cv, k }; });
                const fr = (k, v) => { let n = LIST[1].nodes.find(z => z.f === k); return expo(n.fr[0], n.fr[1], v); };
                return { in: b.in, out: b.out, wk: !dyn[0].fo,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip);
                        let off = p.lcut < 0.005, SX = exact(ctx, now, skip); hp.type = hp2.type = 'highpass';
                        if (off) { SX('lcut', hp.frequency, 0); SX('lcut', hp2.frequency, 0); } else { S2('lcut', hp.frequency, fr('lcut', p.lcut)); S2('lcut', hp2.frequency, fr('lcut', p.lcut)); } S2('lf', ls.frequency, fr('lf', p.lf)); S2('lg', ls.gain, -15 + p.lg * 30);
                        S2('mf', pk.frequency, fr('mf', p.mf)); S2('mg', pk.gain, -15 + p.mg * 30); S2('mq', pk.Q, expo(0.3, 12, p.mq));
                        S2('m2f', pk2.frequency, fr('m2f', p.m2f)); S2('m2g', pk2.gain, -15 + p.m2g * 30); S2('m2q', pk2.Q, expo(0.3, 12, p.m2q));
                        [[p.d1, p.t1, 'mf', 'mq', p.mf, p.mq], [p.d2, p.t2, 'm2f', 'm2q', p.m2f, p.m2q]].forEach(([dd, tt, fk, qk, fv, qv], i) => { let D2 = dyn[i]; if (!D2.fo) return; dd = dd == null ? 0.5 : dd; tt = tt == null ? 0.6 : tt;
                            D2.det.frequency.value = fr(fk, fv); D2.det.Q.value = expo(0.3, 12, qv); let key = Math.round(dd * 60) + ':' + Math.round(tt * 60); if (key === D2.k) return; D2.k = key;
                            let amt = (dd - 0.5) * 30, thr = -60 + tt * 60; D2.cv.curve = Math.abs(dd - 0.5) < 0.02 ? curveOf(() => 0, 16) : curveOf(x => { let lv = 20 * Math.log10(Math.max(1e-6, x)); return clamp((lv - thr) / 18, 0, 1) * amt / 15; }, 4096);
                            D2.cv.curve = D2.cv.curve.map(v => v * 15); });
                        S2('hf', hs.frequency, fr('hf', p.hf)); S2('hg', hs.gain, -15 + p.hg * 30); lp.type = 'lowpass'; if (p.hcut > 0.995) SX('hcut', lp.frequency, ctx.sampleRate / 2); else S2('hcut', lp.frequency, fr('hcut', p.hcut));
                        let W = [p.lw, p.m1w, p.m2w, p.hw].map(v => idx(v || 0, 3)), ms = W.some(v => v > 0), G = [-15 + p.lg * 30, -15 + p.mg * 30, -15 + p.m2g * 30, -15 + p.hg * 30];
                        stG.gain.value = ms ? 0 : 1; msG.gain.value = ms ? 1 : 0;
                        [MB, SB].forEach((B, side) => { B[0].frequency.value = fr('lf', p.lf); B[1].frequency.value = fr('mf', p.mf); B[1].Q.value = expo(0.3, 12, p.mq); B[2].frequency.value = fr('m2f', p.m2f); B[2].Q.value = expo(0.3, 12, p.m2q); B[3].frequency.value = fr('hf', p.hf);
                            B.forEach((n2, i) => { let on = W[i] === 0 || W[i] === (side ? 2 : 1); S2(['lg', 'mg', 'm2g', 'hg'][i], n2.gain, on ? G[i] : 0); }); });
                        let k2 = W.join(); if (k2 !== msK) { msK = k2; dyn.forEach((D2, i) => { if (!D2.fo) return; try { D2.cv.disconnect(); } catch (e) {} D2.cv.connect([pk, pk2][i].gain); let wi = W[i + 1]; if (wi !== 2) D2.cv.connect(MB[i + 1].gain); if (wi !== 1) D2.cv.connect(SB[i + 1].gain); }); }
                    },
                    get ap() { let W = P0 ? [P0.lw, P0.m1w, P0.m2w, P0.hw].map(v => idx(v || 0, 3)) : [0, 0, 0, 0], on = (i, side) => W[i] === 0 || W[i] === (side ? 2 : 1), gg = (n2, i) => [[n2, v => -15 + v * 30]].concat(on(i, 0) ? [[MB[i].gain, v => -15 + v * 30]] : []).concat(on(i, 1) ? [[SB[i].gain, v => -15 + v * 30]] : []);
                        return { lcut: [[hp.frequency, v => fr('lcut', v)], [hp2.frequency, v => fr('lcut', v)]], lg: gg(ls, 0), mf: [[pk.frequency, v => fr('mf', v)], [MB[1].frequency, v => fr('mf', v)], [SB[1].frequency, v => fr('mf', v)]], mg: gg(pk, 1), m2g: gg(pk2, 2), hg: gg(hs, 3), hcut: [[lp.frequency, v => fr('hcut', v)]] }; },
                    resp: f => respOf(list, f),
                    draw(x, w, h, D) {
                        S.bg(x, w, h); S.spec(x, anI, w, h, 'rgba(255,255,255,0.55)'); S.spec(x, an, w, h, D.B);
                        [100, 1000, 10000].forEach(f => S.txt(x, f >= 1000 ? f / 1000 + 'k' : f, S.logx(f, w) + 2, h - 3, 'rgba(200,255,220,0.35)'));
                        let q = new Float32Array(w); for (let i = 0; i < w; i++) q[i] = 20 * Math.pow(1000, i / (w - 1));
                        let msOn = P0 && [P0.lw, P0.m1w, P0.m2w, P0.hw].some(v => idx(v || 0, 3) > 0), curve = L2 => { let m = respOf(L2, q), pts = []; for (let i = 0; i < w; i++) pts.push([i, clamp(h / 2 - 20 * Math.log10(Math.max(1e-4, m[i])) / 18 * (h / 2), 1, h - 1)]); return pts; };
                        let pts = curve(msOn ? [hp, hp2].concat(MB, [lp]) : list);
                        x.fillStyle = D.A; x.globalAlpha = 0.12; x.beginPath(); x.moveTo(0, h / 2); pts.forEach(p => x.lineTo(p[0], p[1])); x.lineTo(w, h / 2); x.fill(); x.globalAlpha = 1;
                        S.line(x, pts, D.A, 2);
                        if (msOn) { let sp2 = curve([hp, hp2].concat(SB, [lp])); x.setLineDash([3, 3]); x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = 1.3; x.beginPath(); sp2.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke(); x.setLineDash([]); S.txt(x, 'MID ━ SIDE ┅', w - 72, 11, D.A); }
                        if (!P0) return;
                        const WK = { lf: 'lw', mf: 'm1w', m2f: 'm2w', hf: 'hw' };
                        LIST[1].nodes.forEach(n => { let X0 = S.logx(fr(n.f, P0[n.f]), w), Y = n.g ? h / 2 - ((-15 + P0[n.g] * 30) / 18) * (h / 2) : h / 2, wi = WK[n.f] ? idx(P0[WK[n.f]] || 0, 3) : 0; x.fillStyle = D.hot === n.f ? '#fff' : D.A; x.beginPath(); x.arc(X0, Y, 5, 0, 7); x.fill(); x.fillStyle = '#000'; x.font = 'bold 8px Courier New'; x.fillText(n.label, X0 - 2.5, Y + 3);
                            if (wi) { x.fillStyle = D.A; x.font = 'bold 7px Courier New'; x.fillText(wi === 1 ? 'M' : 'S', X0 + 5, Y - 4); } });
                    },
                    kill: () => { bury(dyn.map(d => d.fo)); stopAll(b)(); } };
            } },
        { id: 'vice', jp: '万力', en: 'VICE', sub: 'compressor. CLEAN, GLUE, SLOW, FAST, VARI-MU, UPWARD', face: 'rubber',
            p: [['mode', 'KIND', 0.5 / 6, F.pick(['CLEAN', 'GLUE', 'SLOW', 'FAST', 'VARI-MU', 'UPWARD'])], ['thr', 'THRESHOLD', 0.75, F.db(-60, 0)], ['ratio', 'RATIO', 0.15, F.x(1, 20)], ['att', 'ATTACK', 0.3, F.ms(0.0001, 0.1, 2)], ['rel', 'RELEASE', 0.3, F.ms(0.02, 1.2, 1.5)],
                ['make', 'MAKEUP', 0, F.db(0, 24)], ['sat', 'COLOUR', 0, F.pct], ['char', 'CHARACTER', 0, F.pick(['as KIND', 'VOCAL', 'MASTER', 'PUNCH', 'SMASH'])], ['mix', 'MIX', 1, F.pct],
                ['ctype', 'COLOUR KIND', 0, F.pick(['WARM', 'TUBE', 'DIODE', 'BRIGHT'])], ['cpos', 'COLOUR WHERE', 0, F.pick(['after', 'before'])], ['sc', 'SIDE LOW CUT', 0, v => v < 0.02 ? 'off' : Math.round(expo(30, 600, v)) + 'hz'],
                ['look', 'LOOK AHEAD', 0.6, v => v < 0.02 ? 'off' : (v * 10).toFixed(1) + 'ms'], ['auto', 'AUTO RELEASE', 0, F.pick(['off', 'on'])], ['autog', 'AUTO GAIN', 0, F.pick(['on', 'off'])]],
            ver: 2, fix(p) { if ((p._v || 1) < 2) { if (p.mode != null) p.mode = (Math.min(3, Math.floor(p.mode * 4)) + 0.5) / 6; p._v = 2; } return p; },
            idle(p) { let r = {}, m = idx(p.mode, 6); if ((p.sat || 0) < 0.01) { r.ctype = 'COLOUR is at 0'; r.cpos = 'COLOUR is at 0'; } if (m === 2) r.auto = 'SLOW has its own two speed release'; return r; },
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-vice') : null, c = null, sh = null, mk = b.g(1), lastK = -1, P0 = null, H = { i: [], o: [], g: [], g2: 0 };
                if (w) { b.in.connect(w); w.connect(mk); mk.connect(b.wet); w.port.onmessage = e => { let d = e.data; if (!d || d.i == null) return; H.i.push(d.i); H.o.push(d.o); H.g.push(d.g); H.g2 = d.g2; if (H.i.length > 240) { H.i.shift(); H.o.shift(); H.g.shift(); } }; }
                else { c = ctx.createDynamicsCompressor(); sh = ctx.createWaveShaper(); sh.oversample = '2x'; b.in.connect(c); c.connect(sh); sh.connect(mk); mk.connect(b.wet); }
                const Wp = n => w.parameters.get(n);
                return { in: b.in, out: b.out, c, wk: !w,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), m = idx(p.mode, 6), att = 0.0001 + Math.pow(p.att, 2) * 0.1, rel = 0.02 + Math.pow(p.rel, 1.5) * 1.18, ratio = 1 + p.ratio * 19, knee = 6;
                        if (m === 1) { ratio = [2, 4, 10][idx(p.ratio, 3)]; att = [0.0001, 0.0003, 0.001, 0.003, 0.01, 0.03][idx(p.att, 6)]; rel = [0.1, 0.3, 0.6, 1.2][idx(p.rel, 4)]; knee = 4; }
                        if (m === 2) { att = 0.01 + p.att * 0.04; rel = 0.3 + p.rel * 1.5; knee = 24; ratio = 2 + p.ratio * 4; }
                        if (m === 3) { att = 0.00002 + p.att * 0.002; rel = 0.03 + p.rel * 0.3; knee = 0; ratio = 8 + p.ratio * 12; }
                        if (m === 4) { att = 0.008 + p.att * 0.05; rel = 0.25 + p.rel * 1.6; knee = 18; ratio = 1.5 + p.ratio * 5; }
                        if (m === 5) { knee = 0; ratio = 1.2 + p.ratio * 3.8; }
                        let ch = idx(p.char == null ? 0 : p.char, 5), extra = 0;
                        if (ch === 1) { att = 0.002 + p.att * 0.006; rel = 0.05 + p.rel * 0.12; knee = 10; ratio = 3 + p.ratio * 3; extra = 0.05; }
                        if (ch === 2) { att = 0.02 + p.att * 0.03; rel = 0.25 + p.rel * 0.6; knee = 14; ratio = 1.3 + p.ratio * 1.5; }
                        if (ch === 3) { att = 0.02 + p.att * 0.02; rel = 0.04 + p.rel * 0.1; knee = 3; ratio = 4 + p.ratio * 6; extra = 0.06; }
                        if (ch === 4) { att = 0.00005; rel = 0.04 + p.rel * 0.08; knee = 0; ratio = 20; extra = 0.3; }
                        let thr = -60 + p.thr * 60, col = Math.min(1, (p.sat || 0) + extra + (m === 3 ? 0.25 : m === 1 ? 0.05 : 0));
                        // so old songs dont suddenly get louder
                        let auto = idx(p.autog || 0, 2) === 0 && m !== 5 ? -0.6 * Math.min(0, (thr + knee / 2) * (1 - 1 / ratio)) : 0;
                        if (w) { S2('thr', Wp('thr'), thr + (m === 5 ? 0 : knee / 2)); S2('ratio', Wp('ratio'), ratio); S2('att', Wp('att'), att); S2('rel', Wp('rel'), rel); Wp('knee').value = knee; Wp('style').value = m;
                            Wp('ctype').value = idx(p.ctype || 0, 4); Wp('cdrive').value = col; Wp('cpost').value = idx(p.cpos || 0, 2) === 0 ? 1 : 0; Wp('sc').value = (p.sc || 0) < 0.02 ? 0 : expo(30, 600, p.sc);
                            Wp('look').value = (p.look || 0) < 0.02 ? 0 : p.look * 0.01; Wp('auto').value = idx(p.auto || 0, 2); S2('make', mk.gain, db2g(p.make * 24 + auto)); Wp('make').value = 0; Wp('mix').value = 1; }
                        else { S2('thr', c.threshold, thr); S2('ratio', c.ratio, Math.min(20, ratio)); S2('att', c.attack, att); S2('rel', c.release, rel); c.knee.value = knee;
                            let k = Math.round(col * 40); if (k !== lastK) { lastK = k; let d = 1 + k / 40 * 6; sh.curve = k ? curveOf(x => Math.tanh(x * d) / Math.tanh(d) * 0.98 + x * 0.02) : null; } S2('make', mk.gain, db2g(p.make * 24)); }
                        S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix);
                    },
                    get ap() { return w ? { thr: [[Wp('thr'), v => -60 + v * 60]], make: [[mk.gain, v => db2g(v * 24)]], mix: mixAp(b) } : { thr: [[c.threshold, v => -60 + v * 60]], make: [[mk.gain, v => db2g(v * 24)]], mix: mixAp(b) }; },
                    gr: () => w ? -H.g2 : c.reduction,
                    lat: () => w ? Math.round(Wp('look').value * ctx.sampleRate) / ctx.sampleRate : 0.006,
                    draw(x, w2, h, D) {
                        S.bg(x, w2, h); if (!P0) return;
                        let cw = 64, gw = w2 - cw - 8, Y = db => 12 + Math.min(1, Math.max(0, -db / 48)) * (h - 16), N = 240, m = idx(P0.mode, 6), thr = -60 + P0.thr * 60;
                        if (!w) { let gr = -c.reduction; H.i.push(0); H.o.push(0); H.g.push(gr); if (H.i.length > N) { H.i.shift(); H.o.shift(); H.g.shift(); } }
                        let k0 = N - H.i.length, dx = gw / N, db = v => 20 * Math.log10(v + 1e-6);
                        x.fillStyle = 'rgba(200,200,210,0.22)'; x.beginPath(); x.moveTo(k0 * dx, h); H.i.forEach((v, k) => x.lineTo((k0 + k) * dx, Y(db(v)))); x.lineTo(gw, h); x.fill();
                        if (w) S.line(x, H.o.map((v, k) => [(k0 + k) * dx, Y(db(v))]), D.A, 1.2);
                        x.fillStyle = '#ff3355'; H.g.forEach((g, k) => { if (g > 0.1) { x.globalAlpha = 0.5; x.fillRect((k0 + k) * dx, 12, Math.max(1, dx), Math.min(h - 16, g / 24 * (h - 16))); } }); x.globalAlpha = 1;
                        x.strokeStyle = 'rgba(255,255,255,0.25)'; x.setLineDash([2, 3]); x.beginPath(); x.moveTo(0, Y(thr)); x.lineTo(gw, Y(thr)); x.stroke(); x.setLineDash([]);
                        let ox = gw + 6, oy = 12, sz = Math.min(cw, h - 16), r = 1 + P0.ratio * 19, kn = 6; x.strokeStyle = 'rgba(255,255,255,0.12)'; x.strokeRect(ox + 0.5, oy + 0.5, sz, sz);
                        let cp = []; for (let q = 0; q <= 30; q++) { let xin = -60 + q * 2, y = m === 5 ? (xin < thr && xin > -70 ? thr + (xin - thr) / r : xin) : (xin > thr ? thr + (xin - thr) / r : xin); cp.push([ox + (xin + 60) / 60 * sz, oy + sz - (Math.max(-60, y) + 60) / 60 * sz]); }
                        S.line(x, cp, D.A, 1.3); let li = H.i.length ? db(H.i[H.i.length - 1]) : -99; if (li > -60) { let lo = li - (H.g.length ? H.g[H.g.length - 1] : 0); x.fillStyle = '#fff'; x.beginPath(); x.arc(ox + (li + 60) / 60 * sz, oy + sz - (Math.max(-60, lo) + 60) / 60 * sz, 2.5, 0, 7); x.fill(); }
                        let gnow = H.g.length ? H.g[H.g.length - 1] : 0; S.txt(x, (idx(P0.char || 0, 5) ? ['', 'VOCAL', 'MASTER', 'PUNCH', 'SMASH'][idx(P0.char, 5)] : ['CLEAN', 'GLUE', 'SLOW', 'FAST', 'VARI-MU', 'UPWARD'][m]) + (gnow > 0.1 ? ' · −' + gnow.toFixed(1) + ' dB' : gnow < -0.1 ? ' · +' + (-gnow).toFixed(1) + ' dB' : ''), 6, 11, D.A);
                    },
                    kill() { if (w) bury([w]); stopAll(b)(); } };
            } },
        { id: 'scorch', jp: '焦', en: 'SCORCH', sub: 'saturation. tape, desk, valve + more', face: 'char', part: 'nb_fx_scorch',
            p: [['style', 'STYLE', 0, F.pick(['磁 TAPE', '卓 DESK', '鉄 IRON', '球 VALVE', '叫 SCREAM'])], ['drive', 'DRIVE', 0.35, F.db(0, 36)], ['punish', 'PUNISH', 0, F.pick(['off', 'ON'])], ['thump', 'THUMP', 0, F.pct], ['tone', 'TONE', 0.5, v => v < 0.47 ? 'dark ' + Math.round((0.5 - v) * 200) : v > 0.53 ? 'bright ' + Math.round((v - 0.5) * 200) : 'flat'],
                ['lcut', 'LOW CUT', 0, F.hz(20, 800)], ['hcut', 'HIGH CUT', 1, F.hz(1500, 22000)], ['auto', 'AUTO', 1, F.pick(['off', 'on'])], ['out', 'OUTPUT', 0.8, F.db(-24, 6)], ['mix', 'MIX', 1, F.pct]],
            make(ctx) {
                let b = box(ctx), th = bq(ctx, 'lowshelf', 90), pre = bq(ctx, 'peaking', 1500, 0.7), pre2 = bq(ctx, 'lowshelf', 200), dg = b.g(1), sh = ctx.createWaveShaper(), de = bq(ctx, 'peaking', 1500, 0.7), de2 = bq(ctx, 'lowshelf', 200), tl = bq(ctx, 'lowshelf', 700), tr = bq(ctx, 'highshelf', 900), hp = bq(ctx, 'highpass', 20, 0.7), lp = bq(ctx, 'lowpass', 22000, 0.7), og = b.g(1);
                sh.oversample = '4x';
                let wk = ctx._nbwk ? wkNode(ctx, 'nb-scorch') : null, XY = null;
                [b.in, th, pre, pre2, dg, wk || sh, de, de2, tl, tr, hp, lp, og].reduce((a, n) => { a.connect(n); return n; }); og.connect(b.wet);
                if (wk) wk.port.onmessage = e => { if (e.data && e.data.length) XY = e.data; };
                let key = '', cur = null, P0 = null;
                const CURVES = [
                    x => Math.tanh(x * 1.2) / Math.tanh(1.2),
                    x => { let y = Math.tanh(x + 0.15 * x * x); return y; },
                    x => Math.sign(x) * (1 - Math.exp(-Math.abs(x) * 1.6)),
                    x => x >= 0 ? Math.tanh(x * 1.1) : Math.tanh(x * 0.75) * 1.15,
                    x => { let y = clamp(x * 1.6, -1, 1); return Math.sin(y * Math.PI * 0.5 + Math.sin(x * 4) * 0.08); }
                ];
                return { in: b.in, out: b.out,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), st = idx(p.style, 5), drv = p.drive * 36 + (p.punish >= 0.5 ? 20 : 0);
                        let em = [[0, 0], [4, 0], [0, 7], [2, 0], [6, 0]][st]; pre.gain.value = em[0]; de.gain.value = -em[0] * 0.8; pre2.gain.value = em[1]; de2.gain.value = -em[1] * 0.85;
                        pre.frequency.value = st === 4 ? 2500 : 1400; de.frequency.value = pre.frequency.value;
                        let k = st + ':' + Math.round(drv); if (k !== key) { key = k; let g = db2g(drv) * 0.6, nm = Math.max(Math.abs(CURVES[st](g)), Math.abs(CURVES[st](-g)), 0.05); cur = curveOf(x => CURVES[st](x * g) / nm); if (wk) { wk.parameters.get('style').value = st; wk.parameters.get('g').value = g; wk.parameters.get('nm').value = nm; } else sh.curve = cur; }
                        dg.gain.value = 1;
                        S2('thump', th.gain, p.thump * 12);
                        let t = (p.tone - 0.5) * 2; S2('tone', tl.gain, -t * 8); S2('tone', tr.gain, t * 8);
                        { let SX = exact(ctx, now, skip); hp.type = 'highpass'; if (p.lcut < 0.005) SX('lcut', hp.frequency, 0); else S2('lcut', hp.frequency, expo(20, 800, p.lcut)); lp.type = 'lowpass'; if (p.hcut > 0.995) SX('hcut', lp.frequency, ctx.sampleRate / 2); else S2('hcut', lp.frequency, expo(1500, 22000, p.hcut)); }
                        let comp = p.auto >= 0.5 ? db2g(-Math.min(12, drv * 0.22)) : 1; S2('out', og.gain, db2g(-24 + p.out * 30) * comp);
                        S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix);
                    },
                    ap: { tone: [[tl.gain, v => -(v - 0.5) * 16], [tr.gain, v => (v - 0.5) * 16]], out: [[og.gain, v => db2g(-24 + v * 30)]], mix: mixAp(b) }, wk: !wk, lat: () => wk ? 13.5 / ctx.sampleRate : 0,
                    draw(x, w, h, D) {
                        x.fillStyle = '#0a0503'; x.fillRect(0, 0, w, h);
                        let g = x.createRadialGradient(w / 2, h + 10, 4, w / 2, h + 10, h * 1.4); g.addColorStop(0, 'rgba(255,120,30,' + (0.15 + (P0 ? P0.drive : 0) * 0.5) + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
                        if (cur) { let pts = []; for (let i = 0; i < w; i++) pts.push([i, h / 2 - cur[Math.floor(i / (w - 1) * (cur.length - 1))] * (h / 2 - 5)]); S.line(x, pts, '#ffb070', 2); }
                        if (XY) { x.fillStyle = '#fff0d8'; for (let q = 0; q < XY.length; q += 2) { let a = XY[q], o2 = XY[q + 1]; if (Math.abs(a) < 1e-4) continue; x.globalAlpha = 0.5; x.fillRect((clamp(a, -1, 1) + 1) / 2 * (w - 1) - 0.5, h / 2 - clamp(o2, -1.2, 1.2) * (h / 2 - 5) - 0.5, 1.6, 1.6); } x.globalAlpha = 1; }
                        if (P0) { S.txt(x, ['磁 TAPE', '卓 DESK', '鉄 IRON', '球 VALVE', '叫 SCREAM'][idx(P0.style, 5)], 6, 13, '#ffcf9a', 11); if (P0.punish >= 0.5) S.txt(x, 'PUNISH', w - 46, 13, '#ff3a20', 10); }
                    },
                    kill() { if (wk) bury([wk]); stopAll(b)(); } };
            } },
        { id: 'pump', jp: '脈', en: 'PUMP', sub: 'sidechain. TIME ducks in time with the beat, HITS ducks when the KICK tracks (or ticked tracks) hit. FOLLOW uses their actual sound. WHERE = all, LOWS only or HIGHS only. DROP = how fast it ducks', face: 'iron', side: true,
            p: [['mode', 'WHEN', 0, F.pick(['TIME', 'HITS'])], ['rate', 'EVERY', 0.5, F.pick(['1/16', '1/8', '1/4', '1/2', '1 bar'])], ['shape', 'SHAPE', 0, F.pick(['SMOOTH', 'HARD', 'GATE', 'SWELL', 'BOUNCE'])], ['depth', 'DEPTH', 0.8, F.pct], ['len', 'LENGTH', 0.7, F.pct], ['phase', 'NUDGE', 0, F.pct],
                ['src', 'LISTENS TO', 0, F.pick(['every KICK track', 'the ticked tracks hitting', 'the ticked tracks (FOLLOW)'])], ['sens', 'FOLLOW HARD', 0.5, F.pct], ['att', 'FOLLOW ATTACK', 0.15, F.ms(0.001, 0.08)], ['rel', 'FOLLOW LET GO', 0.2, F.ms(0.02, 0.8)],
                ['where', 'WHERE', 0, F.pick(['ALL', 'LOWS ONLY', 'HIGHS ONLY'])], ['split', 'SPLIT', 0.45, F.hz(40, 2000)], ['drop', 'DROP', 0.3, F.ms(0.0005, 0.02)]],
            extra: () => ({ keys: [] }),
            make(ctx) {
                let b = box(ctx), gt = b.g(1), P0 = null, bpm = 120, wr = -1, lp = [bq(ctx, 'lowpass', 150, -3.0103), bq(ctx, 'lowpass', 150, -3.0103)], hp = [bq(ctx, 'highpass', 150, -3.0103), bq(ctx, 'highpass', 150, -3.0103)], gr = [];
                let fan = b.g(1), pre = b.g(1); b.in.connect(fan); lp[0].connect(lp[1]); hp[0].connect(hp[1]); pre.connect(gt); gt.connect(b.wet);
                function route(m) { try { fan.disconnect(); lp[1].disconnect(); hp[1].disconnect(); } catch (e) {}
                    if (m === 0) fan.connect(pre); else { fan.connect(lp[0]); fan.connect(hp[0]); (m === 1 ? lp[1] : hp[1]).connect(pre); (m === 1 ? hp[1] : lp[1]).connect(b.wet); } }
                route(0); wr = 0;
                let ai = tap(ctx, pre, 1024), ao = tap(ctx, gt, 1024);
                let side = b.g(1), dep = b.g(0), fol = ctx._nbwk ? wkNode(ctx, 'nb-ear', 1) : null, sm = null, sens = null;
                side.channelCountMode = 'explicit'; side.channelCount = 1;
                if (fol) { side.connect(fol); fol.connect(dep); }
                else {
                    let rect = ctx.createWaveShaper(), clip = ctx.createWaveShaper(); sm = ctx.createBiquadFilter(); sens = b.g(4);
                    rect.curve = (() => { let c = new Float32Array(1025); for (let i = 0; i <= 1024; i++) c[i] = Math.abs(i / 512 - 1); return c; })();
                    clip.curve = (() => { let c = new Float32Array(1025); for (let i = 0; i <= 1024; i++) c[i] = Math.max(0, Math.min(1, i / 512 - 1)); return c; })();
                    sm.type = 'lowpass'; sm.frequency.value = 12; side.connect(rect); rect.connect(sm); sm.connect(sens); sens.connect(clip); clip.connect(dep);
                }
                dep.connect(gt.gain);
                const per = () => [0.25, 0.5, 1, 2, 4][idx(P0.rate, 5)];
                function pumpAt(t, dur) {
                    let low = 1 - P0.depth, sh = idx(P0.shape, 5), g = gt.gain, dr = 0.0005 + (P0.drop == null ? 0.3 : P0.drop) * 0.0195;
                    g.cancelScheduledValues(t); g.setTargetAtTime(low, t, dr / 4); t += dr; dur = Math.max(0.005, dur - dr); g.setValueAtTime(low, t);
                    if (sh === 0) g.setTargetAtTime(1, t + dur * 0.05, dur * 0.28);
                    else if (sh === 1) { g.setValueAtTime(low, t + dur * 0.45); g.linearRampToValueAtTime(1, t + dur); }
                    else if (sh === 2) { g.setValueAtTime(low, t + dur * 0.7); g.linearRampToValueAtTime(1, t + dur * 0.76); }
                    else if (sh === 3) g.setTargetAtTime(1, t, dur * 0.55);
                    else { g.linearRampToValueAtTime(1, t + dur * 0.45); g.linearRampToValueAtTime(1 - P0.depth * 0.45, t + dur * 0.7); g.linearRampToValueAtTime(1, t + dur * 0.98); }
                }
                const src = () => P0 ? idx(P0.src || 0, 3) : 0, hits = () => P0 && idx(P0.mode, 2) === 1;
                return { in: b.in, out: b.out, side,
                    set(p, now, info) { P0 = p; bpm = info.bpm; let on = hits() && src() === 2; dep.gain.value = on ? -p.depth : 0;
                        let m = idx(p.where || 0, 3), fq = expo(40, 2000, p.split == null ? 0.45 : p.split); lp.concat(hp).forEach(f => { f.frequency.value = fq; }); if (m !== wr) { wr = m; route(m); }
                        let g = 0.3 + (p.sens == null ? 0.5 : p.sens) * 5, a = 0.001 + (p.att == null ? 0.15 : p.att) * 0.08, r = 0.02 + (p.rel == null ? 0.2 : p.rel) * 0.78;
                        if (fol) { fol.parameters.get('sens').value = g; fol.parameters.get('att').value = a; fol.parameters.get('rel').value = r; } else { sens.gain.value = g; sm.frequency.value = 1 / (2 * Math.PI * r); } },
                    keys: () => P0 && hits() && src() > 0 ? (P0.keys || []) : [], follows: () => hits() && src() === 2,
                    sched(b0, b1, tb) { if (!P0 || idx(P0.mode, 2) !== 0) return; let pr = per(), ph = P0.phase * pr; for (let k = Math.ceil((b0 - ph) / pr - 1e-9); k * pr + ph < b1; k++) { let s = k * pr + ph; pumpAt(tb(s), (tb(s + pr * P0.len) - tb(s))); } },
                    kick(t) { if (!P0 || !hits() || src() !== 0) return; pumpAt(t + P0.phase * 0.05, 60 / bpm * per() * P0.len); },
                    hit(uid, t) { if (!P0 || !hits() || src() !== 1 || (P0.keys || []).indexOf(uid) < 0) return; pumpAt(t + P0.phase * 0.05, 60 / bpm * per() * P0.len); },
                    rest() { gt.gain.cancelScheduledValues(ctx.currentTime); gt.gain.setTargetAtTime(1, ctx.currentTime, 0.01); },
                    draw(x, w, h, D) {
                        S.bg(x, w, h); if (!P0) return;
                        let low = 1 - P0.depth, sh = idx(P0.shape, 5), L = P0.len, pts = [];
                        for (let i = 0; i < w; i++) { let u = i / w, v; if (u > L) v = 1; else { let q = u / L; v = sh === 0 ? 1 - (1 - low) * Math.exp(-Math.max(0, q - 0.05) * 3.6) : sh === 1 ? (q < 0.45 ? low : low + (1 - low) * (q - 0.45) / 0.55) : sh === 2 ? (q < 0.7 ? low : q < 0.76 ? low + (1 - low) * (q - 0.7) / 0.06 : 1) : sh === 3 ? 1 - (1 - low) * Math.exp(-q * 1.8) : (q < 0.45 ? low + (1 - low) * q / 0.45 : q < 0.7 ? 1 - P0.depth * 0.45 * (q - 0.45) / 0.25 : 1 - P0.depth * 0.45 + P0.depth * 0.45 * (q - 0.7) / 0.28); } pts.push([i, h - 6 - v * (h - 14)]); }
                        x.fillStyle = D.A; x.globalAlpha = 0.15; x.beginPath(); x.moveTo(0, h); pts.forEach(p => x.lineTo(p[0], p[1])); x.lineTo(w, h); x.fill(); x.globalAlpha = 1; S.line(x, pts, D.A, 2);
                        if (D.playing && idx(P0.mode, 2) === 0) { let ph = ((D.pos - P0.phase * per()) / per()) % 1; x.fillStyle = '#fff'; x.fillRect(((ph + 1) % 1) * w, 0, 1.5, h); }
                        if (ai && ao) { const rm = an => { let a2 = an._f || (an._f = new Float32Array(1024)); an.getFloatTimeDomainData(a2); let e = 0; for (let i = 0; i < 1024; i++) e += a2[i] * a2[i]; return e / 1024; }; let ei = rm(ai), eo = rm(ao); let tn = performance.now(); gr.push([tn, ei > 1e-7 ? Math.max(0, -10 * Math.log10((eo + 1e-12) / ei)) : 0]); while (gr.length && tn - gr[0][0] > 4000) gr.shift(); }
                        let tn2 = performance.now(); x.strokeStyle = '#ff5a3a'; x.lineWidth = 1.4; x.globalAlpha = 0.85; x.beginPath(); gr.forEach(([t2, g], k) => { let X0 = w - (tn2 - t2) / 4000 * w, Y0 = 14 + Math.min(h - 18, g / 24 * (h - 18)); if (k) x.lineTo(X0, Y0); else x.moveTo(X0, Y0); }); x.stroke(); x.globalAlpha = 1;
                        let wm = idx(P0.where || 0, 3), g0 = gr.length ? gr[gr.length - 1][1] : 0;
                        S.txt(x, (idx(P0.mode, 2) ? ['ON EVERY KICK', 'ON THE TICKED TRACKS', 'FOLLOWING ' + (P0.keys || []).length + ' TRACK' + ((P0.keys || []).length === 1 ? '' : 'S')][src()] : 'EVERY ' + ['1/16', '1/8', '1/4', '1/2', '1 BAR'][idx(P0.rate, 5)]) + (wm ? ' · ' + ['', 'LOWS', 'HIGHS'][wm] + ' ONLY' : ''), 6, 11, D.A);
                        if (g0 > 0.6) S.txt(x, '−' + g0.toFixed(1) + ' dB', w - 52, 11, '#ff9a80');
                    },
                    kill: () => { bury([fol]); stopAll(b)(); } };
            } },
        { id: 'echo', jp: '木霊', en: 'ECHO', sub: 'delay. STYLE = tape, space, clean, dual or ping pong. FEEL = straight, dotted, triplet. DIFFUSE smears it toward a reverb, DUCK keeps it out of the way while you play', face: 'tape',
            p: [['style', 'STYLE', 0, F.pick(['TAPE', 'SPACE', 'CLEAN', 'DUAL', 'PING PONG'])], ['time', 'TIME', 0.5, F.pick(DTIME.map(d => d[0]))], ['feel', 'FEEL', 0, F.pick(['straight', 'dotted', 'triplet'])], ['fb', 'AGAIN', 0.4, F.pct], ['sat', 'DIRT', 0.2, F.pct],
                ['wob', 'WOBBLE', 0.2, F.pct], ['lc', 'LOW CUT', 0.2, F.hz(20, 2000)], ['hc', 'HIGH CUT', 0.6, F.hz(800, 18000)], ['width', 'WIDTH', 0.8, F.pct], ['mix', 'MIX', 0.3, F.pct], ['diff', 'DIFFUSE', 0, F.pct], ['duck', 'DUCK', 0, F.pct], ['run', 'TAPE', 0, F.pick(['TAME', 'RUNAWAY'])]],
            ver: 2, fix(p) { if ((p._v || 1) < 2) { p.run = 0.75; p._v = 2; } return p; },
            make(ctx) {
                let dk = null, dfo = ctx._nbwk ? wkNode(ctx, 'nb-follow', 1) : null, dcv = ctx.createWaveShaper(), dkey = '';
                let b = box(ctx), hp = bq(ctx, 'highpass', 150), lfo = ctx.createOscillator(), fl = ctx.createOscillator(), style = -1, N = null, P0 = null, bpm = 120;
                b.in.connect(hp); lfo.frequency.value = 0.55; fl.frequency.value = 6.3; lfo.start(); fl.start();
                dk = b.g(1); dk.connect(b.wet); if (dfo) { b.in.connect(dfo); dfo.connect(dcv); dcv.connect(dk.gain); dfo.parameters.get('att').value = 0.01; dfo.parameters.get('rel').value = 0.25; }
                const ap = (D, g) => { let v = b.g(1), s2 = b.g(1), dl = ctx.createDelay(0.1), fb = b.g(g), ff = b.g(-g), dg = b.g(1 - g * g), out = b.g(1); dl.delayTime.value = D; v.connect(s2); s2.connect(dl); dl.connect(fb); fb.connect(s2); v.connect(ff); ff.connect(out); dl.connect(dg); dg.connect(out); return { v, s2, dl, fb, ff, dg, out }; };
                function build(st) {
                    if (N) N.parts.forEach(n => { try { n.disconnect(); } catch (e) {} });
                    try { hp.disconnect(); lfo.disconnect(); fl.disconnect(); } catch (e) {}
                    let mk = () => { let d = ctx.createDelay(5), fb = b.g(0.4), lp = bq(ctx, 'lowpass', 6000), sh = ctx.createWaveShaper(), pn = ctx.createStereoPanner(), wg = b.g(0), fg = b.g(0), dry = b.g(1), wet = b.g(0), A = [ap(0.0071, 0), ap(0.0113, 0), ap(0.0173, 0)]; sh.oversample = '2x'; d.connect(lp); lp.connect(dry); dry.connect(sh); lp.connect(A[0].v); A[0].out.connect(A[1].v); A[1].out.connect(A[2].v); A[2].out.connect(wet); wet.connect(sh); sh.connect(fb); fb.connect(d); sh.connect(pn); pn.connect(dk); lfo.connect(wg); wg.connect(d.delayTime); fl.connect(fg); fg.connect(d.delayTime); return { d, fb, lp, sh, pn, wg, fg, dry, wet, A }; };
                    N = { st, heads: [], parts: [] };
                    if (st === 4) {
                        let A = mk(), B = mk(); [A, B].forEach(H => { H.fb.disconnect(); H.sh.disconnect(); H.sh.connect(H.pn); H.x = b.g(0); H.sh.connect(H.x); H.pn.disconnect(); }); N.parts.push(...oneOut(ctx, [A.pn, B.pn], dk));
                        A.x.connect(B.d); B.x.connect(A.d); hp.connect(A.d); N.heads = [A, B]; N.ping = 1; N.parts.push(A.x, B.x);
                    } else if (st === 3) { let A = mk(), B = mk(); hp.connect(A.d); hp.connect(B.d); N.heads = [A, B]; }
                    else if (st === 1) { let A = mk(), B = mk(), C = mk(); hp.connect(A.d); A.sh.connect(B.d); B.fb.gain.value = 0; A.sh.connect(C.d); C.fb.gain.value = 0; N.heads = [A, B, C]; N.space = 1; }
                    else { let A = mk(); hp.connect(A.d); N.heads = [A]; }
                    N.heads.forEach(H => { N.parts.push(H.d, H.fb, H.lp, H.sh, H.pn, H.wg, H.fg, H.dry, H.wet); H.A.forEach(q => N.parts.push(q.v, q.s2, q.dl, q.fb, q.ff, q.dg, q.out)); });
                }
                let sk = '';
                return { in: b.in, out: b.out,
                    set(p, now, info, skip) {
                        P0 = p; bpm = info.bpm; let st = idx(p.style, 5); if (st !== style) { style = st; build(st); sk = ''; }
                        let S2 = setter(ctx, now, skip), feel = [1, 1.5, 2 / 3][idx(p.feel, 3)], t = DTIME[idx(p.time, DTIME.length)][1] * feel * 60 / bpm, wd = p.width;
                        let k = st + ':' + Math.round(p.sat * 30); if (k !== sk) { sk = k; let d = 1 + p.sat * (st === 0 ? 5 : 2.5); N.heads.forEach(H => { H.sh.curve = st === 2 ? null : curveOf(x => Math.tanh(x * d) / Math.tanh(d)); }); }
                        let dd = 1 + p.sat * (st === 0 ? 5 : 2.5), lift = st === 2 || idx(p.run || 0, 2) ? 1 : dd / Math.tanh(dd);
                        N.heads.forEach((H, i) => {
                            let tt = st === 3 ? (i ? t * 1.5 : t) : st === 1 ? t * [1, 1.5, 2][i] - (i ? t : 0) : t;
                            S2('time', H.d.delayTime, Math.max(0.001, tt));
                            if (!(st === 1 && i) && st !== 4) S2('fb', H.fb.gain, p.fb * (st === 0 ? 0.95 : 0.9) / lift);
                            S2('hc', H.lp.frequency, expo(800, 18000, p.hc) * (st === 0 ? 0.7 : 1));
                            H.pn.pan.value = st === 4 || st === 3 ? (i ? 1 : -1) * wd : st === 1 ? [0, -1, 1][i] * wd : 0;
                            S2('wob', H.wg.gain, st === 2 ? 0 : p.wob * (st === 0 ? 0.006 : 0.002)); S2('wob', H.fg.gain, st === 0 ? p.wob * 0.0004 : 0);
                        });
                        if (st === 4) N.heads.forEach(H => S2('fb', H.x.gain, p.fb * 0.92 / lift));
                        let df = p.diff || 0; N.heads.forEach(H => { H.dry.gain.value = 1 - df * 0.85; H.wet.gain.value = df * 0.85; H.A.forEach((q, j) => { let g = df * 0.7; q.fb.gain.value = g; q.ff.gain.value = -g; q.dg.gain.value = 1 - g * g; q.dl.delayTime.value = [0.0071, 0.0113, 0.0173][j] * (0.6 + df * 1.6); }); });
                        let dkk = Math.round((p.duck || 0) * 40); if (dkk !== dkey) { dkey = dkk; let dd = (p.duck || 0) * 0.92; dcv.curve = curveOf(e => dd ? -dd * Math.min(1, Math.pow(Math.max(0, e) * 5, 0.8)) : 0); }
                        S2('lc', hp.frequency, expo(20, 2000, p.lc)); S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix * 0.4);
                    },
                    get ap() { return { fb: N ? N.heads.map(H => [H.x ? H.x.gain : H.fb.gain, v => v * 0.9]) : [], hc: N ? N.heads.map(H => [H.lp.frequency, v => expo(800, 18000, v)]) : [], mix: [[b.wet.gain, v => v], [b.dry.gain, v => 1 - v * 0.4]] }; },
                    draw(x, w, h, D) {
                        x.fillStyle = '#1d150c'; x.fillRect(0, 0, w, h);
                        if (!P0) return;
                        let st = idx(P0.style, 5), feel = [1, 1.5, 2 / 3][idx(P0.feel, 3)], beat = DTIME[idx(P0.time, DTIME.length)][1] * feel, span = Math.max(4, beat * 8), X0 = bt => 8 + bt / span * (w - 16);
                        x.fillStyle = '#f0e2bf'; x.fillRect(X0(0), 8, 2, h - 16);
                        let taps = [];
                        if (st === 1) [1, 1.5, 2].forEach((m, i) => { for (let r = 0; r < 6; r++) taps.push([beat * m + r * beat, Math.pow(P0.fb, r) * (i ? 0.6 : 1), i - 1]); });
                        else if (st === 3) { for (let r = 1; r < 9; r++) { taps.push([beat * r, Math.pow(P0.fb, r - 1), -1]); taps.push([beat * 1.5 * r, Math.pow(P0.fb, r - 1), 1]); } }
                        else for (let r = 1; r < 12; r++) taps.push([beat * r, Math.pow(P0.fb, r - 1), st === 4 ? (r % 2 ? -1 : 1) : 0]);
                        let df = P0.diff || 0; taps.forEach(([bt, a, side], q) => { if (bt > span) return; let hh = (h - 16) * a, sm = 3 + df * (4 + q * 1.5) * 3; x.fillStyle = side < 0 ? '#ffb070' : side > 0 ? '#7ad0ff' : '#e8d8b0'; x.globalAlpha = 0.85 / (1 + df * 1.5); x.fillRect(X0(bt) - (sm - 3) / 2, h - 8 - hh, sm, hh); });
                        if ((P0.duck || 0) > 0.01) { x.globalAlpha = 1; S.txt(x, 'DUCK ' + Math.round(P0.duck * 100) + '%', w - 62, 11, '#ffb070'); }
                        x.globalAlpha = 1; S.txt(x, ['TAPE', 'SPACE', 'CLEAN', 'DUAL', 'PING PONG'][st] + ' · ' + DTIME[idx(P0.time, DTIME.length)][0] + ['', ' dotted', ' triplet'][idx(P0.feel, 3)], 6, 11, '#f0e2bf');
                    },
                    kill() { try { lfo.stop(); fl.stop(); } catch (e) {} if (dfo) bury([dfo]); stopAll(b)(); } };
            } },
        { id: 'hollow', jp: '洞', en: 'HOLLOW', sub: 'reverb. plate, room, chamber, hall, concrete', face: 'stone',
            p: [['mode', 'ROOM', 0.6, F.pick(['PLATE', 'ROOM', 'CHAMBER', 'HALL', 'CONCRETE'])], ['size', 'SIZE', 0.5, F.pct], ['decay', 'TAIL', 0.45, F.ms(0.3, 9, 1.6)], ['pre', 'GAP', 0.1, F.ms(0, 0.25)], ['damp', 'DARK', 0.4, F.pct],
                ['mod', 'MOD', 0.2, F.pct], ['width', 'WIDTH', 0.9, F.pct], ['lc', 'LOW CUT', 0.3, F.hz(20, 1000)], ['era', 'ERA', 0, F.pick(['NOW', 'OLD RACK', 'FIRST ONE'])], ['lowt', 'LOW TAIL', 0.5, v => v < 0.48 ? 'shorter' : v > 0.52 ? 'longer' : 'same'], ['mix', 'MIX', 0.3, F.pct],
                ['own', 'YOUR ROOM', 0, F.pick(['off', 'on'])]],
            ir: true,
            make(ctx) {
                let b = box(ctx), pd = ctx.createDelay(0.5), md = ctx.createDelay(0.05), mo = ctx.createOscillator(), mg = b.g(0), cv = ctx.createConvolver(), lp = bq(ctx, 'lowpass', 9000), hp = bq(ctx, 'highpass', 120), key = '', P0 = null; let IRB = null, cvB = null, cvE = null;
                md.delayTime.value = 0.012; mo.frequency.value = 0.37; mo.connect(mg); mg.connect(md.delayTime); mo.start();
                let eLp = bq(ctx, 'lowpass', 20000, 0.6), eCh = ctx.createDelay(0.05), eO = ctx.createOscillator(), eG = b.g(0), eCr = ctx._nbwk ? wkNode(ctx, 'nb-crush') : null, lowS = bq(ctx, 'lowshelf', 250, 0.7);
                eCh.delayTime.value = 0.006; eO.frequency.value = 0.8; eO.connect(eG); eG.connect(eCh.delayTime); eO.start();
                b.in.connect(pd); pd.connect(hp); hp.connect(md); md.connect(cv); cv.connect(lp); lp.connect(lowS); lowS.connect(eLp); eLp.connect(eCh);
                if (eCr) { eCh.connect(eCr); eCr.connect(b.wet); } else eCh.connect(b.wet);
                const self = { in: b.in, out: b.out, wk: !eCr,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), m = idx(p.mode, 5), k = m + ':' + Math.round(p.size * 12) + ':' + Math.round(p.decay * 16) + ':' + Math.round(p.damp * 8) + ':' + Math.round(p.width * 4) + ':' + Math.round((p.lowt == null ? 0.5 : p.lowt) * 8);
                        let ownE = null; if (idx(p.own || 0, 2) && p.ir && p.ir.id && window.NBA) { ownE = NBA.pool.get(p.ir.id); if (!ownE) { NBA.load(p.ir.id).then(() => { key = ''; if (P0) self.set(P0, true, info, {}); }); ownE = null; } else if (ownE.state !== 'ok') ownE = null; }
                        if (ownE) k = 'own:' + ownE.id + ':' + Math.round(p.decay * 16);
                        if (k !== key) { key = k;
                            if (ownE) { let len = Math.min(ownE.dur, 0.3 + Math.pow(p.decay, 1.6) * 8.7), n = Math.max(64, Math.floor(len * ctx.sampleRate)), src = NBA.bufFor(ctx, ownE), nb = ctx.createBuffer(2, n, ctx.sampleRate), fade = Math.floor(n * 0.3);
                                for (let c = 0; c < 2; c++) { let d = src.getChannelData(Math.min(c, src.numberOfChannels - 1)), o = nb.getChannelData(c); for (let i = 0; i < n && i < d.length; i++) o[i] = d[i] * (i > n - fade ? Math.pow((n - i) / fade, 2) : 1); }
                                cv.buffer = nb; }
                            else { let len = 0.3 + Math.pow(p.decay, 1.6) * 8.7; if (m === 1) len = Math.min(len, 1.6); cv.buffer = irBuf(ctx, { kind: m, len, dark: m === 0 ? p.damp * 0.5 : m === 3 ? 0.2 + p.damp * 0.8 : p.damp, decay: 1.4 + (1 - p.size) * 3, size: p.size, width: p.width, lowt: Math.pow(2, ((p.lowt == null ? 0.5 : p.lowt) - 0.5) * 2.4) }); }
                            IRB = cv.buffer; }
                        S2('pre', pd.delayTime, p.pre * 0.25); S2('damp', lp.frequency, expo(1500, 17000, 1 - p.damp)); S2('lc', hp.frequency, expo(20, 1000, p.lc)); S2('mod', mg.gain, p.mod * 0.004);
                        let era = idx(p.era || 0, 3); eLp.frequency.value = [ctx.sampleRate / 2, 9500, 6000][era]; eG.gain.value = [0, 0.0012, 0.0006][era];
                        if (eCr) { eCr.parameters.get('bits').value = [16, 14, 12][era]; eCr.parameters.get('down').value = [1, 1, 2][era]; }
                        S2('lowt', lowS.gain, ((p.lowt == null ? 0.5 : p.lowt) - 0.5) * 6);
                        S2('mix', b.wet.gain, p.mix * 1.4); S2('mix', b.dry.gain, 1 - p.mix * 0.5);
                    },
                    ap: { mix: [[b.wet.gain, v => v * 1.4], [b.dry.gain, v => 1 - v * 0.5]], damp: [[lp.frequency, v => expo(1500, 17000, 1 - v)]] },
                    draw(x, w, h, D) {
                        S.bg(x, w, h); if (!P0) return;
                        let m = idx(P0.mode, 5), B = IRB, pre = P0.pre * 0.25, len = B ? B.duration : 1, span = Math.max(0.6, len + pre), X = t => (t + pre) / span * w, Y = db => 14 + (-db / 60) * (h - 20);
                        if (B && B !== cvB) { cvB = B; let d0 = B.getChannelData(0), n = d0.length, seg = Math.max(1, Math.floor(n / 160)); cvE = []; for (let k = 0; k < 160; k++) { let pk = 0; for (let i = k * seg; i < Math.min(n, (k + 1) * seg); i++) pk = Math.max(pk, Math.abs(d0[i])); cvE.push(pk); } let top = Math.max(...cvE) || 1; cvE = cvE.map(v => 20 * Math.log10(v / top + 1e-6)); }
                        x.strokeStyle = 'rgba(255,255,255,0.06)'; for (let db = -12; db >= -48; db -= 12) { x.beginPath(); x.moveTo(0, Y(db)); x.lineTo(w, Y(db)); x.stroke(); }
                        if (cvE) { x.fillStyle = D.A; x.globalAlpha = 0.28; cvE.forEach((v, k) => { let X0 = X(k / cvE.length * len), Y0 = Y(Math.max(-60, v)); x.fillRect(X0, Y0, Math.max(1, w / cvE.length * len / span), h - 6 - Y0); }); x.globalAlpha = 1; }
                        if (B && B._t) { [['#ff6d6d', B._t[0]], [D.A, B._t[1]], ['#e8f0ff', B._t[2]]].forEach(([c, t60]) => { S.line(x, [[X(0), Y(0)], [X(Math.min(len, t60)), Y(-60 * Math.min(len, t60) / t60)]], c, 1.2); });
                            x.fillStyle = '#fff'; (B._er || []).forEach(([t, g]) => { x.globalAlpha = Math.min(1, g * 3); x.fillRect(X(t), 14, 1, 5); }); x.globalAlpha = 1; }
                        x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(X(0) - 0.5, 12, 1, h - 16);
                        S.txt(x, ['PLATE', 'ROOM', 'CHAMBER', 'HALL', 'CONCRETE'][m] + (B && B._t ? ' · low ' + B._t[0].toFixed(1) + 's · mid ' + B._t[1].toFixed(1) + 's · top ' + B._t[2].toFixed(1) + 's' : ''), 6, 11, D.A);
                    },
                    kill() { try { mo.stop(); eO.stop(); } catch (e) {} bury([eCr]); stopAll(b)(); } }; return self;
            } },
        { id: 'nave', jp: '聖堂', en: 'NAVE', sub: 'huge reverb that sings in your key. BLOOM feeds the tail back, FREEZE holds it, BEFORE = predelay, WIDTH = stereo width', face: 'glass', part: 'nb_nave',
            p: [['size', 'SIZE', 0.7, F.pct], ['dark', 'DARK', 0.6, F.pct], ['choir', 'CHOIR', 0.3, F.pct], ['bloom', 'BLOOM', 0.3, F.pct], ['freeze', 'FREEZE', 0, F.pick(['off', 'HOLD'])], ['lc', 'LOW CUT', 0.3, F.hz(20, 1000)], ['pre', 'BEFORE', 0, F.ms(0, 0.25)], ['width', 'WIDTH', 1, F.pct], ['mix', 'MIX', 0.35, F.pct]],
            make(ctx) {
                let b = box(ctx), gate = b.g(1), pd = ctx.createDelay(0.3), hp = bq(ctx, 'highpass', 150), cv = ctx.createConvolver(), ch = b.g(0), key = '', bank = [], P0 = null, an = null, wsum = b.g(1), W = widener(ctx, b);
                b.in.connect(gate); gate.connect(pd); pd.connect(hp); hp.connect(cv); cv.connect(wsum); wsum.connect(W.in); W.out.connect(b.wet);
                [0, 7, 12, 15, 19].forEach(st => { let f = bq(ctx, 'bandpass', 220, 40), g = b.g(0.5); cv.connect(f); f.connect(g); g.connect(ch); bank.push({ f, st }); });
                ch.connect(wsum);
                let sum = b.g(1), fl = bq(ctx, 'lowpass', 5000), fbk = b.g(0), ds = [1.71, 2.37, 2.93, 3.61].map(s => { let d = ctx.createDelay(5); d.delayTime.value = s * 0.1; return d; });
                cv.connect(sum); sum.connect(fl); let dsum = b.g(1); ds.forEach(d => { fl.connect(d); d.connect(dsum); }); dsum.connect(fbk); dsum.connect(wsum); fbk.connect(sum);
                an = tap(ctx, b.wet, 512);
                return { in: b.in, out: b.out,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), k = Math.round(p.size * 10) + ':' + Math.round(p.dark * 10), fz = p.freeze >= 0.5;
                        if (k !== key) { key = k; cv.buffer = irBuf(ctx, { kind: 5, len: 3 + p.size * 8, dark: 0.3 + p.dark * 0.7, decay: 1.2 + (1 - p.size) * 2, size: p.size }); }
                        // the choir sings in your songs key. this is so cool to me
                        let root = 48 + rootOf(info), sc = (window.NB && NB.SCALES && NB.SCALES[info.scale] || { s: [0, 2, 3, 5, 7, 8, 10] }).s, near = t => sc.reduce((a, v) => Math.abs(v - t) < Math.abs(a - t) ? v : a, sc[0]), t3 = sc.indexOf(3) >= 0 ? 3 : near(3), t5 = sc.indexOf(7) >= 0 ? 7 : near(7);
                        bank.forEach(x => { let st = x.st === 7 ? t5 : x.st === 19 ? 12 + t5 : x.st === 15 ? 12 + t3 : x.st; x.f.frequency.value = 440 * Math.pow(2, (root + st - 69) / 12); });
                        S2('pre', pd.delayTime, (p.pre || 0) * 0.25); W.set(p.width == null ? 1 : p.width);
                        ds.forEach((d, i) => { d.delayTime.value = [1.71, 2.37, 2.93, 3.61][i] * (0.06 + p.size * 0.12); });
                        S2('choir', ch.gain, p.choir * 6); S2('bloom', fbk.gain, fz ? 0.249 : p.bloom * 0.22); fl.frequency.value = fz ? 16000 : expo(1200, 9000, 1 - p.dark);
                        gate.gain.setTargetAtTime(fz ? 0 : 1, ctx.currentTime, 0.05);
                        S2('lc', hp.frequency, expo(20, 1000, p.lc)); S2('mix', b.wet.gain, p.mix * 1.3); S2('mix', b.dry.gain, 1 - p.mix * 0.6);
                    },
                    choir: () => bank.map(x => x.f.frequency.value),
                    ap: { choir: [[ch.gain, v => v * 6]], bloom: [[fbk.gain, v => v * 0.22]], mix: [[b.wet.gain, v => v * 1.3], [b.dry.gain, v => 1 - v * 0.6]] },
                    draw(x, w, h, D) {
                        let lv = S.meter(x, an); this._l = Math.max(lv, (this._l || 0) * 0.93);
                        x.fillStyle = '#07050a'; x.fillRect(0, 0, w, h);
                        let cx = w / 2, cy = h / 2, R = h / 2 - 3, n = 12, t = D.now * 0.2;
                        for (let i = 0; i < n; i++) { let a0 = i / n * 6.283 + t * 0.1, a1 = a0 + 6.283 / n; x.fillStyle = 'hsla(' + ((i * 37 + (D.root || 0) * 30) % 360) + ',80%,' + (18 + this._l * 55) + '%,0.9)'; x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, R, a0 + 0.04, a1 - 0.04); x.fill(); }
                        x.strokeStyle = '#000'; x.lineWidth = 2; for (let r = R * 0.33; r < R; r += R * 0.33) { x.beginPath(); x.arc(cx, cy, r, 0, 7); x.stroke(); }
                        x.fillStyle = '#000'; x.beginPath(); x.arc(cx, cy, R * 0.18, 0, 7); x.fill();
                        if (P0 && P0.freeze >= 0.5) S.txt(x, 'HELD', 6, 12, '#fff', 10);
                    },
                    kill: stopAll(b) };
            } },
        { id: 'sway', jp: '揺', en: 'SWAY', sub: 'chorus, flanger + phaser', face: 'velvet', part: 'nb_nave',
            p: [['mode', 'KIND', 0, F.pick(['I', 'II', 'I+II', 'FLANGE', 'PHASE', 'DIMENSION', 'TRI'])], ['rate', 'RATE', 0.3, F.hz(0.05, 8)], ['sync', 'SYNC', 0, F.pick(SWSY.map(s => s[0]))], ['depth', 'DEPTH', 0.5, F.pct],
                ['fb', 'FEEDBACK', 0.3, F.pct], ['sign', 'FEEDBACK WAY', 0, F.pick(['+', '−'])], ['manual', 'MANUAL', 0.5, F.pct], ['stages', 'STAGES', 0.5, F.pick(['4', '6', '8', '12'])], ['width', 'WIDTH', 1, v => Math.round(v * 180) + '°'], ['tone', 'TONE', 0.6, F.hz(3000, 18000)], ['mix', 'MIX', 0.5, F.pct]],
            ver: 2, fix(p) { if ((p._v || 1) < 2) { if (p.mode != null) p.mode = (Math.min(4, Math.floor(p.mode * 5)) + 0.5) / 7; p._v = 2; } return p; },
            idle(p) { let m = idx(p.mode, 7), o = {}; if (m !== 3 && m !== 4) { o.fb = o.sign = 'only FLANGE + PHASE feed back'; o.manual = 'only FLANGE + PHASE have a MANUAL'; } if (m !== 4) o.stages = 'only PHASE has stages'; if (m === 4) o.tone = 'PHASE keeps its whole top'; if (m >= 5) o.width = m === 5 ? 'DIMENSION sets its own width' : 'TRI sets its own width'; if (idx(p.sync || 0, SWSY.length)) o.rate = 'its SYNCed to the song'; return o; },
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-sway') : null, lfo = null, mode = -1, parts = [], P = null, P0 = null, bpm = 120, H = [[], [], []], FQ = [0, 0], lock = false;
                const Wp = n => w.parameters.get(n), hzOf = p => { let m = idx(p.mode, 7), sy = SWSY[idx(p.sync || 0, SWSY.length)][1]; return sy ? bpm / 60 / sy : m < 3 ? [0.513, 0.863, 9.75][m] * (0.75 + p.rate * 0.5) : m >= 5 ? [0.25, 0.6][m - 5] * (0.6 + p.rate * 0.8) : expo(0.05, 8, p.rate); };
                if (w) { b.in.connect(w); w.connect(b.wet); b.in.connect(b.dry); w.port.onmessage = e => { let d = e.data; if (!d || !d.d) return; for (let k = 0; k < 3; k++) { H[k].push(d.d[k]); if (H[k].length > 150) H[k].shift(); } FQ = d.f; }; }
                else { lfo = ctx.createOscillator(); lfo.start(); }
                function build(m) {
                    parts.forEach(n => { try { n.disconnect(); } catch (e) {} }); parts = []; try { lfo.disconnect(); b.in.disconnect(); } catch (e) {}
                    b.in.connect(b.dry);
                    if (m === 4) {
                        let ap = [], ld = b.g(1200), fbk = b.g(0.3), fd = ctx.createDelay(0.01); fd.delayTime.value = 0.0005;
                        for (let i = 0; i < 8; i++) { let f = bq(ctx, 'allpass', 300 + i * 260, 0.6); ap.push(f); if (i) ap[i - 1].connect(f); lfo.connect(ld); ld.connect(f.detune); }
                        b.in.connect(ap[0]); ap[7].connect(b.wet); ap[7].connect(fbk); fbk.connect(fd); fd.connect(ap[0]);
                        parts = ap.concat([ld, fbk, fd]); return { ld, fbk };
                    }
                    let sp = ctx.createChannelSplitter(2), dL = ctx.createDelay(0.05), dR = ctx.createDelay(0.05), gL = b.g(0.002), gR = b.g(-0.002), mg = ctx.createChannelMerger(2), fbk = b.g(0), tri = b.g(1);
                    let base = m === 3 ? 0.003 : 0.0035; dL.delayTime.value = dR.delayTime.value = base;
                    b.in.connect(sp); sp.connect(dL, 0); sp.connect(dR, 1); dL.connect(mg, 0, 0); dR.connect(mg, 0, 1); mg.connect(b.wet);
                    lfo.connect(tri); tri.connect(gL); tri.connect(gR); gL.connect(dL.delayTime); gR.connect(dR.delayTime);
                    if (m === 3) { dL.connect(fbk); fbk.connect(dL); }
                    parts = [sp, dL, dR, gL, gR, mg, fbk, tri]; return { gL, gR, fbk };
                }
                return { in: b.in, out: b.out, wk: !w,
                    set(p, now, info, skip) {
                        P0 = p; bpm = info && info.bpm || bpm; let S2 = setter(ctx, now, skip), m = idx(p.mode, 7);
                        if (w) { Wp('kind').value = m; Wp('rate').value = hzOf(p); S2('depth', Wp('depth'), p.depth); Wp('fb').value = p.fb * 0.95 * (idx(p.sign || 0, 2) ? -1 : 1); Wp('manual').value = p.manual == null ? 0.5 : p.manual;
                            Wp('stages').value = [4, 6, 8, 12][idx(p.stages == null ? 0.5 : p.stages, 4)]; Wp('width').value = p.width == null ? 1 : p.width; Wp('tone').value = p.tone == null ? 0.6 : p.tone; }
                        else {
                            let mo = [0, 1, 2, 3, 4, 0, 1][m]; if (mo !== mode) { mode = mo; P = build(mo); }
                            lfo.type = mo < 3 ? 'triangle' : 'sine';
                            if (mo < 3) { lfo.frequency.value = [0.513, 0.863, 9.75][mo] * (0.75 + p.rate * 0.5); let dep = [0.0017, 0.0017, 0.0003][mo] * (0.5 + p.depth); S2('depth', P.gL.gain, dep); S2('depth', P.gR.gain, -dep); }
                            else if (mo === 3) { lfo.frequency.value = expo(0.05, 8, p.rate); let dep = 0.0004 + p.depth * 0.0026; S2('depth', P.gL.gain, dep); S2('depth', P.gR.gain, -dep); S2('fb', P.fbk.gain, p.fb * 0.9); }
                            else { lfo.frequency.value = expo(0.05, 8, p.rate); S2('depth', P.ld.gain, 300 + p.depth * 2400); S2('fb', P.fbk.gain, p.fb * 0.85); }
                        }
                        S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix * 0.5);
                    },
                    sched(b0, b1, tb) { if (!w || !P0 || lock) return; let sy = SWSY[idx(P0.sync || 0, SWSY.length)][1]; lock = true; if (!sy) return; let ahead = Math.max(0, tb(b0) - ctx.currentTime) * bpm / 60; w.port.postMessage({ at: (((b0 - ahead) / sy) % 1 + 1) % 1 }); },
                    rest() { lock = false; },
                    get ap() { let a = { mix: [[b.wet.gain, v => v], [b.dry.gain, v => 1 - v * 0.5]] }; if (w) a.depth = [[Wp('depth'), v => v]]; return a; },
                    draw(x, wd, h, D) {
                        S.bg(x, wd, h); if (!P0) return; let m = idx(P0.mode, 7), K = ['I', 'II', 'I+II', 'FLANGE', 'PHASE', 'DIMENSION', 'TRI'][m], hz = hzOf(P0), rt = hz.toFixed(2) + ' Hz';
                        if (!w) { S.txt(x, K + ' · needs the worklet for its screen', 6, 11, D.A); return; }
                        if (m === 4) {
                            let st = [4, 6, 8, 12][idx(P0.stages == null ? 0.5 : P0.stages, 4)], fb = P0.fb * 0.95 * (idx(P0.sign || 0, 2) ? -1 : 1), wt = P0.mix, dr = 1 - P0.mix * 0.5, sr = ctx.sampleRate;
                            for (let c = 0; c < 2; c++) { let fc = FQ[c] || 600, t = Math.tan(Math.PI * Math.min(fc, sr * 0.45) / sr), a = (t - 1) / (t + 1), pts = [];
                                for (let i = 0; i <= 120; i++) { let f = 20 * Math.pow(1000, i / 120), om = 2 * Math.PI * f / sr, cr = Math.cos(om), ci = -Math.sin(om);
                                    let nr = a + cr, ni = ci, dr2 = 1 + a * cr, di = a * ci, q = dr2 * dr2 + di * di, ar = (nr * dr2 + ni * di) / q, ai = (ni * dr2 - nr * di) / q, pr = 1, pi = 0;
                                    for (let s = 0; s < st; s++) { let t2 = pr * ar - pi * ai; pi = pr * ai + pi * ar; pr = t2; }
                                    let er = 1 - fb * pr, ei = -fb * pi, eq = er * er + ei * ei, hr = (pr * er + pi * ei) / eq, hi = (pi * er - pr * ei) / eq, yr = dr + wt * hr, yi = wt * hi, g = 10 * Math.log10(yr * yr + yi * yi + 1e-9);
                                    pts.push([S.logx(f, wd), clamp(h * 0.45 - g / 24 * h * 0.5, 14, h - 2)]); }
                                S.line(x, pts, c ? '#ff9ae8' : '#b78cff', 1.4); }
                            x.strokeStyle = 'rgba(255,255,255,0.07)'; x.beginPath(); [100, 1000, 10000].forEach(f => { x.moveTo(S.logx(f, wd), 14); x.lineTo(S.logx(f, wd), h); }); x.stroke();
                            [100, 1000, 10000].forEach(f => S.txt(x, f >= 1000 ? f / 1000 + 'k' : '' + f, S.logx(f, wd) + 2, h - 3, 'rgba(255,255,255,0.35)', 8));
                            S.txt(x, 'PHASE · ' + st + ' stages · ' + rt + ' · ' + Math.round(FQ[0] || 0) + ' Hz', 6, 11, '#f2d8ff');
                        } else {
                            let all = H[0].concat(H[1], m === 6 ? H[2] : []).filter(v => v > 0), hi = all.length ? Math.max(1, ...all) * 1.1 : 8, lo = all.length ? Math.max(0, Math.min(...all) * 0.85) : 0, N = 150, dx = wd / N, Y = v => 14 + (1 - (v - lo) / Math.max(0.05, hi - lo)) * (h - 20);
                            x.strokeStyle = 'rgba(255,255,255,0.08)'; x.beginPath(); for (let g = Math.ceil(lo); g <= hi; g++) { x.moveTo(0, Y(g)); x.lineTo(wd, Y(g)); } x.stroke();
                            [[0, '#b78cff'], [1, '#ff9ae8'], [2, '#ffffff']].forEach(([k, c]) => { if (k === 2 && m !== 6) return; let pts = H[k].map((v, i) => [(N - H[k].length + i) * dx, Y(v)]); if (pts.length > 1) S.line(x, pts, c, 1.4); });
                            let d0 = H[0].length ? H[0][H[0].length - 1] : 0;
                            if (m === 3 && d0 > 0) S.txt(x, 'first notch ' + Math.round(500 / d0) + ' Hz', 6, h - 4, 'rgba(242,216,255,0.6)', 9);
                            S.txt(x, K + ' · ' + rt + ' · ' + lo.toFixed(1) + ' to ' + hi.toFixed(1) + ' ms', 6, 11, '#f2d8ff');
                        }
                    },
                    kill() { if (w) bury([w]); else { try { lfo.stop(); } catch (e) {} } stopAll(b)(); } };
            } },
        { id: 'spread', jp: '幅', en: 'SPREAD', sub: 'stereo width. done in mid / side so the centre stays put. WIDTH overall or per band (LOW / MID / HIGH). MONO BELOW keeps the lows centred. STEREOIZE widens mono sounds safely, LATE is the old delay trick (wide, but it combs in mono)', face: 'chrome',
            p: [['width', 'WIDTH', 0.5, v => Math.round(v * 200) + '%'], ['lw', 'LOW WIDTH', 0.5, v => Math.round(v * 200) + '%'], ['mw', 'MID WIDTH', 0.5, v => Math.round(v * 200) + '%'], ['hw', 'HIGH WIDTH', 0.5, v => Math.round(v * 200) + '%'], ['x1', 'LOW SPLIT', 0.4, F.hz(40, 1000)], ['x2', 'HIGH SPLIT', 0.5, F.hz(1000, 16000)],
                ['st', 'STEREOIZE', 0, F.pct], ['haas', 'LATE', 0, F.ms(0, 0.03)], ['mono', 'MONO BELOW', 0, F.pick(['off', '60', '100', '150', '250'])], ['pan', 'PAN', 0.5, v => v < 0.48 ? 'L' + Math.round((0.5 - v) * 200) : v > 0.52 ? 'R' + Math.round((v - 0.5) * 200) : 'mid'], ['gain', 'GAIN', 0.66, F.db(-24, 12)]],
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-spread') : null, pan = ctx.createStereoPanner(), gn = b.g(1), P0 = null, CR = [], BAL = 0;
                pan.connect(gn); gn.connect(b.wet);
                let ll, rr, lr, rl, hz, hi, lo, loM;
                if (w) { b.in.connect(w); w.connect(pan); w.port.onmessage = e => { let d = e.data; if (!d || d.c == null) return; CR.push(d.c); if (CR.length > 90) CR.shift(); BAL = 10 * Math.log10((d.l + 1e-12) / (d.r + 1e-12)); }; }
                else {
                    let sp = ctx.createChannelSplitter(2), mg = ctx.createChannelMerger(2), mid = ctx.createGain(); ll = b.g(1); rr = b.g(1); lr = b.g(0); rl = b.g(0); hz = ctx.createDelay(0.05);
                    lo = bq(ctx, 'lowpass', 100, 0.7); hi = bq(ctx, 'allpass', 100, 0.7); loM = b.g(0); mid.channelCount = 1; mid.channelCountMode = 'explicit';
                    b.in.connect(hi); hi.connect(sp); sp.connect(ll, 0); sp.connect(rl, 0); sp.connect(rr, 1); sp.connect(lr, 1);
                    ll.connect(mg, 0, 0); lr.connect(mg, 0, 0); rr.connect(hz); rl.connect(hz); hz.connect(mg, 0, 1); mg.connect(pan);
                    b.in.connect(lo); lo.connect(loM); loM.connect(mid); mid.connect(pan);
                }
                let sL = null, sR = null;
                if (!offline(ctx)) { let s2 = ctx.createChannelSplitter(2); gn.connect(s2); sL = ctx.createAnalyser(); sR = ctx.createAnalyser(); sL.fftSize = sR.fftSize = 512; s2.connect(sL, 0); s2.connect(sR, 1); }
                const Wp = n => w.parameters.get(n), bw = v => (v == null ? 0.5 : v) * 2;
                return { in: b.in, out: b.out, wk: !w,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), mf = [0, 60, 100, 150, 250][idx(p.mono, 5)];
                        if (w) { S2('width', Wp('width'), p.width * 2); S2('lw', Wp('lw'), bw(p.lw)); S2('mw', Wp('mw'), bw(p.mw)); S2('hw', Wp('hw'), bw(p.hw)); Wp('x1').value = expo(40, 1000, p.x1 == null ? 0.4 : p.x1); Wp('x2').value = expo(1000, 16000, p.x2 == null ? 0.5 : p.x2);
                            S2('st', Wp('st'), p.st || 0); Wp('haas').value = p.haas * 0.03; Wp('mono').value = mf; }
                        else { let wd = p.width * 2, a = (1 + wd) / 2, c = (1 - wd) / 2; S2('width', ll.gain, a); S2('width', rr.gain, a); S2('width', lr.gain, c); S2('width', rl.gain, c); S2('haas', hz.delayTime, p.haas * 0.03);
                            if (mf) { hi.type = 'highpass'; hi.frequency.value = mf; lo.frequency.value = mf; loM.gain.value = 1; } else { hi.type = 'allpass'; loM.gain.value = 0; } }
                        S2('pan', pan.pan, (p.pan - 0.5) * 2); S2('gain', gn.gain, db2g(-24 + p.gain * 36));
                    },
                    get ap() { let a = { pan: [[pan.pan, v => (v - 0.5) * 2]], gain: [[gn.gain, v => db2g(-24 + v * 36)]] };
                        if (w) { a.width = [[Wp('width'), v => v * 2]]; a.lw = [[Wp('lw'), v => v * 2]]; a.mw = [[Wp('mw'), v => v * 2]]; a.hw = [[Wp('hw'), v => v * 2]]; a.st = [[Wp('st'), v => v]]; }
                        else a.width = [[ll.gain, v => (1 + v * 2) / 2], [rr.gain, v => (1 + v * 2) / 2], [lr.gain, v => (1 - v * 2) / 2], [rl.gain, v => (1 - v * 2) / 2]];
                        return a; },
                    draw(x, w2, h, D) {
                        x.fillStyle = 'rgba(6,8,10,0.35)'; x.fillRect(0, 0, w2, h); if (!P0) return;
                        let gw = Math.min(h - 14, w2 * 0.38), cx = 4 + gw / 2, cy = 2 + gw / 2;
                        x.strokeStyle = 'rgba(255,255,255,0.1)'; x.beginPath(); x.moveTo(cx, 2); x.lineTo(cx, 2 + gw); x.moveTo(4, cy); x.lineTo(4 + gw, cy); x.stroke();
                        if (sL) { let L = sL._f || (sL._f = new Float32Array(512)), R = sR._f || (sR._f = new Float32Array(512)); sL.getFloatTimeDomainData(L); sR.getFloatTimeDomainData(R); x.fillStyle = '#7ef9ff'; let s = gw * 0.7;
                            for (let i = 0; i < 512; i += 2) { let X0 = cx + (R[i] - L[i]) * 0.707 * s * 0.5, Y = cy - (L[i] + R[i]) * 0.707 * s * 0.5; if (Math.abs(X0 - cx) < gw / 2 && Math.abs(Y - cy) < gw / 2) x.fillRect(X0, Y, 1.4, 1.4); } }
                        let c = CR.length ? CR.reduce((a, v) => a + v, 0) / CR.length : 1, by = h - 8, bx = 4, bwd = gw;
                        x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(bx, by, bwd, 5); x.fillStyle = c < 0 ? '#ff4d6d' : c < 0.3 ? '#ffc04d' : '#7ef9ff'; let z = bx + bwd / 2, cxp = z + c * bwd / 2; x.fillRect(Math.min(z, cxp), by, Math.max(1.5, Math.abs(cxp - z)), 5);
                        x.fillStyle = '#fff'; x.fillRect(z - 0.5, by - 2, 1, 9);
                        let X0 = gw + 14, ww = w2 - X0 - 4, lx = f => X0 + Math.log(f / 20) / Math.log(1000) * ww, x1 = expo(40, 1000, P0.x1 == null ? 0.4 : P0.x1), x2 = expo(1000, 16000, P0.x2 == null ? 0.5 : P0.x2), mf = [0, 60, 100, 150, 250][idx(P0.mono, 5)], W = P0.width * 2, mid = h * 0.55;
                        [[20, x1, bw(P0.lw)], [x1, x2, bw(P0.mw)], [x2, 20000, bw(P0.hw)]].forEach(([f0, f1, k]) => { let v = W * k, a = lx(Math.max(f0, mf || 20)), e = lx(f1), y = mid - (v - 1) * (h * 0.22); if (e <= a) return; x.fillStyle = D.A; x.globalAlpha = 0.18 + Math.min(0.4, v * 0.15); x.fillRect(a, Math.min(y, mid), e - a - 1, Math.abs(y - mid) + 2); x.globalAlpha = 1; x.fillStyle = D.A; x.fillRect(a, y - 1, e - a - 1, 2); });
                        if (mf) { x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(X0, 14, lx(mf) - X0, h - 26); S.txt(x, 'MONO', X0 + 2, h - 14, 'rgba(255,255,255,0.4)', 8); }
                        [100, 1000, 10000].forEach(f => S.txt(x, f >= 1000 ? f / 1000 + 'k' : '' + f, lx(f) + 2, h - 3, 'rgba(255,255,255,0.35)', 8));
                        x.strokeStyle = 'rgba(255,255,255,0.3)'; x.setLineDash([2, 3]); x.beginPath(); x.moveTo(X0, mid); x.lineTo(X0 + ww, mid); x.stroke(); x.setLineDash([]);
                        S.txt(x, 'CORRELATION ' + (c >= 0 ? '+' : '') + c.toFixed(2), X0, 11, D.A, 10);
                        S.txt(x, Math.abs(BAL) < 0.5 ? 'CENTRED' : (BAL > 0 ? 'LEFT +' : 'RIGHT +') + Math.abs(BAL).toFixed(1) + ' dB', X0, 22, 'rgba(255,255,255,0.55)', 8);
                    },
                    kill() { if (w) bury([w]); stopAll(b)(); } };
            } },
        // trance gate. 16 steps, go nuts
        { id: 'cage', jp: '檻', en: 'CAGE', sub: 'trance gate. click steps on / off, drag them up / down for how far each opens. STEPS = pattern length. SOFT, DECAY, SUSTAIN, LENGTH + RELEASE shape each step. CHOPS the VOLUME or a FILTER. STEREO = same, PING PONG or offset', face: 'iron', part: 'nb_fx_cage', gate: true,
            p: [['rate', 'RATE', 0.33, F.pick(['1/32', '1/16', '1/8', '1/4'])], ['steps', 'STEPS', 0, F.pick(CGST.map(String))], ['depth', 'DEPTH', 1, F.pct], ['len', 'LENGTH', 0.6, F.pct], ['att', 'SOFT', 0.15, F.pct], ['dec', 'DECAY', 0.3, F.pct], ['sus', 'SUSTAIN', 1, F.pct], ['rel', 'RELEASE', 0.15, F.pct],
                ['swing', 'SWING', 0, v => Math.round(v * 66) + '%'], ['st', 'STEREO', 0, F.pick(CGLR)], ['what', 'CHOPS', 0, F.pick(['VOLUME', 'FILTER'])], ['cut', 'FILTER OPEN', 0.85, F.hz(200, 20000)], ['res', 'FILTER RES', 0.2, F.pct]],
            extra: () => ({ pat: [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1] }),
            idle(p) { let o = {}; if ((p.sus == null ? 1 : p.sus) > 0.99) o.dec = 'SUSTAIN is all the way up, nothing to fall to'; if (!idx(p.what || 0, 2)) { o.cut = 'only the FILTER chop has these'; o.res = 'only the FILTER chop has these'; } return o; },
            make(ctx) {
                let b = box(ctx), sp = ctx.createChannelSplitter(2), mg = ctx.createChannelMerger(2), G = [b.g(1), b.g(1)], Fl = [bq(ctx, 'lowpass', 20000, 0.7), bq(ctx, 'lowpass', 20000, 0.7)], wh = -1;
                b.in.connect(sp); [0, 1].forEach(c => { sp.connect(G[c], c); G[c].connect(Fl[c]); Fl[c].connect(mg, 0, c); }); mg.connect(b.wet);
                let P = null, bpm = 120, fresh = true;
                const lvOf = (pat, k) => { let v = pat[k]; return v === true ? 1 : +v || 0; };
                const stepAt = (k, c) => { let N = CGST[idx(P.steps || 0, CGST.length)], pat = P.pat || [], m = idx(P.st || 0, CGLR.length), q = ((k % N) + N) % N;
                    if (c === 1 && m >= 2) { let lag = [0, 0, 1, 2, N >> 1][m]; q = (((k - lag) % N) + N) % N; }
                    let v = lvOf(pat, q); if (m === 1 && v > 0) { let j = 0; for (let i = 0; i < q; i++) if (lvOf(pat, i) > 0) j++; if ((j % 2) !== c) v = 0; } return v; };
                return { in: b.in, out: b.out,
                    set(p, now, info) { P = p; bpm = info.bpm || bpm; let w2 = idx(p.what || 0, 2);
                        Fl.forEach(f => { f.frequency.value = w2 ? expo(200, 20000, p.cut == null ? 0.85 : p.cut) : 20000; f.Q.value = w2 ? 0.7 + (p.res || 0) * 9 : 0.7; });
                        if (w2 !== wh) { wh = w2; let t = ctx.currentTime; G.forEach(g => { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(1, t); }); Fl.forEach(f => { f.detune.cancelScheduledValues(t); f.detune.setValueAtTime(0, t); }); } },
                    sched(b0, b1, tb) {
                        if (!P) return;
                        let st = [0.125, 0.25, 0.5, 1][idx(P.rate, 4)], sd = st * 60 / bpm, att = 0.001 + P.att * sd * 0.5, rel = 0.001 + (P.rel == null ? P.att : P.rel) * sd * 0.5, sus = P.sus == null ? 1 : P.sus, dec = 0.002 + (P.dec == null ? 0.3 : P.dec) * sd * 0.8, w2 = idx(P.what || 0, 2);
                        const at = (c, lv) => w2 ? -(1 - lv) * P.depth * 7200 : (1 - P.depth) + P.depth * lv, prm = c => w2 ? Fl[c].detune : G[c].gain;
                        for (let k = Math.ceil(b0 / st - 1e-9); k * st < b1; k++) {
                            let sb = k * st + (k % 2 ? P.swing * st * 0.66 : 0), nb = (k + 1) * st + ((k + 1) % 2 ? P.swing * st * 0.66 : 0), t = tb(sb), te = tb(Math.min(nb, sb + st * Math.max(0.05, P.len)));
                            for (let c = 0; c < 2; c++) { let lv = stepAt(k, c), pr = prm(c), lo = at(c, 0);
                                if (fresh) pr.setValueAtTime(lv > 0 ? (sus < 0.99 ? at(c, lv) : lo) : lo, t);
                                if (lv > 0) { let hi = at(c, lv); pr.setTargetAtTime(hi, t, att); if (sus < 0.99 && t + att * 3 < te) pr.setTargetAtTime(lo + (hi - lo) * sus, t + att * 3, dec); pr.setTargetAtTime(lo, te, rel); }
                                else pr.setTargetAtTime(lo, t, rel); }
                            fresh = false;
                        }
                    },
                    rest() { fresh = true; let t = ctx.currentTime; G.forEach(g => { g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(1, t, 0.01); }); Fl.forEach(f => { f.detune.cancelScheduledValues(t); f.detune.setTargetAtTime(0, t, 0.01); }); },
                    draw(x, wd, h, D) {
                        S.bg(x, wd, h); if (!P) return;
                        let N = CGST[idx(P.steps || 0, CGST.length)], st = [0.125, 0.25, 0.5, 1][idx(P.rate, 4)], sd = st * 60 / bpm, att = 0.001 + P.att * sd * 0.5, rel = 0.001 + (P.rel == null ? P.att : P.rel) * sd * 0.5, sus = P.sus == null ? 1 : P.sus, dec = 0.002 + (P.dec == null ? 0.3 : P.dec) * sd * 0.8, low = idx(P.what || 0, 2) ? 0 : 1 - P.depth;
                        const Y = v => h - 6 - v * (h - 22), sx = wd / N;
                        x.strokeStyle = 'rgba(255,255,255,0.06)'; x.beginPath(); for (let k = 0; k <= N; k++) { x.moveTo(k * sx, 14); x.lineTo(k * sx, h); } x.stroke();
                        let lr = idx(P.st || 0, CGLR.length);
                        [0, 1].forEach(c => { if (c && !lr) return; let v = 0, pts = [], spp = 6;
                            for (let i = 0; i < wd * spp; i++) { let u = i / spp / sx, k = Math.floor(u), f = u - k, sw = k % 2 ? P.swing * 0.66 : 0, lv = stepAt(k, c), ton = f >= sw && f < Math.min(1, sw + Math.max(0.05, P.len)), dt = sd / sx / spp;
                                let tg = lv > 0 && ton ? (f - sw) * sd > att * 3 ? low + (1 - low) * lv * sus + (low + (1 - low) * lv - (low + (1 - low) * lv * sus)) * Math.exp(-((f - sw) * sd - att * 3) / dec) : low + (1 - low) * lv : low, tc = lv > 0 && ton ? att : rel;
                                v += (tg - v) * (1 - Math.exp(-dt / tc)); if (i % spp === 0) pts.push([i / spp, Y(v)]); }
                            if (c) x.setLineDash([3, 3]); S.line(x, pts, c ? '#ffffff' : D.A, 1.6); x.setLineDash([]);
                            if (!c) { x.fillStyle = D.A; x.globalAlpha = 0.12; x.beginPath(); x.moveTo(0, h); pts.forEach(q => x.lineTo(q[0], q[1])); x.lineTo(wd, h); x.fill(); x.globalAlpha = 1; } });
                        if (D.playing) { let k = Math.floor(D.pos / st), f = D.pos / st - k; x.fillStyle = '#fff'; x.fillRect((((k % N) + N) % N + f) * sx, 14, 1.5, h - 14); }
                        S.txt(x, ['VOLUME', 'FILTER'][idx(P.what || 0, 2)] + ' · ' + N + ' STEPS · ' + ['1/32', '1/16', '1/8', '1/4'][idx(P.rate, 4)] + (lr ? ' · ' + CGLR[lr] : ''), 6, 11, D.A);
                    },
                    kill: stopAll(b) };
            } },
        { id: 'lid', jp: '蓋', en: 'LID', sub: 'limiter. PUSH for loudness without going over the ceiling (it looks 2 ms ahead). CLEAN, SOFT or CLIP. TRUE PEAK also checks between samples. AUTO RELEASE adapts to the material', face: 'matte',
            p: [['push', 'PUSH', 0, F.db(0, 18)], ['ceil', 'CEILING', 0.95, F.db(-12, 0)], ['char', 'CHARACTER', 0, F.pick(['CLEAN', 'SOFT', 'CLIP'])], ['rel', 'RELEASE', 0.25, F.ms(0.01, 0.5)], ['tp', 'TRUE PEAK', 0.75, F.pick(['off', 'on'])], ['auto', 'AUTO RELEASE', 1, F.pick(['off', 'on'])]],
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-lid') : null, H = { g: [], o: [] }, P0 = null;
                if (w) { b.in.connect(w); w.connect(b.wet); w.port.onmessage = e => { let d = e.data; if (!d || d.g == null) return; H.g.push(d.g); H.o.push(d.o); if (H.g.length > 240) { H.g.shift(); H.o.shift(); } }; }
                let pre = b.g(1), sh = ctx.createWaveShaper(), sg = b.g(1), c = ctx.createDynamicsCompressor(), post = b.g(1), an = null, ck = -1, tp = ctx.createWaveShaper(), tk = '';
                if (!w) { c.ratio.value = 20; c.knee.value = 0; c.attack.value = 0.001; sh.oversample = '4x'; tp.oversample = '4x'; b.in.connect(pre); pre.connect(sh); sh.connect(sg); sg.connect(c); c.connect(tp); tp.connect(post); post.connect(b.wet); an = tap(ctx, post, 1024); }
                const Wp = n => w.parameters.get(n);
                return { in: b.in, out: b.out, wk: !w,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), ce = -12 + p.ceil * 12, ch = idx(p.char, 3);
                        if (w) { S2('push', Wp('push'), db2g(p.push * 18)); Wp('ceil').value = db2g(ce - 0.1); Wp('char').value = ch; Wp('tp').value = idx(p.tp == null ? 0.75 : p.tp, 2); Wp('rel').value = 0.01 + p.rel * 0.49; Wp('auto').value = idx(p.auto == null ? 1 : p.auto, 2); return; }
                        if (ch !== ck) { ck = ch; sh.curve = ch === 0 ? null : ch === 1 ? curveOf(x => Math.tanh(x * 1.6) / Math.tanh(1.6)) : curveOf(x => clamp(x * 1.25, -0.9, 0.9) / 0.9); }
                        let tk2 = idx(p.tp == null ? 0.75 : p.tp, 2) + ':' + Math.round(p.ceil * 100); if (tk2 !== tk) { tk = tk2; let cg = db2g(-12 + p.ceil * 12 - 0.2); tp.curve = idx(p.tp == null ? 0.75 : p.tp, 2) ? curveOf(x => Math.abs(x) <= cg * 0.9 ? x : Math.sign(x) * (cg * 0.9 + (cg * 0.1) * Math.tanh((Math.abs(x) - cg * 0.9) / (cg * 0.1))), 8192) : null; }
                        S2('push', pre.gain, db2g(p.push * 18) * 0.7); sg.gain.value = 1 / 0.7; S2('ceil', c.threshold, ce - 0.3); S2('rel', c.release, 0.01 + p.rel * 0.49); post.gain.value = 1;
                    },
                    get ap() { return w ? { push: [[Wp('push'), v => db2g(v * 18)]] } : { push: [[pre.gain, v => db2g(v * 18) * 0.7]] }; },
                    gr: () => w ? -(H.g[H.g.length - 1] || 0) : c.reduction,
                    lat: () => w ? Math.max(16, Math.round(ctx.sampleRate * 0.002)) / ctx.sampleRate : 0.006,
                    draw(x, w2, h, D) {
                        x.fillStyle = '#060606'; x.fillRect(0, 0, w2, h); if (!P0) return;
                        let ce = -12 + P0.ceil * 12, Y = db => 14 + Math.min(1, Math.max(0, -db / 24)) * (h - 18), N = 240, dx = w2 / N;
                        if (!w) { H.g.push(-c.reduction); H.o.push(S.meter(x, an)); if (H.g.length > N) { H.g.shift(); H.o.shift(); } }
                        let k0 = N - H.g.length; x.fillStyle = D.A; x.globalAlpha = 0.5; H.o.forEach((v, k) => { let y = Y(20 * Math.log10(v + 1e-6)); x.fillRect((k0 + k) * dx, y, Math.max(1, dx), h - y); }); x.globalAlpha = 1;
                        x.fillStyle = '#ff5a3a'; H.g.forEach((g, k) => { if (g > 0.05) x.fillRect((k0 + k) * dx, 14, Math.max(1, dx), Math.min(h - 18, g / 12 * (h - 18))); });
                        x.strokeStyle = '#fff'; x.setLineDash([3, 3]); x.beginPath(); x.moveTo(0, Y(ce)); x.lineTo(w2, Y(ce)); x.stroke(); x.setLineDash([]);
                        let g = H.g.length ? H.g[H.g.length - 1] : 0; S.txt(x, 'HOLDING DOWN ' + g.toFixed(1) + 'dB · ' + ['CLEAN', 'SOFT', 'CLIP'][idx(P0.char, 3)] + (idx(P0.tp == null ? 0.75 : P0.tp, 2) ? ' · TRUE PEAK' : ''), 6, 11, '#ff9a80');
                    },
                    kill() { if (w) bury([w]); stopAll(b)(); } };
            } },
        { id: 'clipper', jp: '削', en: 'CLIPPER', sub: 'clipper. DRIVE into the CEILING to shave the peaks: HARD, SOFT, KNEE or TUBE. QUALITY = oversampling (up to 8x). put LID after it to be safe', face: 'hazard', part: 'nb_fx_clipper',
            p: [['drive', 'DRIVE', 0, F.db(0, 24)], ['ceil', 'CEILING', 1, F.db(-12, 0)], ['shape', 'SHAPE', 0, F.pick(['HARD', 'SOFT', 'KNEE', 'TUBE'])], ['knee', 'KNEE', 0.3, F.pct], ['os', 'QUALITY', 0.625, F.pick(['1x', '2x', '4x', '8x'])], ['out', 'OUTPUT', 1, F.db(-12, 0)], ['mix', 'MIX', 1, F.pct]],
            idle(p) { return idx(p.shape, 4) === 2 ? {} : { knee: 'only KNEE has one' }; },
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-clip') : null, sh = w ? null : ctx.createWaveShaper(), og = b.g(1), H = [], P0 = null, ck = '';
                if (w) { b.in.connect(w); w.connect(og); w.port.onmessage = e => { if (typeof e.data === 'number') { H.push(e.data); if (H.length > 240) H.shift(); } }; } else { sh.oversample = '4x'; b.in.connect(sh); sh.connect(og); }
                og.connect(b.wet);
                const Wp = n => w.parameters.get(n), shape = (u, s2, k) => { let a = Math.abs(u); if (s2 === 0) return Math.max(-1, Math.min(1, u)); if (s2 === 1) return Math.tanh(u); if (s2 === 2) { let lo = 1 - k; return a <= lo ? u : a >= 1 + k ? Math.sign(u) : Math.sign(u) * (lo + (a - lo) - (a - lo) * (a - lo) / (4 * k)); } return u >= 0 ? Math.tanh(u) : Math.tanh(u * 1.25) / 1.25; };
                return { in: b.in, out: b.out, wk: !w, lat: () => w ? [0, 6, 9, 10.5][idx(P0 ? P0.os : 0.625, 4)] / ctx.sampleRate : 0,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), dr = db2g(p.drive * 24), ce = db2g(-12 + p.ceil * 12), s2 = idx(p.shape, 4), kn = Math.max(0.02, p.knee * 0.5);
                        if (w) { S2('drive', Wp('drive'), dr); Wp('ceil').value = ce; Wp('shape').value = s2; Wp('knee').value = p.knee; Wp('os').value = [1, 2, 4, 8][idx(p.os, 4)]; }
                        else { let k = [s2, Math.round(p.drive * 40), Math.round(p.ceil * 40), Math.round(p.knee * 20)].join(); if (k !== ck) { ck = k; sh.curve = curveOf(x => shape(x * dr / ce, s2, kn) * ce, 4096); } }
                        S2('out', og.gain, db2g(-12 + p.out * 12)); S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix);
                    },
                    get ap() { let a = { out: [[og.gain, v => db2g(-12 + v * 12)]], mix: mixAp(b) }; if (w) a.drive = [[Wp('drive'), v => db2g(v * 24)]]; return a; },
                    draw(x, wd, h, D) {
                        S.bg(x, wd, h); if (!P0) return; let s2 = idx(P0.shape, 4), dr = db2g(P0.drive * 24), ce = db2g(-12 + P0.ceil * 12), kn = Math.max(0.02, P0.knee * 0.5), cw = Math.min(h - 8, wd * 0.4), ox = wd - cw - 6, oy = 4;
                        let N = 240, gw = ox - 10, dx = gw / N, k0 = N - H.length; x.fillStyle = '#ff4d3a'; H.forEach((v, k) => { if (v > 0) { let hh = Math.min(1, Math.sqrt(v) * 1.3) * (h - 18); x.fillRect((k0 + k) * dx, h - 4 - hh, Math.max(1, dx), hh); } });
                        x.strokeStyle = 'rgba(255,255,255,0.12)'; x.strokeRect(ox + 0.5, oy + 0.5, cw, cw); let pts = []; for (let q = 0; q <= 60; q++) { let u = -1.5 + q / 20; pts.push([ox + (u + 1.5) / 3 * cw, oy + cw / 2 - shape(u * dr / ce, s2, kn) * ce / 1.5 * cw / 2]); } S.line(x, pts, D.A, 1.4);
                        x.setLineDash([2, 3]); x.strokeStyle = 'rgba(255,255,255,0.4)'; x.beginPath(); x.moveTo(ox, oy + cw / 2 - ce / 1.5 * cw / 2); x.lineTo(ox + cw, oy + cw / 2 - ce / 1.5 * cw / 2); x.stroke(); x.setLineDash([]);
                        let v = H.length ? H[H.length - 1] : 0; S.txt(x, ['HARD', 'SOFT', 'KNEE', 'TUBE'][s2] + ' · ' + ['1x', '2x', '4x', '8x'][idx(P0.os, 4)] + (v > 0 ? ' · cutting ' + (Math.min(100, v * 100)).toFixed(1) + '%' : ''), 6, 11, D.A);
                    },
                    kill() { if (w) bury([w]); stopAll(b)(); } };
            } },
        { id: 'root', jp: '根', en: 'ROOT', sub: 'low end. SUB adds an octave below, HARMONICS adds overtones so the bass reads on small speakers. CROSSOVER = where the low end starts, PULL BACK = less of the original lows',
            p: [['xo', 'CROSSOVER', 0.45, F.hz(30, 300)], ['sub', 'SUB', 0, F.pct], ['harm', 'HARMONICS', 0.4, F.pct], ['drive', 'BITE', 0.3, F.pct], ['cut', 'PULL BACK', 0, F.pct], ['out', 'OUTPUT', 0.5, F.db(-12, 12)], ['mix', 'MIX', 1, F.pct]],
            face: 'iron', part: 'nb_fx_root',
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-root') : null, og = b.g(1), P0 = null, F = null;
                if (w) { b.in.connect(w); w.connect(og); }
                else {
                    F = { sh: bq(ctx, 'lowshelf', 60, 0), lp: bq(ctx, 'lowpass', 100, -3.0103), ws: ctx.createWaveShaper(), hp: bq(ctx, 'highpass', 130, -3.0103), lp2: bq(ctx, 'lowpass', 600, -3.0103), hg: b.g(0), cut: bq(ctx, 'highpass', 20, -3.0103), ck: -1 };
                    F.ws.oversample = '2x'; b.in.connect(F.sh); F.sh.connect(F.cut); F.cut.connect(og); b.in.connect(F.lp); F.lp.connect(F.ws); F.ws.connect(F.hp); F.hp.connect(F.lp2); F.lp2.connect(F.hg); F.hg.connect(og);
                }
                og.connect(b.wet);
                const Wp = n => w.parameters.get(n);
                return { in: b.in, out: b.out, wk: !w, lat: () => 0,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip);
                        if (w) { S2('xo', Wp('xo'), expo(30, 300, p.xo)); S2('sub', Wp('sub'), p.sub * 1.6); S2('harm', Wp('harm'), p.harm * 1.6); S2('drive', Wp('drive'), 0.5 + p.drive * 7.5); S2('cut', Wp('cut'), p.cut); }
                        else { let xo = expo(30, 300, p.xo), k = 0.5 + p.drive * 7.5; S2('xo', F.sh.frequency, xo * 0.7); S2('sub', F.sh.gain, p.sub * 9); S2('xo', F.lp.frequency, xo); S2('xo', F.hp.frequency, xo * 1.3); S2('xo', F.lp2.frequency, xo * 6);
                            S2('harm', F.hg.gain, p.harm * 1.3); S2('cut', F.cut.frequency, 20 + p.cut * xo * 0.8);
                            let kk = Math.round(k * 4); if (kk !== F.ck) { F.ck = kk; F.ws.curve = curveOf(x => { let u = x * k; return (Math.tanh(u) + 0.6 * u * Math.abs(u) / (1 + u * u)) / 1.6; }, 2048); } }
                        S2('out', og.gain, db2g(-12 + p.out * 24)); S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix);
                    },
                    get ap() { let a = { out: [[og.gain, v => db2g(-12 + v * 24)]], mix: mixAp(b) }; if (w) { a.sub = [[Wp('sub'), v => v * 1.6]]; a.harm = [[Wp('harm'), v => v * 1.6]]; } return a; },
                    draw(x, wd, h, D) {
                        S.bg(x, wd, h); if (!P0) return; let xo = expo(30, 300, P0.xo), fx = f => 6 + Math.log(f / 15) / Math.log(4000 / 15) * (wd - 12), bot = h - 6;
                        x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(6, 14, fx(xo) - 6, bot - 14);
                        x.fillStyle = D.A; let hs = P0.sub * (bot - 20); if (P0.sub > 0.01) x.fillRect(fx(xo * 0.5) - 3, bot - hs, 6, hs);
                        for (let k = 2; k <= 6; k++) { let hh = P0.harm * (bot - 20) / Math.sqrt(k); if (P0.harm > 0.01) { x.globalAlpha = 0.85; x.fillRect(fx(xo * 0.7 * k) - 2, bot - hh, 4, hh); } } x.globalAlpha = 1;
                        x.strokeStyle = 'rgba(255,255,255,0.4)'; x.setLineDash([2, 3]); x.beginPath(); x.moveTo(fx(xo), 14); x.lineTo(fx(xo), bot); x.stroke(); x.setLineDash([]);
                        S.txt(x, 'ROOT · under ' + Math.round(xo) + ' Hz' + (P0.sub > 0.01 ? ' · sub' : '') + (P0.harm > 0.01 ? ' · harmonics' : ''), 6, 11, D.A);
                    },
                    kill() { if (w) bury([w]); stopAll(b)(); } };
            } },
        { id: 'fold', jp: '折', en: 'FOLD', sub: 'wavefolder. FOLD pushes the wave past the top so it folds back, adding harmonics. SINE, TRIANGLE or TWICE. OFFSET makes it uneven + nastier, TONE tames the fizz',
            p: [['fold', 'FOLD', 0.3, v => 'x' + expo(0.5, 40, v).toFixed(1)], ['bias', 'OFFSET', 0.5, v => ((v - 0.5) * 200).toFixed(0) + '%'], ['shape', 'SHAPE', 0, F.pick(['SINE', 'TRIANGLE', 'TWICE'])], ['tone', 'TONE', 0.75, F.hz(800, 20000)], ['out', 'OUTPUT', 0.5, F.db(-12, 12)], ['mix', 'MIX', 1, F.pct]],
            face: 'chrome', part: 'nb_fx_fold',
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-fold') : null, sh = w ? null : ctx.createWaveShaper(), lp = bq(ctx, 'lowpass', 12000, 0.5), og = b.g(1), P0 = null, ck = '';
                const fo = (u, m) => { if (m === 1) return 0.6366198 * Math.asin(Math.sin(1.5707963 * u)); let y = Math.sin(1.5707963 * u); return m === 2 ? Math.sin(1.5707963 * y * 2.2) : y; };
                if (w) b.in.connect(w), w.connect(lp); else { sh.oversample = '4x'; b.in.connect(sh); sh.connect(lp); }
                lp.connect(og); og.connect(b.wet);
                const Wp = n => w.parameters.get(n);
                return { in: b.in, out: b.out, wk: !w, lat: () => w ? 6 / ctx.sampleRate : 0,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), g = expo(0.5, 40, p.fold), bi = (p.bias - 0.5) * 2, m = idx(p.shape, 3);
                        if (w) { S2('fold', Wp('gain'), g); S2('bias', Wp('bias'), bi); Wp('shape').value = m; }
                        else { let k = [Math.round(p.fold * 60), Math.round(p.bias * 40), m].join(); if (k !== ck) { ck = k; let r = fo(bi, m); sh.curve = curveOf(u => fo(u * g + bi, m) - r, 4096); } }
                        S2('tone', lp.frequency, expo(800, 20000, p.tone)); S2('out', og.gain, db2g(-12 + p.out * 24)); S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix);
                    },
                    get ap() { let a = { tone: [[lp.frequency, v => expo(800, 20000, v)]], out: [[og.gain, v => db2g(-12 + v * 24)]], mix: mixAp(b) }; if (w) { a.fold = [[Wp('gain'), v => expo(0.5, 40, v)]]; a.bias = [[Wp('bias'), v => (v - 0.5) * 2]]; } return a; },
                    draw(x, wd, h, D) {
                        S.bg(x, wd, h); if (!P0) return; let g = expo(0.5, 40, P0.fold), bi = (P0.bias - 0.5) * 2, m = idx(P0.shape, 3), r = fo(bi, m), mid = h / 2 + 5, A = (h - 22) / 2, pin = [], pout = [];
                        for (let i = 0; i <= 200; i++) { let u = Math.sin(i / 200 * Math.PI * 4), X0 = 6 + i / 200 * (wd - 12); pin.push([X0, mid - u * A]); pout.push([X0, mid - Math.max(-1.2, Math.min(1.2, fo(u * g + bi, m) - r)) * A]); }
                        S.line(x, pin, 'rgba(255,255,255,0.18)', 1); S.line(x, pout, D.A, 1.5);
                        S.txt(x, ['SINE', 'TRIANGLE', 'TWICE'][m] + ' · x' + g.toFixed(1), 6, 11, D.A);
                    },
                    kill() { if (w) bury([w]); stopAll(b)(); } };
            } },
        { id: 'tiers', jp: '段', en: 'TIERS', sub: '3 band distortion. split at LOW + HIGH SPLIT, each band gets its own DRIVE + LEVEL, one STYLE: WARM, BITE or FUZZ. keep the lows clean, drive the mids',
            p: [['xl', 'LOW SPLIT', 0.35, F.hz(60, 600)], ['xh', 'HIGH SPLIT', 0.55, F.hz(1000, 8000)], ['ld', 'LOW DRIVE', 0.1, F.pct], ['md', 'MID DRIVE', 0.6, F.pct], ['hd', 'HIGH DRIVE', 0.35, F.pct],
                ['ll', 'LOW LEVEL', 0.5, F.db(-12, 12)], ['ml', 'MID LEVEL', 0.5, F.db(-12, 12)], ['hl', 'HIGH LEVEL', 0.5, F.db(-12, 12)], ['style', 'STYLE', 0, F.pick(['WARM', 'BITE', 'FUZZ'])], ['out', 'OUTPUT', 0.5, F.db(-12, 12)], ['mix', 'MIX', 1, F.pct]],
            face: 'char', part: 'nb_fx_tiers',
            make(ctx) {
                let b = box(ctx), og = b.g(1), P0 = null, sum = b.g(1);
                const lr = (type, f) => [bq(ctx, type, f, -3.0103), bq(ctx, type, f, -3.0103)], chain = (a, list) => list.reduce((p, n) => { p.connect(n); return n; }, a);
                let L1 = lr('lowpass', 150), H1 = lr('highpass', 150), L2 = lr('lowpass', 2500), H2 = lr('highpass', 2500), AL = lr('lowpass', 2500), AH = lr('highpass', 2500), apS = b.g(1);
                let lowEnd = chain(b.in, L1); lowEnd.connect(AL[0]); lowEnd.connect(AH[0]); chain(AL[0], [AL[1]]).connect(apS); chain(AH[0], [AH[1]]).connect(apS);
                let hiEnd = chain(b.in, H1); let midEnd = chain(hiEnd, L2), topEnd = chain(hiEnd, H2);
                const band = from => { let sh = ctx.createWaveShaper(), lv = b.g(1); sh.oversample = '4x'; from.connect(sh); sh.connect(lv); lv.connect(sum); return { sh, lv, ck: '' }; };
                let B = [band(apS), band(midEnd), band(topEnd)]; sum.connect(og); og.connect(b.wet);
                const cv = (st, k) => { if (k < 1.05) return null; let n = Math.tanh(k);
                    return st === 1 ? curveOf(x => { let u = x * k; return u / Math.pow(1 + Math.pow(Math.abs(u), 4), 0.25) / (k / Math.pow(1 + Math.pow(k, 4), 0.25)); }, 4096)
                        : st === 2 ? curveOf(x => (Math.tanh(k * (x + 0.25)) - Math.tanh(k * 0.25)) / (n * 1.2), 4096) : curveOf(x => Math.tanh(k * x) / n, 4096); };
                return { in: b.in, out: b.out, wk: false, lat: () => 0,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), fl = expo(60, 600, p.xl), fh = Math.max(fl * 2, expo(1000, 8000, p.xh)), st = idx(p.style, 3);
                        L1.concat(H1).forEach(f => S2('xl', f.frequency, fl)); L2.concat(H2, AL, AH).forEach(f => S2('xh', f.frequency, fh));
                        [[p.ld, p.ll], [p.md, p.ml], [p.hd, p.hl]].forEach(([dv, lvv], i) => { let k = 1 + dv * dv * 30, key = st + ':' + Math.round(k * 4); if (B[i].ck !== key) { B[i].ck = key; B[i].sh.curve = cv(st, k); }
                            S2(['ll', 'ml', 'hl'][i], B[i].lv.gain, db2g(-12 + lvv * 24) / (1 + dv * 0.6)); });
                        S2('out', og.gain, db2g(-12 + p.out * 24)); S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix);
                    },
                    get ap() { return { out: [[og.gain, v => db2g(-12 + v * 24)]], mix: mixAp(b) }; },
                    draw(x, wd, h, D) {
                        S.bg(x, wd, h); if (!P0) return; let fl = expo(60, 600, P0.xl), fh = Math.max(fl * 2, expo(1000, 8000, P0.xh)), fx = f => 6 + Math.log(f / 20) / Math.log(1000) * (wd - 12), bot = h - 6;
                        [[20, fl, P0.ld, P0.ll], [fl, fh, P0.md, P0.ml], [fh, 20000, P0.hd, P0.hl]].forEach(([a, z, dv, lvv]) => { let hh = (0.25 + lvv * 0.6) * (bot - 16); x.fillStyle = D.A; x.globalAlpha = 0.15 + dv * 0.8; x.fillRect(fx(a) + 1, bot - hh, fx(z) - fx(a) - 2, hh); });
                        x.globalAlpha = 1; S.txt(x, ['WARM', 'BITE', 'FUZZ'][idx(P0.style, 3)] + ' · ' + Math.round(fl) + ' / ' + (fh >= 1000 ? (fh / 1000).toFixed(1) + 'k' : Math.round(fh)), 6, 11, D.A);
                    },
                    kill() { stopAll(b)(); } };
            } },
        // guitar amp sim. it's not neural dsp but its mine
        { id: 'stack', jp: '轟', en: 'STACK', sub: 'amp + cab. MODEL: CLEAN, CRUNCH, HIGH GAIN, FUZZ, BASS. GAIN, TIGHT (cuts lows before the amp), BASS / MID / TREBLE / PRESENCE, SAG, CAB + mic position', face: 'iron', part: 'nb_fx_stack',
            p: [['model', 'MODEL', 0.3, F.pick(['CLEAN', 'CRUNCH', 'HIGH GAIN', 'FUZZ', 'BASS'])], ['gain', 'GAIN', 0.4, F.pct], ['tight', 'TIGHT', 0.3, F.hz(20, 600)], ['bass', 'BASS', 0.5, F.db(-10, 10)], ['mid', 'MID', 0.5, F.db(-10, 10)], ['treble', 'TREBLE', 0.5, F.db(-10, 10)], ['pres', 'PRESENCE', 0.5, F.db(-6, 6)],
                ['sag', 'SAG', 0.4, F.pct], ['cab', 'CAB', 0, F.pick(['4x12', '1x12', '2x10', '8x10 BASS', 'NO CAB'])], ['mic', 'MIC', 0.4, v => v < 0.2 ? 'centre' : v > 0.8 ? 'edge' : Math.round(v * 100) + '% out'], ['level', 'LEVEL', 0.67, F.db(-24, 12)], ['mix', 'MIX', 1, F.pct]],
            idle(p) { return idx(p.cab, 5) === 4 ? { mic: 'theres no cab to put a mic on' } : {}; },
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-amp') : null, sh = w ? null : ctx.createWaveShaper(), lv = b.g(1), P0 = null, pk = 0, ck = '';
                let tb = bq(ctx, 'lowshelf', 100, 0.7), tm = bq(ctx, 'peaking', 650, 0.8), tt = bq(ctx, 'highshelf', 3000, 0.7), tp = bq(ctx, 'highshelf', 5000, 0.7);
                let c1 = bq(ctx, 'highpass', 80, 0.7), c2 = bq(ctx, 'peaking', 110, 1.2), c3 = bq(ctx, 'peaking', 2200, 1), c4 = bq(ctx, 'notch', 4800, 2), c5 = bq(ctx, 'lowpass', 5500, 0.7), c6 = bq(ctx, 'lowpass', 5500, 0.7);
                let chain = [tb, tm, tt, tp, c1, c2, c3, c4, c5, c6]; if (w) { b.in.connect(w); w.connect(tb); w.port.onmessage = e => { if (typeof e.data === 'number') pk = Math.max(e.data, pk * 0.8); }; } else { sh.oversample = '2x'; b.in.connect(sh); sh.connect(tb); }
                chain.reduce((a, n2) => { a.connect(n2); return n2; }); c6.connect(lv); lv.connect(b.wet);
                const Wp = n => w.parameters.get(n);
                return { in: b.in, out: b.out, wk: !w, lat: () => w ? 6 / ctx.sampleRate : 0,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), m = idx(p.model, 5), g = expo(0.5, 60, p.gain), cab = idx(p.cab, 5), mic = p.mic == null ? 0.4 : p.mic;
                        if (w) { S2('gain', Wp('gain'), g); Wp('model').value = m; Wp('sag').value = p.sag; Wp('tight').value = expo(20, 600, p.tight); }
                        else { let k = m + ':' + Math.round(p.gain * 30); if (k !== ck) { ck = k; sh.curve = curveOf(x => Math.tanh(x * g * [0.35, 2, 8, 20, 1][m]) , 4096); } }
                        S2('bass', tb.gain, -10 + p.bass * 20); S2('mid', tm.gain, -10 + p.mid * 20); S2('treble', tt.gain, -10 + p.treble * 20); S2('pres', tp.gain, -6 + p.pres * 12);
                        let C = [[80, 110, 4, 3, 4800, 5500], [90, 150, 3, 4, 5600, 6500], [110, 180, 2, 5, 6000, 7500], [40, 80, 5, 1, 3000, 4000], [10, 100, 0, 0, 20000, 20000]][cab], dark = cab === 4 ? 1 : 1.3 - mic * 0.6;
                        c1.frequency.value = C[0]; c2.frequency.value = C[1]; c2.gain.value = C[2]; c3.gain.value = cab === 4 ? 0 : C[3] * (1.2 - mic * 0.6); c4.frequency.value = C[4]; c4.Q.value = cab === 4 ? 0.0001 : 2; c4.type = cab === 4 ? 'allpass' : 'notch';
                        c5.frequency.value = Math.min(20000, C[5] * dark); c6.frequency.value = Math.min(20000, C[5] * dark);
                        let K = g * [0.35, 0.9, 2.2, 3.5, 0.6][m] * (m >= 1 ? [1, 2.2, 4, 6, 1.6][m] : 1), nm = 1 / Math.max(0.35, Math.tanh(K * 0.4));
                        S2('level', lv.gain, db2g(-24 + p.level * 36) * db2g([-4, -3, -4.7, -5.2, -4][m]) * nm);
                        S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix);
                    },
                    get ap() { let a = { level: [[lv.gain, v => db2g(-24 + v * 36)]], mix: mixAp(b) }; if (w) a.gain = [[Wp('gain'), v => expo(0.5, 60, v)]]; return a; },
                    draw(x, wd, h, D) {
                        S.bg(x, wd, h); if (!P0) return; let m = idx(P0.model, 5), cx = 34, cy = h / 2 + 4, R = Math.min(30, h / 2 - 6), push = Math.min(1, pk * 1.4);
                        x.fillStyle = '#0d0d0f'; x.beginPath(); x.arc(cx, cy, R + 3, 0, 7); x.fill(); let gr = x.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, R); gr.addColorStop(0, '#3a3a40'); gr.addColorStop(1, '#09090b'); x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, R * (0.96 + push * 0.04), 0, 7); x.fill();
                        x.fillStyle = D.A; x.globalAlpha = 0.35 + push * 0.6; x.beginPath(); x.arc(cx, cy, R * 0.28 * (1 + push * 0.15), 0, 7); x.fill(); x.globalAlpha = 1;
                        let fr = new Float32Array(120); for (let i = 0; i < 120; i++) fr[i] = 40 * Math.pow(400, i / 119); let rsp = respOf(chain, fr), X0 = 76, ww = wd - X0 - 6, pts = [];
                        for (let i = 0; i < 120; i++) pts.push([X0 + i / 119 * ww, clamp(h * 0.55 - 20 * Math.log10(Math.max(1e-4, rsp[i])) / 30 * h * 0.45, 14, h - 2)]); S.line(x, pts, D.A, 1.4);
                        S.txt(x, ['CLEAN', 'CRUNCH', 'HIGH GAIN', 'FUZZ', 'BASS'][m] + ' · ' + ['4x12', '1x12', '2x10', '8x10 BASS', 'NO CAB'][idx(P0.cab, 5)], 6, 11, D.A);
                    },
                    kill() { if (w) bury([w]); stopAll(b)(); } };
            } },
        { id: 'rot', jp: '腐', en: 'ROT', sub: 'make it old. hiss, wobble, dust', face: 'rust',
            p: [['noise', 'NOISE', 0, F.pick(['TAPE', 'VINYL', 'RAIN'])], ['amt', 'NOISE AMT', 0.15, F.pct], ['wow', 'WOW', 0.2, F.pct], ['flut', 'FLUTTER', 0.15, F.pct], ['age', 'AGE', 0.3, F.pct], ['crack', 'CRACKLE', 0.1, F.pct], ['spk', 'SPEAKER', 0, F.pick(['none', 'PHONE', 'RADIO', 'LAPTOP', 'MEGAPHONE', 'THROUGH A WALL', 'TOY', 'CASSETTE PLAYER', 'OLD TV'])], ['digi', 'DIGITAL', 0, F.pct], ['mono', 'MONO', 0, F.pct], ['mix', 'MIX', 1, F.pct]],
            ver: 2, fix(p) { if ((p._v || 1) < 2) { if (p.spk != null) p.spk = (Math.min(6, Math.floor(p.spk * 7)) + 0.5) / 9; p._v = 2; } return p; },
            make(ctx) {
                let b = box(ctx), d = ctx.createDelay(0.1), w1 = ctx.createOscillator(), w2 = ctx.createOscillator(), g1 = b.g(0), g2 = b.g(0), lp = bq(ctx, 'lowpass', 12000, 0.5), hp = bq(ctx, 'highpass', 30, 0.5), cr = null, P0 = null;
                d.delayTime.value = 0.012; w1.frequency.value = 0.55; w2.frequency.value = 7.3;
                w1.connect(g1); g1.connect(d.delayTime); w2.connect(g2); g2.connect(d.delayTime); w1.start(); w2.start();
                let wn = ctx.createBufferSource(), wnl = bq(ctx, 'lowpass', 1.2, 0.5), wng = b.g(0), fnl = bq(ctx, 'bandpass', 9, 1.5), fng = b.g(0);
                let msp = ctx.createChannelSplitter(2), mmg = ctx.createChannelMerger(2), mLL = b.g(1), mRR = b.g(1), mLR = b.g(0), mRL = b.g(0);
                b.in.connect(msp); msp.connect(mLL, 0); msp.connect(mRL, 0); msp.connect(mRR, 1); msp.connect(mLR, 1); mLL.connect(mmg, 0, 0); mLR.connect(mmg, 0, 0); mRR.connect(mmg, 0, 1); mRL.connect(mmg, 0, 1);
                mmg.connect(d); d.connect(hp); hp.connect(lp);
                if (ctx._nbwk) { cr = wkNode(ctx, 'nb-crush'); }
                let sk1 = bq(ctx, 'allpass', 1000, 0.7), sk2 = bq(ctx, 'allpass', 1000, 0.7), sk3 = bq(ctx, 'peaking', 1000, 1), skw = ctx.createWaveShaper(), skk = -1; skw.oversample = '2x';
                sk1.connect(sk2); sk2.connect(sk3); sk3.connect(skw); skw.connect(b.wet);
                if (cr) { lp.connect(cr); cr.connect(sk1); } else lp.connect(sk1);
                let sd = 4321, rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
                let n = ctx.sampleRate * 4, beds = [0, 1, 2].map(k => { let bf = ctx.createBuffer(2, n, ctx.sampleRate); for (let c = 0; c < 2; c++) { let x = bf.getChannelData(c), l = 0; for (let i = 0; i < n; i++) { let r = rnd() * 2 - 1; if (k === 0) { l += (r - l) * 0.45; x[i] = l * 0.6; } else if (k === 1) { l += (r - l) * 0.06; x[i] = l * 0.5 + (rnd() < 0.0006 ? (rnd() - 0.5) * 2 : 0); } else { l += (r - l) * 0.15; x[i] = l * 0.25; if (rnd() < 0.004) { let a = (rnd() - 0.3) * 0.9; for (let j = 0; j < 220 && i + j < n; j++) x[i + j] += a * Math.exp(-j / 30) * Math.sin(j * 0.4); } } } } return bf; });
                let cb = ctx.createBuffer(2, n, ctx.sampleRate); for (let c = 0; c < 2; c++) { let k = cb.getChannelData(c); for (let i = 0; i < n; i++) if (rnd() < 0.0004) { let a = (rnd() - 0.5) * 1.6; for (let j = 0; j < 30 && i + j < n; j++) k[i + j] += a * Math.exp(-j / 5); } }
                let srcs = beds.concat([cb]).map(bf => { let s = ctx.createBufferSource(); s.buffer = bf; s.loop = true; s.start(); return s; }), bg = beds.map(() => b.g(0)), cg = b.g(0);
                srcs.forEach((s, i) => { if (i < 3) { s.connect(bg[i]); bg[i].connect(b.wet); } else { s.connect(cg); cg.connect(b.wet); } });
                wn.buffer = beds[0]; wn.loop = true; wn.playbackRate.value = 0.05; wn.connect(wnl); wnl.connect(wng); wng.connect(d.delayTime); wn.connect(fnl); fnl.connect(fng); fng.connect(d.delayTime); wn.start(); srcs.push(wn);
                return { in: b.in, out: b.out, wk: !cr && !ctx._nbwk,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), nk = idx(p.noise, 3);
                        S2('wow', g1.gain, p.wow * 0.004); S2('wow', wng.gain, p.wow * 0.03); S2('flut', g2.gain, p.flut * 0.0006); S2('flut', fng.gain, p.flut * 0.004);
                        let mo = p.mono || 0; mLL.gain.value = mRR.gain.value = 1 - mo * 0.5; mLR.gain.value = mRL.gain.value = mo * 0.5; S2('age', lp.frequency, expo(1800, 16000, 1 - p.age)); hp.frequency.value = 30 + p.age * 220;
                        bg.forEach((g, i) => S2('amt', g.gain, i === nk ? p.amt * [0.12, 0.25, 0.5][i] : 0)); S2('crack', cg.gain, p.crack * 0.5);
                        if (cr) { cr.parameters.get('bits').value = 16 - p.digi * 12; cr.parameters.get('down').value = 1 + Math.pow(p.digi, 2) * 18; cr.parameters.get('jitter').value = p.digi * 0.5; }
                        let sp = idx(p.spk || 0, 9); if (sp !== skk) { skk = sp;
                            const SP = [null, [['highpass', 400, 0.8], ['lowpass', 3400, 0.9], [1600, 3, 5], 2.5], [['highpass', 220, 0.7], ['lowpass', 4500, 0.7], [1100, 1.2, 4], 1.6], [['highpass', 180, 0.7], ['lowpass', 9000, 0.7], [3200, 2, 4], 1.2],
                                [['highpass', 600, 1.2], ['lowpass', 3000, 1.4], [1900, 2.5, 9], 6], [['lowpass', 220, 0.6], ['lowpass', 900, 0.5], [70, 1, 7], 1.4], [['highpass', 700, 1.5], ['lowpass', 5000, 1], [2400, 4, 10], 4],
                                [['highpass', 160, 0.8], ['lowpass', 7000, 0.8], [2800, 1.5, 3], 2], [['highpass', 300, 1], ['lowpass', 6000, 1.2], [3500, 3, 6], 2.8]][sp];
                            if (!SP) { sk1.type = sk2.type = 'allpass'; sk3.gain.value = 0; skw.curve = null; }
                            else { sk1.type = SP[0][0]; sk1.frequency.value = SP[0][1]; sk1.Q.value = SP[0][2]; sk2.type = SP[1][0]; sk2.frequency.value = SP[1][1]; sk2.Q.value = SP[1][2]; sk3.frequency.value = SP[2][0]; sk3.Q.value = SP[2][1]; sk3.gain.value = SP[2][2]; let d = SP[3]; skw.curve = curveOf(x => Math.tanh(x * d) / Math.tanh(d)); } }
                        S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix);
                    },
                    ap: { age: [[lp.frequency, v => expo(1800, 16000, 1 - v)]], mix: mixAp(b) },
                    draw(x, w, h, D) {
                        x.fillStyle = '#1a0f08'; x.fillRect(0, 0, w, h); if (!P0) return;
                        let sp = D.playing ? 1 : 0.15, t = D.now * sp * 2.2 + Math.sin(D.now * 3.4) * P0.wow * 0.5;
                        [[w * 0.3, -1], [w * 0.7, 1]].forEach(([cx, dir]) => { let cy = h / 2, R = h / 2 - 6; x.fillStyle = '#3a2416'; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.fill(); x.strokeStyle = '#c48a4a'; x.lineWidth = 2; for (let k = 0; k < 3; k++) { let a = t * dir + k * 2.09; x.beginPath(); x.moveTo(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5); x.lineTo(cx + Math.cos(a) * R * 0.85, cy + Math.sin(a) * R * 0.85); x.stroke(); } x.fillStyle = '#c48a4a'; x.beginPath(); x.arc(cx, cy, 4, 0, 7); x.fill(); });
                        x.strokeStyle = 'rgba(196,138,74,0.6)'; x.beginPath(); x.moveTo(w * 0.3, h - 6); x.lineTo(w * 0.7, h - 6); x.stroke();
                        let spk = idx(P0.spk || 0, 9); S.txt(x, ['TAPE', 'VINYL', 'RAIN'][idx(P0.noise, 3)] + (spk ? ' · ' + ['', 'PHONE', 'RADIO', 'LAPTOP', 'MEGAPHONE', 'THROUGH A WALL', 'TOY', 'CASSETTE PLAYER', 'OLD TV'][spk] : '') + ((P0.mono || 0) > 0.5 ? ' · MONO' : ''), 4, 10, '#e8b080');
                    },
                    kill: stopAll(b, [w1, w2].concat(srcs)) };
            } },
        { id: 'shatter', jp: '砕', en: 'SHATTER', sub: 'bitcrusher. fewer BITS, a lower RATE, or pick a MACHINE', face: 'grit',
            p: [['machine', 'MACHINE', 0, F.pick(SHM.map(m => m[0]))], ['bits', 'BITS', 0.6, v => Math.round(1 + v * 15) + ''], ['down', 'RATE', 0.25, v => { let d = 1 + Math.pow(v, 2) * 49; return Math.round(44100 / d / 100) / 10 + 'k'; }], ['jitter', 'JITTER', 0, F.pct],
                ['filt', 'FILTERS', 0, F.pick(['RAW', 'BEFORE', 'AFTER', 'BOTH'])], ['mode', 'STEPS', 0, F.pick(['LINEAR', 'VINTAGE', 'FLOAT'])], ['dither', 'DITHER', 0, F.pct], ['drive', 'DRIVE', 0, F.db(0, 24)], ['tone', 'TONE', 0.8, F.hz(500, 20000)], ['mix', 'MIX', 1, F.pct]],
            idle(p) { let m = idx(p.machine || 0, SHM.length); return m ? { bits: 'MACHINE sets it', down: 'MACHINE sets it', filt: 'MACHINE sets it', mode: 'MACHINE sets it' } : {}; },
            make(ctx) {
                let b = box(ctx), cr = ctx._nbwk ? wkNode(ctx, 'nb-crush') : null, sh = cr ? null : ctx.createWaveShaper(), lp = bq(ctx, 'lowpass', 16000, 0.7), P0 = null, bk = -1, ai = tap(ctx, b.in, 2048), an = tap(ctx, b.wet, 2048);
                let mh = bq(ctx, 'highpass', 20, 0.7), mp = bq(ctx, 'peaking', 1000, 0.9), mh2 = bq(ctx, 'highpass', 20, 0.7), ml = bq(ctx, 'lowpass', 20000, -3.0103), ml2 = bq(ctx, 'lowpass', 20000, -3.0103); b.in.connect(mh); mh.connect(mp);
                if (cr) { mp.connect(cr); cr.connect(mh2); } else { mp.connect(sh); sh.connect(mh2); } mh2.connect(ml); ml.connect(ml2); ml2.connect(lp);
                lp.connect(b.wet);
                const eff = p => { let m = idx(p.machine || 0, SHM.length); if (m) { let M = SHM[m]; return [M[1], ctx.sampleRate / M[2], M[3], M[4], M[5]]; } return [1 + p.bits * 15, 1 + Math.pow(p.down, 2) * 49, idx(p.filt || 0, 4), idx(p.mode || 0, 3), p.jitter]; };
                return { in: b.in, out: b.out, wk: !cr,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), E = eff(p), m = idx(p.machine || 0, SHM.length);
                        let M = m ? SHM[m] : null; mh.frequency.value = M ? M[6] : 0; mh2.frequency.value = M ? M[6] : 0; mp.frequency.value = M ? M[7][0] : 1000; mp.gain.value = M ? M[7][1] : 0; ml.frequency.value = ml2.frequency.value = M && M[9] ? M[9] : ctx.sampleRate / 2;
                        if (cr) { let Q = n => cr.parameters.get(n); if (m) { Q('bits').value = E[0]; Q('down').value = E[1]; } else { S2('bits', Q('bits'), E[0]); S2('down', Q('down'), E[1]); }
                            Q('jitter').value = E[4]; Q('pre').value = E[2] === 1 || E[2] === 3 ? 1 : 0; Q('post').value = E[2] >= 2 ? 1 : 0; Q('mode').value = E[3]; Q('dither').value = p.dither || 0; Q('drive').value = db2g((p.drive || 0) * 24 + (M ? M[8] : 0)); }
                        else { let k = Math.round(E[0]); if (k !== bk) { bk = k; let q = Math.pow(2, k - 1); sh.curve = curveOf(x => Math.round(x * q) / q, 4096); } }
                        S2('tone', lp.frequency, expo(500, 20000, p.tone)); S2('mix', b.wet.gain, p.mix * (M && cr ? db2g(-M[8]) : 1)); S2('mix', b.dry.gain, 1 - p.mix);
                    },
                    get ap() { let a = { tone: [[lp.frequency, v => expo(500, 20000, v)]], mix: mixAp(b) }; if (cr) { a.bits = [[cr.parameters.get('bits'), v => 1 + v * 15]]; a.down = [[cr.parameters.get('down'), v => 1 + v * v * 49]]; } return a; },
                    draw(x, w, h, D) {
                        S.bg(x, w, h); if (!P0) return; let E = eff(P0), q = Math.pow(2, Math.round(E[0]) - 1), dn = Math.max(1, Math.round(E[1] / 2)), pts = [], hold = 0, hw = Math.round(w * 0.42);
                        for (let i = 0; i < hw; i++) { if (i % dn === 0) { let v = Math.sin(i / hw * 6.283 * 2 + D.now); hold = E[3] === 1 ? Math.sign(v) * (Math.pow(256, Math.round(Math.log(1 + 255 * Math.abs(v)) / Math.log(256) * q) / q) - 1) / 255 : Math.round(v * q) / q; } pts.push([i, h / 2 + 6 - hold * (h / 2 - 14)]); }
                        S.line(x, pts, D.A, 1.5);
                        let X0 = hw + 6, sw = w - X0 - 2; x.save(); x.translate(X0, 0); if (ai) S.spec(x, ai, sw, h, 'rgba(255,255,255,0.2)'); if (an) S.spec(x, an, sw, h, D.A); let nyq = ctx.sampleRate / E[1] / 2, nx = S.logx(Math.min(20000, nyq), sw); x.fillStyle = 'rgba(255,255,255,0.5)'; x.fillRect(nx, 14, 1, h - 14); x.restore();
                        let m = idx(P0.machine || 0, SHM.length); S.txt(x, (m ? SHM[m][0] + ' · ' : '') + Math.round(E[0]) + ' BITS · ' + (ctx.sampleRate / E[1] / 1000).toFixed(1) + 'k' + (cr ? '' : ' (no rate drop here)'), 6, 11, D.A);
                    },
                    kill() { bury([cr]); stopAll(b)(); } };
            } },
        { id: 'three', jp: '三', en: 'THREE', sub: 'OTT style multiband. quiet parts come up, loud parts go down, per band. DEPTH = how much', face: 'rubber',
            p: [['depth', 'DEPTH', 0.5, F.pct], ['time', 'TIME', 0.4, F.pct], ['lo', 'LOW', 0.6, F.pct], ['mid', 'MID', 0.6, F.pct], ['hi', 'HIGH', 0.6, F.pct], ['ingain', 'IN', 0.5, F.db(-12, 12)], ['outgain', 'OUT', 0.5, F.db(-12, 12)], ['xl', 'LOW SPLIT', 0.4, F.hz(40, 1000)], ['xh', 'HIGH SPLIT', 0.45, F.hz(800, 12000)]],
            make(ctx) {
                let b = box(ctx), ig = b.g(1), og = b.g(1), w = ctx._nbwk ? wkNode(ctx, 'nb-three') : null, M = [0, 0, 0, 0, 0, 0], bands = [], sq = b.g(1);
                b.in.connect(ig);
                if (w) { ig.connect(w); w.connect(og); w.port.onmessage = e => { if (e.data && e.data.length === 6) M = e.data; }; }
                else { const xo = (type, f) => { let a = bq(ctx, type, f, 0.707), c = bq(ctx, type, f, 0.707); a.connect(c); return [a, c]; };
                    let [l1, l2] = xo('lowpass', 150), [h1, h2] = xo('highpass', 2500), [m1, m2] = xo('highpass', 150), [m3, m4] = xo('lowpass', 2500); m2.connect(m3); ig.connect(l1); ig.connect(h1); ig.connect(m1);
                    [[l2, 'lo'], [m4, 'mid'], [h2, 'hi']].forEach(([src, k]) => { let c = ctx.createDynamicsCompressor(), up = b.g(1); src.connect(c); c.connect(up); up.connect(sq); bands.push({ k, c, up }); }); sq.connect(og); }
                og.connect(b.wet);
                let P0 = null, Sm = [0, 0, 0, 0, 0, 0];
                return { in: b.in, out: b.out, wk: !w,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), dp = p.depth, tm = p.time;
                        if (w) { ['depth', 'time', 'lo', 'mid', 'hi'].forEach(k => { w.parameters.get(k).value = p[k]; }); w.parameters.get('xl').value = expo(40, 1000, p.xl == null ? 0.4 : p.xl); w.parameters.get('xh').value = expo(800, 12000, p.xh == null ? 0.45 : p.xh);
                            S2('ingain', ig.gain, db2g(-12 + p.ingain * 24)); S2('outgain', og.gain, db2g(-12 + p.outgain * 24) * db2g(dp * 12)); return; }
                        bands.forEach(B => { let amt = p[B.k] * dp; B.c.threshold.value = -6 - amt * 40; B.c.ratio.value = 1 + amt * 14; B.c.knee.value = 6; B.c.attack.value = 0.001 + tm * 0.03 * (B.k === 'lo' ? 2 : 1); B.c.release.value = 0.04 + tm * 0.4; S2(B.k, B.up.gain, db2g(amt * 22)); });
                        S2('ingain', ig.gain, db2g(-12 + p.ingain * 24)); S2('outgain', og.gain, db2g(-12 + p.outgain * 24) / (1 + dp * 0.8));
                    },
                    ap: { ingain: [[ig.gain, v => db2g(-12 + v * 24)]] },
                    draw(x, wd, h, D) {
                        S.bg(x, wd, h); let names = ['LOW', 'MID', 'HIGH'], cols = ['#ff8a5a', D.A, '#9ad8ff'];
                        if (!w) bands.forEach((B, i) => { M[i] = Math.min(30, -B.c.reduction); M[i + 3] = 0; });
                        for (let i = 0; i < 6; i++) Sm[i] = Math.max(M[i], Sm[i] * 0.86);
                        let mid = h / 2 + 4;
                        for (let i = 0; i < 3; i++) { let bw = wd / 3 - 14, X0 = 7 + i * (wd / 3), dn = Math.min(1, Sm[i] / 24) * (h / 2 - 10), up = Math.min(1, Sm[i + 3] / 24) * (h / 2 - 16);
                            x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(X0, 16, bw, h - 22); x.fillStyle = cols[i]; x.globalAlpha = 0.85; x.fillRect(X0, mid - up, bw, up); x.fillStyle = '#ff3355'; x.fillRect(X0, mid, bw, dn); x.globalAlpha = 1;
                            x.fillStyle = 'rgba(255,255,255,0.4)'; x.fillRect(X0, mid, bw, 1); S.txt(x, names[i] + ' +' + Sm[i + 3].toFixed(0) + ' −' + Sm[i].toFixed(0), X0, h - 2, cols[i]); }
                        S.txt(x, 'DEPTH ' + Math.round((P0 ? P0.depth : 0) * 100) + '%' + (P0 && w ? ' · ' + Math.round(expo(40, 1000, P0.xl == null ? 0.4 : P0.xl)) + ' / ' + (expo(800, 12000, P0.xh == null ? 0.45 : P0.xh) / 1000).toFixed(1) + 'k' : ''), 6, 11, D.A);
                    },
                    kill() { if (w) bury([w]); stopAll(b)(); } };
            } },
        { id: 'door', jp: '門', en: 'DOOR', sub: 'noise gate. THRESHOLD, RANGE, OPENS, SHUTS, HOLD. KEY LOW / HIGH sets what it listens to', face: 'iron',
            p: [['mode', 'KIND', 0, F.pick(['GATE', 'EXPAND'])], ['thr', 'THRESHOLD', 0.55, F.db(-70, 0)], ['range', 'RANGE', 0.8, F.db(0, -80)], ['att', 'OPENS', 0.1, F.ms(0.0005, 0.05)], ['rel', 'SHUTS', 0.3, F.ms(0.01, 1.5, 1.5)], ['hold', 'HOLD', 0.2, F.ms(0, 0.5)], ['hyst', 'STICKS', 0.3, v => Math.round(v * 20) + 'dB'], ['klo', 'KEY LOW', 0, v => v < 0.02 ? 'off' : Math.round(expo(30, 2000, v)) + 'hz'], ['khi', 'KEY HIGH', 1, v => v > 0.98 ? 'off' : Math.round(expo(500, 20000, v)) + 'hz'], ['look', 'LOOK AHEAD', 0.4, v => v < 0.02 ? 'off' : (v * 5).toFixed(1) + 'ms']],
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-door') : null, H = { s: [], l: [] }, P0 = null, isOpen = false;
                let gt = b.g(0), fo = !w && ctx._nbwk ? wkNode(ctx, 'nb-follow', 1) : null, cv = ctx.createWaveShaper(), lastK = '';
                if (w) { b.in.connect(w); w.connect(b.wet); w.port.onmessage = e => { let d = e.data; if (!d || d.shut == null) return; H.s.push(d.shut); H.l.push(d.lv); isOpen = d.open; if (H.s.length > 240) { H.s.shift(); H.l.shift(); } }; }
                else { b.in.connect(gt); gt.connect(b.wet); if (fo) { b.in.connect(fo); fo.connect(cv); cv.connect(gt.gain); } else gt.gain.value = 1; }
                const Wp = n => w.parameters.get(n);
                return { in: b.in, out: b.out, wk: !w && !fo, lat: () => w ? Math.min(511, Math.round(Wp('look').value * ctx.sampleRate)) / ctx.sampleRate : 0,
                    set(p, now) {
                        P0 = p;
                        if (w) { Wp('thr').value = -70 + p.thr * 70; Wp('range').value = -p.range * 80; Wp('att').value = 0.0005 + p.att * 0.05; Wp('rel').value = 0.01 + Math.pow(p.rel, 1.5) * 1.5; Wp('exp').value = idx(p.mode, 2);
                            Wp('hold').value = (p.hold == null ? 0.2 : p.hold) * 0.5; Wp('hyst').value = (p.hyst == null ? 0.3 : p.hyst) * 20; Wp('klo').value = (p.klo || 0) < 0.02 ? 0 : expo(30, 2000, p.klo); Wp('khi').value = (p.khi == null ? 1 : p.khi) > 0.98 ? 0 : expo(500, 20000, p.khi); Wp('look').value = (p.look == null ? 0.4 : p.look) * 0.005; return; }
                        if (!fo) return;
                        fo.parameters.get('att').value = 0.0005 + p.att * 0.05; fo.parameters.get('rel').value = 0.01 + Math.pow(p.rel, 1.5) * 1.5;
                        let k = [p.mode, p.thr, p.range].map(v => Math.round(v * 200)).join(); if (k === lastK) return; lastK = k;
                        let thr = db2g(-70 + p.thr * 70), fl = db2g(-p.range * 80), ex = idx(p.mode, 2);
                        cv.curve = curveOf(x => { if (x <= 0) return fl; if (x >= thr) return 1; return ex ? fl + (1 - fl) * Math.pow(x / thr, 2.5) : fl; }, 4096);
                    },
                    draw(x, wd, h, D) {
                        S.bg(x, wd, h); if (!P0) return; let N = 240, dx = wd / N, k0 = N - H.l.length, Y = db => 14 + Math.min(1, Math.max(0, -db / 70)) * (h - 18), thr = -70 + P0.thr * 70, hy = (P0.hyst == null ? 0.3 : P0.hyst) * 20;
                        x.fillStyle = 'rgba(0,0,0,0.55)'; H.s.forEach((v, k) => { if (v > 0.02) x.fillRect((k0 + k) * dx, 12, Math.max(1, dx), (h - 14) * Math.min(1, v)); });
                        S.line(x, H.l.map((v, k) => [(k0 + k) * dx, Y(Math.max(-70, v))]), D.A, 1.3);
                        x.setLineDash([4, 3]); x.strokeStyle = '#fff'; x.beginPath(); x.moveTo(0, Y(thr)); x.lineTo(wd, Y(thr)); x.stroke(); x.strokeStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.moveTo(0, Y(thr - hy)); x.lineTo(wd, Y(thr - hy)); x.stroke(); x.setLineDash([]);
                        S.txt(x, w ? (isOpen ? 'OPEN' : 'SHUT') : fo ? 'the old gate' : 'needs the worklet', 6, 11, isOpen ? D.A : '#667', 12);
                    },
                    kill() { if (w) bury([w]); if (fo) bury([fo]); stopAll(b)(); } };
            } },
        { id: 'hush', jp: '歯擦', en: 'HUSH', sub: 'de-esser. finds the s, sh + t sounds at FREQ and turns just those down. LISTEN = hear only what it catches', face: 'chrome',
            p: [['freq', 'FREQ', 0.5, F.hz(2500, 12000)], ['thr', 'HOW TOUCHY', 0.5, F.pct], ['depth', 'DIP', 0.6, F.db(0, -18)], ['listen', 'LISTEN', 0, F.pick(['off', 'on'])], ['split', 'WHAT DIPS', 0, F.pick(['the top only', 'all of it'])], ['rel', 'LISTENS', 0, F.pick(['against the voice', 'just the hiss'])]],
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-hush') : null, H = [], P0 = null;
                if (w) { b.in.connect(w); w.connect(b.wet); w.port.onmessage = e => { if (typeof e.data === 'number') { H.push(e.data); if (H.length > 240) H.shift(); } }; }
                let sh = bq(ctx, 'highshelf', 6000, 0), det = bq(ctx, 'bandpass', 6000, 1.4), fo = !w && ctx._nbwk ? wkNode(ctx, 'nb-follow', 1) : null, amt = b.g(0), lis = b.g(0), main = b.g(1), sens = b.g(8), cl = ctx.createWaveShaper();
                if (!w) { b.in.connect(sh); sh.connect(main); main.connect(b.wet); b.in.connect(det); det.connect(lis); lis.connect(b.wet); cl.curve = curveOf(x => Math.max(0, Math.min(1, x))); if (fo) { det.connect(fo); fo.connect(sens); sens.connect(cl); cl.connect(amt); amt.connect(sh.gain); } }
                let an = tap(ctx, b.in, 2048);
                const Wp = n => w.parameters.get(n);
                return { in: b.in, out: b.out, wk: !w && !fo, lat: () => w ? Math.round(0.001 * ctx.sampleRate) / ctx.sampleRate : 0,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), f = expo(2500, 12000, p.freq);
                        if (w) { S2('freq', Wp('freq'), f); Wp('thr').value = p.thr; Wp('depth').value = p.depth * 18; Wp('listen').value = idx(p.listen, 2); Wp('split').value = idx(p.split || 0, 2) ? 0 : 1; Wp('rel').value = idx(p.rel || 0, 2) ? 0 : 1; return; }
                        S2('freq', sh.frequency, f * 0.8); S2('freq', det.frequency, f);
                        amt.gain.value = -p.depth * 18; sens.gain.value = 1 + p.thr * 30;
                        let L = idx(p.listen, 2); main.gain.value = L ? 0 : 1; lis.gain.value = L ? 1 : 0;
                    },
                    draw(x, wd, h, D) {
                        S.bg(x, wd, h); S.spec(x, an, wd, h, 'rgba(255,255,255,0.6)'); if (!P0) return;
                        let f = expo(2500, 12000, P0.freq), X0 = S.logx(f * 0.75, wd), X1 = S.logx(f * 1.35, wd); x.fillStyle = D.A; x.globalAlpha = 0.18; x.fillRect(X0, 0, X1 - X0, h); x.globalAlpha = 1;
                        let N = 240, dx = wd / N, k0 = N - H.length; x.fillStyle = '#ff4d6d'; H.forEach((g, k) => { if (g > 0.1) x.fillRect((k0 + k) * dx, 14, Math.max(1, dx), Math.min(h - 18, g / 18 * (h - 18))); });
                        let g = H.length ? H[H.length - 1] : 0; S.txt(x, 'CATCHING AROUND ' + (f / 1000).toFixed(1) + 'k' + (g > 0.2 ? ' · −' + g.toFixed(1) + ' dB' : '') + (idx(P0.listen, 2) ? '  · LISTENING' : ''), 6, 11, D.A);
                        if (!w && !fo) S.txt(x, 'needs the worklet', 6, h - 4, '#667');
                    },
                    kill() { if (w) bury([w]); if (fo) bury([fo]); stopAll(b)(); } };
            } },
        { id: 'salve', jp: '膏', en: 'SALVE', sub: 'resonance suppressor. finds harsh peaks as it plays + turns only those down. DEPTH, SENSE (how much a peak has to stick out), SHARP, LOW / HIGH range. DELTA = hear what it removes', face: 'milk', part: 'nb_fx_salve',
            p: [['depth', 'DEPTH', 0.5, v => '-' + (v * 24).toFixed(1) + 'dB'], ['sense', 'SENSE', 0.5, v => (0.5 + (1 - v) * 17.5).toFixed(1) + 'dB'], ['sharp', 'SHARP', 0.5, F.pct], ['lo', 'LOW', 0.25, F.hz(20, 2000)], ['hi', 'HIGH', 0.75, F.hz(1000, 20000)],
                ['speed', 'SPEED', 0.5, v => v < 0.33 ? 'smooth' : v > 0.66 ? 'fast' : 'medium'], ['delta', 'DELTA', 0, F.pick(['off', 'on'])], ['mix', 'MIX', 1, F.pct]],
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-salve') : null, G = new Float32Array(48), P0 = null;
                if (w) { b.in.connect(w); w.connect(b.wet); w.port.onmessage = e => { if (e.data && e.data.length === 48) G.set(e.data); }; } else b.in.connect(b.wet);
                let an = tap(ctx, b.out, 4096);
                const Wp = n => w.parameters.get(n);
                return { in: b.in, out: b.out, wk: !w, lat: () => w ? 1024 / ctx.sampleRate : 0,
                    set(p, now, info, skip) {
                        P0 = p; if (!w) return; let S2 = setter(ctx, now, skip);
                        S2('depth', Wp('depth'), p.depth * 24); Wp('sense').value = 0.5 + (1 - p.sense) * 17.5; Wp('sharp').value = p.sharp; Wp('lo').value = expo(20, 2000, p.lo); Wp('hi').value = expo(1000, 20000, p.hi);
                        Wp('speed').value = p.speed; Wp('delta').value = idx(p.delta, 2); S2('mix', Wp('mix'), p.mix);
                    },
                    get ap() { return w ? { depth: [[Wp('depth'), v => v * 24]], mix: [[Wp('mix'), v => v]] } : {}; },
                    draw(x, wd, h, D) {
                        S.bg(x, wd, h); S.spec(x, an, wd, h, 'rgba(255,255,255,0.55)'); if (!P0) return;
                        let X0 = S.logx(expo(20, 2000, P0.lo), wd), X1 = S.logx(expo(1000, 20000, P0.hi), wd); x.fillStyle = D.A; x.globalAlpha = 0.08; x.fillRect(X0, 0, X1 - X0, h); x.globalAlpha = 1;
                        let deep = 0; x.fillStyle = '#ff4d6d';
                        for (let j = 0; j < 48; j++) { const f0 = 40 * Math.pow(500, j / 48), f1 = 40 * Math.pow(500, (j + 1) / 48), a = S.logx(f0, wd), c = S.logx(f1, wd), g = -G[j]; deep = Math.max(deep, g); if (g > 0.2) x.fillRect(a, 14, Math.max(1, c - a - 1), Math.min(h - 18, g / 24 * (h - 18) * 1.6)); }
                        S.txt(x, (idx(P0.delta, 2) ? 'DELTA · ' : '') + (deep > 0.2 ? 'TAMING · up to −' + deep.toFixed(1) + ' dB' : 'LISTENING'), 6, 11, D.A);
                        if (!w) S.txt(x, 'needs the worklet', 6, h - 4, '#667');
                    },
                    kill() { if (w) bury([w]); stopAll(b)(); } };
            } },
        { id: 'puppet', jp: '傀儡', en: 'PUPPET', sub: 'LFO. one wave (or FOLLOW the input level) that moves up to four knobs on this track, or the volume, pan, sends + cuts. SYNC or FREE RATE. the sound passes through untouched', face: 'velvet', part: 'nb_fx_puppet', pup: true,
            p: [['shape', 'SHAPE', 0, F.pick(['SINE', 'TRIANGLE', 'SAW UP', 'SAW DOWN', 'SQUARE', 'RANDOM', 'DRIFT', 'FOLLOW'])], ['sync', 'SYNC', 6.5 / 9, F.pick(['free', '1/32', '1/16', '1/8', '1/4', '1/2', '1 bar', '2 bars', '4 bars'])], ['rate', 'FREE RATE', 0.4, v => (0.05 * Math.pow(400, v)).toFixed(2) + 'hz'], ['phase', 'PHASE', 0, v => Math.round(v * 360) + '°'], ['smooth', 'SMOOTH', 0, F.pct],
                ['fatt', 'FOLLOW ATTACK', 0.2, F.ms(0.0005, 0.3, 2)], ['frel', 'FOLLOW RELEASE', 0.3, F.ms(0.01, 2, 2)], ['fgain', 'FOLLOW GAIN', 0.4, F.db(0, 30)],
                ['a1', '1 HOW FAR', 0.5, v => { let a = Math.round((v - 0.5) * 200); return a ? (a > 0 ? '+' : '') + a + '%' : 'off'; }], ['a2', '2 HOW FAR', 0.5, v => { let a = Math.round((v - 0.5) * 200); return a ? (a > 0 ? '+' : '') + a + '%' : 'off'; }], ['a3', '3 HOW FAR', 0.5, v => { let a = Math.round((v - 0.5) * 200); return a ? (a > 0 ? '+' : '') + a + '%' : 'off'; }], ['a4', '4 HOW FAR', 0.5, v => { let a = Math.round((v - 0.5) * 200); return a ? (a > 0 ? '+' : '') + a + '%' : 'off'; }]],
            idle(p) { return idx(p.shape, 8) === 7 ? { sync: 'FOLLOW listens instead', rate: 'FOLLOW listens instead', phase: 'FOLLOW listens instead' } : Object.assign({ fatt: 'only FOLLOW listens', frel: 'only FOLLOW listens', fgain: 'only FOLLOW listens' }, idx(p.sync, 9) ? { rate: 'its SYNCed to the song' } : {}); },
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? (() => { try { let n = new AudioWorkletNode(ctx, 'nb-puppet', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1], processorOptions: { seed: 12345, at: 0 } }); (ctx._nbw = ctx._nbw || new Set()).add(n); return n; } catch (e) { return null; } })() : null, P0 = null, now = 0, H = [];
                b.in.connect(b.wet); if (w) { b.in.connect(w); w.port.onmessage = e => { if (typeof e.data === 'number') { now = e.data; H.push(now); if (H.length > 120) H.shift(); } }; }
                const Wp = n => w.parameters.get(n), RB = [0, 1 / 8, 1 / 4, 1 / 2, 1, 2, 4, 8, 16];
                return { in: b.in, out: b.out, wk: !w, mod: w,
                    set(p, nw, info, skip) {
                        P0 = p; if (!w) return; let s = idx(p.sync, 9), bpm = (info && info.bpm) || 120, rate = s ? bpm / 60 / RB[s] : 0.05 * Math.pow(400, p.rate);
                        Wp('shape').value = idx(p.shape, 8); Wp('rate').value = rate; Wp('phase').value = p.phase; Wp('smooth').value = p.smooth;
                        Wp('att').value = 0.0005 + p.fatt * p.fatt * 0.3; Wp('rel').value = 0.01 + p.frel * p.frel * 2; Wp('gain').value = Math.pow(10, p.fgain * 30 / 20);
                    },
                    draw(x, wd, h, D) {
                        S.bg(x, wd, h); if (!P0) return; let sh = idx(P0.shape, 8), mid = h / 2 + 4, amp = (h - 22) / 2;
                        if (sh === 7) { let pts = H.map((v, k) => [k / 120 * wd, mid + amp - v * amp * 2]); if (pts.length > 1) S.line(x, pts, D.A, 1.6); }
                        else { let pts = []; for (let i = 0; i <= 120; i++) { let u = i / 60 + P0.phase, p = u - Math.floor(u), v = sh === 0 ? Math.sin(2 * Math.PI * p) : sh === 1 ? (p < 0.5 ? 4 * p - 1 : 3 - 4 * p) : sh === 2 ? 2 * p - 1 : sh === 3 ? 1 - 2 * p : sh === 4 ? (p < 0.5 ? 1 : -1) : sh === 5 ? [0.6, -0.3, 0.9, -0.8, 0.1, 0.5][Math.floor(u * 2) % 6] : Math.sin(u * 5.1) * 0.6 + Math.sin(u * 2.3) * 0.4; pts.push([i / 120 * wd, mid - v * amp]); }
                            S.line(x, pts, 'rgba(255,255,255,0.35)', 1.2); x.fillStyle = D.A; x.beginPath(); x.arc(wd - 8, mid - now * amp, 4, 0, 7); x.fill(); x.strokeStyle = D.A; x.globalAlpha = 0.5; x.beginPath(); x.moveTo(0, mid - now * amp); x.lineTo(wd, mid - now * amp); x.stroke(); x.globalAlpha = 1; }
                        let s = idx(P0.sync, 9), n = [1, 2, 3, 4].filter(k => P0['t' + k] && Math.abs(P0['a' + k] - 0.5) > 0.004).length;
                        S.txt(x, ['SINE', 'TRIANGLE', 'SAW UP', 'SAW DOWN', 'SQUARE', 'RANDOM', 'DRIFT', 'FOLLOW'][sh] + (sh === 7 ? '' : ' · ' + (s ? ['free', '1/32', '1/16', '1/8', '1/4', '1/2', '1 bar', '2 bars', '4 bars'][s] : (0.05 * Math.pow(400, P0.rate)).toFixed(2) + 'hz')) + ' · moving ' + n, 6, 11, D.A);
                        if (!w) S.txt(x, 'needs the worklet', 6, h - 4, '#667');
                    },
                    kill() { if (w) bury([w]); stopAll(b)(); } };
            } },
        { id: 'gloss', jp: '艶', en: 'GLOSS', sub: 'exciter. adds new top end from whats already there', face: 'latex',
            p: [['kind', 'KIND', 0, F.pick(['CLASSIC', 'TUBE', 'TAPE', 'CRISP'])], ['freq', 'FROM', 0.4, F.hz(1500, 12000)], ['amt', 'SHINE', 0.35, F.pct], ['colour', 'ODD↔EVEN', 0.5, F.pct], ['air', 'AIR', 0.2, F.db(0, 9)], ['body', 'BODY', 0, F.pct], ['solo', 'HEAR', 0, F.pick(['ALL', 'ONLY THE SHINE'])], ['mix', 'MIX', 1, F.pct]],
            make(ctx) {
                let b = box(ctx), hp1 = bq(ctx, 'highpass', 4000, 0.7), hp2 = bq(ctx, 'highpass', 4000, 0.7), sh = ctx.createWaveShaper(), hg = b.g(0), air = bq(ctx, 'highshelf', 11000, 0), lp = bq(ctx, 'lowpass', 220, 0.7), bs = ctx.createWaveShaper(), bg = b.g(0), lastK = '', ag = b.g(1), P0 = null;
                sh.oversample = '4x'; bs.oversample = '2x';
                b.in.connect(air); air.connect(ag); ag.connect(b.wet); b.in.connect(hp1); hp1.connect(sh); sh.connect(hp2); hp2.connect(hg); hg.connect(b.wet); b.in.connect(lp); lp.connect(bs); bs.connect(bg); bg.connect(b.wet);
                bs.curve = curveOf(x => Math.tanh(x * 3) / Math.tanh(3));
                let an = tap(ctx, b.wet, 2048), ah = tap(ctx, hg, 2048);
                const cl = x => Math.max(-1, Math.min(1, x)), odd = [x => Math.tanh(x * 6) / Math.tanh(6), x => { const y = cl(x * 4); return y - y * y * y / 3; }, x => Math.tanh(x * 4) / Math.tanh(4), x => { const y = cl(x * 3); return 0.75 * (4 * y * y * y - 3 * y) + 0.25 * (16 * Math.pow(y, 5) - 20 * y * y * y + 5 * y); }],
                    even = [x => (Math.tanh(Math.abs(x) * 6) * 0.9 - 0.45) * 1.3, x => { const y = cl(x * 4); return y * y - 0.33; }, x => { const y = cl(x * 3); return (y * y - 0.33) * 0.8; }, x => { const y = cl(x * 3); return 2 * y * y - 1; }];
                let sm = bq(ctx, 'lowpass', 17000, 0.5); hp2.disconnect(); hp2.connect(sm); sm.connect(hg);
                return { in: b.in, out: b.out,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), f = expo(1500, 12000, p.freq), kd = idx(p.kind || 0, 4), k = kd + ':' + Math.round(p.colour * 20), solo = idx(p.solo || 0, 2);
                        S2('freq', hp1.frequency, f); S2('freq', hp2.frequency, f); S2('amt', hg.gain, p.amt * 1.6 * (kd === 3 ? 0.8 : kd === 2 ? 1.3 : 1)); S2('air', air.gain, p.air * 9); S2('body', bg.gain, solo ? 0 : p.body * 0.6); ag.gain.value = solo ? 0 : 1;
                        if (k !== lastK) { lastK = k; let e = p.colour, O = odd[kd], E = even[kd]; sh.curve = curveOf(x => (1 - e) * O(x) + e * E(x)); }
                        S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, solo ? 0 : 1 - p.mix);
                    },
                    ap: { amt: [[hg.gain, v => v * 1.6]], mix: mixAp(b) },
                    draw(x, w, h, D) {
                        S.bg(x, w, h); if (!P0) return; let X0 = S.logx(expo(1500, 12000, P0.freq), w); x.fillStyle = D.A; x.globalAlpha = 0.07; x.fillRect(X0, 14, w - X0, h - 14); x.globalAlpha = 1;
                        S.spec(x, an, w, h, 'rgba(255,255,255,0.35)'); if (ah) S.spec(x, ah, w, h, D.A);
                        S.txt(x, ['CLASSIC', 'TUBE', 'TAPE', 'CRISP'][idx(P0.kind || 0, 4)] + ' · SHINE ' + Math.round(P0.amt * 100) + '%' + (idx(P0.solo || 0, 2) ? ' · ONLY THE SHINE' : ''), 6, 11, D.A); },
                    kill: stopAll(b) };
            } },
        { id: 'cords', jp: '声帯', en: 'CORDS', sub: 'vocoder. SINGS WITH = THIS TRACK (the ticked tracks below are the voice) or BUZZ (built in synth, NOTE sets the pitch). FORMANT shifts it, BANDS = 8 robotic to 32 clear. FREEZE holds the current shape', face: 'throat', side: true,
            p: [['src', 'SINGS WITH', 0, F.pick(['THIS TRACK', 'BUZZ'])], ['note', 'NOTE', 0.4, v => ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][Math.round(v * 36) % 12] + (1 + Math.floor(Math.round(v * 36) / 12))], ['bands', 'BRIGHT', 0.5, F.pct], ['q', 'SHARP', 0.5, F.pct], ['formant', 'FORMANT', 0.5, v => { let n = Math.round((v - 0.5) * 24); return (n > 0 ? '+' : '') + n + 'st'; }], ['att', 'ATTACK', 0.15, F.ms(0.001, 0.05)], ['rel', 'RELEASE', 0.25, F.ms(0.01, 0.5)], ['hiss', 'HISS THROUGH', 0.3, F.pct], ['n', 'BANDS', 1 / 3 + 0.01, F.pick(['8', '16', '24', '32'])], ['freeze', 'FREEZE', 0, F.pick(['off', 'HOLD'])], ['mix', 'MIX', 1, F.pct]],
            extra: () => ({ keys: [] }),
            make(ctx) {
                let vw = null; if (ctx._nbwk) { try { vw = new AudioWorkletNode(ctx, 'nb-vocode', { numberOfInputs: 2, numberOfOutputs: 1, outputChannelCount: [2] }); (ctx._nbw = ctx._nbw || new Set()).add(vw); } catch (e) { vw = null; } }
                let b = box(ctx), side = b.g(1), N = vw ? 0 : 16, bands = [], sum = b.g(1), hs = bq(ctx, 'highpass', 6000, 0.7), hg = b.g(0), P0 = null, f0 = [], EV = [];
                side.channelCountMode = 'explicit'; side.channelCount = 1;
                let cIn = b.g(1), gThis = b.g(1), gBuzz = b.g(0), mIn = b.g(1), gSide = b.g(1), gSelf = b.g(0), oscs = [];
                mIn.channelCountMode = 'explicit'; mIn.channelCount = 1;
                b.in.connect(gThis); gThis.connect(cIn); gBuzz.connect(cIn); side.connect(gSide); gSide.connect(mIn); b.in.connect(gSelf); gSelf.connect(mIn);
                [-7, 0, 7, 1200].forEach(dt => { let o = ctx.createOscillator(); o.type = 'sawtooth'; o.detune.value = dt; let og = b.g(dt === 1200 ? 0.12 : 0.22); o.connect(og); og.connect(gBuzz); o.start(); oscs.push(o); });
                for (let i = 0; i < N; i++) {
                    let fr = 100 * Math.pow(80, i / (N - 1)), mb = bq(ctx, 'bandpass', fr, 6), cb = bq(ctx, 'bandpass', fr, 6), cb2 = bq(ctx, 'bandpass', fr, 6), g = b.g(0), fo = ctx._nbwk ? wkNode(ctx, 'nb-follow', 1) : null, eg = b.g(1);
                    mIn.connect(mb); cIn.connect(cb); cb.connect(cb2); cb2.connect(g); g.connect(sum);
                    if (fo) { mb.connect(fo); fo.connect(eg); eg.connect(g.gain); }
                    bands.push({ mb, cb, cb2, g, fo, eg }); f0.push(fr);
                }
                if (vw) { cIn.connect(vw, 0, 0); mIn.connect(vw, 0, 1); vw.connect(sum); vw.port.onmessage = e => { EV = e.data; }; } else { mIn.connect(hs); hs.connect(hg); hg.connect(sum); }
                sum.connect(b.wet);
                let an = tap(ctx, sum, 1024);
                return { in: b.in, out: b.out, side, wk: !vw, keys: () => P0 ? (P0.keys || []) : [], follows: () => true,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), q = 2 + p.q * 18, sh = Math.pow(2, (Math.round((p.formant - 0.5) * 24)) / 12);
                        bands.forEach((B, i) => { let fr = f0[i]; B.mb.Q.value = q; B.cb.Q.value = q; B.cb2.Q.value = q; B.mb.frequency.value = fr; B.cb.frequency.value = Math.min(18000, fr * sh); B.cb2.frequency.value = Math.min(18000, fr * sh);
                            B.eg.gain.value = (8 + q * 2) * (0.4 + (i / N) * p.bands * 2);
                            if (B.fo) { B.fo.parameters.get('att').value = 0.001 + p.att * 0.05; B.fo.parameters.get('rel').value = 0.01 + p.rel * 0.5; } });
                        if (vw) { let Q = n => vw.parameters.get(n); Q('n').value = [8, 16, 24, 32][idx(p.n == null ? 1 / 3 + 0.01 : p.n, 4)]; Q('q').value = p.q; Q('fmt').value = sh; Q('bright').value = p.bands; Q('att').value = 0.001 + p.att * 0.05; Q('rel').value = 0.01 + p.rel * 0.5; Q('frz').value = (p.freeze || 0) >= 0.5 ? 1 : 0; Q('hiss').value = p.hiss; }
                        let buzz = p.src > 0.5, hasMouth = buzz || (p.keys || []).length > 0, hz2 = 32.7 * Math.pow(2, Math.round((p.note == null ? 0.4 : p.note) * 36) / 12);
                        gThis.gain.value = buzz ? 0 : 1; gBuzz.gain.value = buzz ? 1 : 0; gSide.gain.value = buzz ? 0 : 1; gSelf.gain.value = buzz ? 1 : 0;
                        oscs.forEach(o => { if (now) o.frequency.value = hz2; else o.frequency.setTargetAtTime(hz2, ctx.currentTime, 0.01); });
                        S2('hiss', hg.gain, p.hiss * 0.8); S2('mix', b.wet.gain, hasMouth ? p.mix : 0); S2('mix', b.dry.gain, hasMouth ? 1 - p.mix : 1);
                    },
                    ap: { mix: mixAp(b) },
                    draw(x, w, h, D) {
                        S.bg(x, w, h);
                        if (!ctx._nbwk) { S.txt(x, 'needs the worklet', 6, 11, '#667'); return; }
                        if (vw && EV.length) { let n = EV.length, bw = w / n; EV.forEach((e, i) => { let v = Math.min(1, Math.sqrt(e) * 3); x.fillStyle = D.A; x.globalAlpha = 0.35 + v * 0.65; x.fillRect(i * bw + 1, h - 4 - v * (h - 22), bw - 2, v * (h - 22)); }); x.globalAlpha = 1; } else S.spec(x, an, w, h, D.A);
                        if (P0 && (P0.freeze || 0) >= 0.5) S.txt(x, 'HELD', w - 34, 11, '#fff');
                        S.txt(x, P0 && P0.src > 0.5 ? 'BUZZ // THIS TRACK IS THE MOUTH' : (P0 && (P0.keys || []).length ? 'MOUTH: ' + P0.keys.length + ' TRACK' + (P0.keys.length > 1 ? 'S' : '') : 'TICK A TRACK BELOW TO BE THE MOUTH (or SINGS WITH: BUZZ)'), 6, 11, D.A);
                    },
                    kill: () => { bury(bands.map(B => B.fo).concat([vw])); oscs.forEach(o => { try { o.stop(); } catch (e) {} }); stopAll(b)(); } };
            } },
        { id: 'shift', jp: '移', en: 'SHIFT', sub: 'frequency shifter. moves every frequency by the same Hz, so it goes metallic + out of tune. AGAIN feeds it back (with DELAY it spirals up or down forever). DARK darkens the repeats, L↔R shifts the sides opposite ways', face: 'glass',
            p: [['hz', 'SHIFT', 0.5, v => { let s = Math.sign(v - 0.5) * Math.pow(Math.abs(v - 0.5) * 2, 2.5) * 2000; return (s > 0 ? '+' : '') + Math.round(s) + 'Hz'; }], ['spread', 'L↔R', 0, F.pct], ['fb', 'AGAIN', 0, F.pct], ['dt', 'DELAY', 0, v => v < 0.005 ? 'none' : F.ms(0, 1)(v)], ['damp', 'DARK', 0, F.pct], ['mix', 'MIX', 1, F.pct]],
            idle(p) { return (p.fb || 0) < 0.01 ? { dt: 'AGAIN is off, nothing comes round', damp: 'AGAIN is off, nothing comes round' } : {}; },
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-fshift', 2) : null, P0 = null, ai = tap(ctx, b.in, 2048);
                if (w) { b.in.connect(w); w.connect(b.wet); } else b.in.connect(b.wet);
                let an = tap(ctx, b.wet, 2048);
                const hzOf = v => Math.sign(v - 0.5) * Math.pow(Math.abs(v - 0.5) * 2, 2.5) * 2000;
                return { in: b.in, out: b.out, wk: !w,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), s = hzOf(p.hz);
                        if (w) { S2('hz', w.parameters.get('hz'), s); w.parameters.get('spread').value = p.spread; w.parameters.get('fb').value = p.fb * 0.9; w.parameters.get('dt').value = (p.dt || 0) < 0.005 ? 0 : p.dt; w.parameters.get('damp').value = expo(20000, 600, p.damp || 0); }
                        S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix);
                    },
                    ap: { hz: w ? [[w.parameters.get('hz'), v => hzOf(v)]] : [], mix: mixAp(b) },
                    draw(x, w2, h, D) {
                        S.bg(x, w2, h); if (ai) S.spec(x, ai, w2, h, 'rgba(255,255,255,0.22)'); S.spec(x, an, w2, h, D.A); if (!w) { S.txt(x, 'needs the worklet', 6, 11, '#667'); return; } if (!P0) return;
                        let s = hzOf(P0.hz), X0 = w2 * 0.5, X1 = X0 + Math.sign(s) * Math.min(w2 * 0.4, Math.abs(s) / 2000 * w2 * 0.4); x.strokeStyle = '#fff'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(X0, 20); x.lineTo(X1, 20); x.stroke(); if (Math.abs(s) > 1) { x.beginPath(); x.moveTo(X1, 20); x.lineTo(X1 - Math.sign(s) * 5, 16); x.lineTo(X1 - Math.sign(s) * 5, 24); x.fill(); }
                        S.txt(x, (s > 0 ? '+' : '') + Math.round(s) + ' Hz' + ((P0.fb || 0) > 0.01 ? ' · AGAIN ' + Math.round(P0.fb * 100) + '%' + ((P0.dt || 0) >= 0.005 ? ' every ' + Math.round(P0.dt * 1000) + ' ms' : '') : ''), 6, 11, D.A); },
                    kill: () => { bury([w]); stopAll(b)(); } };
            } },
        { id: 'scale', jp: '計', en: 'SCALE', sub: 'utility. GAIN, BALANCE, phase flip, MONO, SWAP, WIDTH, DC cut, ALIGN (delays one side). LISTEN = solo the LEFT, RIGHT, MID or SIDE to check things', face: 'chrome',
            p: [['gain', 'GAIN', 0.75, F.db(-36, 12)], ['bal', 'BALANCE', 0.5, v => v < 0.48 ? 'L' + Math.round((0.5 - v) * 200) : v > 0.52 ? 'R' + Math.round((v - 0.5) * 200) : 'mid'], ['phase', 'PHASE', 0, F.pick(['as is', 'flip L', 'flip R', 'flip both'])], ['mono', 'MONO', 0, F.pick(['off', 'on'])], ['swap', 'SWAP', 0, F.pick(['off', 'on'])],
                ['width', 'WIDTH', 0.5, v => Math.round(v * 200) + '%'], ['dc', 'DC CUT', 0, F.pick(['off', 'on'])], ['align', 'ALIGN', 0.5, v => { let m = (v - 0.5) * 10; return Math.abs(m) < 0.02 ? 'none' : (m > 0 ? 'R ' : 'L ') + Math.abs(m).toFixed(2) + 'ms late'; }], ['listen', 'LISTEN', 0, F.pick(['STEREO', 'LEFT', 'RIGHT', 'MID', 'SIDE'])]],
            idle(p) { return idx(p.mono, 2) ? { width: 'MONO is on' } : {}; },
            make(ctx) {
                let b = box(ctx), dc = bq(ctx, 'allpass', 10, 0.7), sp = ctx.createChannelSplitter(2), mg = ctx.createChannelMerger(2), dL = ctx.createDelay(0.02), dR = ctx.createDelay(0.02), gl = b.g(1), gr = b.g(1), ll = b.g(1), lr = b.g(0), rl = b.g(0), rr = b.g(1), gn = b.g(1), P0 = null;
                b.in.connect(dc); dc.connect(sp); sp.connect(dL, 0); sp.connect(dR, 1); dL.connect(gl); dR.connect(gr);
                gl.connect(ll); gl.connect(rl); gr.connect(lr); gr.connect(rr); ll.connect(mg, 0, 0); lr.connect(mg, 0, 0); rl.connect(mg, 0, 1); rr.connect(mg, 0, 1); mg.connect(gn); gn.connect(b.wet);
                let sL = null, sR = null; if (!offline(ctx)) { let s2 = ctx.createChannelSplitter(2); gn.connect(s2); sL = ctx.createAnalyser(); sR = ctx.createAnalyser(); sL.fftSize = sR.fftSize = 1024; s2.connect(sL, 0); s2.connect(sR, 1); }
                const mul = (A, B) => [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]], [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]];
                const matOf = p => { let mono = idx(p.mono, 2), sw = idx(p.swap, 2), w = mono ? 0 : (p.width == null ? 1 : p.width * 2), li = idx(p.listen || 0, 5), a = (1 + w) / 2, c = (1 - w) / 2;
                    let M = [[a, c], [c, a]]; if (sw) M = mul([[0, 1], [1, 0]], M);
                    const LI = [[[1, 0], [0, 1]], [[1, 0], [1, 0]], [[0, 1], [0, 1]], [[0.5, 0.5], [0.5, 0.5]], [[0.5, -0.5], [0.5, -0.5]]][li]; return mul(LI, M); };
                return { in: b.in, out: b.out,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), ph = idx(p.phase, 4), bal = (p.bal - 0.5) * 2, al = ((p.align == null ? 0.5 : p.align) - 0.5) * 0.01;
                        dc.type = 'highpass'; dc.frequency.value = idx(p.dc, 2) ? 18 : 0; dL.delayTime.value = al < 0 ? -al : 0; dR.delayTime.value = al > 0 ? al : 0;
                        gl.gain.value = (ph === 1 || ph === 3 ? -1 : 1) * Math.min(1, 1 - bal); gr.gain.value = (ph === 2 || ph === 3 ? -1 : 1) * Math.min(1, 1 + bal);
                        let M = matOf(p); ll.gain.value = M[0][0]; lr.gain.value = M[0][1]; rl.gain.value = M[1][0]; rr.gain.value = M[1][1];
                        S2('gain', gn.gain, db2g(-36 + p.gain * 48));
                    },
                    ap: { gain: [[gn.gain, v => db2g(-36 + v * 48)]] },
                    draw(x, w, h, D) {
                        S.bg(x, w, h); if (!sL) return; let L = sL._f || (sL._f = new Float32Array(1024)), R = sR._f || (sR._f = new Float32Array(1024)); sL.getFloatTimeDomainData(L); sR.getFloatTimeDomainData(R);
                        let pl = 0, pr = 0, lr2 = 0, ll2 = 0, rr2 = 0; for (let i = 0; i < 1024; i++) { pl = Math.max(pl, Math.abs(L[i])); pr = Math.max(pr, Math.abs(R[i])); lr2 += L[i] * R[i]; ll2 += L[i] * L[i]; rr2 += R[i] * R[i]; }
                        let cor = ll2 && rr2 ? lr2 / Math.sqrt(ll2 * rr2) : 0, bar = (v, y) => { let d = 20 * Math.log10(Math.max(1e-5, v)), u = Math.max(0, (d + 48) / 48); x.fillStyle = d > -0.5 ? '#ff3a4a' : D.A; x.fillRect(12, y, (w - 18) * u, 8); [-36, -24, -12, -6, 0].forEach(m => { x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(12 + (w - 18) * (m + 48) / 48, y + 8, 1, 2); }); };
                        bar(pl, 18); bar(pr, 30); S.txt(x, 'L', 2, 25, D.A); S.txt(x, 'R', 2, 37, D.A);
                        x.fillStyle = 'rgba(140,255,200,0.15)'; x.fillRect(6, h - 14, w - 12, 6); x.fillStyle = cor < 0 ? '#ff3a4a' : D.A; x.fillRect(w / 2, h - 14, cor * (w / 2 - 6), 6);
                        let li = P0 ? idx(P0.listen || 0, 5) : 0;
                        S.txt(x, (li ? 'HEARING ' + ['', 'LEFT', 'RIGHT', 'MID', 'SIDE'][li] + ' · ' : '') + 'AGREE ' + cor.toFixed(2) + (cor < 0 ? '  · fighting each other, check MONO' : ''), 6, 11, li ? '#ffd23b' : D.A);
                    },
                    kill: stopAll(b) };
            } },
        { id: 'corset', jp: '締', en: 'CORSET', sub: 'draw how it moves. VOLUME, FILTER + PAN lanes, each a shape you draw that loops at its own LENGTH. SWING shuffles it. sidechain style pumps, gates, moving filters, autopan', face: 'latex', lanes: ['vpts', 'fpts', 'ppts'],
            p: [['edit', 'DRAW ON', 0, F.pick(['VOLUME', 'FILTER', 'PAN'])], ['vlen', 'VOL LENGTH', 2 / 7 + 0.01, F.pick(LENS.map(l => l[0]))], ['vdep', 'VOLUME', 0.8, F.pct], ['flen', 'FILT LENGTH', 4 / 7 + 0.01, F.pick(LENS.map(l => l[0]))], ['fdep', 'FILTER', 0, F.pct],
                ['fcut', 'FILTER FROM', 0.3, F.hz(40, 12000)], ['fres', 'RES', 0.2, F.pct], ['fkind', 'FILTER KIND', 0, F.pick(['LOW', 'HIGH', 'BAND'])], ['plen', 'PAN LENGTH', 3 / 7 + 0.01, F.pick(LENS.map(l => l[0]))], ['pdep', 'PAN', 0, F.pct], ['smooth', 'SMOOTH', 0.4, F.pct], ['swing', 'SWING', 0, v => Math.round(50 + v * 25) + '%'], ['mix', 'MIX', 1, F.pct]],
            extra: () => ({ vpts: SHAPES.PUMP(), fpts: SHAPES['RAMP UP'](), ppts: SHAPES.SINE() }),
            paint(p, u, v, last) { let k = ['vpts', 'fpts', 'ppts'][idx(p.edit, 3)], a = p[k] || (p[k] = new Array(16).fill(0.5)), i = Math.max(0, Math.min(15, Math.floor(u * 16))), val = Math.max(0, Math.min(1, 1 - v));
                if (last != null && last !== i) { let s = Math.sign(i - last); for (let j = last + s; j !== i; j += s) a[j] = val; } a[i] = Math.round(val * 100) / 100; return i; },
            make(ctx) {
                let b = box(ctx), vg = b.g(1), fl = bq(ctx, 'lowpass', 20000, 0.7), pn = ctx.createStereoPanner(), P0 = null, bpm = 120, an = null;
                b.in.connect(vg); vg.connect(fl); fl.connect(pn); pn.connect(b.wet); an = tap(ctx, pn, 1024);
                const cut = p => expo(40, 12000, p.fcut), lenOf = v => LENS[idx(v, LENS.length)][1];
                const lane = (p, pts, len, dep, put, b0, b1, tb) => { if (!pts || dep < 0.005) return; let st = len / 16, sm = p.smooth;
                    let sw = (p.swing || 0) * 0.5 * st;
                    for (let k = Math.ceil(b0 / st - 1e-9); k * st < b1; k++) { let v = pts[((k % 16) + 16) % 16], t = tb(k * st + (k % 2 ? sw : 0)); put(v, t, sm > 0.05 ? Math.max(0.001, st * 60 / bpm * sm * 0.6) : 0.0015); } };
                const neutral = (now) => { let t = ctx.currentTime; [vg.gain, pn.pan].forEach(q => q.cancelScheduledValues(t)); fl.frequency.cancelScheduledValues(t);
                    vg.gain.setTargetAtTime(1, t, 0.01); pn.pan.setTargetAtTime(0, t, 0.01); if (P0) fl.frequency.setTargetAtTime(P0.fdep > 0.005 ? cut(P0) : (idx(P0.fkind, 3) === 1 ? 20 : 20000), t, 0.01); };
                return { in: b.in, out: b.out,
                    set(p, now, info, skip) { P0 = p; bpm = info.bpm; let S2 = setter(ctx, now, skip), fk = idx(p.fkind, 3);
                        fl.type = p.fdep < 0.005 ? 'allpass' : ['lowpass', 'highpass', 'bandpass'][fk]; fl.Q.value = 0.5 + p.fres * 14; if (p.fdep < 0.005) fl.frequency.value = 1000;
                        S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix); },
                    sched(b0, b1, tb) { if (!P0) return; let p = P0;
                        lane(p, p.vpts, lenOf(p.vlen), p.vdep, (v, t, tc) => vg.gain.setTargetAtTime(1 - p.vdep * (1 - v), t, tc), b0, b1, tb);
                        lane(p, p.fpts, lenOf(p.flen), p.fdep, (v, t, tc) => fl.frequency.setTargetAtTime(Math.min(20000, cut(p) * Math.pow(2, (idx(p.fkind, 3) === 1 ? -1 : 1) * p.fdep * v * 7)), t, tc), b0, b1, tb);
                        lane(p, p.ppts, lenOf(p.plen), p.pdep, (v, t, tc) => pn.pan.setTargetAtTime(p.pdep * (v * 2 - 1), t, tc), b0, b1, tb); },
                    rest() { neutral(); },
                    ap: { mix: mixAp(b) },
                    draw(x, w, h, D) {
                        S.bg(x, w, h); if (!P0) return; let e = idx(P0.edit, 3), cols = [D.A, D.B || '#8ac8ff', '#fff'];
                        ['vpts', 'fpts', 'ppts'].forEach((k, li) => { let a = P0[k]; if (!a) return; let pts = []; for (let i = 0; i < 16; i++) { pts.push([i / 16 * w, 6 + (1 - a[i]) * (h - 18)]); pts.push([(i + 1) / 16 * w, 6 + (1 - a[i]) * (h - 18)]); }
                            if (li === e) { x.fillStyle = cols[li]; x.globalAlpha = 0.14; x.beginPath(); x.moveTo(0, h - 12); pts.forEach(q => x.lineTo(q[0], q[1])); x.lineTo(w, h - 12); x.fill(); x.globalAlpha = 1; S.line(x, pts, cols[li], 2); }
                            else { x.globalAlpha = 0.28; S.line(x, pts, cols[li], 1); x.globalAlpha = 1; } });
                        for (let i = 1; i < 16; i++) { x.fillStyle = i % 4 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.14)'; x.fillRect(i / 16 * w, 0, 1, h - 12); }
                        S.txt(x, ['VOLUME', 'FILTER', 'PAN'][e] + ' · ' + LENS[idx([P0.vlen, P0.flen, P0.plen][e], LENS.length)][0] + ' · draw on me', 4, h - 2, cols[e]);
                    },
                    kill: stopAll(b) };
            } },
        { id: 'tide', jp: '潮', en: 'TIDE', sub: 'phaser. STAGES, SPEED (or IN TIME), DEPTH, CENTRE, FEEDBACK', face: 'glass',
            p: [['stages', 'STAGES', 0.6, F.pick(['4', '6', '8', '12'])], ['sync', 'IN TIME', 0, F.pick(PHS.map(l => l[0]))], ['speed', 'SPEED', 0.3, F.hz(0.03, 8)], ['depth', 'DEPTH', 0.7, F.pct], ['center', 'CENTRE', 0.45, F.hz(100, 4000)],
                ['fb', 'FEEDBACK', 0.65, v => Math.round((v * 2 - 1) * 95) + '%'], ['spread', 'SPREAD', 0.5, F.pct], ['env', 'FOLLOW', 0, F.pct], ['kind', 'KIND', 0, F.pick(['CLASSIC', 'RISING', 'FALLING'])], ['wave', 'WAVE', 0, F.pick(['sine', 'triangle'])], ['mix', 'MIX', 1, F.pct]],
            idle(p) { return idx(p.kind || 0, 3) ? { wave: 'the barber pole only goes one way', env: 'the barber pole only goes one way' } : {}; },
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-phase', 2) : null, P0 = null, an = null, fake = [];
                if (w) { b.in.connect(w); w.connect(b.wet); } else { let n = b.in; for (let k = 0; k < 6; k++) { let a = bq(ctx, 'allpass', 600 * (k + 1), 0.7); n.connect(a); n = a; fake.push(a); } n.connect(b.wet); }
                an = tap(ctx, b.out, 2048);
                return { in: b.in, out: b.out, wk: !w,
                    set(p, now, info, skip) { P0 = p; let S2 = setter(ctx, now, skip), sy = PHS[idx(p.sync, PHS.length)][1], hz = sy ? info.bpm / 60 / sy : expo(0.03, 8, p.speed);
                        if (w) { let Q = n => w.parameters.get(n); Q('stages').value = [4, 6, 8, 12][idx(p.stages, 4)]; S2('speed', Q('rate'), hz); S2('depth', Q('depth'), p.depth); S2('center', Q('center'), expo(100, 4000, p.center)); S2('fb', Q('fb'), (p.fb * 2 - 1) * 0.95); Q('spread').value = p.spread * 0.5; S2('env', Q('env'), p.env); Q('kind').value = idx(p.kind || 0, 3); Q('wave').value = idx(p.wave || 0, 2); }
                        S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix); },
                    ap: { mix: mixAp(b) },
                    draw(x, w2, h, D) { S.bg(x, w2, h); S.spec(x, an, w2, h, D.A); if (!P0) return; let t = performance.now() / 1000, sy = PHS[idx(P0.sync, PHS.length)][1], hz = sy ? 1 / (sy * 0.5) : expo(0.03, 8, P0.speed), st = [4, 6, 8, 12][idx(P0.stages, 4)];
                        let f0 = expo(100, 4000, P0.center) * Math.pow(2, Math.sin(t * hz * 6.283) * P0.depth * 3);
                        for (let k = 0; k < st / 2; k++) { let X0 = S.logx(Math.min(19000, f0 * Math.pow(1.9, k)), w2); x.fillStyle = D.A; x.globalAlpha = 0.6; x.fillRect(X0 - 1, 10, 2, h - 20); x.globalAlpha = 1; }
                        S.txt(x, st + ' STAGES · ' + ['', 'RISING · ', 'FALLING · '][idx(P0.kind || 0, 3)] + (sy ? PHS[idx(P0.sync, PHS.length)][0] : expo(0.03, 8, P0.speed).toFixed(2) + 'Hz') + (w ? '' : ' · needs the worklet'), 4, 10, D.A); },
                    kill: () => { bury([w]); stopAll(b)(); } };
            } },
        { id: 'collar', jp: '矯', en: 'BRACE', sub: 'pitch correction. pulls each sung note to the nearest note in the SCALE. SPEED 0 = hard robot snap, higher = natural. KEEP VIBRATO keeps the wobble. SHIFT + FORMANT move the voice. one voice at a time', face: 'iron',
            p: [['scale', 'SCALE', 0, F.pick(['SONG KEY', 'CHROMATIC', 'MAJOR', 'MINOR', 'PENTATONIC', 'BRUISE', 'PHRYGIAN'])], ['speed', 'SPEED', 0.1, F.ms(0, 0.4, 2)], ['amount', 'HOW HARD', 1, F.pct], ['vib', 'KEEP VIBRATO', 0, F.pct], ['shift', 'SHIFT', 0.5, v => { let n = Math.round((v - 0.5) * 24); return (n > 0 ? '+' : '') + n + 'st'; }],
                ['fmt', 'FORMANT', 0.5, v => { let n = Math.round((v - 0.5) * 24); return (n > 0 ? '+' : '') + n + 'st'; }], ['mix', 'MIX', 1, F.pct]],
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-collar', 2) : null, P0 = null, hist = [], fix = [], last = { f0: 0, r: 1 }, inf = { root: 0, scale: 'minor' }, dd = ctx.createDelay(0.1), dg = b.g(0);
                b.dry.gain.value = 0; b.in.connect(dd); dd.connect(dg); dg.connect(b.out);
                if (w) { dd.delayTime.value = 2048 / ctx.sampleRate; b.in.connect(w); w.connect(b.wet); w.port.onmessage = e => { if (e.data && e.data.f0 != null) { last = e.data; let m = e.data.f0 ? 69 + 12 * Math.log2(e.data.f0 / 440) : null; hist.push(m); fix.push(m == null ? null : m + 12 * Math.log2(e.data.r || 1)); if (hist.length > 120) { hist.shift(); fix.shift(); } } }; } else b.in.connect(b.wet);
                const SC = { 'CHROMATIC': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 'MAJOR': [0, 2, 4, 5, 7, 9, 11], 'MINOR': [0, 2, 3, 5, 7, 8, 10], 'PENTATONIC': [0, 3, 5, 7, 10], 'BRUISE': [0, 3, 5, 6, 7, 10], 'PHRYGIAN': [0, 1, 3, 5, 7, 8, 10] };
                const maskOf = p => { let nm = ['SONG KEY', 'CHROMATIC', 'MAJOR', 'MINOR', 'PENTATONIC', 'BRUISE', 'PHRYGIAN'][idx(p.scale, 7)], s = nm === 'SONG KEY' ? ((window.NB && NB.SCALES && NB.SCALES[inf.scale]) || { s: SC.MINOR }).s : SC[nm]; return s.reduce((m, k) => m | (1 << k), 0); };
                return { in: b.in, out: b.out, wk: !w, lat: () => w ? 2048 / ctx.sampleRate : 0,
                    set(p, now, info, skip) { P0 = p; inf = info; let S2 = setter(ctx, now, skip);
                        if (w) { let Q = n => w.parameters.get(n); Q('mask').value = maskOf(p); Q('root').value = ((info.root || 0) % 12 + 12) % 12; S2('speed', Q('speed'), Math.pow(p.speed, 2) * 0.4); S2('amount', Q('amount'), p.amount); Q('shift').value = Math.round((p.shift - 0.5) * 24);
                            Q('formant').value = Math.round(((p.fmt == null ? 0.5 : p.fmt) - 0.5) * 24); Q('vib').value = p.vib || 0; }
                        S2('mix', b.wet.gain, p.mix); S2('mix', dg.gain, 1 - p.mix); },
                    ap: { mix: [[b.wet.gain, v => v], [dg.gain, v => 1 - v]] },
                    draw(x, w2, h, D) { S.bg(x, w2, h); if (!w) { S.txt(x, 'needs the worklet', 6, 12, '#667'); return; }
                        const NN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], m = last.f0 ? 69 + 12 * Math.log2(last.f0 / 440) : null;
                        let ok = hist.filter(v => v != null); let mid = ok.length ? ok[ok.length - 1] : 60;
                        for (let k = -4; k <= 4; k++) { let nn = Math.round(mid) + k, Y = h / 2 - k * 8, inS = P0 && (maskOf(P0) & (1 << (((nn - (inf.root || 0)) % 12 + 12) % 12))); x.fillStyle = inS ? 'rgba(140,255,200,0.16)' : 'rgba(255,255,255,0.03)'; x.fillRect(0, Y - 3, w2, 6); if (inS) S.txt(x, NN[((nn % 12) + 12) % 12], w2 - 16, Y + 3, 'rgba(140,255,200,0.5)', 7); }
                        [[hist, 'rgba(255,255,255,0.35)', 1], [fix, D.A, 1.6]].forEach(([H2, col, lw]) => { let pts = []; H2.forEach((v, i) => { if (v != null) pts.push([i / 120 * w2, h / 2 - (v - Math.round(mid)) * 8]); else if (pts.length > 1) { S.line(x, pts, col, lw); pts = []; } else pts = []; }); if (pts.length > 1) S.line(x, pts, col, lw); });
                        S.txt(x, m ? NN[((Math.round(m) % 12) + 12) % 12] + (Math.floor(Math.round(m) / 12) - 1) + '  ' + ((m - Math.round(m)) * 100 > 0 ? '+' : '') + Math.round((m - Math.round(m)) * 100) + 'c  →  pulled ' + Math.round(1200 * Math.log2(last.r || 1)) + 'c' : 'listening…', 4, 11, D.A, 10); },
                    kill: () => { bury([w]); stopAll(b)(); } };
            } },
        { id: 'choir', jp: '合唱', en: 'CHOIR', part: 'nb_fx_choir', sub: 'harmonies. adds up to three voices a 3rd, 5th or octave away, always in key. FORMANT changes their size, HUMAN adds drift + timing, WIDE spreads them, GLIDE = how fast they follow', face: 'chrome',
            p: [['n', 'VOICES', 0.5, F.pick(['1', '2', '3'])], ['i0', 'FIRST', 0, F.pick(CHOIRI.map(q => q[0]))], ['i1', 'SECOND', 1.5 / 11, F.pick(CHOIRI.map(q => q[0]))], ['i2', 'THIRD', 8.5 / 11, F.pick(CHOIRI.map(q => q[0]))],
                ['scale', 'SCALE', 0, F.pick(['SONG KEY', 'MAJOR', 'MINOR', 'PENTATONIC', 'BRUISE', 'PHRYGIAN'])], ['glide', 'GLIDE', 0.35, F.ms(0, 0.3, 2)], ['human', 'HUMAN', 0.35, F.pct], ['spread', 'WIDE', 0.7, F.pct], ['fmt', 'FORMANT', 0.5, v => { let n = Math.round((v - 0.5) * 24); return (n > 0 ? '+' : '') + n + 'st'; }], ['mix', 'HARMONIES', 0.55, F.pct]],
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-choir', 2) : null, P0 = null, inf = { root: 9, scale: 'minor' }, last = { f0: 0, sh: [] };
                let dd = ctx.createDelay(0.1); b.dry.gain.value = 1; b.in.disconnect(b.dry); b.in.connect(dd); dd.connect(b.dry);
                if (w) { dd.delayTime.value = 2048 / ctx.sampleRate; b.in.connect(w); w.connect(b.wet); w.port.onmessage = e => { if (e.data && e.data.f0 != null) last = e.data; }; }
                const SC = { MAJOR: [0, 2, 4, 5, 7, 9, 11], MINOR: [0, 2, 3, 5, 7, 8, 10], PENTATONIC: [0, 3, 5, 7, 10], BRUISE: [0, 3, 5, 6, 7, 10], PHRYGIAN: [0, 1, 3, 5, 7, 8, 10] };
                const maskOf = p => { let nm = ['SONG KEY', 'MAJOR', 'MINOR', 'PENTATONIC', 'BRUISE', 'PHRYGIAN'][idx(p.scale, 6)], sc = nm === 'SONG KEY' ? ((window.NB && NB.SCALES && NB.SCALES[inf.scale]) || { s: SC.MINOR }).s : SC[nm]; return sc.reduce((m, k) => m | (1 << k), 0); };
                return { in: b.in, out: b.out, wk: !w, lat: () => w ? 2048 / ctx.sampleRate : 0,
                    set(p, now, info, skip) { P0 = p; inf = info || inf; let S2 = setter(ctx, now, skip);
                        if (w) { let Q = n => w.parameters.get(n); Q('mask').value = maskOf(p); Q('root').value = ((inf.root || 0) % 12 + 12) % 12; Q('n').value = 1 + idx(p.n, 3);
                            ['i0', 'i1', 'i2'].forEach(k => { Q(k).value = CHOIRI[idx(p[k], CHOIRI.length)][1]; }); S2('glide', Q('glide'), Math.pow(p.glide, 2) * 0.3); S2('human', Q('human'), p.human); S2('spread', Q('spread'), p.spread); Q('formant').value = Math.round(((p.fmt == null ? 0.5 : p.fmt) - 0.5) * 24); }
                        S2('mix', b.wet.gain, p.mix * 1.3); },
                    ap: { mix: [[b.wet.gain, v => v * 1.3]] },
                    draw(x, w2, h, D) { S.bg(x, w2, h); if (!w) { S.txt(x, 'needs the worklet', 6, 12, '#667'); return; }
                        const NN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], nm = m => NN[((Math.round(m) % 12) + 12) % 12] + (Math.floor(Math.round(m) / 12) - 1);
                        let m = last.f0 ? 69 + 12 * Math.log2(last.f0 / 440) : null;
                        x.fillStyle = 'rgba(255,255,255,0.06)'; x.fillRect(0, h / 2 - 1, w2, 2);
                        if (m == null && P0) { let mk = maskOf(P0); for (let k = -9; k <= 9; k++) { if (!(mk & (1 << (((k + 9 + (inf.root || 0)) % 12 + 12) % 12)))) continue; x.fillStyle = 'rgba(140,255,200,0.07)'; x.fillRect(0, h / 2 - k * 2.6 * 2 - 2, w2, 3); } }
                        if (m != null) { x.fillStyle = '#fff'; x.fillRect(w2 * 0.1, h / 2 - 3, w2 * 0.8, 6); (last.sh || []).forEach((s, j) => { let Y = h / 2 - s * 2.6; x.fillStyle = D.A; x.globalAlpha = 0.85; x.fillRect(w2 * (0.16 + j * 0.24), Y - 2.5, w2 * 0.2, 5); x.globalAlpha = 1; S.txt(x, nm(m + s), w2 * (0.16 + j * 0.24) + 2, Y - 5, D.A, 9); }); }
                        S.txt(x, m != null ? 'YOU ' + nm(m) + '  ·  ' + (last.sh || []).length + ' WITH YOU' : 'listening. sing something', 4, 11, D.A, 10); },
                    kill: () => { bury([w]); stopAll(b)(); } };
            } },
        { id: 'rider', jp: '乗り手', en: 'RIDER', sub: 'vocal rider. brings quiet words up + loud ones down, within RANGE. TARGET, SPEED. BREATHS pulls breaths down instead. LOOK AHEAD reacts early, VOICE EAR ignores bleed. put it before compression', face: 'steel',
            p: [['target', 'TARGET', 0.55, F.db(-40, 0)], ['range', 'RANGE', 0.5, v => '±' + Math.round(v * 18) + 'dB'], ['speed', 'SPEED', 0.3, F.ms(0.02, 2, 2)], ['breath', 'BREATHS', 0, v => v < 0.01 ? 'off' : 'below ' + Math.round(-70 + v * 50) + 'dB'], ['bdip', 'BREATH DIP', 0.4, F.db(0, -24)], ['ahead', 'LOOK AHEAD', 0, F.ms(0, 0.03)], ['ear', 'VOICE EAR', 0, F.pick(['off', 'on'])], ['out', 'OUTPUT', 0.5, F.db(-12, 12)]],
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-ride', 2) : null, og = b.g(1), hist = [], last = { g: 0, lvl: -90 };
                let lh = [], P0 = null;
                if (w) { b.in.connect(w); w.connect(og); w.port.onmessage = e => { if (e.data && e.data.g != null) { last = e.data; hist.push(e.data.g); lh.push(e.data.lvl); if (hist.length > 160) { hist.shift(); lh.shift(); } } }; } else b.in.connect(og);
                og.connect(b.wet);
                return { in: b.in, out: b.out, wk: !w, lat: () => w && P0 ? (P0.ahead || 0) * 0.03 : 0,
                    set(p, now, info, skip) { P0 = p; let S2 = setter(ctx, now, skip);
                        if (w) { let Q = n => w.parameters.get(n); Q('ahead').value = (p.ahead || 0) * 0.03; Q('ear').value = idx(p.ear || 0, 2); S2('target', Q('target'), -40 + p.target * 40); S2('range', Q('range'), p.range * 18); S2('speed', Q('speed'), expo(0.02, 2, p.speed)); Q('breath').value = p.breath < 0.01 ? -90 : -70 + p.breath * 50; S2('bdip', Q('bdip'), p.bdip * 24); }
                        S2('out', og.gain, db2g(-12 + p.out * 24)); },
                    ap: { out: [[og.gain, v => db2g(-12 + v * 24)]] },
                    draw(x, w2, h, D) { S.bg(x, w2, h); if (!w) { S.txt(x, 'needs the worklet', 6, 12, '#667'); return; }
                        const Yl = db => 14 + (1 - Math.max(0, (db + 60) / 60)) * (h / 2 - 16);
                        if (P0) { let ty = Yl(-40 + P0.target * 40); x.setLineDash([4, 3]); x.strokeStyle = 'rgba(255,255,255,0.5)'; x.beginPath(); x.moveTo(0, ty); x.lineTo(w2, ty); x.stroke(); x.setLineDash([]); }
                        if (lh.length > 1) S.line(x, lh.map((v, i) => [i / 160 * w2, Yl(Math.max(-60, v))]), 'rgba(140,255,200,0.35)', 1);
                        x.fillStyle = 'rgba(255,255,255,0.1)'; x.fillRect(0, h * 0.72, w2, 1);
                        let pts = hist.map((g, i) => [i / 160 * w2, h * 0.72 - g / 18 * (h * 0.26)]); if (pts.length > 1) S.line(x, pts, D.A, 1.6);
                        S.txt(x, (last.g >= 0 ? '+' : '') + last.g.toFixed(1) + 'dB  ·  hearing ' + (last.lvl < -80 ? 'nothing' : Math.round(last.lvl) + 'dB'), 4, 11, D.A, 10); },
                    kill: () => { bury([w]); stopAll(b)(); } };
            } },
        { id: 'altar', jp: '祭壇', en: 'ALTAR', sub: 'vocal chain. one knob each: CLEAN (rumble + mud), TAME (sibilance), HOLD (compression), WARM, SHINE (presence + air), SPACE (reverb), WIDE (doubles). CHARACTER: CLOSE, UP FRONT, FAR, RADIO. a good start on any voice', face: 'chrome',
            p: [['char', 'CHARACTER', 0.3, F.pick(['CLOSE', 'UP FRONT', 'FAR', 'RADIO'])], ['clean', 'CLEAN', 0.5, F.pct], ['tame', 'TAME', 0.45, F.pct], ['tamef', 'TAME AT', 0.5, F.hz(3500, 11000)], ['hold', 'HOLD', 0.5, F.pct], ['warm', 'WARM', 0, F.pct], ['shine', 'SHINE', 0.45, F.pct], ['space', 'SPACE', 0.25, F.pct], ['wide', 'WIDE', 0.15, F.pct], ['out', 'OUTPUT', 0.5, F.db(-12, 12)]],
            make(ctx) {
                let b = box(ctx), hp = bq(ctx, 'highpass', 90, 0.7), mud = bq(ctx, 'peaking', 320, 1), rhp = bq(ctx, 'highpass', 20, 0.7), rlp = bq(ctx, 'lowpass', 22000, 0.7), sh = bq(ctx, 'highshelf', 6500, 0), det = bq(ctx, 'bandpass', 7000, 1.4);
                let fo = ctx._nbwk ? wkNode(ctx, 'nb-follow', 1) : null, sens = b.g(8), cl = ctx.createWaveShaper(), amt = b.g(0), comp = ctx.createDynamicsCompressor(), pres = bq(ctx, 'peaking', 3500, 0.8), air = bq(ctx, 'highshelf', 11000, 0), drv = ctx.createWaveShaper(), og = b.g(1);
                cl.curve = curveOf(v => Math.max(0, Math.min(1, v)));
                let wm = ctx.createWaveShaper(), wk2 = -1; wm.oversample = '2x';
                [b.in, hp, mud, rhp, rlp, sh, wm, comp, pres, air, drv, og].reduce((q, n) => { q.connect(n); return n; }); og.connect(b.wet);
                if (fo) { b.in.connect(det); det.connect(fo); fo.connect(sens); sens.connect(cl); cl.connect(amt); amt.connect(sh.gain); }
                let pre = ctx.createDelay(0.2), conv = ctx.createConvolver(), sg = b.g(0), d1 = ctx.createDelay(0.1), d2 = ctx.createDelay(0.1), p1 = ctx.createStereoPanner(), p2 = ctx.createStereoPanner(), wg = b.g(0);
                pre.delayTime.value = 0.02; conv.buffer = irBuf(ctx, { len: 1.5, kind: 0, dark: 0.35, decay: 3, size: 0.4 }); d1.delayTime.value = 0.011; d2.delayTime.value = 0.017; p1.pan.value = -0.85; p2.pan.value = 0.85;
                og.connect(pre); pre.connect(conv); conv.connect(sg); sg.connect(b.wet); og.connect(d1); og.connect(d2); d1.connect(p1); d2.connect(p2); p1.connect(wg); p2.connect(wg); wg.connect(b.wet);
                let an = tap(ctx, og, 1024), P0 = null, lc = -1;
                return { in: b.in, out: b.out, wk: !fo,
                    set(p, now, info, skip) { P0 = p; let S2 = setter(ctx, now, skip), ch = idx(p.char, 4);
                        S2('clean', hp.frequency, 60 + p.clean * 120); S2('clean', mud.gain, -p.clean * 6);
                        rhp.type = 'highpass'; rhp.frequency.value = ch === 3 ? 450 : 0; rlp.type = ch === 3 || ch === 2 ? 'lowpass' : 'allpass'; rlp.frequency.value = ch === 3 ? 3200 : 6500;
                        if (ch !== lc) { lc = ch; drv.curve = ch === 3 ? curveOf(v => Math.tanh(v * 3) / Math.tanh(3)) : null; }
                        amt.gain.value = -p.tame * 14; sens.gain.value = 1 + p.tame * 25; let tf = expo(3500, 11000, p.tamef == null ? 0.5 : p.tamef); det.frequency.value = tf; sh.frequency.value = tf * 0.93;
                        let wk3 = Math.round((p.warm || 0) * 30); if (wk3 !== wk2) { wk2 = wk3; let d = 1 + (p.warm || 0) * 3; wm.curve = wk3 ? curveOf(v => (Math.tanh(v * d + 0.15 * (p.warm || 0)) - Math.tanh(0.15 * (p.warm || 0))) / Math.tanh(d)) : null; }
                        let rk = ch + ''; if (rk !== this._rk) { this._rk = rk; conv.buffer = irBuf(ctx, [{ len: 0.7, kind: 1, dark: 0.4, decay: 4, size: 0.2 }, { len: 1.5, kind: 0, dark: 0.35, decay: 3, size: 0.4 }, { len: 2.8, kind: 3, dark: 0.45, decay: 2.2, size: 0.7 }, { len: 0.5, kind: 1, dark: 0.6, decay: 5, size: 0.15 }][ch]); pre.delayTime.value = [0.008, 0.02, 0.045, 0.01][ch]; }
                        comp.threshold.value = -8 - p.hold * 28 - (ch === 1 ? 4 : 0); comp.ratio.value = 1.5 + p.hold * 4.5 + (ch === 1 ? 1.5 : 0); comp.attack.value = 0.004; comp.release.value = 0.14; comp.knee.value = 8;
                        S2('shine', pres.gain, p.shine * 5 + (ch === 1 ? 2 : ch === 2 ? -2 : 0)); S2('shine', air.gain, p.shine * 7);
                        S2('space', sg.gain, p.space * 0.6 * [0.6, 1, 1.8, 0.8][ch]); S2('wide', wg.gain, p.wide * 0.45); S2('out', og.gain, db2g(-12 + p.out * 24) * (1 + p.hold * 0.5)); },
                    ap: { out: [[og.gain, v => db2g(-12 + v * 24)]], space: [[sg.gain, v => v * 0.6]], wide: [[wg.gain, v => v * 0.45]] },
                    draw(x, w, h, D) { S.bg(x, w, h); S.spec(x, an, w, h, D.B);
                        let r = comp.reduction || 0; x.fillStyle = D.A; x.fillRect(w - 10, 4, 6, Math.min(h - 8, -r * 3));
                        if (P0) S.txt(x, ['CLOSE', 'UP FRONT', 'FAR', 'RADIO'][idx(P0.char, 4)] + '  ·  holding ' + (-r).toFixed(1) + 'dB' + (fo ? '' : '  · TAME needs the worklet'), 4, 11, D.A, 10); },
                    kill: () => { bury([fo]); stopAll(b)(); } };
            } },
        // channel strip. eq, comp, the works
        { id: 'strip', jp: '帯', en: 'STRIP', sub: 'channel strip. TRIM, LOW + HIGH CUT, 4 band eq, SQUEEZE (compressor), GATE, HEAT (desk saturation). ORDER puts the compressor before or after the eq', face: 'steel',
            p: [['trim', 'TRIM', 0.5, F.db(-12, 12)], ['hpf', 'LOW CUT', 0, F.hz(20, 500)], ['lpf', 'HIGH CUT', 1, F.hz(2000, 22000)], ['lg', 'LOW', 0.5, F.db(-12, 12)], ['lmg', 'LOW MID', 0.5, F.db(-12, 12)], ['lmf', 'LOW MID AT', 0.35, F.hz(150, 2000)],
                ['lmq', 'LOW MID WIDTH', 0.4, v => (0.3 + (1 - v) * 3.7).toFixed(1)], ['hmg', 'HIGH MID', 0.5, F.db(-12, 12)], ['hmf', 'HIGH MID AT', 0.5, F.hz(800, 8000)], ['hmq', 'HIGH MID WIDTH', 0.4, v => (0.3 + (1 - v) * 3.7).toFixed(1)], ['hg', 'HIGH', 0.5, F.db(-12, 12)],
                ['thr', 'SQUEEZE', 1, v => v > 0.99 ? 'off' : (-40 + v * 40).toFixed(0) + 'dB'], ['ratio', 'RATIO', 0.25, F.x(1.5, 10)], ['catt', 'ATTACK', 0.2, F.ms(0.0003, 0.05, 2)], ['crel', 'RELEASE', 0.25, F.ms(0.03, 1.2, 1.5)], ['order', 'ORDER', 0, F.pick(['EQ → SQUEEZE', 'SQUEEZE → EQ'])],
                ['gate', 'GATE', 0, v => v < 0.01 ? 'off' : (-80 + v * 60).toFixed(0) + 'dB'], ['gdep', 'GATE DEPTH', 0.6, v => '-' + Math.round(6 + v * 74) + 'dB'], ['thd', 'HEAT', 0.2, F.pct], ['out', 'OUTPUT', 0.5, F.db(-12, 12)]],
            idle(p) { let o = {}; if (p.thr > 0.99) { o.ratio = o.catt = o.crel = 'SQUEEZE is off'; } if ((p.gate || 0) < 0.01) o.gdep = 'the GATE is off'; return o; },
            make(ctx) {
                let b = box(ctx), tr = b.g(1), hp = bq(ctx, 'highpass', 20, 0.7), lp = bq(ctx, 'lowpass', 22000, 0.7), ls = bq(ctx, 'lowshelf', 100), m1 = bq(ctx, 'peaking', 500, 0.9), m2 = bq(ctx, 'peaking', 3000, 0.9), hs = bq(ctx, 'highshelf', 9000);
                let c = ctx.createDynamicsCompressor(), sh = ctx.createWaveShaper(), gt = b.g(1), og = b.g(1), fo = ctx._nbwk ? wkNode(ctx, 'nb-follow', 1) : null, cv = ctx.createWaveShaper(), P0 = null, lk = '', lg = '', an = null;
                c.knee.value = 6; sh.oversample = '2x';
                let ord = -1; const chain = o => { if (o === ord) return; ord = o; [lp, hs, c, m2].forEach(n2 => { try { n2.disconnect(); } catch (e) {} });
                    if (o) { lp.connect(c); c.connect(ls); ls.connect(m1); m1.connect(m2); m2.connect(hs); hs.connect(sh); } else { lp.connect(ls); ls.connect(m1); m1.connect(m2); m2.connect(hs); hs.connect(c); c.connect(sh); } };
                [b.in, tr, hp, lp].reduce((a, n) => { a.connect(n); return n; }); chain(0); sh.connect(gt); gt.connect(og); og.connect(b.wet);
                if (fo) { tr.connect(fo); fo.connect(cv); gt.gain.value = 0; cv.connect(gt.gain); }
                an = tap(ctx, og, 1024); let list = [hp, lp, ls, m1, m2, hs];
                return { in: b.in, out: b.out, wk: !fo,
                    set(p, now, info, skip) { P0 = p; let S2 = setter(ctx, now, skip);
                        S2('trim', tr.gain, db2g(-12 + p.trim * 24)); { let SX = exact(ctx, now, skip); hp.type = 'highpass'; if (p.hpf < 0.005) SX('hpf', hp.frequency, 0); else S2('hpf', hp.frequency, expo(20, 500, p.hpf)); lp.type = 'lowpass'; if (p.lpf > 0.995) SX('lpf', lp.frequency, ctx.sampleRate / 2); else S2('lpf', lp.frequency, expo(2000, 22000, p.lpf)); }
                        S2('lg', ls.gain, -12 + p.lg * 24); S2('lmg', m1.gain, -12 + p.lmg * 24); S2('lmf', m1.frequency, expo(150, 2000, p.lmf)); S2('hmg', m2.gain, -12 + p.hmg * 24); S2('hmf', m2.frequency, expo(800, 8000, p.hmf)); S2('hg', hs.gain, -12 + p.hg * 24);
                        chain(idx(p.order || 0, 2)); m1.Q.value = 0.3 + (1 - (p.lmq == null ? 0.4 : p.lmq)) * 3.7; m2.Q.value = 0.3 + (1 - (p.hmq == null ? 0.4 : p.hmq)) * 3.7;
                        c.threshold.value = p.thr > 0.99 ? 0 : -40 + p.thr * 40; c.ratio.value = p.thr > 0.99 ? 1 : 1.5 + p.ratio * 8.5; c.attack.value = p.catt == null ? 0.008 : 0.0003 + Math.pow(p.catt, 2) * 0.0497; c.release.value = p.crel == null ? 0.15 : 0.03 + Math.pow(p.crel, 1.5) * 1.17;
                        let k = Math.round(p.thd * 50); if (k + '' !== lk) { lk = k + ''; let d = 1 + p.thd * 6; sh.curve = p.thd < 0.01 ? null : curveOf(x => Math.tanh(x * d + 0.08 * p.thd * x * x) / Math.tanh(d)); }
                        let gk = Math.round(p.gate * 100) + ':' + Math.round((p.gdep == null ? 0.6 : p.gdep) * 40); if (fo && gk !== lg) { lg = gk; let thr = db2g(-80 + p.gate * 60); let fl = p.gdep == null ? 0.02 : db2g(-(6 + p.gdep * 74)); cv.curve = p.gate < 0.01 ? curveOf(() => 1, 16) : curveOf(x => x <= 0 ? fl : x >= thr ? 1 : fl + (1 - fl) * Math.pow(x / thr, 3), 4096); fo.parameters.get('att').value = 0.002; fo.parameters.get('rel').value = 0.12; }
                        S2('out', og.gain, db2g(-12 + p.out * 24)); },
                    ap: { trim: [[tr.gain, v => db2g(-12 + v * 24)]], out: [[og.gain, v => db2g(-12 + v * 24)]], lg: [[ls.gain, v => -12 + v * 24]], hg: [[hs.gain, v => -12 + v * 24]] },
                    resp: f => respOf(list, f),
                    draw(x, w, h, D) { S.bg(x, w, h); S.spec(x, an, w, h, D.B);
                        let q = new Float32Array(w); for (let i = 0; i < w; i++) q[i] = 20 * Math.pow(1000, i / (w - 1)); let m = respOf(list, q), pts = []; for (let i = 0; i < w; i++) pts.push([i, clamp(h / 2 - 20 * Math.log10(Math.max(1e-4, m[i])) / 14 * (h / 2), 1, h - 1)]);
                        S.line(x, pts, D.A, 2); let gr = -c.reduction; x.fillStyle = '#ff7a50'; x.fillRect(w - 8, 4, 4, Math.min(h - 8, gr * 4)); S.txt(x, 'SQUEEZE ' + gr.toFixed(1) + 'dB', 4, 10, gr > 0.3 ? '#ff9a80' : '#667'); },
                    kill: () => { bury([fo]); stopAll(b)(); } };
            } },
        { id: 'yield', jp: '譲', en: 'YIELD', sub: 'makes room. tick the tracks it LISTENS TO + it dips only the frequencies where theyre loud, only while they play. SENSE = how sensitive. WHERE = everywhere or SIDES ONLY (keeps the centre full)', face: 'velvet', side: true,
            p: [['amount', 'HOW MUCH', 0.6, F.pct], ['range', 'DEEPEST', 0.4, F.db(0, -30)], ['att', 'ATTACK', 0.15, F.ms(0.001, 0.15, 2)], ['rel', 'RELEASE', 0.25, F.ms(0.02, 1.2, 1.5)], ['lo', 'FROM', 0, F.hz(20, 2000)], ['hi', 'TO', 1, F.hz(500, 20000)], ['sense', 'SENSE', 0.58, v => (-12 + v * 36 > 0 ? '+' : '') + (-12 + v * 36).toFixed(0) + 'dB'], ['where', 'WHERE', 0, F.pick(['EVERYWHERE', 'SIDES ONLY'])], ['mix', 'MIX', 1, F.pct]],
            extra: () => ({ keys: [] }),
            make(ctx) {
                let b = box(ctx), side = b.g(1), w = null, P0 = null, gl = new Array(32).fill(1);
                try { if (ctx._nbwk) { w = new AudioWorkletNode(ctx, 'nb-yield', { numberOfInputs: 2, numberOfOutputs: 1, outputChannelCount: [2] }); (ctx._nbw = ctx._nbw || new Set()).add(w); } } catch (e) { w = null; }
                let dl = ctx.createDelay(0.1); dl.delayTime.value = 1024 / ctx.sampleRate; b.in.disconnect(b.dry); b.in.connect(dl); dl.connect(b.dry);
                let kd = new Array(32).fill(-90);
                if (w) { b.in.connect(w, 0, 0); side.connect(w, 0, 1); w.connect(b.wet); w.port.onmessage = e => { if (Array.isArray(e.data)) gl = e.data; else if (e.data && e.data.g) { gl = e.data.g; kd = e.data.k; } }; } else b.in.connect(b.wet);
                return { in: b.in, out: b.out, side, wk: !w, lat: () => w ? 1024 / ctx.sampleRate : 0, keys: () => P0 ? (P0.keys || []) : [], follows: () => true,
                    set(p, now, info, skip) { P0 = p; let S2 = setter(ctx, now, skip); if (w) { let Q = n => w.parameters.get(n); S2('amount', Q('amount'), p.amount); Q('sense').value = -12 + (p.sense == null ? 0.58 : p.sense) * 36; Q('sides').value = idx(p.where || 0, 2); Q('range').value = p.range * 30; Q('att').value = 0.001 + Math.pow(p.att, 2) * 0.15; Q('rel').value = 0.02 + Math.pow(p.rel, 1.5) * 1.2; Q('lo').value = expo(20, 2000, p.lo); Q('hi').value = expo(500, 20000, p.hi); }
                        let hasKey = (p.keys || []).length > 0; S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix); },
                    ap: { mix: mixAp(b) },
                    draw(x, w2, h, D) { S.bg(x, w2, h); if (!w) { S.txt(x, 'needs the worklet', 6, 12, '#667'); return; }
                        let bw = w2 / 32; gl.forEach((g, i) => { let d = -20 * Math.log10(Math.max(1e-3, g)), bh = Math.min(h - 16, d / 30 * (h - 16)); x.fillStyle = D.A; x.globalAlpha = 0.25 + Math.min(0.75, d / 12); x.fillRect(i * bw + 1, 14, bw - 2, bh); x.globalAlpha = 1; });
                        let kp = kd.map((v, i) => [i * bw + bw / 2, h - 4 - Math.max(0, Math.min(1, (v + 80) / 70)) * (h * 0.5)]); if (kp.length > 1) S.line(x, kp, 'rgba(255,255,255,0.5)', 1.2);
                        if (P0 && idx(P0.where || 0, 2)) S.txt(x, 'SIDES ONLY', w2 - 64, h - 4, D.A, 8);
                        S.txt(x, P0 && (P0.keys || []).length ? 'MAKING ROOM FOR ' + P0.keys.length + ' TRACK' + (P0.keys.length > 1 ? 'S' : '') : 'TICK WHAT IT MAKES ROOM FOR BELOW', 4, 10, D.A); },
                    kill: () => { bury([w]); stopAll(b)(); } };
            } },
        { id: 'chasm', jp: '淵', en: 'CHASM', sub: 'huge space. big reverbs + echoes. FREEZE holds it, WARP + DENSITY change the texture, DUCK clears it while you play', face: 'grave',
            p: [['mode', 'KIND', 0.2 + 0.01, F.pick(['ROOM', 'CLOUD', 'ABYSS', 'ECHOES', 'TUNNEL'])], ['size', 'SIZE', 0.55, F.pct], ['fb', 'FEEDBACK', 0.6, v => v > 0.985 ? '∞' : Math.round(v * 100) + '%'], ['damp', 'DARK', 0.4, v => F.hz(500, 20000)(1 - v)], ['mod', 'WARP', 0.3, F.pct], ['rate', 'WARP SPEED', 0.3, F.hz(0.05, 4)],
                ['diff', 'DENSITY', 0.7, F.pct], ['beat', 'ECHO TIME', 0.5, F.pick(DTIME.map(d => d[0]))], ['pre', 'BEFORE', 0, F.ms(0, 0.4)], ['lcut', 'LOW CUT', 0.2, F.hz(20, 1000)], ['freeze', 'FREEZE', 0, F.pick(['off', 'HOLD'])], ['duck', 'DUCK', 0, F.pct], ['width', 'WIDTH', 1, F.pct], ['mix', 'MIX', 0.35, F.pct]],
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-chasm', 2) : null, pd = ctx.createDelay(1), hp = bq(ctx, 'highpass', 80, 0.7), vg = b.g(1.4), P0 = null, an = null;
                b.in.connect(pd); pd.connect(hp); if (w) { hp.connect(w); w.connect(vg); } else { let cv = ctx.createConvolver(); cv.buffer = irBuf(ctx, { len: 4, decay: 2, dark: 0.4, kind: 3 }); hp.connect(cv); cv.connect(vg); } vg.connect(b.wet);
                an = tap(ctx, vg, 1024);
                return { in: b.in, out: b.out, wk: !w,
                    set(p, now, info, skip) { P0 = p; let S2 = setter(ctx, now, skip), md = idx(p.mode, 5);
                        S2('pre', pd.delayTime, p.pre * 0.4); S2('lcut', hp.frequency, expo(20, 1000, p.lcut));
                        if (w) { let Q = n => w.parameters.get(n), sz = md === 0 ? p.size * 0.45 : md === 2 ? 0.55 + p.size * 0.45 : md === 4 ? 0.02 + p.size * 0.1 : p.size;
                            Q('size').value = sz; S2('fb', Q('fb'), md === 0 ? p.fb * 0.85 : p.fb); S2('damp', Q('damp'), expo(500, 20000, 1 - p.damp)); S2('mod', Q('mod'), p.mod * (md === 1 ? 1.6 : 1)); Q('rate').value = expo(0.05, 4, p.rate);
                            Q('diff').value = md === 3 ? p.diff * 0.25 : md === 4 ? 0.1 : md === 1 ? Math.max(0.85, p.diff) : p.diff; Q('base').value = md === 3 ? DTIME[idx(p.beat, DTIME.length)][1] * 60 / info.bpm : 0; Q('spread').value = md === 3 ? 0.4 : 1;
                            Q('frz').value = (p.freeze || 0) >= 0.5 ? 1 : 0; S2('duck', Q('duck'), p.duck || 0); Q('width').value = p.width == null ? 1 : p.width; }
                        S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix * 0.5); },
                    ap: { mix: [[b.wet.gain, v => v], [b.dry.gain, v => 1 - v * 0.5]] },
                    draw(x, w2, h, D) { x.fillStyle = '#020203'; x.fillRect(0, 0, w2, h); if (!P0) return; let pk = S.meter(x, an, w2, h); this._h = this._h || []; this._h.push(pk); if (this._h.length > 90) this._h.shift();
                        let cx = w2 / 2, cy = h / 2 + 4, n = 14, H = this._h, sp = (D.now * (0.15 + P0.fb * 0.25)) % 1;
                        for (let k = n; k >= 0; k--) { let u = (k + sp) / n, r = Math.pow(1 - u, 2.2), v = H[Math.max(0, H.length - 1 - Math.floor(u * (H.length - 1)))] || 0, a = Math.min(1, v * 6) * (1 - u) + 0.04;
                            x.strokeStyle = 'rgba(140,255,200,' + a + ')'; x.lineWidth = 1 + (1 - u) * 2; x.shadowColor = D.A; x.shadowBlur = a * 10; x.beginPath(); x.ellipse(cx, cy, r * w2 * 0.48 + 1, r * h * 0.42 + 1, 0, 0, 7); x.stroke(); }
                        x.shadowBlur = 0; let g = x.createRadialGradient(cx, cy, 0, cx, cy, 14); g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(cx - 14, cy - 14, 28, 28);
                        S.txt(x, ['ROOM', 'CLOUD', 'ABYSS', 'ECHOES', 'TUNNEL'][idx(P0.mode, 5)] + ((P0.freeze || 0) >= 0.5 ? ' · HELD' : P0.fb > 0.985 ? ' · ∞ it never stops' : '') + (w ? '' : ' · needs the worklet'), 4, 10, D.A); },
                    kill: () => { bury([w]); stopAll(b)(); } };
            } },
        { id: 'twin', jp: '双', en: 'TWIN', sub: 'doubler. HOW FAR apart, DRIFT, KEEP LOW keeps the bass mono', face: 'mist',
            p: [['style', 'STYLE', 0, F.pick(['I', 'II', 'III', 'TAPE', 'WALL'])], ['amount', 'HOW FAR', 0.5, F.pct], ['drift', 'DRIFT', 0.3, F.pct], ['keep', 'KEEP LOW', 0.3, F.hz(20, 600)], ['mix', 'MIX', 0.45, F.pct]],
            ver: 2, fix(p) { if ((p._v || 1) < 2) { if (p.style != null) p.style = (Math.min(2, Math.floor(p.style * 3)) + 0.5) / 5; p._v = 2; } return p; },
            make(ctx) {
                let b = box(ctx), hp = bq(ctx, 'highpass', 120, 0.7), w = ctx._nbwk ? wkNode(ctx, 'nb-micro', 2) : null, P0 = null, fd = null;
                b.in.connect(hp); if (w) { hp.connect(w); w.connect(b.wet); } else { fd = ctx.createDelay(0.1); fd.delayTime.value = 0.012; hp.connect(fd); fd.connect(b.wet); }
                const CS = [6, 11, 19, 0, 14], MS = [9, 14, 12, 30, 16], NV = [2, 2, 4, 1, 4], DR = [0, 0.4, 0.25, 0, 1];
                return { in: b.in, out: b.out, wk: !w,
                    set(p, now, info, skip) { P0 = p; let S2 = setter(ctx, now, skip), st = idx(p.style, 5), am = 0.3 + p.amount * 1.4;
                        if (w) { let Q = n => w.parameters.get(n); Q('n').value = NV[st]; Q('cents').value = CS[st] * am; Q('ms').value = MS[st] * (0.5 + p.amount); Q('drift').value = Math.min(1, (p.drift == null ? 0.3 : p.drift) + DR[st] * 0.4); Q('tape').value = st === 3 ? 1 : 0; }
                        S2('keep', hp.frequency, expo(20, 600, p.keep)); S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix * 0.4); },
                    ap: { mix: [[b.wet.gain, v => v], [b.dry.gain, v => 1 - v * 0.4]] },
                    draw(x, w2, h, D) {
                        S.bg(x, w2, h); if (!P0) return; let st = idx(P0.style, 5), am = 0.3 + P0.amount * 1.4, ce = CS[st] * am, nv = NV[st], dr = Math.min(1, (P0.drift == null ? 0.3 : P0.drift) + DR[st] * 0.4), t = D.now;
                        const C = [[1, 0], [-1, 1], [-0.62, 0], [0.62, 1]], Y = c => h / 2 - c / 40 * (h / 2 - 12);
                        x.strokeStyle = 'rgba(255,255,255,0.08)'; x.beginPath(); x.moveTo(w2 / 2, 14); x.lineTo(w2 / 2, h); x.moveTo(0, h / 2); x.lineTo(w2, h / 2); x.stroke();
                        x.fillStyle = '#fff'; x.beginPath(); x.arc(w2 / 2, h / 2, 4, 0, 7); x.fill();
                        for (let j = 0; j < nv; j++) { let c = st === 3 ? Math.sin(t * 2 * Math.PI * 0.9) * 6 : ce * C[j][0] + Math.sin(t * (0.3 + j * 0.17) + j) * dr * 4, X0 = st === 3 ? w2 / 2 : w2 / 2 + (C[j][1] ? 1 : -1) * w2 * (0.18 + (j >> 1) * 0.14);
                            x.fillStyle = D.A; x.globalAlpha = 0.85; x.beginPath(); x.arc(X0, Y(c), 5, 0, 7); x.fill(); x.globalAlpha = 0.3; x.fillRect(X0 - 0.5, Y(c), 1, h / 2 - Y(c)); x.globalAlpha = 1; }
                        S.txt(x, ['I', 'II', 'III', 'TAPE', 'WALL'][st] + ' · ' + nv + (nv === 1 ? ' copy' : ' copies') + (st === 3 ? ' · wow' : ' · ±' + ce.toFixed(0) + ' cents') + (w ? '' : ' (needs the worklet)'), 4, 11, D.A); },
                    kill: () => { bury([w]); stopAll(b)(); } };
            } },
        { id: 'rerun', jp: '擦', en: 'RERUN', sub: 'tape. cassette, reel or VHS. WOBBLE, FLUTTER, HISS, DROPOUTS, AGE', face: 'tape', part: 'nb_fx_rerun',
            p: [['wobble', 'WOBBLE', 0.35, F.pct], ['flutter', 'FLUTTER', 0.25, F.pct], ['drift', 'DRIFT', 0.2, F.pct], ['tape', 'TAPE', 0.35, F.pct], ['blur', 'BLUR', 0.35, F.pct], ['hiss', 'HISS', 0.15, F.pct], ['drop', 'DROPOUTS', 0, F.pct], ['haze', 'HAZE', 0.25, F.pct], ['width', 'WIDTH', 0.5, F.pct], ['type', 'TYPE', 0, F.pick(['CASSETTE', 'REEL', 'VHS'])], ['age', 'AGE', 0, F.pct], ['mix', 'MIX', 1, F.pct]],
            make(ctx) {
                let b = box(ctx), dl = ctx.createDelay(0.2), w1 = ctx.createOscillator(), w1g = b.g(0), w2 = ctx.createOscillator(), w2g = b.g(0), dn = ctx.createBufferSource(), dlp = bq(ctx, 'lowpass', 0.6, 0.5), dg = b.g(0);
                let sh = ctx.createWaveShaper(), lp = bq(ctx, 'lowpass', 12000, 0.5), hp = bq(ctx, 'highpass', 40, 0.5), cv = ctx.createConvolver(), hz = b.g(0), dry2 = b.g(1), sp = ctx.createChannelSplitter(2), mg = ctx.createChannelMerger(2), wd = ctx.createDelay(0.05), sum = b.g(1);
                let ns = ctx.createBufferSource(), nlp = bq(ctx, 'bandpass', 5000, 0.4), ng = b.g(0), P0 = null, lk = '';
                let bump = bq(ctx, 'peaking', 80, 1.2), box2 = bq(ctx, 'peaking', 1000, 0.9), dsrc = ctx.createBufferSource(), dsh = ctx.createWaveShaper(), dam = b.g(0), dgn = b.g(1); bump.gain.value = 0; box2.gain.value = 0;
                let wr = ctx.createOscillator(), wrg = b.g(0); wr.frequency.value = 0.37;
                let nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), nd = nb.getChannelData(0); noiseFill(nd, 1009);
                dl.delayTime.value = 0.03; w1.frequency.value = 0.55; w2.frequency.value = 7.3; w1.connect(w1g); w2.connect(w2g); w1g.connect(dl.delayTime); w2g.connect(dl.delayTime);
                dn.buffer = nb; dn.loop = true; dn.playbackRate.value = 0.25; dn.connect(dlp); dlp.connect(dg); dg.connect(dl.delayTime); ns.buffer = nb; ns.loop = true; ns.connect(nlp); nlp.connect(ng);
                cv.buffer = irBuf(ctx, { len: 1.6, decay: 2.5, dark: 0.55, kind: 0, size: 0.3 });
                b.in.connect(dl); dl.connect(sh); sh.connect(lp); lp.connect(hp); hp.connect(bump); bump.connect(box2); box2.connect(dgn); dgn.connect(dry2); dgn.connect(cv); cv.connect(hz); dry2.connect(sum); hz.connect(sum); ng.connect(sum);
                sum.connect(sp); sp.connect(mg, 0, 0); sp.connect(wd, 1); wd.connect(mg, 0, 1); mg.connect(b.wet);
                let sd = 777, rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; }, db = ctx.createBuffer(1, ctx.sampleRate * 8, ctx.sampleRate), dd = db.getChannelData(0), seg = Math.round(ctx.sampleRate / 4), pts = Array.from({ length: 33 }, () => rnd());
                pts[32] = pts[0]; for (let i = 0; i < dd.length; i++) { const k = Math.floor(i / seg), t = (i % seg) / seg, e = 0.5 - 0.5 * Math.cos(Math.PI * t); dd[i] = (pts[k] + (pts[k + 1] - pts[k]) * e) * 2 - 1; }
                dsrc.buffer = db; dsrc.loop = true; dsh.curve = curveOf(x => x > 0.55 ? -Math.min(1, (x - 0.55) * 4) : 0, 1024); dsrc.connect(dsh); dsh.connect(dam); dam.connect(dgn.gain);
                wr.connect(wrg); wrg.connect(wd.delayTime);
                [w1, w2, dn, ns, dsrc, wr].forEach(n => n.start()); let an = tap(ctx, b.wet, 1024);
                return { in: b.in, out: b.out,
                    set(p, now, info, skip) { P0 = p; let S2 = setter(ctx, now, skip), A = p.age, f = v => Math.min(1, v + A * (1 - v) * 0.7);
                        S2('wobble', w1g.gain, f(p.wobble) * 0.0035); S2('flutter', w2g.gain, f(p.flutter) * 0.0004); S2('drift', dg.gain, f(p.drift) * 0.006);
                        let k = Math.round(f(p.tape) * 40); if (k + '' !== lk) { lk = k + ''; let d = 1 + f(p.tape) * 4; sh.curve = curveOf(x => Math.tanh(x * d) / Math.tanh(d) * 0.95 + 0.04 * x * x * f(p.tape)); }
                        let ty = idx(p.type || 0, 3);
                        S2('blur', lp.frequency, expo([16000, 20000, 9000][ty], 1800, f(p.blur))); S2('hiss', ng.gain, f(p.hiss) * 0.035 * [1, 0.5, 1.8][ty]); S2('haze', hz.gain, f(p.haze) * 0.9); S2('haze', dry2.gain, 1 - f(p.haze) * 0.35);
                        bump.gain.value = [0, 2.5, 1][ty]; box2.gain.value = [0, 0, 3][ty]; nlp.frequency.value = [5000, 7000, 3500][ty]; S2('drop', dam.gain, f(p.drop || 0) * 0.85); wrg.gain.value = (p.width || 0) * 0.0012 * (0.3 + f(p.wobble));
                        wd.delayTime.value = 0.002 + p.width * 0.016; S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix); },
                    ap: { mix: mixAp(b) },
                    draw(x, w, h, D) { S.bg(x, w, h); let t = performance.now() / 1000, A = P0 ? P0.age : 0; for (let y = 0; y < h; y += 3) { let off = Math.sin(y * 0.13 + t * 3) * (P0 ? (P0.wobble + A) * 4 : 0); x.fillStyle = 'rgba(140,255,200,' + (0.03 + Math.random() * (P0 ? P0.hiss + A * 0.3 : 0) * 0.12) + ')'; x.fillRect(off, y, w, 1); }
                        S.spec(x, an, w, h, D.A); S.txt(x, '▶ PLAY  ' + (P0 ? ['SP', 'REEL', 'VHS'][idx(P0.type || 0, 3)] : 'SP') + '  ' + String(Math.floor(t / 60) % 60).padStart(2, '0') + ':' + String(Math.floor(t) % 60).padStart(2, '0'), 4, 10, D.A); },
                    kill: stopAll(b, [w1, w2, dn, ns, dsrc, wr]) };
            } },
        { id: 'cinder', jp: '燼', en: 'BURN PILE', sub: 'distortion chain: FUZZ, CRUSH, RING + CLIP. ORDER changes which comes first. CHAOS varies it on the beat. TONE + OUTPUT to tame it', face: 'char', part: 'nb_fx_cinder',
            p: [['fuzz', 'FUZZ', 0.4, F.pct], ['crush', 'CRUSH', 0.2, F.pct], ['ring', 'RING', 0, F.pct], ['clip', 'CLIP', 0.3, F.pct], ['order', 'ORDER', 0, F.pick(['FUZZ CRUSH RING', 'CRUSH FUZZ RING', 'RING FUZZ CRUSH'])], ['chaos', 'CHAOS', 0, F.pct], ['every', 'KICKED EVERY', 0.5, F.pick(['1/16', '1/8', '1/4', '1/2', '1 bar'])], ['tone', 'TONE', 0.55, v => v < 0.48 ? 'dark ' + Math.round((0.5 - v) * 200) : v > 0.52 ? 'bright ' + Math.round((v - 0.5) * 200) : 'flat'], ['out', 'OUTPUT', 0.6, F.db(-24, 6)], ['mix', 'MIX', 1, F.pct]],
            make(ctx) {
                let b = box(ctx), fz = ctx.createWaveShaper(), fzg = b.g(1), cr = ctx._nbwk ? wkNode(ctx, 'nb-crush', 2) : null, rm = b.g(1), ro = ctx.createOscillator(), rog = b.g(0), rd = b.g(1), cl = ctx.createWaveShaper(), tl = bq(ctx, 'lowshelf', 300), th = bq(ctx, 'highshelf', 3000), og = b.g(1), P0 = null, lk = '', bpm = 120, mods = { f: 0, c: 0, r: 0, k: 0 };
                fz.oversample = '4x'; cl.oversample = '4x'; ro.type = 'sine'; ro.frequency.value = 440; ro.connect(rog); rog.connect(rm.gain); ro.start();
                let rin = b.g(1), rsum = b.g(1), ord = -1; rin.connect(rm); rin.connect(rd); rm.connect(rsum); rd.connect(rsum); cl.connect(tl); tl.connect(th); th.connect(og); og.connect(b.wet);
                const ST = { F: [fzg, fz], C: cr ? [cr, cr] : null, R: [rin, rsum] };
                fzg.connect(fz);
                const cut = (a2, t) => { try { if (t) a2.disconnect(t); else a2.disconnect(); } catch (e) {} };
                const order = o => { if (o === ord) return; ord = o; [fzg, rin, cr].forEach(t => { if (t) cut(b.in, t); }); [fz, cr, rsum].forEach(nn => { if (nn) cut(nn); });
                    let seq = [['F', 'C', 'R'], ['C', 'F', 'R'], ['R', 'F', 'C']][o].map(k => ST[k]).filter(Boolean), prev = b.in; seq.forEach(([i2, o2]) => { prev.connect(i2); prev = o2; }); prev.connect(cl); };
                order(0); let an = tap(ctx, og, 1024);
                const build = p => { let F2 = Math.min(1, p.fuzz + mods.f), C = Math.min(1, p.clip + mods.k), d = 1 + F2 * 40, c2 = 1 + C * 12;
                    fz.curve = curveOf(x => { let y = x * d + F2 * 0.3; return Math.tanh(y) - Math.tanh(F2 * 0.3); }); cl.curve = curveOf(x => clamp(x * c2, -0.75, 0.75) / 0.75);
                    if (cr) { cr.parameters.get('bits').value = 16 - Math.min(1, p.crush + mods.c) * 13; cr.parameters.get('down').value = 1 + Math.pow(Math.min(1, p.crush + mods.c), 2) * 30; }
                    let R = Math.min(1, p.ring + mods.r); rm.gain.value = 0; rog.gain.value = R; rd.gain.value = 1 - R; };
                return { in: b.in, out: b.out, wk: !cr,
                    set(p, now, info, skip) { P0 = p; bpm = info.bpm; let S2 = setter(ctx, now, skip), k = ['fuzz', 'crush', 'ring', 'clip'].map(q => Math.round(p[q] * 60)).join(); if (k !== lk) { lk = k; build(p); } order(idx(p.order || 0, 3));
                        S2('tone', tl.gain, (0.5 - p.tone) * 18); S2('tone', th.gain, (p.tone - 0.5) * 18); S2('out', og.gain, db2g(-24 + p.out * 30) * 0.5); S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix); },
                    sched(b0, b1, tb) { if (!P0 || P0.chaos < 0.01) return; let st = [0.25, 0.5, 1, 2, 4][idx(P0.every, 5)];
                        for (let k = Math.ceil(b0 / st - 1e-9); k * st < b1; k++) { let h1 = hsh(k * 1.37), h2 = hsh(k * 2.11), h3 = hsh(k * 3.7), t = tb(k * st);
                            ro.frequency.setValueAtTime(60 + h1 * h1 * 2400, t); rog.gain.setValueAtTime(Math.min(1, P0.ring + (h2 > 0.6 ? P0.chaos * 0.8 : 0)), t); rd.gain.setValueAtTime(1 - Math.min(1, P0.ring + (h2 > 0.6 ? P0.chaos * 0.8 : 0)), t);
                            if (cr) { cr.parameters.get('down').setValueAtTime(1 + Math.pow(Math.min(1, P0.crush + (h3 > 0.5 ? P0.chaos * h3 : 0)), 2) * 30, t); }
                            fzg.gain.setValueAtTime(1 + (hsh(k * 5.3) > 0.5 ? P0.chaos * 2.5 : 0), t); } },
                    rest() { fzg.gain.setTargetAtTime(1, ctx.currentTime, 0.01); },
                    ap: { mix: mixAp(b) },
                    draw(x, w, h, D) { S.bg(x, w, h); if (!P0) return; let lv = an ? S.meter(x, an) : 0.5; this._l = Math.max(lv, (this._l || 0) * 0.9); let names = [['FUZZ', P0.fuzz], ['CRUSH', P0.crush], ['RING', P0.ring]], seq = [[0, 1, 2], [1, 0, 2], [2, 0, 1]][idx(P0.order || 0, 3)];
                        seq.map(i2 => names[i2]).concat([['CLIP', P0.clip]]).forEach(([nm, v], i) => { let X0 = 6 + i * (w - 12) / 4, bw = (w - 12) / 4 - 6, fl = Math.min(1, v * (0.35 + Math.min(1, this._l * 2.5)) * (1 + P0.chaos * 0.3 * Math.sin(D.now * 9 + i))); x.fillStyle = 'rgba(255,120,60,0.15)'; x.fillRect(X0, 16, bw, h - 30);
                        let g = x.createLinearGradient(0, h - 14, 0, 16); g.addColorStop(0, '#ff3a10'); g.addColorStop(1, '#ffd23b'); x.fillStyle = g; x.fillRect(X0, h - 14 - fl * (h - 30), bw, fl * (h - 30)); S.txt(x, nm, X0, h - 3, '#ffb070'); });
                        S.txt(x, P0.chaos > 0.01 ? 'CHAOS ' + Math.round(P0.chaos * 100) + '%' : 'BURNING', 4, 10, '#ff9a60'); },
                    kill: () => { bury([cr]); stopAll(b, [ro])(); } };
            } },
        // makes stuff sound like its talking. creepy, love it
        { id: 'maw', jp: '口', en: 'MAW', sub: 'formant filter. MOUTH sweeps the vowels, CHEW does it in time, HUNGER opens with how hard you play, THROAT sets the size, SINK adds an octave under, GROWL adds rasp, WIDTH splits it across the stereo', face: 'throat', part: 'nb_fx_maw',
            p: [['mouth', 'MOUTH', 0.3, F.pick(['oo', 'oh', 'ah', 'eh', 'ee'])], ['chew', 'CHEW', 0, F.pick(['off', '1/16', '1/8', '1/4', '1/2', '1 bar'])], ['depth', 'CHEW HOW FAR', 0.6, F.pct], ['hunger', 'HUNGER', 0.3, F.pct], ['throat', 'THROAT', 0.5, v => v < 0.4 ? 'huge' : v > 0.6 ? 'small' : 'middling'], ['sink', 'SINK', 0, F.pct], ['growl', 'GROWL', 0.2, F.pct], ['width', 'WIDTH', 0, F.pct], ['mix', 'MIX', 1, F.pct]],
            make(ctx) {
                const VW = [[300, 870, 2240], [430, 820, 2400], [730, 1090, 2440], [530, 1840, 2480], [270, 2290, 3010]];
                let b = box(ctx), pre = ctx.createWaveShaper(), sum = b.g(1), bands = [], fo = ctx._nbwk ? wkNode(ctx, 'nb-follow', 1) : null, fg = b.g(0), ps = ctx._nbwk ? wkNode(ctx, 'nb-pitch', 2) : null, sk = b.g(0), P0 = null, bpm = 120, lk = '', pos = 0.3;
                let pin = b.g(1), psp = ctx.createChannelSplitter(2), pmg = ctx.createChannelMerger(2), sL = b.g(1), sR = b.g(1), bands2 = [], wid = 0;
                pre.oversample = '2x'; b.in.connect(pin); pin.channelCount = 2; pin.channelCountMode = 'explicit'; pin.connect(pre); pre.connect(psp); sL.connect(pmg, 0, 0); sR.connect(pmg, 0, 1); pmg.connect(sum);
                for (let i = 0; i < 5; i++) { let bp = bq(ctx, 'bandpass', 500 * (i + 1), 6), g = b.g([1, 0.7, 0.4, 0.25, 0.15][i] * 1.75), bp2 = bq(ctx, 'bandpass', 500 * (i + 1), 6), g2 = b.g([1, 0.7, 0.4, 0.25, 0.15][i] * 1.75);
                    psp.connect(bp, 0); bp.connect(g); g.connect(sL); bands.push(bp); psp.connect(bp2, 1); bp2.connect(g2); g2.connect(sR); bands2.push(bp2); }
                if (fo) { b.in.connect(fo); fo.connect(fg); bands.slice(0, 2).concat(bands2.slice(0, 2)).forEach(bp => fg.connect(bp.frequency)); }
                if (ps) { ps.parameters.get('shift').value = -12; sum.connect(ps); ps.connect(sk); sk.connect(b.wet); }
                sum.connect(b.wet); let an = tap(ctx, sum, 512);
                const freqs = (v, th) => { let x = v * 4, i = Math.min(3, Math.floor(x)), f = x - i, sc = 1.35 - th * 0.7; return [0, 1, 2].map(k => (VW[i][k] + (VW[i + 1][k] - VW[i][k]) * f) * sc).concat([3300 * sc, 4200 * sc]); };
                const put = (v, t, tc) => { let fs = freqs(v, P0 ? P0.throat : 0.5), k2 = 1 + wid * 0.09; bands.forEach((bp, i) => { if (t == null) bp.frequency.value = fs[i]; else bp.frequency.setTargetAtTime(fs[i], t, tc); });
                    bands2.forEach((bp, i) => { if (t == null) bp.frequency.value = fs[i] * k2; else bp.frequency.setTargetAtTime(fs[i] * k2, t, tc); }); };
                return { in: b.in, out: b.out, wk: !fo,
                    set(p, now, info, skip) { P0 = p; bpm = info.bpm; let S2 = setter(ctx, now, skip), k = Math.round(p.growl * 50) + ''; if (k !== lk) { lk = k; let d = 1 + p.growl * 10; pre.curve = curveOf(x => Math.tanh(x * d + p.growl * 0.4 * x * x) / Math.tanh(d)); }
                        pos = p.mouth; wid = p.width || 0; if (idx(p.chew, 6) === 0) put(p.mouth); S2('hunger', fg.gain, p.hunger * 1800); S2('sink', sk.gain, p.sink * 1.2); S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix); },
                    sched(b0, b1, tb) { if (!P0) return; let ch = idx(P0.chew, 6); if (!ch) return; let st = [0, 0.25, 0.5, 1, 2, 4][ch];
                        for (let k = Math.ceil(b0 / st - 1e-9); k * st < b1; k++) { let v = clamp(P0.mouth + (hsh(k * 1.91) - 0.5) * 2 * P0.depth, 0, 1); put(v, tb(k * st), st * 60 / bpm * 0.25); } },
                    rest() { if (P0) put(P0.mouth); },
                    ap: { mix: mixAp(b) },
                    draw(x, w, h, D) { x.fillStyle = '#0d0204'; x.fillRect(0, 0, w, h); if (!P0) return;
                        let lv = an ? S.meter(x, an) : 0; this._l = Math.max(lv, (this._l || 0) * 0.9);
                        let q = this._q, m = this._m, ph = this._ph; if (!q || q.length !== w) { q = this._q = new Float32Array(w); m = this._m = new Float32Array(w); ph = this._ph = new Float32Array(w); for (let i = 0; i < w; i++) q[i] = 80 * Math.pow(70, i / (w - 1)); }
                        let tot = new Float32Array(w); bands.forEach((bp, k) => { bp.getFrequencyResponse(q, m, ph); let gk = [1, 0.7, 0.4, 0.25, 0.15][k]; for (let i = 0; i < w; i++) tot[i] += m[i] * gk; });
                        let sw = 0.55 + Math.min(0.6, this._l * 2.5), base = h - 4, pts = [];
                        for (let i = 0; i < w; i++) pts.push([i, base - Math.min(1, tot[i] / 1.1) * (h - 22) * sw]);
                        let g = x.createLinearGradient(0, 14, 0, h); g.addColorStop(0, 'rgba(255,70,95,0.75)'); g.addColorStop(0.55, 'rgba(120,8,24,0.75)'); g.addColorStop(1, 'rgba(30,0,6,0.9)');
                        x.beginPath(); x.moveTo(0, base); pts.forEach(p => x.lineTo(p[0], p[1])); x.lineTo(w, base); x.closePath(); x.fillStyle = g; x.fill();
                        x.strokeStyle = '#ffb0bc'; x.lineWidth = 1.4; x.shadowColor = '#ff3355'; x.shadowBlur = 8 + this._l * 20; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke(); x.shadowBlur = 0;
                        x.strokeStyle = 'rgba(255,235,240,0.45)'; x.lineWidth = 0.8; x.beginPath(); pts.forEach((p, i) => { let y = p[1] + 3; i ? x.lineTo(p[0], y) : x.moveTo(p[0], y); }); x.stroke();
                        S.txt(x, ['oo', 'oh', 'ah', 'eh', 'ee'][idx(P0.mouth, 5)] + (idx(P0.chew, 6) ? ' · chewing' : '') + (P0.sink > 0.02 ? ' · sinking' : ''), 5, 11, '#ffc8d0', 10); },
                    kill: () => { bury([fo, ps]); stopAll(b)(); } };
            } },
        { id: 'shroud', jp: '帷', en: 'SHROUD', part: 'nb_fx_shroud', sub: 'gated reverb. the big 80s snare. HOLD = how long before it cuts',
            p: [['hold', 'HOLD', 0.35, F.ms(0.06, 0.8)], ['shape', 'SHAPE', 0.5, F.pick(['FALLING', 'FLAT', 'RISING'])], ['pre', 'PRE', 0.15, F.ms(0, 0.06)], ['tone', 'TONE', 0.65, F.hz(1500, 16000)], ['wid', 'SPREAD', 0.8, F.pct], ['mix', 'MIX', 0.45, F.pct]],
            make(ctx) {
                let b = box(ctx), cv = ctx.createConvolver(), lp = bq(ctx, 'lowpass', 9000, -3.01), hp = bq(ctx, 'highpass', 180, -3.01), P0 = null, lk = '';
                cv.normalize = false; b.in.connect(hp); hp.connect(cv); cv.connect(lp); lp.connect(b.wet);
                const make = (hold, shape, pre, wid) => { let sr = ctx.sampleRate, H = 0.06 + hold * 0.74, P = pre * 0.06, N = Math.floor(sr * (P + H + 0.005)), buf = ctx.createBuffer(2, N, sr), seed = 4421;
                    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
                    let L = buf.getChannelData(0), R = buf.getChannelData(1), p0 = Math.floor(sr * P), n = N - p0, fd = Math.floor(sr * 0.004), sc = 0.9 / Math.sqrt(sr * H * 0.35);
                    for (let i = 0; i < n; i++) { let u = i / n, e = shape === 0 ? Math.pow(0.08, u) : shape === 1 ? 1 : 0.15 + 0.85 * u * u; if (i > n - fd) e *= (n - i) / fd; if (i < 48) e *= i / 48; let a = rnd() * 2 - 1, c2 = rnd() * 2 - 1; L[p0 + i] = a * e * sc; R[p0 + i] = (c2 * wid + a * (1 - wid)) * e * sc; }
                    return buf; };
                return { in: b.in, out: b.out,
                    set(p, now, info, skip) { P0 = p; let S2 = setter(ctx, now, skip), sh = idx(p.shape, 3), k = Math.round(p.hold * 40) + ':' + sh + ':' + Math.round(p.pre * 20) + ':' + Math.round(p.wid * 10); if (k !== lk) { lk = k; cv.buffer = make(p.hold, sh, p.pre, p.wid); }
                        S2('tone', lp.frequency, expo(1500, 16000, p.tone)); S2('mix', b.wet.gain, p.mix * 1.4); S2('mix', b.dry.gain, 1 - p.mix * 0.3); },
                    ap: { mix: [[b.wet.gain, v => v * 1.4], [b.dry.gain, v => 1 - v * 0.3]] },
                    draw(x, w, h, D) { S.bg(x, w, h); if (!P0 || !cv.buffer) return; let d = cv.buffer.getChannelData(0), n = d.length, pts = []; for (let X0 = 0; X0 < w; X0++) { let i0 = Math.floor(X0 / w * n), i1 = Math.floor((X0 + 1) / w * n), m = 0; for (let j = i0; j < i1; j += 2) m = Math.max(m, Math.abs(d[j])); pts.push([X0, h - 6 - Math.min(1, m * 6) * (h - 16)]); }
                        S.line(x, pts, D.A, 1.2); S.txt(x, ['FALLING', 'FLAT', 'RISING'][idx(P0.shape, 3)] + ' · ' + Math.round((0.06 + P0.hold * 0.74) * 1000) + 'ms', 4, 10, D.A); },
                    kill: () => { stopAll(b)(); } };
            } },
        { id: 'pocket', jp: '懐', en: 'POCKET', sub: 'small rooms: jar, pipe, locker + more. WHERE picks the space, SIZE, HANG, TONE', face: 'jar', part: 'nb_fx_pocket',
            p: [['mode', 'WHERE', 0, F.pick(PKN)], ['size', 'SIZE', 0.5, F.pct], ['hang', 'HANG', 0.5, F.pct], ['tone', 'TONE', 0.5, v => v < 0.48 ? 'dark' : v > 0.52 ? 'bright' : 'flat'], ['twist', 'TWIST', 0.5, v => { let n = Math.round((v - 0.5) * 24); return (n > 0 ? '+' : '') + n + 'st'; }], ['mix', 'MIX', 0.5, F.pct]],
            ver: 2, fix(p) { if ((p._v || 1) < 2) { if (p.mode != null) p.mode = (Math.min(5, Math.floor(p.mode * 6)) + 0.5) / PKN.length; p._v = 2; } return p; },
            make(ctx) {
                let b = box(ctx), cv = ctx.createConvolver(), ps = ctx._nbwk ? wkNode(ctx, 'nb-pitch', 2) : null, tl = bq(ctx, 'lowshelf', 400), th = bq(ctx, 'highshelf', 3000), vg = b.g(1), P0 = null, lk = '';
                b.in.connect(cv); let n = cv; if (ps) { cv.connect(ps); n = ps; } n.connect(tl); tl.connect(th); th.connect(vg); vg.connect(b.wet);
                const make = (mode, size, hang) => { let sr = ctx.sampleRate, hg = 0.4 + hang * 1.2, len = [0.25, 0.9, 1.2, 0.6, 2.2, 0.3, 1.6, 0.18, 0.9][mode] * (0.5 + size) * hg, N = Math.floor(sr * len), buf = ctx.createBuffer(2, N, sr);
                    let seed = 1 + mode * 7919; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
                    for (let c = 0; c < 2; c++) { let d = buf.getChannelData(c);
                        if (mode === 0) for (let i = 0; i < N; i++) d[i] = (rnd() * 2 - 1) * Math.exp(-i / (sr * 0.05 * (0.5 + size))) * 0.6;
                        if (mode === 1 || mode === 4) { let ms = mode === 1 ? [410, 1130, 2240, 3870] : [523, 1046, 1569, 2637, 3729, 5274]; ms.forEach((f, k) => { let ff = f * (1.4 - size * 0.8) * (1 + c * 0.003), dec = (mode === 4 ? 1.4 : 0.35) * (1 + size) / (k + 1) ** 0.5; for (let i = 0; i < N; i++) d[i] += Math.sin(2 * Math.PI * ff * i / sr) * Math.exp(-i / (sr * dec)) * 0.12 / (k + 1) ** 0.3; });
                            for (let i = 0; i < Math.min(N, sr * 0.02); i++) d[i] += (rnd() * 2 - 1) * 0.3 * (1 - i / (sr * 0.02)); }
                        if (mode === 2) { let tap = Math.floor(sr * (0.004 + size * 0.012)); for (let i = 0; i < N; i += tap) for (let j = 0; j < 30 && i + j < N; j++) d[i + j] += (rnd() * 2 - 1) * Math.exp(-i / (sr * 0.4 * (0.5 + size))) * 0.5 * (1 - j / 30); }
                        if (mode === 3) { let D2 = Math.floor(sr * (0.0021 + c * 0.0003) * (0.6 + size)), D3 = Math.floor(sr * 0.0037 * (0.6 + size)); for (let i = 0; i < N; i++) d[i] = (i < 40 ? rnd() * 2 - 1 : 0) + (i >= D2 ? d[i - D2] * 0.82 : 0) - (i >= D3 ? d[i - D3] * 0.3 : 0); for (let i = 0; i < N; i++) d[i] *= Math.exp(-i / (sr * 0.15)) * 0.4; }
                        if (mode === 5) { [[700, 80], [1200, 120], [2600, 200]].forEach(([f, bw]) => { let ff = f * (1.3 - size * 0.6); for (let i = 0; i < N; i++) d[i] += Math.sin(2 * Math.PI * ff * i / sr) * Math.exp(-i * Math.PI * bw / sr) * 0.3 / hg; }); }
                        if (mode === 6) { let tl = 0.9 * (0.5 + size) * hg, gap = Math.floor(sr * (0.011 + size * 0.006) * (1 + c * 0.04)); for (let i = 0; i < N; i++) d[i] = (rnd() * 2 - 1) * Math.exp(-i / (sr * tl * 0.3)) * 0.35;
                            for (let i = gap, a = 0.7; i < N; i += gap, a *= 0.86) for (let j = 0; j < 24 && i + j < N; j++) d[i + j] += (rnd() * 2 - 1) * a * (1 - j / 24) * 0.6; }
                        if (mode === 7) { for (let i = 0; i < N; i++) d[i] = (rnd() * 2 - 1) * Math.exp(-i / (sr * 0.012 * hg)) * 0.7; [[120, 0.05], [310, 0.03], [640, 0.02]].forEach(([fq, dc]) => { let ff = fq * (1.3 - size * 0.6) * (1 + c * 0.01); for (let i = 0; i < N; i++) d[i] += Math.sin(2 * Math.PI * ff * i / sr) * Math.exp(-i / (sr * dc * hg)) * 0.25; }); }
                        if (mode === 8) { for (let i = 0; i < N; i++) { let e = Math.exp(-i / (sr * 0.22 * (0.5 + size) * hg)); d[i] = (rnd() * 2 - 1) * e * 0.4; }
                            [0.0031, 0.0047, 0.0063, 0.0088, 0.0117].forEach((t0, k) => { let at = Math.floor(sr * t0 * (0.6 + size) * (1 + c * 0.05)); for (let j = 0; j < 12 && at + j < N; j++) d[at + j] += (k % 2 ? -1 : 1) * 0.5 * (1 - j / 12) / (1 + k * 0.3); }); }
                    } return buf; };
                return { in: b.in, out: b.out, wk: !ps,
                    set(p, now, info, skip) { P0 = p; let S2 = setter(ctx, now, skip), hang = p.hang == null ? 0.5 : p.hang, k = idx(p.mode, PKN.length) + ':' + Math.round(p.size * 20) + ':' + Math.round(hang * 20); if (k !== lk) { lk = k; cv.buffer = make(idx(p.mode, PKN.length), p.size, hang); }
                        if (ps) ps.parameters.get('shift').value = Math.round((p.twist - 0.5) * 24); S2('tone', tl.gain, (0.5 - p.tone) * 14); S2('tone', th.gain, (p.tone - 0.5) * 14); S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix * 0.6); },
                    ap: { mix: [[b.wet.gain, v => v], [b.dry.gain, v => 1 - v * 0.6]] },
                    draw(x, w, h, D) { S.bg(x, w, h); if (!P0 || !cv.buffer) return; let d = cv.buffer.getChannelData(0), n = d.length, pts = []; for (let X0 = 0; X0 < w; X0++) { let i = Math.floor(X0 / w * n), m = 0; for (let j = 0; j < n / w; j += 4) m = Math.max(m, Math.abs(d[i + j] || 0)); pts.push([X0, h / 2 - m * h * 0.8]); }
                        S.line(x, pts, D.A, 1.2); S.txt(x, PKN[idx(P0.mode, PKN.length)], 4, 10, D.A); },
                    kill: () => { bury([ps]); stopAll(b)(); } };
            } },
        { id: 'back', jp: '逆', en: 'BACKWARDS', sub: 'reverse echo. ECHO = the repeats come back reversed. SWELL = a reverse reverb that swells into each hit. good on vocals + snares', face: 'velvet', part: 'nb_fx_back',
            p: [['mode', 'KIND', 0, F.pick(['ECHO', 'SWELL'])], ['len', 'SLICE', 0.4, F.pick(['1/8', '1/4', '1/2', '1 bar', '2 bars'])], ['fb', 'AGAIN', 0.3, F.pct], ['xf', 'SMOOTH', 0.3, F.pct], ['tone', 'TONE', 0.7, F.hz(400, 18000)], ['mix', 'MIX', 0.5, F.pct]],
            idle(p) { return idx(p.mode || 0, 2) ? { fb: 'SWELL plays once', xf: 'SWELL is all swell' } : {}; },
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-back') : null, lp = bq(ctx, 'lowpass', 12000, 0.7), P0 = null, fd = null, eg = b.g(1), cv = ctx.createConvolver(), sg = b.g(0), sk = '';
                if (w) { b.in.connect(w); w.connect(eg); } else { fd = ctx.createDelay(4); b.in.connect(fd); fd.connect(eg); }
                b.in.connect(cv); cv.connect(sg); eg.connect(lp); sg.connect(lp);
                lp.connect(b.wet);
                return { in: b.in, out: b.out, wk: !w,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), sec = [0.5, 1, 2, 4, 8][idx(p.len, 5)] * 60 / info.bpm, sw = idx(p.mode || 0, 2), kk = sw ? Math.round(Math.min(4, sec) * 100) + ':' + Math.round(p.tone * 10) : '';
                        if (sw && kk !== sk) { sk = kk; let ir = irBuf(ctx, { kind: 3, len: Math.min(4, sec), decay: 2.4, dark: 0.3, size: 0.7 }); for (let c = 0; c < ir.numberOfChannels; c++) ir.getChannelData(c).reverse(); cv.buffer = ir; }
                        S2('mode', eg.gain, sw ? 0 : 1); S2('mode', sg.gain, sw ? 1.4 : 0);
                        if (w) { w.parameters.get('len').value = Math.min(3.9, sec); S2('fb', w.parameters.get('fb'), p.fb * 0.9); w.parameters.get('xf').value = 0.02 + p.xf * 0.45; } else fd.delayTime.value = Math.min(3.9, sec);
                        S2('tone', lp.frequency, expo(400, 18000, p.tone)); S2('mix', b.wet.gain, p.mix * 1.2); S2('mix', b.dry.gain, 1 - p.mix * 0.5);
                    },
                    ap: { tone: [[lp.frequency, v => expo(400, 18000, v)]], mix: [[b.wet.gain, v => v * 1.2], [b.dry.gain, v => 1 - v * 0.5]] },
                    draw(x, w2, h, D) {
                        x.fillStyle = '#12051a'; x.fillRect(0, 0, w2, h); if (!P0) return;
                        let pts = [], k = 5; for (let i = 0; i < w2; i++) { let u = (i / w2 * k) % 1, env = Math.pow(u, 2.2) * (1 - Math.pow(u, 30)); pts.push([i, h / 2 + Math.sin(i * 0.9 + D.now * 6) * env * (h / 2 - 8)]); }
                        S.line(x, pts, '#d8a0ff', 1.3); S.txt(x, '◀◀ ' + (idx(P0.mode || 0, 2) ? 'SWELL ' : '') + ['1/8', '1/4', '1/2', '1 BAR', '2 BARS'][idx(P0.len, 5)] + (w || idx(P0.mode || 0, 2) ? '' : ' (plain echo, no worklet)'), 6, 11, '#f2d8ff');
                    },
                    kill: stopAll(b) };
            } },
        // granular! chops your sound into tiny bits and sprays them around
        { id: 'dust', jp: '塵', en: 'DUST', sub: 'granular. sprays tiny grains of the input. WHERE = how far back (up to 3s), DETUNE, SHAPE, WIDTH. FREEZE holds the cloud. turns a stab into a pad', face: 'mist', part: 'nb_fx_dust',
            p: [['size', 'GRAIN', 0.3, F.ms(0.005, 0.5, 1.6)], ['dens', 'DENSITY', 0.4, v => Math.round(0.5 + Math.pow(v, 1.5) * 79.5) + '/s'], ['pitch', 'PITCH', 0.5, v => { let s = Math.round(v * 48) - 24; return (s > 0 ? '+' : '') + s + 'st'; }], ['det', 'DETUNE', 0, v => '±' + Math.round(v * 100) + 'c'], ['spray', 'SCATTER', 0.3, F.pct], ['pos', 'WHERE', 0, v => v < 0.01 ? 'just now' : (v * 2.5).toFixed(1) + 's back'], ['rev', 'BACKWARDS', 0, F.pct],
                ['shape', 'SHAPE', 0, F.pick(['SMOOTH', 'FLAT', 'SHARP', 'SWELL'])], ['width', 'WIDTH', 0.5, F.pct], ['freeze', 'FREEZE', 0, F.pick(['off', 'HOLD'])], ['tone', 'TONE', 0.75, F.hz(400, 18000)], ['mix', 'MIX', 0.5, F.pct]],
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-grain') : null, lp = bq(ctx, 'lowpass', 12000, 0.7), P0 = null, seeds = [];
                for (let i = 0; i < 90; i++) seeds.push([Math.random(), Math.random(), Math.random()]);
                if (w) { b.in.connect(w); w.connect(lp); lp.connect(b.wet); }
                return { in: b.in, out: b.out, wk: !w,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip);
                        if (w) { let Q = n => w.parameters.get(n); Q('size').value = 0.005 + Math.pow(p.size, 1.6) * 0.495; Q('dens').value = 0.5 + Math.pow(p.dens, 1.5) * 79.5; Q('pitch').value = Math.round(p.pitch * 48) - 24; Q('spray').value = p.spray; Q('rev').value = p.rev; Q('freeze').value = p.freeze >= 0.5 ? 1 : 0;
                            Q('shape').value = idx(p.shape || 0, 4); Q('det').value = (p.det || 0) * 100; Q('width').value = p.width == null ? 0.5 : p.width; Q('pos').value = p.pos || 0; }
                        S2('tone', lp.frequency, expo(400, 18000, p.tone)); S2('mix', b.wet.gain, w ? p.mix : 0); S2('mix', b.dry.gain, w ? 1 - p.mix * 0.6 : 1);
                    },
                    ap: { tone: [[lp.frequency, v => expo(400, 18000, v)]], mix: [[b.wet.gain, v => v], [b.dry.gain, v => 1 - v * 0.6]] },
                    draw(x, w2, h, D) {
                        x.fillStyle = 'rgba(16,14,24,0.5)'; x.fillRect(0, 0, w2, h); if (!P0) return;
                        let n = Math.round(10 + P0.dens * 80), fr = P0.freeze >= 0.5, pos = P0.pos || 0, sh = idx(P0.shape || 0, 4), det = P0.det || 0;
                        x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(w2 * (1 - pos) - w2 * 0.12, 14, w2 * 0.12 + w2 * P0.spray * 0.5, h - 16);
                        for (let i = 0; i < n; i++) { let s = seeds[i % 90], drift = fr ? 0 : (D.now * (20 + s[2] * 40) * (s[1] < P0.rev ? -1 : 1)) % (w2 * 0.3), X0 = w2 * (1 - pos) - s[0] * (0.1 + P0.spray * 0.6) * w2 + drift * 0.2, Y = h / 2 + (s[1] - 0.5) * det * h * 0.8 - (P0.pitch - 0.5) * h * 0.6, sz = 1.5 + P0.size * 5;
                            x.fillStyle = 'rgba(220,210,255,' + (0.3 + s[2] * 0.6) + ')'; if (sh === 2) { x.fillRect(X0, Y - sz, 1.5, sz * 2); x.fillRect(X0, Y - 0.5, sz * 1.5, 1); } else if (sh === 3) { x.fillRect(X0 + sz * 1.5, Y - sz, 1.5, sz * 2); x.fillRect(X0, Y - 0.5, sz * 1.5, 1); } else x.fillRect(X0, Y - sz / 2, sh === 1 ? sz * 1.6 : sz, sz); }
                        S.txt(x, (w ? '' : 'needs the worklet, this browser has none · ') + ['SMOOTH', 'FLAT', 'SHARP', 'SWELL'][sh] + (fr ? ' · FROZEN' : ''), 6, 11, '#e0d8ff');
                    },
                    kill: stopAll(b) };
            } },
        { id: 'stutter', jp: '吃', en: 'STUTTER', sub: 'beat repeat. at the end of every 1, 2 or 4 bars it may REPEAT, REVERSE, SCRAMBLE or TAPE STOP a slice. PITCH steps each repeat up or down, GATE shortens them', face: 'grit', part: 'nb_fx_stutter',
            p: [['mode', 'DOES', 0, F.pick(['REPEAT', 'REVERSE', 'SCRAMBLE', 'TAPE STOP'])], ['chance', 'CHANCE', 0.5, F.pct], ['slice', 'SLICE', 0.25, F.pick(['1/32', '1/16', '1/8', '1/4', '1/2'])], ['every', 'EVERY', 0.3, F.pick(['1/2 bar', '1 bar', '2 bars', '4 bars'])], ['len', 'HOW MUCH', 0.25, F.pct], ['decay', 'FADE', 0, F.pct],
                ['pitch', 'PITCH', 0.5, v => { let n = Math.round((v - 0.5) * 24); return (n > 0 ? '+' : '') + n + 'st'; }], ['gate', 'GATE', 1, v => Math.round(25 + v * 75) + '%'], ['mix', 'MIX', 1, F.pct]],
            idle(p) { return idx(p.mode, 4) === 3 ? { pitch: 'the TAPE STOP falls on its own', gate: 'the TAPE STOP runs out on its own' } : {}; },
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-stut') : null, P0 = null, sig = 4, bpm = 120;
                if (w) { b.in.connect(w); w.connect(b.wet); } else b.in.connect(b.wet);
                const Q = n => w.parameters.get(n);
                return { in: b.in, out: b.out, wk: !w,
                    set(p, now, info, skip) {
                        P0 = p; sig = info.sig || 4; bpm = info.bpm; let S2 = setter(ctx, now, skip);
                        if (w) { Q('mode').value = idx(p.mode, 4); Q('chance').value = p.chance; Q('slice').value = [0.125, 0.25, 0.5, 1, 2][idx(p.slice, 5)]; Q('every').value = [0.5, 1, 2, 4][idx(p.every, 4)] * sig; Q('len').value = p.len; Q('decay').value = p.decay; Q('spb').value = 60 / bpm; Q('pitch').value = Math.round(((p.pitch == null ? 0.5 : p.pitch) - 0.5) * 24); Q('gate').value = 0.25 + (p.gate == null ? 1 : p.gate) * 0.75; }
                        S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix);
                    },
                    sched(b0, b1, tb) { if (!w) return; let t = tb(b0); Q('aT').setValueAtTime(t, t); Q('aB').setValueAtTime(b0, t); Q('spb').setValueAtTime((tb(b1) - t) / Math.max(1e-6, b1 - b0), t); Q('run').setValueAtTime(1, t); },
                    rest() { if (w) { Q('run').cancelScheduledValues(ctx.currentTime); Q('run').setValueAtTime(0, ctx.currentTime); } },
                    ap: { mix: mixAp(b) },
                    draw(x, w2, h, D) {
                        S.bg(x, w2, h); if (!P0) return;
                        let ev = [0.5, 1, 2, 4][idx(P0.every, 4)] * sig, span = ev * 2, len = P0.len;
                        for (let r = 0; r < 2; r++) { let X0 = r * w2 / 2, ww = w2 / 2; x.fillStyle = 'rgba(255,255,255,0.06)'; x.fillRect(X0 + 2, 20, ww - 4, h - 30); x.fillStyle = D.A; x.globalAlpha = 0.3 + P0.chance * 0.6; x.fillRect(X0 + ww * (1 - len), 20, ww * len - 2, h - 30); x.globalAlpha = 1; }
                        if (D.playing) { x.fillStyle = '#fff'; x.fillRect((D.pos % span) / span * w2, 16, 1.5, h - 20); }
                        S.txt(x, ['REPEAT', 'REVERSE', 'SCRAMBLE', 'TAPE STOP'][idx(P0.mode, 4)] + ' · ' + Math.round(P0.chance * 100) + '% · every ' + ['1/2 bar', 'bar', '2 bars', '4 bars'][idx(P0.every, 4)] + (w ? '' : ' (no worklet)'), 6, 11, D.A);
                    },
                    kill: stopAll(b) };
            } },
        { id: 'ring', jp: '鳴', en: 'RING', sub: 'ring mod. metal, bells, robots', face: 'chrome',
            p: [['mode', 'KIND', 0, F.pick(['RING', 'AM', 'BOTH'])], ['freq', 'TONE', 0.45, F.hz(5, 5000)], ['key', 'KEY', 0, F.pick(['free', 'root', '5th', 'octave', '2 oct'])], ['shape', 'WAVE', 0, F.pick(['sine', 'square', 'tri', 'saw'])], ['rate', 'WOBBLE', 0, F.pick(SYNC.map(s => s[0]))], ['amt', 'WOBBLE AMT', 0.3, F.pct], ['spread', 'SPREAD', 0, v => '±' + Math.round(v * 30) + 'c'], ['drift', 'DRIFT', 0, F.pct], ['mix', 'MIX', 0.6, F.pct]],
            make(ctx) {
                let b = box(ctx), inn = b.g(1), sp = ctx.createChannelSplitter(2), mg = ctx.createChannelMerger(2), vL = b.g(0), vR = b.g(0), o = ctx.createOscillator(), oR = ctx.createOscillator(), og = b.g(1), ogR = b.g(1), lfo = ctx.createOscillator(), lg = b.g(0), P0 = null, f0 = 440;
                let wn = ctx.createBufferSource(), wb = ctx.createBuffer(1, ctx.sampleRate * 8, ctx.sampleRate), wd = wb.getChannelData(0), dgn = b.g(0), seed = 7, v = 0, tv = 0;
                for (let i = 0; i < wd.length; i++) { if (i % 4000 === 0) { seed = (seed * 16807) % 2147483647; tv = seed / 2147483647 * 2 - 1; } v += (tv - v) * 0.0004; wd[i] = v; }
                wn.buffer = wb; wn.loop = true; wn.connect(dgn); dgn.connect(o.detune); dgn.connect(oR.detune);
                inn.channelCount = 2; inn.channelCountMode = 'explicit'; b.in.connect(inn); inn.connect(sp); sp.connect(vL, 0); sp.connect(vR, 1); vL.connect(mg, 0, 0); vR.connect(mg, 0, 1); mg.connect(b.wet);
                o.connect(og); og.connect(vL.gain); oR.connect(ogR); ogR.connect(vR.gain); lfo.connect(lg); lg.connect(o.detune); lg.connect(oR.detune); o.start(); oR.start(); lfo.start(); wn.start();
                const vca = { gain: { set value(x) { vL.gain.value = x; vR.gain.value = x; } } };
                return { in: b.in, out: b.out,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), k = idx(p.key, 5), m = idx(p.mode, 3);
                        f0 = k ? 440 * Math.pow(2, (36 + rootOf(info) - 69) / 12) * [1, 1, 1.5, 2, 4][k] * Math.pow(2, Math.round((p.freq - 0.45) * 6)) : expo(5, 5000, p.freq);
                        S2('freq', o.frequency, f0); S2('freq', oR.frequency, f0); o.type = oR.type = ['sine', 'square', 'triangle', 'sawtooth'][idx(p.shape, 4)];
                        vca.gain.value = m === 0 ? 0 : m === 1 ? 0.6 : 0.3; og.gain.value = ogR.gain.value = m === 1 ? 0.4 : m === 2 ? 0.7 : 1;
                        S2('spread', o.detune, -(p.spread || 0) * 30); S2('spread', oR.detune, (p.spread || 0) * 30); S2('drift', dgn.gain, (p.drift || 0) * 150);
                        let beats = SYNC[idx(p.rate, SYNC.length)][1]; if (beats) { lfo.frequency.value = info.bpm / 60 / beats; S2('amt', lg.gain, p.amt * 1200); } else lg.gain.value = 0;
                        S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix);
                    },
                    ap: { freq: [[o.frequency, v => expo(5, 5000, v)], [oR.frequency, v => expo(5, 5000, v)]], amt: [[lg.gain, v => v * 1200]], mix: mixAp(b) },
                    draw(x, w2, h, D) {
                        S.bg(x, w2, h); if (!P0) return;
                        let pts = [], pts2 = []; for (let i = 0; i < w2; i++) { let u = i / w2, c = Math.sin(u * 6.283 * Math.min(40, 2 + f0 / 60) + D.now * 3), s = Math.sin(u * 6.283 * 3 + D.now); pts.push([i, h / 2 - c * (h / 2 - 8) * 0.35 - 14]); pts2.push([i, h / 2 + s * c * (h / 2 - 8) * 0.5 + 10]); }
                        S.line(x, pts, 'rgba(160,220,255,0.5)', 1); S.line(x, pts2, D.A, 1.6); S.txt(x, Math.round(f0) + 'Hz · ' + ['RING', 'AM', 'BOTH'][idx(P0.mode, 3)], 6, 11, D.A);
                    },
                    kill() { try { o.stop(); oR.stop(); lfo.stop(); wn.stop(); } catch (e) {} stopAll(b)(); } };
            } },
        { id: 'whisper', jp: '囁', en: 'WHISPER', sub: 'vowel filter. moves between two vowels by hand (MOVE), in time (WOBBLE) or with how hard you play (FOLLOW). talking pads + basses', face: 'throat',
            p: [['a', 'FROM', 0, F.pick(['a', 'e', 'i', 'o', 'u'])], ['b', 'TO', 0.8, F.pick(['a', 'e', 'i', 'o', 'u'])], ['morph', 'MOVE', 0, F.pct], ['rate', 'WOBBLE', 0, F.pick(SYNC.map(s => s[0]))], ['amt', 'WOBBLE AMT', 0.5, F.pct], ['follow', 'FOLLOW', 0, F.pct], ['size', 'THROAT', 0.5, v => v < 0.45 ? 'small' : v > 0.55 ? 'big' : 'mid'], ['res', 'SHARP', 0.5, F.pct], ['drive', 'BREATH', 0.2, F.pct], ['mix', 'MIX', 1, F.pct]],
            make(ctx) {
                const VW = [[800, 1150, 2900], [500, 1700, 2500], [350, 2000, 2800], [450, 800, 2830], [325, 700, 2530]];
                let fo = ctx._nbwk ? wkNode(ctx, 'nb-follow', 1) : null;
                let b = box(ctx), sh = ctx.createWaveShaper(), sum = b.g(1), lfo = ctx.createOscillator(), fs = [0, 1, 2].map(k => { let f = bq(ctx, 'bandpass', 800, 8), g = b.g([1, 0.7, 0.35][k]), ld = b.g(0), fg = b.g(0); sh.connect(f); f.connect(g); g.connect(sum); lfo.connect(ld); ld.connect(f.detune); if (fo) fo.connect(fg); fg.connect(f.detune); return { f, g, ld, fg }; }), P0 = null, dk = -1;
                if (fo) { b.in.connect(fo); fo.parameters.get('att').value = 0.01; fo.parameters.get('rel').value = 0.25; }
                b.in.connect(sh); sum.connect(b.wet); lfo.start();
                return { in: b.in, out: b.out, wk: !fo,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), A = VW[idx(p.a, 5)], B = VW[idx(p.b, 5)], sc = 0.75 + p.size * 0.5, beats = SYNC[idx(p.rate, SYNC.length)][1];
                        fs.forEach((F2, k) => { let f = (A[k] + (B[k] - A[k]) * p.morph) * sc; S2('morph', F2.f.frequency, f); F2.f.Q.value = 3 + p.res * 20 + k * 3; let cents = 1200 * Math.log2(B[k] / A[k]) * (p.morph < 0.5 ? 1 : -1) * 0.5; S2('amt', F2.ld.gain, beats ? cents * p.amt : 0);
                            S2('follow', F2.fg.gain, (p.follow || 0) * 3 * 1200 * Math.log2(B[k] / Math.max(1, f / sc))); });
                        if (beats) lfo.frequency.value = info.bpm / 60 / beats;
                        let k = Math.round(p.drive * 30); if (k !== dk) { dk = k; sh.curve = k ? curveOf(x => Math.tanh(x * (1 + p.drive * 6)) / Math.tanh(1 + p.drive * 6)) : null; }
                        // was way too loud before
                        sum.gain.value = (5 + p.res * 9) * 0.45; S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix);
                    },
                    ap: { mix: mixAp(b) },
                    draw(x, w2, h, D) {
                        S.bg(x, w2, h); if (!P0) return;
                        let fr = new Float32Array(w2); for (let i = 0; i < w2; i++) fr[i] = 20 * Math.pow(1000, i / (w2 - 1));
                        let tot = new Float32Array(w2), tm = new Float32Array(w2), ph = new Float32Array(w2);
                        fs.forEach((F2, k) => { F2.f.getFrequencyResponse(fr, tm, ph); for (let i = 0; i < w2; i++) tot[i] += tm[i] * [1, 0.7, 0.35][k]; });
                        let pts = []; for (let i = 0; i < w2; i++) pts.push([i, h - 4 - Math.min(1, tot[i]) * (h - 16)]); S.line(x, pts, D.A, 1.6);
                        S.txt(x, ['a', 'e', 'i', 'o', 'u'][idx(P0.a, 5)].toUpperCase() + ' → ' + ['a', 'e', 'i', 'o', 'u'][idx(P0.b, 5)].toUpperCase(), 6, 11, D.A, 11);
                    },
                    kill() { try { lfo.stop(); } catch (e) {} bury([fo]); stopAll(b)(); } };
            } },
        { id: 'strings', jp: '響', en: 'RESONATOR', sub: 'resonator. five strings tuned to your key ring along with the input, so drums hum a chord. CHORD sets the tuning: IN KEY builds it from the song scale, KEY sets a different root', face: 'coffin',
            p: [['chord', 'CHORD', 0.3, F.pick(RSC.map(c => c[0]))], ['key', 'KEY', 0, F.pick(['SONG', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])], ['deg', 'ON', 0, F.pick(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'])], ['oct', 'OCTAVE', 0.33, F.pick(['-1', '0', '+1', '+2'])], ['decay', 'RING', 0.6, F.pct], ['bright', 'BRIGHT', 0.5, F.pct], ['spread', 'WIDTH', 0.6, F.pct], ['mix', 'MIX', 0.4, F.pct]],
            ver: 2, fix(p) { if ((p._v || 1) < 2) { if (p.chord != null) p.chord = (Math.min(6, Math.floor(p.chord * 7)) + 0.5) / RSC.length; p._v = 2; } return p; },
            idle(p) { return RSC[idx(p.chord, RSC.length)][1] ? { deg: 'only IN KEY starts ON a step' } : {}; },
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-res') : null, bank = [], P0 = null, notes = [];
                if (w) { b.in.connect(w); w.connect(b.wet); }
                else for (let k = 0; k < 5; k++) { let f = bq(ctx, 'bandpass', 220, 50), g = b.g(3); b.in.connect(f); f.connect(g); g.connect(b.wet); bank.push(f); }
                return { in: b.in, out: b.out, wk: !w,
                    set(p, now, info, skip) {
                        let ky = idx(p.key || 0, 13), rt = ky ? ky - 1 : rootOf(info), c = RSC[idx(p.chord, RSC.length)][1];
                        P0 = p; let S2 = setter(ctx, now, skip), base = 36 + rt + (idx(p.oct, 4) - 1) * 12 + 12;
                        if (!c) { let sc = (window.NB && NB.SCALES && NB.SCALES[info.scale] || { s: [0, 2, 3, 5, 7, 8, 10] }).s, L = sc.length, d0 = idx(p.deg || 0, 7) % L; c = [0, 2, 4, 6, 8].map(k => sc[(d0 + k) % L] + 12 * Math.floor((d0 + k) / L)); }
                        notes = c.map(s => base + s);
                        if (w) { notes.forEach((m, k) => { w.parameters.get('f' + k).value = Math.min(8000, 440 * Math.pow(2, (m - 69) / 12)); }); S2('decay', w.parameters.get('fb'), 0.8 + p.decay * 0.195); w.parameters.get('damp').value = 0.9 - p.bright * 0.85; w.parameters.get('spread').value = p.spread; }
                        else notes.forEach((m, k) => { bank[k].frequency.value = 440 * Math.pow(2, (m - 69) / 12); bank[k].Q.value = 20 + p.decay * 200; });
                        S2('mix', b.wet.gain, p.mix * 1.2); S2('mix', b.dry.gain, 1 - p.mix * 0.5);
                    },
                    ap: { mix: [[b.wet.gain, v => v * 1.2], [b.dry.gain, v => 1 - v * 0.5]] },
                    draw(x, w2, h, D) {
                        x.fillStyle = '#1a1008'; x.fillRect(0, 0, w2, h); if (!P0) return;
                        let lv = D.lvl || 0;
                        notes.forEach((m, k) => { let y = 10 + k * (h - 20) / 4, a = 0.5 + Math.random() * lv * 6; x.strokeStyle = '#e8c890'; x.lineWidth = 1 + (4 - k) * 0.3; x.beginPath(); for (let i = 0; i <= w2; i += 4) x.lineTo(i, y + Math.sin(i * 0.05 * (k + 1) + D.now * 30) * a * Math.sin(Math.PI * i / w2)); x.stroke(); S.txt(x, ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][m % 12], w2 - 16, y + 3, '#e8c890'); });
                    },
                    kill: stopAll(b) };
            } },
        { id: 'bend', jp: '転', en: 'BEND', sub: 'pitch shift. CLEAN shifts everything (chords too), FORMANT keeps the voice character, GRAIN is rough with no delay. FINE detunes, AGAIN feeds it back for endless rising / falling', face: 'flesh',
            p: [['mode', 'KIND', 0, F.pick(['CLEAN', 'FORMANT', 'GRAIN'])], ['shift', 'SHIFT', 0.5, v => { let s = Math.round(v * 48) - 24; return (s > 0 ? '+' : '') + s + 'st'; }], ['fine', 'FINE', 0.5, v => Math.round((v - 0.5) * 100) + 'c'], ['fmt', 'FORMANT', 0.5, v => { let s = Math.round((v - 0.5) * 24); return (s > 0 ? '+' : '') + s + 'st'; }],
                ['win', 'GRAIN', 0.3, F.ms(0.012, 0.15)], ['fb', 'AGAIN', 0, F.pct], ['tone', 'TONE', 0.8, F.hz(400, 18000)], ['mix', 'MIX', 0.5, F.pct]],
            ver: 2, fix(p) { if ((p._v || 1) < 2) { p.mode = 2.5 / 3; p._v = 2; } return p; },
            idle(p) { let m = idx(p.mode || 0, 3); return m === 2 ? { fmt: 'only FORMANT moves the mouth' } : m === 0 ? { fmt: 'only FORMANT moves the mouth', win: 'only GRAIN has grains' } : { win: 'only GRAIN has grains' }; },
            make(ctx) {
                let b = box(ctx), pv = ctx._nbwk ? wkNode(ctx, 'nb-pv') : null, gr = ctx._nbwk ? wkNode(ctx, 'nb-pitch') : null, lp = bq(ctx, 'lowpass', 14000, 0.7), fb = b.g(0), dl = ctx.createDelay(0.1), P0 = null, an = tap(ctx, b.wet, 512), cur = null;
                let dd = ctx.createDelay(0.2), dg = b.g(1); b.dry.gain.value = 0; b.in.connect(dd); dd.connect(dg); dg.connect(b.out);
                dl.delayTime.value = 0.01; lp.connect(b.wet); lp.connect(fb); fb.connect(dl);
                const wire = m => { let e = m === 2 ? gr : pv; if (e === cur) return; [pv, gr].forEach(n => { if (!n) return; try { b.in.disconnect(n); } catch (er) {} try { dl.disconnect(n); } catch (er) {} try { n.disconnect(); } catch (er) {} }); cur = e; if (e) { b.in.connect(e); dl.connect(e); e.connect(lp); } };
                const live = () => !!cur, clean = () => !!cur && P0 && idx(P0.mode || 0, 3) < 2 && cur === pv;
                return { in: b.in, out: b.out, wk: !(pv && gr), lat: () => clean() ? 4096 / ctx.sampleRate : 0,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), m = idx(p.mode || 0, 3), st = Math.round(p.shift * 48) - 24 + (p.fine - 0.5); wire(m);
                        if (cur && cur === pv) { S2('shift', pv.parameters.get('shift'), st); pv.parameters.get('keep').value = m === 1 ? 1 : 0; pv.parameters.get('formant').value = m === 1 ? Math.round(((p.fmt == null ? 0.5 : p.fmt) - 0.5) * 24) : 0; }
                        if (cur && cur === gr) { S2('shift', gr.parameters.get('shift'), st); gr.parameters.get('win').value = 0.012 + p.win * 0.138; }
                        dd.delayTime.value = clean() ? 4096 / ctx.sampleRate : 0;
                        S2('fb', fb.gain, p.fb * 0.85); S2('tone', lp.frequency, expo(400, 18000, p.tone)); S2('mix', b.wet.gain, live() ? p.mix : 0); S2('mix', dg.gain, live() ? 1 - p.mix : 1);
                    },
                    get ap() { let a = { fb: [[fb.gain, v => v * 0.85]], tone: [[lp.frequency, v => expo(400, 18000, v)]], mix: [[b.wet.gain, v => v], [dg.gain, v => 1 - v]] }; if (cur) a.shift = [[cur.parameters.get('shift'), v => Math.round(v * 48) - 24]]; return a; },
                    draw(x, w2, h, D) {
                        x.fillStyle = '#1a0608'; x.fillRect(0, 0, w2, h); if (!P0) return;
                        let lv = an ? S.meter(x, an) : 0.2; this._l = Math.max(lv, (this._l || 0) * 0.92);
                        let hs = this._hs || (this._hs = []); hs.push(this._l); while (hs.length > w2 / 3) hs.shift();
                        let m = idx(P0.mode || 0, 3), s0 = Math.round(P0.shift * 48) - 24, n = 1 + Math.round(P0.fb * 8), Y = st => h / 2 - st / 36 * (h - 16);
                        for (let st = -36; st <= 36; st++) { let yy = Y(st); if (yy < 0 || yy > h) continue; x.fillStyle = st % 12 === 0 ? 'rgba(255,170,170,0.3)' : 'rgba(255,170,170,0.1)'; x.fillRect(0, Math.round(yy), w2, 1); }
                        x.fillStyle = 'rgba(255,255,255,0.85)'; x.fillRect(0, Y(0) - 1, w2, 2);
                        for (let k = 1; k <= n; k++) { let st = s0 * k; if (Math.abs(st) > 36) break; let yy = Y(st), a = (1 - (k - 1) / (n + 1)) * (0.35 + Math.min(0.65, this._l * 3)), th = 2 + this._l * 8 / k;
                            x.fillStyle = 'rgba(255,120,140,' + a + ')'; x.shadowColor = '#ff4060'; x.shadowBlur = 10; x.fillRect(0, yy - th / 2, w2, th); x.shadowBlur = 0;
                            x.fillStyle = 'rgba(255,200,210,' + a * 0.8 + ')'; hs.forEach((v, i) => { let t2 = 1 + v * 26 / k; x.fillRect(w2 - (hs.length - i) * 3, yy - t2 / 2, 2, t2); });
                            S.txt(x, (st > 0 ? '+' : '') + st, w2 - 26, yy - 3, '#ffd0d8'); }
                        let fm = m === 1 ? Math.round(((P0.fmt == null ? 0.5 : P0.fmt) - 0.5) * 24) : s0; x.strokeStyle = '#ffe08a'; x.setLineDash([4, 3]); x.beginPath(); x.moveTo(0, Y(fm)); x.lineTo(w2 * 0.55, Y(fm)); x.stroke(); x.setLineDash([]);
                        S.txt(x, 'mouth', 4, Y(fm) - 3, '#ffe08a', 8);
                        S.txt(x, ['CLEAN', 'FORMANT', 'GRAIN'][m] + ' · ' + (s0 > 0 ? '+' : '') + s0 + ' st' + (n > 1 ? ' · ' + n + ' times' : '') + (cur ? '' : ' (needs the worklet)'), 6, 11, '#ffc0c0', 11);
                    },
                    kill() { bury([pv, gr]); stopAll(b)(); } };
            } },
        // shimmer reverb. the angel pad thing
        { id: 'glint', jp: '煌', en: 'GLINT', sub: 'shimmer reverb. UP BY = how far the shimmer is pitched, SHIMMER = how much', face: 'glass', part: 'nb_fx_glint',
            p: [['size', 'SIZE', 0.6, F.pct], ['shim', 'SHIMMER', 0.5, F.pct], ['int', 'UP BY', 0, F.pick(['+12', '+7', '+19', '+24', '-12'])], ['damp', 'DARK', 0.3, F.pct], ['lc', 'LOW CUT', 0.35, F.hz(20, 1500)], ['eng', 'CHARACTER', 0, F.pick(['CLEAN', 'GRAIN'])], ['mod', 'MOVE', 0.3, F.pct], ['mix', 'MIX', 0.35, F.pct]],
            ver: 2, fix(p) { if ((p._v || 1) < 2) { p.eng = 0.75; p.mod = 0; p._v = 2; } return p; },
            make(ctx) {
                let b = box(ctx), hp = bq(ctx, 'highpass', 200), cv = ctx.createConvolver(), pv = ctx._nbwk ? wkNode(ctx, 'nb-pv') : null, gr = ctx._nbwk ? wkNode(ctx, 'nb-pitch') : null, lp = bq(ctx, 'lowpass', 9000), fb = b.g(0), dl = ctx.createDelay(0.2), key = '', P0 = null, an = null, cur = null;
                let m1 = ctx.createOscillator(), m2 = ctx.createOscillator(), mg = b.g(0); m1.frequency.value = 0.31; m2.frequency.value = 0.13; m1.connect(mg); m2.connect(mg); mg.connect(dl.delayTime); m1.start(); m2.start();
                dl.delayTime.value = 0.03; b.in.connect(hp); hp.connect(cv); lp.connect(fb); fb.connect(dl); dl.connect(cv); oneOut(ctx, [cv, lp], b.wet);
                const wire = e => { if (e === cur) return; [pv, gr].forEach(n => { if (!n) return; try { cv.disconnect(n); } catch (er) {} try { n.disconnect(); } catch (er) {} }); cur = e; if (e) { cv.connect(e); e.connect(lp); } };
                an = tap(ctx, b.wet, 512);
                return { in: b.in, out: b.out, wk: !(pv && gr),
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), k = Math.round(p.size * 10) + ':' + Math.round(p.damp * 6), e = idx(p.eng || 0, 2) ? gr : pv;
                        if (k !== key) { key = k; cv.buffer = irBuf(ctx, { kind: 3, len: 1.5 + p.size * 5, dark: 0.15 + p.damp * 0.6, decay: 1.6 + (1 - p.size) * 2, size: p.size }); }
                        wire(e); let iv = [12, 7, 19, 24, -12][idx(p.int, 5)];
                        if (cur && cur === gr) { gr.parameters.get('shift').value = iv; gr.parameters.get('win').value = 0.08; }
                        if (cur && cur === pv) { pv.parameters.get('shift').value = iv; pv.parameters.get('keep').value = 0; }
                        S2('shim', fb.gain, p.shim * 0.7); S2('damp', lp.frequency, expo(2000, 14000, 1 - p.damp)); S2('lc', hp.frequency, expo(20, 1500, p.lc)); S2('mod', mg.gain, (p.mod || 0) * 0.004);
                        S2('mix', b.wet.gain, p.mix * 1.3); S2('mix', b.dry.gain, 1 - p.mix * 0.6);
                    },
                    ap: { shim: [[fb.gain, v => v * 0.7]], mod: [[mg.gain, v => v * 0.004]], mix: [[b.wet.gain, v => v * 1.3], [b.dry.gain, v => 1 - v * 0.6]] },
                    draw(x, w2, h, D) {
                        let lv = S.meter(x, an); this._l = Math.max(lv, (this._l || 0) * 0.94);
                        x.fillStyle = 'rgba(8,6,14,0.35)'; x.fillRect(0, 0, w2, h); if (!P0) return;
                        let iv = [12, 7, 19, 24, -12][idx(P0.int, 5)], steps = 1 + Math.round(P0.shim * 4);
                        for (let k = 0; k < steps; k++) { let Y = h - 10 - (k + 1) / (steps + 1) * (h - 20) * (iv < 0 ? -0.2 : 1); x.fillStyle = 'rgba(200,220,255,' + (0.05 + 0.1 * (1 - k / steps)) + ')'; x.fillRect(0, Y, w2, 2); }
                        let n = 6 + Math.round(this._l * 120 * (0.3 + P0.shim));
                        for (let i = 0; i < n; i++) { let X0 = (i * 97.3 + Math.sin(D.now * 0.7 + i) * 20 * (P0.mod || 0)) % w2, Y = h - ((D.now * 30 * (1 + (iv > 12 ? 0.5 : 0)) + i * 37) % h), s = 0.5 + ((i * 13) % 5) * 0.5; x.fillStyle = 'hsla(' + (200 + (i * 41) % 120) + ',90%,80%,' + (0.3 + ((i * 7) % 10) / 14) + ')'; x.fillRect(X0, Y, s, s); }
                        S.txt(x, 'UP BY ' + ['+12', '+7', '+19', '+24', '-12'][idx(P0.int, 5)] + ' · ' + ['CLEAN', 'GRAIN'][idx(P0.eng || 0, 2)] + (cur ? '' : ' (no worklet, just the room)'), 6, 11, '#e8f0ff');
                    },
                    kill() { bury([pv, gr]); try { m1.stop(); m2.stop(); } catch (e) {} stopAll(b)(); } };
            } },
        { id: 'vortex', jp: '渦', en: 'VORTEX', sub: 'rotary speaker. GEAR = slow / fast, DRIVE, MICS', face: 'steel',
            p: [['mode', 'KIND', 0, F.pick(['ROTARY', 'AUTOPAN', 'TREMOLO'])], ['speed', 'GEAR', 0, F.pick(['slow', 'fast'])], ['rate', 'RATE', 0.6, F.pick(['1/32', '1/16', '1/8', '1/4', '1/2', '1 bar', '2 bars'])], ['depth', 'DEPTH', 0.7, F.pct], ['dop', 'WARBLE', 0.4, F.pct], ['shape', 'SHAPE', 0, F.pick(['sine', 'tri', 'square'])], ['mics', 'MICS', 0.7, F.pct], ['drive', 'DRIVE', 0, F.pct], ['mix', 'MIX', 1, F.pct]],
            make(ctx) {
                let b = box(ctx), dl = ctx.createDelay(0.05), tg = b.g(1), pan = ctx.createStereoPanner(), lfo = ctx.createOscillator(), pg = b.g(0), tgg = b.g(0), dg = b.g(0), P0 = null, gear = -1, rot = ctx._nbwk ? wkNode(ctx, 'nb-rotor', 2) : null, rg = b.g(0), og = b.g(1), RS = [0.8, 0.67, 0, 0];
                dl.delayTime.value = 0.006; b.in.connect(dl); dl.connect(tg); tg.connect(pan); pan.connect(og); og.connect(b.wet);
                if (rot) { b.in.connect(rot); rot.connect(rg); rg.connect(b.wet); rot.port.onmessage = e => { RS = e.data; }; }
                lfo.connect(pg); pg.connect(pan.pan); lfo.connect(tgg); tgg.connect(tg.gain); lfo.connect(dg); dg.connect(dl.delayTime); lfo.start();
                return { in: b.in, out: b.out, wk: !rot,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), m = idx(p.mode, 3);
                        lfo.type = ['sine', 'triangle', 'square'][idx(p.shape, 3)];
                        let cab = rot && m === 0; S2('mode', rg.gain, cab ? 1 : 0); S2('mode', og.gain, cab ? 0 : 1);
                        if (rot) { let Q = n => rot.parameters.get(n); Q('fast').value = p.speed >= 0.5 ? 1 : 0; Q('drive').value = p.drive || 0; Q('mics').value = p.mics == null ? 0.7 : p.mics; Q('dop').value = p.dop; Q('depth').value = p.depth; }
                        if (m === 0) { let g = p.speed >= 0.5 ? 6.6 : 0.75; if (g !== gear) { gear = g; lfo.frequency.setTargetAtTime(g, ctx.currentTime, now ? 0.001 : 0.9); } }
                        else { gear = -1; lfo.frequency.value = info.bpm / 60 / [0.125, 0.25, 0.5, 1, 2, 4, 8][idx(p.rate, 7)]; }
                        S2('depth', pg.gain, m === 2 ? 0 : p.depth * (m === 0 ? 0.6 : 1)); tg.gain.value = 1 - (m === 1 ? 0 : p.depth * 0.35); S2('depth', tgg.gain, m === 1 ? 0 : p.depth * (m === 2 ? 0.5 : 0.3));
                        S2('dop', dg.gain, m === 0 ? p.dop * 0.0018 : 0); S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix);
                    },
                    ap: { depth: [[pg.gain, v => v]], mix: mixAp(b) },
                    draw(x, w2, h, D) {
                        x.fillStyle = 'rgba(30,32,36,0.6)'; x.fillRect(0, 0, w2, h); if (!P0) return;
                        let f = lfo.frequency.value, a = D.now * f * 6.283, cx = w2 / 2, cy = h / 2, R = h / 2 - 8, cab = rot && idx(P0.mode, 3) === 0;
                        x.strokeStyle = '#999'; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.stroke();
                        if (cab) {
                            let ah = RS[2] * 6.283, ad = RS[3] * 6.283; x.fillStyle = '#fff'; x.beginPath(); x.arc(cx + Math.cos(ah) * R, cy - 6 + Math.sin(ah) * R * 0.3, 5, 0, 7); x.fill();
                            x.fillStyle = '#9a9a9a'; x.beginPath(); x.arc(cx + Math.cos(ad) * R * 0.8, cy + 8 + Math.sin(ad) * R * 0.25, 4, 0, 7); x.fill();
                            S.txt(x, 'ROTARY ' + (P0.speed >= 0.5 ? 'FAST' : 'SLOW') + ' · horn ' + RS[0].toFixed(1) + ' · drum ' + RS[1].toFixed(1) + ' a second', 6, 11, '#eee'); }
                        else { x.fillStyle = '#fff'; x.beginPath(); x.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.35, 5, 0, 7); x.fill();
                        x.fillStyle = '#ccc'; x.beginPath(); x.arc(cx - Math.cos(a) * R, cy - Math.sin(a) * R * 0.35, 3, 0, 7); x.fill();
                        S.txt(x, ['ROTARY ' + (P0.speed >= 0.5 ? 'FAST' : 'SLOW'), 'AUTOPAN', 'TREMOLO'][idx(P0.mode, 3)], 6, 11, '#eee'); }
                    },
                    kill() { try { lfo.stop(); } catch (e) {} bury([rot]); stopAll(b)(); } };
            } },
        { id: 'tongue', jp: '舌', en: 'TONGUE', sub: 'auto-wah. hit it harder + it opens', face: 'flesh',
            p: [['sens', 'FEEL', 0.5, F.pct], ['base', 'FROM', 0.25, F.hz(60, 3000)], ['range', 'RANGE', 0.5, v => (v * 5).toFixed(1) + ' oct'], ['res', 'RES', 0.6, F.pct], ['att', 'ATTACK', 0.1, F.ms(0.001, 0.2, 2)], ['rel', 'RELEASE', 0.3, F.ms(0.02, 1, 1.5)], ['mode', 'WAY', 0, F.pick(['UP', 'DOWN'])], ['follow', 'FOLLOW', 0, F.pick(['LEVEL', 'HITS'])], ['kind', 'KIND', 0, F.pick(['LOW', 'BAND', 'PEAK'])], ['poles', 'POLES', 0, F.pick(['2', '4'])], ['drive', 'DRIVE', 0, F.pct], ['lfo', 'WOBBLE', 0, F.pct], ['lrate', 'WOBBLE RATE', 0.5, F.pick(TGR.map(r => r[0]))], ['mix', 'MIX', 1, F.pct]],
            idle(p) { return (p.lfo || 0) < 0.01 ? { lrate: 'WOBBLE is off' } : {}; },
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-follow', 1) : null, wh = w ? wkNode(ctx, 'nb-wah', 2) : null;
                let f = null, f2 = null, lo = null, lg = null, P0 = null, base = 400, fcNow = 0, dv = ctx.createWaveShaper(), dvi = b.g(1), dk = -1, bpm = 120;
                dv.oversample = '2x'; b.in.connect(dvi); dvi.connect(dv);
                if (w && wh) { dv.connect(wh); wh.connect(b.wet); b.in.connect(w); w.connect(wh.parameters.get('env')); wh.port.onmessage = e => { fcNow = e.data; }; }
                else { w = null; f = bq(ctx, 'lowpass', 400, 6); f2 = bq(ctx, 'allpass', 400, 6); lo = ctx.createOscillator(); lg = b.g(0); dv.connect(f); f.connect(f2); f2.connect(b.wet); lo.connect(lg); lg.connect(f.detune); lg.connect(f2.detune); lo.start(); }
                return { in: b.in, out: b.out, wk: !w,
                    set(p, now, info, skip) {
                        P0 = p; bpm = info && info.bpm || bpm; let S2 = setter(ctx, now, skip), kd = idx(p.kind, 3), four = idx(p.poles || 0, 2), lowq = kd === 0; base = expo(60, 3000, p.base);
                        let hits = idx(p.follow || 0, 2), qa = 0.7 + p.res * 16, qb = four ? 0.7 + p.res * 6 : 0.7, qaL = four ? 1.3066 * Math.pow(10, p.res * 16 / 20) : Math.pow(10, qa / 20), qbL = 0.5412, r = TGR[idx(p.lrate == null ? 0.5 : p.lrate, TGR.length)][1], span = Math.max(1, p.range * 5 * 1200), lc = (p.lfo || 0) * span * 0.5, up = p.mode < 0.5;
                        let dk2 = Math.round((p.drive || 0) * 30); if (dk2 !== dk) { dk = dk2; let d = 1 + (p.drive || 0) * 8; dv.curve = dk2 ? curveOf(v => Math.tanh(v * 2 * d) / Math.sqrt(d), 4096) : null; dvi.gain.value = dk2 ? 0.5 : 1; }
                        if (wh) { let Q = n => wh.parameters.get(n), att = 0.001 + Math.pow(p.att, 2) * 0.2; w.parameters.get('att').value = att; let rl = 0.02 + Math.pow(p.rel, 1.5) * 0.98; w.parameters.get('rel').value = hits ? 0.02 : rl; Q('hit').value = hits; Q('hr').value = rl;
                            let C = up ? Math.max(0.25, Math.min(1.5, (1200 * Math.log2(0.42 * ctx.sampleRate / base) - lc) / span)) : 1.5;
                            S2('base', Q('base'), base); Q('span').value = (up ? 1 : -1) * span; Q('cap').value = C; S2('sens', Q('k'), p.sens * 2.5); Q('sm').value = Math.max(25, Math.min(160, 0.35 / att)); S2('lfo', Q('lfo'), lc); Q('lrate').value = bpm / 60 / r;
                            Q('qa').value = lowq ? qaL : qa; Q('qb').value = lowq ? qbL : qb; Q('poles').value = four; Q('kind').value = kd;
                            Q('trim').value = Math.pow(10, -(lowq ? qa * 0.35 : kd === 2 ? 6 : 0) / 20); }
                        else { let ty = ['lowpass', 'bandpass', 'peaking'][kd]; f.type = ty; S2('base', f.frequency, base); f.Q.value = lowq ? 20 * Math.log10(qaL) : qa; f.gain.value = 12; f2.type = four && ty !== 'peaking' ? ty : 'allpass'; S2('base', f2.frequency, base); f2.Q.value = lowq && four ? 20 * Math.log10(qbL) : qb; lo.frequency.value = bpm / 60 / r; S2('lfo', lg.gain, lc); }
                        S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix);
                    },
                    ap: { base: wh ? [[wh.parameters.get('base'), v => expo(60, 3000, v)]] : [[f.frequency, v => expo(60, 3000, v)], [f2.frequency, v => expo(60, 3000, v)]], mix: mixAp(b) },
                    draw(x, w2, h, D) {
                        S.bg(x, w2, h); if (!P0) return;
                        let fc = Math.max(20, Math.min(20000, fcNow || base)), X0 = S.logx(fc, w2), X1 = S.logx(base, w2);
                        x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(Math.min(X0, X1), 20, Math.abs(X0 - X1), h - 30);
                        x.fillStyle = D.A; x.fillRect(X0 - 2, 14, 4, h - 20); S.txt(x, 'FOLLOWING ' + Math.round(fc) + 'Hz' + (w ? '' : ' (no worklet, fixed)'), 6, 11, D.A);
                    },
                    kill: stopAll(b) };
            } },
        { id: 'fang', jp: '牙', en: 'FANG', sub: 'transient shaper. SNAP = attack, TAIL = sustain. FOCUS on all of it, the LOWS or the HIGHS. CLIP catches the extra peaks', face: 'bone',
            p: [['attack', 'SNAP', 0.5, v => Math.round((v - 0.5) * 200) + '%'], ['sustain', 'TAIL', 0.5, v => Math.round((v - 0.5) * 200) + '%'], ['speed', 'SPEED', 0.5, v => v < 0.4 ? 'quick' : v > 0.6 ? 'slow' : 'mid'], ['focus', 'FOCUS', 0, F.pick(['ALL', 'LOWS', 'HIGHS'])], ['xo', 'SPLIT', 0.4, F.hz(40, 8000)], ['clip', 'CLIP', 0, F.pick(['off', 'on'])], ['out', 'OUT', 0.75, F.db(-18, 6)], ['mix', 'MIX', 1, F.pct]],
            idle(p) { return idx(p.focus || 0, 3) ? {} : { xo: 'FOCUS is ALL, nothing is split' }; },
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-fang') : null, og = b.g(1), P0 = null, H = [];
                if (w) { b.in.connect(w); w.connect(og); w.port.onmessage = e => { if (typeof e.data === 'number') { H.push(e.data); if (H.length > 120) H.shift(); } }; } else b.in.connect(og);
                og.connect(b.wet);
                return { in: b.in, out: b.out, wk: !w,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip);
                        if (w) { S2('attack', w.parameters.get('attack'), (p.attack - 0.5) * 2); S2('sustain', w.parameters.get('sustain'), (p.sustain - 0.5) * 2); w.parameters.get('speed').value = p.speed; w.parameters.get('focus').value = idx(p.focus || 0, 3); w.parameters.get('xo').value = expo(40, 8000, p.xo == null ? 0.4 : p.xo); w.parameters.get('clip').value = idx(p.clip || 0, 2); }
                        S2('out', og.gain, db2g(-18 + p.out * 24)); S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix);
                    },
                    get ap() { let a = { out: [[og.gain, v => db2g(-18 + v * 24)]], mix: mixAp(b) }; if (w) { a.attack = [[w.parameters.get('attack'), v => (v - 0.5) * 2]]; a.sustain = [[w.parameters.get('sustain'), v => (v - 0.5) * 2]]; } return a; },
                    draw(x, w2, h, D) {
                        x.fillStyle = '#e6dccb'; x.fillRect(0, 0, w2, h); if (!P0) return;
                        let A = (P0.attack - 0.5) * 2, Su = (P0.sustain - 0.5) * 2, pts = [], pts0 = [], hw = Math.round(w2 * 0.5);
                        for (let i = 0; i < hw; i++) { let u = i / hw, e = u < 0.04 ? u / 0.04 : Math.exp(-(u - 0.04) * 6), g = (1 + A * 3 * Math.exp(-u * 30)) * (1 + Su * 1.5 * Math.min(1, u * 4) * (u > 0.1 ? 1 : 0)); pts0.push([i, h - 6 - e * (h - 18)]); pts.push([i, h - 6 - Math.min(1.3, e * g / 1.3) * (h - 18)]); }
                        S.line(x, pts0, 'rgba(0,0,0,0.25)', 1); S.line(x, pts, '#8a1018', 2);
                        let X0 = hw + 8, gw = w2 - X0 - 4, mid = h / 2 + 4; x.fillStyle = 'rgba(0,0,0,0.08)'; x.fillRect(X0, 16, gw, h - 20); x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(X0, mid, gw, 1);
                        H.forEach((v, k) => { let hh = Math.max(-1, Math.min(1, v / 12)) * (h / 2 - 14); x.fillStyle = v > 0 ? '#8a1018' : '#2a6a8a'; x.fillRect(X0 + (120 - H.length + k) / 120 * gw, hh > 0 ? mid - hh : mid, Math.max(1, gw / 120), Math.abs(hh)); });
                        S.txt(x, 'SNAP ' + Math.round(A * 100) + '%  TAIL ' + Math.round(Su * 100) + '%' + (idx(P0.focus || 0, 3) ? ' · ' + ['', 'LOWS', 'HIGHS'][idx(P0.focus || 0, 3)] : '') + (w ? '' : ' (needs the worklet)'), 6, 11, '#3a0d10');
                    },
                    kill() { bury([w]); stopAll(b)(); } };
            } },
        { id: 'fault', jp: '障', en: 'FAULT', sub: 'glitch sequencer. 16 steps, each breaks the sound a different way (repeat, reverse, tape stop, half, double, gate, crush, scratch...). pick a colour, paint the steps', face: 'fault', part: 'nb_fx_fault',
            p: [['rate', 'STEP', 0.33, F.pick(['1/32', '1/16', '1/8', '1/4'])], ['chance', 'CHANCE', 1, F.pct], ['div', 'REPEATS', 0.4, F.pick(['2', '3', '4', '6', '8', '16'])], ['wild', 'WILD', 0, F.pct], ['seed', 'DICE', 0, DICE], ['len', 'LENGTH', 1, F.pick(['4', '8', '12', '16'])], ['mix', 'MIX', 1, F.pct]],
            extra: () => ({ seq: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 2, 3] }),
            steps: FAULTS,
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-fault') : null, P0 = null, an = null, C = clockOf(ctx, w);
                if (w) { b.in.connect(w); w.connect(b.wet); } else b.in.connect(b.wet);
                an = tap(ctx, b.out, 1024);
                return { in: b.in, out: b.out, wk: !w, sched: C.sched, rest: C.rest,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), sq = p.seq || [];
                        if (w) { let Q = n => w.parameters.get(n); Q('rate').value = [0.125, 0.25, 0.5, 1][idx(p.rate, 4)]; Q('chance').value = p.chance; Q('div').value = [2, 3, 4, 6, 8, 16][idx(p.div, 6)]; Q('wild').value = p.wild; Q('seed').value = Math.round(p.seed * 99) * 7.31; Q('len').value = [4, 8, 12, 16][idx(p.len, 4)]; for (let k = 0; k < 16; k++) Q('s' + k).value = clamp(Math.round(sq[k] || 0), 0, 9); }
                        S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix);
                    },
                    now(pos) { if (!P0) return [0, 0]; let st = [0.125, 0.25, 0.5, 1][idx(P0.rate, 4)], ln = [4, 8, 12, 16][idx(P0.len, 4)], k = Math.floor(pos / st + 1e-9), sd = Math.round(P0.seed * 99) * 7.31, s = ((k % ln) + ln) % ln, e = Math.round((P0.seq || [])[s] || 0); if (e && hsh(k * 1.37 + sd) >= P0.chance) e = 0; if (e && hsh(k * 3.11 + sd + 0.5) < P0.wild) e = 1 + Math.floor(hsh(k * 5.71 + sd) * 11); return [s, e]; },
                    ap: { mix: mixAp(b) },
                    draw(x, w2, h, D) {
                        let [s, e] = D.playing ? this.now(D.pos) : [-1, 0], col = FAULTS[e][2];
                        x.fillStyle = e ? 'rgba(10,0,6,0.55)' : 'rgba(4,6,8,0.6)'; x.fillRect(0, 0, w2, h); if (!P0) return;
                        let d = null; if (an) { d = an._f || (an._f = new Float32Array(an.fftSize)); an.getFloatTimeDomainData(d); }
                        const wave = (dx, c) => { if (!d) return; x.strokeStyle = c; x.lineWidth = 1.3; x.beginPath(); for (let i = 0; i < w2; i++) { let v = d[Math.floor(i / w2 * d.length)], y = h / 2 + 6 - v * (h / 2 - 12); if (e && Math.random() < 0.03) y += (Math.random() - 0.5) * 30; i ? x.lineTo(i + dx, y) : x.moveTo(i + dx, y); } x.stroke(); };
                        x.globalCompositeOperation = 'lighter'; if (e) { wave(-3, 'rgba(255,0,60,0.7)'); wave(3, 'rgba(0,200,255,0.7)'); } wave(0, e ? col : 'rgba(170,255,210,0.75)'); x.globalCompositeOperation = 'source-over';
                        if (e) for (let k = 0; k < 4; k++) { let y = Math.random() * h, hh = 2 + Math.random() * 6; x.drawImage(x.canvas, 0, y, w2, hh, (Math.random() - 0.5) * 24, y, w2, hh); }
                        let ln = [4, 8, 12, 16][idx(P0.len, 4)];
                        for (let k = 0; k < 16; k++) { let q = Math.round((P0.seq || [])[k] || 0), X0 = 4 + k * (w2 - 8) / 16; x.fillStyle = k >= ln ? 'rgba(255,255,255,0.04)' : q ? FAULTS[q][2] : 'rgba(255,255,255,0.12)'; x.globalAlpha = k === s ? 1 : 0.55; x.fillRect(X0, h - 7, (w2 - 8) / 16 - 2, k === s ? 5 : 3); }
                        x.globalAlpha = 1; S.txt(x, e ? '▌' + FAULTS[e][1].toUpperCase() : w ? (D.playing ? 'clean' : 'waiting for the clock') : 'needs the worklet, this browser has none', 6, 12, e ? col : '#9dffc8', e ? 11 : 9);
                    },
                    kill: stopAll(b) };
            } },
        { id: 'broken', jp: '壊', en: 'BROKEN', sub: 'random glitches: cut outs, buzz, skips, spits + warble. the five knobs set how likely each one is, HOW OFTEN sets the overall amount', face: 'hazard',
            p: [['amt', 'HOW OFTEN', 0.3, F.pct], ['slot', 'SLOT', 0.33, F.pick(['1/32', '1/16', '1/8', '1/4'])], ['wd', 'CUT OUT', 0.7, F.pct], ['wb', 'BUZZ', 0.6, F.pct], ['ws', 'SKIP', 0.5, F.pct], ['wc', 'SPIT', 0.35, F.pct], ['ww', 'WARBLE', 0, F.pct], ['size', 'HOW LONG', 0.5, F.pct], ['seed', 'DICE', 0, DICE], ['mix', 'MIX', 1, F.pct]],
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-broke') : null, P0 = null, C = clockOf(ctx, w), sig = 4;
                if (w) { b.in.connect(w); w.connect(b.wet); } else b.in.connect(b.wet);
                const sd = () => Math.round(P0.seed * 99) * 3.77;
                return { in: b.in, out: b.out, wk: !w, sched: C.sched, rest: C.rest,
                    set(p, now, info, skip) {
                        P0 = p; sig = info.sig || 4; let S2 = setter(ctx, now, skip);
                        if (w) { let Q = n => w.parameters.get(n); Q('slot').value = [0.125, 0.25, 0.5, 1][idx(p.slot, 4)]; Q('ww').value = p.ww || 0; S2('amt', Q('amt'), p.amt); ['wd', 'wb', 'ws', 'wc', 'size'].forEach(k => { Q(k).value = p[k]; }); Q('seed').value = sd(); }
                        S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix);
                    },
                    get ap() { let a = { mix: mixAp(b) }; if (w) a.amt = [[w.parameters.get('amt'), v => v]]; return a; },
                    err(k) { if (hsh(k * 2.17 + sd()) >= P0.amt) return 0; let W = [P0.wd, P0.wb, P0.ws, P0.wc, P0.ww || 0], tot = W[0] + W[1] + W[2] + W[3] + W[4]; if (tot <= 0) return 0; let r = hsh(k * 4.33 + sd() + 0.2) * tot, e = 0; while (e < 4 && r >= W[e]) { r -= W[e]; e++; } return e + 1; },
                    draw(x, w2, h, D) {
                        x.fillStyle = '#0c0b06'; x.fillRect(0, 0, w2, h); if (!P0) return;
                        let st = [0.125, 0.25, 0.5, 1][idx(P0.slot, 4)], n = Math.round(sig / st), bar = Math.floor(D.pos / sig), k0 = Math.round(bar * sig / st), cur = Math.floor(D.pos / st + 1e-9), cw = (w2 - 8) / n;
                        for (let i = 0; i < n; i++) { let e = this.err(k0 + i), X0 = 4 + i * cw, on = D.playing && k0 + i === cur; x.fillStyle = e ? BROKE[e][1] : 'rgba(255,255,255,0.07)'; x.globalAlpha = on ? 1 : e ? 0.6 : 1; x.fillRect(X0, 22, Math.max(1, cw - 1), h - 30); if (on) { x.fillStyle = '#fff'; x.fillRect(X0, h - 6, cw - 1, 3); } if (e && cw > 18) { x.globalAlpha = 1; S.txt(x, BROKE[e][0], X0 + 2, h / 2 + 8, '#000', 8); } }
                        x.globalAlpha = 1; S.txt(x, 'BAR ' + (bar + 1) + ' · ' + Math.round(P0.amt * 100) + '% broken' + (w ? '' : ' (needs the worklet)'), 6, 12, '#ffd23b');
                    },
                    kill: stopAll(b) };
            } },
        // the build up before the drop. brrrrrrrrr
        { id: 'rip', jp: '裂', en: 'RIP', sub: 'drum roll. every few bars it repeats the beat faster + faster (1/4 to 1/64). RISE pitches it up, SWELL fades it in. instant build ups', face: 'char', part: 'nb_fx_rip',
            p: [['every', 'EVERY', 0.4, F.pick(['1 bar', '2 bars', '4 bars', '8 bars'])], ['len', 'HOW LONG', 0.4, F.pick(['1/4 bar', '1/2 bar', '1 bar', '2 bars'])], ['from', 'FROM', 0.3, F.pick(['1/2', '1/4', '1/8', '1/16'])], ['to', 'DOWN TO', 0.6, F.pick(['1/16', '1/32', '1/64', '1/128'])], ['rise', 'RISE', 0, v => '+' + Math.round(v * 24) + 'st'], ['sweep', 'THIN OUT', 0, F.pct], ['smooth', 'STEPS', 0, F.pick(['stepped', 'smooth'])], ['chance', 'CHANCE', 1, F.pct], ['swell', 'SWELL', 0, F.pct], ['mix', 'MIX', 1, F.pct]],
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-rip') : null, P0 = null, C = clockOf(ctx, w), sig = 4;
                if (w) { b.in.connect(w); w.connect(b.wet); } else b.in.connect(b.wet);
                const shape = p => { let ev = [1, 2, 4, 8][idx(p.every, 4)] * sig, lb = Math.min(ev, [0.25, 0.5, 1, 2][idx(p.len, 4)] * sig), fr = [2, 1, 0.5, 0.25][idx(p.from, 4)], to = Math.min(fr, [0.25, 0.125, 0.0625, 0.03125][idx(p.to, 4)]); return { ev, lb, fr, to }; };
                return { in: b.in, out: b.out, wk: !w, sched: C.sched, rest: C.rest,
                    set(p, now, info, skip) {
                        P0 = p; sig = info.sig || 4; let S2 = setter(ctx, now, skip), Z = shape(p);
                        if (w) { let Q = n => w.parameters.get(n); Q('every').value = Z.ev; Q('len').value = Z.lb / Z.ev; Q('from').value = Z.fr; Q('to').value = Z.to; S2('rise', Q('rise'), p.rise * 24); S2('sweep', Q('sweep'), p.sweep); Q('swell').value = p.swell || 0; Q('smooth').value = p.smooth >= 0.5 ? 1 : 0; Q('chance').value = p.chance; }
                        S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix);
                    },
                    get ap() { let a = { mix: mixAp(b) }; if (w) { a.rise = [[w.parameters.get('rise'), v => v * 24]]; a.sweep = [[w.parameters.get('sweep'), v => v]]; } return a; },
                    draw(x, w2, h, D) {
                        x.fillStyle = 'rgba(14,6,3,0.7)'; x.fillRect(0, 0, w2, h); if (!P0) return;
                        let Z = shape(P0), u = ((D.pos % Z.ev) + Z.ev) % Z.ev, zs = Z.ev - Z.lb, X = v => 4 + v / Z.ev * (w2 - 8), steps = Math.max(1, Math.round(Math.log2(Z.fr / Z.to)) + 1);
                        x.fillStyle = 'rgba(255,255,255,0.06)'; x.fillRect(4, 22, w2 - 8, h - 30);
                        let t = zs, guard = 0; while (t < Z.ev - 1e-6 && guard++ < 400) { let q = (t - zs) / Z.lb, sl = P0.smooth >= 0.5 ? Z.fr * Math.pow(Z.to / Z.fr, q) : Z.fr / Math.pow(2, Math.min(steps - 1, Math.floor(q * steps))); x.fillStyle = 'rgba(255,' + Math.round(150 - q * 120) + ',40,' + (0.5 + q * 0.5) + ')'; x.fillRect(X(t), 22 + (h - 30) * (1 - (0.3 + q * 0.7)), Math.max(1, X(t + sl) - X(t) - 1), (h - 30) * (0.3 + q * 0.7)); t += sl; }
                        if (D.playing) { x.fillStyle = '#fff'; x.fillRect(X(u), 18, 1.5, h - 22); }
                        S.txt(x, 'EVERY ' + ['BAR', '2 BARS', '4 BARS', '8 BARS'][idx(P0.every, 4)] + ' · ' + ['1/2', '1/4', '1/8', '1/16'][idx(P0.from, 4)] + ' → ' + ['1/16', '1/32', '1/64', '1/128'][idx(P0.to, 4)] + (w ? '' : ' (needs the worklet)'), 6, 12, '#ffb070');
                    },
                    kill: stopAll(b) };
            } },
        { id: 'spasm', jp: '痙', en: 'SPASM', sub: 'glitchy delay. jumps to new delay times on the beat. GLIDE slides between them (the pitch warps), 0 = clean cuts', face: 'rubber',
            p: [['rate', 'TWITCH', 0.4, F.pick(['1/32', '1/16', '1/8', '1/4', '1/2', '1 bar'])], ['chance', 'CHANCE', 0.5, F.pct], ['range', 'RANGE', 0.45, F.ms(0.004, 1.2, 2)], ['glide', 'GLIDE', 0.3, F.pct], ['sync', 'SNAP', 0, F.pick(['free', 'to the beat'])], ['fb', 'AGAIN', 0.3, F.pct], ['tone', 'TONE', 0.7, F.hz(400, 18000)], ['seed', 'DICE', 0, DICE], ['mix', 'MIX', 0.45, F.pct]],
            make(ctx) {
                let b = box(ctx), dl = ctx.createDelay(2.5), dl2 = ctx.createDelay(2.5), ga = b.g(1), gb = b.g(0), lp = bq(ctx, 'lowpass', 9000, 0.7), fb = b.g(0), P0 = null, bpm = 120, hist = [], act = 0;
                dl.delayTime.value = 0.25; dl2.delayTime.value = 0.25; b.in.connect(dl); b.in.connect(dl2); dl.connect(ga); dl2.connect(gb); ga.connect(lp); gb.connect(lp); lp.connect(b.wet); lp.connect(fb); fb.connect(dl); fb.connect(dl2);
                const RNG = p => 0.004 + Math.pow(p.range, 2) * 1.196;
                const pickT = (p, k, spb) => {
                    let sd = Math.round(p.seed * 99) * 5.03, top = RNG(p), r = hsh(k * 7.77 + sd + 0.3);
                    if (p.sync < 0.5) return 0.004 + r * (top - 0.004);
                    let opts = [1 / 32, 1 / 16, 3 / 32, 1 / 8, 3 / 16, 1 / 4, 3 / 8, 1 / 2, 3 / 4, 1, 1.5, 2].map(v => v * spb).filter(v => v <= Math.max(top, 1 / 32 * spb) && v < 2.4);
                    return opts[Math.floor(r * opts.length)] || 0.01;
                };
                return { in: b.in, out: b.out,
                    set(p, now, info, skip) {
                        P0 = p; bpm = info.bpm; let S2 = setter(ctx, now, skip);
                        S2('fb', fb.gain, p.fb * 0.85); S2('tone', lp.frequency, expo(400, 18000, p.tone)); S2('mix', b.wet.gain, p.mix * 1.1); S2('mix', b.dry.gain, 1 - p.mix * 0.5);
                    },
                    sched(b0, b1, tb) {
                        if (!P0) return;
                        let st = [0.125, 0.25, 0.5, 1, 2, 4][idx(P0.rate, 6)], spb = (tb(b1) - tb(b0)) / Math.max(1e-6, b1 - b0) || 60 / bpm, sd = Math.round(P0.seed * 99) * 5.03, tau = 0.0008 + Math.pow(P0.glide, 2) * 0.3;
                        for (let k = Math.ceil(b0 / st - 1e-9); k * st < b1; k++) {
                            if (hsh(k * 1.91 + sd) >= P0.chance) continue;
                            let T = Math.min(2.4, pickT(P0, k, spb)), t = tb(k * st);
                            if (P0.glide >= 0.08) { if (act) { act = 0; ga.gain.setTargetAtTime(1, t, 0.002); gb.gain.setTargetAtTime(0, t, 0.002); } dl.delayTime.setTargetAtTime(T, t, tau); }
                            else { let to = act ? dl : dl2; to.delayTime.setValueAtTime(T, t); act = 1 - act; ga.gain.setTargetAtTime(act ? 0 : 1, t + 0.0005, 0.002); gb.gain.setTargetAtTime(act ? 1 : 0, t + 0.0005, 0.002); }
                            if (!offline(ctx)) { hist.push([t, T]); if (hist.length > 24) hist.shift(); }
                        }
                    },
                    rest() { [dl.delayTime, dl2.delayTime, ga.gain, gb.gain].forEach(q => q.cancelScheduledValues(ctx.currentTime)); ga.gain.setTargetAtTime(1, ctx.currentTime, 0.003); gb.gain.setTargetAtTime(0, ctx.currentTime, 0.003); dl2.delayTime.value = dl.delayTime.value; act = 0; hist = []; },
                    ap: { fb: [[fb.gain, v => v * 0.85]], tone: [[lp.frequency, v => expo(400, 18000, v)]], mix: [[b.wet.gain, v => v * 1.1], [b.dry.gain, v => 1 - v * 0.5]] },
                    draw(x, w2, h, D) {
                        x.fillStyle = 'rgba(8,7,9,0.5)'; x.fillRect(0, 0, w2, h); if (!P0) return;
                        let top = RNG(P0), now = ctx.currentTime, Y = T => h - 6 - Math.min(1, T / Math.max(0.05, top)) * (h - 28), cur = (gb.gain.value > ga.gain.value ? dl2 : dl).delayTime.value;
                        x.strokeStyle = 'rgba(255,255,255,0.12)'; x.beginPath(); x.moveTo(0, Y(cur)); x.lineTo(w2, Y(cur)); x.stroke();
                        let pts = []; hist.forEach(([t, T]) => { let X0 = w2 - (now - t) * 120; if (X0 > -20 && X0 < w2 + 40) pts.push([X0, Y(T)]); });
                        pts.forEach(([X0, y]) => { x.fillStyle = D.A; x.fillRect(X0 - 2, y - 2, 4, 4); });
                        x.fillStyle = '#fff'; x.beginPath(); x.arc(w2 - 10, Y(cur), 4, 0, 7); x.fill();
                        S.txt(x, (cur * 1000).toFixed(0) + 'ms · ' + (P0.sync >= 0.5 ? 'on the beat' : 'free') + ' · glide ' + Math.round(P0.glide * 100) + '%', 6, 12, D.A);
                    },
                    kill: stopAll(b) };
            } },
        { id: 'bind', jp: '縛', en: 'BIND', sub: 'rhythmic squeeze. each KNOT pinches the sound in time, PULL tightens it bar by bar until LETS GO resets it. BURN adds heat, CREAK adds texture, SWING delays every other knot', face: 'rope', part: 'nb_x_bind', secret: true,
            p: [['rate', 'KNOTS', 0.33, F.pick(['1/4', '1/8', '1/16', '1/8T'])], ['tight', 'TIGHT', 0.5, F.pct], ['pull', 'PULL', 0.6, F.pct], ['letgo', 'LETS GO', 0.33, F.pick(['every bar', '2 bars', '4 bars', '8 bars'])], ['hold', 'HOLD', 0.35, F.pct], ['burn', 'BURN', 0.3, F.pct], ['creak', 'CREAK', 0.2, F.pct], ['swing', 'SWING', 0, v => Math.round(50 + v * 25) + '%'], ['mix', 'MIX', 1, F.pct]],
            make(ctx) {
                let b = box(ctx), gt = b.g(1), bp = b.g(1), sh = ctx.createWaveShaper(), mk = b.g(1), P0 = null, sig = 4, bpm = 120, cr = null, crb = null, crg = b.g(0);
                sh.curve = curveOf(x => Math.tanh(x * 1.6) / Math.tanh(1.6)); sh.oversample = '2x';
                b.in.connect(gt); gt.connect(bp); bp.connect(sh); sh.connect(mk); mk.connect(b.wet);
                let nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), nd = nb.getChannelData(0); noiseFill(nd, 2018);
                cr = ctx.createBufferSource(); cr.buffer = nb; cr.loop = true; crb = bq(ctx, 'bandpass', 900, 14); cr.connect(crb); crb.connect(crg); crg.connect(b.out); cr.start();
                const shape = p => ({ st: [1, 0.5, 0.25, 1 / 3][idx(p.rate, 4)], L: [1, 2, 4, 8][idx(p.letgo, 4)] * sig });
                const tens = (p, beat) => { let { L } = shape(p), q = (((beat % L) + L) % L) / L; return p.tight * (1 - p.pull + p.pull * q); };
                return { in: b.in, out: b.out,
                    set(p, now, info, skip) { P0 = p; sig = info.sig || 4; bpm = info.bpm; let S2 = setter(ctx, now, skip); mk.gain.value = 1 / (1 + p.burn * 0.8); S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix); },
                    sched(b0, b1, tb) {
                        if (!P0) return;
                        let { st, L } = shape(P0), spb = (tb(b1) - tb(b0)) / Math.max(1e-6, b1 - b0) || 60 / bpm;
                        for (let k = Math.ceil(b0 / st - 1e-9); k * st < b1; k++) {
                            let beat = k * st, t = tb(beat + (k % 2 ? (P0.swing || 0) * 0.5 * st : 0)), q = tens(P0, beat), wrap = Math.abs(((beat % L) + L) % L) < 1e-6;
                            gt.gain.setTargetAtTime(1 - q * 0.88, t, 0.003); gt.gain.setTargetAtTime(1, t + st * spb * (0.08 + P0.hold * 0.6), st * spb * 0.18);
                            bp.gain.setTargetAtTime(wrap ? 1 : 1 + P0.burn * q * 7, t, wrap ? 0.08 : 0.03);
                            if (P0.creak > 0.01 && hsh(k * 1.7 + 0.3) < 0.35 + q * 0.5) { crb.frequency.setValueAtTime(500 + hsh(k * 3.3) * 1400, t); crg.gain.setValueAtTime(P0.creak * (0.15 + q * 0.35), t); crg.gain.setTargetAtTime(0, t + 0.004, 0.012 + hsh(k * 5.1) * 0.03); }
                        }
                    },
                    rest() { let t = ctx.currentTime; [gt.gain, bp.gain, crg.gain].forEach(g => g.cancelScheduledValues(t)); gt.gain.setTargetAtTime(1, t, 0.02); bp.gain.setTargetAtTime(1, t, 0.02); crg.gain.setTargetAtTime(0, t, 0.01); },
                    ap: { mix: mixAp(b) },
                    draw(x, w, h, D) {
                        x.fillStyle = '#1c140c'; x.fillRect(0, 0, w, h); if (!P0) return;
                        let q = D.playing ? tens(P0, D.pos) : P0.tight * (1 - P0.pull * 0.5), { st } = shape(P0), ph = D.playing ? (D.pos / st) % 1 : 0.5, pinch = q * Math.exp(-ph * 6) * 0.8;
                        for (let sd = 0; sd < 2; sd++) { x.strokeStyle = sd ? '#c8a46a' : '#8a6a3a'; x.lineWidth = 4; x.beginPath(); for (let i = 0; i <= w; i += 3) { let u = i / w, kn = Math.pow(Math.abs(Math.sin(u * Math.PI * 4)), 6), wd = (h * 0.28) * (1 - kn * (0.3 + q * 0.6 + pinch)); let y = h / 2 + 6 + Math.sin(u * 40 + sd * Math.PI) * wd * 0.35; i ? x.lineTo(i, y) : x.moveTo(i, y); } x.stroke(); }
                        for (let k = 1; k < 4; k++) { x.fillStyle = '#e0c088'; x.beginPath(); x.ellipse(k * w / 4, h / 2 + 6, 5 + q * 3, 9 - q * 4 - pinch * 4, 0, 0, 7); x.fill(); }
                        S.txt(x, 'TIGHT ' + Math.round(q * 100) + '%', 6, 12, '#f0d8a8');
                    },
                    kill() { try { cr.stop(); } catch (e) {} stopAll(b)(); } };
            } },
        // gets hotter the longer you play
        { id: 'flush', jp: '火照', en: 'FLUSH', sub: 'heats up the longer + harder you play: more saturation, brighter, wider, then cools off when you stop. BUILD + COOL in seconds. KEEP LEVEL stops it just getting louder', face: 'blush', part: 'nb_x_flush', secret: true,
            p: [['heat', 'HEAT', 0.6, F.pct], ['build', 'BUILD', 0.35, F.ms(0.5, 30, 1.6)], ['cool', 'COOL', 0.35, F.ms(0.5, 30, 1.6)], ['colour', 'COLOUR', 0.5, v => v < 0.4 ? 'warm' : v > 0.6 ? 'blush' : 'skin'], ['glow', 'GLOW', 0.4, F.pct], ['keep', 'KEEP LEVEL', 0, F.pct], ['out', 'OUT', 0.75, F.db(-12, 6)], ['mix', 'MIX', 1, F.pct]],
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-heat', 1) : null, pre = b.g(1), sh = ctx.createWaveShaper(), lp = bq(ctx, 'lowpass', 3000, 0.8), tilt = bq(ctx, 'peaking', 2500, 0.8), warm = bq(ctx, 'lowshelf', 220), og = b.g(1);
                let dl = ctx.createDelay(0.05), lfo = ctx.createOscillator(), dg = b.g(0), cg = b.g(0), P0 = null, an = null, hs = null, h1 = b.g(0), h2 = b.g(0), h3 = b.g(0), hn = b.g(3), h4 = b.g(0), kg = b.g(1), ksh = ctx.createWaveShaper(), kk = -1;
                sh.curve = curveOf(x => Math.tanh(x * 1.4) / Math.tanh(1.4)); sh.oversample = '2x'; dl.delayTime.value = 0.012; lfo.frequency.value = 0.31; lfo.connect(dg); dg.connect(dl.delayTime); lfo.start();
                b.in.connect(pre); pre.connect(sh); sh.connect(warm); warm.connect(tilt); tilt.connect(lp); lp.connect(kg); kg.connect(og); og.connect(b.wet); lp.connect(dl); dl.connect(cg); cg.connect(b.wet);
                if (w) {
                    hs = ctx.createWaveShaper(); hs.curve = curveOf(x => x <= 0 ? 0 : Math.tanh(x * 1.5) / Math.tanh(1.5));
                    b.in.connect(w); w.connect(hn); hn.connect(hs); hs.connect(h1); hs.connect(h2); hs.connect(h3); h1.connect(pre.gain); h2.connect(lp.frequency); h3.connect(dg.gain); hs.connect(h4); h4.connect(ksh); ksh.connect(kg.gain);
                    an = tap(ctx, hs, 256);
                }
                return { in: b.in, out: b.out, wk: !w,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), c = p.colour;
                        if (w) { w.parameters.get('att').value = 0.5 + Math.pow(p.build, 1.6) * 29.5; w.parameters.get('rel').value = 0.5 + Math.pow(p.cool, 1.6) * 29.5; S2('heat', h1.gain, p.heat * 5); S2('heat', h2.gain, p.heat * 9000); S2('glow', h3.gain, p.glow * 0.004); S2('keep', h4.gain, p.keep || 0);
                            let k2 = Math.round(p.heat * 40); if (k2 !== kk) { kk = k2; let hk = 3.5 * p.heat; ksh.curve = curveOf(u => u <= 0 ? 0 : 1 / (1 + hk * u) - 1); } }
                        lp.frequency.value = w ? 2200 : 2200 + p.heat * 6000; pre.gain.value = 1; dg.gain.value = p.glow * 0.0015;
                        tilt.frequency.value = 1400 + c * 2400; tilt.gain.value = -2 + c * 6; warm.gain.value = 4 - c * 3;
                        S2('glow', cg.gain, p.glow * 0.6); S2('out', og.gain, db2g(-12 + p.out * 18) * 0.5); S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix);
                    },
                    ap: { out: [[og.gain, v => db2g(-12 + v * 18) * 0.5]], mix: mixAp(b) },
                    draw(x, w2, h, D) {
                        let e = 0; if (an) { let d = an._f || (an._f = new Float32Array(256)); an.getFloatTimeDomainData(d); e = Math.max(0, d[0]); }
                        this._e = (this._e || 0) * 0.8 + e * 0.2;
                        let g = x.createLinearGradient(0, 0, w2, 0); g.addColorStop(0, '#1a0608'); g.addColorStop(1, 'rgb(' + Math.round(60 + this._e * 190) + ',' + Math.round(10 + this._e * 40) + ',' + Math.round(30 + this._e * 40) + ')'); x.fillStyle = g; x.fillRect(0, 0, w2, h); if (!P0) return;
                        let X0 = 14, Y0 = 18, H0 = h - 28; x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(X0, Y0, 8, H0); x.fillStyle = '#ff5a7a'; x.fillRect(X0, Y0 + H0 * (1 - this._e), 8, H0 * this._e); x.beginPath(); x.arc(X0 + 4, Y0 + H0 + 4, 7, 0, 7); x.fill();
                        for (let i = 0; i < 18; i++) { let u = (i * 0.61 + D.now * (0.05 + this._e * 0.3)) % 1; x.fillStyle = 'rgba(255,' + Math.round(140 + this._e * 80) + ',170,' + (0.15 + this._e * 0.5) * (1 - u) + ')'; x.beginPath(); x.arc(40 + (i * 37) % (w2 - 50), h - u * h, 2 + this._e * 4, 0, 7); x.fill(); }
                        S.txt(x, (w ? Math.round(this._e * 100) + '° · ' : 'no heat without the worklet · ') + ['warm', 'skin', 'blush'][P0.colour < 0.4 ? 0 : P0.colour > 0.6 ? 2 : 1], 30, 12, '#ffd8e0');
                    },
                    kill() { try { lfo.stop(); } catch (e) {} stopAll(b)(); } };
            } },
        { id: 'drip', jp: '垂', en: 'DRIP', sub: 'every hit leaves a copy that slides down in pitch + gets darker. FALL = how far, THICK = how slow + dark, HANG = how long before it drops, SPREAD = stereo', face: 'jar', part: 'nb_drip', jar: true,
            p: [['sens', 'FEEL', 0.5, F.pct], ['fall', 'FALL', 0.35, v => Math.round(v * 36) + 'st'], ['len', 'LENGTH', 0.3, F.ms(0.1, 4, 1.4)], ['thick', 'THICK', 0.5, F.pct], ['hang', 'HANG', 0, F.ms(0, 0.4)], ['n', 'DRIPS', 0.4, v => String(1 + Math.round(v * 7))], ['tone', 'TONE', 0.7, F.hz(400, 16000)], ['spread', 'SPREAD', 0, F.pct], ['mix', 'MIX', 0.45, F.pct]],
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-drip') : null, lp = bq(ctx, 'lowpass', 9000, 0.7), P0 = null, an = null, drops = [], dsp = ctx.createChannelSplitter(2), dmg = ctx.createChannelMerger(2), drd = ctx.createDelay(0.05);
                drd.delayTime.value = 0; dsp.connect(dmg, 0, 0); dsp.connect(drd, 1); drd.connect(dmg, 0, 1);
                if (w) { b.in.connect(w); w.connect(lp); lp.connect(dsp); dmg.connect(b.wet); }
                an = tap(ctx, b.in, 512);
                return { in: b.in, out: b.out, wk: !w,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip);
                        if (w) { let Q = n => w.parameters.get(n); Q('sens').value = p.sens; S2('fall', Q('fall'), p.fall * 36); Q('len').value = 0.1 + Math.pow(p.len, 1.4) * 3.9; Q('thick').value = p.thick; Q('hang').value = p.hang * 0.4; Q('n').value = 1 + Math.round(p.n * 7); }
                        S2('tone', lp.frequency, expo(400, 16000, p.tone)); S2('spread', drd.delayTime, (p.spread || 0) * 0.018); S2('mix', b.wet.gain, w ? p.mix * 1.3 : 0); S2('mix', b.dry.gain, w ? 1 - p.mix * 0.4 : 1);
                    },
                    get ap() { let a = { tone: [[lp.frequency, v => expo(400, 16000, v)]], mix: [[b.wet.gain, v => v * 1.3], [b.dry.gain, v => 1 - v * 0.4]] }; if (w) a.fall = [[w.parameters.get('fall'), v => v * 36]]; return a; },
                    draw(x, w2, h, D) {
                        x.fillStyle = 'rgba(14,16,20,0.4)'; x.fillRect(0, 0, w2, h); if (!P0) return;
                        let lv = S.meter(x, an); if (lv > 0.06 && lv > (this._l || 0) * 1.4 && drops.length < 14) for (let k = 0; k < 1 + Math.round(lv * 4); k++) drops.push({ x: 10 + Math.random() * (w2 - 20), y: 16, v: 0, r: 2 + Math.random() * 3 }); this._l = lv;
                        if (Math.random() < 0.012 && drops.length < 6) drops.push({ x: 10 + Math.random() * (w2 - 20), y: 16, v: 0, r: 1.5 + Math.random() * 2 });
                        x.fillStyle = '#f2f0e8'; x.beginPath(); x.moveTo(0, 0); x.lineTo(w2, 0); x.lineTo(w2, 13); for (let i = w2; i >= 0; i -= 6) x.lineTo(i, 14 + Math.sin(i * 0.37 + D.now) * 1.5 + (Math.sin(i * 1.7) > 0.8 ? 4 : 0)); x.closePath(); x.fill();
                        let sp = 0.3 + (1 - P0.thick) * 1.4;
                        drops.forEach(d => { d.v = Math.min(sp * 2, d.v + 0.02 * sp); d.y += d.v; x.strokeStyle = 'rgba(245,245,240,0.45)'; x.lineWidth = d.r * 0.6; x.beginPath(); x.moveTo(d.x, 14); x.lineTo(d.x, d.y); x.stroke(); let g = x.createRadialGradient(d.x - d.r * 0.3, d.y - d.r * 0.3, 0, d.x, d.y, d.r + d.v); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cfcac0'); x.fillStyle = g; x.beginPath(); x.ellipse(d.x, d.y, d.r + d.v * 0.4, d.r + d.v, 0, 0, 7); x.fill(); });
                        drops = drops.filter(d => d.y < h + 10);
                        S.txt(x, 'FALLS ' + Math.round(P0.fall * 36) + 'st' + (w ? '' : ' (needs the worklet)'), 6, h - 6, '#f6f4ee');
                    },
                    kill: stopAll(b) };
            } },
        { id: 'slosh', jp: '波', en: 'SLOSH', sub: 'liquid effect, like the sound is in a water tank. SLOSH, THICK, BUBBLES, MUFFLE', face: 'milk', part: 'nb_slosh', jar: true,
            p: [['shove', 'SHOVE', 0, F.pick(['every kick', 'every beat', 'every bar', 'every 2 bars'])], ['amt', 'SLOSH', 0.6, F.pct], ['thick', 'THICK', 0.5, F.pct], ['glass', 'GLASS', 0.3, F.pct], ['bub', 'BUBBLES', 0.25, F.pct], ['tone', 'MUFFLE', 0.3, F.pct], ['sway', 'SWAY', 1, F.pct], ['mix', 'MIX', 1, F.pct]],
            make(ctx) {
                let b = box(ctx), lp = bq(ctx, 'lowpass', 12000, 1.2), pan = ctx.createStereoPanner(), gl = bq(ctx, 'bandpass', 1800, 30), glg = b.g(0), osc = ctx.createOscillator(), env = b.g(0), pg = b.g(0), lg = b.g(0), P0 = null, sig = 4, bpm = 120, shoves = [];
                b.in.connect(lp); lp.connect(pan); pan.connect(b.wet); pan.connect(gl); gl.connect(glg); glg.connect(b.wet);
                osc.connect(env); env.connect(pg); pg.connect(pan.pan); env.connect(lg); lg.connect(lp.detune); osc.start();
                const tau = p => 0.25 + p.thick * 1.6;
                const shove = t => { env.gain.cancelScheduledValues(t); env.gain.setTargetAtTime(1, t, 0.03); env.gain.setTargetAtTime(0, t + 0.08, tau(P0)); if (!offline(ctx)) { shoves.push(t); if (shoves.length > 8) shoves.shift(); } };
                return { in: b.in, out: b.out,
                    set(p, now, info, skip) {
                        P0 = p; sig = info.sig || 4; bpm = info.bpm; let S2 = setter(ctx, now, skip);
                        osc.frequency.value = 0.7 + (1 - p.thick) * 2.6; S2('amt', pg.gain, p.amt * 0.95 * (p.sway == null ? 1 : p.sway)); S2('amt', lg.gain, p.amt * 900);
                        lp.frequency.value = expo(16000, 1200, p.tone); gl.frequency.value = 1400 + (1 - p.thick) * 1600; S2('glass', glg.gain, p.glass * 2.5);
                        S2('mix', b.wet.gain, p.mix); S2('mix', b.dry.gain, 1 - p.mix);
                    },
                    kick(t) { if (P0 && idx(P0.shove, 4) === 0) shove(t); },
                    sched(b0, b1, tb) {
                        if (!P0) return;
                        let m = idx(P0.shove, 4), every = [0, 1, sig, sig * 2][m];
                        if (every) for (let k = Math.ceil(b0 / every - 1e-9); k * every < b1; k++) shove(tb(k * every));
                        if (P0.bub > 0.01) for (let k = Math.ceil(b0 * 4 - 1e-9); k / 4 < b1; k++) {
                            if (hsh(k * 2.71 + 0.9) >= P0.bub * 0.45) continue;
                            let t = tb(k / 4 + hsh(k * 7.3) * 0.2), o = ctx.createOscillator(), g = ctx.createGain(), f0 = 500 + hsh(k * 4.1) * 1300 * (1 - P0.thick * 0.5);
                            o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 1.9, t + 0.035); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09 * P0.bub, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0002, t + 0.05);
                            o.connect(g); g.connect(b.wet); o.start(t); o.stop(t + 0.07);
                        }
                    },
                    rest() { env.gain.cancelScheduledValues(ctx.currentTime); env.gain.setTargetAtTime(0, ctx.currentTime, 0.1); },
                    ap: { amt: [[pg.gain, v => v * 0.95]], mix: mixAp(b) },
                    draw(x, w2, h, D) {
                        x.fillStyle = '#0e0d0c'; x.fillRect(0, 0, w2, h); if (!P0) return;
                        let now = ctx.currentTime, sw = 0; shoves.forEach(t => { if (now >= t) sw += Math.exp(-(now - t) / tau(P0)) * Math.sin((now - t) * osc.frequency.value * 6.283); });
                        sw = Math.max(-1, Math.min(1, sw)) * P0.amt;
                        let cx = w2 / 2, top = 16, bot = h - 6, jw = 70;
                        x.save(); x.beginPath(); x.rect(cx - jw / 2, top, jw, bot - top); x.clip();
                        x.fillStyle = '#f2efe6'; x.beginPath(); x.moveTo(cx - jw / 2, bot); for (let i = 0; i <= jw; i += 2) { let u = i / jw - 0.5, y = top + (bot - top) * 0.45 + u * sw * 40 + Math.sin(i * 0.3 + D.now * 4) * 1.5; x.lineTo(cx - jw / 2 + i, y); } x.lineTo(cx + jw / 2, bot); x.fill();
                        for (let i = 0; i < 6 * P0.bub + 1; i++) { let u = (D.now * 0.4 + i * 0.37) % 1; x.strokeStyle = 'rgba(80,80,80,0.5)'; x.beginPath(); x.arc(cx - 20 + (i * 13) % 40, bot - u * (bot - top) * 0.5, 2, 0, 7); x.stroke(); }
                        x.restore(); x.strokeStyle = 'rgba(220,230,255,0.6)'; x.lineWidth = 2; x.strokeRect(cx - jw / 2, top, jw, bot - top); x.fillStyle = '#888'; x.fillRect(cx - jw / 2 - 3, top - 5, jw + 6, 6);
                        S.txt(x, ['ON THE KICK', 'EVERY BEAT', 'EVERY BAR', 'EVERY 2 BARS'][idx(P0.shove, 4)], 6, 11, '#f2efe6');
                    },
                    kill() { try { osc.stop(); } catch (e) {} stopAll(b)(); } };
            } },
        { id: 'possess', jp: '憑', en: 'POSSESS', sub: 'creepy layers under + over the sound: a low voice, growl, metal ring, whisper + a thin high voice. LATE delays them a little', face: 'grave', part: 'cr_possess', creepy: true,
            p: [['down', 'DOWN', 0.5, F.pick(['-5', '-7', '-12', '-17', '-24'])], ['growl', 'GROWL', 0.5, F.pct], ['ring', 'RING', 0.3, F.pct], ['whisper', 'WHISPER', 0.3, F.pct], ['other', 'OTHER', 0.15, F.pct], ['width', 'WIDTH', 0.6, F.pct], ['late', 'LATE', 0, F.ms(0, 0.12)], ['mix', 'MIX', 0.6, F.pct]],
            make(ctx) {
                let b = box(ctx), wd = ctx._nbwk ? wkNode(ctx, 'nb-pitch') : null, wu = ctx._nbwk ? wkNode(ctx, 'nb-pitch') : null, fo = ctx._nbwk ? wkNode(ctx, 'nb-follow', 1) : null, P0 = null, an = null;
                let gsh = ctx.createWaveShaper(), gpre = b.g(1), chest = bq(ctx, 'peaking', 180, 1), mud = bq(ctx, 'lowpass', 3500, 0.7), rv = b.g(1), rosc = ctx.createOscillator(), rg = b.g(0), dg = b.g(0.8);
                let up = bq(ctx, 'highpass', 900), upan = ctx.createStereoPanner(), ug = b.g(0), dpan = ctx.createStereoPanner();
                let nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), nd = nb.getChannelData(0); noiseFill(nd, 3027);
                let ns = ctx.createBufferSource(), nf = bq(ctx, 'bandpass', 2600, 1.2), nv = b.g(0), ng = b.g(0), nfe = b.g(0);
                ns.buffer = nb; ns.loop = true; ns.start(); rosc.frequency.value = 47; rosc.start();
                chest.gain.value = 6; gsh.oversample = '2x';
                let lt = ctx.createDelay(0.15), lin = b.g(1); lt.delayTime.value = 0; b.in.connect(lin); lin.connect(lt);
                if (wd) { lt.connect(wd); wd.connect(gpre); gpre.connect(gsh); gsh.connect(chest); chest.connect(mud); mud.connect(rv); rosc.connect(rg); rg.connect(rv.gain); rv.connect(dg); dg.connect(dpan); dpan.connect(b.wet); }
                if (wu) { lt.connect(wu); wu.connect(up); up.connect(ug); ug.connect(upan); upan.connect(b.wet); }
                if (fo) { lt.connect(fo); fo.connect(nfe); nfe.connect(nv.gain); ns.connect(nf); nf.connect(nv); nv.connect(ng); ng.connect(b.wet); }
                an = tap(ctx, b.wet, 512);
                return { in: b.in, out: b.out, wk: !wd,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), k = Math.round(p.growl * 20);
                        if (wd) { wd.parameters.get('shift').value = [-5, -7, -12, -17, -24][idx(p.down, 5)]; wd.parameters.get('win').value = 0.07; }
                        if (wu) { wu.parameters.get('shift').value = 12; wu.parameters.get('win').value = 0.05; }
                        if (k !== this._k) { this._k = k; gsh.curve = curveOf(x => Math.tanh(x * (1 + p.growl * 12)) / Math.tanh(1 + p.growl * 12)); }
                        gpre.gain.value = 1 + p.growl * 2; S2('ring', rg.gain, p.ring * 0.9); rv.gain.value = 1 - p.ring * 0.45; dg.gain.value = 0.8 * Math.pow(10, -17 * (1 - Math.exp(-5.5 * p.growl)) / 20); S2('late', lt.delayTime, (p.late || 0) * 0.12);
                        S2('other', ug.gain, p.other * 0.7); upan.pan.value = p.width * 0.8; dpan.pan.value = -p.width * 0.3;
                        if (fo) { fo.parameters.get('att').value = 0.004; fo.parameters.get('rel').value = 0.12; S2('whisper', nfe.gain, p.whisper * 6); ng.gain.value = 0.5; }
                        S2('mix', b.wet.gain, wd ? p.mix * 0.8 : 0); S2('mix', b.dry.gain, wd ? 1 - p.mix * 0.7 : 1);
                    },
                    ap: { mix: [[b.wet.gain, v => v * 0.8], [b.dry.gain, v => 1 - v * 0.7]] },
                    draw(x, w, h, D) {
                        let lv = S.meter(x, an); this._l = Math.max(lv, (this._l || 0) * 0.9);
                        x.fillStyle = 'rgba(6,0,0,0.45)'; x.fillRect(0, 0, w, h); if (!P0) return;
                        let d = an && (an._f || (an._f = new Float32Array(an.fftSize))); if (an) an.getFloatTimeDomainData(d); else return;
                        const wave = (stride, amp, yo, col, wd, jag) => { x.strokeStyle = col; x.lineWidth = wd; x.beginPath(); for (let i = 0; i < w; i += 2) { let k = Math.floor(i / w * d.length / stride) % d.length, v = d[k] * amp + (jag ? (Math.random() - 0.5) * jag : 0); let y = h / 2 + yo + v * h * 0.8; i ? x.lineTo(i, y) : x.moveTo(i, y); } x.stroke(); };
                        let t = D.now;
                        if (P0.down > 0.02) { x.shadowColor = '#8a0010'; x.shadowBlur = 12; wave(0.5, 1.6 * P0.down, 6 + Math.sin(t * 0.7) * 4, 'rgba(120,0,16,' + (0.5 + P0.down * 0.4) + ')', 3 + P0.down * 5); x.shadowBlur = 0; }
                        if (P0.ring > 0.02) wave(1, 1.1, -4 + Math.sin(t * 1.3) * 3, 'rgba(220,40,60,' + (0.3 + P0.ring * 0.6) + ')', 1, P0.ring * 0.12);
                        if (P0.whisper > 0.02) { x.fillStyle = 'rgba(255,200,200,' + Math.min(0.5, P0.whisper * this._l * 4) + ')'; for (let i = 0; i < 60 * P0.whisper; i++) x.fillRect(Math.random() * w, h / 2 + (Math.random() - 0.5) * h * 0.7, 1, 1); }
                        wave(1, 1, 0, 'rgba(255,235,235,0.85)', 1.1);
                        S.txt(x, ([-5, -7, -12, -17, -24][idx(P0.down, 5)]) + ' st under' + (wd ? '' : ' (it needs the worklet to get in)'), 6, 11, '#ff6060');
                    },
                    kill() { try { ns.stop(); rosc.stop(); } catch (e) {} stopAll(b)(); } };
            } },
        { id: 'walls', jp: '壁', en: 'THE WALLS', sub: 'faint muffled copies of the sound, like its coming through a wall. HOW MANY, LOUD, CLOSE, CREEP, DARK', face: 'grave', part: 'hx_walls', creepy: true,
            p: [['n', 'HOW MANY', 0.5, v => String(2 + Math.round(v * 4))], ['amt', 'LOUD', 0.4, F.pct], ['follow', 'FOLLOW', 0.7, F.pct], ['close', 'CLOSE', 0.4, F.pct], ['creep', 'CREEP', 0.4, F.pct], ['dark', 'DARK', 0.4, F.pct], ['sync', 'IN TIME', 0, F.pick(['off', 'on'])], ['mix', 'MIX', 1, F.pct]],
            make(ctx) {
                let b = box(ctx), fo = ctx._nbwk ? wkNode(ctx, 'nb-follow', 1) : null, lp = bq(ctx, 'lowpass', 6000, 0.7), P0 = null, vs = [], an = null;
                let nb = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate), nd = nb.getChannelData(0); noiseFill(nd, 4036);
                let fg = b.g(0); if (fo) { b.in.connect(fo); fo.connect(fg); }
                for (let k = 0; k < 6; k++) {
                    let src = ctx.createBufferSource(), bp = bq(ctx, 'bandpass', 900 + k * 420, 3.5), syl = ctx.createOscillator(), sg = b.g(0), g = b.g(0), dl = ctx.createDelay(0.6), pn = ctx.createStereoPanner(), wob = ctx.createOscillator(), wg = b.g(0);
                    src.buffer = nb; src.loop = true; src.start(0, k * 0.37); syl.frequency.value = 3 + k * 0.9; syl.type = 'triangle'; syl.connect(sg); sg.connect(bp.frequency); syl.start();
                    dl.delayTime.value = 0.05 + k * 0.07; wob.frequency.value = 0.03 + k * 0.021; wob.connect(wg); wg.connect(pn.pan); wob.start();
                    src.connect(bp); bp.connect(g); g.connect(dl); dl.connect(pn); pn.connect(lp); fg.connect(g.gain);
                    vs.push({ src, syl, wob, sg, g, wg, bp });
                }
                lp.connect(b.wet); an = tap(ctx, lp, 512);
                return { in: b.in, out: b.out, wk: !fo,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), n = 2 + Math.round(p.n * 4);
                        let bh = (info.bpm || 120) / 60, sy = idx(p.sync || 0, 2);
                        vs.forEach((v, k) => { let on = k < n ? 1 : 0; v.g.gain.value = on * p.amt * (1 - p.follow) * 0.25; v.sg.gain.value = (300 + k * 120) * on; v.wg.gain.value = on * (0.2 + p.creep * 0.8); v.syl.frequency.value = sy ? bh * [2, 1.5, 3, 4, 2.667, 6][k] : 3 + k * 0.9; });
                        if (fo) { fo.parameters.get('att').value = 0.01; fo.parameters.get('rel').value = 0.25; S2('follow', fg.gain, p.follow * p.amt * 9); }
                        lp.frequency.value = expo(1200, 9000, p.close * (1 - p.dark * 0.6)); S2('mix', b.wet.gain, p.mix); b.dry.gain.value = 1;
                    },
                    ap: { mix: [[b.wet.gain, v => v]] },
                    draw(x, w, h, D) {
                        let lv = S.meter(x, an); this._l = Math.max(lv, (this._l || 0) * 0.93);
                        x.fillStyle = '#0a0806'; x.fillRect(0, 0, w, h); if (!P0) return;
                        // cracked wall picture. the cracks light up
                        x.strokeStyle = 'rgba(120,110,90,0.25)'; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(0, i * h / 6 + 4); x.lineTo(w, i * h / 6 + 4); x.stroke(); }
                        let n = 2 + Math.round(P0.n * 4);
                        for (let k = 0; k < n; k++) { let X0 = (k + 0.5) * w / n + Math.sin(D.now * (0.2 + k * 0.13) * (0.3 + P0.creep)) * 20, a = Math.min(1, this._l * 8 * (0.5 + Math.sin(D.now * (3 + k)) * 0.5)); x.strokeStyle = 'rgba(255,220,180,' + (0.15 + a * 0.7) + ')'; x.lineWidth = 1.2; x.beginPath(); let y = 14, xx = X0; x.moveTo(xx, y); while (y < h) { y += 6; xx += (Math.sin(k * 9 + y) * 5); x.lineTo(xx, y); } x.stroke(); }
                        S.txt(x, n + ' in the walls' + (fo ? '' : ' (they need the worklet to follow you)'), 6, 11, '#e8d8c0');
                    },
                    kill() { vs.forEach(v => { try { v.src.stop(); v.syl.stop(); v.wob.stop(); } catch (e) {} }); stopAll(b)(); } };
            } },
        { id: 'bleed', jp: '滲', en: 'BLEED', sub: 'smears + washes the sound like wet paint. SMEAR, WASH, COLOUR, DRIES, DRIFT', face: 'paper', part: 'cs_bleed', street: true,
            p: [['smear', 'SMEAR', 0.5, F.pct], ['wash', 'WASH', 0.4, F.pct], ['colour', 'COLOUR', 0.5, v => v < 0.4 ? 'warm' : v > 0.6 ? 'cold' : 'paper'], ['dry', 'DRIES', 0.5, F.pct], ['drift', 'DRIFT', 0, v => '±' + Math.round(v * 40) + 'c'], ['width', 'WIDTH', 0.5, F.pct], ['mix', 'MIX', 0.4, F.pct]],
            make(ctx) {
                let b = box(ctx), w = ctx._nbwk ? wkNode(ctx, 'nb-grain') : null, cv = ctx.createConvolver(), tl = bq(ctx, 'highshelf', 3000), lp = bq(ctx, 'lowpass', 8000), gg = b.g(0.8), cg = b.g(0.5), key = '', P0 = null, an = null;
                let soft = bq(ctx, 'lowpass', 3800, -3.0103), soft2 = bq(ctx, 'lowpass', 3800, -3.0103);
                if (w) { b.in.connect(w); w.connect(soft); soft.connect(soft2); soft2.connect(gg); gg.connect(tl); }
                b.in.connect(cv); cv.connect(cg); cg.connect(tl); if (w) gg.connect(cv);
                tl.connect(lp); lp.connect(b.wet); an = tap(ctx, b.wet, 512);
                return { in: b.in, out: b.out, wk: !w,
                    set(p, now, info, skip) {
                        P0 = p; let S2 = setter(ctx, now, skip), k = Math.round(p.dry * 8) + ':' + Math.round(p.colour * 4);
                        if (k !== key) { key = k; cv.buffer = irBuf(ctx, { kind: 2, len: 1 + (1 - p.dry) * 4, dark: 0.2 + (0.6 - p.colour * 0.5), decay: 1.5 + p.dry * 3, size: 0.6, width: 0.8 }); }
                        if (w) { let Q = n => w.parameters.get(n); Q('size').value = 0.06 + p.smear * 0.4; Q('dens').value = 18 + p.smear * 40; Q('pitch').value = 0; Q('spray').value = 0.1 + p.smear * 0.5; Q('rev').value = 0; Q('freeze').value = 0; Q('det').value = (p.drift || 0) * 40; Q('width').value = p.width == null ? 0.5 : p.width; }
                        tl.gain.value = (p.colour - 0.5) * 12; S2('wash', cg.gain, p.wash * 0.9); S2('mix', b.wet.gain, p.mix * 1.2); S2('mix', b.dry.gain, 1 - p.mix * 0.5);
                    },
                    ap: { mix: [[b.wet.gain, v => v * 1.2], [b.dry.gain, v => 1 - v * 0.5]] },
                    draw(x, w2, h, D) {
                        let lv = S.meter(x, an);
                        let pc = this._pc; if (!pc || pc.width !== w2 || pc.height !== h) { pc = this._pc = document.createElement('canvas'); pc.width = w2; pc.height = h; let q = pc.getContext('2d'); q.fillStyle = '#ece4d2'; q.fillRect(0, 0, w2, h); for (let i = 0; i < 260; i++) { q.strokeStyle = 'rgba(150,130,100,' + Math.random() * 0.08 + ')'; q.beginPath(); let a = Math.random() * w2, b2 = Math.random() * h; q.moveTo(a, b2); q.lineTo(a + (Math.random() - 0.5) * 30, b2 + (Math.random() - 0.5) * 6); q.stroke(); } }
                        let q = pc.getContext('2d');
                        if (P0) {
                            if (((this._t = (this._t || 0) + 1) % 3) === 0) { q.globalAlpha = 0.006 + P0.dry * 0.03; q.fillStyle = '#ece4d2'; q.fillRect(0, 0, w2, h); q.globalAlpha = 1; }
                            if (lv > 0.015) { let c = P0.colour < 0.4 ? [150, 30, 30] : P0.colour > 0.6 ? [30, 50, 140] : [70, 50, 80], r = 6 + P0.smear * 40 + lv * 60, X0 = (this._x = ((this._x || w2 * 0.2) + 7 + Math.random() * 10) % w2), Y0 = h * 0.35 + Math.random() * h * 0.4;
                                let g = q.createRadialGradient(X0, Y0, 0, X0, Y0, r); g.addColorStop(0, 'rgba(' + c + ',' + Math.min(0.5, 0.06 + lv * 3) + ')'); g.addColorStop(0.7, 'rgba(' + c + ',' + Math.min(0.2, 0.02 + lv) + ')'); g.addColorStop(1, 'rgba(' + c + ',0)'); q.fillStyle = g; q.fillRect(X0 - r, Y0 - r, r * 2, r * 2);
                                q.strokeStyle = 'rgba(' + c + ',' + Math.min(0.35, 0.05 + lv * 2) + ')'; q.lineWidth = 0.8; q.beginPath(); q.arc(X0, Y0, r * 0.8, 0, 7); q.stroke(); }
                        }
                        x.drawImage(pc, 0, 0);
                        S.txt(x, 'wet paper' + (w ? '' : ' (no grains without the worklet, just the wash)'), 6, 11, '#3a2a20');
                    },
                    kill: stopAll(b) };
            } }
    ];
    LIST.forEach(d => { const mk = d.make; d.make = ctx => { let before = new Set(ctx._nbw || []), I = mk(ctx), mine = [...(ctx._nbw || [])].filter(n => !before.has(n)), k = I.kill; I.kill = () => { bury(mine); if (k) k.call(I); }; return I; }; });
    const mid0 = v => Math.abs((v == null ? 0.5 : v) - 0.5) < 0.02, WOB = 'WOBBLE is off';
    const IDLE = {
        sieve: p => idx(p.rate, 8) ? {} : { shape: WOB, depth: WOB },
        echo: p => [0, 2].indexOf(idx(p.style, 5)) >= 0 ? { width: 'only in SPACE, DUAL + PING PONG' } : {},
        sway: p => idx(p.mode, 5) < 3 ? { fb: 'only in FLANGE + PHASE' } : {},
        cords: p => idx(p.src, 2) ? {} : { note: 'only when SINGS WITH is BUZZ' },
        chasm: p => { let o = idx(p.mode, 5) === 3 ? {} : { beat: 'only in ECHOES' }; if ((p.freeze || 0) >= 0.5) { o.fb = 'FREEZE holds it as it is'; o.damp = 'FREEZE holds it as it is'; } return o; },
        vortex: p => idx(p.mode, 3) ? { speed: 'only in ROTARY', dop: 'only in ROTARY', mics: 'only in ROTARY', drive: 'only in ROTARY' } : { rate: 'not in ROTARY (it has GEAR)', shape: 'not in ROTARY' },
        ring: p => idx(p.rate, 8) ? {} : { amt: WOB },
        whisper: p => idx(p.rate, 8) ? {} : { amt: WOB },
        strip: p => Object.assign({}, mid0(p.lmg) ? { lmf: 'LOW MID is flat' } : {}, mid0(p.hmg) ? { hmf: 'HIGH MID is flat' } : {}),
        scalpel: p => Object.assign({}, mid0(p.lg) ? { lf: 'LOW is flat' } : {}, mid0(p.mg) ? { mf: 'MID 1 is flat', mq: 'MID 1 is flat' } : {}, mid0(p.m2g) ? { m2f: 'MID 2 is flat', m2q: 'MID 2 is flat' } : {}, mid0(p.hg) ? { hf: 'HIGH is flat' } : {}, mid0(p.d1) ? { t1: 'MID 1 DYNAMIC is in the middle (off)' } : {}, mid0(p.d2) ? { t2: 'MID 2 DYNAMIC is in the middle (off)' } : {}),
        cinder: p => (p.chaos || 0) > 0.01 ? {} : { every: 'CHAOS is at 0' },
        pump: p => idx(p.mode, 2) === 0 ? { src: 'only when WHEN is HITS', sens: 'only when WHEN is HITS', att: 'only when WHEN is HITS', rel: 'only when WHEN is HITS' } : idx(p.src, 3) === 2 ? {} : { sens: 'only when it LISTENS TO the ticked tracks (FOLLOW)', att: 'only with FOLLOW', rel: 'only with FOLLOW' },
        corset: p => Object.assign({}, (p.fdep || 0) < 0.01 ? { flen: 'FILTER is at 0', fcut: 'FILTER is at 0', fres: 'FILTER is at 0', fkind: 'FILTER is at 0' } : {}, (p.pdep || 0) < 0.01 ? { plen: 'PAN is at 0' } : {}),
        rider: p => (p.breath || 0) > 0.01 ? {} : { bdip: 'BREATHS is off' },
        choir: p => { let n = idx(p.n, 3) + 1, r = {}; if (n < 2) r.i1 = 'only with 2+ VOICES'; if (n < 3) r.i2 = 'only with 3 VOICES'; return r; },
        fang: p => mid0(p.attack) && mid0(p.sustain) ? { speed: 'SNAP + TAIL are both in the middle' } : {},
        slosh: (p, pr) => idx(p.shove, 4) === 0 && pr && !pr.tracks.some(t => t.mix && t.mix.key) ? { amt: 'theres no KICK track to shove it (SHOVE: every beat works anywhere)', thick: 'nothing is shoving it yet' } : {}
    };
    LIST.forEach(d => { if (IDLE[d.id]) d.idle = IDLE[d.id]; });
    const BY = {}; LIST.forEach(d => { BY[d.id] = d; d.def = {}; d.p.forEach(p => { d.def[p[0]] = p[2]; }); if (d.fix) d.def._v = d.ver; });
    function fresh(id) { let d = BY[id]; return { type: id, on: 1, p: Object.assign({}, d.def, d.extra ? d.extra() : {}) }; }
    let WTP = null; try { WTP = new Function(WT_SRC + '\nreturn WT;')(); } catch (e) {}
    window.NBFX = { oneOut, LIST, BY, fresh, ready, SYNC, DTIME, SHAPES, WT: WTP, at, when, untouch, CAGE: { steps: CGST, lr: CGLR } };
})();
