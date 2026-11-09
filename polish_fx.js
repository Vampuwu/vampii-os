window.os = window.os || {};

(function () {
    const root = document.documentElement;
    const calm = () => root.classList.contains('reduce-motion') || root.classList.contains('low-spec');
    const $ = id => document.getElementById(id);
    const cssv = (k, fb) => getComputedStyle(root).getPropertyValue(k).trim() || fb;
    const db = () => (typeof database !== 'undefined' ? database : {});

    function dim(h, k) {
        let m = /^#([0-9a-f]{6})$/i.exec(h);
        if (!m) return h;
        let n = parseInt(m[1], 16);
        return 'rgb(' + [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => Math.round(v * k)).join(',') + ')';
    }

    // my little computer icon glitching out. same one as the 404 page
    function avatar(cv) {
        let x = cv.getContext('2d'), I = typeof appsDB !== 'undefined' && appsDB.icons, art = I && I.art && I.art['💻'], n = 0;
        if (!art) return;
        function draw() {
            if (!cv.isConnected) return;
            let p = cssv('--neon-primary', '#ff0099'), s = cssv('--neon-secondary', '#ff66b3');
            let pal = Object.assign({}, I.pal, { p, P: dim(p, 0.68), Q: dim(p, 0.42), s, S: dim(s, 0.68), T: dim(s, 0.42) });
            let rows = art.split('|'), N = rows.length, sc = Math.floor(cv.width / N), off = (cv.width - N * sc) / 2, still = calm();
            x.clearRect(0, 0, cv.width, cv.height);
            rows.forEach((row, y) => {
                let shift = !still && n % 9 === 0 && y % 6 === 2 ? 2 : 0;
                for (let i = 0; i < N; i++) {
                    let ch = row[i], col = pal[ch];
                    if (!col) continue;
                    if (!still && (ch === 'p' || ch === 'P' || ch === 'Q') && Math.random() < 0.18) col = Math.random() < 0.5 ? '#ffffff' : s;
                    x.fillStyle = col; x.fillRect(off + (i + shift) * sc, off + y * sc, sc, sc);
                }
            });
            n++;
            setTimeout(draw, still ? 2000 : 120);
        }
        draw();
    }

    function infoHead(win) {
        let body = win && win.querySelector('.window-body');
        if (!body || body.querySelector('.pf-head')) return;
        let d = db(), count = k => (d[k] || []).length;
        // shortcuts under my intro
        let links = [['music', '♪', T('linkMusic', 'MUSIC'), count('music')], ['blog', '日', T('linkBlog', 'BLOG'), count('blog')], ['books.exe', '本', T('linkBooks', 'BOOKS'), count('books')]];
        let head = document.createElement('div');
        head.className = 'pf-head readable-ui';
        head.innerHTML = '<div class="pf-av"><canvas width="96" height="96" aria-hidden="true"></canvas></div>'
            + '<div class="pf-stick"><div class="pf-id"><div class="pf-band"><b></b><small></small></div><div class="pf-name"></div><div class="pf-jp"></div></div><i class="pf-curl" aria-hidden="true"></i></div>';
        head.querySelector('.pf-band b').textContent = T('profileHello', 'はじめまして');
        head.querySelector('.pf-band small').textContent = T('profileHelloEn', 'HELLO my name is');
        head.querySelector('.pf-name').textContent = T('profileName', 'Vampii / Milivia');
        head.querySelector('.pf-jp').textContent = T('profileSub', '');
        body.insertBefore(head, body.firstChild);
        let row = document.createElement('div');
        row.className = 'pf-links readable-ui';
        links.forEach(l => {
            let b = document.createElement('button');
            b.className = 'pf-link';
            b.innerHTML = '<b></b><span></span><i></i>';
            b.children[0].textContent = l[1]; b.children[0].className = 'pf-ic'; b.children[1].textContent = l[2];
            b.onclick = () => { if (typeof os.clickAudio === 'function') os.clickAudio(); os.summon(l[0]); };
            row.appendChild(b);
        });
        body.appendChild(row);
        avatar(head.querySelector('canvas'));
    }

    function themeMarks() {
        let t = 'pink';
        try { t = localStorage.getItem('vmp_theme') || 'pink'; } catch (e) {}
        document.querySelectorAll('.theme-btn').forEach(b => {
            let m = /setTheme\('(\w+)'\)/.exec(b.getAttribute('onclick') || '');
            b.classList.toggle('on', !!m && m[1] === t);
            if (m && !b.dataset.name) b.dataset.name = (b.getAttribute('title') || m[1]).toUpperCase();
        });
    }
    // my colours
    function customUI() {
        let box = document.querySelector('#win-settings .theme-picker-box');
        if (!box || box.querySelector('.theme-btn.custom')) return;
        let c = Object.assign({ a: '#ff0099', b: '#00f0ff' }, os.prefs.custom || {});
        let sw = document.createElement('button');
        sw.className = 'theme-btn custom'; sw.setAttribute('onclick', "os.setTheme('custom'); os.clickAudio();");
        sw.title = T('customName', 'CUSTOM'); sw.setAttribute('aria-label', sw.title + ' theme');
        const paint = () => { sw.style.background = 'linear-gradient(135deg, ' + c.a + ' 50%, ' + c.b + ' 50%)'; sw.style.color = c.a; };
        paint(); box.appendChild(sw);
        let row = document.createElement('div'); row.className = 'custom-row readable-ui';
        let raf = 0;
        [['a', T('customMain', 'MAIN')], ['b', T('customSub', '2ND')]].forEach(([k, lab]) => {
            let l = document.createElement('label'), i = document.createElement('input');
            i.type = 'color'; i.value = c[k];
            i.oninput = () => { c[k] = i.value; paint(); cancelAnimationFrame(raf); raf = requestAnimationFrame(() => os.setCustom(c.a, c.b)); };
            l.appendChild(i); l.appendChild(document.createTextNode(lab)); row.appendChild(l);
        });
        box.parentNode.insertBefore(row, box.nextSibling);
        themeMarks();
    }
    const baseTheme = os.setTheme;
    if (typeof baseTheme === 'function') os.setTheme = function () { let r = baseTheme.apply(os, arguments); themeMarks(); setTimeout(walls, 50); setTimeout(allIcons, 120); return r; };

    function walls() {
        let box = $('wall-picker');
        if (!box) return;
        let fx = os.deskFx;
        if (!fx || !fx.kinds) { let w = $('wall-box'); if (w) w.style.display = 'none'; return; }
        let cur = (os.prefs && os.prefs.wall) || 'city';
        if (!box.children.length) {
            Object.keys(fx.kinds).forEach(k => {
                let K = fx.kinds[k], b = document.createElement('button');
                b.className = 'wall-card'; b.dataset.k = k; b.setAttribute('role', 'radio');
                b.innerHTML = '<span class="wall-img"><img alt=""></span><b></b><small></small>';
                b.querySelector('b').textContent = K.en; b.querySelector('small').textContent = K.jp;
                b.onclick = () => {
                    if (typeof os.clickAudio === 'function') os.clickAudio();
                    os.prefs.wall = k; os.prefs.shaderbg = true; os.savePrefs();
                    fx.apply(); walls();
                    document.querySelectorAll('#ui-prefs [data-pref="shaderbg"]').forEach(x => { x.setAttribute('aria-pressed', 'true'); x.textContent = '[ 動く壁紙 / LIVE WALLPAPER: ON ]'; });
                };
                box.appendChild(b);
            });
        }
        let ks = [...box.children];
        ks.forEach(b => { let on = b.dataset.k === cur; b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
        let i = 0;
        const next = () => {
            if (i >= ks.length || !box.isConnected) return;
            let b = ks[i++], img = b.querySelector('img');
            Promise.resolve(fx.thumb(b.dataset.k, 240, 150)).then(url => { if (url && img.src !== url) img.src = url; setTimeout(next, 30); });
        };
        setTimeout(next, 60);
    }
    os.wallPicker = walls;

    // the app's own little pixel icon in its title bar, nicked off the desktop icon
    function titleIcon(id) {
        let w = $('win-' + id), sp = w && w.querySelector('.window-header > span:first-child');
        if (!sp) return;
        let ic = [...document.querySelectorAll('.desktop-icons .icon-wrap')].find(i => (i.getAttribute('onclick') || '').includes("summon('" + id + "')"));
        let bg = ic && ic.querySelector('.icon-emoji') && ic.querySelector('.icon-emoji').style.backgroundImage;
        if (!bg) return;
        let el = sp.querySelector('.win-ic');
        if (!el) { el = document.createElement('i'); el.className = 'win-ic'; el.setAttribute('aria-hidden', 'true'); sp.insertBefore(el, sp.firstChild); w.classList.add('has-ic'); }
        el.style.backgroundImage = bg;
        // the tv was sitting too low and it was driving me insane
        let src = /url\(["']?(.*?)["']?\)/.exec(bg), im = new Image();
        if (!src) return;
        im.onload = () => {
            let c = document.createElement('canvas'), x; c.width = im.width; c.height = im.height;
            x = c.getContext('2d'); x.drawImage(im, 0, 0);
            let d = x.getImageData(0, 0, c.width, c.height).data, top = -1, bot = -1;
            for (let y = 0; y < c.height; y++) for (let k = 0; k < c.width; k++) if (d[(y * c.width + k) * 4 + 3] > 20) { if (top < 0) top = y; bot = y; }
            if (top < 0) return;
            let off = (c.height / 2 - (top + bot + 1) / 2) * (el.offsetHeight || 20) / c.height;
            el.style.translate = '0 ' + off.toFixed(2) + 'px';
        };
        im.src = src[1];
    }
    const allIcons = () => document.querySelectorAll('#desktop > div[id^="win-"]').forEach(w => titleIcon(w.id.slice(4)));

    const baseSummon = os.summon;
    os.summon = function (id) {
        let r = baseSummon.apply(os, arguments);
        if (id === 'info') infoHead($('win-info'));
        if (id === 'settings') { customUI(); themeMarks(); walls(); }
        setTimeout(() => titleIcon(id), 0);
        return r;
    };

    document.addEventListener('error', e => {
        let img = e.target;
        if (!img || img.tagName !== 'IMG' || !img.closest('.post-card') || img.classList.contains('track-cover')) return;
        let box = document.createElement('div');
        box.className = 'img-missing';
        box.innerHTML = '<b></b><span></span>'; box.firstChild.textContent = T('imageMissing', 'IMAGE OFFLINE');
        box.lastChild.textContent = img.alt || '';
        img.replaceWith(box);
    }, true);


    // the menu is an old start menu now
    const MENU_IC = [['ctx-paint', '🎨'], ['情報', '💻'], ['ブログ', '📝'], ['設定', '⚙'], ['整列', '📁'], ['再起動', '↻']];
    function menuDress() {
        let m = $('custom-context-menu');
        if (!m) return;
        if (!m.querySelector('.mn-side')) {
            let h = document.createElement('div');
            h.className = 'mn-side';
            h.setAttribute('aria-hidden', 'true');
            h.innerHTML = '<b></b><small></small>';
            h.querySelector('b').textContent = T('menuSide', 'VAMPII.OS');
            h.querySelector('small').textContent = T('menuSideJp', 'ヴァンピィ');
            m.insertBefore(h, m.firstChild);
            m.classList.add('mn9x');
        }
        m.querySelectorAll('.context-item').forEach(it => {
            if (it.querySelector('.mn-ic')) return;
            let hit = MENU_IC.find(k => it.id === k[0] || it.textContent.includes(k[0])), ic = document.createElement('i');
            ic.className = 'mn-ic';
            if (hit && hit[1].length > 1) ic.dataset.em = hit[1]; else ic.textContent = hit ? hit[1] : '·';
            it.insertBefore(ic, it.firstChild);
            if (hit && hit[0] === '再起動') it.classList.add('mn-sep');
            it.addEventListener('mouseenter', () => { if (os.sfx) os.sfx('hover'); });
        });
        let sep = m.querySelector('.mn-sep');
        if (sep && sep !== m.lastElementChild) m.appendChild(sep);
    }
    // every so often one of the desktop icons catches the light
    function glints() {
        setTimeout(glints, 6000 + Math.random() * 7000);
        if (document.hidden || root.classList.contains('reduce-motion') || root.classList.contains('low-spec')) return;
        let ics = [...document.querySelectorAll('#desktop .icon-wrap')].filter(i => i.offsetParent);
        let ic = ics[(Math.random() * ics.length) | 0];
        if (!ic) return;
        ic.classList.remove('glint'); void ic.offsetWidth; ic.classList.add('glint');
        setTimeout(() => ic.classList.remove('glint'), 1400);
    }
    document.addEventListener('contextmenu', () => {
        menuDress();
        let m = $('custom-context-menu');
        if (!m) return;
        m.classList.remove('pop'); void m.offsetWidth; m.classList.add('pop');
        if (os.sfx) os.sfx('menu');
    });

    // my own tooltips. the browser ones are tiny grey boxes from 1998
    let tip = null, tipEl = null, tipT = 0;
    function tipHide() {
        clearTimeout(tipT);
        if (tipEl && tipEl.dataset.tipT != null) { tipEl.setAttribute('title', tipEl.dataset.tipT); delete tipEl.dataset.tipT; }
        tipEl = null;
        if (tip) tip.classList.remove('on');
    }
    document.addEventListener('pointerover', e => {
        if (e.pointerType === 'touch') return;
        let el = e.target.closest && e.target.closest('[title]');
        if (!el || el === tipEl || el.tagName === 'IFRAME') return;
        tipHide();
        let t = el.getAttribute('title');
        if (!t || !t.trim()) return;
        tipEl = el; el.dataset.tipT = t; el.removeAttribute('title');
        tipT = setTimeout(() => {
            if (tipEl !== el || !el.isConnected) return;
            if (!tip) { tip = document.createElement('div'); tip.className = 'os-tip readable-ui'; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip); }
            tip.textContent = t;
            tip.classList.remove('on');
            let r = el.getBoundingClientRect();
            tip.style.left = '0px'; tip.style.top = '0px';
            let w = tip.offsetWidth, h = tip.offsetHeight;
            let x = Math.max(6, Math.min(innerWidth - w - 6, r.left + r.width / 2 - w / 2)), y = r.bottom + 8;
            if (y + h > innerHeight - 6) y = r.top - h - 8;
            tip.style.left = x + 'px'; tip.style.top = Math.max(6, y) + 'px';
            requestAnimationFrame(() => tip.classList.add('on'));
        }, 380);
    });
    document.addEventListener('pointerout', e => { if (tipEl && (!e.relatedTarget || !tipEl.contains(e.relatedTarget))) tipHide(); });
    document.addEventListener('pointerdown', tipHide, true);
    document.addEventListener('wheel', tipHide, { passive: true, capture: true });

    let sel = null;
    document.addEventListener('pointerdown', e => {
        if (e.button !== 0 || e.pointerType === 'touch' || !e.target.closest('#desktop') || e.target.closest('div[id^="win-"], .icon-wrap, button, a, input, textarea, select, .system-hud, #win-dock')) return;
        document.querySelectorAll('.icon-wrap.picked').forEach(i => i.classList.remove('picked'));
        sel = { x: e.clientX, y: e.clientY, box: null };
    });
    document.addEventListener('pointermove', e => {
        if (!sel) return;
        let x0 = Math.min(sel.x, e.clientX), y0 = Math.min(sel.y, e.clientY), x1 = Math.max(sel.x, e.clientX), y1 = Math.max(sel.y, e.clientY);
        if (!sel.box) { if (x1 - x0 < 6 && y1 - y0 < 6) return; sel.box = document.createElement('div'); sel.box.className = 'desk-sel'; document.body.appendChild(sel.box); }
        Object.assign(sel.box.style, { left: x0 + 'px', top: y0 + 'px', width: (x1 - x0) + 'px', height: (y1 - y0) + 'px' });
        document.querySelectorAll('.desktop-icons .icon-wrap, #icon-free .icon-wrap').forEach(i => {
            let r = i.getBoundingClientRect();
            i.classList.toggle('picked', r.right > x0 && r.left < x1 && r.bottom > y0 && r.top < y1);
        });
    }, { passive: true });
    document.addEventListener('pointerup', () => { if (sel && sel.box) sel.box.remove(); sel = null; });

    // . = nothing, a = main colour, b = 2nd colour, c = the text colour
    const TB = {
        sndOn: ['....c.......', '...cc...b...', '..ccc.b..b..', 'cccccc.b..b.', 'cccccc.b..b.', 'cccccc.b..b.', 'cccccc.b..b.', '..ccc.b..b..', '...cc...b...', '....c.......'],
        sndOff: ['....c.......', '...cc.......', '..ccc.......', 'cccccc.c...c', 'cccccc..c.c.', 'cccccc...c..', 'cccccc..c.c.', '..ccc..c...c', '...cc.......', '....c.......'],
        theme: ['.....aa.....', '....aaab....', '...aaaabb...', '..aaaaabbb..', '.aaaaaabbbb.', 'aaaaaaabbbbb', '.aaaaaabbbb.', '..aaaaabbb..', '...aaaabb...', '....aaab....', '.....ab.....'],
        prev: ['c.....c', 'c....cc', 'c...ccc', 'c..cccc', 'c...ccc', 'c....cc', 'c.....c'],
        next: ['c.....c', 'cc....c', 'ccc...c', 'cccc..c', 'ccc...c', 'cc....c', 'c.....c'],
        play: ['cc.....', 'cccc...', 'cccccc.', 'ccccccc', 'cccccc.', 'cccc...', 'cc.....'],
        pause: ['cc...cc', 'cc...cc', 'cc...cc', 'cc...cc', 'cc...cc', 'cc...cc', 'cc...cc'],
        cfg: ['......eed......', '......ecd......', '..eed.ecd.eed..', '..ecceccceccd..', '..dccceeecccd..', '...eceaaaecd...', 'eeecea...adceed', 'ecccea...adcccd', 'dddcea...adcddd', '...eceaaadcd...', '..ecccdddcccd..', '..eccdcccdccd..', '..ddd.ecd.ddd..', '......ecd......', '......ddd......']
    };
    function px(rows) {
        let w = rows[0].length, h = rows.length, r = '';
        rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') r += '<rect x="' + x + '" y="' + y + '" width="1" height="1" class="tp-' + ch + '"/>'; }));
        return '<svg class="tb-px" viewBox="0 0 ' + w + ' ' + h + '" width="' + w * 1.5 + '" height="' + h * 1.5 + '" shape-rendering="crispEdges" aria-hidden="true">' + r + '</svg>';
    }
    function tray() {
        let nav = document.querySelector('.top-nav');
        if (!nav || nav.querySelector('.tb-tray')) return;
        let start = document.createElement('button');
        start.className = 'tb-start'; start.setAttribute('aria-label', 'menu'); start.title = 'メニュー // menu';
        start.innerHTML = '<i></i><i></i><i></i><i></i>';
        start.onclick = e => {
            e.stopPropagation();
            let r = start.getBoundingClientRect();
            document.dispatchEvent(new MouseEvent('contextmenu', { clientX: r.left, clientY: r.bottom + 6, bubbles: true, cancelable: true }));
        };
        nav.insertBefore(start, nav.firstChild);
        let clock = $('sys-clock');
        if (clock) {
            let d = document.createElement('span'); d.className = 'tb-date'; d.setAttribute('aria-hidden', 'true');
            clock.parentNode.insertBefore(d, clock);
            const day = () => { let n = new Date(); d.textContent = String(n.getDate()).padStart(2, '0') + '.' + String(n.getMonth() + 1).padStart(2, '0') + ' ' + '日月火水木金土'[n.getDay()]; };
            day(); setInterval(day, 60000);
        }
        let t = document.createElement('div');
        t.className = 'tb-tray readable-ui';
        t.innerHTML = '<span class="tb-mp" hidden><button class="tb-mpb" data-mp="prev" title="前 // prev">' + px(TB.prev) + '</button><button class="tb-mpb" data-mp="play" title="再生 / 一時停止 // play / pause">' + px(TB.play) + '</button><button class="tb-mpb" data-mp="next" title="次 // next">' + px(TB.next) + '</button>'
            + '<button class="tb-np" title="音楽 // music"><b>♪</b><span><em></em></span></button></span>'
            + '<span class="tb-sep"></span>'
            + '<span class="tb-net" title="NET"><i></i><i></i><i></i><i></i></span>'
            + '<span class="tb-cpu" title="CPU"><canvas width="44" height="16"></canvas><small>0%</small></span>'
            + '<span class="tb-sep"></span>'
            + '<button class="tb-snd" title="操作音 // ui sound"></button>'
            + '<button class="tb-theme" title="色 // colour">' + px(TB.theme) + '</button>'
            + '<button class="tb-cfg" title="設定 // config">' + px(TB.cfg) + '</button>';
        nav.appendChild(t);
        let np = t.querySelector('.tb-np'), snd = t.querySelector('.tb-snd'), cv = t.querySelector('canvas'), pct = t.querySelector('.tb-cpu small'), bars = t.querySelectorAll('.tb-net i');
        np.onclick = () => { if (os.sfx) os.sfx('tray', { el: np }); os.summon('music'); };
        let mp = t.querySelector('.tb-mp'), mpPlay = t.querySelector('[data-mp="play"]'), mpWas = '';
        mp.addEventListener('click', e => { let b = e.target.closest('[data-mp]'); if (!b || !os.deckCtl) return; if (os.sfx) os.sfx('tray', { el: b }); os.deckCtl[b.dataset.mp === 'play' ? 'toggle' : b.dataset.mp](); mini(); });
        const mini = () => {
            let d = os.deckCtl && os.deckCtl.get(), on = !!(d && d.open && d.cur && ['play', 'pause', 'load'].includes(d.st));
            mp.hidden = !on; if (!on) { mpWas = ''; return; }
            let k = d.st + '|' + d.idx;
            if (k === mpWas) return; mpWas = k;
            mpPlay.innerHTML = px(d.st === 'play' || d.st === 'load' ? TB.pause : TB.play);
            mp.classList.toggle('paused', d.st === 'pause');
            let em = np.querySelector('em'), title = (d.cur.title || '???') + (d.cur.artist ? ' - ' + d.cur.artist : '');
            if (em.textContent !== title) em.textContent = title;
        };
        document.addEventListener('vmp-deck', mini);
        // play the off sound BEFORE turning sound off, otherwise you never hear it
        snd.onclick = () => { let was = !os.prefs || os.prefs.sound !== false; if (was && os.sfx) os.sfx('off', { el: snd }); if (typeof os.togglePref === 'function') os.togglePref('sound'); paintSnd(); if (!was && os.sfx) os.sfx('on', { el: snd }); };
        const paintSnd = () => { let on = !os.prefs || os.prefs.sound !== false; snd.innerHTML = px(on ? TB.sndOn : TB.sndOff); snd.classList.toggle('off', !on); };
        paintSnd();
        t.querySelector('.tb-cfg').onclick = e => { if (os.sfx) os.sfx('tray', { el: e.currentTarget }); os.summon('settings'); };
        t.querySelector('.tb-theme').onclick = () => {
            let order = ['pink', 'blue', 'purple', 'red', 'yellow'].concat(os.prefs && os.prefs.custom ? ['custom'] : []), cur = 'pink';
            try { cur = localStorage.getItem('vmp_theme') || 'pink'; } catch (e) {}
            os.setTheme(order[(order.indexOf(cur) + 1) % order.length]);
            if (os.sfx) os.sfx('theme');
        };
        let hist = new Array(22).fill(0), act = 0;
        ['pointerdown', 'keydown', 'wheel'].forEach(ev => document.addEventListener(ev, () => { act = Math.min(1, act + 0.25); }, { passive: true }));
        setInterval(() => {
            let c = parseFloat(($('cpu-load') || {}).textContent) || 0;
            hist.push(c); hist.shift();
            pct.textContent = Math.round(c) + '%';
            let x = cv.getContext('2d'), P = cssv('--neon-primary', '#ff0099');
            x.clearRect(0, 0, 44, 16);
            hist.forEach((v, i) => { let h = Math.max(1, Math.min(16, v / 100 * 16)); x.globalAlpha = 0.35 + 0.65 * (i / hist.length); x.fillStyle = P; x.fillRect(i * 2, 16 - h, 1.4, h); });
            act *= 0.7;
            let lvl = 2 + Math.round(act * 2 + Math.random() * 0.8);
            bars.forEach((b, i) => b.classList.toggle('on', i < lvl));
            mini();
            paintSnd();
        }, 700);
    }

    function titleDress() {
        let t = document.querySelector('.top-nav .os-title');
        if (!t || t.dataset.dressed) return;
        t.dataset.dressed = '1';
        let parts = t.textContent.split('//').map(x => x.trim()).filter(Boolean);
        t.textContent = '';
        parts.forEach((x, i) => {
            if (i) { let d = document.createElement('i'); d.textContent = '//'; t.appendChild(d); }
            let sp = document.createElement('span'); sp.className = 'ot' + Math.min(i, 2);
            if (i === 0) { let m = /^(>?\s*)(\S+)\s*(.*)$/.exec(x); if (m) { sp.innerHTML = '<em></em><b></b><small></small>'; sp.querySelector('em').textContent = m[1].trim(); sp.querySelector('b').textContent = m[2]; sp.querySelector('small').textContent = m[3]; } else sp.textContent = x; }
            else sp.textContent = x;
            t.appendChild(sp);
        });
        let d = document.createElement('i'); d.textContent = '//'; t.appendChild(d);
    }
    function start() { titleDress(); menuDress(); themeMarks(); tray(); if (os.paintNewDots) os.paintNewDots(); setTimeout(allIcons, 300); setTimeout(glints, 5000); if ($('win-info')) infoHead($('win-info')); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
