
// it takes over every <input type="color"> on the site so they all match
window.os = window.os || {};

(function () {
    const N = 104;
    const R1 = 51, R0 = 42, RT = 39;
    let box, cv, x, hexIn, was, now, inp, h = 0, s = 1, v = 1, drag = '', img = null, imgH = -1;

    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
    function hsv2rgb(h, s, v) {
        let f = n => { let k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
        return [f(5), f(3), f(1)].map(c => Math.round(c * 255));
    }
    function rgb2hsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        let mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, hh = 0;
        if (d) hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
        return [(hh * 60 + 360) % 360, mx ? d / mx : 0, mx];
    }
    const toHex = c => '#' + c.map(n => n.toString(16).padStart(2, '0')).join('');
    const fromHex = t => { let m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(String(t).trim()); if (!m) return null; let q = m[1]; if (q.length === 3) q = q.replace(/./g, c => c + c); let n = parseInt(q, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };

    function corners() {
        let a = (h - 90) * Math.PI / 180, c = N / 2;
        return [0, 1, 2].map(i => [c + Math.cos(a + i * 2.0944) * RT, c + Math.sin(a + i * 2.0944) * RT]);
    }
    function bary(px, py, P) {
        let [A, B, C] = P, d = (B[1] - C[1]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[1] - C[1]);
        let a = ((B[1] - C[1]) * (px - C[0]) + (C[0] - B[0]) * (py - C[1])) / d;
        let b = ((C[1] - A[1]) * (px - C[0]) + (A[0] - C[0]) * (py - C[1])) / d;
        return [a, b, 1 - a - b];
    }

    function draw() {
        if (!x) return;
        let c = N / 2;
        if (imgH !== h) {
            let id = x.createImageData(N, N), d = id.data, P = corners();
            for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) {
                let dx = px + 0.5 - c, dy = py + 0.5 - c, r = Math.hypot(dx, dy), o = (py * N + px) * 4, col = null;
                if (r <= R1 && r >= R0) col = hsv2rgb((Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360, 1, 1);
                else if (r < R0) {
                    let [a, b, k] = bary(px + 0.5, py + 0.5, P);
                    if (a >= -0.01 && b >= -0.01 && k >= -0.01) { let vv = clamp(a + b, 0, 1), ss = vv ? clamp(a / vv, 0, 1) : 0; col = hsv2rgb(h, ss, vv); }
                }
                if (col) { d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255; }
            }
            img = id; imgH = h;
        }
        x.putImageData(img, 0, 0);
        let a = (h - 90) * Math.PI / 180, mr = (R0 + R1) / 2;
        x.fillStyle = '#000'; x.fillRect(Math.round(c + Math.cos(a) * mr) - 2, Math.round(c + Math.sin(a) * mr) - 2, 5, 5);
        x.fillStyle = '#fff'; x.fillRect(Math.round(c + Math.cos(a) * mr) - 1, Math.round(c + Math.sin(a) * mr) - 1, 3, 3);
        let P = corners(), wa = s * v, wb = (1 - s) * v, wc = 1 - v;
        let tx = Math.round(P[0][0] * wa + P[1][0] * wb + P[2][0] * wc), ty = Math.round(P[0][1] * wa + P[1][1] * wb + P[2][1] * wc);
        x.fillStyle = v > 0.55 && s < 0.6 ? '#000' : '#fff';
        [[-2, -1], [-2, 0], [-2, 1], [2, -1], [2, 0], [2, 1], [-1, -2], [0, -2], [1, -2], [-1, 2], [0, 2], [1, 2]].forEach(q => x.fillRect(tx + q[0], ty + q[1], 1, 1));
    }

    function hex() { return toHex(hsv2rgb(h, s, v)); }
    function push(done) {
        let c = hex();
        now.style.background = c;
        if (document.activeElement !== hexIn) hexIn.value = c;
        if (!inp) return;
        if (inp.value !== c) { inp.value = c; inp.dispatchEvent(new Event('input', { bubbles: true })); }
        if (done) inp.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function at(e) {
        let r = cv.getBoundingClientRect(), p = e.touches ? e.touches[0] : e;
        return [(p.clientX - r.left) / r.width * N, (p.clientY - r.top) / r.height * N];
    }
    function move(e, first) {
        let [px, py] = at(e), c = N / 2, r = Math.hypot(px - c, py - c);
        if (first) drag = r > R0 - 1 ? 'ring' : 'tri';
        if (drag === 'ring') h = Math.round((Math.atan2(py - c, px - c) * 180 / Math.PI + 90 + 360) % 360);
        else {
            let [a, b, k] = bary(px, py, corners());
            a = Math.max(0, a); b = Math.max(0, b); k = Math.max(0, k);
            let t = a + b + k || 1; a /= t; b /= t;
            v = clamp(a + b, 0, 1); s = v ? clamp(a / v, 0, 1) : 0;
        }
        draw(); push(false);
        if (e.cancelable) e.preventDefault();
    }

    function make() {
        box = document.createElement('div');
        box.id = 'ctri';
        box.className = 'readable-ui';
        box.hidden = true;
        box.innerHTML = '<canvas width="' + N + '" height="' + N + '"></canvas><div class="ctri-row"><span class="ctri-sw"><i class="ctri-was" title="before"></i><i class="ctri-now"></i></span><input class="ctri-hex" maxlength="7" spellcheck="false"><button type="button" class="ctri-ok">OK</button></div>';
        document.body.appendChild(box);
        cv = box.querySelector('canvas'); x = cv.getContext('2d');
        hexIn = box.querySelector('.ctri-hex'); was = box.querySelector('.ctri-was'); now = box.querySelector('.ctri-now');
        const up = () => { if (drag) { drag = ''; push(true); } document.removeEventListener('mousemove', mm); document.removeEventListener('touchmove', mm); };
        const mm = e => move(e, false);
        const down = e => { move(e, true); document.addEventListener('mousemove', mm); document.addEventListener('touchmove', mm, { passive: false }); document.addEventListener('mouseup', up, { once: true }); document.addEventListener('touchend', up, { once: true }); };
        cv.addEventListener('mousedown', down);
        cv.addEventListener('touchstart', down, { passive: false });
        cv.addEventListener('wheel', e => { e.preventDefault(); h = (h + (e.deltaY > 0 ? 4 : -4) + 360) % 360; draw(); push(false); clearTimeout(cv._t); cv._t = setTimeout(() => push(true), 250); }, { passive: false });
        hexIn.addEventListener('input', () => { let c = fromHex(hexIn.value); if (!c) return; [h, s, v] = rgb2hsv(...c); h = Math.round(h); draw(); push(false); });
        hexIn.addEventListener('keydown', e => { if (e.key === 'Enter') close(true); e.stopPropagation(); });
        was.onclick = () => { let c = fromHex(was.dataset.c); if (!c) return; [h, s, v] = rgb2hsv(...c); h = Math.round(h); draw(); push(true); };
        box.querySelector('.ctri-ok').onclick = () => close(true);
        box.addEventListener('mousedown', e => e.stopPropagation());
        let st = document.createElement('style');
        st.textContent = `
            #ctri { position: fixed; z-index: 99990; padding: 8px; width: 216px; box-sizing: border-box; background: #25232d; color: #e9e5ee; font: 12px 'DotGothic16', monospace;
                box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.22), inset -1px -1px 0 #050407, inset 2px 2px 0 rgba(255, 255, 255, 0.07), inset -2px -2px 0 rgba(0, 0, 0, 0.5), 0 3px 0 color-mix(in srgb, var(--neon-secondary) 70%, #25232d), 5px 8px 0 rgba(0, 0, 0, 0.45); }
            #ctri[hidden] { display: none; }
            #ctri canvas { display: block; width: 200px; height: 200px; image-rendering: pixelated; cursor: crosshair; touch-action: none; }
            .ctri-row { display: flex; align-items: center; gap: 5px; margin-top: 6px; }
            .ctri-sw { display: flex; flex: 0 0 auto; box-shadow: 0 0 0 1px #000; }
            .ctri-sw i { display: block; width: 18px; height: 20px; }
            .ctri-was { cursor: pointer; }
            .ctri-hex { flex: 1; min-width: 0; background: #14121a; color: #fff; border: 0; padding: 3px 5px; font: inherit; text-transform: lowercase; box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 rgba(255, 255, 255, 0.18); outline: none; }
            .ctri-hex:focus { box-shadow: inset 1px 1px 0 #000, inset -1px -1px 0 rgba(255, 255, 255, 0.18), 0 0 0 1px var(--neon-secondary); }
            .ctri-ok { background: #25232d; color: #e9e5ee; border: 0; font: inherit; padding: 3px 9px; cursor: pointer; box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.22), inset -1px -1px 0 #050407; }
            .ctri-ok:active { box-shadow: inset 1px 1px 0 #050407, inset -1px -1px 0 rgba(255, 255, 255, 0.22); }
        `;
        document.head.appendChild(st);
    }

    function open(el) {
        if (!box) make();
        if (inp === el && !box.hidden) { close(true); return; }
        if (inp && inp !== el && !box.hidden) close(true);
        inp = el;
        let c = fromHex(el.value) || [255, 0, 153];
        [h, s, v] = rgb2hsv(...c); h = Math.round(h);
        was.style.background = was.dataset.c = toHex(c);
        box.hidden = false;
        let r = el.getBoundingClientRect(), bw = box.offsetWidth, bh = box.offsetHeight;
        let left = clamp(r.left, 6, innerWidth - bw - 6), top = r.bottom + 6;
        if (top + bh > innerHeight - 6) top = Math.max(6, r.top - bh - 6);
        box.style.left = left + 'px'; box.style.top = top + 'px';
        imgH = -1; draw(); push(false);
    }
    function close(keep) {
        if (!box || box.hidden) return;
        box.hidden = true;
        if (inp && keep) inp.dispatchEvent(new Event('change', { bubbles: true }));
        inp = null;
    }
    os.colourTri = { open, close };

    // grab every colour box before the browser's own picker pops up
    document.addEventListener('click', e => {
        let el = e.target.closest && e.target.closest('input[type="color"]');
        if (!el || el.disabled) return;
        e.preventDefault();
        open(el);
    }, true);
    document.addEventListener('mousedown', e => { if (box && !box.hidden && !e.target.closest('input[type="color"]')) close(true); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && box && !box.hidden) { e.stopPropagation(); close(true); } }, true);
})();
