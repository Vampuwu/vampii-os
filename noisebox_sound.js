
(function () {
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const hz = m => 440 * Math.pow(2, (m - 69) / 12);
    const lerp = (a, b, t) => a + (b - a) * t;
    const expo = (a, b, t) => a * Math.pow(b / a, t);
    const semis = st => Math.pow(2, st / 12);

    const F = {
        pct: v => Math.round(v * 100) + '%',
        hz: (a, b) => v => { let f = expo(a, b, v); return f >= 1000 ? (f / 1000).toFixed(1) + 'k' : Math.round(f) + ''; },
        ms: (a, b, p) => v => { let s = a + (b - a) * Math.pow(v, p || 1); return s >= 1 ? s.toFixed(2) + 's' : Math.round(s * 1000) + 'ms'; },
        oct: v => (['-2', '-1', '0', '+1', '+2'][Math.round(v * 4)]),
        pick: (names) => v => names[Math.min(names.length - 1, Math.floor(v * names.length))]
    };
    const SERP_TUN = [null, [0, 111.73, 203.91, 315.64, 386.31, 498.04, 590.22, 701.96, 813.69, 884.36, 1017.6, 1088.27], [0, 90.22, 203.91, 294.13, 407.82, 498.04, 611.73, 701.96, 792.18, 905.87, 996.09, 1109.78],
        [0, 76.05, 193.16, 310.26, 386.31, 503.42, 579.47, 696.58, 772.63, 889.74, 1006.84, 1082.89], [0, 100, 200, 350, 400, 500, 600, 700, 850, 900, 1050, 1100]];
    const VDPC = {};
    const SERP_KIND = ['TABLE', 'SPECTRAL', 'GRAIN', 'SAMPLE', 'STRING', 'MODAL', 'PULSE'], SERP_SMOV = ['MORPH', 'LOW', 'HIGH', 'FORMANT', 'ODD ↔ EVEN', 'KEEP EVERY', 'TILT', 'SCRAMBLE', 'SHIFT'];
    const SERP_FT = ['LOW 12', 'LOW 24', 'HIGH', 'BAND', 'NOTCH', 'COMB', 'VOWEL', 'PEAK', 'ACID', 'DIRTY LOW', 'MS-20 LOW', 'MS-20 HIGH', 'DIODE 303', 'FORMANT', 'PHASER', 'FLANGE', 'COMB −'];
    const SERP_SRC = ['none', 'ENV 2', 'ENV 3', 'LFO 1', 'LFO 2', 'VELOCITY', 'NOTE', 'RANDOM', 'ENV 1', 'MACRO 1', 'MACRO 2', 'MACRO 3', 'MACRO 4', 'ENV 4', 'LFO 3', 'LFO 4', 'PRESS', 'SLIDE', 'WHEEL'];
    const SERP_DST = ['POS A', 'POS B', 'POS C', 'WARP A', 'WARP B', 'WARP C', 'CUT 1', 'RES 1', 'CUT 2', 'PITCH', 'FINE', 'FM', 'LEVEL A', 'LEVEL B', 'LEVEL C', 'PAN', 'VOLUME', 'DETUNE', 'NOISE', 'SUB', 'RES 2', 'NOISE CUT', 'DIST', 'LFO 1 SPEED', 'LFO 2 SPEED', 'WIDTH', 'LFO 3 SPEED', 'LFO 4 SPEED', 'SPEC A', 'SPEC B', 'SPEC C', 'GRAIN SIZE', 'GRAIN DENSITY', 'GRAIN SPRAY', 'HIVE', 'TENSION', 'VOWEL', 'SIZE', 'GROWL'];
    const VOICES = [
        { id: 'coffin', jp: '棺', en: 'COFFIN', sub: 'drum rack. 16 drawers, any drum in each. each drawer is one row in the roll', kind: 'kit', face: 'coffin', p: [] },
        { id: 'stomp', jp: '踏', en: 'STOMP', sub: 'kicks. a soft thump up to one clipped to hell', kind: 'drum', face: 'bone',
            p: [['tune', 'TUNE', 0.32, F.hz(30, 90)], ['pitch', 'DROP', 0.55, F.pct], ['ptime', 'DROP TIME', 0.3, F.ms(0.008, 0.16)], ['decay', 'LENGTH', 0.42, F.ms(0.06, 1.8, 1.6)],
                ['click', 'CLICK', 0.4, F.pct], ['ctone', 'CLICK TONE', 0.5, F.hz(800, 9000)], ['shape', 'BODY', 0, F.pick(['round', 'round', 'harder', 'harder', 'square-ish'])], ['drive', 'DIRT', 0.15, F.pct],
                ['model', 'KIND', 0, F.pick(['THUMP', 'BOOM', 'PUNCH', 'HARD', 'SOFT', 'RUMBLE', '808', '909', 'DRUM'])], ['att', 'ATTACK', 0, F.ms(0, 0.02)], ['knock', 'KNOCK', 0, F.pct], ['tail', 'SUB TAIL', 0, F.pct], ['top', 'TOP', 1, F.hz(150, 18000)]],
            grow: ['model', 6, 9], selects: ['model', 'shape'],
            groups: [['体 · BODY', null, ['model', 'tune', 'pitch', 'ptime', 'decay', 'shape', 'att']], ['頭 · CLICK', null, ['click', 'ctone', 'knock']], ['尾 · TAIL', null, ['tail', 'drive', 'top']]],
            draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, D && D.semi, D && D.o); } },
        { id: 'anvil', jp: '金床', en: 'ANVIL', sub: 'kick designer. CLICK, PUNCH + TAIL are built separately. DROP sets how far the punch falls, TAIL MID + RING shape the tail (long for hardstyle). RUMBLE adds a low roll, METAL a clang on top, GLUE squashes it together. the whole kick follows the note, so the tail can play the bassline', kind: 'drum', part: 'nb_anvil', face: 'char',
            p: [['tune', 'TUNE', 0.35, F.hz(30, 90)], ['drop', 'DROP', 0.5, v => (v * 5).toFixed(1) + ' oct'], ['dtime', 'DROP TIME', 0.3, F.ms(0.005, 0.2)], ['bend', 'DROP CURVE', 0.5, v => v < 0.4 ? 'slow start' : v > 0.6 ? 'fast start' : 'even'],
                ['punch', 'PUNCH', 0.3, F.ms(0.03, 0.4)], ['dirt', 'PUNCH DIRT', 0.2, F.pct], ['click', 'CLICK', 0.4, F.pct], ['ctone', 'CLICK TONE', 0.5, F.hz(1000, 10000)], ['tok', 'TOK', 0.2, F.pct],
                ['tail', 'TAIL', 0, F.pct], ['tlen', 'TAIL LENGTH', 0.4, F.ms(0.05, 1.5)], ['tdirt', 'TAIL DIRT', 0.6, F.pct], ['tform', 'TAIL MID', 0.5, F.hz(250, 3000)], ['tres', 'TAIL RING', 0.3, F.pct],
                ['tmove', 'TAIL MOVE', 0.5, v => Math.abs(v - 0.5) < 0.03 ? 'still' : (v > 0.5 ? 'up ' : 'down ') + Math.round(Math.abs(v - 0.5) * 4 * 12) + 'st'], ['ttone', 'TAIL TONE', 0.5, F.hz(200, 8000)], ['tcut', 'TAIL LOW CUT', 0.2, F.hz(20, 400)],
                ['tbend', 'TAIL FALL', 0.1, v => '-' + Math.round(v * 12) + 'st'],
                ['rumble', 'RUMBLE', 0, F.pct], ['rlen', 'RUMBLE LENGTH', 0.4, F.ms(0.15, 1.6)], ['metal', 'METAL', 0, F.pct], ['mtone', 'METAL TONE', 0.5, F.hz(300, 4000)],
                ['weight', 'WEIGHT', 0.5, v => { let d = -6 + v * 18; return (d > 0 ? '+' : '') + d.toFixed(1) + 'dB'; }], ['bite', 'BITE', 0.3, F.pct], ['glue', 'GLUE', 0, F.pct], ['vol', 'VOLUME', 0.75, F.pct]],
            groups: [['頭 · CLICK', null, ['click', 'ctone', 'tok']], ['拳 · PUNCH', null, ['tune', 'drop', 'dtime', 'bend', 'punch', 'dirt']], ['尾 · TAIL', null, ['tail', 'tlen', 'tdirt', 'tform', 'tres', 'tmove', 'ttone', 'tcut', 'tbend']],
                ['層 · LAYERS', null, ['rumble', 'rlen', 'metal', 'mtone']], ['出 · OUT', null, ['weight', 'bite', 'glue', 'vol']]],
            presets: [
                ['工場の床 // TECHNO ROLLER', { tune: 0.3, drop: 0.45, dtime: 0.25, punch: 0.35, dirt: 0.15, click: 0.35, ctone: 0.45, tok: 0.15, tail: 0.2, tlen: 0.12, tdirt: 0.2, tform: 0.25, tres: 0.1, ttone: 0.3, tcut: 0.3, rumble: 0.55, rlen: 0.45, weight: 0.55, bite: 0.3, glue: 0.3, vol: 0.84 }],
                ['九〇九 // THE 909 ONE', { tune: 0.4, drop: 0.55, dtime: 0.2, punch: 0.25, dirt: 0.1, click: 0.6, ctone: 0.7, tok: 0.4, tail: 0, weight: 0.5, bite: 0.4, vol: 0.53 }],
                ['陶酔の鉄槌 // EUPHORIC HARDSTYLE', { tune: 0.34, drop: 0.7, dtime: 0.3, bend: 0.65, punch: 0.18, dirt: 0.3, click: 0.45, ctone: 0.6, tok: 0.45, tail: 0.9, tlen: 0.17, tdirt: 0.7, tform: 0.42, tres: 0.4, tmove: 0.5, ttone: 0.55, tcut: 0.42, tbend: 0.06, weight: 0.55, bite: 0.4, glue: 0.5, vol: 0.66 }],
                ['生の地獄 // RAWSTYLE SCREECH TAIL', { tune: 0.32, drop: 0.8, dtime: 0.28, bend: 0.7, punch: 0.15, dirt: 0.5, click: 0.6, ctone: 0.62, tok: 0.55, tail: 1, tlen: 0.17, tdirt: 0.95, tform: 0.55, tres: 0.75, tmove: 0.78, ttone: 0.7, tcut: 0.48, tbend: 0.18, weight: 0.5, bite: 0.5, glue: 0.7, vol: 0.69 }],
                ['ガバの釘 // GABBER NAIL', { tune: 0.45, drop: 0.55, dtime: 0.18, bend: 0.6, punch: 0.5, dirt: 0.85, click: 0.5, ctone: 0.65, tok: 0.3, tail: 0.85, tlen: 0.06, tdirt: 1, tform: 0.12, tres: 0.65, tmove: 0.42, ttone: 0.6, tcut: 0.12, tbend: 0.04, weight: 0.45, bite: 0.45, glue: 0.85, vol: 0.72 }],
                ['恍惚の太鼓 // TRANCE KICK', { tune: 0.38, drop: 0.5, dtime: 0.22, punch: 0.4, dirt: 0.2, click: 0.45, ctone: 0.6, tok: 0.25, tail: 0.2, tlen: 0.1, tdirt: 0.2, tform: 0.3, ttone: 0.35, weight: 0.65, bite: 0.35, glue: 0.2, vol: 0.7 }],
                ['工業の鎚 // INDUSTRIAL HAMMER', { tune: 0.25, drop: 0.4, dtime: 0.35, punch: 0.4, dirt: 0.65, click: 0.75, ctone: 0.3, tok: 0.45, tail: 0.55, tlen: 0.12, tdirt: 0.75, tform: 0.3, tres: 0.35, tmove: 0.4, ttone: 0.4, tcut: 0.35, tbend: 0.25, rumble: 0.7, rlen: 0.55, metal: 0.55, mtone: 0.45, weight: 0.7, bite: 0.5, glue: 0.6, vol: 0.65 }],
                ['闇の鼓動 // DARKWAVE THUD', { tune: 0.28, drop: 0.3, dtime: 0.35, bend: 0.3, punch: 0.5, dirt: 0.05, click: 0.15, ctone: 0.3, tok: 0.05, tail: 0.15, tlen: 0.12, tdirt: 0.05, ttone: 0.2, weight: 0.7, vol: 0.69 }],
                ['鉄の轟き // HARD TECHNO RUMBLE', { tune: 0.3, drop: 0.5, dtime: 0.22, bend: 0.6, punch: 0.3, dirt: 0.45, click: 0.5, ctone: 0.5, tok: 0.3, tail: 0.3, tlen: 0.12, tdirt: 0.6, tform: 0.22, tres: 0.2, ttone: 0.35, tcut: 0.3, rumble: 0.9, rlen: 0.6, weight: 0.6, bite: 0.4, glue: 0.65, vol: 0.8 }],
                ['倉庫の錆 // WAREHOUSE RUST', { tune: 0.22, drop: 0.45, dtime: 0.4, bend: 0.35, punch: 0.5, dirt: 0.8, click: 0.9, ctone: 0.2, tok: 0.6, tail: 0.45, tlen: 0.1, tdirt: 0.9, tform: 0.18, tres: 0.5, tmove: 0.3, ttone: 0.3, tcut: 0.25, tbend: 0.35, rumble: 0.5, rlen: 0.7, metal: 0.8, mtone: 0.25, weight: 0.65, bite: 0.6, glue: 0.75, vol: 0.64 }],
            ],
            draw(x, w, h, s, D) {
                x.fillStyle = '#060404'; x.fillRect(0, 0, w, h); let g0 = x.createRadialGradient(w * 0.15, h, 4, w * 0.15, h, w * 0.8); g0.addColorStop(0, 'rgba(255,90,30,0.18)'); g0.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g0; x.fillRect(0, 0, w, h);
                const v = (k, d) => s[k] == null ? d : s[k], end = expo(30, 90, v('tune', 0.35)), start = end * Math.pow(2, v('drop', 0.5) * 5), dt = 0.005 + v('dtime', 0.3) * 0.195, pl = 0.03 + v('punch', 0.3) * 0.37, tl = v('tail', 0) > 0.01 ? 0.05 + v('tlen', 0.4) * 1.45 : 0, span = Math.max(0.25, pl + tl + 0.05), bend = v('bend', 0.5);
                const X0 = tt => 8 + tt / span * (w - 16), Yf = f => h - 10 - Math.log(f / 25) / Math.log(4000 / 25) * (h - 26);
                x.strokeStyle = 'rgba(255,255,255,0.06)'; [50, 100, 200, 500, 1000, 2000].forEach(f => { x.beginPath(); x.moveTo(8, Yf(f)); x.lineTo(w - 8, Yf(f)); x.stroke(); });
                let amp = []; for (let i = 0; i <= 120; i++) { let tt = i / 120 * span, a = tt < pl * 0.6 ? 1 : tt < pl + (tl ? 0.02 : pl * 0.6) ? Math.exp(-(tt - pl * 0.6) / (pl * 0.25 + 0.005)) : 0; if (tl) a = Math.max(a, tt < pl * 0.7 ? 0 : tt < pl ? (tt - pl * 0.7) / (pl * 0.3) * v('tail', 0) * 0.85 : tt < pl + tl * 0.7 ? v('tail', 0) * 0.85 : Math.max(0, v('tail', 0) * 0.85 * (1 - (tt - pl - tl * 0.7) / (tl * 0.3)))); amp.push([X0(tt), h - 10 - Math.min(1, a) * (h - 26)]); }
                x.fillStyle = 'rgba(255,120,60,0.22)'; x.beginPath(); x.moveTo(8, h - 10); amp.forEach(p => x.lineTo(p[0], p[1])); x.lineTo(X0(span), h - 10); x.fill();
                x.strokeStyle = 'rgba(255,150,90,0.7)'; x.lineWidth = 1.2; x.beginPath(); amp.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke();
                if (v('rumble', 0) > 0.01) { let rl = 0.15 + v('rlen', 0.4) * 1.45, ra = v('rumble', 0) * 0.6; x.fillStyle = 'rgba(120,70,200,0.28)'; x.beginPath(); x.moveTo(X0(0.03), h - 10); for (let i = 0; i <= 60; i++) { let tt = 0.03 + i / 60 * rl, e2 = Math.min(1, (tt - 0.03) / 0.08) * Math.exp(-(tt - 0.03) / (rl * 0.45)); x.lineTo(X0(Math.min(span, tt)), h - 10 - ra * e2 * (h - 26)); } x.lineTo(X0(Math.min(span, 0.03 + rl)), h - 10); x.fill(); }
                if (v('metal', 0) > 0.01) { x.strokeStyle = 'rgba(200,230,255,0.8)'; x.lineWidth = 2; x.beginPath(); x.moveTo(X0(0.002), h - 10); x.lineTo(X0(0.002), h - 10 - v('metal', 0) * (h - 26)); x.stroke(); x.lineWidth = 1; }
                let pts = []; for (let i = 0; i <= 120; i++) { let tt = i / 120 * span, f; if (tt < dt) { let u = tt / dt; f = bend > 0.6 ? end + (start - end) * Math.exp(-u * 4) : bend < 0.4 ? (u < 0.6 ? start + (start * 0.6 + end * 0.4 - start) * u / 0.6 : (start * 0.6 + end * 0.4) * Math.pow(end / (start * 0.6 + end * 0.4), (u - 0.6) / 0.4)) : start * Math.pow(end / start, u); } else f = end; if (tl && tt > pl) f = end * Math.pow(2, -v('tbend', 0.1) * (1 - Math.exp(-(tt - pl) / (tl * 0.5)))); pts.push([X0(tt), Yf(f)]); }
                x.strokeStyle = '#ffe2c0'; x.lineWidth = 3; x.globalAlpha = 0.2; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke(); x.globalAlpha = 1; x.lineWidth = 1.4; x.stroke();
                if (tl) { x.setLineDash([3, 3]); x.strokeStyle = 'rgba(255,255,255,0.3)'; x.beginPath(); x.moveTo(X0(pl), 14); x.lineTo(X0(pl), h - 10); x.stroke(); x.setLineDash([]); }
                x.font = 'bold 9px Courier New'; x.fillStyle = '#ffd0a8';
                let nt = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][((Math.round(12 * Math.log2(end / 440)) + 69) % 12 + 12) % 12], tw = ' · tail ' + tl.toFixed(2) + 's' + (v('tdirt', 0.6) > 0.5 ? ' dirty' : '');
                let hd = [Math.round(end) + 'hz (' + nt + ') · drops ' + (v('drop', 0.5) * 5).toFixed(1) + ' oct in ' + Math.round(dt * 1000) + 'ms' + (tl ? tw : ''), Math.round(end) + 'hz (' + nt + ') · ' + (v('drop', 0.5) * 5).toFixed(1) + ' oct · ' + Math.round(dt * 1000) + 'ms' + (tl ? ' · tail ' + tl.toFixed(2) + 's' : ''), Math.round(end) + 'hz (' + nt + ')'];
                let ht = hd.map(q => 'ANVIL · ' + q).find(q => x.measureText(q).width < w - 12) || Math.round(end) + 'hz'; x.fillText(ht, 6, 11);
                x.fillStyle = 'rgba(255,255,255,0.35)'; x.font = '8px Courier New'; x.fillText('punch', X0(pl * 0.3), h - 2); if (tl) x.fillText('tail', X0(pl + tl * 0.4), h - 2);
            } },
        { id: 'slap', jp: '叩', en: 'SLAP', sub: 'snare / clap. 12 KINDs: tight, fat, cheap, brushes, rim, finger snap, stacked claps, 808 + 909 snares, 808 clap, acoustic snare', kind: 'drum', face: 'bone',
            p: [['mode', 'SNARE↔CLAP', 0.5, F.pct], ['tone', 'TONE', 0.4, F.hz(110, 340)], ['body', 'BODY', 0.5, F.pct], ['noise', 'HISS', 0.6, F.pct],
                ['snap', 'SNAP', 0.4, F.ms(0.04, 0.5)], ['color', 'COLOUR', 0.5, F.hz(700, 7000)], ['spread', 'HANDS', 0.4, F.ms(0.005, 0.025)], ['decay', 'BODY LENGTH', 0.35, F.ms(0.04, 0.6)],
                ['model', 'KIND', 0, F.pick(['CLASSIC', 'TIGHT', 'FAT', 'BOX', 'BRUSH', 'RIM', 'SNAP', 'STACK', '808', '909', '808 CLAP', 'ACOUSTIC'])], ['claps', 'CLAPS', 2 / 7, v => String(1 + Math.round(v * 7))], ['drop', 'DROP', 0, F.pct], ['wire', 'WIRES', 0, F.pct], ['room', 'ROOM', 0, F.pct], ['top', 'TOP', 1, F.hz(1000, 18000)]],
            grow: ['model', 8, 12], selects: ['model'],
            groups: [['体 · BODY', null, ['model', 'tone', 'body', 'decay', 'drop']], ['響 · HISS', null, ['noise', 'snap', 'color', 'wire']], ['手 · HANDS', null, ['mode', 'claps', 'spread']], ['部屋 · ROOM', null, ['room', 'top']]],
            draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, D && D.semi, D && D.o); } },
        { id: 'tick', jp: '刻', en: 'TICK', sub: 'hats. metal to a shaker, the 808 + 909 ones', kind: 'drum', face: 'bone',
            p: [['tone', 'TONE', 0.5, F.hz(180, 620)], ['metal', 'METAL↔HISS', 0.55, F.pct], ['bright', 'BRIGHT', 0.6, F.hz(3500, 13000)], ['cdec', 'SHUT', 0.25, F.ms(0.012, 0.16)],
                ['odec', 'OPEN', 0.45, F.ms(0.08, 1.2)], ['choke', 'CHOKE', 1, F.pick(['off', 'on'])],
                ['model', 'KIND', 0, F.pick(['METAL', 'BOX', 'GLASSY', 'SHAKER', 'TAMB', 'TINK', 'SIZZLE', '808', '909', 'PEDAL'])], ['shake', 'SHAKE', 0, F.pct], ['sizz', 'SIZZLE', 0.5, F.pct], ['swing', 'LEFT↔RIGHT', 0, F.pct]],
            grow: ['model', 7, 10], selects: ['model', 'choke'],
            groups: [['金 · METAL', null, ['model', 'tone', 'metal', 'bright', 'sizz']], ['長 · LENGTH', null, ['cdec', 'odec', 'choke']], ['揺 · MOVE', null, ['shake', 'swing']]],
            draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, D && D.semi, D && D.o); } },
        { id: 'chime', jp: '鈴', en: 'CHIME', sub: 'metal, bells, wood, clanks', kind: 'drum', face: 'bone',
            p: [['pitch', 'PITCH', 0.5, F.hz(120, 3200)], ['ratio', 'RATIO', 0.3, F.pick(['0.5', '1', '1.41', '2', '2.76', '3.5', '5.19', '7'])], ['index', 'BITE', 0.4, F.pct], ['decay', 'RING', 0.3, F.ms(0.015, 2, 1.7)], ['bend', 'BEND', 0.5, F.pct],
                ['model', 'KIND', 0, F.pick(['FM', 'COWBELL', 'CLAVE', 'BLOCK', 'TRIANGLE', 'GLASS', 'MUSIC BOX', 'GONG', 'KALIMBA', 'TUBE', '808 COWBELL', '808 CLAVE', 'MARIMBA', 'VIBES', 'STEEL PAN'])], ['strike', 'STRIKE', 0.3, F.pct], ['damp', 'DAMP', 0.4, F.pct], ['det', 'DETUNE', 0, F.pct], ['motor', 'MOTOR', 0, F.pct]],
            grow: ['model', 10, 15], selects: ['model', 'ratio'],
            groups: [['鈴 · BELL', null, ['model', 'pitch', 'ratio', 'index', 'det', 'motor']], ['響 · RING', null, ['decay', 'damp', 'bend']], ['打 · STRIKE', null, ['strike']]],
            hide(k, s) { return k === 'motor' && Math.min(14, Math.floor((s.model || 0) * 15)) !== 13; },
            draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, D && D.semi, D && D.o); } },
        { id: 'squirm', jp: '蠢', en: 'SQUIRM', sub: 'mono synth that slides between notes. for acid / 303 style lines', kind: 'mono', face: 'flesh',
            p: [['wave', 'SAW↔SQUARE', 0, F.pct], ['cut', 'CUT', 0.3, F.hz(60, 9000)], ['res', 'RES', 0.62, F.pct], ['env', 'ENV', 0.6, F.pct], ['dec', 'DECAY', 0.4, F.ms(0.03, 1.2, 1.5)],
                ['acc', 'ACCENT', 0.5, F.pct], ['glide', 'SLIDE TIME', 0.3, F.ms(0.01, 0.25)], ['drive', 'DIRT', 0.35, F.pct], ['sub', 'SUB', 0, F.pct], ['oct', 'OCTAVE', 0.5, F.oct]],
            groups: [['源 · OSC', null, ['wave', 'sub', 'oct', 'glide']], ['濾 · FILTER', null, ['cut', 'res', 'env', 'dec', 'acc']], ['汚 · DIRT', null, ['drive']]],
            pwk: 1, draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, D && D.semi, D && D.o); } },
        { id: 'sump', jp: '澱', en: 'SUMP', sub: 'bass', kind: 'mono', face: 'sump',
            p: [['wave', 'WAVE', 0.66, F.pick(['sine', 'triangle', 'saw', 'square'])], ['det', 'WIDE', 0.2, F.pct], ['sub', 'SUB', 0.45, F.pct], ['cut', 'CUT', 0.35, F.hz(50, 8000)], ['res', 'RES', 0.15, F.pct],
                ['env', 'ENV', 0.3, F.pct], ['att', 'ATTACK', 0, F.ms(0.001, 0.5, 2)], ['dec', 'DECAY', 0.35, F.ms(0.02, 1.5, 1.5)], ['sus', 'HOLD', 0.7, F.pct], ['rel', 'RELEASE', 0.15, F.ms(0.01, 1.5, 2)],
                ['glide', 'GLIDE', 0, F.ms(0, 0.3)], ['drive', 'DIRT', 0.2, F.pct], ['oct', 'OCTAVE', 0.5, F.oct], ['ktrk', 'KEY TRACK', 0, F.pct], ['vcut', 'VEL → CUT', 0, F.pct], ['punch', 'PUNCH', 0, F.pct]],
            groups: [['源 · OSC', null, ['wave', 'det', 'sub', 'oct', 'glide', 'punch']], ['濾 · FILTER', null, ['cut', 'res', 'env', 'ktrk', 'vcut']], ['形 · SHAPE', null, ['att', 'dec', 'sus', 'rel', 'drive']]], selects: ['wave'],
            pwk: 1, draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, D && D.semi, D && D.o); } },
        { id: 'haze', jp: '霞', en: 'HAZE', sub: 'pads', kind: 'poly', face: 'mist',
            p: [['wave', 'WAVE', 0.66, F.pick(['sine', 'triangle', 'saw', 'square'])], ['voices', 'STACK', 0.5, v => String(1 + Math.round(v * 6))], ['det', 'SPREAD', 0.4, F.pct], ['cut', 'CUT', 0.5, F.hz(120, 12000)], ['res', 'RES', 0.1, F.pct],
                ['lfo', 'BREATH RATE', 0.3, F.hz(0.05, 6)], ['lfod', 'BREATH', 0.2, F.pct], ['att', 'ATTACK', 0.5, F.ms(0.005, 4, 2)], ['rel', 'RELEASE', 0.55, F.ms(0.02, 6, 2)], ['width', 'WIDTH', 0.6, F.pct], ['oct', 'OCTAVE', 0.5, F.oct], ['chor', 'CHORUS', 1 / 8, F.pick(['off', 'I', 'II', 'I+II'])]],
            groups: [['源 · OSC', null, ['wave', 'voices', 'det', 'width', 'oct']], ['濾 · FILTER', null, ['cut', 'res', 'lfo', 'lfod']], ['形 · SHAPE', null, ['att', 'rel', 'chor']]], selects: ['wave', 'chor'],
            draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, D && D.semi, D && D.o); } },
        { id: 'grit', jp: '粒', en: 'GRIT', sub: 'plucks, leads, arps', kind: 'poly', face: 'grit',
            p: [['wave', 'WAVE', 0.66, F.pick(['sine', 'triangle', 'saw', 'square'])], ['fm', 'FM', 0, F.pct], ['cut', 'CUT', 0.5, F.hz(150, 12000)], ['res', 'RES', 0.3, F.pct], ['env', 'ENV', 0.5, F.pct],
                ['dec', 'DECAY', 0.3, F.ms(0.02, 1.5, 1.5)], ['rel', 'RELEASE', 0.2, F.ms(0.01, 2, 2)], ['oct', 'OCTAVE', 0.5, F.oct],
                ['arp', 'ARP', 0, F.pick(['off', 'up', 'down', 'up+down', 'random'])], ['arate', 'ARP SPEED', 0.5, F.pick(['1/8', '1/16', '1/32'])], ['arange', 'ARP RANGE', 0.25, v => String(1 + Math.round(v * 2)) + ' oct'], ['uni', 'UNISON', 0, F.pct], ['sub', 'SUB', 0, F.pct]],
            groups: [['源 · OSC', null, ['wave', 'fm', 'uni', 'sub', 'oct']], ['濾 · FILTER', null, ['cut', 'res', 'env', 'dec', 'rel']], ['階 · ARP', null, ['arp', 'arate', 'arange']]], selects: ['wave', 'arp', 'arate'],
            draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, D && D.semi, D && D.o); } },
        { id: 'throat', jp: '喉', en: 'THROAT', sub: 'wordless voice. sings vowels through a modelled throat. MOVE = how much it slides into each note', kind: 'poly', part: 'nb_throat', face: 'throat',
            p: [['vowel', 'VOWEL', 0.3, F.pick(['a', 'a-e', 'e', 'e-i', 'i', 'i-o', 'o', 'o-u', 'u'])], ['motion', 'MOVE', 0.2, F.pct], ['vib', 'SHAKE', 0.2, F.pct], ['breath', 'BREATH', 0.25, F.pct],
                ['att', 'ATTACK', 0.35, F.ms(0.01, 2, 2)], ['rel', 'RELEASE', 0.45, F.ms(0.02, 4, 2)], ['oct', 'OCTAVE', 0.5, F.oct]],
            groups: [['口 · MOUTH', null, ['vowel', 'motion', 'breath']], ['声 · VOICE', null, ['vib', 'att', 'rel', 'oct']]], selects: ['vowel'], pwk: 1,
            draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, D && D.semi, D && D.o); } },
        { id: 'rust', jp: '錆', en: 'RUST', sub: 'textures: hiss, vinyl crackle, wind, drone, rumble, rain, fire', kind: 'poly', part: 'nb_rust', face: 'rust',
            p: [['type', 'WHAT', 0, F.pick(['hiss', 'crackle', 'wind', 'drone', 'rumble', 'rain', 'fire'])], ['tone', 'TONE', 0.5, F.pct], ['motion', 'MOVE', 0.4, F.pct], ['dens', 'DENSITY', 0.5, F.pct], ['att', 'FADE IN', 0.3, F.ms(0.005, 3, 2)], ['dec', 'FADE OUT', 0.5, F.ms(0.05, 6, 2)]],
            groups: [['何 · WHAT', null, ['type', 'tone', 'motion', 'dens']], ['形 · FADE', null, ['att', 'dec']]], selects: ['type'], grow: ['type', 5, 7], pwk: 1,
            draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, D && D.semi, D && D.o); } },
        { id: 'steel', jp: '鋼', en: 'STEEL', sub: 'cymbals. crash, ride, splash, china, the 808 one', kind: 'drum', face: 'steel',
            p: [['kind', 'WHICH', 0, F.pick(['crash', 'ride', 'snarl', 'splash', '808', 'china'])], ['tone', 'TONE', 0.5, F.hz(250, 900)], ['bright', 'BRIGHT', 0.5, F.pct], ['decay', 'RING', 0.5, F.pct], ['bell', 'BELL', 0.2, F.pct], ['hiss', 'HISS', 0.4, F.pct], ['dirt', 'TRASH', 0.1, F.pct], ['grab', 'GRAB', 0, F.pick(['off', 'on'])]],
            selects: ['kind', 'grab'],
            groups: [['鋼 · METAL', null, ['kind', 'tone', 'bright', 'dirt']], ['響 · RING', null, ['decay', 'bell', 'hiss', 'grab']]],
            draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, D && D.semi, D && D.o); } },
        { id: 'zap', jp: '閃', en: 'ZAP', sub: 'zaps, lasers, blips, the little pew. higher notes = higher', kind: 'drum', face: 'grit',
            p: [['pitch', 'FROM', 0.6, F.hz(200, 8000)], ['drop', 'DROP', 0.5, v => (v * 6).toFixed(1) + ' oct'], ['time', 'DROP TIME', 0.3, F.ms(0.005, 0.6, 1.5)], ['wave', 'WAVE', 0, F.pick(['sine', 'triangle', 'square', 'saw'])], ['noise', 'FIZZ', 0.1, F.pct], ['decay', 'LENGTH', 0.3, F.ms(0.03, 1.2, 1.5)], ['dirt', 'DIRT', 0, F.pct], ['vib', 'VIBRATO', 0, F.pct], ['rep', 'REPEAT', 0, v => v < 0.02 ? 'once' : (1 + Math.round(v * 7)) + ' times']],
            groups: [['音 · TONE', null, ['pitch', 'drop', 'time', 'wave', 'vib']], ['汚 · FIZZ', null, ['noise', 'dirt', 'decay', 'rep']]], selects: ['wave'],
            draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, D && D.semi, D && D.o); } },
        { id: 'pipe', jp: '管', en: 'PIPE', sub: 'organ. six drawbars, the click, the percussion ping, the wobble', kind: 'poly', face: 'glass',
            p: [['d16', "16'", 0.6, F.pct], ['d8', "8'", 0.8, F.pct], ['d4', "4'", 0.5, F.pct], ['d3', "2⅔'", 0.2, F.pct], ['d2', "2'", 0.3, F.pct], ['d1', "1'", 0.1, F.pct],
                ['perc', 'PING', 0.3, F.pct], ['percH', 'PING ON', 0, F.pick(['2nd', '3rd'])], ['click', 'CLICK', 0.3, F.pct], ['vib', 'WOBBLE', 0.3, F.pct], ['drive', 'DIRT', 0.15, F.pct], ['att', 'ATTACK', 0.05, F.ms(0.002, 2, 2)], ['rel', 'RELEASE', 0.15, F.ms(0.01, 3, 2)], ['oct', 'OCTAVE', 0.5, F.oct], ['scan', 'SCANNER', 0, F.pick(['off', 'V1', 'V2', 'V3', 'C1', 'C2', 'C3'])], ['pdec', 'PING SPEED', 0, F.pick(['fast', 'slow'])], ['leak', 'LEAK', 0, F.pct]],
            groups: [['棒 · DRAWBARS', null, ['d16', 'd8', 'd4', 'd3', 'd2', 'd1']], ['打 · PING + CLICK', null, ['perc', 'percH', 'pdec', 'click']], ['揺 · WOBBLE', null, ['vib', 'scan', 'leak', 'drive']], ['形 · SHAPE', null, ['att', 'rel', 'oct']]], selects: ['percH', 'pdec', 'scan'],
            draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, D && D.semi, D && D.o); } },
        { id: 'pick', jp: '爪', en: 'PICK', sub: 'plucked strings: nylon, steel, koto, sitar, music box', kind: 'poly', face: 'tape',
            p: [['bright', 'BRIGHT', 0.6, F.pct], ['decay', 'RING', 0.5, F.ms(0.2, 8, 1.6)], ['pos', 'WHERE', 0.4, v => v < 0.33 ? 'bridge' : v > 0.66 ? 'neck' : 'middle'], ['body', 'BODY', 0.5, F.hz(120, 1500)], ['damp', 'DAMP', 0.3, F.pct], ['width', 'WIDTH', 0.4, F.pct], ['oct', 'OCTAVE', 0.5, F.oct],
                ['model', 'KIND', 0, F.pick(['STRING', 'NYLON', 'STEEL', 'KOTO', 'HARP', 'BASS', 'SITAR', 'BANJO', 'TWELVE', 'KALIMBA', 'MUSIC BOX', 'DULCIMER', 'HARPSICHORD'])], ['hard', 'PICKED WITH', 0.5, v => v < 0.33 ? 'a fingertip' : v < 0.66 ? 'a nail' : 'a pick'],
                ['buzz', 'BUZZ', 0, F.pct], ['dbl', 'DOUBLE', 0, v => v < 0.01 ? 'one string' : '+' + Math.round(v * 30) + 'c'], ['strum', 'STRUM', 0, F.ms(0, 0.12)], ['bendin', 'BEND IN', 0, v => Math.round(v * 200) + 'c'], ['vib', 'SHAKE', 0, F.pct]],
            groups: [['弦 · STRING', null, ['model', 'hard', 'pos', 'bright', 'body']], ['響 · RING', null, ['decay', 'damp', 'buzz', 'dbl']], ['手 · HAND', null, ['strum', 'bendin', 'vib', 'width', 'oct']]], selects: ['model'], pwk: 1,
            draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, D && D.semi, D && D.o); } },
        { id: 'swarm', jp: '群', en: 'SWARM', sub: 'supersaw, up to nine', kind: 'poly', face: 'mist',
            p: [['voices', 'SAWS', 0.75, v => String(1 + Math.round(v * 8))], ['det', 'SPREAD', 0.4, F.pct], ['side', 'SIDES', 0.7, F.pct], ['sub', 'SUB', 0.2, F.pct], ['cut', 'CUT', 0.6, F.hz(100, 14000)], ['res', 'RES', 0.15, F.pct], ['env', 'ENV', 0.3, F.pct],
                ['att', 'ATTACK', 0.02, F.ms(0.002, 2, 2)], ['dec', 'DECAY', 0.4, F.ms(0.02, 2, 1.5)], ['sus', 'HOLD', 0.8, F.pct], ['rel', 'RELEASE', 0.25, F.ms(0.01, 3, 2)], ['rise', 'SCOOP', 0, v => Math.round(v * 12) + 'st'], ['oct', 'OCTAVE', 0.5, F.oct], ['model', 'SAW KIND', 0.75, F.pick(['EVEN', 'SUPER'])]],
            groups: [['群 · SAWS', null, ['model', 'voices', 'det', 'side', 'sub', 'rise', 'oct']], ['濾 · FILTER', null, ['cut', 'res', 'env']], ['形 · SHAPE', null, ['att', 'dec', 'sus', 'rel']]], hide(k, s) { return k === 'voices' && (s.model == null ? 0.75 : s.model) >= 0.5; }, selects: ['model'],
            draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, D && D.semi, D && D.o); } },
        { id: 'rise', jp: '昇', en: 'RISE', sub: 'transitions: risers, falls, impacts, sweeps, reverse swells + SHEPARD (a rise that never ends). the note length sets how long it takes', kind: 'poly', part: 'nb_rise', face: 'char',
            p: [['kind', 'WHICH', 0, F.pick(['RISER', 'FALL', 'IMPACT', 'SWEEP', 'REVERSE', 'SHEPARD'])], ['tone', 'TONE', 0.6, F.pct], ['amt', 'HOW FAR', 0.6, v => (v * 4).toFixed(1) + ' oct'], ['mix', 'NOISE↔TONE', 0.3, F.pct], ['dirt', 'DIRT', 0.1, F.pct], ['width', 'WIDTH', 0.6, F.pct]],
            groups: [['何 · WHICH', null, ['kind', 'amt', 'tone', 'mix']], ['汚 · DIRT', null, ['dirt', 'width']]], selects: ['kind'],
            draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, D && D.semi, D && D.o); } },
        { id: 'groan', jp: '唸', en: 'GROAN', sub: 'nasty bass. two detuned saws, FM + wobble', kind: 'mono', part: 'nb_groan', face: 'sump',
            p: [['mode', 'KIND', 0, F.pick(['TWINS', 'FM', 'WOBBLE'])], ['det', 'RUB', 0.4, F.pct], ['fm', 'METAL', 0.2, F.pct], ['cut', 'CUT', 0.35, F.hz(60, 8000)], ['res', 'RES', 0.3, F.pct], ['move', 'MOVE', 0.3, v => v < 0.02 ? 'still' : v.toFixed(2)], ['rate', 'WOBBLE AT', 0.4, F.pick(['1/2', '1/4', '1/8', '1/8T', '1/16'])], ['drive', 'DIRT', 0.35, F.pct], ['sub', 'SUB', 0.5, F.pct], ['glide', 'GLIDE', 0.1, F.ms(0, 0.3)], ['oct', 'OCTAVE', 0.5, F.oct]],
            groups: [['源 · OSC', null, ['mode', 'det', 'fm', 'sub', 'glide', 'oct']], ['濾 · FILTER', null, ['cut', 'res', 'move', 'rate']], ['汚 · DIRT', null, ['drive']]], selects: ['mode', 'rate'],
            draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, D && D.semi, D && D.o); } },
        // synths. SERPENT got out of hand lol
        { id: 'chrome', jp: '鍍', en: 'CHROME', sub: 'FM. 4 operators, 8 algorithms', kind: 'poly', part: 'nb_chrome', face: 'chrome',
            p: [['q1', '1 RATIO', 0.1, v => '×' + CHR.RAT[Math.min(CHR.RAT.length - 1, Math.floor(v * CHR.RAT.length))]],
                ['dt1', '1 DETUNE', 0.5, v => { let c = Math.round((v - 0.5) * 50); return (c > 0 ? '+' : '') + c + 'c'; }],
                ['l1', '1 LEVEL', 0.9, v => String(Math.round(v * 99))],
                ['w1', '1 SHAPE', 0, F.pick(['SINE', 'HALF', 'BOTH UP', 'SQUASHED'])],
                ['ea1', '1 ATTACK', 0, v => { let s = 0.0005 * Math.pow(10 / 0.0005, v); return s >= 1 ? s.toFixed(2) + 's' : Math.round(s * 1000) + 'ms'; }],
                ['ed1', '1 DECAY', 0.5, v => { let s = 0.005 * Math.pow(20 / 0.005, v); return s >= 1 ? s.toFixed(2) + 's' : Math.round(s * 1000) + 'ms'; }],
                ['es1', '1 SUSTAIN', 0.7, F.pct],
                ['er1', '1 RELEASE', 0.3, v => { let s = 0.005 * Math.pow(15 / 0.005, v); return s >= 1 ? s.toFixed(2) + 's' : Math.round(s * 1000) + 'ms'; }],
                ['v1', '1 VELOCITY', 0.3, F.pct],
                ['q2', '2 RATIO', 0.1, v => '×' + CHR.RAT[Math.min(CHR.RAT.length - 1, Math.floor(v * CHR.RAT.length))]],
                ['dt2', '2 DETUNE', 0.5, v => { let c = Math.round((v - 0.5) * 50); return (c > 0 ? '+' : '') + c + 'c'; }],
                ['l2', '2 LEVEL', 0, v => String(Math.round(v * 99))],
                ['w2', '2 SHAPE', 0, F.pick(['SINE', 'HALF', 'BOTH UP', 'SQUASHED'])],
                ['ea2', '2 ATTACK', 0, v => { let s = 0.0005 * Math.pow(10 / 0.0005, v); return s >= 1 ? s.toFixed(2) + 's' : Math.round(s * 1000) + 'ms'; }],
                ['ed2', '2 DECAY', 0.5, v => { let s = 0.005 * Math.pow(20 / 0.005, v); return s >= 1 ? s.toFixed(2) + 's' : Math.round(s * 1000) + 'ms'; }],
                ['es2', '2 SUSTAIN', 0.3, F.pct],
                ['er2', '2 RELEASE', 0.3, v => { let s = 0.005 * Math.pow(15 / 0.005, v); return s >= 1 ? s.toFixed(2) + 's' : Math.round(s * 1000) + 'ms'; }],
                ['v2', '2 VELOCITY', 0.3, F.pct],
                ['q3', '3 RATIO', 0.1, v => '×' + CHR.RAT[Math.min(CHR.RAT.length - 1, Math.floor(v * CHR.RAT.length))]],
                ['dt3', '3 DETUNE', 0.5, v => { let c = Math.round((v - 0.5) * 50); return (c > 0 ? '+' : '') + c + 'c'; }],
                ['l3', '3 LEVEL', 0, v => String(Math.round(v * 99))],
                ['w3', '3 SHAPE', 0, F.pick(['SINE', 'HALF', 'BOTH UP', 'SQUASHED'])],
                ['ea3', '3 ATTACK', 0, v => { let s = 0.0005 * Math.pow(10 / 0.0005, v); return s >= 1 ? s.toFixed(2) + 's' : Math.round(s * 1000) + 'ms'; }],
                ['ed3', '3 DECAY', 0.5, v => { let s = 0.005 * Math.pow(20 / 0.005, v); return s >= 1 ? s.toFixed(2) + 's' : Math.round(s * 1000) + 'ms'; }],
                ['es3', '3 SUSTAIN', 0.3, F.pct],
                ['er3', '3 RELEASE', 0.3, v => { let s = 0.005 * Math.pow(15 / 0.005, v); return s >= 1 ? s.toFixed(2) + 's' : Math.round(s * 1000) + 'ms'; }],
                ['v3', '3 VELOCITY', 0.3, F.pct],
                ['q4', '4 RATIO', 0.1, v => '×' + CHR.RAT[Math.min(CHR.RAT.length - 1, Math.floor(v * CHR.RAT.length))]],
                ['dt4', '4 DETUNE', 0.5, v => { let c = Math.round((v - 0.5) * 50); return (c > 0 ? '+' : '') + c + 'c'; }],
                ['l4', '4 LEVEL', 0, v => String(Math.round(v * 99))],
                ['w4', '4 SHAPE', 0, F.pick(['SINE', 'HALF', 'BOTH UP', 'SQUASHED'])],
                ['ea4', '4 ATTACK', 0, v => { let s = 0.0005 * Math.pow(10 / 0.0005, v); return s >= 1 ? s.toFixed(2) + 's' : Math.round(s * 1000) + 'ms'; }],
                ['ed4', '4 DECAY', 0.5, v => { let s = 0.005 * Math.pow(20 / 0.005, v); return s >= 1 ? s.toFixed(2) + 's' : Math.round(s * 1000) + 'ms'; }],
                ['es4', '4 SUSTAIN', 0.3, F.pct],
                ['er4', '4 RELEASE', 0.3, v => { let s = 0.005 * Math.pow(15 / 0.005, v); return s >= 1 ? s.toFixed(2) + 's' : Math.round(s * 1000) + 'ms'; }],
                ['v4', '4 VELOCITY', 0.3, F.pct],
                ['alg', 'WIRING', 0, F.pick(['1 · 4→3→2→1', '2 · 3+4→2→1', '3 · 3→2→1, 4→1', '4 · 4→3→1, 2→1', '5 · 2→1, 4→3', '6 · 4→1 2 3', '7 · 4→3, 1 2 heard', '8 · all four heard'])],
                ['fb', 'FEEDBACK', 0, F.pct],
                ['bright', 'BRIGHT', 0.5, v => { let d = Math.round((v - 0.5) * 12); return d ? (d > 0 ? '+' : '') + d + 'dB' : 'as set'; }],
                ['kl', 'KEY LEVEL', 0.3, F.pct],
                ['ks', 'KEY SPEED', 0.3, F.pct],
                ['lfr', 'LFO RATE', 0.45, v => (0.1 * Math.pow(120, v)).toFixed(2) + 'hz'],
                ['lfp', 'LFO PITCH', 0, v => Math.round(v * v * 60) + 'c'],
                ['lfa', 'LFO LOUD', 0, F.pct],
                ['lfb', 'LFO BRIGHT', 0, F.pct],
                ['lfd', 'LFO DELAY', 0.2, v => { let s = 0.01 * Math.pow(4 / 0.01, v); return s >= 1 ? s.toFixed(2) + 's' : Math.round(s * 1000) + 'ms'; }],
                ['pe', 'PITCH START', 0.5, v => { let n = Math.round((v - 0.5) * 48); return n ? (n > 0 ? '+' : '') + n + 'st' : 'none'; }],
                ['pt', 'PITCH TIME', 0.3, v => { let s = 0.003 * Math.pow(1.5 / 0.003, v); return s >= 1 ? s.toFixed(2) + 's' : Math.round(s * 1000) + 'ms'; }],
                ['oct', 'OCTAVE', 0.5, F.oct],
                ['vol', 'VOLUME', 0.75, F.pct]],
            groups: [['一 · OPERATOR 1', null, ['q1', 'dt1', 'l1', 'w1', 'v1', 'ea1', 'ed1', 'es1', 'er1']], ['二 · OPERATOR 2', null, ['q2', 'dt2', 'l2', 'w2', 'v2', 'ea2', 'ed2', 'es2', 'er2']], ['三 · OPERATOR 3', null, ['q3', 'dt3', 'l3', 'w3', 'v3', 'ea3', 'ed3', 'es3', 'er3']], ['四 · OPERATOR 4', null, ['q4', 'dt4', 'l4', 'w4', 'v4', 'ea4', 'ed4', 'es4', 'er4']], ['繋 · WIRING', null, ['alg', 'fb', 'bright', 'kl', 'ks']], ['揺 · MOVEMENT', null, ['lfr', 'lfp', 'lfa', 'lfb', 'lfd', 'pe', 'pt']], ['出 · OUT', null, ['oct', 'vol']]], selects: ['alg', 'w1', 'w2', 'w3', 'w4'],
            presets: [
                ['ガラスの鐘 // GLASS BELL', { alg: 0.562, fb: 0, bright: 0.5, kl: 0.4, ks: 0.3, oct: 0.5, vol: 0.44, pe: 0.5, pt: 0.453, lfr: 0.817, lfp: 0, lfa: 0, lfb: 0, lfd: 0.568, q1: 0.1, dt1: 0.5, l1: 1, w1: 0.125, ea1: 0.07, ed1: 0.873, es1: 0, er1: 0.776, v1: 0.2, q2: 0.38, dt2: 0.5, l2: 0.768, w2: 0.125, ea2: 0.07, ed2: 0.771, es2: 0, er2: 0.461, v2: 0.6, q3: 0.1, dt3: 0.64, l3: 0.889, w3: 0.125, ea3: 0.07, ed3: 0.82, es3: 0, er3: 0.776, v3: 0.2, q4: 0.9, dt4: 0.5, l4: 0.626, w4: 0.125, ea4: 0.07, ed4: 0.555, es4: 0, er4: 0.461, v4: 0.7 }],
                ['電気の鍵盤 // TINE PIANO', { alg: 0.562, fb: 0, bright: 0.5, kl: 0.3, ks: 0.4, oct: 0.5, vol: 0.6, pe: 0.5, pt: 0.453, lfr: 0.817, lfp: 0, lfa: 0, lfb: 0, lfd: 0.568, q1: 0.1, dt1: 0.5, l1: 1, w1: 0.125, ea1: 0.07, ed1: 0.806, es1: 0, er1: 0.531, v1: 0.3, q2: 0.1, dt2: 0.5, l2: 0.727, w2: 0.125, ea2: 0.07, ed2: 0.734, es2: 0.346, er2: 0.461, v2: 0.85, q3: 0.1, dt3: 0.6, l3: 0.869, w3: 0.125, ea3: 0.07, ed3: 0.722, es3: 0, er3: 0.531, v3: 0.3, q4: 0.9, dt4: 0.5, l4: 0.606, w4: 0.125, ea4: 0.07, ed4: 0.472, es4: 0, er4: 0.461, v4: 0.75 }],
                ['鋼の低音 // STEEL BASS', { alg: 0.062, fb: 0.4, bright: 0.5, kl: 0.1, ks: 0.3, oct: 0.25, vol: 0.53, pe: 0.5, pt: 0.453, lfr: 0.817, lfp: 0, lfa: 0, lfb: 0, lfd: 0.568, q1: 0.1, dt1: 0.5, l1: 1, w1: 0.125, ea1: 0.07, ed1: 0.722, es1: 0.775, er1: 0.346, v1: 0.2, q2: 0.1, dt2: 0.5, l2: 0.828, w2: 0.125, ea2: 0.07, ed2: 0.472, es2: 0.5, er2: 0.346, v2: 0.6, q3: 0.22, dt3: 0.5, l3: 0.606, w3: 0.125, ea3: 0.07, ed3: 0.383, es3: 0, er3: 0.346, v3: 0.3, q4: 0.1, dt4: 0.5, l4: 0.505, w4: 0.125, ea4: 0.07, ed4: 0.639, es4: 0.707, er4: 0.346, v4: 0.3 }],
                ['ネオンの刃 // NEON BLADE LEAD', { alg: 0.688, fb: 0.55, bright: 0.5, kl: 0.3, ks: 0.3, oct: 0.5, vol: 0.87, pe: 0.5, pt: 0.453, lfr: 0.837, lfp: 0.548, lfa: 0, lfb: 0, lfd: 0.653, q1: 0.1, dt1: 0.5, l1: 0.929, w1: 0.125, ea1: 0.21, ed1: 0.771, es1: 0.894, er1: 0.489, v1: 0.3, q2: 0.1, dt2: 0.68, l2: 0.889, w2: 0.125, ea2: 0.21, ed2: 0.771, es2: 0.894, er2: 0.489, v2: 0.3, q3: 0.22, dt3: 0.38, l3: 0.768, w3: 0.125, ea3: 0.21, ed3: 0.771, es3: 0.837, er3: 0.489, v3: 0.3, q4: 0.1, dt4: 0.5, l4: 0.747, w4: 0.125, ea4: 0.07, ed4: 0.688, es4: 0.775, er4: 0.489, v4: 0.5 }],
                ['闇のガラスの雲 // DARKWAVE GLASS PAD', { alg: 0.562, fb: 0, bright: 0.5, kl: 0.3, ks: 0.3, oct: 0.5, vol: 0.75, pe: 0.5, pt: 0.453, lfr: 0.229, lfp: 0.258, lfa: 0, lfb: 0.45, lfd: 0.769, q1: 0.1, dt1: 0.5, l1: 0.96, w1: 0.125, ea1: 0.808, ed1: 0.833, es1: 0.894, er1: 0.799, v1: 0.3, q2: 0.22, dt2: 0.5, l2: 0.606, w2: 0.125, ea2: 0.837, ed2: 0.833, es2: 0.775, er2: 0.799, v2: 0.2, q3: 0.1, dt3: 0.62, l3: 0.909, w3: 0.125, ea3: 0.827, ed3: 0.833, es3: 0.894, er3: 0.799, v3: 0.3, q4: 0.3, dt4: 0.5, l4: 0.525, w4: 0.125, ea4: 0.86, ed4: 0.833, es4: 0.775, er4: 0.799, v4: 0.2 }],
                ['真鍮の衝撃 // BRASS STAB', { alg: 0.062, fb: 0.3, bright: 0.5, kl: 0.3, ks: 0.3, oct: 0.5, vol: 0.58, pe: 0.469, pt: 0.482, lfr: 0.817, lfp: 0, lfa: 0, lfb: 0, lfd: 0.568, q1: 0.1, dt1: 0.5, l1: 1, w1: 0.125, ea1: 0.413, ed1: 0.528, es1: 0.837, er1: 0.489, v1: 0.3, q2: 0.1, dt2: 0.5, l2: 0.808, w2: 0.125, ea2: 0.483, ed2: 0.512, es2: 0.707, er2: 0.489, v2: 0.7, q3: 0.1, dt3: 0.5, l3: 0.556, w3: 0.125, ea3: 0.465, ed3: 0.494, es3: 0.632, er3: 0.461, v3: 0.3, q4: 0.1, dt4: 0.5, l4: 0.455, w4: 0.125, ea4: 0.07, ed4: 0.494, es4: 0.632, er4: 0.461, v4: 0.3 }],
                ['ハードの悲鳴 // HARDSTYLE SCREECH', { alg: 0.062, fb: 0.62, bright: 0.5, kl: 0.2, ks: 0.3, oct: 0.5, vol: 0.42, pe: 0.5, pt: 0.453, lfr: 0.855, lfp: 0.645, lfa: 0, lfb: 0.4, lfd: 0.269, q1: 0.1, dt1: 0.5, l1: 1, w1: 0.125, ea1: 0.14, ed1: 0.771, es1: 0.949, er1: 0.425, v1: 0.3, q2: 0.22, dt2: 0.5, l2: 0.869, w2: 0.125, ea2: 0.07, ed2: 0.771, es2: 0.922, er2: 0.425, v2: 0.4, q3: 0.34, dt3: 0.5, l3: 0.727, w3: 0.125, ea3: 0.07, ed3: 0.771, es3: 0.894, er3: 0.425, v3: 0.3, q4: 0.1, dt4: 0.5, l4: 0.707, w4: 0.125, ea4: 0.07, ed4: 0.771, es4: 0.894, er4: 0.425, v4: 0.3 }],
                ['鉄の打撃 // INDUSTRIAL CLANG', { alg: 0.438, fb: 0.5, bright: 0.5, kl: 0.2, ks: 0.3, oct: 0.5, vol: 0.72, pe: 0.583, pt: 0.305, lfr: 0.817, lfp: 0, lfa: 0, lfb: 0, lfd: 0.568, q1: 0.1, dt1: 0.5, l1: 1, w1: 0.125, ea1: 0.07, ed1: 0.626, es1: 0, er1: 0.511, v1: 0.3, q2: 0.14, dt2: 0.5, l2: 0.848, w2: 0.125, ea2: 0.07, ed2: 0.512, es2: 0, er2: 0.461, v2: 0.6, q3: 0.54, dt3: 0.5, l3: 0.727, w3: 0.125, ea3: 0.07, ed3: 0.472, es3: 0, er3: 0.461, v3: 0.6, q4: 0.34, dt4: 0.5, l4: 0.707, w4: 0.125, ea4: 0.07, ed4: 0.432, es4: 0, er4: 0.461, v4: 0.6 }],
                ['黒い木琴 // BLACK MARIMBA', { alg: 0.562, fb: 0, bright: 0.5, kl: 0.3, ks: 0.5, oct: 0.5, vol: 1, pe: 0.5, pt: 0.453, lfr: 0.817, lfp: 0, lfa: 0, lfb: 0, lfd: 0.568, q1: 0.1, dt1: 0.5, l1: 1, w1: 0.125, ea1: 0.07, ed1: 0.596, es1: 0, er1: 0.511, v1: 0.3, q2: 0.42, dt2: 0.5, l2: 0.707, w2: 0.125, ea2: 0.07, ed2: 0.334, es2: 0, er2: 0.461, v2: 0.6, q3: 0.22, dt3: 0.5, l3: 0.707, w3: 0.125, ea3: 0.07, ed3: 0.543, es3: 0, er3: 0.511, v3: 0.3, q4: 0.74, dt4: 0.5, l4: 0.556, w4: 0.125, ea4: 0.07, ed4: 0.251, es4: 0, er4: 0.461, v4: 0.6 }],
                ['聖堂のオルガン // GOTHIC ORGAN', { alg: 0.938, fb: 0.08, bright: 0.5, kl: 0.3, ks: 0.3, oct: 0.5, vol: 0.57, pe: 0.5, pt: 0.453, lfr: 0.862, lfp: 0.387, lfa: 0.12, lfb: 0, lfd: 0.5, q1: 0.02, dt1: 0.5, l1: 0.889, w1: 0.125, ea1: 0.302, ed1: 0.833, es1: 1, er1: 0.425, v1: 0, q2: 0.1, dt2: 0.5, l2: 1, w2: 0.125, ea2: 0.302, ed2: 0.833, es2: 1, er2: 0.425, v2: 0, q3: 0.22, dt3: 0.5, l3: 0.859, w3: 0.125, ea3: 0.302, ed3: 0.833, es3: 1, er3: 0.425, v3: 0, q4: 0.3, dt4: 0.5, l4: 0.768, w4: 0.125, ea4: 0.302, ed4: 0.833, es4: 1, er4: 0.425, v4: 0 }],
                ['酸のFM // ACID FM', { alg: 0.062, fb: 0.25, bright: 0.5, kl: 0.1, ks: 0.3, oct: 0.25, vol: 0.47, pe: 0.5, pt: 0.453, lfr: 0.817, lfp: 0, lfa: 0, lfb: 0, lfd: 0.568, q1: 0.1, dt1: 0.5, l1: 1, w1: 0.125, ea1: 0.07, ed1: 0.688, es1: 0.866, er1: 0.31, v1: 0.2, q2: 0.1, dt2: 0.5, l2: 0.869, w2: 0.125, ea2: 0.07, ed2: 0.432, es2: 0.316, er2: 0.31, v2: 0.95, q3: 0.1, dt3: 0.5, l3: 0.455, w3: 0.125, ea3: 0.07, ed3: 0.41, es3: 0.316, er3: 0.461, v3: 0.3, q4: 0.1, dt4: 0.5, l4: 0.505, w4: 0.125, ea4: 0.07, ed4: 0.494, es4: 0.548, er4: 0.461, v4: 0.3 }],
                ['恍惚の粒 // TRANCE PLUCK', { alg: 0.562, fb: 0.3, bright: 0.5, kl: 0.3, ks: 0.3, oct: 0.5, vol: 1, pe: 0.5, pt: 0.453, lfr: 0.817, lfp: 0, lfa: 0, lfb: 0, lfd: 0.568, q1: 0.1, dt1: 0.5, l1: 1, w1: 0.125, ea1: 0.07, ed1: 0.577, es1: 0, er1: 0.489, v1: 0.3, q2: 0.1, dt2: 0.5, l2: 0.808, w2: 0.125, ea2: 0.07, ed2: 0.41, es2: 0, er2: 0.461, v2: 0.6, q3: 0.22, dt3: 0.64, l3: 0.828, w3: 0.125, ea3: 0.07, ed3: 0.543, es3: 0, er3: 0.489, v3: 0.3, q4: 0.1, dt4: 0.5, l4: 0.758, w4: 0.125, ea4: 0.07, ed4: 0.383, es4: 0, er4: 0.461, v4: 0.6 }],
                ['鏡の合唱 // CHOIR OF MIRRORS', { alg: 0.688, fb: 0.2, bright: 0.5, kl: 0.4, ks: 0.3, oct: 0.5, vol: 1, pe: 0.5, pt: 0.453, lfr: 0.817, lfp: 0.447, lfa: 0.08, lfb: 0, lfd: 0.683, q1: 0.1, dt1: 0.5, l1: 0.929, w1: 0.125, ea1: 0.716, ed1: 0.806, es1: 0.894, er1: 0.685, v1: 0.2, q2: 0.22, dt2: 0.64, l2: 0.707, w2: 0.125, ea2: 0.731, ed2: 0.806, es2: 0.894, er2: 0.685, v2: 0.2, q3: 0.3, dt3: 0.4, l3: 0.586, w3: 0.125, ea3: 0.745, ed3: 0.806, es3: 0.837, er3: 0.685, v3: 0.2, q4: 0.1, dt4: 0.5, l4: 0.525, w4: 0.125, ea4: 0.698, ed4: 0.806, es4: 0.894, er4: 0.685, v4: 0.3 }],
                ['深い底 // DEEP FM SUB', { alg: 0.938, fb: 0, bright: 0.5, kl: 0.3, ks: 0.3, oct: 0.25, vol: 1, pe: 0.75, pt: 0.417, lfr: 0.817, lfp: 0, lfa: 0, lfb: 0, lfd: 0.568, q1: 0.1, dt1: 0.5, l1: 1, w1: 0.125, ea1: 0.07, ed1: 0.661, es1: 0.707, er1: 0.425, v1: 0.2, q2: 0.1, dt2: 0.5, l2: 0, w2: 0.125, ea2: 0.07, ed2: 0.639, es2: 0, er2: 0.461, v2: 0.3, q3: 0.1, dt3: 0.5, l3: 0, w3: 0.125, ea3: 0.07, ed3: 0.639, es3: 0, er3: 0.461, v3: 0.3, q4: 0.1, dt4: 0.5, l4: 0, w4: 0.125, ea4: 0.07, ed4: 0.639, es4: 0, er4: 0.461, v4: 0.3 }]
            ],
            draw(x, w, h, s, D) {
                x.fillStyle = '#07080b'; x.fillRect(0, 0, w, h); let g0 = x.createLinearGradient(0, 0, 0, h); g0.addColorStop(0, 'rgba(160,190,255,0.10)'); g0.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g0; x.fillRect(0, 0, w, h);
                const v = (k, d0) => s[k] == null ? d0 : s[k], A = Math.min(7, Math.floor(v('alg', 0) * 8)), CAR = CHR.CAR[A], MOD = CHR.MOD[A];
                let dep = [0, 0, 0, 0]; for (let pass = 0; pass < 4; pass++) for (let k = 0; k < 4; k++) MOD[k].forEach(j => { dep[j] = Math.max(dep[j], dep[k] + 1); });
                let rows = Math.max(...dep) + 1, wide = Math.max(...[0, 1, 2, 3].map(r => dep.filter(q => q === r).length)), bw = Math.min(wide === 1 ? 130 : wide === 2 ? 110 : 84, (w - 20) / wide - 14), gap = rows > 2 ? 6 : 12, bh = Math.min(34, (h - 34) / rows - gap), top = 16 + Math.max(0, (h - 30 - rows * (bh + gap)) / 2), pos = [];
                for (let r = 0; r < rows; r++) { let here = [3, 2, 1, 0].filter(k => dep[k] === r); here.forEach((k, i) => { pos[k] = [w / 2 + (i - (here.length - 1) / 2) * (bw + 14), top + (rows - 1 - r) * (bh + gap)]; }); }
                x.lineWidth = 1.2; x.strokeStyle = 'rgba(190,210,255,0.55)';
                for (let k = 0; k < 4; k++) MOD[k].forEach(j => { let a = pos[j], b = pos[k]; x.beginPath(); x.moveTo(a[0], a[1] + bh); x.lineTo(b[0], b[1]); x.stroke(); x.beginPath(); x.moveTo(b[0], b[1]); x.lineTo(b[0] - 3, b[1] - 5); x.lineTo(b[0] + 3, b[1] - 5); x.closePath(); x.fillStyle = 'rgba(190,210,255,0.7)'; x.fill(); });
                x.strokeStyle = D.A; x.beginPath(); x.moveTo(14, h - 9); x.lineTo(w - 14, h - 9); x.stroke(); CAR.forEach(c => { let p = pos[c - 1]; x.beginPath(); x.moveTo(p[0], p[1] + bh); x.lineTo(p[0], h - 9); x.stroke(); });
                if (v('fb', 0) > 0.01) { let p = pos[3]; x.strokeStyle = 'rgba(255,170,120,' + (0.3 + v('fb', 0) * 0.6) + ')'; x.beginPath(); x.moveTo(p[0] + bw / 2, p[1] + bh * 0.7); x.lineTo(p[0] + bw / 2 + 6, p[1] + bh * 0.7); x.lineTo(p[0] + bw / 2 + 6, p[1] - 4); x.lineTo(p[0], p[1] - 4); x.lineTo(p[0], p[1]); x.stroke(); }
                for (let k = 0; k < 4; k++) { let p = pos[k], X0 = p[0] - bw / 2, Y0 = p[1], L = v('l' + (k + 1), k ? 0 : 0.9), car = CAR.indexOf(k + 1) >= 0;
                    x.fillStyle = '#10131a'; x.fillRect(X0, Y0, bw, bh); x.fillStyle = car ? 'rgba(120,255,220,0.16)' : 'rgba(150,170,255,0.16)'; x.fillRect(X0, Y0 + bh * (1 - L), bw, bh * L);
                    let ea = v('ea' + (k + 1), 0), ed = v('ed' + (k + 1), 0.5), es = v('es' + (k + 1), car ? 0.7 : 0.3), er = v('er' + (k + 1), 0.3), tot = 0.15 + ea + ed + 0.25 + er, X = t2 => X0 + 3 + t2 / tot * (bw - 6), Y = a => Y0 + bh - 3 - a * (bh - 8);
                    x.strokeStyle = L > 0.001 ? (car ? '#8fffe0' : '#b8c4ff') : 'rgba(255,255,255,0.18)'; x.lineWidth = 1; x.beginPath(); x.moveTo(X(0), Y(0)); x.lineTo(X(ea + 0.02), Y(1)); x.lineTo(X(ea + ed + 0.1), Y(es * es)); x.lineTo(X(ea + ed + 0.35), Y(es * es)); x.lineTo(X(tot), Y(0)); x.stroke();
                    x.strokeStyle = car ? 'rgba(143,255,224,0.6)' : 'rgba(184,196,255,0.5)'; x.strokeRect(X0 + 0.5, Y0 + 0.5, bw - 1, bh - 1);
                    x.font = 'bold 9px Courier New'; x.fillStyle = '#e8eeff'; x.fillText(String(k + 1), X0 + 3, Y0 + 9); x.font = '8px Courier New'; x.fillStyle = 'rgba(232,238,255,0.7)'; let rt = '×' + CHR.RAT[Math.min(CHR.RAT.length - 1, Math.floor(v('q' + (k + 1), 0.1) * CHR.RAT.length))]; x.fillText(rt, X0 + bw - 3 - x.measureText(rt).width, Y0 + 9); }
                x.font = 'bold 9px Courier New'; x.fillStyle = '#cfe0ff'; let t1 = 'CHROME · WIRING ' + (A + 1) + (v('fb', 0) > 0.01 ? ' · FEEDBACK ' + Math.round(v('fb', 0) * 100) + '%' : ''); x.fillText(x.measureText(t1).width < w - 12 ? t1 : 'WIRING ' + (A + 1), 6, 11);
                x.font = '8px Courier New'; x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillText('heard', w - 34, h - 12);
            } },
        { id: 'parlour', jp: '鍵盤', en: 'PARLOUR', sub: 'pianos. grand, upright, two electric pianos, a celesta, a clav', kind: 'poly', part: 'nb_parlour', face: 'velvet',
            p: [['model', 'MODEL', 0, F.pick(['GRAND', 'UPRIGHT', 'TINE', 'REED', 'CELESTA', 'CLAV'])], ['hard', 'HAMMER', 0.5, F.pct], ['tone', 'TONE', 0.5, F.pct], ['decay', 'RING', 0.5, v => 'x' + Math.pow(4, v * 2 - 1).toFixed(2)],
                ['detune', 'STRINGS APART', 0.15, v => (0.25 + v * v * 14).toFixed(1) + 'c'], ['stretch', 'STIFFNESS', 0.4, F.pct], ['pedal', 'PEDAL', 0, v => v < 0.02 ? 'down' : v > 0.98 ? 'held' : Math.round(v * 100) + '%'],
                ['body', 'BODY', 0.5, F.pct], ['noise', 'MECHANICS', 0.25, F.pct], ['bark', 'BARK', 0.3, F.pct], ['trem', 'TREMOLO', 0, F.pct], ['trate', 'TREM RATE', 0.45, v => (Math.pow(2, v * 4 - 1) * 2).toFixed(1) + 'hz'],
                ['wide', 'WIDTH', 0.4, F.pct], ['oct', 'OCTAVE', 0.5, F.oct], ['vol', 'VOLUME', 0.75, F.pct]],
            groups: [['型 · MODEL', null, ['model', 'hard', 'tone', 'bark']], ['弦 · STRINGS', null, ['decay', 'detune', 'stretch', 'pedal']], ['箱 · BODY', null, ['body', 'noise', 'wide', 'trem', 'trate']], ['出 · OUT', null, ['oct', 'vol']]], selects: ['model'],
            presets: [
                ['客間のグランド // PARLOUR GRAND', { model: 0.083, hard: 0.5, tone: 0.5, decay: 0.5, detune: 0.15, stretch: 0.4, pedal: 0, body: 0.5, noise: 0.25, bark: 0.3, trem: 0, trate: 0.45, wide: 0.4, vol: 0.75 }],
                ['古いアップライト // OLD UPRIGHT', { model: 0.25, hard: 0.5, tone: 0.4, decay: 0.5, detune: 0.35, stretch: 0.4, pedal: 0, body: 0.7, noise: 0.4, bark: 0.3, trem: 0, trate: 0.45, wide: 0.4, vol: 0.9 }],
                ['酒場の調子外れ // HONKY TONK', { model: 0.25, hard: 0.6, tone: 0.55, decay: 0.5, detune: 0.85, stretch: 0.4, pedal: 0, body: 0.5, noise: 0.25, bark: 0.3, trem: 0, trate: 0.45, wide: 0.4, vol: 1 }],
                ['闇のグランド // DARKWAVE GRAND', { model: 0.083, hard: 0.3, tone: 0.3, decay: 0.65, detune: 0.15, stretch: 0.4, pedal: 0.7, body: 0.5, noise: 0.25, bark: 0.3, trem: 0, trate: 0.45, wide: 0.7, vol: 0.75 }],
                ['聖堂の鍵盤 // GOTHIC CATHEDRAL KEYS', { model: 0.083, hard: 0.6, tone: 0.5, decay: 0.8, detune: 0.15, stretch: 0.4, pedal: 1, body: 0.7, noise: 0.25, bark: 0.3, trem: 0, trate: 0.45, wide: 0.8, vol: 0.6 }],
                ['恍惚のピアノ // TRANCE PIANO', { model: 0.083, hard: 0.8, tone: 0.75, decay: 0.5, detune: 0.15, stretch: 0.55, pedal: 0, body: 0.5, noise: 0.25, bark: 0.3, trem: 0, trate: 0.45, wide: 0.6, vol: 0.75 }],
                ['電気の鍵 // TINE KEYS', { model: 0.417, hard: 0.45, tone: 0.5, decay: 0.5, detune: 0.15, stretch: 0.4, pedal: 0, body: 0.5, noise: 0.25, bark: 0.35, trem: 0.3, trate: 0.45, wide: 0.4, vol: 0.75 }],
                ['ネオンの吠え // NEON TINE BARK', { model: 0.417, hard: 0.8, tone: 0.65, decay: 0.5, detune: 0.15, stretch: 0.4, pedal: 0, body: 0.5, noise: 0.25, bark: 0.8, trem: 0.5, trate: 0.6, wide: 0.4, vol: 1 }],
                ['リードの鍵 // REED KEYS', { model: 0.583, hard: 0.5, tone: 0.5, decay: 0.5, detune: 0.15, stretch: 0.4, pedal: 0, body: 0.5, noise: 0.25, bark: 0.5, trem: 0.4, trate: 0.5, wide: 0.4, vol: 0.75 }],
                ['汚れたリード // DIRTY REED', { model: 0.583, hard: 0.9, tone: 0.6, decay: 0.5, detune: 0.15, stretch: 0.4, pedal: 0, body: 0.5, noise: 0.25, bark: 1, trem: 0.2, trate: 0.45, wide: 0.4, vol: 1 }],
                ['硝子の鉄琴 // GLASS CELESTA', { model: 0.75, hard: 0.5, tone: 0.6, decay: 0.6, detune: 0.15, stretch: 0.4, pedal: 0, body: 0.5, noise: 0.25, bark: 0.3, trem: 0, trate: 0.45, wide: 0.4, vol: 0.95 }],
                ['呪いの鉄琴 // CURSED CELESTA', { model: 0.75, hard: 0.35, tone: 0.3, decay: 0.85, detune: 0.15, stretch: 0.4, pedal: 0, body: 0.5, noise: 0.5, bark: 0.3, trem: 0, trate: 0.45, wide: 0.4, vol: 0.75 }],
                ['跳ねるクラヴ // CLAV', { model: 0.917, hard: 0.7, tone: 0.7, decay: 0.45, detune: 0.15, stretch: 0.4, pedal: 0, body: 0.5, noise: 0.25, bark: 0.3, trem: 0, trate: 0.45, wide: 0.4, vol: 0.85 }],
                ['工場のクラヴ // INDUSTRIAL CLAV', { model: 0.917, hard: 1, tone: 0.9, decay: 0.3, detune: 0.15, stretch: 0.4, pedal: 0, body: 0.5, noise: 0.6, bark: 0.3, trem: 0, trate: 0.45, wide: 0.4, vol: 1 }]
            ],
            draw(x, w, h, s, D) {
                x.fillStyle = '#0a0608'; x.fillRect(0, 0, w, h); let g0 = x.createRadialGradient(w * 0.5, h * 1.2, 4, w * 0.5, h * 1.2, w * 0.7); g0.addColorStop(0, 'rgba(180,60,90,0.20)'); g0.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g0; x.fillRect(0, 0, w, h);
                const v = (k, d0) => s[k] == null ? d0 : s[k], md = Math.min(5, Math.floor(v('model', 0) * 6)), hard = Math.min(1, v('hard', 0.5) * 0.6 + 0.45), kb = 14, top = 16, bot = h - kb - 6, X = r => 8 + Math.log(r) / Math.log(18) * (w - 16);
                x.strokeStyle = 'rgba(255,255,255,0.08)'; x.lineWidth = 1; for (let n = 1; n <= 16; n++) { x.beginPath(); x.moveTo(X(n), top); x.lineTo(X(n), bot); x.stroke(); }
                let parts = [];
                if (md <= 1 || md === 5) { const B = (0.08 + 0.5 * v('stretch', 0.4)) * 0.0009 * (md === 5 ? 0.4 : 1), pos = md === 5 ? 1 / 4.5 : 1 / 8.3, br = 2 + hard * 10 * (md === 5 ? 1.6 : 1) * (0.5 + v('tone', 0.5));
                    for (let n = 1; n <= 16; n++) parts.push([n * Math.sqrt(1 + B * n * n * 40), Math.abs(Math.sin(Math.PI * n * pos)) / (1 + Math.pow(n / br, 2)) * 1.6, Math.pow(0.82 - (md === 1 ? 0.06 : 0) - (1 - v('tone', 0.5)) * 0.1, n)]); }
                else { const BB = md === 2 ? [[1, 1, 1], [2, 0.08, 0.3], [7.1, 0.25 * hard, 0.05], [3.01, 0.03, 0.15]] : md === 3 ? [[1, 1, 1], [2, 0.18, 0.4], [3, 0.12, 0.2], [5.1, 0.06 * hard, 0.03]] : [[1, 1, 1], [2.76, 0.3, 0.25], [5.4, 0.18 * hard, 0.06], [8.93, 0.08 * hard, 0.03]];
                    BB.forEach(q => parts.push([q[0], q[1], q[2]])); if (md === 2 || md === 3) for (let n = 2; n <= 6; n++) parts.push([n, v('bark', 0.3) * 0.5 / n, 0.5]); }
                let mx = Math.max(...parts.map(q => q[1])) || 1;
                parts.forEach(([r, a, life]) => { if (r > 17.5) return; let hh = Math.pow(a / mx, 0.6) * (bot - top), xx = X(r); x.fillStyle = D.A; x.globalAlpha = 0.25 + 0.7 * Math.min(1, life); x.fillRect(xx - 2, bot - hh, 4, hh); x.globalAlpha = 0.15; x.fillRect(xx - 5, bot - hh, 10, hh); });
                x.globalAlpha = 1;
                let kw = (w - 16) / 52, wi = 0; for (let m2 = 21; m2 <= 108; m2++) { let pc = m2 % 12, blk = [1, 3, 6, 8, 10].indexOf(pc) >= 0; if (blk) continue; let pan = md <= 1 ? Math.max(-1, Math.min(1, (m2 - 64) / 30)) * v('wide', 0.4) : 0;
                    x.fillStyle = 'rgb(' + Math.round(220 - Math.max(0, pan) * 60) + ',' + Math.round(214 - Math.abs(pan) * 40) + ',' + Math.round(220 - Math.max(0, -pan) * 60) + ')'; x.fillRect(8 + wi * kw, h - kb - 2, kw - 1, kb); wi++; }
                wi = 0; for (let m2 = 21; m2 <= 108; m2++) { let pc = m2 % 12; if ([1, 3, 6, 8, 10].indexOf(pc) >= 0) { x.fillStyle = '#111'; x.fillRect(8 + wi * kw - kw * 0.3, h - kb - 2, kw * 0.6, kb * 0.6); } else wi++; }
                const NM = ['GRAND', 'UPRIGHT', 'TINE', 'REED', 'CELESTA', 'CLAV'][md], ped = v('pedal', 0);
                x.font = 'bold 9px Courier New'; x.fillStyle = '#ffd6e2'; let t1 = 'PARLOUR · ' + NM + (md <= 1 || md === 5 ? ' · stiffness ' + Math.round(v('stretch', 0.4) * 100) + '%' : ' · bark ' + Math.round(v('bark', 0.3) * 100) + '%') + (ped > 0.02 ? ' · PEDAL' : '');
                x.fillText(x.measureText(t1).width < w - 12 ? t1 : 'PARLOUR · ' + NM, 6, 11);
            } },
        { id: 'sinew', jp: '腱', en: 'SINEW', sub: 'strings. violin + cello, bowed or plucked, or the old string machine', kind: 'poly', part: 'nb_sinew', face: 'satin',
            p: [['model', 'MODEL', 0, F.pick(['VIOLIN', 'CELLO', 'SECTION', 'ENSEMBLE', 'PIZZ'])], ['att', 'BOW IN', 0.3, v => { let s = 0.005 + 2.5 * Math.pow(v, 2); return s >= 1 ? s.toFixed(2) + 's' : Math.round(s * 1000) + 'ms'; }], ['rel', 'BOW OFF', 0.3, v => { let s = 0.03 + 3 * Math.pow(v, 2); return s >= 1 ? s.toFixed(2) + 's' : Math.round(s * 1000) + 'ms'; }], ['press', 'PRESSURE', 0.5, F.pct],
                ['spot', 'BOW SPOT', 0.35, v => v < 0.2 ? 'over the fingerboard' : v > 0.8 ? 'by the bridge' : Math.round(v * 100) + '%'], ['vib', 'VIBRATO', 0.3, F.pct], ['vrate', 'VIB RATE', 0.4, v => (4.5 + v * 3).toFixed(1) + 'hz'], ['vdelay', 'VIB LATE', 0.35, v => Math.round((0.1 + v * 0.8) * 1000) + 'ms'],
                ['spread', 'SPREAD', 0.3, v => (v * 12).toFixed(1) + 'c'], ['body', 'BODY', 0.5, F.pct], ['tone', 'TONE', 0.5, F.pct], ['wide', 'WIDTH', 0.5, F.pct], ['oct', 'OCTAVE', 0.5, F.oct], ['vol', 'VOLUME', 0.75, F.pct]],
            groups: [['型 · MODEL', null, ['model', 'tone', 'body']], ['弓 · BOW', null, ['att', 'rel', 'press', 'spot']], ['揺 · VIBRATO', null, ['vib', 'vrate', 'vdelay']], ['群 · SECTION', null, ['spread', 'wide']], ['出 · OUT', null, ['oct', 'vol']]], selects: ['model'],
            presets: [
                ['独奏のヴァイオリン // SOLO VIOLIN', { model: 0.1, att: 0.25, rel: 0.3, press: 0.5, spot: 0.35, vib: 0.4, vrate: 0.4, vdelay: 0.35, spread: 0.3, body: 0.5, tone: 0.5, wide: 0.5, oct: 0.5, vol: 0.75 }],
                ['嘆きのチェロ // WEEPING CELLO', { model: 0.3, att: 0.35, rel: 0.3, press: 0.55, spot: 0.35, vib: 0.45, vrate: 0.4, vdelay: 0.35, spread: 0.3, body: 0.7, tone: 0.5, wide: 0.5, oct: 0.25, vol: 0.62 }],
                ['聖堂の弦 // CATHEDRAL SECTION', { model: 0.5, att: 0.5, rel: 0.55, press: 0.5, spot: 0.35, vib: 0.35, vrate: 0.4, vdelay: 0.35, spread: 0.4, body: 0.5, tone: 0.5, wide: 0.8, oct: 0.5, vol: 0.65 }],
                ['ゴスの合奏 // GOTHIC SECTION', { model: 0.5, att: 0.35, rel: 0.3, press: 0.65, spot: 0.2, vib: 0.3, vrate: 0.4, vdelay: 0.35, spread: 0.3, body: 0.5, tone: 0.4, wide: 0.7, oct: 0.5, vol: 0.75 }],
                ['闇の弦楽機 // DARKWAVE STRING MACHINE', { model: 0.7, att: 0.45, rel: 0.5, press: 0.5, spot: 0.35, vib: 0.15, vrate: 0.4, vdelay: 0.35, spread: 0.3, body: 0.5, tone: 0.4, wide: 0.8, oct: 0.5, vol: 0.75 }],
                ['恍惚の弦 // TRANCE STRINGS', { model: 0.7, att: 0.25, rel: 0.4, press: 0.5, spot: 0.35, vib: 0.1, vrate: 0.4, vdelay: 0.35, spread: 0.3, body: 0.5, tone: 0.65, wide: 1, oct: 0.5, vol: 0.75 }],
                ['八十年代の弦 // 80S STRING MACHINE', { model: 0.7, att: 0.3, rel: 0.45, press: 0.5, spot: 0.35, vib: 0.2, vrate: 0.4, vdelay: 0.35, spread: 0.5, body: 0.5, tone: 0.55, wide: 0.7, oct: 0.5, vol: 0.75 }],
                ['橋の上 // SUL PONTICELLO', { model: 0.1, att: 0.4, rel: 0.3, press: 0.65, spot: 1, vib: 0.08, vrate: 0.4, vdelay: 0.35, spread: 0.3, body: 0.5, tone: 0.7, wide: 0.5, oct: 0.5, vol: 0.75 }],
                ['震える弓 // TREMBLING BOW', { model: 0.5, att: 0.05, rel: 0.3, press: 0.6, spot: 0.35, vib: 0.8, vrate: 0.9, vdelay: 0, spread: 0.3, body: 0.5, tone: 0.5, wide: 0.8, oct: 0.5, vol: 0.75 }],
                ['短い弓 // STACCATO SECTION', { model: 0.5, att: 0.02, rel: 0.08, press: 0.6, spot: 0.35, vib: 0.1, vrate: 0.4, vdelay: 0.35, spread: 0.25, body: 0.5, tone: 0.5, wide: 0.5, oct: 0.5, vol: 0.75 }],
                ['低い唸り // CELLO DRONE', { model: 0.3, att: 0.8, rel: 0.7, press: 0.8, spot: 0.35, vib: 0.05, vrate: 0.4, vdelay: 0.35, spread: 0.3, body: 0.6, tone: 0.5, wide: 0.5, oct: 0.25, vol: 0.55 }],
                ['つま弾き // PIZZICATO', { model: 0.9, att: 0.3, rel: 0.35, press: 0.5, spot: 0.35, vib: 0.3, vrate: 0.4, vdelay: 0.35, spread: 0.3, body: 0.6, tone: 0.5, wide: 0.5, oct: 0.5, vol: 1 }]
            ],
            draw(x, w, h, s, D) {
                x.fillStyle = '#0b0709'; x.fillRect(0, 0, w, h); let g0 = x.createLinearGradient(0, 0, w, 0); g0.addColorStop(0, 'rgba(220,120,160,0.10)'); g0.addColorStop(1, 'rgba(120,40,80,0.04)'); x.fillStyle = g0; x.fillRect(0, 0, w, h);
                const v = (k, d0) => s[k] == null ? d0 : s[k], md = Math.min(4, Math.floor(v('model', 0) * 5)), NM = ['VIOLIN', 'CELLO', 'SECTION', 'ENSEMBLE', 'PIZZ'][md], sy = h - 22, X0 = 14, X1 = w - 14;
                x.strokeStyle = 'rgba(255,230,240,0.55)'; x.lineWidth = 1; x.beginPath(); x.moveTo(X0, sy); x.lineTo(X1, sy); x.stroke();
                x.fillStyle = '#d9b48c'; x.fillRect(X0 - 4, sy - 6, 4, 12); x.fillRect(X1, sy - 8, 4, 16);
                if (md <= 2) { const beta = 0.05 + v('spot', 0.35) * 0.25, bx = X1 - beta * (X1 - X0), th = 2 + v('press', 0.5) * 6;
                    x.fillStyle = D.A; x.globalAlpha = 0.85; x.fillRect(bx - th / 2, sy - 14, th, 20); x.globalAlpha = 1;
                    const top = 18, bot = sy - 24, mid = (top + bot) / 2; x.strokeStyle = '#ffd6e6'; x.lineWidth = 1.4; x.beginPath();
                    for (let c2 = 0; c2 < 3; c2++) { const a = X0 + (X1 - X0) * c2 / 3, b = a + (X1 - X0) / 3, sl = a + (b - a) * (1 - beta); if (!c2) x.moveTo(a, mid - 8); x.lineTo(sl, mid - 8); x.lineTo(sl + 2, bot); x.lineTo(b - 2, bot); x.lineTo(b, mid - 8); }
                    x.stroke(); x.fillStyle = 'rgba(255,255,255,0.35)'; x.font = '8px Courier New'; x.fillText('stick', X0 + 4, mid - 11); x.fillText('slip', X0 + (X1 - X0) / 3 * (1 - beta) + 5, bot + 9); }
                else if (md === 3) { for (let j = 0; j < 3; j++) { x.strokeStyle = ['#ff9ac0', '#c49aff', '#9ad8ff'][j]; x.beginPath(); for (let i = 0; i <= 80; i++) { const u = i / 80, yy = 50 + Math.sin(2 * Math.PI * (u + j / 3)) * 18 * 0.7 + Math.sin(2 * Math.PI * (u * 10.8 + j / 3)) * 18 * 0.3; i ? x.lineTo(X0 + u * (X1 - X0), yy) : x.moveTo(X0, yy); } x.stroke(); } }
                else { const px = X0 + (X1 - X0) * 0.75; x.strokeStyle = D.A; x.beginPath(); x.moveTo(X0, sy); x.lineTo(px, sy - 22); x.lineTo(X1, sy); x.stroke(); }
                x.font = 'bold 9px Courier New'; x.fillStyle = '#ffe0ec'; let t1 = 'SINEW · ' + NM + (md <= 2 ? ' · pressure ' + Math.round(v('press', 0.5) * 100) + '% · vibrato ' + Math.round(v('vib', 0.3) * 100) + '%' : '');
                x.fillText(x.measureText(t1).width < w - 12 ? t1 : 'SINEW · ' + NM, 6, 11);
            } },
        { id: 'brazen', jp: '喇叭', en: 'BRAZEN', sub: 'brass. trumpet + horn, a section, the 80s synth brass + the stab', kind: 'poly', part: 'nb_brazen', face: 'latex',
            p: [['model', 'MODEL', 0, F.pick(['TRUMPET', 'HORN', 'SECTION', 'SYNTH', 'STAB'])], ['att', 'ATTACK', 0.25, F.pct], ['rel', 'RELEASE', 0.25, v => { let s = 0.02 + 2 * Math.pow(v, 2); return s >= 1 ? s.toFixed(2) + 's' : Math.round(s * 1000) + 'ms'; }], ['edge', 'EDGE', 0.5, F.pct], ['tone', 'HUMP', 0.5, F.pct],
                ['breath', 'BREATH', 0.2, F.pct], ['scoop', 'SCOOP', 0.2, v => Math.round(v * 200) + 'c'], ['vib', 'VIBRATO', 0.2, F.pct], ['vrate', 'VIB RATE', 0.4, v => (4.8 + v * 2.5).toFixed(1) + 'hz'], ['vdelay', 'VIB LATE', 0.4, v => Math.round((0.15 + v * 0.8) * 1000) + 'ms'],
                ['spread', 'SPREAD', 0.3, v => (v * 14).toFixed(1) + 'c'], ['wide', 'WIDTH', 0.5, F.pct], ['oct', 'OCTAVE', 0.5, F.oct], ['vol', 'VOLUME', 0.75, F.pct]],
            groups: [['型 · MODEL', null, ['model', 'tone', 'edge']], ['息 · BREATH', null, ['att', 'rel', 'breath', 'scoop']], ['揺 · VIBRATO', null, ['vib', 'vrate', 'vdelay']], ['群 · SECTION', null, ['spread', 'wide']], ['出 · OUT', null, ['oct', 'vol']]], selects: ['model'],
            presets: [
                ['ネオンのトランペット // NEON TRUMPET', { model: 0.1, att: 0.25, rel: 0.25, edge: 0.7, tone: 0.65, breath: 0.2, scoop: 0.15, vib: 0.35, vrate: 0.55, vdelay: 0.3, spread: 0.3, wide: 0.5, oct: 0.5, vol: 0.75, _fx: [{ type: 'echo', p: { time: 0.4, fb: 0.25, mix: 0.18, hc: 0.7 } }] }],
                ['葬送のホルン // FUNERAL HORN', { model: 0.3, att: 0.55, rel: 0.6, edge: 0.25, tone: 0.2, breath: 0.4, scoop: 0.1, vib: 0.1, vrate: 0.1, vdelay: 0.8, spread: 0.3, wide: 0.5, oct: 0.25, vol: 0.75, _fx: [{ type: 'hollow', p: { mode: 0.6, size: 0.8, decay: 0.65, mix: 0.35, damp: 0.6 } }] }],
                ['聖堂の金管 // CATHEDRAL BRASS', { model: 0.5, att: 0.5, rel: 0.7, edge: 0.55, tone: 0.5, breath: 0.2, scoop: 0.2, vib: 0.15, vrate: 0.4, vdelay: 0.4, spread: 0.65, wide: 1, oct: 0.5, vol: 0.75, _fx: [{ type: 'hollow', p: { mode: 0.6, size: 1, decay: 0.85, pre: 0.25, mix: 0.5, damp: 0.3 } }] }],
                ['暗黒の金管 // DARK BRASS SECTION', { model: 0.5, att: 0.3, rel: 0.35, edge: 0.3, tone: 0.1, breath: 0.35, scoop: 0.2, vib: 0.05, vrate: 0.4, vdelay: 0.4, spread: 0.45, wide: 0.7, oct: 0.25, vol: 0.4, _fx: [{ type: 'sieve', p: { mode: 0, cut: 0.55, res: 0.25, drive: 0.1, mix: 1 } }] }],
                ['ハードの金管ヒット // HARDSTYLE BRASS HIT', { model: 0.9, att: 0, rel: 0.06, edge: 1, tone: 0.75, breath: 0.2, scoop: 0, vib: 0, vrate: 0.4, vdelay: 0.4, spread: 0.85, wide: 1, oct: 0.5, vol: 0.85, _fx: [{ type: 'vice', p: { thr: 0.55, ratio: 0.5, att: 0.05, make: 0.27, sat: 0.6, char: 0.8, autog: 1 } }] }],
                ['恍惚の金管 // TRANCE BRASS STAB', { model: 0.9, att: 0.05, rel: 0.4, edge: 0.75, tone: 0.7, breath: 0.2, scoop: 0.2, vib: 0, vrate: 0.4, vdelay: 0.4, spread: 0.6, wide: 1, oct: 0.75, vol: 0.75, _fx: [{ type: 'echo', p: { style: 1, time: 0.5, feel: 0.5, fb: 0.45, mix: 0.3 } }, { type: 'hollow', p: { mode: 0.6, size: 0.7, decay: 0.55, mix: 0.25 } }] }],
                ['八十年代の金管 // 80S SYNTH BRASS', { model: 0.7, att: 0.45, rel: 0.35, edge: 0.55, tone: 0.55, breath: 0.2, scoop: 0.2, vib: 0.15, vrate: 0.3, vdelay: 0.6, spread: 0.35, wide: 0.7, oct: 0.5, vol: 0.75, _fx: [{ type: 'tide', p: { mix: 0.35 } }] }],
                ['サイバーの角笛 // CYBER HORN', { model: 0.7, att: 0.12, rel: 0.3, edge: 0.95, tone: 0.15, breath: 0.2, scoop: 0.65, vib: 0, vrate: 0.4, vdelay: 0.4, spread: 0.15, wide: 0.4, oct: 0.25, vol: 0.45, _fx: [{ type: 'shatter', p: { bits: 0.4, down: 0.45, drive: 0.3, mix: 0.6 } }] }],
                ['弱音器のトランペット // MUTED TRUMPET', { model: 0.1, att: 0.3, rel: 0.3, edge: 0.12, tone: 0.9, breath: 0.55, scoop: 0.3, vib: 0.4, vrate: 0.6, vdelay: 0.25, spread: 0.3, wide: 0.5, oct: 0.5, vol: 0.75, _fx: [{ type: 'sieve', p: { mode: 0.3, cut: 0.68, res: 0.45, mix: 1 } }] }],
                ['吹きすぎ // BLOWN OUT', { model: 0.1, att: 0.25, rel: 0.25, edge: 1, tone: 0.75, breath: 0.45, scoop: 0.55, vib: 0.55, vrate: 0.9, vdelay: 0.15, spread: 0.3, wide: 0.5, oct: 0.75, vol: 0.4, _fx: [{ type: 'sieve', p: { mode: 0.85, cut: 0.8, drive: 0.55, mix: 0.8 } }] }],
                ['低いうねり // LOW HORN SWELL', { model: 0.3, att: 0.95, rel: 0.75, edge: 0.85, tone: 0.8, breath: 0.15, scoop: 0.2, vib: 0.3, vrate: 0.2, vdelay: 0.9, spread: 0.3, wide: 0.5, oct: 0.25, vol: 0.75, _fx: [{ type: 'hollow', p: { mode: 0.6, size: 0.6, decay: 0.5, mix: 0.25 } }] }],
                ['工業の警笛 // INDUSTRIAL SIREN HORN', { model: 0.9, att: 0.2, rel: 0.5, edge: 1, tone: 0.05, breath: 0.2, scoop: 1, vib: 0.6, vrate: 1, vdelay: 0, spread: 1, wide: 0.6, oct: 0.25, vol: 0.45, _fx: [{ type: 'shatter', p: { bits: 0.3, down: 0.6, drive: 0.6, mix: 0.5 } }, { type: 'hollow', p: { mode: 0.95, size: 0.5, decay: 0.4, mix: 0.3 } }] }]
            ],
            draw(x, w, h, s, D) {
                x.fillStyle = '#0a0806'; x.fillRect(0, 0, w, h); let g0 = x.createRadialGradient(w * 0.5, h * 1.1, 4, w * 0.5, h * 1.1, w * 0.6); g0.addColorStop(0, 'rgba(255,190,80,0.16)'); g0.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g0; x.fillRect(0, 0, w, h);
                const v = (k, d0) => s[k] == null ? d0 : s[k], md = Math.min(4, Math.floor(v('model', 0) * 5)), NM = ['TRUMPET', 'HORN', 'SECTION', 'SYNTH', 'STAB'][md], top = 16, bot = h - 8;
                if (md <= 2) { const f = 233, F = (md === 1 ? 450 : 1250) * Math.pow(2, (v('tone', 0.5) - 0.5) * 1.5), b = 0.12 + v('edge', 0.5) * 0.3 * (md === 1 ? 0.7 : 1), H = 32, bw = (w - 16) / H;
                    let W = []; for (let n = 1; n <= H; n++) { const lg = Math.log2(n * f / F); W.push(Math.pow(n, -0.6) * (1 + 2.5 * Math.exp(-lg * lg / 0.8))); }
                    const draw = (L, col, al) => { x.fillStyle = col; x.globalAlpha = al; let mx = 0, A = W.map((q, i) => { let a = q * Math.pow(L, 1 + b * i); mx = Math.max(mx, a); return a; }); A.forEach((a, i) => { let hh = Math.max(1, (Math.log10(a / mx + 1e-4) + 4) / 4 * (bot - top)); x.fillRect(8 + i * bw + 1, bot - hh, bw - 2, hh); }); x.globalAlpha = 1; };
                    draw(1, D.A, 0.95); draw(0.3, '#ffe8c0', 0.85);
                    x.font = '8px Courier New'; x.fillStyle = D.A; x.fillText('blown hard', w - 62, top + 8); x.fillStyle = '#ffe8c0'; x.fillText('soft', w - 62, top + 18); }
                else { const at = md === 4 ? 0.004 : 0.008 + Math.pow(v('att', 0.25), 2) * 1.5, fat = md === 4 ? 0.004 : at * 1.6 + 0.02, fdt = md === 4 ? 0.09 : 0.35, fs = md === 4 ? 0.15 : 0.55, span = 0.8, X = t => 8 + t / span * (w - 16), Y = a => bot - a * (bot - top);
                    x.strokeStyle = 'rgba(255,255,255,0.4)'; x.lineWidth = 1; x.beginPath(); for (let i = 0; i <= 100; i++) { const t = i / 100 * span, a = 1 - Math.exp(-3 * t / at); i ? x.lineTo(X(t), Y(a)) : x.moveTo(X(t), Y(a)); } x.stroke();
                    x.strokeStyle = D.A; x.lineWidth = 1.6; x.beginPath(); for (let i = 0; i <= 100; i++) { const t = i / 100 * span, a = t < fat ? 1 - Math.exp(-3 * t / fat) : fs + (1 - fs) * Math.exp(-3 * (t - fat) / fdt); i ? x.lineTo(X(t), Y(a)) : x.moveTo(X(t), Y(a)); } x.stroke();
                    x.font = '8px Courier New'; x.fillStyle = D.A; x.fillText('the filter', w - 60, top + 8); x.fillStyle = 'rgba(255,255,255,0.5)'; x.fillText('loudness', w - 60, top + 18); }
                x.font = 'bold 9px Courier New'; x.fillStyle = '#ffe2b8'; let t1 = 'BRAZEN · ' + NM + ' · edge ' + Math.round(v('edge', 0.5) * 100) + '%'; x.fillText(x.measureText(t1).width < w - 12 ? t1 : 'BRAZEN · ' + NM, 6, 11);
            } },
        { id: 'maw', jp: '喰', en: 'MAW', sub: 'sampler + slicer. LOAD a sound or drop it on the screen. KEYS plays it across the keyboard (FIND ITS NOTE tunes it), SLICES chops it, one slice per key from middle C (EVEN or at the HITS). drag on the screen to pick the part it uses. CHOKE = a new slice cuts off the last', kind: 'poly', part: 'nb_maw', face: 'tape',
            p: [['mode', 'MODE', 0, F.pick(['KEYS', 'SLICES'])], ['st', 'START', 0, F.pct], ['en', 'END', 1, F.pct], ['loop', 'LOOP', 0, F.pick(['off', 'on'])], ['lst', 'LOOP FROM', 0.5, F.pct], ['rev', 'REVERSE', 0, F.pick(['off', 'on'])],
                ['att', 'ATTACK', 0.02, v => Math.round((0.001 + v * v * 2) * 1000) + 'ms'], ['rel', 'RELEASE', 0.2, v => Math.round((0.005 + v * v * 4) * 1000) + 'ms'], ['tune', 'TUNE', 0.5, v => { let n = Math.round((v - 0.5) * 48); return (n > 0 ? '+' : '') + n + 'st'; }],
                ['fine', 'FINE', 0.5, v => { let c = Math.round((v - 0.5) * 100); return (c > 0 ? '+' : '') + c + 'c'; }], ['cut', 'FILTER', 1, v => v > 0.99 ? 'open' : F.hz(60, 18000)(v)], ['res', 'RESONANCE', 0.1, F.pct], ['velv', 'VEL → LOUD', 0.6, F.pct],
                ['slices', 'SLICES', 0.6, F.pick(['2', '4', '8', '12', '16', '24', '32', '64'])], ['by', 'CUT BY', 0.75, F.pick(['EVEN', 'HITS'])], ['choke', 'CHOKE', 0.75, F.pick(['off', 'on'])], ['gate', 'PLAYS', 0.25, F.pick(['the whole slice', 'while held'])],
                ['oct', 'OCTAVE', 0.5, F.oct], ['vol', 'VOLUME', 0.75, F.pct]],
            groups: [['喰 · THE SOUND', null, ['mode', 'st', 'en', 'rev']], ['輪 · LOOP', null, ['loop', 'lst']], ['切 · SLICES', null, ['slices', 'by', 'choke', 'gate']], ['形 · SHAPE', null, ['att', 'rel', 'cut', 'res', 'velv']], ['出 · OUT', null, ['tune', 'fine', 'oct', 'vol']]], selects: ['mode', 'slices', 'by'],
            presets: [
                ['切り刻むブレイク // BREAK CHOPPER', { mode: 0.75, st: 0, en: 1, loop: 0, lst: 0.5, rev: 0, att: 0.02, rel: 0.05, tune: 0.5, fine: 0.5, cut: 1, res: 0.1, velv: 0.6, slices: 0.6, by: 0.75, choke: 0.75, gate: 0.25, oct: 0.5, vol: 0.75 }],
                ['声の切れ端 // VOCAL CHOPS', { mode: 0.75, st: 0, en: 1, loop: 0, lst: 0.5, rev: 0, att: 0.05, rel: 0.15, tune: 0.5, fine: 0.5, cut: 1, res: 0.1, velv: 0.6, slices: 0.625, by: 0.25, choke: 0.75, gate: 0.75, oct: 0.5, vol: 0.75 }],
                ['鍵盤の上 // ACROSS THE KEYS', { mode: 0.25, st: 0, en: 1, loop: 0.75, lst: 0.5, rev: 0, att: 0.03, rel: 0.3, tune: 0.5, fine: 0.5, cut: 1, res: 0.1, velv: 0.6, slices: 0.6, by: 0.75, choke: 0.75, gate: 0.25, oct: 0.5, vol: 0.75 }],
                ['逆再生の膨らみ // REVERSED SWELL', { mode: 0.25, st: 0, en: 1, loop: 0, lst: 0.5, rev: 0.75, att: 0.5, rel: 0.5, tune: 0.5, fine: 0.5, cut: 0.8, res: 0.1, velv: 0.6, slices: 0.6, by: 0.75, choke: 0.75, gate: 0.25, oct: 0.5, vol: 0.75 }],
                ['壊れた録音 // BROKEN TAPE KEYS', { mode: 0.25, st: 0, en: 1, loop: 0.75, lst: 0.5, rev: 0, att: 0.02, rel: 0.4, tune: 0.479, fine: 0.42, cut: 0.45, res: 0.3, velv: 0.6, slices: 0.6, by: 0.75, choke: 0.75, gate: 0.25, oct: 0.5, vol: 0.75 }],
                ['地下の一撃 // ONE SHOT HITS', { mode: 0.75, st: 0, en: 1, loop: 0, lst: 0.5, rev: 0, att: 0.02, rel: 0.1, tune: 0.5, fine: 0.5, cut: 1, res: 0.1, velv: 0.6, slices: 0.375, by: 0.75, choke: 0.25, gate: 0.25, oct: 0.5, vol: 0.75 }]
            ],
            draw(x, w, h, s, D) {
                x.fillStyle = '#080807'; x.fillRect(0, 0, w, h);
                const v = (k, d0) => s[k] == null ? d0 : s[k], z = s.smp, e = z && window.NBA ? NBA.pool.get(z.id) : null, top = 16, bot = h - 12, mid = (top + bot) / 2, X0 = 6, X1 = w - 6, Xp = u => X0 + u * (X1 - X0);
                x.font = 'bold 9px Courier New'; x.fillStyle = '#f2e6c8';
                if (!z || !e || e.state !== 'ok') { if (z && window.NBA && !e) NBA.load(z.id); x.fillText('MAW · ' + (z ? 'loading ' + (z.name || '') : 'no sound yet: LOAD, FROM THE BOX, or drop one here'), 6, 11); return; }
                const pk = MAW.peaks(e, Math.round(X1 - X0)), st = Math.min(v('st', 0), v('en', 1) - 0.01), en = Math.max(v('en', 1), st + 0.01), rev = v('rev', 0) >= 0.5;
                for (let i = 0; i < pk.length; i++) { const u = rev ? 1 - i / pk.length : i / pk.length, inside = u >= st && u <= en, a = pk[i] * (bot - top) / 2; x.fillStyle = inside ? D.A : 'rgba(255,255,255,0.18)'; x.fillRect(X0 + i, mid - a, 1, Math.max(1, a * 2)); }
                if (v('mode', 0) < 0.5 && v('loop', 0) >= 0.5) { const ls = st + (en - st) * v('lst', 0.5); x.fillStyle = 'rgba(255,230,150,0.12)'; x.fillRect(Xp(ls), top, Xp(en) - Xp(ls), bot - top); x.strokeStyle = 'rgba(255,230,150,0.7)'; x.strokeRect(Xp(ls) + 0.5, top + 0.5, Xp(en) - Xp(ls), bot - top); }
                if (v('mode', 0) >= 0.5) { const cuts = MAW.cuts(e, st, en, v('slices', 0.6), v('by', 0.75)); x.font = '8px Courier New';
                    cuts.forEach((c, k) => { const xx = Xp(c); x.strokeStyle = 'rgba(255,255,255,0.75)'; x.beginPath(); x.moveTo(xx + 0.5, top); x.lineTo(xx + 0.5, bot); x.stroke(); if (cuts.length <= 24 || k % 2 === 0) { x.fillStyle = 'rgba(255,240,210,0.8)'; x.fillText(String(k + 1), xx + 2, bot + 9); } }); }
                x.strokeStyle = 'rgba(255,255,255,0.5)'; x.beginPath(); x.moveTo(Xp(st) + 0.5, top - 2); x.lineTo(Xp(st) + 0.5, bot + 2); x.moveTo(Xp(en) - 0.5, top - 2); x.lineTo(Xp(en) - 0.5, bot + 2); x.stroke();
                x.font = 'bold 9px Courier New'; x.fillStyle = '#f2e6c8'; let t1 = 'MAW · ' + (z.name || 'its sound').slice(0, 22) + ' · ' + (v('mode', 0) < 0.5 ? 'KEYS from ' + MAW.noteName(z.root || 261.63) : MAW.cuts(e, st, en, v('slices', 0.6), v('by', 0.75)).length + ' slices from middle C');
                x.fillText(x.measureText(t1).width < w - 12 ? t1 : 'MAW · ' + (v('mode', 0) < 0.5 ? 'KEYS' : 'SLICES'), 6, 11);
            } },
        { id: 'serpent', jp: '蛇', en: 'SERPENT', sub: 'wavetable synth. 3 oscillators, FM, sub, noise, 2 filters, distortion, 4 envelopes, 4 LFOs + a 16 slot matrix. hover any dial for what it does. the map on the left shows the signal path, lit = on', kind: 'poly', part: 'nb_serpent', face: 'serpent', big: true,
            p: (() => {
                const W = F.pick(['none', 'BEND', 'SYNC', 'FOLD', 'SQUEEZE', 'MIRROR', 'PWM', 'ASYM', 'QUANTISE', 'FLIP', 'SMEAR', 'RECTIFY', 'PHASE DIST', 'PULSE PM']), ST = v => { let n = Math.round(v * 48) - 24; return (n > 0 ? '+' : '') + n + 'st'; }, UNI = v => String(1 + Math.round(v * 15)), DET = v => Math.round(v * 60) + 'c', BI = v => Math.round((v - 0.5) * 200) + '%';
                const OKIND = F.pick(SERP_KIND), SMOV = F.pick(SERP_SMOV), ECV = v => v < 0.47 ? 'swell ' + Math.round((0.5 - v) * 200) : v > 0.53 ? 'snap ' + Math.round((v - 0.5) * 200) : 'analog';
                const STK = F.pick(['none', '+12', '+7', '+12 +24', '-12', '+7 +12', 'minor chord', 'major chord']), ONOFF = F.pick(['off', 'on']), CENTS = v => { let c = Math.round((v - 0.5) * 200); return (c > 0 ? '+' : '') + c + 'c'; }, PAN = v => { let p = Math.round((v - 0.5) * 200); return p === 0 ? 'C' : (p < 0 ? 'L' : 'R') + Math.abs(p); };
                const osc = (k, lvKey, tb, pos, lvl, uni) => [['on' + k.toUpperCase(), 'ON', 0.75, ONOFF], ['t' + k.toUpperCase(), 'TABLE', tb, null], ['p' + k, 'POS', pos, F.pct], ['w' + k, 'WARP', 0, W], ['x' + k, 'WARP AMT', 0.3, F.pct], ['u' + k, 'UNISON', uni, UNI], ['d' + k, 'DETUNE', 0.25, DET], ['sk' + k, 'STACK', 0, STK], ['b' + k, 'BLEND', 0.6, F.pct], [lvKey, 'LEVEL', lvl, F.pct], ['s' + k, 'PITCH', 0.5, ST], ['fn' + k, 'FINE', 0.5, CENTS], ['pn' + k, 'PAN', 0.5, PAN], ['ph' + k, 'PHASE', 0, F.pick(['free', 'restart'])],
                    ['ok' + k, 'KIND', 0, OKIND], ['sm' + k, 'SPEC MOVE', 0, SMOV], ['sx' + k, 'SPEC AMT', 0.5, F.pct], ['gz' + k, 'SIZE', 0.35, v => Math.round((0.01 + v * v * 0.49) * 1000) + 'ms'], ['gd' + k, 'DENSITY', 0.4, v => 'x' + (1 + v * 7).toFixed(1)], ['gs' + k, 'SPRAY', 0.1, F.pct],
                    ['v' + k, 'WARP 2', 0, W], ['y' + k, 'WARP 2 AMT', 0.3, F.pct], ['kd' + k, 'DECAY', 0.5, v => { let t = 0.15 + v * v * 20; return t < 1 ? Math.round(t * 1000) + 'ms' : t.toFixed(1) + 's'; }], ['kb' + k, 'BRIGHT', 0.5, F.pct], ['kx' + k, 'EXCITE', 0.3, v => v < 0.15 ? 'struck' : v > 0.85 ? 'rubbed' : Math.round(v * 100) + '%'],
                    ['ht' + k, 'TENSION', 0.3, v => 'μ ' + (0.05 + v * v * 7.95).toFixed(1)], ['hp' + k, 'PULL', 0, v => v < 0.02 ? 'none' : v > 0.7 ? 'stumbles ' + Math.round(v * 100) : Math.round(v * 100) + '%']];
                const env = (a, d, s2, r, def) => [[a, 'ATTACK', def[0], F.ms(0.001, 4, 2)], [d, 'DECAY', def[1], F.ms(0.005, 6, 2)], [s2, 'SUSTAIN', def[2], F.pct], [r, 'RELEASE', def[3], F.ms(0.005, 8, 2)]];
                const SRC = F.pick(SERP_SRC), DST = F.pick(SERP_DST);
                const FT = F.pick(SERP_FT), RATE = F.pick(['1/16', '1/8', '1/4', '1/2', '1 bar', '2 bars', '4 bars']), SHP = F.pick(['sine', 'tri', 'saw', 'square', 'random', 'drawn', 'LORENZ', 'ROSSLER']), FREE = F.pick(['in time', 'free']);
                const THRU = F.pick(['through the filters', 'around them']), LMODE = F.pick(['loop', 'once']);
                let a = [].concat(osc('a', 'la', 0, 0.3, 0.8, 0.5), osc('b', 'lb', 1, 0.5, 0, 0.2), osc('c', 'lc3', 2, 0.5, 0, 0),
                    [['fmm', 'FM', 0, F.pick(['off', 'B → A (FM)', 'B × A (RING)', 'C → A (FM)', 'C → B (FM)', 'B → A (PHASE)', 'SUB → A (FM)', 'NOISE → A (FM)', 'FILTER → A (FM)', 'A → A (FEEDBACK)'])], ['fma', 'FM AMT', 0.3, F.pct],
                     ['onS', 'ON', 0.75, ONOFF], ['sub', 'SUB', 0.2, F.pct], ['subw', 'SUB WAVE', 0, F.pick(['sine', 'square', 'tri'])], ['subo', 'SUB OCT', 0, F.pick(['-1', '-2'])], ['srt', 'GOES', 0, THRU],
                     ['onN', 'ON', 0.75, ONOFF], ['noise', 'NOISE', 0, F.pct], ['nty', 'KIND', 0, F.pick(['WHITE', 'PINK', 'CRACKLE', 'HISS', 'METAL', 'RAIN', 'WINGS', 'CHAINS', 'FURNACE'])], ['nc', 'COLOUR', 0.5, F.pct], ['nft', 'ITS FILTER', 0, F.pick(['off', 'LOW', 'HIGH', 'BAND', 'PEAK'])], ['nfc', 'CUT', 0.6, F.hz(30, 18000)], ['nfr', 'RES', 0.2, F.pct], ['nkt', 'KEY', 0, F.pct], ['nen', 'SHAPE', 0, F.pick(['ENV 1', 'ENV 3'])], ['nrt', 'GOES', 0, THRU],
                     ['onF', 'ON', 0.75, ONOFF], ['ft', 'TYPE', 0, FT], ['fc', 'CUT', 0.62, F.hz(30, 18000)], ['fr', 'RES', 0.2, F.pct], ['fd', 'DRIVE', 0.1, F.pct], ['fe', 'ENV 2 →', 0.62, v => { let o = (v - 0.5) * 12; return (o > 0 ? '+' : '') + o.toFixed(1) + ' oct'; }], ['fk', 'KEY', 0.5, F.pct], ['vcut', 'VEL → CUT', 0.5, BI],
                     ['f2on', 'FILTER 2', 0, F.pick(['off', 'after 1', 'beside 1'])], ['ft2', 'TYPE', 0.4, FT], ['fc2', 'CUT', 0.8, F.hz(30, 18000)], ['fr2', 'RES', 0.2, F.pct],
                     ['onD', 'ON', 0.75, ONOFF], ['dty', 'KIND', 0, F.pick(['off', 'SOFT', 'HARD', 'FOLD', 'CRUSH', 'DOWNSAMPLE', 'RECTIFY', 'TUBE', 'DIODE', 'LIN FOLD'])], ['dam', 'DRIVE', 0.35, F.pct], ['dtn', 'TONE', 1, F.hz(400, 18000)], ['dmx', 'MIX', 1, F.pct], ['dpo', 'WHERE', 0, F.pick(['after the filter', 'before the filter'])]],
                    env('a1', 'd1', 's1', 'r1', [0.02, 0.35, 0.75, 0.3]), [['e1c', 'CURVE', 0.5, ECV]], env('ma', 'md', 'ms', 'mr', [0, 0.4, 0.2, 0.3]), [['e2c', 'CURVE', 0.5, ECV], ['ea', '→ POS A', 0.5, BI], ['eb', '→ POS B', 0.5, BI]], env('na', 'nd', 'ns', 'nr', [0.1, 0.5, 0.5, 0.4]), [['e3c', 'CURVE', 0.5, ECV]],
                    env('qa', 'qd', 'qs', 'qr', [0.1, 0.5, 0.5, 0.4]), [['e4c', 'CURVE', 0.5, ECV]], [['npi', '→ PITCH', 0.5, v => { let st = Math.round((v - 0.5) * 96); return (st > 0 ? '+' : '') + st + 'st'; }]],
                    [['onL1', 'ON', 0.75, ONOFF], ['lr', 'RATE', 0.4, RATE], ['lf', 'SYNC', 0, FREE], ['ls', 'SHAPE', 0, SHP], ['l1m', 'MODE', 0, LMODE], ['l1d', 'FADE IN', 0, F.ms(0, 4)], ['l1g', 'VOICES', 0, F.pick(['each its own', 'all as one'])], ['lp', '→ POS', 0.5, BI], ['lc', '→ CUT', 0.5, BI], ['lv', '→ PITCH', 0, v => Math.round(v * 48) + 'c'], ['la2', '→ VOLUME', 0, F.pct], ['l1k', 'BEND', 0.5, BI],
                     ['onL2', 'ON', 0.75, ONOFF], ['l2r', 'RATE', 0.6, RATE], ['l2f', 'SYNC', 0, FREE], ['l2s', 'SHAPE', 1 / 5 + 0.01, SHP], ['l2m', 'MODE', 0, LMODE], ['l2d', 'FADE IN', 0, F.ms(0, 4)], ['l2g', 'VOICES', 0, F.pick(['each its own', 'all as one'])], ['l2p', '→ POS', 0.5, BI], ['l2c', '→ CUT', 0.5, BI], ['l2v', '→ PITCH', 0, v => Math.round(v * 48) + 'c'], ['l2a', '→ VOLUME', 0, F.pct], ['l2k', 'BEND', 0.5, BI]],
                    [3, 4].flatMap(n => [['onL' + n, 'ON', 0.75, ONOFF], ['l' + n + 'r', 'RATE', n === 3 ? 0.4 : 0.6, RATE], ['l' + n + 'f', 'SYNC', 0, FREE], ['l' + n + 's', 'SHAPE', 0, SHP], ['l' + n + 'm', 'MODE', 0, LMODE], ['l' + n + 'd', 'FADE IN', 0, F.ms(0, 4)], ['l' + n + 'g', 'VOICES', 0, F.pick(['each its own', 'all as one'])], ['l' + n + 'k', 'BEND', 0.5, BI]]));
                a.push(['onM', 'ON', 0.75, ONOFF]);
                for (let k = 1; k <= 16; k++) a.push(['m' + k + 's', 'FROM', 0, SRC], ['m' + k + 'd', 'TO', 0, DST], ['m' + k + 'a', 'AMOUNT', 0.5, BI], ['m' + k + 'c', 'CURVE', 0.5, BI], ['m' + k + 'x', 'AUX', 0, F.pick(['—'].concat(SERP_SRC.slice(1)))]);
                for (let k = 1; k <= 4; k++) a.push(['mc' + k, 'MACRO ' + k, 0, F.pct]);
                return a.concat([['tun', 'TUNING', 0, F.pick(['EVEN', 'JUST', 'PURE FIFTHS', 'MEANTONE', 'NEUTRAL'])], ['drf', 'DRIFT', 0, F.pct],
                    ['vm', 'VOICES', 0, F.pick(['POLY', 'MONO', 'LEGATO'])], ['gl', 'GLIDE', 0, F.ms(0, 0.6)], ['vs', 'VEL → LOUD', 1, F.pct], ['wd', 'WIDTH', 0.6, F.pct], ['vol', 'VOLUME', 0.7, F.pct], ['oct', 'OCTAVE', 0.5, F.oct],
                    ['zbl', 'BLEND', 0.75, F.pick(['nearest', 'blend'])], ['onT', 'ON', 0.25, ONOFF], ['thv', 'VOWEL', 0.5, v => { let u = v * 4, i = Math.min(3, Math.floor(u)), V = ['U', 'O', 'A', 'E', 'I']; return u - i < 0.2 ? V[i] : u - i > 0.8 ? V[i + 1] : V[i] + '→' + V[i + 1]; }], ['thz', 'SIZE', 0.5, v => v < 0.12 ? 'huge' : v < 0.35 ? 'big' : v < 0.65 ? 'a person' : v < 0.88 ? 'small' : 'hand sized'],
                    ['thg', 'GROWL', 0, F.pct], ['thh', 'HARD → GROWL', 0, F.pct], ['thb', 'BREATH', 0, F.pct], ['thm', 'MIX', 1, F.pct],
                    ['hiv', 'HIVE', 0, v => v < 0.01 ? 'each their own' : v > 0.97 ? 'one voice' : Math.round(v * 100) + '%'], ['hvt', 'TAKES', 0, v => v < 0.01 ? 'at once' : (v * v * 8).toFixed(1) + 's'], ['hq', 'QUALITY', 0, F.pick(['1x live · 2x bounce', '1x always', '2x always', '1x live · 4x bounce'])], ['pbr', 'BEND RANGE', 0.9, F.pick(['±2', '±12', '±24', '±48'])]]);
            })(),
            tips: (() => { const T = {}, O = { t: 'the table it reads: a set of shapes it can morph through', p: 'POS: where in the table it reads, the morph', w: 'WARP: bends how it reads the table. SYNC + FOLD + QUANTISE make the most new harmonics', x: 'how hard the warp bends it', u: 'UNISON: how many copies, spread like a supersaw', d: 'how far the copies spread apart', sk: 'STACK: copies an octave, a fifth or a chord up', b: 'the middle copy against the spread ones (the supersaw mix)', s: 'semitones up or down', fn: 'cents up or down', pn: 'where it sits left to right', ph: 'free = every note starts somewhere new (alive), restart = every note starts the same (punchy)' };
                Object.assign(O, { ok: 'KIND: TABLE reads the wavetable, SPECTRAL takes it apart into harmonics + moves those, GRAIN plays little pieces of the sound you gave it, SAMPLE plays that sound straight', sm: 'SPECTRAL only: what it does to the harmonics. LOW + HIGH filter them, FORMANT slides the mouth without moving the note, ODD ↔ EVEN hollows it, KEEP EVERY thins it, TILT darkens or brightens, SCRAMBLE smears it, SHIFT slides the harmonics along', sx: 'SPECTRAL only: how far the move goes', gz: 'GRAIN only: how long each grain is', gd: 'GRAIN only: how many grains overlap at once', gs: 'GRAIN only: how far each grain wanders from POS' });
                Object.assign(O, { ok: 'KIND: TABLE reads the wavetable, SPECTRAL takes it apart into harmonics + moves those, GRAIN plays little pieces of its sound, SAMPLE plays its sound straight, STRING is a plucked string, MODAL is a struck or rubbed object (bar, marimba, bell, plate, glass: POS walks them), PULSE is no stored wave at all: a heart that keeps its own beat at your note',
                    v: 'WARP 2: a second warp on top of the first (PHASE DIST + PULSE PM together = the whole Wave Pulse PM oscillator)', y: 'how hard the second warp bends it', kd: 'STRING + MODAL: how long it rings', kb: 'STRING: bright steel to dark felt. MODAL: how hard the mallet is + how long the high modes ring', kx: 'STRING: the pluck, from the table to noise. MODAL: struck (left) to rubbed (right: it keeps sounding while you hold)',
                    ht: 'PULSE: how hard the heart strains. low = a soft round beat, high = a hard thud (held down a little up high so it stays clean)', hp: 'PULSE: the table at POS tugging at the heart. a little colours it, a lot + it stumbles off its beat (subharmonics, chaos)' });
                ['a', 'b', 'c'].forEach(k => { const K = k.toUpperCase(); T['t' + K] = O.t; ['p', 'w', 'x', 'u', 'd', 'sk', 'b', 's', 'fn', 'pn', 'ph', 'ok', 'sm', 'sx', 'gz', 'gd', 'gs', 'v', 'y', 'kd', 'kb', 'kx', 'ht', 'hp'].forEach(q => { T[q + k] = O[q]; }); });
                T.la = T.lb = T.lc3 = 'how loud it is. at 0 it can still be the FM: thats the classic way to use one';
                Object.assign(T, { fmm: 'what moves what: B → A bends A with B (FM), B × A rings them together, PHASE is the gentle one. A can also be bent by the sub, the noise, the filter coming back round, or itself (FEEDBACK: the DX7 trick, saw to noise as you turn it up)', fma: 'how hard. on a bright table it gets bright fast',
                    sub: 'a plain wave an octave or two down, under everything', subw: 'the sub\'s shape', subo: 'one octave down or two', srt: 'through the filters, or straight out around them',
                    noise: 'how much noise', nty: 'what kind: hiss, crackle, rain, metal...', nc: 'darker to brighter', nft: 'the noise\'s own filter, before it joins the rest', nfc: 'its cut', nfr: 'its resonance', nkt: 'how much its cut follows the note', nen: 'which envelope shapes it', nrt: 'through the filters, or around them',
                    ft: 'the filter: LOW lets the bottom through, ACID is the screaming one, DIRTY LOW pushes back, MS-20 screams when you push the RES, DIODE 303 is the squelch, FORMANT is a mouth (CUT slides u o a e i), PHASER + FLANGE sweep when the cut moves, COMB − rings hollow', fc: 'where it cuts', fr: 'resonance: a peak at the cut, sings at the top', fd: 'pushes it into the filter for grit', fe: 'how far ENV 2 sweeps the cut', fk: 'how much the cut follows the note',
                    f2on: 'a second filter: after the first, or beside it', ft2: 'its kind', fc2: 'its cut', fr2: 'its resonance',
                    dty: 'the distortion. SOFT, HARD, FOLD, RECTIFY, TUBE, DIODE + LIN FOLD run at twice the rate so they stay clean up top. DIODE is lopsided + warm, LIN FOLD folds hard edges', dam: 'how hard', dtn: 'the top it keeps', dmx: 'how much of it against the clean', dpo: 'before or after the filter',
                    a1: 'how fast it comes in', d1: 'how fast it falls to sustain', s1: 'where it sits while you hold', r1: 'how long it rings after you let go',
                    ma: 'how fast ENV 2 rises', md: 'how fast it falls', ms: 'where it sits', mr: 'its release', ea: 'how far ENV 2 moves A\'s POS', eb: 'how far it moves B\'s POS', npi: 'ENV 3 bends the pitch: up to four octaves either way. fast + down = an 808 or a kick, slow = a riser',
                    na: 'ENV 3 attack', nd: 'ENV 3 decay', ns: 'ENV 3 sustain', nr: 'ENV 3 release', qa: 'ENV 4 attack', qd: 'ENV 4 decay', qs: 'ENV 4 sustain', qr: 'ENV 4 release',
                    e1c: 'the shape of every part: left swells + hangs, the middle is an old analogue one, right snaps (fast off the gate, a punchy fall)', e2c: 'the shape of every part: left swells + hangs, right snaps', e3c: 'the shape of every part: left swells + hangs, right snaps', e4c: 'the shape of every part: left swells + hangs, right snaps',
                    onT: 'THE THROAT: the sound put through a mouth. off, nothing changes', thv: 'which vowel the mouth makes: U O A E I, + everything between. send VOWEL from an LFO + it talks',
                    thz: 'how big the mouth + chest are. left = huge + deep, right = tiny',
                    thg: 'the roar: the throat rattling an octave under the note + shuddering. a little is gravel, all of it is a beast', thh: 'harder notes roar more. soft ones sing, hit it + it bares its teeth',
                    thb: 'air through the same mouth, riding how loud the note is: a whisper, a pant, the breath before a scream', thm: 'how much of the mouth you hear against the sound going into it',
                    vcut: 'how much harder notes open the filter (right) or shut it (left). the middle = the same for every note',
                    hiv: 'THE HIVE: pulls the unison copies toward each other. low = loose drift, high = they lock into one voice. TO: HIVE in the matrix lets an envelope drive it', hvt: 'how long the hive takes them: each note starts as a crowd + is taken over this long', zbl: 'with more than one sound across the keys: blend = a note between two of them plays both, mixed by how far between (no jump from one to the next), nearest = just the closest', hq: 'how hard it works: at 2x or 4x the whole voice runs that much faster inside + comes back down filtered, so pushed filters, FM + the distortion stay clean up top. it costs that much more, so live it runs at 1x unless you say', pbr: 'how far a BEND drawn on a note (or a keyboard that bends each note on its own, MPE) goes at the top',
                    tun: 'old tunings: JUST + PURE FIFTHS make chords ring, counted from the song\'s key', drf: 'an old machine: every note lands a little off + every voice wanders on its own',
                    vm: 'POLY plays chords, MONO one at a time, LEGATO slides only when the notes overlap', gl: 'how long it slides between notes', vs: 'how much harder hits are louder', wd: 'how wide the unison spreads', vol: 'how loud', oct: 'octaves up or down' });
                [['l', 'l1'], ['l2', 'l2']].forEach(([k, m2], i) => { const n = i ? 'l2' : 'l'; T[n + 'r'] = 'how fast it goes'; T[n + 'f'] = 'in time with the song, or free'; T[n + 's'] = 'its shape (drawn = the one you draw)'; T[m2 + 'm'] = 'loop, or once + hold where it ends'; T[m2 + 'd'] = 'how long before it fades in';
                    T[n + 'p'] = 'how far it moves POS'; T[n + 'c'] = 'how far it moves the cut'; T[n + 'v'] = 'how far it bends the pitch (vibrato)'; T[i ? 'l2a' : 'la2'] = 'how hard it pulses the volume (tremolo)'; });
                for (let k = 1; k <= 16; k++) { T['m' + k + 'c'] = 'bends what comes from FROM: left = only the top of it counts, right = it rises fast'; T['m' + k + 'x'] = 'AUX: scales it by a second source (velocity, a macro, the wheel...), so one thing moves another only as far as a third says'; T['m' + k + 's'] = 'what does the moving'; T['m' + k + 'd'] = 'what gets moved'; T['m' + k + 'a'] = 'how much (left of the middle = the other way)'; }
                for (let k = 1; k <= 4; k++) T['mc' + k] = 'a knob of your own: send it anywhere in the matrix, then automate this one';
                [1, 2, 3, 4].forEach(n => { T['l' + n + 'g'] = 'each its own = every note starts its own cycle. all as one = every voice on the same cycle (a chord moves together)'; T['l' + n + 'k'] = 'pushes the shape one way: a sine that rises slow + drops fast, a saw that curves'; if (n > 2) { T['l' + n + 'r'] = 'how fast it goes'; T['l' + n + 'f'] = 'in time with the song, or free'; T['l' + n + 's'] = 'its shape'; T['l' + n + 'm'] = 'loop, or once + hold where it ends'; T['l' + n + 'd'] = 'how long before it fades in'; } });
                return T; })(),
            groups: [['OSC A', 'wtA', ['oka', 'tA', 'pa', 'wa', 'xa', 'ua', 'da', 'ska', 'ba', 'la', 'sa', 'fna', 'pna', 'pha', 'va', 'ya', 'sma', 'sxa', 'gza', 'gda', 'gsa', 'kda', 'kba', 'kxa', 'hta', 'hpa']], ['OSC B', 'wtB', ['okb', 'tB', 'pb', 'wb', 'xb', 'ub', 'db', 'skb', 'bb', 'lb', 'sb', 'fnb', 'pnb', 'phb', 'vb', 'yb', 'smb', 'sxb', 'gzb', 'gdb', 'gsb', 'kdb', 'kbb', 'kxb', 'htb', 'hpb']], ['OSC C', 'wtC', ['okc', 'tC', 'pc', 'wc', 'xc', 'uc', 'dc', 'skc', 'bc', 'lc3', 'sc', 'fnc', 'pnc', 'phc', 'vc', 'yc', 'smc', 'sxc', 'gzc', 'gdc', 'gsc', 'kdc', 'kbc', 'kxc', 'htc', 'hpc']],
                ['FM', null, ['fmm', 'fma']], ['THE SOUNDS YOU GAVE IT', 'smp', ['zbl']], ['SUB', null, ['sub', 'subw', 'subo', 'srt']], ['NOISE', 'nz', ['noise', 'nty', 'nc', 'nft', 'nfc', 'nfr', 'nkt', 'nen', 'nrt']],
                ['喉 · THE THROAT', 'throat', ['thv', 'thz', 'thg', 'thh', 'thb', 'thm']], ['FILTER 1', 'flt', ['ft', 'fc', 'fr', 'fd', 'fe', 'fk', 'vcut']], ['FILTER 2', 'flt2', ['f2on', 'ft2', 'fc2', 'fr2']], ['DIST', 'dst', ['dty', 'dam', 'dtn', 'dmx', 'dpo']],
                ['ENV 1 · VOLUME', 'env1', ['a1', 'd1', 's1', 'r1', 'e1c']], ['ENV 2 · MOVES THINGS', 'env2', ['ma', 'md', 'ms', 'mr', 'e2c', 'ea', 'eb']], ['ENV 3', 'env3', ['na', 'nd', 'ns', 'nr', 'e3c', 'npi']], ['ENV 4 · FOR THE MATRIX', 'env4', ['qa', 'qd', 'qs', 'qr', 'e4c']],
                ['LFO 1', 'lfo', ['lr', 'lf', 'ls', 'l1m', 'l1d', 'l1g', 'l1k', 'lp', 'lc', 'lv', 'la2']], ['LFO 2', 'lfo2', ['l2r', 'l2f', 'l2s', 'l2m', 'l2d', 'l2g', 'l2k', 'l2p', 'l2c', 'l2v', 'l2a']], ['LFO 3 · FOR THE MATRIX', 'lfo3', ['l3r', 'l3f', 'l3s', 'l3m', 'l3d', 'l3g', 'l3k']], ['LFO 4 · FOR THE MATRIX', 'lfo4', ['l4r', 'l4f', 'l4s', 'l4m', 'l4d', 'l4g', 'l4k']],
                ['MATRIX · ANYTHING MOVES ANYTHING', 'mx', ['m1s', 'm1d', 'm1a', 'm1c', 'm1x', 'm2s', 'm2d', 'm2a', 'm2c', 'm2x', 'm3s', 'm3d', 'm3a', 'm3c', 'm3x', 'm4s', 'm4d', 'm4a', 'm4c', 'm4x', 'm5s', 'm5d', 'm5a', 'm5c', 'm5x', 'm6s', 'm6d', 'm6a', 'm6c', 'm6x', 'm7s', 'm7d', 'm7a', 'm7c', 'm7x', 'm8s', 'm8d', 'm8a', 'm8c', 'm8x', 'm9s', 'm9d', 'm9a', 'm9c', 'm9x', 'm10s', 'm10d', 'm10a', 'm10c', 'm10x', 'm11s', 'm11d', 'm11a', 'm11c', 'm11x', 'm12s', 'm12d', 'm12a', 'm12c', 'm12x', 'm13s', 'm13d', 'm13a', 'm13c', 'm13x', 'm14s', 'm14d', 'm14a', 'm14c', 'm14x', 'm15s', 'm15d', 'm15a', 'm15c', 'm15x', 'm16s', 'm16d', 'm16a', 'm16c', 'm16x'], 'wide'],
                ['MACROS', null, ['mc1', 'mc2', 'mc3', 'mc4']], ['群 · THE HIVE', 'hive', ['hiv', 'hvt']], ['律 · THE OLD RATIOS', 'tun', ['tun', 'drf']],
                ['VOICE · OUT', null, ['vm', 'gl', 'vs', 'wd', 'vol', 'oct', 'hq', 'pbr']]],
            hide(k, s) { const m = /^(sm|sx|gz|gd|gs|w|x|v|y|kd|kb|kx|ht|hp)([abc])$|^t([ABC])$/.exec(k); if (!m) return false; const o = (m[2] || m[3]).toLowerCase(), kd = Math.min(6, Math.floor((s['ok' + o] || 0) * 7)), q = m[1];
                if (q === 'sm' || q === 'sx') return kd !== 1; if (q === 'gz' || q === 'gd' || q === 'gs') return kd !== 2; if (q === 'kd' || q === 'kb' || q === 'kx') return kd !== 4 && kd !== 5; if (q === 'ht' || q === 'hp') return kd !== 6;
                if (q === 'w' || q === 'x' || q === 'v' || q === 'y') return kd >= 2; return kd === 2 || kd === 3 || kd === 5; },
            heads: { 'OSC A': 'onA', 'OSC B': 'onB', 'OSC C': 'onC', 'SUB': 'onS', 'NOISE': 'onN', '喉 · THE THROAT': 'onT', 'FILTER 1': 'onF', 'DIST': 'onD', 'LFO 1': 'onL1', 'LFO 2': 'onL2', 'LFO 3 · FOR THE MATRIX': 'onL3', 'LFO 4 · FOR THE MATRIX': 'onL4', 'MATRIX · ANYTHING MOVES ANYTHING': 'onM' },
            // tabs on the synth so its not one giant wall of knobs
            view0: 'OSC',
            views: [['ALL', null], ['OSC', ['OSC A', 'OSC B', 'OSC C', 'FM', 'THE SOUNDS YOU GAVE IT', 'SUB', 'NOISE']], ['FILTER', ['喉 · THE THROAT', 'FILTER 1', 'FILTER 2', 'DIST', 'NOISE']], ['MOVE', ['ENV 1 · VOLUME', 'ENV 2 · MOVES THINGS', 'ENV 3', 'ENV 4 · FOR THE MATRIX', 'LFO 1', 'LFO 2', 'LFO 3 · FOR THE MATRIX', 'LFO 4 · FOR THE MATRIX']], ['MATRIX', ['MATRIX · ANYTHING MOVES ANYTHING', 'MACROS']], ['VOICE', ['群 · THE HIVE', '律 · THE OLD RATIOS', 'VOICE · OUT']]],
            tables: ['tA', 'tB', 'tC'], mxRow: 5,
            selects: ['wa', 'wb', 'wc', 'ska', 'skb', 'skc', 'pha', 'phb', 'phc', 'fmm', 'subw', 'subo', 'srt', 'nty', 'nft', 'nen', 'nrt', 'ft', 'ft2', 'f2on', 'dty', 'dpo', 'lr', 'lf', 'ls', 'l1m', 'l2r', 'l2f', 'l2s', 'l2m', 'vm', 'tun', 'oka', 'okb', 'okc', 'sma', 'smb', 'smc', 'l3r', 'l3f', 'l3s', 'l3m', 'l4r', 'l4f', 'l4s', 'l4m', 'hq', 'pbr'].concat([...Array(16)].flatMap((_, i) => ['m' + (i + 1) + 's', 'm' + (i + 1) + 'd', 'm' + (i + 1) + 'x']), ['va', 'vb', 'vc', 'l1g', 'l2g', 'l3g', 'l4g']),
            fix(s) { if (!s) return s;
                if ((s._v || 0) < 2) { for (let k = 1; k <= 6; k++) { let a = 'm' + k + 's', b = 'm' + k + 'd'; if (s[a] != null && s[a] < 1) s[a] = (Math.floor(s[a] * 8) + 0.5) / 13; if (s[b] != null && s[b] < 1) s[b] = (Math.floor(s[b] * 20) + 0.5) / 26; } s._v = 2; }
                if (s._v === 2) { const mv = (k, from, to) => { if (s[k] != null) s[k] = (Math.min(from - 1, Math.floor(s[k] * from)) + 0.5) / to; };
                    ['wa', 'wb', 'wc'].forEach(k => mv(k, 6, 12)); ['ls', 'l2s'].forEach(k => mv(k, 5, 6)); ['ft', 'ft2'].forEach(k => mv(k, 8, 10));
                    ['ua', 'ub', 'uc'].forEach(k => { if (s[k] != null) s[k] = Math.round(s[k] * 6) / 15; }); s._v = 3; }
                if (s._v === 3) { const mv = (k, from, to) => { if (s[k] != null) s[k] = (Math.min(from - 1, Math.floor(s[k] * from)) + 0.5) / to; };
                    ['ft', 'ft2'].forEach(k => mv(k, 10, 13)); mv('dty', 8, 10); s._v = 4; }
                if (s._v === 4) { const mv = (k, from, to) => { if (s[k] != null) s[k] = (Math.min(from - 1, Math.floor(s[k] * from)) + 0.5) / to; };
                    ['ft', 'ft2'].forEach(k => mv(k, 13, 17)); mv('fmm', 6, 10); for (let k = 1; k <= 8; k++) { mv('m' + k + 's', 13, 19); mv('m' + k + 'd', 26, 34); } s._v = 5; }
                if (s._v === 5) { const mv = (k, from, to) => { if (s[k] != null) s[k] = (Math.min(from - 1, Math.floor(s[k] * from)) + 0.5) / to; };
                    ['wa', 'wb', 'wc'].forEach(k => mv(k, 12, 14)); ['ls', 'l2s', 'l3s', 'l4s'].forEach(k => mv(k, 6, 8)); ['oka', 'okb', 'okc'].forEach(k => mv(k, 4, 6)); s._v = 6; }
                if (s._v === 6) { const mv = (k, from, to) => { if (s[k] != null) s[k] = (Math.min(from - 1, Math.floor(s[k] * from)) + 0.5) / to; };
                    ['oka', 'okb', 'okc'].forEach(k => mv(k, 6, 7)); for (let k = 1; k <= 16; k++) mv('m' + k + 'd', 34, 36); s._v = 7; }
                if (s._v === 7) { const mv = (k, from, to) => { if (s[k] != null) s[k] = (Math.min(from - 1, Math.floor(s[k] * from)) + 0.5) / to; };
                    mv('nty', 6, 9); for (let k = 1; k <= 16; k++) mv('m' + k + 'd', 36, 39); s._v = 8; }
                return s; }, ver: 8,
            presets: [
                ['無限の暗 // DIM SUPERSAW', { tA: 0, pa: 0.66, ua: 1, da: 0.35, tB: 0, pb: 0.66, sb: 0.75, lb: 0.3, ub: 0.6, db: 0.5, fc: 0.75, fr: 0.15, fe: 0.55, a1: 0.02, d1: 0.4, s1: 0.8, r1: 0.35, wd: 0.85 }],
                ['澱の双子 // SUMP TWINS', { tA: 0, pa: 0.66, ua: 0.3, da: 0.5, tB: 1, pb: 0.4, lb: 0.6, ub: 0.3, db: 0.45, fc: 0.45, fr: 0.25, fd: 0.4, fe: 0.55, sub: 0.5, oct: 0.25, a1: 0, r1: 0.15, wd: 0.4 }],
                ['下からの唸り // GROWL FROM UNDER', { tA: 4, pa: 0.2, ea: 0.9, ma: 0, md: 0.5, ms: 0.2, lr: 0.3, lp: 0.85, fc: 0.55, fr: 0.35, fd: 0.6, sub: 0.4, oct: 0.25, ua: 0.2, lb: 0 }],
                ['地下の聖歌隊 // CHOIR IN THE CRYPT', { tA: 2, pa: 0.3, ua: 0.6, da: 0.3, tB: 16, pb: 0.5, lb: 0.5, ub: 0.5, db: 0.4, a1: 0.5, r1: 0.6, s1: 0.9, fc: 0.55, lp: 0.65, lr: 0.6, wd: 0.9, lv: 0.1 }],
                ['硝子の鐘 // GLASS BELLS', { tA: 3, pa: 0.7, ua: 0, tB: 17, pb: 0.3, sb: 0.75, lb: 0.4, ub: 0, a1: 0, d1: 0.55, s1: 0, r1: 0.55, fc: 0.8, fe: 0.5 }],
                ['ネオンの爪弾き // NEON PLUCK', { tA: 13, pa: 0.2, ea: 0.8, md: 0.3, ms: 0, a1: 0, d1: 0.3, s1: 0, r1: 0.3, fc: 0.55, fe: 0.8, fr: 0.3, ua: 0.4, da: 0.2, wd: 0.7, lb: 0, vol: 0.95 }],
                ['砕けたサイレン // CRUSHED SIREN', { tA: 6, pa: 0.5, lp: 0.9, lr: 0.2, ls: 0.3, lv: 0.3, wa: 0.3, xa: 0.5, fc: 0.8, ua: 0, lb: 0 }],
                ['教会のオルガン // HYMN ORGAN', { tA: 8, pa: 0.5, ua: 0.2, da: 0.1, a1: 0.05, s1: 1, r1: 0.2, fc: 0.8, lv: 0.08, lr: 0.25, lb: 0 }],
                ['空洞の笛 // HOLLOW FLUTE', { tA: 9, pa: 0.2, noise: 0.15, nc: 0.7, a1: 0.2, r1: 0.3, lv: 0.1, lr: 0.3, fc: 0.7, ua: 0, lb: 0 }],
                ['折れた低音 // FOLDED BASS', { tA: 7, pa: 0.3, ea: 0.8, md: 0.35, ms: 0.1, ma: 0, oct: 0.25, fc: 0.5, fd: 0.3, sub: 0.3, ua: 0, lb: 0 }],
                ['テープの重ね // TAPE STACK', { tA: 1, pa: 0.5, lp: 0.7, lr: 0.55, ls: 0.1, ua: 0.6, da: 0.3, a1: 0.1, r1: 0.4, lb: 0 }],
                ['金管の列 // BRASS SECTION', { tA: 18, pa: 0.2, ua: 0.5, da: 0.2, ea: 0.85, ma: 0.25, md: 0.4, ms: 0.5, fc: 0.5, fe: 0.75, a1: 0.12, r1: 0.25, lv: 0.06, lr: 0.3, lb: 0, vol: 0.85 }],
                ['鐘楼 // BELL TOWER (FM)', { _v: 6, tA: 0, pa: 0, ua: 0, tB: 0, pb: 0, sb: 0.9583, fnb: 0.3441, lb: 0, ub: 0, tC: 0, pc: 0.33, sc: 0.75, lc3: 0.18, uc: 0.1333, dc: 0.12, fmm: 0.15, fma: 0.25, m1s: 0.0789, m1d: 0.3382, m1a: 0.725, sub: 0, vol: 0.85, ma: 0.0, md: 0.4465, ms: 0, a1: 0, d1: 0.6579, s1: 0, r1: 0.4738, onF: 0.25, drf: 0.15, wd: 0.75, _fx: [{"type": "hollow", "p": {"mode": 0.6, "size": 0.6, "decay": 0.6, "mix": 0.28}}] }],
                ['FM の唸り // FM GROWL', { _v: 6, tA: 0, pa: 0, ua: 0, oct: 0.25, tB: 0, pb: 0, sb: 0.5, fnb: 0.5, lb: 0, ub: 0, fmm: 0.15, fma: 0.3, m1s: 0.1842, m1d: 0.3382, m1a: 0.675, lr: 0.2143, ls: 0.0625, lc: 0.65, vol: 0.6, ft: 0.0882, fc: 0.6216, fr: 0.25, fd: 0.4, fe: 0.55, ma: 0, md: 0.2218, ms: 0.3, onD: 0.75, dty: 0.75, dam: 0.45, sub: 0.35, vm: 0.83, gl: 0.1, a1: 0, d1: 0.2567, s1: 0.85, r1: 0.1347 }],
                ['酸の一本線 // ACID LINE (MONO)', { tA: 20, pa: 0.3, vm: 0.4, gl: 0.25, ft: 0.15, fc: 0.35, fr: 0.75, fe: 0.85, ma: 0, md: 0.3, ms: 0, fd: 0.5, a1: 0, d1: 0.4, s1: 0.6, r1: 0.1, ua: 0, oct: 0.25, lb: 0 }],
                ['弦の褥 // STRING PAD', { tA: 19, pa: 0.4, ua: 0.7, da: 0.35, tB: 19, pb: 0.7, sb: 0.75, lb: 0.3, ub: 0.5, a1: 0.6, r1: 0.6, s1: 0.85, fc: 0.6, lp: 0.6, lr: 0.65, wd: 0.95 }],
                ['機械の声 // DIGI VOICE', { tA: 22, pa: 0.3, m1s: 0.6, m1d: 0.02, m1a: 0.95, l2r: 0.4, l2s: 0.85, ua: 0.3, fc: 0.7, lb: 0, vol: 0.95 }],
                ['膨らむ正弦 // SINE STACK SWELL', { tA: 23, pa: 0, ea: 1, ma: 0.7, md: 0.6, ms: 1, a1: 0.4, r1: 0.5, fc: 0.8, ua: 0.4, da: 0.15, lb: 0 }],
                ['水底 // UNDERTOW', { tA: 16, pa: 0.5, tC: 2, pc: 0.4, lc3: 0.4, uc: 0.5, ua: 0.5, f2on: 0.85, ft2: 0.4, fc2: 0.45, fr2: 0.6, lp: 0.6, lr: 0.75, a1: 0.7, r1: 0.7, s1: 0.9, wd: 0.95, lb: 0, vol: 1 }],
                ['手描き // HAND DRAWN', { tA: 24, pa: 0, ea: 1, ma: 0.3, md: 0.6, ms: 0.5, ua: 0.3, fc: 0.75, lb: 0 }],
                ['砂糖の泡 // SUGAR BUBBLE', { tA: 26, pa: 0.6, ea: 0.62, ma: 0, md: 0.3, ms: 0, a1: 0, d1: 0.35, s1: 0.2, r1: 0.3, fc: 0.7, ua: 0.2, da: 0.15, lb: 0, wd: 0.7, vol: 0.9 }],
                ['手のひらゲーム // HANDHELD LEAD', { tA: 25, pa: 0.3, ua: 0, lb: 0, fc: 1, a1: 0, d1: 0.3, s1: 0.8, r1: 0.1, lv: 0.12, lr: 0.55, l1d: 0.2, vm: 0.45, gl: 0.1, vol: 0.7 }],
                ['階段の三角 // STAIR TRI BASS', { tA: 31, pa: 0.2, oct: 0.25, ua: 0, lb: 0, s1: 0.9, r1: 0.08, fc: 1, vol: 0.7 }],
                ['錫のオルゴール // TIN MUSIC BOX', { tA: 17, pa: 0.6, ua: 0, lb: 0, a1: 0, d1: 0.5, s1: 0, r1: 0.5, fc: 0.85, oct: 0.75, wd: 0.5 }],
                ['夢の褥 // DREAM PAD', { tA: 30, pa: 0.4, ua: 0.8, da: 0.3, tB: 26, pb: 0.5, lb: 0.4, ub: 0.5, db: 0.4, a1: 0.55, d1: 0.5, s1: 0.9, r1: 0.6, fc: 0.6, lp: 0.6, lr: 0.7, wd: 1, vol: 0.85 }],
                ['蜜の鍵盤 // HONEY KEYS', { tA: 30, pa: 0.6, ea: 0.7, ma: 0, md: 0.4, ms: 0.3, a1: 0, d1: 0.45, s1: 0.5, r1: 0.35, fc: 0.6, fe: 0.6, ua: 0.3, da: 0.12, lb: 0, lv: 0.04, lr: 0.4 }],
                ['霧の恍惚 // ENTRANCED PLUCK', { tA: 0, pa: 0.66, ua: 1, da: 0.4, fc: 0.45, fe: 0.85, ma: 0, md: 0.3, ms: 0, a1: 0, d1: 0.35, s1: 0, r1: 0.4, lb: 0, wd: 0.9, vol: 0.8 }],
                ['壊れた子守唄 // BROKEN LULLABY', { tA: 31, pa: 0.5, ua: 0.3, da: 0.1, drf: 0.6, tun: 0.3, a1: 0.05, d1: 0.6, s1: 0.3, r1: 0.6, lv: 0.15, lr: 0.3, fc: 0.7, lb: 0, vol: 0.85 }],
                ['吸う刺 // VAC STAB', { tA: 28, pa: 0.4, lp: 0.7, lr: 0.35, ua: 1, da: 0.45, tB: 28, pb: 0.7, lb: 0.5, sb: 0.25, ub: 0.6, a1: 0, d1: 0.4, s1: 0.7, r1: 0.25, fc: 0.8, wd: 0.9, vol: 0.75 }],
                ['金属の打 // METAL HIT', { tA: 32, pa: 0.7, ea: 0.1, ma: 0, md: 0.25, ms: 0, a1: 0, d1: 0.3, s1: 0, r1: 0.3, fc: 0.9, lb: 0, ua: 0.1, vol: 0.75 }],
                ['深い808 // DEEP 808', { _v: 6, tA: 0, pa: 0, ua: 0, oct: 0.25, lb: 0, npi: 0.625, na: 0, nd: 0.0913, ns: 0, nr: 0.075, a1: 0, d1: 0.7525, s1: 0.35, r1: 0.2728, ft: 0.0294, fc: 0.7833, fr: 0.05, fe: 0.5, onD: 0.75, dty: 0.75, dam: 0.38, dmx: 0.8, dtn: 0.8916, vm: 0.5, gl: 0.18, sub: 0, vol: 0.72 }],
                ['悲鳴のリード // SCREECH LEAD', { tA: 27, pa: 0.3, ea: 0.95, ma: 0, md: 0.35, ms: 0.3, lp: 0.7, lr: 0.45, ua: 0.3, da: 0.2, lb: 0, fc: 0.85, fd: 0.4, dty: 0.3125, dam: 0.4, vm: 0.45, gl: 0.15, vol: 0.7 }],
                ['獣の唸り // BEAST GROWL', { _v: 6, tA: 29, pa: 0.2, ua: 0.2, da: 0.15, lp: 0.85, lr: 0.2143, ls: 0.0625, lc: 0.625, ft: 0.0882, fc: 0.5228, fr: 0.32, fd: 0.25, fe: 0.575, ma: 0, md: 0.2399, ms: 0.4, onD: 0.75, dty: 0.75, dam: 0.3, sub: 0.5, oct: 0.25, vm: 0.5, gl: 0.06, lb: 0, a1: 0, d1: 0.2873, s1: 0.9, r1: 0.1347, vol: 0.72 }],
                ['毛羽のベース // FUZZ BASS', { tA: 33, pa: 0.5, oct: 0.25, sub: 0.5, ua: 0.2, da: 0.15, lb: 0, fc: 0.45, fr: 0.3, fe: 0.65, ma: 0, md: 0.3, ms: 0.2, vm: 0.45, gl: 0.08, vol: 0.75 }],
                ['酸の叫び // 303 SCREAM (MONO)', { _v: 3, tA: 20, pa: 0.25, vm: 0.4, gl: 0.22, ft: 0.85, fc: 0.28, fr: 0.82, fe: 0.86, fk: 0.4, ma: 0, md: 0.28, ms: 0, mr: 0.2, a1: 0, d1: 0.4, s1: 0.85, r1: 0.12, fd: 0.55, onD: 0.75, dty: 1.5 / 8, dam: 0.3, ua: 0, lb: 0, vol: 0.75 }],
                ['超鋸 // HYPERSAW 16', { _v: 3, tA: 0, pa: 0.66, ua: 1, da: 0.42, ska: 1.5 / 8, ba: 0.75, tB: 0, pb: 0.66, lb: 0.35, ub: 0.6, db: 0.55, skb: 2.5 / 8, fc: 0.82, fr: 0.1, fe: 0.55, a1: 0.03, d1: 0.4, s1: 0.85, r1: 0.42, wd: 1, vol: 0.62 }],
                ['吸血の和音 // VAMPIRE STAB', { _v: 6, tA: 0, pa: 0.667, ua: 0.4, da: 0.32, ska: 0.8125, tB: 0, pb: 0.667, sb: 0.75, lb: 0.25, ub: 0.1333, db: 0.2, ft: 0.0882, fc: 0.4924, fr: 0.3, fd: 0.3, fe: 0.8, ma: 0, md: 0.2022, ms: 0.05, vol: 0.52, a1: 0, d1: 0.3015, s1: 0.15, r1: 0.2223, onD: 0.75, dty: 0.15, dam: 0.25, wd: 0.9 }],
                ['工場の挽き // FACTORY GRIND', { _v: 3, tA: 32, pa: 0.5, wa: 8.5 / 12, xa: 0.75, tB: 6, pb: 0.4, lb: 0.4, wb: 6.5 / 12, xb: 0.6, onD: 0.75, dty: 4.5 / 8, dam: 0.55, fc: 0.6, fr: 0.35, ft: 0.95, lr: 0.2, lp: 0.85, oct: 0.25, sub: 0.4, a1: 0, s1: 0.9, r1: 0.15, vol: 0.62 }],
                ['溶けた鍵 // MELTED KEYS (LO-FANG)', { _v: 3, tA: 30, pa: 0.5, wa: 10.5 / 12, xa: 0.5, ua: 0.13, da: 0.2, fc: 0.55, fr: 0.1, ls: 5.5 / 6, lw1: [0.5, 0.56, 0.6, 0.62, 0.6, 0.55, 0.5, 0.45, 0.42, 0.4, 0.42, 0.45, 0.48, 0.5, 0.52, 0.5], lr: 0.62, lf: 0, lv: 0.35, a1: 0.01, d1: 0.5, s1: 0.5, r1: 0.4, drf: 0.4, lb: 0, vol: 0.72 }],
                ['硬い叫び // HARD SCREECH', { _v: 6, tA: 0, pa: 0.667, ua: 0.2667, da: 0.18, tB: 27, pb: 0.55, lb: 0.45, sb: 0.5, ub: 0.1333, db: 0.15, ft: 0.6176, fc: 0.6216, fr: 0.82, fd: 0.7, fe: 0.6167, ma: 0, md: 0.2218, ms: 0.35, lr: 0.6, lf: 0.75, ls: 0.0625, lc: 0.65, npi: 0.625, na: 0, nd: 0.1501, ns: 0, nr: 0.075, onD: 0.75, dty: 0.25, dam: 0.7, dpo: 0.25, dtn: 0.9366, f2on: 0.5, ft2: 0.6765, fc2: 0.2801, fr2: 0.15, vm: 0.5, gl: 0.08, a1: 0, d1: 0.2873, s1: 0.95, r1: 0.1562, vol: 0.6 }],
                ['祈りの面 // PRAYER PAD', { _v: 3, tA: 24, pa: 0, ea: 1, ma: 0.75, md: 0.8, ms: 1, wdk: [[0.5, 0.69, 0.85, 0.96, 1, 0.96, 0.85, 0.69, 0.5, 0.31, 0.15, 0.04, 0, 0.04, 0.15, 0.31], [0.5, 0.8, 0.95, 0.9, 0.7, 0.55, 0.5, 0.5, 0.5, 0.5, 0.45, 0.3, 0.1, 0.05, 0.2, 0.4], [0.5, 0.95, 0.5, 0.05, 0.5, 0.95, 0.5, 0.05, 0.5, 0.9, 0.5, 0.1, 0.5, 0.8, 0.5, 0.2]], ua: 0.4, da: 0.3, a1: 0.5, r1: 0.6, fc: 0.7, wd: 0.95, lb: 0, vol: 0.65 }],
                ['ダイオード酸 // DIODE ACID (MONO)', { _v: 6, tA: 0, pa: 0.667, ua: 0, ft: 0.7353, fc: 0.3251, fr: 0.78, fe: 0.8167, fk: 0.5, ma: 0, md: 0.2501, ms: 0, m1s: 0.2895, m1d: 0.1912, m1a: 0.65, vol: 0.72, a1: 0, d1: 0.315, s1: 0.7, r1: 0.0969, onD: 0.75, dty: 0.75, dam: 0.35, vm: 0.83, gl: 0.12, sub: 0 }],
                ['転がる低音 // ROLLING TECHNO BASS', { _v: 6, tA: 0, pa: 0, ua: 0, oct: 0.25, tB: 0, pb: 0.667, lb: 0.18, sb: 0.5, ub: 0.0667, db: 0.2, ft: 0.0882, fc: 0.3969, fr: 0.2, fd: 0.5, fe: 0.625, ma: 0, md: 0.1385, ms: 0, vol: 0.78, onD: 0.75, dty: 0.75, dam: 0.5, dpo: 0.75, a1: 0, d1: 0.2022, s1: 0, r1: 0.1199, sub: 0.3, vm: 0.17 }],
                ['生の蹴り // RAW KICK', { _v: 6, tA: 0, pa: 0, ua: 0, npi: 0.9375, na: 0, nd: 0.1041, ns: 0, nr: 0.075, a1: 0, d1: 0.4274, s1: 0, r1: 0.109, ft: 0.0294, fc: 0.8916, fr: 0, fe: 0.5, vol: 0.62, onD: 0.75, dty: 0.25, dam: 0.85, dpo: 0.25, dtn: 0.9607, sub: 0, vm: 0.5 }],
                ['昇る超鋸 // UPLIFT SUPERSAW', { _v: 6, tA: 0, pa: 0.667, ua: 1.0, da: 0.45, ba: 0.62, ska: 0.1875, tB: 0, pb: 0.667, lb: 0.3, sb: 0.6458, ub: 0.5333, db: 0.5, ft: 0.0294, fc: 0.9001, fr: 0.1, fe: 0.5, sub: 0, vol: 0.5, a1: 0.0988, d1: 0.3642, s1: 0.85, r1: 0.2728, drf: 0.12, wd: 1, _fx: [{"type": "hollow", "p": {"mode": 0.6, "size": 0.7, "decay": 0.6, "mix": 0.22}}, {"type": "echo", "p": {"time": 0.5, "fb": 0.35, "mix": 0.15}}] }],
                ['トランスの爪弾き // TRANCE PLUCK', { _v: 6, tA: 0, pa: 0.667, ua: 0.4, da: 0.3, ft: 0.0882, fc: 0.37, fr: 0.25, fe: 0.85, ma: 0, md: 0.1894, ms: 0, a1: 0, d1: 0.2399, s1: 0, r1: 0.2077, wd: 0.85, vol: 0.95, sub: 0, _fx: [{"type": "echo", "p": {"time": 0.5, "fb": 0.45, "mix": 0.25}}, {"type": "hollow", "p": {"mix": 0.18}}] }],
                ['ネオンの刃 // CYBER FM BASS', { _v: 6, tA: 0, pa: 0, ua: 0, oct: 0.25, tB: 0, pb: 0, sb: 0.75, fnb: 0.5, lb: 0, ub: 0, fmm: 0.15, fma: 0.4, m1s: 0.0789, m1d: 0.3382, m1a: 0.675, ma: 0, md: 0.1894, ms: 0, ft: 0.0882, fc: 0.5892, fr: 0.35, fd: 0.4, fe: 0.6, onD: 0.75, dty: 0.85, dam: 0.4, sub: 0.3, vm: 0.5, gl: 0.05, a1: 0, d1: 0.2567, s1: 0.8, r1: 0.109, vol: 0.68 }],
                ['鉄の祈り // INDUSTRIAL METAL', { _v: 6, tA: 32, pa: 0.6, ua: 0, tB: 0, pb: 0, sb: 0.625, fnb: 0.4742, lb: 0, ub: 0, fmm: 0.15, fma: 0.3, ft: 0.6765, fc: 0.2167, fr: 0.6, dam: 0.4, noise: 0.1, sub: 0.3, vol: 0.85, onD: 0.75, dty: 0.95, nty: 0.75, a1: 0, d1: 0.2724, s1: 0.3, r1: 0.1921 }],
                ['ゴシックの合唱 // GOTHIC CHOIR', { _v: 6, tA: 16, pa: 0.3, ua: 0.4, da: 0.25, tB: 2, pb: 0.5, lb: 0.5, sb: 0.5, ub: 0.2667, db: 0.2, ft: 0.3824, fc: 0.5631, fr: 0.4, lr: 0.7857, ls: 0.1875, lp: 0.7, sub: 0, vol: 0.42, a1: 0.5476, d1: 0.4074, s1: 0.9, r1: 0.6017, drf: 0.2, wd: 1, _fx: [{"type": "chasm", "p": {"size": 0.75, "fb": 0.65, "mix": 0.4}}] }],
                ['暗い波の低音 // DARKWAVE BASS', { _v: 6, tA: 0, pa: 0.667, ua: 0.0667, da: 0.15, tB: 0, pb: 1, lb: 0.45, sb: 0.25, ub: 0, ft: 0.0882, fc: 0.4126, fr: 0.3, fe: 0.6667, ma: 0, md: 0.2399, ms: 0.2, vol: 0.78, a1: 0, d1: 0.2873, s1: 0.6, r1: 0.1562, drf: 0.35, vm: 0.5, _fx: [{"type": "twin", "p": {"amount": 0.45, "mix": 0.35}}] }],
                ['フーヴァー // HOOVER', { _v: 6, tA: 0, pa: 0.667, ua: 0.2667, da: 0.5, tB: 1, pb: 0.5, wb: 0.4643, xb: 0.5, lb: 0.6, sb: 0.25, npi: 0.4375, na: 0, nd: 0.2022, ns: 0, nr: 0.109, ft: 0.0294, fc: 0.7649, fr: 0.1, fe: 0.5, sub: 0, vol: 0.55, onD: 0.75, dty: 0.15, dam: 0.3, wd: 1, vm: 0.83, gl: 0.2, a1: 0, d1: 0.315, s1: 0.9, r1: 0.1921, _fx: [{"type": "twin", "p": {"amount": 0.6, "mix": 0.3}}] }],
                ['リース // REESE', { _v: 6, tA: 0, pa: 0.667, ua: 0.0667, da: 0.1, tB: 0, pb: 0.667, lb: 0.8, sb: 0.5, fnb: 0.53, ub: 0, oct: 0.25, ft: 0.0882, fc: 0.4683, fr: 0.2, fe: 0.5, l2r: 0.25, l2f: 0.75, l2s: 0.0625, l2c: 0.625, onD: 0.75, dty: 0.75, dam: 0.25, vm: 0.5, a1: 0, d1: 0.2873, s1: 0.95, r1: 0.1562, vol: 0.7 }],
                ['叫ぶ低音 // SCREAMER BASS', { _v: 6, tA: 0, pa: 0.667, ua: 0.1333, da: 0.12, tB: 0, pb: 1, lb: 0.4, sb: 0.5, ft: 0.6176, fc: 0.4398, fr: 0.9, fd: 0.8, fe: 0.6667, ma: 0, md: 0.2218, ms: 0.3, lr: 0.2143, ls: 0.3125, lc: 0.675, onD: 0.75, dty: 0.25, dam: 0.3, oct: 0.25, vm: 0.5, gl: 0.05, a1: 0, d1: 0.2873, s1: 0.9, r1: 0.1347, vol: 0.6 }],
                ['スペクトルの口 // SPECTRAL MOUTH', { _v: 6, oka: 0.25, tA: 21, pa: 0.5, ua: 0.1333, da: 0.12, sma: 0.3889, sxa: 0.5, onL3: 0.75, l3r: 0.6429, l3s: 0.1875, m1s: 0.7632, m1d: 0.8382, m1a: 0.85, a1: 0.0689, d1: 0.315, s1: 0.85, r1: 0.2077, sub: 0, wd: 0.8, vol: 0.68, _fx: [{"type": "hollow", "p": {"mix": 0.18}}] }],
                ['倍音の階段 // HARMONIC STAIRS', { _v: 6, oka: 0.25, tA: 0, pa: 0.667, ua: 0.2667, da: 0.2, sma: 0.6111, sxa: 0.0, m1s: 0.0789, m1d: 0.8382, m1a: 0.95, ma: 0, md: 0.3864, ms: 0, a1: 0, d1: 0.3642, s1: 0.6, r1: 0.1921, sub: 0, vol: 0.66, _fx: [{"type": "echo", "p": {"time": 0.5, "fb": 0.3, "mix": 0.2}}] }],
                ['奇偶の掃き // ODD ↔ EVEN SWEEP', { _v: 6, oka: 0.25, tA: 0, pa: 0.667, ua: 0.4, da: 0.3, sma: 0.5, sxa: 0.5, onL3: 0.75, l3r: 0.7857, m1s: 0.7632, m1d: 0.8382, m1a: 1.0, a1: 0.2734, d1: 0.4074, s1: 0.9, r1: 0.3153, sub: 0, wd: 1, vol: 0.6, _fx: [{"type": "hollow", "p": {"mix": 0.25, "decay": 0.6}}] }],
                ['自分を噛む // FEEDBACK SCREAM', { _v: 6, tA: 0, pa: 0.667, ua: 0.0667, da: 0.1, fmm: 0.95, fma: 0.25, m1s: 0.0789, m1d: 0.3382, m1a: 0.8, ma: 0, md: 0.2873, ms: 0.3, onF: 0.75, ft: 0.6176, fc: 0.6714, fr: 0.6, onD: 0.75, dty: 0.25, dam: 0.35, vm: 0.5, gl: 0.06, a1: 0, d1: 0.2873, s1: 0.9, r1: 0.1562, sub: 0, vol: 0.55 }],
                ['位相の褥 // PHASER PAD', { _v: 6, tA: 0, pa: 0.667, ua: 0.5333, da: 0.35, tB: 0, pb: 1, lb: 0.3, sb: 0.25, ub: 0.1333, onF: 0.75, ft: 0.8529, fc: 0.4924, fr: 0.7, lr: 0.9286, ls: 0.1875, lc: 0.8, a1: 0.447, d1: 0.4074, s1: 0.9, r1: 0.4324, drf: 0.2, wd: 1, sub: 0, vol: 0.58, _fx: [{"type": "hollow", "p": {"mix": 0.25, "decay": 0.6}}] }],
                ['喋る低音 // FORMANT TALKER', { _v: 6, tA: 0, pa: 0.667, ua: 0.1333, da: 0.15, tB: 0, pb: 1, lb: 0.5, sb: 0.25, oct: 0.25, onF: 0.75, ft: 0.7941, fc: 0.5, fr: 0.65, lr: 0.3571, ls: 0.5625, l1k: 0.5, lc: 0.75, onD: 0.75, dty: 0.75, dam: 0.35, vm: 0.5, gl: 0.05, a1: 0, d1: 0.2873, s1: 0.9, r1: 0.1347, sub: 0.3, vol: 0.66 }],
                ['鋭い爪弾き // SNAP PLUCK', { _v: 6, tA: 0, pa: 0.667, ua: 0.2, da: 0.2, ft: 0.0882, fc: 0.3315, fr: 0.3, fe: 0.9167, ma: 0, md: 0.2218, ms: 0, e2c: 0.95, e1c: 0.8, a1: 0, d1: 0.2873, s1: 0, r1: 0.1921, sub: 0, wd: 0.7, vol: 0.9, _fx: [{"type": "echo", "p": {"time": 0.5, "fb": 0.3, "mix": 0.2}}] }],
                ['電脳の階段 // CYBER STEPS (ARP)', { _v: 6, tA: 0, pa: 0.667, ua: 0.0667, da: 0.1, ft: 0.7353, fc: 0.4398, fr: 0.6, fe: 0.7083, ma: 0, md: 0.1804, ms: 0, onD: 0.75, dty: 0.85, dam: 0.3, a1: 0, d1: 0.2218, s1: 0.5, r1: 0.0969, sub: 0, vol: 0.62, cxArp: 0.15, cxRate: 0.5833, cxGate: 0.55, cxSqOn: 0.75, cxSqN: 0.4667, cxSq: [{"o": 1, "n": 0, "v": 1, "t": 0}, {"o": 1, "n": 0, "v": 0.5, "t": 0}, {"o": 1, "n": 12, "v": 0.8, "t": 0}, {"o": 0, "n": 0, "v": 0.8, "t": 0}, {"o": 1, "n": 7, "v": 0.9, "t": 1}, {"o": 1, "n": 10, "v": 0.6, "t": 0}, {"o": 1, "n": 0, "v": 0.8, "t": 0}, {"o": 1, "n": -5, "v": 0.7, "t": 0}, {"o": 1, "n": 0, "v": 1, "t": 0}, {"o": 1, "n": 0, "v": 0.5, "t": 0}, {"o": 1, "n": 12, "v": 0.8, "t": 0}, {"o": 0, "n": 0, "v": 0.8, "t": 0}, {"o": 1, "n": 7, "v": 0.9, "t": 1}, {"o": 1, "n": 10, "v": 0.6, "t": 0}, {"o": 1, "n": 0, "v": 0.8, "t": 0}, {"o": 1, "n": -5, "v": 0.7, "t": 0}], cxSw: 0.2 }],
                ['指で歌う // EXPRESSIVE LEAD (MPE)', { _v: 6, tA: 0, pa: 0.667, ua: 0.1333, da: 0.12, tB: 27, pb: 0.3, lb: 0.3, onF: 0.75, ft: 0.0882, fc: 0.5317, fr: 0.35, m1s: 0.8684, m1d: 0.1912, m1a: 0.925, m2s: 0.9211, m2d: 0.0441, m2a: 0.95, m3s: 0.9737, m3d: 0.3088, m3a: 0.8, m4s: 0.8684, m4d: 0.4853, m4a: 0.65, vm: 0.5, gl: 0.08, a1: 0.0474, d1: 0.2873, s1: 0.85, r1: 0.1921, sub: 0, pbr: 0.875, vol: 0.62, _fx: [{"type": "echo", "p": {"time": 0.5, "fb": 0.3, "mix": 0.18}}, {"type": "hollow", "p": {"mix": 0.15}}] }],
                ['粒の雲 · 音をあげて // GRAIN CLOUD (GIVE IT A SOUND)', { _v: 6, oka: 0.4167, tA: 16, pa: 0.3, ua: 0.1333, da: 0.2, gza: 0.45, gda: 0.7, gsa: 0.35, lr: 0.9286, ls: 0.1875, lp: 0.8, a1: 0.387, d1: 0.4074, s1: 0.9, r1: 0.4324, sub: 0, wd: 1, vol: 0.66, _fx: [{"type": "hollow", "p": {"mix": 0.3, "decay": 0.65}}] }],
                ['木琴 // MARIMBA (MODAL)', { _v: 6, oka: 0.9167, pa: 0.25, ua: 0, kda: 0.45, kba: 0.45, kxa: 0, a1: 0, d1: 0.7068, s1: 1, r1: 0.3153, sub: 0, onF: 0.25, vol: 0.75, _fx: [{"type": "hollow", "p": {"mix": 0.18}}] }],
                ['教会の鐘 // CHURCH BELL (MODAL)', { _v: 6, oka: 0.9167, pa: 0.5, ua: 0, kda: 0.85, kba: 0.6, kxa: 0, a1: 0, d1: 1.0, s1: 1, r1: 0.7069, sub: 0, onF: 0.25, vol: 0.62, _fx: [{"type": "hollow", "p": {"mode": 0.6, "size": 0.8, "decay": 0.75, "mix": 0.3}}] }],
                ['擦った硝子 // BOWED GLASS (MODAL)', { _v: 6, oka: 0.9167, pa: 1, ua: 0.0667, da: 0.08, kda: 0.5, kba: 0.4, kxa: 0.95, a1: 0.387, d1: 0.4074, s1: 1, r1: 0.4324, sub: 0, onF: 0.25, wd: 0.8, vol: 0.6, _fx: [{"type": "hollow", "p": {"mix": 0.3, "decay": 0.65}}] }],
                ['鋼の竪琴 // STEEL HARP (STRING)', { _v: 6, oka: 0.75, pa: 0.667, ua: 0, kda: 0.6, kba: 0.7, kxa: 0.2, a1: 0, d1: 0.8163, s1: 1, r1: 0.3866, sub: 0, onF: 0.25, vol: 0.8, _fx: [{"type": "hollow", "p": {"mix": 0.2}}] }],
                ['ナイロンの爪 // NYLON PLUCK (STRING)', { _v: 6, oka: 0.75, pa: 0.33, ua: 0, kda: 0.4, kba: 0.3, kxa: 0.15, a1: 0, d1: 0.5769, s1: 1, r1: 0.2488, sub: 0, onF: 0.25, vol: 0.85 }],
                ['CZの共鳴 // CZ RESONANCE (PHASE DIST)', { _v: 6, tA: 0, pa: 0, ua: 0.0667, da: 0.08, wa: 0.8929, xa: 0.1, m1s: 0.0789, m1d: 0.1029, m1a: 0.925, ma: 0, md: 0.2724, ms: 0.2, oct: 0.25, onF: 0.25, a1: 0, d1: 0.2873, s1: 0.85, r1: 0.1347, sub: 0.2, vm: 0.5, gl: 0.05, vol: 0.72 }],
                ['波脈の鍵盤 // PULSE PM KEYS', { _v: 6, tA: 0, pa: 0, ua: 0.0667, da: 0.06, wa: 0.8929, xa: 0.2, va: 0.9643, ya: 0.6, m1s: 0.0789, m1d: 0.1029, m1a: 0.8, m2s: 0.2895, m2d: 0.3676, m2a: 0.6, ma: 0, md: 0.3642, ms: 0.1, onF: 0.25, a1: 0, d1: 0.5158, s1: 0.3, r1: 0.2728, sub: 0, wd: 0.6, vol: 0.56, _fx: [{"type": "twin", "p": {"amount": 0.35, "mix": 0.25}}, {"type": "hollow", "p": {"mix": 0.15}}] }],
                ['混沌の唸り // CHAOS DRONE', { _v: 6, tA: 21, pa: 0.4, ua: 0.4, da: 0.3, tB: 16, pb: 0.5, lb: 0.4, ub: 0.1333, onF: 0.75, ft: 0.0882, fc: 0.4924, fr: 0.45, ls: 0.8125, lr: 0.35, lf: 0.75, lc: 0.775, onL3: 0.75, l3s: 0.9375, l3r: 0.3, l3f: 0.75, m1s: 0.7632, m1d: 0.0147, m1a: 0.8, m2s: 0.7632, m2d: 0.4559, m2a: 0.7, a1: 0.6122, d1: 0.4074, s1: 1, r1: 0.6121, sub: 0.2, wd: 1, vol: 0.6, _fx: [{"type": "chasm", "p": {"size": 0.7, "fb": 0.6, "mix": 0.35}}] }],
                ['描いたゲート // DRAWN GATE (TRANCE)', { _v: 6, tA: 0, pa: 0.667, ua: 0.5333, da: 0.4, ska: 0.1875, ls: 0.6875, lq1: [[0, 0, 0], [0.12, 0, 0.6], [0.19, 1, 0], [0.245, 1, 0], [0.25, 0, 0], [0.37, 0, 0.6], [0.44, 1, 0], [0.495, 1, 0], [0.5, 0, 0], [0.62, 0, 0.6], [0.69, 1, 0], [0.745, 1, 0], [0.75, 0, 0], [0.87, 0, 0.6], [0.94, 1, 0], [0.995, 1, 0]], lr: 0.5, la2: 1, l1g: 0.75, onF: 0.75, ft: 0.0294, fc: 0.8524, a1: 0.0474, d1: 0.4074, s1: 1, r1: 0.2223, sub: 0, wd: 1, vol: 0.55, _fx: [{"type": "hollow", "p": {"mix": 0.2}}, {"type": "echo", "p": {"time": 0.5, "fb": 0.3, "mix": 0.15}}] }],
                ['乱れた階段 // BROKEN ARP (CHANCE)', { _v: 6, tA: 27, pa: 0.4, ua: 0.1333, da: 0.15, onF: 0.75, ft: 0.6176, fc: 0.6975, fr: 0.5, fe: 0.6667, ma: 0, md: 0.1709, ms: 0.2, a1: 0, d1: 0.2022, s1: 0.6, r1: 0.109, sub: 0, vol: 1, cxArp: 0.45, cxRate: 0.5833, cxAoct: 0.375, cxGate: 0.5, cxCh: 0.72, _fx: [{"type": "echo", "p": {"time": 0.5, "fb": 0.4, "mix": 0.22}}] }],
                ['強さで唸る // VELOCITY GROWL', { _v: 6, tA: 29, pa: 0.3, ua: 0.1333, da: 0.15, onF: 0.75, ft: 0.6176, fc: 0.3315, fr: 0.6, fd: 0.5, m1s: 0.0789, m1d: 0.1912, m1a: 0.95, m1c: 0.8, m1x: 0.2895, ma: 0, md: 0.2567, ms: 0.2, onD: 0.75, dty: 0.75, dam: 0.35, oct: 0.25, vm: 0.5, a1: 0, d1: 0.2873, s1: 0.9, r1: 0.1347, sub: 0.4, vol: 0.55 }],
                ['黒舌の唸り // BLACK TONGUE GROWL (THROAT BASS)', { tA: 4, pa: 0.5, ua: 0.2, da: 0.25, oct: 0.25, vm: 0.5, gl: 0.15, onT: 0.75, thv: 0.15, thz: 0.25, thg: 0.35, thh: 0.6, thb: 0.1, thm: 0.9, onL1: 0.75, lr: 0.3571, ls: 0.0625, onM: 0.75, m1s: 0.1842, m1d: 0.9359, m1a: 0.85, onF: 0.75, ft: 0.0882, fc: 0.62, fr: 0.25, fe: 0.6, ma: 0, md: 0.35, ms: 0.3, onD: 0.75, dty: 0.75, dam: 0.35, dmx: 0.8, sub: 0.35, a1: 0, d1: 0.4, s1: 0.85, r1: 0.15, vol: 0.8, _v: 8 }],
                ['檻の獣 // THE CAGE BEAST', { tA: 29, pa: 0.6, ua: 0.4, da: 0.5, oct: 0.25, okb: 0.9286, onB: 0.75, lb: 0.5, htb: 0.9, hpb: 0.55, onT: 0.75, thv: 0.05, thz: 0.02, thg: 0.85, thh: 0.15, thb: 0.55, thm: 1, onN: 0.75, noise: 0.25, nty: 0.8333, nc: 0.3, onF: 0.75, ft: 0.5588, fc: 0.6, fr: 0.35, onD: 0.75, dty: 0.15, dam: 0.5, onL1: 0.75, lr: 0.6429, ls: 0.8125, onM: 0.75, m1s: 0.1842, m1d: 0.9615, m1a: 0.65, m2s: 0.3947, m2d: 0.9359, m2a: 0.8, a1: 0.35, d1: 0.5, s1: 0.9, r1: 0.45, vol: 0.65, _v: 8, _fx: [{ type: 'chasm', p: { mode: 0.5, size: 0.8, fb: 0.7, mix: 0.3 } }] }],
                ['鎖の間 // THE CHAIN ROOM (NOISE ALONE)', { onA: 0.25, onB: 0.25, onC: 0.25, sub: 0, onS: 0.25, onN: 0.75, noise: 1, nty: 0.8333, nc: 0.85, nft: 0.7, nfc: 0.7, nfr: 0.5, nkt: 1, onF: 0.75, ft: 0.3235, fc: 0.5, fr: 0.6, fk: 1, a1: 0, d1: 0.6, s1: 0.6, r1: 0.4, vol: 1, _v: 8, _fx: [{ type: 'hollow', p: { mode: 0.9, size: 0.6, mix: 0.3 } }] }],
                ['炉 // THE FURNACE (NOISE ALONE)', { onA: 0.25, onB: 0.25, onC: 0.25, sub: 0, onS: 0.25, onN: 0.75, noise: 0.85, nty: 0.9444, nc: 0.5, onT: 0.75, thv: 0.2, thz: 0.05, thg: 0, thb: 0, thm: 0.7, onF: 0.75, ft: 0.0882, fc: 0.5, fr: 0.2, onL1: 0.75, lr: 0.9286, lf: 0.75, ls: 0.9375, onM: 0.75, m1s: 0.1842, m1d: 0.9359, m1a: 0.7, a1: 0.4, s1: 1, r1: 0.5, vol: 0.85, _v: 8 }],
                ['蝋の夜 // WAX NIGHT (DARKWAVE PULSE)', { oka: 0.9286, hta: 0.55, ua: 0.2, da: 0.2, onF: 0.75, ft: 0.6176, fc: 0.4, fr: 0.45, fe: 0.78, ma: 0, md: 0.3, ms: 0, a1: 0, d1: 0.45, s1: 0, r1: 0.35, vcut: 0.8, sub: 0.2, wd: 0.7, vol: 0.75, _v: 8, _fx: [{ type: 'echo', p: { style: 0.1, fb: 0.45, mix: 0.28 } }] }],
                ['沈黙の部屋 // THE SILENCE ROOM (WHISPERS)', { onA: 0.25, onB: 0.25, onC: 0.25, sub: 0, onS: 0.25, onN: 0.75, noise: 0.9, nty: 0.1667, onT: 0.75, thv: 0.5, thz: 0.55, thm: 1, thb: 0, onF: 0.25, onL3: 0.75, l3r: 0.5, l3f: 0.75, l3s: 0.5625, onM: 0.75, m1s: 0.7632, m1d: 0.9359, m1a: 0.95, m2s: 0.3947, m2d: 0.9615, m2a: 0.7, a1: 0.25, s1: 1, r1: 0.45, wd: 1, vol: 0.6, _v: 8, _fx: [{ type: 'nave', p: { size: 0.5, mix: 0.25 } }] }],
                ['尋問官 // THE INTERROGATOR (SCREECH)', { tA: 27, pa: 0.5, ua: 0.35, da: 0.3, wa: 0.25, xa: 0.4, onT: 0.75, thv: 0.9, thz: 0.7, thg: 0.2, thh: 0.7, thm: 0.6, onD: 0.75, dty: 0.35, dam: 0.3, dmx: 0.5, onF: 0.75, ft: 0.0882, fc: 0.65, fr: 0.3, vm: 0.5, gl: 0.1, onL1: 0.75, lr: 0.2143, lv: 0.06, onM: 0.75, m1s: 0.8684, m1d: 0.9872, m1a: 0.9, a1: 0, d1: 0.5, s1: 0.8, r1: 0.2, vol: 0.85, _v: 8 }],
                ['小さな鈴 // LITTLE BELLS (MODAL)', { oka: 0.7857, pa: 0.9, kda: 0.55, kba: 0.7, kxa: 0.12, ua: 0, okb: 0.7857, onB: 0.75, lb: 0.35, pb: 0.5, sb: 0.75, kdb: 0.45, onF: 0.25, sub: 0, a1: 0, d1: 0.8, s1: 1, r1: 0.4, vol: 0.65, _v: 8, _fx: [{ type: 'glint', p: { size: 0.6, shim: 0.4, mix: 0.3 } }] }],
                ['真珠の夜 // PEARL NIGHT (THE HIVE TAKES THEM)', { tA: 0, pa: 0.667, ua: 1, da: 0.55, hiv: 0.8, hvt: 0.55, onT: 0.75, thv: 0.55, thz: 0.6, thm: 0.35, onF: 0.75, ft: 0.0294, fc: 0.78, fr: 0.2, fe: 0.55, a1: 0.05, d1: 0.5, s1: 0.85, r1: 0.4, wd: 1, vol: 0.7, _v: 8, _fx: [{ type: 'glint', p: { mix: 0.25 } }, { type: 'echo', p: { fb: 0.35, mix: 0.2 } }] }],
                ['夢見の聖歌隊 // THE DREAMERS CHOIR', { tA: 0, pa: 0.667, ua: 0.6, da: 0.3, hiv: 0.35, onT: 0.75, thv: 0.3, thz: 0.6, thb: 0.2, thm: 1, onB: 0.75, tB: 16, lb: 0.3, ub: 0.3, onM: 0.75, m1s: 0.0789, m1d: 0.9359, m1a: 0.7, ma: 0.6, md: 0.7, ms: 1, mr: 0.5, onL1: 0.75, lr: 0.7857, lv: 0.04, a1: 0.45, d1: 0.5, s1: 1, r1: 0.55, onF: 0.75, fc: 0.7, fr: 0.1, wd: 0.9, vol: 0.75, _v: 8, _fx: [{ type: 'nave', p: { size: 0.8, choir: 0.5, mix: 0.35 } }] }],
                ['妖精の宮廷 // THE FAIRY COURT', { tA: 0, pa: 0.5, oct: 0.5, ua: 0.45, da: 0.15, hiv: 0.25, onT: 0.75, thv: 0.85, thz: 0.7, thb: 0.15, thm: 0.85, onN: 0.75, noise: 0.06, nty: 0.7222, nc: 0.5, nft: 0.3, nfc: 0.7, onF: 0.75, ft: 0.0294, fc: 0.68, onL1: 0.75, lr: 0.2143, lv: 0.05, onM: 0.75, m1s: 0.3947, m1d: 0.9359, m1a: 0.7, a1: 0.2, d1: 0.6, s1: 0.7, r1: 0.6, wd: 1, vol: 0.7, _v: 8, _fx: [{ type: 'glint', p: { shim: 0.35, damp: 0.6, mix: 0.28 } }, { type: 'sway', p: { mix: 0.3 } }] }],
                ['羽音 // WINGBEATS (NOISE ALONE)', { onA: 0.25, onB: 0.25, onC: 0.25, sub: 0, onS: 0.25, onN: 0.75, noise: 1, nty: 0.7222, nc: 0.55, nft: 0.3, nfc: 0.72, nfr: 0.15, nkt: 0.8, onF: 0.25, a1: 0.1, s1: 1, r1: 0.35, wd: 1, vol: 1, _v: 8 }],
                ['小さな歌い手 // THE SMALL SINGER', { tA: 0, pa: 0.667, ua: 0.1, da: 0.1, onT: 0.75, thv: 0.5, thz: 0.72, thb: 0.15, thm: 1, onL1: 0.75, lr: 0.2143, lf: 0.75, ls: 0.0625, lv: 0.07, l1d: 0.5, vm: 0.8333, gl: 0.12, onM: 0.75, m1s: 0.3421, m1d: 0.9615, m1a: 0.65, a1: 0.12, d1: 0.4, s1: 0.9, r1: 0.3, onF: 0.75, fc: 0.8, vol: 0.75, _v: 8, _fx: [{ type: 'hollow', p: { mix: 0.2 } }] }],
                ['艶の聖堂 // GLOSS CATHEDRAL (GOTHIC)', { tA: 8, pa: 0.5, ua: 0.25, da: 0.1, onB: 0.75, tB: 16, lb: 0.35, onT: 0.75, thv: 0.25, thz: 0.35, thm: 0.55, a1: 0.08, s1: 1, r1: 0.45, onF: 0.75, fc: 0.7, onL1: 0.75, lr: 0.3571, lv: 0.03, vol: 0.5, _v: 8, _fx: [{ type: 'nave', p: { size: 0.9, dark: 0.5, mix: 0.4 } }] }],
                ['心臓の鼓動 // HEARTBEAT BASS (PULSE)', { oka: 0.9286, hta: 0.85, ua: 0, oct: 0.25, vm: 0.5, sub: 0.4, onS: 0.75, onF: 0.75, ft: 0.0882, fc: 0.38, fr: 0.35, fe: 0.75, ma: 0, md: 0.25, ms: 0.1, onD: 0.75, dty: 0.15, dam: 0.3, a1: 0, d1: 0.35, s1: 0.5, r1: 0.1, vol: 0.62, _v: 8 }],
                ['酸の舌 // ACID TONGUE (TALKING 303)', { tA: 0, pa: 0.667, ua: 0, vm: 0.5, gl: 0.1, onF: 0.75, ft: 0.7353, fc: 0.35, fr: 0.75, fe: 0.8, ma: 0, md: 0.2, ms: 0, onT: 0.75, thv: 0.3, thz: 0.45, thm: 0.55, onM: 0.75, m1s: 0.0789, m1d: 0.9359, m1a: 0.85, onD: 0.75, dty: 0.75, dam: 0.3, a1: 0, d1: 0.3, s1: 0.6, r1: 0.1, vcut: 0.8, vol: 0.8, _v: 8 }],
                ['生の咆哮 // RAW ROAR (HARDSTYLE)', { tA: 0, pa: 0.667, ua: 0.55, da: 0.35, ska: 0.1875, onT: 0.75, thv: 0.6, thz: 0.32, thg: 0.15, thh: 0.4, thm: 0.75, onD: 0.75, dty: 0.75, dam: 0.35, dmx: 0.7, onF: 0.75, ft: 0.0882, fc: 0.6, fr: 0.25, fe: 0.6, md: 0.4, ms: 0.5, onL1: 0.75, lr: 0.3571, onM: 0.75, m1s: 0.1842, m1d: 0.9359, m1a: 0.8, a1: 0, d1: 0.5, s1: 0.9, r1: 0.2, vm: 0.5, gl: 0.08, vol: 0.62, _v: 8, _fx: [{ type: 'hollow', p: { mix: 0.18 } }] }],
                ['縛られた心臓 // THE TIED HEART (STUMBLING)', { oka: 0.9286, hta: 0.7, hpa: 0.75, tA: 2, pa: 0.4, ua: 0.2, da: 0.3, onT: 0.75, thv: 0.2, thz: 0.2, thb: 0.3, thm: 0.7, onF: 0.75, fc: 0.65, a1: 0.3, s1: 1, r1: 0.6, onL1: 0.75, lr: 0.9286, lf: 0.75, ls: 0.8125, onM: 0.75, m1s: 0.1842, m1d: 0.9103, m1a: 0.7, vol: 0.6, _v: 8, _fx: [{ type: 'chasm', p: { size: 0.7, mix: 0.25 } }] }],
            ],
            screen(name, x, w, h, s, D) {
                x.fillStyle = '#050a08'; x.fillRect(0, 0, w, h);
                const A = D.A || '#8fffd0', line = (pts, col, wd, glow) => { x.strokeStyle = col; x.lineJoin = 'round'; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); if (glow) { x.globalAlpha = 0.22; x.lineWidth = wd + glow * 0.6; x.stroke(); x.globalAlpha = 1; } x.lineWidth = wd; x.stroke(); };
                const txt = (t, X0, Y, c) => { x.fillStyle = c || '#9dffc8'; x.font = '9px Courier New'; x.fillText(t, X0, Y); };
                if (name === 'wtA' || name === 'wtB' || name === 'wtC') {
                    let k = name.slice(2).toLowerCase(), K = name.slice(2), id = s['t' + K] != null ? Math.round(s['t' + K]) : s['t' + k] != null ? Math.min(15, Math.floor(s['t' + k] * 16)) : 0; if (!tableOwned(id)) id = 0;
                    let W = window.NBFX && NBFX.WT; if (!W) return; let kd = Math.min(6, Math.floor((s['ok' + k] || 0) * 7)), wauK = s['wau' + K] && s['wau' + K].f ? s['wau' + K] : s.wau, lit = k === 'a' || (s[k === 'c' ? 'lc3' : 'l' + k] || 0) > 0.01 || (k === 'b' && (s.fmm || 0) > 0.1) || (k === 'c' && (s.fmm || 0) > 0.45);
                    if (kd === 2 || kd === 3) { let sm = zonesOf(s, k)[0], e = sm && sm.id && window.NBA && NBA.pool.get(sm.id); if (!e || e.state !== 'ok') { txt(kd === 2 ? 'GRAIN' : 'SAMPLE', 6, 11, lit ? A : '#667'); txt(sm ? 'loading…' : 'no sound given yet: see THE SOUND YOU GAVE IT', 6, 26, '#667'); return; }
                        let P = e.peaks, a0 = sm.st || 0, a1 = sm.en == null ? 1 : sm.en, mid = h / 2 + 6, tp = e.top || 1, ps = a0 + (s['p' + k] || 0) * (a1 - a0);
                        for (let i = 0; i < w - 12; i++) { let u = a0 + (a1 - a0) * i / (w - 12), v2 = P[Math.min(P.length - 1, Math.floor(u * P.length))] / tp * (h / 2 - 10); x.fillStyle = lit ? 'rgba(140,255,200,0.55)' : '#334'; x.fillRect(6 + i, mid - v2, 1, Math.max(1, v2 * 2)); }
                        let px = 6 + (ps - a0) / Math.max(0.001, a1 - a0) * (w - 12); x.fillStyle = lit ? '#fff' : '#556'; x.fillRect(px, 14, 1.5, h - 16);
                        if (kd === 2) { let gz = 0.01 + Math.pow(s['gz' + k] == null ? 0.35 : s['gz' + k], 2) * 0.49, sp = (s['gs' + k] == null ? 0.1 : s['gs' + k]) * 0.5, gw = gz / Math.max(0.01, e.dur * (a1 - a0)) * (w - 12); x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(px - sp * (w - 12) - gw / 2, 14, gw + sp * 2 * (w - 12), h - 16); }
                        txt((kd === 2 ? 'GRAIN' : 'SAMPLE') + '  ' + (e.name || '').slice(0, 18), 6, 11, lit ? A : '#667'); txt(Math.round((s['p' + k] || 0) * 100) + '%', w - 30, 11, lit ? A : '#667'); return; }
                    if (kd === 6) { let ten = s['ht' + k] == null ? 0.3 : s['ht' + k], mu = 0.05 + ten * ten * 7.95, pl = s['hp' + k] || 0, x0 = 0.1, y0 = 0, P = [], wv = [], h = Math.min(0.01, 0.2 / (1 + mu)), F = pl * pl * 3, ck = mu.toFixed(2) + ':' + pl.toFixed(2), wd = 6.2832 * 1.618 / (mu < 2 ? 6.2832 * (1 + mu * mu / 16) : 1.614 * mu + 7.01 / Math.cbrt(mu));
                        if (VDPC[ck]) { P = VDPC[ck][0]; wv = VDPC[ck][1]; } else for (let i = 0; i < 26000; i++) { let ax = y0, ay = mu * (1 - x0 * x0) * y0 - x0 + F * Math.sin(i * h * wd), bx = y0 + h * ay / 2, by = mu * (1 - (x0 + h * ax / 2) ** 2) * (y0 + h * ay / 2) - (x0 + h * ax / 2) + F * Math.sin((i + 0.5) * h * wd); x0 += h * bx; y0 += h * by; if (i > 14000 && i % 6 === 0) { P.push([x0, y0]); wv.push(x0); } if (i === 25999) VDPC[ck] = [P, wv]; }
                        let ym = Math.max(1, ...P.map(p => Math.abs(p[1]))), cx = w * 0.3, cy = h * 0 + 38, rx = w * 0.22 / 2.4, ry = 22 / ym;
                        x.strokeStyle = 'rgba(255,90,120,0.15)'; x.beginPath(); x.moveTo(cx - w * 0.24, cy); x.lineTo(cx + w * 0.24, cy); x.moveTo(cx, 14); x.lineTo(cx, 62); x.stroke();
                        line(P.map(p => [cx + p[0] * rx, cy - p[1] * ry]), lit ? '#ff6d8a' : '#544', 1.3, 8);
                        let n2 = Math.floor((D.now * 120) % P.length); x.fillStyle = '#fff'; x.beginPath(); x.arc(cx + P[n2][0] * rx, cy - P[n2][1] * ry, 2.5, 0, 7); x.fill();
                        let wx = w * 0.56, ww = w - wx - 6, seg = wv.slice(-Math.min(wv.length, 900)); line(seg.map((v2, i) => [wx + i / seg.length * ww, cy - v2 * 9]), lit ? A : '#445', 1.2, 4);
                        txt('PULSE · μ ' + mu.toFixed(1) + (pl > 0.7 ? ' · stumbling' : pl > 0.02 ? ' · pulled' : ''), 6, 11, lit ? '#ff9db0' : '#667'); return; }
                    if (kd === 5) { const MT = [[1, 2.756, 5.404, 8.933, 13.34, 18.64, 24.81, 31.87, 39.81, 48.61, 58.3, 68.9], [1, 3.99, 9.14, 10.0, 14.6, 20.2, 26.9, 34.6, 43.2, 52.8, 63.4, 74.9], [0.5, 1, 1.183, 1.506, 2, 2.514, 2.662, 3.011, 4.166, 5.433, 6.796, 8.215], [1, 1.594, 2.136, 2.296, 2.653, 2.918, 3.156, 3.501, 3.6, 4.06, 4.154, 4.601], [1, 2.32, 4.25, 6.63, 9.38, 12.5, 16.0, 19.8, 24.0, 28.5, 33.3, 38.4]], NM = ['BAR', 'MARIMBA', 'BELL', 'PLATE', 'GLASS'];
                        let u = Math.max(0, Math.min(1, s['p' + k] || 0)) * 4, i = Math.min(3, Math.floor(u)), fr = u - i, kb = s['kb' + k] == null ? 0.5 : s['kb' + k], kdv = s['kd' + k] == null ? 0.5 : s['kd' + k], lx = r => 6 + Math.log2(r * 2) / Math.log2(160) * (w - 12);
                        for (let q = 0; q < 12; q++) { let rt = MT[i][q] + (MT[i + 1][q] - MT[i][q]) * fr, a = 1 / Math.pow(q + 1, 1.2 - kb * 0.9), X0 = lx(rt); x.globalAlpha = 0.35 + 0.65 * Math.min(1, kdv / Math.pow(rt, 0.4 - kb * 0.3) + 0.2); x.fillStyle = lit ? A : '#445'; x.fillRect(X0, h - 4 - a * (h - 22), 2, a * (h - 22)); }
                        x.globalAlpha = 1; let xs = s['kx' + k] == null ? 0.3 : s['kx' + k]; txt('MODAL · ' + (fr < 0.5 ? NM[i] : NM[i + 1]) + (fr > 0.15 && fr < 0.85 ? ' → ' + NM[i + 1] : '') + ' · ' + (xs < 0.15 ? 'struck' : xs > 0.85 ? 'rubbed' : 'struck + rubbed'), 6, 11, lit ? A : '#667'); return; }
                    if (kd === 1) { if (id === W.TAPED && !(wauK && wauK.f)) id = 0; let T = W.table(id, 256, 1, id === 24 ? (s.wdk && s.wdk.length ? s.wdk : s.wd1) : id === W.TAPED ? wauK : null, id === 24 && !(s.wdk && s.wdk.length) ? s.wd2 : null), sp = W.spectra(T), F = W.F, pos = Math.max(0, Math.min(1, s['p' + k] || 0)) * (F - 1), fi = Math.floor(pos), tf = pos - fi, a = sp[fi], b = sp[Math.min(F - 1, fi + 1)];
                        let md = Math.min(8, Math.floor((s['sm' + k] || 0) * 9)), am = s['sx' + k] == null ? 0.5 : s['sx' + k], M = q => q >= 1 && q < 128 ? a.m[q] + (b.m[q] - a.m[q]) * tf : 0, n = 64, mx = 1e-9, G = [];
                        for (let q = 1; q <= n; q++) { let g = M(q);
                            if (md === 3) { let sf = Math.pow(2, (am - 0.5) * 4), u = q / sf, i = Math.floor(u); g = u < 1 ? 0 : M(i) + (M(i + 1) - M(i)) * (u - i); } else if (md === 8) g = M(q - Math.round((am - 0.5) * 32));
                            else if (md === 1) { let hc = 1 + am * am * 255; g *= 1 / (1 + Math.pow(q / hc, 8)) * (1 + 1.5 * Math.exp(-Math.pow((q - hc) / (1 + hc * 0.1), 2))); } else if (md === 2) { let hc = 1 + am * am * 255; g *= 1 - 1 / (1 + Math.pow(q / hc, 8)); }
                            else if (md === 4) { if (am < 0.5) { if (q % 2 === 0) g *= am * 2; } else if (q > 1 && q % 2) g *= (1 - am) * 2; } else if (md === 5) { if ((q - 1) % (1 + Math.round(am * 7))) g = 0; } else if (md === 6) g *= Math.pow(q, (am - 0.5) * 3);
                            G.push(g); mx = Math.max(mx, g); }
                        let bw = (w - 12) / n; G.forEach((g, i) => { let db = Math.max(0, 1 + 20 * Math.log10(Math.max(1e-9, g / mx)) / 60), v2 = db * (h - 22); x.fillStyle = lit ? A : '#445'; x.globalAlpha = 0.3 + 0.7 * db; x.fillRect(6 + i * bw, h - 4 - v2, Math.max(1, bw - 1), v2); }); x.globalAlpha = 1;
                        txt('SPEC · ' + SERP_SMOV[md] + ' ' + Math.round(am * 100) + '% · ' + W.NAMES[id][1], 6, 11, lit ? A : '#667'); txt(Math.round((s['p' + k] || 0) * 100) + '%', w - 30, 11, lit ? A : '#667'); return; }
                    if (id === W.TAPED && !(wauK && wauK.f)) id = 0; let T = W.table(id, 128, 1, id === 24 ? (s.wdk && s.wdk.length ? s.wdk : s.wd1) : id === W.TAPED ? wauK : null, id === 24 && !(s.wdk && s.wdk.length) ? s.wd2 : null), pos = s['p' + k] || 0, cur = Math.round(pos * 15), lvKey = k === 'c' ? 'lc3' : 'l' + k, on = k === 'a' || (s[lvKey] || 0) > 0.01 || (k === 'b' && (s.fmm || 0) > 0.1) || (k === 'c' && (s.fmm || 0) > 0.45);
                    for (let f = 15; f >= 0; f--) {
                        let a = T.fr[f][0], ox = 8 + f * 3.2, oy = h * 0.62 - f * 2.4, sc = h * 0.22, pts = [];
                        for (let i = 0; i <= 128; i += 2) pts.push([ox + i / 128 * (w - 70), oy - a[i] * sc]);
                        if (f === cur) line(pts, on ? A : '#557', 1.8, 8); else line(pts, 'rgba(140,255,200,' + (0.06 + 0.12 * (1 - Math.abs(f - cur) / 16)) + ')', 1);
                    }
                    txt(W.NAMES[id][0] + ' ' + W.NAMES[id][1], 6, 11, on ? A : '#667'); txt(Math.round(pos * 100) + '%', w - 30, 11, on ? A : '#667');
                    if (id === 24) txt('draw here · shift = the end shape', 6, h - 4, '#9dffc8');
                    return;
                }
                if (name === 'env1' || name === 'env2' || name === 'env3' || name === 'env4') {
                    let K = name === 'env1' ? ['a1', 'd1', 's1', 'r1'] : name === 'env2' ? ['ma', 'md', 'ms', 'mr'] : name === 'env3' ? ['na', 'nd', 'ns', 'nr'] : ['qa', 'qd', 'qs', 'qr'], cp = Math.pow(2, ((s['e' + name.slice(3) + 'c'] == null ? 0.5 : s['e' + name.slice(3) + 'c']) - 0.5) * 4), tm = (v, lo, hi) => lo + Math.pow(v || 0, 2) * (hi - lo), at = tm(s[K[0]], 0.001, 4), dc = tm(s[K[1]], 0.005, 6), su = s[K[2]] || 0, rl = tm(s[K[3]], 0.005, 8), hold = 0.6, tot = at + dc * 0.7 + hold + rl * 0.7, X0 = q => 6 + q / tot * (w - 12), Y = v => h - 6 - v * (h - 18);
                    let pts = [[X0(0), Y(0)]]; for (let i = 1; i <= 10; i++) { let q = i / 10; pts.push([X0(at * q), Y(Math.pow(Math.min(1, (1 - Math.exp(-q * 1.466)) * 1.3), 1 / cp))]); } for (let i = 1; i <= 12; i++) { let q = i / 12; pts.push([X0(at + dc * 0.7 * q), Y(su + (1 - su) * Math.pow(Math.exp(-q * 3.2), cp))]); }
                    pts.push([X0(at + dc * 0.7 + hold), Y(su)]); for (let i = 1; i <= 12; i++) { let q = i / 12; pts.push([X0(at + dc * 0.7 + hold + rl * 0.7 * q), Y(su * Math.pow(Math.exp(-q * 3.2), cp))]); }
                    x.fillStyle = 'rgba(120,255,190,0.08)'; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.lineTo(pts[pts.length - 1][0], Y(0)); x.fill(); line(pts, A, 1.6, 6);
                    txt('A ' + (at < 1 ? Math.round(at * 1000) + 'ms' : at.toFixed(1) + 's') + '  R ' + (rl < 1 ? Math.round(rl * 1000) + 'ms' : rl.toFixed(1) + 's'), 6, 11, A);
                    return;
                }
                if (name === 'flt' || name === 'flt2') {
                    let two = name === 'flt2', fc = expo(30, 18000, two ? (s.fc2 == null ? 0.8 : s.fc2) : (s.fc == null ? 0.62 : s.fc)), Q = 0.5 + ((two ? s.fr2 : s.fr) || 0) * 11, ty0 = Math.min(16, Math.floor(((two ? s.ft2 : s.ft) || 0) * 17)), ty = [0, 1, 2, 3, 4, 5, 6, 7, 1, 0, 0, 2, 1, 8, 9, 5, 10][ty0], pts = [];
                    if (two && (s.f2on || 0) < 1 / 3) { txt('off', 6, 11, '#667'); return; }
                    for (let i = 0; i <= w; i += 2) { let f = 20 * Math.pow(1000, i / w), r = f / fc, den = Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(r / Q, 2)), m = [1 / den, 1 / (den * den), r * r / den, (r / Q) / den, Math.abs(1 - r * r) / den, 0.5 + 0.5 * Math.abs(Math.cos(Math.PI * f / fc)) * (0.4 + Q / 12), 0.3 + (r / Q) / den * 1.4, 1 + (r / Q) / den,
                        (() => { let u = Math.max(0, Math.min(1, Math.log(fc / 30) / Math.log(600))) * 4, j = Math.min(3, Math.floor(u)), fr = u - j, FM = [[300, 870, 2240], [570, 840, 2410], [730, 1090, 2440], [530, 1840, 2480], [270, 2290, 3010]], q = 3 + Q * 1.5, t = 0; for (let k = 0; k < 3; k++) { let F0 = FM[j][k] + (FM[j + 1][k] - FM[j][k]) * fr, rr = f / F0, dd = Math.sqrt(Math.pow(1 - rr * rr, 2) + Math.pow(rr / q, 2)); t += [1, 0.5, 0.3][k] * (rr / q) / dd; } return t * 0.9; })(),
                        [0.5, 1, 2].reduce((a, k) => a * Math.min(1, Math.abs(Math.log(f / (fc * k))) * (1.4 - Q / 14) + 0.08), 1.1),
                        0.5 + 0.5 * Math.abs(Math.sin(Math.PI * f / fc)) * (0.4 + Q / 12)][ty]; pts.push([i, h - 6 - Math.min(1.25, m) / 1.25 * (h - 18)]); }
                    line(pts, A, 1.6, 6); txt(SERP_FT[ty0] + '  ' + (fc >= 1000 ? (fc / 1000).toFixed(1) + 'k' : Math.round(fc)) + (two ? ((s.f2on || 0) < 2 / 3 ? '  after 1' : '  beside 1') : ''), 6, 11, A);
                    return;
                }
                if (name === 'mx') {
                    const SRC = SERP_SRC, DST = SERP_DST, nS = SRC.length, nD = DST.length;
                    if ((s.onM == null ? 0.75 : s.onM) < 0.5) { txt('the matrix is switched off', 6, 12, '#667'); return; }
                    let y = 12, any = 0; for (let k = 1; k <= 16; k++) { let si = Math.min(nS - 1, Math.floor((s['m' + k + 's'] || 0) * nS)), di = Math.min(nD - 1, Math.floor((s['m' + k + 'd'] || 0) * nD)), a = ((s['m' + k + 'a'] == null ? 0.5 : s['m' + k + 'a']) - 0.5) * 2; if (!si || Math.abs(a) < 0.01) continue; any++; let mc = [1, 2, 8, 13].includes(si) ? '#ffd36d' : [3, 4, 14, 15].includes(si) ? '#b98cff' : [5, 6, 16, 17, 18].includes(si) ? '#6dd3ff' : si === 7 ? '#f4f0ff' : '#ff6db8', bx = w * 0.62, bw = w - bx - 8;
                        x.fillStyle = mc; x.beginPath(); x.arc(9, y - 3, 2.5, 0, 7); x.fill(); txt(SRC[si] + ' → ' + DST[di], 15, y, mc); x.fillStyle = 'rgba(255,255,255,0.06)'; x.fillRect(bx, y - 6, bw, 6); x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(bx + bw / 2, y - 7, 1, 8);
                        x.fillStyle = mc; x.globalAlpha = 0.75; x.fillRect(a < 0 ? bx + bw / 2 * (1 + a) : bx + bw / 2, y - 6, bw / 2 * Math.abs(a), 6); x.globalAlpha = 1; txt((a > 0 ? '+' : '') + Math.round(a * 100) + '%', bx - 30, y, 'rgba(255,255,255,0.55)'); y += 10; if (y > h) break; }
                    if (!any) txt('nothing moving yet. pick a FROM and a TO', 6, 12, '#667');
                    return;
                }
                if (name === 'smp') {
                    let zs = s._zs || { t: 'all', i: 0 }, Z = (s.zones && s.zones[zs.t]) || (zs.t === 'all' && s.smp && s.smp.id ? [s.smp] : []), z = Z[Math.min(Z.length - 1, zs.i || 0)];
                    let who = zs.t === 'all' ? 'ALL THREE' : 'OSC ' + zs.t.toUpperCase();
                    if (!z) { txt(who + ': nothing yet. LOAD (one or several), drop sounds here, or FROM THE BOX', 6, 12, '#9dffc8'); txt('then a KIND of GRAIN or SAMPLE plays them. several = spread across the keys', 6, 26, '#667'); txt(zs.t === 'all' ? 'an oscillator with sounds of its own uses those instead' : 'none of its own = it uses ALL THREE\'s', 6, 40, '#667'); return; }
                    let e = window.NBA && NBA.pool.get(z.id); if (!e || e.state !== 'ok') { if (window.NBA && !e) NBA.load(z.id); txt(e && e.state === 'missing' ? 'that sound has gone (deleted?). load another' : 'loading…', 6, 12, '#667'); return; }
                    let P = e.peaks, a0 = z.st || 0, a1 = z.en == null ? 1 : z.en, wh = h - 22, mid = 14 + wh / 2, top = e.top || 1;
                    x.fillStyle = 'rgba(120,255,190,0.07)'; x.fillRect(6 + a0 * (w - 12), 14, (a1 - a0) * (w - 12), wh);
                    for (let i = 0; i < w - 12; i++) { let k = Math.floor(i / (w - 12) * P.length), v = P[k] / top * (wh / 2 - 2), inside = i / (w - 12) >= a0 && i / (w - 12) <= a1; x.fillStyle = inside ? A : 'rgba(140,255,200,0.25)'; x.fillRect(6 + i, mid - v, 1, Math.max(1, v * 2)); }
                    ['a', 'b', 'c'].forEach((k, j) => { let kd = Math.min(6, Math.floor((s['ok' + k] || 0) * 7)); if ((kd !== 2 && kd !== 3) || (s['on' + k.toUpperCase()] == null ? 0.75 : s['on' + k.toUpperCase()]) < 0.5) return; let own = s.zones && s.zones[k] && s.zones[k].length; if ((zs.t === 'all') === !!own) return; let px = 6 + (a0 + (s['p' + k] || 0) * (a1 - a0)) * (w - 12); x.fillStyle = '#fff'; x.fillRect(px, 14, 1.5, wh); txt(k.toUpperCase(), px + 3, 22 + j * 9, '#fff'); });
                    let k0 = 24, k1 = 96, kx = m => 6 + (m - k0) / (k1 - k0) * (w - 12), by = h - 7, vs = [...new Set(Z.map(q => q.vel == null ? 1 : q.vel))].sort(), rows = vs.length;
                    x.fillStyle = 'rgba(255,255,255,0.06)'; x.fillRect(6, by - 1, w - 12, 8);
                    vs.forEach((vl, r) => { let L = Z.map((q, i) => [69 + 12 * Math.log2((q.root || 261.63) / 440), q, i]).filter(q => (q[1].vel == null ? 1 : q[1].vel) === vl).sort((p, q) => p[0] - q[0]), yy = by - 1 + r * 8 / rows, hh = 8 / rows;
                        L.forEach((q, j) => { let lo = j ? (L[j - 1][0] + q[0]) / 2 : k0, hi = j < L.length - 1 ? (q[0] + L[j + 1][0]) / 2 : k1; x.fillStyle = q[2] === zs.i ? A : 'rgba(140,255,200,0.3)'; x.fillRect(kx(lo) + 1, yy, Math.max(1, kx(hi) - kx(lo) - 2), hh - 0.5); x.fillStyle = '#fff'; x.fillRect(kx(q[0]), yy, 1.5, hh); }); });
                    txt(who + ' · ' + (zs.i + 1) + '/' + Z.length + ' · ' + (e.name || 'sound').slice(0, 16) + '  ' + Math.round(z.root || 261.6) + 'hz' + (Z.length > 1 ? ((z.vel == null || z.vel >= 1) ? '' : '  · soft layer') : ''), 6, 11, A);
                    return;
                }
                if (name === 'throat') {
                    let on2 = (s.onT || 0) >= 0.5, v = s.thv == null ? 0.5 : s.thv, z = s.thz == null ? 0.5 : s.thz, g = s.thg || 0, gh = Math.min(1, g + (s.thh || 0) * 0.8), br = s.thb || 0;
                    const VW = [[300, 870, 2240, 3300], [430, 780, 2500, 3400], [730, 1090, 2440, 3400], [530, 1840, 2480, 3500], [280, 2250, 2950, 3700]], OP = [0.35, 0.55, 1, 0.6, 0.22], WD = [0.45, 0.6, 0.85, 1, 1.15];
                    let u = v * 4, i = Math.min(3, Math.floor(u)), fr = u - i, op = OP[i] + (OP[i + 1] - OP[i]) * fr, wd = WD[i] + (WD[i + 1] - WD[i]) * fr, sc = Math.pow(2, (z - 0.5) * 2.8);
                    let C = on2 ? '#ff4d6d' : '#4a3a40', L = on2 ? '#ffb3c1' : '#5a4a50', cx = Math.min(w * 0.22, 70), cy = h / 2 + 4, bz = Math.max(0.5, Math.min(1.25, 1.12 - z * 0.62)), mw = 34 * wd * bz, mh = (5 + 15 * op) * bz * (1 + Math.sin(D.now * 2.2) * 0.04);
                    if (on2 && br > 0.01) for (let k = 0; k < 14; k++) { let t2 = (D.now * 0.6 + k / 14) % 1, px = cx + mw * 0.2 + t2 * (w * 0.32), py = cy + Math.sin(k * 3.7 + D.now) * 6 * t2; x.fillStyle = 'rgba(255,200,215,' + (br * 0.35 * (1 - t2)).toFixed(3) + ')'; x.beginPath(); x.arc(px, py, 1.5 + t2 * 5, 0, 7); x.fill(); }
                    x.fillStyle = on2 ? '#1a0207' : '#0c0a0b'; x.beginPath(); x.moveTo(cx - mw, cy); x.bezierCurveTo(cx - mw * 0.5, cy - mh, cx + mw * 0.5, cy - mh, cx + mw, cy); x.bezierCurveTo(cx + mw * 0.5, cy + mh * 1.1, cx - mw * 0.5, cy + mh * 1.1, cx - mw, cy); x.fill();
                    let nt = 2 + Math.round(gh * 6), fl = (0.35 + gh * 0.55) * mh; x.fillStyle = on2 ? '#fff4f0' : '#6a6064';
                    for (let k = 0; k < nt; k++) { let q = nt < 2 ? 0.5 : k / (nt - 1), tx = cx - mw * 0.55 + q * mw * 1.1, tw = 2.2 + gh * 1.5, top = cy - mh * 0.72 * Math.sin(Math.PI * (0.2 + q * 0.6)), ln = (k === 0 || k === nt - 1) ? fl * 1.25 : fl * (0.45 + 0.4 * Math.abs(Math.sin(k * 2.3))); x.beginPath(); x.moveTo(tx - tw, top); x.lineTo(tx + tw, top); x.lineTo(tx, top + ln); x.fill();
                        if (gh > 0.4) { let bt = cy + mh * 0.8 * Math.sin(Math.PI * (0.2 + q * 0.6)); x.beginPath(); x.moveTo(tx - tw * 0.8, bt); x.lineTo(tx + tw * 0.8, bt); x.lineTo(tx + 0.5, bt - ln * 0.6); x.fill(); } }
                    x.lineWidth = 2.4; x.strokeStyle = C; x.shadowColor = C; x.shadowBlur = on2 ? 10 : 0; x.beginPath(); x.moveTo(cx - mw - 3, cy); x.bezierCurveTo(cx - mw * 0.5, cy - mh - 7, cx - 2, cy - mh - 2, cx, cy - mh - 4); x.bezierCurveTo(cx + 2, cy - mh - 2, cx + mw * 0.5, cy - mh - 7, cx + mw + 3, cy); x.bezierCurveTo(cx + mw * 0.5, cy + mh * 1.1 + 8, cx - mw * 0.5, cy + mh * 1.1 + 8, cx - mw - 3, cy); x.stroke(); x.shadowBlur = 0;
                    let x0 = Math.max(cx + mw + 16, w * 0.42), ww = w - x0 - 6, P = [], F = VW[i].map((a, j) => Math.max(40, (a + (VW[i + 1][j] - a) * fr) * sc)), G = [1, 0.7, 0.4, 0.25];
                    for (let k = 0; k <= 80; k++) { let hz = 80 * Math.pow(100, k / 80), a = 0; F.forEach((f0, j) => { let bw = [70, 95, 130, 170][j] * Math.sqrt(sc) + f0 * 0.04, Q = f0 / bw, r = hz / f0 - f0 / hz; a += G[j] / Math.sqrt(1 + Q * Q * r * r); }); P.push([x0 + k / 80 * ww, h - 6 - Math.min(1, a / 1.05) * (h - 22)]); }
                    x.strokeStyle = 'rgba(255,120,150,0.12)'; x.beginPath(); [100, 1000].forEach(hz => { let px = x0 + Math.log(hz / 80) / Math.log(100) * ww; x.moveTo(px, 14); x.lineTo(px, h - 4); }); x.stroke();
                    line(P, on2 ? C : '#4a3a40', 1.5, 8); F.forEach((f0, j) => { if (f0 < 80 || f0 > 8000) return; let px = x0 + Math.log(f0 / 80) / Math.log(100) * ww; x.fillStyle = L; x.fillRect(px - 0.5, h - 6, 1, 3); });
                    let V = ['U', 'O', 'A', 'E', 'I'], vn = fr < 0.2 ? V[i] : fr > 0.8 ? V[i + 1] : V[i] + '→' + V[i + 1];
                    txt(on2 ? 'THE THROAT · ' + vn + ' · ' + (z < 0.12 ? 'huge' : z < 0.35 ? 'big' : z < 0.65 ? 'a person' : z < 0.88 ? 'small' : 'hand sized') + (gh > 0.6 ? ' · roaring' : gh > 0.15 ? ' · growling' : '') : 'THE THROAT · off', 6, 11, on2 ? L : '#667');
                    return;
                }
                if (name === 'hive') {
                    let n = 1 + Math.round((s.ua == null ? 0.5 : s.ua) * 15), det = (s.da == null ? 0.25 : s.da) * 60, K = s.hiv || 0, tk = Math.pow(s.hvt || 0, 2) * 8, SZ = [-1, -0.5716, -0.1775, 0, 0.1810, 0.5650, 0.9766];
                    if (n < 2) { txt('THE HIVE needs a crowd: give OSC A some UNISON', 6, 12, '#667'); return; }
                    let t = D.now % 5, th = [], om = []; for (let i = 0; i < n; i++) { let q = i / (n - 1) * 6, j = Math.min(5, Math.floor(q)), sp = SZ[j] + (SZ[j + 1] - SZ[j]) * (q - j); om.push(sp * det / 1200 * 0.69 * 3); th.push(Math.sin(i * 7.31) * 0.5 + 0.5); }
                    let R = 0, ps = 0; for (let st = 0; st < t * 60; st++) { let k0 = K * (tk > 0 ? Math.min(1, st / 60 / tk) : 1), c = 0, sn = 0; th.forEach(a => { c += Math.cos(6.2832 * a); sn += Math.sin(6.2832 * a); }); c /= n; sn /= n; R = Math.hypot(c, sn); ps = Math.atan2(sn, c) / 6.2832; th = th.map((a, i) => a + om[i] / 60 + k0 * k0 * 0.06 * (0.3 + R) * Math.sin(6.2832 * (ps - a))); }
                    let cx = w / 2, cy = h / 2 + 5, rr = Math.min(h / 2 - 9, w / 2 - 10);
                    x.strokeStyle = 'rgba(200,170,255,0.18)'; x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.stroke();
                    th.forEach(a => { let an = 6.2832 * a - Math.PI / 2; x.fillStyle = '#d9c4ff'; x.shadowColor = '#b48cff'; x.shadowBlur = 6; x.beginPath(); x.arc(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr, 2.6, 0, 7); x.fill(); }); x.shadowBlur = 0;
                    let an = 6.2832 * ps - Math.PI / 2; line([[cx, cy], [cx + Math.cos(an) * rr * R, cy + Math.sin(an) * rr * R]], '#fff', 1.6, 6);
                    txt(K < 0.01 ? 'each their own' : R > 0.97 ? 'one voice' : R > 0.6 ? 'falling into step' : 'a crowd', 6, 11, '#d9c4ff'); txt(n + ' voices · ' + Math.round(R * 100) + '% as one', 6, h - 4, 'rgba(217,196,255,0.7)');
                    return;
                }
                if (name === 'nz') {
                    let k = Math.min(8, Math.floor((s.nty || 0) * 9)), ft = Math.min(4, Math.floor((s.nft || 0) * 5)), pts = [], r = 1;
                    for (let i = 0; i <= w; i += 2) { r = Math.sin(i * 12.9898 + k * 7 + Math.floor(D.now * 20)) * 43758.5; r -= Math.floor(r); let v = r * 2 - 1; if (k === 2) v = r > 0.96 ? v * 2 : v * 0.08; if (k === 5) v = r > 0.97 ? Math.sin(i) : v * 0.15; if (k === 4) v = Math.sign(Math.sin(i * 0.9) + Math.sin(i * 1.33)) * 0.6; if (k === 6) v *= Math.pow(Math.abs(Math.sin(i * 0.11 + D.now * 9)), 4); if (k === 7) { let b2 = (i + Math.floor(D.now * 7) * 37) % 61; v = b2 < 9 ? Math.sin(b2 * 2.6) * Math.exp(-b2 / 3) * 1.6 : v * 0.03; } if (k === 8) v = v * 0.25 + Math.sin(i * 0.05 + D.now * 1.3) * 0.5 * (0.6 + 0.4 * Math.sin(D.now * 0.7)); pts.push([i, h / 2 + 4 - v * (h / 2 - 14) * (s.noise || 0.05) * 1.6]); }
                    line(pts, (s.onN == null ? 0.75 : s.onN) < 0.5 ? '#445' : A, 1, 3);
                    txt(['WHITE', 'PINK', 'CRACKLE', 'HISS', 'METAL', 'RAIN', 'WINGS', 'CHAINS', 'FURNACE'][k] + (ft ? '  · ' + ['', 'LOW', 'HIGH', 'BAND', 'PEAK'][ft] + ' ' + (expo(30, 18000, s.nfc == null ? 0.6 : s.nfc) / 1000).toFixed(1) + 'k' : '') + ((s.nrt || 0) >= 0.5 ? '  · round the filters' : ''), 6, 11, A);
                    return;
                }
                if (name === 'dst') {
                    let k = Math.min(9, Math.floor((s.dty || 0) * 10)), a = s.dam == null ? 0.35 : s.dam, g = 1 + a * 20, pts = [], q = Math.pow(2, 16 - a * 14);
                    if (!k) { txt('off. pick a KIND', 6, 11, '#667'); line([[6, h - 6], [w - 6, 14]], '#334', 1); return; }
                    for (let i = 0; i <= w; i += 2) { let xx = (i / w) * 2 - 1, y = [xx, Math.tanh(xx * g) / (1 + a * 0.6), Math.max(-1, Math.min(1, xx * g)) * 0.75, Math.sin(xx * g * 1.4) * 0.8, Math.round(xx * Math.min(q, 16)) / Math.min(q, 16), Math.round(xx * 8) / 8, Math.abs(xx * (1 + a * 3)) * 0.6 - 0.3, xx > 0 ? Math.tanh(xx * g * 0.5) : Math.tanh(xx * g * 0.275) * 0.9, xx * g * 0.6 > 0 ? 1 - Math.exp(-xx * g * 0.6) : -0.7 * (1 - Math.exp(xx * g * 0.6 / 0.7)), (u => (1 - Math.abs(u - 2)) * 0.9)((((xx * (1 + a * 6) + 1) % 4) + 4) % 4)][k]; pts.push([i, h / 2 + 4 - Math.max(-1.1, Math.min(1.1, y)) * (h / 2 - 12)]); }
                    line(pts, A, 1.6, 6); txt(['', 'SOFT', 'HARD', 'FOLD', 'CRUSH', 'DOWNSAMPLE', 'RECTIFY', 'TUBE', 'DIODE', 'LIN FOLD'][k] + '  ' + Math.round(a * 100) + '%  ' + ((s.dpo || 0) >= 0.5 ? 'before the filter' : 'after the filter'), 6, 11, A);
                    return;
                }
                if (name === 'tun') {
                    let tu = Math.min(4, Math.floor((s.tun || 0) * 5)), c = SERP_TUN[tu], mid = h / 2 + 4;
                    x.strokeStyle = 'rgba(140,255,200,0.2)'; x.beginPath(); x.moveTo(6, mid); x.lineTo(w - 6, mid); x.stroke();
                    for (let i = 0; i < 12; i++) { let off = c ? c[i] - i * 100 : 0, X0 = 10 + i / 11 * (w - 20); x.fillStyle = Math.abs(off) > 0.5 ? A : 'rgba(140,255,200,0.4)'; x.fillRect(X0 - 2, mid - off * 0.9, 4, Math.max(2, Math.abs(off) * 0.9) * (off > 0 ? 1 : -1) || 2); }
                    txt(['EVEN · the grid they tune everything to', 'JUST · whole number ratios', 'PURE FIFTHS · stacked 3:2', 'MEANTONE · sweet thirds', 'NEUTRAL · the quarter tone between'][tu], 6, 11, A);
                    if ((s.drf || 0) > 0.01) txt('drifting ±' + Math.round(s.drf * 18) + 'c', 6, h - 4, A);
                    return;
                }
                if (name === 'lfo' || name === 'lfo2' || name === 'lfo3' || name === 'lfo4') {
                    let n = name === 'lfo' ? 1 : +name.slice(3), kk = q => n === 1 ? { s: 'ls', f: 'lf', r: 'lr' }[q] : 'l' + n + q, sh = Math.min(7, Math.floor((s[kk('s')] || 0) * 8)), dw = s['lw' + n] || [0.5, 0.85, 1, 0.85, 0.5, 0.15, 0, 0.15], bk = Math.pow(2, ((s['l' + n + 'k'] == null ? 0.5 : s['l' + n + 'k']) - 0.5) * 4), pts = [], fn = u => { u = Math.pow(u % 1, bk); if (sh === 5) { let q = u * dw.length, i = Math.floor(q), f = q - i, s2 = 0.5 - 0.5 * Math.cos(f * Math.PI); return (dw[i % dw.length] + (dw[(i + 1) % dw.length] - dw[i % dw.length]) * s2) * 2 - 1; } return [Math.sin(u * 6.2832), 1 - 4 * Math.abs(u - 0.5), u * 2 - 1, u < 0.5 ? 1 : -1, Math.sin(Math.floor(u * 8) * 91.7), 0, Math.sin(u * 13.1 + Math.sin(u * 31) * 2) * 0.8, Math.sin(u * 9.4) * (0.4 + 0.6 * Math.abs(Math.sin(u * 2.3)))][sh]; };
                    let cp = sh === 5 && Array.isArray(s['lq' + n]) && s['lq' + n].length >= 2 ? s['lq' + n].slice().sort((a, b) => a[0] - b[0]) : null;
                    if (cp) { const PX = u => 6 + u * (w - 12), PY = v => 14 + (1 - v) * (h - 20), seg = (c, p) => { const m = c.length; let i = m - 1; for (let j = 0; j < m; j++) if (c[j][0] > p) { i = j - 1; break; } let a, b, x0, x1; if (i < 0) { a = c[m - 1]; b = c[0]; x0 = a[0] - 1; x1 = b[0]; } else if (i === m - 1) { a = c[m - 1]; b = c[0]; x0 = a[0]; x1 = b[0] + 1; } else { a = c[i]; b = c[i + 1]; x0 = a[0]; x1 = b[0]; } let uu = x1 - x0 > 1e-6 ? Math.max(0, Math.min(1, (p - x0) / (x1 - x0))) : 1, k = (a[2] || 0) * 8; if (Math.abs(k) > 1e-3) uu = (Math.exp(k * uu) - 1) / (Math.exp(k) - 1); return a[1] + (b[1] - a[1]) * uu; };
                        x.strokeStyle = 'rgba(140,255,200,0.12)'; x.beginPath(); x.moveTo(6, PY(0.5)); x.lineTo(w - 6, PY(0.5)); x.stroke();
                        for (let i = 0; i <= w - 12; i += 2) pts.push([PX(i / (w - 12)), PY(seg(cp, Math.pow(i / (w - 12), bk)))]); line(pts, A, 1.4, 5);
                        cp.forEach((p, i) => { let q = cp[(i + 1) % cp.length], xm = (p[0] + (i === cp.length - 1 ? q[0] + 1 : q[0])) / 2, xm1 = xm % 1; x.fillStyle = '#fff'; x.fillRect(PX(p[0]) - 3, PY(p[1]) - 3, 6, 6); x.strokeStyle = 'rgba(255,255,255,0.7)'; x.beginPath(); x.arc(PX(xm1), PY(seg(cp, xm1)), 3, 0, 7); x.stroke(); });
                        let u = (D.now * 0.5) % 1; x.fillStyle = A; x.beginPath(); x.arc(PX(u), PY(seg(cp, Math.pow(u, bk))), 3, 0, 7); x.fill();
                        txt('drawn · ' + cp.length + ' points · click = add · drag = move · right click = remove · rings = curve', 6, 11, A); return; }
                    for (let i = 0; i <= w; i += 2) pts.push([i, h / 2 + 4 - fn(i / w * 2) * (h / 2 - 12)]); line(pts, A, 1.4, 5);
                    let u = (D.now * 0.5) % 1; x.fillStyle = '#fff'; x.beginPath(); x.arc(u * w, h / 2 + 4 - fn(u * 2) * (h / 2 - 12), 3, 0, 7); x.fill();
                    txt(['sine', 'tri', 'saw', 'square', 'random', 'drawn · draw on me', 'LORENZ · chaos', 'ROSSLER · chaos'][sh] + ' · ' + (s[kk('f')] >= 0.5 ? 'free' : ['1/16', '1/8', '1/4', '1/2', '1 bar', '2 bars', '4 bars'][Math.min(6, Math.floor((s[kk('r')] == null ? (n === 2 || n === 4 ? 0.6 : 0.4) : s[kk('r')]) * 7))]), 6, 11, A);
                }
            } },
        { id: 'breath', jp: '吐息', en: 'BREATH', sub: 'breathy vocal synth. SIGH, AAH or HUM. HEAT = how much breath is pushed through', kind: 'poly', part: 'nb_x_breath', face: 'latex', secret: true,
            p: [['kind', 'HOW', 0, F.pick(['SIGH', 'AAH', 'HUM'])], ['heat', 'HEAT', 0.3, F.pct], ['vowel', 'MOUTH', 0.2, F.pick(['ah', 'oh', 'oo', 'eh'])], ['air', 'AIR', 0.55, F.pct], ['scoop', 'SCOOP', 0.35, v => Math.round(v * 7) + 'st'], ['fall', 'FALL', 0.3, v => Math.round(v * 12) + 'st'],
                ['shake', 'TREMBLE', 0.3, F.pct], ['att', 'ATTACK', 0.3, F.ms(0.01, 2, 2)], ['rel', 'RELEASE', 0.45, F.ms(0.05, 4, 2)], ['oct', 'OCTAVE', 0.5, F.oct]],
            groups: [['口 · MOUTH', null, ['kind', 'heat', 'vowel', 'air']], ['音 · PITCH', null, ['scoop', 'fall', 'shake', 'oct']], ['形 · SHAPE', null, ['att', 'rel']]], selects: ['kind', 'vowel'],
            pwk: 1, draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, D && D.semi, D && D.o); } },
        { id: 'lash', jp: '鞭', en: 'LASH', sub: 'foley hits: slap, board, whip, chain, heel, smack. higher notes = smaller hits. works in a COFFIN drawer too', kind: 'drum', part: 'nb_x_lash', face: 'satin', secret: true,
            p: [['kind', 'WHICH', 0, F.pick(['SLAP', 'BOARD', 'WHIP', 'CHAIN', 'HEEL', 'SMACK'])], ['tone', 'TONE', 0.5, F.pct], ['snap', 'STING', 0.5, F.pct], ['flesh', 'BODY', 0.5, F.pct], ['room', 'ROOM', 0.3, F.pct], ['decay', 'LENGTH', 0.4, F.pct], ['hands', 'HANDS', 0, F.pick(['one', 'two', 'a few'])]],
            groups: [['何 · WHICH', null, ['kind', 'hands', 'tone']], ['肌 · SKIN', null, ['snap', 'flesh', 'decay', 'room']]], selects: ['kind', 'hands'],
            draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, D && D.semi, D && D.o); } },
        { id: 'wail', jp: '嘆', en: 'WAIL', sub: 'choir pad. a group of slightly out of tune voices that drift down as they sing. CLUSTER adds a clashing note, REVERSE makes them swell in + cut off', kind: 'poly', part: 'hx_wail', face: 'grave', creepy: true,
            p: [['voices', 'HOW MANY', 0.5, v => String(2 + Math.round(v * 6))], ['vowel', 'MOUTH', 0.6, F.pick(['ah', 'oh', 'oo'])], ['cluster', 'CLUSTER', 0, F.pick(['none', '+1', 'tritone', 'both'])], ['sink', 'SINK', 0.3, v => '-' + Math.round(v * 12) + 'st'], ['drift', 'DRIFT', 0.4, F.pct], ['air', 'AIR', 0.3, F.pct],
                ['rev', 'REVERSE', 0, F.pick(['off', 'on'])], ['att', 'ATTACK', 0.5, F.ms(0.02, 4, 2)], ['rel', 'RELEASE', 0.6, F.ms(0.05, 6, 2)], ['oct', 'OCTAVE', 0.5, F.oct]],
            groups: [['声 · VOICES', null, ['voices', 'vowel', 'cluster', 'rev', 'oct']], ['沈 · SINK', null, ['sink', 'drift', 'air']], ['形 · SHAPE', null, ['att', 'rel']]], selects: ['vowel', 'cluster', 'rev'], pwk: 1,
            draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, D && D.semi, D && D.o); } },
        { id: 'bones', jp: '骨', en: 'BONES', sub: 'creepy foley: knocks, rattles, dragged chains, distant thuds, nails on glass. FAR puts it in the next room', kind: 'drum', part: 'hx_bones', face: 'grave', creepy: true,
            p: [['kind', 'WHICH', 0, F.pick(['CLACK', 'RATTLE', 'CHAIN', 'THUD', 'NAIL'])], ['tone', 'TONE', 0.5, F.pct], ['decay', 'LENGTH', 0.4, F.pct], ['dirt', 'DIRT', 0.2, F.pct], ['far', 'FAR', 0.3, F.pct]],
            groups: [['何 · WHICH', null, ['kind', 'tone', 'decay']], ['遠 · FAR', null, ['dirt', 'far']]], selects: ['kind'],
            pwk: 1, draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, D && D.semi, D && D.o); } },
        { id: 'gloop', jp: '濁', en: 'GLOOP', sub: 'wet bass. each note drops into pitch with a plop. GURGLE bubbles the filter, STRETCH slides it up', kind: 'poly', part: 'nb_gloop', face: 'milk', jar: true,
            p: [['plop', 'PLOP', 0.5, F.pct], ['wet', 'WET', 0.5, F.pct], ['gurgle', 'GURGLE', 0.3, F.pct], ['thick', 'THICK', 0.4, F.pct], ['cut', 'CUT', 0.4, F.hz(80, 6000)], ['stretch', 'STRETCH', 0, F.ms(0, 0.4)], ['dec', 'DECAY', 0.5, F.ms(0.05, 2, 1.5)], ['rel', 'RELEASE', 0.25, F.ms(0.02, 2, 2)], ['oct', 'OCTAVE', 0.3, F.oct], ['subl', 'SUB', 0, F.pct], ['subo', 'SUB DOWN', 0, F.pick(['-1 oct', '-2 oct'])], ['bub', 'BUBBLES', 0, F.pct]],
            groups: [['滴 · PLOP', null, ['plop', 'stretch', 'wet', 'gurgle', 'bub']], ['濾 · FILTER', null, ['cut', 'thick', 'dec', 'rel']], ['底 · SUB', null, ['subl', 'subo', 'oct']]], selects: ['subo'], pwk: 1,
            draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, D && D.semi, D && D.o); } },
        { id: 'nocturne', jp: '夜想', en: 'NOCTURNE', sub: 'darkwave polysynth. SAW, PULSE (with PWM), SUB + NOISE into a 4 step HPF + a resonant low pass. one envelope, a delayed LFO + CHORUS I / II', kind: 'poly', part: 'nb_nocturne', face: 'mist',
            p: [['saw', 'SAW', 0.8, F.pct], ['pulse', 'PULSE', 0, F.pct], ['pw', 'WIDTH', 0.5, F.pct], ['pwm', 'PWM', 0.3, F.pct], ['sub', 'SUB', 0.3, F.pct], ['noise', 'NOISE', 0, F.pct], ['uni', 'VOICES', 0, F.pick(['1', '2', '3', '4'])], ['det', 'DETUNE', 0.15, v => Math.round(v * 30) + 'c'],
                ['hpf', 'HPF', 0.375, F.pick(['0', '1', '2', '3'])], ['cut', 'CUT', 0.55, F.hz(60, 16000)], ['res', 'RES', 0.2, F.pct], ['env', 'ENV', 0.35, F.pct], ['ktrk', 'KEY', 0.5, F.pct],
                ['att', 'ATTACK', 0.03, F.ms(0.001, 3, 2)], ['dec', 'DECAY', 0.4, F.ms(0.01, 3, 2)], ['sus', 'SUSTAIN', 0.7, F.pct], ['rel', 'RELEASE', 0.3, F.ms(0.01, 4, 2)],
                ['lrate', 'LFO RATE', 0.4, F.hz(0.1, 12)], ['ldel', 'LFO DELAY', 0.2, F.ms(0, 2)], ['lpitch', 'LFO → PITCH', 0, F.pct], ['lcut', 'LFO → CUT', 0, F.pct], ['chor', 'CHORUS', 0.375, F.pick(['off', 'I', 'II', 'I+II'])], ['oct', 'OCTAVE', 0.5, F.oct]],
            groups: [['源 · OSC', null, ['saw', 'pulse', 'pw', 'pwm', 'sub', 'noise', 'uni', 'det', 'oct']], ['濾 · FILTER', null, ['hpf', 'cut', 'res', 'env', 'ktrk']], ['形 · ENVELOPE', null, ['att', 'dec', 'sus', 'rel']], ['揺 · LFO + CHORUS', null, ['lrate', 'ldel', 'lpitch', 'lcut', 'chor']]],
            selects: ['uni', 'hpf', 'chor'], pwk: 1,
            presets: [
                ['夜の霧 // NIGHT FOG PAD', { saw: 0.7, pulse: 0.5, pwm: 0.5, sub: 0.2, cut: 0.45, res: 0.15, env: 0.2, att: 0.45, dec: 0.6, sus: 0.85, rel: 0.55, chor: 0.375 }],
                ['冷たい弦 // COLD STRINGS', { saw: 1, pulse: 0, sub: 0, uni: 0.375, det: 0.4, cut: 0.6, res: 0.05, env: 0.1, att: 0.35, sus: 1, rel: 0.5, lrate: 0.5, ldel: 0.4, lpitch: 0.08, chor: 0.625 }],
                ['鉄のベース // STEEL BASS', { saw: 0.6, pulse: 0.6, pw: 0.3, pwm: 0, sub: 0.7, hpf: 0.125, cut: 0.25, res: 0.35, env: 0.55, dec: 0.25, sus: 0.35, rel: 0.1, chor: 0, oct: 0.25 }],
                ['ネオンの和音 // NEON STAB', { saw: 1, pulse: 0.4, sub: 0.3, cut: 0.35, res: 0.3, env: 0.6, att: 0, dec: 0.25, sus: 0.2, rel: 0.2, chor: 0.625 }],
                ['硝子の鍵 // GLASS KEYS', { saw: 0, pulse: 1, pw: 0.2, pwm: 0.15, sub: 0, cut: 0.5, res: 0.25, env: 0.45, ktrk: 0.8, dec: 0.45, sus: 0.3, rel: 0.4, chor: 0.375 }],
                ['墓場の鐘 // GRAVEYARD BELL', { saw: 0.3, pulse: 0.7, pw: 0.12, pwm: 0, sub: 0.4, cut: 0.6, res: 0.55, env: 0.3, ktrk: 1, att: 0, dec: 0.7, sus: 0, rel: 0.7, chor: 0.875 }],
                ['電脳の糸 // WIRE LEAD', { saw: 1, pulse: 0.3, uni: 0.625, det: 0.3, cut: 0.55, res: 0.25, env: 0.3, att: 0.02, sus: 0.8, rel: 0.25, lrate: 0.6, ldel: 0.35, lpitch: 0.12, chor: 0.375, oct: 0.75 }],
                ['息の雲 // BREATH CLOUD', { saw: 0.3, pulse: 0.3, pwm: 0.7, noise: 0.35, cut: 0.4, res: 0.2, env: 0.15, att: 0.6, sus: 1, rel: 0.7, lrate: 0.15, lcut: 0.25, chor: 0.875 }]],
            draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, 0, 0); } },
        { id: 'howl', jp: '遠吠え', en: 'HOWL', sub: 'rave lead. three detuned saws + one an octave down', kind: 'poly', part: 'nb_howl', face: 'char',
            p: [['psaw', 'PULSE SAW', 1, F.pct], ['saw', 'SAW', 0, F.pct], ['pw', 'WIDTH', 0.35, F.pct], ['pwm', 'PWM', 0.5, F.pct], ['rate', 'PWM RATE', 0.3, F.hz(0.1, 6)], ['det', 'SPREAD', 0.5, v => Math.round(v * 60) + 'c'], ['sub', 'OCTAVE DOWN', 0.6, F.pct],
                ['dive', 'DIVE', 0.6, v => '+' + Math.round(v * 12) + 'st'], ['dtime', 'DIVE TIME', 0.3, F.ms(0.03, 1.2)], ['drop', 'LET GO DROP', 0.3, v => '-' + Math.round(v * 24) + 'st'],
                ['cut', 'CUT', 0.7, F.hz(200, 16000)], ['res', 'RES', 0.15, F.pct], ['chor', 'CHORUS', 0.875, F.pick(['off', 'I', 'II', 'I+II'])], ['att', 'ATTACK', 0.05, F.ms(0.001, 2, 2)], ['rel', 'RELEASE', 0.3, F.ms(0.01, 3, 2)], ['oct', 'OCTAVE', 0.5, F.oct]],
            groups: [['源 · OSC', null, ['psaw', 'saw', 'pw', 'pwm', 'rate', 'det', 'sub', 'oct']], ['音 · PITCH', null, ['dive', 'dtime', 'drop']], ['濾 · TONE', null, ['cut', 'res', 'chor', 'att', 'rel']]],
            selects: ['chor'], pwk: 1,
            presets: [
                ['倉庫の遠吠え // WAREHOUSE HOWL', {}],
                ['掃除機 // THE VACUUM', { psaw: 1, saw: 0.35, pw: 0.15, pwm: 0.85, rate: 0.12, det: 1, sub: 1, dive: 0.25, dtime: 0.75, drop: 1, cut: 0.48, res: 0.35, chor: 0.875, att: 0.12, rel: 0.62, oct: 0.25, _fx: [{ type: 'hollow', p: { mode: 0.6, size: 0.75, decay: 0.6, mix: 0.3 } }] }],
                ['暗い遠吠え // DARK HOWL', { pw: 0.5, pwm: 0.3, det: 0.35, sub: 0.9, dive: 0.3, dtime: 0.4, cut: 0.35, res: 0.2, chor: 0.625, oct: 0.25 }],
                ['工業の警報 // INDUSTRIAL ALARM', { psaw: 0.6, saw: 0.6, pw: 0.1, pwm: 0.9, rate: 0.85, det: 0.8, sub: 0.4, dive: 1, dtime: 0.15, drop: 0.9, cut: 0.9, res: 0.45, chor: 0.375 }],
                ['恍惚の遠吠え // EUPHORIC HOWL', { pwm: 0.4, det: 0.4, sub: 0.5, dive: 0.4, dtime: 0.5, drop: 0.2, cut: 0.75, chor: 0.875, att: 0.15, rel: 0.6, oct: 0.75 }]],
            draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, 0, 0); } },
        { id: 'razor', jp: '剃刀', en: 'RAZOR', sub: 'metal guitar. PICK, PICKUP + SUSTAIN shape the string, then its own amp: TIGHT, BOOST, GAIN, tone + CAB. PALM MUTE (or AUTO PALM: short notes get muted) for the chug, DOUBLE for two hard panned takes, PINCH for squeals. for power chords put the root, fifth + octave together (CHORDS has them as 5)', kind: 'poly', part: 'nb_razor', face: 'char',
            p: [['pick', 'PICK', 0.6, F.pct], ['pos', 'PICKUP', 0.2, v => v < 0.15 ? 'bridge' : v > 0.85 ? 'neck' : Math.round(v * 100) + '% up'], ['sus', 'SUSTAIN', 0.55, v => (0.6 + Math.pow(v, 1.5) * 7.4).toFixed(1) + 's'], ['strum', 'STRUM', 0.15, v => Math.round(v * 25) + 'ms'],
                ['vib', 'VIBRATO', 0.2, F.pct], ['pinch', 'PINCH', 0, F.pct], ['scrape', 'PICK NOISE', 0.3, F.pct], ['low', 'LOW STRING', 0, F.pct], ['swell', 'SWELL', 0, v => v < 0.01 ? 'off' : Math.round((0.05 + v * 0.9) * 1000) + 'ms'], ['palm', 'PALM MUTE', 0, F.pct], ['auto', 'AUTO PALM', 0.75, F.pick(['off', 'on'])],
                ['amp', 'AMP', 0.6, F.pick(['CLEAN', 'CRUNCH', 'HIGH GAIN', 'FUZZ'])], ['gain', 'GAIN', 0.65, F.pct], ['tight', 'TIGHT', 0.45, F.hz(40, 400)], ['boost', 'BOOST', 0.5, v => '+' + (v * 12).toFixed(1) + 'dB'], ['gate', 'GATE', 0.7, v => v < 0.02 ? 'off' : '-' + Math.round(v * 60) + 'dB'],
                ['bass', 'BASS', 0.5, v => ((v - 0.5) * 20).toFixed(1) + 'dB'], ['mid', 'MID', 0.5, v => ((v - 0.5) * 20).toFixed(1) + 'dB'], ['treble', 'TREBLE', 0.5, v => ((v - 0.5) * 20).toFixed(1) + 'dB'], ['pres', 'PRESENCE', 0.5, v => ((v - 0.5) * 12).toFixed(1) + 'dB'],
                ['cab', 'CAB', 0, F.pick(['4x12', '1x12', '2x10', 'NO CAB'])], ['chor', 'CHORUS', 0, F.pct], ['crate', 'CHORUS RATE', 0.3, v => (0.3 + v * 3).toFixed(1) + 'hz'], ['dbl', 'DOUBLE', 0.8, F.pct], ['oct', 'OCTAVE', 0.5, F.oct], ['vol', 'VOLUME', 0.75, F.pct]],
            groups: [['弦 · THE STRING', null, ['pick', 'pos', 'sus', 'strum', 'vib', 'pinch', 'scrape', 'low', 'swell']], ['掌 · PALM', null, ['palm', 'auto']], ['炉 · THE AMP', null, ['amp', 'gain', 'tight', 'boost', 'gate']],
                ['音 · TONE + CAB', null, ['bass', 'mid', 'treble', 'pres', 'cab']], ['二 · TWO TAKES', null, ['dbl', 'chor', 'crate', 'oct', 'vol']]],
            selects: ['amp', 'cab', 'auto'],
            presets: [
                ['刃の刻み // DJENT CHUG', { pick: 0.75, pos: 0.05, sus: 0.45, strum: 0.05, vib: 0, pinch: 0, scrape: 0.35, palm: 0, auto: 0.75, amp: 0.6, gain: 0.72, tight: 0.7, boost: 0.75, bass: 0.45, mid: 0.6, treble: 0.55, pres: 0.6, cab: 0, dbl: 1, oct: 0.25, vol: 0.75 }],
                ['鞭打ち // THRASH RHYTHM', { pick: 0.8, pos: 0.08, sus: 0.5, strum: 0.08, vib: 0.1, pinch: 0.1, scrape: 0.45, palm: 0, auto: 0.75, amp: 0.6, gain: 0.62, tight: 0.55, boost: 0.6, bass: 0.6, mid: 0.2, treble: 0.78, pres: 0.75, cab: 0.3, dbl: 0.9, oct: 0.5, vol: 0.75 }],
                ['泥の葬列 // DOOM SLUDGE', { pick: 0.45, pos: 0.35, sus: 0.85, strum: 0.4, vib: 0.35, pinch: 0, scrape: 0.2, palm: 0, auto: 0.25, amp: 0.85, gain: 0.8, tight: 0.2, boost: 0.25, bass: 0.75, mid: 0.72, treble: 0.28, pres: 0.4, cab: 0, dbl: 0.85, oct: 0.25, vol: 0.75 }],
                ['黒い吹雪 // BLACK METAL TREMOLO', { pick: 0.7, pos: 0.1, sus: 0.6, strum: 0.05, vib: 0.05, pinch: 0, scrape: 0.5, palm: 0, auto: 0.25, amp: 0.6, gain: 0.78, tight: 0.6, boost: 0.5, bass: 0.2, mid: 0.3, treble: 0.72, pres: 0.55, cab: 0.3, dbl: 1, oct: 0.5, vol: 0.7 }],
                ['悲鳴のリード // SCREAMING LEAD', { pick: 0.7, pos: 0.12, sus: 0.85, strum: 0, vib: 0.55, pinch: 0.45, scrape: 0.25, palm: 0, auto: 0.25, amp: 0.6, gain: 0.8, tight: 0.45, boost: 0.7, bass: 0.4, mid: 0.7, treble: 0.6, pres: 0.55, cab: 0.3, dbl: 0, oct: 0.75, vol: 0.7 }],
                ['底の底 // NU METAL DROP', { pick: 0.6, pos: 0.15, sus: 0.5, strum: 0.1, vib: 0, pinch: 0.15, scrape: 0.4, palm: 0, auto: 0.75, amp: 0.6, gain: 0.6, tight: 0.4, boost: 0.4, bass: 0.72, mid: 0.12, treble: 0.66, pres: 0.5, cab: 0, dbl: 1, oct: 0.25, vol: 0.75 }],
                ['工業の鋸 // INDUSTRIAL SAW', { pick: 0.85, pos: 0.02, sus: 0.4, strum: 0, vib: 0, pinch: 0, scrape: 0.6, palm: 0.3, auto: 0.75, amp: 0.6, gain: 0.7, tight: 0.75, boost: 0.6, bass: 0.45, mid: 0.78, treble: 0.55, pres: 0.7, cab: 0.6, dbl: 1, oct: 0.5, vol: 0.65, _fx: [{ type: 'sieve', p: { mode: 0.85, cut: 0.66, res: 0.35, drive: 0.6, mix: 1 } }] }],
                ['喪服の澄音 // GOTH CLEAN', { pick: 0.45, pos: 0.7, sus: 0.8, strum: 0.35, vib: 0.25, pinch: 0, scrape: 0.15, palm: 0, auto: 0.25, amp: 0.1, gain: 0.35, tight: 0.2, boost: 0, bass: 0.55, mid: 0.45, treble: 0.6, pres: 0.5, cab: 0.3, dbl: 0.7, oct: 0.5, vol: 0.8, _fx: [{ type: 'echo', p: { time: 0.5, feel: 0.5, fb: 0.35, mix: 0.25 } }, { type: 'hollow', p: { mode: 0.6, size: 0.7, decay: 0.55, mix: 0.3 } }] }],
                ['錆びた歯 // CRUNCH RIFF', { pick: 0.6, pos: 0.15, sus: 0.6, strum: 0.2, vib: 0.15, pinch: 0.05, scrape: 0.3, palm: 0, auto: 0.75, amp: 0.35, gain: 0.7, tight: 0.35, boost: 0.4, bass: 0.45, mid: 0.78, treble: 0.4, pres: 0.5, cab: 0.6, dbl: 0.8, oct: 0.5, vol: 0.75 }],
                ['葬送の和音 // FUNERAL POWER CHORDS', { pick: 0.5, pos: 0.2, sus: 0.95, strum: 0.5, vib: 0.1, pinch: 0, scrape: 0.25, palm: 0, auto: 0, amp: 0.6, gain: 0.7, tight: 0.35, boost: 0.4, bass: 0.75, mid: 0.5, treble: 0.3, pres: 0.3, cab: 0, dbl: 1, oct: 0.5, low: 0.45, vol: 0.7, _fx: [{ type: 'hollow', p: { mode: 0.6, size: 1, decay: 0.8, mix: 0.4 } }] }],
                ['電脳の刻み // CYBER RIFF', { pick: 0.85, pos: 0.03, sus: 0.4, strum: 0.03, vib: 0.2, pinch: 0, scrape: 0.55, low: 0.6, swell: 0, palm: 0, auto: 0.75, amp: 0.6, gain: 0.75, tight: 0.75, boost: 0.7, gate: 0.9, bass: 0.5, mid: 0.6, treble: 0.65, pres: 0.7, cab: 0, chor: 0, crate: 0.3, dbl: 1, oct: 0.25, vol: 0.7, _fx: [{ type: 'shatter', p: { bits: 0.55, down: 0.3, mix: 0.35 } }] }],
                ['八弦の地鳴り // EIGHT STRING QUAKE', { pick: 0.7, pos: 0.05, sus: 0.45, strum: 0.04, vib: 0.2, pinch: 0, scrape: 0.3, low: 0.85, swell: 0, palm: 0, auto: 0.75, amp: 0.6, gain: 0.7, tight: 0.8, boost: 0.8, gate: 0.85, bass: 0.4, mid: 0.55, treble: 0.55, pres: 0.6, cab: 0, chor: 0, crate: 0.3, dbl: 1, oct: 0.25, vol: 0.7 }],
                ['暗い波の澄音 // DARKWAVE CHORUS', { pick: 0.55, pos: 0.6, sus: 0.75, strum: 0.25, vib: 0.1, pinch: 0, scrape: 0.15, low: 0, swell: 0, palm: 0, auto: 0.25, amp: 0.1, gain: 0.3, tight: 0.25, boost: 0, gate: 0.7, bass: 0.45, mid: 0.45, treble: 0.65, pres: 0.6, cab: 0.3, chor: 0.75, crate: 0.25, dbl: 0.6, oct: 0.5, vol: 0.8, _fx: [{ type: 'echo', p: { time: 0.5, feel: 0.5, fb: 0.4, mix: 0.3 } }, { type: 'hollow', p: { mode: 0.6, size: 0.75, decay: 0.6, mix: 0.3 } }] }],
                ['街の跡 // POST PUNK SPLASH', { pick: 0.75, pos: 0.15, sus: 0.6, strum: 0.35, vib: 0.05, pinch: 0, scrape: 0.3, low: 0, swell: 0, palm: 0, auto: 0.25, amp: 0.35, gain: 0.3, tight: 0.35, boost: 0.2, gate: 0.7, bass: 0.4, mid: 0.45, treble: 0.7, pres: 0.65, cab: 0.3, chor: 0.55, crate: 0.4, dbl: 0.5, oct: 0.5, vol: 0.8, _fx: [{ type: 'hollow', p: { mode: 0.2, size: 0.5, decay: 0.45, mix: 0.3 } }] }],
                ['夕焼けの電源 // SYNTHWAVE POWER', { pick: 0.6, pos: 0.2, sus: 0.75, strum: 0.2, vib: 0.25, pinch: 0, scrape: 0.3, low: 0, swell: 0, palm: 0, auto: 0.5, amp: 0.35, gain: 0.6, tight: 0.4, boost: 0.45, gate: 0.7, bass: 0.5, mid: 0.4, treble: 0.65, pres: 0.55, cab: 0.3, chor: 0.7, crate: 0.35, dbl: 0.9, oct: 0.5, vol: 0.75, _fx: [{ type: 'echo', p: { time: 0.5, feel: 0.5, fb: 0.3, mix: 0.2 } }] }],
                ['霧の壁 // SHOEGAZE WALL', { pick: 0.4, pos: 0.5, sus: 0.95, strum: 0.6, vib: 0.4, pinch: 0, scrape: 0.1, low: 0, swell: 0.55, palm: 0, auto: 0, amp: 0.9, gain: 0.6, tight: 0.15, boost: 0.2, gate: 0.7, bass: 0.55, mid: 0.6, treble: 0.25, pres: 0.2, cab: 0.3, chor: 0.5, crate: 0.15, dbl: 1, oct: 0.5, vol: 0.7, _fx: [{ type: 'hollow', p: { mode: 0.6, size: 1, decay: 0.9, mix: 0.6 } }] }],
                ['弓の幽霊 // VIOLIN GHOST', { pick: 0.5, pos: 0.35, sus: 0.95, strum: 0, vib: 0.5, pinch: 0, scrape: 0.3, low: 0, swell: 0.8, palm: 0, auto: 0, amp: 0.6, gain: 0.6, tight: 0.4, boost: 0.5, gate: 0.7, bass: 0.5, mid: 0.65, treble: 0.45, pres: 0.45, cab: 0.3, chor: 0.2, crate: 0.3, dbl: 0, oct: 0.75, vol: 0.7, _fx: [{ type: 'echo', p: { time: 0.65, fb: 0.45, mix: 0.3 } }, { type: 'hollow', p: { mode: 0.6, size: 0.85, decay: 0.75, mix: 0.4 } }] }],
                ['硬い噛み跡 // HARDSTYLE GUITAR STAB', { pick: 0.9, pos: 0.02, sus: 0.35, strum: 0.02, vib: 0.2, pinch: 0, scrape: 0.5, low: 0, swell: 0, palm: 0, auto: 0.75, amp: 0.85, gain: 0.8, tight: 0.85, boost: 0.9, gate: 0.95, bass: 0.35, mid: 0.7, treble: 0.6, pres: 0.6, cab: 0, chor: 0, crate: 0.3, dbl: 1, oct: 0.5, vol: 0.65, _fx: [{ type: 'hollow', p: { mode: 0.95, size: 0.4, decay: 0.3, mix: 0.25 } }] }],
                ['数学の拷問 // MATHCORE STAB', { pick: 0.95, pos: 0.02, sus: 0.3, strum: 0, vib: 0.2, pinch: 0.3, scrape: 0.6, low: 0, swell: 0, palm: 0, auto: 0.75, amp: 0.6, gain: 0.65, tight: 0.7, boost: 0.6, gate: 0.95, bass: 0.28, mid: 0.62, treble: 0.78, pres: 0.8, cab: 0.3, chor: 0, crate: 0.3, dbl: 0.85, oct: 0.5, vol: 0.72 }],
                ['錆の手紙 // LO-FI DEMO TAPE', { pick: 0.55, pos: 0.3, sus: 0.5, strum: 0.3, vib: 0.15, pinch: 0, scrape: 0.4, low: 0, swell: 0, palm: 0, auto: 0.75, amp: 0.35, gain: 0.75, tight: 0.3, boost: 0.3, gate: 0.7, bass: 0.55, mid: 0.6, treble: 0.35, pres: 0.3, cab: 0.6, chor: 0, crate: 0.3, dbl: 0.3, oct: 0.5, vol: 0.75, _fx: [{ type: 'rot', p: { amt: 0.35, wow: 0.4, flut: 0.3, age: 0.6, mix: 1 } }] }]],
            draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, 0, 0); } },
        { id: 'screech', jp: '悲鳴', en: 'SCREECH', sub: 'hardstyle screech. dives into the note, distorted twice through a vowel filter that wobbles in time. DIRT before, TEAR after, VOWEL + SWEEP for the filter', kind: 'poly', part: 'nb_screech', face: 'char',
            p: [['det', 'DETUNE', 0.4, F.pct], ['fm', 'FM', 0.4, F.pct], ['ratio', 'FM RATIO', 0.4, F.pick(['0.5', '1', '2', '3'])], ['dirt', 'DIRT', 0.6, F.pct], ['tear', 'TEAR', 0.5, F.pct],
                ['vowel', 'VOWEL', 0.5, v => ['oo', 'oh', 'ah', 'eh', 'ee'][Math.min(4, Math.floor(v * 5))]], ['res', 'PEAK', 0.6, F.pct], ['sweep', 'SWEEP', 0.6, F.pct], ['stime', 'SWEEP TIME', 0.3, v => Math.round((0.03 + v * 0.8) * 1000) + 'ms'],
                ['wob', 'WOBBLE', 0.3, F.pct], ['wrate', 'WOBBLE RATE', 0.6, F.pick(['1 bar', '1/2', '1/4', '1/8', '1/16', '1/4T', '1/8T'])], ['dive', 'DIVE', 0.5, v => '+' + Math.round(v * 24) + 'st'], ['dtime', 'DIVE TIME', 0.3, v => Math.round((0.01 + v * v * 0.6) * 1000) + 'ms'],
                ['att', 'ATTACK', 0.05, F.pct], ['rel', 'RELEASE', 0.2, F.pct], ['tone', 'TONE', 0.6, F.hz(2500, 16000)], ['wide', 'WIDTH', 0.4, F.pct], ['oct', 'OCTAVE', 0.5, F.oct], ['vol', 'VOLUME', 0.75, F.pct]],
            groups: [['源 · THE NOISE', null, ['det', 'fm', 'ratio', 'dive', 'dtime']], ['口 · THE MOUTH', null, ['vowel', 'res', 'sweep', 'stime', 'wob', 'wrate']], ['壊 · WRECK', null, ['dirt', 'tear', 'tone']], ['出 · OUT', null, ['att', 'rel', 'wide', 'oct', 'vol']]],
            selects: ['ratio', 'wrate'],
            presets: [
                ['生の悲鳴 // RAWSTYLE SCREECH', { det: 0.4, fm: 0.55, ratio: 0.4, dirt: 0.75, tear: 0.7, vowel: 0.35, res: 0.75, sweep: 0.8, stime: 0.25, wob: 0.45, wrate: 0.6, dive: 0.6, dtime: 0.25, att: 0.05, rel: 0.2, tone: 0.6, wide: 0.4, oct: 0.5, vol: 0.75, _fx: [{ type: 'hollow', p: { mode: 0.95, size: 0.5, decay: 0.35, mix: 0.2 } }] }],
                ['陶酔の悲鳴 // EUPHORIC SCREECH', { det: 0.4, fm: 0.3, ratio: 0.4, dirt: 0.5, tear: 0.4, vowel: 0.6, res: 0.55, sweep: 0.5, stime: 0.45, wob: 0.15, wrate: 0.4, dive: 0.35, dtime: 0.4, att: 0.05, rel: 0.35, tone: 0.7, wide: 0.4, oct: 0.5, vol: 0.75, _fx: [{ type: 'hollow', p: { mode: 0.6, size: 0.8, decay: 0.6, mix: 0.3 } }] }],
                ['鋸の歯 // SAWTOOTH SNARL', { det: 0.7, fm: 0.15, ratio: 0.2, dirt: 0.85, tear: 0.6, vowel: 0.25, res: 0.5, sweep: 0.3, stime: 0.3, wob: 0, wrate: 0.6, dive: 0.2, dtime: 0.15, att: 0.05, rel: 0.2, tone: 0.55, wide: 0.4, oct: 0.5, vol: 0.75 }],
                ['電脳の警報 // CYBER SIREN', { det: 0.4, fm: 0.6, ratio: 0.7, dirt: 0.4, tear: 0.45, vowel: 0.75, res: 0.85, sweep: 0.9, stime: 0.6, wob: 0.7, wrate: 0.75, dive: 0.8, dtime: 0.55, att: 0.05, rel: 0.2, tone: 0.65, wide: 0.4, oct: 0.5, vol: 0.75, _fx: [{ type: 'echo', p: { style: 0.9, time: 0.4, fb: 0.35, mix: 0.25 } }] }],
                ['工場の泣き声 // INDUSTRIAL WHINE', { det: 0.4, fm: 0.8, ratio: 0.95, dirt: 0.7, tear: 0.8, vowel: 0.85, res: 0.9, sweep: 0.2, stime: 0.3, wob: 0.2, wrate: 0.85, dive: 0.1, dtime: 0.3, att: 0.05, rel: 0.2, tone: 0.45, wide: 0.4, oct: 0.5, vol: 0.75, _fx: [{ type: 'shatter', p: { bits: 0.5, down: 0.3, filt: 0.99, mix: 0.35 } }] }],
                ['調律された悲鳴 // TONAL HARDSTYLE LEAD', { det: 0.25, fm: 0.2, ratio: 0.4, dirt: 0.45, tear: 0.35, vowel: 0.55, res: 0.45, sweep: 0.35, stime: 0.2, wob: 0.1, wrate: 0.6, dive: 0.15, dtime: 0.1, att: 0.05, rel: 0.3, tone: 0.75, wide: 0.7, oct: 0.5, vol: 0.75, _fx: [{ type: 'hollow', p: { mode: 0.6, size: 0.7, decay: 0.55, mix: 0.25 } }] }],
                ['蹴りの尻尾 // KICK TAIL SCREECH', { det: 0.4, fm: 0.7, ratio: 0.1, dirt: 0.9, tear: 0.85, vowel: 0.2, res: 0.8, sweep: 0.95, stime: 0.15, wob: 0.55, wrate: 0.6, dive: 0.95, dtime: 0.12, att: 0.05, rel: 0.2, tone: 0.5, wide: 0.4, oct: 0.25, vol: 0.75 }],
                ['掃除機の悲鳴 // HOOVER SCREAM', { det: 0.9, fm: 0.25, ratio: 0.4, dirt: 0.55, tear: 0.4, vowel: 0.45, res: 0.5, sweep: 0.7, stime: 0.7, wob: 0.35, wrate: 0.3, dive: 0.7, dtime: 0.7, att: 0.15, rel: 0.5, tone: 0.6, wide: 0.9, oct: 0.25, vol: 0.75, _fx: [{ type: 'sway', p: { mix: 0.6 } }] }],
                ['壊れた声 // GLITCH VOICE', { det: 0.4, fm: 0.65, ratio: 0.7, dirt: 0.6, tear: 0.6, vowel: 0.65, res: 0.7, sweep: 0.4, stime: 0.3, wob: 0.9, wrate: 0.95, dive: 0.3, dtime: 0.05, att: 0.05, rel: 0.2, tone: 0.6, wide: 0.4, oct: 0.5, vol: 0.75, _fx: [{ type: 'stutter', p: { chance: 0.5, mix: 1 } }] }],
                ['犬笛 // DOG WHISTLE', { det: 0.05, fm: 0.1, ratio: 0.6, dirt: 0.2, tear: 0.15, vowel: 1, res: 1, sweep: 0.1, stime: 0.3, wob: 0.6, wrate: 0.9, dive: 1, dtime: 0.9, att: 0.05, rel: 0.2, tone: 1, wide: 0.4, oct: 1, vol: 0.45 }]],
            draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, 0, 0); } },
        { id: 'spine', jp: '背骨', en: 'SPINE', sub: 'bass guitar. fingers or a pick, a P or a J pickup, a little rig', kind: 'poly', part: 'nb_spine', face: 'sump',
            p: [['pick', 'PICK', 0.3, v => v < 0.45 ? 'fingers' : v > 0.8 ? 'hard pick' : 'pick'], ['pos', 'PICKUP', 0.5, v => v < 0.2 ? 'bridge (J)' : v > 0.8 ? 'neck' : v > 0.4 && v < 0.65 ? 'middle (P)' : Math.round(v * 100) + '% up'], ['sus', 'SUSTAIN', 0.5, v => (1 + Math.pow(v, 1.4) * 9).toFixed(1) + 's'], ['mute', 'MUTE', 0, F.pct],
                ['comp', 'SQUEEZE', 0.5, F.pct], ['grit', 'GRIT', 0.2, F.pct], ['lows', 'LOWS', 0.5, v => ((v - 0.5) * 16).toFixed(1) + 'dB'], ['mids', 'MIDS', 0.5, v => ((v - 0.5) * 20).toFixed(1) + 'dB'], ['midf', 'MID FREQ', 0.4, F.hz(300, 2000)], ['clank', 'CLANK', 0.5, v => ((v - 0.5) * 18).toFixed(1) + 'dB'], ['top', 'TOP', 0.6, F.hz(2000, 16000)],
                ['chor', 'CHORUS', 0, F.pct], ['crate', 'CHORUS RATE', 0.3, v => (0.3 + v * 3).toFixed(1) + 'hz'], ['oct', 'OCTAVE', 0.5, F.oct], ['vol', 'VOLUME', 0.75, F.pct]],
            groups: [['弦 · THE STRING', null, ['pick', 'pos', 'sus', 'mute']], ['箱 · THE RIG', null, ['comp', 'grit', 'lows', 'mids', 'midf', 'clank', 'top']], ['揺 · CHORUS', null, ['chor', 'crate', 'oct', 'vol']]],
            presets: [
                ['素のP // PLAIN P BASS', { pick: 0.25, pos: 0.5, sus: 0.5, mute: 0, comp: 0.5, grit: 0.05, lows: 0.62, mids: 0.45, midf: 0.4, clank: 0.4, top: 0.45, chor: 0, crate: 0.3, oct: 0.5, vol: 0.75 }],
                ['橋の唸り // J BRIDGE GROWL', { pick: 0.3, pos: 0, sus: 0.5, mute: 0, comp: 0.55, grit: 0.2, lows: 0.4, mids: 0.78, midf: 0.45, clank: 0.65, top: 0.62, chor: 0, crate: 0.3, oct: 0.5, vol: 0.75 }],
                ['高い合唱 // POST PUNK HIGH CHORUS', { pick: 0.85, pos: 0.35, sus: 0.5, mute: 0, comp: 0.6, grit: 0.2, lows: 0.35, mids: 0.6, midf: 0.55, clank: 0.7, top: 0.75, chor: 0.7, crate: 0.3, oct: 0.5, vol: 0.75 }],
                ['暗い八分 // DARKWAVE EIGHTHS', { pick: 0.85, pos: 0.4, sus: 0.35, mute: 0.45, comp: 0.7, grit: 0.15, lows: 0.5, mids: 0.62, midf: 0.3, clank: 0.7, top: 0.6, chor: 0.35, crate: 0.3, oct: 0.5, vol: 0.85 }],
                ['喪の根音 // GOTH ROOT', { pick: 0.7, pos: 0.65, sus: 0.6, mute: 0, comp: 0.5, grit: 0.1, lows: 0.7, mids: 0.35, midf: 0.4, clank: 0.45, top: 0.45, chor: 0.55, crate: 0.2, oct: 0.5, vol: 0.75, _fx: [{ type: 'hollow', p: { mode: 0.4, size: 0.5, decay: 0.4, mix: 0.15 } }] }],
                ['電脳の唸り // CYBER GROWL', { pick: 0.9, pos: 0, sus: 0.6, mute: 0, comp: 0.8, grit: 1, lows: 0.6, mids: 0.85, midf: 0.7, clank: 0.5, top: 0.42, chor: 0, crate: 0.3, oct: 0.5, vol: 0.75 }],
                ['鉄の拾い // METAL PICK BASS', { pick: 1, pos: 0.15, sus: 0.5, mute: 0.25, comp: 0.75, grit: 0.35, lows: 0.65, mids: 0.5, midf: 0.6, clank: 0.9, top: 0.82, chor: 0, crate: 0.3, oct: 0.5, vol: 0.75 }],
                ['深い指 // DEEP FINGERS', { pick: 0.1, pos: 0.75, sus: 0.75, mute: 0.1, comp: 0.5, grit: 0.05, lows: 0.8, mids: 0.35, midf: 0.35, clank: 0.05, top: 0.22, chor: 0, crate: 0.3, oct: 0.5, vol: 0.75 }],
                ['夕焼けの低音 // SYNTHWAVE PICK', { pick: 0.8, pos: 0.2, sus: 0.35, mute: 0.6, comp: 0.75, grit: 0.15, lows: 0.55, mids: 0.5, midf: 0.45, clank: 0.7, top: 0.7, chor: 0.45, crate: 0.6, oct: 0.5, vol: 0.75 }],
                ['地下の脈 // DUB UNDERNEATH', { pick: 0.1, pos: 0.9, sus: 0.8, mute: 0.1, comp: 0.6, grit: 0.1, lows: 0.85, mids: 0.3, midf: 0.4, clank: 0.05, top: 0.2, chor: 0, crate: 0.3, oct: 0.25, vol: 0.75 }],
                ['輪ゴム // RUBBER BAND', { pick: 0.35, pos: 0.95, sus: 0.05, mute: 0.65, comp: 0.7, grit: 0, lows: 0.4, mids: 0.7, midf: 0.3, clank: 0.2, top: 0.4, chor: 0, crate: 0.3, oct: 0.5, vol: 1 }]],
            draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, 0, 0); } },
        // church organ. sounds sick with heaps of reverb
        { id: 'vesper', jp: '晩祷', en: 'VESPER', sub: 'pipe organ. pull the stops', kind: 'poly', part: 'nb_vesper', face: 'grave',
            p: [['b16', "BOURDON 16'", 0.5, F.pct], ['p8', "PRINCIPAL 8'", 0.8, F.pct], ['f8', "FLUTE 8'", 0.4, F.pct], ['o4', "OCTAVE 4'", 0.5, F.pct], ['f2', "FIFTEENTH 2'", 0.3, F.pct], ['mix', 'MIXTURE', 0.2, F.pct], ['tr8', "TRUMPET 8'", 0, F.pct],
                ['chiff', 'CHIFF', 0.4, F.pct], ['wind', 'WIND', 0.25, F.pct], ['trem', 'TREMULANT', 0, F.pct], ['swell', 'SWELL', 1, v => v > 0.97 ? 'open' : v < 0.03 ? 'shut' : Math.round(v * 100) + '%'], ['att', 'SPEECH', 0.3, F.ms(0.01, 0.4)], ['rel', 'RELEASE', 0.25, F.ms(0.02, 2, 2)], ['oct', 'OCTAVE', 0.5, F.oct]],
            groups: [['管 · STOPS', null, ['b16', 'p8', 'f8', 'o4', 'f2', 'mix', 'tr8']], ['息 · WIND', null, ['chiff', 'wind', 'att', 'rel']], ['箱 · SWELL', null, ['trem', 'swell', 'oct']]],
            presets: [
                ['大聖堂 // FULL CATHEDRAL', { b16: 0.7, p8: 0.9, f8: 0.3, o4: 0.7, f2: 0.6, mix: 0.6, tr8: 0.5, chiff: 0.35, wind: 0.2 }],
                ['葬送 // FUNERAL', { b16: 0.8, p8: 0.6, f8: 0.5, o4: 0, f2: 0, mix: 0, tr8: 0, chiff: 0.2, wind: 0.35, trem: 0.25, swell: 0.55, att: 0.5, rel: 0.5 }],
                ['地下聖堂の笛 // CRYPT FLUTE', { b16: 0, p8: 0, f8: 0.9, o4: 0.3, f2: 0, mix: 0, chiff: 0.6, wind: 0.45, trem: 0.35 }],
                ['合唱の柱 // PRINCIPAL CHORUS', { b16: 0.3, p8: 0.9, f8: 0, o4: 0.8, f2: 0.6, mix: 0.4, tr8: 0, chiff: 0.3 }],
                ['審判の喇叭 // JUDGEMENT REED', { b16: 0.5, p8: 0.4, f8: 0, o4: 0.3, f2: 0, mix: 0, tr8: 1, chiff: 0.1, wind: 0.1 }],
                ['閉ざされた箱 // SHUT BOX', { b16: 0.6, p8: 0.7, f8: 0.4, o4: 0.4, f2: 0.2, mix: 0.1, swell: 0.15, trem: 0.15 }],
                ['亡霊の礼拝 // GHOST MASS', { b16: 0.9, p8: 0, f8: 0.6, o4: 0, f2: 0.4, mix: 0, chiff: 0.15, wind: 0.6, trem: 0.5, swell: 0.4, att: 0.8, rel: 0.8 }]],
            draw(x, w, h, s, D) { picDraw(this, x, w, h, s, D, 0, 0); } },
        { id: 'uta', jp: '歌声', en: 'SIREN', sub: 'sings what you type. write LYRICS on the clip in the roll: kana or romaji ("a i shi te ru"), one sound per note, ー holds. hover any dial for what it does. the chart shows where each vowel sits + where the voice is now', kind: 'poly', part: 'nb_uta', face: 'throat',
            p: [['voice', 'MASC ↔ FEM', 0.85, v => v < 0.35 ? 'masc' : v > 0.65 ? 'fem' : 'between'], ['light', 'DARK ↔ LIGHT', 0.5, v => v < 0.35 ? 'dark' : v > 0.65 ? 'light' : 'middle'], ['nasal', 'NASAL', 0.1, F.pct], ['robo', 'HUMAN ↔ ROBOT', 0, F.pct], ['metal', 'METAL', 0, F.pct], ['scream', 'SCREAM', 0, F.pct], ['skind', 'SCREAM KIND', 0, F.pick(['RASP', 'EDGE', 'FRY', 'FALSE CORD', 'SHRIEK', 'WRAITH', 'SQUEAL', 'GURGLE', 'CRY', 'HOWL'])], ['speak', 'SING ↔ SPEAK', 0, F.pct], ['tens', 'TENSION', 0.5, F.pct], ['breath', 'BREATH', 0.25, F.pct], ['cons', 'CONSONANTS', 0.6, F.pct],
                ['vib', 'VIBRATO', 0.35, F.pct], ['vrate', 'VIB SPEED', 0.5, F.hz(4.2, 7.5)], ['vdel', 'VIB LATE', 0.4, F.ms(0, 0.8)], ['scoop', 'SCOOP', 0.3, v => Math.round(v * 150) + 'c'],
                ['growl', 'GROWL', 0, F.pct], ['glitch', 'GLITCH', 0, F.pct], ['stack', 'STACK', 0, v => String(1 + Math.round(v * 3))], ['att', 'ATTACK', 0.15, F.ms(0.005, 0.6, 2)], ['rel', 'RELEASE', 0.3, F.ms(0.03, 2, 2)],
                ['vowel', 'NO WORDS', 0, F.pick(['a', 'i', 'u', 'e', 'o', 'n'])], ['oct', 'OCTAVE', 0.5, F.oct],
                ['size', 'SHORT ↔ LONG THROAT', 0.5, v => v < 0.35 ? 'short' : v > 0.65 ? 'long' : 'middle'], ['age', 'YOUNG ↔ OLD', 0.35, v => v < 0.3 ? 'young' : v > 0.7 ? 'old' : 'grown'], ['smile', 'POUT ↔ SMILE', 0.5, v => v < 0.35 ? 'pout' : v > 0.65 ? 'smile' : 'neutral'], ['warm', 'THIN ↔ WARM', 0.5, v => v < 0.35 ? 'thin' : v > 0.65 ? 'warm' : 'middle'], ['ring', 'RING', 0, F.pct], ['creak', 'CREAK', 0, F.pct], ['onset', 'START', 0, F.pick(['SOFT', 'BREATHY', 'HARD'])]],
            tips: { voice: 'whose throat: the mouth, the cords, the air through them', light: 'the throat dropped + covered, or up + bright', nasal: 'through the nose', robo: 'a person to a machine', metal: 'it rings like its made of it',
                scream: 'past clean into torn', skind: 'RASP rock gravel, EDGE a shout with a blade on it, FRY the crackling one, FALSE CORD the deep tear, SHRIEK a horror film, WRAITH all rasp + air, SQUEAL a pinched squeal, GURGLE a throat full of it, CRY a sob in it, HOWL long + wide like an animal',
                speak: 'from a held note to just talking', tens: 'soft + breathy to pushed + ringing', breath: 'air through it. all the way = a whisper', growl: 'every other cycle weaker + late: a growl under it', glitch: 'the voice cracks up + cuts out now + then', cons: 'how hard the consonants land', stack: 'more voices',
                vib: 'how wide the vibrato is', vrate: 'how fast the vibrato goes', vdel: 'how far into a note before the vibrato starts', scoop: 'how far below the note it slides up from', att: 'how fast a note comes in', rel: 'how long it hangs on after', vowel: 'the vowel it sings when the clip has no lyrics', oct: 'octaves up or down',
                size: 'how long the throat is, on its own (any voice can have either)', age: 'older = a shake, more air, everything a touch lower', smile: 'the lips: a smile brightens the vowels, a pout darkens them', warm: 'the body in it', ring: 'twang, the ring that cuts through', creak: 'vocal fry at the start + end of notes', onset: 'how each note begins: soft, on a breath, or a hard catch' },
            groups: [['誰 · WHO', null, ['voice', 'light', 'nasal', 'robo', 'metal']], ['声 · HOW', null, ['scream', 'skind', 'speak', 'tens', 'breath', 'growl', 'glitch', 'cons', 'stack']],
                ['個性 · PERSONALITY', null, ['size', 'age', 'smile', 'warm', 'ring', 'creak', 'onset']], ['揺れ · MOVEMENT', null, ['vib', 'vrate', 'vdel', 'scoop']], ['形 · SHAPE', null, ['att', 'rel', 'vowel', 'oct']]], selects: ['vowel', 'skind', 'onset'],
            fix(s) { if (!s) return s; if (s.skind != null && !s._sk) { s.skind = (Math.min(5, Math.floor(s.skind * 6)) + 0.5) / 10; } s._sk = 2; return s; } },
        { id: 'audio', jp: '録音', en: 'AUDIO', sub: 'real sound. drop a file on the timeline (wav, mp3, ogg, flac) or record. the mic only turns on when you press ● REC on this track yourself. the keys play the picked clip pitched, like a sampler', kind: 'audio', face: 'steel', p: [] }
    ];
    const CX = [['cxTune', 'TUNE', 0.5, v => { let n = Math.round((v - 0.5) * 48); return (n > 0 ? '+' : '') + n + 'st'; }], ['cxFine', 'FINE', 0.5, v => { let c = Math.round((v - 0.5) * 200); return (c > 0 ? '+' : '') + c + 'c'; }],
        ['cxVel', 'VEL', 0.5, v => v < 0.03 ? 'ignores it' : v < 0.47 ? 'soft' : v <= 0.53 ? 'as played' : 'harder'], ['cxDrv', 'DRIVE', 0, F.pct],
        ['cxTone', 'TONE', 0.5, v => v < 0.47 ? 'dark ' + Math.round((0.5 - v) * 24) + 'dB' : v > 0.53 ? 'bright ' + Math.round((v - 0.5) * 24) + 'dB' : 'flat'], ['cxOut', 'OUT', 0.5, v => { let d = (v - 0.5) * 24; return (d > 0 ? '+' : '') + d.toFixed(1) + 'dB'; }]];
    const CHORDS = [['off', [0]], ['5th', [0, 7]], ['maj', [0, 4, 7]], ['min', [0, 3, 7]], ['sus2', [0, 2, 7]], ['sus4', [0, 5, 7]], ['7', [0, 4, 7, 10]], ['m7', [0, 3, 7, 10]], ['maj7', [0, 4, 7, 11]], ['9', [0, 4, 7, 10, 14]], ['oct', [0, 12]], ['4ths', [0, 5, 10, 15]]];
    const ARPS = ['off', 'up', 'down', 'up+down', 'random', 'as played', 'down+up', 'in to out', 'out to in', 'chord'], ARATE = [['1/4', 1], ['1/8', 0.5], ['1/8T', 1 / 3], ['1/16', 0.25], ['1/16T', 1 / 6], ['1/32', 0.125]];
    const CXM = [['cxChord', 'CHORD', 0, F.pick(CHORDS.map(c => c[0]))], ['cxArp', 'ARP', 0, F.pick(ARPS)], ['cxRate', 'ARP RATE', 0.5, F.pick(ARATE.map(a => a[0]))], ['cxAoct', 'ARP OCT', 0, F.pick(['1', '2', '3', '4'])], ['cxGate', 'ARP GATE', 0.6, F.pct],
        ['cxSw', 'ARP SWING', 0, F.pct], ['cxCh', 'ARP CHANCE', 1, F.pct], ['cxSqOn', 'STEPS', 0, F.pick(['off', 'on'])], ['cxSqN', 'HOW MANY', 1, v => String(1 + Math.round(v * 15))]];
    const CXK = CX.map(q => q[0]).concat(CXM.map(q => q[0]));
    VOICES.forEach(v => { if (v.kind !== 'kit') { v.p = v.p.concat(CX, v.kind === 'drum' || v.kind === 'audio' ? [] : CXM); if (v.groups) { v.groups.push(['出口 · OUT', v.kind === 'drum' || v.kind === 'audio' ? null : 'cxseq', CXK]); if (v.views) v.views.forEach(w => { if (w[0] === 'VOICE') w[1].push('出口 · OUT'); }); } } });
    function cxFix(s) { if (s && s.cxArp != null && !s._cx) s.cxArp = (Math.min(5, Math.floor(s.cxArp * 6)) + 0.5) / 10; if (s) s._cx = 2; return s; }
    VOICES.forEach(v => { if (v.grow && !v.fix) { let [key, a, b] = v.grow; v.ver = 2; v.fix = s => { if (!s) return s; if ((s._v || 0) < 2 && s[key] != null) s[key] = (Math.min(a - 1, Math.floor(s[key] * a)) + 0.5) / b; s._v = 2; return s; }; } });
    const growL = (v, Ls) => { let [key, a, b] = v.grow; Ls.forEach(L => { if (L && L[key] != null) L[key] = (Math.min(a - 1, Math.floor(L[key] * a)) + 0.5) / b; }); };
    const V = {}; VOICES.forEach(v => { V[v.id] = v; v.def = {}; v.p.forEach(p => { v.def[p[0]] = p[2]; }); if (v.fix) { v.def._v = v.ver || 4; (v.presets || []).forEach(pr => { if (pr[1]._v !== (v.ver || 4)) v.fix(pr[1]); }); } });
    const BUSV = [
        { id: 'cask', jp: '柩', en: 'CASKET', kind: 'bus', grp: 1, p: [], sub: 'group. point a track OUT into it and the lot goes through one rack + one fader. fold it shut on the timeline and they all fold with it' },
        { id: 'cell', jp: '独房', en: 'CELL', kind: 'bus', p: [], sub: 'send / return. give it its own rack (a reverb, an echo, something filthy) and every track gets a SEND knob for it, before or after its own fader' }
    ];
    BUSV.forEach(v => { v.def = {}; V[v.id] = v; });
    const isBus = tr => !!(tr && V[tr.inst] && V[tr.inst].kind === 'bus');
    const outOf = (pr, tr) => { let u = tr && tr.mix && tr.mix.out; return u && u !== tr.uid && pr.tracks.some(t => t.uid === u && isBus(t)) ? u : ''; };
    const sendsOf = (pr, tr) => { let to = (tr && tr.mix && tr.mix.to) || {}, pre = (tr.mix && tr.mix.pre) || {}; return Object.keys(to).filter(u => u !== tr.uid && to[u] > 0.0005 && pr.tracks.some(t => t.uid === u && t.inst === 'cell')).map(u => ({ uid: u, amt: to[u], pre: !!pre[u] })); };
    function reaches(pr, a, b) {
        let by = {}, seen = new Set(), st = [a]; pr.tracks.forEach(t => { by[t.uid] = t; });
        while (st.length) { let u = st.pop(); if (u === b) return true; if (seen.has(u) || !by[u]) continue; seen.add(u); let o = outOf(pr, by[u]); if (o) st.push(o); sendsOf(pr, by[u]).forEach(s => st.push(s.uid)); }
        return false;
    }
    const canFeed = (pr, a, b) => !!a && !!b && a !== b && !reaches(pr, b, a);
    V.uta.def._sk = 2;
    {
        const k = (i, n) => (i + 0.5) / n, O = i => k(i + 2, 5);
        const MORE = {
            stomp: [['深い808 // DEEP 808', { tune: 0.22, pitch: 0.35, ptime: 0.5, decay: 0.9, click: 0.12, shape: 0, drive: 0.12, model: k(0, 9), tail: 0.65, top: 1 }],
                ['鉄拳 // HARDBITE KICK', { tune: 0.45, pitch: 0.85, ptime: 0.12, decay: 0.38, click: 0.85, ctone: 0.7, shape: k(1, 3), drive: 0.8, model: k(3, 9), knock: 0.45, top: 1 }],
                ['床下 // UNDER THE FLOOR', { tune: 0.28, pitch: 0.5, ptime: 0.3, decay: 0.6, click: 0.3, drive: 0.35, model: k(5, 9), tail: 0.4 }],
                ['綿の拳 // LO-FANG THUD', { tune: 0.35, pitch: 0.4, ptime: 0.3, decay: 0.35, click: 0.08, shape: 0, drive: 0.2, model: k(4, 9), top: 0.42 }],
                ['心臓 // HEARTBEAT', { tune: 0.18, pitch: 0.22, ptime: 0.55, decay: 0.5, click: 0, shape: 0, drive: 0, model: k(1, 9), att: 0.25, top: 0.33 }],
                ['八〇八 // THE 808 BOOM', { model: k(6, 9), tune: 0.48, pitch: 0.5, ptime: 0.3, decay: 0.55, click: 0.3, ctone: 0.35, drive: 0.12 }],
                ['八〇八の唸り // 808 TRAP BASS', { model: k(6, 9), tune: 0.48, pitch: 0.35, ptime: 0.2, decay: 0.85, click: 0.15, ctone: 0.3, drive: 0.45 }],
                ['九〇九 // THE 909 KICK', { model: k(7, 9), tune: 0.55, pitch: 0.5, ptime: 0.25, decay: 0.35, click: 0.55, ctone: 0.6, drive: 0.25 }],
                ['本物の太鼓 // REAL KICK', { model: k(8, 9), tune: 0.45, pitch: 0.35, ptime: 0.3, decay: 0.3, click: 0.6, ctone: 0.35 }]],
            slap: [['乾いた平手 // DRY SNARE', { mode: 0, tone: 0.45, body: 0.6, noise: 0.55, snap: 0.3, color: 0.55, decay: 0.3, model: k(1, 12) }],
                ['群衆の手 // CROWD CLAP', { mode: 1, claps: k(6, 8), spread: 0.75, noise: 0.7, color: 0.5, room: 0.35, model: k(7, 12) }],
                ['刷毛 // BRUSHES', { mode: 0.15, model: k(4, 12), noise: 0.5, snap: 0.65, color: 0.35, body: 0.3 }],
                ['鉄の扉 // IRON DOOR', { mode: 0.25, tone: 0.3, body: 0.85, noise: 0.85, snap: 0.5, color: 0.7, decay: 0.55, drop: 0.4, room: 0.6, wire: 0.3, model: k(2, 12) }],
                ['綿の平手 // LO-FANG SNARE', { mode: 0.1, tone: 0.5, noise: 0.45, snap: 0.35, color: 0.3, top: 0.4, wire: 0.35, model: k(0, 12) }],
                ['縁 // RIMSHOT', { model: k(5, 12), tone: 0.6, snap: 0.15, color: 0.7 }],
                ['八〇八 // 808 SNARE', { model: k(8, 12), tone: 0.45, body: 0.6, noise: 0.6, snap: 0.3, color: 0.45, decay: 0.35 }],
                ['九〇九 // 909 SNARE', { model: k(9, 12), tone: 0.4, body: 0.55, noise: 0.7, snap: 0.35, color: 0.6, decay: 0.3 }],
                ['八〇八の手 // 808 CLAP', { model: k(10, 12), noise: 0.75, color: 0.5, spread: 0.4, snap: 0.35, claps: 2 / 7, body: 0 }],
                ['本物の小太鼓 // REAL SNARE', { model: k(11, 12), tone: 0.5, body: 0.6, noise: 0.65, snap: 0.4, color: 0.5, decay: 0.3 }]],
            tick: [['細い針 // TIGHT HAT', { tone: 0.6, metal: 0.4, bright: 0.45, sizz: 0.7, cdec: 0.14, odec: 0.3, model: k(0, 10) }],
                ['錆びた蓋 // TRASH LID', { metal: 0.3, bright: 0.5, cdec: 0.45, odec: 0.75, model: k(6, 10), sizz: 0.8 }],
                ['殻 // SHAKER', { model: k(3, 10), shake: 0.5, cdec: 0.3, bright: 0.6 }],
                ['開いた口 // OPEN WIDE', { cdec: 0.45, odec: 0.9, metal: 0.5, bright: 0.35, sizz: 0.6, model: k(2, 10) }],
                ['綿 // LO-FANG HAT', { bright: 0.2, metal: 0.8, cdec: 0.2, swing: 0.3, model: k(1, 10) }],
                ['鈴輪 // TAMBOURINE', { model: k(4, 10), cdec: 0.35, bright: 0.7, shake: 0.3 }],
                ['八〇八 // 808 HAT', { model: k(7, 10), tone: 0.5, metal: 0, bright: 0.6, cdec: 0.25, odec: 0.45 }],
                ['九〇九 // 909 HAT', { model: k(8, 10), metal: 0.4, bright: 0.65, cdec: 0.3, odec: 0.5 }],
                ['ペダル // FOOT PEDAL', { model: k(9, 10), tone: 0.4, metal: 0.3, cdec: 0.4 }]],
            chime: [['教会の鐘 // CHURCH BELL', { pitch: 0.35, ratio: k(5, 8), index: 0.5, decay: 0.92, strike: 0.4, damp: 0.1, model: 0 }],
                ['牛の首 // COWBELL', { pitch: 0.6, ratio: k(2, 8), index: 0.3, decay: 0.25, strike: 0.5, damp: 0.5, model: 0 }],
                ['割れたグラス // BROKEN GLASS', { model: k(5, 15), pitch: 0.75, decay: 0.5, strike: 0.6, det: 0.4 }],
                ['水道管 // PIPE TAP', { model: k(8, 15), pitch: 0.45, decay: 0.35, damp: 0.4 }],
                ['オルゴール // MUSIC BOX', { model: 0, pitch: 0.8, ratio: k(3, 8), index: 0.2, decay: 0.55, strike: 0.2, bend: 0.5 }],
                ['八〇八の鐘 // 808 COWBELL', { model: k(10, 15), pitch: 0.5, decay: 0.35 }],
                ['八〇八の拍子木 // 808 CLAVE', { model: k(11, 15), pitch: 0.5, decay: 0.3 }],
                ['木琴 // MARIMBA', { model: k(12, 15), pitch: 0.45, decay: 0.4, damp: 0.4, strike: 0.4 }],
                ['鉄琴 // VIBES', { model: k(13, 15), pitch: 0.5, decay: 0.6, damp: 0.3, motor: 0.5, strike: 0.2 }],
                ['鋼の鍋 // STEEL PAN', { model: k(14, 15), pitch: 0.55, decay: 0.45, det: 0.25, damp: 0.35, strike: 0.3 }]],
            squirm: [['303 酸 // ACID 303', { wave: 0, cut: 0.25, res: 0.8, env: 0.7, dec: 0.35, acc: 0.7, glide: 0.4, drive: 0.45 }],
                ['303 悲鳴 // 303 SCREAM', { cut: 0.35, res: 0.95, env: 0.85, dec: 0.25, acc: 0.9, drive: 0.85 }],
                ['四角い泥 // SQUARE MUD', { wave: 1, cut: 0.2, res: 0.5, env: 0.4, dec: 0.5, sub: 0.5, drive: 0.2, oct: O(-1) }],
                ['眠い酸 // SLEEPY ACID', { cut: 0.3, res: 0.55, env: 0.3, dec: 0.7, glide: 0.8, drive: 0.1 }]],
            sump: [['深い808 // DEEP 808', { wave: k(0, 4), sub: 0.6, cut: 0.3, env: 0, att: 0, dec: 0.7, sus: 0.5, rel: 0.5, glide: 0.3, drive: 0.3, oct: O(-1) }],
                ['下水 // SEWER BASS', { wave: k(2, 4), det: 0.4, cut: 0.25, res: 0.3, env: 0.4, dec: 0.3, sus: 0.6, drive: 0.4 }],
                ['綿の底 // LO-FANG BASS', { wave: k(1, 4), cut: 0.2, sub: 0.4, att: 0.1, sus: 0.8, rel: 0.3, drive: 0.1 }],
                ['脈 // PULSE BASS', { wave: k(3, 4), cut: 0.3, res: 0.4, env: 0.6, dec: 0.2, sus: 0.3, drive: 0.3 }],
                ['うなる床 // FLOOR HUM', { wave: k(0, 4), det: 0.6, sub: 0.8, cut: 0.15, att: 0.4, sus: 1, rel: 0.6 }],
                ['近所迷惑 // MY NEIGHBOURS HATE THIS ONE', { wave: k(2, 4), sub: 1, cut: 0.35, res: 0.5, env: 0.5, dec: 0.4, sus: 0.7, drive: 0.9 }]],
            haze: [['霧の聖堂 // FOG CATHEDRAL', { wave: k(2, 4), voices: k(6, 7), det: 0.5, cut: 0.4, att: 0.75, rel: 0.8, lfo: k(1, 7), lfod: 0.4, width: 1 }],
                ['恍惚 // ENTRANCED PAD', { wave: k(2, 4), voices: k(6, 7), det: 0.7, cut: 0.65, res: 0.2, att: 0.4, rel: 0.6, width: 0.9 }],
                ['古いテープ // OLD TAPE KEYS', { wave: k(1, 4), voices: k(1, 7), det: 0.25, cut: 0.3, att: 0.1, rel: 0.35, lfo: k(3, 7), lfod: 0.3 }],
                ['硝子の光 // GLASS GLOW', { wave: k(0, 4), voices: k(3, 7), det: 0.3, cut: 0.5, att: 0.6, rel: 0.7 }],
                ['短い和音 // STAB', { wave: k(2, 4), voices: k(4, 7), det: 0.5, cut: 0.7, att: 0, rel: 0.15, width: 0.7 }],
                ['test2', { wave: k(3, 4), voices: k(2, 7), det: 0.15, cut: 0.55, res: 0.35, att: 0.05, rel: 0.45, lfo: k(5, 7), lfod: 0.6 }]],
            grit: [['金属の爪 // METAL PLUCK', { wave: k(2, 4), fm: 0.5, cut: 0.4, env: 0.7, dec: 0.2, rel: 0.2 }],
                ['恍惚の階段 // ENTRANCED ARP', { wave: k(2, 4), cut: 0.5, res: 0.4, env: 0.5, dec: 0.25, arp: k(1, 5), arate: k(1, 3), arange: k(1, 3) }],
                ['細い鉛 // THIN LEAD', { wave: k(3, 4), cut: 0.6, res: 0.2, env: 0.3, dec: 0.6, rel: 0.3 }],
                ['雨粒 // RAINDROPS', { wave: k(0, 4), fm: 0.3, cut: 0.6, env: 0.4, dec: 0.1, rel: 0.4, oct: O(1) }],
                ['迷子 // LOST ARP', { wave: k(1, 4), cut: 0.45, env: 0.4, dec: 0.3, arp: k(4, 5), arate: k(0, 3), arange: k(2, 3) }],
                ['濁った爪 // MUDDY PLUCK', { wave: k(3, 4), fm: 0.7, cut: 0.35, res: 0.6, env: 0.8, dec: 0.12, rel: 0.25, oct: O(-1) }]],
            throat: [['尼 // NUN', { vowel: k(0, 9), motion: 0.1, vib: 0.3, breath: 0.15, att: 0.4, rel: 0.5 }],
                ['地下の歌 // UNDERGROUND HUM', { vowel: k(8, 9), motion: 0.3, vib: 0.1, breath: 0.4, att: 0.5, rel: 0.6, oct: O(-1) }],
                ['幽霊 // GHOST', { vowel: k(6, 9), motion: 0.7, vib: 0.5, breath: 0.8, att: 0.7, rel: 0.8, oct: O(1) }]],
            rust: [['雨 // RAIN', { type: k(5, 7), tone: 0.6, motion: 0.3, dens: 0.8, att: 0.4, dec: 0.5 }],
                ['レコードの埃 // RECORD DUST', { type: k(1, 7), tone: 0.5, dens: 0.4, att: 0.2, dec: 0.4 }],
                ['トンネルの風 // TUNNEL WIND', { type: k(2, 7), tone: 0.3, motion: 0.7, att: 0.7, dec: 0.7 }],
                ['配管のうなり // PIPE DRONE', { type: k(3, 7), tone: 0.4, motion: 0.5, att: 0.8, dec: 0.8 }],
                ['地鳴り // RUMBLE', { type: k(4, 7), tone: 0.2, motion: 0.4, dens: 0.6, att: 0.6, dec: 0.8 }],
                ['焚き火 // FIRE', { type: k(6, 7), tone: 0.5, motion: 0.5, dens: 0.5, att: 0.5, dec: 0.7 }],
                ['シャー // HISS', { type: k(0, 7), tone: 0.6, att: 0.3, dec: 0.5 }]],
            steel: [['割れ物 // CRASH', { kind: k(0, 6), tone: 0.5, bright: 0.5, decay: 0.6, hiss: 0.5 }],
                ['乗り // RIDE', { kind: k(1, 6), tone: 0.55, bright: 0.55, decay: 0.6, hiss: 0.3, bell: 0.25 }],
                ['ゴミ箱の蓋 // BIN LID', { kind: k(2, 6), dirt: 0.8, bright: 0.4, decay: 0.4 }],
                ['しぶき // SPLASH', { kind: k(3, 6), bright: 0.7, decay: 0.35 }],
                ['八〇八のシンバル // 808 CYMBAL', { kind: k(4, 6), tone: 0.5, bright: 0.5, decay: 0.5 }],
                ['中華 // CHINA', { kind: k(5, 6), tone: 0.45, decay: 0.45, dirt: 0.3 }],
                ['大きな割れ物 // BIG CRASH', { kind: k(0, 6), tone: 0.4, bright: 0.45, decay: 0.85, hiss: 0.6 }],
                ['鐘の乗り // BELL RIDE', { kind: k(1, 6), tone: 0.6, bright: 0.6, decay: 0.7, hiss: 0.2, bell: 0.7 }]],
            zap: [['銃 // PEW', { pitch: 0.75, drop: 0.6, time: 0.15, wave: k(2, 4), decay: 0.2 }],
                ['落下 // LONG FALL', { pitch: 0.65, drop: 0.95, time: 0.85, wave: k(3, 4), decay: 0.8, dirt: 0.3 }],
                ['電子音 // BLIP', { pitch: 0.55, drop: 0.05, time: 0.05, wave: k(2, 4), decay: 0.08 }],
                ['火花 // SPARK', { pitch: 0.9, drop: 0.4, noise: 0.6, decay: 0.15, dirt: 0.5 }]],
            pipe: [['教会 // CHAPEL', { d16: 0.8, d8: 0.8, d4: 0.6, d3: 0.3, d2: 0.5, d1: 0.3, perc: 0, click: 0.1, vib: 0.2, drive: 0, att: 0.2, rel: 0.4 }],
                ['安い店 // CHEAP CLUB', { d16: 0.8, d8: 0.8, d4: 0, d3: 0, d2: 0, d1: 0, perc: 0.7, percH: k(1, 2), click: 0.6, vib: 0.5, drive: 0.5 }],
                ['取り憑かれた // HAUNTED', { d16: 1, d8: 0.3, d4: 0.6, d3: 0.6, d2: 0.2, d1: 0.5, vib: 0.8, drive: 0.25, att: 0.4, rel: 0.7, oct: O(-1) }],
                ['口笛 // WHISTLE', { d16: 0, d8: 0, d4: 0.8, d3: 0, d2: 0.4, d1: 0, perc: 0.3, vib: 0.4 }]],
            pick: [['ギター // NYLON', { model: k(1, 13), bright: 0.45, decay: 0.5, pos: k(1, 3), hard: k(0, 3), body: 0.45 }],
                ['シタール // SITAR', { model: k(6, 13), bright: 0.8, decay: 0.7, buzz: 0.6, hard: k(2, 3) }],
                ['ダルシマー // DULCIMER', { model: k(11, 13), bright: 0.7, decay: 0.6, dbl: k(1, 3) }],
                ['かき鳴らし // STRUM', { model: k(2, 13), strum: 0.6, bright: 0.6, decay: 0.5, hard: k(2, 3), width: 0.8 }],
                ['しずく // DROP', { model: k(4, 13), bright: 0.3, decay: 0.25, damp: 0.6, bendin: 0.4, oct: O(1) }],
                ['チェンバロ // HARPSICHORD', { model: k(12, 13), bright: 0.7, decay: 0.55, hard: k(2, 3), body: 0.5 }],
                ['琴 // KOTO', { model: k(3, 13), bright: 0.6, decay: 0.6, hard: k(1, 3), bendin: 0.2 }],
                ['オルゴール // MUSIC BOX', { model: k(10, 13), bright: 0.6, decay: 0.5 }]],
            swarm: [['恍惚の群れ // ENTRANCED LEAD', { voices: k(8, 9), det: 0.5, side: 0.8, cut: 0.7, env: 0.3, att: 0.02, sus: 0.85, rel: 0.3 }],
                ['硬い群れ // HARDBITE SCREECH', { voices: k(6, 9), det: 0.8, side: 0.9, cut: 0.85, res: 0.4, env: 0.6, dec: 0.3, rise: 0.25 }],
                ['朝靄 // MORNING HAZE', { voices: k(8, 9), det: 0.3, cut: 0.35, att: 0.6, sus: 1, rel: 0.7 }],
                ['重い群れ // HEAVY', { voices: k(8, 9), det: 0.6, sub: 0.7, cut: 0.5, oct: O(-1) }],
                ['硝子の群れ // GLASS SWARM', { voices: k(8, 9), det: 0.95, side: 1, cut: 0.9, att: 0.3, sus: 1, rel: 0.5, oct: O(1) }]],
            rise: [['上り // UP', { kind: k(0, 5), tone: 0.7, amt: 0.7, mix: 0.3 }],
                ['落ちる // DOWN', { kind: k(1, 5), tone: 0.5, amt: 0.6, mix: 0.4 }],
                ['一撃 // HIT', { kind: k(2, 5), tone: 0.4, dirt: 0.5 }],
                ['逆さ // BACKWARDS', { kind: k(4, 5), tone: 0.6, width: 0.9 }]],
            groan: [['双子 // TWINS', { mode: k(0, 3), det: 0.6, cut: 0.4, drive: 0.4, sub: 0.6 }],
                ['金属のうなり // METAL GROWL', { mode: k(1, 3), fm: 0.6, cut: 0.5, res: 0.4, drive: 0.6 }],
                ['揺れ // WOBBLE 1/8', { mode: k(2, 3), rate: k(2, 5), move: 0.7, cut: 0.35, res: 0.5, drive: 0.5 }],
                ['硬いうなり // HARDBITE REESE', { mode: k(0, 3), det: 0.85, cut: 0.6, res: 0.3, drive: 0.85, sub: 0.4 }]],
            breath: [['ため息 // SIGH', { kind: k(0, 3), air: 0.7, fall: 0.5 }],
                ['あー // AAH', { kind: k(1, 3), vowel: k(1, 4), air: 0.4, scoop: k(3, 8), shake: 0.4 }],
                ['ハミング // HUM', { kind: k(2, 3), vowel: k(2, 4), air: 0.2 }],
                ['息切れ // OUT OF BREATH', { kind: k(1, 3), heat: 0.85, air: 0.6, shake: 0.5, fall: 0.5 }]],
            lash: [['平手 // SLAP', { kind: k(0, 6), snap: 0.6, flesh: 0.6, room: 0.3 }],
                ['鞭 // WHIP', { kind: k(2, 6), snap: 0.8, room: 0.5 }],
                ['かかと // HEEL', { kind: k(4, 6), tone: 0.5, room: 0.6 }],
                ['舌打ち // SMACK', { kind: k(5, 6), snap: 0.3, room: 0.2 }]],
            wail: [['死者の合唱 // CHOIR OF THE DEAD', { voices: k(6, 7), vowel: k(0, 3), drift: 0.5, air: 0.4, att: 0.6, rel: 0.7 }],
                ['沈む // SINKING', { voices: k(4, 7), vowel: k(1, 3), sink: 0.6, drift: 0.6, att: 0.4 }],
                ['不協和 // WRONG', { voices: k(5, 7), cluster: k(3, 4), drift: 0.7, air: 0.5 }],
                ['逆さの声 // VOICES BACKWARDS', { voices: k(4, 7), rev: k(1, 2), air: 0.3 }]],
            bones: [['カチカチ // CLACK', { kind: k(0, 5), tone: 0.5, decay: 0.3 }],
                ['鎖 // CHAIN', { kind: k(2, 5), decay: 0.6, far: 0.3 }],
                ['壁の向こう // BEHIND THE WALL', { kind: k(3, 5), far: 0.8, dirt: 0.3 }],
                ['爪 // NAIL', { kind: k(4, 5), tone: 0.7, decay: 0.5 }]],
            gloop: [['ぷるん // PLOP', { plop: 0.8, wet: 0.5, cut: 0.45, dec: 0.4 }],
                ['沼 // SWAMP', { plop: 0.3, wet: 0.8, gurgle: 0.7, thick: 0.7, cut: 0.3, subl: 0.5 }],
                ['伸びる // STRETCHY', { stretch: 0.6, wet: 0.5, thick: 0.5, dec: 0.6 }]],
            uta: [['囁き // WHISPER', { voice: k(2, 3), tens: 0.2, breath: 0.7, vib: 0.15, cons: 0.7, att: 0.25, rel: 0.4 }],
                ['真っ直ぐ // STRAIGHT TONE', { tens: 0.5, breath: 0.1, vib: 0.05, scoop: 0.1 }],
                ['歌姫 // DIVA', { voice: k(2, 3), tens: 0.85, breath: 0.1, vib: 0.6, vrate: k(2, 5), vdel: 0.3, scoop: 0.4 }],
                ['低い声 // LOW VOICE', { voice: k(0, 3), tens: 0.4, breath: 0.3, vib: 0.3, oct: O(-1) }],
                ['合唱 // CHORUS OF HER', { stack: k(3, 4), tens: 0.5, breath: 0.25, vib: 0.4 }],
                ['唸り声 // GROWL', { voice: k(0, 3), tens: 0.8, growl: 0.6, breath: 0.2 }],
                ['明るい // BRIGHT POP', { voice: 0.95, light: 0.85, tens: 0.55, breath: 0.2, vib: 0.2, scoop: 0.35 }],
                ['暗いアルト // DARK ALTO', { voice: 0.7, light: 0.15, tens: 0.45, breath: 0.3, vib: 0.4, oct: O(-1) }],
                ['かすれ // HUSKY', { voice: 0.75, light: 0.35, breath: 0.6, growl: 0.12, tens: 0.4 }],
                ['鼻声 // NASAL', { voice: 0.85, light: 0.6, nasal: 0.7, tens: 0.5 }],
                ['中性 // BETWEEN', { voice: 0.5, light: 0.5, breath: 0.3, tens: 0.45 }],
                ['バリトン // BARITONE', { voice: 0.05, light: 0.3, tens: 0.6, breath: 0.12, vib: 0.4, oct: O(-1) }],
                ['人間 // HUMAN', { voice: 1, light: 0.55, breath: 0.3, tens: 0.5, vib: 0.35, scoop: 0.35 }],
                ['人間 (中) // HUMAN BETWEEN', { voice: 0.5, light: 0.5, breath: 0.25, tens: 0.5, vib: 0.3, scoop: 0.3 }],
                ['人間 (男) // HUMAN MASC', { voice: 0, light: 0.45, breath: 0.2, tens: 0.55, vib: 0.3, scoop: 0.3, oct: O(-1) }],
                ['泡 // BUBBLY', { voice: 1, light: 0.9, tens: 0.55, breath: 0.15, vib: 0.25, vrate: 0.85, vdel: 0.1, scoop: 0.5, att: 0.05, rel: 0.15 }],
                ['闇 // DARK', { voice: 0.7, light: 0.05, tens: 0.45, breath: 0.25, vib: 0.3, vrate: 0.3 }],
                ['憂鬱 // MOODY', { voice: 0.8, light: 0.25, breath: 0.55, tens: 0.3, vib: 0.25, vrate: 0.25, vdel: 0.6, scoop: 0.45, rel: 0.6 }],
                ['人造 // ANDROID', { voice: 0.85, light: 0.6, robo: 0.5, breath: 0.1, vib: 0.1 }],
                ['機械 // ROBOT', { voice: 0.6, light: 0.55, robo: 1, breath: 0, vib: 0, scoop: 0 }],
                ['鉄 // IRON', { voice: 0.6, light: 0.4, metal: 0.7, growl: 0.35, tens: 0.85, breath: 0.1 }],
                ['錆びた機械 // RUSTED MACHINE', { voice: 0.3, light: 0.3, robo: 0.8, metal: 0.5, growl: 0.2 }],
                ['叫び // BELT SHOUT', { voice: 0.85, light: 0.7, scream: 0.35, skind: k(1, 10), tens: 1, breath: 0.05, vib: 0.25, vdel: 0.5, scoop: 0.6 }],
                ['嗄れ // RASP', { voice: 0.75, light: 0.55, scream: 0.55, skind: k(0, 10), tens: 0.8, breath: 0.15, vib: 0.1 }],
                ['絶叫 // SCREAM', { voice: 0.75, light: 0.6, scream: 0.8, skind: k(3, 10), tens: 0.9, breath: 0.1, vib: 0 }],
                ['裂けた喉 // FRY SCREAM', { voice: 0.75, light: 0.85, scream: 1, skind: k(2, 10), tens: 1, breath: 0.1, vib: 0 }],
                ['偽声帯 // FALSE CORD', { voice: 0.4, light: 0.35, scream: 0.9, skind: k(3, 10), tens: 0.9, breath: 0.1, vib: 0 }],
                ['奈落の声 // GUTTURAL', { voice: 0.05, light: 0.05, scream: 1, skind: k(3, 10), growl: 0.3, tens: 0.8, vib: 0, oct: O(-1) }],
                ['金切り声 // SHRIEK', { voice: 0.95, light: 0.8, scream: 0.85, skind: k(4, 10), tens: 1, breath: 0.1, vib: 0, scoop: 0.7 }],
                ['怨霊 // WRAITH', { voice: 0.55, light: 0.6, scream: 0.9, skind: k(5, 10), tens: 0.7, breath: 0.3, vib: 0 }],
                ['豚の悲鳴 // SQUEAL', { voice: 0.6, light: 0.75, nasal: 0.45, scream: 0.75, skind: k(6, 10), tens: 1, breath: 0.1, vib: 0 }],
                ['泥の喉 // GURGLE', { voice: 0.0, light: 0.0, scream: 1, skind: k(7, 10), tens: 0.85, breath: 0.15, vib: 0, oct: O(-1) }],
                ['泣き崩れ // CRY', { voice: 0.9, light: 0.55, scream: 0.55, skind: k(8, 10), tens: 0.55, breath: 0.3, vib: 0.15, scoop: 0.45 }],
                ['遠吠え // HOWL', { voice: 0.75, light: 0.35, scream: 0.8, skind: k(9, 10), tens: 0.75, breath: 0.2, vib: 0.35, vdel: 0.35 }],
                ['ささやく叫び // WHISPER SCREAM', { voice: 0.85, light: 0.65, scream: 0.6, skind: k(5, 10), breath: 0.55, tens: 0.6, vib: 0 }],
                ['喉を裂く // TEAR IT', { voice: 0.6, light: 0.5, scream: 1, skind: k(3, 10), growl: 0.35, tens: 1, breath: 0.05, vib: 0 }],
                ['話し声 // SPOKEN', { voice: 0.85, light: 0.5, speak: 1, breath: 0.35, tens: 0.35, vib: 0, cons: 0.7 }],
                ['静か // CALM', { voice: 0.85, light: 0.4, speak: 0.8, breath: 0.5, tens: 0.25, att: 0.2, rel: 0.5 }],
                ['息だけ // ONLY BREATH', { voice: 0.85, light: 0.55, speak: 0.7, breath: 1, tens: 0.2, cons: 0.8 }]]
        };
        Object.keys(MORE).forEach(id => { if (V[id]) V[id].presets = (V[id].presets || []).concat(MORE[id]); });
    }
    // the drum kit. one drawer = one drum
    const KIT0 = [['stomp', 'KICK', { model: 7.5 / 9, tune: 0.55, pitch: 0.5, ptime: 0.25, decay: 0.35, click: 0.55, ctone: 0.6, drive: 0.25 }], ['slap', 'SNARE', { model: 9.5 / 12, tone: 0.4, body: 0.55, noise: 0.7, snap: 0.35, color: 0.6, decay: 0.3 }], ['slap', 'CLAP', { model: 10.5 / 12, noise: 0.75, color: 0.5, spread: 0.4, snap: 0.35, body: 0 }], ['tick', 'SHUT', { model: 7.5 / 10, metal: 0, bright: 0.6, cdec: 0.25 }], ['tick', 'OPEN', { model: 7.5 / 10, metal: 0, bright: 0.6, odec: 0.45 }, 1], ['chime', 'RIM', { pitch: 0.72, decay: 0.06, index: 0.2 }], ['stomp', 'TOM', { model: 8.5 / 9, tune: 0.85, pitch: 0.3, decay: 0.35, click: 0.4, ctone: 0.3 }], ['chime', 'BELL', { pitch: 0.55, ratio: 0.6, decay: 0.55 }],
        ['stomp', 'BOOM', { model: 1.5 / 9, decay: 0.55 }], ['slap', 'RIMSHOT', { model: 5.5 / 12 }], ['tick', 'SHAKER', { model: 0.35 }], ['tick', 'TAMB', { model: 0.45 }], ['chime', 'COWBELL', { model: 10.5 / 15, pitch: 0.5, decay: 0.35 }], ['chime', 'BLOCK', { model: 3.5 / 15, pitch: 0.6 }], ['steel', 'CRASH', {}], ['slap', 'SNAP', { model: 6.5 / 12 }]];
    const KITROOT = 36, DRAWERS = 16;
    const SCALES = {
        minor: { jp: 'マイナー', s: [0, 2, 3, 5, 7, 8, 10] }, phrygian: { jp: 'フリジア', s: [0, 1, 3, 5, 7, 8, 10] }, harmonic: { jp: '和声', s: [0, 2, 3, 5, 7, 8, 11] },
        dorian: { jp: 'ドリア', s: [0, 2, 3, 5, 7, 9, 10] }, locrian: { jp: 'ロクリア', s: [0, 1, 3, 5, 6, 8, 10] }, hungarian: { jp: '呪旋', en: 'hex', s: [0, 2, 3, 6, 7, 8, 11] },
        pentam: { jp: '五音', s: [0, 3, 5, 7, 10] }, insen: { jp: '陰旋', s: [0, 1, 5, 7, 10] }, hirajoshi: { jp: '平調子', s: [0, 2, 3, 7, 8] }, byzantine: { jp: '二重和声', en: 'double harmonic', s: [0, 1, 4, 5, 7, 8, 11] },
        whole: { jp: '全音', s: [0, 2, 4, 6, 8, 10] }, dim: { jp: '減', s: [0, 1, 3, 4, 6, 7, 9, 10] }, blues: { jp: '青痣', en: 'bruise', s: [0, 3, 5, 6, 7, 10] }, chroma: { jp: '全部', s: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }
    };
    const has = () => true;
    const fxOK = P => P && P.on && NBFX.BY[P.type] && has(NBFX.BY[P.type].part);

    let un = 0;
    const uid = p => (p || 'x') + Date.now().toString(36).slice(-5) + (un++).toString(36);
    const COLS = ['#ff2a6d', '#ff8a3d', '#ffd23f', '#5cff9d', '#3df2ff', '#6d7bff', '#c45cff', '#ff5ce1', '#e8e2d0', '#9b1d2a'];
    function blankProject() {
        return { v: 3, name: 'untitled', bpm: 120, sig: 4, swing: 0, groove: 'none', root: 9, scale: 'minor', snap: 1, grid: 0.25, loop: { on: 1, a: 0, b: 16 },
            tracks: [], master: { vol: 0.8, fx: [], auto: [] }, sends: { roomSize: 0.5, roomDark: 0.4, echoTime: 0.4, echoFb: 0.4, echoTone: 0.5 }, tempo: [], sigs: [], marks: [] };
    }
    function kit() { return KIT0.map(([voice, name, over, o]) => ({ voice, name, snd: Object.assign({}, V[voice].def, over), vol: 0.8, pan: 0.5, tune: 0.5, o: o || 0 })); }
    function newTrack(pr, inst) {
        let v = V[inst], n = pr.tracks.filter(t => t.inst === inst).length;
        let nm = inst === 'cell' ? 'CELL ' + 'ABCDEFGHJKLMNPQRSTUVWXYZ'.charAt(n % 24) + (n >= 24 ? n : '') : v.en + (n ? ' ' + (n + 1) : '');
        return { uid: uid('t'), name: nm, inst, col: COLS[pr.tracks.length % COLS.length], swing: -1, groove: '', human: v.kind === 'drum' || v.kind === 'kit' ? 0.25 : v.kind === 'bus' ? 0 : 0.15,
            snd: inst === 'coffin' ? { drawers: kit() } : Object.assign({}, v.def),
            mix: { vol: v.kind === 'bus' ? Math.pow(0.8, 1 / 1.6) : 0.75, pan: 0.5, mute: 0, solo: 0, room: v.kind === 'poly' ? 0.25 : v.kind === 'audio' || v.kind === 'bus' ? 0 : 0.05, echo: 0, duck: 0, key: inst === 'stomp' || inst === 'coffin' ? 1 : 0, lc: 0, hc: 1, out: '', to: {}, pre: {} },
            fx: [], clips: [], auto: [] };
    }
    function newClip(at, len) { return { uid: uid('c'), at, len, off: 0, lp: len, name: '', notes: [] }; }
    function newFx(type) { let P = NBFX.fresh(type); P.uid = uid('f'); return P; }
    function touch(pr) { pr._v = (pr._v || 0) + 1; }
    function songEnd(pr) { let e = 0; pr.tracks.forEach(t => t.clips.forEach(c => { e = Math.max(e, c.at + c.len); })); return Math.max(4, e); }

    function migrate(o) {
        let pr = blankProject();
        ['name', 'bpm', 'swing', 'root', 'scale'].forEach(k => { if (o[k] !== undefined) pr[k] = o[k]; });
        if (o.fx) { ['roomSize', 'roomDark', 'echoTime', 'echoFb', 'echoTone'].forEach(k => { if (o.fx[k] !== undefined) pr.sends[k] = o.fx[k]; }); }
        let seq = [];
        if (o.mode === 'song' && o.song && o.song.length) o.song.forEach(r => { for (let i = 0; i < Math.max(1, r.n || 1); i++) seq.push({ p: r.p, tr: r.tr || 0, mute: r.mute || {} }); });
        else if (o.mode === 'chain' && o.chain && o.chain.length) o.chain.forEach(p => seq.push({ p }));
        else seq.push({ p: o.cur || 0 });
        let tracks = {};
        VOICES.forEach(v => {
            if (v.kind === 'kit') return;
            let at = 0;
            seq.forEach(sl => {
                let pt = (o.pats || [])[sl.p]; if (!pt) return;
                let beats = (pt.bars || 1) * 4, tr = pt.tr && pt.tr[v.id];
                if (tr && !(sl.mute && sl.mute[v.id]) && tr.steps && tr.steps.some(s => s && s.on)) {
                    let T = tracks[v.id];
                    if (!T) { T = tracks[v.id] = newTrack(pr, v.id); let ot = o.tracks && o.tracks[v.id]; if (ot) { Object.assign(T.snd, ot.snd || {}); ['vol', 'pan', 'mute', 'room', 'echo', 'duck'].forEach(k => { if (ot.mix && ot.mix[k] !== undefined) T.mix[k] = ot.mix[k]; }); } }
                    let c = newClip(at, beats), res = tr.res || 4, len = Math.max(1, tr.len || 16), mel = v.kind !== 'drum' || v.melodic;
                    for (let i = 0; i < Math.ceil(beats * res); i++) {
                        let st = tr.steps[i % len]; if (!st || !st.on) continue;
                        let t = (i + (st.n || 0)) / res, base = { t: Math.max(0, t), d: mel ? Math.max(0.25, st.len || 1) / res : 1 / res, v: st.v != null ? st.v : 0.8 };
                        ['p', 'r', 'sl', 'ac', 'o'].forEach(k => { if (st[k]) base[k] = st[k]; }); if (st.L) base.L = st.L;
                        let ns = mel ? (st.notes && st.notes.length ? st.notes : [60]).map(m => m + (sl.tr || 0)) : [60 + (st.t || 0)];
                        ns.forEach(m => c.notes.push(Object.assign({}, base, { m })));
                    }
                    if (c.notes.length) T.clips.push(c);
                }
                at += beats;
            });
        });
        pr.tracks = VOICES.map(v => tracks[v.id]).filter(Boolean);
        pr.tracks.forEach((t, i) => { t.col = COLS[i % COLS.length]; });
        pr.loop = { on: 1, a: 0, b: Math.min(songEnd(pr), 16) };
        return pr;
    }
    function heal(pr) {
        if (pr && pr.v === 2) return migrate(pr);
        let b = blankProject();
        if (!pr || pr.v !== 3) return b;
        ['name', 'bpm', 'sig', 'swing', 'groove', 'root', 'scale', 'snap', 'grid', 'loop'].forEach(k => { if (pr[k] === undefined) pr[k] = b[k]; });
        const num = v => typeof v === 'number' && isFinite(v);
        pr.tempo = (Array.isArray(pr.tempo) ? pr.tempo : []).filter(q => q && num(q.b) && q.b > 0 && num(q.bpm)).map(q => ({ b: Math.round(q.b * 1000) / 1000, bpm: Math.max(20, Math.min(300, q.bpm)), r: q.r ? 1 : 0 })).sort((x, y) => x.b - y.b).filter((q, i, a) => !i || q.b > a[i - 1].b + 1e-6);
        pr.sigs = (Array.isArray(pr.sigs) ? pr.sigs : []).filter(q => q && num(q.bar) && q.bar >= 1 && num(q.n)).map(q => ({ bar: Math.round(q.bar), n: Math.max(1, Math.min(16, Math.round(q.n))) })).sort((x, y) => x.bar - y.bar).filter((q, i, a) => !i || q.bar > a[i - 1].bar);
        pr.marks = (Array.isArray(pr.marks) ? pr.marks : []).filter(q => q && num(q.b) && q.b >= 0).map(q => ({ uid: q.uid || uid('m'), b: Math.round(q.b * 1000) / 1000, name: String(q.name || 'here').slice(0, 24) })).sort((x, y) => x.b - y.b);
        pr.master = Object.assign(b.master, pr.master || {}); pr.master.fx = pr.master.fx || []; pr.master.auto = pr.master.auto || [];
        pr.sends = Object.assign(b.sends, pr.sends || {});
        pr.tracks = (pr.tracks || []).filter(t => t && V[t.inst]);
        if (window.NBA) NBA.need(pr);
        const n16 = a => Array.isArray(a) && a.length === 16 && a.every(x => typeof x === 'number' && isFinite(x));
        pr.grooves = (Array.isArray(pr.grooves) ? pr.grooves : []).filter(g => g && typeof g.id === 'string' && n16(g.t) && n16(g.v)).map(g => ({ id: g.id, en: String(g.en || 'taken').slice(0, 24), jp: '盗', t: g.t.map(x => Math.max(-0.5, Math.min(0.5, x))), v: g.v.map(x => Math.max(0.1, Math.min(1.5, x))) }));
        if (pr.groove && !grooveOf(pr, pr.groove)) pr.groove = 'none';
        pr.qz = Object.assign({ s: 1, sw: 0, g: '', gv: 0 }, pr.qz || {}); pr.rq = Object.assign({ ci: 0, punch: 0, takes: 1 }, pr.rq || {});
        pr.tracks.forEach(t => { if (t.fz && !pr.tracks.some(q => q.uid === t.fz && q.ice === t.uid)) delete t.fz; if (t.ice && !pr.tracks.some(q => q.uid === t.ice && q.fz === t.uid)) delete t.ice; }); if (pr.qz.g && !grooveOf(pr, pr.qz.g)) pr.qz.g = '';
        pr.tracks.forEach(t => {
            let d = newTrack(pr, t.inst);
            t.uid = t.uid || d.uid; t.name = t.name || d.name; t.col = t.col || d.col; if (t.swing === undefined) t.swing = -1; if (!grooveOf(pr, t.groove)) t.groove = ''; if (!(t.pbr >= 1 && t.pbr <= 24)) t.pbr = 2; if (!isFinite(t.human)) t.human = 0;
            t.mix = Object.assign(d.mix, t.mix || {}); t.fx = (t.fx || []).filter(P => NBFX.BY[P.type]); t.fx.forEach(P => { P.uid = P.uid || uid('f'); P.p = Object.assign({}, NBFX.BY[P.type].def, NBFX.BY[P.type].extra ? NBFX.BY[P.type].extra() : {}, NBFX.BY[P.type].fix ? NBFX.BY[P.type].fix(Object.assign({ _v: 1 }, P.p || {})) : P.p || {}); });
            if (t.inst === 'coffin') { t.snd = t.snd && t.snd.drawers ? t.snd : d.snd; if (t.snd.drawers.length < DRAWERS) t.snd.drawers = t.snd.drawers.concat(kit().slice(t.snd.drawers.length)); t.snd.drawers.forEach((dr, i) => { if (!V[dr.voice]) dr.voice = 'stomp'; let w = V[dr.voice]; if (w.grow && (!dr.snd || (dr.snd._v || 0) < 2)) growL(w, (t.clips || []).flatMap(c => (c && c.notes || []).filter(n => n.m - KITROOT === i).map(n => n.L))); dr.snd = Object.assign({}, w.def, w.fix ? w.fix(dr.snd || {}) : dr.snd || {}); }); }
            else { if (V[t.inst].grow && t.snd && (t.snd._v || 0) < 2) growL(V[t.inst], (t.clips || []).flatMap(c => (c && c.notes || []).map(n => n.L))); t.snd = Object.assign({}, V[t.inst].def, cxFix(V[t.inst].fix ? V[t.inst].fix(t.snd || { _v: V[t.inst].ver || 4 }) : (t.snd || { _cx: 2 }))); }
            t.clips = (t.clips || []).filter(c => c && c.len > 0); t.clips.forEach(c => { c.uid = c.uid || uid('c'); c.off = c.off || 0; if (c.lp === undefined) c.lp = c.len; c.notes = c.notes || [];
                if (c.wm) { let M = Array.isArray(c.wm) ? c.wm.filter(q => Array.isArray(q) && isFinite(q[0]) && isFinite(q[1]) && q[0] > 0 && q[1] > 0).sort((a, b2) => a[0] - b2[0]) : []; c.wm = M.filter((q, i) => !i || q[1] > M[i - 1][1] + 1e-6); if (!c.wm.length) delete c.wm; }
                if (c.takes) { c.takes = Array.isArray(c.takes) ? c.takes.filter(x => typeof x === 'string') : []; if (c.src && c.takes.indexOf(c.src) < 0) c.takes.push(c.src); if (c.takes.length < 2) delete c.takes; }
                ['pb', 'mw'].forEach(k => { if (!Array.isArray(c[k])) { delete c[k]; return; } c[k] = c[k].filter(q => Array.isArray(q) && isFinite(q[0]) && isFinite(q[1]) && q[0] >= 0).map(q => [q[0], Math.max(k === 'pb' ? -1 : 0, Math.min(1, q[1]))]).sort((a, b2) => a[0] - b2[0]); if (!c[k].length) delete c[k]; }); });
            t.auto = t.auto || [];
        });
        pr.tracks.forEach(t => {
            let m = t.mix; if (typeof m.out !== 'string') m.out = ''; if (!m.to || typeof m.to !== 'object') m.to = {}; if (!m.pre || typeof m.pre !== 'object') m.pre = {};
            if (m.out && !outOf(pr, t)) m.out = '';
            Object.keys(m.to).forEach(u => { if (!isFinite(m.to[u]) || !pr.tracks.some(q => q.uid === u && q.inst === 'cell')) { delete m.to[u]; delete m.pre[u]; } });
        });
        pr.tracks.forEach(t => {
            let m = t.mix, o = m.out; if (o) { m.out = ''; if (canFeed(pr, t.uid, o)) m.out = o; }
            Object.keys(m.to).forEach(u => { let a = m.to[u]; delete m.to[u]; if (canFeed(pr, t.uid, u)) m.to[u] = a; else delete m.pre[u]; });
        });
        // two plugins ended up sharing a brain. this stops that
        let seenF = new Set(); pr.tracks.concat([pr.master]).forEach(o => (o.fx || []).forEach(P => { if (P.uid && seenF.has(P.uid)) P.uid = uid('f'); if (P.uid) seenF.add(P.uid); }));
        pr.master.fx.forEach(P => { P.uid = P.uid || uid('f'); P.p = Object.assign({}, NBFX.BY[P.type].def, NBFX.BY[P.type].extra ? NBFX.BY[P.type].extra() : {}, NBFX.BY[P.type].fix ? NBFX.BY[P.type].fix(Object.assign({ _v: 1 }, P.p || {})) : P.p || {}); });
        return pr;
    }

    const scaleName = k => (SCALES[k] && SCALES[k].en) || k;
    function inScale(pr, m) { let sc = (SCALES[pr.scale] || SCALES.minor).s; return sc.indexOf(((m - pr.root) % 12 + 12) % 12) >= 0; }
    const octOf = v => Math.round(v * 4) - 2;
    const MAW = (() => {
        const PK = new Map(), CU = new Map(), NN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const mono = e => { if (e._mono) return e._mono; let d = e.ch[0]; if (e.ch[1]) { d = new Float32Array(e.n); for (let i = 0; i < e.n; i++) d[i] = (e.ch[0][i] + e.ch[1][i]) * 0.5; } e._mono = d; return d; };
        function peaks(e, n) { let k = e.id + ':' + n, p = PK.get(k); if (p) return p; let d = mono(e), out = new Float32Array(n), step = d.length / n, mx = 1e-9;
            for (let i = 0; i < n; i++) { let a = 0, s0 = Math.floor(i * step), s1 = Math.min(d.length, Math.floor((i + 1) * step)); for (let j = s0; j < s1; j++) { let q = d[j] < 0 ? -d[j] : d[j]; if (q > a) a = q; } out[i] = a; if (a > mx) mx = a; }
            for (let i = 0; i < n; i++) out[i] /= mx; PK.set(k, out); return out; }
        const NS = [2, 4, 8, 12, 16, 24, 32, 64];
        function cuts(e, st, en, sv, bv) { const n = NS[Math.min(7, Math.floor((sv == null ? 0.6 : sv) * 8))], hits = (bv == null ? 0.75 : bv) >= 0.5, k = [e.id, st.toFixed(4), en.toFixed(4), n, hits].join(':'); let c = CU.get(k); if (c) return c;
            if (!hits) { c = []; for (let i = 0; i < n; i++) c.push(st + (en - st) * i / n); CU.set(k, c); return c; }
            const d = mono(e), sr = e.sr, a = Math.floor(st * d.length), b = Math.floor(en * d.length), W = 256, gap = Math.round(sr * 0.045 / W), E = [];
            for (let i = a; i + W <= b; i += W) { let s = 0; for (let j = Math.max(1, i); j < i + W; j++) { const df = d[j] - d[j - 1]; s += df * df; } E.push(Math.log10(s / W + 1e-12)); }
            let F = E.map((q, i) => i ? Math.max(0, q - Math.max(E[i - 1], i > 1 ? E[i - 2] : -12)) : q + 12), cand = F.map((q, i) => [q, i]).filter(p => p[0] > 0.5).sort((p, q) => q[0] - p[0]);
            const early = cand.filter(p => p[1] * W < sr * 0.06).sort((p, q) => p[1] - q[1])[0], pick = [early ? early[1] : 0];
            for (const [q, i] of cand) { if (pick.length >= n) break; if (pick.every(j => Math.abs(j - i) >= gap)) pick.push(i); }
            pick.sort((p, q) => p - q); c = pick.map(i => st + (i * W) / d.length); CU.set(k, c); return c; }
        const noteName = f => { let m = Math.round(69 + 12 * Math.log2(f / 440)); return NN[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1); };
        return { peaks, cuts, noteName, NS };
    })();
    const CHR = { RAT: [0.5, 0.71, 1, 1.41, 1.5, 2, 2.5, 3, 3.14, 3.5, 4, 4.24, 5, 5.19, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], CAR: [[1], [1], [1], [1], [1, 3], [1, 2, 3], [1, 2, 3], [1, 2, 3, 4]], MOD: [[[1], [2], [3], []], [[1], [2, 3], [], []], [[1, 3], [2], [], []], [[1, 2], [], [3], []], [[1], [], [3], []], [[3], [3], [3], []], [[], [], [3], []], [[], [], [], []]] };

    let RS = 1;
    const noteSeed = (u, smp, m, v) => { let h = 2166136261; const mix = x => { h ^= x; h = Math.imul(h, 16777619); }; for (let i = 0; i < u.length; i++) mix(u.charCodeAt(i)); mix(smp | 0); mix(Math.round((m || 0) * 100)); mix(Math.round((v || 0) * 1000)); return 1 + ((h >>> 0) % 2147483645); };
    const rr = () => (RS = RS * 16807 % 2147483647) / 2147483647;
    function curve(k, n) { n = n || 2048; let c = new Float32Array(n), d = Math.tanh(k); for (let i = 0; i < n; i++) { let x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(x * k) / d; } return c; }
    function roomIR(ctx, size, dark, len) {
        len = len || (1.2 + size * 5.5);
        let n = Math.floor(ctx.sampleRate * len), b = ctx.createBuffer(2, n, ctx.sampleRate);
        for (let c = 0; c < 2; c++) {
            let d = b.getChannelData(c), lp = 0, k = 0.92 - dark * 0.6;
            for (let e = 0; e < 9; e++) { let at = Math.floor(ctx.sampleRate * (0.004 + rr() * 0.05 * (0.4 + size))); if (at < n) d[at] += (rr() - 0.5) * 0.6; }
            for (let i = 0; i < n; i++) { let t = i / n; lp += ((rr() * 2 - 1) - lp) * (k - t * k * 0.6); d[i] += lp * Math.pow(1 - t, 2.2 + (1 - size) * 2); }
        }
        return b;
    }

    function softClip(straight) {
        let n = 4096, c = new Float32Array(n);
        for (let i = 0; i < n; i++) { let u = (i / (n - 1) * 2 - 1) * 2, a = Math.abs(u); c[i] = straight ? u : Math.sign(u) * (a < 0.88 ? a : 0.88 + 0.085 * Math.tanh((a - 0.88) / 0.085)); }
        return c;
    }
    function valAt(pts, b) {
        if (!pts || !pts.length) return null;
        if (b <= pts[0][0]) return pts[0][1];
        for (let i = 1; i < pts.length; i++) if (b < pts[i][0]) { let a = pts[i - 1], c = pts[i]; return lerp(a[1], c[1], (b - a[0]) / Math.max(1e-6, c[0] - a[0])); }
        return pts[pts.length - 1][1];
    }
    const MIXMAP = {
        vol: v => Math.pow(v, 1.6) * 1.25, pan: v => (v - 0.5) * 2, room: v => v, echo: v => v * 0.8,
        lc: v => expo(10, 2000, v), hc: v => expo(200, 22000, v)
    };

    const TMC = new WeakMap();
    function tmap(pr) {
        let key = pr.bpm + '|' + JSON.stringify(pr.tempo || []) + '|' + (pr.sig || 4) + '|' + JSON.stringify(pr.sigs || []), M = TMC.get(pr);
        if (M && M.key === key) return M;
        let P = [{ b: 0, bpm: pr.bpm || 120 }].concat((pr.tempo || []).filter(q => q.b > 0)), S = [], s0 = 0;
        for (let i = 0; i < P.length; i++) {
            let A = P[i], B = P[i + 1], seg = { b0: A.b, b1: B ? B.b : Infinity, v0: A.bpm, v1: A.bpm, s0 };
            if (B && B.r && Math.abs(B.bpm - A.bpm) > 1e-9) seg.v1 = B.bpm;
            seg.k = isFinite(seg.b1) ? (seg.v1 - seg.v0) / (seg.b1 - seg.b0) : 0;
            if (B) s0 += segSec(seg, B.b);
            S.push(seg);
        }
        let G = [{ bar: 0, b: 0, n: pr.sig || 4 }];
        (pr.sigs || []).forEach(q => { let L = G[G.length - 1]; G.push({ bar: q.bar, b: L.b + (q.bar - L.bar) * L.n, n: q.n }); });
        M = { key, S, G }; TMC.set(pr, M); return M;
    }
    function segSec(g, b) { let d = b - g.b0; return Math.abs(g.k) < 1e-12 ? d * 60 / g.v0 : 60 / g.k * Math.log((g.v0 + g.k * d) / g.v0); }
    const segOf = (S, b) => { let lo = 0, hi = S.length - 1; while (lo < hi) { let m = (lo + hi + 1) >> 1; if (S[m].b0 <= b) lo = m; else hi = m - 1; } return S[lo]; };
    function secM(M, b) { let S = M.S, g = segOf(S, Math.max(0, b)); if (b < 0) return b * 60 / S[0].v0; return g.s0 + segSec(g, b); }
    function beatM(M, sec) {
        let S = M.S; if (sec <= 0) return sec * S[0].v0 / 60;
        let lo = 0, hi = S.length - 1; while (lo < hi) { let m = (lo + hi + 1) >> 1; if (S[m].s0 <= sec) lo = m; else hi = m - 1; }
        let g = S[lo], ds = sec - g.s0;
        return Math.abs(g.k) < 1e-12 ? g.b0 + ds * g.v0 / 60 : g.b0 + (g.v0 * Math.exp(g.k * ds / 60) - g.v0) / g.k;
    }
    const secAt = (pr, b) => secM(tmap(pr), b), beatAt = (pr, s) => beatM(tmap(pr), s);
    const steady = pr => { let M = tmap(pr); return M.S.length === 1 && M.G.length === 1; };
    function clock(pr, b0, t0) { if (steady(pr)) { let spb = 60 / pr.bpm; return x => t0 + (x - b0) * spb; } let M = tmap(pr), s0 = secM(M, b0); return x => t0 + secM(M, x) - s0; }
    function durAt(pr, b, db) { return steady(pr) ? db * 60 / pr.bpm : secAt(pr, b + db) - secAt(pr, b); }
    function turns(pr, b0, b1) {
        let M = tmap(pr), out = [];
        M.S.forEach((g, i) => { if (i && g.b0 >= b0 - 1e-9 && g.b0 < b1 - 1e-9) out.push(g.b0); if (Math.abs(g.k) > 1e-12) for (let k = Math.ceil(Math.max(b0, g.b0) + 1e-9); k < Math.min(b1, g.b1) - 1e-9; k++) out.push(k); });
        M.G.forEach((g, i) => { if (i && g.b >= b0 - 1e-9 && g.b < b1 - 1e-9) out.push(g.b); });
        return out.sort((x, y) => x - y).filter((x, i, a) => !i || x > a[i - 1] + 1e-6);
    }
    function tempoAt(pr, b) { let g = segOf(tmap(pr).S, Math.max(0, b)); return g.v0 + g.k * (Math.max(0, b) - g.b0); }
    function barOf(pr, b) { let G = tmap(pr).G, g = G[0]; for (let i = 1; i < G.length; i++) { if (G[i].b <= b + 1e-9) g = G[i]; else break; } let k = Math.floor((b - g.b) / g.n + 1e-9); return { bar: g.bar + k, at: g.b + k * g.n, n: g.n }; }
    function barAt(pr, bar) { let G = tmap(pr).G, g = G[0]; for (let i = 1; i < G.length; i++) { if (G[i].bar <= bar) g = G[i]; else break; } return g.b + (bar - g.bar) * g.n; }
    const sigAt = (pr, b) => barOf(pr, b).n;

    function lidNode(ctx) {
        if (ctx._nbwk) { try { let n = new AudioWorkletNode(ctx, 'nb-mlid', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2], channelCount: 2, channelCountMode: 'explicit', processorOptions: { th: -0.8, ratio: 20, att: 0.0015, rel: 0.06, la: 0.006 } }); n.lid = 1; return n; } catch (e) {} }
        let c = ctx.createDynamicsCompressor(); c.threshold.value = -0.8; c.ratio.value = 20; c.attack.value = 0.0015; c.release.value = 0.06; c.knee.value = 0; return c;
    }
    function Rig(ctx, pr, opt) {
        opt = opt || {};
        RS = opt.offline ? 48271 : 1 + Math.floor(Math.random() * 2147483645);
        this.ctx = ctx; this.pr = pr; this.opt = opt; this.kicks = []; this.ch = {}; this.inst = new Map(); this.playing = false;
        let g = v => { let n = ctx.createGain(); n.gain.value = v; return n; };
        this.g = g;
        let M = this.M = { bus: g(1), cin: g(1), cout: g(1), vol: g(0.8), safe: lidNode(ctx), out: g(1), sig: '' };
        M.pre = g(0.5); M.clip = ctx.createWaveShaper(); M.clip.curve = softClip(false); M.clip.oversample = '4x';
        M.bus.connect(M.cin); M.cin.connect(M.cout); M.cout.connect(M.vol); M.vol.connect(M.safe); M.safe.connect(M.pre); M.pre.connect(M.clip); M.clip.connect(M.out); M.out.connect(ctx.destination);
        if (!opt.offline) {
            M.an = ctx.createAnalyser(); M.an.fftSize = 2048; M.an.smoothingTimeConstant = 0.5; M.an.minDecibels = -95; M.an.maxDecibels = -12; M.out.connect(M.an);
            let sp = ctx.createChannelSplitter(2); M.out.connect(sp); M.anL = ctx.createAnalyser(); M.anR = ctx.createAnalyser(); M.anL.fftSize = M.anR.fftSize = 1024; sp.connect(M.anL, 0); sp.connect(M.anR, 1);
            M.bufL = new Float32Array(1024); M.bufR = new Float32Array(1024);
            this.click = g(0.25); this.click.connect(ctx.destination);
        }
        this.room = ctx.createConvolver(); this.roomIn = g(1); this.roomOut = g(1); this.roomIn.connect(this.room); this.room.connect(this.roomOut); this.roomOut.connect(M.bus);
        let E = this.E = { in: g(1), d1: ctx.createDelay(4), d2: ctx.createDelay(4), fb: g(0.4), lp: ctx.createBiquadFilter(), hp: ctx.createBiquadFilter(), out: g(1) };
        E.lp.type = 'lowpass'; E.hp.type = 'highpass'; E.hp.frequency.value = 180;
        let pl = ctx.createStereoPanner(), pr2 = ctx.createStereoPanner(); pl.pan.value = -0.75; pr2.pan.value = 0.75;
        E.in.connect(E.hp); E.hp.connect(E.d1); E.d1.connect(E.lp); E.lp.connect(pl); E.lp.connect(E.d2); E.d2.connect(pr2); if (NBFX.oneOut) NBFX.oneOut(ctx, [pl, pr2], E.out); else { pl.connect(E.out); pr2.connect(E.out); } E.d2.connect(E.fb); E.fb.connect(E.d1); E.out.connect(M.bus);
        let nb = this.nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = rr() * 2 - 1;
        this.irKey = ''; this.sync(); this.apply(true);
    }
    function link(c, slot, from, to) {
        let L = c._ln || (c._ln = {}), o = L[slot];
        if (o && o[0] === from && o[1] === to) return;
        if (o) { try { o[0].disconnect(o[1]); } catch (e) {} delete L[slot]; }
        if (from && to) { from.connect(to); L[slot] = [from, to]; }
    }
    Rig.prototype.mkch = function (tr) {
        let ctx = this.ctx, g = this.g, c = { in: g(1), cin: g(1), cout: g(1), hp: ctx.createBiquadFilter(), lp: ctx.createBiquadFilter(), pan: ctx.createStereoPanner(), fader: g(0.75), mute: g(1), duck: g(1), room: g(0), echo: g(0), mono: {}, chokes: {}, sig: null };
        c.hp.type = 'highpass'; c.lp.type = 'lowpass'; c.hp.frequency.value = 10; c.lp.frequency.value = 22000;
        c.in.channelCount = 2; c.in.channelCountMode = 'explicit'; c.in.channelInterpretation = 'speakers';
        c.cut = g(1); c.in.connect(c.cin); c.cin.connect(c.cout); link(c, 'c1', c.cout, c.hp); link(c, 'c2', c.hp, c.lp); link(c, 'c3', c.lp, c.cut); c.cut.connect(c.pan); c.pan.connect(c.fader); c.fader.connect(c.mute); c.mute.connect(c.duck);
        c.og = g(1); link(c, 'main', c.duck, c.og); link(c, 'out', c.og, this.M.bus);
        link(c, 'room', c.duck, c.room); c.room.connect(this.roomIn); link(c, 'echo', c.duck, c.echo); c.echo.connect(this.E.in);
        c.sends = {};
        if (!this.opt.offline) { c.an = ctx.createAnalyser(); c.an.fftSize = 256; c.duck.connect(c.an); c.buf = new Float32Array(256); }
        if (V[tr.inst].kind === 'bus') c.bus = 1;
        else if (tr.inst === 'coffin') c.dr = Array.from({ length: DRAWERS }, () => { let dg = g(0.8), dp = ctx.createStereoPanner(); dg.connect(dp); dp.connect(c.in); return { g: dg, p: dp }; });
        else {
            let o = c.vx = { in: g(1), sh: ctx.createWaveShaper(), ls: ctx.createBiquadFilter(), hs: ctx.createBiquadFilter(), out: g(1), k: -1 };
            o.ls.type = 'lowshelf'; o.ls.frequency.value = 320; o.hs.type = 'highshelf'; o.hs.frequency.value = 2800; o.sh.oversample = '2x';
            o.in.connect(o.sh); o.sh.connect(o.ls); o.ls.connect(o.hs); o.hs.connect(o.out); o.out.connect(c.in);
        }
        c.inst = tr.inst;
        return c;
    };
    let instN = 0;
    Rig.prototype.fx = function (P) {
        let I = this.inst.get(P.uid);
        if (I && I.type !== P.type) { try { I.kill(); } catch (e) {} this.inst.delete(P.uid); I = null; }
        if (!I) { I = NBFX.BY[P.type].make(this.ctx); I.type = P.type; I.id = ++instN; this.inst.set(P.uid, I); }
        return I;
    };
    Rig.prototype.chain = function (holder, list) {
        let live = list.filter(fxOK), sig = live.map(P => P.uid + ':' + this.fx(P).id).join(',');
        if (sig === holder.sig) return;
        holder.sig = sig;
        try { holder.cin.disconnect(); } catch (e) {}
        let prev = holder.cin;
        const cut = n => { if (n._nx) { try { n.disconnect(n._nx); } catch (e) {} n._nx = null; } };
        live.forEach(P => { let I = this.fx(P); cut(I.out); prev.connect(I.in); prev._nx = I.in; prev = I.out; });
        if (!holder.pd) { holder.pd = this.ctx.createDelay(1); holder.pd.delayTime.value = 0; } try { holder.pd.disconnect(); } catch (e) {}
        prev.connect(holder.pd); prev._nx = holder.pd; holder.pd.connect(holder.cout); holder.live = live;
    };
    Rig.prototype.pdc = function () {
        let pr = this.pr, own = {}, req = {}, by = {}, W = [], into = {};
        pr.tracks.forEach(tr => { let c = this.ch[tr.uid]; if (!c || !c.live) return; by[tr.uid] = tr; let L = 0; c.live.forEach(P => { let I = this.inst.get(P.uid); if (I && I.lat) L += I.lat(); }); own[tr.uid] = L; });
        Object.keys(by).forEach(u => { let tr = by[u], o = outOf(pr, tr); W.push([u, o && by[o] ? o : 'M', 'main'], [u, 'M', 'fx']); sendsOf(pr, tr).forEach(s => { if (by[s.uid]) W.push([u, s.uid, 's:' + s.uid]); }); });
        W.forEach(w => { if (w[1] !== 'M') (into[w[1]] = into[w[1]] || []).push(w[0]); });
        const ready = u => { if (req[u] == null) { req[u] = 0; (into[u] || []).forEach(f => { req[u] = Math.max(req[u], ready(f)); }); } return req[u] + own[u]; };
        Object.keys(by).forEach(ready);
        let top = 0; W.forEach(w => { if (w[1] === 'M') top = Math.max(top, ready(w[0])); });
        let L = this.lats = {};
        Object.keys(by).forEach(u => { L[u] = { pd: Infinity, x: {} }; });
        W.forEach(w => { let e = L[w[0]], n = Math.max(0, (w[1] === 'M' ? top : req[w[1]]) - ready(w[0])); e.x[w[2]] = n; if (n < e.pd) e.pd = n; });
        Object.keys(L).forEach(u => {
            let e = L[u], c = this.ch[u]; if (!isFinite(e.pd)) e.pd = 0;
            Object.keys(e.x).forEach(k => { let d = e.x[k] - e.pd; e.x[k] = d > 1e-7 ? d : 0; });
            if (c && c.pd && Math.abs(c.pd.delayTime.value - e.pd) > 1e-6) c.pd.delayTime.setValueAtTime(Math.min(1, e.pd), this.ctx.currentTime);
        });
        this.lat = top;
        this.route();
    };
    Rig.prototype.route = function () {
        let pr = this.pr, ctx = this.ctx, L = this.lats || {};
        pr.tracks.forEach(tr => {
            let c = this.ch[tr.uid]; if (!c) return;
            let e = L[tr.uid] || { x: {} }, o = outOf(pr, tr), dst = o && this.ch[o] ? this.ch[o].in : this.M.bus;
            const hold = (k, d) => { let n = c['d_' + k]; if (!n) { if (!(d > 0)) return null; n = c['d_' + k] = ctx.createDelay(1); } if (Math.abs(n.delayTime.value - d) > 1e-6) n.delayTime.setValueAtTime(Math.min(1, d), ctx.currentTime); return n; };
            let dm = hold('main', e.x.main || 0);
            if (dm) { link(c, 'main', c.duck, dm); link(c, 'main2', dm, c.og); } else link(c, 'main', c.duck, c.og);
            link(c, 'out', c.og, dst);
            let df = hold('fx', e.x.fx || 0);
            if (df) { link(c, 'fxin', c.duck, df); link(c, 'room', df, c.room); link(c, 'echo', df, c.echo); }
            let want = {}; sendsOf(pr, tr).forEach(s => { if (this.ch[s.uid]) want[s.uid] = s; });
            Object.keys(c.sends).forEach(u => { if (want[u]) return; let s = c.sends[u]; ['s:', 's2:', 's3:'].forEach(k => link(c, k + u, null, null)); try { s.gt.disconnect(); } catch (er) {} delete c.sends[u]; });
            Object.keys(want).forEach(u => {
                let w = want[u], s = c.sends[u], tap = w.pre ? c.cut : c.duck, d = e.x['s:' + u] || 0;
                if (!s) { s = c.sends[u] = { g: this.g(0), gt: this.g(0) }; s.g.connect(s.gt); }
                if (d > 0 && !s.d) s.d = ctx.createDelay(1);
                if (s.d) { if (Math.abs(s.d.delayTime.value - d) > 1e-6) s.d.delayTime.setValueAtTime(Math.min(1, d), ctx.currentTime); link(c, 's:' + u, tap, s.d); link(c, 's2:' + u, s.d, s.g); }
                else link(c, 's:' + u, tap, s.g);
                link(c, 's3:' + u, s.gt, this.ch[u].in); s.pre = w.pre;
            });
        });
    };
    const CUTQ = (sr, hi) => { let f = hi ? Math.min(22000, sr * 0.49) : 10, w = 2 * Math.PI * f / sr, al = Math.sin(w) / (2 * Math.pow(10, 1 / 20)), cs = Math.cos(w), a0 = 1 + al;
        let b = hi ? [(1 - cs) / 2, 1 - cs, (1 - cs) / 2] : [(1 + cs) / 2, -(1 + cs), (1 + cs) / 2]; return [b.map(x => x / a0), [1, -2 * cs / a0, (1 - al) / a0]]; };
    function lowCut(c, f, qdb) {
        if (c.createIIRFilter) { let w = 2 * Math.PI * f / c.sampleRate, al = Math.sin(w) / (2 * Math.pow(10, qdb / 20)), cs = Math.cos(w), a0 = 1 + al; try { return c.createIIRFilter([(1 + cs) / 2 / a0, -(1 + cs) / a0, (1 + cs) / 2 / a0], [1, -2 * cs / a0, (1 - al) / a0]); } catch (e) {} }
        let b = c.createBiquadFilter(); b.type = 'highpass'; b.frequency.value = f; b.Q.value = qdb; return b;
    }
    Rig.prototype.cuts = function (c, tr) {
        let m = tr.mix, ctx = this.ctx, lanes = (this.auto || {})[tr.uid] || {};
        const moving = k => !!lanes['mix.' + k] || tr.fx.some(P => P.type === 'puppet' && P.on && [1, 2, 3, 4].some(i => P.p['t' + i] === 'mix.' + k));
        const pick = (k, end, hi) => {
            if (!end || moving(k)) return hi ? c.lp : c.hp;
            if (c.bus) return null;
            let nk = hi ? 'lpI' : 'hpI';
            if (!c[nk] && ctx.createIIRFilter) { let [b, a] = CUTQ(ctx.sampleRate, hi); try { c[nk] = ctx.createIIRFilter(b, a); } catch (e) { c[nk] = null; } }
            return c[nk] || (hi ? c.lp : c.hp);
        };
        let H = pick('lc', m.lc <= 0, 0), Lo = pick('hc', m.hc >= 1, 1);
        let chain = [c.cout, H, Lo, c.cut].filter(Boolean);
        if (c._cutp && c._cutp.length === chain.length && c._cutp.every((n, i) => n === chain[i])) return;
        ['c1', 'c2', 'c3'].forEach(k => link(c, k, null, null));
        chain.slice(1).forEach((n, i) => link(c, 'c' + (i + 1), chain[i], n));
        c._cutp = chain;
    };
    // solo logic. headache
    Rig.prototype.audible = function () {
        let pr = this.pr, by = {}, only = this.opt.only, T = pr.tracks;
        T.forEach(t => { by[t.uid] = t; });
        const next = u => { let t = by[u], r = sendsOf(pr, t).map(s => s.uid), o = outOf(pr, t); if (o) r.push(o); return r; };
        const down = (start, set) => { let st = start.slice(); while (st.length) { let u = st.pop(); if (set.has(u) || !by[u]) continue; set.add(u); next(u).forEach(v => st.push(v)); } return set; };
        const inside = set => { let grew = true; while (grew) { grew = false; T.forEach(t => { if (!set.has(t.uid)) { let o = outOf(pr, t); if (o && set.has(o)) { set.add(t.uid); grew = true; } } }); } return set; };
        const ok = u => !by[u].mix.mute && has(V[by[u].inst].part);
        if (only) { let S = down([only], new Set()); return { v: S, o: S, s: n => S.has(n) }; }
        let solo = T.filter(t => t.mix.solo).map(t => t.uid);
        if (!solo.length) { let S = new Set(T.filter(t => ok(t.uid)).map(t => t.uid)); return { v: S, o: S, s: n => S.has(n) }; }
        let H = down([...inside(new Set(solo))], new Set()), SC = new Set(solo.filter(u => by[u].inst === 'cell'));
        let F = new Set(T.filter(t => sendsOf(pr, t).some(s => SC.has(s.uid))).map(t => t.uid)), P = inside(new Set(F)); F.forEach(u => P.delete(u));
        let v = new Set(), o = new Set();
        T.forEach(t => { let u = t.uid; if (!ok(u)) return; if (H.has(u) || P.has(u) || F.has(u)) v.add(u); if (H.has(u) || P.has(u)) o.add(u); });
        return { v, o, s: (n, u) => v.has(n) && (H.has(n) || SC.has(u)) };
    };
    Rig.prototype.sync = function () {
        let pr = this.pr, keep = {}, alive = new Set();
        pr.tracks.forEach(tr => {
            if (tr.fz && pr.tracks.some(t => t.uid === tr.fz)) return;
            keep[tr.uid] = 1;
            let c = this.ch[tr.uid];
            if (c && c.inst !== tr.inst) { this.drop(tr.uid); c = null; }
            if (!c) c = this.ch[tr.uid] = this.mkch(tr);
            this.chain(c, tr.fx); tr.fx.forEach(P => { if (fxOK(P)) alive.add(P.uid); });
        });
        Object.keys(this.ch).forEach(id => { if (!keep[id]) this.drop(id); });
        let mfx = this.opt.only ? [] : pr.master.fx;
        this.chain(this.M, mfx); mfx.forEach(P => { if (fxOK(P)) alive.add(P.uid); });
        this.inst.forEach((I, k) => { if (!alive.has(k)) { try { I.kill(); } catch (e) {} this.inst.delete(k); } });
        this.pdc(); this.pup();
        this.auto = {};
        {
            pr.tracks.forEach(tr => tr.auto.forEach(a => { if (a.pts && a.pts.length) (this.auto[tr.uid] = this.auto[tr.uid] || {})[a.path] = a; }));
            pr.master.auto.forEach(a => { if (a.pts && a.pts.length) (this.auto.master = this.auto.master || {})[a.path] = a; });
        }
    };
    Rig.prototype.drop = function (id) {
        let c = this.ch[id]; if (!c) return;
        Object.values(c.mono).forEach(m => { if (m.kill) return m.kill(); Object.values(m).forEach(n => { try { if (n.stop) n.stop(); n.disconnect(); } catch (e) {} }); });
        try { c.in.disconnect(); c.duck.disconnect(); c.cin.disconnect(); c.lp.disconnect(); c.cut.disconnect(); c.og.disconnect(); if (c.hpI) c.hpI.disconnect(); if (c.lpI) c.lpI.disconnect(); } catch (e) {}
        [c.d_main, c.d_fx].concat(Object.values(c.sends || {}).map(s => s.gt)).forEach(n => { if (n) try { n.disconnect(); } catch (e) {} });
        if (c.bend) { try { c.bend.cs.stop(); c.bend.lfo.stop(); c.bend.sum.disconnect(); } catch (e) {} }
        delete this.ch[id];
    };
    Rig.prototype.apply = function (now) {
        let ctx = this.ctx, pr = this.pr, t = NBFX.when ? NBFX.when(ctx) : ctx.currentTime, set = (p, v) => { if (!isFinite(v)) return; if (now) p.value = v; else p.setTargetAtTime(v, t, 0.03); };
        let info = { bpm: this.bpmNow || pr.bpm, root: pr.root, scale: pr.scale, sig: this.sigNow || pr.sig || 4 }, A = this.playing ? this.auto : {};
        let H = this.audible();
        pr.tracks.forEach(tr => {
            let c = this.ch[tr.uid]; if (!c) return;
            let m = tr.mix, a = A[tr.uid] || {}, ok = has(V[tr.inst].part), on = H.v.has(tr.uid) && ok, og = H.o.has(tr.uid) && ok;
            set(c.mute.gain, on ? 1 : 0); set(c.og.gain, og ? 1 : 0);
            this.cuts(c, tr);
            ['vol', 'pan', 'room', 'echo', 'lc', 'hc'].forEach(k => {
                if (a['mix.' + k]) return;
                let p = { vol: c.fader.gain, pan: c.pan.pan, room: c.room.gain, echo: c.echo.gain, lc: c.hp.frequency, hc: c.lp.frequency }[k];
                set(p, (k === 'room' || k === 'echo') && !og ? 0 : MIXMAP[k](m[k]));
            });
            Object.keys(c.sends || {}).forEach(u => { let s = c.sends[u]; set(s.gt.gain, on && H.s(tr.uid, u) ? 1 : 0); if (!a['send.' + u]) set(s.g.gain, MIXMAP.vol((m.to || {})[u] || 0)); });
            if (c.dr) tr.snd.drawers.forEach((d, i) => { if (!c.dr[i]) return; set(c.dr[i].g.gain, (d.mute ? 0 : 1) * Math.pow(d.vol, 1.5) * 1.7); set(c.dr[i].p.pan, (d.pan - 0.5) * 2); });
            if (c.vx) {
                let sn = tr.snd, dv = sn.cxDrv || 0, k = dv < 0.01 ? 0 : Math.round((1 + dv * 14) * 4) / 4;
                if (k !== c.vx.k) { c.vx.k = k; c.vx.sh.curve = k ? curve(k, 1024) : null; }
                let tl = ((sn.cxTone == null ? 0.5 : sn.cxTone) - 0.5) * 24;
                set(c.vx.ls.gain, -tl * 0.6); set(c.vx.hs.gain, tl * 0.6);
                set(c.vx.out.gain, Math.pow(10, ((sn.cxOut == null ? 0.5 : sn.cxOut) - 0.5) * 24 / 20) / (k ? Math.sqrt(k / Math.tanh(k)) : 1));
            }
            tr.fx.forEach(P => { if (!fxOK(P)) return; let sk = {}; Object.keys(a).forEach(k => { let s = k.split('.'); if (s[0] === 'fx' && s[1] === P.uid) sk[s[2]] = 1; }); this.fx(P).set(P.p, now, info, sk); });
        });
        {
            let want = new Map(), owner = new Map();
            pr.tracks.forEach(tr => tr.fx.forEach(P => { if (fxOK(P)) owner.set(P.uid, tr.uid); }));
            const plan = (P, self) => { if (!fxOK(P)) return; let I = this.fx(P); if (!I.side || !I.follows || !I.follows()) return; I.keys().forEach(k => { if (k === self || !this.ch[k]) return; let back = (pr.tracks.find(t => t.uid === k) || { fx: [] }).fx.some(Q => fxOK(Q) && Q.p.keys && Q.p.keys.indexOf(self) >= 0 && this.fx(Q).follows && this.fx(Q).follows()); if (back) return; want.set(P.uid + '#' + I.id + '>' + k, [I, k]); }); };
            pr.tracks.forEach(tr => tr.fx.forEach(P => plan(P, tr.uid)));
            (this.opt.only ? [] : pr.master.fx).forEach(P => plan(P, 'master'));
            this.sides = this.sides || new Map();
            this.sides.forEach((v, kk) => { if (!want.has(kk) || !this.ch[v[1]]) { try { v[2].disconnect(v[0].side); } catch (e) {} this.sides.delete(kk); } });
            want.forEach(([I, k], kk) => { if (this.sides.has(kk)) return; let src = this.ch[k].cout;   try { src.connect(I.side); this.sides.set(kk, [I, k, src]); } catch (e) {} });
        }
        let ma = A.master || {};
        if (!ma['mix.vol'] || this.opt.only) set(this.M.vol.gain, this.opt.only ? 1 : Math.pow(pr.master.vol, 1.3) * 1.15);
        (this.opt.only ? [] : pr.master.fx).forEach(P => { if (!fxOK(P)) return; let sk = {}; Object.keys(ma).forEach(k => { let s = k.split('.'); if (s[0] === 'fx' && s[1] === P.uid) sk[s[2]] = 1; }); this.fx(P).set(P.p, now, info, sk); });
        let S = pr.sends, sd = 60 / info.bpm / 4, et = [2, 3, 4, 6, 8][Math.min(4, Math.floor(S.echoTime * 5))] * sd;
        set(this.E.d1.delayTime, et); set(this.E.d2.delayTime, et); set(this.E.fb.gain, S.echoFb * 0.85); set(this.E.lp.frequency, expo(600, 12000, S.echoTone));
        let ik = Math.round(S.roomSize * 20) + ':' + Math.round(S.roomDark * 20);
        if (ik !== this.irKey) { this.irKey = ik; this.room.buffer = roomIR(ctx, S.roomSize, S.roomDark); }
        this.pdc(); this.pup();
    };
    Rig.prototype.pup = function () {
        let pr = this.pr, want = new Map(); this.pups = this.pups || new Map();
        const cur = (owner, path) => { let s2 = path.split('.'); if (s2[0] === 'mix') { if (owner === 'master') return pr.master.vol; let tr = pr.tracks.find(t => t.uid === owner); return tr && tr.mix && tr.mix[s2[1]] != null ? tr.mix[s2[1]] : 0.5; }
            let list = owner === 'master' ? pr.master.fx : (pr.tracks.find(t => t.uid === owner) || { fx: [] }).fx, Q = list.find(x => x.uid === s2[1]); return Q && Q.p[s2[2]] != null ? Q.p[s2[2]] : 0.5; };
        const go = (owner, list) => list.forEach(P => { if (P.type !== 'puppet' || !fxOK(P) || !P.on) return; let I = this.fx(P); if (!I.mod) return;
            [1, 2, 3, 4].forEach(k => { let path = P.p['t' + k], amt = ((P.p['a' + k] == null ? 0.5 : P.p['a' + k]) - 0.5) * 2; if (!path || Math.abs(amt) < 0.005 || path.indexOf('fx.' + P.uid + '.') === 0) return;
                let tg = this.target(owner, path); if (!tg) return; let v = cur(owner, path), lo = Math.max(0, v - 0.02), hi = Math.min(1, v + 0.02);
                tg.forEach(([param, map], j) => { let ck = Math.round(v * 400) + ':' + Math.round(amt * 400), base = map(v); if (!isFinite(base)) return; want.set(P.uid + ':' + k + ':' + j + ':' + path, [I, param, ck, m => { let y = map(Math.max(0, Math.min(1, v + amt * 0.5 * m))) - base; return isFinite(y) ? y : 0; }]); }); }); });
        pr.tracks.forEach(tr => go(tr.uid, tr.fx)); if (!this.opt.only) go('master', pr.master.fx);
        this.pups.forEach((v, key) => { if (!want.has(key) || v.I !== want.get(key)[0]) { try { v.g.disconnect(); } catch (e) {} this.pups.delete(key); } });
        want.forEach(([I, param, ck, fn], key) => { let v = this.pups.get(key); if (!v) { let g = this.ctx.createWaveShaper(); try { I.mod.connect(g); g.connect(param); } catch (e) { return; } v = { g, I, ck: '' }; this.pups.set(key, v); }
            if (v.ck !== ck) { v.ck = ck; let c2 = new Float32Array(513); for (let i = 0; i < 513; i++) c2[i] = fn(i / 256 - 1); v.g.curve = c2; } });
    };
    Rig.prototype.target = function (owner, path) {
        let s = path.split('.'), c = owner === 'master' ? this.M : this.ch[owner];
        if (!c) return null;
        if (s[0] === 'mix') {
            if (owner === 'master') return s[1] === 'vol' ? [[this.M.vol.gain, v => Math.pow(v, 1.3) * 1.15]] : null;
            let p = { vol: c.fader.gain, pan: c.pan.pan, room: c.room.gain, echo: c.echo.gain, lc: c.hp.frequency, hc: c.lp.frequency }[s[1]];
            return p ? [[p, MIXMAP[s[1]]]] : null;
        }
        if (s[0] === 'send') { let sd = owner !== 'master' && c.sends && c.sends[s[1]]; return sd ? [[sd.g.gain, MIXMAP.vol]] : null; }
        if (s[0] === 'fx') {
            let list = owner === 'master' ? this.pr.master.fx : (this.pr.tracks.find(t => t.uid === owner) || { fx: [] }).fx, P = list.find(x => x.uid === s[1]);
            if (!P || !fxOK(P)) return null; let I = this.fx(P); return I.ap && I.ap[s[2]] ? I.ap[s[2]] : null;
        }
        return null;
    };
    Rig.prototype.rewk = function () {
        this.inst.forEach((I, k) => { if (I.wk) { try { I.kill(); } catch (e) {} this.inst.delete(k); } });
        Object.values(this.ch).forEach(c => { c.sig = ''; }); this.M.sig = '';
        let M = this.M; if (!M.safe.lid && this.ctx._nbwk) { let nw = lidNode(this.ctx); if (nw.lid) { try { M.vol.disconnect(M.safe); M.safe.disconnect(); } catch (e) {} M.safe = nw; M.vol.connect(nw); nw.connect(M.pre); } }
        this.sync(); this.apply(true);
    };
    Rig.prototype.retempo = function (b, T) {
        const go = now => { this.bpmNow = tempoAt(this.pr, b); this.sigNow = sigAt(this.pr, b); this.apply(now); };
        if (this.opt.offline) { let q = Math.round(T * this.ctx.sampleRate / 128); this.rts = this.rts || new Set(); if (q <= 0) { go(true); return; } if (this.rts.has(q)) return; this.rts.add(q);
            // firefox things
            if (typeof this.ctx.suspend === 'function') { try { this.ctx.suspend(q * 128 / this.ctx.sampleRate).then(() => { go(true); this.ctx.resume(); }); return; } catch (e) {} }
            NBFX.at(T, () => go(false)); return; }
        let ms = Math.max(0, (T - this.ctx.currentTime) * 1000 - 40), id = setTimeout(() => { (this.rtq || new Set()).delete(id); if (!this.playing) return; NBFX.at(T, () => go(false)); }, ms);
        (this.rtq = this.rtq || new Set()).add(id);
    };
    Rig.prototype.unretempo = function () { (this.rtq || new Set()).forEach(id => clearTimeout(id)); this.rtq = new Set(); this.bpmNow = 0; this.sigNow = 0; };
    Rig.prototype.bendNode = function (c) {
        if (c.bend) return c.bend; let x = this.ctx, B = { cs: x.createConstantSource(), lfo: x.createOscillator(), dep: x.createGain(), sum: x.createGain() };
        B.cs.offset.value = 0; B.lfo.frequency.value = 5.5; B.dep.gain.value = 0; B.cs.connect(B.sum); B.lfo.connect(B.dep); B.dep.connect(B.sum); B.cs.start(); B.lfo.start(); c.bend = B; return B;
    };
    Rig.prototype.bent = function (c, d, fn) {
        let B = c.bend; if (!B) return fn();
        let x = this.ctx, got = [], o1 = x.createOscillator, o2 = x.createBufferSource, AW = window.AudioWorkletNode;
        x.createOscillator = function () { let n = o1.call(this); got.push(n); return n; }; x.createBufferSource = function () { let n = o2.call(this); got.push(n); return n; };
        if (AW) { const Caught = function (...a) { let n = new AW(...a); got.push(n); return n; }; Caught.prototype = AW.prototype; window.AudioWorkletNode = Caught; }
        try { return fn(); } finally {
            delete x.createOscillator; delete x.createBufferSource; if (AW) window.AudioWorkletNode = AW;
            let keep = new Set(); Object.values(c.mono || {}).forEach(m => { if (m && typeof m === 'object') { keep.add(m); Object.values(m).forEach(q => keep.add(q)); } });
            got.forEach(n => { let prm = n.detune || (n.parameters && n.parameters.get('bend')); if (!prm) return; try { B.sum.connect(prm); } catch (e) { return; }
                const off = () => { try { B.sum.disconnect(prm); } catch (e) {} };
                if (n.addEventListener && n.detune) n.addEventListener('ended', off);
                else if (!this.opt.offline && !keep.has(n)) setTimeout(off, (Math.max(0, d) + 12) * 1000); });
        }
    };
    Rig.prototype.duck = function (t) {
        this.inst.forEach(I => { if (I.kick) I.kick(t); });
        let sd = 60 / (this.bpmNow || this.pr.bpm);
        this.pr.tracks.forEach(tr => { let m = tr.mix, c = this.ch[tr.uid]; if (!m.duck || m.key || !c) return; let gn = c.duck.gain; gn.cancelScheduledValues(t); gn.setTargetAtTime(1 - m.duck * 0.9, t, 0.004); gn.setTargetAtTime(1, t + 0.02, sd * 0.2); });
    };
    Rig.prototype.arp = function (tr, X, t, d, s, vel, ns, ar, sq, v) {
        let st = ARATE[Math.min(5, Math.floor((s.cxRate == null ? 0.5 : s.cxRate) * 6))][1] * 60 / (X.bpm || this.pr.bpm), oc = 1 + Math.min(3, Math.floor((s.cxAoct || 0) * 4)), R = rngOf(X);
        let W = { ns, pool: [], seq: null };
        const build = ms => { W.ns = ms; W.pool = []; for (let o = 0; o < oc; o++) ms.forEach(m => W.pool.push(m + o * 12));
            let up = W.pool.slice().sort((a, b) => a - b), dn = up.slice().reverse(), oi = []; { let a = 0, b = up.length - 1; while (a <= b) { oi.push(up[a]); if (b !== a) oi.push(up[b]); a++; b--; } }
            W.seq = [null, up, dn, up.concat(up.slice(1, -1).reverse()), W.pool, W.pool, dn.concat(dn.slice(1, -1).reverse()), oi.slice().reverse(), oi, null][ar]; };
        build(ns);
        let gate = Math.max(0.05, s.cxGate == null ? 0.6 : s.cxGate), sw = (s.cxSw || 0) * 0.5, N = 1 + Math.round((s.cxSqN == null ? 1 : s.cxSqN) * 15), steps = sq ? (Array.isArray(s.cxSq) ? s.cxSq : []) : null, ch = s.cxCh == null ? 1 : s.cxCh;
        const play = (k, at) => {
            let p = steps ? (steps[k % N] || { o: 1, n: 0, v: 0.8, t: 0 }) : null; if (p && !p.o) return;
            if (ch < 0.999 && R() > ch) return;
            let seq = W.seq, ms = seq ? [ar === 4 ? seq[Math.floor(R() * seq.length)] : seq[k % seq.length]] : (v.kind === 'mono' ? W.pool.slice(0, 1) : W.ns), tie = p && p.t;
            let tr2 = p ? p.n || 0 : 0, vv = Math.max(0.02, Math.min(1.25, vel * (p ? (p.v == null ? 0.8 : p.v) / 0.8 : 1)));
            let prev = k > 0 && steps ? steps[(k - 1) % N] : null, slide = prev && prev.o && prev.t;
            if (this.opt.spy) this.opt.spy(at, tie ? st * 1.04 : st * gate, ms.map(m => m + tr2), vv);
            this.bent(this.ch[tr.uid] || {}, st, () => PLAY[tr.inst](Object.assign({}, X, { hold: null, prevOn: k > 0 ? true : X.prevOn, sl: slide || X.sl }), at, tie ? st * 1.04 : st * gate, s, vv, ms.map(m => m + tr2)));
        };
        const when = k => t + k * st + (k % 2 ? sw * st : 0);
        if (!X.hold) { let n0 = Math.max(1, Math.ceil(d / st - 1e-6)); for (let k = 0; k < n0; k++) play(k, when(k)); return; }
        let ctx = this.ctx, run = { k: 0, on: true, retune: ms => build(ms) };
        const tick = () => { if (!run.on) return; while (when(run.k) < ctx.currentTime + 0.25 && run.k < 100000) { play(run.k, Math.max(ctx.currentTime + 0.002, when(run.k))); run.k++; } run.id = setTimeout(tick, 50); };
        tick(); (this.arun = this.arun || {})[tr.uid] = run;
        let g = ctx.createGain(); X.hold.push({ g: g.gain, rel: 0.01, o: [], off: () => { run.on = false; clearTimeout(run.id); if (this.arun[tr.uid] === run) delete this.arun[tr.uid]; } });
    };
    Rig.prototype.arpRetune = function (uid, ms) { let tr = this.pr.tracks.find(t => t.uid === uid), run = this.arun && this.arun[uid]; if (!tr || !run || !run.on) return false;
        let s = tr.snd, sh = Math.round(((s.cxTune == null ? 0.5 : s.cxTune) - 0.5) * 48) + ((s.cxFine == null ? 0.5 : s.cxFine) - 0.5) * 2, ci = Math.min(CHORDS.length - 1, Math.floor((s.cxChord || 0) * CHORDS.length)), ns = [];
        ms.forEach(m0 => CHORDS[ci][1].forEach(i => { let m = m0 + sh + i; if (ns.indexOf(m) < 0) ns.push(m); })); run.retune(ns); return true; };
    Rig.prototype.trig = function (tr, t, d, n, vel, ex) {
        let c = this.ch[tr.uid]; if (!c || !has(V[tr.inst].part) || c.bus) return;
        ex = ex || {};
        if (this.opt.offline) RS = noteSeed(tr.uid, Math.round(t * this.ctx.sampleRate), n.m, vel);
        if (V[tr.inst].kind === 'audio') { if (window.NBA) NBA.trig(this, tr, c, t, d, n, vel, ex); return; }
        if (ex.hold && !this.opt.offline && tr.inst !== 'serpent') this.bendNode(c);
        let X = { ctx: this.ctx, out: c.in, nb: this.nb, mono: c.mono, chokes: c.chokes, bpm: ex.bpm || this.bpmNow || this.pr.bpm, root: this.pr.root || 0, semi: 0, sl: n.sl, ac: n.ac, o: n.o, prevOn: ex.prevOn, nextSlides: ex.nextSlides, hold: ex.hold, rnd: ex.rnd || rr, ly: ex.ly, lyPrev: ex.lyPrev, ex: n.e || null, wh: ex.wh || 0 };
        let key = tr.mix.key;
        try {
            if (tr.inst === 'coffin') {
                let i = n.m - KITROOT, dr = tr.snd.drawers[i]; if (!dr || !c.dr[i] || !V[dr.voice] || !has(V[dr.voice].part)) return;
                X.out = c.dr[i].g; X.semi = (dr.tune - 0.5) * 24; X.o = dr.o || n.o; (c.hits = c.hits || [])[i] = t;
                if (dr.cg) tr.snd.drawers.forEach((o, j) => { if (j === i || o.cg !== dr.cg || !c.dr[j]) return; let gn = c.dr[j].g.gain; gn.cancelScheduledValues(t); gn.setTargetAtTime(0, t, 0.004); gn.setValueAtTime((o.mute ? 0 : 1) * Math.pow(o.vol, 1.5) * 1.7, t + 0.04); });
                let sv = Object.assign({}, dr.snd, n.L || {}), va = dr.vary == null ? 0.15 : dr.vary;
                if (va > 0.005) { const R = rngOf(X), sel = V[dr.voice].selects || []; V[dr.voice].p.forEach(q => { let k2 = q[0]; if (k2 === 'model' || k2 === 'kind' || sel.indexOf(k2) >= 0 || /^cx/.test(k2) || typeof sv[k2] !== 'number') return; sv[k2] = Math.max(0, Math.min(1, sv[k2] + (R() - 0.5) * va * 0.08)); });
                    X.semi += (R() - 0.5) * va * 0.5; vel *= 1 + (R() - 0.5) * va * 0.35; }
                this.bent(c, d, () => PLAY[dr.voice](X, t, d, sv, vel, []));
                key = key && dr.voice === 'stomp' && i === 0;
            } else {
                let v = V[tr.inst], s = Object.assign({}, tr.snd, ex.snd || {}, n.L || {});
                if (c.vx) X.out = c.vx.in;
                let sh = Math.round(((s.cxTune == null ? 0.5 : s.cxTune) - 0.5) * 48) + ((s.cxFine == null ? 0.5 : s.cxFine) - 0.5) * 2, cv = s.cxVel == null ? 0.5 : s.cxVel;
                vel = cv < 0.5 ? 0.8 + (vel - 0.8) * cv * 2 : Math.pow(vel, 1 + (cv - 0.5) * 4);
                if (v.kind === 'drum') { X.semi = n.m - 60 + sh; this.bent(c, d, () => PLAY[tr.inst](X, t, d, s, vel, [n.m])); }
                else {
                    let ci = Math.min(CHORDS.length - 1, Math.floor((s.cxChord || 0) * CHORDS.length)), held = ex.chord && ex.chord.length ? ex.chord : [n.m], ns = [];
                    held.forEach(m0 => CHORDS[ci][1].forEach(i => { let m = m0 + sh + i; if (ns.indexOf(m) < 0) ns.push(m); }));
                    let ar = Math.min(ARPS.length - 1, Math.floor((s.cxArp || 0) * ARPS.length)), sq = (s.cxSqOn || 0) >= 0.5;
                    if (!ar && !sq) { if (this.opt.spy) this.opt.spy(t, d, ns, vel); this.bent(c, ex.hold ? 120 : d, () => PLAY[tr.inst](X, t, d, s, vel, v.kind === 'mono' ? ns.slice(0, 1) : ns)); }
                    else this.arp(tr, X, t, d, s, vel, ns, ar, sq, v);
                }
            }
        } catch (err) { if (!this.opt.offline) console.warn('noisebox', tr.inst, err); }
        if (key) { this.duck(t); this.kicks.push(t); }
        this.inst.forEach(I => { if (I.hit) I.hit(tr.uid, t); });
    };

    const TABLE_PART = { 10: 'cs_tables', 11: 'cs_tables', 12: 'cs_tables', 13: 'cs_tables', 14: 'cr_tables', 15: 'cr_tables' };
    const tableOwned = i => !TABLE_PART[i] || has(TABLE_PART[i]);
    const rngOf = X => { let a = Math.floor(X.rnd() * 4294967295) || 7; return () => { a ^= a << 13; a ^= a >>> 17; a ^= a << 5; return (a >>> 0) / 4294967296; }; };
    const H = (X, g, rel, os, tell) => { if (X.hold) X.hold.push({ g, rel, o: os || [], tell }); };
    const SMP_SENT = new WeakMap();
    const zonesOf = (s, k) => { let Z = s.zones || {}; return Z[k] && Z[k].length ? Z[k] : Z.all && Z.all.length ? Z.all : s.smp && s.smp.id ? [s.smp] : []; };
    function zonePick(Z, f, vel, blend) {
        if (!Z.length) return null; let vs = [...new Set(Z.map(z => z.vel == null ? 1 : z.vel))], vl = vs.reduce((a, b) => Math.abs(b - vel) < Math.abs(a - vel) ? b : a, vs[0]);
        let L = Z.filter(z => (z.vel == null ? 1 : z.vel) === vl).map(z => [12 * Math.log2((z.root || 261.63) / 261.63), z]).sort((a, b) => a[0] - b[0]), n = 12 * Math.log2(f / 261.63);
        if (L.length === 1 || n <= L[0][0]) return [L[0][1], null, 0]; if (n >= L[L.length - 1][0]) return [L[L.length - 1][1], null, 0];
        let i = 0; while (i < L.length - 2 && L[i + 1][0] <= n) i++; let a = L[i], b = L[i + 1], w = (n - a[0]) / Math.max(0.01, b[0] - a[0]);
        if (!blend) return w < 0.5 ? [a[1], null, 0] : [b[1], null, 0]; return [a[1], b[1], w];
    }
    function smpPay(c, z) {
        let e = window.NBA && NBA.pool.get(z.id); if (!e) { if (window.NBA) NBA.load(z.id); return null; } if (e.state !== 'ok') return null;
        let sent = SMP_SENT.get(c) || new Set(); SMP_SENT.set(c, sent); let o = { id: e.id, root: z.root, st: z.st, en: z.en };
        if (!sent.has(e.id)) { let d = e.ch[0]; if (e.ch[1]) { d = new Float32Array(e.n); for (let i = 0; i < e.n; i++) d[i] = (e.ch[0][i] + e.ch[1][i]) * 0.5; } o.d = d; o.sr = e.sr; sent.add(e.id); }
        return o;
    }
    function smpFor(c, s, ks, f, vel) {
        let out = {}; ks.forEach(k => { let pk = zonePick(zonesOf(s, k), f * (Math.pow(2, Math.round(((s['s' + k] == null ? 0.5 : s['s' + k]) * 48) - 24) / 12)), vel, (s.zbl == null ? 0.75 : s.zbl) >= 0.5); if (!pk) return;
            let a = smpPay(c, pk[0]); if (!a) return; if (pk[1] && pk[2] > 0.001) { let b = smpPay(c, pk[1]); if (b) { a.x = b; a.w = pk[2]; } } out['smp' + k.toUpperCase()] = a; });
        return out;
    }
    const hush = (p, t, tau) => { if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t); else p.cancelScheduledValues(t); p.setTargetAtTime(0, t, tau); };
    const mdl = (s, n) => Math.min(n - 1, Math.floor((s.model || 0) * n));
    function topOf(X, s) {
        if (s.top == null || s.top > 0.985) return X;
        let f = X.ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 0.6; f.frequency.value = expo(150, 18000, s.top); f.connect(X.out);
        return Object.assign({}, X, { out: f });
    }
    const noiseHit = (X, t, type, fq, q, peak, at, len, out) => {
        let c = X.ctx, n = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); n.buffer = X.nb; fl.type = type; fl.frequency.value = Math.min(18000, fq); fl.Q.value = q;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + Math.max(0.0005, at)); g.gain.exponentialRampToValueAtTime(0.0003, t + at + len);
        n.connect(fl); fl.connect(g); g.connect(out || X.out); n.start(t, X.rnd() * 1.5); n.stop(t + at + len + 0.05); return g;
    };
    // bells, cowbell, kalimba etc
    function modal(X, t, f, modes, vel, len, damp, out) {
        let c = X.ctx, v = c.createGain(); v.gain.value = vel; v.connect(out || X.out);
        modes.forEach(([r, a, dm, ty]) => {
            let fr = f * r; if (fr > 17000) return;
            let o = c.createOscillator(), g = c.createGain(), L = Math.max(0.01, len * (dm || 1) * Math.pow(1 - damp * 0.85, Math.log2(Math.max(1, r))));
            o.type = ty || 'sine'; o.frequency.value = fr; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(a, t + 0.0015); g.gain.exponentialRampToValueAtTime(0.0002, t + L);
            o.connect(g); g.connect(v); o.start(t); o.stop(t + L + 0.05);
        });
        return v;
    }
    const crackOf = (c, R) => { let sr = c.sampleRate, n = Math.ceil(sr * 0.012), b = c.createBuffer(1, n, sr), d = b.getChannelData(0), T = 0.0003 + R() * 0.0006, e = 0.0015 + R() * 0.0025, ea = 0, b1 = 1.2 + R() * 0.8; const fw = tt => tt < 0 ? 0 : tt < 0.00004 ? tt / 0.00004 : (1 - (tt - 0.00004) / T) * Math.exp(-b1 * (tt - 0.00004) / T); for (let i = 0; i < n; i++) { let tt = i / sr; d[i] = (fw(tt) + ea * fw(tt - e)) * (1 + (R() - 0.5) * 0.3); } return b; };
    const LRM = new WeakMap(), lashRoom = (c, k) => { let M = LRM.get(c); if (!M) LRM.set(c, M = {}); if (M[k]) return M[k]; let sr = c.sampleRate, len = 0.15 + k * 0.06, n = Math.floor(sr * len), b = c.createBuffer(2, n, sr), sd = 911 + k;
        const rnd = () => { sd = sd * 16807 % 2147483647; return sd / 2147483647; };
        for (let ch = 0; ch < 2; ch++) { let d = b.getChannelData(ch), lp = 0; for (let i = 0; i < n; i++) { let tt = i / sr, e = Math.exp(-tt / (len * 0.22)) * (tt < 0.002 ? tt / 0.002 : 1); lp += ((rnd() * 2 - 1) - lp) * (0.6 - tt / len * 0.4); d[i] = lp * e * 0.35; } } return M[k] = b; };
    function kickExtras(X, t, s, vel, end, len) {
        let c = X.ctx;
        if ((s.knock || 0) > 0.01) { let o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(end * 5, t); o.frequency.exponentialRampToValueAtTime(end * 3, t + 0.03); g.gain.setValueAtTime(vel * s.knock * 0.6, t); g.gain.exponentialRampToValueAtTime(0.0003, t + 0.05); o.connect(g); g.connect(X.out); o.start(t); o.stop(t + 0.08); }
        if ((s.tail || 0) > 0.01) { let o = c.createOscillator(), g = c.createGain(), L = len + s.tail * 2.2; o.frequency.setValueAtTime(end, t); o.frequency.setTargetAtTime(end * 0.9, t + 0.05, L); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel * s.tail * 0.6, t + 0.03); g.gain.setTargetAtTime(0, t + 0.05, L / 4); o.connect(g); g.connect(X.out); o.start(t); o.stop(t + L + 0.1); }
    }
    function snareExtras(X, t, s, vel, f, snap) {
        if ((s.wire || 0) > 0.01) noiseHit(X, t + 0.004, 'bandpass', 4200, 0.7, vel * s.wire * 0.6, 0.002, 0.08 + snap * 0.8);
        if ((s.room || 0) > 0.01) { let c = X.ctx, dl = c.createDelay(0.2), fb = c.createGain(), lp = c.createBiquadFilter(), g = c.createGain(), n = noiseHit(X, t, 'bandpass', 1800, 0.5, vel * 0.5, 0.002, 0.06, dl); dl.delayTime.value = 0.023 + s.room * 0.03; fb.gain.value = 0.35 + s.room * 0.5; lp.type = 'lowpass'; lp.frequency.value = 5000; dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(g); g.gain.value = s.room * 0.9; g.connect(X.out); fb.gain.setValueAtTime(fb.gain.value, t + 2.5); fb.gain.linearRampToValueAtTime(0, t + 3); if (!(typeof OfflineAudioContext !== 'undefined' && c instanceof OfflineAudioContext)) setTimeout(() => { try { dl.disconnect(); fb.disconnect(); } catch (e) {} }, 4000 + (t - c.currentTime) * 1000); }
        if ((s.drop || 0) > 0.01) { let c = X.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(f * 1.5, t); o.frequency.exponentialRampToValueAtTime(f * (1 - s.drop * 0.6), t + 0.12); g.gain.setValueAtTime(vel * s.drop * 0.5, t); g.gain.exponentialRampToValueAtTime(0.0004, t + 0.14); o.connect(g); g.connect(X.out); o.start(t); o.stop(t + 0.2); }
    }
    function hatShake(X, t, s, vel, into, len) { [1, 2].forEach(i => noiseHit(X, t + i * (0.012 + s.shake * 0.025), 'highpass', 6000, 0.7, vel * s.shake * 0.5 / i, 0.003, Math.min(0.06, len), into)); }
    function strikeOf(X, t, f, s, vel) { if ((s.strike == null ? 0.3 : s.strike) > 0.02) noiseHit(X, t, 'bandpass', Math.min(12000, f * 2.5), 1.2, vel * (s.strike == null ? 0.3 : s.strike) * 0.5, 0.0008, 0.012); }
    const VOX = {
        big: { a: [[750, 0, 90], [1200, 0, 110], [2600, 0, 150], [3500, 0, 200], [4500, 0, 260]], i: [[300, 0, 55], [2250, 0, 120], [3000, 0, 170], [3700, 0, 200], [4600, 0, 260]],
            u: [[360, 0, 60], [1300, 0, 110], [2400, 0, 150], [3400, 0, 200], [4500, 0, 260]], e: [[480, 0, 70], [1900, 0, 110], [2550, 0, 160], [3500, 0, 200], [4500, 0, 260]],
            o: [[500, 0, 80], [850, 0, 90], [2500, 0, 150], [3400, 0, 200], [4500, 0, 260]], n: [[270, 0, 90], [1100, 0, 300], [2500, 0, 320], [3400, 0, 360], [4500, 0, 400]] },
        small: { a: [[900, 0, 100], [1450, 0, 120], [2900, 0, 170], [4000, 0, 220], [5000, 0, 280]], i: [[330, 0, 60], [2700, 0, 140], [3300, 0, 180], [4200, 0, 220], [5100, 0, 280]],
            u: [[400, 0, 70], [1600, 0, 120], [2800, 0, 170], [3900, 0, 220], [5000, 0, 280]], e: [[550, 0, 80], [2250, 0, 130], [2900, 0, 170], [4000, 0, 220], [5000, 0, 280]],
            o: [[550, 0, 90], [1000, 0, 100], [2900, 0, 170], [3900, 0, 220], [5000, 0, 280]], n: [[300, 0, 100], [1300, 0, 320], [2800, 0, 340], [3800, 0, 380], [5000, 0, 420]] }
    };
    const vox = (vw, big) => { let A = VOX.big[vw] || VOX.big.a, B = VOX.small[vw] || VOX.small.a; return A.map((q, j) => [q[0] + (B[j][0] - q[0]) * (1 - big), q[1] + (B[j][1] - q[1]) * (1 - big), q[2] + (B[j][2] - q[2]) * (1 - big)]); };
    const SYL = { '': { m: 'v', v: 1 },
        k: { pl: 'vel', m: 'stop', cl: 0.035, asp: 0.045 }, g: { pl: 'vel', m: 'stop', v: 1, cl: 0.03 },
        t: { pl: 'alv', m: 'stop', cl: 0.035, asp: 0.03 }, d: { pl: 'alv', m: 'stop', v: 1, cl: 0.028 },
        p: { pl: 'lab', m: 'stop', cl: 0.04, asp: 0.025 }, b: { pl: 'lab', m: 'stop', v: 1, cl: 0.03 },
        s: { pl: 'alv', m: 'fric', fr: [['bandpass', 6200, 1.1, 1, 0.095], ['highpass', 4500, 0.7, 0.45, 0.095]] }, z: { pl: 'alv', m: 'fric', v: 1, fr: [['bandpass', 6000, 1.1, 0.5, 0.07]] },
        sh: { pl: 'pal', m: 'fric', fr: [['bandpass', 3300, 1, 1, 0.1], ['highpass', 2600, 0.7, 0.35, 0.1]] }, j: { pl: 'pal', m: 'affr', v: 1, cl: 0.02, fr: [['bandpass', 3200, 1, 0.5, 0.055]] },
        ch: { pl: 'pal', m: 'affr', cl: 0.03, fr: [['bandpass', 3300, 1, 0.9, 0.065]] }, ts: { pl: 'alv', m: 'affr', cl: 0.03, fr: [['bandpass', 6000, 1.1, 0.85, 0.06]] },
        h: { pl: 'glo', m: 'fric', asp: 0.075 }, f: { pl: 'lab', m: 'fric', asp: 0.035, fr: [['bandpass', 1800, 0.5, 0.4, 0.075]] },
        m: { pl: 'lab', m: 'nas', v: 1, mm: 0.065 }, n: { pl: 'alv', m: 'nas', v: 1, mm: 0.06 }, N: { pl: 'alv', m: 'nas', v: 1, mm: 0.06 },
        r: { pl: 'alv', m: 'tap', v: 1 }, y: { pl: 'pal', m: 'glide', v: 1, from: 'y' }, w: { pl: 'lab', m: 'glide', v: 1, from: 'w' } };
    ['k', 'g', 'n', 'h', 'b', 'p', 'm', 'r'].forEach(k => { SYL[k + 'y'] = Object.assign({}, SYL[k], { yy: 1 }); });
    const LOCUS = { lab: [250, 900, 2200], alv: [250, 1750, 2700], pal: [260, 2300, 3000], y: [280, 2250, 3000], w: [300, 750, 2300] };
    const BURST = { lab: ['bandpass', 1000, 0.8], alv: ['bandpass', 4000, 1.3], pal: ['bandpass', 3000, 1.4] };
    const q0 = s => (s.cons == null ? 0.6 : s.cons) > 0.01;
    function glottal(c, tens) {
        let k = Math.round(tens * 8), store = c._nbGlot || (c._nbGlot = {}); if (store[k]) return store[k];
        let N = 1024, Tp = 0.42 - k * 0.012, Tn = 0.2 - k * 0.016, g = new Float32Array(N);
        for (let i = 0; i < N; i++) { let x = i / N; g[i] = x < Tp ? 0.5 * (1 - Math.cos(Math.PI * x / Tp)) : x < Tp + Tn ? Math.cos(Math.PI / 2 * (x - Tp) / Tn) : 0; }
        let dg = new Float32Array(N); for (let i = 0; i < N; i++) dg[i] = g[(i + 1) % N] - g[i];
        let H = 80, re = new Float32Array(H), im = new Float32Array(H);
        for (let h = 1; h < H; h++) { let a = 0, b = 0; for (let i = 0; i < N; i++) { let w = 2 * Math.PI * h * i / N; a += dg[i] * Math.cos(w); b += dg[i] * Math.sin(w); } re[h] = a; im[h] = b; }
        return (store[k] = c.createPeriodicWave(re, im));
    }
    const KANA = (() => {
        let m = {}, rows = { '': 'あいうえお', k: 'かきくけこ', g: 'がぎぐげご', s: 'さしすせそ', z: 'ざじずぜぞ', t: 'たちつてと', d: 'だぢづでど', n: 'なにぬねの', h: 'はひふへほ', b: 'ばびぶべぼ', p: 'ぱぴぷぺぽ', m: 'まみむめも', r: 'らりるれろ' };
        Object.keys(rows).forEach(cn => [...rows[cn]].forEach((ch, i) => { m[ch] = [cn, 'aiueo'[i]]; }));
        Object.assign(m, { 'し': ['sh', 'i'], 'じ': ['j', 'i'], 'ち': ['ch', 'i'], 'つ': ['ts', 'u'], 'ぢ': ['j', 'i'], 'づ': ['z', 'u'], 'ふ': ['f', 'u'], 'や': ['y', 'a'], 'ゆ': ['y', 'u'], 'よ': ['y', 'o'], 'わ': ['w', 'a'], 'を': ['', 'o'], 'ん': ['N', 'n'], 'っ': ['Q', ''], 'ー': ['L', 'L'], 'ゔ': ['b', 'u'] });
        return m;
    })();
    const ROM = (() => {
        let r = {};
        const V = 'aiueo';
        [['', ''], ['k', 'k'], ['g', 'g'], ['s', 's'], ['z', 'z'], ['t', 't'], ['d', 'd'], ['n', 'n'], ['h', 'h'], ['b', 'b'], ['p', 'p'], ['m', 'm'], ['r', 'r'], ['y', 'y'], ['w', 'w'], ['f', 'f'], ['j', 'j'], ['sh', 'sh'], ['ch', 'ch'], ['ts', 'ts']].forEach(([rm, cn]) => [...V].forEach(v => { r[rm + v] = [cn, v]; }));
        ['ky', 'gy', 'ny', 'hy', 'by', 'py', 'my', 'ry'].forEach(cn => ['a', 'u', 'o'].forEach(v => { r[cn + v] = [cn, v]; }));
        ['sh', 'ch', 'j'].forEach(cn => ['a', 'u', 'o'].forEach(v => { r[cn + 'y' + v] = [cn, v]; }));
        Object.assign(r, { si: ['sh', 'i'], ti: ['ch', 'i'], tu: ['ts', 'u'], hu: ['f', 'u'], zi: ['j', 'i'], di: ['j', 'i'], du: ['z', 'u'], wo: ['', 'o'], l: ['r', 'u'] });
        ['la', 'li', 'lu', 'le', 'lo'].forEach(x => { r[x] = ['r', x[1]]; });
        return r;
    })();
    function lyricsOf(txt) {
        let out = [], s = String(txt || '').replace(/[\u30a1-\u30f6]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60)).toLowerCase();
        const SMALL = { 'ゃ': 'a', 'ゅ': 'u', 'ょ': 'o', 'ぁ': 'a', 'ぃ': 'i', 'ぅ': 'u', 'ぇ': 'e', 'ぉ': 'o' };
        for (let i = 0; i < s.length;) {
            let ch = s[i];
            if (KANA[ch]) {
                let k = KANA[ch].slice(), nx = s[i + 1];
                if (SMALL[nx]) { if ('ゃゅょ'.indexOf(nx) >= 0) k = [/^(sh|ch|j)$/.test(k[0]) ? k[0] : k[0] + 'y', SMALL[nx]]; else k = [k[0], SMALL[nx]]; i++; }
                out.push(k); i++; continue;
            }
            if (ch === '-' || ch === '~') { out.push(['L', 'L']); i++; continue; }
            if (/[a-z]/.test(ch)) {
                if (ch === 'n' && !/[aiueoy]/.test(s[i + 1] || '')) { out.push(['N', 'n']); i++; continue; }
                if (s[i + 1] === ch && ch !== 'n' && /[bcdfghjkmprstwz]/.test(ch)) { out.push(['Q', '']); i++; continue; }
                let hit = null; for (let L = 4; L >= 1 && !hit; L--) { let w = s.substr(i, L); if (ROM[w]) hit = [w, ROM[w]]; }
                if (hit) { out.push(hit[1].slice()); i += hit[0].length; continue; }
            }
            i++;
        }
        return out;
    }
    const NZ = { lab: 1000, alv: 1600, pal: 2100, vel: 2400, glo: 1600 };
    function singBank(X) {
        let M = { lanes: [], out: X.out };
        M.hush = t => M.lanes.forEach(L => { let G = L.amp.gain; G.cancelScheduledValues(t); G.setTargetAtTime(0, t, 0.02); L.end = 0; L.gone = t + 0.15; L.hold = false; L.ws.forEach(W => ['av', 'ah', 'af', 'ab'].forEach(k => { let p = W.w.parameters.get(k); p.cancelScheduledValues(t); p.setTargetAtTime(0, t + 0.12, 0.02); })); });
        M.kill = () => { M.lanes.forEach(L => { L.ws.forEach(W => { try { W.w.port.postMessage('kill'); W.w.disconnect(); } catch (e) {} }); try { L.amp.disconnect(); } catch (e) {} }); M.lanes = []; };
        return M;
    }
    function singLane(X, M, nst, t, tc, f, seed) {
        let c = X.ctx, L = null, best = 1e9;
        M.lanes.forEach(l => { if (l.nst !== nst || l.at === t || l.hold || !(l.end >= tc - 0.07)) return; let dd = Math.abs(Math.log(l.f / f)); if (dd < best) { best = dd; L = l; } });
        if (L) { L.leg = true; return L; }
        M.lanes.forEach(l => { if (l.nst !== nst || l.at === t || l.hold || l.gone > tc) return; if (!L || l.gone < L.gone) L = l; });
        if (!L && M.lanes.length >= 16) { let old = M.lanes.filter(l => l.at !== t && !l.hold).sort((a, b) => a.end - b.end)[0]; if (old && old.nst === nst) L = old; else if (old) { M.lanes.splice(M.lanes.indexOf(old), 1); old.ws.forEach(W => { try { W.w.port.postMessage('kill'); W.w.disconnect(); } catch (e) {} }); } }
        if (!L) {
            let amp = c.createGain(), ring = c.createBiquadFilter(), air = c.createBiquadFilter(), mix = c.createGain(), ws = [];
            ring.type = 'peaking'; ring.frequency.value = 3000; ring.Q.value = 1.1; air.type = 'highshelf'; air.frequency.value = 4500; air.gain.value = 5;
            amp.gain.value = 0; mix.gain.value = 3 / Math.sqrt(nst);
            for (let q = 0; q < nst; q++) {
                let w = new AudioWorkletNode(c, 'nb-sing', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [1], processorOptions: { seed: (seed + q * 7919) >>> 0 } }), pn = c.createStereoPanner();
                pn.pan.value = nst > 1 ? (q / (nst - 1) - 0.5) * 0.75 : 0; w.connect(pn); pn.connect(mix); ws.push({ w, pn });
            }
            mix.connect(ring); ring.connect(air); air.connect(amp); amp.connect(M.out);
            L = { ws, amp, ring, air, nst, end: -1, gone: -1, at: -1, f, hold: false };
            M.lanes.push(L);
        }
        L.leg = false; return L;
    }
    function sing(X, t, d, s, vel, notes) {
        let c = X.ctx; if (!c._nbwk || typeof AudioWorkletNode === 'undefined') return false;
        const R = rngOf(X), off = !!(typeof OfflineAudioContext !== 'undefined' && c instanceof OfflineAudioContext), now = off ? 0 : c.currentTime + 0.004;
        let M = X.mono.uta; if (M && M.out !== X.out) { M.kill(); M = null; } if (!M) M = X.mono.uta = singBank(X);
        let syl = X.ly || ['', 'aiueon'[Math.min(5, Math.floor((s.vowel || 0) * 6))]], cn = syl[0], vw = syl[1];
        if (cn === 'Q') return true;
        if (vw === 'L') { vw = X.lyPrev || 'a'; cn = ''; }
        const fem = s.voice == null ? 0.85 : s.voice, big = 1 - fem, tens = s.tens == null ? 0.5 : s.tens, br = s.breath == null ? 0.25 : s.breath, cons = s.cons == null ? 0.6 : s.cons, CD = SYL[cn] || SYL[''], man = CD.m || 'v';
        const lit0 = s.light == null ? 0.5 : s.light, nas = s.nasal == null ? 0.1 : s.nasal, robo = s.robo || 0, metal = s.metal || 0, hum = 1 - robo, scr = s.scream || 0, sp = s.speak || 0;
        const sk = [1, 0, 2, 3, 4, 5, 6, 7, 8, 9][Math.min(9, Math.floor((s.skind || 0) * 10))], SKM = [[0.25, 0.1, 10, 1.04, 1, 0.9], [0.18, 0, 7, 1.03, 1, 1], [0.12, 0.15, 6, 1.06, 1, 1.1], [0.1, -0.3, 5, 0.94, 0.95, 1.2], [0.22, 0.08, 3, 1.1, 1.04, 1], [0.06, 0.1, 6, 1, 1, 1.15], [0.05, 0.4, 9, 1.15, 1.1, 0.6], [0.04, -0.45, 3, 0.9, 0.92, 1.1], [0.04, 0.1, 2, 1.05, 1, 1.1], [0.15, -0.3, 4, 0.96, 0.8, 1]][sk], sq = Math.sqrt(scr), lit = Math.max(0, Math.min(1, lit0 + SKM[1] * scr));
        // breath all the way up = whispering
        const wv = Math.max(0, Math.min(1, 1 - (br - 0.75) * 4));
        const SZ = s.size == null ? 0.5 : s.size, AG = s.age == null ? 0.35 : s.age, SM = s.smile == null ? 0.5 : s.smile, WM = s.warm == null ? 0.5 : s.warm;
        const ts = (fem < 0.5 ? 1 - (0.5 - fem) * 0.2 : 1 + (fem - 0.5) * 0.12) * (1 + (0.5 - SZ) * 0.28) * (1 + (0.35 - AG) * 0.1), l1 = 1 + (lit - 0.5) * 0.1, l2 = 1 + (lit - 0.5) * 0.18;
        const voxT = v => vox(v, big).map((q, j) => [q[0] * ts * (j ? l2 : l1) * (1 + (SKM[3] - 1) * sq) * (j === 0 ? 1 + sq * SKM[0] : j === 1 ? 1 + (SKM[4] - 1) * sq : 1) * (j === 0 ? 1 + (SM - 0.5) * 0.05 - (WM - 0.5) * 0.06 : j === 1 ? 1 + (SM - 0.5) * 0.16 : j === 2 ? 1 + (SM - 0.5) * 0.1 : 1 + (SM - 0.5) * 0.05), q[1], q[2] * (1 + fem * 0.25) * (j ? 1 : 1 + nas * 0.8) * (1 + (SKM[5] - 1) * sq)]);
        const ck = 0.6 + cons * 0.8, scl = (1 + (1 - big) * 0.15) * ts * l1, nst = 1 + Math.round((s.stack || 0) * 3), nzV = 270 + Math.min(1, nas + (sk === 6 ? scr * 0.7 : 0)) * 330, nbV = 100 + Math.min(1, nas + (sk === 6 ? scr * 0.7 : 0)) * 260;
        let att = 0.008 + Math.pow(s.att == null ? 0.15 : s.att, 2) * 0.6, rel = 0.04 + Math.pow(s.rel == null ? 0.3 : s.rel, 2) * 2;
        let cl = (CD.cl || 0) * ck, frd = CD.fr ? CD.fr[0][4] * ck : 0, asp = (CD.asp || 0) * ck, mm = (CD.mm || 0) * ck, pre = 0;
        if (man === 'stop') pre = cl + (CD.v ? 0 : 0.008 + asp);
        else if (man === 'fric') pre = CD.v ? frd * 0.45 : Math.max(frd, asp);
        else if (man === 'affr') pre = cl + (CD.v ? frd * 0.5 : frd);
        else if (man === 'nas') pre = mm; else if (man === 'tap') pre = 0.02; else if (man === 'glide') pre = 0.04;
        const FV0 = voxT(vw), loc = pl => (LOCUS[pl] || LOCUS.alv).map(v => v * scl), sigh = X.hold ? 0 : 1;
        notes.forEach(nt => {
            let f = hz(nt + octOf(s.oct) * 12) * Math.pow(2, (R() - 0.5) * 10 * hum / 1200), T0 = Math.max(now, t - pre), k = pre > 0 ? (t - T0) / pre : 1;
            const vl = vel * (1 + (R() - 0.5) * 0.14 * hum);
            let L = singLane(X, M, nst, t, t - pre, f, Math.floor(R() * 4294967295));
            const leg = L.leg && L.end > 0;
            if (leg) { if (man === 'v') T0 = Math.max(now, t - 0.04); T0 = Math.max(T0, L.at + (t - L.at) * 0.45); k = pre > 0 ? (t - T0) / pre : 1; }
            const c2 = cl * k, as2 = asp * k, tb = T0 + c2, tv = t, te = t + d;
            const wid = Math.max(1, Math.pow(f / 220, 0.6)), bwk = wid * (1.35 - tens * 0.5);
            const belt = sk === 0 ? sq : 0, tune = (F, j) => sp > 0.5 ? F : Math.min(9000, j === 0 ? (belt && 2 * f > F * 0.75 && 2 * f < F * 1.9 ? F + (2 * f * 0.98 - F) * belt : Math.max(F, f * 1.08)) : j === 1 ? Math.max(F, f * 1.6) : F);
            const shape = (A, fs) => A.map((q, j) => [tune(q[0], j) * fs, Math.min(1500, q[2] * bwk)]);
            let FS = null;
            if (man === 'glide') FS = FV0.map((q, j) => j < 3 ? [loc(CD.from)[j], 0, q[2]] : q);
            else if (CD.pl === 'vel') { let F2 = FV0[1][0] > 1600 * scl ? 2300 * scl : 1350 * scl; FS = FV0.map((q, j) => j === 0 ? [250 * scl, 0, q[2]] : j === 1 ? [F2 + (q[0] - F2) * 0.4, 0, q[2]] : j === 2 ? [F2 + 300 * scl, 0, q[2]] : q); }
            else if (CD.pl && CD.pl !== 'glo') { let Lc = loc(CD.pl); FS = FV0.map((q, j) => j === 0 ? [Lc[0], 0, q[2]] : j < 3 ? [Lc[j] + (q[0] - Lc[j]) * 0.45, 0, q[2]] : q); }
            const FY = CD.yy ? FV0.map((q, j) => j < 3 ? [loc('y')[j], 0, q[2]] : q) : null;
            const v2 = Math.min(1.2, vl), oqv = Math.max(0.3, Math.min(0.92, 0.42 + (1 - tens) * 0.28 + br * 0.15 - (v2 - 0.7) * 0.12 + (fem - 0.5) * 0.32 - scr * 0.2 + sp * 0.08)), tl = Math.max(0, Math.min(1, 0.1 + (1 - tens) * 0.35 + br * 0.3 - (v2 - 0.7) * 0.4 + (fem - 0.5) * 0.4 - (lit - 0.5) * 0.35 - scr * 0.3 + sp * 0.12 + (WM - 0.5) * 0.3 + Math.max(0, AG - 0.5) * 0.2));
            const hB = (0.02 + br * 0.4 + Math.max(0, fem - 0.4) * 0.22 + Math.abs(AG - 0.4) * 0.1 + sp * 0.06 + (sk === 8 ? scr * 0.18 : 0)) * (1 - robo * 0.8), vib = sk === 9 ? Math.max((s.vib == null ? 0.35 : s.vib) * 110, 55 * sq) * hum : (s.vib == null ? 0.35 : s.vib) * 110 * hum * (1 - sp) * (1 - scr * 0.7), vrate = sk === 9 ? 4.6 : 4.2 + (s.vrate == null ? 0.5 : s.vrate) * 3.3, vdel = (s.vdel == null ? 0.4 : s.vdel) * 0.8, scoop = ((s.scoop == null ? 0.3 : s.scoop) * 150 + (sk === 9 ? 380 * sq : sk === 4 ? 240 * sq : sk === 8 ? 70 * sq : 0)) * hum * (1 - sp);
            const lv = 0.4 + cons * 1.1, unv = !CD.v && (man === 'stop' || man === 'fric' || man === 'affr');
            L.ring.gain.setTargetAtTime(tens * 6 - 1 + (0.5 - fem) * 5 + sq * SKM[2], T0, 0.05); L.air.gain.setTargetAtTime(1.5 + lit * 7 - (sk === 4 || sk === 6 ? sq * 7 : 0), T0, 0.05);
            const inh = !leg && sigh && br > 0.05 && robo < 0.5 && M.lanes.reduce((a, l) => Math.max(a, l.gone || 0), 0) < T0 - 0.9 && T0 - 0.34 >= now;
            L.ws.forEach((W, q) => {
                const o = q ? 0.005 + R() * 0.016 : 0, det = nst > 1 ? (q / (nst - 1) - 0.5) * 16 + (R() - 0.5) * 5 : 0, fq = f * Math.pow(2, det / 1200), fs = q ? 1 + (R() - 0.5) * 0.06 : 1;
                const Pm = n => W.w.parameters.get(n), A = (n, v, at, tc) => { let p = Pm(n); if (n === 'av') v *= wv; if (tc == null) p.setValueAtTime(v, Math.max(T0 + o, at + o)); else p.setTargetAtTime(v, Math.max(T0 + o, at + o), tc); };
                const setF = (S, at, tc) => S.forEach(([F, B], j) => { A('F' + (j + 1), F, at, tc); A('B' + (j + 1), B, at, tc); });
                const FV = shape(FV0, fs), FSs = FS ? shape(FS, fs) : FV;
                W.w.parameters.forEach(p => p.cancelScheduledValues(T0 + o));
                if (inh && !q) { let ti = T0 - 0.34; W.w.parameters.forEach(p => p.cancelScheduledValues(ti)); Pm('av').setValueAtTime(0, ti); Pm('ah').setValueAtTime(0, ti); Pm('ah').setTargetAtTime(Math.min(0.14, 0.04 + br * 0.2), ti, 0.09); Pm('ah').setTargetAtTime(0, T0 - 0.09, 0.03);
                    Pm('nz').setValueAtTime(270, ti); shape(voxT('a'), 0.85).forEach(([F, B], j) => { Pm('F' + (j + 1)).setValueAtTime(F, ti); Pm('B' + (j + 1)).setValueAtTime(Math.min(1500, B * 2), ti); }); }
                if (!leg) { A('f0', fq * Math.pow(2, -(unv ? scoop * 0.3 : scoop) / 1200), T0); A('f0', fq, tv - 0.01, 0.03 + scoop / 150 * 0.04); }
                else { let iv = 12 * Math.log2(f / L.f), ov = Math.abs(iv) >= 1.5 ? Math.sign(iv) * Math.min(35, Math.abs(iv) * 6) * hum : 0; A('f0', fq * Math.pow(2, ov / 1200), tv - 0.045 * hum, 0.002 + 0.026 * hum); if (ov) A('f0', fq, tv + 0.06, 0.05); }
                if (unv && hum > 0.3) { A('f0', fq * Math.pow(2, 18 * hum / 1200), tv); A('f0', fq, tv + 0.004, 0.05); }
                if (sp > 0) { A('f0', fq * Math.pow(2, sp * 0.7 / 12), tv, 0.02); A('f0', fq * Math.pow(2, -sp * 2.5 / 12), tv + 0.04, Math.max(0.06, d * 0.5)); }
                const trem = Math.max(0, AG - 0.6) * 75 * hum, vb2 = Math.max(vib, trem);
                A('vrate', trem > vib ? 5.6 : vrate, T0); A('vib', Math.max(vib * 0.12, trem), T0, 0.04); A('vib', vb2, tv + vdel, 0.22 + vdel * 0.25);
                if ((sk === 9 || sk === 8 || sk === 4) && scr > 0 && d > 0.25) { let fd = Math.min(0.4, d * 0.4); A('f0', fq * Math.pow(2, -(sk === 9 ? 280 : sk === 4 ? 160 : 90) * sq / 1200), te - fd, fd * 0.45); }
                A('oq', oqv, T0, 0.03); A('tilt', tl, T0, 0.03); A('jit', 0.8 * hum + scr * 0.3 + Math.max(0, AG - 0.5) * 1.2, T0); A('drift', 0.8 * hum + sp * 0.6 + Math.max(0, AG - 0.55) * 0.9, T0); A('twg', s.ring || 0, T0);
                { const ck2 = Math.min(1, (s.creak || 0) + Math.max(0, AG - 0.6) * 0.35); A('fry', ck2, T0); if (ck2 > 0.01) { A('fry', 0, tv + Math.min(0.03 + 0.06 * ck2, d * 0.15), 0.018); if (d > 0.6) A('fry', ck2 * 0.85, te - Math.min(0.05 + 0.08 * ck2, d * 0.15), 0.03); } } A('robo', robo, T0); A('metal', metal, T0); A('scr', scr, T0, 0.02); A('sk', sk, T0); A('growl', s.growl || 0, T0, 0.02); A('gl', s.glitch || 0, T0);
                A('ab', 0, T0, 0.004); A('af', 0, T0, 0.003);
                if (man !== 'nas' && vw !== 'n') { A('nz', nzV, T0, 0.008); A('nb', nbV, T0); }
                const pl = Math.max(0.78, Math.min(1.3, Math.pow(f / 262, 0.22))) * (0.72 + 0.32 * Math.min(1.2, vl));
                const OS = Math.min(2, Math.floor((s.onset || 0) * 3));
                const vOn = (at, tc) => { if (!leg && OS === 2 && man === 'v') { A('av', 0, at - 0.012); A('af', lv * 0.06, at - 0.002); A('af', 0, at + 0.004, 0.003); tc = 0.002; } if (!leg && OS === 1) { if (unv) { A('ah', hB + 0.22, at); A('ah', hB, at + 0.06, 0.04); } else { A('ah', hB + 0.14, Math.max(T0, at - 0.05)); } A('ah', hB, at + 0.05, 0.05); tc = Math.max(tc, 0.04); } A('av', (1.1 + 0.15 * sq) * pl, at, Math.max(0.005, tc)); A('av', (0.86 - 0.12 * sq) * pl, at + 0.1, 0.09); if (d > 0.45) A('av', (1.02 + 0.16 * sq) * pl, at + d * 0.4, d * 0.25); };
                if (!leg) { A('av', 0, T0); if (unv && man !== 'stop') { A('ah', hB * 0.15, T0); A('ah', hB + 0.04 + br * 0.15, tv - 0.012, 0.01); } else A('ah', hB + 0.08 + br * 0.3, T0); A('ah', hB, tv + 0.03, 0.04); } else A('ah', hB, T0, 0.02);
                if (man === 'v') {
                    if (leg) { setF(FV, tv - 0.04, 0.032); A('av', 1, T0, 0.02); } else { setF(FV, T0); vOn(tv, att / 3); }
                } else if (man === 'stop') {
                    let bF = CD.pl === 'vel' ? (FV0[1][0] > 1600 * scl ? 2700 : 1700) * scl : CD.pl === 'lab' ? 900 * scl : 4000 * scl, bW = CD.pl === 'vel' ? 900 : CD.pl === 'lab' ? 1600 : 2400;
                    A('ff', bF, T0); A('fb', bW, T0);
                    if (CD.v) { A('av', 0.35, T0, leg ? 0.008 : null); setF(FSs.map((q, j) => j === 0 ? [200 * scl, q[1] * 1.5] : q), T0, leg ? 0.012 : null); }
                    else { A('av', 0, T0, leg ? 0.007 : null); setF(FSs, T0, leg ? 0.015 : null); }
                    A('af', 0, tb - 0.0006); A('af', lv * ({ alv: 0.07, vel: 0.15, lab: 0.12 }[CD.pl] || 0.1) * (CD.v ? 0.5 : 1), tb, 0.0008); A('af', 0, tb + 0.003, 0.006);
                    setF(FSs, tb); setF(FV, tb + 0.004, CD.v ? 0.024 : 0.022);
                    if (!CD.v) { A('ah', hB, T0, 0.006); A('ah', lv * 0.55, tb, 0.002); A('ah', hB, tv - 0.006, 0.012); vOn(tv - 0.01, 0.008); } else vOn(tb, 0.005);
                } else if (man === 'fric' || man === 'affr') {
                    let fr = CD.fr && CD.fr[0], fF = fr ? fr[1] * (0.9 + (1 - big) * 0.25) : 1800, fB = fr ? Math.max(600, fF / (fr[2] * 1.6)) : 2500, fa = fr ? fr[3] * lv * 0.11 : 0, fs0 = man === 'affr' ? tb : T0;
                    A('ff', fF, T0); A('fb', fB, T0);
                    if (man === 'affr') { A('av', CD.v ? 0.12 : 0, T0, leg ? 0.007 : null); setF(FSs, T0, leg ? 0.015 : null); A('af', lv * 0.05, tb); A('af', fa, tb + 0.002, 0.004); }
                    else if (cn === 'h') { A('av', 0, T0, leg ? 0.01 : null); setF(FV, T0, leg ? 0.015 : null); A('ah', lv * 0.75, T0, 0.012); }
                    else { A('av', CD.v ? 0.4 : 0, T0, leg ? 0.01 : null); setF(FSs, T0, leg ? 0.02 : null); A('af', fa * (CD.v ? 0.5 : cn === 's' ? 0.7 : 1), fs0, 0.028); if (cn === 's' || cn === 'z') A('ab', fa * 0.22, fs0, 0.03); }
                    if (cn === 'f') A('ah', lv * 0.35, T0, 0.01);
                    A('af', 0, tv - 0.008, 0.012); A('ab', 0, tv - 0.008, 0.012); if (cn === 'h' || cn === 'f') A('ah', hB, tv - 0.01, 0.012);
                    setF(FV, tv - 0.018, 0.024); vOn(tv - 0.014, 0.01);
                } else if (man === 'nas') {
                    let Lc = loc(CD.pl), mur = shape([[260 * scl, 0, 100], [Lc[1], 0, 300], [Lc[2], 0, 400], FV0[3], FV0[4]], fs);
                    A('nz', NZ[CD.pl] * scl, T0, leg ? 0.008 : null); A('nb', 100, T0); setF(mur, T0, leg ? 0.012 : null); A('av', 0.85, T0, leg ? 0.012 : 0.006);
                    A('nz', nzV, tv - 0.004); A('nb', nbV, tv - 0.004); setF(FV, tv - 0.003, 0.02); vOn(tv, 0.012);
                } else if (man === 'tap') {
                    A('av', 0.3, T0, 0.004); setF(shape([[300 * scl, 0, 120], [1750 * scl, 0, 150], [2500 * scl, 0, 200], FV0[3], FV0[4]], fs), T0, 0.005); setF(FV, T0 + 0.015, 0.014); vOn(T0 + 0.016, 0.006);
                } else if (man === 'glide') {
                    setF(FSs, T0, leg ? 0.015 : null); setF(FV, T0 + 0.02, 0.035); A('av', 0.8, T0, leg ? 0.01 : Math.max(0.005, att / 3)); vOn(tv, 0.02);
                }
                if (FY) { setF(shape(FY, fs), tv, 0.008); setF(FV, tv + 0.022, 0.03); }
                if (vw === 'n') { A('nz', 2000 * scl, T0, 0.01); A('av', 0.75, tv, 0.02); }
                if (sigh) { A('ah', hB * 1.2, te, 0.06); A('oq', Math.min(0.9, oqv + 0.15), te, 0.08); A('f0', fq * Math.pow(2, -35 * hum / 1200), te, rel * 0.5 + 0.04);
                    ['av', 'ah'].forEach(n => A(n, 0, te + rel * 1.6 + 0.05, 0.02)); }
            });
            let G = L.amp.gain, pk = vl * 3.2 / Math.sqrt(notes.length) * (1 - sp * 0.15) * (1 + (1 - wv) * 3) * Math.pow(10, (nas - 0.1) * 0.7);
            if (inh) { G.cancelScheduledValues(T0 - 0.35); G.setTargetAtTime(pk, T0 - 0.35, 0.003); }
            G.cancelScheduledValues(T0); G.setTargetAtTime(pk, T0, leg ? 0.04 : 0.003);
            if (d > 0.45 && sigh) G.setTargetAtTime(pk * 0.9, tv + 0.2, Math.max(0.5, d * 0.7));
            if (sp > 0 && sigh) G.setTargetAtTime(pk * (1 - sp * 0.6), tv + 0.1, 0.15);
            if (sigh) G.setTargetAtTime(0, te, rel / 4);
            L.at = t; L.f = f; L.end = X.hold ? t + 1e4 : te; L.gone = te + rel * 1.6 + 0.12; L.hold = !!X.hold;
            if (X.hold) X.hold.push({ g: G, rel, o: [], off: t2 => { L.hold = false; L.end = t2; L.gone = t2 + rel * 1.6 + 0.12; L.ws.forEach(W => ['av', 'ah'].forEach(n => { let p = W.w.parameters.get(n); p.cancelScheduledValues(t2); p.setTargetAtTime(0, t2 + rel * 1.6 + 0.05, 0.02); })); } });
        });
        return true;
    }
    const DRUM = {
        stomp(X, t, d, s, vel) {
            X = topOf(X, s);
            let c = X.ctx, m = mdl(s, 9), end = expo(30, 90, s.tune) * semis(X.semi), att = (s.att || 0) * 0.02 + 0.0015;
            let P = [null, { st: 1 + s.pitch * 3, pt: 0.02 + s.ptime * 0.25, len: 0.3 + Math.pow(s.decay, 1.3) * 3.7, k: 1 + s.drive * 4, w: 'sine' },
                { st: 1 + s.pitch * 14, pt: 0.004 + s.ptime * 0.06, len: 0.08 + s.decay * 0.6, k: 1.5 + s.drive * 6, w: 'sine' },
                { st: 1 + s.pitch * 8, pt: 0.03 + s.ptime * 0.16, len: 0.2 + s.decay * 1.4, k: 8 + s.drive * 30, w: s.shape > 0.6 ? 'triangle' : 'sine' },
                { st: 1 + s.pitch * 2, pt: 0.02, len: 0.08 + s.decay * 0.5, k: 1, w: 'triangle', soft: 1 },
                { st: 1 + s.pitch * 9, pt: 0.008 + s.ptime * 0.12, len: 0.1 + s.decay * 0.9, k: 1.5 + s.drive * 8, w: 'sine', rumble: 1 }][m];
            let o = c.createOscillator(), v = c.createGain(), sh = c.createWaveShaper(), out = X.out;
            o.type = P.w; sh.curve = curve(P.k, 1024); sh.oversample = '4x';
            if (P.soft) { let lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260 + end * 4; lp.connect(out); out = lp; att = Math.max(att, 0.004); }
            if (m === 3) { let pk = c.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 190; pk.gain.value = 6; pk.Q.value = 0.8; pk.connect(out); out = pk; }
            o.frequency.setValueAtTime(end * P.st, t); o.frequency.exponentialRampToValueAtTime(end, t + P.pt); o.frequency.setTargetAtTime(end * (m === 1 ? 0.97 : 0.92), t + P.pt, P.len * 0.6);
            let pk = vel * (m === 3 ? 0.55 : m === 4 ? 0.9 : 1);
            v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(pk, t + att);
            if (m === 1) { v.gain.setValueAtTime(pk, t + att + 0.04); v.gain.exponentialRampToValueAtTime(0.0001, t + P.len); }
            else { v.gain.setTargetAtTime(pk * (m === 3 ? 0.85 : 0.7), t + att + 0.002, P.len * 0.25); v.gain.exponentialRampToValueAtTime(0.0001, t + P.len); }
            o.connect(sh); sh.connect(v); v.connect(out); o.start(t); o.stop(t + P.len + 0.05);
            if (s.click > 0.01) noiseHit(X, t, 'highpass', expo(800, 9000, s.ctone), 0.7, s.click * vel * (P.soft ? 0.25 : 0.7), 0.0005, 0.006 + (1 - s.ctone) * 0.01, out);
            if (m === 2) noiseHit(X, t, 'bandpass', 3200, 1, vel * (0.25 + s.click * 0.4), 0.0005, 0.02, out);
            if (P.rumble) {
                let n = c.createBufferSource(), lp = c.createBiquadFilter(), rs = c.createWaveShaper(), g = c.createGain(), L = P.len * 3 + 0.6; n.buffer = X.nb; n.loop = true;
                lp.type = 'lowpass'; lp.frequency.value = end * 2.4; lp.Q.value = 4; rs.curve = curve(3 + s.drive * 10, 1024);
                g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel * 0.5, t + 0.12); g.gain.exponentialRampToValueAtTime(0.0002, t + L);
                n.connect(lp); lp.connect(rs); rs.connect(g); g.connect(X.out); n.start(t, X.rnd()); n.stop(t + L + 0.05);
            }
            kickExtras(X, t, s, vel, end, P.len);
        },
        slap(X, t, d, s, vel) {
            X = topOf(X, s);
            let c = X.ctx, m = mdl(s, 12), k = semis(X.semi), f = expo(110, 340, s.tone) * k, snap = 0.04 + s.snap * 0.46, a = s.noise * vel, body = s.body * vel;
            const tone = (fq, peak, len, w, bend) => { let o = c.createOscillator(), g = c.createGain(); o.type = w || 'sine'; o.frequency.setValueAtTime(fq * (bend || 1.4), t); o.frequency.exponentialRampToValueAtTime(fq, t + 0.015); g.gain.setValueAtTime(Math.max(0.0002, peak), t); g.gain.exponentialRampToValueAtTime(0.0003, t + len); o.connect(g); g.connect(X.out); o.start(t); o.stop(t + len + 0.05); };
            if (m === 1) { tone(f * 1.25, body * 0.7, 0.05 + s.decay * 0.15, 'triangle'); noiseHit(X, t, 'highpass', expo(2500, 9000, s.color), 0.8, a * 0.9, 0.0005, snap * 0.5); }
            else if (m === 2) { tone(f * 0.75, body, 0.08 + s.decay * 0.6, 'triangle', 1.8); tone(f * 1.1, body * 0.5, 0.06 + s.decay * 0.4); noiseHit(X, t, 'lowpass', expo(1800, 7000, s.color), 0.5, a, 0.002, snap * 1.4); }
            else if (m === 3) { tone(f * 0.95, body * 0.8, 0.06 + s.decay * 0.3); tone(f * 1.65, body * 0.5, 0.05 + s.decay * 0.2); noiseHit(X, t, 'highpass', expo(1500, 6000, s.color), 0.7, a * 0.8, 0.0005, snap); }
            else if (m === 4) { let g = noiseHit(X, t, 'bandpass', expo(1500, 6000, s.color), 0.6, a * 0.7, 0.012 + s.spread * 0.03, snap * 1.2); }
            else if (m === 5) { tone(1700 * k, vel * 0.6, 0.012, 'triangle', 1); tone(470 * k, vel * 0.5, 0.025 + s.decay * 0.05, 'triangle', 1.1); noiseHit(X, t, 'highpass', 3000, 0.7, a * 0.4, 0.0003, 0.008); }
            else if (m === 6) { noiseHit(X, t, 'bandpass', expo(1800, 4200, s.color), 2.5, vel * 0.9, 0.0004, 0.018 + s.snap * 0.04); tone(1250 * k, vel * 0.18, 0.02, 'sine', 1); }
            else {
                let nc = 1 + Math.round((s.claps == null ? 2 / 7 : s.claps) * 7) + 2, sp = 0.004 + s.spread * 0.02, g = c.createGain(), n = c.createBufferSource(), bp = c.createBiquadFilter();
                n.buffer = X.nb; bp.type = 'bandpass'; bp.frequency.value = Math.min(16000, expo(700, 7000, s.color) * k); bp.Q.value = 1.2; g.gain.setValueAtTime(0, t);
                for (let q = 0; q < nc; q++) { let at = t + q * sp * (0.7 + X.rnd() * 0.6); g.gain.setValueAtTime(a * (0.6 + X.rnd() * 0.4), at); g.gain.exponentialRampToValueAtTime(a * 0.1, at + 0.007); }
                g.gain.setValueAtTime(a * 0.85, t + nc * sp); g.gain.exponentialRampToValueAtTime(0.0004, t + nc * sp + snap);
                n.connect(bp); bp.connect(g); g.connect(X.out); n.start(t, X.rnd()); n.stop(t + nc * sp + snap + 0.1);
                tone(f, body * 0.6, 0.05 + s.decay * 0.3, 'triangle');
            }
            snareExtras(X, t, s, vel, f, snap);
        },
        tick(X, t, d, s, vel) {
            X = topOf(X, s);
            let c = X.ctx, m = mdl(s, 10), open = X.o, len = open ? 0.08 + s.odec * 1.12 : 0.012 + s.cdec * 0.15, base = expo(180, 620, s.tone) * semis(X.semi);
            let v = c.createGain(), hp = c.createBiquadFilter(), pk = c.createBiquadFilter(), pn = c.createStereoPanner();
            hp.type = 'highpass'; hp.frequency.value = Math.min(18000, expo(3500, 13000, s.bright)); pk.type = 'peaking'; pk.frequency.value = Math.min(18000, expo(6000, 12000, s.bright)); pk.gain.value = (s.sizz == null ? 0.5 : s.sizz) * 10;
            pn.pan.value = (s.swing || 0) * (X.rnd() * 2 - 1) * 0.8; hp.connect(pk); pk.connect(v); v.connect(pn); pn.connect(X.out);
            const sq = (ratios, amp) => ratios.forEach(r => { let o = c.createOscillator(), og = c.createGain(); o.type = 'square'; o.frequency.value = Math.min(18000, base * r); og.gain.value = amp; o.connect(og); og.connect(hp); o.start(t); o.stop(t + len + 0.05); });
            const nz = amp => { let n = c.createBufferSource(), ng = c.createGain(); n.buffer = X.nb; ng.gain.value = amp; n.connect(ng); ng.connect(hp); n.start(t, X.rnd()); n.stop(t + len + 0.05); };
            let at = 0.0005;
            if (m === 1) { sq([1.0, 1.4826, 1.8004, 2.5459, 2.6302, 3.8960].map(r => r * 1.6), 0.34 * (1 - s.metal * 0.6)); nz(s.metal * 0.6); }
            else if (m === 2) { sq([2, 3, 4.16, 5.43, 6.79, 8.21], 0.05); nz(0.9); let bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = expo(5500, 11000, s.bright); bp.Q.value = 0.8; hp.frequency.value = Math.min(hp.frequency.value, bp.frequency.value * 0.6); hp.disconnect(); hp.connect(bp); bp.connect(pk); }
            else if (m === 3) { nz(0.9); hp.frequency.value = 2500 + s.bright * 4000; at = 0.008; len *= 1.4; }
            else if (m === 4) { nz(0.5); for (let i = 0; i < 5; i++) { let o = c.createOscillator(), g = c.createGain(), fq = 5000 + X.rnd() * 4000, L = Math.min(len * 1.5, 0.3); o.frequency.value = fq; g.gain.setValueAtTime(0, t); g.gain.setValueAtTime(0.14, t + i * 0.004); g.gain.exponentialRampToValueAtTime(0.0003, t + i * 0.004 + L); o.connect(g); g.connect(hp); o.start(t); o.stop(t + L + 0.05); } }
            else if (m === 5) { let o = c.createOscillator(), g = c.createGain(), fq = Math.min(14000, Math.max(2500, base * 14)); o.frequency.value = fq; g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0003, t + len * 1.6 + 0.05); o.connect(g); g.connect(pk); o.start(t); o.stop(t + len * 1.6 + 0.1); nz(0.15); }
            else { nz(1); pk.gain.value = 6 + (s.sizz == null ? 0.5 : s.sizz) * 10; pk.Q.value = 3; len *= 1.8; }
            v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(vel * 0.7, t + at); v.gain.exponentialRampToValueAtTime(0.0005, t + at + len);
            if ((s.shake || 0) > 0.02) hatShake(X, t, s, vel, hp, len);
            if (s.choke > 0.5) { if (open) X.chokes.tick = v; else if (X.chokes.tick) { hush(X.chokes.tick.gain, t, 0.005); X.chokes.tick = null; } }
        },
        chime(X, t, d, s, vel) {
            X = topOf(X, s);
            let m = mdl(s, 15), f = expo(120, 3200, s.pitch) * semis(X.semi), len = 0.015 + Math.pow(s.decay, 1.7) * 2, dt = 1 + (s.det || 0) * 0.02, dm = s.damp == null ? 0.4 : s.damp, c = X.ctx;
            if (m === 1) {
                let bp = c.createBiquadFilter(), v = c.createGain(); bp.type = 'bandpass'; bp.frequency.value = Math.min(15000, f * 3.2); bp.Q.value = 1.6;
                [1, 1.48].forEach(r => { let o = c.createOscillator(); o.type = 'square'; o.frequency.value = f * 0.6 * r; o.connect(bp); o.start(t); o.stop(t + len + 0.35); });
                v.gain.setValueAtTime(vel * 0.6, t); v.gain.setTargetAtTime(vel * 0.25, t + 0.01, 0.02); v.gain.exponentialRampToValueAtTime(0.0004, t + 0.1 + len * 0.6); bp.connect(v); v.connect(X.out);
            }
            else if (m === 2) modal(X, t, f * 1.6, [[1, 1, 1], [2.71 * dt, 0.15, 0.5]], vel * 0.8, 0.03 + len * 0.08, dm);
            else if (m === 3) modal(X, t, f, [[1, 1, 1], [2.57 * dt, 0.5, 0.6], [4.2, 0.25, 0.4], [6.8, 0.1, 0.3]], vel * 0.7, 0.04 + len * 0.12, dm);
            else if (m === 4) modal(X, t, f * 2, [[1, 1, 1], [2.756, 0.4, 0.9], [5.404 * dt, 0.25, 0.8], [8.933, 0.15, 0.6], [13.34, 0.08, 0.5]], vel * 0.35, 0.3 + len * 1.6, dm * 0.5);
            else if (m === 5) modal(X, t, f, [[1, 1, 1], [2.32 * dt, 0.6, 0.8], [4.25, 0.35, 0.6], [6.63, 0.2, 0.5]], vel * 0.45, 0.1 + len, dm);
            else if (m === 6) modal(X, t, f, [[1, 1, 1], [3.9 * dt, 0.18, 0.4], [7.2, 0.06, 0.2], [2, 0.08, 0.6]], vel * 0.5, 0.2 + len * 1.2, dm);
            else if (m === 7) {
                let v = modal(X, t, f * 0.5, [[1, 1, 1], [1.47, 0.7, 0.9], [1.86 * dt, 0.6, 0.8], [2.3, 0.5, 0.75], [2.8, 0.4, 0.7], [3.38, 0.35, 0.6], [4.1 * dt, 0.3, 0.5], [5.3, 0.2, 0.4]], vel * 0.3, 1 + len * 3, dm * 0.6);
                noiseHit(X, t + 0.05, 'bandpass', f * 3, 2, vel * 0.08, 0.4, 1 + len * 2);
            }
            else if (m === 8) modal(X, t, f, [[1, 1, 1], [5.4 * dt, 0.25, 0.25], [11.8, 0.08, 0.15]], vel * 0.6, 0.15 + len * 0.9, dm);
            else modal(X, t, f, [[1, 1, 1], [2.76 * dt, 0.45, 0.9], [5.4, 0.25, 0.7], [8.93, 0.12, 0.5]], vel * 0.45, 0.5 + len * 2.5, dm * 0.4, X.out);
            strikeOf(X, t, f, s, vel);
        }
    };
    // 808 stuff
    const PULSE = new WeakMap();
    const pulseOf = c => { let b = PULSE.get(c); if (!b) { b = c.createBuffer(1, Math.ceil(c.sampleRate * 0.002), c.sampleRate); let d = b.getChannelData(0), n = Math.round(c.sampleRate * 0.001); for (let i = 0; i < n; i++) d[i] = Math.sin(Math.PI * i / n); PULSE.set(c, b); } return b; };
    const pulse = (X, t, peak, fq, out) => { let c = X.ctx, p = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); p.buffer = pulseOf(c); f.type = 'lowpass'; f.frequency.value = Math.min(16000, fq); f.Q.value = 0.7; g.gain.value = peak; p.connect(f); f.connect(g); g.connect(out || X.out); p.start(t); return g; };
    let SINC = null; const sinCurve = () => SINC || (SINC = (() => { let c = new Float32Array(1024); for (let i = 0; i < 1024; i++) c[i] = Math.sin((i / 1023 * 2 - 1) * Math.PI / 2); return c; })());
    function ring(X, t, f0, f1, pt, peak, len, o) {
        o = o || {}; let c = X.ctx, s = c.createOscillator(), g = c.createGain(), at = o.at || 0.0008, end = t + at + len, out = o.out || X.out;
        s.type = o.w || 'sine'; s.frequency.setValueAtTime(Math.min(18000, f0), t); if (Math.abs(f0 - f1) > 0.01) s.frequency.exponentialRampToValueAtTime(Math.min(18000, f1), t + Math.max(0.001, pt));
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + at); if (o.hold) g.gain.setValueAtTime(peak, t + at + o.hold); g.gain.setTargetAtTime(0, t + at + (o.hold || 0), len / 6.9);
        if (o.round) { let sh = c.createWaveShaper(); sh.curve = sinCurve(); s.connect(sh); sh.connect(g); } else s.connect(g);
        g.connect(out); s.start(t); s.stop(end + (o.hold || 0) + 0.05); return g;
    }
    function hiss(X, t, type, fq, q, peak, at, len, out) {
        let c = X.ctx, n = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); n.buffer = X.nb; n.loop = true; fl.type = type; fl.frequency.value = Math.min(18000, fq); fl.Q.value = q;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + Math.max(0.0005, at)); g.gain.setTargetAtTime(0, t + at, len / 6.9);
        n.connect(fl); fl.connect(g); g.connect(out || X.out); n.start(t, X.rnd() * 1.5); n.stop(t + at + len + 0.05); return g;
    }
    const SKIN = [[1, 1, 1], [1.594, 0.55, 0.5], [2.136, 0.4, 0.38], [2.296, 0.32, 0.33], [2.653, 0.24, 0.27], [2.918, 0.18, 0.23], [3.156, 0.12, 0.2]];
    const SIX808 = [205.3, 304.4, 369.6, 522.7, 540, 800];
    const MTL = new WeakMap();
    const metalOf = (c, fs) => { let key = fs.join(','), M = MTL.get(c); if (!M) MTL.set(c, M = {}); if (M[key]) return M[key];
        let sr = c.sampleRate, n = sr * 2, b = c.createBuffer(1, n, sr), d = b.getChannelData(0);
        fs.forEach(f => { let ph = 0, dt = f / sr; for (let i = 0; i < n; i++) { ph += dt; if (ph >= 1) ph -= 1; let v = ph < 0.5 ? 1 : -1; const bl = t => t < dt ? (t / dt) * 2 - (t / dt) * (t / dt) - 1 : t > 1 - dt ? ((t - 1) / dt) * ((t - 1) / dt) + ((t - 1) / dt) * 2 + 1 : 0; let p2 = ph - 0.5; if (p2 < 0) p2 += 1; v += bl(ph) - bl(p2); d[i] += v / fs.length; } });
        return M[key] = b; };
    const metal = (X, t, len, fs, rate, amp, to) => { let c = X.ctx, s = c.createBufferSource(), g = c.createGain(); s.buffer = metalOf(c, fs); s.loop = true; s.playbackRate.value = rate; g.gain.value = amp * fs.length; s.connect(g); g.connect(to); s.start(t, X.rnd() * 1.5); s.stop(t + len + 0.1); return s; };
    const DRUM2 = {
        stomp(X, t, d, s, vel, m) {
            X = topOf(X, s);
            let c = X.ctx, end = expo(30, 90, s.tune) * semis(X.semi), dr = s.drive || 0, sh = c.createWaveShaper(), mix = c.createGain(), len;
            sh.curve = curve(1 + dr * (m === 7 ? 6 : 5), 1024); sh.oversample = '2x'; mix.connect(sh); if (m === 6) { let dc = lowCut(c, 15, -3.01); sh.connect(dc); dc.connect(X.out); } else sh.connect(X.out);
            if (m === 6) {
                len = 0.15 + Math.pow(s.decay, 1.3) * 3.6; let sg = 1 + s.pitch * 0.4, sw = 0.003 + s.ptime * 0.02, sigh = Math.min(0.3, len * 0.4), o = c.createOscillator(), g = c.createGain();
                o.frequency.setValueAtTime(Math.min(18000, end * sg * 2.3), t); o.frequency.exponentialRampToValueAtTime(end * sg, t + sw); o.frequency.setTargetAtTime(end, t + sw, sigh / 3);
                g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel * 0.95, t + 0.0004); g.gain.setTargetAtTime(0, t + 0.0004, len / 6.9);
                o.connect(g); g.connect(mix); o.start(t); o.stop(t + len + 0.1);
                if (s.click > 0.01) { let lp = expo(800, 9000, s.ctone); pulse(X, t, s.click * vel * 1.2, lp, mix); pulse(X, t + 0.001, -s.click * vel * 0.18, lp, mix); }
            } else if (m === 7) {
                len = 0.15 + s.decay * 1.1;
                ring(X, t, end * (2 + s.pitch * 6), end, 0.01 + s.ptime * 0.08, vel * 0.9, len, { out: mix, w: 'triangle', round: 1, hold: 0.02 + s.decay * 0.06 });
                if (s.click > 0.01) { pulse(X, t, s.click * vel * 0.9, expo(2000, 12000, s.ctone), mix); hiss(X, t, 'lowpass', expo(2000, 10000, s.ctone), 0.7, s.click * vel * 0.35, 0.0005, 0.01, mix); }
            } else {
                len = 0.15 + s.decay * 0.9; let st = 1 + s.pitch * 0.25, pt = 0.01 + s.ptime * 0.08;
                SKIN.forEach(([r, a, dm], i) => { if (end * r < 18000) ring(X, t, end * r * st, end * r, pt, vel * a * 0.8, len * dm, { out: mix, at: 0.001 + i * 0.0003 }); });
                if (s.click > 0.01) { hiss(X, t, 'lowpass', expo(500, 8000, s.ctone), 0.7, s.click * vel * 0.7, 0.0008, 0.018, mix); if (s.ctone > 0.6) pulse(X, t, s.click * vel * (s.ctone - 0.6) * 2, 9000, mix); }
                hiss(X, t + 0.002, 'bandpass', end * 2.2, 2, vel * 0.12, 0.004, len * 0.6, mix);
            }
            kickExtras(X, t, s, vel, end, len);
        },
        slap(X, t, d, s, vel, m) {
            X = topOf(X, s);
            let c = X.ctx, k = semis(X.semi), f = expo(110, 340, s.tone) * k, snap = 0.04 + s.snap * 0.46, a = s.noise * vel, body = s.body * vel;
            if (m === 8) {
                let bl = 0.05 + s.decay * 0.25;
                ring(X, t, f * 1.35 * 1.08, f * 1.35, 0.004, body * 0.75, bl);
                ring(X, t, f * 2.7 * 1.08, f * 2.7, 0.004, body * 0.45, bl * 0.55);
                hiss(X, t, 'highpass', expo(1200, 6000, s.color), 0.7, a * 0.55, 0.0008, snap * 0.8);
            } else if (m === 9) {
                let bl = 0.06 + s.decay * 0.35;
                ring(X, t, f * 1.04 * 1.3, f * 1.04, 0.012, body * 0.7, bl, { w: 'triangle', round: 1 });
                ring(X, t, f * 1.9 * 1.3, f * 1.9, 0.012, body * 0.4, bl * 0.5, { w: 'triangle', round: 1 });
                let lp = c.createBiquadFilter(), hp = c.createBiquadFilter(), g1 = c.createGain(), g2 = c.createGain(), n = c.createBufferSource();
                lp.type = 'lowpass'; lp.frequency.value = Math.min(16000, expo(3000, 12000, s.color)); lp.Q.value = 0.5; hp.type = 'highpass'; hp.frequency.value = 2400; hp.Q.value = 0.9;
                n.buffer = X.nb; n.loop = true; n.connect(lp); lp.connect(g1); lp.connect(hp); hp.connect(g2); g1.connect(X.out); g2.connect(X.out);
                g1.gain.setValueAtTime(0, t); g1.gain.linearRampToValueAtTime(a * 0.45, t + 0.0008); g1.gain.setTargetAtTime(0, t + 0.0008, 0.03 / 6.9);
                g2.gain.setValueAtTime(0, t); g2.gain.linearRampToValueAtTime(a * 0.7, t + 0.0015); g2.gain.setTargetAtTime(0, t + 0.0015, snap / 6.9);
                n.start(t, X.rnd() * 1.5); n.stop(t + snap + 0.1);
            } else if (m === 10) {
                let n = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain(), nc = s.claps == null ? 3 : 1 + Math.round(s.claps * 7), sp = 0.008 + s.spread * 0.008, tail = 0.03 + s.snap * 0.35;
                n.buffer = X.nb; n.loop = true; bp.type = 'bandpass'; bp.frequency.value = Math.min(16000, expo(500, 2600, s.color) * k); bp.Q.value = 1.95;
                g.gain.setValueAtTime(0, t);
                for (let q = 0; q < nc; q++) { let at = t + q * sp; g.gain.linearRampToValueAtTime(a * 2.6, at + 0.0006); g.gain.exponentialRampToValueAtTime(a * 0.3, at + sp * 0.9); }
                let te = t + nc * sp; g.gain.linearRampToValueAtTime(a * 2.4, te + 0.0006); g.gain.setTargetAtTime(0, te + 0.0006, tail / 6.9);
                n.connect(bp); bp.connect(g); g.connect(X.out); n.start(t, X.rnd() * 1.5); n.stop(te + tail + 0.1);
                if (body > 0.01) ring(X, t, f * 1.2, f, 0.01, body * 0.25, 0.05 + s.decay * 0.2);
            } else {
                let bl = 0.05 + s.decay * 0.3;
                SKIN.forEach(([r, aa, dm], i) => { if (f * r < 18000) ring(X, t, f * r * 1.04, f * r, 0.006, body * aa * 0.6, bl * dm, { at: 0.0008 + i * 0.0002 }); });
                hiss(X, t, 'highpass', 3000, 0.7, vel * 0.35, 0.0004, 0.006);
                hiss(X, t + 0.0015, 'bandpass', expo(2500, 8000, s.color), 0.8, a * 0.5, 0.002, snap * 1.2);
                hiss(X, t + 0.0025, 'bandpass', Math.min(16000, expo(2500, 8000, s.color) * 1.9), 0.6, a * 0.3, 0.002, snap);
            }
            snareExtras(X, t, s, vel, f, snap);
        },
        tick(X, t, d, s, vel, m) {
            X = topOf(X, s);
            let c = X.ctx, open = X.o, len = open ? 0.08 + s.odec * 1.12 : 0.012 + s.cdec * 0.15, base = expo(180, 620, s.tone) * semis(X.semi), sc = base / 334;
            let v = c.createGain(), pn = c.createStereoPanner(), into = c.createGain(), at = 0.0006;
            pn.pan.value = (s.swing || 0) * (X.rnd() * 2 - 1) * 0.8; v.connect(pn); pn.connect(X.out);
            const sq = (fs, amp, to) => fs.forEach(fq => { if (fq > 18000) return; let o = c.createOscillator(), og = c.createGain(); o.type = 'square'; o.frequency.value = fq; og.gain.value = amp; o.connect(og); og.connect(to); o.start(t); o.stop(t + len + 0.1); });
            const nz = (amp, to) => { let n = c.createBufferSource(), ng = c.createGain(); n.buffer = X.nb; n.loop = true; ng.gain.value = amp; n.connect(ng); ng.connect(to); n.start(t, X.rnd() * 1.5); n.stop(t + len + 0.1); };
            if (m === 7) {
                let bp = c.createBiquadFilter(), cl = c.createWaveShaper(), hp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = Math.min(16000, 7100 * expo(0.7, 1.4, s.bright)); bp.Q.value = 1.6;
                cl.curve = curve(1.6, 1024); hp.type = 'highpass'; hp.frequency.value = Math.min(16000, expo(5000, 9000, s.bright)); hp.Q.value = 0.8;
                metal(X, t, len, SIX808, sc, 0.32, bp); if (s.metal > 0.02) nz(s.metal * 0.25, bp); bp.connect(into); into.connect(cl); cl.connect(hp); hp.connect(v); into.gain.value = 2.2;
            } else if (m === 8) {
                let hp = c.createBiquadFilter(), cr = c.createWaveShaper(), lp = c.createBiquadFilter(), q = new Float32Array(1024); for (let i = 0; i < 1024; i++) q[i] = Math.round((i / 1023 * 2 - 1) * 32) / 32;
                hp.type = 'highpass'; hp.frequency.value = Math.min(16000, expo(4000, 10000, s.bright)); hp.Q.value = 0.7; cr.curve = q; lp.type = 'lowpass'; lp.frequency.value = 13000; lp.Q.value = 0.5;
                metal(X, t, len, [1, 1.4471, 1.617, 1.9265, 2.5028, 2.6637].map(r => 334 * 1.6 * r), base / 334, 0.16 * (1 - s.metal * 0.6), hp); nz(0.25 + s.metal * 0.6, hp); hp.connect(into); into.gain.value = 1.4; into.connect(cr); cr.connect(lp); lp.connect(v);
            } else {
                let bp = c.createBiquadFilter(), hp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = Math.min(4000, expo(400, 1300, s.tone)); bp.Q.value = 1.4; hp.type = 'highpass'; hp.frequency.value = Math.min(16000, expo(4000, 9000, s.bright));
                nz(1.8, bp); bp.connect(v); metal(X, t, len, SIX808, sc * 1.3, 0.12, hp); nz(0.25 * s.metal, hp); hp.connect(v); at = 0.002; len = Math.min(len, 0.03 + s.cdec * 0.06);
            }
            v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(vel * 0.75, t + at); v.gain.setTargetAtTime(0, t + at, len / 6.9);
            if ((s.shake || 0) > 0.02) hatShake(X, t, s, vel, v, len);
            if (s.choke > 0.5) { if (open) X.chokes.tick = v; else if (X.chokes.tick) { hush(X.chokes.tick.gain, t, 0.005); X.chokes.tick = null; } }
        },
        chime(X, t, d, s, vel, m) {
            X = topOf(X, s);
            let c = X.ctx, f = expo(120, 3200, s.pitch) * semis(X.semi), len = 0.015 + Math.pow(s.decay, 1.7) * 2, dt = 1 + (s.det || 0) * 0.02, dm = s.damp == null ? 0.4 : s.damp, sc = f / 620;
            if (m === 10) {
                let bp = c.createBiquadFilter(), hp = c.createBiquadFilter(), v = c.createGain(), L = 0.05 + s.decay * 0.6; bp.type = 'bandpass'; bp.frequency.value = Math.min(15000, 2640 * sc); bp.Q.value = 2.5; hp.type = 'highpass'; hp.frequency.value = Math.min(8000, 500 * sc);
                [540, 800].forEach(fq => { let o = c.createOscillator(); o.type = 'square'; o.frequency.value = Math.min(16000, fq * sc * dt); o.connect(bp); o.start(t); o.stop(t + 0.05 + L + 0.1); });
                bp.connect(hp); hp.connect(v); v.connect(X.out); v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(vel * 1.3, t + 0.0008); v.gain.setTargetAtTime(vel * 0.4, t + 0.0008, 0.006); v.gain.setTargetAtTime(0, t + 0.03, L / 6.9);
                return;
            }
            if (m === 11) { ring(X, t, f * 4 * 1.03, f * 4, 0.002, vel * 0.95, 0.02 + s.decay * 0.05); pulse(X, t, vel * 0.45, 6000); return; }
            if (m === 12) {
                let L = 0.3 + s.decay * 1.5;
                modal(X, t, f, [[1, 1, 1], [3.99 * dt, 0.3, 0.3], [9.14, 0.1, 0.12]], vel * 0.55, L, dm);
                ring(X, t, f, f, 0, vel * 0.22, L * 1.3, { at: 0.006 });
                hiss(X, t, 'lowpass', Math.min(12000, f * 6), 0.7, vel * (s.strike == null ? 0.3 : s.strike) * 0.4, 0.001, 0.01);
                return;
            }
            if (m === 13) {
                let L = 0.8 + s.decay * 4, mo = s.motor || 0, tr = c.createGain(), v = modal(X, t, f, [[1, 1, 1], [4 * dt, 0.22, 0.4], [10, 0.05, 0.2]], vel * 0.5, L, dm * 0.6, tr);
                tr.connect(X.out); tr.gain.value = 1 - mo * 0.45;
                if (mo > 0.01) { let lf = c.createOscillator(), lg = c.createGain(); lf.frequency.value = 3 + mo * 4; lg.gain.value = mo * 0.45; lf.connect(lg); lg.connect(tr.gain); lf.start(t); lf.stop(t + L + 0.1); }
                strikeOf(X, t, f, s, vel * 0.6);
                return;
            }
            ring(X, t, f * 1.012, f, 0.02, vel * 0.08, 0.04);
            modal(X, t, f, [[1, 1, 1], [2 * dt, 0.75, 0.8], [3, 0.35, 0.5], [4.02, 0.12, 0.3]], vel * 0.4, 0.4 + s.decay * 1.6, dm);
            strikeOf(X, t, f, s, vel);
        },
        steel(X, t, d, s, vel, k) {
            let c = X.ctx, out = X.out, base = expo(250, 900, s.tone) * semis(X.semi), dc = 0.15 + Math.pow(s.decay, 1.3) * 1.9, v = c.createGain(), sh = c.createWaveShaper(), hp = c.createBiquadFilter(), R = rngOf(X);
            sh.curve = curve(1.4 + s.dirt * 8, 1024); hp.type = 'highpass'; hp.frequency.value = expo(1500, 6000, s.bright); hp.Q.value = 0.6; sh.connect(hp); hp.connect(v); v.connect(out); v.gain.value = vel * [1, 1, 1, 1, 1.8, 0.35, 0.55, 0.45, 0.6][k];
            const osc = (fq, amp, L, to, ty) => { if (fq > 18000) return; let o = c.createOscillator(), g = c.createGain(); o.type = ty || 'sine'; o.frequency.value = fq; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp, t + 0.001); g.gain.setTargetAtTime(0, t + 0.001, L / 6.9); o.connect(g); g.connect(to); o.start(t); o.stop(t + L + 0.1); };
            let len;
            if (k === 4) {
                len = 0.4 + dc * 2.4; let sc = base / 474, mx = c.createGain(); mx.gain.value = 0.3;
                metal(X, t, len, SIX808, sc, 1, mx);
                [[3440, 2, 0.35, 0.45], [7100, 2, 1, 0.5], [10500, 0.8, 1.3, 0.35]].forEach(([fq, q, lm, a]) => { let b = c.createBiquadFilter(), g = c.createGain(); b.type = fq > 10000 ? 'highpass' : 'bandpass'; b.frequency.value = Math.min(16000, fq * sc); b.Q.value = q; mx.connect(b); b.connect(g); g.connect(sh); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + 0.001); g.gain.setTargetAtTime(0, t + 0.001, len * lm / 6.9); });
            } else if (k === 5) {
                len = 0.3 + dc * 1.4; let cl = c.createGain(); cl.gain.value = 1; let sd = c.createWaveShaper(); sd.curve = curve(4 + s.dirt * 10, 1024); cl.connect(sd); sd.connect(sh);
                [4.1, 4.6, 5.3, 5.9, 6.6, 7.4].forEach((r, i) => osc(base * r * (1 + (R() - 0.5) * 0.02), 0.18, len * (1 - i * 0.08), cl, 'square'));
                let n = c.createBufferSource(), nb = c.createBiquadFilter(), ng = c.createGain(); n.buffer = X.nb; n.loop = true; nb.type = 'bandpass'; nb.frequency.value = Math.min(12000, base * 5); nb.Q.value = 1.2; n.connect(nb); nb.connect(ng); ng.connect(cl);
                ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(0.6, t + 0.002); ng.gain.setTargetAtTime(0, t + 0.002, len * 0.5 / 6.9); n.start(t, X.rnd()); n.stop(t + len + 0.1);
            } else {
                let ride = k === 7, spl = k === 8, np = ride ? 16 : spl ? 20 : 28; len = spl ? 0.25 + dc * 1.0 : (ride ? 0.6 : 0.5) + dc * (ride ? 3.2 : 2.6); if (spl) base *= 1.7;
                for (let i = 0; i < np; i++) { let fq = base * 2 * Math.pow(16000 / (base * 2), R()), a = (ride ? 0.07 : 0.05) * (0.5 + R()), L = len * Math.pow(base * 2 / fq, 0.35) * (0.6 + R() * 0.6); osc(fq, a, L, sh); }
                let wn = c.createBufferSource(), wf = c.createBiquadFilter(), wg = c.createGain(); wn.buffer = X.nb; wn.loop = true; wf.type = 'highpass'; wf.frequency.value = expo(2500, 9000, s.bright); wf.Q.value = 0.5; wn.connect(wf); wf.connect(wg); wg.connect(sh);
                let wa = (s.hiss == null ? 0.4 : s.hiss) * (ride ? 0.25 : 0.6); wg.gain.setValueAtTime(0, t); wg.gain.linearRampToValueAtTime(wa, t + 0.002); wg.gain.setTargetAtTime(wa * 0.4, t + 0.002, 0.05); wg.gain.setTargetAtTime(0, t + 0.08, len * 0.7 / 6.9);
                let bn = c.createBufferSource(), bf = c.createBiquadFilter(), bg = c.createGain(); bn.buffer = X.nb; bn.loop = true; bf.type = 'highpass'; bf.frequency.value = 8000; bf.Q.value = 0.5; bn.connect(bf); bf.connect(bg); bg.connect(sh);
                bg.gain.setValueAtTime(0, t); bg.gain.linearRampToValueAtTime(wa * 0.6, t + (ride ? 0.03 : 0.07)); bg.gain.setTargetAtTime(0, t + (ride ? 0.03 : 0.07), len * 0.8 / 6.9);
                wn.start(t, X.rnd()); wn.stop(t + len + 0.1); bn.start(t, X.rnd()); bn.stop(t + len + 0.1);
                hiss(X, t, 'bandpass', ride ? 5000 : 3000, 1.2, vel * (ride ? 0.35 : 0.2), 0.0005, ride ? 0.02 : 0.012);
                if (ride) osc(base * 6.1, 0.05, 0.25, sh);
            }
            if (s.bell > 0.02) [2.4, 3.31, 4.7].forEach((r, i) => osc(base * r * 2, vel * s.bell * 0.12 / (i + 1), len * 0.6, out));
            return v;
        }
    };
    const steelGrab = (X, t, s, v) => { let CH = X.chokes; if (!CH || !v) return; if ((s.grab || 0) >= 0.5) { let pv = CH.steel; if (pv && pv.t < t) hush(pv.g.gain, t, 0.012); CH.steel = { g: v, t }; } };
    const PIC = new Map(), PICLAST = {}; let picQ = null, picBusy = false;
    const picKey = (id, s, semi, o) => id + '|' + (semi || 0) + '|' + (o ? 1 : 0) + '|' + Object.keys(s).filter(k => k[0] !== '_' && typeof s[k] === 'number').sort().map(k => k + ':' + s[k].toFixed(3)).join(',');
    function hitPic(v, s, semi, o) {
        let key = picKey(v.id, s, semi, o), e = PIC.get(key); if (e) { PICLAST[v.id] = e; return e; }
        if (!picQ || picQ.key !== key) picQ = { key, v, s: JSON.parse(JSON.stringify(s)), semi: semi || 0, o: !!o, at: performance.now() };
        if (!picBusy) { picBusy = true; setTimeout(picRun, 100); }
        return PICLAST[v.id] || null;
    }
    async function picRun() {
        let q = picQ; if (!q) { picBusy = false; return; }
        if (performance.now() - q.at < 90) { setTimeout(picRun, 60); return; }
        picQ = null;
        try {
            let drum = q.v.kind === 'drum', sr = 32000, L = drum ? 2.5 : 3, c = new OfflineAudioContext(1, Math.round(sr * L), sr), out = c.createGain(); out.connect(c.destination);
            let nb = c.createBuffer(1, sr * 2, sr), nd = nb.getChannelData(0), a = 99991; for (let i = 0; i < nd.length; i++) { a = a * 16807 % 2147483647; nd[i] = a / 1073741823.5 - 1; }
            if (q.v.pwk && window.NBFX && NBFX.ready) await NBFX.ready(c);
            let keep = RS; RS = 7771;
            let X = { ctx: c, out, nb, mono: {}, chokes: {}, bpm: 120, root: 0, semi: q.semi, sl: 0, ac: 0, o: q.o, rnd: rr, wh: 0 };
            try { if (drum) PLAY[q.v.id](X, 0.005, 0.25, q.s, 0.85, [60]); else PLAY[q.v.id](X, 0.005, 1.2, q.s, 0.85, [60]); } finally { RS = keep; }
            let b = await c.startRendering(), d = b.getChannelData(0), n = d.length, pk = 0, pi = 0;
            for (let i = 0; i < n; i++) { let x = Math.abs(d[i]); if (x > pk) { pk = x; pi = i; } }
            let last = 0; for (let i = n - 1; i >= 0; i--) if (Math.abs(d[i]) > pk * 0.001) { last = i; break; }
            let span = Math.max(0.05, Math.min(L, (last / sr) * 1.08)), cols = 240, env = new Float32Array(cols), m = Math.round(span * sr);
            for (let j = 0; j < cols; j++) { let i0 = Math.floor(j / cols * m), i1 = Math.floor((j + 1) / cols * m), mx = 0; for (let i = i0; i < i1 && i < n; i++) mx = Math.max(mx, Math.abs(d[i])); env[j] = mx; }
            let W = 4096, s0 = Math.max(0, Math.min(n - W, pi - 256)), bands = 56, spec = new Float32Array(bands), win = new Float32Array(W);
            for (let i = 0; i < W; i++) win[i] = d[s0 + i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / W));
            for (let j = 0; j < bands; j++) { let f = 30 * Math.pow(14000 / 30, j / (bands - 1)), w0 = 2 * Math.PI * f / sr, cw = 2 * Math.cos(w0), s1 = 0, s2 = 0; for (let i = 0; i < W; i++) { let s3 = win[i] + cw * s1 - s2; s2 = s1; s1 = s3; } spec[j] = Math.sqrt(Math.max(0, s1 * s1 + s2 * s2 - cw * s1 * s2)); }
            let sm = 0, top = 0; spec.forEach((x, j) => { if (x > sm) { sm = x; top = j; } });
            let e = { env, spec, pk, span, hz: 30 * Math.pow(14000 / 30, top / (bands - 1)), sm };
            PIC.set(q.key, e); PICLAST[q.v.id] = e; if (PIC.size > 80) PIC.delete(PIC.keys().next().value);
        } catch (err) {}
        if (picQ) setTimeout(picRun, 30); else picBusy = false;
    }
    const kindNames = fmt => { let o = []; for (let i = 0; i < 128; i++) { let t = fmt((i + 0.5) / 128); if (o[o.length - 1] !== t) o.push(t); } return o; };
    const NOTE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], noteOf = f => NOTE[((Math.round(12 * Math.log2(f / 440)) + 69) % 12 + 12) % 12];
    function picDraw(v, x, w, h, s, D, semi, o) {
        let A = D && D.A || '#ff2a6d', B = D && D.B || '#ff8ac8';
        x.fillStyle = '#060406'; x.fillRect(0, 0, w, h); let g0 = x.createRadialGradient(w * 0.2, h * 0.55, 4, w * 0.2, h * 0.55, w * 0.7); g0.addColorStop(0, 'rgba(255,60,120,0.12)'); g0.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g0; x.fillRect(0, 0, w, h);
        let P = hitPic(v, s, semi, o), kq = v.p.find(q => q[0] === 'model' || q[0] === 'kind' || q[0] === 'type'), kind = kq ? kindNames(kq[3])[Math.min(kindNames(kq[3]).length - 1, Math.floor((s[kq[0]] == null ? kq[2] : s[kq[0]]) * kindNames(kq[3]).length))] : '';
        x.font = 'bold 9px Courier New'; x.fillStyle = B;
        let head = v.en + (kind ? ' · ' + String(kind).toUpperCase() : '');
        if (!P) { x.fillText(head + ' · listening…', 6, 11); return; }
        let wl = Math.round(w * 0.64), mid = (h + 8) / 2, hh = (h - 26) / 2, sc = 1 / Math.max(0.05, P.pk);
        let step = P.span > 2 ? 1 : P.span > 0.6 ? 0.25 : 0.05; x.strokeStyle = 'rgba(255,255,255,0.06)'; x.lineWidth = 1;
        for (let tt = step; tt < P.span; tt += step) { let px = 6 + tt / P.span * (wl - 12); x.beginPath(); x.moveTo(px, 16); x.lineTo(px, h - 10); x.stroke(); }
        x.beginPath(); x.moveTo(6, mid); x.lineTo(wl - 6, mid); x.stroke();
        let gr = x.createLinearGradient(0, mid - hh, 0, mid + hh); gr.addColorStop(0, A); gr.addColorStop(0.5, B); gr.addColorStop(1, A);
        x.fillStyle = gr; x.globalAlpha = 0.35; x.beginPath(); x.moveTo(6, mid);
        let N = P.env.length; for (let j = 0; j < N; j++) x.lineTo(6 + j / (N - 1) * (wl - 12), mid - Math.min(1, P.env[j] * sc) * hh);
        for (let j = N - 1; j >= 0; j--) x.lineTo(6 + j / (N - 1) * (wl - 12), mid + Math.min(1, P.env[j] * sc) * hh);
        x.closePath(); x.fill(); x.globalAlpha = 1;
        x.strokeStyle = B; x.lineWidth = 1.2; x.beginPath(); for (let j = 0; j < N; j++) { let px = 6 + j / (N - 1) * (wl - 12), py = mid - Math.min(1, P.env[j] * sc) * hh; j ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke();
        let sx = wl + 6, sw = w - sx - 6, nb2 = P.spec.length, bw = sw / nb2;
        x.fillStyle = 'rgba(255,255,255,0.04)'; x.fillRect(sx, 16, sw, h - 26);
        for (let j = 0; j < nb2; j++) { let db = 20 * Math.log10(P.spec[j] / (P.sm || 1) + 1e-9), u = Math.max(0, 1 + db / 48), bh = u * (h - 28); x.fillStyle = j === P.spec.indexOf(P.sm) ? '#fff' : A; x.globalAlpha = 0.25 + u * 0.7; x.fillRect(sx + j * bw, h - 10 - bh, Math.max(1, bw - 0.5), bh); }
        x.globalAlpha = 1; x.font = '8px Courier New'; x.fillStyle = 'rgba(255,255,255,0.35)';
        [[100, '100'], [1000, '1k'], [10000, '10k']].forEach(([f, t2]) => { let u = Math.log(f / 30) / Math.log(14000 / 30); x.fillText(t2, sx + u * sw - 6, h - 1); });
        x.fillText('0', 4, h - 1); x.fillText(P.span < 1 ? Math.round(P.span * 1000) + 'ms' : P.span.toFixed(2) + 's', wl - 34, h - 1);
        x.font = 'bold 9px Courier New'; x.fillStyle = B;
        let line = [head + ' · rings ' + (P.span < 1 ? Math.round(P.span * 1000) + 'ms' : P.span.toFixed(2) + 's') + ' · loudest at ' + (P.hz < 1000 ? Math.round(P.hz) + 'hz' : (P.hz / 1000).toFixed(1) + 'k') + (P.hz < 2000 ? ' (' + noteOf(P.hz) + ')' : ''), head + ' · ' + (P.span < 1 ? Math.round(P.span * 1000) + 'ms' : P.span.toFixed(2) + 's'), head].find(q => x.measureText(q).width < w - 12) || v.en;
        x.fillText(line, 6, 11);
    }
    const ANVC = new Map(), ANV = k => { let r = Math.round(k * 4) / 4, c = ANVC.get(r); if (!c) { c = curve(r, 2048); ANVC.set(r, c); } return c; };
    const ANVH = k => { let r = 'h' + Math.round(k * 4) / 4, c = ANVC.get(r); if (!c) { c = new Float32Array(2048); for (let i = 0; i < 2048; i++) { let x = (i / 2047 * 2 - 1) * Math.round(k * 4) / 4, a = Math.abs(x); c[i] = Math.sign(x) * (a < 0.8 ? a : a > 1.2 ? 1 : 0.8 + (a - 0.8) - (a - 0.8) * (a - 0.8) / 0.8) / 1.0; } ANVC.set(r, c); } return c; };
    function chorusOf(c, from, to) {
        let sp = c.createChannelSplitter(2), mg = c.createChannelMerger(2), dry = c.createGain(), wet = c.createGain(), o = { dry, wet };
        from.connect(dry); dry.connect(to); from.connect(sp);
        [0, 1].forEach(k => { let d = c.createDelay(0.05), lfo = c.createOscillator(), dg = c.createGain(); d.delayTime.value = 0.012; lfo.type = 'sine'; lfo.frequency.value = 0.8; dg.gain.value = 0;
            lfo.connect(dg); dg.connect(d.delayTime); sp.connect(d, k); d.connect(mg, 0, k); lfo.start(0); o['l' + k] = lfo; o['g' + k] = dg; });
        mg.connect(wet); wet.connect(to);
        o.set = (t, amt, rate) => { const at = (prm, v) => { try { prm.setValueAtTime(v, Math.max(0, t - 0.002)); } catch (e) { prm.value = v; } };
            at(wet.gain, amt * 0.7); at(dry.gain, 1 - amt * 0.3); [0, 1].forEach(k => { at(o['l' + k].frequency, rate * (k ? 1.07 : 1)); at(o['g' + k].gain, (k ? -1 : 1) * amt * 0.0045); }); };
        return o;
    }
    function razorRig(X, t, s) {
        let c = X.ctx, m = X.mono.razor;
        if (!m) {
            const bq = (ty, f, q) => { let b = c.createBiquadFilter(); b.type = ty; b.frequency.value = f; b.Q.value = q; return b; };
            m = X.mono.razor = { in: c.createGain(), hp: bq('highpass', 110, 0.7), bst: bq('peaking', 720, 0.9), tb: bq('lowshelf', 100, 0.7), tm: bq('peaking', 650, 0.8), tt: bq('highshelf', 3000, 0.7), tp: bq('highshelf', 5000, 0.7),
                c1: bq('highpass', 80, 0.7), c2: bq('peaking', 110, 1.2), c3: bq('peaking', 2200, 1), c4: bq('notch', 4800, 2), c5: bq('lowpass', 5500, 0.7), c6: bq('lowpass', 5500, 0.7), gt: c.createGain(), lv: c.createGain(), gEnd: 0 };
            if (c._nbwk) { try { m.amp = new AudioWorkletNode(c, 'nb-amp', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] }); } catch (e) { m.amp = null; } }
            if (!m.amp) { m.sh = c.createWaveShaper(); m.sh.oversample = '2x'; m.ck = ''; }
            [m.in, m.hp, m.bst, m.amp || m.sh, m.gt, m.tb, m.tm, m.tt, m.tp, m.c1, m.c2, m.c3, m.c4, m.c5, m.c6, m.lv].reduce((a, b) => { a.connect(b); return b; }); m.ch = chorusOf(c, m.lv, X.out);
        }
        const V = (k, d0) => s[k] == null ? d0 : s[k], at = (prm, v) => { try { prm.setValueAtTime(v, Math.max(0, t - 0.002)); } catch (e) { prm.value = v; } };
        const md = Math.min(3, Math.floor(V('amp', 0.6) * 4)), g = expo(0.5, 60, V('gain', 0.65)), cab = Math.min(3, Math.floor(V('cab', 0) * 4)), C = [[80, 110, 4, 3, 4800, 5500], [90, 150, 3, 4, 5600, 6500], [110, 180, 2, 5, 6000, 7500], [10, 100, 0, 0, 20000, 20000]][cab];
        at(m.hp.frequency, expo(40, 400, V('tight', 0.45))); at(m.bst.gain, V('boost', 0.5) * 12);
        if (m.amp) { at(m.amp.parameters.get('gain'), g); at(m.amp.parameters.get('model'), md); at(m.amp.parameters.get('sag'), 0.35); at(m.amp.parameters.get('tight'), 20); }
        else { let k = md + ':' + Math.round(V('gain', 0.65) * 30); if (k !== m.ck) { m.ck = k; let n = 2048, cv = new Float32Array(n), q = g * [0.35, 2, 8, 20][md]; for (let i = 0; i < n; i++) cv[i] = Math.tanh((i / (n - 1) * 2 - 1) * q); m.sh.curve = cv; } }
        at(m.tb.gain, -10 + V('bass', 0.5) * 20); at(m.tm.gain, -10 + V('mid', 0.5) * 20); at(m.tt.gain, -10 + V('treble', 0.5) * 20); at(m.tp.gain, -6 + V('pres', 0.5) * 12);
        at(m.c1.frequency, C[0]); at(m.c2.frequency, C[1]); at(m.c2.gain, C[2]); at(m.c3.gain, cab === 3 ? 0 : C[3]); m.c4.type = cab === 3 ? 'allpass' : 'notch'; at(m.c4.frequency, C[4]); at(m.c5.frequency, C[5]); at(m.c6.frequency, C[5]);
        let K = g * [0.35, 0.9, 2.2, 3.5][md] * (md >= 1 ? [1, 2.2, 4, 6][md] : 1), nm = 1 / Math.max(0.35, Math.tanh(K * 0.4));
        at(m.lv.gain, Math.pow(10, [-4, -3, -4.7, -5.2][md] / 20) * nm * V('vol', 0.75) * 0.8);
        m.ch.set(t, V('chor', 0), 0.3 + V('crate', 0.3) * 3);
        return m;
    }
    const SC = new Map(); function scurve(k) { k = Math.round(k * 4) / 4; let c = SC.get(k); if (!c) { c = curve(k, 2048); SC.set(k, c); } return c; }
    function spineRig(X, t, s) {
        let c = X.ctx, m = X.mono.spine;
        if (!m) {
            const bq = (ty, f, q) => { let b = c.createBiquadFilter(); b.type = ty; b.frequency.value = f; b.Q.value = q; return b; };
            m = X.mono.spine = { in: c.createGain(), hp: bq('highpass', 25, 0.7), cp: c.createDynamicsCompressor(), mk: c.createGain(), pre: c.createGain(), sh: c.createWaveShaper(), lo: bq('lowshelf', 90, 0.7), md: bq('peaking', 800, 0.9), cl: bq('highshelf', 2500, 0.7), lp: bq('lowpass', 9000, 0.6), lv: c.createGain() };
            m.sh.oversample = '2x';
            m.cp.knee.value = 8; m.cp.attack.value = 0.006; m.cp.release.value = 0.16;
            [m.in, m.hp, m.cp, m.mk, m.pre, m.sh, m.lo, m.md, m.cl, m.lp, m.lv].reduce((a, b) => { a.connect(b); return b; }); m.ch = chorusOf(c, m.lv, X.out);
        }
        const V = (k, d0) => s[k] == null ? d0 : s[k], at = (prm, v) => { try { prm.setValueAtTime(v, Math.max(0, t - 0.002)); } catch (e) { prm.value = v; } };
        let q = V('comp', 0.5); at(m.cp.threshold, -4 - q * 30); at(m.cp.ratio, 1 + q * 5); at(m.mk.gain, Math.pow(10, q * 14 / 20));
        let g = V('grit', 0.2), k = Math.round((1 + g * g * 24) * 4) / 4; if (m.k !== k) { m.k = k; m.sh.curve = scurve(k); } at(m.pre.gain, 1 + g * 3);
        at(m.lo.gain, -8 + V('lows', 0.5) * 16); at(m.md.gain, -10 + V('mids', 0.5) * 20); at(m.md.frequency, expo(300, 2000, V('midf', 0.4))); at(m.cl.gain, -8 + V('clank', 0.5) * 18); at(m.lp.frequency, expo(2000, 16000, V('top', 0.6)));
        at(m.lv.gain, V('vol', 0.75) * 0.5 / (0.6 + g * 1.6)); m.ch.set(t, V('chor', 0), 0.3 + V('crate', 0.3) * 3);
        return m;
    }
    function razorGate(m, X, tt, end, s) {
        let G = m.gt.gain, k = s.gate == null ? 0.7 : s.gate, shut = Math.pow(10, -k * 60 / 20);
        if (X.hold) { G.cancelScheduledValues(tt); G.setTargetAtTime(1, tt, 0.0008); m.gEnd = 1e9; return; }
        if (tt >= m.gEnd) { G.cancelScheduledValues(tt); G.setValueAtTime(shut, tt); }
        else G.cancelScheduledValues(tt);
        G.setTargetAtTime(1, tt, 0.0008);
        m.gEnd = tt < m.gEnd ? Math.max(m.gEnd, end) : end;
        G.setTargetAtTime(shut, m.gEnd, 0.012 + (1 - k) * 0.06);
    }
    const PLAY = {
        anvil(X, t, d, s, vel) {
            const CH = X.chokes; X = topOf(X, s);
            const V = (k, x0) => s[k] == null ? x0 : s[k];
            let c = X.ctx, out = X.out, k = semis(X.semi), end = expo(30, 90, V('tune', 0.35)) * k, start = end * Math.pow(2, V('drop', 0.5) * 5), dt = 0.005 + V('dtime', 0.3) * 0.195;
            let pl = 0.03 + V('punch', 0.3) * 0.37, tl = V('tail', 0) > 0.01 ? 0.05 + V('tlen', 0.4) * 1.45 : 0, bend = V('bend', 0.5), vv = vel * V('vol', 0.75) * 1.3, glue = V('glue', 0);
            let o = c.createOscillator(), pg = c.createGain(), ps = c.createWaveShaper(), eq = c.createBiquadFilter(), bt = c.createBiquadFilter(), mix = c.createGain(), gl = c.createWaveShaper(), go = c.createGain(), nodes = [o];
            o.frequency.setValueAtTime(start, t);
            if (bend > 0.6) o.frequency.setTargetAtTime(end, t, dt / 4); else if (bend < 0.4) { o.frequency.linearRampToValueAtTime(start * 0.6 + end * 0.4, t + dt * 0.6); o.frequency.exponentialRampToValueAtTime(end, t + dt); } else o.frequency.exponentialRampToValueAtTime(end, t + dt);
            if (tl) o.frequency.setTargetAtTime(end * semis(-V('tbend', 0.1) * 12), t + pl, tl * 0.5);
            ps.curve = ANV(1 + V('dirt', 0.2) * 10); ps.oversample = '2x';
            eq.type = 'lowshelf'; eq.frequency.value = 70; eq.gain.value = -6 + V('weight', 0.5) * 18; bt.type = 'peaking'; bt.frequency.value = 3200; bt.Q.value = 0.9; bt.gain.value = V('bite', 0.3) * 12;
            pg.gain.setValueAtTime(0.0001, t); pg.gain.exponentialRampToValueAtTime(1, t + 0.0015); pg.gain.setValueAtTime(1, t + pl * 0.6); pg.gain.exponentialRampToValueAtTime(0.0002, t + pl + (tl ? 0.02 : pl * 0.6));
            o.connect(pg); pg.connect(ps); ps.connect(mix);
            if (tl) {
                let tg = c.createGain(), hp = c.createBiquadFilter(), p1 = c.createBiquadFilter(), d1 = c.createWaveShaper(), p2 = c.createBiquadFilter(), d2 = c.createWaveShaper(), rg = c.createBiquadFilter(), lp = c.createBiquadFilter(), lp2 = c.createBiquadFilter(), tm = expo(250, 3000, V('tform', 0.5)), dr = V('tdirt', 0.6), mv = (V('tmove', 0.5) - 0.5) * 4;
                hp.type = 'highpass'; hp.frequency.value = expo(20, 400, V('tcut', 0.2)); hp.Q.value = 0.6;
                p1.type = 'peaking'; p1.frequency.setValueAtTime(tm, t); p1.Q.value = 1.1; p1.gain.value = 6 + dr * 12;
                if (Math.abs(mv) > 0.05) { p1.frequency.setValueAtTime(tm, t + pl); p1.frequency.exponentialRampToValueAtTime(Math.min(9000, tm * Math.pow(2, mv)), t + pl + tl * 0.8); }
                d1.curve = ANV(1 + dr * 14); d1.oversample = '2x';
                p2.type = 'peaking'; p2.frequency.value = tm * 0.5; p2.Q.value = 0.8; p2.gain.value = 4 + dr * 4;
                d2.curve = ANVH(1 + dr * dr * 8); d2.oversample = '2x';
                rg.type = 'peaking'; rg.frequency.value = Math.min(12000, tm * 1.6); rg.Q.value = 2 + V('tres', 0.3) * 10; rg.gain.value = V('tres', 0.3) * 14;
                lp.type = 'lowpass'; lp.frequency.value = expo(200, 8000, V('ttone', 0.5)); lp.Q.value = 0.7; lp2.type = 'lowpass'; lp2.frequency.value = 14000; lp2.Q.value = 0.5;
                let ta = V('tail', 0) * 0.5; tg.gain.setValueAtTime(0.0001, t); tg.gain.setValueAtTime(0.0001, t + pl * 0.7); tg.gain.exponentialRampToValueAtTime(ta, t + pl); tg.gain.setValueAtTime(ta, t + pl + tl * 0.5); tg.gain.linearRampToValueAtTime(ta * 0.55, t + pl + tl * 0.85); tg.gain.exponentialRampToValueAtTime(0.0002, t + pl + tl);
                o.connect(tg); tg.connect(hp); hp.connect(p1); p1.connect(d1); d1.connect(p2); p2.connect(d2); d2.connect(rg); rg.connect(lp); lp.connect(lp2); lp2.connect(mix);
            }
            let gt = c.createBiquadFilter(); gt.type = 'lowpass'; gt.frequency.value = tl ? Math.min(16000, expo(200, 8000, V('ttone', 0.5)) * 2.2) : 16000; gt.Q.value = 0.6;
            go.gain.value = vv / (1 + glue * 0.5); mix.gain.value = 1; mix.connect(eq);
            if (glue > 0.01) { gl.curve = ANV(1 + glue * 3); gl.oversample = '2x'; eq.connect(gl); gl.connect(gt); } else eq.connect(gt);
            gt.connect(bt); bt.connect(go); go.connect(out);
            if (CH) { let pv = CH.anvil; if (pv && pv.t < t) { try { pv.g.gain.cancelScheduledValues(t); pv.g.gain.setValueAtTime(pv.v, t); pv.g.gain.setTargetAtTime(0, t, 0.004); } catch (e) {} (pv.src || []).forEach(q => { try { q.stop(t + 0.03); } catch (e) {} }); } CH.anvil = { g: go, t, v: go.gain.value, src: nodes }; }
            let len = pl + tl + 0.08; o.start(t); o.stop(t + len);
            if (V('click', 0.4) > 0.01) noiseHit(X, t, 'bandpass', expo(1000, 10000, V('ctone', 0.5)), 0.8, V('click', 0.4) * 0.9, 0.0005, 0.012, bt);
            if (V('tok', 0.2) > 0.01) { let q = c.createOscillator(), g = c.createGain(); q.frequency.setValueAtTime(expo(1000, 10000, V('ctone', 0.5)) * 0.6, t); q.frequency.exponentialRampToValueAtTime(start * 1.5, t + 0.006); g.gain.setValueAtTime(V('tok', 0.2) * 0.6, t); g.gain.exponentialRampToValueAtTime(0.0003, t + 0.012); q.connect(g); g.connect(bt); q.start(t); q.stop(t + 0.02); }
            if (V('rumble', 0) > 0.01) { let rl = 0.15 + V('rlen', 0.4) * 1.45, n = c.createBufferSource(), b1 = c.createBiquadFilter(), b2 = lowCut(c, 30, 1), rg = c.createGain(), rs = c.createWaveShaper(), rl2 = c.createBiquadFilter(), dp = c.createBiquadFilter();
                n.buffer = X.nb; n.loop = true; b1.type = 'lowpass'; b1.frequency.value = Math.max(60, end * 2.2); b1.Q.value = 3;
                rg.gain.setValueAtTime(0.0001, t); rg.gain.setValueAtTime(0.0001, t + 0.03); rg.gain.exponentialRampToValueAtTime(V('rumble', 0) * 1.4, t + 0.11); rg.gain.setTargetAtTime(0.0001, t + 0.11, rl * 0.35);
                rs.curve = ANV(3); rs.oversample = '2x'; rl2.type = 'lowpass'; rl2.frequency.value = 260; rl2.Q.value = 0.7; dp.type = 'peaking'; dp.frequency.value = 200; dp.Q.value = 1.2; dp.gain.value = -5;
                n.connect(b1); b1.connect(b2); b2.connect(rg); rg.connect(rs); rs.connect(rl2); rl2.connect(dp); dp.connect(mix); n.start(t, X.rnd() * 1.5); n.stop(t + 0.15 + rl * 1.6); nodes.push(n); }
            if (V('metal', 0) > 0.01) { let mt = expo(300, 4000, V('mtone', 0.5)), mb = c.createBiquadFilter(), mg = c.createGain(), ms = c.createWaveShaper();
                mb.type = 'bandpass'; mb.frequency.value = mt * 1.3; mb.Q.value = 1.4; ms.curve = ANV(2); mg.gain.setValueAtTime(V('metal', 0) * 0.7, t); mg.gain.exponentialRampToValueAtTime(0.0003, t + 0.05 + V('metal', 0) * 0.2);
                [1, 1.47, 2.09].forEach(r => { let q = c.createOscillator(); q.type = 'square'; q.frequency.value = mt * r; q.connect(mb); q.start(t); q.stop(t + 0.3); nodes.push(q); }); mb.connect(ms); ms.connect(mg); mg.connect(bt); }
        },
        stomp(X, t, d, s, vel) {
            { let m = mdl(s, 9); if (m >= 6) return DRUM2.stomp(X, t, d, s, vel, m); if (m) return DRUM.stomp(X, t, d, s, vel); }
            X = topOf(X, s);
            let c = X.ctx, out = X.out, end = expo(30, 90, s.tune) * semis(X.semi), start = end * (1 + s.pitch * 11), pt = 0.008 + s.ptime * 0.15, len = 0.06 + Math.pow(s.decay, 1.6) * 1.74;
            let o = c.createOscillator(), v = c.createGain(), sh = c.createWaveShaper();
            o.type = s.shape > 0.6 ? 'triangle' : 'sine';
            sh.curve = curve(1 + s.drive * 8 + (s.shape > 0.85 ? 6 : 0), 1024); sh.oversample = '2x';
            o.frequency.setValueAtTime(start, t); o.frequency.exponentialRampToValueAtTime(end, t + pt); o.frequency.setTargetAtTime(end * 0.92, t + pt, len * 0.6);
            v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(vel, t + 0.002); v.gain.setTargetAtTime(vel * 0.7, t + 0.004, len * 0.25); v.gain.exponentialRampToValueAtTime(0.0001, t + len);
            o.connect(sh); sh.connect(v); v.connect(out); o.start(t); o.stop(t + len + 0.05);
            if (s.click > 0.01) {
                let n = c.createBufferSource(), f = c.createBiquadFilter(), nv = c.createGain(); n.buffer = X.nb; f.type = 'highpass'; f.frequency.value = expo(800, 9000, s.ctone);
                nv.gain.setValueAtTime(s.click * 0.7 * vel, t); nv.gain.exponentialRampToValueAtTime(0.0005, t + 0.006 + (1 - s.ctone) * 0.01);
                n.connect(f); f.connect(nv); nv.connect(out); n.start(t, rr()); n.stop(t + 0.03);
            }
            kickExtras(X, t, s, vel, end, len);
        },
        slap(X, t, d, s, vel) {
            { let m = mdl(s, 12); if (m >= 8) return DRUM2.slap(X, t, d, s, vel, m); if (m) return DRUM.slap(X, t, d, s, vel); }
            X = topOf(X, s);
            let c = X.ctx, out = X.out, clap = s.mode, snare = 1 - s.mode, k = semis(X.semi);
            if (s.body > 0.01 && snare > 0.05) {
                let o = c.createOscillator(), o2 = c.createOscillator(), v = c.createGain(), f = expo(110, 340, s.tone) * k, len = 0.04 + s.decay * 0.56;
                o.type = 'triangle'; o2.type = 'sine'; o.frequency.setValueAtTime(f * 1.6, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.02); o2.frequency.value = f * 1.52;
                v.gain.setValueAtTime(s.body * snare * vel * 0.8, t); v.gain.exponentialRampToValueAtTime(0.0005, t + len);
                o.connect(v); o2.connect(v); v.connect(out); o.start(t); o2.start(t); o.stop(t + len + 0.05); o2.stop(t + len + 0.05);
            }
            let n = c.createBufferSource(), bp = c.createBiquadFilter(), hp = c.createBiquadFilter(), v = c.createGain(), snap = 0.04 + s.snap * 0.46, a = s.noise * vel;
            n.buffer = X.nb; bp.type = 'bandpass'; bp.frequency.value = Math.min(16000, expo(700, 7000, s.color) * k); bp.Q.value = 0.6 + clap * 0.8; hp.type = 'highpass'; hp.frequency.value = 400;
            v.gain.setValueAtTime(0, t);
            if (clap > 0.05) { let sp = 0.005 + s.spread * 0.02, nc = s.claps == null ? 3 : 1 + Math.round(s.claps * 7); Array.from({ length: nc }, (z, q) => q).forEach(q => { v.gain.setValueAtTime(a * clap, t + q * sp); v.gain.exponentialRampToValueAtTime(a * clap * 0.12, t + q * sp + 0.008); }); v.gain.setValueAtTime(a * Math.max(clap, snare) * 0.9, t + nc * sp); }
            else v.gain.setValueAtTime(a, t);
            v.gain.exponentialRampToValueAtTime(0.0005, t + (clap > 0.05 ? 0.03 : 0) + snap);
            n.connect(hp); hp.connect(bp); bp.connect(v); v.connect(out); n.start(t, rr()); n.stop(t + snap + 0.1);
            snareExtras(X, t, s, vel, expo(110, 340, s.tone) * k, snap);
        },
        tick(X, t, d, s, vel) {
            { let m = mdl(s, 10); if (m >= 7) return DRUM2.tick(X, t, d, s, vel, m); if (m) return DRUM.tick(X, t, d, s, vel); }
            X = topOf(X, s);
            let c = X.ctx, out = X.out, open = X.o, len = open ? 0.08 + s.odec * 1.12 : 0.012 + s.cdec * 0.15;
            let v = c.createGain(), hp = c.createBiquadFilter(), pk = c.createBiquadFilter(), base = expo(180, 620, s.tone) * semis(X.semi);
            hp.type = 'highpass'; hp.frequency.value = Math.min(18000, expo(3500, 13000, s.bright)); pk.type = 'peaking'; pk.frequency.value = Math.min(18000, expo(6000, 12000, s.bright)); pk.gain.value = s.sizz == null ? 5 : s.sizz * 10;
            // the hihat recipe. weird numbers = metal sound apparently
            if (s.metal < 0.98) [2, 3, 4.16, 5.43, 6.79, 8.21].forEach(r => { let o = c.createOscillator(); o.type = 'square'; o.frequency.value = base * r; let og = c.createGain(); og.gain.value = (1 - s.metal) * 0.18; o.connect(og); og.connect(hp); o.start(t); o.stop(t + len + 0.05); });
            if (s.metal > 0.02) { let n = c.createBufferSource(), ng = c.createGain(); n.buffer = X.nb; ng.gain.value = s.metal * 0.9; n.connect(ng); ng.connect(hp); n.start(t, rr()); n.stop(t + len + 0.05); }
            v.gain.setValueAtTime(vel * 0.7, t); v.gain.exponentialRampToValueAtTime(0.0005, t + len);
            let pn = c.createStereoPanner(); pn.pan.value = (s.swing || 0) * (X.rnd() * 2 - 1) * 0.8; hp.connect(pk); pk.connect(v); v.connect(pn); pn.connect(out);
            if ((s.shake || 0) > 0.02) hatShake(X, t, s, vel, hp, len);
            if (s.choke > 0.5) { if (open) X.chokes.tick = v; else if (X.chokes.tick) { hush(X.chokes.tick.gain, t, 0.005); X.chokes.tick = null; } }
        },
        chime(X, t, d, s, vel) {
            { let m = mdl(s, 15); if (m >= 10) return DRUM2.chime(X, t, d, s, vel, m); if (m) return DRUM.chime(X, t, d, s, vel); }
            X = topOf(X, s);
            let c = X.ctx, out = X.out, f = expo(120, 3200, s.pitch) * semis(X.semi);
            let ratio = [0.5, 1, 1.41, 2, 2.76, 3.5, 5.19, 7][Math.min(7, Math.floor(s.ratio * 8))], len = 0.015 + Math.pow(s.decay, 1.7) * 2;
            let car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), v = c.createGain();
            mod.frequency.value = f * ratio; mg.gain.setValueAtTime(f * s.index * 10, t); mg.gain.exponentialRampToValueAtTime(Math.max(1, f * s.index * 0.5), t + len * 0.6);
            car.frequency.setValueAtTime(f * (1 + (s.bend - 0.5) * 0.6), t); car.frequency.exponentialRampToValueAtTime(f, t + 0.03);
            mod.connect(mg); mg.connect(car.frequency); car.connect(v);
            v.gain.setValueAtTime(vel * 0.5, t); v.gain.exponentialRampToValueAtTime(0.0005, t + len);
            v.connect(out); car.start(t); mod.start(t); car.stop(t + len + 0.05); mod.stop(t + len + 0.05);
            if ((s.det || 0) > 0.01) { let c2 = c.createOscillator(), g2 = c.createGain(); c2.frequency.value = f * (1 + s.det * 0.03); mg.connect(c2.frequency); g2.gain.setValueAtTime(vel * 0.35, t); g2.gain.exponentialRampToValueAtTime(0.0005, t + len); c2.connect(g2); g2.connect(out); c2.start(t); c2.stop(t + len + 0.05); }
            strikeOf(X, t, f, s, vel);
        },
        squirm(X, t, d, s, vel, notes) {
            if ((s.eng == null ? 1 : s.eng) >= 0.5 && X.ctx._nbwk && acid(X, t, d, s, vel, notes)) return;
            let c = X.ctx, m = X.mono.squirm;
            if (!m) {
                m = X.mono.squirm = { saw: c.createOscillator(), sq: c.createOscillator(), sub: c.createOscillator(), gs: c.createGain(), gq: c.createGain(), gb: c.createGain(), f1: c.createBiquadFilter(), f2: c.createBiquadFilter(), sh: c.createWaveShaper(), vca: c.createGain() };
                m.saw.type = 'sawtooth'; m.sq.type = 'square'; m.sub.type = 'square'; m.f1.type = 'lowpass'; m.f2.type = 'lowpass'; m.vca.gain.value = 0; m.sh.oversample = '2x';
                m.saw.connect(m.gs); m.sq.connect(m.gq); m.sub.connect(m.gb); [m.gs, m.gq, m.gb].forEach(x => x.connect(m.f1)); m.f1.connect(m.f2); m.f2.connect(m.sh); m.sh.connect(m.vca); m.vca.connect(X.out);
                [m.saw, m.sq, m.sub].forEach(o => o.start(t));
            }
            let note = notes[0] + octOf(s.oct) * 12, f = hz(note), ac = X.ac, slid = X.sl && X.prevOn;
            m.gs.gain.setValueAtTime(1 - s.wave, t); m.gq.gain.setValueAtTime(s.wave * 0.8, t); m.gb.gain.setValueAtTime(s.sub * 0.6, t);
            let dk = Math.round(s.drive * 20); if (dk !== m.dk) { m.dk = dk; m.sh.curve = curve(1 + s.drive * 10); }
            m.f1.Q.setValueAtTime(0.7 + s.res * 19, t); m.f2.Q.setValueAtTime(0.5, t);
            let cut = expo(60, 9000, s.cut), peak = Math.min(16000, cut * Math.pow(2, 0.5 + s.env * 4.6 * (ac ? 1 + s.acc * 0.6 : 1)));
            const fr = (o, v) => { if (slid) o.frequency.setTargetAtTime(v, t, 0.01 + s.glide * 0.08); else o.frequency.setValueAtTime(v, t); };
            fr(m.saw, f); fr(m.sq, f); fr(m.sub, f / 2);
            if (!slid) {
                let v = m.vca.gain, F1 = m.f1.frequency, F2 = m.f2.frequency, dec = 0.03 + Math.pow(s.dec, 1.5) * 1.17 * (ac ? 0.7 : 1);
                v.cancelScheduledValues(t); v.setTargetAtTime(vel * (ac ? 0.95 + s.acc * 0.2 : 0.62), t, 0.002);
                F1.cancelScheduledValues(t); F1.setTargetAtTime(peak, t, 0.0015); F1.setTargetAtTime(cut, t + 0.004, dec * 0.35);
                F2.cancelScheduledValues(t); F2.setTargetAtTime(Math.min(18000, peak * 1.7), t, 0.002); F2.setTargetAtTime(cut * 2, t + 0.004, dec * 0.4);
            }
            if (!X.nextSlides) m.vca.gain.setTargetAtTime(0, t + d * 0.85, 0.03);
            H(X, m.vca.gain, 0.03);
        },
        sump(X, t, d, s, vel, notes) {
            let c = X.ctx, m = X.mono.sump, lad = (s.eng == null ? 1 : s.eng) >= 0.5 && !!c._nbwk;
            if (m && !!m.lad !== lad) { try { m.vca.disconnect(); [m.a, m.b, m.sub].forEach(o => o.stop(t + 0.05)); } catch (e) {} m = null; }
            if (!m) {
                let lf = null; if (lad) { try { lf = new AudioWorkletNode(c, 'nb-ladder', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] }); lf.parameters.get('mode').value = 1; } catch (e) { lf = null; lad = false; } }
                m = X.mono.sump = { lad, a: c.createOscillator(), b: c.createOscillator(), sub: c.createOscillator(), gb: c.createGain(), gsub: c.createGain(), f: lf || c.createBiquadFilter(), sh: c.createWaveShaper(), vca: c.createGain() };
                m.sub.type = 'sine'; if (!m.lad) m.f.type = 'lowpass'; m.vca.gain.value = 0; m.sh.oversample = '2x';
                m.a.connect(m.f); m.b.connect(m.gb); m.gb.connect(m.f); m.sub.connect(m.gsub); m.gsub.connect(m.sh); m.f.connect(m.sh); m.sh.connect(m.vca); m.vca.connect(X.out);
                [m.a, m.b, m.sub].forEach(o => o.start(t));
            }
            let w = ['sine', 'triangle', 'sawtooth', 'square'][Math.min(3, Math.floor(s.wave * 4))];
            if (m.a.type !== w) { m.a.type = w; m.b.type = w; }
            let note = notes[0] + octOf(s.oct) * 12, f = hz(note), glide = s.glide * 0.3, slid = (glide > 0.005 || X.sl) && X.prevOn;
            const fr = (o, v) => { if (slid) o.frequency.setTargetAtTime(v, t, Math.max(0.01, glide) / 3); else o.frequency.setValueAtTime(v, t); };
            fr(m.a, f); fr(m.b, f); fr(m.sub, f / 2);
            m.b.detune.setValueAtTime(s.det * 30, t); m.a.detune.setValueAtTime(-s.det * 30, t); m.gb.gain.setValueAtTime(0.25 + s.det * 0.75, t); m.gsub.gain.setValueAtTime(s.sub * 0.9, t);
            let dk = Math.round(s.drive * 20); if (dk !== m.dk) { m.dk = dk; m.sh.curve = curve(1 + s.drive * 7); }
            let cut = Math.min(12000, expo(50, 8000, s.cut) * Math.pow(f / 65.41, s.ktrk || 0) * Math.max(0.25, 1 + (s.vcut || 0) * (vel - 0.6) * 2.5)), att = 0.001 + Math.pow(s.att, 2) * 0.5, dec = 0.02 + Math.pow(s.dec, 1.5) * 1.5, rel = 0.01 + Math.pow(s.rel, 2) * 1.5, sus = s.sus;
            if (m.lad) { m.f.parameters.get('res').setValueAtTime(s.res * 1.05, t); m.f.parameters.get('drive').setValueAtTime(1 + s.drive * 2, t); } else m.f.Q.setValueAtTime(0.5 + s.res * 14, t);
            let v = m.vca.gain, Fq = m.lad ? m.f.parameters.get('cut') : m.f.frequency;
            if (!(X.sl && X.prevOn)) {
                v.cancelScheduledValues(t); v.setTargetAtTime(vel * 0.9, t, att / 3); v.setTargetAtTime(vel * 0.9 * sus, t + att, dec / 3);
                Fq.cancelScheduledValues(t); Fq.setTargetAtTime(Math.min(16000, cut * Math.pow(2, s.env * 5)), t, att / 3 + 0.001); Fq.setTargetAtTime(cut, t + att, dec / 3);
                if ((s.punch || 0) > 0.01) [[m.a, f], [m.b, f], [m.sub, f / 2]].forEach(([o, q]) => { o.frequency.cancelScheduledValues(t); o.frequency.setValueAtTime(q * (1 + s.punch * 1.5), t); o.frequency.exponentialRampToValueAtTime(q, t + 0.012 + s.punch * 0.02); });
            }
            if (!X.nextSlides) v.setTargetAtTime(0, t + d, rel / 3);
            H(X, v, rel);
        },
        haze(X, t, d, s, vel, notes) {
            let c = X.ctx, out = X.out, w = ['sine', 'triangle', 'sawtooth', 'square'][Math.min(3, Math.floor(s.wave * 4))], n = 1 + Math.round(s.voices * 6);
            let att = 0.005 + Math.pow(s.att, 2) * 4, rel = 0.02 + Math.pow(s.rel, 2) * 6, f = c.createBiquadFilter(), v = c.createGain(), lfo = c.createOscillator(), ld = c.createGain(), end = t + d + rel, os = [lfo];
            f.type = 'lowpass'; f.frequency.value = expo(120, 12000, s.cut); f.Q.value = 0.5 + s.res * 10;
            let PB = {}; const pans = sp => { let q = sp < -0.33 ? -1 : sp > 0.33 ? 1 : 0; if (!PB[q]) { let pn = c.createStereoPanner(), g = c.createGain(); pn.pan.value = q * s.width; g.connect(pn); pn.connect(f); PB[q] = g; } return PB[q]; };
            lfo.frequency.value = expo(0.05, 6, s.lfo); ld.gain.value = expo(120, 12000, s.cut) * s.lfod * 0.6; lfo.connect(ld); ld.connect(f.frequency); lfo.start(t); lfo.stop(end + 0.1);
            let pk = vel * 0.32 / Math.sqrt(notes.length);
            v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(pk, t + att); v.gain.setValueAtTime(pk, t + Math.max(att, d)); v.gain.setTargetAtTime(0, t + Math.max(att, d), rel / 4);
            f.connect(v);
            let ch = Math.min(3, Math.floor((s.chor == null ? 1 / 8 : s.chor) * 4));
            if (ch) { v.connect(out); let lf = c.createOscillator(), dp = [0, 0.00185, 0.00185, 0.0003][ch]; lf.type = 'triangle'; lf.frequency.value = [0, 0.513, 0.863, 9.75][ch]; lf.start(t); lf.stop(end + 0.1); os.push(lf);
                [-1, 1].forEach(sd => { let dl = c.createDelay(0.02), lg = c.createGain(), p = c.createStereoPanner(), g = c.createGain(); dl.delayTime.value = 0.0035; lg.gain.value = dp * sd; lf.connect(lg); lg.connect(dl.delayTime); p.pan.value = sd; g.gain.value = 0.7; v.connect(dl); dl.connect(g); g.connect(p); p.connect(out); }); }
            else v.connect(out);
            notes.forEach(nt => {
                let m = nt + octOf(s.oct) * 12;
                for (let k = 0; k < n; k++) {
                    let o = c.createOscillator(), og = c.createGain(), sp = n > 1 ? k / (n - 1) * 2 - 1 : 0, p = pans(sp);
                    o.type = w; o.frequency.value = hz(m); o.detune.value = sp * s.det * 30 + (rr() - 0.5) * 4; og.gain.value = 1 / Math.sqrt(n);
                    o.connect(og); og.connect(p);
                    o.start(t); o.stop(end + 0.1); os.push(o);
                }
            });
            H(X, v.gain, rel, os);
        },
        grit(X, t, d, s, vel, notes) {
            let arp = Math.min(4, Math.floor(s.arp * 5));
            if (arp && notes.length) {
                let rate = [2, 4, 8][Math.min(2, Math.floor(s.arate * 3))], sd = 60 / X.bpm / rate, range = 1 + Math.round(s.arange * 2), pool = [];
                for (let o = 0; o < range; o++) notes.slice().sort((a, b) => a - b).forEach(nn => pool.push(nn + o * 12));
                let seq = arp === 1 ? pool : arp === 2 ? pool.slice().reverse() : arp === 3 ? pool.concat(pool.slice(1, -1).reverse()) : pool;
                let k = 0, dd = X.hold ? Math.min(d, 60 / X.bpm * 4) : d;
                for (let at = 0; at < dd - 0.001; at += sd) { let nn = arp === 4 ? pool[Math.floor(X.rnd() * pool.length)] : seq[k % seq.length]; k++; gritNote(X, t + at, Math.min(sd, dd - at), s, vel, nn); }
                return;
            }
            notes.forEach(nn => gritNote(X, t, d, s, vel / Math.sqrt(notes.length), nn));
        },
        throat(X, t, d, s, vel, notes) {
            if ((s.eng == null ? 1 : s.eng) >= 0.5 && X.ctx._nbwk && throatSing(X, t, d, s, vel, notes)) return;
            const VW = [[800, 1150, 2900], [500, 1700, 2500], [350, 2000, 2800], [450, 800, 2830], [325, 700, 2530]];
            let c = X.ctx, out = X.out, att = 0.01 + Math.pow(s.att, 2) * 2, rel = 0.02 + Math.pow(s.rel, 2) * 4, end = t + d + rel;
            let pos = s.vowel * 4, i0 = Math.floor(pos), fr = pos - i0, vw = VW[i0].map((f, k) => lerp(f, VW[Math.min(4, i0 + 1)][k], fr)), drift = s.motion;
            notes.forEach(nt => {
                let m = nt + octOf(s.oct) * 12, o = c.createOscillator(), vib = c.createOscillator(), vg = c.createGain(), v = c.createGain(), sum = c.createGain(), os = [o, vib];
                o.type = 'sawtooth'; o.frequency.value = hz(m); vib.frequency.value = 5.2; vg.gain.value = hz(m) * s.vib * 0.025; vib.connect(vg); vg.connect(o.frequency);
                vw.forEach((f, k) => { let b = c.createBiquadFilter(), bg = c.createGain(); b.type = 'bandpass'; b.frequency.setValueAtTime(f, t); b.frequency.linearRampToValueAtTime(f * (1 + (k ? -drift : drift) * 0.25), Math.min(end, t + 8)); b.Q.value = 8 + k * 4; bg.gain.value = [1, 0.6, 0.25][k]; o.connect(b); b.connect(bg); bg.connect(sum); });
                if (s.breath > 0.02) { let n = c.createBufferSource(), nf = c.createBiquadFilter(), ng = c.createGain(); n.buffer = X.nb; n.loop = true; nf.type = 'bandpass'; nf.frequency.value = vw[1]; ng.gain.value = s.breath * 0.25; n.connect(nf); nf.connect(ng); ng.connect(sum); n.start(t, rr()); n.stop(end + 0.1); os.push(n); }
                let pk = vel * 1.25 / Math.sqrt(notes.length);
                v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(pk, t + att); v.gain.setValueAtTime(pk, t + Math.max(att, d)); v.gain.setTargetAtTime(0, t + Math.max(att, d), rel / 4);
                sum.connect(v); v.connect(out); o.start(t); vib.start(t); o.stop(end + 0.1); vib.stop(end + 0.1);
                H(X, v.gain, rel, os);
            });
        },
        rust(X, t, d, s, vel, notes) {
            let c = X.ctx, out = X.out, type = Math.min(6, Math.floor((s.type || 0) * 7)), att = 0.005 + Math.pow(s.att, 2) * 3, dec = 0.05 + Math.pow(s.dec, 2) * 6, end = t + d + dec;
            if ((type >= 5 || ((s.eng == null ? 1 : s.eng) >= 0.5 && (type === 1 || type === 2))) && c._nbwk) {
                let tx = null, v = c.createGain(), pk = vel * { 1: 0.9, 2: 0.33, 5: 2.8, 6: 0.42 }[type];
                try { tx = new AudioWorkletNode(c, 'nb-tex', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { start: t, seed: 1 + Math.floor(X.rnd() * 2147483645), end: (X.hold ? t + 3600 : end) + 0.3 } }); } catch (e) { tx = null; }
                if (tx) { let P = tx.parameters; P.get('kind').value = { 1: 0, 2: 1, 5: 2, 6: 3 }[type]; P.get('tone').value = s.tone; P.get('dens').value = s.dens; P.get('motion').value = s.motion;
                    v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(pk, t + att); v.gain.setValueAtTime(pk, t + Math.max(att, d)); v.gain.setTargetAtTime(0, t + Math.max(att, d), dec / 4);
                    tx.connect(v); v.connect(out); H(X, v.gain, dec, []); if (X.hold) X.hold[X.hold.length - 1].o = []; return; }
                if (type >= 5) type = 0;
            }
            let v = c.createGain(), n = c.createBufferSource(), f = c.createBiquadFilter(), lfo = c.createOscillator(), ld = c.createGain();
            n.buffer = X.nb; n.loop = true; lfo.frequency.value = 0.05 + s.motion * 2; lfo.connect(ld); lfo.start(t); lfo.stop(end + 0.1);
            let peak = vel * [0.25, 0.5, 0.4, 0.35, 0.6][type];
            if (type === 0) { f.type = 'highpass'; f.frequency.value = expo(1500, 9000, s.tone); }
            if (type === 2) { f.type = 'bandpass'; f.Q.value = 2; f.frequency.value = expo(200, 2000, s.tone); ld.gain.value = expo(200, 2000, s.tone) * 0.8; ld.connect(f.frequency); }
            if (type === 3) {
                f.type = 'lowpass'; f.Q.value = 4; let cut = expo(180, 6000, s.tone); f.frequency.value = cut; ld.gain.value = cut * (0.15 + s.motion * 0.6); ld.connect(f.frequency);
                let os = [n, lfo], vo = 2 + Math.round(s.dens * 5), RAT = [1, 1.5, 2, 0.5, 1.002, 3, 0.998], sum = c.createGain(); sum.gain.value = 1 / Math.sqrt(vo * Math.max(1, notes.length));
                notes.slice(0, 4).forEach(nt => { let fq = hz(nt); for (let i = 0; i < vo; i++) { let o = c.createOscillator(), og = c.createGain(); o.type = s.tone > 0.55 ? 'sawtooth' : 'triangle'; o.frequency.value = fq * RAT[i % RAT.length]; o.detune.value = (rr() * 2 - 1) * (3 + s.motion * 16); og.gain.value = i ? 0.6 / i : 1; o.connect(og); og.connect(sum); o.start(t); o.stop(end + 0.1); os.push(o); } });
                let ng = c.createGain(); ng.gain.value = 0.05; n.connect(ng); ng.connect(f); sum.connect(f); f.connect(v);
                peak = vel * 0.32;
                v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(peak, t + att); v.gain.setValueAtTime(peak, t + Math.max(att, d)); v.gain.setTargetAtTime(0, t + Math.max(att, d), dec / 4);
                v.connect(out); n.start(t, rr()); n.stop(end + 0.1);
                H(X, v.gain, dec, os);
                return;
            }
            if (type === 4) { f.type = 'lowpass'; f.frequency.value = expo(40, 300, s.tone); f.Q.value = 3; peak *= 2.5; }
            if (type === 1) {
                f.type = 'highpass'; f.frequency.value = expo(300, 4000, s.tone);
                let cl = c.createGain(); cl.gain.value = 0; n.connect(f); f.connect(cl); cl.connect(v);
                let rate = 3 + s.dens * 60, stop = Math.min(end, t + 12); for (let at = t; at < stop; at += -Math.log(1 - rr()) / rate) { cl.gain.setValueAtTime(rr() * 1.4, at); cl.gain.setValueAtTime(0, at + 0.0015); }
            } else { n.connect(f); f.connect(v); }
            v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(peak, t + att); v.gain.setValueAtTime(peak, t + Math.max(att, d)); v.gain.setTargetAtTime(0, t + Math.max(att, d), dec / 4);
            v.connect(out); n.start(t, rr()); n.stop(end + 0.1);
            H(X, v.gain, dec, [n, lfo]);
        },
        steel(X, t, d, s, vel) {
            let k = Math.min(5, Math.floor((s.kind || 0) * 6)); if (k !== 2) return steelGrab(X, t, s, DRUM2.steel(X, t, d, s, vel, [6, 7, 2, 8, 4, 5][k]));
            let c = X.ctx, out = X.out, base = expo(250, 900, s.tone) * semis(X.semi), len = [2.4, 1.6, 1.8, 0.7][k] * (0.15 + Math.pow(s.decay, 1.3) * 1.9);
            let hp = c.createBiquadFilter(), bp = c.createBiquadFilter(), sh = c.createWaveShaper(), v = c.createGain();
            hp.type = 'highpass'; hp.frequency.value = expo(2500, 9000, s.bright) * (k === 1 ? 0.7 : 1); bp.type = 'peaking'; bp.frequency.value = Math.min(16000, expo(5000, 12000, s.bright)); bp.gain.value = 4;
            sh.curve = curve(1 + s.dirt * 8 + (k === 2 ? 5 : 0), 1024);
            [1, 1.342, 1.2312, 1.6532, 1.9523, 2.1523].forEach(r => { let o = c.createOscillator(), og = c.createGain(); o.type = 'square'; o.frequency.value = base * r * (k === 3 ? 1.4 : 1); og.gain.value = 0.12; o.connect(og); og.connect(sh); o.start(t); o.stop(t + len + 0.05); });
            if (s.hiss > 0.02) { let n = c.createBufferSource(), ng = c.createGain(); n.buffer = X.nb; n.loop = true; ng.gain.value = s.hiss * 0.8; n.connect(ng); ng.connect(sh); n.start(t, rr()); n.stop(t + len + 0.05); }
            sh.connect(hp); hp.connect(bp); bp.connect(v); v.connect(out);
            v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(vel * (k === 1 ? 0.3 : 0.45), t + (k === 0 ? 0.012 : 0.002)); v.gain.exponentialRampToValueAtTime(0.0005, t + len); steelGrab(X, t, s, v);
            if (s.bell > 0.02) [2.4, 3.31, 4.7].forEach((r, i) => { let o = c.createOscillator(), g = c.createGain(); o.frequency.value = base * r * 2; g.gain.setValueAtTime(vel * s.bell * 0.12 / (i + 1), t); g.gain.exponentialRampToValueAtTime(0.0003, t + len * 0.6); o.connect(g); g.connect(out); o.start(t); o.stop(t + len); });
        },
        zap(X, t, d, s, vel) {
            if ((s.rep || 0) >= 0.02 && !s._r) { let n = 1 + Math.round(s.rep * 7), per = Math.max(0.03, d / n); for (let i = 0; i < n; i++) PLAY.zap(X, t + i * per, per, Object.assign({}, s, { _r: 1 }), vel * (1 - i * 0.04)); return; }
            let c = X.ctx, out = X.out, f0 = Math.min(18000, expo(200, 8000, s.pitch) * semis(X.semi)), f1 = Math.max(20, f0 * Math.pow(2, -s.drop * 6)), tm = 0.005 + Math.pow(s.time, 1.5) * 0.6, len = 0.03 + Math.pow(s.decay, 1.5) * 1.2;
            let o = c.createOscillator(), v = c.createGain(), sh = c.createWaveShaper();
            o.type = ['sine', 'triangle', 'square', 'sawtooth'][Math.min(3, Math.floor(s.wave * 4))]; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + tm);
            sh.curve = curve(1 + s.dirt * 12, 1024);
            v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(vel * 0.5, t + 0.002); v.gain.exponentialRampToValueAtTime(0.0005, t + len);
            o.connect(sh); sh.connect(v); v.connect(out); o.start(t); o.stop(t + len + 0.05);
            if ((s.vib || 0) > 0.01) { let lf = c.createOscillator(), lg = c.createGain(); lf.frequency.value = 6 + s.vib * 14; lg.gain.value = s.vib * 600; lf.connect(lg); lg.connect(o.detune); lf.start(t); lf.stop(t + len + 0.05); }
            if (s.noise > 0.02) { let n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); n.buffer = X.nb; f.type = 'bandpass'; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + tm); f.Q.value = 3; g.gain.setValueAtTime(s.noise * vel * 0.8, t); g.gain.exponentialRampToValueAtTime(0.0005, t + len); n.connect(f); f.connect(g); g.connect(out); n.start(t, rr()); n.stop(t + len + 0.05); }
        },
        pipe(X, t, d, s, vel, notes) {
            let c = X.ctx, out = X.out, att = 0.002 + Math.pow(s.att, 2) * 2, rel = 0.01 + Math.pow(s.rel, 2) * 3, end = t + d + rel, bars = [['d16', 0.5], ['d8', 1], ['d4', 2], ['d3', 3], ['d2', 4], ['d1', 8]];
            let sh = c.createWaveShaper(), v = c.createGain(), vib = c.createOscillator(), vg = c.createGain(), os = [vib], tot = bars.reduce((a, b) => a + s[b[0]], 0) || 1;
            sh.curve = curve(1 + s.drive * 6, 1024); vib.frequency.value = 6.6; vg.gain.value = s.vib * 28; vib.connect(vg); vib.start(t); vib.stop(end + 0.1);
            let pk = vel * 0.55 / Math.sqrt(notes.length) / Math.sqrt(tot) * (s.perc > 0.02 ? 0.71 : 1);
            v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(pk, t + att); v.gain.setValueAtTime(pk, t + Math.max(att, d)); v.gain.setTargetAtTime(0, t + Math.max(att, d), rel / 4);
            sh.connect(v);
            let sc = Math.min(6, Math.floor((s.scan || 0) * 7));
            if (sc) { let dl = c.createDelay(0.02), lf = c.createOscillator(), lg = c.createGain(), dp = [0.0002, 0.0004, 0.0007][(sc - 1) % 3]; dl.delayTime.value = 0.0015; lf.frequency.value = 6.9; lg.gain.value = dp; lf.connect(lg); lg.connect(dl.delayTime); lf.start(t); lf.stop(end + 0.1); os.push(lf);
                let wg = c.createGain(); wg.gain.value = sc > 3 ? 0.6 : 1; v.connect(dl); dl.connect(wg); wg.connect(out); if (sc > 3) { let dg = c.createGain(); dg.gain.value = 0.6; v.connect(dg); dg.connect(out); } } else v.connect(out);
            notes.forEach(nt => {
                let f = hz(nt + octOf(s.oct) * 12);
                if ((s.leak || 0) > 0.01) [2.997, 5.04, 6.03, 0.749].forEach((r, i) => { if (f * r > 16000) return; let o = c.createOscillator(), g = c.createGain(); o.frequency.value = f * r; g.gain.value = s.leak * 0.035 / (i + 1); o.connect(g); g.connect(sh); o.start(t); o.stop(end + 0.1); os.push(o); });
                bars.forEach(([k, r]) => { if (s[k] < 0.02 || f * r > 16000) return; let o = c.createOscillator(), g = c.createGain(); o.frequency.value = f * r; g.gain.value = Math.pow(s[k], 1.4); vg.connect(o.detune); o.connect(g); g.connect(sh); o.start(t); o.stop(end + 0.1); os.push(o); });
                if (s.perc > 0.02) { let o = c.createOscillator(), g = c.createGain(); o.frequency.value = f * (s.percH >= 0.5 ? 3 : 2); let pd = (s.pdec || 0) >= 0.5 ? 0.45 : 0.12; g.gain.setValueAtTime(s.perc * 0.9, t); g.gain.setTargetAtTime(0, t + 0.01, pd); o.connect(g); g.connect(sh); o.start(t); o.stop(t + 0.1 + pd * 8); }
                if (s.click > 0.02) for (let q = 0; q < 6; q++) { let at = t + X.rnd() * 0.006, n = c.createBufferSource(), g = c.createGain(), fl = c.createBiquadFilter(); n.buffer = X.nb; fl.type = 'bandpass'; fl.frequency.value = 1500 + X.rnd() * 5000; fl.Q.value = 0.8; g.gain.setValueAtTime(s.click * (0.35 + X.rnd() * 0.3), at); g.gain.setTargetAtTime(0, at, 0.0004); n.connect(fl); fl.connect(g); g.connect(v); n.start(at, X.rnd()); n.stop(at + 0.01); }
            });
            H(X, v.gain, rel, os);
        },
        pick(X, t, d, s, vel, notes) {
            const M = [null, { exc: 2, hard: 0.2, br: -0.25, body: [[200, 6, 1], [2400, 3, 2]], dec: 0.8 }, { exc: 1, hard: 0.9, br: 0.15, stiff: 0.25, body: [[110, 4, 1], [3000, 4, 1.5]] },
                { exc: 1, hard: 0.8, br: 0.2, pos: 0.15, bend: 60, body: [[420, 7, 2], [1800, 5, 3]], dec: 0.7 }, { exc: 2, hard: 0.35, br: -0.05, body: [[300, 4, 1]], dec: 1.6 },
                { exc: 1, hard: 0.6, br: -0.35, oct: -12, body: [[90, 7, 1.2], [700, -4, 1]], dec: 0.6 }, { exc: 1, hard: 0.9, br: 0.25, buzz: 0.55, dbl: 1.0015, body: [[600, 5, 2], [2500, 6, 2]], dec: 1.4 },
                { exc: 1, hard: 1, br: 0.3, body: [[1150, 12, 6], [3200, 5, 2]], dec: 0.35 }, { exc: 1, hard: 0.7, br: 0.1, dbl: 2.003, body: [[250, 4, 1], [3000, 4, 1.5]], dec: 1.1 },
                { tine: [[1, 1, 1], [5.9, 0.12, 0.25], [13.1, 0.04, 0.12]], dec: 0.5 }, { tine: [[1, 1, 1], [3.9, 0.16, 0.35], [7.2, 0.05, 0.2], [2, 0.06, 0.6]], dec: 0.55 },
                { exc: 2, hard: 0.9, br: 0.2, dbl: 1.0025, body: [[400, 5, 1.2], [2200, 4, 2]], dec: 1.3 },
                { exc: 1, hard: 1, br: 0.3, pos: 0.07, dbl: 2.002, buzz: 0.1, body: [[220, 5, 1], [900, 3, 1.2], [3000, 4, 1.5]], dec: 0.75, hd: 1 }][mdl(s, 13)];
            let c = X.ctx, out = X.out, dec = (0.2 + Math.pow(s.decay, 1.6) * 7.8) * (M && M.dec || 1), sp = (s.strum || 0) * 0.12;
            notes.slice().sort((a, b) => a - b).forEach((nt, i) => {
                let tt = t + i * sp, f = hz(nt + octOf(s.oct) * 12 + (M && M.oct || 0)), body = c.createBiquadFilter(), lp = c.createBiquadFilter(), v = c.createGain(), pn = c.createStereoPanner(), src = null, life = X.hold ? 8 + dec + 0.3 : d + (s.damp > 0.02 ? Math.min(dec, (0.02 + (1 - s.damp) * 0.4) * 7) : dec) + 0.3;
                let br = Math.max(0, Math.min(1, s.bright + (M && M.br || 0) + (vel - 0.75) * 0.5));
                body.type = 'peaking'; body.frequency.value = expo(120, 1500, s.body); body.gain.value = 6; body.Q.value = 1.2;
                lp.type = 'lowpass'; lp.frequency.value = expo(1200, 16000, br);
                pn.pan.value = (notes.length > 1 ? (i / (notes.length - 1) - 0.5) : (rr() - 0.5) * 0.5) * s.width;
                if (M && M.tine) { modal(X, tt, f, M.tine, 1, dec, 0.3, body); body.connect(lp); lp.connect(v); v.connect(pn); pn.connect(out); }
                else {
                    let hard = M ? (M.hard + ((s.hard == null ? 0.5 : s.hard) - 0.5)) : (s.hard == null ? 0.5 : s.hard), opt = { seed: 1 + Math.floor(X.rnd() * 2147483645), f, dec, br, pos: M && M.pos != null ? M.pos : s.pos, v: 1, life, start: tt,
                        exc: M ? M.exc : ((s.hard || 0.5) > 0.66 ? 1 : 0), hard: Math.max(0, Math.min(1, hard)), buzz: Math.min(0.95, (M && M.buzz || 0) + (s.buzz || 0)), stiff: M && M.stiff || 0,
                        dbl: (s.dbl || 0) > 0.01 ? Math.pow(2, s.dbl * 30 / 1200) * (M && M.dbl > 1.5 ? 2 : 1) : (M && M.dbl) || 0, bend: (s.bendin || 0) * 200 + (M && M.bend || 0), vib: s.vib || 0 };
                    if (!M && !(s.hard > 0.66)) delete opt.exc;
                    if (c._nbwk) { try { src = new AudioWorkletNode(c, 'nb-pluck', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [1], processorOptions: opt }); } catch (e) { src = null; } }
                    if (!src) { let o = c.createOscillator(), md = c.createOscillator(), mg = c.createGain(), eg = c.createGain(); o.type = 'triangle'; o.frequency.value = f; md.frequency.value = f * 2; mg.gain.setValueAtTime(f * 3 * br, tt); mg.gain.setTargetAtTime(0, tt, 0.05); md.connect(mg); mg.connect(o.frequency); eg.gain.setValueAtTime(1, tt); eg.gain.setTargetAtTime(0, tt, dec / 5); o.connect(eg); md.start(tt); o.start(tt); md.stop(tt + life); o.stop(tt + life); src = eg; }
                    let prev = src;
                    (M && M.body || []).forEach(([fq, gn, q]) => { let b2 = c.createBiquadFilter(); b2.type = 'peaking'; b2.frequency.value = fq; b2.gain.value = gn; b2.Q.value = q; prev.connect(b2); prev = b2; });
                    prev.connect(body); body.connect(lp); lp.connect(v); v.connect(pn); pn.connect(out);
                }
                let pk = vel * 1.2 / Math.sqrt(notes.length) * (M ? [1, 0.4, 0.69, 0.46, 0.3, 0.96, 0.68, 0.7, 0.75, 0.25, 0.25, 0.22, 0.5][mdl(s, 13)] : 1);
                v.gain.setValueAtTime(0, t); v.gain.setValueAtTime(pk, tt);
                if ((s.damp > 0.02 || (M && M.hd)) && !X.hold) v.gain.setTargetAtTime(0, tt + d, M && M.hd ? 0.03 : 0.02 + (1 - s.damp) * 0.4);
                H(X, v.gain, 0.06, []);
            });
        },
        swarm(X, t, d, s, vel, notes) {
            if ((s.model || 0) >= 0.5) return superSaw(X, t, d, s, vel, notes);
            let c = X.ctx, out = X.out, n = 1 + Math.round(s.voices * 8), att = 0.002 + Math.pow(s.att, 2) * 2, dec = 0.02 + Math.pow(s.dec, 1.5) * 2, rel = 0.01 + Math.pow(s.rel, 2) * 3, sus = s.sus, end = t + d + rel;
            let f = c.createBiquadFilter(), v = c.createGain(), cut = expo(100, 14000, s.cut), os = [];
            f.type = 'lowpass'; f.Q.value = 0.5 + s.res * 12;
            let PB = {}; const pans = sp => { let q = sp < -0.33 ? -1 : sp > 0.33 ? 1 : 0; if (!PB[q]) { let pn = c.createStereoPanner(), g = c.createGain(); pn.pan.value = q * 0.9; g.connect(pn); pn.connect(f); PB[q] = g; } return PB[q]; };
            f.frequency.setValueAtTime(Math.min(18000, cut * Math.pow(2, s.env * 5)), t); f.frequency.setTargetAtTime(cut, t + att, dec / 3);
            let pk = vel * 0.48 / Math.sqrt(notes.length);
            v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(pk, t + att); v.gain.setTargetAtTime(pk * sus, t + att, dec / 3); v.gain.setTargetAtTime(0, t + Math.max(att, d), rel / 4);
            f.connect(v); v.connect(out);
            notes.forEach(nt => {
                let fr = hz(nt + octOf(s.oct) * 12), scoop = Math.round(s.rise * 12);
                for (let k = 0; k < n; k++) {
                    let o = c.createOscillator(), g = c.createGain(), sp = n > 1 ? k / (n - 1) * 2 - 1 : 0, p = pans(sp), mid = Math.abs(sp) < 0.01;
                    o.type = 'sawtooth'; o.frequency.setValueAtTime(fr * Math.pow(2, -scoop / 12), t); if (scoop) o.frequency.exponentialRampToValueAtTime(fr, t + 0.03 + s.rise * 0.25); else o.frequency.setValueAtTime(fr, t);
                    o.detune.value = sp * s.det * 55 + (rr() - 0.5) * 3; g.gain.value = (mid ? 1 : s.side) / Math.sqrt(n);
                    o.connect(g); g.connect(p); o.start(t, rr() * 0.01); o.stop(end + 0.1); os.push(o);
                }
                if (s.sub > 0.02) { let o = c.createOscillator(), g = c.createGain(); o.type = 'square'; o.frequency.value = fr / 2; g.gain.value = s.sub * 0.35; o.connect(g); g.connect(f); o.start(t); o.stop(end + 0.1); os.push(o); }
            });
            H(X, v.gain, rel, os);
        },
        rise(X, t, d, s, vel, notes) {
            if (Math.min(5, Math.floor((s.kind || 0) * 6)) === 5) return shepard(X, t, d, s, vel, notes);
            let c = X.ctx, out = X.out, k = Math.min(4, Math.floor(s.kind * 6)), len = Math.max(0.15, d), f = hz(notes[0] || 60), oct = s.amt * 4, os = [];
            let v = c.createGain(), sh = c.createWaveShaper(), pn = c.createStereoPanner(), lfo = c.createOscillator(), lg = c.createGain();
            sh.curve = curve(1 + s.dirt * 9, 1024); lfo.frequency.value = 0.5 + 3 / len; lg.gain.value = s.width; lfo.connect(lg); lg.connect(pn.pan); lfo.start(t);
            sh.connect(v); v.connect(pn); pn.connect(out);
            let n = c.createBufferSource(), nf = c.createBiquadFilter(), ng = c.createGain(); n.buffer = X.nb; n.loop = true; nf.type = k === 4 ? 'highpass' : 'bandpass'; nf.Q.value = k === 3 ? 6 : 1.5; ng.gain.value = (1 - s.mix) * 1.2; n.connect(nf); nf.connect(ng); ng.connect(sh);
            let o = c.createOscillator(), og = c.createGain(); o.type = 'sawtooth'; og.gain.value = s.mix * 0.5; o.connect(og); og.connect(sh);
            let top = expo(2000, 16000, s.tone), lo = 150, end = t + len, tail = 0.4;
            if (k === 0) { nf.frequency.setValueAtTime(lo, t); nf.frequency.exponentialRampToValueAtTime(top, end); o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * Math.pow(2, oct), end); v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(vel * 1.15, end); v.gain.setTargetAtTime(0, end, 0.02); }
            else if (k === 1) { nf.frequency.setValueAtTime(top, t); nf.frequency.exponentialRampToValueAtTime(lo, end); o.frequency.setValueAtTime(f * Math.pow(2, oct), t); o.frequency.exponentialRampToValueAtTime(f, end); v.gain.setValueAtTime(vel * 1.15, t); v.gain.exponentialRampToValueAtTime(0.0005, end); }
            else if (k === 2) {
                tail = 2 + s.amt * 3; let b = c.createOscillator(), bg = c.createGain(); b.frequency.setValueAtTime(140, t); b.frequency.exponentialRampToValueAtTime(32, t + 0.4 + s.amt); bg.gain.setValueAtTime(vel * 0.9, t); bg.gain.exponentialRampToValueAtTime(0.0005, t + tail); b.connect(bg); bg.connect(sh); b.start(t); b.stop(t + tail + 0.1); os.push(b);
                nf.type = 'lowpass'; nf.frequency.setValueAtTime(top, t); nf.frequency.exponentialRampToValueAtTime(200, t + tail * 0.6); o.frequency.value = f / 2; v.gain.setValueAtTime(vel * 1.0, t); v.gain.exponentialRampToValueAtTime(0.0005, t + tail); end = t + tail;
            }
            else if (k === 3) { nf.frequency.setValueAtTime(lo, t); nf.frequency.exponentialRampToValueAtTime(top, t + len / 2); nf.frequency.exponentialRampToValueAtTime(lo, end); o.frequency.value = f; v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(vel * 0.95, t + len / 2); v.gain.exponentialRampToValueAtTime(0.0005, end); }
            else { nf.frequency.value = expo(3000, 9000, s.tone); o.frequency.value = f * 4; v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(vel * 1.15, end); v.gain.setValueAtTime(0, end + 0.005); }
            n.start(t, rr()); n.stop(end + 0.2); o.start(t); o.stop(end + 0.2); lfo.stop(end + 0.2); os.push(n, o, lfo);
            H(X, v.gain, 0.1, os);
        },
        chrome(X, t, d, s, vel, notes) {
            let c = X.ctx, out = X.out, off = typeof OfflineAudioContext !== 'undefined' && c instanceof OfflineAudioContext;
            let A = Math.min(7, Math.floor((s.alg || 0) * 8)), rel = Math.max(...CHR.CAR[A].map(k => expo(0.005, 15, s['er' + k] == null ? 0.3 : s['er' + k])));
            notes.forEach(nt => {
                let f = hz(nt + octOf(s.oct == null ? 0.5 : s.oct) * 12), v = c.createGain(), src = null;
                if (c._nbwk) { try { src = new AudioWorkletNode(c, 'nb-fm', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { start: t, dur: X.hold ? -1 : d, f, vel, s, off } }); } catch (e) { src = null; } }
                if (!src) { let o = c.createOscillator(), eg = c.createGain(); o.frequency.value = f; eg.gain.setValueAtTime(0, t); eg.gain.linearRampToValueAtTime(vel * 0.3, t + 0.005); eg.gain.setTargetAtTime(0, t + (X.hold ? 30 : d), rel / 4); o.connect(eg); src = eg; o.start(t); o.stop(t + (X.hold ? 30 : d) + rel + 0.1); }
                v.gain.value = 1; src.connect(v); v.connect(out);
                H(X, v.gain, rel, src.port ? [{ stop: () => { try { src.port.postMessage('off'); } catch (e) {} } }] : [], null);
            });
        },
        parlour(X, t, d, s, vel, notes) {
            let c = X.ctx, out = X.out, R = rngOf(X), md = Math.min(5, Math.floor((s.model || 0) * 6)), rel = (s.pedal || 0) > 0.02 ? 0.3 + s.pedal * 6 : md === 4 ? 0.3 : 0.25;
            notes.forEach(nt => {
                let f = hz(nt + octOf(s.oct == null ? 0.5 : s.oct) * 12), v = c.createGain(), src = null;
                if (c._nbwk) { try { src = new AudioWorkletNode(c, 'nb-keys', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { start: t, dur: X.hold ? -1 : d, f, vel, s, seed: Math.floor(R() * 4294967295) || 7 } }); } catch (e) { src = null; } }
                if (!src) { let o = c.createOscillator(), eg = c.createGain(); o.frequency.value = f; eg.gain.setValueAtTime(vel * 0.3, t); eg.gain.setTargetAtTime(0, t, 0.6); o.connect(eg); src = eg; o.start(t); o.stop(t + 4); }
                v.gain.value = 1; src.connect(v); v.connect(out);
                H(X, v.gain, rel, src.port ? [{ stop: () => { try { src.port.postMessage('off'); } catch (e) {} } }] : [], null);
            });
        },
        sinew(X, t, d, s, vel, notes) {
            let c = X.ctx, out = X.out, R = rngOf(X), rel = 0.03 + Math.pow(s.rel == null ? 0.3 : s.rel, 2) * 3;
            notes.forEach(nt => {
                let f = hz(nt + octOf(s.oct == null ? 0.5 : s.oct) * 12), v = c.createGain(), src = null;
                if (c._nbwk) { try { src = new AudioWorkletNode(c, 'nb-bow', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { start: t, dur: X.hold ? -1 : d, f, vel, s, seed: Math.floor(R() * 4294967295) || 5 } }); } catch (e) { src = null; } }
                if (!src) { let o = c.createOscillator(), lp = c.createBiquadFilter(), eg = c.createGain(); o.type = 'sawtooth'; o.frequency.value = f; lp.frequency.value = 2500; eg.gain.setValueAtTime(0, t); eg.gain.linearRampToValueAtTime(vel * 0.2, t + 0.15); eg.gain.setTargetAtTime(0, t + (X.hold ? 30 : d), rel / 4); o.connect(lp); lp.connect(eg); src = eg; o.start(t); o.stop(t + (X.hold ? 30 : d) + rel + 0.2); }
                v.gain.value = 1; src.connect(v); v.connect(out);
                H(X, v.gain, rel, src.port ? [{ stop: () => { try { src.port.postMessage('off'); } catch (e) {} } }] : [], null);
            });
        },
        brazen(X, t, d, s, vel, notes) {
            let c = X.ctx, out = X.out, R = rngOf(X), rel = 0.02 + Math.pow(s.rel == null ? 0.25 : s.rel, 2) * 2;
            notes.forEach(nt => {
                let f = hz(nt + octOf(s.oct == null ? 0.5 : s.oct) * 12), v = c.createGain(), src = null;
                if (c._nbwk) { try { src = new AudioWorkletNode(c, 'nb-brass', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { start: t, dur: X.hold ? -1 : d, f, vel, s, seed: Math.floor(R() * 4294967295) || 3 } }); } catch (e) { src = null; } }
                if (!src) { let o = c.createOscillator(), lp = c.createBiquadFilter(), eg = c.createGain(); o.type = 'sawtooth'; o.frequency.value = f; lp.frequency.setValueAtTime(400, t); lp.frequency.linearRampToValueAtTime(2500, t + 0.08); eg.gain.setValueAtTime(0, t); eg.gain.linearRampToValueAtTime(vel * 0.2, t + 0.03); eg.gain.setTargetAtTime(0, t + (X.hold ? 30 : d), rel / 4); o.connect(lp); lp.connect(eg); src = eg; o.start(t); o.stop(t + (X.hold ? 30 : d) + rel + 0.2); }
                v.gain.value = 1; src.connect(v); v.connect(out);
                H(X, v.gain, rel, src.port ? [{ stop: () => { try { src.port.postMessage('off'); } catch (e) {} } }] : [], null);
            });
        },
        razor(X, t, d, s, vel, notes) {
            let c = X.ctx, V = (k, d0) => s[k] == null ? d0 : s[k], R = rngOf(X), A = razorRig(X, t, s), beat = 60 / (X.bpm || 120);
            let mute = Math.max(V('palm', 0), V('auto', 0.75) >= 0.5 && !X.hold && d > 0 && d <= beat * 0.55 ? 0.92 : 0);
            const sus = 0.6 + Math.pow(V('sus', 0.55), 1.5) * 7.4, ns = notes.slice().sort((a, b) => a - b), sp = V('strum', 0.15) * 0.025, lv = 0.95 / Math.sqrt(ns.length);
            const lo = V('low', 0), sw = V('swell', 0), ply = [];
            ns.forEach((nt, i) => { ply.push([nt, i, 1]); if (lo > 0.01) ply.push([nt - 12, i, lo]); });
            ply.forEach(([nt, i, gk]) => {
                let tt = t + i * sp, f = hz(nt + octOf(V('oct', 0.5)) * 12), br = Math.min(1, V('pick', 0.6) * 0.75 + vel * 0.3), vib = V('vib', 0.2), src = null, v = c.createGain();
                // pinch harmonics!!! squeeeee
                if (ns.length === 1 && gk === 1 && mute < 0.5 && V('pinch', 0) > 0.01 && R() < V('pinch', 0) * (0.3 + vel * 0.7)) { f *= [3, 4, 5, 6][Math.floor(R() * 4)]; br = 1; vib = Math.max(vib, 0.6); }
                if (c._nbwk) { try { src = new AudioWorkletNode(c, 'nb-razor', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { start: tt, dur: X.hold ? -1 : Math.max(0.02, d - i * sp), f, vel, mute, sus, br, hard: V('pick', 0.6), pos: 0.08 + V('pos', 0.2) * 0.42, dbl: V('dbl', 0.8), vib, scrape: V('scrape', 0.3), seed: Math.floor(R() * 4294967295) || 5, life: X.hold ? 60 : d + sus * 0.6 + 1 } }); } catch (e) { src = null; } }
                if (!src) { let o = c.createOscillator(), lp = c.createBiquadFilter(), eg = c.createGain(), L = mute > 0.5 ? 0.12 : Math.min(d, sus); o.type = 'sawtooth'; o.frequency.value = f; lp.frequency.value = 1500 + br * 3000; eg.gain.setValueAtTime(0.5 * vel, tt); eg.gain.setTargetAtTime(0, tt + (X.hold ? 30 : L), 0.05); o.connect(lp); lp.connect(eg); src = eg; o.start(tt); o.stop(tt + (X.hold ? 60 : L + 0.5)); }
                if (sw > 0.01 && !X.hold) { v.gain.setValueAtTime(0.0001, tt); v.gain.linearRampToValueAtTime(lv * gk, tt + 0.05 + sw * 0.9); } else v.gain.value = lv * gk; src.connect(v); v.connect(A.in); razorGate(A, X, tt, tt + Math.max(0.02, d - i * sp) + (mute > 0.5 ? 0.015 : 0.06), s);
                H(X, v.gain, 0.07, src.port ? [{ stop: () => { try { src.port.postMessage('off'); } catch (e) {} } }] : [], null);
            });
        },
        screech(X, t, d, s, vel, notes) {
            let c = X.ctx, V = (k, d0) => s[k] == null ? d0 : s[k], beat = 60 / (X.bpm || 120), len = X.hold ? 30 : d, rel = 0.02 + Math.pow(V('rel', 0.2), 2) * 1.5, at = 0.002 + Math.pow(V('att', 0.05), 2) * 0.8;
            const sync = [4, 2, 1, 0.5, 0.25, 1 / 3, 1 / 6][Math.min(6, Math.floor(V('wrate', 0.6) * 7))] * beat;
            notes.forEach((nt, i) => {
                let f = hz(nt + octOf(V('oct', 0.5)) * 12), dv = V('dive', 0.5) * 24, dt = 0.01 + Math.pow(V('dtime', 0.3), 2) * 0.6, det = V('det', 0.4) * 0.025, out = c.createGain(), pn = c.createStereoPanner();
                const os = [1 - det, 1 + det].map(k => { let o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f * k * Math.pow(2, dv / 12), t); o.frequency.exponentialRampToValueAtTime(f * k, t + dt); return o; });
                let mod = c.createOscillator(), mg = c.createGain(), fm = V('fm', 0.4) * f * 4, mix = c.createGain(); mod.frequency.setValueAtTime(f * [0.5, 1, 2, 3][Math.min(3, Math.floor(V('ratio', 0.4) * 4))] * Math.pow(2, dv / 12), t); mod.frequency.exponentialRampToValueAtTime(f * [0.5, 1, 2, 3][Math.min(3, Math.floor(V('ratio', 0.4) * 4))], t + dt);
                mg.gain.setValueAtTime(fm, t); mod.connect(mg); os.forEach(o => { mg.connect(o.frequency); o.connect(mix); }); mix.gain.value = 0.35;
                let d1 = c.createWaveShaper(), d2 = c.createWaveShaper(), f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter(), hp = c.createBiquadFilter(), lp = c.createBiquadFilter();
                d1.curve = scurve(1 + V('dirt', 0.6) * 14); d2.curve = scurve(1 + V('tear', 0.5) * 30); d1.oversample = '2x'; d2.oversample = '4x';
                const v0 = V('vowel', 0.5), F1 = expo(300, 1100, v0), F2 = expo(900, 3400, v0), sw = V('sweep', 0.6);
                [[f1, F1], [f2, F2]].forEach(([fl, fc]) => { fl.type = 'peaking'; fl.Q.value = 2 + V('res', 0.6) * 14; fl.gain.value = 10 + V('res', 0.6) * 14; fl.frequency.setValueAtTime(Math.min(16000, fc * (1 + sw * 3)), t); fl.frequency.exponentialRampToValueAtTime(fc, t + 0.03 + V('stime', 0.3) * 0.8); });
                if (V('wob', 0.3) > 0.01) { let lfo = c.createOscillator(), lg = c.createGain(); lfo.type = 'triangle'; lfo.frequency.value = 1 / sync; lg.gain.value = F1 * V('wob', 0.3) * 0.8; lfo.connect(lg); lg.connect(f1.frequency); let lg2 = c.createGain(); lg2.gain.value = F2 * V('wob', 0.3) * 0.8; lfo.connect(lg2); lg2.connect(f2.frequency); lfo.start(t); lfo.stop(t + len + rel + 0.1); }
                hp.type = 'highpass'; hp.frequency.value = 180; lp.type = 'lowpass'; lp.frequency.value = expo(2500, 16000, V('tone', 0.6)); lp.Q.value = 0.5;
                mix.connect(d1); d1.connect(f1); f1.connect(f2); f2.connect(d2); d2.connect(hp); hp.connect(lp); lp.connect(out); out.connect(pn); pn.connect(X.out);
                pn.pan.value = notes.length > 1 ? (i / (notes.length - 1) - 0.5) * V('wide', 0.4) : 0;
                let lv = vel * V('vol', 0.75) * 0.32 / Math.sqrt(notes.length);
                out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(lv, t + at); out.gain.setValueAtTime(lv, t + Math.max(at, len)); out.gain.setTargetAtTime(0, t + Math.max(at, len), rel / 4);
                [mod].concat(os).forEach(o => { o.start(t); o.stop(t + len + rel * 2 + 0.1); });
                H(X, out.gain, rel, [mod].concat(os), null);
            });
        },
        spine(X, t, d, s, vel, notes) {
            let c = X.ctx, V = (k, d0) => s[k] == null ? d0 : s[k], R = rngOf(X), A = spineRig(X, t, s), mute = V('mute', 0), sus = 1 + Math.pow(V('sus', 0.5), 1.4) * 9;
            notes.forEach(nt => {
                let m = nt + octOf(V('oct', 0.5)) * 12, f = hz(m), src = null, v = c.createGain(), br = Math.min(1, V('pick', 0.3) * 0.6 + vel * 0.25 + V('clank', 0.5) * 0.15);
                if (c._nbwk) { try { src = new AudioWorkletNode(c, 'nb-bass', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { start: t, dur: X.hold ? -1 : Math.max(0.03, d), f, nt: m, vel, mute, sus, br, hard: V('pick', 0.3), pu: 0.06 + V('pos', 0.5) * 0.22, clank: V('clank', 0.5), seed: Math.floor(R() * 4294967295) || 9, life: X.hold ? 60 : d + 1.5 } }); } catch (e) { src = null; } }
                if (!src) { let o = c.createOscillator(), lp = c.createBiquadFilter(), eg = c.createGain(); o.type = 'sawtooth'; o.frequency.value = f; lp.frequency.value = 600 + br * 1500; eg.gain.setValueAtTime(0.6 * vel, t); eg.gain.setTargetAtTime(0, t + (X.hold ? 30 : d), 0.06); o.connect(lp); lp.connect(eg); src = eg; o.start(t); o.stop(t + (X.hold ? 60 : d + 0.5)); }
                v.gain.value = 0.95 / Math.sqrt(notes.length); src.connect(v); v.connect(A.in);
                H(X, v.gain, 0.06, src.port ? [{ stop: () => { try { src.port.postMessage('off'); } catch (e) {} } }] : [], null);
            });
        },
        maw(X, t, d, s, vel, notes) {
            let z = s.smp, c = X.ctx; if (!z || !window.NBA) return; let e = NBA.pool.get(z.id); if (!e) { NBA.load(z.id); return; } if (e.state !== 'ok' || !NBA.bufFor) return;
            const V = (k, x0) => s[k] == null ? x0 : s[k], rev = V('rev', 0) >= 0.5, buf = NBA.bufFor(c, e, rev), dur = e.dur, st = Math.min(V('st', 0), V('en', 1) - 0.01), en = Math.max(V('en', 1), st + 0.01);
            const att = 0.001 + Math.pow(V('att', 0.02), 2) * 2, rel = 0.005 + Math.pow(V('rel', 0.2), 2) * 4, lv = (1 - V('velv', 0.6) + V('velv', 0.6) * vel) * V('vol', 0.75) * 1.2, tun = (V('tune', 0.5) - 0.5) * 48 + (V('fine', 0.5) - 0.5) + octOf(V('oct', 0.5)) * 12;
            const slices = V('mode', 0) >= 0.5, CH = X.chokes;
            notes.forEach(m => {
                let src = c.createBufferSource(), g = c.createGain(), fl = c.createBiquadFilter(), a0, a1, rate, len;
                src.buffer = buf; fl.type = 'lowpass'; fl.frequency.value = V('cut', 1) > 0.99 ? 20000 : expo(60, 18000, V('cut', 1)); fl.Q.value = 0.5 + V('res', 0.1) * 14;
                const at = u => (rev ? 1 - u : u) * dur;
                if (!slices) { rate = Math.pow(2, (m - 69 - 12 * Math.log2((z.root || 261.63) / 440) + tun) / 12); a0 = Math.min(at(st), at(en)); a1 = Math.max(at(st), at(en));
                    if (V('loop', 0) >= 0.5) { src.loop = true; let ls = st + (en - st) * V('lst', 0.5); src.loopStart = rev ? at(en) : at(ls); src.loopEnd = rev ? at(ls) : at(en); len = X.hold ? 30 : d; }
                    else len = Math.min(X.hold ? 30 : d, (a1 - a0) / rate); }
                else { const cu = MAW.cuts(e, st, en, V('slices', 0.6), V('by', 0.75)), n = cu.length, k = (((m - 60) % n) + n) % n, s0 = cu[k], s1 = k + 1 < n ? cu[k + 1] : en;
                    rate = Math.pow(2, tun / 12); a0 = Math.min(at(s0), at(s1)); a1 = Math.max(at(s0), at(s1)); len = (a1 - a0) / rate; if (V('gate', 0.25) >= 0.5) len = Math.min(len, X.hold ? 30 : d); }
                src.playbackRate.value = rate; len = Math.max(0.01, len);
                g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(lv, t + att); g.gain.setValueAtTime(lv, t + Math.max(att, len - 0.004)); g.gain.setTargetAtTime(0, t + Math.max(att, len), rel / 4);
                src.connect(fl); fl.connect(g); g.connect(X.out); src.start(t, a0); src.stop(t + len + rel + 0.05);
                if (slices && V('choke', 0.75) >= 0.5 && CH) { let pv = CH.maw; if (pv && pv.t < t) { try { pv.g.gain.cancelScheduledValues(t); pv.g.gain.setTargetAtTime(0, t, 0.003); pv.s.stop(t + 0.03); } catch (er) {} } CH.maw = { g, s: src, t }; }
                H(X, g.gain, rel, [src], null);
            });
        },
        serpent(X, t, d, s, vel, notes) {
            let c = X.ctx, out = X.out, R = rngOf(X), rel = 0.005 + Math.pow(s.r1 == null ? 0.3 : s.r1, 2) * 8, vm = Math.min(2, Math.floor((s.vm || 0) * 3));
            const tb = (k, old, def) => { let i = s[k] != null ? Math.round(s[k]) : s[old] != null ? Math.min(15, Math.floor(s[old] * 16)) : def; return tableOwned(i) ? i : 0; };
            let ti = { tA: tb('tA', 'ta', 0), tB: tb('tB', 'tb', 1), tC: tb('tC', 'tc', 2) };
            let mono = vm ? (X.mono.serp = X.mono.serp || {}) : null;
            let tu = Math.min(4, Math.floor((s.tun || 0) * 5)), cents = SERP_TUN[tu];
            let wantS = ['a', 'b', 'c'].filter(k => { let kd = Math.floor((s['ok' + k] || 0) * 7); return (kd === 2 || kd === 3) && (s['on' + k.toUpperCase()] == null ? 0.75 : s['on' + k.toUpperCase()]) >= 0.5; });
            const off = typeof OfflineAudioContext !== 'undefined' && c instanceof OfflineAudioContext;
            notes.slice(0, vm ? 1 : notes.length).forEach(nt => {
                let m = nt + octOf(s.oct) * 12, pc = (((m - (X.root || 0)) % 12) + 12) % 12, f = hz(m) * (cents ? Math.pow(2, (cents[pc] - pc * 100) / 1200) : 1);
                // drift. old synths are never in tune and thats why they sound good
                if ((s.drf || 0) > 0.001) f *= Math.pow(2, (R() * 2 - 1) * s.drf * 18 / 1200);
                let v = c.createGain(), src = null, life = (X.hold ? 30 : d), from = f;
                if (mono) { let overlap = mono.end > t + 0.001; if (mono.f && (vm === 1 || overlap)) from = mono.f; if (mono.v && overlap) { try { mono.v.gain.setTargetAtTime(0, t, 0.008); } catch (e) {} } mono.f = f; mono.end = t + life; mono.v = v; }
                if (c._nbwk) { try { src = new AudioWorkletNode(c, 'nb-wt', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: Object.assign({ start: t, dur: X.hold ? -1 : d, f, from: (s.gl || 0) > 0.001 ? from : f, vel, bpm: X.bpm, seed: Math.floor(R() * 4294967295) || 3, s, off, ex: X.ex || null, wh: X.wh || 0 }, ti, smpFor(c, s, wantS, f, vel)) }); } catch (e) { src = null; } }
                if (!src) { let o = c.createOscillator(), lp = c.createBiquadFilter(), eg = c.createGain(); o.type = 'sawtooth'; o.frequency.value = f; lp.frequency.value = expo(30, 18000, s.fc == null ? 0.6 : s.fc); eg.gain.setValueAtTime(0, t); eg.gain.linearRampToValueAtTime(vel * 0.3, t + 0.01); eg.gain.setTargetAtTime(0, t + life, rel / 4); o.connect(lp); lp.connect(eg); src = eg; o.start(t); o.stop(t + life + rel + 0.1); }
                v.gain.value = 1; src.connect(v); v.connect(out);
                H(X, v.gain, rel, src.port ? [{ stop: () => { try { src.port.postMessage('off'); } catch (e) {} } }] : [], src.port ? m2 => { try { src.port.postMessage(m2); } catch (e) {} } : null);
            });
        },
        breath(X, t, d, s, vel, notes) {
            if (moanSing(X, t, d, s, vel, notes) || breathSing(X, t, d, s, vel, notes)) return;
            const R = rngOf(X);
            const VW = [[750, 1150, 2800], [480, 820, 2600], [330, 700, 2400], [520, 1750, 2500]];
            let c = X.ctx, out = X.out, k = Math.min(2, Math.floor(s.kind * 3)), att = 0.01 + Math.pow(s.att, 2) * 2, rel = 0.05 + Math.pow(s.rel, 2) * 4, vw = VW[Math.min(3, Math.floor(s.vowel * 4))];
            let g = X.hold ? 1.4 : Math.max(0.15, d);
            if (k === 3) { att = 0.05 + Math.min(g, 0.7) * 0.45; rel = 0.04; }
            let end = t + (k === 3 ? att + 0.25 : d + rel);
            notes.forEach((nt, ni) => {
                let m = nt + octOf(s.oct) * 12, f = hz(m), sum = c.createGain(), v = c.createGain(), pn = c.createStereoPanner(), os = [];
                pn.pan.value = notes.length > 1 ? (ni / (notes.length - 1) - 0.5) * 0.6 : 0;
                if (k === 1) {
                    let o = c.createOscillator(), o2 = c.createOscillator(), ch = c.createOscillator(), og = c.createGain(), cg = c.createGain(), w1 = c.createOscillator(), w2 = c.createOscillator(), wg = c.createGain();
                    o.type = 'sawtooth'; o2.type = 'sawtooth'; o2.detune.value = 9 + R() * 6; ch.type = 'triangle';
                    let f0 = f * Math.pow(2, -(1 + Math.round(s.scoop * 7)) / 12), top = f * Math.pow(2, 1.5 / 12), fall = f * Math.pow(2, -(2 + Math.round(s.fall * 12)) / 12);
                    let open = t + 0.09 + R() * 0.08, peak = t + g * 0.38, sag = t + g;
                    [o, o2, ch].forEach((q, i) => { let mul = i === 2 ? 0.5 : 1; q.frequency.setValueAtTime(f0 * mul, t); q.frequency.exponentialRampToValueAtTime(top * mul, peak); q.frequency.exponentialRampToValueAtTime(f * mul, t + g * 0.6); q.frequency.exponentialRampToValueAtTime(fall * mul, sag); });
                    og.gain.value = 0.55 * (1 - s.air * 0.6); cg.gain.value = 0.22;
                    w1.frequency.value = 5.1 + R() * 0.8; w2.frequency.value = 6.9 + R() * 1.6; wg.gain.setValueAtTime(0, t); wg.gain.linearRampToValueAtTime(f * (0.004 + s.shake * 0.022), t + g * 0.55);
                    w1.connect(wg); w2.connect(wg); [o, o2, ch].forEach(q => wg.connect(q.frequency));
                    o.connect(og); o2.connect(og); ch.connect(cg);
                    let hum = c.createBiquadFilter(), nas = c.createBiquadFilter(), hg = c.createGain(), mg = c.createGain();
                    hum.type = 'lowpass'; hum.frequency.value = 480; hum.Q.value = 1.4; nas.type = 'peaking'; nas.frequency.value = 270; nas.gain.value = 10; nas.Q.value = 2.2;
                    og.connect(nas); nas.connect(hum); hum.connect(hg); hg.connect(sum);
                    hg.gain.setValueAtTime(1, t); hg.gain.setTargetAtTime(0.06, open, 0.05);
                    mg.gain.setValueAtTime(0, t); mg.gain.setTargetAtTime(1, open, 0.06); mg.connect(sum);
                    [[750, 480], [1150, 820], [2800, 2600]].forEach(([a, b], j) => {
                        let bp = c.createBiquadFilter(), bg = c.createGain(); bp.type = 'bandpass'; bp.Q.value = [5, 7, 9][j];
                        bp.frequency.setValueAtTime(a * (0.92 + R() * 0.12), open); bp.frequency.linearRampToValueAtTime(b, sag);
                        bg.gain.value = [1.5, 0.9, 0.35][j]; og.connect(bp); cg.connect(bp); bp.connect(bg); bg.connect(mg);
                    });
                    [o, o2, ch, w1, w2].forEach(q => { q.start(t); q.stop(end + 0.1); }); os.push(o, o2, ch, w1, w2);
                    let n = c.createBufferSource(), na = c.createGain(), nf = c.createBiquadFilter(); n.buffer = X.nb; n.loop = true; nf.type = 'bandpass'; nf.frequency.setValueAtTime(900, t); nf.frequency.linearRampToValueAtTime(700, sag); nf.Q.value = 1.1;
                    na.gain.setValueAtTime(s.air * 0.35, t); na.gain.linearRampToValueAtTime(s.air * 0.12, peak); na.gain.linearRampToValueAtTime(s.air * 0.6, sag);
                    n.connect(nf); nf.connect(na); na.connect(sum); n.start(t, R() * 1.5); n.stop(end + 0.1); os.push(n);
                } else {
                    if (k !== 3) {
                        let o = c.createOscillator(), o2 = c.createOscillator(), og = c.createGain(), w1 = c.createOscillator(), w2 = c.createOscillator(), wg = c.createGain();
                        o.type = 'sawtooth'; o2.type = 'triangle'; o2.detune.value = 6; og.gain.value = (1 - s.air * 0.85) * (k === 2 ? 0.6 : 1);
                        let f0 = f * Math.pow(2, -Math.round(s.scoop * 7) / 12), fall = f * Math.pow(2, -Math.round(s.fall * 12) / 12);
                        [o, o2].forEach(q => { q.frequency.setValueAtTime(f0, t); q.frequency.exponentialRampToValueAtTime(f, t + 0.08 + s.scoop * 0.3); q.frequency.setTargetAtTime(fall, t + Math.max(0.1, d), rel / 2); });
                        w1.frequency.value = 4.7 + R() * 1.2; w2.frequency.value = 7.3 + R() * 2; wg.gain.value = f * s.shake * 0.018; w1.connect(wg); w2.connect(wg); wg.connect(o.frequency); wg.connect(o2.frequency);
                        o.connect(og); o2.connect(og); [o, o2, w1, w2].forEach(q => { q.start(t); q.stop(end + 0.1); }); os.push(o, o2, w1, w2);
                        if (k === 2) { let lp = c.createBiquadFilter(), nas = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 650; lp.Q.value = 1.2; nas.type = 'peaking'; nas.frequency.value = 260; nas.gain.value = 9; nas.Q.value = 2; og.connect(nas); nas.connect(lp); lp.connect(sum); }
                        else vw.forEach((F0, j) => { let b = c.createBiquadFilter(), bg = c.createGain(); b.type = 'bandpass'; b.Q.value = 6 + j * 3; b.frequency.value = F0; bg.gain.value = [1, 0.55, 0.22][j] * 1.6; og.connect(b); b.connect(bg); bg.connect(sum); });
                    }
                    let n = c.createBufferSource(), na = c.createGain(); n.buffer = X.nb; n.loop = true; na.gain.value = k === 3 ? 1.8 : s.air * (k === 2 ? 0.35 : 1);
                    n.connect(na);
                    if (k === 3) {
                        let bp = c.createBiquadFilter(), hs = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.6; bp.frequency.setValueAtTime(Math.min(3000, 500 + f * 1.5), t); bp.frequency.exponentialRampToValueAtTime(Math.min(9000, 1600 + f * 5), t + att);
                        hs.type = 'highshelf'; hs.frequency.value = 4000; hs.gain.value = 4; na.connect(bp); bp.connect(hs); hs.connect(sum);
                    }
                    else vw.forEach((F0, j) => { let b = c.createBiquadFilter(), bg = c.createGain(); b.type = 'bandpass'; b.Q.value = 3 + j; b.frequency.value = F0 * (1 + j * 0.05); bg.gain.value = [0.7, 0.5, 0.35][j]; na.connect(b); b.connect(bg); bg.connect(sum); });
                    n.start(t, R() * 1.5); n.stop(end + 0.1); os.push(n);
                }
                if (s.catch > 0.02 && k !== 3) { let cn = c.createBufferSource(), cf = c.createBiquadFilter(), cg = c.createGain(); cn.buffer = X.nb; cf.type = 'bandpass'; cf.frequency.value = 1800; cf.Q.value = 2; cg.gain.setValueAtTime(s.catch * vel * 1.2, t); cg.gain.exponentialRampToValueAtTime(0.0005, t + 0.03); cn.connect(cf); cf.connect(cg); cg.connect(sum); cn.start(t, R()); cn.stop(t + 0.05); }
                let pk = vel * (k === 3 ? 1.3 : k === 1 ? 1.5 : 1.8) / Math.sqrt(notes.length);
                v.gain.setValueAtTime(0, t);
                if (k === 3) { v.gain.linearRampToValueAtTime(pk * 0.3, t + att * 0.5); v.gain.exponentialRampToValueAtTime(pk, t + att); v.gain.setTargetAtTime(0, t + att, 0.018); }
                else if (k === 1) { v.gain.linearRampToValueAtTime(pk * 0.55, t + Math.max(0.03, att * 0.4)); v.gain.linearRampToValueAtTime(pk, t + Math.max(att, g * 0.38)); v.gain.linearRampToValueAtTime(pk * 0.7, t + Math.max(att + 0.05, g)); v.gain.setValueAtTime(pk * 0.7, t + Math.max(att + 0.05, g, d)); v.gain.setTargetAtTime(0, t + Math.max(att + 0.05, g, d), rel / 4); }
                else { v.gain.linearRampToValueAtTime(pk, t + att); v.gain.setValueAtTime(pk, t + Math.max(att, d)); v.gain.setTargetAtTime(0, t + Math.max(att, d), rel / 4); }
                sum.connect(v); v.connect(pn); pn.connect(out);
                if (k !== 3) H(X, v.gain, rel, os);
            });
        },
        lash(X, t, d, s, vel) {
            const R = rngOf(X);
            let c = X.ctx, out = X.out, k = Math.min(5, Math.floor(s.kind * 6)), sm = semis(X.semi * 0.5), len = 0.04 + Math.pow(s.decay, 1.5) * 0.5, v = c.createGain(), pk = vel;
            let hands = [1, 2, 4][Math.min(2, Math.floor(s.hands * 3))];
            const burst = (at, f, q, g, l, type, to) => { let n = c.createBufferSource(), b = c.createBiquadFilter(), ng = c.createGain(); n.buffer = X.nb; b.type = type || 'bandpass'; b.frequency.value = Math.min(16000, f); b.Q.value = q; ng.gain.setValueAtTime(0.0001, at); ng.gain.exponentialRampToValueAtTime(g, at + 0.0015); ng.gain.exponentialRampToValueAtTime(0.0003, at + l); n.connect(b); b.connect(ng); ng.connect(to || v); n.start(at, R() * 1.5); n.stop(at + l + 0.05); };
            const thud = (at, f, g, l) => { let o = c.createOscillator(), og = c.createGain(); o.frequency.setValueAtTime(f * 1.8, at); o.frequency.exponentialRampToValueAtTime(f, at + 0.02); og.gain.setValueAtTime(0.0001, at); og.gain.exponentialRampToValueAtTime(g, at + 0.002); og.gain.exponentialRampToValueAtTime(0.0003, at + l); o.connect(og); og.connect(v); o.start(at); o.stop(at + l + 0.05); };
            const ping = (at, f, g, l) => { let o = c.createOscillator(), m = c.createOscillator(), mg = c.createGain(), og = c.createGain(); o.frequency.value = f; m.frequency.value = f * 2.76; mg.gain.value = f * 1.5; m.connect(mg); mg.connect(o.frequency); og.gain.setValueAtTime(0.0001, at); og.gain.exponentialRampToValueAtTime(g, at + 0.001); og.gain.exponentialRampToValueAtTime(0.0002, at + l); o.connect(og); og.connect(v); o.start(at); m.start(at); o.stop(at + l + 0.05); m.stop(at + l + 0.05); };
            const tone = expo(0.6, 1.7, s.tone) * sm;
            for (let h = 0; h < hands; h++) {
                let at = t + (h ? (R() * 0.012 + h * 0.004) : 0), g = h ? 0.6 : 1;
                if (k === 0) { let hv = Math.min(1, vel), rr2 = 0.9 + R() * 0.2; burst(at, 3000 * tone, -3, pk * (0.3 + hv * 0.4) * g, 0.004, 'highpass'); burst(at, (1200 + hv * 1300) * tone * rr2, 0.7, pk * (0.7 + s.snap * 0.6) * g, 0.015 + len * 0.12); let lp2 = c.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = (2500 + hv * 4000) * tone; lp2.Q.value = -3.01; lp2.connect(v); burst(at, 6000 * tone, 0.7, pk * s.snap * 0.3 * hv * g, 0.006 + len * 0.02, null, lp2);
                    burst(at + 0.002, 500 * tone, 0.7, pk * s.flesh * 0.8 * g, 0.03 + len * 0.1, 'lowpass'); thud(at, 95 * tone * rr2, pk * s.flesh * 0.9 * g, 0.08 + len * 0.3); }
                if (k === 1) { burst(at, 900 * tone, 3, pk * 0.9 * g, 0.04 + len * 0.2); ping(at, 620 * tone, pk * 0.25 * g, 0.03 + len * 0.15); burst(at, 3000 * tone, 1, pk * s.snap * 0.5 * g, 0.015); thud(at, 85 * tone, pk * s.flesh * 1.1 * g, 0.08 + len * 0.4); }
                if (k === 2) {
                    let sw = (0.05 + (1 - s.snap) * 0.12) * (0.8 + R() * 0.4), n = c.createBufferSource(), b = c.createBiquadFilter(), ng = c.createGain(); n.buffer = X.nb; b.type = 'bandpass'; b.Q.value = 0.6; b.frequency.setValueAtTime(350 * tone, at); b.frequency.exponentialRampToValueAtTime(3000 * tone, at + sw); ng.gain.setValueAtTime(0.0001, at); ng.gain.exponentialRampToValueAtTime(pk * 0.3 * g, at + sw); ng.gain.exponentialRampToValueAtTime(0.0003, at + sw + 0.02); n.connect(b); b.connect(ng); ng.connect(v); n.start(at, R()); n.stop(at + sw + 0.05);
                    { let cs = c.createBufferSource(), ch = c.createBiquadFilter(), cg = c.createGain(); cs.buffer = crackOf(c, R); ch.type = 'highpass'; ch.frequency.value = 300 + R() * 300; ch.Q.value = -3.01; cg.gain.value = pk * 1.3 * g; cs.connect(ch); ch.connect(cg); cg.connect(v); cs.start(at + sw); } burst(at + sw, 1200 * tone * (0.85 + R() * 0.3), -3, pk * 1.1 * g, 0.002 + len * 0.012, 'highpass'); burst(at + sw + 0.001, 2500 * tone, 0.5, pk * 0.25 * g, 0.015 + len * 0.04); if (s.flesh > 0.05) thud(at + sw, 140 * tone, pk * s.flesh * 0.5 * g, 0.04);
                }
                if (k === 3) { let n2 = 3 + Math.round(s.snap * 5); for (let i = 0; i < n2; i++) ping(at + R() * (0.02 + len * 0.15), (2600 + R() * 2400) * tone, pk * 0.18 * g, 0.05 + len * (0.5 + R())); burst(at, 7000 * tone, 2, pk * 0.15 * g, 0.03 + len * 0.2); }
                if (k === 4) { burst(at, 4200 * tone, 2.5, pk * (0.5 + s.snap * 0.5) * g, 0.008 + s.snap * 0.01); ping(at, 1450 * tone, pk * 0.3 * g, 0.03 + len * 0.3); thud(at, 180 * tone, pk * s.flesh * 0.3 * g, 0.03); }
                if (k === 5) {
                    let n = c.createBufferSource(), b = c.createBiquadFilter(), ng = c.createGain(), l = 0.02 + len * 0.12; n.buffer = X.nb; b.type = 'bandpass'; b.Q.value = 6; b.frequency.setValueAtTime(900 * tone, at); b.frequency.exponentialRampToValueAtTime(2600 * tone, at + l); ng.gain.setValueAtTime(0.0001, at); ng.gain.exponentialRampToValueAtTime(pk * 1.2 * g, at + 0.003); ng.gain.exponentialRampToValueAtTime(0.0003, at + l); n.connect(b); b.connect(ng); ng.connect(v); n.start(at, R()); n.stop(at + l + 0.05);
                    let o = c.createOscillator(), og = c.createGain(); o.frequency.setValueAtTime(700 * tone, at); o.frequency.exponentialRampToValueAtTime(1500 * tone, at + l); og.gain.setValueAtTime(0.0001, at); og.gain.exponentialRampToValueAtTime(pk * 0.08 * (0.3 + s.snap), at + 0.004); og.gain.exponentialRampToValueAtTime(0.0002, at + l); o.connect(og); og.connect(v); o.start(at); o.stop(at + l + 0.05);
                }
            }
            if (s.room > 0.02) { let cv = c.createConvolver(), rg = c.createGain(), lp = c.createBiquadFilter(); cv.buffer = lashRoom(c, Math.round(s.room * 8)); lp.type = 'lowpass'; lp.frequency.value = 5000; lp.Q.value = -3.01; rg.gain.value = s.room * 0.9; v.connect(cv); cv.connect(lp); lp.connect(rg); rg.connect(out); }
            v.gain.value = 0.9 * (k === 5 ? 4 : 1); v.connect(out);
        },
        wail(X, t, d, s, vel, notes) {
            if ((s.eng == null ? 1 : s.eng) >= 0.5 && X.ctx._nbwk && wailSing(X, t, d, s, vel, notes)) return;
            const R = rngOf(X), VW = [[750, 1150, 2800], [480, 820, 2600], [330, 700, 2400]];
            let c = X.ctx, out = X.out, n = 2 + Math.round(s.voices * 6), vw = VW[Math.min(2, Math.floor(s.vowel * 3))], rv = s.rev >= 0.5, att = 0.02 + Math.pow(s.att, 2) * 4, rel = 0.05 + Math.pow(s.rel, 2) * 6;
            if (rv) { att = Math.max(0.2, d * 0.95); rel = 0.03; }
            let end = t + Math.max(att, d) + rel, cl = Math.min(3, Math.floor(s.cluster * 4)), extra = [[], [1], [6], [1, 6]][cl];
            notes.forEach(nt => {
                let base = nt + octOf(s.oct) * 12, sum = c.createGain(), v = c.createGain(), os = [], pk = vel * 0.7 / Math.sqrt(notes.length);
                vw.forEach((F0, j) => { let b = c.createBiquadFilter(), bg = c.createGain(); b.type = 'bandpass'; b.frequency.value = F0; b.Q.value = 7 + j * 3; bg.gain.value = [1, 0.5, 0.2][j] * 1.8; sum.connect(b); b.connect(bg); bg.connect(v); });
                [0].concat(extra).forEach((iv, li) => {
                    for (let k = 0; k < n; k++) {
                        let o = c.createOscillator(), og = c.createGain(), pn = c.createStereoPanner(), w = c.createOscillator(), wg = c.createGain(), f = hz(base + iv) * Math.pow(2, (R() - 0.5) * 0.35 / 12);
                        o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t); if (s.sink > 0.01) o.frequency.exponentialRampToValueAtTime(f * Math.pow(2, -s.sink * 12 / 12 * (0.7 + R() * 0.6)), end);
                        w.frequency.value = 0.15 + R() * 0.6; wg.gain.value = f * s.drift * 0.012; w.connect(wg); wg.connect(o.frequency);
                        og.gain.value = (li ? 0.45 : 1) / Math.sqrt(n); pn.pan.value = (R() * 2 - 1) * 0.8;
                        o.connect(og); og.connect(pn); pn.connect(sum); o.start(t, R() * 0.1); w.start(t); o.stop(end + 0.1); w.stop(end + 0.1); os.push(o, w);
                    }
                });
                if (s.air > 0.02) { let nb = c.createBufferSource(), ng = c.createGain(); nb.buffer = X.nb; nb.loop = true; ng.gain.value = s.air * 0.7; nb.connect(ng); ng.connect(sum); nb.start(t, R()); nb.stop(end + 0.1); os.push(nb); }
                v.gain.setValueAtTime(0, t);
                if (rv) { v.gain.linearRampToValueAtTime(pk * 0.1, t + att * 0.4); v.gain.exponentialRampToValueAtTime(pk, t + att); v.gain.setValueAtTime(0, t + att + 0.01); }
                else { v.gain.linearRampToValueAtTime(pk, t + att); v.gain.setValueAtTime(pk, t + Math.max(att, d)); v.gain.setTargetAtTime(0, t + Math.max(att, d), rel / 4); }
                v.connect(out); H(X, v.gain, rel, os);
            });
        },
        bones(X, t, d, s, vel) {
            const R = rngOf(X);
            let c = X.ctx, k = Math.min(4, Math.floor(s.kind * 5)), tn = expo(0.5, 2, s.tone) * semis(X.semi * 0.5), len = 0.05 + Math.pow(s.decay, 1.5) * 1.5, v = c.createGain(), sh = c.createWaveShaper(), lp = c.createBiquadFilter(), out = X.out, pk = vel;
            sh.curve = curve(1 + s.dirt * 9, 1024); lp.type = 'lowpass'; lp.frequency.value = expo(16000, 900, s.far); v.connect(sh); sh.connect(lp); lp.connect(out);
            const hit = (at, f, q, g, l) => { let n = c.createBufferSource(), b = c.createBiquadFilter(), ng = c.createGain(); n.buffer = X.nb; b.type = 'bandpass'; b.frequency.value = Math.min(15000, f); b.Q.value = q; ng.gain.setValueAtTime(0.0001, at); ng.gain.exponentialRampToValueAtTime(g, at + 0.001); ng.gain.exponentialRampToValueAtTime(0.0002, at + l); n.connect(b); b.connect(ng); ng.connect(v); n.start(at, R()); n.stop(at + l + 0.05); };
            const ring = (at, f, g, l) => { let o = c.createOscillator(), og = c.createGain(); o.frequency.value = f; og.gain.setValueAtTime(0.0001, at); og.gain.exponentialRampToValueAtTime(g, at + 0.001); og.gain.exponentialRampToValueAtTime(0.0002, at + l); o.connect(og); og.connect(v); o.start(at); o.stop(at + l + 0.05); };
            if (k === 0) { [0, 0.018 + R() * 0.02].forEach((o, i) => { hit(t + o, 1800 * tn, 9, pk * (i ? 0.6 : 1), 0.03 + len * 0.05); [[1, 0.25, 1], [2.57, 0.12, 0.6], [4.2, 0.06, 0.4]].forEach(([r, g2, dm]) => ring(t + o, (820 + i * 140) * tn * r, pk * g2, (0.04 + len * 0.08) * dm)); }); }
            if (k === 1) { let n = 8 + Math.round(len * 20); for (let i = 0; i < n; i++) { let o = R() * (0.05 + len * 0.4); hit(t + o, (2000 + R() * 3000) * tn, 12, pk * (0.2 + R() * 0.4) * (1 - o / (0.06 + len * 0.4)), 0.012); } }
            if (k === 2 && c._nbwk) { let l = 0.3 + len * 1.2, tx = null; try { tx = new AudioWorkletNode(c, 'nb-tex', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { start: t, seed: 1 + Math.floor(R() * 2147483645), end: t + l + 0.6, len: l } }); } catch (e) { tx = null; }
                if (tx) { let P = tx.parameters, cg = c.createGain(); P.get('kind').value = 5; P.get('dens').value = 0.5; P.get('tone').value = s.tone; P.get('motion').value = 0.7; cg.gain.setValueAtTime(0, t); cg.gain.linearRampToValueAtTime(pk * 0.8, t + l * 0.15); cg.gain.setValueAtTime(pk * 0.8, t + l * 0.6); cg.gain.linearRampToValueAtTime(0, t + l + 0.4); tx.connect(cg); cg.connect(v); k = -1; } }
            if (k === 2) { let l = 0.2 + len * 0.8, n = c.createBufferSource(), b = c.createBiquadFilter(), am = c.createOscillator(), amg = c.createGain(), ng = c.createGain(); n.buffer = X.nb; n.loop = true; b.type = 'bandpass'; b.Q.value = 5; b.frequency.setValueAtTime(3200 * tn, t); b.frequency.linearRampToValueAtTime(2200 * tn, t + l); am.type = 'square'; am.frequency.value = 9 + R() * 8; amg.gain.value = pk * 0.3; am.connect(amg); amg.connect(ng.gain); ng.gain.setValueAtTime(pk * 0.3, t); ng.gain.setTargetAtTime(0, t + l * 0.7, l * 0.2); n.connect(b); b.connect(ng); ng.connect(v); n.start(t, R()); n.stop(t + l + 0.3); am.start(t); am.stop(t + l + 0.3); for (let i = 0; i < 5; i++) ring(t + R() * l, (2400 + R() * 2600) * tn, pk * 0.06, 0.2); }
            if (k === 3) { let o = c.createOscillator(), og = c.createGain(), l = 0.4 + len; o.frequency.setValueAtTime(70 * tn, t); o.frequency.exponentialRampToValueAtTime(38 * tn, t + 0.3); og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(pk * 1.1, t + 0.01); og.gain.exponentialRampToValueAtTime(0.0002, t + l); o.connect(og); og.connect(v); o.start(t); o.stop(t + l + 0.05); hit(t, 300 * tn, 1, pk * 0.5, 0.15); }
            if (k === 4) { let l = 0.25 + len * 0.6, o = c.createOscillator(), og = c.createGain(), w = c.createOscillator(), wg = c.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(2600 * tn, t); o.frequency.linearRampToValueAtTime(3400 * tn, t + l); w.frequency.value = 23; wg.gain.value = 180; w.connect(wg); wg.connect(o.frequency); og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(pk * 0.12, t + 0.05); og.gain.setValueAtTime(pk * 0.12, t + l * 0.7); og.gain.exponentialRampToValueAtTime(0.0002, t + l); o.connect(og); og.connect(v); o.start(t); w.start(t); o.stop(t + l + 0.05); w.stop(t + l + 0.05); hit(t, 5000 * tn, 3, pk * 0.1, l); }
            v.gain.value = 1 - s.far * 0.4;
            if (s.far > 0.05) { let dl = c.createDelay(0.5), dg = c.createGain(); dl.delayTime.value = 0.06 + s.far * 0.18; dg.gain.value = s.far * 0.4; v.connect(dl); dl.connect(dg); dg.connect(lp); }
        },
        uta(X, t, d, s, vel, notes) {
            if (sing(X, t, d, s, vel, notes)) return;
            const R = rngOf(X), c = X.ctx, out = X.out;
            let syl = X.ly || ['', 'aiueon'[Math.min(5, Math.floor((s.vowel || 0) * 6))]], cn = syl[0], vw = syl[1];
            if (cn === 'Q') return;
            let legato = false;
            if (vw === 'L') { vw = X.lyPrev || 'a'; cn = ''; legato = true; }
            const big = 1 - (s.voice == null ? 0.85 : s.voice), tens = s.tens == null ? 0.5 : s.tens, br = s.breath == null ? 0.25 : s.breath, CD = SYL[cn] || SYL[''], man = CD.m || 'v';
            const ck = 0.6 + (s.cons == null ? 0.6 : s.cons) * 0.8, scl = 1 + (1 - big) * 0.15;
            let att = 0.008 + Math.pow(s.att == null ? 0.15 : s.att, 2) * 0.6, rel = 0.04 + Math.pow(s.rel == null ? 0.3 : s.rel, 2) * 2;
            let cl = (CD.cl || 0) * ck, frd = CD.fr ? CD.fr[0][4] * ck : 0, asp = (CD.asp || 0) * ck, tb = t + cl, tv = t, tr = t;
            if (man === 'stop') tv = CD.v ? tb : tb + 0.008 + asp;
            else if (man === 'fric') tv = CD.v ? t + frd * 0.45 : t + Math.max(frd, asp);
            else if (man === 'affr') tv = tb + (CD.v ? frd * 0.5 : frd);
            else if (man === 'nas') { tr = t + CD.mm * ck; tv = t; }
            let tyy = CD.yy ? Math.max(tv, tr) : 0, end = Math.max(tv, tr) + Math.max(0.05, d - (Math.max(tv, tr) - t)) + rel;
            let nst = 1 + Math.round((s.stack || 0) * 3), pk = vel * 2.2 / Math.sqrt(notes.length) / Math.sqrt(nst), wave = glottal(c, tens);
            const FV = vox(vw, big), loc = pl => (LOCUS[pl] || LOCUS.alv).map(v => v * scl);
            let FS;
            if (man === 'nas') FS = vox('n', big);
            else if (man === 'glide') FS = FV.map((q, j) => j < 3 ? [loc(CD.from)[j], 0, q[2]] : q);
            else if (CD.pl === 'vel') { let F2 = FV[1][0] > 1600 * scl ? 2300 * scl : 1350 * scl; FS = FV.map((q, j) => j === 0 ? [250 * scl, 0, q[2]] : j === 1 ? [F2 + (q[0] - F2) * 0.4, 0, q[2]] : j === 2 ? [F2 + 300 * scl, 0, q[2]] : q); }
            else if (CD.pl && CD.pl !== 'glo') { let L = loc(CD.pl); FS = FV.map((q, j) => j === 0 ? [L[0], 0, q[2]] : j < 3 ? [L[j] + (q[0] - L[j]) * 0.45, 0, q[2]] : q); }
            else if (legato || (!cn && X.lyPrev && X.prevOn)) FS = vox(X.lyPrev || vw, big);
            else FS = FV;
            const FY = CD.yy ? FV.map((q, j) => j < 3 ? [loc('y')[j], 0, q[2]] : q) : null;
            notes.forEach(nt => {
                let f = hz(nt + octOf(s.oct) * 12);
                for (let q = 0; q < nst; q++) {
                    let det = nst > 1 ? (q / (nst - 1) - 0.5) * 16 + (R() - 0.5) * 5 : 0, pn = c.createStereoPanner(), src = c.createGain(), sum = c.createGain(), v = c.createGain(), os = [];
                    pn.pan.value = nst > 1 ? (q / (nst - 1) - 0.5) * 0.75 : 0;
                    let o = c.createOscillator(), og = c.createGain(), l1 = c.createOscillator(), l1g = c.createGain(), jn = c.createBufferSource(), jl = c.createBiquadFilter(), jg = c.createGain();
                    o.setPeriodicWave(wave); o.detune.value = det; o.frequency.setValueAtTime(f * Math.pow(2, -(s.scoop == null ? 0.3 : s.scoop) * 150 / 1200), t); o.frequency.setTargetAtTime(f, tv + 0.01, 0.045);
                    let vd = tv + (s.vdel == null ? 0.4 : s.vdel) * 0.8;
                    l1.frequency.setValueAtTime(4.4 + (s.vrate == null ? 0.5 : s.vrate) * 3 + R() * 0.3, t); l1.frequency.linearRampToValueAtTime(4.8 + (s.vrate == null ? 0.5 : s.vrate) * 3 + R() * 0.4, end);
                    l1g.gain.setValueAtTime(0, t); l1g.gain.setValueAtTime(0, vd); l1g.gain.linearRampToValueAtTime(f * (s.vib == null ? 0.35 : s.vib) * 0.04, vd + 0.5);
                    jn.buffer = X.nb; jn.loop = true; jl.type = 'lowpass'; jl.frequency.value = 5; jg.gain.value = f * 0.07;
                    l1.connect(l1g); l1g.connect(o.frequency); jn.connect(jl); jl.connect(jg); jg.connect(o.frequency); o.connect(og); og.connect(src);
                    let vo = man === 'nas' || man === 'v' || man === 'tap' || man === 'glide' ? 1 : CD.v ? 0.22 : 0;
                    og.gain.setValueAtTime(vo, t); og.gain.setValueAtTime(vo, tv); og.gain.linearRampToValueAtTime(1, tv + 0.014);
                    [o, l1].forEach(z => { z.start(t); z.stop(end + 0.1); }); jn.start(t, R() * 2); jn.stop(end + 0.1); os.push(o, l1, jn);
                    let an = c.createBufferSource(), ah = c.createBiquadFilter(), ag = c.createGain(); an.buffer = X.nb; an.loop = true; ah.type = 'highpass'; ah.frequency.value = 500;
                    ag.gain.setValueAtTime(br * 0.22, t);
                    if (asp > 0 && q0(s)) { let a0 = man === 'stop' ? tb + 0.004 : t, lv = (CD.pl === 'glo' ? 1.1 : 0.75) * (0.4 + (s.cons == null ? 0.6 : s.cons)); ag.gain.setValueAtTime(br * 0.22, a0); ag.gain.linearRampToValueAtTime(lv, a0 + 0.006); ag.gain.setValueAtTime(lv, Math.max(a0 + 0.007, tv - 0.01)); ag.gain.linearRampToValueAtTime(br * 0.22, tv + 0.02); }
                    an.connect(ah); ah.connect(ag); ag.connect(src); an.start(t, R()); an.stop(end + 0.1); os.push(an);
                    let into = src;
                    if ((s.growl || 0) > 0.01) { let sb = c.createOscillator(), sg = c.createGain(), ws = c.createWaveShaper(), mx = c.createGain(); sb.setPeriodicWave(wave); sb.frequency.value = f / 2; sb.detune.value = det; sg.gain.value = s.growl * 0.6; ws.curve = curve(1 + s.growl * 6, 1024); src.connect(mx); sb.connect(sg); sg.connect(mx); mx.connect(ws); into = ws; sb.start(t); sb.stop(end + 0.1); os.push(sb); }
                    let tilt = c.createBiquadFilter(); tilt.type = 'highshelf'; tilt.frequency.value = 2000; tilt.gain.value = (Math.min(1.2, vel) - 0.7) * 12; into.connect(tilt); into = tilt;
                    let chain = into, wid = Math.max(1, Math.pow(f / 220, 0.6)), tune = (F, j) => j === 0 ? Math.max(F, f * 1.08) : j === 1 ? Math.max(F, f * 1.6) : F;
                    FV.forEach(([F, dB, bw], j) => {
                        let rz = c.createBiquadFilter(), Fa = Math.min(16000, tune(FS[j][0], j)), Fb = Math.min(16000, tune(F, j)), qq = Math.max(1.3, Fb / (bw * wid * (1.35 - tens * 0.5)));
                        if (j === 0) { rz.type = 'lowpass'; rz.Q.value = 20 * Math.log10(qq); } else { rz.type = 'peaking'; rz.Q.value = Math.min(14, qq * 0.9); rz.gain.value = [0, 16, 14, 10, 8][j] + (j === 2 ? tens * 3 : 0); }
                        rz.frequency.setValueAtTime(Fa, t);
                        if (man === 'nas') { let Fo = Math.min(16000, tune(j === 0 ? 260 * scl : j < 3 ? loc(CD.pl)[j] + (F - loc(CD.pl)[j]) * 0.45 : F, j)); rz.frequency.setValueAtTime(Fa, tr - 0.002); rz.frequency.setValueAtTime(Fo, tr); rz.frequency.setTargetAtTime(Fb, tr + 0.004, 0.018); }
                        else if (man === 'tap') { rz.frequency.setTargetAtTime(Fb, t + 0.014, 0.012); }
                        else if (man === 'glide') { rz.frequency.setTargetAtTime(Fb, t + 0.02, 0.028); }
                        else if (FS === FV) rz.frequency.setValueAtTime(Fb, t);
                        else rz.frequency.setTargetAtTime(Fb, Math.max(t + 0.001, tv - 0.005), legato || !cn ? 0.03 : 0.02);
                        if (FY && j < 3) { rz.frequency.setValueAtTime(Math.min(16000, tune(FY[j][0], j)), tyy); rz.frequency.setTargetAtTime(Fb, tyy + 0.01, 0.025); }
                        chain.connect(rz); chain = rz;
                    });
                    let ring = c.createBiquadFilter(), ng = c.createGain(); ring.type = 'highshelf'; ring.frequency.value = 3800; ring.gain.value = 4 + tens * 4;
                    // tried evening out the vowels, made it worse. leave it
                    ng.gain.value = 0.18; chain.connect(ring); ring.connect(ng); ng.connect(sum);
                    let shim = c.createGain(), sn = c.createBufferSource(), sl = c.createBiquadFilter(), sgn = c.createGain(); sn.buffer = X.nb; sn.loop = true; sl.type = 'lowpass'; sl.frequency.value = 11; sgn.gain.value = 0.08; sn.connect(sl); sl.connect(sgn); sgn.connect(shim.gain); shim.gain.value = 1; sn.start(t, R() * 2); sn.stop(end + 0.1); os.push(sn);
                    let on = man === 'nas' ? 0.5 : man === 'tap' ? 0.35 : 1, open = man === 'nas' ? tr : man === 'tap' ? t + 0.018 : tv;
                    v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(pk * on, t + 0.008);
                    if (open > t + 0.008) v.gain.setValueAtTime(pk * on, open);
                    v.gain.linearRampToValueAtTime(pk, Math.max(open, t + 0.008) + Math.max(att, man === 'nas' ? 0.025 : 0.012));
                    v.gain.setTargetAtTime(pk * 0.86, Math.max(open, t) + att + 0.02, Math.max(0.4, d * 0.6)); v.gain.setTargetAtTime(0, Math.max(Math.max(open, t) + att + 0.03, t + d), rel / 4);
                    sum.connect(shim); shim.connect(v); v.connect(pn); pn.connect(out);
                    H(X, v.gain, rel, os);
                }
            });
            if (!q0(s)) return;
            const loud = vel * (0.4 + (s.cons == null ? 0.6 : s.cons) * 1.1) * 0.6, fs = 0.9 + (1 - big) * 0.25;
            if ((man === 'stop' || man === 'affr') && CD.pl) { let B = CD.pl === 'vel' ? ['bandpass', FV[1][0] > 1600 * scl ? 2700 : 1700, 2] : BURST[CD.pl]; noiseHit(X, tb, B[0], B[1] * fs, B[2], loud * (CD.v ? 0.45 : 1), 0.001, 0.012); }
            if (CD.fr) CD.fr.forEach(([type, fr, qq, gain, len]) => noiseHit(X, man === 'affr' ? tb + 0.004 : t, type, fr * fs, qq, loud * gain, man === 'affr' ? 0.004 : 0.012, len * ck));
        },
        nocturne(X, t, d, s, vel, notes) { nocturne(X, t, d, s, vel, notes); },
        howl(X, t, d, s, vel, notes) { howl(X, t, d, s, vel, notes); },
        vesper(X, t, d, s, vel, notes) { vesper(X, t, d, s, vel, notes); },
        gloop(X, t, d, s, vel, notes) {
            const R = rngOf(X);
            let c = X.ctx, out = X.out, dec = 0.05 + Math.pow(s.dec, 1.5) * 2, rel = 0.02 + Math.pow(s.rel, 2) * 2, end = t + d + rel, cut = expo(80, 6000, s.cut);
            notes.slice().sort((a, b) => a - b).forEach((nt, ni) => {
                let m = nt + octOf(s.oct) * 12, f = hz(m), os = [], v = c.createGain(), sum = c.createGain(), lp = c.createBiquadFilter(), form = c.createBiquadFilter(), sh = c.createWaveShaper(), pk = vel * 0.32 / Math.sqrt(notes.length);
                let o = c.createOscillator(), o2 = c.createOscillator(), sub = c.createOscillator(), g2 = c.createGain(), gs = c.createGain();
                o.type = 'sawtooth'; o2.type = 'square'; sub.type = 'sine'; g2.gain.value = 0.35; gs.gain.value = 0.5 + s.thick * 0.6; o2.detune.value = 9;
                let st = s.stretch * 0.4, f0 = st > 0.005 ? f * 0.75 : f * (1 + s.plop * 0.9);
                [[o, 1], [o2, 1], [sub, 0.5]].forEach(([q, r]) => { q.frequency.setValueAtTime(f0 * r, t); q.frequency.exponentialRampToValueAtTime(f * r, t + (st > 0.005 ? st : 0.025 + s.plop * 0.06)); });
                o.connect(sum); o2.connect(g2); g2.connect(sum); sub.connect(gs); gs.connect(sum);
                sh.curve = curve(1 + s.thick * 7, 1024);
                lp.type = 'lowpass'; lp.Q.value = 3 + s.wet * 12; lp.frequency.setValueAtTime(Math.min(16000, cut * (2 + s.plop * 10)), t); lp.frequency.setTargetAtTime(cut, t + 0.004, 0.02 + dec / 6);
                form.type = 'peaking'; form.frequency.value = 420; form.Q.value = 2.5; form.gain.value = s.wet * 10;
                sum.connect(sh); sh.connect(lp); lp.connect(form); form.connect(v);
                if (s.gurgle > 0.02) { let g1 = c.createOscillator(), g3 = c.createOscillator(), gg = c.createGain(); g1.type = 'square'; g1.frequency.value = 3 + s.gurgle * 9 + R() * 2; g3.frequency.value = 0.7 + R(); gg.gain.value = cut * s.gurgle * 0.8; let sm = c.createBiquadFilter(); sm.type = 'lowpass'; sm.frequency.value = 40; sm.Q.value = -3.01; g1.connect(sm); sm.connect(gg); g3.connect(gg); gg.connect(lp.frequency); g1.start(t); g3.start(t); g1.stop(end + 0.1); g3.stop(end + 0.1); os.push(g1, g3); }
                v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(pk, t + 0.004); v.gain.setTargetAtTime(pk * 0.75, t + 0.006, dec / 3); v.gain.setTargetAtTime(0, t + d, rel / 3);
                let dc = lowCut(c, 18, -3.01); v.connect(dc); dc.connect(out); [o, o2, sub].forEach(q => { q.start(t); q.stop(end + 0.1); os.push(q); });
                H(X, v.gain, rel, os);
                if ((s.bub || 0) > 0.01 && ni === 0 && c._nbwk) { try { let tx = new AudioWorkletNode(c, 'nb-tex', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { start: t, seed: 1 + Math.floor(R() * 2147483645), end: (X.hold ? t + 3600 : end) + 0.2 } }), bg = c.createGain(), bl = c.createBiquadFilter();
                    tx.parameters.get('kind').value = 2; tx.parameters.get('dens').value = s.bub * 0.6; tx.parameters.get('tone').value = 1 - s.thick * 0.8; bl.type = 'lowpass'; bl.frequency.value = Math.min(9000, cut * 3 + 800); bl.Q.value = -3.01;
                    bg.gain.setValueAtTime(0, t); bg.gain.linearRampToValueAtTime(vel * s.bub * 0.9, t + 0.05); bg.gain.setTargetAtTime(0, t + d, rel / 3); tx.connect(bl); bl.connect(bg); bg.connect(out); H(X, bg.gain, rel, []); } catch (e) {} }
                if ((s.subl || 0) > 0.01 && ni === 0) {
                    let so = c.createOscillator(), sg = c.createGain(), sf = f * (s.subo >= 0.5 ? 0.25 : 0.5);
                    so.type = 'sine'; so.frequency.setValueAtTime(sf * (st > 0.005 ? 0.75 : 1 + s.plop * 0.25), t); so.frequency.exponentialRampToValueAtTime(sf, t + (st > 0.005 ? st : 0.03));
                    let sp = vel * 0.55 * s.subl; sg.gain.setValueAtTime(0, t); sg.gain.linearRampToValueAtTime(sp, t + 0.006); sg.gain.setTargetAtTime(sp * 0.85, t + 0.01, dec / 2); sg.gain.setTargetAtTime(0, t + d, rel / 3);
                    so.connect(sg); sg.connect(out); so.start(t); so.stop(end + 0.1); H(X, sg.gain, rel, [so]);
                }
            });
        },
        groan(X, t, d, s, vel, notes) {
            let c = X.ctx, m = X.mono.groan, mode = Math.min(2, Math.floor(s.mode * 3));
            if (!m) {
                m = X.mono.groan = { a: c.createOscillator(), b: c.createOscillator(), md: c.createOscillator(), mg: c.createGain(), sub: c.createOscillator(), gs: c.createGain(), f: c.createBiquadFilter(), f2: c.createBiquadFilter(), sh: c.createWaveShaper(), vca: c.createGain(), lfo: c.createOscillator(), lg: c.createGain(), dl: c.createGain() };
                m.a.type = m.b.type = 'sawtooth'; m.sub.type = 'sine'; m.f.type = m.f2.type = 'lowpass'; m.vca.gain.value = 0; m.sh.oversample = '2x';
                m.md.connect(m.mg); m.mg.connect(m.a.frequency); m.mg.connect(m.b.frequency);
                m.a.connect(m.f); m.b.connect(m.f); m.sub.connect(m.gs); m.gs.connect(m.vca); m.f.connect(m.f2); m.f2.connect(m.sh); m.sh.connect(m.vca); m.vca.connect(X.out);
                m.lfo.connect(m.lg); m.lg.connect(m.f.detune); m.lg.connect(m.f2.detune); m.lfo.connect(m.dl); m.dl.connect(m.b.detune);
                [m.a, m.b, m.md, m.sub, m.lfo].forEach(o => o.start(t));
            }
            let note = notes[0] + octOf(s.oct) * 12, f = hz(note), glide = s.glide * 0.3, slid = (glide > 0.005 || X.sl) && X.prevOn;
            const fr = (o, v) => { if (slid) o.frequency.setTargetAtTime(v, t, Math.max(0.01, glide) / 3); else o.frequency.setValueAtTime(v, t); };
            let bh = mode === 0 ? 0.15 + s.det * 2.5 : 0; fr(m.a, f - bh); fr(m.b, f + bh); fr(m.sub, f / 2); fr(m.md, f * (mode === 1 ? 2 : 1));
            m.a.detune.setValueAtTime(mode === 0 ? 0 : -s.det * 30, t); m.b.detune.setValueAtTime(mode === 0 ? 0 : s.det * 30, t); m.mg.gain.setValueAtTime(f * s.fm * (mode === 1 ? 6 : 1.5), t); m.gs.gain.setValueAtTime(s.sub * 0.8, t);
            let dk = Math.round(s.drive * 20); if (dk !== m.dk) { m.dk = dk; m.sh.curve = curve(1 + s.drive * 9); }
            let cut = expo(60, 8000, s.cut); m.f.Q.setValueAtTime(0.5 + s.res * 14, t); m.f2.Q.setValueAtTime(0.7, t);
            if (mode === 2) { m.lfo.type = 'sine'; m.lfo.frequency.setValueAtTime(X.bpm / 60 / [2, 1, 0.5, 1 / 3, 0.25][Math.min(4, Math.floor(s.rate * 5))], t); m.lg.gain.setValueAtTime(2400, t); m.dl.gain.setValueAtTime(0, t); }
            else { m.lfo.type = 'triangle'; m.lfo.frequency.setValueAtTime(0.05 + s.move * 3, t); m.lg.gain.setValueAtTime(s.move * 900, t); m.dl.gain.setValueAtTime(mode === 0 ? s.det * 25 : 0, t); }
            if (!(X.sl && X.prevOn)) { m.f.frequency.cancelScheduledValues(t); m.f.frequency.setTargetAtTime(Math.min(16000, cut * 2), t, 0.002); m.f.frequency.setTargetAtTime(cut, t + 0.01, 0.12); m.f2.frequency.setValueAtTime(Math.min(18000, cut * 2.5), t); m.vca.gain.cancelScheduledValues(t); m.vca.gain.setTargetAtTime(vel * 0.75, t, 0.003); }
            if (!X.nextSlides) m.vca.gain.setTargetAtTime(0, t + d, 0.02);
            H(X, m.vca.gain, 0.05);
        }
    };
    // supersaw. these numbers are from someone who measured the real one, not me lol
    const SSO = [-0.11002313, -0.06288439, -0.01952356, 0, 0.01991221, 0.06216538, 0.10745242];
    const ssDet = x => Math.max(0, 0.0030115596 + 0.6717417634 * x - 24.1878824391 * x ** 2 + 404.2703938388 * x ** 3 - 3425.0836591318 * x ** 4 + 17019.9518580080 * x ** 5 - 53046.9642751875 * x ** 6 + 106649.6679158292 * x ** 7 - 138150.6761080548 * x ** 8 + 111363.4808729368 * x ** 9 - 50818.8652045924 * x ** 10 + 10028.7312891634 * x ** 11);
    function superSaw(X, t, d, s, vel, notes) {
        let c = X.ctx, out = X.out, R = rngOf(X), att = 0.002 + Math.pow(s.att, 2) * 2, dec = 0.02 + Math.pow(s.dec, 1.5) * 2, rel = 0.01 + Math.pow(s.rel, 2) * 3, sus = s.sus, end = t + d + rel;
        let f = c.createBiquadFilter(), hp = c.createBiquadFilter(), v = c.createGain(), cut = expo(100, 14000, s.cut), os = [], dt = Math.min(1, ssDet(s.det)), mx = s.side, cg = -0.55366 * mx + 0.99785, sg = -0.73764 * mx * mx + 1.2841 * mx + 0.044372;
        f.type = 'lowpass'; f.Q.value = 0.5 + s.res * 12; f.frequency.setValueAtTime(Math.min(18000, cut * Math.pow(2, s.env * 5)), t); f.frequency.setTargetAtTime(cut, t + att, dec / 3);
        hp.type = 'highpass'; hp.frequency.value = hz(Math.min(...notes) + octOf(s.oct) * 12); hp.Q.value = -3.01;
        let pk = vel * 0.66 / Math.sqrt(notes.length);
        v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(pk, t + att); v.gain.setTargetAtTime(pk * sus, t + att, dec / 3); v.gain.setTargetAtTime(0, t + Math.max(att, d), rel / 4);
        hp.connect(f); f.connect(v); v.connect(out);
        let PB = []; const pan = k => { if (!PB[k]) { PB[k] = c.createStereoPanner(); PB[k].pan.value = (k - 3) / 3 * 0.9; PB[k].connect(hp); } return PB[k]; };
        notes.forEach(nt => {
            let fr = hz(nt + octOf(s.oct) * 12), scoop = Math.round(s.rise * 12);
            SSO.forEach((off, k) => {
                let o = c.createOscillator(), g = c.createGain(), q = fr * (1 + off * dt), per = 1 / q;
                o.type = 'sawtooth'; o.frequency.setValueAtTime(q * Math.pow(2, -scoop / 12), t); if (scoop) o.frequency.exponentialRampToValueAtTime(q, t + 0.03 + s.rise * 0.25);
                g.gain.value = (k === 3 ? cg : sg) * 0.42; o.connect(g); g.connect(pan(k));
                o.start(t + R() * per); o.stop(end + 0.1); os.push(o);
            });
            if (s.sub > 0.02) { let o = c.createOscillator(), g = c.createGain(); o.type = 'square'; o.frequency.value = fr / 2; g.gain.value = s.sub * 0.35; o.connect(g); g.connect(f); o.start(t); o.stop(end + 0.1); os.push(o); }
        });
        H(X, v.gain, rel, os);
    }
    function acid(X, t, d, s, vel, notes) {
        let c = X.ctx, m = X.mono.acid;
        if (!m) { let w; try { w = new AudioWorkletNode(c, 'nb-acid', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [1] }); } catch (e) { return false; } w.connect(X.out); m = X.mono.acid = { w, P: n => w.parameters.get(n), n: 0 }; }
        let P = m.P, f = hz(notes[0] + octOf(s.oct) * 12), slid = X.sl && X.prevOn;
        [['cut', expo(60, 9000, s.cut)], ['res', s.res], ['env', s.env], ['dec', s.dec], ['wave', s.wave], ['accamt', s.acc], ['drive', s.drive], ['sub', s.sub], ['vel', vel]].forEach(([k, v]) => P(k).setValueAtTime(v, t));
        if (slid) P('freq').setTargetAtTime(f, t, 0.01 + s.glide * 0.08); else { P('freq').setValueAtTime(f, t); P('acc').setValueAtTime(X.ac ? 1 : 0, t); P('trig').setValueAtTime(++m.n, t); }
        let G = P('gate'); G.setValueAtTime(1, t); if (!X.nextSlides) G.setValueAtTime(0, t + d * 0.85);
        H(X, G, 0.03);
        return true;
    }
    const THV = [0, 3, 3, 1, 1, 4, 4, 2, 2];
    const singAR = (at, rl) => ({ att: Math.min(1, Math.sqrt(Math.max(0, (at - 0.008) / 0.6))), rel: Math.min(1, Math.sqrt(Math.max(0, (rl - 0.04) / 2))) });
    function throatSing(X, t, d, s, vel, notes) {
        let vi = THV[Math.min(8, Math.floor(s.vowel * 9))];
        let S = Object.assign({ vowel: (vi + 0.5) / 6, voice: 0.55, tens: 0.4, breath: 0.1 + s.breath * 0.75, vib: s.vib, vrate: 0.45, vdel: 0.35, scoop: s.motion * 0.6, oct: s.oct, cons: 0 }, singAR(0.01 + Math.pow(s.att, 2) * 2, 0.02 + Math.pow(s.rel, 2) * 4));
        return sing(Object.assign({}, X, { ly: null }), t, d, S, vel, notes);
    }
    function wailSing(X, t, d, s, vel, notes) {
        if (s.rev >= 0.5) return false;
        const R = rngOf(X), vi = [0, 4, 2][Math.min(2, Math.floor(s.vowel * 3))], extra = [[], [1], [6], [1, 6]][Math.min(3, Math.floor(s.cluster * 4))];
        let ns = []; notes.forEach(n => [0].concat(extra).forEach(iv => { if (ns.indexOf(n + iv) < 0) ns.push(n + iv); }));
        let at = 0.02 + Math.pow(s.att, 2) * 4, rl = 0.05 + Math.pow(s.rel, 2) * 6;
        let S = Object.assign({ vowel: (vi + 0.5) / 6, voice: 0.5, tens: 0.3, breath: 0.15 + s.air * 0.6, vib: 0.35, vrate: 0.4, vdel: 0.5, scoop: 0.3, stack: Math.min(s.voices * 1.2, (Math.max(1, Math.min(4, Math.floor(8 / ns.length))) - 1) / 3), oct: s.oct, cons: 0 }, singAR(at, rl));
        if (!sing(Object.assign({}, X, { ly: null }), t, d, S, vel * 0.8, ns)) return false;
        let M = X.mono.uta; if (M) M.lanes.forEach(L => { if (L.at !== t) return; L.ws.forEach(W => { let P = W.w.parameters; P.get('drift').setValueAtTime(0.5 + s.drift * 1.5, t); P.get('jit').setValueAtTime(0.5 + s.drift, t);
            if (s.sink > 0.01) P.get('f0').setTargetAtTime(L.f * Math.pow(2, -s.sink * (0.7 + R() * 0.6)), t + at, Math.max(0.2, (d + rl) / 2)); }); });
        return true;
    }
    function shepard(X, t, d, s, vel, notes) {
        let c = X.ctx, len = Math.max(0.3, d), oct = 0.5 + s.amt * 4, np = 9, f0 = hz(notes[0] || 60) / 16, K = 64, v = c.createGain(), sh = c.createWaveShaper(), pn = c.createStereoPanner(), lfo = c.createOscillator(), lg = c.createGain(), os = [lfo];
        sh.curve = curve(1 + s.dirt * 9, 1024); lfo.frequency.value = 0.3 + 2 / len; lg.gain.value = s.width * 0.7; lfo.connect(lg); lg.connect(pn.pan); lfo.start(t); lfo.stop(t + len + 0.3);
        sh.connect(v); v.connect(pn); pn.connect(X.out);
        for (let i = 0; i < np; i++) {
            let o = c.createOscillator(), g = c.createGain(), fc = new Float32Array(K), gc = new Float32Array(K);
            for (let j = 0; j < K; j++) { let u = j / (K - 1), lo = (i + u * oct) % np, fr = f0 * Math.pow(2, lo); fc[j] = Math.min(18000, fr); gc[j] = Math.exp(-Math.pow((lo - np / 2) / (np / 5), 2)) * (fr < 17000 ? 1 : 0); }
            o.type = s.tone > 0.6 ? 'triangle' : 'sine'; o.frequency.setValueCurveAtTime(fc, t, len); g.gain.setValueCurveAtTime(gc, t, len);
            o.connect(g); g.connect(sh); o.start(t); o.stop(t + len + 0.05); os.push(o);
        }
        if (s.mix < 0.95) { let n = c.createBufferSource(), nf = c.createBiquadFilter(), ng = c.createGain(); n.buffer = X.nb; n.loop = true; nf.type = 'bandpass'; nf.Q.value = 1.2; nf.frequency.setValueAtTime(300, t); nf.frequency.exponentialRampToValueAtTime(expo(2000, 14000, s.tone), t + len); ng.gain.value = (1 - s.mix) * 0.5; n.connect(nf); nf.connect(ng); ng.connect(sh); n.start(t, X.rnd()); n.stop(t + len + 0.05); os.push(n); }
        v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(vel * 0.3, t + Math.min(0.3, len * 0.2)); v.gain.setValueAtTime(vel * 0.3, t + len - 0.03); v.gain.linearRampToValueAtTime(0, t + len);
        H(X, v.gain, 0.05, os);
    }
    const BRV = ['a', 'o', 'u', 'e'];
    function moanSing(X, t, d, s, vel, notes) {
        if (!X.ctx._nbwk) return false;
        let c = X.ctx, R = rngOf(X), k = Math.min(2, Math.floor(s.kind * 3)), h = s.heat == null ? 0.3 : s.heat, D = X.hold ? 30 : Math.max(0.15, d), ok = true, rel = 0.05 + Math.pow(s.rel, 2) * 4;
        notes.forEach((nt, ni) => { if (!ok) return; let m = nt + octOf(s.oct) * 12 + Math.round(h * 1.5), w = null;
            try { w = new AudioWorkletNode(c, 'nb-moan', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [1], processorOptions: { start: t, seed: 1 + Math.floor(R() * 2147483645), f0: hz(m), dur: D, kind: k, heat: h, air: s.air, vowel: Math.min(3, Math.floor(s.vowel * 4)),
                scoop: Math.round(s.scoop * 7), fall: Math.round(s.fall * 12), shake: s.shake, cat: s.catch, vel, att: 0.01 + Math.pow(s.att, 2) * 2 } }); } catch (e) { ok = false; return; }
            let g = c.createGain(), pn = c.createStereoPanner(); g.gain.value = MOANG * vel / Math.sqrt(notes.length); pn.pan.value = notes.length > 1 ? (ni / (notes.length - 1) - 0.5) * 0.6 : 0;
            w.connect(g); g.connect(pn); pn.connect(X.out);
            if (X.hold) X.hold.push({ g: g.gain, rel, o: [], off: t1 => { try { w.port.postMessage({ end: t1 + rel * 1.5 + 0.2 }); } catch (e) {} } }); });
        return ok;
    }
    const MOANG = 2.3;
    function breathSing(X, t, d, s, vel, notes) {
        if (!X.ctx._nbwk) return false;
        const k = Math.min(2, Math.floor(s.kind * 3)), vw = BRV[Math.min(3, Math.floor(s.vowel * 4))], g = X.hold ? 1.4 : Math.max(0.15, d), h = s.heat == null ? 0.3 : s.heat, R = rngOf(X);
        const ar = singAR(0.01 + Math.pow(s.att, 2) * 2, 0.05 + Math.pow(s.rel, 2) * 4);
        const S0 = Object.assign({ voice: 0.95, light: 0.55 + h * 0.2, tens: 0.25 + h * 0.3, breath: Math.min(0.85, 0.42 + s.air * 0.4 - h * 0.1), nasal: 0.15, warm: 0.65, age: 0.25, smile: 0.45,
            vib: 0.06 + s.shake * 0.55 + h * 0.15, vrate: 0.3 + h * 0.3, vdel: 0.45, scoop: 0.25 + s.scoop * 0.6, oct: s.oct, cons: 0.7, stack: 0, creak: 0.3 * (1 - h) }, ar);
        const go = (ly, at, dd, ns, S) => sing(Object.assign({}, X, { ly, lyPrev: 'a' }), at, dd, Object.assign({}, S0, S || {}), vel, ns);
        const up = Math.round(h * 3), N = notes.map(n => n + up);
        let ok = true;
        if (k === 0) ok = go(['h', vw], t, d, N);
        else if (k === 1) { ok = go(['', 'n'], t, Math.max(0.12, g * 0.28), N.map(n => n - 1)); if (ok) go(['', vw], t + Math.max(0.12, g * 0.28), Math.max(0.1, d - g * 0.28), N); }
        else if (k === 2) ok = go(['', 'n'], t, d, N);
        else if (k === 3) ok = go(['h', vw], t, Math.min(d, 0.12 + Math.min(g, 0.7) * 0.4), N.map(n => n + 2), { att: 0.05, rel: 0.08 + (1 - (s.catch || 0)) * 0.25, tens: 0.5, breath: 0.7 });
        else if (k === 4) { let per = 0.22 + (1 - h) * 0.18, at = 0, i = 0; for (; at < g - 0.05 && i < 24 && ok; at += per * (0.85 + R() * 0.3), i++) ok = i % 2 ? go(['h', vw], t + at, per * 0.6, N.map(n => n - 1), { breath: 0.85, att: 0.02, rel: 0.1, scoop: 0 }) : go(['h', vw], t + at, per * 0.55, N, { att: 0.02, rel: 0.12, scoop: 0.15 }); }
        else { let per = 0.3 + (1 - h) * 0.25, at = 0, i = 0; for (; at < g - 0.05 && i < 16 && ok; at += per * (0.8 + R() * 0.4), i++) ok = go(['', i % 3 === 2 ? 'n' : 'u'], t + at, per * 0.7, N.map(n => n + 5 + Math.round(R() * 2)), { tens: 0.6 + h * 0.2, breath: 0.5, scoop: 0.6, att: 0.02, rel: 0.1, vib: 0.3 + h * 0.3 }); }
        if (!ok) return false;
        let M = X.mono.uta, fall = (2 + Math.round(s.fall * 12)) / 12;
        if (M && (k === 0 || k === 1) && !X.hold) M.lanes.forEach(L => { if (L.at < t - 0.001) return; L.ws.forEach(W => W.w.parameters.get('f0').setTargetAtTime(L.f * Math.pow(2, -fall), t + g * 0.55, g * 0.35)); });
        if (M) M.lanes.forEach(L => { if (L.at < t - 0.001) return; L.ws.forEach(W => { let P = W.w.parameters; P.get('drift').setValueAtTime(1.3 + h * 0.6, t); P.get('jit').setValueAtTime(1.1 + h * 0.8, t);
            if (k !== 3 && k !== 4) for (let at = t + 0.12 + R() * 0.15; at < t + g * 0.5; at += 0.14 + R() * 0.22) P.get('f0').setTargetAtTime(L.f * Math.pow(2, ((R() - 0.4) * (40 + h * 70)) / 1200), at, 0.05 + R() * 0.06); });
            let c = X.ctx, e = Math.max(0.3, g + 0.6); [4.3 + R() * 1.5, 6.9 + R() * 2.5].forEach((fr, i) => { let o = c.createOscillator(), og = c.createGain(); o.frequency.value = fr; og.gain.value = (0.06 + h * 0.08) * (i ? 0.6 : 1); o.connect(og); og.connect(L.amp.gain); o.start(t); o.stop(t + e); }); });
        return true;
    }
    function junoChorus(c, src, out, ch, t, end, os) {
        if (!ch) { src.connect(out); return; }
        src.connect(out); let lf = c.createOscillator(), dp = [0, 0.00185, 0.00185, 0.0003][ch]; lf.type = 'triangle'; lf.frequency.value = [0, 0.513, 0.863, 9.75][ch]; lf.start(t); lf.stop(end + 0.1); os.push(lf);
        [-1, 1].forEach(sd => { let dl = c.createDelay(0.02), lg = c.createGain(), p = c.createStereoPanner(), g = c.createGain(); dl.delayTime.value = 0.0035; lg.gain.value = dp * sd; lf.connect(lg); lg.connect(dl.delayTime); p.pan.value = sd; g.gain.value = 0.7; src.connect(dl); dl.connect(g); g.connect(p); p.connect(out); });
    }
    function dcoEnd(c, D, end, os) {
        let kg = c.createGain(); kg.gain.setValueAtTime(1, Math.max(0, end + 0.05)); kg.gain.linearRampToValueAtTime(0, end + 0.12);
        os.push({ stop: tt => { try { kg.gain.cancelScheduledValues(Math.max(0, tt - 0.08)); kg.gain.setValueAtTime(1, Math.max(0, tt - 0.08)); kg.gain.linearRampToValueAtTime(0, Math.max(0, tt - 0.02)); if (D.node.port) D.node.port.postMessage({ end: tt + 0.05 }); } catch (e) {} } });
        return kg;
    }
    function dcoNode(X, t, end, f, o) {
        let c = X.ctx, w = null;
        if (c._nbwk) { try { w = new AudioWorkletNode(c, 'nb-dco', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { seed: 1 + Math.floor(X.rnd() * 2147483645), start: t, end: X.hold ? t + 3600 : end + 0.2 } }); } catch (e) { w = null; } }
        if (w) { Object.keys(o).forEach(k => { let p = w.parameters.get(k); if (p) p.value = o[k]; }); w.parameters.get('freq').setValueAtTime(f, t); return { node: w, freq: w.parameters.get('freq') }; }
        let s = c.createOscillator(); s.type = 'sawtooth'; s.frequency.setValueAtTime(f, t); s.start(t); s.stop(end + 0.2); return { node: s, freq: s.frequency, osc: s };
    }
    function lp24(c, res) { let a = c.createBiquadFilter(), b = c.createBiquadFilter(); a.type = b.type = 'lowpass'; a.Q.value = -3 + res * 24; b.Q.value = -3.01; a.connect(b); return { in: a, out: b, set: (fn) => [a, b].forEach(x => fn(x.frequency)) }; }
    function nocturne(X, t, d, s, vel, notes) {
        let c = X.ctx, att = 0.001 + Math.pow(s.att, 2) * 3, dec = 0.01 + Math.pow(s.dec, 2) * 3, rel = 0.01 + Math.pow(s.rel, 2) * 4, sus = s.sus, end = t + d + rel, os = [];
        let bus = c.createGain(), lfo = c.createOscillator(), ld = c.createGain(), ch = Math.min(3, Math.floor(s.chor * 4));
        let dcb = lowCut(c, 25, -3.01); bus.connect(dcb);
        junoChorus(c, dcb, X.out, ch, t, end, os);
        lfo.type = 'triangle'; lfo.frequency.value = expo(0.1, 12, s.lrate); lfo.connect(ld); ld.gain.setValueAtTime(0, t); ld.gain.linearRampToValueAtTime(1, t + 0.001 + s.ldel * 2); lfo.start(t); lfo.stop(end + 0.1); os.push(lfo);
        notes.forEach(nt => {
            let f = hz(nt + octOf(s.oct) * 12), D = dcoNode(X, t, end, f, { saw: s.saw, pulse: s.pulse, psaw: 0, sub: s.sub, noise: s.noise, pw: 0.05 + s.pw * 0.9, pwm: s.pwm, pwmr: 0.4 + s.lrate * 2, uni: 1 + Math.min(3, Math.floor(s.uni * 4)), det: s.det * 30, spread: 0.7 });
            let hp = c.createBiquadFilter(), F = lp24(c, s.res), v = c.createGain(), hs = Math.min(3, Math.floor(s.hpf * 4));
            if (hs === 0) { hp.type = 'lowshelf'; hp.frequency.value = 120; hp.gain.value = 4; } else if (hs === 1) hp = lowCut(c, 10, -3.01); else { hp.type = 'highpass'; hp.frequency.value = [0, 10, 240, 720][hs]; hp.Q.value = -3.01; }
            let cut = Math.min(15000, expo(60, 16000, s.cut) * Math.pow(f / 261.63, s.ktrk) * (0.8 + vel * 0.3)), top = Math.min(18000, cut * Math.pow(2, s.env * 6));
            F.set(q => { q.setValueAtTime(cut, t); q.linearRampToValueAtTime(top, t + att); q.setTargetAtTime(cut + (top - cut) * sus, t + att, dec / 3); q.setTargetAtTime(cut, t + Math.max(att, d), rel / 3); });
            if (s.lcut > 0.01) { let lg = c.createGain(); lg.gain.value = cut * s.lcut * 0.8; ld.connect(lg); F.set(q => lg.connect(q)); }
            if (s.lpitch > 0.01) { let lg = c.createGain(); lg.gain.value = f * s.lpitch * 0.06; ld.connect(lg); lg.connect(D.freq); }
            let pk = vel * 0.17 / Math.sqrt(notes.length);
            v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(pk, t + att); v.gain.setTargetAtTime(pk * sus, t + att, dec / 3); v.gain.setTargetAtTime(0, t + Math.max(att, d), rel / 3);
            let kg = dcoEnd(c, D, end, os); D.node.connect(hp); hp.connect(F.in); F.out.connect(v); v.connect(kg); kg.connect(bus); if (D.osc) os.push(D.osc);
            H(X, v.gain, rel, os);
        });
    }
    function howl(X, t, d, s, vel, notes) {
        let c = X.ctx, att = 0.001 + Math.pow(s.att, 2) * 2, rel = 0.01 + Math.pow(s.rel, 2) * 3, end = t + d + rel, os = [], bus = c.createGain(), ch = Math.min(3, Math.floor(s.chor * 4)), dcb = lowCut(c, 25, -3.01);
        bus.connect(dcb); junoChorus(c, dcb, X.out, ch, t, end, os);
        notes.forEach(nt => {
            let f = hz(nt + octOf(s.oct) * 12), D = dcoNode(X, t, end, f, { saw: s.saw, pulse: 0, psaw: s.psaw, sub: s.sub, noise: 0, pw: 0.05 + s.pw * 0.9, pwm: s.pwm, pwmr: expo(0.1, 6, s.rate), uni: 3, det: s.det * 60, spread: 0.85 });
            let dt = 0.03 + s.dtime * 1.17, up = f * Math.pow(2, s.dive * 12 / 12);
            D.freq.setValueAtTime(f, t); D.freq.exponentialRampToValueAtTime(up, t + dt * 0.25); D.freq.setTargetAtTime(f, t + dt * 0.25, dt / 3);
            if (!X.hold && s.drop > 0.01) D.freq.setTargetAtTime(f * Math.pow(2, -s.drop * 24 / 12), t + Math.max(d, dt), rel / 2);
            let F = lp24(c, s.res), v = c.createGain(), cut = expo(200, 16000, s.cut), pk = vel * 0.18 / Math.sqrt(notes.length);
            F.set(q => q.setValueAtTime(cut, t));
            v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(pk, t + att); v.gain.setValueAtTime(pk, t + Math.max(att, d)); v.gain.setTargetAtTime(0, t + Math.max(att, d), rel / 3);
            let kg = dcoEnd(c, D, end, os); D.node.connect(F.in); F.out.connect(v); v.connect(kg); kg.connect(bus); if (D.osc) os.push(D.osc);
            H(X, v.gain, rel, os);
        });
    }
    const ORG = { p: [1, 0.5, 0.35, 0.22, 0.15, 0.1, 0.07, 0.05, 0.035, 0.025, 0.018, 0.012], f: [1, 0.12, 0.08, 0.02, 0.01], b: [1, 0.03, 0.35, 0.02, 0.12, 0.01, 0.05, 0.005, 0.02],
        t: [1, 0.9, 0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.3, 0.25, 0.2, 0.17, 0.14, 0.12, 0.1, 0.08], m: [0, 0, 1, 0.9, 0, 0.8, 0, 0.12, 0.08, 0, 0, 0.05] };
    const ORGW = new WeakMap(), orgWave = (c, k) => { let M = ORGW.get(c); if (!M) ORGW.set(c, M = {}); if (!M[k]) { let a = ORG[k], re = new Float32Array(a.length + 1), im = new Float32Array(a.length + 1); a.forEach((v, i) => { im[i + 1] = v; }); M[k] = c.createPeriodicWave(re, im); } return M[k]; };
    function vesper(X, t, d, s, vel, notes) {
        const R = rngOf(X);
        let c = X.ctx, att = 0.01 + s.att * 0.39, rel = 0.02 + Math.pow(s.rel, 2) * 2, end = t + d + rel + 0.1, os = [];
        let sw = c.createBiquadFilter(), out = c.createGain(), tr = c.createOscillator(), tg = c.createGain(), ta = c.createGain(), wob = c.createOscillator(), wg = c.createGain();
        sw.type = 'lowpass'; sw.frequency.value = expo(600, 18000, s.swell); sw.Q.value = -3.01; sw.connect(out); out.connect(X.out);
        tr.frequency.value = 6.2; tg.gain.value = s.trem * 12; ta.gain.value = s.trem * 0.25; tr.connect(tg); tr.connect(ta); ta.connect(out.gain); out.gain.value = 1 - s.trem * 0.25; tr.start(t); tr.stop(end); os.push(tr);
        wob.frequency.value = 0.31 + R() * 0.2; wg.gain.value = 2.5; wob.connect(wg); wob.start(t); wob.stop(end); os.push(wob);
        const STOPS = [['b16', 'b', 0.5, 3], ['p8', 'p', 1, 2], ['f8', 'f', 1, 2], ['o4', 'p', 2, 2], ['f2', 'p', 4, 2], ['mix', 'm', 1, 0], ['tr8', 't', 1, 0]];
        let tot = STOPS.reduce((a, q) => a + (s[q[0]] || 0), 0) || 1, pk = 0.24 / Math.sqrt(tot) / Math.sqrt(notes.length) * (0.85 + vel * 0.15);
        notes.forEach(nt => {
            let f0 = hz(nt + octOf(s.oct) * 12), v = c.createGain(), tri = c.createBiquadFilter();
            tri.type = 'peaking'; tri.frequency.value = 1500; tri.gain.value = 5; tri.Q.value = 1.2;
            STOPS.forEach(([k, wv, ft, ob]) => {
                let a = s[k] || 0; if (a < 0.02) return; let ff = f0 * ft * (k === 'mix' && nt > 72 ? 0.5 : 1); if (ff * (wv === 't' ? 16 : 6) > 20000 && ff > 6000) return;
                let o = c.createOscillator(), g = c.createGain(), sp = att * (ft < 1 ? 1.8 : ft > 1 ? 0.7 : 1);
                o.setPeriodicWave(orgWave(c, wv)); o.frequency.value = ff; o.detune.value = (R() - 0.5) * 4; tg.connect(o.detune); wg.connect(o.detune);
                g.gain.setValueAtTime(0, t); g.gain.setTargetAtTime(a * a, t, sp / 3); g.gain.setTargetAtTime(0, t + Math.max(d, sp), rel / 4);
                o.connect(g); g.connect(wv === 't' ? tri : v); o.start(t); o.stop(end); os.push(o);
                if (ob && s.chiff > 0.02) { let q = c.createOscillator(), qg = c.createGain(); q.frequency.value = Math.min(16000, ff * ob); qg.gain.setValueAtTime(0, t); qg.gain.linearRampToValueAtTime(a * s.chiff * 0.35, t + 0.008); qg.gain.setTargetAtTime(0, t + 0.01, 0.015 + 0.02 / ft); q.connect(qg); qg.connect(v); q.start(t); q.stop(t + 0.3); os.push(q);
                    let n = c.createBufferSource(), nb = c.createBiquadFilter(), ng = c.createGain(); n.buffer = X.nb; nb.type = 'bandpass'; nb.frequency.value = Math.min(12000, ff * 4); nb.Q.value = 2; ng.gain.setValueAtTime(a * s.chiff * 0.25, t); ng.gain.setTargetAtTime(0, t + 0.004, 0.012); n.connect(nb); nb.connect(ng); ng.connect(v); n.start(t, R()); n.stop(t + 0.15); }
            });
            tri.connect(v);
            if (s.wind > 0.02) { let n = c.createBufferSource(), nb = c.createBiquadFilter(), ng = c.createGain(); n.buffer = X.nb; n.loop = true; nb.type = 'bandpass'; nb.frequency.value = Math.min(12000, f0 * 2); nb.Q.value = 3; ng.gain.setValueAtTime(0, t); ng.gain.setTargetAtTime(s.wind * 0.06, t, att / 3); ng.gain.setTargetAtTime(0, t + d, rel / 4); n.connect(nb); nb.connect(ng); ng.connect(v); n.start(t, R()); n.stop(end); os.push(n); }
            v.gain.value = pk; v.connect(sw);
        });
        H(X, out.gain, rel, os);
    }
    function gritNote(X, t, d, s, vel, nn) {
        let c = X.ctx, out = X.out, m = nn + octOf(s.oct) * 12, w = ['sine', 'triangle', 'sawtooth', 'square'][Math.min(3, Math.floor(s.wave * 4))];
        let dec = 0.02 + Math.pow(s.dec, 1.5) * 1.5, rel = 0.01 + Math.pow(s.rel, 2) * 2, end = t + d + rel;
        let o = c.createOscillator(), f = c.createBiquadFilter(), v = c.createGain(), cut = expo(150, 12000, s.cut), os = [o];
        o.type = w; o.frequency.value = hz(m);
        if (s.fm > 0.01) { let md = c.createOscillator(), mg = c.createGain(); md.frequency.value = hz(m) * 2; mg.gain.setValueAtTime(hz(m) * s.fm * 6, t); mg.gain.setTargetAtTime(hz(m) * s.fm, t, dec / 2); md.connect(mg); mg.connect(o.frequency); md.start(t); md.stop(end + 0.05); os.push(md); }
        cut = Math.min(14000, cut * Math.pow(hz(m) / 261.63, 0.5)); let ev = s.env * (0.55 + vel * 0.6);
        f.type = 'lowpass'; f.Q.value = 0.5 + s.res * 14; f.frequency.setValueAtTime(Math.min(16000, cut * Math.pow(2, ev * 4.5)), t); f.frequency.setTargetAtTime(cut, t + 0.003, dec / 3);
        v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(vel * 0.5, t + 0.003); v.gain.setTargetAtTime(vel * 0.28, t + 0.004, dec / 3); v.gain.setTargetAtTime(0, t + d, rel / 3);
        o.connect(f); f.connect(v); v.connect(out); o.start(t); o.stop(end + 0.05);
        if ((s.uni || 0) > 0.01) [-1, 1].forEach(sd => { let u = c.createOscillator(), ug = c.createGain(), up = c.createStereoPanner(); u.type = w; u.frequency.value = hz(m); u.detune.value = sd * (4 + s.uni * 22); ug.gain.value = s.uni * 0.7; up.pan.value = sd * 0.6; u.connect(ug); ug.connect(up); up.connect(f); u.start(t); u.stop(end + 0.05); os.push(u); });
        if ((s.sub || 0) > 0.01) { let u = c.createOscillator(), ug = c.createGain(); u.type = 'square'; u.frequency.value = hz(m) / 2; ug.gain.value = s.sub * 0.5; u.connect(ug); ug.connect(f); u.start(t); u.stop(end + 0.05); os.push(u); }
        H(X, v.gain, rel, os);
    }

    function flat(pr, tr) {
        if (tr._flat && tr._fv === pr._v) return tr._flat;
        let ev = [];
        tr.clips.forEach(c => {
            if (!c.notes.length || c.mute) return;
            let end = c.at + c.len, lp = c.lp > 0 ? c.lp : 0;
            const put = (n, b) => { if (b < c.at - 1e-9 || b >= end - 1e-9) return; ev.push({ b, d: Math.max(0.01, Math.min(n.d, end - b)), n, c }); };
            if (lp) { for (let k = Math.floor(c.off / lp); k < 4096; k++) { let base = c.at + k * lp - c.off; if (base >= end) break; c.notes.forEach(n => { if (n.t < lp) put(n, base + n.t); }); } }
            else c.notes.forEach(n => put(n, c.at + n.t - c.off));
        });
        ev.sort((a, b) => a.b - b.b || a.n.m - b.n.m);
        if (tr.inst === 'uta') { let map = new Map(); tr.clips.forEach(c => { if (!c.ly) return; let L = lyricsOf(c.ly), ns = c.notes.slice().sort((a, b) => a.t - b.t || b.m - a.m), k = 0, last = 'a'; ns.forEach(n => { let y = L.length ? L[k % L.length] : null; if (y) { k++; if (y[1] !== 'L' && y[1]) last = y[1]; } map.set(n, [y, last]); }); }); ev.forEach(e => { let y = map.get(e.n); if (y) { e.ly = y[0]; e.lyPrev = y[1]; } }); }
        if (V[tr.inst].kind === 'mono') ev.forEach((e, i) => {
            let p = ev[i - 1], q = ev[i + 1];
            e.prevOn = !!(p && p.b < e.b && p.b + p.d >= e.b - 0.02);
            e.nextSlides = !!(q && q.n.sl && q.b > e.b && q.b <= e.b + e.d + 0.02);
        });
        tr._flat = ev; tr._fv = pr._v;
        return ev;
    }
    function grooveOf(pr, k) { return !k ? null : GROOVES[k] || ((pr && pr.grooves) || []).find(g => g.id === k) || null; }
    function laneSegs(pr, tr, key) {
        let C = tr._ln || (tr._ln = {}); if (C[key] && C[key].v === pr._v) return C[key].s;
        let out = [];
        tr.clips.forEach(c => { let P = c[key]; if (!P || !P.length || c.mute) return; let end = c.at + c.len, lp = c.lp > 0 ? c.lp : 0;
            if (lp) { for (let k = Math.floor(c.off / lp); k < 4096; k++) { let base = c.at + k * lp - c.off; if (base >= end) break; let s0 = Math.max(c.at, base), s1 = Math.min(end, base + lp); if (s1 > s0 + 1e-9) out.push({ s: s0, e: s1, base, P }); } }
            else out.push({ s: c.at, e: end, base: c.at - c.off, P }); });
        out.sort((a, b) => a.s - b.s); C[key] = { v: pr._v, s: out }; return out;
    }
    function laneAt(segs, b) { for (const g of segs) if (b >= g.s - 1e-9 && b < g.e - 1e-9) return valAt(g.P, b - g.base); return 0; }
    const hasLanes = tr => tr.clips.some(c => (c.pb && c.pb.length) || (c.mw && c.mw.length));
    function laneBook(prm, map, segs, b0, b1, tb, jump) {
        if (jump) { prm.cancelScheduledValues(tb(b0)); prm.setValueAtTime(map(laneAt(segs, b0)), tb(b0)); }
        let mk = [];
        segs.forEach(g => { if (g.e <= b0 || g.s >= b1) return;
            if (g.s > b0 + 1e-9) mk.push([g.s, 1, g]);
            g.P.forEach(q => { let b = g.base + q[0]; if (b > Math.max(b0, g.s) + 1e-9 && b < Math.min(b1, g.e) - 1e-9) mk.push([b, 0, g, q[1]]); });
            if (g.e < b1 - 1e-9) mk.push([g.e, 2, g]); });
        mk.sort((a, b) => a[0] - b[0] || b[1] - a[1]).forEach(([b, k, g, v]) => { let T = tb(b);
            try { if (k === 0) prm.linearRampToValueAtTime(map(v), T);
                else if (k === 1) { prm.linearRampToValueAtTime(map(0), T); prm.setValueAtTime(map(valAt(g.P, b - g.base)), T); }
                else { prm.linearRampToValueAtTime(map(valAt(g.P, b - g.base)), T); prm.setValueAtTime(map(0), T); } } catch (e) {} });
    }
    const GROOVES = {
        none: { jp: '直', en: 'straight' },
        push: { jp: '急', en: 'pushed', t: [0, -0.06, -0.03, -0.09, 0, -0.06, -0.03, -0.1, 0, -0.06, -0.03, -0.09, 0, -0.07, -0.04, -0.12], v: [1, 0.78, 0.9, 0.8, 0.95, 0.78, 0.88, 0.82, 1, 0.78, 0.9, 0.8, 0.95, 0.8, 0.9, 0.86] },
        lazy: { jp: '怠', en: 'lazy', t: [0, 0.1, 0.05, 0.14, 0.03, 0.12, 0.06, 0.16, 0, 0.1, 0.05, 0.14, 0.04, 0.12, 0.07, 0.18], v: [1, 0.7, 0.82, 0.72, 0.9, 0.7, 0.8, 0.74, 0.98, 0.7, 0.82, 0.72, 0.9, 0.72, 0.8, 0.76] },
        drunk: { jp: '酔', en: 'drunk', t: [0, 0.14, -0.05, 0.2, 0.04, 0.09, -0.11, 0.22, -0.03, 0.17, 0.05, 0.1, 0.07, -0.06, 0.15, 0.26], v: [1, 0.66, 0.9, 0.6, 0.86, 0.75, 0.7, 0.64, 0.96, 0.62, 0.84, 0.7, 0.92, 0.66, 0.78, 0.58] },
        heart: { jp: '脈', en: 'heartbeat', t: [0, 0.02, -0.08, 0.04, 0, 0.02, -0.08, 0.04, 0, 0.02, -0.08, 0.04, 0, 0.02, -0.08, 0.04], v: [1.05, 0.55, 0.9, 0.5, 1, 0.55, 0.88, 0.5, 1.05, 0.55, 0.9, 0.5, 1, 0.55, 0.88, 0.5] },
        limp: { jp: '跛', en: 'limp', t: [0, 0.2, 0, 0.22, 0.12, 0.2, 0.02, 0.24, 0, 0.2, 0, 0.22, 0.12, 0.2, 0.02, 0.26], v: [1, 0.6, 0.85, 0.62, 1, 0.6, 0.8, 0.66, 0.96, 0.6, 0.85, 0.62, 1, 0.62, 0.8, 0.7] },
        machine: { jp: '機', en: 'machine', t: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], v: [1.08, 0.7, 0.86, 0.7, 1.02, 0.7, 0.86, 0.7, 1.08, 0.7, 0.86, 0.7, 1.02, 0.7, 0.86, 0.72] }
    };
    function rng(a, b, c) { let h = (Math.floor(a * 977) * 374761393 + b * 668265263 + c * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

    function schedule(R, b0, b1, tb, st) {
        let pr = R.pr, still = steady(pr), spb = 60 / pr.bpm;
        if (st.clickOnly) { clicks(R, b0, b1, tb, pr, still); return; }
        if (!still) turns(pr, b0, b1).forEach(b => R.retempo(b, tb(b)));
        pr.tracks.forEach((tr, ti) => {
            if (!R.ch[tr.uid]) return;
            let ev = flat(pr, tr), sw = tr.swing >= 0 ? tr.swing : pr.swing, lo = 0, hi = ev.length, gv = grooveOf(pr, tr.groove || pr.groove), hu = +tr.human || 0;
            while (lo < hi) { let mid = (lo + hi) >> 1; if (ev[mid].b < b0 - 1e-9) lo = mid + 1; else hi = mid; }
            let lanes = hasLanes(tr); if (lanes) R.bendNode(R.ch[tr.uid]);
            let au = R.auto[tr.uid], sndA = null;
            if (au) Object.keys(au).forEach(k => { if (k.indexOf('snd.') === 0) (sndA = sndA || []).push([k.slice(4), au[k].pts]); });
            let walk = ((tr.snd.cxArp || 0) >= 0.1 || (tr.snd.cxSqOn || 0) >= 0.5) && tr.inst !== 'coffin' && V[tr.inst].kind !== 'drum';
            for (let i = lo; i < ev.length && ev[i].b < b1 - 1e-9; i++) {
                let e = ev[i], n = e.n, chord = null;
                if (walk) { if (i > lo && Math.abs(ev[i - 1].b - e.b) < 1e-6) continue; chord = [n.m]; for (let j = i + 1; j < ev.length && Math.abs(ev[j].b - e.b) < 1e-6; j++) chord.push(ev[j].n.m); }
                if (n.p != null && n.p < 100 && rng(e.b, ti, st.n || 0) * 100 >= n.p) continue;
                let b = e.b, f16 = b * 4, on16 = Math.abs(f16 - Math.round(f16)) < 0.02, off = on16 && Math.round(f16) % 2 === 1 ? sw * 0.25 * 0.66 : 0;
                let vel = n.v != null ? n.v : 0.8, hs = 0;
                if (gv && gv.t && on16) { let k = ((Math.round(f16) % 16) + 16) % 16; off += gv.t[k] * 0.25; vel *= gv.v[k]; }
                if (hu > 0) { hs = (rng(b, ti * 13 + (st.n || 0), 23) - 0.5) * 2 * hu * 0.016; vel *= 1 + (rng(b, ti * 17 + (st.n || 0), 29) - 0.5) * 2 * hu * 0.2; }
                vel = Math.max(0.02, Math.min(1.25, vel));
                let t = Math.max(0, tb(b + off) + hs), d = still ? e.d * spb : durAt(pr, b, e.d), r = Math.max(1, n.r || 1), snd = null;
                if (sndA) { snd = {}; sndA.forEach(([k, pts]) => { snd[k] = valAt(pts, b); }); }
                for (let q = 0; q < r; q++) R.trig(tr, t + q * d / r, r > 1 ? d / r * 0.9 : d, n, vel * (q ? 0.85 : 1), { prevOn: e.prevOn, nextSlides: e.nextSlides, snd, rnd: () => rng(b, ti * 7 + q, 11), ly: e.ly, lyPrev: e.lyPrev, chord, bpm: still ? 0 : tempoAt(pr, b) });
                if (st.ev) st.ev.push({ t, uid: tr.uid, vel, m: n.m });
            }
            tr.fx.forEach(P => { if (fxOK(P)) { let I = R.fx(P); if (I.sched) I.sched(b0, b1, tb); } });
            if (lanes) { let B = R.bendNode(R.ch[tr.uid]), rg = (tr.pbr || 2) * 100;
                laneBook(B.cs.offset, v => v * rg, laneSegs(pr, tr, 'pb'), b0, b1, tb, st.jump); laneBook(B.dep.gain, v => v * 50, laneSegs(pr, tr, 'mw'), b0, b1, tb, st.jump); }
        });
        if (window.NBA) NBA.sched(R, b0, b1, tb, st);
        pr.master.fx.forEach(P => { if (fxOK(P) && !R.opt.only) { let I = R.fx(P); if (I.sched) I.sched(b0, b1, tb); } });
        Object.keys(R.auto).forEach(owner => {
            let list = owner === 'master' ? pr.master.fx : ((pr.tracks.find(t => t.uid === owner) || { fx: [] }).fx), by = {};
            Object.values(R.auto[owner]).forEach(a => { let s = a.path.split('.'); if (s[0] !== 'fx') return; let P = list.find(x => x.uid === s[1]); if (!P || !fxOK(P)) return; let I = R.fx(P); if (I.ap && I.ap[s[2]]) return; (by[P.uid] = by[P.uid] || { P, I, lanes: [] }).lanes.push([s[2], a.pts]); });
            Object.values(by).forEach(({ P, I, lanes }) => {
                let skip = {}; Object.keys(R.auto[owner]).forEach(k => { let s = k.split('.'); if (s[0] === 'fx' && s[1] === P.uid && I.ap && I.ap[s[2]]) skip[s[2]] = 1; });
                let info = { bpm: pr.bpm, root: pr.root, scale: pr.scale, sig: pr.sig || 4 };
                for (let k = Math.ceil(b0 * 4 - 1e-9); k / 4 < b1 - 1e-9; k++) { let b = k / 4, pp = Object.assign({}, P.p); lanes.forEach(([key, pts]) => { pp[key] = valAt(pts, b); }); if (!still) info = { bpm: tempoAt(pr, b), root: pr.root, scale: pr.scale, sig: sigAt(pr, b) }; let i2 = info; NBFX.at(tb(b), () => { try { I.set(pp, false, i2, skip); } catch (e) {} }); }
            });
        });
        Object.keys(R.auto).forEach(owner => Object.values(R.auto[owner]).forEach(a => {
            if (a.path.indexOf('snd.') === 0) return;
            let T = R.target(owner, a.path); if (!T) return;
            T.forEach(([prm, map]) => {
                if (st.jump) { prm.cancelScheduledValues(tb(b0)); prm.setValueAtTime(map(valAt(a.pts, b0)), tb(b0)); }
                let marks = a.pts.filter(p => p[0] > b0 && p[0] < b1).map(p => p[0]);
                let steps = 3; for (let k = 1; k <= steps; k++) marks.push(b0 + (b1 - b0) * k / steps);
                marks.sort((x, y) => x - y).forEach(b => { try { prm.linearRampToValueAtTime(map(valAt(a.pts, b)), tb(b)); } catch (e) {} });
            });
        }));
        if (st.metro) clicks(R, b0, b1, tb, pr, still);
    }
    function clicks(R, b0, b1, tb, pr, still) {
        if (!R.click) return;
        for (let k = Math.ceil(b0 - 1e-9); k < b1; k++) {
            let o = R.ctx.createOscillator(), v = R.ctx.createGain(), t = tb(k), top = still ? k % (pr.sig || 4) === 0 : Math.abs(barOf(pr, k).at - k) < 1e-6;
            o.frequency.value = top ? 1760 : 1100; v.gain.setValueAtTime(0.5, t); v.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
            o.connect(v); v.connect(R.click); o.start(t); o.stop(t + 0.05);
        }
    }

    function Live(pr, lat) {
        let AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        try { this.ctx = new AC({ latencyHint: ['interactive', 'balanced', 'playback'].indexOf(lat) >= 0 ? lat : 'balanced' }); } catch (e) { this.ctx = new AC(); } this.pr = pr; this.R = new Rig(this.ctx, pr); this.run = null; this.ev = []; this.anchors = []; this.metro = false;
        this.wk = NBFX.ready(this.ctx).then(ok => { this.wkd = 1; if (ok && this.R) this.R.rewk(); }, () => { this.wkd = 1; });
    }
    Live.prototype.play = function (from, pre) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.stop(true);
        let pr = this.pr, t = this.ctx.currentTime + 0.08;
        this.R.sync(); this.R.playing = true; this.R.unretempo(); if (!steady(pr)) { this.R.bpmNow = tempoAt(pr, from || 0); this.R.sigNow = sigAt(pr, from || 0); } this.R.apply();
        this.run = { b: Math.max(0, from || 0), t, jump: true, n: 0, timer: 0 };
        if (pre > 0) { this.run.quiet = this.run.b; this.run.b -= pre; }
        this.anchors = [this.anchor(t, this.run.b)];
        this.run.timer = setInterval(() => this.tick(), 25); this.tick();
    };
    Live.prototype.tick = function () {
        let run = this.run; if (!run) return;
        let now = this.ctx.currentTime;
        if (run.done) { if (now > run.t + 0.05) { this.stop(); if (this.onend) this.onend(); } return; }
        let to = now + 0.25, guard = 0;
        // if the tab freezes it waits instead of blasting every note at once. that happened once and it was horrible
        if (run.t < now + 0.02) { run.t = now + 0.04; this.anchors.push(this.anchor(run.t, run.b)); if (this.anchors.length > 16) this.anchors.splice(0, this.anchors.length - 16); }
        while (run.t < to && guard++ < 32) {
            let pr = this.pr, spb = 60 / pr.bpm, L = pr.loop, looping = L.on && run.b < L.b - 1e-6 && L.b > L.a + 0.01, still = steady(pr);
            let end = looping ? L.b : songEnd(pr), b0 = run.b, b1 = Math.min(end, still ? b0 + (to - run.t) / spb : beatAt(pr, secAt(pr, b0) + to - run.t));
            if (b0 >= end - 1e-9) { if (!looping) { run.done = true; return; } }
            else if (b1 <= b0 + 1e-9) break;
            else {
                let tb = clock(pr, b0, run.t);
                if (run.quiet != null && b0 < run.quiet - 1e-9) { let q = Math.min(b1, run.quiet); schedule(this.R, b0, q, tb, { clickOnly: true }); run.t = tb(q); run.b = q; if (q >= run.quiet - 1e-9) { run.quiet = null; run.jump = true; } continue; }
                schedule(this.R, b0, b1, tb, { jump: run.jump, ev: this.ev, metro: this.metro, n: run.n, end });
                run.jump = false; run.t = tb(b1); run.b = b1;
            }
            if (looping && run.b >= L.b - 1e-6) { run.b = L.a; run.jump = true; run.n++; this.anchors.push(this.anchor(run.t, L.a)); if (this.anchors.length > 16) this.anchors.splice(0, this.anchors.length - 16); }
        }
    };
    Live.prototype.anchor = function (t, b) { return { t, b, spb: 60 / this.pr.bpm, M: steady(this.pr) ? null : tmap(this.pr) }; };
    Live.prototype.retime = function () { if (this.run) this.anchors.push(this.anchor(this.run.t, this.run.b)); };
    Live.prototype.pos = function () {
        if (!this.run || !this.anchors.length) return null;
        let t = this.ctx.currentTime, a = this.anchors[0];
        for (let i = this.anchors.length - 1; i >= 0; i--) if (this.anchors[i].t <= t) { a = this.anchors[i]; break; }
        return Math.max(a.b, a.M ? beatM(a.M, secM(a.M, a.b) + t - a.t) : a.b + (t - a.t) / a.spb);
    };
    Live.prototype.stop = function (quiet) {
        if (this.run) { clearInterval(this.run.timer); this.run = null; }
        let t = this.ctx.currentTime, R = this.R;
        Object.values(R.ch).forEach(c => {
            Object.values(c.mono).forEach(m => { if (m.hush) m.hush(t); else if (m.vca) { m.vca.gain.cancelScheduledValues(t); m.vca.gain.setTargetAtTime(0, t, 0.02); } else if (m.v) { try { m.v.gain.cancelScheduledValues(t); m.v.gain.setTargetAtTime(0, t, 0.02); } catch (e) {} m.end = 0; } });
            if (!quiet) { let gn = c.in.gain; gn.cancelScheduledValues(t); gn.setTargetAtTime(0, t, 0.03); gn.setTargetAtTime(1, t + 0.4, 0.01); }
        });
        Object.keys(R.auto || {}).forEach(owner => Object.values(R.auto[owner]).forEach(a => { let T = R.target(owner, a.path); (T || []).forEach(([prm]) => prm.cancelScheduledValues(t)); }));
        R.inst.forEach(I => { if (I.rest) I.rest(); });
        Object.values(R.ch).forEach(c => { if (!c.bend) return; [c.bend.cs.offset, c.bend.dep.gain].forEach(p => { p.cancelScheduledValues(t); p.setTargetAtTime(0, t, 0.02); }); });
        if (window.NBA) NBA.hush(R, t);
        if (NBFX.untouch) NBFX.untouch(t);
        R.playing = false; R.unretempo(); R.apply(); this.ev = []; R.kicks = [];
    };
    Live.prototype.noteOn = function (uid, m, vel, chord, wh) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        let tr = this.pr.tracks.find(t => t.uid === uid); if (!tr) return null;
        if (!this.R.ch[uid]) { this.R.sync(); this.R.apply(true); }
        let hold = [], t = this.ctx.currentTime + 0.005;
        this.R.trig(tr, t, 30, { m, v: vel }, vel, { hold, chord, wh });
        this.ev.push({ t, uid, vel, m });
        return { hold, uid, m };
    };
    Live.prototype.arpRetune = function (uid, ms) { return this.R.arpRetune(uid, ms); };
    Live.prototype.noteOff = function (h) {
        if (!h) return;
        let t = this.ctx.currentTime;
        h.hold.forEach(x => { if (x.off) x.off(t); x.g.cancelScheduledValues(t); x.g.setTargetAtTime(0, t, Math.max(0.008, x.rel / 4)); x.o.forEach(o => { try { o.stop(t + x.rel * 1.5 + 0.1); } catch (e) {} }); });
    };
    Live.prototype.audition = function (uid, m, n) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        if (!this.wkd && this.wk) { let k = this.wkq = (this.wkq || 0) + 1; this.wk.then(() => { if (k === this.wkq && this.R) this.audition(uid, m, n); }); return; }
        let tr = this.pr.tracks.find(t => t.uid === uid); if (!tr) return;
        if (!this.R.ch[uid]) this.R.sync();
        this.R.apply();
        this.R.trig(tr, this.ctx.currentTime + 0.01, (n && n.d ? n.d : 0.5) * 60 / (this.R.bpmNow || this.pr.bpm), Object.assign({ m, v: 0.85 }, n || {}, { m }), (n && n.v) || 0.85, {});
    };
    Live.prototype.close = function () { this.stop(true); try { this.ctx.close(); } catch (e) {} };

    function range(pr, what) { return what === 'loop' ? [pr.loop.a, pr.loop.b] : [0, songEnd(pr)]; }
    async function bounce(pr, opt) {
        opt = opt || {};
        let sr = opt.rate || 44100, [a, b] = range(pr, opt.what), n = opt.what === 'loop' ? Math.max(1, opt.loops || 1) : 1, spb = 60 / pr.bpm, tail = opt.tail != null ? opt.tail : 2, still = steady(pr), lenS = still ? (b - a) * spb : secAt(pr, b) - secAt(pr, a), total = 0.05 + (still ? (b - a) * n * spb : lenS * n) + tail;
        let OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!OAC) throw new Error('no offline audio here');
        let ctx = new OAC(2, Math.ceil(total * sr), sr);
        await NBFX.ready(ctx);
        if (window.NBA) await NBA.ready(pr);
        let R = new Rig(ctx, pr, { offline: true, only: opt.only, spy: opt.spy });
        if (opt.only) { R.M.vol.gain.value = 1; R.M.clip.curve = softClip(true);
            R.M.vol.disconnect(); R.M.vol.connect(R.M.pre); R.M.clip.oversample = 'none'; }
        R.playing = true; if (!still) { R.bpmNow = tempoAt(pr, a); R.sigNow = sigAt(pr, a); } R.apply(true);
        for (let k = 0; k < n; k++) { let T0 = 0.05 + (still ? k * (b - a) * spb : k * lenS); schedule(R, a, b, still ? x => T0 + (x - a) * spb : clock(pr, a, T0), { jump: true, n: k, end: b }); }
        let buf = await ctx.startRendering();
        return { buf, seconds: total };
    }
    function wav(buf, bits) {
        bits = bits === 24 ? 24 : 16;
        let ch = buf.numberOfChannels, n = buf.length, bps = bits / 8, size = 44 + n * ch * bps, ab = new ArrayBuffer(size), dv = new DataView(ab), p = 0;
        const s4 = str => { for (let i = 0; i < 4; i++) dv.setUint8(p++, str.charCodeAt(i)); };
        s4('RIFF'); dv.setUint32(p, size - 8, true); p += 4; s4('WAVE'); s4('fmt '); dv.setUint32(p, 16, true); p += 4; dv.setUint16(p, 1, true); p += 2; dv.setUint16(p, ch, true); p += 2;
        dv.setUint32(p, buf.sampleRate, true); p += 4; dv.setUint32(p, buf.sampleRate * ch * bps, true); p += 4; dv.setUint16(p, ch * bps, true); p += 2; dv.setUint16(p, bits, true); p += 2; s4('data'); dv.setUint32(p, n * ch * bps, true); p += 4;
        let data = []; for (let c = 0; c < ch; c++) data.push(buf.getChannelData(c));
        for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) {
            let x = clamp(data[c][i], -1, 1);
            if (bits === 16) { dv.setInt16(p, x < 0 ? x * 0x8000 : x * 0x7fff, true); p += 2; }
            else { let v = Math.round(x < 0 ? x * 0x800000 : x * 0x7fffff); dv.setUint8(p, v & 255); dv.setUint8(p + 1, (v >> 8) & 255); dv.setUint8(p + 2, (v >> 16) & 255); p += 3; }
        }
        return new Blob([ab], { type: 'audio/wav' });
    }
    // zip files for stems. didnt want to add a whole library for this
    let crcT = null;
    function crc32(u8) { if (!crcT) { crcT = new Uint32Array(256); for (let i = 0; i < 256; i++) { let c = i; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crcT[i] = c >>> 0; } } let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = crcT[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
    async function zip(files) {
        let parts = [], cen = [], off = 0;
        for (const f of files) {
            let data = new Uint8Array(await f.blob.arrayBuffer()), name = new TextEncoder().encode(f.name), crc = crc32(data);
            let h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
            parts.push(h.buffer, name, data);
            let c = new DataView(new ArrayBuffer(46)); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
            cen.push(c.buffer, name); off += 30 + name.length + data.length;
        }
        let cs = cen.reduce((a, b) => a + (b.byteLength || b.length), 0), e = new DataView(new ArrayBuffer(22)); e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cs, true); e.setUint32(16, off, true);
        return new Blob(parts.concat(cen, [e.buffer]), { type: 'application/zip' });
    }

    window.NB = { grooveOf, laneSegs, laneAt, secAt, beatAt, tempoAt, barOf, barAt, sigAt, steady, clock, durAt, tmap, hitPic, MAW, vox, lyricsOf, VOICES, V, BUSV, isBus, outOf, sendsOf, reaches, canFeed, SCALES, GROOVES, tableOwned, KITROOT, COLS, has, fxOK, uid, blankProject, newTrack, newClip, newFx, touch, songEnd, heal, migrate, inScale, scaleName, hz, valAt, flat, Live, bounce, range, wav, zip };
})();
