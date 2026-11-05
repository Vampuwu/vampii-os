
(function () {
    const X = window.NBX;
    const sel = X.sel; sel.many = sel.many || new Set();
    const isAudio = tr => tr && !tr.isMaster && NB.V[tr.inst] && NB.V[tr.inst].kind === 'audio';
    const r3 = v => Math.round(v * 1000) / 1000;
    const after = () => { X.touch(); if (X.arrSize) X.arrSize(); X.showDock(); };

    function picked() {
        let out = [], seen = new Set();
        X.pr.tracks.forEach(tr => tr.clips.forEach(c => { if ((c.uid === sel.clip || sel.many.has(c.uid)) && !seen.has(c.uid)) { seen.add(c.uid); out.push({ tr, c }); } }));
        return out;
    }
    X.picked = picked;
    X.isPicked = uid => uid === sel.clip || sel.many.has(uid);
    function pickSet(list) { sel.many = new Set(list.map(o => o.c.uid)); if (list.length) { sel.tr = list[0].tr.uid; sel.clip = list[0].c.uid; sel.many.delete(sel.clip); } else sel.clip = null; sel.notes = new Set(); let V = X.V(); if (V) V.dirty = true; }
    X.pickSet = pickSet;
    X.pickToggle = (tr, c) => { if (X.isPicked(c.uid)) { if (sel.clip === c.uid) { let n = [...sel.many][0]; sel.clip = n || null; if (n) sel.many.delete(n); } else sel.many.delete(c.uid); } else { if (sel.clip) sel.many.add(sel.clip); sel.clip = c.uid; sel.tr = tr.uid; } sel.notes = new Set(); X.V().dirty = true; X.showDock(); };
    X.pickAll = () => { let all = []; X.pr.tracks.forEach(tr => tr.clips.forEach(c => all.push({ tr, c }))); pickSet(all); X.flash(all.length + ' clips picked'); };
    X.pickNone = () => { sel.many = new Set(); X.V().dirty = true; };
    const need = () => { let p = picked(); if (!p.length) X.flash('pick a clip first (click one, shift+click for more, ctrl+drag a box)'); return p; };

    function fresh(c) { let cp = JSON.parse(JSON.stringify(c)); cp.uid = NB.uid('c'); return cp; }
    function cutAt(tr, c, b) {
        if (b <= c.at + 0.01 || b >= c.at + c.len - 0.01) return null;
        let cp = fresh(c), cut = b - c.at; cp.at = r3(b); cp.len = r3(c.len - cut); cp.off = r3((c.off || 0) + cut); c.len = r3(cut);
        // splitting a clip, fade in stays on the first half, fade out on the second
        if (c.src) { cp.fi = 0; c.fo = 0; }
        tr.clips.push(cp); return cp;
    }
    X.cutAt = cutAt;
    function split() {
        let V = X.V(), b = V.cursor, list = picked();
        if (!list.length) { let tr = X.trk(sel.tr); if (tr) list = tr.clips.map(c => ({ tr, c })); }
        list = list.filter(o => b > o.c.at + 0.01 && b < o.c.at + o.c.len - 0.01);
        if (!list.length) { X.flash('nothing under the cursor to split. put the cursor across a clip (click the ruler)'); return; }
        X.mark(); let made = list.map(o => ({ tr: o.tr, c: cutAt(o.tr, o.c, b) })).filter(o => o.c); pickSet(made); after(); X.flash('split ' + made.length + ' at the cursor ✂');
    }
    function chop(step) {
        let list = need(); if (!list.length) return;
        X.mark(); let all = [];
        list.forEach(({ tr, c }) => { let cur = c, k = Math.floor(c.at / step + 1e-6) + 1; all.push({ tr, c }); while (cur) { let b = k * step; if (b >= cur.at + cur.len - 0.01) break; let nx = cutAt(tr, cur, b); if (nx) { all.push({ tr, c: nx }); cur = nx; } k++; if (all.length > 512) break; } });
        pickSet(all); after(); X.flash('chopped into ' + all.length + ' pieces');
    }
    function copy(quiet) {
        let list = need(); if (!list.length) return false;
        let a0 = Math.min.apply(null, list.map(o => o.c.at)), ti = X.pr.tracks.indexOf(list[0].tr);
        X.V().clipBoard = { items: list.map(o => ({ tuid: o.tr.uid, kind: isAudio(o.tr) ? 'audio' : 'notes', inst: o.tr.inst, dt: X.pr.tracks.indexOf(o.tr) - ti, rel: o.c.at - a0, c: JSON.parse(JSON.stringify(o.c)) })), span: Math.max.apply(null, list.map(o => o.c.at + o.c.len)) - a0 };
        if (!quiet) X.flash(list.length === 1 ? 'clip copied' : list.length + ' clips copied'); return true;
    }
    function cut() { if (!copy(true)) return; let list = picked(); X.mark(); list.forEach(({ tr, c }) => tr.clips.splice(tr.clips.indexOf(c), 1)); pickSet([]); after(); X.flash('cut. ctrl+v puts it back at the cursor'); }
    function fits(tr, it) { return tr && !tr.isMaster && !NB.isBus(tr) && (it.kind === 'audio' ? isAudio(tr) : !isAudio(tr) && (it.inst === tr.inst || NB.V[tr.inst].kind !== 'audio')); }
    function paste() {
        let V = X.V(), cb = V.clipBoard; if (!cb || !cb.items) { X.flash('nothing copied yet (ctrl+c a clip first)'); return; }
        let ts = X.pr.tracks, here = X.trk(sel.tr), hi = ts.indexOf(here), at = V.cursor, made = [];
        X.mark();
        cb.items.forEach(it => {
            let tr = cb.items.length === 1 && fits(here, it) ? here : (hi >= 0 && fits(ts[hi + it.dt], it) ? ts[hi + it.dt] : ts.find(t => t.uid === it.tuid));
            if (!tr) { tr = X.addTrack(it.kind === 'audio' ? 'audio' : it.inst); if (!tr) return; }
            let c = fresh(it.c); c.at = r3(at + it.rel); tr.clips.push(c); made.push({ tr, c });
        });
        pickSet(made); V.cursor = r3(at + cb.span); after(); X.flash(made.length === 1 ? 'pasted (again = the next one along)' : made.length + ' pasted (again = the next lot along)');
    }
    function dupe() {
        let list = need(); if (!list.length) return;
        let a0 = Math.min.apply(null, list.map(o => o.c.at)), span = Math.max.apply(null, list.map(o => o.c.at + o.c.len)) - a0;
        X.mark(); let made = list.map(({ tr, c }) => { let cp = fresh(c); cp.at = r3(c.at + span); tr.clips.push(cp); return { tr, c: cp }; });
        pickSet(made); after(); X.flash(made.length === 1 ? 'duplicated' : made.length + ' duplicated');
    }
    function del() { let list = need(); if (!list.length) return; X.mark(); list.forEach(({ tr, c }) => tr.clips.splice(tr.clips.indexOf(c), 1)); pickSet([]); after(); X.flash(list.length === 1 ? 'clip gone (ctrl+z)' : list.length + ' clips gone (ctrl+z)'); }
    function notesOf(c) { let out = [], lp = c.lp > 0 ? c.lp : 0, end = c.at + c.len, off = c.off || 0;
        if (lp) { for (let k = Math.floor(off / lp); k < 4096; k++) { let base = c.at + k * lp - off; if (base >= end) break; c.notes.forEach(n => { let b = base + n.t; if (n.t < lp && b >= c.at - 1e-9 && b < end - 1e-9) out.push(Object.assign({}, n, { t: b, d: Math.min(n.d, end - b) })); }); } }
        else c.notes.forEach(n => { let b = c.at + n.t - off; if (b >= c.at - 1e-9 && b < end - 1e-9) out.push(Object.assign({}, n, { t: b, d: Math.min(n.d, end - b) })); });
        return out; }
    function glue() {
        let list = need(); if (list.length < 2) { if (list.length) X.flash('pick two or more clips on one track to glue'); return; }
        let tr = list[0].tr; if (list.some(o => o.tr !== tr)) { X.flash('glue works on one track at a time'); return; }
        if (isAudio(tr)) { X.flash('audio clips dont glue. bounce them into one instead (⇩ AUDIO)'); return; }
        X.mark(); let a = Math.min.apply(null, list.map(o => o.c.at)), b = Math.max.apply(null, list.map(o => o.c.at + o.c.len)), notes = [];
        list.forEach(o => notesOf(o.c).forEach(n => notes.push(Object.assign(n, { t: r3(n.t - a) }))));
        let c = list[0].c; c.at = a; c.len = r3(b - a); c.off = 0; c.lp = 0; c.notes = notes;
        list.slice(1).forEach(o => tr.clips.splice(tr.clips.indexOf(o.c), 1));
        pickSet([{ tr, c }]); after(); X.flash('glued into one');
    }
    function stretchNotes(c, f) { c.notes.forEach(n => { n.t = r3(n.t * f); n.d = r3(Math.max(0.01, n.d * f)); }); c.len = r3(c.len * f); if (c.lp > 0) c.lp = r3(c.lp * f); c.off = r3((c.off || 0) * f); }
    function stretchAudio(c, f) { c.spd = (c.spd || 1) / f; c.len = r3(c.len * f); c.off = r3((c.off || 0) * f); if (c.lp > 0) c.lp = r3(c.lp * f); if (c.fi) c.fi = r3(c.fi * f); if (c.fo) c.fo = r3(c.fo * f); }
    X.stretchClip = (tr, c, f) => { if (isAudio(tr)) stretchAudio(c, f); else stretchNotes(c, f); };
    async function stretch(f, keep) {
        let list = need(); if (!list.length) return;
        X.mark();
        for (const { tr, c } of list) {
            if (!isAudio(tr)) { stretchNotes(c, f); continue; }
            if (!keep || !window.NBA) { stretchAudio(c, f); continue; }
            X.flash('stretching ' + (c.name || 'the sound') + '… (same pitch)');
            let ok = await NBA.keepPitch(c, f); if (!ok) { X.flash('couldnt stretch that one'); }
        }
        after(); X.flash(f > 1 ? 'longer ×' + f + (keep ? ', same pitch' : '') : 'shorter ÷' + r3(1 / f) + (keep ? ', same pitch' : ''));
    }

    const UNITY = Math.pow(0.8, 1 / 1.6);
    // freeze + flatten. turns it into audio so your pc can breathe
    async function toAudio(what, opt) {
        opt = opt || {};
        if (!window.NBA) return;
        if (X.playing()) X.stop();
        let pr = X.pr, sig = pr.sig || 4, list = picked(), tr = null, a, b, only = null, cp = JSON.parse(X.json(pr)), name;
        cp._v = (pr._v || 0) + 1; cp.tracks.forEach(t => { delete t._flat; });
        if (what === 'clips') {
            if (!list.length) { X.flash('pick the clips to bounce first'); return; }
            tr = list[0].tr; if (list.some(o => o.tr !== tr)) { X.flash('bounce the clips of one track at a time (or the whole loop)'); return; }
            let keep = new Set(list.map(o => o.c.uid)); a = Math.min.apply(null, list.map(o => o.c.at)); b = Math.max.apply(null, list.map(o => o.c.at + o.c.len));
            cp.tracks.find(t => t.uid === tr.uid).clips.forEach(c => { if (!keep.has(c.uid)) c.mute = 1; });
            only = tr.uid; name = (list.length === 1 ? (list[0].c.name || tr.name) : tr.name) + ' ⇩';
        } else if (what === 'track') {
            tr = X.trk(sel.tr); if (!tr || tr.isMaster || !tr.clips.length) { X.flash('pick a track with something on it'); return; }
            a = NB.barOf(pr, Math.min.apply(null, tr.clips.map(c => c.at))).at; b = Math.max.apply(null, tr.clips.map(c => c.at + c.len)); only = tr.uid; name = tr.name + ' ⇩';
        } else {
            if (what === 'loop' && !(pr.loop.b > pr.loop.a)) { X.flash('mark a loop on the ruler first'); return; }
            a = what === 'loop' ? pr.loop.a : 0; b = what === 'loop' ? pr.loop.b : NB.songEnd(pr); name = (what === 'loop' ? 'the loop' : (pr.name || 'the song')) + ' ⇩';
            if (b <= a) { X.flash('theres nothing to bounce yet'); return; }
        }
        if (only) { let t = cp.tracks.find(q => q.uid === only); Object.assign(t.mix, { vol: UNITY, pan: 0.5, mute: 0, solo: 0, room: 0, echo: 0, duck: 0, out: '', to: {}, pre: {} });
            t.auto = (t.auto || []).filter(q => !/^mix\./.test(q.path)); }
        cp.loop = { on: 1, a, b };
        X.flash('bouncing ' + name.replace(' ⇩', '') + '…');
        let o;
        try { o = await NB.bounce(cp, { what: 'loop', loops: 1, tail: 3, only: only || undefined }); } catch (e) { X.flash('the bounce didnt work here'); return; }
        let sr = o.buf.sampleRate, s0 = Math.round(0.05 * sr), chs = [0, 1].map(k => o.buf.getChannelData(Math.min(k, o.buf.numberOfChannels - 1))), end = chs[0].length, body = s0 + Math.round((NB.secAt(pr, b) - NB.secAt(pr, a)) * sr);
        while (end > body && Math.abs(chs[0][end - 1]) < 2e-4 && Math.abs(chs[1][end - 1]) < 2e-4) end--;
        end = Math.min(chs[0].length, end + Math.round(0.01 * sr));
        let ctx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(2, Math.max(1, end - s0), sr), out = ctx.createBuffer(2, Math.max(1, end - s0), sr);
        for (let k = 0; k < 2; k++) out.getChannelData(k).set(chs[k].subarray(s0, end));
        let e = await NBA.addBuf(out, name.slice(0, 40), true);
        X.mark();
        let nt = X.addTrack('audio'); if (!nt) return;
        let ts = pr.tracks; ts.splice(ts.indexOf(nt), 1); let at = tr ? ts.indexOf(tr) + 1 : ts.length; ts.splice(at, 0, nt);
        nt.name = name.slice(0, 24); if (tr) { nt.col = tr.col; ['vol', 'pan', 'room', 'echo', 'duck', 'out'].forEach(k => { nt.mix[k] = tr.mix[k]; }); nt.mix.to = Object.assign({}, tr.mix.to); nt.mix.pre = Object.assign({}, tr.mix.pre); nt.auto = JSON.parse(JSON.stringify((tr.auto || []).filter(q => /^mix\./.test(q.path)))); }
        let c = NB.newClip(a, r3(NB.steady(pr) ? (end - s0) / sr / (60 / pr.bpm) : NB.beatAt(pr, NB.secAt(pr, a) + (end - s0) / sr) - a)); c.src = e.id; c.name = name.slice(0, 40); c.abpm = NB.steady(pr) ? pr.bpm : Math.round(NB.tempoAt(pr, a) * 1000) / 1000; c.lp = 0; c.bounced = 1; nt.clips.push(c);
        if (what === 'track' && opt.freeze) { tr.fz = nt.uid; nt.ice = tr.uid; nt.name = ('❄ ' + tr.name).slice(0, 24); }
        else if (what === 'clips') list.forEach(o2 => { o2.c.mute = 1; }); else if (what === 'track') tr.mix.mute = 1;
        else pr.tracks.forEach(t => { if (t !== nt && !NB.isBus(t)) t.mix.mute = 1; });
        sel.tr = nt.uid; pickSet([{ tr: nt, c }]); after(); X.showAll();
        X.flash(opt.freeze ? '❄ frozen. its plugins rest, the audio plays in its place. ☀ UNFREEZE on either gets it back' : what === 'clips' || what === 'track' ? 'bounced into audio ↓ (the old one is muted, not gone)' : 'bounced into one audio track (everything else muted, not gone)');
        if (X.browseSounds) X.browseSounds();
    }
    function unfreeze(tr) {
        let pr = X.pr, orig = tr.fz ? tr : X.trk(tr.ice), ice = orig && X.trk(orig.fz); if (!orig || !ice) return;
        X.mark(); pr.tracks.splice(pr.tracks.indexOf(ice), 1); delete orig.fz; sel.tr = orig.uid; sel.clip = null; X.touch(); X.showAll(); X.flash('☀ ' + orig.name + ' is back. its plugins are running again');
    }
    X.ed = { unfreeze, split, chop, copy, cut, paste, dupe, del, glue, stretch, toAudio, picked };

    X.editBar = function (box) {
        const { btn, el, menu } = X;
        const mb = (label, tip, items) => btn(label, 'sm', e => { let r = e.target.getBoundingClientRect(); menu(r.left, r.bottom + 2, items()); }, tip);
        let g = el('span', 'nb-edbar');
        const ic = (b, d) => { b.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round" style="display:block">' + d + '</svg>'; b.classList.add('nb-ic'); return b; };
        const IC = {
            split: '<rect x="1.5" y="4" width="13" height="8" rx="1"/><path d="M8 1.5v13" stroke-dasharray="2 1.6"/>',
            dupe: '<rect x="1.5" y="3" width="7" height="10" rx="1"/><rect x="9.5" y="3" width="5" height="10" rx="1" stroke-dasharray="1.6 1.4"/><path d="M12 6.5v3M10.5 8h3"/>',
            copy: '<rect x="5.5" y="5.5" width="8.5" height="9" rx="1"/><path d="M3.5 10.5h-1a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v1"/>',
            cut: '<circle cx="4" cy="12" r="2.2"/><circle cx="12" cy="12" r="2.2"/><path d="M5.6 10.4 12 2M10.4 10.4 4 2"/>',
            paste: '<rect x="2.5" y="3" width="11" height="12" rx="1.2"/><rect x="5.5" y="1.5" width="5" height="3" rx="0.8" fill="currentColor" fill-opacity="0.25"/><path d="M5.5 8h5M5.5 10.5h5M5.5 13h3"/>',
            del: '<path d="M2.5 4.5h11M6 4.5V2.5h4v2M4 4.5l.8 10h6.4l.8-10M6.6 7v5M9.4 7v5"/>',
            glue: '<rect x="1.5" y="4" width="6" height="8" rx="1"/><rect x="8.5" y="4" width="6" height="8" rx="1"/><path d="M6 8h4" stroke-width="2.2"/>'
        };
        g.appendChild(ic(btn('', 'sm', split, 'SPLIT at the cursor (ctrl+e). the picked clips, or everything on the picked track under the cursor'), IC.split));
        g.appendChild(mb('CHOP ▾', 'CHOP the picked clips into even pieces', () => [['every bar', () => chop(X.pr.sig || 4)], ['every 2 beats', () => chop(2)], ['every beat', () => chop(1)], ['every 1/8', () => chop(0.5)], ['every 1/16', () => chop(0.25)]]));
        g.appendChild(ic(btn('', 'sm', dupe, 'DUPLICATE the picked clips, straight after (ctrl+d)'), IC.dupe));
        g.appendChild(ic(btn('', 'sm', () => copy(), 'COPY (ctrl+c)'), IC.copy));
        g.appendChild(ic(btn('', 'sm', cut, 'CUT (ctrl+x)'), IC.cut));
        g.appendChild(ic(btn('', 'sm', paste, 'PASTE at the cursor (ctrl+v). again = the next one along'), IC.paste));
        g.appendChild(ic(btn('', 'sm', del, 'DELETE the picked clips (del)'), IC.del));
        g.appendChild(ic(btn('', 'sm', glue, 'GLUE the picked note clips into one (ctrl+j)'), IC.glue));
        g.appendChild(mb('⇔ ▾', 'STRETCH: longer / shorter, faster / slower (alt+drag a clip\'s right edge does it by hand)', () => [
            { head: 'longer / shorter (audio: the pitch goes with it)' }, ['×2 longer', () => stretch(2)], ['×1.5', () => stretch(1.5)], ['÷1.5', () => stretch(1 / 1.5)], ['÷2 shorter', () => stretch(0.5)],
            { head: 'audio, keeping its pitch' }, ['×2 longer, same pitch', () => stretch(2, true)], ['×1.5, same pitch', () => stretch(1.5, true)], ['÷1.5, same pitch', () => stretch(1 / 1.5, true)], ['÷2 shorter, same pitch', () => stretch(0.5, true)]]));
        g.appendChild(mb('⇩ AUDIO ▾', 'BOUNCE into a solid audio track you can chop up (the original gets muted, not deleted)', () => [['the picked clips → audio', () => toAudio('clips')], ['the picked track → audio', () => toAudio('track')], ['the loop (everything) → audio', () => toAudio('loop')], ['the whole song → audio', () => toAudio('song')]]));
        box.appendChild(g);
    };
})();
