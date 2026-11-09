// Rubber duck debugging. You explain your bug to the duck and work it out yourself halfway through the sentence. It genuinely works, I do it all the time
// nothing you type gets kept anywhere. its a duck
window.os = window.os || {};

(function () {
    const T = (k, d) => (typeof window.T === 'function' ? window.T(k, d) : d);
    const $ = id => document.getElementById(id);
    const wait = ms => new Promise(r => setTimeout(r, ms));
    let busy = false, bubT = 0;

    // the duck. pixel art but drawn from shapes every frame so i can squish it
    const W = 64, H = 50, WL = 38;
    const hx = h => { let n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
    const Y = ['#8a3410', '#c75a16', '#ec8a1a', '#ffbf22', '#ffe04c', '#fff3a8', '#ffffff'].map(hx);
    const BK = ['#7a2410', '#c84a16', '#ff7a22', '#ffa95a', '#ffd6a0'].map(hx);
    const OUT = { dark: hx('#3e1408'), mid: hx('#6e2a0c'), lite: hx('#a8521a') };
    const inEll = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
    const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { let [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
    const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
    // fake lighting, top left
    const shadeE = (u, v) => { let e = u * u + v * v; return 0.66 - 0.36 * v - 0.2 * u - 0.75 * Math.max(0, e - 0.55); };
    const band = l => l > 0.9 ? 5 : l > 0.66 ? 4 : l > 0.4 ? 3 : l > 0.14 ? 2 : 1;

    function shape(s) {
        let sq = s.sq || 0, by = WL - 7.5 + (s.bob || 0) + sq * 2 - (s.hop || 0);
        // head centre sits on a pixel corner or the circle comes out lumpy
        let hy = Math.round(by - 14 + (s.nod || 0) + sq * 3 + (s.hlag || 0));
        let body = { cx: 26, cy: by, rx: 14.5 * (1 + sq * 0.08), ry: 10.5 * (1 - sq * 0.12) };
        let chest = { cx: 34, cy: by - 1.5, rx: 10, ry: 9.5 * (1 - sq * 0.12) };
        let head = { cx: 37 + (s.lean || 0) + (s.sway || 0), cy: hy, r: 8.5, a: s.ha || 0, back: s.back ? -1 : 1 };
        let wing = { cx: 23, cy: by + 0.5, rx: 8.5, ry: 4.6, a: -(s.wf || 0) };
        let tw = s.tw || 0;
        let tail = [[body.cx - 11, by + 2], [body.cx - 18 + tw, by - 11 + Math.abs(tw) * 0.6], [body.cx - 15.6 + tw, by - 12 + Math.abs(tw) * 0.6], [body.cx - 6, by - 6]];
        let g = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            let px = x + 0.5, py = y + 0.5, m = null, l = 0;
            let [hu, hv] = rot(px - head.cx, py - head.cy, -head.a); hu *= head.back;
            let bTop = inEll(hu, hv, 9.6, 2, 5.4, 2.3) && hu > 5, bLow = inEll(hu, hv, 8.8, 4.3 + (s.open || 0), 4.4, 1.7) && hu > 5;
            if (bTop) { m = 'beak'; l = 0.75 - (hv - 1) * 0.25 - (hu - 10) * 0.03; }
            else if (bLow) { m = 'beakL'; l = 0.2; }
            else if (hu * hu + hv * hv <= head.r * head.r) { m = 'head'; let [u, v] = rot(hu * head.back, hv, head.a); l = shadeE(u / head.r, v / head.r); }
            else if (inEll(px, py, body.cx, body.cy, body.rx, body.ry) || inEll(px, py, chest.cx, chest.cy, chest.rx, chest.ry)) {
                let inC = inEll(px, py, chest.cx, chest.cy, chest.rx, chest.ry) && px > body.cx + 3, e = inC ? chest : body;
                l = shadeE((px - e.cx) / e.rx, (py - e.cy) / e.ry);
                let [wu, wv] = rot(px - (wing.cx + wing.rx * 0.7), py - wing.cy, -wing.a); wu += wing.rx * 0.7;
                let tip = inEll(wu, wv, -7.4, 1.6, 2.8, 1.15) || inEll(wu, wv, -6.2, 3.3, 2.4, 1);
                if ((inEll(wu, wv, 0, 0, wing.rx, wing.ry) && wv > -3.2) || tip) { m = 'wing'; l = 0.74 - 0.36 * (wv / wing.ry) - 0.14 * (wu / wing.rx); }
                else m = 'body';
            }
            else if (inPoly(px, py, tail)) { m = 'body'; l = 0.5 + (by - 6 - py) * 0.03 - (px - (body.cx - 14)) * 0.02; }
            g.push(m ? { m, l } : null);
        }
        return { g, head, by };
    }
    const glyph = (put, rows, x, y, c, a) => rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '1') put(x + i, y + j, c, a); }));

    function paint(ctx, s, tc) {
        let img = ctx.createImageData(W, H), d = img.data, { g, head, by } = shape(s);
        const at = (x, y) => x < 0 || y < 0 || x >= W || y >= H ? null : g[y * W + x];
        const put = (x, y, c, a) => { if (x < 0 || y < 0 || x >= W || y >= H) return; let i = (y * W + x) * 4, k = a == null ? 1 : Math.max(0, Math.min(1, a)), a0 = d[i + 3] / 255, out = k + a0 * (1 - k); if (out <= 0) return; for (let j = 0; j < 3; j++) d[i + j] = (c[j] * k + d[i + j] * a0 * (1 - k)) / out; d[i + 3] = out * 255; };
        // splash. foam goes over its bum, the crests start behind it
        let wl = [255, 255, 255].map((v, k) => v * 0.68 + tc[k] * 0.32), wm = [235, 240, 248].map((v, k) => (v * 0.38 + tc[k] * 0.62) * 0.92);
        const CREST = [['..1..', '.121.', '12221'], ['.1.', '121'], ['121']];
        let spl = (s.plops || []).map(p => p.age);
        spl.forEach(age => {
            let f = age / 80, h = f < 2 ? 0 : f < 4 ? 1 : 2, c = CREST[h], w = c[0].length, off = Math.round(f * 2.3);
            [[42 + off, 1], [15 - off, -1]].forEach(([x0, side]) => c.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') put(x0 + side * i - (side > 0 ? 0 : w - 1) * 0, WL - c.length + j, ch === '1' ? wl : wm, f > 6 ? 1 - (f - 6) / 2 : 1); })));
        });
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            let p = g[y * W + x]; if (!p) continue;
            let c;
            if (p.m === 'beak') c = BK[p.l > 0.8 ? 4 : p.l > 0.55 ? 3 : p.l > 0.25 ? 2 : 1];
            else if (p.m === 'beakL') c = BK[1];
            else if (p.m === 'wing') c = Y[Math.max(2, Math.min(4, band(p.l)))];
            else c = Y[band(p.l)];
            put(x, y, c);
        }
        for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
            let p = at(x, y), up = at(x, y - 1), dn = at(x, y + 1), lf = at(x - 1, y), rt = at(x + 1, y); if (!p) continue;
            if (p.m === 'wing' && up && up.m === 'body') put(x, y - 1, Y[5]);
            if (p.m === 'body' && up && up.m === 'wing') put(x, y, OUT.lite);
            if (p.m === 'body' && rt && rt.m === 'wing' && !(up && up.m === 'wing')) put(x, y, Y[2]);
            if (p.m === 'wing' && lf && lf.m === 'body') put(x, y, Y[2]);
            if (p.m === 'body' && up && up.m === 'head' && at(x - 1, y - 1) && at(x - 1, y - 1).m === 'head' && at(x + 1, y - 1) && at(x + 1, y - 1).m === 'head') put(x, y, Y[2]);
        }
        // outlines. black ones made it look like a sticker
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            if (at(x, y)) continue;
            let nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => at(x + a, y + b)).filter(Boolean); if (!nb.length) continue;
            let c = (at(x, y - 1) || at(x - 1, y)) ? OUT.dark : at(x, y + 1) ? OUT.lite : OUT.mid;
            if (nb.some(q => q.m === 'beak' || q.m === 'beakL')) c = hx('#5e180a');
            put(x, y, c);
        }
        const hp = (u, v) => { let [a, b] = [u * head.back, v]; let [x, y] = [a * Math.cos(head.a) - b * Math.sin(head.a), a * Math.sin(head.a) + b * Math.cos(head.a)]; return [Math.round(head.cx + x - 0.5), Math.round(head.cy + y - 0.5)]; };
        let [ex, ey] = hp(2.6, -2.6), lid = hx('#3a1408');
        if (s.sleep || s.blink === 2) [-1, 0, 1, 2].forEach(a => put(ex + a, ey + 1, lid));
        else if (s.happy) glyph(put, ['0110', '1001'], ex - 1, ey, lid);
        else {
            let half = s.blink === 1;
            const WHITE = [[0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [2, 1], [-1, 2], [0, 2], [1, 2], [2, 2], [0, 3], [1, 3]];
            WHITE.forEach(([a, b]) => { if (!half || b >= 1) put(ex + a, ey + b, hx('#fffaf0')); });
            // pupil only goes straight up / down / left / right. diagonal = it fell out the eye
            let ox = Math.sign((s.lx || 0) * head.back), oy = Math.sign(s.ly || 0); if (ox && oy) oy = 0;
            let lx = ex + ox, ly = ey + oy;
            [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]].forEach(([a, b]) => { if (!half || b >= 1) put(lx + a, ly + b, hx('#140c10')); });
            if (!half) put(lx, ly, hx('#ffffff'));
            if (half) [-1, 0, 1, 2].forEach(a => put(ex + a, ey, Y[2]));
        }
        let bl = s.blush ? hx('#ff6f7a') : hx('#ff9a4a'), [cx, cy] = hp(4.6, 2.4);
        put(cx, cy, bl, s.blush ? 0.9 : 0.5); put(cx + head.back, cy, bl, s.blush ? 0.9 : 0.5);
        if (s.open) for (let k = 6; k < 14; k++) { let [x, y] = hp(k, 3.4); put(x, y, hx('#4a0c08')); }
        let [sx, sy] = hp(-3.6, -5.2);
        glyph(put, ['0110', '1110', '0100'], sx - 1, sy - 1, Y[6]);
        glyph(put, ['111100', '011111'], 13, Math.round(by - 8), Y[5]); put(15, Math.round(by - 8), Y[6]); put(16, Math.round(by - 8), Y[6]);
        spl.forEach(age => {
            let fr = age / 105 | 0, amp = [2, 2, 1, 1, 0][Math.min(4, fr)] || 0;
            for (let x = 12; x <= 46; x++) {
                let h = Math.round(amp * (0.45 + 0.55 * Math.abs(x - 29) / 17));
                for (let j = 0; j < h; j++) { if ((x * 13 + j * 7 + fr * 5) % (fr > 2 ? 3 : 5) === 0) continue; put(x, WL - 1 - j, j === h - 1 ? wl : wm, fr > 3 ? 0.6 : 1); }
            }
        });
        if (s.flip) for (let y = 0; y < WL; y++) for (let x = 0; x < W / 2; x++) { let a = (y * W + x) * 4, b = (y * W + (W - 1 - x)) * 4; for (let k = 0; k < 4; k++) { let v = d[a + k]; d[a + k] = d[b + k]; d[b + k] = v; } }
        const ef = x => Math.max(0, 1 - Math.pow(Math.abs(x - 31.5) / 32, 3));
        let t = s.t || 0, hop = s.hop || 0;
        for (let y = WL; y < H; y++) for (let x = 0; x < W; x++) {
            let i = (y * W + x) * 4, dd = (y - WL) / (H - WL), base = [10 + tc[0] * 0.08, 8 + tc[1] * 0.08, 18 + tc[2] * 0.12];
            let ry = WL - (y - WL) - 1 - hop * 2, rx = x + Math.round(Math.sin(y * 0.9 + t * 4) * 1.2), c = base;
            if (rx >= 0 && rx < W && ry >= 0 && (y & 1) === 0) { let j = (ry * W + rx) * 4; if (d[j + 3] > 0) c = base.map((v, k) => v * 0.5 + d[j + k] * 0.45 * (1 - dd)); }
            if (y < WL + 3 && x > 11 && x < 49 && !hop) c = c.map(v => v * 0.6);
            d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255 * (1 - dd * 0.65) * ef(x);
        }
        for (let x = 0; x < W; x++) {
            put(x, WL, Math.sin(x * 0.55 + t * 3) > 0.55 ? tc.map(v => Math.min(255, v * 0.7 + 90)) : tc.map(v => v * 0.45), ef(x));
            if (Math.sin(x * 0.33 - t * 2.2 + 1) > 0.92) put(x, WL + 3, tc.map(v => v * 0.6 + 40), 0.8);
            if (Math.sin(x * 0.27 + t * 1.7 + 3) > 0.94) put(x, WL + 6, tc.map(v => v * 0.5 + 30), 0.6);
        }
        if (s.rip > 0) for (let a = 0; a < 6.283; a += 0.04) { let x = Math.round(30 + Math.cos(a) * s.rip * 1.8), y = Math.round(WL + 2 + Math.sin(a) * s.rip * 0.35); if (y >= WL) put(x, y, tc.map(v => v * 0.6 + 80), Math.max(0, 0.6 - s.rip / 30)); }
        const dry = (x, y) => !(y < WL && at(s.flip ? W - 1 - x : x, y));
        (s.drops || []).forEach(p => {
            let x = Math.round(p.x), y = Math.round(p.y);
            if (p.ring != null) { let r = 1 + Math.round(p.ring * 3); [-r, r].forEach(k => put(x + k, WL + 1, wl, 0.8 - p.ring * 0.7)); return; }
            if (dry(x, y)) put(x, y, wl); if (p.vy < -0.5 && dry(x, y + 1)) put(x, y + 1, wm, 0.8);
        });
        let hx2 = s.flip ? W - 1 - Math.round(head.cx) : Math.round(head.cx);
        for (let k = 0; k < (s.dots || 0); k++) glyph(put, ['11', '11'], hx2 - 4 + k * 4, Math.round(head.cy) - 14, hx('#fff4e6'));
        if (s.sleep) for (let k = 0; k < 3; k++) { let ph = (t * 0.5 + k / 3) % 1; glyph(put, ['1111', '0010', '0100', '1111'], hx2 + 6 + k * 2 + Math.round(ph * 5), Math.round(head.cy - 8 - ph * 16), tc.map(v => Math.min(255, v * 0.5 + 130)), 1 - ph); }
        ctx.putImageData(img, 0, 0);
    }
    let D = { t: 0, bob: 0, hlag: 0, blink: 0, nod: 0, lean: 0, lx: 0, ly: 0, sq: 0, open: 0, rip: 0, tw: 0, sway: 0, hop: 0, flip: 0, happy: 0, sleep: 0, dots: 0, blush: 0, ha: 0, back: 0, wf: 0, drops: [], plops: [] };
    const nc = document.createElement('canvas').getContext('2d');
    function theme() { nc.fillStyle = '#ff0099'; nc.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--neon-primary').trim() || '#ff0099'; let v = nc.fillStyle; return v[0] === '#' ? hx(v) : (v.match(/[\d.]+/g) || [255, 0, 153]).slice(0, 3).map(Number); }
    const seq = steps => steps.forEach(([ms, fn]) => setTimeout(fn, ms));
    function splash(n) {
        D.plops.push({ age: 0 });
        [[43, 1], [14, -1]].forEach(([x0, side]) => { for (let i = 0; i < Math.max(1, n / 4 | 0); i++) D.drops.push({ x: x0 + side * i, y: WL - 3, vx: side * (1.4 + Math.random() * 0.8), vy: -1.6 - Math.random() * 1.2 }); });
    }

    // stuff it does when its bored. TODO more of these
    const IDLE = [
        () => seq([[0, () => { D.lx = -1; D.ly = 0; }], [700, () => { D.lx = 1; }], [1400, () => { D.lx = 0; }]]),
        () => seq([0, 110, 220, 330, 440, 550, 660].map((ms, i) => [ms, () => { D.tw = i === 6 ? 0 : i % 2 ? 1 : -1; }])),
        // preen
        () => seq([[0, () => { D.back = 1; D.lean = -3; }], [180, () => { D.ha = 0.32; D.nod = 2; D.wf = 0.18; }], [420, () => { D.ha = 0.42; }], [600, () => { D.ha = 0.3; }], [780, () => { D.ha = 0.42; }], [1000, () => { D.ha = 0; D.nod = 0; D.wf = 0; }], [1150, () => { D.back = 0; D.lean = 0; }]]),
        () => seq([[0, () => { D.sq = 0.6; }], [120, () => { D.sq = 0; D.hop = 2; D.wf = 0.45; }], [220, () => { D.hop = 4; D.wf = 0.1; }], [320, () => { D.hop = 3; D.wf = 0.45; }], [420, () => { D.hop = 1; D.wf = 0.1; }], [500, () => { D.hop = 0; D.sq = 0.5; D.wf = 0; splash(8); ripT = performance.now(); }], [620, () => { D.sq = 0; }]]),
        // shakes off like it just got out the bath
        () => seq([0, 70, 140, 210, 280, 350, 420].map((ms, i) => [ms, () => { D.sway = i === 6 ? 0 : i % 2 ? 1 : -1; D.ha = i === 6 ? 0 : i % 2 ? 0.1 : -0.1; D.wf = i === 6 ? 0 : 0.25; if (i === 3) splash(10); }])),
        // looks behind it at nothing. creepy
        () => seq([[0, () => { D.back = 1; D.lean = -2; }], [1300, () => { D.back = 0; D.lean = 0; }]]),
        () => seq([[0, () => { D.ha = -0.22; }], [900, () => { D.ha = 0; }]])
    ];
    // 12fps is plenty for pixel art
    let looping = false, nextBlink = 0, ripT = 0, nextIdle = 0, lastSeen = 0, lookT = 0;
    function poke() { lastSeen = performance.now(); if (D.sleep) { D.sleep = 0; D.ha = 0; D.nod = 0; D.hop = 2; D.wf = 0.4; setTimeout(() => { D.hop = 0; D.wf = 0; splash(5); }, 160); } }
    function loop() {
        if (looping) return; looping = true; lastSeen = nextIdle = performance.now() + 4000;
        (function f() {
            let root = $('dk-root'); if (!root) { looping = false; return; }
            let w = $('win-duck.exe'), now = performance.now();
            if (!(w && w.classList.contains('is-min'))) {
                let nb = D.sleep ? (Math.sin(now / 1000 * 1.2) > 0 ? 1 : 0) : Math.sin(now / 1000 * 2.4) > 0.2 ? 1 : 0;
                D.hlag = nb !== D.bob ? D.bob - nb : 0; D.t = now / 1000; D.bob = nb;
                if (D.happy) D.wf = Math.sin(now / 90) > 0 ? 0.22 : 0.05;
                if (D.sleep) { D.ha = 0.22; D.nod = 1; }
                if (now > nextBlink && !D.sleep) { nextBlink = now + 2600 + Math.random() * 3800; seq([[0, () => { D.blink = 1; }], [60, () => { D.blink = 2; }], [150, () => { D.blink = 1; }], [210, () => { D.blink = 0; }]]); }
                D.rip = ripT ? Math.min(18, (now - ripT) / 50) : 0; if (D.rip >= 18) ripT = 0;
                D.plops = D.plops.filter(p => (p.age += 80) < 640);
                D.drops = D.drops.filter(p => {
                    if (p.ring != null) return (p.ring += 0.2) < 1;
                    p.x += p.vx; p.y += p.vy; p.vy += 0.95;
                    if (p.y >= WL && p.vy > 0) { p.ring = 0; p.y = WL; }
                    return p.x > -2 && p.x < W + 2;
                });
                // nobodys about = nap time
                if (!busy && !D.sleep && now - lastSeen > 45000) { D.sleep = 1; D.happy = 0; D.lx = D.ly = 0; }
                if (!busy && !D.sleep && !D.happy && !lookT && now > nextIdle) { nextIdle = now + 4000 + Math.random() * 6000; IDLE[Math.random() * IDLE.length | 0](); }
                if (lookT && now > lookT) { lookT = 0; D.ly = 0; }
                let cv = root.querySelector('.dk-px'); if (cv) paint(cv.getContext('2d'), D, theme());
            }
            setTimeout(f, 80);
        })();
    }

    function squish() {
        D.sq = 1; D.open = 1.6; D.blush = 1; D.wf = 0.5; D.ha = -0.12; ripT = performance.now(); splash(6);
        seq([[90, () => { D.sq = 0.45; D.hop = 1; D.wf = 0.2; }], [200, () => { D.sq = 0; D.open = 0; D.hop = 0; D.wf = 0; D.ha = 0; }], [1400, () => { D.blush = 0; }]]);
    }
    function bubble(root, txt, ms) {
        let b = root.querySelector('.dk-bub'); b.textContent = txt; b.hidden = false;
        b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
        clearTimeout(bubT); bubT = setTimeout(() => { b.hidden = true; }, ms || 1700);
    }
    // the duck is the whole point so it squeaks even with ui sounds off
    function squeak(root, n) {
        for (let i = 0; i < n; i++) setTimeout(() => { if (os.sfx) os.sfx('squeak', { force: true }); if ($('dk-root')) squish(); }, i * 260);
    }
    async function tell(root, txt) {
        if (busy) return; busy = true; poke(); D.happy = 0; D.back = 0; D.sway = 0; D.tw = 0; D.wf = 0;
        // your words go in the duck + thats the last anyone sees of them
        let ta = root.querySelector('textarea'), fly = document.createElement('div');
        fly.className = 'dk-fly'; fly.textContent = txt; root.appendChild(fly); ta.value = '';
        setTimeout(() => fly.remove(), 1200);
        await wait(700);
        D.lean = -1; D.ly = -1; D.lx = 0; D.ha = -0.28;
        let dt = setInterval(() => { D.dots = D.dots % 3 + 1; }, 320);
        await wait(600 + Math.min(1800, txt.length * 14));
        clearInterval(dt); D.dots = 0; D.lean = 0; D.ly = 0; D.lx = 0; D.ha = 0;
        if (!$('dk-root')) { busy = false; return; }
        let r = Math.random();
        // console.log('duck roll', r)
        if (r < 0.04) bubble(root, T('duckStare', '…… (じっと見てる // it stares)'), 2200);
        else if (r < 0.06) { bubble(root, T('duckQuack', 'クワッ // quack?? thats not even its noise'), 2400); squeak(root, 1); }
        else { let n = 1 + (txt.length > 80) + (txt.length > 220); bubble(root, Array(n).fill(T('duckSqueak', 'キュッ')).join(' ') + ' // ' + Array(n).fill('squeak').join(' ')); squeak(root, n); }
        busy = false;
    }

    function wire() {
        let root = $('dk-root'); if (!root || root.dataset.on) return; root.dataset.on = '1';
        root.innerHTML = `<div class="dk-bub" hidden></div>
            <div class="dk-duck" title="${T('duckPoke', '押す // squeeze it')}"><canvas class="dk-px" width="${W}" height="${H}"></canvas></div>
            <i class="dk-tape"></i><div class="dk-paper"><div class="dk-note">
                <b class="dk-line">${T('duckLine', 'Take it out on the duck, vent to the duck. The duck will be a duck')}</b>
                <small class="dk-jp">${T('duckLineJp', 'アヒルに八つ当たりして、愚痴って。アヒルはアヒルのままだから')}</small>
                <textarea rows="5" maxlength="900" placeholder="${T('duckHint', 'ここに書いて // write it here')}"></textarea>
                <p>${T('duckEnter', 'enter = 話す // tell it · 何も残らない // nothing gets kept')}</p><i class="dk-doodle">♡</i></div></div>`;
        let ta = root.querySelector('textarea'), d = root.querySelector('.dk-duck'), cv = root.querySelector('.dk-px'), clicks = [];
        ta.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); let t = ta.value.trim(); if (t) tell(root, t); }
        });
        ta.addEventListener('input', () => { poke(); if (busy) return; D.nod = 1; D.ly = 1; D.lx = 0; lookT = performance.now() + 1500; setTimeout(() => { D.nod = 0; }, 110); });
        cv.addEventListener('pointerenter', () => { poke(); if (!busy) D.happy = 1; });
        cv.addEventListener('pointerleave', () => { D.happy = 0; D.wf = 0; });
        let dragged = false;
        const grab = e => {
            if (e.target.closest('textarea, button, .win-btns') || (e.button && e.button !== 0)) return;
            let w = root.closest('[id^="win-"]'), h = w && w.querySelector('.window-header'); if (!h || typeof setupDrag !== 'function') return;
            let p0 = e.touches ? e.touches[0] : e, x0 = p0.clientX, y0 = p0.clientY; dragged = false;
            const mv = ev => { let q = ev.touches ? ev.touches[0] : ev; if (Math.abs(q.clientX - x0) + Math.abs(q.clientY - y0) > 4) dragged = true; };
            const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('touchmove', mv); document.removeEventListener('mouseup', up); document.removeEventListener('touchend', up); };
            document.addEventListener('mousemove', mv); document.addEventListener('touchmove', mv); document.addEventListener('mouseup', up); document.addEventListener('touchend', up);
            setupDrag({ type: e.type, clientX: x0, clientY: y0, touches: e.touches, target: h, preventDefault: () => { if (e.type !== 'touchstart') e.preventDefault(); } });
        };
        [d, root.querySelector('.dk-tape'), root.querySelector('.dk-note')].forEach(el => { el.addEventListener('mousedown', grab); el.addEventListener('touchstart', grab, { passive: true }); });
        d.addEventListener('click', () => {
            if (dragged) { dragged = false; return; }
            poke(); if (busy) return;
            // poke it too much + it turns its back on you
            let now = performance.now(); clicks = clicks.filter(t => now - t < 2500); clicks.push(now);
            if (clicks.length >= 5) { clicks = []; D.flip = 1; D.happy = 0; bubble(root, T('duckHmph', 'ふんっ // hmph'), 1600); setTimeout(() => { D.flip = 0; }, 2600); return; }
            squeak(root, 1); bubble(root, T('duckSqueak', 'キュッ') + ' // squeak', 900);
        });
        document.addEventListener('pointermove', e => {
            let c = $('dk-root') && $('dk-root').querySelector('.dk-px'); if (!c || busy) return;
            let r = c.getBoundingClientRect(), ex = r.left + r.width * 41.5 / W, ey = r.top + r.height * 15 / H;
            if (Math.abs(e.clientX - ex) < 260 && Math.abs(e.clientY - ey) < 260) poke();
            if (lookT) return;
            let dx = e.clientX - ex, dy = e.clientY - ey, far = Math.abs(dx) > 30 || Math.abs(dy) > 30;
            D.lx = far && Math.abs(dx) >= Math.abs(dy) ? Math.sign(dx) : 0; D.ly = far && Math.abs(dy) > Math.abs(dx) ? Math.sign(dy) : 0;
        });
        loop();
    }

    function inject() {
        let tpl = document.createElement('template'); tpl.id = 'duck.exe';
        tpl.innerHTML = '<div id="dk-root" class="readable-ui"></div>';
        document.body.appendChild(tpl);
        let base = os.summon.bind(os);
        os.summon = function (id) {
            let existed = $('win-' + id), r = base.apply(os, arguments);
            if (id === 'duck.exe' && !existed) { let w = $('win-duck.exe'); if (w) { w.style.maxWidth = '310px'; w.querySelector('.window-header').ondblclick = null; } wire(); }
            return r;
        };
    }

    let css = document.createElement('style');
    const E = '#desktop > #win-duck\\.exe';
    css.textContent = `
        /* no window. a duck + a sticky note */
        ${E} { background: none !important; border: 0 !important; box-shadow: none !important; overflow: visible !important; }
        ${E}::before, ${E}::after, ${E} .wglow, ${E} .wbloom { display: none !important; }
        ${E} .window-header { position: absolute !important; z-index: 4; left: 70px; right: 70px; top: 0; height: 22px; padding: 0 !important; overflow: visible !important; background: none !important; border: 0 !important; box-shadow: none !important; border-radius: 0 !important; }
        ${E} .window-header::before, ${E} .window-header::after, ${E} .win-ic, ${E} .window-header > span:first-child, ${E} .max-btn { display: none !important; }
        ${E} .window-body { padding: 0 !important; background: none !important; box-shadow: none !important; overflow: visible !important; max-height: none !important; }
        ${E} .win-btns { position: absolute; right: -40px; top: 220px; display: flex; gap: 4px; transform: rotate(-1.6deg); }
        ${E} .win-btns .max-btn { display: none !important; }
        ${E} .win-btn, ${E} .kill-btn { width: 17px !important; height: 17px !important; margin: 0 !important; padding: 0 !important; display: grid !important; place-items: center; border: 1.5px solid color-mix(in srgb, var(--neon-primary) 40%, #6a2a4a) !important; border-radius: 4px !important; background: rgba(255,255,255,0.55) !important; box-shadow: 0 1px 0 rgba(0,0,0,0.15) !important; text-shadow: none !important; transition: none !important; }
        ${E} .win-btn::before, ${E} .kill-btn::before { display: none !important; }
        ${E} .win-btn::after, ${E} .kill-btn::after { font: bold 13px/1 Arial, sans-serif; color: color-mix(in srgb, var(--neon-primary) 40%, #6a2a4a); }
        ${E} .min-btn::after { content: '−'; } ${E} .kill-btn::after { content: '×'; }
        ${E} .win-btn:hover, ${E} .kill-btn:hover { background: color-mix(in srgb, var(--neon-primary) 40%, #6a2a4a) !important; } ${E} .win-btn:hover::after, ${E} .kill-btn:hover::after { color: #fff; }
        #dk-root { position: relative; padding: 22px 6px 10px; user-select: none; }
        .dk-duck { position: relative; width: 256px; margin: 0 auto; cursor: inherit; }
        .dk-duck::before { content: ''; position: absolute; inset: -10px 10px 30px; z-index: -1; background: radial-gradient(closest-side, color-mix(in srgb, var(--neon-primary) 22%, transparent), transparent); }
        .dk-px { display: block; width: 256px; height: 200px; image-rendering: pixelated; }
        .dk-bub { position: absolute; z-index: 3; left: 50%; top: 0; max-width: 250px; padding: 5px 10px; white-space: nowrap; border-radius: 12px; font: bold 12px 'DotGothic16', monospace; color: #1a1418; background: #fff; box-shadow: 0 3px 8px rgba(0,0,0,0.5); transform: translateX(-30%); }
        .dk-bub::after { content: ''; position: absolute; left: 34%; bottom: -7px; border: 7px solid transparent; border-bottom: 0; border-top-color: #fff; }
        .dk-bub.pop { animation: dkPop 0.25s cubic-bezier(.3, 1.6, .5, 1); }
        @keyframes dkPop { from { transform: translateX(-30%) scale(0.6); opacity: 0; } }
        /* sticky note. shadow lives on the wrapper or the corner clip eats it */
        .dk-paper { position: relative; margin: -6px 16px 0; transform: rotate(-1.6deg); filter: drop-shadow(0 9px 7px rgba(0,0,0,0.5)) drop-shadow(0 2px 2px rgba(0,0,0,0.3)); }
        .dk-note { position: relative; padding: 24px 14px 12px 30px;
            --pp: color-mix(in srgb, var(--neon-primary) 14%, #fff5f9); --ink: color-mix(in srgb, var(--neon-primary) 35%, #4a1c36);
            background: linear-gradient(90deg, transparent 21px, color-mix(in srgb, var(--neon-primary) 45%, transparent) 21px 22px, transparent 22px), radial-gradient(circle, rgba(80,30,60,0.06) 0.6px, transparent 1px) 0 0 / 4px 4px, linear-gradient(172deg, color-mix(in srgb, var(--neon-primary) 6%, #fffafc), var(--pp) 55%, color-mix(in srgb, var(--neon-primary) 22%, #ffeef5));
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -10px 14px -10px color-mix(in srgb, var(--neon-primary) 30%, transparent); clip-path: polygon(0 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%); }
        .dk-duck, .dk-tape, .dk-note { cursor: grab; } .dk-note textarea { cursor: text; }
        .dk-tape { position: absolute; z-index: 2; left: 50%; top: 214px; width: 84px; height: 18px; margin-left: -46px; transform: rotate(-4deg); opacity: 0.88;
            background: repeating-linear-gradient(45deg, color-mix(in srgb, var(--neon-primary) 45%, rgba(255,255,255,0.5)) 0 5px, color-mix(in srgb, var(--neon-secondary) 30%, rgba(255,255,255,0.6)) 5px 10px); box-shadow: 0 1px 2px rgba(0,0,0,0.2); clip-path: polygon(2% 0, 98% 6%, 100% 100%, 0 94%); }
        .dk-note::after { content: ''; position: absolute; right: 0; bottom: 0; width: 24px; height: 24px; background: linear-gradient(135deg, color-mix(in srgb, var(--neon-primary) 40%, #e9cbd8) 0 46%, color-mix(in srgb, var(--neon-primary) 5%, #fff8fb) 54%, var(--pp)); box-shadow: -2px -2px 4px rgba(0,0,0,0.2); }
        .dk-line { display: block; padding: 0 0 4px; font: 11px/1.45 'DotGothic16', monospace; font-weight: normal; color: var(--ink); background: linear-gradient(transparent calc(100% - 3px), color-mix(in srgb, var(--neon-primary) 30%, transparent) 0) 0 0 / 92% 100% no-repeat; }
        .dk-jp { display: block; margin-top: 3px; font: 9px/1.4 'DotGothic16', monospace; color: var(--ink); opacity: 0.62; }
        .dk-note textarea { display: block; width: 100%; box-sizing: border-box; margin: 7px 0 0; padding: 0; resize: none; border: 0 !important; outline: 0 !important; box-shadow: none !important; background: repeating-linear-gradient(transparent 0 17px, color-mix(in srgb, var(--neon-primary) 22%, rgba(90,40,70,0.12)) 17px 18px); font: 12px/18px 'DotGothic16', monospace; color: color-mix(in srgb, var(--ink) 70%, #1a0c14); cursor: text; }
        .dk-note textarea::placeholder { color: var(--ink); opacity: 0.4; }
        .dk-note p { margin: 5px 0 0; font: 8px 'DotGothic16', monospace; color: var(--ink); opacity: 0.55; }
        .dk-doodle { position: absolute; left: 6px; bottom: 9px; font: 13px/1 Arial, sans-serif; font-style: normal; color: color-mix(in srgb, var(--neon-primary) 70%, var(--ink)); transform: rotate(-14deg); opacity: 0.75; }
        .dk-fly { position: absolute; z-index: 2; left: 30px; right: 30px; top: 240px; text-align: center; font: 12px 'DotGothic16', monospace; color: #fff; text-shadow: 0 0 6px rgba(255,120,190,0.9), 0 1px 2px #000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none; animation: dkFly 1.1s ease-in forwards; }
        @keyframes dkFly { to { transform: translate(20px, -120px) scale(0.2); opacity: 0; filter: blur(2px); } }
        html.reduce-motion #dk-root * { animation: none !important; transition: none !important; }
    `;
    document.head.appendChild(css);
    inject();
})();
