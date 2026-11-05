// gallery.exe. my drawings on a wall of old tellys. the editor fills posts/db_gallery.js
// no scanlines on my art unless crt is on
window.os = window.os || {};

(function () {
    const $ = id => document.getElementById(id);
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const T = (k, d) => (typeof siteText !== 'undefined' && siteText[k]) || d;
    const sfx = (n, el) => { if (os.sfx) os.sfx(n, el ? { el } : undefined); };
    const all = () => ((typeof database !== 'undefined' && database.gallery) || []).filter(g => g && g.img && !g.hidden).slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || (b.id || 0) - (a.id || 0));
    const key = g => String(g.img || g.id);
    const tagsOf = g => Array.isArray(g.tags) ? g.tags.map(String) : g.tag ? [String(g.tag)] : [];
    const ch = i => String(i + 1).padStart(2, '0');
    const seedOf = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % 2147483646 + 1; };
    const theme = () => getComputedStyle(document.documentElement).getPropertyValue('--neon-primary').trim() || '#ff0099';
    const rnd = seed => { let s = seed % 2147483647 || 4444; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
    function tvHtml(C, inner, cls, attrs, st) {
        let s = C.scr, tag = attrs ? 'button' : 'div';
        return `<${tag} class="gl-tv${cls || ''}" ${attrs || 'aria-hidden="true"'} style="width:${C.W}px; aspect-ratio:${C.W} / ${C.H}; background-image:url(${C.url}); ${st || ''}">`
            + `<span class="gl-scr" style="left:${(s[0] / C.W * 100).toFixed(2)}%; top:${(s[1] / C.H * 100).toFixed(2)}%; width:${(s[2] / C.W * 100).toFixed(2)}%; height:${(s[3] / C.H * 100).toFixed(2)}%; border-radius:${C.rad || 12}px;">${inner}<i class="gl-glass" style="background-image:url(${C.glass})"></i></span>`;
    }
    let tag = '', at = -1, list = [], dial = '', dialT = 0, osdT = 0, crt = false, page = 0;
    // 24 a wall
    const PER = 24;
    try { crt = localStorage.getItem('vmp_gallery_crt') === '1'; } catch (e) {}

    const LOOKS = 'vmp_gallery_looks';
    const looks = () => { try { return JSON.parse(localStorage.getItem(LOOKS) || '{}') || {}; } catch (e) { return {}; } };
    function looked(g) { let l = looks(), k = key(g); l[k] = (l[k] || 0) + 1; try { localStorage.setItem(LOOKS, JSON.stringify(l)); } catch (e) {} return l[k]; }

    const two = (jp, en) => `<span class="jp" lang="ja">${esc(jp)}</span><span class="en">${esc(en)}</span>`;

    function render() {
        let r = $('gl-root'); if (!r) return;
        let items = all(), tags = [...new Set(items.flatMap(tagsOf))];
        list = tag ? items.filter(g => tagsOf(g).includes(tag)) : items;
        let pages = Math.max(1, Math.ceil(list.length / PER)); page = Math.min(page, pages - 1);
        let band = pages > 1 ? `<span class="gl-band"><button data-pg="-1" aria-label="previous wall">◀</button><b>CH ${ch(page * PER)}–${ch(Math.min(list.length, (page + 1) * PER) - 1)}</b><small>${page + 1}/${pages}</small><button data-pg="1" aria-label="next wall">▶</button></span>` : '';
        let guide = (tags.length || band) ? `<nav class="gl-guide">${tags.length ? `<b lang="ja">ジャンル</b><button data-tag="" class="${tag ? '' : 'on'}">${esc(T('galleryAll', 'すべて'))}</button>${tags.map(t => `<button data-tag="${esc(t)}" class="${tag === t ? 'on' : ''}">${esc(t)}</button>`).join('')}` : ''}${band}</nav>` : '';
        r.innerHTML = guide + `<div class="gl-room" id="gl-room"><div class="gl-ceil" aria-hidden="true"><i></i><i></i><i class="flick"></i><i></i></div><div class="gl-wall" id="gl-wall"></div><div class="gl-floor" id="gl-floor" aria-hidden="true"></div></div>` + view();
        r.querySelectorAll('[data-tag]').forEach(b => b.onclick = () => { tag = b.dataset.tag; page = 0; sfx('click', b); render(); });
        r.querySelectorAll('[data-pg]').forEach(b => b.onclick = () => { let n = Math.max(1, Math.ceil(list.length / PER)); page = (page + +b.dataset.pg + n) % n; sfx('chan', b); render(); });
        build();
        if (list.length) sfx('tvOn');
        wireView(r);
    }
    // the glow behind a telly is the colour of whats on it
    const tints = {};
    function tint(b, im) {
        let k = im.currentSrc || im.src;
        if (!tints[k]) { try { let c = document.createElement('canvas'); c.width = c.height = 1; let x = c.getContext('2d'); x.drawImage(im, 0, 0, 1, 1); let d = x.getImageData(0, 0, 1, 1).data, m = Math.max(d[0], d[1], d[2], 1), up = Math.min(2.2, 220 / m); tints[k] = 'rgb(' + [0, 1, 2].map(i => Math.round(d[i] * up)).join(',') + ')'; } catch (e) { tints[k] = 'var(--neon-secondary)'; } }
        b.style.setProperty('--tint', tints[k]);
    }
    const FILL = [['off', 44], ['blue', 14], ['snow', 14], ['purple', 7], ['osd', 7], ['bars', 4], ['off2', 10]];
    // every so often one of the spare tellys changes channel by itself. not often or itd get annoying
    setInterval(() => {
        let r = document.getElementById('gl-root'); if (!r || !r.offsetParent || document.hidden || Math.random() > 0.3) return;
        let tvs = [...r.querySelectorAll('.gl-tv.fill')].filter(t => !t.querySelector('.gl-note') && !t.classList.contains('barsy'));
        let t = tvs[Math.floor(Math.random() * tvs.length)]; if (!t) return;
        let f = filler(Math.random), scr = t.querySelector('.gl-scr'), gl = scr && scr.querySelector('.gl-glass'); if (!scr) return;
        t.className = 'gl-tv fill ' + f[0] + ' flick'; scr.innerHTML = f[1]; if (gl) scr.appendChild(gl);
    }, 30000);
    function filler(R) {
        let t = R() * 100, k = 'off'; for (const [n, w] of FILL) { if (t < w) { k = n; break; } t -= w; }
        if (k === 'blue') return ['blue', `<b class="gl-in">${R() < 0.5 ? 'ビデオ1' : 'AV' + (1 + Math.floor(R() * 3))}</b>`];
        if (k === 'purple') return ['purple', ''];
        if (k === 'snow') return ['snowy', '<i class="gl-snow"></i>'];
        if (k === 'osd') return ['osd', `<b class="gl-num">${1 + Math.floor(R() * 12)}</b>`];
        if (k === 'bars') return ['barsy', '<i class="gl-bars"></i>'];
        return ['off', ''];
    }
    let lastW = 0;
    function build(force) {
        let wall = $('gl-wall'), room = $('gl-room'); if (!wall || !room) return;
        let W = room.clientWidth - 36; if (!force && Math.abs(W - lastW) < 40 && wall.children.length) return; lastW = W;
        let R = rnd(4444 + list.length * 7 + (tag ? seedOf(tag) % 999 : 0)), cols = [], used = 0, orange = false;
        const pickCol = () => { if (!orange && R() < 0.08) { orange = true; return 'orange'; } let t = R(); return t < 0.58 ? 'black' : t < 0.8 ? 'grey' : 'silver'; };
        const pickCtrl = w => { let t = R(); return w < 110 ? (t < 0.7 ? 'none' : 'bottom') : t < 0.6 ? 'bottom' : t < 0.9 ? 'right' : 'none'; };
        while (used < W - 80) { let w = [104, 128, 150, 176, 204][Math.floor(R() * 5)]; w = Math.min(w, W - used); if (w < 84) break; cols.push({ w, items: [], h: 0 }); used += w; }
        if (!cols.length) cols.push({ w: Math.max(120, W), items: [], h: 0 });
        let first = page * PER, shown = list.slice(first, first + PER), nArt = shown.length, rows = Math.max(2, Math.ceil(nArt / cols.length) + 1), targetH = Math.max(rows * 104, room.clientHeight - 150);
        let order = cols.map((c, i) => i).sort((a, b) => Math.abs(a - (cols.length - 1) / 2) - Math.abs(b - (cols.length - 1) / 2));
        shown.forEach((g, i) => { let c = cols[order[i % cols.length]]; c.items.push({ art: first + i }); });
        cols.forEach((c, ci) => {
            let under = R() < 0.4 ? 0 : 1, stack = [];
            for (let k = 0; k < under; k++) stack.push({ fill: 1 });
            c.items.forEach(it => { stack.push(it); if (R() < 0.35) stack.push({ fill: 1 }); });
            let goal = targetH * (0.62 + R() * 0.38);
            stack.forEach(it => { it.w = it.art !== undefined ? c.w - Math.floor(R() * 10) : c.w - Math.floor(R() * 26); it.w -= it.w % 6; it.h = Math.round(it.w * [0.72, 0.77, 0.82, 0.86][Math.floor(R() * 4)]); c.h += it.h; });
            while (c.h < goal) { let w = c.w - Math.floor(R() * 34); w -= w % 6; let h = Math.round(w * [0.72, 0.77, 0.82, 0.86][Math.floor(R() * 4)]); stack.push({ fill: 1, w, h }); c.h += h; }
            c.stack = stack;
        });
        let html = cols.map((c, ci) => '<div class="gl-col" style="width:' + c.w + 'px">' + c.stack.slice().reverse().map((it, si) => {
            let col = pickCol(), ctrl = pickCtrl(it.w), sd = 1000 + (ci * 7 + si * 3) % 16, C = os.tvBox(it.w, it.h, col, ctrl, sd), nudge = Math.round((R() - 0.5) * (c.w - it.w));
            if (it.art !== undefined) {
                let g = list[it.art], fresh = typeof os.isNew === 'function' && os.isNew('gallery', g);
                return tvHtml(C, `<img src="${esc(g.thumb || g.img)}" alt="${esc(g.alt || g.title || '')}" loading="lazy" decoding="async" draggable="false">`, ' art' + (fresh ? ' fresh' : ''), `data-i="${it.art}" aria-label="CH ${ch(it.art)} ${esc(g.title || '')}"`, `--d:${(Math.min(it.art, 12) * 0.08).toFixed(2)}s; margin-left:${nudge}px;`)
                    + `${fresh && C.led ? `<i class="gl-led" title="new" style="left:${(C.led[0] / C.W * 100).toFixed(2)}%; top:${(C.led[1] / C.H * 100).toFixed(2)}%"></i>` : ''}<span class="gl-tape">CH ${ch(it.art)} · ${esc(g.title || '無題')}</span></button>`;
            }
            let f = filler(R);
            return tvHtml(C, f[1], ' fill ' + f[0], '', `margin-left:${nudge}px;`) + '</div>';
        }).join('') + '</div>').join('');
        wall.innerHTML = html;
        let off = null;
        if (!list.length) { off = wall.querySelector('.gl-col:nth-child(' + Math.ceil(cols.length / 2) + ') .gl-tv:last-child'); if (off) { off.className = 'gl-tv fill barsy'; off.querySelector('.gl-scr').innerHTML = `<i class="gl-bars"></i><b class="gl-offair">${two(T('galleryEmptyJp', 'ただいま放送休止中'), T('galleryEmpty', 'nothing on right now'))}</b>`; } }
        let spare = [...wall.querySelectorAll('.gl-tv.fill.snowy')].filter(t => t !== off); if (spare.length) spare[Math.floor(spare.length / 2)].insertAdjacentHTML('beforeend', `<span class="gl-note"><span lang="ja">${esc(T('galleryBroke', 'こわれてる'))}</span><small>${esc(T('galleryBrokeEn', 'broken. dont touch'))}</small></span>`);
        wall.querySelectorAll('.gl-tv.art').forEach(b => {
            b.onclick = () => show(+b.dataset.i);
            let im = b.querySelector('img'); const on = () => { b.classList.add('on'); tint(b, im); }; if (im.complete && im.naturalWidth) on(); else { im.onload = on; im.onerror = () => b.classList.add('on', 'nosig'); }
        });
        // cables everywhere. TODO tidy them lol
        let fl = $('gl-floor'), svg = '<svg viewBox="0 0 400 60" preserveAspectRatio="none">';
        for (let i = 0; i < 6; i++) { let x0 = R() * 400, y0 = 4 + R() * 10, x1 = x0 + (R() - 0.5) * 260, y1 = 20 + R() * 36; svg += `<path d="M${x0.toFixed(0)} ${y0.toFixed(0)} C ${(x0 + 40 * (R() - 0.5)).toFixed(0)} ${(y1 + 10).toFixed(0)}, ${(x1 - 30).toFixed(0)} ${(y0 + 20).toFixed(0)}, ${x1.toFixed(0)} ${y1.toFixed(0)}"/>`; }
        requestAnimationFrame(() => { room.scrollTop = room.scrollHeight; });
        fl.innerHTML = svg + '</svg>' ;
    }
    let rsT = 0; window.addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(() => build(), 160); });
    if (window.ResizeObserver) new ResizeObserver(() => { clearTimeout(rsT); rsT = setTimeout(() => build(), 120); }).observe(document.documentElement);
    function view() {
        return `<div class="gl-view${crt ? ' crt' : ''}" id="gl-view" hidden>
            <div class="gl-set">
                <div class="gl-big"><div class="gl-bscr" id="gl-bscr"><img id="gl-img" alt="" draggable="false"><i class="gl-lines"></i><i class="gl-static" id="gl-static"></i><b class="gl-osd" id="gl-osd"></b><b class="gl-dial" id="gl-dial"></b></div></div>
                <div class="gl-panel">
                    <button data-v="prev" class="gl-key" aria-label="channel down">▼<small>CH</small></button><button data-v="next" class="gl-key" aria-label="channel up">▲<small>CH</small></button>
                    <button data-v="zoom" class="gl-key">⊕<small>${two('拡大', 'zoom')}</small></button>
                    <button data-v="degauss" class="gl-key">◎<small>${two('消磁', 'degauss')}</small></button>
                    <button data-v="crt" class="gl-key${crt ? ' lit' : ''}" id="gl-crtk">▤<small>${two('ブラウン管', 'crt')}</small></button>
                    <span class="gl-grill" aria-hidden="true"></span>
                    <button data-v="close" class="gl-key pwr">⏻<small>${two('電源', 'power')}</small></button>
                </div>
            </div>
            <aside class="gl-ttx"><div class="gl-ttx-h"><b lang="ja">文字放送</b><span id="gl-pg">P100</span><em id="gl-clk"></em></div>
                <h4 id="gl-t"></h4><p class="gl-ttx-d" id="gl-d"></p><div class="gl-body" id="gl-c"></div><p class="gl-tg" id="gl-tg"></p>
                <p class="gl-ttx-f" id="gl-looks"></p><p class="gl-ttx-k">${two(T('galleryKeysJp', '←→ チャンネル · 数字で直接'), T('galleryKeys', '←→ flip · type a number'))}</p></aside>
        </div>`;
    }
    function wireView(r) {
        r.querySelectorAll('[data-v]').forEach(b => b.onclick = e => { e.stopPropagation(); let v = b.dataset.v; if (v === 'prev') step(-1); if (v === 'next') step(1); if (v === 'close') hide(); if (v === 'zoom') toggleZoom(); if (v === 'degauss') degauss(); if (v === 'crt') toggleCrt(); });
        let sc = $('gl-bscr'); if (!sc) return;
        $('gl-img').ondblclick = toggleZoom;
        let p0 = null;
        sc.onpointerdown = e => { p0 = { x: e.clientX, y: e.clientY, sl: sc.scrollLeft, st: sc.scrollTop, t: Date.now() }; };
        sc.onpointermove = e => { if (!p0 || !$('gl-view').classList.contains('zoom')) return; sc.scrollLeft = p0.sl - (e.clientX - p0.x); sc.scrollTop = p0.st - (e.clientY - p0.y); };
        sc.onpointerup = e => { if (!p0) return; let dx = e.clientX - p0.x, dy = e.clientY - p0.y; if (!$('gl-view').classList.contains('zoom') && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && Date.now() - p0.t < 600) step(dx < 0 ? 1 : -1); p0 = null; };
    }
    function osd(txt) { let o = $('gl-osd'); if (!o) return; o.textContent = txt; o.classList.add('on'); clearTimeout(osdT); osdT = setTimeout(() => o.classList.remove('on'), 2400); }
    function show(i) {
        let g = list[i]; if (!g) return;
        let v = $('gl-view'), im = $('gl-img'), st = $('gl-static'), first = v.hidden;
        at = i; v.hidden = false; v.classList.remove('zoom', 'bye');
        if (first) { v.classList.add('hi'); setTimeout(() => v.classList.remove('hi'), 500); }
        st.classList.add('on'); sfx(first ? 'tvOn' : 'chan');
        im.classList.remove('in'); im.alt = g.alt || g.title || '';
        let shown = false;
        im.onload = () => { if (shown) return; shown = true; setTimeout(() => { im.classList.add('in'); st.classList.remove('on'); }, first ? 240 : 130); };
        im.onerror = () => { osd('NO SIGNAL'); };
        im.src = g.img; if (im.complete && im.naturalWidth) im.onload();
        osd('CH ' + ch(i));
        $('gl-pg').textContent = 'P' + (100 + i + 1);
        $('gl-t').textContent = g.title || '無題';
        $('gl-d').textContent = [g.date, g.medium].filter(Boolean).join(' · ');
        $('gl-c').innerHTML = g.content || '';
        $('gl-tg').textContent = tagsOf(g).map(t => '#' + t).join(' ');
        let n = looked(g);
        $('gl-looks').innerHTML = n <= 1 ? two(T('galleryLook1Jp', 'はじめて'), T('galleryLook1', 'first time')) : two(T('galleryLooksJp', '{n}回目の視聴').replace('{n}', n), T('galleryLooks', 'seen {n} times').replace('{n}', n));
        let d = new Date(), p = x => String(x).padStart(2, '0'); $('gl-clk').textContent = p(d.getHours()) + ':' + p(d.getMinutes());
        if (typeof os.markSeen === 'function') os.markSeen('gallery', [key(g)]);
        vcr();
        let tv = document.querySelector('#gl-root .gl-tv[data-i="' + i + '"]'); if (tv) { tv.classList.remove('fresh'); let l = tv.querySelector('.gl-led'); if (l) l.remove(); }
        let nx = list[i + 1]; if (nx) { let pre = new Image(); pre.src = nx.img; }
    }
    function step(d) { if (at < 0 || list.length < 2) return; jump((at + d + list.length) % list.length); }
    function jump(n) {
        if (Math.floor(n / PER) !== page) { page = Math.floor(n / PER); let v = $('gl-view'), keep = v && !v.hidden; render(); if (keep) $('gl-view').hidden = false; }
        show(n);
    }
    function hide() {
        let v = $('gl-view'); if (!v || v.hidden) return;
        sfx('ggOff'); v.classList.add('bye'); at = -1;
        setTimeout(() => { v.hidden = true; v.classList.remove('bye'); }, 380);
    }
    function toggleZoom() { let v = $('gl-view'); v.classList.toggle('zoom'); osd(v.classList.contains('zoom') ? 'ZOOM ×1' : 'ZOOM FIT'); if (v.classList.contains('zoom')) { let s = $('gl-bscr'); requestAnimationFrame(() => { s.scrollLeft = (s.scrollWidth - s.clientWidth) / 2; s.scrollTop = (s.scrollHeight - s.clientHeight) / 2; }); } }
    function degauss() { let v = $('gl-view'); sfx('degauss'); v.classList.remove('dg'); void v.offsetWidth; v.classList.add('dg'); }
    function toggleCrt() {
        crt = !crt; try { localStorage.setItem('vmp_gallery_crt', crt ? '1' : '0'); } catch (e) {}
        $('gl-view').classList.toggle('crt', crt); $('gl-crtk').classList.toggle('lit', crt); sfx('click'); osd(crt ? 'CRT ON' : 'CRT OFF');
    }
    document.addEventListener('keydown', e => {
        let w = $('win-gallery.exe'); if (!w || !w.classList.contains('is-active') || at < 0) return;
        if (/INPUT|TEXTAREA/.test(e.target.tagName)) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); step(1); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); step(-1); }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); hide(); }
        else if (e.key === 'z' || e.key === 'Z') toggleZoom();
        else if (e.key === 'd' || e.key === 'D') degauss();
        else if (/^[0-9]$/.test(e.key)) {
            // type a number like a remote
            dial = (dial + e.key).slice(-2); let dl = $('gl-dial'); dl.textContent = dial.padEnd(2, '-'); dl.classList.add('on');
            clearTimeout(dialT); dialT = setTimeout(() => { let n = +dial - 1; dial = ''; dl.classList.remove('on'); if (list[n]) jump(n); else { osd('NO SIGNAL'); sfx('oops'); } }, dial.length === 2 ? 350 : 1100);
        }
    }, true);

    os.galleryOpen = k => { if (!k || !$('gl-root')) return; tag = ''; let i = all().findIndex(g => key(g) === k); page = i >= 0 ? Math.floor(i / PER) : 0; render(); if (i >= 0) show(i); };

    let vcrT = 0;
    function vcr() {
        clearTimeout(vcrT); let b = $('gl-vcr'); if (!b) return;
        let d = new Date(), p = x => String(x).padStart(2, '0'); b.textContent = p(d.getHours()) + (d.getSeconds() % 2 ? ' ' : ':') + p(d.getMinutes());
        let c = $('gl-vch'); if (c) c.textContent = at >= 0 ? 'CH ' + ch(at) : (list.length ? 'CH --' : 'OFF');
        vcrT = setTimeout(vcr, 1000);
    }
    function inject() {
        let tpl = document.createElement('template'); tpl.id = 'gallery.exe';
        tpl.innerHTML = '<div id="gl-root" class="readable-ui"></div>';
        document.body.appendChild(tpl);
        let base = os.summon.bind(os);
        os.summon = function (id) {
            let existed = $('win-' + id), r = base.apply(os, arguments);
            if (id === 'gallery.exe' && !existed) {
                let w = $('win-gallery.exe'); if (w && !os.isPhone()) w.style.maxWidth = Math.min(1000, innerWidth - 20) + 'px';
                let tt = $('win-title-gallery.exe'); if (tt) { tt.innerHTML = '<span class="gl-wt">gallery.exe <small lang="ja">絵</small></span><span class="gl-vcr" aria-hidden="true"><i class="gl-vcr-rec"></i><b id="gl-vcr">--:--</b><em id="gl-vch">CH --</em></span>'; vcr(); }
                render();
                if (os.galleryWant) { let k = os.galleryWant; os.galleryWant = null; setTimeout(() => os.galleryOpen(k), 50); }
            }
            return r;
        };
    }

    // one tiny snow tile, css shoves it about
    let snow = '';
    try { let c = document.createElement('canvas'); c.width = c.height = 96; let x = c.getContext('2d'), d = x.createImageData(96, 96); for (let i = 0; i < d.data.length; i += 4) { let v = Math.random() * 255 | 0; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } x.putImageData(d, 0, 0); snow = c.toDataURL(); } catch (e) {}

    let css = document.createElement('style');
    css.textContent = `
        #desktop > #win-gallery\\.exe .window-body { padding: 0 !important; overflow: hidden !important; }
        #desktop > #win-gallery\\.exe { border: 1px solid #000 !important; border-radius: 7px !important; background: #0b0a0d !important; box-shadow: 0 0 0 1px #2c2a31, 0 24px 60px rgba(0,0,0,0.75), 0 0 40px color-mix(in srgb, var(--neon-primary) 14%, transparent) !important; overflow: hidden; }
        #desktop > #win-gallery\\.exe::before, #desktop > #win-gallery\\.exe::after { display: none !important; }
        #desktop > #win-gallery\\.exe .window-header { padding: 7px 10px 7px 14px !important; background: repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 3px), linear-gradient(#26242b, #151419) !important; border-bottom: 1px solid #000 !important; box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 0 #2c2a31 !important; }
        #desktop > #win-gallery\\.exe .window-header::before, #desktop > #win-gallery\\.exe .window-header::after { display: none !important; }
        #win-title-gallery\\.exe { display: flex; align-items: center; gap: 14px; flex: 1; text-shadow: none !important; letter-spacing: 0 !important; }
        .gl-wt { font: 12px 'M PLUS 1 Code', monospace; color: #bdb6c6; letter-spacing: 2px; }
        .gl-wt small { margin-left: 4px; color: #6f6880; }
        .gl-vcr { display: flex; align-items: center; gap: 10px; padding: 2px 10px; font: 14px/1 'DotGothic16', monospace; color: #7dffb0; background: #04110a; border-radius: 3px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.08); text-shadow: 0 0 6px rgba(80,255,150,0.7); }
        .gl-vcr em { font-style: normal; font-size: 11px; opacity: 0.85; }
        .gl-vcr-rec { width: 6px; height: 6px; border-radius: 50%; background: #ff3044; box-shadow: 0 0 6px #ff3044; animation: glLed 2s steps(1) infinite; }
        #desktop > #win-gallery\\.exe .win-btn, #desktop > #win-gallery\\.exe .kill-btn { font-size: 11px !important; padding: 2px 7px !important; color: #a9a2b2 !important; background: linear-gradient(#2c2a31, #18171c) !important; border: 1px solid #000 !important; border-radius: 3px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.12) !important; text-shadow: none !important; }
        #gl-root { --snow: url(${snow}); position: relative; height: min(640px, calc(100vh - 210px)); min-height: 380px; overflow: hidden; font: 12px/1.45 'M PLUS 1 Code', monospace; color: #e6e1ec;
            background: repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0 2px, transparent 2px 46px), radial-gradient(80% 60% at 50% 30%, color-mix(in srgb, var(--neon-primary) 8%, #141018), #07060a 80%); }
        #gl-root::after { content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 5; background: radial-gradient(120% 90% at 50% 40%, transparent 55%, rgba(0,0,0,0.55)); }
        #gl-root button { font: inherit; color: inherit; background: none; border: 0; cursor: inherit; }
        #gl-root .jp { display: block; } #gl-root .en { display: block; font-size: 0.82em; opacity: 0.6; }
        .gl-guide { position: absolute; top: 9px; left: 12px; right: 12px; z-index: 3; display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
        .gl-guide b { font-weight: normal; font-size: 10px; letter-spacing: 2px; color: #7d7589; margin-right: 4px; }
        .gl-guide button { padding: 2px 9px; font-size: 11px; border: 1px solid #3a3442 !important; background: #16131b !important; }
        .gl-band { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; padding: 2px 6px; font: 12px 'DotGothic16', monospace; color: #6bff8a; background: #04110a; border-radius: 3px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.9); text-shadow: 0 0 6px rgba(80,255,150,0.6); }
        .gl-band b { font-weight: normal; } .gl-band small { opacity: 0.6; font-size: 10px; }
        #gl-root .gl-band button { padding: 0 4px; color: #6bff8a; border: 0 !important; background: none !important; }
        .gl-guide button.on { border-color: var(--neon-primary) !important; color: #fff; box-shadow: 0 0 10px color-mix(in srgb, var(--neon-primary) 40%, transparent); }
        .gl-room { position: relative; height: 100%; overflow: auto; overscroll-behavior: contain; display: flex; flex-direction: column; }
        .gl-ceil { flex: none; display: flex; justify-content: space-around; height: 34px; padding: 6px 12%; background: linear-gradient(#17151b, transparent); }
        .gl-ceil i { width: 90px; height: 9px; background: #dfe6f0; box-shadow: 0 0 18px rgba(220,235,255,0.55), 0 0 60px rgba(200,220,255,0.18); opacity: 0.75; }
        .gl-ceil i.flick { animation: glTube 7s steps(1) infinite; }
        @keyframes glTube { 0%, 61%, 63%, 64%, 100% { opacity: 0.75; } 62%, 63.5% { opacity: 0.15; } }
        .gl-wall { flex: none; display: flex; align-items: flex-end; justify-content: center; padding: 30px 18px 0; margin-top: auto; }
        .gl-col { display: flex; flex-direction: column; align-items: center; }
        .gl-floor { position: relative; flex: none; height: 64px; background: linear-gradient(#1d1b20, #121015 60%, #0b0a0d); box-shadow: inset 0 8px 14px rgba(0,0,0,0.6); }
        .gl-floor svg { position: absolute; inset: 0; width: 100%; height: 100%; }
        .gl-floor path { fill: none; stroke: #050407; stroke-width: 2px; vector-effect: non-scaling-stroke; }
        #gl-root .gl-tv { position: relative; flex: none; max-width: 100%; margin-top: -2px; padding: 0; background-size: 100% 100%; background-repeat: no-repeat; background-color: transparent; text-align: left; }
        .gl-col > .gl-tv:not(:first-child)::after { content: ''; position: absolute; left: 2%; right: 2%; top: 0; height: 16px; z-index: 2; pointer-events: none; background: radial-gradient(60% 100% at 50% 0, rgba(0,0,0,0.6), transparent); }
        .gl-tv.art { --tint: var(--neon-secondary); z-index: 1; transition: transform 0.18s; }
        .gl-tv.art.on { filter: drop-shadow(0 0 18px color-mix(in srgb, var(--tint) 35%, transparent)); }
        .gl-tv.art:hover { transform: translateY(-2px) scale(1.02); z-index: 3; filter: drop-shadow(0 0 28px color-mix(in srgb, var(--tint) 60%, transparent)) drop-shadow(0 8px 10px rgba(0,0,0,0.6)); }
        .gl-tv.art:focus-visible { outline: 1px dashed var(--neon-secondary); outline-offset: 3px; }
        .gl-scr { position: absolute; display: grid; place-items: center; overflow: hidden; background: #050506; }
        .gl-scr img { max-width: 100%; max-height: 100%; object-fit: contain; opacity: 0; transform: scale(1, 0.006); }
        .gl-tv.on .gl-scr img { animation: glOn 0.55s cubic-bezier(.2, .8, .3, 1) var(--d) forwards; }
        @keyframes glOn { 0% { opacity: 1; transform: scale(0.15, 0.006); filter: brightness(3); } 40% { transform: scale(1, 0.006); filter: brightness(2.5); } 100% { opacity: 1; transform: none; filter: none; } }
        .gl-glass { position: absolute; inset: 0; z-index: 1; pointer-events: none; background: 0 0 / 100% 100% no-repeat; }
        .fill.off .gl-scr { background: radial-gradient(ellipse at 45% 40%, #2a2f2c, #161a18 55%, #0b0d0c); }
        .fill.off .gl-scr::after { content: ''; position: absolute; left: 18%; top: 10%; width: 34%; height: 9%; background: rgba(225,235,255,0.09); filter: blur(2px); transform: skewX(-12deg); }
        .fill.blue .gl-scr { background: #1d33d6; box-shadow: inset 0 0 20px rgba(0,0,0,0.5); }
        .fill.purple .gl-scr { background: #6b33d8; box-shadow: inset 0 0 20px rgba(0,0,0,0.5); }
        .fill.osd .gl-scr { background: #08090b; }
        .gl-in { position: absolute; top: 10%; left: 9%; font: 11px/1 'DotGothic16', monospace; color: #fff; text-shadow: 1px 1px 0 rgba(0,0,0,0.5); font-weight: normal; }
        .gl-num { position: absolute; top: 8%; right: 10%; font: 16px/1 'DotGothic16', monospace; color: #3dff6a; text-shadow: 0 0 6px #2bff5a; font-weight: normal; }
        .fill.blue .gl-scr, .fill.purple .gl-scr { box-shadow: 0 0 18px rgba(70, 80, 255, 0.3), inset 0 0 20px rgba(0,0,0,0.5); }
        .gl-tv.nosig .gl-scr { background: var(--snow) 0 0 / 96px; animation: glSnow 0.25s steps(4) infinite; }
        /* new ones have the power light going */
        .gl-led { position: absolute; z-index: 2; width: 3.4px; height: 3.4px; margin: -1.7px 0 0 -1.7px; border-radius: 50%; background: #ff5a6a; box-shadow: 0 0 4px #ff2a3d, 0 0 9px rgba(255,42,61,0.6); animation: glLed 1.2s steps(1) infinite; pointer-events: none; }
        @keyframes glLed { 50% { opacity: 0.25; } }
        /* label maker tape. wonky cos i did it by hand */
        .gl-tape { position: absolute; left: 8%; bottom: 2px; z-index: 2; max-width: 84%; padding: 1px 6px; font: 9px/1.35 'DotGothic16', monospace; letter-spacing: 1px; color: #f4f0f8; background: #121016; border-radius: 2px; box-shadow: 0 1px 0 rgba(255,255,255,0.15) inset, 0 2px 3px rgba(0,0,0,0.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transform: rotate(-1.2deg); text-shadow: 0 1px 0 #000; }
        .gl-col:nth-child(3n) .gl-tape { transform: rotate(0.8deg); left: 14%; } .gl-col:nth-child(4n) .gl-tape { transform: rotate(-0.4deg); }
        .gl-tv.flick .gl-scr { animation: glFlick 0.4s steps(3); }
        @keyframes glFlick { 0% { filter: brightness(3) contrast(0.4); } 50% { filter: brightness(0.3); } }
        html.reduce-motion .gl-tv.flick .gl-scr { animation: none; }
        .gl-snow { position: absolute; inset: 0; background: var(--snow) 0 0 / 96px; opacity: 0.6; animation: glSnow 0.3s steps(4) infinite; }
        @keyframes glSnow { 25% { background-position: 31px 12px; } 50% { background-position: -20px 40px; } 75% { background-position: 44px -18px; } }
        .gl-note { position: absolute; right: -6px; top: 10%; z-index: 3; display: flex; flex-direction: column; width: 76px; padding: 5px 6px 7px; font: 11px/1.3 'DotGothic16', monospace; color: #2a2430; background: linear-gradient(#fff07a, #ffe45a); transform: rotate(7deg); box-shadow: 1px 3px 4px rgba(0,0,0,0.5); clip-path: polygon(0 0, 100% 0, 100% 86%, 88% 100%, 0 100%); }
        .gl-note small { font-size: 8px; opacity: 0.7; }
        .gl-bars { position: absolute; inset: 0; background: linear-gradient(90deg, #c0c0c0 0 14.28%, #c0c000 0 28.56%, #00c0c0 0 42.84%, #00c000 0 57.12%, #c000c0 0 71.4%, #c00000 0 85.68%, #0000c0 0); opacity: 0.85; }
        .gl-offair { position: absolute; left: 0; right: 0; bottom: 14%; padding: 4px; text-align: center; font-weight: normal; font-size: 10px; color: #fff; background: rgba(0,0,0,0.75); font-family: 'DotGothic16', monospace; }

        .gl-view { position: absolute; inset: 0; z-index: 10; display: grid; grid-template-columns: minmax(0, 1fr) 250px; gap: 14px; padding: 14px; background: rgba(6, 5, 8, 0.96); }
        .gl-view[hidden] { display: none; }
        .gl-view.hi .gl-bscr { animation: glOn 0.45s cubic-bezier(.2, .8, .3, 1); }
        .gl-view.bye .gl-bscr { animation: glOff 0.38s ease-in forwards; }
        @keyframes glOff { 0% { transform: none; filter: none; } 50% { transform: scale(1, 0.006); filter: brightness(3); } 100% { transform: scale(0, 0.006); filter: brightness(3); } }
        .gl-set { display: grid; grid-template-rows: minmax(0, 1fr) auto; gap: 10px; padding: 16px 16px 12px; border-radius: 16px; background: linear-gradient(170deg, #34313b, #1c1a21 70%); box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -4px 0 rgba(0,0,0,0.5), 0 12px 30px rgba(0,0,0,0.7); min-height: 0; }
        .gl-big { min-height: 0; padding: 10px; border-radius: 14px; background: #0b0a0d; box-shadow: inset 0 2px 6px rgba(0,0,0,0.9); }
        .gl-bscr { position: relative; height: 100%; display: grid; place-items: center; overflow: hidden; border-radius: 6px; background: #030304; touch-action: none; }
        .gl-bscr img { max-width: 100%; max-height: 100%; object-fit: contain; opacity: 0; }
        .gl-bscr img.in { opacity: 1; }
        .gl-view.zoom .gl-bscr { overflow: auto; place-items: start; }
        .gl-view.zoom .gl-bscr img { max-width: none; max-height: none; }
        /* crt is opt in. off = the art exactly how i made it */
        .gl-lines { position: absolute; inset: 0; pointer-events: none; opacity: 0; background: repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 1px, transparent 1px 3px), radial-gradient(130% 100% at 50% 50%, transparent 60%, rgba(0,0,0,0.55)); transition: opacity 0.3s; }
        .gl-view.crt .gl-lines { opacity: 1; }
        .gl-view.crt .gl-bscr { border-radius: 7% / 9%; }
        .gl-static { position: absolute; inset: 0; pointer-events: none; background: var(--snow) 0 0 / 96px; opacity: 0; }
        .gl-static.on { opacity: 0.9; animation: glSnow 0.2s steps(4) infinite; }
        .gl-view.dg .gl-bscr { animation: glDeg 0.9s cubic-bezier(.3, .7, .4, 1); }
        @keyframes glDeg { 0% { filter: none; transform: none; } 12% { filter: hue-rotate(120deg) saturate(3); transform: skewX(4deg) scale(1.02); } 30% { filter: hue-rotate(260deg) saturate(2.5); transform: skewX(-3deg); } 50% { filter: hue-rotate(40deg) saturate(1.8); transform: skewX(1.5deg); } 75% { filter: hue-rotate(-30deg); transform: skewX(-0.5deg); } 100% { filter: none; transform: none; } }
        .gl-osd, .gl-dial { position: absolute; top: 14px; left: 18px; z-index: 2; font: 22px/1 'DotGothic16', monospace; color: #6bff8a; text-shadow: 0 0 6px #2bff5a, 2px 2px 0 #000; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
        .gl-dial { left: auto; right: 18px; }
        .gl-osd.on, .gl-dial.on { opacity: 1; }
        .gl-panel { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .gl-key { display: grid; justify-items: center; min-width: 46px; padding: 5px 7px 4px; font-size: 13px !important; color: #e6e1ec !important; border-radius: 5px; background: linear-gradient(#2b2832, #1a181e) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 0 #0a090c, 0 3px 3px rgba(0,0,0,0.5); }
        .gl-key small { font-size: 8px; line-height: 1.2; letter-spacing: 1px; opacity: 0.7; }
        .gl-key:active { transform: translateY(2px); box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 #0a090c; }
        .gl-key.lit { color: #6bff8a !important; text-shadow: 0 0 6px #2bff5a; }
        .gl-key.pwr { color: #ff6a7a !important; }
        .gl-grill { flex: 1; min-width: 20px; height: 22px; margin: 0 6px; background: repeating-linear-gradient(90deg, #0d0c10 0 3px, transparent 3px 6px); border-radius: 3px; opacity: 0.8; }
        /* teletext. blocky primary colours, it was perfect and nobody remembers it */
        .gl-ttx { display: flex; flex-direction: column; gap: 6px; min-height: 0; overflow: auto; padding: 10px 12px; background: #000; color: #fff; font-family: 'DotGothic16', 'M PLUS 1 Code', monospace; box-shadow: inset 0 0 0 2px #111; }
        .gl-ttx-h { display: flex; gap: 8px; align-items: baseline; padding: 2px 6px; background: #0000c8; color: #ffff00; }
        .gl-ttx-h b { font-weight: normal; } .gl-ttx-h span { color: #fff; } .gl-ttx-h em { margin-left: auto; font-style: normal; color: #00ffff; }
        .gl-ttx h4 { margin: 4px 0 0; font-weight: normal; font-size: 16px; color: #00ffff; word-break: break-word; }
        .gl-ttx-d { margin: 0; color: #ffff00; font-size: 11px; }
        .gl-body { line-height: 1.6; font-family: 'M PLUS 1 Code', monospace; font-size: 12px; color: #fff; word-break: break-word; }
        .gl-body img { max-width: 100%; }
        .gl-tg { margin: 0; color: #ff55ff; font-size: 11px; }
        .gl-ttx-f { margin: auto 0 0; padding-top: 6px; border-top: 2px solid #c80000; color: #00ff00; font-size: 11px; }
        .gl-ttx-k { margin: 0; font-size: 10px; color: #777; }
        @media (max-width: 760px) {
            .gl-view { grid-template-columns: 1fr; grid-template-rows: minmax(0, 1fr) auto; padding: 8px; }
            .gl-ttx { max-height: 34vh; }
            .gl-wall { padding: 20px 6px 0; }
            .gl-key { min-width: 38px; }
        }
        html.reduce-motion .gl-tv .gl-scr img { animation: none !important; opacity: 1; transform: none; filter: none; }
        html.reduce-motion .gl-ceil i.flick, html.reduce-motion .gl-snow, html.reduce-motion .gl-static.on, html.reduce-motion .gl-led, html.reduce-motion .gl-view.dg .gl-bscr, html.reduce-motion .gl-view.hi .gl-bscr { animation: none !important; }
    `;
    document.head.appendChild(css);
    inject();
})();
