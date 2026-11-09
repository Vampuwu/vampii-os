
(function () {
    const TL = s => window.NBL ? NBL.t(s) : s;
    const X = window.NBX;
    const KEYW = 58, RULER = 18, VELH = 56;
    const GRIDS = [[4, '1 bar'], [2, '1/2'], [1, '1/4'], [0.5, '1/8'], [0.25, '1/16'], [0.125, '1/32'], [0.0625, '1/64'], [2 / 3, '1/4T'], [1 / 3, '1/8T'], [1 / 6, '1/16T'], [1 / 12, '1/32T'], [0.2, '1/16 in 5'], [1 / 7, '1/16 in 7']];
    const LENS = [['grid', 'same as grid'], [0.0625, '1/64'], [0.125, '1/32'], [0.25, '1/16'], [0.5, '1/8'], [0.75, '1/8.'], [1, '1/4'], [1.5, '1/4.'], [2, '1/2'], [4, '1 bar'], [8, '2 bars'], [16, '4 bars'], [32, '8 bars']];
    const CHORDS = [['one', 'one note'], ['triad', 'chord: 3'], ['seventh', 'chord: 4'], ['sus', 'chord: sus'], ['power', 'power'], ['octave', 'octave'], ['nine', 'chord: 5'], ['add9', 'chord: add 9'], ['quart', 'stacked 4ths'], ['spread', 'spread wide'], ['cluster', 'cluster']];
    const SHAPE = { one: [0], triad: [0, 2, 4], seventh: [0, 2, 4, 6], sus: [0, 3, 4], power: [0, 4], octave: [0, 7], nine: [0, 2, 4, 6, 8], add9: [0, 2, 4, 8], quart: [0, 3, 6, 9], spread: [-7, 0, 4, 9], cluster: [0, 1, 2, 3] };
    const SEMI = { one: [0], triad: [0, 3, 7], seventh: [0, 3, 7, 10], sus: [0, 5, 7], power: [0, 7], octave: [0, 12], nine: [0, 3, 7, 10, 14], add9: [0, 3, 7, 14], quart: [0, 5, 10, 15], spread: [-12, 0, 7, 15], cluster: [0, 1, 2, 3] };
    const RS = { len: 'grid', chord: 'one', ppb: 0, clip: null, scl: 1 };
    try { let v = localStorage.getItem('vmp_nb_scl'); if (v != null && isFinite(+v)) RS.scl = Math.max(0, Math.min(2, +v)); } catch (e) {}
    const SCL = ['SCALE: off', 'SCALE: LIT', 'SCALE: FOLD'];
    let R = null;

    const scaleOf = pr => (NB.SCALES[pr.scale] || NB.SCALES.minor).s;
    function walk(m, n, lockd) {
        let pr = X.pr; if (!lockd) return m + n;
        let dir = Math.sign(n), k = Math.abs(n); while (k-- > 0) { do { m += dir; } while (m > 0 && m < 127 && !NB.inScale(pr, m)); } return m;
    }
    function snapNote(m) { let pr = X.pr; if (!pr.snap || NB.inScale(pr, m)) return m; for (let d = 1; d < 6; d++) { if (NB.inScale(pr, m - d)) return m - d; if (NB.inScale(pr, m + d)) return m + d; } return m; }
    function chordAt(m) {
        let pr = X.pr, kind = RS.chord;
        if (pr.snap) { let base = snapNote(m); return SHAPE[kind].map(s => walk(base, s, true)); }
        return SEMI[kind].map(s => m + s);
    }
    function degOf(pr, m) { let sc = scaleOf(pr), k = sc.indexOf(((m - pr.root) % 12 + 12) % 12); return k + 1; }
    function tonesFrom(m) { let pr = X.pr, b = NB.inScale(pr, m) ? m : snapNote(m); return [[b, '1'], [walk(b, 2, true), '3'], [walk(b, 4, true), '5'], [walk(b, 6, true), '7']]; }

    const MOODS = [['DARK', [0, 3, 0, 4]], ['ENTRANCED', [0, 5, 2, 6]], ['EUPHORIC', [5, 6, 0, 0]], ['EPIC', [0, 6, 5, 6]], ['VAMPIRE', [0, 3, 4, 0], 'harmonic'], ['ACID', [0, 0, 1, 0], 'phrygian'], ['HARDBITE', [0, 5, 6, 0]],
        ['LO-FANG', [1, 4, 0, 0], null, 1], ['CHURCH', [3, 0, 3, 0]], ['SAD', [5, 3, 0, 4]], ['FALLING', [0, 6, 5, 4]], ['HAUNTED', [0, 1, 6, 0], 'phrygian'],
        // Japanese scales. In sen is my favourite
        { h: '日本 // JAPANESE' },
        ['王道 ROYAL ROAD', 'M', [[5, 'M7'], [7, '7'], [4, 'm7'], [9, 'm']]],
        ['王道・泣き ROYAL ROAD, CRYING', 'M', [[5, 'M7'], [7, '7'], [4, '7'], [9, 'm7']]],
        ['夜遊び NIGHT OUT', 'M', [[5, 'M7'], [4, '7'], [9, 'm7'], [[7, 'm7'], [0, '7']]]],
        ['踊り場 DANCEFLOOR', 'M', [[9, 'm'], [5, 'M'], [7, 'M'], [0, 'M']]],
        ['カノン CANON', 'M', [[0, 'M'], [7, 'M'], [9, 'm'], [4, 'm'], [5, 'M'], [0, 'M'], [5, 'M'], [7, 'M']]],
        ['1625', 'M', [[0, 'M7'], [9, 'm7'], [2, 'm7'], [7, '7']]],
        ['逆循環 BACK ROUND', 'M', [[2, 'm7'], [7, '7'], [0, 'M7'], [9, 'm7']]],
        ['456', 'M', [[5, 'M'], [7, 'M'], [9, 'm'], [9, 'm']]],
        ['画布 CANVAS', 'M', [[5, 'M7'], [4, 'm7'], [2, 'm7'], [0, 'M7']]],
        { h: '夜 // AFTER DARK' },
        ['吸血・恍惚 VAMPIRE, ENTRANCED', 'm', [[0, 'm'], [8, 'M'], [5, 'm'], [7, '7']]],
        ['恍惚・上昇 ENTRANCED, LIFT', 'm', [[8, 'M'], [3, 'M'], [10, 'sus4'], [0, 'm']]],
        ['硬噛・陶酔 HARDBITE, EUPHORIC', 'm', [[8, 'M'], [10, 'M'], [0, 'm'], [7, 'M']]],
        ['硬噛・生 HARDBITE, RAW', 'm', [[0, 'm'], [1, 'M'], [0, 'm'], [10, 'M']]],
        ['酸・地下 ACID, BASEMENT', 'm', [[0, 'm7'], [0, 'm7'], [1, 'M7'], [[8, 'M'], [6, '5']]]],
        ['鋳造 FOUNDRY', 'm', [[0, '5'], [1, '5'], [6, '5'], [0, '5']]],
        ['重 HEAVY', 'm', [[0, '5'], [8, '5'], [10, '5'], [[7, '5'], [1, '5']]]],
        ['陶酔・頂 EUPHORIC, PEAK', 'm', [[8, 'M7'], [10, 'M'], [3, 'M'], [0, 'm']]],
        ['低牙・深夜 LO-FANG, LATE', 'M', [[9, 'm9'], [2, 'm9'], [7, '7'], [0, 'M9']]],
        ['下降 THE SLIDE', 'm', [[0, 'm'], [0, 'mM7'], [0, 'm7'], [0, 'm6']]]];
    const QUAL = { M: [[0, 4, 7], ''], m: [[0, 3, 7], 'm'], M7: [[0, 4, 7, 11], 'maj7'], m7: [[0, 3, 7, 10], 'm7'], '7': [[0, 4, 7, 10], '7'], dim: [[0, 3, 6], '°'], sus4: [[0, 5, 7], 'sus4'], sus2: [[0, 2, 7], 'sus2'],
        M9: [[0, 4, 7, 11, 14], 'maj9'], m9: [[0, 3, 7, 10, 14], 'm9'], '5': [[0, 7, 12], '5'], mM7: [[0, 3, 7, 11], 'm(maj7)'], m6: [[0, 3, 7, 9], 'm6'] };
    const VOICES2 = [['TRIAD', [0, 2, 4]], ['7TH', [0, 2, 4, 6]], ['9TH', [0, 2, 4, 6, 8]], ['SUS2', [0, 1, 4]], ['SUS4', [0, 3, 4]], ['POWER', 'p'], ['OPEN', 'o'], ['STACKED', 's']];
    const RHY = [['HELD', [[0, 4]]], ['HALVES', [[0, 2], [2, 2]]], ['STABS', [[0, 0.25], [1, 0.25], [2, 0.25], [3, 0.25]]], ['OFFBEAT', [[0.5, 0.4], [1.5, 0.4], [2.5, 0.4], [3.5, 0.4]]],
        ['ENTRANCED GATE', [0, 0.5, 0.75, 1.25, 1.5, 2, 2.5, 2.75, 3.25, 3.5].map(t => [t, 0.22])], ['ARP UP', 'up'], ['ARP DOWN', 'down']];
    const CB = { mood: 1, voice: 0, rhy: 0, oct: 0, bass: 1, bars: 1 };
    function scale7(pr, force) { let nm = force || pr.scale, sc = (NB.SCALES[nm] || NB.SCALES.minor).s; if (sc.length !== 7) sc = NB.SCALES.minor.s; return sc; }
    function chordNotes(pr, deg, vi, force) {
        let sc = scale7(pr, force), base = 48 + ((pr.root || 0) % 12) + CB.oct * 12, at = k => base + sc[((deg + k) % 7 + 7) % 7] + 12 * Math.floor((deg + k) / 7), V = VOICES2[vi][1];
        if (V === 'p') return [at(0), at(4), at(0) + 12];
        if (V === 'o') return [at(0), at(4) + 12, at(2) + 12, at(6) + 12];
        if (V === 's') return [at(0) - 12, at(0), at(2), at(4), at(0) + 12];
        return V.map(k => at(k));
    }
    function chordName(ns) { let r = ns[0], iv = ns.map(n => ((n - r) % 12 + 12) % 12), has = k => iv.indexOf(k) >= 0, q = has(4) ? (has(8) ? '+' : '') : has(3) ? (has(6) ? '°' : 'm') : has(2) ? 'sus2' : has(5) ? 'sus4' : has(7) ? '5' : '';
        return X.ROOTS[((r % 12) + 12) % 12] + q + (has(10) ? '7' : has(11) ? 'maj7' : '') + (iv.length > 4 && has(2) ? '9' : ''); }
    function homeOf(pr, kind) { let sc = (NB.SCALES[pr.scale] || NB.SCALES.minor).s, minorish = sc.indexOf(3) >= 0 && sc.indexOf(4) < 0, M = (pr.root || 0) + (minorish ? 3 : 0); return kind === 'm' ? M + 9 : M; }
    function spelled(pr, kind, ch) {
        let q = QUAL[ch[1]] || QUAL.M, rootPc = ((homeOf(pr, kind) + ch[0]) % 12 + 12) % 12, iv = q[0].slice(), name = X.ROOTS[rootPc] + q[1], V = VOICES2[CB.voice][1];
        if (ch[1] !== '5') {
            if (V === 'p') iv = [0, 7, 12];
            else if (Array.isArray(V) && V[1] === 1) iv = [0, 2, 7].concat(iv.filter(k => k > 7));
            else if (Array.isArray(V) && V[1] === 3 && V.length === 3) iv = [0, 5, 7].concat(iv.filter(k => k > 7));
            else if (Array.isArray(V) && V.length === 5 && iv.indexOf(14) < 0) iv = iv.concat([14]);
        }
        let c = 57 + CB.oct * 12, ns = iv.map(k => { let n = rootPc + k; while (n < c - 6) n += 12; while (n >= c + 7) n -= 12; return n; });
        ns = [...new Set(ns)].sort((a, b) => a - b);
        if (V === 'o') ns = ns.map((n, i) => i % 2 ? n + 12 : n);
        if (V === 's') ns = [ns[0] - 12].concat(ns, [ns[0] + 12]);
        let b = rootPc + 36 + CB.oct * 12; while (b < 40 + CB.oct * 12) b += 12;
        return { ns, name, bass: b };
    }
    function moodSlots(pr, mood) {
        if (mood.h) return [];
        if (typeof mood[1] === 'string') {
            let out = []; mood[2].forEach((ch, k) => { if (Array.isArray(ch[0])) ch.forEach((h, j) => out.push(Object.assign({ at: k + j / ch.length, len: 1 / ch.length }, spelled(pr, mood[1], h)))); else out.push(Object.assign({ at: k, len: 1 }, spelled(pr, mood[1], ch))); });
            return out;
        }
        return mood[1].map((d, k) => { let ns = chordNotes(pr, d, mood[3] ? 1 : CB.voice, mood[2]); return { at: k, len: 1, ns, name: chordName(ns), bass: ns[0] - 12 }; });
    }
    const slotCount = mood => typeof mood[1] === 'string' ? mood[2].length : mood[1].length;
    const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii'];
    function chordBook(box, c, pr) {
        let el = X.el, btn = X.btn, selBox = X.selBox, wrap = el('div', 'nb-cbook');
        let row1 = el('div', 'nb-row'); row1.appendChild(el('span', 'nb-lab', 'THE KEY ' + X.ROOTS[(pr.root || 0) % 12] + ' ' + NB.scaleName(pr.scale || 'minor') + ' ·  click = hear it, shift+click = put it at the cursor'));
        wrap.appendChild(row1);
        let row2 = el('div', 'nb-row nb-cchips');
        for (let d = 0; d < 7; d++) { let ns = chordNotes(pr, d, CB.voice), nm = chordName(ns), q = nm.replace(/^[A-G]#?/, ''), rn = /^m|°/.test(q) ? ROMAN[d] + (q.indexOf('°') >= 0 ? '°' : '') : ROMAN[d].toUpperCase();
            let b = btn(rn + '  ' + nm, 'sm', e => { let L = X.live && X.live(); if (e && e.shiftKey) { X.mark(); let at = RS.at || 0, len = Math.min(CB.bars * pr.sig, clipLenOf(c) - at); if (len > 0) ns.forEach(m => c.notes.push({ t: at, d: len, m, v: 0.8 })); X.touch(); X.showDock(); return; }
                if (L && L.audition && !X.playing()) ns.forEach(m => L.audition(R.tr.uid, m, { d: 1.2, v: 0.75 })); }, 'hear it (shift = put it in at the cursor)');
            row2.appendChild(b); }
        wrap.appendChild(row2);
        let row3 = el('div', 'nb-row');
        row3.appendChild(el('span', 'nb-lab', 'MOOD')); row3.appendChild(selBox(MOODS.map((m, i) => m.h ? ['h' + i, '── ' + m.h + ' ──', 1] : [i, m[0]]), CB.mood, x => { if (/^h/.test(x)) return; CB.mood = +x; X.showDock(); }));
        row3.appendChild(el('span', 'nb-lab', 'VOICED')); row3.appendChild(selBox(VOICES2.map((m, i) => [i, m[0]]), CB.voice, x => { CB.voice = +x; X.showDock(); }));
        row3.appendChild(el('span', 'nb-lab', 'PLAYED')); row3.appendChild(selBox(RHY.map((m, i) => [i, m[0]]), CB.rhy, x => { CB.rhy = +x; }));
        row3.appendChild(el('span', 'nb-lab', 'EACH')); row3.appendChild(selBox([[0.5, '1/2 bar'], [1, '1 bar'], [2, '2 bars']], CB.bars, x => { CB.bars = +x; }));
        row3.appendChild(el('span', 'nb-lab', 'OCTAVE')); row3.appendChild(selBox([[-2, '-2'], [-1, '-1'], [0, '0'], [1, '+1']], CB.oct, x => { CB.oct = +x; X.showDock(); }));
        row3.appendChild(btn(CB.bass ? '☑ BASS NOTE' : '☐ BASS NOTE', 'sm' + (CB.bass ? ' on' : ''), () => { CB.bass = CB.bass ? 0 : 1; X.showDock(); }, 'the root an octave under each chord'));
        wrap.appendChild(row3);
        if (!MOODS[CB.mood] || MOODS[CB.mood].h) CB.mood = 1;
        let mood = MOODS[CB.mood], slots = moodSlots(pr, mood), n = slotCount(mood), names = [];
        slots.forEach(q => { if (q.at % 1) names[names.length - 1] += ' / ' + q.name; else names.push(q.name); });
        let row4 = el('div', 'nb-row'); row4.appendChild(el('span', 'nb-lab', mood[0] + ':  ' + names.join(' → ')));
        row4.appendChild(btn('▶ HEAR', 'sm', () => { let L = X.live && X.live(); if (!L || !L.audition || X.playing()) return; slots.forEach(q => setTimeout(() => q.ns.concat(CB.bass ? [q.bass] : []).forEach(m => L.audition(R.tr.uid, m, { d: 0.75 * q.len * 1.5, v: 0.7 })), q.at * 750)); }, 'plays the progression once'));
        const write = replace => { X.mark(); let sig = pr.sig, each = CB.bars * sig, L = clipLenOf(c), rh = RHY[CB.rhy][1];
            if (replace) { c.notes = []; X.sel.notes = new Set(); }
            for (let k = 0; k * each < L - 1e-6; k++) slots.forEach(q => { if (Math.floor(q.at) !== k % n) return; let ns = q.ns, len = each * q.len, t0 = k * each + (q.at % 1) * each, sc = len / 4;
                if (t0 >= L - 1e-6) return;
                if (rh === 'up' || rh === 'down') { let seq = rh === 'up' ? ns : ns.slice().reverse(), st = 0.25; for (let t = 0; t < len - 1e-6; t += st) c.notes.push({ t: t0 + t, d: st * 0.9, m: seq[Math.round(t / st) % seq.length], v: 0.75 }); }
                else rh.forEach(([t, d]) => { if (t * sc < len) ns.forEach(m => c.notes.push({ t: t0 + t * sc, d: Math.min(d * sc, len - t * sc) * 0.98, m, v: 0.78 })); });
                if (CB.bass) c.notes.push({ t: t0, d: len * 0.98, m: q.bass, v: 0.82 }); });
            X.touch(); X.showDock(); X.flash(names.length + ' chords written, ' + mood[0].toLowerCase()); };
        row4.appendChild(btn('WRITE IT (replace)', 'sm', () => write(true), 'wipes this clip and writes the progression across all of it'));
        row4.appendChild(btn('＋ ADD IT', 'sm', () => write(false), 'writes it on top of whats there'));
        wrap.appendChild(row4); box.appendChild(wrap);
    }
    const clipLenOf = c => c.lp > 0 ? c.lp : c.len;
    X.chordKit = { MOODS, QUAL, ROMAN, CB, chordNotes, chordName, moodSlots, slotCount, rollAt: () => RS.at || 0 };
    X.rollTab = function (box) {
        let sc = X.selClip(), el = X.el, btn = X.btn, selBox = X.selBox;
        R = null;
        if (!sc) {
            let tr = X.trk(X.sel.tr);
            if (tr && NB.isBus(tr)) { box.appendChild(el('div', 'nb-hint', tr.name + ' has no notes of its own. it takes whatever pours in. pick one of the tracks in it to write notes')); box.appendChild(btn('器 what it is + whats in it', 'sm', () => X.setTab('sound'))); return; }
            if (tr && NB.V[tr.inst].kind === 'audio') { box.appendChild(el('div', 'nb-hint', 'pick a clip on the timeline, or drop a sound file onto ' + tr.name + "'s row (double click it to pick one)")); if (window.NBA) box.appendChild(btn('＋ LOAD SOUNDS', 'sm', () => NBA.pickFiles(tr, X.V().cursor || 0))); return; }
            box.appendChild(el('div', 'nb-hint', tr ? 'pick a clip on the timeline, or double click an empty bit of ' + tr.name + "'s row to make one" : 'add a track first (＋ TRACK on the timeline), then double click its row to make a clip'));
            if (tr) box.appendChild(btn('＋ make a one bar clip at the cursor', 'sm', () => { let q = NB.barOf(X.pr, X.V().cursor || 0); X.addClip(tr, q.at, q.n); X.showDock(); }));
            return;
        }
        if (NB.V[sc.tr.inst].kind === 'audio') { if (window.NBA) NBA.clipTab(box, sc.tr, sc.c); return; }
        let { tr, c } = sc, pr = X.pr, kit = tr.inst === 'coffin', v = NB.V[tr.inst], drum = v.kind === 'drum';
        if (RS.clip !== c.uid) { RS.clip = c.uid; RS.ppb = 0; RS.scrolled = false; }
        let bar1 = el('div', 'nb-row'), bar2 = el('div', 'nb-row');
        bar1.style.marginBottom = bar2.style.marginBottom = '5px';
        let nm = el('input', 'nb-in'); nm.value = c.name || ''; nm.placeholder = tr.name; nm.maxLength = 24; nm.oninput = () => { c.name = nm.value; X.save(); X.dirty(); };
        bar1.appendChild(el('span', 'nb-lab', tr.name + ' ›')); bar1.appendChild(nm);
        bar1.appendChild(btn('⟲ REPEAT', 'sm' + (c.lp > 0 ? ' on' : ''), () => { X.mark(); c.lp = c.lp > 0 ? 0 : Math.min(c.len, pr.sig * 4); X.touch(); X.showDock(); }, 'on = what you draw here repeats for as long as the clip is on the timeline'));
        let L0 = c.lp > 0 ? c.lp : c.len, opts = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64].map(b => [b, b % pr.sig === 0 ? (b / pr.sig) + (b === pr.sig ? ' bar' : ' bars') : b + ' beats']);
        if (!opts.some(o => o[0] === L0)) opts.push([L0, L0 + ' beats']);
        bar1.appendChild(el('span', 'nb-lab', c.lp > 0 ? 'REPEAT LENGTH' : 'LENGTH'));
        bar1.appendChild(selBox(opts.sort((a, b) => a[0] - b[0]), L0, x => { X.mark(); if (c.lp > 0) c.lp = +x; else c.len = +x; X.touch(); X.showDock(); }));
        bar1.appendChild(el('span', 'nb-lab', 'GRID')); bar1.appendChild(selBox(GRIDS.map(g => [g[0], g[1]]), pr.grid, x => { pr.grid = +x; X.save(); X.showDock(); }));
        bar1.appendChild(el('span', 'nb-lab', 'NEW NOTE')); bar1.appendChild(selBox(LENS, RS.len, x => { RS.len = x === 'grid' ? 'grid' : +x; }));
        if (!kit && !drum) { bar1.appendChild(selBox(CHORDS, RS.chord, x => { RS.chord = x; })); }
        if (!kit && !drum) {
            bar1.appendChild(btn(SCL[RS.scl], 'sm' + (RS.scl ? ' on' : ''), () => { RS.scl = (RS.scl + 1) % 3; try { localStorage.setItem('vmp_nb_scl', RS.scl); } catch (e) {} X.showDock(); }, 'LIT = the key lights up, the root glows, the keys get numbered 1 to 7 and the mouse shows the chord from that note. FOLD = only the notes in the key are left'));
            bar1.appendChild(selBox(X.ROOTS.map((r, i) => [i, r]), pr.root, x => { X.mark(); pr.root = +x; X.touch(); X.showAll ? X.showAll() : X.showDock(); }));
            bar1.appendChild(selBox(Object.keys(NB.SCALES).map(k => [k, NB.SCALES[k].jp + ' ' + NB.scaleName(k)]), pr.scale, x => { X.mark(); pr.scale = x; X.touch(); X.showAll ? X.showAll() : X.showDock(); }));
        }
        bar1.appendChild(btn('－', 'sm', () => { RS.ppb = Math.max(6, (R ? R.ppb : 40) / 1.4); X.showDock(); }, 'zoom out (ctrl + wheel)'));
        bar1.appendChild(btn('＋', 'sm', () => { RS.ppb = Math.min(300, (R ? R.ppb : 40) * 1.4); X.showDock(); }, 'zoom in'));
        const T = (txt, fn, tip, need) => bar2.appendChild(btn(txt, 'sm', () => { if (!R) return; if (need && !selNotes().length) { X.flash('pick some notes first (click one, or ctrl+drag a box)'); return; } X.mark(); fn(); X.touch(); draw(); X.showDockKeep && X.showDockKeep(); showInsp(); }, tip));
        const S = () => { let s = selNotes(); return s.length ? s : c.notes; };
        bar2.appendChild(btn('ALL', 'sm', () => { c.notes.forEach(n => X.sel.notes.add(n)); draw(); showInsp(); }, 'select everything (ctrl+a)'));
        T('QUANTISE', () => { quant(S(), true); }, 'snap to the grid (q). Q ▾ = how hard, swing, or onto a feel');
        bar2.appendChild(btn('Q ▾', 'sm' + (qSet(pr) ? ' on' : ''), e => qMenu(e.clientX, e.clientY, c), 'how QUANTISE + q pull the notes: how far onto the grid, every other step late, or onto a feel (+ take the feel off this clip)'));
        T('HUMANISE', () => { S().forEach(n => { n.t = Math.max(0, n.t + (Math.random() - 0.5) * pr.grid * 0.18); n.v = X.clamp((n.v != null ? n.v : 0.8) + (Math.random() - 0.5) * 0.18, 0.05, 1); }); }, 'a little bit late, a little bit soft, at random. like hands');
        if (!kit && !drum) T('LEGATO', () => { let s = S().slice().sort((a, b) => a.t - b.t); s.forEach((n, i) => { let nx = s.find(q => q.t > n.t + 1e-6); if (nx) n.d = nx.t - n.t; }); }, 'every note runs into the next');
        T('×2', () => { S().forEach(n => { n.t *= 2; n.d *= 2; }); }, 'twice as long, twice as far apart');
        T('÷2', () => { S().forEach(n => { n.t /= 2; n.d = Math.max(0.03, n.d / 2); }); }, 'half');
        T('REVERSE', () => { let s = S(), a = Math.min.apply(0, s.map(n => n.t)), b = Math.max.apply(0, s.map(n => n.t + n.d)); s.forEach(n => { n.t = a + b - (n.t + n.d); }); }, 'backwards');
        T('▲', () => { selNotes().forEach(n => { n.m = clampM(walk(n.m, kit ? 1 : 1, pr.snap && !kit)); }); }, 'up (arrow up, shift = an octave)', 1);
        T('▼', () => { selNotes().forEach(n => { n.m = clampM(walk(n.m, -1, pr.snap && !kit)); }); }, 'down', 1);
        T('SOFTER', () => { S().forEach(n => { n.v = X.clamp((n.v != null ? n.v : 0.8) - 0.1, 0.05, 1); }); }, 'a bit softer (the picked notes, or all of them)');
        T('HARDER', () => { S().forEach(n => { n.v = X.clamp((n.v != null ? n.v : 0.8) + 0.1, 0.05, 1); }); }, 'a bit harder (the picked notes, or all of them)');
        if (kit || drum) T('FILL ROW', () => { let m = selNotes()[0] ? selNotes()[0].m : (kit ? NB.KITROOT : 60), g = pr.grid, L = clipLen(); for (let t = 0; t < L - 1e-6; t += g) if (!c.notes.some(n => n.m === m && Math.abs(n.t - t) < 1e-6)) c.notes.push({ t, d: g, m, v: 0.8 }); }, 'a hit on every grid step in the row of the picked note');
        T('✂ CHOP', () => { let g = pr.grid, out = []; selNotes().forEach(n => { let k = Math.round(n.d / g); if (k < 2) { out.push(n); return; } let d0 = n.d / k; n.d = d0; out.push(n); for (let i = 1; i < k; i++) { let q = Object.assign({}, n, { t: n.t + i * d0 }); c.notes.push(q); out.push(q); } }); X.sel.notes = new Set(out); }, 'cut the picked notes into grid steps (a long note → a roll of short ones)', 1);
        T('⊕ GLUE', () => { glue(c); }, 'joins picked notes on the same pitch that touch into one long one (ctrl+j)', 1);
        if (!kit && !drum) T('↕ FLIP', () => { let s = selNotes(), lo = Math.min.apply(0, s.map(n => n.m)), hi = Math.max.apply(0, s.map(n => n.m)); s.forEach(n => { let m = lo + hi - n.m; n.m = clampM(pr.snap ? snapNote(m) : m); }); }, 'upside down: the highest note becomes the lowest', 1);
        if (!kit && !drum) T('STRUM', () => { let s = selNotes().slice().sort((a, b) => a.t - b.t || a.m - b.m), by = {}; s.forEach(n => { let k = Math.round(n.t * 1000); (by[k] = by[k] || []).push(n); }); Object.values(by).forEach(list => list.forEach((n, i) => { n.t += i * 0.035; n.d = Math.max(0.03, n.d - i * 0.035); })); }, 'notes that start together come in one after another, low to high, like a hand across strings', 1);
        T('↗', () => { let s = selNotes().slice().sort((a, b) => a.t - b.t); s.forEach((n, i) => { n.v = Math.round((0.25 + 0.75 * (s.length > 1 ? i / (s.length - 1) : 1)) * 100) / 100; }); }, 'louder and louder across the picked notes', 1);
        T('↘', () => { let s = selNotes().slice().sort((a, b) => a.t - b.t); s.forEach((n, i) => { n.v = Math.round((1 - 0.75 * (s.length > 1 ? i / (s.length - 1) : 0)) * 100) / 100; }); }, 'softer and softer', 1);
        if (!kit && !drum) { T('8va▲', () => { selNotes().forEach(n => { n.m = clampM(n.m + 12); }); }, 'up an octave (ctrl+↑)', 1); T('8va▼', () => { selNotes().forEach(n => { n.m = clampM(n.m - 12); }); }, 'down an octave (ctrl+↓)', 1); }
        bar2.appendChild(btn('SAME NOTE', 'sm', () => { let ms = new Set(selNotes().map(n => n.m)); if (!ms.size) { X.flash('pick a note first'); return; } c.notes.forEach(n => { if (ms.has(n.m)) X.sel.notes.add(n); }); draw(); showInsp(); }, 'picks every note on the same row(s) as the ones you picked'));
        T('✕ DELETE', () => { let s = new Set(selNotes()); c.notes = c.notes.filter(n => !s.has(n)); X.sel.notes = new Set(); }, 'gone (del)', 1);
        if (!kit && !drum) bar2.appendChild(btn('♫ CHORDS', 'sm' + (RS.book ? ' on' : ''), () => { RS.book = !RS.book; X.showDock(); }, 'the chord book: the chords that belong to your key, and whole progressions by mood'));
        box.appendChild(bar1); box.appendChild(bar2);
        if (RS.book && !kit && !drum) chordBook(box, c, pr);
        let rb = el('div', 'nb-arrbox'); rb.style.height = kit ? (RULER + 8 * 22 + VELH + 18) + 'px' : '330px';
        rb.innerHTML = '<div class="nb-arrsc"><div class="nb-arrsp"></div></div><canvas class="nb-arrcv"></canvas>';
        box.appendChild(rb);
        let ins = el('div', 'nb-row'); ins.style.marginTop = '6px'; ins.style.minHeight = '58px'; box.appendChild(ins);
        box.appendChild(el('div', 'nb-hint', 'click = note (drag right while you hold = longer) · alt+drag on empty = PAINT notes along the grid · drag a note = move it, its right edge = length · alt+drag a note = copy · ctrl+drag = box select (shift+drag adds to it) · right click = gone, right drag = rub them out · the strip at the bottom = how hard · keys: arrows, ctrl+↑↓ = an octave, del, ctrl+a / c / x / v / d, ctrl+e = cut at where you clicked, ctrl+j = glue, q'));
        R = { tr, c, kit, drum, box: rb, ins, sc: rb.querySelector('.nb-arrsc'), sp: rb.querySelector('.nb-arrsp'), cv: rb.querySelector('.nb-arrcv'), RH: kit ? 20 : 12, top: kit ? NB.KITROOT + tr.snd.drawers.length - 1 : 108, bot: kit ? NB.KITROOT : 12 };
        R.fold = RS.scl === 2 && !kit && !drum; R.lit = RS.scl > 0 && !kit && !drum;
        rowsNow();
        layout();
        if (!RS.scrolled) { RS.scrolled = true; let ns = c.notes.map(n => n.m), mid = ns.length ? (Math.min.apply(0, ns) + Math.max.apply(0, ns)) / 2 : (drum ? 60 : (tr.inst === 'sump' || tr.inst === 'squirm' ? 45 : 64)); R.sc.scrollTop = Math.max(0, rowOf(Math.round(mid)) * R.RH - (R.sc.clientHeight - RULER - VELH) / 2); }
        bind(); draw(); showInsp();
        const fitH = () => { let dk = rb.closest('[data-dock]'); if (!dk || kit || !dk.closest('.nb-fit')) return; let top = rb.getBoundingClientRect().top - dk.getBoundingClientRect().top + dk.scrollTop, rest = ins.offsetHeight + 40;
            let hh = Math.max(170, Math.min(720, Math.round(dk.clientHeight - top - rest))); if (Math.abs(parseFloat(rb.style.height) - hh) > 2) rb.style.height = hh + 'px'; };
        fitH(); { let dk = rb.closest('[data-dock]'); if (dk && window.ResizeObserver) { let ro = new ResizeObserver(() => { if (!rb.isConnected) { ro.disconnect(); return; } fitH(); }); ro.observe(dk); } }
        new (window.ResizeObserver || function () { this.observe = () => {}; })(() => { if (R && R.box.isConnected) { layout(); draw(); } }).observe(rb);
    };
    const clampM = m => R && R.kit ? Math.max(NB.KITROOT, Math.min(NB.KITROOT + R.tr.snd.drawers.length - 1, m)) : Math.max(0, Math.min(127, m));
    const clipLen = () => R.c.lp > 0 ? R.c.lp : R.c.len;
    const selNotes = () => R ? R.c.notes.filter(n => X.sel.notes.has(n)) : [];
    function layout() {
        let w = R.sc.clientWidth || 600, h = R.sc.clientHeight || 300, L = clipLen();
        R.ppb = RS.ppb || Math.max(10, Math.min(160, (w - KEYW - 20) / L)); RS.ppb = RS.ppb || 0;
        R.sp.style.width = (KEYW + L * R.ppb + 20) + 'px'; R.sp.style.height = (RULER + R.rows * R.RH + VELH) + 'px';
        let d = Math.min(2, window.devicePixelRatio || 1);
        R.cv.width = Math.round(w * d); R.cv.height = Math.round(h * d); R.cv.style.width = w + 'px'; R.cv.style.height = h + 'px'; R.w = w; R.h = h; R.d = d;
    }
    const tx = t => KEYW + t * R.ppb - R.sc.scrollLeft;
    const xt = x => (x - KEYW + R.sc.scrollLeft) / R.ppb;
    function rowsNow() {
        let rl = [], pr = X.pr, used = R.fold ? new Set(R.c.notes.map(n => n.m)) : null;
        for (let m = R.top; m >= R.bot; m--) if (!R.fold || NB.inScale(pr, m) || used.has(m)) rl.push(m);
        let ch = !R.rl || R.rl.length !== rl.length; R.rl = rl; R.rows = rl.length; R.ix = new Map(rl.map((m, i) => [m, i])); return ch;
    }
    function rowOf(m) { if (R.ix.has(m)) return R.ix.get(m); let i = 0; while (i < R.rl.length && R.rl[i] > m) i++; return Math.min(R.rl.length - 1, i); }
    const my = m => RULER + rowOf(m) * R.RH - R.sc.scrollTop;
    const ym = y => { let i = Math.floor((y - RULER + R.sc.scrollTop) / R.RH); return i < 0 ? R.rl[0] + (R.fold ? 0 : -i) : i >= R.rl.length ? R.rl[R.rl.length - 1] - (R.fold ? 0 : i - R.rl.length + 1) : R.rl[i]; };
    function draw() {
        if (!R || !R.cv.isConnected || !X.V()) return;
        if (R.fold && rowsNow()) layout();
        let x = R.cv.getContext('2d'), pr = X.pr, w = R.w, h = R.h, c = R.c, L = clipLen(), gh = h - VELH, A = R.tr.col, ink = (X.tv && X.tv('--ink')) || '#eee';
        x.setTransform(R.d, 0, 0, R.d, 0, 0); x.fillStyle = '#0a080b'; x.fillRect(0, 0, w, h);
        x.save(); x.beginPath(); x.rect(KEYW, RULER, w - KEYW, gh - RULER); x.clip();
        let tones = R.lit && R.hov ? tonesFrom(R.hov.m) : null, toneAt = tones ? new Map(tones.map(q => [q[0], q[1]])) : null;
        R.rl.forEach(m => {
            let y = my(m); if (y > gh || y + R.RH < RULER) return;
            let inK = R.kit || NB.inScale(pr, m), root = !R.kit && ((m - pr.root) % 12 + 12) % 12 === 0;
            if (!R.lit) { x.fillStyle = root ? '#2a1a26' : inK ? '#18131b' : '#0d0a0e'; x.fillRect(KEYW, y, w, R.RH); }
            else {
                x.fillStyle = inK ? '#1f1824' : '#070508'; x.fillRect(KEYW, y, w, R.RH);
                if (root) { x.fillStyle = A; x.globalAlpha = 0.2; x.fillRect(KEYW, y, w, R.RH); x.globalAlpha = 0.7; x.fillRect(KEYW, y + R.RH - 1, w, 1); x.globalAlpha = 1; }
                if (!inK) { x.strokeStyle = 'rgba(255,255,255,0.025)'; x.lineWidth = 1; x.beginPath(); for (let k = KEYW - (R.sc.scrollLeft % 8); k < w; k += 8) { x.moveTo(k, y + R.RH); x.lineTo(k + R.RH, y); } x.stroke(); }
                if (toneAt && toneAt.has(m)) { let lab = toneAt.get(m); x.fillStyle = lab === '1' ? '#fff' : A; x.globalAlpha = lab === '7' ? 0.07 : 0.13; x.fillRect(KEYW, y, w, R.RH); x.globalAlpha = 1; }
            }
            x.fillStyle = 'rgba(255,255,255,0.035)'; x.fillRect(KEYW, y + R.RH - 1, w, 1);
        });
        let g = pr.grid, sig = pr.sig;
        for (let t = 0; t <= L + 1e-6; t += g) { let X0 = tx(t); if (X0 < KEYW - 1 || X0 > w) continue; let onBar = pr.sigs.length ? Math.abs(NB.barOf(pr, c.at + t).at - (c.at + t)) < 1e-6 : Math.abs(t / sig - Math.round(t / sig)) < 1e-6, onBeat = Math.abs(t - Math.round(t)) < 1e-6; x.fillStyle = onBar ? 'rgba(255,255,255,0.25)' : onBeat ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.04)'; x.fillRect(Math.round(X0), RULER, 1, gh); }
        x.fillStyle = 'rgba(0,0,0,0.55)'; x.fillRect(tx(L), RULER, w, gh);
        let lyr = null;
        if (R.tr.inst === 'uta' && c.ly) { let Ls = NB.lyricsOf(c.ly), k = 0; lyr = new Map(); c.notes.slice().sort((a, b) => a.t - b.t || b.m - a.m).forEach(n => { let y = Ls.length ? Ls[k++ % Ls.length] : null; if (y) lyr.set(n, y[0] === 'Q' ? '·' : y[0] === 'L' ? 'ー' : y[0] === 'N' ? 'n' : y[0] + y[1]); }); }
        c.notes.forEach(n => {
            let y = my(n.m), X0 = tx(n.t), nw = Math.max(3, n.d * R.ppb - 1), s = X.sel.notes.has(n);
            if (y > gh || y + R.RH < RULER || X0 > w || X0 + nw < KEYW) return;
            let g = x.createLinearGradient(0, y + 1, 0, y + R.RH - 1); g.addColorStop(0, '#fff'); g.addColorStop(0.18, A); g.addColorStop(1, A);
            x.globalAlpha = 0.45 + (n.v != null ? n.v : 0.8) * 0.55; x.fillStyle = g; x.beginPath(); if (x.roundRect) x.roundRect(X0, y + 1, nw, R.RH - 2, 2.5); else x.rect(X0, y + 1, nw, R.RH - 2); x.fill();
            x.globalAlpha = 1; x.strokeStyle = 'rgba(0,0,0,0.55)'; x.lineWidth = 1; x.stroke();
            x.fillStyle = 'rgba(255,255,255,0.65)'; x.fillRect(X0 + 1, y + 2, 2, R.RH - 4);
            if (lyr && lyr.has(n)) { x.fillStyle = '#fff'; x.font = 'bold 10px Courier New'; x.shadowColor = '#000'; x.shadowBlur = 3; x.fillText(lyr.get(n), X0 + 4, y - 2); x.shadowBlur = 0; }
            if (nw > 26 && R.RH >= 12 && !R.kit) { x.fillStyle = 'rgba(0,0,0,0.7)'; x.font = 'bold 8px Courier New'; x.fillText(X.noteName(n.m), X0 + 5, y + R.RH - 3); }
            if (n.p != null && n.p < 100) { x.fillStyle = '#000'; x.font = '8px Courier New'; x.fillText(n.p + '%', X0 + 3, y + R.RH - 3); }
            if (n.sl) { x.fillStyle = '#fff'; x.fillRect(X0 - 4, y + R.RH / 2 - 1, 6, 2); }
            if (n.ac) { x.fillStyle = '#fff'; x.beginPath(); x.arc(X0 + nw - 4, y + 4, 2, 0, 7); x.fill(); }
            if (n.L && Object.keys(n.L).length) { x.fillStyle = '#ffe36d'; x.fillRect(X0 + nw - 6, y + R.RH - 4, 4, 3); }
            if (s) { x.strokeStyle = '#fff'; x.lineWidth = 1.4; x.shadowColor = '#fff'; x.shadowBlur = 6; x.strokeRect(X0 + 0.5, y + 1.5, nw - 1, R.RH - 3); x.shadowBlur = 0; }
        });
        if (tones && R.hov.t >= 0 && R.hov.t < L) {
            let g0 = pr.grid, t0 = Math.floor(R.hov.t / g0 + 1e-6) * g0, X0 = tx(t0), nw = Math.max(8, (RS.len === 'grid' ? g0 : RS.len) * R.ppb - 1);
            x.font = 'bold 9px Courier New';
            tones.forEach(([m, lab]) => { let y = my(m); if (m > R.top || m < R.bot || (R.fold && !R.ix.has(m))) return; x.setLineDash(lab === '7' ? [2, 3] : []); x.strokeStyle = lab === '1' ? '#fff' : A; x.globalAlpha = lab === '7' ? 0.45 : 0.85; x.lineWidth = 1.2; x.strokeRect(X0 + 0.5, y + 1.5, nw - 1, R.RH - 3); x.fillStyle = x.strokeStyle; x.fillText(lab, X0 + nw + 3, y + R.RH - 3); });
            x.setLineDash([]); x.globalAlpha = 1;
            let nm = chordName(tones.slice(0, 3).map(q => q[0])); x.fillStyle = '#fff'; x.font = 'bold 10px Courier New'; x.shadowColor = '#000'; x.shadowBlur = 4; x.fillText(nm, X0 + 2, my(tones[2][0]) - 3); x.shadowBlur = 0;
        }
        if (R.box2) { let b = R.box2; x.fillStyle = 'rgba(255, 255, 255, 0.07)'; x.fillRect(Math.min(b.x0, b.x1), Math.min(b.y0, b.y1), Math.abs(b.x1 - b.x0), Math.abs(b.y1 - b.y0)); x.strokeStyle = '#fff'; x.setLineDash([3, 3]); x.strokeRect(Math.min(b.x0, b.x1), Math.min(b.y0, b.y1), Math.abs(b.x1 - b.x0), Math.abs(b.y1 - b.y0)); x.setLineDash([]); }
        x.restore();
        x.save(); x.beginPath(); x.rect(0, RULER, KEYW, gh - RULER); x.clip();
        for (const m of R.rl) {
            let y = my(m); if (y > gh || y + R.RH < RULER) continue;
            if (R.kit) { let dr = R.tr.snd.drawers[m - NB.KITROOT]; x.fillStyle = '#1b161e'; x.fillRect(0, y, KEYW - 2, R.RH - 1); x.fillStyle = ink; x.font = 'bold 10px Courier New'; x.fillText((dr ? dr.name : '?').slice(0, 7), 4, y + 15); continue; }
            let blk = [1, 3, 6, 8, 10].indexOf(((m % 12) + 12) % 12) !== -1;
            if (R.fold) {
                let dg = degOf(pr, m); x.fillStyle = dg === 1 ? A : dg ? '#cfc8d4' : '#3a2a30'; x.fillRect(0, y, KEYW - 2, R.RH - 1);
                x.fillStyle = dg === 1 ? '#000' : '#1a1218'; x.font = 'bold 9px Courier New'; x.fillText(X.noteName(m), 4, y + R.RH - 2); if (dg) x.fillText(String(dg), KEYW - 12, y + R.RH - 2); continue;
            }
            if (R.lit && !NB.inScale(pr, m)) x.globalAlpha = 0.3;
            x.fillStyle = blk ? '#141016' : '#cfc8d4'; x.fillRect(0, y, blk ? KEYW * 0.62 : KEYW - 2, R.RH - 1); x.globalAlpha = 1;
            if (R.lit) { let dg = degOf(pr, m); if (dg) { x.fillStyle = dg === 1 ? A : blk ? '#cfc8d4' : '#5a3a4a'; x.beginPath(); x.arc(KEYW - 8, y + R.RH / 2, dg === 1 ? 4 : 3, 0, 7); x.fill(); if (R.RH >= 11) { x.fillStyle = blk ? '#ddd' : '#2a1a26'; x.font = 'bold 8px Courier New'; x.fillText(String(dg), 4, y + R.RH - 3); } } }
            if (m % 12 === 0) { x.fillStyle = '#2a1a26'; x.font = '9px Courier New'; x.fillText(X.noteName(m), KEYW - 26 - (R.lit ? 4 : 0), y + R.RH - 2); }
        }
        x.restore();
        x.fillStyle = '#100c12'; x.fillRect(0, 0, w, RULER); x.fillStyle = ink; x.font = '9px Courier New';
        for (let b = 0; b <= L; b++) { let X0 = tx(b); if (X0 < KEYW || X0 > w) continue; x.globalAlpha = b % sig === 0 ? 0.9 : 0.4; x.fillRect(X0, 10, 1, 8); if (b % sig === 0 || R.ppb > 30) x.fillText(b % sig === 0 ? String(b / sig + 1) : '.' + (b % sig + 1), X0 + 2, 9); }
        x.globalAlpha = 1;
        if (R.lit) {
            let st = new Map(); c.notes.forEach(n => { let k = Math.round(n.t * 64); if (!st.has(k)) st.set(k, []); st.get(k).push(n.m); });
            x.font = 'bold 9px Courier New'; x.fillStyle = '#ffe36d';
            st.forEach((ms, k) => { if (ms.length < 3) return; let X0 = tx(k / 64); if (X0 < KEYW || X0 > w - 10) return; ms.sort((a, b) => a - b); x.fillText(chordName(ms.filter((q, i) => i === 0 || q !== ms[i - 1])), X0 + 3, 17); });
        }
        let sm = stripMode();
        x.fillStyle = '#08060a'; x.fillRect(0, gh, w, VELH); x.fillStyle = ink; x.globalAlpha = 0.5; x.fillText(TL(SNAME[sm]), 4, gh + 14); x.globalAlpha = 0.35; x.fillText('▸ ' + TL('click'), 4, gh + 27);
        if (sm === 'pb') { x.globalAlpha = 0.6; x.fillText('±' + (R.tr.pbr || 2) + ' ▾', 4, gh + 44); } x.globalAlpha = 1;
        x.save(); x.beginPath(); x.rect(KEYW, gh, w - KEYW, VELH); x.clip();
        if (sm === 'c') c.notes.forEach(n => { let X0 = tx(n.t), p = n.p != null ? n.p : 100, vh = p / 100 * (VELH - 8); x.fillStyle = X.sel.notes.has(n) ? '#fff' : '#ffe36d'; x.globalAlpha = p < 100 ? 0.95 : 0.35; x.fillRect(X0, gh + VELH - 3 - vh, Math.max(2, Math.min(8, n.d * R.ppb - 2)), Math.max(1, vh)); x.globalAlpha = 1; });
        else if (sm === 'pb' || sm === 'mw') { let P = c[sm] || [], mid = sm === 'pb' ? gh + VELH / 2 : gh + VELH - 3, sc = sm === 'pb' ? (VELH - 10) / 2 : VELH - 8, Y = v => mid - v * sc;
            if (sm === 'pb') { x.strokeStyle = 'rgba(255,255,255,0.12)'; x.beginPath(); x.moveTo(KEYW, mid); x.lineTo(w, mid); x.stroke(); }
            x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(tx(L), gh, w, VELH);
            if (P.length) { x.strokeStyle = sm === 'pb' ? '#6dd3ff' : '#c08bff'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(tx(0), Y(P[0][1])); P.forEach(q => x.lineTo(tx(Math.min(L, q[0])), Y(q[1]))); x.lineTo(tx(L), Y(P[P.length - 1][1])); x.stroke();
                x.fillStyle = x.strokeStyle; P.forEach(q => { if (q[0] <= L) x.fillRect(tx(q[0]) - 1.5, Y(q[1]) - 1.5, 3, 3); }); }
            else { x.fillStyle = ink; x.globalAlpha = 0.35; x.fillText(TL(sm === 'pb' ? 'drag here = bend the whole track up + down' : 'drag here = how much it shivers'), KEYW + 8, gh + 30); x.globalAlpha = 1; } }
        else if (sm === 'v') c.notes.forEach(n => { let X0 = tx(n.t), vh = (n.v != null ? n.v : 0.8) * (VELH - 8); x.fillStyle = X.sel.notes.has(n) ? '#fff' : A; x.fillRect(X0, gh + VELH - 3 - vh, Math.max(2, Math.min(8, n.d * R.ppb - 2)), vh); });
        else { let mid = sm === 'b' ? gh + VELH / 2 : gh + VELH - 3, sc = sm === 'b' ? (VELH - 10) / 2 : VELH - 8; if (sm === 'b') { x.strokeStyle = 'rgba(255,255,255,0.12)'; x.beginPath(); x.moveTo(KEYW, mid); x.lineTo(w, mid); x.stroke(); }
            c.notes.forEach(n => { let a = n.e && n.e[sm], X0 = tx(n.t), X1 = tx(n.t + n.d); x.strokeStyle = X.sel.notes.has(n) ? '#fff' : A; x.fillStyle = x.strokeStyle; x.globalAlpha = a ? 1 : 0.3; x.lineWidth = 1.5; x.beginPath();
                for (let j = 0; j < 8; j++) { let yy = mid - (a ? a[j] : 0) * sc, xx = X0 + (X1 - X0) * j / 7; if (j) x.lineTo(xx, yy); else x.moveTo(xx, yy); } x.stroke(); x.fillRect(X0, mid - 1, 2, 2); x.globalAlpha = 1; }); }
        x.restore();
        R.drawn = true;
    }
    X.rollDraw = draw;
    X.rollFrame = function () {
        if (!R || !R.cv.isConnected) return;
        let L = X.live(); if (!L || !X.playing()) { if (R.ph) { R.ph = null; draw(); } return; }
        let p = L.pos(); if (p == null) return;
        let c = R.c; if (p < c.at || p >= c.at + c.len) { if (R.ph) { R.ph = null; draw(); } return; }
        let lt = p - c.at + c.off; if (c.lp > 0) lt = ((lt % c.lp) + c.lp) % c.lp;
        R.ph = lt; draw();
        let x = R.cv.getContext('2d'), X0 = tx(lt); if (X0 >= KEYW) { x.fillStyle = '#fff'; x.fillRect(X0, 0, 1.5, R.h); }
    };
    const EJ = new WeakMap();
    const SNAME = { v: 'HOW HARD', c: 'CHANCE', pb: '撓 BEND', mw: '震 SHIVER', b: 'NOTE BEND', p: 'PRESS', s: 'SLIDE' };
    const sModes = () => R && R.tr && R.tr.inst === 'serpent' ? ['v', 'c', 'pb', 'mw', 'b', 'p', 's'] : R && (R.kit || R.drum) ? ['v', 'c', 'pb'] : ['v', 'c', 'pb', 'mw'];
    const stripMode = () => { let m = RS.strip || 'v'; return sModes().indexOf(m) >= 0 ? m : 'v'; };
    const PBR = [1, 2, 3, 5, 7, 12, 24];
    const qSet = pr => { let Q = pr.qz || {}; return (Q.s != null && Q.s < 1) || Q.sw > 0 || !!Q.g; };
    function quant(list, ends) {
        let pr = X.pr, Q = pr.qz || {}, g = pr.grid, st = Q.s == null ? 1 : Q.s, sw = Q.sw || 0, G = Q.g ? NB.grooveOf(pr, Q.g) : null;
        if (!qSet(pr)) { list.forEach(n => { n.t = Math.round(n.t / g) * g; if (ends) n.d = Math.max(g, Math.round(n.d / g) * g); }); return; }
        list.forEach(n => {
            let k = Math.round(n.t / g), to = k * g;
            if (sw && ((k % 2) + 2) % 2 === 1) to += sw * g * 0.66;
            if (G) { let k16 = Math.round(to * 4); if (Math.abs(to * 4 - k16) < 1e-6) { let i = ((k16 % 16) + 16) % 16; to += G.t[i] * 0.25; if (Q.gv) n.v = X.clamp(Math.round((n.v != null ? n.v : 0.8) * (1 + (G.v[i] - 1) * st) * 100) / 100, 0.05, 1); } }
            let nt = Math.max(0, n.t + (to - n.t) * st);
            if (ends) { let e = n.t + n.d, ke = Math.round(e / g) * g, ne = e + (ke - e) * st; n.d = Math.max(0.03, Math.round((ne - nt) * 1e4) / 1e4); }
            n.t = Math.round(nt * 1e4) / 1e4;
        });
    }
    function takeFeel(c, notes, name) {
        let off = new Array(16).fill(0), n16 = new Array(16).fill(0), vs = new Array(16).fill(0);
        notes.forEach(n => { let k = Math.round(n.t * 4), o = n.t * 4 - k; if (Math.abs(o) > 0.49) return; let i = ((k % 16) + 16) % 16; off[i] += o; vs[i] += n.v != null ? n.v : 0.8; n16[i]++; });
        if (n16.filter(x => x).length < 2) return null;
        let va = vs.map((x, i) => n16[i] ? x / n16[i] : 0), top = Math.max.apply(0, va) || 1;
        return { id: NB.uid('g'), en: String(name || 'taken').slice(0, 20), jp: '盗', t: off.map((x, i) => n16[i] ? Math.round(x / n16[i] * 1000) / 1000 : 0), v: va.map(x => x ? Math.round(x / top * 1000) / 1000 : 1) };
    }
    const feelName = (pr, k) => { let G = NB.grooveOf(pr, k); return !G ? 'the grid' : G.jp === '盗' ? '盗「' + G.en + '」' : G.jp + ' ' + G.en; };
    function qMenu(px, py, c) {
        let pr = X.pr, Q = pr.qz = pr.qz || { s: 1, sw: 0, g: '', gv: 0 }, st = Q.s == null ? 1 : Q.s;
        const set = (k, v) => () => { Q[k] = v; X.save(); X.showDock(); };
        let items = [{ head: 'QUANTISE · how far onto it' }].concat([1, 0.75, 0.5, 0.25].map(v => [Math.round(v * 100) + '%' + (v === 1 ? ' (all the way)' : ''), set('s', v), { on: Math.abs(st - v) < 1e-6 }]),
            [{ head: 'SWING · every other step late' }], [0, 0.25, 0.5, 0.75].map(v => [v ? Math.round(v * 100) + '%' : 'none', set('sw', v), { on: Math.abs((Q.sw || 0) - v) < 1e-6 }]),
            [{ head: 'onto a FEEL' }, ['the grid', set('g', ''), { on: !Q.g }]], Object.keys(NB.GROOVES).filter(k => k !== 'none').map(k => [NB.GROOVES[k].jp + ' ' + NB.GROOVES[k].en, set('g', k), { on: Q.g === k }]),
            (pr.grooves || []).map(G => ['盗「' + G.en + '」', set('g', G.id), { on: Q.g === G.id, raw: 1 }]),
            [[Q.gv ? 'the feel moves how hard too (on)' : 'the feel moves how hard too (off)', set('gv', Q.gv ? 0 : 1), { on: !!Q.gv }], '-',
            ['盗 take the feel off this clip', () => { let sel = X.sel.notes.size ? [...X.sel.notes] : c.notes, G = takeFeel(c, sel, c.name || R.tr.name); if (!G) { X.flash('needs notes in at least two places of the bar to take a feel off'); return; }
                X.mark(); (pr.grooves = pr.grooves || []).push(G); Q.g = G.id; X.touch(); X.showAll(); X.flash('taken: 「' + G.en + '」 · its a FEEL now: here, on the top bar, + on any track'); }]],
            (pr.grooves || []).map(G => [window.NBL && NBL.mode() === 'jp' ? '✕ 盗「' + G.en + '」を忘れる' : '✕ forget 盗「' + G.en + '」', () => { X.mark(); pr.grooves = pr.grooves.filter(q => q !== G); if (pr.groove === G.id) pr.groove = 'none'; if (Q.g === G.id) Q.g = ''; pr.tracks.forEach(t => { if (t.groove === G.id) t.groove = ''; }); X.touch(); X.showAll(); }, { raw: 1 }]));
        X.menu(px, py, items);
    }
    function hitNote(t, m) { let c = R.c; for (let i = c.notes.length - 1; i >= 0; i--) { let n = c.notes[i]; if (n.m === m && t >= n.t - 1e-6 && t < n.t + n.d) return n; } return null; }
    function bind() {
        let cv = R.cv, act = null;
        const at = p => { let r = cv.getBoundingClientRect(), x = p.x - r.left, y = p.y - r.top; return { x, y, t: xt(x), m: ym(y), vel: y > R.h - VELH, keys: x < KEYW, ruler: y < RULER, alt: !!R.alt }; };
        cv.addEventListener('mousedown', e => { R.alt = e.altKey; }, true);
        X.drag(cv, p => {
            let a = at(p), c = R.c, pr = X.pr, g = pr.grid; X.V().focus = 'roll'; act = null;
            if (a.ruler) return false;
            if (a.keys && !a.vel) { X.hear(R.tr.uid, clampM(a.m)); return false; }
            if (a.vel && a.keys) { let sm = stripMode(); if (sm === 'pb' && a.y > R.h - VELH + 32) { X.mark(); let i = PBR.indexOf(R.tr.pbr || 2); R.tr.pbr = PBR[(i + 1) % PBR.length]; X.touch(); X.flash('撓 BEND reaches ±' + R.tr.pbr + ' semitones'); draw(); return false; }
                let o = sModes(), i = o.indexOf(sm); RS.strip = o[(i + 1) % o.length]; draw(); return false; }
            if (a.vel) { X.mark(); let sm = stripMode(); act = { k: 'vel', sm };
                if (sm === 'pb' || sm === 'mw') { if (a.alt) { delete R.c[sm]; NB.touch(X.pr); draw(); return; } act.last = null; laneSet(a, act); }
                else if (sm === 'v') velSet(a); else if (sm === 'c') chanceSet(a); else exSet(a, true); return; }
            if (a.t < 0 || a.t > clipLen()) return false;
            let n = hitNote(a.t, a.m);
            RS.at = a.t;
            // box select. shift adds to it
            if (p.ctrl) { if (!p.shift) X.sel.notes = new Set(); act = { k: 'box', x0: a.x, y0: a.y }; draw(); return; }
            if (n) {
                X.mark();
                if (p.shift) { if (X.sel.notes.has(n)) X.sel.notes.delete(n); else X.sel.notes.add(n); draw(); showInsp(); return false; }
                if (!X.sel.notes.has(n)) { X.sel.notes = new Set([n]); }
                if (p.alt) { let cp = selNotes().map(q => Object.assign({}, q, { L: q.L ? Object.assign({}, q.L) : undefined })); c.notes.push(...cp); X.sel.notes = new Set(cp); n = cp[0]; }
                let edge = tx(n.t + n.d) - a.x < 6;
                act = { k: edge ? 'size' : 'move', t0: a.t, m0: a.m, orig: selNotes().map(q => [q, q.t, q.m, q.d]) };
                X.hear(R.tr.uid, n.m, n); draw(); showInsp(); return;
            }
            if (p.shift) { act = { k: 'box', x0: a.x, y0: a.y }; return; }
            if (p.alt) { X.mark(); act = { k: 'paint', made: [] }; paint(a, act); return; }
            X.mark();
            let t = Math.max(0, Math.floor(a.t / g + 1e-6) * g), d = RS.len === 'grid' ? g : RS.len, ms = R.kit || R.drum ? [clampM(a.m)] : chordAt(a.m).map(clampM);
            d = Math.min(d, clipLen() - t);
            let made = ms.map(m => ({ t, d: Math.max(0.03, d), m, v: 0.8 }));
            c.notes.push(...made); X.sel.notes = new Set(made);
            act = { k: 'size', t0: a.t, orig: made.map(q => [q, q.t, q.m, q.d]), fresh: true };
            X.hear(R.tr.uid, made[0].m, { d, v: 0.8 }); NB.touch(X.pr); draw(); showInsp();
        }, p => {
            if (!act) return;
            let a = at(p), pr = X.pr, g = p.shift ? 0 : pr.grid, L = clipLen();
            if (act.k === 'vel') { let sm = act.sm; if (sm === 'pb' || sm === 'mw') { if (!a.alt) laneSet(a, act); } else if (sm === 'v') velSet(a); else if (sm === 'c') chanceSet(a); else exSet(a); return; }
            if (act.k === 'box') { R.box2 = { x0: act.x0, y0: act.y0, x1: a.x, y1: a.y }; draw(); return; }
            if (act.k === 'paint') { paint(a, act); return; }
            let dt = a.t - act.t0, dts = g ? Math.round(dt / g) * g : dt;
            if (act.k === 'move') {
                let dm = a.m - act.m0, dr = rowOf(a.m) - rowOf(act.m0), minT = Math.min.apply(0, act.orig.map(o => o[1]));
                dts = Math.max(-minT, dts);
                act.orig.forEach(([n, t0, m0, d0]) => { n.t = Math.min(L - Math.min(d0, L) , Math.max(0, t0 + dts)); let m = R.fold ? R.rl[Math.max(0, Math.min(R.rl.length - 1, rowOf(m0) + dr))] : clampM(m0 + dm); if (pr.snap && !R.kit && !R.drum) m = snapNote(m); if (m !== n.m && act.orig[0][0] === n) X.hear(R.tr.uid, m, n); n.m = m; });
            } else if (act.k === 'size') {
                act.orig.forEach(([n, t0, m0, d0]) => { n.d = Math.max(g || 0.03, Math.min(L - n.t, (act.fresh ? (g ? Math.max(g, Math.ceil((a.t - n.t) / g - 1e-6) * g) : a.t - n.t) : d0 + dts))); if (act.fresh) RS.lastLen = n.d; });
            }
            NB.touch(X.pr); draw();
        }, () => {
            if (!act) return;
            if (act.k === 'box' && R.box2) {
                let b = R.box2, t0 = xt(Math.min(b.x0, b.x1)), t1 = xt(Math.max(b.x0, b.x1)), m0 = ym(Math.max(b.y0, b.y1)), m1 = ym(Math.min(b.y0, b.y1));
                R.c.notes.forEach(n => { if (n.m >= m0 && n.m <= m1 && n.t + n.d > t0 && n.t < t1) X.sel.notes.add(n); });
                R.box2 = null; draw(); showInsp();
            }
            if (act.k === 'paint') X.sel.notes = new Set(act.made);
            if (act.k !== 'box') { X.touch(); showInsp(); }
            act = null;
        });
        function paint(a, act) {
            let g = X.pr.grid, L = clipLen(), t = Math.floor(a.t / g + 1e-6) * g, m = clampM(a.m); if (t < 0 || t >= L - 1e-6) return;
            if (X.pr.snap && !R.kit && !R.drum) m = snapNote(m);
            if (R.c.notes.some(n => n.m === m && Math.abs(n.t - t) < 1e-6)) return;
            let d = Math.min(RS.len === 'grid' ? g : Math.min(+RS.len, g), L - t), n = { t, d: Math.max(0.03, d), m, v: 0.8 }; R.c.notes.push(n); act.made.push(n);
            if (act.made.length === 1 || act.made.length % 4 === 0) X.hear(R.tr.uid, m, n); NB.touch(X.pr); draw();
        }
        cv.addEventListener('mousedown', e => {
            if (e.button !== 2) return; let rub = null;
            { let a0 = at({ x: e.clientX, y: e.clientY }), sm = stripMode(); if (a0.vel) { if (a0.keys || (sm !== 'pb' && sm !== 'mw')) return;
                const mv = ev => { let a = at({ x: ev.clientX, y: ev.clientY }), P = R.c[sm]; if (!P) return; let k = P.filter(q => Math.abs(tx(q[0]) - a.x) > 5); if (k.length === P.length) return; if (!rub) { rub = 1; X.mark(); } if (k.length) R.c[sm] = k; else delete R.c[sm]; NB.touch(X.pr); draw(); };
                const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); if (rub) X.touch(); };
                mv(e); document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up); return; } }
            const mv = ev => { let a = at({ x: ev.clientX, y: ev.clientY }), n = hitNote(a.t, a.m); if (!n) return; if (!rub) { rub = 0; X.mark(); } R.c.notes = R.c.notes.filter(q => q !== n); X.sel.notes.delete(n); rub++; NB.touch(X.pr); draw(); };
            const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); if (rub) { X.touch(); showInsp(); } };
            document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
        });
        function exSet(a, first) {
            let sm = stripMode(), s = selNotes(), pool = s.length ? s : R.c.notes, gh = R.h - VELH, v = sm === 'b' ? X.clamp((gh + VELH / 2 - a.y) / ((VELH - 10) / 2), -1, 1) : X.clamp((gh + VELH - 3 - a.y) / (VELH - 8), 0, 1);
            if (sm === 'b' && Math.abs(v) < 0.04) v = 0;
            pool.forEach(n => { let X0 = tx(n.t), X1 = tx(n.t + n.d); if (a.x < X0 - 2 || a.x > X1 + 2) return; n.e = n.e || {};
                if (a.alt) { delete n.e[sm]; if (!Object.keys(n.e).length) delete n.e; return; }
                let arr = n.e[sm] || (n.e[sm] = [0, 0, 0, 0, 0, 0, 0, 0]), j = Math.max(0, Math.min(7, Math.round((a.x - X0) / Math.max(1, X1 - X0) * 7)));
                let lj = EJ.get(n); if (!first && lj != null && lj !== j) { let d = Math.sign(j - lj), from = arr[lj]; for (let q = lj + d; q !== j; q += d) arr[q] = Math.round((from + (v - from) * (q - lj) / (j - lj)) * 100) / 100; }
                arr[j] = Math.round(v * 100) / 100; EJ.set(n, j); });
            NB.touch(X.pr); draw();
        }
        function chanceSet(a) {
            let s = selNotes(), pool = s.length ? s : R.c.notes, v = X.clamp(1 - (a.y - (R.h - VELH) - 3) / (VELH - 8), 0, 1), p = Math.round(v * 100);
            pool.forEach(n => { let X0 = tx(n.t); if (a.x >= X0 - 2 && a.x <= X0 + Math.max(6, Math.min(10, n.d * R.ppb))) { if (p >= 100) delete n.p; else n.p = p; } });
            NB.touch(X.pr); draw();
        }
        function laneSet(a, act) {
            let key = act.sm, L = clipLen(), t = Math.round(X.clamp(a.t, 0, L) * 1000) / 1000, gh = R.h - VELH, v;
            if (key === 'pb') { v = X.clamp((gh + VELH / 2 - a.y) / ((VELH - 10) / 2), -1, 1); if (Math.abs(v) < 0.04) v = 0; } else v = X.clamp((gh + VELH - 3 - a.y) / (VELH - 8), 0, 1);
            let P = R.c[key] || (R.c[key] = []), lo = act.last == null ? t - 3 / R.ppb : Math.min(act.last, t), hi = act.last == null ? t + 3 / R.ppb : Math.max(act.last, t);
            R.c[key] = P.filter(q => q[0] < lo - 1e-6 || q[0] > hi + 1e-6 || (act.last != null && Math.abs(q[0] - act.last) < 1e-6 && Math.abs(q[0] - t) > 1e-6)).concat([[t, Math.round(v * 100) / 100]]).sort((p1, p2) => p1[0] - p2[0]);
            act.last = t; NB.touch(X.pr); draw();
        }
        function velSet(a) {
            let s = selNotes(), pool = s.length ? s : R.c.notes, v = X.clamp(1 - (a.y - (R.h - VELH) - 3) / (VELH - 8), 0.05, 1);
            pool.forEach(n => { let X0 = tx(n.t); if (a.x >= X0 - 2 && a.x <= X0 + Math.max(6, Math.min(10, n.d * R.ppb))) n.v = Math.round(v * 100) / 100; });
            NB.touch(X.pr); draw();
        }
        cv.addEventListener('contextmenu', e => {
            e.preventDefault(); let a = at({ x: e.clientX, y: e.clientY });
            if (a.vel && a.keys) { X.menu(e.clientX, e.clientY, sModes().map(m => [SNAME[m], () => { RS.strip = m; draw(); }, { on: stripMode() === m }]).concat(stripMode() === 'pb' ? ['-'].concat(PBR.map(r => ['±' + r + ' semitones', () => { X.mark(); R.tr.pbr = r; X.touch(); draw(); }, { on: (R.tr.pbr || 2) === r }])) : [])); return; }
            if (a.vel) return;
            let n = hitNote(a.t, a.m); if (!n) return;
            X.mark(); let kill = X.sel.notes.has(n) ? new Set(selNotes()) : new Set([n]);
            R.c.notes = R.c.notes.filter(q => !kill.has(q)); kill.forEach(q => X.sel.notes.delete(q)); X.touch(); draw(); showInsp();
        });
        cv.addEventListener('wheel', e => {
            e.preventDefault();
            if (e.ctrlKey || e.metaKey) { let r = cv.getBoundingClientRect(), mx = e.clientX - r.left, t = xt(mx); RS.ppb = X.clamp(R.ppb * (e.deltaY < 0 ? 1.15 : 1 / 1.15), 6, 300); layout(); R.sc.scrollLeft = Math.max(0, t * R.ppb - (mx - KEYW)); draw(); }
            else if (e.shiftKey) R.sc.scrollLeft += e.deltaY + e.deltaX;
            else { R.sc.scrollTop += e.deltaY; R.sc.scrollLeft += e.deltaX; }
        }, { passive: false });
        cv.addEventListener('mousemove', e => { if (act) return; let a = at({ x: e.clientX, y: e.clientY }); if (a.keys || a.vel || a.ruler) { cv.style.cursor = ''; if (R.hov) { R.hov = null; draw(); } return; }
            if (R.lit) { let g = X.pr.grid, cell = Math.floor(a.t / g + 1e-6); if (!R.hov || R.hov.m !== a.m || R.hov.cell !== cell) { R.hov = { m: a.m, t: a.t, cell }; draw(); } } let n = hitNote(a.t, a.m); cv.style.cursor = n ? (tx(n.t + n.d) - a.x < 6 ? 'ew-resize' : 'grab') : 'crosshair'; });
        R.sc.addEventListener('scroll', () => draw());
        cv.addEventListener('mouseleave', () => { if (R && R.hov) { R.hov = null; draw(); } });
    }
    function showInsp() {
        if (!R) return;
        let box = R.ins, s = selNotes(), el = X.el, btn = X.btn; box.innerHTML = '';
        if (R.tr.inst === 'uta') {
            let w = el('label', 'nb-lyr'); w.appendChild(el('span', 'nb-lab', '歌詞 // LYRICS'));
            let ta = el('input', 'nb-in'); ta.value = R.c.ly || ''; ta.placeholder = 'あいしてる  or  a i shi te ru'; ta.maxLength = 400; ta.style.width = '260px';
            ta.onfocus = X.mark; ta.oninput = () => { R.c.ly = ta.value; NB.touch(X.pr); draw(); }; ta.onchange = () => { X.touch(); };
            ta.addEventListener('keydown', e => e.stopPropagation()); w.appendChild(ta);
            let n = NB.lyricsOf(R.c.ly || '').length; w.appendChild(el('span', 'nb-hint', n + ' sound' + (n === 1 ? '' : 's') + ' for ' + R.c.notes.length + ' note' + (R.c.notes.length === 1 ? '' : 's') + (n && n < R.c.notes.length ? ' (they go round again)' : '')));
            box.appendChild(w);
        }
        if (!s.length) { box.appendChild(el('div', 'nb-hint', 'pick notes (click, shift+click, ctrl+drag a box) and their settings show up here')); return; }
        let n0 = s[0], avg = k => s.reduce((a, n) => a + (n[k] != null ? n[k] : (k === 'v' ? 0.8 : k === 'p' ? 100 : 1)), 0) / s.length;
        box.appendChild(el('span', 'nb-lab', s.length + (s.length > 1 ? ' notes' : ' note · ' + (R.kit ? (R.tr.snd.drawers[n0.m - NB.KITROOT] || {}).name : X.noteName(n0.m)))));
        if (s.length >= 2 && !R.kit && !R.drum) { let ms = [...new Set(s.map(n => n.m))].sort((a, b) => a - b); if (ms.length >= 2) box.appendChild(el('span', 'nb-lab nb-chordnm', '= ' + chordName(ms))); }
        const all = (k, v) => s.forEach(n => { n[k] = v; });
        box.appendChild(X.knob('HOW HARD', () => avg('v'), v => all('v', Math.max(0.05, Math.round(v * 100) / 100)), { def: 0.8, start: X.mark, turn: () => { NB.touch(X.pr); draw(); }, done: X.touch }));
        box.appendChild(X.knob('CHANCE', () => avg('p') / 100, v => all('p', Math.round(v * 100)), { fmt: v => Math.round(v * 100) + '%', def: 1, start: X.mark, turn: () => { NB.touch(X.pr); draw(); }, done: X.touch, tip: 'how often it actually plays. the dice roll the same every bounce' }));
        box.appendChild(X.knob('ROLLS', () => (avg('r') - 1) / 5, v => all('r', 1 + Math.round(v * 5)), { steps: 6, fmt: v => '×' + (1 + Math.round(v * 5)), def: 0, start: X.mark, done: X.touch, tip: 'hits it again inside the note. drum rolls, stutters' }));
        const tog = (k, txt, tip) => { let on = s.every(n => n[k]); box.appendChild(btn(txt, 'sm' + (on ? ' on' : ''), () => { X.mark(); all(k, on ? 0 : 1); X.touch(); draw(); showInsp(); }, tip)); };
        if (R.tr.inst === 'squirm') { tog('sl', '⌒ SLIDE', 'glides in from the note before, no new hit'); tog('ac', '● ACCENT', 'louder + the filter screams'); }
        if (R.tr.inst === 'sump') tog('sl', '⌒ SLIDE', 'glides in from the note before');
        if (R.tr.inst === 'tick') tog('o', '○ OPEN', 'rings out till the next shut one');
        if (!R.kit) box.appendChild(btn('🔒 LOCK SOUND', 'sm' + (X.lockNotes ? ' on' : ''), () => { X.lockNotes = X.lockNotes ? null : s; X.setTab('sound'); }, 'the SOUND knobs change only these notes (yellow knob = locked)'));
        if (s.some(n => n.L)) box.appendChild(btn('UNLOCK', 'sm', () => { X.mark(); s.forEach(n => { delete n.L; }); X.touch(); draw(); showInsp(); }));
    }
    function glue(c) {
        let s = selNotes().slice().sort((a, b) => a.m - b.m || a.t - b.t), gone = new Set(), keep = [];
        s.forEach(n => { let last = keep.length && keep[keep.length - 1]; if (last && last.m === n.m && n.t <= last.t + last.d + 1e-6) { last.d = Math.max(last.d, n.t + n.d - last.t); gone.add(n); } else keep.push(n); });
        c.notes = c.notes.filter(n => !gone.has(n)); X.sel.notes = new Set(keep);
    }
    X.rollKey = function (e) {
        if (!R || !R.cv.isConnected) return false;
        let k = e.key.toLowerCase(), ctrl = e.ctrlKey || e.metaKey, s = selNotes(), c = R.c, pr = X.pr;
        const done = () => { e.preventDefault(); X.touch(); draw(); showInsp(); return true; };
        if ((k === 'delete' || k === 'backspace') && s.length) { X.mark(); let ks = new Set(s); c.notes = c.notes.filter(n => !ks.has(n)); X.sel.notes = new Set(); return done(); }
        if (ctrl && k === 'a') { c.notes.forEach(n => X.sel.notes.add(n)); e.preventDefault(); draw(); showInsp(); return true; }
        if (ctrl && k === 'c' && s.length) { let a = Math.min.apply(0, s.map(n => n.t)); RS.copy = s.map(n => Object.assign({}, n, { t: n.t - a })); X.flash(s.length + ' notes copied'); e.preventDefault(); return true; }
        if (ctrl && k === 'v' && RS.copy) { X.mark(); let at = RS.at || 0, cp = RS.copy.map(n => Object.assign({}, n, { t: at + n.t })).filter(n => n.t < clipLen()); c.notes.push(...cp); X.sel.notes = new Set(cp); return done(); }
        if (ctrl && k === 'x' && s.length) { let a = Math.min.apply(0, s.map(n => n.t)); RS.copy = s.map(n => Object.assign({}, n, { t: n.t - a })); X.mark(); let ks = new Set(s); c.notes = c.notes.filter(n => !ks.has(n)); X.sel.notes = new Set(); X.flash(s.length + ' notes cut'); return done(); }
        if (ctrl && k === 'j' && s.length > 1) { X.mark(); glue(c); return done(); }
        if (ctrl && k === 'e' && s.length) { let b = RS.at || 0, made = []; X.mark(); s.forEach(n => { if (b > n.t + 0.01 && b < n.t + n.d - 0.01) { let q = Object.assign({}, n, { t: b, d: n.t + n.d - b }); n.d = b - n.t; c.notes.push(q); made.push(q); } }); if (!made.length) { X.flash('click inside the notes first (that spot is where they get cut)'); e.preventDefault(); return true; } return done(); }
        if (ctrl && k === 'd' && s.length) { X.mark(); let a = Math.min.apply(0, s.map(n => n.t)), b = Math.max.apply(0, s.map(n => n.t + n.d)), cp = s.map(n => Object.assign({}, n, { t: n.t + (b - a) })).filter(n => n.t < clipLen()); c.notes.push(...cp); X.sel.notes = new Set(cp); return done(); }
        if (k === 'q' && !ctrl) { X.mark(); quant(s.length ? s : c.notes, false); return done(); }
        if (k === 'escape') { X.sel.notes = new Set(); draw(); showInsp(); return true; }
        if (s.length && (k === 'arrowup' || k === 'arrowdown')) { X.mark(); let dir = k === 'arrowup' ? 1 : -1; s.forEach(n => { n.m = clampM(e.shiftKey || ctrl ? n.m + 12 * dir : walk(n.m, dir, pr.snap && !R.kit && !R.drum)); }); X.hear(R.tr.uid, s[0].m, s[0]); return done(); }
        if (s.length && (k === 'arrowleft' || k === 'arrowright')) { X.mark(); let dir = k === 'arrowright' ? 1 : -1, g = pr.grid * (e.shiftKey ? 4 : 1); s.forEach(n => { n.t = Math.max(0, Math.min(clipLen() - 0.01, n.t + g * dir)); }); return done(); }
        return false;
    };
})();
