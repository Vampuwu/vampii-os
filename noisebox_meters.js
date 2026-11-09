
(function () {
    const X = window.NBX;
    const KEY = 'vmp_nb_meters';
    const LIST = [['lvl', 'レベル', 'LEVELS'], ['loud', '音圧', 'LOUDNESS'], ['spec', 'スペクトル', 'SPECTRUM'], ['gram', '声紋', 'SPECTROGRAM'], ['wave', '波形', 'WAVEFORM'], ['stereo', '左右', 'STEREO'], ['scope', '波', 'SCOPE'], ['vu', '針', 'VU']];
    let ST = { show: { lvl: 1, spec: 1, loud: 1, stereo: 1 }, pop: {}, opt: {} };
    try { let o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o && o.show) { if (!('lvl' in o.show)) o.show.lvl = 1; ST = Object.assign(ST, o); } } catch (e) {}
    ST.opt = Object.assign({ slope: 4.5, smooth: 6, side: 1, vuRef: -18 }, ST.opt || {});
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) {} };
    const db = v => 20 * Math.log10(Math.max(1e-9, v));
    const pw = l => Math.pow(10, (l + 0.691) / 10), lu = p => -0.691 + 10 * Math.log10(Math.max(1e-12, p));

    // Loudness meter. LUFS confuses me but I tried
    const HB = 800, hbin = l => Math.max(0, Math.min(HB - 1, Math.floor((l + 70) * 10)));
    const mkH = () => ({ c: new Float64Array(HB), p: new Float64Array(HB), n: 0, s: 0 });
    const hAdd = (H, l) => { if (!(l > -70)) return; let b = hbin(l), q = pw(l); H.c[b]++; H.p[b] += q; H.n++; H.s += q; };
    function integ(H) {
        if (!H.n) return -Infinity; let g = lu(H.s / H.n) - 10, b0 = hbin(g), c = 0, p = 0;
        for (let b = b0; b < HB; b++) { c += H.c[b]; p += H.p[b]; }
        return c ? lu(p / c) : -Infinity;
    }
    function lraOf(H) {
        if (H.n < 10) return NaN; let g = lu(H.s / H.n) - 20, b0 = Math.max(0, hbin(g)), tot = 0;
        for (let b = b0; b < HB; b++) tot += H.c[b]; if (tot < 10) return NaN;
        let lo = NaN, hi = NaN, c = 0; for (let b = b0; b < HB; b++) { c += H.c[b]; if (isNaN(lo) && c >= tot * 0.1) lo = b; if (isNaN(hi) && c >= tot * 0.95) { hi = b; break; } }
        return (hi - lo) / 10;
    }

    let T = null;
    function taps() {
        let L = X.live(); if (!L || !L.R || !L.R.M) return null;
        if (T && T.L === L) { if (!T.mn && T.c._nbwk && !T.wkTry) wk(T); return T; }
        if (T && T.mn) { try { T.mn.port.postMessage('kill'); T.mn.disconnect(); } catch (e) {} }
        let c = L.ctx, out = L.R.M.out, sp = c.createChannelSplitter(2);
        const an = (n, sm) => { let a = c.createAnalyser(); a.fftSize = n; a.smoothingTimeConstant = sm == null ? 0 : sm; return a; };
        let aL = an(2048), aR = an(2048), fL = an(8192, 0.7), fS = an(8192, 0.7);
        out.connect(sp); sp.connect(aL, 0); sp.connect(aR, 1); out.connect(fL);
        let gl = c.createGain(), gr = c.createGain(), sd = c.createGain(); gl.gain.value = 0.5; gr.gain.value = -0.5; sd.channelCount = 1; sd.channelCountMode = 'explicit';
        sp.connect(gl, 0); sp.connect(gr, 1); gl.connect(sd); gr.connect(sd); sd.connect(fS);
        T = { L, c, sr: c.sampleRate, aL, aR, fL, fS, bL: new Float32Array(2048), bR: new Float32Array(2048), fb: new Float32Array(4096), fs: new Float32Array(4096), peak: new Float32Array(4096).fill(-140),
            sub: [], H: mkH(), HS: mkH(), M: -Infinity, S: -Infinity, I: -Infinity, lra: NaN, tpMax: 0, spMax: 0, tp: 0, tpAt: 0, posts: [], fr: { pL: 0, pR: 0, tL: 0, tR: 0 },
            lhist: [], phist: [], vu: [0, 0], vuV: [0, 0], vuX: [0, 0], ppm: [-120, -120], hold: [-120, -120], holdAt: [0, 0], hist: [], cor: 0, corB: 0, gramCol: 0 };
        T.out = out; if (c._nbwk) wk(T);
        { let kL = an(2048), kR = an(2048); [[0, kL], [1, kR]].forEach(([ch, a]) => { let hs = c.createBiquadFilter(), hp = c.createBiquadFilter(); hs.type = 'highshelf'; hs.frequency.value = 1681; hs.gain.value = 4; hp.type = 'highpass'; hp.frequency.value = 38; hp.Q.value = 0.5; sp.connect(hs, ch); hs.connect(hp); hp.connect(a); }); T.kL = kL; T.kR = kR; T.kbL = new Float32Array(2048); T.kbR = new Float32Array(2048); }
        return T;
    }
    function wk(t) {
        t.wkTry = 1; try { let c = t.c, mn = new AudioWorkletNode(c, 'nb-meter', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1], channelCount: 2, channelCountMode: 'explicit', channelInterpretation: 'speakers' }), z = c.createGain(); z.gain.value = 0; t.out.connect(mn); mn.connect(z); z.connect(c.destination); mn.port.onmessage = e => feed(t, e.data); t.mn = mn; t.sub = []; t.H = mkH(); t.HS = mkH(); } catch (e) { t.mn = null; }
    }
    function block(t, ms) {
        t.sub.push(ms); if (t.sub.length > 30) t.sub.shift();
        let n = t.sub.length, s4 = 0, s30 = 0; for (let i = 0; i < n; i++) { s30 += t.sub[i]; if (i >= n - 4) s4 += t.sub[i]; }
        t.M = n >= 4 ? lu(s4 / 4) : -Infinity; t.S = lu(s30 / n);
        if (t.playing) { hAdd(t.H, t.M); if (n >= 30) hAdd(t.HS, t.S); t.lhist.push(t.S); if (t.lhist.length > 900) t.lhist.shift(); let pk = db(t.tp3 || 0); t.phist.push(isFinite(t.S) && pk > -90 ? pk - t.S : NaN); if (t.phist.length > 900) t.phist.shift(); }
        t.blkN = (t.blkN || 0) + 1; if (t.blkN % 5 === 0) { t.I = integ(t.H); t.lra = lraOf(t.HS); }
    }
    function feed(t, d) {
        if (!t || t !== T) return;
        if (d.idle) { t.idle = (t.idle || 0) + 1; return; } t.idle = 0;
        let now = performance.now(); (d.b || []).forEach(ms => block(t, ms));
        let f = t.fr; f.pL = Math.max(f.pL, d.pL); f.pR = Math.max(f.pR, d.pR); f.tL = Math.max(f.tL, d.tL); f.tR = Math.max(f.tR, d.tR);
        let tp = Math.max(d.tL, d.tR), sp = Math.max(d.pL, d.pR); if (t.playing) { t.tpMax = Math.max(t.tpMax, tp); t.spMax = Math.max(t.spMax, sp); }
        if (sp >= 0.999) t.clipAt = now; if (tp > 0.891) t.overAt = now;
        d.t = now; t.posts.push(d); while (t.posts.length > 2 && now - t.posts[0].t > 3000) t.posts.shift();
        let m3 = 0; for (const q of t.posts) { let v = Math.max(q.tL, q.tR); if (v > m3) m3 = v; } t.tp3 = m3;
    }
    function over(t, ms) {
        let now = performance.now(), o = { sL: 0, sR: 0, aL: 0, aR: 0, lr: 0, mm: 0, ss: 0, bl: 0, bll: 0, brr: 0, n: 0 };
        for (let i = t.posts.length - 1; i >= 0 && now - t.posts[i].t <= ms; i--) { let q = t.posts[i]; for (const k in o) o[k] += q[k] || 0; }
        return o;
    }

    function read(now) {
        let t = taps(); if (!t) return null;
        t.aL.getFloatTimeDomainData(t.bL); t.aR.getFloatTimeDomainData(t.bR); t.fL.getFloatFrequencyData(t.fb); t.fS.getFloatFrequencyData(t.fs);
        let dt = Math.min(0.25, Math.max(0.001, (now - (t.lastNow || now)) / 1000)); t.steps = Math.max(0, Math.min(30, Math.round(dt * 60))); t.lastNow = now;
        t.playing = X.playing();
        let pl = 0, pr = 0, sl = 0, sr = 0;
        for (let i = 0; i < 2048; i++) { let a = Math.abs(t.bL[i]), b = Math.abs(t.bR[i]); if (a > pl) pl = a; if (b > pr) pr = b; sl += t.bL[i] * t.bL[i]; sr += t.bR[i] * t.bR[i]; }
        let live = t.mn && (t.idle || 0) < 3 && t.posts.length;
        if (live) { let f = t.fr; pl = Math.max(f.pL, 0); pr = Math.max(f.pR, 0); t.tpL = f.tL; t.tpR = f.tR; t.fr = { pL: 0, pR: 0, tL: 0, tR: 0 }; }
        else if (!t.mn) {
            t.kL.getFloatTimeDomainData(t.kbL); t.kR.getFloatTimeDomainData(t.kbR); let ms = 0; for (let i = 0; i < 2048; i++) ms += t.kbL[i] * t.kbL[i] + t.kbR[i] * t.kbR[i];
            if (!t.lastBlk || now - t.lastBlk >= 100) { t.lastBlk = now; block(t, ms / 2048); }
            let pk = Math.max(pl, pr); if (t.playing) { t.tpMax = Math.max(t.tpMax, pk); t.spMax = Math.max(t.spMax, pk); } t.tp3 = pk; t.tpL = pl; t.tpR = pr;
            t.posts = [{ t: now, sL: sl, sR: sr, aL: 0, aR: 0, n: 2048, lr: 0, mm: 0, ss: 0 }]; for (let i = 0; i < 2048; i++) { let a = t.bL[i], b = t.bR[i]; t.posts[0].aL += Math.abs(a); t.posts[0].aR += Math.abs(b); t.posts[0].lr += a * b; t.posts[0].mm += (a + b) * (a + b); t.posts[0].ss += (a - b) * (a - b); }
            if (pl > 0.999 || pr > 0.999) t.clipAt = now;
        } else { pl = 0; pr = 0; t.tpL = t.tpR = 0; }
        t.pkL = pl; t.pkR = pr; t.tp = Math.max(t.tpL || 0, t.tpR || 0);
        [pl, pr].forEach((p, k) => { let d = db(p); t.ppm[k] = Math.max(d, t.ppm[k] - 20 / 1.7 * dt); if (d >= t.hold[k] || now - t.holdAt[k] > 2000) { t.hold[k] = d; t.holdAt[k] = now; } });
        let o = over(t, 300); t.rms = [o.n ? Math.sqrt(o.sL / o.n) : 0, o.n ? Math.sqrt(o.sR / o.n) : 0];
        let o2 = over(t, 120), av = o2.n ? [o2.aL / o2.n * Math.PI / (2 * Math.SQRT2), o2.aR / o2.n * Math.PI / (2 * Math.SQRT2)] : t.playing ? (t.av0 || [0, 0]) : [0, 0]; t.av0 = av;
        for (let k = 0; k < 2; k++) { let st = Math.ceil(dt / 0.004), h = dt / st, z = 0.82, wn = 13.75; for (let s = 0; s < st; s++) { let a = wn * wn * (av[k] - t.vuX[k]) - 2 * z * wn * t.vuV[k]; t.vuV[k] += a * h; t.vuX[k] += t.vuV[k] * h; } t.vu[k] = Math.max(0, t.vuX[k]); }
        let cr = o.sL && o.sR ? o.lr / Math.sqrt(o.sL * o.sR) : 0, cb = o.bll && o.brr ? o.bl / Math.sqrt(o.bll * o.brr) : NaN;
        t.cor += (cr - t.cor) * Math.min(1, dt * 6); t.corB = isNaN(cb) ? t.corB : t.corB + (cb - t.corB) * Math.min(1, dt * 6); t.width = o.mm + o.ss > 1e-12 ? Math.sqrt(o.ss) / (Math.sqrt(o.mm) + Math.sqrt(o.ss)) : 0;
        t.bal = o.sL + o.sR > 1e-12 ? (Math.sqrt(o.sR) - Math.sqrt(o.sL)) / (Math.sqrt(o.sR) + Math.sqrt(o.sL)) : 0;
        let rl0 = Math.sqrt(sl / 2048), rr0 = Math.sqrt(sr / 2048);
        if (t.playing) { t.hist.push([pl, pr, rl0 * 1.41, rr0 * 1.41]); while (t.hist.length > 1600) t.hist.shift(); }
        { let fall = 0.4 * Math.max(1, t.steps || 1); for (let i = 0; i < 4096; i++) { let v = t.fb[i]; t.peak[i] = v > t.peak[i] ? v : t.peak[i] - fall; } }
        return t;
    }
    const resetLoud = () => { if (T) { T.H = mkH(); T.HS = mkH(); T.I = -Infinity; T.lra = NaN; T.tpMax = 0; T.spMax = 0; T.lhist = []; T.phist = []; T.clipAt = T.overAt = 0; T.hold = [-120, -120]; } };

    let SK = null, skAt = 0, probe = null;
    function rgb(v, root) {
        if (!probe) { probe = document.createElement('i'); probe.style.display = 'none'; }
        if (probe.parentNode !== root) root.appendChild(probe);
        probe.style.color = ''; probe.style.color = v; let m = getComputedStyle(probe).color.match(/[\d.]+/g) || [0, 0, 0];
        return [+m[0], +m[1], +m[2], m[3] != null ? +m[3] : 1];
    }
    const css = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a == null ? c[3] : a) + ')';
    const mix = (p, q, k) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k, 1];
    const lum = c => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
    function skin() {
        let now = performance.now(); if (SK && now - skAt < 700) return SK; skAt = now;
        let root = document.querySelector('.nb') || document.documentElement, cs = getComputedStyle(root), gv = (n, f) => cs.getPropertyValue(n).trim() || f;
        let A = rgb(gv('--a', gv('--neon-primary', '#ff2a6d')), root), B = rgb(gv('--b', gv('--neon-secondary', '#ff8ac8')), root), bg = rgb(gv('--bg', gv('--bg-base', '#0c090e')), root), ink = rgb(gv('--ink', gv('--text-main', '#eeeeee')), root);
        let pan = rgb(gv('--pan', '#16111a'), root), light = lum(bg) > 0.5, font = cs.fontFamily || 'sans-serif';
        let key = [A, B, bg, ink].join('|');
        if (SK && SK.key === key) return SK;
        SK = { key, A, B, bg, ink, pan, light, font, a: css(A, 1), b: css(B, 1),
            ok: light ? '#13804a' : '#6dff9a', warn: light ? '#a35f00' : '#ffb000', bad: light ? '#c4122a' : '#ff3a4a',
            bg0: css(mix(bg, A, light ? 0.02 : 0.035), 1), bg1: css(mix(bg, [0, 0, 0, 1], light ? 0.06 : 0.35), 1),
            t1: css(ink, 0.92), t2: css(ink, 0.55), t3: css(ink, 0.33), g1: css(ink, light ? 0.14 : 0.09), g2: css(ink, light ? 0.08 : 0.045),
            heat: null };
        let lut = []; for (let i = 0; i < 64; i++) { let v = i / 63, c = v < 0.45 ? mix(mix(bg, [0, 0, 0, 1], light ? 0 : 0.4), A, v / 0.45) : v < 0.8 ? mix(A, B, (v - 0.45) / 0.35) : mix(B, light ? [20, 10, 20, 1] : [255, 255, 255, 1], (v - 0.8) / 0.2); lut.push(css(c, 1)); } SK.heat = lut;
        if (light) SK.heat = lut.map((q, i) => i < 3 ? css(bg, 1) : q);
        return SK;
    }
    const MONO = "'Courier New', ui-monospace, monospace";
    const LT = s => (window.NBL && NBL.mode() === 'jp' && NBL.t(s)) || s;
    const txt = (x, s, X0, Y, c, sz, al, bold, lab) => { x.fillStyle = c; x.font = (bold ? 'bold ' : '') + (sz || 10) + 'px ' + (lab ? SK.font : MONO); x.textAlign = al || 'left'; x.fillText(lab ? LT(s) : s, X0, Y); x.textAlign = 'left'; };
    const lab = (x, s, X0, Y, c, sz, al) => txt(x, s, X0, Y, c, sz || 8, al, 1, 1);
    const bg = (x, w, h) => { let g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, SK.bg0); g.addColorStop(1, SK.bg1); x.fillStyle = g; x.fillRect(0, 0, w, h); };
    const tag = (x, s, w) => { x.font = 'bold 10px ' + MONO; let tw = x.measureText(s).width + 10; x.fillStyle = SK.light ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.65)'; x.fillRect(w - tw - 4, 4, tw, 15); txt(x, s, w - 9, 15, SK.t1, 10, 'right', 1); };
    const fx = (f, w) => Math.log(f / 20) / Math.log(1000) * w;
    const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteOf = f => { if (!(f > 0)) return ''; let m = Math.round(69 + 12 * Math.log2(f / 440)), c = Math.round((69 + 12 * Math.log2(f / 440) - m) * 100); return NOTES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1) + (c ? (c > 0 ? ' +' : ' ') + c + 'c' : ''); };
    const hz = f => f >= 1000 ? (f / 1000).toFixed(f >= 10000 ? 1 : 2) + 'k' : Math.round(f) + '';
    const fmtL = v => isFinite(v) ? v.toFixed(1) : '–∞';
    const fmtD = v => v < -90 ? '–∞' : (v > 0 ? '+' : '') + v.toFixed(1);
    const TARGETS = [['STREAMING', -14], ['APPLE MUSIC', -16], ['LOUD MASTER', -9], ['CLUB', -6], ['BROADCAST R128', -23]];
    const SERV = [['SPOTIFY', -14, 1], ['APPLE', -16, 1], ['YOUTUBE', -14, 0], ['TIDAL', -14, 0]];
    const lvY = (d, top, bot) => { let p = d >= -20 ? 0.46 + 0.54 * (Math.min(3, d) + 20) / 23 : Math.max(0, (d + 60) / 40) * 0.46; return bot - p * (bot - top); };
    const fill = (x, X0, Y0, W, H0) => x.fillRect(Math.round(X0), Math.round(Y0), Math.round(W), Math.round(H0));

    const DRAW = {
        lvl(x, w, h, t, C, cv) {
            bg(x, w, h); let top = 22, bot = h - 8, sx = 26, bw = Math.max(10, Math.min(26, (w - sx - 120) / 3)), gap = 5, x0 = sx + 4, tg = TARGETS[ST.target || 0];
            [3, 0, -3, -6, -9, -12, -18, -24, -30, -40, -50, -60].forEach(d => { let Y = Math.round(lvY(d, top, bot)) + 0.5; x.fillStyle = d === 0 ? C.t3 : C.g2; x.fillRect(sx - 2, Y, x0 + 2 * bw + gap - sx + 4, 1); if (d !== 3) txt(x, String(d), sx - 5, Y + 3, d === 0 ? C.t1 : C.t3, 8, 'right'); });
            const bar = (k, X0) => {
                fill(x, X0, top, bw, bot - top); x.fillStyle = C.g2; fill(x, X0, top, bw, bot - top);
                let g = x.createLinearGradient(0, bot, 0, top); g.addColorStop(0, css(mix(C.bg, C.A, 0.55), 1)); g.addColorStop((lvY(-18, top, bot) - bot) / (top - bot), C.a); g.addColorStop((lvY(-6, top, bot) - bot) / (top - bot), C.b); g.addColorStop((lvY(-1, top, bot) - bot) / (top - bot), C.warn); g.addColorStop(1, C.bad);
                let yp = lvY(t.ppm[k], top, bot), yr = lvY(db(t.rms[k] * Math.SQRT2), top, bot);
                x.fillStyle = g; x.globalAlpha = 0.42; fill(x, X0, yp, bw, bot - yp); x.globalAlpha = 1; fill(x, X0 + 2, yr, bw - 4, bot - yr);
                let yh = lvY(t.hold[k], top, bot); x.fillStyle = t.hold[k] > -1 ? C.bad : C.t1; fill(x, X0, yh - 1, bw, 2);
                txt(x, fmtD(t.hold[k]), X0 + bw / 2, top - 4, t.hold[k] > -1 ? C.bad : C.t1, 9, 'center', 1);
                lab(x, k ? 'R' : 'L', X0 + bw / 2, bot + 7, C.t3, 8, 'center');
            };
            bar(0, x0); bar(1, x0 + bw + gap);
            let mx = x0 + 2 * bw + gap + 12, lo = tg[1] - 24, hi2 = tg[1] + 6, ly = v => bot - (Math.max(lo, Math.min(hi2, v)) - lo) / (hi2 - lo) * (bot - top);
            x.fillStyle = C.g2; fill(x, mx, top, bw, bot - top);
            if (isFinite(t.M)) { let Y = ly(t.M); x.fillStyle = t.M > tg[1] + 1 ? C.bad : t.M > tg[1] - 2 ? C.ok : C.a; fill(x, mx, Y, bw, bot - Y); }
            x.fillStyle = C.ok; fill(x, mx - 3, ly(tg[1]), bw + 6, 1); lab(x, 'LUFS', mx + bw / 2, bot + 7, C.t3, 8, 'center'); txt(x, fmtL(t.M), mx + bw / 2, top - 4, C.t1, 9, 'center', 1);
            let rx = mx + bw + 14; if (w - rx > 86) {
                let tpm = db(t.tpMax), rows = [['TRUE PEAK', fmtD(tpm) + ' dBTP', tpm > -1 ? C.bad : tpm > -2 ? C.warn : C.t1], ['HEADROOM', tpm > -90 ? (-tpm).toFixed(1) + ' dB' : '–', tpm > -1 ? C.bad : C.t1], ['RMS L / R', fmtD(db(t.rms[0] * Math.SQRT2)) + ' ' + fmtD(db(t.rms[1] * Math.SQRT2)), C.t1], ['CREST', isFinite(db(t.rms[0])) && t.ppm[0] > -90 ? (Math.max(t.hold[0], t.hold[1]) - db(Math.max(t.rms[0], t.rms[1]) * Math.SQRT2)).toFixed(1) + ' dB' : '–', C.t1]];
                rows.forEach(([a, b2, c], i) => { let Y = top + 8 + i * 28; lab(x, a, rx, Y, C.t3, 8); txt(x, b2, rx, Y + 13, c, 12, 'left', 1); });
            }
            let now = performance.now(), L1 = t.clipAt && now - t.clipAt < 3000, L2 = t.overAt && now - t.overAt < 3000;
            [['CLIP', L1, C.bad], ['TP', L2, C.warn]].forEach(([s, on, c], i) => { let X0 = w - 38 - i * 40, Y = 4; x.fillStyle = on ? c : C.g1; x.fillRect(X0, Y, 34, 12); txt(x, s, X0 + 17, Y + 9, on ? '#000' : C.t3, 8, 'center', 1); });
            if (!cv._click) { cv._click = 1; cv.style.cursor = 'pointer'; cv.title = 'click: clear the holds + the lights'; cv.addEventListener('click', () => { if (T) { T.hold = [-120, -120]; T.clipAt = T.overAt = 0; T.tpMax = 0; } }); }
        },
        loud(x, w, h, t, C, cv) {
            bg(x, w, h); let tg = TARGETS[ST.target || 0], col = v => !isFinite(v) ? C.t3 : v > tg[1] + 1 ? C.bad : v > tg[1] - 2 ? C.ok : C.a;
            txt(x, fmtL(t.S), 10, 34, col(t.S), 28, 'left', 1); lab(x, 'SHORT TERM LUFS', 12, 46, C.t2, 8);
            [['MOMENTARY', t.M], ['INTEGRATED', t.I]].forEach(([nm, v], i) => { let Y = 18 + i * 25; txt(x, fmtL(v), 120, Y, col(v), 13, 'left', 1); lab(x, nm, 120, Y + 9, C.t3, 7); });
            let tp = db(t.tpMax), plr = isFinite(t.I) && tp > -90 ? tp - t.I : NaN, psr = db(t.tp3 || 0) - t.S;
            let lines = [['TRUE PEAK', fmtD(tp) + ' dBTP', tp > -1 ? C.bad : C.t1], ['RANGE LRA', isFinite(t.lra) ? t.lra.toFixed(1) + ' LU' : '–', C.t1], ['PLR', isFinite(plr) ? plr.toFixed(1) + ' dB' : '–', isFinite(plr) && plr < 8 ? C.warn : C.t1], ['PSR', isFinite(psr) && psr < 60 ? psr.toFixed(1) + ' dB' : '–', isFinite(psr) && psr < 6 ? C.warn : C.t1]];
            if (w >= 330) lines.forEach(([a, b2, c], i) => { let X0 = w - 8, Y = 13 + i * 13; txt(x, b2, X0, Y, c, 10, 'right', 1); lab(x, a, X0 - 70, Y, C.t3, 7, 'right'); });
            let gy = 56, gb = h - 26, gh = gb - gy, lo = tg[1] - 24, hi = tg[1] + 6, yv = v => gy + (1 - (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * gh;
            x.fillStyle = C.g2; x.fillRect(0, gy, w, gh);
            x.fillStyle = css(SK.light ? [19, 128, 74, 1] : [109, 255, 154, 1], 0.12); x.fillRect(0, yv(tg[1] + 1), w, yv(tg[1] - 2) - yv(tg[1] + 1)); x.fillStyle = C.ok; x.globalAlpha = 0.7; x.fillRect(0, yv(tg[1]), w, 1); x.globalAlpha = 1;
            let L = t.lhist, n = Math.min(L.length, w - 4);
            if (n > 1) { x.beginPath(); for (let i = 0; i < n; i++) { let v = L[L.length - n + i], X0 = w - n + i, Y = yv(isFinite(v) ? v : lo); if (i) x.lineTo(X0, Y); else x.moveTo(X0, Y); } x.strokeStyle = C.a; x.lineWidth = 1.5; x.stroke(); x.lineTo(w, gb); x.lineTo(w - n, gb); x.closePath(); x.globalAlpha = 0.15; x.fillStyle = C.a; x.fill(); x.globalAlpha = 1;
                let P = t.phist, m = Math.min(P.length, w - 4), py = v => gb - Math.max(0, Math.min(20, v)) / 20 * gh * 0.45; x.beginPath(); let on = 0; for (let i = 0; i < m; i++) { let v = P[P.length - m + i]; if (!isFinite(v)) { on = 0; continue; } let X0 = w - m + i; if (on) x.lineTo(X0, py(v)); else x.moveTo(X0, py(v)); on = 1; } x.strokeStyle = C.b; x.globalAlpha = 0.55; x.lineWidth = 1; x.setLineDash([2, 2]); x.stroke(); x.setLineDash([]); x.globalAlpha = 1; }
            lab(x, LT('TARGET') + ' ' + LT(tg[0]) + ' ' + tg[1] + ' · PSR ┄', 6, gy + 10, C.t3, 7);
            let s = SERV.map(([nm, lv, up]) => { if (!isFinite(t.I)) return nm + ' –'; let g = lv - t.I; if (g > 0) g = up ? Math.max(0, Math.min(g, -1 - tp)) : 0; return nm + ' ' + (Math.abs(g) < 0.1 ? '=' : (g < 0 ? '↓' : '↑') + Math.abs(g).toFixed(1)); }).join('  ');
            lab(x, 'STREAMING WILL', 6, h - 12, C.t3, 7); txt(x, s + ' dB', 6, h - 3, C.t1, 9, 'left', 1);
            if (!cv._click) { cv._click = 1; cv.style.cursor = 'pointer'; cv.title = 'click: the next target'; cv.addEventListener('click', () => { ST.target = ((ST.target || 0) + 1) % TARGETS.length; save(); }); }
        },
        spec(x, w, h, t, C, cv) {
            bg(x, w, h); let sr = t.sr, bins = 4096, bw2 = sr / 2 / bins, sl = ST.opt.slope, sm = ST.opt.smooth, lo = -96 + (sl ? 6 : 0), hi = -18 + (sl ? 6 : -6), gh = h - 16, y = v => 4 + (1 - (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * (gh - 6);
            const cum = (arr, key) => { let c = cv[key] || (cv[key] = new Float64Array(bins + 1)); c[0] = 0; for (let i = 0; i < bins; i++) c[i + 1] = c[i] + Math.pow(10, arr[i] / 10); return c; };
            let CM = cum(t.fb, '_c1'), CP = cum(t.peak, '_c2'), CS = ST.opt.side ? cum(t.fs, '_c3') : null;
            const val = (f, c) => { let q = sm ? Math.pow(2, 1 / (2 * sm)) : 1.0001, b0 = Math.max(1, Math.floor(f / q / bw2)), b1 = Math.min(bins, Math.max(b0 + 1, Math.ceil(f * q / bw2))); return 10 * Math.log10(Math.max(1e-14, (c[b1] - c[b0]) / (b1 - b0))) + sl * Math.log2(f / 1000); };
            [['SUB', 20, 60], ['LOW', 60, 250], ['MID', 250, 2000], ['HIGH', 2000, 8000], ['AIR', 8000, 20000]].forEach(([n, a, b2], i) => { let x0 = fx(a, w), x1 = fx(b2, w); if (i % 2) { x.fillStyle = C.g2; x.fillRect(x0, 0, x1 - x0, gh); } lab(x, n, (x0 + x1) / 2, h - 3, C.t3, 8, 'center'); });
            for (let d = Math.ceil(hi / 12) * 12 - 6; d >= lo; d -= 12) { let Y = Math.round(y(d)) + 0.5; x.fillStyle = C.g1; x.fillRect(24, Y, w, 1); txt(x, String(d), 2, Y + 3, C.t3, 8); }
            [[100, '100'], [1000, '1k'], [10000, '10k']].forEach(([f, l]) => { let X0 = Math.round(fx(f, w)) + 0.5; x.fillStyle = C.g1; x.fillRect(X0, 0, 1, gh); txt(x, l, X0 + 3, gh - 3, C.t2, 8); });
            let pts = []; for (let X0 = 0; X0 <= w; X0 += 2) { let f = 20 * Math.pow(1000, X0 / w); pts.push([X0, y(val(f, CM)), f]); }
            let g = x.createLinearGradient(0, 0, 0, gh); g.addColorStop(0, C.a); g.addColorStop(0.7, css(C.A, 0.12)); g.addColorStop(1, css(C.A, 0));
            x.beginPath(); x.moveTo(0, gh); pts.forEach(p => x.lineTo(p[0], p[1])); x.lineTo(w, gh); x.closePath(); x.fillStyle = g; x.globalAlpha = 0.5; x.fill(); x.globalAlpha = 1;
            x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.strokeStyle = C.a; x.lineWidth = 1.5; if (!SK.light) { x.shadowColor = C.a; x.shadowBlur = 6; } x.stroke(); x.shadowBlur = 0;
            if (CS) { x.beginPath(); for (let X0 = 0; X0 <= w; X0 += 3) { let f = 20 * Math.pow(1000, X0 / w), Y = y(val(f, CS)); X0 ? x.lineTo(X0, Y) : x.moveTo(X0, Y); } x.strokeStyle = C.b; x.globalAlpha = 0.85; x.lineWidth = 1.2; x.setLineDash([4, 3]); x.stroke(); x.setLineDash([]); x.globalAlpha = 1; }
            x.beginPath(); for (let X0 = 0; X0 <= w; X0 += 3) { let f = 20 * Math.pow(1000, X0 / w), Y = y(val(f, CP)); X0 ? x.lineTo(X0, Y) : x.moveTo(X0, Y); } x.strokeStyle = C.t3; x.lineWidth = 1; x.stroke();
            let best = -1e9, bf = 0; pts.forEach(p => { let v = val(p[2], CM); if (v > best && p[2] > 30) { best = v; bf = p[2]; } });
            if (best > lo + 6) { x.fillStyle = C.b; x.beginPath(); x.arc(fx(bf, w), y(best), 2.5, 0, 7); x.fill(); }
            let info = best > lo + 6 ? LT('LOUDEST') + ' ' + hz(bf) + 'Hz ' + noteOf(bf) : '';
            if (cv._mx != null) { let X0 = cv._mx, f = 20 * Math.pow(1000, X0 / w), v = val(f, CM); x.strokeStyle = C.t2; x.setLineDash([2, 3]); x.beginPath(); x.moveTo(X0 + 0.5, 0); x.lineTo(X0 + 0.5, gh); x.stroke(); x.setLineDash([]); info = hz(f) + 'Hz  ' + noteOf(f) + '  ' + (v - sl * Math.log2(f / 1000)).toFixed(0) + 'dB'; }
            if (info) tag(x, info, w);
            lab(x, (sl ? sl + ' dB/oct' : 'flat') + ' · ' + (sm ? '1/' + sm + ' oct' : 'raw') + (CS ? ' · S ┄' : ''), 28, 12, C.t3, 8);
        },
        gram(x, w, h, t, C, cv) {
            let off = cv._g || (cv._g = document.createElement('canvas')); if (off.width !== w || off.height !== h || cv._gk !== C.key) { off.width = w; off.height = h; cv._gk = C.key; let o = off.getContext('2d'); o.fillStyle = C.heat[0]; o.fillRect(0, 0, w, h); }
            let o = off.getContext('2d'), sr = t.sr, sp = t.playing ? 2 : 0;
            if (sp) { o.drawImage(off, -sp, 0); for (let Y = 0; Y < h; Y++) { let f = 20 * Math.pow(1000, 1 - Y / h), b = Math.min(4095, Math.round(f / (sr / 2) * 4096)), v = Math.pow(Math.max(0, Math.min(1, (t.fb[b] + 4.5 * Math.log2(f / 1000) + 96) / 74)), 1.6); o.fillStyle = C.heat[Math.round(v * 63)]; o.fillRect(w - sp, Y, sp, 1); } }
            x.drawImage(off, 0, 0, w, h);
            [[50, '50'], [100, '100'], [200, '200'], [500, '500'], [1000, '1k'], [2000, '2k'], [5000, '5k'], [10000, '10k']].forEach(([f, l]) => { let Y = h - fx(f, h); x.fillStyle = C.t3; x.fillRect(0, Y, 6, 1); txt(x, l, 9, Y + 3, C.t2, 8); });
            if (cv._my != null) { let f = 20 * Math.pow(1000, 1 - cv._my / h); x.fillStyle = C.t2; x.fillRect(0, cv._my, w, 1); txt(x, hz(f) + 'Hz ' + noteOf(f), w - 6, Math.max(12, cv._my - 4), C.t1, 10, 'right', 1); }
        },
        wave(x, w, h, t, C) {
            bg(x, w, h); let H = t.hist, n = Math.min(H.length, w), mid = h / 2, sc = v => Math.pow(Math.min(1, v), 0.7) * (mid - 4);
            [-6, -12, -24].forEach(d => { let a = sc(Math.pow(10, d / 20)); x.fillStyle = C.g2; x.fillRect(22, mid - a, w, 1); x.fillRect(22, mid + a, w, 1); txt(x, String(d), 2, mid - a + 3, C.t3, 8); });
            x.fillStyle = C.g1; x.fillRect(0, mid, w, 1);
            for (let i = 0; i < n; i++) { let q = H[H.length - n + i], X0 = w - n + i, clip = q[0] > 0.985 || q[1] > 0.985;
                x.fillStyle = clip ? C.bad : C.a; x.globalAlpha = 0.35; x.fillRect(X0, mid - sc(q[0]), 1, sc(q[0])); x.fillRect(X0, mid, 1, sc(q[1]));
                x.globalAlpha = 0.95; x.fillRect(X0, mid - sc(q[2]), 1, sc(q[2])); x.fillStyle = clip ? C.bad : C.b; x.fillRect(X0, mid, 1, sc(q[3])); }
            x.globalAlpha = 1; lab(x, 'L', w - 10, 12, C.a, 10); lab(x, 'R', w - 10, h - 4, C.b, 10);
            if (t.clipAt && performance.now() - t.clipAt < 2500) { x.fillStyle = C.bad; x.fillRect(w - 46, h / 2 - 8, 38, 16); txt(x, 'CLIP', w - 27, h / 2 + 4, '#000', 10, 'center', 1); }
        },
        stereo(x, w, h, t, C, cv) {
            let gh = h - 34, s = Math.min(w * 0.5, gh) * 0.46, cx = w * 0.3, cy = gh / 2 + 2;
            let off = cv._g || (cv._g = document.createElement('canvas')); if (off.width !== w || off.height !== h) { off.width = w; off.height = h; }
            let o = off.getContext('2d'); o.globalCompositeOperation = 'destination-out'; o.fillStyle = 'rgba(0,0,0,0.3)'; o.fillRect(0, 0, w, h); o.globalCompositeOperation = SK.light ? 'source-over' : 'lighter';
            o.fillStyle = C.a; o.globalAlpha = 0.35;
            for (let i = 0; i < 2048; i += 2) { let L = t.bL[i], R = t.bR[i], M = (L + R) * 0.707, S = (R - L) * 0.707; o.fillRect(cx + S * s * 1.4, cy - M * s * 1.4, 1.6, 1.6); }
            o.globalAlpha = 1; o.globalCompositeOperation = 'source-over';
            bg(x, w, h); x.drawImage(off, 0, 0);
            x.strokeStyle = C.g1; x.lineWidth = 1; x.beginPath(); x.arc(cx, cy, s, 0, 7); x.moveTo(cx - s * 0.707, cy - s * 0.707); x.lineTo(cx + s * 0.707, cy + s * 0.707); x.moveTo(cx + s * 0.707, cy - s * 0.707); x.lineTo(cx - s * 0.707, cy + s * 0.707); x.moveTo(cx, cy - s); x.lineTo(cx, cy + s); x.stroke();
            lab(x, 'M', cx, cy - s - 3, C.t3, 8, 'center'); lab(x, 'L', cx - s * 0.75, cy - s * 0.75, C.t3, 8, 'center'); lab(x, 'R', cx + s * 0.75, cy - s * 0.75, C.t3, 8, 'center');
            let X0 = w * 0.6, cb = t.corB, vals = [['WIDTH', Math.round(t.width * 200) + '%', t.width > 0.45 ? C.warn : C.t1], ['BALANCE', (t.bal < -0.02 ? 'L ' : t.bal > 0.02 ? 'R ' : '') + Math.round(Math.abs(t.bal) * 100), C.t1], ['MONO SAFE', t.cor > 0.25 ? 'YES' : t.cor > 0 ? 'CAREFUL' : 'NO', t.cor > 0.25 ? C.ok : t.cor > 0 ? C.warn : C.bad], ['BASS MONO', isFinite(cb) && t.mn ? (cb > 0.8 ? 'TIGHT' : cb > 0.5 ? 'OK' : 'SPREAD') : '–', cb > 0.8 ? C.ok : cb > 0.5 ? C.t1 : C.warn]];
            vals.forEach(([a, b2, c], i) => { lab(x, a, X0, 14 + i * 26, C.t3, 8); txt(x, b2, X0, 26 + i * 26, c, 12, 'left', 1); });
            [[t.cor, 'ALL', h - 22], [t.mn ? cb : NaN, '<150Hz', h - 9]].forEach(([v, nm, by]) => {
                let bx = 34, bw = w - 42; x.fillStyle = C.g1; x.fillRect(bx, by, bw, 5); x.fillStyle = css(SK.light ? [196, 18, 42, 1] : [255, 58, 74, 1], 0.2); x.fillRect(bx, by, bw / 2, 5); lab(x, nm, 4, by + 5, C.t3, 7);
                if (isFinite(v)) { x.fillStyle = v < 0 ? C.bad : C.a; let cxp = bx + bw / 2 + v * bw / 2; x.fillRect(Math.min(cxp, bx + bw / 2), by, Math.abs(cxp - bx - bw / 2), 5); x.fillStyle = C.t1; x.fillRect(cxp - 1, by - 2, 2, 9); }
            });
            txt(x, '-1', 34, h - 25, C.t3, 7); txt(x, '+1', w - 8, h - 25, C.t3, 7, 'right');
        },
        scope(x, w, h, t, C) {
            bg(x, w, h); let b = t.bL, st = 0, per = 0, zc = [];
            for (let i = 1; i < 2048 && zc.length < 12; i++) if (b[i - 1] < 0 && b[i] >= 0) zc.push(i);
            if (zc.length) st = zc[0]; if (zc.length > 3) per = (zc[zc.length - 1] - zc[0]) / (zc.length - 1);
            x.fillStyle = C.g2; for (let i = 1; i < 8; i++) x.fillRect(Math.round(i * w / 8), 0, 1, h); for (let i = 1; i < 4; i++) x.fillRect(0, Math.round(i * h / 4), w, 1);
            let span = Math.min(1024, 2048 - st);
            x.strokeStyle = C.a; if (!SK.light) { x.shadowColor = C.a; x.shadowBlur = 8; } x.lineWidth = 1.6; x.beginPath();
            for (let i = 0; i < span; i++) { let X0 = i / (span - 1) * w, Y = h / 2 - b[st + i] * h * 0.45; if (i) x.lineTo(X0, Y); else x.moveTo(X0, Y); } x.stroke();
            x.strokeStyle = C.b; x.globalAlpha = 0.4; x.shadowBlur = 0; x.lineWidth = 1; x.beginPath();
            for (let i = 0; i < span; i++) { let X0 = i / (span - 1) * w, Y = h / 2 - t.bR[st + i] * h * 0.45; if (i) x.lineTo(X0, Y); else x.moveTo(X0, Y); } x.stroke(); x.globalAlpha = 1;
            if (per > 2) { let f = t.sr / per; if (f > 25 && f < 5000) tag(x, hz(f) + 'Hz  ' + noteOf(f), w); }
        },
        vu(x, w, h, t, C, cv) {
            x.fillStyle = C.bg1; x.fillRect(0, 0, w, h);
            let pw2 = (w - 18) / 2, ref = ST.opt.vuRef, face0 = css(mix(C.bg, C.A, SK.light ? 0.06 : 0.16), 1), face1 = css(mix(C.bg, [0, 0, 0, 1], SK.light ? 0.04 : 0.3), 1), redC = SK.light ? '#c4122a' : '#ff4a5a';
            [0, 1].forEach(k => {
                let x0 = 6 + k * (pw2 + 6), y0 = 6, ph = h - 12, cx = x0 + pw2 / 2, R = Math.min(pw2 * 0.62, ph * 0.95), cy = y0 + ph - 8 + R * 0.18;
                let g = x.createRadialGradient(cx, y0 + ph * 0.7, 4, cx, y0 + ph * 0.6, pw2 * 0.85); g.addColorStop(0, face0); g.addColorStop(1, face1);
                x.fillStyle = g; x.beginPath(); x.roundRect ? x.roundRect(x0, y0, pw2, ph, 5) : x.rect(x0, y0, pw2, ph); x.fill(); x.strokeStyle = C.g1; x.lineWidth = 1; x.stroke(); x.save(); x.clip();
                const ang = d => -0.82 + (d + 20) / 23 * 1.64;
                x.strokeStyle = redC; x.lineWidth = 3; x.beginPath(); x.arc(cx, cy, R - 3, ang(0) - Math.PI / 2, ang(3) - Math.PI / 2); x.stroke();
                x.strokeStyle = C.t2; x.lineWidth = 1; x.beginPath(); x.arc(cx, cy, R - 1, ang(-20) - Math.PI / 2, ang(0) - Math.PI / 2); x.stroke();
                [-20, -10, -7, -5, -3, -2, -1, 0, 1, 2, 3].forEach(d => { let a = ang(d), r1 = R - 9; x.strokeStyle = d > 0 ? redC : C.t2; x.lineWidth = d === 0 ? 1.6 : 1; x.beginPath(); x.moveTo(cx + Math.sin(a) * r1, cy - Math.cos(a) * r1); x.lineTo(cx + Math.sin(a) * R, cy - Math.cos(a) * R); x.stroke();
                    if (R > 40 && [-20, -10, -5, -3, 0, 3].indexOf(d) >= 0) txt(x, String(Math.abs(d)), cx + Math.sin(a) * (R - 16), cy - Math.cos(a) * (R - 16) + 3, d > 0 ? redC : C.t2, 8, 'center'); });
                lab(x, 'VU', cx, y0 + ph - 18, C.a, 11, 'center'); lab(x, k ? 'R' : 'L', x0 + 8, y0 + 13, C.t2, 9);
                if (k === 1) txt(x, '0 = ' + ref + ' dBFS', x0 + pw2 - 8, y0 + ph - 6, C.t3, 7, 'right');
                let v = db(t.vu[k] * Math.SQRT2) - ref, a = ang(Math.max(-22, Math.min(4, v)));
                x.strokeStyle = 'rgba(0,0,0,0.3)'; x.lineWidth = 2; x.beginPath(); x.moveTo(cx + 2, cy + 2); x.lineTo(cx + 2 + Math.sin(a) * (R - 4), cy + 2 - Math.cos(a) * (R - 4)); x.stroke();
                x.strokeStyle = C.b; if (!SK.light) { x.shadowColor = C.b; x.shadowBlur = 6; } x.lineWidth = 1.5; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.sin(a) * (R - 4), cy - Math.cos(a) * (R - 4)); x.stroke(); x.shadowBlur = 0;
                let hot = (k ? t.pkR : t.pkL) > 0.95; x.fillStyle = hot ? redC : C.g1; x.beginPath(); x.arc(x0 + pw2 - 12, y0 + 12, 4, 0, 7); x.fill(); if (hot && !SK.light) { x.shadowColor = redC; x.shadowBlur = 8; x.fill(); x.shadowBlur = 0; }
                x.fillStyle = SK.light ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.06)'; x.fillRect(x0 + 3, y0 + 3, pw2 - 6, ph * 0.18); x.restore();
            });
            if (!cv._click) { cv._click = 1; cv.style.cursor = 'pointer'; cv.title = 'click: what 0 VU is (-18, -14 or -20 dBFS)'; cv.addEventListener('click', () => { let r = [-18, -14, -20], i = r.indexOf(ST.opt.vuRef); ST.opt.vuRef = r[(i + 1) % r.length]; save(); }); }
        }
    };

    let raf = 0;
    function loop(now) {
        raf = 0;
        let V = X.V && X.V(), cvs = [...document.querySelectorAll('canvas[data-meter]')].filter(c => c.isConnected);
        if (!V) { document.querySelectorAll('.nb-mwin').forEach(e => e.remove()); return; }
        if (!cvs.length) return;
        raf = requestAnimationFrame(loop);
        if (document.hidden) return;
        let C = skin(), t = read(now); if (!t) { cvs.forEach(cv => { let x = cv.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); bg(x, cv.width, cv.height); lab(x, 'press play', 8, 16, C.t2, 11); }); return; }
        cvs.forEach(cv => {
            let host = cv.closest('.bedazzled-border');
            if (host && host.classList.contains('is-min')) return;
            let r = cv.getBoundingClientRect(), w = Math.max(60, Math.round(r.width)), h = Math.max(40, Math.round(r.height)), dpr = Math.min(2, window.devicePixelRatio || 1);
            if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
            if (!cv._hov) { cv._hov = 1; cv.addEventListener('mousemove', e => { let q = cv.getBoundingClientRect(); cv._mx = e.clientX - q.left; cv._my = e.clientY - q.top; }); cv.addEventListener('mouseleave', () => { cv._mx = cv._my = null; }); }
            let x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
            try { DRAW[cv.dataset.meter](x, w, h, t, C, cv); } catch (e) {}
        });
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

    function popOut(id) {
        let m = LIST.find(q => q[0] === id); if (!m || document.getElementById('nb-mw-' + id)) return;
        let p = ST.pop[id] || {}, w = document.createElement('div'); w.className = 'bedazzled-border nb-mwin'; w.id = 'nb-mw-' + id;
        w.style.left = (p.x != null ? p.x : 80 + Math.random() * 300) + 'px'; w.style.top = (p.y != null ? p.y : 90 + Math.random() * 200) + 'px'; w.style.width = (p.w || 320) + 'px'; w.style.height = (p.h || 190) + 'px';
        w.innerHTML = '<div class="window-header"><span>// <b>' + m[1] + '</b> ' + m[2] + '</span><div class="win-btns"><button type="button" class="win-btn nb-back" title="back into the noisebox" aria-label="back into the noisebox">[⇲]</button><button type="button" class="kill-btn" title="close">[X]</button></div></div><canvas data-meter="' + id + '"></canvas>';
        if (window.NBL) NBL.once(w);
        (document.getElementById('desktop') || document.body).appendChild(w);
        let h = w.querySelector('.window-header'), bk = w.querySelector('.win-btn'), cl = w.querySelector('.kill-btn');
        const keep = () => { let r = w.getBoundingClientRect(); ST.pop[id] = { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), on: 1 }; save(); };
        bk.onclick = () => { w.remove(); ST.pop[id] = Object.assign(ST.pop[id] || {}, { on: 0 }); ST.show[id] = 1; save(); if (X.tab && X.tab() === 'meters') X.showDock(); };
        cl.onclick = () => { w.remove(); ST.pop[id] = Object.assign(ST.pop[id] || {}, { on: 0 }); save(); if (X.tab && X.tab() === 'meters') X.showDock(); };
        h.addEventListener('pointerdown', e => {
            if (e.target.closest('button')) return; e.preventDefault(); let r = w.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top;
            const mv = ev => { w.style.left = Math.max(0, Math.min(innerWidth - 60, ev.clientX - ox)) + 'px'; w.style.top = Math.max(0, Math.min(innerHeight - 30, ev.clientY - oy)) + 'px'; };
            const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); keep(); };
            addEventListener('pointermove', mv); addEventListener('pointerup', up);
        });
        new (window.ResizeObserver || function () { this.observe = () => {}; })(() => keep()).observe(w);
        ST.pop[id] = Object.assign(ST.pop[id] || {}, { on: 1 }); save(); kick();
    }
    function styles() {
        if (document.getElementById('nb-meter-style')) return;
        let st = document.createElement('style'); st.id = 'nb-meter-style';
        st.textContent = `
        .nb-mtrs { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 10px; }
        .nb-mcard { width: 100%; min-width: 0; box-sizing: border-box; display: block; background: var(--face, var(--pan)); border: 1px solid var(--line); border-radius: 6px; padding: 5px 6px 6px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 6px 14px rgba(0,0,0,0.35); }
        .nb-mth { display: flex; flex-direction: row; align-items: center; gap: 5px; font: bold 10px 'Courier New', monospace; letter-spacing: 1px; writing-mode: horizontal-tb; padding: 1px 2px 4px; border-bottom: 1px solid var(--line); margin-bottom: 5px; color: var(--ink); }
        .nb-mth b { font-size: 12px; white-space: nowrap; color: var(--a); text-shadow: 0 0 6px var(--glow, transparent); } .nb-mth > span { flex: 1; white-space: nowrap; opacity: 0.7; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
        .nb-mth .nb-btn { padding: 1px 6px; font-size: 10px; min-height: 0; }
        .nb-mcard canvas { display: block; width: 100% !important; height: 172px !important; border-radius: 3px; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.5); }
        .nb-mcard canvas[data-meter="lvl"], .nb-mcard canvas[data-meter="loud"] { height: 196px !important; }
        .nb-mcard .gone { height: 60px; display: flex; align-items: center; justify-content: center; opacity: 0.6; font-size: 11px; }
        .nb-mchips { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; align-items: center; }
        #desktop > .nb-mwin, .nb-mwin { position: fixed; z-index: 9500; display: flex; flex-direction: column; resize: both; overflow: hidden; min-width: 200px; min-height: 120px; max-width: none; }
        .nb-mwin > .window-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 5px 6px 5px 10px; background: rgba(16, 6, 14, 0.98); color: #fff; font-size: 12px; font-weight: bold; border-bottom: 1px solid var(--neon-primary); cursor: grab; user-select: none; touch-action: none; }
        .nb-mwin > .window-header > span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 0 6px var(--neon-primary); letter-spacing: 1px; }
        .nb-mwin > .window-header b { color: var(--neon-primary); }
        .nb-mwin .kill-btn { background: none; color: #fff; font: inherit; font-weight: bold; text-shadow: 0 0 5px var(--neon-primary); padding: 2px 6px; border: 1px solid transparent; cursor: pointer; }
        .nb-mwin .kill-btn:hover { color: var(--neon-primary); border-color: var(--neon-primary); }
        #desktop > .bedazzled-border.nb-mwin .nb-back::before { content: '⇲'; }
        .nb-mwin canvas { flex: 1; width: 100%; min-height: 0; display: block; }
        @media (max-width: 760px) { #desktop > .bedazzled-border.nb-mwin { left: 8px !important; right: 8px; top: auto !important; bottom: 128px; width: auto !important; height: 210px !important; } }`;
        document.head.appendChild(st);
    }
    const OPTS = {
        spec: () => [[(ST.opt.slope ? ST.opt.slope : '0') + ' dB/oct', 'the lean: 4.5 = a mix that sounds balanced draws flat, 3 = pink noise flat, 0 = raw', () => { let r = [4.5, 3, 0], i = r.indexOf(ST.opt.slope); ST.opt.slope = r[(i + 1) % 3]; }],
            [ST.opt.smooth ? '1/' + ST.opt.smooth + ' oct' : 'raw', 'smoothing in fractions of an octave: 1/3 for the shape, 1/12 for the detail', () => { let r = [6, 3, 12, 0], i = r.indexOf(ST.opt.smooth); ST.opt.smooth = r[(i + 1) % 4]; }],
            [(ST.opt.side ? '☑' : '☐') + ' S', 'the side (L - R) on its own, dashed: where the stereo is, + if theres any in the bass', () => { ST.opt.side = ST.opt.side ? 0 : 1; }]],
        loud: () => [[LT(TARGETS[ST.target || 0][0]) + ' ' + TARGETS[ST.target || 0][1], 'what youre aiming at', () => { ST.target = ((ST.target || 0) + 1) % TARGETS.length; }]],
        vu: () => [['0 VU = ' + ST.opt.vuRef, 'what 0 VU means in dBFS (-18 is the broadcast standard)', () => { let r = [-18, -14, -20], i = r.indexOf(ST.opt.vuRef); ST.opt.vuRef = r[(i + 1) % 3]; }]]
    };
    X.metersTab = function (box) {
        styles(); X.eng && X.eng();
        let el = X.el, btn = X.btn, chips = el('div', 'nb-mchips');
        chips.appendChild(el('span', 'nb-lab', 'SHOW'));
        LIST.forEach(([id, jp, en]) => { let on = !!ST.show[id] || !!document.getElementById('nb-mw-' + id); chips.appendChild(btn((on ? '☑ ' : '☐ ') + jp + ' ' + en, 'sm' + (on ? ' on' : ''), () => { ST.show[id] = on ? 0 : 1; if (on) { let w2 = document.getElementById('nb-mw-' + id); if (w2) w2.remove(); ST.pop[id] = Object.assign(ST.pop[id] || {}, { on: 0 }); } save(); X.showDock(); })); });
        chips.appendChild(btn('↺ RESET LU', 'sm', () => { resetLoud(); X.flash('loudness counting from now'); }, 'start INTEGRATED, the range, the true peak + the graph again (play the whole thing through after)'));
        box.appendChild(chips);
        let g = el('div', 'nb-mtrs');
        LIST.forEach(([id, jp, en]) => {
            if (!ST.show[id]) return;
            let c = el('div', 'nb-mcard'), h = el('div', 'nb-mth'); let hj = el('b', '', jp), he = el('span', '', en); hj.dataset.lj = he.dataset.le = 1; hj.dataset.nolang = he.dataset.nolang = 1; h.appendChild(hj); h.appendChild(he);
            let popped = !!document.getElementById('nb-mw-' + id);
            if (OPTS[id] && !popped) OPTS[id]().forEach(([s, tip, fn]) => { let b = btn(s, 'sm', () => { fn(); save(); X.showDock(); }, tip); h.appendChild(b); });
            h.appendChild(btn(popped ? '⇲' : '⧉', 'sm', () => { if (popped) { let w2 = document.getElementById('nb-mw-' + id); if (w2) w2.remove(); ST.pop[id] = Object.assign(ST.pop[id] || {}, { on: 0 }); save(); } else popOut(id); X.showDock(); }, popped ? 'bring it back in here' : 'pop it out into its own window you can drag anywhere'));
            c.appendChild(h);
            if (popped) c.appendChild(el('div', 'gone', 'out on the desktop ↗')); else { let cv = el('canvas'); cv.dataset.meter = id; c.appendChild(cv); }
            g.appendChild(c);
        });
        if (!g.children.length) box.appendChild(el('div', 'nb-hint', 'tick some meters up there'));
        box.appendChild(g);
        box.appendChild(el('div', 'nb-hint', 'they read the master after the lid, every sample, so what they show is what comes out. LEVELS: the pale bar is the peak, the solid one the rms, TP lights when a peak between the samples goes over -1 (keep it dark for streaming), click to clear. LOUDNESS is EBU R128: aim the green line (click to pick what youre aiming at), PLR + PSR under 8 = squashed, STREAMING WILL = what each service does to the level once the whole song has played. SPECTRUM: hover for the frequency + the note, the dashed line is the side. STEREO: BASS MONO wants to say TIGHT'));
        kick();
    };
    // meters you popped out come back
    X.metersOpen = () => { styles(); Object.keys(ST.pop).forEach(id => { if (ST.pop[id]) ST.pop[id].on = 0; }); kick(); };
    X.metersRead = () => { let t = read(performance.now()); return t && { M: t.M, S: t.S, I: t.I, peak: t.mn ? t.spMax : Math.max(t.spMax, t.tp), tp: t.tpMax, lra: t.lra, cor: t.cor, corB: t.corB, wk: !!t.mn, posts: t.posts.length, vu: t.vu.slice() }; };
})();
