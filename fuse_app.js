
window.os = window.os || {};

(function () {
    const KEY = 'vmp_fuse';
    const DEF = {
        gravity: 2200, bounce: 0.12, friction: 0.12, damp: 0.997, roll: 0.02, cooldown: 0.45,
        laserPct: 15, overMs: 2000, chainMs: 600, chainStep: 0.5, closeCall: 25, holoBonus: 500, tubeW: 270, tubeH: 460,
        shakeEvery: 8, shakeMax: 2, shakeKick: 520, bombEvery: 14, bombR: 22, bombBlast: 130, bombForce: 900, bombKill: 3,
        litEvery: 6, litSecs: 12, litBonus: 15, litShove: 175, litForce: 750, magnetRange: 2.4, magnetPull: 1400,
        shinyChance: 0.03, shinyPay: 2, musicVol: 0.6, rankAt: [0, 40, 120, 300, 600, 1000, 1600, 2500, 4000, 6500, 10000],
        radii: [12, 17, 22, 27, 33, 40, 47, 56, 65, 76, 88], points: [1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66], odds: [24, 26, 24, 16, 10]
    };
    const NAMES = ['pixel', 'button', 'cherry', 'dice', 'gem', 'heart', 'bell', 'disco', 'moon', 'planet', 'holoheart'];
    const U = 2.5;
    const MODES = ['classic', 'bomb', 'lit', 'magnet'];
    const N = () => Object.assign({}, DEF, (typeof appsDB !== 'undefined' && appsDB.fuse) || {});
    const WD = () => (window.gamesDB && window.gamesDB.fuse) || {};
    const bits = (s, n) => String(s == null ? '' : s).split('|').map(x => x.trim().replace(/\{n\}/g, n));
    const L = (k, n, d) => { let p = bits((WD().lines || {})[k] || d || k, n); return p.length > 1 ? p[0] + ' // ' + p[1] : p[0]; };
    const LE = (k, n, d) => { let p = bits((WD().lines || {})[k] || d || k, n); return p[p.length > 1 ? 1 : 0]; };
    const LJ = (k, n, d) => bits((WD().lines || {})[k] || d || k, n)[0];
    const mode = id => { let p = bits((WD().modes || {})[id] || id); return { id, jp: p[0], en: p[1] || p[0], sub: p[2] || '' }; };
    const charm = t => { let p = bits((WD().charms || [])[t - 1] || NAMES[t - 1]); return { jp: p[0], en: p[1] || p[0] }; };
    const calm = () => document.documentElement.classList.contains('reduce-motion');
    const clamp = (x, a, b) => x < a ? a : x > b ? b : x;

    const fresh = () => ({ top: {}, bestTier: {}, holo: 0, runs: 0, fused: 0, shiny: 0, seen: [], mode: 'classic', muted: false, noMusic: false, noSfx: false });
    let D = fresh();
    function loadD() {
        try { let d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d) D = Object.assign(fresh(), d); } catch (e) {}
        if (MODES.indexOf(D.mode) < 0) D.mode = 'classic';
        if (!Array.isArray(D.seen)) D.seen = [];
        if (D.muted) { D.noMusic = D.noSfx = true; D.muted = false; }
    }
    function saveD() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} }

    function world(o) {
        const w = { W: o.W, H: o.H, b: [], t: 0, ev: [], id: 1, mag: [] };
        const R = t => t === 12 ? o.bombR : o.radii[t - 1];
        const wake = b => { b.sleep = false; b.still = 0; };
        w.add = (t, x, y, vx, vy, grow) => {
            let rr = R(t), b = { id: w.id++, t, x, y, ox: x, oy: y, vx: vx || 0, vy: vy || 0, a: 0, w: 0, R: rr, r: grow ? rr * 0.6 : rr, born: w.t, sleep: false, still: 0, touch: false, land: 0, pop: 0 };
            w.b.push(b); return b;
        };
        w.wakeAll = () => w.b.forEach(wake);
        let fuse = [], cons = [], grid = new Map();
        const can = (a, b) => a.t === b.t && a.t < 12 && w.t - a.born > 0.06 && w.t - b.born > 0.06;
        const im = b => 1 / (b.r * b.r);
        let SH = 0.002; const MU = () => o.friction, MUW = () => o.friction * 0.15, MUF = () => o.friction * 1.5, SEP = 260;
        // Positions first, velocities after. The old impulse version turned to mush once the pile got big.
        function collect() {
            let big = 1; for (let b of w.b) if (b.r > big) big = b.r;
            let cs = big * 2; grid.clear();
            for (let b of w.b) { let k = Math.floor(b.x / cs) + Math.floor(b.y / cs + 50) * 4096, c = grid.get(k); if (c) c.push(b); else grid.set(k, [b]); }
            fuse = []; cons = [];
            for (let a of w.b) {
                let kx = Math.floor(a.x / cs), ky = Math.floor(a.y / cs + 50);
                for (let gy = ky - 1; gy <= ky + 1; gy++) for (let gx = kx - 1; gx <= kx + 1; gx++) {
                    let c = grid.get(gx + gy * 4096); if (!c) continue;
                    for (let b of c) {
                        if (b.id <= a.id) continue;
                        let dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy, rr = a.r + b.r;
                        if (d2 >= (rr + 0.6) * (rr + 0.6)) continue;
                        if (can(a, b)) { fuse.push([a, b]); continue; }
                        if (d2 >= rr * rr) continue;
                        a.touch = b.touch = true; if (a.t === 12) a.hit = 1; if (b.t === 12) b.hit = 1;
                        let d = Math.sqrt(d2) || 0.001, nx = dx / d, ny = dy / d;
                        cons.push({ a, b, vn: (b.vx - a.vx) * nx + (b.vy - a.vy) * ny, lam: 0 });
                    }
                }
            }
        }
        function solve(c) {
            let a = c.a, b = c.b, dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 0.001, ov = a.r + b.r - d;
            if (ov <= 0) return;
            if (a.r < a.R || b.r < b.R) { if (c.gb == null) c.gb = 300 * SH; ov = Math.min(ov, c.gb); c.gb -= ov; if (ov <= 0) return; }
            let wa = im(a) * (a.wl || a.fl ? 0.25 : 1), wb = im(b) * (b.wl || b.fl ? 0.25 : 1), nx = dx / d, ny = dy / d;
            if (wa > wb * 4) wb = wa / 4; else if (wb > wa * 4) wa = wb / 4;
            let k = ov / (wa + wb);
            a.x -= nx * k * wa; a.y -= ny * k * wa; b.x += nx * k * wb; b.y += ny * k * wb; c.lam += ov / (im(a) + im(b));
        }
        function walls(b) {
            if (b.x - b.r < 0) { b.lw += (b.r - b.x) / im(b); b.x = b.r; b.touch = true; b.wl = -1; }
            if (b.x + b.r > w.W) { b.lw += (b.x + b.r - w.W) / im(b); b.x = w.W - b.r; b.touch = true; b.wl = 1; }
            if (b.y + b.r > w.H) { b.lf += (b.y + b.r - w.H) / im(b); b.y = w.H - b.r; b.touch = true; b.fl = 1; if (b.t === 12) b.hit = 1; }
        }
        function rub(b, nx, ny, lam, mu, h) {
            let tx = -ny, ty = nx, vt = b.vx * tx + b.vy * ty + b.w * b.r, s = 3 * im(b), lim = mu * lam / h, j = clamp(-vt / s, -lim, lim);
            b.vx += tx * j * im(b); b.vy += ty * j * im(b); b.w += 2 * j * im(b) / b.r;
        }
        function sub(h) {
            SH = h;
            for (let b of w.b) {
                if (b.r < b.R) { b.r += (b.R - b.r) * Math.min(1, h * 24); if (b.R - b.r < 0.05) b.r = b.R; }
                b.vy += o.gravity * h;
                let sp = b.vx * b.vx + b.vy * b.vy; if (sp > 6.25e6) { let k = 2500 / Math.sqrt(sp); b.vx *= k; b.vy *= k; }
                b.ox = b.x; b.oy = b.y; b.x += b.vx * h; b.y += b.vy * h; b.a += b.w * h; b.wl = b.fl = 0; b.lw = b.lf = 0; b.pvx = b.vx; b.pvy = b.vy;
            }
            collect();
            if (fuse.length) { let g = doFuse(); cons = cons.filter(c => !g.has(c.a) && !g.has(c.b)); }
            for (let it = 0; it < 5; it++) { if (it % 2) for (let i = cons.length - 1; i >= 0; i--) solve(cons[i]); else for (let c of cons) solve(c); for (let b of w.b) walls(b); }
            for (let b of w.b) { b.vx = (b.x - b.ox) / h; b.vy = (b.y - b.oy) / h; }
            // Only bounces on proper hits. friction is how hard they shoved
            for (let c of cons) {
                let a = c.a, b = c.b, dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 0.001, nx = dx / d, ny = dy / d, wa = im(a), wb = im(b), s = wa + wb;
                let vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny, cap = Math.max(SEP, c.vn);
                if (vn > cap) { let j = (vn - cap) / s; a.vx += nx * j * wa; a.vy += ny * j * wa; b.vx -= nx * j * wb; b.vy -= ny * j * wb; vn = cap; }
                if (c.vn < -80) { let dv = -o.bounce * c.vn - vn; if (dv > 0) { let j = dv / s; a.vx -= nx * j * wa; a.vy -= ny * j * wa; b.vx += nx * j * wb; b.vy += ny * j * wb; } }
                if (c.vn < -260) { a.land = Math.max(a.land, Math.min(1, -c.vn / 900)); b.land = Math.max(b.land, Math.min(1, -c.vn / 900)); }
                let tx = -ny, ty = nx, vt = (b.vx - a.vx) * tx + (b.vy - a.vy) * ty - b.w * b.r - a.w * a.r, st = 3 * s, lim = MU() * c.lam / h, jt = clamp(-vt / st, -lim, lim);
                a.vx -= tx * jt * wa; a.vy -= ty * jt * wa; b.vx += tx * jt * wb; b.vy += ty * jt * wb;
                a.w -= 2 * jt * wa / a.r; b.w -= 2 * jt * wb / b.r;
            }
            for (let b of w.b) {
                if (b.fl) { let jn = b.pvy; if (jn > 260) b.land = Math.max(b.land, Math.min(1, jn / 900)); if (jn > 80) b.vy = -jn * o.bounce; else if (b.vy < -SEP) b.vy = -SEP; rub(b, 0, 1, b.lf, MUF(), h); }
                if (b.wl) { let jn = Math.abs(b.pvx); if (jn > 80) b.vx = -b.wl * jn * o.bounce; else if (b.vx * b.wl < -SEP) b.vx = -b.wl * SEP; rub(b, b.wl, 0, b.lw, MUW(), h); }
            }
            for (let b of w.b) if (b.t === 12 && b.hit && !b.gone) { b.gone = true; w.ev.push({ k: 'boom', x: b.x, y: b.y }); }
            if (w.b.some(b => b.gone)) w.b = w.b.filter(b => !b.gone);
        }
        function doFuse() {
            let gone = new Set();
            for (let [a, b] of fuse) {
                if (gone.has(a) || gone.has(b)) continue;
                gone.add(a); gone.add(b);
                let ma = a.r * a.r, mb = b.r * b.r, x = (a.x * ma + b.x * mb) / (ma + mb), y = (a.y * ma + b.y * mb) / (ma + mb), vx = (a.vx + b.vx) / 2, vy = (a.vy + b.vy) / 2, t = a.t + 1;
                if (t > 11) { w.ev.push({ k: 'burst', x, y }); continue; }
                let nb = w.add(t, x, y, vx * 0.5, vy * 0.5, true);
                nb.pop = 1; nb.shiny = a.shiny || b.shiny; nb.w = (a.w * ma + b.w * mb) / (ma + mb) * 0.5;
                w.ev.push({ k: 'fuse', t, x, y, lit: a.lit > 0 || b.lit > 0, shiny: nb.shiny });
                let reach = nb.R * 1.5;
                for (let c of w.b) {
                    if (c === nb || gone.has(c)) continue;
                    let dx = c.x - x, dy = c.y - y, d = Math.sqrt(dx * dx + dy * dy) || 1;
                    if (d < reach) { let k = 70 * (1 - d / reach); c.vx += dx / d * k; c.vy += dy / d * k; }
                }
            }
            w.b = w.b.filter(b => !gone.has(b));
            return gone;
        }
        w.step = dt => {
            for (let b of w.b) b.touch = false;
            if (o.magnet) pull(dt);
            let n = 12, h = dt / n;
            for (let b of w.b) { b.sx = b.x; b.sy = b.y; b.sa = b.a; }
            for (let i = 0; i < n; i++) { w.t += h; sub(h); }
            for (let b of w.b) {
                let k = Math.pow(o.damp, dt * 120); b.vx *= k; b.vy *= k;
                if (b.touch) { b.w *= Math.pow(1 - o.roll, dt * 120); let st = 60 / b.r * dt; b.w = Math.abs(b.w) <= st ? 0 : b.w - Math.sign(b.w) * st; } else b.w *= 0.999;
                // ugh
                if (b.touch && b.vx * b.vx + b.vy * b.vy < 9) { b.vx *= 0.5; b.vy *= 0.5; b.w *= 0.5; }
                if (b.touch && Math.abs(b.w) < 0.6 && Math.abs(b.x - b.sx) + Math.abs(b.y - b.sy) < 0.06) { b.w = 0; b.a = b.sa; }
            }
        };
        function pull(dt) {
            w.mag = [];
            for (let i = 0; i < w.b.length; i++) for (let j = i + 1; j < w.b.length; j++) {
                let a = w.b[i], b = w.b[j];
                if (a.t !== b.t || a.t > 11) continue;
                let dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1, reach = (a.r + b.r) * o.magnetRange;
                if (d > reach) continue;
                let k = o.magnetPull * (1 - d / reach) * dt;
                a.vx += dx / d * k; a.vy += dy / d * k; b.vx -= dx / d * k; b.vy -= dy / d * k;
                w.mag.push([a, b]);
            }
        }
        w.blast = (x, y, rad, force, kill) => {
            let gone = [];
            for (let b of w.b) {
                let dx = b.x - x, dy = b.y - y, d = Math.sqrt(dx * dx + dy * dy) || 1;
                if (kill && b.t <= kill && d - b.r < rad * 0.45) { gone.push(b); continue; }
                if (d < rad + b.r) { let k = force * (1 - Math.min(1, d / (rad + b.r))); b.vx += dx / d * k; b.vy += dy / d * k - k * 0.35; }
            }
            if (gone.length) { let g = new Set(gone); w.b = w.b.filter(b => !g.has(b)); }
            return gone;
        };
        w.remove = list => { let s = new Set(list); w.b = w.b.filter(b => !s.has(b)); };
        return w;
    }

    // Plain rotate chewed the pixels up. scale2x 3 times then spin
    const rotC = {};
    function scale2x(src, w, h) {
        let out = new Uint32Array(w * h * 4), W2 = w * 2;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            let E = src[y * w + x], B = y > 0 ? src[(y - 1) * w + x] : E, H = y < h - 1 ? src[(y + 1) * w + x] : E;
            let Dl = x > 0 ? src[y * w + x - 1] : E, F = x < w - 1 ? src[y * w + x + 1] : E;
            let e0 = E, e1 = E, e2 = E, e3 = E;
            if (B !== H && Dl !== F) { e0 = Dl === B ? Dl : E; e1 = B === F ? F : E; e2 = Dl === H ? Dl : E; e3 = H === F ? F : E; }
            let o = y * 2 * W2 + x * 2; out[o] = e0; out[o + 1] = e1; out[o + W2] = e2; out[o + W2 + 1] = e3;
        }
        return out;
    }
    function rotBase(key) {
        let c = os.sprite(key); if (!c) return null;
        let w = c.width, h = c.height, d = c.getContext('2d').getImageData(0, 0, w, h);
        let px = new Uint32Array(d.data.buffer.slice(0)), s = 1;
        for (let i = 0; i < 3; i++) { px = scale2x(px, w * s, h * s); s *= 2; }
        let S = Math.ceil(Math.hypot(w, h)) + 1;
        return { w, h, px, S, f: [] };
    }
    const STEPS = 64;
    function rotFrame(key, ang) {
        let r = rotC[key] || (rotC[key] = rotBase(key)); if (!r) return null;
        let i = ((Math.round(ang / (Math.PI * 2) * STEPS) % STEPS) + STEPS) % STEPS;
        if (r.f[i]) return r.f[i];
        let S = r.S, cv = document.createElement('canvas'); cv.width = cv.height = S;
        let x = cv.getContext('2d'), img = x.createImageData(S, S), out = new Uint32Array(img.data.buffer);
        let a = -i / STEPS * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), cx = r.w / 2, cy = r.h / 2, W8 = r.w * 8;
        for (let oy = 0; oy < S; oy++) for (let ox = 0; ox < S; ox++) {
            let dx = ox + 0.5 - S / 2, dy = oy + 0.5 - S / 2, sx = dx * ca - dy * sa + cx, sy = dx * sa + dy * ca + cy;
            if (sx < 0 || sy < 0 || sx >= r.w || sy >= r.h) continue;
            out[oy * S + ox] = r.px[Math.floor(sy * 8) * W8 + Math.floor(sx * 8)];
        }
        x.putImageData(img, 0, 0);
        return (r.f[i] = cv);
    }

    const colC = {};
    function cols(t) {
        if (colC[t]) return colC[t];
        let a = window.spritesDB && spritesDB.art['fuse/' + NAMES[t - 1]], v = a && a.pal ? Object.values(a.pal) : ['#ff2bd6', '#2de0ff', '#ffffff'];
        const lum = h => { let n = parseInt(h.slice(1), 16); return (n >> 16 & 255) * 0.3 + (n >> 8 & 255) * 0.59 + (n & 255) * 0.11; };
        v = v.filter(h => /^#[0-9a-f]{6}$/i.test(h)).sort((p, q) => lum(p) - lum(q));
        let mid = v.slice(Math.floor(v.length * 0.35), Math.max(Math.floor(v.length * 0.35) + 1, v.length - 1));
        return (colC[t] = mid.length ? mid : v);
    }

    let root = null, style = null, cv = null, cx = null, sc = null, sx = null, buf = null, bx = null, tmp = null, tx = null, lay = null, lx = null;
    let gl = null, prog = null, tex = null, uni = {};
    let S = null, raf = 0, last = 0, acc = 0, asleep = false, theme = { p: '#ff2d6f', s: '#2de0ff' }, themeAt = 0, LY = null, ro = null;
    let keys = {}, aiming = false;

    function readTheme(now) {
        if (now - themeAt < 500) return; themeAt = now;
        let cs = getComputedStyle(root || document.documentElement);
        theme = { p: cs.getPropertyValue('--neon-primary').trim() || theme.p, s: cs.getPropertyValue('--neon-secondary').trim() || theme.s };
    }
    function rgba(hex, a) { let n = parseInt(String(hex).replace('#', '').slice(0, 6), 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
    function mix(h1, h2, t) { let a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16); let c = [16, 8, 0].map(s => Math.round((a >> s & 255) * (1 - t) + (b >> s & 255) * t)); return 'rgb(' + c.join(',') + ')'; }

    function layout() {
        let st = root && root.querySelector('.fz-stage'); if (!st || !S) return;
        let cw = st.clientWidth || 600, ch = st.clientHeight || 500, tall = cw / ch < 0.95, n = S.n;
        let tw = Math.round(S.w.W / U), th = Math.round(n.tubeH / U), wall = 3;
        let BT = 14, BB = 9, top = BT + (tall ? 74 : 36), BH = top + th + BB + (tall ? 40 : 30), need = BB * 2 + (tall ? tw + wall * 2 + 20 : 112 + tw + wall * 2 + 24 + 118 + 16);
        let BW = Math.max(need, Math.round(cw / ch * BH));
        let TX = tall ? Math.round((BW - tw) / 2) : Math.round((BW - (112 + tw + wall * 2 + 24 + 110)) / 2) + 112 + wall;
        let dpr = Math.min(3, window.devicePixelRatio || 1), sc1 = Math.min(cw / BW, ch / BH), k = Math.max(1, Math.ceil(sc1 * dpr));
        LY = { tall, BW, BH, TX, TY: top, tw, th, wall, k, scale: sc1, HX: TX + tw + wall + 22, LX: TX - wall - 60, base: top + th, o: BT, BB };
        buf.width = BW; buf.height = BH; lay.width = BW; lay.height = BH;
        let cwPx = BW * k, chPx = BH * k;
        if (sc.width !== cwPx || sc.height !== chPx) { sc.width = cwPx; sc.height = chPx; if (gl) { cv.width = cwPx; cv.height = chPx; } }
        root.querySelector('.fz-stage').classList.toggle('short', ch < 560);
        let box = root.querySelector('.fz-box'); box.style.width = cv.style.width = Math.round(BW * sc1) + 'px'; box.style.height = cv.style.height = Math.round(BH * sc1) + 'px';
    }

    function deal() {
        let n = S.n;
        if (S.mode === 'bomb' && --S.bombIn <= 0) { S.bombIn = n.bombEvery; return { t: 12, lit: false, shiny: false }; }
        let pick = () => { let r = Math.random() * n.odds.reduce((a, b) => a + b, 0); for (let i = 0; i < 5; i++) { r -= n.odds[i]; if (r < 0) return i + 1; } return 1; };
        let t = pick(), h = S.dealt;
        while (h.length >= 3 && h.slice(-3).every(x => x === t)) t = pick();
        h.push(t); if (h.length > 3) h.shift();
        let lit = false;
        if (S.mode === 'lit' && --S.litIn <= 0) { S.litIn = n.litEvery - 1 + Math.floor(Math.random() * 3); lit = true; }
        return { t, lit, shiny: Math.random() < n.shinyChance };
    }
    function newRun(m) {
        let n = N(), Wt = n.tubeW, o = Object.assign({}, n, { W: Wt, H: n.tubeH, magnet: m === 'magnet' });
        S = { n, mode: m, w: world(o), state: 'play', score: 0, chain: 0, lastFuse: -9, bestChain: 0, holos: 0, bursts: 0,
            cool: 0, dealt: [], aim: Wt / 2, overT: 0, rescue: -9, fx: [], fl: [], nudge: 0, kick: 0, flash: 0, shim: 0, maxTier: 0,
            sweep: 0, tally: 0, warnT: 0, chainShow: 0, banner: null, made: 0, endT: 0, rattle: 0, shakes: 1, shakeN: 0, shown: 0, chainPop: 0, rings: [],
            bombIn: n.bombEvery, litIn: 3 + Math.floor(Math.random() * 3), tockT: 0, defused: 0, booms: 0, shinies: 0, fusedAt: D.fused || 0 };
        let a = deal(), b = deal();
        S.cur = a.t; S.curLit = a.lit; S.curShiny = a.shiny; S.next = b.t; S.nextLit = b.lit; S.nextShiny = b.shiny;
        S.bestAt = (D.top[m] && D.top[m][0] && D.top[m][0].s) || 0; S.passed = false; S.stop = 0; S.swapped = false;
        D.mode = m; saveD();
        layout();
    }
    const Rt = t => t === 12 ? S.n.bombR : S.n.radii[t - 1];
    const laserY = () => S.n.tubeH * S.n.laserPct / 100;
    function drop() {
        if (!S || !(S.state === 'play' || S.demo) || S.cool > 0) return;
        let r = Rt(S.cur), x = clamp(S.aim, r, S.w.W - r);
        let b = S.w.add(S.cur, x, -r - 8, 0, 80);
        if (S.curLit) b.lit = S.n.litSecs;
        if (S.curShiny) { b.shiny = true; S.shinies++; if (!S.demo) D.shiny = (D.shiny || 0) + 1; }
        if (b.t < 12 && !S.demo) D.seen[b.t] = 1;
        S.swapped = false;
        let nx = deal();
        S.cur = S.next; S.curLit = S.nextLit; S.curShiny = S.nextShiny; S.next = nx.t; S.nextLit = nx.lit; S.nextShiny = nx.shiny;
        if (nx.shiny) snd('shiny');
        S.cool = S.n.cooldown;
        if (S.shakes < S.n.shakeMax && ++S.shakeN >= S.n.shakeEvery) { S.shakeN = 0; S.shakes++; S.shakeAt = S.w.t; }
        snd(b.t === 12 ? 'fizz' : 'drop');
    }
    function swap() {
        if (!S || S.state !== 'play' || S.swapped) return;
        [S.cur, S.next] = [S.next, S.cur]; [S.curLit, S.nextLit] = [S.nextLit, S.curLit]; [S.curShiny, S.nextShiny] = [S.nextShiny, S.curShiny];
        S.swapped = true;
        snd('swap');
    }
    function shake() {
        if (!S || S.state !== 'play' || S.shakes < 1) return;
        S.shakes--; S.shakeN = 0;
        for (let b of S.w.b) { b.vy -= S.n.shakeKick * (0.6 + Math.random() * 0.5); b.vx += (Math.random() - 0.5) * S.n.shakeKick * 0.7; b.w += (Math.random() - 0.5) * 6; }
        S.w.wakeAll(); S.rattle = 0.35;
        snd('shake'); btns();
        if (MU.on) MU.fill = 3;
    }

    function onFuse(e) {
        let n = S.n, now = S.w.t;
        S.chain = now - S.lastFuse <= n.chainMs / 1000 ? S.chain + 1 : 1;
        S.lastFuse = now; S.bestChain = Math.max(S.bestChain, S.chain);
        let mult = (1 + n.chainStep * (S.chain - 1)) * (e.shiny ? n.shinyPay : 1), pts = Math.round(n.points[e.t - 1] * mult);
        S.score += pts; S.made++; if (!S.demo) { D.fused = (D.fused || 0) + 1; D.seen[e.t] = 1; }
        if (e.t >= 7) S.stop = Math.max(S.stop, 0.02 + (e.t - 6) * 0.025);
        if (S.chain > 1) { S.chainShow = 1.1; S.chainPop = 0.09; if (!calm()) S.kick = Math.min(1, 0.35 + 0.12 * S.chain); }
        S.rings.push({ x: e.x, y: e.y, r: n.radii[e.t - 1] / U, t: 0, life: 0.28 });
        S.fl.push({ x: e.x, y: e.y, s: '+' + pts, life: 0.9, t: 0, gold: e.shiny });
        sparks(e.x, e.y, e.t, 6 + Math.min(6, e.t));
        if (!calm()) S.nudge = Math.min(4, 1 + S.chain * 0.6 + e.t * 0.08);
        if (e.t > S.maxTier) S.maxTier = e.t;
        if (e.t === 11) { S.holos++; if (!S.demo) D.holo = (D.holo || 0) + 1; S.flash = Math.max(S.flash, 0.35); }
        if (S.overT > 0) S.rescue = now;
        if (e.lit) { let bonus = n.litBonus * e.t; S.score += bonus; S.defused++; S.fl.push({ x: e.x, y: e.y - 24, s: LE('defused', bonus, '消火 +{n} | DEFUSED +{n}'), life: 1.1, t: 0 }); snd('defuse'); }
        // console.log('fuse', e.t, 'chain', S.chain)
        snd('fuse', e.t, S.chain - 1);
        muFuse(e.t, S.chain);
    }
    function onBurst(e) {
        let pts = S.n.holoBonus;
        S.score += pts; S.bursts++;
        S.fl.push({ x: e.x, y: e.y, s: '+' + pts, life: 1.4, t: 0, big: 1 });
        S.banner = { s: L('holo', pts, 'ホロバースト +{n} | HOLO BURST +{n}'), t: 2 };
        S.flash = 1; S.shim = 1; S.stop = 0.3;
        if (!calm()) confetti(); else sparks(e.x, e.y, 11, 10);
        if (MU.on) { MU.fill = 4; MU.kick = 0.4; hit('crash', MU.A.currentTime + 0.02, 60, 2, 0.9); }

        snd('holo');
    }
    function onBoom(e) {
        let n = S.n, gone = S.w.blast(e.x, e.y, n.bombBlast, n.bombForce, n.bombKill);
        S.booms++;
        for (let b of gone) { let pts = n.points[b.t - 1]; S.score += pts; S.fl.push({ x: b.x, y: b.y, s: '+' + pts, life: 0.8, t: 0 }); sparks(b.x, b.y, b.t, 4); }
        for (let i = 0; i < 26; i++) { let a = Math.random() * Math.PI * 2, v = 120 + Math.random() * 420; S.fx.push({ x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, life: 0.4 + Math.random() * 0.4, t: 0, c: ['#ffe27a', '#ff7a3a', '#ffffff', '#ff3a5c'][i % 4], k: 'spark' }); }
        if (!calm()) { S.nudge = 5; S.kick = 0.5; }
        S.flash = Math.max(S.flash, 0.3);
        snd('boom');
    }
    function popLit(b) {
        let n = S.n;
        S.w.remove([b]); S.w.blast(b.x, b.y, n.litShove, n.litForce, 0);
        sparks(b.x, b.y, b.t, 14);
        S.fl.push({ x: b.x, y: b.y, s: LE('pop', 0, 'パンッ | POP'), life: 0.9, t: 0 });
        if (!calm()) S.nudge = 4;
        snd('boom');
    }
    function sparks(x, y, t, n) {
        let c = cols(t);
        for (let i = 0; i < n; i++) {
            let a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 200;
            S.fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, life: 0.35 + Math.random() * 0.3, t: 0, c: c[i % c.length], k: 'spark' });
        }
    }
    function confetti() {
        let pal = [theme.p, theme.s, '#ffffff', '#ffe27a', '#9ff0ff'];
        for (let side = 0; side < 2; side++) for (let i = 0; i < 34; i++) {
            let x = side ? S.w.W + 10 : -10, a = (side ? -1 : 1) * (0.3 + Math.random() * 0.9);
            S.fx.push({ x, y: S.n.tubeH * (0.55 + Math.random() * 0.35), vx: Math.sin(a) * (300 + Math.random() * 420) * (side ? 1 : 1), vy: -500 - Math.random() * 500, life: 1.6 + Math.random(), t: 0, c: pal[i % pal.length], k: 'conf', ph: Math.random() * 6 });
        }
    }

    function tick(dt) {
        let n = S.n, w = S.w;
        if (S.state === 'play' || S.demo) {
            // Menu demo. drops on a matching charm if it can see one, otherwise wherever
            if (S.demo && (S.demoT -= dt) <= 0) { let m = w.b.filter(b => b.t === S.cur && !b.gone).sort((a, b) => a.y - b.y)[0]; S.aim = m ? m.x + (Math.random() - 0.5) * 6 : Rt(S.cur) + Math.random() * (w.W - 2 * Rt(S.cur)); drop(); S.demoT = 0.8 + Math.random() * 0.9; }
            S.cool = Math.max(0, S.cool - dt);
            let dir = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
            if (dir) { keys.held = (keys.held || 0) + dt; S.aim += dir * (280 + 520 * Math.min(1, keys.held / 0.6)) * dt; } else keys.held = 0;
            let r = Rt(S.cur); S.aim = clamp(S.aim, r, w.W - r);
            let lit = w.b.filter(b => b.lit > 0), low = false;
            for (let b of lit) { b.lit -= dt; if (b.lit <= 3) low = true; if (b.lit <= 0) popLit(b); }
            if (low) { S.tockT -= dt; if (S.tockT <= 0) { S.tockT = 0.5; snd('tock'); } }
            if (S.stop > 0) { S.stop -= dt; acc = 0; } else acc += dt;
            let steps = 0;
            while (acc >= 1 / 120 && steps < 12) { acc -= 1 / 120; steps++; w.step(1 / 120); for (let e of w.ev) e.k === 'fuse' ? onFuse(e) : e.k === 'boom' ? onBoom(e) : onBurst(e); w.ev = []; }
            if (steps >= 12) acc = 0;
            for (let b of w.b) {
                if (b.land > 0.3 && !calm()) b.sq = 0.1;
                if (b.land > 0.55) for (let i = 0; i < 4; i++) S.fx.push({ x: b.x + (Math.random() - 0.5) * b.r * 1.6, y: b.y + b.r * 0.8, vx: (Math.random() - 0.5) * 120, vy: -40 - Math.random() * 60, life: 0.3 + Math.random() * 0.2, t: 0, k: 'dust' });
                b.land = 0;
            }
            let ly = laserY();
            {
                let ov = w.b.filter(b => w.t - b.born > 1 && b.y - b.r < ly);
                if (ov.length) {
                    S.overT += dt; S.top = ov.reduce((a, b) => (b.y - b.r < a.y - a.r ? b : a));
                    S.warnT -= dt; if (S.warnT <= 0) { S.warnT = 0.5; snd('warn'); }
                    if (S.overT * 1000 >= n.overMs) return S.demo ? preview() : over('line');
                } else {
                    if (S.overT > 0 && w.t - S.rescue < 0.8) { S.score += n.closeCall; S.banner = { s: L('close', n.closeCall, 'ギリギリ +{n} | CLOSE CALL +{n}'), t: 1.6 }; S.fl.push({ x: S.top ? S.top.x : w.W / 2, y: ly, s: '+' + n.closeCall, life: 1, t: 0 }); snd('close'); if (MU.on) { let c = chord()[1]; MU.run = [c[0] + 24, c[1] + 24, c[2] + 24]; } }
                    S.overT = 0; S.top = null; S.warnT = 0;
                }
            }
            if (w.t - S.lastFuse > n.chainMs / 1000) S.chain = 0;
            if (!S.demo) musicMix(S.overT > 0, dt);
            if (!S.passed && S.bestAt > 0 && S.score > S.bestAt) { S.passed = true; S.banner = { s: L('newBest', 0, '新記録 | NEW BEST'), t: 1.8 }; snd('best'); }
        } else if (S.state === 'over') {
            S.sweep += dt * 420;
            let line = laserY() + S.sweep;
            let hit = S.w.b.filter(b => !b.gone && b.y - b.r * 0.3 < line).sort((a, b) => a.y - b.y)[0];
            if (hit) {
                hit.gone = true;
                let pts = n.points[hit.t - 1];
                S.score += pts; S.tally++;
                sparks(hit.x, hit.y, hit.t, 4); S.fl.push({ x: hit.x, y: hit.y, s: '+' + pts, life: 0.6, t: 0 });
                snd('tally', S.tally);
            }
            if (line > n.tubeH + 40 && !S.w.b.some(b => !b.gone)) { S.endT += dt; if (S.endT > 0.5) finish(); }
        }
        for (let p of S.fx) { p.t += dt; p.vy += (p.k === 'conf' ? 900 : 700) * dt; if (p.k === 'conf') { p.vx *= 0.97; p.vy = Math.min(p.vy, 160); p.ph += dt * 9; } p.x += p.vx * dt; p.y += p.vy * dt; }
        S.fx = S.fx.filter(p => p.t < p.life);
        for (let f of S.fl) f.t += dt;
        S.rattle = Math.max(0, S.rattle - dt);
        S.shown += (S.score - S.shown) * Math.min(1, dt * 10); if (Math.abs(S.score - S.shown) < 0.5) S.shown = S.score;
        if (S.bombFlip > 0) S.bombFlip = Math.max(0, S.bombFlip - dt * 6);
        S.spin = (S.spin || 0) + dt * (S.cool > 0 ? 7 : 0.8);
        S.chainPop = Math.max(0, S.chainPop - dt);
        for (let r of S.rings) r.t += dt;
        S.rings = S.rings.filter(r => r.t < r.life);
        S.fl = S.fl.filter(f => f.t < f.life);
        S.nudge *= Math.pow(0.0005, dt); S.kick *= Math.pow(0.01, dt); S.flash *= Math.pow(0.02, dt); S.shim = Math.max(0, S.shim - dt * 0.8);
        S.chainShow = Math.max(0, S.chainShow - dt);
        if (S.banner) { S.banner.t -= dt; if (S.banner.t <= 0) S.banner = null; }
        for (let b of S.w.b) { if (b.sq) b.sq = Math.max(0, b.sq - dt); if (b.pop) b.pop = Math.max(0, b.pop - dt / 0.08); }
    }
    function over(why) {
        S.state = 'over'; S.why = why; S.sweep = 0; S.endT = 0; S.overT = 0; acc = 0;
        S.banner = { s: L('over', 0, 'メルトダウン | MELTDOWN'), t: 99 };
        snd('over'); btns(); musicOff(1.3, true);
    }
    function finish() {
        if (S.state === 'done') return;
        S.state = 'done';
        let m = S.mode, top = D.top[m] || [], d = new Date(), two = x => String(x).padStart(2, '0');
        let row = { s: S.score, t: S.maxTier, d: d.getFullYear() + '.' + two(d.getMonth() + 1) + '.' + two(d.getDate()) };
        let was = top.length ? top[0].s : 0;
        top.push(row); top.sort((a, b) => b.s - a.s); D.top[m] = top.slice(0, 10);
        S.place = D.top[m].indexOf(row) + 1; S.rec = S.score > 0 && S.score > was; S.off = was - S.score;
        D.bestTier[m] = Math.max(D.bestTier[m] || 0, S.maxTier);
        D.runs = (D.runs || 0) + 1;
        saveD();
        show('done'); btns();
    }

    function px(x, y, w, h, c) { bx.fillStyle = c; bx.fillRect(x | 0, y | 0, w, h); }
    function ringPx(cxp, cyp, r, frac, c) {
        bx.fillStyle = c;
        let n = Math.max(12, Math.round(r * 7)), seen = new Set();
        for (let i = 0; i < n * frac; i++) {
            let a = -Math.PI / 2 + i / n * Math.PI * 2, x = Math.round(cxp + Math.cos(a) * r), y = Math.round(cyp + Math.sin(a) * r), k = x + ',' + y;
            if (!seen.has(k)) { seen.add(k); bx.fillRect(x, y, 1, 1); }
        }
    }
    const P = (x, y) => [LY.TX + x / U, LY.TY + y / U];
    function sprite(key, x, y, ang, sxl, syl, alpha, holo, gold) {
        let f = ang == null ? os.sprite(key) : rotFrame(key, ang); if (!f) return;
        let w = Math.max(1, Math.round(f.width * sxl)), h = Math.max(1, Math.round(f.height * syl));
        let dx = Math.round(x - w / 2), dy = Math.round(y - h / 2);
        if (alpha != null) bx.globalAlpha = alpha;
        if (gold) {
            if (tmp.width < f.width || tmp.height < f.height) { tmp.width = f.width; tmp.height = f.height; }
            tx.clearRect(0, 0, tmp.width, tmp.height); tx.globalCompositeOperation = 'source-over'; tx.drawImage(f, 0, 0);
            tx.globalCompositeOperation = 'source-atop'; tx.globalAlpha = 0.5; tx.fillStyle = '#ffc93a'; tx.fillRect(0, 0, f.width, f.height);
            let ph = (performance.now() / 1600 + gold) % 1.6;
            if (ph < 1) { tx.globalAlpha = 0.85; tx.fillStyle = '#fffbe0'; let sx0 = -f.height + ph * (f.width + f.height * 2); tx.beginPath(); tx.moveTo(sx0, f.height); tx.lineTo(sx0 + 3, f.height); tx.lineTo(sx0 + 3 + f.height, 0); tx.lineTo(sx0 + f.height, 0); tx.fill(); }
            tx.globalAlpha = 1; tx.globalCompositeOperation = 'source-over';
            bx.drawImage(tmp, 0, 0, f.width, f.height, dx, dy, w, h);
        } else if (holo) {
            if (tmp.width < f.width || tmp.height < f.height) { tmp.width = f.width; tmp.height = f.height; }
            tx.clearRect(0, 0, tmp.width, tmp.height); tx.globalCompositeOperation = 'source-over'; tx.drawImage(f, 0, 0);
            tx.globalCompositeOperation = 'source-atop';
            let ph = performance.now() / 1400, g = tx.createLinearGradient(0, 0, f.width, f.height);
            for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, (Math.floor(i + ph * 2) % 2) ? theme.s : theme.p);
            tx.globalAlpha = 0.24; tx.fillStyle = g; tx.fillRect(0, 0, f.width, f.height); tx.globalAlpha = 1; tx.globalCompositeOperation = 'source-over';
            bx.drawImage(tmp, 0, 0, f.width, f.height, dx, dy, w, h);
        } else bx.drawImage(f, dx, dy, w, h);
        bx.globalAlpha = 1;
    }
    function drawCharm(b) {
        let [x, y] = P(b.x, b.y), g = b.r / b.R, sq = b.sq ? b.sq / 0.1 : 0;
        let sxl = g * (1 + 0.15 * sq), syl = g * (1 - 0.15 * sq);
        if (sq) y += b.R / U * 0.15 * sq * g;
        if (b.t === 12) { sprite('fuse/bomb', x, y, b.a, sxl, syl); wick(x + Math.sin(b.a) * b.r / U, y - Math.cos(b.a) * b.r / U - 1, performance.now()); return; }
        let nm = 'fuse/' + NAMES[b.t - 1];
        let gold = b.shiny ? (b.id % 7) / 7 + 0.01 : 0;
        if (b.pop > 0) sprite(nm + '_pop', x, y, b.a, g, g, null, b.t === 11 && !gold, gold);
        else sprite(nm, x, y, b.a, sxl, syl, null, b.t === 11 && !gold, gold);
        if (gold && Math.floor((performance.now() + b.id * 130) / 280) % 3) { let r = b.r / U * 0.72, sx0 = Math.round(x + r), sy0 = Math.round(y - r); px(sx0, sy0 - 2, 1, 5, '#ffffff'); px(sx0 - 2, sy0, 5, 1, '#ffffff'); px(sx0, sy0, 1, 1, '#fff6c0'); }
    }

    function drawScene(now) {
        let { BW, BH, TX, TY, tw, th, wall } = LY, danger = S.overT > 0 ? Math.min(1, S.overT * 1000 / S.n.overMs) : 0;
        let nx = S.nudge > 0.2 ? Math.round((Math.random() - 0.5) * S.nudge) : 0, ny = S.nudge > 0.2 ? Math.round((Math.random() - 0.5) * S.nudge) : 0;
        bx.setTransform(1, 0, 0, 1, 0, 0);
        bx.fillStyle = '#07050b'; bx.fillRect(0, 0, BW, BH);
        let base = LY.base + 1;
        backWall(base);
        let fl = bx.createLinearGradient(0, base, 0, BH); fl.addColorStop(0, '#0d0a14'); fl.addColorStop(1, '#040306');
        bx.fillStyle = fl; bx.fillRect(0, base, BW, BH - base);
        let vx = TX + tw / 2;
        bx.fillStyle = rgba(theme.p, 0.16);
        for (let i = -14; i <= 14; i++) { for (let y = base; y < BH; y++) { let t = (y - base) / (BH - base + 30); let x = Math.round(vx + i * 10 * (0.25 + t * 2.4)); if (x >= 0 && x < BW) bx.fillRect(x, y, 1, 1); } }
        for (let k = 0, y = base; y < BH; k++) { bx.fillRect(0, Math.round(y), BW, 1); y += 2 + k * 1.6; }
        cables();
        // Own layer so a shake only rattles the tube
        let real = bx; bx = lx; bx.setTransform(1, 0, 0, 1, 0, 0); bx.clearRect(0, 0, BW, BH);
        let iw = tw, X0 = TX;
        bx.fillStyle = 'rgba(4,2,8,0.55)'; bx.fillRect(X0, TY, iw, th);
        bx.fillStyle = rgba(theme.p, 0.04); bx.fillRect(X0, TY, iw, th);
        for (let i = 0; i < 26; i++) px(X0, LY.base - 1 - i, iw, 1, rgba(theme.p, 0.07 * (1 - i / 26)));
        for (let b of S.w.b) if (!b.gone) { let [x, y] = P(b.x, b.y); bx.fillStyle = 'rgba(0,0,0,0.32)'; bx.beginPath(); bx.arc(Math.round(x) + 1, Math.round(y) + 2, b.r / U, 0, Math.PI * 2); bx.fill(); }
        for (let i = 0; i < 10; i++) { let a = 0.05 * (1 - i / 10); px(X0 + i, TY, 1, th, rgba(theme.p, a)); px(X0 + iw - 1 - i, TY, 1, th, rgba(theme.p, a)); }
        if (S.mode === 'magnet') {
            bx.fillStyle = rgba(theme.s, 0.4);
            for (let [a, b] of S.w.mag) { let [x1, y1] = P(a.x, a.y), [x2, y2] = P(b.x, b.y), n = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / 3)), off = Math.floor(now / 80) % 3; for (let i = 1; i < n; i++) if ((i + off) % 3 === 0) bx.fillRect(Math.round(x1 + (x2 - x1) * i / n), Math.round(y1 + (y2 - y1) * i / n), 1, 1); }
        }
        for (let b of S.w.b) if (!b.gone) drawCharm(b);
        for (let r of S.rings) { let [x, y] = P(r.x, r.y), f = r.t / r.life; ringPx(Math.round(x), Math.round(y), Math.round(r.r + 3 + f * 9), 1, 'rgba(255,255,255,' + (0.75 * (1 - f)) + ')'); }
        for (let b of S.w.b) if (b.lit > 0 && !b.gone) {
            let [x, y] = P(b.x, b.y), f = b.lit / S.n.litSecs, hot = b.lit < 3;
            ringPx(x, y, b.R / U + 2, f, hot && Math.floor(now / 120) % 2 ? '#ff3a5c' : '#ffd04a');
            wick(x, y - b.r / U - 1, now);
        }
        let ly = Math.round(TY + laserY() / U);
        if (S.state !== 'over') {
            let pul = danger ? 0.55 + 0.45 * Math.sin(now / 70) : 0.8;
            px(X0, ly - 1, iw, 1, 'rgba(255,40,74,' + (0.18 * pul) + ')'); px(X0, ly + 1, iw, 1, 'rgba(255,40,74,' + (0.18 * pul) + ')');
            px(X0, ly, iw, 1, 'rgba(255,60,90,' + pul + ')');
        }
        if (S.state === 'over') { let sy = Math.round(TY + (laserY() + S.sweep) / U); if (sy < LY.base) { px(X0, sy - 1, iw, 3, 'rgba(255,60,90,0.35)'); px(X0, sy, iw, 1, '#ff5a7a'); } }
        if (danger && S.top) { let [x, y] = P(S.top.x, S.top.y); ringPx(x, y, S.top.R / U + 3, 1 - danger, '#ff3a5c'); ringPx(x, y, S.top.R / U + 4, 1 - danger, 'rgba(255,58,92,0.35)'); }
        let edge = danger ? mix(theme.p, '#ff2a4a', Math.min(1, danger * 1.5)) : theme.p;
        for (let side = 0; side < 2; side++) {
            let x = side ? X0 + iw : X0 - wall;
            px(x, TY - 2, wall, th + 2, 'rgba(20,16,30,0.9)');
            px(side ? x + wall - 1 : x, TY - 2, 1, th + 2, '#07040b');
            px(side ? x : x + wall - 1, TY - 2, 1, th + 2, edge);
            px(x + 1, TY - 2, 1, th + 2, rgba(edge, 0.35));
        }
        px(X0 + 3, TY + 4, 2, th - 10, 'rgba(255,255,255,0.07)'); px(X0 + 6, TY + 4, 1, th - 30, 'rgba(255,255,255,0.04)');
        px(X0 + iw - 6, TY + 12, 1, th - 40, 'rgba(255,255,255,0.05)');
        if (S.shim > 0) { let sy = Math.round(LY.base - (1 - S.shim) * th * 1.2); for (let i = 0; i < 10; i++) px(X0, sy + i, iw, 1, 'rgba(255,255,255,' + (0.18 * (1 - i / 10) * S.shim) + ')'); }
        for (let side = 0; side < 2; side++) {
            let x = side ? TX + tw + wall : TX - wall - 6;
            px(x, ly - 4, 6, 9, '#07040b'); px(x + 1, ly - 3, 4, 7, '#2a2633'); px(x + 1, ly - 3, 4, 1, '#4a4558');
            px(x + (side ? 0 : 5), ly - 1, 1, 3, '#ff3a5c'); px(x + (side ? 0 : 5), ly, 1, 1, '#ffd0d6');
        }
        let cap = os.sprite('fuse/tube_cap');
        if (cap) { let cw = tw + wall * 2 + 4, x0 = TX - wall - 2, y0 = TY - 6; bx.drawImage(cap, 0, 0, 5, 6, x0, y0, 5, 6); for (let x = x0 + 5; x < x0 + cw - 5; x += 6) bx.drawImage(cap, 5, 0, Math.min(6, x0 + cw - 5 - x), 6, x, y0, Math.min(6, x0 + cw - 5 - x), 6); bx.drawImage(cap, 11, 0, 5, 6, x0 + cw - 5, y0, 5, 6); }
        let bw = tw + wall * 2 + 10, bxx = TX - wall - 5, by = LY.base;
        px(bxx + 2, by - 3, bw - 4, 3, '#2a2633'); px(bxx + 2, by - 3, bw - 4, 1, '#4a4558');
        px(bxx, by, bw, 8, '#1c1924'); px(bxx, by, bw, 1, '#4a4558'); px(bxx, by + 1, 1, 7, '#2a2633'); px(bxx + bw - 1, by + 1, 1, 7, '#100d16'); px(bxx, by + 8, bw, 1, '#07040b');
        px(bxx + 9, by + 4, bw - 18, 1, rgba(theme.s, 0.8)); px(bxx + 9, by + 5, bw - 18, 1, rgba(theme.s, 0.18));
        for (let side = 0; side < 2; side++) { let x = side ? bxx + bw - 6 : bxx + 3; px(x, by + 3, 3, 3, '#07040b'); px(x + 1, by + 3, 1, 1, '#5b5f78'); }
        if (S.state === 'play' || S.state === 'pause' || S.demo) {
            let r = Rt(S.cur), ax = clamp(S.aim, r, S.w.W - r), [dx] = P(ax, 0), dy = TY - 6 - r / U - 4, ry = TY - 31;
            claw(Math.round(dx), ry, Math.round(dy), r / U);
            if (S.cool <= 0) {
                let land = S.n.tubeH - r;
                for (let b of S.w.b) { let ddx = Math.abs(b.x - ax), rr = r + b.r; if (ddx < rr) land = Math.min(land, b.y - Math.sqrt(rr * rr - ddx * ddx)); }
                let y0 = Math.round(dy + r / U + 2), y1 = Math.round(TY + (land + r) / U);
                bx.fillStyle = rgba(theme.s, 0.55); for (let y = y0; y < y1; y += 3) bx.fillRect(Math.round(dx), y, 1, 1);
            }
            sprite(key(S.cur), dx, dy, null, 1, 1, S.cool > 0 ? 0.35 : 1, S.cur === 11, S.curShiny ? 0.5 : 0);
            if (S.cur === 12 || S.curLit) wick(dx, dy - r / U - 1, now);
        }
        let sp = os.sprite('fuse/spark');
        for (let p of S.fx) {
            let [x, y] = P(p.x, p.y), f = p.t / p.life;
            if (p.k === 'dust') { bx.fillStyle = 'rgba(180,170,200,' + (0.5 * (1 - f)) + ')'; bx.fillRect(Math.round(x), Math.round(y), 1, 1); }
            else if (p.k === 'conf') { bx.fillStyle = p.c; let w = Math.abs(Math.sin(p.ph)) > 0.5 ? 2 : 1; bx.fillRect(Math.round(x), Math.round(y), w, 3 - w); }
            else if (sp) { let fr = Math.min(3, Math.floor(f * 4)), c = os.sprite('fuse/spark', { x: p.c }) || sp; bx.drawImage(c, fr * 5, 0, 5, 5, Math.round(x) - 2, Math.round(y) - 2, 5, 5); }
        }
        bx = real;
        if (S.rattle > 0 && !calm()) { nx += Math.round((Math.random() - 0.5) * 4); ny += Math.round((Math.random() - 0.5) * 3); }
        bx.drawImage(lay, nx, ny);
        let rh = Math.min(BH - LY.base - 10, 40);
        if (rh > 2) { bx.save(); bx.globalAlpha = 0.16; bx.translate(0, LY.base * 2 + 10); bx.scale(1, -1); bx.drawImage(buf, TX - wall - 4, LY.base - rh, tw + wall * 2 + 8, rh, TX - wall - 4, LY.base - rh, tw + wall * 2 + 8, rh); bx.restore(); }
        hud(now);
        bezel(now);
    }
    function bezel(now) {
        let { BW, BH, o, BB } = LY;
        const frame = (x, y, w, h) => px(x, y, w, h, '#16131e');
        frame(0, 0, BW, o); frame(0, BH - BB, BW, BB); frame(0, 0, BB, BH); frame(BW - BB, 0, BB, BH);
        px(0, 0, BW, 1, '#07040b'); px(0, BH - 1, BW, 1, '#07040b'); px(0, 0, 1, BH, '#07040b'); px(BW - 1, 0, 1, BH, '#07040b');
        px(1, 1, BW - 2, 1, '#4a4558'); px(1, 1, 1, BH - 2, '#2e2a3a'); px(1, BH - 2, BW - 2, 1, '#0c0a12'); px(BW - 2, 1, 1, BH - 2, '#0c0a12');
        px(BB - 2, o - 2, BW - BB * 2 + 4, 1, '#07040b'); px(BB - 2, BH - BB + 1, BW - BB * 2 + 4, 1, '#2e2a3a');
        px(BB - 2, o - 2, 1, BH - o - BB + 4, '#07040b'); px(BW - BB + 1, o - 2, 1, BH - o - BB + 4, '#2e2a3a');
        px(BB - 1, o - 1, BW - BB * 2 + 2, 1, rgba(theme.p, 0.55)); px(BB - 1, BH - BB, BW - BB * 2 + 2, 1, rgba(theme.p, 0.3));
        px(BB - 1, o - 1, 1, BH - o - BB + 1, rgba(theme.p, 0.4)); px(BW - BB, o - 1, 1, BH - o - BB + 1, rgba(theme.p, 0.4));
        let w = Math.min(150, BW - 120), x = Math.round(BW / 2 - w / 2);
        px(x, 2, w, o - 5, '#07040b'); px(x + 1, 3, w - 2, o - 7, '#0e0b14'); px(x + 1, o - 4, w - 2, 1, '#2e2a3a');
        const bolt = (bx_, by_, turn) => { px(bx_, by_, 5, 5, '#07040b'); px(bx_ + 1, by_ + 1, 3, 3, '#3a3546'); px(bx_ + 1, by_ + 1, 1, 1, '#6b6680'); if (turn) px(bx_ + 1, by_ + 3, 3, 1, '#1c1924'); else px(bx_ + 2, by_ + 1, 1, 3, '#1c1924'); };
        bolt(3, 4, 0); bolt(BW - 8, 4, 1); bolt(2, BH - 7, 1); bolt(BW - 8, BH - 7, 0);
        for (let i = 0; i < 6; i++) px(BW / 2 - 26 + i * 9, BH - 6, 6, 2, '#07040b');
        px(BW - 31, 1, 7, 1, '#6b6680'); px(BW - 26, 2, 3, 1, '#4a4558'); px(1, Math.round(BH * 0.62), 1, 9, '#4a4558');
        px(18, BH - 4, 5, 1, '#2e2a3a'); px(BW - 4, Math.round(BH * 0.3), 2, 2, '#0c0a12');
        let pw = Math.floor(now / 1700) % 9 ? '#5dff9a' : '#2a6a40';
        px(12, 5, 3, 3, '#07040b'); px(13, 6, 1, 1, pw);
    }
    function backWall(base) {
        let { BW, TX, tw, TY, wall: wl } = LY;
        px(0, 0, BW, base, '#0b0811');
        let pw = 44, ph = 34, ox = (TX + tw / 2) % pw;
        for (let y = base - ph; y > -ph; y -= ph) for (let x = ox - pw; x < BW; x += pw) {
            let k = ((Math.floor(x / pw) * 7 + Math.floor(y / ph) * 3) % 8 + 8) % 8;
            px(x, y, pw, ph, k === 3 ? '#0e0a15' : '#0c0912');
            px(x, y, pw, 1, '#07040b'); px(x, y, 1, ph, '#07040b'); px(x + 1, y + 1, pw - 1, 1, '#151020');
            if (k === 1 || k === 5) { px(x + 3, y + 3, 2, 2, '#1a1424'); px(x + pw - 5, y + ph - 5, 2, 2, '#1a1424'); }
            if (k === 6) for (let i = 0; i < 4; i++) px(x + 10, y + 9 + i * 4, pw - 20, 2, '#07040b');
        }
        bx.fillStyle = rgba(theme.p, 0.035); bx.fillRect(0, 0, BW, base);
        for (let i = 0; i < 4; i++) px(0, base - 6 - i * 2, BW, 1, i % 2 ? 'rgba(255,208,74,0.05)' : 'rgba(7,4,11,0.6)');
    }
    function cables() {
        let { TX, tw, wall: wl } = LY;
        const cable = (x0, y0, x1, y1, sag, col) => {
            let n = Math.max(8, Math.abs(x1 - x0) * 1.5);
            for (let i = 0; i <= n; i++) { let t = i / n, x = Math.round(x0 + (x1 - x0) * t), y = Math.round(y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag); px(x, y, 1, 2, '#07040b'); px(x, y - 1, 1, 1, col); }
        };
        if (!LY.tall && LY.PX) {
            cable(TX + tw + wl + 5, LY.base + 4, LY.PX + 2, LY.base - 4, 7, '#3a3546');
            cable(TX + tw + wl + 5, LY.base + 6, LY.PX + 2, LY.base + 2, 9, rgba(theme.s, 0.6));
            cable(TX - wl - 6, LY.base + 4, LY.LX + 30, LY.base - 14, 9, '#3a3546');
        }
    }
    function claw(x, ry, cy, r) {
        let { TX, tw, wall: wl } = LY, rail = tw + wl * 2 + 12;
        px(TX - wl - 6, ry, rail, 2, '#2a2633'); px(TX - wl - 6, ry, rail, 1, '#4a4558'); px(TX - wl - 6, ry + 2, rail, 1, '#07040b');
        px(x - 6, ry - 3, 13, 4, '#07040b'); px(x - 5, ry - 2, 11, 2, '#3a3546'); px(x - 5, ry - 2, 11, 1, '#5b5670');
        px(x - 1, ry - 2, 3, 1, S.cool > 0 ? '#ff3a5c' : '#5dff9a');
        let arm = Math.max(ry + 4, Math.round(cy - r - 3));
        px(x - 1, ry + 3, 3, arm - ry - 2, '#07040b'); px(x, ry + 3, 1, arm - ry - 2, '#4a4558');
        let sp = Math.round(r) + 2;
        px(x - sp, arm, sp * 2 + 1, 2, '#07040b'); px(x - sp + 1, arm, sp * 2 - 1, 1, '#4a4558');
        for (let side = -1; side <= 1; side += 2) {
            let sx_ = x + side * sp - (side > 0 ? 1 : 0), len = Math.max(3, Math.round(r * 0.9));
            px(sx_, arm, 2, len, '#07040b'); px(sx_ + (side < 0 ? 1 : 0), arm + 1, 1, len - 1, '#5b5670');
            px(side < 0 ? sx_ : sx_ - 1, arm + len - 1, 3, 2, '#07040b');
        }
    }
    const key = t => t === 12 ? 'fuse/bomb' : 'fuse/' + NAMES[t - 1];
    function wick(x, y, now) {
        let w = os.sprite('fuse/wick'); if (!w) return;
        let fr = Math.floor(now / 110) % 2;
        bx.drawImage(w, fr * 5, 0, 5, 7, Math.round(x) - 2, Math.round(y) - 6, 5, 7);
    }
    const FONT = {
        '0': '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.', '1': '..#..|.##..|..#..|..#..|..#..|..#..|.###.', '2': '.###.|#...#|....#|...#.|..#..|.#...|#####',
        '3': '#####|...#.|..#..|...#.|....#|#...#|.###.', '4': '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.', '5': '#####|#....|####.|....#|....#|#...#|.###.',
        '6': '..##.|.#...|#....|####.|#...#|#...#|.###.', '7': '#####|....#|...#.|..#..|.#...|.#...|.#...', '8': '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
        '9': '.###.|#...#|#...#|.####|....#|...#.|.##..', 'x': '.....|.....|#...#|.#.#.|..#..|.#.#.|#...#', '/': '....#|....#|...#.|..#..|.#...|#....|#....',
        '+': '.....|..#..|..#..|#####|..#..|..#..|.....', ' ': '.....|.....|.....|.....|.....|.....|.....'
    };
    function digits(str, x, y, k, col, right) {
        str = String(str); let w = str.length * 6 * k - k;
        if (right) x -= w;
        bx.fillStyle = col;
        for (let i = 0; i < str.length; i++) {
            let g = FONT[str[i]]; if (!g) continue;
            g.split('|').forEach((row, j) => { for (let c = 0; c < 5; c++) if (row[c] === '#') bx.fillRect(Math.round(x + (i * 6 + c) * k), Math.round(y + j * k), k, k); });
        }
        return w;
    }
    function plate(x, y, w, h) {
        px(x, y, w, h, '#07040b');
        px(x + 1, y + 1, w - 2, h - 2, '#1c1924');
        px(x + 1, y + 1, w - 2, 1, '#4a4558'); px(x + 1, y + 2, 1, h - 3, '#2e2a3a');
        px(x + 1, y + h - 2, w - 2, 1, '#100d16'); px(x + w - 2, y + 2, 1, h - 3, '#100d16');
        px(x + w - 15, y + h - 4, 6, 1, '#2e2a3a'); px(x + w - 9, y + h - 5, 2, 1, '#2e2a3a'); px(x + 2, y + Math.round(h * 0.45), 1, 4, '#3a3546');
        [[x + 3, y + 3], [x + w - 6, y + 3], [x + 3, y + h - 6], [x + w - 6, y + h - 6]].forEach(([sx_, sy_], i) => { px(sx_, sy_, 3, 3, '#07040b'); px(sx_ + 1, sy_ + 1, 1, 1, '#5b5f78'); if (i === 1) px(sx_, sy_ + 1, 3, 1, '#3a3546'); else px(sx_ + 1, sy_, 1, 3, '#3a3546'); });
    }
    function lcd(x, y, w, h) {
        px(x, y, w, h, '#07040b'); px(x + 1, y + 1, w - 2, h - 2, '#08060c');
        for (let yy = y + 2; yy < y + h - 1; yy += 2) px(x + 1, yy, w - 2, 1, 'rgba(255,255,255,0.025)');
        px(x, y + h, w, 1, '#3a3546');
    }
    function porthole(cxp, cyp, r, now) {
        for (let y = -r - 2; y <= r + 2; y++) for (let x = -r - 2; x <= r + 2; x++) {
            let d = Math.sqrt(x * x + y * y);
            if (d <= r) px(cxp + x, cyp + y, 1, 1, d > r - 1 ? rgba(theme.p, 0.55) : '#171222');
            else if (d <= r + 2) px(cxp + x, cyp + y, 1, 1, d <= r + 1 ? (y < 0 ? '#4a4558' : '#2a2633') : '#07040b');
        }
        if (!now || calm()) return;
        let spin = (S.spin = (S.spin || 0)), seg = 18;
        for (let i = 0; i < seg; i++) {
            if (i % 3 === 2) continue;
            let a = spin + i / seg * Math.PI * 2, rr = r - 2.5;
            px(Math.round(cxp + Math.cos(a) * rr), Math.round(cyp + Math.sin(a) * rr), 1, 1, rgba(theme.s, i % 3 === 0 ? 0.55 : 0.25));
        }
        if (S.cool > 0) { let k = 1 - S.cool / S.n.cooldown; for (let i = 0; i < 24 * k; i++) { let a = -Math.PI / 2 + i / 24 * Math.PI * 2; px(Math.round(cxp + Math.cos(a) * (r + 1)), Math.round(cyp + Math.sin(a) * (r + 1)), 1, 1, theme.s); } }
    }
    // TODO the ring might be too small on a little laptop screen, see what it looks like on mine
    function ladder(cxp, cyp, rad, row) {
        let best = Math.max(D.bestTier[S.mode] || 0, S.maxTier), seen = D.seen || [];
        if (!row) {
            let R2 = rad + 11;
            for (let y = -R2 - 2; y <= R2 + 2; y++) for (let x = -R2 - 2; x <= R2 + 2; x++) {
                let d = Math.sqrt(x * x + y * y);
                if (d > R2 + 2) continue;
                px(cxp + x, cyp + y, 1, 1, d > R2 + 1 ? '#07040b' : d > R2 ? (x + y < 0 ? '#4a4558' : '#100d16') : d < 12 ? '#0a0710' : '#1c1924');
            }
            if (!calm()) { let a = S.w.t * 0.7; for (let k = 0; k < 6; k++) { let aa = a - k * 0.05; px(Math.round(cxp + Math.cos(aa) * (R2 - 1)), Math.round(cyp + Math.sin(aa) * (R2 - 1)), 1, 1, rgba(theme.s, 0.7 - k * 0.11)); } }
            let found = seen.filter(Boolean).length;
            digits(found + '/11', cxp + 1, cyp - 3, 1, found >= 11 ? '#ffe27a' : '#8f8b9a', false);
        }
        for (let t = 1; t <= 11; t++) {
            let x, y;
            if (row) { x = cxp + (t - 6) * row; y = cyp; }
            else { let a = -Math.PI / 2 + (t - 1) / 11 * Math.PI * 2; x = cxp + Math.cos(a) * rad; y = cyp + Math.sin(a) * rad; }
            let k = 'fuse/' + NAMES[t - 1] + '_icon';
            if (t <= S.maxTier) { if (t === S.maxTier) { if (!calm()) y += Math.round(Math.sin(S.w.t * 3)); ringPx(Math.round(x), Math.round(y), 8, 1, rgba(theme.s, 0.45 + 0.25 * Math.sin(S.w.t * 4))); } sprite(k, x, y, null, 1, 1, 1, t === 11); }
            else if (seen[t] || t <= best) sprite(k, x, y, null, 1, 1, 0.45, t === 11);
            else { let f = os.sprite(k, { '*': '#2a2533' }); if (f) bx.drawImage(f, Math.round(x - f.width / 2), Math.round(y - f.height / 2)); }
        }
    }
    function lamps(x, y) {
        let n = S.n;
        for (let i = 0; i < n.shakeMax; i++) {
            let on = i < S.shakes, cx0 = x + i * 9, pulse = on && !calm() ? 0.75 + 0.25 * Math.sin(S.w.t * 5 + i) : 1, fresh_ = S.shakeAt && S.w.t - S.shakeAt < 0.5 && i === S.shakes - 1;
            px(cx0, y, 7, 7, '#07040b'); px(cx0 + 1, y + 1, 5, 5, on ? (fresh_ && Math.floor(S.w.t * 16) % 2 ? '#ffffff' : rgba(theme.s, pulse)) : '#241f2e');
            if (on) { px(cx0 + 2, y + 2, 1, 1, '#ffffff'); if (!calm()) { bx.globalAlpha = 0.18 * pulse; px(cx0 - 1, y - 1, 9, 9, theme.s); bx.globalAlpha = 1; } }
        }
        let bw = n.shakeMax * 9 - 2;
        px(x, y + 9, bw, 1, '#100d16');
        if (S.shakes < n.shakeMax) { let fw = Math.round(bw * S.shakeN / n.shakeEvery); px(x, y + 9, fw, 1, rgba(theme.s, 0.8)); if (fw > 0 && !calm()) px(x + fw - 1, y + 9, 1, 1, Math.floor(S.w.t * 6) % 2 ? '#ffffff' : theme.s); }
    }
    function critLamp(x, y, now) {
        let on = S.overT > 0 && Math.floor(now / 160) % 2 === 0, idle = calm() ? 0 : 0.5 + 0.5 * Math.sin(now / 900);
        px(x, y, 9, 9, '#07040b'); px(x + 1, y + 1, 7, 7, on ? '#ff2a4a' : mix('#2e1019', '#4a1826', idle));
        px(x + 2, y + 2, 2, 1, on ? '#ffb0b8' : '#5a2430'); px(x + 2, y + 3, 1, 1, on ? '#ffb0b8' : '#5a2430');
    }
    function bestBar(x, y, w) {
        let best = S.bestAt || 0, segs = Math.floor((w + 1) / 4), lit = best ? Math.min(segs, Math.floor(S.score / best * segs)) : segs * (S.score > 0 ? 1 : 0);
        let run = calm() ? -1 : Math.floor(S.w.t * 14) % (segs + 6), close = best && S.score >= best * 0.7;
        for (let i = 0; i < segs; i++) {
            let c = i < lit ? (S.passed || !best ? '#ffd04a' : theme.p) : '#241f2e';
            if (i < lit && (close || S.passed) && (i === run || i === run - 1)) c = i === run ? '#ffffff' : (S.passed ? '#fff1a8' : mix(theme.p, '#ffffff', 0.5));
            px(x + i * 4, y, 3, 4, c);
        }
        if (S.passed && !calm() && Math.random() < 0.3) px(x + Math.floor(Math.random() * segs) * 4 + 1, y - 1, 1, 1, '#fff6c8');
    }
    function hud(now) {
        let { tall, HX, TY, TX, tw, th, wall } = LY, live = S.state !== 'done' && S.state !== 'menu';
        if (tall) {
            let x0 = TX - wall - 5, w = tw + wall * 2 + 10;
            let o = LY.o;
            plate(x0, o + 1, w, 36);
            porthole(x0 + 18, o + 19, 12, now);
            if (live) nextIn(x0 + 18, o + 19);
            lcd(x0 + 36, o + 7, w - 74, 20);
            digits(Math.round(S.shown), x0 + w - 42, o + 10, 2, '#f4f0f8', true);
            bestBar(x0 + 36, o + 30, w - 74);
            lamps(x0 + w - 30, o + 10);
            critLamp(x0 + w - 30, o + 24, now);
            plate(TX - wall - 5, LY.base + 12, w, 22);
            ladder(TX + tw / 2, LY.base + 23, 0, 13);
        } else {
            let x0 = HX - 8, y0 = TY - 6, w = 118, h = th + 14;
            LY.PX = x0; LY.PY = y0; LY.PW = w; LY.PH = h;
            plate(x0, y0, w, h);
            porthole(x0 + 26, y0 + 28, 15, now);
            if (live) nextIn(x0 + 26, y0 + 28);
            lcd(x0 + 8, y0 + 64, w - 16, 22);
            digits('8888888', x0 + w - 12, y0 + 68, 2, !calm() && Math.random() < 0.004 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)', true);
            let rolling = S.shown !== S.score;
            if (rolling && !calm()) { bx.globalAlpha = 0.12; px(x0 + 9, y0 + 65, w - 18, 20, theme.s); bx.globalAlpha = 1; }
            digits(Math.round(S.shown), x0 + w - 12, y0 + 68, 2, rolling ? '#ffffff' : '#f4f0f8', true);
            for (let i = 0; i < 4; i++) { let on = !calm() && (S.w.t - S.lastFuse < 0.15 + i * 0.05 || Math.sin(now / (500 + i * 170) + i * 2) > 0.92); px(x0 + w - 30 + i * 5, y0 + 7, 3, 2, on ? (i % 2 ? theme.s : theme.p) : '#241f2e'); }
            bestBar(x0 + 8, y0 + 102, w - 16);
            lamps(x0 + w - 28, y0 + 120);
            critLamp(x0 + 8, y0 + h - 38, now);
            if (S.mode === 'bomb') {
                lcd(x0 + w - 32, y0 + 140, 24, 11);
                if (S.bombShow !== S.bombIn) { S.bombPrev = S.bombShow == null ? S.bombIn : S.bombShow; S.bombShow = S.bombIn; S.bombFlip = calm() ? 0 : 1; }
                let f = S.bombFlip || 0, hot = S.bombIn <= 2 && Math.floor(now / 250) % 2;
                bx.save(); bx.beginPath(); bx.rect(x0 + w - 31, y0 + 141, 22, 9); bx.clip();
                if (f > 0) digits(S.bombPrev, x0 + w - 11, y0 + 142 + Math.round((1 - f) * 9), 1, '#7a5030', true);
                digits(S.bombIn, x0 + w - 11, y0 + 142 - Math.round(f * 9), 1, hot ? '#ff5a3a' : '#ffb070', true);
                bx.restore();
            }
            px(x0 + 6, y0 + h - 22, w - 12, 15, '#07040b'); px(x0 + 7, y0 + h - 21, w - 14, 13, '#141019');
            ladder(LY.LX, LY.base - 50, 36, 0);
        }
        if ((S.chain > 1 || S.chainShow > 0) && S.state === 'play') {
            let n = Math.max(S.chain, 2), x = tall ? TX + tw / 2 + 12 : TX - wall - 10, y = tall ? TY + 22 : TY + 22, al = Math.min(1, S.chainShow * 2 + (S.chain > 1 ? 1 : 0));
            bx.globalAlpha = al;
            let k = S.chainPop > 0 && !calm() ? 4 : 3;
            if (!calm()) { digits('x' + n, x - 1, y, k, 'rgba(255,42,109,0.8)', true); digits('x' + n, x + 1, y, k, 'rgba(45,224,255,0.8)', true); }
            digits('x' + n, x, y + 1, k, '#07040b', true); digits('x' + n, x, y, k, '#ffffff', true);
            bx.globalAlpha = 1;
        }
    }
    function nextIn(x, y) {
        sprite(key(S.next), x, y, null, 1, 1, null, S.next === 11, S.nextShiny ? 0.2 : 0);
        if (S.next === 12 || S.nextLit) wick(x, y - Rt(S.next) / U - 1, performance.now());
    }
    function text(s, x, y, size, col, align, jit) {
        let k = LY.k; sx.font = Math.round(size * k) + 'px "DotGothic16", monospace'; sx.textAlign = align || 'left'; sx.textBaseline = 'top';
        let X = Math.round(x * k), Y = Math.round(y * k);
        if (jit && !calm()) { let j = Math.random() < 0.15 ? (Math.random() - 0.5) * 4 * k : 0; sx.globalAlpha = 0.7; sx.fillStyle = '#ff2a6d'; sx.fillText(s, X - k + j, Y); sx.fillStyle = '#2de0ff'; sx.fillText(s, X + k + j, Y); sx.globalAlpha = 1; X += j; }
        sx.fillStyle = '#000'; sx.fillText(s, X + Math.max(1, k / 2), Y + Math.max(1, k / 2));
        sx.fillStyle = col; sx.fillText(s, X, Y);
    }
    const stamp = (s, x, y, size, col, al) => text(s, x, y, size || 7, col || '#b3adc0', al);
    function words(now) {
        let { tall, TY, TX, tw, th, wall } = LY, m = mode(S.mode), best = S.bestAt || 0;
        stamp(LJ('title', 0, '臨界融合 | CRITICAL FUSE') + '  ' + LE('title', 0, '臨界融合 | CRITICAL FUSE'), LY.BW / 2, 3, 7, rgba(theme.s, 0.85), 'center');
        if (tall) {
            let x0 = TX - wall - 5, w = tw + wall * 2 + 10;
            stamp(m.jp + ' ' + m.en, x0 + 36, LY.o + 30, 5, '#6f6a7c');
        } else {
            let x0 = LY.PX, y0 = LY.PY, w = LY.PW, h = LY.PH;
            stamp(L('next', 0, '次 | NEXT'), x0 + 48, y0 + 14);
            stamp((touchy() ? '' : '[C] ') + L('swap', 0, '入れ替え | SWAP'), x0 + 48, y0 + 28, 6, S.swapped ? '#3a3546' : rgba(theme.s, 0.85));
            stamp(L('score', 0, 'スコア | SCORE'), x0 + 8, y0 + 54);
            stamp(L('best', 0, 'ベスト | BEST') + ' ' + (best || '-'), x0 + 8, y0 + 91, 6, S.passed ? '#ffd04a' : '#8f8b9a');
            stamp(L('shake', 0, 'ゆらす | SHAKE'), x0 + 8, y0 + 119);
            if (!touchy()) stamp('[↑]', x0 + 8, y0 + 129, 6, '#6f6a7c');
            if (S.mode === 'bomb') stamp(L('bombIn', 0, '爆弾まで | BOMB IN'), x0 + 8, y0 + 142);
            stamp(L('critical', 0, '臨界 | CRITICAL'), x0 + 21, y0 + h - 37, 6, S.overT > 0 ? '#ff5a6a' : '#5b5670');
            stamp(m.jp + ' // ' + m.en, x0 + w / 2, y0 + h - 19, 6, rgba(theme.p, 0.9), 'center');
            stamp(L('ladder', 0, '進化 | THE LADDER'), LY.LX, LY.base - 108, 6, '#6f6a7c', 'center');
        }
        if ((S.chain > 1 || S.chainShow > 0) && S.state === 'play') {
            let n = Math.max(S.chain, 2), mult = (1 + S.n.chainStep * (n - 1)).toFixed(1).replace('.0', '');
            sx.globalAlpha = Math.min(1, S.chainShow * 2 + (S.chain > 1 ? 1 : 0));
            if (tall) text(LJ('chain', 0, '連鎖 | CHAIN') + ' ×' + mult, TX + tw / 2 + 16, TY + 26, 6, rgba(theme.s, 0.95));
            else text(L('chain', 0, '連鎖 | CHAIN') + ' ×' + mult, TX - wall - 10, TY + 46, 6, rgba(theme.s, 0.95), 'right');
            sx.globalAlpha = 1;
        }
        for (let f of S.fl) { let [x, y] = P(f.x, f.y); sx.globalAlpha = Math.min(1, (1 - f.t / f.life) * 2); text(f.s, x, y - 6 - f.t * 26, f.big || f.gold ? 10 : 7, f.big ? '#fff' : f.gold ? '#ffd04a' : '#ffe27a', 'center', f.gold); }
        sx.globalAlpha = 1;
        if (S.banner) { let y = TY + laserY() / U - 16; text(S.banner.s, TX + tw / 2, y, 7, S.state === 'over' ? '#ff5a7a' : '#ffe27a', 'center', true); }
    }
    function frame(t) {
        raf = 0;
        if (!S || !cv || asleep) return;
        let dt = last ? Math.min(0.1, (t - last) / 1000) : 0; last = t;
        readTheme(t);
        if (S.state !== 'pause' && (S.state !== 'menu' || (S.demo && !calm())) && S.state !== 'done') tick(dt);
        else if (S.state === 'done' || S.state === 'menu') { for (let p of S.fx) { p.t += dt; p.vy += 700 * dt; p.x += p.vx * dt; p.y += p.vy * dt; } S.fx = S.fx.filter(p => p.t < p.life); }
        drawScene(t);
        sx.imageSmoothingEnabled = false;
        sx.clearRect(0, 0, sc.width, sc.height);
        sx.drawImage(buf, 0, 0, sc.width, sc.height);
        if (S.state !== 'menu' && S.state !== 'done') words(t);
        post(t);
        raf = requestAnimationFrame(frame);
    }

    // Same crt post as snake, didnt want to write it twice
    function glSetup() {
        try { gl = cv.getContext('webgl', { premultipliedAlpha: false, antialias: false }); } catch (e) { gl = null; }
        if (!gl) return false;
        const sh = (type, src) => { let o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
        let vs = sh(gl.VERTEX_SHADER, 'attribute vec2 p; varying vec2 uv; void main(){ uv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5); gl_Position = vec4(p, 0.0, 1.0); }');
        let fs = sh(gl.FRAGMENT_SHADER, [
            'precision mediump float; uniform sampler2D tx; uniform vec2 res; uniform float time, danger, kick, flash; varying vec2 uv;',
            'void main(){',
            ' vec2 cc = uv - 0.5; float r2 = dot(cc, cc); vec2 p = 0.5 + cc * (1.0 + 0.035 * r2);',
            ' if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }',
            ' float ab = 0.0007 + 0.0025 * kick + 0.0015 * danger;',
            ' vec3 col = vec3(texture2D(tx, p + vec2(ab, 0.0)).r, texture2D(tx, p).g, texture2D(tx, p - vec2(ab, 0.0)).b);',
            ' vec3 b = vec3(0.0); vec2 px = 1.0 / res;',
            ' for (int i = 0; i < 12; i++) { float a = float(i) * 0.5236; vec2 o = vec2(cos(a), sin(a));',
            '  b += max(texture2D(tx, p + o * px * 4.0).rgb - 0.6, 0.0) * 0.6 + max(texture2D(tx, p + o * px * 11.0).rgb - 0.6, 0.0) * 0.4; }',
            ' col += b / 12.0 * 1.6;',
            ' col *= 0.93 + 0.07 * sin(p.y * res.y * 1.5708);',
            ' float v = smoothstep(0.85, 0.3, length(cc)); float pu = danger * (0.55 + 0.45 * sin(time * 9.0));',
            ' col = mix(col, col * vec3(1.0, 0.4, 0.45) + vec3(0.25, 0.0, 0.04) * pu, (1.0 - v * 0.6) * danger * 0.8);',
            ' col *= mix(0.72, 1.0, v); col += vec3(flash) * 0.6;',
            ' gl_FragColor = vec4(col, 1.0);',
            '}'].join('\n'));
        if (!vs || !fs) { gl = null; return false; }
        prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { gl = null; return false; }
        gl.useProgram(prog);
        let b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        let loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        ['res', 'time', 'danger', 'kick', 'flash'].forEach(k => uni[k] = gl.getUniformLocation(prog, k));
        return true;
    }
    function post(t) {
        let danger = S.overT > 0 ? Math.min(1, S.overT * 1000 / S.n.overMs) : 0;
        if (!gl) {
            if (danger) { sx.fillStyle = 'rgba(255,30,60,' + (0.12 * danger * (0.6 + 0.4 * Math.sin(t / 110))) + ')'; sx.fillRect(0, 0, sc.width, sc.height); }
            if (S.flash > 0.02) { sx.fillStyle = 'rgba(255,255,255,' + (S.flash * 0.5) + ')'; sx.fillRect(0, 0, sc.width, sc.height); }
            return;
        }
        gl.viewport(0, 0, cv.width, cv.height);
        gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sc);
        gl.uniform2f(uni.res, cv.width, cv.height); gl.uniform1f(uni.time, t / 1000); gl.uniform1f(uni.danger, danger);
        gl.uniform1f(uni.kick, calm() ? 0 : S.kick); gl.uniform1f(uni.flash, calm() ? S.flash * 0.3 : S.flash);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function snd(k, a, b) {
        if (D.noSfx || (os.prefs && os.prefs.sound === false) || (S && S.demo && k !== 'tick')) return;
        try {
            let A = window.audioCtx || (window.audioCtx = new (window.AudioContext || window.webkitAudioContext)()); if (A.state === 'suspended') A.resume();
            let out = os.gg && os.gg.out ? os.gg.out(A) : A.destination, now = A.currentTime;
            const env = (g, v, at, dur) => { g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(v, at + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, at + dur); };
            const osc = (type, f1, f2, v, dur, dl) => { let o = A.createOscillator(), g = A.createGain(), at = now + (dl || 0); o.type = type; o.frequency.setValueAtTime(f1, at); if (f2 !== f1) o.frequency.exponentialRampToValueAtTime(f2, at + dur); env(g, v, at, dur); o.connect(g); g.connect(out); o.start(at); o.stop(at + dur + 0.02); };
            const bell = (f, v, dur, dl) => { let at = now + (dl || 0), c = A.createOscillator(), m = A.createOscillator(), mg = A.createGain(), g = A.createGain(); c.frequency.value = f; m.frequency.value = f * 3.5; mg.gain.setValueAtTime(f * 2.2, at); mg.gain.exponentialRampToValueAtTime(1, at + dur); m.connect(mg); mg.connect(c.frequency); env(g, v, at, dur); c.connect(g); g.connect(out); c.start(at); m.start(at); c.stop(at + dur + 0.02); m.stop(at + dur + 0.02); };
            const noise = (v, dur, f, dl) => { let at = now + (dl || 0), n = A.createBufferSource(), bf = A.createBuffer(1, Math.ceil(A.sampleRate * dur), A.sampleRate), d = bf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; n.buffer = bf; let fl = A.createBiquadFilter(), g = A.createGain(); fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = 0.9; env(g, v, at, dur); n.connect(fl); fl.connect(g); g.connect(out); n.start(at); };
            const ST = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
            if (k === 'drop') { osc('sine', 170, 70, 0.16, 0.09); noise(0.05, 0.05, 500); }
            else if (k === 'fuse') { let f = MU.on ? bellNote(a, b) : 392 * Math.pow(2, (ST[Math.max(0, a - 1)] + (b || 0)) / 12); bell(f, 0.11, 0.55); noise(0.04, 0.04, 2400); }
            else if (k === 'holo') { [0, 4, 7, 12, 16].forEach((s, i) => bell(523 * Math.pow(2, s / 12), 0.08, 1.2, i * 0.06)); noise(0.06, 0.6, 3000); }
            else if (k === 'warn') osc('square', 880, 880, 0.025, 0.05);
            else if (k === 'close') [0, 5, 12].forEach((s, i) => osc('triangle', 660 * Math.pow(2, s / 12), 660 * Math.pow(2, s / 12), 0.07, 0.09, i * 0.06));
            else if (k === 'over') { osc('sawtooth', 300, 60, 0.06, 0.9); osc('square', 150, 40, 0.03, 0.9); }
            else if (k === 'tally') osc('triangle', 500 + Math.min(40, a) * 18, 500 + Math.min(40, a) * 18, 0.05, 0.05);
            else if (k === 'tick') osc('square', 1200, 1200, 0.02, 0.025);
            else if (k === 'tock') osc('square', 1800, 1800, 0.025, 0.02);
            else if (k === 'fizz') noise(0.03, 0.25, 4000);
            else if (k === 'boom') { osc('sine', 110, 30, 0.22, 0.5); noise(0.14, 0.45, 300); noise(0.05, 0.2, 2000); }
            else if (k === 'shake') { for (let i = 0; i < 6; i++) noise(0.05, 0.05, 900 + i * 300, i * 0.045); }
            else if (k === 'shiny') [0, 7, 12, 19].forEach((st, i) => osc('triangle', 1320 * Math.pow(2, st / 12), 1320 * Math.pow(2, st / 12), 0.035, 0.12, i * 0.05));
            else if (k === 'swap') { osc('square', 700, 700, 0.025, 0.03); osc('square', 1050, 1050, 0.025, 0.03, 0.05); }
            else if (k === 'best') [0, 4, 7, 12].forEach((st, i) => bell(660 * Math.pow(2, st / 12), 0.07, 0.4, i * 0.07));
            else if (k === 'defuse') { noise(0.05, 0.3, 6000); osc('triangle', 990, 1320, 0.05, 0.12, 0.05); }
        } catch (e) {}
    }

    // Heat is how high the pile is + chains + the countdown. it picks how busy the song gets
    const MU = { on: false, A: null, L: null, T: {}, sg: null, busy: false, lp: null, out: null, step: 0, next: 0, heat: 0, kick: 0, fill: 0, run: [], tm: 0, tweak: 0, pn: 0, an: 0 };
    const kk = (i, n) => (i + 0.5) / n;
    const MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10];
    const SONGS = {
        classic: [{
            id: 'glass', bpm: [106, 120], sw: 0, key: 62, sc: MAJ, lr: [69, 86],
            prog: [[38, [62, 66, 69, 73]], [35, [59, 62, 66, 69]], [43, [55, 59, 62, 66]], [45, [57, 61, 64, 69]]],
            v: { kick: ['stomp', '', { model: kk(4, 9), tune: 0.45, decay: 0.3, click: 0.15 }, { vol: 0.79 }], snare: ['slap', '', { model: kk(6, 12) }, { vol: 1.14, room: 0.3 }],
                hat: ['tick', '', { model: kk(2, 10), bright: 0.55 }, { vol: 0.55 }], perc: ['chime', '', { model: kk(4, 15), decay: 0.5 }, { vol: 0.36, room: 0.3 }],
                bass: ['sump', '', { wave: kk(1, 4), cut: 0.25, sub: 0.5 }, { vol: 0.32, duck: 0.25 }], arp: ['chrome', 'GLASS BELL', {}, { vol: 0.29, echo: 0.35, room: 0.2 }],
                pad: ['haze', 'GLASS GLOW', {}, { vol: 0.23, room: 0.4, duck: 0.3 }], lead: ['chrome', 'TRANCE PLUCK', {}, { vol: 0.22, echo: 0.3, room: 0.25 }] },
            kick: ['x.......x.......', 'x.......x.......', 'x.......x.x.....', 'x...x...x...x...'], snare: ['', '....x.......x...', '....x.......x...', '....x.......x...'],
            hat: ['', '', '..x...x...x...x.', 'o.x.o.x.o.x.o.x.'], perc: ['x...............................', 'x...............................', 'x...............................', ''], pn: [84, 79],
            bass: ['x...............', 'x.......x.......', 'x.......x...o...', 'x.....x.x...o...'], arp: ['x...x...x...x...', 'x.x.x.x.x.x.x.x.', 'x.x.x.x.x.x.x.x.', 'x.x.x.x.x.x.x.x.'], span: [3, 4, 6, 8], am: 'up', ao: 12,
            lead: 'x...x.x.x.......x...x...x.x.x...'
        }, {
            id: 'candy', bpm: [112, 126], sw: 0.18, key: 65, sc: MAJ, lr: [72, 88],
            prog: [[41, [57, 60, 65, 69]], [38, [57, 62, 65, 69]], [46, [58, 62, 65, 70]], [36, [55, 60, 64, 67]]],
            v: { kick: ['stomp', '', { model: kk(4, 9), tune: 0.5, decay: 0.22, click: 0.2 }, { vol: 0.84 }], snare: ['slap', '', { model: kk(1, 12) }, { vol: 0.59, room: 0.2 }],
                hat: ['tick', '', { model: kk(3, 10) }, { vol: 0.33 }], perc: ['chime', '', { model: kk(2, 15), decay: 0.25 }, { vol: 0.14 }],
                bass: ['pick', '', { model: kk(5, 13), bright: 0.4, decay: 0.4 }, { vol: 1.05 }], arp: ['pick', '', { model: kk(10, 13), bright: 0.6, decay: 0.5 }, { vol: 0.54, echo: 0.2, room: 0.2 }],
                pad: ['haze', 'OLD TAPE KEYS', {}, { vol: 0.25, room: 0.3 }], lead: ['chrome', 'TINE PIANO', {}, { vol: 0.27, echo: 0.2, room: 0.2 }] },
            kick: ['x.......x.......', 'x.......x.......', 'x.....x.x.......', 'x.....x.x...x...'], snare: ['', '....x.......x...', '....x.......x...', '....x.......x..o'],
            hat: ['', '..x...x...x...x.', 'x.x.x.x.x.x.x.x.', 'xoxoxoxoxoxoxoxo'], perc: ['', '', '............x...', '....x.......x...'], pn: [60],
            bass: ['x.......o.......', 'x...o...x...o...', 'x...o..xx...o...', 'x...o..xx...o.x.'], arp: ['x.......x.......', 'x...x...x...x...', 'x.x.x.x.x.x.x.x.', 'x.x.x.x.x.x.x.x.'], span: [3, 4, 5, 7], am: 'ud', ao: 12,
            lead: 'x.x.x...x.x.....x.x.x...x.......'
        }],
        bomb: [{
            id: 'fuse', bpm: [118, 132], sw: 0, key: 64, sc: MIN, lr: [71, 86], bst: 1,
            prog: [[40, [59, 64, 67, 71]], [36, [60, 64, 67, 72]], [43, [59, 62, 67, 71]], [38, [57, 62, 66, 69]]],
            v: { kick: ['stomp', '', { model: kk(6, 9), tune: 0.5, decay: 0.3 }, { vol: 0.35 }], snare: ['slap', '', { model: kk(10, 12) }, { vol: 0.54, room: 0.2 }],
                hat: ['tick', '', { model: kk(5, 10) }, { vol: 0.51 }], perc: ['zap', 'BLIP', {}, { vol: 0.33 }],
                bass: ['sump', '', { wave: kk(3, 4), cut: 0.22, dec: 0.2, sus: 0.3 }, { vol: 0.45, duck: 0.3 }], arp: ['grit', '', { wave: kk(3, 4), cut: 0.4, env: 0.4, dec: 0.1, rel: 0.1 }, { vol: 0.4, echo: 0.2 }],
                pad: ['haze', '', { wave: kk(3, 4), voices: kk(2, 7), det: 0.15, cut: 0.35, att: 0.3, rel: 0.5 }, { vol: 0.21, room: 0.3, duck: 0.35 }], lead: ['grit', 'THIN LEAD', {}, { vol: 0.28, echo: 0.2 }] },
            kick: ['x.......x.......', 'x.......x.......', 'x...x...x...x...', 'x...x...x...x...'], snare: ['', '....x.......x...', '....x.......x...', '....x.......x...'],
            hat: ['', '..x...x...x...x.', 'x.x.x.x.x.x.x.x.', 'x.xox.xox.xox.xo'], perc: ['x...............', 'x.......x.......', 'x...x...x...x...', 'x...x...x...x...'], pn: [72, 72, 72, 79],
            bass: ['x...............', 'x..x....x..x....', 'x..x..x.x..x..x.', 'x..x..x.x..x.ox.'], arp: ['', '..x...x...x...x.', 'x.x.x.x.x.x.x.x.', 'x.x.x.x.x.x.x.x.'], span: [3, 3, 4, 6], am: 'alt', ao: 12,
            lead: 'x.x.x...x.x.x...x.x.x.x.x.......'
        }, {
            id: 'boom', bpm: [92, 104], sw: 0, key: 60, sc: MIN, lr: [55, 70],
            prog: [[36, [60, 63, 67, 72]], [44, [60, 63, 68, 72]], [39, [58, 63, 67, 70]], [46, [58, 62, 65, 70]]],
            v: { kick: ['stomp', '', { model: kk(1, 9), tune: 0.4, decay: 0.5 }, { vol: 0.38 }], snare: ['slap', '', { model: kk(2, 12) }, { vol: 0.46, room: 0.35 }],
                hat: ['tick', '', { model: kk(7, 10) }, { vol: 0.65 }], perc: ['slap', 'RIMSHOT', {}, { vol: 0.73 }],
                bass: ['sump', '', { wave: kk(0, 4), sub: 0.7, cut: 0.2 }, { vol: 0.32, duck: 0.35 }], arp: ['chrome', 'BLACK MARIMBA', {}, { vol: 0.37, room: 0.2 }],
                pad: ['haze', 'FOG CATHEDRAL', {}, { vol: 0.3, room: 0.4, duck: 0.4 }], lead: ['sinew', 'WEEPING CELLO', {}, { vol: 0.42, room: 0.3 }] },
            kick: ['x...............', 'x.........x.....', 'x.........x.....', 'x.........x..x..'], snare: ['', '........x.......', '........x.......', '........x.......'],
            hat: ['', 'x...x...x...x...', 'x.x.x.x.x.x.x.x.', 'x.x.x.xox.x.x.xo'], perc: ['', '', '..............x.', '......x.......x.'], pn: [60],
            bass: ['x...............', 'x.........x.....', 'x.........x.....', 'x.......o.x.....'], arp: ['x.......x.......', 'x...x...x...x...', 'x..x..x...x..x..', 'x..x..x.x..x..x.'], span: [3, 4, 5, 6], am: 'ud', ao: 0,
            lead: 'x.......x...x...x...............'
        }],
        lit: [{
            id: 'wick', bpm: [100, 116], sw: 0, key: 67, sc: MIN, lr: [70, 86],
            prog: [[43, [58, 62, 67, 70]], [39, [58, 63, 67, 70]], [46, [58, 62, 65, 70]], [38, [57, 62, 66, 69]]],
            v: { kick: ['stomp', '', { model: kk(4, 9), tune: 0.45, decay: 0.28 }, { vol: 0.83 }], snare: ['slap', 'RIMSHOT', {}, { vol: 0.67 }],
                hat: ['tick', '', { model: kk(3, 10) }, { vol: 0.36 }], perc: ['chime', '', { model: kk(3, 15), decay: 0.2 }, { vol: 0.26, room: 0.15 }],
                bass: ['pick', '', { model: kk(5, 13), bright: 0.35, decay: 0.45 }, { vol: 1.21 }], arp: ['sinew', 'PIZZICATO', {}, { vol: 0.41, room: 0.25 }],
                pad: ['sinew', 'CATHEDRAL SECTION', {}, { vol: 0.15, room: 0.35, duck: 0.2 }], lead: ['pipe', 'WHISTLE', {}, { vol: 0.32, echo: 0.3, room: 0.2 }] },
            kick: ['', 'x.......x.......', 'x.......x.......', 'x...x...x...x...'], snare: ['', '', '....x.......x...', '....x.......x...'],
            hat: ['', '', '..x...x...x...x.', 'x.x.x.x.x.x.x.x.'], perc: ['x...x...x...x...', 'x...x...x...x...', 'x.x.x.x.x.x.x.x.', 'x.x.x.x.x.x.x.x.'], pn: [72, 67],
            bass: ['x.......x.......', 'x.......x.......', 'x.....x.x.......', 'x.....x.x...x...'], arp: ['', 'x...x...x...x...', 'x.x.x.x.x.x.x.x.', 'x.x.x.x.x.x.x.x.'], span: [3, 3, 4, 6], am: 'up', ao: 0,
            lead: 'x...x...x.x.x...x.......x...x...'
        }, {
            id: 'ember', bpm: [92, 106], sw: 0.12, key: 68, sc: MAJ, lr: [68, 84],
            prog: [[44, [60, 63, 68, 72]], [41, [60, 65, 68, 72]], [37, [60, 65, 68, 73]], [39, [58, 63, 67, 70]]],
            v: { kick: ['stomp', '', { model: kk(4, 9), tune: 0.4, decay: 0.3 }, { vol: 0.83 }], snare: ['slap', 'BRUSHES', {}, { vol: 0.82, room: 0.3 }],
                hat: ['tick', 'LO-FANG HAT', {}, { vol: 0.59 }],
                bass: ['sump', '', { wave: kk(1, 4), cut: 0.22, sub: 0.6 }, { vol: 0.31, duck: 0.2 }], arp: ['pick', '', { model: kk(9, 13), bright: 0.5, decay: 0.5 }, { vol: 0.62, room: 0.25 }],
                pad: ['pipe', 'CHAPEL', {}, { vol: 0.16, room: 0.35, duck: 0.2 }], lead: ['parlour', 'TINE KEYS', {}, { vol: 0.28, room: 0.25 }] },
            kick: ['x.......x.......', 'x.......x.......', 'x.......x.x.....', 'x.....x.x.x.....'], snare: ['', '....x.......x...', '....x.......x...', '....x.......x...'],
            hat: ['', '..x...x...x...x.', 'x.x.x.x.x.x.x.x.', 'x.x.x.x.x.x.x.x.'], perc: [''], pn: [60],
            bass: ['x...............', 'x.......x.......', 'x.......x.....x.', 'x.....x.x.....x.'], arp: ['x.......x.......', 'x...x...x...x...', 'x.x.x...x.x.x...', 'x.x.x.x.x.x.x.x.'], span: [3, 4, 5, 7], am: 'ud', ao: 12,
            lead: 'x.x...x...x.....x...x.x.x.......'
        }],
        magnet: [{
            id: 'pull', bpm: [114, 124], sw: 0, key: 57, sc: [0, 2, 3, 5, 7, 9, 10], lr: [69, 84], stab: 1,
            prog: [[45, [60, 64, 67, 69]], [38, [57, 62, 66, 69]], [45, [60, 64, 67, 69]], [43, [59, 62, 67, 71]]],
            v: { kick: ['stomp', '', { model: kk(0, 9), tune: 0.45, decay: 0.32 }, { vol: 0.56 }], snare: ['slap', '', { model: kk(0, 12) }, { vol: 0.53, room: 0.3 }],
                hat: ['tick', '', { model: kk(0, 10) }, { vol: 0.76 }], perc: ['tick', '', { model: kk(3, 10) }, { vol: 0.37 }],
                bass: ['sump', '', { wave: kk(2, 4), cut: 0.2, res: 0.2 }, { vol: 0.32, duck: 0.6 }], arp: ['chrome', 'TINE PIANO', {}, { vol: 0.2, echo: 0.25, room: 0.2, duck: 0.3 }],
                pad: ['haze', 'ENTRANCED PAD', {}, { vol: 0.3, room: 0.3, duck: 0.7 }], lead: ['chrome', 'CHOIR OF MIRRORS', {}, { vol: 0.39, room: 0.3 }] },
            kick: ['x.......x.......', 'x...x...x...x...', 'x...x...x...x...', 'x...x...x...x...'], snare: ['', '', '....x.......x...', '....x.......x...'],
            hat: ['', '..x...x...x...x.', '..x...x...x...x.', '..x.o.x...x.o.x.'], perc: ['', '', '', 'o.o.o.o.o.o.o.o.'], pn: [60],
            bass: ['x.......x.......', '..x...x...x...x.', '..x...x...x...x.', '..x..xx...x..xx.'], arp: ['x.....x.........', 'x.....x.....x...', 'x.....x...x...x.', 'x..x..x...x..x..'], span: [4, 4, 4, 4], am: 'up', ao: 0,
            lead: 'x.......x.x.....x...x...........'
        }, {
            id: 'orbit', bpm: [98, 110], sw: 0.14, key: 63, sc: MAJ, lr: [70, 87],
            prog: [[39, [58, 63, 67, 70]], [36, [58, 60, 63, 67]], [44, [60, 63, 67, 68]], [46, [58, 62, 65, 70]]],
            v: { kick: ['stomp', '', { model: kk(4, 9), tune: 0.42, decay: 0.35 }, { vol: 0.84 }], snare: ['slap', '', { model: kk(3, 12) }, { vol: 0.46, room: 0.4 }],
                hat: ['tick', '', { model: kk(8, 10) }, { vol: 0.55 }], perc: ['chime', '', { model: kk(5, 15), decay: 0.5 }, { vol: 0.27, room: 0.4 }],
                bass: ['nocturne', 'STEEL BASS', {}, { vol: 1.37, duck: 0.25 }], arp: ['parlour', 'GLASS CELESTA', {}, { vol: 0.37, echo: 0.35, room: 0.25 }],
                pad: ['nocturne', 'NIGHT FOG PAD', {}, { vol: 0.46, room: 0.4, duck: 0.3 }], lead: ['nocturne', 'GLASS KEYS', {}, { vol: 0.67, echo: 0.3, room: 0.3 }] },
            kick: ['x...............', 'x.......x.......', 'x.......x.......', 'x.....x.x.......'], snare: ['', '', '....x.......x...', '....x.......x...'],
            hat: ['', '..x...x...x...x.', 'x.x.x.x.x.x.x.x.', 'x.x.x.x.x.x.x.x.'], perc: ['x...............................', 'x...............x...............', 'x...............x...............', 'x...............x...............'], pn: [84, 91],
            bass: ['x...............', 'x.......x.......', 'x.....x.x.......', 'x.....x.x.....x.'], arp: ['x...x...x...x...', 'x.x.x.x.x.x.x.x.', 'x.x.x.x.x.x.x.x.', 'x.x.x.x.x.x.x.x.'], span: [4, 5, 6, 8], am: 'ud', ao: 12,
            lead: 'x.....x.....x...x...............'
        }]
    };
    const hz = m => 440 * Math.pow(2, (m - 69) / 12);
    const chord = () => (MU.sg || SONGS.classic[0]).prog[Math.floor(MU.step / 32) % 4];
    const tier = H => H < 0.22 ? 0 : H < 0.5 ? 1 : H < 0.78 ? 2 : 3;
    function tune(sg) {
        if (sg.mel) return sg.mel;
        let h = 0; for (let c of sg.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
        const r = () => { h = (h + 0x6D2B79F5) >>> 0; let t = Math.imul(h ^ h >>> 15, 1 | h); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
        let [lo, hi] = sg.lr, mel = [], last = (lo + hi) >> 1;
        sg.prog.forEach((c, ci) => {
            let pcs = c[1].map(m => m % 12), all = [];
            for (let m = lo; m <= hi; m++) {
                let pc = m % 12, inC = pcs.includes(pc), inS = sg.sc.includes((pc - sg.key % 12 + 12) % 12);
                if (inC || (inS && !pcs.some(q => Math.abs(q - pc) % 11 === 1))) all.push([m, inC]);
            }
            for (let s = 0; s < 32; s++) {
                if (sg.lead[s] !== 'x') { mel.push(0); continue; }
                let end = ci === 3 && s >= 16, strong = s % 8 === 0 || end, aim = last + Math.round(r() * 6 - 3);
                let pool = all.filter(p => !strong || p[1]); if (end) pool = pool.filter(p => p[0] % 12 === sg.key % 12).concat(pool.filter(p => p[1]));
                pool.sort((a, b) => Math.abs(a[0] - aim) - Math.abs(b[0] - aim));
                last = pool[Math.min(pool.length - 1, r() < 0.7 ? 0 : 1)][0]; mel.push(last);
            }
        });
        return (sg.mel = mel);
    }
    const pickSong = m => { let l = SONGS[m] || SONGS.classic, i = ((D.songs || {})[m] || 0) % l.length; return l[i]; };
    async function muLoad(sg) {
        sg = sg || MU.want || pickSong(S ? S.mode : D.mode || 'classic');
        if ((MU.ready && MU.sg === sg) || MU.busy) return;
        MU.busy = true;
        try {
            await os.need(['noisebox_fx.js', 'noisebox_sound.js']);
            let A = MU.A = window.audioCtx || (window.audioCtx = new (window.AudioContext || window.webkitAudioContext)());
            if (!MU.out) {
                MU.lp = A.createBiquadFilter(); MU.lp.type = 'lowpass'; MU.lp.frequency.value = 18000;
                MU.out = A.createGain(); MU.out.gain.value = 0.0001;
                MU.lp.connect(MU.out); MU.out.connect(os.gg && os.gg.out ? os.gg.out(A) : A.destination);
            }
            let old = MU.L; MU.ready = false;
            if (old) { try { old.stop(true); old.R.M.out.disconnect(); } catch (e) {} }
            let r = await band(A, sg); MU.L = r.L; MU.T = r.T; MU.sg = sg;
            r.L.R.M.out.disconnect(); r.L.R.M.out.connect(MU.lp);
            MU.ready = true;
        } catch (e) { MU.L = null; /* console.log('no music', e) */ }
        MU.busy = false;
        if (MU.want && MU.want !== MU.sg) return muLoad(MU.want);
        if (MU.ready && S && S.state === 'play') musicOn();
    }
    async function band(A, sg) {
        let pr = NB.blankProject(), T = {}; pr.bpm = sg.bpm[0];
        const add = (name, [inst, pre, snd, mix]) => {
            let t = NB.newTrack(pr, inst), ps = pre && (NB.V[inst].presets || []).find(q => q[0].indexOf(pre) >= 0);
            if (ps) Object.assign(t.snd, ps[1]);
            Object.assign(t.snd, snd || {}); Object.assign(t.mix, mix || {}); pr.tracks.push(t); T[name] = t;
            t._cut = t.snd.cut; t._duck = t.mix.duck || 0;
        };
        Object.keys(sg.v).forEach(k => add(k, sg.v[k]));
        add('crash', ['steel', '', {}, { vol: 0.2, room: 0.3 }]);
        add('zap', ['zap', '', {}, { vol: 0.14 }]);
        // Has to be the games ctx or the volume rocker does nothing
        let AC0 = window.AudioContext, W0 = window.webkitAudioContext, L;
        window.AudioContext = window.webkitAudioContext = function () { return A; };
        try { L = new NB.Live(pr); } finally { window.AudioContext = AC0; window.webkitAudioContext = W0; }
        await L.wk;
        L.R.sync(); L.R.apply(true);
        return { L, T };
    }
    const hit = (name, t, m, d, v) => { let tr = MU.T[name]; if (tr) MU.L.R.trig(tr, t, d, { m, v }, v, {}); };
    const at = (p, x) => p && p.length ? p[x % p.length] : '.';
    const gap = (p, x) => { let n = 1; while (n < p.length && at(p, x + n) === '.') n++; return n; };
    function play16(i, t) {
        let sg = MU.sg, H = MU.heat, k = tier(H), x = i % 16, bar = Math.floor(i / 16), ch = chord(), danger = S && S.overT > 0, s16 = 60 / bpm() / 4, T = MU.T, lift = 0.75 + H * 0.25;
        const pat = (p, name, m, d) => { let q = p[Math.min(k, p.length - 1)], c = at(q, i); if (c !== '.' && q) hit(name, t, m, d, (c === 'o' ? 0.55 : 1) * lift); };
        ['bass', 'pad'].forEach(n => { let tr = T[n]; if (tr && tr._cut != null) tr.snd.cut = tr._cut * (0.8 + H * 0.5); });
        pat(sg.kick, 'kick', 60, 0.3);
        pat(sg.snare, 'snare', 60, 0.2);
        pat(sg.hat, 'hat', 60, 0.08);
        let pq = sg.perc[Math.min(k, sg.perc.length - 1)];
        if (pq && at(pq, i) !== '.') { hit('perc', t, sg.pn[MU.pn++ % sg.pn.length], 0.15, (at(pq, i) === 'o' ? 0.5 : 0.9) * lift); }
        let bq = sg.bass[Math.min(k, sg.bass.length - 1)], bc = at(bq, i);
        if (bc !== '.') hit('bass', t, ch[0] + (bc === 'o' ? 12 : 0), s16 * (sg.bst ? 1.4 : gap(bq, i) * 0.9), (bc === 'o' ? 0.6 : 0.8) * lift);
        if (i % 32 === 0) ch[1].forEach(m => hit('pad', t, m, s16 * 31.8, 0.5 + H * 0.25));
        let aq = sg.arp[Math.min(k, sg.arp.length - 1)], ac = at(aq, i);
        if (aq && ac !== '.') {
            let up = ch[1].concat(ch[1].map(m => m + 12)).slice(0, sg.span[k]), n = MU.an++, j;
            if (sg.stab) ch[1].forEach(m => hit('arp', t, m + sg.ao, s16 * 1.6, 0.55 * lift));
            else {
                j = sg.am === 'ud' ? (n % (2 * up.length - 2 || 1)) : sg.am === 'alt' ? [0, 2, 1, 3, 2, 4, 3, 5][n % 8] % up.length : n % up.length;
                if (j >= up.length) j = 2 * up.length - 2 - j;
                hit('arp', t, up[j] + sg.ao, s16 * (sg.bst ? 0.8 : 1.8), (x % 4 === 0 ? 0.75 : 0.55) * lift);
            }
        }
        if (H > 0.82 && T.lead) { let m = tune(sg)[i % 128]; if (m) hit('lead', t, m, s16 * (sg.bst ? 1.2 : 3), 0.6); }
        if (i % 128 === 0 && H > 0.6) hit('crash', t, 60, 2, 0.5);
        if (danger && x % 8 === 0) hit('zap', t, 84, 0.12, 0.6);
        if (MU.fill > 0) { hit('snare', t, 60, 0.12, 0.4); MU.fill--; }
        if (MU.run.length) hit('arp', t, MU.run.shift(), s16 * 1.2, 0.8);
    }
    const bpm = () => { let b = (MU.sg || SONGS.classic[0]).bpm; return b[0] + (b[1] - b[0]) * MU.heat; };
    const swung = i => i % 2 ? (MU.sg.sw || 0) * 60 / bpm() / 4 : 0;
    function muTick() {
        if (!MU.on) return;
        let A = MU.A;
        if (MU.next < A.currentTime) MU.next = A.currentTime + 0.02;
        while (MU.next < A.currentTime + 0.12) { play16(MU.step, MU.next + swung(MU.step)); MU.step++; MU.next += 60 / bpm() / 4; }
        MU.out.gain.setTargetAtTime(N().musicVol * (0.6 + MU.heat * 0.4), A.currentTime, 0.4);
        MU.lp.frequency.setTargetAtTime(4200 + 13800 * MU.heat * MU.heat, A.currentTime, 0.5);
        if (Math.abs(MU.heat - MU.tweak) > 0.06) {
            MU.tweak = MU.heat;
            Object.values(MU.T).forEach(tr => { if (tr._duck) tr.mix.duck = Math.min(0.9, tr._duck * (0.8 + MU.heat * 0.5)); });
            MU.L.pr.bpm = Math.round(bpm());
            try { MU.L.R.apply(); } catch (e) {}
        }
    }
    function musicOn() {
        if (MU.on || D.noMusic || (os.prefs && os.prefs.sound === false)) return;
        if (!MU.ready || (MU.want && MU.sg !== MU.want)) { muLoad(MU.want); return; }
        try {
            let A = MU.A; if (A.state === 'suspended') A.resume();
            let t = A.currentTime;
            MU.lp.frequency.cancelScheduledValues(t); MU.lp.frequency.setValueAtTime(4200, t);
            MU.out.gain.cancelScheduledValues(t); MU.out.gain.setValueAtTime(0.0001, t); MU.out.gain.exponentialRampToValueAtTime(N().musicVol * 0.6, t + 1.2);
            MU.L.R.playing = true;
            MU.step = 0; MU.pn = 0; MU.an = 0; MU.next = t + 0.05; MU.on = true; MU.run = []; MU.fill = 0; MU.tweak = -1;
            clearInterval(MU.tm); MU.tm = setInterval(muTick, 25);
        } catch (e) {}
    }
    function musicOff(fade, melt) {
        if (!MU.on) return;
        MU.on = false; clearInterval(MU.tm);
        let A = MU.A, t = A.currentTime, f = fade || 0.05;
        try {
            if (melt) { MU.lp.frequency.cancelScheduledValues(t); MU.lp.frequency.setValueAtTime(Math.max(200, MU.lp.frequency.value), t); MU.lp.frequency.exponentialRampToValueAtTime(140, t + f); hit('kick', t + 0.02, 36, 0.8, 1); }
            MU.out.gain.cancelScheduledValues(t); MU.out.gain.setValueAtTime(Math.max(0.0001, MU.out.gain.value), t); MU.out.gain.exponentialRampToValueAtTime(0.0001, t + f);
            setTimeout(() => { if (!MU.on && MU.L) MU.L.stop(true); }, f * 1000 + 100);
        } catch (e) {}
    }
    function musicMix(danger, dt) {
        if (!MU.on || !S) return;
        let top = S.n.tubeH; for (let b of S.w.b) if (S.w.t - b.born > 0.5) top = Math.min(top, b.y - b.r);
        let h = clamp((S.n.tubeH - top) / (S.n.tubeH - laserY()), 0, 1), want = danger ? 1 : clamp(h * 0.85 + MU.kick, 0, 0.98);
        MU.heat += (want - MU.heat) * Math.min(1, dt * (want > MU.heat ? 2.5 : 0.6));
        MU.kick = Math.max(0, MU.kick - dt * 0.12);
    }
    function muFuse(t, chain) {
        if (!MU.on) return;
        MU.kick = Math.min(0.35, MU.kick + 0.015 * t + (chain > 1 ? 0.04 * chain : 0));
        if (chain >= 3 && !MU.run.length) { let c = chord()[1]; MU.run = c.concat(c.map(m => m + 12), [c[0] + 24]).map(m => m + 12); }
    }
    function bellNote(t, link) {
        let c = chord()[1], ladder = c.concat(c.map(m => m + 12), c.map(m => m + 24)), k = Math.min(ladder.length - 1, Math.floor((t - 1) * 0.8) + (link || 0));
        return hz(ladder[k] + 12);
    }
    function pix(w, h, rows, pal) {
        let c = document.createElement('canvas'); c.width = w; c.height = h; let x = c.getContext('2d');
        rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== '.') { x.fillStyle = pal[r[i]]; x.fillRect(i, j, 1, 1); } });
        return c;
    }
    let skinFor = '';
    function skin() {
        if (!root || skinFor === theme.p + theme.s) return;
        skinFor = theme.p + theme.s;
        let P0 = { k: '#07040b', b: '#1c1924', h: '#4a4558', l: '#2e2a3a', d: '#100d16', s: '#5b5f78', o: '#3a3546', w: '#6b6680' };
        let plate = pix(18, 18, [
            '.kkkkkkkkkkkkkkkk.', 'khhhhhhhhhhhhhhhhk', 'klbbbbbbbbbbbbbbbk', 'klbkkkbbbbbbkkkbdk', 'klbkskbbbbbbkosbdk', 'klbkokbbbbbbkkkbdk',
            'klbbbbbbbbbbbbbbdk', 'klbbbbbbbbbbbbbbdk', 'klbbbbbbbbbbbbbbdk', 'klbbbbbbbbbbbbbbdk', 'klbbbbbbbbbbbbbbdk', 'klbbbbbbbbbbbbbbdk',
            'klbbbbbbbbbbbbbbdk', 'klbkkbbbbbbbkkkbdk', 'klbkkbbbbbbbkswbdk', 'klbbbbbbbbbbkkkwdk', 'kddddddddddddddddk', '.kkkkkkkkkkkkkkkk.'], P0);
        const key = (B, Lt, Dk) => pix(10, 12, ['.kkkkkkkk.', 'kLLLLLLLLk', 'kLBBBBBBBk', 'kBBBBBBBBk', 'kBBBBBBBBk', 'kBBBBBBBBk', 'kBBBBBBBBk', 'kBBBBBBBBk', 'kDDDDDDDDk', 'kDDDDDDDDk', 'kDDDDDDDLk', '.kkkkkkkk.'], { k: '#07040b', B, L: Lt, D: Dk });
        let lcd = pix(8, 8, ['kkkkkkkk', 'kaaaaaak', 'kcccccck', 'kaaaaaak', 'kcccccck', 'kaaaaaak', 'kkkkkkkk', 'oooooooo'], { k: '#07040b', a: '#08060c', c: '#0d0a13', o: '#3a3546' });
        let st = root.style;
        st.setProperty('--fz-plate', 'url(' + plate.toDataURL() + ')');
        st.setProperty('--fz-key', 'url(' + key('#2a2633', '#4a4558', '#15121c').toDataURL() + ')');
        st.setProperty('--fz-keyon', 'url(' + key(theme.p, mix(theme.p, '#ffffff', 0.45), mix(theme.p, '#000000', 0.5)).toDataURL() + ')');
        st.setProperty('--fz-lcd', 'url(' + lcd.toDataURL() + ')');
    }
    const BIG = {
        C: '.#####|######|##....|##....|##....|##....|######|.#####', R: '#####.|######|##..##|######|#####.|##.##.|##..##|##..##',
        I: '######|######|..##..|..##..|..##..|..##..|######|######', T: '######|######|..##..|..##..|..##..|..##..|..##..|..##..',
        A: '.####.|######|##..##|##..##|######|######|##..##|##..##', L: '##....|##....|##....|##....|##....|##....|######|######',
        F: '######|######|##....|#####.|#####.|##....|##....|##....', U: '##..##|##..##|##..##|##..##|##..##|##..##|######|.####.',
        S: '.#####|######|##....|#####.|.#####|....##|######|#####.', E: '######|######|##....|#####.|#####.|##....|######|######'
    };
    function logo() {
        let c = document.createElement('canvas'), x = c.getContext('2d'), k = 3, word = 'FUSE', top = 'CRITICAL';
        let fw = word.length * 6 * k + (word.length - 1) * 3, W = fw + 6, H = 11 + 8 * k + 6;
        c.width = W; c.height = H;
        const put = (ch, ox, oy, sc, col) => { let g = BIG[ch]; if (!g) return; x.fillStyle = col; g.split('|').forEach((r, j) => { for (let i = 0; i < 6; i++) if (r[i] === '#') x.fillRect(ox + i * sc, oy + j * sc, sc, sc); }); };
        [...top].forEach((ch, i) => { put(ch, 2 + i * 7 + 1, 2, 1, '#07040b'); put(ch, 2 + i * 7, 1, 1, theme.s); });
        let oy = 12, bands = ['#ffffff', mix(theme.p, '#ffffff', 0.4), theme.p];
        [...word].forEach((ch, i) => {
            let ox = 2 + i * (6 * k + 3);
            put(ch, ox + 2, oy + 2, k, mix(theme.p, '#000000', 0.62));
            for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (a || b) put(ch, ox + a, oy + b, k, '#07040b');
            put(ch, ox, oy, k, bands[2]);
            x.save(); x.beginPath(); x.rect(0, 0, W, oy + 9); x.clip(); put(ch, ox, oy, k, bands[1]); x.restore();
            x.save(); x.beginPath(); x.rect(0, 0, W, oy + 4); x.clip(); put(ch, ox, oy, k, bands[0]); x.restore();
        });
        let ly = oy + 13, under = x.getImageData(0, ly + 1, W, H - ly - 1);
        x.clearRect(0, ly + 1, W, H - ly - 1); x.putImageData(under, 2, ly + 1);
        x.fillStyle = 'rgba(255,40,74,0.35)'; x.fillRect(0, ly - 1, W, 3); x.fillStyle = '#ff3a5c'; x.fillRect(0, ly, W, 1);
        return c.toDataURL();
    }
    const rankOf = n => { let a = N().rankAt, r = 0; for (let i = 0; i < a.length; i++) if (n >= a[i]) r = i; return r; };
    const rankName = r => { let p = bits((WD().ranks || [])[r] || ('rank ' + (r + 1))); return p.length > 1 ? p[0] + ' ' + p[1] : p[0]; };
    function rankPlate() {
        let a = N().rankAt, f = D.fused || 0, r = rankOf(f), lo = a[r], hi = a[r + 1], pc = hi ? Math.floor((f - lo) / (hi - lo) * 100) : 100;
        return `<div class="fz-rank"><small>${esc(L('rank', 0, 'ランク | RANK'))} ${r + 1}</small><b>${esc(rankName(r))}</b><i><u style="width:${pc}%"></u></i><em>${hi ? f.toLocaleString('en-AU') + ' / ' + hi.toLocaleString('en-AU') : esc(LE('maxed', 0, '最高ランク | maxed'))}</em></div>`;
    }
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    function show(kind) {
        let ov = root && root.querySelector('.fz-ov'); if (!ov) return;
        ov.hidden = false; ov.dataset.k = kind; root.querySelector('.fz-stage').dataset.k = kind;
        if (kind === 'menu') {
            if (S) S.state = 'menu';
            let pick = D.mode && MODES.indexOf(D.mode) >= 0 ? D.mode : 'classic', m = mode(pick);
            readTheme(1e12); skin();
            ov.innerHTML = `<div class="fz-card fz-menu"><div class="fz-title"><img class="fz-logo" src="${logo()}" alt="${esc(LE('title', 0, '臨界融合 | CRITICAL FUSE'))}"><b>${esc(LJ('title', 0, '臨界融合 | CRITICAL FUSE'))}</b></div><p class="fz-sub">${esc(LE('sub'))}</p>`
                + `<div class="fz-modes">${MODES.map(id => { let x = mode(id), b = (D.top[id] && D.top[id][0]) ? D.top[id][0].s : 0, star = (D.bestTier[id] || 0) >= 11; return `<button class="fz-mode${id === pick ? ' on' : ''}" data-m="${id}"><b>${esc(x.jp)}</b><span>${esc(x.en)}</span><em>${star ? '★ ' : ''}${b ? esc(b) : '-'}</em></button>`; }).join('')}</div>`
                + `<p class="fz-what">${esc(m.sub)}</p>`
                + rankPlate()
                + `<p class="fz-holo">${D.fused ? esc(L('fusedN', D.fused.toLocaleString('en-AU'), '融合 {n}回 | {n} fused')) + ', ' + D.seen.filter(Boolean).length + '/11' + (D.holo ? ', ' + esc(LE('holoTotal', D.holo, 'ホロハート {n}個 | {n} holo hearts')) : '') + (D.shiny ? ', ' + esc(LE('shinyTotal', D.shiny, 'キラ {n}個 | {n} shiny')) : '') : esc(L('empty', 0, 'まだ記録なし | nothing yet. drop something'))}</p>`
                + `<button class="fz-go">${esc(L('start', 0, 'スタート | START'))}</button><p class="fz-hint">${esc(touchy() ? LE('hintTouch') : LE('hint'))}</p></div>`;
            ov.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { snd('tick'); D.mode = b.dataset.m; saveD(); show('menu'); preview(); });
            ov.querySelector('.fz-go').onclick = () => go(pick);
            return;
        }
        skin();
        if (kind === 'pause') {
            ov.innerHTML = `<div class="fz-card fz-small"><div class="fz-big">${esc(L('paused', 0, '一時停止 | PAUSED'))}</div><div class="fz-row"><button class="fz-btn hot" data-a="resume">${esc(L('resume', 0, '再開 | RESUME'))}</button><button class="fz-btn" data-a="end">${esc(L('end', 0, 'やめる | END RUN'))}</button></div><p class="fz-hint">${esc(touchy() ? LE('hintTouch') : LE('hint'))}</p></div>`;
            ov.querySelector('[data-a="resume"]').onclick = () => pause(false);
            ov.querySelector('[data-a="end"]').onclick = () => { pause(false); over('line'); };
            return;
        }
        if (kind === 'done') {
            let top = D.top[S.mode] || [], bt = S.maxTier, c = bt ? charm(bt) : null, img = bt && os.spriteURL ? os.spriteURL('fuse/' + NAMES[bt - 1], bt > 8 ? 2 : 3) : '';
            ov.innerHTML = `<div class="fz-card fz-done"><div class="fz-big">${esc(L('over', 0, 'メルトダウン | MELTDOWN'))}</div>`
                + `<div class="fz-score">${esc(S.score)}</div>${S.rec ? `<div class="fz-new">${esc(L('newBest', 0, '新記録 | NEW BEST'))}</div>` : S.off > 0 ? `<div class="fz-off">${esc(L('off', S.off, 'ベストまであと {n} | {n} off your best'))}</div>` : ''}`
                + `<div class="fz-res">${img ? `<img src="${img}" alt="">` : ''}<div><small>${esc(L('bestCharm', 0, '最高到達 | best charm'))}</small><b>${c ? esc(c.jp) : '-'}</b><span>${c ? esc(c.en) : ''}</span></div></div>`
                + `<dl class="fz-stats"><div><dt>${esc(LJ('bigChain', 0, '最大連鎖 | biggest chain'))}<br>${esc(LE('bigChain', 0, '最大連鎖 | biggest chain'))}</dt><dd>${S.bestChain > 1 ? 'x' + S.bestChain : '-'}</dd></div><div><dt>${esc(LJ('holoRun', 0, 'ホロハート | holo hearts'))}<br>${esc(LE('holoRun', 0, 'ホロハート | holo hearts'))}</dt><dd>${S.holos}${S.bursts ? '<small>, ' + esc(LE('burstN', S.bursts, '{n}回バースト | {n} burst')) + '</small>' : ''}</dd></div><div><dt>${esc(LJ('shinyRun', 0, 'キラ | shiny'))}<br>${esc(LE('shinyRun', 0, 'キラ | shiny'))}</dt><dd class="${S.shinies ? 'gold' : ''}">${S.shinies}</dd></div></dl>`
                + (rankOf(D.fused) > rankOf(S.fusedAt) ? `<div class="fz-rankup">${esc(L('rankUp', 0, 'ランクアップ | RANK UP'))} → ${esc(rankName(rankOf(D.fused)))}</div>` : '')
                + (top.length ? `<ol class="fz-top">${top.map((e, i) => `<li class="${S.place === i + 1 ? 'me' : ''}"><span>${i + 1}</span><b>${esc(e.s)}</b><small>${esc(e.d || '')}</small></li>`).join('')}</ol>` : '')
                + `<div class="fz-row"><button class="fz-btn hot" data-a="again">${esc(L('retry', 0, 'もう一回 | RETRY'))}</button><button class="fz-btn" data-a="modes">${esc(L('modes', 0, 'モード | MODES'))}</button></div></div>`;
            ov.querySelector('[data-a="again"]').onclick = () => go(S.mode);
            ov.querySelector('[data-a="modes"]').onclick = () => { show('menu'); preview(); };
            return;
        }
    }
    function hide() { let ov = root && root.querySelector('.fz-ov'); if (ov) { ov.hidden = true; ov.innerHTML = ''; ov.dataset.k = ''; } let st = root && root.querySelector('.fz-stage'); if (st) st.dataset.k = 'play'; }
    function go(m) { snd('tick'); newRun(m); hide(); btns(); MU.heat = 0; MU.kick = 0; MU.want = pickSong(S.mode); D.songs = D.songs || {}; D.songs[S.mode] = ((D.songs[S.mode] || 0) + 1) % 2; saveD(); musicOff(0.2); setTimeout(musicOn, 250); }
    function preview() { let m = D.mode && MODES.indexOf(D.mode) >= 0 ? D.mode : 'classic'; newRun(m); S.state = 'menu'; S.demo = true; S.demoT = 0.5; }
    function pause(on) {
        if (!S) return;
        if (on && S.state === 'play') { S.state = 'pause'; show('pause'); musicOff(0.2); }
        else if (!on && S.state === 'pause') { S.state = 'play'; hide(); last = 0; musicOn(); }
        btns();
    }
    function mute() { D.noMusic = !D.noMusic; saveD(); btns(); if (D.noMusic) musicOff(0.1); else if (S && S.state === 'play') musicOn(); }
    function quiet() { D.noSfx = !D.noSfx; saveD(); btns(); snd('tick'); }
    function btns() {
        let p = root && root.querySelector('[data-b="pause"]'), m = root && root.querySelector('[data-b="mute"]'), q = root && root.querySelector('[data-b="sfx"]');
        if (p) { p.textContent = S && S.state === 'pause' ? '▶' : 'Ⅱ'; p.hidden = !S || (S.state !== 'play' && S.state !== 'pause'); }
        let sh = root && root.querySelector('[data-b="shake"]');
        if (sh) { sh.hidden = !S || S.state !== 'play'; sh.disabled = !S || S.shakes < 1; sh.title = LE('shake', 0, 'ゆらす | SHAKE'); sh.textContent = LJ('shake', 0, 'ゆらす | SHAKE'); }
        if (m) { m.classList.toggle('off', !!D.noMusic); m.title = D.noMusic ? L('musicOn', 0, 'BGMオン | music on') : L('musicOff', 0, 'BGMオフ | music off'); }
        if (q) { q.classList.toggle('off', !!D.noSfx); q.title = D.noSfx ? L('sfxOn', 0, '効果音オン | sound effects on') : L('sfxOff', 0, '効果音オフ | sound effects off'); }
    }
    const touchy = () => matchMedia('(any-pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches;

    function aimAt(e) {
        if (!S || !LY) return;
        let r = cv.getBoundingClientRect(), bxp = (e.clientX - r.left) / r.width * LY.BW;
        S.aim = (bxp - LY.TX) * U;
    }
    function onHatch(e) {
        let r = cv.getBoundingClientRect(), bxp = (e.clientX - r.left) / r.width * LY.BW, byp = (e.clientY - r.top) / r.height * LY.BH;
        let hx = LY.tall ? LY.TX - LY.wall + 13 : LY.PX + 26, hy = LY.tall ? LY.o + 19 : LY.PY + 28;
        return Math.hypot(bxp - hx, byp - hy) < 17;
    }
    function onKey(e) {
        if (!S || asleep || !root || !root.closest('.is-active')) return;
        if (/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
        let k = e.key, down = e.type === 'keydown';
        if (k === 'ArrowLeft' || k === 'a' || k === 'A') { keys.l = down; e.preventDefault(); return; }
        if (k === 'ArrowRight' || k === 'd' || k === 'D') { keys.r = down; e.preventDefault(); return; }
        if (!down) return;
        if ((k === ' ' || k === 'ArrowDown') && S.state === 'play') { e.preventDefault(); drop(); }
        else if ((k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'x' || k === 'X') && S.state === 'play') { e.preventDefault(); shake(); }
        else if ((k === 'c' || k === 'C' || k === 'Shift') && S.state === 'play') swap();
        else if (k === 'p' || k === 'P') pause(S.state === 'play');
        else if (k === 'm' || k === 'M') mute();
        else if (k === 'n' || k === 'N') quiet();
        else if ((k === 'r' || k === 'R') && S.state === 'done') go(S.mode);
        else if (k === 'Enter' && S.state === 'menu') { e.preventDefault(); go(D.mode || 'classic'); }
        else if ((k === 'ArrowUp' || k === 'ArrowDown' || k === 'w' || k === 'W') && S.state === 'menu') { e.preventDefault(); let i = MODES.indexOf(D.mode); D.mode = MODES[(i + (k === 'ArrowUp' ? -1 : 1) + MODES.length) % MODES.length]; saveD(); snd('tick'); show('menu'); preview(); }
    }

    function styles() {
        let st = document.createElement('style');
        st.textContent = `
            .gg-game[data-game="fuse"] { padding: 0; }
            .fz { position: relative; height: 100%; }
            .fz-stage { position: absolute; inset: 0; display: grid; place-items: center; overflow: hidden; touch-action: none; -webkit-user-select: none; user-select: none; }
            .fz-cv { display: block; image-rendering: pixelated; }
            .fz-ov { position: absolute; inset: 0; display: grid; place-items: center; z-index: 3; background: rgba(4, 2, 8, 0.6); }
            .fz-ov[hidden] { display: none; }
            .fz-ov[data-k="menu"] { background: linear-gradient(90deg, rgba(4,2,8,0.9) 0 44%, rgba(4,2,8,0.3)); justify-items: start; padding-left: 5%; }
            .fz-box { position: relative; }
            .fz-card, .fz-mode b, .fz-mode em, .fz-what, .fz-go, .fz-score, .fz-stats > div, .fz-top, .fz-btn, .fz-keys button { image-rendering: pixelated; }
            .fz-card { position: relative; font-family: 'DotGothic16', monospace; color: #cfcbd6; max-height: calc(100% - 20px); overflow: auto; scrollbar-width: none; box-sizing: border-box; padding: 4px 8px 2px;
                border: 12px solid transparent; border-image: var(--fz-plate) 6 fill / 12px stretch; filter: drop-shadow(5px 5px 0 rgba(0,0,0,0.55)); }
            .fz-menu { width: min(330px, 92%); }
            .fz-title { display: flex; align-items: center; gap: 10px; margin: 2px 0 0; }
            .fz-logo { width: auto; height: 80px; image-rendering: pixelated; }
            .fz-title b { font-weight: normal; font-size: 20px; line-height: 1.15; color: #fff; text-shadow: 2px 2px 0 #07040b; writing-mode: vertical-rl; letter-spacing: 3px; }
            .fz-sub { margin: 8px 0 10px; font-size: 11px; line-height: 1.5; color: #8f8b9a; }
            .fz-modes { display: flex; flex-direction: column; gap: 4px; }
            .fz-mode { display: grid; grid-template-columns: 58px 1fr auto; align-items: center; gap: 8px; padding: 0; background: none; border: 0; color: #a9a3b8; font: inherit; font-size: 12px; letter-spacing: 2px; text-align: left; cursor: inherit; }
            .fz-mode b { display: grid; place-items: center; height: 16px; font-weight: normal; font-size: 14px; line-height: 14px; letter-spacing: 0; white-space: nowrap; color: #cfcbd6; border: 8px solid transparent; border-image: var(--fz-key) 4 fill / 8px stretch; }
            .fz-mode em { min-width: 44px; padding: 0 2px; font-style: normal; font-size: 12px; letter-spacing: 1px; text-align: right; color: #6f6a7c; border: 6px solid transparent; border-image: var(--fz-lcd) 3 fill / 6px repeat; font-variant-numeric: tabular-nums; }
            .fz-mode:hover { color: #fff; }
            .fz-mode.on { color: #fff; }
            .fz-mode.on b { color: #07040b; border-image-source: var(--fz-keyon); transform: translateY(2px); }
            .fz-mode.on em { color: #ffe27a; }
            .fz-what { min-height: 3.2em; margin: 10px 0 6px; padding: 1px 3px; font-size: 11px; line-height: 1.5; color: var(--neon-secondary); border: 6px solid transparent; border-image: var(--fz-lcd) 3 fill / 6px repeat; }
            .fz-holo { margin: 0 0 10px; font-size: 10px; color: #6f6a7c; }
            .fz-rank { display: grid; grid-template-columns: auto 1fr; align-items: baseline; gap: 2px 8px; margin: 0 0 6px; }
            .fz-rank small { font-size: 10px; color: #6f6a7c; } .fz-rank b { font-weight: normal; font-size: 13px; color: #fff; }
            .fz-rank i { grid-column: 1 / -1; display: block; height: 4px; background: #08060c; border: 1px solid #07040b; } .fz-rank u { display: block; height: 100%; background: repeating-linear-gradient(90deg, var(--neon-secondary) 0 3px, transparent 3px 4px); }
            .fz-rank em { grid-column: 1 / -1; font-style: normal; font-size: 9px; color: #5b5670; text-align: right; }
            .fz-stats dd.gold { color: #ffd04a; }
            .fz-rankup { margin-top: 8px; font-size: 12px; color: var(--neon-secondary); }
            .fz-go { display: block; width: 100%; padding: 1px 0 3px; border: 8px solid transparent; border-image: var(--fz-keyon) 4 fill / 8px stretch; background: none; color: #07040b; font: inherit; font-size: 15px; letter-spacing: 3px; cursor: inherit; }
            .fz-go:active { transform: translateY(2px); }
            .fz-hint { margin: 8px 0 0; font-size: 10px; line-height: 1.5; color: #5b5670; }
            .fz-small, .fz-done { text-align: center; }
            .fz-small { max-width: min(360px, 92%); }
            .fz-row .fz-btn { white-space: nowrap; letter-spacing: 0; }
            .fz-done { width: min(330px, 92%); }
            .fz-big { font-size: 14px; letter-spacing: 3px; color: #ff5a6a; text-shadow: 2px 2px 0 #07040b; }
            .fz-score { margin: 8px 0 0; padding: 0 4px; font-size: 40px; line-height: 1.05; color: #ffe27a; text-align: right; border: 6px solid transparent; border-image: var(--fz-lcd) 3 fill / 6px repeat; font-variant-numeric: tabular-nums; }
            .fz-new { display: inline-block; margin-top: 8px; padding: 1px 8px; font-size: 12px; color: #07040b; background: #ffd04a; transform: rotate(-3deg); box-shadow: 2px 2px 0 #07040b; }
            .fz-off { margin-top: 7px; font-size: 11px; color: var(--neon-secondary); }
            .fz-res { display: flex; align-items: center; justify-content: center; gap: 14px; margin: 10px 0 6px; text-align: left; }
            .fz-res img { image-rendering: pixelated; flex: none; max-width: 110px; }
            .fz-res small { display: block; font-size: 10px; color: #6f6a7c; margin-bottom: 3px; white-space: nowrap; }
            .fz-res b { display: block; font-weight: normal; font-size: 19px; color: #fff; white-space: nowrap; } .fz-res span { font-size: 11px; letter-spacing: 2px; color: var(--neon-secondary); }
            .fz-stats { display: flex; gap: 4px; margin: 0; }
            .fz-stats > div { flex: 1; padding: 0 2px; border: 6px solid transparent; border-image: var(--fz-lcd) 3 fill / 6px repeat; }
            .fz-stats dt { font-size: 10px; line-height: 1.3; color: #6f6a7c; } .fz-stats dd { margin: 3px 0 0; font-size: 17px; color: #fff; } .fz-stats dd small { font-size: 10px; color: var(--neon-secondary); }
            .fz-top { list-style: none; margin: 6px 0 0; padding: 0; font-size: 11px; text-align: left; max-height: 112px; overflow: auto; scrollbar-width: none; border: 6px solid transparent; border-image: var(--fz-lcd) 3 fill / 6px repeat; }
            .fz-top li { display: grid; grid-template-columns: 22px 1fr auto; gap: 6px; padding: 1px 4px; } .fz-top li span { color: #5b5670; } .fz-top li small { color: #5b5670; }
            .fz-top li.me { color: #ffe27a; background: rgba(255,226,122,0.08); }
            .fz-row { display: flex; gap: 8px; justify-content: center; margin-top: 10px; }
            .fz-btn { padding: 0 6px 2px; border: 8px solid transparent; border-image: var(--fz-key) 4 fill / 8px stretch; background: none; color: #cfcbd6; font: inherit; font-size: 12px; letter-spacing: 1px; cursor: inherit; }
            .fz-btn:active { transform: translateY(2px); }
            .fz-btn.hot { border-image-source: var(--fz-keyon); color: #07040b; }
            .fz-keys { position: absolute; right: 2.2%; top: 1px; z-index: 2; display: flex; gap: 3px; }
            .fz-keys button { min-width: 22px; height: 22px; padding: 0 1px 2px; border: 6px solid transparent; border-image: var(--fz-key) 4 fill / 6px stretch; background: none; color: #cfcbd6; font: 11px/1 'DotGothic16', monospace; cursor: inherit; }
            .fz-keys button:active { transform: translateY(1px); }
            .fz-keys button:disabled { opacity: 0.4; }
            .fz-keys button[hidden] { display: none; }
            .fz-keys [data-b="shake"] { color: var(--neon-secondary); }
            .fz-keys button.off { position: relative; color: #8f899f; }
            .fz-keys button.off::after { content: ''; position: absolute; left: -2px; right: -2px; top: 50%; height: 2px; margin-top: -2px; background: rgba(255, 90, 106, 0.85); transform: rotate(-35deg); }
            .fz-stage[data-k="menu"] .fz-keys, .fz-stage[data-k="done"] .fz-keys { display: none; }
            .short .fz-logo { height: 52px; } .short .fz-sub { display: none; } .short .fz-what { min-height: 0; margin: 6px 0 4px; } .short .fz-holo { margin-bottom: 4px; } .short .fz-hint { margin-top: 3px; }
            @media (pointer: coarse) { .fz-keys { gap: 6px; } .fz-keys button { min-width: 38px; height: 38px; font-size: 16px; } .fz-mode b { height: 22px; } .fz-modes { gap: 6px; } .fz-btn { padding: 4px 10px 6px; } }
            @media (max-width: 760px) { .fz-ov[data-k="menu"] { justify-items: center; padding-left: 0; background: rgba(4,2,8,0.82); } .fz-title b { font-size: 28px; } .fz-keys { top: 34%; right: 2px; flex-direction: column; } .fz-logo { height: 64px; } }
        `;
        document.head.appendChild(st);
        return st;
    }

    function init() {
        cv = root.querySelector('.fz-cv');
        sc = document.createElement('canvas');
        if (glSetup()) sx = sc.getContext('2d');
        else { gl = null; sc = cv; sx = cv.getContext('2d'); }
        buf = document.createElement('canvas'); bx = buf.getContext('2d');
        tmp = document.createElement('canvas'); tx = tmp.getContext('2d');
        lay = document.createElement('canvas'); lx = lay.getContext('2d');
        loadD();
        preview(); show('menu'); btns();
        setTimeout(muLoad, 300);
        let st = root.querySelector('.fz-stage');
        ro = new ResizeObserver(() => { if (S) layout(); }); ro.observe(st);
        cv.addEventListener('pointerdown', e => {
            if (!S || S.state !== 'play') return;
            e.preventDefault();
            if (e.button === 2) { swap(); return; }
            if (e.button > 0) return;
            if (onHatch(e)) { swap(); return; }
            aiming = true; aimAt(e); try { cv.setPointerCapture(e.pointerId); } catch (er) {} });
        cv.addEventListener('pointermove', e => { if (!S || S.state !== 'play') return; if (e.pointerType === 'mouse' || e.pointerType === 'pen' || aiming) aimAt(e); });
        let up = e => { if (!aiming) return; aiming = false; if (e.type === 'pointerup' && S && S.state === 'play') { aimAt(e); drop(); } };
        cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
        cv.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); });
        root.querySelector('[data-b="pause"]').onclick = () => pause(S && S.state === 'play');
        root.querySelector('[data-b="mute"]').onclick = mute;
        root.querySelector('[data-b="sfx"]').onclick = quiet;
        root.querySelector('[data-b="shake"]').onclick = shake;
        document.addEventListener('keydown', onKey); document.addEventListener('keyup', onKey);
        last = 0; raf = requestAnimationFrame(frame);
    }
    function stopAll() { cancelAnimationFrame(raf); raf = 0; }

    os.gg = os.gg || {}; os.gg.hooks = os.gg.hooks || {};
    os.gg.hooks.fuse = {
        start(el) {
            root = el; asleep = false; keys = {};
            style = styles();
            el.innerHTML = '<div class="fz"><div class="fz-stage" data-k="menu"><div class="fz-box"><canvas class="fz-cv"></canvas><div class="fz-keys"><button data-b="shake" aria-label="shake">揺</button><button data-b="pause" aria-label="pause">Ⅱ</button><button data-b="mute" aria-label="music">♪</button><button data-b="sfx" aria-label="sound effects">SE</button></div></div><div class="fz-ov" hidden></div></div></div>';
            init();
        },
        pause() { asleep = true; keys = {}; if (S && S.state === 'play') pause(true); musicOff(0.1); stopAll(); },
        resume() { if (!asleep) return; asleep = false; last = 0; stopAll(); raf = requestAnimationFrame(frame); },
        best() { loadD(); return Math.max(0, ...MODES.map(m => (D.top[m] && D.top[m][0] && D.top[m][0].s) || 0)); },
        scores() { loadD(); return MODES.map(id => { let m = mode(id); return { t: m.jp + ' ' + m.en + ((D.bestTier[id] || 0) >= 11 ? ' ★' : ''), rows: (D.top[id] || []).map((e, i) => [i + 1, e.s, e.d || '']) }; }).filter(b => b.rows.length); },
        stop() {
            stopAll(); musicOff(0.1);
            document.removeEventListener('keydown', onKey); document.removeEventListener('keyup', onKey);
            if (ro) ro.disconnect();
            if (gl) { let lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext(); }
            if (style) style.remove();
            if (root) root.innerHTML = '';
            for (let k in rotC) delete rotC[k];
            for (let k in colC) delete colC[k];
            S = null; cv = null; cx = null; sc = null; sx = null; buf = null; bx = null; tmp = null; tx = null; lay = null; lx = null; gl = null; root = null; style = null; ro = null; LY = null;
            delete os.fuse; delete os.gg.hooks.fuse;
        }
    };
    // Test hooks
    os.fuse = { world, DEF, NAMES, MU, muTick, musicOn,
        hear: async (plan, sr, id) => {
            await os.need(['noisebox_fx.js', 'noisebox_sound.js']);
            let sg = Object.values(SONGS).flat().find(q => q.id === id) || SONGS.classic[0];
            sr = sr || 22050; let secs = plan.reduce((a, p) => a + p[1], 0) + 1.5, A = new OfflineAudioContext(2, Math.ceil(sr * secs), sr), keep = [MU.L, MU.T, MU.heat, MU.step, MU.sg, MU.pn, MU.an];
            MU.sg = sg; let r = await band(A, sg), lp = A.createBiquadFilter(), g = A.createGain();
            r.L.R.M.out.disconnect(); r.L.R.M.out.connect(lp); lp.connect(g); g.connect(A.destination);
            MU.L = r.L; MU.T = r.T; r.L.R.playing = true; MU.pn = MU.an = 0;
            let t = 0.05, step = 0;
            for (const [heat, dur] of plan) {
                MU.heat = heat; lp.frequency.setValueAtTime(4200 + 13800 * heat * heat, t); g.gain.setValueAtTime(N().musicVol * (0.6 + heat * 0.4), t);
                let end = t + dur; while (t < end) { MU.step = step; play16(step, t + swung(step)); step++; t += 60 / bpm() / 4; }
            }
            [MU.L, MU.T, MU.heat, MU.step, MU.sg, MU.pn, MU.an] = keep;
            return A.startRendering();
        },
        SONGS,
        raw: () => S, data: () => D, lay: () => LY, ff: n => { for (let i = 0; i < n; i++) { tick(1 / 60); drawScene(performance.now()); } }, drop, shake, swap, aim: x => { if (S) S.aim = x; }, go, over, show, add: (t, x, y) => S && S.w.add(t, x, y), tick: n => { for (let i = 0; i < (n || 1); i++) tick(1 / 60); }, bench: n => { let t0 = performance.now(); for (let i = 0; i < n; i++) { tick(1 / 60); drawScene(t0 + i * 16); sx.drawImage(buf, 0, 0, sc.width, sc.height); words(t0); } return (performance.now() - t0) / n; } };
})();
