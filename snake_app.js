// asked a friend what was missing from the site, he said snake, so here I am, this was hell.

window.os = window.os || {};

(function () {
    const G = 24, KEY = 'vmp_snake2', OLDBEST = 'vampiiSnakeHighScore';
    const COMBO_MS = 2200, PHASE_MS = 4200;
    const KANA = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const kana = () => KANA.charAt(Math.floor(Math.random() * KANA.length));
    const hex = n => { let s = ''; for (let i = 0; i < (n || 6); i++) s += '0123456789ABCDEF'[Math.floor(Math.random() * 16)]; return '0x' + s; };
    const ip = () => [0, 0, 0, 0].map(() => Math.floor(Math.random() * 255)).join('.');
    const has = id => !id || (typeof os.hasUnlock === 'function' ? os.hasUnlock(id) : (() => { try { return (JSON.parse(localStorage.getItem(os.unlocksKey ? os.unlocksKey() : 'vmp_unlocks') || '[]') || []).indexOf(id) >= 0; } catch (e) { return false; } })());

    // all the modes. all unlocked
    const MODES = [
        { id: 'run', jp: '走', en: 'RUN', mult: 1, sub: 'the classic. eat the packets, dont hit the walls or yourself. see how long you last' },
        { id: 'zen', jp: '凪', en: 'ZEN', part: 'sx_zen', mult: 0.3, sub: 'no walls, you come out the other side, and biting yourself only costs you the tail. slow and calm, and it scores a third of what RUN does' },
        { id: 'rush', jp: '急', en: 'RUSH', part: 'sx_rush', mult: 1.25, sub: 'sixty seconds. three packets on the board at once. as many as you can' },
        { id: 'maze', jp: '壁', en: 'FIREWALLS', part: 'sx_maze', mult: 1.15, sub: 'twelve firewalls, one after another. take the shards, the gate opens, go through it' },
        { id: 'glitch', jp: '乱', en: 'GLITCH', mult: 1.2, sub: 'the board glitches. blocks of wall flicker in red, warn you for two seconds, then go solid for a while. watch the red' },
        { id: 'ouro', jp: '環', en: 'OUROBOROS', part: 'sx_ouro', mult: 1.5, sub: 'no food at all. you grow on your own, every few seconds. the only way to score is to catch your own tail' }
    ];
    const PERKS = [
        { id: 'slow', part: 'sx_slow', jp: '遅', en: 'SLOW', sub: 'hold SHIFT (or the ⏱ button) and time crawls. the meter fills back up when you let go' },
        { id: 'ghost', part: 'sx_ghost', jp: '霊', en: 'GHOST', sub: 'once a run you slide straight through your own body' },
        { id: 'shield', part: 'sx_shield', jp: '盾', en: 'SHIELD', sub: 'once a run a wall bounces you instead of killing you' },
        { id: 'magnet', part: 'sx_magnet', jp: '磁', en: 'MAGNET', sub: 'packets near your head drift towards it' },
        { id: 'fuse', part: 'sx_fuse', jp: '導', en: 'LONG FUSE', sub: 'the combo waits longer before it drops' },
        { id: 'luck', part: 'sx_luck', jp: '運', en: 'LUCK', sub: 'gold turns up twice as often' }
    ];
    const ARENAS = [
        { id: 'grid', jp: '格子', en: 'THE GRID' },
        { id: 'sump', part: 'sx_a_sump', jp: '澱', en: 'THE SUMP' },
        { id: 'lace', part: 'sx_a_lace', jp: '蝋燭', en: 'CANDLELIGHT' },
        { id: 'rain', part: 'sx_a_rain', jp: '雨', en: 'ACID RAIN' },
        { id: 'void', part: 'sx_a_void', jp: '虚', en: 'THE VOID' }
    ];
    const ownedModes = () => MODES.filter(m => has(m.part)), ownedPerks = () => PERKS.filter(p => has(p.part)), ownedArenas = () => ARENAS.filter(a => has(a.part));
    const slots = () => has('sx_slot') ? 3 : 2;

    let D = { best: {}, top: {}, runs: 0, mode: 'run', arena: 'grid', perks: [], skin: '', muted: false };
    function loadD() { try { let d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d) D = Object.assign(D, d); else { let o = parseInt(localStorage.getItem(OLDBEST)) || 0; if (o) D.best.run = o; } D.muted = D.muted || localStorage.getItem('vampiiSnakeMuted') === '1'; } catch (e) {} }
    function saveD() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} }
    function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

    let S = null, cv, cx, bg = null, bgKey = '', loopT = null, raf = null, last = 0, keys = {}, root = null, asleep = false, style = null;
    const alive = () => !!(root && root.isConnected);
    const wallAt = (x, y) => S.walls[y * G + x] === 1 || glitchAt(x, y) === 2;
    function glitchAt(x, y) { if (!S || !S.gl) return 0; let now = performance.now(), r = 0; S.gl.forEach(g => { if (g.cells.some(c => c.x === x && c.y === y)) r = Math.max(r, now < g.warn ? 1 : now < g.end ? 2 : 0); }); return r; }
    function glitchTick() {
        let now = performance.now();
        S.gl = (S.gl || []).filter(g => now < g.end);
        if (S.step % 16 !== 0 || S.gl.length > 5) return;
        let hd = S.snake[0], c = free(); for (let k = 0; k < 30 && Math.abs(c.x - hd.x) + Math.abs(c.y - hd.y) < 6; k++) c = free();
        let w = 1 + Math.floor(Math.random() * 3), h = 1 + Math.floor(Math.random() * 3), cells = [];
        for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { let x = c.x + xx, y = c.y + yy; if (x < G && y < G && !S.food.some(f => f.x === x && f.y === y)) cells.push({ x, y }); }
        S.gl.push({ cells, warn: now + 2000, end: now + 2000 + 6500 + Math.random() * 3000 }); snd('trace');
    }
    function newRun(modeId) {
        let m = MODES.find(x => x.id === modeId && has(x.part)) || MODES[0];
        let seed = Math.floor(Math.random() * 1e9);
        S = { mode: m, R: rng(seed), walls: new Uint8Array(G * G), snake: [], prev: [], dir: 'right', want: [], food: [], score: 0, combo: 0, lastEat: 0,
            tick: m.id === 'zen' ? 150 : m.id === 'rush' ? 115 : 130, state: 'ready', at: 0, step: 0, eaten: 0, level: 1, need: 0, got: 0, gate: null,
            reverseUntil: 0, phaseUntil: 0, trace: 0, firewall: 100, hunter: null, timeLeft: m.id === 'rush' ? 60000 : 0, up: 0, grow: 0,
            perks: (D.perks || []).filter(id => PERKS.some(p => p.id === id && has(p.part))).slice(0, slots()), slow: 100, slowing: false, ghost: 1, shield: 1,
            parts: [], texts: [], drips: [], shake: 0, flash: 0, log: [], gl: [], glitch: 0, near: 0, banner: null };
        if (m.id === 'maze') buildMaze(1);
        let sx = 6, sy = 12; while (wallAt(sx, sy) || wallAt(sx - 1, sy) || wallAt(sx - 2, sy)) sy = (sy + 1) % G;
        let len = m.id === 'ouro' ? 10 : 3;
        for (let i = 0; i < len; i++) S.snake.push({ x: Math.max(0, sx - i), y: sy });
        if (m.id === 'ouro') { S.snake = []; for (let i = 0; i < len; i++) S.snake.push({ x: Math.max(1, sx + 4 - i), y: sy }); }
        S.prev = S.snake.map(p => ({ x: p.x, y: p.y }));
        if (m.id === 'rush') { food('pk'); food('pk'); food('pk'); } else if (m.id === 'maze') { for (let i = 0; i < 2; i++) food('shard'); } else if (m.id !== 'ouro') food('pk');
        say('> vampii-net snake v5 :: mode ' + m.en, 'info'); say('> spoofing origin @ ' + ip(), 'info');
    }
    function buildMaze(lv) {
        let W = S.walls; W.fill(0); let r = rng(lv * 104729), put = (x, y) => { if (x >= 0 && y >= 0 && x < G && y < G) W[y * G + x] = 1; };
        let kind = (lv - 1) % 6;
        if (kind === 0) { for (let y = 4; y < G; y += 6) for (let x = 4; x < G; x += 6) { put(x, y); put(x + 1, y); put(x, y + 1); put(x + 1, y + 1); } }
        else if (kind === 1) { for (let i = 3; i < G - 3; i++) { if (i < 10 || i > 13) { put(i, 6); put(i, G - 7); } } for (let i = 9; i < 15; i++) { put(6, i); put(G - 7, i); } }
        else if (kind === 2) { for (let x = 2; x < G - 2; x++) if (x % 8 !== 4) { put(x, 8); put(x, 16); } for (let y = 2; y < G - 2; y++) if (y % 8 !== 0) put(12, y); }
        else if (kind === 3) { let cxm = 11.5, cym = 11.5; for (let a = 0; a < 6.28; a += 0.05) { let x = Math.round(cxm + Math.cos(a) * 8), y = Math.round(cym + Math.sin(a) * 8); if (Math.abs(Math.sin(a * 2)) > 0.25) put(x, y); } for (let a = 0; a < 6.28; a += 0.08) { let x = Math.round(cxm + Math.cos(a) * 4), y = Math.round(cym + Math.sin(a) * 4); if (Math.cos(a) > -0.5) put(x, y); } }
        else if (kind === 4) { for (let y = 3; y < G - 3; y += 4) for (let x = 0; x < G; x++) if (((x + y) % 10) < 6 && x > 1 && x < G - 2) put(x, y); }
        else { for (let i = 0; i < 18 + lv; i++) { let x = 2 + Math.floor(r() * (G - 4)), y = 2 + Math.floor(r() * (G - 4)), h = r() < 0.5; for (let k = 0; k < 3 + Math.floor(r() * 4); k++) put(h ? x + k : x, h ? y : y + k); } }
        // stops food spawning somewhere you physically cant get to. that was happening a lot
        for (let x = 0; x < 12; x++) W[12 * G + x] = 0;
        let seen = new Uint8Array(G * G), q = [12 * G + 6]; seen[q[0]] = 1;
        while (q.length) { let c = q.pop(), x = c % G, y = (c / G) | 0; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { let nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= G || ny >= G) return; let n = ny * G + nx; if (!seen[n] && !W[n]) { seen[n] = 1; q.push(n); } }); }
        for (let i = 0; i < G * G; i++) if (!seen[i]) W[i] = 1;
        S.need = 4 + lv; S.got = 0; S.gate = null; S.level = lv;
    }
    function free() {
        for (let tries = 0; tries < 2000; tries++) {
            let r = Math.random, x = Math.floor(r() * G), y = Math.floor(r() * G);
            if (wallAt(x, y) || S.snake.some(s => s.x === x && s.y === y) || S.food.some(f => f.x === x && f.y === y) || (S.gate && S.gate.x === x && S.gate.y === y)) continue;
            return { x, y };
        }
        return { x: 0, y: 0 };
    }
    function food(type, life) { let c = free(); S.food.push({ x: c.x, y: c.y, type, life: life || 0, max: life || 0, born: performance.now(), fx: c.x, fy: c.y }); }
    const turn = { up: 'down', down: 'up', left: 'right', right: 'left' };
    function setDir(d) {
        if (!S) return;
        if (S.state === 'ready' || S.state === 'menu') { if (S.state === 'ready') start(); }
        let lastWant = S.want.length ? S.want[S.want.length - 1] : S.dir;
        if (d === lastWant || turn[d] === lastWant) return;
        if (S.want.length < 3) S.want.push(d);
    }
    function start() { if (!S || S.state === 'dead') return; S.state = 'playing'; S.at = performance.now(); hideOverlay(); snd('boot'); schedule(); }
    function schedule() { clearTimeout(loopT); if (!S || S.state !== 'playing') return; let t = S.tick * (S.slowing ? 1.9 : 1); loopT = setTimeout(step, t); }
    function step() {
        if (!alive()) { stopAll(); return; }
        if (!S || S.state !== 'playing') return;
        let now = performance.now(); S.prev = S.snake.map(p => ({ x: p.x, y: p.y })); S.at = now; S.step++;
        if (S.demo) brain();
        if (S.want.length) S.dir = S.want.shift();
        let d = S.dir; if (now < S.reverseUntil) d = turn[d];
        let h = { x: S.snake[0].x, y: S.snake[0].y };
        if (d === 'up') h.y--; else if (d === 'down') h.y++; else if (d === 'left') h.x--; else h.x++;
        let wrap = S.mode.id === 'zen' || now < S.phaseUntil, out = h.x < 0 || h.y < 0 || h.x >= G || h.y >= G;
        if (out && wrap) { h.x = (h.x + G) % G; h.y = (h.y + G) % G; out = false; }
        if (out || (!out && wallAt(h.x, h.y))) {
            if (S.perks.indexOf('shield') >= 0 && S.shield > 0) { S.shield = 0; bounce(); say('> SHIELD took the hit', 'good'); text(S.snake[0].x, S.snake[0].y, '盾 SHIELD', '#05d9e8'); schedule(); return; }
            return die('wall');
        }
        let tail = S.snake[S.snake.length - 1], body = S.snake.findIndex((s, i) => i < S.snake.length - 1 && s.x === h.x && s.y === h.y);
        if (S.mode.id === 'ouro' && h.x === tail.x && h.y === tail.y) { S.snake.unshift(h); let n = Math.min(3, S.snake.length - 6); for (let i = 0; i <= n; i++) S.snake.pop(); eatScore(30, h, '環 caught it'); snd('bonus'); burst(h.x, h.y, '#ffea00', 16); afterMove(); return; }
        if (body >= 0) {
            if (S.mode.id === 'zen') { let lost = S.snake.length - body; S.snake.length = Math.max(3, body); S.score = Math.max(0, S.score - lost * 2); text(h.x, h.y, '-' + lost + '節', '#ff2a6d'); snd('hazard'); }
            else if (S.perks.indexOf('ghost') >= 0 && S.ghost > 0) { S.ghost = 0; say('> GHOST: slid through yourself', 'good'); text(h.x, h.y, '霊 GHOST', '#bd00ff'); }
            else return die('self');
        }
        if (S.hunter && S.hunter.x === h.x && S.hunter.y === h.y) return die('hunter');
        // close call. that was nearly a wall
        if (S.danger && d !== S.dangerDir && now - S.near > 1500) { S.near = now; S.score += 5; text(h.x, h.y, 'ギリ! CLOSE +5', '#ff8a3d', true); snd('bonus'); }
        S.snake.unshift(h);
        let fi = S.food.findIndex(f => f.x === h.x && f.y === h.y), ate = false;
        if (S.gate && S.gate.open && h.x === S.gate.x && h.y === S.gate.y) { nextLevel(); return; }
        if (fi >= 0) { let f = S.food.splice(fi, 1)[0]; ate = eat(f, h); }
        if (S.grow > 0) { S.grow--; ate = true; }
        if (!ate) S.snake.pop();
        afterMove();
    }
    function afterMove() {
        let now = performance.now();
        if (S.combo && now - S.lastEat > comboMs()) S.combo = 0;
        S.food.forEach(f => { if (f.max) f.life -= S.tick; });
        S.food = S.food.filter(f => !f.max || f.life > 0);
        if (S.perks.indexOf('magnet') >= 0 && S.step % 2 === 0) S.food.forEach(f => { let hd = S.snake[0], dx = hd.x - f.x, dy = hd.y - f.y; if (Math.abs(dx) + Math.abs(dy) <= 3 && Math.abs(dx) + Math.abs(dy) > 1) { let nx = f.x + Math.sign(dx) * (Math.abs(dx) >= Math.abs(dy) ? 1 : 0), ny = f.y + Math.sign(dy) * (Math.abs(dx) < Math.abs(dy) ? 1 : 0); if (!wallAt(nx, ny) && !S.snake.some(s => s.x === nx && s.y === ny)) { f.x = nx; f.y = ny; } } });
        if (S.hunter) moveHunter();
        if (skin().look === 'blood' && S.step % 2 === 0) { let t = S.snake[S.snake.length - 1]; S.drips.push({ x: t.x, y: t.y, a: 1, red: 1, o: hash(S.step) }); if (S.drips.length > 60) S.drips.shift(); }
        if (S.mode.id === 'ouro' && S.step % 22 === 0) S.grow++;
        if (S.mode.id === 'glitch') glitchTick();
        let hd = S.snake[0], dd = S.want.length ? S.want[0] : S.dir, ax = hd.x + (dd === 'left' ? -1 : dd === 'right' ? 1 : 0), ay = hd.y + (dd === 'up' ? -1 : dd === 'down' ? 1 : 0);
        let wrapOK = S.mode.id === 'zen' || performance.now() < S.phaseUntil, offB = ax < 0 || ay < 0 || ax >= G || ay >= G;
        S.danger = (offB && !wrapOK) || (!offB && (wallAt(ax, ay) || (S.mode.id !== 'zen' && S.snake.some((p, i) => i > 0 && i < S.snake.length - 1 && p.x === ax && p.y === ay)) || (S.hunter && S.hunter.x === ax && S.hunter.y === ay))) ? { x: ax, y: ay } : null;
        S.dangerDir = dd;
        if (S.mode.id === 'rush') { while (S.food.filter(f => f.type === 'pk').length < 3) food('pk'); }
        if (S.mode.id === 'maze' && !S.gate && S.food.filter(f => f.type === 'shard').length < 2 && S.got < S.need) food('shard');
        hud(); schedule();
    }
    const comboMs = () => COMBO_MS * (S.perks.indexOf('fuse') >= 0 ? 1.6 : 1);
    function eatScore(base, h, label) {
        let now = performance.now(); S.combo = now - S.lastEat < comboMs() ? Math.min(S.combo + 1, 8) : 1; S.lastEat = now;
        let pts = Math.round(base * (1 + (S.combo - 1) * 0.5)); S.score += pts; S.eaten++;
        text(h.x, h.y, label || '+' + pts, S.combo > 1 ? '#ffea00' : '#ff66b3');
        return pts;
    }
    function eat(f, h) {
        let C = colours();
        if (f.type === 'pk') {
            let pts = eatScore(10, h); snd('eat', S.combo - 1); burst(h.x, h.y, C.b, 12, true);
            say('> packet @ ' + hex() + ' :: +' + pts + (S.combo > 1 ? ' :: streak x' + S.combo : ''), S.combo > 1 ? 'good' : '');
            if (S.mode.id !== 'rush') food('pk');
            if (S.tick > 62) S.tick -= 2.5;
            extras(); return true;
        }
        if (f.type === 'gold') { S.score += 50; snd('bonus'); burst(h.x, h.y, '#ffea00', 20, true); text(h.x, h.y, 'お宝 +50', '#ffea00'); say('> !! rare shard @ ' + hex() + ' :: +50', 'good'); return true; }
        if (f.type === 'phase') { S.score += 20; S.phaseUntil = performance.now() + PHASE_MS; snd('phase'); burst(h.x, h.y, '#05d9e8', 16, true); text(h.x, h.y, '位相シフト', '#05d9e8'); say('> tunnel open :: walls dont count for ' + (PHASE_MS / 1000) + 's', 'info'); return true; }
        if (f.type === 'purge') { let cut = Math.min(3, S.snake.length - 3); for (let i = 0; i < cut; i++) S.snake.pop(); S.score += 80; S.firewall = Math.max(0, S.firewall - 10); snd('purge'); burst(h.x, h.y, '#bd00ff', 14, true); text(h.x, h.y, '-' + cut + '節 +80', '#bd00ff'); say('> node self purged :: +80', 'alert'); return true; }
        if (f.type === 'bug') { S.glitch = 1; S.reverseUntil = performance.now() + 3000; S.firewall = Math.max(0, S.firewall - 18); S.flash = 1; snd('hazard'); burst(h.x, h.y, '#ff2a6d', 14); text(h.x, h.y, 'データ破損', '#ff2a6d'); say('> [ALERT] IDS triggered :: controls flipped 3s', 'alert'); return false; }
        if (f.type === 'shard') { S.got++; let pts = eatScore(15, h, S.got + ' / ' + S.need); snd('eat', 2); burst(h.x, h.y, '#05d9e8', 12, true); if (S.got >= S.need) openGate(); return true; }
        return false;
    }
    function extras() {
        let luck = S.perks.indexOf('luck') >= 0 ? 2 : 1, n = S.food.length;
        if (S.score > 0 && S.eaten % 6 === 0 && !S.food.some(f => f.type === 'gold') && Math.random() < 0.6 * luck) food('gold', 5200);
        if (S.score >= 40 && !S.food.some(f => f.type === 'phase') && Math.random() < 0.12 && S.mode.id !== 'zen') food('phase', 6000);
        if (S.score >= 80 && !S.food.some(f => f.type === 'purge') && S.snake.length > 7 && Math.random() < 0.1) food('purge');
        if (S.score >= 30 && !S.food.some(f => f.type === 'bug') && Math.random() < 0.14 && S.mode.id !== 'zen') food('bug', 9000);
        if (n > 8) S.food.length = 8;
    }
    function openGate() { let c = free(); S.gate = { x: c.x, y: c.y, open: true }; snd('milestone'); say('> FIREWALL ' + S.level + ' down :: the gate is open', 'good'); text(c.x, c.y, 'GATE', '#ffea00'); S.food = S.food.filter(f => f.type !== 'shard'); }
    function nextLevel() {
        S.score += 100 * S.level; snd('record'); burst(S.gate.x, S.gate.y, '#ffea00', 30, true);
        if (S.level >= 12) { say('> all twelve firewalls down. absolute menace', 'good'); return die('win'); }
        buildMaze(S.level + 1); S.food = []; S.hunter = null;
        let sy = 12; S.snake = [{ x: 6, y: sy }, { x: 5, y: sy }, { x: 4, y: sy }]; S.prev = S.snake.map(p => ({ x: p.x, y: p.y })); S.dir = 'right'; S.want = [];
        food('shard'); food('shard'); text(6, 12, 'FIREWALL ' + S.level, '#05d9e8'); say('> FIREWALL ' + S.level + ' :: ' + S.need + ' shards', 'info'); hud(); schedule();
    }
    function bounce() { S.dir = turn[S.dir]; S.want = []; S.snake.reverse(); S.prev = S.snake.map(p => ({ x: p.x, y: p.y })); S.shake = 1; snd('hazard'); }
    function moveHunter() {
        let H = S.hunter; if (performance.now() > H.until) { S.hunter = null; say('> the hunter lost you', 'good'); return; }
        if (S.step % 2) return;
        let hd = S.snake[0], opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: H.x + dx, y: H.y + dy })).filter(p => p.x >= 0 && p.y >= 0 && p.x < G && p.y < G && !wallAt(p.x, p.y) && !S.snake.slice(1).some(s => s.x === p.x && s.y === p.y));
        opts.sort((a, b) => (Math.abs(a.x - hd.x) + Math.abs(a.y - hd.y)) - (Math.abs(b.x - hd.x) + Math.abs(b.y - hd.y)));
        if (opts.length) { H.px = H.x; H.py = H.y; H.x = opts[0].x; H.y = opts[0].y; }
        if (H.x === hd.x && H.y === hd.y) die('hunter');
    }
    function die(why) {
        if (!S || S.state === 'dead') return;
        if (S.demo) { S.state = 'dead'; clearTimeout(loopT); S.shake = 0.6; S.glitch = 0.6; burst(S.snake[0].x, S.snake[0].y, '#ff2a6d', 18); setTimeout(() => { if (S && S.demo && /menu|loadout/.test(showing())) attract(true); }, 1300); return; }
        S.state = 'dead'; clearTimeout(loopT);
        let won = why === 'win';
        if (!won) { snd('death'); S.shake = 1; S.flash = 0.8; burst(S.snake[0].x, S.snake[0].y, '#ff2a6d', 26); say('> CONNECTION TERMINATED :: ' + ({ wall: 'hit a wall', self: 'bit yourself', hunter: 'the hunter got you', time: 'out of time' }[why] || why), 'alert'); }
        let m = S.mode.id, best = D.best[m] || 0, rec = S.score > best && S.score > 0;
        S.glitch = 1;
        if (S.score > 0) { let tp = (D.top[m] = (D.top[m] || []).concat([{ s: S.score, d: new Date().toISOString().slice(0, 10) }]).sort((a, b) => b.s - a.s).slice(0, 10)); S.place = tp.findIndex(e => e.s === S.score) + 1; } else S.place = 0;
        if (rec) { D.best[m] = S.score; snd('record'); text(S.snake[0].x, S.snake[0].y - 1, '新記録！', '#ffea00', true); say('> ROOT ACCESS :: a new best for ' + S.mode.en + ': ' + S.score, 'good'); }
        D.runs++;
        saveD();
        S.rec = rec; S.why = why;
        hud(); setTimeout(() => showOverlay('dead'), 650);
    }

    function colours() {
        let sk = D.skin ? (typeof appsDB !== 'undefined' && appsDB.parts || []).find(p => p.kind === 'snake' && p.id === D.skin) : null;
        let cs = getComputedStyle(alive() ? root : document.documentElement), css = n => cs.getPropertyValue(n).trim();
        return { a: sk && sk.a || css('--neon-primary') || '#ff2a6d', b: sk && sk.b || css('--neon-secondary') || '#ff66b3', look: sk && sk.look || '' };
    }
    const LC = 12, LW = G * LC;
    let lo = null, lx = null, colC = null, colAt = 0;
    const cell = () => LC;
    const hexOf = c => { let x = document.createElement('canvas').getContext('2d'); x.fillStyle = c; return x.fillStyle; };
    function rgbOf(c) { c = String(c); if (c[0] !== '#') c = hexOf(c); c = c.replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join(''); let n = parseInt(c.slice(0, 6), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
    function mixHex(a, b, t) { let A = rgbOf(a), B = rgbOf(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
    function mix(a, b, t) { try { return mixHex(a, b, t); } catch (e) { return a; } }
    function skin() { let n = performance.now(); if (!colC || n - colAt > 1000) { colAt = n; colC = colours(); } return colC; }
    function swapFor(a, b, look) {
        if (look === 'chrome') return { a: '#b8bcc8', A: '#4a4e5a', h: '#ffffff', b: mixHex(b, '#ffffff', 0.3), B: '#6a6e7a' };
        if (look === 'blood') return { a: a, A: '#250004', h: '#ff8f9c', b: b, B: '#1a0003' };
        return { a: a, A: mixHex(a, '#000000', 0.5), h: mixHex(a, '#ffffff', 0.3), b: b, B: mixHex(b, '#000000', 0.45) };
    }
    const ar = () => ARENAS.find(a => a.id === D.arena && has(a.part)) || ARENAS[0];
    function sp(x, key, gx2, gy2, sw, rot) {
        if (typeof os.sprite !== 'function') return;
        let c = os.sprite('snake/' + key, sw); if (!c) return;
        let px = gx2 * LC, py = gy2 * LC;
        if (!rot) { x.drawImage(c, px, py); return; }
        x.save(); x.translate(px + LC / 2, py + LC / 2); x.rotate(rot * Math.PI / 2); x.drawImage(c, -LC / 2, -LC / 2); x.restore();
    }
    function hash(i) { let h = (i * 2654435761) >>> 0; h ^= h >>> 13; h = Math.imul(h, 1274126177) >>> 0; return (h & 0xffff) / 65536; }
    function arenaBg() {
        let A = ar(), C = skin(), k = A.id + C.a;
        if (bg && bgKey === k) return bg;
        bg = document.createElement('canvas'); bg.width = LW; bg.height = LW; bgKey = k;
        let x = bg.getContext('2d'); x.imageSmoothingEnabled = false;
        let sw = A.id === 'grid' ? { p: mixHex(C.a, '#000000', 0.7), G: mixHex(C.a, '#000000', 0.82) } : null;
        for (let i = 0; i < G * G; i++) sp(x, 'floor_' + A.id + (hash(i + 3) < 0.12 ? 1 : 0), i % G, (i / G) | 0, sw);
        let vg = x.createRadialGradient(LW / 2, LW / 2, LW * 0.35, LW / 2, LW / 2, LW * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)'); x.fillStyle = vg; x.fillRect(0, 0, LW, LW);
        return bg;
    }
    function drawWalls(x) {
        let A = ar(), C = skin(), sw = A.id === 'grid' ? { a: C.a, A: mixHex(C.a, '#000000', 0.55) } : null;
        for (let i = 0; i < G * G; i++) if (S.walls[i]) sp(x, 'wall_' + A.id, i % G, (i / G) | 0, sw);
    }
    function drawFood(x, f, t) {
        let age = (t - f.born) / 1000;
        if (f.max && f.life < 1500 && Math.floor(t / 120) % 2) return;
        if (age < 0.12) { x.fillStyle = '#ffffff'; x.fillRect(f.x * LC + 4, f.y * LC + 4, 4, 4); return; }
        let C = skin(), sw = f.type === 'pk' ? { b: C.b, h: mixHex(C.b, '#ffffff', 0.5) } : null, bob = Math.floor(t / 300 + f.x) % 2;
        x.save(); x.translate(0, -bob); sp(x, f.type, f.x, f.y, sw); x.restore();
        x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(f.x * LC + 3, f.y * LC + 11, 6, 1);
    }
    function dirTo(a, b) { let dx = b.x - a.x, dy = b.y - a.y; if (Math.abs(dx) > 1) dx = -Math.sign(dx); if (Math.abs(dy) > 1) dy = -Math.sign(dy); return dx > 0 ? 0 : dx < 0 ? 2 : dy > 0 ? 1 : 3; }
    function dirToWant() { return { right: 0, down: 1, left: 2, up: 3 }[S.dir] || 0; }
    function spark(gx, gy, col) { S.parts.push({ x: gx * LC + (Math.random() - 0.5) * LC * 0.6, y: gy * LC + (Math.random() - 0.5) * LC * 0.6, vx: 0, vy: 0, life: 300, max: 300, col, size: 1 }); }
    function burst(gx, gy, col, n, up) { for (let i = 0; i < n; i++) { let a = Math.random() * 6.283, s = 0.4 + Math.random() * 1.4; S.parts.push({ x: (gx + 0.5) * LC, y: (gy + 0.5) * LC, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (up ? 0.6 : 0), life: 500 + Math.random() * 400, max: 900, col, size: Math.random() < 0.3 ? 2 : 1 }); } }
    function text(gx, gy, s, col, big) { if (!S) return; S.texts.push({ x: (gx + 0.5), y: (gy + 0.2), s, col, life: 1100, big }); if (S.texts.length > 5) S.texts.shift(); }
    function frame(t) {
        if (!alive() || asleep) { stopAll(); return; }
        raf = requestAnimationFrame(frame);
        let dt = Math.min(48, t - (last || t)); last = t;
        if (!S || !cv) return;
        fit();
        let W = cv.width, c = W / G;
        if (S.state === 'playing') {
            let want = S.perks.indexOf('slow') >= 0 && (keys.Shift || slowBtn) && S.slow > 0;
            if (want) S.slow = Math.max(0, S.slow - dt * 0.03); else S.slow = Math.min(100, S.slow + dt * 0.008);
            S.slowing = want && S.slow > 0;
            S.up += dt; S.firewall = Math.min(100, S.firewall + dt * 0.003);
            if (S.mode.id === 'rush') { S.timeLeft -= dt * (S.slowing ? 0.55 : 1); if (S.timeLeft <= 0) { S.timeLeft = 0; die('time'); } }
            if (S.mode.id !== 'zen' && !S.hunter) { S.trace += dt * 0.0022 * (1 + (130 - S.tick) / 60); if (S.trace >= 100) { S.trace = 0; spawnHunter(); } }
        }
        if (!lo) { lo = document.createElement('canvas'); lo.width = lo.height = LW; lx = lo.getContext('2d'); }
        let x = lx; x.imageSmoothingEnabled = false; x.setTransform(1, 0, 0, 1, 0, 0);
        x.drawImage(arenaBg(), 0, 0);
        arenaLive(x, t, dt);
        S.drips.forEach(d => { d.a -= dt / (d.red ? 5000 : 9000);
            if (d.red) { let a = Math.max(0, d.a), ox = Math.floor(d.o * 6); x.fillStyle = 'rgba(' + Math.round(70 + 90 * a) + ',0,12,' + (a * 0.75) + ')'; x.fillRect(d.x * LC + 3 + ox, d.y * LC + 5, 3, 3); x.fillRect(d.x * LC + 4 + ox, d.y * LC + 4, 1, 5); if (a > 0.6) { x.fillStyle = 'rgba(255,160,170,0.5)'; x.fillRect(d.x * LC + 3 + ox, d.y * LC + 5, 1, 1); } return; }
            x.fillStyle = 'rgba(244,241,230,' + Math.max(0, d.a) * 0.6 + ')'; x.fillRect(d.x * LC + 3, d.y * LC + 6, 6, 2); x.fillRect(d.x * LC + 4, d.y * LC + 5, 4, 4); }); S.drips = S.drips.filter(d => d.a > 0);
        drawWalls(x);
        if (S.gate) sp(x, 'gate' + (Math.floor(t / 180) % 2), S.gate.x, S.gate.y);
        S.food.forEach(f => drawFood(x, f, t));
        if (S.hunter) sp(x, 'hunter' + (Math.floor(t / 120) % 2), S.hunter.x, S.hunter.y);
        S.parts.forEach(p => { p.life -= dt; p.x += p.vx * dt / 16; p.y += p.vy * dt / 16; p.vy += 0.02; p.vx *= 0.98; x.globalAlpha = Math.max(0, p.life / p.max); x.fillStyle = p.col; x.fillRect(Math.round(p.x), Math.round(p.y), p.size || 1, p.size || 1); });
        x.globalAlpha = 1; S.parts = S.parts.filter(p => p.life > 0); if (S.parts.length > 300) S.parts.splice(0, S.parts.length - 300);
        if (S.flash > 0) { x.fillStyle = 'rgba(255,30,60,' + S.flash * 0.35 + ')'; x.fillRect(0, 0, LW, LW); S.flash = Math.max(0, S.flash - dt / 400); }
        if (S.slowing) { x.fillStyle = 'rgba(80,160,255,0.14)'; x.fillRect(0, 0, LW, LW); for (let yy = 0; yy < LW; yy += 3) { x.fillStyle = 'rgba(0,0,20,0.15)'; x.fillRect(0, yy, LW, 1); } }
        if (performance.now() < S.reverseUntil) { x.fillStyle = 'rgba(255,40,80,0.7)'; x.fillRect(0, 0, LW, 2); x.fillRect(0, LW - 2, LW, 2); x.fillRect(0, 0, 2, LW); x.fillRect(LW - 2, 0, 2, LW); }
        let k = W / LW, sh = S.shake > 0 ? Math.round(S.shake * 3) : 0; S.shake = Math.max(0, S.shake - dt / 300);
        cx.setTransform(1, 0, 0, 1, 0, 0); cx.imageSmoothingEnabled = false; cx.fillStyle = '#000'; cx.fillRect(0, 0, W, W);
        let ox = Math.round((Math.random() - 0.5) * sh) * k, oy = Math.round((Math.random() - 0.5) * sh) * k;
        cx.drawImage(lo, ox, oy, W, W);
        cx.save(); cx.translate(ox, oy); hiPass(cx, c, t); cx.restore();
        S.texts.forEach(o => { o.life -= dt; o.y -= dt * 0.0012; cx.globalAlpha = Math.max(0, Math.min(1, o.life / 400)); cx.font = 'bold ' + Math.round(c * (o.big ? 0.9 : 0.55)) + 'px "Courier New", monospace'; cx.textAlign = 'center'; cx.lineWidth = 3; cx.strokeStyle = '#000'; cx.strokeText(o.s, o.x * c, o.y * c); cx.fillStyle = o.col; cx.fillText(o.s, o.x * c, o.y * c); });
        cx.globalAlpha = 1; cx.textAlign = 'left'; S.texts = S.texts.filter(o => o.life > 0);
        let f = Math.round(c * 0.55); cx.font = 'bold ' + f + 'px "Courier New", monospace'; cx.fillStyle = '#fff'; cx.shadowColor = '#000'; cx.shadowBlur = 4;
        cx.fillText(String(S.score), c * 0.4, c * 0.9);
        if (S.combo > 1) { let left = Math.max(0, 1 - (performance.now() - S.lastEat) / comboMs()); cx.fillStyle = '#ffea00'; cx.fillText('x' + S.combo, c * 0.4, c * 1.6); cx.fillRect(c * 0.4, c * 1.8, c * 2.2 * left, 3); }
        cx.textAlign = 'right'; cx.fillStyle = '#ccc';
        if (S.mode.id === 'rush') { cx.fillStyle = S.timeLeft < 10000 ? '#ff2a6d' : '#fff'; cx.fillText((S.timeLeft / 1000).toFixed(1) + 's', W - c * 0.4, c * 0.9); }
        else if (S.mode.id === 'maze') cx.fillText('FW ' + S.level + '/12  ' + S.got + '/' + S.need, W - c * 0.4, c * 0.9);
        else cx.fillText('BEST ' + (D.best[S.mode.id] || 0), W - c * 0.4, c * 0.9);
        cx.textAlign = 'left'; cx.shadowBlur = 0;
        let py = W - c * 0.5; S.perks.forEach((id, i) => { let p = PERKS.find(q => q.id === id), used = (id === 'ghost' && !S.ghost) || (id === 'shield' && !S.shield); cx.globalAlpha = used ? 0.3 : 0.9; cx.fillStyle = '#000a'; cx.fillRect(c * 0.3 + i * c * 2.1, py - c * 0.7, c * 1.9, c * 0.9); cx.fillStyle = '#fff'; cx.font = Math.round(c * 0.45) + 'px monospace'; cx.fillText(p.jp + ' ' + p.en.slice(0, 5), c * 0.42 + i * c * 2.1, py - c * 0.1); if (id === 'slow') { cx.fillStyle = '#5ab0ff'; cx.fillRect(c * 0.3 + i * c * 2.1, py + c * 0.22, c * 1.9 * S.slow / 100, 3); } });
        cx.globalAlpha = 1;
        banner(cx, W, c, t);
        post(t);
    }
    const lerp = (a, b, f) => a + (b - a) * f;
    function along() {
        if (!S || S.state !== 'playing') return 1;
        return Math.max(0, Math.min(1, (performance.now() - S.at) / (S.tick * (S.slowing ? 1.9 : 1))));
    }
    function pulse(t, sp) { return 0.5 + 0.5 * Math.sin(t / (sp || 160)); }
    function glow(x, gx, gy, r, col, a) {
        let g = x.createRadialGradient(gx, gy, 0, gx, gy, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
        x.globalAlpha = a; x.fillStyle = g; x.fillRect(gx - r, gy - r, r * 2, r * 2); x.globalAlpha = 1;
    }
    const FOODGLOW = { pk: null, gold: '#ffea00', phase: '#05d9e8', purge: '#bd00ff', bug: '#ff2a6d', shard: '#05d9e8' };
    function hiPass(x, c, t) {
        let C = skin(), f = along(), cen = (gx, gy) => [(gx + 0.5) * c, (gy + 0.5) * c];
        x.save(); x.globalCompositeOperation = 'lighter';
        S.food.forEach(fd => { let [px, py] = cen(fd.x, fd.y), col = FOODGLOW[fd.type] || C.b, bad = fd.type === 'bug' || fd.type === 'purge';
            glow(x, px, py, c * (bad ? 1.6 + 0.5 * pulse(t, 90) : 1.1), col, bad ? 0.55 : 0.35); });
        if (S.gate) { let [px, py] = cen(S.gate.x, S.gate.y); glow(x, px, py, c * (2 + pulse(t, 200)), '#ffea00', 0.45); }
        x.restore();
        // bad food gets a big ! so you dont eat it by accident
        S.food.forEach(fd => { if (fd.type !== 'bug' && fd.type !== 'purge') return; let [px, py] = cen(fd.x, fd.y), col = fd.type === 'bug' ? '#ff2a6d' : '#bd00ff', k = (t % 900) / 900;
            x.strokeStyle = col; x.lineWidth = Math.max(1.5, c * 0.08); x.globalAlpha = 1 - k; x.beginPath(); x.arc(px, py, c * (0.5 + k * 0.9), 0, 6.283); x.stroke(); x.globalAlpha = 1;
            x.font = 'bold ' + Math.round(c * 0.8) + 'px "Courier New", monospace'; x.textAlign = 'center'; x.fillStyle = col; x.shadowColor = col; x.shadowBlur = c * 0.5;
            x.fillText(fd.type === 'bug' ? '!' : '✕', px, py - c * 0.75 - Math.abs(Math.sin(t / 180)) * c * 0.15); x.shadowBlur = 0; x.textAlign = 'left'; });
        if (S.gl && S.gl.length) { let now = performance.now();
            S.gl.forEach(g => { let warn = now < g.warn, left = (g.warn - now) / 2000;
                g.cells.forEach(cl => { let px = cl.x * c, py = cl.y * c;
                    if (warn) { if (Math.floor(t / (60 + 140 * left)) % 2) return; x.fillStyle = 'rgba(255,42,109,0.22)'; x.fillRect(px, py, c, c); x.strokeStyle = '#ff2a6d'; x.lineWidth = 1; x.beginPath(); for (let k = -c; k < c; k += c / 3) { x.moveTo(px + k, py + c); x.lineTo(px + k + c, py); } x.save(); x.beginPath(); x.rect(px, py, c, c); x.clip(); x.stroke(); x.restore(); x.strokeRect(px + 1, py + 1, c - 2, c - 2); }
                    else { x.fillStyle = '#3a0010'; x.fillRect(px, py, c, c); x.fillStyle = '#ff2a6d'; x.globalAlpha = 0.35 + 0.25 * pulse(t, 120); x.fillRect(px + 2, py + 2, c - 4, c - 4); x.globalAlpha = 1; x.strokeStyle = '#ff6a8a'; x.lineWidth = 1.5; x.strokeRect(px + 0.75, py + 0.75, c - 1.5, c - 1.5); } });
                if (warn) { let a = g.cells[0], [px, py] = cen(a.x, a.y); x.strokeStyle = '#ffea00'; x.lineWidth = 2; x.beginPath(); x.arc(px, py, c * 0.35, -1.5708, -1.5708 + 6.283 * left); x.stroke(); } }); }
        if (S.hunter) { let [hx, hy] = cen(S.hunter.x, S.hunter.y), [sx, sy] = cen(S.snake[0].x, S.snake[0].y);
            x.save(); x.globalCompositeOperation = 'lighter'; glow(x, hx, hy, c * (2.4 + pulse(t, 70)), '#ff2a6d', 0.6); x.restore();
            x.strokeStyle = 'rgba(255,42,109,0.7)'; x.lineWidth = 1.5; x.setLineDash([c * 0.25, c * 0.2]); x.lineDashOffset = -t / 30; x.beginPath(); x.moveTo(hx, hy); x.lineTo(sx, sy); x.stroke(); x.setLineDash([]);
            x.strokeStyle = '#ff2a6d'; x.lineWidth = 2; let r = c * (0.9 + 0.2 * pulse(t, 60)); x.beginPath(); for (let k = 0; k < 4; k++) { let a = k * 1.5708 + t / 400; x.moveTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); x.lineTo(sx + Math.cos(a) * r * 0.6, sy + Math.sin(a) * r * 0.6); } x.stroke(); }
        drawSnakeHi(x, c, t, f);
        if (S.danger && S.state === 'playing') { let [px, py] = cen(Math.max(0, Math.min(G - 1, S.danger.x)), Math.max(0, Math.min(G - 1, S.danger.y))), r = c * 0.4, a = 0.55 + 0.45 * pulse(t, 50);
            x.fillStyle = 'rgba(255,42,109,' + (0.18 * a) + ')'; x.fillRect(px - c / 2, py - c / 2, c, c);
            x.globalAlpha = a; x.strokeStyle = '#ff2a6d'; x.lineWidth = Math.max(2.5, c * 0.17); x.shadowColor = '#ff2a6d'; x.shadowBlur = c * 0.6;
            x.beginPath(); x.moveTo(px - r, py - r); x.lineTo(px + r, py + r); x.moveTo(px + r, py - r); x.lineTo(px - r, py + r); x.stroke(); x.shadowBlur = 0; x.globalAlpha = 1; }
    }
    function drawSnakeHi(x, c, t, f) {
        let C = skin(), n = S.snake.length, phasing = performance.now() < S.phaseUntil;
        const colAt = i => { if (phasing) return 'hsl(' + Math.round((t / 4 + i * 24) % 360) + ',100%,62%)';
            if (C.look === 'chrome') { let v = Math.sin(i * 0.9 - t / 140) * 0.5 + 0.5; return mixHex('#3c3f48', '#ffffff', v); }
            if (C.look === 'gold') { let band = (t / 90) % (n + 8) - 4, g = Math.max(0, 1 - Math.abs(i - band) / 2.2); return mixHex(mixHex(C.a, C.b, i / Math.max(1, n - 1) * 0.5), '#fffbe0', g * 0.8); }
            return mixHex(C.a, C.b, i / Math.max(1, n - 1) * 0.6); };
        let pts = S.snake.map((p, i) => { let q = S.prev[i] || p, jump = Math.abs(q.x - p.x) > 1 || Math.abs(q.y - p.y) > 1; return jump ? { x: (p.x + 0.5) * c, y: (p.y + 0.5) * c, cut: true } : { x: (lerp(q.x, p.x, f) + 0.5) * c, y: (lerp(q.y, p.y, f) + 0.5) * c }; });
        const wid = i => c * (0.8 - 0.38 * i / Math.max(1, n - 1));
        x.lineCap = 'round'; x.lineJoin = 'round';
        for (let pass = 0; pass < 2; pass++) {
            for (let i = n - 1; i > 0; i--) { let a = pts[i], b = pts[i - 1]; if (a.cut || b.cut || Math.hypot(a.x - b.x, a.y - b.y) > c * 1.5) continue;
                let col = colAt(i);
                x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.strokeStyle = col;
                if (pass === 0) { x.globalAlpha = 0.22; x.lineWidth = wid(i) * 1.6; x.shadowColor = col; x.shadowBlur = c * 0.45; }
                else { x.globalAlpha = 1; x.lineWidth = wid(i); x.shadowBlur = 0; }
                x.stroke(); }
        }
        x.globalAlpha = 1; x.shadowBlur = 0;
        let h = pts[0], dir = { right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1] }[S.dir] || [1, 0], hc = colAt(0), r = c * 0.56;
        x.fillStyle = hc; x.shadowColor = hc; x.shadowBlur = c * 0.4; x.beginPath(); x.arc(h.x, h.y, r, 0, 6.283); x.fill(); x.shadowBlur = 0;
        x.strokeStyle = mixHex(hc, '#000000', 0.45); x.lineWidth = Math.max(1, c * 0.06); x.stroke();
        x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.arc(h.x - r * 0.3, h.y - r * 0.35, r * 0.35, 0, 6.283); x.fill();
        let near = S.food.some(fd => Math.abs(fd.x - S.snake[0].x) + Math.abs(fd.y - S.snake[0].y) <= 3);
        if (near && Math.floor(t / 220) % 3 === 0) { let tx = h.x + dir[0] * r, ty = h.y + dir[1] * r, L = c * 0.45, px = -dir[1], py = dir[0];
            x.strokeStyle = '#ff2a6d'; x.lineWidth = Math.max(1.5, c * 0.07); x.beginPath(); x.moveTo(tx, ty); x.lineTo(tx + dir[0] * L, ty + dir[1] * L);
            x.lineTo(tx + dir[0] * L * 1.35 + px * L * 0.25, ty + dir[1] * L * 1.35 + py * L * 0.25); x.moveTo(tx + dir[0] * L, ty + dir[1] * L); x.lineTo(tx + dir[0] * L * 1.35 - px * L * 0.25, ty + dir[1] * L * 1.35 - py * L * 0.25); x.stroke(); }
        // it blinks!!! and gets scared eyes when its about to crash
        let blink = (t % 3400) < 120, wide = !!S.danger, px = -dir[1], py = dir[0];
        [1, -1].forEach(sd => { let ex = h.x + dir[0] * r * 0.25 + px * r * 0.42 * sd, ey = h.y + dir[1] * r * 0.25 + py * r * 0.42 * sd;
            if (blink && !wide) { x.strokeStyle = '#000'; x.lineWidth = 2; x.beginPath(); x.moveTo(ex - px * r * 0.2, ey - py * r * 0.2); x.lineTo(ex + px * r * 0.2, ey + py * r * 0.2); x.stroke(); return; }
            x.fillStyle = '#fff'; x.beginPath(); x.arc(ex, ey, r * (wide ? 0.3 : 0.24), 0, 6.283); x.fill();
            x.fillStyle = wide ? '#ff2a6d' : '#000'; x.beginPath(); x.arc(ex + dir[0] * r * 0.08, ey + dir[1] * r * 0.08, r * (wide ? 0.1 : 0.13), 0, 6.283); x.fill(); });
        if (S.mode.id === 'ouro' && n > 1) { let tl = S.snake[n - 1], dd = Math.abs(S.snake[0].x - tl.x) + Math.abs(S.snake[0].y - tl.y); if (dd <= 3 && Math.floor(t / 100) % 2) { x.strokeStyle = '#ffea00'; x.lineWidth = 2; x.strokeRect(tl.x * c - 2, tl.y * c - 2, c + 4, c + 4); } }
        if (C.look === 'gold' && Math.random() < 0.3) { let p = S.snake[Math.floor(Math.random() * n)]; spark(p.x + 0.5, p.y + 0.5, '#fff6c0'); }
        if (C.look === 'sakura' && Math.random() < 0.08) { let p = S.snake[n - 1]; S.parts.push({ x: (p.x + 0.5) * LC, y: (p.y + 0.5) * LC, vx: (Math.random() - 0.5) * 0.6, vy: 0.3 + Math.random() * 0.4, life: 1600, max: 1600, col: '#ffb7d5', size: 2 }); }
        if (C.look === 'toxic' && Math.random() < 0.12) { let p = S.snake[Math.floor(Math.random() * n)]; S.parts.push({ x: (p.x + 0.5) * LC, y: (p.y + 0.5) * LC, vx: (Math.random() - 0.5) * 0.3, vy: -0.4, life: 700, max: 700, col: '#b8ff9c', size: 1 }); }
    }
    function banner(x, W, c, t) {
        let now = performance.now(), msg = null, col = '#ff2a6d';
        if (now < S.reverseUntil) msg = '操作反転 // CONTROLS FLIPPED ' + ((S.reverseUntil - now) / 1000).toFixed(1);
        else if (S.hunter) msg = '追跡者 // HUNTER ON THE BOARD';
        else if (S.trace > 80 && S.state === 'playing') { msg = 'TRACE ' + Math.round(S.trace) + '% // 追っ手が来る'; col = '#ff8a3d'; }
        else if (S.mode.id === 'rush' && S.timeLeft < 10000 && S.state === 'playing') msg = '残り // ' + (S.timeLeft / 1000).toFixed(1) + 's';
        else if (S.banner && now < S.banner.until) { msg = S.banner.s; col = S.banner.col; }
        if (!msg || (S.state === 'playing' && Math.floor(t / 260) % 4 === 3 && col === '#ff2a6d')) return;
        let fs = Math.round(c * 0.5), y = W - c * 1.6; x.font = 'bold ' + fs + 'px "Courier New", monospace'; x.textAlign = 'center';
        let w = x.measureText(msg).width + c; x.fillStyle = 'rgba(0,0,0,0.65)'; x.fillRect(W / 2 - w / 2, y - fs, w, fs * 1.5);
        x.strokeStyle = col; x.lineWidth = 1.5; x.strokeRect(W / 2 - w / 2 + 0.5, y - fs + 0.5, w - 1, fs * 1.5 - 1);
        x.fillStyle = col; x.shadowColor = col; x.shadowBlur = 10; x.fillText(msg, W / 2, y + fs * 0.12); x.shadowBlur = 0; x.textAlign = 'left';
    }
    let gl = null, prog = null, tex = null, sc = null, uni = {};
    function glSetup(canvas) {
        try { gl = canvas.getContext('webgl', { premultipliedAlpha: false, antialias: false }); } catch (e) { gl = null; }
        if (!gl) return false;
        const sh = (type, src) => { let o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
        let vs = sh(gl.VERTEX_SHADER, 'attribute vec2 p; varying vec2 uv; void main(){ uv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5); gl_Position = vec4(p, 0.0, 1.0); }');
        let fs = sh(gl.FRAGMENT_SHADER, [
            'precision mediump float; uniform sampler2D tx; uniform vec2 res; uniform float time, danger, glitch, slow; varying vec2 uv;',
            'float h(float n){ return fract(sin(n) * 43758.5453); }',
            'void main(){',
            ' vec2 cc = uv - 0.5; float r2 = dot(cc, cc); vec2 p = 0.5 + cc * (1.0 + 0.05 * r2);',
            ' if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }',
            ' float band = step(0.9, h(floor(p.y * 48.0) + floor(time * 24.0))) * glitch; p.x += band * (h(time) - 0.5) * 0.06;',
            ' float ab = 0.0012 + 0.004 * danger + 0.012 * glitch;',
            ' vec3 col = vec3(texture2D(tx, p + vec2(ab, 0.0)).r, texture2D(tx, p).g, texture2D(tx, p - vec2(ab, 0.0)).b);',
            ' vec3 b = vec3(0.0); vec2 px = 1.0 / res;',
            ' for (int i = 0; i < 12; i++) { float a = float(i) * 0.5236; vec2 o = vec2(cos(a), sin(a));',
            '  b += max(texture2D(tx, p + o * px * 5.0).rgb - 0.3, 0.0) * 0.6 + max(texture2D(tx, p + o * px * 13.0).rgb - 0.3, 0.0) * 0.4; }',
            ' col += b / 12.0 * 1.7;',
            ' col *= 0.9 + 0.1 * sin(p.y * res.y * 1.5708);',
            ' float v = smoothstep(0.82, 0.25, length(cc)); float pu = danger * (0.55 + 0.45 * sin(time * 9.0));',
            ' col = mix(col, col * vec3(1.0, 0.35, 0.4) + vec3(0.35, 0.0, 0.05) * pu, (1.0 - v) * danger);',
            ' col *= mix(0.6, 1.0, v); col = mix(col, col * vec3(0.6, 0.85, 1.35), slow * 0.5);',
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
        ['res', 'time', 'danger', 'glitch', 'slow'].forEach(k => uni[k] = gl.getUniformLocation(prog, k));
        sc = document.createElement('canvas');
        return true;
    }
    let dangerLv = 0;
    function post(t) {
        if (!gl || !sc) return;
        let want = (S.hunter ? 0.8 : 0) + (S.danger ? 0.45 : 0) + (performance.now() < S.reverseUntil ? 0.6 : 0) + (S.trace > 80 ? 0.3 : 0) + (S.mode.id === 'rush' && S.timeLeft < 10000 && S.state === 'playing' ? 0.4 : 0);
        dangerLv += (Math.min(1, want) - dangerLv) * 0.08;
        S.glitch = Math.max(0, (S.glitch || 0) - 0.03);
        gl.viewport(0, 0, cv.width, cv.height);
        gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sc);
        gl.uniform2f(uni.res, cv.width, cv.height); gl.uniform1f(uni.time, t / 1000); gl.uniform1f(uni.danger, dangerLv); gl.uniform1f(uni.glitch, S.glitch); gl.uniform1f(uni.slow, S.slowing ? 1 : 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    function arenaLive(x, t, dt) {
        let a = ar().id;
        if (a === 'rain') { x.fillStyle = 'rgba(160,255,120,0.3)'; for (let i = 0; i < 50; i++) { let rx = Math.floor((i * 97.13 + t * 0.02 * (1 + i % 3)) % LW), ry = Math.floor((i * 53.7 + t * 0.25 * (1 + i % 4 * 0.3)) % LW); x.fillRect(rx, ry, 1, 3); } }
        else if (a === 'sump') { x.fillStyle = 'rgba(120,255,160,0.45)'; for (let i = 0; i < 10; i++) { let dx = Math.floor((i * 131.7) % LW), dy = Math.floor((t * 0.03 + i * 61) % (LW + 20)) - 10; x.fillRect(dx, dy, 1, 2); } }
        else if (a === 'lace') { let fl = 0.5 + 0.5 * Math.sin(t / 90) * Math.sin(t / 37); x.fillStyle = 'rgba(255,190,120,' + (0.02 + 0.025 * fl).toFixed(3) + ')'; x.fillRect(0, 0, LW, LW); }
        else if (a === 'void') { x.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 24; i++) { let sx = Math.floor((i * 89.3 + t * 0.004 * (i % 5)) % LW), sy = Math.floor((i * 41.9) % LW); x.fillRect(sx, sy, 1, 1); } }
        else { x.fillStyle = skin().a; x.globalAlpha = 0.14; x.fillRect(0, Math.floor((t * 0.02) % LW), LW, 1); x.globalAlpha = 1; }
    }
    function spawnHunter() { let c = free(), hd = S.snake[0]; for (let k = 0; k < 20 && Math.abs(c.x - hd.x) + Math.abs(c.y - hd.y) < 8; k++) c = free(); S.hunter = { x: c.x, y: c.y, until: performance.now() + 12000 }; snd('trace'); say('>>> TRACE COMPLETE :: a hunter is on the board <<<', 'alert'); text(c.x, c.y, 'トレース完了', '#ff2a6d'); }

    os.snakeAudio = function (type, level) { snd(type, level); };
    function snd(type, level) {
        if (D.muted || (S && S.demo && type !== 'menu')) return;
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext; if (!window.audioCtx) window.audioCtx = new AudioContext();
            let A = window.audioCtx, now = A.currentTime; if (A.state === 'suspended') A.resume();
            const tone = (f1, f2, wave, dur, vol, dl) => { dl = dl || 0; let o = A.createOscillator(), g = A.createGain(); o.type = wave; o.frequency.setValueAtTime(f1, now + dl); o.frequency.exponentialRampToValueAtTime(f2, now + dl + dur); g.gain.setValueAtTime(vol, now + dl); g.gain.exponentialRampToValueAtTime(0.001, now + dl + dur); o.connect(g); g.connect(os.gg && os.gg.out ? os.gg.out(A) : A.destination); o.start(now + dl); o.stop(now + dl + dur + 0.02); };
            // eating plays notes going up a scale. long combo = little song
            const SC = [0, 3, 5, 7, 10, 12, 15, 17, 19];
            if (type === 'eat') { let f = 440 * Math.pow(2, SC[Math.min(8, level || 0)] / 12); tone(f, f * 2, 'square', 0.08, 0.045); tone(f * 1.5, f * 3, 'triangle', 0.06, 0.02, 0.02); }
            else if (type === 'bonus') { [520, 780, 1040].forEach((f, i) => tone(f, f * 2, 'triangle', 0.08, 0.05, i * 0.07)); }
            else if (type === 'hazard') { tone(180, 90, 'sawtooth', 0.3, 0.05); tone(174, 87, 'sawtooth', 0.3, 0.04, 0.02); }
            else if (type === 'phase') { tone(300, 1400, 'sine', 0.22, 0.04); tone(450, 2100, 'sine', 0.2, 0.03, 0.05); }
            else if (type === 'purge') tone(1400, 260, 'sawtooth', 0.22, 0.05);
            else if (type === 'trace') { [0, 0.12, 0.24].forEach(d => tone(900, 900, 'square', 0.07, 0.045, d)); }
            else if (type === 'milestone') { [523, 659, 784, 1046].forEach((f, i) => tone(f, f, 'triangle', i === 3 ? 0.22 : 0.09, 0.05, i * 0.09)); }
            else if (type === 'record') { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, f, 'triangle', i === 4 ? 0.3 : 0.08, 0.05, i * 0.08)); }
            else if (type === 'boot') { [440, 660, 880].forEach((f, i) => tone(f, f, 'square', 0.06, 0.04, i * 0.07)); }
            else if (type === 'pause') tone(500, 300, 'sine', 0.08, 0.03);
            else if (type === 'menu') { tone(990, 990, 'square', 0.03, 0.03); tone(1480, 1480, 'square', 0.04, 0.025, 0.03); }
            else tone(220, 40, 'sawtooth', 0.35, 0.06);
        } catch (e) {}
    }

    let slowBtn = false;
    function say(s, cls) { if (!S || (cls !== 'good' && cls !== 'alert')) return; S.banner = { s: String(s).replace(/^>+\s*/, '').replace(/\s*<+$/, ''), col: cls === 'good' ? '#ffea00' : '#ff2a6d', until: performance.now() + 2200 }; }
    let fillT = null; function filler() { clearTimeout(fillT); if (!alive()) return; let el = document.getElementById('snake-ip-text'); if (el) el.textContent = ip(); fillT = setTimeout(filler, 2500 + Math.random() * 3000); }
    function hud() {
        if (!S) return; const $ = id => document.getElementById(id);
        let b = $('snake-firewall-bar'); if (b) { b.style.width = S.firewall + '%'; b.style.background = S.firewall < 25 ? '#ff2a6d' : ''; }
        let set = (id, v) => { let e = $(id); if (e) e.textContent = v; };
        set('snake-firewall-pct', Math.round(S.firewall) + '%'); let tb = $('snake-trace-bar'); if (tb) tb.style.width = S.trace + '%'; set('snake-trace-pct', S.hunter ? 'HUNTED' : Math.round(S.trace) + '%');
        set('snake-threat-text', S.tick < 80 ? 'CRITICAL' : S.tick < 105 ? 'ELEVATED' : 'LOW'); set('snake-nodes-text', S.eaten); let s = Math.floor(S.up / 1000); set('snake-uptime-text', String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'));
        set('snake-score-text', S.mode.jp + ' ' + S.mode.en + '  //  SCORE ' + S.score + '  //  最高 ' + (D.best[S.mode.id] || 0));
        set('snake-mode-text', S.mode.en);
        set('snake-best-text', String(Math.max(0, ...Object.values(D.best).map(Number).filter(isFinite))));
    }
    // attract mode like the old cabinets. a lil guy plays while you pick
    function attract(again) {
        if (!again && S && S.demo && S.mode.id === D.mode && S.state === 'playing') return;
        clearTimeout(loopT); newRun(D.mode); S.demo = true; S.state = 'playing'; S.at = performance.now(); S.log = []; hud(); schedule();
    }
    // grabs the closest food. if hes boxed in he just runs for room
    function brain() {
        let hd = S.snake[0], wrap = S.mode.id === 'zen', back = turn[S.dir], hit = new Uint8Array(G * G);
        S.snake.slice(0, -1).forEach(p => { hit[p.y * G + p.x] = 1; }); if (S.hunter) hit[S.hunter.y * G + S.hunter.x] = 1;
        const mv = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
        const at = (x, y) => { if (wrap) { x = (x + G) % G; y = (y + G) % G; } if (x < 0 || y < 0 || x >= G || y >= G || wallAt(x, y) || hit[y * G + x]) return -1; return y * G + x; };
        const room = c0 => { let seen = new Uint8Array(G * G), q = [c0], n = 0; seen[c0] = 1; while (q.length && n < 200) { let c = q.pop(); n++; for (const d in mv) { let k = at(c % G + mv[d][0], (c / G | 0) + mv[d][1]); if (k >= 0 && !seen[k]) { seen[k] = 1; q.push(k); } } } return n; };
        let food = new Set(S.food.filter(f => f.type !== 'bug').map(f => f.y * G + f.x)), opts = [];
        for (const d in mv) { if (d === back) continue; let c = at(hd.x + mv[d][0], hd.y + mv[d][1]); if (c >= 0) opts.push({ d, c, room: room(c) }); }
        if (!opts.length) return;
        let best = null, seen = new Map(), q = [];
        opts.forEach(o => { if (o.room > S.snake.length) { seen.set(o.c, o.d); q.push(o.c); } });
        while (q.length) { let c = q.shift(); if (food.has(c)) { best = seen.get(c); break; } for (const d in mv) { let k = at(c % G + mv[d][0], (c / G | 0) + mv[d][1]); if (k >= 0 && !seen.has(k)) { seen.set(k, seen.get(c)); q.push(k); } } }
        if (!best || Math.random() < 0.04) best = opts.sort((a, b) => b.room - a.room)[0].d;
        S.want = [best];
    }
    function flipMode(dir) { let ms = ownedModes(), i = Math.max(0, ms.findIndex(m => m.id === D.mode)); D.mode = ms[(i + dir + ms.length) % ms.length].id; saveD(); snd('menu'); showOverlay('menu'); }
    function play() { clearTimeout(loopT); newRun(D.mode); showOverlay('ready'); hud(); }
    const FONT5 = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101110100110101', L: '100100100100111', M: '101111111101101', N: '111101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110', '4': '101101111001001', '5': '111100110001110', '6': '011100110101010', '7': '111001010010010', '8': '010101010101010', '9': '010101011001110', ' ': '000000000000000', '-': '000000111000000' };
    // drawn tiny then blown up so theyre real pixels
    function logo() {
        let g = (typeof appsDB !== 'undefined' && (appsDB.games || []).find(q => q.id === 'snake')) || { jp: 'スネーク', name: 'SNAKE' }, k = skin();
        let W = 150, H = 42, c = document.createElement('canvas'); c.width = W; c.height = H; c.className = 'sx-logo';
        let q = c.getContext('2d'), m = document.createElement('canvas'); m.width = W; m.height = H; let mq = m.getContext('2d');
        mq.textAlign = 'center'; mq.textBaseline = 'middle'; mq.fillStyle = '#fff';
        mq.font = "28px 'DotGothic16', monospace"; mq.fillText(g.jp, W / 2, 16);
        let d = mq.getImageData(0, 0, W, H); for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 100 ? 255 : 0; mq.putImageData(d, 0, 0);
        // the english is too small for the font, so its done in blocks by hand
        let en = g.name.toUpperCase(), ex = Math.round(W / 2 - en.length * 3);
        [...en].forEach((ch, n) => { let gl = FONT5[ch] || ''; for (let k2 = 0; k2 < 15; k2++) if (gl[k2] === '1') mq.fillRect(ex + n * 6 + (k2 % 3) * 1, 33 + Math.floor(k2 / 3), 1, 1); });
        const tint = (col, y0, y1) => { let t = document.createElement('canvas'); t.width = W; t.height = H; let tq = t.getContext('2d'); tq.drawImage(m, 0, 0); tq.globalCompositeOperation = 'source-in'; let gr = tq.createLinearGradient(0, y0, 0, y1); col.forEach((s_, i) => gr.addColorStop(i / (col.length - 1), s_)); tq.fillStyle = gr; tq.fillRect(0, 0, W, H); return t; };
        let dark = tint(['#000000', '#000000'], 0, H), body = tint([mix(k.a, '#ffffff', 0.55), k.a, mix(k.a, '#000000', 0.25)], 2, 30), shade = tint([k.b, k.b], 0, H);
        [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1]].forEach(([dx, dy]) => q.drawImage(dark, dx, dy));
        q.drawImage(shade, 2, 2); q.drawImage(dark, 1, 1); q.drawImage(body, 0, 0);
        return c;
    }
    function showOverlay(kind) {
        let ov = document.getElementById('snake-ov'); if (!ov) return; ov.hidden = false; ov.innerHTML = ''; mark(kind);
        const el = (t, c, s) => { let e = document.createElement(t); if (c) e.className = c; if (s != null) e.textContent = s; return e; };
        if (kind === 'dead') {
            let card = el('div', 'sx-card');
            card.appendChild(el('div', 'sx-big', S.why === 'win' ? 'ALL FIREWALLS DOWN' : 'CONNECTION LOST'));
            card.appendChild(el('div', 'sx-score', String(S.score)));
            card.appendChild(el('div', 'sx-sub', (S.rec ? '新記録 // a new best for ' : 'best for ') + S.mode.en + ': ' + (D.best[S.mode.id] || 0)));
            let top = D.top[S.mode.id] || [];
            if (top.length) { let tb = el('div', 'sx-top'); tb.appendChild(el('div', 'sx-h', 'TOP 10 // ' + S.mode.en + (S.place ? ' // you placed #' + S.place : '')));
                top.forEach((e, i) => { let r = el('div', 'sx-tr' + (S.place === i + 1 ? ' me' : '')); r.appendChild(el('span', '', '#' + (i + 1))); r.appendChild(el('b', '', String(e.s))); r.appendChild(el('small', '', e.d)); tb.appendChild(r); });
                card.appendChild(tb); }
            let r = el('div', 'sx-row'); let again = el('button', 'sx-btn hot', '↻ AGAIN  [R]'); again.onclick = () => { newRun(S.mode.id); showOverlay('ready'); }; r.appendChild(again);
            let menu = el('button', 'sx-btn', '☰ MODES'); menu.onclick = () => showOverlay('menu'); r.appendChild(menu); card.appendChild(r); ov.appendChild(card); return;
        }
        if (kind === 'ready') { let card = el('div', 'sx-card sx-mini'); card.appendChild(el('div', 'sx-big', S.mode.jp + ' ' + S.mode.en)); card.appendChild(el('div', 'sx-sub', S.mode.sub)); card.appendChild(el('div', 'sx-hint', touchy() ? 'swipe or tap to go' : 'arrows, WASD or swipe to go' + (S.perks.indexOf('slow') >= 0 ? '. hold SHIFT to slow down' : '') + '. SPACE pauses, M for sound')); let m = el('button', 'sx-btn', '☰ MODES'); m.onclick = e => { e.stopPropagation(); showOverlay('menu'); }; card.appendChild(m); ov.appendChild(card); return; }
        if (kind === 'loadout') {
            let card = el('div', 'sx-card sx-menu');
            card.appendChild(el('div', 'sx-big', '装備 // LOADOUT'));
            let perks = ownedPerks();
            if (perks.length) { card.appendChild(el('div', 'sx-h', 'PERKS  (' + (D.perks || []).filter(id => perks.some(p => p.id === id)).length + ' / ' + slots() + ')')); let pg = el('div', 'sx-row wrap'); perks.forEach(p => { let on = (D.perks || []).indexOf(p.id) >= 0, b = el('button', 'sx-chip' + (on ? ' on' : ''), p.jp + ' ' + p.en); b.title = p.sub; b.onclick = () => { D.perks = (D.perks || []).filter(id => perks.some(q => q.id === id)); if (on) D.perks = D.perks.filter(x => x !== p.id); else if (D.perks.length < slots()) D.perks.push(p.id); saveD(); snd('menu'); showOverlay('loadout'); }; pg.appendChild(b); }); card.appendChild(pg); }
            let ars = ownedArenas();
            if (ars.length > 1) { card.appendChild(el('div', 'sx-h', 'ARENA')); let ag = el('div', 'sx-row wrap'); ars.forEach(a => { let b = el('button', 'sx-chip' + (D.arena === a.id ? ' on' : ''), a.jp + ' ' + a.en); b.onclick = () => { D.arena = a.id; saveD(); bg = null; snd('menu'); showOverlay('loadout'); }; ag.appendChild(b); }); card.appendChild(ag); }
            let skins = [{ id: '', name: { jp: 'テーマ', en: 'THEME' } }].concat((typeof appsDB !== 'undefined' && appsDB.parts || []).filter(p => p.kind === 'snake'));
            card.appendChild(el('div', 'sx-h', 'SKIN')); let kg = el('div', 'sx-row wrap');
            skins.forEach(k => { let nm = k.name || {}, lab = String(nm.en || nm.jp || k.id).replace(/^[^:：]*[:：]\s*/, ''), b = el('button', 'sx-chip' + ((D.skin || '') === k.id ? ' on' : ''), lab); if (k.a) b.style.borderColor = k.a; b.onclick = () => { D.skin = k.id; saveD(); colC = null; bg = null; snd('menu'); showOverlay('loadout'); }; kg.appendChild(b); });
            card.appendChild(kg);
            let bk = el('button', 'sx-btn hot sx-go', '◀ 戻る // BACK'); bk.onclick = () => { snd('menu'); showOverlay('menu'); }; card.appendChild(bk);
            ov.appendChild(card); return;
        }
        attract();
        let ms = ownedModes(), cur = ms.find(m => m.id === D.mode) || ms[0], mi = ms.indexOf(cur), box = el('div', 'sx-arcade');
        box.appendChild(logo());
        // which map the demo is on. flip it right here if you own more than one
        let ars = ownedArenas().length ? ownedArenas() : [ARENAS[0]], a0 = ar(), stg = el('div', 'sx-stage');
        const flipArena = d => { let i = ars.findIndex(a => a.id === a0.id); D.arena = ars[(i + d + ars.length) % ars.length].id; saveD(); snd('menu'); showOverlay('menu'); };
        if (ars.length > 1) { let l = el('button', 'sx-sa', '◀'); l.onclick = () => flipArena(-1); stg.appendChild(l); }
        let tag = el('span', 'sx-st'); tag.appendChild(el('small', '', '舞台 // ARENA')); tag.appendChild(el('b', '', a0.jp + ' ' + a0.en)); stg.appendChild(tag);
        if (ars.length > 1) { let rr = el('button', 'sx-sa', '▶'); rr.onclick = () => flipArena(1); stg.appendChild(rr); }
        box.appendChild(stg);
        let car = el('div', 'sx-car'), prev = el('button', 'sx-arrow', '◀'), next = el('button', 'sx-arrow', '▶'), face = el('div', 'sx-face');
        face.appendChild(el('b', 'sx-kanji', cur.jp));
        let ft = el('div', 'sx-ft'); ft.appendChild(el('span', 'sx-en', cur.en)); ft.appendChild(el('small', '', cur.sub)); ft.appendChild(el('em', '', 'BEST ' + (D.best[cur.id] || 0))); face.appendChild(ft);
        prev.onclick = () => flipMode(-1); next.onclick = () => flipMode(1);
        car.append(prev, face, next); box.appendChild(car);
        let dots = el('div', 'sx-dots'); ms.forEach((m, i) => { let dd = el('i', i === mi ? 'on' : ''); dd.onclick = () => { D.mode = m.id; saveD(); snd('menu'); showOverlay('menu'); }; dots.appendChild(dd); }); box.appendChild(dots);
        let row = el('div', 'sx-acts'), lo = el('button', 'sx-btn', '装備 // LOADOUT'), go = el('button', 'sx-btn hot sx-go', touchy() ? 'TAP TO START' : 'PRESS START');
        lo.onclick = () => { snd('menu'); showOverlay('loadout'); }; go.onclick = play;
        row.append(lo, go); box.appendChild(row);
        ov.appendChild(box);
    }
    function hideOverlay() { let ov = document.getElementById('snake-ov'); if (ov) ov.hidden = true; mark('play'); }
    function mark(k) { let st = root && root.querySelector('.snake-stage'); if (st && st.dataset.k !== k) { st.dataset.k = k; if (cv) fit(); } }
    function togglePause() { if (!S) return; if (S.state === 'playing') { S.state = 'paused'; clearTimeout(loopT); snd('pause'); say('> paused', 'info'); let ov = document.getElementById('snake-ov'); if (ov) { ov.hidden = false; mark('paused'); ov.innerHTML = '<div class="sx-card sx-mini"><div class="sx-big">⏸ PAUSED</div><div class="sx-hint">' + (touchy() ? 'tap / swipe to carry on' : 'SPACE to carry on') + '</div></div>'; } } else if (S.state === 'paused') { S.state = 'playing'; hideOverlay(); S.at = performance.now(); schedule(); } btnText(); }
    function toggleMute() { D.muted = !D.muted; saveD(); try { localStorage.setItem('vampiiSnakeMuted', D.muted ? '1' : '0'); } catch (e) {} btnText(); }
    function btnText() { let m = document.getElementById('snake-mute-btn'), p = document.getElementById('snake-pause-btn'); if (m) m.textContent = D.muted ? '🔇 MUTED' : '🔊 SOUND'; if (p) p.textContent = S && S.state === 'paused' ? '▶ RESUME' : '⏸ PAUSE'; }
    function fit() {
        // fit the tablet screen both ways, not just across
        let wrap = cv.closest('.snake-stage') || cv.parentNode, dp = document.getElementById('snake-dpad'), dh = dp && dp.offsetParent ? dp.offsetHeight + 14 : 0, room = wrap.clientHeight ? wrap.clientHeight - dh - 4 : 9999, w = Math.max(160, Math.min(wrap.clientWidth - 4, 720, room)), dpr = Math.min(3, window.devicePixelRatio || 1), k = Math.max(1, Math.ceil(w * dpr / LW - 0.08)), px = Math.floor(w);
        if (sc && sc.width !== cv.width) { sc.width = sc.height = cv.width; }
        if (cv._css !== px || cv.width !== k * LW) { cv._css = px; cv.style.width = px + 'px'; cv.style.maxWidth = '100%'; cv.style.height = 'auto'; cv.style.aspectRatio = '1 / 1'; cv.style.setProperty('image-rendering', 'pixelated'); cv.width = cv.height = k * LW; if (sc) sc.width = sc.height = cv.width; }
    }
    function handleKey(e) {
        if (!alive() || !S || asleep) return;
        if (/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
        // only when the games window is the one ur actually using
        if (!root.closest('.is-active')) return;
        let k = e.key, map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
        if (k === 'Shift') { keys.Shift = e.type === 'keydown'; return; }
        if (e.type !== 'keydown') return;
        if (S.demo) {
            if (showing() !== 'menu') { if (k === 'l' || k === 'L' || k === 'Enter') { e.preventDefault(); showOverlay('menu'); } return; }
            if (map[k] === 'left' || map[k] === 'right') { e.preventDefault(); flipMode(map[k] === 'left' ? -1 : 1); }
            else if (k === 'Enter' || k === ' ') { e.preventDefault(); play(); }
            else if (k === 'l' || k === 'L') showOverlay('loadout');
            else if (k === 'm' || k === 'M') toggleMute();
            return;
        }
        if (map[k]) { e.preventDefault(); if (S.state === 'dead') return; setDir(map[k]); flash(map[k]); }
        else if (k === ' ') { e.preventDefault(); togglePause(); }
        else if (k === 'm' || k === 'M') toggleMute();
        else if ((k === 'r' || k === 'R') && S.state === 'dead') { newRun(S.mode.id); showOverlay('ready'); }
    }
    function flash(d) { let b = document.querySelector('.snake-dpad-btn[data-dir="' + d + '"]'); if (!b) return; b.classList.add('lit'); clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('lit'), 120); }
    const touchy = () => (root && root.querySelector('.snake-rig.touchy')) || matchMedia('(any-pointer: coarse)').matches;
    const showing = () => { let st = root && root.querySelector('.snake-stage'); return (st && st.dataset.k) || ''; };
    function beTouchy() { let r = root && root.querySelector('.snake-rig'); if (r && !r.classList.contains('touchy')) { r.classList.add('touchy'); if (cv) fit(); } }
    function init() {
        cv = document.getElementById('snake-canvas'); if (!cv) return;
        gl = null; sc = null;
        cx = glSetup(cv) ? sc.getContext('2d') : cv.getContext('2d');
        loadD();
        newRun(D.mode); fit(); hud(); btnText(); showOverlay('menu');
        filler();
        // the card was sitting on the d-pad on ipad so nothing started. lol
        let board = root.querySelector('.snake-board'), sw = null;
        board.addEventListener('pointerdown', e => {
            if (e.pointerType !== 'mouse') beTouchy();
            if (!S || e.button > 0 || e.target.closest('button') || /menu|dead|loadout/.test(showing()) || S.state === 'dead') return;
            if (e.target.closest('.sx-menu')) return;
            e.preventDefault(); sw = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: performance.now(), moved: false };
            try { board.setPointerCapture(e.pointerId); } catch (er) {}
        });
        board.addEventListener('pointermove', e => {
            if (!sw || e.pointerId !== sw.id || !S) return;
            let dx = e.clientX - sw.x, dy = e.clientY - sw.y, th = e.pointerType === 'mouse' ? 26 : 18;
            if (Math.max(Math.abs(dx), Math.abs(dy)) < th) return;
            // turn while you're still dragging, waiting for let go felt laggy as hell
            let d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
            if (S.state === 'paused') togglePause();
            setDir(d); flash(d); sw.x = e.clientX; sw.y = e.clientY; sw.moved = true;
        });
        let swEnd = e => {
            if (!sw || e.pointerId !== sw.id) return; let was = sw; sw = null;
            if (e.type !== 'pointerup' || was.moved || !S) return;
            if (Math.hypot(e.clientX - was.x0, e.clientY - was.y0) > 12) return;
            if (S.state === 'ready') start(); else if (S.state === 'paused') togglePause();
        };
        board.addEventListener('pointerup', swEnd); board.addEventListener('pointercancel', swEnd);
        board.addEventListener('contextmenu', e => e.preventDefault());
        root.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') beTouchy(); }, { capture: true });
        if (touchy()) beTouchy();
        document.querySelectorAll('.snake-dpad-btn').forEach(b => { let go = e => { e.preventDefault(); if (b.dataset.dir === 'slow') { slowBtn = e.type !== 'pointerup' && e.type !== 'pointerleave' && e.type !== 'pointercancel'; return; } if (!S || S.state === 'dead' || /menu|dead/.test(showing())) return; if (S.state === 'paused') togglePause(); setDir(b.dataset.dir); flash(b.dataset.dir); }; b.addEventListener('pointerdown', go); if (b.dataset.dir === 'slow') { b.addEventListener('pointerup', go); b.addEventListener('pointerleave', go); b.addEventListener('pointercancel', go); } });
        let mb = document.getElementById('snake-mute-btn'); if (mb) mb.onclick = toggleMute; let pb = document.getElementById('snake-pause-btn'); if (pb) pb.onclick = togglePause;
        cancelAnimationFrame(raf); last = 0; raf = requestAnimationFrame(frame);
    }
    function stopAll() { clearTimeout(loopT); clearTimeout(fillT); cancelAnimationFrame(raf); raf = null; }
    // the games app tells me when to start / stop. I dont own a window anymore, I live in the tablet
    os.gg = os.gg || {}; os.gg.hooks = os.gg.hooks || {};
    // the help box shows one tip at a time. tap it to skip
    let tipT = 0;
    function tips() {
        let h = root && root.querySelector('.snake-help'); if (!h) return;
        let ps = [...h.querySelectorAll('.sh-tip')], bar = h.querySelector('.sh-bar'), n = h.querySelector('.sh-n'), k = -1;
        const go = () => { k = (k + 1) % ps.length; ps.forEach((p, i) => p.classList.toggle('on', i === k)); n.textContent = (k + 1) + '/' + ps.length; bar.classList.remove('run'); void bar.offsetWidth; bar.classList.add('run'); };
        h.onclick = () => { go(); clearInterval(tipT); tipT = setInterval(() => { if (!asleep) go(); }, 4200); };
        go(); clearInterval(tipT); tipT = setInterval(() => { if (!asleep) go(); }, 4200);
    }
    os.gg.hooks.snake = {
        start(el) {
            root = el; asleep = false;
            style = styles();
            el.innerHTML = markup();
            document.addEventListener('keydown', handleKey); document.addEventListener('keyup', handleKey);
            init(); tips();
        },
        pause() { asleep = true; if (S && S.state === 'playing' && !S.demo) togglePause(); stopAll(); },
        resume() { if (!alive() || !asleep) return; asleep = false; cancelAnimationFrame(raf); last = 0; raf = requestAnimationFrame(frame); filler(); if (S && S.demo && S.state === 'playing') schedule(); },
        best() { loadD(); return Math.max(0, ...Object.values(D.best || {}).map(Number).filter(n => n > 0)); },
        scores() { loadD(); return MODES.map(m => ({ t: m.jp + ' ' + m.en, rows: (D.top[m.id] || []).map((e, i) => [i + 1, e.s, e.d || '']) })).filter(b => b.rows.length); },
        stop() {
            stopAll(); clearInterval(tipT);
            document.removeEventListener('keydown', handleKey); document.removeEventListener('keyup', handleKey);
            if (gl) { let lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext(); }
            if (style) style.remove();
            if (root) root.innerHTML = '';
            S = null; cv = null; cx = null; gl = null; sc = null; root = null; style = null;
            delete os.snake; delete os.snakeAudio; delete os.gg.hooks.snake;
        }
    };
    // testing, dont touch
    os.snake = { raw: () => S, state: () => S && { mode: S.mode.id, state: S.state, score: S.score, len: S.snake.length, food: S.food.map(f => f.type), perks: S.perks, level: S.level, hunter: !!S.hunter, walls: S.walls.reduce((a, b) => a + b, 0) }, modes: () => ownedModes().map(m => m.id), perks: () => ownedPerks().map(p => p.id), arenas: () => ownedArenas().map(a => a.id), play: m => { D.mode = m; newRun(m); hideOverlay(); start(); }, dir: setDir, die: w => die(w || 'wall'), data: () => D, step: () => step(), set: fn => fn(S, D) };

    function styles() {
        let st = document.createElement('style');
        st.textContent = `
            #snake-canvas { display: block; touch-action: none; border-radius: 6px; box-shadow: 0 0 0 1px var(--neon-primary), 0 0 22px var(--neon-glow), inset 0 0 40px #000; }
            .snake-rig { display: flex; gap: 12px; align-items: stretch; justify-content: center; flex-wrap: wrap; }
            .snake-panel { flex: 1 1 170px; max-width: 240px; min-width: 150px; background: linear-gradient(180deg, rgba(20,6,18,0.9), rgba(4,1,4,0.9)); border: 1px solid color-mix(in srgb, var(--neon-primary) 45%, transparent); border-radius: 8px; box-shadow: inset 0 0 18px rgba(0,0,0,0.7); padding: 10px; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden; }
            .snake-panel-header { font-size: 10px; color: var(--neon-primary); font-weight: bold; letter-spacing: 2px; border-bottom: 1px dashed color-mix(in srgb, var(--neon-primary) 50%, transparent); padding-bottom: 6px; margin-bottom: 8px; flex-shrink: 0; }
            .snake-log-line { font-size: 9.5px; line-height: 1.35; color: var(--text-main); opacity: 0.65; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'Courier New', monospace; }
            .snake-log-line.log-info { color: var(--neon-secondary); opacity: 0.9; } .snake-log-line.log-good { color: #ffea00; opacity: 0.95; } .snake-log-line.log-alert { color: #ff2a6d; opacity: 1; font-weight: bold; }
            .snake-stat-row { margin-bottom: 9px; } .snake-stat-label { font-size: 9.5px; color: var(--neon-secondary); letter-spacing: 1px; margin-bottom: 3px; display: flex; justify-content: space-between; }
            .snake-stat-bar-bg { height: 6px; background: rgba(255,255,255,0.07); border-radius: 3px; overflow: hidden; } .snake-stat-bar { height: 100%; background: var(--neon-secondary); transition: width 0.15s linear; }
            #snake-trace-bar { background: linear-gradient(90deg, #ff2a6d, #ff8a3d); box-shadow: 0 0 6px #ff2a6d; }
            .snake-stat-text { font-size: 12px; color: var(--text-main); font-weight: bold; }
            .snake-ip-row { margin-top: auto; padding-top: 8px; border-top: 1px dashed color-mix(in srgb, var(--neon-primary) 50%, transparent); font-size: 9.5px; color: var(--neon-secondary); }
            .snake-stage { position: relative; flex: 0 1 640px; min-width: 260px; display: flex; flex-direction: column; align-items: center; }
            .snake-board { position: relative; touch-action: none; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
            .snake-stage[data-k="menu"] .snake-board, .snake-stage[data-k="dead"] .snake-board { touch-action: pan-y; position: static; }
            .snake-stage[data-k="menu"] #snake-dpad, .snake-stage[data-k="dead"] #snake-dpad { visibility: hidden; }
            #snake-ov { position: absolute; inset: 0; display: grid; place-items: center; z-index: 3; background: radial-gradient(circle, rgba(0,0,0,0.35), rgba(0,0,0,0.75)); border-radius: 6px; }
                #snake-ov[hidden] { display: none; }
            .snake-stage[data-k="menu"] #snake-ov { background: linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.05) 32%, rgba(0,0,0,0.05) 58%, rgba(0,0,0,0.8)); place-items: stretch; }
            .sx-card { background: linear-gradient(180deg, rgba(24,6,22,0.96), rgba(6,1,6,0.96)); border: 1px solid var(--neon-primary); border-radius: 10px; padding: 16px 18px; max-width: 92%; box-shadow: 0 0 30px var(--neon-glow); text-align: center; font-family: 'Courier New', monospace; }
            .sx-menu { text-align: left; width: 440px; max-height: calc(100% - 16px); box-sizing: border-box; overflow: auto; touch-action: pan-y; -webkit-overflow-scrolling: touch; }
            .sx-big { font-size: 18px; font-weight: bold; color: #fff; letter-spacing: 3px; text-shadow: 0 0 10px var(--neon-primary); }
            .sx-score { font-size: 46px; font-weight: bold; color: #ffea00; text-shadow: 0 0 18px rgba(255,234,0,0.6); margin: 6px 0; }
            .sx-sub { font-size: 11px; color: var(--text-main); opacity: 0.85; margin: 6px 0; line-height: 1.5; } .sx-hint { font-size: 10px; color: var(--neon-secondary); opacity: 0.8; margin-top: 8px; }
            .sx-top { margin: 8px auto 0; max-width: 260px; text-align: left; } .sx-tr { display: grid; grid-template-columns: 34px 1fr auto; gap: 8px; font-size: 11px; padding: 2px 6px; border-radius: 4px; } .sx-tr b { color: #fff; } .sx-tr small { opacity: 0.5; } .sx-tr.me { background: color-mix(in srgb, var(--neon-primary) 30%, transparent); color: #ffea00; }
            .sx-h { font-size: 10px; letter-spacing: 3px; color: var(--neon-secondary); margin: 10px 0 6px; }
            .sx-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 6px; }
            .sx-mode { display: flex; flex-direction: column; align-items: flex-start; gap: 1px; padding: 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.03); color: var(--text-main); font: inherit; cursor: inherit; text-align: left; }
            .sx-mode b { font-size: 16px; color: var(--neon-primary); } .sx-mode span { font-size: 11px; font-weight: bold; letter-spacing: 1px; } .sx-mode small { font-size: 9px; opacity: 0.6; }
            .sx-mode.on, .sx-chip.on { border-color: var(--neon-primary); box-shadow: 0 0 12px var(--neon-glow), inset 0 0 12px color-mix(in srgb, var(--neon-primary) 25%, transparent); }
            .sx-row { display: flex; gap: 8px; justify-content: center; margin-top: 10px; } .sx-row.wrap { flex-wrap: wrap; justify-content: flex-start; margin-top: 0; }
            .sx-chip { font: 11px 'Courier New', monospace; padding: 5px 9px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.03); color: var(--text-main); cursor: inherit; }
            .sx-btn { font: bold 12px 'Courier New', monospace; padding: 7px 14px; border-radius: 6px; border: 1px solid var(--neon-secondary); background: transparent; color: var(--neon-secondary); cursor: inherit; letter-spacing: 1px; }
            .sx-btn.hot { background: var(--neon-primary); border-color: var(--neon-primary); color: #000; box-shadow: 0 0 14px var(--neon-glow); } .sx-go { display: block; width: 100%; margin-top: 14px; font-size: 14px; padding: 10px; }
            #snake-dpad { display: grid; grid-template-columns: repeat(4, 50px); grid-template-rows: repeat(2, 44px); gap: 6px; justify-content: center; margin-top: 12px; }
            .snake-dpad-btn { touch-action: none; -webkit-tap-highlight-color: transparent; background: rgba(255,255,255,0.03); border: 1px solid color-mix(in srgb, var(--neon-primary) 60%, transparent); border-radius: 8px; color: var(--neon-primary); font-size: 16px; font-family: inherit; font-weight: bold; cursor: inherit; transition: 0.12s; user-select: none; }
            .snake-dpad-btn:active, .snake-dpad-btn.lit { background: var(--neon-primary); color: #000; box-shadow: 0 0 14px var(--neon-primary); }
            .snake-hud-btn { background: transparent; border: 1px solid var(--neon-secondary); color: var(--neon-secondary); font-family: inherit; font-size: 11px; font-weight: bold; padding: 4px 9px; cursor: inherit; border-radius: 4px; }
            .snake-hud-btn:hover { background: var(--neon-secondary); color: #000; }
            @media (max-width: 760px) { .snake-panel { max-width: 100%; flex-basis: 100%; order: 3; } .snake-stage { order: 1; flex-basis: 100%; } #snake-stats-panel { order: 2; } .sx-menu { width: auto; } }
            .snake-rig { height: 100%; display: grid; grid-template-columns: minmax(0, 1fr) 236px; gap: 12px; }
            .snake-stage { flex: none; min-width: 0; min-height: 0; height: 100%; justify-content: center; }
            .snake-side { display: flex; flex-direction: column; gap: 8px; min-height: 0; overflow: hidden; }
            .snake-score { margin: 0 !important; padding: 10px 12px !important; font-size: 14px !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .snake-btns { display: flex; gap: 6px; } .snake-btns button { flex: 1; }
            .snake-side .snake-panel { flex: 1 1 auto; max-width: none; min-height: 0; }
            .snake-help { position: relative; margin: 0; min-height: 84px; padding: 7px 10px 10px; font-size: 11px !important; line-height: 1.45; color: var(--neon-secondary); border: 1px dashed color-mix(in srgb, var(--neon-secondary) 40%, transparent); background: rgba(0,0,0,0.35); cursor: pointer; overflow: hidden; }
            .sh-top { display: flex; justify-content: space-between; font-size: 9px; letter-spacing: 1px; opacity: 0.55; }
            .sh-n { font-style: normal; }
            .sh-tip { position: absolute; left: 10px; right: 10px; top: 24px; margin: 0; color: #d8f6ef; opacity: 0; transform: translateY(8px); }
            .sh-tip.on { opacity: 1; transform: none; transition: opacity 0.2s steps(3), transform 0.25s steps(4); }
            .sh-tip.on b { animation: shPop 0.4s steps(2) both; }
            .sh-tip b { font-weight: normal; } .sh-tip .cy { color: #3ad8ff; text-shadow: 0 0 6px #3ad8ff; } .sh-tip .go { color: #ffea00; text-shadow: 0 0 6px #ffea00; } .sh-tip .pu { color: #b46bff; text-shadow: 0 0 6px #b46bff; } .sh-tip .rd { color: #ff3355; text-shadow: 0 0 6px #ff3355; }
            @keyframes shPop { 0%, 50% { filter: brightness(2.4); } }
            .sh-bar { position: absolute; left: 0; bottom: 0; height: 2px; width: 100%; background: var(--neon-secondary); transform-origin: 0 50%; box-shadow: 0 0 6px var(--neon-secondary); }
            .sh-bar.run { animation: shBar 4.2s linear both; }
            @keyframes shBar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
            .reduce-motion .sh-bar { display: none; } .reduce-motion .sh-tip.on, .reduce-motion .sh-tip.on b { transition: none; animation: none; }
            #snake-ov .sx-card { max-height: calc(100% - 16px); overflow: auto; box-sizing: border-box; animation: sxIn 0.35s cubic-bezier(.2, 1.3, .4, 1) both; }
            @keyframes sxIn { from { opacity: 0; transform: translateY(12px) scale(0.94); } }
            .sx-big { animation: sxGlitch 3.2s steps(1) infinite; }
            @keyframes sxGlitch { 0%, 90%, 100% { transform: none; } 92% { transform: translateX(2px) skewX(-6deg); text-shadow: -2px 0 #ff0040, 2px 0 #00e5ff; } 95% { transform: translateX(-2px); } }
            .sx-mode, .sx-chip { transition: transform 0.12s, border-color 0.12s; } .sx-mode:hover, .sx-chip:hover { transform: translateY(-2px); }
.sx-arcade { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: space-between; height: 100%; padding: 14px 12px 12px; box-sizing: border-box; gap: 8px; animation: sxIn 0.35s cubic-bezier(.2, 1.3, .4, 1) both; }
            .sx-logo { width: min(90%, 450px); height: auto; image-rendering: pixelated; filter: drop-shadow(0 0 10px var(--neon-glow)); animation: sxLogo 3.2s steps(1) infinite; }
            @keyframes sxLogo { 0%, 92%, 100% { transform: none; filter: drop-shadow(0 0 10px var(--neon-glow)); } 93% { transform: translateX(-4px) skewX(-8deg); filter: drop-shadow(3px 0 0 #05d9e8) drop-shadow(-3px 0 0 #ff2a6d); } 95% { transform: translateX(3px); filter: drop-shadow(-2px 0 0 #05d9e8) drop-shadow(2px 0 0 #ff2a6d); } 97% { transform: none; } }
            .sx-stage { display: flex; align-items: center; gap: 8px; margin-top: -4px; }
            .sx-st { display: flex; flex-direction: column; align-items: center; padding: 4px 14px 5px; border: 1px solid var(--neon-primary); background: rgba(0,0,0,0.55); box-shadow: 0 0 10px var(--neon-glow), inset 0 0 8px var(--neon-glow); clip-path: polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px); }
            .sx-st small { font-size: 9px; letter-spacing: 2px; opacity: 0.6; }
            .sx-st b { font-weight: normal; letter-spacing: 2px; color: #fff; text-shadow: 0 0 6px var(--neon-primary), 0 0 14px var(--neon-primary); animation: sxNeon 4.3s steps(1) infinite; }
            @keyframes sxNeon { 0%, 71%, 74%, 77%, 100% { opacity: 1; } 72%, 75% { opacity: 0.35; } }
            .sx-sa { padding: 2px 8px; border: 0; background: none; color: var(--neon-primary); font: inherit; cursor: inherit; animation: sxNudge 1.2s ease-in-out infinite; }
            .sx-sa:last-child { animation-direction: reverse; }
            @keyframes sxNudge { 50% { transform: translateX(-3px); } }
            .reduce-motion .sx-st b, .reduce-motion .sx-sa { animation: none; }
            .sx-car { display: flex; align-items: stretch; gap: 6px; width: min(100%, 470px); margin-top: auto; }
            .sx-arrow { width: 38px; flex: none; font: 18px 'DotGothic16', monospace; color: var(--neon-primary); background: rgba(0,0,0,0.7); border: 1px solid color-mix(in srgb, var(--neon-primary) 60%, transparent); cursor: inherit; }
            .sx-arrow:active { background: var(--neon-primary); color: #000; }
            .sx-face { flex: 1; display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 2px, transparent 2px 4px), rgba(0,0,0,0.78); box-shadow: inset 0 0 0 1px var(--neon-primary), 0 0 18px var(--neon-glow); text-align: left; animation: sxFace 0.25s ease-out; }
            @keyframes sxFace { from { transform: scaleX(0.92); filter: brightness(2); } }
            .sx-kanji { font: 52px/1 'DotGothic16', monospace; color: var(--neon-primary); text-shadow: 3px 3px 0 #000, 0 0 16px var(--neon-glow); }
            .sx-ft { display: flex; flex-direction: column; gap: 3px; min-width: 0; } .sx-en { font: 18px 'DotGothic16', monospace; letter-spacing: 4px; color: #fff; }
            .sx-ft small { font-size: 11px; opacity: 0.75; line-height: 1.35; } .sx-ft em { font-style: normal; font-size: 11px; color: #ffea00; letter-spacing: 2px; }
            .sx-dots { display: flex; gap: 6px; } .sx-dots i { width: 8px; height: 8px; background: rgba(255,255,255,0.2); cursor: inherit; } .sx-dots i.on { background: var(--neon-primary); box-shadow: 0 0 8px var(--neon-glow); }
            .sx-acts { display: flex; gap: 8px; width: min(100%, 470px); } .sx-acts .sx-btn { flex: 1; } .sx-acts .sx-go { flex: 2; margin: 0; animation: sxBlink 1.1s steps(1) infinite; }
            @keyframes sxBlink { 50% { filter: brightness(0.6); } }
            .reduce-motion .sx-logo, .reduce-motion .sx-acts .sx-go { animation: none; }
            .sx-menu .sx-mode, .sx-menu .sx-chip, .sx-menu .sx-btn, #snake-ov .sx-btn { border-radius: 0; clip-path: polygon(4px 0, calc(100% - 4px) 0, calc(100% - 4px) 2px, calc(100% - 2px) 2px, calc(100% - 2px) 4px, 100% 4px, 100% calc(100% - 4px), calc(100% - 2px) calc(100% - 4px), calc(100% - 2px) calc(100% - 2px), calc(100% - 4px) calc(100% - 2px), calc(100% - 4px) 100%, 4px 100%, 4px calc(100% - 2px), 2px calc(100% - 2px), 2px calc(100% - 4px), 0 calc(100% - 4px), 0 4px, 2px 4px, 2px 2px, 4px 2px); }
            .sx-menu .sx-mode { background: repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 2px, transparent 2px 4px), rgba(0,0,0,0.35); }
            .sx-menu .sx-mode b { font-family: 'DotGothic16', monospace; font-size: 20px; text-shadow: 2px 2px 0 #000; }
            .sx-menu .sx-mode.on { background: repeating-linear-gradient(0deg, color-mix(in srgb, var(--neon-primary) 14%, transparent) 0 2px, transparent 2px 4px), rgba(0,0,0,0.35); }
            .sx-menu .sx-h { font-family: 'DotGothic16', monospace; letter-spacing: 3px; } .sx-menu .sx-h::before { content: '▶ '; color: var(--neon-primary); }
            .sx-menu .sx-go { font-family: 'DotGothic16', monospace; font-size: 16px; letter-spacing: 4px; box-shadow: 4px 4px 0 #000, 0 0 16px var(--neon-glow); }
            @media (hover: hover) and (pointer: fine) { .snake-rig:not(.touchy) #snake-dpad { display: none; } }
            @media (max-width: 760px) { .snake-rig { grid-template-columns: 1fr; grid-template-rows: minmax(0, 1fr) auto; } .snake-side { flex-direction: row; flex-wrap: wrap; } .snake-side .snake-panel, .snake-help { display: none; } .snake-score { flex: 1; } }
        `;
        document.head.appendChild(st);
        return st;
    }
    function markup() {
        return `
            <p class="file-path">// snake.exe // snek.dll</p>
            <div class="snake-rig">
                <div class="snake-stage">
                    <div class="snake-board"><canvas id="snake-canvas" width="480" height="480"></canvas><div id="snake-ov"></div></div>
                    <div id="snake-dpad" aria-label="Touch Controls">
                        <span></span><button class="snake-dpad-btn" data-dir="up" aria-label="Up">▲</button><span></span><button class="snake-dpad-btn" data-dir="slow" aria-label="Slow" title="SLOW (hold)">⏱</button>
                        <button class="snake-dpad-btn" data-dir="left" aria-label="Left">◀</button><button class="snake-dpad-btn" data-dir="down" aria-label="Down">▼</button><button class="snake-dpad-btn" data-dir="right" aria-label="Right">▶</button><span></span>
                    </div>
                </div>
                <div class="snake-side">
                <div class="readable-ui banner-box snake-score"><span id="snake-score-text">SCORE 0</span></div>
                <div class="snake-btns">
                    <button id="snake-pause-btn" class="snake-hud-btn" type="button">⏸ PAUSE</button>
                    <button id="snake-mute-btn" class="snake-hud-btn" type="button">🔊 SOUND</button>
                </div>
                <div class="snake-panel" id="snake-stats-panel" aria-label="System Vitals">
                    <div class="snake-panel-header">// SYS_VITALS.SYS</div>
                    <div class="snake-stat-row"><div class="snake-stat-label"><span>MODE</span></div><div class="snake-stat-text" id="snake-mode-text">RUN</div></div>
                    <div class="snake-stat-row"><div class="snake-stat-label"><span>FIREWALL</span><span id="snake-firewall-pct">100%</span></div><div class="snake-stat-bar-bg"><div id="snake-firewall-bar" class="snake-stat-bar" style="width: 100%;"></div></div></div>
                    <div class="snake-stat-row"><div class="snake-stat-label"><span>TRACE</span><span id="snake-trace-pct">0%</span></div><div class="snake-stat-bar-bg"><div id="snake-trace-bar" class="snake-stat-bar" style="width: 0%;"></div></div></div>
                    <div class="snake-stat-row"><div class="snake-stat-label"><span>THREAT</span></div><div class="snake-stat-text" id="snake-threat-text">LOW</div></div>
                    <div class="snake-stat-row"><div class="snake-stat-label"><span>PACKETS</span></div><div class="snake-stat-text" id="snake-nodes-text">0</div></div>
                    <div class="snake-stat-row"><div class="snake-stat-label"><span>UPTIME</span></div><div class="snake-stat-text" id="snake-uptime-text">00:00</div></div>
                    <div class="snake-stat-row"><div class="snake-stat-label"><span>BEST // 最高</span></div><div class="snake-stat-text" id="snake-best-text">0</div></div>
                    <div class="snake-ip-row">SPOOFED IP: <span id="snake-ip-text">0.0.0.0</span></div>
                </div>
                <div class="window-text snake-help" title="tap for the next one"><div class="sh-top"><span>// 遊び方 // how it works</span><i class="sh-n"></i></div>
                    <p class="sh-tip"><b class="cy">◆</b> packet. <b class="go">★</b> gold, +50</p>
                    <p class="sh-tip"><b class="cy">▲</b> cyan lets you through the walls for a bit</p>
                    <p class="sh-tip"><b class="pu">✕</b> purple takes three off you but its +80</p>
                    <p class="sh-tip"><b class="rd">!</b> red flips your controls</p>
                    <p class="sh-tip">fill the <b class="rd">TRACE</b> and a hunter comes for you</p>
                    <p class="sh-tip">a red <b class="rd">X</b> means youre about to die, swerve at the last second for a <b class="go">CLOSE CALL</b></p>
                    <i class="sh-bar"></i></div>
                </div>
            </div>
        `;
    }
})();
