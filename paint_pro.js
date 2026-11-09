
window.os = window.os || {};

(function () {
    const st = os.paintState;
    const $ = id => document.getElementById(id);
    const mk = (w, h) => { let c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; };
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const click = () => { if (typeof os.clickAudio === 'function') os.clickAudio(); };
    const say = (t, ms) => { if (os.paintUI) os.paintUI.status(t, ms); };
    const KEY = 'vmp_paint_brush';

    // my brush, make ur own
    const BASE = { tip: 'round', hard: 0.85, spacing: 0.1, flow: 1, angle: 0, round: 1, follow: false, scatter: 0, sizeJit: 0, opJit: 0, angJit: 0, hueJit: 0, pSize: true, pOp: false, minSize: 0.2, grain: 0.6, erase: false };
    const PRESETS = [
        ['ink', 'インク // INK', { tip: 'round', hard: 0.95, spacing: 0.05, minSize: 0.12 }],
        ['pencil', '鉛筆 // PENCIL', { tip: 'grain', hard: 0.9, spacing: 0.08, pOp: true, minSize: 0.6, grain: 0.75 }],
        ['marker', 'マーカー // MARKER', { tip: 'square', round: 0.45, angle: 30, hard: 0.75, spacing: 0.04, pSize: false }],
        ['soft', 'エア // SOFT AIR', { tip: 'round', hard: 0, spacing: 0.12, flow: 0.12, pOp: true, pSize: false }],
        ['chalk', 'チョーク // CHALK', { tip: 'grain', hard: 0.6, spacing: 0.1, scatter: 0.12, sizeJit: 0.25, grain: 0.95, angJit: 1 }],
        ['callig', 'カリグラフィ // CALLIGRAPHY', { tip: 'round', round: 0.22, angle: 45, hard: 0.95, spacing: 0.03, minSize: 0.35 }],
        ['sumi', '毛筆 // SUMI', { tip: 'bristle', hard: 0.9, spacing: 0.03, follow: true, minSize: 0.3 }],
        ['splat', '飛沫 // SPLATTER', { tip: 'round', hard: 0.9, spacing: 0.5, scatter: 2, sizeJit: 0.85, opJit: 0.3, pSize: false }],
        ['stars', '星屑 // STARDUST', { tip: 'star', hard: 0.7, spacing: 0.7, scatter: 1.6, sizeJit: 0.75, angJit: 1, hueJit: 0.15, pSize: false }]
    ];
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) {}
    st.br = Object.assign({}, BASE, PRESETS[0][2], saved.cur || {});
    st.brName = saved.name || 'ink';
    st.pcurve = typeof saved.curve === 'number' ? saved.curve : 1;
    let mine = saved.mine || {};
    const keep = () => { try { localStorage.setItem(KEY, JSON.stringify({ cur: st.br, name: st.brName, curve: st.pcurve, mine })); } catch (e) {} };
    function usePreset(id) {
        let p = PRESETS.find(x => x[0] === id);
        st.br = Object.assign({}, BASE, p ? p[2] : (mine[id] || {}));
        st.brName = id; tipCache = {}; keep();
    }

    // brush tips get made once and saved, making them every dab was laggy as hell
    let tipCache = {};
    function rnd(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    function tipMask(b) {
        let k = [b.tip, b.hard, b.round, b.grain].join(), T = 128, R = T / 2;
        if (tipCache[k]) return tipCache[k];
        let c = mk(T, T), x = c.getContext('2d'), h = Math.min(0.999, b.hard);
        const soft = () => { let g = x.createRadialGradient(R, R, 0, R, R, R); g.addColorStop(0, '#fff'); g.addColorStop(h, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)'); return g; };
        x.save(); x.translate(R, R); x.scale(1, Math.max(0.05, b.round)); x.translate(-R, -R);
        if (b.tip === 'square') { let e = R * (1 - (1 - h) * 0.5); x.fillStyle = '#fff'; x.shadowColor = '#fff'; x.shadowBlur = (1 - h) * 30; x.fillRect(R - e, R - e, e * 2, e * 2); }
        else if (b.tip === 'star') {
            x.fillStyle = soft(); x.beginPath();
            for (let i = 0; i < 8; i++) { let a = i * Math.PI / 4, r = i % 2 ? R * 0.22 : R; x.lineTo(R + Math.cos(a) * r, R + Math.sin(a) * r); }
            x.closePath(); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(R, R, R * 0.2, 0, 7); x.fill();
        } else if (b.tip === 'bristle') {
            let r = rnd(44);
            for (let i = 0; i < 26; i++) { let t = (i / 25 - 0.5) * 2, y = R + t * R * 0.85 + (r() - 0.5) * 6, xx = R + (r() - 0.5) * R * 0.3, s = R * (0.07 + r() * 0.08); x.fillStyle = 'rgba(255,255,255,' + (0.55 + r() * 0.45) + ')'; x.beginPath(); x.arc(xx, y, s, 0, 7); x.fill(); }
        } else { x.fillStyle = soft(); x.beginPath(); x.arc(R, R, R, 0, 7); x.fill(); }
        x.restore();
        if (b.tip === 'grain') {
            // paper texture, punches little holes in the tip
            let d = x.getImageData(0, 0, T, T), r = rnd(7);
            for (let i = 3; i < d.data.length; i += 4) d.data[i] *= r() < b.grain * 0.7 ? r() * 0.25 : 1;
            x.putImageData(d, 0, 0);
        }
        return (tipCache[k] = c);
    }
    function tinted(b, col) {
        let k = [b.tip, b.hard, b.round, b.grain, col].join();
        if (tipCache[k]) return tipCache[k];
        let m = tipMask(b), c = mk(m.width, m.height), x = c.getContext('2d');
        x.drawImage(m, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
        return (tipCache[k] = c);
    }
    function hueShift(hex, t) {
        let [r, g, b] = os.paintColour.hexRgb(hex).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
        if (d) { s = d / (1 - Math.abs(2 * l - 1)); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
        h = (h + t * 360 + 360) % 360;
        let C = (1 - Math.abs(2 * l - 1)) * s, X = C * (1 - Math.abs((h / 60) % 2 - 1)), m = l - C / 2, rgb = h < 60 ? [C, X, 0] : h < 120 ? [X, C, 0] : h < 180 ? [0, C, X] : h < 240 ? [0, X, C] : h < 300 ? [X, 0, C] : [C, 0, X];
        return '#' + rgb.map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
    }
    function dab(c, b, x, y, size, alpha, dir, col, R) {
        let s = size * (1 - b.sizeJit * R()), a = alpha * (1 - b.opJit * R());
        if (s < 0.3 || a <= 0.003) return null;
        if (b.scatter) { let ang = R() * 6.283, d = R() * b.scatter * size; x += Math.cos(ang) * d; y += Math.sin(ang) * d; }
        let rot = (b.angle * Math.PI / 180) + (b.follow ? dir : 0) + (b.angJit ? (R() - 0.5) * 2 * Math.PI * b.angJit : (b.tip === 'grain' ? R() * 6.283 : 0));
        let tc = b.hueJit ? hueShift(col, Math.round((R() - 0.5) * 2 * b.hueJit * 12) / 12) : col;
        let img = tinted(b, tc), r = s / 2;
        c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.rotate(rot); c.imageSmoothingEnabled = true; c.drawImage(img, -r, -r, s, s); c.restore();
        return [x - r - 2, y - r - 2, x + r + 2, y + r + 2];
    }
    function walkTo(c, b, P, x, y, p, pen) {
        let size = st.size * 1.6, step = Math.max(0.6, b.spacing * size), dx = x - P.x, dy = y - P.y, len = Math.hypot(dx, dy), box = null;
        let dir = len > 0.01 ? Math.atan2(dy, dx) : P.dir || 0;
        const press = q => pen ? q : 1;
        const lay = (lx, ly, q) => {
            let pp = press(q), sz = size * (b.pSize ? b.minSize + (1 - b.minSize) * pp : 1), al = b.flow * (b.pOp ? pp : 1);
            let r = dab(c, b, lx, ly, sz, al, dir, st.color1, P.R);
            if (r) box = box ? [Math.min(box[0], r[0]), Math.min(box[1], r[1]), Math.max(box[2], r[2]), Math.max(box[3], r[3])] : r;
        };
        if (P.first) { lay(x, y, p); P.first = false; P.carry = 0; }
        else {
            let t = step - P.carry;
            while (t <= len) { let q = t / len; lay(P.x + dx * q, P.y + dy * q, P.p + (p - P.p) * q); t += step; }
            P.carry = len - (t - step);
        }
        P.x = x; P.y = y; P.p = p; P.dir = dir;
        return box;
    }

    const orig = os.paintStroke;
    os.paintStroke = function (p2, isStart) {
        if (st.tool !== 'mybrush') { orig.apply(this, arguments); return; }
        let FB = os.paintFxBits, sh = FB.sheetFor(), c = sh.c.getContext('2d'), b = st.br;
        if (isStart || !st.myP) st.myP = { first: true, R: rnd((st.strokeId || 1) * 977) };
        let P = st.myP;
        if (!isStart) { P.x = st.lastX; P.y = st.lastY; P.p = st.lastPressure == null ? p2.pressure : st.lastPressure; P.first = false; P.carry = st.carry || 0; }
        c.save(); c.setTransform(1, 0, 0, 1, 0, 0); FB.clipSel(c);
        let box = walkTo(c, b, P, p2.x, p2.y, p2.pressure, p2.pen);
        c.restore();
        st.carry = P.carry; st.lastX = p2.x; st.lastY = p2.y; st.lastPressure = p2.pressure;
        if (box) FB.sheetShow(box[0], box[1], box[2], box[3], st.opacity, b.erase ? 'destination-out' : 'source-over');
        os.requestPaintRender();
    };

    // pressure curve. only does anything with a drawing tablet
    const curve = q => Math.pow(Math.max(0, Math.min(1, q)), st.pcurve);
    const origAt = os.paintStrokeAt;
    os.paintStrokeAt = function (p, start) {
        let q = p.pen ? Object.assign({}, p, { pressure: curve(p.pressure) }) : p;
        origAt.call(this, q, start);
        if (alphaSnap) maskNear(q);
    };

    let alphaSnap = null, alphaLayer = null, lastAt = null;
    const H = os.paintHist, hBegin = H.begin, hEnd = H.end;
    H.begin = function (full) {
        hBegin.call(H, full);
        let l = os.paintLayers.L();
        if (l && l.alock) { alphaSnap = mk(st.W, st.H); alphaSnap.getContext('2d').drawImage(l.c, 0, 0); alphaLayer = l; } else { alphaSnap = null; alphaLayer = null; }
        st._noDefer = !!alphaSnap;
        lastAt = null;
    };
    function maskRect(x0, y0, x1, y1) {
        if (!alphaSnap || !alphaLayer) return;
        let x = Math.max(0, Math.floor(x0)), y = Math.max(0, Math.floor(y0)), w = Math.min(st.W, Math.ceil(x1)) - x, h = Math.min(st.H, Math.ceil(y1)) - y;
        if (w <= 0 || h <= 0) return;
        let c = alphaLayer.x; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.beginPath(); c.rect(x, y, w, h); c.clip();
        c.globalAlpha = 1; c.globalCompositeOperation = 'destination-in'; c.drawImage(alphaSnap, 0, 0); c.restore();
    }
    function maskNear(p) {
        let m = st.size * 18 + 60, a = lastAt || p;
        maskRect(Math.min(a.x, p.x) - m, Math.min(a.y, p.y) - m, Math.max(a.x, p.x) + m, Math.max(a.y, p.y) + m);
        lastAt = { x: p.x, y: p.y };
    }
    H.end = function (label) {
        if (alphaSnap) { maskRect(0, 0, st.W, st.H); alphaSnap = null; alphaLayer = null; }
        hEnd.call(H, label);
        remember();
    };

    st.recent = st.recent || [];
    function remember() {
        let c = (st.color1 || '').toLowerCase(); if (!c || ['eraser', 'select', 'pick', 'xform'].includes(st.tool)) return;
        st.recent = [c].concat(st.recent.filter(x => x !== c)).slice(0, 10);
        drawRecent();
    }
    function drawRecent() {
        let box = $('pt-recent'); if (!box) return;
        box.innerHTML = st.recent.length ? '<span class="pt-rl">最近 // RECENT:</span>' + st.recent.map(c => `<button type="button" class="pt-sw pt-rsw" data-rc="${c}" style="background:${c}" title="${c}"></button>`).join('') : '';
    }

    function bred() {
        let wrap = document.querySelector('#win-paint\\.exe .paint-app-wrap'); if (!wrap) return;
        let box = $('pt-bred');
        if (box) { box.remove(); return; }
        box = document.createElement('div'); box.id = 'pt-bred'; box.className = 'pt-panelpop';
        wrap.appendChild(box);
        drawBred();
    }
    const SL = { hard: ['硬さ // HARDNESS', 0, 1, 0.01, 'fuzzy', 'crisp'], round: ['丸み // ROUNDNESS', 0.05, 1, 0.01, 'flat', 'round'], angle: ['角度 // ANGLE', 0, 180, 1, '0°', '180°'], grain: ['紙目 // GRAIN', 0, 1, 0.01, 'smooth', 'crumbly'],
        spacing: ['間隔 // SPACING', 0.01, 1.5, 0.01, 'solid line', 'dots'], flow: ['流量 // FLOW', 0.02, 1, 0.01, 'see through', 'full'],
        scatter: ['散り // SCATTER', 0, 3, 0.05, 'on the line', 'all over'], sizeJit: ['サイズ揺れ // SIZE JITTER', 0, 1, 0.01, 'all the same', 'random'], opJit: ['濃さ揺れ // OPACITY JITTER', 0, 1, 0.01, 'all the same', 'patchy'],
        angJit: ['角度揺れ // ANGLE JITTER', 0, 1, 0.01, 'straight', 'any way'], hueJit: ['色揺れ // HUE JITTER', 0, 0.5, 0.01, 'one colour', 'rainbow-ish'],
        minSize: ['最小 // THINNEST', 0, 1, 0.01, 'to nothing', 'barely thins'] };
    const HINT = {
        hard: 'how sharp the edge of each dab is. low = soft airbrush fuzz, high = clean ink',
        round: 'squash the tip. down low its a flat nib, good for calligraphy with ANGLE',
        angle: 'which way the squashed / square tip points. does nothing on a round tip at 100% roundness',
        grain: 'paper texture punched into the tip. only on the 紙 tip',
        spacing: 'gap between each dab along the line. tiny = smooth stroke, big = a row of stamps',
        flow: 'how much paint each dab puts down. low builds up slowly as u go over it',
        scatter: 'throws each dab away from the line. crank it for spray + splatter',
        sizeJit: 'every dab gets a random size',
        opJit: 'every dab gets a random see-through-ness, looks patchy + dry',
        angJit: 'every dab gets spun a random amount. nice on the star + grain tips',
        hueJit: 'nudges the colour round the wheel for each dab',
        minSize: 'with a pen, how thin it gets when u press lightly. only if pressure = size is on',
        pSize: 'press harder = thicker. needs a drawing tablet / pen, a mouse is always full pressure',
        pOp: 'press harder = darker. tablet only too',
        follow: 'the tip turns to face the way ur drawing. makes the 毛 brush look like a real brush',
        erase: 'this brush rubs out instead of painting',
        curve: 'how hard u have to press. soft = light touch does a lot, firm = u have to lean on it',
        tip: 'the shape of each dab. 丸 round, 角 square, 紙 grainy, 毛 bristles, 星 star',
        preset: 'start from one of these, then mess with it. ＋★ keeps ur version'
    };
    const GROUPS = [['形 // SHAPE', ['hard', 'round', 'angle', 'grain']], ['線 // STROKE', ['spacing', 'flow'], ['follow']], ['揺れ // RANDOM', ['scatter', 'sizeJit', 'opJit', 'angJit', 'hueJit']], ['筆圧 // PRESSURE', ['minSize'], ['pSize', 'pOp']]];
    const CHK = { pSize: '筆圧→サイズ // pressure = size', pOp: '筆圧→濃さ // pressure = opacity', follow: '向きに沿う // turn with the stroke', erase: '消しゴムにする // erase with it' };
    function slider(k, b) {
        let d = SL[k];
        return `<label class="pt-bsl" data-h="${k}"><span>${d[0]}</span><em>${fmtV(k, b[k])}</em><input type="range" data-k="${k}" min="${d[1]}" max="${d[2]}" step="${d[3]}" value="${b[k]}"><small>${d[4]}</small><small>${d[5]}</small></label>`;
    }
    function chk(k, b) { return `<label class="pt-bc" data-h="${k}"><input type="checkbox" data-c="${k}"${b[k] ? ' checked' : ''}> ${CHK[k]}</label>`; }
    function group(g, b) {
        return `<fieldset class="pt-grp"><legend>${g[0]}</legend>${g[1].map(k => slider(k, b)).join('')}${(g[2] || []).map(k => chk(k, b)).join('')}${g[0].indexOf('PRESSURE') > 0 ? `<div class="pt-row pt-pcrow" data-h="curve"><canvas id="pt-pcv" width="64" height="44"></canvas><span><b>カーブ // CURVE</b><input type="range" id="pt-pc" min="0.3" max="3" step="0.05" value="${st.pcurve}"><em id="pt-pcv2">${curveName()}</em></span></div>` : ''}</fieldset>`;
    }
    const curveName = () => st.pcurve < 0.95 ? '軽い // soft' : st.pcurve > 1.05 ? '重い // firm' : 'そのまま // linear';
    function drawBred() {
        let box = $('pt-bred'); if (!box) return;
        let b = st.br, opt = PRESETS.map(p => `<option value="${p[0]}"${st.brName === p[0] ? ' selected' : ''}>${esc(p[1])}</option>`).join('') + Object.keys(mine).map(k => `<option value="${esc(k)}"${st.brName === k ? ' selected' : ''}>★ ${esc(k)}</option>`).join('');
        box.innerHTML = `<div class="pt-bh"><b>筆の設定 // BRUSH EDITOR</b><button type="button" class="pt-mini" data-bx="close">✕</button></div>
            <div class="pt-row" data-h="preset"><select class="pt-sel" id="pt-bpre">${opt}</select><button type="button" class="pt-mini" data-bx="save" title="今の設定を保存 // keep these settings as my own brush">＋★</button>${mine[st.brName] ? '<button type="button" class="pt-mini" data-bx="del" title="削除 // delete my brush">✕★</button>' : ''}
                <span class="pt-tips" data-h="tip">${['round', 'square', 'grain', 'bristle', 'star'].map(t => `<button type="button" class="pt-mini${b.tip === t ? ' on' : ''}" data-tip="${t}">${{ round: '● 丸', square: '■ 角', grain: '░ 紙', bristle: '⋮ 毛', star: '✦ 星' }[t]}</button>`).join('')}</span></div>
            <div class="pt-pvrow"><canvas id="pt-bprev" width="880" height="200"></canvas><div class="pt-dabbox"><canvas id="pt-bdab" width="180" height="180"></canvas><small>先端 // TIP</small></div></div>
            <div class="pt-bcols"><div>${group(GROUPS[0], b)}${group(GROUPS[1], b)}</div><div>${group(GROUPS[2], b)}${group(GROUPS[3], b)}${chk('erase', b)}</div></div>
            <p class="pt-bhint" id="pt-bhint"></p>`;
        hide(); hint(null); preview(); pcPreview();
    }
    // grey = dont bother
    function hide() {
        let box = $('pt-bred'); if (!box) return; let b = st.br;
        const off = { grain: b.tip !== 'grain', angle: b.tip === 'round' && b.round > 0.97 && !b.follow, minSize: !b.pSize };
        box.querySelectorAll('.pt-bsl').forEach(l => l.classList.toggle('dim', !!off[l.dataset.h]));
    }
    function hint(k) { let h = $('pt-bhint'); if (h) h.textContent = k && HINT[k] ? HINT[k] : 'hover anything for what it does. the line above is a test stroke, light at the ends like a pen'; }
    function fmtV(k, v) { return k === 'angle' ? Math.round(v) + '°' : k === 'spacing' || k === 'scatter' ? (+v).toFixed(2) : Math.round(v * 100) + '%'; }
    function preview() {
        let cv = $('pt-bprev'); if (!cv) return;
        let c = cv.getContext('2d'), b = Object.assign({}, st.br, { erase: false }), sz = st.size, W = cv.width, Hh = cv.height;
        c.clearRect(0, 0, W, Hh); c.fillStyle = st.paper ? st.bgColor : '#ffffff'; c.fillRect(0, 0, W, Hh);
        st.size = Math.min(30, Math.max(8, sz)) * 2;
        let P = { first: true, R: rnd(3) }, n = 140, bx = mk(W, Hh), x = bx.getContext('2d');
        for (let i = 0; i <= n; i++) { let t = i / n; walkTo(x, b, P, 50 + t * (W - 100), Hh / 2 + Math.sin(t * 6.283) * Hh * 0.27, Math.sin(t * Math.PI), true); }
        st.size = sz;
        c.globalAlpha = st.opacity; c.drawImage(bx, 0, 0); c.globalAlpha = 1;
        let dc = $('pt-bdab'); if (!dc) return;
        let d = dc.getContext('2d'); d.clearRect(0, 0, 180, 180); d.fillStyle = st.paper ? st.bgColor : '#ffffff'; d.fillRect(0, 0, 180, 180);
        d.save(); d.translate(90, 90); d.rotate(b.angle * Math.PI / 180); d.drawImage(tinted(b, st.color1), -70, -70, 140, 140); d.restore();
    }
    function pcPreview() {
        let cv = $('pt-pcv'); if (!cv) return;
        let c = cv.getContext('2d'); c.clearRect(0, 0, 64, 44); c.strokeStyle = 'rgba(255,255,255,0.15)'; c.strokeRect(0.5, 0.5, 63, 43);
        c.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--neon-primary') || '#f09'; c.lineWidth = 2; c.beginPath();
        for (let i = 0; i <= 30; i++) { let t = i / 30; c.lineTo(2 + t * 60, 42 - curve(t) * 40); }
        c.stroke();
    }
    function wireBred(root) {
        root.addEventListener('input', e => {
            let t = e.target; if (!t.closest('#pt-bred')) return;
            if (t.dataset.k) { st.br[t.dataset.k] = +t.value; let em = t.parentNode.querySelector('em'); if (em) em.textContent = fmtV(t.dataset.k, +t.value); tipCache = {}; hide(); preview(); keep(); }
            if (t.id === 'pt-pc') { st.pcurve = +t.value; $('pt-pcv2').textContent = curveName(); pcPreview(); preview(); keep(); }
        });
        root.addEventListener('change', e => {
            let t = e.target; if (!t.closest('#pt-bred, #pt-ctx')) return;
            if (t.dataset.c) { st.br[t.dataset.c] = t.checked; hide(); preview(); keep(); }
            if (t.id === 'pt-bpre' || t.id === 'pt-bpre2') { usePreset(t.value); drawBred(); if (os.paintUI) os.paintUI.opts(); say('筆 // ' + t.options[t.selectedIndex].text); }
        });
        root.addEventListener('mouseover', e => { let h = e.target.closest && e.target.closest('#pt-bred [data-h]'); if (h) hint(h.dataset.h); });
        root.addEventListener('focusin', e => { let h = e.target.closest && e.target.closest('#pt-bred [data-h]'); if (h) hint(h.dataset.h); });
        root.addEventListener('click', e => {
            let t = e.target.closest('[data-bx],[data-tip],[data-rc],[data-pro]'); if (!t) return;
            click();
            if (t.dataset.tip) { st.br.tip = t.dataset.tip; tipCache = {}; drawBred(); keep(); }
            else if (t.dataset.rc) os.setPaintColor(t.dataset.rc);
            else if (t.dataset.bx === 'close') bred();
            else if (t.dataset.bx === 'save') { let n = prompt('名前 // name your brush'); if (!n) return; n = n.trim().slice(0, 24); if (!n) return; mine[n] = Object.assign({}, st.br); st.brName = n; keep(); drawBred(); if (os.paintUI) os.paintUI.opts(); say('保存 // kept ' + n); }
            else if (t.dataset.bx === 'del') { delete mine[st.brName]; usePreset('ink'); drawBred(); if (os.paintUI) os.paintUI.opts(); }
            else if (t.dataset.pro === 'bred') bred();
            else if (t.dataset.pro === 'flip') flipView();
            else if (t.dataset.pro === 'keys') keysPop();
        });
    }

    let ex = { fmt: 'png', q: 0.92, scale: 1, what: 'all', bg: true };
    function exportMenu() {
        let m = $('pt-expmenu'); if (!m) return;
        if (!m.hidden) { m.hidden = true; return; }
        if (os.paintXform && os.paintXform.on()) os.paintXform.commit();
        if (ex.what === 'sel' && !st.sel) ex.what = 'all';
        let name = 'vampii.os_' + os.paintUI.stamp();
        const B = (k, v, lab, dis) => `<button type="button" class="pt-mini${ex[k] === v ? ' on' : ''}" data-ex="${k}" data-v="${v}"${dis ? ' disabled' : ''}>${lab}</button>`;
        m.innerHTML = `<div class="pt-bh"><b>書き出し // EXPORT</b></div>
            <div class="pt-row">${B('fmt', 'png', 'PNG')}${B('fmt', 'jpg', 'JPG')}${B('fmt', 'webp', 'WEBP')}</div>
            <label class="pt-bsl" ${ex.fmt === 'png' ? 'hidden' : ''}><span>画質 // QUALITY</span><input type="range" id="pt-exq" min="0.5" max="1" step="0.01" value="${ex.q}"><em>${Math.round(ex.q * 100)}%</em></label>
            <div class="pt-row">${[0.25, 0.5, 1, 2].map(s => B('scale', s, Math.round(s * 100) + '%')).join('')}</div>
            <div class="pt-row">${B('what', 'all', '全部 // ALL')}${B('what', 'layer', 'このレイヤー // LAYER')}${B('what', 'sel', '選択 // SELECTION', !st.sel)}</div>
            <label class="pt-tog"><input type="checkbox" id="pt-exbg"${ex.bg || ex.fmt === 'jpg' ? ' checked' : ''}${ex.fmt === 'jpg' ? ' disabled' : ''}> 背景を入れる // background (off = see-through)</label>
            <input type="text" id="pt-exname" class="pt-rename" value="${esc(name)}" spellcheck="false">
            <p id="pt-exinfo"></p>
            <div class="pt-row"><button type="button" class="pt-mini big" data-exgo="save">保存 // SAVE</button><button type="button" class="pt-mini big" data-exgo="copy">コピー // COPY</button><button type="button" class="pt-mini big" data-exgo="print">印刷 // PRINT</button></div>
            <div class="pt-bh2">プロジェクト // PROJECT</div>
            <div class="pt-row"><button type="button" class="pt-mini big" data-exgo="proj">.vpaint 保存 // SAVE PROJECT</button></div>
            <p>.vpaint = every layer, blend, opacity, lock + clip. open it again with 開く / OPEN</p>
            <div class="pt-bh2">files/ にしまう // KEEP</div>
            <div class="pt-row"><button type="button" class="pt-mini big" data-exgo="keepwip">途中 // WIP</button><button type="button" class="pt-mini big" data-exgo="keepimg">画像 // PICTURE</button></div>
            <p>stays on this machine, in files/</p>`;
        m.hidden = false; info();
    }
    function info() {
        let p = $('pt-exinfo'); if (!p) return;
        let r = srcRect(); p.textContent = Math.round(r.w * ex.scale) + ' × ' + Math.round(r.h * ex.scale) + ' px';
    }
    const srcRect = () => ex.what === 'sel' && st.sel ? st.sel : { x: 0, y: 0, w: st.W, h: st.H };
    function picture() {
        let r = srcRect(), full = mk(st.W, st.H), x = full.getContext('2d');
        let bg = ex.fmt === 'jpg' || (ex.bg && st.paper);
        if (bg) { x.fillStyle = st.paper ? st.bgColor : '#000'; x.fillRect(0, 0, st.W, st.H); }
        if (ex.what === 'layer') { let l = os.paintLayers.L(); x.globalAlpha = l.op; x.drawImage(l.c, 0, 0); x.globalAlpha = 1; }
        else os.paintCompose(x, false);
        let w = Math.max(1, Math.round(r.w * ex.scale)), h = Math.max(1, Math.round(r.h * ex.scale)), out = mk(w, h), o = out.getContext('2d');
        o.imageSmoothingEnabled = ex.scale < 1; o.imageSmoothingQuality = 'high';
        o.drawImage(full, r.x, r.y, r.w, r.h, 0, 0, w, h);
        return out;
    }
    function download(blob, name) {
        let a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }
    // goes to copier.exe. it prints about as well as you'd expect
    function printIt(nm) {
        if (os.paintXform && os.paintXform.on()) os.paintXform.commit();
        let c = picture(), n = 0; nm = nm || 'vampii.os_' + os.paintUI.stamp();
        os.summon('copier.exe');
        (function go() {
            if (os.copier && os.copier.print && document.querySelector('#cp-root .cpm')) { os.copier.print(c, nm); say('印刷中 // printing, go look at the copier'); }
            else if (n++ < 60) setTimeout(go, 100); else say('プリンターない // cant find the printer');
        })();
    }
    function exGo(what) {
        let m = $('pt-expmenu'), nm = (($('pt-exname') || {}).value || 'vampii.os').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'vampii.os';
        if (what === 'proj') { saveProject(nm); if (m) m.hidden = true; return; }
        if (what === 'print') { if (m) m.hidden = true; printIt(nm); return; }
        if (what === 'keepwip' || what === 'keepimg') { keepIn(what === "keepwip" ? "wip" : "img", nm); if (m) m.hidden = true; return; }
        let type = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' }[ex.fmt], c = picture();
        c.toBlob(b => {
            if (!b) { say('書き出せなかった // couldnt make that file'); return; }
            if (what === 'copy') {
                // clipboard only likes png, whatever
                const put = pb => { try { navigator.clipboard.write([new ClipboardItem({ 'image/png': pb })]).then(() => say('コピーした // copied, paste it anywhere'), () => say('コピーできなかった // the browser said no to copying')); } catch (e) { say('コピーできなかった // the browser said no to copying'); } };
                if (type === 'image/png') put(b); else c.toBlob(put, 'image/png');
            } else { download(b, nm + '.' + ex.fmt); say('保存した // saved ' + nm + '.' + ex.fmt); }
            if (m) m.hidden = true;
        }, type, ex.q);
    }

    function projDoc() {
        return { app: 'vampii-paint', v: 1, W: st.W, H: st.H, paper: st.paper, bg: st.bgColor, active: st.active,
            layers: st.layers.map(l => ({ name: l.name, vis: l.vis, op: l.op, blend: l.blend, lock: !!l.lock, alock: !!l.alock, clip: !!l.clip, g: l.g ? l.g.id : null, png: l.c.toDataURL('image/png') })),
            folders: [...new Set(st.layers.map(l => l.g).filter(Boolean))].map(g => ({ id: g.id, name: g.name, vis: g.vis, op: g.op, blend: g.blend, open: g.open })) };
    }
    function flat() { let c = mk(st.W, st.H), x = c.getContext('2d'); if (st.paper) { x.fillStyle = st.bgColor; x.fillRect(0, 0, st.W, st.H); } os.paintCompose(x, false); return c; }
    function keepIn(kind, nm) {
        if (!os.files) { say('しまえなかった // couldnt keep it'); return; }
        let pic = flat(), th = os.files.thumb(pic, 180), w = st.W, h = st.H;
        const done = () => { say('しまっといた // in files/'); if (os.sfx) os.sfx('noteSave'); os.files.told(nm + (kind === 'wip' ? '.vpaint' : '.png')); };
        const fail = () => say('しまえなかった // no room left?');
        if (kind === 'wip') os.files.put({ app: 'paint', kind: 'vpaint', name: nm, thumb: th, w, h, blob: new Blob([JSON.stringify(projDoc())], { type: 'application/json' }) }).then(done, fail);
        else picture().toBlob(b => { if (!b) return fail(); os.files.put({ app: 'paint', kind: 'img', name: nm, thumb: th, w, h, type: b.type, blob: b }).then(done, fail); }, { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' }[ex.fmt], ex.q);
    }
    function saveProject(nm) {
        let doc = projDoc();
        download(new Blob([JSON.stringify(doc)], { type: 'application/json' }), nm + '.vpaint');
        say('プロジェクト保存 // saved ' + nm + '.vpaint');
    }
    let projArm = 0;
    function openProject(file, force) {
        if (!force && st.undo.length && Date.now() - projArm > 2600) { projArm = Date.now(); say('もう一回開くと、今の絵は消える // open it again to replace whats on the canvas'); return; }
        projArm = 0;
        let rd = new FileReader();
        rd.onload = () => {
            let d; try { d = JSON.parse(rd.result); } catch (e) { d = null; }
            if (!d || d.app !== 'vampii-paint' || !Array.isArray(d.layers)) { say('読めなかった // thats not a .vpaint i can read'); return; }
            Promise.all(d.layers.map(l => new Promise(ok => { let im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = l.png; }))).then(ims => {
                let LY = os.paintLayers;
                st.fit = false;
                LY.freshDoc(d.W, d.H);
                st.layers = d.layers.map((l, i) => { let n = LY.newLayer(l.name); if (ims[i]) n.x.drawImage(ims[i], 0, 0); Object.assign(n, { vis: l.vis !== false, op: +l.op || 1, blend: l.blend || 'source-over', lock: !!l.lock, alock: !!l.alock, clip: !!l.clip }); return n; });
                let fs = {}; (Array.isArray(d.folders) ? d.folders : []).forEach(f => { fs[f.id] = { id: +f.id || 1, name: String(f.name || 'フォルダ').slice(0, 28), vis: f.vis !== false, op: +f.op || 1, blend: f.blend || 'source-over', open: f.open !== false }; });
                st.layers.forEach((l, i) => { let id = d.layers[i] && d.layers[i].g; l.g = id != null && fs[id] ? fs[id] : null; });
                if (!st.layers.length) st.layers = [LY.newLayer()];
                st.paper = d.paper !== false; if (d.bg) os.setPaintBgColor(d.bg);
                LY.setActive(Math.min(d.active || 0, st.layers.length - 1));
                os.paintUI.res(); os.paintUI.side(); os.resetPaintView();
                say('開いた // opened ' + file.name);
            });
        };
        rd.readAsText(file);
    }

    // filters by hand bc safari
    let flt = null;
    const FILTERS = {
        adjust: { name: '調整 // ADJUST', s: [['hue', '色相 // HUE', -180, 180, 1, 0, '°'], ['sat', '彩度 // SATURATION', 0, 300, 1, 100, '%'], ['bri', '明るさ // BRIGHTNESS', 0, 250, 1, 100, '%'], ['con', 'コントラスト // CONTRAST', 0, 300, 1, 100, '%'], ['tmp', '色温度 // WARM ↔ COOL', -100, 100, 1, 0, '']], run: adjustPx },
        motion: { name: 'モーションぼかし // MOTION BLUR', s: [['d', '距離 // DISTANCE', 0, 300, 1, 30, 'px'], ['a', '角度 // ANGLE', 0, 180, 1, 0, '°']], run: motionPx },
        persp: { name: 'パースぼかし // PERSPECTIVE BLUR', s: [['k', '強さ // AMOUNT', 0, 100, 1, 25, '%'], ['x', '中心 X // CENTRE X', 0, 100, 1, 50, '%'], ['y', '中心 Y // CENTRE Y', 0, 100, 1, 50, '%']], run: perspPx, hint: '絵をタップで中心 // tap the picture to put the centre there' }
    };
    function filter(kind) {
        let wrap = document.querySelector('#win-paint\\.exe .paint-app-wrap'); if (!wrap) return;
        if ($('pt-flt')) { let same = flt && flt.kind === kind; fltOff(); if (same) return; }
        if ($('pt-gblur')) gbOff();
        let F = FILTERS[kind], l = os.paintLayers.L();
        flt = { kind, l, v: {}, t: 0 };
        F.s.forEach(s => { flt.v[s[0]] = s[5]; });
        let box = document.createElement('div'); box.id = 'pt-flt'; box.className = 'pt-panelpop';
        box.innerHTML = `<div class="pt-bh"><b>${esc(F.name)}</b><small>${esc(l.name)}${st.sel ? ' // 選択の中だけ' : ''}</small></div>
            ${F.s.map(s => `<label class="pt-bsl"><span>${s[1]}</span><input type="range" data-f="${s[0]}" min="${s[2]}" max="${s[3]}" step="${s[4]}" value="${s[5]}"><em>${s[5]}${s[6]}</em></label>`).join('')}
            ${F.hint ? `<p class="pt-gbp">${esc(F.hint)}</p>` : ''}
            <div class="pt-row"><button type="button" class="pt-mini big" data-fgo="ok">適用 // APPLY</button><button type="button" class="pt-mini big" data-fgo="reset">リセット</button><button type="button" class="pt-mini big" data-fgo="no">やめる // CANCEL</button></div>`;
        wrap.appendChild(box);
        box.oninput = e => { let k = e.target.dataset.f; if (!k) return; flt.v[k] = +e.target.value; let s = F.s.find(x => x[0] === k); e.target.nextElementSibling.textContent = flt.v[k] + s[6]; fltLive(); };
        box.onclick = e => {
            let g = e.target.closest('[data-fgo]'); if (!g) return; click();
            if (g.dataset.fgo === 'ok') fltApply(); else if (g.dataset.fgo === 'no') fltOff();
            else { F.s.forEach(s => { flt.v[s[0]] = s[5]; let i = box.querySelector('[data-f="' + s[0] + '"]'); i.value = s[5]; i.nextElementSibling.textContent = s[5] + s[6]; }); fltLive(); }
        };
        fltLive();
    }
    // tap = move the centre
    os.paintFilterTap = (x, y) => {
        if (!flt || flt.kind !== 'persp') return false;
        flt.v.x = Math.round(x / st.W * 100); flt.v.y = Math.round(y / st.H * 100);
        ['x', 'y'].forEach(k => { let i = document.querySelector('#pt-flt [data-f="' + k + '"]'); if (i) { i.value = flt.v[k]; i.nextElementSibling.textContent = flt.v[k] + '%'; } });
        fltLive(); return true;
    };
    function fltRender(into) {
        let l = flt.l, out = into && into.width === st.W && into.height === st.H ? into : mk(st.W, st.H), o = out.getContext('2d');
        o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.globalCompositeOperation = 'copy'; o.drawImage(FILTERS[flt.kind].run(l.c, flt.v), 0, 0); o.globalCompositeOperation = 'source-over';
        let s = st.sel;
        if (s) {
            let keep = mk(st.W, st.H), k = keep.getContext('2d'); k.drawImage(l.c, 0, 0);
            if (s.mask) { o.globalCompositeOperation = 'destination-in'; o.drawImage(s.mask, 0, 0); k.globalCompositeOperation = 'destination-out'; k.drawImage(s.mask, 0, 0); }
            else { o.globalCompositeOperation = 'destination-in'; o.fillRect(s.x, s.y, s.w, s.h); k.clearRect(s.x, s.y, s.w, s.h); }
            o.globalCompositeOperation = 'destination-over'; o.drawImage(keep, 0, 0); o.globalCompositeOperation = 'source-over';
        }
        return out;
    }
    function fltLive() { if (!flt) return; clearTimeout(flt.t); flt.t = setTimeout(() => { if (!flt) return; flt.l.pv = fltRender(flt.l.pv); os.requestPaintRender(); }, 70); }
    function fltOff() { if (flt) { clearTimeout(flt.t); delete flt.l.pv; flt = null; } let b = $('pt-flt'); if (b) b.remove(); os.requestPaintRender(); }
    function fltApply() {
        if (!flt) return;
        let l = flt.l, name = FILTERS[flt.kind].name, out = fltRender(), i = st.layers.indexOf(l);
        if (i >= 0) os.paintLayers.setActive(i);
        H.begin(true); H.raw = true;
        l.x.save(); l.x.setTransform(1, 0, 0, 1, 0, 0); l.x.globalAlpha = 1; l.x.globalCompositeOperation = 'copy'; l.x.drawImage(out, 0, 0); l.x.restore();
        H.end(name); H.raw = false;
        fltOff(); say(name.split(' // ').pop().toLowerCase() + ' done');
    }
    function adjustPx(src, v) {
        let c = mk(st.W, st.H), x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(src, 0, 0);
        if (!v.hue && v.sat === 100 && v.bri === 100 && v.con === 100 && !v.tmp) return c;
        let img = x.getImageData(0, 0, st.W, st.H), d = img.data;
        let a = v.hue * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a), s = v.sat / 100, b = v.bri / 100, k = v.con / 100, o = 128 * (1 - k), t = v.tmp * 0.6;
        let H1 = [0.213 + cs * 0.787 - sn * 0.213, 0.715 - cs * 0.715 - sn * 0.715, 0.072 - cs * 0.072 + sn * 0.928,
            0.213 - cs * 0.213 + sn * 0.143, 0.715 + cs * 0.285 + sn * 0.140, 0.072 - cs * 0.072 - sn * 0.283,
            0.213 - cs * 0.213 - sn * 0.787, 0.715 - cs * 0.715 + sn * 0.715, 0.072 + cs * 0.928 + sn * 0.072];
        let S1 = [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s, 0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s, 0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s];
        let M = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => { let r = Math.floor(i / 3), cc = i % 3; return S1[r * 3] * H1[cc] + S1[r * 3 + 1] * H1[3 + cc] + S1[r * 3 + 2] * H1[6 + cc]; });
        let g = b * k;
        for (let i = 0; i < d.length; i += 4) {
            if (!d[i + 3]) continue;
            let r = d[i], gg = d[i + 1], bb = d[i + 2];
            d[i] = (M[0] * r + M[1] * gg + M[2] * bb) * g + o + t;
            d[i + 1] = (M[3] * r + M[4] * gg + M[5] * bb) * g + o;
            d[i + 2] = (M[6] * r + M[7] * gg + M[8] * bb) * g + o - t;
        }
        x.putImageData(img, 0, 0);
        return c;
    }
    // copies on 'lighter' = a proper average. and its quick
    function stack(src, n, place) {
        let c = mk(st.W, st.H), x = c.getContext('2d');
        x.globalCompositeOperation = 'lighter'; x.globalAlpha = 1 / n; x.imageSmoothingEnabled = true;
        for (let i = 0; i < n; i++) { x.save(); place(x, n > 1 ? i / (n - 1) : 0.5); x.drawImage(src, 0, 0); x.restore(); }
        return c;
    }
    function motionPx(src, v) {
        if (!v.d) { let c = mk(st.W, st.H); c.getContext('2d').drawImage(src, 0, 0); return c; }
        let a = v.a * Math.PI / 180, n = Math.max(2, Math.min(64, Math.ceil(v.d / 2)));
        return stack(src, n, (x, q) => x.translate(Math.cos(a) * v.d * (q - 0.5), Math.sin(a) * v.d * (q - 0.5)));
    }
    function perspPx(src, v) {
        if (!v.k) { let c = mk(st.W, st.H); c.getContext('2d').drawImage(src, 0, 0); return c; }
        let cx = st.W * v.x / 100, cy = st.H * v.y / 100, amt = v.k / 100 * 0.35, n = Math.max(2, Math.min(48, Math.ceil(v.k * 0.6)));
        return stack(src, n, (x, q) => { let z = 1 + amt * q; x.translate(cx, cy); x.scale(z, z); x.translate(-cx, -cy); });
    }
    // the 3 stack button is my shading trick in one go
    let gb = null;
    function gblur() {
        let wrap = document.querySelector('#win-paint\\.exe .paint-app-wrap'); if (!wrap) return;
        if ($('pt-gblur')) { gbOff(); return; }
        if ($('pt-flt')) fltOff();
        gb = { r: 8, l: os.paintLayers.L(), t: 0 };
        let box = document.createElement('div'); box.id = 'pt-gblur'; box.className = 'pt-panelpop';
        box.innerHTML = `<div class="pt-bh"><b>ぼかし // BLUR</b><small>${esc(gb.l.name)}${st.sel ? ' // 選択の中だけ' : ''}</small></div>
            <label class="pt-bsl"><span>半径 // RADIUS</span><input type="range" data-gb="r" min="0" max="100" step="1" value="${toS(gb.r)}"><em>${gb.r}px</em></label>
            <div class="pt-row"><button type="button" class="pt-mini big" data-gbgo="ok">適用 // APPLY</button><button type="button" class="pt-mini big" data-gbgo="no">やめる // CANCEL</button></div>
            <div class="pt-bh2">影の下地 // SHADING BASE</div>
            <p class="pt-gbp">このレイヤーを3回ぼかして（小・中・大）重ねたやつを、上に新しいレイヤーで作る // blurs this layer 3 times (small, more, loads) + stacks them on a new layer above. thats the shading</p>
            <div class="pt-row"><button type="button" class="pt-mini big" data-gbgo="stack">3段で作る // MAKE IT</button></div>`;
        wrap.appendChild(box);
        box.oninput = e => { if (e.target.dataset.gb !== 'r') return; gb.r = toR(+e.target.value); e.target.nextElementSibling.textContent = gb.r + 'px'; gbLive(); };
        box.onclick = e => { let g = e.target.closest('[data-gbgo]'); if (!g) return; click(); let k = g.dataset.gbgo; if (k === 'ok') gbApply(); else if (k === 'stack') gbStack(); else gbOff(); };
        gbLive();
    }
    const toR = v => Math.round(v <= 40 ? v / 2 : 20 + Math.pow((v - 40) / 60, 1.6) * 230);
    const toS = r => r <= 20 ? r * 2 : Math.round(40 + Math.pow((r - 20) / 230, 1 / 1.6) * 60);
    function gbRender(l, r, into) {
        let c = into || mk(st.W, st.H), x = c.getContext('2d'), s = st.sel;
        x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, st.W, st.H); x.drawImage(l.c, 0, 0);
        if (r <= 0) return c;
        let o = os.paintBlur.layer(l, r, s);
        x.save(); if (s) { x.beginPath(); x.rect(s.x, s.y, s.w, s.h); x.clip(); x.clearRect(s.x, s.y, s.w, s.h); } else x.clearRect(0, 0, st.W, st.H);
        os.paintBlur.put(x, o); x.restore();
        return c;
    }
    function gbLive() {
        if (!gb) return; clearTimeout(gb.t);
        gb.t = setTimeout(() => { if (!gb) return; gb.l.pv = gbRender(gb.l, gb.r, gb.l.pv && gb.l.pv.width === st.W && gb.l.pv.height === st.H ? gb.l.pv : null); os.requestPaintRender(); }, 60);
    }
    function gbOff() { if (gb) { clearTimeout(gb.t); delete gb.l.pv; gb = null; } let b = $('pt-gblur'); if (b) b.remove(); os.requestPaintRender(); }
    function gbApply() {
        if (!gb) return;
        let l = gb.l, r = gb.r; clearTimeout(gb.t);
        if (r > 0) {
            let out = gbRender(l, r), i = st.layers.indexOf(l); if (i >= 0) os.paintLayers.setActive(i);
            H.begin(true); l.x.save(); l.x.setTransform(1, 0, 0, 1, 0, 0); l.x.globalAlpha = 1; l.x.globalCompositeOperation = 'copy'; l.x.drawImage(out, 0, 0); l.x.restore(); H.end('ぼかし // BLUR ' + r + 'px');
        }
        gbOff(); say('ぼかした // blurred ' + r + 'px');
    }
    function gbStack() {
        if (!gb) return;
        if (st.layers.length >= 24) { say('レイヤーがいっぱい // too many layers (24)'); return; }
        let l = gb.l, r = Math.max(2, gb.r), LY = os.paintLayers;
        gbOff();
        let n = LY.newLayer('影 // shading'), saved = st.sel; st.sel = null;
        [r, r * 2.5, r * 6].forEach(k => { let c = gbRender(l, Math.min(300, Math.round(k))); n.x.drawImage(c, 0, 0); });
        st.sel = saved;
        n.blend = 'multiply';
        let i = st.layers.indexOf(l);
        H.push(H.struct('影の下地 // SHADING BASE', () => { st.layers.splice(i + 1, 0, n); LY.setActive(i + 1); }));
        os.requestPaintRender(); say('影の下地できた // shading base made, its on multiply. erase the thick bits + go');
    }
    function poster() {
        let l = os.paintLayers.L(), s = st.sel || { x: 0, y: 0, w: st.W, h: st.H };
        H.begin(false); H.grow(s.x, s.y, 0); H.grow(s.x + s.w, s.y + s.h, 0);
        let img = l.x.getImageData(s.x, s.y, s.w, s.h), d = img.data, n = 4, k = 255 / (n - 1);
        for (let i = 0; i < d.length; i += 4) { d[i] = Math.round(d[i] / k) * k; d[i + 1] = Math.round(d[i + 1] / k) * k; d[i + 2] = Math.round(d[i + 2] / k) * k; }
        l.x.putImageData(img, s.x, s.y);
        H.end('FX ポスタリゼーション // POSTERIZE');
        os.requestPaintRender();
    }

    function flipView() { st.flipView = !st.flipView; let b = $('pt-flip'); if (b) b.classList.toggle('active', st.flipView); say(st.flipView ? '左右反転 // view flipped. the picture isnt, just how you see it' : '反転解除 // view back to normal'); os.requestPaintRender(); }
    function keysPop() {
        let m = $('pt-keysmenu'); if (!m) return;
        if (!m.hidden) { m.hidden = true; return; }
        m.innerHTML = '<div class="pt-bh"><b>キー // KEYS</b></div><table>' + [['B', 'pen'], ['P', 'my brush'], ['E', 'eraser'], ['N', 'neon'], ['A', 'airbrush'], ['S', 'smudge'], ['I / alt', 'pick colour'], ['M', 'select'], ['G', 'gradient'], ['F', 'fill'], ['L U O', 'line box ellipse'], ['[ ]', 'size'], ['X', 'swap colours'], ['H', 'flip the view'], ['1-9, 0', 'opacity 10-90, 100'], ['space + drag', 'move around'], ['ctrl z / y', 'undo / redo'], ['ctrl s', 'quick png'], ['ctrl shift s', 'export'], ['ctrl a / esc / del', 'select all / none / clear it'], ['ctrl / shift click a layer', 'pick a few, ⤓ merges them'], ['2 fingers tap / 3', 'undo / redo'], ['pinch, 2 fingers', 'zoom + move'], ['after the pencil', 'fingers just move the paper'], ['hold a layer (ipad)', 'the layer menu']].map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('') + '</table>';
        m.hidden = false;
    }
    document.addEventListener('keydown', e => {
        let win = $('win-paint.exe');
        if (!win || !win.classList.contains('is-active') || win.classList.contains('is-min')) return;
        let tg = e.target;
        if (tg && (tg.isContentEditable || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT' || (tg.tagName === 'INPUT' && !/range|color|checkbox|button/.test(tg.type)))) return;
        let k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
        if (mod && e.shiftKey && k === 's') { e.preventDefault(); e.stopImmediatePropagation(); exportMenu(); return; }
        if (mod) return;
        if (k === 'x') { let a = st.color1; os.setPaintColor(st.color2, a); }
        else if (k === 'h') flipView();
        else if (k === 'p') os.setPaintTool('mybrush');
        else if (/^[0-9]$/.test(k)) { st.opacity = k === '0' ? 1 : +k / 10; let o = $('paint-opacity'); if (o) o.value = st.opacity; say('不透明度 // opacity ' + Math.round(st.opacity * 100) + '%', 1200); }
    }, true);

    // sticking all the new buttons onto paint
    function decorate() {
        let wrap = document.querySelector('#win-paint\\.exe .paint-app-wrap'); if (!wrap || wrap._pro) return;
        wrap._pro = true;
        let st2 = document.createElement('style'); st2.textContent = CSS; wrap.appendChild(st2);
        let deck = wrap.querySelector('.pt-deck'); if (deck && !$('pt-recent')) { let r = document.createElement('span'); r.id = 'pt-recent'; deck.appendChild(r); }
        let bar = wrap.querySelector('.pt-bar');
        if (bar) {
            let rc = $('pt-centre');
            let fl = document.createElement('button'); fl.type = 'button'; fl.id = 'pt-flip'; fl.className = 'pt-ib'; fl.dataset.pro = 'flip'; fl.title = '左右反転 // flip the view (H)'; fl.innerHTML = '<i class="pt-bi" data-em="pt-b-flip"></i>';
            if (rc) rc.after(fl);
            let kb = document.createElement('button'); kb.type = 'button'; kb.className = 'pt-ib'; kb.dataset.pro = 'keys'; kb.innerHTML = '<i class="pt-bi" data-em="pt-b-help"></i>'; kb.title = 'キー // shortcuts';
            let crt = $('pt-crt'); if (crt) crt.after(kb);
            [['pt-expmenu', 'left: 300px; min-width: 280px;'], ['pt-keysmenu', 'left: 380px;']].forEach(([id, css]) => { let p = document.createElement('div'); p.className = 'pt-pop'; p.id = id; p.hidden = true; p.style.cssText = css; bar.appendChild(p); });
            bar.addEventListener('click', e => {
                let x = e.target.closest('[data-ex]'); if (x && !x.disabled) { click(); let v = x.dataset.v; ex[x.dataset.ex] = isNaN(+v) ? v : +v; let m = $('pt-expmenu'); m.hidden = true; exportMenu(); return; }
                let g = e.target.closest('[data-exgo]'); if (g) { click(); exGo(g.dataset.exgo); }
            });
            bar.addEventListener('input', e => { if (e.target.id === 'pt-exq') { ex.q = +e.target.value; e.target.nextElementSibling.textContent = Math.round(ex.q * 100) + '%'; } });
            bar.addEventListener('change', e => { if (e.target.id === 'pt-exbg') ex.bg = e.target.checked; });
        }
        wireBred(wrap);
        drawRecent();
    }
    const oOpts = os.paintUI.opts;
    os.paintUI.opts = function () {
        oOpts.apply(this, arguments);
        let box = $('pt-ctx'); if (!box || st.tool !== 'mybrush') return;
        box.insertAdjacentHTML('beforeend', `<label class="pt-lab">筆 // BRUSH: <select id="pt-bpre2" class="pt-sel">${PRESETS.map(p => `<option value="${p[0]}"${st.brName === p[0] ? ' selected' : ''}>${esc(p[1])}</option>`).join('') + Object.keys(mine).map(k => `<option value="${esc(k)}"${st.brName === k ? ' selected' : ''}>★ ${esc(k)}</option>`).join('')}</select></label><button type="button" class="pt-mini" data-pro="bred">⚙ 設定 // EDIT</button>`);
    };
    const oBuild = os.paintUI.build;
    os.paintUI.build = function () { oBuild.apply(this, arguments); decorate(); os.paintUI.opts(); };
    if (document.querySelector('#win-paint\\.exe .paint-app-wrap')) { decorate(); os.paintUI.opts(); }

    const CSS = `
        .pt-panelpop { position: absolute; left: 92px; top: 66px; z-index: 30; width: 318px; max-height: calc(100% - 120px); overflow-y: auto; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;
            background: var(--p9-face, #25232d); box-shadow: inset 1px 1px 0 var(--p9-hi), inset -1px -1px 0 var(--p9-lo), inset 2px 2px 0 var(--p9-hi2), inset -2px -2px 0 var(--p9-lo2), 4px 5px 0 rgba(0, 0, 0, 0.55); font-size: 11px; color: var(--text-main); }
        #pt-flt, #pt-gblur { left: auto; right: 210px; width: 280px; }
        .pt-gbp { margin: 0; font-size: 10.5px; line-height: 1.4; opacity: 0.8; }
        .pt-bh { display: flex; justify-content: space-between; align-items: center; gap: 8px; color: var(--neon-secondary); letter-spacing: 1px; } .pt-bh small { opacity: 0.6; }
        .pt-bh2 { margin-top: 6px; font-size: 10px; letter-spacing: 2px; color: var(--neon-secondary); opacity: 0.85; }
        #pt-bred { width: 590px; max-height: calc(100% - 84px); }
        #pt-bred .pt-row { align-items: center; }
        #pt-bred .pt-tips { margin-left: auto; }
        .pt-pvrow { display: flex; gap: 6px; }
        #pt-bred #pt-bprev { flex: 1 1 auto; width: 0; height: 100px; }
        .pt-dabbox { flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; gap: 1px; font-size: 9px; letter-spacing: 1px; opacity: 0.85; }
        #pt-bdab { width: 86px; height: 86px; box-shadow: inset 1px 1px 0 var(--p9-lo), inset -1px -1px 0 var(--p9-hi); }
        .pt-bcols { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-items: start; } .pt-bcols > div { display: flex; flex-direction: column; gap: 6px; }
        .pt-grp { margin: 0; padding: 4px 8px 7px; border: 0; box-shadow: inset 1px 1px 0 var(--p9-lo2), inset -1px -1px 0 var(--p9-hi), 1px 1px 0 var(--p9-hi); display: flex; flex-direction: column; gap: 5px; }
        .pt-grp legend { padding: 0 4px; font-size: 10px; letter-spacing: 2px; color: var(--p9-acc, var(--neon-secondary)); font-family: 'DotGothic16', monospace; }
        .pt-bsl { display: grid; grid-template-columns: 1fr auto; grid-template-rows: auto auto auto; column-gap: 6px; font-size: 10px; }
        .pt-bsl span { grid-column: 1; } .pt-bsl em { grid-column: 2; font-style: normal; text-align: right; opacity: 0.75; font-variant-numeric: tabular-nums; }
        #win-paint\\.exe .pt-bsl input { grid-column: 1 / 3; width: 100% !important; max-width: none !important; margin: 1px 0 0; accent-color: var(--neon-primary); }
        .pt-bsl small { grid-row: 3; font-size: 8px; opacity: 0.55; letter-spacing: 0.5px; } .pt-bsl small:last-child { grid-column: 2; text-align: right; }
        .pt-bsl.dim { opacity: 0.35; }
        .pt-bc { display: flex; align-items: center; gap: 5px; font-size: 10px; } .pt-bc input { accent-color: var(--neon-primary); margin: 0; }
        .pt-pcrow { flex-wrap: nowrap !important; } .pt-pcrow span { flex: 1; display: flex; flex-direction: column; gap: 1px; font-size: 10px; } .pt-pcrow b { font-weight: normal; } #win-paint\\.exe .pt-pcrow input { width: 100% !important; max-width: none !important; accent-color: var(--neon-primary); } .pt-pcrow em { font-size: 9px; opacity: 0.7; }
        .pt-bhint { margin: 0; min-height: 28px; padding: 5px 8px; font-size: 10px; line-height: 1.4; background: var(--p9-face2, #fff); box-shadow: inset 1px 1px 0 var(--p9-lo), inset -1px -1px 0 var(--p9-hi); }
        .pt-narrow #pt-bred .pt-bcols { grid-template-columns: 1fr; }
        .pt-pop .pt-mini, .pt-panelpop .pt-mini { padding: 3px 8px; font-size: 11px; }
        .pt-tips { display: flex; gap: 3px; flex-wrap: wrap; } .pt-mini.on { background: color-mix(in srgb, var(--neon-primary) 40%, var(--p9-face2)); color: #fff; } .pt-mini.big { padding: 4px 9px; } .pt-mini:disabled { opacity: 0.3; }
        .pt-bchk { display: grid; gap: 3px; font-size: 10px; } .pt-bchk input { accent-color: var(--neon-primary); }
        #pt-bprev { width: 100%; height: 86px; box-shadow: inset 1px 1px 0 var(--p9-lo), inset -1px -1px 0 var(--p9-hi); }
        #pt-pcv { flex: 0 0 auto; }
        #pt-recent { display: inline-flex; gap: 2px; align-items: center; margin-left: 6px; flex: 0 0 auto; } .pt-rl { font-size: 9px; letter-spacing: 1px; color: var(--neon-secondary); opacity: 0.8; }
        .pt-rsw { padding: 0; }
        #pt-expmenu .pt-row, .pt-panelpop .pt-row { gap: 4px; flex-wrap: wrap; } #pt-expmenu label { font-size: 10px; } #pt-exinfo { font-size: 11px; opacity: 0.8; margin: 0; }
        #pt-keysmenu table { border-collapse: collapse; font-size: 10px; } #pt-keysmenu td { padding: 2px 8px 2px 0; } #pt-keysmenu td:first-child { color: var(--neon-primary); white-space: nowrap; }
        .pt-lay .pt-thumb { flex: 0 0 auto; width: 40px; height: 24px; box-shadow: 0 0 0 1px #000; background: repeating-conic-gradient(#2a2232 0 25%, #1a1420 0 50%) 0 0 / 8px 8px; }
        .pt-lflags { display: flex; gap: 1px; flex: 0 0 auto; } .pt-lf { background: none; border: 0; padding: 0 2px; font-size: 10px; color: var(--text-main); opacity: 0.28; cursor: inherit; filter: grayscale(1); }
        .pt-lf.on { opacity: 1; filter: none; color: var(--neon-primary); text-shadow: 0 0 6px var(--neon-glow); } .pt-lf:disabled { visibility: hidden; }
        .pt-lay.clip { margin-left: 10px; } .pt-cl { color: var(--neon-secondary); margin-right: 3px; }
        .pt-narrow .pt-panelpop { left: 6px; right: 6px; width: auto; top: 60px; }
    `;
    os.paintPro = { exportMenu, print: () => printIt(), openProject, keep: keepIn, filter, adjust: () => filter('adjust'), gblur, poster, bred, flipView, presets: () => PRESETS.map(p => p[0]), use: usePreset };
})();
