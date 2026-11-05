// flipbook. like the ds one but on my tablet
// TODO undo for adding + deleting frames
window.os = window.os || {};

(function () {
    const W0 = 320, H0 = 240, MAXSEC = 300;
    const INK = ['#1a1420', '#ff2d6f', '#2d7bff', '#ffffff'];
    const PAPERS = ['#f4efe2', '#ffffff', '#16121c'];
    const $ = id => document.getElementById(id);
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const WD = () => (window.gamesDB && window.gamesDB.flip && window.gamesDB.flip.lines) || {};
    const part = (k, n, m) => String(WD()[k] || k).split('|').map(x => x.trim().replace(/\{n\}/g, n).replace(/\{m\}/g, m));
    const L = (k, n, m) => { let p = part(k, n, m); return p.length > 1 ? p[1] : p[0]; };
    const LL = (k, n, m) => { let p = part(k, n, m); return p.length > 1 ? p[0] + ' // ' + p[1] : p[0]; };
    const mk = () => { let c = document.createElement('canvas'); c.width = W0; c.height = H0; return c; };
    const AC = () => window.audioCtx || (window.audioCtx = new (window.AudioContext || window.webkitAudioContext)());
    const OUT = A => (os.gg && os.gg.out ? os.gg.out(A) : A.destination);

    let root = null, style = null, F = null, raf = 0, playT = 0, rec = null, asleep = false, dirty = false, leaveArm = 0;

    function fresh() {
        F = { frames: [mk()], cur: 0, fps: 8, onion: true, tool: 'pen', size: 2, ink: 0, paper: 0, loop: true, playing: false, undo: [],
            snd: null };
    }

    function markup() {
        let sz = [1, 2, 4, 8].map(n => `<button class="fl-sz" data-sz="${n}" title="${n}px"><i style="width:${Math.max(2, n + 1)}px;height:${Math.max(2, n + 1)}px"></i></button>`).join('');
        let ink = INK.map((c, i) => `<button class="fl-ink" data-ink="${i}" style="background:${c}" title="${c}"></button>`).join('');
        return `
            <div class="fl">
                <div class="fl-tools">
                    <button class="fl-t" data-tool="pen" title="${esc(LL('pen'))}">✎</button>
                    <button class="fl-t" data-tool="eraser" title="${esc(LL('eraser'))}">⌫</button>
                    <button class="fl-t" data-tool="fill" title="${esc(LL('fill'))}">▨</button>
                    <span class="fl-sep"></span>${sz}<span class="fl-sep"></span>${ink}<span class="fl-sep"></span>
                    <button class="fl-t" data-act="onion" title="${esc(LL('onion'))}">◐</button>
                    <button class="fl-t" data-act="paper" title="${esc(LL('paper'))}">□</button>
                    <button class="fl-t" data-act="undo" title="${esc(LL('undo'))} (ctrl z)">↶</button>
                </div>
                <div class="fl-mid">
                    <div class="fl-stage"><canvas id="fl-cv" width="${W0}" height="${H0}"></canvas><div class="fl-msg" id="fl-msg"></div></div>
                    <div class="fl-side">
                        <b class="fl-h">${esc(LL('sound'))}</b>
                        <div class="fl-ed" id="fl-ed"></div>
                        <div class="fl-row fl-files"><button class="fl-b" data-act="vid">${esc(L('saveVid'))}</button><button class="fl-b" data-act="save">.vflip</button><button class="fl-b" data-act="keep" title="files/">${esc(L('keep'))}</button><button class="fl-b" data-act="open">${esc(L('openFile'))}</button></div>
                        <input type="file" id="fl-file" accept=".vflip,application/json" hidden>
                    </div>
                </div>
                <div class="fl-ctrl">
                    <button class="fl-b big" data-act="play" id="fl-play">▶ ${esc(L('play'))}</button>
                    <button class="fl-b" data-act="prev">◀</button><b class="fl-num" id="fl-num"></b><button class="fl-b" data-act="next">▶</button>
                    <button class="fl-b" data-act="add" title="${esc(LL('add'))}">＋</button><button class="fl-b" data-act="dup" title="${esc(LL('copy'))}">⧉</button><button class="fl-b" data-act="del" title="${esc(LL('del'))}">✕</button>
                    <label class="fl-lab fl-fps"><span id="fl-fpsl"></span><input type="range" id="fl-fps" min="1" max="30" value="8"></label>
                    <label class="fl-chk"><input type="checkbox" id="fl-loop" checked> ${esc(L('loop'))}</label>
                </div>
                <div class="fl-strip" id="fl-strip"></div>
                <p class="fl-hint">${esc(LL('hint'))}</p>
            </div>`;
    }

    let cv, cx, drawing = null;
    function frame(i) { return F.frames[i == null ? F.cur : i]; }
    function render(i) {
        if (!cx) return;
        i = i == null ? F.cur : i;
        cx.globalAlpha = 1; cx.fillStyle = PAPERS[F.paper]; cx.fillRect(0, 0, W0, H0);
        if (F.onion && !F.playing && i > 0) { cx.globalAlpha = 0.22; cx.drawImage(frame(i - 1), 0, 0); cx.globalAlpha = 1; }
        cx.drawImage(frame(i), 0, 0);
    }
    function at(e) { let r = cv.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) / r.width * W0), Math.floor((e.clientY - r.top) / r.height * H0)]; }
    function dot(x, y) {
        let c = frame().getContext('2d'), s = F.size, o = Math.floor(s / 2);
        if (F.tool === 'eraser') c.clearRect(x - o - 1, y - o - 1, s + 2, s + 2);
        else { c.fillStyle = INK[F.ink]; c.fillRect(x - o, y - o, s, s); }
    }
    // chunky pixel lines on purpose, its meant to look like a little handheld
    function seg(x0, y0, x1, y1) {
        let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy;
        for (;;) { dot(x0, y0); if (x0 === x1 && y0 === y1) break; let e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
    }
    function bucket(x, y) {
        if (x < 0 || y < 0 || x >= W0 || y >= H0) return;
        let c = frame().getContext('2d'), img = c.getImageData(0, 0, W0, H0), d = new Uint32Array(img.data.buffer), t = d[y * W0 + x];
        let n = parseInt(INK[F.ink].slice(1), 16), col = (255 << 24) | ((n & 255) << 16) | (n & 0xff00) | (n >> 16 & 255);
        if (t === (col >>> 0)) return;
        let st = [x, y];
        while (st.length) {
            let yy = st.pop(), xx = st.pop(), i = yy * W0 + xx;
            while (xx > 0 && d[i - 1] === t) { xx--; i--; }
            let up = false, dn = false;
            for (; xx < W0 && d[i] === t; xx++, i++) {
                d[i] = col;
                if (yy > 0) { if (d[i - W0] === t) { if (!up) { st.push(xx, yy - 1); up = true; } } else up = false; }
                if (yy < H0 - 1) { if (d[i + W0] === t) { if (!dn) { st.push(xx, yy + 1); dn = true; } } else dn = false; }
            }
        }
        c.putImageData(img, 0, 0);
    }
    function snapUndo() { F.undo.push({ f: frame(), img: frame().getContext('2d').getImageData(0, 0, W0, H0) }); if (F.undo.length > 40) F.undo.shift(); }
    function undo() { let u = F.undo.pop(); if (!u) return; u.f.getContext('2d').putImageData(u.img, 0, 0); let i = F.frames.indexOf(u.f); if (i >= 0) F.cur = i; ui(); }

    function wireDraw() {
        cv.addEventListener('pointerdown', e => {
            if (F.playing || e.button > 0) return;
            e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (er) {}
            let [x, y] = at(e); snapUndo(); dirty = true;
            if (F.tool === 'fill') { bucket(x, y); render(); thumb(F.cur); return; }
            drawing = { x, y, id: e.pointerId }; dot(x, y); render();
        });
        cv.addEventListener('pointermove', e => {
            if (!drawing || e.pointerId !== drawing.id) return;
            let ev = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
            (ev.length ? ev : [e]).forEach(q => { let [x, y] = at(q); seg(drawing.x, drawing.y, x, y); drawing.x = x; drawing.y = y; });
            render();
        });
        const end = () => { if (!drawing) return; drawing = null; thumb(F.cur); };
        cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    }

    function go(i) { stopPlay(); F.cur = Math.max(0, Math.min(F.frames.length - 1, i)); ui(); }
    function addFrame(copy) {
        let c = mk(); if (copy) c.getContext('2d').drawImage(frame(), 0, 0);
        F.frames.splice(F.cur + 1, 0, c);
        F.cur++; dirty = true; ui(true);
    }
    function delFrame() {
        if (F.frames.length < 2) { snapUndo(); frame().getContext('2d').clearRect(0, 0, W0, H0); ui(true); return; }
        F.frames.splice(F.cur, 1);
        F.cur = Math.min(F.cur, F.frames.length - 1); dirty = true; ui(true);
    }
    function thumb(i) {
        let t = root && root.querySelector('.fl-th[data-f="' + i + '"] canvas'); if (!t) return;
        let x = t.getContext('2d'); x.fillStyle = PAPERS[F.paper]; x.fillRect(0, 0, t.width, t.height); x.drawImage(frame(i), 0, 0, t.width, t.height);
    }
    function strip() {
        let s = $('fl-strip'); if (!s) return;
        s.innerHTML = F.frames.map((f, i) => `<button class="fl-th${i === F.cur ? ' on' : ''}" data-f="${i}"><canvas width="64" height="48"></canvas><em>${i + 1}</em></button>`).join('');
        F.frames.forEach((f, i) => thumb(i));
        let on = s.querySelector('.on'); if (on) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    function ui(full) {
        if (!root) return;
        render();
        $('fl-num').textContent = L('frame', F.cur + 1, F.frames.length);
        $('fl-fpsl').textContent = LL('speed', F.fps + 'fps');
        root.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === F.tool));
        root.querySelectorAll('[data-sz]').forEach(b => b.classList.toggle('on', +b.dataset.sz === F.size));
        root.querySelectorAll('[data-ink]').forEach(b => b.classList.toggle('on', +b.dataset.ink === F.ink));
        root.querySelector('[data-act="onion"]').classList.toggle('on', F.onion);
        let thumbs = root.querySelectorAll('.fl-th');
        if (full || thumbs.length !== F.frames.length) strip();
        else thumbs.forEach((t, i) => t.classList.toggle('on', i === F.cur));
        editor();
    }

    let playing = [];
    function src(at, when) {
        let s = F.snd; if (!s || !s.buf) return null;
        let A = AC(), n = A.createBufferSource(), g = A.createGain();
        n.buffer = s.buf; g.gain.value = s.vol; n.connect(g); g.connect(when || OUT(A));
        let off = s.start + (at || 0), len = s.end - off;
        if (len <= 0.01) return null;
        n.start(A.currentTime, off, len); playing.push(n); return n;
    }
    function hush() { playing.forEach(n => { try { n.stop(); } catch (e) {} }); playing = []; }
    function play(into, done) {
        if (F.playing) { stopPlay(); return; }
        let A = AC(); if (A.state === 'suspended') A.resume();
        F.playing = true; let i = into ? 0 : F.cur, t0 = performance.now(), base = i;
        src(i / F.fps, into);
        $('fl-play').innerHTML = '■ ' + esc(L('stop'));
        const step = () => {
            if (!F.playing) return;
            let k = base + Math.floor((performance.now() - t0) / 1000 * F.fps);
            if (k >= F.frames.length) {
                if (F.loop && !into && !rec) { hush(); base = 0; t0 = performance.now(); k = 0; i = -1; src(0); }
                else { stopPlay(); if (done) done(); return; }
            }
            if (k !== i) {
                i = k; F.cur = k; render(k);
                let n = $('fl-num'); if (n) n.textContent = L('frame', k + 1, F.frames.length);
            }
            playT = requestAnimationFrame(step);
        };
        render(i);
        playT = requestAnimationFrame(step);
    }
    function stopPlay() {
        if (!F || !F.playing) return;
        F.playing = false; cancelAnimationFrame(playT); hush();
        let p = $('fl-play'); if (p) p.innerHTML = '▶ ' + esc(L('play'));
        ui();
    }

    function editor() {
        let ed = $('fl-ed'); if (!ed) return;
        let s = F.snd;
        let h = `<div class="fl-row"><button class="fl-b${rec ? ' hot' : ''}" data-snd="rec">${rec ? '■ ' + esc(L('recStop')) : '● ' + esc(L(s ? 'reRec' : 'rec'))}</button>`;
        if (s && !rec) h += `<button class="fl-b" data-snd="test">▶ ${esc(L('test'))}</button><button class="fl-b" data-snd="clear">✕</button>`;
        h += '</div>';
        h += s ? `<canvas class="fl-wave" id="fl-wave" width="220" height="34"></canvas><p class="fl-nm">${s.buf.duration.toFixed(1)}s</p>` : `<p class="fl-nm">${esc(LL('recHint'))}</p>`;
        ed.innerHTML = h;
        if (s) wave(s);
    }
    function wave(s) {
        let c = $('fl-wave'); if (!c) return;
        let x = c.getContext('2d'), d = s.buf.getChannelData(0), n = c.width, step = Math.max(1, Math.floor(d.length / n)), dur = s.buf.duration;
        x.clearRect(0, 0, n, c.height); x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(0, 0, n, c.height);
        x.fillStyle = getComputedStyle(root).getPropertyValue('--neon-primary') || '#ff5fa2';
        for (let i = 0; i < n; i++) { let m = 0; for (let j = 0; j < step; j += 8) m = Math.max(m, Math.abs(d[i * step + j] || 0)); let h = Math.max(1, m * c.height); x.fillRect(i, (c.height - h) / 2, 1, h); }
    }
    async function take(blob) {
        try {
            let A = AC(), buf = await A.decodeAudioData(await blob.arrayBuffer());
            if (buf.duration > MAXSEC) { say(LL('tooLong')); return; }
            F.snd = { buf, start: 0, end: buf.duration, vol: 1 }; dirty = true; ui();
        } catch (e) { say(LL('badFile')); }
    }
    async function record() {
        if (rec) { let r = rec; rec = null; r.mr.stop(); editor(); return; }
        if (!navigator.mediaDevices || !window.MediaRecorder) { say(LL('micNo')); return; }
        let stream;
        try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { say(LL('micNo')); return; }
        let mr = new MediaRecorder(stream), parts = [];
        mr.ondataavailable = e => { if (e.data.size) parts.push(e.data); };
        mr.onstop = () => { stream.getTracks().forEach(t => t.stop()); stopPlay(); take(new Blob(parts, { type: mr.mimeType })); say(''); editor(); };
        stopPlay(); rec = { mr }; F.snd = null; mr.start(); say(LL('recording'), 0);
        F.cur = 0; play(null, () => { if (rec && rec.mr === mr) record(); });
        setTimeout(() => { if (rec && rec.mr === mr) record(); }, MAXSEC * 1000);
        editor();
    }

    function wav(buf) {
        let ch = buf.getChannelData(0), n = ch.length, out = new DataView(new ArrayBuffer(44 + n * 2)), sr = buf.sampleRate;
        if (buf.numberOfChannels > 1) { let r = buf.getChannelData(1); ch = ch.map((v, i) => (v + r[i]) / 2); }
        const w = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
        w(0, 'RIFF'); out.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true);
        out.setUint32(24, sr, true); out.setUint32(28, sr * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * 2, true);
        for (let i = 0; i < n; i++) out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, ch[i])) * 32767, true);
        return new Blob([out.buffer], { type: 'audio/wav' });
    }
    const b64 = blob => new Promise(r => { let f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(blob); });
    function download(blob, name) { let a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }
    const stamp = () => new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
    async function pack() {
        return { vflip: 1, fps: F.fps, paper: F.paper, loop: F.loop, frames: F.frames.map(c => c.toDataURL('image/png')), snd: F.snd ? await b64(wav(F.snd.buf)) : null };
    }
    async function keepIt() {
        if (!os.files) { say(LL('badFile')); return; }
        let out = await pack(), nm = 'flipbook_' + stamp();
        try {
            await os.files.put({ app: 'flip', kind: 'vflip', name: nm, thumb: os.files.thumb(flat(0), 160), frames: F.frames.length, fps: F.fps, snd: !!F.snd, blob: new Blob([JSON.stringify(out)], { type: 'application/json' }) });
            dirty = false; say(LL('kept')); os.files.told(nm + '.vflip');
        } catch (e) { say(LL('badFile')); }
    }
    function flat(i) { let c = mk(), x = c.getContext('2d'); x.fillStyle = PAPERS[F.paper] || '#f4efe2'; x.fillRect(0, 0, c.width, c.height); x.drawImage(F.frames[i], 0, 0); return c; }
    async function saveFile() {
        let out = { vflip: 1, fps: F.fps, paper: F.paper, loop: F.loop, frames: F.frames.map(c => c.toDataURL('image/png')), snd: F.snd ? await b64(wav(F.snd.buf)) : null };
        download(new Blob([JSON.stringify(out)], { type: 'application/json' }), 'flipbook_' + stamp() + '.vflip');
        dirty = false; say(LL('saved'));
    }
    async function openFile(file) {
        try {
            let d = JSON.parse(await file.text());
            if (!d || d.vflip !== 1 || !Array.isArray(d.frames) || !d.frames.length) throw 0;
            stopPlay(); fresh();
            F.fps = Math.max(1, Math.min(30, +d.fps || 8)); F.paper = PAPERS[d.paper] ? d.paper : 0; F.loop = d.loop !== false;
            F.frames = await Promise.all(d.frames.map(u => new Promise(r => { let c = mk(), im = new Image(); im.onload = () => { c.getContext('2d').drawImage(im, 0, 0); r(c); }; im.onerror = () => r(c); if (/^data:image\/png;base64,/.test(u)) im.src = u; else r(c); })));
            if (typeof d.snd === 'string' && /^data:audio\/wav;base64,/.test(d.snd)) await take(await (await fetch(d.snd)).blob());
            $('fl-fps').value = F.fps; $('fl-loop').checked = F.loop; dirty = false; ui(true);
        } catch (e) { say(LL('badFile')); }
    }
    function saveVideo() {
        if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) { say(LL('micNo')); return; }
        stopPlay();
        let A = AC(), dest = A.createMediaStreamDestination(), big = document.createElement('canvas'); big.width = W0 * 2; big.height = H0 * 2;
        let bx = big.getContext('2d'); bx.imageSmoothingEnabled = false;
        let types = ['video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4'], type = types.find(t => MediaRecorder.isTypeSupported(t)) || '';
        let stream = new MediaStream([...big.captureStream(30).getVideoTracks(), ...dest.stream.getAudioTracks()]);
        let mr = new MediaRecorder(stream, type ? { mimeType: type } : {}), parts = [];
        mr.ondataavailable = e => { if (e.data.size) parts.push(e.data); };
        mr.onstop = () => { let b = new Blob(parts, { type: mr.mimeType || 'video/webm' }); download(b, 'flipbook_' + stamp() + (/mp4/.test(b.type) ? '.mp4' : '.webm')); say(LL('saved')); };
        let copy = () => { bx.drawImage(cv, 0, 0, big.width, big.height); if (mr.state === 'recording') requestAnimationFrame(copy); };
        mr.start(); copy(); say(LL('making'), 0);
        let wasLoop = F.loop; F.loop = false; F.cur = 0;
        play(dest, () => { F.loop = wasLoop; setTimeout(() => mr.stop(), 400); });
    }

    let sayT = 0;
    function say(t, ms) { let m = $('fl-msg'); if (!m) return; m.textContent = t; m.classList.toggle('on', !!t); clearTimeout(sayT); if (t && ms !== 0) sayT = setTimeout(() => m.classList.remove('on'), ms || 2600); }

    function wire() {
        cv = $('fl-cv'); cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false;
        wireDraw();
        root.addEventListener('click', e => {
            let b = e.target.closest('button'); if (!b || !root.contains(b)) return;
            if (b.dataset.tool) { F.tool = b.dataset.tool; ui(); return; }
            if (b.dataset.sz) { F.size = +b.dataset.sz; if (F.tool === 'fill') F.tool = 'pen'; ui(); return; }
            if (b.dataset.ink) { F.ink = +b.dataset.ink; if (F.tool === 'eraser') F.tool = 'pen'; ui(); return; }
            if (b.dataset.f) { go(+b.dataset.f); return; }
            let s = b.dataset.snd;
            if (s === 'rec') { record(); return; }
            if (s === 'test') { F.cur = 0; play(); return; }
            if (s === 'clear') { stopPlay(); F.snd = null; ui(); return; }
            let a = b.dataset.act;
            if (a === 'play') play();
            if (a === 'prev') go(F.cur - 1);
            if (a === 'next') go(F.cur + 1);
            if (a === 'add') addFrame(false);
            if (a === 'dup') addFrame(true);
            if (a === 'del') delFrame();
            if (a === 'undo') undo();
            if (a === 'onion') { F.onion = !F.onion; ui(); }
            if (a === 'paper') { F.paper = (F.paper + 1) % PAPERS.length; ui(true); }
            if (a === 'save') saveFile();
            if (a === 'keep') keepIt();
            if (a === 'open') $('fl-file').click();
            if (a === 'vid') { if (F.frames.length < 2 && !F.frames[0].getContext('2d').getImageData(0, 0, W0, H0).data.some(v => v)) say(LL('empty')); else saveVideo(); }
        });
        root.addEventListener('input', e => {
            let t = e.target;
            if (t.id === 'fl-fps') { F.fps = +t.value; $('fl-fpsl').textContent = LL('speed', F.fps + 'fps'); }
        });
        root.addEventListener('change', e => {
            let t = e.target;
            if (t.id === 'fl-loop') F.loop = t.checked;
            if (t.id === 'fl-file' && t.files[0]) { openFile(t.files[0]); t.value = ''; }
        });
    }
    function key(e) {
        if (!root || asleep || !root.closest('.is-active')) return;
        if (/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '') && e.target.type !== 'range' && e.target.type !== 'checkbox') return;
        // its not saved, so escape needs a second press
        if (e.key === 'Escape' && dirty) { if (Date.now() - leaveArm > 2500) { leaveArm = Date.now(); say(LL('leaveWarn')); e.preventDefault(); e.stopImmediatePropagation(); } return; }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
        if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopImmediatePropagation(); go(F.cur - 1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); e.stopImmediatePropagation(); go(F.cur + 1); }
        else if (e.key === ' ') { e.preventDefault(); play(); }
    }
    function homeGuard(e) {
        let b = e.target.closest && e.target.closest('[data-gg="home"]');
        if (!b || !root || !dirty) return;
        if (Date.now() - leaveArm > 2500) { leaveArm = Date.now(); say(LL('leaveWarn')); e.preventDefault(); e.stopImmediatePropagation(); }
    }

    os.gg = os.gg || {}; os.gg.hooks = os.gg.hooks || {};
    os.gg.hooks.flip = {
        start(el) {
            root = el; asleep = false; dirty = false; fresh();
            style = css(); el.innerHTML = markup();
            wire(); ui(true);
            if (os.gg.pending && os.gg.pending.game === 'flip') { let f = os.gg.pending.file; os.gg.pending = null; openFile(f); }
            window.addEventListener('keydown', key, true); window.addEventListener('click', homeGuard, true);
        },
        pause() { asleep = true; if (rec) record(); stopPlay(); },
        resume() { asleep = false; },
        load(f) { openFile(f); },
        best() { return 0; },
        scores() { return []; },
        stop() {
            stopPlay(); if (rec) { let r = rec; rec = null; try { r.mr.stop(); } catch (e) {} }
            window.removeEventListener('keydown', key, true); window.removeEventListener('click', homeGuard, true);
            if (style) style.remove(); if (root) root.innerHTML = '';
            root = null; style = null; F = null; cv = null; cx = null;
            delete os.gg.hooks.flip;
        }
    };

    function css() {
        let s = document.createElement('style');
        s.textContent = `
            .fl { height: 100%; display: grid; grid-template-rows: auto minmax(0, 1fr) auto auto auto; gap: 7px; font-size: 12px; color: #fff; user-select: none; }
            .fl-tools { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
            .fl-sep { width: 1px; height: 22px; background: rgba(255,255,255,0.12); margin: 0 4px; }
            .fl button { font: inherit; color: inherit; cursor: inherit; }
            .fl-t, .fl-sz { width: 30px; height: 28px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.04); display: grid; place-items: center; font-size: 15px; padding: 0; }
            .fl-sz i { display: block; background: #fff; }
            .fl-t.on, .fl-sz.on { border-color: var(--neon-primary); background: color-mix(in srgb, var(--neon-primary) 25%, transparent); }
            .fl-ink { width: 22px; height: 22px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.25); padding: 0; }
            .fl-ink.on { border-color: #fff; box-shadow: 0 0 0 2px var(--neon-primary); }
            .fl-mid { display: grid; grid-template-columns: minmax(0, 1fr) 220px; gap: 10px; min-height: 0; }
            .fl-stage { position: relative; display: grid; place-items: center; min-height: 0; background: #050407; border-radius: 6px; overflow: hidden; }
            #fl-cv { max-width: 100%; max-height: 100%; aspect-ratio: 4 / 3; image-rendering: pixelated; touch-action: none; box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 6px 18px rgba(0,0,0,0.6); cursor: crosshair; }
            .fl-msg { position: absolute; left: 50%; top: 10px; transform: translateX(-50%); padding: 5px 10px; border-radius: 6px; background: rgba(0,0,0,0.8); opacity: 0; transition: opacity 0.2s; pointer-events: none; white-space: nowrap; }
            .fl-msg.on { opacity: 1; }
            .fl-side { display: flex; flex-direction: column; gap: 6px; overflow-y: auto; min-height: 0; padding-right: 2px; }
            .fl-row { display: flex; gap: 4px; align-items: center; }
            .fl-b { flex: 1; padding: 5px 6px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.04); white-space: nowrap; }
            .fl-b:hover, .fl-t:hover, .fl-sz:hover { border-color: var(--neon-secondary); }
            .fl-b.big { padding: 7px; font-size: 13px; background: color-mix(in srgb, var(--neon-primary) 30%, transparent); border-color: var(--neon-primary); }
            .fl-b.hot { background: #c41b3d; border-color: #ff4a6a; }
            .fl-ctrl { display: flex; align-items: center; gap: 5px; } .fl-ctrl .fl-b { flex: 0 0 auto; min-width: 32px; } .fl-ctrl .fl-b.big { min-width: 96px; }
            .fl-lab.fl-fps { flex: 1; flex-direction: row; align-items: center; gap: 8px; } .fl-fps span { white-space: nowrap; min-width: 120px; }
            .fl-num { flex: 0 0 64px; text-align: center; font-variant-numeric: tabular-nums; }
            .fl-lab { display: flex; flex-direction: column; gap: 2px; font-size: 11px; opacity: 0.9; } .fl-lab input { width: 100%; accent-color: var(--neon-primary); }
            .fl-chk { display: flex; align-items: center; gap: 6px; font-size: 11px; } .fl-chk input { accent-color: var(--neon-primary); }
            .fl-h { font-weight: normal; font-size: 11px; opacity: 0.8; letter-spacing: 1px; }
            .fl-ed { display: flex; flex-direction: column; gap: 5px; padding: 6px; border-radius: 6px; background: rgba(0,0,0,0.3); }
            .fl-nm { margin: 0; font-size: 10px; opacity: 0.7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .fl-wave { width: 100%; height: 34px; border-radius: 4px; }
            .fl-files .fl-b { font-size: 11px; padding: 5px 3px; }
            .fl-strip { display: flex; gap: 5px; overflow-x: auto; padding: 2px 2px 6px; }
            .fl-th { position: relative; flex: 0 0 auto; padding: 0; border: 2px solid transparent; border-radius: 4px; background: none; }
            .fl-th canvas { display: block; width: 64px; height: 48px; image-rendering: pixelated; border-radius: 2px; }
            .fl-th.on { border-color: var(--neon-primary); }
            .fl-th em { position: absolute; left: 2px; bottom: 1px; font-style: normal; font-size: 9px; color: #000; background: rgba(255,255,255,0.7); padding: 0 2px; border-radius: 2px; }
            .fl-hint { margin: 0; font-size: 10px; opacity: 0.5; text-align: center; }
            @media (max-width: 760px) { .fl-mid { grid-template-columns: 1fr; } .fl-side { max-height: 170px; } }
        `;
        document.head.appendChild(s);
        return s;
    }
})();
