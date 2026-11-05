
// resize, move layers, right click menu. the fancy shit
(function () {
    const st = os.paintState;
    const $ = id => document.getElementById(id);
    const click = () => { if (typeof os.clickAudio === 'function') os.clickAudio(); };
    const say = (t, ms) => { if (os.paintUI) os.paintUI.status(t, ms); };
    const mk = (w, h) => { let c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; };
    let X = null;

    function bbox(l, r) {
        r = r || { x: 0, y: 0, w: st.W, h: st.H };
        let d = l.x.getImageData(r.x, r.y, r.w, r.h).data, x0 = r.w, y0 = r.h, x1 = -1, y1 = -1;
        for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) if (d[(y * r.w + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 < 0) return null;
        return { x: r.x + x0, y: r.y + y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    }
    function start() {
        if (X) return;
        let l = os.paintLayers.L();
        if (!l) return;
        let r = st.sel ? { x: Math.max(0, Math.round(st.sel.x)), y: Math.max(0, Math.round(st.sel.y)), w: 0, h: 0 } : null;
        if (r) { r.w = Math.min(st.W - r.x, Math.round(st.sel.w)); r.h = Math.min(st.H - r.y, Math.round(st.sel.h)); }
        let b = bbox(l, r && r.w > 0 && r.h > 0 ? r : null);
        if (!b) { say('このレイヤーには、何もない // nothing on this layer to transform'); return; }
        let src = mk(b.w, b.h); src.getContext('2d').drawImage(l.c, b.x, b.y, b.w, b.h, 0, 0, b.w, b.h);
        let base = mk(st.W, st.H), bx = base.getContext('2d'); bx.drawImage(l.c, 0, 0); bx.clearRect(b.x, b.y, b.w, b.h);
        X = { layer: l, base, src, cx: b.x + b.w / 2, cy: b.y + b.h / 2, w: b.w, h: b.h, rot: 0, fx: 1, fy: 1, ratio: b.w / b.h, ow: b.w, oh: b.h };
        st.sel = null;
        bar(true);
        os.requestPaintRender();
        say('角で拡大縮小・上の丸で回転・中で移動。Enter で確定、Esc で取消 // corners scale, the dot on top rotates, drag inside to move. enter keeps it, esc cancels', 9000);
    }
    function commit() {
        if (!X) return;
        let l = X.layer, H = os.paintHist, i = st.layers.indexOf(l);
        if (i < 0) { X = null; bar(false); return; }
        os.paintLayers.setActive(i);
        H.begin(true);
        l.x.save(); l.x.setTransform(1, 0, 0, 1, 0, 0); l.x.globalAlpha = 1; l.x.globalCompositeOperation = 'source-over';
        l.x.clearRect(0, 0, st.W, st.H); l.x.drawImage(X.base, 0, 0);
        paintSrc(l.x);
        l.x.restore();
        H.end('⤡ 変形 // TRANSFORM');
        X = null; bar(false);
        if (os.paintUI) os.paintUI.side();
        os.requestPaintRender();
        say('変形した // transformed');
    }
    function cancel() { if (!X) return; X = null; bar(false); os.requestPaintRender(); say('取り消した // cancelled. nothing changed'); }
    function paintSrc(c) {
        c.save(); c.translate(X.cx, X.cy); c.rotate(X.rot); c.scale(X.fx, X.fy);
        c.imageSmoothingQuality = 'high';
        c.drawImage(X.src, -X.w / 2, -X.h / 2, X.w, X.h);
        c.restore();
    }

    os.paintXform = {
        on: () => !!X,
        img: l => (X && l === X.layer ? X.base : null),
        draw(ctx, l) { if (X && l === X.layer) paintSrc(ctx); },
        handles(ctx) {
            if (!X) return;
            let z = st.zoom, hs = 6 / z;
            ctx.save(); ctx.translate(X.cx, X.cy); ctx.rotate(X.rot);
            ctx.lineWidth = 1 / z; ctx.setLineDash([6 / z, 4 / z]); ctx.strokeStyle = '#fff';
            ctx.strokeRect(-X.w / 2, -X.h / 2, X.w, X.h);
            ctx.setLineDash([]); ctx.strokeStyle = '#ff2d7a'; ctx.lineDashOffset = 0;
            ctx.strokeRect(-X.w / 2, -X.h / 2, X.w, X.h);
            ctx.beginPath(); ctx.moveTo(0, -X.h / 2); ctx.lineTo(0, -X.h / 2 - 28 / z); ctx.stroke();
            [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => { ctx.fillStyle = '#fff'; ctx.fillRect(sx * X.w / 2 - hs, sy * X.h / 2 - hs, hs * 2, hs * 2); ctx.strokeRect(sx * X.w / 2 - hs, sy * X.h / 2 - hs, hs * 2, hs * 2); });
            ctx.fillStyle = '#ff2d7a'; ctx.beginPath(); ctx.arc(0, -X.h / 2 - 28 / z, hs * 1.1, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
            ctx.save(); ctx.font = (12 / z) + 'px monospace'; ctx.fillStyle = '#fff'; ctx.shadowColor = '#000'; ctx.shadowBlur = 4 / z;
            ctx.fillText(Math.round(X.w) + '×' + Math.round(X.h) + '  ' + Math.round(X.w / X.ow * 100) + '%  ' + Math.round(X.rot * 180 / Math.PI) + '°', X.cx - X.w / 2, X.cy + X.h / 2 + 18 / z);
            ctx.restore();
        },
        start, commit, cancel
    };

    function bar(on) {
        let stage = document.querySelector('#win-paint\\.exe .pt-stage'), b = $('pt-xbar');
        if (!on) { if (b) b.remove(); return; }
        if (!stage || b) return;
        b = document.createElement('div'); b.id = 'pt-xbar';
        b.innerHTML = '<span>⤡ 変形 // TRANSFORM</span><button data-x="fh">⇋ 左右反転</button><button data-x="fv">⇵ 上下反転</button><button data-x="fit">⊡ 紙に合わせる // fit</button><button data-x="reset">↺ 元のサイズ // 100%</button><button data-x="ok" class="ok">✓ 確定 // keep</button><button data-x="no">✕ 取消</button>';
        stage.appendChild(b);
        b.onclick = e => {
            let t = e.target.closest('[data-x]'); if (!t || !X) return;
            click();
            let k = t.dataset.x;
            if (k === 'fh') X.fx *= -1;
            if (k === 'fv') X.fy *= -1;
            if (k === 'fit') { let s = Math.min(st.W / X.ow, st.H / X.oh); X.w = X.ow * s; X.h = X.oh * s; X.cx = st.W / 2; X.cy = st.H / 2; X.rot = 0; }
            if (k === 'reset') { X.w = X.ow; X.h = X.oh; X.rot = 0; }
            if (k === 'ok') return commit();
            if (k === 'no') return cancel();
            os.requestPaintRender();
        };
    }

    let drag = null;
    function art(e, c) { let r = c.getBoundingClientRect(), x = (e.clientX - r.left) * c.width / (r.width || 1), y = (e.clientY - r.top) * c.height / (r.height || 1); return { x: (x - st.panX) / st.zoom, y: (y - st.panY) / st.zoom }; }
    function local(p) { let dx = p.x - X.cx, dy = p.y - X.cy, c = Math.cos(-X.rot), s = Math.sin(-X.rot); return { x: dx * c - dy * s, y: dx * s + dy * c }; }
    function hit(p) {
        let q = local(p), z = st.zoom, R = 11 / z;
        if (Math.hypot(q.x, q.y + X.h / 2 + 28 / z) < R * 1.3) return { k: 'rot' };
        for (let [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) if (Math.abs(q.x - sx * X.w / 2) < R && Math.abs(q.y - sy * X.h / 2) < R) return { k: 'corner', sx, sy };
        if (Math.abs(q.x) <= X.w / 2 && Math.abs(q.y) <= X.h / 2) return { k: 'move' };
        return { k: 'rot' };
    }
    function cursorFor(h) { return h.k === 'move' ? 'move' : h.k === 'corner' ? (h.sx * h.sy > 0 ? 'nwse-resize' : 'nesw-resize') : 'grab'; }
    function wire(c) {
        if (c._xw) return; c._xw = true;
        c.addEventListener('pointerdown', e => {
            if (!X || e.button !== 0) return;
            e.stopImmediatePropagation(); e.preventDefault();
            try { c.setPointerCapture(e.pointerId); } catch (er) {}
            let p = art(e, c), h = hit(p);
            drag = Object.assign({ p0: p, cx: X.cx, cy: X.cy, w: X.w, h: X.h, rot: X.rot, a0: Math.atan2(p.y - X.cy, p.x - X.cx) }, h);
        }, true);
        c.addEventListener('pointermove', e => {
            if (!X) return;
            let p = art(e, c);
            if (!drag) { c.style.cursor = cursorFor(hit(p)); return; }
            e.stopImmediatePropagation();
            if (drag.k === 'move') { X.cx = drag.cx + p.x - drag.p0.x; X.cy = drag.cy + p.y - drag.p0.y; }
            else if (drag.k === 'rot') { let a = drag.rot + Math.atan2(p.y - drag.cy, p.x - drag.cx) - drag.a0; if (e.shiftKey) a = Math.round(a / (Math.PI / 12)) * (Math.PI / 12); X.rot = a; }
            else {
                // hold shift to squish it
                let c0 = Math.cos(drag.rot), s0 = Math.sin(drag.rot);
                let ox = -drag.sx * drag.w / 2, oy = -drag.sy * drag.h / 2;
                let dx = p.x - drag.cx, dy = p.y - drag.cy, qx = dx * c0 + dy * s0, qy = -dx * s0 + dy * c0;
                let w = Math.max(4, (qx - ox) * drag.sx), h = Math.max(4, (qy - oy) * drag.sy);
                if (!e.shiftKey) { let k = Math.max(w / drag.w, h / drag.h); w = drag.w * k; h = drag.h * k; }
                let mx = ox + drag.sx * w / 2, my = oy + drag.sy * h / 2;
                X.w = w; X.h = h; X.cx = drag.cx + mx * c0 - my * s0; X.cy = drag.cy + mx * s0 + my * c0;
            }
            os.requestPaintRender();
        }, true);
        const up = e => { if (!X || !drag) return; e.stopImmediatePropagation(); drag = null; };
        c.addEventListener('pointerup', up, true);
        c.addEventListener('pointercancel', up, true);
        c.addEventListener('dblclick', e => { if (X) { e.stopImmediatePropagation(); commit(); } }, true);
        c.addEventListener('dragover', e => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) { e.preventDefault(); } });
        c.addEventListener('drop', e => { let f = e.dataTransfer && e.dataTransfer.files[0]; if (f && /^image\//.test(f.type)) { e.preventDefault(); if (os.paintUI && os.paintUI.open) os.paintUI.open(f); } });
    }
    document.addEventListener('keydown', e => {
        const win = $('win-paint.exe');
        if (!win || !win.classList.contains('is-active') || win.classList.contains('is-min')) return;
        if (/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
        if (X && (e.key === 'Enter')) { e.preventDefault(); e.stopImmediatePropagation(); commit(); }
        else if (X && e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); cancel(); }
        else if (X && /^Arrow/.test(e.key)) { e.preventDefault(); e.stopImmediatePropagation(); let n = e.shiftKey ? 10 : 1; if (e.key === 'ArrowLeft') X.cx -= n; if (e.key === 'ArrowRight') X.cx += n; if (e.key === 'ArrowUp') X.cy -= n; if (e.key === 'ArrowDown') X.cy += n; os.requestPaintRender(); }
        else if ((e.ctrlKey || e.metaKey) && (e.key === 't' || e.key === 'T')) { e.preventDefault(); e.stopImmediatePropagation(); start(); }
        else if (X) { e.stopImmediatePropagation(); }
    }, true);
    const baseSet = os.setPaintTool;
    os.setPaintTool = function (t, b) { if (t === 'xform') { let c = $('paint-canvas'); if (c) wire(c); start(); return; } return baseSet(t, b); };
    os.paintXformWire = () => { let c = $('paint-canvas'); if (c) wire(c); };
    const u0 = os.paintUndo;
    if (u0) os.paintUndo = function () { if (X) return cancel(); return u0.apply(this, arguments); };

    function menu(x, y, items) {
        let old = $('pt-lmenu'); if (old) old.remove();
        let m = document.createElement('div'); m.id = 'pt-lmenu';
        m.innerHTML = items.map((it, i) => it === '-' ? '<hr>' : `<button data-m="${i}"${it[2] ? ' disabled' : ''}>${it[0]}</button>`).join('');
        document.body.appendChild(m);
        let r = m.getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
        m.style.left = Math.max(4, Math.min(x, vw - r.width - 4)) + 'px';
        m.style.top = Math.max(4, Math.min(y, vh - r.height - 4)) + 'px';
        m.onclick = e => { let b = e.target.closest('[data-m]'); if (!b) return; click(); m.remove(); items[+b.dataset.m][1](); };
        const bye = e => { if (!m.contains(e.target)) { m.remove(); removeEventListener('pointerdown', bye, true); } };
        setTimeout(() => addEventListener('pointerdown', bye, true), 0);
        m.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); };
    }
    function layerOps(i) {
        const S = os.paintHist, LY = os.paintLayers, l = st.layers[i], n = st.layers.length, ui = os.paintUI;
        const redraw = () => { if (ui) ui.side(); os.requestPaintRender(); if (os.paintChanged) os.paintChanged(); };
        const pix = (label, fn) => { LY.setActive(i); S.begin(true); l.x.save(); fn(l.x); l.x.restore(); S.end(label); redraw(); };
        const flip = (h) => pix(h ? '⇋ 左右反転 // FLIP H' : '⇵ 上下反転 // FLIP V', c => { let t = mk(st.W, st.H); t.getContext('2d').drawImage(l.c, 0, 0); c.clearRect(0, 0, st.W, st.H); c.translate(h ? st.W : 0, h ? 0 : st.H); c.scale(h ? -1 : 1, h ? 1 : -1); c.drawImage(t, 0, 0); });
        return [
            ['✎ 名前を変える // rename', () => { let el = document.querySelector('#pt-layers [data-ren="' + i + '"]'); if (el) el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); }],
            ['⧉ 複製 // duplicate', () => { LY.setActive(i); $('pt-ldup').click(); }, n >= 24],
            ['＋ 上に新規 // new layer above', () => { LY.setActive(i); $('pt-ladd').click(); }, n >= 24],
            ['⤓ 下と結合 // merge down', () => { st.picked = []; LY.setActive(i); $('pt-lmerge').click(); }, i < 1],
            [((st.picked || []).includes(l) && st.picked.length > 1 ? '☑' : '☐') + ' 結合用に選ぶ // pick for merging', () => { ui.pick(l); redraw(); }],
            ['⤓ 選んだのを結合 // merge the picked ones', () => { ui.mergeList(st.picked || [], '⤓ 結合 // MERGE ' + (st.picked || []).length); }, (st.picked || []).filter(x => st.layers.includes(x)).length < 2],
            ['⧈ 見えてるの全部結合 // merge visible', () => ui.mergeVisible(), st.layers.filter(x => x.vis).length < 2],
            '-',
            ['⤡ 変形 // transform (ctrl+T)', () => { LY.setActive(i); os.paintXformWire(); st.sel = null; start(); }],
            ['⇋ 左右反転 // flip horizontal', () => flip(true)],
            ['⇵ 上下反転 // flip vertical', () => flip(false)],
            ['▣ 中身を選択 // select contents', () => { let b = bbox(l); if (b) { LY.setActive(i); st.sel = b; redraw(); } else say('空っぽ // empty layer'); }],
            ['■ C1 で塗りつぶす // fill with C1', () => pix('■ 塗りつぶし // FILL', c => { c.fillStyle = st.color1; c.fillRect(0, 0, st.W, st.H); })],
            ['▢ 中身を消す // clear layer', () => pix('▢ 消去 // CLEAR LAYER', c => c.clearRect(0, 0, st.W, st.H))],
            '-',
            ['⤒ 一番上へ // move to top', () => moveTo(i, n - 1), i >= n - 1],
            ['⤓ 一番下へ // move to bottom', () => moveTo(i, 0), i <= 0],
            ['⤓ このレイヤーだけ PNG // export this layer', () => { let c = mk(st.W, st.H); c.getContext('2d').drawImage(l.c, 0, 0); c.toBlob(b => { let a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = (l.name || 'layer').replace(/[^\w\-ぁ-んァ-ン一-龥]+/g, '_') + '.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }, 'image/png'); say('レイヤーを保存 // layer saved (see-through)'); }],
            '-',
            ['✕ 削除 // delete', () => { LY.setActive(i); $('pt-ldel').click(); }, n < 2]
        ];
    }
    function moveTo(from, to) {
        if (from === to) return;
        const S = os.paintHist, LY = os.paintLayers;
        S.push(S.struct('↕ 並べ替え // REORDER', () => { let a = st.layers, l = a.splice(from, 1)[0]; a.splice(to, 0, l); if (os.paintUI && os.paintUI.fixG) os.paintUI.fixG(l); LY.setActive(to); }));
        if (os.paintUI) os.paintUI.side();
        os.requestPaintRender();
    }
    os.paintLayerPlus = function (box) {
        if (box._plus) return; box._plus = true;
        let dg = null, dragged = false, lp = 0;
        box.addEventListener('pointerdown', e => {
            let fr = e.target.closest('.pt-lay[data-fold]');
            if (fr && e.pointerType !== 'mouse' && !e.target.closest('button,input')) { let x = e.clientX, y = e.clientY; clearTimeout(lp); lp = setTimeout(() => { let g = os.paintUI.folder(fr.dataset.fold); if (g) { dragged = true; st.fsel = g; os.paintUI.side(); menu(x, y, os.paintUI.folderOps(g)); } }, 480); return; }
            let row = e.target.closest('.pt-lay[data-li]');
            if (!row || e.button !== 0 || e.target.closest('button,input')) return;
            dg = { i: +row.dataset.li, y0: e.clientY, row, on: false };
            clearTimeout(lp);
            if (e.pointerType !== 'mouse') { let x = e.clientX, y = e.clientY, i = +row.dataset.li; lp = setTimeout(() => { if (!dg || dg.on) return; dg = null; dragged = true; os.paintLayers.setActive(i); if (os.paintUI) os.paintUI.side(); os.requestPaintRender(); menu(x, y, layerOps(i)); }, 480); }
        });
        addEventListener('pointermove', e => {
            if (!dg) return;
            if (!dg.on && Math.abs(e.clientY - dg.y0) < 6) return;
            clearTimeout(lp);
            if (!dg.on) { dg.on = true; dg.row.classList.add('pt-dragging'); box.classList.add('pt-sorting'); }
            dg.row.style.transform = 'translateY(' + (e.clientY - dg.y0) + 'px)';
            let rows = [...box.querySelectorAll('.pt-lay[data-li]')];
            rows.forEach(r => r.classList.remove('pt-dropabove', 'pt-dropbelow'));
            let over = rows.find(r => { if (r === dg.row) return false; let b = r.getBoundingClientRect(); return e.clientY >= b.top && e.clientY <= b.bottom; });
            dg.to = null;
            if (over) { let b = over.getBoundingClientRect(), above = e.clientY < b.top + b.height / 2; over.classList.add(above ? 'pt-dropabove' : 'pt-dropbelow'); let oi = +over.dataset.li; dg.to = above ? oi : oi; dg.above = above; dg.oi = oi; }
        });
        addEventListener('pointerup', () => {
            clearTimeout(lp);
            if (!dg) return;
            let d = dg; dg = null;
            if (!d.on) return;
            dragged = true;
            d.row.style.transform = '';
            box.classList.remove('pt-sorting');
            if (d.oi != null) {
                let to = d.i < d.oi ? (d.above ? d.oi : d.oi - 1) : (d.above ? d.oi + 1 : d.oi);
                to = Math.max(0, Math.min(st.layers.length - 1, to));
                moveTo(d.i, to);
            } else if (os.paintUI) os.paintUI.side();
        });
        box.addEventListener('click', e => { if (dragged) { dragged = false; e.stopImmediatePropagation(); e.preventDefault(); } }, true);
        box.addEventListener('contextmenu', e => {
            let fr = e.target.closest('.pt-lay[data-fold]');
            if (fr && os.paintUI && os.paintUI.folderOps) { e.preventDefault(); e.stopPropagation(); let g = os.paintUI.folder(fr.dataset.fold); if (g) { st.fsel = g; os.paintUI.side(); menu(e.clientX, e.clientY, os.paintUI.folderOps(g)); } return; }
            let row = e.target.closest('.pt-lay[data-li]');
            e.preventDefault(); e.stopPropagation();
            if (!row) return;
            let i = +row.dataset.li;
            os.paintLayers.setActive(i); if (os.paintUI) os.paintUI.side(); os.requestPaintRender();
            menu(e.clientX, e.clientY, layerOps(i));
        });
    };

    let css = document.createElement('style');
    css.textContent = `
        #pt-xbar { position: absolute; left: 50%; top: 8px; transform: translateX(-50%); z-index: 15; display: flex; flex-wrap: wrap; gap: 4px; align-items: center; justify-content: center; max-width: calc(100% - 16px); padding: 6px 8px; border-radius: 12px; background: rgba(10, 2, 18, 0.94); border: 1px solid #ff2d7a; box-shadow: 0 8px 26px rgba(0, 0, 0, 0.6), 0 0 16px rgba(255, 45, 122, 0.35); font: 11px monospace; color: #ffd6e6; }
        #pt-xbar span { margin-right: 4px; color: #ff2d7a; letter-spacing: 1px; }
        #pt-xbar button { font: 11px monospace; padding: 4px 8px; border-radius: 7px; border: 1px solid rgba(255, 255, 255, 0.25); background: rgba(255, 255, 255, 0.05); color: inherit; cursor: inherit; }
        #pt-xbar button:hover { background: #ff2d7a; color: #000; }
        #pt-xbar button.ok { background: linear-gradient(180deg, #ff5a98, #c0185a); color: #fff; border-color: #ff2d7a; }
        #pt-lmenu { position: fixed; z-index: 99999; min-width: 230px; padding: 3px; color-scheme: light; background: color-mix(in srgb, var(--neon-primary, #ff2d7a) 7%, #d9d6df); font-family: 'DotGothic16', monospace; display: flex; flex-direction: column; gap: 0;
            box-shadow: inset 1px 1px 0 #fff, inset -1px -1px 0 #2b2833, inset -2px -2px 0 #8d8998, 3px 4px 0 rgba(0, 0, 0, 0.45); }
        #pt-lmenu button { text-align: left; font: 12px 'DotGothic16', monospace; padding: 4px 18px 4px 10px; border: 0; border-radius: 0; background: none; color: #1b1822; cursor: inherit; }
        #pt-lmenu button:hover:not(:disabled) { background: color-mix(in srgb, var(--neon-primary, #ff2d7a) 62%, #1b1430); color: #fff; }
        #pt-lmenu button:disabled { opacity: 0.35; }
        #pt-lmenu hr { border: 0; height: 2px; background: linear-gradient(#8d8998 50%, #fff 50%); margin: 3px 2px; }
        .pt-lay { touch-action: none; user-select: none; }
        .pt-lay.pt-dragging { position: relative; z-index: 3; opacity: 0.85; box-shadow: 0 6px 18px rgba(0, 0, 0, 0.6); border-color: var(--neon-primary) !important; transition: none; }
        .pt-lay.picked { box-shadow: inset 3px 0 0 var(--neon-secondary, #00f0ff); }
        .pt-lay.pt-dropabove { box-shadow: inset 0 3px 0 var(--neon-secondary, #00f0ff); }
        .pt-lay.pt-dropbelow { box-shadow: inset 0 -3px 0 var(--neon-secondary, #00f0ff); }
        .pt-bgrow { margin-top: 4px; border-top: 1px dashed rgba(255, 255, 255, 0.15) !important; padding-top: 6px !important; }
        .pt-bgrow .pt-lname { flex: 1; } .pt-bghex { display: block; font-size: 9px; opacity: 0.6; letter-spacing: 1px; }
        .pt-bgsw { width: 26px !important; height: 18px !important; border-radius: 5px !important; border: 1px solid var(--neon-secondary) !important; cursor: pointer; padding: 0; margin-left: auto; box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.5) inset; }
        .pt-bgsw:hover { transform: scale(1.12); }
    `;
    document.head.appendChild(css);
})();
