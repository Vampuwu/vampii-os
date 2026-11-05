// notes only save in your own browser, I can't see them don't worry
(function () {
    const KEY = 'vmp_notes';
    const $ = id => document.getElementById(id);
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const click = () => typeof os.clickAudio === 'function' && os.clickAudio();
    const narrow = () => !!(window.matchMedia && window.matchMedia('(max-width: 640px)').matches);
    let sideShut = narrow();
    function load() { try { let s = JSON.parse(localStorage.getItem(KEY)); return s && Array.isArray(s.notes) ? s : { notes: [] }; } catch (e) { return { notes: [] }; } }
    const keep = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
    const when = t => { if (!t) return ''; let d = new Date(t), p = n => String(n).padStart(2, '0'); return d.getFullYear() + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); };
    const words = t => (String(t || '').trim().match(/\S+/g) || []).length;
    let cur = null, find = '', delArm = null, renaming = null, wrap = true, big = 0;
    try { wrap = localStorage.getItem('vmp_notes_wrap') !== '0'; big = +localStorage.getItem('vmp_notes_size') || 0; } catch (e) {}

    function list(s) {
        let q = find.toLowerCase(), all = s.notes.slice();
        all.sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || (b.at || 0) - (a.at || 0));
        return q ? all.filter(n => ((n.title || '') + ' ' + (n.body || '')).toLowerCase().indexOf(q) !== -1) : all;
    }
    function render() {
        let r = $('nt-root'); if (!r) return;
        let s = load(), items = list(s);
        if (cur && !s.notes.find(x => x.id === cur)) cur = null;
        if (!cur && s.notes.length) cur = list(Object.assign({}, s, { notes: s.notes }))[0].id;
        const row = n => n.id === renaming
            ? `<input class="nt-ren" data-ren="${esc(n.id)}" value="${esc(n.title)}" maxlength="60">`
            : `<button class="nt-item${cur === n.id ? ' on' : ''}" data-n="${esc(n.id)}" title="right click for more">${n.pin ? '📌 ' : ''}${esc(n.title || 'new note')}<i>.txt</i></button>`;
        let main;
        let n = s.notes.find(x => x.id === cur);
        if (!n) main = `<div class="nt-empty"><div class="nt-paper" aria-hidden="true"><i></i><i></i><i></i><i></i></div>${esc(T('notesEmpty', 'nothing here yet'))}<br><button class="nt-new" data-new2>+ 新しいメモ // new note</button></div>`;
        else main = `<div class="nt-head"><input class="nt-title" data-title maxlength="60" value="${esc(n.title)}" placeholder="title" aria-label="title"><span>.txt</span></div><textarea class="nt-area" data-body aria-label="note" placeholder="…" spellcheck="false" wrap="${wrap ? 'soft' : 'off'}">${esc(n.body)}</textarea>`;
        let bar = [['file', T('notesFile', 'ファイル // file')], ['edit', T('notesEdit', '編集 // edit')], ['view', T('notesView', '表示 // view')]].map(([k, l]) => `<button data-bar="${k}">${esc(l)}</button>`).join('');
        let foot = n ? `<span class="nt-meta">${words(n.body)} words</span><span class="nt-pos">Ln 1, Col 1</span><span class="nt-when">${n.at ? esc(when(n.at)) : ''} <em class="nt-saved"></em></span>` : '<span></span>';
        r.innerHTML = `<div class="nt${sideShut ? ' side-shut' : ''}${wrap ? '' : ' nowrap'}" style="--nt-size: ${14 + big}px"><div class="nt-bar">${bar}<button class="nt-toggle" data-toggle aria-label="show or hide the list">${sideShut ? '☰ 一覧 // list' : '◂ 隠す // hide'}</button></div><div class="nt-body"><div class="nt-side"><input class="nt-find" data-find placeholder="探す // search" value="${esc(find)}" aria-label="search notes"><div class="nt-files">${items.map(row).join('')}</div><button class="nt-new" data-new>+ 新しいメモ // new note</button></div><div class="nt-main">${main}</div></div><div class="nt-foot">${foot}<span class="nt-fine">この端末だけ // stays on this machine</span></div></div>`;
        wire(r);
    }
    function wire(r) {
        let tg = r.querySelector('[data-toggle]'); if (tg) tg.onclick = () => { click(); sideShut = !sideShut; render(); };
        r.querySelectorAll('[data-n]').forEach(b => {
            b.onclick = () => { click(); cur = b.dataset.n; delArm = null; if (narrow()) sideShut = true; render(); };
            b.ondblclick = () => { renaming = b.dataset.n; render(); focusRen(); };
            b.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); menu(e, b.dataset.n); };
        });
        let fi = r.querySelector('[data-find]');
        fi.oninput = () => { find = fi.value; let at = fi.selectionStart; render(); let f2 = $('nt-root').querySelector('[data-find]'); f2.focus(); f2.setSelectionRange(at, at); };
        r.querySelectorAll('[data-new], [data-new2]').forEach(b => b.onclick = () => add('', ''));
        let rn = r.querySelector('[data-ren]');
        if (rn) { const done = () => { setNote(rn.dataset.ren, { title: rn.value }); renaming = null; render(); }; rn.onkeydown = e => { if (e.key === 'Enter') done(); if (e.key === 'Escape') { renaming = null; render(); } }; rn.onblur = done; }
        r.querySelectorAll('[data-bar]').forEach(b => b.onclick = e => { click(); barMenu(b); });
        let t = r.querySelector('[data-title]'), a = r.querySelector('[data-body]'), tm = 0;
        const pos = () => { let ps = r.querySelector('.nt-pos'); if (!ps || !a) return; let before = a.value.slice(0, a.selectionStart).split('\n'); ps.textContent = 'Ln ' + before.length + ', Col ' + (before[before.length - 1].length + 1); };
        if (a) ['keyup', 'click', 'select', 'focus'].forEach(ev => a.addEventListener(ev, pos));
        const save = () => {
            setNote(cur, { title: t ? t.value : undefined, body: a ? a.value : undefined });
            let it = r.querySelector('.nt-item.on'); if (it && t) it.textContent = (load().notes.find(x => x.id === cur) || {}).pin ? '📌 ' + (t.value || 'new note') : (t.value || 'new note');
            let m = r.querySelector('.nt-meta'); if (m && a) m.textContent = words(a.value) + ' words';
            let wh = r.querySelector('.nt-when'); if (wh) wh.firstChild.textContent = when(Date.now()) + ' ';
            pos();
            let sv = r.querySelector('.nt-saved'); if (sv) { sv.textContent = '保存 // saved'; clearTimeout(tm); tm = setTimeout(() => { sv.textContent = ''; }, 1200); }
        };
        if (t) t.oninput = save; if (a) a.oninput = save;
        if (a) a.onkeydown = e => { if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); a.setRangeText('\t', a.selectionStart, a.selectionEnd, 'end'); save(); } };
    }
    function focusRen() { let i = $('nt-root').querySelector('[data-ren]'); if (i) { i.focus(); i.select(); } }
    function setNote(id, f) { let s = load(), n = s.notes.find(x => x.id === id); if (!n) return; Object.keys(f).forEach(k => { if (f[k] !== undefined) n[k] = f[k]; }); n.at = Date.now(); keep(s); }
    function add(title, body) { if (os.sfx) os.sfx('noteNew'); let s = load(), id = 'n' + Date.now().toString(36); s.notes.push({ id, title, body, at: Date.now() }); keep(s); cur = id; render(); let a = $('nt-root').querySelector('[data-body]'); if (a) a.focus(); }
    // downloads it as an actual .txt
    function saveTxt(n) {
        if (os.sfx) os.sfx('noteSave');
        let b = new Blob([(n.title ? n.title + '\n\n' : '') + (n.body || '')], { type: 'text/plain' }), a = document.createElement('a');
        a.href = URL.createObjectURL(b); a.download = (n.title || 'note').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 40) + '.txt'; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }

    function barMenu(b) {
        let open = $('nt-menu') && $('nt-menu').dataset.from === b.dataset.bar;
        closeMenu();
        if (open) return;
        let r = b.getBoundingClientRect(), k = b.dataset.bar, n = load().notes.find(x => x.id === cur);
        let rows = k === 'file' ? [['new', '新しいメモ // new note'], n && ['txt', '.txtで保存 // save as .txt'], n && ['del', delArm === cur ? '本当に？ // really? click again' : '削除 // delete']]
            : k === 'edit' ? [n && ['copy', 'コピー // copy the text'], n && ['dup', '複製 // duplicate'], n && ['rename', '名前を変える // rename'], n && ['pin', n.pin ? 'ピン外す // unpin' : 'ピン留め // pin to the top']]
            : [['wrap', (wrap ? '✓ ' : '\u2003') + T('notesWrap', '折り返す // word wrap')], ['bigger', 'A+'], ['smaller', 'A-'], ['list', sideShut ? '☰ 一覧 // list' : '◂ 隠す // hide']];
        rows = rows.filter(Boolean);
        if (!rows.length) return;
        if (k === 'view') return menuAt(r.left, r.bottom, rows, act => {
            if (act === 'wrap') { wrap = !wrap; try { localStorage.setItem('vmp_notes_wrap', wrap ? '1' : '0'); } catch (e) {} }
            if (act === 'bigger' || act === 'smaller') { big = Math.max(-3, Math.min(10, big + (act === 'bigger' ? 1 : -1))); try { localStorage.setItem('vmp_notes_size', big); } catch (e) {} }
            if (act === 'list') sideShut = !sideShut;
            render();
        }, k);
        if (k === 'file' && !n) return menuAt(r.left, r.bottom, rows, () => add('', ''), k);
        menu({ clientX: r.left, clientY: r.bottom }, cur, rows, k);
    }
    function menuAt(x, y, rows, fn, from) {
        let m = document.createElement('div');
        m.id = 'nt-menu'; m.setAttribute('role', 'menu'); m.dataset.from = from || '';
        m.innerHTML = rows.map(([k, l]) => `<button role="menuitem" data-m="${k}">${esc(l)}</button>`).join('');
        document.body.appendChild(m);
        m.style.left = Math.max(6, Math.min(x, innerWidth - m.offsetWidth - 6)) + 'px';
        m.style.top = Math.max(6, Math.min(y, innerHeight - m.offsetHeight - 6)) + 'px';
        m.onclick = ev => { let k = ev.target.dataset.m; if (!k) return; click(); closeMenu(); fn(k); };
        setTimeout(() => document.addEventListener('mousedown', outside), 0);
    }
    function menu(e, id, only, from) {
        closeMenu();
        let n = load().notes.find(x => x.id === id);
        if (!n) return;
        let rows = only || [['open', '開く // open'], ['rename', '名前を変える // rename'], ['pin', n.pin ? 'ピン外す // unpin' : 'ピン留め // pin to the top'], ['dup', '複製 // duplicate'], ['copy', 'コピー // copy the text'], ['txt', '.txtで保存 // save as .txt'], ['del', delArm === id ? '本当に？ // really? click again' : '削除 // delete']];
        let m = document.createElement('div');
        m.id = 'nt-menu'; m.setAttribute('role', 'menu'); m.dataset.from = from || '';
        m.innerHTML = rows.map(([k, l]) => `<button role="menuitem" data-m="${k}">${l}</button>`).join('');
        document.body.appendChild(m);
        m.style.left = Math.max(6, Math.min(e.clientX, innerWidth - m.offsetWidth - 6)) + 'px';
        m.style.top = Math.max(6, Math.min(e.clientY, innerHeight - m.offsetHeight - 6)) + 'px';
        m.onclick = ev => {
            let k = ev.target.dataset.m; if (!k) return; if (!['new', 'dup', 'txt'].includes(k) && !(k === 'del' && delArm === id)) click();
            if (k === 'open') { cur = id; }
            if (k === 'new') { closeMenu(); add('', ''); return; }
            if (k === 'rename') { renaming = id; }
            if (k === 'pin') setNote(id, { pin: !n.pin });
            if (k === 'dup') { closeMenu(); add((n.title || 'note') + ' (2)', n.body); return; }
            if (k === 'copy') { try { navigator.clipboard.writeText(n.body || ''); } catch (er) {} }
            if (k === 'txt') saveTxt(n);
            if (k === 'del') { if (delArm !== id) { delArm = id; closeMenu(); menu(e, id, only && only.map(x => x[0] === 'del' ? ['del', '本当に？ // really? click again'] : x), from); return; } let s2 = load(); s2.notes = s2.notes.filter(x => x.id !== id); keep(s2); if (os.sfx) os.sfx('noteDel'); if (cur === id) cur = null; delArm = null; }
            closeMenu(); render(); if (k === 'rename') focusRen();
        };
        setTimeout(() => document.addEventListener('mousedown', outside), 0);
    }
    const outside = e => { let m = $('nt-menu'); if (m && !m.contains(e.target)) closeMenu(); };
    function closeMenu() { let m = $('nt-menu'); if (m) m.remove(); document.removeEventListener('mousedown', outside); }
    // esc shuts the menu, not the whole window. that was annoying
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('nt-menu')) { closeMenu(); e.stopImmediatePropagation(); } }, true);

    os.notes = { open(id) { cur = id; find = ''; os.summon('notes.txt'); render(); } };

    function inject() {
        let tpl = document.createElement('template');
        tpl.id = 'notes.txt';
        tpl.innerHTML = '<div id="nt-root" class="readable-ui"></div>';
        document.body.appendChild(tpl);
        let base = os.summon.bind(os);
        os.summon = function (id) {
            let existed = $('win-' + id);
            let r = base.apply(os, arguments);
            if (id === 'notes.txt' && !existed) {
                let tt = $('win-title-notes.txt'); if (tt) tt.textContent = '// notes.txt 【メモ】';
                render();
            }
            return r;
        };
    }

    let css = document.createElement('style');
    css.textContent = `
        /* plain on purpose. its notepad. no glow allowed in here */
        #desktop > #win-notes\\.txt { border: 1px solid #3c3a44 !important; border-radius: 0 !important; background: #141318 !important; box-shadow: 0 1px 0 color-mix(in srgb, var(--neon-secondary) 50%, #141318), 0 18px 36px rgba(0,0,0,.55) !important; }
        #desktop > #win-notes\\.txt::before, #desktop > #win-notes\\.txt::after { display: none !important; }
        #desktop > #win-notes\\.txt .window-header { background: #1d1c22 !important; border-bottom: 1px solid #2c2a32 !important; box-shadow: none !important; border-radius: 0 !important; padding: 5px 6px 5px 10px !important; }
        #desktop > #win-notes\\.txt .window-header::before, #desktop > #win-notes\\.txt .window-header::after { display: none !important; }
        #desktop > #win-notes\\.txt .window-header > span:first-child { font: 13px 'M PLUS 1 Code', monospace !important; letter-spacing: 0 !important; color: #d8d5de !important; text-shadow: none !important; opacity: 1 !important; }
        #desktop > #win-notes\\.txt .window-header > span:first-child::before { display: none; }
        #desktop > #win-notes\\.txt .win-btn, #desktop > #win-notes\\.txt .kill-btn { width: 30px !important; height: 22px !important; border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; }
        #desktop > #win-notes\\.txt .win-btn::before, #desktop > #win-notes\\.txt .kill-btn::before { color: #aaa6b2 !important; --gw: 10px; }
        #desktop > #win-notes\\.txt .win-btn:hover { background: #2c2a33 !important; }
        #desktop > #win-notes\\.txt .kill-btn:hover { background: #c42b43 !important; }
        #desktop > #win-notes\\.txt .win-btn:hover::before, #desktop > #win-notes\\.txt .kill-btn:hover::before { color: #fff !important; }
        #desktop > #win-notes\\.txt .window-body { padding: 0 !important; background: none !important; box-shadow: none !important; overflow: hidden !important; }
        .nt { display: flex; flex-direction: column; height: min(62vh, 560px); font: 13px 'M PLUS 1 Code', 'MS Gothic', monospace; color: #d8d5de; }
        .nt-bar { display: flex; align-items: center; gap: 0; padding: 1px 4px; background: #1a191f; border-bottom: 1px solid #2c2a32; }
        .nt-bar button { background: none; border: 0; color: #d8d5de; font: inherit; font-size: 12px; padding: 4px 9px; cursor: inherit; }
        .nt-bar button:hover { background: #2c2a33; }
        .nt-body { flex: 1; min-height: 0; display: flex; }
        .nt-side { flex: 0 0 190px; display: flex; flex-direction: column; gap: 0; border-right: 1px solid #2c2a32; background: #17161b; min-height: 0; }
        .nt-files { flex: 1; min-height: 0; overflow-y: auto; }
        .nt-find, .nt-ren { background: #0f0e12; border: 0; border-bottom: 1px solid #2c2a32; color: #e8e5ec; font: inherit; font-size: 12px; padding: 6px 9px; outline: none; }
        .nt-ren { box-shadow: inset 0 0 0 1px var(--neon-primary, #ff0099); }
        .nt-item, .nt-new { display: block; width: 100%; text-align: left; padding: 4px 10px; border: 0; background: none; color: #cfcbd6; font: inherit; font-size: 12px; cursor: inherit; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .nt-item i { font-style: normal; opacity: .4; }
        .nt-item.on { background: color-mix(in srgb, var(--neon-primary, #ff0099) 32%, #17161b); color: #fff; }
        .nt-item:hover:not(.on), .nt-new:hover { background: #222127; }
        .nt-new { border-top: 1px solid #2c2a32; color: #9e9aa8; padding: 6px 10px; }
        .nt-main { flex: 1; min-width: 0; display: flex; flex-direction: column; background: #0f0e12; }
        .nt.side-shut .nt-side { display: none; }
        .nt-bar .nt-toggle { margin-left: auto; color: #8e8a98; }
        .nt-head { display: flex; align-items: baseline; gap: 0; padding: 5px 10px; border-bottom: 1px solid #222127; color: #8e8a98; }
        .nt-title { flex: 0 1 auto; width: 100%; min-width: 0; background: none; border: 0; color: #fff; font: inherit; padding: 0; outline: none; }
        .nt-head span { flex: 0 0 auto; }
        .nt-area { flex: 1; min-height: 0; resize: none; background: none; border: 0; outline: none; color: #e8e5ec; font: var(--nt-size, 14px)/1.6 'M PLUS 1 Code', 'MS Gothic', monospace; padding: 8px 10px; box-sizing: border-box; tab-size: 4; caret-color: var(--neon-primary, #ff0099); }
        .nt.nowrap .nt-area { white-space: pre; overflow-x: auto; }
        .nt-area::selection, .nt-title::selection { background: color-mix(in srgb, var(--neon-primary, #ff0099) 45%, #000); color: #fff; }
        .nt-foot { display: flex; gap: 0; background: #1a191f; border-top: 1px solid #2c2a32; font-size: 11px; color: #9e9aa8; }
        .nt-foot span { padding: 3px 12px; border-right: 1px solid #2c2a32; white-space: nowrap; }
        .nt-foot .nt-fine { margin-left: auto; border-right: 0; border-left: 1px solid #2c2a32; opacity: .7; overflow: hidden; text-overflow: ellipsis; }
        .nt-saved { font-style: normal; color: var(--neon-secondary, #ff66b3); }
        #nt-menu { position: fixed; z-index: 100000; min-width: 190px; background: #1d1c22; border: 1px solid #3c3a44; box-shadow: 2px 3px 0 rgba(0,0,0,.5); padding: 2px; display: flex; flex-direction: column; }
        #nt-menu button { text-align: left; background: none; border: none; color: #e8e5ec; font: 12px 'M PLUS 1 Code', 'MS Gothic', monospace; padding: 5px 14px 5px 10px; cursor: inherit; white-space: nowrap; }
        #nt-menu button:hover, #nt-menu button:focus { background: color-mix(in srgb, var(--neon-primary, #ff0099) 32%, #1d1c22); color: #fff; outline: none; }
        .nt-empty { margin: auto; text-align: center; color: #8e8a98; font: 13px/1.9 'M PLUS 1 Code', 'MS Gothic', monospace; }
        .nt-paper { position: relative; width: 52px; height: 64px; margin: 0 auto 12px; border: 1px solid #3c3a44; background: #17161b; }
        .nt-paper i { display: block; height: 1px; margin: 12px 9px 0; background: #3c3a44; } .nt-paper i:nth-child(3) { margin-right: 20px; }
        .nt-empty button { margin-top: 8px; display: inline-block; width: auto; border: 1px solid #3c3a44; }
        @media (max-width: 640px) { .nt { height: calc(100vh - 200px); } .nt-side { position: absolute; z-index: 3; top: 30px; bottom: 24px; left: 0; width: 72%; } .nt-body { position: relative; } .nt-foot .nt-fine, .nt-foot .nt-when { display: none; } }
    `;
    document.head.appendChild(css);

    if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', inject); else inject();
    os.notes = { render };
})();
