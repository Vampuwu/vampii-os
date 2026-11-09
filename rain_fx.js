
window.os = window.os || {};

(function () {
    const root = document.documentElement;
    const calm = () => root.classList.contains('reduce-motion');
    const slow = () => root.classList.contains('low-spec');
    // Matrix letters. backwards like the movie
    const GL = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ01234567890123456789:=*+<>|'.split('');
    const LAYERS = [
        { size: 10, speed: [40, 70], len: [10, 22], fill: 0.8, alpha: 0.5, glow: 3, land: [0.0, 0.16], par: 5, push: 8, soft: 0.7 },
        { size: 15, speed: [75, 125], len: [12, 30], fill: 0.62, alpha: 0.85, glow: 6, land: [0.22, 0.6], par: 12, push: 20, soft: 0 },
        { size: 23, speed: [130, 200], len: [8, 20], fill: 0.2, alpha: 1, glow: 10, land: [0.68, 1.15], par: 26, push: 38, soft: 0 }
    ];
    // Floor sea lake. they all splash different
    const ON = {
        city: { wob: 1.5, wsp: 0.004, refl: 0.16, ring: 1, spike: true, grow: 30, flat: 0.22, life: 0.7 },
        tide: { wob: 4, wsp: 0.007, refl: 0.12, ring: 1, spike: false, drops: true, grow: 44, flat: 0.17, life: 0.95, drift: 14 },
        aurora: { wob: 0.6, wsp: 0.002, refl: 0.24, ring: 2, spike: false, grow: 26, flat: 0.2, life: 1.3 }
    };
    const SURF = () => { let k = os.prefs && os.prefs.shaderbg !== false && os.prefs.wall; return ON[k] || ON.city; };
    const HZ = () => { let h = os.deskFx && os.deskFx.horizon ? os.deskFx.horizon() : 0.42; return h == null ? 1.02 : 1 - h; };

    let cv = null, ctx = null, dpr = 1, W = 0, H = 0, atlas = [], streams = [], splashes = [], shocks = [];
    let raf = 0, last = 0, want = false, live = false, inks = '', P = '#ff0099', tick = 0;
    let mx = -9999, my = -9999, sx = 0.5, surge = null, nextSurge = 0, slice = null, nextSlice = 0;
    const rnd = r => r[0] + Math.random() * (r[1] - r[0]);
    const pick = () => (Math.random() * GL.length) | 0;
    function lift(c, k) {
        let m = /^#([0-9a-f]{6})$/i.exec(c);
        if (!m) return c;
        let n = parseInt(m[1], 16);
        return 'rgb(' + [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => Math.round(v + (255 - v) * k)).join(',') + ')';
    }
    const css = (k, fb) => (getComputedStyle(root).getPropertyValue(k).trim() || fb);

    function makeAtlas(L, P, S) {
        let pad = Math.ceil(L.size * 0.55 + L.glow), cssCell = L.size + pad * 2, cell = Math.ceil(cssCell * dpr);
        let c = document.createElement('canvas'); c.width = cell * GL.length; c.height = cell * 3;
        let x = c.getContext('2d');
        x.font = 'bold ' + (L.size * dpr) + "px 'MS Gothic', 'Osaka-Mono', 'Noto Sans Mono CJK JP', 'Noto Sans CJK JP', monospace";
        x.textAlign = 'center'; x.textBaseline = 'middle';
        if (L.soft) x.filter = 'blur(' + (L.soft * dpr) + 'px)';
        [['#ffffff', P, L.glow * 2.2], [lift(P, 0.3), P, L.glow], [S, S, L.glow * 0.7]].forEach((k, row) => {
            x.fillStyle = k[0]; x.shadowColor = k[1]; x.shadowBlur = k[2] * dpr;
            GL.forEach((g, i) => {
                x.save(); x.translate(i * cell + cell / 2, row * cell + cell / 2);
                if (g.charCodeAt(0) > 255) x.scale(-1, 1);
                x.fillText(g, 0, 0);
                // Twice so the white one actually glows
                if (row === 0) x.fillText(g, 0, 0);
                x.restore();
            });
        });
        return { c, cell, cssCell };
    }
    function colours() {
        let S = css('--neon-secondary', '#ff66b3'); P = css('--neon-primary', '#ff0099');
        if (P + S === inks && atlas.length) return;
        inks = P + S; atlas = LAYERS.map(L => makeAtlas(L, P, S));
    }

    function spawn(st, first) {
        let L = LAYERS[st.l], cw = L.size * 1.18, hzY = H * HZ();
        st.x = (Math.floor(Math.random() * Math.ceil(W / cw)) + 0.5) * cw;
        st.step = L.size * 1.14;
        st.n = Math.round(rnd(L.len));
        st.v = rnd(L.speed) * (W < 700 ? 0.8 : 1);
        st.g = Array.from({ length: st.n + 3 }, pick);
        st.land = hzY + rnd(L.land) * (H - hzY);
        st.y = first ? Math.random() * (st.land + st.n * st.step) : -Math.random() * H * 0.4;
        st.hit = false;
        st.hot = Math.random() < 0.12 ? 1.3 : 1;
    }
    function build() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = innerWidth; H = innerHeight;
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        inks = ''; colours();
        streams = [];
        LAYERS.forEach((L, l) => {
            let n = Math.round(W / (L.size * 1.18) * L.fill * (slow() ? 0.5 : 1));
            for (let i = 0; i < n; i++) { let st = { l }; spawn(st, true); streams.push(st); }
        });
        splashes = []; shocks = [];
    }

    function setup() {
        if (cv) return;
        cv = document.createElement('canvas'); cv.id = 'rain-fx'; cv.setAttribute('aria-hidden', 'true');
        ctx = cv.getContext('2d');
        let st = document.createElement('style');
        st.textContent = '#rain-fx { position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: -1; pointer-events: none; opacity: 0; transition: opacity 0.8s; }\n#rain-fx.on { opacity: 1; }';
        document.head.appendChild(st);
        let wall = document.getElementById('desk-fx');
        if (wall && wall.nextSibling) document.body.insertBefore(cv, wall.nextSibling); else document.body.insertBefore(cv, document.body.firstChild);
        build();
        let t = 0;
        window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { if (cv) build(); }, 150); });
        let wasSlow = slow();
        new MutationObserver(() => { if (slow() !== wasSlow) { wasSlow = slow(); if (cv) build(); } }).observe(root, { attributes: true, attributeFilter: ['class'] });
        window.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
        document.addEventListener('pointerleave', () => { mx = my = -9999; });
        document.addEventListener('pointerdown', e => {
            if (!live || !e.target.closest('#desktop') || e.target.closest('div[id^="win-"], .icon-wrap, button, a, input, textarea')) return;
            shocks.push({ x: e.clientX, y: e.clientY, t: 0 }); if (shocks.length > 3) shocks.shift();
        });
    }

    function frame(now) {
        raf = requestAnimationFrame(frame);
        if (document.hidden || now - last < 30 || document.documentElement.classList.contains('pt-busy')) return;
        let dt = Math.min(0.08, (now - last) / 1000); last = now;
        if (++tick % 15 === 0) colours();
        let hzY = H * HZ(), sf = SURF();
        sx += ((mx < -999 ? 0.5 : mx / W) - sx) * 0.05;

        if (!surge && now > nextSurge) surge = { y: -120, v: H / 1.9 };
        if (surge) { surge.y += surge.v * dt; if (surge.y > H + 120) { surge = null; nextSurge = now + 9000 + Math.random() * 12000; } }
        if (now > nextSlice) { slice = { y: Math.random() * H, h: 14 + Math.random() * 50, dx: (Math.random() - 0.5) * 40, until: now + 90 + Math.random() * 140 }; nextSlice = now + 3000 + Math.random() * 7000; }
        if (slice && now > slice.until) slice = null;
        shocks.forEach(s => { s.t += dt / 0.9; }); shocks = shocks.filter(s => s.t < 1);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter';

        for (let k = 0; k < streams.length; k++) {
            let st = streams[k], L = LAYERS[st.l], A = atlas[st.l], cc = A.cssCell, half = cc / 2, cell = A.cell;
            st.y += st.v * dt;
            let hy = Math.floor(st.y / st.step) * st.step, row0 = Math.round(hy / st.step);
            if (!st.hit && hy >= st.land) {
                st.hit = true;
                if (st.land < H + 4) { splashes.push({ x: st.x, y: st.land, t: 0, s: L.size / 15, a: L.alpha * st.hot }); if (splashes.length > 60) splashes.shift(); }
            }
            if (hy - st.n * st.step > st.land) { spawn(st, false); continue; }
            if (Math.random() < 0.25) st.g[(Math.random() * st.g.length) | 0] = pick();
            let baseX = st.x + (0.5 - sx) * L.par;
            for (let i = 0; i < st.n; i++) {
                let gy = hy - i * st.step;
                if (gy > st.land) continue;
                if (gy < -st.step) break;
                let a = i === 0 ? 1 : Math.pow(1 - i / st.n, 1.15), ink = i === 0 ? 0 : (i < st.n * 0.7 ? 1 : 2);
                let gi = i === 0 ? pick() : st.g[((row0 - i) % st.g.length + st.g.length) % st.g.length], x = baseX;
                // The rain moves out of the way of your mouse. my fav part
                let dx = x - mx, dy = gy - my, R = 70 + L.size * 3;
                if (dx > -R && dx < R && dy > -R && dy < R) {
                    let d = Math.sqrt(dx * dx + dy * dy);
                    if (d < R) { let f = 1 - d / R; x += (dx < 0 ? -1 : 1) * f * f * L.push; a = Math.min(1, a + f * 0.7); if (f > 0.75 && ink === 2) ink = 1; }
                }
                for (let s = 0; s < shocks.length; s++) {
                    let sh = shocks[s], ex = x - sh.x, ey = gy - sh.y, d = Math.sqrt(ex * ex + ey * ey), off = Math.abs(d - sh.t * 700);
                    if (off < 50) { let f = (1 - off / 50) * (1 - sh.t); x += (ex / (d || 1)) * f * L.push * 0.8; a = Math.min(1, a + f); if (f > 0.5) ink = 0; }
                }
                if (surge) { let off = Math.abs(gy - surge.y); if (off < 80) { a = Math.min(1, a + (1 - off / 80) * 0.85); if (off < 12) ink = 0; } }
                if (slice && gy > slice.y && gy < slice.y + slice.h) { x += slice.dx; ink = 2; }
                a *= L.alpha * st.hot;
                if (a < 0.02) continue;
                ctx.globalAlpha = Math.min(1, a);
                ctx.drawImage(A.c, gi * cell, ink * cell, cell, cell, x - half, gy - half, cc, cc);
                if (st.land < H && gy > st.land - st.step * 4) {
                    let ry = st.land * 2 - gy + st.step * 0.4;
                    ctx.globalAlpha = Math.min(1, a) * sf.refl;
                    ctx.drawImage(A.c, gi * cell, (ink || 1) * cell, cell, cell, x - half + Math.sin(ry * 0.3 + now * sf.wsp) * sf.wob, ry - half, cc, cc * 0.8);
                }
            }
        }

        ctx.lineWidth = 1;
        ctx.strokeStyle = P;
        splashes = splashes.filter(sp => {
            sp.t += dt / sf.life;
            if (sp.t >= 1) return false;
            let depth = Math.max(0.25, (sp.y - hzY) / (H - hzY)), cx = sp.x + (0.5 - sx) * 10 + (sf.drift ? sp.t * sf.drift * depth : 0);
            for (let k = 0; k < sf.ring; k++) {
                let t = sp.t - k * 0.22;
                if (t <= 0) continue;
                let r = sp.s * (3 + sf.grow * t) * (0.5 + depth);
                ctx.globalAlpha = (1 - t) * (k ? 0.4 : 0.75) * Math.min(1, sp.a);
                ctx.beginPath(); ctx.ellipse(cx, sp.y, r, r * sf.flat * (0.6 + depth * 0.6), 0, 0, Math.PI * 2); ctx.stroke();
            }
            if (sf.drops && sp.t < 0.45) {
                let k = sp.t / 0.45, up = Math.sin(k * Math.PI) * sp.s * 9;
                ctx.globalAlpha = (1 - k) * Math.min(1, sp.a);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(cx - sp.s * 5 * k - 0.5, sp.y - up, 1.5, 1.5); ctx.fillRect(cx + sp.s * 4 * k, sp.y - up * 0.8, 1.5, 1.5);
            }
            if (sf.spike && sp.t < 0.2) {
                let k = 1 - sp.t / 0.2;
                ctx.globalAlpha = k * Math.min(1, sp.a);
                ctx.fillStyle = '#ffffff'; ctx.fillRect(sp.x - 0.5, sp.y - sp.s * 10 * k, 1, sp.s * 10 * k);
                ctx.fillStyle = P; ctx.fillRect(sp.x - sp.s * 6 * k, sp.y - 0.5, sp.s * 12 * k, 1);
            }
            return true;
        });
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }

    function start() {
        if (live) return;
        setup(); live = true; last = performance.now();
        cv.style.display = '';
        requestAnimationFrame(() => cv.classList.add('on'));
        if (!raf) raf = requestAnimationFrame(frame);
    }
    function stop() {
        if (!live) return;
        live = false;
        cv.classList.remove('on');
        setTimeout(() => { if (!live) { cancelAnimationFrame(raf); raf = 0; ctx.clearRect(0, 0, cv.width, cv.height); cv.style.display = 'none'; } }, 850);
    }
    function sync() { if (want && !calm()) start(); else stop(); label(); }
    function label() {
        let b = document.getElementById('rain-btn');
        if (!b) return;
        b.textContent = '[ デジタルレイン / DIGITAL RAIN: ' + (want ? 'ON' : 'OFF') + (want && calm() ? ' (paused, reduce motion)' : '') + ' ]';
        b.setAttribute('aria-pressed', want ? 'true' : 'false');
    }

    os.toggleMatrixRain = function () {
        want = !want;
        try { localStorage.setItem('vmp_rain', want ? '1' : '0'); } catch (e) {}
        sync();
    };
    os.rain = { on: () => want };
    try { want = localStorage.getItem('vmp_rain') === '1'; } catch (e) {}
    const baseSummon = os.summon;
    os.summon = function (id) { baseSummon.apply(os, arguments); if (id === 'settings') label(); };
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync); else sync();
})();
