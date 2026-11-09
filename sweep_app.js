
window.os = window.os || {};

(function () {
    const cdb = (typeof appsDB !== 'undefined' && appsDB.sweep) || {};
    const W = (window.gamesDB || {}).sweep || {};
    const num = (k, d) => (typeof cdb[k] === 'number' ? cdb[k] : d);
    const KEY = 'vmp_sweep';
    const BOARDS = [
        { id: 'alley', w: 9, h: 9, n: 10, par: num('alleyPar', 60) },
        { id: 'street', w: 16, h: 16, n: 40, par: num('streetPar', 200), part: 'sw_street' },
        { id: 'district', w: 30, h: 16, n: 99, par: num('districtPar', 600), part: 'sw_district' },
        { id: 'mirror', w: 16, h: 16, n: 44, par: num('mirrorPar', 300), part: 'sw_mirror', wrap: true }
    ];
    const LOOKS = [{ id: 'city' }, { id: 'rain', part: 'sw_rain' }, { id: 'print', part: 'sw_print' }];
    const TOOLS = [{ id: 'scan', part: 'sw_scan' }, { id: 'sight', part: 'sw_sight' }, { id: 'bucket', part: 'sw_flare' }];

    const has = id => !id || (typeof os.hasUnlock === 'function' ? os.hasUnlock(id) : (() => { try { return (JSON.parse(localStorage.getItem(os.unlocksKey ? os.unlocksKey() : 'vmp_unlocks') || '[]') || []).indexOf(id) >= 0; } catch (e) { return false; } })());
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const split = s => String(s == null ? '' : s).split('|').map(x => x.trim());
    const fill = (s, n, m) => String(s).replace(/\{n\}/g, n).replace(/\{m\}/g, m);
    function line(k, n, m) { let p = split((W.lines || {})[k]); return { jp: fill(p[0] || '', n, m), en: fill(p[1] || '', n, m) }; }
    const two = o => '<b>' + esc(o.jp) + '</b>' + (o.en ? ' <i>' + esc(o.en) + '</i>' : '');
    const L = (k, n, m) => two(line(k, n, m));
    const named = id => { let p = split((W.boards || {})[id]); return { jp: p[0] || id, en: p[1] || '', sub: p[2] || '' }; };
    const $ = id => document.getElementById(id);
    function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

    let D = { best: {}, clears: {}, played: {}, plays: 0, look: 'city', board: 'alley', marks: false };
    function loadD() { try { let d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d) D = Object.assign(D, d); } catch (e) {} D.best = D.best || {}; D.clears = D.clears || {}; D.played = D.played || {}; }
    function saveD() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} }
    const ownedBoards = () => BOARDS.filter(b => has(b.part));
    const look = () => (LOOKS.find(l => l.id === D.look && has(l.part)) || LOOKS[0]).id;

    function tone(seq, type) {
        try {
            if (localStorage.getItem('vmp_mute') === '1') return;
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!window.audioCtx) window.audioCtx = new AudioContext();
            let ctx = window.audioCtx; if (ctx.state === 'suspended') ctx.resume();
            let at = ctx.currentTime;
            seq.forEach(p => { let o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'square'; o.frequency.setValueAtTime(p[0], at); g.gain.setValueAtTime(0.03, at); g.gain.exponentialRampToValueAtTime(0.001, at + p[1]); o.connect(g); g.connect(os.gg && os.gg.out ? os.gg.out(ctx) : ctx.destination); o.start(at); o.stop(at + p[1]); at += p[1]; });
        } catch (e) {}
    }

    let B = null, cv = null, cx = null, raf = 0, hover = -1, cursor = 0, flagMode = false, timer = 0;
    function newBoard(id) {
        let bd = ownedBoards().find(b => b.id === id) || BOARDS[0];
        B = { bd, w: bd.w, h: bd.h, n: bd.n, mine: new Uint8Array(bd.w * bd.h), open: new Uint8Array(bd.w * bd.h), flag: new Uint8Array(bd.w * bd.h), cnt: new Uint8Array(bd.w * bd.h), seeded: false, state: 'ready', t0: 0, t: 0, hit: -1, opened: 0, used: {}, taped: {}, openAt: new Float32Array(bd.w * bd.h), seen: 0, flagAt: new Float32Array(bd.w * bd.h), mark: new Uint8Array(bd.w * bd.h), wonAt: 0 };
        D.board = bd.id; D.plays++; saveD();
        fx = { alarm: 0, clear: 0, shake: 0 };
        cursor = Math.floor(B.h / 2) * B.w + Math.floor(B.w / 2);
        clearInterval(timer); timer = setInterval(() => { if (B && B.state === 'play') { B.t = (performance.now() - B.t0) / 1000; renderBar(); } }, 200);
        sizeCanvas(); render(); say(named(bd.id)); renderPick();
    }
    function nbrs(i) {
        let x = i % B.w, y = Math.floor(i / B.w), out = [];
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            let nx = x + dx, ny = y + dy;
            if (B.bd.wrap) { nx = (nx + B.w) % B.w; ny = (ny + B.h) % B.h; }
            else if (nx < 0 || ny < 0 || nx >= B.w || ny >= B.h) continue;
            out.push(ny * B.w + nx);
        }
        return out;
    }
    // your first click is always safe. I'm not a monster
    function seed(first) {
        let R = Math.random, safe = new Set([first].concat(nbrs(first)));
        let cells = [];
        for (let i = 0; i < B.w * B.h; i++) if (!safe.has(i)) cells.push(i);
        for (let k = 0; k < B.n && cells.length; k++) { let j = Math.floor(R() * cells.length); B.mine[cells[j]] = 1; cells.splice(j, 1); }
        // console.log('mines', B.mine.filter(Boolean).length);
        for (let i = 0; i < B.w * B.h; i++) B.cnt[i] = nbrs(i).reduce((s, j) => s + B.mine[j], 0);
        B.seeded = true; B.state = 'play'; B.t0 = performance.now();
    }
    function openCell(i, quiet) {
        if (!B || B.state === 'won' || B.state === 'lost' || B.open[i] || B.flag[i]) return false;
        if (!B.seeded) seed(i);
        if (B.mine[i]) {
            if (B.armSight && has('sw_sight') && !B.used.sight) { B.used.sight = true; B.flag[i] = 1; B.flagAt[i] = performance.now(); B.taped[i] = 1; say(line('saved'), 'win'); tone([[660, 0.06], [880, 0.1]]); render(); return true; }
            lose(i); return true;
        }
        if (!B.played) { B.played = 1; D.played[B.bd.id] = (D.played[B.bd.id] || 0) + 1; saveD(); }
        let q = [[i, 0]], now = performance.now(), k = 0;
        while (q.length) {
            let [c, d] = q.shift();
            if (B.open[c] || B.flag[c] || B.mine[c]) continue;
            B.open[c] = 1; B.mark[c] = 0; B.opened++; k++; B.openAt[c] = now + d * 26;
            if (B.cnt[c] === 0) nbrs(c).forEach(j => { if (!B.open[j]) q.push([j, d + 1]); });
        }
        if (!quiet) tone([[700 + Math.min(600, k * 20), 0.03]], 'triangle');
        checkWin();
        render();
        return true;
    }
    function chord(i) {
        if (!B || B.state !== 'play' || !B.open[i] || !B.cnt[i]) return false;
        let ns = nbrs(i), f = ns.filter(j => B.flag[j]).length;
        if (f !== B.cnt[i]) return false;
        ns.forEach(j => { if (!B.open[j] && !B.flag[j] && B.state === 'play') openCell(j, true); });
        tone([[880, 0.04]], 'triangle');
        return true;
    }
    function toggleFlag(i) {
        if (!B || B.state === 'won' || B.state === 'lost' || B.open[i]) return false;
        if (B.flag[i]) { B.flag[i] = 0; if (D.marks) B.mark[i] = 1; }
        else if (B.mark[i]) B.mark[i] = 0;
        else { B.flag[i] = 1; B.flagAt[i] = performance.now(); }
        tone(B.flag[i] ? [[1200, 0.03], [900, 0.04]] : B.mark[i] ? [[760, 0.04]] : [[500, 0.04]]);
        render(); renderBar();
        return true;
    }
    function act(i, alt) {
        if (!B) return;
        if (B.open[i]) { chord(i); return; }
        if (alt || flagMode) toggleFlag(i); else openCell(i);
    }
    function safeLeft() { return B.w * B.h - B.n - B.opened; }
    function checkWin() {
        if (B.state !== 'play' || safeLeft() > 0) return;
        B.state = 'won'; B.t = (performance.now() - B.t0) / 1000; B.wonAt = performance.now();
        for (let i = 0; i < B.w * B.h; i++) if (B.mine[i] && !B.flag[i]) { B.flag[i] = 1; B.flagAt[i] = B.wonAt + 500 + hash(i) * 600; }
        let bd = B.bd, t = Math.round(B.t), rec = !D.best[bd.id] || B.t < D.best[bd.id], star = B.t <= bd.par;
        D.clears[bd.id] = (D.clears[bd.id] || 0) + 1;
        if (!D.best[bd.id] || B.t < D.best[bd.id]) D.best[bd.id] = Math.round(B.t * 10) / 10;
        saveD();
        tone([[523, 0.07], [659, 0.07], [784, 0.07], [1046, 0.2]]);
        say([line('clear', t)].concat(rec ? [line('record')] : [], star ? [line('underPar')] : []), 'win');
        if (star) { D.stars = D.stars || {}; D.stars[bd.id] = 1; saveD(); }
        fx.clear = 0.001;
        renderBar();
    }
    function lose(i) {
        B.state = 'lost'; B.hit = i; B.t = (performance.now() - B.t0) / 1000; B.seen = performance.now();
        tone([[300, 0.1], [200, 0.12], [120, 0.3]]);
        say(line('seen'), 'bad');
        fx.alarm = 1; fx.shake = 1;
        let r = $('sw-root'); if (r) { r.classList.remove('sw-hit'); void r.offsetWidth; r.classList.add('sw-hit'); }
        render(); renderBar();
    }
    function useTool(id) {
        if (!B || B.state !== 'play' || B.used[id] || !has((TOOLS.find(t => t.id === id) || {}).part)) return false;
        if (id === 'sight') { B.armSight = !B.armSight; tone(B.armSight ? [[880, 0.04]] : [[440, 0.04]]); renderBar(); return true; }
        if (id === 'scan') {
            // finds the biggest safe bit to open for you
            let best = -1;
            for (let i = 0; i < B.w * B.h; i++) if (!B.open[i] && !B.mine[i] && !B.flag[i] && B.cnt[i] === 0) { best = i; break; }
            if (best < 0) for (let i = 0; i < B.w * B.h; i++) if (!B.open[i] && !B.mine[i] && !B.flag[i]) { best = i; break; }
            if (best < 0) return false;
            B.used.scan = true; openCell(best); say(line('scanned'), 'win');
        }
        if (id === 'bucket') {
            let c = hover >= 0 ? hover : cursor;
            B.used.bucket = true;
            [c].concat(nbrs(c)).forEach(j => { if (B.mine[j]) { B.flag[j] = 1; B.flagAt[j] = performance.now(); B.taped[j] = 1; } else if (!B.open[j]) openCell(j, true); });
            say(line('bucketed'), 'win'); tone([[300, 0.05], [200, 0.2]], 'sawtooth'); render(); renderBar();
        }
        renderBar();
        return true;
    }

    const T = 16;
    let S = 2, K = 1, gl = null, prog = null, tex = null, uni = {}, sc = null, fx = { alarm: 0, clear: 0, shake: 0 };
    const calm = () => document.documentElement.classList.contains('reduce-motion');
    const PRINT = { d: '#123a7a', D: '#1d4f9a', e: '#3a70c8', a: '#0b2550', s: '#0d2a5c', S: '#163a76', L: '#204a8a', k: '#081a40', x: '#2a5aa8', X: '#4a7ac8', w: '#cfe8ff', W: '#9ac8ff' };
    function glSetup(canvas) {
        try { gl = canvas.getContext('webgl', { premultipliedAlpha: false, antialias: false }); } catch (e) { gl = null; }
        if (!gl) return false;
        const sh = (type, src) => { let o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
        let vs = sh(gl.VERTEX_SHADER, 'attribute vec2 p; varying vec2 uv; void main(){ uv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5); gl_Position = vec4(p, 0.0, 1.0); }');
        let fs = sh(gl.FRAGMENT_SHADER, [
            'precision mediump float; uniform sampler2D tx; uniform vec2 res; uniform float time, alarm, clear, shake; varying vec2 uv;',
            'float h(float n){ return fract(sin(n) * 43758.5453); }',
            'float h2(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }',
            'void main(){',
            ' vec2 cc = uv - 0.5; float r2 = dot(cc, cc); vec2 p = 0.5 + cc * (1.0 + 0.035 * r2);',
            ' p += vec2(h(floor(time * 30.0)) - 0.5, h(floor(time * 30.0) + 7.0) - 0.5) * 0.012 * shake;',
            ' if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }',
            ' float roll = fract(time * 0.06); float tr = exp(-abs(p.y - roll) * 90.0);',
            ' p.x += tr * 0.004 * sin(p.y * 900.0 + time * 40.0) + alarm * 0.006 * step(0.85, h(floor(p.y * 60.0) + floor(time * 20.0)));',
            ' float ab = 0.0009 + 0.005 * alarm;',
            ' vec3 col = vec3(texture2D(tx, p + vec2(ab, 0.0)).r, texture2D(tx, p).g, texture2D(tx, p - vec2(ab, 0.0)).b);',
            ' vec3 b = vec3(0.0); vec2 px = 1.0 / res;',
            ' for (int i = 0; i < 10; i++) { float a = float(i) * 0.6283; vec2 o = vec2(cos(a), sin(a));',
            '  b += max(texture2D(tx, p + o * px * 4.0).rgb - 0.35, 0.0) * 0.6 + max(texture2D(tx, p + o * px * 11.0).rgb - 0.35, 0.0) * 0.4; }',
            ' col += b / 10.0 * 1.6;',
            ' col = col * 1.18 + 0.025;',
            ' col += tr * 0.06;',
            ' col *= 0.9 + 0.1 * sin(p.y * res.y * 1.5708);',
            ' col += (h2(p * res + floor(time * 24.0)) - 0.5) * 0.06;',
            ' float pu = alarm * (0.6 + 0.4 * sin(time * 10.0));',
            ' col = mix(col, col * vec3(1.15, 0.4, 0.42) + vec3(0.25, 0.0, 0.03) * pu, alarm * 0.85);',
            ' float d = (p.x + p.y * 0.6) - clear * 2.4 + 0.3; col += vec3(1.0, 0.95, 0.8) * exp(-d * d * 60.0) * step(0.001, clear) * step(clear, 0.999) * 0.8;',
            ' float v = smoothstep(0.85, 0.3, length(cc)); col *= mix(0.55, 1.0, v);',
            ' gl_FragColor = vec4(col, 1.0);',
            '}'].join('\n'));
        if (!vs || !fs) { gl = null; return false; }
        prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { gl = null; return false; }
        gl.useProgram(prog);
        let buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        let loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        ['res', 'time', 'alarm', 'clear', 'shake'].forEach(k => uni[k] = gl.getUniformLocation(prog, k));
        sc = document.createElement('canvas');
        return true;
    }
    function post(now) {
        if (!gl) return;
        gl.viewport(0, 0, cv.width, cv.height);
        gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sc);
        gl.uniform2f(uni.res, cv.width, cv.height); gl.uniform1f(uni.time, calm() ? 3 : now / 1000);
        gl.uniform1f(uni.alarm, fx.alarm); gl.uniform1f(uni.clear, fx.clear); gl.uniform1f(uni.shake, calm() ? 0 : fx.shake);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    function sizeCanvas() {
        if (!cv || !B) return;
        let wrap = $('sw-wrap'), room = Math.max(160, (wrap ? wrap.clientWidth : 600) - 24), top = wrap ? wrap.getBoundingClientRect().top : 470;
        let tall = wrap && wrap.clientHeight > 40 ? wrap.clientHeight - 24 : os.isPhone() ? 9999 : Math.max(220, window.innerHeight - Math.max(120, top) - 100);
        let fitS = Math.min(room / (B.w * T), tall / (B.h * T), 3);
        // whole pixel sizes or the pixel art goes blurry
        S = fitS >= 1 && Math.floor(fitS) / fitS > 0.78 ? Math.floor(fitS) : Math.max(0.6, fitS);
        K = Math.max(1, Math.ceil(S - 0.001));
        cv.width = B.w * T * K; cv.height = B.h * T * K;
        cv.style.width = Math.round(B.w * T * S) + 'px'; cv.style.height = Math.round(B.h * T * S) + 'px';
        cv.style.setProperty('image-rendering', S === K && !gl ? 'pixelated' : 'auto');
        if (sc) { sc.width = cv.width; sc.height = cv.height; }
        cx = (sc || cv).getContext('2d');
        cx.setTransform(K, 0, 0, K, 0, 0); cx.imageSmoothingEnabled = false;
    }
    function hash(i) { let h = (i * 2654435761) >>> 0; h ^= h >>> 13; h = Math.imul(h, 1274126177) >>> 0; return (h & 0xffff) / 65536; }
    function render() { if (!raf && cv) raf = requestAnimationFrame(draw); }
    let neonC = '#ff2d6f', neonAt = 0;
    function neon() { let n = performance.now(); if (n - neonAt > 1000) { neonAt = n; try { neonC = getComputedStyle(document.documentElement).getPropertyValue('--neon-primary').trim() || neonC; } catch (e) {} } return neonC; }
    function tile(name, x0, y0, sw, s) { if (typeof os.spriteDraw === 'function') os.spriteDraw(cx, 'sweep/' + name, x0, y0, s || 1, sw); }
    const roofOf = h => 'roof' + (h < 0.7 ? 0 : h < 0.76 ? 1 : h < 0.81 ? 2 : h < 0.89 ? 3 : h < 0.94 ? 4 : 5);
    let lastT = 0;
    function draw(t) {
        raf = 0;
        if (!cv || !B || !cv.isConnected) return;
        let now = performance.now(), dt = Math.min(0.1, (now - (lastT || now)) / 1000); lastT = now;
        let x = cx, lk = look(), anim = !!gl && !calm(), sw = lk === 'print' ? PRINT : null, lostAt = B.seen;
        fx.alarm = Math.max(B.state === 'lost' ? 0.35 : 0, fx.alarm - dt * 0.5);
        fx.shake = Math.max(0, fx.shake - dt * 2.2);
        if (fx.clear > 0 && fx.clear < 1) { fx.clear = Math.min(1, fx.clear + dt * 0.8); anim = true; }
        x.setTransform(K, 0, 0, K, 0, 0); x.imageSmoothingEnabled = false;
        x.fillStyle = '#050307'; x.fillRect(0, 0, B.w * T, B.h * T);
        let hx = hover >= 0 ? hover : -1, ring = hx >= 0 && B.open[hx] && B.cnt[hx] && B.state === 'play' ? nbrs(hx) : null;
        let ringFlags = ring ? ring.filter(j => B.flag[j]).length : 0;
        let hitX = B.hit >= 0 ? B.hit % B.w : 0, hitY = B.hit >= 0 ? Math.floor(B.hit / B.w) : 0;
        for (let i = 0; i < B.w * B.h; i++) {
            let x0 = (i % B.w) * T, y0 = Math.floor(i / B.w) * T, h = hash(i);
            let lostMine = B.state === 'lost' && B.mine[i] && now - lostAt > Math.hypot(i % B.w - hitX, Math.floor(i / B.w) - hitY) * 45;
            if (B.state === 'lost' && B.mine[i] && !lostMine) anim = true;
            let age = B.open[i] ? (now - B.openAt[i]) / 170 : 1;
            if (B.open[i] && age >= 0) {
                let n = B.cnt[i];
                if (n && !B.mine[i]) { tile('street' + (h < 0.5 ? 0 : 1), x0, y0, sw); if (age >= 0.45) tile('n' + n, x0, y0, sw); }
                else tile('street' + (h < 0.7 ? 0 : h < 0.82 ? 1 : h < 0.93 ? 2 : 3), x0, y0, sw);
                let up = i >= B.w && !B.open[i - B.w], left = i % B.w > 0 && !B.open[i - 1];
                if (up) {
                    x.fillStyle = sw ? '#c9c2b0' : '#0d0a14'; x.fillRect(x0, y0, T, 3);
                    for (let k = 0; k < 3; k++) if (hash(i * 3 + k + 11) < 0.5) { x.fillStyle = sw ? '#6a6458' : hash(i + k * 7) < 0.75 ? '#ffd678' : neon(); x.fillRect(x0 + 2 + k * 5, y0 + 1, 2, 1); }
                    x.fillStyle = 'rgba(0,0,0,0.38)'; x.fillRect(x0, y0 + 3, T, 2);
                }
                if (left) { x.fillStyle = 'rgba(0,0,0,0.34)'; x.fillRect(x0, y0 + (up ? 3 : 0), 2, T - (up ? 3 : 0)); }
                if (age < 1) {
                    anim = true;
                    let k = 1 - age, sz = Math.max(0, k * k);
                    if (sz > 0.05) { x.globalAlpha = sz; tile(roofOf(h), x0 + T * (1 - sz) / 2, y0 + T * (1 - sz) / 2, sw, sz); x.globalAlpha = 1; }
                    x.globalAlpha = 0.5 * k; x.fillStyle = '#fff3c4'; x.fillRect(x0, y0, T, T); x.globalAlpha = 1;
                }
            } else if (B.open[i]) {
                anim = true; tile(roofOf(h), x0, y0, sw);
            } else if (lostMine && !B.flag[i]) {
                tile(i === B.hit ? 'watcherHit' : 'watcher', x0, y0, sw); anim = true;
            } else if (B.flag[i] && now >= B.flagAt[i]) {
                let fa = (now - B.flagAt[i]) / 200, dy = fa < 1 ? -Math.round(7 * (1 - fa) * (1 - fa) - (fa > 0.7 ? 1 : 0)) : 0;
                if (fa < 1) anim = true;
                tile(roofOf(h), x0, y0, sw);
                tile(B.state === 'lost' && !B.mine[i] ? 'wrong' : (h < 0.5 ? 'tape' : 'tape2'), x0, y0 + dy, sw);
            } else {
                if (B.flag[i]) anim = true;
                tile(roofOf(h), x0, y0, sw);
                if (B.mark[i]) { x.fillStyle = 'rgba(0,0,0,0.55)'; x.fillRect(x0 + 4, y0 + 3, 8, 10); x.fillStyle = '#ffd76a'; x.font = 'bold 10px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('?', x0 + 8, y0 + 8.5); }
            }
            if ((i === hover && B.state === 'play' && !B.open[i]) || (i === cursor && document.activeElement === cv)) tile('cursor', x0, y0);
        }
        if (ring) {
            let col = ringFlags === B.cnt[hx] ? '#7dffb0' : ringFlags > B.cnt[hx] ? '#ff3344' : neon();
            x.strokeStyle = col; x.lineWidth = 1; x.globalAlpha = 0.9;
            ring.forEach(j => { if (B.open[j]) return; let jx = (j % B.w) * T, jy = Math.floor(j / B.w) * T; x.strokeRect(jx + 1.5, jy + 1.5, T - 3, T - 3); });
            x.globalAlpha = 0.22; x.fillStyle = col; x.fillRect((hx % B.w) * T, Math.floor(hx / B.w) * T, T, T); x.globalAlpha = 1;
        }
        // you got seen. all the cameras turn to look at you. spooky
        if (B.state === 'lost') {
            for (let i = 0; i < B.w * B.h; i++) {
                if (!B.mine[i] || B.flag[i]) continue;
                let cxp = (i % B.w) * T + T / 2, cyp = Math.floor(i / B.w) * T + T / 2, a = Math.sin(now / 500 + i) * 0.9 - 0.6, len = T * (i === B.hit ? 3.2 : 2.2);
                if (now - lostAt < Math.hypot(i % B.w - hitX, Math.floor(i / B.w) - hitY) * 45) continue;
                x.globalAlpha = i === B.hit ? 0.32 : 0.16; x.fillStyle = '#ff2030';
                for (let r = 4; r < len; r += 2) { let half = r * 0.42; for (let k = -half; k <= half; k += 2) { let px = Math.round((cxp + Math.cos(a) * r - Math.sin(a) * k) / 2) * 2, py = Math.round((cyp + Math.sin(a) * r + Math.cos(a) * k) / 2) * 2; x.fillRect(px, py, 2, 2); } }
                x.globalAlpha = 1;
            }
            anim = true;
        }
        if (lk === 'rain') { anim = true; x.fillStyle = 'rgba(170,200,255,0.35)'; for (let k = 0; k < B.w * 3; k++) { let rx = Math.floor((hash(k) * B.w * T + now * 0.01 * (1 + hash(k + 1))) % (B.w * T)), ry = Math.floor((now * (0.12 + hash(k + 2) * 0.08) + hash(k + 3) * 900) % (B.h * T + 20)) - 10; x.fillRect(rx, ry, 1, 4); } }
        if (B.state === 'won' && now - B.wonAt > 400) { x.fillStyle = 'rgba(0,0,0,' + Math.min(0.35, (now - B.wonAt - 400) / 1500).toFixed(3) + ')'; x.fillRect(0, 0, B.w * T, B.h * T); if (now - B.wonAt < 2400) anim = true; }
        hud(x, now);
        post(now);
        if (anim && !document.hidden && !asleep) raf = requestAnimationFrame(draw);
    }
    function hud(x, now) {
        let w = cv.width, h = cv.height, fs = Math.max(11, Math.round(Math.min(18, w / 30)));
        x.setTransform(1, 0, 0, 1, 0, 0);
        x.font = '600 ' + fs + 'px "Courier New", monospace'; x.textBaseline = 'top'; x.textAlign = 'left';
        let pad = fs * 0.8, sh = (t, tx, ty, col) => { x.fillStyle = 'rgba(0,0,0,0.65)'; x.fillText(t, tx + 1, ty + 1); x.fillStyle = col; x.fillText(t, tx, ty); };
        let lost = B.state === 'lost', blink = calm() || Math.floor(now / 600) % 2 === 0;
        if (blink) { x.fillStyle = lost ? '#ff2030' : '#ff3344'; x.beginPath(); x.arc(pad + fs * 0.4, pad + fs * 0.5, fs * 0.33, 0, 7); x.fill(); }
        sh(lost ? 'ALERT' : 'REC', pad + fs, pad, lost ? '#ff6070' : 'rgba(255,255,255,0.85)');
        x.textAlign = 'right';
        sh('CAM ' + String(1 + BOARDS.findIndex(b => b.id === B.bd.id)).padStart(2, '0') + ' // ' + (named(B.bd.id).en || B.bd.id).toUpperCase(), w - pad, pad, 'rgba(255,255,255,0.7)');
        let d = new Date(), z = n => String(n).padStart(2, '0');
        x.textBaseline = 'bottom';
        sh(d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + '  ' + z(d.getHours()) + ':' + z(d.getMinutes()) + ':' + z(d.getSeconds()), w - pad, h - pad, 'rgba(255,255,255,0.7)');
        x.textAlign = 'left';
        let left = B.n - B.flag.reduce((a, b) => a + b, 0);
        sh(B.state === 'won' ? 'ALL CLEAR' : lost ? 'SIGNAL LOST' : '◉ ' + Math.max(0, left), pad, h - pad, B.state === 'won' ? '#ffd76a' : lost ? '#ff6070' : 'rgba(255,255,255,0.7)');
        if (B.state === 'won' && now - B.wonAt > 700) {
            let a = Math.min(1, (now - B.wonAt - 700) / 400), big = Math.round(fs * 2.4), star = B.t <= B.bd.par;
            x.globalAlpha = a * 0.75; x.fillStyle = '#000'; x.fillRect(0, h / 2 - big * 1.4, w, big * 2.6);
            x.globalAlpha = a; x.fillStyle = '#ffd76a'; x.fillRect(0, h / 2 - big * 1.4, w, Math.max(1, fs / 8)); x.fillRect(0, h / 2 + big * 1.2, w, Math.max(1, fs / 8));
            x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '900 ' + big + 'px "Courier New", monospace';
            sh('掃除完了', w / 2, h / 2 - big * 0.7, '#fff3c4');
            x.font = '600 ' + Math.round(fs * 1.2) + 'px "Courier New", monospace';
            sh((Math.round(B.t * 10) / 10) + 's' + (star ? '  ★ UNDER PAR' : '  //  PAR ' + B.bd.par + 's'), w / 2, h / 2 + big * 0.35, star ? '#ffd76a' : 'rgba(255,255,255,0.8)');
            x.globalAlpha = 1;
        }
        x.setTransform(K, 0, 0, K, 0, 0);
    }
    let idle = 0, root = null, asleep = false, style = null;
    function tick() { clearInterval(idle); idle = setInterval(() => { if (!cv || !cv.isConnected) { clearInterval(idle); return; } if (gl && !calm() && !document.hidden && !asleep) render(); }, 66); }
    function renderBar() {
        let el = $('sw-bar'); if (!el || !B) return;
        let flags = 0; for (let i = 0; i < B.w * B.h; i++) flags += B.flag[i];
        let tools = TOOLS.filter(t => has(t.part)).map(t => '<button class="sw-tool" data-act="tool" data-arg="' + t.id + '"' + (B.used[t.id] || B.state !== 'play' ? ' disabled' : '') + (t.id === 'sight' ? ' aria-pressed="' + !!B.armSight + '"' : '') + '>' + L(t.id) + (t.id === 'sight' ? (B.used.sight ? ' ✕' : B.armSight ? ' ◉' : ' ○') : '') + '</button>').join('');
        let over = B.state === 'play' && B.t > B.bd.par;
        el.innerHTML = '<span class="sw-chip">👁 <b>' + Math.max(0, B.n - flags) + '</b></span><span class="sw-chip' + (over ? ' over' : '') + '">⏱ <b>' + Math.floor(B.t) + '</b>s <span class="sw-par">/ ' + B.bd.par + '</span></span>' + (D.best[B.bd.id] ? '<span class="sw-chip dim">' + esc(line('best', D.best[B.bd.id]).jp) + '</span>' : '') + '<span class="sw-gap"></span>' + tools +
            '<button class="sw-mode sw-marks' + (D.marks ? ' on' : '') + '" data-act="marks" aria-pressed="' + !!D.marks + '" title="' + esc(line('marks').en) + '">?</button>' +
            '<button class="sw-mode' + (flagMode ? ' on' : '') + '" data-act="mode" aria-pressed="' + flagMode + '">' + (flagMode ? L('flag') : L('dig')) + '</button><button class="sw-btn" data-act="again">↻</button>';
        let st = $('sw-stats'), id = B.bd.id, pl = D.played[id] || 0;
        if (st) st.innerHTML = '最速 <b>' + (D.best[id] ? D.best[id] + 's' : '-') + '</b>' + (D.stars && D.stars[id] ? ' <b class="sw-star">★</b>' : '') + ' <span>//</span> 規定 <b>' + B.bd.par + 's</b> <span>//</span> 突破 <b>' + (D.clears[id] || 0) + '</b><span class="sw-of">/' + pl + '</span>';
    }
    function renderPick() {
        let el = $('sw-pick'); if (!el) return;
        let bs = ownedBoards(), ls = LOOKS.filter(l => has(l.part));
        el.innerHTML = '<div class="sw-wall n' + bs.length + '">' + bs.map(b => { let n = named(b.id); return '<button class="sw-mon' + (B && B.bd.id === b.id ? ' on' : '') + '" data-act="board" data-arg="' + b.id + '" title="' + esc(n.sub) + '"><span class="sw-scr"><canvas data-feed="' + b.id + '" aria-hidden="true"></canvas></span><span class="sw-osd"><span class="sw-bk">' + esc(n.jp.charAt(0)) + '</span><span>' + two(n) + '<em>' + b.w + '×' + b.h + ', ' + esc(line('cams', b.n).en) + (D.best[b.id] ? ' // ' + D.best[b.id] + 's' : '') + (D.stars && D.stars[b.id] ? ' ★' : '') + '</em></span></span></button>'; }).join('') + '</div>' +
            (ls.length > 1 ? '<div class="sw-looks"><span class="sw-label">' + L('looks') + '</span>' + ls.map(l => '<button class="sw-look l-' + l.id + (look() === l.id ? ' on' : '') + '" data-act="look" data-arg="' + l.id + '" aria-label="' + l.id + '"></button>').join('') + '</div>' : '');
    }
    function say(parts, cls) {
        let m = $('sw-msg'); if (!m) return;
        if (!Array.isArray(parts)) parts = [parts];
        m.innerHTML = parts.map(p => '<span>' + two(p) + '</span>').join('<span class="sw-sep">//</span>');
        m.className = 'sw-msg' + (cls ? ' ' + cls : '');
    }

    function cellAt(e) { let r = cv.getBoundingClientRect(), gx = Math.floor((e.clientX - r.left) / (r.width / B.w)), gy = Math.floor((e.clientY - r.top) / (r.height / B.h)); return gx < 0 || gy < 0 || gx >= B.w || gy >= B.h ? -1 : gy * B.w + gx; }
    let press = 0, pressCell = -1, longDone = false;
    function wire() {
        let root = $('sw-root'); if (!root || root.dataset.wired) return;
        root.dataset.wired = '1';
        root.addEventListener('click', e => {
            let b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
            if (typeof os.clickAudio === 'function') os.clickAudio();
            let a = b.dataset.act, arg = b.dataset.arg;
            if (a === 'board') { newBoard(arg); renderPick(); renderBar(); let f = FEED[arg]; if (f) f.noise = 1; tone([[90, 0.05], [1700, 0.025]], 'sawtooth'); }
            else if (a === 'again') { newBoard(B ? B.bd.id : D.board); renderPick(); renderBar(); }
            else if (a === 'look') { D.look = arg; saveD(); renderPick(); render(); }
            else if (a === 'mode') { flagMode = !flagMode; renderBar(); }
            else if (a === 'marks') { D.marks = !D.marks; saveD(); renderBar(); }
            else if (a === 'tool') useTool(arg);
            else if (a === 'play') view(true);
            else if (a === 'menu') view(false);
        });
        cv = $('sw-cv');
        gl = null; sc = null; glSetup(cv); tick();
        if (window.ResizeObserver) { let rt = 0; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(onResize, 60); }).observe($('sw-wrap')); }
        cv.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); });
        cv.addEventListener('pointerdown', e => {
            if (!B) return; let i = cellAt(e); if (i < 0) return;
            pressCell = i; longDone = false;
            if (e.button === 2) { toggleFlag(i); longDone = true; return; }
            clearTimeout(press); press = setTimeout(() => { if (pressCell === i && !B.open[i]) { toggleFlag(i); longDone = true; if (navigator.vibrate) navigator.vibrate(20); } }, 420);
        });
        cv.addEventListener('pointerup', e => { clearTimeout(press); if (!B || longDone || e.button === 2) return; let i = cellAt(e); if (i >= 0 && i === pressCell) act(i, e.shiftKey); pressCell = -1; });
        cv.addEventListener('pointermove', e => { if (!B) return; let i = cellAt(e); if (i !== hover) { hover = i; render(); } if (i !== pressCell) clearTimeout(press); });
        cv.addEventListener('pointerleave', () => { hover = -1; render(); clearTimeout(press); });
        cv.addEventListener('keydown', e => {
            if (!B) return; let k = e.key, x = cursor % B.w, y = Math.floor(cursor / B.w);
            if (k === 'ArrowLeft') x = (x - 1 + B.w) % B.w; else if (k === 'ArrowRight') x = (x + 1) % B.w; else if (k === 'ArrowUp') y = (y - 1 + B.h) % B.h; else if (k === 'ArrowDown') y = (y + 1) % B.h;
            else if (k === ' ' || k === 'Enter') { act(cursor, false); e.preventDefault(); return; } else if (k === 'f' || k === 'F') { toggleFlag(cursor); e.preventDefault(); return; } else return;
            cursor = y * B.w + x; e.preventDefault(); render();
        });
        cv.addEventListener('focus', render); cv.addEventListener('blur', render);
        window.addEventListener('resize', onResize);
    }
    function onResize() { if (B && $('sw-cv')) { sizeCanvas(); render(); } }
    // sizing it while its hidden = 0px. every time
    function view(play) {
        let h = $('sw-home'), p = $('sw-play'); if (!h || !p) return;
        h.hidden = play; p.hidden = !play;
        if (play) { if (!B || B.state !== 'play') newBoard(D.board); requestAnimationFrame(() => { sizeCanvas(); render(); let c = $('sw-cv'); if (c) c.focus({ preventScroll: true }); }); }
        else { renderPick(); renderBar(); }
        let v = play ? p : h; v.classList.remove('in'); void v.offsetWidth; v.classList.add('in');
    }
    // cctv wall. one telly per district and theyre all live
    const FEED = {}, G5 = { R: '110101110101101', E: '111100110100111', C: '011100100100011', A: '010101111101101', M: '101111111101101', ' ': '000000000000000', X: '101101010101101', ':': '000010000010000', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110', 4: '101101111001001', 5: '111100110001110', 6: '011100110101010', 7: '111001010010010', 8: '010101010101010', 9: '010101011001110' };
    // every telly looks like its own map now, not four of the same street
    function feedOf(id, cw) {
        if (FEED[id] && (!cw || FEED[id].cw === cw)) return FEED[id];
        let big = id === 'district', C = (cw || 12) * (big ? 2 : 1), Rw = big ? 14 : 7, T = 16, seed = [...id].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) % 2147483647 || 7, rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        let rowsOf = { alley: [3], street: [3, 4], district: [1, 5, 9, 13], mirror: [2, 5] }[id] || [3];
        let colOf = i => id === 'alley' ? false : id === 'district' ? i % 7 === 3 : id === 'mirror' ? i % 12 === 6 : false;
        let map = [];
        for (let j = 0; j < Rw; j++) { map.push([]); for (let i = 0; i < C; i++) { let st = rowsOf.includes(j) || colOf(i); map[j].push(st ? 'street' + Math.floor(rnd() * 4) : 'roof' + Math.floor(rnd() * 6)); } }
        if (id === 'mirror') for (let j = 0; j < Rw; j++) for (let i = 0; i < C / 2; i++) map[j][C - 1 - i] = map[j][i];
        let roofs = []; for (let j = 0; j < Rw; j++) for (let i = 0; i < C; i++) if (/roof/.test(map[j][i]) && (rowsOf.includes(j - 1) || rowsOf.includes(j + 1))) roofs.push([i, j]);
        let nCam = Math.round(({ alley: 1.5, street: 4, district: 16, mirror: 2 }[id] || 2) * C / (big ? 24 : 12)), cams = [];
        for (let k = 0; k < nCam && roofs.length; k++) { let [i, j] = roofs.splice(Math.floor(rnd() * roofs.length), 1)[0], up = rowsOf.includes(j - 1); cams.push({ x: i * T + 8, y: j * T + 8, base: up ? -Math.PI / 2 : Math.PI / 2, ph: rnd() * 6, hit: 0, a: 0 }); }
        if (id === 'mirror') cams = cams.concat(cams.map(c => Object.assign({}, c, { x: C * T - c.x, ph: c.ph + Math.PI, mir: true })));
        let folk = [], cols = ['#3ad8ff', '#46f08a', '#ff4d8d', '#b46bff', '#ffa43a', '#3fe0c8', '#f4f4f4'], per = { alley: 1, street: 3, district: 3, mirror: 2 }[id] || 2;
        rowsOf.forEach(row => { for (let k = 0; k < per * C / (big ? 24 : 12); k++) folk.push({ row, x: rnd() * C * T, v: (rnd() < 0.5 ? -1 : 1) * (7 + rnd() * 12), col: cols[Math.floor(rnd() * cols.length)], seen: 0 }); });
        if (id === 'mirror') folk = folk.concat(folk.map(f => Object.assign({}, f, { x: C * T - f.x, v: -f.v, mir: true })));
        // little map of the real board for the corner. dots are cams
        let bd = BOARDS.find(b => b.id === id) || { w: 9, h: 9, n: 10 }, mini = [];
        for (let k = 0; k < bd.n; k++) mini.push([Math.floor(rnd() * bd.w), Math.floor(rnd() * bd.h)]);
        return (FEED[id] = { cw, C, Rw, T, map, cams, folk, t: rnd() * 10, noise: 0, z: big ? 2 : 1, bd, mini, lamp: rnd() * C * T });
    }
    function feedDraw(cvf, id, on, dt, n, cw) {
        let F = feedOf(id, cw), T = F.T, W = F.C * T, H = F.Rw * T, x = cvf.getContext('2d'), still = calm(), sw = look() === 'print' ? PRINT : null;
        if (cvf.width !== W || cvf.height !== H) { cvf.width = W; cvf.height = H; }
        F.t += dt; F.noise = Math.max(0, F.noise - dt * 2.5);
        for (let j = 0; j < F.Rw; j++) for (let i = 0; i < F.C; i++) os.spriteDraw(x, 'sweep/' + F.map[j][i], i * T, j * T, 1, sw);
        const cone = (c, px_, py) => { let dx = px_ - c.x, dy = py - c.y, d = Math.hypot(dx, dy); if (d > 70 || d < 6) return false; let da = Math.atan2(dy, dx) - c.a; da = Math.atan2(Math.sin(da), Math.cos(da)); return Math.abs(da) < 0.38; };
        F.cams.forEach(c => { c.a = c.base + (still ? 0.4 : Math.sin(F.t * 0.7 + c.ph)) * 0.95 * (c.mir ? -1 : 1); c.hit = Math.max(0, c.hit - dt); });
        F.folk.forEach(f => {
            f.x += f.v * dt; if (f.x < -6) f.x = W + 4; if (f.x > W + 6) f.x = -4;
            let fy = f.row * T + 5, spot = F.cams.some(c => cone(c, f.x, fy + 2));
            if (spot) { f.seen = 0.6; F.cams.forEach(c => { if (cone(c, f.x, fy + 2)) c.hit = 0.5; }); }
            f.seen = Math.max(0, f.seen - dt);
            let bob = Math.floor(F.t * 8 + f.x) % 2, fx = Math.round(f.x);
            x.fillStyle = '#08060c'; x.fillRect(fx - 2, fy - 1 + bob, 5, 7); x.fillStyle = f.seen > 0 ? '#ff2030' : f.col; x.fillRect(fx - 1, fy + bob, 3, 5); x.fillStyle = '#e6e1d8'; x.fillRect(fx - 1, fy + bob, 3, 2);
            if (f.seen > 0) { x.fillStyle = '#ff2030'; x.fillRect(fx, fy - 6, 1, 3); x.fillRect(fx, fy - 2, 1, 1); }
        });
        F.cams.forEach(c => { x.fillStyle = c.hit > 0 ? 'rgba(255,32,48,0.32)' : 'rgba(255,214,120,0.13)'; x.beginPath(); x.moveTo(c.x, c.y); x.arc(c.x, c.y, 70, c.a - 0.38, c.a + 0.38); x.closePath(); x.fill(); os.spriteDraw(x, 'sweep/' + (c.hit > 0 ? 'watcherHit' : 'watcher'), c.x - 8, c.y - 8, 1, sw); });
        if (id === 'mirror') {
            x.fillStyle = 'rgba(180,220,255,0.35)'; for (let y = 0; y < H; y += 4) x.fillRect(W / 2, y, 1, 2);
            x.fillStyle = 'rgba(120,200,255,0.07)'; x.fillRect(W / 2, 0, W / 2, H);
            // the edges wrap, so arrows going off one side + coming in the other
            if (Math.floor(F.t * 2) % 2 || still) { x.fillStyle = '#9fe6ff'; for (let row of [2, 5]) { let y = row * T + 8; for (let q = 0; q < 3; q++) { x.fillRect(2 + q, y - q, 1, q * 2 + 1); x.fillRect(W - 3 - q, y - q, 1, q * 2 + 1); } } }
        }
        if (id === 'alley') {
            // tight walls + one lamp on its last legs
            x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(0, 0, W, 2 * T); x.fillRect(0, 5 * T, W, 2 * T);
            x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(0, 2 * T, W, 4); x.fillRect(0, 5 * T - 4, W, 4);
            let fl = still ? 0.8 : (Math.sin(F.t * 13) > -0.6 ? 0.8 : 0.15) * (Math.random() < 0.03 ? 0.2 : 1), g = x.createRadialGradient(F.lamp, 3 * T, 2, F.lamp, 3 * T + 8, 46);
            g.addColorStop(0, 'rgba(255,200,120,' + 0.35 * fl + ')'); g.addColorStop(1, 'rgba(255,200,120,0)'); x.fillStyle = g; x.fillRect(F.lamp - 50, 2 * T - 10, 100, 3 * T + 20);
            x.fillStyle = 'rgba(255,230,170,' + fl + ')'; x.fillRect(F.lamp - 1, 2 * T + 6, 3, 2);
        }
        if (id === 'street') { x.fillStyle = 'rgba(255,214,120,0.5)'; for (let i = (Math.floor(F.t * 20) % 16) - 16; i < W; i += 16) x.fillRect(i, 4 * T, 8, 1); }
        x.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 0; y < H; y += 2) x.fillRect(0, y, W, 1);
        if (!on) { x.fillStyle = 'rgba(4,3,8,0.5)'; x.fillRect(0, 0, W, H); }
        let nz = on ? F.noise : 0.12 + F.noise;
        if (nz > 0 && !still) for (let k = 0; k < 40 * nz; k++) { x.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.5)'; x.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 6, 1); }
        if (!still && Math.random() < (on ? 0.015 : 0.05)) { let y = Math.floor(Math.random() * H); x.drawImage(cvf, 0, y, W, 3, (Math.random() - 0.5) * 8, y, W, 3); }
        const txt = (s, px_, py, col) => { x.fillStyle = col; [...String(s)].forEach((ch, k) => { let g = G5[ch] || G5[' ']; for (let q = 0; q < 15; q++) if (g[q] === '1') x.fillRect(px_ + k * 4 + q % 3, py + Math.floor(q / 3), 1, 1); }); };
        let d = new Date(), hh = [d.getHours(), d.getMinutes(), d.getSeconds()].map(v => String(v).padStart(2, '0')).join(':'), z = F.z;
        x.save(); x.scale(z, z); let Wz = W / z, Hz = H / z;
        x.fillStyle = 'rgba(8,6,12,0.8)'; x.fillRect(2, 2, 49, 9); x.fillRect(Wz - 36, 2, 34, 9);
        if (on && (Math.floor(F.t * 2) % 2 || still)) { x.fillStyle = '#ff2030'; x.fillRect(5, 4, 4, 5); }
        txt((on ? 'REC' : '   ') + ' CAM 0' + n, 11, 4, on ? '#e6e1d8' : '#8a8494'); txt(hh, Wz - 34, 4, '#e6e1d8');
        let bd = F.bd, mw = bd.w + 4, mh = bd.h + 10, mx = Wz - mw - 2, my = Hz - mh - 2;
        x.fillStyle = 'rgba(8,6,12,0.85)'; x.fillRect(mx, my, mw, mh); x.fillStyle = 'rgba(230,225,216,0.18)'; x.fillRect(mx + 2, my + 8, bd.w, bd.h);
        txt(bd.w + 'X' + bd.h, mx + 2, my + 2, '#8a8494');
        let blink = Math.floor(F.t * 3);
        F.mini.forEach(([a, b], k) => { x.fillStyle = (k + blink) % 9 === 0 && on ? '#ff2030' : 'rgba(255,90,110,0.7)'; x.fillRect(mx + 2 + a, my + 8 + b, 1, 1); });
        if (bd.wrap) { x.fillStyle = '#9fe6ff'; x.fillRect(mx + 1, my + 8, 1, bd.h); x.fillRect(mx + 2 + bd.w, my + 8, 1, bd.h); }
        x.restore();
    }
    let feedRaf = 0, feedLast = 0;
    function feeds(now) {
        feedRaf = requestAnimationFrame(feeds);
        if (asleep || !root) return;
        let h = $('sw-home'); if (!h || h.hidden) return;
        let dt = feedLast ? Math.min(0.1, (now - feedLast) / 1000) : 0; feedLast = now;
        h.querySelectorAll('canvas[data-feed]').forEach((c, i) => {
            // whole feed in the telly, no cropping the rec dot off
            // wide tellys get a wider street
            let p = c.parentNode, cw = p.clientHeight ? Math.max(12, Math.min(28, Math.floor(7 * p.clientWidth / p.clientHeight))) : 12, F = feedOf(c.dataset.feed, cw), fw = F.C * 16, fh = F.Rw * 16, k = Math.min(p.clientWidth / fw, p.clientHeight / fh), w = Math.floor(fw * k) + 'px';
            if (k > 0 && c.style.width !== w) { c.style.width = w; c.style.height = Math.floor(fh * k) + 'px'; }
            feedDraw(c, c.dataset.feed, c.closest('.on') !== null, dt, i + 1, cw);
        });
    }
    function init() {
        loadD();
        wire();
        let lg = $('sw-logo'); if (lg) lg.innerHTML = L('title');
        let sb = $('sw-sub'); if (sb) sb.innerHTML = L('sub');
        let rs = $('sw-rsum'); if (rs) rs.textContent = '? 遊び方 // how it works';
        let go = $('sw-go'); if (go) go.innerHTML = '▶ ' + L('go');
        let mn = $('sw-menu'); if (mn) mn.innerHTML = '◀ ' + L('menu');
        let rt = $('sw-rtext'); if (rt) rt.innerHTML = esc(line('rules').jp) + '<br><i>' + esc(line('rules').en) + '</i>';
        newBoard(D.board);
        renderPick(); renderBar(); cancelAnimationFrame(feedRaf); feedRaf = requestAnimationFrame(feeds);
    }
    // lives in the games tablet now. it says go, I go
    os.gg = os.gg || {}; os.gg.hooks = os.gg.hooks || {};
    os.gg.hooks.sweep = {
        start(el) { root = el; asleep = false; style = css(); el.innerHTML = markup(); init(); },
        pause() { asleep = true; if (B && B.state === 'play') B.pausedAt = performance.now(); clearInterval(timer); cancelAnimationFrame(raf); raf = 0; },
        resume() {
            if (!asleep || !root) return; asleep = false;
            // dont count the time it was hidden
            if (B && B.pausedAt) { B.t0 += performance.now() - B.pausedAt; B.pausedAt = 0; }
            clearInterval(timer); timer = setInterval(() => { if (B && B.state === 'play') { B.t = (performance.now() - B.t0) / 1000; renderBar(); } }, 200);
            tick(); render();
        },
        best() { loadD(); let b = Object.values(D.clears || {}).reduce((a, n) => a + (+n || 0), 0); return b; },
        scores() { loadD(); return BOARDS.filter(b => D.played[b.id]).map(b => { let n = named(b.id); return { t: n.jp + ' ' + n.en, rows: [['★', D.best[b.id] ? D.best[b.id] + 's' : '-', (D.stars && D.stars[b.id]) ? 'par' : ''], ['✓', (D.clears[b.id] || 0) + ' / ' + D.played[b.id], ''], ['⏱', b.par + 's', 'par']] }; }); },
        stop() {
            cancelAnimationFrame(feedRaf); feedRaf = 0;
            clearInterval(idle); clearInterval(timer); clearTimeout(press); cancelAnimationFrame(raf); raf = 0;
            window.removeEventListener('resize', onResize);
            if (gl) { let lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext(); }
            if (style) style.remove();
            if (root) root.innerHTML = '';
            B = null; cv = null; gl = null; sc = null; root = null; style = null;
            delete os.sweep; delete os.gg.hooks.sweep;
        }
    };

    os.sweep = {
        state: () => B && { board: B.bd.id, w: B.w, h: B.h, n: B.n, state: B.state, opened: B.opened, left: safeLeft(), t: B.t, used: Object.assign({}, B.used), flags: B.flag.reduce((a, b) => a + b, 0) },
        start: id => newBoard(id), open: (x, y) => openCell(y * B.w + x), flag: (x, y) => toggleFlag(y * B.w + x), chord: (x, y) => chord(y * B.w + x), tool: id => useTool(id),
        mines: () => B ? Array.from(B.mine).map((m, i) => m ? i : -1).filter(i => i >= 0) : [], cnt: i => B.cnt[i], isOpen: i => !!B.open[i],
        solve: () => { if (!B) return; for (let i = 0; i < B.w * B.h; i++) if (!B.mine[i] && !B.open[i] && B.state === 'play') openCell(i, true); return B.state; },
        boards: () => ownedBoards().map(b => b.id), data: () => D, setT: s => { B.t0 = performance.now() - s * 1000; }
    };

    function css() {
        let st = document.createElement('style');
        st.textContent = `
            .sw { color: var(--text-main); padding: 12px 16px; box-sizing: border-box; height: 100%; display: flex; flex-direction: column; overflow: hidden; background: radial-gradient(ellipse at 50% -20%, color-mix(in srgb, var(--neon-primary) 18%, transparent), transparent 60%), linear-gradient(180deg, #0b0710, #040206); }
            .sw button { font-family: inherit; cursor: pointer; }
            .sw button:focus-visible, .sw canvas:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
            .sw i { font-style: normal; opacity: 0.6; font-size: 0.86em; letter-spacing: 1px; }
            .sw small { display: block; opacity: 0.6; font-size: 11px; line-height: 1.4; margin-top: 2px; }
            .sw-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; flex-wrap: wrap; padding-bottom: 8px; margin-bottom: 8px; border-bottom: 1px solid color-mix(in srgb, var(--neon-primary) 40%, transparent); }
            .sw-logo { font-size: 20px; letter-spacing: 3px; color: var(--neon-primary); text-shadow: 0 0 12px var(--neon-glow); } .sw-logo i { font-size: 12px; color: var(--text-main); }
            .sw-sub { font-size: 12px; color: var(--neon-secondary); max-width: 760px; }
            .sw-stats { font-size: 12px; } .sw-stats b { color: #fff; font-size: 14px; }
            .sw-msg { min-height: 20px; margin: 0 0 10px; padding: 8px 12px; border-left: 3px solid var(--neon-primary); background: rgba(255,255,255,0.04); font-size: 12px; line-height: 1.5; }
            .sw-msg.win { border-color: #ffd76a; color: #fff3c4; } .sw-msg.bad { border-color: #ff3344; color: #ff9aaa; }
            .sw-sep { opacity: 0.35; margin: 0 8px; }
            .sw-boards { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 6px; margin-bottom: 8px; }
            .sw-board { display: flex; gap: 8px; align-items: center; text-align: left; padding: 6px 8px; color: var(--text-main); border: 1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.3); font-size: 12px; }
            .sw-board b { color: #fff; } .sw-board em { display: block; font-style: normal; color: #ffd76a; font-size: 11px; margin-top: 3px; }
            .sw-board.on { border-color: var(--neon-primary); box-shadow: 0 0 12px var(--neon-glow); }
            .sw-bk { flex: 0 0 auto; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font: 900 18px serif; background: #1c1422; border: 1px solid var(--neon-primary); color: #fff; }
            .sw-looks { display: flex; gap: 8px; align-items: center; margin-bottom: 10px; } .sw-label { font-size: 11px; letter-spacing: 1px; color: var(--neon-secondary); margin-right: 4px; }
            .sw-look { width: 40px; height: 26px; padding: 0; border: 2px solid rgba(255,255,255,0.15); }
            .sw-look.l-city { background: linear-gradient(135deg, #1c1422, #0b0910); } .sw-look.l-rain { background: repeating-linear-gradient(100deg, #1c1422 0 4px, #2a3550 4px 5px); } .sw-look.l-print { background: #123a7a; }
            .sw-look.on { border-color: #fff; }
            .sw-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
            .sw-chip.over b { color: #ff6070; } .sw-par { opacity: 0.5; font-size: 11px; } .sw-star { color: #ffd76a !important; text-shadow: 0 0 8px #ffb000; } .sw-of { opacity: 0.5; }
            .sw-marks { min-width: 34px; font-weight: bold; }
            .sw-chip { font-size: 13px; padding: 4px 10px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); } .sw-chip b { color: #fff; font-size: 15px; } .sw-chip.dim { opacity: 0.6; font-size: 11px; }
            .sw-gap { flex: 1; }
            .sw-tool, .sw-mode, .sw-btn { padding: 6px 12px; font-size: 12px; color: var(--text-main); background: rgba(255,255,255,0.04); border: 1px solid var(--neon-primary); }
            .sw-tool { border-color: #ffd76a; } .sw-tool:disabled { opacity: 0.35; cursor: default; }
            .sw-mode.on { background: #f0c419; color: #16110e; border-color: #f0c419; } .sw-mode.on i { opacity: 0.8; }
            .sw-btn { font-size: 16px; padding: 3px 12px; }
            .sw-wrap { position: relative; overflow-x: auto; padding: 18px; border: 1px solid color-mix(in srgb, var(--neon-primary) 35%, transparent); background: radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.75)), repeating-linear-gradient(0deg, color-mix(in srgb, var(--neon-primary) 9%, transparent) 0 1px, transparent 1px 24px), repeating-linear-gradient(90deg, color-mix(in srgb, var(--neon-primary) 9%, transparent) 0 1px, transparent 1px 24px), #050307; box-shadow: inset 0 0 30px rgba(0,0,0,0.7); text-align: center; }
            .sw-wrap::before, .sw-wrap::after { content: ''; position: absolute; width: 14px; height: 14px; border: 2px solid var(--neon-primary); opacity: 0.7; pointer-events: none; } .sw-wrap::before { left: 6px; top: 6px; border-right: 0; border-bottom: 0; } .sw-wrap::after { right: 6px; bottom: 6px; border-left: 0; border-top: 0; }
            .sw-wrap canvas { display: inline-block; vertical-align: top; touch-action: manipulation; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; cursor: pointer; box-shadow: 0 0 0 2px #000, 0 0 0 3px color-mix(in srgb, var(--neon-primary) 45%, transparent), 0 0 30px color-mix(in srgb, var(--neon-primary) 20%, transparent), 0 14px 34px rgba(0,0,0,0.7); }
            .sw-rules { font-size: 11px; opacity: 0.7; margin: 10px 0 0; line-height: 1.6; } .sw-rules summary { cursor: pointer; color: var(--neon-secondary); }
            .sw-view { flex: 1; min-height: 0; display: flex; flex-direction: column; }
            .sw-view[hidden] { display: none; }
            .sw-view.in { animation: swIn 0.3s cubic-bezier(.2, 1.2, .4, 1); }
            @keyframes swIn { from { opacity: 0; transform: translateY(10px); } }
            .sw-home { overflow-y: auto; scrollbar-width: none; }
            .sw-head { align-items: center; }
            .sw-eye { position: relative; flex: 0 0 auto; width: 46px; height: 46px; border-radius: 50%; border: 2px solid var(--neon-primary); overflow: hidden; background: radial-gradient(circle, color-mix(in srgb, var(--neon-primary) 25%, #000) 30%, #000 70%); box-shadow: 0 0 14px var(--neon-glow); }
            .sw-eye::before { content: ''; position: absolute; inset: 0; background: conic-gradient(from 0deg, transparent 0 78%, color-mix(in srgb, var(--neon-primary) 75%, transparent) 100%); animation: swSpin 2.4s linear infinite; }
            .sw-eye i { position: absolute; left: 62%; top: 30%; width: 5px; height: 5px; border-radius: 50%; background: #ff3344; box-shadow: 0 0 6px #ff3344; animation: blink 1.2s steps(1) infinite; }
            @keyframes swSpin { to { transform: rotate(360deg); } }
            .sw-head > div:nth-child(2) { flex: 1; min-width: 0; }
            .sw-board { transition: transform 0.12s, border-color 0.12s; } .sw-board:hover { transform: translateY(-2px); border-color: var(--neon-primary); }
            #sw-pick { flex: 1; min-height: 150px; display: flex; flex-direction: column; }
            .sw-wall { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(2, 1fr); grid-auto-rows: minmax(0, 1fr); gap: 10px; margin-bottom: 8px; }
            .sw-wall.n1 { grid-template-columns: 1fr; max-width: 520px; } .sw-wall.n3 .sw-mon:last-child { grid-column: span 2; }
            .sw-mon { position: relative; display: flex; flex-direction: column; min-height: 0; padding: 8px 8px 34px; background: linear-gradient(180deg, #2a2632, #17141d); border: 0; border-radius: 6px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 0 #000, 0 6px 14px rgba(0,0,0,0.6); cursor: inherit; color: var(--text-main); font: inherit; text-align: left; transition: transform 0.12s; }
            .sw-mon::after { content: ''; position: absolute; right: 12px; bottom: 11px; width: 6px; height: 6px; border-radius: 50%; background: #3a1018; box-shadow: inset 0 0 0 1px #000; }
            .sw-mon.on::after { background: #ff2030; box-shadow: 0 0 8px #ff2030; }
            .sw-scr { flex: 1; min-height: 0; display: grid; place-items: center; overflow: hidden; background: radial-gradient(ellipse at 50% 40%, #0d0b12, #050407 75%); border-radius: 6px; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 6px 18px #000; }
            .sw-mon canvas { display: block; image-rendering: pixelated; border-radius: 10px / 14px; box-shadow: 0 0 0 2px #050407, inset 0 0 30px #000; filter: saturate(0.9); }
            .sw-mon.on canvas { animation: swOn .3s steps(6) both; }
            @keyframes swOn { 0% { transform: scaleY(0.02); filter: brightness(3); } 40% { transform: scaleY(1); filter: brightness(2); } 100% { transform: none; filter: none; } }
            @media (prefers-reduced-motion: reduce) { .sw-mon.on canvas { animation: none; } }
            .sw-mon.on canvas { box-shadow: 0 0 0 2px #050407, 0 0 0 4px var(--neon-primary), 0 0 22px var(--neon-glow); filter: none; }
            .sw-mon:hover { transform: translateY(-2px); } .sw-mon:active { transform: translateY(1px); }
            .sw-osd { position: absolute; left: 10px; right: 26px; bottom: 6px; display: flex; gap: 8px; align-items: center; font-size: 12px; white-space: nowrap; overflow: hidden; }
            .sw-osd em { display: block; font-style: normal; font-size: 10px; opacity: 0.6; }
            .sw-mon .sw-bk { width: 20px; height: 20px; font-size: 13px; }
            .sw-go { border-radius: 0; clip-path: polygon(4px 0, calc(100% - 4px) 0, calc(100% - 4px) 2px, calc(100% - 2px) 2px, calc(100% - 2px) 4px, 100% 4px, 100% calc(100% - 4px), calc(100% - 2px) calc(100% - 4px), calc(100% - 2px) calc(100% - 2px), calc(100% - 4px) calc(100% - 2px), calc(100% - 4px) 100%, 4px 100%, 4px calc(100% - 2px), 2px calc(100% - 2px), 2px calc(100% - 4px), 0 calc(100% - 4px), 0 4px, 2px 4px, 2px 2px, 4px 2px); }
            .sw-go { font-family: 'DotGothic16', monospace; box-shadow: 5px 5px 0 #000, 0 0 22px var(--neon-glow); }
            .sw-go { margin-top: auto; align-self: center; padding: 12px 40px; font-size: 18px; letter-spacing: 3px; color: #000; background: var(--neon-primary); border: 0; box-shadow: 0 0 22px var(--neon-glow), 0 4px 0 color-mix(in srgb, var(--neon-primary) 45%, #000); animation: swPulse 2s ease-in-out infinite; }
            .sw-go:active { transform: translateY(3px); box-shadow: 0 0 22px var(--neon-glow), 0 1px 0 color-mix(in srgb, var(--neon-primary) 45%, #000); }
            .sw-go i { color: #000; opacity: 0.7; }
            @keyframes swPulse { 50% { box-shadow: 0 0 34px var(--neon-glow), 0 4px 0 color-mix(in srgb, var(--neon-primary) 45%, #000); } }
            .sw-top { display: flex; gap: 8px; align-items: stretch; margin-bottom: 8px; }
            .sw-top .sw-msg { flex: 1; min-width: 0; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .sw-menu { font-size: 12px !important; padding: 4px 10px !important; white-space: nowrap; }
            .sw-play .sw-bar { margin-bottom: 8px; }
            .sw-play .sw-wrap { flex: 1; min-height: 0; display: grid; place-items: center; overflow: hidden; padding: 10px; }
            .sw.sw-hit { animation: swHit 0.5s steps(4); }
            @keyframes swHit { 25% { transform: translate(-4px, 1px); filter: hue-rotate(-30deg) saturate(2); } 50% { transform: translate(3px, -1px); } 75% { transform: translate(-1px, 2px); filter: none; } }
            html.reduce-motion .sw, html.reduce-motion .sw * { animation: none !important; }
        `;
        document.head.appendChild(st);
        return st;
    }
    function markup() {
        return `
            <div id="sw-root" class="sw" lang="ja">
                <div class="sw-view sw-home" id="sw-home">
                    <div class="sw-head"><div class="sw-eye" aria-hidden="true"><i></i></div><div><div class="sw-logo" id="sw-logo"></div><div class="sw-sub" id="sw-sub"></div></div><div class="sw-stats" id="sw-stats"></div></div>
                    <div id="sw-pick"></div>
                    <details class="sw-rules"><summary id="sw-rsum"></summary><p id="sw-rtext"></p></details>
                    <button class="sw-go" data-act="play" id="sw-go"></button>
                </div>
                <div class="sw-view sw-play" id="sw-play" hidden>
                    <div class="sw-top"><button class="sw-btn sw-menu" data-act="menu" id="sw-menu"></button><div id="sw-msg" class="sw-msg" role="status" aria-live="polite"></div></div>
                    <div id="sw-bar" class="sw-bar"></div>
                    <div class="sw-wrap" id="sw-wrap"><canvas id="sw-cv" tabindex="0" aria-label="the district from above. arrow keys move, space walks, F tapes"></canvas></div>
                </div>
            </div>
        `;
    }
})();
