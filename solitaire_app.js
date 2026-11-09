window.os = window.os || {};

(function () {
    const KEY = 'vmp_solitaire';
    const DEF = {
        toFound: 10, wasteToTab: 5, flipUp: 5, foundBack: -15, recycleOne: -100, recycleThree: -20,
        timeEvery: 10, timeCost: 2, winBonus: 700000, dealGap: 0.045, autoGap: 0.08, glitchMin: 1.6, glitchMax: 6
    };
    const MODES = ['one', 'three'];
    const SUITS = ['h', 'd', 's', 'c'];
    const RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const HOT = { c: '#ff3b6b', o: '#6e0f2c', g: '#ff8aa6' }, COLD = { c: '#3fd8ff', o: '#0c4c66', g: '#a8f0ff' };
    const CW = 36, CH = 50, GAP = 6;
    const N = () => Object.assign({}, DEF, (typeof appsDB !== 'undefined' && appsDB.solitaire) || {});
    const WD = () => (window.gamesDB && window.gamesDB.solitaire) || {};
    const bits = (s, n) => String(s == null ? '' : s).split('|').map(x => x.trim().replace(/\{n\}/g, n));
    const L = (k, n, d) => { let p = bits((WD().lines || {})[k] || d || k, n); return p.length > 1 ? p[0] + ' // ' + p[1] : p[0]; };
    const LE = (k, n, d) => { let p = bits((WD().lines || {})[k] || d || k, n); return p[p.length > 1 ? 1 : 0]; };
    const LJ = (k, n, d) => bits((WD().lines || {})[k] || d || k, n)[0];
    const mode = id => { let p = bits((WD().modes || {})[id] || id); return { id, jp: p[0], en: p[1] || p[0], sub: p[2] || '' }; };
    const calm = () => document.documentElement.classList.contains('reduce-motion');
    const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
    const red = c => c.s < 2;
    const ink = c => red(c) ? HOT : COLD;
    const last = a => a[a.length - 1];
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const clock = s => { s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

    const blank = () => ({ played: 0, won: 0, bestT: 0, bestM: 0, top: [], streak: 0, bestStreak: 0 });
    const fresh = () => ({ m: { one: blank(), three: blank() }, mode: 'one', muted: false });
    let D = fresh();
    function loadD() {
        try { let d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d) D = Object.assign(fresh(), d); } catch (e) {}
        MODES.forEach(m => { D.m[m] = Object.assign(blank(), D.m[m] || {}); });
        if (MODES.indexOf(D.mode) < 0) D.mode = 'one';
    }
    function saveD() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} }

    let root = null, style = null, cv = null, sx = null, buf = null, bx = null, trl = null, tl = null, ro = null;
    let S = null, LY = null, raf = 0, lastT = 0, asleep = false, theme = { p: '#ff2d6f', s: '#2de0ff' }, themeAt = 0;
    let face = {}, backC = null, backFor = '', bgC = null, bgFor = '', tmp = null, tx = null;

    function readTheme(now) {
        if (now - themeAt < 500) return; themeAt = now;
        let cs = getComputedStyle(root || document.documentElement);
        theme = { p: cs.getPropertyValue('--neon-primary').trim() || theme.p, s: cs.getPropertyValue('--neon-secondary').trim() || theme.s };
    }
    function rgba(hex, a) { let n = parseInt(String(hex).replace('#', '').slice(0, 6), 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
    function mix(h1, h2, t) { let a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16); let c = [16, 8, 0].map(s => Math.round((a >> s & 255) * (1 - t) + (b >> s & 255) * t)); return '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''); }
    function rng(seed) { let h = seed >>> 0; return () => { h = (h + 0x6D2B79F5) >>> 0; let t = Math.imul(h ^ h >>> 15, 1 | h); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    const spr = (k, pal) => os.sprite ? os.sprite('cards/' + k, pal) : null;

    // faces get drawn once. the J Q K letters + ace rings go on every frame or they cant glitch
    function shape(x, y) {
        if (x < 0 || y < 0 || x >= CW || y >= CH) return false;
        if (x + y < 3 || (CW - 1 - x) + (CH - 1 - y) < 3) return false;
        if ((CW - 1 - x) + y < 1 || x + (CH - 1 - y) < 1) return false;
        return true;
    }
    function body(rim, glow) {
        let c = document.createElement('canvas'); c.width = CW; c.height = CH;
        let x = c.getContext('2d'), img = x.createImageData(CW, CH), R = parseInt(rim.slice(1), 16);
        for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) {
            if (!shape(i, j)) continue;
            let o = (j * CW + i) * 4, edge = !shape(i - 1, j) || !shape(i + 1, j) || !shape(i, j - 1) || !shape(i, j + 1);
            let v = j < 2 ? 30 : j > CH - 3 ? 12 : 20 - j * 0.12, col;
            if (edge) { let a = glow; col = [(R >> 16 & 255) * a + 12 * (1 - a), (R >> 8 & 255) * a + 10 * (1 - a), (R & 255) * a + 18 * (1 - a)]; }
            else col = [v * 0.85, v * 0.75, v * 1.15];
            if (!edge && j % 2 === 0) col = col.map(q => q * 0.9);
            img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
        }
        x.putImageData(img, 0, 0);
        return c;
    }
    function glyph(x, k, pal, gx, gy, flip) {
        let s = spr(k, pal); if (!s) return;
        let h = spr(k, { c: pal.o, w: pal.o, o: pal.o });
        x.save();
        if (flip) { x.translate(gx * 2 + s.width, gy * 2 + s.height); x.scale(-1, -1); }
        x.globalAlpha = 0.55;
        [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([a, b]) => x.drawImage(h, gx + a, gy + b));
        x.globalAlpha = 1; x.drawImage(s, gx, gy);
        x.restore();
    }
    const SPOTS = {
        2: [[1, 0], [1, 6]], 3: [[1, 0], [1, 3], [1, 6]], 4: [[0, 0], [2, 0], [0, 6], [2, 6]],
        5: [[0, 0], [2, 0], [1, 3], [0, 6], [2, 6]], 6: [[0, 0], [2, 0], [0, 3], [2, 3], [0, 6], [2, 6]],
        7: [[0, 0], [2, 0], [1, 1.5], [0, 3], [2, 3], [0, 6], [2, 6]], 8: [[0, 0], [2, 0], [1, 1.5], [0, 3], [2, 3], [1, 4.5], [0, 6], [2, 6]],
        9: [[0, 0], [2, 0], [0, 2], [2, 2], [1, 3], [0, 4], [2, 4], [0, 6], [2, 6]], 10: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2], [0, 4], [2, 4], [1, 5], [0, 6], [2, 6]]
    };
    function drawFace(c) {
        let pal = ink(c), cnv = body(pal.c, c.r > 10 ? 0.85 : 0.6), x = cnv.getContext('2d'), su = SUITS[c.s], rk = RANKS[c.r];
        x.imageSmoothingEnabled = false;
        if (c.r > 10) {
            x.fillStyle = rgba(pal.c, 0.28);
            for (let i = 4; i < CW - 4; i += 2) { x.fillRect(i, 3, 1, 1); x.fillRect(i, CH - 4, 1, 1); }
            for (let j = 4; j < CH - 4; j += 2) { x.fillRect(3, j, 1, 1); x.fillRect(CW - 4, j, 1, 1); }
        }
        let rw = rk === '10' ? 7 : 5;
        glyph(x, 'r' + rk, pal, 3, 3); glyph(x, 'mini_' + su, pal, 3, 12);
        glyph(x, 'r' + rk, pal, CW - 3 - rw, CH - 10, true); glyph(x, 'mini_' + su, pal, CW - 8, CH - 17, true);
        if (c.r === 1) {
            x.fillStyle = rgba(pal.c, 0.35);
            x.fillRect(17, 10, 1, 3); x.fillRect(18, 37, 1, 3); x.fillRect(3, 25, 3, 1); x.fillRect(30, 24, 3, 1);
            glyph(x, 'ace_' + su, pal, 12, 19);
        } else if (c.r <= 10) {
            let cols = [10, 15, 20], top = 6, step = (CH - 13 - top) / 6;
            SPOTS[c.r].forEach(([col, row]) => glyph(x, 'pip_' + su, pal, cols[col] - (col === 1 ? 0 : 0), Math.round(top + row * step), row > 3));
        }
        return cnv;
    }
    function faceOf(c) { return face[c.id] || (face[c.id] = drawFace(c)); }
    // mirrored so the back looks the same upside down
    let TR = null;
    function traces() {
        if (TR) return TR;
        const line = pts => { let out = []; for (let k = 0; k < pts.length - 1; k++) { let [x0, y0] = pts[k], [x1, y1] = pts[k + 1]; let n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i < n; i++) out.push([x0 + Math.sign(x1 - x0) * i, y0 + Math.sign(y1 - y0) * i]); } out.push(pts[pts.length - 1]); return out; };
        let base = [
            [[13, 19], [13, 13], [8, 13], [8, 7]], [[17, 19], [17, 7]], [[21, 19], [21, 13], [26, 13], [26, 7]],
            [[11, 22], [6, 22], [6, 17]], [[11, 27], [6, 27], [6, 33]]
        ];
        TR = [];
        base.forEach(b => { TR.push(line(b)); TR.push(line(b.map(([x, y]) => [34 - x, y]))); TR.push(line(b.map(([x, y]) => [x, 49 - y]))); TR.push(line(b.map(([x, y]) => [34 - x, 49 - y]))); });
        let seen = {}; TR = TR.filter(t => { let k = t.join(); if (seen[k]) return false; seen[k] = 1; return true; });
        return TR;
    }
    function back() {
        if (backC && backFor === theme.p + theme.s) return backC;
        backFor = theme.p + theme.s;
        let c = body(theme.p, 0.85), x = c.getContext('2d');
        x.fillStyle = '#0b0911'; x.fillRect(3, 3, CW - 6, CH - 6);
        x.fillStyle = rgba(theme.p, 0.07);
        for (let j = 3; j < CH - 3; j++) for (let i = 3; i < CW - 3; i++) if ((i + j) % 6 === 0 || (i - j + 60) % 6 === 0) x.fillRect(i, j, 1, 1);
        x.fillStyle = rgba(theme.p, 0.4);
        for (let i = 4; i < CW - 4; i += 2) { x.fillRect(i, 3, 1, 1); x.fillRect(i, CH - 4, 1, 1); }
        for (let j = 4; j < CH - 4; j += 2) { x.fillRect(3, j, 1, 1); x.fillRect(CW - 4, j, 1, 1); }
        traces().forEach(t => { x.fillStyle = rgba(theme.p, 0.45); t.forEach(([a, b]) => x.fillRect(a, b, 1, 1)); let [ea, eb] = t[t.length - 1]; x.fillStyle = rgba(theme.p, 0.9); x.fillRect(ea - 1, eb - 1, 3, 3); x.fillStyle = '#0b0911'; x.fillRect(ea, eb, 1, 1); });
        let chip = spr('chip', { c: theme.s, o: mix(theme.p, '#000000', 0.45), a: '#07050b' });
        if (chip) x.drawImage(chip, 12, 19);
        x.fillStyle = 'rgba(0,0,0,0.16)'; for (let j = 4; j < CH - 4; j += 2) x.fillRect(4, j, CW - 8, 1);
        backC = c; return c;
    }
    function pulses(x, c, now) {
        if (calm()) return;
        let T = traces(), ph = c.id * 0.37;
        for (let k = 0; k < 3; k++) {
            let t = T[(c.id * 7 + k * 5) % T.length], sp = 16 + (c.id % 5) * 3, pos = ((now + ph + k * 1.7) * sp) % (t.length + 30);
            if (pos >= t.length) continue;
            let i = Math.floor(pos), [a, b] = t[i];
            x.fillStyle = mix(theme.p, '#ffffff', 0.7); x.fillRect(a, b, 1, 1);
            if (i > 0) { let [a2, b2] = t[i - 1]; x.fillStyle = rgba(theme.p, 0.9); x.fillRect(a2, b2, 1, 1); }
        }
    }
    function ring(x, c, now) {
        let pal = ink(c), rot = calm() ? 0 : now * 0.5;
        for (let a = 0; a < 44; a++) {
            let t = a / 44 * Math.PI * 2 + rot, on = (a % 11) < 8;
            if (!on) continue;
            x.fillStyle = rgba(pal.c, a % 11 === 7 ? 0.8 : 0.32);
            x.fillRect(Math.round(17.5 + Math.cos(t) * 11.5), Math.round(24.5 + Math.sin(t) * 11.5), 1, 1);
        }
    }
    function letter(x, c, now) {
        let pal = ink(c), k = 'big_' + RANKS[c.r], g = spr(k, { c: pal.c, w: pal.g, o: pal.o }); if (!g) return;
        let gx = Math.round((CW - g.width) / 2), gy = Math.round((CH - g.height) / 2), hot = now < c.gUntil, wob = calm() ? 0 : hot ? 2 : 1;
        if (!calm() && now > c.gNext) { c.gUntil = now + 0.12 + Math.random() * 0.25; c.gNext = now + N().glitchMin + Math.random() * (N().glitchMax - N().glitchMin); c.gSeed = Math.random(); }
        let rr = spr(k, { c: '#ff2a55', w: '#ff2a55', o: '#ff2a55' }), bb = spr(k, { c: '#2ad8ff', w: '#2ad8ff', o: '#2ad8ff' });
        let jit = hot ? Math.round((Math.random() - 0.5) * 3) : 0;
        x.globalAlpha = hot ? 0.75 : 0.4;
        x.drawImage(rr, gx - wob + jit, gy); x.drawImage(bb, gx + wob + jit, gy + (hot && Math.random() < 0.3 ? 1 : 0));
        x.globalAlpha = 1;
        if (!hot) { x.drawImage(g, gx, gy); return; }
        let rnd = rng(Math.floor(c.gSeed * 1e6) + Math.floor(now * 30));
        for (let y = 0; y < g.height;) {
            let h = 1 + Math.floor(rnd() * 4), dx = rnd() < 0.45 ? Math.round((rnd() - 0.5) * 6) : 0;
            x.drawImage(g, 0, y, g.width, h, gx + dx, gy + y, g.width, h);
            y += h;
        }
        if (rnd() < 0.5) { x.fillStyle = rgba(pal.g, 0.5); x.fillRect(gx - 2, gy + Math.floor(rnd() * g.height), g.width + 4, 1); }
    }

    function layout() {
        let st = root && root.querySelector('.sl-stage'); if (!st) return;
        let cw = st.clientWidth || 640, ch = st.clientHeight || 420, tall = cw / ch < 1.05, TW = 7 * CW + 6 * GAP, BW, BH, TX, TY, PX, PY, PW, PH;
        if (tall) { BW = TW + 16; PH = 40; BH = clamp(Math.round(BW * ch / cw), 330, 600); TX = 8; PX = 6; PY = 6; PW = BW - 12; TY = PY + PH + 8; }
        else { PW = 94; BW = PW + TW + 34; BH = clamp(Math.round(BW * ch / cw), 236, 320); PX = 8; PY = 8; PH = BH - 16; TX = PX + PW + 14; TY = 10; }
        let dpr = Math.min(3, window.devicePixelRatio || 1), sc1 = Math.min(cw / BW, ch / BH), k = Math.max(1, Math.ceil(sc1 * dpr));
        LY = { tall, BW, BH, TX, TY, TY2: TY + CH + 9, PX, PY, PW, PH, k, scale: sc1 };
        buf.width = BW; buf.height = BH; trl.width = BW; trl.height = BH;
        if (cv.width !== BW * k || cv.height !== BH * k) { cv.width = BW * k; cv.height = BH * k; }
        cv.style.width = Math.round(BW * sc1) + 'px'; cv.style.height = Math.round(BH * sc1) + 'px';
        let keysEl = root.querySelector('.sl-keys');
        if (keysEl) {
            keysEl.classList.toggle('tall', tall);
            if (tall) { keysEl.style.left = ''; keysEl.style.top = ''; keysEl.style.width = ''; }
            else { keysEl.style.left = Math.round((PX + 6) * sc1) + 'px'; keysEl.style.top = Math.round((PY + 148) * sc1) + 'px'; keysEl.style.width = Math.round((PW - 12) * sc1) + 'px'; }
        }
        bgFor = '';
    }
    const colX = i => LY.TX + i * (CW + GAP);
    function table() {
        let id = theme.p + LY.BW + 'x' + LY.BH;
        if (bgC && bgFor === id) return bgC;
        bgFor = id;
        let c = document.createElement('canvas'); c.width = LY.BW; c.height = LY.BH; let x = c.getContext('2d'), r = rng(707);
        x.fillStyle = '#09070e'; x.fillRect(0, 0, c.width, c.height);
        x.fillStyle = '#120f19';
        for (let j = 3; j < c.height; j += 6) for (let i = 3; i < c.width; i += 6) x.fillRect(i, j, 1, 1);
        for (let n = 0; n < 26; n++) {
            let px_ = Math.floor(r() * c.width), py_ = Math.floor(r() * c.height), len = 10 + Math.floor(r() * 50), hz = r() < 0.5;
            x.fillStyle = r() < 0.15 ? rgba(theme.p, 0.08) : '#14111c';
            for (let k = 0; k < len; k++) { x.fillRect(px_, py_, 1, 1); if (hz) px_++; else py_++; if (r() < 0.06) { hz = !hz; } }
            x.fillRect(px_ - 1, py_ - 1, 3, 3); x.fillStyle = '#09070e'; x.fillRect(px_, py_, 1, 1);
        }
        let g = x.createRadialGradient(c.width / 2, c.height / 2, c.height * 0.3, c.width / 2, c.height / 2, c.width * 0.75);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)'); x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
        bgC = c; return c;
    }
    function px(x, y, w, h, c) { bx.fillStyle = c; bx.fillRect(x | 0, y | 0, w, h); }
    function plate(x, y, w, h) {
        px(x, y, w, h, '#07040b'); px(x + 1, y + 1, w - 2, h - 2, '#1c1924');
        px(x + 1, y + 1, w - 2, 1, '#4a4558'); px(x + 1, y + 2, 1, h - 3, '#2e2a3a');
        px(x + 1, y + h - 2, w - 2, 1, '#100d16'); px(x + w - 2, y + 2, 1, h - 3, '#100d16');
        px(x + w - 15, y + h - 4, 6, 1, '#2e2a3a'); px(x + 2, y + Math.round(h * 0.45), 1, 4, '#3a3546');
        [[x + 3, y + 3], [x + w - 6, y + 3], [x + 3, y + h - 6], [x + w - 6, y + h - 6]].forEach(([a, b]) => { px(a, b, 3, 3, '#07040b'); px(a + 1, b + 1, 1, 1, '#5b5f78'); });
    }
    function lcd(x, y, w, h) {
        px(x, y, w, h, '#07040b'); px(x + 1, y + 1, w - 2, h - 2, '#08060c');
        for (let yy = y + 2; yy < y + h - 1; yy += 2) px(x + 1, yy, w - 2, 1, 'rgba(255,255,255,0.025)');
        px(x, y + h, w, 1, '#3a3546');
    }
    const FONT = {
        '0': '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.', '1': '..#..|.##..|..#..|..#..|..#..|..#..|.###.', '2': '.###.|#...#|....#|...#.|..#..|.#...|#####',
        '3': '#####|...#.|..#..|...#.|....#|#...#|.###.', '4': '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.', '5': '#####|#....|####.|....#|....#|#...#|.###.',
        '6': '..##.|.#...|#....|####.|#...#|#...#|.###.', '7': '#####|....#|...#.|..#..|.#...|.#...|.#...', '8': '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
        '9': '.###.|#...#|#...#|.####|....#|...#.|.##..', ':': '.....|..#..|..#..|.....|..#..|..#..|.....', '/': '....#|....#|...#.|..#..|.#...|#....|#....', ' ': '.....|.....|.....|.....|.....|.....|.....'
    };
    function digits(str, x, y, col, right, ghost) {
        str = String(str); let w = str.length * 6 - 1;
        if (right) x -= w;
        for (let i = 0; i < str.length; i++) {
            let g = FONT[ghost ? '8' : str[i]]; if (!g) continue;
            bx.fillStyle = ghost ? '#110e17' : col;
            g.split('|').forEach((row, j) => { for (let c = 0; c < 5; c++) if (row[c] === '#') bx.fillRect(x + i * 6 + c, y + j, 1, 1); });
        }
        return w;
    }
    function slot(x, y, ghost, alpha) {
        for (let i = 2; i < CW - 2; i += 2) { px(x + i, y, 1, 1, '#2e2a3a'); px(x + i, y + CH - 1, 1, 1, '#2e2a3a'); }
        for (let j = 2; j < CH - 2; j += 2) { px(x, y + j, 1, 1, '#2e2a3a'); px(x + CW - 1, y + j, 1, 1, '#2e2a3a'); }
        if (ghost) { bx.globalAlpha = alpha || 0.22; bx.drawImage(ghost, x + Math.round((CW - ghost.width) / 2), y + Math.round((CH - ghost.height) / 2)); bx.globalAlpha = 1; }
    }

    // TODO only deal ones that can actually be won? some are dead from the first card
    function newGame(m, seed) {
        let n = N(), r = rng(seed == null ? (Math.random() * 4294967296) >>> 0 : seed), deck = [];
        for (let s = 0; s < 4; s++) for (let v = 1; v <= 13; v++) deck.push({ id: s * 13 + v, s, r: v, up: false, x: 0, y: 0, fa: 1, pop: 0, nope: 0, sh: 0, land: 0, fly: false, gNext: Math.random() * 4, gUntil: 0, gSeed: 0, wait: 0 });
        for (let i = deck.length - 1; i > 0; i--) { let j = Math.floor(r() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
        let piles = [{ k: 'stock', cards: [] }, { k: 'waste', cards: [] }];
        for (let i = 0; i < 4; i++) piles.push({ k: 'found', i, cards: [] });
        for (let i = 0; i < 7; i++) piles.push({ k: 'tab', i, cards: [] });
        S = { n, mode: m, seed, piles, state: 'play', score: 0, moves: 0, t: 0, started: false, undo: [], drag: null, sel: null, hover: null, fx: [], hint: null, auto: false, autoT: 0, won: false, casc: null, toast: null, now: 0, passes: 0, tTick: 0 };
        let k = 0, sp = colX(0);
        deck.forEach(c => { c.x = sp; c.y = LY ? LY.TY : 10; });
        for (let row = 0; row < 7; row++) for (let col = row; col < 7; col++) {
            let c = deck.pop(); c.wait = k++ * n.dealGap; c.up = row === col; c.fa = c.up ? -k * n.dealGap * 6 : 1;
            P('tab', col).cards.push(c);
        }
        deck.forEach(c => { c.up = false; P('stock').cards.push(c); });
        S.dealEnd = k * n.dealGap + 0.35;
        tl.clearRect(0, 0, trl.width, trl.height);
        snd('shuffle');
    }
    const P = (k, i) => S.piles.find(p => p.k === k && (i == null || p.i === i));
    const tabs = () => S.piles.filter(p => p.k === 'tab');
    const founds = () => S.piles.filter(p => p.k === 'found');
    function snap() { return { p: S.piles.map(p => p.cards.map(c => [c.id, c.up])), score: S.score, passes: S.passes }; }
    function undo() {
        if (!S || S.state !== 'play' || !S.undo.length || S.auto) return;
        let u = S.undo.pop(), all = {}; S.piles.forEach(p => p.cards.forEach(c => { all[c.id] = c; }));
        S.piles.forEach((p, i) => { p.cards = u.p[i].map(([id, up]) => { let c = all[id]; if (c.up !== up) c.fa = 0; c.up = up; return c; }); });
        S.score = u.score; S.passes = u.passes; S.moves++; S.sel = null; S.hint = null;
        snd('undo');
    }
    function startClock() { if (!S.started) { S.started = true; let d = D.m[S.mode]; d.played++; saveD(); } }
    const canFound = (c, f) => { let t = last(f.cards); return t ? t.s === c.s && c.r === t.r + 1 : c.r === 1; };
    const canTab = (c, p) => { let t = last(p.cards); return t ? t.up && red(t) !== red(c) && c.r === t.r - 1 : c.r === 13; };
    function legal(from, idx, to) {
        if (!to || to === from) return false;
        let c = from.cards[idx]; if (!c || !c.up) return false;
        if (to.k === 'found') return idx === from.cards.length - 1 && canFound(c, to);
        if (to.k === 'tab') return canTab(c, to);
        return false;
    }
    function movable(p, idx) {
        let c = p.cards[idx]; if (!c || !c.up) return false;
        if (p.k === 'tab') return true;
        if (p.k === 'waste' || p.k === 'found') return idx === p.cards.length - 1;
        return false;
    }
    function move(from, idx, to, quiet) {
        let n = S.n;
        S.undo.push(snap()); if (S.undo.length > 400) S.undo.shift();
        startClock();
        let cards = from.cards.splice(idx);
        to.cards.push(...cards);
        if (to.k === 'found') {
            S.score += n.toFound; let c = cards[0], [hx, hy] = home(to, to.cards.length - 1);
            S.fchain = S.now - (S.lastF || -9) < 2.5 ? (S.fchain || 0) + 1 : 0; S.lastF = S.now;
            c.pop = 1; c.sh = 1; sparks(hx, hy, c, 8 + Math.min(16, S.fchain * 3)); snd('found', c.r, S.fchain);
            if (c.r === 13) { to.lock = 1; sparks(hx, hy, c, 24); setTimeout(() => snd('lock'), 160); }
        }
        else snd('place');
        if (from.k === 'waste' && to.k === 'tab') S.score += n.wasteToTab;
        if (from.k === 'found' && to.k === 'tab') S.score = Math.max(0, S.score + n.foundBack);
        if (from.k === 'tab') { let t = last(from.cards); if (t && !t.up) { t.up = true; t.fa = 0; S.score += n.flipUp; if (!quiet) setTimeout(() => snd('flip'), 90); } }
        S.moves++; S.sel = null; S.hint = null;
        checkEnd();
    }
    function draw() {
        if (!S || S.state !== 'play' || S.auto || S.now < S.dealEnd) return;
        let st = P('stock'), w = P('waste');
        if (!st.cards.length) {
            if (!w.cards.length) return;
            S.undo.push(snap()); startClock();
            st.cards = w.cards.reverse().map(c => { c.up = false; c.fa = 0; return c; }); w.cards = [];
            S.passes++; S.score = Math.max(0, S.score + (S.mode === 'one' ? S.n.recycleOne : S.passes > 3 ? S.n.recycleThree : 0));
            S.moves++; snd('recycle'); return;
        }
        S.undo.push(snap()); startClock();
        let k = Math.min(S.mode === 'three' ? 3 : 1, st.cards.length);
        for (let i = 0; i < k; i++) { let c = st.cards.pop(); c.up = true; c.fa = -i * 0.35; c.wait = S.now + i * 0.05; w.cards.push(c); }
        S.moves++; S.sel = null; S.hint = null; snd('flick');
    }
    function smart(p, idx) {
        let c = p.cards[idx];
        if (idx === p.cards.length - 1 && p.k !== 'found') { let f = founds().find(f => canFound(c, f)); if (f) return f; }
        let ts = tabs().filter(t => t !== p && canTab(c, t));
        let full = ts.find(t => t.cards.length);
        if (full) return full;
        if (ts.length && !(p.k === 'tab' && idx === 0)) return ts[0];
        return null;
    }
    function moves() {
        let out = [], w = P('waste');
        let srcs = [];
        if (w.cards.length) srcs.push([w, w.cards.length - 1]);
        tabs().forEach(t => { if (t.cards.length) srcs.push([t, t.cards.length - 1]); });
        srcs.forEach(([p, i]) => { let f = founds().find(f => canFound(p.cards[i], f)); if (f) out.push({ from: p, idx: i, to: f, w: 5 }); });
        tabs().forEach(t => {
            let i = t.cards.findIndex(c => c.up); if (i < 0) return;
            tabs().forEach(o => {
                if (o === t || !legal(t, i, o)) return;
                if (i === 0 && !o.cards.length) return;
                out.push({ from: t, idx: i, to: o, w: i > 0 ? 4 : 2 });
            });
        });
        if (w.cards.length) tabs().forEach(o => { if (legal(w, w.cards.length - 1, o)) out.push({ from: w, idx: w.cards.length - 1, to: o, w: 3 }); });
        return out.sort((a, b) => b.w - a.w);
    }
    function hint() {
        if (!S || S.state !== 'play' || S.auto) return;
        let m = moves()[0];
        if (m) S.hint = { a: m.from.cards[m.idx], to: m.to, t: 1.6 };
        else if (P('stock').cards.length || P('waste').cards.length) S.hint = { stock: true, t: 1.6 };
        else S.toast = { s: L('stuck', 0, '手詰まり | no moves left'), t: 2.2 };
        snd('hint');
    }
    function checkEnd() {
        if (founds().every(f => f.cards.length === 13)) { win(); return; }
        if (!S.auto && !P('stock').cards.length && !P('waste').cards.length && tabs().every(t => t.cards.every(c => c.up))) { S.auto = true; S.autoT = 0.3; S.toast = { s: L('auto', 0, '自動で片付け中 | finishing it off'), t: 1.6 }; }
    }
    function autoStep() {
        let best = null;
        tabs().concat([P('waste')]).forEach(p => { let c = last(p.cards); if (!c) return; let f = founds().find(f => canFound(c, f)); if (f && (!best || c.r < best.c.r)) best = { p, c, f }; });
        if (best) move(best.p, best.p.cards.length - 1, best.f, true); else S.auto = false;
    }
    function win() {
        if (S.won) return;
        S.won = true; S.auto = false; S.state = 'won';
        let n = S.n, d = D.m[S.mode], secs = Math.max(1, Math.floor(S.t));
        let bonus = secs > 30 ? Math.round(n.winBonus / secs) : 0; S.bonus = bonus; S.score += bonus;
        d.won++; d.streak++; d.bestStreak = Math.max(d.bestStreak, d.streak);
        S.recT = !d.bestT || secs < d.bestT; S.recM = !d.bestM || S.moves < d.bestM;
        if (S.recT) d.bestT = secs; if (S.recM) d.bestM = S.moves;
        let now = new Date(), two = x => String(x).padStart(2, '0'), e = { s: S.score, t: secs, m: S.moves, d: now.getFullYear() + '.' + two(now.getMonth() + 1) + '.' + two(now.getDate()) };
        d.top.push(e); d.top.sort((a, b) => b.s - a.s); d.top = d.top.slice(0, 10); S.place = d.top.indexOf(e) + 1;
        saveD();
        S.casc = { q: [], t: 0, cur: [], done: false };
        for (let r = 13; r >= 1; r--) founds().forEach(f => { let c = f.cards.find(c => c.r === r); if (c) S.casc.q.push(c); });
        snd('win');
        if (calm()) S.casc.q = [];
    }
    function giveUp() {
        if (S && S.started && !S.won) { D.m[S.mode].streak = 0; saveD(); }
    }

    function ptr(e) { let r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * LY.BW, (e.clientY - r.top) / r.height * LY.BH]; }
    function pick(x, y) {
        for (let pi = S.piles.length - 1; pi >= 0; pi--) {
            let p = S.piles[pi];
            for (let i = p.cards.length - 1; i >= 0; i--) { let c = p.cards[i]; if (x >= c.x && x < c.x + CW && y >= c.y && y < c.y + CH) return { p, i, c }; }
        }
        return null;
    }
    function pileAt(x, y) {
        for (let p of S.piles) {
            let [sx_, sy_] = home(p, 0), h = p.k === 'tab' ? Math.max(CH, (last(p.cards) ? last(p.cards).ty - sy_ : 0) + CH) : CH;
            if (x >= sx_ && x < sx_ + CW && y >= sy_ && y < sy_ + h) return p;
        }
        return null;
    }
    function down(e) {
        if (S && S.state === 'won' && S.casc) {
            if (!S.casc.done) { S.casc.q = []; S.casc.cur = []; }
            else if (S.fin && !S.fin.shown) { S.fin.shown = true; S.fin.phase = 2; S.fin.t = Math.max(S.fin.t, 2.4); show('done'); }
            return;
        }
        if (!S || S.state !== 'play' || e.button > 0) return;
        e.preventDefault();
        let [x, y] = ptr(e);
        if (S.now < S.dealEnd || S.auto) return;
        let st = P('stock'), [sx_, sy_] = home(st, 0);
        if (x >= sx_ && x < sx_ + CW && y >= sy_ && y < sy_ + CH) { draw(); return; }
        let h = pick(x, y);
        if (h && movable(h.p, h.i)) {
            S.drag = { p: h.p, i: h.i, cards: h.p.cards.slice(h.i), ox: x - h.c.x, oy: y - h.c.y, x0: x, y0: y, moved: false, vx: 0, lx: x, rot: 0 };
            try { cv.setPointerCapture(e.pointerId); } catch (er) {}
        } else if (S.sel) { let to = h ? h.p : pileAt(x, y); trySel(to); }
    }
    function trySel(to) {
        let s = S.sel; S.sel = null;
        if (to && legal(s.p, s.i, to)) move(s.p, s.i, to); else if (to) nope(s.p.cards[s.i]);
    }
    function nope(c) { if (c) c.nope = 1; snd('nope'); }
    function moveP(e) {
        if (!S || !LY) return;
        let [x, y] = ptr(e), d = S.drag;
        if (!d) { if (e.pointerType === 'mouse') { let h = pick(x, y), nh = h && movable(h.p, h.i) ? h.c : null; if (nh && nh !== S.hover && nh.sh <= 0) nh.sh = 1; S.hover = nh; } return; }
        if (!d.moved && Math.hypot(x - d.x0, y - d.y0) > 3) { d.moved = true; snd('lift'); }
        d.vx = d.vx * 0.7 + (x - d.lx) * 0.3; d.lx = x; d.x = x; d.y = y;
    }
    function up(e) {
        let d = S && S.drag; if (!d) return;
        S.drag = null;
        if (e.type === 'pointercancel') return;
        if (!d.moved) {
            if (S.sel && S.sel.p !== d.p) { trySel(d.p); return; }
            let to = smart(d.p, d.i);
            if (to) move(d.p, d.i, to);
            else if (S.sel && S.sel.p === d.p && S.sel.i === d.i) S.sel = null;
            else { S.sel = { p: d.p, i: d.i }; snd('lift'); }
            return;
        }
        let lead = d.cards[0], best = null, bestA = 0;
        S.piles.forEach(p => {
            if (!legal(d.p, d.i, p)) return;
            let t = last(p.cards), [hx, hy] = t ? [t.x, t.y] : home(p, 0);
            let ax = Math.max(0, Math.min(lead.x + CW, hx + CW) - Math.max(lead.x, hx)), ay = Math.max(0, Math.min(lead.y + CH, hy + CH + (p.k === 'tab' ? 14 : 0)) - Math.max(lead.y, hy)), a = ax * ay;
            if (a > bestA) { bestA = a; best = p; }
        });
        if (best) move(d.p, d.i, best); else snd('back');
    }

    function home(p, i) {
        let { TY, TY2, BH } = LY;
        if (p.k === 'stock') return [colX(0) - Math.min(3, Math.floor(i / 8)), TY - Math.min(3, Math.floor(i / 8))];
        if (p.k === 'waste') {
            let n = p.cards.length, fan = S.mode === 'three' ? Math.min(3, n) : 1, j = i - (n - fan);
            return [colX(1) + (j > 0 ? j * 9 : 0) - (j < 0 ? Math.min(2, Math.floor(i / 10)) : 0), TY];
        }
        if (p.k === 'found') return [colX(3 + p.i), TY - Math.min(2, Math.floor(i / 6))];
        let cs = p.cards, downs = 0, ups = 0;
        cs.forEach(c => { if (c.up) ups++; else downs++; });
        let room = BH - 4 - TY2 - CH, need = downs * 4 + Math.max(0, ups - 1) * 11, upStep = need > room && ups > 1 ? Math.max(5, (room - downs * 4) / (ups - 1)) : 11;
        let y = TY2;
        for (let k = 0; k < i; k++) y += cs[k].up ? upStep : 4;
        return [colX(p.i), Math.round(y)];
    }

    function tick(dt) {
        S.now += dt;
        let n = S.n;
        if (S.state === 'play' && S.started && !S.won) {
            S.t += dt;
            let ticks = Math.floor(S.t / n.timeEvery); if (ticks > S.tTick) { S.score = Math.max(0, S.score - (ticks - S.tTick) * n.timeCost); S.tTick = ticks; }
        }
        if (S.auto && S.state === 'play') { S.autoT -= dt; if (S.autoT <= 0) { S.autoT = n.autoGap; autoStep(); } }
        if (S.hint) { S.hint.t -= dt; if (S.hint.t <= 0) S.hint = null; }
        if (S.toast) { S.toast.t -= dt; if (S.toast.t <= 0) S.toast = null; }
        let dragSet = S.drag && S.drag.moved ? new Set(S.drag.cards) : null;
        S.piles.forEach(p => p.cards.forEach((c, i) => {
            let [hx, hy] = home(p, i); c.tx = hx; c.ty = hy;
            if (c.fa < 1) c.fa = Math.min(1, c.fa + dt * 6.5);
            c.pop = Math.max(0, c.pop - dt * 2.5); c.nope = Math.max(0, c.nope - dt * 3); c.sh = Math.max(0, c.sh - dt * 2.2); c.land = Math.max(0, c.land - dt * 9);
            if (dragSet && dragSet.has(c)) {
                let k = S.drag.cards.indexOf(c), d = S.drag, lag = k * 0.06;
                let tx_ = d.x - d.ox, ty_ = d.y - d.oy + k * 11;
                c.x += (tx_ - c.x) * Math.min(1, dt * (40 - lag * 200)); c.y += (ty_ - c.y) * Math.min(1, dt * (40 - lag * 200));
                return;
            }
            if (c.wait > S.now) return;
            let k = Math.min(1, dt * 16);
            c.x += (hx - c.x) * k; c.y += (hy - c.y) * k;
            if (Math.abs(hx - c.x) < 0.3) c.x = hx; if (Math.abs(hy - c.y) < 0.3) c.y = hy;
            let far = Math.abs(hx - c.x) + Math.abs(hy - c.y) > 6;
            if (far) c.fly = true; else if (c.fly && c.x === hx && c.y === hy) { c.fly = false; c.land = 1; if (S.now > S.dealEnd && !S.casc) dust(c); }
        }));
        if (S.drag) S.drag.rot += (clamp(S.drag.vx * 0.05, -0.16, 0.16) - S.drag.rot) * Math.min(1, dt * 12);
        for (let f of S.fx) { f.t += dt; f.vy += (f.g == null ? 240 : f.g) * dt; f.x += f.vx * dt; f.y += f.vy * dt; }
        S.fx = S.fx.filter(f => f.t < f.life);
        founds().forEach(f => { if (f.lock > 0) f.lock = Math.max(0, f.lock - dt * 1.6); });
        S.dScore = S.dScore == null ? S.score : S.dScore + (S.score - S.dScore) * Math.min(1, dt * 7);
        if (Math.abs(S.dScore - S.score) < 0.5) S.dScore = S.score;
        if (S.casc) cascade(dt);
        if (S.fin) finale(dt);
        if (S.state === 'menu') menuTick(dt);
    }
    function dust(c) {
        if (calm()) return;
        for (let i = 0; i < 4; i++) { let l = i < 2; S.fx.push({ x: c.x + (l ? 1 : CW - 2), y: c.y + CH - 1, vx: (l ? -1 : 1) * (12 + Math.random() * 20), vy: -6 - Math.random() * 10, t: 0, life: 0.25 + Math.random() * 0.15, col: '#5b5670', g: 0 }); }
    }
    function sparks(x0, y0, c, n) {
        if (calm()) return;
        let pal = ink(c);
        for (let i = 0; i < n; i++) S.fx.push({ x: x0 + CW / 2 + (Math.random() - 0.5) * CW, y: y0 + CH / 2 + (Math.random() - 0.5) * CH * 0.6, vx: (Math.random() - 0.5) * 90, vy: -30 - Math.random() * 70, t: 0, life: 0.35 + Math.random() * 0.4, col: Math.random() < 0.3 ? '#ffffff' : pal.c });
    }

    function cascade(dt) {
        let C = S.casc, g = 520;
        C.t -= dt;
        if (C.t <= 0 && C.q.length) {
            let c = C.q.shift();
            C.cur.push({ c, x: c.x, y: c.y, vx: (Math.random() < 0.5 ? -1 : 1) * (150 + Math.random() * 130), vy: -40 - Math.random() * 140 });
            C.t = 0.075;
        }
        C.cur.forEach(b => {
            b.vy += g * dt; b.x += b.vx * dt; b.y += b.vy * dt;
            if (b.y > LY.BH - CH) { b.y = LY.BH - CH; b.vy *= -0.72; if (Math.abs(b.vy) > 40) snd('bounce'); }
            let qy = Math.round(b.y / 2) * 2, gl = Math.random() < 0.06, im = faceOf(b.c);
            if (b.c.r > 10 || b.c.r === 1) { tx.clearRect(0, 0, CW, CH); tx.drawImage(im, 0, 0); if (b.c.r > 10) letter(tx, b.c, S.now); else ring(tx, b.c, S.now); im = tmp; }
            if (gl) { tl.globalAlpha = 0.8; tl.drawImage(im, Math.round(b.x) + (Math.random() < 0.5 ? -3 : 3), qy); tl.globalAlpha = 1; }
            else tl.drawImage(im, Math.round(b.x), qy);
            b.c.hidden = true;
        });
        C.cur = C.cur.filter(b => b.x > -CW - 4 && b.x < LY.BW + 4);
        if (!C.q.length && !C.cur.length && !C.done) { C.done = true; S.fin = { t: calm() ? 2.4 : 0, phase: calm() ? 2 : 0, parts: [], rain: [] }; }
    }

    function clearMask() {
        let m = spr('clear', { c: '#ffffff' }); if (!m) return [];
        let d = m.getContext('2d').getImageData(0, 0, m.width, m.height).data, K = 4, out = [], ox = Math.round(LY.BW / 2 - m.width * K / 2), oy = Math.round(LY.BH * 0.13);
        for (let j = 0; j < m.height; j++) for (let i = 0; i < m.width; i++) if (d[(j * m.width + i) * 4 + 3]) for (let b = 0; b < K; b++) for (let a = 0; a < K; a++) out.push([ox + i * K + a, oy + j * K + b, j * K + b]);
        S.fin.box = [ox, oy, m.width * K, m.height * K];
        return out;
    }
    function shatter() {
        let F = S.fin, d = tl.getImageData(0, 0, trl.width, trl.height).data, W = trl.width, src = [];
        for (let y = 0; y < trl.height; y += 2) for (let x = 0; x < W; x += 2) { let o = (y * W + x) * 4; if (d[o + 3] > 0) src.push([x, y, 'rgb(' + d[o] + ',' + d[o + 1] + ',' + d[o + 2] + ')']); }
        for (let i = src.length - 1; i > 0; i--) { let j = Math.floor(Math.random() * (i + 1)); [src[i], src[j]] = [src[j], src[i]]; }
        let T = clearMask();
        for (let i = 0; i < Math.max(T.length, Math.min(src.length, 3200)); i++) {
            let sp = src.length ? src[i % src.length] : [colX(3 + (i % 4)) + Math.random() * CW, LY.TY + Math.random() * CH, ink({ s: i % 4 }).c], t = T[i % T.length];
            let ang = Math.random() * Math.PI * 2, spd = 80 + Math.random() * 260;
            F.parts.push({ x: sp[0], y: sp[1], col: sp[2], vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 40, sw: (Math.random() - 0.5) * 6, tx: i < T.length ? t[0] : null, ty: i < T.length ? t[1] : null, row: t ? t[2] : 0 });
        }
        tl.clearRect(0, 0, trl.width, trl.height);
        F.box = F.box || [0, 0, 0, 0]; F.flash = 1;
        snd('shatter');
    }
    function finale(dt) {
        let F = S.fin; F.t += dt; F.flash = Math.max(0, (F.flash || 0) - dt * 5);
        if (F.phase === 0 && F.t > 0.75) { shatter(); F.phase = 1; }
        if (F.phase === 1) {
            let k = clamp((F.t - 1.05) / 1.1, 0, 1);
            F.parts.forEach(p => {
                if (p.tx == null) { p.vy += 200 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.fade = (p.fade || 0) + dt * 1.5; return; }
                p.vx *= Math.pow(0.04, dt); p.vy *= Math.pow(0.04, dt);
                let dx = p.tx - p.x, dy = p.ty - p.y; p.x += (p.vx - dy * p.sw * 0.08 * k) * dt; p.y += (p.vy + dx * p.sw * 0.08 * k) * dt;
                let e = k * k * (3 - 2 * k), pull = Math.min(1, dt * (2 + e * 16));
                p.x += (p.tx - p.x) * pull * e; p.y += (p.ty - p.y) * pull * e;
            });
            if (F.t > 2.3) { F.phase = 2; snd('clear'); if (!F.box[2]) clearMask(); }
        }
        if (F.phase === 2) {
            if (!calm() && Math.random() < dt * 22) F.rain.push({ x: Math.random() * LY.BW, y: -8, v: 30 + Math.random() * 50, s: Math.floor(Math.random() * 4), w: Math.random() * 6 });
            F.rain.forEach(r => { r.y += r.v * dt; r.w += dt * 3; });
            F.rain = F.rain.filter(r => r.y < LY.BH + 8);
            if (F.t > 3.5 && !F.shown) { F.shown = true; show('done'); }
        }
    }
    function drawFinale() {
        let F = S.fin, now = S.now;
        if (F.phase === 0) {
            let amt = F.t / 0.75, sp = Math.round(amt * 4);
            bx.globalAlpha = 0.6; bx.globalCompositeOperation = 'lighter';
            bx.drawImage(trl, -sp, 0); bx.drawImage(trl, sp, Math.round(amt * 2));
            bx.globalAlpha = 1; bx.globalCompositeOperation = 'source-over';
            for (let y = 0; y < LY.BH;) { let hh = 1 + Math.floor(Math.random() * 6), dx = Math.random() < 0.5 ? Math.round((Math.random() - 0.5) * amt * 24) : 0; bx.drawImage(trl, 0, y, LY.BW, hh, dx, y, LY.BW, hh); y += hh; }
            if (Math.random() < amt * 0.5) { let y = Math.floor(Math.random() * LY.BH); px(0, y, LY.BW, 1 + Math.floor(Math.random() * 3), rgba('#ffffff', 0.25)); }
            return;
        }
        if (F.phase === 1) {
            let k = clamp((F.t - 1.4) / 0.9, 0, 1), big = F.t < 1.15;
            F.parts.forEach(p => { if (p.fade >= 1) return; bx.globalAlpha = p.fade ? 1 - p.fade : 1; bx.fillStyle = k > 0.5 && p.tx != null ? (p.row < 5 ? '#ffffff' : p.row < 16 ? theme.s : theme.p) : p.col; let sz = big || (p.tx == null) ? 2 : 1; bx.fillRect(Math.round(p.x), Math.round(p.y), sz, sz); });
            bx.globalAlpha = 1;
            if (F.flash > 0) { bx.globalAlpha = F.flash * 0.7; px(0, 0, LY.BW, LY.BH, '#ffffff'); bx.globalAlpha = 1; }
            return;
        }
        F.rain.forEach(r => { let sp = spr('mini_' + SUITS[r.s], { c: rgba(ink({ s: r.s }).c, 0.5), w: rgba('#ffffff', 0.5), o: rgba(ink({ s: r.s }).o, 0.5) }); if (sp) bx.drawImage(sp, Math.round(r.x + Math.sin(r.w) * 3), Math.round(r.y)); });
        let [ox, oy, w, h] = F.box, m = spr('clear', { c: '#ffffff' }); if (!m) return;
        let hot = !calm() && (Math.sin(now * 2.3) > 0.8 || F.t < 2.7), K = 4;
        const blit = (col, dx, dy, a) => { bx.globalAlpha = a; let c2 = spr('clear', { c: col }); bx.drawImage(c2, 0, 0, m.width, m.height, ox + dx, oy + dy, w, h); };
        [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, 1], [-1, 1], [1, -1]].forEach(([a, b]) => blit(theme.s, a, b, 0.12));
        if (!calm()) { blit('#ff2a55', -1 - (hot ? 1 : 0), 0, 0.7); blit('#2ad8ff', 1 + (hot ? 1 : 0), 0, 0.7); }
        bx.globalAlpha = 1;
        for (let j = 0; j < m.height * K; j++) {
            let dx = hot && Math.random() < 0.12 ? Math.round((Math.random() - 0.5) * 6) : 0;
            bx.drawImage(spr('clear', { c: j < 5 ? '#ffffff' : j < 16 ? theme.s : theme.p }), 0, Math.floor(j / K), m.width, 1, ox + dx, oy + j, w, 1);
        }
        let sy = oy + Math.floor((now * 30) % (h + 20)) - 10; if (sy >= oy && sy < oy + h) { bx.globalAlpha = 0.35; px(ox - 4, sy, w + 8, 1, '#ffffff'); bx.globalAlpha = 1; }
    }
    function menuTick(dt) {
        let M = S.menu; if (!M) return;
        M.cards.forEach(c => {
            c.flip -= dt;
            if (c.flip <= 0 && !calm()) { c.flip = 2.4 + Math.random() * 2.5; c.up = !c.up; c.fa = 0; if (c.up) { c.s = Math.floor(Math.random() * 4); c.r = [1, 11, 12, 13, 1, 7][Math.floor(Math.random() * 6)]; c.id = c.s * 13 + c.r; } snd('menuflip'); }
            if (c.fa < 1) c.fa = Math.min(1, c.fa + dt * 6.5);
            c.sh = Math.max(0, c.sh - dt * 2.2); if (!calm() && Math.random() < dt * 0.15) c.sh = 1;
        });
        M.pips.forEach(p => { p.y -= p.v * dt; if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); } });
    }
    function mkMenu() {
        let cards = [[0, 1], [2, 13], [1, 12], [3, 11], [2, 1]].map(([s_, r], i) => ({ id: s_ * 13 + r, s: s_, r, up: true, fa: 1, pop: 0, nope: 0, sh: 0, land: 0, gNext: Math.random() * 3, gUntil: 0, gSeed: 0, flip: 1 + i * 0.7 }));
        return { cards, pips: Array.from({ length: 22 }, () => ({ x: Math.random(), y: Math.random(), s: Math.floor(Math.random() * 4), v: 0.015 + Math.random() * 0.03 })) };
    }
    function menuScene() {
        let M = S.menu || (S.menu = mkMenu()), { BW, BH, tall } = LY, now = S.now;
        M.pips.forEach(p => { let sp = spr('mini_' + SUITS[p.s], { c: '#241f2e', w: '#2e2838', o: '#241f2e' }); if (sp) bx.drawImage(sp, Math.round(p.x * BW), Math.round(p.y * BH)); });
        let cx_ = tall ? BW / 2 : BW * 0.7, cy_ = tall ? BH * 0.78 : BH * 0.5;
        // every so often one jumps off the fan and bounces away like when you win
        let dt = M.at ? Math.min(0.05, now - M.at) : 0; M.at = now;
        if (!calm()) {
            M.bT = (M.bT == null ? 3 : M.bT) - dt;
            if (M.bT <= 0 && !M.b) {
                let s_ = Math.floor(Math.random() * 4), rk = 1 + Math.floor(Math.random() * 13), dir = Math.random() < 0.5 ? -1 : 1;
                M.b = { c: { id: s_ * 13 + rk, s: s_, r: rk, up: true, fa: 1 }, x: cx_ - CW / 2 + dir * 56, y: cy_ - CH / 2 - 6, vx: dir * (120 + Math.random() * 90), vy: -160 - Math.random() * 120 };
                M.bT = 6 + Math.random() * 5;
            }
            if (M.fadeT > 0 || M.b) { tl.globalCompositeOperation = 'destination-out'; tl.fillStyle = 'rgba(0,0,0,' + Math.min(1, dt * 0.9) + ')'; tl.fillRect(0, 0, trl.width, trl.height); tl.globalCompositeOperation = 'source-over'; }
            if (M.b) {
                let b = M.b; b.vy += 520 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
                if (b.y > BH - CH) { b.y = BH - CH; b.vy *= -0.72; }
                let im = faceOf(b.c);
                if (b.c.r > 10 || b.c.r === 1) { tx.clearRect(0, 0, CW, CH); tx.drawImage(im, 0, 0); if (b.c.r > 10) letter(tx, b.c, now); else ring(tx, b.c, now); im = tmp; }
                tl.drawImage(im, Math.round(b.x), Math.round(b.y / 2) * 2);
                if (b.x < -CW - 4 || b.x > BW + 4) { M.b = null; M.fadeT = 4; }
            } else if (M.fadeT > 0 && (M.fadeT -= dt) <= 0) tl.clearRect(0, 0, trl.width, trl.height);
            bx.drawImage(trl, 0, 0);
        }
        M.cards.forEach((c, i) => {
            let k = i - 2, x = cx_ - CW / 2 + k * 28, y = cy_ - CH / 2 + k * k * 4 + (calm() ? 0 : Math.round(Math.sin(now * 1.3 + i) * 1.5));
            drawCard(c, x, y, { lift: 1 });
        });
    }
    function drawCard(c, x, y, o) {
        o = o || {};
        let showFace = c.up ? c.fa >= 0.5 : c.fa < 0.5, src = showFace ? faceOf(c) : back(), now = S.now;
        if (showFace ? (c.r > 10 || c.r === 1 || c.sh > 0) : !o.flat) {
            tx.clearRect(0, 0, CW, CH); tx.drawImage(src, 0, 0);
            if (showFace) { if (c.r > 10) letter(tx, c, now); else if (c.r === 1) ring(tx, c, now); }
            else pulses(tx, c, now);
            if (c.sh > 0) shine(tx, c.sh);
            src = tmp;
        }
        let sxs = c.fa < 1 ? Math.max(0.08, Math.abs(Math.cos(Math.max(0, c.fa) * Math.PI))) : 1;
        let w = Math.max(2, Math.round(CW * sxs)), h = CH, X = Math.round(x + (CW - w) / 2), Y = Math.round(y);
        if (c.nope) X += Math.round(Math.sin(c.nope * 30) * 2 * c.nope);
        if (c.land > 0.5 && !calm()) { X -= 1; w += 2; Y += 1; h -= 1; }
        let lift = o.lift || 0;
        bx.fillStyle = 'rgba(0,0,0,' + (lift ? 0.45 : 0.35) + ')';
        bx.fillRect(X + 1 + lift, Y + 1 + lift * 1.5, w, h);
        if (o.rot) { bx.save(); bx.translate(X + w / 2, Y + h / 2); bx.rotate(o.rot); bx.drawImage(src, -w / 2, -h / 2, w, h); bx.restore(); }
        else bx.drawImage(src, X, Y, w, h);
        if (c.pop > 0) { bx.globalAlpha = c.pop * 0.8; outline(X - 1, Y - 1, w + 2, h + 2, ink(c).g); bx.globalAlpha = 1; }
    }
    function shine(x, t) {
        let p = (1 - t) * (CW + CH + 10) - 8;
        x.fillStyle = 'rgba(255,255,255,0.28)';
        for (let j = 0; j < CH; j++) for (let k = 0; k < 3; k++) { let i = Math.round(p - j * 0.6 + k); if (shape(i, j)) x.fillRect(i, j, 1, 1); }
        x.fillStyle = 'rgba(255,255,255,0.5)';
        for (let j = 0; j < CH; j++) { let i = Math.round(p - j * 0.6 + 1); if (shape(i, j)) x.fillRect(i, j, 1, 1); }
    }
    function outline(x, y, w, h, col) { px(x + 2, y, w - 4, 1, col); px(x + 2, y + h - 1, w - 4, 1, col); px(x, y + 2, 1, h - 4, col); px(x + w - 1, y + 2, 1, h - 4, col); }

    function drawScene(now) {
        let { BW, BH, TY } = LY;
        bx.imageSmoothingEnabled = false;
        bx.drawImage(table(), 0, 0);
        if (S.state === 'menu') { menuScene(); return; }
        if (!calm()) { let sy = (S.now * 26) % (BH * 4); if (sy < BH) { px(0, sy, BW, 1, rgba(theme.p, 0.05)); px(0, sy - 1, BW, 1, rgba(theme.p, 0.025)); } }
        hud();
        let st = P('stock'), w = P('waste');
        slot(colX(0), TY, st.cards.length ? null : spr('recycle', { c: w.cards.length ? theme.p : '#3a3546' }), 0.8);
        slot(colX(1), TY);
        founds().forEach((f, i) => slot(colX(3 + i), TY, spr('ace_' + SUITS[i], { c: '#2a2535', w: '#2a2535', o: '#2a2535' }), 1));
        tabs().forEach(t => slot(colX(t.i), LY.TY2, t.cards.length ? null : spr('big_K', { c: '#1e1a28', w: '#1e1a28', o: '#1e1a28' }), 1));
        let dragSet = S.drag && S.drag.moved ? new Set(S.drag.cards) : new Set(), flying = [];
        S.piles.forEach(p => p.cards.forEach((c, i) => {
            if (c.hidden || dragSet.has(c)) return;
            if (Math.abs(c.x - c.tx) > 1.5 || Math.abs(c.y - c.ty) > 1.5) { flying.push(c); return; }
            let lift = S.hover === c && !S.drag ? 1 : 0;
            drawCard(c, c.x, c.y - lift);
            if (S.sel && S.sel.p === p && i >= S.sel.i) { bx.globalAlpha = 0.6 + 0.4 * Math.sin(now / 120); outline(Math.round(c.x) - 1, Math.round(c.y) - 1, CW + 2, CH + 2, theme.s); bx.globalAlpha = 1; }
        }));
        flying.sort((a, b) => (a.wait || 0) - (b.wait || 0)).forEach(c => drawCard(c, c.x, c.y, { lift: 1 }));
        founds().forEach(f => {
            if (f.cards.length !== 13 || S.casc) return;
            let c = last(f.cards), X = Math.round(c.x), Y = Math.round(c.y), pal = ink(c);
            if (f.lock > 0) { let ly = Y + Math.round((1 - f.lock) * CH); px(X, ly, CW, 1, '#ffffff'); px(X, ly - 1, CW, 1, rgba(pal.g, 0.6)); }
            let lk = 0.55 + 0.45 * Math.sin(S.now * 3 + f.i);
            bx.globalAlpha = lk; outline(X - 1, Y - 1, CW + 2, CH + 2, pal.c); bx.globalAlpha = 1;
            px(X + CW - 9, Y + 4, 5, 4, pal.c); px(X + CW - 8, Y + 2, 3, 1, pal.c); px(X + CW - 9, Y + 3, 1, 1, pal.c); px(X + CW - 5, Y + 3, 1, 1, pal.c); px(X + CW - 7, Y + 5, 1, 2, '#07040b');
        });
        let cand = S.drag && S.drag.moved ? { p: S.drag.p, i: S.drag.i } : S.sel ? S.sel : null;
        if (cand && !S.won) S.piles.forEach(p => {
            if (!legal(cand.p, cand.i, p)) return;
            let t = last(p.cards), [hx, hy] = t ? [t.x, t.y + (p.k === 'tab' ? 0 : 0)] : home(p, 0), a = 0.45 + 0.4 * Math.sin(S.now * 9);
            bx.globalAlpha = a; outline(Math.round(hx) - 1, Math.round(hy) - 1, CW + 2, CH + 2, p.k === 'found' ? ink(cand.p.cards[cand.i]).c : theme.s); bx.globalAlpha = 1;
        });
        if (st.cards.length) digits(String(st.cards.length).padStart(2, '0'), colX(0) + CW / 2 - 5, TY + CH + 1, rgba(theme.s, 0.55));
        if (S.drag && S.drag.moved) S.drag.cards.forEach((c, k) => drawCard(c, c.x, c.y, { lift: 3, rot: calm() ? 0 : S.drag.rot * (1 - k * 0.15) }));
        if (S.hint && Math.floor(S.hint.t * 4) % 2 === 0) {
            if (S.hint.stock) outline(colX(0) - 1, TY - 1, CW + 2, CH + 2, '#ffe27a');
            else { let a = S.hint.a, t = last(S.hint.to.cards), [hx, hy] = t ? [t.x, t.y] : home(S.hint.to, 0); outline(Math.round(a.x) - 1, Math.round(a.y) - 1, CW + 2, CH + 2, '#ffe27a'); outline(Math.round(hx) - 1, Math.round(hy) - 1, CW + 2, CH + 2, rgba('#ffe27a', 0.6)); }
        }
        for (let f of S.fx) { bx.globalAlpha = Math.max(0, 1 - f.t / f.life); px(f.x, f.y, f.t < 0.1 ? 2 : 1, f.t < 0.1 ? 2 : 1, f.col); }
        bx.globalAlpha = 1;
        if (S.fin) drawFinale(); else if (S.casc) bx.drawImage(trl, 0, 0);
        if (S.casc && !LY.tall) hud();
    }
    function hud() {
        let { tall, PX, PY, PW, PH } = LY;
        plate(PX, PY, PW, PH);
        let d = D.m[S.mode], t = clock(S.t), mv = String(S.moves), sc_ = String(Math.round(S.dScore == null ? S.score : S.dScore));
        if (S.started && S.state === 'play' && !S.won && Math.floor(S.now * 2) % 2) t = t.replace(':', ' ');
        if (tall) {
            let w3 = Math.floor((PW - 16) / 3);
            [[t, theme.s], [mv, '#cfcbd6'], [sc_, '#ffe27a']].forEach(([v, col], i) => { let x = PX + 6 + i * (w3 + 2); lcd(x, PY + 17, w3, 15); digits('8'.repeat(Math.min(6, Math.floor((w3 - 6) / 6))), x + w3 - 3, PY + 21, '', true, true); digits(v, x + w3 - 3, PY + 21, col, true); });
            return;
        }
        let x = PX + 7, w = PW - 14;
        [[PY + 22, t, theme.s], [PY + 52, mv, '#cfcbd6'], [PY + 82, sc_, '#ffe27a']].forEach(([y, v, col]) => {
            lcd(x, y, w, 15); digits('888888888'.slice(0, Math.floor((w - 6) / 6)), x + w - 4, y + 4, '', true, true); digits(v, x + w - 4, y + 4, col, true);
        });
        let rate = d.played ? d.won / d.played : 0;
        px(x, PY + 117, w, 4, '#08060c'); px(x, PY + 117, Math.round(w * rate), 4, rgba(theme.s, 0.8));
        for (let i = x + 3; i < x + w; i += 4) px(i, PY + 117, 1, 4, '#08060c');
    }
    function text(s, x, y, size, col, align, jit) {
        let k = LY.k; sx.font = Math.round(size * k) + 'px "DotGothic16", monospace'; sx.textAlign = align || 'left'; sx.textBaseline = 'top';
        let X = Math.round(x * k), Y = Math.round(y * k);
        if (jit && !calm()) { let j = Math.random() < 0.15 ? (Math.random() - 0.5) * 4 * k : 0; sx.globalAlpha = 0.7; sx.fillStyle = '#ff2a6d'; sx.fillText(s, X - k + j, Y); sx.fillStyle = '#2de0ff'; sx.fillText(s, X + k + j, Y); sx.globalAlpha = 1; X += j; }
        sx.fillStyle = '#000'; sx.fillText(s, X + Math.max(1, k / 2), Y + Math.max(1, k / 2));
        sx.fillStyle = col; sx.fillText(s, X, Y);
    }
    const stamp = (s, x, y, size, col, al) => text(s, x, y, size || 7, col || '#b3adc0', al);
    function words() {
        let { tall, PX, PY, PW, PH } = LY, m = mode(S.mode), d = D.m[S.mode];
        if (tall) {
            let w3 = Math.floor((PW - 16) / 3);
            [L('time', 0, '時間 | TIME'), L('moves', 0, '手数 | MOVES'), L('score', 0, 'スコア | SCORE')].forEach((s, i) => stamp(s, PX + 6 + i * (w3 + 2), PY + 6, 6));
        } else {
            stamp(L('time', 0, '時間 | TIME'), PX + 7, PY + 13);
            stamp(L('moves', 0, '手数 | MOVES'), PX + 7, PY + 43);
            stamp(L('score', 0, 'スコア | SCORE'), PX + 7, PY + 73);
            stamp(L('wins', d.won + '/' + d.played, '勝ち {n} | {n} won'), PX + 7, PY + 106, 6, '#8f8b9a');
            stamp(L('best', d.bestT ? clock(d.bestT) : '-', 'ベスト {n} | best {n}'), PX + 7, PY + 125, 6, d.bestT ? '#ffe27a' : '#6f6a7c');
            if (d.streak > 1) stamp(L('streak', d.streak, '{n}連勝 | {n} in a row'), PX + 7, PY + 135, 6, rgba(theme.s, 0.9));
            stamp(m.jp + ' // ' + m.en, PX + PW / 2, PY + PH - 18, 6, rgba(theme.p, 0.95), 'center');
        }
        if (S.toast) { sx.globalAlpha = Math.min(1, S.toast.t * 2); text(S.toast.s, LY.TX + (7 * CW + 6 * GAP) / 2, LY.BH - 16, 7, '#ffe27a', 'center', true); sx.globalAlpha = 1; }
    }

    function frame(t) {
        raf = 0;
        if (!S || !cv || asleep) return;
        let dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0; lastT = t;
        readTheme(t);
        if (S.state !== 'pause') tick(dt);
        paint(t);
        raf = requestAnimationFrame(frame);
    }
    function paint(t) {
        drawScene(t);
        sx.imageSmoothingEnabled = false;
        sx.clearRect(0, 0, cv.width, cv.height);
        sx.drawImage(buf, 0, 0, cv.width, cv.height);
        if (S.state !== 'menu') words(); else logoDraw();
    }

    // cards are basically just filtered noise lol
    let FX = null;
    function fxKit(A) {
        if (FX && FX.A === A) return FX;
        let n = A.createBuffer(1, A.sampleRate, A.sampleRate), d = n.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        let ir = A.createBuffer(2, Math.floor(A.sampleRate * 0.7), A.sampleRate);
        for (let c = 0; c < 2; c++) { let q = ir.getChannelData(c); for (let i = 0; i < q.length; i++) q[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / q.length, 3.2) * 0.5; }
        let room = A.createConvolver(); room.buffer = ir;
        let wet = A.createGain(); wet.gain.value = 0.22; room.connect(wet); wet.connect(os.gg && os.gg.out ? os.gg.out(A) : A.destination);
        FX = { A, n, room }; return FX;
    }
    function snd(k, a, b) {
        if (D.muted || (os.prefs && os.prefs.sound === false)) return;
        try {
            let A = window.audioCtx || (window.audioCtx = new (window.AudioContext || window.webkitAudioContext)()); if (A.state === 'suspended') A.resume();
            let out = os.gg && os.gg.out ? os.gg.out(A) : A.destination, now = A.currentTime, K = fxKit(A);
            const rnd = (x, y) => x + Math.random() * (y - x);
            const noiseSrc = (at, dur) => { let src = A.createBufferSource(); src.buffer = K.n; src.start(at, Math.random() * 0.8); src.stop(at + dur + 0.05); return src; };
            const click = (dl, v, f, dec, q) => {
                let at = now + dl, fl = A.createBiquadFilter(), g = A.createGain();
                fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = q || 1.4;
                g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(v, at + 0.0006); g.gain.exponentialRampToValueAtTime(0.0001, at + dec);
                noiseSrc(at, dec).connect(fl); fl.connect(g); g.connect(out);
            };
            const thump = (dl, v, f) => {
                let at = now + dl, o = A.createOscillator(), g = A.createGain();
                o.frequency.setValueAtTime(f, at); o.frequency.exponentialRampToValueAtTime(f * 0.55, at + 0.05);
                g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(v, at + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
                o.connect(g); g.connect(out); o.start(at); o.stop(at + 0.08);
                let fl = A.createBiquadFilter(), g2 = A.createGain(); fl.type = 'lowpass'; fl.frequency.value = 420;
                g2.gain.setValueAtTime(0.0001, at); g2.gain.exponentialRampToValueAtTime(v * 1.4, at + 0.001); g2.gain.exponentialRampToValueAtTime(0.0001, at + 0.03);
                noiseSrc(at, 0.04).connect(fl); fl.connect(g2); g2.connect(out);
            };
            const slide = (dl, v, dur, f1, f2) => {
                let at = now + dl, fl = A.createBiquadFilter(), g = A.createGain();
                fl.type = 'bandpass'; fl.Q.value = 0.9; fl.frequency.setValueAtTime(f1, at); fl.frequency.exponentialRampToValueAtTime(f2, at + dur);
                g.gain.setValueAtTime(0.0001, at);
                for (let t = 0; t < dur; t += 0.004) g.gain.setValueAtTime(v * (0.35 + Math.random() * 0.65) * Math.min(1, t / 0.008) * Math.min(1, (dur - t) / 0.02), at + t);
                g.gain.setValueAtTime(0.0001, at + dur);
                noiseSrc(at, dur).connect(fl); fl.connect(g); g.connect(out);
            };
            const glass = (dl, f, v, dur) => {
                let at = now + dl;
                [[1, 1, 1], [2.756, 0.3, 0.55], [5.404, 0.1, 0.3]].forEach(([m, a2, d2]) => {
                    let o = A.createOscillator(), g = A.createGain(); o.frequency.value = f * m;
                    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(v * a2, at + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, at + dur * d2);
                    o.connect(g); g.connect(out); g.connect(K.room); o.start(at); o.stop(at + dur * d2 + 0.05);
                });
            };
            const SC = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28];
            const place = (dl, v) => { click(dl, 0.32 * v, rnd(2000, 2600), 0.012); click(dl + 0.002, 0.12 * v, 5200, 0.005); thump(dl, 0.16 * v, rnd(140, 170)); };
            if (k === 'flick') { slide(0, 0.1, 0.055, 2400, 4600); click(0.05, 0.22, 3400, 0.01); }
            else if (k === 'lift') { click(0, 0.12, 3000, 0.007); slide(0.004, 0.04, 0.03, 3000, 3800); }
            else if (k === 'place') place(0, 1);
            else if (k === 'back') { slide(0, 0.07, 0.09, 3600, 1800); place(0.085, 0.8); }
            else if (k === 'flip') { click(0, 0.2, 4600, 0.006); click(0.024, 0.16, 3400, 0.008); slide(0.004, 0.03, 0.02, 3000, 4000); }
            else if (k === 'found') { place(0, 1); glass(0.008, 1046 * Math.pow(2, (SC[(a || 1) - 1] + Math.min(12, b || 0)) / 12), 0.045, 0.9); }
            else if (k === 'shuffle') {
                let t = 0;
                for (let i = 0; i < 32; i++) { click(t, rnd(0.12, 0.2), rnd(3200, 6000), 0.006); t += 0.03 - i * 0.0005; }
                slide(t, 0.1, 0.22, 2200, 4200);
                for (let i = 0; i < 22; i++) click(t + i * 0.01, 0.07, rnd(3500, 5500), 0.004);
                thump(t + 0.32, 0.18, 150); click(t + 0.32, 0.18, 1800, 0.014); thump(t + 0.44, 0.16, 140); click(t + 0.44, 0.15, 1700, 0.014);
            }
            else if (k === 'recycle') { slide(0, 0.1, 0.24, 4200, 1300); thump(0.24, 0.18, 150); click(0.24, 0.2, 1900, 0.014); }
            else if (k === 'undo') { slide(0, 0.07, 0.07, 1600, 4200); glass(0.06, 2093, 0.018, 0.25); }
            else if (k === 'hint') { glass(0, 1568, 0.03, 0.5); glass(0.09, 2349, 0.025, 0.5); }
            else if (k === 'nope') { thump(0, 0.16, 120); click(0, 0.1, 900, 0.02); thump(0.09, 0.13, 105); click(0.09, 0.08, 850, 0.02); }
            else if (k === 'bounce') { click(0, rnd(0.06, 0.1), rnd(1800, 2600), 0.008); thump(0, 0.05, rnd(180, 240)); }
            else if (k === 'win') [0, 4, 7, 12, 16, 19, 24].forEach((st, i) => glass(i * 0.075, 784 * Math.pow(2, st / 12), 0.04, 1.2));
            else if (k === 'lock') { click(0, 0.25, 2600, 0.01); thump(0, 0.12, 200); click(0.06, 0.22, 3200, 0.008); [0, 7, 12].forEach((st, i) => glass(0.08 + i * 0.03, 1318 * Math.pow(2, st / 12), 0.025, 1)); }
            else if (k === 'tick') click(0, 0.1, 4000, 0.005);
            else if (k === 'menuflip') { click(0, 0.05, 4400, 0.006); click(0.024, 0.04, 3400, 0.007); }
            else if (k === 'shatter') { slide(0, 0.14, 0.4, 7000, 900); for (let i = 0; i < 18; i++) glass(i * 0.022 + Math.random() * 0.01, rnd(2400, 6000), 0.014, 0.35); thump(0, 0.2, 90); }
            else if (k === 'clear') { [0, 7, 12, 16, 19].forEach((st, i) => glass(i * 0.05, 523 * Math.pow(2, st / 12), 0.04, 1.6)); for (let i = 0; i < 10; i++) glass(0.3 + i * 0.06, 2093 * Math.pow(2, SC[i % 8] / 12), 0.012, 0.4); }
        } catch (e) {}
    }
    // same 9-slice kit as fuse
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
        let plateC = pix(18, 18, [
            '.kkkkkkkkkkkkkkkk.', 'khhhhhhhhhhhhhhhhk', 'klbbbbbbbbbbbbbbbk', 'klbkkkbbbbbbkkkbdk', 'klbkskbbbbbbkosbdk', 'klbkokbbbbbbkkkbdk',
            'klbbbbbbbbbbbbbbdk', 'klbbbbbbbbbbbbbbdk', 'klbbbbbbbbbbbbbbdk', 'klbbbbbbbbbbbbbbdk', 'klbbbbbbbbbbbbbbdk', 'klbbbbbbbbbbbbbbdk',
            'klbbbbbbbbbbbbbbdk', 'klbkkbbbbbbbkkkbdk', 'klbkkbbbbbbbkswbdk', 'klbbbbbbbbbbkkkwdk', 'kddddddddddddddddk', '.kkkkkkkkkkkkkkkk.'], P0);
        const key = (B, Lt, Dk) => pix(10, 12, ['.kkkkkkkk.', 'kLLLLLLLLk', 'kLBBBBBBBk', 'kBBBBBBBBk', 'kBBBBBBBBk', 'kBBBBBBBBk', 'kBBBBBBBBk', 'kBBBBBBBBk', 'kDDDDDDDDk', 'kDDDDDDDDk', 'kDDDDDDDLk', '.kkkkkkkk.'], { k: '#07040b', B, L: Lt, D: Dk });
        let lcdC = pix(8, 8, ['kkkkkkkk', 'kaaaaaak', 'kcccccck', 'kaaaaaak', 'kcccccck', 'kaaaaaak', 'kkkkkkkk', 'oooooooo'], { k: '#07040b', a: '#08060c', c: '#0d0a13', o: '#3a3546' });
        let st = root.style;
        st.setProperty('--sl-plate', 'url(' + plateC.toDataURL() + ')');
        st.setProperty('--sl-key', 'url(' + key('#2a2633', '#4a4558', '#15121c').toDataURL() + ')');
        st.setProperty('--sl-keyon', 'url(' + key(theme.p, mix(theme.p, '#ffffff', 0.45), mix(theme.p, '#000000', 0.5)).toDataURL() + ')');
        st.setProperty('--sl-lcd', 'url(' + lcdC.toDataURL() + ')');
    }
    function logoDraw() {
        let c = root && root.querySelector('.sl-logo'), g = spr('logo', { c: '#ffffff', w: '#ffffff', o: '#ffffff' }); if (!c || !g) return;
        if (c.width !== g.width + 6) { c.width = g.width + 6; c.height = g.height + 6; }
        let x = c.getContext('2d'), now = S ? S.now : 0, hot = !calm() && (now % 4.2) < 0.18;
        x.imageSmoothingEnabled = false; x.clearRect(0, 0, c.width, c.height);
        const tint = col => spr('logo', { c: col, w: col, o: col });
        x.globalAlpha = 0.85; x.drawImage(tint('#07040b'), 4, 5);
        if (hot) { x.globalAlpha = 0.7; x.drawImage(tint('#ff2a55'), 1, 3); x.drawImage(tint('#2ad8ff'), 5, 3); }
        x.globalAlpha = 1;
        for (let j = 0; j < g.height; j++) {
            let dx = hot && Math.random() < 0.25 ? Math.round((Math.random() - 0.5) * 6) : 0, col = j < 2 ? '#ffffff' : j < 6 ? mix(theme.s, '#ffffff', 0.35) : j < 10 ? theme.s : theme.p;
            x.drawImage(tint(col), 0, j, g.width, 1, 3 + dx, 3 + j, g.width, 1);
        }
    }
    function show(kind) {
        let ov = root && root.querySelector('.sl-ov'); if (!ov) return;
        readTheme(1e12); skin();
        ov.hidden = false; ov.dataset.k = kind; root.querySelector('.sl-stage').dataset.k = kind;
        const hintLine = () => `<p class="sl-hint">${esc(touchy() ? LE('hintTouch') : LE('hint'))}</p>`;
        if (kind === 'menu') {
            if (S) S.state = 'menu';
            let pickM = MODES.indexOf(D.mode) >= 0 ? D.mode : 'one', m = mode(pickM);
            ov.innerHTML = `<div class="sl-card sl-menu"><canvas class="sl-logo" aria-label="${esc(LE('title', 0, 'ソリティア | SOLITAIRE'))}"></canvas><div class="sl-kind"><b>${esc(LJ('title', 0, 'ソリティア | SOLITAIRE'))}</b><span>${esc(L('kind', 0, 'クロンダイク | KLONDIKE'))}</span></div><p class="sl-sub">${esc(LE('sub'))}</p>`
                + `<div class="sl-modes">${MODES.map(id => { let x = mode(id), d = D.m[id]; return `<button class="sl-mode${id === pickM ? ' on' : ''}" data-m="${id}"><b>${esc(x.jp)}</b><span>${esc(x.en)}</span><em>${d.bestT ? esc(clock(d.bestT)) : '-'}</em></button>`; }).join('')}</div>`
                + `<p class="sl-what">${esc(m.sub)}</p>`
                + `<p class="sl-rec">${esc(L('wins', D.m[pickM].won + '/' + D.m[pickM].played, '勝ち {n} | {n} won'))}${D.m[pickM].bestStreak > 1 ? ', ' + esc(L('bestStreak', D.m[pickM].bestStreak, '最高 {n}連勝 | best streak {n}')) : ''}</p>`
                + `<button class="sl-go">${esc(L('start', 0, '配る | DEAL'))}</button>${hintLine()}</div>`;
            ov.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { snd('tick'); D.mode = b.dataset.m; saveD(); show('menu'); });
            ov.querySelector('.sl-go').onclick = () => go(pickM);
            logoDraw();
            return;
        }
        if (kind === 'pause') {
            ov.innerHTML = `<div class="sl-card sl-small"><div class="sl-big">${esc(L('paused', 0, '一時停止 | PAUSED'))}</div><div class="sl-row"><button class="sl-btn hot" data-a="resume">${esc(L('resume', 0, '再開 | RESUME'))}</button><button class="sl-btn" data-a="end">${esc(L('end', 0, 'やめる | QUIT'))}</button></div>${hintLine()}</div>`;
            ov.querySelector('[data-a="resume"]').onclick = () => pause(false);
            ov.querySelector('[data-a="end"]').onclick = () => { giveUp(); show('menu'); preview(); };
            return;
        }
        if (kind === 'done') {
            let d = D.m[S.mode], top = d.top;
            ov.innerHTML = `<div class="sl-card sl-done"><div class="sl-big win">${esc(L('won', 0, 'クリア | CLEARED'))}</div>`
                + `<div class="sl-score">${esc(S.score)}</div>${S.place === 1 ? `<div class="sl-new">${esc(L('newBest', 0, '新記録 | NEW BEST'))}</div>` : ''}`
                + `<dl class="sl-stats"><div><dt>${esc(LJ('time', 0, '時間 | TIME'))}<br>${esc(LE('time', 0, '時間 | TIME'))}</dt><dd class="${S.recT ? 'gold' : ''}">${esc(clock(S.t))}</dd></div><div><dt>${esc(LJ('moves', 0, '手数 | MOVES'))}<br>${esc(LE('moves', 0, '手数 | MOVES'))}</dt><dd class="${S.recM ? 'gold' : ''}">${S.moves}</dd></div><div><dt>${esc(LJ('bonus', 0, 'タイムボーナス | time bonus'))}<br>${esc(LE('bonus', 0, 'タイムボーナス | time bonus'))}</dt><dd>${S.bonus || '-'}</dd></div></dl>`
                + (d.streak > 1 ? `<div class="sl-streak">${esc(L('streak', d.streak, '{n}連勝 | {n} in a row'))}</div>` : '')
                + (top.length ? `<ol class="sl-top">${top.map((e, i) => `<li class="${S.place === i + 1 ? 'me' : ''}"><span>${i + 1}</span><b>${esc(e.s)}</b><small>${esc(clock(e.t))}  ${esc(e.d || '')}</small></li>`).join('')}</ol>` : '')
                + `<div class="sl-row"><button class="sl-btn hot" data-a="again">${esc(L('again', 0, 'もう一回 | DEAL AGAIN'))}</button><button class="sl-btn" data-a="modes">${esc(L('modes', 0, 'モード | MODES'))}</button></div></div>`;
            ov.querySelector('[data-a="again"]').onclick = () => go(S.mode);
            ov.querySelector('[data-a="modes"]').onclick = () => { show('menu'); preview(); };
        }
    }
    function hide() { let ov = root && root.querySelector('.sl-ov'); if (ov) { ov.hidden = true; ov.innerHTML = ''; ov.dataset.k = ''; } let st = root && root.querySelector('.sl-stage'); if (st) st.dataset.k = 'play'; }
    function go(m, seed) { giveUp(); hide(); newGame(m, seed); btns(); }
    function preview() { newGame(D.mode, 4444); S.state = 'menu'; S.dealEnd = 0; S.piles.forEach(p => p.cards.forEach(c => { c.wait = 0; c.fa = 1; })); }
    function pause(on) {
        if (!S) return;
        if (on && S.state === 'play') { S.state = 'pause'; show('pause'); }
        else if (!on && S.state === 'pause') { S.state = 'play'; hide(); lastT = 0; }
        btns();
    }
    function mute() { D.muted = !D.muted; saveD(); btns(); }
    function btns() {
        if (!root) return;
        let q = s => root.querySelector('[data-b="' + s + '"]');
        let playing = S && (S.state === 'play' || S.state === 'pause');
        ['undo', 'hint', 'new'].forEach(k => { let b = q(k); if (b) b.hidden = !playing; });
        let p = q('pause'); if (p) { p.hidden = !playing; p.textContent = S && S.state === 'pause' ? '▶' : 'Ⅱ'; }
        let m = q('mute'); if (m) m.textContent = D.muted ? '×' : '♪';
        let u = q('undo'); if (u) { u.textContent = LJ('undo', 0, '戻す | UNDO'); u.title = LE('undo', 0, '戻す | UNDO'); }
        let h = q('hint'); if (h) { h.textContent = LJ('hintB', 0, 'ヒント | HINT'); h.title = LE('hintB', 0, 'ヒント | HINT'); }
        let n = q('new'); if (n) { n.textContent = LJ('newDeal', 0, '配り直す | NEW DEAL'); n.title = LE('newDeal', 0, '配り直す | NEW DEAL'); }
    }
    const touchy = () => matchMedia('(any-pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches;
    function onKey(e) {
        if (!S || asleep || !root || !root.closest('.is-active')) return;
        if (/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
        let k = e.key;
        if (S.state === 'menu') {
            if (k === 'Enter') { e.preventDefault(); go(D.mode); }
            else if (k === 'ArrowUp' || k === 'ArrowDown') { e.preventDefault(); D.mode = D.mode === 'one' ? 'three' : 'one'; saveD(); snd('tick'); show('menu'); }
            return;
        }
        if (S.state === 'won') { if (k === 'Enter' || k === 'n' || k === 'N') go(S.mode); return; }
        if (k === 'p' || k === 'P') pause(S.state === 'play');
        else if (k === 'm' || k === 'M') mute();
        if (S.state !== 'play') return;
        if (k === 'z' || k === 'Z' || k === 'Backspace') { e.preventDefault(); undo(); }
        else if (k === 'h' || k === 'H') hint();
        else if (k === 'n' || k === 'N') go(S.mode);
        else if (k === ' ' || k === 'd' || k === 'D') { e.preventDefault(); draw(); }
    }

    function styles() {
        let st = document.createElement('style');
        st.textContent = `
            .gg-game[data-game="solitaire"] { padding: 0; }
            .sl { position: relative; height: 100%; }
            .sl-stage { position: absolute; inset: 0; display: grid; place-items: center; overflow: hidden; touch-action: none; -webkit-user-select: none; user-select: none; }
            .sl-box { position: relative; }
            .sl-box::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0 1px, transparent 1px 3px); mix-blend-mode: multiply; }
            .sl-cv { display: block; image-rendering: pixelated; }
            .sl-ov { position: absolute; inset: 0; display: grid; place-items: center; z-index: 3; background: rgba(4, 2, 8, 0.62); }
            .sl-ov[hidden] { display: none; }
            .sl-card, .sl-mode b, .sl-mode em, .sl-what, .sl-go, .sl-score, .sl-stats > div, .sl-top, .sl-btn, .sl-keys button { image-rendering: pixelated; }
            .sl-card { position: relative; font-family: 'DotGothic16', monospace; color: #cfcbd6; max-height: calc(100% - 20px); overflow: auto; scrollbar-width: none; box-sizing: border-box; padding: 4px 8px 2px;
                border: 12px solid transparent; border-image: var(--sl-plate) 6 fill / 12px stretch; filter: drop-shadow(5px 5px 0 rgba(0,0,0,0.55)); }
            .sl-menu, .sl-done { width: min(330px, 92%); }
            .sl-logo { display: block; width: 100%; image-rendering: pixelated; margin: 4px 0 2px; }
            .sl-kind { display: flex; flex-direction: column; gap: 1px; padding: 0 2px; }
            .sl-kind b { font-weight: normal; font-size: 17px; letter-spacing: 4px; color: #fff; text-shadow: 2px 2px 0 #07040b; white-space: nowrap; }
            .sl-kind span { font-size: 11px; letter-spacing: 2px; color: var(--neon-secondary); }
            .sl-ov[data-k="menu"] { background: linear-gradient(90deg, rgba(4,2,8,0.92) 0 40%, rgba(4,2,8,0.08) 56%); justify-items: start; padding-left: 5%; }
            .sl-ov[data-k="done"] { background: rgba(4,2,8,0.3); align-items: end; padding-bottom: 2%; }
            .sl-done { max-height: 72%; }
            .sl-sub { margin: 6px 0 10px; font-size: 11px; line-height: 1.5; color: #8f8b9a; }
            .sl-modes { display: flex; flex-direction: column; gap: 4px; }
            .sl-mode { display: grid; grid-template-columns: 58px 1fr auto; align-items: center; gap: 8px; padding: 0; background: none; border: 0; color: #a9a3b8; font: inherit; font-size: 12px; letter-spacing: 2px; text-align: left; cursor: inherit; }
            .sl-mode b { display: grid; place-items: center; height: 16px; font-weight: normal; font-size: 14px; line-height: 14px; white-space: nowrap; color: #cfcbd6; border: 8px solid transparent; border-image: var(--sl-key) 4 fill / 8px stretch; }
            .sl-mode em { min-width: 44px; padding: 0 2px; font-style: normal; font-size: 12px; text-align: right; color: #6f6a7c; border: 6px solid transparent; border-image: var(--sl-lcd) 3 fill / 6px repeat; }
            .sl-mode:hover, .sl-mode.on { color: #fff; }
            .sl-mode.on b { color: #07040b; border-image-source: var(--sl-keyon); transform: translateY(2px); }
            .sl-mode.on em { color: #ffe27a; }
            .sl-what { margin: 10px 0 6px; padding: 1px 3px; font-size: 11px; line-height: 1.5; color: var(--neon-secondary); border: 6px solid transparent; border-image: var(--sl-lcd) 3 fill / 6px repeat; }
            .sl-rec { margin: 0 0 10px; font-size: 10px; color: #6f6a7c; }
            .sl-go { display: block; width: 100%; padding: 1px 0 3px; border: 8px solid transparent; border-image: var(--sl-keyon) 4 fill / 8px stretch; background: none; color: #07040b; font: inherit; font-size: 15px; letter-spacing: 3px; cursor: inherit; }
            .sl-go:active, .sl-btn:active { transform: translateY(2px); }
            .sl-hint { margin: 8px 0 0; font-size: 10px; line-height: 1.5; color: #5b5670; }
            .sl-small, .sl-done { text-align: center; }
            .sl-small { max-width: min(360px, 92%); }
            .sl-big { font-size: 14px; letter-spacing: 3px; color: #ff5a6a; text-shadow: 2px 2px 0 #07040b; }
            .sl-big.win { color: var(--neon-secondary); }
            .sl-score { margin: 8px 0 0; padding: 0 4px; font-size: 40px; line-height: 1.05; color: #ffe27a; text-align: right; border: 6px solid transparent; border-image: var(--sl-lcd) 3 fill / 6px repeat; font-variant-numeric: tabular-nums; }
            .sl-new { display: inline-block; margin-top: 8px; padding: 1px 8px; font-size: 12px; color: #07040b; background: #ffd04a; transform: rotate(-3deg); box-shadow: 2px 2px 0 #07040b; }
            .sl-stats { display: flex; gap: 4px; margin: 10px 0 0; }
            .sl-stats > div { flex: 1; padding: 0 2px; border: 6px solid transparent; border-image: var(--sl-lcd) 3 fill / 6px repeat; }
            .sl-stats dt { font-size: 10px; line-height: 1.3; color: #6f6a7c; } .sl-stats dd { margin: 3px 0 0; font-size: 17px; color: #fff; } .sl-stats dd.gold { color: #ffd04a; }
            .sl-streak { margin-top: 8px; font-size: 12px; color: var(--neon-secondary); }
            .sl-top { list-style: none; margin: 6px 0 0; padding: 0; font-size: 11px; text-align: left; max-height: 112px; overflow: auto; scrollbar-width: none; border: 6px solid transparent; border-image: var(--sl-lcd) 3 fill / 6px repeat; }
            .sl-top li { display: grid; grid-template-columns: 22px 1fr auto; gap: 6px; padding: 1px 4px; } .sl-top li span, .sl-top li small { color: #5b5670; }
            .sl-top li.me { color: #ffe27a; background: rgba(255,226,122,0.08); }
            .sl-row { display: flex; gap: 8px; justify-content: center; margin-top: 10px; }
            .sl-btn { padding: 0 6px 2px; white-space: nowrap; border: 8px solid transparent; border-image: var(--sl-key) 4 fill / 8px stretch; background: none; color: #cfcbd6; font: inherit; font-size: 12px; cursor: inherit; }
            .sl-btn.hot { border-image-source: var(--sl-keyon); color: #07040b; }
            .sl-keys { position: absolute; z-index: 2; display: flex; flex-wrap: wrap; gap: 3px; pointer-events: none; }
            .sl-keys.tall { right: 4px; bottom: 4px; justify-content: flex-end; }
            .sl-keys button { pointer-events: auto; min-width: 22px; height: 22px; padding: 0 3px 2px; border: 6px solid transparent; border-image: var(--sl-key) 4 fill / 6px stretch; background: none; color: #cfcbd6; font: 11px/1 'DotGothic16', monospace; cursor: inherit; white-space: nowrap; }
            .sl-keys button:active { transform: translateY(1px); }
            .sl-keys button[hidden] { display: none; }
            .sl-stage[data-k="menu"] .sl-keys, .sl-stage[data-k="done"] .sl-keys { visibility: hidden; }
            @media (max-width: 760px) { .sl-ov[data-k="menu"] { justify-items: center; padding-left: 0; background: rgba(4,2,8,0.75); } }
            @media (pointer: coarse) { .sl-keys { gap: 6px; } .sl-keys button { min-width: 38px; height: 34px; font-size: 14px; } .sl-mode b { height: 22px; } .sl-modes { gap: 6px; } .sl-btn { padding: 4px 10px 6px; } }
        `;
        document.head.appendChild(st);
        return st;
    }

    function init() {
        cv = root.querySelector('.sl-cv'); sx = cv.getContext('2d');
        buf = document.createElement('canvas'); bx = buf.getContext('2d');
        trl = document.createElement('canvas'); tl = trl.getContext('2d');
        tmp = document.createElement('canvas'); tmp.width = CW; tmp.height = CH; tx = tmp.getContext('2d'); tx.imageSmoothingEnabled = false;
        loadD(); readTheme(1e12);
        layout(); preview(); show('menu'); btns();
        let st = root.querySelector('.sl-stage');
        ro = new ResizeObserver(() => { layout(); }); ro.observe(st);
        cv.addEventListener('pointerdown', down);
        cv.addEventListener('pointermove', moveP);
        cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
        cv.addEventListener('pointerleave', () => { if (S) S.hover = null; });
        cv.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); });
        let q = s => root.querySelector('[data-b="' + s + '"]');
        q('undo').onclick = undo; q('hint').onclick = hint; q('new').onclick = () => go(S.mode);
        q('pause').onclick = () => pause(S && S.state === 'play'); q('mute').onclick = mute;
        document.addEventListener('keydown', onKey);
        lastT = 0; raf = requestAnimationFrame(frame);
    }
    function stopAll() { cancelAnimationFrame(raf); raf = 0; }

    os.gg = os.gg || {}; os.gg.hooks = os.gg.hooks || {};
    os.gg.hooks.solitaire = {
        start(el) {
            root = el; asleep = false;
            style = styles();
            el.innerHTML = '<div class="sl"><div class="sl-stage" data-k="menu"><div class="sl-box"><div class="sl-keys"><button data-b="undo"></button><button data-b="hint"></button><button data-b="new"></button><button data-b="pause" aria-label="pause">Ⅱ</button><button data-b="mute" aria-label="sound">♪</button></div><canvas class="sl-cv"></canvas></div><div class="sl-ov" hidden></div></div></div>';
            init();
        },
        pause() { asleep = true; if (S && S.state === 'play') pause(true); stopAll(); },
        resume() { if (!asleep) return; asleep = false; lastT = 0; stopAll(); raf = requestAnimationFrame(frame); },
        best() { loadD(); let t = MODES.map(m => D.m[m].bestT).filter(Boolean); return t.length ? clock(Math.min(...t)) : 0; },
        scores() { loadD(); return MODES.map(id => { let m = mode(id); return { t: m.jp + ' ' + m.en, rows: D.m[id].top.map((e, i) => [i + 1, e.s, clock(e.t) + '  ' + (e.d || '')]) }; }).filter(b => b.rows.length); },
        stop() {
            stopAll();
            document.removeEventListener('keydown', onKey);
            if (ro) ro.disconnect();
            if (style) style.remove();
            if (root) root.innerHTML = '';
            face = {}; backC = null; bgC = null;
            S = null; cv = null; sx = null; buf = null; bx = null; trl = null; tl = null; tmp = null; tx = null; root = null; style = null; ro = null; LY = null;
            delete os.sol; delete os.gg.hooks.solitaire;
        }
    };
    // testing, dont touch
    os.sol = {
        snd,
        raw: () => S, data: () => D, lay: () => LY, ff: n => { for (let i = 0; i < n; i++) { tick(1 / 60); drawScene(0); } }, go, show, hide, draw, undo, hint, moves, move, freeze: () => stopAll(), step: (n, dt) => { for (let i = 0; i < (n || 1); i++) tick(dt || 1 / 30); readTheme(1e12); paint(performance.now()); }, tick: n => { for (let i = 0; i < (n || 1); i++) tick(1 / 60); },
        bot(max) {
            let stale = 0, steps = 0;
            while (S.state === 'play' && steps < (max || 2000)) {
                steps++;
                if (S.auto) { autoStep(); continue; }
                let m = moves()[0];
                if (m && stale < 200) { move(m.from, m.idx, m.to, true); stale = 0; continue; }
                if (!P('stock').cards.length && !P('waste').cards.length) break;
                draw(); stale++;
                if (stale > (P('stock').cards.length + P('waste').cards.length) * 2 + 4) break;
            }
            return { steps, won: S.won, found: founds().map(f => f.cards.length) };
        }
    };
})();
