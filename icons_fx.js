
window.os = window.os || {};

(function () {
    const root = () => document.documentElement;
    const calm = () => root().classList.contains('reduce-motion') || root().classList.contains('low-spec');
    const KEY_POS = 'vmp_icons';
    const $ = id => document.getElementById(id);

    const desk = () => $('desktop');
    function freeLayer() {
        let f = $('icon-free');
        if (!f && desk()) {
            f = document.createElement('div');
            f.id = 'icon-free';
            f.className = 'readable-ui';
            desk().appendChild(f);
        }
        return f;
    }
    const keyOf = ic => (ic.querySelector('.icon-label') || ic).textContent.trim();
    function saved() { try { return JSON.parse(localStorage.getItem(KEY_POS) || '{}'); } catch (e) { return {}; } }
    function save(all) { try { localStorage.setItem(KEY_POS, JSON.stringify(all)); } catch (e) {} }
    // so tidy puts them back in the right order
    let order = 0;
    function remember(ic) { if (!ic.dataset.order) ic.dataset.order = String(order++); }
    function place(ic, x, y) {
        let d = desk().getBoundingClientRect(), w = ic.offsetWidth / d.width * 100, h = ic.offsetHeight / d.height * 100;
        x = Math.max(0, Math.min(100 - w, x));
        y = Math.max(0, Math.min(100 - h, y));
        ic.style.left = x + '%';
        ic.style.top = y + '%';
        return [x, y];
    }
    function free(ic) {
        let f = freeLayer();
        if (ic.parentElement !== f) { remember(ic); f.appendChild(ic); }
        ic.classList.add('is-free');
    }
    function boxesHit(a, b) { return a.left < b.right - 4 && a.right > b.left + 4 && a.top < b.bottom - 4 && a.bottom > b.top + 4; }
    function pinAll(except) {
        let d = desk().getBoundingClientRect(), all = saved();
        let col = [...document.querySelectorAll('.desktop-icons .icon-wrap')].filter(ic => !except.includes(ic) && ic.offsetParent !== null).map(ic => [ic, ic.getBoundingClientRect()]);
        col.forEach(([ic, r]) => { free(ic); let p = place(ic, (r.left - d.left) / d.width * 100, (r.top - d.top) / d.height * 100); all[keyOf(ic)] = { x: p[0], y: p[1] }; });
        if (col.length) save(all);
    }
    // if you drop one on top of another, scoot it over a bit
    function nudge(ic, p) {
        let d = desk().getBoundingClientRect(), r = ic.getBoundingClientRect(), others = [...document.querySelectorAll('.desktop-icons .icon-wrap, #icon-free .icon-wrap')].filter(o => o !== ic && o.offsetParent !== null).map(o => o.getBoundingClientRect());
        const hit = (x, y) => others.some(o => boxesHit({ left: x, top: y, right: x + r.width, bottom: y + r.height }, o));
        if (!hit(r.left, r.top)) return p;
        let step = Math.max(12, r.width / 3);
        for (let ring = 1; ring < 30; ring++) {
            let best = null;
            for (let dx = -ring; dx <= ring; dx++) for (let dy = -ring; dy <= ring; dy++) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
                let x = r.left + dx * step, y = r.top + dy * step;
                if (x < d.left || y < d.top || x + r.width > d.right || y + r.height > d.bottom || hit(x, y)) continue;
                let dist = dx * dx + dy * dy; if (!best || dist < best[2]) best = [x, y, dist];
            }
            if (best) return place(ic, (best[0] - d.left) / d.width * 100, (best[1] - d.top) / d.height * 100);
        }
        return p;
    }
    function settle() {
        if (os.isPhone() || !desk()) return;
        let frees = [...document.querySelectorAll('#icon-free .icon-wrap')];
        if (!frees.length) return;
        let all = saved();
        document.querySelectorAll('.desktop-icons .icon-wrap').forEach(ic => {
            if (ic.offsetParent === null) return;
            let r = ic.getBoundingClientRect();
            if (!frees.some(f => boxesHit(r, f.getBoundingClientRect()))) return;
            let d = desk().getBoundingClientRect(), w = r.width + 6, h = r.height + 6;
            for (let gx = 0; gx + w < d.width; gx += w) {
                for (let gy = 0; gy + h < d.height; gy += h) {
                    let spot = { left: d.left + gx, top: d.top + gy, right: d.left + gx + r.width, bottom: d.top + gy + r.height };
                    let taken = [...document.querySelectorAll('.desktop-icons .icon-wrap, #icon-free .icon-wrap')].some(o => o !== ic && o.offsetParent !== null && boxesHit(spot, o.getBoundingClientRect()));
                    if (taken) continue;
                    free(ic);
                    let p = place(ic, gx / d.width * 100, gy / d.height * 100);
                    all[keyOf(ic)] = { x: p[0], y: p[1] };
                    save(all);
                    frees.push(ic);
                    return;
                }
            }
        });
    }
    function applySaved() {
        if (os.isPhone() || !desk()) return;
        let all = saved();
        document.querySelectorAll('.desktop-icons .icon-wrap, #icon-free .icon-wrap').forEach(ic => {
            remember(ic);
            let p = all[keyOf(ic)];
            if (!p) return;
            free(ic);
            place(ic, p.x, p.y);
        });
    }
    function toGrid() {
        let col = document.querySelector('.desktop-icons'), f = $('icon-free');
        if (!col || !f) return;
        [...f.querySelectorAll('.icon-wrap')].sort((a, b) => a.dataset.order - b.dataset.order).forEach(ic => {
            ic.classList.remove('is-free');
            ic.style.left = ic.style.top = '';
            let after = [...col.children].find(c => Number(c.dataset.order) > Number(ic.dataset.order));
            col.insertBefore(ic, after || null);
        });
    }
    function tidy() {
        save({});
        toGrid();
        if (typeof os.notify === 'function') os.notify('アイコンを整列しました // icons tidied');
    }
    let resizeTm = 0;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTm);
        resizeTm = setTimeout(() => { if (os.isPhone()) toGrid(); else applySaved(); }, 120);
    });

    let drag = null, swallow = false;
    document.addEventListener('pointerdown', e => {
        if (e.button !== 0 || os.isPhone()) return;
        let ic = e.target.closest('.desktop-icons .icon-wrap, #icon-free .icon-wrap');
        if (!ic) return;
        // grabbed one of the box picked ones = the whole lot comes. grabbed anything else = the picks go
        let picked = [...document.querySelectorAll('.icon-wrap.picked')].filter(i => i.offsetParent !== null);
        let group = ic.classList.contains('picked') && picked.length > 1 ? picked : [ic];
        if (group.length === 1) picked.forEach(i => i.classList.remove('picked'));
        drag = { ic, group, sx: e.clientX, sy: e.clientY, on: false, id: e.pointerId };
        try { ic.setPointerCapture(e.pointerId); } catch (err) {}
    });
    let raf = 0, mx = 0, my = 0;
    document.addEventListener('pointermove', e => {
        if (!drag) return;
        mx = e.clientX; my = e.clientY;
        if (!drag.on) {
            if (Math.hypot(mx - drag.sx, my - drag.sy) < 10) return;
            drag.on = true;
            // DONT remove this, the whole column jumps up when you pick one up otherwise. it looked so bad
            // measure first, pinning the rest shuffles the grid under them
            drag.rs = drag.group.map(g => g.getBoundingClientRect());
            pinAll(drag.group);
            let d = desk().getBoundingClientRect();
            drag.d = d;
            drag.group.forEach((g, i) => { let r = drag.rs[i]; free(g); place(g, (r.left - d.left) / d.width * 100, (r.top - d.top) / d.height * 100); g.classList.add('is-drag'); });
            drag.lim = { l: d.left - Math.min(...drag.rs.map(r => r.left)), r: d.right - Math.max(...drag.rs.map(r => r.right)), t: d.top - Math.min(...drag.rs.map(r => r.top)), b: d.bottom - Math.max(...drag.rs.map(r => r.bottom)) };
            drag.trail = os.customTrail;
            os.customTrail = true;
            root().classList.add('icon-dragging');
        }
        if (!raf) raf = requestAnimationFrame(() => {
            raf = 0;
            if (!drag || !drag.on) return;
            let L = drag.lim;
            let dx = Math.max(L.l, Math.min(L.r, mx - drag.sx)), dy = Math.max(L.t, Math.min(L.b, my - drag.sy));
            drag.group.forEach(g => { g.style.transform = 'translate3d(' + dx + 'px,' + dy + 'px,0)'; });
            drag.dx = dx; drag.dy = dy;
        });
    });
    document.addEventListener('pointerup', () => {
        if (!drag) return;
        if (drag.on) {
            cancelAnimationFrame(raf); raf = 0;
            let d = drag.d, dx = drag.dx || 0, dy = drag.dy || 0, all = saved();
            os.customTrail = drag.trail;
            root().classList.remove('icon-dragging');
            drag.group.forEach((g, i) => {
                g.style.transform = ''; g.classList.remove('is-drag');
                let r = drag.rs[i], p = place(g, (r.left + dx - d.left) / d.width * 100, (r.top + dy - d.top) / d.height * 100);
                all[keyOf(g)] = { x: p[0], y: p[1] };
            });
            drag.group.forEach(g => { let p = nudge(g, [parseFloat(g.style.left), parseFloat(g.style.top)]); all[keyOf(g)] = { x: p[0], y: p[1] }; });
            if (os.sfx) os.sfx('drop', { el: drag.ic });
            save(all);
            swallow = true;
            setTimeout(() => { swallow = false; }, 50);
        }
        drag = null;
    });
    document.addEventListener('click', e => {
        if (swallow && e.target.closest('.icon-wrap')) { e.stopPropagation(); e.preventDefault(); swallow = false; }
    }, true);

    // hold your finger down = right click, for phones
    let lp = null, lpFired = false;
    document.addEventListener('touchstart', e => {
        if (e.touches.length !== 1) return;
        let t = e.touches[0];
        if (e.target.closest('input, textarea, .window-body, #custom-context-menu')) return;
        lpFired = false;
        let x = t.clientX, y = t.clientY;
        lp = { x, y, t0: e.timeStamp, tm: setTimeout(() => {
            lpFired = true;
            document.dispatchEvent(new MouseEvent('contextmenu', { clientX: x, clientY: y, bubbles: true, cancelable: true }));
        }, 700) };
    }, { passive: true });
    document.addEventListener('touchmove', e => {
        if (!lp) return;
        let t = e.touches[0];
        if (Math.hypot(t.clientX - lp.x, t.clientY - lp.y) > 10) { clearTimeout(lp.tm); lp = null; }
    }, { passive: true });
    document.addEventListener('touchend', e => {
        if (!lp) return;
        clearTimeout(lp.tm);
        if (lpFired && e.timeStamp - lp.t0 < 650) {
            lpFired = false;
            let m = $('custom-context-menu');
            if (m) m.style.display = 'none';
        }
        lp = null;
    }, { passive: true });
    document.addEventListener('click', e => {
        if (!lpFired) return;
        e.stopPropagation();
        e.preventDefault();
        lpFired = false;
    }, true);


    let menu = $('custom-context-menu');
    if (menu) {
        let tidyItem = document.createElement('div');
        tidyItem.className = 'context-item';
        tidyItem.setAttribute('role', 'menuitem');
        tidyItem.tabIndex = 0;
        tidyItem.textContent = '[ アイコンを整列 // tidy icons ]';
        tidyItem.onclick = () => { tidy(); if (typeof os.clickAudio === 'function') os.clickAudio(); };
        let first = menu.querySelector('.cz-sep');
        menu.insertBefore(tidyItem, first || null);
    }

    let css = document.createElement('style');
    css.textContent = `
        #icon-free { position: absolute; inset: 0; pointer-events: none; z-index: 2; }
        #icon-free .icon-wrap { position: absolute; pointer-events: auto; margin: 0; }
        .icon-wrap.is-drag { opacity: 0.85; z-index: 5; will-change: transform; transition: none !important; }
        .icon-wrap { -webkit-user-select: none; user-select: none; -webkit-user-drag: none; }
        html.icon-dragging .icon-wrap { transition: none !important; }
        html.icon-dragging #desktop { cursor: grabbing; }
        #desktop { -webkit-touch-callout: none; }
            background: rgba(4, 0, 2, 0.88); border: 1px solid #ff003c; box-shadow: 0 0 30px rgba(255, 0, 60, 0.45); font: 14px 'Courier New', monospace; color: #ffd6dd; line-height: 1.9; }
        @media (max-width: 767px), (max-height: 500px) and (pointer: coarse) { #icon-free .icon-wrap { position: static; } }
    `;
    document.head.appendChild(css);


    let col = document.querySelector('.desktop-icons');
    applySaved();
    os.icons = { tidy, applySaved };

    function crt() {
        if (document.getElementById('crt-glass')) return;
        let g = document.createElement('div');
        g.id = 'crt-glass'; g.setAttribute('aria-hidden', 'true');
        g.innerHTML = '<i class="crt-band"></i>';
        document.body.appendChild(g);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', crt); else crt();
})();
