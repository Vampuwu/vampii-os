// torch. the screen goes white. thats it. its so stupid I love it
window.os = window.os || {};

(function () {
    const W = () => (window.gamesDB && window.gamesDB.torch && window.gamesDB.torch.lines) || {};
    const T = (k, d) => String(W()[k] || d).split('|').map(x => x.trim()).join(' // ');
    let root = null, style = null, on = false, dim = null, was = '';
    let cv = null, cx = null, raf = 0, last = 0, dust = [], moth = null, ro = null;
    const calm = () => document.documentElement.classList.contains('reduce-motion');

    // dust + a moth while its off. drawn at 1/3 size so its chunky
    function size() {
        if (!cv) return;
        let w = Math.max(1, Math.round(cv.clientWidth / 3)), h = Math.max(1, Math.round(cv.clientHeight / 3));
        if (cv.width === w && cv.height === h) return;
        cv.width = w; cv.height = h;
        dust = Array.from({ length: Math.round(w * h / 260) }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 2, vy: -0.6 - Math.random() * 2.2, ph: Math.random() * 7 }));
        moth = { a: Math.random() * 6, r: 16, x: w / 2, y: h / 2, t: 0, gone: 0 };
    }
    function tick(now) {
        raf = requestAnimationFrame(tick);
        if (!cx || on || !root || !root.closest('.is-active')) { last = 0; return; }
        let dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
        if (calm()) dt = 0;
        let w = cv.width, h = cv.height, mx = w / 2, my = h / 2 - 2;
        cx.clearRect(0, 0, w, h);
        let fl = 0.75 + 0.25 * Math.sin(now / 90) * Math.sin(now / 37) + (Math.random() < 0.02 ? -0.5 : 0);
        let g = cx.createRadialGradient(mx, my, 2, mx, my, Math.min(w, h) * 0.45);
        g.addColorStop(0, 'rgba(255,214,140,' + (0.16 * fl) + ')'); g.addColorStop(1, 'rgba(255,214,140,0)');
        cx.fillStyle = g; cx.fillRect(0, 0, w, h);
        for (let d of dust) {
            d.ph += dt; d.x += (d.vx + Math.sin(d.ph * 0.7) * 1.5) * dt; d.y += d.vy * dt;
            if (d.y < -2) { d.y = h + 2; d.x = Math.random() * w; } if (d.x < -2) d.x = w + 1; if (d.x > w + 2) d.x = -1;
            let near = Math.max(0, 1 - Math.hypot(d.x - mx, d.y - my) / (Math.min(w, h) * 0.4));
            cx.fillStyle = near > 0.05 ? 'rgba(255,226,170,' + (0.15 + near * 0.7 * fl) + ')' : 'rgba(120,112,130,0.25)';
            cx.fillRect(Math.round(d.x), Math.round(d.y), 1, 1);
        }
        // the moth. keeps headbutting the lens
        let m = moth; m.t += dt;
        if (m.gone > 0) { m.gone -= dt; m.x += 30 * dt; m.y -= 22 * dt; if (m.gone <= 0) { m.x = -6; m.y = h * 0.3; } }
        else {
            m.a += dt * (2.2 + Math.sin(m.t * 1.3)); m.r = 10 + 8 * Math.abs(Math.sin(m.t * 0.6));
            let tx = mx + 18 + Math.cos(m.a) * m.r, ty = my - 4 + Math.sin(m.a * 1.7) * m.r * 0.6;
            m.x += (tx - m.x) * Math.min(1, dt * 3); m.y += (ty - m.y) * Math.min(1, dt * 3);
            if (Math.random() < dt * 0.04) m.gone = 3;
        }
        let x = Math.round(m.x), y = Math.round(m.y), up = Math.floor(m.t * 18) % 2;
        cx.fillStyle = '#d9cbb0'; cx.fillRect(x, y, 1, 2);
        cx.fillStyle = '#9c8f7a';
        if (up) { cx.fillRect(x - 2, y - 1, 2, 1); cx.fillRect(x + 1, y - 1, 2, 1); } else { cx.fillRect(x - 2, y + 1, 2, 2); cx.fillRect(x + 1, y + 1, 2, 2); }
    }

    function flip() {
        on = !on;
        if (typeof os.sfx === 'function') os.sfx(on ? 'on' : 'off');
        root.querySelector('.tc').classList.toggle('lit', on);
        root.querySelector('.tc-hint').textContent = T(on ? 'off' : 'tap', on ? 'タップで消す | tap to switch off' : 'タップでつける | tap for light');
        // full brightness while its on, your brightness setting comes back after
        dim = root.closest('.gg-scr') && root.closest('.gg-scr').querySelector('.gg-dim');
        if (dim) { if (on) { was = dim.style.opacity; dim.style.opacity = '0'; dim.style.transition = 'none'; } else { dim.style.opacity = was; dim.style.transition = ''; } }
    }
    function key(e) {
        if (!root || !root.closest('.is-active')) return;
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); flip(); }
    }

    os.gg = os.gg || {}; os.gg.hooks = os.gg.hooks || {};
    os.gg.hooks.torch = {
        start(el) {
            root = el; on = false;
            style = document.createElement('style');
            style.textContent = `
                .gg-game[data-game="torch"] { padding: 0; }
                .tc { position: relative; height: 100%; display: grid; place-items: center; background: #050407; cursor: inherit; user-select: none; transition: background 0.08s; }
                .tc.lit { background: radial-gradient(circle at 50% 45%, #ffffff 0 40%, #fff8e6 75%, #ffeec8); }
                .tc-hint { position: absolute; bottom: 18px; left: 0; right: 0; text-align: center; font-size: 12px; color: #8a8594; letter-spacing: 1px; }
                .tc.lit .tc-hint { color: #c9bfa8; }
                .tc i { position: relative; width: 96px; height: 96px; background: center / contain no-repeat; image-rendering: pixelated; opacity: 0.85; animation: tcBob 3.2s ease-in-out infinite, tcFl 4.7s steps(1) infinite; }
                .tc canvas { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; pointer-events: none; }
                .tc.lit canvas { opacity: 0; }
                @keyframes tcBob { 50% { transform: translateY(-5px) rotate(-3deg); } }
                @keyframes tcFl { 0%, 61%, 64%, 90% { filter: brightness(1); } 62% { filter: brightness(0.55); } 63% { filter: brightness(1.2); } 91% { filter: brightness(0.7); } }
                .reduce-motion .tc i { animation: none; }
                .tc.lit i { opacity: 0; }
            `;
            document.head.appendChild(style);
            el.innerHTML = `<div class="tc"><canvas></canvas><i class="gg-ic" data-em="🔦"></i><p class="tc-hint"></p></div>`;
            cv = el.querySelector('canvas'); cx = cv.getContext('2d');
            ro = new ResizeObserver(size); ro.observe(cv); size(); last = 0; raf = requestAnimationFrame(tick);
            el.querySelector('.tc-hint').textContent = T('tap', 'タップでつける | tap for light');
            el.querySelector('.tc').addEventListener('pointerdown', flip);
            window.addEventListener('keydown', key, true);
        },
        pause() { if (on) flip(); },
        resume() {},
        best() { return 0; },
        scores() { return []; },
        stop() {
            if (on) flip();
            cancelAnimationFrame(raf); if (ro) ro.disconnect(); ro = null; cv = null; cx = null;
            window.removeEventListener('keydown', key, true);
            if (style) style.remove(); if (root) root.innerHTML = '';
            root = null; style = null;
            delete os.gg.hooks.torch;
        }
    };
})();
