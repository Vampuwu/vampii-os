
window.os = window.os || {};

(function () {
    const ICONS = () => (typeof appsDB !== 'undefined' && appsDB.icons) || { pal: {}, art: {}, img: {}, themes: {} };
    const themeKey = () => { try { return localStorage.getItem('vmp_theme') || 'pink'; } catch (e) { return 'pink'; } };
    const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    let cache = {}, lastKey = '';
    // canvas trick to turn any css colour into a hex code
    const hex = c => { let x = document.createElement('canvas').getContext('2d'); x.fillStyle = c; let v = x.fillStyle; if (v[0] === '#') return v; let m = /(\d+),\s*(\d+),\s*(\d+)/.exec(v) || [0, 255, 0, 153]; return '#' + [m[1], m[2], m[3]].map(n => (+n).toString(16).padStart(2, '0')).join(''); };
    const dim = (h, k) => { let n = parseInt(h.slice(1), 16); return 'rgb(' + [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => Math.round(v * k)).join(',') + ')'; };

    function url(em, sc) {
        sc = sc || 2;
        let I = ICONS(), k = String(em || '').replace(/️/g, '').trim(), th = (I.themes || {})[themeKey()] || {}, ck = k + sc;
        if (cache[ck] !== undefined) return cache[ck];
        let pic = (th.img || {})[k] || (I.img || {})[k];
        if (pic) return (cache[ck] = { pic: String(pic) });
        let art = (th.art || {})[k] || (I.art || {})[k];
        if (!art) return (cache[ck] = null);
        let p = hex(css('--neon-primary') || '#ff0099'), s = hex(css('--neon-secondary') || '#ff66b3');
        let pal = Object.assign({}, I.pal || {}, th.pal || {}, { p, P: dim(p, 0.68), Q: dim(p, 0.42), s, S: dim(s, 0.68), T: dim(s, 0.42) });
        let rows = String(art).split('|'), n = rows.length;
        let cv = document.createElement('canvas'); cv.width = cv.height = n * sc;
        let x = cv.getContext('2d');
        rows.forEach((row, y) => { for (let i = 0; i < n; i++) { let ch = row[i]; if (pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i * sc, y * sc, sc, sc); } } });
        return (cache[ck] = cv.toDataURL());
    }

    function paint(el) {
        let dock = el.classList.contains('dock-ic'), u = url(el.dataset.em || el.textContent, dock ? 1 : 2);
        if (!dock) el.style.setProperty('--d', -((el.dataset.em || el.textContent).codePointAt(0) % 97) / 9.3 + 's');
        if (!el.dataset.em) el.dataset.em = el.textContent;
        if (u) { el.classList.add('pix'); el.classList.toggle('pimg', !!u.pic); el.style.backgroundImage = 'url("' + String(u.pic || u).replace(/"/g, '') + '")'; el.style.setProperty('--ic-mask', el.style.backgroundImage); }
        else { el.classList.remove('pix', 'pimg'); el.style.backgroundImage = ''; }
    }
    const SEL = '.icon-emoji, .dock-ic, .pf-ic, .pt-ti, .pt-bi, .gg-ic, .mn-ic, .fx-ic';
    const all = () => document.querySelectorAll(SEL).forEach(paint);

    let st = document.createElement('style');
    st.textContent = `
        .icon-emoji.pix { font-size: 0 !important; width: 32px; height: 32px; margin-left: auto; margin-right: auto; background-repeat: no-repeat; background-position: center; background-size: 32px 32px; image-rendering: pixelated; }
        .dock-ic.pix { font-size: 0 !important; display: inline-block; width: 18px; height: 18px; vertical-align: middle; background: no-repeat center / 18px 18px; image-rendering: auto; }
        .pix.pimg { image-rendering: auto; background-size: contain !important; }
    `;
    document.head.appendChild(st);

    const go = () => { all(); lastKey = css('--neon-primary') + css('--neon-secondary'); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.nodeType !== 1) return;
        if (n.matches(SEL)) paint(n); else if (n.querySelector) n.querySelectorAll(SEL).forEach(paint);
    }))).observe(document.documentElement, { childList: true, subtree: true });
    let t = 0;
    new MutationObserver(() => { clearTimeout(t); t = setTimeout(() => { let k = css('--neon-primary') + css('--neon-secondary'); if (k !== lastKey) { lastKey = k; cache = {}; all(); } }, 120); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    os.pixIcon = url;
})();
