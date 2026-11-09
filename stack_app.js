window.os = window.os || {};

(function () {
    const KEY = 'vmp_stack';
    const DEF = {
        reach: 74, tol: 2, regrowEvery: 4, speed: 66, speedUp: 1.7, speedMax: 270, insaneSpeed: 140, musicVol: 0.8,
        leanMax: 22, leanWarn: 15, feverSecs: 8, feverTol: 6, slowMo: 0.33, stokeDrain: 0.55, stokeGain: 0.2, beatWin: 0.07, specialsFrom: 18, beatSync: 1
    };
    const MODES = ['xtreme', 'insane'];
    const N = () => Object.assign({}, DEF, (typeof appsDB !== 'undefined' && appsDB.stack) || {});
    const WD = () => (window.gamesDB && window.gamesDB.stack) || {};
    const bits = (s, n) => String(s == null ? '' : s).split('|').map(x => x.trim().replace(/\{n\}/g, n));
    const LE = (k, n, d) => { let p = bits((WD().lines || {})[k] || d || k, n); return p[p.length > 1 ? 1 : 0]; };
    const LJ = (k, n, d) => bits((WD().lines || {})[k] || d || k, n)[0];
    const calm = () => document.documentElement.classList.contains('reduce-motion');
    const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
    const last = a => a[a.length - 1];
    const LH = 8;
    const COLS = ['#19e3c4', '#ff3fa4', '#8a5cff', '#2fc4ff', '#ff4d4d', '#43ff74', '#ffd23f', '#ff2bd6'];
    const SHOUT = {
        perfect: ['HARDCORE ALIGNMENT', 'ZERO OVERHANG', 'FLUSH. HARDCORE.', 'LOAD BEARING', 'SLAB SLAMMED', 'BRUTALLY LEVEL', 'EDGES OBLITERATED', '100% FLUSH'],
        beat: ['STACKED ON THE KICK', 'RHYTHMIC MASONRY', 'SLAB DROPPED ON THE BEAT'],
        chain: ['{n} SLABS DEEP', '{n}X FLUSH', 'ILLEGAL LEVELS OF STACKING', 'STACKING WILL NEVER DIE', 'TOO STACKED 4 U', 'COUNCIL HAS BEEN NOTIFIED', 'BUILDING CODE VIOLATED'],
        clean: ['STACKED. I GUESS.', 'PASSABLE MASONRY', 'IT IS A FLOOR'],
        close: ['SHAVED. BARELY.', 'A LITTLE OFF THE EDGE'],
        cut: ['OVERHANG DETECTED', 'SOFT STACKING', 'BITS FELL OFF', 'NOT FLUSH. WEAK.', 'CASUAL STACKER DETECTED', 'SLAB TRIMMED. MILD.'],
        lean: ['TOWER LEANING', 'TOO HARDCORE TO STAND UP'],
        wipe: ['TOWER DESTROYED', 'GRAVITY WINS', 'YOU WERE NOT STACKED ENOUGH'],
        fever: ['HARDCORE STACKING MODE'], feverEnd: ['STACKING MODE DEPLETED. HYDRATE.'],
        trialWin: ['INSPECTION PASSED. BRUTALLY.'], trialLose: ['FAILED INSPECTION. SOFT.'], hot: ['HOT SLAB INCOMING'], hotWin: ['HOT SLAB STACKED'],
        sector: ['FLOOR {n} BRUTALLY CONSTRUCTED'], pb: ['NEW PERSONAL BEST', 'PERSONAL BEST OBLITERATED', 'PB. HARDCORE.']
    };
    const NAMES = { L: 'L-BEAM OF DOOM', T: 'T-BEAM OF TERROR', plus: 'CROSS SLAB OF FURY', U: 'U-CHANNEL OF PAIN', ring: 'RING SLAB OF SUFFERING', S: 'S-BLOCK. GOOD LUCK.', dumb: 'DUMBBELL SLAB OF DEATH', stairs: 'STAIRWAY TO HARDCORE', dots: 'LOOSE BRICKS OF DESPAIR', hook: 'THE HOOK BEAM', comb: 'COMB SLAB OF CHAOS', big: 'OVERSIZED SLAB', plank: 'THE PLANK' };
    const ACH = { first: 'PLACED A SLAB', three: 'THREE (3) SLABS', perfect: 'ALIGNED SOMETHING', cut: 'LOST A BIT', ten: 'TALLER THAN A SHED', twenty: 'BUILDING PERMIT REQUIRED', chain5: 'CONSISTENT. ALARMINGLY.', slow: 'NEEDED A MOMENT', fever: 'HYDRATION PENDING', thirty: 'VISIBLE FROM SPACE (NOT REALLY)', fifty: 'CERTIFIED STRUCTURE', hot: 'TOUCHED THE HOT ONE', trial: 'PASSED AN INSPECTION. SOMEHOW.', corner: 'THE SKULL HIT THE CORNER' };
    const RANKS = ['HARDCORE INTERN', 'HARDCORE TRAINEE', 'HARDCORE ENJOYER', 'HARDCORE PROFESSIONAL', 'HARDCORE MANAGER', 'HARDCORE EXECUTIVE', 'HARDCORE EMERITUS', 'HARDCORE DEITY (PROVISIONAL)'];
    const TRIALS = { perfect: 'ALL FLUSH', beat: 'ALL ON THE BEAT', noslow: 'NO SLOW-MO' };

    const blank = () => ({ top: [], played: 0, bestH: 0, bestChain: 0 });
    const fresh = () => ({ m: { xtreme: blank(), insane: blank() }, mode: 'xtreme', muted: false, achs: {}, slabs: 0 });
    let D = fresh();
    function loadD() {
        try { let d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d) D = Object.assign(fresh(), d); } catch (e) {}
        MODES.forEach(m => { D.m[m] = Object.assign(blank(), D.m[m] || {}); });
        if (MODES.indexOf(D.mode) < 0) D.mode = 'xtreme';
    }
    function saveD() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} }

    let root = null, style = null, cv = null, sx = null, buf = null, bx = null, ro = null, raf = 0, lastT = 0, asleep = false;
    let S = null, LY = null, theme = { p: '#ff2d6f', s: '#2de0ff' }, themeAt = 0;
    function readTheme(now) {
        if (now - themeAt < 500) return; themeAt = now;
        let cs = getComputedStyle(root || document.documentElement);
        theme = { p: cs.getPropertyValue('--neon-primary').trim() || theme.p, s: cs.getPropertyValue('--neon-secondary').trim() || theme.s };
    }
    function rgba(hex, a) { let n = parseInt(String(hex).replace('#', '').slice(0, 6), 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
    function mix(h1, h2, t) { let a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16); let c = [16, 8, 0].map(s => Math.round((a >> s & 255) * (1 - t) + (b >> s & 255) * t)); return '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''); }
    function rng(seed) { let h = seed >>> 0; return () => { h = (h + 0x6D2B79F5) >>> 0; let t = Math.imul(h ^ h >>> 15, 1 | h); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    const pick = a => a[Math.floor(Math.random() * a.length)];

    // 16x16 grid, thats why slabs can be any dumb shape
    const G = 16, CS = 4, HALF = G * CS / 2;
    const ix = (i, j) => j * G + i;
    const SHAPES = {
        L: ['x...', 'x...', 'x...', 'xxxx'], T: ['xxxx', '.xx.', '.xx.'], plus: ['.x.', 'xxx', '.x.'], U: ['x..x', 'x..x', 'xxxx'],
        ring: ['xxxx', 'x..x', 'x..x', 'xxxx'], S: ['.xx', 'xx.'], dumb: ['xx..xx', 'xxxxxx', 'xx..xx'], stairs: ['x..', 'xx.', 'xxx'],
        dots: ['x.x', '.x.', 'x.x'], hook: ['xxx', 'x..', 'x.x', 'xxx'], comb: ['x.x.x', 'xxxxx']
    };
    function newGame(m, demo) {
        let n = N();
        if (!demo) { D.song = ((D.song || 0) + 1) % 6; saveD(); }
        MU.salt = D.song || 0; MU.rung0 = m === 'insane' && !demo ? 2 : 0; MU.rung = MU.rung0; MU.rf = 0; MU.nx = null; MU.swap = false; MU.seed = (Math.random() * 1e9) >>> 0;
        let sg = rungSong(MU.rung, MU.salt);
        if (MU.sg !== sg || MU.lift || !MU.on) { MU.want = sg; MU.lift = 0; musicOff(0.1); MU.pos = 0; MU.step = 0; muLoad(MU.want).then(() => musicOn()); }
        let base = { cells: new Uint8Array(G * G).fill(1), col: '#8a8f99', pat: 0, base: true };
        S = {
            n, mode: m, state: 'play', t: 0, now: 0, score: 0, chain: 0, bestChain: 0, stoke: 0.5, slow: false, held: 0, holding: false,
            floors: [base], mov: null, chunks: [], fx: [], shout: null, cam: 0, shake: 0,
            lean: 0, leanV: [0, 0], wipe: null, flash: 0, onBeat: 0, glitch: 0, demo: !!demo, sfx: [], kick: 0, beatN: -1, punch: 0, trail: [], ab: 0, tear: 0, dmg: 0, lock: 0, crow: 0, sector: null, boot: demo ? 0 : 1.4, slam: null, kanji: null, city: 0, bolt: null, fever: 0, fev: 0, pops: [], achs: {}, toasts: [], dd: { on: [], next: 4, used: {} }, sk: null, shades: 0, rank: 0, rankT: 0, hype: null, inc: 0, incT: 0, tube: 0
        };
        spawn(); if (!demo) snd('boot');
    }
    function speedAt(h) { let n = S.n; return Math.min(n.speedMax, (S.mode === 'insane' ? n.insaneSpeed : n.speed) + h * n.speedUp); }
    function bbox(c, w, h) { let b = [1e9, 1e9, -1, -1]; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (c[j * w + i]) { b[0] = Math.min(b[0], i); b[1] = Math.min(b[1], j); b[2] = Math.max(b[2], i); b[3] = Math.max(b[3], j); } return b; }
    function count(c) { let k = 0; for (let v of c) k += v; return k; }
    function crop(c) { let b = bbox(c, G, G), w = b[2] - b[0] + 1, h = b[3] - b[1] + 1, o = new Uint8Array(w * h); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) o[j * w + i] = c[ix(b[0] + i, b[1] + j)]; return { w, h, c: o, i0: b[0], j0: b[1] }; }
    function fromMask(rows, s, rot, flip) {
        let tw = rows[0].length, th = rows.length, w = tw * s, h = th * s, c = new Uint8Array(w * h);
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { let ti = Math.floor(i / s), tj = Math.floor(j / s); if (flip) ti = tw - 1 - ti; c[j * w + i] = rows[tj][ti] === 'x' ? 1 : 0; }
        let sh = { w, h, c };
        for (let r = 0; r < rot; r++) { let n = new Uint8Array(sh.w * sh.h); for (let j = 0; j < sh.h; j++) for (let i = 0; i < sh.w; i++) n[i * sh.h + (sh.h - 1 - j)] = sh.c[j * sh.w + i]; sh = { w: sh.h, h: sh.w, c: n }; }
        return sh;
    }
    function grown(sh) { let w = sh.w + 2, h = sh.h + 2, c = new Uint8Array(w * h); for (let j = 0; j < sh.h; j++) for (let i = 0; i < sh.w; i++) if (sh.c[j * sh.w + i]) for (let b = 0; b < 3; b++) for (let a = 0; a < 3; a++) c[(j + b) * w + i + a] = 1; return { w, h, c }; }
    function nextShape() {
        let top = crop(last(S.floors).cells), h = S.floors.length, ins = S.mode === 'insane', r = Math.random(), sh = top, kind = 'same';
        let weird = h >= (ins ? 2 : 8), big = h >= (ins ? 4 : 12), plank = h >= (ins ? 5 : 14);
        if (weird && r < (ins ? 0.45 : 0.3)) {
            let ks = Object.keys(SHAPES), m = SHAPES[ks[Math.floor(Math.random() * ks.length)]], span = Math.max(top.w, top.h);
            let s = Math.max(1, Math.round(span * (0.6 + Math.random() * 0.6) / Math.max(m.length, m[0].length)));
            sh = fromMask(m, s, Math.floor(Math.random() * 4), Math.random() < 0.5); kind = 'odd'; sh.name = Object.assign({}, NAMES, WD().names || {})[ks.find(q => SHAPES[q] === m)];
        } else if (big && r < (ins ? 0.6 : 0.42)) { sh = grown(top); kind = 'big'; sh.name = NAMES.big; }
        else if (plank && r < (ins ? 0.72 : 0.52)) { let long = Math.min(G, Math.max(top.w, top.h) + 2), wide = 1 + (Math.random() < 0.5 ? 1 : 0); sh = Math.random() < 0.5 ? { w: long, h: wide, c: new Uint8Array(long * wide).fill(1) } : { w: wide, h: long, c: new Uint8Array(long * wide).fill(1) }; kind = 'plank'; sh.name = NAMES.plank; }
        sh.w = Math.min(sh.w, G); sh.h = Math.min(sh.h, G);
        let hi = Math.round(top.i0 + top.w / 2 - sh.w / 2), hj = Math.round(top.j0 + top.h / 2 - sh.h / 2);
        return { sh, hi, hj, kind };
    }
    function spawn() {
        let h = S.floors.length, axis = h % 2 ? 'y' : 'x', n = S.n, ns = nextShape(), sp = '', r = Math.random();
        if (h >= (S.mode === 'insane' ? 6 : n.specialsFrom)) { if (r < 0.08) sp = 'ice'; else if (r < 0.15) sp = 'heavy'; else if (r < 0.21 && h > 30) sp = 'glitch'; }
        if (!sp && h >= 10 && Math.random() < 0.12) sp = 'hot';
        if (!S.trial && h > 1 && h % 7 === 0 && !S.demo) S.trial = { kind: pick(Object.keys(TRIALS)), got: 0, need: 3, t: 0 };
        S.usedSlow = false; S.callout = sp === 'hot' ? { s: (SHOUT.hot)[0], t: 0, hot: true } : ns.sh.name ? { s: 'INCOMING: ' + ns.sh.name, t: 0 } : S.callout;
        let m = { axis, sh: ns.sh, hi: ns.hi, hj: ns.hj, shape: ns.kind, ph: Math.random() < 0.5 ? 0 : 0.5, spd: speedAt(h) * (sp === 'hot' ? 1.35 : 1), col: sp === 'hot' ? '#ff3a1a' : COLS[h % COLS.length], pat: h % 4, kind: sp, gT: 0, stut: 0, dir: 1, x: 0, y: 0 };
        m.img = slabImg({ cells: m.sh.c, w: m.sh.w, h: m.sh.h, col: m.col, pat: m.pat, kind: sp }, true);
        // lock it to the song. it passes the middle on the beat so perfect and on beat are the same tap
        if (n.beatSync && !S.demo) { let half = 2 * n.reach / m.spd, beat = 60 / songBpm(); m.k = Math.pow(2, clamp(Math.round(Math.log2(half / beat)), -1, 2)); m.ph = beatPh(m); }
        S.mov = m;
    }
    function beatPh(m) { let R = songBpm() / 15, lat = (MU.A && (MU.A.outputLatency || MU.A.baseLatency)) || 0.02; return (MU.pos - lat * R * (S.slow ? S.n.slowMo : 1)) / 4 / (2 * m.k) + 0.25; }
    function railPos(m) { let f = ((m.ph % 1) + 1) % 1; return f < 0.5 ? -1 + f * 4 : 3 - f * 4; }
    function moveTick(dt) {
        let m = S.mov, n = S.n, h = S.floors.length; if (!m) return;
        let sp = m.k ? songBpm() / 15 / (8 * m.k) : m.spd / (n.reach * 4);
        if (h > 30) sp *= 1 + 0.45 * Math.sin(S.t * 2.3 + h);
        if (h > 60) { if (m.stut > 0) { m.stut -= dt; sp = 0; } else if (Math.random() < dt * 0.8) m.stut = 0.12 + Math.random() * 0.15; }
        if (h > 90 && Math.random() < dt * 0.5) m.dir *= -1;
        m.ph += sp * dt * m.dir;
        if (m.k && m.dir === 1 && !(m.stut > 0)) { let e = beatPh(m) - m.ph; e -= Math.round(e); m.ph += e * Math.min(1, dt * 8); }
        if (m.kind === 'glitch') { m.gT += dt; if (m.gT > 0.7) { m.gT = 0; m.ph = 1 - m.ph; S.glitch = 0.25; } }
        let off = railPos(m) * n.reach;
        m.x = -HALF + m.hi * CS + (m.axis === 'x' ? off : 0); m.y = -HALF + m.hj * CS + (m.axis === 'y' ? off : 0);
    }
    function swayNow() { let a = clamp(S.lean / S.n.leanMax, 0, 1); return calm() ? 0 : Math.sin(S.t * 2.2) * a * a * 6; }
    // on the beat you hear, so take the speaker lag off
    function onBeat() { let R = rate(), lat = (MU.A && (MU.A.outputLatency || MU.A.baseLatency)) || 0.02, ph = (MU.pos - lat * R) / 4, off = Math.abs(ph - Math.round(ph)) * 4 / R; return off < S.n.beatWin; }
    function leanCalc() {
        let fl = S.floors.slice(-10), cx = 0, cy = 0, tot = 0;
        fl.forEach(f => { for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) if (f.cells[ix(i, j)]) { cx += (i + 0.5) * CS - HALF; cy += (j + 0.5) * CS - HALF; tot++; } });
        cx /= tot || 1; cy /= tot || 1; S.leanV = [cx, cy]; S.lean = Math.hypot(cx, cy);
    }
    function centre(c) { let x = 0, y = 0, k = 0; for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) if (c[ix(i, j)]) { x += (i + 0.5) * CS - HALF; y += (j + 0.5) * CS - HALF; k++; } return [x / (k || 1), y / (k || 1), k]; }
    function drop() {
        if (!S || S.state !== 'play' || !S.mov) return;
        let m = S.mov, top = last(S.floors), n = S.n, h = S.floors.length, k = m.axis;
        let raw = (k === 'x' ? m.x - (-HALF + m.hi * CS) : m.y - (-HALF + m.hj * CS)) - swayNow() * 0.6;
        let fev = S.fev > 0 && Math.abs(raw) <= n.feverTol; if (fev) raw = 0;
        let si = m.hi + (k === 'x' ? Math.round(raw / CS) : 0), sj = m.hj + (k === 'y' ? Math.round(raw / CS) : 0);
        if (m.kind === 'heavy') { let e = new Uint8Array(G * G); for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) if (top.cells[ix(i, j)] && (i > 0 && top.cells[ix(i - 1, j)]) && (i < G - 1 && top.cells[ix(i + 1, j)]) && (j > 0 && top.cells[ix(i, j - 1)]) && (j < G - 1 && top.cells[ix(i, j + 1)])) e[ix(i, j)] = 1; if (count(e)) { top.cells = e; top.img = null; } S.shake = 1; }
        let keep = new Uint8Array(G * G), lost = new Uint8Array(G * G), lostAny = false, kept = 0;
        for (let b = 0; b < m.sh.h; b++) for (let a = 0; a < m.sh.w; a++) {
            if (!m.sh.c[b * m.sh.w + a]) continue;
            let gi = si + a, gj = sj + b;
            if (gi >= 0 && gi < G && gj >= 0 && gj < G && top.cells[ix(gi, gj)]) { keep[ix(gi, gj)] = 1; kept++; } else { lostAny = true; if (gi >= 0 && gi < G && gj >= 0 && gj < G) lost[ix(gi, gj)] = 1; else lost.outside = (lost.outside || 0) + 1; }
        }
        if (lostAny) { let ch = cellsChunk(m, si, sj, top); if (ch) S.chunks.push(ch); }
        let beat = onBeat(), aligned = (k === 'x' ? si === m.hi : sj === m.hj), perfect = aligned && Math.abs(raw) <= n.tol;
        if (!kept) { S.mov = null; wipeout(); return; }
        let nf = { cells: keep, col: m.col, pat: m.pat, kind: m.kind, land: 1 };
        if (perfect) {
            S.chain++; S.bestChain = Math.max(S.bestChain, S.chain); S.stoke = Math.min(1, S.stoke + n.stokeGain);
            if (S.mode !== 'insane' && S.chain % n.regrowEvery === 0) grow(nf, top);
            if (S.chain % 5 === 0) muHorn();
            say(S.chain >= 5 ? 'chain' : beat ? 'beat' : 'perfect'); snd('perfect', S.chain); if (S.chain >= 4 && !calm()) { co2(); snd('co2'); } boom(nf, true); hype(true);
        } else {
            let lost = m.sh.c.reduce((a, v) => a + v, 0) - kept, close = lostAny && lost <= Math.max(1, Math.round(kept * 0.12));
            if (close) { say('close'); snd('place'); boom(nf, false); hype(false); S.fever = Math.max(0, S.fever - 0.05); }
            else { S.chain = 0; if (lostAny) { if (S.inc > 2) S.incT = 1; S.inc = 0; say('cut'); snd('cut'); muCut(); bail(); S.fever = Math.max(0, S.fever - 0.35); } else { say('clean'); snd('place'); boom(nf, false); hype(false); S.fever += 0.06; } }
        }
        if (perfect) S.fever += S.fev > 0 ? 0 : 0.2;
        S.rhy = beat ? (S.rhy || 0) + 1 : 0;
        let pts = 10 * (1 + Math.min(S.chain, 20)) * (beat ? 2 : 1) + kept;
        if (beat) { S.onBeat = 1; pts += 25; }
        pts *= 1 + Math.min(S.rhy, 8) * 0.25;
        if (S.usedSlow) pts *= 0.5;
        if (m.kind === 'hot' && perfect) { pts += 500; S.fever += 0.4; say('hotWin'); }
        if (S.fev > 0) pts *= 3;
        if (S.trial && !S.demo) { let tr = S.trial, ok = tr.kind === 'perfect' ? perfect : tr.kind === 'beat' ? beat : !S.usedSlow;
            if (!ok) { S.trial = null; say('trialLose'); }
            else if (++tr.got >= tr.need) { S.trial = null; let b = Math.round(2000 * (1 + S.floors.length / 20)); pts += b; S.fever += 0.5; grow(nf, top); grow(nf, top); say('trialWin'); snd('sector'); muImp(); ach('trial'); if (!calm()) strike(); } }
        pts = Math.round(pts);
        S.score += pts; pop(pts, perfect, beat);
        if (S.fever >= 1 && !(S.fev > 0)) { S.fever = 0; S.fev = n.feverSecs; say('fever'); snd('sector'); muImp(); S.punch = 2; S.shake = 1.5; if (!calm()) { strike(); vents(2); } }
        if (m.kind === 'ice') nf.slide = { t: 0.35, d: Math.random() < 0.5 ? -1 : 1, ax: k };
        S.floors.push(nf); S.flash = perfect ? 1 : 0.4; if (perfect) MU.ans = 1;
        if (!S.demo) { let h = S.floors.length - 1; D.slabs = (D.slabs || 0) + 1; ach('first'); if (h >= 3) ach('three'); if (h >= 10) ach('ten'); if (h >= 20) ach('twenty'); if (h >= 30) ach('thirty'); if (h >= 50) ach('fifty');
            if (perfect) ach('perfect'); if (lostAny && !perfect) ach('cut'); if (S.chain >= 5) ach('chain5'); if (S.usedSlow) ach('slow'); if (S.fev > 0) ach('fever'); if (m.kind === 'hot' && perfect) ach('hot');
            if (perfect && (S.chain % 5 === 0 || m.kind === 'hot') && !calm()) S.sk = { t: 0, dir: Math.random() < 0.5 ? 1 : -1 };
            let rk = Math.min(RANKS.length - 1, Math.floor(Math.sqrt(S.score / 900))); if (rk > S.rank) { S.rank = rk; S.rankT = 1.6; snd('sector'); } }
        if (!S.demo && (S.floors.length - 1) % 10 === 7) muPre(MU.rung0 + Math.floor((S.floors.length - 1) / 10) + 1);
        let fl = S.floors.length - 1, pbH = D.m[S.mode].bestH;
        if (pbH >= 5 && fl === pbH + 1 && !S.demo && !S.pbDone) { S.pbDone = true; say('pb'); snd('sector'); muImp(); S.punch = 1.4; if (!calm()) vents(1.5); }
        if (fl % 10 === 0) { S.sector = { n: fl, t: 0, g: muClimb(fl) }; grow(nf, top); grow(nf, top); nf.img = null; snd('sector'); muImp(); S.punch = 1.6; S.shake = 1.2; if (!calm()) { vents(2); strike(); } }
        leanCalc();
        if (S.lean > n.leanMax) { wipeout(); return; }
        if (S.lean > n.leanWarn && Math.random() < 0.5) say('lean');
        spawn();
    }
    function pop(v, perfect, beat) { let [x, y] = slabXY(); S.pops.push({ v: '+' + v + (S.fev > 0 ? ' x3' : ''), x, y: y - 10, t: 0, hot: perfect || beat }); }
    function grow(f, below) {
        let add = new Uint8Array(G * G);
        for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) if (!f.cells[ix(i, j)] && below.cells[ix(i, j)] && ((i > 0 && f.cells[ix(i - 1, j)]) || (i < G - 1 && f.cells[ix(i + 1, j)]) || (j > 0 && f.cells[ix(i, j - 1)]) || (j < G - 1 && f.cells[ix(i, j + 1)]))) add[ix(i, j)] = 1;
        for (let k = 0; k < G * G; k++) if (add[k]) f.cells[k] = 1;
        if (count(add)) S.fx.push({ k: 'grow', t: 0, life: 0.5 });
    }
    function cellsChunk(m, si, sj, top) {
        let w = m.sh.w, h = m.sh.h, c = new Uint8Array(w * h), any = false;
        for (let b = 0; b < h; b++) for (let a = 0; a < w; a++) { if (!m.sh.c[b * w + a]) continue; let gi = si + a, gj = sj + b; if (!(gi >= 0 && gi < G && gj >= 0 && gj < G && top.cells[ix(gi, gj)])) { c[b * w + a] = 1; any = true; } }
        if (!any) return null;
        let side = m.axis === 'x' ? (si > m.hi ? 1 : -1) : (sj > m.hj ? 1 : -1);
        return { img: slabImg({ cells: c, w, h, col: m.col, pat: m.pat }), x: -HALF + si * CS, y: -HALF + sj * CS, z: (S.floors.length - 1) * LH, vz: 0, vx: m.axis === 'x' ? side * 30 : 0, vy: m.axis === 'y' ? side * 30 : 0 };
    }
    function wipeout() {
        S.state = 'over'; S.wipe = { t: 0 }; S.shake = 1.5; S.glitch = 1.2;
        let dir = S.lean > 0.01 ? [S.leanV[0] / S.lean, S.leanV[1] / S.lean] : [1, 0], n = S.floors.length;
        S.floors.forEach((f, i) => { if (f.base) return; f.fall = { t: (n - i) * -0.025 + 0.2, vx: dir[0] * (20 + i * 0.6), vy: dir[1] * (20 + i * 0.6), vz: 0, z: 0, x: 0, y: 0 }; });
        say('wipe'); kaboom(); if (S.demo) return; snd('wipe'); musicOff(1.4, true);
        let d = D.m[S.mode], hh = S.floors.length - 1; d.played++; d.bestH = Math.max(d.bestH, hh); d.bestChain = Math.max(d.bestChain, S.bestChain);
        d.top.push({ s: S.score, h: hh }); d.top.sort((a, b) => b.s - a.s); d.top = d.top.slice(0, 10); saveD();
    }
    // me, drawing on the screen with a marker
    const SCRAWL = {
        slab: ['drop it. go on', 'you got this (you dont)', 'this ones cursed', 'trust the process', 'why is it that shape', 'ok now'],
        note: ['TODO make it harder', 'TODO fix the banana drone', 'dont tell anyone the slow-mo is cheating', 'its 3am', 'who approved this tower'],
        wipe: ['lmaooo', 'ok that one was on you', 'skill issue', 'rip bozo', 'the tower is fine. you are not'],
        rank: ['i made these up', 'not a real job'], hard: ['this number means nothing', 'goes up. thats it'], news: ['none of this is news'], pa: ['lol', 'mum look'], chain: ['proud of u', 'ok show off']
    };
    function doodleTick(dt) {
        let d = S.dd; if (!d || S.demo) return;
        d.on.forEach(q => q.t += dt); d.on = d.on.filter(q => q.t < q.life && !S.shown);
        if (S.state === 'over' && S.wipe && !d.used.wipe) { d.used.wipe = 1; d.on.push({ k: 'wipe', s: pick(scrawl('wipe')), t: 0, life: 6, seed: Math.random() * 1e6 | 0 }); }
        if (S.state === 'play' && S.chain >= 10 && !d.on.some(q => q.k === 'chain') && !d.used['c' + Math.floor(S.chain / 10)]) { d.used['c' + Math.floor(S.chain / 10)] = 1; d.on.push({ k: 'chain', s: pick(scrawl('chain')), t: 0, life: 4, seed: Math.random() * 1e6 | 0 }); }
        if (S.state !== 'play' || (d.next -= dt) > 0 || d.on.length >= 2) return;
        let ks = ['slab', 'slab', 'note', 'rank', 'hard', 'news', 'pa'].filter(k => !d.on.some(q => q.k === k)), k = pick(ks);
        d.on.push({ k, s: pick(scrawl(k)), t: 0, life: k === 'note' ? 7 : 4.5, seed: Math.random() * 1e6 | 0 }); d.next = 6 + Math.random() * 7;
    }
    function doodles(c, sc, now) {
        let d = S.dd; if (!d || S.demo) return;
        const ink = (q, a) => { let r = rng(q.seed + (calm() ? 0 : Math.floor(now * 7)) * 31); return () => (r() - 0.5) * a; };
        const line = (pts, q, col, w) => { let j = ink(q, 0.9), rev = clamp(q.t / 0.45, 0, 1), n = Math.max(2, Math.ceil(pts.length * rev)); c.strokeStyle = col; c.lineWidth = (w || 1.3) * sc; c.lineCap = c.lineJoin = 'round'; c.beginPath(); pts.slice(0, n).forEach((p, i) => { let x = (p[0] + j()) * sc, y = (p[1] + j()) * sc; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); };
        const arrow = (a, b, q, col) => { let pts = []; for (let i = 0; i <= 8; i++) { let u = i / 8; pts.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - Math.sin(u * Math.PI) * 6]); } line(pts, q, col); if (q.t > 0.45) { let ang = Math.atan2(b[1] - pts[7][1], b[0] - pts[7][0]); [-0.5, 0.5].forEach(o => line([[b[0] - Math.cos(ang + o) * 5, b[1] - Math.sin(ang + o) * 5], b], q, col)); } };
        const ring = (cx, cy, rx, ry, q, col) => { let pts = []; for (let i = 0; i <= 20; i++) { let a = i / 18 * Math.PI * 2 - 0.4; pts.push([cx + Math.cos(a) * rx * (1 + (i % 3) * 0.04), cy + Math.sin(a) * ry]); } line(pts, q, col, 1.1); };
        const word = (s, x, y, size, col, rot, q) => { let n = Math.ceil(s.length * clamp((q.t - 0.2) / 0.6, 0, 1)); c.save(); c.translate(x * sc, y * sc); c.rotate(rot); c.font = (size * sc) + "px 'Permanent Marker', cursive"; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = col; c.fillText(s.slice(0, n), 0, 0); c.restore(); };
        c.save();
        // a coffee ring. it was there when i got here
        c.globalAlpha = 0.16; ring(W * 0.74, H * 0.24, 13, 9, { seed: 7, t: 9 }, '#a0703a'); c.globalAlpha = 1;
        if (S.state === 'play') { let pl = (D.m[S.mode] || {}).played || 0; word('attempts', 10, 80, 5, '#cfcbd6', -0.04, { t: 9 }); for (let i = 0; i < Math.min(pl, 25); i++) { let g = Math.floor(i / 5), x = 36 + g * 9 + (i % 5) * 1.6; if (i % 5 === 4) line([[x - 7, 82], [x + 1.5, 78]], { seed: i + 3, t: 9 }, '#cfcbd6', 0.9); else line([[x, 77], [x + 0.3, 83]], { seed: i + 3, t: 9 }, '#cfcbd6', 0.9); } }
        d.on.forEach(q => {
            if (S.state !== 'play' && q.k !== 'wipe') return;
            let a = q.t > q.life - 0.4 ? (q.life - q.t) / 0.4 : 1, col = q.k === 'wipe' ? '#ff2a4a' : q.k === 'note' ? '#2a1a40' : '#ffd23f'; c.globalAlpha = a;
            if (q.k === 'slab' && S.mov) { let m = S.mov, [x, y] = P(m.x + m.sh.w * CS / 2, m.y + m.sh.h * CS / 2, (S.floors.length - 1) * LH + LH); arrow([x + 34, y - 30], [x + 6, y - 6], q, col); word(q.s, x + 30, y - 38, 7, col, -0.08, q); }
            else if (q.k === 'note') { c.save(); c.translate((W - 74) * sc, 86 * sc); c.rotate(0.06); c.fillStyle = '#fff27a'; c.fillRect(0, 0, 60 * sc, 30 * sc); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(2 * sc, 30 * sc, 60 * sc, 2 * sc); c.restore(); let ws = q.s.split(' '), ln = ['']; ws.forEach(w => { if ((ln[ln.length - 1] + ' ' + w).length > 13) ln.push(w); else ln[ln.length - 1] = (ln[ln.length - 1] + ' ' + w).trim(); }); ln.slice(0, 4).forEach((l, i) => word(l, W - 71, 92 + i * 6.5, 5.5, col, 0.06, q)); }
            else if (q.k === 'hard') { arrow([40, 96], [30, 54], q, col); word(q.s, 14, 102, 6.5, col, -0.06, q); }
            else if (q.k === 'rank') { arrow([96, 66], [72, 66], q, col); word(q.s, 98, 64, 6, col, -0.05, q); }
            else if (q.k === 'news') { arrow([70, H - 24], [40, H - 9], q, col); word(q.s, 62, H - 30, 6, col, -0.06, q); }
            else if (q.k === 'pa') { ring(W - 32, H - 43, 28, 14, q, col); word(q.s, W - 76, H - 64, 8, col, -0.2, q); }
            else if (q.k === 'chain') { let hx = W - 52, hy = 30, pts = []; for (let i = 0; i <= 24; i++) { let u = i / 24 * Math.PI * 2; pts.push([hx + 16 * Math.pow(Math.sin(u), 3) * 0.5, hy - (13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u)) * 0.5]); } line(pts, q, '#ff5fa2', 1.4); word(q.s, hx - 30, hy + 12, 7, '#ff5fa2', -0.12, q); }
            else if (q.k === 'wipe') { word(q.s, W * 0.18, H * 0.3, 18, col, -0.14, q); line([[W * 0.18, H * 0.38], [W * 0.5, H * 0.36], [W * 0.78, H * 0.39]], q, col, 2); }
        });
        c.restore();
    }
    function dvd(dt) {
        if (S.demo || S.state !== 'play' || S.floors.length < 5) return;
        let d = S.dvd || (S.dvd = { x: 40, y: 50, vx: 23, vy: 17, col: '#f2efe6' }), hx = false, hy = false;
        d.x += d.vx * dt; d.y += d.vy * dt;
        if (d.x < 16 || d.x > W - 16) { d.vx *= -1; d.x = clamp(d.x, 16, W - 16); hx = true; }
        if (d.y < 0 || d.y > H - 30) { d.vy *= -1; d.y = clamp(d.y, 0, H - 30); hy = true; }
        if (hx || hy) d.col = pick(['#f2efe6', '#ffd23f', '#2de0ff', '#ff5fa2', '#7dffb0']);
        if (hx && hy) ach('corner');
    }
    function ach(k) { if (!S || S.demo || S.achs[k]) return; S.achs[k] = 1; let nw = !D.achs[k]; D.achs[k] = 1; S.toasts.push({ s: ((WD().ach || {})[k] || ACH[k]) + (nw ? '  (NEW)' : ''), t: 0 }); snd('ach'); if (nw) saveD(); }
    const many = v => typeof v === 'string' ? v.split(' / ') : v;
    const scrawl = k => many((WD().scrawl || {})[k]) || SCRAWL[k];
    function say(k, n) { let l = many((WD().shouts || {})[k]) || SHOUT[k] || [k]; S.shout = { s: String(pick(l)).replace(/\{n\}/g, n == null ? S.chain : n), k, t: 0, seed: Math.random() }; }
    function boom(f, perfect) {
        S.inc++;
        if (calm()) return;
        let z = S.floors.length * LH, [cx, cy, k] = centre(f.cells);
        for (let i = 0; i < (perfect ? 26 : 8); i++) { let a = Math.random() * 6.283, s = 30 + Math.random() * 90; S.fx.push({ k: 'spark', x: cx, y: cy, z: z, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: 20 + Math.random() * 60, t: 0, life: 0.4 + Math.random() * 0.4, col: Math.random() < 0.4 ? '#ffffff' : pick(['#ffd23f', '#ff7a1a', f.col]) }); }
        if (perfect) S.fx.push({ k: 'ring', x: cx, y: cy, z, t: 0, life: 0.45, r: Math.sqrt(k) * CS * 0.7 });
    }
    function slideTick(f, i, dt) {
        let s = f.slide; s.t -= dt; if (s.t > 0) return; f.slide = null;
        let below = S.floors[i - 1], c = new Uint8Array(G * G), lost = new Uint8Array(G * G), any = false;
        for (let j = 0; j < G; j++) for (let k = 0; k < G; k++) { if (!f.cells[ix(k, j)]) continue; let a = k + (s.ax === 'x' ? s.d : 0), b = j + (s.ax === 'y' ? s.d : 0); if (a >= 0 && a < G && b >= 0 && b < G && below.cells[ix(a, b)]) c[ix(a, b)] = 1; else { any = true; if (a >= 0 && a < G && b >= 0 && b < G) lost[ix(a, b)] = 1; } }
        f.cells = c; f.img = null;
        if (any) { let cr = crop(lost); if (cr.w > 0 && count(lost)) S.chunks.push({ img: slabImg({ cells: cr.c, w: cr.w, h: cr.h, col: f.col, pat: f.pat }), x: -HALF + cr.i0 * CS, y: -HALF + cr.j0 * CS, z: (i - 1) * LH, vz: 0, vx: s.ax === 'x' ? s.d * 30 : 0, vy: s.ax === 'y' ? s.d * 30 : 0 }); snd('cut'); }
        if (!count(c)) { S.floors.splice(i, 1); wipeout(); }
    }

    function tick(dt) {
        if (S.state === 'play') {
            S.slow = S.holding && S.held > 0.14 && S.stoke > 0.02;
            if (S.holding) S.held += dt;
            if (S.slow) { S.stoke = Math.max(0, S.stoke - S.n.stokeDrain * dt); S.usedSlow = true; }
            let g = S.slow ? S.n.slowMo : 1;
            if (S.boot <= 0) { S.t += dt * g; moveTick(dt * g); }
        }
        S.now += dt;
        MU.pos += dt * rate(); MU.posAt = performance.now(); MU.fl = S.floors.length - 1; MU.tier = tierNow(); MU.danger = S.state === 'play' && S.lean > S.n.leanWarn;
        S.floors.forEach((f, i) => {
            if (f.land) f.land = Math.max(0, f.land - dt * 6);
            if (f.slide && S.state === 'play') slideTick(f, i, dt);
            if (f.fall) { let q = f.fall; q.t += dt; if (q.t > 0) { q.vz -= 500 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; } }
        });
        S.chunks.forEach(c => { c.vz -= 600 * dt; c.z += c.vz * dt; c.x += c.vx * dt; c.y += c.vy * dt; }); S.chunks = S.chunks.filter(c => c.z > -500);
        S.fx.forEach(f => { f.t += dt; if (f.k === 'spark') { f.x += f.vx * dt; f.y += f.vy * dt; f.z += f.vz * dt; f.vz -= 200 * dt; } }); S.fx = S.fx.filter(f => f.t < (f.life || 0.6));
        if (S.shout) S.shout.t += dt;
        let bn = Math.floor(MU.pos / 4); if (bn !== S.beatN) { S.beatN = bn; S.kick = 1; if (S.chain >= 5 && S.state === 'play' && !calm()) vents(0.35); if (S.state === 'play' && !S.demo && S.lean > S.n.leanWarn) snd('warn'); if (S.chain >= 3 && S.state === 'play' && Math.random() < 0.6) zap(); }
        S.kick = Math.max(0, S.kick - dt * 5); S.punch = Math.max(0, S.punch - dt * 5); S.ab = Math.max(0, S.ab - dt * 4); S.tear = Math.max(0, S.tear - dt * 2); S.dmg = Math.max(0, S.dmg - dt * 2.5); S.lock = Math.max(0, S.lock - dt * 2); S.crow = Math.max(0, S.crow - dt * 0.3); S.boot = Math.max(0, S.boot - dt); if (S.fev > 0 && S.state === 'play') { S.fev -= dt; if (S.fev <= 0) { S.fev = 0; say('feverEnd'); } } S.pops.forEach(q => q.t += dt); S.toasts.forEach(q => q.t += dt); doodleTick(dt); dvd(dt); S.toasts = S.toasts.filter(q => q.t < 3.2); if (S.sk) { S.sk.t += dt; if (S.sk.t > 1.4) S.sk = null; } S.rankT = Math.max(0, S.rankT - dt); S.incT = Math.max(0, S.incT - dt * 0.8); S.tube += dt * (1 + S.kick * 3); S.shades = S.chain >= 8 ? Math.min(1, S.shades + dt * 2.5) : 0; if (S.callout) { S.callout.t += dt; if (S.callout.t > 1.4) S.callout = null; } S.pops = S.pops.filter(q => q.t < 0.9); S.city = Math.max(0, S.city - dt * 2); if (S.slam) S.slam.t += dt; if (S.bolt) { S.bolt.t += dt; if (S.bolt.t > 0.35) S.bolt = null; }
        if (S.sector) S.sector.t += dt;
        S.sfx.forEach(f => { f.t += dt; if (f.t < 0) return; f.x += f.vx * dt; f.y += f.vy * dt; f.vy += (f.g || 0) * dt; if (f.k === 'conf') f.vx = Math.sin(f.t * 5 + f.ph) * 25; }); S.sfx = S.sfx.filter(f => f.t < f.life && f.y < H + 10); S.sfx.forEach(f => { if (f.k === 'co2' && f.t > 0) { let d = Math.pow(0.08, dt); f.vx *= d; f.vy *= d; } });
        if (S.mov && !calm()) { S.trail.push([S.mov.x, S.mov.y]); if (S.trail.length > 5) S.trail.shift(); }
        S.shake = Math.max(0, S.shake - dt * 3); S.flash = Math.max(0, S.flash - dt * 4); S.onBeat = Math.max(0, S.onBeat - dt * 3); S.glitch = Math.max(0, S.glitch - dt);
        let want = (S.floors.length - 1) * LH; S.cam += (want - S.cam) * Math.min(1, dt * 5);
        if (S.wipe) S.wipe.t += dt;
        if (S.demo) {
            let m = S.mov; if (m && S.state === 'play') { let d = m.axis === 'x' ? m.x - (-HALF + m.hi * CS) : m.y - (-HALF + m.hj * CS); if (Math.abs(d) < (Math.random() < 0.9 ? 0.8 : 3)) drop(); }
            if (S.wipe && S.wipe.t > 2 || S.floors.length > 40) newGame(D.mode, true);
        } else if (S.wipe && S.wipe.t > 2.4 && !S.shown) { S.shown = true; show('over'); }
    }

    let W = 400, H = 270;
    function px(x, y, w, h, c) { bx.fillStyle = c; bx.fillRect(x | 0, y | 0, w, h); }
    function line(x0, y0, x1, y1, c) {
        x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
        let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx_ = x0 < x1 ? 1 : -1, sy_ = y0 < y1 ? 1 : -1, er = dx + dy; bx.fillStyle = c;
        for (let k = 0; k < 3000; k++) { bx.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; let e2 = 2 * er; if (e2 >= dy) { er += dy; x0 += sx_; } if (e2 <= dx) { er += dx; y0 += sy_; } }
    }
    function fillPoly(pts, col) {
        let x0 = Math.floor(Math.min(...pts.map(p => p[0]))), x1 = Math.ceil(Math.max(...pts.map(p => p[0])));
        bx.fillStyle = col;
        for (let x = x0; x < x1; x++) {
            let xc = x + 0.5, lo = 1e9, hi = -1e9;
            for (let i = 0; i < pts.length; i++) { let a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[0] <= xc && b[0] >= xc) || (b[0] <= xc && a[0] >= xc)) { let y = a[0] === b[0] ? Math.min(a[1], b[1]) : a[1] + (b[1] - a[1]) * (xc - a[0]) / (b[0] - a[0]); lo = Math.min(lo, y); hi = Math.max(hi, a[0] === b[0] ? Math.max(a[1], b[1]) : y); } }
            if (hi > lo) bx.fillRect(x, Math.round(lo), 1, Math.round(hi) - Math.round(lo));
        }
    }
    let OX = 200, OY = 180;
    const P = (x, y, z) => [Math.round(OX + (x - y)), Math.round(OY + (x + y) / 2 - z)];
    const IW = 136, IH0 = 70;
    function slabImg(f, eye) {
        let w = f.w || G, h = f.h || G, hgt = f.base ? LH * 3 : LH, c = document.createElement('canvas'); c.width = IW; c.height = IH0 + hgt;
        let keep = [bx, OX, OY]; bx = c.getContext('2d'); OX = IW / 2; OY = 35 + hgt;
        let col = f.base ? '#5a5f70' : f.col, top = mix(col, '#140e1e', 0.52), lf = mix(col, '#0a0712', 0.66), rt = mix(col, '#05030a', 0.78), dk = '#05030a', neon = mix(col, '#ffffff', 0.25), seam = mix(top, '#000000', 0.35);
        const has = (i, j) => i >= 0 && j >= 0 && i < w && j < h && f.cells[j * w + i];
        for (let s = 0; s <= w + h; s++) for (let i = 0; i < w; i++) {
            let j = s - i; if (j < 0 || j >= h || !has(i, j)) continue;
            let x = i * CS - HALF, y = j * CS - HALF;
            let A = P(x, y, hgt), B = P(x + CS, y, hgt), C = P(x + CS, y + CS, hgt), Dd = P(x, y + CS, hgt), Cb = P(x + CS, y + CS, 0), Db = P(x, y + CS, 0), Bb = P(x + CS, y, 0);
            if (!has(i, j + 1)) {
                fillPoly([Dd, C, Cb, Db], lf);
                for (let u = 0; u < CS; u++) { let gu = (f.base ? i : (f.gi || 0) + i) * CS + u, [sx_, sy_] = P(x + u, y + CS, hgt), pc = f.base ? 0 : f.pat;
                    if (pc === 0) { for (let v = 2; v < hgt - 1; v++) if ((gu + v) % 6 < 3) px(sx_, sy_ + v, 1, 1, f.base ? '#c9a21a' : '#b8901a'); }
                    else if (pc === 1) px(sx_, sy_ + 4, 1, 1, neon);
                    else if (pc === 2) { if (gu % 3 === 0) px(sx_, sy_ + 2, 1, 4, dk); }
                    else if (gu % 6 === 0) px(sx_, sy_ + 3, 1, 1, ['#ff3a3a', '#43ff74', '#ffd23f', neon][(gu / 6) % 4]); }
                line(Db[0], Db[1], Cb[0], Cb[1], dk); line(Dd[0], Dd[1], C[0], C[1], neon);
                if (!has(i - 1, j) || has(i - 1, j + 1)) line(Dd[0], Dd[1], Db[0], Db[1], dk);
            }
            if (!has(i + 1, j)) {
                fillPoly([C, B, Bb, Cb], rt);
                if (j % 2 === 0) { let [sx_, sy_] = P(x + CS, y + 2, hgt); px(sx_, sy_ + 3, 1, 1, f.pat === 1 ? neon : mix(rt, '#ffffff', 0.15)); }
                line(Cb[0], Cb[1], Bb[0], Bb[1], dk); line(C[0], C[1], B[0], B[1], mix(neon, '#000000', 0.25));
                if (!has(i, j - 1) || has(i + 1, j - 1)) line(B[0], B[1], Bb[0], Bb[1], dk);
            }
            fillPoly([A, B, C, Dd], top);
            if ((i + (f.gi || 0)) % 3 === 0) line(Dd[0], Dd[1], A[0], A[1], seam);
            if (!has(i, j - 1)) line(A[0], A[1], B[0], B[1], mix(neon, '#000000', 0.5));
            if (!has(i - 1, j)) line(Dd[0], Dd[1], A[0], A[1], mix(neon, '#000000', 0.5));
            if (!has(i + 1, j)) line(B[0], B[1], C[0], C[1], has(i, j + 1) ? dk : neon);
            if (f.kind === 'ice') { bx.globalAlpha = 0.4; fillPoly([A, B, C, Dd], '#bff4ff'); bx.globalAlpha = 1; }
            if (f.kind === 'heavy' && (i + j) % 2 === 0) { let [cx, cy] = P(x + 2, y + 2, hgt); px(cx - 1, cy, 3, 1, '#ffd23f'); }
            if (f.kind === 'hot' && (i * 5 + j * 3) % 4 === 0) { let [cx, cy] = P(x + 2, y + 2, hgt); px(cx - 1, cy, 2, 1, '#ffd23f'); }
            if (f.kind === 'glitch' && (i * 7 + j * 3) % 5 === 0) { let [cx, cy] = P(x + 2, y + 2, hgt); px(cx - 2, cy, 4, 1, '#ff2a4a'); }
        }
        if (eye) {
            let best = null; for (let j = h - 1; j >= 0 && !best; j--) { let run = []; for (let i = 0; i < w; i++) if (has(i, j) && !has(i, j + 1)) run.push(i); if (run.length >= 2) best = [run[Math.floor(run.length / 2)], j]; }
            if (best) { let x = best[0] * CS - HALF, y = best[1] * CS - HALF + CS, [a0, a1] = P(x - 3, y, hgt), [b0, b1] = P(x + 6, y, hgt); line(a0, a1 + 3, b0, b1 + 3, '#ff2a4a'); line(a0 + 1, a1 + 4, b0 - 1, b1 + 4, '#7a0a18'); px(a0 + 4, a1 + 4, 2, 1, '#ffffff'); }
        }
        [bx, OX, OY] = keep;
        c.hgt = hgt; return c;
    }
    function blit(img, dx, dy, z) { let [sx_, sy_] = P(dx, dy, z); bx.drawImage(img, sx_ - IW / 2, sy_ - 35 - img.hgt); }

    const SKY = [[0, '#14062a', '#45104a'], [400, '#0d0822', '#2a1242'], [800, '#070918', '#1b1236'], [1150, '#03040c', '#0c0a1e'], [1500, '#000000', '#060410']];
    function skyAt(z) {
        for (let i = 0; i < SKY.length - 1; i++) if (z < SKY[i + 1][0]) { let t = (z - SKY[i][0]) / (SKY[i + 1][0] - SKY[i][0]); return [mix(SKY[i][1], SKY[i + 1][1], t), mix(SKY[i][2], SKY[i + 1][2], t)]; }
        return [SKY[SKY.length - 1][1], SKY[SKY.length - 1][2]];
    }
    function circle(cx, cy, r, c) { bx.fillStyle = c; for (let y = -r; y <= r; y++) { let w = Math.floor(Math.sqrt(r * r - y * y)); bx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); } }
    const sy = (z, f) => H * 0.62 - (z - S.cam) * f;
    const SIGNS = ['薬', '古本', '営業中', 'カラオケ', '餃子', '占い', '歯科', '中古', '麻雀', '整体', '宿', '自販機', '眼鏡', '湯'];
    const ADS = ['腰痛に効く|good for your back', 'ぬるい水 新発売|lukewarm water. new', '月で歌おう|sing on the moon', '落とし物 預かってます|we have your lost thing', '本物の雨 使用|made with real rain', '鬼積み協会|stacking association', '牛乳|milk'];
    let city = null, starC = null;
    function makeCity() {
        let r = rng(4444), far = [], mid = [];
        for (let x = -20; x < W + 40;) { let w = 18 + Math.floor(r() * 30); far.push({ x, w, h: 90 + Math.floor(r() * 220), ant: r() < 0.4, strip: r() < 0.25 ? Math.floor(r() * 3) : -1, seed: Math.floor(r() * 1e6) }); x += w + Math.floor(r() * 4); }
        for (let x = -10; x < W + 30;) { let w = 26 + Math.floor(r() * 30); mid.push({ x, w, h: 50 + Math.floor(r() * 150), sign: r() < 0.7 ? SIGNS[Math.floor(r() * SIGNS.length)] : null, sx: r() < 0.5 ? 0 : 1, col: [theme.p, theme.s, '#ffd23f', '#43ff74', '#ff4d4d'][Math.floor(r() * 5)], ad: r() < 0.3 ? (WD().ads || ADS)[Math.floor(r() * (WD().ads || ADS).length)] : null, flick: r() < 0.3, seed: Math.floor(r() * 1e6) }); x += w + 6 + Math.floor(r() * 10); }
        city = { far, mid, theme: theme.p };
    }
    function glowText(s, x, y, size, col, vert) {
        bx.save(); bx.font = size + "px 'DotGothic16', monospace"; bx.textBaseline = 'top'; bx.shadowColor = col; bx.shadowBlur = 4; bx.fillStyle = mix(col, '#ffffff', 0.45);
        if (vert) [...s].forEach((ch, i) => bx.fillText(ch, x, y + i * (size + 1))); else bx.fillText(s, x, y);
        bx.restore();
    }
    function back(now) {
        if (!city || city.theme !== theme.p) makeCity();
        let cam = S.cam, [hi, lo] = skyAt(cam + H * 0.3), neon = Math.min(1.4, 0.75 + S.kick * 0.25 + S.city * 0.5), alarm = S.state === 'play' && !S.demo && S.lean > S.n.leanWarn;
        let g = bx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, hi); g.addColorStop(1, lo); bx.fillStyle = g; bx.fillRect(0, 0, W, H);
        let haze = clamp(1 - cam / 900, 0, 1); if (haze > 0) { let hg = bx.createLinearGradient(0, H * 0.4, 0, H); hg.addColorStop(0, rgba(theme.p, 0)); hg.addColorStop(1, rgba(theme.p, 0.32 * haze)); bx.fillStyle = hg; bx.fillRect(0, 0, W, H); }
        for (let y = 0; y < H; y += 4) for (let x = (y / 4) % 2 ? 0 : 2; x < W; x += 4) px(x, y, 1, 1, 'rgba(0,0,0,0.1)');
        let dark = clamp((cam - 900) / 400, 0, 1);
        if (dark > 0) { if (!starC) { let r = rng(9); starC = []; for (let i = 0; i < 110; i++) starC.push([r() * W, r() * 900, r()]); } bx.globalAlpha = dark; starC.forEach(([x, y, b], i) => px(x, (y + cam * 0.04) % H, 1, 1, (Math.floor(now * 3 + i) % 9 === 0) ? '#ffffff' : b > 0.5 ? '#cfd6ff' : '#55597a')); bx.globalAlpha = 1; }
        { let y = sy(1250, 0.6); if (y > -80 && y < H + 80) { for (let a = 0; a < 6.283; a += 0.01) { let x = W / 2 + Math.cos(a) * W * 0.75, yy = y + Math.sin(a) * 26; if (Math.sin(a) < 0) px(x, yy, 2, 1, '#2a3050'); else px(x, yy, 2, 2, '#3a4268'); } for (let k = 0; k < 24; k++) { let a = k / 24 * 3.1416 + now * 0.05, x = W / 2 + Math.cos(a) * W * 0.75, yy = y + Math.sin(a) * 26; px(x, yy, 2, 1, Math.floor(now * 2 + k) % 4 ? '#ff4d4d' : '#ffffff'); } } }
        { let y = sy(1550, 0.55), x = W * 0.72; if (y > -60 && y < H + 60) { circle(x, y, 30, '#b9bcc6'); circle(x - 9, y - 7, 6, '#9fa3ad'); circle(x + 11, y + 9, 4, '#9fa3ad'); bx.globalAlpha = 0.5 + 0.5 * (Math.floor(now * 3) % 5 ? 1 : 0); px(x - 22, y + 18, 44, 11, '#12081a'); glowText('カラオケ', x - 20, y + 19, 8, theme.p); bx.globalAlpha = 1; } }
        let fy = sy(-24, 0.25);
        if (fy - 320 < H) city.far.forEach(b => {
            let top = fy - b.h, r = rng(b.seed); px(b.x, top, b.w, H - top + 400, '#120a22'); px(b.x, top, b.w, 1, '#1e1236');
            let wc = [rgba('#ffd27a', 0.35), rgba(theme.s, 0.3), rgba(theme.p, 0.3)][b.seed % 3]; for (let j = top + 4; j < Math.min(H, fy); j += 5) { if (r() > 0.28) continue; for (let i = b.x + 2; i < b.x + b.w - 2; i += 3) if (r() < 0.55 && j > -5) px(i, j, 2, 1, wc); }
            if (b.strip >= 0) { bx.globalAlpha = 0.5 * neon; px(b.x + (b.strip ? b.w - 2 : 1), top + 6, 1, b.h - 10, b.strip === 2 ? '#ffd23f' : b.strip ? theme.s : theme.p); bx.globalAlpha = 1; }
            if (b.ant) { px(b.x + b.w / 2, top - 12, 1, 12, '#1e1236'); if (Math.floor(now * 1.5 + b.x) % 3 === 0 || alarm) px(b.x + b.w / 2 - 1, top - 13, 3, 2, '#ff3a3a'); if (alarm && !calm()) { let a = now * 6 + b.x, L = 40; bx.globalAlpha = 0.18; fillPoly([[b.x + b.w / 2, top - 12], [b.x + b.w / 2 + Math.cos(a - 0.15) * L, top - 12 + Math.sin(a - 0.15) * L * 0.4], [b.x + b.w / 2 + Math.cos(a + 0.15) * L, top - 12 + Math.sin(a + 0.15) * L * 0.4]], '#ff2a2a'); bx.globalAlpha = 1; } }
        });
        if (!calm()) kana(now);
        { let y = sy(520, 0.7) + Math.sin(now * 0.6) * 8, x = ((now * 9) % (W + 200)) - 100; if (y > -40 && y < H + 40) koi(x, y, now); }
        cars(now);
        { let y = sy(820, 0.75), x = W * 0.25 + Math.sin(now * 0.15) * 40; if (y > -30 && y < H + 30) { for (let k = -14; k <= 14; k++) { let hh = Math.round(Math.sqrt(1 - (k / 15) ** 2) * 9); px(x + 30 + k * 2, y - hh, 2, hh * 2, '#2a2438'); } px(x + 8, y - 4, 44, 8, '#0a0610'); bx.save(); bx.beginPath(); bx.rect(x + 9, y - 4, 42, 8); bx.clip(); let msg = '本日のおすすめ：ぬるい水 // todays pick: lukewarm water // '; glowText(msg + msg, x + 9 - ((now * 18) % (msg.length * 6)), y - 4, 7, '#ffd23f'); bx.restore(); px(x + 26, y + 9, 8, 3, '#1a1626'); } }
        // TODO the drone should actually drop the banana at some point
        { let z = 330 + (Math.floor(now / 14) % 3) * 90, y = sy(z, 0.85) + Math.sin(now * 3) * 2, x = W + 30 - ((now * 22) % 14) / 14 * (W + 60) * 1; if (y > -10 && y < H + 10) { px(x - 6, y, 13, 2, '#2a2a34'); let sp = Math.floor(now * 30) % 2; px(x - 8, y - 1, 4, 1, sp ? '#9aa0b0' : '#5a5f70'); px(x + 5, y - 1, 4, 1, sp ? '#5a5f70' : '#9aa0b0'); line(x, y + 2, x, y + 5, '#444'); px(x - 2, y + 6, 5, 2, '#ffe14a'); px(x + 2, y + 5, 1, 1, '#ffe14a'); px(x - 3, y + 7, 1, 1, '#5a4a10'); if (Math.floor(now * 4) % 2) px(x, y - 1, 1, 1, '#ff3a3a'); } }
        let my = sy(-24, 0.5);
        if (my - 220 < H) city.mid.forEach((b, bi) => {
            let top = my - b.h, r = rng(b.seed); px(b.x, top, b.w, H - top + 300, '#1a0f2c'); px(b.x, top, b.w, 2, '#2c1c46');
            for (let j = top + 6; j < Math.min(H + 2, my); j += 7) for (let i = b.x + 3; i < b.x + b.w - 4; i += 6) { let v = r(); px(i, j, 3, 3, v < 0.5 ? '#22173a' : v < 0.56 ? rgba('#ffd27a', 0.6) : v < 0.6 ? rgba(theme.s, 0.5) : '#1c1230'); }
            if (bi % 3 === 0) { px(b.x + 2, top + 22, 7, 5, '#3a3448'); if (Math.floor(now * 1.3 + bi) % 4 === 0) px(b.x + 5, top + 28 + (now * 40 % 10), 1, 2, rgba('#9fd8ff', 0.7)); }
            if (b.sign) { let on = !b.flick || Math.random() > 0.08 + (Math.floor(now * 0.7 + bi) % 7 === 0 ? 0.6 : 0), sx_ = b.sx ? b.x + b.w - 2 : b.x - 9, n = [...b.sign].length; px(sx_, top + 10, 11, n * 9 + 4, '#0c0614'); px(sx_, top + 10, 11, 1, b.col); px(sx_, top + 13 + n * 9, 11, 1, b.col); if (on) { bx.globalAlpha = neon; glowText(b.sign, sx_ + 2, top + 12, 8, b.col, true); bx.globalAlpha = 1; } }
            if (b.ad) { let [j, e] = b.ad.split('|'), ax = b.x + 3, ay = top + 30, aw = b.w - 6; px(ax - 1, ay - 1, aw + 2, 22, '#06030a'); bx.globalAlpha = 0.85; px(ax, ay, aw, 20, mix(b.col, '#000000', 0.7)); bx.globalAlpha = 1; bx.save(); bx.beginPath(); bx.rect(ax, ay, aw, 20); bx.clip(); glowText(j, ax + 2, ay + 2, 8, '#ffffff'); glowText(e, ax + aw - ((now * 14 + bi * 30) % (e.length * 5 + aw)), ay + 12, 6, b.col); bx.restore(); }
            if (bi === 4) { let cx = b.x + b.w - 8, cy = top - 6, look = S.mov && S.mov.x + HALF + OX > cx ? 1 : 0; px(cx, cy + 2, 6, 4, '#07040b'); px(cx + (look ? 4 : -1), cy, 3, 3, '#07040b'); px(cx + (look ? 4 : -1), cy - 1, 1, 1, '#07040b'); px(cx + (look ? 6 : 1), cy - 1, 1, 1, '#07040b'); if (Math.floor(now * 0.4) % 6) px(cx + (look ? 5 : 0), cy + 1, 1, 1, '#ffe14a'); px(cx - 2 + Math.round(Math.sin(now * 2) * 1), cy + 5, 3, 1, '#07040b'); }
            if (bi === 2) { let bx0 = b.x + 4, by0 = top + 40; px(bx0, by0 + 8, 14, 1, '#4a3a5a'); px(bx0 + 5, by0, 3, 3, '#0a0610'); px(bx0 + 4, by0 + 3, 5, 5, '#0a0610'); let e = 0.5 + 0.5 * Math.sin(now * 1.7); px(bx0 + 8, by0 + 3, 1, 1, mix('#7a2a10', '#ffb04a', e)); for (let k = 0; k < 4; k++) { let t = (now * 0.5 + k / 4) % 1; bx.globalAlpha = 0.4 * (1 - t); px(bx0 + 9 + t * 6 + Math.sin(t * 6 + k) * 2, by0 + 2 - t * 16, 2, 2, '#b8b0c8'); } bx.globalAlpha = 1; }
        });
        { let y = sy(60, 0.5); if (y > -10 && y < H + 10) { line(city.mid[1].x + city.mid[1].w, y, city.mid[2].x, y + 4, '#3a3048'); for (let k = 0; k < 4; k++) { let x = city.mid[1].x + city.mid[1].w + 3 + k * 6, sw = Math.round(Math.sin(now * 2 + k) * 1); px(x + sw, y + 1 + k, 4, 5, ['#d8d8e8', '#ff3fa4', '#19e3c4', '#d8d8e8'][k]); } let t = (now % 9) / 9; if (t < 0.4) px(city.mid[2].x - 6 + Math.sin(t * 20) * 3, y + 3 + t * 300, 2, 3, '#ffd23f'); } }
        if (!calm()) { bx.save(); bx.font = "22px 'DotGothic16', monospace"; bx.textBaseline = 'top'; for (let r = 0; r < 8; r++) { let str = (GENRE[vsg().id] + ' ' + GENREJ[vsg().id] + ' HARDCORE STACKING ハードコア積み ').repeat(3), off = ((r % 2 ? 1 : -1) * now * (18 + r * 4) * (S.fev > 0 ? 3 : 1)) % 400 - 200; bx.globalAlpha = (S.demo || S.fev > 0 ? 0.07 : 0.035) + (r === Math.floor(now * 4) % 8 ? 0.06 : 0) + (S.fev > 0 ? S.kick * 0.08 : 0); bx.fillStyle = r % 2 ? theme.p : '#ff2a4a'; bx.fillText(str, off, r * 28 + 4); } bx.restore(); }
        if (S.city > 0 && !calm()) { bx.globalAlpha = S.city * 0.12; px(0, 0, W, H, theme.s); bx.globalAlpha = 1; }
        if (alarm && !calm()) { bx.globalAlpha = 0.1 + 0.08 * Math.sin(now * 10); px(0, 0, W, H, '#ff0a2a'); bx.globalAlpha = 1; }
        if (!calm()) lasers(now);
        street(now);
        rain(now);
    }
    const NEWS = ['板が一枚積まれる|one slab placed', '専門家「高すぎる」|experts: its too high', 'カラスが避難|crows evacuated', '自販機 今日も無言|vending machine still silent', '猫は見ている|the cat is watching', '月のカラオケ 予約殺到|moon karaoke fully booked', 'ぬるい水 もうない|lukewarm water all gone', '傾きに注意|watch the lean'];
    const KANA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン0123456789';
    function kana(now) {
        let y0 = sy(-24, 0.25), top = y0 - 330; if (top > H) return;
        bx.save(); bx.font = "7px 'DotGothic16', monospace"; bx.textBaseline = 'top';
        for (let c = 0; c < 16; c++) {
            let x = 6 + c * (W - 12) / 15, sp = 22 + (c * 37) % 30, len = 6 + (c * 7) % 8, head = ((now * sp + c * 53) % (H + len * 8)) - len * 8;
            for (let k = 0; k < len; k++) { let y = head - k * 8; if (y < -8 || y > H) continue; bx.globalAlpha = k ? 0.28 * (1 - k / len) : 0.6; bx.fillStyle = k ? theme.s : '#ffffff'; bx.fillText(KANA[(Math.floor(now * 6) + c * 5 + k * 3) % KANA.length], x, Math.round(y)); }
        }
        bx.restore();
    }
    const LANES = [[110, 0.72, 1, 60], [250, 0.8, -1, 95], [400, 0.86, 1, 130], [610, 0.9, -1, 75], [900, 0.93, 1, 110]];
    function cars(now) {
        LANES.forEach(([z, f, dir, sp], li) => {
            let y = sy(z, f); if (y < -10 || y > H + 10) return;
            for (let k = 0; k < 3; k++) {
                let x = dir > 0 ? ((now * sp + k * 160 + li * 70) % (W + 120)) - 60 : W + 60 - ((now * sp + k * 160 + li * 70) % (W + 120)), yy = y + k * 3 + Math.sin(now * 2 + k) * 1;
                for (let q = 1; q < 22; q++) { bx.globalAlpha = 0.5 * (1 - q / 22); px(x - dir * q * 2, yy + 1, 2, 1, q < 6 ? '#ff2a4a' : theme.p); }
                bx.globalAlpha = 1; px(x - 4, yy - 1, 9, 3, '#1c1428'); px(x - 2, yy - 2, 5, 1, '#2c2040'); px(x + dir * 4, yy, 1, 1, '#ffffff'); px(x - dir * 4, yy, 1, 1, '#ff2a4a'); if (Math.floor(now * 3 + k) % 2) px(x, yy + 2, 1, 1, theme.s);
            }
        });
    }
    function koi(x, y, now) {
        bx.globalAlpha = 0.35 + 0.15 * Math.sin(now * 5);
        for (let i = 0; i < 46; i++) { let t = i / 46, w = Math.sin(t * Math.PI) * 9 * (1 - t * 0.4), sx_ = x + i * 2, wob = Math.sin(now * 2 - t * 4) * 3 * t; px(sx_, y - w + wob, 2, 1, theme.s); px(sx_, y + w + wob, 2, 1, theme.s); if (i % 7 === 3 && Math.floor(now * 8 + i) % 2) px(sx_, y + wob, 2, 1, theme.p); }
        let tw = Math.sin(now * 2 - 4) * 3; line(x + 92, y + tw, x + 104, y - 8 + tw * 2, theme.s); line(x + 92, y + tw, x + 104, y + 8 + tw * 2, theme.s); line(x + 104, y - 8 + tw * 2, x + 104, y + 8 + tw * 2, theme.s);
        px(x + 8, y - 3, 2, 2, '#ffffff'); bx.globalAlpha = 1;
        for (let j = -10; j < 10; j += 2) { bx.globalAlpha = 0.08; px(x - 4, y + j, 112, 1, '#000000'); } bx.globalAlpha = 1;
    }
    function street(now) {
        let gy = sy(-24, 1); if (gy > H + 40) return;
        px(0, gy, W, H, '#0c0814');
        for (let k = 0; k < 18; k++) { let x = (k * 53) % W, c = [theme.p, theme.s, '#ffd23f'][k % 3]; bx.globalAlpha = 0.18 + 0.1 * Math.sin(now * 3 + k); px(x, gy + 3 + (k * 7) % 14, 8 + (k * 5) % 20, 1, c); } bx.globalAlpha = 1;
        let vx = W - 54, vy = gy - 30; spr('vend', vx + 9, vy + 30); bx.globalAlpha = 0.25; px(vx - 6, gy, 30, 6, '#ffffff'); bx.globalAlpha = 1;
        let ct = now % 11; if (ct < 2.5) { let cx = vx + 6 - ct * 18, cyy = Math.min(gy - 3, vy + 24 + ct * ct * 40); px(cx, cyy, 3, 3, '#ff3a3a'); px(cx, cyy, 3, 1, '#ffffff'); }
        let ly = gy - 70; line(0, ly, W, ly + 10, '#1c1428'); line(0, ly + 3, W, ly + 14, '#1c1428');
        let gone = S.crow > 0;
        for (let k = 0; k < 5; k++) { let x = 60 + k * 23 + (k % 2) * 4, y = ly + (x / W) * 10 + 1; if (gone) { let t = 1.5 - S.crow; x += t * (40 + k * 15); y -= t * (50 + k * 9); spr('crow_f' + (1 + Math.floor(now * 10 + k) % 2), x, y); } else spr('crow', x, y, k % 2 === 1); }
        for (let k = 0; k < 6; k++) { let t = (now * 0.4 + k / 6) % 1; bx.globalAlpha = 0.18 * (1 - t); px(W * 0.18 + Math.sin(t * 5 + k) * 4, gy - t * 40, 6, 4, '#c8c0e0'); } bx.globalAlpha = 1;
    }
    let rainC = null;
    function rain(now) {
        if (calm()) return;
        if (!rainC) { let r = rng(12); rainC = []; for (let i = 0; i < 140; i++) rainC.push([r() * 600, r() * 600, 0.6 + r() * 0.8]); }
        // it rains upwards above the smog
        let up = S.cam > 950 && S.cam < 1300, n = S.cam > 1300 ? 0 : 140;
        bx.fillStyle = rgba('#b4c8ff', 0.28);
        for (let i = 0; i < n; i++) { let [x0, y0, s] = rainC[i], y = up ? (H - (y0 + now * 260 * s) % (H + 20)) : ((y0 + now * 300 * s) % (H + 20)) - 10, x = ((x0 - now * 60 * s) % (W + 20) + W + 20) % (W + 20) - 10; bx.fillRect(Math.round(x), Math.round(y), 1, 4); bx.fillRect(Math.round(x) - 1, Math.round(y) + 4, 1, 1); }
    }
    function grid(now) {
        let z = 0, a = clamp(1 - S.cam / 260, 0, 1); if (a <= 0) return;
        bx.globalAlpha = 0.35 * a; let off = (now * 12) % 16;
        for (let k = -10; k <= 10; k++) { let u = k * 16 + off; let [x0, y0] = P(u, -170, z), [x1, y1] = P(u, 170, z); line(x0, y0, x1, y1, theme.s); let [x2, y2] = P(-170, u, z), [x3, y3] = P(170, u, z); line(x2, y2, x3, y3, theme.p); }
        bx.globalAlpha = 1;
    }
    function rings(now, front) {
        if (S.demo && S.state !== 'play') return;
        let n = S.floors.length, [cx, cy] = centre(last(S.floors).cells), sp = 0.4 + Math.min(S.chain, 12) * 0.12;
        [[46, LH * 1.5, 1], [64, -LH * 2, -1], [80, -LH * 6, 1]].forEach(([R, dz, dir], ri) => {
            let z = (n - 1) * LH + dz, rot = now * sp * dir + ri;
            for (let a = 0; a < 6.283; a += 0.025) {
                let back_ = Math.sin(a + 0.785) < 0; if (back_ === front) continue;
                let on = Math.floor((a + rot) * 6 / Math.PI) % 2 === 0, tick = Math.abs(((a + rot) % 0.524) - 0.26) < 0.03; if (!on && !tick) continue;
                let [x, y] = P(cx + Math.cos(a) * R, cy + Math.sin(a) * R, z); bx.globalAlpha = (front ? 0.75 : 0.35) * (0.6 + S.kick * 0.4); px(x, y - (tick ? 2 : 0), 1, tick ? 3 : 1, ri % 2 ? theme.p : theme.s);
            }
        });
        bx.globalAlpha = 1;
    }
    function drones(now) {
        if (S.state !== 'play') return;
        let n = S.floors.length, [cx, cy] = centre(last(S.floors).cells), z = (n - 1) * LH;
        for (let k = 0; k < 2; k++) {
            let a = now * 0.7 + k * Math.PI, [x, y] = P(cx + Math.cos(a) * 90, cy + Math.sin(a) * 90, z + 34 + Math.sin(now * 2 + k) * 4), [tx, ty] = P(cx, cy, z + LH);
            bx.globalAlpha = 0.1 + S.kick * 0.06; fillPoly([[x, y + 2], [tx - 14, ty], [tx + 14, ty]], '#f0e8ff'); bx.globalAlpha = 1;
            px(x - 4, y, 9, 2, '#1c1428'); let r = Math.floor(now * 24) % 2; px(x - 6, y - 1, 3, 1, r ? '#8a8aa0' : '#4a4a60'); px(x + 4, y - 1, 3, 1, r ? '#4a4a60' : '#8a8aa0'); px(x, y + 2, 1, 1, Math.floor(now * 3 + k) % 2 ? '#ff2a4a' : '#300810');
        }
    }
    function arcs(now) {
        S.arcs = (S.arcs || []).filter(a => (a.t += 1 / 60) < 0.14);
        S.arcs.forEach(a => { for (let i = 0; i < a.p.length - 1; i++) { bx.globalAlpha = 0.35; line(a.p[i][0], a.p[i][1] + 1, a.p[i + 1][0], a.p[i + 1][1] + 1, theme.s); bx.globalAlpha = 1; line(a.p[i][0], a.p[i][1], a.p[i + 1][0], a.p[i + 1][1], '#ffffff'); } });
    }
    function zap() {
        if (calm() || S.floors.length < 4) return;
        let n = S.floors.length, i0 = n - 1 - Math.floor(Math.random() * Math.min(6, n - 2)), side = Math.random() < 0.5 ? 1 : -1, [x0, y0] = P(side * 30, -side * 0 + 30, (i0 - 1) * LH + 4), [x1, y1] = P(side * 34, 34, (i0 - 3) * LH), pts = [[x0, y0]];
        for (let k = 1; k < 5; k++) pts.push([x0 + (x1 - x0) * k / 5 + (Math.random() - 0.5) * 10, y0 + (y1 - y0) * k / 5 + (Math.random() - 0.5) * 6]); pts.push([x1, y1]);
        S.arcs = (S.arcs || []).concat([{ p: pts, t: 0 }]);
    }
    const PANELS = [['荷重', 'load', () => (4.2 + S.floors.length * 0.31).toFixed(1) + 't'], ['振動', 'shake', () => Math.round(S.lean * 7 + S.kick * 40) + 'hz'], ['ハト', 'pigeons', () => String(2 + (Math.floor(S.now / 9) % 3))], ['温度', 'slab temp', () => (31 + S.chain * 1.7 + Math.sin(S.now) * 0.4).toFixed(1) + '°']];
    function panels(now) {
        if (S.state !== 'play' || S.demo) return;
        let n = S.floors.length, [x0, y0] = P(0, 0, (n - 1) * LH);
        PANELS.forEach((p, i) => {
            let life = (now * 0.35 + i * 0.27) % 1; if (life > 0.8) return;
            let side = i % 2 ? 1 : -1, x = x0 + side * (78 + (i >> 1) * 14) - (side < 0 ? 46 : 0), y = y0 - 50 + (i >> 1) * 34 + Math.sin(now + i) * 2, w = 46, g = life < 0.06 ? life / 0.06 : 1;
            if (Math.random() < 0.03) return;
            bx.globalAlpha = 0.75 * g; px(x, y, w * g, 22, '#0a0612'); px(x, y, w * g, 1, theme.s); px(x, y + 21, w * g, 1, rgba(theme.s, 0.4)); line(side < 0 ? x + w : x, y + 11, x0 - side * 6, y0 - 6, rgba(theme.s, 0.35));
            if (g >= 1) { glowText(p[0] + ' // ' + p[1], x + 2, y + 2, 6, '#cfcbd6'); glowText(p[2](), x + 2, y + 11, 8, theme.p); for (let k = 0; k < 8; k++) px(x + 30 + k * 2, y + 19 - Math.abs(Math.sin(now * 5 + k + i)) * 6, 1, Math.abs(Math.sin(now * 5 + k + i)) * 6, rgba(theme.s, 0.7)); }
            bx.globalAlpha = 1;
        });
    }
    function drawTower(now) {
        let sw = swayNow(), n = S.floors.length;
        grid(now); rings(now, false);
        S.floors.forEach((f, i) => {
            if (!f.img) f.img = slabImg(f);
            let z = f.base ? -LH * 3 : (i - 1) * LH, k = n > 1 ? i / n : 0, s = Math.round(sw * k * k), q = f.fall, dx = q ? q.x : 0, dy = q ? q.y : 0;
            if (q) z += q.z; if (f.land) z -= Math.round(f.land * 2);
            OX += s; blit(f.img, dx, dy, z); OX -= s;
        });
        // where your best was. the tape you have to beat
        S.pbY = null;
        if (!S.demo && S.state === 'play') { let pbH = D.m[S.mode].bestH; if (pbH >= 5 && pbH >= n - 1) { let [x, y] = P(0, 0, pbH * LH); y = Math.round(y); for (let i = -60; i < 60; i += 5) px(x + i, y, 3, 1, i % 10 ? '#ffd23f' : '#0a0610'); px(x + 60, y - 8, 1, 9, '#ffffff'); px(x + 61, y - 8, 6, 4, theme.s); S.pbY = [x + 69, y - 3, pbH]; } }
        if (n > 50 && S.state === 'play') { let [cx, cy, k] = centre(last(S.floors).cells), [x, y] = P(cx, cy, (n - 1) * LH); px(x - 3, y - 2, 7, 2, '#ff6a1a'); px(x - 2, y - 7, 5, 5, '#ff6a1a'); px(x - 1, y - 10, 3, 3, '#ff6a1a'); px(x - 2, y - 5, 5, 1, '#ffffff'); }
        if (S.mov && S.state === 'play') {
            let m = S.mov, z = (n - 1) * LH + (S.glitch > 0 && !calm() ? Math.round((Math.random() - 0.5) * 4) : 0);
            blit(m.img, m.x + HALF, m.y + HALF, z);
            if (m.kind === 'glitch' && !calm()) { let hx = -HALF + m.hi * CS, hy = -HALF + m.hj * CS; bx.globalAlpha = 0.35; blit(m.img, 2 * hx - m.x + HALF, 2 * hy - m.y + HALF, z); bx.globalAlpha = 1; }
        }
        S.chunks.forEach(c => blit(c.img, c.x + HALF, c.y + HALF, c.z));
        rings(now, true); drones(now); arcs(now); panels(now);
    }
    function drawFx(now) {
        S.fx.forEach(f => {
            if (f.k === 'spark') { let [x, y] = P(f.x, f.y, f.z + LH); bx.globalAlpha = 1 - f.t / f.life; px(x, y, 2, 2, f.col); bx.globalAlpha = 1; }
            else if (f.k === 'ring') { let s = 1 + f.t * 3, [x, y] = P(f.x, f.y, f.z), rx = f.r * 1.4 * s, ry = rx / 2; bx.globalAlpha = 1 - f.t / f.life; for (let a = 0; a < 6.283; a += 0.04) px(x + Math.cos(a) * rx, y + Math.sin(a) * ry, 2, 1, mix(theme.s, '#ffffff', 0.5)); bx.globalAlpha = 1; }
        });
        if (S.chain >= 5 && S.state === 'play' && !calm()) {
            let f = last(S.floors), z = (S.floors.length - 1) * LH, edge = [];
            for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) if (f.cells[ix(i, j)] && (j === G - 1 || !f.cells[ix(i, j + 1)] || i === G - 1 || !f.cells[ix(i + 1, j)])) edge.push([i, j]);
            for (let k = 0; k < 14 + S.chain * 2 && edge.length; k++) { let [i, j] = edge[Math.floor(Math.random() * edge.length)], [x, y] = P(i * CS - HALF + Math.random() * CS, j * CS - HALF + CS, z), hh = Math.random() * (6 + S.chain); px(x, y - hh, 1, 1, hh > 8 ? '#ffffff' : hh > 4 ? theme.s : theme.p); }
        }
    }

    const HYPE = () => [theme.p, theme.s, '#ffffff', mix(theme.p, theme.s, 0.5)];
    function vents(k) { for (let side = 0; side < 2; side++) for (let j = 0; j < 2; j++) for (let i = 0; i < 22 * k; i++) S.sfx.push({ k: 'vent', x: (side ? W - 12 - j * 30 : 12 + j * 30) + (Math.random() - 0.5) * 5, y: H - 4, vx: (Math.random() - 0.5) * 20, vy: -(200 + Math.random() * 180), g: 200, t: 0, life: 0.45 + Math.random() * 0.35, c: j ? theme.s : theme.p }); }
    function shards(n, x, y) { let H_ = HYPE(); for (let i = 0; i < n; i++) { let a = Math.random() * 6.283, sp = 60 + Math.random() * 160; S.sfx.push({ k: 'shard', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, g: 160, t: 0, life: 0.7 + Math.random() * 0.6, col: H_[Math.floor(Math.random() * H_.length)], sz: 1 + Math.floor(Math.random() * 3) }); } }
    function co2() { for (let side = 0; side < 2; side++) for (let i = 0; i < 90; i++) S.sfx.push({ k: 'co2', x: (side ? W - 56 : 56) + (Math.random() - 0.5) * 4, y: H - 14, vx: (Math.random() - 0.5) * 50 + (side ? -10 : 10), vy: -(360 + Math.random() * 160), g: 90, t: -i * 0.004, life: 0.9 + Math.random() * 0.5, s: 2 }); }
    function emp(x, y, big) { S.sfx.push({ k: 'emp', x, y, vx: 0, vy: 0, t: 0, life: big ? 0.7 : 0.4, big }); }
    function slabXY() { let m = S.mov, f = last(S.floors), [cx, cy] = centre(f.cells), [x, y] = P(cx, cy, (S.floors.length - 1) * LH); return [x, y]; }
    function strike() {
        let [x, y] = slabXY(), pts = [[x + (Math.random() - 0.5) * 60, -10]], br = [];
        for (let k = 1; k < 9; k++) { let t = k / 9, px_ = pts[0][0] + (x - pts[0][0]) * t + (Math.random() - 0.5) * 30, py = -10 + (y + 10) * t; pts.push([px_, py]); if (Math.random() < 0.4) br.push([[px_, py], [px_ + (Math.random() - 0.5) * 50, py + 20 + Math.random() * 20]]); }
        pts.push([x, y]); S.bolt = { pts, br, t: 0 }; S.flash = 1;
    }
    function hype(perfect) {
        S.slam = { n: S.floors.length, t: 0, bad: false }; S.city = 1;
        if (calm()) return;
        if (perfect && S.chain >= 5 && S.chain % 5 === 0 && !calm()) strike();
        let [x, y] = slabXY();
        S.punch = perfect ? 1.3 : 0.7; S.shake = Math.max(S.shake, perfect ? 0.9 : 0.5); S.ab = perfect ? 1.3 : 0.6;
        if (perfect) { vents(1); shards(24 + S.chain * 4, x, y); emp(x, y, S.chain % 5 === 0); S.lock = 1; if (S.chain % 5 === 0) { S.ab = 1.6; snd('boom'); } }
    }
    function bail() { S.slam = { n: S.floors.length, t: 0, bad: true }; S.city = 0.5; S.crow = 1.5; S.shake = 1; S.punch = 0.6; S.ab = 1.2; S.tear = 0.5; S.dmg = 1; }
    function kaboom() { if (calm()) return; S.crow = 1.5; S.punch = 1.5; S.ab = 2; S.tear = 1.5; S.dmg = 2; let [x, y] = slabXY(); shards(120, x, y); emp(x, y, true); vents(2); }
    function lasers(now) {
        let k = clamp(MU.tier / 4 + S.chain / 10, 0.2, 1), n = 3 + Math.round(k * 5), pulse = 0.35 + S.kick * 0.55, H_ = HYPE();
        for (let i = 0; i < n; i++) {
            let side = i % 2, x0 = side ? W - 16 - i * 7 : 16 + i * 7, a = -Math.PI / 2 + Math.sin(now * (0.6 + i * 0.21) + i * 1.9) * 0.8, col = H_[i % 2];
            let x1 = x0 + Math.cos(a) * H * 1.6, y1 = H + Math.sin(a) * H * 1.6;
            bx.globalAlpha = pulse * 0.25; line(x0 - 1, H, x1 - 1, y1, col); line(x0 + 1, H, x1 + 1, y1, col); bx.globalAlpha = Math.min(1, pulse); line(x0, H, x1, y1, mix(col, '#ffffff', 0.5)); bx.globalAlpha = 1;
        }
        for (let i = 0; i < 2; i++) { let x0 = i ? W * 0.75 : W * 0.25, a = -Math.PI / 2 + Math.sin(now * 0.45 + i * 2.3) * 0.55, L = H * 1.3, sp = 0.11; bx.globalAlpha = 0.06 + S.kick * 0.04; fillPoly([[x0, H], [x0 + Math.cos(a - sp) * L, H + Math.sin(a - sp) * L], [x0 + Math.cos(a + sp) * L, H + Math.sin(a + sp) * L]], '#e8e0ff'); bx.globalAlpha = 1; }
    }
    function drawHype(now) {
        S.sfx.forEach(f => {
            let a = 1 - f.t / f.life;
            if (f.k === 'vent') { let c = f.t < 0.1 ? '#ffffff' : f.t < 0.3 ? mix(f.c, '#ffffff', 0.4) : f.t < 0.5 ? f.c : mix(f.c, '#000000', 0.6), sz = f.t < 0.25 ? 3 : 2; bx.globalAlpha = Math.min(1, a * 1.6); px(f.x - sz / 2, f.y, sz, sz, c); }
            else if (f.k === 'shard') { bx.globalAlpha = Math.min(1, a * 2); px(f.x, f.y, f.sz, f.sz, Math.random() < 0.1 ? '#ffffff' : f.col); }
                        else if (f.k === 'emp') { let r = f.t * (f.big ? 700 : 420); bx.globalAlpha = a * 0.8; for (let q = 0; q < 6.283; q += 0.015) { let x = f.x + Math.cos(q) * r, y = f.y + Math.sin(q) * r * 0.5; px(x, y, 2, 1, q % 0.3 < 0.15 ? theme.s : '#ffffff'); } }
        });
        bx.globalAlpha = 1;
    }
    const GKIND = { sulfur: 'acid', caustic: 'acid', nightshift: 'acid', bunker: 'techno', hydraulic: 'red', conveyor: 'red', corrosion: 'laser', firealarm: 'laser', foundry: 'tunnel' };
    const vsg = () => rungSong(MU.rung || 0, MU.salt);
    const gkind = () => (MU.rung || 0) >= LADDER.length ? 'max' : GKIND[vsg().id] || 'acid';
    const GV = { fl: [], beat: -1, t: 0 };
    function genreBack(now) {
        if (calm()) return;
        let g = gkind(), k = S.kick, lv = Math.min(1, 0.5 + (MU.rung || 0) * 0.1 + MU.tier * 0.08);
        bx.save();
        if (g === 'acid' || g === 'max') {
            let td = MU.td || (MU.td = new Uint8Array(256)), live = MU.an && MU.on; if (live) MU.an.getByteTimeDomainData(td);
            let y0 = H * 0.24, prev = null;
            for (let o = 0; o < 2; o++) { bx.globalAlpha = o ? 0.25 : 0.75; prev = null;
                for (let x = 0; x <= W; x += 2) { let v = live ? (td[Math.floor(x / W * 255)] - 128) / 128 * 2.2 : Math.sin(x * 0.17 + now * 22) * Math.sin(x * 0.031 + now * 2.6) * 0.8; let y = y0 + clamp(v, -1, 1) * 26 * lv + o * 2; if (prev) { line(prev[0], prev[1], x, y, o ? theme.p : '#b6ff3a'); if (!o) line(prev[0], prev[1] + 1, x, y + 1, '#b6ff3a'); } prev = [x, y]; } }
            if (g === 'acid') for (let i = 0; i < 5; i++) { let x = W * (0.1 + i * 0.2), y = H * 0.1 + 6 + Math.sin(now * 2 + i * 1.7) * 4 - (S.beatN % 5 === i ? S.kick * 6 : 0); bx.globalAlpha = 0.9; spr('smiley', x, y); bx.globalAlpha = 1; }
        }
        if (g === 'techno') {
            bx.globalAlpha = 0.9; px(0, 6, W, 2, '#2a2e36'); px(0, 20, W, 2, '#2a2e36');
            for (let x = 0; x < W; x += 14) { line(x, 8, x + 7, 19, '#3a3f4a'); line(x + 7, 19, x + 14, 8, '#3a3f4a'); }
            for (let i = 0; i < 6; i++) { let x = W * (i + 0.5) / 6, on = Math.sin(now * 9 + i * 2) > 0.3; px(x - 1, 22, 3, 2, on ? '#ff1a2a' : '#4a0a10'); if (on) { bx.globalAlpha = 0.12 * lv; fillPoly([[x - 1, 24], [x + 2, 24], [x + 30 * Math.sin(now * 3 + i), H], [x - 30 * Math.sin(now * 3 + i) - 10, H]], '#ff1a2a'); bx.globalAlpha = 0.9; } }
        }
        if (g === 'laser' || g === 'max') {
            bx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 9; i++) { let a = Math.PI / 2 + (i - 4) * 0.16 * (1 + Math.sin(now * 1.3) * 0.5) + Math.sin(now * 0.7) * 0.3; bx.globalAlpha = (0.12 + k * 0.25) * lv; line(W / 2, -4, W / 2 + Math.cos(a) * H * 1.6, -4 + Math.sin(a) * H * 1.6, i % 2 ? '#3aff6a' : theme.s); }
            bx.globalCompositeOperation = 'source-over';
        }
        if (g === 'tunnel' || g === 'max' || g === 'red') {
            bx.globalCompositeOperation = 'lighter'; let cx = W / 2, cy = H * 0.42;
            for (let i = 0; i < 8; i++) { let f = ((MU.pos / 4) * 0.5 + i / 8) % 1, sz = f * f * W * 1.1; bx.globalAlpha = f * 0.7 * lv; bx.strokeStyle = g === 'red' ? '#ff1a2a' : i % 2 ? theme.p : theme.s; bx.lineWidth = 2; bx.strokeRect(Math.round(cx - sz) + 0.5, Math.round(cy - sz * 0.56) + 0.5, Math.round(sz * 2), Math.round(sz * 1.12)); }
            bx.globalCompositeOperation = 'source-over';
        }
        bx.restore();
    }
    function genreTop(now) {
        if (calm()) return;
        let g = gkind(), k = S.kick, lv = Math.min(1, 0.5 + (MU.rung || 0) * 0.1 + MU.tier * 0.08), dt = Math.min(0.05, Math.max(0, now - GV.t)); GV.t = now;
        let nb = S.beatN !== GV.beat; GV.beat = S.beatN;
        bx.save();
        if (g === 'acid') { bx.globalCompositeOperation = 'soft-light'; bx.globalAlpha = 0.3 * lv; px(0, 0, W, H, '#b6ff3a'); }
        if (g === 'techno') {
            bx.globalCompositeOperation = 'saturation'; bx.globalAlpha = 0.75; px(0, 0, W, H, '#808080');
            bx.globalCompositeOperation = 'lighter'; if (k > 0.8 && S.beatN % 2 === 0) { bx.globalAlpha = 0.22 * lv; px(0, 0, W, H, '#ffffff'); }
        }
        if (g === 'laser' || g === 'max') {
            if (nb && S.state !== 'over') for (let side = -1; side <= 1; side += 2) for (let i = 0; i < 40; i++) GV.fl.push({ x: W / 2 + side * (W * 0.36 + Math.random() * 8), y: H - 8, vx: (Math.random() - 0.5) * 24 - side * 14, vy: -170 - Math.random() * 160 * lv, t: 0, life: 0.4 + Math.random() * 0.3, s: 3 + Math.floor(Math.random() * 4) });
            bx.globalCompositeOperation = 'lighter';
            GV.fl = GV.fl.filter(f => (f.t += dt) < f.life); GV.fl.forEach(f => { f.x += f.vx * dt; f.y += f.vy * dt; let a = f.t / f.life; bx.globalAlpha = 1 - a; px(f.x, f.y, f.s, f.s + 2, a < 0.25 ? '#fff3a0' : a < 0.5 ? '#ffb02a' : a < 0.75 ? '#ff4a1a' : '#6a0a0a'); });
        } else GV.fl.length = 0;
        if (g === 'red') {
            bx.globalCompositeOperation = 'color'; bx.globalAlpha = 0.4 * lv; px(0, 0, W, H, '#ff1a2a');
            bx.globalCompositeOperation = 'source-over'; bx.globalAlpha = 1;
            if (k > 0.6) for (let i = 0; i < 4; i++) { let y = Math.floor(Math.random() * H), h = 2 + Math.floor(Math.random() * 10), d = Math.round((Math.random() - 0.5) * 24 * k); bx.drawImage(buf, 0, y, W, h, d, y, W, h); }
            if (k > 0.9 && S.beatN % 4 === 3) { bx.globalCompositeOperation = 'difference'; bx.globalAlpha = 0.8; px(0, 0, W, H, '#ffffff'); }
        }
        if (g === 'tunnel' || g === 'max') {
            bx.globalCompositeOperation = 'lighter'; let cx = W / 2, cy = H * 0.42;
            for (let i = 0; i < 44; i++) { let a = Math.random() * 6.283, r0 = 30 + Math.random() * 60; bx.globalAlpha = 0.3 * lv; line(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.6, cx + Math.cos(a) * (r0 + 40 + Math.random() * 80), cy + Math.sin(a) * (r0 + 40) * 0.6, '#ffffff'); }
            bx.globalCompositeOperation = 'overlay'; bx.globalAlpha = 0.16 * lv; px(0, 0, W, H, [theme.p, theme.s, '#ffffff', '#ff1a2a'][Math.floor(MU.pos) % 4]);
        }
        if (g === 'max') {
            bx.globalCompositeOperation = 'hue'; bx.globalAlpha = 0.75; px(0, 0, W, H, 'hsl(' + Math.round(now * 140 % 360) + ',100%,50%)');
            bx.globalCompositeOperation = 'source-over'; bx.globalAlpha = 1; for (let i = 0; i < 50; i++) px(Math.random() * W, Math.random() * H, 2, 1, 'hsl(' + Math.floor(Math.random() * 360) + ',100%,60%)');
        }
        bx.restore();
    }
    // the little guys are in sprites/stack.js
    const spr = (k, x, y, flip) => { let c = os.sprite && os.sprite('stack/' + k); if (!c) return; os.spriteDraw(bx, 'stack/' + k, Math.round(x - c.width / 2), Math.round(y - c.height), 1, null, flip); };
    const DANCE = ['idle', 'bob', 'jump', 'bob', 'horns', 'bob', 'wave', 'bang'];
    const fireK = (now, o) => 'fire' + (1 + Math.floor(now * 12 + (o || 0)) % 3);
    function clutter(now) {
        if (calm() || S.demo) return;
        let k = MU.tier, h = (S.floors.length - 1) * LH, f = last(S.floors), bb = bbox(f.cells, G, G), z = h + LH, beat = Math.max(0, S.beatN || 0), bob = S.kick > 0.6 ? 1 : 0;
        if (S.floors.length > 3) {
            let [dx, dy] = P(-HALF + (bb[0] + bb[2]) / 2 * CS, -HALF + bb[1] * CS + 3, z);
            spr('skel_dj' + (S.kick > 0.5 ? 2 : 1), dx, dy - 4); spr('decks', dx, dy + 3);
        }
        if (S.chain >= 3 || k >= 2) {
            let [lx, ly] = P(-HALF + bb[0] * CS + 2, -HALF + (bb[3] + 1) * CS - 2, z), [rx, ry] = P(-HALF + (bb[2] + 1) * CS - 2, -HALF + bb[1] * CS + 2, z);
            spr('hat_' + DANCE[(beat + 2) % 8], lx, ly - bob); spr('hat_' + DANCE[(beat + 5) % 8], rx, ry - bob, true);
        }
        if (S.chain >= 8) { let [ax, ay] = P(-HALF + bb[0] * CS, -HALF + (bb[3] + 1) * CS, z), [cx, cy] = P(-HALF + (bb[2] + 1) * CS, -HALF + (bb[3] + 1) * CS, z); for (let i = 0; i < 5; i++) { let u = i / 4; spr(fireK(now, i), ax + (cx - ax) * u, ay + (cy - ay) * u + 2); } }
    }
    function clutterHud(c, sc, now) {
        if (calm() || S.demo || S.state === 'over') return;
        let k = MU.tier, beat = Math.max(0, S.beatN || 0), bob = S.kick > 0.6 ? 1 : 0, z = 2;
        const hs = (key, x, y, flip) => { let im = os.sprite && os.sprite('stack/' + key); if (!im) return; let w = im.width * z * sc, h = im.height * z * sc, X = Math.round(x * sc - w / 2), Y = Math.round(y * sc - h); c.imageSmoothingEnabled = false; if (flip) { c.save(); c.translate(X + w, Y); c.scale(-1, 1); c.drawImage(im, 0, 0, w, h); c.restore(); } else c.drawImage(im, X, Y, w, h); };
        if (k >= 3 || S.fev > 0) for (let i = 0; i < W + 20; i += 18) hs(fireK(now, i * 0.37), i, H - 6 + (S.fev > 0 ? 0 : 6) - Math.round(S.kick * 4));
        if (k >= 1 || S.floors.length > 6) [[20, 0], [W - 20, 1]].forEach(([x, fl]) => { hs('speaker', x, H - 10 - bob * 2); hs('hat_' + DANCE[(beat + (fl ? 3 : 0)) % 8], x, H - 64 - bob * 2, !!fl); hs(fireK(now, x), x + (fl ? -20 : 20), H - 10 - Math.round(S.kick * 6)); });
        S.sfx.forEach(f => { if (f.k !== 'co2' || f.t < 0) return; let z = (4 + f.t * 34) * sc, a = 1 - f.t / f.life; c.globalAlpha = Math.max(0, a) * (f.t < 0.2 ? 0.9 : 0.55); c.fillStyle = f.t < 0.12 ? '#ffffff' : '#e8ecff'; c.fillRect(Math.round(f.x * sc - z / 2), Math.round(f.y * sc - z / 2), Math.round(z), Math.round(z)); }); c.globalAlpha = 1;
        let d = S.dvd; if (d) hs('skull' + (1 + Math.floor(now * 10) % 3), d.x, d.y + 19, d.vx < 0);
        if (S.floors.length > 2) {
            let jit = S.incT > 0 ? Math.round((Math.random() - 0.5) * 6 * S.incT) : 0, sx_ = 80 + jit, sy_ = H - 24, im = os.sprite && os.sprite('stack/sign'), zs = 1.5;
            if (im) {
                let w = im.width * zs * sc, hh = im.height * zs * sc; c.drawImage(im, Math.round(sx_ * sc - w / 2), Math.round(sy_ * sc - hh), w, hh);
                let top = sy_ - im.height * zs, red = S.incT > 0 && Math.floor(now * 12) % 2;
                c.textAlign = 'center'; c.textBaseline = 'middle';
                let lab = LE('incident', 0, DL.incident); c.font = (5 * sc) + "px 'DotGothic16', monospace"; let lw = c.measureText(lab).width, room = 43 * sc; c.save(); c.translate(sx_ * sc, (top + 7.6) * sc); if (lw > room) c.scale(room / lw, 1); c.fillStyle = '#ffffff'; c.fillText(lab, 0, 0); c.restore();
                c.font = (11 * sc) + "px 'DotGothic16', monospace"; c.fillStyle = red ? '#ff2a4a' : '#0d0e25'; c.fillText(String(S.inc), sx_ * sc, (top + 20) * sc);
                c.textBaseline = 'alphabetic';
            }
        }
    }
    function extras(now) {
        if (S.state === 'over') return;
        clutter(now);
        let h = (S.floors.length - 1) * LH, [tx, ty] = P(0, 0, h + LH);
        if (S.shades > 0 && !calm()) {
            let f = last(S.floors), [cx, cy] = centre(f.cells), [x, y] = P(cx, cy, h + LH), dy = Math.round((1 - S.shades) * -30);
            spr('shades', x, y + dy);
        }
        let sk = S.sk; if (!sk) return;
        let a = sk.t / 1.4, x = sk.dir > 0 ? -30 + a * (W + 60) : W + 30 - a * (W + 60), y = ty - 20 - Math.sin(a * Math.PI) * 30, fl = sk.dir < 0, air = a > 0.3 && a < 0.7, ph = air ? Math.floor((a - 0.3) / 0.4 * 8) % 4 : 0;
        spr(air ? 'sk_air' : 'sk_ride', x, y - 4, fl); spr(['board_top', 'board_edge', 'board_under', 'board_edge'][ph], x, y, fl);
    }
    // the crowd. they came for this
    function crowd(now) {
        if (calm() || S.demo || S.state === 'over' || (MU.tier < 2 && S.chain < 4)) return;
        let k = S.kick, beat = Math.max(0, S.beatN || 0), base = H + 2;
        for (let j = 0; j < 30; j++) { bx.globalAlpha = (j / 30) * (0.35 + k * 0.25); px(0, H - 30 + j, W, 1, theme.p); }
        for (let i = 0, x = -4; x < W + 8; i++) {
            let r = rng(i * 977 + 13), w = 9 + Math.floor(r() * 5), jump = (beat + i) % 7 === 0 ? Math.round(k * 5) : 0, y = base - 16 - Math.round(r() * 5) - Math.round(k * (r() < 0.5 ? 2 : 1)) - jump;
            bx.globalAlpha = 1; px(x, y + 5, w, base - y, '#05050c'); px(x + w / 2 - 3, y, 7, 6, '#05050c'); px(x + w / 2 - 2, y - 1, 5, 1, '#05050c');
            bx.globalAlpha = 0.9; px(x + w / 2 - 2, y - 1, 5, 1, '#ffffff'); px(x + w / 2 - 3, y, 1, 3, theme.p); px(x + w / 2 + 3, y, 1, 3, theme.p); px(x, y + 5, 2, 1, theme.p); px(x + w - 2, y + 5, 2, 1, theme.p);
            if (r() < 0.35 + MU.tier * 0.08) { let hx = x + (r() < 0.5 ? 0 : w - 2), up = y - 9 - Math.round(k * 3); bx.globalAlpha = 1; px(hx, up, 2, 9, '#05050c'); px(hx - 1, up - 2, 1, 3, '#05050c'); px(hx + 2, up - 2, 1, 3, '#05050c'); }
            x += w + 1;
        }
        bx.globalAlpha = 1;
    }
    // inflatable tube guy from the car yard. he lives here now
    function tubeMan(now) {
        if (calm() || S.demo || S.state === 'over' || (MU.tier < 2 && S.fev <= 0)) return;
        let bx0 = Math.round(W * 0.74), t = S.tube, x = bx0, y = H - 12, a = -Math.PI / 2, seg = 7, pts = [], amp = 0.35 + S.kick * 0.5 + (S.fev > 0 ? 0.3 : 0);
        for (let i = 0; i < 9; i++) { a += Math.sin(t * 3.1 + i * 0.7) * amp * (i / 9) + Math.sin(t * 7.3 + i) * 0.06; x += Math.cos(a) * seg; y += Math.sin(a) * seg; pts.push([x, y, a]); }
        let col = S.fev > 0 ? '#ff2a4a' : '#ffd23f', st = S.fev > 0 ? '#ffd23f' : '#ff2a4a';
        px(bx0 - 3, H - 13, 7, 3, '#2a2e36');
        let p0 = [bx0, H - 12];
        pts.forEach((p, i) => { let q = i ? pts[i - 1] : p0, wd = 9 - Math.floor(i / 3); for (let s2 = 0; s2 <= 6; s2++) { let u = s2 / 6, cx = q[0] + (p[0] - q[0]) * u, cy = q[1] + (p[1] - q[1]) * u; px(cx - wd / 2 - 1, cy - wd / 2 - 1, wd + 2, wd + 2, '#0d0e25'); } }); pts.forEach((p, i) => { let q = i ? pts[i - 1] : p0, wd = 9 - Math.floor(i / 3); for (let s2 = 0; s2 <= 6; s2++) { let u = s2 / 6, cx = q[0] + (p[0] - q[0]) * u, cy = q[1] + (p[1] - q[1]) * u; px(cx - wd / 2, cy - wd / 2, wd, wd, i % 3 === 1 ? st : col); } });
        [[3, 1], [3, -1]].forEach(([j, sd]) => { let p = pts[j + 3], aa = p[2] + sd * (1.2 + Math.sin(t * 9 + sd) * 0.9), ex = p[0], ey = p[1]; for (let s2 = 0; s2 < 12; s2++) { aa += Math.sin(t * 11 + s2 + sd) * 0.18; ex += Math.cos(aa) * 1.6; ey += Math.sin(aa) * 1.6; px(ex - 2, ey - 2, 4, 4, '#0d0e25'); px(ex - 1, ey - 1, 3, 3, col); } });
        let hd = pts[pts.length - 1], hx = Math.round(hd[0]), hy = Math.round(hd[1]); px(hx - 5, hy - 6, 10, 10, '#0d0e25'); px(hx - 4, hy - 5, 8, 8, col); px(hx - 3, hy - 3, 2, 2, '#ffffff'); px(hx + 1, hy - 3, 2, 2, '#ffffff'); px(hx - 2, hy - 2, 1, 1, '#0d0e25'); px(hx + 2, hy - 2, 1, 1, '#0d0e25'); px(hx - 1, hy + 1, 3, 2, '#0d0e25'); px(hx - 4, hy - 7, 8, 2, '#0d0e25');
    }
    function drawScene(now) {
        bx.imageSmoothingEnabled = false;
        OX = Math.round(W / 2); OY = Math.round(H * 0.66 + S.cam + (calm() ? 0 : S.kick * (MU.tier >= 2 ? 2 : 1)));
        let sh = S.shake && !calm() ? [Math.round((Math.random() - 0.5) * 6 * S.shake), Math.round((Math.random() - 0.5) * 4 * S.shake)] : [0, 0];
        bx.save(); bx.translate(sh[0], sh[1]);
        back(now);
        genreBack(now);
        if (S.mov && S.state === 'play' && !calm() && S.mov.spd > 110) S.trail.forEach((p, i) => { bx.globalAlpha = 0.08 + i * 0.05; blit(S.mov.img, p[0] + HALF, p[1] + HALF, (S.floors.length - 1) * LH); });
        bx.globalAlpha = 1;
        drawTower(now);
        drawFx(now);
        genreTop(now);
        extras(now);
        if (S.bolt && !calm()) { let b = S.bolt, a = 1 - b.t / 0.35; bx.globalAlpha = a * 0.4; for (let i = 0; i < b.pts.length - 1; i++) for (let o = -2; o <= 2; o += 4) line(b.pts[i][0] + o, b.pts[i][1], b.pts[i + 1][0] + o, b.pts[i + 1][1], theme.s); bx.globalAlpha = a; for (let i = 0; i < b.pts.length - 1; i++) line(b.pts[i][0], b.pts[i][1], b.pts[i + 1][0], b.pts[i + 1][1], '#ffffff'); b.br.forEach(([p, q]) => line(p[0], p[1], q[0], q[1], mix(theme.s, '#ffffff', 0.5))); bx.globalAlpha = 1; }
        if (S.mov && S.state === 'play' && !calm() && S.mov.kind === 'hot') { let m = S.mov, z = (S.floors.length - 1) * LH; for (let k = 0; k < 6; k++) S.fx.push({ k: 'spark', x: m.x + Math.random() * m.sh.w * CS, y: m.y + Math.random() * m.sh.h * CS, z: z + LH, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10, vz: 40 + Math.random() * 60, t: 0, life: 0.3 + Math.random() * 0.3, col: Math.random() < 0.4 ? '#ffd23f' : '#ff3a1a' }); }
        if (S.mov && S.state === 'play' && !calm() && (S.mov.spd > 120 || S.chain >= 3)) { let m = S.mov, z = (S.floors.length - 1) * LH; for (let k = 0; k < 3; k++) { let a = Math.floor(Math.random() * m.sh.w), [x, y] = P(m.x + a * CS + Math.random() * CS, m.y + m.sh.h * CS, z); S.fx.push({ k: 'spark', x: m.x + a * CS + Math.random() * CS, y: m.y + m.sh.h * CS, z: z - LH, vx: (Math.random() - 0.5) * 40, vy: 20 + Math.random() * 30, vz: -10, t: 0, life: 0.3 + Math.random() * 0.3, col: Math.random() < 0.5 ? '#ffffff' : theme.s }); } }
        bx.restore();
        tubeMan(now); crowd(now);
        drawHype(now);
        if (S.kick > 0 && !calm() && MU.tier >= 2) { bx.globalAlpha = S.kick * (MU.tier >= 4 ? 0.16 : MU.tier >= 3 ? 0.08 : 0.04); px(0, 0, W, H, MU.tier >= 4 ? (S.beatN % 2 ? '#ffffff' : '#000000') : theme.p); bx.globalAlpha = 1; }
        if (S.kick > 0.6 && !calm() && MU.tier >= 2 && S.state === 'play') for (let k = 0; k < (S.fev > 0 ? 7 : 3); k++) { let y = Math.floor(Math.random() * H), hh = 2 + Math.floor(Math.random() * 10); bx.drawImage(buf, 0, y, W, hh, Math.round((Math.random() - 0.5) * (S.fev > 0 ? 24 : 10)), y, W, hh); }
        if (S.fev > 0 && !calm()) { bx.globalAlpha = 0.12 + S.kick * 0.12; px(0, 0, W, H, '#ff0a2a'); bx.globalAlpha = 1; }
        if (S.flash > 0 && !calm()) { bx.globalAlpha = S.flash * 0.16; px(0, 0, W, H, '#ffffff'); bx.globalAlpha = 1; }
        if ((S.glitch > 0 || S.tear > 0) && !calm()) for (let k = 0; k < 8 * (S.glitch + S.tear * 2); k++) { let y = Math.floor(Math.random() * H), hh = 1 + Math.floor(Math.random() * 6); bx.drawImage(buf, 0, y, W, hh, Math.round((Math.random() - 0.5) * 20), y, W, hh); }
        if (S.tear > 0.5 && !calm()) for (let k = 0; k < 6; k++) { let x = Math.floor(Math.random() * W), y = Math.floor(Math.random() * H); px(x, y, 8 + Math.random() * 30, 2 + Math.random() * 6, Math.random() < 0.5 ? theme.p : theme.s); }
    }

    const fmt = n => Math.round(n).toLocaleString('en-US');
    function slam_(q, now) {
        let c = sx, sc = cv.width / W, life = q.k === 'wipe' ? 2.6 : 0.9, a = q.t, bad = /cut|lean|wipe|trialLose|feverEnd/.test(q.k);
        let size = q.k === 'wipe' ? 32 : q.k === 'fever' || q.k === 'trialWin' ? 28 : q.k === 'chain' ? 28 : bad ? 22 : q.k === 'clean' || q.k === 'close' ? 16 : 24;
        let pop = a < 0.07 ? 2.2 - a / 0.07 * 1.35 : a < 0.14 ? 0.85 + (a - 0.07) / 0.07 * 0.15 : 1, fade = clamp((life - a) * 5, 0, 1), y = H * 0.32, rot = (q.seed - 0.5) * 0.18;
        let sh = calm() ? [0, 0] : [(Math.random() - 0.5) * 4 * Math.max(0, 1 - a * 3), (Math.random() - 0.5) * 3 * Math.max(0, 1 - a * 3)];
        c.save(); c.globalAlpha = fade; c.translate((W / 2 + sh[0]) * sc, (y + sh[1]) * sc); c.rotate(rot); c.scale(pop, pop);
        c.font = (size * sc) + "px 'DotGothic16', monospace"; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
        let tw = c.measureText(q.s).width, room = W * sc * 0.92; if (tw > room) c.scale(room / tw, room / tw);
        let red = bad ? '#ff1a3a' : theme.p;
        for (let k = 7; k >= 1; k--) { c.fillStyle = k > 4 ? '#000000' : mix(red, '#000000', 0.5); c.fillText(q.s, k * sc * 0.9, k * sc * 0.9); }
        c.lineWidth = size * sc * 0.16; c.strokeStyle = '#000000'; c.strokeText(q.s, 0, 0);
        let g = c.createLinearGradient(0, -size * sc / 2, 0, size * sc / 2);
        if (bad) { g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#ff8a9a'); g.addColorStop(0.5, '#a00018'); g.addColorStop(1, '#ff3a5a'); }
        else { g.addColorStop(0, '#ffffff'); g.addColorStop(0.42, '#c8ccd8'); g.addColorStop(0.5, '#4a4e5c'); g.addColorStop(0.62, '#e8ecf4'); g.addColorStop(1, '#8a8fa0'); }
        c.fillStyle = g; c.fillText(q.s, 0, 0);
        if (!calm()) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = fade * 0.5; c.fillStyle = theme.s; c.fillText(q.s, 2 * sc, 0); c.fillStyle = red; c.fillText(q.s, -2 * sc, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = fade; }
        if (!calm() && a < 0.25) for (let k = 0; k < 5; k++) { let hh = (2 + Math.random() * 5) * sc, yy = (Math.random() - 0.5) * size * sc; c.fillStyle = Math.random() < 0.5 ? red : '#ffffff'; c.globalAlpha = fade * 0.6; c.fillRect(-tw / 2 + Math.random() * tw * 0.8, yy, (10 + Math.random() * 30) * sc, hh * 0.4); c.globalAlpha = fade; }
        c.restore();
    }
    function hud(now) {
        let k = cv.width / W, c = sx, sc = k;
        c.save();
        c.fillStyle = 'rgba(0,0,0,0.14)'; for (let y = 0; y < cv.height; y += Math.max(2, Math.round(k))) c.fillRect(0, y, cv.width, Math.max(1, Math.round(k / 2)));
        let vg = c.createRadialGradient(cv.width / 2, cv.height / 2, cv.height * 0.3, cv.width / 2, cv.height / 2, cv.width * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)'); c.fillStyle = vg; c.fillRect(0, 0, cv.width, cv.height);
        const t = (s, x, y, size, col, al) => { c.font = (size * sc) + "px 'DotGothic16', monospace"; c.textAlign = al || 'left'; c.fillStyle = 'rgba(0,0,0,0.75)'; c.fillText(s, x * sc + sc, y * sc + sc); c.fillStyle = col; c.fillText(s, x * sc, y * sc); };
        if (S.pbY && S.state === 'play') t(LE('pbLine', 0, DL.pbLine) + ' ' + S.pbY[2] + 'F', S.pbY[0], S.pbY[1], 6, '#ffd23f');
        const split = (s, x, y, size, col, al) => { c.font = (size * sc) + "px 'DotGothic16', monospace"; c.textAlign = al || 'center'; c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillText(s, x * sc + 2 * sc, y * sc + 2 * sc); c.fillStyle = theme.p; c.fillText(s, x * sc - sc, y * sc); c.fillStyle = theme.s; c.fillText(s, x * sc + sc, y * sc); c.fillStyle = col || '#ffffff'; c.fillText(s, x * sc, y * sc); };
        const two = (k_, d) => LJ(k_, 0, d) + ' // ' + LE(k_, 0, d);
        const box = (x, y, w, h, col) => { c.strokeStyle = col; c.lineWidth = Math.max(1, sc * 0.6); let L = 4; [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([a, b, dx, dy]) => { c.beginPath(); c.moveTo(a * sc, (b + dy * L) * sc); c.lineTo(a * sc, b * sc); c.lineTo((a + dx * L) * sc, b * sc); c.stroke(); }); };
        c.textBaseline = 'top';
        box(4, 4, W - 8, H - 8, rgba(theme.s, 0.5));
        let watching = 1200 + (S.floors.length - 1) * 731 + S.bestChain * 4044 + Math.floor(S.now * 3.3);
        if (Math.floor(now * 1.5) % 2) { c.fillStyle = '#ff2a2a'; c.beginPath(); c.arc(12 * sc, 12 * sc, 2.6 * sc, 0, 6.283); c.fill(); }
        t(two('live', '生中継 | LIVE'), 17, 8, 8, '#ffffff');
        t(two('watching', '視聴者 | watching') + ' ' + fmt(watching), 10, 18, 6, '#9f9ab0');
        t(two('hudScore', 'スコア | SCORE'), 10, 28, 6, '#9f9ab0'); t(fmt(S.score), 10, 35, 11, '#ffffff');
        let h = S.floors.length - 1;
        split(String(h).padStart(3, '0'), W / 2, 9, 24);
        t(two('hudFloors', '階 | FLOOR'), W / 2, 34, 6, '#ffffff', 'center');
        if (S.chain > 1) { split('x' + S.chain, W - 12, 9, 18, S.chain >= 5 ? '#ffe36b' : '#ffffff', 'right'); t(two('hudChain', '連続 | chain'), W - 12, 28, 6, '#ffffff', 'right'); }
        let lean = clamp(S.lean / S.n.leanMax, 0, 1), mood = lean > 0.75 ? LE('moodBad', 0, 'パニック | panicking') : lean > 0.45 || (S.mov && S.mov.spd > 160) ? LE('moodMid', 0, '緊張 | tense') : LE('moodOk', 0, '落ち着いてる | calm');
        let rows = [[two('integrity', '耐久 | integrity'), Math.round(100 - lean * 100) + '%'], [two('wind', '風 | wind'), (2 + h * 0.13 + Math.sin(now * 0.7) * 0.8).toFixed(1) + 'm/s'], [two('bpm', 'テンポ | bpm'), Math.round(songBpm())],
            [two('mood', '板の気分 | slab mood'), mood], [two('crows', 'カラス | crows'), S.crow > 0 ? '0' : '5'], [two('track', '曲 | track'), MU.sg ? MU.sg.name.toLowerCase() : '-']];
        rows.forEach(([a, b], i) => { let y = 60 + i * 11; t(a, W - 10, y, 5.5, '#8a849e', 'right'); t(String(b), W - 10, y + 5, 5.5, i === 0 && lean > 0.6 ? '#ff4d6a' : rgba(theme.s, 0.9), 'right'); });
        let sx0 = 10, sy0 = H - 24, sw = 70;
        t(two('stoke', 'オーバードライブ | overdrive'), sx0, sy0 - 9, 6, S.slow ? '#ffffff' : '#9f9ab0');
        for (let i = 0; i < 14; i++) { let on = i / 14 < S.stoke; c.fillStyle = on ? (S.slow && Math.floor(now * 12) % 2 ? '#ffffff' : i > 10 ? theme.s : theme.p) : 'rgba(255,255,255,0.08)'; c.fillRect((sx0 + i * 5) * sc, sy0 * sc, 4 * sc, 6 * sc); }
        let lx = W / 2 - 40, ly = H - 18;
        t(two('lean', '傾き | lean'), W / 2, ly - 9, 6, '#9f9ab0', 'center');
        for (let i = 0; i < 20; i++) { let on = i / 20 < lean, warn = i / 20 > S.n.leanWarn / S.n.leanMax; c.fillStyle = on ? (warn ? (Math.floor(now * 8) % 2 ? '#ff2a4a' : '#ffffff') : theme.s) : warn ? 'rgba(255,40,70,0.18)' : 'rgba(255,255,255,0.08)'; c.fillRect((lx + i * 4) * sc, ly * sc, 3 * sc, 6 * sc); }
        { let mx = 10, my = H - 70, cs = 2, top = last(S.floors).cells; c.fillStyle = 'rgba(6,3,10,0.7)'; c.fillRect((mx - 2) * sc, (my - 2) * sc, (G * cs + 4) * sc, (G * cs + 4) * sc);
          for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) if (top[ix(i, j)]) { c.fillStyle = rgba(theme.s, 0.55); c.fillRect((mx + i * cs) * sc, (my + j * cs) * sc, (cs - 0.4) * sc, (cs - 0.4) * sc); }
          let m = S.mov; if (m && S.state === 'play') { let oi = (m.x + HALF) / CS, oj = (m.y + HALF) / CS; for (let b = 0; b < m.sh.h; b++) for (let a = 0; a < m.sh.w; a++) if (m.sh.c[b * m.sh.w + a]) { c.fillStyle = rgba(theme.p, 0.6); c.fillRect((mx + (oi + a) * cs) * sc, (my + (oj + b) * cs) * sc, (cs - 0.4) * sc, (cs - 0.4) * sc); } }
          let ra = now * 2.4; c.strokeStyle = rgba('#ffffff', 0.5); c.lineWidth = sc * 0.5; c.beginPath(); c.moveTo((mx + G) * sc, (my + G) * sc); c.lineTo((mx + G + Math.cos(ra) * G * 1.4) * sc, (my + G + Math.sin(ra) * G * 1.4) * sc); c.stroke();
          box(mx - 2, my - 2, G * cs + 4, G * cs + 4, rgba(theme.s, 0.7)); t(two('radar', '真上から | top view'), mx, my - 9, 5, '#8a849e'); }
        let bars = 28, an = MU.an, fr = null;
        if (an && MU.on) { fr = MU.fb || (MU.fb = new Uint8Array(an.frequencyBinCount)); an.getByteFrequencyData(fr); }
        for (let i = 0; i < bars; i++) { let v = fr ? fr[Math.floor(Math.pow(i / bars, 1.7) * fr.length * 0.5)] / 255 : S.kick * (1 - i / bars) * 0.6, x = W - 10 - bars * 3 + i * 3, hh = Math.round(v * 16); c.fillStyle = rgba(i % 2 ? theme.s : theme.p, 0.75); c.fillRect(x * sc, (H - 11 - hh) * sc, 2 * sc, hh * sc); }
        if (S.mov && S.state === 'play' && !S.demo) {
            let m = S.mov, hx = -HALF + m.hi * CS, hy = -HALF + m.hj * CS, d = m.axis === 'x' ? m.x - hx : m.y - hy, on = Math.abs(d) <= S.n.tol, z = (S.floors.length - 1) * LH;
            let [ax, ay] = P(m.x + m.sh.w * CS / 2, m.y + m.sh.h * CS / 2, z + LH), [tx, ty] = P(hx + m.sh.w * CS / 2, hy + m.sh.h * CS / 2, z + LH), r = 8 + Math.max(m.sh.w, m.sh.h) * 2;
            box(ax - r, ay - r * 0.6, r * 2, r * 1.2, on ? '#ffffff' : rgba(theme.p, 0.8));
            c.strokeStyle = rgba(on ? '#ffffff' : theme.s, 0.5); c.setLineDash([2 * sc, 2 * sc]); c.beginPath(); c.moveTo(ax * sc, ay * sc); c.lineTo(tx * sc, ty * sc); c.stroke(); c.setLineDash([]);
            t((d >= 0 ? '+' : '') + d.toFixed(1), ax + r + 2, ay - r * 0.6, 5, on ? '#ffffff' : '#9f9ab0');
            if (S.lock > 0) t('LOCK', ax - r, ay + r * 0.6 + 2, 6, '#ffffff');
        }
        if (S.state === 'play' && S.lean > S.n.leanWarn && !S.demo) {
            let p = 0.5 + 0.5 * Math.sin(now * 12); c.fillStyle = 'rgba(255,20,50,' + (0.08 + p * 0.12) + ')'; c.fillRect(0, 0, cv.width, cv.height);
            for (let i = -2; i < W / 8 + 2; i++) { let x = i * 8 + (now * 30) % 16; c.fillStyle = i % 2 ? '#ffd23f' : '#12081a'; c.beginPath(); c.moveTo(x * sc, 0); c.lineTo((x + 8) * sc, 0); c.lineTo((x + 4) * sc, 5 * sc); c.lineTo((x - 4) * sc, 5 * sc); c.fill(); }
            if (Math.floor(now * 4) % 2) split(two('hudWarn', '警告 | warning'), W / 2, 46, 9, '#ffd6dc');
        }
        let sct = S.sector;
        if (sct && sct.t < 1.6) {
            let a = sct.t, slide = Math.min(1, a * 6), out = a > 1.3 ? (a - 1.3) / 0.3 : 0, y = H * 0.42;
            c.fillStyle = 'rgba(8,4,14,0.85)'; c.fillRect(0, (y - 14) * sc, cv.width * slide * (1 - out), (sct.g ? 36 : 28) * sc);
            if (!out) for (let i = 0; i < W / 6; i++) { c.fillStyle = i % 2 ? '#ffd23f' : '#12081a'; c.fillRect((i * 6 - (a * 80 % 12)) * sc, (y - 16) * sc, 6 * sc, 2 * sc); c.fillRect((W - i * 6 + (a * 80 % 12)) * sc, (y + (sct.g ? 22 : 14)) * sc, 6 * sc, 2 * sc); }
            if (slide >= 1 && !out) split(String((many((WD().shouts || {}).sector) || SHOUT.sector)[0]).replace('{n}', sct.n), W / 2, y - 8, 14, '#ffffff');
            if (slide >= 1 && !out && sct.g && Math.floor(a * 8) % 2) split('GENRE UPGRADE: ' + sct.g, W / 2, y + 9, 8, '#ffd23f');
        }
        if (!calm() && S.state === 'play') {
            let sl = S.slam;
            if (sl && sl.t < 0.55) { let a = sl.t, sz = 44 * (1 + Math.max(0, 0.12 - a) * 10), al = clamp((0.55 - a) * 4, 0, 1) * (S.shout && S.shout.t < 0.9 ? 0.35 : 0.8); c.save(); c.globalAlpha = al; c.font = (sz * sc) + "px 'DotGothic16', monospace"; c.textAlign = 'center'; c.textBaseline = 'middle'; let str = String(sl.n).padStart(3, '0'), yy = H * 0.56;
                for (let k = 3; k > 0; k--) { c.globalAlpha = al * 0.15; c.fillStyle = sl.bad ? '#ff2a4a' : theme.p; c.fillText(str, W / 2 * sc, (yy + k * 6) * sc); }
                c.globalAlpha = al; c.fillStyle = sl.bad ? '#ff2a4a' : theme.p; c.fillText(str, (W / 2 - 3) * sc, yy * sc); c.fillStyle = sl.bad ? '#5a0010' : theme.s; c.fillText(str, (W / 2 + 3) * sc, yy * sc); c.globalAlpha = al * 0.9; c.fillStyle = '#ffffff'; c.fillText(str, W / 2 * sc, yy * sc); c.restore(); }
        }
        let q = S.shout;
        if (q && !S.shown && q.t < (q.k === 'wipe' ? 2.6 : 0.9) && !(sct && sct.t < 1.4)) slam_(q, now);
        let co = S.callout;
        if (co && S.state === 'play' && S.mov && !(sct && sct.t < 1.6)) { let m = S.mov, [x, y] = P(m.x + m.sh.w * CS / 2, m.y, (S.floors.length - 1) * LH + LH * 3), al = clamp((1.4 - co.t) * 3, 0, 1) * (Math.floor(now * 14) % 5 ? 1 : 0.4); c.save(); c.globalAlpha = al; c.font = (6 * sc) + "px 'DotGothic16', monospace"; c.textAlign = 'center'; let tw = c.measureText(co.s).width / sc + 6; c.fillStyle = co.hot ? '#ff1a3a' : '#ffd23f'; c.fillRect((x - tw / 2) * sc, (y - 14) * sc, tw * sc, 8 * sc); c.fillStyle = '#0a0610'; c.fillText(co.s, x * sc, (y - 13) * sc); c.restore(); }
        if (S.trial && S.state === 'play') { let tr = S.trial, str = 'SITE INSPECTION: ' + ((WD().trials || {})[tr.kind] || TRIALS[tr.kind]) + '  ' + tr.got + '/' + tr.need; c.font = (7 * sc) + "px 'DotGothic16', monospace"; c.textAlign = 'center'; let tw = c.measureText(str).width / sc + 10; c.fillStyle = Math.floor(now * 4) % 2 ? '#ff1a3a' : '#7a0010'; c.fillRect((W / 2 - tw / 2) * sc, 42 * sc, tw * sc, 10 * sc); c.fillStyle = '#ffffff'; c.fillText(str, W / 2 * sc, 43.5 * sc); }
        if (S.rhy >= 2 && S.state === 'play') t('RHYTHM x' + (1 + Math.min(S.rhy, 8) * 0.25).toFixed(2), W - 12, 34, 6, Math.floor(now * 8) % 2 ? theme.s : '#ffffff', 'right');
        if (S.state === 'play' && !S.demo) {
            let lvl = Math.round(100 + (S.floors.length - 1) * 37 + S.bestChain * 111 + S.score / 40 + S.now * 3);
            t('STACK HARDNESS ' + fmt(lvl) + '%', 10, 48, 6, Math.floor(now * 3) % 2 ? '#ff1a3a' : '#ffffff');
            let rk = (WD().ranks || RANKS)[S.rank] || RANKS[S.rank], nx = Math.pow(S.rank + 1, 2) * 900, pv = S.rank ? Math.pow(S.rank, 2) * 900 : 0, fr = clamp((S.score - pv) / Math.max(1, nx - pv), 0, 1);
            t('RANK: ' + rk + (S.rankT > 0 && Math.floor(now * 8) % 2 ? '  ▲ RANK UP' : ''), 10, 65, 5, S.rankT > 0 ? '#ffd23f' : '#cfcbd6'); c.fillStyle = '#12081a'; c.fillRect(10 * sc, 72 * sc, 60 * sc, 2 * sc); c.fillStyle = theme.p; c.fillRect(10 * sc, 72 * sc, 60 * fr * sc, 2 * sc);
            let np = 'NOW PLAYING: '  + (GENRE[vsg().id] || '') + (MU.rung >= LADDER.length ? ' MK' + (MU.rung - LADDER.length + 2) : '') + ' // ' + Math.round(songBpm()) + ' BPM'; c.font = (5 * sc) + "px 'DotGothic16', monospace"; c.textAlign = 'left'; let nw = c.measureText(np).width / sc + 6; c.fillStyle = '#ffd23f'; c.fillRect(9 * sc, 56 * sc, nw * sc, 7 * sc); c.fillStyle = '#0a0610'; c.fillText(np, 12 * sc, 57 * sc);
            let ax = W - 54, ay = H - 52; c.fillStyle = '#000'; c.fillRect(ax * sc, ay * sc, 44 * sc, 18 * sc); c.fillStyle = '#fff'; c.fillRect((ax + 1) * sc, (ay + 1) * sc, 42 * sc, 16 * sc); c.fillStyle = '#000'; c.fillRect((ax + 2) * sc, (ay + 6) * sc, 40 * sc, 6 * sc);
            c.font = (4 * sc) + "px 'DotGothic16', monospace"; c.textAlign = 'center'; c.fillText('PARENTAL ADVISORY', (ax + 22) * sc, (ay + 1.5) * sc); c.fillText('STACKING', (ax + 22) * sc, (ay + 12.5) * sc); c.fillStyle = '#fff'; c.font = (5 * sc) + "px 'DotGothic16', monospace"; c.fillText('HARDCORE', (ax + 22) * sc, (ay + 6.5) * sc);
        }
        if (S.state === 'play') {
            let fx0 = W - 74, fy0 = 46, fv = S.fev > 0 ? S.fev / S.n.feverSecs : S.fever;
            t(two('fever', 'ハードコア積み | hardcore stacking'), W - 10, fy0 - 7, 5, S.fev > 0 ? '#ffffff' : '#8a849e', 'right');
            c.fillStyle = '#12081a'; c.fillRect(fx0 * sc, fy0 * sc, 64 * sc, 5 * sc);
            c.fillStyle = S.fev > 0 ? (Math.floor(now * 10) % 2 ? '#ffffff' : '#ff1a3a') : fv > 0.8 ? (Math.floor(now * 6) % 2 ? '#ff1a3a' : theme.p) : '#ff1a3a'; c.fillRect((fx0 + 1) * sc, (fy0 + 1) * sc, 62 * clamp(fv, 0, 1) * sc, 3 * sc);
        }
        if (S.state === 'play' && !S.demo) {
            S.toasts.slice(0, 3).forEach((q, j) => { let a = q.t, sl = a < 0.25 ? 1 - a / 0.25 : a > 2.9 ? (a - 2.9) / 0.3 : 0, ww = 128, xx = W - ww - 6 + sl * (ww + 10), yy = H - 96 - j * 20;
                c.fillStyle = 'rgba(8,4,14,0.92)'; c.fillRect(xx * sc, yy * sc, ww * sc, 17 * sc); c.fillStyle = '#ffd23f'; c.fillRect(xx * sc, yy * sc, 2 * sc, 17 * sc);
                c.fillStyle = '#ffd23f'; c.fillRect((xx + 6) * sc, (yy + 4) * sc, 7 * sc, 5 * sc); c.fillRect((xx + 8) * sc, (yy + 9) * sc, 3 * sc, 3 * sc); c.fillRect((xx + 6) * sc, (yy + 12) * sc, 7 * sc, 1 * sc);
                c.font = (4 * sc) + "px 'DotGothic16', monospace"; c.textAlign = 'left'; c.fillStyle = '#8f8b9a'; c.fillText('ACHIEVEMENT UNLOCKED', (xx + 17) * sc, (yy + 2) * sc);
                c.font = (5 * sc) + "px 'DotGothic16', monospace"; c.fillStyle = '#ffffff'; let tw = c.measureText(q.s).width / sc, sx2 = Math.min(1, (ww - 20) / tw); c.save(); c.translate((xx + 17) * sc, (yy + 8) * sc); c.scale(sx2, 1); c.fillText(q.s, 0, 0); c.restore(); });
            let F = formAt(Math.floor(MU.pos / 16));
            if (F.sec === 'build' || (F.sec === 'break' && F.b >= 8)) { let p = F.sec === 'build' ? (F.b + (MU.pos % 16) / 16) / F.n : (F.b - 8 + (MU.pos % 16) / 16) / 8, ww = 110, xx = W / 2 - ww / 2, yy = H - 54;
                c.fillStyle = 'rgba(8,4,14,0.85)'; c.fillRect(xx * sc, yy * sc, ww * sc, 12 * sc); c.fillStyle = Math.floor(now * 12) % 2 ? '#ff1a3a' : '#ffd23f'; c.fillRect((xx + 1) * sc, (yy + 8) * sc, (ww - 2) * p * sc, 3 * sc);
                c.font = (5 * sc) + "px 'DotGothic16', monospace"; c.textAlign = 'center'; c.fillStyle = '#ffffff'; c.fillText('HYPE LOADING ' + Math.min(99, Math.floor(p * 100)) + '%', W / 2 * sc, (yy + 1.5) * sc); }
            else if (F.sec === 'break' && Math.floor(now * 2) % 2) { c.font = (6 * sc) + "px 'DotGothic16', monospace"; c.textAlign = 'center'; c.fillStyle = '#8f8b9a'; c.fillText('COOLDOWN REQUESTED. DENIED.', W / 2 * sc, (H - 52) * sc); }
            if (F.sec === 'drop' && F.b === 0 && MU.pos % 16 < 6 && !(S.shout && S.shout.t < 0.6)) slam_({ s: 'THE DROP', k: 'fever', t: (MU.pos % 16) * 15 / Math.max(60, songBpm()), seed: 0.5 }, now);
            if (S.sk) { let a = S.sk.t / 1.4; if (a > 0.3 && a < 0.8) { c.font = (8 * sc) + "px 'DotGothic16', monospace"; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText(['SICK', 'GNARLY', 'RAD (STRUCTURALLY)', 'KICKFLIP OVER FLOOR ' + (S.floors.length - 1)][S.chain % 4], W / 2 * sc + sc, (H * 0.62) * sc + sc); c.fillStyle = '#ffd23f'; c.fillText(['SICK', 'GNARLY', 'RAD (STRUCTURALLY)', 'KICKFLIP OVER FLOOR ' + (S.floors.length - 1)][S.chain % 4], W / 2 * sc, (H * 0.62) * sc); } }
        }
        clutterHud(c, sc, now);
        doodles(c, sc, now);
        S.pops.forEach(q => { c.save(); c.globalAlpha = clamp((0.9 - q.t) * 3, 0, 1); c.font = ((q.hot ? 9 : 7) * sc) + "px 'DotGothic16', monospace"; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText(q.v, (q.x + 1) * sc, (q.y - q.t * 34 + 1) * sc); c.fillStyle = S.fev > 0 ? '#ff4a6a' : q.hot ? theme.s : '#ffffff'; c.fillText(q.v, q.x * sc, (q.y - q.t * 34) * sc); c.restore(); });
        if (!calm()) { for (let i = 0; i < 260; i++) { c.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.18)'; c.fillRect(Math.random() * cv.width, Math.random() * cv.height, sc, sc); } }
        if (S.state === 'play' && !S.demo) { for (let i = -1; i < W / 6 + 1; i++) { c.fillStyle = i % 2 ? (S.fev > 0 ? '#ff1a3a' : '#ffd23f') : '#0a0610'; c.fillRect((i * 6 - (now * 24) % 12) * sc, 0, 6 * sc, 3 * sc); } }
        if (S.fev > 0 && !calm()) { let on = S.beatN % 2 === 0; c.strokeStyle = on ? '#ff1a3a' : '#ffffff'; c.lineWidth = 7 * sc; c.strokeRect(0, 0, cv.width, cv.height); if (Math.floor(now * 6) % 2) split('HARDCORE STACKING ' + S.fev.toFixed(1), W / 2, H - 26, 10, '#ffffff'); }
        if (!calm() && S.state === 'play') {
            if (S.chain >= 5) { c.strokeStyle = rgba('#ffffff', 0.08 + S.kick * 0.1); c.lineWidth = sc; for (let k = 0; k < 40; k++) { let a = k / 40 * 6.283 + now * 0.3, r0 = 60 + (k * 37 + now * 400) % 80, r1 = r0 + 30 + (k * 13) % 40; c.beginPath(); c.moveTo((W / 2 + Math.cos(a) * r0) * sc, (H / 2 + Math.sin(a) * r0 * 0.6) * sc); c.lineTo((W / 2 + Math.cos(a) * r1) * sc, (H / 2 + Math.sin(a) * r1 * 0.6) * sc); c.stroke(); } }
            if (S.chain >= 8 && S.kick > 0.85 && S.beatN % 4 === 0) { c.save(); c.globalCompositeOperation = 'difference'; c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(0, 0, cv.width, cv.height); c.restore(); }
            let news = (WD().news || NEWS), msg = news.map(q => q.replace('|', ' // ')).join('   ◆   ') + '   ◆   ', tw;
            c.font = (6 * sc) + "px 'DotGothic16', monospace"; tw = c.measureText(msg).width; let ny = H - 7, alarm = S.lean > S.n.leanWarn;
            c.fillStyle = alarm ? 'rgba(120,0,20,0.9)' : 'rgba(6,3,10,0.85)'; c.fillRect(0, (ny - 1) * sc, cv.width, 8 * sc);
            c.fillStyle = alarm ? '#ffffff' : theme.p; c.fillRect(0, (ny - 1) * sc, 34 * sc, 8 * sc); c.fillStyle = alarm ? '#ff2a4a' : '#0a0610'; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(alarm ? '緊急 // alert' : '速報 // news', 2 * sc, ny * sc);
            c.save(); c.beginPath(); c.rect(34 * sc, (ny - 1) * sc, cv.width, 8 * sc); c.clip(); let off = (now * 38 * sc) % tw; c.fillStyle = '#ffffff'; c.fillText(msg, 36 * sc - off, ny * sc); c.fillText(msg, 36 * sc - off + tw, ny * sc); c.restore();
        }
        if (S.boot > 0 && !S.demo) {
            let a = 1.4 - S.boot; c.fillStyle = 'rgba(4,2,8,' + clamp(S.boot * 1.2, 0, 0.9) + ')'; c.fillRect(0, 0, cv.width, cv.height);
            let lines = [two('boot1', '起動中 | starting up'), two('boot2', '板 検出 | slab found'), two('boot3', '重力 正常 | gravity ok'), two('boot4', '準備完了 | go')];
            lines.forEach((l, i) => { if (a > i * 0.25) t(l, 20, 60 + i * 12, 8, i === 3 ? theme.s : '#cfcbd6'); });
            c.fillStyle = theme.p; c.fillRect(20 * sc, 116 * sc, (W - 40) * clamp(a / 1.1, 0, 1) * sc, 3 * sc);
        }
        if (S.dmg > 0 && !calm()) { c.strokeStyle = 'rgba(255,30,60,' + clamp(S.dmg, 0, 1) * 0.8 + ')'; c.lineWidth = 6 * sc; c.strokeRect(0, 0, cv.width, cv.height); }
        if (S.state === 'over' && S.wipe && S.wipe.t > 0.4 && !calm()) { c.globalAlpha = clamp((S.wipe.t - 0.4) * 2, 0, 0.6); for (let i = 0; i < 300; i++) { c.fillStyle = Math.random() < 0.5 ? '#ffffff' : '#555a66'; c.fillRect(Math.random() * cv.width, Math.random() * cv.height, (1 + Math.random() * 6) * sc, sc); } c.globalAlpha = 1; split(two('lost', '信号ロスト | signal lost'), W / 2, H * 0.6, 9, '#ffffff'); }
        c.restore();
    }

    function frame(t) {
        raf = 0;
        if (!S || !cv || asleep) return;
        let dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0; lastT = t;
        readTheme(t);
        if (S.state !== 'pause') tick(dt);
        paint();
        raf = requestAnimationFrame(frame);
    }
    function paint() {
        drawScene(S.now);
        sx.imageSmoothingEnabled = false;
        sx.clearRect(0, 0, cv.width, cv.height);
        let z = calm() ? 1 : 1 + S.punch * 0.06 + S.kick * (MU.tier >= 3 ? 0.014 : 0.006), zw = cv.width * z, zh = cv.height * z, ox = (cv.width - zw) / 2, oy = (cv.height - zh) / 2;
        sx.drawImage(buf, ox, oy, zw, zh);
        let abv = Math.max(S.ab, S.chain >= 5 && S.state === 'play' ? 0.35 + S.kick * 0.4 : 0); if (abv > 0 && !calm()) { S.abv = abv; let d = abv * (cv.width / W) * 2; sx.globalCompositeOperation = 'lighter'; sx.globalAlpha = Math.min(0.5, abv * 0.3); sx.drawImage(buf, ox + d, oy, zw, zh); sx.drawImage(buf, ox - d, oy, zw, zh); sx.globalAlpha = 1; sx.globalCompositeOperation = 'source-over'; }
        hud(S.now);
    }
    function layout() {
        let st = root && root.querySelector('.st-stage'); if (!st) return;
        let cw = st.clientWidth || 640, ch = st.clientHeight || 420, dpr = Math.min(3, window.devicePixelRatio || 1);
        H = 224; W = clamp(Math.round(H * cw / ch), 250, 440);
        let sc = Math.min(cw / W, ch / H), k = Math.max(1, Math.ceil(sc * dpr));
        LY = { W, H, k, sc };
        buf.width = W; buf.height = H; starC = null;
        if (cv.width !== W * k || cv.height !== H * k) { cv.width = W * k; cv.height = H * k; }
        cv.style.width = Math.round(W * sc) + 'px'; cv.style.height = Math.round(H * sc) + 'px';
    }

    const MU = { on: false, A: null, L: null, T: {}, sg: null, busy: false, ready: false, lp: null, out: null, step: 0, pos: 0, posAt: 0, tm: 0, ac: null, lc: null, tier: 0, mute: 0, back: false, want: null, idle: true };
    const kk = (i, n) => (i + 0.5) / n;
    const MINOR = [0, 2, 3, 5, 7, 8, 10];
    // a = accent, s = slide, - = nothing
    const SONGS = [{
        id: 'caustic', lvl: 0, name: 'CAUSTIC', bpm: [148, 154], key: 33, prog: [0], kk: { style: 'hard', vol: 0.36, rum: 0.25 },
        v: { hat: ['tick', '909 HAT', {}, { vol: 0.15 }], oh: ['tick', 'OPEN WIDE', {}, { vol: 0.15 }], snare: ['slap', '909 SNARE', {}, { vol: 0.16, room: 0.25 }], ride: ['steel', 'RIDE', {}, { vol: 0.13 }],
            perc: ['bones', 'CLACK', {}, { vol: 0.13, room: 0.2 }], acid: ['squirm', 'ACID 303', { res: 0.86, env: 0.72, acc: 0.85, dec: 0.3, drive: 0.6, glide: 0.35 }, { vol: 0.31, duck: 0.35, echo: 0.12 }],
            lead: ['squirm', '303 SCREAM', { res: 0.8, acc: 0.8 }, { vol: 0.18, duck: 0.3, echo: 0.3 }], pad: ['rust', 'TUNNEL WIND', {}, { vol: 0.50, room: 0.4, duck: 0.4 }] },
        acid: ['0a 0 12 0s 0 0a 3 0 0a 12s 0 10 0 7a 0s 12', '0a 0 12a 0 3s 5 0a 0 12 0 0a 10s 12 0 7a 0'], lead: '- 12a - 0 - 15s 12 - 12a - 19 - 15s 12 10a -', cut: 0.3,
        perc: ['......x...x.....', '......x...x...x.']
    }, {
        id: 'sulfur', lvl: 0, name: 'SULFUR', bpm: [150, 156], key: 31, prog: [0], kk: { style: 'hard', vol: 0.34, rum: 0.3 },
        v: { hat: ['tick', 'TIGHT HAT', {}, { vol: 0.18 }], oh: ['tick', '909 HAT', {}, { vol: 0.18 }], snare: ['slap', '808 CLAP', {}, { vol: 0.23, room: 0.3 }], ride: ['steel', 'BELL RIDE', {}, { vol: 0.13 }],
            perc: ['chime', 'COWBELL', {}, { vol: 0.14, room: 0.25 }], acid: ['squirm', 'ACID 303', { res: 0.9, env: 0.66, acc: 0.9, dec: 0.25, drive: 0.7, glide: 0.3 }, { vol: 0.31, duck: 0.35, echo: 0.18 }],
            pad: ['rust', 'HISS', {}, { vol: 0.17, room: 0.4, duck: 0.4 }] },
        acid: ['0a - 0 0 12a 0 - 0s 3 0a - 0 12 10s 7a 0', '0a 12s 0 0 0a - 12 0s 15a 12 0 - 0a 10 12s 0'], cut: 0.28,
        perc: ['...x.......x....', '...x...x...x..x.']
    }, {
        id: 'nightshift', lvl: 0, name: 'NIGHTSHIFT', bpm: [142, 148], key: 32, prog: [0], kk: { style: 'hard', vol: 0.33, rum: 0.35 },
        v: { hat: ['tick', 'TIGHT HAT', {}, { vol: 0.19 }], oh: ['tick', 'OPEN WIDE', {}, { vol: 0.13 }], snare: ['slap', 'IRON DOOR', {}, { vol: 0.13, room: 0.4 }], ride: ['steel', 'RIDE', {}, { vol: 0.13 }],
            perc: ['chime', 'PIPE TAP', {}, { vol: 0.15, room: 0.35 }], acid: ['squirm', 'SQUARE MUD', { res: 0.88, env: 0.6, acc: 0.8, dec: 0.4, drive: 0.55, glide: 0.4 }, { vol: 0.32, duck: 0.35, echo: 0.25 }],
            alarm: ['screech', 'GLITCH VOICE', {}, { vol: 0.38, echo: 0.35 }], pad: ['rust', 'PIPE DRONE', {}, { vol: 0.25, room: 0.5, duck: 0.4 }] },
        acid: ['0a - - 0 1s 0 - 0a - 0 12 - 0a - 1 0s', '0a - 12 0 1a 0s - 0 0a - 13s 12 0 - 7a 1'], cut: 0.24,
        perc: ['..........x.....', '...x......x.....']
    }, {
        id: 'bunker', lvl: 0, name: 'BUNKER', bpm: [152, 158], key: 32, prog: [0, 0, 0, 0, 0, 0, 1, 0], kk: { style: 'hard', vol: 0.34, rum: 0.4 },
        v: { hat: ['tick', 'TRASH LID', {}, { vol: 0.08 }], oh: ['tick', '909 HAT', {}, { vol: 0.18 }], snare: ['slap', 'IRON DOOR', {}, { vol: 0.14, room: 0.35 }], ride: ['steel', 'CHINA', {}, { vol: 0.10 }],
            perc: ['bones', 'NAIL', {}, { vol: 0.14, room: 0.3 }], stab: ['nocturne', 'NEON STAB', {}, { vol: 0.73, room: 0.35, duck: 0.4 }], alarm: ['howl', 'INDUSTRIAL ALARM', {}, { vol: 0.42, room: 0.4 }],
            acid: ['squirm', '303 SCREAM', { res: 0.85, acc: 0.85, drive: 0.6 }, { vol: 0.29, duck: 0.35, echo: 0.2 }], pad: ['rust', 'RUMBLE', {}, { vol: 0.55, room: 0.4, duck: 0.5 }] },
        stab: { p: 'x..x..x.........', c: [0, 3, 7] }, acid: [null, '0a - 0 - 0 - 12a - 0a - 0 - 0s 12 0a -'], cut: 0.32,
        perc: ['...x......x.....', '...x..x...x..x..']
    }, {
        id: 'hydraulic', lvl: 0, name: 'HYDRAULIC', bpm: [148, 154], key: 31, prog: [0, 0, 0, 0, 3, 3, 0, 0], kk: { style: 'hard', vol: 0.35, rum: 0.15 },
        v: { hat: ['tick', 'TIGHT HAT', {}, { vol: 0.16 }], oh: ['steel', 'BIN LID', {}, { vol: 0.09, room: 0.2 }], snare: ['slap', 'DRY SNARE', {}, { vol: 0.19, room: 0.3 }], ride: ['steel', 'RIDE', {}, { vol: 0.14 }],
            perc: ['bones', 'NAIL', {}, { vol: 0.21, room: 0.25 }], perc2: ['chime', 'PIPE TAP', {}, { vol: 0.13, room: 0.3 }], bass: ['sump', 'PULSE BASS', {}, { vol: 0.28, duck: 0.6 }],
            stab: ['parlour', 'INDUSTRIAL CLAV', {}, { vol: 0.35, room: 0.3, duck: 0.4 }], alarm: ['howl', 'INDUSTRIAL ALARM', {}, { vol: 0.44, room: 0.4 }], pad: ['rust', 'PIPE DRONE', {}, { vol: 0.22, room: 0.5, duck: 0.4 }],
            acid: ['squirm', 'SQUARE MUD', { res: 0.82, drive: 0.7 }, { vol: 0.27, duck: 0.4, echo: 0.15 }] },
        bass: '.xxx.xxx.xxx.xxx', stab: { p: '..x.....x.....x.', c: [0, 7] }, acid: [null, '0a 0 0 - 0 0a 0 - 0 0 0a 0s 12 0 - 0'], cut: 0.3,
        perc: ['..x.....x.......', '..x..x..x...x.x.'], perc2: '.......x.......x', pn2: [74, 79]
    }, {
        id: 'corrosion', lvl: 0, name: 'CORROSION', bpm: [154, 160], key: 34, prog: [0, 0, 0, 0, 0, 0, -2, -2], kk: { style: 'hard', vol: 0.33, rum: 0.3 },
        v: { hat: ['tick', '909 HAT', {}, { vol: 0.14 }], oh: ['tick', 'OPEN WIDE', {}, { vol: 0.11 }], snare: ['slap', '909 SNARE', {}, { vol: 0.16, room: 0.25 }], ride: ['steel', 'RIDE', {}, { vol: 0.13 }],
            perc: ['bones', 'CHAIN', {}, { vol: 0.12, room: 0.3 }], acid: ['squirm', 'ACID 303', { res: 0.88, env: 0.7, acc: 0.85, dec: 0.28, drive: 0.62 }, { vol: 0.31, duck: 0.35, echo: 0.12 }],
            lead: ['squirm', '303 SCREAM', { res: 0.82, acc: 0.85 }, { vol: 0.17, duck: 0.3, echo: 0.3 }], pad: ['rust', 'TUNNEL WIND', {}, { vol: 0.43, room: 0.4, duck: 0.4 }] },
        acid: ['0a 0 0 12 0s 0 3a 0 0a 0 12s 10 0 7 0a 0', '0a 0 0 0 12a 0 0s 3 0a 0 0 0 10a 0s 7 0'], lead: '- 12a - 0 15s 12 - 10a - 12 - 19a 15s 12 10 -', cut: 0.3,
        perc: ['.......x.......x', '...x...x...x...x']
    }, {
        id: 'foundry', lvl: 0, name: 'FOUNDRY', bpm: [158, 166], key: 32, prog: [0, 0, 0, 0, 0, 0, 1, 0], kk: { style: 'hard', vol: 0.35, rum: 0.3 },
        v: { hat: ['tick', 'TRASH LID', {}, { vol: 0.09 }], oh: ['steel', 'BIN LID', {}, { vol: 0.09, room: 0.2 }], snare: ['slap', 'IRON DOOR', {}, { vol: 0.14, room: 0.35 }], ride: ['steel', 'CHINA', {}, { vol: 0.10 }],
            perc: ['bones', 'CLACK', {}, { vol: 0.12, room: 0.2 }], perc2: ['chime', 'PIPE TAP', {}, { vol: 0.12, room: 0.3 }], stab: ['parlour', 'INDUSTRIAL CLAV', {}, { vol: 0.28, room: 0.3, duck: 0.4 }],
            alarm: ['howl', 'INDUSTRIAL ALARM', {}, { vol: 0.43, room: 0.4 }], pad: ['rust', 'PIPE DRONE', {}, { vol: 0.22, room: 0.5, duck: 0.4 }] },
        stab: { p: 'x.x...x.x...x...', c: [0, 12] }, perc: ['xx.x.xx.x.xx.x.x', 'xx.xx.x.xx.x.xx.'], perc2: '..x...x...x...xx', pn2: [72, 72, 79, 75]
    }, {
        id: 'conveyor', lvl: 1.5, name: 'CONVEYOR', bpm: [136, 142], key: 31, prog: [0, 0, 0, 0, 0, 0, -2, -2], noroll: true, drone: true, kk: { style: 'tight', vol: 0.38, rum: 0.08 },
        v: { hat: ['tick', 'TIGHT HAT', {}, { vol: 0.20 }], oh: ['tick', 'OPEN WIDE', {}, { vol: 0.16 }], snare: ['slap', '808 CLAP', {}, { vol: 0.22, room: 0.35, echo: 0.17 }], snare2: ['slap', 'IRON DOOR', {}, { vol: 0.11, room: 0.4 }],
            perc: ['bones', 'CHAIN', {}, { vol: 0.14, room: 0.3 }], bass: ['sump', 'PULSE BASS', {}, { vol: 0.28, duck: 0.5 }], seq: ['serpent', 'ROLLING TECHNO BASS', {}, { vol: 0.32, duck: 0.3 }],
            vox: ['uta', 'BELT SHOUT', { voice: 0.3 }, { vol: 0.20, room: 0.35, echo: 0.25 }], pad: ['serpent', 'DIM SUPERSAW', {}, { vol: 0.16, room: 0.5, duck: 0.5 }] },
        // one line does bass and tune. last note is out on purpose
        seq: { n: [0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 3, 0, -2, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 7, 0, 5, 0, 3, 0.3], fc: 0.42 },
        kick: 'x...x...x...x...x...x...x...x.x.', ohp: '..x...x...x...x...x...x...x..xx.', sn: '....x.......x...', sn2: '....x.......x.......x.......x..x', padC: [0, 6], padO: 24,
        bass: '.xxx.xxx.xxx.xxx', bassN: [0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 3, 0, -2, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 7, 0, 5, 0, 3, 0],
        perc: ['......x.......x.', '...x..x.......x.'], chant: { p: 'x.x.x.x.x.......' + '.'.repeat(48), ly: 'tsu mi a ge ro', n: [0, 0, 0, 0, -5], from: 8, end: 4 }
    }, {
        id: 'firealarm', lvl: -1, name: 'FIRE ALARM', bpm: [148, 154], key: 30, prog: [0, 0, 0, 0, -4, -4, -2, -2], fake: true, raid: true, kk: { style: 'hard', vol: 0.35, rum: 0.18, gal: 0.065 },
        v: { hat: ['tick', '909 HAT', {}, { vol: 0.20 }], oh: ['tick', 'OPEN WIDE', {}, { vol: 0.14 }], snare: ['slap', '909 SNARE', {}, { vol: 0.16, room: 0.3 }], ride: ['steel', 'RIDE', {}, { vol: 0.12 }],
            perc: ['chime', 'COWBELL', {}, { vol: 0.16, room: 0.25 }], stab: ['serpent', 'VAMPIRE STAB', {}, { vol: 0.31, room: 0.4, duck: 0.5 }], lead: ['serpent', 'HOOVER', {}, { vol: 0.27, room: 0.3, duck: 0.35 }],
            vox: ['uta', 'SPOKEN', {}, { vol: 0.38, room: 0.4, echo: 0.3 }], pad: ['rust', 'TUNNEL WIND', {}, { vol: 0.65, room: 0.4, duck: 0.4 }] },
        ridep: '8.4.9.4.8.4.9.6.', stab: { p: 'x..x..x.....x...', c: [0, 3, 7, 10], o: 12, until: 16 },
        hook: { p: 'x..x..x...x..x..x..x..x...x.x.x.', n: [0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 10, 0, 7, 0, 5, 0] },
        gapc: { p: '........x.x.x.x.', ly: 'o ni tsu mi', n: [0, 0, 0, -2] }, perc: ['..........x.....', '..x.......x.....']
        }];
    const PATS = {};
    const steps = str => PATS[str] || (PATS[str] = str.split(' ').map(q => q === '-' ? { on: false } : { on: true, n: parseInt(q, 10), a: q.indexOf('a') > 0, s: q.indexOf('s') > 0 }));
    const FORM = [['intro', 16], ['groove', 16], ['build', 8], ['drop', 32], ['break', 16], ['drop', 32], ['groove', 16], ['build', 8], ['drop', 32], ['break', 16], ['drop', 32]];
    const FSTART = {}; { let b = 0; FORM.forEach(([n, l]) => { if (FSTART[n] == null) FSTART[n] = b; b += l; }); }
    function formAt(bar) {
        let b = bar - (MU.b0 || 0), tot = FORM.reduce((a, f) => a + f[1], 0), loop = tot - FORM[0][1];
        if (b < 0) b = 0; if (b >= tot) b = FORM[0][1] + (b - FORM[0][1]) % loop;
        for (const [n, l] of FORM) { if (b < l) return { sec: n, b, n: l }; b -= l; }
        return { sec: 'drop', b: 0, n: 32 };
    }
    const HATV = [0.55, 0.32, 0.9, 0.38, 0.5, 0.3, 0.95, 0.36, 0.55, 0.32, 0.9, 0.38, 0.5, 0.3, 1, 0.42];
    const hz = m => 440 * Math.pow(2, (m - 69) / 12);
    const pat = (p, k) => p && p.length ? p[Math.min(k, p.length - 1)] : '';
    const at = (p, i) => p ? p[i % p.length] || '.' : '.';
    const gap = (p, i) => { let n = 1; while (n < p.length && at(p, i + n) === '.') n++; return n; };
    const LADDER = [['caustic', 'sulfur', 'nightshift'], ['bunker'], ['hydraulic', 'conveyor'], ['corrosion', 'firealarm'], ['foundry']];
    const GENRE = { sulfur: 'HARD ACID', caustic: 'HARD ACID', nightshift: 'DARK ACID', bunker: 'HARD TECHNO', hydraulic: 'INDUSTRIAL', corrosion: 'ACID TECHNO', foundry: 'SCHRANZ', conveyor: 'EBM', firealarm: 'RAVE TECHNO' };
    const GENREJ = { sulfur: 'ハードアシッド', caustic: 'ハードアシッド', nightshift: 'ダークアシッド', bunker: 'ハードテクノ', hydraulic: 'インダストリアル', corrosion: 'アシッドテクノ', foundry: 'シュランツ', conveyor: 'EBM', firealarm: 'レイヴテクノ' };
    const byId = id => SONGS.find(q => q.id === id);
    function rungSong(r, salt) { if (r < LADDER.length) { let a = LADDER[r]; return byId(a[(salt || 0) % a.length]); } let a = ['bunker', 'caustic', 'foundry', 'corrosion', 'hydraulic', 'conveyor', 'firealarm']; return byId(a[(r * 3 + (salt || 0)) % a.length]); }
    const rLift = r => r < LADDER.length ? 0 : [2, 5, 7, 3, 1, 6, 4][(r - LADDER.length) % 7];
    const rOver = r => Math.max(0, r - LADDER.length + 1);
    function vary(ph) {
        let sg = MU.sg, r = rng(((MU.seed || 1) + ph * 7919 + sg.id.length * 131) >>> 0);
        MU.v = { ph, pv: Math.floor(r() * 4), fill: r() < 0.7, ghost: r() < 0.5, ab: r() < 0.25 };
    }
    function muClimb(fl) {
        if (!S || S.demo) return null;
        let r = MU.rung0 + Math.floor(fl / 10), sg = rungSong(r, MU.salt); MU.rung = r; MU.rf = fl;
        if (sg === MU.sg && !rLift(r)) return null;
        muPre(r); MU.swap = r;
        return GENRE[sg.id] + (r >= LADDER.length ? ' MK' + (r - LADDER.length + 2) : '');
    }
    async function muPre(r) {
        let A = MU.A; if (!A || !MU.ready || (MU.nx && MU.nx.r === r)) return;
        if (MU.nx && MU.nx.L) { try { MU.nx.L.stop(true); MU.nx.L.R.M.out.disconnect(); } catch (e) {} }
        let sg = rungSong(r, MU.salt), nx = MU.nx = { r, sg, lift: rLift(r) };
        try {
            await kickPrep(sg, A.sampleRate, nx.lift); let b = await band(A, sg); b.L.R.M.out.disconnect(); b.L.R.M.out.connect(MU.nb);
            if (MU.nx === nx) { nx.L = b.L; nx.T = b.T; nx.ok = true; } else b.L.stop(true);
        } catch (e) { if (MU.nx === nx) MU.nx = null; }
    }
    function muSwap() {
        let n = MU.nx; if (!n || !n.ok) return false;
        try { MU.L.stop(true); MU.L.R.M.out.disconnect(); } catch (e) {}
        Object.assign(MU, { L: n.L, T: n.T, sg: n.sg, want: n.sg, lift: n.lift, nx: null, pr: null, b0: Math.floor(MU.step / 16) - FSTART.drop });
        vary(0); MU.L.R.playing = true;
        return true;
    }
    const songBpm = () => { let sg = MU.sg || SONGS[0]; return (sg.bpm[0] + (sg.bpm[1] - sg.bpm[0]) * clamp(((MU.fl || 0) - (MU.rf || 0)) / 10, 0, 1)) * (1 + 0.04 * Math.min(8, rOver(MU.rung || 0))) * (MU.tier >= 4 && S && S.fev > 0 ? 1.08 : 1); };
    function tierOf(f, chain) { let t = f < 4 ? 0 : f < 14 ? 1 : f < 30 ? 2 : f < 55 ? 3 : 4; return chain >= 6 ? Math.min(4, t + 1) : t; }
    const tierNow = () => !S || S.state !== 'play' || S.demo ? 0 : S.fev > 0 ? 4 : tierOf(S.floors.length - 1, S.chain);
    async function muLoad(sg) {
        sg = sg || MU.want; if (!sg || (MU.ready && MU.sg === sg) || MU.busy) return;
        MU.busy = true;
        try {
            await os.need(['noisebox_fx.js', 'noisebox_sound.js']);
            let A = MU.A = window.audioCtx || (window.audioCtx = new (window.AudioContext || window.webkitAudioContext)());
            if (!MU.out) {
                MU.lp = A.createBiquadFilter(); MU.lp.type = 'lowpass'; MU.lp.frequency.value = 18000;
                MU.out = A.createGain(); MU.out.gain.value = 0.0001;
                let gl = glue(A); MU.lp.connect(gl[0]); gl[1].connect(MU.out); MU.drv = gl[2]; MU.K = kit(A, MU.lp); MU.nb = nbBus(A, MU.lp); MU.out.connect(os.gg && os.gg.out ? os.gg.out(A) : A.destination);
                MU.an = A.createAnalyser(); MU.an.fftSize = 256; MU.an.smoothingTimeConstant = 0.6; MU.out.connect(MU.an);
            }
            let old = MU.L; MU.ready = false;
            if (old) { try { old.stop(true); old.R.M.out.disconnect(); } catch (e) {} }
            await kickPrep(sg, A.sampleRate, MU.lift || 0);
            let r = await band(A, sg); MU.L = r.L; MU.T = r.T; MU.sg = sg; MU.b0 = Math.floor(MU.step / 16); vary(0);
            r.L.R.M.out.disconnect(); r.L.R.M.out.connect(MU.nb);
            MU.ready = true;
        } catch (e) { MU.L = null; /* console.log('no music', e) */ }
        MU.busy = false;
        if (MU.want && MU.want !== MU.sg) return muLoad(MU.want);
        if (MU.ready && root) musicOn();
    }
    function hpTo(t, f) {
        if (MU.hpf === f) return; MU.hpf = f;
        if (MU.K) MU.K.hp.frequency.setTargetAtTime(Math.max(20, f), t, 0.03); if (MU.nb) MU.nb.frequency.setTargetAtTime(Math.max(95, f), t, 0.03);
    }
    function nbBus(A, dst) { let h = A.createBiquadFilter(); h.type = 'highpass'; h.frequency.value = 95; h.Q.value = 0.6; h.connect(dst); return h; }
    function glue(A) {
        let c = A.createDynamicsCompressor(); c.threshold.value = -14; c.ratio.value = 3; let ls = A.createBiquadFilter(); ls.type = 'lowshelf'; ls.frequency.value = 80; ls.gain.value = -4; let hs = A.createBiquadFilter(); hs.type = 'highshelf'; hs.frequency.value = 3500; hs.gain.value = 3; ls.connect(hs); hs.connect(c); c.attack.value = 0.004; c.release.value = 0.12; c.knee.value = 6;
        let w = A.createWaveShaper(), n = 1024, cur = new Float32Array(n); for (let i = 0; i < n; i++) { let x = i / (n - 1) * 2 - 1; cur[i] = Math.tanh(x * 1.1) / Math.tanh(1.1); } w.curve = cur; w.oversample = '2x';
        let g = A.createGain(); g.gain.value = 1.1; c.connect(g); g.connect(w);
        return [ls, w, g];
    }
    const KK = {};
    const curve = (k, hard) => { let n = 2048, c = new Float32Array(n); for (let i = 0; i < n; i++) { let x = i / (n - 1) * 2 - 1; c[i] = hard ? clamp(x * k, -1, 1) : Math.tanh(x * k) / Math.tanh(k); } return c; };
    const KSTY = {
        hard: { len: 0.42, hi: 7, tail: 0, dec: 0.3, eq: [['peaking', 95, 1, 3], ['drive', 3], ['peaking', 2600, 1, 4], ['clip', 1.5], ['lowpass', 9000, 0.7]] },
        tight: { len: 0.3, hi: 9, tail: 0, dec: 0.16, eq: [['peaking', 110, 1, 3], ['drive', 3.5], ['peaking', 3000, 1, 5], ['clip', 1.6], ['lowpass', 10000, 0.7]] },
        impact: { len: 1.4, hi: 40, sweep: 0.35, tail: 0, dec: 1.2, noise: 1, eq: [['peaking', 70, 1, 6], ['drive', 6], ['clip', 1.6], ['lowpass', 7000, 0.7]] }
    };
    function kickBuf(st, m, sr) {
        let key = st + m + '_' + sr; if (KK[key]) return KK[key];
        let y = KSTY[st], O = new OfflineAudioContext(1, Math.ceil(sr * y.len), sr), f = hz(m), end = y.len - 0.01, hold = y.hold || 0.02;
        let g = O.createGain(), node = g, hp = O.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 36;
        y.eq.forEach(e => { let q; if (e[0] === 'drive' || e[0] === 'clip') { q = O.createWaveShaper(); q.curve = curve(e[1], e[0] === 'clip'); q.oversample = '4x'; } else { q = O.createBiquadFilter(); q.type = e[0]; q.frequency.value = e[1]; q.Q.value = e[2]; if (e[3]) q.gain.value = e[3]; } node.connect(q); node = q; });
        node.connect(hp); hp.connect(O.destination);
        const env = (p, a) => { p.setValueAtTime(0, 0); p.linearRampToValueAtTime(a, 0.002); p.setValueAtTime(a, hold); p.exponentialRampToValueAtTime(0.001, Math.min(end, hold + y.dec)); p.linearRampToValueAtTime(0, y.len); };
        if (y.punch !== 0) { let o = O.createOscillator(), a = O.createGain(); o.frequency.setValueAtTime(f * y.hi, 0); o.frequency.exponentialRampToValueAtTime(f * 1.5, 0.012 + (y.sweep || 0) * 0.2); o.frequency.exponentialRampToValueAtTime(f, 0.05 + (y.sweep || 0)); if (y.tail) o.frequency.exponentialRampToValueAtTime(f * 0.7, end); env(a.gain, 1); o.connect(a); a.connect(g); o.start(0); }
        if (y.tail) { let o = O.createOscillator(), a = O.createGain(), ft = hz(m + y.tail); o.type = 'sine'; o.frequency.setValueAtTime(ft * 1.4, 0); o.frequency.exponentialRampToValueAtTime(ft, 0.03); o.frequency.setValueAtTime(ft, hold); o.frequency.exponentialRampToValueAtTime(ft * 0.6, end); a.gain.setValueAtTime(0, 0); a.gain.linearRampToValueAtTime(y.tailv || 0.7, 0.03); a.gain.setValueAtTime(y.tailv || 0.7, hold); a.gain.exponentialRampToValueAtTime(0.001, end); o.connect(a); a.connect(g); o.start(0); }
        let ck = O.createBufferSource(), cb = O.createBuffer(1, Math.ceil(sr * (y.noise ? 1.2 : 0.006)), sr), cd = cb.getChannelData(0), ca = O.createGain(), cf = O.createBiquadFilter();
        for (let i = 0; i < cd.length; i++) cd[i] = (Math.random() * 2 - 1) * (y.noise ? Math.exp(-i / sr * 3) : 1 - i / cd.length);
        cf.type = 'highpass'; cf.frequency.value = y.noise ? 300 : 2500; ca.gain.value = y.noise ? 0.5 : 0.6; ck.buffer = cb; ck.connect(cf); cf.connect(ca); ca.connect(g); ck.start(0);
        return (KK[key] = O.startRendering().then(b => { let d = b.getChannelData(0), pk = 0; for (let i = 0; i < d.length; i++) pk = Math.max(pk, Math.abs(d[i])); let k = pk ? 0.95 / pk : 1, fo = Math.ceil(sr * 0.008); for (let i = 0; i < d.length; i++) d[i] *= k * Math.min(1, (d.length - i) / fo, (i + 1) / fo); KK[key] = b; return b; }));
    }
    const kNote = sg => { let m = sg.key; while (m < 30) m += 12; while (m > 41) m -= 12; return m; };
    function kickPrep(sg, sr, lift) {
        let ms = new Set([kNote(sg)]);
        let all = [...ms].map(m => kickBuf(sg.kk.style, m, sr)); all.push(kickBuf('impact', 34, sr));
        return Promise.all(all);
    }
    function kit(A, dst) {
        let K = { A, bus: A.createGain(), duck: A.createGain(), hp: A.createBiquadFilter() };
        K.hp.type = 'highpass'; K.hp.frequency.value = 20; K.hp.Q.value = 0.7; K.hp.connect(dst); K.bus.connect(K.hp);
        let ir = A.createBuffer(2, Math.ceil(A.sampleRate * 1.4), A.sampleRate);
        for (let ch = 0; ch < 2; ch++) { let d = ir.getChannelData(ch), lp = 0; for (let i = 0; i < d.length; i++) { lp += ((Math.random() * 2 - 1) - lp) * 0.08; d[i] = lp * Math.exp(-i / A.sampleRate * 3.2) * 4; } }
        let cv_ = A.createConvolver(); cv_.buffer = ir; let ws = A.createWaveShaper(); ws.curve = curve(2); let lp = A.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 150; lp.Q.value = 1.2;
        let hp = A.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 50;
        K.send = A.createGain(); K.send.gain.value = 0; K.send.connect(cv_); cv_.connect(ws); ws.connect(lp); lp.connect(hp); hp.connect(K.duck); K.duck.connect(K.hp);
        // gallop. offbeat kick with the top cut off into an echo, schranz people love it
        K.gal = A.createGain(); let gl = A.createBiquadFilter(), gw = A.createWaveShaper(), fb = A.createGain(), wet = A.createGain(); gl.type = 'lowpass'; gl.frequency.value = 210; gl.Q.value = 0.9; gw.curve = curve(3);
        K.gd = A.createDelay(1); K.gd.delayTime.value = 0.3; fb.gain.value = 0.36; wet.gain.value = 0.55;
        K.gal.connect(gl); gl.connect(gw); gw.connect(K.duck); gw.connect(K.gd); K.gd.connect(fb); fb.connect(K.gd); K.gd.connect(wet); wet.connect(K.duck);
        return K;
    }
    function kickAt(t, m, v, st) {
        let K = MU.K, sg = MU.sg, gal = st === 'gal'; if (!K || (MU.only && MU.only !== (gal ? st : 'kick'))) return;
        let b = KK[(st && !gal ? st : sg.kk.style) + m + '_' + K.A.sampleRate]; if (!b || b.then) return;
        let s = K.A.createBufferSource(), g = K.A.createGain(); s.buffer = b; g.gain.value = v * (st === 'impact' ? 0.9 : gal ? sg.kk.gal : sg.kk.vol || 0.9); s.connect(g); g.connect(gal ? K.gal : K.bus);
        if (gal) K.gd.delayTime.setTargetAtTime(45 / songBpm(), t, 0.05);
        if (sg.kk.rum && !st) { let sd = K.A.createGain(); sd.gain.value = sg.kk.rum; g.connect(sd); sd.connect(K.send); K.send.gain.value = 1; let s16 = 15 / songBpm(); K.duck.gain.setValueAtTime(0.02, t); K.duck.gain.linearRampToValueAtTime(1, t + s16 * 2.6); }
        s.start(t);
    }
    async function band(A, sg) {
        let pr = NB.blankProject(), T = {}; pr.bpm = sg.bpm[0];
        const add = (name, [inst, pre, snd, mix]) => {
            let t = NB.newTrack(pr, inst), ps = pre && (NB.V[inst].presets || []).find(q => q[0].indexOf(pre) >= 0);
            if (ps) Object.assign(t.snd, ps[1]);
            Object.assign(t.snd, snd || {}); Object.assign(t.mix, mix || {}); pr.tracks.push(t); T[name] = t; t._cut = t.snd.cut;
        };
        Object.keys(sg.v).forEach(k => add(k, sg.v[k]));
        add('crash', ['steel', 'BIG CRASH', {}, { vol: 0.72, room: 0.3 }]);
        add('rise', ['rise', 'UP', {}, { vol: 0.42, room: 0.3 }]);
        add('fall', ['rise', 'DOWN', { tone: 0, amt: 0.15, mix: 0.12 }, { vol: 0.85, room: 0.3 }]);
        add('rev', ['maw', 'REVERSED SWELL', {}, { vol: 0.32, room: 0.3 }]);
        add('siren', ['screech', 'CYBER SIREN', {}, { vol: 0.5, room: 0.35 }]);
        // has to be the games ctx or the volume rocker does nothing
        let AC0 = window.AudioContext, W0 = window.webkitAudioContext, L;
        window.AudioContext = window.webkitAudioContext = function () { return A; };
        try { L = new NB.Live(pr); } finally { window.AudioContext = AC0; window.webkitAudioContext = W0; }
        await L.wk;
        L.R.sync(); L.R.apply(true);
        return { L, T };
    }
    const hit = (name, t, m, d, v, ac, sl, prev, next) => { let tr = MU.T[name]; if (tr && (!MU.only || MU.only === name)) MU.L.R.trig(tr, t, d, { m, v, ac: !!ac, sl: !!sl }, v, { prevOn: !!prev, nextSlides: !!next }); };
    const vel = (c, d) => c >= '1' && c <= '9' ? c / 9 : d == null ? 1 : d;
    function sing(C, pos, t, s16, root) {
        let tr = MU.T.vox, c = at(C.p, pos); if (!tr || c === '.' || (MU.only && MU.only !== 'vox')) return;
        let L = C.L || (C.L = NB.lyricsOf(C.ly)), q = 0; for (let j = 0; j < pos % C.p.length; j++) if (C.p[j] !== '.') q++;
        let y = L[q % L.length], pv = L[(q + L.length - 1) % L.length];
        MU.L.R.trig(tr, t, s16 * Math.min(gap(C.p, pos) * 0.9, q + 1 === L.length ? (C.end || 3) : 1.8), { m: root + (C.o || 36) + (C.n ? C.n[q % C.n.length] : 0), v: vel(c, 0.9) }, vel(c, 0.9), { ly: y, lyPrev: pv[1] });
    }
    function play16(i, t, s16) {
        let sg = MU.sg, k = MU.tier, x = i % 16, bar = Math.floor(i / 16), F = formAt(bar), sec = F.sec, b = F.b, n = F.n, lift = MU.lift || 0, root = sg.key + sg.prog[bar % sg.prog.length] + lift, danger = MU.danger;
        if (x === 0 && b % 16 === 0) vary(Math.floor(bar / 16));
        let v = MU.v || { pv: 0 }, brk = sec === 'break', build = sec === 'build' || (brk && b >= 8), drop = sec === 'drop', intro = sec === 'intro', bl = sec === 'build' ? b : b - 8, last = sec === 'build' ? b === n - 1 : brk && b === 15;
        let fk = !!sg.fake && drop && b < 4, real = sg.fake ? 4 : 0;
        if (x === 0) hpTo(t, danger ? 0 : fk ? 220 : 0);
        if (MU.mute > 0) { if (MU.mute === MU.muteLen) { hit('fall', t, 60, s16 * 4, 0.45); } MU.mute--; if (!MU.mute) MU.back = true; return; }
        if (MU.back) { MU.back = false; hit('crash', t, 60, 2, 1); }
        if (x === 0 && sec === 'build' && b === 0) hit('rise', t, 60, s16 * 16 * n, 0.9);
        if (x === 0 && brk && b === 8) hit('rise', t, 60, s16 * 128, 0.9);
        if (x === 0 && last) hit('rev', t, 60, s16 * 16, 1);
        if (sg.raid && x === 0 && sec === 'build' && b % 4 === 0) hit('siren', t, root + 36, s16 * 60, 0.7);
        if (x === 0 && fk && b === 0) hit('crash', t, 60, 2, 0.8);
        if (x === 0 && drop && (b === real || b === 16)) { if (b === real) { kickAt(t, 34, 0.7, 'impact'); hit('fall', t, 60, s16 * 32, 0.5); } hit('crash', t, 60, 2, b === 16 ? 0.7 : 1); if (MU.T.alarm) hit('alarm', t, root + 36, s16 * 16, 0.8); MU.L.R.duck(t); }
        if (MU.imp) { MU.imp = 0; kickAt(t, 34, 0.8, 'impact'); hit('crash', t, 60, 2, 1); }
        // fake drop runs out of floor here. one bar of nothing but her
        if (fk && b === 3 && x >= 8) { if (sg.gapc) sing(sg.gapc, x, t, s16, root); return; }
        let ts = sg.swing && x % 2 ? t + s16 * sg.swing : t;
        let kn = kNote(sg), kq = sg.kick || 'x...x...x...x...', kk = false, kv = 1;
        if (brk && b < 8) kk = false;
        else if (last && x >= 8) { kk = true; kv = 0.5 + (x - 8) * 0.06; }
        else if (brk && b < 12) kk = false;
        else { let c = at(kq, i); kk = c !== '.'; kv = vel(c); if (drop && v.fill && b % 8 === 7 && x === 14 && k >= 1) { kk = true; kv = 0.6; } }
        if (kk) { kickAt(t, kn, kv); MU.L.R.duck(t); }
        if (danger) { if (x % 2 === 0) hit('hat', t, 60, 0.05, 0.8); if (i % 32 === 0) hit('rise', t, 60, s16 * 32, 1); return; }
        if (sg.kk.gal && (drop || (sec === 'groove' && k >= 2)) && !last) { let c = at(sg.gal || '..96..96..96..96', i); if (c !== '.') kickAt(t, kn, vel(c), 'gal'); }
        let hv = HATV[x] * (0.88 + Math.random() * 0.24), hats = !(brk && b < 8) && !(intro && b < 8) && !(last && x >= 8);
        if (hats) { if (intro || (brk && b >= 8)) { if (x % 4 === 2) hit('hat', ts, 60, 0.05, 0.7); } else if (k === 0 && !drop) { if (x % 2 === 0) hit('hat', ts, 60, 0.05, hv); } else hit('hat', ts, 60, 0.05, hv); }
        let oc = sg.ohp ? at(sg.ohp, i) : x % 4 === 2 ? 'x' : '.';
        if ((drop || (sec === 'groove' && k >= 1)) && oc !== '.' && !(last)) hit('oh', ts, 60, 0.2, vel(oc, 0.8));
        if (drop && (b >= 16 || k >= 2)) { let rc = sg.ridep ? at(sg.ridep, i) : x % 4 ? '.' : x % 8 ? '4' : '6'; if (rc !== '.') hit('ride', ts, 60, 0.4, vel(rc)); }
        let main = sg.sn ? at(sg.sn, i) : x === 4 || x === 12 ? 'x' : '.';
        if (build && !sg.noroll && bl >= (sec === 'build' ? n - 4 : 4)) { let r = sec === 'build' ? bl - (n - 4) : bl - 4; if ((r < 2 ? x % 2 === 0 : true) && !(last && x === 15)) hit('snare', t, 60, 0.2, 0.35 + r * 0.15 + x / 64); }
        else if ((drop || sec === 'groove' || (brk && b >= 8) || (sg.noroll && build)) && main !== '.' && !(last && x >= 8)) hit('snare', t, 60, 0.25, vel(main));
        else if (drop && v.ghost && k >= 2 && x === 15 && b % 4 === 3) hit('snare', t, 60, 0.2, 0.35);
        if (sg.sn2 && (drop || (sec === 'groove' && k >= 1)) && at(sg.sn2, i) !== '.') hit('snare2', t, 60, 0.3, vel(at(sg.sn2, i)));
        let pq = sg.perc ? sg.perc[(v.pv + (drop && b >= 16 ? 1 : 0)) % sg.perc.length] : '';
        if (pq && (drop || (sec === 'groove' && k >= 1)) && at(pq, i) !== '.') hit('perc', ts, (sg.pn || [60])[x % (sg.pn || [60]).length], 0.2, at(pq, i) === 'o' ? 0.55 : 0.85);
        if (sg.perc2 && drop && (k >= 2 || b >= 16) && at(sg.perc2, i) !== '.') hit('perc2', ts, sg.pn2[x % sg.pn2.length], 0.3, 0.8);
        if (sg.bass && (drop || sec === 'groove') && !last) { let c = at(sg.bass, i); if (c !== '.') hit('bass', ts, root + 12 + (sg.bassN ? sg.bassN[i % sg.bassN.length] : 0), s16 * 0.9, [1, 0.8, 0.62, 0.5][x % 4]); }
        if (sg.stab && MU.T.stab && (drop || (sec === 'groove' && k >= 2)) && !(sg.stab.until && drop && b >= sg.stab.until) && at(sg.stab.p, i) !== '.') sg.stab.c.forEach(c => hit('stab', t, root + (sg.stab.o || 24) + c, s16 * 2.5, 0.85));
        // TODO the acid gets a bit samey after 5 mins, more patterns?
        let chain = S && S.state === 'play' ? Math.min(S.chain, 12) / 12 : 0, sw = Math.sin((bar % 16 + x / 16) / 16 * Math.PI * 2) * 0.1;
        let off = intro ? -0.22 + b / n * 0.12 : sec === 'groove' ? -0.04 : sec === 'build' ? -0.1 + (bl + x / 16) / n * 0.38 : brk ? (b < 8 ? -0.24 : -0.24 + (b - 8 + x / 16) / 8 * 0.36) : 0.12 + (b >= 16 ? 0.06 : 0);
        if (sg.seq && MU.T.seq && (drop || sec === 'groove' || build || (intro && b >= 8)) && !last) {
            let q = sg.seq, tr = MU.T.seq, len = drop && b >= 16 ? q.n.length : 16; tr.snd.fc = clamp(q.fc + off * 0.8 + sw * 0.5 + chain * 0.12, 0.08, 0.9);
            if (!(intro && x % 2)) hit('seq', t, root + 24 + q.n[i % len], s16 * 0.55, [0.95, 0.6, 0.8, 0.65][x % 4]);
        }
        const tb = (name, str, oct, plain) => {
            let tr = MU.T[name]; if (!tr || !str) return; let P = steps(str), st = P[x], pv = P[(x + 15) % 16], nx = P[(x + 1) % 16];
            tr.snd.cut = clamp((sg.cut || 0.3) + off + sw + chain * 0.2 + k * 0.03, 0.04, 0.95);
            if (!st.on) return; let ac = st.a && !plain, sl = st.s && !plain && nx.on, from = pv.on && pv.s && !plain;
            hit(name, t, root + oct + st.n, s16 * (sl ? 1.02 : 0.55), ac ? 1 : 0.62, ac, from, from, sl);
        };
        let ap = sg.acid && (sg.acid[drop && b >= 16 && sg.acid[1] ? 1 : v.ab && sg.acid[1] ? 1 : 0] || (drop ? sg.acid[1] : null));
        if (ap && !(intro && b < 8) && !last) tb('acid', ap, 24, brk && b < 8);
        if (sg.lead && drop && (b >= 16 || k >= 3)) tb('lead', sg.lead, 36);
        if (sg.hook && MU.T.lead && drop && (b >= 16 || fk)) { let c = at(sg.hook.p, i); if (c !== '.') hit('lead', t, root + 24 + sg.hook.n[i % sg.hook.n.length], s16 * gap(sg.hook.p, i) * 0.85, vel(c, 0.9)); }
        if (sg.chant && drop && b >= (sg.chant.from || 0) && !fk) sing(sg.chant, i, t, s16, root);
        if (MU.T.pad && x === 0) { let pc = sg.padC || [0], po = root + (sg.padO || 36); if ((intro || brk) && b % 4 === 0) pc.forEach(c => hit('pad', t, po + c, s16 * 64, 0.7)); else if (sg.drone && (drop || sec === 'groove')) pc.forEach(c => hit('pad', t, po + c, s16 * 15, 0.4)); }
        if (MU.ans) { MU.ans = 0; if (MU.T.acid) hit('acid', t, root + 36, s16 * 0.6, 1, true); else if (MU.T.stab) (sg.stab ? sg.stab.c : [0]).forEach(c => hit('stab', t, root + (sg.stab && sg.stab.o || 24) + c, s16 * 2, 1)); else if (MU.T.seq) hit('seq', t, root + 36, s16 * 2, 1); }
        if (MU.hot && i % 32 === 16) hit('siren', t, root + 36, s16 * 4, 0.5);
        if (MU.horn > 0) { hit('siren', t, root + 36, s16 * 8, 0.9); MU.horn = 0; }
    }
    function rate() { return songBpm() / 15 * (S && S.slow ? S.n.slowMo : 1); }
    function muTick() {
        if (!MU.on) return;
        let A = MU.A, R = rate(), pos = MU.pos + (performance.now() - MU.posAt) / 1000 * R;
        if (MU.step < pos) MU.step = Math.ceil(pos);
        if (MU.swap !== false && MU.ready && !MU.busy && (!MU.nx || MU.nx.r !== MU.swap)) muPre(MU.swap);
        if (MU.swap !== false && MU.nx && MU.nx.ok && MU.nx.r === MU.swap && muSwap()) { MU.swap = false; MU.imp = 1; }
        MU.hot = !!(S && S.mov && S.mov.kind === 'hot' && S.state === 'play');
        while (true) { let t = A.currentTime + (MU.step - pos) / R; if (t > A.currentTime + 0.12) break; play16(MU.step, Math.max(A.currentTime, t), 1 / R); MU.step++; }
        let chain = S ? Math.min(S.chain, 12) / 12 : 0, idle = !S || S.state !== 'play' || S.demo, slow = S && S.slow;
        let want = idle ? 900 : slow ? 700 : MU.danger ? 2600 : 9000 + 9000 * chain;
        MU.lp.frequency.setTargetAtTime(want, A.currentTime, 0.12); MU.drv.gain.setTargetAtTime(1.05 + MU.tier * 0.06, A.currentTime, 0.2);
        MU.out.gain.setTargetAtTime(N().musicVol * Math.pow(10, (MU.sg.lvl || 0) / 20) * (idle ? 0.55 : 1), A.currentTime, 0.3);
        if (Math.abs(MU.pr - songBpm()) > 1 || MU.pr == null) { MU.pr = songBpm(); MU.L.pr.bpm = Math.round(MU.pr); try { MU.L.R.apply(); } catch (e) {} }
    }
    function musicOn() {
        if (SPL || (S && S.state === 'pause') || MU.on || D.muted || (os.prefs && os.prefs.sound === false)) return;
        if (!MU.ready || (MU.want && MU.sg !== MU.want)) { muLoad(MU.want); return; }
        try {
            let A = MU.A; if (A.state === 'suspended') A.resume();
            let t = A.currentTime;
            MU.out.gain.cancelScheduledValues(t); MU.out.gain.setValueAtTime(0.0001, t); MU.out.gain.exponentialRampToValueAtTime(N().musicVol * 0.6, t + 0.6);
            MU.L.R.playing = true; MU.on = true; MU.pr = null; MU.mute = 0; MU.horn = 0;
            clearInterval(MU.tm); MU.tm = setInterval(muTick, 25);
        } catch (e) {}
    }
    function musicOff(fade, melt) {
        if (!MU.on) return;
        MU.on = false; clearInterval(MU.tm);
        let A = MU.A, t = A.currentTime, f = fade || 0.05;
        try {
            if (melt) { MU.lp.frequency.cancelScheduledValues(t); MU.lp.frequency.setValueAtTime(Math.max(200, MU.lp.frequency.value), t); MU.lp.frequency.exponentialRampToValueAtTime(90, t + f); hit('fall', t + 0.01, 60, f, 1); kickAt(t + 0.02, 34, 0.8, 'impact'); }
            MU.out.gain.cancelScheduledValues(t); MU.out.gain.setValueAtTime(Math.max(0.0001, MU.out.gain.value), t); MU.out.gain.exponentialRampToValueAtTime(0.0001, t + f);
            setTimeout(() => { if (!MU.on && MU.L) MU.L.stop(true); }, f * 1000 + 100);
        } catch (e) {}
    }
    function muCut() { if (MU.on && !(S && S.demo)) { MU.muteLen = 4; MU.mute = 4; } }
    function muHorn() { if (MU.on && !(S && S.demo)) MU.horn = 1; }
    function muImp() { if (MU.on && !(S && S.demo)) MU.imp = 1; }

    function snd(k, a) {
        if ((S && S.demo) || D.muted || (os.prefs && os.prefs.sound === false)) return;
        try {
            let A = window.audioCtx || (window.audioCtx = new (window.AudioContext || window.webkitAudioContext)()); if (A.state === 'suspended') A.resume();
            let out = os.gg && os.gg.out ? os.gg.out(A) : A.destination, now = A.currentTime;
            const env = (g, v, at, dur) => { g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(v, at + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, at + dur); };
            const osc = (type, f1, f2, v, dur, dl) => { let o = A.createOscillator(), g = A.createGain(), at = now + (dl || 0); o.type = type; o.frequency.setValueAtTime(f1, at); if (f2 !== f1) o.frequency.exponentialRampToValueAtTime(f2, at + dur); env(g, v, at, dur); o.connect(g); g.connect(out); o.start(at); o.stop(at + dur + 0.02); };
            const noise = (v, dur, f, q, dl) => { let at = now + (dl || 0), n = A.createBufferSource(), bf = A.createBuffer(1, Math.ceil(A.sampleRate * dur) + 10, A.sampleRate), d = bf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; n.buffer = bf; let fl = A.createBiquadFilter(), g = A.createGain(); fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = q || 0.8; env(g, v, at, dur); n.connect(fl); fl.connect(g); g.connect(out); n.start(at); };
            const sub = (f1, f2, v, dur, dl) => osc('sine', f1, f2, v, dur, dl);
            if (k === 'place') { sub(110, 42, 0.32, 0.16); noise(0.14, 0.06, 2600, 2); noise(0.08, 0.12, 700, 1.5, 0.01); }
            else if (k === 'perfect') { let f = 880 * Math.pow(2, Math.min(a || 0, 14) / 12); sub(130, 40, 0.38, 0.2); osc('square', f, f, 0.03, 0.05); osc('square', f * 1.5, f * 1.5, 0.03, 0.06, 0.06); osc('sine', f * 2, f * 2.02, 0.05, 0.35, 0.02); noise(0.1, 0.05, 6000, 3); }
            else if (k === 'cut') { sub(130, 34, 0.42, 0.32); osc('sawtooth', 190, 48, 0.05, 0.3); osc('square', 95, 40, 0.035, 0.22, 0.02); noise(0.2, 0.11, 850, 1.1); noise(0.1, 0.22, 240, 0.7, 0.03); }
            else if (k === 'wipe') { sub(70, 18, 0.5, 1.6); noise(0.35, 1.3, 300, 0.6); noise(0.15, 0.6, 5000, 1); for (let i = 0; i < 4; i++) osc('triangle', i % 2 ? 165 : 220, i % 2 ? 165 : 220, 0.07, 0.2, 0.3 + i * 0.22); }
            else if (k === 'ach') { osc('square', 988, 988, 0.04, 0.06); osc('square', 1319, 1319, 0.04, 0.12, 0.07); }
            else if (k === 'warn') { osc('triangle', 300, 220, 0.05, 0.12); }
            else if (k === 'boom') { sub(80, 22, 0.45, 0.9); noise(0.2, 0.6, 220, 0.5); noise(0.1, 0.25, 3000, 0.7, 0.02); }
            else if (k === 'sector') { sub(60, 20, 0.5, 1.2); noise(0.18, 0.9, 180, 0.5); for (let i = 0; i < 3; i++) osc('square', 220 * Math.pow(2, i * 7 / 12), 220 * Math.pow(2, i * 7 / 12), 0.03, 0.3, i * 0.08); }
            else if (k === 'boot') { for (let i = 0; i < 4; i++) osc('square', 330 * Math.pow(2, i * 5 / 12), 330 * Math.pow(2, i * 5 / 12), 0.025, 0.06, i * 0.25); }
            else if (k === 'co2') { noise(0.22, 0.9, 5200, 0.4); noise(0.12, 0.6, 1800, 0.5, 0.05); }
            else if (k === 'slow') { osc('sine', 400, 120, 0.06, 0.3); }
        } catch (e) {}
    }

    function press(down) {
        if (!S || S.demo) return;
        if (S.state === 'over') { if (down && !S.shown && S.wipe && S.wipe.t > 0.5) { S.shown = true; show('over'); } return; }
        if (S.state !== 'play' || S.boot > 0) return;
        if (down) { S.holding = true; S.held = 0; }
        else if (S.holding) { S.holding = false; drop(); }
    }
    function onKey(e) {
        if (!S || asleep || !root || !root.closest('.is-active')) return;
        if (/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
        if (SPL) { if (e.type === 'keydown' && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); if (performance.now() - splT > 1200) splashDone(); } return; }
        if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); if (e.repeat) return; if (S.demo) { if (e.type === 'keydown') start(D.mode); return; } press(e.type === 'keydown'); }
        else if (e.type === 'keydown' && (e.key === 'm' || e.key === 'M')) mute();
        else if (e.type === 'keydown' && (e.key === 'p' || e.key === 'P') && !S.demo) pauseT();
        else if (e.type === 'keydown' && (e.key === 'r' || e.key === 'R') && !S.demo && S.state !== 'pause') start(S.mode);
    }
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const two = k => { let p = bits((WD().lines || {})[k] || DL[k] || k); return p.length > 1 ? esc(p[0]) + ' <i>//</i> ' + esc(p[1]) : esc(p[0]); };
    const DL = {
        title: '鬼積み | HARDCORE STACK',
        incident: '無事故で積んだ板 | slabs without an incident', pbLine: '自己ベスト | PB', edition: 'ハードコア積み版 | hardcore stacking edition', badge: 'ハードコア認定 | certified hardcore',
        sub: '板を落として積む。はみ出たら落ちる。崩したら終わり。ハードコアに積め | drop it on the tower. whatever hangs off falls off. tip it over and its done. stack hardcore',
        meter: '積みのハードコア度 | stacking hardness', xtreme: 'ハードコア | HARDCORE', insane: '超ハードコア | ULTRA HARDCORE', xtremeSub: '普通に積むだけでもう十分ハードコア | regular stacking. already hardcore enough', insaneSub: '最初から速い。変な形だらけ。板は戻らない。ハードコア | fast from the start. weird slabs. nothing grows back. hardcore',
        go: 'ハードコアに積む | START HARDCORE STACKING', warn: '※この積みはハードコアです | warning: this stacking is hardcore', home: 'ハードコアに積めない人は帰って | cant stack hardcore? go home',
        keys: 'スペースかクリックかタップで落とす。長押しでスロー。Pで一時停止、Rでやり直し、Mでミュート | space, click or tap drops it. hold for slow-mo. P pause, R restart, M mute',
        paused: '一時停止中 | paused', pausedSub: 'ハードコアも休憩は要る | even hardcore needs a minute', resume: '続ける | resume', achCount: '実績 {n}/{m} | achievements {n}/{m}',
        keysTouch: 'タップで落とす。長押しでスロー | tap drops it, hold for slow-mo', best: 'ベスト | best', again: 'もう一回 | again', menu: 'メニュー | menu',
        floors: '階 | floors', score: 'スコア | score', chain: '最大連続 | best chain', newBest: '新記録 | new best', song: '曲 | song', empty: 'まだ記録なし | nothing yet',
        wHead: '光過敏性発作についての警告 | WARNING: PHOTOSENSITIVE SEIZURES',
        w1: 'このゲームには点滅する光、ストロボ、激しい色の変化、速く動く模様がたくさん含まれています。 | This game has lots of flashing lights, strobes, rapid colour changes and fast-moving patterns.',
        w2: 'ごくまれに、点滅する光や模様を見ることで発作を起こす人がいます。これまで発作やてんかんになったことがない人でも起こることがあります。 | A very small number of people can have a seizure when they see certain flashing lights or patterns, even if they have never had a seizure or epilepsy before.',
        w3: '本人や家族にてんかんや発作の経験がある場合は、遊ぶ前に医師に相談してください。 | If you or anyone in your family has epilepsy or has had seizures, talk to a doctor before playing.',
        w4: 'めまい、見え方の異常、目や顔のけいれん、手足のふるえ、方向感覚がなくなる、混乱する、意識が一瞬遠のくなどの症状が出たら、すぐに遊ぶのをやめて医師に相談してください。 | Stop playing straight away and see a doctor if you get dizziness, blurred or changed vision, eye or face twitching, jerking or shaking arms or legs, disorientation, confusion, or a moment where you lose awareness.',
        w5: '明るい部屋で、画面から離れて遊んでください。こまめに休憩して、疲れているときは遊ばないでください。 | Play in a well-lit room and sit back from the screen. Take regular breaks, and don\'t play when you\'re tired.',
        w6: '「動きを減らす」をオンにすると、ストロボや点滅の演出がほとんど止まります。 | Turning on REDUCE MOTION switches off most of the strobing and flashing.',
        wMotion: '動きを減らす | reduce motion', wGo: 'わかった | i understand', on: 'オン | on', off: 'オフ | off',
        verdict: 'ハードコアに積めてない | not stacked hardcore enough', verdictGood: 'まあまあハードコアな積み | fairly hardcore stacking', marquee: 'ハードコア積み | HARDCORE STACKING'
    };
    function show(k) {
        let ov = root && root.querySelector('.st-ov'); if (!ov) return;
        let touch = matchMedia('(pointer: coarse)').matches, h = '', mq = (two('marquee') + ' <i>◆</i> ').repeat(10);
        if (k === 'menu') {
            h = '<div class="st-mq top"><span>' + mq + mq + '</span></div><div class="st-mq bot"><span>' + mq + mq + '</span></div>'
                + '<div class="st-card st-menu"><h1 data-t="' + esc(LJ('title', 0, DL.title)) + '">' + esc(LJ('title', 0, DL.title)) + '</h1><h3>' + esc(LE('title', 0, DL.title)) + '</h3><p class="st-ed">' + two('edition') + '</p>'
                + '<p class="st-sub">' + two('sub') + '</p><div class="st-meter"><span>' + two('meter') + '</span><b><i></i></b><em>110%</em></div><div class="st-modes">'
                + MODES.map(m => { let d = D.m[m]; return '<button class="st-mode' + (D.mode === m ? ' on' : '') + '" data-m="' + m + '"><b>' + two(m) + '</b><span>' + two(m + 'Sub') + '</span><em>' + (d.bestH ? esc(LE('best', 0, DL.best)) + ' ' + d.bestH + 'F' : esc(LE('empty', 0, DL.empty))) + '</em></button>'; }).join('')
                + '</div><button class="st-go">' + two('go') + '</button><p class="st-warn">' + two('warn') + '</p><p class="st-keys">' + two(touch ? 'keysTouch' : 'keys') + '</p><p class="st-home">' + two('home') + '</p></div>';
        } else if (k === 'warn') {
            let rm = calm();
            h = '<div class="st-card st-wcard"><h2>' + two('wHead') + '</h2>' + ['w1', 'w2', 'w3', 'w4', 'w5', 'w6'].map(w => '<p><b>' + esc(LE(w, 0, DL[w])) + '</b><span lang="ja">' + esc(LJ(w, 0, DL[w])) + '</span></p>').join('')
                + '<div class="st-row"><button class="st-btn" data-a="motion" aria-pressed="' + rm + '">' + two('wMotion') + ': ' + esc(LE(rm ? 'on' : 'off', 0, DL[rm ? 'on' : 'off'])) + '</button><button class="st-go st-wgo" data-a="ok" disabled>' + two('wGo') + '</button></div></div>';
        } else if (k === 'pause') {
            h = '<div class="st-card st-over"><h2>' + two('paused') + '</h2><div class="st-big">' + (S.floors.length - 1) + '</div><p class="st-warn">' + two('pausedSub') + '</p><div class="st-row"><button class="st-go" data-a="resume">' + two('resume') + '</button><button class="st-btn" data-a="menu">' + two('menu') + '</button></div></div>';
        } else if (k === 'over') {
            let d = D.m[S.mode], hh = S.floors.length - 1, nb = d.top[0] && d.top[0].s === S.score && S.score > 0;
            h = '<div class="st-card st-over"><h2>' + two('floors') + '</h2><div class="st-big">' + hh + '</div><p class="st-warn">' + two(hh >= 40 ? 'verdictGood' : 'verdict') + '</p><dl><dt>' + two('score') + '</dt><dd>' + fmt(S.score) + (nb ? ' <b>' + two('newBest') + '</b>' : '') + '</dd><dt>' + two('chain') + '</dt><dd>' + (S.bestChain > 1 ? 'x' + S.bestChain : '-') + '</dd><dt>' + two('best') + '</dt><dd>' + d.bestH + 'F</dd><dt>' + two('song') + '</dt><dd>' + esc(MU.sg ? MU.sg.name.toLowerCase() : '') + '</dd></dl><div class="st-row"><button class="st-go" data-a="again">' + two('again') + '</button><button class="st-btn" data-a="menu">' + two('menu') + '</button></div><p class="st-home">' + [LJ, LE].map(f => esc(f('achCount', Object.keys(D.achs || {}).length, DL.achCount).replace('{m}', Object.keys(ACH).length))).join(' <i>//</i> ') + '</p></div>';
        }
        ov.innerHTML = h; ov.hidden = !h; ov.dataset.k = k;
        if (k === 'warn') {
            SPL = 'warn'; splT = performance.now(); ov.onclick = null;
            let ok = ov.querySelector('[data-a="ok"]'); setTimeout(() => { if (ok.isConnected) ok.disabled = false; }, 1200); ok.onclick = splashDone;
            ov.querySelector('[data-a="motion"]').onclick = () => { if (os.toggleReducedMotion) os.toggleReducedMotion(); show('warn'); ov.querySelector('[data-a="ok"]').disabled = false; };
            return;
        }
        ov.onclick = null;
        ov.querySelectorAll('.st-mode').forEach(b => b.onclick = () => { D.mode = b.dataset.m; saveD(); show('menu'); });
        let g = ov.querySelector('.st-go'); if (g) g.onclick = () => k === 'pause' ? pauseT() : start(k === 'over' ? S.mode : D.mode);
        let mn = ov.querySelector('[data-a="menu"]'); if (mn) mn.onclick = () => { newGame(D.mode, true); show('menu'); };
    }
    // nothing plays till they've read it
    let SPL = null, splT = 0;
    function splashDone() { SPL = null; show('menu'); musicOn(); }
    function start(m) { SPL = null; let ov = root.querySelector('.st-ov'); ov.hidden = true; ov.innerHTML = ''; let first = !MODES.some(q => D.m[q].played); newGame(m); if (first) S.dd.on.push({ k: 'slab', s: 'tap or space to drop. hold = slow-mo', t: 0, life: 8, seed: 11 }); }
    function pauseT() {
        if (S.state === 'play') { S.state = 'pause'; S.holding = false; musicOff(0.15); show('pause'); }
        else if (S.state === 'pause') { S.state = 'play'; lastT = 0; let ov = root.querySelector('.st-ov'); ov.hidden = true; ov.innerHTML = ''; musicOn(); }
    }
    function padSync() { let b = root && root.querySelector('[data-p="mute"]'); if (b) b.classList.toggle('off', !!D.muted); }
    function mute() { D.muted = !D.muted; saveD(); if (D.muted) musicOff(0.2); else musicOn(); }

    function styles() {
        let st = document.createElement('style');
        st.textContent = `
            .gg-game[data-game="stack"] { padding: 0; }
            .st { position: relative; height: 100%; }
            .st-stage { position: absolute; inset: 0; display: grid; place-items: center; overflow: hidden; touch-action: none; -webkit-user-select: none; user-select: none; }
            .st-cv { display: block; image-rendering: pixelated; }
            .st-ov { position: absolute; inset: 0; display: grid; place-items: center; z-index: 3; background: rgba(4, 2, 8, 0.5); overflow: hidden; }
            .st-ov[hidden] { display: none; }
            .st-ov[data-k="menu"] { justify-items: start; padding-left: 4%; background: linear-gradient(90deg, rgba(4,2,8,0.92) 0 38%, rgba(4,2,8,0.1) 60%), repeating-linear-gradient(135deg, rgba(255,210,63,0.05) 0 14px, transparent 14px 28px); }
            .st-ov[data-k="menu"]::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 3px); animation: st-roll 0.4s steps(3) infinite; }
            .st-mq { position: absolute; left: 0; right: 0; height: 15px; overflow: hidden; white-space: nowrap; font: 11px/15px 'DotGothic16', monospace; letter-spacing: 2px; z-index: 1; color: #0a0610; background: repeating-linear-gradient(135deg, #ffd23f 0 10px, #e0b81a 10px 20px); }
            .st-mq.top { top: 0; } .st-mq.bot { bottom: 0; background: var(--neon-primary); }
            .st-mq span { display: inline-block; animation: st-mq 44s linear infinite; } .st-mq.bot span { animation-direction: reverse; animation-duration: 36s; } .st-mq i { font-style: normal; }
            .st-card { position: relative; z-index: 2; width: min(360px, 92%); max-height: calc(100% - 44px); overflow: auto; scrollbar-width: none; box-sizing: border-box; padding: 14px 16px; font-family: 'DotGothic16', monospace; color: #cfcbd6;
                background: linear-gradient(180deg, rgba(14,6,18,0.96), rgba(4,2,8,0.96)); border: 2px solid var(--neon-primary); box-shadow: 4px 4px 0 var(--neon-secondary), -2px -2px 0 #ff2a4a, 0 0 24px rgba(255,0,60,0.25);
                clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px)); }
            .st-card i { font-style: normal; opacity: 0.5; }
            .st-card::before { content: ''; display: block; height: 7px; margin: -14px -16px 10px; background: repeating-linear-gradient(135deg, #ffd23f 0 7px, #12081a 7px 14px); animation: st-stripe 0.6s linear infinite; background-size: 20px 7px; }
            .st-menu { animation: st-shake 4.4s steps(1) infinite; }
            .st-card h1 { position: relative; margin: 2px 0 0; font-weight: normal; font-size: 44px; line-height: 1; letter-spacing: 4px; color: #fff; text-shadow: -3px 0 var(--neon-primary), 3px 0 var(--neon-secondary), 0 0 18px var(--neon-primary); animation: st-jit 2.3s steps(1) infinite; }
            .st-card h1::before, .st-card h1::after { content: attr(data-t); position: absolute; left: 0; top: 0; color: #fff; }
            .st-card h1::before { text-shadow: -4px 0 #ff2a4a; clip-path: inset(0 0 60% 0); animation: st-sl1 1.7s steps(1) infinite; }
            .st-card h1::after { text-shadow: 4px 0 var(--neon-secondary); clip-path: inset(55% 0 0 0); animation: st-sl2 1.3s steps(1) infinite; }
            .st-card h2 { margin: 0; font-weight: normal; font-size: 12px; letter-spacing: 2px; color: var(--neon-secondary); }
            .st-card h3 { margin: 4px 0 0; font-weight: normal; font-size: 18px; letter-spacing: 6px; color: #ff2a4a; text-shadow: 2px 2px 0 #000; }
            .st-ed { margin: 2px 0 0; font-size: 10px; letter-spacing: 3px; color: #ffd23f; }
            .st-sub, .st-keys, .st-home { margin: 8px 0; font-size: 10px; line-height: 1.5; color: #8f8b9a; }
            .st-home { margin: 2px 0 0; color: #5d5870; font-size: 9px; }
            .st-warn { margin: 6px 0; font-size: 10px; color: #ff2a4a; animation: st-blink 0.8s steps(1) infinite; }
            .st-meter { display: grid; grid-template-columns: auto 1fr auto; gap: 6px; align-items: center; font-size: 10px; margin: 4px 0 8px; }
            .st-meter b { position: relative; height: 8px; background: #1c1228; overflow: visible; } .st-meter b i { position: absolute; left: 0; top: 0; bottom: 0; width: 110%; opacity: 1; background: repeating-linear-gradient(90deg, #ff2a4a 0 4px, var(--neon-primary) 4px 8px); animation: st-meter 0.5s steps(2) infinite; }
            .st-meter em { font-style: normal; color: #ff2a4a; }
            .st-modes { display: flex; flex-direction: column; gap: 6px; margin: 8px 0; }
            .st-mode { display: grid; grid-template-columns: 1fr auto; gap: 2px 8px; text-align: left; padding: 6px 8px; background: #120c1c; border: 1px solid #2c2440; color: #a9a3b8; font: inherit; cursor: inherit; clip-path: polygon(0 0, 100% 0, 100% 70%, calc(100% - 8px) 100%, 0 100%); }
            .st-mode b { font-weight: normal; font-size: 14px; color: #e8e4f0; } .st-mode span { grid-column: 1; font-size: 9px; } .st-mode em { grid-row: 1 / 3; grid-column: 2; align-self: center; font-style: normal; font-size: 11px; color: #ffe27a; }
            .st-mode.on { border-color: #ff2a4a; background: linear-gradient(90deg, #3a0818, #1c1028); } .st-mode.on b { color: #fff; text-shadow: -1px 0 #ff2a4a, 1px 0 var(--neon-secondary); }
            .st-mode:hover b { animation: st-jit 0.3s steps(1) infinite; }
            .st-go, .st-btn { display: block; width: 100%; margin-top: 6px; padding: 8px; font: inherit; font-size: 14px; letter-spacing: 2px; line-height: 1.3; white-space: normal; text-wrap: balance; overflow-wrap: anywhere; cursor: inherit; color: #0a0610; border: 0; box-sizing: border-box; }
            .st-go, .st-go * { color: #fff !important; text-shadow: 2px 2px 0 #0a0610, -1px -1px 0 #0a0610, 1px -1px 0 #0a0610, -1px 1px 0 #0a0610, 0 0 8px #0a0610 !important; }
            .st-row .st-go, .st-row .st-btn { white-space: nowrap; font-size: 12px; letter-spacing: 1px; padding: 8px 4px; }
            .st-ov[data-k="over"], .st-ov[data-k="pause"] { background: rgba(4, 2, 8, 0.74); }
            .st-over .st-warn { font-size: 12px; color: #ff5a74; text-shadow: 0 0 8px rgba(255, 30, 70, 0.7); }
            .st-pad { position: absolute; top: 4px; right: 6px; z-index: 2; display: flex; gap: 5px; }
            .st-pad button { width: 24px; height: 24px; padding: 0; display: grid; place-items: center; border: 1px solid rgba(255,255,255,0.25); background: rgba(10,6,16,0.6); cursor: inherit; }
            .st-pad svg { width: 14px; height: 14px; fill: #fff; shape-rendering: crispEdges; }
            .st-pad .x { display: none; stroke: #ff2a4a; stroke-width: 1; fill: none; } .st-pad .off .x { display: block; } .st-pad .off .w { display: none; }
            .st-stage:has(.st-ov:not([hidden])) .st-pad { display: none; }
            .st-pad button:active { background-color: var(--neon-primary); }
            .st-go { background: repeating-linear-gradient(135deg, var(--neon-primary) 0 10px, #ff2a4a 10px 20px); background-size: 28px 28px; box-shadow: 3px 3px 0 var(--neon-secondary), 0 0 14px var(--neon-primary); animation: st-stripe 0.5s linear infinite, st-pulse 0.47s ease-in-out infinite alternate; text-shadow: 1px 1px 0 rgba(255,255,255,0.5); }
            .st-btn { background: #2a2238; color: #e8e4f0; box-shadow: 3px 3px 0 #000; }
            .st-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .st-big { font-size: 56px; line-height: 1; color: #fff; text-shadow: -3px 0 var(--neon-primary), 3px 0 var(--neon-secondary); margin: 4px 0 4px; animation: st-jit 1.9s steps(1) infinite; }
            .st-over dl { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; margin: 0 0 8px; font-size: 12px; } .st-over dt { color: #8f8b9a; } .st-over dd { margin: 0; text-align: right; color: #fff; } .st-over dd b { font-weight: normal; color: #ffe27a; font-size: 10px; }
            @keyframes st-mq { to { transform: translateX(-50%); } }
            @keyframes st-roll { 0% { transform: translateY(0); } 33% { transform: translateY(1px); } 66% { transform: translateY(2px); } }
            @keyframes st-stripe { to { background-position: 28px 0; } }
            @keyframes st-spin { to { transform: rotate(360deg); } }
            @keyframes st-blink { 50% { opacity: 0.25; } }
            @keyframes st-meter { 50% { filter: brightness(1.6); } }
            @keyframes st-pulse { to { box-shadow: 3px 3px 0 var(--neon-secondary), 0 0 26px #ff2a4a; filter: brightness(1.15); } }
            @keyframes st-shake { 0%, 88%, 100% { transform: none; } 89% { transform: translate(-3px, 2px); } 90% { transform: translate(4px, -2px) skewX(3deg); } 91% { transform: translate(-2px, 0); } 92% { transform: none; } }
            @keyframes st-jit { 0%, 86%, 100% { transform: none; } 88% { transform: translate(3px, -1px); } 90% { transform: translate(-4px, 1px) skewX(-10deg); } 93% { transform: translate(1px, 0); } }
            @keyframes st-sl1 { 0%, 70%, 100% { transform: none; opacity: 0; } 72% { transform: translateX(-6px); opacity: 1; } 78% { transform: translateX(4px); opacity: 1; } }
            @keyframes st-sl2 { 0%, 60%, 100% { transform: none; opacity: 0; } 62% { transform: translateX(7px); opacity: 1; } 69% { transform: translateX(-3px); opacity: 1; } }
            .st-ov[data-k="warn"] { background: #07050b; }
            .st-wcard { width: min(560px, 94%); animation: none; }
            .st-wcard::before { animation: none; }
            .st-wcard h2 { font-size: 13px; color: #ffd23f; margin-bottom: 8px; }
            .st-wcard p { margin: 0 0 8px; font-size: 11px; line-height: 1.5; color: #e8e4f0; }
            .st-wcard p b { display: block; font-weight: normal; }
            .st-wcard p span { display: block; font-size: 10px; color: #8f8b9a; }
            .st-wcard .st-go { animation: none; } .st-wcard .st-go:disabled { opacity: 0.35; }
            .st-wcard .st-btn { margin-top: 6px; font-size: 11px; white-space: normal; }
            html.reduce-motion .st-ov *, html.reduce-motion .st-ov::after { animation: none !important; }
            @media (pointer: coarse) { .st-go, .st-btn { padding: 11px; } .st-mode { padding: 9px 10px; } }
        `;
        document.head.appendChild(st);
        return st;
    }
    function init() {
        cv = root.querySelector('.st-cv'); sx = cv.getContext('2d');
        buf = document.createElement('canvas'); bx = buf.getContext('2d');
        loadD(); readTheme(1e12);
        layout(); newGame(D.mode, true); show('warn');
        ro = new ResizeObserver(layout); ro.observe(root.querySelector('.st-stage'));
        document.addEventListener('keydown', onKey); document.addEventListener('keyup', onKey);
        cv.addEventListener('pointerdown', e => { e.preventDefault(); press(true); });
        cv.addEventListener('pointerup', () => press(false)); cv.addEventListener('pointercancel', () => press(false));
        cv.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); });
        root.querySelectorAll('.st-pad button').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (b.dataset.p === 'pause') { if (S && S.state === 'play' && !S.demo) pauseT(); } else { mute(); padSync(); } }));
        padSync();
        lastT = 0; raf = requestAnimationFrame(frame);
    }
    function stopAll() { cancelAnimationFrame(raf); raf = 0; }

    os.gg = os.gg || {}; os.gg.hooks = os.gg.hooks || {};
    os.gg.hooks.stack = {
        start(el) { root = el; asleep = false; style = styles(); el.innerHTML = '<div class="st"><div class="st-stage"><canvas class="st-cv"></canvas><div class="st-pad"><button data-p="pause" aria-label="pause"><svg viewBox="0 0 8 8"><path d="M1 1h2v6H1zM5 1h2v6H5z"/></svg></button><button data-p="mute" aria-label="mute"><svg viewBox="0 0 8 8"><path d="M0 3h2l2-2v6L2 5H0z"/><path class="w" d="M5 2.5h1v3H5zM6.5 1.5h1v5h-1z"/><path class="x" d="M5 2l3 4M8 2l-3 4"/></svg></button></div><div class="st-ov" hidden></div></div></div>'; init(); },
        pause() { asleep = true; stopAll(); musicOff(0.2); },
        resume() { if (!asleep) return; asleep = false; lastT = 0; stopAll(); raf = requestAnimationFrame(frame); musicOn(); },
        best() { loadD(); let b = Math.max(0, ...MODES.map(m => D.m[m].bestH)); return b ? b + 'F' : 0; },
        scores() { loadD(); return MODES.map(id => ({ t: id.toUpperCase(), rows: D.m[id].top.map((e, i) => [i + 1, e.s.toLocaleString('en-US'), e.h + 'F']) })).filter(b => b.rows.length); },
        stop() {
            stopAll(); musicOff(0.1); document.removeEventListener('keydown', onKey); document.removeEventListener('keyup', onKey);
            if (ro) ro.disconnect(); if (style) style.remove(); if (root) root.innerHTML = '';
            S = null; cv = null; sx = null; buf = null; bx = null; root = null; style = null; ro = null; LY = null;
            delete os.stk; delete os.gg.hooks.stack;
        }
    };
    // testing, dont touch
    os.stk = {
        SONGS, MU,
        hear: async (id, plan, sr, only, hseed) => {
            await os.need(['noisebox_fx.js', 'noisebox_sound.js']);
            let sg = SONGS.find(q => q.id === id) || SONGS[0]; sr = sr || 32000;
            let secs = plan.reduce((a, p) => a + p[0], 0) + 1.5, A = new OfflineAudioContext(2, Math.ceil(sr * secs), sr), keep = Object.assign({}, MU);
            MU.sg = sg; await kickPrep(sg, sr); let r = await band(A, sg), lp = A.createBiquadFilter(), g = A.createGain();
            let gl = glue(A), nb = nbBus(A, lp); r.L.R.M.out.disconnect(); r.L.R.M.out.connect(nb); lp.connect(gl[0]); gl[1].connect(g); g.connect(A.destination);
            Object.assign(MU, { sg, K: kit(A, lp), nb, hpf: null, imp: 0, ans: 0, lift: 0, rung: 0, rf: 0, hot: false, seed: hseed || 7, b0: 0, v: null, L: r.L, T: r.T, mute: 0, horn: 0, back: false, only: only || null }); r.L.R.playing = true;
            let t = 0.05, step = 0;
            for (const [dur, fl, chain, danger, ev] of plan) {
                MU.fl = fl; MU.tier = tierOf(fl, chain); MU.danger = !!danger;
                if (ev === 'cut') { MU.mute = MU.muteLen = 4; } if (ev === 'horn') MU.horn = 1; if (ev === 'imp') MU.imp = 1; if (ev === 'ans') MU.ans = 1; if (ev && FSTART[ev.split('+')[0]] != null) MU.b0 = Math.floor(step / 16) - FSTART[ev.split('+')[0]] - (+ev.split('+')[1] || 0);
                let cf = Math.min(chain, 12) / 12; lp.frequency.setValueAtTime(danger ? 2600 : 9000 + 9000 * cf, t); g.gain.setValueAtTime(N().musicVol || 0.6, t); gl[2].gain.setValueAtTime(1.05 + MU.tier * 0.06, t);
                let end = t + dur; while (t < end) { let s16 = 15 / songBpm(); play16(step, t, s16); step++; t += s16; }
            }
            let out = await A.startRendering(); Object.assign(MU, keep); return out;
        },
        raw: () => S, freeze: () => stopAll(), go: m => start(m || 'xtreme'), drop, say, show,
        step: (n, dt) => { for (let i = 0; i < (n || 1); i++) tick(dt || 1 / 60); readTheme(1e12); paint(); },
        aim(off) { let m = S.mov; if (!m) return; for (let i = 0; i < 6000; i++) { tick(1 / 240); if (S.mov !== m) return; let hx = -HALF + m.hi * CS, hy = -HALF + m.hj * CS, d = m.axis === 'x' ? m.x - hx : m.y - hy; if (Math.abs(d - (off || 0)) < 0.6) break; } drop(); }
    };
})();
