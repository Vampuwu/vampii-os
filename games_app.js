
// GAME GIRL AVERAGE. the tablet all the games live in. lol at the name, I stand by it
window.os = window.os || {};

(function () {
    const $ = id => document.getElementById(id);
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const click = () => typeof os.clickAudio === 'function' && os.clickAudio();
    const calm = () => document.documentElement.classList.contains('reduce-motion');
    const LIST = () => (typeof appsDB !== 'undefined' && Array.isArray(appsDB.games) ? appsDB.games : []);
    const BEST = 'vmp_gg', SCORES = 'vmp_gg_scores', SET = 'vmp_gg_set';
    const SYS = [{ id: 'scores', icon: '🏆', key: 'ggScores', name: 'SCORES', jp: '記録' }, { id: 'settings', icon: '⚙', key: 'ggSettings', name: 'SETTINGS', jp: '設定' }];
    let cur = null, sys = null, busy = false, clockT = 0, sleeping = false, bootT = [], off = false, idleT = 0, osdT = 0;

    const load = (k, d) => { try { return Object.assign(d, JSON.parse(localStorage.getItem(k) || '{}') || {}); } catch (e) { return d; } };
    const keep = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
    const set = () => load(SET, { boot: true, chime: true, tiles: true, beeps: true, bright: 100, vol: 8 });
    const hook = id => os.gg && os.gg.hooks && os.gg.hooks[id];
    const two = n => String(n).padStart(2, '0');
    function rgba(hex, a) { let n = parseInt(String(hex).slice(1), 16); return 'rgba(' + (n >> 16 & 255) + ', ' + (n >> 8 & 255) + ', ' + (n & 255) + ', ' + a + ')'; }

    const sfx = n => typeof os.sfx === 'function' && os.sfx(n);
    const tick = () => { if (set().beeps) sfx('tick'); };

    function scoreTiles() {
        let b = load(BEST, {}), s = set();
        return g => { let n = b[g.id]; return n && s.tiles ? String(g.best || '{n}').replace('{n}', n) : ''; };
    }
    function dress() {
        let s = set(), scr = $('gg-scr'); if (!scr) return;
        let dim = scr.querySelector('.gg-dim'); if (!dim) { dim = document.createElement('i'); dim.className = 'gg-dim'; scr.appendChild(dim); }
        dim.style.opacity = (1 - Math.max(25, Math.min(100, +s.bright || 100)) / 100).toFixed(2);
    }
    function home(pop) {
        dress();
        let h = $('gg-apps'); if (!h) return;
        let line = scoreTiles(), i = 0;
        let tile = (id, icon, name, jp, extra, cls) => `<button class="gg-app${cls || ''}" data-go="${esc(id)}" style="--i: ${i++}"><i class="gg-ic" data-em="${esc(icon)}"></i><b>${esc(name)}</b><small>${esc(jp || '')}</small>${extra ? `<em>${esc(extra)}</em>` : ''}</button>`;
        h.innerHTML = LIST().map(g => tile(g.id, g.icon, g.name, g.jp, line(g))).join('') + SYS.map(a => tile('sys:' + a.id, a.icon, T(a.key, a.name), a.jp, '', ' sys')).join('');
        h.querySelectorAll('[data-go]').forEach(x => x.onclick = () => { let id = x.dataset.go; tick(); id.startsWith('sys:') ? openSys(id.slice(4), x) : open(id, x); });
        let hi = $('gg-hi'); if (hi) hi.textContent = T('ggHi', 'pick one');
        let last = load(SET, {}).last, lg = LIST().find(g => g.id === last), le = $('gg-last');
        if (le) le.textContent = lg ? T('ggLast', 'last played // {g}').split('{g}').join(lg.name) : '';
        let ke = $('gg-keys'); if (ke) ke.textContent = T('ggKeys', '←→ pick   ENTER play   ESC home');
        let hm = $('gg-home');
        if (pop && hm && !calm()) { hm.classList.remove('in'); void hm.offsetWidth; hm.classList.add('in'); }
        where(T('ggHome', 'ホーム // home'));
        clock();
    }
    function where(t) { let w = $('gg-where'); if (w) w.textContent = t; let bk = $('gg-back'); if (bk) bk.hidden = !cur && !sys; }

    function look(g) {
        let s = $('gg-scr'); if (!s) return;
        ['--neon-primary', '--neon-secondary', '--neon-glow', '--gg-bg'].forEach(k => s.style.removeProperty(k));
        if (!g || !g.look) return;
        if (g.look.a) { s.style.setProperty('--neon-primary', g.look.a); s.style.setProperty('--neon-glow', rgba(g.look.a, 0.45)); }
        if (g.look.b) s.style.setProperty('--neon-secondary', g.look.b);
        if (g.look.bg) s.style.setProperty('--gg-bg', g.look.bg);
    }
    function zoom(el, from) {
        if (!el || calm()) return;
        let s = $('gg-scr').getBoundingClientRect(), r = from ? from.getBoundingClientRect() : null;
        el.style.transformOrigin = r ? (r.left + r.width / 2 - s.left) + 'px ' + (r.top + r.height / 2 - s.top) + 'px' : '50% 50%';
        el.classList.remove('gg-zoom'); void el.offsetWidth; el.classList.add('gg-zoom');
    }

    async function open(id, from) {
        if (busy || cur === id) return;
        let g = LIST().find(x => x.id === id); if (!g) return;
        busy = true;
        if (cur) leave();
        closeSys();
        let ld = $('gg-load'), hm = $('gg-home'), gm = $('gg-game');
        hm.hidden = true; ld.hidden = false;
        ld.innerHTML = '<i class="gg-ic" data-em="' + esc(g.icon) + '"></i><span>' + esc(g.name) + '</span><b class="gg-prog"><i></i></b>';
        zoom(ld, from);
        look(g);
        try {
            await os.need((g.keep || []).concat(g.files || []));
            let h = hook(id);
            if (!h) throw new Error(id + ' didnt say hi');
            if (!$('gg-game')) return;
            cur = id;
            let st2 = set(); st2.last = id; keep(SET, st2);
            ld.hidden = true; gm.hidden = false; gm.dataset.game = id;
            h.start(gm);
            where(g.name + (g.jp ? ' // ' + g.jp : ''));
            if (sleeping) h.pause();
        } catch (e) {
            ld.innerHTML = '<span>⚠ ' + esc(e.message) + '</span>';
            setTimeout(() => { if (!cur) { ld.hidden = true; hm.hidden = false; look(null); } }, 2200);
        }
        busy = false;
    }

    // stop the game, keep its scores, chuck its code
    function leave() {
        if (!cur) return;
        let g = LIST().find(x => x.id === cur), h = hook(cur);
        if (h) {
            try { let b = h.best && h.best(); if (b) { let all = load(BEST, {}); all[cur] = b; keep(BEST, all); } } catch (e) {}
            try { if (h.scores) { let all = load(SCORES, {}); all[cur] = h.scores(); keep(SCORES, all); } } catch (e) {}
            try { h.stop(); } catch (e) { console.warn(e); }
        }
        if (g) {
            os.unneed(g.files || []);
            let db = window.spritesDB;
            if (db && db.art) Object.keys(db.art).forEach(k => { if (k.split('/')[0] === g.id) delete db.art[k]; });
            if (db && db.pals) delete db.pals[g.id];
        }
        let gm = $('gg-game'); if (gm) { gm.innerHTML = ''; gm.hidden = true; delete gm.dataset.game; }
        cur = null;
        look(null);
    }
    function goHome() {
        if (busy) return;
        let was = cur || sys;
        leave(); closeSys();
        let hm = $('gg-home'), ld = $('gg-load');
        if (ld) ld.hidden = true;
        if (hm) hm.hidden = false;
        home(!!was);
        if (was) sfx('back');
        let f = document.querySelector('#gg-apps .gg-app'); if (f && was) f.focus({ preventScroll: true });
    }

    function openSys(id, from) {
        if (cur) leave();
        sys = id;
        let v = $('gg-sys'), hm = $('gg-home'); if (!v) return;
        hm.hidden = true; v.hidden = false; v.dataset.app = id;
        if (id === 'scores') scoresView(v); else settingsView(v);
        zoom(v, from);
        let a = SYS.find(x => x.id === id);
        where(T(a.key, a.name) + ' // ' + a.jp);
    }
    function closeSys() { sys = null; let v = $('gg-sys'); if (v) { v.hidden = true; v.innerHTML = ''; } }
    function scoresView(v, pick) {
        let all = load(SCORES, {}), games = LIST().filter(g => all[g.id] && all[g.id].length);
        if (!games.length) { v.innerHTML = '<div class="gg-empty"><i class="gg-ic" data-em="🏆"></i><p>' + esc(T('ggNoScores', 'nothing yet. go play something')) + '</p></div>'; return; }
        let g = games.find(x => x.id === pick) || games[0];
        v.innerHTML = '<div class="gg-tabs">' + games.map(x => `<button data-t="${esc(x.id)}" class="${x === g ? 'on' : ''}"><i class="gg-ic sm" data-em="${esc(x.icon)}"></i>${esc(x.name)}</button>`).join('') + '</div><div class="gg-boards"></div>';
        v.querySelector('.gg-boards').innerHTML = all[g.id].map(b => `<section><h4>${esc(b.t)}</h4>${b.rows && b.rows.length ? '<ol>' + b.rows.map(r => '<li>' + [].concat(r).map(c => '<span>' + esc(c) + '</span>').join('') + '</li>').join('') + '</ol>' : '<p>—</p>'}</section>`).join('');
        v.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tick(); scoresView(v, b.dataset.t); });
    }
    function settingsView(v) {
        let s = set(), rows = [['boot', 'ggSetBoot', 'boot screen'], ['chime', 'ggSetChime', 'the ba-ding'], ['tiles', 'ggSetTiles', 'best scores on the tiles'], ['beeps', 'ggSetBeeps', 'menu beeps']];
        v.innerHTML = '<div class="gg-set">'
            + `<label class="gg-tog gg-br"><span>${esc(T('ggSetBright', 'brightness'))}</span><input type="range" min="25" max="100" step="5" value="${+s.bright || 100}"></label>`
            + rows.map(r => `<button class="gg-tog${s[r[0]] ? ' on' : ''}" data-k="${r[0]}"><span>${esc(T(r[1], r[2]))}</span><i></i></button>`).join('') +
            `<button class="gg-tog act" data-k="replay"><span>${esc(T('ggSetReplay', 'play the boot again'))}</span><b>▶</b></button>` +
            `<div class="gg-about"><i class="gg-ic" data-em="🎮"></i><p><b>GAME GIRL AVERAGE</b><br>${esc(T('ggModel', 'model GGA-4444'))}<br>${esc(T('ggGames', '{n} games').split('{n}').join(LIST().length))}</p></div></div>`;
        let br = v.querySelector('.gg-br input');
        br.oninput = () => { let n = set(); n.bright = +br.value; keep(SET, n); dress(); };
        br.onchange = () => tick();
        v.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
            let k = b.dataset.k;
            if (k === 'replay') { tick(); goHome(); startBoot(true); return; }
            let n = set(); n[k] = !n[k]; keep(SET, n); b.classList.toggle('on', n[k]); sfx(n[k] ? 'on' : 'off');
        });
    }

    function sleep(on) {
        if (on === sleeping) return;
        sleeping = on;
        let h = cur && hook(cur);
        if (h) on ? h.pause() : h.resume();
    }

    function clock() {
        let c = $('gg-clock'); if (!c) { clearInterval(clockT); return; }
        let d = new Date(), hm = two(d.getHours()) + ':' + two(d.getMinutes());
        c.textContent = hm;
        let big = $('gg-time'); if (big) big.innerHTML = two(d.getHours()) + '<i>:</i>' + two(d.getMinutes());
        let dt = $('gg-date'); if (dt) dt.textContent = d.getFullYear() + '.' + two(d.getMonth() + 1) + '.' + two(d.getDate()) + ' ' + '日月火水木金土'[d.getDay()];
        let b = $('gg-bat');
        // always on 23%. its a meme. charge ur device
        if (b) { b.hidden = false; b.style.setProperty('--lv', '23%'); b.title = '23% // 充電して'; }
    }

    function startBoot(force) {
        let b = $('gg-boot'); if (!b) return;
        bootT.forEach(clearTimeout); bootT = [];
        let s = set();
        if ((!s.boot && !force) || calm()) { b.hidden = true; home(true); return; }
        b.hidden = false; b.className = 'gg-boot s1';
        b.innerHTML = '<div class="gb1"><pre></pre><i class="gb-bar"><b></b></i></div><div class="gb2"><p class="gb-by"></p><div class="gb-logo"><b>GAME GIRL</b><i>AVERAGE</i><sup>®</sup></div></div><div class="gb4"><i class="gg-ic" data-em="🎮"></i><i class="gb-sp"></i><p class="gb-carts"></p><p class="gb-start"></p></div>';
        let pre = b.querySelector('pre'), at = 120;
        let lines = [
            T('ggBoot1', 'GGA-4444 ............ v4.444'),
            T('ggBoot2', 'battery ............. ') + '23%',
            T('ggBoot3', 'cartridges .......... ') + LIST().length,
            T('ggBoot4', 'screen .............. ok'),
            T('ggBoot5', 'sound ............... ') + (s.chime ? 'ok' : 'off')
        ];
        lines.forEach(l => { bootT.push(setTimeout(() => { pre.textContent += l + '\n'; sfx('line'); }, at)); at += 170; });
        bootT.push(setTimeout(() => b.querySelector('.gb-bar b').style.width = '100%', 140));
        let by = b.querySelector('.gb-by');
        [...T('ggBy', 'a shitty milivia creation')].forEach((ch, i) => { let sp = document.createElement('span'); sp.textContent = ch; sp.style.setProperty('--i', i); by.appendChild(sp); });
        b.querySelector('.gb-carts').textContent = T('ggCarts', '{n} cartridges in').split('{n}').join(LIST().length);
        b.querySelector('.gb-start').textContent = T('ggStart', 'PRESS START');
        bootT.push(setTimeout(() => { b.className = 'gg-boot cut'; sfx('cut'); }, at + 250));
        bootT.push(setTimeout(() => { b.className = 'gg-boot s2'; sfx('swell'); }, at + 420));
        by.querySelectorAll('span').forEach((sp, i) => { if (sp.textContent.trim()) bootT.push(setTimeout(() => sfx('letter'), at + 420 + 500 + i * 55)); });
        bootT.push(setTimeout(() => { b.classList.add('s3'); }, at + 3300));
        bootT.push(setTimeout(() => { if (s.chime) sfx('ggFall'); }, at + 3650));
        bootT.push(setTimeout(() => { if (s.chime) sfx('ggLand'); }, at + 5250));
        bootT.push(setTimeout(() => { b.classList.add('ding'); if (s.chime) sfx('ding'); }, at + 5300));
        bootT.push(setTimeout(() => { b.className = 'gg-boot s4'; if (s.chime) sfx('start'); }, at + 6500));
    }
    function endBoot() {
        let b = $('gg-boot'); if (!b || b.hidden) return;
        bootT.forEach(clearTimeout); bootT = [];
        b.classList.add('out');
        sfx('doors');
        setTimeout(() => { b.hidden = true; b.className = 'gg-boot'; }, 560);
        setTimeout(() => home(true), 120);
    }

    // the actual buttons work lol
    function hardware(win) {
        let pwr = win.querySelector('.gg-pwr'), rk = win.querySelector('.gg-vol'), scr = $('gg-scr');
        if (pwr) pwr.onclick = () => {
            off = !off; sfx(off ? 'ggOff' : 'ggOn');
            let o = scr.querySelector('.gg-off'); if (!o) { o = document.createElement('i'); o.className = 'gg-off'; scr.appendChild(o); }
            o.className = 'gg-off ' + (off ? 'go' : 'back');
            if (off) sleep(true); else { setTimeout(() => { if (!off) o.className = 'gg-off'; }, 420); sleep(win.classList.contains('is-min') || document.hidden); }
            wake();
        };
        if (rk) rk.onclick = e => {
            if (off) return;
            let b = rk.getBoundingClientRect(), up = e.clientY < b.top + b.height / 2, n = set();
            n.vol = Math.max(0, Math.min(10, (n.vol == null ? 8 : n.vol) + (up ? 1 : -1))); keep(SET, n);
            if (out) out.gain.value = gain();
            rk.classList.remove('up', 'dn'); void rk.offsetWidth; rk.classList.add(up ? 'up' : 'dn');
            osd(n.vol); beep(n.vol); wake();
        };
        ['pointerdown', 'pointermove', 'wheel'].forEach(ev => win.addEventListener(ev, wake, { passive: true }));
        wake();
    }
    function osd(v) {
        let scr = $('gg-scr'); if (!scr) return;
        let o = scr.querySelector('.gg-osd'); if (!o) { o = document.createElement('div'); o.className = 'gg-osd'; scr.appendChild(o); }
        o.innerHTML = '<b>' + (v ? '♪' : '×') + '</b>' + Array.from({ length: 10 }, (_, i) => '<i class="' + (i < v ? 'on' : '') + '"></i>').join('');
        o.classList.add('on'); clearTimeout(osdT); osdT = setTimeout(() => o.classList.remove('on'), 1300);
    }
    // so the rocker actually does something
    let out = null;
    const gain = () => { let v = set().vol; v = v == null ? 8 : v; return Math.pow(v / 8, 1.6); };
    os.gg = os.gg || {};
    os.gg.out = A => { if (!out || out.context !== A) { out = A.createGain(); out.connect(A.destination); } out.gain.value = gain(); return out; };
    function beep(v) {
        try { let A = window.audioCtx || (window.audioCtx = new (window.AudioContext || window.webkitAudioContext)()), o = A.createOscillator(), g = A.createGain(), t = A.currentTime;
            o.type = 'square'; o.frequency.value = 600 + v * 60; g.gain.setValueAtTime(0.02, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06); o.connect(g); g.connect(os.gg.out(A)); o.start(t); o.stop(t + 0.07); } catch (e) {}
    }
    // leave it on home for a bit and it dims like a phone
    function wake() {
        let scr = $('gg-scr'); if (!scr) return;
        scr.classList.remove('idle'); clearTimeout(idleT);
        idleT = setTimeout(() => { let s2 = $('gg-scr'); if (s2 && !cur && !off) s2.classList.add('idle'); }, 120000);
    }
    document.addEventListener('keydown', () => { if ($('win-games.exe')) wake(); }, true);

    function boot(win) {
        clock(); clearInterval(clockT); clockT = setInterval(clock, 5000);
        win.querySelectorAll('[data-gg="home"]').forEach(b => b.onclick = () => { click(); goHome(); });
        let kill = win.querySelector('.kill-btn');
        if (kill) kill.addEventListener('click', shut, true);
        new MutationObserver(() => sleep(off || win.classList.contains('is-min') || document.hidden)).observe(win, { attributes: true, attributeFilter: ['class'] });
        hardware(win);
        let bt = $('gg-boot'); if (bt) bt.addEventListener('pointerdown', endBoot);
        startBoot();
    }
    function shut() {
        bootT.forEach(clearTimeout); bootT = [];
        off = false; clearTimeout(idleT); clearTimeout(osdT);
        busy = false;
        leave(); closeSys();
        clearInterval(clockT);
        sleeping = false;
    }
    document.addEventListener('visibilitychange', () => { let w = $('win-games.exe'); if (w) sleep(off || document.hidden || w.classList.contains('is-min')); });
    // esc = back to home, not close the whole thing. arrows walk the tiles
    document.addEventListener('keydown', e => {
        let w = $('win-games.exe');
        if (!w || !w.classList.contains('is-active') || w.classList.contains('is-min')) return;
        if (off) { e.preventDefault(); e.stopImmediatePropagation(); return; }
        let bt = $('gg-boot');
        if (bt && !bt.hidden) { e.preventDefault(); e.stopImmediatePropagation(); endBoot(); return; }
        if (e.key === 'Escape' && (cur || sys)) { e.preventDefault(); e.stopImmediatePropagation(); click(); goHome(); return; }
        if (cur || sys || !/^Arrow/.test(e.key)) return;
        let tiles = [...document.querySelectorAll('#gg-apps .gg-app')]; if (!tiles.length) return;
        e.preventDefault();
        let i = tiles.indexOf(document.activeElement), cols = tiles.filter(t => t.offsetTop === tiles[0].offsetTop).length || 1;
        let n = i < 0 ? 0 : e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'ArrowDown' ? i + cols : i - cols;
        n = Math.max(0, Math.min(tiles.length - 1, n));
        if (n !== i) sfx('hover');
        tiles[n].focus();
    }, true);

    let tpl = document.createElement('template');
    tpl.id = 'games.exe';
    tpl.innerHTML = `
        <i class="gg-lip" aria-hidden="true"></i><button class="gg-vol" title="音量 // volume" aria-label="volume"><i></i></button><button class="gg-pwr" title="電源 // power" aria-label="screen on / off"><i></i></button>
        ${['tl', 'tr', 'bl', 'br'].map(k => `<i class="gg-bump ${k}" aria-hidden="true"><b><i class="gg-screw"></i></b></i>`).join('')}
        <div class="gg-dev">
            <span class="gg-vent l" aria-hidden="true">${'<i></i>'.repeat(9)}</span><span class="gg-vent r" aria-hidden="true">${'<i></i>'.repeat(9)}</span><span class="gg-vent t" aria-hidden="true">${'<i></i>'.repeat(8)}</span>

            <i class="gg-wear" aria-hidden="true"></i>

            <div class="gg-scr" id="gg-scr">
                <div class="gg-bar"><button class="gg-back" id="gg-back" data-gg="home" hidden aria-label="home">◀</button><b id="gg-where"></b><span class="gg-r"><span class="gg-sig" title="圏外 // no signal, so scores stay on here"><i></i><i></i><i></i><i></i><em>圏外</em></span><span id="gg-clock"></span><span class="gg-bat" id="gg-bat" hidden><i></i></span></span></div>
                <div class="gg-home" id="gg-home">
                    <div class="gg-top"><div class="gg-time" id="gg-time"></div><div><p id="gg-date"></p><p class="gg-hi" id="gg-hi"></p></div></div>
                    <div class="gg-apps" id="gg-apps"></div>
                    <div class="gg-foot"><span id="gg-last"></span><span id="gg-keys"></span></div>
                </div>
                <div class="gg-sys" id="gg-sys" hidden></div>
                <div class="gg-load" id="gg-load" hidden></div>
                <div class="gg-game" id="gg-game" hidden></div>
                <div class="gg-boot" id="gg-boot" hidden></div>
            </div>
            <div class="gg-chin">
                <div class="gg-mark" aria-label="GAME GIRL AVERAGE"><b>GAME GIRL</b><i>AVERAGE</i></div>
                <button class="gg-homebtn" data-gg="home" aria-label="home"></button>
                <span class="gg-led" aria-hidden="true"></span>
                <span class="gg-grill" aria-hidden="true">${'<i></i>'.repeat(14)}</span>
                <span class="gg-spk" aria-hidden="true">${'<i></i>'.repeat(7)}</span>
                <span class="gg-emb" aria-hidden="true">GGA-4444 · 平均的な女の子 · 2026</span>
            </div>
        </div>`;
    document.body.appendChild(tpl);

    // the lip is the same shape behind it = the bottom edge
    let st = document.createElement('style');
    st.textContent = `
        #desktop > #win-games\\.exe { --gg-body1: #2a2731; --gg-body2: #121016; --gg-trim: color-mix(in srgb, var(--neon-secondary) 70%, #141218);
            --gg-cut: polygon(10px 0, calc(100% - 28px) 0, 100% 28px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 28px 100%, 0 calc(100% - 28px), 0 10px);
            border: 0 !important; border-radius: 14px !important; background: none !important;
            box-shadow: 0 30px 50px -10px rgba(0,0,0,0.65) !important; }
        #desktop > #win-games\\.exe::before { display: none !important; }
        #desktop > #win-games\\.exe::after { display: none !important; }
        #desktop > #win-games\\.exe .window-header { position: absolute; top: 0; left: 0; right: 0; z-index: 3; height: 22px; padding: 4px 18px !important; background: none !important; border: 0 !important; box-shadow: none !important; justify-content: flex-end !important; }
        #desktop > #win-games\\.exe .window-header::before, #desktop > #win-games\\.exe .window-header::after { display: none !important; }
        #desktop > #win-games\\.exe .window-header > span:first-child { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
        #desktop > #win-games\\.exe .win-btn, #desktop > #win-games\\.exe .kill-btn { width: 28px !important; height: 15px !important; margin-left: 5px !important; border-radius: 5px !important; border: 0 !important; background: linear-gradient(180deg, #34313b, #1a181e) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,0.13), inset 0 -1px 0 rgba(0,0,0,0.6), 0 0 0 1px #050407, 0 0 0 3px #0f0e12, 0 1px 0 3px rgba(255,255,255,0.05) !important; }
        #desktop > #win-games\\.exe .win-btn::before, #desktop > #win-games\\.exe .kill-btn::before { color: #8a8594 !important; opacity: 1 !important; transform: scale(0.7) !important; }
        #desktop > #win-games\\.exe .win-btn:active, #desktop > #win-games\\.exe .kill-btn:active { transform: translateY(1px); background: #141217 !important; }
        #desktop > #win-games\\.exe .min-btn { --gl: var(--gl-px-min); } #desktop > #win-games\\.exe .max-btn { --gl: var(--gl-px-max); } #desktop > #win-games\\.exe .kill-btn { --gl: var(--gl-px-x); }
        #desktop > #win-games\\.exe .win-btn:hover::before { color: var(--neon-secondary) !important; } #desktop > #win-games\\.exe .kill-btn:hover::before { color: #ff5470 !important; }
        #desktop > #win-games\\.exe .window-body { position: relative; padding: 0 0 9px !important; background: none !important; box-shadow: none !important; overflow: visible !important; max-height: none !important; }
        .gg-lip { position: absolute; inset: 0; clip-path: var(--gg-cut); background: linear-gradient(180deg, #19171d calc(100% - 10px), #55505e calc(100% - 9px), #36323d calc(100% - 8px), #26232b calc(100% - 6px), color-mix(in srgb, var(--gg-trim) 40%, #26232b) calc(100% - 5.5px), color-mix(in srgb, var(--gg-trim) 40%, #26232b) calc(100% - 4.5px), #1a181e calc(100% - 4px), #0b0a0d); }
        .gg-dev { position: relative; margin: 0; padding: 26px 24px 0; clip-path: polygon(11px 1px, calc(100% - 28px) 1px, calc(100% - 1px) 28px, calc(100% - 1px) calc(100% - 10px), calc(100% - 10px) 100%, 28px 100%, 1px calc(100% - 27px), 1px 11px);
            background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E"), radial-gradient(120% 70% at 20% 0%, rgba(255,255,255,0.06), transparent 60%), linear-gradient(170deg, #2c2933, #1a181e 55%, #121015);
            box-shadow: inset 0 2px 0 rgba(255,255,255,0.09), inset 2px 0 0 rgba(255,255,255,0.04), inset -2px 0 0 rgba(0,0,0,0.4), inset 0 -2px 2px rgba(0,0,0,0.35), inset 0 -1px 0 rgba(255,255,255,0.06); }
        .gg-dev::after { content: none; }
        .gg-bump { position: absolute; z-index: 4; width: 70px; height: 70px; pointer-events: none; filter: drop-shadow(0 3px 2px rgba(0,0,0,0.7)) drop-shadow(0 0 1px #000); }
        .gg-bump b { position: absolute; inset: 0; clip-path: polygon(12px 0, 70px 0, 70px 15px, 26px 15px, 15px 26px, 15px 70px, 0 70px, 0 12px);
            background: var(--wear, none), repeating-linear-gradient(135deg, transparent 0 5px, rgba(0,0,0,0.35) 5px 6px, rgba(255,255,255,0.04) 6px 7px) 0 0 / 100% 100%, linear-gradient(var(--g, 135deg), #3b3741, #222026 35%, #141217 70%); }
        .gg-bump.bl b, .gg-bump.br b { --g: 45deg; } .gg-bump.bl b::after, .gg-bump.br b::after { background: rgba(0,0,0,0.4); }
        .gg-bump b::after { content: ''; position: absolute; inset: 0; clip-path: polygon(12px 0, 70px 0, 70px 2px, 13px 2px, 2px 13px, 2px 70px, 0 70px, 0 12px); background: rgba(255,255,255,0.13); }
        .gg-bump .gg-screw { left: 4px; top: 22px; } .gg-bump.tr .gg-screw { --r: -20deg; } .gg-bump.bl .gg-screw { --r: 75deg; }
        .gg-bump.tl { left: -3px; top: 0; } .gg-bump.tr { right: -3px; top: 0; transform: scaleX(-1); }
        .gg-bump.bl { left: -3px; bottom: 0; transform: scaleY(-1); } .gg-bump.br { right: -3px; bottom: 0; transform: scale(-1, -1); }
        .gg-vent { position: absolute; z-index: 1; display: flex; gap: 4px; }
        .gg-vent i, .gg-grill i, .gg-spk i { display: block; border-radius: 2px; background: #050407; box-shadow: inset 0 2px 2px #000, 0 1px 0 rgba(255,255,255,0.07); }
        .gg-vent.l, .gg-vent.r { top: 50%; transform: translateY(-50%); flex-direction: column; } .gg-vent.l { left: 7px; } .gg-vent.r { right: 7px; }
        .gg-vent.l i, .gg-vent.r i { width: 9px; height: 4px; }
        .gg-vent.t { top: 9px; left: 34%; } .gg-vent.t i { width: 4px; height: 8px; }
        .gg-grill { display: grid; grid-template-columns: repeat(7, 5px); grid-auto-rows: 9px; gap: 4px 4px; margin-left: auto; margin-right: 92px; position: relative; z-index: 2; }
        .gg-dev::before { content: ''; position: absolute; top: 10px; left: 50%; width: 6px; height: 6px; margin-left: -3px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #3a5a7a, #05070a 70%); box-shadow: 0 0 0 1px #000, 0 1px 0 rgba(255,255,255,0.1); }
        .gg-scr { --gg-bg: #07060a; position: relative; height: min(66vh, 600px); display: flex; flex-direction: column; border-radius: 10px; overflow: hidden; background: var(--gg-bg); color: var(--text-main);
            box-shadow: 0 0 0 2px #000, 0 -2px 0 3px rgba(0,0,0,0.55), 0 2px 0 3px rgba(255,255,255,0.07), inset 0 0 40px rgba(0,0,0,0.8); font-family: 'DotGothic16', monospace;
            --sh-tint: color-mix(in srgb, var(--neon-primary) 9%, transparent); --sh-line: color-mix(in srgb, var(--neon-primary) 45%, transparent); --sh-soft: color-mix(in srgb, var(--neon-primary) 16%, transparent); --sh-dim: color-mix(in srgb, var(--neon-primary) 28%, transparent);
            --sh-hot: linear-gradient(180deg, color-mix(in srgb, var(--neon-primary) 88%, #fff 12%), color-mix(in srgb, var(--neon-primary) 70%, #000)); }
        .gg-scr [hidden] { display: none !important; }
        .gg-scr::after { content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 9; border-radius: inherit; background: linear-gradient(120deg, rgba(255,255,255,0.055) 0 22%, transparent 22.2% 100%), repeating-linear-gradient(180deg, transparent 0 2px, rgba(0,0,0,0.08) 2px 3px); }
        .gg-bar { flex: 0 0 auto; display: flex; align-items: center; gap: 8px; height: 26px; padding: 0 10px; font-size: 12px; color: #fff; background: rgba(0,0,0,0.55); border-bottom: 1px solid color-mix(in srgb, var(--neon-primary) 35%, transparent); position: relative; z-index: 4; }
        .gg-bar b { flex: 1; min-width: 0; font-weight: normal; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 1px; }
        .gg-back { background: none; border: 0; color: var(--neon-primary); font: inherit; font-size: 13px; padding: 0 4px; cursor: inherit; }
        .gg-back:hover { color: #fff; transform: translateX(-2px); }
        .gg-r { display: flex; align-items: center; gap: 8px; font-variant-numeric: tabular-nums; }
        #desktop > #win-games\\.exe .window-header { height: 24px !important; padding: 0 22px !important; align-items: center !important; }
        .gg-bat i { background: #ffb547 !important; }
        .gg-screw { position: absolute; width: 7px; height: 7px; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #6a6474, #2a2630 70%); box-shadow: inset 0 0 0 1px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.08); }
        .gg-screw::after { content: ''; position: absolute; left: 1px; right: 1px; top: 3px; height: 1px; background: #121015; transform: rotate(var(--r, 30deg)); }
        
        .gg-vol { position: absolute; z-index: -1; left: -3px; top: 140px; width: 4px; height: 80px; padding: 0; border: 0; cursor: inherit; border-radius: 3px 0 0 3px; transform-origin: right center;
            background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E"), linear-gradient(180deg, rgba(0,0,0,0.55), transparent 5px, transparent 37px, rgba(0,0,0,0.6) 39.5px, rgba(255,255,255,0.08) 40.5px, transparent 43px, transparent calc(100% - 5px), rgba(0,0,0,0.55)), linear-gradient(90deg, rgba(255,255,255,0.36) 0 0.8px, #5b5664 1px, #423e4a 40%, #2b2832 80%, #1c1a21);
            box-shadow: -1px 1px 1px rgba(0,0,0,0.55); }
        .gg-vol::after { content: ''; position: absolute; right: -2px; top: -3px; bottom: -3px; width: 3px; border-radius: 2px 0 0 2px; background: linear-gradient(90deg, #050407, #0d0c10); box-shadow: inset -1px 0 0 rgba(255,255,255,0.06); }
        .gg-vol i { display: none; }
        .gg-vol.up, .gg-vol.dn { animation: ggRk 0.2s; transform-origin: 50% 50%; }
        @keyframes ggRk { 40% { transform: translateX(0.5px) rotate(var(--rk, 0deg)); } } .gg-vol.up { --rk: 1.6deg; } .gg-vol.dn { --rk: -1.6deg; }
        .gg-pwr { position: absolute; z-index: -1; top: -5px; left: 100px; width: 44px; height: 6px; padding: 0; border: 0; cursor: inherit; border-radius: 3px 3px 0 0;
            background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E"), linear-gradient(90deg, rgba(0,0,0,0.5), transparent 4px, transparent calc(100% - 4px), rgba(0,0,0,0.55)), linear-gradient(180deg, rgba(255,255,255,0.35) 0 0.8px, color-mix(in srgb, var(--neon-primary) 28%, #57525f) 1px, color-mix(in srgb, var(--neon-primary) 22%, #34303b) 55%, color-mix(in srgb, var(--neon-primary) 12%, #18161c));
            box-shadow: 0 -1px 1px rgba(0,0,0,0.45); }
        .gg-pwr::after { content: ''; position: absolute; left: -3px; right: -3px; bottom: -2px; height: 3px; border-radius: 2px 2px 0 0; background: linear-gradient(180deg, #050407, #0d0c10); box-shadow: inset 0 -1px 0 rgba(255,255,255,0.06); }
        .gg-pwr::before, .gg-pwr i { display: none; }
        .gg-pwr:active { top: -4px; height: 5px; }
        .gg-off { position: absolute; inset: 0; z-index: 12; pointer-events: none; background: #000; opacity: 0; }
        .gg-off.go { animation: ggOffA 0.4s forwards; } .gg-off.back { opacity: 1; animation: ggOnA 0.4s forwards; }
        @keyframes ggOffA { 0% { opacity: 0; } 30% { opacity: 1; clip-path: inset(0 0 0 0); background: #000; } 100% { opacity: 1; } }
        @keyframes ggOnA { 0% { opacity: 1; } 100% { opacity: 0; } }
        .gg-off.go::after { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 2px; margin-top: -1px; background: #fff; box-shadow: 0 0 10px #fff; animation: ggLine 0.4s forwards; }
        @keyframes ggLine { 0% { transform: scaleY(200); opacity: 0.9; } 40% { transform: scaleY(1); opacity: 1; } 80% { transform: scale(0.02, 1); opacity: 1; } 100% { transform: scale(0, 1); opacity: 0; } }
        .gg-osd { position: absolute; z-index: 11; left: 50%; top: 40px; transform: translateX(-50%); display: flex; align-items: center; gap: 3px; padding: 7px 12px; border-radius: 8px; background: rgba(0,0,0,0.78); box-shadow: 0 0 0 1px rgba(255,255,255,0.12); opacity: 0; transition: opacity 0.25s; pointer-events: none; }
        .gg-osd.on { opacity: 1; } .gg-osd b { font-weight: normal; margin-right: 6px; color: #fff; } .gg-osd i { width: 6px; height: 12px; background: rgba(255,255,255,0.15); } .gg-osd i.on { background: var(--neon-primary); }
        .gg-scr .gg-dim { transition: opacity 1.4s; } .gg-scr.idle .gg-dim { opacity: 0.6 !important; }
        #gg-where { visibility: hidden; }
        .gg-emb { position: absolute; left: 50%; bottom: 3px; transform: translateX(-50%); font: 7px Arial, sans-serif; letter-spacing: 2px; color: rgba(0,0,0,0.55); text-shadow: 0 1px 0 rgba(255,255,255,0.07); white-space: nowrap; pointer-events: none; }
        .gg-chin { position: relative; }
        .gg-sig { display: flex; align-items: flex-end; gap: 1px; height: 10px; opacity: 0.85; }
        .gg-sig i { width: 2px; border: 1px solid #cfcbd6; border-bottom-width: 1px; box-sizing: border-box; opacity: 0.55; }
        .gg-sig i:nth-child(1) { height: 4px; } .gg-sig i:nth-child(2) { height: 6px; } .gg-sig i:nth-child(3) { height: 8px; } .gg-sig i:nth-child(4) { height: 10px; }
        .gg-sig em { font-style: normal; font-size: 9px; margin-left: 4px; color: #ff8a9a; line-height: 10px; }
        .gg-bat { position: relative; width: 20px; height: 10px; border: 1px solid #cfcbd6; border-radius: 2px; box-sizing: border-box; }
        .gg-bat::after { content: ''; position: absolute; right: -3px; top: 2px; width: 2px; height: 4px; background: #cfcbd6; }
        .gg-bat i { position: absolute; left: 1px; top: 1px; bottom: 1px; width: calc(var(--lv, 100%) - 2px); background: #cfcbd6; }
        .gg-bat.chg i { background: var(--neon-secondary); animation: ggChg 1.6s steps(4) infinite; }
        @keyframes ggChg { 0% { width: 2px; } }
        .gg-home { position: relative; flex: 1; min-height: 0; overflow: hidden; padding: 18px 26px; display: flex; flex-direction: column;
            background: radial-gradient(120% 90% at 20% 0%, color-mix(in srgb, var(--neon-primary) 18%, transparent), transparent 60%), radial-gradient(80% 70% at 100% 100%, color-mix(in srgb, var(--neon-secondary) 12%, transparent), transparent 60%); }
        .gg-dim { position: absolute; inset: 0; z-index: 8; background: #000; pointer-events: none; opacity: 0; }
        .gg-br input { width: 46%; accent-color: var(--neon-primary); }
        .gg-home::before { content: ''; position: absolute; inset: -40px; pointer-events: none; opacity: 0.55;
            background: radial-gradient(1px 1px at 20px 30px, #fff, transparent), radial-gradient(1px 1px at 120px 80px, var(--neon-secondary), transparent), radial-gradient(1.5px 1.5px at 200px 160px, #fff, transparent), radial-gradient(1px 1px at 60px 190px, var(--neon-primary), transparent);
            background-size: 240px 220px; animation: ggDrift 60s linear infinite; }
        @keyframes ggDrift { to { transform: translate(-240px, 110px); } }
        .gg-top { position: relative; display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
        .gg-time { font: 44px/1 'DotGothic16', monospace; color: #fff; letter-spacing: 2px; text-shadow: 3px 3px 0 color-mix(in srgb, var(--neon-primary) 45%, #000); }
        .gg-time i { font-style: normal; animation: blink 1s steps(1) infinite; }
        .gg-top p { margin: 0; font-size: 13px; color: #cfcbd6; }
        .gg-hi { color: var(--neon-secondary) !important; margin-top: 3px !important; }
        .gg-foot { position: relative; margin-top: auto; display: flex; justify-content: space-between; gap: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 12px; color: #8f8b9a; white-space: pre; }
        #gg-last { color: var(--neon-secondary); }
        .gg-apps { position: relative; display: grid; grid-template-columns: repeat(auto-fill, 130px); gap: 14px 12px; align-content: start; }
        .gg-app { position: relative; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 4px 8px; background: none; border: 0; border-radius: 14px; color: #fff; font: inherit; cursor: inherit; outline: none; transition: background 0.15s; }
        .gg-app:hover, .gg-app:focus-visible { background: rgba(255,255,255,0.06); }
        .gg-app:focus-visible { box-shadow: inset 0 0 0 2px var(--neon-secondary); }
        .gg-home.in .gg-app { animation: ggPop 0.45s cubic-bezier(.2, 1.5, .4, 1) both; animation-delay: calc(var(--i) * 70ms); }
        @keyframes ggPop { from { opacity: 0; transform: translateY(14px) scale(0.6); } }
        .gg-app .gg-ic { width: 96px; height: 96px; background-size: 96px 96px; animation: ggBob 3.4s ease-in-out infinite; animation-delay: calc(var(--i) * -0.8s); }
        @keyframes ggBob { 50% { transform: translateY(-4px); } }
        .gg-app:hover .gg-ic, .gg-app:focus-visible .gg-ic { animation: ggHop 0.5s cubic-bezier(.3, 1.6, .5, 1); filter: drop-shadow(0 6px 3px rgba(0,0,0,0.6)) drop-shadow(0 0 14px var(--neon-glow)) brightness(1.15); }
        @keyframes ggHop { 40% { transform: translateY(-9px) rotate(-3deg); } 70% { transform: translateY(-2px) rotate(2deg); } }
        .gg-app b { font-weight: normal; font-size: 14px; letter-spacing: 1px; }
        .gg-app small { font-size: 11px; opacity: 0.55; }
        .gg-app em { font-style: normal; font-size: 11px; color: #000; background: var(--neon-secondary); padding: 0 6px; border-radius: 3px; margin-top: 2px; }
        .gg-app.sys b { color: #cfcbd6; }
        .gg-app.sys .gg-ic { width: 72px; height: 72px; background-size: 72px 72px; margin: 12px 0; }
        .gg-ic { display: block; width: 64px; height: 64px; background: no-repeat center / 64px 64px; image-rendering: pixelated; filter: drop-shadow(0 5px 3px rgba(0,0,0,0.6)) drop-shadow(0 0 8px var(--neon-glow)); }
        .gg-ic.sm { width: 32px; height: 32px; background-size: 32px 32px; filter: none; }
        .gg-zoom { animation: ggZoom 0.32s cubic-bezier(.2, .9, .3, 1); }
        @keyframes ggZoom { from { transform: scale(0.15); opacity: 0; border-radius: 30px; } }
        .gg-home.in { animation: ggBack 0.3s ease-out; }
        @keyframes ggBack { from { transform: scale(1.06); opacity: 0.4; } }
        .gg-load { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; font-size: 14px; letter-spacing: 2px; }
        .gg-load .gg-ic { width: 96px; height: 96px; background-size: 96px 96px; animation: ggBob 0.8s ease-in-out infinite; }
        .gg-prog { display: block; width: 120px; height: 6px; background: rgba(255,255,255,0.08); }
        .gg-prog i { display: block; height: 100%; width: 40%; background: var(--neon-primary); animation: ggLoad 0.8s steps(6) infinite alternate; }
        @keyframes ggLoad { to { width: 100%; } }
        .gg-game { flex: 1; min-height: 0; overflow: hidden; padding: 10px; box-sizing: border-box; font-family: 'Noto Sans JP', 'Meiryo', 'Hiragino Sans', 'Osaka', 'MS Gothic', 'Courier New', monospace; }
        .gg-game[data-game="sweep"] { padding: 0; }
        .gg-game .file-path { display: none; }
        .gg-sys { flex: 1; min-height: 0; overflow-y: auto; padding: 16px 22px; scrollbar-width: thin; }
        .gg-empty { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #cfcbd6; }
        .gg-empty .gg-ic { width: 96px; height: 96px; background-size: 96px 96px; animation: ggBob 2.4s ease-in-out infinite; }
        .gg-tabs { display: flex; gap: 6px; margin-bottom: 12px; }
        .gg-tabs button { display: flex; align-items: center; gap: 6px; padding: 4px 12px 4px 6px; border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; background: rgba(255,255,255,0.03); color: #cfcbd6; font: inherit; cursor: inherit; }
        .gg-tabs button.on { border-color: var(--neon-secondary); color: #fff; background: color-mix(in srgb, var(--neon-secondary) 14%, transparent); }
        .gg-boards { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px; }
        .gg-boards section { padding: 10px 12px; border-radius: 10px; background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.06); animation: ggPop 0.35s both; }
        .gg-boards h4 { margin: 0 0 6px; font-weight: normal; color: var(--neon-secondary); font-size: 13px; letter-spacing: 1px; }
        .gg-boards ol { list-style: none; margin: 0; padding: 0; font-size: 12px; }
        .gg-boards li { display: flex; gap: 10px; padding: 2px 0; border-bottom: 1px dashed rgba(255,255,255,0.06); }
        .gg-boards li span:first-child { width: 22px; color: var(--neon-primary); }
        .gg-boards li span:nth-child(2) { flex: 1; color: #fff; }
        .gg-boards li span:last-child { opacity: 0.5; }
        .gg-boards li:first-child span:nth-child(2) { color: #ffd04a; }
        .gg-set { display: flex; flex-direction: column; gap: 6px; max-width: 460px; }
        .gg-tog { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.3); color: #fff; font: inherit; font-size: 14px; cursor: inherit; text-align: left; }
        .gg-tog:hover { border-color: var(--neon-secondary); }
        .gg-tog i { position: relative; width: 34px; height: 18px; border-radius: 9px; background: #2a2731; transition: background 0.2s; }
        .gg-tog i::after { content: ''; position: absolute; left: 2px; top: 2px; width: 14px; height: 14px; border-radius: 50%; background: #8f8b9a; transition: transform 0.22s cubic-bezier(.3, 1.6, .5, 1), background 0.2s; }
        .gg-tog.on i { background: var(--neon-primary); } .gg-tog.on i::after { transform: translateX(16px); background: #fff; }
        .gg-tog b { color: var(--neon-secondary); font-weight: normal; }
        .gg-about { display: flex; align-items: center; gap: 14px; margin-top: 14px; padding: 12px; border-radius: 10px; background: rgba(255,255,255,0.03); font-size: 12px; color: #cfcbd6; line-height: 1.7; }
        .gg-about b { font-weight: normal; color: #fff; }
        .gg-boot { position: absolute; inset: 0; z-index: 8; background: #000; display: grid; place-items: center; cursor: inherit; }
        .gg-boot .gb1, .gg-boot .gb2 { position: absolute; inset: 0; }
        .gg-boot .gb1 { padding: 22px 26px; color: #cfcbd6; }
        .gg-boot pre { margin: 0; font: 15px/1.6 'DotGothic16', monospace; white-space: pre; }
        .gb-bar { position: absolute; left: 26px; right: 26px; bottom: 26px; height: 8px; border: 1px solid #55505f; display: block; }
        .gb-bar b { display: block; height: 100%; width: 0; background: var(--neon-primary); transition: width 1.1s steps(12); }
        .gg-boot .gb2 { display: none; background: #9bb000; background: linear-gradient(180deg, #a4b83a, #8ea32a); place-items: center; }
        .gg-boot.cut .gb1, .gg-boot.s2 .gb1, .gg-boot.s4 .gb1 { display: none; }
        .gg-boot.s2 .gb2 { display: grid; animation: gbOn 0.6s ease-out both; }
        @keyframes gbOn { from { opacity: 0; } }
        .gg-boot .gb4 { display: none; inset: 0; position: absolute; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
            background: radial-gradient(60% 60% at 50% 45%, color-mix(in srgb, var(--neon-primary) 26%, #0b0a10), #050408 75%); }
        .gg-boot.s4 .gb4 { display: flex; animation: gbOn 0.35s ease-out both; }
        .gb4 .gg-ic { width: 128px; height: 128px; background-size: 128px 128px; animation: ggBob 1.8s ease-in-out infinite; }
        .gb-sp { position: absolute; left: 50%; top: 50%; width: 4px; height: 4px; margin: -86px 0 0 58px; background: #fff; box-shadow: -120px 30px 0 var(--neon-secondary), -40px -24px 0 #fff, 16px 70px 0 var(--neon-primary), -96px 84px 0 #fff; animation: gbTw 1.1s steps(2) infinite; }
        @keyframes gbTw { 50% { opacity: 0.2; transform: scale(0.5); } }
        .gb-carts { margin: 4px 0 0; font: 13px 'DotGothic16', monospace; color: #cfcbd6; letter-spacing: 1px; }
        .gb-start { margin: 10px 0 0; font: 18px 'DotGothic16', monospace; color: #fff; letter-spacing: 4px; animation: blink 0.9s steps(1) infinite; }
        @property --gbo { syntax: '<percentage>'; inherits: false; initial-value: 0%; }
        .gb-by { position: absolute; left: 0; right: 0; top: 50%; margin: -12px 0 0; text-align: center; font: 22px/1 'DotGothic16', monospace; color: #24341a; white-space: pre; }
        .gb-by span { display: inline-block; opacity: 0; animation: gbLetter 0.7s cubic-bezier(.3, 1.6, .5, 1) forwards, gbWave 1.6s ease-in-out infinite; animation-delay: calc(var(--i) * 55ms), calc(var(--i) * 90ms + 0.7s); }
        @keyframes gbLetter { from { opacity: 0; transform: translateY(-14px); } to { opacity: 1; transform: none; } }
        @keyframes gbWave { 50% { transform: translateY(-3px); } }
        .gg-boot.s3 .gb-by { animation: gbOut 0.4s steps(4) forwards; }
        .gb-logo { display: none; align-items: baseline; gap: 8px; color: #24341a; }
        .gg-boot.s3 .gb-logo { display: flex; animation: gbDrop 1.6s steps(26) 0.35s both; }
        .gb-logo b { font: italic 900 46px/1 'Arial Black', 'Helvetica Neue', Arial, sans-serif; letter-spacing: -1px; transform: skewX(-7deg) scaleY(0.8); }
        .gb-logo i { font: 15px/1 'DotGothic16', monospace; font-style: normal; letter-spacing: 1px; color: #a4b83a; background: #24341a; padding: 3px 8px 4px; border-radius: 2px; transform: rotate(-5deg) translateY(-6px); }
        .gb-logo sup { font: 12px/1 'DotGothic16', monospace; align-self: flex-start; }
        @keyframes gbDrop { from { transform: translateY(-260px); } }
        .gg-boot.ding .gb-logo { animation: gbDing 0.5s steps(2); }
        @keyframes gbDing { 50% { color: #fff; } }
        .gg-boot.out { -webkit-mask: linear-gradient(#000 calc(50% - var(--gbo)), transparent calc(50% - var(--gbo)) calc(50% + var(--gbo)), #000 calc(50% + var(--gbo))); mask: linear-gradient(#000 calc(50% - var(--gbo)), transparent calc(50% - var(--gbo)) calc(50% + var(--gbo)), #000 calc(50% + var(--gbo))); animation: gbOpen 0.5s steps(10) forwards; }
        @keyframes gbOpen { to { --gbo: 51%; } }
        @keyframes gbOut { to { opacity: 0; } }
        .gg-chin { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; height: 58px; padding: 0 6px 0 34px; }
        .gg-scr { z-index: 2; }
        .gg-wear { position: absolute; inset: 0; z-index: 1; pointer-events: none; background: var(--gg-wear) 0 0 / 100% 100% no-repeat; }
        .gg-bump b { --wear: radial-gradient(circle at 3px 3px, rgba(170,165,180,0.4), transparent 9px), radial-gradient(ellipse 14px 3px at 40px 2px, rgba(170,165,180,0.22), transparent), radial-gradient(ellipse 3px 12px at 2px 46px, rgba(170,165,180,0.2), transparent); }

        #desktop > #win-games\\.exe .window-header { top: 3px; padding: 0 78px 0 22px !important; }
        .gg-mark { display: flex; align-items: baseline; gap: 6px; user-select: none; }
        .gg-mark b { font: italic 900 21px/1 'Arial Black', 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.5px; transform: skewX(-7deg) scaleY(0.8); transform-origin: left bottom; color: transparent;
            background: linear-gradient(180deg, #f4f2f8 0 46%, #8f8a9b 54% 100%); -webkit-background-clip: text; background-clip: text; filter: drop-shadow(0 1px 0 #000) drop-shadow(0 -1px 0 rgba(255,255,255,0.08)); }
        .gg-mark i { font: 11px/1 'DotGothic16', monospace; font-style: normal; letter-spacing: 1px; color: #000; background: var(--neon-secondary); padding: 2px 6px 3px; border-radius: 2px; transform: rotate(-5deg) translateY(-3px); box-shadow: 1px 1px 0 rgba(0,0,0,0.6); }
        .gg-homebtn { position: absolute; left: 50%; top: 50%; width: 54px; height: 34px; margin: -17px 0 0 -27px; border: 0; padding: 0; cursor: inherit; z-index: 2; border-radius: 9px;
            background: #070609; box-shadow: inset 0 3px 4px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.08); }
        .gg-homebtn::before { content: ''; position: absolute; inset: 4px 4px 5px; border-radius: 6px; background: radial-gradient(120% 90% at 50% 10%, #3a3640, #1d1b21 60%, #141217);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.13), inset 0 -2px 0 rgba(0,0,0,0.55), 0 2px 1px rgba(0,0,0,0.8); transition: transform 0.06s; }
        .gg-homebtn::after { content: ''; position: absolute; left: 50%; top: 50%; width: 14px; height: 12px; margin: -7px 0 0 -7px; background: rgba(220,215,228,0.5);
            -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='12' shape-rendering='crispEdges'%3E%3Cpath d='M7 0h0v1h1v1h1v1h1v1h1v1h1v1h-2v6h-3v-3h-2v3h-3v-6h-2v-1h1v-1h1v-1h1v-1h1v-1h1z' fill='%2523000'/%3E%3C/svg%3E") no-repeat, linear-gradient(100deg, #000 55%, rgba(0,0,0,0.35) 70%, #000 85%); -webkit-mask-composite: source-in; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='12' shape-rendering='crispEdges'%3E%3Cpath d='M7 0h0v1h1v1h1v1h1v1h1v1h1v1h-2v6h-3v-3h-2v3h-3v-6h-2v-1h1v-1h1v-1h1v-1h1v-1h1z' fill='%2523000'/%3E%3C/svg%3E") no-repeat intersect, linear-gradient(100deg, #000 55%, rgba(0,0,0,0.35) 70%, #000 85%); }
        .gg-homebtn:active::before { transform: translateY(1px); box-shadow: inset 0 1px 2px rgba(0,0,0,0.7), 0 1px 0 rgba(0,0,0,0.8); }
        .gg-homebtn:active::after { margin-top: -6px; }
        .gg-homebtn:hover::after { background: color-mix(in srgb, var(--neon-primary) 60%, #fff); }
        .gg-led { position: absolute; right: 120px; top: 50%; width: 5px; height: 5px; margin-top: -2px; border-radius: 50%; background: #3dff7a; box-shadow: 0 0 6px #3dff7a; animation: ggLed 4s ease-in-out infinite; }
        @keyframes ggLed { 50% { opacity: 0.35; box-shadow: none; } }
        .gg-spk { display: flex; gap: 4px; height: 22px; margin-right: 26px; position: relative; z-index: 2; }
        .gg-spk i { width: 5px; height: 100%; }
        #win-games\\.exe.is-max .gg-scr { height: calc(100vh - 190px); }
        html.reduce-motion .gg-scr *, html.reduce-motion .gg-chin * { animation: none !important; }
        @media (max-width: 767px) {
            #desktop > #win-games\\.exe { border-radius: 10px !important; }
            .gg-dev { padding: 20px 10px 0; }
            .gg-scr { height: calc(100vh - 220px); }
            .gg-chin { height: 48px; } .gg-mark b { font-size: 17px; } .gg-spk, .gg-led { display: none; }
            .gg-apps { grid-template-columns: repeat(auto-fill, 104px); } .gg-app .gg-ic { width: 72px; height: 72px; background-size: 72px 72px; }
            .gg-time { font-size: 34px; } .gg-home { padding: 14px; }
        }
    `;
    document.head.appendChild(st);

    const base = os.summon.bind(os);
    os.summon = function (id) {
        let existed = $('win-' + id);
        let r = base.apply(os, arguments);
        if (id === 'games.exe' && !existed) {
            let w = $('win-games.exe');
            if (w && !os.isPhone()) { let ww = Math.min(940, window.innerWidth - 20); w.style.maxWidth = ww + 'px'; w.style.left = Math.max(10, (window.innerWidth - ww) / 2) + 'px'; }
            if (w) { boot(w); requestAnimationFrame(() => wear(w)); }
        }
        return r;
    };
    // beat it up a bit. seeded so its the same scratches every time
    function wear(w) {
        let dev = w.querySelector('.gg-dev'), scr = w.querySelector('.gg-scr'); if (!dev || !scr) return;
        let W = dev.offsetWidth, H = dev.offsetHeight; if (!W || !H) return;
        let dr = dev.getBoundingClientRect(), sr = scr.getBoundingClientRect(), k = W / dr.width;
        let S = { x: (sr.left - dr.left) * k, y: (sr.top - dr.top) * k, w: sr.width * k, h: sr.height * k };
        let q = Math.min(2, window.devicePixelRatio || 1), c = document.createElement('canvas'); c.width = W * q; c.height = H * q;
        let x = c.getContext('2d'), seed = 4444; x.scale(q, q);
        const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        const scuff = (cx, cy, n, spread) => {
            let base = rnd() * Math.PI;
            for (let i = 0; i < n; i++) {
                let a = base + (rnd() - 0.5) * 0.35, L = 4 + rnd() * rnd() * 46, px = cx + (rnd() - 0.5) * spread, py = cy + (rnd() - 0.5) * spread * 0.45;
                let ex = px + Math.cos(a) * L, ey = py + Math.sin(a) * L, g = x.createLinearGradient(px, py, ex, ey), al = 0.03 + rnd() * 0.11;
                g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.2 + rnd() * 0.3, 'rgba(255,255,255,' + al + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
                x.strokeStyle = g; x.lineWidth = 0.3 + rnd() * 0.5; x.beginPath(); x.moveTo(px, py); x.lineTo(ex, ey); x.stroke();
            }
            let r = x.createRadialGradient(cx, cy, 0, cx, cy, spread * 0.7); r.addColorStop(0, 'rgba(255,255,255,0.035)'); r.addColorStop(1, 'rgba(255,255,255,0)');
            x.fillStyle = r; x.fillRect(cx - spread, cy - spread, spread * 2, spread * 2);
        };
        [[0.06, 0.97], [0.3, 0.99], [0.52, 0.96], [0.8, 0.98], [0.97, 0.9], [0.99, 0.45], [0.98, 0.12], [0.01, 0.6], [0.02, 0.25], [0.35, 0.01], [0.72, 0.02]]
            .forEach(([fx, fy]) => scuff(fx * W, fy * H, 8 + Math.floor(rnd() * 16), 30 + rnd() * 40));
        x.fillStyle = 'rgba(200,195,210,1)';
        const edge = (len, at) => { let ph = rnd() * 9, ph2 = rnd() * 9; for (let t = 0; t < len; t += 1.5) { let v = Math.sin(t / 23 + ph) + Math.sin(t / 7.3 + ph2) * 0.6 + (rnd() - 0.5) * 0.8; if (v > 0.9) { x.globalAlpha = Math.min(0.18, (v - 0.9) * 0.18); let p = at(t); x.fillRect(p[0], p[1], 1.5, 1.5); } } x.globalAlpha = 1; };
        edge(W, t => [t, 1 + rnd() * 1.5]); edge(W, t => [t, H - 3 - rnd() * 1.5]); edge(H, t => [1 + rnd() * 1.5, t]); edge(H, t => [W - 3 - rnd() * 1.5, t]);
        function crack(px, py, a, n, wd, depth) {
            let pts = [[px, py]];
            for (let i = 0; i < n; i++) {
                a += (rnd() - 0.5) * 0.45; if (rnd() < 0.06) a += (rnd() - 0.5) * 1.1;
                px += Math.cos(a) * 1.4; py += Math.sin(a) * 1.4; pts.push([px, py]);
                if (depth < 2 && i > 6 && rnd() < 0.035) crack(px, py, a + (rnd() < 0.5 ? 1 : -1) * (0.5 + rnd() * 0.8), 6 + rnd() * n * 0.4, wd * 0.6, depth + 1);
            }
            const line = (st, lw, ox, oy) => { for (let i = 1; i < pts.length; i++) { let f = 1 - i / pts.length; x.strokeStyle = st; x.lineWidth = Math.max(0.25, lw * (0.35 + f * 0.65)); x.beginPath(); x.moveTo(pts[i - 1][0] + ox, pts[i - 1][1] + oy); x.lineTo(pts[i][0] + ox, pts[i][1] + oy); x.stroke(); } };
            line('rgba(0,0,0,0.85)', wd, 0, 0);
            line('rgba(255,255,255,0.09)', wd * 0.45, 0.7, 0.8);
        }
        x.lineCap = 'round';
        const hit = (px, py, a, n) => {
            x.fillStyle = 'rgba(120,115,130,0.5)'; x.beginPath(); for (let i = 0; i < 7; i++) { let t = i / 7 * Math.PI * 2, r = 1.5 + rnd() * 2.5; x.lineTo(px + Math.cos(t) * r, py + Math.sin(t) * r); } x.fill();
            crack(px, py, a, n, 0.7, 0);
        };
        hit(W * 0.24, 0.5, Math.PI * 0.5 + 0.9, 70, 0.7);
        hit(W - 0.5, S.y + S.h * 0.32, Math.PI + 0.35, 110);
        hit(W * 0.83, H - 0.5, -Math.PI * 0.5 - 0.7, 80);
        x.clearRect(S.x - 1, S.y - 1, S.w + 2, S.h + 2);
        dev.querySelectorAll('.gg-vent, .gg-grill, .gg-spk, .gg-homebtn, .gg-mark').forEach(e => { let b = e.getBoundingClientRect(); x.clearRect((b.left - dr.left) * k - 3, (b.top - dr.top) * k - 3, b.width * k + 6, b.height * k + 6); });
        dev.style.setProperty('--gg-wear', 'url(' + c.toDataURL() + ')');
        w.querySelectorAll('.gg-bump b').forEach((b, n) => {
            let bc = document.createElement('canvas'), z = 70, y = bc.getContext('2d'); bc.width = bc.height = z * q; y.scale(q, q); seed = 77 + n * 911;
            for (let i = 0; i < 520; i++) {
                let r = Math.pow(rnd(), 1.8) * 30, t = rnd() * Math.PI / 2, px = Math.cos(t) * r * (0.6 + rnd()), py = Math.sin(t) * r * (0.6 + rnd());
                y.fillStyle = 'rgba(185,180,192,' + (0.04 + rnd() * 0.16) * (1 - r / 34) + ')'; y.fillRect(px, py, 0.6 + rnd() * 1.4, 0.6 + rnd() * 1.4);
            }
            for (let i = 0; i < 14; i++) {
                let along = rnd() < 0.5, p0 = 4 + rnd() * 60, off = 1 + rnd() * 12, L = 3 + rnd() * 12, a = (along ? 0 : Math.PI / 2) + (rnd() - 0.5) * 0.5;
                let px = along ? p0 : off, py = along ? off : p0, g = y.createLinearGradient(px, py, px + Math.cos(a) * L, py + Math.sin(a) * L);
                g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.4, 'rgba(255,255,255,' + (0.05 + rnd() * 0.1) + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
                y.strokeStyle = g; y.lineWidth = 0.4 + rnd() * 0.4; y.beginPath(); y.moveTo(px, py); y.lineTo(px + Math.cos(a) * L, py + Math.sin(a) * L); y.stroke();
            }
            for (let i = 0; i < 3; i++) { let along = rnd() < 0.5, p0 = 14 + rnd() * 50, nx = along ? p0 : 0, ny = along ? 0 : p0; y.fillStyle = 'rgba(0,0,0,0.75)'; y.beginPath(); y.moveTo(nx, ny); y.lineTo(nx + (along ? 2 + rnd() * 3 : 1.5 + rnd() * 1.5), ny + (along ? 1.5 + rnd() * 1.5 : 2 + rnd() * 3)); y.lineTo(nx + (along ? 4 + rnd() * 3 : 0), ny + (along ? 0 : 4 + rnd() * 3)); y.fill(); }
            b.style.setProperty('--wear', 'url(' + bc.toDataURL() + ') 0 0 / 100% 100% no-repeat');
        });
    }

    // for poking at it in the console
    os.gg = os.gg || {}; os.gg.hooks = os.gg.hooks || {};
    os.gg.open = open; os.gg.home = goHome; os.gg.now = () => cur; os.gg.sys = openSys; os.gg.skip = endBoot;
})();
