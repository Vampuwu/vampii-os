window.os = window.os || {};

(function () {
    const $ = id => document.getElementById(id);
    const T = (k, d) => (typeof siteText !== 'undefined' && siteText[k]) || d;
    const p2 = n => String(n).padStart(2, '0');
    const still = () => document.documentElement.classList.contains('reduce-motion');
    const lite = () => document.documentElement.classList.contains('low-spec');

    // click the clock. moon on every day + a dot when i posted something
    const age = t => { let d = (t - Date.UTC(2000, 0, 6, 18, 14)) / 86400000 / 29.530588853; return d - Math.floor(d); };
    const moonPx = a => { let lit = (1 - Math.cos(a * Math.PI * 2)) / 2, wax = a < 0.5; return `<i class="cl-moon" style="--lit:${lit.toFixed(2)}; --side:${wax ? 1 : -1}"></i>`; };
    function postDates() {
        let out = {}, db = typeof database !== 'undefined' ? database : {};
        const add = (d, k, label, go) => { d = String(d || '').slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return; (out[d] = out[d] || []).push({ k, label, go }); };
        (db.blog || []).forEach(p => add(p.date, 'blog', p.title, () => os.summon('blog')));
        (db.music || []).forEach(p => add(p.date, 'music', p.title, () => os.summon('music')));
        (db.gallery || []).filter(g => !g.hidden).forEach(g => add(g.date, 'gallery', g.title, () => { os.galleryWant = String(g.img || g.id); os.summon('gallery.exe'); if (os.galleryOpen) os.galleryOpen(os.galleryWant); }));
        (db.books || []).forEach(b => (b.chapters || []).forEach(c => { if (!c.hidden) add(c.date, 'books', (b.title || '') + ' · ' + (c.title || ''), () => os.summon('books.exe')); }));
        return out;
    }
    let calAt = null;
    function calendar(force) {
        let pop = $('cl-pop');
        if (pop && !force) { pop.remove(); return; }
        if (!pop) { pop = document.createElement('div'); pop.id = 'cl-pop'; pop.className = 'cl-pop readable-ui'; document.body.appendChild(pop); }
        let now = new Date(), d = calAt || new Date(now.getFullYear(), now.getMonth(), 1), y = d.getFullYear(), m = d.getMonth();
        let first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate(), posts = postDates();
        let cells = '';
        for (let i = 0; i < first; i++) cells += '<span class="cl-d pad"></span>';
        for (let n = 1; n <= days; n++) {
            let key = y + '-' + p2(m + 1) + '-' + p2(n), ps = posts[key] || [], today = n === now.getDate() && m === now.getMonth() && y === now.getFullYear();
            let full = Math.abs(age(Date.UTC(y, m, n, 12)) - 0.5) < 0.017;
            cells += `<button class="cl-d${today ? ' today' : ''}${ps.length ? ' has' : ''}${full ? ' full' : ''}" data-k="${key}" title="${ps.map(p => p.label).join(' / ').replace(/"/g, '&quot;')}">${moonPx(age(Date.UTC(y, m, n, 12)))}<b>${n}</b>${ps.map(p => `<em class="k-${p.k}"></em>`).join('')}</button>`;
        }
        let wk = T('calWeek', '日月火水木金土').split('');
        pop.innerHTML = `<div class="cl-h"><button data-m="-1" aria-label="last month">‹</button><b>${y}年${m + 1}月</b><small>${['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'][m]}</small><button data-m="1" aria-label="next month">›</button></div>`
            + `<div class="cl-g">${wk.map((w, i) => `<span class="cl-w${i === 0 ? ' sun' : i === 6 ? ' sat' : ''}">${w}</span>`).join('')}${cells}</div>`
            + `<p class="cl-f"><em class="k-blog"></em>${T('calBlog', '日記')} <em class="k-music"></em>${T('calMusic', '音楽')} <em class="k-gallery"></em>${T('calArt', '絵')} <em class="k-books"></em>${T('calBooks', '本')}</p>`;
        let c = $('sys-clock'); if (c) { let r = c.getBoundingClientRect(); pop.style.top = (r.bottom + 8) + 'px'; pop.style.left = Math.max(8, Math.min(innerWidth - 280, r.left - 60)) + 'px'; }
        pop.querySelectorAll('[data-m]').forEach(b => b.onclick = e => { e.stopPropagation(); calAt = new Date(y, m + +b.dataset.m, 1); if (os.sfx) os.sfx('tick'); calendar(true); });
        pop.querySelectorAll('.cl-d.has').forEach(b => b.onclick = () => { let ps = posts[b.dataset.k] || []; if (ps[0]) { if (os.clickAudio) os.clickAudio(); ps[0].go(); pop.remove(); } });
    }
    // date gets out the way of the player + the clock
    function dodge(d, t) {
        const fit = () => { d.classList.remove('duck'); let c = $('sys-clock'); if (!c || getComputedStyle(c.parentNode).position !== 'absolute') return; if (d.getBoundingClientRect().left < c.getBoundingClientRect().right + 14) d.classList.add('duck'); };
        if (window.ResizeObserver) new ResizeObserver(fit).observe(t);
        addEventListener('resize', fit); fit();
    }
    function clock() {
        let c = $('sys-clock'); if (!c || c.dataset.cal) return;
        if (!c.parentNode.classList.contains('tb-mid')) {
            let mid = document.createElement('span'); mid.className = 'tb-mid'; c.parentNode.insertBefore(mid, c); mid.appendChild(c);
            let n = 0, iv = setInterval(() => { let d = document.querySelector('.top-nav .tb-date'), t = document.querySelector('.top-nav .tb-tray'); if ((d && t) || ++n > 40) { clearInterval(iv); if (d && t) { t.parentNode.insertBefore(d, t); dodge(d, t); } } }, 100);
        }
        c.dataset.cal = '1'; c.title = T('calTitle', 'カレンダー // calendar'); c.style.cursor = 'inherit';
        c.addEventListener('click', e => { e.stopPropagation(); calAt = null; if (os.sfx) os.sfx('tray', { el: c }); calendar(); });
        document.addEventListener('pointerdown', e => { let p = $('cl-pop'); if (p && !p.contains(e.target) && e.target !== c && !c.contains(e.target)) p.remove(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('cl-pop')) $('cl-pop').remove(); });
    }


    function phoneBanner() {
        if (!os.isPhone || !os.isPhone() || $('mob-ban')) return;
        let b = document.createElement('div'); b.id = 'mob-ban'; b.className = 'readable-ui'; b.setAttribute('role', 'note');
        let txt = T('phoneBanner', 'now mobile unfriendly'), jp = T('phoneBannerJp', 'スマホ非対応中');
        b.innerHTML = '<div class="mb-track"><span class="mb-bat" aria-hidden="true"></span><span class="mb-t"></span><span class="mb-bat r" aria-hidden="true"></span></div>';
        let t = b.querySelector('.mb-t'); t.innerHTML = '<b></b><i></i>'; t.firstChild.textContent = txt; t.lastChild.textContent = jp;
        b.onclick = () => { b.classList.add('boop'); if (os.sfx) os.sfx('oops'); setTimeout(() => b.classList.remove('boop'), 600); };
        document.body.appendChild(b);
        document.documentElement.classList.add('mob-ban');
    }

    function css() {
        let s = document.createElement('style');
        s.textContent = `
            .system-hud dd { transition: text-shadow 0.4s; }
            .system-hud:hover dd { text-shadow: 1px 0 0 #000, -1px 0 0 #000, 0 1px 0 #000, 0 -1px 0 #000, 0 0 10px color-mix(in srgb, var(--neon-secondary) 45%, transparent); }
            #sys-clock:hover { text-shadow: 0 0 10px var(--neon-primary); }
            #sys-clock.fours { color: #fff; text-shadow: 0 0 12px var(--neon-primary), 0 0 2px #fff; }
            #hud-moon.poked { animation: hudPoke 0.5s; }
            @keyframes hudPoke { 25% { transform: rotate(-14deg) scale(0.9); } 60% { transform: rotate(9deg); } }
            .cl-pop { position: fixed; z-index: 99990; width: 268px; padding: 9px; background: rgba(10, 6, 14, 0.96); border: 1px solid color-mix(in srgb, var(--neon-primary) 55%, #000); box-shadow: 0 14px 30px rgba(0,0,0,0.6), 0 0 22px color-mix(in srgb, var(--neon-primary) 22%, transparent); font: 12px 'M PLUS 1 Code', monospace; color: #eee6f2; animation: clIn 0.18s ease-out; }
            @keyframes clIn { from { opacity: 0; transform: translateY(-4px); } }
            .cl-h { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
            .cl-h b { font: 14px 'DotGothic16', monospace; font-weight: normal; color: var(--neon-primary); }
            .cl-h small { flex: 1; opacity: 0.5; }
            .cl-h button, .cl-d { font: inherit; color: inherit; background: none; border: 0; cursor: inherit; }
            .cl-h button { width: 24px; height: 22px; border: 1px solid #3a2a40; }
            .cl-h button:hover { border-color: var(--neon-secondary); }
            .cl-g { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
            .cl-w { text-align: center; font-size: 10px; opacity: 0.55; padding-bottom: 2px; } .cl-w.sun { color: #ff6b81; } .cl-w.sat { color: #6bb6ff; }
            .cl-d { position: relative; display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 3px 0 4px; min-height: 34px; border: 1px solid transparent; }
            .cl-d b { font-weight: normal; font-size: 11px; opacity: 0.8; }
            .cl-d.today { border-color: var(--neon-primary); box-shadow: inset 0 0 10px color-mix(in srgb, var(--neon-primary) 30%, transparent); }
            .cl-d.today b { color: #fff; opacity: 1; }
            .cl-d.has:hover { background: color-mix(in srgb, var(--neon-primary) 18%, transparent); }
            .cl-d em { position: absolute; bottom: 1px; width: 4px; height: 4px; border-radius: 50%; }
            .cl-d em:nth-of-type(2) { margin-left: 10px; } .cl-d em:nth-of-type(3) { margin-left: -10px; }
            .k-blog { background: var(--neon-primary); } .k-music { background: var(--neon-secondary); } .k-gallery { background: #ffd04a; } .k-books { background: #6dffa0; }
            .cl-f { display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: center; margin: 7px 0 0; font-size: 10px; opacity: 0.7; }
            .cl-f em { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 3px; }
            /* each day gets its moon. lit side is a circle slid over a dark one */
            .cl-moon { position: relative; width: 9px; height: 9px; border-radius: 50%; background: #2a2433; overflow: hidden; }
            .cl-moon::after { content: ''; position: absolute; inset: 0; border-radius: 50%; background: #f3ecd8; transform: translateX(calc((1 - var(--lit)) * 100% * var(--side))); opacity: calc(0.25 + var(--lit) * 0.75); }
            .cl-d.full .cl-moon { box-shadow: 0 0 6px rgba(255, 245, 220, 0.8); }
            .desktop-icons .icon-wrap { position: relative; }
            .desktop-icons .icon-wrap::before { content: ''; position: absolute; left: 50%; top: 18px; width: 70px; height: 50px; margin-left: -35px; z-index: -1; pointer-events: none; border-radius: 50%; background: radial-gradient(closest-side, color-mix(in srgb, var(--neon-primary) 45%, transparent), transparent); opacity: 0; transform: scale(0.6); transition: opacity 0.2s, transform 0.25s; }
            .desktop-icons .icon-wrap:hover::before, .desktop-icons .icon-wrap:focus-visible::before { opacity: 1; transform: none; }
            #mob-ban { position: fixed; left: 0; right: 0; bottom: 0; z-index: 99980; height: 30px; overflow: hidden; pointer-events: auto; background: repeating-linear-gradient(-45deg, #ffd04a 0 10px, #1a1418 10px 20px); border-top: 2px solid #000; animation: mbIn 0.5s cubic-bezier(.3, 1.5, .5, 1) 0.4s both; }
            @keyframes mbIn { from { transform: translateY(100%); } }
            #dead-px { position: fixed; z-index: 2147483000; width: 5px; height: 5px; margin: -2px 0 0 -2px; pointer-events: auto; }
            #dead-px::after { content: ''; position: absolute; left: 2px; top: 2px; width: 1px; height: 1px; background: #000; }
            #dead-px.back::after { animation: pxBack 1.2s steps(1); }
            @keyframes pxBack { 0%, 20%, 34%, 60% { opacity: 0; } 15%, 30% { opacity: 1; } }
            #burn { position: fixed; inset: 0; z-index: -1; pointer-events: none; }
            #burn img { position: absolute; mix-blend-mode: screen; filter: saturate(0.55) blur(0.6px); }
            .dgs { animation: dgs 0.7s ease-out; }
            @keyframes dgs { 0% { transform: skewX(3deg) scale(1.012); filter: drop-shadow(3px 0 0 rgba(255,0,80,0.55)) drop-shadow(-3px 0 0 rgba(0,240,255,0.55)); } 25% { transform: skewX(-2deg); } 50% { transform: skewX(1deg); filter: drop-shadow(1px 0 0 rgba(255,0,80,0.3)) drop-shadow(-1px 0 0 rgba(0,240,255,0.3)); } 75% { transform: skewX(-0.5deg); } 100% { transform: none; filter: none; } }
            .mb-track { position: absolute; top: 3px; height: 24px; display: flex; align-items: center; gap: 6px; padding: 0 10px; white-space: nowrap; background: #0d0a10; border: 1px solid var(--neon-primary); border-radius: 12px; box-shadow: 0 0 10px color-mix(in srgb, var(--neon-primary) 50%, transparent); animation: mbWalk 11s ease-in-out infinite alternate; }
            @keyframes mbWalk { 0% { left: 2%; transform: rotate(-1.5deg); } 25% { transform: rotate(1.5deg) translateY(-1px); } 50% { transform: rotate(-1deg); } 75% { transform: rotate(2deg) translateY(1px); } 100% { left: calc(98% - 230px); transform: rotate(-1deg); } }
            .mb-t b { font: 12px 'DotGothic16', monospace; font-weight: normal; color: #fff; letter-spacing: 1px; }
            .mb-t i { margin-left: 6px; font-style: normal; font-size: 10px; color: var(--neon-secondary); }
            .mb-bat { width: 10px; height: 8px; background: var(--neon-primary); clip-path: polygon(50% 40%, 70% 0, 100% 30%, 80% 100%, 50% 70%, 20% 100%, 0 30%, 30% 0); animation: mbFlap 0.3s steps(2) infinite; }
            .mb-bat.r { animation-delay: -0.15s; }
            @keyframes mbFlap { 50% { transform: scaleY(0.4); } }
            #mob-ban.boop .mb-track { animation: mbBoop 0.6s; }
            @keyframes mbBoop { 30% { transform: scale(1.15) rotate(-4deg); } 60% { transform: scale(0.95) rotate(3deg); } }
            html.mob-ban .footer-bar { bottom: 30px !important; }
            html.reduce-motion .mb-track, html.reduce-motion .mb-bat { animation: none !important; }
            html.reduce-motion .mb-track { left: 10px; }
        `;
        document.head.appendChild(s);
    }

    // your very own dead pixel. same spot every visit. poke it and it comes back to life for a sec
    function deadPx() {
        let s = null; try { s = JSON.parse(localStorage.getItem('vmp_deadpx')); } catch (e) {}
        if (!Array.isArray(s)) { s = [0.08 + Math.random() * 0.84, 0.1 + Math.random() * 0.78]; try { localStorage.setItem('vmp_deadpx', JSON.stringify(s)); } catch (e) {} }
        let d = document.createElement('i'); d.id = 'dead-px'; d.setAttribute('aria-hidden', 'true');
        d.style.left = (s[0] * 100).toFixed(2) + 'vw'; d.style.top = (s[1] * 100).toFixed(2) + 'vh';
        d.addEventListener('pointerdown', e => { e.stopPropagation(); d.classList.remove('back'); void d.offsetWidth; d.classList.add('back'); });
        document.body.appendChild(d);
    }
    // screen burn. leave a window still for ages + it ghosts into the wallpaper
    function burnIn() {
        const KEY = 'vmp_burn', LIFE = 3 * 3600000, STILL = 20, OK = /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/;
        let ghosts = []; try { ghosts = (JSON.parse(localStorage.getItem(KEY) || '[]') || []).filter(g => g && OK.test(g.img)); } catch (e) {}
        let layer = document.createElement('div'); layer.id = 'burn'; layer.setAttribute('aria-hidden', 'true'); document.body.insertBefore(layer, document.body.firstChild);
        const draw = () => { let now = Date.now(); ghosts = ghosts.filter(g => now - g.at < LIFE); layer.innerHTML = ghosts.map(g => `<img alt="" src="${g.img}" style="left:${g.x}px;top:${g.y}px;width:${g.w}px;height:${g.h}px;opacity:${(0.16 * (1 - (now - g.at) / LIFE)).toFixed(3)}">`).join(''); };
        let seen = {}, fonts = {};
        const off = () => os.prefs && os.prefs.burnin === false;
        const asData = b => new Promise((ok, no) => { let r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(b); });
        const rw = t => t.replace(/:root\b/g, '.bx-root').replace(/(^|[\s,>+~(])html(?![\w-])/g, '$1.bx-root').replace(/(^|[\s,>+~(])body(?![\w-])/g, '$1.bx-body');
        const norm = v => String(v || '').replace(/["'\s]/g, '').toUpperCase().replace(/^NORMAL$/, '400').replace(/^BOLD$/, '700');
        let used = [];
        const face = async (r, base) => {
            let fam = norm(r.style.getPropertyValue('font-family')), ur = norm(r.style.getPropertyValue('unicode-range') || 'U+0-10FFFF'), wt = norm(r.style.getPropertyValue('font-weight') || '400');
            if (!used.some(f => norm(f.family) === fam && norm(f.unicodeRange) === ur && norm(f.weight) === wt)) return '';
            let m = /url\(\s*["']?([^"')]+)["']?\s*\)/.exec(r.style.getPropertyValue('src') || r.cssText); if (!m) return '';
            if (/^data:/.test(m[1])) return r.cssText;
            let u = new URL(m[1], base).href;
            try { fonts[u] = fonts[u] || await fetch(u).then(x => x.blob()).then(asData); } catch (e) { return ''; }
            return r.cssText.replace(m[0], `url("${fonts[u]}")`);
        };
        const rules = async (list, base, out) => {
            for (const r of list) {
                if (r instanceof CSSStyleRule) out.push(r.cssRules && r.cssRules.length ? rw(r.cssText) : rw(r.selectorText) + '{' + r.style.cssText + '}');
                else if (r instanceof CSSMediaRule) { if (matchMedia(r.media.mediaText).matches) await rules(r.cssRules, base, out); }
                else if (r instanceof CSSSupportsRule) { if (CSS.supports(r.conditionText)) await rules(r.cssRules, base, out); }
                else if (r instanceof CSSImportRule) { if (r.styleSheet) await rules(r.styleSheet.cssRules, r.styleSheet.href || base, out); }
                else if (r instanceof CSSFontFaceRule) out.push(face(r, base));
                else if (r.cssRules && !(r instanceof CSSKeyframesRule)) await rules(r.cssRules, base, out);
                else out.push(r.cssText);
            }
        };
        async function snap(w) {
            let b = w.getBoundingClientRect(), x0 = b.left, y0 = b.top, x1 = b.right, y1 = b.bottom;
            if (getComputedStyle(w).overflow === 'visible') w.querySelectorAll('*').forEach(el => { let r = el.getBoundingClientRect(); if (!r.width || !r.height) return; x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); });
            x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(innerWidth, Math.ceil(x1)); y1 = Math.min(innerHeight, Math.ceil(y1));
            let W = x1 - x0, H = y1 - y0, VW = innerWidth, VH = innerHeight; if (W < 16 || H < 16) return null;
            used = [...document.fonts].filter(f => f.status === 'loaded');
            let cl = w.cloneNode(true), src = [w, ...w.querySelectorAll('*')], dst = [cl, ...cl.querySelectorAll('*')];
            src.forEach((a, i) => {
                let c = dst[i], tag = a.tagName;
                if (tag === 'CANVAS' || tag === 'VIDEO' || tag === 'IFRAME') {
                    let im = document.createElement('img'), cs = getComputedStyle(a);
                    if (tag === 'CANVAS') { try { im.src = a.toDataURL(); } catch (e) {} }
                    else if (tag === 'VIDEO') { try { let k = document.createElement('canvas'); k.width = a.videoWidth; k.height = a.videoHeight; k.getContext('2d').drawImage(a, 0, 0); im.src = k.toDataURL('image/jpeg', 0.7); } catch (e) {} }
                    if (a.id) im.id = a.id; im.className = a.className;
                    im.style.cssText = a.style.cssText; im.style.width = a.offsetWidth + 'px'; im.style.height = a.offsetHeight + 'px'; im.style.display = cs.display === 'inline' ? 'inline-block' : cs.display;
                    if (tag === 'IFRAME') im.style.background = '#000';
                    c.replaceWith(im); return;
                }
                if (tag === 'SCRIPT') { c.remove(); return; }
                if (tag === 'IMG' && !/^data:/.test(a.currentSrc || a.src)) { try { let k = document.createElement('canvas'); k.width = a.naturalWidth; k.height = a.naturalHeight; k.getContext('2d').drawImage(a, 0, 0); c.src = k.toDataURL(); } catch (e) { c.removeAttribute('src'); c.removeAttribute('srcset'); c.style.visibility = 'hidden'; } }
                if (tag === 'INPUT') { c.setAttribute('value', a.value); if (a.checked) c.setAttribute('checked', ''); }
                if (tag === 'TEXTAREA') c.textContent = a.value;
                if (a.scrollTop || a.scrollLeft) [...c.children].forEach(k => { k.style.translate = `${-a.scrollLeft}px ${-a.scrollTop}px`; });
            });
            cl.classList.add('is-active'); cl.classList.remove('is-dragging', 'window-spawn');
            ['position:absolute', `left:${Math.round(b.left)}px`, `top:${Math.round(b.top)}px`, 'margin:0', 'transform:none', 'translate:none', 'rotate:none', 'scale:none', `width:${getComputedStyle(w).width}`, `height:${getComputedStyle(w).height}`].forEach(d => { let [k, v] = d.split(':'); cl.style.setProperty(k, v, 'important'); });
            const wrap = (cls, from, id) => { let d = document.createElement('div'); d.className = cls + ' ' + (from ? from.className : ''); if (id) d.id = id; if (from && from.getAttribute('style')) d.setAttribute('style', from.getAttribute('style')); ['position:absolute', 'left:0', 'top:0', 'right:auto', 'bottom:auto', `width:${VW}px`, `height:${VH}px`, 'margin:0', 'padding:0', 'overflow:hidden', 'background:none', 'transform:none', 'filter:none'].forEach(x => { let [k, v] = x.split(':'); d.style.setProperty(k, v, 'important'); }); return d; };
            let root = wrap('bx-root', document.documentElement), body = wrap('bx-body', document.body), desk = wrap('', $('desktop'), 'desktop');
            root.appendChild(body); body.appendChild(desk); desk.appendChild(cl);
            let out = [];
            for (const sh of document.styleSheets) { let list; try { list = sh.cssRules; } catch (e) { continue; } if (list && !sh.disabled) await rules(list, sh.href || location.href, out); }
            out = await Promise.all(out);
            out.push('*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}.bx-root::before,.bx-root::after,.bx-body::before,.bx-body::after,#desktop::before,#desktop::after{display:none!important}');
            let st = document.createElement('style'); st.textContent = out.join('\n'); root.insertBefore(st, root.firstChild);
            let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${VW}" height="${VH}"><foreignObject x="0" y="0" width="${VW}" height="${VH}">${new XMLSerializer().serializeToString(root)}</foreignObject></svg>`;
            let img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
            await img.decode();
            let k = Math.min(0.6, 640 / Math.max(W, H)), cv = document.createElement('canvas');
            cv.width = Math.max(1, Math.round(W * k)); cv.height = Math.max(1, Math.round(H * k));
            let g = cv.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, x0, y0, W, H, 0, 0, cv.width, cv.height);
            let u = cv.toDataURL('image/webp', 0.6); if (!/^data:image\/webp/.test(u)) u = cv.toDataURL('image/jpeg', 0.6);
            return { x: x0, y: y0, w: W, h: H, img: u };
        }
        os.burn = {
            clear() { ghosts = []; try { localStorage.removeItem(KEY); } catch (e) {} draw(); },
            apply() { layer.hidden = off(); }
        };
        os.burn.apply();
        setInterval(() => {
            if (document.hidden || off()) return;
            document.querySelectorAll('#desktop > [id^="win-"]:not(.is-min)').forEach(w => {
                if (!w.offsetParent) return;
                let r = w.getBoundingClientRect(), sig = [r.left, r.top, r.width, r.height].map(Math.round).join(','), s = seen[w.id];
                if (!s || s.sig !== sig) { seen[w.id] = { sig, n: 0 }; return; }
                if (++s.n === STILL) snap(w).then(g => {
                    if (!g || off()) return;
                    g.at = Date.now(); ghosts.push(g); ghosts = ghosts.slice(-6);
                    for (;;) { try { localStorage.setItem(KEY, JSON.stringify(ghosts)); break; } catch (e) { if (!ghosts.length) break; ghosts.shift(); } }
                    draw();
                }).catch(() => {});
            });
            draw();
        }, 60000);
        draw();
    }

    // pointless stuff
    function bits() {
        deadPx(); burnIn();
        let mn = $('hud-moon');
        if (mn) { mn.style.cursor = 'inherit'; mn.addEventListener('click', () => { mn.classList.remove('poked'); void mn.offsetWidth; mn.classList.add('poked'); if (os.sfx) os.sfx('tick', { el: mn }); }); }
        let was = '';
        setInterval(() => { let d = new Date(), k = d.getHours() % 12 + ':' + p2(d.getMinutes()); if (k === '4:44' && was !== k) { let c = $('sys-clock'); if (c) { c.classList.add('fours'); setTimeout(() => c.classList.remove('fours'), 60000); } } was = k; }, 15000);
        if (mn && os.moon) { const lit = () => { let m = os.moon(); mn.title = Math.round(m.lit * 100) + '%'; }; lit(); setInterval(lit, 300000); }
        let cm = $('custom-context-menu');
        if (cm && !cm.querySelector('[data-x="files"]')) {
            [['files', T('ctxFiles', '[ ファイル / FILES ]'), '🗂'], ['gallery.exe', T('ctxGallery', '[ 絵 / GALLERY ]'), '📺']].forEach(([id, label, em]) => {
                let it = document.createElement('div'); it.className = 'context-item'; it.dataset.x = id; it.setAttribute('role', 'menuitem'); it.tabIndex = 0; it.textContent = label;
                let ic = document.createElement('i'); ic.className = 'mn-ic'; ic.dataset.em = em; it.insertBefore(ic, it.firstChild);
                it.addEventListener('mouseenter', () => { if (os.sfx) os.sfx('hover'); });
                it.onclick = () => { os.summon(id); if (os.clickAudio) os.clickAudio(); };
                it.onkeydown = e => { if (e.key === 'Enter') it.click(); };
                let rel = [...cm.children].find(c => /再起動|RELOAD/.test(c.textContent)); cm.insertBefore(it, rel || null);
            });
        }
    }
    // why
    function wave() {
        let tag = document.querySelector('.serial-tag');
        if (!tag || tag.querySelector('.wv')) return;
        tag.innerHTML = '<canvas class="wv" width="92" height="28"></canvas><span></span>';
        tag.querySelector('span').textContent = T('serialTag', '4-444 · 自作 // homemade');
        let c = tag.querySelector('canvas'), x = c.getContext('2d'), W = 46, H = 14, t = 0;
        x.scale(2, 2); x.lineJoin = 'round'; x.lineCap = 'round';
        const col = () => getComputedStyle(document.documentElement).getPropertyValue('--neon-secondary').trim() || '#ff0099';
        function draw() {
            x.clearRect(0, 0, W, H); x.strokeStyle = col(); x.lineWidth = 1; x.beginPath();
            for (let i = 0; i <= W; i += 0.5) {
                let k = i / W, env = Math.pow(Math.sin(Math.PI * k), 0.9);
                let a = env * (0.35 + 0.65 * Math.abs(Math.sin(i * 0.19 - t * 0.8) * Math.sin(i * 0.07 + t * 0.35))) * 5.5;
                let y = H / 2 + a * Math.sin(i * 2.2 + t * 2.6);
                if (i) x.lineTo(i, y); else x.moveTo(i, y);
            }
            x.stroke();
        }
        function loop() {
            if (!document.hidden) { t += document.querySelector('.np-deck[data-st="play"]') ? 0.22 : 0.09; draw(); }
            setTimeout(loop, 50);
        }
        if (document.documentElement.classList.contains('reduce-motion')) draw(); else loop();
    }
    function go() {
        css(); clock(); bits(); wave();
        // someone sent a song link. open noisebox + hand it over
        const song = () => {
            if (!/^#nb=/.test(location.hash)) return;
            let t = location.hash.slice(4), n = 0;
            try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
            os.summon('noisebox.exe');
            let iv = setInterval(() => { if (os.noisebox && os.noisebox.openShared && document.getElementById('win-noisebox.exe')) { clearInterval(iv); setTimeout(() => os.noisebox.openShared(t), 300); } else if (++n > 80) clearInterval(iv); }, 250);
        };
        song(); addEventListener('hashchange', song);
        // a timer was going when the page closed. load it so it can still ring
        try { let t = JSON.parse(localStorage.getItem('vmp_timer') || 'null'); if (t && (t.end > 0 || t.fend > 0) && os.need && os.lazy && os.lazy['timer.exe']) os.need(os.lazy['timer.exe']); } catch (e) {}
        if (os.isPhone && os.isPhone()) { let iv = setInterval(() => { if (!document.querySelector('.pw-win')) { clearInterval(iv); setTimeout(phoneBanner, 400); } }, 500); }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else setTimeout(go, 0);
})();
