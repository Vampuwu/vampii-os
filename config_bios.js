
// settings as an old BIOS screen. arrows + enter, the mouse works too
window.os = window.os || {};

(function () {
    const $ = id => document.getElementById(id);
    const calm = () => document.documentElement.classList.contains('reduce-motion');
    const click = () => typeof os.clickAudio === 'function' && os.clickAudio();
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const TABS = [['main', 'biosTabMain', 'Main'], ['display', 'biosTabDisplay', 'Display'], ['fx', 'biosTabFx', 'Effects'], ['ui', 'biosTabUi', 'Interface'], ['exit', 'biosTabExit', 'Exit']];
    const SLOTS = { fx: ['lite', 'glow', 'scan', 'glass', 'shaderbg', 'filmfx', 'burnin', 'burnclear'], ui: ['sound', 'saver', 'notices'] };
    let tab = 'main', liveT = 0, postT = [], armed = false;

    function browser() {
        let u = navigator.userAgent, m = /(Edg|OPR|Firefox|Chrome|Safari)\/(\d+)/.exec(u);
        if (!m) return 'something';
        let n = { Edg: 'Edge', OPR: 'Opera' }[m[1]] || m[1];
        if (n === 'Safari' && /Chrome/.test(u)) n = 'Chrome';
        return n + ' ' + m[2];
    }
    function saved() {
        let n = 0;
        try { for (let i = 0; i < localStorage.length; i++) { let k = localStorage.key(i); if (/^vmp_|^vampii/.test(k)) n += k.length + (localStorage.getItem(k) || '').length; } } catch (e) {}
        return n > 1024 ? (n / 1024).toFixed(1) + ' KB' : n + ' B';
    }
    const two = n => String(n).padStart(2, '0');
    function themeName() { let t = 'pink'; try { t = localStorage.getItem('vmp_theme') || 'pink'; } catch (e) {} return t.toUpperCase(); }
    function wallName() { let k = (os.prefs && os.prefs.wall) || 'city', K = os.deskFx && os.deskFx.kinds && os.deskFx.kinds[k]; return K ? K.en : k; }

    function fps() { let f = os.frameMs ? os.frameMs() : 0; return f ? Math.round(1000 / f) + ' fps' : '…'; }
    function wallRes() { let s = os.deskFx && os.deskFx.stats ? os.deskFx.stats() : null; if (!s) return 'off'; return s.w + ' × ' + s.h + ' (' + Math.round(s.q * 100) + '%) · ' + s.fps + 'fps' + (s.gpu != null ? ' · gpu ' + s.gpu.toFixed(1) + 'ms' : '') + (s.lite ? ' · low spec' : ''); }
    function mainRows() {
        let d = new Date(), up = Math.floor(performance.now() / 1000);
        return [
            ['biosTime', 'System Time', two(d.getHours()) + ':' + two(d.getMinutes()) + ':' + two(d.getSeconds())],
            ['biosDate', 'System Date', d.getFullYear() + '.' + two(d.getMonth() + 1) + '.' + two(d.getDate())],
            ['biosVer', 'BIOS Version', 'VAMPII v4.444'],
            ['biosBrowser', 'Browser', browser()],
            ['biosScreen', 'Screen', screen.width + ' × ' + screen.height + (devicePixelRatio > 1 ? ' @' + devicePixelRatio + 'x' : '')],
            ['biosCores', 'Processor', (navigator.hardwareConcurrency || '?') + ' threads'],
            ['biosMem', 'Memory', navigator.deviceMemory ? navigator.deviceMemory + ' GB (ish)' : 'wont say'],
            ['biosStore', 'Saved Stuff', saved()],
            ['biosTheme', 'Theme', themeName()],
            ['biosWall', 'Wallpaper', wallName()],
            ['biosFps', 'Frame Rate', fps()],
            ['biosWallRes', 'Wallpaper Res', wallRes()],
            ['biosUp', 'Uptime', two(Math.floor(up / 3600)) + ':' + two(Math.floor(up / 60) % 60) + ':' + two(up % 60)]
        ];
    }
    function paintMain() {
        let p = document.querySelector('#win-settings .bios-pane[data-tab="main"]'); if (!p) return;
        let rows = mainRows();
        if (!p.children.length) { p.innerHTML = rows.map(r => `<div class="bios-row ro" tabindex="0" data-help="biosHelpInfo"><span>${esc(T(r[0], r[1]))}</span><b data-k="${r[0]}"></b></div>`).join(''); saveMenu(p); }
        rows.forEach(r => { let b = p.querySelector('[data-k="' + r[0] + '"]'); if (b && b.textContent !== r[2]) b.textContent = r[2]; });
    }

    // back your stuff up to a file. kinda hidden, I'll tell people if they need it
    const SKIP = /^vmp_thumbs$/; // the wallpaper preview cache, its big + its per machine
    const SAVE_KEY = k => /^vmp_[a-z0-9_]{1,40}$/i.test(k) && !SKIP.test(k);
    function dump() {
        let data = {};
        try { for (let i = 0; i < localStorage.length; i++) { let k = localStorage.key(i); if (SAVE_KEY(k)) data[k] = localStorage.getItem(k); } } catch (e) {}
        return data;
    }
    function clean(o) {
        if (!o || o.app !== 'vampii.os' || typeof o.data !== 'object' || Array.isArray(o.data)) return null;
        let ks = Object.keys(o.data); if (!ks.length || ks.length > 200) return null;
        const bad = s => /[<>"`]/.test(s);
        const walk = (v, depth) => {
            if (depth > 12) return false;
            if (typeof v === 'string') return !bad(v);
            if (v === null || typeof v === 'number' || typeof v === 'boolean') return true;
            if (Array.isArray(v)) return v.length < 50000 && v.every(x => walk(x, depth + 1));
            if (typeof v === 'object') return Object.keys(v).every(k => !bad(k) && walk(v[k], depth + 1));
            return false;
        };
        for (let k of ks) {
            let v = o.data[k];
            if (!SAVE_KEY(k) || typeof v !== 'string' || v.length > 4e6) return null;
            if (k === 'vmp_notes') { try { let n = JSON.parse(v); if (!n || typeof n !== 'object') return null; } catch (e) { return null; } continue; }
            let j; try { j = JSON.parse(v); } catch (e) { j = v; }
            if (!walk(j, 0)) return null;
        }
        return o.data;
    }
    function saveMenu(p) {
        let row = p.querySelector('[data-k="biosStore"]'); row = row && row.closest('.bios-row'); if (!row) return;
        row.classList.add('has-sub'); row.dataset.help = 'biosHelpStore';
        let sub = document.createElement('div');
        sub.className = 'bios-sub';
        sub.innerHTML = `<div><button type="button" class="settings-btn bios-act" data-sv="out" data-help="biosHelpExport"></button><button type="button" class="settings-btn bios-act" data-sv="in" data-help="biosHelpImport"></button><input type="file" accept=".json,application/json" hidden></div>`;
        row.after(sub);
        let [bOut, bIn] = sub.querySelectorAll('button'), file = sub.querySelector('input'), ready = null, tm = 0;
        const label = () => { bOut.textContent = '► ' + T('biosSaveOut', 'Export Save 書き出し'); bIn.textContent = '► ' + T('biosSaveIn', 'Import Save 読み込み'); ready = null; };
        const say = (b, t, ms) => { clearTimeout(tm); b.textContent = t; tm = setTimeout(label, ms || 3500); };
        label();
        const isOpen = () => sub.classList.contains('open');
        const set = on => { if (on === isOpen()) return; click(); sub.classList.toggle('open', on); row.classList.toggle('open', on); if (!on) label(); };
        row.addEventListener('click', () => { set(!isOpen()); if (isOpen()) bOut.focus({ preventScroll: true }); });
        row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); set(!isOpen()); if (isOpen()) bOut.focus({ preventScroll: true }); } });
        sub.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); set(false); row.focus({ preventScroll: true }); } });
        const away = e => { let to = e.relatedTarget; if (to && to !== row && !sub.contains(to)) set(false); };
        row.addEventListener('focusout', away); sub.addEventListener('focusout', away);
        p.closest('.bios').querySelectorAll('.bios-tabs button').forEach(t => t.addEventListener('click', () => set(false)));
        os.biosSubShut = () => set(false);
        bOut.onclick = () => {
            click();
            let d = new Date(), day = d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate()), name = 'vampii_save_' + day + '.json';
            let blob = new Blob([JSON.stringify({ app: 'vampii.os', v: 1, at: d.toISOString(), data: dump() })], { type: 'application/json' });
            let a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(a.href), 4000);
            say(bOut, T('biosSaveDone', 'saved ✓ {f}').replace('{f}', name));
        };
        bIn.onclick = () => {
            click();
            if (ready) {
                try { Object.keys(dump()).forEach(k => localStorage.removeItem(k)); Object.keys(ready).forEach(k => localStorage.setItem(k, ready[k])); } catch (e) { say(bIn, T('biosSaveFull', 'ur browser said no (its full?)')); return; }
                location.reload(); return;
            }
            file.value = ''; file.click();
        };
        file.onchange = () => {
            let f = file.files && file.files[0]; if (!f) return;
            if (f.size > 5e6) { say(bIn, T('biosSaveBad', 'thats not a vampii save (´・ω・`)'), 4000); return; }
            let rd = new FileReader();
            rd.onload = () => {
                let o = null; try { o = JSON.parse(rd.result); } catch (e) {}
                let data = clean(o);
                if (!data) { say(bIn, T('biosSaveBad', 'thats not a vampii save (´・ω・`)'), 4000); return; }
                let when = String(o.at || '').slice(0, 10).replace(/-/g, '.') || '?';
                say(bIn, T('biosSaveSure', 'load {n} things from {d}? press again').replace('{n}', Object.keys(data).length).replace('{d}', when), 8000);
                ready = data;
                bIn.focus({ preventScroll: true });
            };
            rd.readAsText(f);
        };
    }

    function help(key) {
        let h = document.querySelector('#win-settings .bios-help p'); if (!h) return;
        let t = T(key, '').replace(' // ', '\n\n');
        if (h.dataset.k === key) return;
        h.dataset.k = key;
        if (calm()) { h.textContent = t; return; }
        // types itself out quick, it looked dead just swapping
        let i = 0; clearInterval(h._t);
        h._t = setInterval(() => { i += 3; h.textContent = t.slice(0, i); if (i >= t.length) clearInterval(h._t); }, 16);
    }

    function show(k, focus) {
        tab = k;
        let w = $('win-settings'); if (!w) return;
        w.querySelectorAll('.bios-tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === k));
        w.querySelectorAll('.bios-pane').forEach(p => { let on = p.dataset.tab === k; p.hidden = !on; if (on && !calm()) { p.classList.remove('in'); void p.offsetWidth; p.classList.add('in'); } });
        if (k === 'main') paintMain();
        let first = items()[0];
        if (focus && first) first.focus({ preventScroll: true });
        help(first ? first.dataset.help || 'biosHelpInfo' : 'biosHelpInfo');
    }
    function items() {
        let p = document.querySelector('#win-settings .bios-pane:not([hidden])');
        return p ? [...p.querySelectorAll('.bios-row, button, input[type="color"]')].filter(e => e.offsetParent && !e.closest('.bios-row.ro button') && !e.closest('.bios-sub:not(.open)')) : [];
    }

    // the toggles get rebuilt every change so I keep moving them into their tab. ugh
    function sortPrefs() {
        let src = $('ui-prefs'); if (!src) return;
        let had = document.activeElement && document.activeElement.closest && document.activeElement.closest('.bios-slot'), back = had && had.dataset.pref;
        [...src.children].forEach(btn => {
            let k = btn.dataset.pref, slot = document.querySelector('#win-settings .bios-slot[data-pref="' + k + '"]');
            if (!slot) return;
            btn.dataset.help = 'biosHelp_' + k;
            slot.replaceChildren(btn);
            if (k === back) btn.focus({ preventScroll: true });
        });
    }

    function build(w) {
        let body = w.querySelector('.window-body');
        if (!body || body.querySelector('.bios')) return;
        let themeBox = body.querySelector('.theme-picker-box'), custom = body.querySelector('.custom-row'), wall = $('wall-picker'), rain = $('rain-btn'), motion = $('motion-btn'), prefs = $('ui-prefs');
        let b = document.createElement('div');
        b.className = 'bios';
        b.innerHTML = `
            <div class="bios-tabs" role="tablist">${TABS.map(t => `<button type="button" role="tab" data-tab="${t[0]}">${esc(T(t[1], t[2]))}</button>`).join('')}</div>
            <div class="bios-mid">
                <div class="bios-panes">
                    <div class="bios-pane" data-tab="main"></div>
                    <div class="bios-pane" data-tab="display">
                        <p class="bios-h">${esc(T('biosAccent', 'Accent Colour'))}</p><div class="bios-theme"></div>
                        <p class="bios-h">${esc(T('biosWallH', 'Wallpaper'))}</p><div class="bios-wall"></div>
                    </div>
                    <div class="bios-pane" data-tab="fx">
                        <div class="bios-slot" data-own="rain"></div><div class="bios-slot" data-own="motion"></div>
                        ${SLOTS.fx.map(k => `<div class="bios-slot" data-pref="${k}"></div>`).join('')}
                    </div>
                    <div class="bios-pane" data-tab="ui">${SLOTS.ui.map(k => `<div class="bios-slot" data-pref="${k}"></div>`).join('')}</div>
                    <div class="bios-pane" data-tab="exit">
                        <button type="button" class="settings-btn bios-act" data-act="exit" data-help="biosHelpExit">${esc(T('biosExit', 'Exit Setup'))}</button>
                        <button type="button" class="settings-btn bios-act" data-act="post" data-help="biosHelpPost">${esc(T('biosPostAgain', 'Run POST Again'))}</button>
                        <button type="button" class="settings-btn bios-act" data-act="defaults" data-help="biosHelpDefaults">${esc(T('biosDefaults', 'Load Setup Defaults'))}</button>
                    </div>
                </div>
                <aside class="bios-help"><h5>${esc(T('biosHelpH', 'Item Specific Help')).replace(' // ', '<br>')}</h5><p></p><i class="bios-cur"></i></aside>
            </div>
            <div class="bios-keys"></div>
            <div class="bios-post" hidden></div>`;
        body.prepend(b);
        if (themeBox) { b.querySelector('.bios-theme').appendChild(themeBox); themeBox.querySelectorAll('button').forEach(x => x.dataset.help = 'biosHelpTheme'); }
        if (custom) { b.querySelector('.bios-theme').appendChild(custom); custom.querySelectorAll('input').forEach(x => x.dataset.help = 'biosHelpCustom'); }
        if (wall) { b.querySelector('.bios-wall').appendChild(wall); new MutationObserver(() => wall.querySelectorAll('button').forEach(x => x.dataset.help = 'biosHelpWall')).observe(wall, { childList: true }); wall.querySelectorAll('button').forEach(x => x.dataset.help = 'biosHelpWall'); }
        if (rain) { rain.dataset.help = 'biosHelpRain'; b.querySelector('[data-own="rain"]').appendChild(rain); }
        if (motion) { motion.dataset.help = 'biosHelpMotion'; b.querySelector('[data-own="motion"]').appendChild(motion); }
        if (prefs) { prefs.hidden = true; b.appendChild(prefs); new MutationObserver(sortPrefs).observe(prefs, { childList: true }); sortPrefs(); }
        [...body.children].forEach(c => { if (c !== b) c.hidden = true; });
        let keys = b.querySelector('.bios-keys');
        T('biosKeys', '←→ : tab   ↑↓ : item   ENTER : change   ESC : exit').split(/ {3,}/).forEach(t => { let s = document.createElement('span'), p = t.split(' : '); s.innerHTML = '<b></b> '; s.querySelector('b').textContent = p[0]; s.append(p.slice(1).join(' : ')); keys.appendChild(s); });
        b.querySelectorAll('.bios-tabs button').forEach(t => t.onclick = () => { click(); show(t.dataset.tab, false); });
        b.addEventListener('focusin', e => { let h = e.target.closest('[data-help]'); if (h) help(h.dataset.help); });
        b.addEventListener('mouseover', e => { let h = e.target.closest('[data-help]'); if (h) help(h.dataset.help); });
        b.querySelector('.bios-pane[data-tab="exit"]').addEventListener('click', e => {
            let a = e.target.closest('[data-act]'); if (!a) return;
            click();
            if (a.dataset.act === 'exit') { let x = w.querySelector('.kill-btn'); if (x) x.click(); }
            if (a.dataset.act === 'post') post(w);
            if (a.dataset.act === 'defaults') {
                if (!armed) { armed = true; a.textContent = T('biosSure', 'Load Setup Defaults? press again'); setTimeout(() => { armed = false; a.textContent = T('biosDefaults', 'Load Setup Defaults'); }, 3000); return; }
                try { ['vmp_prefs', 'vmp_theme', 'vmp_rain', 'vmp_reduce_motion'].forEach(k => localStorage.removeItem(k)); } catch (er) {}
                location.reload();
            }
        });
        let t = $('win-title-settings'); if (t) t.textContent = T('biosTitle', 'VAMPII.OS Setup Utility');
        show('main', false);
    }

    // the numbers are real, the drives are a joke
    function post(w) {
        let p = w.querySelector('.bios-post'); if (!p) return;
        postT.forEach(clearTimeout); postT = [];
        if (calm()) { p.hidden = true; return; }
        let mem = (navigator.deviceMemory || 4) * 1048576, cores = navigator.hardwareConcurrency || 4;
        p.hidden = false; p.classList.remove('out');
        p.innerHTML = `<div class="bp-logo"><i class="bp-ic"></i><div><b>${esc(T('biosPostName', 'VAMPII BIOS v4.444'))}</b><small>${esc(T('biosPostCopy', '(C) 2026 Milivia. all rights reserved, probably'))}</small></div></div><pre class="bp-lines"></pre><p class="bp-del"></p>`;
        let ic = p.querySelector('.bp-ic'), src = os.pixIcon && os.pixIcon('⚙', 2);
        if (src && !src.pic) ic.style.backgroundImage = 'url("' + src + '")';
        let lines = p.querySelector('.bp-lines'), add = (s, at) => postT.push(setTimeout(() => { lines.textContent += s; if (os.sfx) os.sfx('line'); }, at));
        add(T('biosPostCpu', 'Main Processor : {n} threads').replace('{n}', cores) + '\n', 180);
        add(T('biosPostMem', 'Memory Testing : ') , 380);
        let t0 = 380, n = 18;
        for (let i = 1; i <= n; i++) postT.push(setTimeout(() => {
            let txt = lines.textContent.replace(/\d+K( OK)?$/, '');
            lines.textContent = txt + Math.round(mem * i / n) + 'K' + (i === n ? ' OK' : '');
        }, t0 + i * 38));
        add('\n\n' + T('biosPostDrv', 'Detecting drives ...') + '\n', t0 + n * 38 + 120);
        add('  ' + T('biosPostDrv1', 'Primary   : vampii.os') + '\n', t0 + n * 38 + 300);
        add('  ' + T('biosPostDrv2', 'Secondary : my music (half finished)') + '\n', t0 + n * 38 + 440);
        let end = t0 + n * 38 + 700;
        postT.push(setTimeout(() => { p.querySelector('.bp-del').textContent = T('biosPostDel', 'Press DEL to enter SETUP'); beep(); }, end));
        postT.push(setTimeout(() => leave(p), end + 900));
    }
    function leave(p) {
        if (!p || p.hidden) return;
        postT.forEach(clearTimeout); postT = [];
        p.classList.add('out');
        setTimeout(() => { p.hidden = true; p.classList.remove('out'); let f = items()[0]; if (f) f.focus({ preventScroll: true }); }, 260);
    }
    function beep() { if (typeof os.sfx === 'function') os.sfx('beep'); }

    document.addEventListener('keydown', e => {
        let w = $('win-settings');
        if (!w || !w.classList.contains('is-active') || w.classList.contains('is-min')) return;
        let p = w.querySelector('.bios-post');
        if (p && !p.hidden) { e.preventDefault(); leave(p); return; }
        if (e.target.closest && e.target.closest('input:not([type="color"]), textarea')) return;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            let i = TABS.findIndex(t => t[0] === tab), n = (i + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length;
            if (os.biosSubShut) os.biosSubShut();
            click(); show(TABS[n][0], true);
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            let all = items(); if (!all.length) return;
            e.preventDefault();
            let i = all.indexOf(document.activeElement), n = i < 0 ? 0 : (i + (e.key === 'ArrowDown' ? 1 : -1) + all.length) % all.length;
            all[n].focus(); all[n].scrollIntoView({ block: 'nearest' });
        }
    }, true);

    const base = os.summon.bind(os);
    os.summon = function (id) {
        let existed = $('win-' + id);
        let r = base.apply(os, arguments);
        if (id === 'settings') {
            let w = $('win-settings');
            if (w) {
                if (!existed) {
                    if (!os.isPhone()) { let ww = Math.min(780, innerWidth - 20); w.style.maxWidth = ww + 'px'; }
                    build(w);
                    w.querySelector('.bios').addEventListener('pointerdown', () => leave(w.querySelector('.bios-post')));
                    clearInterval(liveT); liveT = setInterval(() => { if (!$('win-settings')) { clearInterval(liveT); return; } if (tab === 'main') paintMain(); }, 1000);
                }
                if (!existed) post(w);
            }
        }
        return r;
    };
})();
