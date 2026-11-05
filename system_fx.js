
const bootLines = [
    'VAMPII BIOS v4.444 // (C) 2026 MILIVIA // ミリヴィア',
    'メモリ検査 ........ 4444MB OK',
    'ネオン管 .......... 点灯',
    '電脳ドライバ ...... 読込完了',
    'ネット接続 ........ 確立 // SECURE (たぶん)',
    '音箱 .............. 調律済み',
    'ゲーム ............ 全部無料',
    'ようこそ。'
];
(function () {
    // TODO let people pick how long before the screensaver kicks in
    const SAVER_AFTER = 180;
    const $ = id => document.getElementById(id);
    const root = () => document.documentElement;
    const calm = () => root().classList.contains('reduce-motion') || root().classList.contains('low-spec');
    const pick = a => a[Math.floor(Math.random() * a.length)];

    // whats new pops up when I post something you havent seen
    const db = () => typeof database !== 'undefined' ? database : {};
    const trackKey = t => String(t.title || '') + '|' + String(t.videoId || t.audioSrc || '');
    const KEYS = {
        blog: p => String(p.id),
        music: trackKey,
        books: c => String(c.file || ''),
        gallery: g => String(g.img || g.id)
    };
    function chapters() {
        let out = [];
        (db().books || []).forEach(bk => (bk.chapters || []).forEach((c, n) => { if (!c.hidden && c.file) out.push(Object.assign({ _book: bk, _n: n }, c)); }));
        return out;
    }
    const listOf = type => type === 'books' ? chapters() : (db()[type] || []).filter(x => !x.hidden);
    const allKeys = () => { let o = {}; Object.keys(KEYS).forEach(t => { o[t] = listOf(t).map(KEYS[t]); }); return o; };
    let seen = null;
    try { seen = JSON.parse(localStorage.getItem('vmp_seen2') || 'null'); } catch (e) {}
    if (!seen) {
        seen = allKeys();
        try {
            let old = JSON.parse(localStorage.getItem('vmp_seen') || 'null');
            if (old) { seen.blog = (old.blog || []).map(String); seen.music = old.music || []; }
        } catch (e) {}
    }
    Object.keys(KEYS).forEach(t => { if (!Array.isArray(seen[t])) seen[t] = listOf(t).map(KEYS[t]); });
    const keepSeen = () => { try { localStorage.setItem('vmp_seen2', JSON.stringify(seen)); localStorage.removeItem('vmp_seen'); } catch (e) {} };
    keepSeen();
    const unseen = (type, item) => seen[type].indexOf(KEYS[type](item)) === -1;
    const freshThisVisit = {};
    Object.keys(KEYS).forEach(t => { freshThisVisit[t] = listOf(t).filter(x => unseen(t, x)).map(KEYS[t]); });
    os.isNew = function (type, item) {
        if (!KEYS[type] || !item) return false;
        return unseen(type, item) || freshThisVisit[type].indexOf(KEYS[type](item)) !== -1;
    };
    os.newItems = function () {
        let out = [];
        Object.keys(KEYS).forEach(t => listOf(t).forEach(x => { if (unseen(t, x)) out.push({ type: t, item: x }); }));
        return out;
    };
    os.markSeen = function (type, keys) {
        if (!KEYS[type]) return;
        let ks = keys || listOf(type).map(KEYS[type]);
        ks.forEach(k => { if (seen[type].indexOf(k) === -1) seen[type].push(k); });
        keepSeen();
        paintDots();
    };
    function newCounts() {
        let c = { blog: 0, music: 0, books: 0, gallery: 0 }, any = false;
        os.newItems().forEach(n => { c[n.type]++; any = true; });
        return any ? c : null;
    }
    const DOT_FOR = { blog: "'blog'", music: "'music'", gallery: "'gallery.exe'" };
    function paintDots() {
        let c = newCounts() || {};
        document.querySelectorAll('.nw-dot').forEach(d => d.remove());
        Object.keys(DOT_FOR).concat(['books']).forEach(t => {
            if (!c[t]) return;
            let els = t === 'books' ? document.querySelectorAll('[data-books]')
                : Array.from(document.querySelectorAll('.icon-wrap')).filter(el => (el.getAttribute('onclick') || '').indexOf("summon(" + DOT_FOR[t] + ")") !== -1);
            els.forEach(el => {
                let d = document.createElement('i');
                d.className = 'nw-dot';
                d.textContent = c[t];
                d.setAttribute('aria-label', c[t] + ' new');
                el.appendChild(d);
            });
        });
        let tray = document.querySelector('.tb-tray'), link = document.getElementById('nw-link'), total = Object.values(c).reduce((a, b) => a + b, 0);
        if (tray && total && !link) {
            link = document.createElement('button');
            link.id = 'nw-link';
            link.title = '新着 // whats new';
            link.onclick = () => { os.summon('new'); if (os.sfx) os.sfx('tray', { el: link }); };
            tray.insertBefore(link, tray.firstChild);
        }
        if (link) link.textContent = '新着 ' + total;
        if (link && !total) link.remove();
    }
    os.paintNewDots = paintDots;
    os.wipeNew = function () {
        Object.keys(KEYS).forEach(t => { freshThisVisit[t] = []; os.markSeen(t); });
        document.querySelectorAll('.new-badge').forEach(b => b.remove());
        document.querySelectorAll('.is-new').forEach(el => el.classList.remove('is-new'));
        drawNewWin();
    };
    const NEW_LABEL = { blog: ['日記', 'blog'], music: ['音楽', 'music'], books: ['本', 'chapter'], gallery: ['絵', 'art'] };
    function drawNewWin() {
        let box = $('nw-list');
        if (!box) return;
        let items = os.newItems();
        // new.log is an answering machine lol
        let am = box.parentNode.querySelector('.nw-am');
        if (!am) {
            am = document.createElement('div');
            am.className = 'nw-am';
            am.innerHTML = '<div class="nw-seg" aria-hidden="true"><b></b></div><div class="nw-lab"><span><i class="nw-led"></i><em></em></span><small></small></div><button type="button" class="nw-erase"><i aria-hidden="true"></i><span></span></button>';
            box.parentNode.insertBefore(am, box);
            am.querySelector('.nw-erase').onclick = e => {
                if (!os.newItems().length) return;
                if (os.sfx) os.sfx('erase', { el: e.currentTarget });
                os.wipeNew();
                let s = am.querySelector('.nw-lab small');
                s.textContent = T('newErased', 'all cleared');
                setTimeout(() => { if (s.isConnected && !os.newItems().length) s.textContent = T('newNone', 'no messages'); }, 2200);
            };
        }
        am.querySelector('b').textContent = String(Math.min(99, items.length)).padStart(2, '0');
        am.querySelector('.nw-lab em').textContent = T('newMsgs', '新着メッセージ // NEW');
        am.querySelector('.nw-lab small').textContent = items.length ? T('newPress', 'press one to play it') : T('newNone', 'no messages');
        am.querySelector('.nw-erase span').textContent = T('newErase', '全件消去 // ERASE ALL').replace(' // ', '\n');
        am.querySelector('.nw-erase').disabled = !items.length;
        am.classList.toggle('has', items.length > 0);
        box.textContent = '';
        if (!items.length) { box.innerHTML = '<div class="nw-empty"><div class="nw-radar" aria-hidden="true"><i></i></div><p class="window-text"></p><small></small></div>'; box.querySelector('p').textContent = T('newEmpty', 'nothing new'); box.querySelector('small').textContent = T('newScan', ''); return; return; }
        items.forEach(n => {
            let it = n.item, row = document.createElement('button');
            row.className = 'nw-row';
            let title = n.type === 'books' ? (it._book.title || it._book.id) + ' // ' + (it.title || ('Chapter ' + (it._n + 1))) : (n.type === 'music' ? (it.title || '???') + (it.artist ? ' - ' + it.artist : '') : (it.title || '無題'));
            row.innerHTML = '<span class="meta-pill"></span><b></b><small></small><em>▶</em>';
            row.dataset.n = String(box.children.length + 1).padStart(2, '0');
            row.querySelector('.meta-pill').textContent = NEW_LABEL[n.type][0] + ' // ' + NEW_LABEL[n.type][1];
            row.querySelector('b').textContent = title;
            row.querySelector('small').textContent = it.date || '';
            row.onclick = () => {
                if (typeof os.clickAudio === 'function') os.clickAudio();
                if (n.type === 'gallery') os.galleryWant = KEYS.gallery(it);
                os.summon(n.type === 'books' ? 'books.exe' : n.type === 'gallery' ? 'gallery.exe' : n.type);
                if (n.type === 'gallery' && os.galleryOpen) os.galleryOpen(os.galleryWant);
                if (n.type === 'books' && typeof os.openChapter === 'function') os.openChapter(it._book.id, it.file);
            };
            box.appendChild(row);
        });
    }
    let nwTpl = document.createElement('template');
    nwTpl.id = 'new';
    nwTpl.innerHTML = '<h3 class="readable-ui section-title"></h3><div id="nw-list" class="nw-list"></div>';
    nwTpl.content.querySelector('h3').textContent = T('newTitle', '新着 // since u were last here');
    document.body.appendChild(nwTpl);

    function stack() {
        let s = $('sys-notices');
        if (!s) {
            s = document.createElement('div');
            s.id = 'sys-notices';
            s.className = 'readable-ui';
            s.setAttribute('aria-live', 'polite');
            document.body.appendChild(s);
        }
        return s;
    }
    // popups come in on a little pager. beep beep
    let paged = 0;
    os.notify = function (text, onclick, ms) {
        let n = document.createElement('div');
        n.className = 'sys-notice pager' + (onclick ? ' clickable' : '');
        n.innerHTML = '<i class="pg-led"></i><div class="pg-lcd"><div class="sys-notice-head"><span></span><span></span></div><div class="pg-msg"></div></div><i class="pg-grip"></i>';
        let hs = n.querySelectorAll('.sys-notice-head span');
        hs[0].textContent = T('pagerHead', '着信 // MSG') + ' ' + String(++paged).padStart(2, '0');
        hs[1].textContent = new Date().toTimeString().slice(0, 5);
        let body = n.querySelector('.pg-msg');
        if (root().classList.contains('reduce-motion')) body.textContent = text;
        else { let i = 0; const type = () => { if (!n.isConnected && i) return; body.textContent = text.slice(0, ++i); if (i < text.length) setTimeout(type, 18); }; setTimeout(type, 260); }
        if (os.sfx) os.sfx('pager');
        let bar = document.createElement('i'); bar.className = 'sys-notice-bar'; bar.style.animationDuration = (ms || 7000) + 'ms'; n.querySelector('.pg-lcd').appendChild(bar);
        n.onclick = () => { if (onclick) onclick(); if (typeof os.clickAudio === 'function') os.clickAudio(); n.remove(); };
        stack().appendChild(n);
        setTimeout(() => { n.classList.add('bye'); setTimeout(() => n.remove(), 500); }, ms || 7000);
    };

    let bootDone = false;
    const afterBoot = [];
    os.afterBoot = function (fn) { if (bootDone) fn(); else afterBoot.push(fn); };
    function finishBoot() {
        if (bootDone) return;
        bootDone = true;
        let b = $('boot-seq');
        if (b) { b.classList.add('bye'); setTimeout(() => b.remove(), 600); }
        afterBoot.splice(0).forEach(fn => { try { fn(); } catch (e) {} });
        let c = newCounts();
        paintDots();
        if (c && os.prefs.notices !== false) {
            let bits = [];
            if (c.blog) bits.push('新しいログ ' + c.blog + '件');
            if (c.music) bits.push('新曲 ' + c.music + '曲');
            if (c.books) bits.push('新しい章 ' + c.books);
            setTimeout(() => os.notify('前回の接続から // since you were last here: ' + bits.join(' // ') + '  → クリックで新着', () => os.summon('new'), 14000), 600);
        }
    }
    // boot screen only shows once per visit, any key skips it
    function boot() {
        let seen = false;
        try { seen = sessionStorage.getItem('vmp_booted') === '1'; sessionStorage.setItem('vmp_booted', '1'); } catch (e) {}
        if (seen || calm()) { finishBoot(); return; }
        runBoot(false);
    }
    // browsers wont make a sound till you've clicked something, hence the power button
    function runBoot(preview) {
        let b = document.createElement('div');
        b.id = 'boot-seq';
        b.className = 'readable-ui' + (preview ? '' : ' gate');
        b.setAttribute('aria-hidden', 'true');
        b.innerHTML = '<div class="bs-screen"><div class="bs-gate"><button type="button" class="bs-pwr" aria-label="enter"><i></i></button><p class="bs-enter"></p><p class="bs-phone"></p><small class="bs-ver"></small></div>'
            + '<div class="bs-frame"><div class="bs-logo"></div><div class="bs-sub"></div><div class="bs-log"></div><div class="bs-bar"><i></i></div><div class="bs-foot"><span class="bs-skip"></span><span class="bs-pct">0%</span></div></div></div>';
        let lg = b.querySelector('.bs-logo'); lg.textContent = lg.dataset.t = T('bootLogo', 'VAMPII.OS');
        b.querySelector('.bs-sub').textContent = T('bootSub', ''); b.querySelector('.bs-skip').textContent = T('bootSkip', 'ANY KEY');
        b.querySelector('.bs-enter').textContent = T('bootEnter', 'クリックして起動 // click to enter');
        b.querySelector('.bs-ver').textContent = T('bootLogo', 'VAMPII.OS') + ' // v4.444';
        let mob = typeof os.mobileish === 'function' && os.mobileish(), ph = b.querySelector('.bs-phone');
        if (mob) ph.textContent = T('bootPhone', '（マジで、まともに動かないからね） // (seriously, it wont work well)').replace(' // ', '\n'); else ph.remove();
        document.body.appendChild(b);
        let log = b.querySelector('.bs-log'), bar = b.querySelector('.bs-bar i'), pct = b.querySelector('.bs-pct');
        // told you twice
        let lines = mob ? bootLines.slice(0, -1).concat(T('bootPhoneLine', 'スマホ ............ 非対応 (マジで)'), bootLines.slice(-1)) : bootLines, i = 0, done = false, timers = [], started = false;
        const later = (fn, ms) => timers.push(setTimeout(fn, ms));
        const snd = (n, o) => { if (os.sfx) os.sfx(n, o); };
        let end = () => {
            if (done) return;
            done = true;
            timers.forEach(clearTimeout);
            document.removeEventListener('keydown', key);
            document.removeEventListener('mousedown', skip);
            if (started) snd('whoosh');
            if (preview) { b.classList.add('bye'); setTimeout(() => b.remove(), 600); }
            else finishBoot();
        };
        const skip = e => { if (started && !e.target.closest('.bs-pwr')) end(); };
        const key = e => { if (!started) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } return; } end(); };
        function go() {
            if (started) return;
            started = true;
            snd('powerBtn', { pan: 0 });
            b.classList.add('press');
            later(() => { b.classList.remove('gate', 'press'); b.classList.add('post'); snd('crtOn', { pan: 0 }); }, 180);
            later(() => snd('spinup', { pan: 0 }), 650);
            let at = 900;
            lines.forEach((line, n) => {
                later(() => {
                    let row = document.createElement('div'), m = /^(.*?)\s*\.{3,}\s*(.*)$/.exec(line);
                    if (m) { row.className = 'bs-row'; row.innerHTML = '<span></span><em></em><b></b>'; row.firstChild.textContent = m[1]; row.lastChild.textContent = m[2]; }
                    else { row.className = 'bs-row bs-plain'; row.textContent = line; }
                    if (/拒否|応答なし|非対応/.test(line)) row.classList.add('bad');
                    log.appendChild(row);
                    snd('bootLine', { pan: -0.2 }); if (Math.random() < 0.6) snd('seek', { pan: 0.3 });
                }, at);
                at += 170 + Math.random() * 120;
            });
            later(() => snd('riser', { pan: 0 }), at + 150);
            later(() => { b.classList.remove('post'); b.classList.add('logo'); snd('impact', { pan: 0 }); }, at + 950);
            later(() => snd('charge', { pan: 0 }), at + 1500);
            for (let k = 1; k <= 10; k++) later(() => { bar.style.width = k * 10 + '%'; pct.textContent = k * 10 + '%'; }, at + 1500 + k * 120);
            later(end, at + 1500 + 1200 + 450);
        }
        b.querySelector('.bs-pwr').addEventListener('click', go);
        b.addEventListener('click', e => { if (!started && b.classList.contains('gate')) go(); });
        document.addEventListener('keydown', key);
        document.addEventListener('mousedown', skip);
        if (preview) go();
    }

    let idle = 0, saverRaf = 0;
    const wake = () => {
        idle = 0;
        let s = $('sys-saver');
        if (s) { if (s._stop) s._stop(); s.remove(); cancelAnimationFrame(saverRaf); if (os.sfx) os.sfx('saverOff'); }
    };
    ['pointermove', 'mousedown', 'keydown', 'wheel', 'touchstart', 'touchmove', 'input'].forEach(ev => document.addEventListener(ev, wake, { passive: true }));
    document.addEventListener('scroll', wake, { capture: true, passive: true });
    // not while you're making or playing something
    const busy = () => document.hidden
        || !!(os.nowPlaying && $('win-music'))
        || (document.activeElement && document.activeElement.tagName === 'IFRAME')
        || ['win-games.exe', 'win-noisebox.exe'].some(id => !!$(id));
    setInterval(() => {
        if (busy()) { idle = 0; return; }
        idle++;
        if (idle === SAVER_AFTER && os.prefs.saver !== false && !$('sys-saver')) saver();
    }, 1000);
    os.screensaver = function () { if (!$('sys-saver')) saver(); };
    // one day itll hit the corner
    const COLS = ['var(--neon-primary)', 'var(--neon-secondary)', '#ffffff', '#5cf2ff', '#ffe14a', '#7dff8a', '#ff8a3d', '#c18bff'];
    function saver() {
        if (os.sfx) os.sfx('saverOn');
        let s = document.createElement('div');
        s.id = 'sys-saver';
        s.setAttribute('aria-hidden', 'true');
        let logo = document.createElement('div');
        logo.className = 'sv-logo readable-ui';
        logo.innerHTML = '<b></b><i><span></span></i>';
        logo.querySelector('b').textContent = T('saverLogo', 'VAMPII.OS');
        logo.querySelector('span').textContent = T('saverDisc', 'ヴァンピィ');
        let hits = 0; try { hits = +localStorage.getItem('vmp_corners') || 0; } catch (e) {}
        let tally = document.createElement('div'); tally.className = 'sv-tally';
        const showTally = () => { tally.textContent = hits ? T('saverCount', 'corners hit: {n}').replace('{n}', hits) : ''; };
        showTally();
        s.appendChild(logo); s.appendChild(tally);
        document.body.appendChild(s);
        let ci = Math.floor(Math.random() * COLS.length);
        const paint = () => { ci = (ci + 1 + Math.floor(Math.random() * (COLS.length - 1))) % COLS.length; logo.style.setProperty('--sv', COLS[ci]); };
        paint();
        if (calm()) { logo.classList.add('still'); return; }
        let W = 0, H = 0, x = 0, y = 0, vx = 92, vy = 68, last = 0, fr = 0;
        const measure = () => { W = innerWidth - logo.offsetWidth; H = innerHeight - logo.offsetHeight; };
        measure();
        x = Math.random() * Math.max(1, W); y = Math.random() * Math.max(1, H);
        if (Math.random() < 0.5) vx = -vx; if (Math.random() < 0.5) vy = -vy;
        function step(now) {
            if (!$('sys-saver')) return;
            saverRaf = requestAnimationFrame(step);
            let dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
            if (++fr % 30 === 0) measure();
            x += vx * dt; y += vy * dt;
            let hx = false, hy = false;
            if (x <= 0 || x >= W) { vx = -vx; x = Math.max(0, Math.min(W, x)); hx = true; }
            if (y <= 0 || y >= H) { vy = -vy; y = Math.max(0, Math.min(H, y)); hy = true; }
            if (hx || hy) paint();
            // THE CORNER. both walls on the same frame (ish)
            if ((hx && (y < 3 || y > H - 3)) || (hy && (x < 3 || x > W - 3))) {
                hits++; try { localStorage.setItem('vmp_corners', hits); } catch (e) {}
                showTally();
                logo.classList.remove('corner'); void logo.offsetWidth; logo.classList.add('corner');
                s.classList.remove('flash'); void s.offsetWidth; s.classList.add('flash');
                // its asleep, the corner is the only thing that makes a noise
                if (os.sfx) os.sfx('corner');
            }
            logo.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
        }
        saverRaf = requestAnimationFrame(step);
    }

    function hudBox() { return $('hud-procs'); }
    function hudFill() {
        document.querySelectorAll('.system-hud [data-t]').forEach(el => { el.textContent = T(el.dataset.t, el.dataset.t); });
        let who = $('hud-who'); if (who) who.textContent = T('hudWho', 'milivia@vampii');
        let sec = $('hud-sec'); if (sec) sec.textContent = T('hudSecVal', 'PROBABLY OK');
        let posts = (typeof database !== 'undefined' && database.blog || []).slice().sort((x, y) => String(y.date).localeCompare(String(x.date)));
        let pe = $('hud-post');
        if (pe) {
            let p0 = posts[0];
            pe.textContent = '';
            if (p0) { let b = document.createElement('button'); b.textContent = (p0.title || '…') + ' · ' + ago(p0.date); b.onclick = () => { os.summon('blog'); if (typeof os.clickAudio === 'function') os.clickAudio(); }; pe.appendChild(b); }
            else pe.textContent = T('hudNothing', 'nothing yet');
        }
        let dates = posts.map(x => x.date);
        ['music', 'books'].forEach(k => (typeof database !== 'undefined' && database[k] || []).forEach(it => { if (it.date) dates.push(it.date); (it.chapters || []).forEach(c => { if (c.date) dates.push(c.date); }); }));
        dates = dates.filter(d => /^\d{4}-\d{2}-\d{2}/.test(String(d))).sort();
        let up = $('hud-upd'); if (up) up.textContent = dates.length ? String(dates[dates.length - 1]).slice(0, 10).replace(/-/g, '.') : '—';
        hudMoon(); hudVisits();
    }
    // tonights actual moon
    function hudMoon() {
        if (!os.moon) return;
        let m = os.moon(), name = (T('hudMoons', '').split('|')[m.phase] || '').trim(), cut = name.indexOf(' ');
        let v = $('hud-moonv');
        if (v) {
            v.innerHTML = '<b class="hm-jp"></b><i class="hm-en"></i>';
            v.firstChild.textContent = cut < 0 ? name : name.slice(0, cut);
            v.lastChild.textContent = cut < 0 ? '' : name.slice(cut + 1);
            let place = (m.where.tz.split('/').pop() || '').replace(/_/g, ' ');
            v.title = place ? T('hudMoonWhere', 'as seen from round {p}').replace('{p}', place) : '';
        }
        let c = $('hud-moon'); if (!c) return;
        let x = c.getContext('2d'), R = 7, cx = 7.5, cy = 7.5;
        let si = Math.sin(m.angle * Math.PI / 180), Lx = m.dx * si, Ly = m.dy * si, Lz = Math.cos(m.angle * Math.PI / 180);
        x.clearRect(0, 0, 15, 15);
        for (let py = 0; py < 15; py++) for (let px = 0; px < 15; px++) {
            let dx = (px + 0.5 - cx) / R, dy = -(py + 0.5 - cy) / R, rr = dx * dx + dy * dy; if (rr > 1) continue;
            let on = dx * Lx + dy * Ly + Math.sqrt(1 - rr) * Lz > 0;
            x.fillStyle = on ? ((px * 7 + py * 3) % 11 === 0 ? '#c9c2b4' : '#f1ece0') : '#2a2430'; x.fillRect(px, py, 1, 1);
        }
    }
    function hudVisits() {
        let n = 0;
        try { n = +localStorage.getItem('vmp_visits') || 0; if (sessionStorage.getItem('vmp_counted') !== '1') { n++; localStorage.setItem('vmp_visits', n); sessionStorage.setItem('vmp_counted', '1'); } } catch (e) {}
        let v = $('hud-visits'); if (v) v.textContent = n <= 1 ? T('hudVisits1', 'first time here hi') : T('hudVisitsVal', 'been here {n} times').replace('{n}', n);
    }
    function ago(d) {
        let t = Date.parse(d); if (isNaN(t)) return String(d || '');
        let n = Math.floor((Date.now() - t) / 86400000);
        return n <= 0 ? T('hudToday', 'today') : T('hudAgo', '{n}d ago').replace('{n}', n);
    }
    const DOCK_ICONS = { info: '💻', blog: '📝', music: '🎛️', settings: '⚙️', 'calc.exe': '📟', 'paint.exe': '🎨', 'games.exe': '🎮', 'noisebox.exe': '🎹',
        'books.exe': '📕', 'notes.txt': '🗒️', files: '🗂', 'gallery.exe': '📺', 'timer.exe': '⏲', 'copier.exe': '🖨', 'duck.exe': '🦆' };
    function renderDock() {
        let dock = $('win-dock');
        if (!dock) {
            dock = document.createElement('div');
            dock.id = 'win-dock';
            dock.className = 'readable-ui';
            dock.setAttribute('aria-label', 'minimised windows');
            document.body.appendChild(dock);
        }
        let phone = os.isPhone(), had = new Set([...dock.querySelectorAll('.dock-item')].map(x => x.title));
        dock.textContent = '';
        document.querySelectorAll('#desktop > div[id^="win-"]').forEach(w => {
            if (!phone && !w.classList.contains('is-min')) return;
            let id = w.id.slice(4);
            let b = document.createElement('button');
            b.className = 'dock-item' + (w.classList.contains('is-active') && !w.classList.contains('is-min') ? ' on' : '');
            b.innerHTML = '<span class="dock-ic">' + (DOCK_ICONS[id] || '▣') + '</span><span class="dock-nm"></span>';
            b.querySelector('.dock-nm').textContent = id.replace('.exe', '');
            b.title = id;
            if (!had.has(id)) b.classList.add('new');
            b.addEventListener('mouseenter', () => { if (os.sfx) os.sfx('hover'); });
            b.onclick = () => {
                if (phone && w.classList.contains('is-active') && !w.classList.contains('is-min')) { if (os.sfx) os.sfx('dockIn', { el: b }); w.classList.add('is-min'); os.focusTop(); return; }
                if (os.sfx) { os.sfx('dockOut', { el: b }); os.sfx.quietAt = performance.now(); }
                if (id === 'setup-modal') { w.classList.remove('is-min'); os.focusWin(w); beam(w); }
                else os.summon(id);
            };
            dock.appendChild(b);
        });
        dock.classList.toggle('empty', !dock.children.length);
    }
    window.addEventListener('resize', () => renderDock());
    function renderProcs() {
        renderDock();
        let box = hudBox();
        if (!box) return;
        box.textContent = '';
        let wins = document.querySelectorAll('#desktop > div[id^="win-"]');
        if (!wins.length) {
            let none = document.createElement('span');
            none.className = 'proc-none';
            none.textContent = T('hudIdle', 'nothing');
            box.appendChild(none);
        }
        wins.forEach(w => {
            let id = w.id.slice(4);
            let b = document.createElement('button');
            b.className = 'proc' + (w.classList.contains('is-min') ? ' min' : '') + (w.classList.contains('is-active') ? ' on' : '');
            b.textContent = id;
            b.title = w.classList.contains('is-min') ? '最小化中 // クリックで戻す' : '';
            b.onclick = () => {
                if (id === 'setup-modal') os.focusWin(w);
                else os.summon(id);
                if (typeof os.clickAudio === 'function') os.clickAudio();
            };
            box.appendChild(b);
        });
        let np = $('hud-np');
        if (!$('win-music')) os.nowPlaying = '';
        if (np) { np.textContent = os.nowPlaying ? '♪ ' + os.nowPlaying : T('hudNothing', 'nothing rn'); np.classList.toggle('on', !!os.nowPlaying); }
    }
    const basePlay = os.playTrack;
    os.playTrack = function (track) {
        basePlay.call(os, track);
        os.nowPlaying = track.title || '???';
        renderProcs();
    };
    hudFill();
    setInterval(hudMoon, 5 * 60000); // the moon moves, slowly
    let procTimer = 0;
    const procsLater = () => { clearTimeout(procTimer); procTimer = setTimeout(renderProcs, 30); };
    let desk = $('desktop');
    if (desk && window.MutationObserver) new MutationObserver(list => {
        if (list.some(m => m.target === desk || m.target.parentNode === desk)) procsLater();
    }).observe(desk, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

    function applyPrefs() {
        root().classList.toggle('glass-on', !!os.prefs.glass);
        root().classList.toggle('scan-on', !!os.prefs.scan);
        root().classList.toggle('low-spec', !!os.prefs.lite);
        if (typeof os.applyGlow === 'function') os.applyGlow(false);
        if (os.deskFx) os.deskFx.apply();
        if (os.burn) os.burn.apply();
    }
    const glowNames = { low: '弱 / LOW', mid: '中 / MID', high: '強 / HIGH' };
    const onoff = v => v ? 'ON' : 'OFF';
    function renderPrefs() {
        let box = $('ui-prefs');
        if (!box) return;
        box.textContent = '';
        let rows = [
            ['sound', () => '[ 操作音 / UI SOUND: ' + onoff(os.prefs.sound) + ' ]'],
            ['glow', () => '[ 発光 / GLOW: ' + glowNames[os.prefs.glow] + ' ]'],
            ['glass', () => '[ 半透明の窓 / GLASS WINDOWS: ' + onoff(os.prefs.glass) + ' ]'],
            ['scan', () => '[ 走査線 / SCANLINES: ' + onoff(os.prefs.scan) + ' ]'],
            ['saver', () => '[ スクリーンセーバー / SCREENSAVER: ' + onoff(os.prefs.saver) + ' ]'],
            ['notices', () => '[ 新着のお知らせ / WHATS NEW POP UP: ' + onoff(os.prefs.notices) + ' ]'],
            ['shaderbg', () => '[ 動く壁紙 / LIVE WALLPAPER: ' + onoff(os.prefs.shaderbg !== false) + ' ]'],
            ['filmfx', () => '[ にじみ・粒子 / BLOOM + GRAIN: ' + onoff(os.prefs.filmfx !== false) + ' ]'],
            ['burnin', () => '[ 焼き付き / SCREEN BURN: ' + onoff(os.prefs.burnin !== false) + ' ]'],
            ['burnclear', () => '[ 焼き付きを消す / CLEAR BURN-IN ]'],
            ['lite', () => '[ 軽量モード / LOW SPEC: ' + onoff(os.prefs.lite) + ' ]']
        ];
        rows.forEach(r => {
            let b = document.createElement('button');
            b.className = 'settings-btn readable-ui';
            b.dataset.pref = r[0];
            b.textContent = r[1]();
            // not a toggle, just wipes the ghosts
            if (r[0] === 'burnclear') { b.onclick = () => { if (os.burn) os.burn.clear(); if (typeof os.clickAudio === 'function') os.clickAudio(); b.textContent = '[ 消した / CLEARED ]'; setTimeout(() => { b.textContent = r[1](); }, 1400); }; box.appendChild(b); return; }
            if (r[0] !== 'glow') b.setAttribute('aria-pressed', os.prefs[r[0]] ? 'true' : 'false');
            else b.dataset.level = os.prefs.glow;
            b.onclick = () => os.togglePref(r[0]);
            box.appendChild(b);
        });
    }
    os.togglePref = function (k) {
        if (k === 'glow') os.prefs.glow = os.prefs.glow === 'low' ? 'mid' : (os.prefs.glow === 'mid' ? 'high' : 'low');
        else os.prefs[k] = !os.prefs[k];
        os.savePrefs();
        applyPrefs();
        renderPrefs();
        if (typeof os.clickAudio === 'function') os.clickAudio();
    };

    function beam(win) {
        if (calm() || !win || win.classList.contains('is-min') || !win.offsetParent) return;
        let r = win.getBoundingClientRect(), b = document.createElement('div');
        b.className = 'win-boot'; b.setAttribute('aria-hidden', 'true');
        b.style.cssText = 'left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;z-index:' + ((+win.style.zIndex || 10) + 1);
        document.body.appendChild(b);
        b.addEventListener('animationend', () => b.remove());
        setTimeout(() => b.remove(), 1500);
    }
    os.winBeam = beam;
    const baseSummon = os.summon;
    os.summon = function (id) {
        let existed = document.getElementById('win-' + id), wasMin = existed && existed.classList.contains('is-min');
        baseSummon.call(os, id);
        if (!existed || wasMin) { let w = document.getElementById('win-' + id); if (w) requestAnimationFrame(() => beam(w)); }
        if (!existed && id === 'settings') renderPrefs();
        if (!existed && id === 'new') { let t = $('win-title-new'); if (t) t.textContent = '// new.log 【新着】'; }
        if (id === 'new') drawNewWin();
        if (['blog', 'music'].indexOf(id) !== -1 && document.getElementById('win-' + id)) os.markSeen(id);
    };

    document.addEventListener('pointerdown', e => {
        if (calm() || e.button !== 0) return;
        let t = e.target;
        if (!(t === document.body || t === document.documentElement || t.id === 'desktop' || t.id === 'desk-fx' || t.id === 'rain-fx' || (t.closest && t.closest('#desktop') && !t.closest('div[id^="win-"], .icon-wrap, button, a, input, textarea, select, .system-hud, #win-dock, .nb-mwin')))) return;
        let hz = os.deskFx && os.deskFx.on ? os.deskFx.horizon() : 0.4;
        let r = document.createElement('div');
        r.className = 'click-fx' + (e.clientY > innerHeight * (1 - hz) ? ' floor' : '');
        r.innerHTML = '<i></i><i></i><i></i><i></i>';
        r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
        document.body.appendChild(r);
        setTimeout(() => r.remove(), 700);
    });

    applyPrefs();
    boot();
    window.addEventListener('load', () => { applyPrefs(); renderProcs(); });
})();
