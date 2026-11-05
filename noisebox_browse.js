
(function () {
    const X = window.NBX;
    const B = { open: true, cat: 'inst', q: '', sounds: null, fold: {} };
    try { let s = JSON.parse(localStorage.getItem('vmp_nb_brw') || 'null'); if (s) { B.open = s.open !== false; if (s.cat) B.cat = s.cat; if (s.fold) B.fold = s.fold; } } catch (e) {}
    const keep = () => { try { localStorage.setItem('vmp_nb_brw', JSON.stringify({ open: B.open, cat: B.cat, fold: B.fold })); } catch (e) {} };
    const ALL = [['inst', '器', 'INSTRUMENTS'], ['fx', '架', 'PLUGINS'], ['pre', '✦', 'PRESETS'], ['chord', '和', 'CHORDS'], ['snd', '録', 'YOUR SOUNDS'], ['song', '作', 'IN PROGRESS']];
    const cats = () => ALL.filter(c => c[0] !== 'snd' || (B.sounds && B.sounds.length));
    const kb = n => n > 1048576 ? (n / 1048576).toFixed(1) + 'MB' : Math.max(1, Math.round(n / 1024)) + 'KB';
    const first = t => { let f = String(t || '').split(/[.:]/)[0]; return f.length > 40 ? '' : f; };

    function items(cat) {
        if (cat === 'inst') return NB.BUSV.concat(NB.VOICES).map(v => ({ k: 'inst', id: v.id, name: v.jp + ' ' + v.en, sub: first(v.sub), lk: !X.has(v.part) }));
        if (cat === 'fx') return NBFX.LIST.map(d => ({ k: 'fx', id: d.id, name: d.jp + ' ' + d.en, sub: first(d.sub), lk: !X.has(d.part) }));
        if (cat === 'pre') { let out = []; NB.VOICES.forEach(v => { (X.mine ? X.mine(v.id) : []).forEach((m, i) => out.push({ k: 'pre', id: v.id, mine: i, name: '★ ' + m[0], sub: v.jp + ' ' + v.en, lk: !X.has(v.part) })); (v.presets || []).forEach((p, i) => out.push({ k: 'pre', id: v.id, i, name: p[0], sub: v.jp + ' ' + v.en, lk: !X.has(v.part) })); }); return out; }
        if (cat === 'chord') return chordItems();
        if (cat === 'snd') return (B.sounds || []).map(s => ({ k: 'snd', id: s.id, name: s.name, sub: (s.dur ? s.dur.toFixed(1) + 's · ' : '') + kb(s.size || 0) + (s.made ? ' · made in here' : '') }));
        if (cat === 'song') return (X.kept ? X.kept() : []).map((s, i) => ({ k: 'song', i, name: s.name, sub: s.pr.bpm + 'bpm · ' + ((s.pr.tracks || []).length) + ' tracks' + (s.at ? ' · ' + new Date(s.at).toLocaleDateString() : '') }));
        return [];
    }
    // chord list. drag one onto a track
    const QS = [['M', [0, 4, 7], ''], ['m', [0, 3, 7], 'm'], ['5', [0, 7, 12], '5'], ['sus2', [0, 2, 7], 'sus2'], ['sus4', [0, 5, 7], 'sus4'], ['dim', [0, 3, 6], '°'], ['aug', [0, 4, 8], '+'],
        ['6', [0, 4, 7, 9], '6'], ['m6', [0, 3, 7, 9], 'm6'], ['7', [0, 4, 7, 10], '7'], ['M7', [0, 4, 7, 11], 'maj7'], ['m7', [0, 3, 7, 10], 'm7'], ['m7b5', [0, 3, 6, 10], 'm7♭5'], ['dim7', [0, 3, 6, 9], '°7'],
        ['add9', [0, 4, 7, 14], 'add9'], ['9', [0, 4, 7, 10, 14], '9'], ['m9', [0, 3, 7, 10, 14], 'm9'], ['M9', [0, 4, 7, 11, 14], 'maj9'], ['mM7', [0, 3, 7, 11], 'm(maj7)'], ['7sus4', [0, 5, 7, 10], '7sus4']];
    const RN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteNames = ns => ns.map(m => RN[((m % 12) + 12) % 12]).join(' ');
    function chordItems() {
        let K = X.chordKit, pr = X.pr, out = []; if (!K) return out;
        let lm = window.NBL ? NBL.mode() : 'both', sc = NB.SCALES[pr.scale || 'minor'], key = RN[(pr.root || 0) % 12] + ' ' + (lm === 'jp' && sc ? sc.jp : NB.scaleName(pr.scale || 'minor')), v0 = K.CB.voice; K.CB.voice = 0;
        const H = (jp, en) => lm === 'jp' ? '和 ' + jp : lm === 'en' ? en : '和 ' + jp + ' // ' + en;
        try {
            [[0, 'key3', H('キーの中', 'IN THE KEY') + ' · ' + key], [1, 'key7', H('キーの中、7th つき', 'IN THE KEY, WITH THE 7TH')]].forEach(([vi, g, head]) => { for (let d = 0; d < 7; d++) { let ns = K.chordNotes(pr, d, vi), nm = K.chordName(ns), q = nm.replace(/^[A-G]#?/, ''), rn = /^m|°/.test(q) ? K.ROMAN[d] + (q.indexOf('°') >= 0 ? '°' : '') : K.ROMAN[d].toUpperCase();
                out.push({ k: 'chord', id: g, name: rn + '  ' + nm, sub: head, notes: noteNames(ns), prog: [{ at: 0, len: 1, ns }], bars: 1 }); } });
            K.MOODS.forEach(m => { if (m.h) return; let sl = K.moodSlots(pr, m), n = K.slotCount(m), names = []; sl.forEach(q => { if (q.at % 1) names[names.length - 1] += ' / ' + q.name; else names.push(q.name); });
                out.push({ k: 'chord', id: 'prog', name: m[0], sub: H('進行', 'PROGRESSIONS') + ' · ' + n + (lm === 'jp' ? '小節' : ' bars'), notes: names.join(' → '), prog: sl.map(q => ({ at: q.at, len: q.len, ns: q.ns })), bars: n }); });
        } finally { K.CB.voice = v0; }
        RN.forEach((r, pc) => QS.forEach(([id, iv, sx]) => { let base = 48 + pc; if (base < 52) base += 12; let ns = iv.map(i => base + i);
            out.push({ k: 'chord', id: 'r' + pc, name: r + sx, sub: H(r + ' の全部のコード', 'EVERY CHORD ON ' + r), notes: noteNames(ns), prog: [{ at: 0, len: 1, ns }], bars: 1 }); }));
        return out;
    }
    function putChord(it, tr, at) {
        let pr = X.pr, V = X.V(), sig = pr.sig || 4, len = it.bars * sig, okTr = t => t && !t.isMaster && !NB.isBus(t) && NB.V[t.inst] && NB.V[t.inst].kind !== 'drum' && NB.V[t.inst].kind !== 'audio' && !t.fz;
        if (tr == null && at == null && X.tab && X.tab() === 'roll' && X.sel && X.sel.clip) { let t0 = X.selTr(), c = t0 && t0.clips.find(q => q.uid === X.sel.clip);
            if (c && okTr(t0)) { X.mark(); let a = X.chordKit ? X.chordKit.rollAt() : 0, L = c.lp > 0 ? c.lp : c.len; it.prog.forEach(q => { let t = a + q.at * sig, d = q.len * sig; if (t < L - 1e-6) q.ns.forEach(m => c.notes.push({ t, d: Math.min(d, L - t) * 0.98, m, v: 0.78 })); }); X.touch(); X.showDock(); X.flash(it.name + ' into the clip'); return; } }
        tr = okTr(tr) ? tr : at == null && tr == null && okTr(X.selTr()) ? X.selTr() : null;
        if (!tr) { tr = X.addTrack('haze'); if (!tr) return; }
        let a = at != null ? at : (V.cursor || 0), c = X.addClip(tr, a, len); c.name = it.name.replace(/^[ivxIVX°]+\s+/, '').slice(0, 24);
        it.prog.forEach(q => q.ns.forEach(m => c.notes.push({ t: q.at * sig, d: q.len * sig * 0.98, m, v: 0.78 })));
        X.pick(tr.uid, c.uid); X.touch(); X.flash(it.name.trim() + ' → ' + tr.name);
    }
    async function hearChord(it) {
        let L = X.live && X.live(); if (!L || !L.ctx) { if (X.eng) X.eng(); L = X.live && X.live(); } if (!L || !L.ctx || X.playing()) return;
        let t0 = X.selTr(), ok = t0 && !t0.isMaster && !NB.isBus(t0) && NB.V[t0.inst] && NB.V[t0.inst].kind === 'poly' && !t0.fz, my = ++pvN;
        let pr = NB.blankProject(); pr.bpm = 120; pr.loop.on = 0; let t = NB.newTrack(pr, ok ? t0.inst : 'haze'); if (ok) { t.snd = JSON.parse(JSON.stringify(t0.snd)); t.fx = []; } t.mix.room = 0.15;
        let c = NB.newClip(0, Math.max(2, it.bars * 2)); it.prog.forEach(q => q.ns.forEach(m => c.notes.push({ t: q.at * 2, d: q.len * 2 * 0.95, m, v: 0.72 }))); t.clips.push(c); pr.tracks.push(t);
        let buf; try { buf = (await NB.bounce(pr, { what: 'song', tail: 1.2 })).buf; } catch (e) { return; }
        if (my !== pvN) return;
        if (pvSrc) { try { pvSrc.stop(); } catch (e) {} }
        if (L.ctx.state === 'suspended') L.ctx.resume();
        let s2 = L.ctx.createBufferSource(), g = L.ctx.createGain(); s2.buffer = buf; g.gain.value = 0.9; s2.connect(g); g.connect(L.ctx.destination); s2.start(); pvSrc = s2;
    }
    const nice = it => ({ inst: 'double click = a new track · drag it onto the timeline', fx: 'double click = onto the picked track · drag it onto a track', pre: 'click = hear it · double click = onto the picked track if its the same instrument, else a new one', chord: 'click = hear it · drag it onto a track · double click = the picked track at the cursor', snd: 'click = hear it · double click = at the cursor · drag it onto the timeline', song: 'one of your songs in progress, kept in this browser. double click = open it (undo gets the one you had back)' })[it.k] + (it.k === 'snd' ? ' · right click = delete it' : '');

    async function use(it, tr, at) {
        let pr = X.pr, V = X.V();
        if (it.k === 'inst') { let t = X.addTrack(it.id); if (t && at != null) { V.cursor = at; } return; }
        if (it.k === 'fx') {
            tr = tr || X.selTr(); if (!tr) { X.flash('pick a track first'); return; }
            let list = tr.isMaster ? pr.master.fx : tr.fx;
            if (list.length >= X.lim().fx) { X.flash(X.lim().fx + ' plugins a track' + (X.has('nb_tape') ? '' : ' without the long tape')); return; }
            X.mark(); list.push(NB.newFx(it.id)); X.pick(tr.uid); X.touch(); X.setTab('rack'); X.flash(it.name + ' → ' + (tr.isMaster ? 'MASTER' : tr.name)); return;
        }
        if (it.k === 'pre') {
            let v = NB.V[it.id], p = it.mine != null ? (X.mine(it.id)[it.mine] || [it.name, {}]) : v.presets[it.i]; tr = tr || X.selTr();
            if (it.mine != null) { if (!tr || tr.isMaster || tr.inst !== it.id) { tr = X.addTrack(it.id); if (!tr) return; } X.loadMine(tr, it.mine); X.pick(tr.uid); X.setTab('sound'); return; }
            if (!tr || tr.isMaster || tr.inst !== it.id) { tr = X.addTrack(it.id); if (!tr) return; } else X.mark();
            Object.assign(tr.snd, v.def, JSON.parse(JSON.stringify(p[1]))); if (X.presetFx) X.presetFx(tr, tr.snd); tr.snd._pre = it.i; X.pick(tr.uid); X.touch(); X.setTab('sound'); X.flash(p[0]); X.hear(tr.uid, 60); return;
        }
        if (it.k === 'chord') { putChord(it, tr, at); return; }
        if (it.k === 'snd') { if (window.NBA) await NBA.place(it.id, tr, at != null ? at : (V.cursor || 0)); return; }
        if (it.k === 'song') { let s = X.kept()[it.i]; if (!s) return; X.mark(); if (X.playing()) X.stop(); X.swap(JSON.parse(JSON.stringify(s.pr))); X.flash('opened ' + s.name); }
    }
    X.browseDrop = (it, tr, at) => use(it, tr, at);

    function draw() {
        let V = X.V(); if (!V) return;
        let box = V.q('[data-brw]'); if (!box) return;
        box.innerHTML = ''; box.classList.toggle('shut', !B.open); if (X.place) X.place();
        let el = X.el;
        if (!B.open) { let o = X.btn('☰', 'sm', () => { B.open = true; keep(); draw(); }, 'open the browser (ctrl+b)'); box.appendChild(o); return; }
        let hd = el('div', 'nb-bh');
        let q = el('input', 'nb-in'); q.placeholder = 'find'; q.value = B.q; q.title = 'type to find anything in every list';
        q.addEventListener('keydown', e => e.stopPropagation());
        q.oninput = () => { B.q = q.value; list(); };
        hd.appendChild(q); hd.appendChild(X.btn('◀', 'sm', () => { B.open = false; keep(); draw(); }, 'tuck the browser away (ctrl+b)'));
        box.appendChild(hd);
        let cb = el('div', 'nb-bc');
        if (B.cat === 'snd' && !(B.sounds && B.sounds.length)) B.cat = 'inst';
        cats().forEach(([k, jp, en]) => { let b = el('button', 'nb-bcat' + (B.cat === k && !B.q ? ' on' : ''), jp + ' ' + en); b.type = 'button'; b.onclick = () => { B.cat = k; B.q = ''; keep(); if (k === 'snd') refreshSounds(); draw(); }; cb.appendChild(b); });
        box.appendChild(cb);
        let ls = el('div', 'nb-bl'); ls.dataset.bl = ''; box.appendChild(ls);
        list();
    }
    function list() {
        let V = X.V(); if (!V) return;
        let ls = V.q('[data-bl]'); if (!ls) return; ls.innerHTML = '';
        let el = X.el, q = B.q.trim().toLowerCase(), all = [];
        if (q) cats().forEach(([k, jp]) => items(k).forEach(it => { if ((it.name + ' ' + it.sub).toLowerCase().indexOf(q) >= 0) all.push(Object.assign({ tag: jp }, it)); }));
        else all = items(B.cat);
        if (!all.length) ls.appendChild(el('div', 'nb-hint', q ? 'nothing called that' : B.cat === 'song' ? 'nothing in progress yet. BOUNCE + FILES → KEEP saves the song youre on, here, in this browser' : 'nothing'));
        let lastSub = null, shut = false, here = X.selTr(), cur = here && !here.isMaster ? here.inst : null;
        all.slice(0, 600).forEach(it => {
            if ((it.k === 'pre' || it.k === 'chord') && !q && it.sub !== lastSub) {
                lastSub = it.sub; let fk = it.k === 'chord' ? 'ch:' + it.id : it.id, open = B.fold[fk] != null ? !!B.fold[fk] : it.k === 'chord' ? it.id === 'key3' : it.id === cur, n = all.filter(o => o.id === it.id).length;
                let hd = el('div', 'nb-bsub nb-bfold', (open ? '▾ ' : '▸ ') + it.sub + '  ' + n); hd.title = 'open / shut';
                hd.onclick = () => { B.fold[fk] = open ? 0 : 1; keep(); list(); }; if (it.k === 'chord') hd.dataset.nolang = 1; ls.appendChild(hd); shut = !open;
                if (open && it.id === 'maw') ls.appendChild(el('div', 'nb-bnote', '喰 these shape a sound you load. heard on the picked MAW\'s sound, or your newest one'));
            }
            if ((it.k === 'pre' || it.k === 'chord') && !q && shut) return;
            let d = el('div', 'nb-bi' + (it.lk ? ' lk' : '')); d.draggable = !it.lk;
            { let nb = el('b', '', (it.tag ? it.tag + ' ' : '') + it.name); if (it.k === 'chord') nb.dataset.nolang = 1; d.appendChild(nb); }
            if (it.k === 'chord') { let sm = el('small', '', it.notes); sm.dataset.nolang = 1; d.appendChild(sm); } else if (it.k !== 'pre' || q) d.appendChild(el('small', '', it.sub));
            d.title = nice(it);
            d.addEventListener('dblclick', () => use(it));
            if (it.k === 'pre' && !it.lk) d.addEventListener('click', () => preview(it));
            if (it.k === 'chord') d.addEventListener('click', () => hearChord(it));
            if (it.k === 'snd') { d.addEventListener('click', () => { if (window.NBA) NBA.previewId(it.id); }); d.addEventListener('contextmenu', e => { e.preventDefault(); soundMenu(e.clientX, e.clientY, it); }); }
            d.addEventListener('dragstart', e => { e.dataTransfer.setData('text/x-nb', JSON.stringify(it)); e.dataTransfer.effectAllowed = 'copy'; });
            ls.appendChild(d);
        });
        if (B.cat === 'snd' && !q && B.sounds && B.sounds.length) {
            let tot = B.sounds.reduce((a, s) => a + (s.size || 0), 0), row = el('div', 'nb-bfoot');
            row.appendChild(el('small', '', B.sounds.length + ' sounds · ' + kb(tot) + ' in this browser'));
            let w = X.btn('WIPE ALL SOUNDS', 'sm'); w.title = 'deletes every sound kept in this browser (click twice). clips that use them go quiet. export a .noise first if you want them'; w.onclick = X.sure(w, async () => { let n = await NBA.wipe(); B.sounds = []; X.dirty(); draw(); X.flash(n + ' sounds gone from this browser'); });
            row.appendChild(w); ls.appendChild(row);
        }
        if (B.cat === 'pre' && !q && X.exportMine) {
            let n = NB.VOICES.reduce((t, v) => t + X.mine(v.id).length, 0), row = el('div', 'nb-bfoot');
            row.appendChild(el('small', '', n ? n + ' of your own (★), kept in this browser' : 'keep your own with ✚ KEEP on any sound'));
            row.appendChild(X.btn('⇩ EXPORT YOURS', 'sm', () => X.exportMine(), 'every preset youve kept, out to one .json file'));
            row.appendChild(X.btn('⇧ IMPORT', 'sm', () => X.importMine(), 'bring presets back in from a file (adds to yours, same name = the file wins)'));
            ls.appendChild(row);
        }
    }
    const PV = new Map(); let pvSrc = null, pvN = 0;
    async function preview(it) {
        let L = X.live && X.live(); if (!L || !L.ctx) { if (X.eng) X.eng(); L = X.live && X.live(); } if (!L || !L.ctx || X.playing()) return;
        let food = null;
        if (it.id === 'maw') {
            let pk = X.selTr && X.selTr(); food = pk && pk.inst === 'maw' && pk.snd.smp ? pk.snd.smp : null;
            if (!food && window.NBA) { let l = B.sounds && B.sounds.length ? B.sounds : await NBA.list().catch(() => []); let r = (l || []).filter(q => !q.made)[0] || (l || [])[0]; if (r) food = { id: r.id, name: r.name, root: 261.63 }; }
            if (!food) { X.flash('MAW plays a sound you load, it has none of its own: LOAD one (or drop one on the timeline), then its presets shape it'); return; }
            if (window.NBA) { let e = await NBA.load(food.id).catch(() => null); if (!e || e.state !== 'ok') return; }
        }
        let key = it.id + ':' + it.i + (food ? ':' + food.id : ''), my = ++pvN, buf = PV.get(key);
        if (!buf) {
            let v = NB.V[it.id], pr = NB.blankProject(); pr.bpm = 120; pr.loop.on = 0; pr.root = X.pr.root || 0; pr.scale = X.pr.scale || 'minor';
            let t = NB.newTrack(pr, it.id), c = NB.newClip(0, 4); c.lp = 0; Object.assign(t.snd, v.def, it.mine != null ? JSON.parse(JSON.stringify((X.mine(it.id)[it.mine] || ['', {}])[1])) : JSON.parse(JSON.stringify(v.presets[it.i][1]))); if (X.presetFx) X.presetFx(t, t.snd); if (food) t.snd.smp = food; t.mix.room = 0.15; t.human = 0;
            const N = (b, d, m, vv) => c.notes.push({ t: b, d, m, v: vv == null ? 0.85 : vv });
            if (v.kind === 'drum') { N(0, 0.4, 60); N(1, 0.4, 60, 0.6); N(1.5, 0.4, 60, 0.75); }
            else if (v.kind === 'mono') { [[0, 45], [0.75, 45], [1.5, 48], [2.25, 43]].forEach(([b, m]) => N(b, 0.5, m)); }
            else { [57, 60, 64].forEach(m => N(0, 1.6, m, 0.7)); N(2, 0.45, 69); N(2.5, 0.45, 67); N(3, 0.9, 64); }
            t.clips.push(c); pr.tracks.push(t);
            try { buf = (await NB.bounce(pr, { what: 'song', tail: 1.2 })).buf; PV.set(key, buf); } catch (e) { return; }
            if (my !== pvN) return;
        }
        if (pvSrc) { try { pvSrc.stop(); } catch (e) {} }
        if (L.ctx.state === 'suspended') L.ctx.resume();
        let s = L.ctx.createBufferSource(), g = L.ctx.createGain(); s.buffer = buf; g.gain.value = 0.9; s.connect(g); g.connect(L.ctx.destination); s.start(); pvSrc = s;
    }
    function uses(id) { let n = 0; (X.allSongs ? X.allSongs() : [X.pr]).forEach(pr => (pr.tracks || []).forEach(t => (t.clips || []).forEach(c => { if (c.src === id) n++; }))); return n; }
    function soundMenu(x, y, it) {
        let n = uses(it.id);
        X.menu(x, y, [{ head: it.name }, ['hear it', () => NBA.previewId(it.id)], ['put it at the cursor', () => use(it)],
            '-', [n ? 'delete it (' + n + ' clip' + (n > 1 ? 's use' : ' uses') + ' it, they go quiet)' : 'delete it from this browser', () => { if (n) X.menu(x, y, [{ head: 'sure? theres no undo for this one' }, ['yes, delete it', del], ['no, keep it', () => {}]]); else del(); }]]);
        async function del() { await NBA.remove(it.id); B.sounds = (B.sounds || []).filter(s => s.id !== it.id); X.dirty(); draw(); X.flash(it.name + ' deleted'); }
    }
    function refreshSounds() { if (!window.NBA) return; NBA.list().then(l => { B.sounds = l; refreshCats(); if (B.cat === 'snd' || B.q) list(); }).catch(() => {}); }
    X.browse = () => { if (B.sounds == null) refreshSounds(); draw(); };
    function refreshCats() { let V = X.V(); if (V && V.q('[data-brw] .nb-bc') && V.q('[data-brw] .nb-bc').children.length !== cats().length) draw(); }
    X.browseToggle = () => { B.open = !B.open; keep(); draw(); };
    X.browseSounds = refreshSounds;
})();
