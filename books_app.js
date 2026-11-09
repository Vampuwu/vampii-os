
(function () {
    const SOUP = 'vampii4444';
    const KEY_READ = 'vmp_read';
    let bookIx = -1, chapIx = -1, fontSize = 15, paper = 'neon', cache = {};

    function unscramble(s) {
        s = String(s);
        if (!s.startsWith('VMP1')) return s;
        let bin = atob(s.slice(4).replace(/\s+/g, ''));
        let k = new TextEncoder().encode(SOUP), o = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i) ^ k[i % k.length] ^ ((i * 7) & 255);
        return new TextDecoder().decode(o);
    }
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    // blank line = new paragraph, *this* is italic. same as the editor or it all goes weird
    function format(text) {
        return esc(text).split(/\n\s*\n/).map(p => {
            p = p.trim();
            if (!p) return '';
            if (p === '***') return '<hr>';
            return '<p>' + p.replace(/\*\*\*(.+?)\*\*\*/gs, '<b><i>$1</i></b>').replace(/\*\*(.+?)\*\*/gs, '<b>$1</b>').replace(/\*(.+?)\*/gs, '<i>$1</i>').replace(/\n/g, '<br>') + '</p>';
        }).join('');
    }
    function books() {
        let b = typeof database !== 'undefined' && Array.isArray(database.books) ? database.books : [];
        return b.map(bk => Object.assign({}, bk, { chapters: (bk.chapters || []).filter(c => !c.hidden) })).filter(bk => bk.chapters.length);
    }
    function read() { try { return JSON.parse(localStorage.getItem(KEY_READ) || '{}'); } catch (e) { return {}; } }
    function saveRead(r) { try { localStorage.setItem(KEY_READ, JSON.stringify(r)); } catch (e) {} }
    function click() { if (typeof os.clickAudio === 'function') os.clickAudio(); }
    const $ = id => document.getElementById(id);

    function shell(inner) {
        let r = $('bk-root');
        if (!r) return null;
        r.className = 'bk-' + paper;
        r.style.setProperty('--bk-size', fontSize + 'px');
        $('bk-body').innerHTML = inner;
        return r;
    }

    function shelf() {
        bookIx = -1; chapIx = -1; opened(false);
        let list = books(), r = read();
        if (!list.length) { shell('<div class="bk-empty"><div class="bk-empty-shelf" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><p>' + esc(T('booksEmpty', 'nothing here yet')) + '</p><small>' + esc(T('booksSoon', '')) + '</small></div>'); return; }
        let hasNovels = list.some(b => !b.shorts), hasShorts = list.some(b => b.shorts);
        let many = list.filter(b => !b.shorts).length + list.filter(b => b.shorts).reduce((n, b) => n + b.chapters.length, 0) > 8;
        shell((many ? '<div class="bk-find"><input type="search" spellcheck="false"><span></span></div>' : '') + (hasNovels && hasShorts ? '<h3 class="bk-sec">本 // NOVELS</h3>' : '') + '<div class="bk-shelf"></div>' + (hasShorts ? '<h3 class="bk-sec">短編 // SHORT STORIES</h3><div class="bk-shorts"></div>' : '') + '<p class="bk-none" hidden></p>');
        let box = $('bk-body').querySelector('.bk-shelf');
        // Short stories don't get a contents page.
        let sbox = $('bk-body').querySelector('.bk-shorts');
        if (sbox) list.forEach((bk, i) => {
            if (!bk.shorts) return;
            bk.chapters.forEach((c, n) => {
                let row = document.createElement('button');
                row.className = 'bk-short';
                let seen = r[bk.id] && r[bk.id].seen && r[bk.id].seen[c.file];
                row.innerHTML = '<span class="bk-st"></span><span class="bk-sc"></span>';
                row.querySelector('.bk-st').textContent = (seen ? '✓ ' : '') + (c.title || ('#' + (n + 1)));
                row.querySelector('.bk-sc').textContent = bk.titleJp ? bk.title + ' // ' + bk.titleJp : (bk.title || '');
                if (typeof os.isNew === 'function' && os.isNew('books', c) && !seen) { let nb = document.createElement('span'); nb.className = 'new-badge'; nb.textContent = 'NEW'; row.querySelector('.bk-st').appendChild(nb); }
                row.onclick = () => { click(); chapter(i, n); };
                row.dataset.find = [c.title, bk.title, bk.titleJp].join(' ').toLowerCase();
                sbox.appendChild(row);
            });
        });
        list.forEach((bk, i) => {
            if (bk.shorts) return;
            let d = document.createElement('div');
            d.className = 'bk-book';
            let last = r[bk.id] && r[bk.id].last;
            let done = bk.chapters.filter(c => r[bk.id] && r[bk.id].seen && r[bk.id].seen[c.file]).length;
            d.innerHTML = '<div class="bk-spine"></div><div class="bk-info"><div class="bk-title"></div><div class="bk-jp"></div><div class="bk-blurb"></div><div class="bk-meta"></div><div class="bk-read"><i></i></div><div class="bk-btns"></div></div>';
            d.querySelector('.bk-read i').style.width = (bk.chapters.length ? done / bk.chapters.length * 100 : 0) + '%';
            d.querySelector('.bk-title').textContent = bk.title || bk.id;
            d.querySelector('.bk-jp').textContent = bk.titleJp || '';
            d.querySelector('.bk-blurb').textContent = bk.blurb || '';
            let fresh = bk.chapters.filter(c => typeof os.isNew === 'function' && os.isNew('books', c)).length;
            d.querySelector('.bk-meta').textContent = bk.chapters.length + ' 章 // ' + done + ' 既読';
            if (fresh) { let nb = document.createElement('span'); nb.className = 'new-badge'; nb.textContent = '新しい章 ' + fresh; d.querySelector('.bk-title').appendChild(nb); }
            let btns = d.querySelector('.bk-btns');
            let open = document.createElement('button');
            open.textContent = '[ 目次 / chapters ]';
            open.onclick = () => { click(); toc(i); };
            btns.appendChild(open);
            if (last !== undefined && bk.chapters[last]) {
                let cont = document.createElement('button');
                cont.textContent = '[ 続きから / continue ]';
                cont.onclick = () => { click(); chapter(i, last); };
                btns.appendChild(cont);
            }
            d.dataset.find = [bk.title, bk.titleJp, bk.blurb, bk.id].concat(bk.chapters.map(c => c.title)).join(' ').toLowerCase();
            box.appendChild(d);
        });
        let f = $('bk-body').querySelector('.bk-find input');
        if (f) {
            f.placeholder = T('booksFind', 'find a book…');
            const go = () => {
                let q = f.value.trim().toLowerCase(), all = $('bk-body').querySelectorAll('[data-find]'), hit = 0;
                all.forEach(el => { let on = !q || el.dataset.find.includes(q); el.hidden = !on; if (on) hit++; });
                $('bk-body').querySelector('.bk-find span').textContent = q ? hit + ' / ' + all.length : all.length;
                $('bk-body').querySelectorAll('.bk-sec').forEach(h => { let g = h.nextElementSibling; h.hidden = !!(g && !g.querySelector('[data-find]:not([hidden])')); });
                let none = $('bk-body').querySelector('.bk-none'); none.hidden = hit > 0; none.textContent = T('booksNone', 'nothing called that');
            };
            f.oninput = go; go();
        }
    }

    function toc(i) {
        bookIx = i; chapIx = -1; opened(false);
        let bk = books()[i], r = read()[bk.id] || {};
        shell('<button class="bk-back">← 本棚 / shelf</button><h2 class="bk-h"></h2><p class="bk-jp2"></p><ol class="bk-toc"></ol><p class="bk-rights"></p>');
        let body = $('bk-body');
        body.querySelector('.bk-back').onclick = () => { click(); shelf(); };
        body.querySelector('.bk-h').textContent = bk.title || bk.id;
        body.querySelector('.bk-jp2').textContent = bk.titleJp || '';
        body.querySelector('.bk-rights').textContent = bk.rights || '';
        let ol = body.querySelector('.bk-toc');
        bk.chapters.forEach((c, n) => {
            let li = document.createElement('li');
            let b = document.createElement('button');
            b.textContent = (r.seen && r.seen[c.file] ? '✓ ' : '') + (c.title || ('Chapter ' + (n + 1)));
            if (typeof os.isNew === 'function' && os.isNew('books', c) && !(r.seen && r.seen[c.file])) { let nb = document.createElement('span'); nb.className = 'new-badge'; nb.textContent = 'NEW'; b.appendChild(nb); }
            if (r.last === n) b.classList.add('here');
            b.onclick = () => { click(); chapter(i, n); };
            li.appendChild(b);
            ol.appendChild(li);
        });
        // 200 chapters in and scrolling from the top every time. no
        let here = ol.querySelector('.here');
        if (here && bk.chapters.length > 12) setTimeout(() => { let sb = scrollBox(); if (sb) sb.scrollTop += here.getBoundingClientRect().top - sb.getBoundingClientRect().top - sb.clientHeight / 2; }, 30);
    }

    async function chapter(i, n) {
        let bk = books()[i], c = bk && bk.chapters[n];
        if (!c) return;
        bookIx = i; chapIx = n;
        shell('<p class="bk-loading">読み込み中… // loading</p>');
        let text = cache[c.file];
        if (text === undefined) {
            try {
                let res = await fetch(c.file, { cache: 'no-cache' });
                if (!res.ok) throw new Error(res.status);
                text = cache[c.file] = unscramble(await res.text());
            } catch (e) {
                shell('<button class="bk-back">' + (bk.shorts ? '← 本棚' : '← 目次') + '</button><p class="bk-empty">この章が見つからない // couldn\'t load this chapter (' + esc(c.file) + ')</p>');
                $('bk-body').querySelector('.bk-back').onclick = () => bk.shorts ? shelf() : toc(i);
                return;
            }
        }
        if (bookIx !== i || chapIx !== n) return;
        shell(`<div class="bk-bar">
                <button data-a="toc">${bk.shorts ? '← 本棚' : '← 目次'}</button>
                <span class="bk-ct"></span>
                <span class="bk-tools"><button data-a="small" title="smaller">A-</button><button data-a="big" title="bigger">A+</button><button data-a="paper" title="neon / paper">◐</button><button data-a="max" title="fullscreen">⛶</button></span>
            </div>
            <div class="bk-progress"><i></i></div>
            <article class="bk-page"><h1></h1>${format(text)}<p class="bk-rights"></p></article>
            <div class="bk-nav"><button data-a="prev">${bk.shorts ? '← 前の話' : '← 前の章'}</button><span class="bk-flip"><button data-a="back" title="前のページ // prev page">‹</button><span class="bk-pnum"></span><button data-a="fwd" title="次のページ // next page">›</button></span><button data-a="next">${bk.shorts ? '次の話 →' : '次の章 →'}</button></div>`);
        let body = $('bk-body');
        body.querySelector('.bk-ct').textContent = bk.shorts ? '短編 // ' + (bk.title || '') : (bk.title || '') + ' // ' + (n + 1) + ' / ' + bk.chapters.length;
        body.querySelector('.bk-page h1').textContent = c.title || ('Chapter ' + (n + 1));
        body.querySelector('.bk-page .bk-rights').textContent = bk.rights || '';
        body.querySelector('[data-a="prev"]').disabled = n === 0;
        body.querySelector('[data-a="next"]').disabled = n === bk.chapters.length - 1;
        body.querySelectorAll('[data-a]').forEach(b => { b.onclick = () => { click(); act(b.dataset.a); }; });
        let r = read();
        r[bk.id] = r[bk.id] || { seen: {}, pos: {} };
        r[bk.id].last = n;
        r[bk.id].seen[c.file] = 1;
        saveRead(r);
        if (typeof os.markSeen === 'function') os.markSeen('books', [c.file]);
        let pos = r[bk.id].pos && r[bk.id].pos[c.file];
        opened(true);
        let pg = body.querySelector('.bk-page');
        pg.addEventListener('scroll', progress, { passive: true });
        pg.addEventListener('wheel', e => { if (!spread()) return; e.preventDefault(); if (Math.abs(e.deltaY) + Math.abs(e.deltaX) < 8 || Date.now() - wheelT < 380) return; wheelT = Date.now(); turn(e.deltaY + e.deltaX > 0 ? 1 : -1, true); }, { passive: false });
        let want = start === 'end' ? 1 : pos || 0; start = '';
        const land = () => {
            even();
            let s = scrollBox();
            if (spread()) { let st = step(), max = s.scrollWidth - s.clientWidth; s.scrollLeft = want === 1 ? max : Math.round(want * max / st) * st; }
            else s.scrollTop = want * (s.scrollHeight - s.clientHeight);
            progress();
        };
        land();
        if (document.fonts) document.fonts.ready.then(() => { if (chapIx === n && bookIx === i) land(); });
    }
    let wheelT = 0, start = '';
    const spread = () => { let w = $('win-books.exe'); return !!(w && w.classList.contains('bk-open') && !(os.isPhone && os.isPhone()) && w.querySelector('.window-body').clientWidth >= 760); };
    const pageEl = () => $('bk-body') && $('bk-body').querySelector('.bk-page');
    const step = () => { let p = pageEl(); return p ? p.clientWidth + parseFloat(getComputedStyle(p).columnGap || 0) : 1; };
    function opened(on) {
        let w = $('win-books.exe'); if (!w) return;
        w.classList.toggle('bk-open', on);
        let r = $('bk-root'); if (r) r.classList.toggle('bk-spread', on && spread());
    }
    // odd pages = blank one on the end or the spreads go wonky
    function even() {
        let p = pageEl(); if (!p) return;
        let old = p.querySelector('.bk-pad'); if (old) old.remove();
        if (!spread()) return;
        let g = parseFloat(getComputedStyle(p).columnGap || 0), w = (p.clientWidth - g) / 2, cols = Math.round((p.scrollWidth + g) / (w + g));
        if (cols % 2) { let pad = document.createElement('div'); pad.className = 'bk-pad'; p.appendChild(pad); }
    }
    function turn(d, chap) {
        let p = pageEl(); if (!p) return;
        if (os.sfx) os.sfx('page');
        if (!spread()) { if (chap) act(d > 0 ? 'next' : 'prev'); return; }
        let st = step(), max = p.scrollWidth - p.clientWidth, to = Math.round(p.scrollLeft / st) * st + d * st;
        if (d > 0 ? p.scrollLeft >= max - 4 : p.scrollLeft <= 4) {
            if (!chap) return;
            let bk = books()[bookIx];
            if (d > 0 && chapIx < bk.chapters.length - 1) chapter(bookIx, chapIx + 1);
            if (d < 0 && chapIx > 0) { start = 'end'; chapter(bookIx, chapIx - 1); }
            return;
        }
        p.scrollLeft = Math.max(0, Math.min(max, to));
        let r = $('bk-root');
        if (r && !document.documentElement.classList.contains('reduce-motion')) { r.classList.remove('bk-turn'); void r.offsetWidth; r.classList.add('bk-turn'); }
    }
    function scrollBox() { if (spread() && pageEl()) return pageEl(); let w = $('win-books.exe'); return w ? w.querySelector('.window-body') : $('bk-body'); }
    let saveTm = 0;
    function progress() {
        let s = scrollBox(), bar = $('bk-body') && $('bk-body').querySelector('.bk-progress i');
        if (!s || !bar) return;
        let k;
        if (spread()) {
            let max = s.scrollWidth - s.clientWidth, st = step(), all = Math.max(1, Math.round((s.scrollWidth + st - s.clientWidth) / st) * 2), at = Math.round(s.scrollLeft / st) * 2 + 1;
            k = max > 0 ? s.scrollLeft / max : 1;
            let pn = $('bk-body').querySelector('.bk-pnum'); if (pn) pn.textContent = at + '–' + Math.min(at + 1, all) + ' / ' + all;
            let f = $('bk-body').querySelectorAll('.bk-flip button'); if (f.length) { f[0].disabled = s.scrollLeft < 4 && chapIx === 0; f[1].disabled = s.scrollLeft > max - 4 && chapIx === books()[bookIx].chapters.length - 1; }
        } else k = s.scrollHeight > s.clientHeight ? s.scrollTop / (s.scrollHeight - s.clientHeight) : 1;
        bar.style.width = (k * 100).toFixed(1) + '%';
        clearTimeout(saveTm);
        let bk = books()[bookIx], c = bk && bk.chapters[chapIx], bi = bookIx, ci = chapIx;
        saveTm = setTimeout(() => {
            if (!c || bi !== bookIx || ci !== chapIx) return;
            let r = read();
            r[bk.id] = r[bk.id] || { seen: {}, pos: {} };
            r[bk.id].pos = r[bk.id].pos || {};
            r[bk.id].pos[c.file] = +k.toFixed(3);
            saveRead(r);
        }, 400);
    }
    function act(a) {
        if (a === 'toc') { let bk = books()[bookIx]; return bk && bk.shorts ? shelf() : toc(bookIx); }
        if (a === 'back') return turn(-1, true);
        if (a === 'fwd') return turn(1, true);
        if (a === 'prev') return chapter(bookIx, chapIx - 1);
        if (a === 'next') return chapter(bookIx, chapIx + 1);
        if (a === 'small' || a === 'big') {
            fontSize = Math.max(12, Math.min(26, fontSize + (a === 'big' ? 1 : -1)));
            try { localStorage.setItem('vmp_read_size', fontSize); } catch (e) {}
            $('bk-root').style.setProperty('--bk-size', fontSize + 'px');
        }
        if (a === 'paper') {
            paper = paper === 'neon' ? 'bone' : 'neon';
            try { localStorage.setItem('vmp_read_paper', paper); } catch (e) {}
            let rt = $('bk-root'); rt.classList.remove('bk-neon', 'bk-bone'); rt.classList.add('bk-' + paper); setTimeout(() => { even(); progress(); }, 50);
        }
        if (a === 'max') { let b = document.querySelector('#win-books\\.exe .max-btn'); if (b) b.click(); }
        if (a === 'small' || a === 'big') setTimeout(() => { even(); let p = pageEl(); if (spread() && p) p.scrollLeft = Math.round(p.scrollLeft / step()) * step(); progress(); }, 50);
    }
    document.addEventListener('keydown', e => {
        if (chapIx < 0 || !$('bk-root') || e.target.closest('input, textarea')) return;
        let w = $('win-books.exe');
        if (!w || !w.classList.contains('is-active')) return;
        if (e.key === 'ArrowRight') turn(1, true);
        if (e.key === 'ArrowLeft') turn(-1, true);
    });

    function init() {
        try { fontSize = Number(localStorage.getItem('vmp_read_size')) || 15; paper = localStorage.getItem('vmp_read_paper') || 'neon'; } catch (e) {}
        let w = $('win-books.exe'), s = w && w.querySelector('.window-body');
        if (s) s.addEventListener('scroll', progress, { passive: true });
        if (s && window.ResizeObserver) { let rt = 0; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { if (chapIx < 0) return; let r = $('bk-root'); if (r) r.classList.toggle('bk-spread', spread()); even(); let p = pageEl(); if (spread() && p) p.scrollLeft = Math.round(p.scrollLeft / step()) * step(); progress(); }, 120); }).observe(s); }
        shelf();
    }

    let tpl = document.createElement('template');
    tpl.id = 'books.exe';
    tpl.innerHTML = '<p class="file-path">// books.exe</p><div id="bk-root" class="bk-neon"><div id="bk-body"></div></div>';
    document.body.appendChild(tpl);

    let css = document.createElement('style');
    css.textContent = `
        #desktop > #win-books\\.exe { border: 1px solid rgba(255, 255, 255, 0.14) !important; border-radius: 14px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.07), transparent 38%), radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--neon-primary) 10%, #121018), #0a090d 75%) !important;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 2px 3px 0 color-mix(in srgb, var(--neon-secondary) 30%, #0a090d), 4px 6px 0 color-mix(in srgb, var(--neon-secondary) 16%, #0a090d), 6px 9px 0 color-mix(in srgb, var(--neon-secondary) 7%, #0a090d), 0 26px 50px rgba(0, 0, 0, 0.6) !important; }
        #desktop > #win-books\\.exe::before { display: none; }
        #desktop > #win-books\\.exe .window-header { background: none !important; border-bottom: 1px solid rgba(255, 255, 255, 0.07) !important; box-shadow: none !important; border-radius: 14px 14px 0 0; }
        #desktop > #win-books\\.exe .window-header::before, #desktop > #win-books\\.exe .window-header::after { display: none; }
        #desktop > #win-books\\.exe .window-header > span:first-child { font: 13px 'DotGothic16', monospace !important; letter-spacing: 2px !important; color: #e8e2ec !important; text-shadow: none !important; opacity: 1 !important; }
        #desktop > #win-books\\.exe .win-btn, #desktop > #win-books\\.exe .kill-btn { width: 20px !important; height: 20px !important; border-radius: 50% !important; border: 1px solid color-mix(in srgb, var(--neon-secondary) 45%, transparent) !important; background: rgba(255, 255, 255, 0.04) !important; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12) !important; }
        #desktop > #win-books\\.exe .win-btn::before, #desktop > #win-books\\.exe .kill-btn::before { --gw: 10px; color: var(--neon-secondary) !important; opacity: 0.9 !important; }
        #desktop > #win-books\\.exe .kill-btn { border-color: rgba(255, 90, 114, 0.55) !important; }
        #desktop > #win-books\\.exe .kill-btn::before { color: #ff7088 !important; }
        #desktop > #win-books\\.exe .win-btn:hover { background: var(--neon-secondary) !important; }
        #desktop > #win-books\\.exe .kill-btn:hover { background: #e0304e !important; border-color: #e0304e !important; }
        #desktop > #win-books\\.exe .win-btn:hover::before, #desktop > #win-books\\.exe .kill-btn:hover::before { color: #000 !important; }
        #desktop > #win-books\\.exe .window-body { background: none !important; box-shadow: none !important; border-radius: 0 0 14px 14px; }
        #win-books\\.exe .file-path { display: none; }
        #bk-root { --bk-size: 15px; }
        #bk-root button { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 3px; color: var(--text-main); font: inherit; font-size: 13px; padding: 5px 10px; cursor: inherit; transition: border-color 0.12s, background 0.12s; }
        #bk-root button:hover:not(:disabled) { border-color: var(--neon-secondary); background: color-mix(in srgb, var(--neon-secondary) 14%, transparent); color: #fff; }
        #bk-root button:disabled { opacity: 0.25; }
        .bk-loading { opacity: 0.7; padding: 30px 0; text-align: center; font: 16px 'DotGothic16', monospace; }
        .bk-empty { padding: 40px 0 30px; text-align: center; }
        .bk-empty-shelf { display: flex; justify-content: center; align-items: flex-end; gap: 10px; height: 130px; margin: 0 auto 22px; padding: 0 24px 10px; width: fit-content; border-bottom: 2px solid color-mix(in srgb, var(--neon-secondary) 45%, transparent); }
        .bk-empty-shelf i { width: 16px; height: 100px; border: 1px dashed rgba(255, 255, 255, 0.16); border-radius: 2px 2px 0 0; }
        .bk-empty-shelf i:nth-child(2n) { height: 84px; } .bk-empty-shelf i:nth-child(3n) { height: 112px; }
        .bk-empty p { margin: 0 0 6px; font: 16px 'DotGothic16', monospace; color: #e8e2ec; }
        .bk-empty small { font: 12px 'DotGothic16', monospace; color: var(--neon-secondary); letter-spacing: 2px; opacity: 0.8; }
        .bk-shelf { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 215px)); gap: 20px; }
        .bk-book { position: relative; display: flex; gap: 0; aspect-ratio: 3 / 4; min-height: 0; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 4px 10px 10px 4px; overflow: hidden;
            background: linear-gradient(150deg, rgba(255, 255, 255, 0.08), transparent 35%), linear-gradient(180deg, color-mix(in srgb, var(--neon-primary) 14%, #16131b), #0b0a0e); box-shadow: 3px 4px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1); transition: transform 0.2s, box-shadow 0.2s; }
        .bk-book:hover { transform: translateY(-4px); box-shadow: 3px 8px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.12); }
        .bk-spine { width: 12px; flex-shrink: 0; background: linear-gradient(90deg, color-mix(in srgb, var(--neon-primary) 50%, #000), var(--neon-primary) 60%, color-mix(in srgb, var(--neon-primary) 40%, #000)); }
        .bk-info { flex: 1; min-width: 0; display: flex; flex-direction: column; padding: 18px 16px 14px; }
        .bk-title { font: bold 20px/1.3 Georgia, 'Yu Mincho', serif; color: #fff; text-shadow: none; }
        .bk-jp { margin-top: 4px; font-size: 13px; color: var(--neon-secondary); }
        .bk-blurb { flex: 1; margin: 12px 0; font-size: 13px; line-height: 1.7; color: #d6d0da; display: -webkit-box; -webkit-line-clamp: 6; -webkit-box-orient: vertical; overflow: hidden; }
        .bk-meta { font: 12px 'DotGothic16', monospace; color: var(--neon-secondary); margin-bottom: 6px; }
        .bk-read { height: 2px; margin-bottom: 12px; background: rgba(255, 255, 255, 0.08); }
        .bk-read i { display: block; height: 100%; background: var(--neon-primary); }
        .bk-btns { display: flex; gap: 6px; flex-wrap: wrap; }
        .bk-find { display: flex; align-items: center; gap: 10px; margin: 0 0 14px; }
        .bk-find input { flex: 1; max-width: 320px; background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 3px; color: #fff; font: 14px 'DotGothic16', monospace; padding: 6px 10px; outline: none; }
        .bk-find input:focus { border-color: var(--neon-secondary); }
        .bk-find span { font: 12px 'DotGothic16', monospace; color: var(--neon-secondary); opacity: 0.8; }
        .bk-none { text-align: center; font: 14px 'DotGothic16', monospace; opacity: 0.6; padding: 20px 0; }
        .bk-book, #bk-root .bk-short, .bk-toc li { content-visibility: auto; }
        .bk-book { contain-intrinsic-size: auto 300px; } #bk-root .bk-short { contain-intrinsic-size: auto 58px; } .bk-toc li { contain-intrinsic-size: auto 42px; }
        [data-find][hidden] { display: none !important; }
        .bk-sec { margin: 22px 0 10px; font: 13px 'DotGothic16', monospace; letter-spacing: 2px; color: var(--neon-secondary); border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 6px; }
        .bk-shorts { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 8px; }
        #bk-root .bk-short { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; text-align: left; padding: 10px 12px; border-left: 3px solid var(--neon-primary); }
        .bk-st { font: 15px Georgia, 'Yu Mincho', serif; color: #fff; } .bk-sc { font-size: 11px; opacity: 0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
        .bk-h { font: bold 26px Georgia, 'Yu Mincho', serif; color: #fff; margin: 18px 0 2px; }
        .bk-jp2 { color: var(--neon-secondary); margin: 0 0 14px; }
        .bk-toc { list-style: none; padding: 0; margin: 0; counter-reset: ch; border-top: 1px solid rgba(255, 255, 255, 0.07); }
        .bk-toc li { counter-increment: ch; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.07); }
        .bk-toc li::before { content: counter(ch, decimal-leading-zero); font: 16px 'DotGothic16', monospace; color: var(--neon-secondary); opacity: 0.7; width: 28px; }
        .bk-toc button { flex: 1; border: 0 !important; background: none !important; text-align: left; padding: 10px 4px !important; font-size: 15px !important; }
        .bk-toc button:hover { color: var(--neon-secondary) !important; }
        .bk-toc button.here { color: var(--neon-primary) !important; }
        .bk-bar { position: sticky; top: -20px; z-index: 2; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding: 8px 0; background: linear-gradient(#0e0d12 80%, transparent); }
        .bk-ct { flex: 1; font: 12px 'DotGothic16', monospace; opacity: 0.8; }
        .bk-tools { display: flex; gap: 4px; }
        .bk-progress { height: 2px; background: rgba(255, 255, 255, 0.08); margin-bottom: 10px; }
        .bk-progress i { display: block; height: 100%; width: 0; background: var(--neon-primary); }
        .bk-page { max-width: 38em; margin: 0 auto; padding: 10px 6px 20px; font-family: Georgia, 'Yu Mincho', 'Hiragino Mincho ProN', serif; font-size: var(--bk-size); line-height: 1.75; color: #ece8ef; }
        .bk-page h1 { font-size: 1.35em; color: #fff; text-shadow: none; margin: 10px 0 24px; }
        .bk-page p { margin: 0 0 1.1em; }
        .bk-page hr { border: 0; height: 1px; width: 4em; margin: 2em auto; background: var(--neon-secondary); opacity: 0.6; }
        .bk-rights { font: 11px monospace; opacity: 0.55; margin-top: 3em; }
        .bk-nav { display: flex; justify-content: space-between; align-items: center; gap: 8px; max-width: 38em; margin: 0 auto 10px; }
        .bk-flip { display: none; align-items: center; gap: 10px; }
        .bk-pnum { font: 14px 'DotGothic16', monospace; color: var(--neon-secondary); min-width: 90px; text-align: center; }
        #win-books\\.exe.bk-open .window-body { height: min(78vh, 760px); display: flex; flex-direction: column; overflow: hidden !important; }
        #win-books\\.exe.bk-open #bk-root, #win-books\\.exe.bk-open #bk-body { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
        #bk-root.bk-spread .bk-bar { position: static; background: none; }
        #bk-root.bk-spread .bk-page { flex: 1 1 auto; min-height: 0; max-width: none; width: 100%; box-sizing: border-box; margin: 0; padding: 4px 0 0; overflow: hidden; columns: 2; column-gap: 72px; column-fill: auto;
            column-rule: 1px solid color-mix(in srgb, var(--neon-primary) 55%, transparent); background: radial-gradient(4px 60% at 50% 50%, color-mix(in srgb, var(--neon-primary) 25%, transparent), transparent); }
        #bk-root.bk-spread .bk-page h1 { margin-top: 0; }
        #bk-root.bk-spread .bk-pad { break-before: column; height: 1px; }
        #bk-root.bk-spread .bk-flip { display: flex; }
        #bk-root.bk-spread .bk-nav { max-width: none; margin: 10px 0 0; }
        #bk-root.bk-turn .bk-page { animation: bkTurn 0.42s ease-out; }
        @keyframes bkTurn { 0% { filter: brightness(1.5); -webkit-mask: linear-gradient(90deg, #000 40%, transparent 50%, #000 60%) 0 0 / 300% 100%; } 100% { filter: none; -webkit-mask: linear-gradient(90deg, #000 40%, transparent 50%, #000 60%) 100% 0 / 300% 100%; } }
        #bk-root.bk-bone .bk-page { background: #ece6db; color: #1d1714; padding: 28px 30px; border-radius: 3px; box-shadow: inset 0 0 60px rgba(90, 60, 30, 0.2); }
        #bk-root.bk-bone.bk-spread .bk-page { padding: 26px 0; margin: 0 32px; border-radius: 0; column-rule-color: rgba(90, 60, 30, 0.35); box-shadow: -32px 0 0 #ece6db, 32px 0 0 #ece6db, -32px 0 0 1px rgba(0, 0, 0, 0.1), 32px 0 0 1px rgba(0, 0, 0, 0.1); }
        #bk-root.bk-bone .bk-page h1 { color: #5a0f1c; }
        #bk-root.bk-bone .bk-page hr::after { color: #5a0f1c; }
        @media (max-width: 767px) { .bk-page { padding: 6px 2px 20px; } #bk-root.bk-bone .bk-page { padding: 18px 16px; } .bk-shelf { grid-template-columns: 1fr; } .bk-book { aspect-ratio: auto; } }
    `;
    document.head.appendChild(css);

    const baseSummon = os.summon.bind(os);
    os.summon = function (id) {
        let existed = document.getElementById('win-' + id);
        baseSummon(id);
        if (existed || id !== 'books.exe') return;
        let t = document.getElementById('win-title-books.exe');
        if (t) t.textContent = '// books.exe 【本】';
        init();
    };

    os.openChapter = function (bookId, file) {
        let list = books(), i = list.findIndex(b => b.id === bookId);
        if (i < 0) return;
        let n = list[i].chapters.findIndex(c => c.file === file);
        setTimeout(() => n >= 0 ? chapter(i, n) : toc(i), 50);
    };
    function tag() {
        document.querySelectorAll('.desktop-icons .icon-wrap').forEach(ic => { let l = ic.querySelector('.icon-label'); if (l && l.textContent.trim() === 'books.exe') ic.dataset.books = '1'; });
        if (typeof os.paintNewDots === 'function') os.paintNewDots();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tag); else tag();
})();
