// files/. everything you make on here in one place
// it doesnt keep anything itself, it just goes through every apps drawer
window.os = window.os || {};

(function () {
    const $ = id => document.getElementById(id);
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const T = (k, d) => (typeof siteText !== 'undefined' && siteText[k]) || d;
    const sfx = (n, el) => { if (os.sfx) os.sfx(n, el ? { el } : undefined); };
    const LS = (k, d) => { try { let v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
    const LSraw = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
    const LSput = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
    const kb = n => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(n < 10240 ? 1 : 0) + ' KB' : (n / 1048576).toFixed(1) + ' MB';
    const when = t => { if (!t) return '—'; let d = new Date(t), p = n => String(n).padStart(2, '0'); return d.getFullYear() + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); };
    const bytes = s => new Blob([String(s || '')]).size;
    const wait = (test, ms) => new Promise((ok, no) => { let t0 = performance.now(); (function f() { let v; try { v = test(); } catch (e) {} if (v) return ok(v); if (performance.now() - t0 > (ms || 9000)) return no(); setTimeout(f, 70); })(); });
    function download(blob, name) { let a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }
    const safe = s => String(s || 'untitled').replace(/[\\/:*?"<>|]+/g, '_').trim().slice(0, 60) || 'untitled';

    const FOLDERS = [
        { id: 'recent', icon: '🕒', jp: '最近', en: 'recent' },
        { id: 'docs', icon: '📄', jp: '書類', en: 'docs' },
        { id: 'pics', icon: '🖼', jp: '画像', en: 'images' },
        { id: 'media', icon: '🔊', jp: 'メディア', en: 'media' },
        { id: 'games', icon: '🏆', jp: 'ゲーム', en: 'games' },
        { id: 'sys', icon: '💾', jp: 'システム', en: 'system' },
        { id: 'bin', icon: '🗑', jp: 'ゴミ箱', en: 'bin' }
    ];
    const EMPTY = {
        recent: ['filesEmptyRecent', 'まだ何もない // nothing yet'],
        docs: ['filesEmptyDocs', 'メモなし // no notes'],
        pics: ['filesEmptyPics', '絵なし // no pictures'],
        media: ['filesEmptyMedia', 'しーん… // quiet'],
        games: ['filesEmptyGames', '記録なし // no scores'],
        sys: ['filesEmptySys', '…'],
        bin: ['filesEmptyBin', '空っぽ // empty']
    };

    const NOTES = 'vmp_notes', NB = 'vmp_noisebox3';
    const notesDb = () => { let s = LS(NOTES, null); return s && Array.isArray(s.notes) ? s : { notes: [] }; };
    const nbDb = () => { let d = LS(NB, null); return d && typeof d === 'object' ? d : { saves: [] }; };
    const kept = () => os.noisebox && os.noisebox.kept ? os.noisebox.kept() : (nbDb().saves || []);

    function nbIdb() {
        return new Promise((ok, no) => {
            try { let q = indexedDB.open('vmp_noisebox', 1); q.onupgradeneeded = () => { if (!q.result.objectStoreNames.contains('sounds')) q.result.createObjectStore('sounds', { keyPath: 'id' }); }; q.onsuccess = () => ok(q.result); q.onerror = () => no(q.error); } catch (e) { no(e); }
        });
    }
    const sndRun = (mode, fn) => nbIdb().then(d => new Promise((ok, no) => { let t = d.transaction('sounds', mode), r = fn(t.objectStore('sounds')), out; if (r) r.onsuccess = () => { out = r.result; }; t.oncomplete = () => { ok(out); d.close(); }; t.onerror = () => no(t.error); }));
    const extOf = type => (/wav/.test(type) ? '.wav' : /mpeg|mp3/.test(type) ? '.mp3' : /ogg/.test(type) ? '.ogg' : /webm/.test(type) ? '.webm' : /mp4|m4a|aac/.test(type) ? '.m4a' : /flac/.test(type) ? '.flac' : '.wav');

    function openPaint() { os.summon('paint.exe'); return wait(() => os.paintPro && os.paintUI && document.querySelector('#win-paint\\.exe canvas') && os.paintPro); }
    function openGames() { let fresh = !$('win-games.exe'); os.summon('games.exe'); return wait(() => os.gg && os.gg.open && $('gg-home')).then(() => { if (fresh && os.gg.skip) os.gg.skip(); return new Promise(r => setTimeout(r, fresh ? 500 : 0)); }); }

    const KINDS = {
        note: {
            ext: '.txt', icon: '🗒', folder: 'docs', ren: true,
            open: it => os.notes ? os.notes.open(it.raw.id) : os.summon('notes.txt'),
            dl: it => download(new Blob([it.raw.body || ''], { type: 'text/plain' }), safe(it.name) + '.txt'),
            bin(it) { let s = notesDb(); s.notes = s.notes.filter(n => n.id !== it.raw.id); LSput(NOTES, s); return it.raw; },
            back(d) { let s = notesDb(); if (s.notes.some(n => n.id === d.id)) d.id = 'n' + Date.now().toString(36); s.notes.push(d); LSput(NOTES, s); },
            rename(it, nm) { let s = notesDb(), n = s.notes.find(x => x.id === it.raw.id); if (n) { n.title = nm.slice(0, 60); LSput(NOTES, s); } }
        },
        tape: {
            ext: '.txt', icon: '📟', folder: 'docs',
            open: () => os.summon('calc.exe'),
            dl: it => download(new Blob([it.text + '\n'], { type: 'text/plain' }), 'calc_tape.txt')
        },
        wip: {
            ext: '.vpaint', icon: '🎨', folder: 'pics', ren: true,
            open: it => { let was = !!$('win-paint.exe'); openPaint().then(P => P.openProject(new File([it.raw.blob], safe(it.name) + '.vpaint'), !was)).catch(() => {}); },
            dl: it => download(it.raw.blob, safe(it.name) + '.vpaint'),
            bin(it) { os.files.drop(it.raw.id); return it.raw; }, back: d => os.files.put(d), rename: (it, nm) => os.files.rename(it.raw.id, nm)
        },
        img: {
            ext: '.png', icon: '🖼', folder: 'pics', ren: true,
            open: it => openPaint().then(() => os.paintUI.open(new File([it.raw.blob], safe(it.name) + extOfImg(it.raw.type), { type: it.raw.type || 'image/png' }))).catch(() => {}),
            dl: it => download(it.raw.blob, safe(it.name) + extOfImg(it.raw.type)),
            bin(it) { os.files.drop(it.raw.id); return it.raw; }, back: d => os.files.put(d), rename: (it, nm) => os.files.rename(it.raw.id, nm)
        },
        flip: {
            ext: '.vflip', icon: '📒', folder: 'media', ren: true,
            open(it) {
                let f = new File([it.raw.blob], safe(it.name) + '.vflip');
                openGames().then(() => {
                    let h = os.gg.hooks && os.gg.hooks.flip;
                    if (os.gg.now && os.gg.now() === 'flip' && h && h.load) h.load(f);
                    else { os.gg.pending = { game: 'flip', file: f }; os.gg.open('flip'); }
                }).catch(() => {});
            },
            dl: it => download(it.raw.blob, safe(it.name) + '.vflip'),
            bin(it) { os.files.drop(it.raw.id); return it.raw; }, back: d => os.files.put(d), rename: (it, nm) => os.files.rename(it.raw.id, nm)
        },
        song: {
            ext: '.noise', icon: '🎹', folder: 'media',
            open: it => { os.summon('noisebox.exe'); wait(() => os.noisebox && os.noisebox.openKept && $('win-noisebox.exe')).then(N => setTimeout(() => N.openKept(it.raw.name), 120)).catch(() => {}); },
            dl: it => download(new Blob([JSON.stringify(it.raw.pr)], { type: 'application/json' }), safe(it.name) + '.noise'),
            bin(it) {
                if (os.noisebox && os.noisebox.unkeep) return os.noisebox.unkeep(it.raw.name) || it.raw;
                let d = nbDb(); d.saves = (d.saves || []).filter(s => s.name !== it.raw.name); LSput(NB, d); return it.raw;
            },
            back(d) {
                if (os.noisebox && os.noisebox.rekeep) return os.noisebox.rekeep(d);
                let db = nbDb(); db.saves = (db.saves || []).filter(s => s.name !== d.name); db.saves.unshift(d); LSput(NB, db);
            }
        },
        live: {
            ext: '.noise', icon: '🎹', folder: 'media',
            open: () => os.summon('noisebox.exe'),
            dl: it => download(new Blob([JSON.stringify(it.raw)], { type: 'application/json' }), safe(it.name) + '.noise')
        },
        sound: {
            ext: '.wav', icon: '🔊', folder: 'media',
            open: () => { os.summon('noisebox.exe'); },
            dl: it => download(it.raw.blob, safe(it.name.replace(/\.[a-z0-9]+$/i, '')) + extOf(it.raw.type || '')),
            bin(it) { sndRun('readwrite', s => s.delete(it.raw.id)).catch(() => {}); return it.raw; },
            back: d => sndRun('readwrite', s => s.put(d))
        },
        score: {
            ext: '.sav', icon: '🏆', folder: 'games',
            open: () => openGames().then(() => { if (os.gg.sys) os.gg.sys('scores'); }).catch(() => {}),
            dl: it => download(new Blob([it.raw.map(b => '# ' + b.t + '\n' + (b.rows || []).map(r => [].concat(r).join('\t')).join('\n')).join('\n\n') + '\n'], { type: 'text/plain' }), it.name + '.sav.txt')
        },
        cfg: {
            ext: '.cfg', icon: '⚙', folder: 'sys',
            open: () => os.summon('settings'),
            dl: it => download(new Blob([it.text + '\n'], { type: 'text/plain' }), it.name + it.ext)
        }
    };
    const extOfImg = t => /jpeg/.test(t || '') ? '.jpg' : /webp/.test(t || '') ? '.webp' : '.png';

    async function gather() {
        let out = [], add = (kind, o) => out.push(Object.assign({ kind, folder: KINDS[kind].folder, ext: KINDS[kind].ext, icon: KINDS[kind].icon }, o));
        notesDb().notes.forEach(n => add('note', { key: 'note:' + n.id, name: n.title || 'new note', at: n.at, size: bytes(n.body), raw: n, sub: (String(n.body || '').trim().split('\n')[0] || '').slice(0, 60), pin: !!n.pin }));
        let calc = LS('vmp_calc', null);
        if (calc && Array.isArray(calc.tape) && calc.tape.length) { let txt = calc.tape.slice().reverse().map(r => r.e + ' = ' + r.v).join('\n'); add('tape', { key: 'tape', name: 'calc_tape', at: calc.tape[0].t, size: bytes(txt), text: txt, sub: calc.tape.length + ' sums' }); }
        kept().forEach(s => { let pr = s.pr || {}; add('song', { key: 'song:' + s.name, name: s.name, at: s.at, size: bytes(JSON.stringify(pr)), raw: s, sub: (pr.bpm || '?') + ' bpm · ' + ((pr.tracks || []).length) + ' tracks' }); });
        let nb = nbDb(); if (nb.cur && (nb.cur.tracks || []).some(t => (t.clips || []).length)) add('live', { key: 'live', name: (nb.cur.name || 'untitled') + ' (open)', at: nb.cur.at || 0, size: bytes(JSON.stringify(nb.cur)), raw: nb.cur, sub: T('filesLiveSub', 'open in noisebox') });
        try {
            let snds = await sndRun('readonly', s => s.getAll());
            (snds || []).forEach(r => add('sound', { key: 'snd:' + r.id, name: String(r.name || 'sound').replace(/\.(wav|mp3|ogg|webm|m4a|flac|aac)$/i, ''), ext: extOf(r.type || ''), at: r.at, size: r.blob ? r.blob.size : 0, raw: r, sub: r.made ? T('filesRecorded', 'recorded') : T('filesUploaded', 'uploaded') }));
        } catch (e) {}
        if (os.files) (await os.files.all()).forEach(r => {
            let k = r.kind === 'vpaint' ? 'wip' : r.kind === 'vflip' ? 'flip' : r.kind === 'img' ? 'img' : null; if (!k) return;
            add(k, { key: 'f:' + r.id, name: r.name, at: r.at, size: r.size, raw: r, thumb: r.thumb, ext: k === 'img' ? extOfImg(r.type) : KINDS[k].ext,
                sub: k === 'flip' ? (r.frames || '?') + ' frames · ' + (r.fps || '?') + 'fps' + (r.snd ? ' · ♪' : '') : (r.w ? r.w + '×' + r.h : '') + (k === 'wip' ? ' · layers' : '') });
        });
        let sc = LS('vmp_gg_scores', {}), games = (typeof appsDB !== 'undefined' && appsDB.games) || [];
        Object.keys(sc || {}).forEach(id => { if (!Array.isArray(sc[id]) || !sc[id].length) return; let g = games.find(x => x.id === id) || {}; add('score', { key: 'score:' + id, name: id, icon: g.icon || '🏆', at: 0, size: bytes(JSON.stringify(sc[id])), raw: sc[id], sub: (g.name || id) + (g.jp ? ' // ' + g.jp : '') }); });
        // read only. change them in the bios
        const cfg = (name, ext, text, sub) => add('cfg', { key: 'cfg:' + name, name, ext, at: 0, size: bytes(text), text, sub });
        let th = LSraw('vmp_theme') || 'pink';
        cfg('theme', '.cfg', 'theme = ' + th, th);
        let pf = LS('vmp_prefs', {}); cfg('prefs', '.cfg', Object.keys(pf).map(k => k + ' = ' + JSON.stringify(pf[k])).join('\n') || '(defaults)', Object.keys(pf).length + ' set');
        let v = +LSraw('vmp_visits') || 1; cfg('visits', '.log', T('filesVisits', 'been here {n} times').replace('{n}', v), v + '×');
        let c = +LSraw('vmp_corners') || 0; cfg('corners', '.log', T('filesCorners', 'corners hit: {n}').replace('{n}', c), c + ' hits');
        let br = LS('vmp_paint_brush', null); if (br && Array.isArray(br.mine) && br.mine.length) cfg('brushes', '.cfg', br.mine.map(b => '- ' + (b.name || b.n || 'brush')).join('\n'), br.mine.length + ' brushes');
        let keys = []; try { for (let i = 0; i < localStorage.length; i++) { let k = localStorage.key(i); if (/^vmp_/.test(k)) keys.push([k, (localStorage.getItem(k) || '').length]); } } catch (e) {}
        keys.sort((a, b) => b[1] - a[1]);
        // console.log(keys)
        cfg('everything', '.sys', keys.map(([k, n]) => k.padEnd(22) + kb(n)).join('\n'), keys.length + ' keys');
        return out;
    }

    const ST = { folder: 'recent', sel: null, q: '', view: 'grid', sort: 'at', dir: -1, items: [], bin: [], seen: 0, ren: null };
    try { let s = JSON.parse(localStorage.getItem('vmp_files_ui') || '{}'); if (s.view) ST.view = s.view; if (s.folder) ST.folder = s.folder; ST.seen = +s.seen || 0; } catch (e) {}
    const keepUi = () => { try { localStorage.setItem('vmp_files_ui', JSON.stringify({ view: ST.view, folder: ST.folder, seen: ST.seen })); } catch (e) {} };
    let lastSeen = ST.seen;

    function shown() {
        let list = ST.folder === 'bin' ? ST.bin : ST.folder === 'recent' ? ST.items.filter(i => i.at && i.kind !== 'cfg' && i.kind !== 'score').sort((a, b) => b.at - a.at).slice(0, 40) : ST.items.filter(i => i.folder === ST.folder);
        if (ST.q) { let q = ST.q.toLowerCase(); list = (ST.folder === 'recent' ? ST.items : list).filter(i => (i.name + ' ' + (i.sub || '') + ' ' + i.ext).toLowerCase().includes(q)); }
        if (ST.folder !== 'recent' || ST.q) list = list.slice().sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || (ST.sort === 'name' ? String(a.name).localeCompare(String(b.name)) * -ST.dir : ((a[ST.sort] || 0) - (b[ST.sort] || 0)) * ST.dir));
        return list;
    }
    async function refresh(keepSel) {
        let all = await gather(), bin = os.files ? await os.files.bin.all() : [];
        ST.items = all;
        ST.bin = bin.sort((a, b) => b.at - a.at).map(r => ({ key: 'bin:' + r.id, kind: 'binned', folder: 'bin', name: r.name, ext: (KINDS[r.kind] || {}).ext || '', icon: (KINDS[r.kind] || {}).icon || '📄', at: r.at, size: r.size || 0, raw: r, thumb: r.data && r.data.thumb, sub: T('filesBinnedFrom', 'from {f}').replace('{f}', ((FOLDERS.find(f => f.id === (KINDS[r.kind] || {}).folder) || {}).en || '?') + '/') }));
        if (!keepSel || !shown().some(i => i.key === ST.sel)) ST.sel = null;
        draw();
    }

    function draw() {
        let r = $('fx-root'); if (!r) return;
        let F = FOLDERS.find(f => f.id === ST.folder) || FOLDERS[0], list = shown(), sel = list.find(i => i.key === ST.sel);
        let count = id => id === 'bin' ? ST.bin.length : id === 'recent' ? 0 : ST.items.filter(i => i.folder === id).length;
        let side = FOLDERS.map(f => `<button class="fx-f${f.id === ST.folder ? ' on' : ''}${f.id === 'bin' && ST.bin.length ? ' full' : ''}" data-f="${f.id}"><i class="fx-ic" data-em="${f.icon}"></i><span>${esc(f.jp)} <em>// ${esc(f.en)}</em></span>${count(f.id) ? '<b>' + count(f.id) + '</b>' : ''}</button>`).join('');
        let total = list.reduce((n, i) => n + (i.size || 0), 0);
        let body;
        if (!list.length) { let e = EMPTY[ST.folder] || EMPTY.recent; body = `<div class="fx-empty"><i class="fx-ic big" data-em="${F.icon}"></i><p>${esc(ST.q ? T('filesNoHits', 'nothing called that') : T(e[0], e[1]))}</p></div>`; }
        else if (ST.view === 'list') {
            const hd = (k, l) => `<button data-sort="${k}" class="${ST.sort === k ? 'on' : ''}">${l}${ST.sort === k ? (ST.dir < 0 ? ' ▾' : ' ▴') : ''}</button>`;
            body = `<div class="fx-list"><div class="fx-lh">${hd('name', '名前 // name')}${hd('size', 'size')}${hd('at', '日付 // date')}</div>` + list.map(i => `<button class="fx-row${i.key === ST.sel ? ' on' : ''}${isNew(i) ? ' new' : ''}" data-k="${esc(i.key)}"><span class="fx-nm"><i class="fx-ic sm" data-em="${i.icon}"></i>${nameHtml(i)}</span><span>${kb(i.size || 0)}</span><span>${esc(when(i.at))}</span></button>`).join('') + '</div>';
        } else body = '<div class="fx-grid">' + list.map(i => `<button class="fx-tile k-${i.kind === 'binned' ? i.raw.kind : i.kind}${i.key === ST.sel ? ' on' : ''}${isNew(i) ? ' new' : ''}${i.thumb ? ' th' : ''}" data-k="${esc(i.key)}" title="${esc(i.name + i.ext)}">${i.thumb ? `<img src="${esc(i.thumb)}" alt="" draggable="false">` : `<i class="fx-ic" data-em="${i.icon}"></i>`}<span>${nameHtml(i)}</span></button>`).join('') + '</div>';
        r.innerHTML = `<div class="fx">
            <div class="fx-top">
                <button class="fx-vw" data-view title="grid / list">${ST.view === 'grid' ? '▦' : '☰'}</button>
                <div class="fx-addr"><span>files/${ST.folder === 'recent' ? '' : esc(F.en) + '/'}</span></div>
                <input class="fx-q" data-q placeholder="探す // search" value="${esc(ST.q)}" aria-label="search">
            </div>
            <div class="fx-mid">
                <nav class="fx-side">${side}</nav>
                <div class="fx-main" tabindex="0">${body}</div>
                <aside class="fx-pv">${pvShell(sel)}</aside>
            </div>
            <div class="fx-foot"><span>${list.length} ${list.length === 1 ? 'item' : 'items'} · ${kb(total)}</span><span class="fx-disk" id="fx-disk"></span><span class="fx-fine">${esc(T('filesFine', 'この端末だけ // only on this machine'))}</span></div>
        </div>`;
        wire(r);
        if (sel) fillPv(sel);
        disk();
        if (ST.ren) { let inp = r.querySelector('.fx-ren'); if (inp) { inp.focus(); inp.select(); } }
    }
    const isNew = i => i.at && i.at > lastSeen && ST.folder !== 'bin' && lastSeen > 0;
    const nameHtml = i => ST.ren === i.key ? `<input class="fx-ren" value="${esc(i.name)}" maxlength="60" spellcheck="false">` : esc(i.name) + `<small>${esc(i.ext)}</small>`;
    function pvShell(i) {
        if (!i) return `<div class="fx-pv-none">${esc(T('filesPick', 'なにか選んで // pick something'))}</div>`;
        let K = KINDS[i.kind] || {}, b = i.kind === 'binned';
        let acts = b ? `<button data-a="back">${esc(T('filesBack', '戻す // put back'))}</button><button data-a="gone" class="warn">${esc(T('filesGone', '消す // delete for good'))}</button>`
            : `<button data-a="open" class="big">${esc(T('filesOpen', '開く // open'))}</button><button data-a="dl">↓ ${esc(T('filesDl', '保存 // download'))}</button>${K.ren ? `<button data-a="ren">${esc(T('filesRen', '名前変更 // rename'))}</button>` : ''}${K.bin ? `<button data-a="bin" class="warn">${esc(T('filesBin', 'ゴミ箱へ // bin it'))}</button>` : ''}`;
        return `<div class="fx-pvbox" id="fx-pvbox"></div><h4>${esc(i.name)}<small>${esc(i.ext)}</small></h4><p class="fx-sub">${esc(i.sub || '')}</p><dl><dt>size</dt><dd>${kb(i.size || 0)}</dd><dt>${b ? 'binned' : 'date'}</dt><dd>${esc(when(i.at))}</dd></dl><div class="fx-acts">${acts}</div>`;
    }
    let pvStop = null;
    function fillPv(i) {
        if (pvStop) { pvStop(); pvStop = null; }
        let box = $('fx-pvbox'); if (!box) return;
        let k = i.kind === 'binned' ? i.raw.kind : i.kind, raw = i.kind === 'binned' ? i.raw.data : i.raw;
        const pre = t => { let p = document.createElement('pre'); p.textContent = String(t || '').slice(0, 3000) || '(empty)'; box.appendChild(p); };
        if (k === 'note') pre(raw.body);
        else if (k === 'tape' || k === 'cfg') pre(i.text);
        else if (k === 'img' || k === 'wip') { let im = new Image(); im.alt = ''; let u = k === 'img' && raw.blob ? URL.createObjectURL(raw.blob) : raw.thumb; im.src = u; box.appendChild(im); if (k === 'img') pvStop = () => URL.revokeObjectURL(u); }
        else if (k === 'flip') flipPv(box, raw);
        else if (k === 'sound') soundPv(box, raw);
        else if (k === 'song' || k === 'live') songPv(box, k === 'song' ? raw.pr : raw);
        else if (k === 'score') box.innerHTML = raw.map(b => `<b>${esc(b.t)}</b><ol>${(b.rows || []).slice(0, 5).map(r => '<li>' + [].concat(r).map(c => '<span>' + esc(c) + '</span>').join('') + '</li>').join('')}</ol>`).join('');
        else box.innerHTML = `<i class="fx-ic big" data-em="${i.icon}"></i>`;
    }
    // flipbooks play in the little box bc why not
    function flipPv(box, raw) {
        let im = new Image(); im.alt = ''; im.src = raw.thumb || ''; box.appendChild(im);
        let dead = false, tm = 0;
        pvStop = () => { dead = true; clearTimeout(tm); };
        if (!raw.blob) return;
        raw.blob.text().then(t => JSON.parse(t)).then(d => {
            if (dead || !d || !Array.isArray(d.frames)) return;
            let bg = ['#f4efe2', '#ffffff', '#16121c'][d.paper] || '#f4efe2', i = 0, fps = Math.max(1, Math.min(30, +d.fps || 8));
            box.style.background = bg;
            const step = () => { if (dead) return; im.src = d.frames[i % d.frames.length]; i++; if (d.loop !== false || i < d.frames.length) tm = setTimeout(step, 1000 / fps); };
            step();
        }).catch(() => {});
    }
    function soundPv(box, raw) {
        let c = document.createElement('canvas'); c.width = 240; c.height = 56; c.className = 'fx-wave'; box.appendChild(c);
        let a = document.createElement('audio'); a.controls = true; a.preload = 'none'; let u = URL.createObjectURL(raw.blob); a.src = u; box.appendChild(a);
        pvStop = () => { a.pause(); URL.revokeObjectURL(u); };
        let O = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!O || !raw.blob) return;
        raw.blob.arrayBuffer().then(ab => new O(1, 1, 44100).decodeAudioData(ab)).then(buf => {
            let d = buf.getChannelData(0), x = c.getContext('2d'), W = c.width, H = c.height, step = Math.max(1, Math.floor(d.length / W));
            x.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--neon-secondary').trim() || '#0ff';
            for (let i = 0; i < W; i++) { let m = 0; for (let j = i * step; j < Math.min(d.length, (i + 1) * step); j++) { let v = Math.abs(d[j]); if (v > m) m = v; } let h = Math.max(1, m * H * 0.9); x.fillRect(i, (H - h) / 2, 1, h); }
        }).catch(() => {});
    }
    function songPv(box, pr) {
        pr = pr || {};
        let tr = (pr.tracks || []).slice(0, 10), c = document.createElement('canvas'); c.width = 240; c.height = Math.max(24, tr.length * 9 + 6); c.className = 'fx-roll'; box.appendChild(c);
        let x = c.getContext('2d'), end = 1;
        tr.forEach(t => (t.clips || []).forEach(k => { end = Math.max(end, (+k.at || 0) + (+k.len || 0)); }));
        let cols = ['#ff5fa2', '#5cc8ff', '#ffd04a', '#6dffa0', '#bd8cff', '#ff8a4a'];
        tr.forEach((t, n) => { x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(0, 3 + n * 9, 240, 7); x.fillStyle = t.color || cols[n % cols.length]; (t.clips || []).forEach(k => x.fillRect((+k.at || 0) / end * 240, 3 + n * 9, Math.max(2, (+k.len || 1) / end * 240 - 1), 7)); });
        let p = document.createElement('p'); p.className = 'fx-sub'; p.textContent = (pr.bpm || '?') + ' bpm · ' + tr.length + ' tracks' + ((pr.tracks || []).length > 10 ? ' (+' + ((pr.tracks || []).length - 10) + ')' : ''); box.appendChild(p);
    }
    async function disk() {
        let d = $('fx-disk'); if (!d || !navigator.storage || !navigator.storage.estimate) return;
        try { let e = await navigator.storage.estimate(); if (!$('fx-disk')) return; let k = e.quota ? e.usage / e.quota : 0; d.innerHTML = `<i><b style="width:${Math.max(1, Math.min(100, k * 100)).toFixed(1)}%"></b></i>${kb(e.usage || 0)}`; d.title = kb(e.usage || 0) + ' / ' + kb(e.quota || 0); } catch (e) {}
    }

    const cur = () => shown().find(i => i.key === ST.sel);
    function act(a, i) {
        i = i || cur(); if (!i) return;
        let K = KINDS[i.kind] || {};
        if (a === 'open') { if (K.open) { sfx('click'); K.open(i); markSeen(); } }
        if (a === 'dl' && K.dl) { sfx('click'); K.dl(i); }
        if (a === 'ren' && K.ren) { ST.ren = i.key; draw(); }
        if (a === 'bin' && K.bin) {
            let data = K.bin(i); sfx('binIn');
            if (os.files) os.files.bin.put({ kind: i.kind, name: i.name, size: i.size, data }).then(() => refresh());
            else refresh();
        }
        if (a === 'back' && i.kind === 'binned') { let B = KINDS[i.raw.kind]; Promise.resolve(B && B.back ? B.back(i.raw.data) : 0).then(() => os.files.bin.drop(i.raw.id)).then(() => { sfx('binOut'); refresh(); }); }
        if (a === 'gone' && i.kind === 'binned') { if (!sure('gone')) return; os.files.bin.drop(i.raw.id).then(() => { sfx('noteDel'); refresh(); }); }
    }
    let armed = '', armT = 0;
    function sure(what) {
        if (armed === what && Date.now() - armT < 2600) { armed = ''; return true; }
        armed = what; armT = Date.now();
        let b = document.querySelector(what === 'empty' ? '#fx-root [data-empty]' : '#fx-root .fx-acts [data-a="' + what + '"]'); if (b) { b.dataset.was = b.textContent; b.textContent = T('filesSure', 'もう一回押して // again to be sure'); setTimeout(() => { if (b.isConnected && b.dataset.was) b.textContent = b.dataset.was; }, 2600); }
        return false;
    }
    function finishRename(inp, ok) {
        let i = ST.items.find(x => x.key === ST.ren); ST.ren = null;
        let v = inp.value.trim();
        if (ok && i && v && v !== i.name) Promise.resolve(KINDS[i.kind].rename(i, v)).then(() => refresh(true)); else draw();
    }
    function markSeen() { ST.seen = Date.now(); keepUi(); }

    function wire(r) {
        r.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { ST.folder = b.dataset.f; ST.sel = null; ST.q = ''; ST.ren = null; keepUi(); sfx('click', b); draw(); });
        let v = r.querySelector('[data-view]'); v.onclick = () => { ST.view = ST.view === 'grid' ? 'list' : 'grid'; keepUi(); sfx('click', v); draw(); };
        let q = r.querySelector('[data-q]'); q.oninput = () => { ST.q = q.value; ST.sel = null; draw(); let n = $('fx-root').querySelector('[data-q]'); n.focus(); n.selectionStart = n.selectionEnd = n.value.length; };
        r.querySelectorAll('[data-sort]').forEach(b => b.onclick = () => { let k = b.dataset.sort; if (ST.sort === k) ST.dir = -ST.dir; else { ST.sort = k; ST.dir = k === 'name' ? -1 : -1; } draw(); });
        r.querySelectorAll('[data-k]').forEach(b => {
            b.onclick = e => {
                if (e.target.closest('.fx-ren')) return;
                if (b._held) { b._held = 0; return; }
                let again = ST.sel === b.dataset.k;
                // ipad = tap tap, mouse = double click
                if (again && b._tapAt && Date.now() - b._tapAt < 1500) act(ST.folder === 'bin' ? 'back' : 'open');
                else if (!again) { sfx('hover'); pickOne(b.dataset.k); }
            };
            b.ondblclick = () => { pickOne(b.dataset.k); act(ST.folder === 'bin' ? 'back' : 'open'); };
            b.onpointerdown = e => { b._tapAt = e.pointerType !== 'mouse' && ST.sel === b.dataset.k ? Date.now() : 0; };
            let hold = 0; b.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; clearTimeout(hold); hold = setTimeout(() => { pickOne(b.dataset.k); menu(e.clientX, e.clientY); b._held = 1; }, 520); });
            ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => b.addEventListener(t, () => clearTimeout(hold)));
            b.oncontextmenu = e => { e.preventDefault(); pickOne(b.dataset.k); menu(e.clientX, e.clientY); };
        });
        r.querySelectorAll('[data-a]').forEach(b => b.onclick = () => act(b.dataset.a));
        let inp = r.querySelector('.fx-ren');
        if (inp) { inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') finishRename(inp, true); if (e.key === 'Escape') finishRename(inp, false); }; inp.onblur = () => { if (ST.ren) finishRename(inp, true); }; }
        if (ST.folder === 'bin' && ST.bin.length) {
            let e = document.createElement('button'); e.className = 'fx-emptybin'; e.dataset.empty = '1'; e.textContent = T('filesEmptyIt', 'ゴミ箱を空にする // empty the bin');
            e.onclick = () => { if (!sure('empty')) return; os.files.bin.empty().then(() => { sfx('binEmpty'); refresh(); }); };
            r.querySelector('.fx-main').appendChild(e);
        }
    }
    // redrawing the whole grid on click ate the double clicks. dont
    function pickOne(k) {
        ST.sel = k; ST.ren = null;
        let r = $('fx-root'); if (!r) return;
        r.querySelectorAll('[data-k]').forEach(b => b.classList.toggle('on', b.dataset.k === k));
        let i = cur(), pv = r.querySelector('.fx-pv');
        if (pvStop) { pvStop(); pvStop = null; }
        pv.innerHTML = pvShell(i);
        pv.querySelectorAll('[data-a]').forEach(b => b.onclick = () => act(b.dataset.a));
        if (i) fillPv(i);
        let t = r.querySelector('[data-k="' + CSS.escape(k) + '"]'); if (t && t.scrollIntoView) t.scrollIntoView({ block: 'nearest' });
    }
    function menu(x, y) {
        let old = $('fx-menu'); if (old) old.remove();
        let i = cur(); if (!i) return;
        let K = KINDS[i.kind] || {}, items = i.kind === 'binned' ? [['back', T('filesBack', '戻す // put back')], ['gone', T('filesGone', '消す // delete for good')]]
            : [['open', T('filesOpen', '開く // open')], ['dl', T('filesDl', '保存 // download')]].concat(K.ren ? [['ren', T('filesRen', '名前変更 // rename')]] : []).concat(K.bin ? [['bin', T('filesBin', 'ゴミ箱へ // bin it')]] : []);
        let m = document.createElement('div'); m.id = 'fx-menu'; m.className = 'fx-menu readable-ui';
        items.forEach(([a, l]) => { let b = document.createElement('button'); b.textContent = l; b.onclick = () => { m.remove(); act(a, i); }; m.appendChild(b); });
        document.body.appendChild(m);
        m.style.left = Math.min(x, innerWidth - m.offsetWidth - 6) + 'px'; m.style.top = Math.min(y, innerHeight - m.offsetHeight - 6) + 'px';
        setTimeout(() => document.addEventListener('pointerdown', function off(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('pointerdown', off, true); } }, true));
    }
    document.addEventListener('keydown', e => {
        let w = $('win-files'); if (!w || !w.classList.contains('is-active') || ST.ren) return;
        if (/INPUT|TEXTAREA/.test(e.target.tagName)) return;
        let list = shown(), at = list.findIndex(i => i.key === ST.sel);
        if (e.key === 'Delete' || (e.key === 'Backspace' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); act(ST.folder === 'bin' ? 'gone' : 'bin'); }
        else if (e.key === 'Enter' && at >= 0) { e.preventDefault(); act(ST.folder === 'bin' ? 'back' : 'open'); }
        else if (e.key === 'F2') { e.preventDefault(); act('ren'); }
        else if (/^Arrow/.test(e.key) && list.length) {
            e.preventDefault();
            let cols = ST.view === 'grid' ? Math.max(1, Math.round((w.querySelector('.fx-grid') || { clientWidth: 1 }).clientWidth / 96)) : 1;
            let d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
            pickOne(list[Math.max(0, Math.min(list.length - 1, at < 0 ? 0 : at + d))].key);
        }
    });

    function inject() {
        let tpl = document.createElement('template'); tpl.id = 'files';
        tpl.innerHTML = '<div id="fx-root" class="readable-ui"></div>';
        document.body.appendChild(tpl);
        let base = os.summon.bind(os);
        os.summon = function (id) {
            let existed = $('win-' + id), r = base.apply(os, arguments);
            if (id === 'files' && !existed) {
                let w = $('win-files'); if (w && !os.isPhone()) w.style.maxWidth = Math.min(900, innerWidth - 20) + 'px';
                let tt = $('win-title-files'); if (tt) tt.textContent = '// files/ 【ファイル】';
                draw(); refresh(); setTimeout(markSeen, 4000);
            }
            return r;
        };
    }
    document.addEventListener('vmp-files', () => { if ($('fx-root')) refresh(true); });
    window.addEventListener('storage', e => { if ($('fx-root') && /^vmp_/.test(e.key || '')) refresh(true); });

    let css = document.createElement('style');
    css.textContent = `
        #desktop > #win-files .window-body { padding: 0 !important; overflow: hidden !important; }
        .fx { display: grid; grid-template-rows: auto minmax(0, 1fr) auto; height: min(560px, calc(100vh - 220px)); min-height: 340px; font: 12px/1.4 'M PLUS 1 Code', monospace; color: #e6e1ec; background: #0b090e; }
        .fx button { font: inherit; color: inherit; background: none; border: 0; cursor: inherit; }
        .fx-top { display: flex; gap: 6px; align-items: center; padding: 7px 8px; border-bottom: 1px solid #241f2b; background: #121017; }
        .fx-vw { width: 28px; height: 26px; border: 1px solid #2e2836 !important; }
        .fx-vw:hover { border-color: var(--neon-secondary) !important; }
        .fx-addr { flex: 1; min-width: 0; display: flex; align-items: center; height: 26px; padding: 0 9px; background: #070609; border: 1px solid #2e2836; color: #b9b2c4; overflow: hidden; white-space: nowrap; }
        .fx-q { width: 150px; height: 26px; padding: 0 8px; font: inherit; color: inherit; background: #070609; border: 1px solid #2e2836; outline: none; }
        .fx-q:focus { border-color: var(--neon-secondary); }
        .fx-mid { display: grid; grid-template-columns: 178px minmax(0, 1fr) 214px; min-height: 0; }
        .fx-side { display: flex; flex-direction: column; gap: 1px; padding: 6px 4px; border-right: 1px solid #241f2b; overflow: auto; background: #0e0c12; }
        .fx-f { display: flex; align-items: center; gap: 7px; padding: 5px 6px; text-align: left; border-left: 2px solid transparent !important; }
        .fx-f span { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fx-f em { font-style: normal; opacity: 0.45; font-size: 10px; }
        .fx-f b { font-weight: normal; font-size: 10px; min-width: 16px; padding: 0 4px; text-align: center; background: #241f2b; color: #b9b2c4; }
        .fx-f:hover { background: #17141c; }
        .fx-f.on { background: color-mix(in srgb, var(--neon-primary) 14%, transparent); border-left-color: var(--neon-primary) !important; }
        .fx-f.full b { background: var(--neon-primary); color: #000; }
        /* stuffs in there. it rattles */
        .fx-f.full:hover .fx-ic { animation: fxRattle 0.4s steps(2) 2; }
        @keyframes fxRattle { 25% { transform: translate(-1px, 0) rotate(-6deg); } 50% { transform: translate(1px, -1px) rotate(5deg); } 75% { transform: translate(-1px, 0) rotate(-3deg); } }
        html.reduce-motion .fx-f.full:hover .fx-ic { animation: none; }
        .fx-ic { display: inline-block; width: 22px; height: 22px; flex: none; background: no-repeat center / contain; image-rendering: pixelated; font-size: 0; }
        .fx-ic.sm { width: 16px; height: 16px; vertical-align: -3px; margin-right: 6px; }
        .fx-ic.big { width: 48px; height: 48px; }
        .fx-main { position: relative; overflow: auto; padding: 10px; outline: none; }
        .fx-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(86px, 1fr)); gap: 6px; }
        .fx-tile { position: relative; display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 8px 4px 6px; border: 1px solid transparent !important; min-width: 0; }
        .fx-tile .fx-ic { width: 40px; height: 40px; transition: transform 0.12s; }
        .fx-tile img { width: 64px; height: 48px; object-fit: contain; background: repeating-conic-gradient(#1c1922 0 25%, #141118 0 50%) 0 0 / 10px 10px; box-shadow: 0 0 0 1px #2e2836; }
        /* wips get a little stack of paper behind them, flipbooks a play tab */
        .fx-tile.k-wip img { box-shadow: 0 0 0 1px #2e2836, 3px 3px 0 #1a1720, 3px 3px 0 1px #2e2836, 6px 6px 0 #131017, 6px 6px 0 1px #2e2836; }
        .fx-tile.k-flip::before { content: '▶'; position: absolute; top: 40px; left: 50%; transform: translateX(14px); font-size: 9px; padding: 1px 4px; color: #000; background: var(--neon-secondary); }
        .fx-tile span { max-width: 100%; font-size: 11px; text-align: center; word-break: break-all; line-height: 1.25; }
        .fx-tile small, .fx-row small, .fx-pv h4 small { opacity: 0.45; font-size: 10px; }
        .fx-tile:hover { background: #15121a; }
        .fx-tile:hover .fx-ic { transform: translateY(-2px) rotate(-3deg); }
        .fx-tile.on { background: color-mix(in srgb, var(--neon-primary) 16%, transparent); border-color: color-mix(in srgb, var(--neon-primary) 55%, transparent) !important; }
        .fx-tile.new::after, .fx-row.new .fx-nm::after { content: ''; position: absolute; top: 5px; right: 6px; width: 6px; height: 6px; background: var(--neon-secondary); box-shadow: 0 0 6px var(--neon-secondary); }
        .fx-row.new .fx-nm { position: relative; }
        .fx-list { display: flex; flex-direction: column; }
        .fx-lh, .fx-row { display: grid; grid-template-columns: minmax(0, 1fr) 70px 124px; gap: 8px; align-items: center; padding: 4px 6px; text-align: left; }
        .fx-lh { position: sticky; top: -10px; background: #0b090e; border-bottom: 1px solid #241f2b; color: #8f879b; font-size: 11px; }
        .fx-lh button { text-align: left; } .fx-lh button.on { color: var(--neon-secondary); }
        .fx-row:nth-child(odd) { background: rgba(255,255,255,0.015); }
        .fx-row:hover { background: #15121a; }
        .fx-row.on { background: color-mix(in srgb, var(--neon-primary) 16%, transparent); }
        .fx-nm { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fx-row span:not(.fx-nm) { color: #8f879b; font-size: 11px; }
        .fx-ren { width: 100%; font: inherit; color: #fff; background: #000; border: 1px solid var(--neon-secondary); padding: 1px 3px; outline: none; }
        .fx-empty { height: 100%; display: grid; place-content: center; justify-items: center; gap: 8px; color: #7d7589; text-align: center; padding: 20px; }
        .fx-empty .fx-ic { opacity: 0.5; filter: grayscale(0.6); }
        .fx-emptybin { position: sticky; bottom: 0; display: block; margin: 14px auto 0; padding: 6px 12px; border: 1px solid #5a2030 !important; color: #ff8aa0; background: #0b090e !important; }
        .fx-emptybin:hover { background: #3a0d18 !important; }
        .fx-pv { border-left: 1px solid #241f2b; padding: 10px; overflow: auto; background: #0e0c12; display: flex; flex-direction: column; gap: 6px; }
        .fx-pv-none { margin: auto; color: #5d5668; text-align: center; }
        .fx-pvbox { display: grid; place-items: center; min-height: 120px; padding: 6px; background: #070609; border: 1px solid #241f2b; overflow: hidden; }
        .fx-pvbox img { max-width: 100%; max-height: 180px; image-rendering: auto; }
        .fx-pvbox pre { align-self: stretch; justify-self: stretch; margin: 0; max-height: 200px; overflow: auto; white-space: pre-wrap; word-break: break-word; font: 11px/1.5 'M PLUS 1 Code', monospace; color: #cfc8d8; }
        .fx-pvbox audio { width: 100%; height: 30px; margin-top: 6px; }
        .fx-pvbox ol { margin: 2px 0 8px; padding-left: 18px; width: 100%; font-size: 11px; }
        .fx-pvbox li span + span { margin-left: 8px; opacity: 0.7; }
        .fx-pvbox > b { justify-self: start; font-weight: normal; color: var(--neon-secondary); font-size: 11px; }
        .fx-wave, .fx-roll { width: 100%; height: auto; image-rendering: pixelated; }
        .fx-pv h4 { margin: 2px 0 0; font-size: 13px; font-weight: normal; color: #fff; word-break: break-all; }
        .fx-sub { margin: 0; color: #8f879b; font-size: 11px; }
        .fx-pv dl { display: grid; grid-template-columns: auto 1fr; gap: 1px 10px; margin: 0; font-size: 11px; color: #8f879b; }
        .fx-pv dd { margin: 0; color: #cfc8d8; }
        .fx-acts { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
        .fx-acts button, .fx-menu button { padding: 5px 9px; border: 1px solid #2e2836 !important; background: #141118 !important; }
        .fx-acts button:hover, .fx-menu button:hover { border-color: var(--neon-secondary) !important; color: #fff; }
        .fx-acts button.big { flex-basis: 100%; border-color: color-mix(in srgb, var(--neon-primary) 60%, transparent) !important; background: color-mix(in srgb, var(--neon-primary) 18%, #141118) !important; }
        .fx-acts button.warn { color: #ff8aa0; }
        .fx-foot { display: flex; gap: 14px; align-items: center; padding: 5px 10px; border-top: 1px solid #241f2b; background: #121017; color: #8f879b; font-size: 11px; }
        .fx-fine { margin-left: auto; opacity: 0.7; }
        .fx-disk { display: flex; align-items: center; gap: 6px; }
        .fx-disk i { width: 70px; height: 6px; background: #241f2b; }
        .fx-disk b { display: block; height: 100%; min-width: 1px; background: var(--neon-secondary); }
        .fx-menu { position: fixed; z-index: 99999; display: flex; flex-direction: column; min-width: 170px; padding: 3px; background: #0e0c12; border: 1px solid #2e2836; box-shadow: 4px 5px 0 rgba(0,0,0,0.5); font: 12px 'M PLUS 1 Code', monospace; color: #e6e1ec; }
        .fx-menu button { text-align: left; color: inherit; font: inherit; cursor: inherit; border-color: transparent !important; background: none !important; }
        @media (max-width: 760px) {
            .fx { height: calc(100vh - 170px); }
            .fx-mid { grid-template-columns: 1fr; grid-template-rows: auto minmax(0, 1fr) auto; }
            .fx-side { flex-direction: row; overflow-x: auto; border-right: 0; border-bottom: 1px solid #241f2b; }
            .fx-f em, .fx-f b { display: none; }
            .fx-pv { border-left: 0; border-top: 1px solid #241f2b; max-height: 38vh; }
            .fx-q { width: 96px; }
            .fx-fine { display: none; }
        }
    `;
    document.head.appendChild(css);
    inject();
})();
