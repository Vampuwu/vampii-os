// timelapse + the reference pic thing
window.os = window.os || {};

(function () {
    const $ = id => document.getElementById(id);
    const st = os.paintState;
    const say = (t, ms) => { if (os.paintUI) os.paintUI.status(t, ms); };
    const click = () => { if (typeof os.clickAudio === 'function') os.clickAudio(); };
    const open = () => { let w = $('win-paint.exe'); return !!(w && st && st.layers && st.layers.length); };

    // session only. paintings dont save themselves so this doesnt either
    const TL = { frames: [], w: 0, h: 0, at: 0, t: 0, max: 4000 };
    function snap() {
        clearTimeout(TL.t);
        let wait = Math.max(0, 250 - (performance.now() - TL.at));
        TL.t = setTimeout(() => (window.requestIdleCallback || (f => f()))(() => {
            if (!open()) return;
            TL.at = performance.now();
            let k = Math.min(1, 720 / Math.max(st.W, st.H)), w = Math.max(2, Math.round(st.W * k)), h = Math.max(2, Math.round(st.H * k));
            if (TL.frames.length && (w !== TL.w || h !== TL.h)) TL.frames = [];
            TL.w = w; TL.h = h;
            let c = document.createElement('canvas'); c.width = w; c.height = h;
            let x = c.getContext('2d');
            x.fillStyle = st.paper ? st.bgColor : '#ffffff'; x.fillRect(0, 0, w, h);
            x.scale(k, k); os.paintCompose(x, false);
            c.toBlob(b => {
                if (!b) return;
                TL.frames.push(b);
                if (TL.frames.length > TL.max) TL.frames = TL.frames.filter((f, i) => i % 2 === 0);
                let n = $('pt-tln'); if (n) n.textContent = TL.frames.length;
            }, 'image/jpeg', 0.82);
        }, { timeout: 1500 }), wait);
    }
    function hook() {
        let H = os.paintHist;
        if (!H || H._tl) return;
        H._tl = true;
        let push = H.push; H.push = function () { let r = push.apply(this, arguments); snap(); return r; };
        let u = os.paintUndo, rd = os.paintRedo;
        os.paintUndo = function () { let r = u.apply(this, arguments); snap(); return r; };
        os.paintRedo = function () { let r = rd.apply(this, arguments); snap(); return r; };
        let fresh = os.paintLayers.freshDoc;
        os.paintLayers.freshDoc = function () { TL.frames = []; return fresh.apply(this, arguments); };
    }

    let play = null;
    function tlPanel() {
        let wrap = document.querySelector('#win-paint\\.exe .paint-app-wrap'); if (!wrap) return;
        let box = $('pt-tl'); if (box) { tlStop(); box.remove(); return; }
        box = document.createElement('div'); box.id = 'pt-tl'; box.className = 'pt-panelpop';
        box.innerHTML = `<div class="pt-bh"><b>録画 // TIMELAPSE</b><small><span id="pt-tln">${TL.frames.length}</span> コマ // frames · このセッションだけ // this session only</small></div>
            <canvas id="pt-tlc" width="${TL.w || 320}" height="${TL.h || 180}"></canvas>
            <input type="range" id="pt-tlpos" min="0" max="${Math.max(0, TL.frames.length - 1)}" value="0">
            <div class="pt-row"><button type="button" class="pt-mini big" data-tl="play">▶ 再生 // PLAY</button>
            <label class="pt-lab">速さ // SPEED <select id="pt-tlfps" class="pt-sel">${[6, 12, 24, 48].map(f => `<option value="${f}" ${f === 24 ? 'selected' : ''}>${f} fps</option>`).join('')}</select></label></div>
            <div class="pt-row"><button type="button" class="pt-mini big" data-tl="save">⤓ 動画で保存 // SAVE VIDEO</button><button type="button" class="pt-mini big" data-tl="wipe">消す // CLEAR</button><button type="button" class="pt-mini big" data-tl="x">閉じる // CLOSE</button></div>`;
        wrap.appendChild(box);
        let pos = $('pt-tlpos');
        pos.oninput = () => { tlStop(); show(+pos.value); };
        box.onclick = e => {
            let b = e.target.closest('[data-tl]'); if (!b) return; click();
            let k = b.dataset.tl;
            if (k === 'play') { if (play) tlStop(); else tlPlay(); }
            if (k === 'save') tlSave();
            if (k === 'wipe') { tlStop(); TL.frames = []; $('pt-tln').textContent = '0'; pos.max = 0; let c = $('pt-tlc'); c.getContext('2d').clearRect(0, 0, c.width, c.height); say('録画を消した // timelapse cleared'); }
            if (k === 'x') { tlStop(); box.remove(); }
        };
        show(TL.frames.length - 1);
    }
    async function show(i, into) {
        let f = TL.frames[i]; if (!f) return;
        let c = into || $('pt-tlc'); if (!c) return;
        if (c.width !== TL.w || c.height !== TL.h) { c.width = TL.w; c.height = TL.h; }
        try { let bm = await createImageBitmap(f); c.getContext('2d').drawImage(bm, 0, 0); bm.close && bm.close(); } catch (e) {}
        let p = $('pt-tlpos'); if (p && !into) { p.max = Math.max(0, TL.frames.length - 1); p.value = i; }
    }
    function tlPlay() {
        if (!TL.frames.length) { say('まだ何もない // nothing recorded yet. draw something'); return; }
        let fps = +($('pt-tlfps') || { value: 24 }).value, p = $('pt-tlpos'), i = p && +p.value < TL.frames.length - 1 ? +p.value : 0;
        let b = document.querySelector('[data-tl="play"]'); if (b) b.textContent = '❚❚ 止める // STOP';
        play = setInterval(() => { if (!$('pt-tl') || i >= TL.frames.length) { tlStop(); return; } show(i++); }, 1000 / fps);
    }
    function tlStop() { clearInterval(play); play = null; let b = document.querySelector('[data-tl="play"]'); if (b) b.textContent = '▶ 再生 // PLAY'; }
    async function tlSave() {
        if (!TL.frames.length) { say('まだ何もない // nothing recorded yet'); return; }
        if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) { say('このブラウザは動画を作れない // ur browser cant make videos'); return; }
        tlStop();
        let fps = +($('pt-tlfps') || { value: 24 }).value, c = document.createElement('canvas'); c.width = TL.w; c.height = TL.h;
        let types = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'], type = types.find(t => MediaRecorder.isTypeSupported(t)) || '';
        let rec = new MediaRecorder(c.captureStream(fps), type ? { mimeType: type, videoBitsPerSecond: 4e6 } : {}), parts = [];
        rec.ondataavailable = e => { if (e.data && e.data.size) parts.push(e.data); };
        rec.onstop = () => {
            let blob = new Blob(parts, { type: rec.mimeType || 'video/webm' }), a = document.createElement('a');
            a.href = URL.createObjectURL(blob); a.download = 'timelapse_' + new Date().toISOString().slice(0, 10) + (/mp4/.test(blob.type) ? '.mp4' : '.webm');
            document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
            say('保存した // saved the timelapse');
        };
        rec.start();
        say('動画を作ってる… // making the video… (' + Math.ceil(TL.frames.length / fps) + 's)', 60000);
        // hold the last frame a sec so it doesnt just cut off
        for (let i = 0; i < TL.frames.length; i++) { await show(i, c); await new Promise(r => setTimeout(r, 1000 / fps)); }
        await new Promise(r => setTimeout(r, 1000));
        rec.stop();
    }

    let ref = { z: 1, x: 0, y: 0, src: '' };
    function refPanel(show) {
        let wrap = document.querySelector('#win-paint\\.exe .paint-app-wrap'); if (!wrap) return;
        let box = $('pt-ref');
        if (box && show == null) { box.hidden = !box.hidden; return; }
        if (box) { box.hidden = false; return; }
        box = document.createElement('div'); box.id = 'pt-ref';
        box.innerHTML = `<div class="pt-refh"><b>資料 // REF</b><input type="range" id="pt-refop" min="15" max="100" value="100" title="不透明 // opacity"><button type="button" data-rf="pick" title="画像を開く // open a picture">開く</button><button type="button" data-rf="fit" title="ぴったり // fit">⤢</button><button type="button" data-rf="x" title="隠す // hide">✕</button></div>
            <div class="pt-refb"><img alt="" draggable="false"><p>ここに画像をドロップ / ペースト<br>drop or paste a picture here</p></div><input type="file" accept="image/*" hidden>`;
        wrap.appendChild(box);
        let img = box.querySelector('img'), body = box.querySelector('.pt-refb'), file = box.querySelector('input[type=file]');
        const put = () => { img.style.transform = `translate(${ref.x}px, ${ref.y}px) scale(${ref.z})`; };
        const load = f => { if (!f || !/^image\//.test(f.type)) return; if (ref.src) URL.revokeObjectURL(ref.src); ref.src = URL.createObjectURL(f); img.src = ref.src; ref.z = 1; ref.x = ref.y = 0; put(); box.classList.add('has'); };
        os.paintRefLoad = load;
        if (ref.src) { img.src = ref.src; box.classList.add('has'); put(); }
        file.onchange = () => load(file.files[0]);
        box.querySelector('#pt-refop').oninput = e => { box.style.setProperty('--ref-op', e.target.value / 100); };
        box.onclick = e => {
            let b = e.target.closest('[data-rf]'); if (!b) return; click();
            if (b.dataset.rf === 'pick') file.click();
            if (b.dataset.rf === 'fit') { ref.z = 1; ref.x = ref.y = 0; put(); }
            if (b.dataset.rf === 'x') box.hidden = true;
        };
        body.addEventListener('dragover', e => e.preventDefault());
        body.addEventListener('drop', e => { e.preventDefault(); e.stopPropagation(); load(e.dataTransfer && e.dataTransfer.files[0]); });
        body.addEventListener('wheel', e => {
            e.preventDefault();
            let r = body.getBoundingClientRect(), mx = e.clientX - r.left - r.width / 2, my = e.clientY - r.top - r.height / 2, k = e.deltaY < 0 ? 1.15 : 1 / 1.15, z = Math.max(0.2, Math.min(12, ref.z * k));
            ref.x = mx - (mx - ref.x) * (z / ref.z); ref.y = my - (my - ref.y) * (z / ref.z); ref.z = z; put();
        }, { passive: false });
        let pan = null;
        body.addEventListener('pointerdown', e => { if (!ref.src) { file.click(); return; } pan = { x: e.clientX - ref.x, y: e.clientY - ref.y }; try { body.setPointerCapture(e.pointerId); } catch (er) {} });
        body.addEventListener('pointermove', e => { if (!pan) return; ref.x = e.clientX - pan.x; ref.y = e.clientY - pan.y; put(); });
        body.addEventListener('pointerup', () => { pan = null; });
        let hd = box.querySelector('.pt-refh'), mv = null;
        hd.addEventListener('pointerdown', e => { if (e.target.closest('button,input')) return; let r = box.getBoundingClientRect(), pr = wrap.getBoundingClientRect(); mv = { dx: e.clientX - r.left + pr.left, dy: e.clientY - r.top + pr.top }; try { hd.setPointerCapture(e.pointerId); } catch (er) {} });
        hd.addEventListener('pointermove', e => { if (!mv) return; box.style.left = Math.max(0, e.clientX - mv.dx) + 'px'; box.style.top = Math.max(0, e.clientY - mv.dy) + 'px'; box.style.right = 'auto'; });
        hd.addEventListener('pointerup', () => { mv = null; });
    }
    document.addEventListener('paste', e => {
        let box = $('pt-ref'), w = $('win-paint.exe');
        if (!box || box.hidden || !w || !w.classList.contains('is-active')) return;
        let it = [...(e.clipboardData ? e.clipboardData.items : [])].find(i => /^image\//.test(i.type));
        if (it && os.paintRefLoad) { e.preventDefault(); os.paintRefLoad(it.getAsFile()); }
    });

    function buttons() {
        let crt = $('pt-crt'); if (!crt || $('pt-tlbtn')) return;
        let a = document.createElement('button'); a.type = 'button'; a.id = 'pt-tlbtn'; a.className = 'pt-ib'; a.title = '録画 // timelapse'; a.innerHTML = '<i class="pt-bi" data-em="pt-b-time"></i>'; a.onclick = () => { click(); tlPanel(); };
        let b = document.createElement('button'); b.type = 'button'; b.id = 'pt-refbtn'; b.className = 'pt-ib'; b.innerHTML = '<i class="pt-bi" data-em="pt-b-ref"></i>'; b.title = '参考画像 // a reference picture to look at while u draw'; b.onclick = () => { click(); refPanel(); };
        crt.after(a, b);
        hook();
        snap();
    }
    const base = os.summon;
    os.summon = function (id) { let r = base.apply(this, arguments); if (id === 'paint.exe') setTimeout(buttons, 200); return r; };
    if ($('win-paint.exe')) setTimeout(buttons, 200);

    let css = document.createElement('style');
    css.textContent = `
        #pt-tl { left: auto; right: 210px; width: 360px; }
        #pt-tlc { width: 100%; height: auto; background: #fff; box-shadow: inset 1px 1px 0 var(--p9-lo, #000), 0 0 0 1px var(--p9-lo2, #000); image-rendering: auto; }
        #pt-tlpos { width: 100%; }
        #pt-ref { position: absolute; right: 214px; top: 70px; z-index: 25; width: 300px; height: 260px; min-width: 160px; min-height: 120px; resize: both; overflow: hidden; display: flex; flex-direction: column;
            background: var(--p9-face, #d9d6df); box-shadow: inset 1px 1px 0 var(--p9-hi, #fff), inset -1px -1px 0 var(--p9-lo, #2b2833), inset -2px -2px 0 var(--p9-lo2, #8d8998), 3px 4px 0 rgba(0, 0, 0, 0.35); }
        #pt-ref[hidden] { display: none; }
        .pt-refh { display: flex; align-items: center; gap: 4px; padding: 3px 4px 3px 6px; cursor: move; touch-action: none; color: #fff; background: linear-gradient(90deg, color-mix(in srgb, var(--neon-primary) 75%, #1b1430), color-mix(in srgb, var(--neon-primary) 40%, #6a6680)); font-size: 11px; }
        .pt-refh b { font-weight: normal; letter-spacing: 1px; flex: 1; white-space: nowrap; }
        .pt-refh input { width: 60px; }
        .pt-refh button { font: 11px inherit; padding: 1px 6px; border: 0; border-radius: 0; background: var(--p9-face, #d9d6df); color: var(--p9-ink, #1b1822); box-shadow: inset 1px 1px 0 var(--p9-hi, #fff), inset -1px -1px 0 var(--p9-lo, #2b2833); cursor: inherit; }
        .pt-refb { position: relative; flex: 1; overflow: hidden; margin: 3px; background: repeating-conic-gradient(#fff 0 25%, #e4e1e9 0 50%) 0 0 / 12px 12px; box-shadow: inset 1px 1px 0 var(--p9-lo, #2b2833); touch-action: none; }
        .pt-refb img { position: absolute; left: 0; top: 0; width: 100%; height: 100%; object-fit: contain; transform-origin: 50% 50%; opacity: var(--ref-op, 1); user-select: none; pointer-events: none; }
        .pt-refb p { position: absolute; inset: 0; display: grid; place-items: center; margin: 0; text-align: center; font-size: 11px; line-height: 1.6; color: var(--p9-ink, #1b1822); opacity: 0.6; }
        #pt-ref.has .pt-refb p { display: none; } #pt-ref:not(.has) .pt-refb img { display: none; }
        .pt-hint { font-size: 10px; opacity: 0.6; white-space: nowrap; }
    `;
    document.head.appendChild(css);
})();
