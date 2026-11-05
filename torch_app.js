// torch. the screen goes white. thats it. its so stupid I love it
window.os = window.os || {};

(function () {
    const W = () => (window.gamesDB && window.gamesDB.torch && window.gamesDB.torch.lines) || {};
    const T = (k, d) => String(W()[k] || d).split('|').map(x => x.trim()).join(' // ');
    let root = null, style = null, on = false, dim = null, was = '';

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
                .tc i { width: 96px; height: 96px; background: center / contain no-repeat; image-rendering: pixelated; opacity: 0.85; }
                .tc.lit i { opacity: 0; }
            `;
            document.head.appendChild(style);
            el.innerHTML = `<div class="tc"><i class="gg-ic" data-em="🔦"></i><p class="tc-hint"></p></div>`;
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
            window.removeEventListener('keydown', key, true);
            if (style) style.remove(); if (root) root.innerHTML = '';
            root = null; style = null;
            delete os.gg.hooks.torch;
        }
    };
})();
