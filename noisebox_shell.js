// just the box. doesnt touch the sound
window.os = window.os || {};

(function () {
    const root = document.documentElement;
    let tick = 0;
    function dress() {
        let w = document.getElementById('win-noisebox.exe');
        if (!w || w.querySelector('.nbs-ear')) return;
        ['l', 'r'].forEach(k => {
            let e = document.createElement('i');
            e.className = 'nbs-ear ' + k;
            e.setAttribute('aria-hidden', 'true');
            e.innerHTML = '<b class="nbs-handle"></b><span class="nbs-vent"></span>';
            w.appendChild(e);
        });
        let head = w.querySelector('.window-header');
        if (head && !head.querySelector('.nbs-face')) {
            let f = document.createElement('div');
            f.className = 'nbs-face';
            f.setAttribute('aria-hidden', 'true');
            f.innerHTML = '<div class="nbs-logo"><b>NOISEBOX</b><small>音箱 · 4444</small></div><div class="nbs-left"><button type="button" class="nbs-beat" title="tempo // テンポ"><i></i><b>120</b><small>BPM</small></button><div class="nbs-lad">' + '<i></i>'.repeat(10) + '</div><div class="nbs-lad">' + '<i></i>'.repeat(10) + '</div><div class="nbs-clips"><b>00</b><small>CLIPS</small></div></div><div class="nbs-lcd"><span></span><b>' + '<i></i>'.repeat(24) + '</b><em class="nbs-db">-∞ dB</em></div><div class="nbs-right"><div class="nbs-gon"><canvas width="64" height="56"></canvas><i></i></div><div class="nbs-vus"><div class="nbs-vu"><i></i><em>L</em></div><div class="nbs-vu"><i></i><em>R</em></div></div></div><div class="nbs-fan"><i></i></div>';
            head.insertBefore(f, head.querySelector('.win-btns') || null);
            vu(f);
            f.querySelector('.nbs-beat').onclick = e => { e.stopPropagation(); tempo(f.querySelector('.nbs-beat')); };
            // the meters arent handles. grabbing them was dragging the whole window about
            f.querySelectorAll('.nbs-left, .nbs-lcd, .nbs-right, .nbs-fan').forEach(x => ['mousedown', 'pointerdown', 'touchstart', 'dblclick'].forEach(ev => x.addEventListener(ev, e => e.stopPropagation())));
        }
        if (head) {
            let leds = document.createElement('span');
            leds.className = 'nbs-leds';
            leds.setAttribute('aria-hidden', 'true');
            leds.innerHTML = '<i class="pwr"></i><em>PWR</em><i class="sig"></i><em>SIG</em><i class="clip"></i><em>CLIP</em>';
            let btns = head.querySelector('.win-btns') || head.lastElementChild;
            head.insertBefore(leds, btns);
        }
        let plate = document.createElement('i');
        plate.className = 'nbs-plate';
        plate.setAttribute('aria-hidden', 'true');
        plate.textContent = T('nbPlate', 'NB-4444 · 音箱 · wired by hand, badly');
        w.appendChild(plate);
        clearInterval(tick);
        tick = setInterval(() => leds(w), 110);
    }
    // SIG flickers with whatever is playing, CLIP pops on the loud bits. rough, its just leds
    function leds(w) {
        if (!w.isConnected) { clearInterval(tick); return; }
        if (document.hidden || w.classList.contains('is-min')) return;
        let s = w.querySelector('.nbs-leds .sig'), c = w.querySelector('.nbs-leds .clip');
        if (!s) return;
        let on = window.NBX && NBX.playing && NBX.playing();
        let lvl = on ? 0.35 + Math.random() * 0.65 : 0;
        s.style.opacity = on ? lvl.toFixed(2) : '';
        s.classList.toggle('on', !!on);
        c.classList.toggle('on', !!on && lvl > 0.97 && !root.classList.contains('reduce-motion'));
    }
    let tp = null, taps = [];
    function setBpm(v) {
        let X = window.NBX; if (!X || !X.pr) return;
        X.mark(); X.pr.bpm = Math.round(Math.max(20, Math.min(300, v)) * 10) / 10; X.touch();
        let L = X.live && X.live(); if (L && L.retime) L.retime();
        document.querySelectorAll('#win-noisebox\\.exe .nb-lcd.bpm').forEach(e => e.textContent = X.pr.bpm);
        if (tp) tp.querySelector('.nbs-tbig').textContent = X.pr.bpm;
        let b = document.querySelector('.nbs-beat b'); if (b) b.textContent = X.pr.bpm;
    }
    function tempo(at) {
        if (tp) { tp.remove(); tp = null; return; }
        let X = window.NBX; if (!X || !X.pr) return;
        tp = document.createElement('div'); tp.className = 'nbs-tempo';
        tp.innerHTML = '<div class="nbs-trow"><button data-d="-1">−</button><b class="nbs-tbig"></b><button data-d="1">＋</button></div><input type="range" min="40" max="240" step="1"><div class="nbs-trow"><button class="tap">TAP // タップ</button></div><div class="nbs-trow ps">' + [70, 90, 120, 140, 174].map(n => '<button data-v="' + n + '">' + n + '</button>').join('') + '</div><small>shift = 0.1 · 速さ // tempo</small>';
        tp.querySelector('.nbs-tbig').textContent = X.pr.bpm;
        let rg = tp.querySelector('input'); rg.value = X.pr.bpm;
        rg.oninput = () => setBpm(+rg.value);
        tp.addEventListener('click', e => {
            e.stopPropagation();
            let b = e.target.closest('button'); if (!b) return;
            if (os.sfx) os.sfx('tick');
            if (b.dataset.d) setBpm(X.pr.bpm + (+b.dataset.d) * (e.shiftKey ? 0.1 : 1));
            else if (b.dataset.v) setBpm(+b.dataset.v);
            else if (b.classList.contains('tap')) { let t = performance.now(); taps = taps.filter(x => t - x < 2500); taps.push(t); if (taps.length > 1) { let d = (taps[taps.length - 1] - taps[0]) / (taps.length - 1); setBpm(60000 / d); } b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); }
            rg.value = X.pr.bpm;
        });
        tp.addEventListener('mousedown', e => e.stopPropagation());
        document.body.appendChild(tp);
        let r = at.getBoundingClientRect();
        tp.style.left = Math.max(6, Math.min(innerWidth - tp.offsetWidth - 6, r.left + r.width / 2 - tp.offsetWidth / 2)) + 'px';
        tp.style.top = (r.bottom + 8) + 'px';
        if (os.sfx) os.sfx('pop');
    }
    document.addEventListener('mousedown', () => { if (tp) { tp.remove(); tp = null; } });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && tp) { tp.remove(); tp = null; } });
    function vu(f) {
        let nd = f.querySelectorAll('.nbs-vu i'), fan = f.querySelector('.nbs-fan i'), a = [0, 0], v = [0, 0], spin = 0, sp = 0.4, last = performance.now();
        let bars = [...f.querySelectorAll('.nbs-lcd b i')], bh = bars.map(() => 0), msg = f.querySelector('.nbs-lcd span'), was = null;
        let lamp = f.querySelector('.nbs-beat i'), bpmEl = f.querySelector('.nbs-beat b'), lads = [...f.querySelectorAll('.nbs-lad')].map(l => [...l.children].reverse()), clipEl = f.querySelector('.nbs-clips b'), clips = 0, wasHot = false;
        let db = f.querySelector('.nbs-db'), gcv = f.querySelector('.nbs-gon canvas'), gx = gcv.getContext('2d'), cor = f.querySelector('.nbs-gon i'), fq = null, tl = null, tr = null, pkHold = -99, pkT = 0, tk = 0;
        let win = f.closest('.bedazzled-border'), idleT = 0, bhW = bars.map(() => -1);
        function step(now) {
            if (!f.isConnected) return;
            requestAnimationFrame(step);
            // minimised = nobody can see the needles. this was eating cpu the whole time
            if (document.hidden || root.classList.contains('reduce-motion') || (win && win.classList.contains('is-min'))) { last = now; return; }
            let out = window.NBX && NBX.playing && NBX.playing() && NBX.out ? NBX.out : null;
            if (!out && now - idleT < 66) return;
            idleT = now;
            let dt = Math.min(0.05, (now - last) / 1000); last = now;
            for (let k = 0; k < 2; k++) {
                let lvl = out ? Math.min(1.1, Math.pow(out[k] || 0, 0.6)) : 0.015 * Math.sin(now / 900 + k);
                let to = -48 + lvl * 92;
                v[k] += ((to - a[k]) * 90 - v[k] * 11) * dt; a[k] += v[k] * dt;
                nd[k].style.transform = 'rotate(' + a[k].toFixed(2) + 'deg)';
            }
            if (was !== !!out) { was = !!out; msg.textContent = out ? T('nbLcdPlay', '再生中 // PLAYING') : T('nbLcdIdle', '待機中 // READY'); }
            let m = out ? Math.max(out[0] || 0, out[1] || 0) : 0, M = out && NBX.M;
            if (M && M.an) {
                if (!fq || fq.length !== M.an.frequencyBinCount) fq = new Uint8Array(M.an.frequencyBinCount);
                M.an.getByteFrequencyData(fq);
            }
            let dbv = m > 0.00001 ? 20 * Math.log10(m) : -99;
            if (dbv > pkHold || now - pkT > 1500) { pkHold = dbv; pkT = now; }
            if (++tk % 6 === 0) { db.textContent = pkHold <= -60 ? '-∞ dB' : (pkHold > 0 ? '+' : '') + pkHold.toFixed(1) + ' dB'; db.classList.toggle('hot', pkHold > -1); }
            gon(M);
            // if CLIPS goes up, turn something down
            let pr = window.NBX && NBX.pr, L = out && NBX.live && NBX.live(), pos = L && L.pos ? L.pos() : null;
            if (pr && tk % 10 === 0) bpmEl.textContent = pr.bpm || '';
            let ph = pos != null ? pos - Math.floor(pos) : 1, one = pos != null && Math.floor(pos) % 4 === 0;
            lamp.style.opacity = out ? (1 - ph * 0.9).toFixed(2) : '0.12';
            lamp.classList.toggle('one', !!one);
            lads.forEach((segs, k) => { let lv = out ? Math.min(1, Math.max(0, (20 * Math.log10(Math.max(out[k] || 0, 1e-5)) + 42) / 42)) : 0; segs.forEach((sg, i) => sg.classList.toggle('on', lv * 10 > i + 0.5)); });
            let hot = pkHold > -0.1 && !!out;
            if (hot && !wasHot) { clips = Math.min(99, clips + 1); clipEl.textContent = String(clips).padStart(2, '0'); clipEl.parentNode.classList.add('hot'); }
            wasHot = hot;
            bars.forEach((b, i) => {
                let to;
                if (M && M.an && fq) { let n = fq.length, a0 = Math.floor(Math.pow(n / 2, i / 24)), a1 = Math.max(a0 + 1, Math.floor(Math.pow(n / 2, (i + 1) / 24))), s = 0; for (let k = a0; k < a1 && k < n; k++) s = Math.max(s, fq[k]); to = s / 255; }
                else to = out ? Math.min(1, m * (0.35 + Math.random() * 0.9) * (1.15 - i / 40)) : 0.08 + 0.06 * Math.sin(now / 700 + i * 0.5);
                bh[i] = to > bh[i] ? to : bh[i] - dt * 1.4;
                let hh = Math.max(1, Math.round(bh[i] * 8));
                if (hh !== bhW[i]) { bhW[i] = hh; b.style.height = hh * 2 + 'px'; }
            });
            sp += ((out ? 2.4 : 0.4) - sp) * dt * 0.6; spin = (spin + sp * 360 * dt) % 360;
            fan.style.transform = 'rotate(' + spin.toFixed(1) + 'deg)';
        }
        function gon(M) {
            let w = gcv.width, h = gcv.height;
            gx.fillStyle = 'rgba(10, 18, 12, 0.35)'; gx.fillRect(0, 0, w, h);
            if (!M || !M.anL || !M.anR) { cor.style.setProperty('--c', '0.5'); return; }
            if (!tl || tl.length !== M.anL.fftSize) { tl = new Float32Array(M.anL.fftSize); tr = new Float32Array(M.anR.fftSize); }
            M.anL.getFloatTimeDomainData(tl); M.anR.getFloatTimeDomainData(tr);
            gx.fillStyle = '#7dffb0'; let sxy = 0, sxx = 0, syy = 0;
            for (let i = 0; i < tl.length; i += 3) {
                let l = tl[i], r = tr[i], x = (r - l) * 0.7, y = (l + r) * 0.7;
                gx.fillRect(w / 2 + x * w * 0.45, h / 2 - y * h * 0.45, 1, 1);
                sxy += l * r; sxx += l * l; syy += r * r;
            }
            let c = sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
            cor.style.setProperty('--c', ((c + 1) / 2).toFixed(3));
        }
        requestAnimationFrame(step);
    }
    const base = os.summon;
    os.summon = function (id) { let r = base.apply(this, arguments); if (id === 'noisebox.exe') setTimeout(dress, 80); return r; };
    if (document.getElementById('win-noisebox.exe')) dress();

    let css = document.createElement('style');
    css.textContent = `
        #desktop > #win-noisebox\\.exe .nbs-ear { position: absolute; top: 62px; bottom: 62px; width: var(--ear); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px; pointer-events: none; z-index: 2; }
        #desktop > #win-noisebox\\.exe .nbs-ear.l { left: 0; } #desktop > #win-noisebox\\.exe .nbs-ear.r { right: 0; }
        .nbs-handle { position: relative; width: 10px; height: min(150px, 34%); border-radius: 6px; border: 1px solid #050406;
            background: linear-gradient(90deg, #4c4653, #a59eab 35%, #6c6573 55%, #2a2630); box-shadow: 2px 3px 0 rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.3); }
        .nbs-handle::after { content: ''; position: absolute; left: 2px; right: 2px; top: 8%; height: 30%; border-radius: 4px; background: linear-gradient(rgba(255, 255, 255, 0.55), transparent); opacity: 0.45; animation: nbsGleam 9s ease-in-out infinite; }
        @keyframes nbsGleam { 0%, 80%, 100% { transform: translateY(0); opacity: 0.3; } 90% { transform: translateY(180%); opacity: 0.7; } }
        .nbs-vent { width: 12px; height: 48px; background: repeating-linear-gradient(180deg, #050406 0 3px, rgba(255, 255, 255, 0.07) 3px 4px, transparent 4px 7px); border-radius: 2px; }
        .nbs-leds { order: 2; flex: 0 0 auto; display: flex; align-items: center; gap: 4px; margin: 0 14px 0 6px; font: bold 7px Arial, sans-serif; letter-spacing: 1px; color: #8d8696; pointer-events: none; }
        .nbs-leds em { font-style: normal; margin-right: 6px; }
        .nbs-leds i { width: 6px; height: 6px; border-radius: 50%; background: #2a2228; box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.8); transition: opacity 0.08s; }
        .nbs-leds .pwr { background: radial-gradient(circle at 40% 35%, #fff, #4dff9a 50%); box-shadow: 0 0 5px #4dff9a; animation: nbsBreath 3.2s ease-in-out infinite; }
        .nbs-leds .sig.on { background: radial-gradient(circle at 40% 35%, #fff, var(--neon-secondary) 50%); box-shadow: 0 0 6px var(--neon-secondary); }
        .nbs-leds .clip.on { background: radial-gradient(circle at 40% 35%, #fff, #ff2a3c 50%); box-shadow: 0 0 6px #ff2a3c; }
        @keyframes nbsBreath { 50% { opacity: 0.55; box-shadow: 0 0 2px #4dff9a; } }
        #desktop > #win-noisebox\\.exe .window-header::after { background: repeating-linear-gradient(90deg, #050406 0 16px, transparent 16px 21px), linear-gradient(90deg, transparent 40%, color-mix(in srgb, var(--neon-primary) 45%, transparent) 50%, transparent 60%) -100% 0 / 300% 100% no-repeat !important; animation: nbsSweep 12s linear infinite; }
        @keyframes nbsSweep { 0%, 75% { background-position: 0 0, 150% 0; } 100% { background-position: 0 0, -50% 0; } }
        .nbs-plate { position: absolute; right: calc(var(--ear) + 14px); bottom: 3px; z-index: 2; pointer-events: none; font: bold 8px Arial, sans-serif; letter-spacing: 2px; color: #6f6878; text-shadow: 0 1px 0 rgba(255, 255, 255, 0.08), 0 -1px 0 #000; text-transform: uppercase; font-style: normal; }
        #desktop > #win-noisebox\\.exe.is-max .nbs-plate { bottom: 2px; }
        #desktop > #win-noisebox\\.exe .window-header { position: relative; min-height: 46px; gap: 12px; }
        #desktop > #win-noisebox\\.exe .window-header > span:first-child { position: absolute !important; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
        #desktop > #win-noisebox\\.exe .window-header::after { display: none !important; }
        .nbs-face { order: 1; flex: 1; min-width: 0; display: flex; align-items: center; gap: 14px; }
        .nbs-logo { display: flex; flex-direction: column; line-height: 1; padding-left: 4px; }
        .nbs-logo b { font: italic 900 21px/1 'Arial Black', 'Helvetica Neue', sans-serif; letter-spacing: -1px; transform: skewX(-8deg);
            background: linear-gradient(180deg, #fff 0 18%, #c9c2d1 40%, #6e6778 52%, #e8e2ee 68%, var(--neon-secondary)); -webkit-background-clip: text; background-clip: text; color: transparent;
            filter: drop-shadow(0 1px 0 #000) drop-shadow(0 0 6px color-mix(in srgb, var(--neon-primary) 35%, transparent)); }
        .nbs-logo small { margin-top: 3px; font: bold 7px Arial, sans-serif; letter-spacing: 4px; color: #8d8696; }
        .nbs-lcd { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(440px, 36%); height: 32px; margin: 0; padding: 3px 10px; display: flex; align-items: center; gap: 12px; border-radius: 3px; overflow: hidden;
            background: #140d05; box-shadow: inset 0 0 0 2px #050406, inset 0 3px 8px #000, 0 1px 0 rgba(255, 255, 255, 0.08); font: 11px 'DotGothic16', monospace; color: #ffb547; text-shadow: 0 0 6px rgba(255, 170, 60, 0.6); }
        .nbs-lcd::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.35) 0 1px, transparent 1px 2px), linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent 40%); }
        .nbs-lcd span { flex: 0 0 auto; white-space: nowrap; }
        .nbs-lcd b { flex: 1; display: flex; align-items: flex-end; gap: 2px; height: 20px; }
        .nbs-lcd b i { flex: 1; min-height: 2px; background: repeating-linear-gradient(0deg, #ffb547 0 1px, transparent 1px 2px); box-shadow: 0 0 4px rgba(255, 170, 60, 0.45); }
        .nbs-left { position: absolute; top: 50%; right: calc(50% + min(220px, 18%) + 14px); transform: translateY(-50%); display: flex; align-items: center; gap: 8px; padding: 4px 12px 4px 14px; border-radius: 4px;
            background: linear-gradient(180deg, #1a181e, #222027); box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.8), inset 0 0 0 1px #0a090c, 0 1px 0 rgba(255, 255, 255, 0.07); }
        .nbs-left::before, .nbs-left::after { content: ''; position: absolute; top: 50%; width: 5px; height: 5px; margin-top: -2.5px; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #a49cab, #3e3944 70%); box-shadow: inset 0 0 0 1px #0a090c; }
        .nbs-left::before { left: 4px; } .nbs-left::after { right: 3px; }
        button.nbs-beat { border: 0; cursor: inherit; }
        button.nbs-beat:hover { box-shadow: inset 0 0 0 2px #050406, inset 0 2px 6px #000, 0 0 0 1px color-mix(in srgb, var(--neon-secondary) 60%, transparent); }
        .nbs-tempo { position: fixed; z-index: 99990; width: 190px; padding: 10px; display: flex; flex-direction: column; gap: 8px; border-radius: 4px; font: 11px 'DotGothic16', monospace; color: #ffb547;
            background: linear-gradient(180deg, #2c2931, #1b191f); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 0 0 1px #050406, 0 10px 24px rgba(0, 0, 0, 0.6); animation: nbsTp 0.16s ease-out; }
        @keyframes nbsTp { from { opacity: 0; transform: translateY(-6px); } }
        .nbs-tempo::before { content: ''; position: absolute; top: -5px; left: 50%; margin-left: -5px; border: 5px solid transparent; border-top: 0; border-bottom-color: #2c2931; }
        .nbs-trow { display: flex; gap: 4px; align-items: center; justify-content: center; }
        .nbs-tbig { flex: 1; text-align: center; font: 26px/1.1 'DotGothic16', monospace; padding: 4px 0; border-radius: 3px; background: #140d05; box-shadow: inset 0 0 0 2px #050406, inset 0 3px 8px #000; text-shadow: 0 0 8px rgba(255, 170, 60, 0.6); }
        .nbs-tempo button { flex: 1; min-width: 0; padding: 5px 0; border: 0; border-radius: 3px; font: inherit; color: #d8d0de; background: linear-gradient(#3a3640, #25222a); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 2px 0 #0a090c; cursor: inherit; }
        .nbs-tempo button:hover { color: #fff; } .nbs-tempo button:active, .nbs-tempo button.hit { transform: translateY(2px); box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.6); color: #ffb547; }
        .nbs-trow:first-child button { flex: 0 0 30px; font-size: 16px; }
        .nbs-tempo input { width: 100%; accent-color: #ffb547; }
        .nbs-tempo small { color: #7d7686; font-size: 9px; text-align: center; }
        .nbs-beat, .nbs-clips { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 3px 7px; border-radius: 3px; background: #140d05; box-shadow: inset 0 0 0 2px #050406, inset 0 2px 6px #000, 0 1px 0 rgba(255, 255, 255, 0.08); font: 11px/1 'DotGothic16', monospace; color: #ffb547; text-shadow: 0 0 5px rgba(255, 170, 60, 0.5); }
        .nbs-beat { flex-direction: row; gap: 6px; }
        .nbs-beat i { width: 9px; height: 9px; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #fff, var(--neon-secondary) 55%); box-shadow: 0 0 6px var(--neon-secondary); opacity: 0.12; }
        .nbs-beat i.one { background: radial-gradient(circle at 40% 35%, #fff, var(--neon-primary) 55%); box-shadow: 0 0 8px var(--neon-primary); }
        .nbs-beat small, .nbs-clips small { font: bold 6px Arial, sans-serif; letter-spacing: 1px; color: #8a6a3a; text-shadow: none; }
        .nbs-clips b, .nbs-beat b { font-weight: normal; }
        .nbs-clips.hot b { color: #ff5a4a; text-shadow: 0 0 6px rgba(255, 80, 60, 0.7); }
        .nbs-lad { display: flex; flex-direction: column; gap: 1px; padding: 2px; border-radius: 2px; background: #08070a; box-shadow: inset 0 0 0 1px #050406; }
        .nbs-lad i { width: 8px; height: 2px; background: #1d2a1d; }
        .nbs-lad i:nth-child(-n+2) { background: #3a1416; } .nbs-lad i:nth-child(n+3):nth-child(-n+4) { background: #3a2a10; }
        .nbs-lad i.on { background: #6dff9a; box-shadow: 0 0 3px #6dff9a; }
        .nbs-lad i:nth-child(-n+4).on { background: #ffc24a; box-shadow: 0 0 3px #ffc24a; } .nbs-lad i:nth-child(-n+2).on { background: #ff4a4a; box-shadow: 0 0 3px #ff4a4a; }
        .nbs-db { flex: 0 0 auto; font-style: normal; font-size: 10px; min-width: 6ch; text-align: right; opacity: 0.85; }
        .nbs-db.hot { color: #ff5a4a; text-shadow: 0 0 6px rgba(255, 80, 60, 0.7); }
        .nbs-right { position: absolute; top: 50%; left: calc(50% + min(220px, 18%) + 14px); transform: translateY(-50%); display: flex; align-items: center; gap: 6px; padding: 4px 14px 4px 12px; border-radius: 4px;
            background: linear-gradient(180deg, #1a181e, #222027); box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.8), inset 0 0 0 1px #0a090c, 0 1px 0 rgba(255, 255, 255, 0.07); }
        .nbs-right::before, .nbs-right::after { content: ''; position: absolute; top: 50%; width: 5px; height: 5px; margin-top: -2.5px; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #a49cab, #3e3944 70%); box-shadow: inset 0 0 0 1px #0a090c; }
        .nbs-right::before { left: 3px; } .nbs-right::after { right: 4px; }
        .nbs-fan { margin-left: auto; }
        .nbs-gon { position: relative; flex: 0 0 auto; width: 44px; height: 34px; border-radius: 3px; overflow: hidden; background: #08100a; box-shadow: inset 0 0 0 2px #050406, inset 0 2px 6px #000, 0 1px 0 rgba(255, 255, 255, 0.08); }
        .nbs-gon canvas { display: block; width: 100%; height: 30px; }
        .nbs-gon::before { content: ''; position: absolute; inset: 2px 2px 6px; pointer-events: none; background: linear-gradient(90deg, transparent calc(50% - 0.5px), rgba(125, 255, 176, 0.15) 50%, transparent calc(50% + 0.5px)), linear-gradient(0deg, transparent calc(50% - 0.5px), rgba(125, 255, 176, 0.15) 50%, transparent calc(50% + 0.5px)); }
        .nbs-gon i { position: absolute; left: 3px; right: 3px; bottom: 2px; height: 2px; background: rgba(125, 255, 176, 0.15); }
        .nbs-gon i::after { content: ''; position: absolute; top: -1px; width: 3px; height: 4px; left: calc(var(--c, 0.5) * 100% - 1.5px); background: #7dffb0; box-shadow: 0 0 4px #7dffb0; transition: left 0.15s; }
        .nbs-vus { display: flex; gap: 4px; }
        .nbs-vu { position: relative; width: 58px; height: 32px; border-radius: 3px; overflow: hidden;
            background: radial-gradient(120% 90% at 50% 120%, color-mix(in srgb, var(--neon-secondary) 20%, #f3e3b8), #d9c48e 70%, #a8935f);
            box-shadow: inset 0 0 0 2px #0a090c, inset 0 3px 6px rgba(0, 0, 0, 0.55), 0 1px 0 rgba(255, 255, 255, 0.08); }
        .nbs-vu::before { content: ''; position: absolute; left: 50%; bottom: -26px; width: 74px; height: 74px; margin-left: -37px; border-radius: 50%;
            background: conic-gradient(from -50deg, #2b2418 0 2deg, transparent 2deg 10deg, #2b2418 10deg 12deg, transparent 12deg 20deg, #2b2418 20deg 22deg, transparent 22deg 30deg, #2b2418 30deg 32deg, transparent 32deg 40deg, #2b2418 40deg 42deg, transparent 42deg 50deg, #2b2418 50deg 52deg, transparent 52deg 62deg, #c41c38 62deg 64deg, transparent 64deg 72deg, #c41c38 72deg 74deg, transparent 74deg 82deg, #c41c38 82deg 84deg, transparent 84deg);
            -webkit-mask: radial-gradient(circle, transparent 29px, #000 30px 33px, transparent 34px); mask: radial-gradient(circle, transparent 29px, #000 30px 33px, transparent 34px); }
        .nbs-vu::after { content: 'VU'; position: absolute; left: 50%; top: 14px; transform: translateX(-50%); font: bold 8px Arial, sans-serif; letter-spacing: 1px; color: #5a4c2c; }
        .nbs-vu i { position: absolute; left: 50%; bottom: -11px; width: 1.2px; height: 39px; margin-left: -0.75px; background: linear-gradient(#1a1410 70%, #c41c38); transform-origin: 50% 100%; transform: rotate(-48deg); box-shadow: 1px 0 1px rgba(0, 0, 0, 0.25); }
        .nbs-vu em { position: absolute; left: 4px; bottom: 2px; font: bold 7px Arial, sans-serif; color: #5a4c2c; font-style: normal; }
        .nbs-fan { position: relative; width: 32px; height: 32px; border-radius: 50%; overflow: hidden; background: #08070a; box-shadow: inset 0 0 0 2px #2a2630, inset 0 0 8px #000, 0 1px 0 rgba(255, 255, 255, 0.08); }
        .nbs-fan i { position: absolute; inset: 3px; border-radius: 50%; background: radial-gradient(circle, #3a3540 0 4px, transparent 4.5px), repeating-conic-gradient(from 0deg, #2c2832 0 34deg, transparent 34deg 60deg); filter: blur(0.4px); }
        .nbs-fan::after { content: ''; position: absolute; inset: 0; border-radius: 50%; background: radial-gradient(circle, transparent 3px, #111 3.5px 4.5px, transparent 5px 8px, #111 8.5px 9.5px, transparent 10px 13px, #111 13.5px 14.5px, transparent 15px), linear-gradient(90deg, transparent 15px, #111 15px 17px, transparent 17px), linear-gradient(0deg, transparent 15px, #111 15px 17px, transparent 17px); }
        @media (max-width: 1100px) { .nbs-left, .nbs-right { display: none; } }
        @media (max-width: 760px) { .nbs-leds, .nbs-plate, .nbs-handle, .nbs-vus, .nbs-fan, .nbs-lcd b, .nbs-gon, .nbs-db { display: none; } .nbs-vent { width: 6px; } .nbs-logo small { display: none; } }
        html.reduce-motion .nbs-handle::after, html.reduce-motion .nbs-leds .pwr, html.reduce-motion #desktop > #win-noisebox\\.exe .window-header::after { animation: none; }

        #desktop > #nb-vwin { border: 0 !important; border-radius: 7px; padding: 0 10px 10px; color: #d8d0de;
            --scr: radial-gradient(circle at 40% 35%, #b3abb9 0 1px, #4a4550 2px, #1a181e 2.8px, transparent 3.3px);
            background: var(--scr) 4px 4px / 10px 10px no-repeat, var(--scr) calc(100% - 4px) 4px / 10px 10px no-repeat, var(--scr) 4px calc(100% - 4px) / 10px 10px no-repeat, var(--scr) calc(100% - 4px) calc(100% - 4px) / 10px 10px no-repeat,
                repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.018) 0 1px, transparent 1px 3px), linear-gradient(180deg, #312d36, #1c1a20 60%, #17151a);
            box-shadow: 0 0 0 1px #050406, inset 0 1px 0 rgba(255, 255, 255, 0.14), inset 0 -2px 0 rgba(0, 0, 0, 0.5), 0 16px 34px rgba(0, 0, 0, 0.65) !important; }
        #desktop > #nb-vwin::before, #desktop > #nb-vwin::after { display: none !important; }
        #desktop > #nb-vwin > .window-header { background: none !important; border: 0 !important; padding: 8px 4px 7px 14px !important; gap: 8px; min-height: 0; }
        #desktop > #nb-vwin > .window-header::before { content: '' !important; display: block !important; position: static !important; flex: 0 0 auto; width: 6px !important; height: 6px !important; border-radius: 50%; animation: none !important; order: -1;
            background: radial-gradient(circle at 40% 35%, #fff, #4dff9a 50%) !important; box-shadow: 0 0 5px #4dff9a !important; opacity: 1 !important; }
        #desktop > #nb-vwin > .window-header::after { display: none !important; }
        #desktop > #nb-vwin > .window-header > span { flex: 1 1 auto; min-width: 0; padding: 3px 10px; border-radius: 3px; background: #140d05; font: 11px 'DotGothic16', monospace !important; letter-spacing: 2px; color: #ffb547 !important;
            text-shadow: 0 0 6px rgba(255, 170, 60, 0.6) !important; box-shadow: inset 0 0 0 2px #050406, inset 0 3px 8px #000, 0 1px 0 rgba(255, 255, 255, 0.08); animation: none !important; }
        #desktop > #nb-vwin > .window-header > span b { color: #ffd38a !important; font-weight: normal; }
        #desktop > #nb-vwin .win-btns { display: flex; gap: 5px; }
        #desktop > #nb-vwin .win-btns button { width: 22px; height: 20px; padding: 0; border: 0 !important; border-radius: 3px; color: #cfc7d6 !important; text-shadow: none !important;
            background: linear-gradient(#3e3a45, #26232b) !important; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 2px 0 #0a090c, 0 0 0 1px #050406 !important; }
        #desktop > #nb-vwin .win-btns button:hover { color: #fff !important; } #desktop > #nb-vwin .win-btns button:active { transform: translateY(2px); box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.6), 0 0 0 1px #050406 !important; }
        #nb-vwin .nb-vwb { background: #0b0a0d; border-radius: 4px; padding: 7px 7px 38px; box-shadow: inset 0 0 0 1px #050406, inset 0 3px 12px #000, 0 1px 0 rgba(255, 255, 255, 0.08); }
        #nb-vwin .nb-vwb > .nb-vis { overflow: visible; border-radius: 2px; background: #000; }
        .nb-vis::after { content: ''; position: absolute; inset: 0; z-index: 1; pointer-events: none; border-radius: inherit;
            box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.9), inset 0 0 22px rgba(0, 0, 0, 0.6);
            background: linear-gradient(160deg, rgba(255, 255, 255, 0.05), transparent 30%); }
        #nb-vwin .nb-vis:not(.fs):not(:fullscreen) .nb-vm { left: 0; right: 150px; top: calc(100% + 8px); bottom: auto; max-width: none; flex-wrap: nowrap; gap: 2px; padding: 0 1px; }
        #nb-vwin .nb-vis:not(.fs):not(:fullscreen) .nb-vr { right: 0; top: calc(100% + 8px); bottom: auto; }
        #nb-vwin .nb-vis:not(.fs):not(:fullscreen) .nb-vm button { flex: 1 1 0; min-width: 0; padding: 0; overflow: hidden; font-size: 10px; letter-spacing: -1px; }
        #nb-vwin .nb-vm button, #nb-vwin .nb-vbtn, #win-noisebox\\.exe .nb-vm button, #win-noisebox\\.exe .nb-vbtn { flex: 0 0 auto; min-width: 22px; height: 22px; padding: 0 6px; border: 0; border-radius: 3px; font: 11px/22px 'DotGothic16', monospace; color: #cfc7d6;
            background: linear-gradient(#3e3a45, #26232b); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 2px 0 #0a090c, 0 0 0 1px #050406; }
        #nb-vwin .nb-vm button:hover, #nb-vwin .nb-vbtn:hover, #win-noisebox\\.exe .nb-vm button:hover, #win-noisebox\\.exe .nb-vbtn:hover { color: #fff; }
        #nb-vwin .nb-vm button:active, #nb-vwin .nb-vbtn:active, #win-noisebox\\.exe .nb-vm button:active, #win-noisebox\\.exe .nb-vbtn:active { transform: translateY(2px); box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.6), 0 0 0 1px #050406; }
        #nb-vwin .nb-vm button.on, #nb-vwin .nb-vbtn.on, #win-noisebox\\.exe .nb-vm button.on, #win-noisebox\\.exe .nb-vbtn.on { color: #ffb547; text-shadow: 0 0 5px rgba(255, 170, 60, 0.6);
            background: linear-gradient(#2a2730, #1d1b21); box-shadow: inset 0 2px 0 var(--neon-secondary), inset 0 3px 6px rgba(0, 0, 0, 0.5), 0 0 0 1px #050406; }
        #win-noisebox\\.exe .nb-left .nb-vis:not(.h2):not(.fs) .nb-vm button, #win-noisebox\\.exe .nb-left .nb-vis:not(.h2):not(.fs) .nb-vbtn { min-width: 17px; height: 17px; padding: 0 3px; font-size: 9px; line-height: 17px; }
        #win-noisebox\\.exe .nb-vis:not(.fs):not(:fullscreen) { border: 0; border-radius: 3px; box-shadow: 0 0 0 4px #141217, 0 0 0 5px #050406, 0 1px 0 5px rgba(255, 255, 255, 0.07); }
        #win-noisebox\\.exe .nb-left .nb-vis:not(.h2):not(.fs) { margin: 5px; width: calc(100% - 10px); }
        .nb-vgone { border: 0 !important; border-radius: 3px; background: #0b0a0d !important; color: #ffb547 !important; font-family: 'DotGothic16', monospace; text-shadow: 0 0 6px rgba(255, 170, 60, 0.45); opacity: 1 !important;
            box-shadow: inset 0 0 0 1px #050406, inset 0 3px 12px #000, 0 0 0 4px #141217, 0 0 0 5px #050406; margin: 5px; }
    `;
    document.head.appendChild(css);
})();
