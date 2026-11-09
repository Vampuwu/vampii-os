
(function () {
    const X = window.NBX;
    const pr = () => X.pr;
    const buses = () => pr().tracks.filter(t => NB.isBus(t));
    const tag = b => (b.inst === 'cell' ? '独房 ' : '柩 ') + b.name;
    const db = v => { let g = Math.pow(v, 1.6) * 1.25; return g < 0.0003 ? 'off' : (g >= 1 ? '+' : '') + (20 * Math.log10(g)).toFixed(1) + 'dB'; };
    const UNITY = Math.pow(0.8, 1 / 1.6);

    const outs = tr => [['', '主 MASTER']].concat(buses().filter(b => NB.canFeed(pr(), tr.uid, b.uid)).map(b => [b.uid, tag(b)]));
    const inside = g => pr().tracks.filter(t => NB.outOf(pr(), t) === g.uid);
    const feeders = c => pr().tracks.filter(t => NB.sendsOf(pr(), t).some(s => s.uid === c.uid));
    const cellsFor = tr => buses().filter(b => b.inst === 'cell' && NB.canFeed(pr(), tr.uid, b.uid));
    function after() { X.touch(); X.arrSize(); X.showDock(); }
    function setOut(tr, u) { if (u && !NB.canFeed(pr(), tr.uid, u)) { X.flash('that would pour round in a circle. no'); return; } X.mark(); tr.mix.out = u || ''; after(); }

    function hidden(tr) { let seen = new Set(), u = NB.outOf(pr(), tr); while (u && !seen.has(u)) { seen.add(u); let b = X.trk(u); if (!b) return false; if (b.fold) return true; u = NB.outOf(pr(), b); } return false; }
    function depth(tr) { let n = 0, seen = new Set(), u = NB.outOf(pr(), tr); while (u && !seen.has(u) && n < 6) { seen.add(u); let b = X.trk(u); if (!b) break; if (b.inst === 'cask') n++; u = NB.outOf(pr(), b); } return n; }
    const into = tr => { let b = X.trk(NB.outOf(pr(), tr)); return b ? b : null; };

    function intoNew(tr) {
        let p = pr(), was = NB.outOf(p, tr), g = X.addTrack('cask'); if (!g) return null;
        p.tracks.splice(p.tracks.indexOf(g), 1); p.tracks.splice(p.tracks.indexOf(tr), 0, g);
        if (was && NB.canFeed(p, g.uid, was)) g.mix.out = was;
        tr.mix.out = g.uid; X.pick(tr.uid); after(); X.flash(tr.name + ' is in ' + g.name + ' now');
        return g;
    }
    function letOut(g) { X.mark(); let n = inside(g); n.forEach(t => { t.mix.out = NB.outOf(pr(), g); }); after(); X.flash(n.length ? n.length + ' out of ' + g.name : g.name + ' was empty anyway'); }
    function fold(g) { g.fold = g.fold ? 0 : 1; X.save(); X.arrSize(); }
    // deleting a bus sends everything to wherever it was goign
    function gone(b) { let p = pr(), to = NB.outOf(p, b); p.tracks.forEach(t => { if (t === b) return; if (t.mix.out === b.uid) t.mix.out = to; if (t.mix.to) delete t.mix.to[b.uid]; if (t.mix.pre) delete t.mix.pre[b.uid]; }); }

    function menuItems(tr) {
        let items = [{ head: '出口 OUT · where it pours' }];
        outs(tr).forEach(([u, n]) => items.push([n, () => setOut(tr, u), { on: NB.outOf(pr(), tr) === u }]));
        items.push(['柩 into a new casket', () => { X.mark(); intoNew(tr); }]);
        if (tr.inst === 'cask') items.push([tr.fold ? '▸ open it up on the timeline' : '▾ fold it shut', () => fold(tr)], ['let everything out of it', () => letOut(tr)]);
        return items;
    }

    function sendKnob(tr, cell, small) {
        let m = tr.mix, w = X.el('div', 'nb-snd');
        let kn = X.knob(small ? cell.name.replace(/^CELL /, '').slice(0, 8) : 'SEND', () => m.to[cell.uid] || 0, v => { if (v > 0.0005) m.to[cell.uid] = v; else { delete m.to[cell.uid]; delete m.pre[cell.uid]; } },
            { cls: 'sm', def: 0, fmt: db, turn: X.apply, start: X.mark, done: X.touch, tip: 'how much of ' + tr.name + ' goes into ' + cell.name });
        kn.style.setProperty('--c', cell.col);
        X.autoable(kn, tr, 'send.' + cell.uid, 'SEND ' + cell.name, () => m.to[cell.uid] || 0);
        let on = !!m.pre[cell.uid], b = X.btn(on ? 'PRE' : 'POST', 'sm nb-pp' + (on ? ' on' : ''), () => { X.mark(); if (m.pre[cell.uid]) delete m.pre[cell.uid]; else m.pre[cell.uid] = 1; X.touch(); X.showDock(); },
            'PRE = it takes the sound before ' + tr.name + "'s own fader + pan, so turning the track down leaves the cell full. POST = after (the usual)");
        w.appendChild(kn); w.appendChild(b);
        return w;
    }
    function strip(c, tr) {
        if (tr.isMaster) return;
        let s = X.selBox(outs(tr).map(([u, n]) => [u, '→ ' + n]), NB.outOf(pr(), tr), v => setOut(tr, v), 'nb-out'); s.title = 'where ' + tr.name + ' pours: the master, a casket or a cell'; let h = c.querySelector('h4'); c.insertBefore(s, h ? h.nextSibling : c.firstChild);
        let cs = cellsFor(tr); if (!cs.length) return;
        let ks = X.el('div', 'nb-ks nb-sends'); cs.forEach(cell => ks.appendChild(sendKnob(tr, cell, true))); c.appendChild(ks);
    }

    function panel(box, tr) {
        let el = X.el, btn = X.btn, v = NB.V[tr.inst], cask = tr.inst === 'cask';
        let top = el('div', 'nb-row'); top.style.marginBottom = '7px';
        let nm = el('input', 'nb-in'); nm.value = tr.name; nm.maxLength = 24; nm.onchange = () => { X.mark(); tr.name = nm.value || tr.name; X.touch(); X.arrSize(); };
        top.appendChild(el('span', 'nb-lab', v.jp + ' ' + v.en)); top.appendChild(nm);
        let cb = btn('■', 'sm', e => X.menu(e.clientX, e.clientY, [{ swatch: col => { X.mark(); tr.col = col; X.touch(); X.showDock(); } }]), 'colour'); cb.style.color = tr.col; top.appendChild(cb);
        top.appendChild(el('span', 'nb-lab', '出口 OUT')); top.appendChild(X.selBox(outs(tr).map(([u, n]) => [u, '→ ' + n]), NB.outOf(pr(), tr), x => setOut(tr, x)));
        top.appendChild(btn('架 its rack', 'sm', () => X.setTab('rack'))); top.appendChild(btn('卓 MIXER', 'sm', () => X.setTab('mix')));
        box.appendChild(top);
        box.appendChild(el('div', 'nb-hint', v.sub));
        let sec = X.sec(cask ? '中身 INSIDE' : '送り手 WHO SENDS IN', cask ? 'what pours into it' : 'every track with its SEND up for this cell'), list = el('div', 'nb-rlist');
        if (cask) {
            let n = inside(tr);
            if (!n.length) list.appendChild(el('div', 'nb-hint', 'nothing in it yet. ＋ below, or right click any track → OUT → this one'));
            n.forEach(t => { let r = el('div', 'nb-rrow'); r.style.setProperty('--c', t.col); let a = el('span', 'nb-rn', t.name); a.onclick = () => X.pick(t.uid); r.appendChild(a); r.appendChild(btn('✕ out', 'sm', () => setOut(t, NB.outOf(pr(), tr)), 'take ' + t.name + ' out (it pours where the casket does)')); list.appendChild(r); });
        } else {
            let n = feeders(tr);
            if (!n.length) list.appendChild(el('div', 'nb-hint', 'nobody sends in yet. ＋ below, or turn up a SEND in the MIXER'));
            n.forEach(t => { let r = el('div', 'nb-rrow'); r.style.setProperty('--c', t.col); let a = el('span', 'nb-rn', t.name); a.onclick = () => X.pick(t.uid); r.appendChild(a); r.appendChild(sendKnob(t, tr, false)); list.appendChild(r); });
        }
        sec.appendChild(list);
        let can = pr().tracks.filter(t => t !== tr && (cask ? NB.outOf(pr(), t) !== tr.uid && NB.canFeed(pr(), t.uid, tr.uid) : !NB.sendsOf(pr(), t).some(s => s.uid === tr.uid) && NB.canFeed(pr(), t.uid, tr.uid)));
        sec.appendChild(btn(cask ? '＋ put a track in' : '＋ send a track in', 'sm', e => {
            if (!can.length) { X.flash('nothing left that can go in'); return; }
            X.menu(e.clientX, e.clientY, can.map(t => [t.name, () => { X.mark(); if (cask) t.mix.out = tr.uid; else t.mix.to[tr.uid] = 0.7; after(); }]));
        }));
        box.appendChild(sec);
        if (!tr.fx.length) box.appendChild(el('div', 'nb-hint', cask ? 'its rack is empty, so for now its just one fader for the lot. its rack → ＋ PLUGIN' : 'its rack is empty, so its just a copy. put a room or an echo in it: its rack → ＋ PLUGIN'));
        if (!cask) box.appendChild(el('div', 'nb-hint', 'solo a cell = only the wet, whatever feeds it goes quiet'));
    }

    X.route = { outs, inside, feeders, hidden, depth, into, intoNew, letOut, fold, gone, menuItems, strip, panel, sendKnob, db, UNITY };
})();
