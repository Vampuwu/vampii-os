// copier.exe. makes everything worse, thats the point
window.os = window.os || {};

(function () {
    const T = (k, d) => (typeof window.T === 'function' ? window.T(k, d) : d);
    const $ = id => document.getElementById(id);
    const KEY = 'vmp_copier';
    // a4 lying sideways on the glass, like you actually put it
    const PW = 594, PH = 420;
    const ZOOMS = [50, 71, 100, 141, 200];
    const FX = [['neg', 'ネガ', 'NEG', 'negative'], ['flip', '鏡像', 'FLIP', 'mirror'], ['dots', '網点', 'DOTS', 'halftone dots'], ['tile', '4面', '4UP', 'four on one sheet']];
    const mk = (w, h) => { let c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    const rnd = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const sfx = (n, o) => { if (os.sfx) os.sfx(n, o); };

    let M = { paper: 25, toner: 100, made: 0 };
    try { Object.assign(M, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
    const keep = () => { try { localStorage.setItem(KEY, JSON.stringify(M)); } catch (e) {} };
    let S = { n: 1, dark: 2, zoom: 2, colour: false, fx: { neg: false, flip: false, dots: false, tile: false }, lid: false, busy: false, stop: false, jam: null, door: false, item: null, out: [], view: -1, msg: '' };

    function fit(c, kind, name) {
        let k = Math.min(PW / c.width, PH / c.height, 1.6), w = c.width * k, h = c.height * k;
        // paper goes in the corner by the arrow
        return { c, kind: 'paper', name, x: 3, y: 3, w: Math.min(w, PW - 3), h: Math.min(h, PH - 3), gen: 0 };
    }
    function place(it) { S.item = it; S.view = -1; sfx('copyLid'); paintGlass(); say(it ? T('copyPut', 'ガラスに置いた // its on the glass') : T('copyOff', 'どけた // took it off')); }
    function fromImg(src, name) { let c = mk(src.naturalWidth || src.width, src.naturalHeight || src.height); c.getContext('2d').drawImage(src, 0, 0); place(fit(c, 'paper', name)); }
    function fromFile(f) {
        if (!f || !/^image\//.test(f.type)) return;
        let u = URL.createObjectURL(f), im = new Image();
        im.onload = () => { fromImg(im, f.name.replace(/\.[a-z0-9]+$/i, '')); URL.revokeObjectURL(u); };
        im.onerror = () => { URL.revokeObjectURL(u); say(T('copyBad', 'それ無理 // cant copy that one')); };
        im.src = u;
    }
    function fromPaint() {
        let st = os.paintState;
        if (!$('win-paint.exe') || !os.paintCompose || !st || !st.W) { say(T('copyNoPaint', 'お絵かき開いてない // paint isnt open')); return; }
        let c = mk(st.W, st.H), x = c.getContext('2d');
        x.fillStyle = st.paper ? st.bgColor : '#fff'; x.fillRect(0, 0, st.W, st.H);
        try { os.paintCompose(x, false); } catch (e) {}
        place(fit(c, 'paper', T('copyPaintName', 'お絵かき // painting')));
    }

    function dirt(x) {
        let R = rnd(4444);
        x.fillStyle = '#000';
        for (let i = 0; i < 7; i++) { let px = R() * PW, py = R() * PH, r = 0.6 + R() * 1.6; x.beginPath(); x.ellipse(px, py, r, r * (0.6 + R() * 0.8), R() * 3, 0, 7); x.fill(); }
        x.strokeStyle = 'rgba(0,0,0,0.8)'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(468, 360); x.bezierCurveTo(490, 330, 450, 320, 480, 295); x.bezierCurveTo(500, 282, 494, 270, 502, 262); x.stroke();
    }
    function copy(o) {
        let c = mk(PW, PH), x = c.getContext('2d'), R = rnd(o.seed), it = o.item, z = ZOOMS[o.zoom] / 100;
        x.fillStyle = o.lid ? '#fff' : '#000'; x.fillRect(0, 0, PW, PH);
        x.save(); x.scale(z, z);
        const fx = o.fx || {}, rot = (R() - 0.5) * 0.025;
        if (it) (fx.tile ? [[0, 0], [1, 0], [0, 1], [1, 1]] : [null]).forEach(q => {
            x.save();
            if (q) { x.translate(q[0] * PW / 2 / z, q[1] * PH / 2 / z); x.scale(0.5, 0.5); }
            x.translate(it.x + it.w / 2, it.y + it.h / 2); x.rotate(rot); if (fx.flip) x.scale(-1, 1); x.translate(-it.w / 2, -it.h / 2);
            if (it.kind === 'paper') { x.fillStyle = '#fff'; x.fillRect(0, 0, it.w, it.h); }
            x.drawImage(it.c, 0, 0, it.w, it.h);
            if (it.kind === 'paper' && o.lid) { x.strokeStyle = 'rgba(0,0,0,0.3)'; x.lineWidth = 1.2; x.strokeRect(0.5, 0.5, it.w - 1, it.h - 1); }
            x.restore();
        });
        if (!o.print) dirt(x);
        x.restore();
        let im = x.getImageData(0, 0, PW, PH), d = im.data, src = new Uint8ClampedArray(d);
        let col = new Float32Array(PW), Rm = rnd(777);
        for (let k = 0; k < 6; k++) { let cx = Rm() * PW | 0, w = 1 + (Rm() * 2 | 0), a = (Rm() - 0.35) * 0.3; for (let i = cx; i < Math.min(PW, cx + w); i++) col[i] += a; }
        let row = new Float32Array(PH), ph = R() * 6;
        for (let y = 0; y < PH; y++) row[y] = Math.sin(y * 0.045 + ph) * 0.02 + Math.sin(y * 0.29 + ph * 2) * 0.01;
        let t = 0.47 + (o.dark - 2) * 0.075, w = o.colour ? 0.3 : 0.11;
        let tf = o.toner <= 0 ? 0.12 : o.toner < 15 ? 0.3 + o.toner / 15 * 0.55 : 1;
        let off = o.colour ? [[(R() * 4 | 0) - 2, (R() * 3 | 0) - 1], [0, 0], [(R() * 4 | 0) - 2, (R() * 3 | 0) - 1]] : null;
        const sm0 = v => { v = (v - (t - w)) / (2 * w); return v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v); };
        const dot = (v, xx, y) => { let a = (xx + y) * 0.46, b = (xx - y) * 0.46, scr = 0.5 + 0.24 * (Math.cos(a) + Math.cos(b)); v = (v + (0.5 - t) - scr) * 5 + 0.5; return v <= 0 ? 0 : v >= 1 ? 1 : v; };
        let px = 0, py = 0;
        const sm = v => { v = fx.dots ? dot(v, px, py) : sm0(v); return fx.neg ? 1 - v : v; };
        const PAP = [246, 243, 235], INK = [24, 22, 27];
        for (let y = 0; y < PH; y++) for (let xx = 0; xx < PW; xx++) {
            let i = (y * PW + xx) * 4, n = (R() - 0.5) * (o.colour ? 0.3 : 0.24) * (fx.dots ? 0.4 : 1) + col[xx] + row[y]; px = xx; py = y;
            let mot = tf < 1 ? 0.75 + 0.25 * Math.sin(xx * 0.06 + y * 0.013) * Math.sin(y * 0.05 - xx * 0.02) : 1;
            if (!o.colour) {
                let v = sm((src[i] * 0.3 + src[i + 1] * 0.59 + src[i + 2] * 0.11) / 255 + n);
                v = 1 - (1 - v) * tf * mot;
                for (let ch = 0; ch < 3; ch++) d[i + ch] = INK[ch] + (PAP[ch] - INK[ch]) * v;
            } else {
                // cheap colour copier vibes
                let L = (src[i] * 0.3 + src[i + 1] * 0.59 + src[i + 2] * 0.11) / 255;
                for (let ch = 0; ch < 3; ch++) {
                    let sx = Math.min(PW - 1, Math.max(0, xx + off[ch][0])), sy = Math.min(PH - 1, Math.max(0, y + off[ch][1]));
                    let v = sm((src[(sy * PW + sx) * 4 + ch] / 255) * 0.6 + L * 0.4 + n);
                    v = 1 - (1 - v) * tf * mot * 0.82;
                    d[i + ch] = PAP[ch] * (0.16 + 0.84 * v);
                }
            }
            d[i + 3] = 255;
        }
        x.putImageData(im, 0, 0);
        if (R() < 0.08) { let y = R() * PH, g = x.createLinearGradient(0, y - 14, 0, y + 14); g.addColorStop(0, 'rgba(24,22,27,0)'); g.addColorStop(0.5, 'rgba(24,22,27,0.35)'); g.addColorStop(1, 'rgba(24,22,27,0)'); x.fillStyle = g; x.fillRect(R() * PW * 0.4, y - 14, PW * (0.3 + R() * 0.6), 28); }
        if (R() < 0.04) { let cx = 60 + R() * 300, cy = 60 + R() * 470, r = 38 + R() * 10; x.strokeStyle = 'rgba(120,80,40,0.28)'; for (let k = 0; k < 3; k++) { x.lineWidth = 2.5 - k * 0.7; x.beginPath(); x.arc(cx + k, cy - k, r - k * 1.5, R() * 2, R() * 2 + 5.4); x.stroke(); } }
        if (o.crumple) crumple(x, R);
        return c;
    }
    // what you get out of door B
    function crumple(x, R) {
        for (let k = 0; k < 9; k++) {
            let a = R() * Math.PI, cx = R() * PW, cy = R() * PH, dx = Math.cos(a) * 600, dy = Math.sin(a) * 600, nx = -Math.sin(a), ny = Math.cos(a);
            let g = x.createLinearGradient(cx + nx * -10, cy + ny * -10, cx + nx * 10, cy + ny * 10);
            g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.48, 'rgba(0,0,0,0.22)'); g.addColorStop(0.52, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
            x.fillStyle = g; x.beginPath(); x.moveTo(cx - dx + nx * -10, cy - dy + ny * -10); x.lineTo(cx + dx + nx * -10, cy + dy + ny * -10); x.lineTo(cx + dx + nx * 10, cy + dy + ny * 10); x.lineTo(cx - dx + nx * 10, cy - dy + ny * 10); x.fill();
        }
        // toner that never got melted on smears off
        x.save(); x.globalAlpha = 0.5; x.filter = 'blur(3px)'; x.drawImage(x.canvas, 0, PH * 0.55, PW, PH * 0.45, 6, PH * 0.55 + 10, PW, PH * 0.45); x.restore();
    }
    const nameOf = it => !it ? T('copyBlank', 'なにもない // nothing') : it.gen === 0 ? 'copy of ' + it.name : it.gen === 1 ? 'copy of a copy of ' + it.name : 'copy (x' + (it.gen + 1) + ') of ' + it.name;

    function say(m) { S.msg = m; lcd(); }
    function lcd() {
        let root = $('cp-root'); if (!root) return;
        let b = root.querySelector('.cp-lcd b'), s = root.querySelector('.cp-lcd span');
        let m = S.msg || (S.jam ? T('copyJam', '紙づまり // PAPER JAM → ドアB / DOOR B') : M.paper <= 0 ? T('copyNoPaper', '用紙切れ // OUT OF PAPER') : S.lid ? T('copyLid', 'ふた開いてるよ // LID IS OPEN') : !S.item ? T('copyEmpty', 'ガラス空っぽ // GLASS IS EMPTY') : T('copyReady', 'コピーできます // READY'));
        b.textContent = m;
        s.textContent = S.n + '枚 · ' + T('copyDarkShort', '濃度') + ' ' + (S.dark + 1) + ' · ' + ZOOMS[S.zoom] + '% · ' + (S.colour ? 'カラー COL' : '白黒 B/W') + FX.filter(f => S.fx[f[0]]).map(f => ' · ' + f[2]).join('') + (M.toner < 15 ? ' · ' + T('copyTonerLow', 'トナー少 TONER LOW') : '');
        root.querySelector('.cp-n').textContent = S.n;
        root.querySelectorAll('.cp-leds i').forEach((e, i) => e.classList.toggle('on', i <= S.dark));
        root.querySelector('[data-a="z"]').textContent = ZOOMS[S.zoom] + '%';
        root.querySelector('[data-a="col"]').classList.toggle('on', S.colour);
        root.querySelectorAll('[data-fx]').forEach(e => e.classList.toggle('on', !!S.fx[e.dataset.fx]));
        root.querySelector('.cp-paper em').textContent = M.paper; root.querySelector('.cpm-gauge i').style.width = Math.max(0, M.paper) / 25 * 100 + '%';
        root.classList.toggle('jam', !!S.jam); root.classList.toggle('lid', S.lid); root.classList.toggle('busy', S.busy); root.classList.toggle('door', S.door);
        root.classList.toggle('empty', M.paper <= 0); root.classList.toggle('low', M.toner < 15);
    }
    async function go() {
        if (S.busy) return;
        if (S.jam) { sfx('err'); say(T('copyJam', '紙づまり // PAPER JAM → ドアB / DOOR B')); return; }
        if (M.paper <= 0) { sfx('err'); say(T('copyNoPaper', '用紙切れ // OUT OF PAPER')); return; }
        S.busy = true; S.stop = false;
        let root = $('cp-root');
        for (let k = 1; k <= S.n; k++) {
            if (S.stop || !$('cp-root')) break;
            if (M.paper <= 0) { S.msg = ''; break; }
            say(T('copyGoing', 'コピー中 // COPYING') + ' ' + k + '/' + S.n);
            sfx('copyRun');
            root.classList.remove('scan'); void root.offsetWidth; root.classList.add('scan');
            if (S.lid) setTimeout(() => say(T('copyBright', 'まぶしっ // OW MY EYES')), 300);
            await wait(1450);
            let o = { item: S.item, lid: !S.lid, dark: S.dark, zoom: S.zoom, colour: S.colour, fx: Object.assign({}, S.fx), toner: M.toner, seed: (Math.random() * 1e9) | 0 };
            // it jams. not on your first go tho
            if (M.made > 2 && Math.random() < 0.07) {
                o.crumple = true; S.jam = { c: copy(o), name: nameOf(S.item), gen: S.item ? S.item.gen + 1 : 0 };
                M.paper--; keep(); sfx('copyJam'); S.msg = ''; root.classList.remove('scan'); break;
            }
            let c = copy(o);
            M.paper--; M.toner = Math.max(0, M.toner - 1 - Math.random() * 1.5); M.made++; keep();
            S.out.unshift({ c, name: nameOf(S.item), gen: S.item ? S.item.gen + 1 : 0 }); S.out = S.out.slice(0, 30);
            stack(true);
            await wait(450);
        }
        S.busy = false; S.msg = ''; if ($('cp-root')) { $('cp-root').classList.remove('scan'); lcd(); }
    }
    // paint sends stuff here. it prints exactly as well as it copies
    async function print(c, name) {
        if (S.busy) { say(T('copyBusy', 'いま忙しい // busy, try again in a sec')); return false; }
        if (S.jam) { sfx('err'); say(T('copyJam', '紙づまり // PAPER JAM → ドアB / DOOR B')); return false; }
        if (M.paper <= 0) { sfx('err'); say(T('copyNoPaper', '用紙切れ // OUT OF PAPER')); return false; }
        S.busy = true; say(T('copyPrinting', 'プリント中 // PRINTING') + ' ' + name); sfx('copyRun');
        let root = $('cp-root'); if (root) root.classList.add('printing');
        await wait(1500);
        let k = Math.min((PW - 36) / c.width, (PH - 36) / c.height), w = c.width * k, h = c.height * k;
        let o = { item: { c, kind: 'paper', name, x: (PW - w) / 2, y: (PH - h) / 2, w, h, gen: 0 }, lid: true, dark: 2, zoom: 2, colour: true, fx: Object.assign({}, S.fx), toner: M.toner, seed: (Math.random() * 1e9) | 0, print: true };
        if (M.made > 2 && Math.random() < 0.07) { o.crumple = true; S.jam = { c: copy(o), name: 'print of ' + name, gen: 0 }; M.paper--; keep(); sfx('copyJam'); }
        else { S.out.unshift({ c: copy(o), name: 'print of ' + name, gen: 0 }); S.out = S.out.slice(0, 30); M.paper--; M.toner = Math.max(0, M.toner - 2 - Math.random() * 2); M.made++; keep(); stack(true); }
        S.busy = false; S.msg = ''; if ($('cp-root')) { $('cp-root').classList.remove('printing'); lcd(); }
        return true;
    }
    function door() {
        if (S.busy) return;
        if (!S.door) { S.door = true; sfx('copyLid'); say(S.jam ? T('copyPull', 'ひっぱって // PULL IT OUT') : T('copyNoJam', 'なにもない // nothing in there')); if (!S.jam) setTimeout(() => { S.door = false; S.msg = ''; lcd(); }, 1200); return; }
        if (S.jam) { S.out.unshift(S.jam); S.jam = null; stack(true); sfx('paperOpen'); }
        S.door = false; S.msg = ''; sfx('copyLid'); lcd();
    }
    function drawer() {
        if (S.busy) return;
        let root = $('cp-root'); root.classList.remove('fill'); void root.offsetWidth; root.classList.add('fill');
        sfx('drawer');
        if (M.paper >= 25) { say(T('copyFull', 'まだある // still got paper')); return; }
        M.paper = 25; keep(); say(T('copyFilled', '用紙補給 // PAPER IN'));
    }
    function shake() {
        if (S.busy) return;
        let w = $('win-copier.exe'); if (w) { w.classList.remove('cp-shake'); void w.offsetWidth; w.classList.add('cp-shake'); }
        sfx('binIn');
        // shaking it gets a bit more out. never all of it
        M.toner = Math.min(100, M.toner + 30); keep();
        say(T('copyShook', 'トナー振った // shook the toner. theres a bit more'));
    }

    function paintGlass() {
        let root = $('cp-root'); if (!root) return;
        let g = root.querySelector('.cp-item'), it = S.item;
        if (!it) { g.hidden = true; lcd(); return; }
        g.hidden = false;
        let k = Math.min(1, 400 / it.w), c = g;
        c.width = Math.round(it.w * k * 2); c.height = Math.round(it.h * k * 2);
        let x = c.getContext('2d');
        if (it.kind === 'paper') { x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); }
        x.drawImage(it.c, 0, 0, c.width, c.height);
        Object.assign(g.style, { left: it.x / PW * 100 + '%', top: it.y / PH * 100 + '%', width: it.w / PW * 100 + '%', height: it.h / PH * 100 + '%' });
        g.classList.toggle('paper', it.kind === 'paper');
        lcd();
    }
    function stack(fresh) {
        let root = $('cp-root'); if (!root) return;
        let st = root.querySelector('.cp-stack');
        st.innerHTML = S.out.slice(0, 4).reverse().map((o, i, a) => `<canvas class="cp-sheet${fresh && i === a.length - 1 ? ' new' : ''}" style="--r:${((S.out.length - (a.length - 1 - i)) * 37 % 9) - 4}deg"></canvas>`).join('') + (S.out.length ? `<b>${S.out.length}</b>` : '');
        let cs = st.querySelectorAll('canvas');
        S.out.slice(0, 4).reverse().forEach((o, i) => { let c = cs[i]; c.width = 119; c.height = 84; c.getContext('2d').drawImage(o.c, 0, 0, 119, 84); });
        lcd();
    }
    function view(i) {
        let root = $('cp-root'), v = root.querySelector('.cp-view');
        S.view = i;
        if (i < 0 || !S.out[i]) { v.hidden = true; S.view = -1; return; }
        let o = S.out[i], c = v.querySelector('canvas');
        c.width = PW; c.height = PH; c.getContext('2d').drawImage(o.c, 0, 0);
        v.querySelector('.cp-vname').textContent = o.name + '  ·  ' + (i + 1) + '/' + S.out.length;
        v.hidden = false;
    }
    function viewDo(a) {
        let o = S.out[S.view]; if (!o) return;
        if (a === 'save') {
            if (!os.files) return;
            o.c.toBlob(b => { if (!b) return; os.files.put({ app: 'copier', kind: 'img', name: o.name, thumb: os.files.thumb(o.c, 160), w: PW, h: PH, type: 'image/png', blob: b }).then(() => os.files.told(o.name), () => {}); }, 'image/png');
        } else if (a === 'dl') {
            o.c.toBlob(b => { if (!b) return; let u = URL.createObjectURL(b), l = document.createElement('a'); l.href = u; l.download = o.name.replace(/[\\/:*?"<>|]+/g, '_') + '.png'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); }, 'image/png');
        } else if (a === 'again') {
            let it = { c: o.c, kind: 'paper', name: o.name.replace(/^copy( \(x\d+\))?( of a copy)? of /, ''), x: 2, y: 2, w: PW - 4, h: PH - 4, gen: o.gen };
            view(-1); place(it);
        } else if (a === 'bin') {
            S.out.splice(S.view, 1); sfx('noteDel'); stack(); view(Math.min(S.view, S.out.length - 1));
        } else if (a === 'prev' || a === 'next') view((S.view + (a === 'next' ? 1 : -1) + S.out.length) % S.out.length);
    }

    function wire() {
        let root = $('cp-root'); if (!root || root.dataset.on) return; root.dataset.on = '1';
        root.innerHTML = `<div class="cpm">
            <div class="cpm-out" data-a="tray" title="${T('copyTray', '出てきたやつ // what came out')}"><i class="cpm-stop"></i><div class="cp-stack"></div></div>
            <div class="cpm-bypass"><span>手差し BYPASS</span>
                <button type="button" data-src="paint">🎨 絵 PAINT</button><button type="button" data-src="file">📂 FILE</button><button type="button" data-src="off">✕ ${T('copyTakeOff', 'どける OFF')}</button>
                <input type="file" accept="image/*" hidden></div>
            <div class="cpm-box">
                <div class="cpm-hinge"></div>
                <div class="cpm-topface">
                    <div class="cp-bed"><div class="cp-glass"><i class="cp-ruler"></i><i class="cp-arrow"></i><canvas class="cp-item" hidden></canvas><i class="cp-light"></i></div>
                        <div class="cp-lid" data-a="lid"><span>VAMPII COPY</span><i class="cp-hnd"></i><i class="cpm-memo">叩かないで<br>dont hit it</i></div></div>
                    <div class="cp-panel">
                        <div class="cp-lcd"><b></b><span></span></div>
                        <div class="cp-row"><label>枚数</label><button type="button" data-a="n-">−</button><output class="cp-n">1</output><button type="button" data-a="n+">+</button></div>
                        <div class="cp-row"><label>濃度</label><button type="button" data-a="d-">◀</button><div class="cp-leds">${'<i></i>'.repeat(5)}</div><button type="button" data-a="d+">▶</button></div>
                        <div class="cp-row"><button type="button" data-a="z" class="cp-key">100%</button><button type="button" data-a="col" class="cp-key cp-col">カラー</button></div>
                        <div class="cp-row cp-fx">${FX.map(f => `<button type="button" data-a="fx" data-fx="${f[0]}" class="cp-key" title="${f[1]} // ${f[3]}">${f[1]}</button>`).join('')}</div>
                        <div class="cp-row cp-big"><button type="button" data-a="stop" class="cp-stop" aria-label="stop">C</button><button type="button" data-a="go" class="cp-go"><small>スタート</small>START</button></div>
                    </div>
                </div>
                <div class="cpm-front">
                    <div class="cpm-strip"><span class="cpm-badge">VAMPII COPY</span><i class="cpm-vent"></i><i class="cpm-hv">⚡ 高電圧 HIGH VOLTAGE</i>
                        <button type="button" class="cp-toner" data-a="shake"><i></i>トナー TONER</button>
                        <button type="button" class="cp-doorb" data-a="door"><b>B</b><i class="cp-jamsheet"></i></button></div>
                    <button type="button" class="cp-paper cpm-drawer" data-a="drawer"><span>1</span><span class="cpm-size">A4 ▭</span><i class="cpm-gauge"><i></i></i><i class="cpm-handle"></i><em>25</em></button>
                    <div class="cpm-drawer d2"><span>2</span><span class="cpm-size">A3 ▭</span><small>${T('copyNoA3', '用紙なし // EMPTY. always')}</small><i class="cpm-handle"></i></div>
                </div>
                <i class="cpm-base"></i>
            </div>
            <i class="cpm-wheel l"></i><i class="cpm-wheel r"></i><i class="cpm-under"></i>
            <svg class="cpm-cord" viewBox="0 0 90 90" aria-hidden="true"><path class="c0" d="M0,8 C34,8 20,84 50,86 C66,87 76,84 78,76"/><path class="c1" d="M0,8 C34,8 20,84 50,86 C66,87 76,84 78,76"/><path class="c2" d="M0,8 C34,8 20,84 50,86 C66,87 76,84 78,76"/></svg>
            <div class="cpm-sign"><b>故障中</b>OUT OF ORDER</div>
        </div>
        <div class="cp-view" hidden><canvas></canvas><p class="cp-vname"></p>
            <div class="cp-vbtns"><button type="button" data-v="prev">◀</button><button type="button" data-v="save">${T('copySave', '保存 // SAVE')}</button><button type="button" data-v="dl">↓ PNG</button><button type="button" data-v="again">${T('copyAgain', 'もう一回コピー // COPY THIS')}</button><button type="button" data-v="bin">${T('copyBin', '捨てる // BIN')}</button><button type="button" data-v="next">▶</button><button type="button" data-v="x">✕</button></div></div>`;
        let fi = root.querySelector('input[type=file]');
        fi.onchange = () => { fromFile(fi.files[0]); fi.value = ''; };
        root.addEventListener('click', e => {
            let s = e.target.closest('[data-src]'), a = e.target.closest('[data-a]'), v = e.target.closest('[data-v]');
            if (v) { if (v.dataset.v === 'x') view(-1); else viewDo(v.dataset.v); return; }
            if (s) { let k = s.dataset.src; if (k === 'paint') fromPaint(); else if (k === 'file') fi.click(); else place(null); return; }
            if (!a) return;
            let k = a.dataset.a;
            if (k === 'lid') { if (S.busy) return; S.lid = !S.lid; sfx('copyLid'); S.msg = ''; lcd(); }
            else if (k === 'go') go();
            else if (k === 'stop') { if (S.busy) S.stop = true; else { S.n = 1; S.msg = ''; } sfx('copyBeep'); lcd(); }
            else if (k === 'n-' || k === 'n+') { S.n = Math.max(1, Math.min(9, S.n + (k === 'n+' ? 1 : -1))); sfx('copyBeep'); S.msg = ''; lcd(); }
            else if (k === 'd-' || k === 'd+') { S.dark = Math.max(0, Math.min(4, S.dark + (k === 'd+' ? 1 : -1))); sfx('copyBeep'); S.msg = ''; lcd(); }
            else if (k === 'z') { S.zoom = (S.zoom + 1) % ZOOMS.length; sfx('copyBeep'); S.msg = ''; lcd(); }
            else if (k === 'col') { S.colour = !S.colour; sfx('copyBeep'); S.msg = ''; lcd(); }
            else if (k === 'fx') { let f = a.dataset.fx; S.fx[f] = !S.fx[f]; sfx('copyBeep'); S.msg = ''; lcd(); }
            else if (k === 'tray') { if (S.out.length) view(0); }
            else if (k === 'door') door();
            else if (k === 'drawer') drawer();
            else if (k === 'shake') shake();
        });
        // drag whatevers on the glass about. only with the lid up obviously
        let gl = root.querySelector('.cp-glass'), drag = null;
        gl.addEventListener('pointerdown', e => { if (!S.lid || !S.item || S.busy || !e.target.classList.contains('cp-item')) return; e.preventDefault(); gl.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY, ix: S.item.x, iy: S.item.y, k: PW / gl.getBoundingClientRect().width }; });
        gl.addEventListener('pointermove', e => { if (!drag) return; S.item.x = Math.max(-S.item.w * 0.8, Math.min(PW * 0.95, drag.ix + (e.clientX - drag.x) * drag.k)); S.item.y = Math.max(-S.item.h * 0.8, Math.min(PH * 0.95, drag.iy + (e.clientY - drag.y) * drag.k)); paintGlass(); });
        ['pointerup', 'pointercancel'].forEach(ev => gl.addEventListener(ev, () => { drag = null; }));
        // drop a pic anywhere on it
        root.addEventListener('dragover', e => e.preventDefault());
        root.addEventListener('drop', e => { e.preventDefault(); let f = e.dataTransfer && e.dataTransfer.files[0]; if (f) fromFile(f); });
        stack(); paintGlass(); lcd();
    }
    document.addEventListener('paste', e => {
        let w = $('win-copier.exe'); if (!w || !w.classList.contains('is-active')) return;
        let f = [...(e.clipboardData ? e.clipboardData.items : [])].find(i => i.type.startsWith('image/'));
        if (f) { e.preventDefault(); fromFile(f.getAsFile()); }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && S.view >= 0 && $('cp-root')) view(-1); });

    // plug + sign have to happen before the real close / min fires
    function hijack(w) {
        w.addEventListener('click', e => {
            let k = e.target.closest('.kill-btn, .min-btn'); if (!k) return;
            e.stopPropagation(); e.preventDefault();
            if (k.dataset.going) return; k.dataset.going = '1';
            let rt = $('cp-root'), close = k.classList.contains('kill-btn');
            if (close) { k.classList.add('out'); if (rt) rt.classList.add('off'); sfx('copyUnplug'); S.stop = true; }
            else { if (rt) rt.classList.add('hung'); sfx('copyLid'); }
            setTimeout(() => { delete k.dataset.going; if (k.onclick) k.onclick(); }, close ? 650 : 800);
        }, true);
    }
    function roomy(w) {
        let k = parseFloat(getComputedStyle(w).scale) || 1; if (k === 1 || os.isPhone()) return;
        let ww = w.offsetWidth * k, ics = [...document.querySelectorAll('.desktop-icons .icon-wrap')].filter(i => i.offsetParent !== null), edge = ics.length ? Math.max(...ics.map(i => i.getBoundingClientRect().right)) + 12 : 0;
        let x = Math.max(innerWidth / 2 - ww / 2, edge);
        w.style.left = Math.round(Math.max(10, Math.min(x, innerWidth - ww - 10))) + 'px';
    }
    function inject() {
        let tpl = document.createElement('template'); tpl.id = 'copier.exe';
        tpl.innerHTML = '<div id="cp-root" class="readable-ui"></div>';
        document.body.appendChild(tpl);
        let base = os.summon.bind(os);
        os.summon = function (id) {
            let existed = $('win-' + id), r = base.apply(os, arguments);
            if (id === 'copier.exe' && !existed) { let w = $('win-copier.exe'); if (w) { w.style.maxWidth = '640px'; w.querySelector('.window-header').ondblclick = null; hijack(w); roomy(w); } wire(); }
            else if (id === 'copier.exe') { let rt = $('cp-root'); if (rt && rt.classList.contains('hung')) { rt.classList.remove('hung'); say(T('copyFixed', '直った // fixed. apparently')); } }
            return r;
        };
    }

    let css = document.createElement('style');
    const E = '#desktop > #win-copier\\.exe';
    css.textContent = `
        /* no window. its a copier */
        ${E} { background: none !important; border: 0 !important; box-shadow: none !important; overflow: visible !important; }
        ${E}::before, ${E}::after, ${E} .wglow, ${E} .wbloom { display: none !important; }
        ${E} .window-header { position: absolute !important; z-index: 4; left: 102px; right: 102px; top: 1px; height: 24px; padding: 0 !important; overflow: visible !important; background: none !important; border: 0 !important; box-shadow: none !important; border-radius: 0 !important; }
        ${E} .window-header::before, ${E} .window-header::after, ${E} .win-ic, ${E} .window-header > span:first-child, ${E} .max-btn { display: none !important; }
        ${E} .window-body { padding: 0 !important; background: none !important; box-shadow: none !important; overflow: visible !important; max-height: none !important; }
        /* close = pull the plug out the wall. minimise = hang the out of order sign on it */
        ${E} .win-btns { position: static; }
        ${E} .win-btn, ${E} .kill-btn { position: absolute !important; margin: 0 !important; padding: 0 !important; border: 0 !important; text-shadow: none !important; transition: transform 0.15s !important; }
        ${E} .kill-btn { right: -86px; top: 318px; width: 24px !important; height: 34px !important; border-radius: 3px !important; background: linear-gradient(#f1eee8, #d9d5cc) !important; box-shadow: 0 0 0 1px #9c988f, 0 3px 5px rgba(0,0,0,0.5) !important; }
        ${E} .kill-btn::before { position: absolute; left: 5px; top: 9px; width: 14px !important; height: 16px !important; border-radius: 3px; -webkit-mask: none !important; mask: none !important; background: linear-gradient(90deg, #2b2a2c, #4a484c 50%, #2b2a2c) !important; box-shadow: 0 2px 3px rgba(0,0,0,0.5); opacity: 1 !important; transition: transform 0.25s cubic-bezier(.3, 1.6, .5, 1); }
        ${E} .kill-btn::after { content: ''; position: absolute; left: 7px; top: 3px; width: 10px; height: 28px; background: radial-gradient(circle, #1a1a1a 1.4px, transparent 1.8px) 0 0 / 5px 100% no-repeat, radial-gradient(circle, #1a1a1a 1.4px, transparent 1.8px) 5px 0 / 5px 100% no-repeat; opacity: 0; }
        ${E} .kill-btn:hover::before { transform: translateX(-3px); }
        ${E} .kill-btn.out::before { transform: translate(-30px, 14px) rotate(-40deg); }
        ${E} .kill-btn.out::after { opacity: 1; }
        ${E} .min-btn { left: -98px; top: 300px; width: 74px !important; height: 44px !important; border-radius: 1px !important; transform: rotate(-7deg); background: linear-gradient(rgba(240,232,190,0.75), rgba(240,232,190,0.75)) 50% 0 / 30px 8px no-repeat, #f8f6f0 !important; box-shadow: 0 0 0 1px #d1ccc1, 2px 4px 6px rgba(0,0,0,0.5) !important; }
        ${E} .min-btn::before { display: none !important; }
        ${E} .min-btn::after { content: '故障中\\A OUT OF ORDER'; white-space: pre; position: absolute; inset: 9px 0 0; text-align: center; font: bold 9px/1.3 Arial, 'Hiragino Sans', sans-serif; color: #c4262c; }
        ${E} .min-btn:hover { transform: rotate(-3deg) translateY(-2px); }
        #cp-root { position: relative; user-select: none; padding: 0 96px 14px; font: 10px Arial, 'Hiragino Sans', 'Yu Gothic', sans-serif; color: #4c4a46; }
        .cpm { position: relative; }
        .cpm-box { position: relative; z-index: 2; border-radius: 9px 9px 4px 4px; border: 1px solid #77736b;
            background: radial-gradient(60% 40% at 80% 20%, rgba(214,190,120,0.16), transparent), radial-gradient(50% 50% at 15% 70%, rgba(214,190,120,0.12), transparent), linear-gradient(#e8e5de, #d8d4cb 70%, #cbc6bc);
            box-shadow: inset 0 1px 0 #fff, inset 0 -2px 0 rgba(0,0,0,0.12), 0 14px 26px rgba(0,0,0,0.55); }
        .cpm-hinge { height: 26px; border-radius: 8px 8px 0 0; background: linear-gradient(#d6d2c9, #e3e0d9); box-shadow: inset 0 -1px 0 rgba(0,0,0,0.08); position: relative; }
        .cpm-hinge::before, .cpm-hinge::after { content: ''; position: absolute; top: 9px; width: 34px; height: 9px; border-radius: 2px; background: linear-gradient(#a9a59c, #8a867e); box-shadow: inset 0 1px 0 rgba(255,255,255,0.4); }
        .cpm-hinge::before { left: 40px; } .cpm-hinge::after { left: 170px; }
        .cpm-topface { display: grid; grid-template-columns: 1fr 150px; gap: 12px; padding: 0 12px 12px; }
        .cp-bed { position: relative; aspect-ratio: 594 / 420; border-radius: 3px; background: linear-gradient(#a7a39a, #96928a); box-shadow: inset 0 1px 2px rgba(0,0,0,0.35); }
        .cp-glass { position: absolute; inset: 5px; overflow: hidden; background: linear-gradient(160deg, #3c4a46, #26302e 60%, #313d3a); box-shadow: inset 0 0 0 1px rgba(0,0,0,0.5); touch-action: none; }
        .cp-glass::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(125deg, rgba(255,255,255,0.12), transparent 35%, transparent 70%, rgba(255,255,255,0.05)); }
        .cp-ruler { position: absolute; left: 0; right: 0; top: 0; height: 5px; z-index: 1; background: repeating-linear-gradient(90deg, rgba(230,226,218,0.7) 0 1px, transparent 1px 6px), rgba(0,0,0,0.25); }
        .cp-arrow { position: absolute; left: 0; top: 0; width: 13px; height: 13px; background: linear-gradient(135deg, #e8c74a 50%, transparent 50%); z-index: 2; }
        .cp-item { position: absolute; z-index: 2; cursor: inherit; }
        .cp-item.paper { box-shadow: 0 1px 3px rgba(0,0,0,0.6); }
        .cp-light { position: absolute; top: -4px; bottom: -4px; left: -10px; width: 7px; z-index: 3; opacity: 0; background: linear-gradient(90deg, transparent, #eaffea, transparent); box-shadow: 0 0 18px 6px rgba(190,255,200,0.55); }
        #cp-root.scan .cp-light { animation: cpScan 1.35s ease-in-out; }
        @keyframes cpScan { 0% { left: -10px; opacity: 1; } 92% { opacity: 1; } 100% { left: 100%; opacity: 0; } }
        .cp-lid { position: absolute; inset: 0; z-index: 4; cursor: inherit; border-radius: 3px; transform-origin: 50% 0; transition: transform 0.3s cubic-bezier(.4, 1.2, .6, 1), background 0.2s;
            background: radial-gradient(18% 22% at 52% 88%, rgba(60,50,40,0.07), transparent), linear-gradient(#ece9e3, #dbd7ce); box-shadow: inset 0 1px 0 #fff, inset 0 -1px 0 rgba(0,0,0,0.12), 0 2px 3px rgba(0,0,0,0.25); }
        .cp-lid span { position: absolute; left: 12px; top: 10px; font: bold 10px Arial, sans-serif; letter-spacing: 3px; color: #8d96a2; }
        .cp-hnd { position: absolute; left: 36%; right: 36%; bottom: 5px; height: 7px; border-radius: 4px; background: #b9b5ac; box-shadow: inset 0 2px 2px rgba(0,0,0,0.3); }
        /* lid up = the grey foam bit. click it to shut */
        #cp-root.lid .cp-lid { transform: scaleY(0.09); background: linear-gradient(#d8d6d2, #b3b0aa); box-shadow: 0 6px 8px rgba(0,0,0,0.45); }
        #cp-root.lid .cp-lid > * { opacity: 0; }
        #cp-root.lid .cp-item { cursor: grab; }
        #cp-root.scan:not(.lid) .cp-bed { animation: cpLeak 1.35s ease-in-out; }
        @keyframes cpLeak { 40%, 70% { box-shadow: inset 0 1px 2px rgba(0,0,0,0.35), 0 0 12px rgba(190,255,200,0.6); } }
        #cp-root.scan.lid .cp-glass { animation: cpFlash 1.35s; }
        @keyframes cpFlash { 30%, 60% { filter: brightness(1.7); } }
        .cp-panel { display: flex; flex-direction: column; gap: 6px; padding: 7px; border-radius: 5px; background: linear-gradient(#56606b, #434b55); box-shadow: inset 0 1px 3px rgba(0,0,0,0.6), 0 1px 0 #fff; }
        .cp-lcd { height: 38px; padding: 3px 5px; border-radius: 2px; background: linear-gradient(#bccb80, #a6b66c); box-shadow: inset 0 1px 3px rgba(0,0,0,0.55), 0 0 0 2px #2b3138; color: #1f2a12; overflow: hidden; font-family: 'DotGothic16', monospace; }
        .cp-lcd b { display: block; font-weight: normal; font-size: 9px; line-height: 1.25; height: 23px; overflow: hidden; }
        .cp-lcd span { display: block; font-size: 8px; opacity: 0.7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        #cp-root.jam .cp-lcd b, #cp-root.empty .cp-lcd b { animation: cpBlink 0.8s steps(1) infinite; }
        @keyframes cpBlink { 50% { opacity: 0.2; } }
        .cp-row { display: flex; align-items: center; gap: 3px; }
        .cp-row label { flex: 1; font-size: 9px; color: #cfd6dd; white-space: nowrap; }
        .cp-row button { min-width: 19px; height: 17px; padding: 0 4px; cursor: inherit; border: 1px solid #2b3138; border-radius: 3px; font: bold 9px Arial, 'Hiragino Sans', sans-serif; color: #3a3f45; background: linear-gradient(#f0eee9, #c8c4bc); box-shadow: inset 0 1px 0 #fff, 0 2px 0 #2b3138; }
        .cp-row button:active { transform: translateY(2px); box-shadow: inset 0 1px 0 #fff; }
        .cp-key { flex: 1; }
        .cp-col.on { color: #fff; background: linear-gradient(90deg, #c4307a, #d6b53a, #2f9fcf); }
        .cp-n { width: 16px; text-align: center; font: 12px 'DotGothic16', monospace; color: #f0f2f4; }
        .cp-leds { display: flex; gap: 2px; } .cp-leds i { width: 5px; height: 9px; border-radius: 1px; background: #23282e; box-shadow: inset 0 0 0 1px #15191d; }
        .cp-leds i.on { background: #7dff6a; box-shadow: 0 0 4px #7dff6a; }
        .cp-big { gap: 7px; margin-top: 1px; }
        .cp-big .cp-stop { width: 28px; height: 28px; border-radius: 50%; padding: 0; font-size: 11px; color: #fff; background: linear-gradient(#e0643a, #a8361a); }
        .cp-big .cp-go { flex: 1; height: 32px; border-radius: 5px; font-size: 11px; letter-spacing: 1px; color: #0c2414; background: linear-gradient(#55d27f, #2a9a52); box-shadow: inset 0 1px 0 rgba(255,255,255,0.45), 0 3px 0 #1d2a1f; display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1; }
        .cp-big .cp-go small { font-size: 7px; opacity: 0.75; }
        #cp-root.busy .cp-go { filter: saturate(0.4) brightness(0.85); }
        .cpm-front { padding: 0 12px 10px; display: flex; flex-direction: column; gap: 6px; }
        .cpm-cord { position: absolute; z-index: 1; right: -80px; top: 268px; width: 90px; height: 90px; overflow: visible; pointer-events: none; }
        .cpm-cord path { fill: none; stroke: #2a292c; stroke-width: 4; stroke-linecap: round; }
        .cpm-sign { position: absolute; z-index: 5; left: 50%; top: 262px; width: 170px; margin-left: -85px; padding: 12px 0 10px; text-align: center; pointer-events: none; opacity: 0; transform: translateY(-40px) rotate(-10deg);
            background: linear-gradient(rgba(240,232,190,0.8), rgba(240,232,190,0.8)) 18px -2px / 34px 10px no-repeat, linear-gradient(rgba(240,232,190,0.8), rgba(240,232,190,0.8)) 118px -2px / 34px 10px no-repeat, #fbfaf6;
            box-shadow: 0 0 0 1px #d1ccc1, 3px 8px 14px rgba(0,0,0,0.45); font: bold 11px Arial, sans-serif; letter-spacing: 1px; color: #c4262c; transition: opacity 0.2s, transform 0.35s cubic-bezier(.3, 1.5, .5, 1); }
        .cpm-sign b { display: block; font-size: 26px; letter-spacing: 4px; }
        #cp-root.hung .cpm-sign { opacity: 1; transform: rotate(-3deg); }
        .cpm-memo { position: absolute; right: 14px; top: 10px; width: 62px; padding: 5px 4px; transform: rotate(4deg); font: 8px/1.3 'DotGothic16', monospace; font-style: normal; color: #5a4a20; background: linear-gradient(#fff4a8, #f6e47c); box-shadow: 1px 2px 3px rgba(0,0,0,0.25); }
        #cp-root.off .cp-lcd { background: #66704a; } #cp-root.off .cp-lcd * { opacity: 0; } #cp-root.off .cp-leds i.on { background: #23282e; box-shadow: none; } #cp-root.off .cp-go { filter: brightness(0.6) saturate(0.5); }
        #cp-root.printing .cp-lcd b { animation: cpBlink 1s steps(1) infinite; }
        .cpm-stop { position: absolute; left: 5px; top: 10px; bottom: 10px; width: 5px; border-radius: 2px; background: linear-gradient(90deg, #b3afa6, #e4e1da); box-shadow: 1px 0 2px rgba(0,0,0,0.25); }
        .cpm-front { position: relative; }
        .cpm-front::before, .cpm-front::after { content: ''; position: absolute; bottom: 4px; width: 6px; height: 6px; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #f4f2ee, #9c988f); box-shadow: inset 0 0 0 1px rgba(0,0,0,0.2); }
        .cpm-front::before { left: 4px; } .cpm-front::after { right: 4px; }

        .cpm-strip { display: flex; align-items: center; gap: 10px; height: 34px; padding: 0 2px; border-top: 1px solid rgba(0,0,0,0.12); box-shadow: inset 0 1px 0 #fff; }
        .cpm-badge { padding: 3px 8px; border-radius: 2px; font: bold 10px Arial, sans-serif; letter-spacing: 2px; color: #4d5763; background: linear-gradient(#f1f3f5, #aab1b8); box-shadow: inset 0 1px 0 #fff, 0 0 0 1px #8b9299, 0 1px 2px rgba(0,0,0,0.25); }
        .cpm-vent { flex: 1; height: 14px; background: repeating-linear-gradient(90deg, #8f8b83 0 2px, transparent 2px 6px); opacity: 0.55; border-radius: 2px; }
        .cpm-front button, .cpm-drawer { position: relative; cursor: inherit; border: 1px solid #9c988f; font: bold 9px Arial, 'Hiragino Sans', sans-serif; color: #5e5b55; background: linear-gradient(#e6e3dc, #d2cec5); box-shadow: inset 0 1px 0 #fff; }
        .cp-toner { height: 26px; padding: 0 8px 0 6px; border-radius: 3px; display: flex; align-items: center; gap: 5px; }
        .cp-toner i { width: 8px; height: 14px; border-radius: 2px; background: linear-gradient(#3a3a3e, #1e1e22); }
        #cp-root.low .cp-toner { color: #c76a14; }
        .cp-doorb { width: 34px; height: 26px; border-radius: 3px; }
        .cp-doorb b { font: bold 13px Arial, sans-serif; color: #7d7a74; }
        #cp-root.jam .cp-doorb { animation: cpDoor 0.8s steps(1) infinite; }
        @keyframes cpDoor { 50% { background: linear-gradient(#f4a347, #d07a1c); } }
        #cp-root.door .cp-doorb { transform: perspective(200px) rotateY(-50deg); transform-origin: 0 50%; }
        .cp-jamsheet { display: none; position: absolute; right: -22px; top: 2px; width: 24px; height: 20px; background: #f6f3ec; box-shadow: 0 1px 2px rgba(0,0,0,0.3); clip-path: polygon(0 10%, 30% 0, 55% 18%, 100% 5%, 85% 45%, 100% 80%, 60% 100%, 25% 85%, 0 100%); }
        #cp-root.door.jam .cp-jamsheet { display: block; }
        /* paper drawers. the 2nd one never has paper in it. never */
        .cpm-drawer { display: flex; align-items: center; gap: 10px; height: 40px; padding: 0 12px; border-radius: 3px; text-align: left; width: 100%; box-sizing: border-box; }
        .cpm-drawer > span:first-child { font-size: 12px; color: #9c988f; }
        .cpm-size { width: 36px; color: #6c7684; }
        .cpm-gauge { width: 50px; height: 7px; border-radius: 1px; background: #a9a59d; box-shadow: inset 0 1px 1px rgba(0,0,0,0.3); overflow: hidden; }
        .cpm-gauge i { display: block; height: 100%; width: 100%; background: linear-gradient(#fbf9f4, #e6e2d9); }
        .cpm-handle { position: absolute; left: 50%; top: 13px; width: 80px; height: 12px; margin-left: -40px; border-radius: 6px; background: linear-gradient(#a7a39a, #c9c5bc); box-shadow: inset 0 3px 3px rgba(0,0,0,0.35); }
        .cpm-drawer em { margin-left: auto; font-style: normal; color: #5e5b55; }
        .cpm-drawer.d2 small { margin-left: auto; font-size: 8px; color: #a09c94; }
        #cp-root.empty .cp-paper em, #cp-root.empty .cpm-size:first-of-type { color: #c76a14; }
        #cp-root.fill .cp-paper { animation: cpDrawer 0.5s; }
        @keyframes cpDrawer { 40% { transform: translateY(5px); } }
        .cpm-base { display: block; height: 10px; border-radius: 0 0 3px 3px; background: linear-gradient(#56534d, #3a3834); }
        .cpm-wheel { position: absolute; z-index: 1; bottom: -9px; width: 16px; height: 12px; border-radius: 0 0 8px 8px; background: radial-gradient(circle at 50% 30%, #3a3834, #121110); }
        .cpm-wheel.l { left: 20px; } .cpm-wheel.r { right: 20px; }
        .cpm-out { position: absolute; z-index: 1; left: -90px; top: 112px; width: 98px; height: 116px; cursor: inherit; border-radius: 4px 0 0 4px; border: 1px solid #8f8b83; border-right: 0;
            background: linear-gradient(90deg, #cfcbc2, #e2dfd8); box-shadow: inset 0 2px 4px rgba(0,0,0,0.2), -4px 6px 10px rgba(0,0,0,0.35); }
        .cp-stack { position: absolute; inset: 6px 10px 6px 6px; display: grid; place-items: center; }
        .cp-sheet { grid-area: 1 / 1; width: 62px; height: 44px; transform: rotate(var(--r, 0deg)); box-shadow: 0 1px 3px rgba(0,0,0,0.45); }
        .cp-sheet.new { animation: cpOut 0.45s cubic-bezier(.2, .8, .3, 1); }
        @keyframes cpOut { from { transform: translateX(40px) rotate(0deg); clip-path: inset(0 100% 0 0); } to { transform: rotate(var(--r, 0deg)); clip-path: inset(0 0 0 0); } }
        .cp-stack b { position: absolute; left: 2px; bottom: -2px; font-weight: bold; font-size: 9px; color: #7d7a74; }
        .cpm-bypass { position: absolute; z-index: 1; right: -90px; top: 104px; width: 96px; box-sizing: border-box; padding: 6px 6px 8px 12px; display: flex; flex-direction: column; gap: 4px; border-radius: 0 4px 4px 0; border: 1px solid #8f8b83; border-left: 0;
            background: linear-gradient(90deg, #e2dfd8, #cfcbc2); box-shadow: inset 0 2px 4px rgba(0,0,0,0.2), 4px 6px 10px rgba(0,0,0,0.35); }
        .cpm-bypass span { font: bold 8px Arial, 'Hiragino Sans', sans-serif; color: #7d7a74; }
        .cpm-bypass button { height: 20px; padding: 0 4px; cursor: inherit; text-align: left; border: 1px solid #a9a59d; border-radius: 2px; font: bold 9px Arial, 'Hiragino Sans', sans-serif; color: #4c4a46; background: #f7f5f0; box-shadow: 0 1px 0 rgba(0,0,0,0.15); }
        .cpm-bypass button:active { transform: translateY(1px); }
        .cp-shake { animation: cpShake 0.5s; }
        @keyframes cpShake { 20% { transform: translate(-4px, 1px) rotate(-1deg); } 40% { transform: translate(4px, -1px) rotate(1deg); } 60% { transform: translate(-3px, 0); } 80% { transform: translate(3px, 0); } }
        .cp-view { position: absolute; z-index: 10; inset: -10px 76px 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 12px; border-radius: 6px; background: rgba(8,6,10,0.94); }
        .cp-view[hidden] { display: none; }
        .cp-view canvas { width: 100%; height: auto; aspect-ratio: 594 / 420; box-shadow: 0 6px 18px rgba(0,0,0,0.7); }
        .cp-vname { margin: 0; font: 10px 'DotGothic16', monospace; color: #a8a29a; }
        .cp-vbtns { display: flex; flex-wrap: wrap; justify-content: center; gap: 5px; }
        .cp-vbtns button { height: 24px; padding: 0 7px; cursor: inherit; border: 1px solid #77736b; border-radius: 3px; font: 10px 'DotGothic16', monospace; color: #2f2d2a; background: linear-gradient(#ece9e3, #d2cec5); }
        .cpm-box { border-color: #000; background: radial-gradient(60% 50% at 75% 15%, rgba(255,255,255,0.05), transparent), repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0 1px, transparent 1px 4px), linear-gradient(#2f2e34, #212026 60%, #18171c); box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -2px 0 rgba(0,0,0,0.5), 0 14px 26px rgba(0,0,0,0.6); }
        .cpm-hinge { background: linear-gradient(#1b1a1f, #26252b); box-shadow: inset 0 -1px 0 rgba(0,0,0,0.6); }
        .cpm-hinge::before, .cpm-hinge::after { background: linear-gradient(#4a4950, #2c2b31); box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), 0 0 0 1px #000; }
        .cp-bed { background: linear-gradient(#141317, #0d0c10); box-shadow: inset 0 1px 3px #000, 0 0 0 1px #3a3940; }
        .cp-light { background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--neon-primary) 50%, #fff), transparent); box-shadow: 0 0 18px 6px color-mix(in srgb, var(--neon-primary) 60%, transparent); }
        @keyframes cpLeak { 40%, 70% { box-shadow: inset 0 1px 3px #000, 0 0 0 1px #3a3940, 0 0 14px color-mix(in srgb, var(--neon-primary) 70%, transparent); } }
        .cp-panel { background: linear-gradient(#141418, #0b0b0e); box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px #000, inset 0 0 0 1px rgba(255,255,255,0.04); }
        .cp-lcd { background: linear-gradient(#081014, #050a0d); color: color-mix(in srgb, var(--neon-primary) 45%, #fff); text-shadow: 0 0 5px var(--neon-primary); box-shadow: inset 0 1px 4px #000, 0 0 0 1px #2a2a30, 0 0 10px color-mix(in srgb, var(--neon-primary) 18%, transparent); background-image: repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 3px); }
        #cp-root.off .cp-lcd { background: #050708; }
        .cp-row label { color: #8b8792; }
        .cp-row button { color: #e2e0e8; background: linear-gradient(#34333a, #1f1e24); border-color: #000; box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 0 #000; }
        .cp-row button:active { box-shadow: inset 0 1px 0 rgba(255,255,255,0.12); }
        .cp-n { color: color-mix(in srgb, var(--neon-primary) 45%, #fff); text-shadow: 0 0 5px var(--neon-primary); }
        .cp-leds i.on { background: var(--neon-primary); box-shadow: 0 0 5px var(--neon-primary); }
        .cp-big .cp-go { box-shadow: inset 0 1px 0 rgba(255,255,255,0.45), 0 3px 0 #0a1a0f, 0 0 14px rgba(80,230,130,0.45); }
        .cp-big .cp-stop { box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 0 #000, 0 0 10px rgba(230,90,50,0.45); }
        .cpm-strip { border-top: 0; box-shadow: none; position: relative; }
        .cpm-strip::before { content: ''; position: absolute; left: -12px; right: -12px; top: -1px; height: 2px; background: var(--neon-primary); box-shadow: 0 0 8px 1px var(--neon-primary), 0 0 20px color-mix(in srgb, var(--neon-primary) 50%, transparent); opacity: 0.85; }
        .cpm-vent { background: repeating-linear-gradient(90deg, #0a0a0c 0 2px, transparent 2px 6px), radial-gradient(50% 120% at 50% 50%, color-mix(in srgb, var(--neon-primary) 35%, transparent), transparent); opacity: 1; }
        .cpm-hv { flex: none; padding: 2px 5px; font: bold 7px Arial, 'Hiragino Sans', sans-serif; font-style: normal; letter-spacing: 0.5px; color: #111; background: #f2c230; transform: rotate(-2deg); box-shadow: inset 0 0 0 1px #111, 0 1px 2px rgba(0,0,0,0.5); }
        .cpm-front button, .cpm-drawer { border-color: #000; color: #d9d6de; background: linear-gradient(#36353b, #232227); box-shadow: inset 0 1px 0 rgba(255,255,255,0.1); }
        .cp-doorb { border-left: 5px solid transparent !important; border-image: repeating-linear-gradient(-45deg, #f2c230 0 4px, #111 4px 8px) 5 !important; }
        .cp-doorb b { color: #d9d6de; }
        .cp-toner i { background: linear-gradient(#5a5960, #2a292f); box-shadow: 0 0 6px color-mix(in srgb, var(--neon-primary) 50%, transparent); }
        .cpm-front .cpm-drawer { background: linear-gradient(#ebe8e1, #d5d1c8); color: #4c4a46; border-color: #000; box-shadow: inset 0 1px 0 #fff, inset 0 -2px 0 rgba(0,0,0,0.1); }
        .cpm-drawer .cpm-handle { background: linear-gradient(#1a191d, #3a393f); box-shadow: inset 0 3px 3px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.6); }
        .cpm-gauge { background: #1a191d; } .cpm-gauge i { background: var(--neon-primary); box-shadow: 0 0 6px var(--neon-primary); }
        .cpm-base { background: linear-gradient(#111014, #050407); }
        .cpm-front::before, .cpm-front::after { background: radial-gradient(circle at 40% 35%, #8a8990, #2a292f); }
        .cpm-under { position: absolute; z-index: 0; left: 30px; right: 30px; bottom: -14px; height: 18px; border-radius: 50%; background: radial-gradient(closest-side, color-mix(in srgb, var(--neon-primary) 55%, transparent), transparent); filter: blur(2px); }
        .cpm-wheel { background: radial-gradient(circle at 50% 30%, #4a4950, #0a0a0c); box-shadow: 0 0 0 1px #000; }
        .cpm-out, .cpm-bypass { border-color: #000; }
        .cpm-cord .c0 { fill: none; stroke: #0c0c0f; stroke-width: 7; stroke-linecap: round; }
        .cpm-cord .c1 { fill: none; stroke: #3a3940; stroke-width: 5; stroke-dasharray: 2 2.5; }
        .cpm-cord .c2 { fill: none; stroke: var(--neon-primary); stroke-width: 1.6; stroke-linecap: round; stroke-dasharray: 8 46; filter: drop-shadow(0 0 2px var(--neon-primary)); animation: cpPulse 1.6s linear infinite; }
        @keyframes cpPulse { to { stroke-dashoffset: -54; } }
        #cp-root.off .cpm-cord .c2 { display: none; }
        ${E} .kill-btn { width: 26px !important; height: 38px !important; border-radius: 3px !important; background: radial-gradient(circle at 50% 5px, #3dff7a 1.6px, transparent 2.6px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 4px), linear-gradient(#2c2b31, #18171c) !important; box-shadow: 0 0 0 1px #000, inset 0 1px 0 rgba(255,255,255,0.15), 0 3px 6px rgba(0,0,0,0.6), 0 0 10px rgba(61,255,122,0.18) !important; }
        ${E} .kill-btn.out { background: radial-gradient(circle at 50% 5px, #ff3355 1.6px, transparent 2.6px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 4px), linear-gradient(#2c2b31, #18171c) !important; }
        ${E} .kill-btn::before { left: 5px; top: 12px; width: 16px !important; height: 18px !important; border-radius: 3px; background: linear-gradient(90deg, #111, #2c2b31 50%, #111) !important; box-shadow: 0 0 0 1px #000, inset 0 0 0 1px color-mix(in srgb, var(--neon-primary) 70%, transparent), 0 0 6px color-mix(in srgb, var(--neon-primary) 50%, transparent); }
        ${E} .kill-btn::after { top: 9px; background: radial-gradient(circle, #000 1.4px, transparent 1.8px) 0 0 / 5px 100% no-repeat, radial-gradient(circle, #000 1.4px, transparent 1.8px) 5px 0 / 5px 100% no-repeat; }
        ${E} .kill-btn { right: -90px !important; top: 310px !important; width: 34px !important; height: 52px !important; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath d='M2 2L8 8M8 2L2 8' stroke='%23ff3355' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") 50% 39px / 10px 10px no-repeat, radial-gradient(circle at 50% 6px, #3dff7a 1.8px, transparent 2.8px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 4px), linear-gradient(#2c2b31, #18171c) !important; }
        ${E} .kill-btn.out { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath d='M2 2L8 8M8 2L2 8' stroke='%23ff3355' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") 50% 39px / 10px 10px no-repeat, radial-gradient(circle at 50% 6px, #ff3355 1.8px, transparent 2.8px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 4px), linear-gradient(#2c2b31, #18171c) !important; }
        ${E} .kill-btn:hover { filter: drop-shadow(0 0 4px rgba(255,51,85,0.7)); }
        ${E} .kill-btn::before { left: 9px; top: 18px; }
        ${E} .kill-btn::after { left: 11px; top: 15px; }
        .cp-fx { gap: 2px; } .cp-fx button { flex: 1; min-width: 0; padding: 0 1px; font-size: 8px; letter-spacing: 0; }
        .cp-fx button.on { color: #fff; background: linear-gradient(color-mix(in srgb, var(--neon-primary) 70%, #fff), var(--neon-primary)); box-shadow: inset 0 1px 0 rgba(255,255,255,0.4), 0 0 6px var(--neon-primary); }
        html.reduce-motion .cp-shake, html.reduce-motion #cp-root * { animation: none !important; }
        @media (min-width: 1180px) and (min-height: 700px) { ${E} { scale: 1.25; transform-origin: 0 0; } }
        @media (min-width: 1500px) and (min-height: 860px) { ${E} { scale: 1.4; } }
    `;
    document.head.appendChild(css);
    inject();
    os.copier = { go, print, place: (c, name) => place(fit(c, 'paper', name || 'thing')), state: () => ({ paper: M.paper, toner: M.toner, made: M.made, out: S.out.length, jam: !!S.jam, lid: S.lid }) };
})();
