
(function () {
    const KEY = 'vmp_noisebox3', OLD = 'vmp_noisebox2', LOOK = 'vmp_noisebox_look';
    const ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const calm = () => document.documentElement.classList.contains('reduce-motion');
    const low = () => document.documentElement.classList.contains('low-spec');
    const has = id => NB.has(id);
    const noteName = m => ROOTS[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
    // track limits. its basically unlimited anyway
    const lim = () => Object.assign(has('nb_tape') ? { tracks: 48, bars: 999, fx: 12 } : { tracks: 10, bars: 96, fx: 6 }, { bus: has('nb_crypt') ? 16 : 2 });
    const SKINS = [['os', 'システム vampii.os'], ['lacquer', '黒漆 lacquer'], ['bone', '骨 bone'], ['blood', '血 blood'], ['rust', '錆 rust'], ['lace', '黒レース lace'], ['ice', '氷 ice'], ['neon', '蛍光黄 neon yellow'], ['hot', '濃桃 hot pink'], ['faded', '褪桃 faded pink']];
    const X = window.NBX = { ROOTS, clamp, has, noteName, lim, calm };
    function load() {
        try { let d = JSON.parse(localStorage.getItem(KEY)); if (d && d.cur) { d.cur = NB.heal(d.cur); d.saves = Array.isArray(d.saves) ? d.saves : []; return d; } } catch (e) {}
        let d = { cur: NB.blankProject(), saves: [] };
        try { let o = JSON.parse(localStorage.getItem(OLD)); if (o && o.cur && o.cur.v === 2) { let m = NB.migrate(o.cur); if (m.tracks.length) d.cur = m; } } catch (e) {}
        return d;
    }
    let db = load(), saveT = 0;
    X.pr = db.cur;
    X.allSongs = () => [X.pr].concat(db.saves.map(s => s.pr));
    X.kept = () => db.saves;
    const keep = (k, v) => k.charAt(0) === '_' ? undefined : v;
    X.json = o => JSON.stringify(o, keep);
    X.save = function () { clearTimeout(saveT); saveT = setTimeout(() => { saveT = null; try { localStorage.setItem(KEY, X.json(db)); } catch (e) { X.flash('no room left to save. export it to a file'); } }, 400); };
    const saveNow = () => { if (!saveT) return; clearTimeout(saveT); saveT = null; try { localStorage.setItem(KEY, X.json(db)); } catch (e) {} };
    window.addEventListener('pagehide', saveNow); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveNow(); });
    const LOOK0 = '{"mode":0,"trails":0.25,"glitch":0.08,"split":0.25,"kal":0,"glow":0.3,"grain":0.15,"hue":0,"flare":0.25,"punch":0.35,"scan":0,"grade":0,"cuts":0,"speed":0.5,"react":0.5,"cols":0,"colA":"#ff2a6d","colB":"#7b5cff","cycle":0,"height":1,"skin":"os"}';
    let look = { mode: 0, trails: 0.25, glitch: 0.08, split: 0.25, kal: 0, glow: 0.3, grain: 0.15, hue: 0, flare: 0.25, punch: 0.35, scan: 0, grade: 0, cuts: 0, speed: 0.5, react: 0.5, cols: 0, colA: '#ff2a6d', colB: '#7b5cff', cycle: 0, height: 1, skin: 'os' };
    try { Object.assign(look, JSON.parse(localStorage.getItem(LOOK)) || {}); } catch (e) {}
    // move old lacquer people over
    if (!look.osSkin) { if (look.skin === 'lacquer') look.skin = 'os'; look.osSkin = 1; }
    if (!look.mv) { if (look.mode === 18) look.mode = 23; look.mv = 2; }
    const AFTK = ['trails', 'glitch', 'split', 'kal', 'glow', 'flare', 'punch', 'grain', 'scan', 'hue', 'speed', 'react', 'grade', 'cuts'];
    const AFT0 = { trails: 0, glitch: 0, split: 0, kal: 0, glow: 0.2, flare: 0, punch: 0.25, grain: 0, scan: 0, hue: 0, speed: 0.5, react: 0.5, grade: 0, cuts: 0 };
    const aftDef = id => { let m = window.NBV && NBV.MODES.find(q => q.id === id); return Object.assign({}, AFT0, (m && m.after) || {}); };
    const modeId = () => { let m = window.NBV && NBV.MODES[look.mode]; return m ? m.id : null; };
    const aftDiff = id => { let d = aftDef(id), o = {}; AFTK.forEach(k => { if (look[k] != null && Math.abs((+look[k] || 0) - (+d[k] || 0)) > 1e-4) o[k] = look[k]; }); return o; };
    function syncAfter() {
        let id = modeId(); if (!id) return;
        look.after = look.after || {};
        if (look._aid === id) return;
        if (look._aid) look.after[look._aid] = aftDiff(look._aid);
        let d = aftDef(id), mine = look.after[id] || {};
        AFTK.forEach(k => { look[k] = mine[k] != null ? mine[k] : d[k]; });
        look._aid = id;
    }
    if ((look.mv || 0) < 4) { if (look.mode === 19) look.mode = 18; else if (look.mode > 19) look.mode -= 1; }
    if (look.mv < 3) {
        let old = JSON.parse(LOOK0), id = modeId(), o = {};
        if (id) { AFTK.forEach(k => { if (look[k] != null && Math.abs((+look[k] || 0) - (+old[k] || 0)) > 1e-4) o[k] = look[k]; }); look.after = { [id]: o }; delete look._aid; }
        look.mv = 3;
    }
    if (look.mv < 4) look.mv = 4;
    if (look.mv < 5) {
        let gone = [7, 8, 13];
        if (gone.indexOf(look.mode) >= 0) look.mode = 0; else look.mode -= gone.filter(g => g < look.mode).length;
        if (look.after) ['veins', 'ribs', 'rose'].forEach(k => { delete look.after[k]; });
        if (look.po) ['veins', 'ribs', 'rose'].forEach(k => { delete look.po[k]; });
        if (['veins', 'ribs', 'rose'].indexOf(look._aid) >= 0) delete look._aid;
        look.mv = 5;
    }
    syncAfter();
    X.look = look;
    X.syncAfter = syncAfter;
    X.aftDef = aftDef;
    const T = t => window.NBL ? NBL.t(t) : t;
    const tv = k => { if (!V) return ''; let c = V.tv || (V.tv = {}); return c[k] != null ? c[k] : (c[k] = getComputedStyle(V.root).getPropertyValue(k).trim()); };
    X.tv = tv;
    X.saveLook = () => { syncAfter(); if (look._aid) look.after[look._aid] = aftDiff(look._aid); try { localStorage.setItem(LOOK, JSON.stringify(look)); } catch (e) {} };

    let L = null;
    const LAT = () => { try { return localStorage.getItem('vmp_nb_lat') || 'balanced'; } catch (e) { return 'balanced'; } };
    X.eng = () => { if (!L) { L = new NB.Live(X.pr, LAT()); if (!L.ctx) L = null; else L.onend = () => { showTop(); }; } return L; };
    X.live = () => L;
    X.playing = () => !!(L && L.run);
    X.apply = () => { if (L) { L.R.sync(); L.R.apply(); } };
    X.touch = () => { NB.touch(X.pr); X.save(); X.apply(); if (V) V.dirty = true; };
    let hearAt = 0;
    X.hear = (uid, m, n) => { if (X.playing() || !X.eng()) return; let t = performance.now(); if (t - hearAt < 50) return; hearAt = t; L.audition(uid, m, n); };

    let undo = [], redo = [];
    X.mark = () => { undo.push(X.json(X.pr)); if (undo.length > 50) undo.shift(); redo = []; };
    X.swap = np => swap(np);
    function swap(np, keepSel) {
        db.cur = X.pr = NB.heal(np);
        if (L) { let was = X.playing(), at = was ? L.pos() : null; L.stop(true); L.pr = X.pr; L.R.pr = X.pr; L.R.sync(); L.R.apply(true); if (was) L.play(keepSel && at != null ? at : (V ? V.cursor : 0)); }
        if (!keepSel || !X.trk(sel.tr)) { sel.tr = X.pr.tracks[0] ? X.pr.tracks[0].uid : 'master'; sel.clip = null; }
        sel.notes = new Set(); X.touch(); X.showAll();
    }
    X.swap = swap;
    // new song. wipes the open one, not your saved ones (undo still works if you panic)
    X.newSong = () => {
        X.mark(); if (X.playing()) stop();
        held.forEach(h => { if (L) L.noteOff(h); }); held.clear();
        if (V) { V.rec = false; V.cursor = 0; if (V.sc) V.sc.scrollLeft = 0; }
        swap(NB.blankProject()); showTop();
        X.flash('blank slate. every track gone, undo if you didnt mean it');
    };
    X.undo = () => { if (!undo.length) return; redo.push(X.json(X.pr)); swap(JSON.parse(undo.pop()), true); X.flash('undone'); };
    X.redo = () => { if (!redo.length) return; undo.push(X.json(X.pr)); swap(JSON.parse(redo.pop()), true); X.flash('redone'); };

    const sel = X.sel = { tr: X.pr.tracks[0] ? X.pr.tracks[0].uid : 'master', clip: null, notes: new Set() };
    X.trk = uid => X.pr.tracks.find(t => t.uid === uid) || null;
    X.master = () => ({ uid: 'master', name: 'MASTER', inst: null, col: '#e8e2d0', fx: X.pr.master.fx, auto: X.pr.master.auto, mix: X.pr.master, isMaster: true });
    X.selTr = () => sel.tr === 'master' ? X.master() : X.trk(sel.tr);
    X.selClip = () => { let tr = X.trk(sel.tr); if (!tr) return null; let c = tr.clips.find(c => c.uid === sel.clip); return c ? { tr, c } : null; };
    X.pick = (tr, clip) => { sel.tr = tr; if (clip !== undefined) { sel.clip = clip; sel.notes = new Set(); if (sel.many && !(clip && sel.many.has(clip))) sel.many.clear(); } if (V) { V.dirty = true; showDock(); } };

    function el(tag, cls, txt) { let e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
    function btn(txt, cls, fn, tip) { let b = el('button', 'nb-btn' + (cls ? ' ' + cls : ''), txt); b.type = 'button'; if (fn) b.onclick = fn; if (tip) b.title = tip; return b; }
    function feelBox(first, val, fn) {
        let s = selBox(first.concat(Object.keys(NB.GROOVES).map(k => [k, NB.GROOVES[k].jp + ' ' + NB.GROOVES[k].en]), (X.pr.grooves || []).map(G => [G.id, '盗「' + G.en + '」'])), val, fn);
        [...s.options].forEach(o => { if (/^盗「/.test(o.textContent)) o.dataset.nolang = 1; }); return s;
    }
    X.feelBox = feelBox;
    function selBox(opts, val, fn, cls) {
        let s = el('select', 'nb-sel' + (cls ? ' ' + cls : ''));
        opts.forEach(o => { let op = el('option', '', o[1]); op.value = o[0]; if (o[2]) op.disabled = true; s.appendChild(op); });
        s.value = val; s.onchange = () => fn(s.value); return s;
    }
    const pt = e => { let t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e; return { x: t.clientX, y: t.clientY, shift: !!e.shiftKey, alt: !!e.altKey, ctrl: !!(e.ctrlKey || e.metaKey) }; };
    function drag(node, dn, mv, up) {
        const go = e => {
            if (e.button === 2) return;
            let p0 = pt(e); if (dn(p0, e) === false) return;
            e.preventDefault();
            const m = ev => { if (ev.cancelable) ev.preventDefault(); if (mv) mv(pt(ev), ev); };
            const u = ev => { document.removeEventListener('mousemove', m); document.removeEventListener('mouseup', u); document.removeEventListener('touchmove', m); document.removeEventListener('touchend', u); if (up) up(pt(ev), ev); };
            document.addEventListener('mousemove', m); document.addEventListener('mouseup', u); document.addEventListener('touchmove', m, { passive: false }); document.addEventListener('touchend', u);
        };
        node.addEventListener('mousedown', go); node.addEventListener('touchstart', go, { passive: false });
    }
    let wheelAt = 0;
    const wheelMine = (node, e) => { let now = performance.now(), mine = now - wheelAt > 450 && now - (node._in || 0) > 220; if (!mine) wheelAt = now; return mine; };
    function wheelable(node) { node.addEventListener('mouseenter', () => { node._in = performance.now(); }); }
    function sure(b, fn) { return () => { if (!b.dataset.sure) { let o = b.textContent; b.dataset.sure = 1; b.textContent = 'SURE?'; setTimeout(() => { if (b.isConnected) { delete b.dataset.sure; b.textContent = o; } }, 2200); return; } fn(); }; }
    X.flash = t => { if (!V) return; let m = V.q('[data-msg]'); if (!m) return; m.textContent = t; clearTimeout(V.msgT); V.msgT = setTimeout(() => { if (V) m.textContent = ''; }, 3200); };
    function knob(label, get, set, o) {
        o = o || {};
        let k = el('div', 'nb-k' + (o.cls ? ' ' + o.cls : '')), w = el('div', 'nb-kw'), n = el('div', 'nb-kn'), val = el('b', 'nb-kv');
        n.appendChild(el('i')); w.appendChild(n); k.appendChild(w); k.appendChild(el('span', '', label)); k.appendChild(val);
        const q = v => o.steps ? Math.round(v * (o.steps - 1)) / (o.steps - 1) : v;
        const show = () => { let v = get(); k.style.setProperty('--v', v); val.textContent = o.fmt ? o.fmt(v) : Math.round(v * 100); if (o.mark) k.classList.toggle('lockd', !!o.mark()); };
        const put = v => { set(q(clamp(v, 0, 1))); show(); if (o.turn) o.turn(); k.dispatchEvent(new CustomEvent('nbturn')); };
        let y0 = 0, v0 = 0;
        drag(k, p => { if (o.start) o.start(); y0 = p.y; v0 = get(); k.classList.add('turn'); }, p => put(v0 + (y0 - p.y) / (p.shift ? 700 : 160)), () => { k.classList.remove('turn'); if (o.done) o.done(); X.save(); k.dispatchEvent(new CustomEvent('nbdone')); });
        wheelable(k);
        k.addEventListener('wheel', e => { if (!wheelMine(k, e)) return; e.preventDefault(); put(get() - Math.sign(e.deltaY) * (o.steps ? 1 / (o.steps - 1) : 0.02)); X.save(); }, { passive: false });
        if (o.def != null) k.addEventListener('dblclick', () => { put(o.def); X.save(); });
        k.title = label + (o.tip ? ' // ' + o.tip : '') + ' // drag up + down, shift for fine, double click puts it back';
        k._show = show; show();
        return k;
    }
    function fader(get, set, o) {
        o = o || {};
        let f = el('div', 'nb-fd'), fill = el('i'), cap = el('b');
        f.appendChild(fill); f.appendChild(cap);
        const show = () => f.style.setProperty('--v', get());
        let y0 = 0, v0 = 0, hgt = 100;
        drag(f, p => { X.mark(); y0 = p.y; v0 = get(); hgt = f.getBoundingClientRect().height || 100; }, p => { set(clamp(v0 + (y0 - p.y) / (hgt * (p.shift ? 4 : 1)), 0, 1)); show(); X.apply(); if (o.turn) o.turn(); f.dispatchEvent(new CustomEvent('nbturn')); }, () => { X.save(); f.dispatchEvent(new CustomEvent('nbdone')); });
        wheelable(f);
        f.addEventListener('wheel', e => { if (!wheelMine(f, e)) return; e.preventDefault(); set(clamp(get() - Math.sign(e.deltaY) * 0.02, 0, 1)); show(); X.apply(); X.save(); }, { passive: false });
        f.addEventListener('dblclick', () => { set(o.def != null ? o.def : 0.75); show(); X.apply(); X.save(); });
        f.title = 'drag, double click = back to the usual'; f._show = show; show();
        return f;
    }
    function menu(x, y, items) {
        closeMenu();
        let m = el('div', 'nb-menu'); m.style.left = x + 'px'; m.style.top = y + 'px';
        m.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); });
        items.forEach(it => {
            if (it === '-') { m.appendChild(el('hr')); return; }
            if (it.head) { let hd = el('div', 'nb-mh', it.head); if (it.raw) hd.dataset.nolang = 1; m.appendChild(hd); return; }
            if (it.swatch) { let r = el('div', 'nb-sw'); NB.COLS.forEach(c => { let s = el('i'); s.style.background = c; s.onclick = () => { closeMenu(); it.swatch(c); }; r.appendChild(s); }); m.appendChild(r); return; }
            let b = el('div', 'nb-mi' + (it[2] && it[2].lock ? ' lk' : '') + (it[2] && it[2].on ? ' on' : ''), (it[2] && it[2].lock ? '🔒 ' : '') + it[0]);
            if (it[2] && it[2].raw) b.dataset.nolang = 1;
            b.onclick = e => { e.stopPropagation(); closeMenu(); if (it[2] && it[2].lock) { X.flash(it[2].lock); return; } it[1](); };
            m.appendChild(b);
        });
        if (window.NBL) NBL.once(m);
        document.body.appendChild(m);
        let r = m.getBoundingClientRect(); if (r.right > innerWidth - 4) m.style.left = Math.max(4, innerWidth - r.width - 4) + 'px'; if (r.bottom > innerHeight - 4) m.style.top = Math.max(4, innerHeight - r.height - 4) + 'px';
        setTimeout(() => document.addEventListener('mousedown', outside), 0);
        document.addEventListener('keydown', menuEsc, true);
    }
    function menuEsc(e) { if (e.key === 'Escape' && document.querySelector('.nb-menu')) { e.stopPropagation(); e.preventDefault(); closeMenu(); } }
    function outside(e) { let m = document.querySelector('.nb-menu'); if (m && !m.contains(e.target)) closeMenu(); }
    function closeMenu() { document.querySelectorAll('.nb-menu').forEach(m => m.remove()); document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', menuEsc, true); }
    function inline(x, y, w, val, cb) {
        let i = el('input', 'nb-in nb-inline'); i.value = val || ''; i.maxLength = 32; i.style.left = x + 'px'; i.style.top = y + 'px'; i.style.width = w + 'px';
        document.body.appendChild(i); i.focus(); i.select();
        let done = false; const fin = ok => { if (done) return; done = true; if (ok) cb(i.value.trim()); i.remove(); };
        i.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') fin(true); if (e.key === 'Escape') fin(false); };
        i.onblur = () => fin(true);
    }
    Object.assign(X, { el, btn, selBox, drag, knob, fader, menu, inline, sure, wheelMine, wheelable });

    let V = null;
    X.V = () => V;
    X.info = t => { if (!V) return; let s = V.q('[data-info] .t'); if (s && s.textContent !== t) s.textContent = t; };
    function styles() {
        if (document.getElementById('nb-style')) return;
        let st = document.createElement('style'); st.id = 'nb-style';
        st.textContent = `
        .nb { --a: var(--neon-primary, #ff2a6d); --b: var(--neon-secondary, #ff8ac8); --glow: var(--neon-glow, rgba(255,42,109,0.5)); --bg: #0c090e; --pan: #16111a; --pan2: #1f1824; --ink: var(--text-main, #eee); --line: rgba(255,255,255,0.08); --face: linear-gradient(#17121a, #0c090e);
            font-family: 'Courier New', monospace; color: var(--ink); user-select: none; font-size: 12px; }
        .nb.sk-bone { --bg: #d9d1bf; --pan: #e8e1d0; --pan2: #cfc5b0; --ink: #2a1d18; --line: rgba(0,0,0,0.12); --face: linear-gradient(#efe8d8, #d6cdb8); }
        .nb.sk-blood { --a: #ff1a3c; --b: #ff8a9e; --glow: rgba(255,26,60,0.5); --bg: #0e0204; --pan: #1a0508; --pan2: #26080d; --face: linear-gradient(#22060b, #0e0204); }
        .nb.sk-rust { --a: #ff8a3d; --b: #ffcf8a; --glow: rgba(255,138,61,0.45); --bg: #120c08; --pan: #1e140d; --pan2: #2a1c12; --face: linear-gradient(#2b1a10, #120c08); }
        .nb.sk-lace { --a: #e8e2d0; --b: #b8a9c9; --glow: rgba(232,226,208,0.35); --bg: #070607; --pan: #121013; --pan2: #1b181c; --face: radial-gradient(circle at 50% 50%, transparent 0 34%, rgba(255,255,255,0.025) 35% 37%, transparent 38%) 0 0 / 22px 22px, linear-gradient(#151216, #070607); }
        .nb.sk-ice { --a: #6ee7ff; --b: #c4f4ff; --glow: rgba(110,231,255,0.45); --bg: #060b10; --pan: #0d1720; --pan2: #13212d; --face: linear-gradient(#10202c, #060b10); }
        .nb.sk-neon { --a: #e4ff1a; --b: #f4ffa0; --glow: rgba(228,255,26,0.42); --bg: #090a05; --pan: #13140b; --pan2: #1d1f10; --ink: #f0f2dc; --line: rgba(228,255,26,0.13); --face: repeating-linear-gradient(-45deg, rgba(228,255,26,0.02) 0 2px, transparent 2px 10px), linear-gradient(#17180c, #08090a); }
        .nb.sk-neon .nb-btn.on { color: #0b0c04; background: linear-gradient(#f3ff6e, #cde500); border-color: #f6ff9a; box-shadow: 0 0 12px rgba(228,255,26,0.5), inset 0 1px 0 rgba(255,255,255,0.55); }
        .nb.sk-neon .nb-lcd { background: #101208; color: #eeff45; text-shadow: 0 0 6px rgba(228,255,26,0.65); }
        .nb.sk-hot { --a: #ff1fa2; --b: #ff8fd0; --glow: rgba(255,31,162,0.55); --bg: #0f030b; --pan: #1c0615; --pan2: #2a0920; --ink: #ffe8f5; --line: rgba(255,31,162,0.15); --face: linear-gradient(#25081c, #0f030b); }
        .nb.sk-hot .nb-lcd { background: #170410; color: #ff63c0; text-shadow: 0 0 6px rgba(255,31,162,0.7); }
        .nb.sk-faded { --a: #b4446a; --b: #8e3e5a; --glow: rgba(180,68,106,0.28); --bg: #e8d3d6; --pan: #f3e4e6; --pan2: #dec4c8; --ink: #3b1f28; --line: rgba(80,20,40,0.15); --face: linear-gradient(#f4e6e8, #dcc5c9); }
        .nb.sk-faded .nb-btn.on { color: #fff; background: linear-gradient(#c4557a, #a53b5e); box-shadow: 0 0 8px rgba(180,68,106,0.35), inset 0 1px 0 rgba(255,255,255,0.25); }
        .nb.sk-faded .nb-lcd { background: #2b1820; color: #ffc6d8; text-shadow: 0 0 6px rgba(255,150,190,0.5); }
        .nb.sk-faded .nb-brw { background: rgba(120,40,70,0.06); } .nb.sk-faded .nb-bi small, .nb.sk-faded .nb-lab { opacity: 0.75; }
        #win-noisebox\\.exe .window-body { max-height: calc(100vh - 110px) !important; overflow: auto !important; padding: 14px 16px !important; }
        #desktop > #win-noisebox\\.exe { --ear: 30px; padding: 0 var(--ear); box-sizing: border-box; border: 1px solid #000 !important; border-radius: 4px;
            background:
                radial-gradient(circle, #c4bdc9 0 2.5px, #7a7381 3.5px, #3a3540 5px, #120f14 6px, transparent 6.5px) left calc((var(--ear) - 14px) / 2) top 31px / 14px 14px no-repeat, radial-gradient(circle, #c4bdc9 0 2.5px, #7a7381 3.5px, #3a3540 5px, #120f14 6px, transparent 6.5px) left calc((var(--ear) - 14px) / 2) bottom 31px / 14px 14px no-repeat,
                radial-gradient(circle, #c4bdc9 0 2.5px, #7a7381 3.5px, #3a3540 5px, #120f14 6px, transparent 6.5px) right calc((var(--ear) - 14px) / 2) top 31px / 14px 14px no-repeat, radial-gradient(circle, #c4bdc9 0 2.5px, #7a7381 3.5px, #3a3540 5px, #120f14 6px, transparent 6.5px) right calc((var(--ear) - 14px) / 2) bottom 31px / 14px 14px no-repeat,
                linear-gradient(62deg, transparent 6px, #17141a 6px 8px, transparent 8px) left calc((var(--ear) - 14px) / 2) top 31px / 14px 14px no-repeat, linear-gradient(62deg, transparent 6px, #17141a 6px 8px, transparent 8px) left calc((var(--ear) - 14px) / 2) bottom 31px / 14px 14px no-repeat,
                linear-gradient(62deg, transparent 6px, #17141a 6px 8px, transparent 8px) right calc((var(--ear) - 14px) / 2) top 31px / 14px 14px no-repeat, linear-gradient(62deg, transparent 6px, #17141a 6px 8px, transparent 8px) right calc((var(--ear) - 14px) / 2) bottom 31px / 14px 14px no-repeat,
                radial-gradient(closest-side, #050406 86%, transparent 100%) left calc((var(--ear) - 16px) / 2) top 26px / 16px 24px no-repeat, radial-gradient(closest-side, #050406 86%, transparent 100%) left calc((var(--ear) - 16px) / 2) bottom 26px / 16px 24px no-repeat,
                radial-gradient(closest-side, #050406 86%, transparent 100%) right calc((var(--ear) - 16px) / 2) top 26px / 16px 24px no-repeat, radial-gradient(closest-side, #050406 86%, transparent 100%) right calc((var(--ear) - 16px) / 2) bottom 26px / 16px 24px no-repeat,
                linear-gradient(90deg, #2c2731, #3e3845 45%, #2a2530 calc(100% - 2px), #000 calc(100% - 2px) calc(100% - 1px), color-mix(in srgb, var(--neon-secondary) 55%, #000) calc(100% - 1px)) left top / var(--ear) 100% no-repeat,
                linear-gradient(270deg, #2c2731, #3e3845 45%, #2a2530 calc(100% - 2px), #000 calc(100% - 2px) calc(100% - 1px), color-mix(in srgb, var(--neon-secondary) 55%, #000) calc(100% - 1px)) right top / var(--ear) 100% no-repeat,
                repeating-linear-gradient(0deg, rgba(255,255,255,0.016) 0 1px, transparent 1px 3px), linear-gradient(180deg, #221f26, #141217) !important;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.6), 0 3px 0 #050407, 0 26px 50px rgba(0,0,0,0.6) !important; }
        #desktop > #win-noisebox\\.exe::before { display: none; }
        #desktop > #win-noisebox\\.exe .window-header { background: none !important; border-bottom: 1px solid #000 !important; box-shadow: 0 1px 0 rgba(255,255,255,0.06) !important; border-radius: 0; }
        #desktop > #win-noisebox\\.exe .window-header::before { display: none; }
        #desktop > #win-noisebox\\.exe .window-header::after { height: 7px; opacity: 1 !important; border-radius: 1px; background: repeating-linear-gradient(90deg, #050406 0 16px, transparent 16px 21px) !important; box-shadow: 0 1px 0 rgba(255,255,255,0.07); }
        #desktop > #win-noisebox\\.exe .window-header > span:first-child { font: bold 11px Arial, 'Helvetica Neue', sans-serif !important; letter-spacing: 4px !important; text-transform: uppercase; color: #d2cbd8 !important; text-shadow: 0 1px 0 #000 !important; opacity: 0.85 !important; display: flex !important; align-items: center; }
        #desktop > #win-noisebox\\.exe .win-ic { display: none; }
        #desktop > #win-noisebox\\.exe .window-header > span:first-child::before { display: inline-block !important; flex: none; width: 8px; height: 8px; margin: 0 12px 0 0; border-radius: 50%; background: #2a1a20; box-shadow: inset 0 1px 2px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.1); animation: none !important; }
        #desktop > #win-noisebox\\.exe.is-active .window-header > span:first-child::before { background: radial-gradient(circle at 40% 35%, #fff, var(--neon-primary) 45%); box-shadow: 0 0 6px var(--neon-primary), 0 1px 0 rgba(255,255,255,0.1); }
        #desktop > #win-noisebox\\.exe .win-btn, #desktop > #win-noisebox\\.exe .kill-btn { width: 17px !important; height: 17px !important; border-radius: 50% !important; border: 1px solid #000 !important; background: radial-gradient(circle at 38% 32%, #9a93a0, #4a4450 55%, #211e25) !important; box-shadow: 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 1px rgba(0,0,0,0.5) !important; }
        #desktop > #win-noisebox\\.exe .win-btn::before, #desktop > #win-noisebox\\.exe .kill-btn::before { color: #111 !important; --gw: 10px; opacity: 1 !important; }
        #desktop > #win-noisebox\\.exe .min-btn { --gl: var(--gl-px-min); } #desktop > #win-noisebox\\.exe .max-btn { --gl: var(--gl-px-max); } #desktop > #win-noisebox\\.exe .kill-btn { --gl: var(--gl-px-x); }
        #desktop > #win-noisebox\\.exe .kill-btn { background: radial-gradient(circle at 38% 32%, #ff8a98, #c41c38 55%, #5e0a18) !important; }
        #desktop > #win-noisebox\\.exe .win-btn:hover, #desktop > #win-noisebox\\.exe .kill-btn:hover { filter: brightness(1.25); }
        #desktop > #win-noisebox\\.exe .win-btn:active, #desktop > #win-noisebox\\.exe .kill-btn:active { transform: translateY(1px); box-shadow: inset 0 1px 2px rgba(0,0,0,0.6) !important; }
        #desktop > #win-noisebox\\.exe .window-body { background: none !important; box-shadow: none !important; border-radius: 0; }
        #win-noisebox\\.exe .file-path { display: none !important; }
        @media (max-width: 760px) { #desktop > #win-noisebox\\.exe { --ear: 14px; } }
        .nb-vis { position: relative; height: 190px; border: 1px solid var(--line); background: #000; overflow: hidden; border-radius: 4px 4px 0 0; }
        .nb-vis.h0 { height: 0; border: 0; } .nb-vis.h2 { height: 360px; }
        .nb-vis canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
        .nb-vis .nb-2d { display: none; } .nb-vis.scope .nb-gl { display: none; } .nb-vis.scope .nb-2d { display: block; }
        .nb-vm { position: absolute; left: 8px; bottom: 7px; display: flex; flex-wrap: wrap; gap: 3px; z-index: 2; max-width: calc(100% - 130px); }
        .nb-vm button, .nb-vbtn { background: rgba(0,0,0,0.55); border: 1px solid rgba(255,255,255,0.18); color: rgba(255,255,255,0.75); font: 10px 'Courier New', monospace; padding: 2px 6px; border-radius: 3px; cursor: inherit; }
        .nb-vm button.on, .nb-vbtn.on { color: #fff; border-color: var(--a); box-shadow: 0 0 8px var(--glow); }
        .nb-vm button.lk { opacity: 0.45; }
        .nb-vr { position: absolute; right: 8px; bottom: 7px; z-index: 2; display: flex; gap: 3px; }
        .nb-vis:fullscreen { height: 100%; border-radius: 0; } .nb-vis.fs { height: 100%; border-radius: 0; }
        .nb-vwin { position: fixed; z-index: 9500; display: flex; flex-direction: column; resize: both; overflow: hidden; min-width: 220px; min-height: 140px; max-width: none; }
        .nb-vwin > .window-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 5px 6px 5px 10px; background: rgba(16, 6, 14, 0.98); color: #fff; font-size: 12px; font-weight: bold; border-bottom: 1px solid var(--neon-primary); cursor: grab; user-select: none; touch-action: none; }
        .nb-vwin > .window-header > span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 0 6px var(--neon-primary); letter-spacing: 1px; } .nb-vwin > .window-header b { color: var(--neon-primary); }
        .nb-vwin .kill-btn { background: none; color: #fff; font: inherit; font-weight: bold; text-shadow: 0 0 5px var(--neon-primary); padding: 2px 6px; border: 1px solid transparent; cursor: pointer; } .nb-vwin .kill-btn:hover { color: var(--neon-primary); border-color: var(--neon-primary); }
        #desktop > .bedazzled-border.nb-vwin .nb-back::before { content: '⇲'; }
        .nb-vwb { flex: 1; min-height: 0; position: relative; display: flex; }
        .nb-vwb > .nb-vis, .nb-vwb > .nb-vis.h0, .nb-vwb > .nb-vis.h2 { flex: 1; height: auto; border: 0; border-radius: 0; }
        .nb-vwb > .nb-vis:fullscreen { height: 100%; }
        .nb-vgone { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; padding: 8px 10px; border: 1px dashed var(--line); background: rgba(0,0,0,0.35); color: var(--ink); font-size: 11px; opacity: 0.85; }
        @media (max-width: 760px) { #desktop > .bedazzled-border.nb-vwin { left: 8px !important; right: 8px; top: auto !important; bottom: 128px; width: auto !important; height: 230px !important; } }
        .nb-np { position: absolute; left: 10px; top: 8px; z-index: 2; font-size: 11px; letter-spacing: 1px; color: rgba(255,255,255,0.6); text-shadow: 0 0 6px #000; pointer-events: none; white-space: pre; }
        .nb-deck { position: relative; padding: 8px 8px 10px; border-radius: 0 0 6px 6px; background: var(--grain, none), var(--face); background-size: 180px 180px, auto; border: 1px solid var(--line); border-top: 0; }
        .nb-row { display: flex; flex-wrap: wrap; gap: 5px 7px; align-items: center; }
        .nb-top { padding: 6px 8px; margin: 0 -8px 8px; border-bottom: 1px solid var(--line); background: rgba(0,0,0,0.25); }
        .nb-btn { background: linear-gradient(var(--pan2), var(--pan)); border: 1px solid var(--line); color: var(--ink); font: bold 11px 'Courier New', monospace; padding: 4px 7px; border-radius: 3px; cursor: inherit; box-shadow: 0 2px 0 rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07); white-space: nowrap; }
        .nb-btn:active { transform: translateY(1px); box-shadow: 0 1px 0 rgba(0,0,0,0.5); }
        .nb-btn.on { border-color: var(--a); color: #fff; box-shadow: 0 0 9px var(--glow), inset 0 1px 0 rgba(255,255,255,0.15); background: linear-gradient(color-mix(in srgb, var(--a) 35%, var(--pan2)), var(--pan)); }
        .nb.sk-bone .nb-btn.on { color: var(--ink); }
        .nb-btn.nb-ic { padding: 2px 5px; } .nb-btn.nb-ic svg { pointer-events: none; }
        .nb-btn.nb-keys { border-color: color-mix(in srgb, var(--a) 60%, transparent); color: var(--a); }
        .nb-btn.lk { opacity: 0.4; } .nb-btn.sm { padding: 2px 5px; font-size: 10px; }
        .nb-btn.rec.on { border-color: #ff2a3a; background: linear-gradient(#5a0d14, #2a0509); box-shadow: 0 0 10px rgba(255,40,60,0.7); }
        .nb-play { min-width: 62px; font-size: 13px; }
        .nb-sel, .nb-in { background: var(--bg); color: var(--ink); border: 1px solid var(--line); font: 11px 'Courier New', monospace; padding: 3px 2px; border-radius: 3px; }
        .nb-in { width: 120px; padding: 3px 6px; }
        .nb-inline { position: fixed; z-index: 99999; }
        .nb-lcd { background: #0b1410; color: #9dffc8; font: bold 14px 'Courier New', monospace; padding: 3px 7px; border-radius: 3px; border: 1px solid rgba(0,0,0,0.6); box-shadow: inset 0 0 8px rgba(0,0,0,0.9); text-shadow: 0 0 6px rgba(120,255,180,0.6); min-width: 44px; text-align: center; touch-action: none; white-space: pre; }
        .nb-lcd.bpm { cursor: ns-resize; }
        .nb-lab { font-size: 10px; letter-spacing: 1px; opacity: 0.6; }
        .nb-msg { font-size: 11px; color: var(--b); margin-left: auto; min-height: 1em; }
        .nb-mtr { display: flex; flex-direction: column; gap: 2px; width: 80px; }
        html[data-nbl="en"] [data-lj], html[data-nbl="jp"] [data-le] { display: none !important; }
        .nb-recmtr { display: inline-block; width: 110px; height: 9px; background: #000; border: 1px solid var(--line); vertical-align: middle; overflow: hidden; }
        .nb-recmtr i { display: block; height: 100%; width: 0; background: #6dffb0; }
        .nb-mtr i { display: block; height: 5px; background: #000; border: 1px solid var(--line); position: relative; overflow: hidden; }
        .nb-mtr i::after { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: calc(var(--m, 0) * 100%); background: linear-gradient(90deg, #6dffb0, #ffe36d 75%, #ff4a5a); }
        .nb-arrbar { margin-bottom: 4px; }
        .nb-arrbox { position: relative; height: 270px; border: 1px solid var(--line); border-radius: 3px; background: var(--bg); overflow: hidden; }
        .nb-arrsc { position: absolute; inset: 0; overflow: auto; scrollbar-width: none; } .nb-arrsc::-webkit-scrollbar { display: none; }
        .nb-vsb { position: absolute; right: 2px; top: 36px; bottom: 3px; width: 8px; z-index: 2; border-radius: 4px; background: rgba(127,127,127,0.1); touch-action: none; }
        .nb-vsb.off { display: none; }
        .nb-vsb i { position: absolute; left: 1px; right: 1px; min-height: 22px; border-radius: 3px; background: color-mix(in srgb, var(--a) 50%, rgba(127,127,127,0.4)); cursor: grab; }
        .nb-vsb i:hover, .nb-vsb.drag i { background: var(--a); box-shadow: 0 0 6px var(--glow); }
        .nb-ov { flex: none; position: relative; height: 24px; margin-top: 3px; border: 1px solid var(--line); border-radius: 3px; background: rgba(0,0,0,0.28); cursor: grab; touch-action: none; overflow: hidden; }
        .nb-ov.drag { cursor: grabbing; } .nb-ov canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
        .nb-arrcv { position: absolute; left: 0; top: 0; touch-action: none; }
        .nb-tabs { display: flex; flex-wrap: wrap; gap: 3px; margin: 10px 0 0; border-bottom: 1px solid var(--line); }
        .nb-tab { background: transparent; border: 1px solid transparent; border-bottom: 0; color: var(--ink); font: bold 11px 'Courier New', monospace; padding: 5px 10px; border-radius: 4px 4px 0 0; cursor: inherit; opacity: 0.55; }
        .nb-tab.on { opacity: 1; border-color: var(--line); background: rgba(0,0,0,0.3); }
        .nb-dock { padding: 8px 2px 2px; min-height: 160px; }
        .nb-hint { font-size: 11px; opacity: 0.6; padding: 6px; }
        .nb-lockd { opacity: 0.85; color: var(--b); }
        .nb-sec { border: 1px solid var(--line); border-radius: 5px; padding: 7px 9px 6px; background: rgba(0,0,0,0.2); margin-bottom: 7px; }
        .nb-sec h4 { margin: 0 0 6px; font-size: 10px; letter-spacing: 2px; color: var(--b); font-weight: bold; }
        .nb-sec h4 small { color: var(--ink); opacity: 0.55; letter-spacing: 0; font-weight: normal; margin-left: 6px; }
        .nb-secs { display: flex; flex-wrap: wrap; gap: 7px; align-items: flex-start; }
        .nb-ks { display: flex; flex-wrap: wrap; gap: 7px 5px; align-items: flex-start; }
        .nb-k { display: flex; flex-direction: column; align-items: center; gap: 2px; width: 50px; cursor: ns-resize; touch-action: none; }
        .nb-k.sm { width: 40px; } .nb-k.sm .nb-kw { width: 26px; height: 26px; }
        .nb-kw { width: 32px; height: 32px; border-radius: 50%; padding: 3px; box-sizing: border-box; background: conic-gradient(from 225deg, var(--a) calc(var(--v) * 270deg), rgba(127,127,127,0.18) 0 270deg, transparent 0); }
        .nb-k.lockd .nb-kw { background: conic-gradient(from 225deg, #ffe36d calc(var(--v) * 270deg), rgba(127,127,127,0.18) 0 270deg, transparent 0); }
        .nb-kn { width: 100%; height: 100%; border-radius: 50%; position: relative; background: radial-gradient(circle at 38% 30%, #514a57, #1d1821 58%, #0b090d); box-shadow: 0 2px 3px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.14); }
        .nb-kn i { position: absolute; left: 50%; top: 2px; width: 2px; height: 35%; margin-left: -1px; background: #fff; border-radius: 1px; transform-origin: 1px 140%; transform: rotate(calc(var(--v) * 270deg - 135deg)); box-shadow: 0 0 3px rgba(255,255,255,0.6); }
        .nb-k span { font-size: 8px; letter-spacing: 1px; opacity: 0.75; text-align: center; line-height: 1.1; }
        .nb-k b { font-size: 9px; font-weight: normal; opacity: 0; color: var(--b); height: 10px; white-space: nowrap; }
        .nb-k:hover b, .nb-k.turn b { opacity: 1; }
        .nb-fd { width: 24px; height: 110px; background: #0b090d; border: 1px solid var(--line); border-radius: 3px; position: relative; cursor: ns-resize; touch-action: none; flex: none; }
        .nb-fd i { position: absolute; left: 3px; right: 3px; bottom: 3px; height: calc(var(--v) * (100% - 6px)); background: linear-gradient(var(--b), var(--a)); opacity: 0.5; border-radius: 2px; }
        .nb-fd b { position: absolute; left: -4px; right: -4px; height: 9px; bottom: calc(var(--v) * (100% - 9px)); background: linear-gradient(#cfc8d4, #5d5562); border-radius: 2px; box-shadow: 0 2px 3px rgba(0,0,0,0.8); }
        .nb-menu { position: fixed; z-index: 99999; background: #120e14; border: 1px solid rgba(255,255,255,0.18); border-radius: 4px; padding: 4px 0; min-width: 170px; box-shadow: 0 8px 24px rgba(0,0,0,0.7); font: 11px 'Courier New', monospace; color: #eee; max-height: 70vh; overflow: auto; }
        .nb-mi { padding: 4px 12px; cursor: inherit; white-space: nowrap; } .nb-mi:hover { background: rgba(255,255,255,0.08); } .nb-mi.lk { opacity: 0.45; } .nb-mi.on::before { content: '✓ '; }
        .nb-mh { padding: 6px 12px 2px; font-size: 9px; letter-spacing: 2px; color: #ff8ac8; opacity: 0.85; }
        .nb-k.nb-hasl span::after { content: ' ●'; color: #6dd3ff; }
        .nb-help { position: absolute; inset: 20px; z-index: 50; background: rgba(8,6,10,0.96); border: 1px solid var(--a); border-radius: 6px; box-shadow: 0 0 30px rgba(0,0,0,0.8); padding: 14px 18px; overflow: auto; }
        .nb-help h3 { margin: 0 0 10px; font-size: 12px; letter-spacing: 3px; color: var(--b); }
        .nb-help .cols { columns: 3 230px; column-gap: 22px; font-size: 11px; line-height: 1.75; }
        .nb-help .cols div { break-inside: avoid; } .nb-help kbd { display: inline-block; min-width: 14px; padding: 0 4px; margin-right: 6px; border: 1px solid var(--line); border-bottom-width: 2px; border-radius: 3px; background: var(--pan2); font: bold 10px 'Courier New', monospace; text-align: center; }
        .nb-help .cols div .hr { display: flex; gap: 6px; align-items: baseline; line-height: 1.35; margin-bottom: 5px; } .nb-help .tx { display: flex; flex-direction: column; } .nb-help .tx .jp { color: var(--b); font-size: 10px; opacity: 0.85; }
        .nb-help .nb-hhd { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-bottom: 10px; } .nb-help .nb-hhd h3 { margin: 0 8px 0 0; } .nb-help h4 { margin: 10px 0 6px; font-size: 10px; letter-spacing: 2px; color: var(--a); }
        .nb-help kbd { flex: none; white-space: nowrap; }
        .nb-help h4 { margin: 8px 0 2px; font-size: 9px; letter-spacing: 2px; color: var(--a); }
        .nb-menu hr { border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 3px 0; }
        .nb-sw { display: flex; flex-wrap: wrap; gap: 4px; padding: 4px 10px; } .nb-sw i { width: 16px; height: 16px; border-radius: 3px; cursor: inherit; border: 1px solid rgba(255,255,255,0.3); }
        .nb-mix { display: flex; gap: 5px; overflow-x: auto; padding-bottom: 6px; align-items: stretch; }
        .nb-mc { flex: none; width: 104px; border: 1px solid var(--line); border-radius: 5px; padding: 5px; background: rgba(0,0,0,0.22); display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .nb-mc.pk { border-color: var(--a); box-shadow: inset 0 0 12px var(--glow); }
        .nb-mc h4 { margin: 0; font-size: 10px; letter-spacing: 1px; width: 100%; text-align: center; border-top: 3px solid var(--c, var(--a)); padding-top: 3px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; cursor: inherit; }
        .nb-mc .nb-ks { justify-content: center; } .nb-mc .nb-k { width: 44px; }
        .nb-mc .nb-ins { width: 100%; display: flex; flex-direction: column; gap: 2px; }
        .nb-mc .nb-ins div { font-size: 9px; padding: 2px 4px; background: rgba(0,0,0,0.4); border-left: 2px solid var(--a); overflow: hidden; white-space: nowrap; cursor: inherit; }
        .nb-mc.bus { background: repeating-linear-gradient(135deg, rgba(0,0,0,0.3) 0 6px, rgba(0,0,0,0.18) 6px 12px); border-style: dashed; }
        .nb-mc .nb-out { width: 100%; font-size: 9px; padding: 1px 2px; }
        .nb-sends { gap: 4px 3px; } .nb-snd { display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .nb-snd .nb-k i { background: var(--c, var(--a)); }
        .nb-pp { font-size: 8px; padding: 0 4px; line-height: 13px; min-width: 0; }
        .nb-rlist { display: flex; flex-direction: column; gap: 3px; margin: 4px 0 6px; max-width: 360px; }
        .nb-rrow { display: flex; align-items: center; gap: 8px; padding: 3px 6px; background: rgba(0,0,0,0.3); border-left: 3px solid var(--c, var(--a)); }
        .nb-rrow .nb-rn { flex: 1; font-size: 11px; cursor: pointer; } .nb-rrow .nb-snd { flex-direction: row; gap: 6px; } .nb-rrow .nb-k { width: 40px; }
        .nb-mc .nb-ins div.off { opacity: 0.4; border-left-color: #555; }
        .nb-fm { display: flex; gap: 4px; align-items: flex-end; }
        .nb-vm2 { width: 6px; height: 110px; background: #000; border: 1px solid var(--line); position: relative; }
        .nb-vm2 i { position: absolute; left: 0; right: 0; bottom: 0; height: calc(var(--m, 0) * 100%); background: linear-gradient(0deg, #6dffb0, #ffe36d 75%, #ff4a5a); }
        .nb-freq { display: flex; flex-direction: column; gap: 6px; }
        .nb-fmeter { position: relative; height: 18px; background: repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 10%), #0a0a0a; border: 1px solid rgba(255,255,255,0.15); border-radius: 3px; overflow: hidden; }
        .nb-fmeter i { position: absolute; left: 0; top: 0; bottom: 0; background: linear-gradient(90deg, #3a0a12, var(--a) 70%, #fff); box-shadow: 0 0 12px var(--glow); }
        .nb-fmeter b { position: absolute; right: 6px; top: 1px; font-size: 11px; color: #fff; text-shadow: 0 0 4px #000; }
        .nb-fwhy { font-size: 10px; opacity: 0.85; line-height: 1.5; }
        .nb-fres { font-size: 10px; border-left: 2px solid var(--a); padding: 4px 8px; background: rgba(0,0,0,0.25); line-height: 1.5; }
        .nb-saves { display: flex; flex-direction: column; gap: 3px; margin-top: 6px; max-height: 170px; overflow: auto; }
        .nb-cost { position: relative; height: 11px; margin: 3px 0 1px; background: rgba(0,0,0,0.5); border: 1px solid var(--line); font-size: 8px; line-height: 10px; }
        .nb-cost i { position: absolute; left: 0; top: 0; bottom: 0; opacity: 0.55; } .nb-cost span { position: relative; padding-left: 3px; }
        .nb-mc.fz { opacity: 0.45; filter: saturate(0.4); }
        .nb-frost { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 0 0 8px; padding: 6px 10px; border: 1px solid rgba(150,200,255,0.45); background: rgba(150,200,255,0.1); color: #cfe6ff; font-size: 11px; }
        .nb-sv { display: flex; gap: 6px; align-items: center; font-size: 11px; } .nb-sv span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .nb-col { width: 22px; height: 18px; padding: 0; border: 1px solid var(--line); background: none; }
        @media (max-width: 760px) { .nb-brw, .nb-info .k { display: none; } .nb-vis { height: 150px; } .nb-vis.h2 { height: 220px; } .nb-vm button { font-size: 9px; padding: 1px 4px; } .nb-arrbox { height: 240px; } }
        #desktop > #win-noisebox\\.exe.nb-fit { display: flex; flex-direction: column; }
        #desktop > #win-noisebox\\.exe.nb-fit.is-min { display: none; }
        #desktop > #win-noisebox\\.exe.nb-fit .window-header { flex: none; padding: 8px 14px !important; }
        #desktop > #win-noisebox\\.exe.nb-fit .window-body { flex: 1 1 auto; min-height: 0; max-height: none !important; height: auto !important; overflow: hidden !important; display: flex; flex-direction: column; padding: 8px 10px 10px !important; }
        #win-noisebox\\.exe.nb-fit .file-path { flex: none; margin: 0 0 6px; }
        .nb-fit .nb { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
        .nb-fit .nb-vis { flex: none; height: clamp(80px, 14vh, 170px); }
        @media (max-height: 820px) { .nb-fit .nb-vis { height: clamp(64px, 11vh, 190px); } .nb-fit .nb-dock { flex-basis: var(--dockh, 40%); } } .nb-fit .nb-vis.h2 { height: clamp(160px, 38vh, 420px); } .nb-fit .nb-vis.h0 { height: 0; }
        .nb-fit .nb-deck { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; padding-bottom: 6px; }
        .nb-fit .nb-top, .nb-fit .nb-arrbar, .nb-fit .nb-tabs { flex: none; }
        .nb-fit .nb-arrbox { flex: 1 1 0; min-height: 70px; height: auto; }
        .nb-body { display: flex; gap: 8px; align-items: stretch; }
        .nb-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }
        .nb-brw { flex: 0 0 212px; width: 212px; display: flex; flex-direction: column; gap: 5px; border: 1px solid var(--line); border-radius: 4px; background: rgba(0,0,0,0.22); padding: 5px; box-sizing: border-box; min-height: 0; max-height: 560px; }
        @media (max-width: 760px) { .nb-body > .nb-brw { display: none; } .nb-body > .nb-main { flex: 1 1 auto; min-width: 0; } }
        .nb-brw.shut { flex-basis: 30px; width: 30px; padding: 4px 2px; align-items: center; }
        .nb-bh { display: flex; gap: 4px; } .nb-bh .nb-in { flex: 1; width: auto; min-width: 0; }
        .nb-bc { display: flex; flex-direction: column; gap: 1px; }
        .nb-bcat { text-align: left; background: transparent; border: 0; border-left: 2px solid transparent; color: var(--ink); font: bold 10px 'Courier New', monospace; letter-spacing: 1px; padding: 3px 6px; opacity: 0.6; cursor: inherit; }
        .nb-bcat:hover { opacity: 0.9; background: rgba(255,255,255,0.04); } .nb-bcat.on { opacity: 1; border-left-color: var(--a); background: rgba(255,255,255,0.06); }
        .nb-bl { flex: 1 1 auto; min-height: 60px; overflow: auto; border-top: 1px solid var(--line); padding-top: 4px; scrollbar-width: thin; }
        .nb-bi { padding: 3px 6px; border-left: 2px solid transparent; cursor: grab; border-radius: 2px; }
        .nb-bi:hover { background: rgba(255,255,255,0.07); border-left-color: var(--a); }
        .nb-bi b { display: block; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .nb-bi small { display: block; font-size: 9px; opacity: 0.5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .nb-bi.lk { opacity: 0.35; cursor: not-allowed; }
        .nb-bsub { font-size: 9px; letter-spacing: 2px; color: var(--b); padding: 6px 4px 2px; opacity: 0.8; }
        .nb-bnote { font-size: 9px; line-height: 1.35; padding: 2px 6px 5px 14px; opacity: 0.65; }
        .nb-hungry { margin: 6px 0 2px; padding: 8px 10px; border: 1px dashed var(--a); border-radius: 4px; background: rgba(0,0,0,0.3); font-size: 11px; line-height: 1.4; }
        .nb-hungry b { color: var(--a); }
        .nb-bfold { cursor: pointer; user-select: none; border-top: 1px solid var(--line); margin-top: 2px; } .nb-bfold:hover { opacity: 1; color: var(--a); }
        .nb-bfoot { display: flex; flex-direction: column; gap: 5px; padding: 10px 4px 4px; margin-top: 6px; border-top: 1px dashed var(--line); } .nb-bfoot small { opacity: 0.6; font-size: 9px; }
        .nb-edbar { display: inline-flex; gap: 3px; margin-left: 8px; padding-left: 8px; border-left: 1px solid var(--line); }
        .nb-info { flex: none; display: flex; gap: 12px; font-size: 10px; padding: 5px 4px 0; margin-top: 6px; border-top: 1px solid var(--line); white-space: nowrap; overflow: hidden; min-height: 13px; }
        .nb-info .t { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; color: var(--b); }
        .nb-info .k { flex: 0 1 auto; overflow: hidden; text-overflow: ellipsis; opacity: 0.45; }
        .nb-fit .nb-body { flex: 1 1 auto; min-height: 0; } .nb-fit .nb-main { min-height: 0; } .nb-fit .nb-brw { max-height: none; }
        .nb-dragover { outline: 2px dashed var(--a); outline-offset: -2px; }
        .nb-split { flex: none; height: 9px; margin: 3px 0 -3px; cursor: row-resize; position: relative; touch-action: none; }
        .nb-split::before { content: ''; position: absolute; left: 50%; top: 3px; width: 46px; height: 3px; margin-left: -23px; border-radius: 2px; background: var(--line); }
        .nb-split:hover::before, .nb-split.drag::before { background: var(--a); box-shadow: 0 0 6px var(--glow); }
        .nb-split { display: none; } .nb-fit .nb-split { display: block; }
        .nb-fit .nb-arrhint { flex: 1 1 200px; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .nb-fit .nb-top { flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin; } .nb-fit .nb-top > * { flex: none; } .nb-fit .nb-top .nb-msg { flex: 1 1 auto; min-width: 60px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .nb-fit .nb-arrbar { flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin; } .nb-fit .nb-arrbar > * { flex: none; }
        .nb-fit .nb-top { flex-wrap: wrap !important; row-gap: 4px; overflow-x: visible !important; } .nb-fit .nb-top .nb-msg { flex: 1 1 140px !important; }
        .nb-fit .nb-dock { flex: 0 0 var(--dockh, 38%); min-height: 60px; overflow: auto; padding-right: 4px; }
        .nb-fit .nb-top { position: relative; } .nb-fit .nb-top .nb-msg { position: absolute !important; right: 8px; top: calc(100% + 4px); z-index: 6; max-width: 60%; pointer-events: none; padding: 3px 8px; border: 1px solid var(--line); border-radius: 3px; background: rgba(0,0,0,0.82); }
        .nb-fit .nb-top .nb-msg:empty { display: none; }
        .nb-left { flex: 0 0 clamp(212px, 13vw, 300px); width: clamp(212px, 13vw, 300px); display: flex; flex-direction: column; gap: 6px; min-height: 0; }
        .nb-left .nb-brw { flex: 1 1 auto; width: auto; min-height: 120px; }
        .nb-left.shut { flex-basis: 30px; width: 30px; } .nb-left.shut .nb-brw { width: 30px; } .nb-left.shut .nb-vis { display: none; }
        .nb-fit .nb-body { position: relative; }
        .nb-fit .nb-left .nb-vis { flex: none; width: 100%; height: auto; aspect-ratio: 16 / 11; border-radius: 4px; cursor: zoom-in; }
        .nb-fit .nb-left .nb-vis.h0 { display: none; }
        .nb-fit .nb-left .nb-vis.h2 { position: absolute; right: 6px; top: 30px; width: min(52%, 760px); aspect-ratio: 16 / 9; height: auto; z-index: 8; cursor: zoom-out; box-shadow: 0 10px 40px rgba(0,0,0,0.75), 0 0 0 1px var(--a); }
        .nb-fit .nb-left .nb-vis:not(.h2):not(.fs) .nb-vm, .nb-fit .nb-left .nb-vis:not(.h2):not(.fs) .nb-vr, .nb-fit .nb-left .nb-vis:not(.h2):not(.fs) .nb-np { opacity: 0; transition: opacity 0.15s; }
        .nb-fit .nb-left .nb-vis:hover .nb-vm, .nb-fit .nb-left .nb-vis:hover .nb-vr, .nb-fit .nb-left .nb-vis:hover .nb-np, .nb-fit .nb-left .nb-vis:focus-within .nb-vm, .nb-fit .nb-left .nb-vis:focus-within .nb-vr { opacity: 1; }
        .nb-fit .nb-left .nb-vis:not(.h2):not(.fs) .nb-vm { left: 4px; right: 4px; top: 4px; bottom: auto; max-width: none; gap: 2px; } .nb-fit .nb-left .nb-vis:not(.h2):not(.fs) .nb-vm button { font-size: 9px; padding: 1px 3px; }
        .nb-fit .nb-left .nb-vis:not(.h2):not(.fs) .nb-vr { right: 4px; bottom: 4px; } .nb-fit .nb-left .nb-vis:not(.h2):not(.fs) .nb-np { font-size: 9px; }
        .nb-fit .nb-tabs { margin-top: 6px; align-items: flex-end; } .nb-tabs .nb-fold { margin-left: auto; opacity: 0.7; } .nb-tabs .nb-fold:hover { opacity: 1; } .nb-tabs .nb-fold.nb-big { margin-left: 4px; }
        .nb-fit .nb-main.dockoff .nb-dock, .nb-fit .nb-main.dockoff .nb-split { display: none; }
        .nb-fit .nb-main.dockbig .nb-dock { flex: 1 1 auto !important; } .nb-fit .nb-main.dockbig .nb-arrbox { flex: 0 0 74px; }
        .nb-fit .nb-top .nb-k { flex-direction: row-reverse; width: auto; gap: 4px; position: relative; } .nb-fit .nb-top .nb-k .nb-kw { width: 22px; height: 22px; }
        .nb-fit .nb-top .nb-k b { position: absolute; left: 0; top: 100%; z-index: 6; background: rgba(0,0,0,0.8); padding: 0 3px; }
        @media (max-height: 900px) { #win-noisebox\\.exe.nb-fit .file-path { display: none; } }
        .nb-top.c2 [data-short] { font-size: 0 !important; } .nb-top.c2 [data-short]::after { content: attr(data-short); font-size: 10px; }
        .nb-top.c2 select.nb-sel { max-width: 118px; } .nb-top.c2 select.nb-sel.nb-feel { max-width: 104px; }
        .nb-top.c3 .nb-mtr, .nb-top.c3 .nb-lab { display: none; }
        .nb-fit .nb-dock::-webkit-scrollbar { width: 8px; } .nb-fit .nb-dock::-webkit-scrollbar-thumb { background: var(--line); border-radius: 4px; }

        .nb.sk-os { --bg: #0d0b10; --pan: #26212b; --pan2: #39333f; --line: rgba(0,0,0,0.85); --metal: repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 3px); --face: linear-gradient(180deg, #1d1a21, #141217 70%); }
        .nb.sk-os .nb-deck { border-radius: 3px; border: 1px solid #000; padding: 10px 12px 12px; background: var(--metal), var(--face); box-shadow: inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.6), 0 2px 0 #050407; }
        .nb.sk-os .nb-top { margin: 0 0 10px; padding: 7px 9px; border: 1px solid #000; border-radius: 3px; background: #0f0d12; box-shadow: inset 0 2px 5px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.06); }
        .nb.sk-os .nb-btn { border-radius: 3px; padding: 4px 9px; color: #e8e2ec; background: linear-gradient(180deg, var(--pan2), var(--pan)); border: 1px solid #000; box-shadow: inset 0 1px 0 rgba(255,255,255,0.13), 0 2px 0 #000; transition: background 0.1s, transform 0.05s; }
        .nb.sk-os .nb-btn.sm { padding: 3px 7px; }
        .nb.sk-os .nb-btn:hover { background: linear-gradient(180deg, #463f4d, #2d2733); }
        .nb.sk-os .nb-btn:active { transform: translateY(2px); box-shadow: inset 0 1px 2px rgba(0,0,0,0.6); }
        .nb.sk-os .nb-btn.on { color: var(--a); background: linear-gradient(180deg, #2a2430, #1c1820); transform: translateY(1px); box-shadow: inset 0 2px 0 var(--a), inset 0 0 10px color-mix(in srgb, var(--a) 22%, transparent), 0 1px 0 #000; }
        .nb.sk-os .nb-btn.rec.on { color: #ff6a7c; box-shadow: inset 0 2px 0 #ff2d4d, inset 0 0 10px rgba(255,45,77,0.3), 0 1px 0 #000; }
        .nb.sk-os .nb-play { border-radius: 3px; padding: 5px 16px; color: #0a0006; border: 1px solid #000; background: linear-gradient(180deg, color-mix(in srgb, var(--a) 92%, #fff 8%), color-mix(in srgb, var(--a) 72%, #000)); box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 3px 0 color-mix(in srgb, var(--a) 35%, #000); }
        .nb.sk-os .nb-play:active { transform: translateY(3px); box-shadow: inset 0 1px 2px rgba(0,0,0,0.4); }
        .nb.sk-os .nb-lcd { border-radius: 2px; font-family: 'DotGothic16', monospace; font-weight: normal; font-size: 16px; line-height: 18px; letter-spacing: 0; background: radial-gradient(120% 100% at 50% 30%, #0b1311, #030605); border: 2px solid #000; color: var(--b); text-shadow: 0 0 5px color-mix(in srgb, var(--b) 55%, transparent); box-shadow: inset 0 2px 6px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.08); padding: 3px 10px; }
        .nb.sk-os .nb-lcd .nb-dp { font-style: normal; margin: 0 -2px 0 -1px; }
        .nb.sk-os .nb-sel, .nb.sk-os .nb-in { border-radius: 2px; background: #0b090d; border-color: #000; color: #e8e2ec; padding: 4px 6px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.06); }
        .nb.sk-os .nb-sel:focus, .nb.sk-os .nb-in:focus { outline: none; border-color: var(--a); }
        .nb.sk-os .nb-brw { border-radius: 3px; background: #0f0d12; padding: 7px; border-color: #000; box-shadow: inset 0 2px 6px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.06); }
        .nb.sk-os .nb-bcat { border-radius: 2px; border-left: 0; padding: 5px 9px; }
        .nb.sk-os .nb-bcat.on { color: #fff; background: rgba(255,255,255,0.04); box-shadow: inset 3px 0 0 var(--a); }
        .nb.sk-os .nb-bi { border-radius: 2px; border-left: 0; padding: 5px 9px; transition: background 0.1s; }
        .nb.sk-os .nb-bi:hover { background: rgba(255,255,255,0.05); box-shadow: inset 3px 0 0 color-mix(in srgb, var(--a) 60%, transparent); }
        .nb.sk-os .nb-bi b { letter-spacing: 0.5px; }
        .nb.sk-os .nb-vis { border-radius: 3px; border: 3px solid #050406; box-shadow: inset 0 0 20px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.07); }
        .nb.sk-os .nb-vm button, .nb.sk-os .nb-vbtn { border-radius: 2px; padding: 2px 8px; background: rgba(10,8,12,0.85); border: 1px solid #000; }
        .nb.sk-os .nb-arrbox { border-radius: 3px; border: 2px solid #000; box-shadow: inset 0 2px 12px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.06); }
        .nb.sk-os .nb-ov { border-radius: 2px; border-color: #000; }
        .nb.sk-os .nb-tabs { gap: 4px; margin-top: 12px; padding: 4px; border: 1px solid #000; border-radius: 3px; background: #0c0a0e; box-shadow: inset 0 2px 5px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.06); }
        .nb.sk-os .nb-tab { border: 1px solid #000; border-radius: 2px; padding: 5px 12px; opacity: 1; color: #bdb5c3; background: linear-gradient(180deg, #2f2a35, #1f1b24); box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 0 #000; transition: background 0.1s; }
        .nb.sk-os .nb-tab:hover { color: #fff; background: linear-gradient(180deg, #3b3542, #27222c); }
        .nb.sk-os .nb-tab.on { color: var(--a); background: linear-gradient(180deg, #221e27, #18151c); transform: translateY(1px); box-shadow: inset 0 2px 0 var(--a), inset 0 0 10px color-mix(in srgb, var(--a) 20%, transparent), 0 1px 0 #000; }
        .nb.sk-os { --scrw: radial-gradient(circle at 40% 35%, #a49cab 0 1px, #47424d 2px, #121014 2.8px, transparent 3.3px); }
        .nb.sk-os .nb-deck { background: var(--scrw) 2px 2px / 10px 10px no-repeat, var(--scrw) calc(100% - 2px) 2px / 10px 10px no-repeat, var(--scrw) 2px calc(100% - 2px) / 10px 10px no-repeat, var(--scrw) calc(100% - 2px) calc(100% - 2px) / 10px 10px no-repeat, var(--metal), var(--face); }
        .nb.sk-os .nb-top { padding-left: 18px; padding-right: 18px; background: var(--scrw) 4px 50% / 10px 10px no-repeat, var(--scrw) calc(100% - 4px) 50% / 10px 10px no-repeat, #0f0d12; }
        .nb.sk-os .nb-lcd { position: relative; overflow: hidden; border: 0; background: #140d05; color: #ffb547; text-shadow: 0 0 6px rgba(255, 170, 60, 0.6); box-shadow: inset 0 0 0 2px #050406, inset 0 3px 8px #000, 0 1px 0 rgba(255, 255, 255, 0.08); }
        .nb.sk-os .nb-lcd::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.32) 0 1px, transparent 1px 2px), linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent 40%); }
        .nb.sk-os .nb-play { position: relative; padding-left: 27px; color: #ddd6e3; background: linear-gradient(180deg, #423d49, #27242c); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 3px 0 #0a090c, 0 0 0 1px #050406; }
        .nb.sk-os .nb-play::before { content: ''; position: absolute; left: 10px; top: 50%; width: 7px; height: 7px; margin-top: -3.5px; border-radius: 50%; background: #1b281d; box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.8); }
        .nb.sk-os .nb-play:hover { color: #fff; background: linear-gradient(180deg, #4b4552, #2d2a33); }
        .nb.sk-os .nb-play.on { color: #7dffa8; text-shadow: 0 0 6px rgba(77, 255, 154, 0.5); transform: translateY(2px); background: linear-gradient(180deg, #24212a, #1a181e); box-shadow: inset 0 2px 0 #4dff9a, inset 0 3px 8px rgba(0, 0, 0, 0.5), 0 1px 0 #0a090c, 0 0 0 1px #050406; }
        .nb.sk-os .nb-play.on::before { background: radial-gradient(circle at 40% 35%, #fff, #4dff9a 50%); box-shadow: 0 0 6px #4dff9a; }
        .nb.sk-os .nb-info .k { opacity: 1; color: #6f6878; text-shadow: 0 1px 0 rgba(255, 255, 255, 0.06), 0 -1px 0 #000; }
        .nb.sk-os .nb-tab.nb-fold { margin-left: auto; } .nb.sk-os .nb-tab.nb-fold ~ .nb-tab.nb-fold { margin-left: 0; }
        .nb.sk-os .nb-sec { border-radius: 3px; background: rgba(0,0,0,0.22); border-color: #000; box-shadow: inset 0 1px 0 rgba(255,255,255,0.04); }
        .nb.sk-os .nb-mtr i, .nb.sk-os .nb-recmtr { border-radius: 1px; }
        .nb.sk-os .nb-fd { border-radius: 2px; } .nb.sk-os .nb-fd i { border-radius: 2px; }
        .nb.sk-os .nb-help { border-radius: 4px; background: #121015; border-color: #000; box-shadow: 0 20px 50px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08); }
        .nb.sk-os .nb-hint { opacity: 0.7; letter-spacing: 1px; }
        .nb-menu { border-radius: 4px; padding: 6px; border-color: color-mix(in srgb, var(--neon-primary, #ff2a6d) 40%, transparent); background: linear-gradient(180deg, color-mix(in srgb, var(--neon-primary, #ff2a6d) 9%, rgba(14,6,14,0.95)), rgba(8,3,9,0.97)); box-shadow: 0 18px 40px rgba(0,0,0,0.6); }
        .nb-mi { border-radius: 2px; padding: 5px 12px; } .nb-mi:hover { background: color-mix(in srgb, var(--neon-primary, #ff2a6d) 22%, transparent); }
                `;
        document.head.appendChild(st);
    }
    function template() {
        if (document.getElementById('noisebox.exe')) return;
        let tp = document.createElement('template');
        tp.id = 'noisebox.exe';
        tp.innerHTML = `
        <p class="file-path">// noisebox.exe // 音箱</p>
        <div class="nb">
            <div class="nb-vis" data-v>
                <canvas class="nb-gl"></canvas><canvas class="nb-2d"></canvas>
                <div class="nb-np" data-np></div>
                <div class="nb-vm" data-vm></div>
                <div class="nb-vr"><button type="button" class="nb-vbtn" data-vreset title="↺ the picture back to how it came: its own settings, every AFTER knob, the colours (click twice). which picture + the sizes stay">↺</button><button type="button" class="nb-vbtn" data-look title="how the pictures look">LOOK</button><button type="button" class="nb-vbtn" data-lo title="less pixels, more speed">LO</button><button type="button" class="nb-vbtn" data-pop title="pop it out into its own window you can drag anywhere">⧉</button><button type="button" class="nb-vbtn" data-fs title="全画面">⛶</button></div>
            </div>
            <div class="nb-deck">
                <div class="nb-row nb-top" data-top></div>
                <div class="nb-body">
                    <div class="nb-brw" data-brw></div>
                    <div class="nb-main">
                        <div class="nb-row nb-arrbar" data-arrbar></div>
                        <div class="nb-arrbox" data-arr><div class="nb-arrsc"><div class="nb-arrsp"></div></div><canvas class="nb-arrcv"></canvas><div class="nb-vsb" data-vsb title="drag to scroll the tracks"><i></i></div></div>
                        <div class="nb-ov" data-ov title="the whole song. drag the box = scroll · drag its ends = zoom · click = jump there · double click = fit it all · wheel = scroll"><canvas></canvas></div>
                        <div class="nb-split" data-split title="drag: more timeline or more panel. double click: back to half"></div>
                        <div class="nb-tabs" data-tabs></div>
                        <div class="nb-dock" data-dock></div>
                    </div>
                </div>
                <div class="nb-info" data-info><span class="t"></span><span class="k">? 全部のキー // every key · space 再生 // play · 1-7 パネル // panels · alt+click つまみ = レーン // a knob = its lane · alt+r 自動 // AUTO · ctrl+b ブラウザ // browser</span></div>
            </div>
        </div>`;
        document.body.appendChild(tp);
    }

    const pos3 = b => { let q = NB.barOf(X.pr, Math.max(0, b)), bt = Math.floor(b - q.at + 1e-9) + 1, six = Math.floor((b % 1) * 4) + 1; return String(q.bar + 1).padStart(3, ' ') + '.' + bt + '.' + six; };
    const clock = b => { let sec = NB.secAt(X.pr, b); return Math.floor(sec / 60) + ':' + (sec % 60).toFixed(1).padStart(4, '0'); };
    const barTxt = b => { let q = NB.barOf(X.pr, b); return b - q.at < 1e-6 ? String(q.bar + 1) : (q.bar + 1 + (b - q.at) / q.n).toFixed(2); };
    const barStart = b => NB.barOf(X.pr, Math.max(0, b)).at, barLen = b => NB.barOf(X.pr, Math.max(0, b)).n;
    function play(from, pre) { if (!X.eng()) { X.flash('this browser has no sound for me'); return false; } L.metro = !!V && V.metro; L.play(from != null ? from : (V ? V.cursor : 0), pre || 0); showTop(); return true; }
    X.preOf = b => { let n = (X.pr.rq || {}).ci || 0; return n ? n * NB.barOf(X.pr, Math.max(0, b)).n : 0; };
    X.stopIt = () => stop();
    function stop() { if (window.NBA) NBA.stopped(); if (L) L.stop(); held.forEach(h => L && L.noteOff(h)); held.clear(); showTop(); if (V) V.dirty = true; }
    X.play = play; X.stop = stop;
    function showTop() {
        if (!V) return;
        let box = V.q('[data-top]'), pr = X.pr; box.innerHTML = '';
        box.appendChild(btn('⏮', 'sm', () => { V.cursor = 0; if (X.playing()) play(0); V.dirty = true; showPos(); }, 'back to the start'));
        box.appendChild(btn(X.playing() ? '■ 停止' : '▶ 再生', 'nb-play' + (X.playing() ? ' on' : ''), () => { if (X.playing()) stop(); else play(); }, 'space bar works too'));
        { let rb = btn('● REC', 'rec' + (V.rec || (window.NBA && NBA.owns() && NBA.armed(sel.tr)) ? ' on' : ''), () => { if (window.NBA && NBA.owns()) { NBA.recButton(); return; } V.rec = !V.rec; if (V.rec) X.mark(); if (V.rec && !X.playing()) play(V.cursor, X.preOf(V.cursor)); showTop(); }, 'records the computer keyboard / a midi keyboard into the track youve picked. on an AUDIO track it records the mic (it asks first)'); rb.dataset.rec = 1; box.appendChild(rb); }
        { let rq = pr.rq || {}, rm = btn('▾', 'sm' + (rq.ci || rq.punch ? ' on' : ''), e => { let q = pr.rq = pr.rq || { ci: 0, punch: 0, takes: 1 }; const set = (k, v) => () => { q[k] = v; X.save(); showTop(); };
                menu(e.clientX, e.clientY, [{ head: '● RECORDING' }, ['no count in', set('ci', 0), { on: !q.ci }], ['count in 1 bar (the click alone, then it records)', set('ci', 1), { on: q.ci === 1 }], ['count in 2 bars', set('ci', 2), { on: q.ci === 2 }], '-',
                    [q.punch ? 'PUNCH: only between the loop marks (on)' : 'PUNCH: only between the loop marks (off)', set('punch', q.punch ? 0 : 1), { on: !!q.punch }],
                    [q.takes !== 0 ? 'with the loop on: every pass is a TAKE (on)' : 'with the loop on: every pass is a TAKE (off)', set('takes', q.takes !== 0 ? 0 : 1), { on: q.takes !== 0 }]]); }, 'how it records: a count in, PUNCH in + out at the loop marks, a take every pass round the loop'); rm.dataset.recopt = 1; box.appendChild(rm); }
        box.appendChild(btn('⟲', pr.loop.on ? 'on' : '', () => { pr.loop.on = pr.loop.on ? 0 : 1; X.save(); V.dirty = true; showTop(); }, 'loop the bit marked on the ruler (drag on the ruler to mark it)'));
        box.appendChild(btn('♩', V.metro ? 'on' : '', () => { V.metro = !V.metro; if (L) L.metro = V.metro; showTop(); }, 'the click. never ends up in a bounce'));
        let lcd = el('span', 'nb-lcd'); lcd.dataset.pos = ''; box.appendChild(lcd);
        { let hb = btn('印 MARKERS ▾', 'sm' + (pr.marks.length ? ' on' : ''), e => graves(e.clientX, e.clientY), 'MARKERS: named places in the song (intro, the drop). jump to one, or drop one at the cursor (b). [ + ] = previous / next'); hb.dataset.graves = 1; hb.dataset.short = '墓 ▾'; box.appendChild(hb); }
        box.appendChild(el('span', 'nb-lab', 'BPM'));
        let bpm = el('span', 'nb-lcd bpm', String(pr.bpm)); bpm.title = pr.tempo.length ? 'the pace it starts at (the 速 PACE line has where it changes). drag up + down, shift = fine, double click to type it' : 'drag up + down, shift = fine, double click to type it';
        let y0 = 0, b0 = 0;
        const setB = v => { pr.bpm = Math.round(clamp(v, 20, 300) * 10) / 10; bpm.textContent = pr.bpm; X.apply(); if (L) L.retime(); };
        drag(bpm, p => { X.mark(); y0 = p.y; b0 = pr.bpm; }, p => setB(b0 + (y0 - p.y) / (p.shift ? 30 : 3)), () => X.touch());
        bpm.addEventListener('wheel', e => { e.preventDefault(); setB(pr.bpm - Math.sign(e.deltaY) * (e.shiftKey ? 0.1 : 1)); X.save(); }, { passive: false });
        bpm.addEventListener('dblclick', () => { let r = bpm.getBoundingClientRect(); inline(r.left, r.top, 60, pr.bpm, v => { let n = parseFloat(v); if (isFinite(n)) { X.mark(); setB(n); X.touch(); } }); });
        box.appendChild(bpm);
        { let sg = selBox([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => [n, n + '/4']), pr.sig, v => { X.mark(); pr.sig = +v; X.touch(); timeMoved(); showAll(); }); if (pr.sigs.length) sg.title = 'the count it starts with. it changes later on (the n/4 tags on the ruler, right click the ruler for more)'; box.appendChild(sg); }
        box.appendChild(el('span', 'nb-lab', 'KEY'));
        box.appendChild(selBox(ROOTS.map((r, i) => [i, r]), pr.root, v => { X.mark(); pr.root = +v; X.touch(); V.dirty = true; showDock(); }));
        box.appendChild(selBox(Object.keys(NB.SCALES).map(k => [k, NB.SCALES[k].jp + ' ' + NB.scaleName(k)]), pr.scale, v => { X.mark(); pr.scale = v; X.touch(); showDock(); }));
        box.appendChild(btn('鍵 KEY LOCK', pr.snap ? 'on sm' : 'sm', () => { pr.snap = pr.snap ? 0 : 1; X.save(); showTop(); showDock(); }, 'KEY LOCK: on = new notes only land inside the key')).dataset.short = '鍵';
        box.appendChild(knob('SWING', () => pr.swing, v => { pr.swing = v; }, { fmt: v => Math.round(v * 66) + '%', def: 0, cls: 'sm', start: X.mark, done: X.touch }));
        { let gs = feelBox([], pr.groove || 'none', v => { X.mark(); pr.groove = v; X.touch(); }); gs.classList.add('nb-feel'); gs.title = 'FEEL: where the 16ths really land and how hard each one gets hit. every track follows this unless you give it its own'; box.appendChild(gs); }
        box.appendChild(btn('↶', 'sm' + (undo.length ? '' : ' lk'), () => X.undo(), 'undo (ctrl+z)'));
        box.appendChild(btn('↷', 'sm' + (redo.length ? '' : ' lk'), () => X.redo(), 'redo (ctrl+shift+z)'));
        { let ns = btn('✕ 新曲 NEW SONG', 'sm'); ns.onclick = sure(ns, () => X.newSong()); ns.dataset.short = '✕ 新曲'; ns.title = 'NEW SONG: a clean empty slate. every track, clip, note, lane and plugin goes, the loop + tempo + key go back to how it came (click twice, undo gets it back, kept songs stay kept)'; box.appendChild(ns); }
        if (window.NBL) { let lb = btn(NBL.label(), 'sm', () => { NBL.set(NBL.next()); showAll(); }, 'language 言語: JP+EN → EN → 日本語'); lb.dataset.nolang = 1; box.appendChild(lb); }
        { let kb = btn('⌨ キー一覧 KEYS ?', 'sm nb-keys', () => help(), 'every key + shortcut in the noisebox (the ? key opens it too)'); kb.dataset.short = '⌨ ?'; box.appendChild(kb); }
        box.appendChild(btn(V.midi ? 'MIDI ON' : 'MIDI', 'sm' + (V.midi ? ' on' : ''), midiOn, V.midi ? 'listening to your midi keyboard. click to stop' : 'use a real midi keyboard (the browser will ask first)'));
        let mt = el('div', 'nb-mtr'); mt.title = 'out, left + right'; mt.appendChild(el('i')); mt.appendChild(el('i')); V.mOut = mt; box.appendChild(mt);
        box.appendChild(el('span', 'nb-msg')).dataset.msg = '';
        showPos(); topFit();
    }
    function topFit() {
        if (!V) return;
        let box = V.q('[data-top]'); if (!box || !V.win.classList.contains('nb-fit')) { if (box) box.classList.remove('c2', 'c3'); return; }
        const rows = () => { let k = [...box.querySelectorAll(':scope > *')].filter(c => !c.dataset || c.dataset.msg == null).filter(c => c.offsetParent !== null); if (!k.length) return 1; let t0 = k[0].getBoundingClientRect().top; return k.some(c => c.getBoundingClientRect().top > t0 + 12) ? 2 : 1; };
        V.topW = box.clientWidth; box.classList.remove('c2', 'c3');
        if (rows() > 1) { box.classList.add('c2'); if (rows() > 1) box.classList.add('c3'); }
    }
    function showPos() {
        if (!V) return;
        let l = V.q('[data-pos]'); if (!l) return;
        let b = X.playing() && L.pos() != null ? L.pos() : V.cursor;
        let t = pos3(b) + '  ' + clock(b) + (NB.steady(X.pr) ? '' : '  ♩' + Math.round(NB.tempoAt(X.pr, b)));
        if (l._t !== t) { l._t = t; l.innerHTML = t.replace(/\./g, '<i class="nb-dp">.</i>'); }
    }

    const HEADW = 172, RULER = 34, RTOP = 16, TH = 50, LH = 38, MH = 36, PH = 56;
    const SNAPS = [[16, '4 bars'], [4, 'bar'], [2, '1/2'], [1, 'beat'], [0.5, '1/8'], [0.25, '1/16'], [0.125, '1/32'], [0, 'off']];
    function rowsOf() {
        let r = [], y = 0, pr = X.pr;
        let th = [TH, 78, 112][look.th || 0] || TH, lh = [LH, 56, 80][look.th || 0] || LH;
        pr.tracks.forEach(tr => {
            if (X.route && X.route.hidden(tr)) return;
            r.push({ k: 't', tr, y, h: th }); y += th;
            if (tr.aopen) { tr.auto.forEach(a => { if (tr.aonly && tr.aonly !== a.path) return; r.push({ k: 'a', tr, a, y, h: lh }); y += lh; }); r.push({ k: 'add', tr, y, h: 20 }); y += 20; }
        });
        let M = X.master();
        if (pr.popen) { r.push({ k: 'p', tr: M, y, h: PH }); y += PH; }
        r.push({ k: 'm', tr: M, y, h: MH }); y += MH;
        if (pr.master.aopen) { M.auto.forEach(a => { if (pr.master.aonly && pr.master.aonly !== a.path) return; r.push({ k: 'a', tr: M, a, y, h: lh }); y += lh; }); r.push({ k: 'add', tr: M, y, h: 20 }); y += 20; }
        r.push({ k: 'new', y, h: 40 }); y += 40;
        V.rowsH = y; V.rows = r;
        return r;
    }
    const snapB = (b, s) => s ? Math.round(b / s) * s : b;
    const totalBeats = () => { let pr = X.pr; return Math.min(NB.barAt(pr, lim().bars), Math.max(64, NB.barAt(pr, NB.barOf(pr, NB.songEnd(pr)).bar + 16))); };
    function arrSize() {
        if (!V) return;
        let box = V.q('[data-arr]'), sc = box.querySelector('.nb-arrsc'), sp = box.querySelector('.nb-arrsp'), cv = box.querySelector('.nb-arrcv');
        rowsOf();
        sp.style.width = (HEADW + totalBeats() * V.ppb + 120) + 'px'; sp.style.height = (RULER + V.rowsH) + 'px';
        let w = sc.clientWidth, h = sc.clientHeight, d = Math.min(2, window.devicePixelRatio || 1);
        if (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); cv.style.width = w + 'px'; cv.style.height = h + 'px'; V.cache = null; }
        V.aw = w; V.ah = h; V.dpr = d; V.dirty = true;
    }
    // Reading scrollLeft every frame = a full layout every frame. Pain.
    const bx = b => HEADW + b * V.ppb - V.sl;
    const xb = x => (x - HEADW + V.sl) / V.ppb;
    const ry = r => RULER + r.y - V.st;
    function laneName(tr, path) {
        let s = path.split('.');
        if (s[0] === 'mix') return { vol: 'VOLUME', pan: 'PAN', lc: 'LOW CUT', hc: 'HIGH CUT', room: 'ROOM', echo: 'ECHO' }[s[1]] || path;
        if (s[0] === 'snd') { let p = NB.V[tr.inst] && NB.V[tr.inst].p.find(q => q[0] === s[1]); return 'SOUND ' + (p ? p[1] : s[1]); }
        if (s[0] === 'send') { let c = X.trk(s[1]); return 'SEND ' + (c ? c.name : '(gone)'); }
        if (s[0] === 'fx') { let P = tr.fx.find(q => q.uid === s[1]); if (!P) return '(gone)'; let d = NBFX.BY[P.type], q = d.p.find(z => z[0] === s[2]); return d.en + ' ' + (q ? q[1] : s[2]); }
        return path;
    }
    function laneChoices(tr) {
        let out = tr.isMaster ? [['mix.vol', 'VOLUME']] : [['mix.vol', 'VOLUME'], ['mix.pan', 'PAN'], ['mix.lc', 'LOW CUT'], ['mix.hc', 'HIGH CUT'], ['mix.room', 'ROOM'], ['mix.echo', 'ECHO']];
        if (!tr.isMaster) X.pr.tracks.forEach(c => { if (c.inst === 'cell' && NB.canFeed(X.pr, tr.uid, c.uid)) out.push(['send.' + c.uid, 'SEND ' + c.name]); });
        tr.fx.forEach(P => { let d = NBFX.BY[P.type]; if (!NB.fxOK(P)) return; d.p.forEach(q => out.push(['fx.' + P.uid + '.' + q[0], d.en + ' ' + q[1]])); });
        if (!tr.isMaster && tr.inst !== 'coffin') NB.V[tr.inst].p.forEach(q => out.push(['snd.' + q[0], 'SOUND ' + q[1]]));
        return out;
    }
    function laneFmt(tr, path) {
        let s = path.split('.');
        if (s[0] === 'send' && X.route) return X.route.db;
        if (s[0] === 'mix') return { vol: v => Math.round(v * 100) + '%', pan: v => v < 0.48 ? 'L' + Math.round((0.5 - v) * 200) : v > 0.52 ? 'R' + Math.round((v - 0.5) * 200) : 'mid', lc: v => Math.round(10 * Math.pow(200, v)) + 'Hz', hc: v => Math.round(200 * Math.pow(110, v)) + 'Hz' }[s[1]] || (v => Math.round(v * 100) + '%');
        let q = s[0] === 'snd' ? (NB.V[tr.inst] && NB.V[tr.inst].p.find(z => z[0] === s[1])) : (() => { let P = tr.fx.find(z => z.uid === s[1]); return P && NBFX.BY[P.type].p.find(z => z[0] === s[2]); })();
        return q && q[3] ? q[3] : (v => Math.round(v * 100) + '%');
    }
    const own = tr => tr.isMaster ? X.pr.master : tr;
    const lanesOf = tr => tr.isMaster ? X.pr.master.auto : tr.auto;
    function laneFor(tr, path, quiet) {
        let L0 = lanesOf(tr); if (!L0.some(a => a.path === path)) { X.mark(); L0.push({ path, pts: [] }); }
        own(tr).aopen = 1; if (own(tr).aonly && own(tr).aonly !== path) own(tr).aonly = path;
        X.touch(); arrSize(); if (!quiet) X.flash('lane: ' + laneName(tr, path) + ' under ' + tr.name + '. click on it to draw, shift+drag to paint it');
    }
    function autoable(node, tr, path, label, get) {
        node.classList.toggle('nb-hasl', lanesOf(tr).some(a => a.path === path && a.pts.length));
        node.addEventListener('mousedown', e => {
            if (!V) return; V.touched = { uid: tr.uid, path, label: (tr.isMaster ? 'MASTER' : tr.name) + ' › ' + label };
            if (e.altKey && e.button === 0) { e.preventDefault(); e.stopImmediatePropagation(); laneFor(tr, path); }
        }, true);
        node.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); laneMenu(e.clientX, e.clientY, tr, path, label); });
        const w = () => { if (V && V.arec && X.playing()) writeAuto(tr, path, get()); };
        node.addEventListener('nbturn', w); node.addEventListener('change', () => setTimeout(w, 0));
        node.addEventListener('nbdone', () => { if (V && V.wr) delete V.wr[tr.uid + path]; });
    }
    X.autoable = autoable;
    function laneMenu(x, y, tr, path, label) {
        let a = lanesOf(tr).find(q => q.path === path), o = own(tr);
        menu(x, y, [{ head: label + ' · ' + (tr.isMaster ? 'MASTER' : tr.name) },
            [a ? 'show its lane' : '＋ a lane for it (alt+click does this too)', () => laneFor(tr, path)],
            [o.aonly === path ? 'show all the lanes again' : 'show only this lane', () => { o.aonly = o.aonly === path ? '' : path; laneFor(tr, path, true); }],
            [V.arec ? '◉ AUTO is on: turning it while it plays writes it (click = off)' : '○ write it while it plays (AUTO)', () => { V.arec = !V.arec; showArrBar(); X.flash(V.arec ? 'AUTO on. play, then turn any knob' : 'AUTO off'); }],
            '-',
            [a && a.pts.length ? 'clear its lane' : '(its lane is empty)', () => { if (!a) return; X.mark(); a.pts = []; X.touch(); arrSize(); }],
            [a ? 'bin its lane' : '(no lane yet)', () => { if (!a) return; X.mark(); let L0 = lanesOf(tr); L0.splice(L0.indexOf(a), 1); if (o.aonly === path) o.aonly = ''; X.touch(); arrSize(); }]]);
    }
    X.laneMenu = laneMenu;
    function writeAuto(tr, path, v) {
        let L = X.live(), b = L && L.pos(); if (b == null || !isFinite(v)) return;
        V.wr = V.wr || {}; let key = tr.uid + path, w = V.wr[key], L0 = lanesOf(tr), a = L0.find(q => q.path === path);
        if (!w || b < w.b - 0.01) { if (!w) X.mark(); w = V.wr[key] = { b, v: -1 }; }
        if (!a) { a = { path, pts: [] }; L0.push(a); own(tr).aopen = 1; arrSize(); }
        if (b - w.b < 1 / 32 && Math.abs(v - w.v) < 0.01 && w.v >= 0) return;
        a.pts = a.pts.filter(q => q[0] <= w.b + 1e-6 || q[0] > b + 1e-6 || q.mine);
        let pt = [Math.round(b * 1000) / 1000, Math.round(v * 1000) / 1000]; pt.mine = 1; a.pts.push(pt); a.pts.sort((m, n) => m[0] - n[0]);
        w.b = b; w.v = v; NB.touch(X.pr); X.apply(); V.dirty = true;
    }
    function lanePath(tr, path) {
        let s = path.split('.');
        if (s[0] === 'mix') return tr.isMaster ? X.pr.master.vol : tr.mix[s[1]];
        if (s[0] === 'snd') return tr.snd[s[1]];
        if (s[0] === 'send') return (tr.mix.to || {})[s[1]] || 0;
        if (s[0] === 'fx') { let P = tr.fx.find(q => q.uid === s[1]); return P ? P.p[s[2]] : 0.5; }
        return 0.5;
    }
    function drawArr() {
        let cv = V.q('.nb-arrcv'), w = V.aw, h = V.ah, d = V.dpr;
        if (!V.cache) { V.cache = document.createElement('canvas'); }
        let C = V.cache; if (C.width !== cv.width || C.height !== cv.height) { C.width = cv.width; C.height = cv.height; }
        let x = C.getContext('2d'), pr = X.pr, sig = pr.sig || 4, ink = tv('--ink') || '#eee', A = tv('--a') || '#ff2a6d', bg = tv('--bg') || '#0c090e';
        x.setTransform(d, 0, 0, d, 0, 0); x.fillStyle = bg; x.fillRect(0, 0, w, h);
        let b0 = Math.max(0, xb(HEADW)), b1 = xb(w), rows = V.rows;
        { let k0 = NB.barOf(pr, b0).bar, k1 = NB.barOf(pr, b1).bar + 1;
            for (let k = k0; k <= k1; k++) { let at = NB.barAt(pr, k), n = NB.barAt(pr, k + 1) - at; if (V.ppb >= 6 || k % 4 === 0) { x.fillStyle = k % 4 === 0 ? 'rgba(127,127,127,0.28)' : 'rgba(127,127,127,0.16)'; x.fillRect(Math.round(bx(at)), RULER, 1, h); }
                if (V.ppb >= 14) { x.fillStyle = 'rgba(127,127,127,0.06)'; for (let j = 1; j < n; j++) x.fillRect(Math.round(bx(at + j)), RULER, 1, h); } } }
        rows.forEach(r => {
            let y = ry(r); if (y > h || y + r.h < RULER) return;
            x.fillStyle = 'rgba(127,127,127,0.07)'; x.fillRect(HEADW, y + r.h - 1, w, 1);
            if (r.k === 't') {
                if (sel.tr === r.tr.uid) { x.fillStyle = 'rgba(127,127,127,0.06)'; x.fillRect(HEADW, y, w, r.h); }
                r.tr.clips.forEach(c => {
                    if (c.at + c.len < b0 || c.at > b1) return;
                    clipDraw(x, r.tr, c, bx(c.at), y + 3, c.len * V.ppb, r.h - 6, X.isPicked ? X.isPicked(c.uid) : sel.clip === c.uid);
                });
                if (r.tr.fz) { x.fillStyle = 'rgba(150,200,255,0.16)'; x.fillRect(HEADW, y, w - HEADW, r.h); x.fillStyle = '#cfe6ff'; x.globalAlpha = 0.8; x.font = 'bold 10px Courier New'; x.fillText(T('❄ frozen · it plays from the audio under it · ☀ unfreeze: right click its name'), Math.max(HEADW + 10, bx(Math.max.apply(null, r.tr.clips.map(c => c.at + c.len).concat(0))) + 14), y + r.h / 2 + 4); x.globalAlpha = 1; }
            } else if (r.k === 'a') laneDraw(x, r, y, w);
            else if (r.k === 'p') paceDraw(x, r, y, w, ink, A);
        });
        x.fillStyle = bg; x.fillRect(0, RULER, HEADW, h);
        rows.forEach(r => {
            let y = ry(r); if (y > h || y + r.h < RULER) return;
            x.save(); x.beginPath(); x.rect(0, Math.max(RULER, y), HEADW, r.h); x.clip();
            x.fillStyle = 'rgba(127,127,127,0.09)'; x.fillRect(0, y + r.h - 1, HEADW, 1);
            if (r.k === 't' || r.k === 'm') headDraw(x, r, y, ink, A);
            else if (r.k === 'p') paceHead(x, r, y, ink, A);
            else if (r.k === 'a') { x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(8, y, HEADW - 8, r.h); x.fillStyle = ink; x.globalAlpha = 0.8; x.font = '10px Courier New'; x.fillText(T('↳ ' + laneName(r.tr, r.a.path).slice(0, 17)), 12, y + 15); x.fillText('▾', 12, y + 30); x.globalAlpha = 0.6; x.fillText(T('✕'), HEADW - 16, y + 15); x.globalAlpha = 1; }
            else if (r.k === 'add') { x.fillStyle = ink; x.globalAlpha = 0.55; x.font = '10px Courier New'; x.fillText(T('＋ lane'), 14, y + 14); x.globalAlpha = 1; }
            else if (r.k === 'new') { x.strokeStyle = A; x.globalAlpha = 0.8; x.strokeRect(8.5, y + 8.5, HEADW - 17, 24); x.fillStyle = A; x.font = 'bold 11px Courier New'; x.fillText(T('＋ TRACK'), 18, y + 25); x.globalAlpha = 1; }
            x.restore();
        });
        x.fillStyle = 'rgba(127,127,127,0.25)'; x.fillRect(HEADW - 1, RULER, 1, h);
        if (V.cbox) { let b = V.cbox; x.strokeStyle = A; x.setLineDash([4, 3]); x.strokeRect(Math.min(b.x0, b.x1) + 0.5, Math.min(b.y0, b.y1) + 0.5, Math.abs(b.x1 - b.x0), Math.abs(b.y1 - b.y0)); x.setLineDash([]); x.fillStyle = A; x.globalAlpha = 0.07; x.fillRect(Math.min(b.x0, b.x1), Math.min(b.y0, b.y1), Math.abs(b.x1 - b.x0), Math.abs(b.y1 - b.y0)); x.globalAlpha = 1; }
        if (V.dropNew) { let nr = rows.find(r => r.k === 'new'), y = nr ? ry(nr) : RULER; x.fillStyle = A; x.globalAlpha = 0.16; x.fillRect(HEADW, y, w, 40); x.globalAlpha = 1; x.strokeStyle = A; x.setLineDash([5, 4]); x.strokeRect(HEADW + 2.5, y + 2.5, w - HEADW - 5, 35); x.setLineDash([]); x.fillStyle = A; x.font = 'bold 11px Courier New'; x.fillText(T('↓ let go here = a new track'), HEADW + 12, y + 24); }
        if (V.lbox) { let b = V.lbox; x.strokeStyle = '#ffe36d'; x.setLineDash([3, 3]); x.strokeRect(Math.min(b.x0, b.x1) + 0.5, Math.min(b.y0, b.y1) + 0.5, Math.abs(b.x1 - b.x0), Math.abs(b.y1 - b.y0)); x.setLineDash([]); x.fillStyle = 'rgba(255,227,109,0.06)'; x.fillRect(Math.min(b.x0, b.x1), Math.min(b.y0, b.y1), Math.abs(b.x1 - b.x0), Math.abs(b.y1 - b.y0)); }
        x.fillStyle = bg; x.fillRect(0, 0, w, RULER); { let pale = /^#[0-9a-f]{6}$/i.test(bg) && (parseInt(bg.slice(1, 3), 16) + parseInt(bg.slice(3, 5), 16) + parseInt(bg.slice(5, 7), 16)) > 450; x.fillStyle = pale ? 'rgba(60,20,30,0.07)' : 'rgba(0,0,0,0.4)'; x.fillRect(0, 0, w, RTOP); x.fillStyle = pale ? 'rgba(60,20,30,0.16)' : 'rgba(0,0,0,0.65)'; x.fillRect(0, RTOP, w, RULER - RTOP); }
        x.font = '10px Courier New'; x.fillStyle = ink;
        { let lab = V.ppb < 3 ? 16 : V.ppb < 8 ? 4 : 1, k0 = NB.barOf(pr, b0).bar, k1 = NB.barOf(pr, b1).bar + 1;
            for (let k = Math.floor(k0 / lab) * lab; k <= k1; k += lab) { let X0 = bx(NB.barAt(pr, k)); if (X0 < HEADW) continue; x.globalAlpha = 0.7; x.fillRect(Math.round(X0), 3, 1, 12); x.fillText(String(k + 1), X0 + 3, 12); } }
        x.globalAlpha = 1;
        rulerMarks(x, b0, b1, ink, A, bg);
        if (pr.loop.b > pr.loop.a) {
            let la = bx(pr.loop.a), lb = bx(pr.loop.b), on = pr.loop.on, y0 = RTOP + 2, hh = RULER - RTOP - 4;
            x.fillStyle = A; x.globalAlpha = on ? 0.38 : 0.12; x.fillRect(la, y0, lb - la, hh); x.globalAlpha = 1;
            x.strokeStyle = A; x.globalAlpha = on ? 1 : 0.5; if (!on) x.setLineDash([3, 3]); x.strokeRect(la + 0.5, y0 + 0.5, lb - la - 1, hh - 1); x.setLineDash([]);
            [la, lb].forEach((X0, k) => { x.fillStyle = A; x.fillRect(X0 - (k ? 5 : 0), y0 - 1, 5, hh + 2); x.fillStyle = '#000'; x.fillRect(X0 - (k ? 3 : -2), y0 + 4, 1, hh - 8); });
            if (lb - la > 60) { x.fillStyle = on ? '#fff' : ink; x.globalAlpha = on ? 0.95 : 0.5; x.font = 'bold 9px Courier New'; x.fillText('⟲ ' + barTxt(pr.loop.a) + ' → ' + barTxt(pr.loop.b) + (on ? '' : '  (off)'), la + 9, y0 + hh - 4); x.globalAlpha = 1; }
            if (on) { x.fillStyle = A; x.globalAlpha = 0.05; x.fillRect(la, RULER, lb - la, h); x.globalAlpha = 1; }
        }
        x.fillStyle = bg; x.fillRect(0, 0, HEADW, RULER); x.fillStyle = ink; x.globalAlpha = 0.6; x.font = '10px Courier New'; x.fillText(T(V.snap ? SNAPS.find(s => s[0] === V.snap)[1] + ' snap' : 'no snap') + ' · ' + T((n => n + (n === 1 ? ' bar' : ' bars'))(Math.round(NB.barOf(pr, NB.songEnd(pr) - 1e-6).bar + 1))), 8, 12); x.globalAlpha = 0.45; x.fillText(T('loop ⟶ drag here'), 8, RULER - 6); x.globalAlpha = 1;
        V.dirty = false;
    }
    function timeMoved() { if (L) L.retime(); X.apply(); if (V) { V.dirty = true; arrSize(); showPos(); } }
    function jumpTo(b, name) {
        V.cursor = Math.max(0, b); if (X.playing()) play(V.cursor); V.dirty = true; showPos();
        let vis = (V.aw - HEADW) / V.ppb, a = V.sc.scrollLeft / V.ppb; if (b < a || b > a + vis * 0.9) V.sc.scrollLeft = Math.max(0, (b - vis * 0.1) * V.ppb);
        if (name) X.flash('「' + name + '」');
    }
    function addGrave(b) {
        let pr = X.pr, at = Math.max(0, Math.round((V.snap ? snapB(b, Math.min(V.snap, 1)) : b) * 1000) / 1000);
        if (pr.marks.some(m => Math.abs(m.b - at) < 1e-6)) { X.flash('theres a marker there already'); return; }
        X.mark(); let m = { uid: NB.uid('m'), b: at, name: window.NBL && NBL.mode() === 'jp' ? barTxt(at) + '小節' : 'bar ' + barTxt(at) }; pr.marks.push(m); pr.marks.sort((a, c) => a.b - c.b); X.touch(); timeMoved(); showTop();
        if (!X.playing()) { let r = V.q('.nb-arrcv').getBoundingClientRect(); inline(r.left + clamp(bx(at), HEADW, V.aw - 150), r.top + 1, 140, m.name, v => { v = String(v || '').trim(); if (v) { m.name = v.slice(0, 24); X.touch(); showTop(); } }); }
        else X.flash('印 a marker at bar ' + barTxt(at));
    }
    function graves(px, py) {
        let pr = X.pr, here = X.playing() && L.pos() != null ? L.pos() : V.cursor, items = [{ head: '印 MARKERS' }];
        pr.marks.forEach(m => items.push(['→ ' + barTxt(m.b) + '  ' + m.name, () => jumpTo(m.b, m.name), { raw: 1 }]));
        if (!pr.marks.length) items.push(['none yet. put one where you are', () => addGrave(here)]);
        else items.push('-', ['＋ a marker at the cursor (b)', () => addGrave(here)]);
        menu(px, py, items);
    }
    function sigEdit(px, py, bar) {
        let pr = X.pr, cur = bar ? NB.barOf(pr, NB.barAt(pr, bar)).n : pr.sig;
        inline(px, py, 54, cur, v => { let n = parseInt(v, 10); if (!(n >= 1 && n <= 16)) { X.flash('a count is 1 to 16 beats a bar'); return; } X.mark();
            if (!bar) pr.sig = n; else { let ex = pr.sigs.find(g => g.bar === bar); if (ex) ex.n = n; else pr.sigs.push({ bar, n }); pr.sigs.sort((a, c) => a.bar - c.bar); }
            let prev = pr.sig; pr.sigs = pr.sigs.filter(g => { let keep = g.n !== prev; prev = g.n; return keep; });
            X.touch(); timeMoved(); showTop(); X.flash(n + '/4 from bar ' + (bar + 1)); });
    }
    function paceType(px, py, q) {
        let pr = X.pr; inline(px, py, 60, q ? q.bpm : pr.bpm, v => { let n = parseFloat(v); if (!isFinite(n)) return; n = Math.round(clamp(n, 20, 300) * 10) / 10; X.mark(); if (q) q.bpm = n; else pr.bpm = n; X.touch(); timeMoved(); showTop(); });
    }
    function paceAdd(b, v) {
        let pr = X.pr; b = Math.round(Math.max(0.25, b) * 1000) / 1000; if (pr.tempo.some(q => Math.abs(q.b - b) < 1e-6)) return null;
        let q = { b, bpm: Math.round(clamp(v != null ? v : NB.tempoAt(pr, b), 20, 300) * 10) / 10, r: 0 }; pr.tempo.push(q); pr.tempo.sort((a, c) => a.b - c.b); pr.popen = 1; return q;
    }
    function rulerMarks(x, b0, b1, ink, A, bg) {
        let pr = X.pr, w = V.aw; V.rmk = [];
        x.font = 'bold 9px Courier New';
        pr.sigs.forEach(q => { let X0 = bx(NB.barAt(pr, q.bar)); if (X0 < HEADW - 40 || X0 > w) return; x.font = '10px Courier New'; let x0 = X0 + 5 + x.measureText(String(q.bar + 1)).width; x.font = 'bold 9px Courier New'; let t = q.n + '/4', tw = x.measureText(t).width;
            if (x0 < HEADW) return; x.fillStyle = '#6dd3ff'; x.fillText(t, x0, 12); V.rmk.push({ k: 'sig', q, x0: X0 - 2, x1: x0 + tw + 2 }); });
        if (!pr.popen) pr.tempo.forEach(q => { let X0 = bx(q.b); if (X0 < HEADW || X0 > w) return; x.fillStyle = '#ffe36d'; x.beginPath(); x.moveTo(X0 - 4, 16); x.lineTo(X0 + 4, 16); x.lineTo(X0, 11); x.fill(); V.rmk.push({ k: 'pace', q, x0: X0 - 5, x1: X0 + 5 }); });
        pr.marks.forEach((m, i) => {
            let X0 = bx(m.b); if (X0 < HEADW - 120 || X0 > w) return; let nx = pr.marks[i + 1], room = nx ? bx(nx.b) - X0 - 14 : 140;
            if (X0 >= HEADW) { x.fillStyle = A; x.globalAlpha = 0.22; for (let y = RULER; y < V.ah; y += 6) x.fillRect(Math.round(X0), y, 1, 3); x.globalAlpha = 1; }
            x.save(); x.beginPath(); x.rect(HEADW, 0, w - HEADW, RTOP); x.clip();
            let nm = m.name, tw = Math.min(Math.max(0, room), x.measureText(nm).width); while (nm.length > 1 && x.measureText(nm).width > tw) nm = nm.slice(0, -1);
            x.fillStyle = bg; x.fillRect(X0 - 1, 1, 12 + tw, RTOP - 2);
            x.fillStyle = A; x.beginPath(); x.moveTo(X0, 15); x.lineTo(X0, 6); x.arc(X0 + 4, 6, 4, Math.PI, 0); x.lineTo(X0 + 8, 15); x.closePath(); x.fill();
            x.fillStyle = '#000'; x.fillRect(X0 + 3, 6, 2, 6); x.fillRect(X0 + 2, 8, 4, 1.5);
            if (tw > 6) { x.fillStyle = ink; x.fillText(nm, X0 + 11, 12); }
            x.restore(); V.rmk.push({ k: 'mark', m, x0: X0 - 3, x1: X0 + 12 + tw });
        });
    }
    function paceRange() { if (V.pRange) return V.pRange; let pr = X.pr, vs = [pr.bpm].concat(pr.tempo.map(q => q.bpm)), lo = Math.min.apply(0, vs), hi = Math.max.apply(0, vs), mid = (lo + hi) / 2, sp = Math.max(40, (hi - lo) * 1.35); return [mid - sp / 2, mid + sp / 2]; }
    const paceY = (r, y, v) => { let [lo, hi] = paceRange(); return y + 7 + (1 - (v - lo) / (hi - lo)) * (r.h - 16); };
    const paceV = (r, y, py) => { let [lo, hi] = paceRange(); return clamp(lo + (1 - (py - y - 7) / (r.h - 16)) * (hi - lo), 20, 300); };
    function paceDraw(x, r, y, w, ink, A) {
        let pr = X.pr, S = NB.tmap(pr).S, col = '#ffe36d', Y = v => paceY(r, y, v);
        x.fillStyle = 'rgba(0,0,0,0.22)'; x.fillRect(HEADW, y, w, r.h);
        x.save(); x.beginPath(); x.rect(HEADW, y, w - HEADW, r.h); x.clip();
        x.strokeStyle = col; x.lineWidth = 1.5; x.beginPath(); x.moveTo(bx(0), Y(S[0].v0));
        S.forEach(g => { let end = isFinite(g.b1) ? g.b1 : Math.max(g.b0, xb(w)) + 1; x.lineTo(bx(g.b0), Y(g.v0)); x.lineTo(bx(end), Y(g.v0 + g.k * (end - g.b0))); });
        x.stroke(); x.lineTo(w, y + r.h); x.lineTo(bx(0), y + r.h); x.fillStyle = col; x.globalAlpha = 0.1; x.fill(); x.globalAlpha = 1;
        x.font = '9px Courier New';
        [{ b: 0, bpm: pr.bpm, r: 0, start: 1 }].concat(pr.tempo).forEach(q => { let X0 = bx(q.b), Y0 = Y(q.bpm); if (X0 < HEADW - 8 || X0 > w + 8) return; let on = V.pSel === q || (q.start && V.pSel === 'start');
            x.fillStyle = on ? '#fff' : col; if (q.r) { x.beginPath(); x.arc(X0, Y0, on ? 4.5 : 3.5, 0, 7); x.fill(); } else x.fillRect(X0 - (on ? 4 : 3), Y0 - (on ? 4 : 3), on ? 8 : 6, on ? 8 : 6);
            x.fillStyle = ink; x.globalAlpha = 0.8; x.fillText(String(Math.round(q.bpm * 10) / 10), X0 + 6, Y0 < y + 16 ? Y0 + 11 : Y0 - 4); x.globalAlpha = 1; });
        x.restore();
    }
    function paceHead(x, r, y, ink, A) {
        let pr = X.pr, n = pr.tempo.length;
        x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(0, y, HEADW, r.h); x.fillStyle = '#ffe36d'; x.fillRect(0, y, 6, r.h);
        x.fillStyle = ink; x.font = 'bold 11px Courier New'; x.fillText(T('速 PACE'), 11, y + 15);
        x.globalAlpha = 0.6; x.font = '9px Courier New'; x.fillText(T(n ? n + (n === 1 ? ' change' : ' changes') : 'steady all the way'), 11, y + 28); x.fillText(T('click the line = a change'), 11, y + 40); x.globalAlpha = 0.6; x.fillText(T('✕'), HEADW - 16, y + 15); x.globalAlpha = 1;
    }
    function paceNear(h) { let pr = X.pr, r = h.row; if (Math.abs(bx(0) - h.x) < 7 && Math.abs(paceY(r, h.ry, pr.bpm) - h.y) < 8) return 'start'; return pr.tempo.find(q => Math.abs(bx(q.b) - h.x) < 7 && Math.abs(paceY(r, h.ry, q.bpm) - h.y) < 8) || null; }
    function paceMenu(px, py, h) {
        let pr = X.pr, q = paceNear(h), b = Math.max(0.25, snapB(h.b, V.snap || 1)), items;
        if (q === 'start') items = [{ head: '速 PACE · ' + pr.bpm + ' bpm' }, ['type the pace it starts at', () => paceType(px, py, null)]];
        else if (q) items = [{ head: '速 PACE · ' + q.bpm + ' bpm · bar ' + barTxt(q.b) }, [q.r ? 'jump to it on the beat instead' : 'glide into it from the one before', () => { X.mark(); q.r = q.r ? 0 : 1; X.touch(); timeMoved(); }, { on: !!q.r }],
            ['type the pace', () => paceType(px, py, q)], ['delete it', () => { X.mark(); pr.tempo.splice(pr.tempo.indexOf(q), 1); V.pSel = null; X.touch(); timeMoved(); }]];
        else items = [{ head: '速 PACE · bar ' + barTxt(b) }, ['＋ a change here', () => { X.mark(); paceAdd(b); X.touch(); timeMoved(); }]];
        items.push('-');
        if (pr.tempo.length) items.push(['clear every change (steady at the start pace)', () => { X.mark(); pr.tempo = []; V.pSel = null; X.touch(); timeMoved(); }]);
        items.push(['shut the 速 PACE line', () => { pr.popen = 0; X.save(); arrSize(); }]);
        menu(px, py, items);
    }
    function rulerMenu(px, py, h) {
        let pr = X.pr, b = Math.max(0, h.b), at = Math.max(0, snapB(b, V.snap || 1)), q = NB.barOf(pr, b), rm = h.rm, items = [{ head: '時 TIME · bar ' + barTxt(at) }];
        if (rm && rm.k === 'mark') { let m = rm.m; items = [{ head: '印 ' + m.name, raw: 1 }, ['rename it', () => inline(px, py, 140, m.name, v => { v = String(v || '').trim(); if (v) { X.mark(); m.name = v.slice(0, 24); X.touch(); showTop(); } })],
            ['move it to the cursor', () => { X.mark(); m.b = Math.max(0, V.cursor); pr.marks.sort((a, c) => a.b - c.b); X.touch(); timeMoved(); }], ['jump to it', () => jumpTo(m.b, m.name)],
            ['delete it', () => { X.mark(); pr.marks.splice(pr.marks.indexOf(m), 1); X.touch(); timeMoved(); showTop(); }], '-']; }
        if (rm && rm.k === 'sig') items.push(['change this count', () => sigEdit(px, py, rm.q.bar)], ['take this count change away', () => { X.mark(); pr.sigs.splice(pr.sigs.indexOf(rm.q), 1); X.touch(); timeMoved(); showTop(); }], '-');
        items.push(['＋ a marker here', () => addGrave(at)], ['change the count from bar ' + (q.bar + 1), () => sigEdit(px, py, q.bar)],
            ['＋ a pace change here', () => { X.mark(); paceAdd(Math.max(0.25, at)); X.touch(); timeMoved(); }], [pr.popen ? 'shut the 速 PACE line' : 'open the 速 PACE line', () => { pr.popen = pr.popen ? 0 : 1; X.save(); arrSize(); }]);
        if (pr.marks.length && !(rm && rm.k === 'mark')) { items.push('-'); pr.marks.forEach(m => items.push(['→ ' + barTxt(m.b) + '  ' + m.name, () => jumpTo(m.b, m.name), { raw: 1 }])); }
        menu(px, py, items);
    }
    function clipDraw(x, tr, c, X0, y, w, h, picked) {
        let col = c.col || tr.col;
        x.save(); x.beginPath(); x.rect(Math.max(HEADW, X0), y, w, h); x.clip();
        const rr = (X1, Y1, W1, H1, r) => { x.beginPath(); x.moveTo(X1 + r, Y1); x.arcTo(X1 + W1, Y1, X1 + W1, Y1 + H1, r); x.arcTo(X1 + W1, Y1 + H1, X1, Y1 + H1, r); x.arcTo(X1, Y1 + H1, X1, Y1, r); x.arcTo(X1, Y1, X1 + W1, Y1, r); x.closePath(); };
        let gr = x.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, col); gr.addColorStop(1, '#000');
        rr(X0, y, w, h, 4); x.fillStyle = gr; x.globalAlpha = 0.42; x.fill(); x.globalAlpha = 1;
        x.save(); x.clip(); x.fillStyle = col; x.globalAlpha = 0.95; x.fillRect(X0, y, w, 12); x.globalAlpha = 0.2; x.fillStyle = '#fff'; x.fillRect(X0, y, w, 1); x.restore();
        x.globalAlpha = 1; x.fillStyle = '#000'; x.font = 'bold 9px Courier New'; x.fillText(((c.mute ? '⊘ ' : '') + (c.lp > 0 ? '⟲ ' : '') + (c.rev ? '⇆ ' : '') + (c.takes && c.takes.length > 1 ? '[' + (c.takes.indexOf(c.src) + 1) + '/' + c.takes.length + '] ' : '') + (c.wm && c.wm.length ? '◆ ' : '') + (c.name || tr.name)).slice(0, Math.max(0, Math.floor(w / 6))), X0 + 4, y + 9);
        if (c.src && window.NBA) NBA.drawWave(x, X.pr, tr, c, y + 13, h - 15, bx, xb(HEADW), xb(V.aw), col);
        if (c.mute) { x.fillStyle = 'rgba(10,8,12,0.62)'; x.fillRect(X0, y + 12, w, h - 12); }
        let ns = c.notes; if (ns.length) {
            let lo = 1e3, hi = -1e3; ns.forEach(n => { lo = Math.min(lo, n.m); hi = Math.max(hi, n.m); });
            if (tr.inst === 'coffin') { lo = NB.KITROOT; hi = Math.max(NB.KITROOT + 7, hi); }
            let span = Math.max(4, hi - lo + 1), ih = h - 14, lp = c.lp > 0 ? c.lp : 0;
            x.fillStyle = '#fff'; x.globalAlpha = 0.85; x.shadowColor = col; x.shadowBlur = 4;
            const one = (n, b) => { if (b < c.at - 1e-6 || b >= c.at + c.len) return; let nx = bx(b), nw = Math.max(1.5, Math.min(n.d, c.at + c.len - b) * V.ppb - 1); x.fillRect(nx, y + 13 + ih - ((n.m - lo + 1) / span) * ih, nw, Math.max(1.5, ih / span - 0.5)); };
            if (lp) for (let k = Math.floor(c.off / lp); k < 2048; k++) { let base = c.at + k * lp - c.off; if (base >= c.at + c.len) break; if (base + lp < xb(HEADW)) continue; if (base > xb(V.aw)) break; ns.forEach(n => { if (n.t < lp) one(n, base + n.t); }); if (k > Math.floor(c.off / lp)) { x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(bx(base), y + 11, 1, h - 11); x.fillStyle = col; } }
            else ns.forEach(n => one(n, c.at + n.t - c.off));
            x.shadowBlur = 0; x.globalAlpha = 1;
        }
        x.restore();
        x.save(); x.beginPath(); x.rect(HEADW, y - 3, V.aw, h + 6); x.clip();
        rr(X0 + 0.5, y + 0.5, w - 1, h - 1, 4); x.strokeStyle = picked ? '#fff' : col; x.lineWidth = picked ? 1.6 : 1; if (picked) { x.shadowColor = '#fff'; x.shadowBlur = 8; } x.stroke(); x.shadowBlur = 0;
        x.restore();
    }
    function headDraw(x, r, y, ink, A) {
        let tr = r.tr, m = tr.mix, isM = r.k === 'm', on = sel.tr === tr.uid, auto = true;
        x.fillStyle = on ? 'rgba(127,127,127,0.13)' : 'rgba(0,0,0,0.18)'; x.fillRect(0, y, HEADW, r.h);
        let RT = X.route, bus = !isM && NB.isBus(tr), dp = !isM && RT ? Math.min(4, RT.depth(tr)) : 0, ind = dp * 3;
        if (dp) { let u = NB.outOf(X.pr, tr), bars = []; while (u && bars.length < dp) { let b = X.trk(u); if (!b) break; if (b.inst === 'cask') bars.unshift(b.col); u = NB.outOf(X.pr, b); } bars.forEach((c2, i) => { x.fillStyle = c2; x.globalAlpha = 0.75; x.fillRect(i * 3, y, 2, r.h); }); x.globalAlpha = 1; }
        x.fillStyle = tr.col; x.fillRect(ind, y, 6, r.h);
        if (bus) { x.fillStyle = 'rgba(0,0,0,0.28)'; x.fillRect(ind + 6, y, HEADW - ind - 6, r.h); x.strokeStyle = tr.col; x.globalAlpha = 0.5; x.setLineDash([2, 3]); x.strokeRect(ind + 6.5, y + 0.5, HEADW - ind - 8, r.h - 2); x.setLineDash([]); x.globalAlpha = 1; }
        let nx = 11 + ind + (tr.inst === 'cask' ? 11 : 0);
        if (tr.inst === 'cask') { x.fillStyle = tr.col; x.font = 'bold 11px Courier New'; x.fillText(tr.fold ? '▸' : '▾', 11 + ind, y + 15); }
        x.fillStyle = ink; x.font = 'bold 11px Courier New'; x.fillText((isM ? T('主 MASTER') : (tr.fz ? '❄ ' : '') + tr.name).slice(0, tr.inst === 'cask' ? 11 : 13 - Math.ceil(ind / 7)), nx, y + 15);
        if (!isM) {
            let v = NB.V[tr.inst], sub = v.jp + ' ' + v.en, nI = bus ? (tr.inst === 'cask' ? RT.inside(tr).length : RT.feeders(tr).length) : 0;
            if (!bus && tr.fx.length) sub += ' · ' + tr.fx.length + 'fx';
            x.globalAlpha = 0.55; x.font = '9px Courier New'; let tt = T(sub); x.fillText(tt, 11 + ind, y + 27);
            let to = RT && RT.into(tr), more = bus ? ' · ' + nI + (tr.fold ? ' shut' : ' in') : to ? ' ↳' + to.name : '';
            if (more) { let w0 = x.measureText(tt).width; x.fillStyle = to ? to.col : ink; x.globalAlpha = 0.8; x.fillText(more.slice(0, Math.max(0, Math.floor((104 - ind - w0) / 5.4))), 11 + ind + w0, y + 27); }
            x.globalAlpha = 1;
        }
        const bt = (bx0, by0, txt, lit, col) => { x.fillStyle = lit ? (col || A) : 'rgba(127,127,127,0.18)'; x.fillRect(bx0, by0, 16, 15); x.fillStyle = lit ? '#000' : ink; x.font = 'bold 9px Courier New'; x.fillText(txt, bx0 + 4, by0 + 11); };
        if (!isM) { bt(118, y + 4, 'M', m.mute, '#ff4a5a'); bt(136, y + 4, 'S', m.solo, '#ffe36d'); if (!bus) bt(118, y + 24, '●', (V.rec && on) || (window.NBA && NBA.armed(tr.uid)), '#ff2a3a'); }
        if (auto) bt(136, y + (isM ? 4 : 24), 'A', tr.isMaster ? X.pr.master.aopen : tr.aopen, '#6dd3ff');
        let vy = y + r.h - 9, vol = isM ? X.pr.master.vol : m.vol;
        x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(11, vy, 100, 5); x.fillStyle = tr.col; x.fillRect(11, vy, 100 * vol, 5);
        r.vy = vy;
    }
    function laneDraw(x, r, y, w) {
        let a = r.a, pts = a.pts, col = r.tr.col, top = y + 4, hh = r.h - 8;
        x.fillStyle = 'rgba(0,0,0,0.22)'; x.fillRect(HEADW, y, w, r.h);
        const Y = v => top + (1 - v) * hh;
        if (!pts.length) { x.strokeStyle = col; x.globalAlpha = 0.35; x.setLineDash([3, 4]); x.beginPath(); let v = lanePath(r.tr, a.path); x.moveTo(HEADW, Y(v)); x.lineTo(w, Y(v)); x.stroke(); x.setLineDash([]); x.globalAlpha = 1; return; }
        x.strokeStyle = col; x.lineWidth = 1.5; x.beginPath(); x.moveTo(HEADW, Y(pts[0][1]));
        pts.forEach(p => x.lineTo(bx(p[0]), Y(p[1]))); x.lineTo(w, Y(pts[pts.length - 1][1])); x.stroke();
        x.fillStyle = col; x.globalAlpha = 0.12; x.lineTo(w, top + hh); x.lineTo(HEADW, top + hh); x.fill(); x.globalAlpha = 1;
        let pk = V.lsel && V.lsel.get(a);
        pts.forEach(p => { let on = pk && pk.has(p); x.fillStyle = on ? '#ffe36d' : '#fff'; let s2 = on ? 7 : 5; x.fillRect(bx(p[0]) - s2 / 2, Y(p[1]) - s2 / 2, s2, s2); });
    }
    function ovSpan() { let tb = totalBeats(), vis = Math.max(1, (V.aw - HEADW) / V.ppb), a = V.sl / V.ppb; return { tb, a, b: a + vis, vis }; }
    function drawOv() {
        let box = V.q('[data-ov]'); if (!box) return; let z = X.csz ? X.csz(box) : [box.clientWidth, box.clientHeight]; if (!z) return; let cv = box.firstChild, w = Math.round(z[0]), h = Math.round(z[1]), d = V.dpr || 1;
        if (!w || !h) return;
        if (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); V.ovDirty = 1; }
        let playing = X.playing();
        V.ovN = (V.ovN || 0) + 1;
        if (!playing && !V.ovDirty && V.ovCur === V.cursor && V.ovN % 30) return;
        V.ovDirty = 0; V.ovCur = V.cursor;
        let x = cv.getContext('2d'), pr = X.pr, S = ovSpan(), k = w / S.tb, A = tv('--a') || '#ff2a6d';
        x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, w, h);
        let n = Math.max(1, pr.tracks.length), lh = Math.max(1.5, Math.min(5, (h - 4) / n)), y0 = Math.max(2, (h - lh * n) / 2);
        x.fillStyle = 'rgba(127,127,127,0.18)'; for (let q = 0, b = 0; b < S.tb && q < 4000; q += 4, b = NB.barAt(pr, q)) x.fillRect(Math.round(b * k), 0, 1, h);
        if (pr.loop && pr.loop.on) { x.fillStyle = 'rgba(127,127,127,0.12)'; x.fillRect(pr.loop.a * k, 0, (pr.loop.b - pr.loop.a) * k, h); }
        pr.tracks.forEach((tr, i) => { x.fillStyle = tr.col; x.globalAlpha = tr.mute ? 0.3 : 0.85; tr.clips.forEach(c => x.fillRect(c.at * k, y0 + i * lh, Math.max(1, c.len * k - 0.5), Math.max(1, lh - 0.6))); });
        x.globalAlpha = 1;
        let vx = S.a * k, vw = Math.max(6, S.vis * k);
        x.fillStyle = 'rgba(255,255,255,0.09)'; x.fillRect(vx, 0, vw, h);
        x.strokeStyle = A; x.lineWidth = 1.5; x.strokeRect(vx + 0.75, 0.75, vw - 1.5, h - 1.5);
        x.fillStyle = A; x.fillRect(vx, h / 2 - 5, 3, 10); x.fillRect(vx + vw - 3, h / 2 - 5, 3, 10);
        if (X.playing() && L && L.pos() != null) { x.fillStyle = '#fff'; x.fillRect(L.pos() * k, 0, 1, h); }
        else { x.fillStyle = 'rgba(127,127,127,0.8)'; x.fillRect(V.cursor * k, 0, 1, h); }
        let vb = V.q('[data-vsb]'), vk = V.st + '|' + pr.tracks.length + '|' + V.aw + '|' + h;
        if (vb && (V.vsbK !== vk || V.ovN % 30 === 0)) { V.vsbK = vk; let sc = V.sc, tot = sc.scrollHeight, see = sc.clientHeight, over = tot - see > 2; vb.classList.toggle('off', !over);
            if (over) { let th = vb.clientHeight, tk = Math.max(22, th * see / tot), ty = (th - tk) * (sc.scrollTop / Math.max(1, tot - see)), i = vb.firstChild; i.style.height = tk + 'px'; i.style.top = ty + 'px'; } }
    }
    function bindScroll() {
        let ov = V.q('[data-ov]'), sc = V.sc, act = null;
        const bAt = cx => { let r = ov.getBoundingClientRect(); return clamp((cx - r.left) / Math.max(1, r.width), 0, 1) * ovSpan().tb; };
        const setView = (a, vis) => { V.ppb = clamp((V.aw - HEADW) / Math.max(1, vis), 2, 160); arrSize(); sc.scrollLeft = Math.max(0, a * V.ppb); };
        drag(ov, p => {
            let S = ovSpan(), b = bAt(p.x), r = ov.getBoundingClientRect(), edge = 7 / r.width * S.tb;
            if (Math.abs(b - S.a) < edge) act = { k: 'l', S }; else if (Math.abs(b - S.b) < edge) act = { k: 'r', S };
            else { if (b < S.a || b > S.b) sc.scrollLeft = Math.max(0, (b - S.vis / 2) * V.ppb); act = { k: 'm', b0: b, a0: sc.scrollLeft / V.ppb }; }
            ov.classList.add('drag'); V.dragging = true;
        }, p => {
            if (!act) return; let b = bAt(p.x);
            if (act.k === 'm') sc.scrollLeft = Math.max(0, (act.a0 + b - act.b0) * V.ppb);
            else if (act.k === 'l') { let e = act.S.b, a = Math.min(b, e - 1); setView(a, e - a); }
            else { let a = act.S.a, e = Math.max(b, a + 1); setView(a, e - a); }
        }, () => { act = null; ov.classList.remove('drag'); V.dragging = false; });
        ov.addEventListener('dblclick', () => { V.ppb = clamp((V.aw - HEADW - 30) / NB.songEnd(X.pr), 2, 160); arrSize(); sc.scrollLeft = 0; });
        ov.addEventListener('wheel', e => { e.preventDefault(); if (e.ctrlKey || e.metaKey) { let S = ovSpan(), mid = (S.a + S.b) / 2, vis = S.vis * (e.deltaY < 0 ? 1 / 1.15 : 1.15); setView(Math.max(0, mid - vis / 2), vis); } else sc.scrollLeft += (e.deltaMode === 1 ? 30 : 1) * (e.deltaY + e.deltaX); }, { passive: false });
        let vb = V.q('[data-vsb]'), y0 = 0, t0 = 0;
        drag(vb, p => { let i = vb.firstChild, r = i.getBoundingClientRect(); if (p.y < r.top || p.y > r.bottom) { let vr = vb.getBoundingClientRect(); sc.scrollTop = (p.y - vr.top) / vr.height * sc.scrollHeight - sc.clientHeight / 2; } y0 = p.y; t0 = sc.scrollTop; vb.classList.add('drag'); },
            p => { let k = sc.scrollHeight / Math.max(1, vb.clientHeight); sc.scrollTop = t0 + (p.y - y0) * k; }, () => vb.classList.remove('drag'));
        let cv = V.q('.nb-arrcv');
        cv.addEventListener('mousedown', e => {
            if (e.button !== 1) return; e.preventDefault(); e.stopImmediatePropagation();
            let x0 = e.clientX, yy = e.clientY, l0 = sc.scrollLeft, tt = sc.scrollTop; cv.style.cursor = 'grabbing'; V.dragging = true;
            const m = ev => { sc.scrollLeft = l0 - (ev.clientX - x0); sc.scrollTop = tt - (ev.clientY - yy); };
            const u = () => { document.removeEventListener('mousemove', m); document.removeEventListener('mouseup', u); cv.style.cursor = ''; V.dragging = false; };
            document.addEventListener('mousemove', m); document.addEventListener('mouseup', u);
        }, { capture: true });
        cv.addEventListener('auxclick', e => { if (e.button === 1) e.preventDefault(); });
    }
    function frameArr() {
        let cv = V.q('.nb-arrcv'); if (!cv) return;
        if (V.dirty || !V.cache || V.scx !== V.sl || V.scy !== V.st) { V.scx = V.sl; V.scy = V.st; V.ovDirty = 1; drawArr(); }
        drawOv();
        let x = cv.getContext('2d'), d = V.dpr;
        // Crash fix
        if (!V.cache || !V.cache.width || !V.cache.height || !cv.width || !cv.height) return;
        x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(V.cache, 0, 0); x.setTransform(d, 0, 0, d, 0, 0);
        let cx = bx(V.cursor); if (cx >= HEADW) { x.fillStyle = 'rgba(127,127,127,0.6)'; x.fillRect(cx, 0, 1, V.ah); }
        if (X.playing() && L.pos() != null) {
            let p = L.pos(), px = bx(p);
            if (px >= HEADW) { x.shadowColor = '#fff'; x.shadowBlur = 8; x.fillStyle = '#fff'; x.fillRect(px, RULER, 1.5, V.ah); x.shadowBlur = 0; x.beginPath(); x.moveTo(px - 6, 0); x.lineTo(px + 7, 0); x.lineTo(px + 0.5, 9); x.fill(); }
            if (V.follow && !V.dragging && (px > V.aw - 40 || px < HEADW)) V.sc.scrollLeft = Math.max(0, p * V.ppb - (V.aw - HEADW) * 0.15);
        }
        if (L) V.rows.forEach(r => {
            if (r.k !== 't' && r.k !== 'm') return; let y = ry(r); if (y > V.ah || y + r.h < RULER) return;
            let lv = V.lv[r.tr.uid] || 0; x.fillStyle = '#000'; x.fillRect(156, y + 4, 6, r.h - 8); x.fillStyle = lv > 0.9 ? '#ff4a5a' : lv > 0.6 ? '#ffe36d' : '#6dffb0'; let mh = (r.h - 8) * lv; x.fillRect(156, y + r.h - 4 - mh, 6, mh);
        });
    }
    function hit(px, py) {
        let r = V.q('.nb-arrcv').getBoundingClientRect(), x = px - r.left, y = py - r.top, o = { x, y, b: xb(x) };
        if (y < RULER) {
            o.zone = x < HEADW ? 'corner' : y < RTOP ? 'ruler' : 'loop';
            if (o.zone === 'ruler') o.rm = (V.rmk || []).slice().reverse().find(q => x >= q.x0 && x <= q.x1) || null;
            if (o.zone === 'loop') { let L0 = X.pr.loop, la = bx(L0.a), lb = bx(L0.b); o.edge = L0.b > L0.a ? (Math.abs(x - la) < 7 ? 'a' : Math.abs(x - lb) < 7 ? 'b' : x > la && x < lb ? 'mid' : '') : ''; }
            return o;
        }
        let row = V.rows.find(rw => { let ty = ry(rw); return y >= ty && y < ty + rw.h; });
        o.row = row; o.ry = row ? ry(row) : 0;
        if (!row) { o.zone = 'none'; return o; }
        if (row.k === 'new') { o.zone = 'new'; return o; }
        if (x < HEADW) { o.zone = 'head'; return o; }
        if (row.k === 'p') { o.zone = 'pace'; return o; }
        if (row.k === 't') {
            let c = row.tr.clips.slice().reverse().find(c => o.b >= c.at && o.b < c.at + c.len && y > o.ry + 2 && y < o.ry + row.h - 2);
            if (c) { o.zone = 'clip'; o.clip = c; let X0 = bx(c.at), X1 = bx(c.at + c.len); o.edge = x - X0 < 6 && X1 - X0 > 18 ? 'l' : X1 - x < 7 ? 'r' : ''; return o; }
            o.zone = 'empty'; return o;
        }
        o.zone = row.k === 'a' ? 'lane' : row.k; return o;
    }
    function addTrack(inst) {
        let pr = X.pr;
        if (NB.V[inst].kind === 'bus') { if (pr.tracks.filter(t => t.inst === inst).length >= lim().bus) { X.flash(lim().bus + ' ' + (inst === 'cell' ? 'cells' : 'caskets') + ' is the most it can hold'); return null; } }
        else if (pr.tracks.filter(t => !NB.isBus(t)).length >= lim().tracks) { X.flash(lim().tracks + ' tracks is the most it can hold'); return null; }
        X.mark(); let t = NB.newTrack(pr, inst); pr.tracks.push(t); sel.tr = t.uid; sel.clip = null; X.touch(); arrSize(); showDock();
        return t;
    }
    function trackMenu(px, py) {
        menu(px, py, NB.BUSV.map(v => [v.jp + ' ' + v.en + '  · ' + T(v.sub).split(/[.。:：]/)[0], () => addTrack(v.id)]).concat(['-'], NB.VOICES.filter(v => has(v.part)).map(v => { let sb = v.sub.split(/[.:]/)[0].length > 40 ? '' : T(v.sub).split(/[.。:：]/)[0]; return [v.jp + ' ' + v.en + (sb ? '  · ' + sb : ''), () => addTrack(v.id)]; })));
    }
    X.addTrack = addTrack;
    function addClip(tr, at, len) {
        X.mark(); let c = NB.newClip(at, len); tr.clips.push(c); sel.tr = tr.uid; sel.clip = c.uid; sel.notes = new Set(); X.touch(); arrSize(); return c;
    }
    X.addClip = addClip;
    function dupClip(tr, c, at) { let cp = JSON.parse(JSON.stringify(c)); cp.uid = NB.uid('c'); cp.at = at != null ? at : c.at + c.len; tr.clips.push(cp); return cp; }
    function delClip(tr, c) { X.mark(); tr.clips.splice(tr.clips.indexOf(c), 1); if (sel.clip === c.uid) { sel.clip = null; sel.notes = new Set(); } X.touch(); showDock(); }
    function splitClip(tr, c, at) {
        if (at <= c.at + 0.01 || at >= c.at + c.len - 0.01) return;
        X.mark(); let cp = dupClip(tr, c, at), cut = at - c.at; cp.len = c.len - cut; cp.off = c.off + cut; c.len = cut; X.touch();
    }
    function clipMenu(px, py, tr, c) {
        menu(px, py, [
            ['rename', () => inline(px, py, 140, c.name || tr.name, v => { X.mark(); c.name = v; X.touch(); showDock(); })],
            { swatch: col => { X.mark(); c.col = col; X.touch(); } },
            ['duplicate (ctrl+d)', () => X.ed.dupe()],
            ['copy (ctrl+c)', () => X.ed.copy()], ['cut (ctrl+x)', () => X.ed.cut()],
            ['split at the cursor (ctrl+e)', () => X.ed.split()],
            ['chop into beats', () => X.ed.chop(1)], ['chop into bars', () => X.ed.chop(barLen(c.at))],
            ['stretch ×2 (longer)', () => X.ed.stretch(2)], ['stretch ÷2 (shorter)', () => X.ed.stretch(0.5)],
            ['bounce into audio', () => X.ed.toAudio('clips')],
            ...(stacked(c) ? [['⇅ top notes / bottom notes ▸', () => layerMenu(px, py, tr, c)]] : []),
            ...(c.takes && c.takes.length > 1 && window.NBA ? [['TAKES ▸ (' + (c.takes.indexOf(c.src) + 1) + ' of ' + c.takes.length + ')', () => menu(px, py, [{ head: 'TAKES · this bit plays' }].concat(c.takes.map((id, k) => ['take ' + (k + 1) + (NBA.pool.get(id) ? '' : ' (missing)'), () => NBA.useTake(c, id), { on: c.src === id }]), ['-', ['▶ hear this bit of each, one after the other', () => NBA.hearTakes && NBA.hearTakes(tr, c)]]))]] : []),
            ...(c.src && window.NBA ? [['⤫ crossfade into the next one ▸', () => menu(px, py, [{ head: '⤫ how long' }].concat([[0.0625, '1/16 beat'], [0.125, '1/8 beat'], [0.25, '1/4 beat'], [0.5, '1/2 beat'], [1, '1 beat']].map(([v, nm]) => [nm, () => NBA.xfade(tr, c, v)])))],
                ['⇶ slice into a kit (MAW, at the hits)', () => NBA.toKit(tr, c)]] : []),
            [c.mute ? 'unmute (0)' : 'mute (0)', () => { X.mark(); c.mute = c.mute ? 0 : 1; X.touch(); }],
            [c.lp > 0 ? 'repeat: on (click = off)' : 'repeat: off (click = on)', () => { X.mark(); c.lp = c.lp > 0 ? 0 : c.len; X.touch(); showDock(); }],
            ['set the loop marks round it', () => { X.pr.loop = { on: 1, a: c.at, b: c.at + c.len }; X.save(); V.dirty = true; showTop(); }],
            '-',
            ['delete (del)', () => delClip(tr, c)]
        ]);
    }
    const stacked = c => { if (!c.notes || c.notes.length < 2) return false; let at = {}; return c.notes.some(n => { let k = Math.round(n.t * 960); at[k] = (at[k] || 0) + 1; return at[k] > 1; }); };
    function layerOf(c, top) {
        let by = new Map(); c.notes.forEach(n => { let k = Math.round(n.t * 960), o = by.get(k); if (!o || (top ? n.m > o.m : n.m < o.m)) by.set(k, n); });
        return [...by.values()].sort((a, b) => a.t - b.t).map(n => JSON.parse(JSON.stringify(n)));
    }
    function layerMenu(px, py, tr, c) {
        const copyIt = top => { let nc = JSON.parse(JSON.stringify(c)); nc.notes = layerOf(c, top); V.clipBoard = { items: [{ tuid: tr.uid, kind: 'notes', inst: tr.inst, dt: 0, rel: 0, c: nc }], span: c.len }; X.flash((top ? 'the top notes' : 'the bottom notes') + ' copied. pick a track + ctrl+v'); };
        const toNew = (top, inst, oct) => { let ns = layerOf(c, top).map(n => Object.assign(n, { m: Math.max(0, Math.min(127, n.m + oct * 12)) })); if (!ns.length) return;
            let t = X.addTrack(inst); if (!t) return; let ts = X.pr.tracks; ts.splice(ts.indexOf(t), 1); ts.splice(ts.indexOf(tr) + 1, 0, t);
            let nc = NB.newClip(c.at, c.len); nc.lp = c.lp; nc.notes = ns; nc.name = (c.name || tr.name) + (top ? ' ⇡' : ' ⇣'); t.clips.push(nc); sel.tr = t.uid; sel.clip = nc.uid; X.touch(); arrSize(); showDock();
            X.flash((top ? 'the top notes' : 'the bottom notes') + ' → ' + t.name + (oct ? (oct > 0 ? ', an octave up' : ', an octave down') : '')); };
        let lead = has(NB.V.grit.part) ? 'grit' : tr.inst, bass = has(NB.V.sump.part) ? 'sump' : tr.inst;
        menu(px, py, [{ head: '⇅ one note at a time off the chords' },
            ['⇡ copy the top notes', () => copyIt(true)], ['⇣ copy the bottom notes', () => copyIt(false)], '-',
            ['⇡ top notes → a new track (same sound)', () => toNew(true, tr.inst, 0)],
            ['⇡ top notes → a new ' + NB.V[lead].en + ' track, an octave up (a lead)', () => toNew(true, lead, 1)],
            ['⇣ bottom notes → a new track (same sound)', () => toNew(false, tr.inst, 0)],
            ['⇣ bottom notes → a new ' + NB.V[bass].en + ' track, an octave down (a sub bass)', () => toNew(false, bass, -1)]]);
    }
    function headMenu(px, py, tr) {
        let i = X.pr.tracks.indexOf(tr), bus = NB.isBus(tr);
        menu(px, py, [
            ['rename', () => inline(px, py, 140, tr.name, v => { if (!v) return; X.mark(); tr.name = v; X.touch(); showDock(); })],
            { swatch: col => { X.mark(); tr.col = col; X.touch(); } }].concat(X.route ? X.route.menuItems(tr).concat(['-']) : [], bus ? [] : [
            ...(tr.fz || tr.ice ? [['☀ unfreeze (the original plays again)', () => X.ed.unfreeze(tr)]] : [['❄ freeze (bounced in place, its plugins rest, ☀ gets it back)', () => { X.pick(tr.uid, null); X.ed.toAudio('track', { freeze: 1 }); }]]),
            ['bounce into audio (in place)', () => { X.pick(tr.uid, null); X.ed.toAudio('track'); }]], [
            ['duplicate track', () => { if (bus ? X.pr.tracks.filter(t => t.inst === tr.inst).length >= lim().bus : X.pr.tracks.filter(t => !NB.isBus(t)).length >= lim().tracks) { X.flash('no room for another one'); return; } X.mark(); let cp = JSON.parse(X.json(tr)); cp.uid = NB.uid('t'); cp.name = tr.name + ' copy'; cp.clips.forEach(c => c.uid = NB.uid('c')); cp.fx.forEach(P => P.uid = NB.uid('f')); cp.auto = []; X.pr.tracks.splice(i + 1, 0, cp); X.touch(); arrSize(); }],
            ['move up', () => { if (i < 1) return; X.mark(); X.pr.tracks.splice(i - 1, 0, X.pr.tracks.splice(i, 1)[0]); X.touch(); arrSize(); }],
            ['move down', () => { if (i >= X.pr.tracks.length - 1) return; X.mark(); X.pr.tracks.splice(i + 1, 0, X.pr.tracks.splice(i, 1)[0]); X.touch(); arrSize(); }],
            ...(bus ? [] : [[tr.mix.key ? 'kick for ducking: yes' : 'kick for ducking: no', () => { X.mark(); tr.mix.key = tr.mix.key ? 0 : 1; X.touch(); }]]),
            '-',
            ['delete track', () => { X.mark(); if (bus && X.route) X.route.gone(tr); X.pr.tracks.splice(i, 1); if (sel.tr === tr.uid) { sel.tr = X.pr.tracks[0] ? X.pr.tracks[0].uid : 'master'; sel.clip = null; } X.touch(); arrSize(); showDock(); }]
        ]));
    }
    function lanePick(px, py, tr, a) {
        let items = [], last = '', got = new Set(tr.auto.map(q => q.path));
        if (!a && V.touched && V.touched.uid === tr.uid && !got.has(V.touched.path)) items.push(['＋ the one you just touched: ' + V.touched.label, () => laneFor(tr, V.touched.path)], '-');
        laneChoices(tr).forEach(([p, n]) => {
            let g = p.indexOf('mix.') === 0 ? 'MIXER' : p.indexOf('send.') === 0 ? 'SENDS' : p.indexOf('snd.') === 0 ? 'SOUND · ' + NB.V[tr.inst].en : 'PLUGIN · ' + n.split(' ')[0];
            if (g !== last) { items.push({ head: g }); last = g; }
            items.push([(got.has(p) && !(a && a.path === p) ? '✓ ' : '') + n, () => { X.mark(); if (a) { a.path = p; } else if (!got.has(p)) tr.auto.push({ path: p, pts: [] }); X.touch(); arrSize(); }, { on: a && a.path === p }]);
        });
        if (a) {
            items.push('-', ['clear this lane', () => { X.mark(); a.pts = []; X.touch(); arrSize(); }]);
            if (has('nb_arranger')) SHAPES.forEach(sh => items.push(['✋ ' + sh[0], () => { X.mark(); fillLane(a, sh); X.touch(); arrSize(); }]));
        }
        menu(px, py, items);
    }
    const SHAPES = [['sine, a bar', 4, 'smooth', u => 0.5 + 0.5 * Math.sin(u * 6.2832)], ['sine, a beat', 1, 'smooth', u => 0.5 + 0.5 * Math.sin(u * 6.2832)], ['triangle, a bar', 4, 'smooth', u => 1 - Math.abs(u * 2 - 1)],
        ['saw up, a bar', 4, 'saw', u => u], ['saw down, a bar', 4, 'saw', u => 1 - u], ['square, half a bar', 2, 'square'], ['square, an eighth', 0.5, 'square'],
        ['random steps, 1/4', 1, 'hold', k => Math.abs(Math.sin(k * 91.7 + 0.3)) % 1], ['random steps, 1/16', 0.25, 'hold', k => Math.abs(Math.sin(k * 37.3 + 1)) % 1],
        ['ramp up, the whole loop', 0, 'saw', u => u], ['ramp down, the whole loop', 0, 'saw', u => 1 - u]];
    function fillLane(a, sh) {
        let L0 = X.pr.loop, s = L0 && L0.b > L0.a ? L0.a : 0, e = L0 && L0.b > L0.a ? L0.b : NB.songEnd(X.pr), len = sh[1] || (e - s), kind = sh[2], fn = sh[3], pts = [], q = 0.001;
        for (let c = 0, b = s; b < e - 1e-6; c++, b += len) {
            let end = Math.min(e, b + len);
            if (kind === 'smooth') for (let i = 0; i < 16; i++) pts.push([b + len * i / 16, fn(i / 16)]);
            else if (kind === 'saw') pts.push([b, fn(0)], [end - q, fn((end - b) / len)]);
            else if (kind === 'square') pts.push([b, 1], [Math.min(end, b + len / 2) - q, 1], [Math.min(end, b + len / 2), 0], [end - q, 0]);
            else { let v = fn(c); pts.push([b, v], [end - q, v]); }
        }
        pts.push([e, pts.length ? pts[pts.length - 1][1] : 0.5]);
        a.pts = pts.filter(p => p[0] <= e + 1e-6).map(p => [Math.round(p[0] * 1000) / 1000, Math.max(0, Math.min(1, p[1]))]);
    }
    function bindArr() {
        let cv = V.q('.nb-arrcv'), sc = V.sc;
        let act = null;
        drag(cv, p => {
            let h = hit(p.x, p.y), pr = X.pr; act = null; V.focus = 'arr';
            if (h.zone === 'ruler' && h.rm) {
                if (h.rm.k === 'mark') { act = { k: 'grave', m: h.rm.m, b0: h.b, at: h.rm.m.b, moved: false }; V.dragging = true; return; }
                if (h.rm.k === 'pace') { pr.popen = 1; X.save(); arrSize(); return false; }
                if (h.rm.k === 'sig') { sigEdit(p.x, p.y, h.rm.q.bar); return false; }
            }
            if (h.zone === 'pace') return paceDown(h, p);
            if (h.zone === 'ruler') {
                let b = Math.max(0, snapB(h.b, V.snap || 0.25)); act = { k: 'ruler', b0: b, moved: false };
                return;
            }
            if (h.zone === 'loop') {
                X.mark(); let L0 = pr.loop;
                act = { k: 'loop', edge: h.edge || 'new', b0: Math.max(0, snapB(h.b, V.snap || 1)), a: L0.a, bb: L0.b, moved: false };
                V.dragging = true; return;
            }
            if (h.zone === 'head') return headDown(h, p);
            if (h.zone === 'new') { trackMenu(p.x, p.y); return false; }
            if (h.zone === 'add') { lanePick(p.x, p.y, h.row.tr, null); return false; }
            if (h.zone === 'lane') return laneDown(h, p);
            if (h.zone === 'clip') {
                let tr = h.row.tr, c = h.clip;
                if (p.shift && !h.edge) { X.pickToggle(tr, c); return false; }
                X.mark();
                let many = X.picked ? X.picked() : [];
                if (!h.edge && many.length > 1 && X.isPicked(c.uid)) {
                    if (p.alt) { let cps = many.map(o => ({ tr: o.tr, c: dupClip(o.tr, o.c, o.c.at) })); X.pickSet(cps); many = cps; }
                    act = { k: 'mmove', b0: h.b, items: many.map(o => ({ c: o.c, at: o.c.at })) }; V.dragging = true; return;
                }
                if (sel.clip !== c.uid) X.pick(tr.uid, c.uid); else if (sel.tr !== tr.uid) X.pick(tr.uid);
                if (p.alt && !h.edge) { c = dupClip(tr, c, c.at); sel.clip = c.uid; }
                // hold alt on the right edge to stretch instead of trim. like ableton
                act = { k: h.edge === 'l' ? 'trim' : h.edge === 'r' ? (p.alt ? 'stretch' : 'size') : 'move', tr, c, b0: h.b, at: c.at, len: c.len, off: c.off, row: h.row, orig: h.edge === 'r' && p.alt ? JSON.parse(JSON.stringify(c)) : null };
                V.dragging = true; return;
            }
            if (h.zone === 'empty' && p.ctrl) { act = { k: 'cbox', x0: h.x, y0: h.y, add: p.shift }; V.cbox = { x0: h.x, y0: h.y, x1: h.x, y1: h.y }; V.dirty = true; return; }
            if (h.zone === 'empty') {
                if (sel.tr !== h.row.tr.uid || sel.clip) X.pick(h.row.tr.uid, null);
                V.cursor = Math.max(0, snapB(h.b, V.snap || 1)); V.dirty = true; showPos();
                act = { k: 'empty', tr: h.row.tr, b: h.b, t0: Date.now() };
                return;
            }
            return false;
        }, p => {
            if (!act) return;
            let h = hit(p.x, p.y), s = p.shift ? 0 : V.snap;
            if (act.k === 'ruler') { let b = Math.max(0, snapB(h.b, V.snap || 0.25)); if (Math.abs(b - act.b0) > 0.01) act.moved = true; if (act.moved) { V.cursor = b; V.dirty = true; showPos(); } return; }
            if (act.k === 'grave') { if (!act.moved && Math.abs(h.b - act.b0) * V.ppb > 3) { act.moved = true; X.mark(); } if (act.moved) { act.m.b = Math.max(0, Math.round(snapB(act.at + h.b - act.b0, p.shift ? 0 : (V.snap || 1)) * 1000) / 1000); V.dirty = true; } return; }
            if (act.k === 'pace') {
                let pr = X.pr, q = act.q, v = Math.round(paceV(act.row, ry(act.row), h.y) * (p.alt ? 10 : 1)) / (p.alt ? 10 : 1);
                if (Math.abs(h.y - act.y0) > 2 || act.vy) { act.vy = 1; if (q) q.bpm = v; else pr.bpm = v; }
                if (q && (Math.abs(h.b - act.b0) * V.ppb > 3 || act.mx)) { act.mx = 1; let i = pr.tempo.indexOf(q), lo = i > 0 ? pr.tempo[i - 1].b + 0.0625 : 0.25, hi = i < pr.tempo.length - 1 ? pr.tempo[i + 1].b - 0.0625 : 1e9; q.b = Math.round(clamp(snapB(act.at + h.b - act.b0, p.shift ? 0 : (V.snap || 1)), lo, hi) * 1000) / 1000; }
                X.info('速 PACE · ' + (q ? q.bpm : pr.bpm) + ' bpm' + (q ? ' · bar ' + barTxt(q.b) : '')); if (L) L.retime(); X.apply(); V.dirty = true; showPos(); return;
            }
            if (act.k === 'loop') {
                let L0 = X.pr.loop, st = p.shift ? 0.25 : (V.snap || 1), b = Math.max(0, snapB(h.b, st)), d = snapB(h.b - act.b0, st);
                if (Math.abs(h.b - act.b0) * V.ppb > 3) act.moved = true; if (!act.moved) return;
                if (act.edge === 'a') { L0.a = Math.min(b, L0.b - st || L0.b - 0.25); }
                else if (act.edge === 'b') { L0.b = Math.max(b, L0.a + (st || 0.25)); }
                else if (act.edge === 'mid') { let len = act.bb - act.a; L0.a = Math.max(0, act.a + d); L0.b = L0.a + len; }
                else { L0.a = Math.min(act.b0, b); L0.b = Math.max(act.b0, b); if (L0.b - L0.a < (st || 0.25)) L0.b = L0.a + (st || 0.25); }
                L0.on = 1; V.dirty = true; return;
            }
            if (act.k === 'vol') { let v = clamp((h.x - 11) / 100, 0, 1); if (act.tr.isMaster) X.pr.master.vol = v; else act.tr.mix.vol = v; X.apply(); V.dirty = true; return; }
            if (act.k === 'lbox') { V.lbox = { x0: act.x0, y0: act.y0, x1: h.x, y1: h.y }; V.dirty = true; return; }
            if (act.k === 'cbox') { V.cbox = { x0: act.x0, y0: act.y0, x1: h.x, y1: h.y }; V.dirty = true; return; }
            if (act.k === 'mmove') { let lo = Math.min.apply(null, act.items.map(o => o.at)), db = snapB(h.b - act.b0, s); db = Math.max(-lo, db); act.items.forEach(o => { o.c.at = Math.round((o.at + db) * 1000) / 1000; }); NB.touch(X.pr); V.dirty = true; return; }
            if (act.k === 'pencil' || act.k === 'line') { laneTool(act, h, p); return; }
            if (act.k === 'lmove') {
                let db = snapB(h.b - act.b0, p.shift ? 0 : X.pr.grid), dv = -(h.y - act.y0) / act.hh;
                act.orig.forEach(([ln, list]) => { list.forEach(([q, b, v]) => { q[0] = Math.max(0, Math.round((b + db) * 1000) / 1000); q[1] = clamp(Math.round((v + dv) * 1000) / 1000, 0, 1); }); ln.pts.sort((m, n) => m[0] - n[0]); });
                NB.touch(X.pr); X.apply(); V.dirty = true; return;
            }
            if (act.k === 'pt') { let a = act.a, ly = act.row; a.pts[act.i] = [Math.max(0, snapB(h.b, p.shift ? 0 : X.pr.grid)), clamp(1 - (h.y - ry(ly) - 4) / (ly.h - 8), 0, 1)]; let keepPt = a.pts[act.i]; a.pts.sort((m, n) => m[0] - n[0]); act.i = a.pts.indexOf(keepPt); X.touch(); return; }
            let c = act.c; if (!c) return;
            let db = h.b - act.b0;
            if (act.k === 'move') {
                let at = Math.max(0, snapB(act.at + db, s)); c.at = at;
                const au = t => NB.V[t.inst] && NB.V[t.inst].kind === 'audio', ok = t => t && !t.isMaster && !NB.isBus(t) && au(t) === au(act.tr);
                let past = h.zone === 'new' || (h.zone === 'none' && V.rows.length && h.y > ry(V.rows[V.rows.length - 1]));
                if (V.dropNew !== past) { V.dropNew = past; V.dirty = true; }
                if (!past && h.row && h.row.k === 't' && h.row.tr !== act.tr && ok(h.row.tr)) { act.tr.clips.splice(act.tr.clips.indexOf(c), 1); h.row.tr.clips.push(c); act.tr = h.row.tr; sel.tr = act.tr.uid; }
            } else if (act.k === 'stretch') { let o = act.orig, f = Math.max(0.0625, (Math.max(act.at + (s || 0.25), snapB(act.at + act.len + db, s)) - act.at) / act.len); Object.assign(c, JSON.parse(JSON.stringify(o))); X.stretchClip(act.tr, c, f); X.info('stretch ×' + (Math.round(f * 100) / 100) + (NB.V[act.tr.inst].kind === 'audio' ? ' (the pitch moves with it. ⇔ ▾ = keep the pitch)' : '')); }
            else if (act.k === 'size') { let end = Math.max(act.at + (s || 0.25), snapB(act.at + act.len + db, s)); c.len = end - act.at; }
            else if (act.k === 'trim') { let at = clamp(snapB(act.at + db, s), act.at - act.off, act.at + act.len - (s || 0.25)); c.at = Math.max(0, at); c.len = act.len - (c.at - act.at); c.off = act.off + (c.at - act.at); }
            NB.touch(X.pr); V.dirty = true;
        }, p => {
            V.dragging = false;
            if (!act) return;
            if (act.k === 'ruler') { if (!act.moved) V.cursor = act.b0; if (X.playing()) play(V.cursor); V.dirty = true; showPos(); }
            if (act.k === 'grave') { if (act.moved) { X.pr.marks.sort((a, c) => a.b - c.b); X.touch(); timeMoved(); } else jumpTo(act.m.b, act.m.name); act = null; return; }
            if (act.k === 'pace') { V.pRange = null; X.touch(); timeMoved(); showTop(); act = null; return; }
            if (act.k === 'loop' && !act.moved) { if (act.edge === 'mid') { X.pr.loop.on = X.pr.loop.on ? 0 : 1; X.save(); V.dirty = true; showTop(); } act = null; return; }
            if (act.k === 'loop') { X.save(); V.dirty = true; showTop(); X.flash('loop ' + barTxt(X.pr.loop.a) + ' → ' + barTxt(X.pr.loop.b)); act = null; return; }
            if (act.k === 'empty' && Date.now() - (V.lastEmpty || 0) < 350 && Math.abs(act.b - (V.lastEmptyB || -9)) < 1) {
                if (window.NBA && NB.V[act.tr.inst].kind === 'audio') { NBA.pickFiles(act.tr, Math.max(0, snapB(act.b, V.snap || 1))); V.lastEmpty = 0; act = null; return; }
                if (NB.isBus(act.tr)) { X.flash(act.tr.name + ' has no notes of its own, it takes what pours in. put clips on the tracks in it'); V.lastEmpty = 0; act = null; return; }
                let at = barStart(act.b), c = addClip(act.tr, at, barLen(act.b)); setTab('roll'); X.flash('new clip. draw in it below'); V.lastEmpty = 0; return;
            }
            if (act.k === 'empty') { V.lastEmpty = Date.now(); V.lastEmptyB = act.b; }
            if (act.k === 'lbox') {
                let b = V.lbox; V.lbox = null;
                if (b) { let x0 = Math.min(b.x0, b.x1), x1 = Math.max(b.x0, b.x1), y0 = Math.min(b.y0, b.y1), y1 = Math.max(b.y0, b.y1);
                    V.rows.forEach(rw => { if (rw.k !== 'a') return; let ty = ry(rw), top = ty + 4, hh = rw.h - 8; if (ty + rw.h < y0 || ty > y1) return;
                        rw.a.pts.forEach(q => { let qx = bx(q[0]), qy = top + (1 - q[1]) * hh; if (qx >= x0 && qx <= x1 && qy >= y0 - 3 && qy <= y1 + 3) { if (!V.lsel.has(rw.a)) V.lsel.set(rw.a, new Set()); V.lsel.get(rw.a).add(q); } }); }); }
                let n = 0; (V.lsel || new Map()).forEach(st => { n += st.size; }); X.flash(n ? n + ' points picked · drag one = they all move · del = gone · ctrl+c / ctrl+v' : 'no points in there');
                V.dirty = true; act = null; return;
            }
            if (act.k === 'pencil' || act.k === 'line' || act.k === 'lmove') { X.touch(); V.dirty = true; act = null; return; }
            if (act.k === 'cbox') {
                let b = V.cbox; V.cbox = null; let got = act.add && X.picked ? X.picked() : [];
                if (b) { let x0 = Math.min(b.x0, b.x1), x1 = Math.max(b.x0, b.x1), y0 = Math.min(b.y0, b.y1), y1 = Math.max(b.y0, b.y1);
                    V.rows.forEach(rw => { if (rw.k !== 't') return; let ty = ry(rw); if (ty + rw.h < y0 || ty > y1) return; rw.tr.clips.forEach(c => { if (bx(c.at + c.len) >= x0 && bx(c.at) <= x1 && !got.some(o => o.c === c)) got.push({ tr: rw.tr, c }); }); }); }
                X.pickSet(got); X.flash(got.length ? got.length + ' clips picked · drag one = they all move · ctrl+c / ctrl+d / ctrl+e / del' : 'no clips in there'); showDock(); act = null; return;
            }
            if (act.k === 'mmove') { X.touch(); arrSize(); showDock(); act = null; return; }
            if (act.k === 'move' && V.dropNew) {
                V.dropNew = false; let au = NB.V[act.tr.inst].kind === 'audio', nt = X.addTrack(au ? 'audio' : act.tr.inst);
                if (nt) { act.tr.clips.splice(act.tr.clips.indexOf(act.c), 1); nt.clips.push(act.c); if (!au) nt.snd = JSON.parse(JSON.stringify(act.tr.snd)); X.pick(nt.uid, act.c.uid); X.flash('onto a new track'); }
            }
            V.dropNew = false;
            if (act.k === 'move' || act.k === 'size' || act.k === 'stretch' || act.k === 'trim' || act.k === 'pt' || act.k === 'vol' || act.k === 'ruler') { X.touch(); arrSize(); if (act.k !== 'ruler') showDock(); else showTop(); }
            act = null;
        });
        function paceDown(h, p) {
            let pr = X.pr, q = paceNear(h);
            V.pRange = paceRange(); X.mark();
            if (!q) { q = paceAdd(snapB(h.b, p.shift ? 0 : (V.snap || 1)), Math.round(paceV(h.row, h.ry, h.y))); if (!q) { V.pRange = null; return false; } timeMoved(); }
            V.pSel = q; let qq = q === 'start' ? null : q;
            act = { k: 'pace', q: qq, b0: h.b, at: qq ? qq.b : 0, y0: h.y, row: h.row }; V.dragging = true; V.dirty = true;
        }
        function headDown(h, p) {
            let r = h.row, tr = r.tr, y = h.y - h.ry, x = h.x;
            if (r.k === 'p') { if (x > HEADW - 22 && y < 20) { X.pr.popen = 0; X.save(); arrSize(); } return false; }
            if (r.k === 'a') { if (x > HEADW - 22 && y < 20) { X.mark(); tr.auto.splice(tr.auto.indexOf(r.a), 1); X.touch(); arrSize(); } else lanePick(p.x, p.y, tr, r.a); return false; }
            if (r.k === 'add') { lanePick(p.x, p.y, tr, null); return false; }
            if (r.k !== 't' && r.k !== 'm') return false;
            if (x >= 11 && x <= 111 && y >= r.h - 12) { X.mark(); act = { k: 'vol', tr }; return; }
            const inB = (bx0, by0) => x >= bx0 && x < bx0 + 16 && y >= by0 && y < by0 + 15;
            if (r.k === 't') {
                if (tr.inst === 'cask' && y < 20 && x >= 8 + Math.min(4, X.route ? X.route.depth(tr) : 0) * 3 && x < 22 + Math.min(4, X.route ? X.route.depth(tr) : 0) * 3) { X.route.fold(tr); return false; }
                if (inB(118, 4)) { X.mark(); tr.mix.mute = tr.mix.mute ? 0 : 1; X.touch(); return false; }
                if (inB(136, 4)) { X.mark(); tr.mix.solo = tr.mix.solo ? 0 : 1; X.touch(); return false; }
                if (inB(118, 24) && window.NBA && NB.V[tr.inst].kind === 'audio') { X.pick(tr.uid); if (NBA.armed(tr.uid)) { NBA.disarm(); showAll(); } else NBA.arm(tr); return false; }
                if (inB(118, 24) && NB.isBus(tr)) return false;
                if (inB(118, 24)) { X.pick(tr.uid); V.rec = !V.rec; if (V.rec) X.mark(); showTop(); V.dirty = true; return false; }
            }
            if (inB(136, r.k === 'm' ? 4 : 24)) {
                if (tr.isMaster) X.pr.master.aopen = X.pr.master.aopen ? 0 : 1; else tr.aopen = tr.aopen ? 0 : 1;
                if ((tr.isMaster ? X.pr.master.aopen : tr.aopen) && !tr.auto.length) tr.auto.push({ path: 'mix.vol', pts: [] });
                X.save(); arrSize(); return false;
            }
            X.pick(tr.uid, tr.isMaster ? null : (tr.clips.find(c => c.uid === sel.clip) ? sel.clip : null));
            if (Date.now() - (V.lastHead || 0) < 350 && V.lastHeadT === tr.uid && !tr.isMaster) { let rc = V.q('.nb-arrcv').getBoundingClientRect(); inline(rc.left + 10, rc.top + h.ry + 2, 104, tr.name, v => { if (!v) return; X.mark(); tr.name = v; X.touch(); showDock(); }); }
            V.lastHead = Date.now(); V.lastHeadT = tr.uid;
            return false;
        }
        function laneTool(act, h, p) {
            let r = act.row, a = act.a, top = ry(r) + 4, hh = r.h - 8, v = clamp(1 - (h.y - top) / hh, 0, 1), g = X.pr.grid / 2, b = Math.max(0, snapB(h.b, g));
            if (act.k === 'pencil') {
                let lo = act.last == null ? b : Math.min(act.last, b), hi = act.last == null ? b : Math.max(act.last, b);
                a.pts = a.pts.filter(q => !(q[0] > lo + 1e-6 && q[0] < hi - 1e-6) && Math.abs(q[0] - b) > 1e-6); a.pts.push([b, Math.round(v * 1000) / 1000]); a.pts.sort((m, n) => m[0] - n[0]); act.last = b;
            } else {
                let lo = Math.min(act.b0, b), hi = Math.max(act.b0, b);
                a.pts = act.keep.filter(q => q[0] < lo - 1e-6 || q[0] > hi + 1e-6).concat([[act.b0, Math.round(act.v0 * 1000) / 1000], [b, Math.round(v * 1000) / 1000]]); a.pts.sort((m, n) => m[0] - n[0] || 0);
            }
            NB.touch(X.pr); X.apply(); V.dirty = true;
        }
        function laneDown(h, p) {
            let r = h.row, a = r.a, top = h.ry + 4, hh = r.h - 8, Y = v => top + (1 - v) * hh;
            let i = a.pts.findIndex(q => Math.abs(bx(q[0]) - h.x) < 6 && Math.abs(Y(q[1]) - h.y) < 6);
            if (p.ctrl) { if (!p.shift || !V.lsel) V.lsel = new Map(); act = { k: 'lbox', x0: h.x, y0: h.y }; V.dirty = true; return; }
            if (p.shift && i < 0) { X.mark(); act = { k: 'pencil', a, row: r, last: null }; laneTool(act, h); return; }
            if (p.alt && i < 0) { X.mark(); act = { k: 'line', a, row: r, b0: Math.max(0, snapB(h.b, X.pr.grid)), v0: clamp(1 - (h.y - top) / hh, 0, 1), keep: a.pts.slice() }; return; }
            if (i >= 0 && V.lsel && V.lsel.get(a) && V.lsel.get(a).has(a.pts[i])) { X.mark(); act = { k: 'lmove', b0: h.b, y0: h.y, hh, orig: [...V.lsel].map(([ln, set]) => [ln, [...set].map(q => [q, q[0], q[1]])]) }; return; }
            if (V.lsel) { V.lsel = null; V.dirty = true; }
            X.mark();
            if (i < 0) { a.pts.push([Math.max(0, snapB(h.b, p.shift ? 0 : X.pr.grid)), clamp(1 - (h.y - top) / hh, 0, 1)]); a.pts.sort((m, n) => m[0] - n[0]); i = a.pts.findIndex(q => Math.abs(bx(q[0]) - h.x) < 8); X.touch(); }
            act = { k: 'pt', a, i: Math.max(0, i), row: r };
        }
        cv.addEventListener('contextmenu', e => {
            e.preventDefault(); let h = hit(e.clientX, e.clientY);
            if (h.zone === 'clip') { X.pick(h.row.tr.uid, h.clip.uid); clipMenu(e.clientX, e.clientY, h.row.tr, h.clip); }
            else if (h.zone === 'ruler' || h.zone === 'loop' || h.zone === 'corner') rulerMenu(e.clientX, e.clientY, h);
            else if (h.zone === 'pace') paceMenu(e.clientX, e.clientY, h);
            else if (h.zone === 'head' && h.row.k === 'p') menu(e.clientX, e.clientY, [{ head: '速 PACE' }, ['type the pace it starts at', () => paceType(e.clientX, e.clientY, null)], ['clear every change (steady at the start pace)', () => { X.mark(); X.pr.tempo = []; X.touch(); timeMoved(); }], ['shut the 速 PACE line', () => { X.pr.popen = 0; X.save(); arrSize(); }]]);
            else if (h.zone === 'head' && h.row.k === 't') headMenu(e.clientX, e.clientY, h.row.tr);
            else if (h.zone === 'head' && h.row.k === 'm') menu(e.clientX, e.clientY, [{ head: '主 MASTER' }, ['its plugins (RACK)', () => { X.pick('master'); setTab('rack'); }], ['its fader (MIXER)', () => setTab('mix')], ['its lanes on / off', () => { let o = X.pr.master; o.aopen = o.aopen ? 0 : 1; arrSize(); }]]);
            else if (h.zone === 'lane') {
                let r = h.row, a = r.a, top = h.ry + 4, hh = r.h - 8, i = a.pts.findIndex(q => Math.abs(bx(q[0]) - h.x) < 7 && Math.abs(top + (1 - q[1]) * hh - h.y) < 7);
                if (i >= 0) { X.mark(); a.pts.splice(i, 1); X.touch(); } else menu(e.clientX, e.clientY, [['clear this lane', () => { X.mark(); a.pts = []; X.touch(); }]]);
            } else if (h.zone === 'empty' || h.zone === 'new') trackMenu(e.clientX, e.clientY);
        });
        cv.addEventListener('dblclick', e => {
            let h = hit(e.clientX, e.clientY);
            if (h.zone === 'clip') setTab('roll');
            if (h.zone === 'pace') { let q = paceNear(h); if (q) paceType(e.clientX, e.clientY, q === 'start' ? null : q); }
        });
        cv.addEventListener('wheel', e => {
            e.preventDefault();
            if (e.ctrlKey || e.metaKey) {
                let r = cv.getBoundingClientRect(), mx = e.clientX - r.left, b = xb(mx);
                V.ppb = clamp(V.ppb * (e.deltaY < 0 ? 1.15 : 1 / 1.15), 2, 160); arrSize(); sc.scrollLeft = Math.max(0, b * V.ppb - (mx - HEADW));
            } else if (e.shiftKey || e.altKey) sc.scrollLeft += e.deltaY + e.deltaX;
            else {
                let r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, tall = sc.scrollHeight - sc.clientHeight > 2;
                let dy = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY, dx = e.deltaMode === 1 ? e.deltaX * 30 : e.deltaX;
                if (mx < HEADW && tall) sc.scrollTop += dy;
                else if (my < RULER || !tall) sc.scrollLeft += dy + dx;
                else { sc.scrollTop += dy; sc.scrollLeft += dx; }
            }
        }, { passive: false });
        const TIPS = { clip: 'clip · drag = move · edges = length / trim · alt+drag = copy · double click = open it · 0 = mute · ctrl+e = split at the cursor · right click = more',
            empty: 'click = the cursor · double click = a new clip (on an audio track: pick a sound) · drop sound files or anything from the browser here', head: 'the track · M mute · S solo · ● record (on audio: arm the mic) · A lanes · drag the bar = volume · double click = rename · right click = more',
            ruler: 'click = put the cursor here · drag = scrub · right click = a marker, the count, the pace', pace: 'click the line = a change · drag a dot = faster, slower, when (alt = in tenths) · double click = type it · right click = glide or jump', loop: 'drag = mark a loop · grab an end to stretch it · click the middle = on / off', lane: 'click = a point, drag it · shift+drag = paint · alt+drag = a straight line · ctrl+drag = pick points across lanes · right click = gone', new: '＋ TRACK', add: '＋ a lane for any knob', corner: '' };
        const RMT = { mark: 'a marker · click = jump here · drag = move it · right click = rename, delete', sig: 'where the count changes · click = change it · right click = take it away', pace: 'the pace changes here · click = open the 速 PACE line' };
        cv.addEventListener('mousemove', e => {
            if (V.dragging) return;
            let h = hit(e.clientX, e.clientY); X.info(h.rm ? RMT[h.rm.k] : TIPS[h.zone] || '');
            if (h.zone === 'lane') { let r = h.row, v = clamp(1 - (h.y - h.ry - 4) / (r.h - 8), 0, 1), at = r.a.pts.length ? NB.valAt(r.a.pts, h.b) : lanePath(r.tr, r.a.path); X.info(laneName(r.tr, r.a.path) + ' = ' + laneFmt(r.tr, r.a.path)(at == null ? 0.5 : at) + ' here · mouse at ' + laneFmt(r.tr, r.a.path)(v) + ' · ' + TIPS.lane); }
            cv.style.cursor = h.zone === 'clip' ? (h.edge ? 'ew-resize' : 'grab') : h.zone === 'ruler' ? (h.rm && h.rm.k === 'mark' ? 'grab' : 'pointer') : h.zone === 'pace' ? (paceNear(h) ? 'ns-resize' : 'crosshair') : h.zone === 'loop' ? (h.edge === 'a' || h.edge === 'b' ? 'ew-resize' : h.edge === 'mid' ? 'grab' : 'crosshair') : '';
        });
        sc.addEventListener('scroll', () => { V.dirty = true; });
        const ours = e => e.dataTransfer && [...e.dataTransfer.types].some(t => t === 'Files' || t === 'text/x-nb');
        cv.addEventListener('dragover', e => { if (ours(e)) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; V.q('[data-arr]').classList.add('nb-dragover'); } });
        cv.addEventListener('dragleave', () => { if (V) V.q('[data-arr]').classList.remove('nb-dragover'); });
        cv.addEventListener('drop', e => {
            V.q('[data-arr]').classList.remove('nb-dragover');
            if (!ours(e)) return; e.preventDefault();
            let h = hit(e.clientX, e.clientY), tr = h.row && (h.row.k === 't' || h.row.k === 'm') ? h.row.tr : null, at = Math.max(0, snapB(h.b || 0, V.snap || 1));
            let raw = e.dataTransfer.getData('text/x-nb');
            if (raw) { try { X.browseDrop(JSON.parse(raw), tr, at); } catch (er) {} return; }
            if (e.dataTransfer.files && e.dataTransfer.files.length && window.NBA) NBA.dropFiles(e.dataTransfer.files, tr && !tr.isMaster ? tr : null, at);
        });
        { let dk = V.q('[data-dock]');
          dk.addEventListener('dragover', e => { if (e.dataTransfer && [...e.dataTransfer.types].indexOf('text/x-nb') >= 0) { e.preventDefault(); dk.classList.add('nb-dragover'); } });
          dk.addEventListener('dragleave', () => dk.classList.remove('nb-dragover'));
          dk.addEventListener('drop', e => { dk.classList.remove('nb-dragover'); let raw = e.dataTransfer && e.dataTransfer.getData('text/x-nb'); if (!raw) return; e.preventDefault(); try { X.browseDrop(JSON.parse(raw), null, null); } catch (er) {} }); }
    }
    function showArrBar() {
        let box = V.q('[data-arrbar]'); box.innerHTML = '';
        box.appendChild(btn('＋ TRACK', 'sm', e => { let r = e.target.getBoundingClientRect(); trackMenu(r.left, r.bottom + 2); }));
        box.appendChild(el('span', 'nb-lab', 'SNAP')); box.appendChild(selBox(SNAPS.map(s => [s[0], s[1]]), V.snap, v => { V.snap = +v; V.dirty = true; }));
        box.appendChild(btn('－', 'sm', () => { V.ppb = clamp(V.ppb / 1.4, 2, 160); arrSize(); }, 'zoom out (ctrl + wheel)'));
        box.appendChild(btn('＋', 'sm', () => { V.ppb = clamp(V.ppb * 1.4, 2, 160); arrSize(); }, 'zoom in'));
        box.appendChild(btn('⬚', 'sm', () => { V.ppb = clamp((V.aw - HEADW - 30) / NB.songEnd(X.pr), 2, 160); arrSize(); V.sc.scrollLeft = 0; }, 'fit the whole song'));
        box.appendChild(btn('▤', 'sm' + (look.th ? ' on' : ''), () => { look.th = ((look.th || 0) + 1) % 3; X.saveLook(); arrSize(); showArrBar(); }, 'taller tracks (sound files read better big). click again for taller, then back'));
        box.appendChild(btn('▭', 'sm' + (look.height === 0 ? '' : ' on'), () => { look.height = look.height === 0 ? 1 : look.height === 1 ? 2 : 0; X.saveLook(); showAll(); size(); }, 'the picture: small under the browser, big over the timeline, or gone (click the picture itself to make it big + back)'));
        box.appendChild(btn(V.arec ? '◉ AUTO' : '○ AUTO', 'sm rec' + (V.arec ? ' on' : ''), () => { V.arec = !V.arec; showArrBar(); X.flash(V.arec ? 'AUTO on: play, then turn any knob and it gets written (alt+r)' : 'AUTO off'); }, 'AUTO: while it plays, any knob you turn gets written into its lane (alt+r)'));
        box.appendChild(btn('＋ LANE', 'sm', () => { let t = V.touched; if (!t) { X.flash('turn a knob first, then this gives it a lane (or alt+click any knob)'); return; } let tr = t.uid === 'master' ? X.master() : X.trk(t.uid); if (tr) laneFor(tr, t.path); }, 'a lane for the last knob you touched (alt+k). alt+click any knob does it too'));
        box.appendChild(btn('FOLLOW', 'sm' + (V.follow ? ' on' : ''), () => { V.follow = !V.follow; showArrBar(); }, 'the view chases the playhead'));
        box.appendChild(btn('⟲ CLIP', 'sm', () => { let sc = X.selClip(); if (!sc) { X.flash('pick a clip first'); return; } X.mark(); X.pr.loop = { on: 1, a: sc.c.at, b: sc.c.at + sc.c.len }; X.save(); V.dirty = true; showTop(); }, 'loop marks round the clip youve picked'));
        box.appendChild(btn('⟲ ALL', 'sm', () => { X.mark(); X.pr.loop = { on: 1, a: 0, b: NB.songEnd(X.pr) }; X.save(); V.dirty = true; showTop(); }, 'loop the whole song'));
        if (X.editBar) X.editBar(box);
    }

    const TABS = [['roll', '譜 ROLL'], ['sound', '器 SOUND'], ['rack', '架 RACK'], ['mix', '卓 MIXER'], ['meters', '計 METERS'], ['look', '映 LOOK'], ['out', '⇩ BOUNCE + FILES']];
    let tab = 'sound';
    function setTab(t) { tab = t; showTabs(); showDock(); }
    X.setTab = setTab; X.tab = () => tab;
    function showTabs() {
        let box = V.q('[data-tabs]'); box.innerHTML = '';
        TABS.forEach(([k, txt]) => { let b = el('button', 'nb-tab' + (tab === k && !look.dockOff ? ' on' : ''), txt); b.type = 'button'; b.onclick = () => { if (look.dockOff) { foldDock(false); if (tab === k) return; } setTab(k); }; box.appendChild(b); });
        let fb = el('button', 'nb-tab nb-fold', look.dockOff ? '▲ 開く SHOW' : '▼ 畳む HIDE'); fb.type = 'button'; fb.title = look.dockOff ? 'bring the panel back (ctrl+alt+l)' : 'fold the panel away, the timeline gets the lot (ctrl+alt+l)'; fb.onclick = () => foldDock(!look.dockOff); box.appendChild(fb);
        if (!look.dockOff) { let bb = el('button', 'nb-tab nb-fold nb-big' + (look.dockBig ? ' on' : ''), look.dockBig ? '⤡ 戻す SMALL' : '⤢ 広げる BIG'); bb.type = 'button'; bb.title = look.dockBig ? 'the panel back to its own size' : 'the panel takes nearly the whole box (the timeline shrinks to a strip). for the big instruments'; bb.onclick = () => bigDock(!look.dockBig); box.appendChild(bb); }
        let mn = V.q('.nb-main'); if (mn) { mn.classList.toggle('dockoff', !!look.dockOff); mn.classList.toggle('dockbig', !!look.dockBig && !look.dockOff); }
    }
    function bigDock(on) { if (on) look.dockBig = 1; else delete look.dockBig; X.saveLook(); showTabs(); showDock(); size(); }
    X.bigDock = bigDock;
    function foldDock(off) { look.dockOff = off ? 1 : 0; if (!off) delete look.dockOff; X.saveLook(); showTabs(); size(); }
    X.foldDock = foldDock;
    function showDock() {
        if (!V) return;
        let box = V.q('[data-dock]'); box.innerHTML = ''; V.dockMeters = [];
        let f = { roll: X.rollTab, sound: X.soundTab, rack: X.rackTab, mix: mixTab, meters: X.metersTab, look: lookTab, out: outTab }[tab];
        if (f) f(box); else box.appendChild(el('div', 'nb-hint', 'loading…'));
        let ft = (tab === 'roll' || tab === 'sound' || tab === 'rack') && X.selTr && X.selTr();
        if (ft && ft.fz) { let fr = el('div', 'nb-frost', '❄ ' + ft.name + ' is frozen: what you change here is not heard till it thaws (then ❄ freeze it again)'); fr.appendChild(btn('☀ UNFREEZE', 'sm', () => X.ed.unfreeze(ft))); box.insertBefore(fr, box.firstChild); }
    }
    X.showDock = showDock;
    function showAll() { if (!V) return; V.root.className = 'nb sk-' + look.skin; V.tv = null; showTop(); showArrBar(); arrSize(); showTabs(); showDock(); visButtons(); if (X.browse) X.browse(); V.q('[data-v]').className = 'nb-vis h' + look.height + (V.q('[data-v]').classList.contains('scope') ? ' scope' : '') + (fsEl() && fsEl() === V.q('[data-v]') ? ' fs' : ''); }
    X.showAll = showAll; X.arrSize = () => arrSize(); X.dirty = () => { if (V) V.dirty = true; };

    function sec(title, sub) { let s = el('div', 'nb-sec'), h = el('h4', '', title); if (sub) h.appendChild(el('small', '', sub)); s.appendChild(h); return s; }
    X.sec = sec;
    async function weigh() {
        if (X.playing()) stop();
        let pr = X.pr, list = pr.tracks.filter(t => !NB.isBus(t) && !t.fz && t.clips.length && has(NB.V[t.inst].part)); if (!list.length) { X.flash('nothing on any track to weigh yet'); return; }
        V.cost = {}; V.weighing = 1; showDock();
        for (const tr of list) { X.flash('⚖ weighing ' + tr.name + '…');
            let cp = JSON.parse(X.json(pr)), a = Math.min.apply(null, tr.clips.map(c => c.at)); cp._v = (pr._v || 0) + 1; cp.loop = { on: 1, a, b: a + Math.min(16, Math.max(4, Math.max.apply(null, tr.clips.map(c => c.at + c.len)) - a)) };
            try { await NB.bounce(cp, { what: 'loop', loops: 1, tail: 0, only: tr.uid }); let t0 = performance.now(), o = await NB.bounce(cp, { what: 'loop', loops: 1, tail: 0, only: tr.uid }); V.cost[tr.uid] = (performance.now() - t0) / 10 / Math.max(0.1, o.seconds); } catch (e) {} }
        V.weighing = 0; let top = list.slice().sort((p, q) => (V.cost[q.uid] || 0) - (V.cost[p.uid] || 0))[0]; showDock();
        X.flash('⚖ the heaviest is ' + top.name + ' (' + Math.round(V.cost[top.uid] || 0) + '% of a core). ❄ freeze it if it crackles');
    }
    function mixTab(box) {
        let wrap = el('div', 'nb-mix'), pr = X.pr;
        { let hr = el('div', 'nb-row'); hr.style.marginBottom = '6px';
            hr.appendChild(btn(V.weighing ? '⚖ WEIGHING…' : '⚖ WEIGH THE TRACKS', 'sm' + (V.cost ? ' on' : ''), () => { if (!V.weighing) weigh(); }, 'times each track on its own: which ones cost the computer the most. the heavy ones are the ones to ❄ freeze'));
            hr.appendChild(el('span', 'nb-lab', 'LIVE'));
            let ls = selBox([['interactive', 'TIGHT (playing in)'], ['balanced', 'EVEN'], ['playback', 'SAFE (heavy songs)']], LAT(), v => { try { localStorage.setItem('vmp_nb_lat', v); } catch (e) {} if (L) { stop(); L.close(); L = null; X.eng(); } X.flash('live sound: ' + { interactive: 'TIGHT, the keys answer quickest (it may crackle on a heavy song)', balanced: 'EVEN', playback: 'SAFE, more room to work, the keys answer a little later' }[v]); });
            ls.title = 'how much the sound card gets to work with live. TIGHT = the keys answer quickest, SAFE = room for a heavy song. bounces dont care'; hr.appendChild(ls); box.appendChild(hr); }
        const strip = (tr) => {
            let isM = tr.isMaster, m = tr.mix, c = el('div', 'nb-mc' + (sel.tr === tr.uid ? ' pk' : '') + (NB.isBus(tr) ? ' bus' : '') + (tr.fz ? ' fz' : '')), h = el('h4', '', isM ? '主 MASTER' : (tr.fz ? '❄ ' : '') + (NB.isBus(tr) ? NB.V[tr.inst].jp + ' ' : '') + tr.name);
            h.style.setProperty('--c', tr.col); h.onclick = () => X.pick(tr.uid); c.appendChild(h);
            if (V.cost && V.cost[tr.uid] != null) { let mx = Math.max.apply(null, Object.values(V.cost)), v = V.cost[tr.uid], cb = el('div', 'nb-cost'); cb.title = Math.round(v) + '% of a core, live';
                let i = el('i'); i.style.width = Math.max(3, v / Math.max(1, mx) * 100) + '%'; i.style.background = v >= mx - 1e-9 && mx > 8 ? '#ff4a5a' : v > 25 ? '#ffe36d' : '#6dffb0'; cb.appendChild(i); cb.appendChild(el('span', '', '⚖ ' + Math.round(v) + '%')); c.appendChild(cb); }
            let ins = el('div', 'nb-ins');
            tr.fx.forEach(P => { let d = NBFX.BY[P.type], it = el('div', NB.fxOK(P) ? '' : 'off', d.jp + ' ' + d.en); it.onclick = () => { X.pick(tr.uid); setTab('rack'); }; ins.appendChild(it); });
            let add = el('div', 'off', '＋ plugin'); add.onclick = () => { X.pick(tr.uid); setTab('rack'); }; ins.appendChild(add);
            c.appendChild(ins);
            let ks = el('div', 'nb-ks');
            const k = (lab, key, o) => { let kn = knob(lab, () => m[key], v => { m[key] = v; }, Object.assign({ cls: 'sm', turn: X.apply, start: X.mark, done: X.touch }, o)); autoable(kn, tr, 'mix.' + key, lab, () => m[key]); ks.appendChild(kn); };
            if (!isM) {
                k('PAN', 'pan', { def: 0.5, fmt: v => v < 0.48 ? 'L' + Math.round((0.5 - v) * 200) : v > 0.52 ? 'R' + Math.round((v - 0.5) * 200) : 'mid' });
                k('LOW CUT', 'lc', { def: 0, fmt: v => Math.round(10 * Math.pow(200, v)) + 'Hz' }); k('HIGH CUT', 'hc', { def: 1, fmt: v => { let f = 200 * Math.pow(110, v); return f >= 1000 ? (f / 1000).toFixed(1) + 'k' : Math.round(f) + ''; } });
                k('ROOM', 'room', { def: 0 }); k('ECHO', 'echo', { def: 0 });
                if (!m.key) k('DUCK', 'duck', { def: 0, tip: 'dips out of the way of every hit from a kick track' });
            }
            c.appendChild(ks);
            if (X.route) X.route.strip(c, tr);
            let fm = el('div', 'nb-fm'), mt = el('div', 'nb-vm2'); mt.appendChild(el('i'));
            { let fd = fader(() => isM ? pr.master.vol : m.vol, v => { if (isM) pr.master.vol = v; else m.vol = v; }, { def: isM ? 0.8 : 0.75, turn: () => { V.dirty = true; } }); autoable(fd, tr, 'mix.vol', 'VOLUME', () => isM ? pr.master.vol : m.vol); fm.appendChild(fd); }
            fm.appendChild(mt); c.appendChild(fm); V.dockMeters.push([tr.uid, mt]);
            if (!isM) {
                let r = el('div', 'nb-row');
                r.appendChild(btn('M', 'sm' + (m.mute ? ' on' : ''), () => { X.mark(); m.mute = m.mute ? 0 : 1; X.touch(); showDock(); }));
                r.appendChild(btn('S', 'sm' + (m.solo ? ' on' : ''), () => { X.mark(); m.solo = m.solo ? 0 : 1; X.touch(); showDock(); }));
                if (!NB.isBus(tr)) r.appendChild(btn('KICK', 'sm' + (m.key ? ' on' : ''), () => { X.mark(); m.key = m.key ? 0 : 1; X.touch(); showDock(); }, 'this track is a kick: anything with DUCK up gets out of its way'));
                if (!NB.isBus(tr) && (tr.fz || tr.ice || tr.clips.length)) r.appendChild(btn(tr.fz || tr.ice ? '☀' : '❄', 'sm' + (tr.fz || tr.ice ? ' on' : ''), () => { if (tr.fz || tr.ice) X.ed.unfreeze(tr); else { X.pick(tr.uid, null); X.ed.toAudio('track', { freeze: 1 }); } }, tr.fz || tr.ice ? 'UNFREEZE: the original plays again' : 'FREEZE: bounce it in place, its plugins rest (☀ gets it back)'));
                c.appendChild(r);
            }
            wrap.appendChild(c);
        };
        pr.tracks.forEach(strip); strip(X.master());
        box.appendChild(wrap);
        let S = pr.sends, secs = el('div', 'nb-secs'), s1 = sec('間 ROOM', 'what every ROOM knob sends to'), s2 = sec('木霊 ECHO', 'what every ECHO knob sends to');
        const sk = (s, lab, key, o) => { let ks = s.querySelector('.nb-ks') || s.appendChild(el('div', 'nb-ks')); ks.appendChild(knob(lab, () => S[key], v => { S[key] = v; }, Object.assign({ turn: X.apply, start: X.mark, done: X.touch }, o))); };
        sk(s1, 'SIZE', 'roomSize', { def: 0.5 }); sk(s1, 'DARK', 'roomDark', { def: 0.4 });
        sk(s2, 'TIME', 'echoTime', { def: 0.4, fmt: v => ['1/8', '3/16', '1/4', '3/8', '1/2'][Math.min(4, Math.floor(v * 5))] }); sk(s2, 'AGAIN', 'echoFb', { def: 0.4 }); sk(s2, 'TONE', 'echoTone', { def: 0.5 });
        secs.appendChild(s1); secs.appendChild(s2);
        let an = sec('主 OUT', 'what leaves the box'), cvs = el('canvas'); cvs.width = 300; cvs.height = 80; cvs.style.width = '300px'; cvs.style.height = '80px'; an.appendChild(cvs); V.spec = cvs;
        let rd = el('div', 'nb-lab'); rd.dataset.lvl = ''; an.appendChild(rd);
        secs.appendChild(an);
        box.appendChild(secs);
    }

    function lookReset(what) {
        let d = JSON.parse(LOOK0);
        syncAfter();
        if (what === 'after' || what === 'pic' || what === 'all') { let dd = aftDef(look._aid); AFTK.forEach(k => { look[k] = dd[k]; }); }
        if (what === 'all') look.after = {};
        if (what === 'cols' || what === 'all') { look.cols = d.cols; look.colA = d.colA; look.colB = d.colB; }
        if (what === 'pic' || what === 'all') { let cur = NBV.MODES[look.mode]; if (look.po && cur) look.po[cur.id] = {}; }
        if (what === 'all') { look.po = {}; look.cycle = d.cycle; }
        X.saveLook(); visButtons(); if (tab === 'look') showDock();
        X.flash({ after: 'the AFTER stuff is back to how it came', cols: 'colours back to the theme', pic: 'this picture is back to how it came', all: 'every picture back to how it came' }[what]);
    }
    X.lookReset = lookReset;
    function lookTab(box) {
        let secs = el('div', 'nb-secs');
        let m = sec('映 PICTURE', 'click one'), grid = el('div', 'nb-row');
        NBV.MODES.forEach((md, i) => { if (md.part && !has(md.part)) return; grid.appendChild(btn(md.jp + ' ' + md.en, 'sm' + (look.mode === i ? ' on' : ''), () => { look.mode = i; X.saveLook(); visButtons(); lookTab2(); })); });
        m.appendChild(grid);
        let cyc = el('div', 'nb-row'); cyc.style.marginTop = '6px';
        cyc.appendChild(el('span', 'nb-lab', 'CHANGE BY ITSELF')); cyc.appendChild(selBox([[0, 'never'], [4, 'every 4 bars'], [8, 'every 8 bars'], [16, 'every 16 bars']], look.cycle, v => { look.cycle = +v; X.saveLook(); }));
        cyc.appendChild(el('span', 'nb-lab', 'SIZE')); cyc.appendChild(selBox([[0, 'hidden'], [1, 'normal'], [2, 'big']], look.height, v => { look.height = +v; X.saveLook(); showAll(); setTimeout(size, 50); }));
        cyc.appendChild(el('span', 'nb-lab', 'PANEL')); cyc.appendChild(selBox(SKINS, look.skin, v => { look.skin = v; X.saveLook(); showAll(); }));
        { let all = btn('↺ ALL THE PICTURES BACK', 'sm'); all.onclick = sure(all, () => lookReset('all')); all.title = 'every picture setting, the AFTER knobs + the colours back to how they came (click twice). the panel + sizes stay yours'; cyc.appendChild(all); }
        m.appendChild(cyc); secs.appendChild(m);
        let cur = NBV.MODES[look.mode];
        if (cur && cur.opts && (!cur.part || has(cur.part))) {
            look.po = look.po || {}; let mine = look.po[cur.id] = look.po[cur.id] || {};
            const val = o => mine[o[0]] != null ? mine[o[0]] : o[2];
            let ps = sec(cur.jp + ' ' + cur.en, 'this picture only'), pr0 = el('div', 'nb-row'), pk = el('div', 'nb-ks');
            cur.opts.forEach(o => {
                if (o[3] === 'pick') { let lb = el('label', 'nb-pick'); lb.appendChild(el('span', 'nb-lab', o[1])); lb.appendChild(selBox(o[4].map((n, i) => [i, n[0] + ' ' + n[1]]), val(o), v => { mine[o[0]] = +v; X.saveLook(); })); pr0.appendChild(lb); }
                else if (o[3] === 'tog') pr0.appendChild(btn(o[1], 'sm' + (val(o) ? ' on' : ''), () => { mine[o[0]] = val(o) ? 0 : 1; X.saveLook(); lookTab2(); }));
                else pk.appendChild(knob(o[1], () => val(o), v => { mine[o[0]] = v; X.saveLook(); }, { def: o[2] }));
            });
            pr0.appendChild(btn('🎲 SHAKE', 'sm', () => { cur.opts.forEach(o => { mine[o[0]] = o[3] === 'pick' ? Math.floor(Math.random() * o[4].length) : o[3] === 'tog' ? (Math.random() < 0.3 ? 1 : 0) : Math.round(Math.random() * 100) / 100; }); X.saveLook(); lookTab2(); }, 'a random one. the picture changes as you click'));
            pr0.appendChild(btn('↺ RESET', 'sm', () => { look.po[cur.id] = {}; X.saveLook(); lookTab2(); }, 'this picture back to how it came'));
            ps.appendChild(pr0); ps.appendChild(pk); secs.appendChild(ps);
        }
        let fx = sec('後 AFTER', 'laid over ' + ((NBV.MODES[look.mode] || {}).en || 'this picture') + ' only, every picture keeps its own'), ks = el('div', 'nb-ks');
        syncAfter(); let AD = aftDef(look._aid);
        const k = (lab, key, o) => ks.appendChild(knob(lab, () => look[key], v => { look[key] = v; X.saveLook(); }, o || {}));
        k('TRAILS', 'trails', { def: AD.trails }); k('GLITCH', 'glitch', { def: AD.glitch }); k('SPLIT', 'split', { def: AD.split, tip: 'the colours pulling apart' });
        ks.appendChild(knob('KALEIDO', () => look.kal / 12, v => { look.kal = Math.round(v * 12) < 3 ? 0 : Math.round(v * 12); X.saveLook(); }, { steps: 13, fmt: v => Math.round(v * 12) < 3 ? 'off' : Math.round(v * 12) + ' ways', def: 0 }));
        k('GLOW', 'glow', { def: AD.glow, tip: 'the bloom. bright things bleed light' }); k('FLARE', 'flare', { def: AD.flare, tip: 'the long sideways streak off anything bright, harder on the kick' }); k('PUNCH', 'punch', { def: AD.punch, tip: 'the camera takes the kick' }); k('GRAIN', 'grain', { def: AD.grain }); k('SCAN', 'scan', { def: 0, tip: 'an old telly: lines and bent corners' });
        ks.appendChild(knob('HUE', () => (look.hue + 0.5) % 1, v => { look.hue = v - 0.5; X.saveLook(); }, { def: 0.5, fmt: v => Math.round((v - 0.5) * 360) + '°' }));
        k('SPEED', 'speed', { def: AD.speed, fmt: v => (0.25 + v * 1.5).toFixed(2) + '×' }); k('REACT', 'react', { def: AD.react, tip: 'how hard it jumps with the music' });
        fx.appendChild(ks);
        let gr = el('div', 'nb-row'); gr.style.marginTop = '6px';
        gr.appendChild(el('span', 'nb-lab', 'GRADE')); gr.appendChild(selBox([[0, 'none'], [1, 'bleach'], [2, 'neon'], [3, 'night'], [4, 'rot'], [5, 'blood'], [6, 'ghost']], look.grade || 0, v => { look.grade = +v; X.saveLook(); }));
        gr.appendChild(el('span', 'nb-lab', 'CUTS')); gr.appendChild(selBox([[0, 'never'], [16, 'every 4 bars'], [8, 'every 2 bars'], [4, 'every bar'], [2, 'every half bar'], [1, 'every beat']], look.cuts || 0, v => { look.cuts = +v; X.saveLook(); }));
        gr.appendChild(btn('↺ RESET', 'sm', () => lookReset('after'), 'every knob here back to how this picture came'));
        fx.appendChild(gr); secs.appendChild(fx);
        let cs = sec('色 COLOURS'), cr = el('div', 'nb-row');
        cr.appendChild(btn('the theme', 'sm' + (look.cols ? '' : ' on'), () => { look.cols = 0; X.saveLook(); lookTab2(); }));
        cr.appendChild(btn('my own', 'sm' + (look.cols ? ' on' : ''), () => { look.cols = 1; X.saveLook(); lookTab2(); }));
        ['colA', 'colB'].forEach(k2 => { let c = el('input', 'nb-col'); c.type = 'color'; c.value = look[k2]; c.oninput = () => { look[k2] = c.value; look.cols = 1; X.saveLook(); }; cr.appendChild(c); });
        cr.appendChild(btn('↺ RESET', 'sm', () => lookReset('cols'), 'back to the theme colours'));
        cs.appendChild(cr); secs.appendChild(cs);
        box.appendChild(secs);
        function lookTab2() { box.innerHTML = ''; lookTab(box); }
    }

    let out = { what: 'song', loops: 1, bits: 24, rate: 44100, tail: 2 };
    const fname = () => ((X.pr.name || 'untitled').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') || 'untitled') + '_' + X.pr.bpm + 'bpm_' + ROOTS[X.pr.root].replace('#', 's') + X.pr.scale;
    function dl(blob, name) { let u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 8000); }
    const b64u = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
    const unb64u = t => { let s = atob(t.replace(/-/g, '+').replace(/_/g, '/')), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
    async function squish(txt) {
        let u8 = new TextEncoder().encode(txt);
        if (!window.CompressionStream) return '0' + b64u(u8);
        return '1' + b64u(new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()));
    }
    async function unsquish(t) {
        let u8 = unb64u(t.slice(1));
        if (t[0] === '1') u8 = new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
        return new TextDecoder().decode(u8);
    }
    async function shareLink(out) {
        let pr = X.pr, mine = window.NBA && NBA.srcs ? NBA.srcs(pr).length : 0;
        let url = location.href.split('#')[0] + '#nb=' + await squish(X.json(pr)), ok = false;
        try { await navigator.clipboard.writeText(url); ok = true; } catch (e) {}
        if (out) { out.hidden = false; out.value = url; out.select(); }
        X.flash((ok ? '🔗 link copied' : '🔗 link is below, copy it') + ' · ' + (url.length / 1000).toFixed(1) + 'k long' + (mine ? ' · ' + mine + ' of ur own sounds stay behind, those bits go quiet' : ''));
    }
    async function openShared(t) {
        let d; try { d = JSON.parse(await unsquish(t)); } catch (e) { X.flash('that link is broken. bits missing off the end?'); return false; }
        if (!d || (d.v !== 3 && d.v !== 2)) { X.flash('that link isnt a noisebox song'); return false; }
        // keep whatever was open first so nothing gets lost
        if ((X.pr.tracks || []).some(tr => (tr.clips || []).length) && db.saves.length < 24) { db.saves.unshift({ name: 'before the link', at: Date.now(), pr: JSON.parse(X.json(X.pr)) }); X.save(); }
        X.mark(); if (X.playing()) stop(); swap(d); X.flash('opened a shared song' + (d.name ? ': ' + d.name : '') + '. ur old one is kept as "before the link"');
        return true;
    }
    let busy = false;
    function outTab(box) {
        let secs = el('div', 'nb-secs'), pr = X.pr;
        let b = sec('⇩ BOUNCE', 'a real .wav, exactly what you hear. drag it into whatever you make tracks in'), r1 = el('div', 'nb-row');
        r1.appendChild(el('span', 'nb-lab', 'WHAT')); r1.appendChild(selBox([['song', 'the whole song'], ['loop', 'the loop marks']], out.what, v => { out.what = v; outTab2(); }));
        if (out.what === 'loop') r1.appendChild(selBox([1, 2, 4, 8, 16].map(n => [n, '×' + n]), out.loops, v => { out.loops = +v; outTab2(); }));
        r1.appendChild(el('span', 'nb-lab', 'BITS')); r1.appendChild(selBox([[16, '16'], [24, '24']], out.bits, v => { out.bits = +v; }));
        r1.appendChild(el('span', 'nb-lab', 'RATE')); r1.appendChild(selBox([[44100, '44.1k'], [48000, '48k']], out.rate, v => { out.rate = +v; }));
        r1.appendChild(el('span', 'nb-lab', 'TAIL')); r1.appendChild(selBox([[0, 'none'], [1, '1s'], [2, '2s'], [4, '4s'], [8, '8s']], out.tail, v => { out.tail = +v; }));
        b.appendChild(r1);
        let [a0, a1] = NB.range(pr, out.what), secs0 = (NB.secAt(pr, a1) - NB.secAt(pr, a0)) * (out.what === 'loop' ? out.loops : 1);
        b.appendChild(el('div', 'nb-hint', 'about ' + (secs0 + out.tail).toFixed(1) + 's of sound · tail = room for the echo to die'));
        let rowB = el('div', 'nb-row');
        rowB.appendChild(btn('⇩ BOUNCE .WAV', '', () => bounceIt(false)));
        if (has('nb_stems')) rowB.appendChild(btn('⇩ STEMS .ZIP', '', () => bounceIt(true), 'every track as its own .wav, dry (no master), so they add back up'));
        rowB.appendChild(btn('⇩ .MID', '', () => dl(midiOut(), fname() + '.mid'), 'the notes as a midi file, one track each, for any other music program'));
        let st = el('span', 'nb-lab'); st.dataset.bst = ''; rowB.appendChild(st); b.appendChild(rowB); secs.appendChild(b);
        let f = sec('▣ FILES', 'kept in this browser. export it if it matters'), r3 = el('div', 'nb-row');
        let nm = el('input', 'nb-in'); nm.maxLength = 32; nm.value = pr.name || ''; nm.placeholder = 'untitled'; nm.oninput = () => { pr.name = nm.value; X.save(); }; r3.appendChild(nm);
        r3.appendChild(btn('KEEP', 'sm', () => {
            let n = (pr.name || 'untitled').trim() || 'untitled', i = db.saves.findIndex(s => s.name === n), item = { name: n, at: Date.now(), pr: JSON.parse(X.json(pr)) };
            if (i >= 0) db.saves[i] = item; else { if (db.saves.length >= 24) { X.flash('24 kept already. bin one'); return; } db.saves.unshift(item); }
            X.save(); outTab2(); X.flash('kept ' + n);
        }, 'keeps a copy under this name (it shows in the browser under IN PROGRESS)'));
        let nw = btn('NEW SONG', 'sm'); nw.onclick = sure(nw, () => { X.mark(); if (X.playing()) stop(); swap(NB.blankProject()); V.cursor = 0; }); nw.title = 'a blank one, whatever is open goes unless you kept it (click twice, undo works)'; r3.appendChild(nw);
        let wp = btn('WIPE', 'sm'); wp.title = 'clears everything in here: the open song, every kept one, the picture settings, undo (click twice). parts you own stay yours'; wp.onclick = sure(wp, () => { if (X.playing()) stop(); db.saves.length = 0; undo.length = 0; redo.length = 0; Object.keys(look).forEach(k => delete look[k]); Object.assign(look, JSON.parse(LOOK0), { mv: 4, after: {} }); X.saveLook(); swap(NB.blankProject()); V.cursor = 0; X.save(); X.flash('wiped. a clean noisebox'); }); r3.appendChild(wp);
        r3.appendChild(btn('EXPORT .noise', 'sm', async () => { let js = X.json(pr); if (window.NBA) { X.flash('packing the sounds in'); js = await NBA.pack(pr, js); } dl(new Blob([js], { type: 'application/json' }), fname() + '.noise'); }, 'the song in one file. any audio goes inside it too, so it can be big'));
        let fi = el('input'); fi.type = 'file'; fi.accept = '.noise,.json,.mid,.midi,application/json,audio/midi'; fi.style.display = 'none';
        fi.onchange = () => {
            let fl = fi.files && fi.files[0]; if (!fl) return;
            if (/\.midi?$/i.test(fl.name)) { fl.arrayBuffer().then(ab => { let n = midiIn(new Uint8Array(ab)); X.flash(n ? 'brought in ' + n + ' tracks of notes' : 'no notes in that one'); }).catch(() => X.flash('couldnt read that midi file')); return; }
            fl.text().then(async tx => { let d = JSON.parse(tx); if (!d || (d.v !== 3 && d.v !== 2)) throw 0; if (d.sounds) { if (window.NBA) await NBA.unpack(d.sounds); delete d.sounds; } X.mark(); if (X.playing()) stop(); swap(d); X.flash('opened ' + (d.name || fl.name)); }).catch(() => X.flash('thats not a noisebox file'));
        };
        r3.appendChild(fi); r3.appendChild(btn('IMPORT .noise / .mid', 'sm', () => fi.click()));
        f.appendChild(r3);
        let r4 = el('div', 'nb-row'), lk = el('input', 'nb-in nb-link'); lk.readOnly = true; lk.hidden = true; lk.style.cssText = 'flex: 1; min-width: 0; font-size: 10px;'; lk.onfocus = () => lk.select();
        r4.appendChild(btn('🔗 SHARE LINK', 'sm', () => shareLink(lk), 'the whole song in a link. anyone who opens it gets it in their noisebox')); r4.appendChild(lk); f.appendChild(r4);
        f.appendChild(el('div', 'nb-hint', 'links only carry the notes + built in sounds. anything u uploaded or recorded yourself stays behind + goes quiet for them. send the .noise for those'));
        let list = el('div', 'nb-saves');
        if (!db.saves.length) list.appendChild(el('div', 'nb-hint', 'nothing in progress yet. KEEP puts the open song here'));
        db.saves.forEach((s, i) => {
            let row = el('div', 'nb-sv'); row.appendChild(el('span', '', s.name + '  ·  ' + s.pr.bpm + 'bpm ' + ROOTS[s.pr.root] + ' ' + NB.scaleName(s.pr.scale) + '  ·  ' + ((s.pr.tracks || []).length) + ' tracks'));
            row.appendChild(btn('OPEN', 'sm', () => { X.mark(); if (X.playing()) stop(); swap(JSON.parse(JSON.stringify(s.pr))); X.flash('opened ' + s.name); }));
            let x = btn('✕', 'sm'); x.onclick = sure(x, () => { db.saves.splice(i, 1); X.save(); outTab2(); }); row.appendChild(x); list.appendChild(row);
        });
        f.appendChild(list); secs.appendChild(f); box.appendChild(secs);
        function outTab2() { box.innerHTML = ''; outTab(box); if (X.browse) X.browse(); }
    }
    async function bounceIt(stems, opt) {
        if (busy || (stems && !has('nb_stems'))) return null; busy = true;
        let o = Object.assign({}, out, opt || {}), stat = t => { let s = V && V.q('[data-bst]'); if (s) s.textContent = t; }, res = null;
        try {
            if (!X.pr.tracks.some(t => t.clips.some(c => c.notes.length || c.src))) { stat('theres nothing to bounce yet'); busy = false; return null; }
            if (!stems) {
                stat('bouncing…');
                let r = await NB.bounce(X.pr, { what: o.what, loops: o.loops, rate: o.rate, tail: o.tail }), blob = NB.wav(r.buf, o.bits);
                if (!o.quiet) dl(blob, fname() + '.wav');
                res = { blob, seconds: r.seconds, bytes: blob.size, peak: peakOf(r.buf) };
                stat('done ♡ ' + (blob.size / 1048576).toFixed(1) + 'MB');
            } else {
                let used = X.pr.tracks.filter(t => !t.fz && has(NB.V[t.inst].part) && t.clips.some(c => c.notes.length || c.src)), files = [];
                for (let k = 0; k < used.length; k++) {
                    stat('bouncing ' + used[k].name + ' (' + (k + 1) + '/' + used.length + ')');
                    let r = await NB.bounce(X.pr, { what: o.what, loops: o.loops, rate: o.rate, tail: o.tail, only: used[k].uid });
                    files.push({ name: fname() + '/' + String(k + 1).padStart(2, '0') + '_' + used[k].name.toLowerCase().replace(/[^\w]+/g, '_') + '.wav', blob: NB.wav(r.buf, o.bits) });
                }
                let z = await NB.zip(files);
                if (!o.quiet) dl(z, fname() + '_stems.zip');
                res = { blob: z, bytes: z.size, files: files.map(f => f.name) };
                stat('done ♡ ' + files.length + ' stems');
            }
        } catch (e) { stat('it broke: ' + (e && e.message || e)); console.warn('noisebox bounce', e); }
        busy = false; return res;
    }
    function peakOf(buf) { let m = 0; for (let c = 0; c < buf.numberOfChannels; c++) { let d = buf.getChannelData(c); for (let i = 0; i < d.length; i += 5) { let a = Math.abs(d[i]); if (a > m) m = a; } } return m; }
    const GM = [36, 38, 39, 42, 46, 37, 45, 56, 35, 40, 70, 54, 56, 76, 49, 69];
    function midiOut() {
        let pr = X.pr, PPQ = 480, chunks = [];
        const vlq = n => { let b = [n & 0x7f]; while ((n >>= 7)) b.unshift((n & 0x7f) | 0x80); return b; };
        const str = s => Array.from(new TextEncoder().encode(s));
        const chunk = (ev) => { let data = []; let last = 0; ev.sort((a, b) => a.t - b.t || a.o - b.o).forEach(e => { data.push(...vlq(e.t - last), ...e.b); last = e.t; }); data.push(0, 0xff, 0x2f, 0); return [0x4d, 0x54, 0x72, 0x6b, (data.length >>> 24) & 255, (data.length >>> 16) & 255, (data.length >>> 8) & 255, data.length & 255, ...data]; };
        let sig = pr.sig || 4, ev0 = [{ t: 0, o: 0, b: [0xff, 0x58, 4, sig, 2, 24, 8] }, { t: 0, o: 0, b: [0xff, 0x03, ...vlq(str(pr.name || 'noisebox').length), ...str(pr.name || 'noisebox')] }];
        const tempo = (b, v) => { let us = Math.round(60000000 / v); ev0.push({ t: Math.round(b * PPQ), o: 0, b: [0xff, 0x51, 3, (us >> 16) & 255, (us >> 8) & 255, us & 255] }); };
        NB.tmap(pr).S.forEach(g => { tempo(g.b0, g.v0); if (Math.abs(g.k) > 1e-12 && isFinite(g.b1)) for (let b = g.b0 + 0.25; b < g.b1 - 1e-6; b += 0.25) tempo(b, NB.tempoAt(pr, b)); });
        pr.sigs.forEach(g => ev0.push({ t: Math.round(NB.barAt(pr, g.bar) * PPQ), o: 0, b: [0xff, 0x58, 4, g.n, 2, 24, 8] }));
        chunks.push(chunk(ev0));
        let ch = 0;
        pr.tracks.forEach(tr => {
            if (NB.isBus(tr)) return;
            let drum = tr.inst === 'coffin', c = drum ? 9 : ch++ % 15 + (ch > 9 ? 1 : 0), ev = [{ t: 0, o: 0, b: [0xff, 0x03, ...vlq(str(tr.name).length), ...str(tr.name)] }];
            if (c === 9 && !drum) c = 10;
            NB.flat(pr, tr).forEach(e => {
                let m = drum ? (GM[e.n.m - NB.KITROOT] || e.n.m) : e.n.m, v = clamp(Math.round((e.n.v != null ? e.n.v : 0.8) * 127), 1, 127), r = Math.max(1, e.n.r || 1);
                for (let q = 0; q < r; q++) { let t0 = Math.round((e.b + q * e.d / r) * PPQ), t1 = Math.max(t0 + 1, Math.round((e.b + (q + 1) * e.d / r) * PPQ) - 1); ev.push({ t: t0, o: 1, b: [0x90 | c, m & 127, v] }, { t: t1, o: 0, b: [0x80 | c, m & 127, 0] }); }
            });
            chunks.push(chunk(ev));
        });
        let head = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, 0, chunks.length, (PPQ >> 8) & 255, PPQ & 255];
        return new Blob([new Uint8Array(head.concat(...chunks))], { type: 'audio/midi' });
    }
    function midiIn(u8) {
        let p = 0, rd = n => { let v = 0; for (let i = 0; i < n; i++) v = v * 256 + u8[p++]; return v; }, vlq = () => { let v = 0, b; do { b = u8[p++]; v = v * 128 + (b & 0x7f); } while (b & 0x80); return v; };
        if (String.fromCharCode(...u8.slice(0, 4)) !== 'MThd') return 0;
        p = 8; rd(2); let nt = rd(2), ppq = rd(2), made = 0, pr = X.pr, paces = [], counts = []; p = 14;
        X.mark();
        for (let k = 0; k < nt && p < u8.length; k++) {
            if (String.fromCharCode(...u8.slice(p, p + 4)) !== 'MTrk') break;
            p += 4; let len = rd(4), end = p + len, t = 0, run = 0, on = {}, chans = {}, name = '';
            while (p < end) {
                t += vlq(); let st = u8[p]; if (st & 0x80) { p++; run = st; } else st = run;
                let ty = st & 0xf0;
                if (st === 0xff) { let mt = u8[p++], l = vlq(); if (mt === 3) name = new TextDecoder().decode(u8.slice(p, p + l)); if (mt === 0x51 && l === 3 && !made) { let us = u8[p] * 65536 + u8[p + 1] * 256 + u8[p + 2]; if (us > 0) paces.push([t / ppq, clamp(Math.round(60e6 / us * 10) / 10, 20, 300)]); } if (mt === 0x58 && l >= 2 && !made) { let n = u8[p] * 4 / Math.pow(2, u8[p + 1]); if (n === Math.round(n) && n >= 1 && n <= 16) counts.push([t / ppq, n]); } p += l; continue; }
                if (st === 0xf0 || st === 0xf7) { p += vlq(); continue; }
                let a = u8[p++], b = ty === 0xc0 || ty === 0xd0 ? 0 : u8[p++];
                let ch = st & 15, key = ch * 128 + a;
                if (ty === 0x90 && b > 0) on[key] = { t, v: b };
                else if (ty === 0x80 || (ty === 0x90 && b === 0)) { let o = on[key]; if (o) { (chans[ch] = chans[ch] || []).push({ t: o.t / ppq, d: Math.max(0.05, (t - o.t) / ppq), m: a, v: o.v / 127 }); delete on[key]; } }
            }
            p = end;
            Object.keys(chans).forEach(chk => {
                let notes = chans[chk], drum = +chk === 9; if (!notes.length || pr.tracks.length >= lim().tracks) return;
                let avg = notes.reduce((a, n) => a + n.m, 0) / notes.length;
                let tr = NB.newTrack(pr, drum ? 'coffin' : avg < 48 ? 'sump' : 'grit'); if (name) tr.name = name.slice(0, 20);
                if (drum) notes.forEach(n => { n.m = NB.KITROOT + (GMK[n.m] != null ? GMK[n.m] : ((n.m - NB.KITROOT) % 16 + 16) % 16); });
                let e = Math.max.apply(0, notes.map(n => n.t + n.d)), cl = Math.ceil(e / pr.sig) * pr.sig || pr.sig, c = NB.newClip(0, cl); c.lp = 0; c.notes = notes; tr.clips.push(c);
                pr.tracks.push(tr); made++;
            });
        }
        if (paces.length) { paces.sort((a, b) => a[0] - b[0]); let p0 = paces.filter(q => q[0] < 1e-6).pop(); if (p0) pr.bpm = p0[1]; let last = pr.bpm; pr.tempo = []; paces.forEach(([b, v]) => { if (b < 1e-6 || Math.abs(v - last) < 0.05) return; pr.tempo = pr.tempo.filter(q => Math.abs(q.b - b) > 1e-6); pr.tempo.push({ b: Math.round(b * 1000) / 1000, bpm: v, r: 0 }); last = v; }); }
        if (counts.length) { counts.sort((a, b) => a[0] - b[0]); let c0 = counts.filter(q => q[0] < 1e-6).pop(); if (c0) pr.sig = c0[1]; pr.sigs = []; counts.forEach(([b, n]) => { if (b < 1e-6) return; let q = NB.barOf(pr, b); if (Math.abs(q.at - b) > 1e-3 || q.n === n) return; pr.sigs.push({ bar: q.bar, n }); }); }
        if (made) { X.touch(); timeMoved(); showAll(); }
        return made;
    }

    function hexRgb(h) { let m = /^#([0-9a-f]{6})$/i.exec(h || ''); if (!m) return [1, 0, 0.6]; let n = parseInt(m[1], 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
    function themeRGB() {
        let cs = getComputedStyle(V.root), get = k => cs.getPropertyValue(k).trim();
        const rgb = c => { if (/^#/.test(c)) return hexRgb(c.length === 4 ? '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3] : c); let m = /rgba?\(([^)]+)\)/.exec(c); return m ? m[1].split(',').slice(0, 3).map(v => +v / 255) : [1, 0, 0.6]; };
        let a = get('--a') || '#ff2a6d', b = get('--b') || '#ff8ac8';
        return { a: rgb(a), b: rgb(b), css: a, css2: b };
    }
    function visButtons() {
        if (!V) return;
        let box = V.q('[data-vm]'); box.innerHTML = '';
        NBV.MODES.forEach((m, i) => {
            if (m.part && !has(m.part)) return;
            let b = el('button', i === look.mode ? 'on' : '', window.NBL && NBL.mode() === 'en' ? m.en : m.jp); b.type = 'button'; b.title = m.en;
            b.onclick = () => { look.mode = i; X.saveLook(); visButtons(); if (tab === 'look') showDock(); };
            box.appendChild(b);
        });
        V.q('[data-lo]').classList.toggle('on', !!V.lo); V.still = 0;
    }
    function size() {
        if (!V) return;
        let v = V.q('[data-v]'), fs = fsEl() === v, r = v.getBoundingClientRect(), k = ((low() || V.lo) ? 0.3 : 0.62) * V.k;
        v.classList.toggle('fs', fs); if (fs) k *= 0.75;
        let w = Math.max(64, Math.round(r.width * k)), h = Math.max(32, Math.round(r.height * k));
        [V.cg, V.c2].forEach(c => { if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } });
        V.still = 0; { let tb = V.q('[data-top]'); if (tb && tb.clientWidth !== V.topW) topFit(); } arrSize();
    }
    function frame(now) {
        if (!V) return;
        V.raf = requestAnimationFrame(frame);
        let win = V.win;
        if (!win.isConnected) { close(); return; }
        if ((win.classList.contains('is-min') && !V.pw) || document.hidden) return;
        let dtr = Math.min(0.25, (now - (V.last || now)) / 1000), dt = Math.min(0.05, dtr); V.last = now;
        let s = V.s, bins = V.bins, R = L && L.R, react = 0.4 + look.react * 1.2;
        if (R) {
            R.M.an.getByteFrequencyData(V.raw);
            for (let i = 0; i < 128; i++) { let f0 = Math.floor(Math.pow(i / 128, 2) * 700) + 1, f1 = Math.max(f0 + 1, Math.floor(Math.pow((i + 1) / 128, 2) * 700) + 1), m = 0; for (let j = f0; j < f1; j++) m = Math.max(m, V.raw[j]); bins[i] = m; }
            let an = R.M.an, d0 = an.minDecibels, dr = an.maxDecibels - d0, band = (a, b) => { let m = 0; for (let i = a; i < b; i++) m += Math.pow(10, (d0 + bins[i] / 255 * dr) / 20); return m / (b - a); }, AG = V.ag || (V.ag = { b: 0.01, m: 0.01, h: 0.01, low: 0, at: 0 });
            const agc = (k, v) => { AG[k] = Math.max(v, AG[k] * Math.pow(0.995, dtr * 60), 0.002); return Math.min(1, Math.pow(v / AG[k], 0.8) * react); };
            let lb = band(0, 10), ct = L.ctx.currentTime;
            s.bass += (agc('b', lb) - s.bass) * 0.45; s.mid += (agc('m', band(10, 50)) - s.mid) * 0.35; s.high += (agc('h', band(50, 128)) - s.high) * 0.35;
            bands(R, dtr, react, ct);
            while (R.kicks.length && R.kicks[0] <= ct) { R.kicks.shift(); s.kick = Math.min(1, react); AG.at = ct; }
            let lo = band(0, 5), rise = lo / Math.max(1e-4, AG.low); AG.low = AG.low * 0.6 + lo * 0.4;
            if (rise > 1.6 && lo > AG.b * 0.35 && ct - AG.at > 0.14) { s.kick = Math.max(s.kick, Math.min(1, react * Math.min(1, (rise - 1) * 0.8))); AG.at = ct; }
            while (L.ev.length && L.ev[0].t <= ct) { let e = L.ev.shift(); V.hit[e.uid] = 1; }
            if (L.ev.length > 4000) L.ev.splice(0, L.ev.length - 400);
            if (R.kicks.length > 500) R.kicks.splice(0, R.kicks.length - 50);
            meters(R);
            if (X.playing() && look.cycle) { let p = L.pos(), bar = Math.floor(p / (X.pr.sig * look.cycle)); if (V.cyc !== bar) { if (V.cyc != null) nextMode(); V.cyc = bar; } }
        } else { s.bass *= 0.95; s.mid *= 0.95; s.high *= 0.95; for (let i = 0; i < 128; i++) bins[i] *= 0.92; ['bA', 'bB', 'hit'].forEach(k => { if (s[k]) for (let i = 0; i < 4; i++) s[k][i] *= 0.93; }); }
        frameArr(); showPos(); if (X.rollFrame && tab === 'roll') X.rollFrame(); if (X.rackFrame && (tab === 'rack' || tab === 'sound')) X.rackFrame();
        s.kick = Math.max(0, s.kick - dtr * 3.2);
        { let ve = V.vEl || (V.vEl = V.q('[data-v]')); if ((look.height === 0 && !V.pw && fsEl() !== ve) || !ve.isConnected) return; }
        let quiet = calm();
        // nothing playing = the visualiser just drifts. 30fps is loads for that
        // dont go off the gaps between these, it thought my pc was dying + went blurry
        let realDt = dt;
        if (!quiet && !X.playing()) { if (now - (V.visT || 0) < 30) return; dt = Math.min(0.1, (now - (V.visT || now)) / 1000); V.visT = now; } else V.visT = now;
        if (quiet) { if (V.still) return; s.kick = 0; s.t = 12; s.trav = 3; V.still = 1; }
        else {
            let sp = 0.25 + look.speed * 1.5; s.t += dt * sp; s.trav += dt * sp * (0.25 + s.bass * 0.6 + s.kick * 0.9); s.flash = Math.max(0, (s.flash || 0) - dt * 5);
            if (look.cuts && X.playing() && L) { let beats = look.cuts === 1 || look.cuts === 2 ? look.cuts : look.cuts / 4 * X.pr.sig, n = Math.floor((L.pos() || 0) / beats + 1e-6); if (V.cutN !== n) { if (V.cutN != null) { let r = Math.sin(n * 91.7) * 43758.5; r -= Math.floor(r); s.trav += 2 + r * 7; s.t += 3 + r * 11; s.flash = 0.6; } V.cutN = n; } }
        }
        if (look._aid !== modeId()) syncAfter();
        let th = V.theme; s.cA = look.cols ? hexRgb(look.colA) : th.a; s.cB = look.cols ? hexRgb(look.colB) : th.b;
        let m = NBV.MODES[look.mode], useGL = V.vis && m && m.src && (!m.part || has(m.part)) && V.vis.ok(look.mode);
        let drew = useGL && V.vis.draw(look.mode, s, bins, look);
        V.q('[data-v]').classList.toggle('scope', !drew);
        if (drew) {
            V.ft = V.ft ? V.ft * 0.95 + realDt * 0.05 : realDt;
            if (++V.fn % 20 === 0) { let k0 = V.k; if (V.ft > 0.03 && V.k > 0.3) V.k = Math.max(0.3, V.k * 0.7); else if (V.ft < 0.019 && V.k < 1) V.k = Math.min(1, V.k * 1.1); if (V.k !== k0) size(); }
        } else { if (R) R.M.an.getFloatTimeDomainData(V.td); V.vis.scope(s, R ? V.td : null, bins, look.cols ? look.colA : th.css, quiet); }
        if (V.np && X.playing()) { let jp = window.NBL && NBL.mode() === 'jp', sc = NB.SCALES[X.pr.scale]; V.np.dataset.nolang = 1; V.np.textContent = (X.pr.name || T('untitled')) + '  ' + X.pr.bpm + 'bpm  ' + ROOTS[X.pr.root] + ' ' + (jp && sc ? sc.jp : NB.scaleName(X.pr.scale)) + '  ' + NBV.MODES[look.mode].en; }
        else if (V.np) V.np.textContent = '';
    }
    // so quiet songs still make the pictures move
    const BANDS = [[1, 3], [3, 7], [7, 19], [19, 56], [56, 140], [140, 372], [372, 744]];
    function bands(R, dtr, react, ct) {
        let s = V.s, an = R.M.an, raw = V.raw, d0 = an.minDecibels, dr = an.maxDecibels - d0, B = V.bnd || (V.bnd = { agc: new Float32Array(8).fill(1e-3), sm: new Float32Array(8), prev: new Float32Array(8), avg: new Float32Array(8), lv: 0, sw: 0, at: [0, 0, 0] });
        if (!s.bA) { s.bA = [0, 0, 0, 0]; s.bB = [0, 0, 0, 0]; s.hit = [0, 0, 0, 0]; }
        const dec = Math.pow(0.996, dtr * 60), e = new Float32Array(8);
        for (let k = 0; k < 7; k++) { let [a, b] = BANDS[k], m = 0; for (let i = a; i < b; i++) m += Math.pow(10, (d0 + raw[i] / 255 * dr) / 10); e[k] = Math.sqrt(m / (b - a)); }
        e[7] = Math.sqrt((e[0] * e[0] + e[1] * e[1] * 2 + e[2] * e[2] * 2 + e[3] * e[3] * 2 + e[4] * e[4] + e[5] * e[5] + e[6] * e[6] * 0.5) / 9.5);
        for (let k = 0; k < 8; k++) {
            B.agc[k] = Math.max(e[k], B.agc[k] * dec, 2e-4);
            let v = Math.min(1, Math.pow(e[k] / B.agc[k], k >= 5 && k < 7 ? 0.9 : 1.25) * react), up = v > B.sm[k] ? 0.6 : 0.16;
            B.sm[k] += (v - B.sm[k]) * Math.min(1, up * dtr * 60);
        }
        for (let k = 0; k < 4; k++) s.bA[k] = B.sm[k];
        for (let k = 0; k < 3; k++) s.bB[k] = B.sm[k + 4];
        s.bB[3] = B.sm[7];
        const jump = (k, w) => { let r = e[k] / Math.max(1e-5, B.avg[k]); B.avg[k] = B.avg[k] * (1 - w) + e[k] * w; return r; };
        let jk = jump(1, 0.25), js = Math.max(jump(2, 0.2), jump(3, 0.2)), jh = Math.max(jump(5, 0.3), jump(6, 0.3));
        jump(0, 0.2); jump(4, 0.2); jump(7, 0.1);
        if (jk > 1.7 && B.sm[1] > 0.35 && ct - B.at[0] > 0.12) { s.kick = Math.max(s.kick, Math.min(1, react * Math.min(1, (jk - 1) * 0.7))); B.at[0] = ct; }
        if (js > 1.5 && (B.sm[2] + B.sm[3]) > 0.6 && ct - B.at[1] > 0.1) { s.hit[1] = Math.min(1, react * Math.min(1, (js - 1) * 0.8)); B.at[1] = ct; }
        if (jh > 1.4 && (B.sm[5] + B.sm[6]) > 0.16 && ct - B.at[2] > 0.05) { s.hit[2] = Math.min(1, react * Math.min(1, (jh - 1) * 0.9)); B.at[2] = ct; }
        s.hit[0] = s.kick; s.hit[1] = Math.max(0, s.hit[1] - dtr * 4.5); s.hit[2] = Math.max(0, s.hit[2] - dtr * 9);
        B.sw += (B.sm[7] - B.sw) * Math.min(1, dtr * 0.6); s.hit[3] = B.sw;
    }
    function nextMode() { let n = NBV.MODES.length - 1; for (let k = 1; k <= n; k++) { let i = (look.mode + k) % n, m = NBV.MODES[i]; if (!m.part || has(m.part)) { look.mode = i; visButtons(); return; } } }
    const pk = (an, buf) => { an.getFloatTimeDomainData(buf); let p = 0; for (let i = 0; i < buf.length; i += 2) { let a = Math.abs(buf[i]); if (a > p) p = a; } return p; };
    function meters(R) {
        X.pr.tracks.forEach(tr => { let c = R.ch[tr.uid]; if (!c || !c.an) return; let lv = Math.min(1, pk(c.an, c.buf) * 1.3); V.lv[tr.uid] = Math.max(lv, (V.lv[tr.uid] || 0) * 0.85); });
        let l = pk(R.M.anL, R.M.bufL), r = pk(R.M.anR, R.M.bufR);
        V.oL = Math.max(l, (V.oL || 0) * 0.9); V.oR = Math.max(r, (V.oR || 0) * 0.9); V.lv.master = Math.max(V.oL, V.oR); X.out = [V.oL, V.oR]; X.M = R.M;
        if (V.mOut) { let is = V.mOut.querySelectorAll('i'); is[0].style.setProperty('--m', Math.min(1, V.oL).toFixed(3)); is[1].style.setProperty('--m', Math.min(1, V.oR).toFixed(3)); }
        (V.dockMeters || []).forEach(([id, mt]) => mt.style.setProperty('--m', Math.min(1, V.lv[id] || 0).toFixed(3)));
        if (V.spec && V.spec.isConnected) {
            let x = V.spec.getContext('2d'), w = V.spec.width, h = V.spec.height; x.fillStyle = '#000'; x.fillRect(0, 0, w, h); x.fillStyle = V.theme.css;
            for (let i = 0; i < 128; i++) { let v = V.bins[i] / 255; x.fillRect(i / 128 * w, h - v * h, w / 128 - 0.5, v * h); }
            let lv = V.q('[data-lvl]'); if (lv) { let dbv = 20 * Math.log10(Math.max(1e-5, Math.max(V.oL, V.oR))); lv.textContent = 'peak ' + (dbv < -60 ? '-∞' : dbv.toFixed(1)) + ' dB'; }
        }
    }

    const KEYS = 'awsedftgyhujkolp;\'', held = new Map();
    const GMK = { 35: 0, 36: 0, 37: 5, 38: 1, 40: 1, 39: 2, 42: 3, 44: 3, 46: 4, 41: 6, 43: 6, 45: 6, 47: 6, 48: 6, 50: 6, 49: 7, 51: 7, 52: 7, 53: 7, 55: 7, 56: 7, 57: 7 };
    const walks = tr => tr && tr.inst !== 'coffin' && (NB.V[tr.inst] || {}).kind !== 'drum' && (NB.V[tr.inst] || {}).kind !== 'audio' && ((tr.snd.cxArp || 0) >= 0.1 || (tr.snd.cxSqOn || 0) >= 0.5);
    const AH = new Map();
    function arpKey(tr, m, vel, down, id) {
        let A = AH.get(tr.uid) || { keys: new Map(), h: null }; AH.set(tr.uid, A);
        if (down) { if (A.keys.has(id)) return; A.keys.set(id, { m, vel, rec: V.rec && X.playing() ? { b: L.pos(), m, v: vel, tr } : null }); }
        else { let k = A.keys.get(id); if (!k) return; A.keys.delete(id); if (k.rec && X.playing()) recNote(k.rec, L.pos()); }
        let ks = [...A.keys.values()];
        if (A.h && ks.length && L.arpRetune && L.arpRetune(tr.uid, ks.map(q => q.m))) return;
        if (A.h) { L.noteOff(A.h); A.h = null; }
        if (ks.length) A.h = L.noteOn(tr.uid, ks[0].m, Math.max(...ks.map(q => q.vel)), ks.map(q => q.m), V.wheel || 0);
    }
    function noteKey(m, vel, down, id) {
        let tr = X.trk(sel.tr) || X.pr.tracks[0]; if (!tr || !X.eng()) return;
        if (NB.isBus(tr)) { if (down) X.flash(tr.name + ' doesnt play notes. pick a track'); return; }
        if (walks(tr) || (!down && [...AH.values()].some(A => A.keys.has(id)))) { let A = [...AH.entries()].find(([, A]) => A.keys.has(id)); arpKey(A && !down ? X.trk(A[0]) || tr : tr, m, vel, down, id); return; }
        if (tr.inst === 'coffin' && id && id.charAt(0) === 'm') m = NB.KITROOT + (GMK[m] != null ? GMK[m] : ((m - NB.KITROOT) % 16 + 16) % 16);
        if (down) {
            if (held.has(id)) return;
            let h = L.noteOn(tr.uid, m, vel, null, V.wheel || 0); if (!h) return;
            h.vel = vel; h.seq = V.keySeq = (V.keySeq || 0) + 1;
            h.rec = V.rec && X.playing() ? { b: L.pos(), m, v: vel, tr } : null; held.set(id, h);
        } else {
            let h = held.get(id); if (!h) return; held.delete(id);
            if (h.rec && X.playing()) recNote(h.rec, L.pos());
            let ht = X.trk(h.uid), mono = ht && ((NB.V[ht.inst] || {}).kind === 'mono' || (ht.inst === 'serpent' && (ht.snd.vm || 0) >= 1 / 3));
            let same = [...held.entries()].filter(([, o]) => o.uid === h.uid && (mono || o.hold.some(x => h.hold.some(y => y.g === x.g))));
            if (!same.length) { L.noteOff(h); return; }
            if (same.every(([, o]) => o.seq < h.seq)) {
                let [pid, p] = same.reduce((a, b) => (b[1].seq > a[1].seq ? b : a));
                let nh = L.noteOn(h.uid, p.m, p.vel || 0.8);
                if (nh) { nh.vel = p.vel; nh.seq = p.seq; nh.rec = p.rec; held.set(pid, nh); }
            }
        }
    }
    const MX = [];
    function feel(h, c) { let v = [c[0], c[1], c[2]]; h.hold.forEach(x => x.tell && x.tell({ x: v })); if (h.rec && X.playing()) (h.rec.ex = h.rec.ex || []).push([L.pos(), v[0], v[1], v[2]]); }
    function recNote(r, endB) {
        { let q = X.pr.rq || {}, Lp = X.pr.loop; if (q.punch && Lp.b > Lp.a && (r.b < Lp.a - 1e-6 || r.b >= Lp.b)) return; }
        let tr = r.tr, sig = X.pr.sig, b = r.b, d = Math.max(0.05, endB - b);
        if (endB < b) d = 0.25;
        if (V.recQ) { let g = X.pr.grid; b = Math.round(b / g) * g; d = Math.max(g, Math.round(d / g) * g); }
        let c = tr.clips.find(c => b >= c.at && b < c.at + c.len);
        if (!c) { c = NB.newClip(barStart(b), barLen(b)); tr.clips.push(c); }
        let t = b - c.at + c.off; if (c.lp > 0) t = ((t % c.lp) + c.lp) % c.lp;
        let nn = { t, d, m: r.m, v: Math.round(r.v * 100) / 100 };
        if (r.ex && r.ex.length) { let e = {}; ['b', 'p', 's'].forEach((k, i) => { let a = []; for (let j = 0; j < 8; j++) { let tb = r.b + (endB - r.b) * j / 7, last = 0; r.ex.forEach(q => { if (q[0] <= tb + 1e-6) last = q[i + 1]; }); a.push(Math.round(last * 100) / 100); } if (a.some(q => Math.abs(q) > 0.01)) e[k] = a; }); if (Object.keys(e).length) nn.e = e; }
        c.notes.push(nn);
        sel.clip = c.uid; NB.touch(X.pr); X.save(); V.dirty = true; if (tab === 'roll') X.showDock();
    }
    function keys(e) {
        if (!V || !V.hover) return;
        let tg = e.target && e.target.tagName; if (/INPUT|SELECT|TEXTAREA/.test(tg || '') || (e.target && e.target.isContentEditable)) return;
        let k = e.key.toLowerCase(), ctrl = e.ctrlKey || e.metaKey;
        if (e.type === 'keydown') {
            if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) { if (X.playing()) stop(); else play(); } return; }
            if (ctrl && k === 'z') { e.preventDefault(); if (e.shiftKey) X.redo(); else X.undo(); return; }
            if (ctrl && k === 'y') { e.preventDefault(); X.redo(); return; }
            // Keyboard shortcuts. Mostly Ableton's because my hands do them anyway
            if (e.key === 'Tab' && !ctrl && !e.altKey) { e.preventDefault(); setTab(tab === 'roll' ? 'sound' : 'roll'); return; }
            if (ctrl && k === 'b') { e.preventDefault(); if (X.browseToggle) X.browseToggle(); place(); size(); return; }
            if (ctrl && e.altKey && k === 'l') { e.preventDefault(); foldDock(!look.dockOff); return; }
            if (ctrl && k === 'l') { e.preventDefault(); let sc0 = X.selClip(); if (sc0) { X.pr.loop = { on: 1, a: sc0.c.at, b: sc0.c.at + sc0.c.len }; } else X.pr.loop.on = X.pr.loop.on ? 0 : 1; X.save(); V.dirty = true; showTop(); return; }
            if (e.altKey && !ctrl && e.code === 'KeyA') { e.preventDefault(); addTrack('audio'); return; }
            if (e.key === '?' || (e.shiftKey && e.code === 'Slash')) { e.preventDefault(); help(); return; }
            if (e.altKey && !ctrl && e.code === 'KeyR') { e.preventDefault(); V.arec = !V.arec; showArrBar(); X.flash(V.arec ? 'AUTO on' : 'AUTO off'); return; }
            if (e.altKey && !ctrl && e.code === 'KeyK') { e.preventDefault(); let t = V.touched, tr = t && (t.uid === 'master' ? X.master() : X.trk(t.uid)); if (tr) laneFor(tr, t.path); else X.flash('touch a knob first'); return; }
            if (e.altKey && !ctrl && e.code === 'KeyL') { e.preventDefault(); let tr = X.selTr(); if (tr) { let o = own(tr); o.aopen = o.aopen ? 0 : 1; if (o.aopen && !lanesOf(tr).length) lanesOf(tr).push({ path: 'mix.vol', pts: [] }); X.save(); arrSize(); } return; }
            if (e.altKey && !ctrl && e.code === 'KeyS') { e.preventDefault(); let tr = X.trk(sel.tr); if (tr) { X.mark(); tr.mix.solo = tr.mix.solo ? 0 : 1; X.touch(); showDock(); } return; }
            if (V.lsel && V.lsel.size && !ctrl && (k === 'delete' || k === 'backspace')) { e.preventDefault(); X.mark(); V.lsel.forEach((st, a) => { a.pts = a.pts.filter(q => !st.has(q)); }); V.lsel = null; X.touch(); V.dirty = true; return; }
            if (V.lsel && V.lsel.size && ctrl && k === 'c') { e.preventDefault(); let lo = Infinity; V.lsel.forEach(st => st.forEach(q => { lo = Math.min(lo, q[0]); })); V.lclip = [...V.lsel].map(([a, st]) => [a, [...st].map(q => [q[0] - lo, q[1]])]); X.flash('points copied'); return; }
            if (V.lclip && ctrl && k === 'v' && V.focus === 'arr' && !X.selClip()) { e.preventDefault(); X.mark(); let at = V.cursor; V.lsel = new Map(); V.lclip.forEach(([a, list]) => { let st = new Set(); list.forEach(([b, v]) => { let q = [Math.round((at + b) * 1000) / 1000, v]; a.pts = a.pts.filter(z => Math.abs(z[0] - q[0]) > 1e-6); a.pts.push(q); st.add(q); }); a.pts.sort((m, n) => m[0] - n[0]); V.lsel.set(a, st); }); X.touch(); V.dirty = true; return; }
            if (k === 'escape' && (V.lsel || V.helpOn)) { if (V.helpOn) help(); V.lsel = null; V.dirty = true; return; }
            if (e.altKey && !ctrl && e.code === 'KeyI') { e.preventDefault(); let r = V.q('[data-arr]').getBoundingClientRect(); trackMenu(r.left + 40, r.top + 40); return; }
            if (V.focus === 'roll' && X.rollKey && X.rollKey(e)) return;
            if (V.focus === 'arr') {
                let sc = X.selClip(), E = X.ed, any = sc || (X.picked && X.picked().length);
                if (any && (k === 'delete' || k === 'backspace')) { e.preventDefault(); E.del(); return; }
                if (ctrl && !e.shiftKey && k === 'a') { e.preventDefault(); X.pickAll(); return; }
                if (any && ctrl && k === 'd') { e.preventDefault(); E.dupe(); return; }
                if (ctrl && k === 'e') { e.preventDefault(); E.split(); return; }
                if (any && ctrl && k === 'j') { e.preventDefault(); E.glue(); return; }
                if (any && !ctrl && !e.altKey && k === '0') { e.preventDefault(); X.mark(); let list = X.picked(), m = list.some(o => !o.c.mute) ? 1 : 0; list.forEach(o => { o.c.mute = m; }); X.touch(); X.flash(m ? (list.length > 1 ? list.length + ' clips muted' : 'clip muted') : 'back on'); return; }
                if (any && ctrl && k === 'c') { e.preventDefault(); E.copy(); return; }
                if (any && ctrl && k === 'x') { e.preventDefault(); E.cut(); return; }
                if (ctrl && k === 'v' && V.clipBoard) { e.preventDefault(); E.paste(); return; }
                if (k === 'escape' && X.picked && X.picked().length > 1) { X.pickNone(); return; }
            }
            if (ctrl || e.altKey) return;
            if (/^[1-7]$/.test(k)) { e.preventDefault(); setTab(TABS[+k - 1][0]); return; }
            if (k === 'm') { let tr = X.trk(sel.tr); if (tr) { X.mark(); tr.mix.mute = tr.mix.mute ? 0 : 1; X.touch(); showDock(); X.flash(tr.name + (tr.mix.mute ? ' muted' : ' back on')); } return; }
            if (k === 'r') { e.preventDefault(); let rb = [...V.q('[data-top]').querySelectorAll('button')].find(b => b.dataset.rec); if (rb) rb.click(); return; }
            if (k === 'n') { let tr = X.trk(sel.tr); if (!tr) return; if (NB.V[tr.inst].kind === 'audio') { if (window.NBA) NBA.pickFiles(tr, V.cursor); return; } addClip(tr, barStart(V.cursor), barLen(V.cursor)); setTab('roll'); return; }
            if (k === 'home') { e.preventDefault(); V.cursor = 0; if (X.playing()) play(0); V.dirty = true; showPos(); return; }
            if (k === '=' || k === '+' || k === '-') { e.preventDefault(); V.ppb = clamp(V.ppb * (k === '-' ? 1 / 1.3 : 1.3), 2, 160); arrSize(); return; }
            if (V.focus === 'arr' && /^arrow(up|down)$/.test(k)) { e.preventDefault(); let ts = X.pr.tracks, i = ts.findIndex(t => t.uid === sel.tr), j = clamp(i + (k === 'arrowup' ? -1 : 1), 0, ts.length - 1); if (ts[j]) X.pick(ts[j].uid, null); V.dirty = true; return; }
            if (V.focus === 'arr' && /^arrow(left|right)$/.test(k)) { e.preventDefault(); let rt = k === 'arrowright';
                if (e.shiftKey) V.cursor = Math.max(0, Math.round(V.cursor + (rt ? 1 : -1)));
                else { let q = NB.barOf(X.pr, V.cursor), on = Math.abs(V.cursor - q.at) < 1e-6; V.cursor = Math.max(0, rt ? NB.barAt(X.pr, q.bar + 1) : on ? NB.barAt(X.pr, Math.max(0, q.bar - 1)) : q.at); }
                V.dirty = true; showPos(); return; }
            if (k === 'b') { e.preventDefault(); addGrave(X.playing() && L.pos() != null ? L.pos() : V.cursor); return; }
            if (k === '[' || k === ']') { e.preventDefault(); let here = X.playing() && L.pos() != null ? L.pos() : V.cursor, ms = X.pr.marks, m = k === ']' ? ms.find(q => q.b > here + 0.01) : ms.slice().reverse().find(q => q.b < here - (X.playing() ? 0.6 : 0.01)); if (m) jumpTo(m.b, m.name); else X.flash(k === ']' ? 'no marker after here' : 'no marker before here'); return; }
            if (k === 'z') { V.kbOct = Math.max(1, V.kbOct - 1); X.flash('keyboard octave ' + V.kbOct); return; }
            if (k === 'x') { V.kbOct = Math.min(7, V.kbOct + 1); X.flash('keyboard octave ' + V.kbOct); return; }
        }
        let i = KEYS.indexOf(k), onCof = (X.trk(sel.tr) || {}).inst === 'coffin' && 'asdfghjkqwertyui'.indexOf(k) >= 0; if ((i < 0 && !onCof) || e.ctrlKey || e.metaKey || e.altKey) return;
        e.preventDefault(); if (e.repeat) return;
        let cof = tr0 => tr0 && tr0.inst === 'coffin', ck = 'asdfghjkqwertyui'.indexOf(k), tr = X.trk(sel.tr), m = cof(tr) ? NB.KITROOT + ck : (V.kbOct + 1) * 12 + i;
        if (cof(tr) && ck < 0) return;
        noteKey(m, 0.8, e.type === 'keydown', 'k' + k);
    }
    const HELP = [
        ['再生 // PLAYING', [['space', '再生 / 停止', 'play / stop'], ['home', '最初に戻る', 'back to the start'], ['r', '録音 (音声トラックではマイク)', 'record (on an audio track: the mic)'],
            ['ctrl+l', '選んだクリップの周りでループ (なければループの入 / 切)', 'loop round the picked clip (none picked = loop on / off)'], ['m', '選んだトラックをミュート', 'mute the picked track'], ['alt+s', '選んだトラックをソロ', 'solo the picked track'],
            ['ctrl+z', '元に戻す', 'undo'], ['ctrl+shift+z / ctrl+y', 'やり直す', 'redo']]],
        ['タイムライン // THE TIMELINE', [['↑ ↓', '上 / 下のトラックを選ぶ', 'pick the track above / below'], ['← →', 'カーソルを1小節動かす (shift = 1拍)', 'move the cursor a bar (shift = a beat)'], ['= / -', '拡大 / 縮小', 'zoom in / out'],
            ['n', 'カーソルに新しいクリップ', 'a new clip at the cursor'], ['ctrl+e', 'カーソルで切る (選んだクリップ、なければ選んだトラック)', 'split at the cursor (the picked clips, or the picked track)'], ['ctrl+d', '選んだクリップをすぐ後ろに複製', 'duplicate the picked clips, straight after'],
            ['ctrl+c / x / v', 'コピー / 切り取り / カーソルに貼る (もう一度 = その次に)', 'copy / cut / paste at the cursor (again = the next one along)'], ['ctrl+j', '同じトラックの音符クリップを一つにまとめる', 'glue note clips on one track into one'],
            ['ctrl+a', '全部のクリップを選ぶ', 'pick every clip'], ['0', '選んだクリップをミュート', 'mute the picked clips'], ['del', '選んだクリップを消す', 'delete the picked clips'], ['esc', '選択を外す', 'let go of the picks'],
            ['alt+a', '新しい音声トラック', 'a new audio track'], ['alt+i', '楽器を選んで新しいトラック', 'a new track (pick the instrument)']]],
        ['タイムラインのマウス操作 // THE MOUSE ON THE TIMELINE', [['shift+click', 'クリップを選択に足す / 外す', 'add a clip to the picks (or take it off)'], ['ctrl+drag', '枠に触れたクリップを全部選ぶ', 'a box: picks every clip it touches'],
            ['drag', '動かす (選んだのが複数なら全部)', 'move it (all the picked ones together)'], ['alt+drag', 'コピーしてドラッグ', 'drag a copy'], ['drag an edge', '長さ / 頭をトリム', 'length / trim the start'],
            ['alt+drag the right edge', '伸ばす (音符は間隔が広がり、音声は遅くなる)', 'stretch it (notes spread out, audio slows down)'], ['drop below the tracks', '新しいトラックを作ってそこに置く', 'a new track with it on'],
            ['right click', 'クリップのメニュー (切る・刻む・伸縮・音声に書き出す など)', 'the clip menu (split, chop, stretch, bounce to audio and more)'],
            ['wheel', 'スクロール (トラックが全部見えている時、ルーラーの上では時間の方向)', 'scroll (sideways through time when every track fits, or over the ruler)'], ['shift / alt + wheel', '横にスクロール', 'scroll sideways'],
            ['ctrl+wheel', 'マウスの所で拡大 / 縮小', 'zoom where the mouse is'], ['middle drag', 'つかんで動かす (どの方向でも)', 'grab it and drag it about (any way)'],
            ['the strip underneath', '曲全体。箱をドラッグ = 移動、端をドラッグ = 拡大縮小、ダブルクリック = 全体', 'the whole song: drag the box = scroll, drag its ends = zoom, double click = all of it']]],
        ['オートメーション // AUTOMATION', [['alt+click a knob', 'そのつまみのレーンをすぐ作る', 'a lane for it, right now'], ['right click a knob', 'そのレーンのメニュー', 'its lane menu'], ['alt+k', '最後に触ったつまみのレーン', 'a lane for the last knob you touched'],
            ['alt+l', '選んだトラックのレーンの表示 / 非表示', 'lanes on / off for the picked track'], ['alt+r', '自動: 再生中に回したつまみが書き込まれる', 'AUTO: knobs you turn while it plays get written'], ['shift+drag a lane', '描く', 'paint it'],
            ['alt+drag a lane', '直線を引く', 'a straight line'], ['ctrl+drag', '点を選ぶ (どのレーン・どのトラックでも)', 'pick points (any lanes, any tracks)'], ['del / ctrl+c / ctrl+v', '選んだ点を消す / コピー / カーソルに貼る', 'picked points: delete / copy / paste at the cursor']]],
        ['ロール // THE ROLL', [['click', '音符を置く (押したまま右へドラッグ = 長く)', 'a note (hold + drag right = longer)'], ['alt+drag on empty', '格子に沿って音符を描く', 'paint notes along the grid'], ['right click / right drag', '消す / こすって消す', 'delete / rub them out'],
            ['ctrl+drag', '囲んで選ぶ (shift = 足す)', 'box select (shift = add to it)'], ['alt+drag a note', 'コピーしてドラッグ', 'drag a copy'], ['↑ ↓', '音符を動かす (ctrl / shift = 1オクターブ)', 'move notes (ctrl / shift = an octave)'],
            ['← →', '音符を格子1つ分ずらす (shift = 4つ分)', 'a grid step (shift = four)'], ['q', 'クオンタイズ', 'quantise'], ['ctrl+a / c / x / v / d', '全選択 / コピー / 切り取り / 貼り付け / 複製', 'all / copy / cut / paste / duplicate'],
            ['ctrl+e', '選んだ音符をクリックした所で切る', 'cut the picked notes where you clicked'], ['ctrl+j', '同じ高さで接している音符をつなぐ', 'glue touching notes on the same row'], ['del', '消す', 'delete']]],
        ['どこでも // EVERYWHERE', [['1 - 7', 'ロール 音色 ラック ミキサー メーター 見た目 書き出し', 'ROLL SOUND RACK MIXER METERS LOOK BOUNCE'], ['tab', 'ロール ⇄ 音色', 'roll ⇄ sound'], ['ctrl+b', 'ブラウザ', 'the browser'], ['ctrl+alt+l', '下のパネルを畳む / 開く', 'fold the panel underneath away + back'],
            ['a w s e d f t g …', '音を弾く (パソコンのキーボードがピアノになる)', 'play notes (the keyboard is a piano)'], ['z / x', '鍵盤のオクターブ 下 / 上', 'keyboard octave down / up'], ['?', 'この表', 'this sheet'], ['esc', '閉じる', 'shut it']]]];
    const kbJP = k => [['the strip underneath', '下の帯'], ['middle drag', '中ボタンでドラッグ'], ['ctrl+wheel', 'ctrl+ホイール'], ['shift / alt + wheel', 'shift / alt + ホイール'], ['wheel', 'ホイール'], ['drop below the tracks', 'トラックの下に落とす'], ['the right edge', '右端'], ['right click', '右クリック'], ['right drag', '右ドラッグ'], ['an edge', '端'], ['on empty', '空いた所'], ['a knob', 'つまみ'], ['a lane', 'レーン'], ['a note', '音符'], ['click', 'クリック'], ['drag', 'ドラッグ']].reduce((s, [a, b]) => s.split(a).join(b), k);
    function help() {
        if (!V) return; let old = V.root.querySelector('.nb-help'); if (old) { old.remove(); V.helpOn = false; document.removeEventListener('keydown', helpEsc, true); return; }
        let lang = window.NBL ? NBL.mode() : 'both', h = el('div', 'nb-help'), top = el('div', 'nb-hhd'), cols = el('div', 'cols');
        h.dataset.nolang = 1;
        top.appendChild(el('h3', '', { en: 'EVERY KEY', jp: 'キー一覧', both: '全部のキー // EVERY KEY' }[lang]));
        if (window.NBL) [['both', 'JP+EN'], ['en', 'EN'], ['jp', '日本語']].forEach(([m, t]) => { let b = btn(t, 'sm' + (lang === m ? ' on' : '')); b.onclick = e => { e.stopPropagation(); NBL.set(m); help(); help(); showAll(); }; top.appendChild(b); });
        top.appendChild(el('span', 'nb-hint', { en: 'click anywhere or esc to shut it', jp: 'どこかを押すか esc で閉じる', both: 'click anywhere or esc to shut it // どこかを押すか esc で閉じる' }[lang]));
        h.appendChild(top);
        HELP.forEach(([t, list]) => { let d = el('div'), th = t.split(' // '); d.appendChild(el('h4', '', lang === 'en' ? th[1] : lang === 'jp' ? th[0] : t));
            list.forEach(([kk, jp, en]) => { let r = el('div', 'hr'); r.appendChild(el('kbd', '', lang === 'jp' ? kbJP(kk) : kk)); let tx = el('span', 'tx'); tx.appendChild(el('span', 'en', lang === 'jp' ? jp : en)); if (lang === 'both') tx.appendChild(el('span', 'jp', jp)); r.appendChild(tx); d.appendChild(r); });
            cols.appendChild(d); });
        h.appendChild(cols);
        { let ft = el('div', 'nb-hint', { en: 'more soon. probably', jp: 'そのうち増える。たぶん', both: 'more soon. probably // そのうち増える。たぶん' }[lang]); ft.style.cssText = 'opacity:.45;margin-top:10px;text-align:right'; h.appendChild(ft); }
        h.onclick = () => help(); V.root.style.position = 'relative'; V.root.appendChild(h); V.helpOn = true;
        document.addEventListener('keydown', helpEsc, true);
    }
    function helpEsc(e) { if (e.key !== 'Escape') return; document.removeEventListener('keydown', helpEsc, true); if (V && V.helpOn) { e.stopPropagation(); e.preventDefault(); help(); } }
    X.help = help;
    const WR = {};
    function wheelTo(key, v) {
        let tr = X.trk(sel.tr); if (!tr || tr.isMaster || !L || NB.isBus(tr) || tr.inst === 'serpent' || NB.V[tr.inst].kind === 'audio') return;
        if (!L.R.ch[tr.uid]) { L.R.sync(); L.R.apply(true); } let c = L.R.ch[tr.uid]; if (!c) return; if (L.ctx.state === 'suspended') L.ctx.resume(); let B = L.R.bendNode(c), t = L.ctx.currentTime;
        (key === 'pb' ? B.cs.offset : B.dep.gain).setTargetAtTime(key === 'pb' ? v * (tr.pbr || 2) * 100 : v * 50, t, 0.008);
        if (!(V.rec && X.playing())) return; let b = L.pos(); if (b == null) return;
        let cl = tr.clips.find(q => b >= q.at && b < q.at + q.len); if (!cl) return;
        let ct = b - cl.at + (cl.off || 0); if (cl.lp > 0) ct = ((ct % cl.lp) + cl.lp) % cl.lp; ct = Math.round(ct * 1000) / 1000;
        let w = WR[key + cl.uid]; if (w && Math.abs(w[0] - ct) < 1 / 64 && Math.abs(w[1] - v) < 0.02) return;
        let P = cl[key] || (cl[key] = []), val = Math.round(v * 100) / 100; P.splice(0, P.length, ...P.filter(q => Math.abs(q[0] - ct) > 1e-6).concat([[ct, val]]).sort((p1, p2) => p1[0] - p2[0])); WR[key + cl.uid] = [ct, val]; NB.touch(X.pr);
    }
    function midiOn() {
        if (V && V.midi) { (V.midiIns || []).forEach(inp => { inp.onmidimessage = null; }); V.midiIns = []; V.midi = false; held.forEach((h, id) => { if (/^m/.test(id)) { if (L) L.noteOff(h); held.delete(id); } }); showTop(); X.flash('midi off. its not listening any more'); return; }
        if (!navigator.requestMIDIAccess) { X.flash('this browser cant hear midi keyboards'); return; }
        navigator.requestMIDIAccess({ sysex: false }).then(acc => {
            if (!V) return;
            const hook = () => {
                (V.midiIns || []).forEach(inp => { inp.onmidimessage = null; }); V.midiIns = [];
                acc.inputs.forEach(inp => { V.midiIns.push(inp); inp.onmidimessage = ev => {
                    let d = ev.data; if (!d || d.length < 2) return; let st = d[0], a = d[1], b = d.length > 2 ? d[2] : 0, ty = st & 0xf0, ch = st & 15; if (!V || !V.midi || st >= 0xf0) return;
                    if (ty === 0x90 && b > 0) { noteKey(a, b / 127, true, 'm' + a); let h = held.get('m' + a); if (h) { h.ch = ch; let c = MX[ch]; if (c && (c[0] || c[1] || c[2])) feel(h, c); } }
                    else if (ty === 0x80 || (ty === 0x90 && b === 0)) noteKey(a, 0, false, 'm' + a);
                    else if (ty === 0xe0) { let c = MX[ch] = MX[ch] || [0, 0, 0]; c[0] = (((b << 7) | a) - 8192) / 8192; held.forEach(h => { if ((h.ch || 0) === ch) feel(h, c); }); wheelTo('pb', c[0]); }
                    else if (ty === 0xd0) { let c = MX[ch] = MX[ch] || [0, 0, 0]; c[1] = a / 127; held.forEach(h => { if ((h.ch || 0) === ch) feel(h, c); }); }
                    else if (ty === 0xa0) { let h = held.get('m' + a); if (h) { let c = (MX[h.ch || 0] || [0, 0, 0]).slice(); c[1] = b / 127; feel(h, c); } }
                    else if (ty === 0xb0 && a === 74) { let c = MX[ch] = MX[ch] || [0, 0, 0]; c[2] = b / 127; held.forEach(h => { if ((h.ch || 0) === ch) feel(h, c); }); }
                    else if (ty === 0xb0 && a === 1) { V.wheel = b / 127; held.forEach(h => h.hold.forEach(x => x.tell && x.tell({ w: V.wheel }))); wheelTo('mw', V.wheel); }
                    else if (ty === 0xb0 && (a === 120 || a === 123)) held.forEach((h, id) => { if (/^m/.test(id)) { if (L) L.noteOff(h); held.delete(id); } });
                }; });
            };
            hook(); V.midiAcc = acc; acc.onstatechange = () => { if (V && V.midi) { hook(); showTop(); } };
            V.midi = true; showTop(); X.flash(V.midiIns.length ? V.midiIns.length + ' midi keyboard' + (V.midiIns.length > 1 ? 's' : '') + ' listening. it plays the picked track. press MIDI again to stop' : 'listening, but no midi keyboard plugged in');
        }).catch(e => X.flash(location.protocol === 'file:' ? 'the browser wont give midi to a page opened off the disk. open the site from its web address and it will' : 'the browser said no to midi (' + ((e && e.name) || 'blocked') + '). check the little icon by the address bar'));
    }

    let V0win = null;
    function place() {
        if (!V) return;
        let fit = V.win.classList.contains('nb-fit'), v = V.pw ? V.vgone : V.q('[data-v]'), brw = V.q('[data-brw]'), body = V.q('.nb-body'), deck = V.q('.nb-deck'), left = V.q('.nb-left');
        if (fit) {
            if (!left) { left = el('div', 'nb-left'); body.insertBefore(left, brw); left.appendChild(brw); }
            if (v.parentNode !== left) left.appendChild(v);
            left.classList.toggle('shut', brw.classList.contains('shut'));
        } else if (left) { body.insertBefore(brw, left); left.remove(); V.root.insertBefore(v, deck); }
    }
    X.place = place;
    const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement || null;
    const fsExit = () => { try { let r = document.exitFullscreen ? document.exitFullscreen() : document.webkitExitFullscreen && document.webkitExitFullscreen(); if (r && r.catch) r.catch(() => {}); } catch (e) {} };
    const fsLate = () => setTimeout(() => { if (V) { V.still = 0; size(); } }, 80);
    function popVis() {
        if (!V || V.pw) return;
        if (fsEl()) fsExit();
        let v = V.q('[data-v]'), p = look.vpop || {}, w = el('div', 'bedazzled-border nb-mwin nb-vwin'), cs = getComputedStyle(V.root);
        w.id = 'nb-vwin';
        ['--a', '--b', '--glow', '--line', '--ink', '--pan', '--pan2'].forEach(k => { let x = cs.getPropertyValue(k); if (x) w.style.setProperty(k, x.trim()); });
        let W = Math.min(innerWidth - 20, p.w || 560), H = Math.min(innerHeight - 60, p.h || 340);
        w.style.left = Math.max(0, Math.min(innerWidth - 80, p.x != null ? p.x : innerWidth - W - 40)) + 'px'; w.style.top = Math.max(0, Math.min(innerHeight - 40, p.y != null ? p.y : 70)) + 'px';
        w.style.width = W + 'px'; w.style.height = H + 'px';
        let lm = window.NBL ? NBL.mode() : 'both', ttl = lm === 'jp' ? '<b>映</b> 絵' : lm === 'en' ? '<b>PICTURE</b>' : '<b>映</b> PICTURE';
        w.innerHTML = '<div class="window-header"><span data-nolang="1">// ' + ttl + '</span><div class="win-btns"><button type="button" class="win-btn nb-back" title="back into the noisebox" aria-label="back into the noisebox">[⇲]</button><button type="button" class="kill-btn" title="back into the noisebox" aria-label="back into the noisebox">[X]</button></div></div><div class="nb-vwb"></div>';
        let g = el('div', 'nb-vgone'); g.appendChild(el('span', '', '映 the picture is out on the desktop ↗')); g.appendChild(btn('⇲ BRING IT BACK', 'sm', () => popBack()));
        v.parentNode.insertBefore(g, v); w.querySelector('.nb-vwb').appendChild(v); V.vgone = g; V.pw = w;
        if (window.NBL) NBL.once(w);
        (document.getElementById('desktop') || document.body).appendChild(w);
        let h = w.querySelector('.window-header');
        const keep = () => { if (!w.isConnected) return; let r = w.getBoundingClientRect(); look.vpop = { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; X.saveLook(); };
        w.querySelector('.win-btn').onclick = () => popBack(); w.querySelector('.kill-btn').onclick = () => popBack();
        h.addEventListener('pointerdown', e => {
            if (e.target.closest('button')) return; e.preventDefault(); let r = w.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top;
            const mv = ev => { w.style.left = Math.max(0, Math.min(innerWidth - 60, ev.clientX - ox)) + 'px'; w.style.top = Math.max(0, Math.min(innerHeight - 30, ev.clientY - oy)) + 'px'; };
            const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); keep(); };
            addEventListener('pointermove', mv); addEventListener('pointerup', up);
        });
        w.addEventListener('pointerdown', () => { let top = 0; document.querySelectorAll('.nb-mwin').forEach(o => { top = Math.max(top, +getComputedStyle(o).zIndex || 0); }); w.style.zIndex = top + 1; });
        if (window.ResizeObserver) { let t0 = 0; V.pro = new ResizeObserver(() => { clearTimeout(t0); t0 = setTimeout(keep, 200); size(); }); V.pro.observe(w); }
        { let pb = V.q('[data-pop]'); if (pb) { pb.classList.add('on'); pb.textContent = '⇲'; pb.title = 'back into the noisebox'; } }
        V.still = 0; visButtons(); size(); place();
    }
    function popBack() {
        if (!V || !V.pw) return;
        let v = V.q('[data-v]'), g = V.vgone, w = V.pw;
        if (fsEl() === v) fsExit();
        if (V.pro) { V.pro.disconnect(); V.pro = null; }
        if (g && g.parentNode) { g.parentNode.insertBefore(v, g); g.remove(); } else V.root.insertBefore(v, V.q('.nb-deck'));
        V.pw = null; V.vgone = null; w.remove();
        { let pb = V.q('[data-pop]'); if (pb) { pb.classList.remove('on'); pb.textContent = '⧉'; pb.title = 'pop it out into its own window you can drag anywhere'; } }
        V.still = 0; place(); showAll(); setTimeout(size, 30);
    }
    X.popVis = () => popVis(); X.popBack = () => popBack();
    function fitWin() {
        let win = V0win; if (!win || !win.isConnected) { window.removeEventListener('resize', fitWin); return; }
        let desk = document.getElementById('desktop'), dr = desk ? desk.getBoundingClientRect() : { top: 42, height: window.innerHeight - 90 };
        let fit = !(os.isPhone && os.isPhone()) && window.innerWidth > 760 && dr.height >= 430;
        win.classList.toggle('nb-fit', fit);
        if (win.classList.contains('is-max')) { win.style.height = fit ? dr.height + 'px' : ''; }
        else if (fit) {
            let ics = [...document.querySelectorAll('.desktop-icons .icon-wrap')].filter(i => i.offsetParent !== null), edge = ics.length ? Math.max(...ics.map(i => i.getBoundingClientRect().right)) + 10 : 10;
            let room = window.innerWidth - edge - 10, w = Math.min(2400, room >= 1250 && dr.height >= 760 ? room : window.innerWidth - 20); win.style.maxWidth = w + 'px';
            win.style.top = '6px'; win.style.height = Math.round(dr.height - 12) + 'px';
            let left = room >= w ? edge + Math.max(0, (room - w) / 2) : Math.max(10, window.innerWidth - w - 10);
            win.style.left = Math.round(left) + 'px';
        } else { win.style.height = ''; win.style.maxWidth = Math.min(1240, window.innerWidth - 20) + 'px'; }
        if (V && V.win === win) { place(); size(); topFit(); }
    }
    function open(win) {
        styles();
        if (V && V.win === win) return;
        let root = win.querySelector('.nb'); if (!root) return;
        try { localStorage.setItem('vmp_nb_seen', '1'); } catch (e) {}
        V0win = win; fitWin();
        window.addEventListener('resize', fitWin);
        { let mb = win.querySelector('.max-btn'), hd = win.querySelector('.window-header'); if (mb) mb.addEventListener('click', () => setTimeout(fitWin, 30)); if (hd) hd.addEventListener('dblclick', () => setTimeout(fitWin, 30)); }
        let t = win.querySelector('[id^="win-title-"]'); if (t) t.textContent = '// noisebox.exe 【音箱】';
        V = { win, root, q: s => root.querySelector(s) || (V && V.pw ? V.pw.querySelector(s) : null), cg: root.querySelector('.nb-gl'), c2: root.querySelector('.nb-2d'), np: root.querySelector('[data-np]'), lo: false, raw: new Uint8Array(1024), bins: new Uint8Array(128), td: new Float32Array(2048),
            s: { t: 0, trav: 0, kick: 0, bass: 0, mid: 0, high: 0, cA: [1, 0, 0.6], cB: [1, 0.4, 0.7] }, k: 0.7, fn: 0, lv: {}, hit: {}, ppb: 18, snap: 1, cursor: 0, follow: true, metro: false, rec: false, recQ: true, kbOct: 4, dirty: true, rows: [], rowsH: 0 };
        V.sc = root.querySelector('.nb-arrsc');
        V.sl = V.sc.scrollLeft; V.st = V.sc.scrollTop;
        V.sc.addEventListener('scroll', () => { V.sl = V.sc.scrollLeft; V.st = V.sc.scrollTop; }, { passive: true });
        if (window.NBL) NBL.watch(root);
        V.theme = themeRGB();
        V.vis = NBV.create(V.cg, V.c2);
        if (low() || !V.vis.gl) look.mode = NBV.MODES.length - 1;
        { let fb = V.q('[data-fs]'), v0 = V.q('[data-v]'); if (!(v0.requestFullscreen || v0.webkitRequestFullscreen)) fb.style.display = 'none';
          fb.onclick = () => { let v = V.q('[data-v]'); if (fsEl()) fsExit(); else if (v.requestFullscreen) v.requestFullscreen().catch(() => {}); else if (v.webkitRequestFullscreen) v.webkitRequestFullscreen(); }; }
        V.q('[data-lo]').onclick = () => { V.lo = !V.lo; visButtons(); size(); };
        V.q('[data-v]').addEventListener('click', e => { if (V.pw || !V.win.classList.contains('nb-fit') || e.target.closest('button')) return; look.height = look.height === 2 ? 1 : 2; X.saveLook(); showAll(); setTimeout(size, 30); });
        V.q('[data-look]').onclick = () => setTab('look');
        { let rb = V.q('[data-vreset]'); rb.onclick = () => { if (!rb.dataset.sure) { rb.dataset.sure = 1; rb.textContent = 'SURE?'; setTimeout(() => { if (rb.isConnected) { delete rb.dataset.sure; rb.textContent = '↺'; } }, 2200); return; } delete rb.dataset.sure; rb.textContent = '↺'; lookReset('all'); }; }
        if (!X.selTr()) sel.tr = X.pr.tracks[0] ? X.pr.tracks[0].uid : 'master';
        if (!X.pr.tracks.length) tab = 'sound';
        bindArr(); bindScroll();
        { let sp = V.q('[data-split]'), deck = V.q('.nb-deck'), dock = V.q('[data-dock]');
          const setH = px => { let tot = deck.getBoundingClientRect().height, h = clamp(px, 60, Math.max(80, tot - 160)); dock.style.setProperty('--dockh', Math.round(h) + 'px'); look.dockh = Math.round(h / Math.max(1, tot) * 1000) / 1000; };
          if (look.dockh) dock.style.setProperty('--dockh', (look.dockh * 100).toFixed(1) + '%');
          let y0 = 0, h0 = 0;
          drag(sp, p => { y0 = p.y; h0 = dock.getBoundingClientRect().height; sp.classList.add('drag'); }, p => { setH(h0 + (y0 - p.y)); size(); }, () => { sp.classList.remove('drag'); X.saveLook(); });
          sp.addEventListener('dblclick', () => { delete look.dockh; dock.style.removeProperty('--dockh'); X.saveLook(); size(); }); }
        root.querySelector('[data-arr]').addEventListener('mouseenter', () => { if (V) V.focus = 'arr'; });
        root.querySelector('[data-dock]').addEventListener('mouseenter', () => { if (V) V.focus = tab === 'roll' ? 'roll' : 'dock'; });
        place(); showAll(); size();
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (V) topFit(); });
        if (X.metersOpen) setTimeout(() => { if (V) X.metersOpen(); }, 600);
        V.ro = window.ResizeObserver ? new ResizeObserver(() => { size(); }) : null; if (V.ro) { V.ro.observe(V.q('[data-v]')); V.ro.observe(V.q('[data-arr]')); }
        ['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => { document.addEventListener(ev, size); document.addEventListener(ev, fsLate); });
        V.q('[data-pop]').onclick = () => { if (V.pw) popBack(); else popVis(); };
        V.tt = setInterval(() => { if (V) { V.theme = themeRGB(); V.tv = null; } }, 1000);
        win.addEventListener('mouseenter', () => { if (V) V.hover = true; }); win.addEventListener('mouseleave', () => { if (V) V.hover = false; });
        root.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); });
        root.addEventListener('mouseover', e => { if (e.target && e.target.classList && e.target.classList.contains('nb-arrcv')) return; let t = e.target && e.target.closest ? e.target.closest('[title]') : null; X.info(t && root.contains(t) ? t.title : ''); });
        V.raf = requestAnimationFrame(frame);
        V.warmT = setTimeout(() => { if (V && V.vis && V.vis.warm) V.vis.warm(NBV.MODES.map((m, i) => i).filter(i => { let m = NBV.MODES[i]; return m.src && (!m.part || has(m.part)); })); }, 1500);
        // X stops everything. minimise keeps the song playing
        let kill = win.querySelector('.kill-btn'); if (kill) kill.addEventListener('click', close);
    }
    function close() {
        if (!V) return;
        cancelAnimationFrame(V.raf); clearInterval(V.tt); clearTimeout(V.warmT); clearTimeout(V.msgT); if (V.ro) V.ro.disconnect(); ['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => { document.removeEventListener(ev, size); document.removeEventListener(ev, fsLate); });
        if (V.pw) { if (fsEl() && V.pw.contains(fsEl())) fsExit(); V.pw.remove(); V.pw = null; }
        closeMenu();
        if (V.vis) V.vis.lose();
        V = null;
        held.clear();
        if (window.NBA) NBA.disarm();
        if (L) { L.close(); L = null; }
    }
    document.addEventListener('keydown', keys); document.addEventListener('keyup', keys);
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape' || !V || !V.hover || document.querySelector('.nb-menu')) return;
        let tg = e.target && e.target.tagName; if (/INPUT|SELECT|TEXTAREA/.test(tg || '')) return;
        let notes = X.sel && X.sel.notes && X.sel.notes.size, many = X.picked ? X.picked().length : 0;
        if (!(V.helpOn || (V.lsel && V.lsel.size) || notes || many || (X.sel && X.sel.clip))) return;
        e.stopImmediatePropagation(); e.preventDefault();
        if (V.helpOn) { help(); return; }
        if (V.lsel && V.lsel.size) { V.lsel = null; V.dirty = true; return; }
        if (notes) { X.sel.notes = new Set(); showDock(); return; }
        if (X.pickNone) X.pickNone(); X.sel.clip = null; V.dirty = true; showDock();
    }, true);

    let orig = os.summon.bind(os);
    os.summon = function (id) {
        orig(id);
        if (id === 'noisebox.exe') { let w = document.getElementById('win-noisebox.exe'); if (w) open(w); }
    };
    os.nbSeen = () => { try { return localStorage.getItem('vmp_nb_seen') === '1'; } catch (e) { return false; } };
    styles(); template();
    os.noisebox = {
        play: from => play(from), stop, playing: X.playing, close,
        project: () => X.pr, live: () => L,
        set(fn) { X.mark(); fn(X.pr, NB); NB.heal(X.pr); X.touch(); showAll(); },
        pick: (tr, clip) => { X.pick(tr, clip); },
        tab: t => setTab(t), mode: m => { look.mode = m; if (V) visButtons(); }, look: o => { Object.assign(look, o || {}); X.saveLook(); if (V) showAll(); },
        vis: () => V && { mode: look.mode, gl: !!(V.vis && V.vis.gl), ok: V.vis ? NBV.MODES.map((m, i) => !!V.vis.ok(i)) : [], s: V.s, k: V.k },
        bounce: (stems, opt) => bounceIt(!!stems, Object.assign({ quiet: true }, opt || {})),
        midi: () => midiOut(), midiIn: u8 => midiIn(u8),
        undo: () => X.undo(), redo: () => X.redo(), addTrack: i => addTrack(i), addClip: (uid, at, len) => { let tr = X.trk(uid); return tr ? addClip(tr, at, len) : null; },
        // for files/
        kept: () => db.saves.slice(),
        openKept(name) { let k = db.saves.find(x => x.name === name); if (!k) return false; X.mark(); if (X.playing()) stop(); swap(JSON.parse(JSON.stringify(k.pr))); X.flash('opened ' + k.name); return true; },
        unkeep(name) { let i = db.saves.findIndex(x => x.name === name); if (i < 0) return null; let k = db.saves.splice(i, 1)[0]; X.save(); if (X.browse) X.browse(); return k; },
        rekeep(item) { if (!item || !item.pr) return; db.saves = db.saves.filter(x => x.name !== item.name); db.saves.unshift(item); X.save(); },
        openShared: t => openShared(t),
        state: () => V && { cursor: V.cursor, ppb: V.ppb, rows: V.rows.length, tab, sel: { tr: sel.tr, clip: sel.clip, notes: sel.notes.size } }
    };
})();
