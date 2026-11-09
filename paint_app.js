// this one took me way longer than it should've, if I did something dumb PLEASE tell me, idk why this had to exist don't question me

window.os = window.os || {};

os.paintState = {
    tool: 'pen',
    color1: '#ff0099',
    color2: '#00f0ff',
    bgColor: '#ffffff', // Gotta remember to actually use this when clearing the canvas!
    size: 6,
    opacity: 1.0,
    isDrawing: false,
    isPanning: false,
    showGrid: false,
    zoom: 1.0,
    panX: 0,
    panY: 0,
    lastX: 0,
    lastY: 0,
    lastMidX: 0,
    lastMidY: 0,
    lastPressure: 0.5,
    panStartX: 0,
    panStartY: 0,
    artCanvas: null,
    artCtx: null,
    renderPending: false,
    glitchCanvas: null,
    glitchCtx: null,
    W: 1920, H: 1080, layers: [], active: 0, paper: true, fit: true,
    undo: [], redo: [], sel: null, drag: null, hover: null,
    usePressure: true, smooth: 0.3, crt: false, shapeFill: false, gradKind: 'linear', tol: 32,
    mirror: 0, stamp: null, carry: 0, chainN: 0, smBuf: null, pens: [], spaceDown: false
};

os.setPaintTool = function(toolName, btnElement) {
    os.paintState.tool = toolName;
    document.querySelectorAll('#win-paint\\.exe .pt-tool').forEach(b => b.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    else { let b = document.querySelector('#win-paint\\.exe .pt-tool[data-tool="' + toolName + '"]'); if (b) b.classList.add('active'); }
    if (os.paintUI) os.paintUI.opts();
    os.requestPaintRender();
};

// Quick setter for my colours so the UI stays in sync.
os.setPaintColor = function(c1, c2 = null) {
    os.paintState.color1 = c1;
    const c1El = document.getElementById('paint-c1');
    if (c1El) c1El.value = c1;
    if (os.paintUI) os.paintUI.tbox();
    
    if (c2) {
        os.paintState.color2 = c2;
        const c2El = document.getElementById('paint-c2');
        if (c2El) c2El.value = c2;
    }
};

// Because sometimes some colour is needed, probably won't work.
os.setPaintBgColor = function(bg) {
    os.paintState.bgColor = bg;
    const bgEl = document.getElementById('paint-bg');
    if (bgEl) bgEl.value = bg;
    os.requestPaintRender();
};

// Toggles the grid, looks like shit, cbf fixing lmaooooo if stranger see pls help.
os.togglePaintGrid = function(btnElement) {
    os.paintState.showGrid = !os.paintState.showGrid;
    if (btnElement) btnElement.classList.toggle('active', os.paintState.showGrid);
    const gridOverlay = document.getElementById('paint-grid-overlay');
    if (gridOverlay) {
        gridOverlay.style.display = os.paintState.showGrid ? 'block' : 'none';
    }
    os.requestPaintRender();
};

os.requestPaintRender = function(soft) {
    if (soft !== true) os.paintState.artDirty = true;
    if (!os.paintState.renderPending) {
        os.paintState.renderPending = true;
        requestAnimationFrame(() => {
            os.renderPaintCanvas();
            os.paintState.renderPending = false;
        });
    }
};

// keep the canvas in the middle
os.resetPaintView = function() {
    const state = os.paintState;
    const displayCanvas = document.getElementById('paint-canvas');
    if (!displayCanvas || !state.artCanvas) return;
    // paper = the whole window like old paint. grows with it, never bins ur art when it shrinks
    if (state.fit) {
        let w = Math.min(4096, displayCanvas.width), h = Math.min(4096, displayCanvas.height);
        state.layers.forEach(l => {
            if (l.c.width >= w && l.c.height >= h) return;
            let c = document.createElement('canvas'); c.width = Math.max(w, l.c.width); c.height = Math.max(h, l.c.height);
            let x = c.getContext('2d'); x.drawImage(l.c, 0, 0);
            l.c = c; l.x = x;
        });
        if (state.layers.length) os.paintLayers.setActive(state.active);
        state.W = w; state.H = h; state.zoom = 1; state.panX = 0; state.panY = 0;
        if (os.paintUI) os.paintUI.res();
        os.requestPaintRender();
        return;
    }

    const margin = 40;
    const scaleX = (displayCanvas.clientWidth - margin * 2) / state.artCanvas.width;
    const scaleY = (displayCanvas.clientHeight - margin * 2) / state.artCanvas.height;
    state.zoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.1), 1.0);
    
    state.panX = (displayCanvas.clientWidth - state.artCanvas.width * state.zoom) / 2;
    state.panY = (displayCanvas.clientHeight - state.artCanvas.height * state.zoom) / 2;
    os.requestPaintRender();
};

os.resizePaint = function() {
    const c = document.getElementById('paint-canvas');
    if (!c || !c.parentElement) return;
    // shrink first or it never gets smaller again. dont ask
    const ow = c.width, oh = c.height;
    c.width = 1; c.height = 1;
    const r = c.parentElement.getBoundingClientRect();
    if (r.width < 50 || r.height < 50) { c.width = ow; c.height = oh; os.requestPaintRender(); return; }
    c.width = Math.floor(r.width);
    c.height = Math.floor(r.height);
    if (c.width === ow && c.height === oh) { os.requestPaintRender(); return; }
    os.resetPaintView();
};

// Nuke the canvas to fucking pieces, but fill it with my chosen BG color this time.
os.clearPaintCanvas = function() {
    const state = os.paintState;
    if (!state.artCtx || !state.artCanvas) return;
    os.paintHist.begin(true);
    state.artCtx.save();
    state.artCtx.globalCompositeOperation = 'source-over';
    state.artCtx.clearRect(0, 0, state.artCanvas.width, state.artCanvas.height);
    state.artCtx.restore();
    os.paintHist.end('PURGE');
    os.requestPaintRender();
    // used to have a confirm() before this to stop misclicks nuking your art, but it was so annoying so I just removed it. DOUBLE PAIN WITH NO UNDO LMAOO
};

(function () {
    const st = os.paintState;
    const mk = (w, h) => { let c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    const $ = id => document.getElementById(id);
    const calm = () => document.documentElement.classList.contains('reduce-motion');
    function hexRgb(h) { let r = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(h || ''); if (r) return [+r[1], +r[2], +r[3]]; let m = /^#?([0-9a-f]{6})$/i.exec(h || ''); let n = m ? parseInt(m[1], 16) : 0xff0099; return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
    const rgba = (h, a) => 'rgba(' + hexRgb(h).join(',') + ',' + a + ')';
    const mix = (h, h2, t) => { let a = hexRgb(h), b = hexRgb(h2); return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')'; };
    os.paintColour = { hexRgb, rgba, mix };

    // blur by hand bc safari. ugh
    const blurW = { a: null, b: null };
    function boxes(sig) { let w = Math.floor(Math.sqrt(4 * sig * sig + 1)); if (w % 2 === 0) w--; let wu = w + 2, m = Math.round((12 * sig * sig - 3 * w * w - 12 * w - 9) / (-4 * w - 4)); return [0, 1, 2].map(i => ((i < m ? w : wu) - 1) / 2); }
    function boxH(a, b, w, h, r) {
        let k = 1 / (r + r + 1);
        for (let y = 0; y < h; y++) {
            let row = y * w * 4;
            for (let ch = 0; ch < 4; ch++) {
                let acc = 0;
                for (let i = 0; i <= r && i < w; i++) acc += a[row + i * 4 + ch];
                for (let x = 0; x < w; x++) {
                    b[row + x * 4 + ch] = acc * k;
                    let ad = x + r + 1, rm = x - r;
                    if (ad < w) acc += a[row + ad * 4 + ch];
                    if (rm >= 0) acc -= a[row + rm * 4 + ch];
                }
            }
        }
    }
    function boxV(a, b, w, h, r) {
        let k = 1 / (r + r + 1), st4 = w * 4;
        for (let x = 0; x < w; x++) {
            for (let ch = 0; ch < 4; ch++) {
                let col = x * 4 + ch, acc = 0;
                for (let i = 0; i <= r && i < h; i++) acc += a[col + i * st4];
                for (let y = 0; y < h; y++) {
                    b[col + y * st4] = acc * k;
                    let ad = y + r + 1, rm = y - r;
                    if (ad < h) acc += a[col + ad * st4];
                    if (rm >= 0) acc -= a[col + rm * st4];
                }
            }
        }
    }
    function blurPx(x, w, h, sig) {
        if (sig < 0.3 || w < 1 || h < 1) return;
        let img = x.getImageData(0, 0, w, h), d = img.data, n = w * h * 4;
        if (!blurW.a || blurW.a.length < n) { blurW.a = new Float32Array(n); blurW.b = new Float32Array(n); }
        let a = blurW.a, b = blurW.b;
        // premultiply or the edges go grey
        for (let i = 0; i < n; i += 4) { let al = d[i + 3] / 255; a[i] = d[i] * al; a[i + 1] = d[i + 1] * al; a[i + 2] = d[i + 2] * al; a[i + 3] = d[i + 3]; }
        boxes(sig).forEach(r => { if (r < 1) return; boxH(a, b, w, h, r); boxV(b, a, w, h, r); });
        for (let i = 0; i < n; i += 4) { let al = a[i + 3]; if (al < 0.5) { d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0; continue; } let q = 255 / al; d[i] = a[i] * q; d[i + 1] = a[i + 1] * q; d[i + 2] = a[i + 2] * q; d[i + 3] = al; }
        x.putImageData(img, 0, 0);
    }
    const bcA = mk(8, 8), bcB = mk(8, 8);
    function blurArea(src, sx, sy, sw, sh, sig, out) {
        let pad = Math.ceil(sig * 3), X = Math.floor(sx - pad), Y = Math.floor(sy - pad), W = Math.ceil(sw + pad * 2), H = Math.ceil(sh + pad * 2);
        let k = Math.min(1, 5 / Math.max(5, sig)), w = Math.max(1, Math.ceil(W * k)), h = Math.max(1, Math.ceil(H * k));
        let c = out || bcA;
        if (c.width < w || c.height < h) { c.width = Math.max(c.width, w); c.height = Math.max(c.height, h); }
        let x = c.getContext('2d', { willReadFrequently: true });
        x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.clearRect(0, 0, c.width, c.height);
        x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
        if (k < 0.5) {
            let t = bcB, tw = W, th = H, from = src, fx = X, fy = Y, fw = W, fh = H;
            while (tw * 0.5 > w) {
                let nw = Math.ceil(tw / 2), nh = Math.ceil(th / 2);
                if (t.width < nw || t.height < nh) { t.width = Math.max(t.width, nw); t.height = Math.max(t.height, nh); }
                let tx = t.getContext('2d'); tx.setTransform(1, 0, 0, 1, 0, 0); tx.globalCompositeOperation = 'copy'; tx.imageSmoothingEnabled = true; tx.imageSmoothingQuality = 'high';
                tx.drawImage(from, fx, fy, fw, fh, 0, 0, nw, nh); tx.globalCompositeOperation = 'source-over';
                from = t; fx = 0; fy = 0; fw = nw; fh = nh; tw = nw; th = nh;
                t = t === bcB ? (blurW.c || (blurW.c = mk(8, 8))) : bcB;
            }
            x.drawImage(from, fx, fy, fw, fh, 0, 0, w, h);
        } else x.drawImage(src, X, Y, W, H, 0, 0, w, h);
        blurPx(x, w, h, sig * k);
        return { c, w, h, X, Y, W, H };
    }
    function blurPut(ctx, r) { ctx.drawImage(r.c, 0, 0, r.w, r.h, r.X, r.Y, r.W, r.H); }
    function blurLayer(l, sig, sel) {
        let s = sel || { x: 0, y: 0, w: st.W, h: st.H };
        let r = blurArea(l.c, s.x, s.y, s.w, s.h, sig, blurW.big || (blurW.big = mk(8, 8)));
        return r;
    }
    os.paintBlur = { area: blurArea, put: blurPut, layer: blurLayer };

    let layerN = 0;
    function newLayer(name) {
        let c = mk(st.W, st.H);
        layerN++;
        return { id: layerN, name: name || ('レイヤー ' + layerN), c, x: c.getContext('2d'), vis: true, op: 1, blend: 'source-over', lock: false, alock: false, clip: false };
    }
    function L() { return st.layers[st.active]; }
    function setActive(i) {
        let to = st.layers[Math.max(0, Math.min(st.layers.length - 1, i))];
        st.active = Math.max(0, Math.min(st.layers.length - 1, i));
        st.artCanvas = L().c;
        st.artCtx = L().x;
    }
    function freshDoc(w, h) {
        st.W = w || 1920; st.H = h || 1080;
        layerN = 0;
        st.layers = [newLayer()];
        st.undo = []; st.redo = []; st.sel = null;
        setActive(0);
    }
    os.paintLayers = { newLayer, L, setActive, freshDoc };

    let grp = null, msk = null, below = null;
    // mid stroke only the layer you're on changes, so everything under it + everything over it gets flattened once
    // the paper goes in the under one too or multiply etc would have nothing to multiply with
    const plain = l => !l.pv && !(os.paintXform && os.paintXform.img(l));
    function belowCache(ls, ai) {
        if (ai < 1 || (ls[ai] && ls[ai].clip) || ls[ai].g) return null;
        for (let k = 0; k < ai; k++) if (!plain(ls[k])) return null;
        let key = ai + '|' + ls.length + '|' + st.W + 'x' + st.H + '|' + st.paper + st.bgColor;
        if (below && below.key === key) return below;
        let cv = below && below.c.width === st.W && below.c.height === st.H ? below.c : mk(st.W, st.H), x = cv.getContext('2d');
        x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, st.W, st.H);
        if (st.paper) { x.fillStyle = st.bgColor; x.fillRect(0, 0, st.W, st.H); }
        else if (os._ptChecker) { x.fillStyle = '#ffffff'; x.fillRect(0, 0, st.W, st.H); x.fillStyle = x.createPattern(os._ptChecker, 'repeat'); x.fillRect(0, 0, st.W, st.H); }
        compose(x, false, ls.slice(0, ai));
        return (below = { key, c: cv });
    }
    let above = null;
    function aboveCache(ls, j) {
        if (j >= ls.length) return null;
        for (let k = j; k < ls.length; k++) { let l = ls[k]; if (!plain(l) || l.g || (!l.clip && l.blend !== 'source-over')) return null; }
        let key = j + '|' + ls.length + '|' + st.W + 'x' + st.H;
        if (above && above.key === key) return above;
        let cv = above && above.c.width === st.W && above.c.height === st.H ? above.c : mk(st.W, st.H), x = cv.getContext('2d');
        x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, st.W, st.H);
        compose(x, false, ls.slice(j));
        return (above = { key, c: cv });
    }
    let fold = [];
    function compose(c, live, only, inFolder) {
        let ls = only || st.layers, i = 0, stop = ls.length, ac = null;
        if (live && !only && st.isDrawing) {
            let ai = ls.indexOf(L()), bc = ai > 0 ? belowCache(ls, ai) : null;
            if (bc) { c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.drawImage(bc.c, 0, 0); i = ai; }
            if (ai >= 0 && !ls[ai].g) { let j = ai + 1; while (j < ls.length && ls[j].clip) j++; ac = aboveCache(ls, j); if (ac) stop = j; }
        } else if (!only) { below = null; above = null; }
        const img = l => (live && l.pv) || (live && os.paintXform && os.paintXform.img(l)) || l.c;
        const put = (x, l) => x.drawImage(img(l), 0, 0);
        const extras = l => { if (!live) return; if (os.paintXform) os.paintXform.draw(c, l); if (l === L() && st.fxOn && os.paintFx()) { c.globalCompositeOperation = 'source-over'; c.drawImage(os.paintFx(), 0, 0); } };
        while (i < stop) {
            let g = !inFolder && ls[i].g;
            if (g) {
                let j = i; while (j < ls.length && ls[j].g === g) j++;
                if (g.vis) {
                    let depth = 0, cv = fold[depth] && fold[depth].width === st.W && fold[depth].height === st.H ? fold[depth] : (fold[depth] = mk(st.W, st.H)), gx = cv.getContext('2d');
                    gx.setTransform(1, 0, 0, 1, 0, 0); gx.globalAlpha = 1; gx.globalCompositeOperation = 'source-over'; gx.clearRect(0, 0, st.W, st.H);
                    compose(gx, live, ls.slice(i, j), true);
                    c.globalAlpha = g.op; c.globalCompositeOperation = g.blend; c.drawImage(cv, 0, 0);
                }
                i = j; continue;
            }
            let base = ls[i], j = i + 1;
            while (j < ls.length && ls[j].clip && ls[j].g === base.g) j++;
            let clips = ls.slice(i + 1, j).filter(l => l.vis);
            if (base.vis) {
                if (!clips.length) { c.globalAlpha = base.op; c.globalCompositeOperation = base.blend; put(c, base); extras(base); }
                else {
                    if (!grp || grp.width !== st.W || grp.height !== st.H) { grp = mk(st.W, st.H); msk = mk(st.W, st.H); }
                    let g = grp.getContext('2d'), m = msk.getContext('2d');
                    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, st.W, st.H); put(g, base);
                    clips.forEach(cl => {
                        m.globalAlpha = 1; m.globalCompositeOperation = 'source-over'; m.clearRect(0, 0, st.W, st.H); put(m, cl);
                        m.globalCompositeOperation = 'destination-in'; m.drawImage(img(base), 0, 0); m.globalCompositeOperation = 'source-over';
                        g.globalAlpha = cl.op; g.globalCompositeOperation = cl.blend; g.drawImage(msk, 0, 0);
                    });
                    c.globalAlpha = base.op; c.globalCompositeOperation = base.blend; c.drawImage(grp, 0, 0);
                    extras(base); clips.forEach(extras);
                }
            }
            i = j;
        }
        if (ac) { c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.drawImage(ac.c, 0, 0); }
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }
    os.paintCompose = compose;

    const MAXBYTES = 260e6;
    let scratch = null, dirty = null, pxLayer = null;
    const H = os.paintHist = {
        begin(full) {
            let l = L();
            if (!scratch || scratch.width !== st.W || scratch.height !== st.H) scratch = mk(st.W, st.H);
            let sx = scratch.getContext('2d');
            sx.clearRect(0, 0, st.W, st.H);
            sx.drawImage(l.c, 0, 0);
            pxLayer = l;
            dirty = full ? { x0: 0, y0: 0, x1: st.W, y1: st.H, full: true } : { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
        },
        grow(x, y, r) {
            if (!dirty || dirty.full) return;
            dirty.x0 = Math.min(dirty.x0, x - r); dirty.y0 = Math.min(dirty.y0, y - r);
            dirty.x1 = Math.max(dirty.x1, x + r); dirty.y1 = Math.max(dirty.y1, y + r);
        },
        end(label) {
            if (!dirty || !pxLayer) return;
            let x = Math.max(0, Math.floor(dirty.x0)), y = Math.max(0, Math.floor(dirty.y0));
            let w = Math.min(st.W, Math.ceil(dirty.x1)) - x, h = Math.min(st.H, Math.ceil(dirty.y1)) - y;
            dirty = null;
            if (w <= 0 || h <= 0) { pxLayer = null; return; }
            if (st.sel && st.sel.mask && !H.raw) keepOut(pxLayer, x, y, w, h);
            pxLayer.ver = (pxLayer.ver || 0) + 1;
            let b = mk(w, h), a = mk(w, h);
            b.getContext('2d').drawImage(scratch, x, y, w, h, 0, 0, w, h);
            a.getContext('2d').drawImage(pxLayer.c, x, y, w, h, 0, 0, w, h);
            H.push({ k: 'px', l: pxLayer, x, y, w, h, b, a, label });
            pxLayer = null;
        },
        open() { return !!dirty; },
        cancel() {
            if (!dirty || !pxLayer) return;
            let c = pxLayer.x; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'copy'; c.drawImage(scratch, 0, 0); c.restore();
            dirty = null; pxLayer = null;
        },
        push(e) {
            st.undo.push(e);
            st.redo.length = 0;
            let bytes = () => st.undo.reduce((s, e) => s + size(e), 0);
            while (st.undo.length > 60 || (st.undo.length > 1 && bytes() > MAXBYTES)) st.undo.shift();
            changed();
        },
        struct(label, mutate) {
            let b = { layers: st.layers.slice(), active: st.active, gs: st.layers.map(l => l.g || null) };
            mutate();
            return { k: 'st', b, a: { layers: st.layers.slice(), active: st.active, gs: st.layers.map(l => l.g || null) }, label };
        }
    };
    function keepOut(l, x, y, w, h) {
        let m = st.sel.mask, a = mk(w, h), b = mk(w, h), ax = a.getContext('2d'), bx = b.getContext('2d');
        ax.drawImage(l.c, x, y, w, h, 0, 0, w, h); ax.globalCompositeOperation = 'destination-in'; ax.drawImage(m, x, y, w, h, 0, 0, w, h);
        bx.drawImage(scratch, x, y, w, h, 0, 0, w, h); bx.globalCompositeOperation = 'destination-out'; bx.drawImage(m, x, y, w, h, 0, 0, w, h);
        let c = l.x; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.clearRect(x, y, w, h); c.drawImage(b, x, y); c.drawImage(a, x, y); c.restore();
    }
    function size(e) { if (e.k === 'px') return e.w * e.h * 8; if (e.k === 'multi') return e.items.reduce((s, x) => s + size(x), 0); return 64; }
    function apply(e, which) {
        if (e.k === 'px') {
            e.l.ver = (e.l.ver || 0) + 1;
            let c = e.l.x;
            c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
            c.clearRect(e.x, e.y, e.w, e.h);
            c.drawImage(which === 'a' ? e.a : e.b, e.x, e.y);
            c.restore();
        } else if (e.k === 'st') {
            let s = e[which];
            st.layers = s.layers.slice();
            if (s.gs) st.layers.forEach((l, i) => { l.g = s.gs[i] || null; });
            setActive(s.active);
        } else if (e.k === 'fn') e[which]();
        else if (e.k === 'multi') {
            let list = which === 'a' ? e.items : e.items.slice().reverse();
            list.forEach(x => apply(x, which));
        }
    }
    os.paintUndo = function () {
        let e = st.undo.pop(); if (!e) return;
        apply(e, 'b'); st.redo.push(e);
        changed(); os.requestPaintRender();
    };
    os.paintRedo = function () {
        let e = st.redo.pop(); if (!e) return;
        apply(e, 'a'); st.undo.push(e);
        changed(); os.requestPaintRender();
    };

    // no autosave on purpose. I dont want your drawings sitting in your browser forever
    let sideT = 0;
    function changed() { if (sideT) return; sideT = requestAnimationFrame(() => { sideT = 0; if (os.paintUI) os.paintUI.side(); }); }
    os.paintChanged = changed;
    try { if (window.indexedDB) indexedDB.deleteDatabase('vmp_paint'); } catch (e) {}
    os.paintReset = function () {
        st.layers = []; st.undo = []; st.redo = []; st.sel = null; st.drag = null;
        st.artCanvas = null; st.artCtx = null; st.panX = 0; st.panY = 0; st.isDrawing = false; st.fxOn = false; st.fit = true;
    };

    os.paintOwned = () => true;

    function walk(x0, y0, x1, y1, sp, fn, start) {
        if (start) { st.carry = 0; fn(x1, y1, 1, 0); return; }
        let dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy);
        if (!d) return;
        let ux = dx / d, uy = dy / d;
        st.lastUx = ux; st.lastUy = uy;
        let t = sp - st.carry;
        while (t <= d) { fn(x0 + dx * t / d, y0 + dy * t / d, ux, uy); t += sp; }
        st.carry = d - (t - sp);
    }
    function clipSel(c) { if (!st.sel) return; if (st.sel.path) { c.clip(st.sel.path, 'evenodd'); return; } c.beginPath(); c.rect(st.sel.x, st.sel.y, st.sel.w, st.sel.h); c.clip(); }
    let maskCache = {};
    function softMask(r) {
        r = Math.max(2, Math.round(r));
        if (maskCache[r]) return maskCache[r];
        let c = mk(r * 2, r * 2), x = c.getContext('2d'), g = x.createRadialGradient(r, r, 0, r, r, r);
        g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.55, 'rgba(255,255,255,0.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2);
        if (Object.keys(maskCache).length > 40) maskCache = {};
        return (maskCache[r] = c);
    }
    let tmpA = mk(8, 8), tmpB = mk(8, 8), tmpC = mk(8, 8), tmpN = mk(8, 8);
    function tmp(c, w, h) { if (c.width < w) c.width = w; if (c.height < h) c.height = h; let x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, c.width, c.height); return x; }
    let toneCache = {};
    function tonePattern(ctx, col, step, cell) {
        let k = col + step + '|' + cell;
        if (!toneCache[k]) {
            let c = mk(cell, cell), x = c.getContext('2d'), h = cell / 2;
            x.fillStyle = col; x.beginPath(); x.arc(h, h, Math.max(0.8, cell * (0.13 + step * 0.075)), 0, Math.PI * 2); x.fill();
            toneCache[k] = c;
        }
        let p = ctx.createPattern(toneCache[k], 'repeat');
        try { p.setTransform(new DOMMatrix().rotate(45)); } catch (e) {}
        return p;
    }
    function sortRegion(cx, cy, r, ux, uy) {
        let ctx = st.artCtx, vert = Math.abs(uy) >= Math.abs(ux);
        let lenA = r * 8, lenB = r * 2;
        let w = Math.round(vert ? lenB : lenA), h = Math.round(vert ? lenA : lenB);
        let x = Math.round(cx - w / 2), y = Math.round(cy - h / 2);
        let bx0 = st.sel ? st.sel.x : 0, by0 = st.sel ? st.sel.y : 0, bx1 = st.sel ? st.sel.x + st.sel.w : st.W, by1 = st.sel ? st.sel.y + st.sel.h : st.H;
        let x0 = Math.max(bx0, x), y0 = Math.max(by0, y), x1 = Math.min(bx1, x + w), y1 = Math.min(by1, y + h);
        w = x1 - x0; h = y1 - y0;
        if (w < 2 || h < 2) return;
        let img = ctx.getImageData(x0, y0, w, h), d = new Uint32Array(img.data.buffer);
        let lum = p => (p & 255) * 0.3 + (p >> 8 & 255) * 0.59 + (p >> 16 & 255) * 0.11;
        let down = vert ? uy > 0 : ux > 0;
        let lines = vert ? w : h, len = vert ? h : w;
        let at = (a, b) => vert ? b * w + a : a * w + b;
        for (let a = 0; a < lines; a++) {
            let b = 0;
            while (b < len) {
                while (b < len && ((d[at(a, b)] >>> 24) < 20 || lum(d[at(a, b)]) < 40)) b++;
                let s = b;
                while (b < len && (d[at(a, b)] >>> 24) >= 20 && lum(d[at(a, b)]) >= 40) b++;
                if (b - s > 2) {
                    let run = [];
                    for (let k = s; k < b; k++) run.push(d[at(a, k)]);
                    run.sort((p, q) => down ? lum(p) - lum(q) : lum(q) - lum(p));
                    for (let k = s; k < b; k++) d[at(a, k)] = run[k - s];
                }
            }
        }
        ctx.putImageData(img, x0, y0);
    }


    let fx = null;
    os.paintFx = () => fx;
    function fxSheet() { if (!fx || fx.width !== st.W || fx.height !== st.H) fx = mk(st.W, st.H); return fx; }
    function fxClear() { if (fx) fx.getContext('2d').clearRect(0, 0, fx.width, fx.height); st.fxOn = false; }
    function fxCommit() {
        if (!fx || !st.fxOn) return;
        let c = L().x; c.save(); c.globalCompositeOperation = 'source-over'; c.drawImage(fx, 0, 0); c.restore();
        fxClear();
    }
    let sht = { c: null, pre: null, id: -1 };
    const lum = h => { let m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return 0; let v = parseInt(m[1], 16); return ((v >> 16 & 255) * 0.299 + (v >> 8 & 255) * 0.587 + (v & 255) * 0.114) / 255; };
    function neonGlow(c, x, y, w, h) {
        let sc = sht.c, op = st.opacity, R = st._neon ? st._neon.R : 6, ex = R * 8, light = st.paper && lum(st.bgColor) > 0.6;
        let sx = Math.max(0, x - ex), sy = Math.max(0, y - ex), sw = Math.min(st.W, x + w + ex) - sx, sh = Math.min(st.H, y + h + ex) - sy;
        c.imageSmoothingEnabled = true;
        if (os.mobileish && os.mobileish()) {
            // safari's blur made it look like a smeared jpeg
            let o = os.paintBlur.area(sc, sx, sy, sw, sh, R * 2.6, nA);
            c.globalCompositeOperation = light ? 'source-over' : 'screen';
            let k = Math.min(1, op * (light ? 0.7 : 0.85)); c.globalAlpha = k; os.paintBlur.put(c, o); c.globalAlpha = k * 0.75; os.paintBlur.put(c, o);
            let i = os.paintBlur.area(sc, sx, sy, sw, sh, R * 0.8, nB);
            c.globalAlpha = op * 0.9; os.paintBlur.put(c, i);
        } else {
            let q = 4, gw = Math.ceil(sw / q) + 2, gh = Math.ceil(sh / q) + 2, gb = tmp(tmpB, gw, gh);
            gb.filter = 'blur(' + Math.max(1, R * 2.6 / q).toFixed(1) + 'px)'; gb.drawImage(sc, sx, sy, sw, sh, 0, 0, sw / q, sh / q); gb.drawImage(sc, sx, sy, sw, sh, 0, 0, sw / q, sh / q); gb.filter = 'none';
            c.globalCompositeOperation = light ? 'source-over' : 'screen';
            c.globalAlpha = Math.min(1, op * (light ? 0.7 : 0.85)); c.drawImage(tmpB, 0, 0, sw / q, sh / q, sx, sy, sw, sh);
            c.filter = 'blur(' + Math.round(R * 0.8) + 'px)'; c.globalAlpha = op * 0.9; c.drawImage(sc, sx, sy, sw, sh, sx, sy, sw, sh);
        }
        c.filter = 'none'; c.globalCompositeOperation = 'source-over'; c.globalAlpha = op; c.drawImage(sc, x, y, w, h, x, y, w, h);
    }
    const nA = mk(8, 8), nB = mk(8, 8);
    os._ptNeonDone = function () {
        flushSheet();
        let n = st._neon; st._neon = null;
        if (!n || n.x1 < n.x0 || sht.id !== st.strokeId) return;
        let ex = n.R * 8;
        sheetPaintNow(n.x0 - ex, n.y0 - ex, n.x1 + ex, n.y1 + ex, (c, x, y, w, h) => { st._neon = n; neonGlow(c, x, y, w, h); st._neon = null; });
        return [Math.max(0, n.x0 - ex), Math.max(0, n.y0 - ex), Math.min(st.W, n.x1 + ex), Math.min(st.H, n.y1 + ex)];
    };
    function sheetFor() {
        if (sht.id === st.strokeId && sht.layer === st.artCanvas) return sht;
        if (!sht.c || sht.c.width !== st.W || sht.c.height !== st.H) { sht.c = mk(st.W, st.H); sht.pre = mk(st.W, st.H); sht.pre.getContext('2d', { willReadFrequently: true }); }
        let a = sht.c.getContext('2d');
        a.setTransform(1, 0, 0, 1, 0, 0); a.globalAlpha = 1; a.globalCompositeOperation = 'source-over'; a.clearRect(0, 0, st.W, st.H);
        let b = sht.pre.getContext('2d');
        b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, st.W, st.H);
        b.drawImage(st.artCanvas, 0, 0);
        sht.id = st.strokeId; sht.layer = st.artCanvas; sht.list = [];
        return sht;
    }
    // pencil fires way faster than the screen. pile it up, draw once a frame
    let due = null;
    function flushSheet() {
        if (!due) return;
        let d = due; due = null;
        if (d.fx) sheetPaintNow(d.x0, d.y0, d.x1, d.y1, d.fx); else sheetShowNow(d.x0, d.y0, d.x1, d.y1, d.op, d.mode);
    }
    function later(x0, y0, x1, y1, o) {
        if (due && (due.fx !== o.fx || due.op !== o.op || due.mode !== o.mode)) flushSheet();
        if (!due) due = Object.assign({ x0, y0, x1, y1 }, o);
        else { due.x0 = Math.min(due.x0, x0); due.y0 = Math.min(due.y0, y0); due.x1 = Math.max(due.x1, x1); due.y1 = Math.max(due.y1, y1); }
    }
    function sheetShow(x0, y0, x1, y1, op, mode) { if (st._noDefer) { flushSheet(); sheetShowNow(x0, y0, x1, y1, op, mode); } else later(x0, y0, x1, y1, { op, mode: mode || 'source-over', fx: null }); }
    function sheetPaint(x0, y0, x1, y1, fx) { if (st._noDefer) { flushSheet(); sheetPaintNow(x0, y0, x1, y1, fx); } else later(x0, y0, x1, y1, { fx, op: null, mode: null }); }
    function sheetShowNow(x0, y0, x1, y1, op, mode) {
        let x = Math.max(0, Math.floor(x0)), y = Math.max(0, Math.floor(y0));
        let w = Math.min(st.W, Math.ceil(x1)) - x, h = Math.min(st.H, Math.ceil(y1)) - y;
        if (w <= 0 || h <= 0) return;
        let c = st.artCtx;
        c.save(); c.setTransform(1, 0, 0, 1, 0, 0); clipSel(c);
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        c.clearRect(x, y, w, h);
        c.drawImage(sht.pre, x, y, w, h, x, y, w, h);
        c.globalAlpha = op; c.globalCompositeOperation = mode || 'source-over';
        c.drawImage(sht.c, x, y, w, h, x, y, w, h);
        c.restore();
    }
    function sheetPaintNow(x0, y0, x1, y1, fx) {
        let x = Math.max(0, Math.floor(x0)), y = Math.max(0, Math.floor(y0));
        let w = Math.min(st.W, Math.ceil(x1)) - x, h = Math.min(st.H, Math.ceil(y1)) - y;
        if (w <= 0 || h <= 0) return;
        let c = st.artCtx;
        c.save(); c.setTransform(1, 0, 0, 1, 0, 0); clipSel(c); c.beginPath(); c.rect(x, y, w, h); c.clip();
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        c.clearRect(x, y, w, h); c.drawImage(sht.pre, x, y, w, h, x, y, w, h);
        fx(c, x, y, w, h);
        c.restore();
    }
    function penSheet(o) {
        sheetFor();
        if (!st.mirrorNow) return sht.c;
        if (!o.cv || o.cv.width !== st.W || o.cv.height !== st.H) { o.cv = mk(st.W, st.H); sht.list.push(o.cv); }
        return o.cv;
    }
    function penMerge(b) {
        if (!st.mirrorNow) return;
        let t = sht.c.getContext('2d'), x = b[0], y = b[1], w = b[2] - b[0], h = b[3] - b[1];
        t.save(); t.setTransform(1, 0, 0, 1, 0, 0); t.globalAlpha = 1; t.globalCompositeOperation = 'source-over'; t.clearRect(x, y, w, h);
        sht.list.forEach(cv => t.drawImage(cv, x, y, w, h, x, y, w, h)); t.restore();
    }
    const LIT = [-0.58, -0.81];
    function ribbonMove(isStart, pts, passes, pad) {
        if (isStart || !st.rib || st.rib.id !== st.strokeId) st.rib = { id: st.strokeId, p: [], cells: new Map() };
        let R = st.rib, k0 = R.p.length;
        pts.forEach(q => R.p.push(q));
        // which bits of the ribbon are where. long strokes were checking every single bit every event = the 3d lag
        const CS = 64, cellKey = (cx, cy) => cx + ',' + cy;
        for (let i = Math.max(1, k0); i < R.p.length; i++) {
            let a = R.p[i - 1], b = R.p[i], m = Math.max(a[2], b[2]);
            for (let cx = Math.floor((Math.min(a[0], b[0]) - m) / CS); cx <= Math.floor((Math.max(a[0], b[0]) + m) / CS); cx++)
                for (let cy = Math.floor((Math.min(a[1], b[1]) - m) / CS); cy <= Math.floor((Math.max(a[1], b[1]) + m) / CS); cy++) { let k = cellKey(cx, cy), l = R.cells.get(k); if (!l) R.cells.set(k, l = []); l.push(i); }
        }
        if (R.p.length < 2) return null;
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (let i = Math.max(0, k0 - 1); i < R.p.length; i++) { let q = R.p[i]; x0 = Math.min(x0, q[0] - q[2]); y0 = Math.min(y0, q[1] - q[2]); x1 = Math.max(x1, q[0] + q[2]); y1 = Math.max(y1, q[1] + q[2]); }
        x0 = Math.floor(x0 - pad); y0 = Math.floor(y0 - pad); x1 = Math.ceil(x1 + pad); y1 = Math.ceil(y1 + pad);
        let t = penSheet(R).getContext('2d');
        t.save(); t.setTransform(1, 0, 0, 1, 0, 0); t.beginPath(); t.rect(x0, y0, x1 - x0, y1 - y0); t.clip(); t.clearRect(x0, y0, x1 - x0, y1 - y0);
        t.lineCap = 'round'; t.lineJoin = 'round'; t.globalAlpha = 1; t.globalCompositeOperation = 'source-over';
        let seen = new Set();
        for (let cx = Math.floor(x0 / CS); cx <= Math.floor(x1 / CS); cx++) for (let cy = Math.floor(y0 / CS); cy <= Math.floor(y1 / CS); cy++) { let l = R.cells.get(cellKey(cx, cy)); if (l) l.forEach(i => seen.add(i)); }
        let near = [...seen].sort((a, b) => a - b).filter(i => { let a = R.p[i - 1], b = R.p[i], m = Math.max(a[2], b[2]); return Math.max(a[0], b[0]) + m >= x0 && Math.min(a[0], b[0]) - m <= x1 && Math.max(a[1], b[1]) + m >= y0 && Math.min(a[1], b[1]) - m <= y1; });
        passes.forEach(ps => {
            t.strokeStyle = ps.col;
            near.forEach(i => {
                let a = R.p[i - 1], b = R.p[i], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
                let sd = nx * LIT[0] + ny * LIT[1], w = (a[2] + b[2]) / 2, o = (ps.off || 0) * w * sd * 2;
                t.lineWidth = Math.max(0.4, w * 2 * ps.w);
                t.beginPath(); t.moveTo(a[0] + nx * o, a[1] + ny * o); t.lineTo(b[0] + nx * o, b[1] + ny * o); t.stroke();
            });
        });
        t.restore();
        penMerge([x0, y0, x1, y1]);
        return [x0, y0, x1, y1];
    }
    function curvePts(ax, ay, bx, by, cx, cy, w0, w1) {
        let n = Math.max(2, Math.min(40, Math.ceil(Math.hypot(cx - ax, cy - ay) / Math.max(1.2, Math.min(w0, w1) * 0.3)))), out = [];
        for (let i = 1; i <= n; i++) { let q = i / n, m = 1 - q; out.push([m * m * ax + 2 * m * q * bx + q * q * cx, m * m * ay + 2 * m * q * by + q * q * cy, w0 + (w1 - w0) * q]); }
        return out;
    }
    os.paintFxBits = { sheet: fxSheet, clear: fxClear, commit: fxCommit, clipSel, softMask, walk, tmp, sheetFor, sheetShow, sheetPaint, flush: flushSheet, ribbonMove, curvePts };

    // The actual brush engine. Needs to be extremely fast, its so shit arhgageejh.
    // quadratic curve between midpoints instead of just lineTo'ing every point,
    // makes it way less jaggy. probably. idk I give up fuck it.
    os.paintStroke = function (p2, isStart = false) {
        const state = st;
        const ctx = state.artCtx;
        ctx.save();
        clipSel(ctx);
        ctx.globalAlpha = state.opacity;

        const curPressure = state.usePressure ? p2.pressure : 0.5;
        const curSize = state.size * (0.35 + curPressure * 1.3);

        if (isStart) {
            state.lastX = p2.x - 0.1;
            state.lastY = p2.y - 0.1;
            state.lastMidX = p2.x - 0.1;
            state.lastMidY = p2.y - 0.1;
        }
        
        const midX = (state.lastX + p2.x) / 2;
        const midY = (state.lastY + p2.y) / 2;
        const curve = () => { ctx.beginPath(); ctx.moveTo(state.lastMidX, state.lastMidY); ctx.quadraticCurveTo(state.lastX, state.lastY, midX, midY); };

        if (state.tool === 'pen' || state.tool === 'eraser') {
            // the eraser used to just paint the bg colour over stuff. it actually erases now
            let er = state.tool === 'eraser', k = er ? 2 : 1;
            let w0 = k * state.size * (0.35 + (state.lastPressure == null ? curPressure : state.lastPressure) * 1.3), w1 = k * curSize;
            let faded = state.opacity < 0.995;
            let t = faded ? os.paintFxBits.sheetFor().c.getContext('2d') : ctx;
            t.save();
            if (faded) { t.setTransform(1, 0, 0, 1, 0, 0); clipSel(t); t.globalAlpha = 1; t.globalCompositeOperation = 'source-over'; }
            else t.globalCompositeOperation = er ? 'destination-out' : 'source-over';
            t.strokeStyle = state.color1;
            t.lineCap = 'round'; t.lineJoin = 'round';
            let ax = state.lastMidX, ay = state.lastMidY, bx = state.lastX, by = state.lastY;
            let n = Math.max(1, Math.min(24, Math.ceil(Math.hypot(midX - ax, midY - ay) / Math.max(1.5, Math.min(w0, w1) * 0.35))));
            let px = ax, py = ay;
            for (let i = 1; i <= n; i++) {
                let q = i / n, mq = 1 - q;
                let x = mq * mq * ax + 2 * mq * q * bx + q * q * midX, y = mq * mq * ay + 2 * mq * q * by + q * q * midY;
                t.lineWidth = Math.max(0.5, w0 + (w1 - w0) * q);
                t.beginPath(); t.moveTo(px, py); t.lineTo(x, y); t.stroke();
                px = x; py = y;
            }
            t.restore();
            if (faded) {
                let pad = Math.max(w0, w1) + 3;
                os.paintFxBits.sheetShow(Math.min(ax, bx, midX) - pad, Math.min(ay, by, midY) - pad, Math.max(ax, bx, midX) + pad, Math.max(ay, by, midY) + pad, state.opacity, er ? 'destination-out' : 'source-over');
            }
        }

        else if (state.tool === 'neon') {
            let w0 = state.size * (0.35 + (state.lastPressure == null ? curPressure : state.lastPressure) * 1.3) * 0.42, w1 = curSize * 0.42, R = Math.max(3, curSize * 0.9);
            if (isStart) { st._neon = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9, R: R }; ribbonMove(true, [[p2.x, p2.y, w1]], [], 0); }
            else {
                let c1 = state.color1, light = st.paper && lum(st.bgColor) > 0.6;
                let box = ribbonMove(false, curvePts(state.lastMidX, state.lastMidY, state.lastX, state.lastY, midX, midY, w0, w1), light ? [
                    { col: mix(c1, '#000000', 0.25), w: 1 },
                    { col: c1, w: 0.75 },
                    { col: mix(c1, '#ffffff', 0.45), w: 0.32 }
                ] : [
                    { col: mix(c1, '#000000', 0.15), w: 1 },
                    { col: c1, w: 0.8 },
                    { col: mix(c1, '#ffffff', 0.6), w: 0.42 },
                    { col: '#ffffff', w: 0.2 }
                ], R * 8);
                let n = st._neon || (st._neon = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9, R: R });
                n.R = Math.max(n.R, R);
                if (box) { n.x0 = Math.min(n.x0, box[0]); n.y0 = Math.min(n.y0, box[1]); n.x1 = Math.max(n.x1, box[2]); n.y1 = Math.max(n.y1, box[3]); sheetPaint(box[0], box[1], box[2], box[3], neonGlow); }
            }
        }
        else if (state.tool === 'anaglyph') {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalCompositeOperation = 'screen';
            
            const offset = curSize * 0.6;

            ctx.strokeStyle = '#ff003c';
            ctx.lineWidth = curSize;
            ctx.beginPath();
            ctx.moveTo(state.lastMidX - offset, state.lastMidY - offset);
            ctx.quadraticCurveTo(state.lastX - offset, state.lastY - offset, midX - offset, midY - offset);
            ctx.stroke();

            ctx.strokeStyle = '#00f0ff';
            ctx.beginPath();
            ctx.moveTo(state.lastMidX + offset, state.lastMidY + offset);
            ctx.quadraticCurveTo(state.lastX + offset, state.lastY + offset, midX + offset, midY + offset);
            ctx.stroke();
        }
        else if (state.tool === 'brush3d') {
            let w0 = state.size * (0.35 + (state.lastPressure == null ? curPressure : state.lastPressure) * 1.3) * 1.15, w1 = curSize * 1.15;
            if (isStart) { ribbonMove(true, [[p2.x, p2.y, w1]], [], 0); }
            else {
                let c1 = state.color1, c2 = state.color2;
                let box = ribbonMove(false, curvePts(state.lastMidX, state.lastMidY, state.lastX, state.lastY, midX, midY, w0, w1), [
                    { col: mix(c1, '#000000', 0.5), w: 1 },
                    { col: mix(c1, '#000000', 0.22), w: 0.94, off: -0.02 },
                    { col: c1, w: 0.84, off: -0.04 },
                    { col: mix(c1, c2, 0.3), w: 0.7, off: 0.06 },
                    { col: mix(c1, c2, 0.62), w: 0.56, off: 0.12 },
                    { col: c2, w: 0.42, off: 0.18 },
                    { col: mix(c2, '#ffffff', 0.3), w: 0.3, off: 0.22 },
                    { col: mix(c2, '#ffffff', 0.62), w: 0.19, off: 0.26 },
                    { col: '#ffffff', w: 0.08, off: 0.3 },
                    { col: mix(c1, c2, 0.35), w: 0.1, off: -0.36 }
                ], 2);
                if (box) sheetShow(box[0], box[1], box[2], box[3], state.opacity, 'source-over');
            }
        }
        // I swear if I accidentally break this I will cry
        else if (state.tool === 'glitch') {
            ctx.globalCompositeOperation = 'source-over';
            const sliceW = Math.max(60, Math.floor(curSize * 9));
            const sliceH = Math.max(12, Math.floor(curSize * 2.5));
            const sx = Math.floor(p2.x - sliceW / 2);
            const sy = Math.floor(p2.y - sliceH / 2);

            if (sx > 0 && sy > 0 && sx + sliceW < state.artCanvas.width && sy + sliceH < state.artCanvas.height) {
                const shiftX = Math.floor((Math.random() - 0.5) * (curSize * 6.0));
                const shiftY = Math.floor((Math.random() - 0.5) * 4);

                if (!state.glitchCanvas) {
                    state.glitchCanvas = document.createElement('canvas');
                    state.glitchCtx = state.glitchCanvas.getContext('2d');
                }
                if (state.glitchCanvas.width !== sliceW) state.glitchCanvas.width = sliceW;
                if (state.glitchCanvas.height !== sliceH) state.glitchCanvas.height = sliceH;
                
                state.glitchCtx.clearRect(0, 0, sliceW, sliceH);
                state.glitchCtx.drawImage(state.artCanvas, sx, sy, sliceW, sliceH, 0, 0, sliceW, sliceH);
                ctx.drawImage(state.glitchCanvas, 0, 0, sliceW, sliceH, sx + shiftX, sy + shiftY, sliceW, sliceH);
                
                ctx.globalCompositeOperation = 'screen';
                ctx.fillStyle = state.color1;
                ctx.fillRect(sx + shiftX - 6, sy + shiftY, sliceW, 2);
                ctx.fillStyle = state.color2;
                ctx.fillRect(sx + shiftX + 6, sy + shiftY + sliceH - 2, sliceW, 2);

                if (Math.random() > 0.4) {
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.fillStyle = Math.random() > 0.5 ? '#ffe600' : '#00f0ff';
                    ctx.font = 'bold 10px monospace';
                    const glitchText = Math.random() > 0.5 ? '0xFF' : 'SYS_';
                    ctx.fillText(glitchText, sx + shiftX + (Math.random() * sliceW * 0.6), sy + shiftY + sliceH);
                }
            }
        }
        else if (state.tool === 'stamp') {
            if (isStart && state.stamp) {
                const px = Math.max(16, state.size * 5);
                ctx.globalCompositeOperation = 'source-over';
                ctx.font = 'bold ' + px + "px 'Noto Sans JP', sans-serif";
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = state.color1;
                ctx.shadowColor = state.color1;
                ctx.shadowBlur = 12;
                ctx.fillText(state.stamp, p2.x, p2.y);
            }
        }
        else if (state.tool === 'spray' || state.tool === 'pixel') {
            const dx = p2.x - state.lastX;
            const dy = p2.y - state.lastY;
            const dist = Math.hypot(dx, dy);
            const stepDist = Math.max(1, state.size * 0.15);
            const steps = Math.max(1, Math.ceil(dist / stepDist));

            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const curX = state.lastX + dx * t;
                const curY = state.lastY + dy * t;

                if (state.tool === 'spray') {
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.fillStyle = state.color1;
                    const density = Math.floor(curSize * 2.0);
                    const radius = curSize * 1.6;
                    
                    ctx.beginPath();
                    for (let j = 0; j < density; j++) {
                        const r = Math.random() * radius;
                        const theta = Math.random() * 2 * Math.PI;
                        ctx.rect(curX + r * Math.cos(theta), curY + r * Math.sin(theta), 1.5, 1.5);
                    }
                    ctx.fill();
                } 
                else if (state.tool === 'pixel') {
                    ctx.globalCompositeOperation = 'source-over';
                    const grid = Math.max(2, Math.floor(state.size));
                    ctx.fillStyle = state.color1;
                    ctx.fillRect(Math.floor(curX / grid) * grid, Math.floor(curY / grid) * grid, grid, grid);
                }
            }
        }
        else if (state.tool === 'air') {
            const r = Math.max(3, curSize * 1.8);
            walk(state.lastX, state.lastY, p2.x, p2.y, Math.max(1, r * 0.22), (x, y) => {
                let g = ctx.createRadialGradient(x, y, 0, x, y, r);
                g.addColorStop(0, rgba(state.color1, 1)); g.addColorStop(0.45, rgba(state.color1, 0.5)); g.addColorStop(1, rgba(state.color1, 0));
                ctx.globalAlpha = state.opacity * (0.05 + curPressure * 0.13);
                ctx.fillStyle = g;
                ctx.fillRect(x - r, y - r, r * 2, r * 2);
            }, isStart);
        }
        else if (state.tool === 'smudge' || state.tool === 'blur') {
            const r = Math.max(4, Math.min(90, Math.round(curSize * 1.3)));
            const m = softMask(r);
            walk(state.lastX, state.lastY, p2.x, p2.y, Math.max(1, r * (state.tool === 'blur' ? 0.4 : 0.18)), (x, y) => {
                let ax = Math.round(x - r), ay = Math.round(y - r);
                if (state.tool === 'smudge') {
                    if (!state.smBuf) { state.smBuf = mk(r * 2, r * 2); state.smBuf.getContext('2d').drawImage(state.artCanvas, ax, ay, r * 2, r * 2, 0, 0, r * 2, r * 2); return; }
                    let B = state.smBuf.width;
                    // grab whats there first, or it soaks its own paint back up + never runs out
                    let under = tmp(tmpC, B, B); under.drawImage(state.artCanvas, ax, ay, r * 2, r * 2, 0, 0, B, B);
                    let t = tmp(tmpA, r * 2, r * 2);
                    t.drawImage(state.smBuf, 0, 0, B, B, 0, 0, r * 2, r * 2);
                    t.globalCompositeOperation = 'destination-in'; t.drawImage(m, 0, 0);
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.globalAlpha = 0.25 + curPressure * 0.35;
                    ctx.drawImage(tmpA, 0, 0, r * 2, r * 2, ax, ay, r * 2, r * 2);
                    let k = Math.max(0.16, 0.42 - curPressure * 0.2), q = tmp(tmpB, B, B);
                    q.globalCompositeOperation = 'copy'; q.globalAlpha = 1 - k; q.drawImage(state.smBuf, 0, 0);
                    q.globalCompositeOperation = 'lighter'; q.globalAlpha = k; q.drawImage(tmpC, 0, 0, B, B, 0, 0, B, B);
                    let sb = state.smBuf.getContext('2d');
                    sb.globalCompositeOperation = 'copy'; sb.globalAlpha = 1; sb.drawImage(tmpB, 0, 0, B, B, 0, 0, B, B); sb.globalCompositeOperation = 'source-over';
                } else {
                    let q = Math.max(2, Math.round(r / 3));
                    let s = tmp(tmpB, q, q); s.imageSmoothingEnabled = true;
                    s.drawImage(state.artCanvas, ax, ay, r * 2, r * 2, 0, 0, q, q);
                    let t = tmp(tmpA, r * 2, r * 2); t.imageSmoothingEnabled = true;
                    t.drawImage(tmpB, 0, 0, q, q, 0, 0, r * 2, r * 2);
                    t.globalCompositeOperation = 'destination-in'; t.drawImage(m, 0, 0);
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.globalAlpha = 0.35 + curPressure * 0.3;
                    ctx.drawImage(tmpA, 0, 0, r * 2, r * 2, ax, ay, r * 2, r * 2);
                }
            }, isStart);
        }
        else if (state.tool === 'tone') {
            const r = Math.max(4, curSize * 1.4);
            let rgb = hexRgb(state.color1), lu = (rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114) / 255, bg = hexRgb(state.bgColor || '#ffffff');
            let light = (bg[0] * 0.299 + bg[1] * 0.587 + bg[2] * 0.114) / 255 > 0.55;
            let col = light && lu > 0.55 ? mix(state.color1, '#000000', (lu - 0.55) * 0.9) : state.color1;
            ctx.globalCompositeOperation = light ? 'multiply' : 'source-over';
            ctx.fillStyle = tonePattern(ctx, col, Math.min(3, Math.floor(curPressure * 4)), Math.round(Math.max(6, Math.min(16, 5 + curSize * 0.18))));
            walk(state.lastX, state.lastY, p2.x, p2.y, Math.max(1, r * 0.3), (x, y) => {
                ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
            }, isStart);
        }
        else if (state.tool === 'sort') {
            const r = Math.max(4, curSize);
            walk(state.lastX, state.lastY, p2.x, p2.y, Math.max(4, r * 0.6), (x, y, ux, uy) => sortRegion(x, y, r, isStart ? 0 : ux, isStart ? 1 : uy), isStart);
        }

        state.lastMidX = midX;
        state.lastMidY = midY;
        state.lastX = p2.x;
        state.lastY = p2.y;
        state.lastPressure = curPressure;

        ctx.restore();
        os.requestPaintRender();
    };

    // mirror mode. every pen needs to remember where IT was or they draw lines to each other
    const PEN = ['lastX', 'lastY', 'lastMidX', 'lastMidY', 'lastPressure', 'carry', 'chainN', 'smBuf', 'lastUx', 'lastUy', 'lifeCur', 'hairS', 'toothD', 'rib', 'pth'];
    function mirrorFns() {
        let n = st.mirror;
        if (!n || !os.paintOwned('mirror')) return null;
        let cx = st.W / 2, cy = st.H / 2, m = n / 2, out = [];
        for (let k = 0; k < m; k++) {
            let a = k * Math.PI * 2 / m, ca = Math.cos(a), sa = Math.sin(a);
            out.push(p => { let x = p.x - cx, y = p.y - cy; return { x: cx + x * ca - y * sa, y: cy + x * sa + y * ca, pressure: p.pressure }; });
            out.push(p => { let x = cx - p.x, y = p.y - cy; return { x: cx + x * ca - y * sa, y: cy + x * sa + y * ca, pressure: p.pressure }; });
        }
        return out;
    }
    os.paintStrokeAt = function (p, start) {
        let fns = mirrorFns();
        st.mirrorNow = !!fns;
        if (!fns) { if (start) { st.smBuf = null; st.chainN = 0; } os.paintStroke(p, start); return; }
        if (start) st.pens = fns.map(() => ({ chainN: 0, smBuf: null, carry: 0 }));
        fns.forEach((f, i) => {
            let pen = st.pens[i] || (st.pens[i] = {});
            PEN.forEach(k => { if (k in pen) st[k] = pen[k]; });
            os.paintStroke(f(p), start);
            PEN.forEach(k => { pen[k] = st[k]; });
        });
    };
    os.paintMirrorOn = () => !!mirrorFns();
})();

// The main display loop. Only runs on requestAnimationFrame.
os.renderPaintCanvas = function() {
    const displayCanvas = document.getElementById('paint-canvas');
    if (!displayCanvas || !os.paintState.artCanvas) return;
    if (os.paintFxBits) os.paintFxBits.flush();
    const ctx = displayCanvas.getContext('2d', { alpha: false });
    const state = os.paintState;
    const W = state.W, H = state.H;

    // Dark workspace backdrop (outside the artboard)
    // this was murdering safari
    let now = performance.now();
    if (!os._ptPc || now - os._ptPcT > 1000) { os._ptPc = (getComputedStyle(document.documentElement).getPropertyValue('--neon-primary') || '#ff0099').trim(); os._ptPcT = now; }
    let pc = os._ptPc;
    if (!os._ptDesk || os._ptDesk.k !== pc) {
        let d = document.createElement('canvas'); d.width = d.height = 8;
        let dx = d.getContext('2d'); dx.fillStyle = '#9d99a8'; dx.fillRect(0, 0, 8, 8);
        dx.globalAlpha = 0.3; dx.fillStyle = pc; dx.fillRect(0, 0, 1, 1); dx.fillRect(4, 4, 1, 1);
        os._ptDesk = { k: pc, p: ctx.createPattern(d, 'repeat') };
    }
    ctx.fillStyle = os._ptDesk.p;
    ctx.fillRect(0, 0, displayCanvas.width, displayCanvas.height);

    // faint grid so its not just a void
    if (state.showGrid) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 0, 153, 0.12)';
        ctx.lineWidth = 1;
        const gridSize = Math.max(15, 40 * state.zoom);
        const offsetX = state.panX % gridSize;
        const offsetY = state.panY % gridSize;

        ctx.beginPath();
        for (let x = offsetX; x < displayCanvas.width; x += gridSize) {
            ctx.moveTo(x, 0); ctx.lineTo(x, displayCanvas.height);
        }
        for (let y = offsetY; y < displayCanvas.height; y += gridSize) {
            ctx.moveTo(0, y); ctx.lineTo(displayCanvas.width, y);
        }
        ctx.stroke();
        ctx.restore();
    }

    // hard shadow like old paint
    let gw = Math.round(W * state.zoom), gh = Math.round(H * state.zoom), full = state.fit && state.zoom === 1 && !state.panX && !state.panY;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    if (!full) ctx.fillRect(Math.round(state.panX) + 5, Math.round(state.panY) + 5, gw, gh);

    ctx.save();
    ctx.translate(state.panX, state.panY);
    ctx.scale(state.zoom, state.zoom);
    if (state.flipView) { ctx.translate(W, 0); ctx.scale(-1, 1); }

    // Neon shadow behind the canvas
    ctx.fillStyle = state.paper ? state.bgColor : '#ffffff';
    ctx.fillRect(0, 0, W, H);
    if (!state.paper) {
        // checkerboard for see through, like photoshop
        if (!os._ptChecker) { let c = document.createElement('canvas'); c.width = c.height = 32; let x = c.getContext('2d'); x.fillStyle = '#d6d3dd'; x.fillRect(0, 0, 16, 16); x.fillRect(16, 16, 16, 16); os._ptChecker = c; }
        ctx.fillStyle = ctx.createPattern(os._ptChecker, 'repeat');
        ctx.fillRect(0, 0, W, H);
    }

    ctx.imageSmoothingEnabled = state.tool !== 'pixel' && state.zoom < 3;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    const t = performance.now() / 1000, still = document.documentElement.classList.contains('reduce-motion');
    if (state.isDrawing) os.paintCompose(ctx, true);
    else {
        // it was flattening all 24 layers every time the mouse moved
        let ac = os._ptArt;
        if (!ac || ac.width !== W || ac.height !== H) { ac = os._ptArt = document.createElement('canvas'); ac.width = W; ac.height = H; state.artDirty = true; }
        if (state.artDirty) {
            let ax = ac.getContext('2d');
            ax.setTransform(1, 0, 0, 1, 0, 0); ax.globalAlpha = 1; ax.globalCompositeOperation = 'source-over';
            if (state.paper) { ax.fillStyle = state.bgColor; ax.fillRect(0, 0, W, H); }
            else { ax.fillStyle = '#ffffff'; ax.fillRect(0, 0, W, H); ax.fillStyle = ax.createPattern(os._ptChecker, 'repeat'); ax.fillRect(0, 0, W, H); }
            os.paintCompose(ax, true);
            state.artDirty = false;
        }
        ctx.drawImage(ac, 0, 0);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    if (os.paintXform) os.paintXform.handles(ctx);

    const d = state.drag;
    if (d && d.moved) {
        ctx.save();
        if (d.tool === 'lasso') {
            ctx.lineWidth = 1 / state.zoom; ctx.setLineDash([5 / state.zoom, 4 / state.zoom]);
            ctx.beginPath(); d.pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]));
            ctx.strokeStyle = '#000'; ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineDashOffset = 4.5 / state.zoom; ctx.stroke();
        } else if (d.tool === 'select') {
            ctx.setLineDash([6 / state.zoom, 4 / state.zoom]);
            ctx.lineWidth = 1 / state.zoom; ctx.strokeStyle = '#fff';
            let r = os.paintTools.rectOf(d);
            ctx.strokeRect(r.x, r.y, r.w, r.h);
        } else if (d.tool === 'gradient') {
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 / state.zoom; ctx.setLineDash([5 / state.zoom, 4 / state.zoom]);
            ctx.beginPath(); ctx.moveTo(d.x0, d.y0); ctx.lineTo(d.x1, d.y1); ctx.stroke();
            ctx.setLineDash([]);
            [[d.x0, d.y0, state.color1], [d.x1, d.y1, state.color2]].forEach(p => { ctx.fillStyle = p[2]; ctx.beginPath(); ctx.arc(p[0], p[1], 7 / state.zoom, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
        } else os.paintTools.shape(ctx, d);
        ctx.restore();
    }
    if (state.sel && state.sel.path) {
        const s = state.sel, off = still ? 0 : (t * 18) % 10;
        ctx.save(); ctx.lineWidth = 1 / state.zoom; ctx.setLineDash([5 / state.zoom, 5 / state.zoom]);
        ctx.strokeStyle = '#000'; ctx.lineDashOffset = -off / state.zoom; ctx.stroke(s.path);
        ctx.strokeStyle = '#fff'; ctx.lineDashOffset = (5 - off) / state.zoom; ctx.stroke(s.path);
        ctx.restore();
    } else if (state.sel && state.sel.edge) {
        ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(state.sel.edge, state.sel.x, state.sel.y); ctx.restore();
    } else if (state.sel) {
        const s = state.sel, off = still ? 0 : (t * 18) % 10;
        ctx.save();
        ctx.lineWidth = 1 / state.zoom;
        ctx.setLineDash([5 / state.zoom, 5 / state.zoom]);
        ctx.strokeStyle = '#000'; ctx.lineDashOffset = -off / state.zoom; ctx.strokeRect(s.x, s.y, s.w, s.h);
        ctx.strokeStyle = '#fff'; ctx.lineDashOffset = (5 - off) / state.zoom; ctx.strokeRect(s.x, s.y, s.w, s.h);
        ctx.restore();
    }
    if (os.paintMirrorOn && os.paintMirrorOn() && state.mirrorGuide !== false) {
        ctx.save();
        ctx.strokeStyle = 'rgba(232, 196, 106, 0.35)'; ctx.lineWidth = 1 / state.zoom; ctx.setLineDash([8 / state.zoom, 8 / state.zoom]);
        let m = state.mirror / 2;
        for (let k = 0; k < m; k++) {
            let a = Math.PI / 2 + k * Math.PI / m, R = Math.hypot(W, H);
            ctx.beginPath(); ctx.moveTo(W / 2 - Math.cos(a) * R, H / 2 - Math.sin(a) * R); ctx.lineTo(W / 2 + Math.cos(a) * R, H / 2 + Math.sin(a) * R); ctx.stroke();
        }
        ctx.restore();
    }

    ctx.strokeStyle = state.color2;
    ctx.lineWidth = 1 / state.zoom;
    if (!full) ctx.strokeRect(0, 0, W, H);
    
    ctx.restore();

    const hv = state.hover;
    let brushy = !!(os.paintTools && os.paintTools.isBrush(state.tool)), want = state.isPanning ? 'grabbing' : brushy ? 'none' : 'crosshair';
    if (displayCanvas.style.cursor !== want) displayCanvas.style.setProperty('cursor', want, 'important');
    if (hv && brushy && !state.isPanning) {
        let r = Math.max(2, state.size * 0.5 * (state.tool === 'eraser' ? 2 : 1) * state.zoom * (['air', 'tone', 'smudge', 'blur'].includes(state.tool) ? 1.5 : state.tool === 'mybrush' ? 1.6 : 1));
        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.arc(hv.x, hv.y, r + 1, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(hv.x, hv.y, r, 0, Math.PI * 2); ctx.stroke();
        if (r > 5) { ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(Math.round(hv.x) - 1, Math.round(hv.y) - 1, 3, 3); ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(hv.x), Math.round(hv.y), 1, 1); }
        ctx.restore();
    }

    const zoomLabel = document.getElementById('paint-zoom-label');
    if (zoomLabel) zoomLabel.textContent = `MAG: ${Math.round(state.zoom * 100)}%`;
    if (state.sel && !state.sel.edge && !still && displayCanvas.isConnected) {
        clearTimeout(os._ptBeat);
        os._ptBeat = setTimeout(() => os.requestPaintRender(true), 66);
    }
};

(function () {
    const st = os.paintState;
    const H = () => os.paintHist;
    const BRUSH = ['mybrush', 'pen', 'neon', 'brush3d', 'anaglyph', 'glitch', 'spray', 'pixel', 'eraser', 'air', 'smudge', 'blur', 'stamp', 'tone', 'sort'];
    const DRAG = ['line', 'rect', 'ellipse', 'gradient', 'select', 'lasso'];
    function rectOf(d) {
        let x = Math.min(d.x0, d.x1), y = Math.min(d.y0, d.y1);
        return { x: Math.round(x), y: Math.round(y), w: Math.round(Math.abs(d.x1 - d.x0)), h: Math.round(Math.abs(d.y1 - d.y0)) };
    }
    function shape(ctx, d) {
        ctx.globalAlpha = st.opacity;
        ctx.lineWidth = Math.max(1, st.size);
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = st.color1; ctx.fillStyle = st.color2;
        ctx.beginPath();
        if (d.tool === 'line') { ctx.moveTo(d.x0, d.y0); ctx.lineTo(d.x1, d.y1); ctx.stroke(); return; }
        if (d.tool === 'rect') { let r = rectOf(d); ctx.rect(r.x, r.y, r.w, r.h); }
        else ctx.ellipse((d.x0 + d.x1) / 2, (d.y0 + d.y1) / 2, Math.abs(d.x1 - d.x0) / 2, Math.abs(d.y1 - d.y0) / 2, 0, 0, Math.PI * 2);
        if (st.shapeFill) ctx.fill();
        ctx.stroke();
    }
    function constrain(d, shift) {
        if (!shift) return;
        let dx = d.x1 - d.x0, dy = d.y1 - d.y0;
        if (d.tool === 'line') {
            let a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * Math.PI / 4, len = Math.hypot(dx, dy);
            d.x1 = d.x0 + Math.cos(a) * len; d.y1 = d.y0 + Math.sin(a) * len;
        } else { let m = Math.max(Math.abs(dx), Math.abs(dy)); d.x1 = d.x0 + Math.sign(dx || 1) * m; d.y1 = d.y0 + Math.sign(dy || 1) * m; }
    }
    function commitDrag(d) {
        let c = st.artCtx;
        if (d.tool === 'select') {
            let r = rectOf(d);
            if (d.mode && st.sel && d.moved && r.w > 2 && r.h > 2) { let m = mk(st.W, st.H), x = m.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(r.x, r.y, r.w, r.h); setSel(m, null, d.mode); }
            else st.sel = d.moved && r.w > 2 && r.h > 2 ? clampSel(r) : (d.mode ? st.sel : null);
            if (os.paintUI) os.paintUI.side();
            return;
        }
        if (d.tool === 'lasso') {
            if (!d.pts || d.pts.length < 3) { if (!d.mode) st.sel = null; if (os.paintUI) os.paintUI.side(); return; }
            let p = new Path2D(); d.pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); p.closePath();
            let m = mk(st.W, st.H), x = m.getContext('2d'); x.fillStyle = '#fff'; x.fill(p, 'evenodd');
            setSel(m, p, d.mode);
            if (os.paintUI) os.paintUI.side();
            return;
        }
        if (!d.moved) return;
        H().begin(d.tool === 'gradient');
        if (d.tool !== 'gradient') { let r = rectOf(d), pad = st.size + 4; H().grow(r.x - pad, r.y - pad, 0); H().grow(r.x + r.w + pad, r.y + r.h + pad, 0); }
        c.save(); os.paintFxBits.clipSel(c);
        if (d.tool === 'gradient') {
            let g = st.gradKind === 'radial' ? c.createRadialGradient(d.x0, d.y0, 0, d.x0, d.y0, Math.max(1, Math.hypot(d.x1 - d.x0, d.y1 - d.y0))) : c.createLinearGradient(d.x0, d.y0, d.x1, d.y1);
            g.addColorStop(0, st.color1); g.addColorStop(1, st.color2);
            c.globalAlpha = st.opacity; c.fillStyle = g;
            c.fillRect(0, 0, st.W, st.H);
        } else shape(c, d);
        c.restore();
        H().end({ line: '直線 // LINE', rect: '四角 // BOX', ellipse: '楕円 // ELLIPSE', gradient: 'グラデ // GRADIENT' }[d.tool]);
        os.requestPaintRender();
    }
    function clampSel(r) {
        let x = Math.max(0, r.x), y = Math.max(0, r.y);
        return { x, y, w: Math.min(st.W, r.x + r.w) - x, h: Math.min(st.H, r.y + r.h) - y };
    }
    // bucket fill. third attempt. the first one crashed chrome lmao
    const mk = (w, h) => { let c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    function setSel(m, path, mode) {
        if (mode && st.sel) {
            let base = st.sel.mask;
            if (!base) { base = mk(st.W, st.H); let bx = base.getContext('2d'); bx.fillStyle = '#fff'; bx.fillRect(st.sel.x, st.sel.y, st.sel.w, st.sel.h); }
            else { let c2 = mk(st.W, st.H); c2.getContext('2d').drawImage(base, 0, 0); base = c2; }
            let bx = base.getContext('2d'); bx.globalCompositeOperation = mode === 'sub' ? 'destination-out' : 'source-over'; bx.drawImage(m, 0, 0);
            m = base; path = null;
        } else if (mode === 'sub') { st.sel = null; return; }
        let d = m.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, st.W, st.H).data, W = st.W, Hh = st.H, x0 = W, y0 = Hh, x1 = -1, y1 = -1;
        for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 127) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 < 0) { st.sel = null; return; }
        let w = x1 - x0 + 1, h = y1 - y0 + 1, e = mk(w, h), ex = e.getContext('2d'), img = ex.createImageData(w, h), o = img.data;
        const at = (x, y) => x >= 0 && y >= 0 && x < W && y < Hh && d[(y * W + x) * 4 + 3] > 127;
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
            if (!at(x, y) || (at(x - 1, y) && at(x + 1, y) && at(x, y - 1) && at(x, y + 1))) continue;
            let i = ((y - y0) * w + (x - x0)) * 4, v = (x + y) % 8 < 4 ? 255 : 0; o[i] = o[i + 1] = o[i + 2] = v; o[i + 3] = 255;
        }
        ex.putImageData(img, 0, 0);
        st.sel = { x: x0, y: y0, w, h, mask: m, path: path || null, edge: e };
    }
    // the magic wand bit
    function wand(px, py, mode) {
        px = Math.floor(px); py = Math.floor(py);
        let W = st.W, Hh = st.H; if (px < 0 || py < 0 || px >= W || py >= Hh) return;
        let src = mk(W, Hh), sx = src.getContext('2d', { willReadFrequently: true });
        if (st.wandAll) os.paintCompose(sx, false); else sx.drawImage(os.paintLayers.L().c, 0, 0);
        let d = new Uint32Array(sx.getImageData(0, 0, W, Hh).data.buffer), t = d[py * W + px], tol = st.tol;
        let tr = t & 255, tg = t >> 8 & 255, tb = t >> 16 & 255, ta = t >>> 24;
        const match = i => { let p = d[i]; return Math.abs((p & 255) - tr) <= tol && Math.abs((p >> 8 & 255) - tg) <= tol && Math.abs((p >> 16 & 255) - tb) <= tol && Math.abs((p >>> 24) - ta) <= tol; };
        let seen = new Uint8Array(W * Hh), stack = [px, py];
        let m = mk(W, Hh), mx = m.getContext('2d'), mi = mx.createImageData(W, Hh), md = new Uint32Array(mi.data.buffer);
        while (stack.length) {
            let y = stack.pop(), x = stack.pop(), i = y * W + x;
            while (x > 0 && !seen[i - 1] && match(i - 1)) { x--; i--; }
            let up = false, dn = false;
            for (; x < W && !seen[i] && match(i); x++, i++) {
                seen[i] = 1; md[i] = 0xffffffff;
                if (y > 0) { let u = i - W; if (!seen[u] && match(u)) { if (!up) { stack.push(x, y - 1); up = true; } } else up = false; }
                if (y < Hh - 1) { let v = i + W; if (!seen[v] && match(v)) { if (!dn) { stack.push(x, y + 1); dn = true; } } else dn = false; }
            }
        }
        mx.putImageData(mi, 0, 0);
        setSel(m, null, mode);
        if (os.paintUI) os.paintUI.side();
        os.requestPaintRender();
    }
    function fill(px, py) {
        px = Math.floor(px); py = Math.floor(py);
        let W = st.W, Hh = st.H, b = st.sel || { x: 0, y: 0, w: W, h: Hh };
        if (px < b.x || py < b.y || px >= b.x + b.w || py >= b.y + b.h) return false;
        let img = st.artCtx.getImageData(0, 0, W, Hh), d = new Uint32Array(img.data.buffer);
        let i0 = py * W + px, t = d[i0], tol = st.tol;
        let tr = t & 255, tg = t >> 8 & 255, tb = t >> 16 & 255, ta = t >>> 24;
        let rgb = os.paintColour.hexRgb(st.color1), A = st.opacity;
        const match = i => { let p = d[i]; return Math.abs((p & 255) - tr) <= tol && Math.abs((p >> 8 & 255) - tg) <= tol && Math.abs((p >> 16 & 255) - tb) <= tol && Math.abs((p >>> 24) - ta) <= tol; };
        const paint = i => {
            let p = d[i], oa = (p >>> 24) / 255, na = A + oa * (1 - A);
            if (na <= 0) return;
            let ch = (c, o) => Math.round((c * A + o * oa * (1 - A)) / na);
            d[i] = (Math.round(na * 255) << 24 >>> 0) + (ch(rgb[2], p >> 16 & 255) << 16) + (ch(rgb[1], p >> 8 & 255) << 8) + ch(rgb[0], p & 255);
        };
        let seen = new Uint8Array(W * Hh), stack = [px, py], x0 = b.x, x1 = b.x + b.w - 1, y0 = b.y, y1 = b.y + b.h - 1;
        let mx0 = px, mx1 = px, my0 = py, my1 = py, count = 0;
        while (stack.length) {
            let y = stack.pop(), x = stack.pop(), row = y * W;
            if (seen[row + x] || !match(row + x)) continue;
            let l = x, r = x;
            while (l > x0 && !seen[row + l - 1] && match(row + l - 1)) l--;
            while (r < x1 && !seen[row + r + 1] && match(row + r + 1)) r++;
            for (let k = l; k <= r; k++) seen[row + k] = 1;
            for (let k = l; k <= r; k++) paint(row + k);
            count += r - l + 1;
            if (l < mx0) mx0 = l; if (r > mx1) mx1 = r; if (y < my0) my0 = y; if (y > my1) my1 = y;
            for (let ny = y - 1; ny <= y + 1; ny += 2) {
                if (ny < y0 || ny > y1) continue;
                let nrow = ny * W, run = false;
                for (let k = l; k <= r; k++) {
                    let ok = !seen[nrow + k] && match(nrow + k);
                    if (ok && !run) { stack.push(k, ny); run = true; } else if (!ok) run = false;
                }
            }
        }
        if (!count) return false;
        H().begin(false);
        H().grow(mx0, my0, 1); H().grow(mx1 + 1, my1 + 1, 1);
        st.artCtx.putImageData(img, 0, 0);
        H().end('塗り // FILL');
        os.requestPaintRender();
        return true;
    }
    function pick(px, py) {
        let c = document.createElement('canvas'); c.width = c.height = 1;
        let x = c.getContext('2d', { willReadFrequently: true });
        x.fillStyle = st.paper ? st.bgColor : '#000'; x.fillRect(0, 0, 1, 1);
        x.translate(-Math.floor(px), -Math.floor(py)); os.paintCompose(x, false);
        let d = x.getImageData(0, 0, 1, 1).data;
        let hex = '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join('');
        os.setPaintColor(hex);
        if (os.paintUI) os.paintUI.status('スポイト // picked ' + hex);
    }
    function fxRun(kind) {
        let l = os.paintLayers.L(), c = l.x, s = st.sel || { x: 0, y: 0, w: st.W, h: st.H };
        H().begin(false); H().grow(s.x, s.y, 0); H().grow(s.x + s.w, s.y + s.h, 0);
        if (kind === 'bloom') {
            let q = document.createElement('canvas'); q.width = Math.ceil(s.w / 10); q.height = Math.ceil(s.h / 10);
            let qx = q.getContext('2d'); qx.imageSmoothingEnabled = true; qx.drawImage(l.c, s.x, s.y, s.w, s.h, 0, 0, q.width, q.height);
            c.save(); os.paintFxBits.clipSel(c); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.9; c.imageSmoothingEnabled = true;
            c.drawImage(q, 0, 0, q.width, q.height, s.x - s.w * 0.02, s.y - s.h * 0.02, s.w * 1.04, s.h * 1.04);
            c.globalAlpha = 0.6; c.drawImage(q, 0, 0, q.width, q.height, s.x, s.y, s.w, s.h);
            c.restore();
        } else {
            let img = c.getImageData(s.x, s.y, s.w, s.h), d = img.data, w = s.w, h = s.h, src = new Uint8ClampedArray(d);
            let c1 = os.paintColour.hexRgb(st.color1), c2 = os.paintColour.hexRgb(st.color2);
            const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
            for (let y = 0; y < h; y++) {
                let jit = kind === 'vhs' && Math.random() < 0.04 ? Math.round((Math.random() - 0.5) * 18) : 0;
                for (let x = 0; x < w; x++) {
                    let i = (y * w + x) * 4;
                    if (kind === 'invert') { d[i] = 255 - src[i]; d[i + 1] = 255 - src[i + 1]; d[i + 2] = 255 - src[i + 2]; continue; }
                    if (kind === 'onebit') {
                        let a = src[i + 3]; if (!a) continue;
                        let lum = (src[i] * 0.3 + src[i + 1] * 0.59 + src[i + 2] * 0.11) / 255, th = (BAY[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
                        let cc = lum > th ? c2 : c1; d[i] = cc[0]; d[i + 1] = cc[1]; d[i + 2] = cc[2]; d[i + 3] = a > 110 ? 255 : 0;
                        continue;
                    }
                    let sh = kind === 'vhs' ? 4 : 7, xr = Math.min(w - 1, Math.max(0, x - sh + jit)), xb = Math.min(w - 1, Math.max(0, x + sh + jit)), xg = Math.min(w - 1, Math.max(0, x + jit));
                    let ir = (y * w + xr) * 4, ib = (y * w + xb) * 4, ig = (y * w + xg) * 4;
                    d[i] = src[ir]; d[i + 1] = src[ig + 1]; d[i + 2] = src[ib + 2];
                    d[i + 3] = Math.max(src[ir + 3], src[ig + 3], src[ib + 3]);
                    if (kind === 'vhs') {
                        let k = y % 2 ? 0.78 : 1, n = (Math.random() - 0.5) * 26;
                        d[i] = d[i] * k + n; d[i + 1] = d[i + 1] * k + n; d[i + 2] = d[i + 2] * k + n;
                    }
                }
            }
            c.putImageData(img, s.x, s.y);
        }
        H().end({ bloom: 'FX 発光 // BLOOM', vhs: 'FX VHS', onebit: 'FX 1-BIT', chroma: 'FX 色ずれ // CHROMA', invert: 'FX 反転 // INVERT' }[kind]);
        os.requestPaintRender();
    }
    os.paintTools = { BRUSH, DRAG, isBrush: t => BRUSH.indexOf(t) !== -1, rectOf, shape, constrain, commitDrag, fill, pick, fxRun, clampSel, wand, setSel };
})();

os.initPaintCanvas = function() {
    const displayCanvas = document.getElementById('paint-canvas');
    if (!displayCanvas) return;
    const container = displayCanvas.parentElement;
    const state = os.paintState;
    const T = os.paintTools, Hs = os.paintHist;

    if (!state.artCanvas) {
        os.paintLayers.freshDoc(1920, 1080);
    }
    if (displayCanvas._ptReady) { os.resizePaint(); return; }
    displayCanvas._ptReady = true;

    if (!container._ro && window.ResizeObserver) {
        container._ro = new ResizeObserver(() => os.resizePaint());
        container._ro.observe(container);
        container._ro.observe(displayCanvas);
        let win = document.getElementById('win-paint.exe');
        if (win) container._ro.observe(win);
    }

    const rect = container.getBoundingClientRect();
    if (displayCanvas.width !== Math.floor(rect.width) || displayCanvas.height !== Math.floor(rect.height)) {
        displayCanvas.width = Math.max(100, Math.floor(rect.width));
        displayCanvas.height = Math.max(100, Math.floor(rect.height));
    }

    if (state.panX === 0 && state.panY === 0) os.resetPaintView();
    else os.requestPaintRender();
    if (os.paintUI) os.paintUI.build();

    const activePointers = new Map();
    let coordTxt = '', coordRaf = 0;

    // the window squashes the canvas sometimes so scale the mouse or the shapes land too high
    let held = null;
    const rel = (x, y) => {
        const r = held || displayCanvas.getBoundingClientRect();
        return { x: (x - r.left) * (displayCanvas.width / (r.width || 1)), y: (y - r.top) * (displayCanvas.height / (r.height || 1)) };
    };
    const getPos = (e) => {
        const m = rel(e.clientX, e.clientY);
        let x = (m.x - state.panX) / state.zoom;
        return {
            x: state.flipView ? state.W - x : x,
            y: (m.y - state.panY) / state.zoom,
            pressure: e.pressure && e.pressure > 0 ? e.pressure : 0.5,
            pen: e.pointerType === 'pen'
        };
    };
    let cur = null, rawLast = null;
    const margin = () => state.size * (state.tool === 'stamp' ? 16 : state.tool === 'glitch' ? 14 : state.tool === 'sort' ? 10 : 6) + 24;
    const fullStroke = () => os.paintMirrorOn() || state.tool === 'glitch';

    const busy = on => { if (os.mobileish && os.mobileish()) document.documentElement.classList.toggle('pt-busy', on); };
    function beginStroke(pos) {
        busy(true);
        Hs.begin(fullStroke());
        state.isDrawing = true;
        state.strokeId = (state.strokeId || 0) + 1;
        state.sx = pos.x; state.sy = pos.y;
        cur = [[Math.round(pos.x), Math.round(pos.y)]];
        os.paintStrokeAt(pos, true);
        Hs.grow(pos.x, pos.y, margin());
    }
    function moveStroke(raw) {
        rawLast = raw;
        let k = 1 - Math.min(0.9, state.smooth) * 0.85, tx = raw.x, ty = raw.y;
        // high smoothing = the brush hangs behind on a string. lineart heaven
        let rope = state.smooth > 0.35 ? (state.smooth - 0.35) * 46 / state.zoom : 0;
        if (rope) { let dx = raw.x - state.sx, dy = raw.y - state.sy, d = Math.hypot(dx, dy); if (d <= rope) return; tx = raw.x - dx / d * rope; ty = raw.y - dy / d * rope; k = Math.max(k, 0.5); }
        state.sx += (tx - state.sx) * k; state.sy += (ty - state.sy) * k;
        let p = { x: state.sx, y: state.sy, pressure: raw.pressure, pen: raw.pen };
        os.paintStrokeAt(p, false);
        Hs.grow(p.x, p.y, margin());
        let lp = cur[cur.length - 1];
        if (Math.hypot(p.x - lp[0], p.y - lp[1]) > 6) cur.push([Math.round(p.x), Math.round(p.y)]);
    }
    function endStroke() {
        busy(false);
        if (os.paintFxBits) os.paintFxBits.flush();
        if (!state.isDrawing) return;
        state.isDrawing = false;
        if (rawLast && state.smooth > 0 && state.tool !== 'stamp') { os.paintStrokeAt(rawLast, false); Hs.grow(rawLast.x, rawLast.y, margin()); }
        rawLast = null;
        if (state.tool === 'neon' && os._ptNeonDone) { let nb = os._ptNeonDone(); if (nb) { Hs.grow(nb[0], nb[1], 0); Hs.grow(nb[2], nb[3], 0); } }
        let label = os.paintUI ? os.paintUI.label(state.tool) : state.tool;
        Hs.end(label);
        cur = null;
        os.requestPaintRender();
    }
    os._ptEndStroke = endStroke;
    function dropStroke() {
        busy(false);
        if (os.paintFxBits) os.paintFxBits.flush();
        if (!state.isDrawing) return;
        state.isDrawing = false; state._neon = null; rawLast = null; cur = null;
        Hs.cancel(); os.requestPaintRender();
    }

    displayCanvas.onwheel = (e) => {
        e.preventDefault();
        const m = rel(e.clientX, e.clientY), mouseX = m.x, mouseY = m.y;

        const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
        const newZoom = Math.min(Math.max(0.1, state.zoom * zoomFactor), 12.0);

        state.panX = mouseX - (mouseX - state.panX) * (newZoom / state.zoom);
        state.panY = mouseY - (mouseY - state.panY) * (newZoom / state.zoom);
        state.zoom = newZoom;

        os.requestPaintRender(true);
    };

    // once the pencil's been used fingers just move the paper
    // 2 finger tap undo, 3 redo
    let gest = null;
    const mid = () => { let p = Array.from(activePointers.values()), a = p[0], b = p[1] || p[0], m = rel((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2); return { x: m.x, y: m.y, d: Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY) }; };
    function pinchStart() { let m = mid(); state.pinch = { m, z: state.zoom, px: state.panX, py: state.panY }; }
    function panStart(e) { let m = rel(e.clientX, e.clientY); state.panStartX = m.x - state.panX; state.panStartY = m.y - state.panY; }

    displayCanvas.onpointerdown = (e) => {
        if (e.pointerType === 'pen') state.penSeen = true;
        // palm while the pencil is drawing. just ignore it
        if (e.pointerType === 'touch' && state.penSeen && state.isDrawing) return;
        try { displayCanvas.setPointerCapture(e.pointerId); } catch (er) {}
        held = displayCanvas.getBoundingClientRect();
        activePointers.set(e.pointerId, e);
        if (e.pointerType === 'touch') {
            if (!gest || activePointers.size === 1) gest = { max: 1, t0: performance.now(), moved: false };
            else gest.max = Math.max(gest.max, activePointers.size);
        } else gest = null;

        if (e.button === 1 || state.spaceDown || activePointers.size >= 2 || (e.pointerType === 'touch' && state.penSeen)) {
            // pinch = bin the stroke, not leave a blob
            if (state.isDrawing) dropStroke();
            state.drag = null;
            state.isPanning = true;
            state.isDrawing = false;
            if (activePointers.size >= 2) pinchStart(); else panStart(e);
            return;
        }

        if (activePointers.size === 1 && e.button === 0) {
            const pos = getPos(e);
            const lay = os.paintLayers.L();
            if ((e.altKey && !['select', 'lasso', 'wand'].includes(state.tool)) || state.tool === 'pick') { T.pick(pos.x, pos.y); return; }
            let selMode = e.shiftKey ? 'add' : e.altKey && state.tool !== 'pick' ? 'sub' : null;
            if (state.tool === 'select' || state.tool === 'lasso') { state.drag = { tool: state.tool, x0: pos.x, y0: pos.y, x1: pos.x, y1: pos.y, moved: false, mode: selMode, pts: [[pos.x, pos.y]] }; return; }
            if (os.paintFilterTap && os.paintFilterTap(pos.x, pos.y)) return;
            if (state.tool === 'wand') { T.wand(pos.x, pos.y, selMode); return; }
            if (!lay.vis) { os.paintUI && os.paintUI.status('レイヤーが隠れてる // that layer is hidden'); return; }
            if (lay.lock) { os.paintUI && os.paintUI.status('レイヤーがロック中 // that layer is locked. click the 🔒 to unlock'); return; }
            if (state.tool === 'fill') { T.fill(pos.x, pos.y); return; }
            if (T.DRAG.indexOf(state.tool) !== -1) { state.drag = { tool: state.tool, x0: pos.x, y0: pos.y, x1: pos.x, y1: pos.y, moved: false }; return; }
            if (state.tool === 'stamp' && !state.stamp) return;
            state.isPanning = false;
            state.lastX = pos.x;
            state.lastY = pos.y;
            state.lastPressure = pos.pressure;
            beginStroke(pos);
        }
    };

    displayCanvas.onpointermove = (e) => {
        const pos = getPos(e);
        coordTxt = `X: ${Math.round(pos.x)} Y: ${Math.round(pos.y)}`;
        if (!coordRaf) coordRaf = requestAnimationFrame(() => { coordRaf = 0; let c = document.getElementById('paint-coords'); if (c) c.textContent = coordTxt; });
        if (e.pointerType !== 'touch') {
            state.hover = rel(e.clientX, e.clientY);
            if (!state.isDrawing) os.requestPaintRender(true);
        }

        if (!activePointers.has(e.pointerId)) return;
        activePointers.set(e.pointerId, e);

        if (activePointers.size >= 2 && state.pinch) {
            let m = mid(), P = state.pinch, z = Math.min(Math.max(0.1, P.z * (P.m.d ? m.d / P.m.d : 1)), 12.0);
            if (gest && (Math.abs(m.d - P.m.d) > 12 || Math.hypot(m.x - P.m.x, m.y - P.m.y) > 12)) gest.moved = true;
            // the spot under your fingers stays under your fingers
            state.panX = m.x - (P.m.x - P.px) / P.z * z;
            state.panY = m.y - (P.m.y - P.py) / P.z * z;
            state.zoom = z;
            os.requestPaintRender(true);
            return;
        }

        if (state.isPanning) {
            let m = rel(e.clientX, e.clientY);
            if (gest && Math.hypot(m.x - state.panStartX - state.panX, m.y - state.panStartY - state.panY) > 10) gest.moved = true;
            state.panX = m.x - state.panStartX;
            state.panY = m.y - state.panStartY;
            os.requestPaintRender(true);
            return;
        }
        if (state.drag) {
            if (state.drag.tool === 'lasso') { let lp = state.drag.pts[state.drag.pts.length - 1]; if (Math.hypot(pos.x - lp[0], pos.y - lp[1]) * state.zoom > 2) state.drag.pts.push([pos.x, pos.y]); }
            state.drag.x1 = pos.x; state.drag.y1 = pos.y;
            state.drag.moved = state.drag.moved || Math.hypot(pos.x - state.drag.x0, pos.y - state.drag.y0) * state.zoom > 3;
            T.constrain(state.drag, e.shiftKey);
            os.requestPaintRender();
            return;
        }

        if (state.isDrawing) {
            let events = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
            if (!events.length) events = [e];
            for (let i = 0; i < events.length; i++) {
                moveStroke(getPos(events[i]));
            }
        }
    };

    displayCanvas.onpointerup = displayCanvas.onpointercancel = (e) => {
        if (!activePointers.has(e.pointerId)) return;
        activePointers.delete(e.pointerId);
        try { displayCanvas.releasePointerCapture(e.pointerId); } catch(err) {}

        if (activePointers.size >= 2) pinchStart();
        else if (activePointers.size === 1) { state.pinch = null; if (state.isPanning) panStart(activePointers.values().next().value); }
        if (activePointers.size === 0) {
            held = null; state.pinch = null;
            if (state.drag) { let d = state.drag; state.drag = null; T.commitDrag(d); }
            endStroke();
            state.isDrawing = false;
            state.isPanning = false;
            let g = gest; gest = null;
            if (g && !g.moved && g.max >= 2 && e.type === 'pointerup' && performance.now() - g.t0 < 350) {
                if (g.max === 2) { os.paintUndo(); if (os.paintUI) os.paintUI.status('↶ 元に戻す // undo'); }
                else { os.paintRedo(); if (os.paintUI) os.paintUI.status('↷ やり直し // redo'); }
            }
        }
    };
    displayCanvas.onpointerleave = () => { state.hover = null; os.requestPaintRender(true); };
};

// first esc drops the selection. losing a drawing to one stray key is brutal
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const win = document.getElementById('win-paint.exe'), st = os.paintState;
    if (!win || !win.classList.contains('is-active') || win.classList.contains('is-min') || !st || !st.sel || !st.layers.length) return;
    e.stopImmediatePropagation(); e.preventDefault();
    st.sel = null; if (os.paintUI) os.paintUI.side(); os.requestPaintRender();
}, true);
// ctrl+z, only when paint is on top or it'd undo while you type in notes
document.addEventListener('keydown', (e) => {
    const win = document.getElementById('win-paint.exe');
    if (!win || !win.classList.contains('is-active') || win.classList.contains('is-min')) return;
    if (!os.paintState || !os.paintState.layers.length) return;
    const tg = e.target;
    if (tg && (tg.isContentEditable || tg.tagName === 'TEXTAREA' || (tg.tagName === 'INPUT' && !/range|color|checkbox|button/.test(tg.type)))) return;
    const st = os.paintState, mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
    if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? os.paintRedo() : os.paintUndo(); return; }
    if (mod && k === 'y') { e.preventDefault(); os.paintRedo(); return; }
    if (mod && k === 's') { e.preventDefault(); os.paintUI && os.paintUI.save(); return; }
    if (mod && k === 'a') { e.preventDefault(); st.sel = { x: 0, y: 0, w: st.W, h: st.H }; os.paintUI && os.paintUI.side(); os.requestPaintRender(); return; }
    if (mod) return;
    if (k === ' ') { if (!st.spaceDown) { st.spaceDown = true; } e.preventDefault(); return; }
    if (k === 'escape') { st.sel = null; os.paintUI && os.paintUI.side(); os.requestPaintRender(); return; }
    if (k === 'delete' || k === 'backspace') { if (st.sel) { e.preventDefault(); os.paintUI && os.paintUI.clearSel(); } return; }
    if (k === '[' || k === ']') { st.size = Math.max(1, Math.min(100, st.size + (k === ']' ? 2 : -2))); let s = document.getElementById('paint-size'); if (s) s.value = st.size; os.requestPaintRender(); return; }
    const keys = { b: 'pen', e: 'eraser', n: 'neon', a: 'air', s: 'smudge', i: 'pick', m: 'select', q: 'lasso', w: 'wand', g: 'gradient', f: 'fill', l: 'line', u: 'rect', o: 'ellipse' };
    if (keys[k]) os.setPaintTool(keys[k]);
});
document.addEventListener('keyup', (e) => { if (e.key === ' ') os.paintState.spaceDown = false; });

(function () {
    const st = os.paintState;
    const $ = id => document.getElementById(id);
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const click = () => { if (typeof os.clickAudio === 'function') os.clickAudio(); };
    const MINE = [['pen', '[ ペン / PEN ]'], ['neon', '[ ネオン / NEON ]'], ['brush3d', '[ 3Dリボン / HOLO-3D ]'], ['anaglyph', '[ アナグリフ / ANAGLYPH ]'], ['glitch', '[ グリッチ / GLITCH ]'], ['spray', '[ スプレー / SPRAY ]'], ['pixel', '[ ドット / PIXEL ]'], ['eraser', '[ 消しゴム / ERASE ]']];
    const MORE = [['mybrush', '[ 自作筆 / MY BRUSH ]'], ['tone', '[ 網点 / TONE ]'], ['air', '[ エアブラシ / AIRBRUSH ]'], ['smudge', '[ 指先 / SMUDGE ]'], ['blur', '[ ぼかし / BLUR ]'], ['sort', '[ モッシュ / MOSH ]']];
    const SHAPE = [['xform', '[ 変形 / TRANSFORM ]'], ['line', '[ 直線 / LINE ]'], ['rect', '[ 四角 / BOX ]'], ['ellipse', '[ 楕円 / ELLIPSE ]'], ['gradient', '[ グラデ / GRADIENT ]'], ['fill', '[ 塗り / FILL ]'], ['select', '[ 選択 / SELECT ]'], ['lasso', '[ 投げ縄 / LASSO ]'], ['wand', '[ 自動選択 / WAND ]'], ['pick', '[ スポイト / PICK ]']];
    const SIZES = [[0, 0, '画面いっぱい // the whole window'], [1920, 1080, '1920×1080 // いつもの'], [1080, 1920, '1080×1920 // あの小さい長方形 (lol)', 1], [2048, 2048, '2048×2048 // 正方形', 1], [1200, 1700, '1200×1700 // 漫画原稿', 1]];

    function label(t) {
        let all = MINE.concat(MORE, SHAPE);
        let f = all.find(x => x[0] === t);
        if (f) return f[1].replace(/[\[\]]/g, '').trim();
        return t === 'stamp' ? 'スタンプ // STAMP ' + (st.stamp || '') : t;
    }
    let statusTm = 0;
    function status(text, ms) {
        let s = $('pt-status'); if (!s) return;
        s.textContent = text; s.classList.add('on');
        clearTimeout(statusTm); statusTm = setTimeout(() => { s.classList.remove('on'); s.textContent = ''; }, ms || 3500);
    }
    function chip(t, lab, extra) { return `<button type="button" class="pt-tool${st.tool === t ? ' active' : ''}${extra || ''}" data-tool="${t}" title="${esc(lab.replace(/[\[\]]/g, '').trim())}"><i class="pt-ti" data-em="pt-${t}"></i></button>`; }
    function tbox() {
        let b = $('pt-tbox'); if (!b) return;
        b.querySelector('b').textContent = label(st.tool);
        let k = Math.min(46, Math.max(2, st.size * Math.min(1, 46 / 100) * 1.4));
        b.style.setProperty('--pt-sz', k.toFixed(1) + 'px');
        b.style.setProperty('--pt-c1', st.tool === 'eraser' ? '#fff' : st.color1);
    }

    os.paintMarket = function () { opts(); bar(); side(); };

    function opts() {
        let box = $('pt-ctx'); if (!box) return;
        let t = st.tool, h = '';
        if (['line', 'rect', 'ellipse'].includes(t) && t !== 'line') h += `<label class="pt-tog"><input type="checkbox" id="pt-sfill" ${st.shapeFill ? 'checked' : ''}> 塗る // FILL (C2)</label>`;
        if (t === 'gradient') h += `<select id="pt-gk" class="pt-sel"><option value="linear" ${st.gradKind === 'linear' ? 'selected' : ''}>線形 // LINEAR</option><option value="radial" ${st.gradKind === 'radial' ? 'selected' : ''}>円形 // RADIAL</option></select>`;
        if (t === 'fill' || t === 'wand') h += `<label>許容 // TOL: <input type="range" id="pt-tol" min="0" max="120" value="${st.tol}"></label>`;
        if (t === 'wand') h += `<label class="pt-tog"><input type="checkbox" id="pt-wall" ${st.wandAll ? 'checked' : ''}> 全レイヤー // ALL LAYERS</label>`;
        if (['select', 'lasso', 'wand'].includes(t)) h += `<span class="pt-hint">shift 足す // add · alt 引く // take away</span>`;
        if (os.paintOwned('mirror')) h += `<label class="pt-lab">鏡 // MIRROR: <select id="pt-mir" class="pt-sel">${[0, 2, 4, 8].map(n => `<option value="${n}" ${st.mirror === n ? 'selected' : ''}>${n ? n + '枚' : 'OFF'}</option>`).join('')}</select></label>`;
        if (os.paintOwned('mirror') && st.mirror) h += `<label class="pt-tog"><input type="checkbox" id="pt-mirg" ${st.mirrorGuide !== false ? 'checked' : ''}> 線 // GUIDE</label>`;
        box.innerHTML = h;
        tbox();
        let f = $('pt-sfill'); if (f) f.onchange = () => { st.shapeFill = f.checked; };
        let g = $('pt-gk'); if (g) g.onchange = () => { st.gradKind = g.value; };
        let tl = $('pt-tol'); if (tl) tl.oninput = () => { st.tol = +tl.value; };
        let wa = $('pt-wall'); if (wa) wa.onchange = () => { st.wandAll = wa.checked; };
        let mr = $('pt-mir'); if (mr) mr.onchange = () => { st.mirror = +mr.value; opts(); os.requestPaintRender(); };
        let mg = $('pt-mirg'); if (mg) mg.onchange = () => { st.mirrorGuide = mg.checked; os.requestPaintRender(); };
    }

    function bar() {
        let fx = $('pt-fxbtn'); if (fx) fx.hidden = !os.paintOwned('fx');
        let u = $('pt-undo'), r = $('pt-redo');
        if (u) u.disabled = !st.undo.length; if (r) r.disabled = !st.redo.length;
        let c = $('pt-crt'); if (c) c.classList.toggle('active', st.crt);
        let o = document.querySelector('#win-paint\\.exe .crt-overlay'); if (o) o.style.display = st.crt ? '' : 'none';
    }
    function res() { let r = $('pt-res'); if (r) r.textContent = 'RES: ' + st.W + 'x' + st.H; }

    function side() {
        let box = $('pt-layers'); if (!box) return;
        let pk = (st.picked || []).filter(l => st.layers.includes(l)); st.picked = pk;
        let lastG = null;
        box.innerHTML = st.layers.map((l, i) => ({ l, i })).reverse().map(({ l, i }) => { let head = ''; if (l.g && l.g !== lastG) head = `<div class="pt-lay pt-fold${st.fsel === l.g ? ' on' : ''}" data-fold="${l.g.id}"><button type="button" class="pt-eye${l.g.vis ? '' : ' off'}" data-feye="${l.g.id}" title="表示 // show"><i class="pt-bi" data-em="pt-l-${l.g.vis ? 'eye' : 'eyeoff'}"></i></button><button type="button" class="pt-ftog" data-fopen="${l.g.id}" title="開く / 閉じる // open / shut">${l.g.open ? '▾' : '▸'}</button><i class="pt-bi pt-fic" data-em="pt-l-fold"></i><span class="pt-lname" data-fren="${l.g.id}">${esc(l.g.name)}</span><small class="pt-fmeta">${Math.round(l.g.op * 100)}%</small></div>`; lastG = l.g || null; return head + `<div class="pt-lay${i === st.active && !st.fsel ? ' on' : ''}${l.clip ? ' clip' : ''}${l.g ? ' infold' : ''}${l.g && !l.g.open ? ' shut' : ''}${pk.length > 1 && pk.includes(l) ? ' picked' : ''}" data-li="${i}">
            <button type="button" class="pt-eye${l.vis ? '' : ' off'}" data-eye="${i}" title="表示 // show"><i class="pt-bi" data-em="pt-l-${l.vis ? 'eye' : 'eyeoff'}"></i></button>
            <canvas class="pt-thumb" data-th="${i}" width="40" height="24"></canvas>
            <span class="pt-lname" data-ren="${i}">${l.clip ? '<b class="pt-cl">↳</b>' : ''}${esc(l.name)}</span>
            <span class="pt-lflags"><button type="button" class="pt-lf${l.lock ? ' on' : ''}" data-lock="${i}" title="ロック // lock the layer"><i class="pt-bi" data-em="pt-l-lock"></i></button><button type="button" class="pt-lf${l.alock ? ' on' : ''}" data-alock="${i}" title="透明保護 // alpha lock: only paint over what's already there"><i class="pt-bi" data-em="pt-l-alock"></i></button><button type="button" class="pt-lf${l.clip ? ' on' : ''}" data-clip="${i}" title="クリッピング // clip to the layer under it"${i === 0 ? ' disabled' : ''}><i class="pt-bi" data-em="pt-l-clip"></i></button></span>
        </div>`; }).join('') + `<div class="pt-lay pt-paper pt-bgrow" title="背景の色 // background colour. 目を閉じると透明 // hide it = see-through png"><button type="button" class="pt-eye${st.paper ? '' : ' off'}" data-paper="1"><i class="pt-bi" data-em="pt-l-${st.paper ? 'eye' : 'eyeoff'}"></i></button><span class="pt-lname">背景 // BACKGROUND<small class="pt-bghex">${st.paper ? esc(st.bgColor) : '透明 // none'}</small></span><button type="button" class="pt-bgsw" data-bgpick="1" title="色を変える // change colour" style="background:${st.paper ? esc(st.bgColor) : 'repeating-conic-gradient(#555 0 25%, #222 0 50%) 0 0 / 8px 8px'}"></button></div>`;
        // thumbnails only get redrawn when that layer actually changed
        box.querySelectorAll('.pt-thumb').forEach(cv => {
            let ly = st.layers[+cv.dataset.th], v = (ly.ver || 0) + '|' + st.W + 'x' + st.H;
            if (!ly._th || ly._th.v !== v) {
                let t = ly._th ? ly._th.c : document.createElement('canvas'); t.width = 40; t.height = 24;
                let x = t.getContext('2d'), k = Math.min(40 / st.W, 24 / st.H), w = st.W * k, h = st.H * k;
                x.clearRect(0, 0, 40, 24); x.fillStyle = '#fff'; x.fillRect((40 - w) / 2, (24 - h) / 2, w, h); x.drawImage(ly.c, (40 - w) / 2, (24 - h) / 2, w, h);
                ly._th = { v, c: t };
            }
            cv.getContext('2d').drawImage(ly._th.c, 0, 0);
        });
        if (st.fsel && !st.layers.some(x => x.g === st.fsel)) st.fsel = null;
        let l = st.fsel || os.paintLayers.L(); if (!l) return;
        let op = $('pt-lop'); if (op) op.value = Math.round(l.op * 100);
        let bl = $('pt-lblend'); if (bl) bl.value = l.blend;
        let n = st.layers.length;
        let dis = { 'pt-ldel': n < 2, 'pt-lup': st.active >= n - 1, 'pt-ldown': st.active <= 0, 'pt-lmerge': st.active <= 0 && (st.picked || []).length < 2, 'pt-ladd': n >= 24, 'pt-ldup': n >= 24, 'pt-lcut': !st.sel || n >= 24 };
        Object.keys(dis).forEach(id => { let b = $(id); if (b) b.disabled = dis[id]; });
        let sl = $('pt-selrow'); if (sl) sl.hidden = !st.sel;
        let hb = $('pt-hist');
        if (hb) {
            let rows = st.undo.map((e, i) => `<div class="pt-hrow on" data-h="${i}">${esc(e.label || '?')}</div>`).reverse();
            let rrows = st.redo.slice().reverse().map((e, i) => `<div class="pt-hrow off" data-r="${i}">${esc(e.label || '?')}</div>`).reverse();
            hb.innerHTML = rrows.join('') + rows.slice(0, 30).join('') + '<div class="pt-hrow base" data-h="-1">— 白紙 // blank —</div>';
        }
        bar();
    }
    function wireSide() {
        let box = $('pt-layers');
        box.onclick = (e) => {
            let t = e.target.closest('[data-bgpick],[data-eye],[data-lock],[data-alock],[data-clip],[data-br],[data-paper],[data-feye],[data-fopen],[data-fold],[data-li]');
            if (!t) return;
            if (t.dataset.bgpick) { click(); if (!st.paper) { st.paper = true; side(); os.requestPaintRender(); } let bg = $('paint-bg'); if (bg) { bg.value = st.bgColor; if (bg.showPicker) { try { bg.showPicker(); return; } catch (er) {} } bg.click(); } return; }
            click();
            if (t.dataset.feye) { let g = folder(t.dataset.feye); if (g) g.vis = !g.vis; }
            else if (t.dataset.fopen) { let g = folder(t.dataset.fopen); if (g) g.open = !g.open; }
            else if (t.dataset.fold) { st.fsel = folder(t.dataset.fold); st.picked = []; }
            else if (t.dataset.eye != null) { let l = st.layers[+t.dataset.eye]; l.vis = !l.vis; }
            else if (t.dataset.lock != null) { let l = st.layers[+t.dataset.lock]; l.lock = !l.lock; status(l.lock ? 'ロック // locked, nothing paints on it' : 'ロック解除 // unlocked'); }
            else if (t.dataset.alock != null) { let l = st.layers[+t.dataset.alock]; l.alock = !l.alock; status(l.alock ? '透明保護 // alpha lock: you only paint where theres already paint' : '透明保護 オフ // alpha lock off'); }
            else if (t.dataset.clip != null) { let l = st.layers[+t.dataset.clip]; if (+t.dataset.clip > 0) { l.clip = !l.clip; status(l.clip ? 'クリッピング // clipped: only shows on the layer under it' : 'クリッピング解除 // unclipped'); } }
            else if (t.dataset.paper) { st.paper = !st.paper; status(st.paper ? '背景あり // background on' : '背景なし、透明 // no background. see-through (the png saves see-through too)'); }
            else if (e.ctrlKey || e.metaKey || e.shiftKey) pick(st.layers[+t.dataset.li]);
            else { st.picked = []; st.fsel = null; os.paintLayers.setActive(+t.dataset.li); }
            side(); os.paintChanged(); os.requestPaintRender();
        };
        box.ondblclick = (e) => {
            let f = e.target.closest('[data-fren]');
            if (f) { let g = folder(f.dataset.fren); if (!g) return; let inp = document.createElement('input'); inp.className = 'pt-rename'; inp.value = g.name; inp.maxLength = 28; f.replaceWith(inp); inp.focus(); inp.select(); inp.onblur = () => { g.name = inp.value.trim() || g.name; side(); }; inp.onkeydown = ev => { if (ev.key === 'Enter') inp.blur(); if (ev.key === 'Escape') { inp.value = g.name; inp.blur(); } }; return; }
            let t = e.target.closest('[data-ren]'); if (!t) return;
            let l = st.layers[+t.dataset.ren];
            let inp = document.createElement('input'); inp.className = 'pt-rename'; inp.value = l.name; inp.maxLength = 28;
            t.replaceWith(inp); inp.focus(); inp.select();
            const done = () => { l.name = inp.value.trim() || l.name; side(); os.paintChanged(); };
            inp.onblur = done; inp.onkeydown = ev => { if (ev.key === 'Enter') inp.blur(); if (ev.key === 'Escape') { inp.value = l.name; inp.blur(); } };
        };
        let hb = $('pt-hist');
        hb.onclick = (e) => {
            let t = e.target.closest('[data-h],[data-r]'); if (!t) return;
            click();
            if (t.dataset.h != null) { let want = +t.dataset.h + 1; while (st.undo.length > want) os.paintUndo(); }
            else { let n = +t.dataset.r + 1; for (let k = 0; k < n; k++) os.paintRedo(); }
        };
        $('pt-lop').oninput = (e) => { (st.fsel || os.paintLayers.L()).op = e.target.value / 100; os.requestPaintRender(); };
        $('pt-lop').onchange = () => { os.paintChanged(); side(); };
        $('pt-lblend').onchange = (e) => { (st.fsel || os.paintLayers.L()).blend = e.target.value; os.requestPaintRender(); os.paintChanged(); };
        const S = os.paintHist, LY = os.paintLayers;
        $('pt-ladd').onclick = () => { click(); S.push(S.struct('＋ レイヤー // NEW LAYER', () => { let n = LY.newLayer(); n.g = LY.L().g || null; st.layers.splice(st.active + 1, 0, n); LY.setActive(st.active + 1); })); os.requestPaintRender(); };
        $('pt-ldup').onclick = () => { click(); S.push(S.struct('⧉ 複製 // DUPLICATE', () => { let o = LY.L(), n = LY.newLayer(o.name + ' copy'); n.x.drawImage(o.c, 0, 0); n.op = o.op; n.blend = o.blend; n.clip = o.clip; n.alock = o.alock; n.g = o.g || null; st.layers.splice(st.active + 1, 0, n); LY.setActive(st.active + 1); })); os.requestPaintRender(); };
        $('pt-ldel').onclick = () => {
            if (st.layers.length < 2) return;
            click();
            S.push(S.struct('✕ 削除 // DELETE', () => { st.layers.splice(st.active, 1); LY.setActive(Math.min(st.active, st.layers.length - 1)); }));
            os.requestPaintRender();
        };
        const move = d => {
            if (st.fsel) { moveFolder(st.fsel, d); return; }
            let i = st.active, j = i + d; if (j < 0 || j >= st.layers.length) return; click(); S.push(S.struct(d > 0 ? '↑ 上へ // UP' : '↓ 下へ // DOWN', () => { let a = st.layers; [a[i], a[j]] = [a[j], a[i]]; fixG(a[j]); fixG(a[i]); LY.setActive(j); })); os.requestPaintRender();
        };
        $('pt-lup').onclick = () => move(1);
        $('pt-ldown').onclick = () => move(-1);
        $('pt-lmerge').onclick = () => {
            let pk = (st.picked || []).filter(l => st.layers.includes(l));
            if (pk.length > 1) { click(); mergeList(pk, '⤓ 結合 // MERGE ' + pk.length); return; }
            let i = st.active; if (i < 1) return;
            click(); mergeList([st.layers[i - 1], st.layers[i]], '⤓ 結合 // MERGE DOWN');
        };
        $('pt-lcut').onclick = () => {
            if (!st.sel) return;
            click();
            let s = st.sel, o = LY.L();
            S.push(S.struct('✂ 選択→レイヤー // SELECTION TO LAYER', () => { let n = LY.newLayer('選択 // selection'); n.g = o.g || null; n.x.drawImage(o.c, s.x, s.y, s.w, s.h, s.x, s.y, s.w, s.h); if (s.mask) { n.x.globalCompositeOperation = 'destination-in'; n.x.drawImage(s.mask, 0, 0); n.x.globalCompositeOperation = 'source-over'; } st.layers.splice(st.active + 1, 0, n); LY.setActive(st.active + 1); }));
            os.requestPaintRender();
        };
        $('pt-selclear').onclick = () => { click(); clearSel(); };
        $('pt-lfold').onclick = () => { click(); makeFolder(); };
        $('pt-seloff').onclick = () => { click(); st.sel = null; side(); os.requestPaintRender(); };
        if (os.paintLayerPlus) os.paintLayerPlus(box);
        if (os.paintXformWire) os.paintXformWire();
    }
    const newCv = () => { let c = document.createElement('canvas'); c.width = st.W; c.height = st.H; return c; };
    // folders. the layers in one have to sit together
    let fN = 0;
    function folder(id) { let l = st.layers.find(x => x.g && String(x.g.id) === String(id)); return l ? l.g : null; }
    function fixG(l) {
        let a = st.layers, i = a.indexOf(l), up = a[i + 1], dn = a[i - 1];
        if (l.g && ((up && up.g === l.g) || (dn && dn.g === l.g))) return;
        l.g = up && dn && up.g && up.g === dn.g ? up.g : null;
    }
    function makeFolder() {
        const S = os.paintHist, LY = os.paintLayers;
        let pk = (st.picked || []).filter(l => st.layers.includes(l)), list = pk.length > 1 ? pk : [LY.L()];
        list = list.slice().sort((a, b) => st.layers.indexOf(a) - st.layers.indexOf(b));
        fN = Math.max(fN, ...st.layers.map(l => l.g ? +l.g.id : 0)) + 1;
        let g = { id: fN, name: 'フォルダ ' + fN, vis: true, op: 1, blend: 'source-over', open: true }, top = st.layers.indexOf(list[list.length - 1]);
        S.push(S.struct('📁 フォルダ // NEW FOLDER', () => {
            let rest = st.layers.filter(l => !list.includes(l)), at = rest.indexOf(st.layers[top + 1]); if (at < 0) at = rest.length;
            st.layers = rest.slice(0, at).concat(list, rest.slice(at));
            list.forEach(l => { l.g = g; });
            LY.setActive(st.layers.indexOf(list[list.length - 1]));
        }));
        st.picked = []; st.fsel = g; side(); os.requestPaintRender();
    }
    function runOf(g) { let a = st.layers, i0 = a.findIndex(l => l.g === g), i1 = i0; while (i1 + 1 < a.length && a[i1 + 1].g === g) i1++; return [i0, i1]; }
    function moveFolder(g, d) {
        const S = os.paintHist;
        let [i0, i1] = runOf(g), a = st.layers;
        let nb = d > 0 ? a[i1 + 1] : a[i0 - 1]; if (!nb) return;
        click();
        S.push(S.struct(d > 0 ? '↑ フォルダ // FOLDER UP' : '↓ フォルダ // FOLDER DOWN', () => {
            let run = a.slice(i0, i1 + 1), other;
            if (nb.g) { let [j0, j1] = runOf(nb.g); other = a.slice(j0, j1 + 1); } else other = [nb];
            let rest = a.filter(l => !run.includes(l) && !other.includes(l)), at = Math.min(i0, a.indexOf(other[0]));
            st.layers = rest.slice(0, at).concat(d > 0 ? other.concat(run) : run.concat(other), rest.slice(at));
            os.paintLayers.setActive(st.layers.indexOf(run[run.length - 1]));
        }));
        side(); os.requestPaintRender();
    }
    function folderOps(g) {
        const S = os.paintHist, LY = os.paintLayers;
        let [i0, i1] = runOf(g), kids = st.layers.slice(i0, i1 + 1);
        return [
            ['✎ 名前を変える // rename', () => { let el = document.querySelector('#pt-layers [data-fren="' + g.id + '"]'); if (el) el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); }],
            ['↑ 上へ // move up', () => moveFolder(g, 1), i1 >= st.layers.length - 1],
            ['↓ 下へ // move down', () => moveFolder(g, -1), i0 <= 0],
            ['⤓ 1枚に結合 // merge into one layer', () => {
                let flat = newCv(), saved = kids.map(l => l.g); kids.forEach(l => { l.g = null; });
                os.paintCompose(flat.getContext('2d'), false, kids);
                kids.forEach((l, i) => { l.g = saved[i]; });
                let n = LY.newLayer(g.name); n.x.drawImage(flat, 0, 0); n.op = g.op; n.blend = g.blend; n.vis = g.vis;
                S.push(S.struct('⤓ フォルダ結合 // MERGE FOLDER', () => { st.layers.splice(i0, kids.length, n); LY.setActive(i0); }));
                st.fsel = null; side(); os.requestPaintRender();
            }],
            ['⇱ フォルダ解除 // ungroup', () => { S.push(S.struct('⇱ フォルダ解除 // UNGROUP', () => kids.forEach(l => { l.g = null; }))); st.fsel = null; side(); os.requestPaintRender(); }],
            '-',
            ['✕ 中身ごと削除 // delete it + whats in it', () => { if (kids.length >= st.layers.length) { status('全部は消せない // cant delete every layer'); return; } S.push(S.struct('✕ フォルダ削除 // DELETE FOLDER', () => { st.layers.splice(i0, kids.length); LY.setActive(Math.min(i0, st.layers.length - 1)); })); st.fsel = null; side(); os.requestPaintRender(); }]
        ];
    }
    function pick(l) {
        let pk = (st.picked || []).filter(x => st.layers.includes(x));
        if (!pk.length) pk = [os.paintLayers.L()];
        st.picked = pk.includes(l) ? pk.filter(x => x !== l) : pk.concat([l]);
        if (st.picked.length > 1) status('選択中 ' + st.picked.length + ' // ' + st.picked.length + ' picked. ⤓ merges them');
    }
    const baseOf = l => { let i = st.layers.indexOf(l); while (i > 0 && st.layers[i].clip) i--; return st.layers[i]; };
    function mergeList(list, label) {
        const S = os.paintHist, LY = os.paintLayers;
        list = list.filter(l => st.layers.includes(l)).sort((a, b) => st.layers.indexOf(a) - st.layers.indexOf(b));
        if (list.length < 2) return;
        let low = list[0], li = st.layers.indexOf(low);
        let bases = new Map(); list.slice(1).forEach(l => { if (l.clip) { let b = baseOf(l); if (b && !bases.has(b)) { let c = newCv(); c.getContext('2d').drawImage(b.c, 0, 0); bases.set(b, c); } } });
        LY.setActive(li); S.begin(true); S.raw = true;
        let x = low.x, cut = newCv(), cx = cut.getContext('2d');
        x.save(); x.setTransform(1, 0, 0, 1, 0, 0);
        list.slice(1).forEach(up => {
            if (!up.vis) return;
            let src = up.c, b = up.clip && baseOf(up);
            if (b && b !== up) { cx.globalCompositeOperation = 'copy'; cx.drawImage(up.c, 0, 0); cx.globalCompositeOperation = 'destination-in'; cx.drawImage(bases.get(b) || b.c, 0, 0); cx.globalCompositeOperation = 'source-over'; src = cut; }
            x.globalAlpha = up.op; x.globalCompositeOperation = up.blend; x.drawImage(src, 0, 0);
        });
        x.restore();
        S.end('merge'); S.raw = false; let px = st.undo.pop();
        let gone = list.slice(1), keepClip = low.clip;
        let s2 = S.struct(label, () => { st.layers = st.layers.filter(l => !gone.includes(l)); LY.setActive(st.layers.indexOf(low)); });
        S.push({ k: 'multi', items: [px, s2], label });
        st.picked = []; low.clip = keepClip;
        side(); os.requestPaintRender();
    }
    function mergeVisible() {
        const S = os.paintHist, LY = os.paintLayers;
        let vis = st.layers.filter(l => l.vis);
        if (vis.length < 2) { status('見えてるのが1枚だけ // only one layer showing'); return; }
        let low = vis[0], flat = newCv();
        os.paintCompose(flat.getContext('2d'), false, vis);
        LY.setActive(st.layers.indexOf(low)); S.begin(true); S.raw = true;
        low.x.save(); low.x.setTransform(1, 0, 0, 1, 0, 0); low.x.globalAlpha = 1; low.x.globalCompositeOperation = 'copy'; low.x.drawImage(flat, 0, 0); low.x.restore();
        S.end('merge'); S.raw = false; let px = st.undo.pop();
        let was = { op: low.op, blend: low.blend, clip: low.clip, g: low.g || null }, gone = vis.slice(1);
        let props = { k: 'fn', b: () => Object.assign(low, was), a: () => Object.assign(low, { op: 1, blend: 'source-over', clip: false, g: null }) };
        props.a();
        let s2 = S.struct('⧈ 表示レイヤー結合 // MERGE VISIBLE', () => { st.layers = st.layers.filter(l => !gone.includes(l)); LY.setActive(st.layers.indexOf(low)); });
        S.push({ k: 'multi', items: [px, props, s2], label: '⧈ 表示レイヤー結合 // MERGE VISIBLE' });
        st.picked = []; side(); os.requestPaintRender();
    }
    function clearSel() {
        if (!st.sel) return;
        let s = st.sel, H = os.paintHist;
        H.begin(false); H.grow(s.x, s.y, 0); H.grow(s.x + s.w, s.y + s.h, 0);
        st.artCtx.clearRect(s.x, s.y, s.w, s.h);
        H.end('✂ 消去 // CLEAR');
        os.requestPaintRender();
    }

    function stamp() { let d = new Date(), p = n => String(n).padStart(2, '0'); return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '_' + p(d.getHours()) + p(d.getMinutes()); }
    function flatten() {
        let c = document.createElement('canvas'); c.width = st.W; c.height = st.H;
        let x = c.getContext('2d');
        if (st.paper) { x.fillStyle = st.bgColor; x.fillRect(0, 0, st.W, st.H); }
        os.paintCompose(x, false);
        return c;
    }
    function save() {
        if (os.paintXform && os.paintXform.on()) os.paintXform.commit();
        let c = flatten();
        c.toBlob(b => {
            if (!b) return;
            let a = document.createElement('a');
            a.href = URL.createObjectURL(b);
            a.download = 'vampii.os_' + stamp() + '.png';
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(a.href), 4000);
            status('保存した // saved ' + a.download);
        }, 'image/png');
    }
    function openImg(file) {
        if (!file || !/^image\//.test(file.type)) return;
        if (st.layers.length >= 24) { status('レイヤーがいっぱい // too many layers (24)'); return; }
        createImageBitmap(file).then(bmp => {
            let LY = os.paintLayers, S = os.paintHist;
            S.push(S.struct('開く // OPEN ' + file.name.slice(0, 18), () => {
                let n = LY.newLayer(file.name.replace(/\.[^.]+$/, '').slice(0, 24));
                let k = Math.min(1, st.W / bmp.width, st.H / bmp.height), w = bmp.width * k, h = bmp.height * k;
                n.x.drawImage(bmp, (st.W - w) / 2, (st.H - h) / 2, w, h);
                st.layers.splice(st.active + 1, 0, n); LY.setActive(st.active + 1);
            }));
            os.requestPaintRender();
            if (os.paintXform) setTimeout(() => { if (os.paintXformWire) os.paintXformWire(); os.paintXform.start(); }, 60);
            else status('開いた // opened as a new layer');
        }).catch(() => status('読めなかった // couldnt read that one'));
    }
    let newArm = 0;
    function newDoc(w, h) {
        if (Date.now() - newArm > 2600) { newArm = Date.now(); status('もう一回押すと、全部消える // press again to wipe everything (no undo for this one)'); return; }
        newArm = 0;
        st.fit = !w;
        os.paintLayers.freshDoc(w || st.W, h || st.H);
        res(); side(); os.resetPaintView(); os.paintChanged();
        status('白紙 // fresh paper');
    }
    function newMenu() {
        let m = $('pt-newmenu'); if (!m) return;
        if (!m.hidden) { m.hidden = true; return; }
        let paper = os.paintOwned('paper');
        m.innerHTML = SIZES.filter(s => !s[3] || paper).map(s => `<button type="button" data-w="${s[0]}" data-h="${s[1]}">${esc(s[2])}</button>`).join('') + (paper ? '' : '<p>紙のサイズは、ここにはこれだけ。// thats the only size here.</p>');
        m.hidden = false;
        m.querySelectorAll('button').forEach(b => b.onclick = () => { newDoc(+b.dataset.w || 0, +b.dataset.h || 0); if (!newArm) m.hidden = true; });
    }
    function fxMenu() {
        let m = $('pt-fxmenu'); if (!m) return;
        if (!m.hidden) { m.hidden = true; return; }
        m.innerHTML = [['adjust', '調整 // ADJUST…'], ['gblur', 'ぼかし // BLUR…'], ['motion', 'モーションぼかし // MOTION BLUR…'], ['persp', 'パースぼかし // PERSPECTIVE BLUR…'], ['bloom', '発光 // BLOOM'], ['vhs', 'VHS'], ['onebit', '1-BIT (C1 + C2)'], ['chroma', '色ずれ // CHROMA'], ['invert', '反転 // INVERT'], ['poster', 'ポスタリゼーション // POSTERIZE']].filter(f => os.paintPro || !['adjust', 'poster', 'gblur', 'motion', 'persp'].includes(f[0])).map(f => `<button type="button" data-fx="${f[0]}">${f[1]}</button>`).join('') + '<p>選択中ならその中だけ // only inside the selection if theres one</p>';
        m.hidden = false;
        m.querySelectorAll('button').forEach(b => b.onclick = () => { click(); m.hidden = true; let k = b.dataset.fx; if (k === 'adjust' || k === 'motion' || k === 'persp') { os.paintPro.filter(k); return; } if (k === 'gblur') { os.paintPro.gblur(); return; } if (k === 'poster') { os.paintPro.poster(); status('FX: ' + b.textContent); return; } os.paintTools.fxRun(k); status('FX: ' + b.textContent); });
    }

    // filters in the side panel too. two taps was one too many
    const FXS = [['adjust', '調整', 'adjust'], ['gblur', 'ぼかし', 'blur'], ['motion', '移動', 'motion'], ['persp', '放射', 'persp'], ['bloom', '発光', 'bloom'], ['chroma', '色ずれ', 'chroma'], ['poster', '階調', 'poster'], ['invert', '反転', 'invert']];
    function fxSide() {
        let sd = document.querySelector('#win-paint\\.exe .pt-side'); if (!sd || sd.querySelector('.pt-fxs')) return;
        let h = sd.querySelector('#pt-hist'); if (!h) return;
        let head = document.createElement('h4'); head.textContent = 'フィルター // FILTERS';
        let g = document.createElement('div'); g.className = 'pt-fxs';
        g.innerHTML = FXS.map(f => `<button type="button" class="pt-mini" data-sfx="${f[0]}"><b lang="ja">${f[1]}</b><small>${f[2]}</small></button>`).join('');
        let hh = h.previousElementSibling; sd.insertBefore(head, hh); sd.insertBefore(g, hh);
        g.querySelectorAll('[data-sfx]').forEach(b => b.onclick = () => {
            click(); let k = b.dataset.sfx;
            if (!os.paintPro && ['adjust', 'gblur', 'motion', 'persp', 'poster'].includes(k)) return;
            if (k === 'adjust' || k === 'motion' || k === 'persp') return os.paintPro.filter(k);
            if (k === 'gblur') return os.paintPro.gblur();
            if (k === 'poster') { os.paintPro.poster(); status('FX: ' + b.textContent); return; }
            os.paintTools.fxRun(k); status('FX: ' + b.querySelector('b').textContent);
        });
    }
    function build() {
        let rail = $('pt-rail');
        if (!rail) return;
        rail.innerHTML = '<div class="pt-h">筆 // BRUSHES</div><div class="pt-tools">' + MINE.concat(MORE).map(x => chip(x[0], x[1])).join('') + '</div><div class="pt-h">形 // SHAPES</div><div class="pt-tools">' + SHAPE.map(x => chip(x[0], x[1])).join('') + '</div><div class="pt-tbox pt-sunk" id="pt-tbox"><i></i><b></b></div>';
        rail.querySelectorAll('.pt-tool').forEach(b => { b.onclick = () => { click(); os.setPaintTool(b.dataset.tool, b); }; });
        if (os.paintUnderRow) os.paintUnderRow();
        opts();
        res();
        wireSide();
        side();
        fxSide();
        const st2 = st;
        $('paint-c1').value = st2.color1; $('paint-c2').value = st2.color2; $('paint-bg').value = st2.bgColor;
        $('paint-size').value = st2.size; $('paint-opacity').value = st2.opacity;
        $('paint-c1').oninput = (e) => { st2.color1 = e.target.value; tbox(); };
        $('paint-c2').oninput = (e) => { st2.color2 = e.target.value; };
        $('paint-bg').oninput = (e) => { st2.bgColor = e.target.value; side(); os.requestPaintRender(); };
        $('paint-bg').onchange = () => os.paintChanged();
        $('paint-size').oninput = (e) => { st2.size = parseFloat(e.target.value); tbox(); os.requestPaintRender(); };
        $('paint-opacity').oninput = (e) => { st2.opacity = parseFloat(e.target.value); };
        $('pt-smooth').value = st2.smooth; $('pt-smooth').oninput = (e) => { st2.smooth = parseFloat(e.target.value); };
        $('pt-pres').checked = st2.usePressure; $('pt-pres').onchange = (e) => { st2.usePressure = e.target.checked; };
        $('pt-swap').onclick = () => { click(); let a = st2.color1; os.setPaintColor(st2.color2, a); };
        $('pt-undo').onclick = () => { click(); os.paintUndo(); };
        $('pt-redo').onclick = () => { click(); os.paintRedo(); };
        $('pt-crt').onclick = () => { click(); st2.crt = !st2.crt; bar(); };
        $('pt-new').onclick = () => { click(); newMenu(); };
        $('pt-open').onclick = () => { click(); $('pt-file').click(); };
        $('pt-file').onchange = (e) => { let f = e.target.files[0]; if (f && /\.vpaint$/i.test(f.name) && os.paintPro) os.paintPro.openProject(f); else openImg(f); e.target.value = ''; };
        $('pt-save').onclick = () => { click(); if (os.paintPro) os.paintPro.exportMenu(); else save(); };
        $('pt-print').onclick = () => { click(); if (os.paintPro && os.paintPro.print) os.paintPro.print(); };
        $('pt-fxbtn').onclick = () => { click(); fxMenu(); };
        $('pt-sidebtn').onclick = () => { click(); document.querySelector('#win-paint\\.exe .paint-app-wrap').classList.toggle('pt-side-open'); };
        if (st2.showGrid) { let g = document.querySelector('#win-paint\\.exe [data-grid]'); if (g) { st2.showGrid = false; os.togglePaintGrid(g); } }
        let wrap = document.querySelector('#win-paint\\.exe .paint-app-wrap');
        if (wrap && window.ResizeObserver && !wrap._ro) { wrap._ro = new ResizeObserver(() => wrap.classList.toggle('pt-narrow', wrap.clientWidth < 760)); wrap._ro.observe(wrap); }
        if (wrap) wrap.classList.toggle('pt-narrow', wrap.clientWidth < 760);
        let mb = wrap && wrap.querySelector('.pt-bar');
        if (mb && !mb._drop) {
            mb._drop = 1;
            let at = 0;
            mb.addEventListener('click', e => { let b = e.target.closest('button'); if (b && b.parentNode === mb) at = b.offsetLeft; }, true);
            new MutationObserver(ms => ms.forEach(m => { let p = m.target; if (p.classList.contains('pt-pop') && !p.hidden) mb.querySelectorAll('.pt-pop').forEach(o => { if (o !== p) o.hidden = true; }), p.style.left = Math.max(2, Math.min(at, mb.clientWidth - p.offsetWidth - 2)) + 'px'; }))
                .observe(mb, { attributes: true, attributeFilter: ['hidden'], subtree: true });
        }
    }
    os.paintUI = { build, side, opts, status, label, save, clearSel, res, open: openImg, stamp, tbox, pick, mergeList, mergeVisible, makeFolder, folderOps, folder, fixG };
})();

const injectPaintApp = () => {
    // Why did I make this ? I dunno, people can doodle penises when listening to my music when I make it?!
    const template = document.createElement('template');
    template.id = 'paint.exe';
    
    const colors = ['#ff0099', '#00f0ff', '#ffe600', '#00ff66', '#bd00ff', '#ff003c', '#ff5500', '#0044ff', '#ff00ff', '#ffffff', '#050104', '#1a1a2e', '#2d0019', '#001a00'];
    let swatchesHTML = '';
    colors.forEach((c, i) => {
        let altC = colors[(i + 1) % colors.length];
        swatchesHTML += `<div class="pt-sw" onclick="os.setPaintColor('${c}', '${altC}')" style="background: ${c};" title="${c}"></div>`;
    });

    template.innerHTML = `
        <style>
            #desktop > #win-paint\\.exe, #desktop > #win-paint\\.exe * { cursor: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAcCAYAAABsxO8nAAAAlklEQVR42sXVwQ2AIAwF0K9xCAyccCudT7eSk0S2wFONckGF1p4gIfBoG4BWNmplIwqjRaU4NyqVVRN1NNj2FQBg+iECgA+u+VdUKuMTfZXxi97K5ERPZfKinExOZPoht2TkFZGAckHhg5tEOrtJX0U6WSs7J1WCbGfncpBWCcDCI7rc+XaSD265drDYC/nmpxiTOU+ODvdSTK26OHq4AAAAAElFTkSuQmCC) 0 0, default; }
            #desktop > #win-paint\\.exe { --p9-face: color-mix(in srgb, var(--neon-primary) 7%, #d9d6df); --p9-face2: #fdfcff; --p9-hi: #ffffff; --p9-hi2: color-mix(in srgb, var(--neon-primary) 4%, #eceaf0); --p9-lo: #2b2833; --p9-lo2: #8d8998; --p9-ink: #1b1822; --p9-acc: color-mix(in srgb, var(--neon-primary) 55%, #1b1822); --p9-trim: var(--neon-primary);
                color-scheme: light;
                border: 0 !important; border-radius: 0 !important; background: var(--p9-face) !important;
                box-shadow: inset 1px 1px 0 var(--p9-hi2), inset -1px -1px 0 var(--p9-lo), inset 2px 2px 0 var(--p9-hi), inset -2px -2px 0 var(--p9-lo2), 0 3px 0 var(--p9-trim), 0 22px 44px rgba(0, 0, 0, 0.6) !important; }
            #desktop > #win-paint\\.exe::before, #desktop > #win-paint\\.exe::after { display: none !important; }
            #desktop > #win-paint\\.exe .window-header { margin: 3px 3px 0; padding: 4px 4px 4px 8px !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important;
                background: linear-gradient(90deg, #8d8998, #b8b4c1) !important; }
            #desktop > #win-paint\\.exe.is-active .window-header { background: linear-gradient(90deg, color-mix(in srgb, var(--neon-primary) 62%, #1b1430), color-mix(in srgb, var(--neon-secondary) 55%, #4b4560) 85%) !important; }
            #desktop > #win-paint\\.exe .window-header::before, #desktop > #win-paint\\.exe .window-header::after { display: none !important; }
            #desktop > #win-paint\\.exe .window-header > span:first-child { font: 13px 'DotGothic16', monospace !important; letter-spacing: 1px !important; color: #fff !important; text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.6) !important; opacity: 0.75; }
            #desktop > #win-paint\\.exe.is-active .window-header > span:first-child { opacity: 1; }
            #desktop > #win-paint\\.exe .window-header > span:first-child::before { display: none; }
            #desktop > #win-paint\\.exe .win-btns { gap: 2px; }
            #desktop > #win-paint\\.exe .win-btn, #desktop > #win-paint\\.exe .kill-btn { width: 20px !important; height: 18px !important; border: 0 !important; border-radius: 0 !important; background: var(--p9-face) !important;
                box-shadow: inset 1px 1px 0 var(--p9-hi), inset -1px -1px 0 var(--p9-lo), inset 2px 2px 0 var(--p9-hi2), inset -2px -2px 0 var(--p9-lo2) !important; }
            #desktop > #win-paint\\.exe .kill-btn { margin-left: 2px; }
            #desktop > #win-paint\\.exe .win-btn::before, #desktop > #win-paint\\.exe .kill-btn::before { --gw: 9px; color: var(--p9-ink) !important; opacity: 1 !important; }
            #desktop > #win-paint\\.exe .min-btn { --gl: var(--gl-98-min); } #desktop > #win-paint\\.exe .max-btn { --gl: var(--gl-98-max); } #desktop > #win-paint\\.exe .kill-btn { --gl: var(--gl-98-x); }
            #desktop > #win-paint\\.exe .win-btn:hover, #desktop > #win-paint\\.exe .kill-btn:hover { background: color-mix(in srgb, var(--neon-primary) 25%, var(--p9-face)) !important; }
            #desktop > #win-paint\\.exe .kill-btn:hover { background: #b3203c !important; }
            #desktop > #win-paint\\.exe .win-btn:active, #desktop > #win-paint\\.exe .kill-btn:active { transform: none; box-shadow: inset 1px 1px 0 var(--p9-lo), inset -1px -1px 0 var(--p9-hi), inset 2px 2px 0 var(--p9-lo2) !important; }
            #desktop > #win-paint\\.exe .window-body { padding: 0 3px 3px !important; background: none !important; box-shadow: none !important; }
            #win-paint\\.exe .file-path { display: none; }

            .paint-app-wrap { display: flex; flex-direction: column; gap: 0; height: 100%; color: var(--p9-ink); font: 12px 'DotGothic16', monospace; }
            .paint-app-wrap button, .paint-app-wrap select, .paint-app-wrap input { font-family: inherit; }
            .crt-overlay {
                pointer-events: none;
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.22) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.04), rgba(0, 255, 0, 0.015), rgba(0, 0, 255, 0.04));
                background-size: 100% 4px, 3px 100%;
                z-index: 5;
                box-shadow: inset 0 0 70px rgba(0,0,0,0.8);
            }
            /* the 3d border every 98 button had */
            .pt-b98, .pt-tool, .pt-mini, .pt-bar button { border: 0; border-radius: 0; background: var(--p9-face); color: var(--p9-ink); cursor: inherit;
                box-shadow: inset 1px 1px 0 var(--p9-hi), inset -1px -1px 0 var(--p9-lo), inset 2px 2px 0 var(--p9-hi2), inset -2px -2px 0 var(--p9-lo2); }
            .pt-tool:active, .pt-mini:active, .pt-bar button:active, .pt-tool.active, .pt-bar button.active, .pt-mini.on {
                box-shadow: inset 1px 1px 0 var(--p9-lo), inset -1px -1px 0 var(--p9-hi), inset 2px 2px 0 var(--p9-lo2), inset -2px -2px 0 var(--p9-hi2); }
            .pt-sunk { background: var(--p9-face2); box-shadow: inset 1px 1px 0 var(--p9-lo2), inset -1px -1px 0 var(--p9-hi), inset 2px 2px 0 var(--p9-lo), inset -2px -2px 0 var(--p9-hi2); }
            .pt-groove { width: 2px; align-self: stretch; margin: 2px 3px; background: linear-gradient(90deg, var(--p9-lo) 50%, var(--p9-hi) 50%); flex: 0 0 auto; }

            .pt-bar { order: 0; display: flex; flex-wrap: wrap; gap: 2px; align-items: center; padding: 3px 2px; position: relative; border-bottom: 1px solid var(--p9-lo); box-shadow: 0 1px 0 var(--p9-hi2); }
            .pt-bar button { box-shadow: none; background: none; padding: 3px 7px; font-size: 12px; letter-spacing: 0.5px; white-space: nowrap; }
            .pt-bar button:hover { box-shadow: inset 1px 1px 0 var(--p9-hi), inset -1px -1px 0 var(--p9-lo); }
            .pt-bar button.active { background: repeating-conic-gradient(color-mix(in srgb, var(--neon-primary) 22%, var(--p9-face2)) 0 25%, var(--p9-face2) 0 50%) 0 0 / 2px 2px; color: var(--p9-ink); }
            .pt-bar button:disabled { opacity: 0.35; pointer-events: none; }
            #pt-fxbtn { color: #8a5a00; }
            .pt-bar .pt-purge { color: #b51c3a; }
            .pt-opts { order: 1; display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: center; padding: 5px 6px; border-bottom: 1px solid var(--p9-lo); box-shadow: 0 1px 0 var(--p9-hi2); font-size: 11px; }
            .pt-opts label { display: inline-flex; align-items: center; gap: 5px; cursor: inherit; white-space: nowrap; color: var(--p9-acc); }
            .paint-app-wrap input[type=range] { -webkit-appearance: none; appearance: none; width: 74px; height: 16px; background: none; cursor: inherit; }
            .paint-app-wrap input[type=range]::-webkit-slider-runnable-track { height: 4px; background: var(--p9-face2); box-shadow: inset 1px 1px 0 var(--p9-lo), inset -1px -1px 0 var(--p9-hi); }
            .paint-app-wrap input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 10px; height: 16px; margin-top: -6px; background: var(--p9-face); border-bottom: 2px solid var(--p9-trim); box-shadow: inset 1px 1px 0 var(--p9-hi), inset -1px -1px 0 var(--p9-lo), 0 1px 0 var(--p9-lo2); }
            .paint-app-wrap input[type=range]::-moz-range-track { height: 4px; background: var(--p9-face2); }
            .paint-app-wrap input[type=range]::-moz-range-thumb { width: 10px; height: 16px; border: 0; border-radius: 0; background: var(--p9-face); border-bottom: 2px solid var(--p9-trim); }
            .paint-app-wrap input[type=checkbox] { -webkit-appearance: none; appearance: none; width: 13px; height: 13px; margin: 0; background: var(--p9-face2); box-shadow: inset 1px 1px 0 var(--p9-lo), inset -1px -1px 0 var(--p9-hi); display: inline-grid; place-content: center; cursor: inherit; }
            .paint-app-wrap input[type=checkbox]:checked::before { content: ''; width: 7px; height: 7px; background: var(--p9-acc); }
            .pt-mini { padding: 2px 7px; font-size: 12px; }
            .pt-mini:hover { color: var(--p9-acc); }
            .pt-sel { background: var(--p9-face2); color: var(--p9-ink); border: 0; border-radius: 0; font-size: 11px; padding: 2px 4px; box-shadow: inset 1px 1px 0 var(--p9-lo), inset -1px -1px 0 var(--p9-hi); }
            .pt-lab { color: var(--p9-acc); }
            #pt-ctx { display: contents; }

            .pt-main { order: 2; flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: auto minmax(0, 1fr) 200px; gap: 4px; padding: 4px 0; }
            .paint-app-wrap [hidden] { display: none !important; }
            .pt-rail { display: flex; flex-direction: column; gap: 4px; overflow-y: auto; overflow-x: hidden; min-height: 0; padding: 2px 2px 4px; width: 82px; scrollbar-width: none; }
            .pt-tools { display: grid; grid-template-columns: repeat(2, 38px); gap: 2px; }
            .pt-tool { width: 38px; height: 36px; padding: 0; display: grid; place-items: center; }
            .pt-tool:hover { background: color-mix(in srgb, var(--neon-primary) 10%, var(--p9-face)); }
            .pt-tool.active { background: repeating-conic-gradient(color-mix(in srgb, var(--neon-primary) 30%, var(--p9-face2)) 0 25%, var(--p9-face2) 0 50%) 0 0 / 2px 2px; }
            .pt-ti { display: block; width: 32px; height: 32px; background: no-repeat center / 32px 32px; image-rendering: pixelated; pointer-events: none; }
            .pt-tool.active .pt-ti { transform: translate(1px, 1px); }
            .pt-h { font-size: 10px; line-height: 1.25; color: var(--p9-acc); opacity: 0.9; margin: 4px 1px 0; }
            .pt-h:first-child { margin-top: 0; }
            .pt-tbox { margin-top: 2px; padding: 6px 4px; display: flex; flex-direction: column; align-items: center; gap: 5px; text-align: center; }
            .pt-tbox b { font-weight: normal; font-size: 10px; line-height: 1.3; color: var(--p9-ink); overflow-wrap: anywhere; }
            .pt-tbox i { display: block; width: 46px; height: 46px; background: radial-gradient(circle, var(--pt-c1, #fff) calc(var(--pt-sz, 6px) / 2), transparent calc(var(--pt-sz, 6px) / 2 + 1px)); }
            .pt-stage { position: relative; min-height: 0; overflow: hidden; background: #9d99a8; }
            .pt-stage::after { content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 6; box-shadow: inset 1px 1px 0 var(--p9-lo2), inset -1px -1px 0 var(--p9-hi), inset 2px 2px 0 var(--p9-lo), inset -2px -2px 0 var(--p9-hi2); }
            .pt-side { display: flex; flex-direction: column; gap: 6px; min-height: 0; overflow-y: auto; padding: 2px 2px 4px; font-size: 11px; scrollbar-width: thin; }
            .pt-side h4 { margin: 4px 0 0; font-size: 11px; letter-spacing: 1px; font-weight: normal; color: #fff; padding: 2px 6px; background: linear-gradient(90deg, color-mix(in srgb, var(--neon-primary) 62%, #1b1430), color-mix(in srgb, var(--neon-primary) 20%, var(--p9-face))); }
            .pt-side h4:first-child { margin-top: 0; }
            .pt-fxs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; }
            .pt-fxs .pt-mini { display: flex; flex-direction: column; align-items: center; gap: 0; padding: 4px 2px 3px; min-width: 0; line-height: 1.15; }
            .pt-fxs b { font-weight: normal; font-size: 11px; }
            .pt-fxs small { font-size: 8px; opacity: 0.6; letter-spacing: 0.5px; }
            #pt-layers { display: flex; flex-direction: column; gap: 0; max-height: 210px; overflow-y: auto; padding: 2px; }
            .pt-lay { flex: 0 0 auto; display: flex; align-items: center; gap: 6px; padding: 3px 5px; border: 0; cursor: inherit; }
            .pt-lay:hover { background: rgba(0, 0, 0, 0.05); }
            .pt-lay.on { background: color-mix(in srgb, var(--neon-primary) 62%, #1b1430); color: #fff; }
            .pt-lay.infold { padding-left: 16px; } .pt-lay.shut { display: none; }
            .pt-fold .pt-lname { font-weight: bold; } .pt-ftog { border: 0; background: none; padding: 0 2px; font: inherit; color: inherit; cursor: inherit; } .pt-fmeta { margin-left: auto; opacity: 0.6; font-size: 10px; }
            .pt-paper { opacity: 0.8; cursor: default; } .pt-paper i { width: 14px; height: 14px; margin-left: auto; box-shadow: inset 1px 1px 0 var(--p9-lo), inset -1px -1px 0 var(--p9-hi); }
            .pt-lname { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .pt-eye { background: none; border: 0; color: var(--p9-acc); font-size: 13px; padding: 0 2px; cursor: inherit; line-height: 1; }
            .pt-eye.off { opacity: 0.4; }
            .pt-rename { width: 100%; font-size: 11px; background: #fff; color: var(--p9-ink); border: 0; box-shadow: inset 1px 1px 0 var(--p9-lo), inset -1px -1px 0 var(--p9-hi); }
            .pt-lctl { display: flex; flex-wrap: wrap; gap: 2px; }
            .pt-lctl button { flex: 1 0 auto; }
            .pt-lctl button:disabled { opacity: 0.3; pointer-events: none; }
            .pt-row { display: flex; align-items: center; gap: 6px; } .pt-row input[type=range] { flex: 1; } .pt-row select { flex: 1; min-width: 0; }
            #pt-hist { display: flex; flex-direction: column; gap: 0; flex: 1 1 auto; min-height: 120px; overflow-y: auto; font-size: 11px; padding: 2px; }
            .pt-hrow { flex: 0 0 auto; padding: 2px 6px; cursor: inherit; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .pt-hrow:hover { background: rgba(0, 0, 0, 0.05); }
            .pt-hrow.on:first-of-type { color: var(--p9-ink); background: color-mix(in srgb, var(--neon-primary) 18%, transparent); } .pt-hrow.off { opacity: 0.35; text-decoration: line-through; } .pt-hrow.base { opacity: 0.5; }

            .pt-deck { order: 3; display: flex; gap: 6px; align-items: center; padding: 4px 4px 5px; border-top: 1px solid var(--p9-hi2); overflow-x: auto; scrollbar-width: none; }
            .pt-cbox { position: relative; flex: 0 0 auto; width: 46px; height: 42px; }
            .pt-cbox input[type=color], .pt-bgbox input[type=color] { -webkit-appearance: none; appearance: none; position: absolute; width: 26px; height: 24px; padding: 0; border: 0; cursor: inherit; background: none;
                box-shadow: inset 1px 1px 0 var(--p9-hi), inset -1px -1px 0 var(--p9-lo), 1px 1px 0 var(--p9-lo), 0 0 0 1px rgba(0, 0, 0, 0.5); }
            .pt-cbox input::-webkit-color-swatch-wrapper, .pt-bgbox input::-webkit-color-swatch-wrapper { padding: 2px; }
            .pt-cbox input::-webkit-color-swatch, .pt-bgbox input::-webkit-color-swatch { border: 0; border-radius: 0; }
            .pt-cbox input::-moz-color-swatch, .pt-bgbox input::-moz-color-swatch { border: 0; border-radius: 0; }
            #paint-c1 { left: 0; top: 0; z-index: 2; }
            #paint-c2 { right: 0; bottom: 0; z-index: 1; }
            #pt-swap { position: absolute; right: 0; top: 0; width: 15px; height: 14px; padding: 0; font-size: 10px; line-height: 14px; z-index: 3; }
            .pt-bgbox { position: relative; flex: 0 0 auto; width: 26px; height: 42px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; font-size: 9px; color: var(--p9-acc); }
            .pt-bgbox input[type=color] { position: static; width: 22px; height: 22px; }
            .pt-bgbox span { order: -1; margin-bottom: 2px; }
            .pt-pal { display: grid; grid-template-rows: repeat(2, 19px); grid-auto-flow: column; grid-auto-columns: 19px; gap: 2px; padding: 3px; flex: 0 0 auto; }
            .pt-sw { width: 19px; height: 19px; border: 0; cursor: inherit; border-radius: 0; box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.25), inset -1px -1px 0 rgba(0, 0, 0, 0.55); }
            .pt-sw:hover { outline: 1px solid #000; outline-offset: 0; z-index: 1; }
            .pt-dk { font-size: 9px; letter-spacing: 1px; color: var(--p9-acc); opacity: 0.7; writing-mode: vertical-rl; transform: rotate(180deg); flex: 0 0 auto; }

            .pt-top { order: 4; display: flex; gap: 2px; align-items: stretch; font-size: 11px; color: var(--p9-ink); padding-top: 2px; }
            .pt-top > span { padding: 2px 7px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; box-shadow: inset 1px 1px 0 var(--p9-lo2), inset -1px -1px 0 var(--p9-hi2); }
            .pt-top > span:first-child { flex: 1 1 auto; min-width: 0; color: var(--p9-acc); }
            #pt-status { flex: 0 1 46ch; opacity: 0.5; transition: opacity 0.3s; }
            #pt-status.on { opacity: 1; color: var(--p9-ink); }
            #paint-zoom-label { flex: 0 0 auto; }

            .pt-pop { position: absolute; top: calc(100% + 1px); z-index: 20; display: flex; flex-direction: column; gap: 0; padding: 3px; min-width: 200px; background: var(--p9-face);
                box-shadow: inset 1px 1px 0 var(--p9-hi), inset -1px -1px 0 var(--p9-lo), inset 2px 2px 0 var(--p9-hi2), inset -2px -2px 0 var(--p9-lo2), 3px 4px 0 rgba(0, 0, 0, 0.55); }
            .pt-pop button { text-align: left; background: none; border: 0; box-shadow: none !important; color: var(--p9-ink); font-size: 12px; padding: 4px 18px 4px 10px; cursor: inherit; }
            .pt-pop button:hover { background: color-mix(in srgb, var(--neon-primary) 62%, #1b1430); color: #fff; }
            .pt-pop p { margin: 4px 6px 2px; font-size: 10px; opacity: 0.6; }
            .pt-sidebtn { display: none !important; }
            .pt-narrow .pt-main { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr); position: relative; }
            .pt-narrow .pt-rail { flex-direction: row; width: auto; overflow-x: auto; overflow-y: hidden; }
            .pt-narrow .pt-tools { grid-template-columns: none; grid-auto-flow: column; }
            .pt-narrow .pt-h, .pt-narrow .pt-tbox { display: none; }
            .pt-narrow .pt-side { display: none; }
            .pt-narrow.pt-side-open .pt-side { display: flex; position: absolute; right: 4px; top: 48px; bottom: 4px; width: min(220px, 70%); z-index: 12; background: var(--p9-face); box-shadow: inset 1px 1px 0 var(--p9-hi), inset -1px -1px 0 var(--p9-lo), 3px 4px 0 rgba(0, 0, 0, 0.55); }
            .pt-narrow .pt-sidebtn { display: inline-block !important; }
            .pt-narrow .pt-opts { flex-wrap: nowrap; overflow-x: auto; }
            .pt-narrow .pt-top > span:first-child, .pt-narrow #pt-status { display: none; }

            /* paint gets to be the one light program */
            #win-paint\\.exe .pt-panelpop { color: var(--p9-ink); }
            #win-paint\\.exe .pt-mini.on { color: #fff; background: color-mix(in srgb, var(--neon-primary) 62%, #1b1430); }
            #win-paint\\.exe .pt-lay.picked:not(.on) { background: color-mix(in srgb, var(--neon-secondary) 26%, var(--p9-face)); box-shadow: inset 3px 0 0 var(--neon-secondary); }
            #win-paint\\.exe .pt-lay .pt-thumb { box-shadow: 0 0 0 1px var(--p9-lo2); background: repeating-conic-gradient(#fff 0 25%, #d6d3dd 0 50%) 0 0 / 8px 8px; }
            #win-paint\\.exe .pt-lf { color: var(--p9-ink); } #win-paint\\.exe .pt-lf.on { color: var(--p9-acc); text-shadow: none; }
            #win-paint\\.exe .pt-bi { display: block; width: 16px; height: 16px; background: no-repeat center / 16px 16px; image-rendering: pixelated; pointer-events: none; flex: none; }
            #win-paint\\.exe .pt-bar .pt-ib { display: inline-flex !important; align-items: center; justify-content: center; gap: 2px; min-width: 30px; height: 28px; padding: 0 6px !important; }
            #win-paint\\.exe .pt-ib .pt-dd { font-size: 8px; font-weight: normal; line-height: 1; }
            #win-paint\\.exe .pt-ib:disabled .pt-bi { opacity: 0.3; filter: grayscale(1); }
            #win-paint\\.exe .pt-lctl .pt-ib { display: inline-flex; align-items: center; justify-content: center; padding: 3px 0 !important; }
            #win-paint\\.exe .pt-lf { display: inline-grid; place-items: center; padding: 1px !important; }
            #win-paint\\.exe .pt-lf:not(.on) .pt-bi { opacity: 0.28; filter: grayscale(1); }
            #win-paint\\.exe .pt-lf:disabled .pt-bi { opacity: 0.1; }
            #win-paint\\.exe .pt-eye { display: inline-grid; place-items: center; padding: 0 1px; }
            #win-paint\\.exe .pt-eye.off .pt-bi { opacity: 0.6; }
            #win-paint\\.exe .pt-fic { margin-right: 2px; }
            #win-paint\\.exe .pt-bgrow { border-top-color: var(--p9-lo2) !important; }
            #win-paint\\.exe .pt-bgsw { border-radius: 0 !important; border: 0 !important; box-shadow: inset 1px 1px 0 var(--p9-lo), inset -1px -1px 0 var(--p9-hi), 0 0 0 1px var(--p9-lo2) !important; }
            #win-paint\\.exe .pt-bh, #win-paint\\.exe .pt-bh2, #win-paint\\.exe .pt-rl { color: var(--p9-acc); }
            #win-paint\\.exe #pt-xbar { border-radius: 0; background: var(--p9-face); color: var(--p9-ink); border: 0; box-shadow: inset 1px 1px 0 var(--p9-hi), inset -1px -1px 0 var(--p9-lo), inset 2px 2px 0 var(--p9-hi2), inset -2px -2px 0 var(--p9-lo2), 3px 4px 0 rgba(0, 0, 0, 0.35); }
            #win-paint\\.exe #pt-xbar span { color: var(--p9-acc); }
            #win-paint\\.exe #pt-xbar button { border-radius: 0; border: 0; background: var(--p9-face); color: var(--p9-ink); font-family: inherit; box-shadow: inset 1px 1px 0 var(--p9-hi), inset -1px -1px 0 var(--p9-lo), inset -2px -2px 0 var(--p9-lo2); }
            #win-paint\\.exe #pt-xbar button:hover, #win-paint\\.exe #pt-xbar button.ok { background: color-mix(in srgb, var(--neon-primary) 62%, #1b1430); color: #fff; }
            .paint-app-wrap ::selection { background: var(--neon-primary); color: #fff; }
            .paint-app-wrap * { scrollbar-color: var(--p9-lo2) var(--p9-face2); }
        </style>
        <div class="paint-app-wrap">
            <div class="pt-top">
                <span>ヘルプは ? のボタン // for help, hit the ?</span>
                <span id="pt-status"></span>
                <span id="paint-coords">X: --- Y: ---</span>
                <span id="pt-res">RES: 1920x1080</span>
                <span id="paint-zoom-label">MAG: 100%</span>
            </div>

            <div class="pt-opts pt-panel readable-ui">
                <label>サイズ // SIZE: <input type="range" id="paint-size" min="1" max="100" value="6"></label>
                <label>濃さ // ALPHA: <input type="range" id="paint-opacity" min="0.05" max="1.0" step="0.05" value="1.0"></label>
                <label title="手ぶれ補正">補正 // SMOOTH: <input type="range" id="pt-smooth" min="0" max="1" step="0.05" value="0.3"></label>
                <label class="pt-tog"><input type="checkbox" id="pt-pres" checked> 筆圧 // PRESSURE</label>
                <span id="pt-ctx"></span>
            </div>

            <!-- Expanding the palette so I don't have to keep opening the color picker -->
            <div class="pt-deck pt-panel">
                <div class="pt-cbox">
                    <input type="color" id="paint-c1" value="#ff0099" title="C1">
                    <input type="color" id="paint-c2" value="#00f0ff" title="C2">
                    <button type="button" class="pt-mini" id="pt-swap" title="入れ替え // swap">⇄</button>
                </div>
                <label class="pt-bgbox" title="BG"><span>BG</span><input type="color" id="paint-bg" value="#050104"></label>
                <span class="pt-groove"></span>
                <span class="pt-dk">NEON_DECK</span>
                <div class="pt-pal pt-sunk">${swatchesHTML}</div>
            </div>

            <div class="pt-main">
                <div class="pt-rail pt-panel paint-toolbar readable-ui" id="pt-rail"></div>
                <div class="pt-stage">
                    <div class="crt-overlay"></div>
                    <div id="paint-grid-overlay" style="display: none; position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; background-size: 16px 16px; background-image: linear-gradient(to right, var(--neon-glow) 1px, transparent 1px), linear-gradient(to bottom, var(--neon-glow) 1px, transparent 1px); z-index: 2;"></div>
                    <canvas id="paint-canvas" style="display: block; width: 100%; height: 100%; touch-action: none; position: relative; z-index: 1;"></canvas>
                </div>
                <div class="pt-side pt-panel readable-ui">
                    <h4>レイヤー // LAYERS</h4>
                    <div id="pt-layers" class="pt-sunk"></div>
                    <div class="pt-row"><span>不透明 // OPACITY</span><input type="range" id="pt-lop" min="0" max="100" value="100"></div>
                    <div class="pt-row"><select id="pt-lblend" class="pt-sel">${BLENDS_HTML()}</select></div>
                    <div class="pt-lctl">
                        <button type="button" class="pt-mini pt-ib" id="pt-ladd" title="新規 // new layer"><i class="pt-bi" data-em="pt-l-add"></i></button>
                        <button type="button" class="pt-mini pt-ib" id="pt-ldup" title="複製 // duplicate"><i class="pt-bi" data-em="pt-l-dup"></i></button>
                        <button type="button" class="pt-mini pt-ib" id="pt-lup" title="上へ // up"><i class="pt-bi" data-em="pt-l-up"></i></button>
                        <button type="button" class="pt-mini pt-ib" id="pt-ldown" title="下へ // down"><i class="pt-bi" data-em="pt-l-down"></i></button>
                        <button type="button" class="pt-mini pt-ib" id="pt-lmerge" title="下と結合 // merge down (or the picked ones)"><i class="pt-bi" data-em="pt-l-merge"></i></button>
                        <button type="button" class="pt-mini pt-ib" id="pt-lfold" title="フォルダにまとめる // put in a folder (this one or the picked ones)"><i class="pt-bi" data-em="pt-l-fold"></i></button>
                        <button type="button" class="pt-mini pt-ib" id="pt-ldel" title="削除 // delete"><i class="pt-bi" data-em="pt-l-del"></i></button>
                    </div>
                    <div class="pt-lctl" id="pt-selrow" hidden>
                        <button type="button" class="pt-mini pt-ib" id="pt-lcut" title="選択範囲を新しいレイヤーに // selection to a new layer"><i class="pt-bi" data-em="pt-l-cut"></i></button>
                        <button type="button" class="pt-mini pt-ib" id="pt-selclear" title="選択範囲を消す // clear it (del)"><i class="pt-bi" data-em="pt-l-selclear"></i></button>
                        <button type="button" class="pt-mini pt-ib" id="pt-seloff" title="選択解除 // deselect (esc)"><i class="pt-bi" data-em="pt-l-seloff"></i></button>
                    </div>
                    <h4>履歴 // HISTORY</h4>
                    <div id="pt-hist" class="pt-sunk"></div>
                </div>
            </div>

            <div class="pt-bar pt-panel readable-ui">
                <button type="button" class="pt-ib" id="pt-new" title="新規 // new"><i class="pt-bi" data-em="pt-b-new"></i></button>
                <button type="button" class="pt-ib" id="pt-open" title="開く // open (png, jpg, .vpaint)"><i class="pt-bi" data-em="pt-b-open"></i></button>
                <button type="button" class="pt-ib" id="pt-save" title="保存 // save (ctrl s = quick png)"><i class="pt-bi" data-em="pt-b-save"></i><b class="pt-dd">▾</b></button>
                <button type="button" class="pt-ib" id="pt-print" title="印刷 // print. comes out of copier.exe"><i class="pt-bi" data-em="pt-b-print"></i></button>
                <button type="button" class="pt-ib" id="pt-fxbtn" title="効果 // fx" hidden><i class="pt-bi" data-em="pt-b-fx"></i><b class="pt-dd">▾</b></button>
                <span class="pt-groove"></span>
                <button type="button" class="pt-ib" id="pt-undo" title="元に戻す // undo (ctrl z)"><i class="pt-bi" data-em="pt-b-undo"></i></button>
                <button type="button" class="pt-ib" id="pt-redo" title="やり直し // redo (ctrl shift z)"><i class="pt-bi" data-em="pt-b-redo"></i></button>
                <span class="pt-groove"></span>
                <button type="button" class="pt-ib" data-grid onclick="os.togglePaintGrid(this)" title="グリッド // grid"><i class="pt-bi" data-em="pt-b-grid"></i></button>
                <button type="button" class="pt-ib" id="pt-centre" onclick="os.resetPaintView()" title="真ん中に戻す // re-centre"><i class="pt-bi" data-em="pt-b-centre"></i></button>
                <button type="button" class="pt-ib" id="pt-crt" title="走査線 // scanlines"><i class="pt-bi" data-em="pt-b-crt"></i></button>
                <button type="button" class="pt-ib pt-sidebtn" id="pt-sidebtn" title="レイヤー // layers"><i class="pt-bi" data-em="pt-b-layers"></i></button>
                <input type="file" id="pt-file" accept="image/*,.vpaint" hidden>
                <span class="pt-groove"></span>
                <button type="button" class="pt-ib pt-purge" onclick="os.clearPaintCanvas()" title="全部消す // purge, fills it with BG"><i class="pt-bi" data-em="pt-b-purge"></i></button>
                <div class="pt-pop" id="pt-newmenu" hidden></div>
                <div class="pt-pop" id="pt-fxmenu" hidden></div>
            </div>
        </div>
    `;
    document.body.appendChild(template);
};
function BLENDS_HTML() {
    return [['source-over', '通常 // normal'], ['multiply', '乗算 // multiply'], ['darken', '比較(暗) // darken'], ['color-burn', '焼き込み // burn'],
        ['screen', 'スクリーン // screen'], ['lighter', '加算 // add'], ['lighten', '比較(明) // lighten'], ['color-dodge', '覆い焼き // dodge'],
        ['overlay', 'オーバーレイ // overlay'], ['soft-light', 'ソフトライト // soft light'], ['hard-light', 'ハードライト // hard light'],
        ['difference', '差の絶対値 // difference'], ['exclusion', '除外 // exclusion'],
        ['hue', '色相 // hue'], ['saturation', '彩度 // saturation'], ['color', 'カラー // colour'], ['luminosity', '輝度 // luminosity']].map(b => `<option value="${b[0]}">${b[1]}</option>`).join('');
}

(function () {
    const sum = os.summon;
    os.summon = function (id) {
        let r = sum.apply(this, arguments);
        if (id === 'paint.exe') { setTimeout(os.initPaintCanvas, 60); noLines(); }
        return r;
    };
    // scanlines kept messing with my colours
    let going = false, last = '';
    function noLines() {
        if (going) return; going = true;
        const root = document.documentElement;
        (function tick() {
            let w = document.getElementById('win-paint.exe');
            if (!w) { root.classList.remove('pt-hole'); last = ''; going = false; return; }
            let r = w.getBoundingClientRect(), on = !w.classList.contains('is-min') && r.width > 0;
            let k = on ? [r.left, r.top, r.width, r.height].map(Math.round).join() : '';
            if (k !== last) {
                last = k; root.classList.toggle('pt-hole', on);
                if (on) { let [x, y, ww, hh] = k.split(','); document.body.style.setProperty('--pt-hole', x + 'px ' + y + 'px / ' + ww + 'px ' + hh + 'px'); }
            }
            requestAnimationFrame(tick);
        })();
    }
})();

if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', injectPaintApp); else injectPaintApp();
