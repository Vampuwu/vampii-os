
window.os = window.os || {};

(function () {
    const KEY = 'vmp_calc';
    let C = { expr: '', ans: 0, mem: 0, tape: [], deg: true, mode: 'basic', base: 10, conv: 'length', skin: '', sing: false, graph: ['sin(x)', 'x^2/4', ''], gv: { x: 0, y: 0, s: 40 }, shown: false };
    let X = NaN;
    function load() { try { let d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d) C = Object.assign(C, d, { expr: '' }); } catch (e) {} }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(Object.assign({}, C, { expr: '' }))); } catch (e) {} }

    // maths. if any of this is wrong pls tell me lol
    const FN = {
        sin: (x, d) => Math.sin(d ? x * Math.PI / 180 : x), cos: (x, d) => Math.cos(d ? x * Math.PI / 180 : x), tan: (x, d) => { let r = d ? x * Math.PI / 180 : x; if (d && Math.abs(((x % 180) + 180) % 180 - 90) < 1e-9) return NaN; return Math.tan(r); },
        asin: (x, d) => d ? Math.asin(x) * 180 / Math.PI : Math.asin(x), acos: (x, d) => d ? Math.acos(x) * 180 / Math.PI : Math.acos(x), atan: (x, d) => d ? Math.atan(x) * 180 / Math.PI : Math.atan(x),
        ln: x => Math.log(x), log: x => Math.log10(x), log2: x => Math.log2(x), sqrt: x => Math.sqrt(x), cbrt: x => Math.cbrt(x), abs: x => Math.abs(x),
        sinh: x => Math.sinh(x), cosh: x => Math.cosh(x), tanh: x => Math.tanh(x),
        fact: x => { if (x < 0 || x !== Math.floor(x) || x > 170) return NaN; let r = 1; for (let i = 2; i <= x; i++) r *= i; return r; }, inv: x => 1 / x, sq: x => x * x, cube: x => x * x * x, neg: x => -x
    };
    const OPS = { '+': [1, 'L', (a, b) => a + b], '-': [1, 'L', (a, b) => a - b], '*': [2, 'L', (a, b) => a * b], '/': [2, 'L', (a, b) => a / b], 'mod': [2, 'L', (a, b) => ((a % b) + b) % b], '^': [4, 'R', (a, b) => Math.pow(a, b)],
        'and': [0.6, 'L', (a, b) => Number(BigInt.asIntN(32, BigInt(Math.trunc(a)) & BigInt(Math.trunc(b))))], 'or': [0.4, 'L', (a, b) => Number(BigInt.asIntN(32, BigInt(Math.trunc(a)) | BigInt(Math.trunc(b))))], 'xor': [0.5, 'L', (a, b) => Number(BigInt.asIntN(32, BigInt(Math.trunc(a)) ^ BigInt(Math.trunc(b))))],
        'shl': [0.8, 'L', (a, b) => Math.trunc(a) << Math.trunc(b)], 'shr': [0.8, 'L', (a, b) => Math.trunc(a) >> Math.trunc(b)] };
    function tokens(s) {
        let out = [], i = 0;
        while (i < s.length) {
            let c = s[i];
            if (c === ' ') { i++; continue; }
            let m = s.slice(i).match(/^(0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+|\d*\.?\d+(e[+-]?\d+)?)/);
            if (m && m[0]) { let t = m[0]; out.push({ n: /^0x/.test(t) ? parseInt(t.slice(2), 16) : /^0b/.test(t) ? parseInt(t.slice(2), 2) : /^0o/.test(t) ? parseInt(t.slice(2), 8) : parseFloat(t) }); i += t.length; continue; }
            let w = s.slice(i).match(/^[a-zπ]+\d?/i);
            if (w) { let t = w[0].toLowerCase(); if (t === 'π' || t === 'pi') out.push({ n: Math.PI }); else if (t === 'e') out.push({ n: Math.E }); else if (t === 'ans') out.push({ n: C.ans }); else if (t === 'x') out.push({ n: X }); else if (FN[t]) out.push({ f: t }); else if (OPS[t]) out.push({ o: t }); else if (t === 'not') out.push({ f: 'not' }); else throw new Error('?'); i += t.length; continue; }
            if ('+-*/^'.indexOf(c) >= 0) { out.push({ o: c }); i++; continue; }
            if (c === '×') { out.push({ o: '*' }); i++; continue; } if (c === '÷') { out.push({ o: '/' }); i++; continue; } if (c === '−') { out.push({ o: '-' }); i++; continue; }
            if (c === '%') { out.push({ p: 1 }); i++; continue; }
            if (c === '!') { out.push({ post: 'fact' }); i++; continue; }
            if (c === '(' || c === ')') { out.push({ b: c }); i++; continue; }
            throw new Error('?');
        }
        return out;
    }
    function calc(s) {
        // 200+10% = 220 like a shop calculator. the "correct" way annoyed me
        s = s.replace(/(\d+(?:\.\d+)?)\s*([+\-])\s*(\d+(?:\.\d+)?)%/g, '$1$2($1*$3/100)');
        let T = tokens(s), out = [], st = [], prev = null;
        const pushOp = o => { while (st.length) { let t = st[st.length - 1]; if (t.f === 'neg') { if (o === '^') break; out.push(st.pop()); continue; } if (t.f) { out.push(st.pop()); continue; } if (!t.o) break; let [p1, a1] = OPS[o] || [3, 'R'], [p2] = OPS[t.o] || [3]; if (p2 > p1 || (p2 === p1 && a1 === 'L')) out.push(st.pop()); else break; } st.push({ o }); };
        for (let k = 0; k < T.length; k++) {
            let t = T[k], valueBefore = prev && (prev.n != null || prev.b === ')' || prev.p || prev.post);
            if ((t.n != null || t.f || t.b === '(') && valueBefore) pushOp('*');
            if (t.n != null) out.push(t);
            else if (t.f) st.push(t);
            else if (t.o) { if (!valueBefore && (t.o === '-' || t.o === '+')) { if (t.o === '-') st.push({ f: 'neg' }); } else pushOp(t.o); }
            else if (t.p) out.push({ pct: 1 });
            else if (t.post) out.push({ f: t.post });
            else if (t.b === '(') st.push(t);
            else if (t.b === ')') { while (st.length && st[st.length - 1].b !== '(') out.push(st.pop()); if (!st.length) throw new Error('('); st.pop(); if (st.length && st[st.length - 1].f) out.push(st.pop()); }
            prev = t;
        }
        while (st.length) { let t = st.pop(); if (t.b) continue; out.push(t); }
        let S = [];
        for (const t of out) {
            if (t.n != null) S.push(t.n);
            else if (t.pct) { let v = S.pop(); S.push(v / 100); S._pct = true; }
            else if (t.f) { let a = S.pop(); if (a == null) throw new Error('f'); S.push(t.f === 'not' ? ~Math.trunc(a) : FN[t.f](a, C.deg)); }
            else if (t.o) { let b = S.pop(), a = S.pop(); if (a == null || b == null) throw new Error('o'); S.push(OPS[t.o][2](a, b)); }
        }
        if (S.length !== 1) throw new Error('=');
        return S[0];
    }
    const fmt = v => { if (!isFinite(v)) return String(v); if (C.mode === 'prog' && C.base !== 10) return (v < 0 ? '-' : '') + Math.abs(Math.trunc(v)).toString(C.base).toUpperCase(); let a = Math.abs(v); if (a !== 0 && (a >= 1e13 || a < 1e-9)) return v.toExponential(8).replace(/\.?0+e/, 'e'); return String(Math.round(v * 1e10) / 1e10); };
    const pre = () => C.mode === 'prog' ? ({ 16: '0x', 2: '0b', 8: '0o', 10: '' })[C.base] : '';

    function egg(expr, v) {
        let e = expr.replace(/\s/g, '');
        if (e === '58008' || e === '5318008') return { flip: 1, say: 'turn it upside down. grow up. (we both did it)' };
        if (e === '07734' || e === '0.7734') return { flip: 1, say: 'hello to you too' };
        if (e === '4444' || v === 4444) return { say: 'v4.444. the number never changes. aesthetics ok' };
        if (e === '42' || v === 42) return { say: 'yeah yeah. the answer. now what was the question' };
        if (e === '1337') return { say: 'leet. h4x0r energy' };
        if (e === '666' || v === 666) return { red: 1, say: 'it heard you' };
        if (e === '69' || v === 69) return { say: 'nice' };
        if (e === '0/0') return { say: 'zero over zero. the void stares back' };
        if (/\/0$/.test(e) && !isFinite(v)) return { say: 'cant split anything between nobody' };
        if (v === 4) return { ghost: '死', say: 'four. shi. the number they skip in the lifts' };
        return null;
    }

    let W = null;
    const $ = s => W && W.querySelector(s);
    // the . was taking up a whole digit, squish it
    function dots(m) {
        let t = m.textContent; if (t.indexOf('.') < 0) return;
        m.textContent = '';
        t.split('.').forEach((bit, i) => { if (i) { let d = document.createElement('i'); d.className = 'cx-dp'; d.textContent = '.'; m.appendChild(d); } m.appendChild(document.createTextNode(bit)); });
    }
    function lcd(main, sub, note) {
        let m = $('.cx-main'), s = $('.cx-sub'), n = $('.cx-note');
        if (m) { m.textContent = main; dots(m); m.classList.remove('flip', 'red'); m.scrollLeft = m.scrollWidth; }
        if (s) s.textContent = sub || ''; if (n) n.textContent = note || '';
        let g = $('.cx-ghost'); if (g) g.textContent = '';
    }
    function preview() {
        let s = $('.cx-sub'), m = $('.cx-main'); if (!m) return;
        m.textContent = C.expr ? C.expr.replace(/\*/g, '×').replace(/\//g, '÷') : '0'; dots(m); m.classList.remove('flip', 'red');
        let ghost = ''; if (C.expr) { try { let v = calc(C.expr); if (isFinite(v) && String(v) !== C.expr) ghost = '= ' + pre() + fmt(v); } catch (e) {} }
        if (s) s.textContent = ghost; let n = $('.cx-note'); if (n) n.textContent = (C.mem ? 'M ' : '') + (C.mode === 'sci' ? (C.deg ? 'DEG' : 'RAD') : C.mode === 'prog' ? ({ 16: 'HEX', 10: 'DEC', 8: 'OCT', 2: 'BIN' })[C.base] : '');
        m.scrollLeft = m.scrollWidth;
        if (Math.random() < 0.06 && /\d/.test(m.textContent)) { let K = '〇一二三四五六七八九', t = m.textContent, i = t.search(/\d/); let o = t; m.textContent = t.slice(0, i) + K[+t[i]] + t.slice(i + 1); setTimeout(() => { if (m.textContent !== o && W) preview(); }, 160); }
    }
    function press(k) {
        sing(k); click(k);
        if (k === 'C') { C.expr = ''; preview(); return; }
        if (k === 'DEL') { let m = C.expr.match(/([a-z]+\d?\(| (mod|and|or|xor|shl|shr) |ans|0x|0b|0o)$/); C.expr = m ? C.expr.slice(0, -m[0].length) : C.expr.slice(0, -1); preview(); return; }
        if (k === '=') { equals(); return; }
        if (k === '±') { C.expr = C.expr ? '-(' + C.expr + ')' : '-'; preview(); return; }
        if (k === 'MC') { C.mem = 0; save(); preview(); return; }
        if (k === 'MR') { C.expr += fmt(C.mem); preview(); return; }
        if (k === 'M+' || k === 'M-') { try { let v = C.expr ? calc(C.expr) : C.ans; C.mem += k === 'M+' ? v : -v; save(); } catch (e) {} preview(); return; }
        if (k === 'DEG') { C.deg = !C.deg; save(); preview(); refreshKeys(); return; }
        if (k === 'ANS') { C.expr += 'ans'; preview(); return; }
        if (/^BASE/.test(k)) { let b = +k.slice(4); try { if (C.expr) { let v = calc(C.expr); C.base = b; C.expr = pre() + fmt(v); } else C.base = b; } catch (e) { C.base = b; } save(); preview(); refreshKeys(); return; }
        if (/^H[A-F]$/.test(k)) k = k.slice(1);
        if (C.mode === 'prog' && C.base !== 10 && /^[0-9A-F]$/.test(k) && !/(0x|0b|0o)[0-9A-Fa-f]*$/.test(C.expr)) C.expr += pre();
        C.expr += k; preview();
    }
    function equals() {
        if (!C.expr) return;
        let v, ex = C.expr;
        try { v = calc(ex); } catch (e) { v = NaN; }
        let eg = egg(ex, v);
        if (!isFinite(v) && !eg) { lcd('ERROR', ex, 'それは数じゃない // thats not a number'); flashErr(); C.expr = ''; return; }
        let shown = isFinite(v) ? pre() + fmt(v) : '∞';
        C.tape.unshift({ e: ex.replace(/\*/g, '×').replace(/\//g, '÷'), v: shown, t: Date.now() }); if (C.tape.length > 40) C.tape.length = 40;
        if (isFinite(v)) C.ans = v;
        C.expr = isFinite(v) ? (pre() + fmt(v)) : ''; save();
        lcd(shown, ex.replace(/\*/g, '×').replace(/\//g, '÷') + ' =', eg ? eg.say : '');
        let m = $('.cx-main');
        if (eg && eg.flip) setTimeout(() => m && m.classList.add('flip'), 250);
        if (eg && eg.red) { m.classList.add('red'); W.classList.add('cx-shake'); setTimeout(() => W && W.classList.remove('cx-shake'), 500); }
        if (eg && eg.ghost) { let g = $('.cx-ghost'); if (g) g.textContent = eg.ghost; }
        tape();
    }
    function flashErr() { let s = $('.cx-screen'); if (!s) return; s.classList.remove('err'); void s.offsetWidth; s.classList.add('err'); }
    // click an old sum on the receipt to get it back
    function tape() {
        let box = $('.cx-tape-list'); if (!box) return; box.innerHTML = '';
        if (!C.tape.length) { box.innerHTML = '<div class="cx-tape-empty">nothing yet</div>'; return; }
        C.tape.forEach(r => { let d = document.createElement('div'); d.className = 'cx-tline'; d.innerHTML = '<span></span><b></b>'; d.firstChild.textContent = r.e + ' ='; d.lastChild.textContent = r.v; d.title = 'click: use this answer'; d.onclick = () => { C.expr = r.v.replace(/^∞$/, ''); preview(); }; box.appendChild(d); });
    }
    function keepTape() { let txt = C.tape.slice().reverse().map(r => r.e + ' = ' + r.v).join('\n'); let a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt + '\n'], { type: 'text/plain' })); a.download = 'calc_tape.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }

    // dtmf, the real two tone frequencies. type a phone number in and listen to it. no it doesnt call anyone
    const DTMF = { '1': [697, 1209], '2': [697, 1336], '3': [697, 1477], '4': [770, 1209], '5': [770, 1336], '6': [770, 1477], '7': [852, 1209], '8': [852, 1336], '9': [852, 1477], '0': [941, 1336], '.': [941, 1209], '=': [941, 1477] };
    function ctxA() { try { window.AudioContext = window.AudioContext || window.webkitAudioContext; if (!window.audioCtx) window.audioCtx = new AudioContext(); let A = window.audioCtx; if (A.state === 'suspended') A.resume(); return A; } catch (e) { return null; } }
    function click(k) {
        if (C.sing) return;
        let A = ctxA(); if (!A) return; let n = A.currentTime, f = DTMF[k] || [600, 900];
        f.forEach(hz => { let o = A.createOscillator(), g = A.createGain(); o.frequency.value = hz; g.gain.setValueAtTime(0.018, n); g.gain.exponentialRampToValueAtTime(0.0005, n + 0.07); o.connect(g); g.connect(A.destination); o.start(n); o.stop(n + 0.08); });
    }
    const SCALE = [0, 2, 3, 5, 7, 8, 10, 12, 14, 15];
    function sing(k) {
        if (!C.sing) return;
        let A = ctxA(); if (!A) return; let n = A.currentTime, d = /^\d$/.test(k) ? SCALE[+k] : { '+': -5, '-': -2, '*': 3, '/': 7, '=': 12, '(': -9, ')': -7 }[k], semi = d == null ? 0 : d;
        let f = 220 * Math.pow(2, semi / 12), o = A.createOscillator(), o2 = A.createOscillator(), g = A.createGain(), lp = A.createBiquadFilter();
        o.type = 'sawtooth'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f * 2.003; lp.frequency.setValueAtTime(3000, n); lp.frequency.exponentialRampToValueAtTime(500, n + 0.3);
        g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(0.05, n + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, n + (k === '=' ? 0.9 : 0.35));
        o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(A.destination); o.start(n); o2.start(n); o.stop(n + 1); o2.stop(n + 1);
    }

    // converter. add more units here if u want, the format is easy
    const UNITS = {
        length: [['m', 1], ['cm', 0.01], ['mm', 0.001], ['km', 1000], ['in', 0.0254], ['ft', 0.3048], ['yd', 0.9144], ['mi', 1609.344]],
        mass: [['kg', 1], ['g', 0.001], ['lb', 0.45359237], ['oz', 0.028349523], ['st', 6.35029318]],
        volume: [['l', 1], ['ml', 0.001], ['cup', 0.2365882], ['pint (uk)', 0.56826125], ['gal (us)', 3.78541178], ['fl oz', 0.0295735]],
        time: [['s', 1], ['min', 60], ['h', 3600], ['day', 86400]],
        data: [['B', 1], ['KB', 1024], ['MB', 1048576], ['GB', 1073741824], ['TB', 1099511627776]],
        temp: [['°C'], ['°F'], ['K']],
        // car stuff. fuel economy is the odd one, mpg + L/100km are upside down from each other so it has its own maths like temp
        power: [['kW', 1], ['hp', 0.745699872], ['PS', 0.73549875], ['W', 0.001]],
        torque: [['N·m', 1], ['lb·ft', 1.3558179483], ['kgf·m', 9.80665]],
        speed: [['km/h', 1], ['mph', 1.609344], ['m/s', 3.6], ['knot', 1.852]],
        tyre: [['kPa', 1], ['psi', 6.8947572932], ['bar', 100]],
        engine: [['cc', 1], ['L', 1000], ['cu in', 16.387064]],
        fuel: [['L/100km'], ['mpg (us)'], ['mpg (uk)'], ['km/L']]
    };
    function convert(v, cat, a, b) {
        if (cat === 'temp') { let c = a === '°C' ? v : a === '°F' ? (v - 32) * 5 / 9 : v - 273.15; return b === '°C' ? c : b === '°F' ? c * 9 / 5 + 32 : c + 273.15; }
        if (cat === 'fuel') { if (!v) return 0; const K = { 'mpg (us)': 0.4251437075, 'mpg (uk)': 0.3540061899, 'km/L': 1 }; let k = a === 'L/100km' ? 100 / v : v * K[a]; return b === 'L/100km' ? 100 / k : k / K[b]; }
        let L = UNITS[cat], fa = L.find(u => u[0] === a)[1], fb = L.find(u => u[0] === b)[1]; return v * fa / fb;
    }
    function convPanel(box) {
        let cats = Object.keys(UNITS);
        if (cats.indexOf(C.conv) < 0) C.conv = 'length';
        let units = UNITS[C.conv];
        box.innerHTML = '';
        let tabs = document.createElement('div'); tabs.className = 'cx-ctabs';
        cats.forEach(k => { let b = document.createElement('button'); b.type = 'button'; b.className = 'cx-ct' + (k === C.conv ? ' on' : ''); b.textContent = k; b.onclick = () => { C.conv = k; save(); convPanel(box); }; tabs.appendChild(b); });
        box.appendChild(tabs);
        let row = document.createElement('div'); row.className = 'cx-crow';
        const sel = (v) => { let s = document.createElement('select'); s.className = 'cx-csel'; units.forEach(u => { let o = document.createElement('option'); o.value = u[0]; o.textContent = u[0]; if (u[0] === v) o.selected = true; s.appendChild(o); }); return s; };
        let a = sel(units[0][0]), b = sel((units[1] || units[0])[0]), out = document.createElement('div'); out.className = 'cx-cout';
        const go = () => { let v; try { v = C.expr ? calc(C.expr) : C.ans; } catch (e) { v = C.ans; } let r = convert(v, C.conv, a.value, b.value); out.textContent = isFinite(r) ? fmt(v) + ' ' + a.value + ' = ' + fmt(r) + ' ' + b.value : '—'; };
        a.onchange = go; b.onchange = go;
        let sw = document.createElement('button'); sw.type = 'button'; sw.className = 'cx-key sm'; sw.textContent = '⇄'; sw.onclick = () => { let t = a.value; a.value = b.value; b.value = t; go(); };
        let use = document.createElement('button'); use.type = 'button'; use.className = 'cx-key sm'; use.textContent = 'USE'; use.title = 'put the converted number on the screen'; use.onclick = () => { let v; try { v = C.expr ? calc(C.expr) : C.ans; } catch (e) { v = C.ans; } let r = convert(v, C.conv, a.value, b.value); if (isFinite(r)) { C.expr = fmt(r); preview(); } };
        row.appendChild(a); row.appendChild(sw); row.appendChild(b); row.appendChild(use); box.appendChild(row); box.appendChild(out);
        let note = document.createElement('div'); note.className = 'cx-cnote'; note.textContent = 'whatever is on the screen (or the last answer)'; box.appendChild(note);
        go(); C._go = go;
    }

    function graphPanel(box) {
        box.innerHTML = '';
        const COL = () => { let cs = getComputedStyle(W); return [cs.getPropertyValue('--cx-a').trim() || '#ff0099', cs.getPropertyValue('--cx-b').trim() || '#00f0ff', '#ffd76a']; };
        let ins = document.createElement('div'); ins.className = 'cx-gins';
        C.graph.forEach((f, i) => {
            let row = document.createElement('label'); row.className = 'cx-grow';
            row.innerHTML = '<i></i><span>y' + (i + 1) + ' =</span>';
            let inp = document.createElement('input'); inp.className = 'cx-gin'; inp.value = f; inp.spellcheck = false; inp.placeholder = ['sin(x)', 'x^2', '1/x'][i];
            inp.oninput = () => { C.graph[i] = inp.value; save(); draw(); };
            row.appendChild(inp); ins.appendChild(row);
        });
        let cv = document.createElement('canvas'); cv.className = 'cx-gcv'; cv.width = 560; cv.height = 300;
        let read = document.createElement('div'); read.className = 'cx-gread';
        let bar = document.createElement('div'); bar.className = 'cx-gbar';
        [['−', () => zoom(1 / 1.4)], ['+', () => zoom(1.4)], ['⟲', () => { C.gv = { x: 0, y: 0, s: 40 }; save(); draw(); }]].forEach(([l, f]) => { let b = document.createElement('button'); b.type = 'button'; b.className = 'cx-key sm'; b.textContent = l; b.onclick = () => { click('.'); f(); }; bar.appendChild(b); });
        bar.appendChild(read);
        box.append(ins, cv, bar);
        ins.querySelectorAll('i').forEach((d, i) => d.style.background = COL()[i]);
        const V = () => C.gv, w = cv.width, h = cv.height;
        const sx = x => w / 2 + (x - V().x) * V().s, sy = y => h / 2 - (y - V().y) * V().s, wx = px => (px - w / 2) / V().s + V().x;
        function f(i, x) { let e = C.graph[i]; if (!e || !e.trim()) return NaN; X = x; try { return calc(e); } catch (er) { return NaN; } finally { X = NaN; } }
        function zoom(k) { V().s = Math.max(2, Math.min(4000, V().s * k)); save(); draw(); }
        function step(s) { let raw = 80 / s, p = Math.pow(10, Math.floor(Math.log10(raw))); return [1, 2, 5, 10].map(m => m * p).find(v => v >= raw); }
        function draw(hx) {
            let x = cv.getContext('2d'), c = COL();
            x.clearRect(0, 0, w, h);
            x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(0, 0, w, h);
            let st = step(V().s);
            x.lineWidth = 1; x.font = '10px Courier New'; x.fillStyle = 'rgba(255,255,255,0.45)';
            for (let gx = Math.ceil(wx(0) / st) * st; sx(gx) < w; gx += st) { x.strokeStyle = Math.abs(gx) < st / 2 ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.08)'; x.beginPath(); x.moveTo(sx(gx) + 0.5, 0); x.lineTo(sx(gx) + 0.5, h); x.stroke(); if (Math.abs(gx) > st / 2) x.fillText(+gx.toPrecision(6), sx(gx) + 3, Math.min(h - 4, Math.max(12, sy(0) + 12))); }
            let ytop = V().y + (h / 2) / V().s;
            for (let gy = Math.floor(ytop / st) * st; sy(gy) < h; gy -= st) { x.strokeStyle = Math.abs(gy) < st / 2 ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.08)'; x.beginPath(); x.moveTo(0, sy(gy) + 0.5); x.lineTo(w, sy(gy) + 0.5); x.stroke(); if (Math.abs(gy) > st / 2) x.fillText(+gy.toPrecision(6), Math.min(w - 40, Math.max(3, sx(0) + 4)), sy(gy) - 3); }
            C.graph.forEach((e, i) => {
                if (!e || !e.trim()) return;
                x.strokeStyle = c[i]; x.lineWidth = 2; x.shadowColor = c[i]; x.shadowBlur = 6; x.beginPath();
                let pen = false, lastY = 0;
                for (let px = 0; px <= w; px++) {
                    let y = f(i, wx(px)), py = sy(y);
                    // without this tan(x) draws giant walls everywhere becuase of the asymptotes
                    if (!isFinite(y) || Math.abs(py) > h * 8 || (pen && Math.abs(py - lastY) > h * 2)) { pen = false; continue; }
                    if (pen) x.lineTo(px, py); else x.moveTo(px, py);
                    pen = true; lastY = py;
                }
                x.stroke(); x.shadowBlur = 0;
            });
            if (hx != null) {
                let gx = wx(hx), out = [];
                x.strokeStyle = 'rgba(255,255,255,0.25)'; x.setLineDash([3, 3]); x.beginPath(); x.moveTo(hx + 0.5, 0); x.lineTo(hx + 0.5, h); x.stroke(); x.setLineDash([]);
                C.graph.forEach((e, i) => { let y = f(i, gx); if (!isFinite(y)) return; x.fillStyle = c[i]; x.beginPath(); x.arc(hx, sy(y), 3.5, 0, Math.PI * 2); x.fill(); out.push('y' + (i + 1) + ' ' + fmt(y)); });
                read.textContent = 'x ' + fmt(gx) + (out.length ? '  ·  ' + out.join('  ·  ') : '');
            } else read.textContent = C.deg ? 'DEG (RAD for trig curves)' : 'RAD';
        }
        let drag = null;
        const px = e => { let r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * w / r.width, (e.clientY - r.top) * h / r.height]; };
        cv.onpointerdown = e => { cv.setPointerCapture(e.pointerId); drag = { p: px(e), v: Object.assign({}, V()) }; };
        cv.onpointermove = e => { let [a, b] = px(e); if (drag) { V().x = drag.v.x - (a - drag.p[0]) / V().s; V().y = drag.v.y + (b - drag.p[1]) / V().s; draw(); } else draw(a); };
        cv.onpointerup = () => { if (drag) { drag = null; save(); } };
        cv.onpointerleave = () => { if (!drag) draw(); };
        cv.onwheel = e => { e.preventDefault(); zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15); };
        draw();
    }

    const KEYS_BASIC = [['MC', 'mem'], ['MR', 'mem'], ['M-', 'mem'], ['M+', 'mem'], ['C', 'clr'],
        ['(', 'op'], [')', 'op'], ['%', 'op'], ['DEL', 'clr'], ['/', 'op', '÷'],
        ['7'], ['8'], ['9'], ['±', 'op'], ['*', 'op', '×'],
        ['4'], ['5'], ['6'], ['ANS', 'op'], ['-', 'op', '−'],
        ['1'], ['2'], ['3'], ['=', 'eq', '=', 2], ['+', 'op'],
        ['0', '', '0', 2], ['.'], ['^', 'op', 'xʸ']];
    const KEYS_SCI = [['sin(', 'fn', 'sin'], ['cos(', 'fn', 'cos'], ['tan(', 'fn', 'tan'], ['DEG', 'fn', 'DEG'],
        ['asin(', 'fn', 'sin⁻¹'], ['acos(', 'fn', 'cos⁻¹'], ['atan(', 'fn', 'tan⁻¹'], ['π', 'fn'],
        ['ln(', 'fn', 'ln'], ['log(', 'fn', 'log'], ['log2(', 'fn', 'log₂'], ['e', 'fn'],
        ['sq(', 'fn', 'x²'], ['cube(', 'fn', 'x³'], ['^', 'fn', 'xʸ'], ['inv(', 'fn', '1/x'],
        ['sqrt(', 'fn', '√'], ['cbrt(', 'fn', '∛'], ['!', 'fn', 'n!'], ['abs(', 'fn', '|x|'],
        ['sinh(', 'fn', 'sinh'], ['cosh(', 'fn', 'cosh'], ['tanh(', 'fn', 'tanh'], ['10^', 'fn', '10ˣ'],
        [' mod ', 'fn', 'mod'], ['e', 'fn', 'EXP'], ['RAND', 'fn', 'rand'], ['ANS', 'fn', 'ans']];
    const KEYS_PROG = [['BASE16', 'fn', 'HEX'], ['BASE10', 'fn', 'DEC'], ['BASE8', 'fn', 'OCT'], ['BASE2', 'fn', 'BIN'],
        ['A', 'hx'], ['B', 'hx'], ['C', 'hx', 'C'], ['D', 'hx'], ['E', 'hx'], ['F', 'hx'],
        [' and ', 'fn', 'AND'], [' or ', 'fn', 'OR'], [' xor ', 'fn', 'XOR'], ['not(', 'fn', 'NOT'], [' shl ', 'fn', '≪'], [' shr ', 'fn', '≫']];
    function key(def) {
        let [k, cls, lab, span] = def, b = document.createElement('button'); b.type = 'button'; b.className = 'cx-key' + (cls ? ' ' + cls : '') + (span ? ' w' + span : ''); b.textContent = lab || k; b.dataset.k = k;
        if (cls === 'hx') b.dataset.k = 'H' + k;
        b.onclick = () => { if (k === 'RAND') { C.expr += String(Math.round(Math.random() * 1e6) / 1e6); preview(); click('.'); return; } press(cls === 'hx' ? 'H' + k : k); };
        return b;
    }
    function refreshKeys() {
        if (!W) return;
        W.querySelectorAll('.cx-key[data-k="DEG"]').forEach(b => b.textContent = C.deg ? 'DEG' : 'RAD');
        W.querySelectorAll('.cx-key[data-k^="BASE"]').forEach(b => b.classList.toggle('on', +b.dataset.k.slice(4) === C.base));
        W.querySelectorAll('.cx-key').forEach(b => { let k = b.dataset.k; if (C.mode !== 'prog') { b.classList.remove('dim'); return; } let hx = b.classList.contains('hx'), dig = /^[0-9]$/.test(k) || hx; b.classList.toggle('dim', dig && (C.base === 2 ? (hx || !/^[01]$/.test(k)) : C.base === 8 ? (hx || !/^[0-7]$/.test(k)) : C.base === 10 ? hx : false)); });
    }
    function build() {
        let body = W.querySelector('.cx-root'); if (!body) return;
        let skin = ['gold', 'bone', 'neon'].find(s => s === C.skin) || '';
        body.className = 'cx-root bit' + (skin ? ' sk-' + skin : '');
        body.innerHTML = `
            <div class="cx-dev">
                <div class="cx-brand"><b>VAMPII</b><span>FX-4444 // 電卓</span><i class="cx-solar"></i></div>
                <div class="cx-screen"><div class="cx-ghost8">8888888888888888</div><div class="cx-note"></div><div class="cx-sub"></div><div class="cx-main">0</div><div class="cx-ghost"></div></div>
                <div class="cx-modes"></div>
                <div class="cx-side"></div>
                <div class="cx-pad"></div>
            </div>
            <div class="cx-tape"><div class="cx-th">// TAPE <button type="button" class="cx-tbtn" data-act="clear">clear</button><button type="button" class="cx-tbtn" data-act="keep">keep .txt</button></div><div class="cx-tape-list"></div></div>`;
        let modes = body.querySelector('.cx-modes');
        const mb = (id, lab) => { let b = document.createElement('button'); b.type = 'button'; b.className = 'cx-mb' + (C.mode === id ? ' on' : ''); b.textContent = lab; b.onclick = () => { C.mode = id; if (id !== 'prog') C.base = 10; save(); build(); }; modes.appendChild(b); };
        // normal / scientific is one switch now, the rest are extras
        let tg = document.createElement('div'); tg.className = 'cx-tog' + (C.mode === 'sci' ? ' sci' : C.mode === 'basic' ? '' : ' none'); tg.setAttribute('role', 'group');
        [['basic', 'NORMAL'], ['sci', 'SCIENTIFIC']].forEach(([id, lab]) => { let b = document.createElement('button'); b.type = 'button'; b.textContent = lab; b.dataset.m = id; b.setAttribute('aria-pressed', C.mode === id); b.onclick = () => { click('.'); C.mode = C.mode === id && id === 'sci' ? 'basic' : id; C.base = 10; save(); build(); }; tg.appendChild(b); });
        modes.appendChild(tg);
        mb('prog', 'PROGRAMMER'); mb('conv', 'CONVERT'); mb('graph', 'GRAPH');
        let sg = document.createElement('button'); sg.type = 'button'; sg.className = 'cx-mb' + (C.sing ? ' on' : ''); sg.textContent = '♪ SING'; sg.title = 'every key plays a note'; sg.onclick = () => { C.sing = !C.sing; save(); build(); }; modes.appendChild(sg);
        let skins = ['gold', 'bone', 'neon'];
        if (skins.length) { let s = document.createElement('select'); s.className = 'cx-skin'; [['', 'case: black glass']].concat(skins.map(k => [k, 'case: ' + { gold: 'gold', bone: 'bone', neon: 'neon' }[k]])).forEach(([v, l]) => { let o = document.createElement('option'); o.value = v; o.textContent = l; if (v === C.skin) o.selected = true; s.appendChild(o); }); s.onchange = () => { C.skin = s.value; save(); build(); }; let ft = document.createElement('div'); ft.className = 'cx-foot'; ft.appendChild(s); body.querySelector('.cx-dev').appendChild(ft); }
        let side = body.querySelector('.cx-side'), pad = body.querySelector('.cx-pad');
        if (C.mode === 'sci') { side.className = 'cx-side cx-grid4'; KEYS_SCI.forEach(d => side.appendChild(key(d))); }
        else if (C.mode === 'prog') { side.className = 'cx-side cx-grid4'; KEYS_PROG.forEach(d => side.appendChild(key(d))); }
        else if (C.mode === 'conv') { side.className = 'cx-side cx-conv'; convPanel(side); }
        else if (C.mode === 'graph') { side.className = 'cx-side cx-graph'; graphPanel(side); }
        else side.className = 'cx-side gone';
        KEYS_BASIC.forEach(d => pad.appendChild(key(d)));
        body.querySelectorAll('.cx-tbtn').forEach(b => b.onclick = () => { if (b.dataset.act === 'clear') { C.tape = []; save(); tape(); } else keepTape(); });
        let win = document.getElementById('win-calc.exe');
        if (win && !(os.isPhone && os.isPhone())) win.style.maxWidth = Math.min(window.innerWidth - 20, (C.mode === 'basic' ? 400 : 620) + 250) + 'px';
        refreshKeys(); preview(); tape();
    }
    function open() {
        W = document.getElementById('win-calc.exe'); if (!W) return;
        load(); C.expr = ''; C.mode = 'basic'; build();
        if (!C.shown) { C.shown = true; save(); }
    }
    os.calcReset = () => { C.expr = ''; };
    window.addEventListener('keydown', e => {
        if (!document.getElementById('win-calc.exe') || !W || !W.isConnected) return;
        if (/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
        if (document.getElementById('win-calc.exe').classList.contains('is-min')) return;
        let k = e.key, map = { Enter: '=', '=': '=', Backspace: 'DEL', Escape: 'C', x: '*', X: '*' };
        if (map[k]) { e.preventDefault(); press(map[k]); return; }
        if (/^[0-9.+\-*/()%^!]$/.test(k)) { press(k); return; }
        if (C.mode === 'prog' && /^[a-fA-F]$/.test(k)) { press('H' + k.toUpperCase()); return; }
        if (k === 'c' || k === 'C') press('C');
    });
    function css() {
        let st = document.createElement('style');
        st.textContent = `
            #desktop > #win-calc\\.exe { --cx-a: var(--neon-primary); --cx-b: var(--neon-secondary); --cx-case1: #2c2733; --cx-case2: #15111a; --cx-side: #0b090e; --cx-key1: #3b3442; --cx-key2: #252029; --cx-key3: #1f1a23; --cx-key4: #121015; --cx-ink: #f1ecf3; --cx-lcd1: #07120f; --cx-lcd2: #020806; --cx-lcdink: #8dffd9;
                --cx-trim: color-mix(in srgb, var(--cx-b) 60%, #15111a); border: 2px solid var(--cx-trim); border-radius: 20px; background: linear-gradient(170deg, var(--cx-case1), var(--cx-case2)) !important;
                box-shadow: inset 0 2px 0 rgba(255,255,255,0.14), inset 0 -2px 0 rgba(0,0,0,0.45), 0 8px 0 var(--cx-side), 0 8px 0 2px color-mix(in srgb, var(--cx-trim) 50%, #000), 0 26px 44px rgba(0,0,0,0.6) !important; }
            #desktop > #win-calc\\.exe:has(.sk-gold) { --cx-case1: #d8b45a; --cx-case2: #8a6420; --cx-side: #4a3410; --cx-key1: #2a2018; --cx-key2: #120c08; --cx-key3: #1d150e; --cx-key4: #0c0805; --cx-ink: #f6e7c4; --cx-lcd1: #b8c4a0; --cx-lcd2: #8e9a78; --cx-lcdink: #1d2414; --cx-a: #ffcf6a; --cx-b: #fff0c0; }
            #desktop > #win-calc\\.exe:has(.sk-bone) { --cx-case1: #ece4d2; --cx-case2: #bdb29a; --cx-side: #8a8070; --cx-key1: #f6f0e2; --cx-key2: #d6ccb6; --cx-key3: #ddd3bd; --cx-key4: #b9ad94; --cx-ink: #2a2228; --cx-lcd1: #cfd8c0; --cx-lcd2: #a9b496; --cx-lcdink: #1a2016; --cx-a: #8a1d2e; --cx-b: #5a3a40; }
            #desktop > #win-calc\\.exe:has(.sk-neon) { --cx-case1: #0a0a16; --cx-case2: #000; --cx-side: #000; --cx-key1: #0f0f22; --cx-key2: #05050c; --cx-key3: #0a0a18; --cx-key4: #030308; --cx-ink: #e8f6ff; --cx-lcd1: #05001a; --cx-lcd2: #000; --cx-lcdink: #ff4ad8; --cx-a: #00f0ff; --cx-b: #ff4ad8; }
            #desktop > #win-calc\\.exe::before { display: none; }
            #desktop > #win-calc\\.exe .window-header { position: absolute; top: 0; left: 0; right: 0; z-index: 3; background: none !important; border: 0 !important; box-shadow: none !important; padding: 15px 18px !important; justify-content: flex-end !important; }
            #desktop > #win-calc\\.exe .window-header::before, #desktop > #win-calc\\.exe .window-header::after { display: none; }
            #desktop > #win-calc\\.exe .window-header > span:first-child { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
            #desktop > #win-calc\\.exe .win-btn, #desktop > #win-calc\\.exe .kill-btn { width: 26px; height: 17px; border-radius: 5px; border: 0 !important; background: linear-gradient(180deg, var(--cx-key3), var(--cx-key4)) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 0 rgba(0,0,0,0.7) !important; }
            #desktop > #win-calc\\.exe .win-btn::before, #desktop > #win-calc\\.exe .kill-btn::before { color: var(--cx-ink); --gw: 10px; }
            #desktop > #win-calc\\.exe .min-btn { --gl: var(--gl-px-min); } #desktop > #win-calc\\.exe .max-btn { --gl: var(--gl-px-max); } #desktop > #win-calc\\.exe .kill-btn { --gl: var(--gl-px-x); }
            #desktop > #win-calc\\.exe .kill-btn::before { color: #ff6a80; }
            #desktop > #win-calc\\.exe .win-btn:active, #desktop > #win-calc\\.exe .kill-btn:active { transform: translateY(2px); box-shadow: inset 0 1px 0 rgba(255,255,255,0.08) !important; }
            #desktop > #win-calc\\.exe .window-body { padding: 15px 18px 20px !important; background: none !important; box-shadow: none !important; border-radius: 18px; }
            #win-calc\\.exe .file-path { display: none; }
            .cx-root { display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap; justify-content: center; font-family: Arial, 'Helvetica Neue', sans-serif; }
            .cx-dev { width: 100%; max-width: 620px; flex: 1 1 360px; }
            .cx-brand { display: flex; align-items: center; gap: 8px; height: 20px; margin: 0 0 12px 2px; color: var(--cx-ink); } .cx-brand b { letter-spacing: 4px; font-size: 13px; font-style: italic; } .cx-brand span { font-size: 9px; opacity: 0.55; letter-spacing: 2px; flex: 1; }
            .cx-solar { width: 74px; height: 18px; border-radius: 2px; background: repeating-linear-gradient(90deg, #1b1424 0 17px, #3a2e40 17px 18px), linear-gradient(180deg, #2a2030, #120d16); background-blend-mode: screen; border: 2px solid #08060a; box-shadow: 0 1px 0 rgba(255,255,255,0.1); }
            .cx-screen { position: relative; border-radius: 6px; padding: 8px 12px; height: 84px; border: 4px solid #050406; background: radial-gradient(120% 90% at 50% 40%, var(--cx-lcd1), var(--cx-lcd2)); box-shadow: inset 0 3px 10px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.12); overflow: hidden; color: var(--cx-lcdink); }
            .cx-screen::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(165deg, rgba(255,255,255,0.08) 0 28%, transparent 28.5%); }
            .cx-screen.err { animation: cxErr 0.4s; } @keyframes cxErr { 0%, 100% { transform: none; } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
            .cx-ghost8 { position: absolute; right: 12px; bottom: 6px; font: 32px 'DotGothic16', monospace; letter-spacing: 2px; opacity: 0.07; white-space: nowrap; pointer-events: none; }
            .cx-main { position: absolute; right: 12px; left: 12px; bottom: 6px; text-align: right; font: 32px 'DotGothic16', monospace; letter-spacing: 2px; white-space: nowrap; overflow-x: auto; overflow-y: hidden; scrollbar-width: none; text-shadow: 0 0 6px color-mix(in srgb, var(--cx-lcdink) 55%, transparent); transition: transform 0.6s; }
            .cx-main::-webkit-scrollbar { display: none; } .cx-main .cx-dp { font-style: normal; margin: 0 -7px 0 -5px; } .cx-main.flip { transform: rotate(180deg); } .cx-main.red { color: #ff2a3a; text-shadow: 0 0 14px #ff2a3a; }
            .cx-sub { position: absolute; right: 12px; top: 22px; font-size: 13px; opacity: 0.6; white-space: nowrap; max-width: 90%; overflow: hidden; text-overflow: ellipsis; }
            .cx-note { position: absolute; left: 12px; top: 6px; right: 12px; font-size: 10px; opacity: 0.75; letter-spacing: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .cx-ghost { position: absolute; left: 14px; bottom: 6px; font-size: 30px; color: #c4001a; opacity: 0.5; text-shadow: 0 0 10px #c4001a; }
            .cx-modes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; margin: 14px 0 12px; align-items: stretch; }
            .cx-modes .cx-tog { grid-column: 1 / 3; grid-row: 1; } .cx-modes .cx-mb:last-of-type { grid-column: 3; grid-row: 1; } .cx-modes .cx-mb { text-align: left; }
            .cx-mb { font: bold 9px Arial, sans-serif; letter-spacing: 1px; padding: 5px 9px 5px 7px; border-radius: 4px; border: 0; background: linear-gradient(180deg, var(--cx-key3), var(--cx-key4)); color: var(--cx-ink); cursor: inherit; box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 0 rgba(0,0,0,0.65); }
            .cx-mb::before { content: ''; display: inline-block; width: 5px; height: 5px; margin: 0 6px 1px 0; border-radius: 50%; vertical-align: middle; background: #0d0a10; box-shadow: inset 0 1px 1px rgba(0,0,0,0.8); }
            .cx-mb:active { transform: translateY(2px); box-shadow: inset 0 1px 0 rgba(255,255,255,0.06); }
            .cx-mb.on::before { background: var(--cx-a); box-shadow: 0 0 6px var(--cx-a); }
            .cx-tog { position: relative; display: inline-grid; grid-template-columns: 1fr 1fr; padding: 2px; border-radius: 3px; border: 1px solid #000; background: #0a080c; box-shadow: inset 0 2px 4px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.08); }
            .cx-tog::before { content: ''; position: absolute; top: 2px; bottom: 2px; left: 2px; width: calc(50% - 2px); border-radius: 2px; background: repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0 1px, transparent 1px 3px), linear-gradient(180deg, #554d5e, #2d2733); box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 3px rgba(0,0,0,0.6); transition: transform 0.12s steps(3); }
            .cx-tog.sci::before { transform: translateX(100%); } .cx-tog.none::before { opacity: 0; }
            .cx-tog button { position: relative; font: bold 9px Arial, sans-serif; letter-spacing: 1px; padding: 4px 11px; border: 0; background: none; color: var(--cx-ink); opacity: 0.45; cursor: inherit; }
            .cx-tog button[aria-pressed="true"] { opacity: 1; color: #fff; text-shadow: 0 1px 0 #000; }
            .cx-foot { display: flex; justify-content: flex-end; margin-top: 14px; }
            .cx-skin { font: 9px Arial, sans-serif; letter-spacing: 1px; background: none; color: var(--cx-ink); border: 0; padding: 2px 0; opacity: 0.45; cursor: inherit; } .cx-skin:hover, .cx-skin:focus { opacity: 0.9; } .cx-skin option { background: #15111a; }
            .cx-pad { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
            .cx-side.cx-grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 10px; } .cx-side.gone { display: none; }
            .cx-key { position: relative; height: 44px; border-radius: 9px; border: 0; background: linear-gradient(180deg, var(--cx-key1), var(--cx-key2)); color: var(--cx-ink); font: bold 17px Arial, 'Helvetica Neue', sans-serif; cursor: inherit;
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), 0 3px 0 rgba(0,0,0,0.55), 0 4px 8px rgba(0,0,0,0.35); transition: transform 0.05s, box-shadow 0.05s, filter 0.15s; }
            .cx-key:hover { filter: brightness(1.25); } .cx-key:active { transform: translateY(3px); box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 0 0 rgba(0,0,0,0.5); }
            .cx-key.op, .cx-key.fn, .cx-key.mem, .cx-key.hx, .cx-key.clr { background: linear-gradient(180deg, var(--cx-key3), var(--cx-key4)); } .cx-key.op { color: var(--cx-b); } .cx-key.mem { font-size: 11px; color: var(--cx-a); opacity: 0.9; height: 30px; } .cx-key.clr { color: #ff6a80; }
            .cx-key.eq { background: linear-gradient(180deg, var(--cx-a), color-mix(in srgb, var(--cx-a) 55%, #000)); color: #000; grid-row: span 2; height: auto; }
            .cx-key.w2 { grid-column: span 2; } .cx-key.eq.w2 { grid-column: auto; }
            .cx-key.fn { height: 34px; font-size: 12px; color: var(--cx-b); } .cx-key.hx { height: 34px; font-size: 13px; color: var(--cx-a); }
            .cx-key.gone { visibility: hidden; } .cx-key.dim { opacity: 0.25; pointer-events: none; } .cx-key.on { box-shadow: 0 0 0 2px var(--cx-a), 0 3px 0 rgba(0,0,0,0.55); }
            .cx-key.sm { height: 28px; font-size: 11px; padding: 0 8px; }
            .cx-tape { box-sizing: border-box; margin-top: 34px; flex: 0 1 210px; min-width: 180px; max-height: 470px; display: flex; flex-direction: column; padding: 0 10px 18px; color: #3b352f; font-family: 'Courier New', monospace; transform: rotate(-0.8deg); transform-origin: top center;
                background: repeating-linear-gradient(180deg, transparent 0 22px, rgba(0,0,0,0.035) 22px 23px), linear-gradient(90deg, #e9e4d9, #f6f2ea 40%, #ece7dd);
                -webkit-mask: linear-gradient(#000 0 0) top / 100% calc(100% - 7px) no-repeat, conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / 10px 7px repeat-x;
                mask: linear-gradient(#000 0 0) top / 100% calc(100% - 7px) no-repeat, conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / 10px 7px repeat-x; }
            .cx-tape::before { content: ''; display: block; flex: none; height: 7px; margin: 0 -10px 9px; background: linear-gradient(180deg, #050406, #1c1621 70%, #2a2330); box-shadow: 0 2px 3px rgba(0,0,0,0.35); }
            .cx-th { font-size: 10px; letter-spacing: 2px; color: #3b352f; display: flex; gap: 6px; align-items: center; border-bottom: 1px dashed rgba(0,0,0,0.3); padding-bottom: 6px; margin-bottom: 4px; }
            .cx-tbtn { margin-left: auto; font: 9px 'Courier New', monospace; background: none; border: 1px solid rgba(0,0,0,0.3); color: inherit; border-radius: 2px; padding: 1px 5px; cursor: inherit; } .cx-tbtn + .cx-tbtn { margin-left: 0; } .cx-tbtn:hover { background: rgba(0,0,0,0.08); }
            .cx-tape-list { overflow: auto; flex: 1; }
            .cx-tline { display: flex; flex-direction: column; align-items: flex-end; padding: 4px; border-bottom: 1px dotted rgba(0,0,0,0.18); cursor: inherit; } .cx-tline:hover { background: rgba(0,0,0,0.05); }
            .cx-tline span { font-size: 10px; opacity: 0.6; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .cx-tline b { font-size: 14px; color: #1d1915; }
            .cx-tape-empty { font-size: 10px; color: #8a8378; padding: 8px 4px; }
            .cx-ctabs { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; } .cx-ct { font: 10px 'Courier New', monospace; padding: 3px 7px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.3); color: var(--cx-ink); cursor: inherit; } .cx-ct.on { border-color: var(--cx-a); color: var(--cx-a); }
            .cx-crow { display: flex; gap: 6px; align-items: center; } .cx-csel { flex: 1; font: 12px 'Courier New', monospace; background: rgba(0,0,0,0.35); color: var(--cx-ink); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 4px; }
            .cx-cout { margin: 8px 0 2px; font: bold 15px 'Courier New', monospace; color: var(--cx-b); text-align: right; } .cx-cnote { font-size: 10px; opacity: 0.6; text-align: right; } .cx-conv { margin-bottom: 10px; padding: 8px; border-radius: 10px; background: rgba(0,0,0,0.25); }
            #win-calc\\.exe.cx-shake { animation: cxErr 0.12s 4; }
            .cx-side.cx-graph { margin-bottom: 10px; } .cx-gins { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
            .cx-grow { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--cx-ink); } .cx-grow i { width: 10px; height: 10px; border-radius: 50%; flex: none; box-shadow: 0 0 8px currentColor; } .cx-grow span { flex: none; width: 34px; opacity: 0.8; }
            .cx-gin { flex: 1; min-width: 0; font: 13px 'Courier New', monospace; background: rgba(0,0,0,0.35); color: var(--cx-ink); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 4px 8px; } .cx-gin:focus { outline: 1px solid var(--cx-a); }
            .cx-gcv { width: 100%; height: auto; aspect-ratio: 560 / 300; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); cursor: grab; touch-action: none; display: block; } .cx-gcv:active { cursor: grabbing; }
            .cx-gbar { display: flex; gap: 6px; align-items: center; margin-top: 6px; } .cx-gread { margin-left: auto; font-size: 11px; color: var(--cx-b); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            @media (max-width: 760px) { .cx-tape { flex-basis: 100%; max-height: 180px; margin-top: 0; } .cx-brand { margin-right: 104px; } }
        `;
        document.head.appendChild(st);
    }
    function inject() {
        css();
        let tp = document.createElement('template'); tp.id = 'calc.exe';
        tp.innerHTML = '<p class="file-path">// calc.exe // fx4444.bin</p><div class="cx-root"></div>';
        document.body.appendChild(tp);
    }
    let orig = os.summon.bind(os);
    os.summon = function (id) { orig(id); if (id === 'calc.exe') open(); };
    // testing stuff, leave it
    os.calc = { calc: s => calc(s), press, state: () => ({ expr: C.expr, ans: C.ans, mem: C.mem, tape: C.tape.length, mode: C.mode, base: C.base, main: ($('.cx-main') || {}).textContent, note: ($('.cx-note') || {}).textContent, sub: ($('.cx-sub') || {}).textContent }), mode: m => { C.mode = m; build(); }, convert };
    if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', inject); else inject();
})();
