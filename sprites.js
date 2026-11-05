
window.os = window.os || {};

(function () {
    const cache = {}, urls = {};
    let themeAt = 0, theme = { p: '#ff2d6f', s: '#2de0ff' }, themeSig = '';
    const DB = () => window.spritesDB || { pals: {}, art: {} };
    function readTheme() {
        let now = performance.now();
        if (now - themeAt < 400) return;
        themeAt = now;
        try {
            let cs = getComputedStyle(document.documentElement);
            let p = cs.getPropertyValue('--neon-primary').trim() || theme.p, s = cs.getPropertyValue('--neon-secondary').trim() || theme.s;
            if (p + s !== themeSig) { themeSig = p + s; theme = { p, s }; for (let k in cache) if (cache[k].themed) { delete cache[k]; delete urls[k]; } }
        } catch (e) {}
    }
    function palOf(key) {
        let d = DB(), g = key.split('/')[0], a = d.art[key] || {};
        return Object.assign({}, d.pals.common || {}, d.pals[g] || {}, a.pal || {});
    }
    function build(key, swap) {
        let a = DB().art[key];
        if (!a || !a.px) return null;
        let pal = Object.assign(palOf(key), swap || {}), flat = swap && swap['*'], rows = a.px.split('|'), w = a.w || rows[0].length, h = a.h || rows.length;
        let c = document.createElement('canvas'); c.width = w; c.height = h;
        let x = c.getContext('2d'), img = x.createImageData(w, h), themed = false, rgb = {};
        const toRgb = v => {
            if (rgb[v]) return rgb[v];
            let col = v;
            if (v === '@p' || v === '@s') { col = theme[v[1]]; themed = true; }
            let m = /^#?([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(String(col).trim()), out;
            if (m) out = [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16), m[2] ? parseInt(m[2], 16) : 255];
            else { x.fillStyle = col; let f = x.fillStyle; let mm = /^#([0-9a-f]{6})$/i.exec(f); out = mm ? [parseInt(mm[1].slice(0, 2), 16), parseInt(mm[1].slice(2, 4), 16), parseInt(mm[1].slice(4, 6), 16), 255] : [255, 0, 255, 255]; }
            rgb[v] = out; return out;
        };
        for (let y = 0; y < h; y++) {
            let r = rows[y] || '';
            for (let i = 0; i < w; i++) {
                let ch = r[i]; if (!ch || ch === '.' || pal[ch] == null) continue;
                let c4 = toRgb(flat || pal[ch]), o = (y * w + i) * 4;
                img.data[o] = c4[0]; img.data[o + 1] = c4[1]; img.data[o + 2] = c4[2]; img.data[o + 3] = c4[3];
            }
        }
        x.putImageData(img, 0, 0);
        c.themed = themed;
        return c;
    }
    os.sprite = function (key, swap) {
        readTheme();
        let ck = swap ? key + '|' + JSON.stringify(swap) : key;
        if (!cache[ck]) { let c = build(key, swap); if (!c) return null; cache[ck] = c; }
        return cache[ck];
    };
    os.spriteHas = key => !!DB().art[key];
    os.spriteSize = key => { let a = DB().art[key]; return a ? [a.w, a.h] : [0, 0]; };
    os.spriteKeys = prefix => Object.keys(DB().art).filter(k => !prefix || k.indexOf(prefix) === 0);
    os.spriteDraw = function (ctx, key, x, y, scale, swap, flip) {
        let c = os.sprite(key, swap); if (!c) return false;
        let s = scale || 1;
        ctx.imageSmoothingEnabled = false;
        if (flip) { ctx.save(); ctx.translate(Math.round(x) + c.width * s, Math.round(y)); ctx.scale(-1, 1); ctx.drawImage(c, 0, 0, c.width * s, c.height * s); ctx.restore(); }
        else ctx.drawImage(c, Math.round(x), Math.round(y), c.width * s, c.height * s);
        return true;
    };
    // sprites as <img> tags
    os.spriteURL = function (key, scale, swap) {
        let c = os.sprite(key, swap); if (!c) return '';
        let s = scale || 1, ck = key + '|' + s + '|' + (swap ? JSON.stringify(swap) : '');
        if (urls[ck]) return urls[ck];
        let big = document.createElement('canvas'); big.width = c.width * s; big.height = c.height * s;
        let x = big.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(c, 0, 0, big.width, big.height);
        return (urls[ck] = big.toDataURL());
    };
    os.spriteFlush = () => { for (let k in cache) delete cache[k]; for (let k in urls) delete urls[k]; themeSig = ''; };
})();
