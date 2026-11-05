// timer.exe. the lil handheld
// keeps going if you close it, reset stops it
window.os = window.os || {};

(function () {
    const T = (k, d) => (typeof window.T === 'function' ? window.T(k, d) : d);
    const $ = id => document.getElementById(id);
    const KEY = 'vmp_timer', LOG = 'vmp_timer_log';
    const p2 = n => String(n).padStart(2, '0');
    const today = () => { let d = new Date(); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
    const MODES = ['timer', 'watch', 'focus'];

    let st = { mode: 'timer', dur: 25 * 60000, end: 0, left: 25 * 60000, since: 0, acc: 0, laps: [], work: 25, rest: 5, phase: 'work', round: 1, fend: 0, fleft: 25 * 60000 };
    try { let s = JSON.parse(localStorage.getItem(KEY)); if (s && s.dur) st = Object.assign(st, s); } catch (e) {}
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
    const tLeft = () => st.end > 0 ? Math.max(0, st.end - Date.now()) : st.left;
    const fLeft = () => st.fend > 0 ? Math.max(0, st.fend - Date.now()) : st.fleft;
    const wNow = () => st.acc + (st.since ? Date.now() - st.since : 0);
    const going = () => st.mode === 'timer' ? st.end > 0 : st.mode === 'watch' ? st.since > 0 : st.fend > 0;
    let beep = true; try { beep = localStorage.getItem('vmp_timer_bell') !== '0'; } catch (e) {}

    function logIt(mins) { try { let l = JSON.parse(localStorage.getItem(LOG) || '{}'); if (l.day !== today()) l = { day: today(), n: 0, mins: 0 }; l.n++; l.mins += mins; localStorage.setItem(LOG, JSON.stringify(l)); } catch (e) {} }

    let tT = 0, fT = 0, rings = 0, rT = 0, flashUntil = 0;
    function arm() {
        clearTimeout(tT); clearTimeout(fT);
        if (st.end > 0) tT = setTimeout(timerDone, Math.max(0, st.end - Date.now()) + 30);
        if (st.fend > 0) fT = setTimeout(focusDone, Math.max(0, st.fend - Date.now()) + 30);
    }
    function alarm(msg) {
        rings = 4; (function ring() { if (rings-- <= 0) return; if (beep && os.sfx) os.sfx('pipi', { force: true }); rT = setTimeout(ring, 1100); })();
        flashUntil = Date.now() + 4400;
        if (typeof os.notify === 'function') os.notify(msg, () => os.summon('timer.exe'), 9000);
        let w = $('win-timer.exe'); if (w) { w.classList.remove('tm-shake'); void w.offsetWidth; w.classList.add('tm-shake'); }
        draw();
    }
    function hush() { rings = 0; clearTimeout(rT); flashUntil = 0; }
    function timerDone() {
        if (!(st.end > 0) || st.end - Date.now() > 200) { arm(); return; }
        st.end = 0; st.left = 0; save(); logIt(Math.round(st.dur / 60000));
        alarm(T('timerDone', 'タイマー終わったよ // times up') + ' (' + Math.round(st.dur / 60000) + 'm)');
    }
    function focusDone() {
        if (!(st.fend > 0) || st.fend - Date.now() > 200) { arm(); return; }
        // work ends = break starts on its own. break ends = it waits for you
        if (st.phase === 'work') { logIt(st.work); st.phase = 'rest'; st.fleft = st.rest * 60000; st.fend = Date.now() + st.fleft; alarm(T('timerRest', '休憩しよ // break time') + ' (' + st.rest + 'm)'); }
        else { st.phase = 'work'; st.round++; st.fend = 0; st.fleft = st.work * 60000; alarm(T('timerBack', 'もどろっか // back to it') + ' · R' + st.round); }
        save(); arm();
    }

    function press(b) {
        hush();
        let m = st.mode;
        if (b === 'mode') { st.mode = MODES[(MODES.indexOf(m) + 1) % MODES.length]; stat = Date.now() + 260; if (os.sfx) os.sfx('seek'); }
        else if (b === 'go') {
            if (m === 'timer') { if (st.end > 0) { st.left = tLeft(); st.end = 0; } else { if (st.left <= 0) st.left = st.dur; st.end = Date.now() + st.left; } }
            else if (m === 'watch') { if (st.since) { st.acc = wNow(); st.since = 0; } else st.since = Date.now(); }
            else { if (st.fend > 0) { st.fleft = fLeft(); st.fend = 0; } else { if (st.fleft <= 0) st.fleft = (st.phase === 'work' ? st.work : st.rest) * 60000; st.fend = Date.now() + st.fleft; } }
            if (os.sfx) os.sfx.tone(2200, 0.03, { vol: 0.02 });
        }
        else if (b === 'lap') {
            if (m === 'timer') { st.end = 0; st.left = st.dur; }
            else if (m === 'watch') { if (st.since) { st.laps.unshift(wNow()); st.laps = st.laps.slice(0, 20); } else { st.acc = 0; st.laps = []; } }
            else { st.fend = 0; st.phase = 'work'; st.round = 1; st.fleft = st.work * 60000; }
            if (os.sfx) os.sfx.tone(1700, 0.03, { vol: 0.018 });
        }
        else if (b === 'up' || b === 'dn') {
            let d = b === 'up' ? 1 : -1;
            if (m === 'timer') { let ms = Math.max(60000, Math.min(99 * 60000, (st.end > 0 ? tLeft() : st.left) + d * 60000)); st.dur = Math.max(60000, Math.round(ms / 60000) * 60000); if (st.end > 0) st.end = Date.now() + ms; else st.left = ms; }
            else if (m === 'focus' && !(st.fend > 0)) { if (st.phase === 'work') st.work = Math.max(5, Math.min(90, st.work + d * 5)); else st.rest = Math.max(1, Math.min(30, st.rest + d)); st.fleft = (st.phase === 'work' ? st.work : st.rest) * 60000; }
            if (os.sfx) os.sfx.tone(1900, 0.012, { vol: 0.012 });
        }
        save(); arm(); draw(); loop();
    }

    const fmtD = ms => { let s = Math.ceil(ms / 1000), m = Math.min(99, Math.floor(s / 60)); return p2(m) + ':' + p2(s % 60); };
    const fmtW = ms => { let s = Math.floor(ms / 1000), m = Math.min(99, Math.floor(s / 60)); return p2(m) + ':' + p2(s % 60) + '.' + p2(Math.floor(ms / 10) % 100); };
    // old tv osd numbers, 5x7
    const FONT = {
        0: '01110100011001110101110011000101110', 1: '00100011000010000100001000010001110', 2: '01110100010000100010001000100011111',
        3: '11111000100010000010000011000101110', 4: '00010001100101010010111110001000010', 5: '11111100001111000001000011000101110',
        6: '00110010001000011110100011000101110', 7: '11111000010001000100010000100001000', 8: '01110100011000101110100011000101110',
        9: '01110100011000101111000010001001100', ':': '00000000000010000000001000000000000', '.': '00000000000000000000000000000000100'
    };
    const SW = 192, SH = 136;
    const CH = { timer: ['CH1', 'TIMER', 'タイマー'], watch: ['CH2', 'STOPWATCH', 'ストップウォッチ'], focus: ['CH3', 'FOCUS', '集中'] };
    let stat = 0, scr = null;
    const nc = document.createElement('canvas').getContext('2d');
    function colour() { nc.fillStyle = '#ff0099'; nc.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--neon-primary').trim() || '#ff0099'; let v = nc.fillStyle; if (v[0] === '#') { let n = parseInt(v.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; } return (v.match(/[\d.]+/g) || [255, 0, 153]).slice(0, 3).map(Number); }
    const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
    const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
    function bigW(s, sc) { let w = 0; for (let ch of s) w += (':;.'.includes(ch) ? 2 : 6) * sc; return w - sc; }
    function big(x, s, X, Y, sc) {
        for (let ch of s) {
            let g = FONT[ch], cols = ':;.'.includes(ch) ? 1 : 5, off = ':;.'.includes(ch) ? 2 : 0;
            if (g) for (let r = 0; r < 7; r++) for (let k = 0; k < cols; k++) if (g[r * 5 + k + off] === '1') x.fillRect(X + k * sc, Y + r * sc, sc - 1, sc - 1);
            X += (cols + 1) * sc;
        }
    }
    function txt(x, s, X, Y, al) { x.textAlign = al || 'left'; x.fillText(s, X, Y); }

    function draw() {
        let root = $('tm-root'); if (!root || !scr) return;
        let m = st.mode, now = Date.now(), run = going(), c = colour(), fg = mix(c, [255, 255, 255], 0.45), x = scr.x;
        let time, sub = '', info = '', f = 0;
        if (m === 'timer') { time = fmtD(tLeft()); f = tLeft() / st.dur; let l = {}; try { l = JSON.parse(localStorage.getItem(LOG) || '{}'); } catch (e) {} info = T('timerToday', '今日 // today') + ' ' + (l.day === today() ? l.n : 0) + '×'; }
        else if (m === 'watch') { let w = fmtW(wNow()); time = w.slice(0, 5); sub = w.slice(5); f = (wNow() % 60000) / 60000; info = st.laps.length ? st.laps.slice(0, 2).map((t, i) => 'L' + (st.laps.length - i) + ' ' + fmtW(t)).join('  ') : 'LAP --:--.--'; }
        else { time = fmtD(fLeft()); f = fLeft() / ((st.phase === 'work' ? st.work : st.rest) * 60000); info = (st.phase === 'work' ? T('timerWork', '作業 WORK') + ' ' + st.work + 'm' : T('timerBreak', '休憩 BREAK') + ' ' + st.rest + 'm') + ' · R' + st.round; }
        if (run && now % 1000 >= 500 && m !== 'watch') time = time.replace(':', ';');
        let inv = now < flashUntil && now % 700 < 350;
        x.fillStyle = inv ? rgba(mix(c, [255, 255, 255], 0.2), 1) : '#07060a'; x.fillRect(0, 0, SW, SH);
        if (!inv) { let g = x.createRadialGradient(SW / 2, SH / 2, 10, SW / 2, SH / 2, SW * 0.7); g.addColorStop(0, rgba(c, 0.1)); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, SW, SH); }
        if (now < stat) {
            // changing channel = static
            let im = x.getImageData(0, 0, SW, SH), d = im.data;
            for (let i = 0; i < d.length; i += 4) { let v = Math.random() * 255 | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
            x.putImageData(im, 0, 0);
            x.fillStyle = 'rgba(0,0,0,0.55)'; x.fillRect(0, 0, 44, 20); x.fillStyle = 'rgb(' + fg.join(',') + ')'; x.font = '12px DotGothic16, monospace'; x.textBaseline = 'top'; txt(x, CH[m][0], 6, 4);
        } else {
            let ink = inv ? 'rgba(10,6,12,1)' : 'rgb(' + fg.map(v => v | 0).join(',') + ')', dim = inv ? 'rgba(10,6,12,0.5)' : rgba(c, 0.45);
            const both = (fn) => { if (!inv) { x.fillStyle = 'rgba(0,0,0,0.7)'; x.save(); x.translate(1, 1); fn(); x.restore(); } x.fillStyle = ink; fn(); };
            x.textBaseline = 'top'; x.font = '12px DotGothic16, monospace';
            both(() => txt(x, CH[m][0] + ' ' + CH[m][1], 9, 5));
            both(() => txt(x, run ? '▶' : '■', SW - 9, 5, 'right'));
            x.font = '10px DotGothic16, monospace';
            x.fillStyle = dim; txt(x, CH[m][2], 9, 19);
            let sc = 5, w = bigW(time, sc) + (sub ? bigW(sub, 3) + 3 : 0), X = Math.round((SW - w) / 2), Y = 38;
            both(() => { big(x, time, X, Y, sc); if (sub) big(x, sub, X + bigW(time, sc) + 3, Y + 7 * sc - 7 * 3, 3); });
            // the bar, like the volume one
            let n = 24, on = Math.round(Math.max(0, Math.min(1, f)) * n), bx = Math.round((SW - n * 7 + 2) / 2);
            for (let i = 0; i < n; i++) { x.fillStyle = i < on ? ink : dim; if (i >= on && !inv) x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(bx + i * 7, 88, 5, 8); }
            x.font = '10px DotGothic16, monospace';
            both(() => txt(x, info, SW / 2, 108, 'center'));
        }
        // the glow is the same picture blurred, cheap bloom
        scr.gx.clearRect(0, 0, SW, SH); scr.gx.drawImage(scr.lo, 0, 0);
        root.classList.toggle('run', run);
        root.classList.toggle('flash', now < flashUntil);
        root.classList.toggle('mute', !beep);
        let k = root.querySelector('.dv-sw'); k.style.setProperty('--k', MODES.indexOf(m)); k.querySelectorAll('span').forEach((e, i) => e.classList.toggle('on', i === MODES.indexOf(m)));
        root.querySelector('[data-b="lap"] small').textContent = m === 'watch' && st.since ? 'LAP' : 'RST';
        let tt = $('win-title-timer.exe'); if (tt) tt.textContent = T('timerTitle', 'timer.exe 【タイマー】');
    }
    let looping = false;
    function loop() {
        if (looping || !$('tm-root')) return; looping = true;
        (function f() { let n = Date.now(); if (!$('tm-root') || !(going() || n < flashUntil || n < stat)) { looping = false; draw(); return; } draw(); setTimeout(() => requestAnimationFrame(f), n < stat ? 40 : st.mode === 'watch' ? 30 : 200); })();
    }

    function wire() {
        let root = $('tm-root'); if (!root || root.dataset.on) return; root.dataset.on = '1';
        root.innerHTML = `<div class="dv">
            <div class="dv-face">
                <div class="dv-scr"><div class="tv-crt"><canvas class="lo" width="${SW}" height="${SH}"></canvas><canvas class="gl" width="${SW}" height="${SH}"></canvas><i class="tv-scan"></i><i class="tv-glass"></i></div></div>
                <div class="dv-ctl">
                    <button type="button" data-b="go" class="dv-go" aria-label="start / stop"><i></i></button>
                    <div class="dv-pair"><button type="button" data-b="lap"><small>RST</small></button><button type="button" data-b="bell" class="alm" aria-label="alarm"><small>ALM</small></button></div>
                    <div class="dv-grill"></div>
                </div>
                <div class="dv-low">
                    <div class="dv-sw" title="CH"><div class="dv-slot"><i></i></div>${MODES.map(k => `<span>${{ timer: 'TMR', watch: 'CHR', focus: 'FCS' }[k]}</span>`).join('')}</div>
                    <i class="dv-led"></i><span class="dv-logo">VAMPII TIMER</span>
                </div>
            </div>
            <div class="dv-wheel" data-knob title="${T('timerKnob', '回して時間を合わせる // turn to set')}"><i></i></div>
        </div>`;
        let lo = root.querySelector('.lo'), gl = root.querySelector('.gl');
        scr = { lo, x: lo.getContext('2d'), gx: gl.getContext('2d') };
        root.querySelectorAll('[data-b]').forEach(b => {
            if (b.dataset.b === 'bell') { b.onclick = () => { beep = !beep; try { localStorage.setItem('vmp_timer_bell', beep ? '1' : '0'); } catch (e) {} if (os.sfx) os.sfx.tone(900, 0.03, { vol: 0.02 }); draw(); }; return; }
            b.onclick = () => press(b.dataset.b);
        });
        root.querySelector('.dv-sw').onclick = () => press('mode');
        let kn = root.querySelector('[data-knob]'), last = null, acc = 0, pos = 0;
        const roll = d => { pos += d; kn.style.setProperty('--r', pos.toFixed(1) + 'px'); };
        kn.addEventListener('pointerdown', e => { e.preventDefault(); kn.setPointerCapture(e.pointerId); last = e.clientY; acc = 0; });
        kn.addEventListener('pointermove', e => {
            if (last === null) return; let d = last - e.clientY; last = e.clientY; acc += d; roll(-d);
            while (Math.abs(acc) > 9) { press(acc > 0 ? 'up' : 'dn'); acc -= Math.sign(acc) * 9; }
        });
        ['pointerup', 'pointercancel'].forEach(ev => kn.addEventListener(ev, () => { last = null; }));
        kn.addEventListener('wheel', e => { e.preventDefault(); press(e.deltaY < 0 ? 'up' : 'dn'); roll(e.deltaY < 0 ? -9 : 9); }, { passive: false });
        draw(); loop();
    }

    function inject() {
        let tpl = document.createElement('template'); tpl.id = 'timer.exe';
        tpl.innerHTML = '<div id="tm-root" class="readable-ui"></div>';
        document.body.appendChild(tpl);
        let base = os.summon.bind(os);
        os.summon = function (id) {
            let existed = $('win-' + id), r = base.apply(os, arguments);
            if (id === 'timer.exe' && !existed) { let w = $('win-timer.exe'); if (w) { w.style.maxWidth = '440px'; w.querySelector('.window-header').ondblclick = null; } wire(); }
            if (id === 'timer.exe') { hush(); draw(); }
            return r;
        };
    }

    let css = document.createElement('style');
    css.textContent = `
        /* no window, its just the thing */
        #desktop > #win-timer\\.exe { background: none !important; border: 0 !important; box-shadow: none !important; overflow: visible !important; }
        #desktop > #win-timer\\.exe::before, #desktop > #win-timer\\.exe::after, #desktop > #win-timer\\.exe .wglow, #desktop > #win-timer\\.exe .wbloom { display: none !important; }
        #desktop > #win-timer\\.exe .window-header { position: absolute !important; z-index: 4; left: 26px; right: 34px; top: 7px; height: 24px; padding: 0 2px 0 8px !important; overflow: visible !important; background: none !important; border: 0 !important; box-shadow: none !important; border-radius: 0 !important; }
        #desktop > #win-timer\\.exe .window-header::before, #desktop > #win-timer\\.exe .window-header::after, #desktop > #win-timer\\.exe .win-ic { display: none !important; }
        #desktop > #win-timer\\.exe .window-header > span:first-child { display: none !important; }
        /* no maximise, its a handheld */
        #desktop > #win-timer\\.exe .win-btns { position: absolute; right: 6px; top: 6px; display: flex; align-items: center; gap: 70px; }
        #desktop > #win-timer\\.exe .max-btn { display: none !important; }
        #desktop > #win-timer\\.exe .win-btn, #desktop > #win-timer\\.exe .kill-btn { position: relative; margin: 0 !important; padding: 0 !important; border: 0 !important; transition: none !important; }
        #desktop > #win-timer\\.exe .win-btn::after, #desktop > #win-timer\\.exe .kill-btn::after { position: absolute; right: calc(100% + 7px); top: 50%; transform: translateY(-50%); white-space: nowrap; font: 8px/1 'DotGothic16', monospace; letter-spacing: 1px; color: #57525e; text-shadow: 0 1px 0 rgba(255,255,255,0.06); pointer-events: none; }
        #desktop > #win-timer\\.exe .min-btn { width: 15px !important; height: 15px !important; border-radius: 50% !important; background: radial-gradient(circle at 45% 35%, #3e3a44, #1b191f 70%) !important; box-shadow: 0 2px 0 #050407, 0 0 0 2px #0a090c, inset 0 1px 0 rgba(255,255,255,0.14) !important; }
        #desktop > #win-timer\\.exe .min-btn::before { display: none !important; }
        #desktop > #win-timer\\.exe .min-btn::after { content: 'スリープ SLEEP'; }
        #desktop > #win-timer\\.exe .min-btn:active { transform: translateY(2px); box-shadow: 0 0 0 #050407, 0 0 0 2px #0a090c !important; }
        #desktop > #win-timer\\.exe .kill-btn { width: 30px !important; height: 13px !important; border-radius: 7px !important; background: linear-gradient(90deg, color-mix(in srgb, var(--nx) 45%, #050407) 0 50%, #050407 50%) !important; box-shadow: inset 0 1px 3px #000, 0 1px 0 rgba(255,255,255,0.08) !important; }
        #desktop > #win-timer\\.exe .kill-btn::before { position: absolute; left: 15px; top: 1px; width: 13px !important; height: 11px !important; border-radius: 4px; -webkit-mask: none !important; mask: none !important; background: linear-gradient(#d4cfdb, #7a7581) !important; box-shadow: 0 1px 1px rgba(0,0,0,0.6); opacity: 1 !important; transition: left 0.08s; }
        #desktop > #win-timer\\.exe .kill-btn::after { content: '電源 POWER'; }
        #desktop > #win-timer\\.exe .kill-btn:active::before { left: 2px; }
        #desktop > #win-timer\\.exe .window-body { padding: 0 !important; background: none !important; box-shadow: none !important; overflow: visible !important; max-height: none !important; }
        #tm-root { user-select: none; padding: 4px 14px 22px 4px; --nx: var(--neon-primary); }
        .dv { position: relative; padding: 34px 14px 12px; border-radius: 30px 30px 30px 30px / 26px 26px 34px 34px; border: 1px solid #000;
            background: radial-gradient(90% 60% at 25% 0%, rgba(255,255,255,0.08), transparent 60%), radial-gradient(4px 4px at 50% 50%, rgba(255,255,255,0.025), transparent) 0 0 / 5px 5px, linear-gradient(#29262e, #18161b 55%, #111014);
            box-shadow: inset 0 2px 0 rgba(255,255,255,0.12), inset 0 -4px 0 rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.03), 0 12px 26px rgba(0,0,0,0.6); }
        .dv::after { content: ''; position: absolute; left: 22px; right: 22px; bottom: 6px; height: 1px; background: linear-gradient(90deg, transparent, var(--nx), transparent); opacity: 0.55; box-shadow: 0 0 6px var(--nx); }
        .dv-face { display: grid; grid-template-columns: 1fr 92px; gap: 10px 14px; }
        .dv-scr { padding: 8px; border-radius: 14px; background: linear-gradient(#0a090c, #17151a); box-shadow: inset 0 2px 6px #000, 0 1px 0 rgba(255,255,255,0.08); }
        .tv-crt { position: relative; aspect-ratio: 192 / 136; overflow: hidden; border-radius: 9px; background: #050407; box-shadow: 0 0 0 1px #000; }
        .tv-crt canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
        .tv-crt .lo { image-rendering: pixelated; }
        .tv-crt .gl { filter: blur(3px) brightness(1.4); mix-blend-mode: screen; opacity: 0.85; }
        .tv-scan { position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(0deg, rgba(0,0,0,0.32) 0 1px, transparent 1px 3px); }
        .tv-scan::after { content: ''; position: absolute; left: 0; right: 0; height: 30%; top: -30%; background: linear-gradient(transparent, rgba(255,255,255,0.03), transparent); animation: tvRoll 7s linear infinite; }
        @keyframes tvRoll { to { transform: translateY(440%); } }
        .tv-glass { position: absolute; inset: 0; pointer-events: none; border-radius: inherit; background: linear-gradient(155deg, rgba(255,255,255,0.09), transparent 38%), radial-gradient(110% 110% at 50% 50%, transparent 60%, rgba(0,0,0,0.5)); box-shadow: inset 0 0 12px rgba(0,0,0,0.7); }
        .dv-ctl { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
        .dv-go { position: relative; width: 62px; height: 62px; padding: 0; cursor: inherit; border: 0; border-radius: 50%; background: #070609; box-shadow: inset 0 3px 6px #000, 0 1px 0 rgba(255,255,255,0.08); }
        .dv-go i { position: absolute; inset: 6px; display: grid; place-items: center; border-radius: 50%; transition: transform 0.08s, box-shadow 0.15s;
            background: radial-gradient(circle at 45% 28%, #4c4854, #26232b 58%, #18161c); box-shadow: 0 4px 0 #0a090c, 0 0 0 2px color-mix(in srgb, var(--nx) 30%, #0a090c), inset 0 1px 0 rgba(255,255,255,0.16); }
        .dv-go i::before { content: ''; width: 15px; height: 17px; margin-left: 4px; clip-path: polygon(0 0, 100% 50%, 0 100%); background: color-mix(in srgb, var(--nx) 55%, #fff); filter: drop-shadow(0 0 3px var(--nx)); }
        #tm-root.run .dv-go i { transform: translateY(3px); box-shadow: 0 1px 0 #0a090c, 0 0 0 2px var(--nx), 0 0 14px color-mix(in srgb, var(--nx) 55%, transparent), inset 0 1px 0 rgba(255,255,255,0.12); }
        #tm-root.run .dv-go i::before { width: 14px; height: 16px; margin-left: 0; clip-path: none; background: linear-gradient(90deg, color-mix(in srgb, var(--nx) 55%, #fff) 0 36%, transparent 36% 64%, color-mix(in srgb, var(--nx) 55%, #fff) 64%); }
        .dv-go:active i { transform: translateY(4px); box-shadow: 0 0 0 #0a090c, 0 0 0 2px color-mix(in srgb, var(--nx) 45%, #0a090c), inset 0 1px 0 rgba(255,255,255,0.1); }
        .dv-pair { display: flex; gap: 8px; transform: rotate(-12deg); }
        .dv-pair button { width: 38px; height: 16px; padding: 0; cursor: inherit; border: 1px solid #000; border-radius: 8px; background: linear-gradient(#4f4b56, #26232b); box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 3px 0 #050407; }
        .dv-pair button small { font: 8px 'DotGothic16', monospace; letter-spacing: 1px; color: #d8d2e0; }
        .dv-pair button:active { transform: translateY(2px); box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 0 #050407; }
        .dv-pair .alm { background: linear-gradient(#c4283c, #6e1220); }
        #tm-root.mute .dv-pair .alm { background: linear-gradient(#3a3640, #1e1c22); }
        #tm-root.mute .dv-pair .alm small { opacity: 0.5; text-decoration: line-through; }
        .dv-grill { display: grid; grid-template-columns: repeat(5, 4px); gap: 5px; }
        .dv-grill::before { content: ''; grid-column: 1 / -1; height: 22px; background: radial-gradient(circle, #050407 1.6px, transparent 2px) 0 0 / 9px 7px; opacity: 0.9; width: 44px; }
        .dv-low { grid-column: 1 / -1; display: flex; align-items: center; gap: 10px; padding: 0 6px; }
        .dv-sw { display: flex; align-items: center; gap: 8px; cursor: inherit; }
        .dv-slot { position: relative; width: 50px; height: 12px; border-radius: 6px; background: #050407; box-shadow: inset 0 1px 3px #000, 0 1px 0 rgba(255,255,255,0.07); }
        .dv-slot i { position: absolute; top: 1px; left: calc(2px + var(--k, 0) * 17px); width: 14px; height: 10px; border-radius: 4px; background: linear-gradient(#cfcad6, #77727e); transition: left 0.14s cubic-bezier(.3, 1.5, .6, 1); }
        .dv-sw span { font: 9px 'DotGothic16', monospace; letter-spacing: 1px; color: #4e4a55; }
        .dv-sw span.on { color: var(--nx); text-shadow: 0 0 5px var(--nx); }
        .dv-led { width: 5px; height: 5px; margin-left: auto; border-radius: 50%; background: #3a1a1e; box-shadow: inset 0 0 0 1px #000; }
        #tm-root.run .dv-led { background: #ff3355; box-shadow: 0 0 6px #ff3355; }
        .dv-logo { font: bold 10px 'Arial Black', 'DotGothic16', sans-serif; letter-spacing: 3px; color: #1d1b21; text-shadow: 0 1px 0 rgba(255,255,255,0.13), 0 -1px 0 rgba(0,0,0,0.8); }
        .dv-wheel { position: absolute; right: -9px; top: 70px; width: 14px; height: 74px; border-radius: 5px; cursor: inherit; touch-action: none; overflow: hidden; border: 1px solid #000;
            background: repeating-linear-gradient(0deg, #1a181d 0 2px, #4a4650 2px 3px, #2a272e 3px 5px) 0 var(--r, 0px) / 100% 5px, #222;
            box-shadow: inset 4px 0 4px rgba(0,0,0,0.55), inset -3px 0 3px rgba(0,0,0,0.7), 2px 0 4px rgba(0,0,0,0.5); }
        .dv-wheel i { position: absolute; inset: 0; background: linear-gradient(rgba(0,0,0,0.75), transparent 30%, transparent 70%, rgba(0,0,0,0.75)); }
        .tm-shake { animation: tmShake 0.45s 4; }
        @keyframes tmShake { 20% { transform: translateX(-3px) rotate(-0.6deg); } 40% { transform: translateX(3px) rotate(0.6deg); } 60% { transform: translateX(-2px); } 80% { transform: translateX(2px); } }
        html.reduce-motion .tm-shake, html.reduce-motion .tv-scan::after { animation: none; }
    `;
    document.head.appendChild(css);
    inject(); arm();
    // new theme = redraw
    if (os.paintTheme) { let pt = os.paintTheme; os.paintTheme = function () { let r = pt.apply(this, arguments); draw(); return r; }; }
    os.timer = { press, state: () => JSON.parse(JSON.stringify(st)), going };
})();
