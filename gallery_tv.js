window.os = window.os || {};

(function () {
    const MODELS = {
        // wood one with the big clunky dial
        a: { W: 250, H: 182, scr: [22, 20, 150, 116], rad: 14 },
        b: { W: 206, H: 184, scr: [21, 20, 164, 114], rad: 14 },
        c: { W: 190, H: 214, scr: [46, 66, 98, 80], rad: 22 }
    };
    const cache = {};

    function rng(seed) { let s = (seed >>> 0) || 4444; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
    function rr(x, X, y, w, h, r) { r = Array.isArray(r) ? r : [r, r, r, r]; x.beginPath(); x.moveTo(X + r[0], y); x.lineTo(X + w - r[1], y); x.quadraticCurveTo(X + w, y, X + w, y + r[1]); x.lineTo(X + w, y + h - r[2]); x.quadraticCurveTo(X + w, y + h, X + w - r[2], y + h); x.lineTo(X + r[3], y + h); x.quadraticCurveTo(X, y + h, X, y + h - r[3]); x.lineTo(X, y + r[0]); x.quadraticCurveTo(X, y, X + r[0], y); x.closePath(); }
    const hexRgb = h => { let n = parseInt(String(h).replace('#', '').slice(0, 6), 16) || 0xff0099; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
    const mix = (c, k, to) => 'rgb(' + c.map((v, i) => Math.round(v + ((to ? to[i] : 0) - v) * k)).join(',') + ')';

    function scratches(x, R, n, box, col) {
        for (let i = 0; i < n; i++) {
            let px = box[0] + R() * box[2], py = box[1] + R() * box[3], a = R() * Math.PI, L = 3 + R() * R() * 34, steps = 6;
            let g = x.createLinearGradient(px, py, px + Math.cos(a) * L, py + Math.sin(a) * L), al = 0.05 + R() * 0.16;
            g.addColorStop(0, 'rgba(' + col + ',0)'); g.addColorStop(0.3 + R() * 0.3, 'rgba(' + col + ',' + al + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
            x.strokeStyle = g; x.lineWidth = 0.35 + R() * 0.5; x.beginPath(); x.moveTo(px, py);
            for (let s = 1; s <= steps; s++) { let t = s / steps; x.lineTo(px + Math.cos(a) * L * t + (R() - 0.5) * 0.8, py + Math.sin(a) * L * t + (R() - 0.5) * 0.8); }
            x.stroke();
        }
    }
    function speckle(x, R, box, n, col, a) { x.fillStyle = 'rgba(' + col + ',' + a + ')'; for (let i = 0; i < n; i++) x.fillRect(box[0] + R() * box[2], box[1] + R() * box[3], 0.6 + R() * 0.8, 0.6 + R() * 0.8); }
    function dust(x, R, X, y, w) { for (let i = 0; i < w * 0.6; i++) { let px = X + R() * w, py = y - R() * R() * 5; x.fillStyle = 'rgba(210,200,190,' + (0.08 + R() * 0.2) + ')'; x.fillRect(px, py, 0.5 + R(), 0.5 + R() * 0.6); } }
    function knob(x, R, cx, cy, r) {
        x.save();
        x.fillStyle = 'rgba(0,0,0,0.5)'; x.beginPath(); x.arc(cx + 1.5, cy + 2, r + 1, 0, 7); x.fill();
        let g = x.createRadialGradient(cx - r * 0.4, cy - r * 0.5, r * 0.1, cx, cy, r); g.addColorStop(0, '#f2efe9'); g.addColorStop(0.55, '#a9a49c'); g.addColorStop(1, '#4a4640');
        x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
        x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 0.6;
        for (let i = 0; i < 36; i++) { let a = i / 36 * Math.PI * 2; x.beginPath(); x.moveTo(cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78); x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); x.stroke(); }
        let cap = x.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, r * 0.7); cap.addColorStop(0, '#fbf8f2'); cap.addColorStop(1, '#8a857d');
        x.fillStyle = cap; x.beginPath(); x.arc(cx, cy, r * 0.66, 0, 7); x.fill();
        let a = -Math.PI / 2 + (R() - 0.5) * 2.4; x.strokeStyle = '#2a2622'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(cx + Math.cos(a) * r * 0.2, cy + Math.sin(a) * r * 0.2); x.lineTo(cx + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6); x.stroke();
        x.restore();
    }
    function bezel(x, s, r, depth) {
        let [X, y, w, h] = s;
        x.save(); rr(x, X - depth, y - depth, w + depth * 2, h + depth * 2, r + depth);
        let g = x.createLinearGradient(0, y - depth, 0, y + h + depth); g.addColorStop(0, '#050406'); g.addColorStop(1, '#1c1a20');
        x.fillStyle = g; x.fill();
        x.strokeStyle = 'rgba(255,255,255,0.12)'; x.lineWidth = 1; x.stroke();
        rr(x, X, y, w, h, r); x.fillStyle = '#020203'; x.fill(); x.restore();
    }
    function bevel(x, X, y, w, h, r, hi, lo) {
        x.save(); rr(x, X + 0.5, y + 0.5, w - 1, h - 1, r);
        let g = x.createLinearGradient(X, y, X + w * 0.3, y + h); g.addColorStop(0, hi); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, lo);
        x.strokeStyle = g; x.lineWidth = 1.5; x.stroke(); x.restore();
    }

    function brushed(x, R, X, y, w, h) {
        let g = x.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#d9d7d2'); g.addColorStop(0.5, '#a9a6a0'); g.addColorStop(1, '#7d7a74'); x.fillStyle = g; x.fillRect(X, y, w, h);
        for (let yy = y; yy < y + h; yy += 0.7) { x.fillStyle = 'rgba(' + (R() < 0.5 ? '255,255,255' : '0,0,0') + ',' + (R() * 0.07) + ')'; x.fillRect(X, yy, w, 0.5); }
    }
    function drawA(x, R, M) {
        let { W, H } = M, s = M.scr;
        x.fillStyle = '#0d0a08'; x.fillRect(16, H - 7, 30, 7); x.fillRect(W - 46, H - 7, 30, 7);
        rr(x, 0, 0, W, H - 5, 8); x.save(); x.clip();
        x.fillStyle = '#4e3220'; x.fillRect(0, 0, W, H);
        let kx = 40 + R() * 170, ky = 6 + R() * 30;
        for (let yy = -4; yy < H; yy += 1.4) {
            x.beginPath();
            for (let xx = 0; xx <= W; xx += 4) { let d = Math.hypot(xx - kx, (yy - ky) * 1.8), bend = 16 / (1 + d * 0.07); let py = yy + Math.sin(xx * 0.017 + yy * 0.05) * 2 + Math.sin(xx * 0.004 + yy) * 2.6 + bend * Math.sign(yy - ky); xx ? x.lineTo(xx, py) : x.moveTo(xx, py); }
            x.strokeStyle = 'rgba(' + (R() < 0.5 ? '28,14,6' : '120,78,46') + ',' + (0.08 + R() * 0.24) + ')'; x.lineWidth = 0.5 + R() * 1.1; x.stroke();
        }
        let sh = x.createLinearGradient(0, 0, 0, H); sh.addColorStop(0, 'rgba(255,220,180,0.16)'); sh.addColorStop(0.15, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.4)'); x.fillStyle = sh; x.fillRect(0, 0, W, H);
        [[0, 0], [W, 0], [0, H], [W, H]].forEach(([cx, cy]) => { let g = x.createRadialGradient(cx, cy, 0, cx, cy, 14 + R() * 10); g.addColorStop(0, 'rgba(205,150,100,0.4)'); g.addColorStop(1, 'rgba(205,150,100,0)'); x.fillStyle = g; x.fillRect(cx - 30, cy - 30, 60, 60); });
        let mx = 150 + R() * 70; x.strokeStyle = 'rgba(25,12,5,0.4)'; x.lineWidth = 1.5; x.beginPath(); x.ellipse(mx, 0, 14, 4.5, 0, 0.15, Math.PI - 0.1); x.stroke();
        scratches(x, R, 80, [0, 0, W, H], '255,225,190');
        x.restore();
        bevel(x, 0, 0, W, H - 5, 8, 'rgba(255,230,200,0.4)', 'rgba(0,0,0,0.65)');
        rr(x, 8, 8, W - 16, H - 22, 5); let fg = x.createLinearGradient(0, 8, 0, H - 14); fg.addColorStop(0, '#26242a'); fg.addColorStop(1, '#121115'); x.fillStyle = fg; x.fill();
        bevel(x, 8, 8, W - 16, H - 22, 5, 'rgba(0,0,0,0.8)', 'rgba(255,255,255,0.18)');
        rr(x, s[0] - 6, s[1] - 6, s[2] + 12, s[3] + 12, M.rad + 5); let ch = x.createLinearGradient(0, s[1] - 6, 0, s[1] + s[3] + 6); ch.addColorStop(0, '#f2f0ec'); ch.addColorStop(0.5, '#7d7a75'); ch.addColorStop(0.52, '#c2bfba'); ch.addColorStop(1, '#4e4b46'); x.fillStyle = ch; x.fill();
        bezel(x, s, M.rad, 3);
        let px = 182, pw = 56, ph = H - 30; rr(x, px, 12, pw, ph, 3); x.save(); x.clip(); brushed(x, R, px, 12, pw, ph); x.restore();
        bevel(x, px, 12, pw, ph, 3, 'rgba(255,255,255,0.7)', 'rgba(0,0,0,0.5)');
        let cx = px + pw / 2, cy = 44;
        x.fillStyle = '#26242a'; x.font = 'bold 5px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
        for (let i = 0; i < 12; i++) { let a = -Math.PI / 2 + i / 12 * Math.PI * 2; x.fillText(String(i + 1), cx + Math.cos(a) * 24.5, cy + Math.sin(a) * 24.5); }
        x.fillStyle = 'rgba(0,0,0,0.45)'; x.beginPath(); x.arc(cx + 1.5, cy + 2.5, 19, 0, 7); x.fill();
        let dg = x.createRadialGradient(cx - 6, cy - 8, 2, cx, cy, 19); dg.addColorStop(0, '#4a4750'); dg.addColorStop(1, '#141317'); x.fillStyle = dg; x.beginPath(); x.arc(cx, cy, 19, 0, 7); x.fill();
        let turn = R() * Math.PI * 2;
        for (let i = 0; i < 4; i++) { let a = turn + i * Math.PI / 2; x.save(); x.translate(cx, cy); x.rotate(a); let gg = x.createLinearGradient(-3, 0, 3, 0); gg.addColorStop(0, '#5a5760'); gg.addColorStop(1, '#1a191d'); x.fillStyle = gg; rr(x, -3.5, -18, 7, 14, 2); x.fill(); x.restore(); }
        x.strokeStyle = '#f4f0e8'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(cx + Math.cos(turn) * 4, cy + Math.sin(turn) * 4); x.lineTo(cx + Math.cos(turn) * 16, cy + Math.sin(turn) * 16); x.stroke();
        x.fillStyle = 'rgba(30,28,34,0.8)'; x.font = '4px monospace'; x.fillText('VHF', cx, cy + 30);
        knob(x, R, cx, 92, 10);
        x.strokeStyle = 'rgba(30,28,34,0.5)'; x.lineWidth = 0.5; for (let i = 0; i < 30; i++) { let a = i / 30 * Math.PI * 2; x.beginPath(); x.moveTo(cx + Math.cos(a) * 12, 92 + Math.sin(a) * 12); x.lineTo(cx + Math.cos(a) * (i % 5 ? 13 : 14.5), 92 + Math.sin(a) * (i % 5 ? 13 : 14.5)); x.stroke(); }
        x.fillStyle = 'rgba(30,28,34,0.8)'; x.fillText('UHF', cx, 110);
        [['VOL', px + 11], ['BRT', px + 28], ['COL', px + 45]].forEach(([l, kx2]) => { knob(x, R, kx2, 124, 5); x.fillStyle = 'rgba(30,28,34,0.75)'; x.fillText(l, kx2, 134); });
        x.fillStyle = 'rgba(20,18,22,0.85)'; for (let i = 0; i < 5; i++) rr(x, px + 8, 142 + i * 5, pw - 16, 2.4, 1.2), x.fill();
        x.textBaseline = 'alphabetic';
        x.fillStyle = 'rgba(220,215,205,0.7)'; x.font = 'bold 6px monospace'; x.textAlign = 'left'; x.fillText('ミリ電機', 14, H - 17);
        x.fillStyle = 'rgba(220,215,205,0.4)'; x.font = '4.5px monospace'; x.fillText('COLOR TRINITONE  13', 46, H - 17);
        dust(x, R, 4, H - 6, W - 8);
    }
    function drawB(x, R, M) {
        let { W, H } = M;
        x.fillStyle = '#16151a'; x.fillRect(14, H - 6, 30, 6); x.fillRect(W - 44, H - 6, 30, 6);
        rr(x, 0, 0, W, H - 4, 8); x.save(); x.clip();
        let g = x.createLinearGradient(0, 0, W * 0.4, H); g.addColorStop(0, '#9d9aa4'); g.addColorStop(0.5, '#77747e'); g.addColorStop(1, '#55525b'); x.fillStyle = g; x.fillRect(0, 0, W, H);
        speckle(x, R, [0, 0, W, H], 1400, '255,255,255', 0.06); speckle(x, R, [0, 0, W, H], 1400, '0,0,0', 0.08);
        for (let i = 0; i < 4; i++) { let cx = R() * W, cy = R() * H, r = 30 + R() * 60, y2 = x.createRadialGradient(cx, cy, 0, cx, cy, r); y2.addColorStop(0, 'rgba(210,180,90,0.14)'); y2.addColorStop(1, 'rgba(210,180,90,0)'); x.fillStyle = y2; x.fillRect(cx - r, cy - r, r * 2, r * 2); }
        x.fillStyle = 'rgba(20,18,24,0.7)'; for (let i = 0; i < 14; i++) rr(x, 40 + i * 9, 5, 5, 6, 1.5), x.fill();
        scratches(x, R, 90, [0, 0, W, H], '255,255,255');
        x.restore();
        bevel(x, 0, 0, W, H - 4, 8, 'rgba(255,255,255,0.55)', 'rgba(0,0,0,0.55)');
        let s = M.scr; rr(x, s[0] - 9, s[1] - 8, s[2] + 18, s[3] + 16, 12); x.fillStyle = '#3d3b43'; x.fill(); bevel(x, s[0] - 9, s[1] - 8, s[2] + 18, s[3] + 16, 12, 'rgba(0,0,0,0.5)', 'rgba(255,255,255,0.3)');
        bezel(x, s, 14, 4);
        let by = H - 36; rr(x, 12, by, W - 24, 22, 3); x.fillStyle = '#4a4851'; x.fill(); bevel(x, 12, by, W - 24, 22, 3, 'rgba(0,0,0,0.5)', 'rgba(255,255,255,0.25)');
        for (let i = 0; i < 8; i++) { let bx = 18 + i * 12.5; rr(x, bx, by + 6, 9, 9, 1.5); let bg = x.createLinearGradient(0, by + 6, 0, by + 15); bg.addColorStop(0, '#d8d5de'); bg.addColorStop(1, '#8c8994'); x.fillStyle = bg; x.fill(); x.fillStyle = '#2b2930'; x.font = '5px monospace'; x.textAlign = 'center'; x.fillText(String(i + 1), bx + 4.5, by + 12.8); }
        let stuck = Math.floor(R() * 8); rr(x, 18 + stuck * 12.5, by + 7, 9, 8, 1.5); x.fillStyle = '#6d6a74'; x.fill();
        x.fillStyle = '#ff2a3d'; x.beginPath(); x.arc(126, by + 11, 2.2, 0, 7); x.fill(); x.fillStyle = 'rgba(255,42,61,0.25)'; x.beginPath(); x.arc(126, by + 11, 5, 0, 7); x.fill();
        x.fillStyle = '#1a191e'; for (let i = 0; i < 7; i++) rr(x, 140 + i * 7, by + 4, 3.5, 14, 1.5), x.fill();
        x.fillStyle = 'rgba(255,255,255,0.75)'; x.font = 'bold 6px monospace'; x.textAlign = 'left'; x.fillText('VAMPIIVISION', 16, H - 7);
        x.fillStyle = 'rgba(0,0,0,0.45)'; x.font = '5px monospace'; x.textAlign = 'right'; x.fillText('MODEL VV-14', W - 14, H - 7);
        x.save(); x.translate(W - 40, 6); x.rotate(0.12 + R() * 0.1); x.fillStyle = 'rgba(236,224,180,0.92)'; x.fillRect(0, 0, 34, 10); x.fillStyle = '#2a2a6a'; x.font = 'italic 7px "Comic Sans MS", cursive, sans-serif'; x.textAlign = 'left'; x.fillText(R() < 0.5 ? 'ch3 good' : 'dont hit', 3, 7.5); x.restore();
        dust(x, R, 4, H - 5, W - 8);
    }
    function drawC(x, R, M, th) {
        let { W, H } = M, base = hexRgb(th), cx = W / 2, cy = 104, r = 80, s = M.scr;
        let fy = H - 10; x.fillStyle = 'rgba(0,0,0,0.5)'; x.beginPath(); x.ellipse(cx + 3, fy + 4, 52, 8, 0, 0, 7); x.fill();
        let fg = x.createLinearGradient(0, fy - 8, 0, fy + 8); fg.addColorStop(0, mix(base, 0.1, [255, 255, 255])); fg.addColorStop(1, mix(base, 0.7)); x.fillStyle = fg; x.beginPath(); x.ellipse(cx, fy, 48, 8, 0, 0, 7); x.fill();
        x.fillStyle = mix(base, 0.55); x.fillRect(cx - 9, cy + r - 6, 18, fy - (cy + r - 6));
        x.lineWidth = 1.4;
        for (let i = 0; i <= 16; i++) {
            let t = i / 16, px = cx - 34 + t * 68, py = cy - r - 2 - Math.sin(t * Math.PI) * 26;
            x.strokeStyle = i % 2 ? '#8d8a92' : '#d6d3da'; x.beginPath(); x.ellipse(px, py, i % 2 ? 1.2 : 2.6, i % 2 ? 2.6 : 1.4, Math.atan2(Math.cos(t * Math.PI) * -26, 68 / 16), 0, 7); x.stroke();
        }
        x.save(); x.beginPath(); x.arc(cx, cy, r, 0, 7); x.clip();
        let g = x.createRadialGradient(cx - r * 0.4, cy - r * 0.45, r * 0.08, cx, cy, r * 1.02); g.addColorStop(0, mix(base, 0.55, [255, 255, 255])); g.addColorStop(0.35, mix(base, 0.05, [255, 255, 255])); g.addColorStop(0.8, mix(base, 0.55)); g.addColorStop(1, mix(base, 0.82));
        x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2);
        for (let i = 0; i < 10; i++) { let a = R() * Math.PI * 2, d = r * (0.82 + R() * 0.16), px = cx + Math.cos(a) * d, py = cy + Math.sin(a) * d; x.fillStyle = 'rgba(228,222,214,' + (0.5 + R() * 0.4) + ')'; x.beginPath(); for (let k = 0; k < 6; k++) { let aa = k / 6 * Math.PI * 2, q = (0.6 + R() * 1.6); k ? x.lineTo(px + Math.cos(aa) * q, py + Math.sin(aa) * q) : x.moveTo(px + Math.cos(aa) * q, py + Math.sin(aa) * q); } x.fill(); }
        scratches(x, R, 70, [cx - r, cy - r, r * 2, r * 2], '255,255,255');
        x.restore();
        x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.ellipse(cx - r * 0.42, cy - r * 0.55, r * 0.22, r * 0.1, -0.6, 0, 7); x.fill();
        x.strokeStyle = 'rgba(0,0,0,0.45)'; x.lineWidth = 1; x.beginPath(); x.arc(cx, cy, r - 0.5, 0, 7); x.stroke();
        rr(x, s[0] - 12, s[1] - 12, s[2] + 24, s[3] + 24, 30); let vg = x.createLinearGradient(0, s[1] - 12, 0, s[1] + s[3] + 12); vg.addColorStop(0, '#1d1b21'); vg.addColorStop(1, '#060508'); x.fillStyle = vg; x.fill();
        x.strokeStyle = 'rgba(255,255,255,0.22)'; x.lineWidth = 1; x.stroke();
        bezel(x, s, M.rad, 2);
        knob(x, R, cx + 42, cy - 58, 7);
        x.fillStyle = 'rgba(255,255,255,0.7)'; x.font = 'bold 5px monospace'; x.textAlign = 'center'; x.fillText('VAMPSPHERE', cx, s[1] + s[3] + 20);
        x.save(); x.translate(cx - 50, cy + 40); x.rotate(-0.4 + R() * 0.3); x.fillStyle = '#1a1520';
        x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(-4, -3, -8, -1); x.quadraticCurveTo(-6, 1, -7, 3); x.quadraticCurveTo(-4, 2, -2, 3); x.quadraticCurveTo(0, 1.5, 2, 3); x.quadraticCurveTo(4, 2, 7, 3); x.quadraticCurveTo(6, 1, 8, -1); x.quadraticCurveTo(4, -3, 0, 0); x.fill();
        x.restore();
    }
    // curved glass. the ceiling lights show up in it
    function glass(M, R) {
        let s = M.scr, w = s[2], h = s[3], c = document.createElement('canvas'), k = 2; c.width = w * k; c.height = h * k;
        let x = c.getContext('2d'); x.scale(k, k);
        let v = x.createRadialGradient(w * 0.46, h * 0.42, Math.min(w, h) * 0.25, w / 2, h / 2, Math.hypot(w, h) * 0.56); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.7, 'rgba(0,0,0,0.18)'); v.addColorStop(1, 'rgba(0,0,0,0.62)'); x.fillStyle = v; x.fillRect(0, 0, w, h);
        let t = x.createLinearGradient(0, 0, 0, h * 0.14); t.addColorStop(0, 'rgba(0,0,0,0.5)'); t.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = t; x.fillRect(0, 0, w, h * 0.14);
        x.save(); x.translate(w * 0.34, h * 0.24); x.scale(1, 0.55); let b = x.createRadialGradient(0, 0, 0, 0, 0, w * 0.42); b.addColorStop(0, 'rgba(255,255,255,0.075)'); b.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = b; x.fillRect(-w, -w, w * 2, w * 2); x.restore();
        let on = R() < 0.7; x.save(); x.translate(w * (0.08 + R() * 0.45), h * (0.05 + R() * 0.1)); x.rotate((R() - 0.6) * 0.14); let lw = on ? w * (0.18 + R() * 0.2) : 0, lh = Math.max(2.5, h * (0.03 + R() * 0.025));
        let l = x.createLinearGradient(0, 0, lw, 0); l.addColorStop(0, 'rgba(235,242,255,0)'); l.addColorStop(0.2, 'rgba(235,242,255,0.16)'); l.addColorStop(0.8, 'rgba(235,242,255,0.12)'); l.addColorStop(1, 'rgba(235,242,255,0)');
        if (on) { x.fillStyle = l; rr(x, 0, 0, lw, lh, lh / 2); x.fill(); } x.restore();
        rr(x, 0.8, 0.8, w - 1.6, h - 1.6, M.rad); let e = x.createLinearGradient(0, 0, w * 0.4, h); e.addColorStop(0, 'rgba(255,255,255,0.2)'); e.addColorStop(0.3, 'rgba(255,255,255,0.03)'); e.addColorStop(0.75, 'rgba(255,255,255,0)'); e.addColorStop(1, 'rgba(255,255,255,0.07)'); x.strokeStyle = e; x.lineWidth = 1.4; x.stroke();
        return c.toDataURL();
    }

    // shelving bits. not on the wall anymore but i like them so theyre staying
    function cv(w, h) { let k = 2, c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k)); let x = c.getContext('2d'); x.scale(k, k); return [c, x]; }
    os.tvShelf = function (w, seed) {
        let ck = 'sh' + Math.round(w) + '_' + seed; if (cache[ck]) return cache[ck];
        let R = rng(seed), H = 30, [c, x] = cv(w, H);
        let tg = x.createLinearGradient(0, 0, 0, 9); tg.addColorStop(0, '#1d1714'); tg.addColorStop(1, '#3a2e27'); x.fillStyle = tg; x.fillRect(0, 0, w, 9);
        for (let i = 0; i < w / 3; i++) { x.fillStyle = 'rgba(' + (R() < 0.5 ? '255,230,200' : '0,0,0') + ',' + (R() * 0.06) + ')'; x.fillRect(R() * w, R() * 9, 2 + R() * 30, 0.6); }
        let fg = x.createLinearGradient(0, 9, 0, 22); fg.addColorStop(0, '#5a4638'); fg.addColorStop(0.15, '#3e3027'); fg.addColorStop(1, '#241b16'); x.fillStyle = fg; x.fillRect(0, 9, w, 13);
        x.fillStyle = 'rgba(255,230,200,0.25)'; x.fillRect(0, 9, w, 0.8);
        for (let i = 0; i < Math.max(2, w / 160); i++) {
            let px = R() * (w - 30), pw = 6 + R() * 22;
            x.fillStyle = '#8a7356'; x.fillRect(px, 10, pw, 11);
            for (let k = 0; k < pw * 4; k++) { x.fillStyle = 'rgba(' + (R() < 0.5 ? '60,40,20' : '200,170,120') + ',' + (0.3 + R() * 0.5) + ')'; x.fillRect(px + R() * pw, 10 + R() * 11, 0.8 + R() * 1.2, 0.8 + R()); }
        }
        scratches(x, R, Math.round(w / 6), [0, 9, w, 13], '255,230,200');
        if (R() < 0.6) { let px = 20 + R() * (w - 60); x.fillStyle = '#f0ece0'; x.fillRect(px, 12, 22, 7); x.fillStyle = '#c0283a'; x.font = 'bold 5px monospace'; x.textAlign = 'left'; x.fillText('¥980', px + 2, 17.6); }
        let sg = x.createLinearGradient(0, 22, 0, H); sg.addColorStop(0, 'rgba(0,0,0,0.7)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = sg; x.fillRect(0, 22, w, H - 22);
        return (cache[ck] = c.toDataURL());
    };
    os.tvUpright = function () {
        if (cache.up) return cache.up;
        let [c, x] = cv(18, 26);
        let g = x.createLinearGradient(0, 0, 18, 0); g.addColorStop(0, '#2a2a30'); g.addColorStop(0.25, '#6e6d76'); g.addColorStop(0.5, '#4d4c55'); g.addColorStop(1, '#232228'); x.fillStyle = g; x.fillRect(0, 0, 18, 26);
        x.fillStyle = '#060508'; rr(x, 6, 4, 6, 12, 3); x.fill(); x.beginPath(); x.arc(9, 21.5, 1.8, 0, 7); x.fill();
        x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(6, 16, 6, 0.6);
        x.fillStyle = 'rgba(160,90,40,0.18)'; x.fillRect(12, 0, 3, 26);
        return (cache.up = c.toDataURL());
    };
    os.tvProp = function (kind, seed) {
        let ck = 'p' + kind + seed; if (cache[ck]) return cache[ck];
        let R = rng(seed), out;
        if (kind === 'vhs') {
            let [c, x] = cv(78, 22);
            let g = x.createLinearGradient(0, 4, 0, 22); g.addColorStop(0, '#2b2a30'); g.addColorStop(1, '#0d0c10'); x.fillStyle = g; rr(x, 1, 6, 76, 15, 1.5); x.fill();
            x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(2, 6.5, 74, 0.8);
            x.fillStyle = '#ece6d6'; x.fillRect(16, 9, 46, 9);
            x.fillStyle = '#c0283a'; x.fillRect(16, 9, 46, 1.5);
            x.save(); x.beginPath(); x.rect(17, 10, 44, 8); x.clip(); x.fillStyle = '#20206a'; x.font = 'italic 4.6px "Comic Sans MS", cursive, sans-serif'; x.textAlign = 'center';
            x.fillText(['DONT TAPE OVER', 'ep 4 + 5??', '1994.04.04', 'misc (good)'][Math.floor(R() * 4)], 39, 16.2); x.restore();
            out = { url: c.toDataURL(), w: 78, h: 22 };
        } else if (kind === 'remote') {
            let [c, x] = cv(56, 12);
            x.fillStyle = '#16151a'; rr(x, 1, 3, 54, 8, 3); x.fill();
            x.fillStyle = 'rgba(255,255,255,0.15)'; x.fillRect(3, 3.5, 50, 0.6);
            for (let i = 0; i < 9; i++) { x.fillStyle = i === 0 ? '#c0283a' : '#5a5862'; x.fillRect(6 + i * 5, 5.5, 3, 2); }
            x.fillStyle = '#3a3640'; x.fillRect(50, 5, 3, 3);
            out = { url: c.toDataURL(), w: 56, h: 12 };
        } else {
            let [c, x] = cv(64, 16);
            x.fillStyle = '#d9d5cc'; rr(x, 1, 5, 62, 10, 2); x.fill(); x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(1, 13, 62, 2);
            for (let i = 0; i < 4; i++) { x.fillStyle = '#4a4740'; x.fillRect(16 + i * 11, 7.5, 2, 3); x.fillRect(20 + i * 11, 7.5, 2, 3); }
            x.fillStyle = '#ff2a3d'; rr(x, 3, 6.5, 9, 6, 1); x.fill(); x.fillStyle = 'rgba(255,42,61,0.35)'; x.beginPath(); x.arc(7.5, 9.5, 7, 0, 7); x.fill();
            out = { url: c.toDataURL(), w: 64, h: 16 };
        }
        return (cache[ck] = out);
    };

    // the plain box ones. most of the wall
    const COLS = {
        black: ['#2a292e', '#141317', '#0b0a0d', 'rgba(255,255,255,0.22)'],
        grey: ['#7b7882', '#55525b', '#3a3840', 'rgba(255,255,255,0.4)'],
        silver: ['#d3d1cc', '#a29f99', '#6d6a65', 'rgba(255,255,255,0.75)'],
        orange: ['#f08a3a', '#c4581c', '#7a3210', 'rgba(255,230,200,0.6)']
    };
    const BRANDS = ['VAMPIIVISION', 'VAMPIIVISION 14', 'VAMPII VISION', 'ヴァンピィビジョン', 'VAMPIIVISION ST-20'];
    const tone = (h, k, to) => { let c = hexRgb(h); return c.map((v, i) => Math.round(v + ((to ? to[i] : 0) - v) * k)); };
    function wear(x, R, W, H0, M, C, light) {
        let s = M.scr;
        x.save(); x.beginPath(); x.rect(0, 0, W, H0); rr(x, s[0] - 2, s[1] - 2, s[2] + 4, s[3] + 4, M.rad + 2); x.clip('evenodd');
        let hi = light ? '255,255,255' : '190,186,196';
        for (let i = 0; i < W / 3; i++) {
            let t = R(), e = Math.floor(R() * 4), a = 0.12 + R() * 0.28, L = 2 + R() * 10; x.fillStyle = 'rgba(' + hi + ',' + a + ')';
            if (e === 0) x.fillRect(t * W, 0.8 + R() * 1.5, L, 1); else if (e === 1) x.fillRect(t * W, H0 - 2.2 - R() * 1.5, L, 1);
            else if (e === 2) x.fillRect(0.8 + R() * 1.5, t * H0, 1, L); else x.fillRect(W - 2.2 - R() * 1.5, t * H0, 1, L);
        }
        if (R() < 0.5) { let fx = R() < 0.5, fy = R() < 0.5, cx = fx ? W : 0, cy = fy ? H0 : 0, r = 2.5 + R() * 3; x.fillStyle = light ? 'rgba(60,50,40,0.35)' : 'rgba(150,146,156,0.25)'; x.beginPath(); x.moveTo(cx, cy);
            for (let k = 0; k <= 4; k++) { let a = k / 4 * Math.PI / 2, rk = r * (0.6 + R() * 0.6); x.lineTo(cx + Math.cos(a) * rk * (fx ? -1 : 1), cy + Math.sin(a) * rk * (fy ? -1 : 1)); } x.fill(); }
        for (let i = 0; i < 3; i++) { let cx = W * (0.55 + R() * 0.4), cy = H0 * (0.7 + R() * 0.3), r = 8 + R() * 14, g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, light ? 'rgba(70,55,35,0.2)' : 'rgba(0,0,0,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2); }
        for (let i = 0; i < 2 + R() * 3; i++) { let cx = R() * W, cy = R() < 0.5 ? R() * H0 * 0.15 : H0 * (0.75 + R() * 0.25), an = (R() - 0.5) * 0.8; x.strokeStyle = 'rgba(' + hi + ',' + (0.12 + R() * 0.15) + ')'; x.lineWidth = 0.5;
            for (let k = 0; k < 4 + R() * 6; k++) { let ox = cx + (R() - 0.5) * 8, oy = cy + (R() - 0.5) * 4, l = 2 + R() * 7; x.beginPath(); x.moveTo(ox, oy); x.lineTo(ox + Math.cos(an) * l, oy + Math.sin(an) * l); x.stroke(); } }
        if (R() < 0.35) { let sx = 6 + R() * (W - 40), sy = H0 * (0.05 + R() * 0.2), sw = 14 + R() * 18, sh = 6 + R() * 6; x.fillStyle = light ? 'rgba(120,100,60,0.12)' : 'rgba(200,190,170,0.07)'; x.fillRect(sx, sy, sw, sh); x.fillStyle = 'rgba(240,235,220,0.18)'; for (let k = 0; k < 4; k++) x.fillRect(sx + R() * sw, sy + R() * sh, 1 + R() * 3, 1 + R() * 2); }
        if (R() < 0.12) { let lf = R() < 0.5, px = lf ? 2 : W - 2, py = H0 * (0.2 + R() * 0.6); x.strokeStyle = 'rgba(0,0,0,0.6)'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 5; k++) { px += (lf ? 1 : -1) * (2 + R() * 4); py += (R() - 0.5) * 5; x.lineTo(px, py); } x.stroke(); }
        let mg = x.createLinearGradient(0, s[1] + s[3] - 4, 0, s[1] + s[3] + 6); mg.addColorStop(0, 'rgba(0,0,0,0)'); mg.addColorStop(1, 'rgba(40,32,24,' + (light ? 0.25 : 0.2) + ')'); x.fillStyle = mg; x.fillRect(s[0], s[1] + s[3] - 4, s[2], 10);
        x.restore();
    }
    function boxSpec(w, h, col, ctrl) {
        let mL = Math.round(w * 0.075), mT = Math.round(h * 0.085), mR = ctrl === 'right' ? Math.round(w * 0.24) : mL, mB = ctrl === 'bottom' ? Math.round(h * 0.2) : Math.round(h * 0.11);
        return { W: w, H: h, col, ctrl, scr: [mL, mT, w - mL - mR, h - mT - mB], rad: Math.max(6, Math.round(Math.min(w, h) * 0.07)) };
    }
    function grille(x, X, y, w, h, dark) {
        x.save(); x.beginPath(); x.rect(X, y, w, h); x.clip();
        for (let yy = y + 1.5, r = 0; yy < y + h; yy += 2.6, r++) for (let xx = X + 1.5 + (r % 2) * 1.3; xx < X + w; xx += 2.6) {
            x.fillStyle = 'rgba(255,255,255,' + (dark ? 0.06 : 0.25) + ')'; x.beginPath(); x.arc(xx, yy + 0.35, 0.75, 0, 7); x.fill();
            x.fillStyle = 'rgba(0,0,0,0.7)'; x.beginPath(); x.arc(xx, yy, 0.7, 0, 7); x.fill();
        }
        x.restore();
    }
    function btn(x, X, y, w, h, base, down) {
        x.fillStyle = 'rgba(0,0,0,0.5)'; rr(x, X - 0.5, y - 0.5, w + 1, h + 1.5, 1.5); x.fill();
        let g = x.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, down ? base[2] : base[0]); g.addColorStop(1, down ? base[1] : base[2]);
        x.fillStyle = g; rr(x, X, y + (down ? 0.8 : 0), w, h - (down ? 0.8 : 0), 1.2); x.fill();
        if (!down) { x.fillStyle = 'rgba(255,255,255,0.22)'; x.fillRect(X + 1, y + 0.4, w - 2, 0.5); }
    }
    function drawBox(x, R, M) {
        let { W, H } = M, C = COLS[M.col] || COLS.black, s = M.scr, H0 = H - 3, light = M.col === 'silver' || M.col === 'orange';
        x.fillStyle = '#0a090b'; rr(x, W * 0.1, H0 - 2, 12, 5, 1.5); x.fill(); rr(x, W * 0.9 - 12, H0 - 2, 12, 5, 1.5); x.fill();
        rr(x, 0, 0, W, H0, 6); x.save(); x.clip();
        let g = x.createLinearGradient(0, 0, 0, H0); g.addColorStop(0, C[0]); g.addColorStop(0.6, C[1]); g.addColorStop(1, C[2]); x.fillStyle = g; x.fillRect(0, 0, W, H0);
        let sd = x.createLinearGradient(0, 0, W, 0); sd.addColorStop(0, 'rgba(255,255,255,0.05)'); sd.addColorStop(0.5, 'rgba(255,255,255,0)'); sd.addColorStop(1, 'rgba(0,0,0,0.12)'); x.fillStyle = sd; x.fillRect(0, 0, W, H0);
        speckle(x, R, [0, 0, W, H0], W * H * 0.08, '255,255,255', 0.018);
        speckle(x, R, [0, 0, W, H0], W * H * 0.08, '0,0,0', 0.035);
        if (M.col === 'grey' || M.col === 'silver') for (let i = 0; i < 3; i++) { let cx = R() * W, cy = R() * H, r = 20 + R() * 50, y2 = x.createRadialGradient(cx, cy, 0, cx, cy, r); y2.addColorStop(0, 'rgba(200,170,80,0.12)'); y2.addColorStop(1, 'rgba(200,170,80,0)'); x.fillStyle = y2; x.fillRect(cx - r, cy - r, r * 2, r * 2); }
        scratches(x, R, Math.round(W * H / 900), [0, 0, W, H0], light ? '255,255,255' : '200,200,210');
        x.restore();
        x.save(); rr(x, 0.6, 0.6, W - 1.2, H0 - 1.2, 6); x.lineWidth = 1.2;
        let eg = x.createLinearGradient(0, 0, 0, H0); eg.addColorStop(0, C[3]); eg.addColorStop(0.08, 'rgba(255,255,255,0.04)'); eg.addColorStop(0.9, 'rgba(0,0,0,0.15)'); eg.addColorStop(1, 'rgba(0,0,0,0.6)'); x.strokeStyle = eg; x.stroke(); x.restore();
        let pad = Math.max(5, Math.round(Math.min(W, H) * 0.035));
        rr(x, s[0] - pad, s[1] - pad, s[2] + pad * 2, s[3] + pad * 2, M.rad + pad);
        let rg = x.createLinearGradient(0, s[1] - pad, 0, s[1] + s[3] + pad); rg.addColorStop(0, 'rgba(0,0,0,0.55)'); rg.addColorStop(0.5, 'rgba(0,0,0,0.25)'); rg.addColorStop(1, light ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.1)'); x.fillStyle = rg; x.fill();
        x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 0.8; x.stroke();
        bezel(x, s, M.rad, 2);
        wear(x, R, W, H0, M, C, light);
        let fs = Math.max(4, Math.min(6.5, W / 30)), brand = BRANDS[(Math.imul(M.seed + W * 131 + H * 7919, 2654435761) >>> 0) % BRANDS.length];
        const logo = (bx, by, size, mid) => {
            x.textAlign = mid ? 'center' : 'left';
            let ink = light ? tone(C[2], 0.35) : tone(C[0], 0.3, [255, 255, 255]), jp = /[^\x00-\x7f]/.test(brand);
            x.font = (jp ? '' : 'bold ') + size + 'px ' + (jp ? 'sans-serif' : 'monospace'); try { x.letterSpacing = (jp ? 0.5 : size * 0.16).toFixed(1) + 'px'; } catch (e) {}
            x.fillStyle = light ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.5)'; x.fillText(brand, bx, by + 0.5);
            x.fillStyle = 'rgba(' + ink.join(',') + ',0.62)'; x.fillText(brand, bx, by);
            try { x.letterSpacing = '0px'; } catch (e) {}
        };
        const KEY = light ? [C[0], C[1], C[2]] : ['#3a3940', '#1c1b20', '#141318'];
        const led = (lx, ly) => { M.led = [lx, ly]; x.fillStyle = 'rgba(0,0,0,0.6)'; x.beginPath(); x.arc(lx, ly, 2.2, 0, 7); x.fill(); let lg = x.createRadialGradient(lx - 0.5, ly - 0.5, 0, lx, ly, 1.6); lg.addColorStop(0, '#ff9a9a'); lg.addColorStop(0.5, '#e0182c'); lg.addColorStop(1, '#5a0610'); x.fillStyle = lg; x.beginPath(); x.arc(lx, ly, 1.6, 0, 7); x.fill(); };
        if (M.ctrl === 'bottom') {
            let by = s[1] + s[3] + pad + 3, bh = H0 - by - 5;
            x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(4, by - 1.5, W - 8, 0.7); x.fillStyle = 'rgba(255,255,255,' + (light ? 0.3 : 0.06) + ')'; x.fillRect(4, by - 0.8, W - 8, 0.6);
            logo(s[0], by + bh * 0.5 + fs * 0.35, fs);
            grille(x, W * 0.42, by + 2, Math.min(36, W * 0.16), bh - 4, !light);
            let n = Math.max(3, Math.floor(W / 40)), stuck = Math.floor(R() * n);
            for (let i = 0; i < n; i++) btn(x, W - 14 - (n - i) * (fs + 4), by + bh * 0.25, fs + 1, bh * 0.45, KEY, i === stuck);
            led(W - 9, by + bh * 0.47);
        } else if (M.ctrl === 'right') {
            let px = s[0] + s[2] + pad + 3, pw = W - px - 6;
            x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(px - 2, s[1], 0.7, s[3]);
            grille(x, px + 1, s[1] + 1, pw - 2, H0 * 0.42, !light);
            for (let i = 0; i < 3; i++) btn(x, px + 3, H0 * 0.62 + i * (fs + 4), pw - 6, fs + 1, KEY, false);
            led(px + pw / 2, H0 - 8);
            logo(s[0] + s[2] / 2, (s[1] + s[3] + pad + H0) / 2 + (fs - 1) * 0.35, fs - 1, 1);
        } else { logo(s[0] + s[2] / 2, (s[1] + s[3] + pad + H0) / 2 + fs * 0.35, fs - 0.5, 1); led(W - 8, H0 - 6); }
        if (R() < 0.4) {
            let sx = R() < 0.5 ? 6 : W - 40, sy = 2 + R() * 2; x.save(); x.translate(sx + 17, sy + 5); x.rotate((R() - 0.5) * 0.08);
            x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(-16.5, -4.4, 34, 10); x.fillStyle = '#efeadc'; x.fillRect(-17, -5, 34, 10);
            x.fillStyle = 'rgba(160,130,60,0.12)'; x.fillRect(-17, 2, 34, 3);
            x.strokeStyle = '#2a50a8'; x.lineWidth = 0.5; x.strokeRect(-16, -4, 32, 8); x.fillStyle = '#2a50a8'; x.font = '4.5px monospace'; x.textAlign = 'left'; x.fillText('備品 No.' + String(Math.floor(R() * 900) + 100), -14, 1.8); x.restore();
        }
        dust(x, R, 3, H0 - 1, W - 6);
    }
    os.tvBox = function (w, h, col, ctrl, seed) {
        let ck = 'bx' + [w, h, col, ctrl, seed].join('_'); if (cache[ck]) return cache[ck];
        let M = boxSpec(w, h, col, ctrl), dx = Math.round(w * 0.045), dy = Math.round(Math.min(11, h * 0.065));
        let k = Math.min(2, Math.max(1.5, window.devicePixelRatio || 1)), c = document.createElement('canvas'); c.width = Math.round((w + dx) * k); c.height = Math.round((h + dy) * k);
        let x = c.getContext('2d'), R = rng(seed); x.scale(k, k); x.translate(0, dy);
        let C = COLS[col] || COLS.black, H0 = h - 3;
        // side + top + the vent slots
        x.beginPath(); x.moveTo(w - 3, 2); x.lineTo(w - 3 + dx, 2 - dy); x.lineTo(w - 3 + dx, H0 - 4 - dy); x.lineTo(w - 3, H0 - 1); x.closePath();
        let sg = x.createLinearGradient(0, 0, 0, H0); sg.addColorStop(0, C[1]); sg.addColorStop(1, C[2]); x.fillStyle = sg; x.fill(); x.fillStyle = 'rgba(0,0,0,0.42)'; x.fill();
        for (let i = 0; i < 5; i++) { let vy = H0 * 0.3 + i * 5; x.strokeStyle = 'rgba(0,0,0,0.5)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(w - 1 + dx * 0.2, vy - dy * 0.2); x.lineTo(w - 3 + dx * 0.85, vy - dy * 0.85); x.stroke(); }
        x.beginPath(); x.moveTo(3, 1); x.lineTo(w - 3, 1); x.lineTo(w - 3 + dx, 1 - dy); x.lineTo(3 + dx, 1 - dy); x.closePath();
        let tg = x.createLinearGradient(0, 1, 0, 1 - dy); tg.addColorStop(0, C[0]); tg.addColorStop(1, C[1]); x.fillStyle = tg; x.fill();
        x.fillStyle = 'rgba(0,0,0,0.15)'; x.fill();
        speckle(x, R, [dx * 0.5, -dy, w, dy], w * dy * 0.06, '0,0,0', 0.06);
        x.strokeStyle = C[3]; x.globalAlpha = 0.5; x.lineWidth = 0.7; x.beginPath(); x.moveTo(4, 0.6); x.lineTo(w - 4, 0.6); x.lineTo(w - 3 + dx, 0.6 - dy); x.stroke(); x.globalAlpha = 1;
        let tr = rng(seed * 7 + w); if (tr() < 0.3) { let mx = w * (0.25 + tr() * 0.5); x.strokeStyle = col === 'silver' || col === 'orange' ? 'rgba(70,40,15,0.45)' : 'rgba(210,180,140,0.18)'; x.lineWidth = 1.2; x.beginPath(); x.ellipse(mx + dx * 0.5, -dy * 0.5, Math.min(12, w * 0.08), dy * 0.32, 0, 0.2, Math.PI * 2 - 0.6); x.stroke(); }
        M.seed = seed >>> 0; try { drawBox(x, R, M); } catch (e) {}
        return (cache[ck] = { url: c.toDataURL(), glass: glass(M, R), W: w + dx, H: h + dy, scr: [M.scr[0], M.scr[1] + dy, M.scr[2], M.scr[3]], rad: M.rad, led: M.led ? [M.led[0], M.led[1] + dy] : null });
    };

    const DEPTH = { a: [10, 12, '#2c1b10', '#6a4a33'], b: [8, 10, '#36343c', '#a9a6b0'] };
    function body(x, model, M) {
        let d = DEPTH[model]; if (!d) return;
        let [dx, dy, side, top] = d, n = 14;
        for (let i = n; i >= 1; i--) {
            let t = i / n; x.save(); x.translate(dx * t, -dy * t);
            rr(x, 0, 0, M.W, M.H - 5, 8);
            x.fillStyle = side; x.fill();
            x.save(); x.clip(); let g = x.createLinearGradient(0, 0, 0, 10); g.addColorStop(0, top); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.globalAlpha = 0.5; x.fillRect(0, 0, M.W, 10); x.restore();
            x.restore();
        }
        x.save(); x.translate(dx, -dy); rr(x, 0, 0, M.W, M.H - 5, 8); x.strokeStyle = 'rgba(255,255,255,0.08)'; x.lineWidth = 0.8; x.stroke(); x.restore();
    }
    os.tvCasing = function (model, seed, theme) {
        let M = MODELS[model] || MODELS.a, ck = model + seed + (model === 'c' ? theme : '');
        if (cache[ck]) return cache[ck];
        let d = DEPTH[model] || [0, 0], OW = M.W + d[0], OH = M.H + d[1];
        let k = Math.min(2, Math.max(1.5, window.devicePixelRatio || 1)), c = document.createElement('canvas'); c.width = Math.round(OW * k); c.height = Math.round(OH * k);
        let x = c.getContext('2d'), R = rng(seed); x.scale(k, k); x.translate(0, d[1]);
        try { body(x, model, M); (model === 'b' ? drawB : model === 'c' ? drawC : drawA)(x, R, M, theme); } catch (e) {}
        return (cache[ck] = { url: c.toDataURL(), glass: glass(M, R), W: OW, H: OH, scr: [M.scr[0], M.scr[1] + d[1], M.scr[2], M.scr[3]] });
    };
    os.tvCasing.models = MODELS;
})();
