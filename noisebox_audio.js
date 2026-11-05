
(function () {
    const TL = s => window.NBL ? NBL.t(s) : s;
    const DBN = 'vmp_noisebox', ST = 'sounds';
    const pool = new Map();
    let dbP = null, gcDone = false;
    const NX = () => window.NBX;
    const dirty = () => { let X = NX(); if (X && X.dirty) X.dirty(); };

    function idb() {
        if (dbP) return dbP;
        dbP = new Promise((res, rej) => {
            try { let q = indexedDB.open(DBN, 1); q.onupgradeneeded = () => { if (!q.result.objectStoreNames.contains(ST)) q.result.createObjectStore(ST, { keyPath: 'id' }); }; q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }
            catch (e) { rej(e); }
        });
        dbP.catch(() => {});
        return dbP;
    }
    const tx = (mode, fn) => idb().then(d => new Promise((res, rej) => { let t = d.transaction(ST, mode), r = fn(t.objectStore(ST)); t.oncomplete = () => res(r ? r.result : undefined); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }));
    const put = rec => tx('readwrite', s => s.put(rec));
    const get = id => tx('readonly', s => s.get(id));
    const del = id => tx('readwrite', s => s.delete(id));
    const allKeys = () => tx('readonly', s => s.getAllKeys());

    let dctx = null;
    function decoder() {
        let L = NX() && NX().live && NX().live(); if (L && L.ctx) return L.ctx;
        if (!dctx) { let O = window.OfflineAudioContext || window.webkitOfflineAudioContext; dctx = new O(2, 1, 48000); }
        return dctx;
    }
    async function decode(blob) { let ab = await blob.arrayBuffer(); return await decoder().decodeAudioData(ab); }

    function entry(id, name, buf) {
        let ch = [], nc = Math.min(2, buf.numberOfChannels);
        for (let i = 0; i < nc; i++) ch.push(new Float32Array(buf.getChannelData(i)));
        let n = ch[0].length, B = 256, pk = new Float32Array(Math.max(1, Math.ceil(n / B))), top = 0;
        for (let k = 0; k < pk.length; k++) { let m = 0, e = Math.min(n, (k + 1) * B); for (const d of ch) for (let i = k * B; i < e; i++) { let a = d[i] < 0 ? -d[i] : d[i]; if (a > m) m = a; } pk[k] = m; if (m > top) top = m; }
        return { id, name, sr: buf.sampleRate, ch, n, dur: n / buf.sampleRate, peaks: pk, top, state: 'ok', bufs: new WeakMap(), p: null };
    }
    function bufFor(ctx, e, rev) {
        let o = e.bufs.get(ctx); if (!o) { o = {}; e.bufs.set(ctx, o); }
        let k = rev ? 'r' : 'f';
        if (!o[k]) {
            let b = ctx.createBuffer(e.ch.length, e.n, e.sr);
            e.ch.forEach((d, i) => { let s = d; if (rev) { s = new Float32Array(d.length); for (let j = 0; j < d.length; j++) s[j] = d[d.length - 1 - j]; } b.copyToChannel(s, i); });
            o[k] = b;
        }
        return o[k];
    }
    function load(id) {
        let e = pool.get(id); if (e) return e.p || Promise.resolve(e);
        e = { id, name: '…', state: 'loading', p: null }; pool.set(id, e);
        e.p = get(id).then(rec => {
            if (!rec || !rec.blob) { e.state = 'missing'; e.p = null; dirty(); return e; }
            return decode(rec.blob).then(buf => { Object.assign(e, entry(id, rec.name, buf)); dirty(); return e; });
        }).catch(() => { e.state = 'missing'; e.p = null; dirty(); return e; });
        return e.p;
    }
    const srcsOf = pr => { let s = new Set(); ((pr && pr.tracks) || []).forEach(t => { (t.clips || []).forEach(c => { if (c.src) s.add(c.src); (c.takes || []).forEach(id => s.add(id)); }); if (t.snd && t.snd.smp && t.snd.smp.id) s.add(t.snd.smp.id); if (t.snd && t.snd.zones) Object.values(t.snd.zones).forEach(L => (L || []).forEach(z => { if (z && z.id) s.add(z.id); })); (t.fx || []).forEach(P => { if (P && P.p && P.p.ir && P.p.ir.id) s.add(P.p.ir.id); }); }); return s; };
    function need(pr) {
        srcsOf(pr).forEach(id => load(id));
        // clean up old bounces nobody uses anymore. yours are safe
        if (!gcDone) { gcDone = true; setTimeout(gc, 4000); }
    }
    function gc() {
        let X = NX(); if (!X || !X.allSongs) return;
        let keep = new Set(); X.allSongs().forEach(pr => srcsOf(pr).forEach(id => keep.add(id)));
        tx('readonly', s => s.getAll()).then(all => (all || []).forEach(r => { if (r.made && !keep.has(r.id)) { del(r.id).catch(() => {}); pool.delete(r.id); } })).catch(() => {});
    }
    const ready = pr => Promise.all([...srcsOf(pr)].map(load));
    let un = 0;
    const newId = () => 'a' + Date.now().toString(36) + (un++).toString(36) + Math.floor(Math.random() * 1296).toString(36);
    async function add(blob, name) {
        let buf = await decode(blob), id = newId(), e = entry(id, name, buf);
        pool.set(id, e);
        await put({ id, name, type: blob.type || '', blob, at: Date.now() });
        told();
        return e;
    }
    let toldT = 0; const told = () => { clearTimeout(toldT); toldT = setTimeout(() => { if (window.NBX && NBX.browseSounds) NBX.browseSounds(); }, 120); };
    async function addBuf(buf, name, made) {
        let id = newId(), e = entry(id, name, buf), blob = NB.wav(buf, 24);
        pool.set(id, e);
        await put({ id, name, type: 'audio/wav', blob, at: Date.now(), made: made ? 1 : 0 });
        told();
        return e;
    }

    function rateOf(pr, tr, c) {
        let s = tr.snd || {}, sh = Math.round(((s.cxTune == null ? 0.5 : s.cxTune) - 0.5) * 48) + ((s.cxFine == null ? 0.5 : s.cxFine) - 0.5) * 2 + (c.semi || 0);
        return (c.warp && c.abpm ? pr.bpm / c.abpm : 1) * Math.pow(2, sh / 12) * (c.spd || 1);
    }
    const beatsFor = (pr, at, dur) => NB.steady(pr) ? dur / (60 / pr.bpm) : NB.beatAt(pr, NB.secAt(pr, at) + dur) - at;
    const paceAt = (pr, at) => NB.steady(pr) ? pr.bpm : Math.round(NB.tempoAt(pr, at) * 1000) / 1000;
    // warping. this was HARD. dont touch it
    function warpMap(pr, tr, c, e) {
        if (!c.warp || c.rev || !Array.isArray(c.wm) || !c.wm.length) return null;
        let sp0 = 60 / pr.bpm * rateOf(pr, tr, c), M = [[0, 0]].concat(c.wm.filter(q => q[0] > 0 && q[0] < e.dur)), n = M.length;
        const seg = u => { let i = 0; while (i < n - 1 && M[i + 1][1] <= u) i++; return i; }, seg2 = sx => { let i = 0; while (i < n - 1 && M[i + 1][0] <= sx) i++; return i; };
        const slope = u => { if (u < 0) return sp0; let i = seg(u); return i < n - 1 ? (M[i + 1][0] - M[i][0]) / (M[i + 1][1] - M[i][1]) : sp0; };
        const S = u => { if (u < 0) return u * sp0; let i = seg(u); return M[i][0] + (u - M[i][1]) * slope(u); };
        const U = sx => { if (sx < 0) return sx / sp0; let i = seg2(sx), k = i < n - 1 ? (M[i + 1][0] - M[i][0]) / (M[i + 1][1] - M[i][1]) : sp0; return M[i][1] + (sx - M[i][0]) / k; };
        return { S, U, slope, sp0, marks: M.slice(1).map(q => q[1]) };
    }
    function pieces(pr, tr, c, e) {
        let r = rateOf(pr, tr, c), sp = 60 / pr.bpm * r, end = c.at + c.len, off = c.off || 0, out = [], left = e.dur / sp - off;
        let W = warpMap(pr, tr, c, e);
        if (W) { let pos = W.S(off), lf = W.U(e.dur) - off, adv = (s0, b) => W.S(off + b - s0) - pos;
            if (lf > 0) { if (c.lp > 0) { for (let k = 0; k < 4096; k++) { let base = c.at + k * c.lp; if (base >= end) break; let s1 = Math.min(base + Math.min(c.lp, lf), end); if (s1 > base + 1e-6) out.push([base, s1, pos]); } }
                else { let s1 = Math.min(end, c.at + lf); if (s1 > c.at + 1e-6) out.push([c.at, s1, pos]); } }
            return { out, r, sp, adv, W, u0: off };
        }
        if (!c.warp && !NB.steady(pr)) {
            let lefts = e.dur - off * sp, adv = (s0, b) => (NB.secAt(pr, b) - NB.secAt(pr, s0)) * r, upTo = (b, secs) => NB.beatAt(pr, NB.secAt(pr, b) + secs / r);
            if (lefts <= 0) return { out, r, sp, adv };
            if (c.lp > 0) { for (let k = 0; k < 4096; k++) { let base = c.at + k * c.lp; if (base >= end) break; let s1 = Math.min(base + c.lp, upTo(base, lefts), end); if (s1 > base + 1e-6) out.push([base, s1, off * sp]); } }
            else { let s1 = Math.min(end, upTo(c.at, lefts)); if (s1 > c.at + 1e-6) out.push([c.at, s1, off * sp]); }
            return { out, r, sp, adv };
        }
        let adv = (s0, b) => (b - s0) * sp;
        if (left <= 0) return { out, r, sp, adv };
        if (c.lp > 0) {
            for (let k = 0; k < 4096; k++) { let base = c.at + k * c.lp; if (base >= end) break; let s1 = Math.min(base + Math.min(c.lp, left), end); if (s1 > base + 1e-6) out.push([base, s1, off * sp]); }
        } else { let s1 = Math.min(end, c.at + left); if (s1 > c.at + 1e-6) out.push([c.at, s1, off * sp]); }
        return { out, r, sp, adv };
    }
    function play(R, c, ch, e, t, pos, dur, rate, fromB, tillB, P, s0, tr) {
        let pr = R.pr, ctx = R.ctx, s = ctx.createBufferSource(), g = ctx.createGain(), spb = 60 / pr.bpm, still = NB.steady(pr), sec = (b1, b2) => still ? (b2 - b1) * spb : NB.secAt(pr, b2) - NB.secAt(pr, b1);
        s.buffer = bufFor(ctx, e, c.rev);
        let r0 = c.warp && !still ? rate * NB.tempoAt(pr, fromB) / pr.bpm : rate; s.playbackRate.value = r0;
        if (P && P.W) { let W = P.W, u0 = P.u0, T = b => t + sec(fromB, b), S = NB.tmap(pr).S, rateAt = (b, after) => W.slope(u0 + b - s0 + (after ? 1e-7 : -1e-7)) * (still ? pr.bpm : NB.tempoAt(pr, b)) / 60;
            let cuts = W.marks.map(u => s0 + u - u0); if (!still) S.forEach(G => cuts.push(G.b0)); cuts = cuts.filter(b => b > fromB + 1e-9 && b < tillB - 1e-9).sort((a, b) => a - b);
            r0 = rateAt(fromB, true); s.playbackRate.value = r0; s.playbackRate.setValueAtTime(r0, t);
            [fromB].concat(cuts).forEach((b, i, A) => { let nb = i + 1 < A.length ? A[i + 1] : tillB, G = still ? null : S.find(q => q.b0 <= b + 1e-9 && q.b1 > b + 1e-9);
                if (G && Math.abs(G.k) > 1e-12) s.playbackRate.exponentialRampToValueAtTime(rateAt(nb, false), T(nb));
                if (i + 1 < A.length) s.playbackRate.setValueAtTime(rateAt(nb, true), T(nb)); });
            rate = r0; }
        else if (c.warp && !still) { let k = rate / pr.bpm, T = b => t + sec(fromB, b); s.playbackRate.setValueAtTime(r0, t);
            NB.tmap(pr).S.forEach((G, i) => { if (G.b1 <= fromB + 1e-9 || G.b0 >= tillB - 1e-9) return; if (G.b0 > fromB + 1e-9) s.playbackRate.setValueAtTime(G.v0 * k, T(G.b0));
                if (Math.abs(G.k) > 1e-12) { let bb = Math.min(G.b1, tillB); s.playbackRate.exponentialRampToValueAtTime((G.v0 + G.k * (bb - G.b0)) * k, T(bb)); } }); rate = r0; }
        let lvl = c.g == null ? 1 : c.g, fi = sec(c.at, c.at + (c.fi || 0)), fo = sec(c.at + c.len - (c.fo || 0), c.at + c.len), end = t + dur, cs = t + sec(fromB, c.at), ce = t + sec(fromB, c.at + c.len);
        let xa = 0, xb = 0; if (tr) tr.clips.forEach(q => { if (q === c || !q.src || q.mute) return; let qe = q.at + q.len;
            if (q.at < c.at - 1e-6 && qe > c.at + 1e-6 && qe < c.at + c.len) xa = Math.max(xa, qe - c.at); if (q.at > c.at + 1e-6 && q.at < c.at + c.len - 1e-6 && qe > c.at + c.len) xb = Math.max(xb, c.at + c.len - q.at); });
        let xi = xa > 1 / 64 ? sec(c.at, c.at + xa) : 0, xo = xb > 1 / 64 ? sec(c.at + c.len - xb, c.at + c.len) : 0;
        const f = q => lvl * (fi > 0 ? Math.min(1, Math.max(0, (q - cs) / fi)) : 1) * (fo > 0 ? Math.min(1, Math.max(0, (ce - q) / fo)) : 1)
            * (xi > 0 ? Math.sin(Math.PI / 2 * Math.min(1, Math.max(0, (q - cs) / xi))) : 1) * (xo > 0 ? Math.sin(Math.PI / 2 * Math.min(1, Math.max(0, (ce - q) / xo))) : 1);
        let early = Math.min(0.0015, pos / Math.max(0.01, rate), Math.max(0, t - ctx.currentTime)), t0 = t - early; pos -= early * rate;
        let pts = [[t0, 0], [t + 0.0015, f(t + 0.0015)], [end - 0.0015, f(end - 0.0015)], [end + 0.0015, 0]];
        if (fi > 0 && cs + fi > t + 0.0015 && cs + fi < end - 0.0015) pts.push([cs + fi, f(cs + fi)]);
        if (fo > 0 && ce - fo > t + 0.0015 && ce - fo < end - 0.0015) pts.push([ce - fo, f(ce - fo)]);
        for (let k = 1; k < 12; k++) { let qa = cs + xi * k / 12, qb = ce - xo * k / 12; if (xi > 0 && qa > t + 0.0015 && qa < end - 0.0015) pts.push([qa, f(qa)]); if (xo > 0 && qb > t + 0.0015 && qb < end - 0.0015) pts.push([qb, f(qb)]); }
        if (xi > 0 && cs + xi > t + 0.0015 && cs + xi < end - 0.0015) pts.push([cs + xi, f(cs + xi)]); if (xo > 0 && ce - xo > t + 0.0015 && ce - xo < end - 0.0015) pts.push([ce - xo, f(ce - xo)]);
        pts.sort((a, b) => a[0] - b[0]);
        g.gain.setValueAtTime(0, t0); pts.slice(1).forEach(([q, v]) => g.gain.linearRampToValueAtTime(v, q));
        s.connect(g); g.connect(ch.vx ? ch.vx.in : ch.in);
        s.start(t0, Math.max(0, Math.min(e.dur - 0.001, pos))); s.stop(end + 0.006);
        let o = { s, g }; (R.srcs = R.srcs || new Set()).add(o);
        s.onended = () => { R.srcs.delete(o); try { g.disconnect(); } catch (er) {} };
    }
    function sched(R, b0, b1, tb, st) {
        let pr = R.pr, spb = 60 / pr.bpm, stopAt = st.end != null ? st.end : 1e9;
        pr.tracks.forEach(tr => {
            if (!NB.V[tr.inst] || NB.V[tr.inst].kind !== 'audio') return;
            let ch = R.ch[tr.uid]; if (!ch) return;
            tr.clips.forEach(c => {
                if (!c.src || c.mute || c.at >= b1 || c.at + c.len <= b0) return;
                let e = pool.get(c.src); if (!e) { load(c.src); return; } if (e.state !== 'ok') return;
                let P = pieces(pr, tr, c, e);
                P.out.forEach(([s0, s1, pos]) => {
                    let from;
                    if (s0 >= b0 - 1e-9 && s0 < b1 - 1e-9) from = s0;
                    else if (st.jump && s0 < b0 && s1 > b0 + 1e-6) from = b0;
                    else return;
                    let till = Math.min(s1, stopAt); if (till <= from + 1e-6) return;
                    play(R, c, ch, e, tb(from), pos + P.adv(s0, from), NB.steady(pr) ? (till - from) * spb : NB.secAt(pr, till) - NB.secAt(pr, from), P.r, from, till, P, s0, tr);
                });
            });
        });
    }
    function hush(R, t) {
        if (!R.srcs) return;
        R.srcs.forEach(o => { try { o.g.gain.cancelScheduledValues(t); o.g.gain.setTargetAtTime(0, t, 0.01); o.s.stop(t + 0.08); } catch (e) {} });
        R.srcs.clear();
    }
    function trig(R, tr, ch, t, d, n, vel, ex) {
        let X = NX(), sc = X && X.selClip ? X.selClip() : null, c = sc && sc.tr === tr && sc.c.src ? sc.c : tr.clips.find(q => q.src); if (!c) return;
        let e = pool.get(c.src); if (!e || e.state !== 'ok') return;
        let pr = R.pr, base = rateOf(pr, tr, c), r = base * Math.pow(2, ((n.m == null ? 60 : n.m) - 60) / 12), pos = (c.off || 0) * 60 / pr.bpm * base;
        let len = Math.max(0.02, Math.min(ex.hold ? 30 : d, (e.dur - pos) / r)); if (pos >= e.dur) return;
        let ctx = R.ctx, s = ctx.createBufferSource(), g = ctx.createGain(), lvl = (c.g == null ? 1 : c.g) * Math.max(0.05, Math.min(1.2, vel));
        s.buffer = bufFor(ctx, e, c.rev); s.playbackRate.value = r;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(lvl, t + 0.004); g.gain.setValueAtTime(lvl, t + Math.max(0.005, len - 0.02)); g.gain.linearRampToValueAtTime(0, t + len);
        s.connect(g); g.connect(ch.vx ? ch.vx.in : ch.in); s.start(t, pos); s.stop(t + len + 0.03);
        if (ex.hold) ex.hold.push({ g: g.gain, rel: 0.05, o: [s] });
        let o = { s, g }; (R.srcs = R.srcs || new Set()).add(o); s.onended = () => { R.srcs.delete(o); try { g.disconnect(); } catch (er) {} };
    }

    function drawWave(x, pr, tr, c, y, h, bx, vb0, vb1, col) {
        let e = pool.get(c.src);
        if (!e || e.state !== 'ok') { if (!e) load(c.src); x.fillStyle = '#fff'; x.globalAlpha = 0.6; x.font = '9px Courier New'; x.fillText(TL(e && e.state === 'missing' ? '✕ the sound is gone from this browser' : 'loading…'), Math.max(bx(c.at), bx(vb0)) + 4, y + h / 2 + 3); x.globalAlpha = 1; return; }
        let P = pieces(pr, tr, c, e), ppb = bx(1) - bx(0), mid = y + h / 2, amp = h / 2 * 0.95 * Math.min(1.6, c.g == null ? 1 : c.g) / Math.max(0.25, e.top);
        x.fillStyle = '#fff'; x.globalAlpha = 0.82; x.shadowColor = col; x.shadowBlur = 3;
        P.out.forEach(([s0, s1, pos], k) => {
            let X0 = Math.max(bx(s0), bx(vb0)), X1 = Math.min(bx(s1), bx(vb1)), xs = bx(s0);
            if (k) { x.globalAlpha = 0.4; x.fillRect(xs, y, 1, h); x.globalAlpha = 0.82; }
            for (let px = Math.floor(X0); px < X1; px++) {
                let ta = pos + P.adv(s0, s0 + (px - xs) / ppb), tb2 = pos + P.adv(s0, s0 + (px + 1 - xs) / ppb), i0 = Math.floor(ta * e.sr / 256), i1 = Math.max(i0 + 1, Math.ceil(tb2 * e.sr / 256)), m = 0;
                if (c.rev) { let j0 = e.peaks.length - i1, j1 = e.peaks.length - i0; i0 = j0; i1 = j1; }
                for (let i = Math.max(0, i0); i < Math.min(e.peaks.length, i1); i++) if (e.peaks[i] > m) m = e.peaks[i];
                let a = Math.min(h / 2, m * amp); x.fillRect(px, mid - a, 1, Math.max(1, a * 2));
            }
        });
        x.shadowBlur = 0; x.globalAlpha = 1;
        let fi = c.fi || 0, fo = c.fo || 0;
        if (fi > 0 || fo > 0) { x.strokeStyle = '#fff'; x.globalAlpha = 0.6; x.lineWidth = 1; x.beginPath(); if (fi > 0) { x.moveTo(bx(c.at), y + h); x.lineTo(bx(c.at + fi), y); } if (fo > 0) { x.moveTo(bx(c.at + c.len - fo), y); x.lineTo(bx(c.at + c.len), y + h); } x.stroke(); x.globalAlpha = 1; }
    }

    const OKF = f => /^audio\//.test(f.type) || /\.(wav|wave|mp3|ogg|oga|flac|m4a|aac|opus|webm|aif|aiff)$/i.test(f.name);
    async function dropFiles(files, tr, at) {
        let X = NX(), list = [...files].filter(OKF), pr = X.pr;
        if (!list.length) { X.flash('only sound files go on the timeline (wav, mp3, ogg, flac, that kind of thing)'); return; }
        if (!tr || NB.V[tr.inst].kind !== 'audio') { tr = X.addTrack('audio'); if (!tr) return; }
        X.mark(); let made = 0, b = Math.max(0, at || 0);
        for (const f of list) {
            X.flash('reading ' + f.name);
            try {
                let e = await add(f, f.name.replace(/\.[^.]+$/, '').slice(0, 40)), len = beatsFor(pr, b, e.dur);
                let c = NB.newClip(b, Math.max(0.25, Math.round(len * 1000) / 1000)); c.src = e.id; c.name = e.name; c.abpm = paceAt(pr, b); c.lp = 0; tr.clips.push(c);
                b += c.len; made++; X.pick(tr.uid, c.uid);
            } catch (err) { X.flash('couldnt read ' + f.name + ' (the browser doesnt know that kind of file)'); }
        }
        if (made) { X.touch(); X.showAll(); X.flash(made === 1 ? 'in ♡' : made + ' sounds in ♡'); if (X.browseSounds) X.browseSounds(); }
    }
    function pickFiles(tr, at) {
        let fi = document.createElement('input'); fi.type = 'file'; fi.multiple = true; fi.accept = 'audio/*,.wav,.mp3,.ogg,.flac,.m4a,.aif,.aiff';
        fi.onchange = () => { if (fi.files && fi.files.length) dropFiles(fi.files, tr, at); };
        fi.click();
    }

    function list() { return tx('readonly', st => st.getAll()).then(all => (all || []).map(r => ({ id: r.id, name: r.name, at: r.at || 0, made: !!r.made, size: r.blob ? r.blob.size : 0, dur: pool.get(r.id) && pool.get(r.id).dur })).sort((a, b) => b.at - a.at)); }
    async function remove(id) { await del(id); pool.delete(id); }
    async function wipe() { let ks = await allKeys(); for (const k of ks || []) await del(k); pool.clear(); return (ks || []).length; }
    async function place(id, tr, at) {
        let X = NX(), pr = X.pr, e = await load(id);
        if (!e || e.state !== 'ok') { X.flash('that sound isnt here any more'); return; }
        if (!tr || tr.isMaster || NB.V[tr.inst].kind !== 'audio') { tr = X.addTrack('audio'); if (!tr) return; }
        X.mark(); let c = NB.newClip(Math.max(0, at || 0), Math.round(beatsFor(pr, Math.max(0, at || 0), e.dur) * 1000) / 1000); c.src = id; c.name = e.name; c.abpm = paceAt(pr, Math.max(0, at || 0)); c.lp = 0; tr.clips.push(c);
        X.pick(tr.uid, c.uid); X.touch(); X.showAll();
    }
    const previewId = id => load(id).then(e => { if (e && e.state === 'ok') preview(e); });

    const REC = { node: null, stream: null, src: null, mon: null, tr: null, going: false, chunks: [], lvl: 0, n: 0, mods: new WeakSet() };
    const WKREC = `class NbRec extends AudioWorkletProcessor{constructor(){super();this.on=false;this.b=[];this.n=0;this.t=0;this.pk=0;this.c=0;
this.port.onmessage=e=>{if(e.data===false&&this.b.length){this.port.postMessage({t:this.t,b:this.b});this.b=[];this.n=0;}this.on=!!e.data;};}
process(ins){const x=ins[0];if(x&&x.length&&x[0]){if(this.on){if(!this.n)this.t=currentTime;this.b.push(x.map(c=>c.slice()));this.n+=x[0].length;if(this.n>=8192){this.port.postMessage({t:this.t,b:this.b});this.b=[];this.n=0;}}
let p=0;for(let k=0;k<x[0].length;k++){const a=x[0][k]<0?-x[0][k]:x[0][k];if(a>p)p=a;}this.pk=Math.max(p,this.pk*0.93);}if(++this.c%6===0)this.port.postMessage({pk:this.pk});return true;}}
registerProcessor('nb-rec',NbRec);`;
    const armed = uid => !!REC.node && REC.tr === uid;
    async function arm(tr) {
        let X = NX(), L = X.eng(); if (!L) { X.flash('this browser has no sound for me'); return false; }
        if (armed(tr.uid)) return true;
        disarm();
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !L.ctx.audioWorklet) { X.flash('this browser wont let me record'); return false; }
        X.flash('asking for the mic (only for this, only while its armed)');
        let st;
        try { st = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); }
        catch (e) { X.flash('no mic then. nothing got recorded'); return false; }
        try {
            if (L.ctx.state === 'suspended') await L.ctx.resume();
            if (!REC.mods.has(L.ctx)) { let u = URL.createObjectURL(new Blob([WKREC], { type: 'application/javascript' })); await L.ctx.audioWorklet.addModule(u); URL.revokeObjectURL(u); REC.mods.add(L.ctx); }
            let src = L.ctx.createMediaStreamSource(st), node = new AudioWorkletNode(L.ctx, 'nb-rec', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] }), sink = L.ctx.createGain(), mon = L.ctx.createGain();
            sink.gain.value = 0; mon.gain.value = 0; src.connect(node); node.connect(sink); sink.connect(L.ctx.destination); src.connect(mon);
            L.R.sync(); let ch = L.R.ch[tr.uid]; if (ch) mon.connect(ch.vx ? ch.vx.in : ch.in);
            node.port.onmessage = ev => { let d = ev.data; if (d.pk != null) REC.lvl = d.pk; else if (d.b) REC.chunks.push(d); };
            let set = st.getAudioTracks()[0] && st.getAudioTracks()[0].getSettings ? st.getAudioTracks()[0].getSettings() : {};
            Object.assign(REC, { node, stream: st, src, sink, mon, tr: tr.uid, inLat: isFinite(set.latency) ? set.latency : 0.01 });
            if (REC.hear) mon.gain.value = 1;
            X.flash('● armed. the mic is on until you disarm it');
            X.showAll(); return true;
        } catch (e) { st.getTracks().forEach(t => t.stop()); X.flash('the mic broke: ' + (e && e.message || e)); return false; }
    }
    function disarm() {
        if (REC.going) finish();
        if (REC.stream) REC.stream.getTracks().forEach(t => t.stop());
        ['src', 'node', 'sink', 'mon'].forEach(k => { if (REC[k]) { try { REC[k].disconnect(); } catch (e) {} REC[k] = null; } });
        REC.stream = null; REC.tr = null; REC.lvl = 0;
    }
    function hear(on) { REC.hear = on; if (REC.mon) REC.mon.gain.value = on ? 1 : 0; }
    function start() {
        let X = NX(), pr = X.pr, L = X.live(); if (!L || !REC.node) return;
        let rq = pr.rq || {}, Lp = pr.loop, ok = Lp.b > Lp.a + 0.01, punch = !!rq.punch && ok, takes = !punch && rq.takes !== 0 && Lp.on && ok;
        REC.mode = punch ? 'punch' : takes ? 'takes' : 'plain'; REC.loopWas = Lp.on; if (!takes) Lp.on = 0; REC.chunks = []; REC.going = true;
        REC.node.port.postMessage(true);
        let from = takes ? Lp.a : (X.V() || {}).cursor || 0; X.play(from, X.preOf ? X.preOf(from) : 0);
        let a = L.anchors && L.anchors[0]; REC.playB = from; REC.playT = a ? a.t + NB.secAt(pr, from) - NB.secAt(pr, a.b) : L.ctx.currentTime;
        X.showAll();
    }
    function cutBuf(ctx, buf, s0, s1) { let sr = buf.sampleRate, a = Math.max(0, Math.round(s0 * sr)), b = Math.min(buf.length, Math.round(s1 * sr)), n = Math.max(1, b - a), o = ctx.createBuffer(buf.numberOfChannels, n, sr);
        for (let k = 0; k < buf.numberOfChannels; k++) o.getChannelData(k).set(buf.getChannelData(k).subarray(a, a + n)); return o; }
    function lay(tr, A, Bb) {
        tr.clips.slice().forEach(q => {
            if (!q.src || q.at >= Bb || q.at + q.len <= A) return;
            if (q.at >= A && q.at + q.len <= Bb) { tr.clips.splice(tr.clips.indexOf(q), 1); return; }
            if (q.at < A && q.at + q.len > Bb) { let tail = JSON.parse(JSON.stringify(q)); tail.uid = NB.uid('c'); tail.off = (q.off || 0) + (Bb - q.at); tail.at = Bb; tail.len = q.at + q.len - Bb; tr.clips.push(tail); }
            if (q.at < A) { q.len = A - q.at; return; }
            let cut = Bb - q.at; q.at = Bb; q.off = (q.off || 0) + cut; q.len -= cut;
        });
    }
    function finish() {
        if (!REC.going) return;
        REC.going = false; let X = NX(), pr = X.pr, L = X.live(), tr = X.trk(REC.tr);
        pr.loop.on = REC.loopWas;
        if (REC.node) REC.node.port.postMessage(false);
        setTimeout(async () => {
            let ch = REC.chunks; REC.chunks = [];
            if (!ch.length || !L || !tr) { X.flash('nothing got recorded'); return; }
            let sr = L.ctx.sampleRate, nc = Math.max(1, Math.min(2, ch[0].b[0].length)), total = 0;
            ch.forEach(k => k.b.forEach(bl => { total += bl[0].length; }));
            let comp = (L.ctx.outputLatency || 0) + (L.ctx.baseLatency || 0) + (REC.inLat || 0), skip = Math.max(0, Math.round((REC.playT - ch[0].t + comp) * sr)), len = total - skip;
            if (len < sr * 0.05) { X.flash('too short, binned it'); return; }
            let buf = L.ctx.createBuffer(nc, len, sr), outs = []; for (let c = 0; c < nc; c++) outs.push(buf.getChannelData(c));
            let i = 0; ch.forEach(k => k.b.forEach(bl => { for (let j = 0; j < bl[0].length; j++, i++) { if (i < skip) continue; for (let c = 0; c < nc; c++) outs[c][i - skip] = (bl[c] || bl[0])[j]; } }));
            let Lp = pr.loop, A = REC.playB, mode = REC.mode || 'plain';
            if (mode === 'punch') { let pa = Math.max(Lp.a, A), s0 = NB.secAt(pr, pa) - NB.secAt(pr, A), s1 = NB.secAt(pr, Lp.b) - NB.secAt(pr, A);
                if (s0 >= buf.duration - 0.05) { X.flash('it stopped before the punch in. nothing kept'); return; } buf = cutBuf(L.ctx, buf, s0, Math.min(s1, buf.duration)); A = pa; }
            let parts = [buf];
            if (mode === 'takes') { let P = NB.secAt(pr, Lp.b) - NB.secAt(pr, Lp.a), n = Math.floor(buf.duration / P + 1e-6), rest = buf.duration - n * P; if (rest >= P * 0.25) n++;
                if (n >= 2) { parts = []; for (let k = 0; k < n; k++) parts.push(cutBuf(L.ctx, buf, k * P, Math.min(buf.duration, (k + 1) * P))); } else if (n === 1) parts = [cutBuf(L.ctx, buf, 0, Math.min(buf.duration, P))]; }
            let es = []; for (const pb of parts) { REC.n++; es.push(await addBuf(pb, 'take ' + REC.n)); }
            let e = es[es.length - 1], Bb = mode === 'takes' && es.length > 1 ? Lp.b : A + beatsFor(pr, A, e.dur);
            X.mark(); lay(tr, A, Bb);
            let c = NB.newClip(A, Math.round((Bb - A) * 1000) / 1000); c.src = e.id; c.name = e.name; c.abpm = paceAt(pr, A); c.lp = 0; if (es.length > 1) c.takes = es.map(q => q.id); tr.clips.push(c);
            X.pick(tr.uid, c.uid); X.touch(); X.showAll(); if (X.browseSounds) X.browseSounds();
            X.flash(es.length > 1 ? '● ' + es.length + ' takes on one clip, the last one playing. right click it → TAKES to hear + pick, split it to mix them' : '● ' + e.name + ' · ' + e.dur.toFixed(1) + 's');
        }, 160);
    }
    async function recButton() {
        let X = NX(), tr = X.selTr();
        if (REC.going) { X.stop(); return; }
        if (!tr || tr.isMaster || NB.V[tr.inst].kind !== 'audio') return;
        if (!armed(tr.uid)) { let ok = await arm(tr); if (!ok) return; }
        start();
    }
    const owns = () => { let X = NX(), tr = X && X.selTr(); return !!(REC.going || (tr && !tr.isMaster && NB.V[tr.inst] && NB.V[tr.inst].kind === 'audio')); };
    function stopped() { if (REC.going) finish(); }

    const b64 = blob => new Promise((res, rej) => { let r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.onerror = rej; r.readAsDataURL(blob); });
    async function pack(pr, json) {
        let ids = [...srcsOf(pr)]; if (!ids.length) return json;
        let o = JSON.parse(json); o.sounds = [];
        for (const id of ids) { let rec = await get(id).catch(() => null); if (rec && rec.blob) o.sounds.push({ id, name: rec.name, type: rec.type || 'audio/wav', b64: await b64(rec.blob) }); }
        return JSON.stringify(o);
    }
    async function unpack(list) {
        for (const s of list || []) {
            if (!s || !s.id || !s.b64) continue;
            let bin = atob(s.b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
            await put({ id: s.id, name: s.name || 'sound', type: s.type || '', blob: new Blob([u8], { type: s.type || '' }), at: Date.now() }).catch(() => {});
            pool.delete(s.id);
        }
    }

    function soundPanel(box, tr) {
        let X = NX(), el = X.el, btn = X.btn, s = X.sec('録音 AUDIO', 'drop sound files on the timeline, or load them here. ● records the mic into this track from the cursor');
        let r = el('div', 'nb-row');
        r.appendChild(btn('＋ LOAD SOUNDS', 'sm', () => pickFiles(tr, (X.V() || {}).cursor || 0), 'wav, mp3, ogg, flac, m4a. they go in at the cursor, one after another'));
        let on = armed(tr.uid);
        r.appendChild(btn(REC.going ? '■ STOP' : '● RECORD', 'sm rec' + (REC.going ? ' on' : ''), () => recButton().then(() => X.showDock()), 'plays from the cursor and records the mic. stop = the take lands as a clip'));
        r.appendChild(btn(on ? '◉ ARMED (mic on)' : '○ ARM', 'sm' + (on ? ' on' : ''), () => { if (on) { disarm(); X.showAll(); } else arm(tr).then(() => X.showDock()); }, on ? 'click to let go of the mic' : 'asks for the mic and holds it ready'));
        r.appendChild(btn('HEAR ME', 'sm' + (REC.hear ? ' on' : ''), () => { hear(!REC.hear); X.showDock(); }, 'hear the mic through this track (its plugins too). headphones, or it howls'));
        let mt = el('span', 'nb-recmtr'); mt.innerHTML = '<i></i>'; mt.title = 'the mic level'; r.appendChild(mt);
        s.appendChild(r);
        s.appendChild(el('div', 'nb-hint', 'the mic is only ever on after you press ● or ARM on an audio track, and it lets go when you DISARM or close the box. what it hears stays in this browser'));
        if (on) { const tick = () => { if (!mt.isConnected) return; let v = Math.min(1, REC.lvl * 1.4); mt.firstChild.style.width = (v * 100) + '%'; mt.firstChild.style.background = v > 0.95 ? '#ff4a5a' : v > 0.7 ? '#ffe36d' : '#6dffb0'; requestAnimationFrame(tick); }; tick(); }
        let ids = []; tr.clips.forEach(c => { if (c.src && ids.indexOf(c.src) < 0) ids.push(c.src); });
        let list = el('div', 'nb-saves');
        if (!ids.length) list.appendChild(el('div', 'nb-hint', 'no sounds on this track yet'));
        ids.forEach(id => {
            let e = pool.get(id), row = el('div', 'nb-sv');
            row.appendChild(el('span', '', e && e.state === 'ok' ? e.name + '  ·  ' + e.dur.toFixed(2) + 's  ·  ' + (e.ch.length > 1 ? 'stereo' : 'mono') + ' ' + Math.round(e.sr / 100) / 10 + 'k' : (e && e.state === 'missing' ? '✕ missing' : 'loading…')));
            if (e && e.state === 'ok') {
                row.appendChild(btn('▶', 'sm', () => preview(e), 'hear it'));
                row.appendChild(btn('＋ AT CURSOR', 'sm', () => { let pr = X.pr, at = (X.V() || {}).cursor || 0; X.mark(); let c = NB.newClip(at, Math.round(beatsFor(pr, at, e.dur) * 1000) / 1000); c.src = id; c.name = e.name; c.abpm = paceAt(pr, at); c.lp = 0; tr.clips.push(c); X.pick(tr.uid, c.uid); X.touch(); X.showAll(); }));
            }
            list.appendChild(row);
        });
        s.appendChild(list);
        box.appendChild(s);
    }
    let pv = null;
    function preview(e, from, rev, rate) {
        let X = NX(), L = X.eng(); if (!L) return;
        if (L.ctx.state === 'suspended') L.ctx.resume();
        if (pv) { try { pv.stop(); } catch (er) {} pv = null; }
        let s = L.ctx.createBufferSource(), g = L.ctx.createGain(); s.buffer = bufFor(L.ctx, e, rev); s.playbackRate.value = rate || 1; g.gain.value = 0.9;
        s.connect(g); g.connect(L.R.M.bus); s.start(L.ctx.currentTime + 0.01, Math.max(0, from || 0)); pv = s; s.onended = () => { if (pv === s) pv = null; };
    }

    function clipTab(box, tr, c) {
        let X = NX(), el = X.el, btn = X.btn, pr = X.pr, e = pool.get(c.src);
        let bar = el('div', 'nb-row'); bar.style.marginBottom = '5px';
        let nm = el('input', 'nb-in'); nm.value = c.name || ''; nm.placeholder = tr.name; nm.maxLength = 40; nm.oninput = () => { c.name = nm.value; X.save(); X.dirty(); };
        bar.appendChild(el('span', 'nb-lab', tr.name + ' ›')); bar.appendChild(nm);
        if (!e || e.state !== 'ok') { box.appendChild(bar); box.appendChild(el('div', 'nb-hint', e && e.state === 'missing' ? 'this clip\'s sound isnt in this browser any more (cleared, or the song came from somewhere else without it)' : 'loading the sound…')); if (!e) load(c.src).then(() => X.showDock()); return; }
        const re = () => { X.touch(); X.showDock(); };
        bar.appendChild(btn('⟲ REPEAT', 'sm' + (c.lp > 0 ? ' on' : ''), () => { X.mark(); c.lp = c.lp > 0 ? 0 : Math.max(0.25, Math.min(c.len, e.dur / (60 / pr.bpm * rateOf(pr, tr, c)) - (c.off || 0))); re(); }, 'on = the bit you trimmed repeats for as long as the clip is on the timeline'));
        bar.appendChild(btn('⇆ REVERSE', 'sm' + (c.rev ? ' on' : ''), () => { X.mark(); c.rev = c.rev ? 0 : 1; re(); }));
        bar.appendChild(btn('▶ HEAR', 'sm', () => preview(e, (c.off || 0) * 60 / pr.bpm * rateOf(pr, tr, c), c.rev, rateOf(pr, tr, c)), 'from where the clip starts'));
        bar.appendChild(btn('NORMALISE', 'sm', () => { X.mark(); c.g = Math.round(Math.min(4, 0.98 / Math.max(0.001, e.top)) * 100) / 100; re(); }, 'loudest bit = just under the top'));
        bar.appendChild(btn('◆ FIND THE HITS', 'sm' + (c.wm && c.wm.length ? ' on' : ''), () => {
            let cu = NB.MAW.cuts(e, 0, 1, 7 / 8, 1).map(f => f * e.dur).filter(t => t > 0.02 && t < e.dur - 0.02); if (!cu.length) { X.flash('no clear hits in this one'); return; }
            X.mark(); if (!c.warp) { c.warp = 1; c.abpm = c.abpm || pr.bpm; } let U0 = Us; c.wm = cu.map(t => [Math.round(t * 10000) / 10000, Math.round(U0(t) * 1000) / 1000]);
            c.wm = c.wm.filter((q, i, A) => !i || q[1] > A[i - 1][1] + 0.02); re(); X.flash('◆ ' + c.wm.length + ' hits marked. drag one along the beats, or ONTO THE GRID'); }, 'marks every hit in the sound, where it plays now. then drag them to the beats you want, or ONTO THE GRID'));
        if (c.wm && c.wm.length) {
            bar.appendChild(btn('◆ ONTO THE GRID', 'sm', () => { X.mark(); let g = pr.grid, M = c.wm.map(q => [q[0], Math.round(q[1] / g) * g]); c.wm = M.filter((q, i) => !i || q[1] > M[i - 1][1] + 1e-6); re(); X.flash('every hit on the nearest ' + (g >= 1 ? g + ' beat' : '1/' + Math.round(4 / g)) + ' step'); }, 'each marked hit pulled onto the nearest grid step (the bits between stretch to fit)'));
            bar.appendChild(btn('✕ ◆', 'sm', () => { X.mark(); delete c.wm; re(); }, 'forget the marked hits (it plays evenly again)'));
        }
        box.appendChild(bar);
        let HB = c.warp ? 186 : 150, wrap = el('div', 'nb-arrbox'); wrap.style.height = HB + 'px'; let cv = el('canvas', 'nb-arrcv'); cv.style.position = 'relative'; cv.style.width = '100%'; cv.style.height = HB + 'px'; wrap.appendChild(cv); box.appendChild(wrap);
        const sp = () => 60 / pr.bpm * rateOf(pr, tr, c);
        const Wm = () => warpMap(pr, tr, c, e), Su = u => { let W = Wm(); return W ? W.S(u) : u * sp(); }, Us = t => { let W = Wm(); return W ? W.U(t) : t / sp(); };
        const draw = () => {
            if (!cv.isConnected) return;
            let w = cv.clientWidth || 600, h = 150, d = Math.min(2, window.devicePixelRatio || 1); if (cv.width !== Math.round(w * d) || cv.height !== Math.round(HB * d)) { cv.width = Math.round(w * d); cv.height = Math.round(HB * d); }
            let x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); x.fillStyle = '#08060a'; x.fillRect(0, 0, w, HB);
            let T = e.dur, tx = t => 8 + t / T * (w - 16), a = Su(c.off || 0), b = Math.min(T, Su((c.off || 0) + (c.lp > 0 ? c.lp : c.len))), mid = h / 2, amp = (h / 2 - 8) / Math.max(0.25, e.top), col = c.col || tr.col;
            for (let px = 8; px < w - 8; px++) {
                let t0 = (px - 8) / (w - 16) * T, t1 = (px - 7) / (w - 16) * T, i0 = Math.floor(t0 * e.sr / 256), i1 = Math.max(i0 + 1, Math.ceil(t1 * e.sr / 256)), m = 0;
                if (c.rev) { let j0 = e.peaks.length - i1; i1 = e.peaks.length - i0; i0 = j0; }
                for (let i = Math.max(0, i0); i < Math.min(e.peaks.length, i1); i++) if (e.peaks[i] > m) m = e.peaks[i];
                let inside = t0 >= a && t0 <= b; x.fillStyle = inside ? col : '#3a2a34'; x.globalAlpha = inside ? 0.95 : 0.6;
                let v = Math.min(h / 2 - 4, m * amp); x.fillRect(px, mid - v, 1, Math.max(1, v * 2));
            }
            x.globalAlpha = 1; x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(8, mid, w - 16, 1);
            if (c.warp) { let UB = HU.ub || Us(T), bu = u => 8 + u / UB * (w - 16), y0 = h + 4;
                x.fillStyle = '#120c14'; x.fillRect(0, h, w, HB - h); x.font = '8px Courier New';
                for (let k = 0; k <= UB + 1e-6; k += (UB > 64 ? 4 : 1)) { let on = Math.abs(NB.barOf(pr, c.at + k - (c.off || 0)).at - (c.at + k - (c.off || 0))) < 1e-6; x.fillStyle = on ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.15)'; x.fillRect(Math.round(bu(k)), h + (on ? 2 : 10), 1, HB - h - (on ? 4 : 12)); }
                x.fillStyle = '#ffe36d'; x.strokeStyle = '#ffe36d'; x.lineWidth = 1;
                (c.wm || []).forEach((q, i) => { let X0 = tx(q[0]), X1 = bu(q[1]); x.globalAlpha = HU.i === i ? 1 : 0.75; x.fillRect(X0 - 0.5, 0, 1, h); x.beginPath(); x.moveTo(X0, h); x.lineTo(X1, HB - 8); x.stroke();
                    x.beginPath(); x.moveTo(X1 - 4, HB - 2); x.lineTo(X1 + 4, HB - 2); x.lineTo(X1, HB - 9); x.fill(); x.globalAlpha = 1; });
                x.fillStyle = '#fff'; x.globalAlpha = 0.5; x.fillText(TL((c.wm || []).length ? 'the beats · drag a ◆ to move its hit' : 'the beats · double click the sound = a ◆ on that hit'), 10, h + 13); x.globalAlpha = 1; }
            [[a, 'START'], [b, 'END']].forEach(([t, lab], k) => { let X0 = tx(t); x.fillStyle = '#fff'; x.fillRect(X0 - (k ? 2 : 0), 0, 2, h); x.fillRect(X0 - (k ? 9 : 0), 0, 9, 12); x.fillStyle = '#000'; x.font = 'bold 8px Courier New'; x.fillText(k ? '◀' : '▶', X0 - (k ? 8 : -1), 9); x.fillStyle = '#fff'; x.font = '9px Courier New'; x.fillText(TL(lab + ' ' + t.toFixed(2) + 's'), X0 + (k ? -70 : 12), h - 6); });
            let ppb = c.fi || c.fo ? (w - 16) / T * sp() : 0;
            if (c.fi) { x.strokeStyle = '#fff'; x.globalAlpha = 0.7; x.beginPath(); x.moveTo(tx(a), h - 4); x.lineTo(tx(a) + c.fi * ppb, 6); x.stroke(); x.globalAlpha = 1; }
            if (c.fo) { x.strokeStyle = '#fff'; x.globalAlpha = 0.7; x.beginPath(); x.moveTo(tx(b) - c.fo * ppb, 6); x.lineTo(tx(b), h - 4); x.stroke(); x.globalAlpha = 1; }
            let L = X.live(); if (X.playing() && L && L.pos() != null) { let p = L.pos(); if (p >= c.at && p < c.at + c.len) { let lt = p - c.at; if (c.lp > 0) lt %= c.lp; let X0 = tx(Su((c.off || 0) + lt)); x.fillStyle = '#fff'; x.fillRect(X0, 0, 1.5, h); } requestAnimationFrame(draw); }
        };
        let act = null, HU = {};
        const hitAt = (px, py) => { let r = cv.getBoundingClientRect(), w = r.width, T = e.dur, x0 = px - r.left, y0 = py - r.top, UB = Us(T), bu = u => 8 + u / UB * (w - 16), tx = t => 8 + t / T * (w - 16);
            let i = (c.wm || []).findIndex(q => y0 > 150 ? Math.abs(bu(q[1]) - x0) < 6 : Math.abs(tx(q[0]) - x0) < 4); return { i, x0, y0, w, T, UB, t: (x0 - 8) / (w - 16) * T }; };
        X.drag(cv, p => {
            let r = cv.getBoundingClientRect(), w = r.width, T = e.dur, t = (p.x - r.left - 8) / (w - 16) * T, a = Su(c.off || 0), b = Su((c.off || 0) + (c.lp > 0 ? c.lp : c.len)), y0 = p.y - r.top;
            if (c.warp && y0 > 150) { let H = hitAt(p.x, p.y); if (H.i < 0) return false; X.mark(); act = 'wm'; HU.i = H.i; HU.ub = H.UB; return; }
            act = Math.abs(t - a) < T * 0.02 ? 'a' : Math.abs(t - b) < T * 0.02 ? 'b' : null; if (!act) return false; X.mark();
        }, p => {
            if (!act) return; let r = cv.getBoundingClientRect(), T = e.dur, t = Math.max(0, Math.min(T, (p.x - r.left - 8) / (r.width - 16) * T)), g = p.shift ? 0 : pr.grid / 4;
            const snap = v => g ? Math.round(v / g) * g : v;
            if (act === 'wm') { let M = c.wm, i = HU.i, lo = i ? M[i - 1][1] + 0.02 : 0.02, hi = i < M.length - 1 ? M[i + 1][1] - 0.02 : 1e9, u = (p.x - r.left - 8) / (r.width - 16) * HU.ub;
                M[i][1] = Math.round(Math.max(lo, Math.min(hi, p.shift ? u : Math.round(u / pr.grid) * pr.grid)) * 1000) / 1000; NB.touch(pr); X.dirty(); draw(); return; }
            if (act === 'a') { let end = (c.off || 0) + (c.lp > 0 ? c.lp : c.len), off = Math.max(0, Math.min(end - 0.05, snap(Us(t)))); if (c.lp > 0) c.lp = end - off; else c.len = end - off; c.off = off; }
            else { let len = Math.max(0.05, snap(Us(t) - (c.off || 0))); if (c.lp > 0) c.lp = len; else c.len = len; }
            NB.touch(pr); X.dirty(); draw();
        }, () => { if (act) { X.touch(); X.showAll(); } act = null; HU.i = null; HU.ub = 0; });
        // double click to drop a warp marker
        cv.addEventListener('dblclick', ev => { let H = hitAt(ev.clientX, ev.clientY); if (H.y0 > 150 || H.t <= 0.005 || H.t >= e.dur - 0.005) return; X.mark(); if (!c.warp) { c.warp = 1; c.abpm = c.abpm || pr.bpm; }
            let u = Math.round(Us(H.t) * 1000) / 1000, M = (c.wm || []).filter(q => Math.abs(q[0] - H.t) > 0.005); M.push([Math.round(H.t * 10000) / 10000, u]); M.sort((p1, p2) => p1[0] - p2[0]); c.wm = M; re(); });
        cv.addEventListener('contextmenu', ev => { ev.preventDefault(); let H = hitAt(ev.clientX, ev.clientY); if (H.i < 0) return; X.mark(); c.wm.splice(H.i, 1); if (!c.wm.length) delete c.wm; re(); });
        cv.addEventListener('mousemove', ev => { let r = cv.getBoundingClientRect(), T = e.dur, t = (ev.clientX - r.left - 8) / (r.width - 16) * T, a = (c.off || 0) * sp(), b = a + (c.lp > 0 ? c.lp : c.len) * sp(); cv.style.cursor = Math.abs(t - a) < T * 0.02 || Math.abs(t - b) < T * 0.02 ? 'ew-resize' : ''; });
        let k = el('div', 'nb-row'); k.style.marginTop = '6px';
        const dB = v => v < 0.001 ? '-inf' : (20 * Math.log10(v) > 0 ? '+' : '') + (20 * Math.log10(v)).toFixed(1) + 'dB';
        k.appendChild(X.knob('GAIN', () => Math.sqrt((c.g == null ? 1 : c.g) / 4), v => { c.g = Math.round(v * v * 4 * 100) / 100; }, { def: 0.5, fmt: v => dB(v * v * 4), start: X.mark, turn: () => { X.apply(); draw(); X.dirty(); }, done: X.touch }));
        k.appendChild(X.knob('FADE IN', () => Math.min(1, (c.fi || 0) / 8), v => { c.fi = Math.round(v * 8 * 100) / 100; }, { def: 0, fmt: v => v < 0.002 ? 'none' : (v * 8).toFixed(2) + ' beats', start: X.mark, turn: () => { draw(); X.dirty(); }, done: X.touch }));
        k.appendChild(X.knob('FADE OUT', () => Math.min(1, (c.fo || 0) / 8), v => { c.fo = Math.round(v * 8 * 100) / 100; }, { def: 0, fmt: v => v < 0.002 ? 'none' : (v * 8).toFixed(2) + ' beats', start: X.mark, turn: () => { draw(); X.dirty(); }, done: X.touch }));
        k.appendChild(el('span', 'nb-lab', 'PITCH'));
        k.appendChild(X.selBox(Array.from({ length: 49 }, (z, i) => [i - 24, (i > 24 ? '+' : '') + (i - 24) + ' st']), c.semi || 0, v => { X.mark(); c.semi = +v; re(); }));
        k.appendChild(btn('FOLLOW TEMPO', 'sm' + (c.warp ? ' on' : ''), () => { X.mark(); c.warp = c.warp ? 0 : 1; c.abpm = c.abpm || pr.bpm; re(); }, 'on = it speeds up + slows down with the song like tape (the pitch goes with it). ITS BPM = the tempo it was made at'));
        k.appendChild(el('span', 'nb-lab', 'ITS BPM'));
        let ib = el('input', 'nb-in'); ib.style.width = '58px'; ib.value = c.abpm || pr.bpm; ib.onchange = () => { let v = parseFloat(ib.value); if (isFinite(v) && v >= 20 && v <= 400) { X.mark(); c.abpm = v; c.warp = 1; re(); } }; ib.addEventListener('keydown', ev => ev.stopPropagation()); k.appendChild(ib);
        k.appendChild(el('span', 'nb-lab', 'FIT TO'));
        [1, 2, 4, 8].forEach(nb => k.appendChild(btn(nb + (nb === 1 ? ' bar' : ' bars'), 'sm', () => {
            X.mark(); let beats = nb * (NB.sigAt ? NB.sigAt(pr, c.at) : pr.sig || 4), want = beats * 60 / pr.bpm, semi = Math.pow(2, (c.semi || 0) / 12), s = tr.snd || {}, tune = Math.pow(2, (Math.round(((s.cxTune == null ? 0.5 : s.cxTune) - 0.5) * 48) + ((s.cxFine == null ? 0.5 : s.cxFine) - 0.5) * 2) / 12);
            let r = e.dur / want / (semi * tune); c.abpm = Math.round(pr.bpm / r * 1000) / 1000; c.warp = 1; c.off = 0; c.len = beats; if (c.lp > 0) c.lp = beats; re();
        }, 'stretch the whole sound to exactly ' + nb + ' bar' + (nb > 1 ? 's' : '') + ' (loops land in time)')));
        box.appendChild(k);
        box.appendChild(el('div', 'nb-hint', e.name + ' · ' + e.dur.toFixed(2) + 's · ' + (e.ch.length > 1 ? 'stereo' : 'mono') + ' · ' + Math.round(e.sr) + 'hz' + (c.warp ? ' · following the tempo (made at ' + c.abpm + ')' : ' · plays at its own speed') + ' · drag START / END on the picture to trim, shift = no snap · the keys play it pitched'));
        requestAnimationFrame(draw);
    }

    function wsola(e, f) {
        let sr = e.sr, N = 2048, H = N / 2, tol = Math.round(sr * 0.008), L = e.n, outLen = Math.ceil(L * f) + N, ch = e.ch, mono = new Float32Array(L);
        for (let i = 0; i < L; i++) { let v = 0; for (const d of ch) v += d[i]; mono[i] = v; }
        let win = new Float32Array(N); for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N);
        let out = ch.map(() => new Float32Array(outLen)), prev = 0;
        for (let o = 0; o + N <= outLen; o += H) {
            let nom = Math.round(o / f), best = nom;
            if (o > 0) {
                let nat = prev + H, bs = -1e30;
                for (let dl = -tol; dl <= tol; dl += 3) { let cpos = nom + dl; if (cpos < 0 || cpos + N > L) continue; let sum = 0; for (let i = 0; i < 512; i += 4) { let a = nat + i; if (a >= L) break; sum += mono[a] * mono[cpos + i]; } if (sum > bs) { bs = sum; best = cpos; } }
            }
            best = Math.max(0, Math.min(L - N, best)); if (best < 0) break;
            for (let k = 0; k < ch.length; k++) { let d = ch[k], y = out[k]; for (let i = 0; i < N; i++) y[o + i] += d[best + i] * win[i]; }
            prev = best;
        }
        let n2 = Math.ceil(L * f), ab = new AudioBuffer({ length: Math.max(1, n2), numberOfChannels: ch.length, sampleRate: sr });
        out.forEach((y, k) => ab.getChannelData(k).set(y.subarray(0, n2)));
        return ab;
    }
    async function keepPitch(c, f) {
        let e = await load(c.src); if (!e || e.state !== 'ok') return false;
        let ab = wsola(e, f), ne = await addBuf(ab, (e.name || 'sound').slice(0, 30) + ' ×' + (Math.round(f * 100) / 100), true);
        c.src = ne.id; c.len = Math.round(c.len * f * 1000) / 1000; c.off = Math.round((c.off || 0) * f * 1000) / 1000; if (c.lp > 0) c.lp = Math.round(c.lp * f * 1000) / 1000; if (c.fi) c.fi *= f; if (c.fo) c.fo *= f;
        return true;
    }
    function soundLeft(pr, tr, c, e) { let W = warpMap(pr, tr, c, e), all = W ? W.U(e.dur) : e.dur / (60 / pr.bpm * rateOf(pr, tr, c)); return all - (c.off || 0) - c.len; }
    function xfade(tr, c, len) {
        let X = NX(), pr = X.pr, n = tr.clips.find(q => q !== c && q.src && Math.abs(q.at - (c.at + c.len)) < 1e-3); if (!n) { X.flash('nothing starts right where this ends'); return; }
        let e = pool.get(c.src); if (!e || e.state !== 'ok') return; let h = len / 2, hc = Math.max(0, Math.min(h, c.lp > 0 ? 0 : soundLeft(pr, tr, c, e))), hn = Math.max(0, Math.min(h, n.off || 0));
        if (hc + hn < 1 / 64) { X.flash('theres no more sound either side to cross over with'); return; }
        X.mark(); c.len = Math.round((c.len + hc) * 1000) / 1000; n.at = Math.round((n.at - hn) * 1000) / 1000; n.off = Math.round(((n.off || 0) - hn) * 1000) / 1000; n.len = Math.round((n.len + hn) * 1000) / 1000; X.touch(); X.showAll();
        X.flash('⤫ they cross over ' + (Math.round((hc + hn) * 1000) / 1000) + ' beats');
    }
    function toKit(tr, c) {
        let X = NX(), pr = X.pr, e = pool.get(c.src); if (!e || e.state !== 'ok') { X.flash('that sound isnt loaded'); return; }
        let W = warpMap(pr, tr, c, e), sp = 60 / pr.bpm * rateOf(pr, tr, c), Su = u => W ? W.S(u) : u * sp, Us = t => W ? W.U(t) : t / sp, off = c.off || 0, L = c.lp > 0 ? c.lp : c.len;
        let st = Math.max(0, Su(off) / e.dur), en = Math.min(1, Su(off + L) / e.dur); if (en - st < 0.01) { X.flash('too short to slice'); return; }
        let nt = X.addTrack('maw'); if (!nt) return;
        let ts = pr.tracks; ts.splice(ts.indexOf(nt), 1); ts.splice(ts.indexOf(tr) + 1, 0, nt);
        Object.assign(nt.snd, { smp: { id: e.id, name: e.name, root: 261.63 }, mode: 0.75, st, en, slices: 0.5, by: 0.75, choke: 0.75, gate: 0.25 }); nt.name = ((c.name || e.name || 'sound') + ' kit').slice(0, 24); nt.col = c.col || tr.col;
        ['vol', 'pan', 'room', 'echo', 'out'].forEach(k => { nt.mix[k] = tr.mix[k]; });
        let cu = NB.MAW.cuts(e, st, en, 0.5, 0.75), k2 = NB.newClip(c.at, c.len); k2.lp = c.lp > 0 ? c.lp : 0; k2.name = nt.name;
        cu.forEach((f, k) => { let t0 = Us(f * e.dur) - off, t1 = (k + 1 < cu.length ? Us(cu[k + 1] * e.dur) : Us(en * e.dur)) - off; if (t0 < -1e-6 || t0 >= L - 1e-6) return; k2.notes.push({ t: Math.round(Math.max(0, t0) * 1000) / 1000, d: Math.max(0.05, Math.round((t1 - t0) * 1000) / 1000), m: 60 + k, v: 0.8 }); });
        nt.clips.push(k2); c.mute = 1; X.pick(nt.uid, k2.uid); X.touch(); X.showAll(); X.flash('⇶ ' + k2.notes.length + ' slices, one a key from middle C. the sound clip is muted, not gone');
    }
    function useTake(c, id) { let X = NX(), e = pool.get(id); X.mark(); c.src = id; if (e && e.name) c.name = e.name; X.touch(); X.showAll(); }
    function hearTakes(tr, c) {
        let X = NX(), L = X.eng(); if (!L) return; if (L.ctx.state === 'suspended') L.ctx.resume(); let pr = X.pr, t = L.ctx.currentTime + 0.05, sec = NB.secAt(pr, c.at + c.len) - NB.secAt(pr, c.at), off = (c.off || 0) * 60 / pr.bpm * rateOf(pr, tr, c);
        c.takes.forEach((id, k) => { let e = pool.get(id); if (!e || e.state !== 'ok') return; let s = L.ctx.createBufferSource(), g = L.ctx.createGain(); s.buffer = bufFor(L.ctx, e, c.rev); g.gain.value = 0.9; s.connect(g); g.connect(L.R.M.bus); s.start(t, Math.min(e.dur - 0.01, off), Math.max(0.05, sec)); t += sec + 0.5; });
        X.flash('▶ ' + c.takes.length + ' takes, one after the other');
    }
    window.NBA = { srcs: pr => [...srcsOf(pr)], hearTakes, useTake, xfade, toKit, soundLeft, warpMap, bufFor, addBuf, keepPitch, remove, wipe, list, place, previewId, need, ready, load, add, sched, hush, trig, drawWave, dropFiles, pickFiles, recButton, owns, stopped, arm, disarm, armed, hear, pack, unpack, soundPanel, clipTab, pool, rateOf, pieces, gc };
})();
