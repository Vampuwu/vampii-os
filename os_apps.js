// Extending the existing shit
window.os = window.os || {};

os.playTrack = function(track) {
    let ytContainer = document.getElementById('yt-container');
    let ytPlayer = document.getElementById('yt-player');
    let localPlayer = document.getElementById('local-audio-player');

    if (track.videoId) {
        if (localPlayer) { localPlayer.pause(); localPlayer.removeAttribute('src'); }
        if (ytContainer && ytPlayer) {
            ytContainer.style.display = 'block';
            let origin = /^https?:/.test(location.protocol) ? '&origin=' + encodeURIComponent(location.origin) : '';
            ytPlayer.src = `https://www.youtube.com/embed/${encodeURIComponent(track.videoId)}?autoplay=1&enablejsapi=1&playsinline=1&rel=0&modestbranding=1${origin}`;
        }
        window.isMusicPlaying = true;
    } else if (track.audioSrc) {
        if (ytContainer && ytPlayer) {
            ytContainer.style.display = 'none';
            ytPlayer.src = '';
        }
        if (localPlayer) {
            localPlayer.src = track.audioSrc;
            localPlayer.play().catch(e => {});
        }
        window.isMusicPlaying = true;
    }
    if (typeof os.deck === 'function') os.deck(track);
};

os.filterBlog = function(tag) {
    this.clickAudio();
    os.blogTag = tag;
    document.querySelectorAll('#win-blog .module-toolbar .filter-chip').forEach(btn => btn.classList.toggle('active', btn.dataset.tag === tag));
    populateData('blog', 'blog-container', tag);
};

// old posts have tag, new ones have tags. dont break the old ones
const postTags = it => Array.isArray(it.tags) && it.tags.length ? it.tags.map(String) : (it.tag ? [String(it.tag)] : []);
const blogText = h => new DOMParser().parseFromString(String(h || ''), 'text/html').body.textContent || '';
function blogMins(h) {
    let t = blogText(h), jp = (t.match(/[\u3040-\u30ff\u3400-\u9fff\uff66-\uff9f]/g) || []).length, en = (t.match(/[A-Za-z0-9']+/g) || []).length;
    return Math.max(1, Math.round(jp / 500 + en / 220));
}
function blogFold(root) {
    root.querySelectorAll('.post-blog .window-text:not([data-fold])').forEach(w => {
        w.dataset.fold = '1';
        const check = () => {
            if (w.classList.contains('open')) return;
            let b = w.nextElementSibling && w.nextElementSibling.classList.contains('post-more') ? w.nextElementSibling : null, long = w.scrollHeight > 600;
            w.classList.toggle('folded', long);
            if (!long) { if (b) b.remove(); return; }
            if (b) return;
            b = document.createElement('button'); b.type = 'button'; b.className = 'post-more'; b.textContent = T('blogMore', 'keep reading ↓');
            b.onclick = () => { let o = w.classList.toggle('open'); w.classList.toggle('folded', !o); b.textContent = o ? T('blogLess', 'less ↑') : T('blogMore', 'keep reading ↓'); };
            w.after(b);
        };
        check();
        if (document.fonts) document.fonts.ready.then(check);
        w.querySelectorAll('img').forEach(i => i.addEventListener('load', check, { once: true }));
    });
}
function blogCount(n, tag) {
    let c = document.querySelector('#win-blog .blog-count'); if (!c) return;
    c.textContent = (n === 1 ? T('blogCount1', '{n} post') : T('blogCount', '{n} posts')).replace('{n}', n) + (tag && tag !== 'ALL' ? ' · #' + tag : '') + (os.blogQ ? ' · "' + os.blogQ + '"' : '');
}
// index.html#post-12 opens that post
function blogFromHash() {
    let m = /^#post-(\d+)$/.exec(location.hash); if (!m) return;
    os.summon('blog');
    let tries = 0;
    (function find() {
        let el = document.getElementById('post-' + m[1]), body = document.querySelector('#win-blog .window-body');
        if (el && body) { body.scrollTop = el.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 12; el.classList.remove('post-hit'); void el.offsetWidth; el.classList.add('post-hit'); return; }
        let more = document.querySelector('#blog-container .load-more');
        if (more && tries++ < 40) more.click();
        if (tries < 40) setTimeout(find, 80);
    })();
}
window.addEventListener('hashchange', blogFromHash);
window.addEventListener('load', () => setTimeout(blogFromHash, 2600));

function initBlogFilters() {
    let bar = document.querySelector('#win-blog .module-toolbar');
    if (!bar || typeof database === 'undefined') return;
    let posts = (database.blog || []).slice().sort((x, y) => String(y.date).localeCompare(String(x.date)) || (y.id || 0) - (x.id || 0));
    let tags = [], n = {};
    posts.forEach(p => postTags(p).forEach(t => { if (!tags.includes(t)) tags.push(t); n[t] = (n[t] || 0) + 1; }));
    bar.innerHTML = '';
    ['ALL'].concat(tags).forEach((tag, i) => {
        let btn = document.createElement('button');
        btn.className = 'filter-chip' + (i === 0 ? ' active' : '');
        btn.dataset.tag = tag;
        btn.innerHTML = '<span></span><i></i>';
        btn.firstChild.textContent = i ? '#' + tag : 'ALL';
        btn.lastChild.textContent = i ? n[tag] : posts.length;
        btn.title = btn.firstChild.textContent;
        btn.addEventListener('click', () => os.filterBlog(tag));
        bar.appendChild(btn);
    });
    let win = document.getElementById('win-blog'), body = win && win.querySelector('.window-body');
    if (!win.querySelector('.blog-tools')) {
        let tools = document.createElement('div'); tools.className = 'blog-tools';
        let q = document.createElement('input'); q.type = 'search'; q.className = 'blog-search'; q.placeholder = T('blogSearch', 'search'); q.setAttribute('aria-label', q.placeholder);
        let c = document.createElement('span'); c.className = 'blog-count';
        let tm = 0;
        q.oninput = () => { clearTimeout(tm); tm = setTimeout(() => { os.blogQ = q.value.trim(); populateData('blog', 'blog-container', os.blogTag || 'ALL'); }, 160); };
        tools.appendChild(q); tools.appendChild(c); bar.before(tools);
        let top = document.createElement('button'); top.type = 'button'; top.className = 'blog-top'; top.textContent = T('blogTop', '↑ top');
        top.onclick = () => { body.scrollTo({ top: 0, behavior: 'smooth' }); };
        body.appendChild(top);
        body.addEventListener('scroll', () => top.classList.toggle('show', body.scrollTop > 500), { passive: true });
    }
    os.blogQ = ''; os.blogTag = 'ALL';
    let sq = win.querySelector('.blog-search'); if (sq) sq.value = '';
    // 2 rows max or the tags take over the whole window
    let more = bar.nextElementSibling && bar.nextElementSibling.classList.contains('tag-more') ? bar.nextElementSibling : null;
    if (!more) { more = document.createElement('button'); more.type = 'button'; more.className = 'tag-more'; bar.after(more); }
    bar.classList.add('fold');
    requestAnimationFrame(() => {
        let chips = [...bar.children], rows = [...new Set(chips.map(c => c.offsetTop))];
        let hid = rows.length > 2 ? chips.filter(c => c.offsetTop > rows[1]).length : 0;
        more.hidden = !hid;
        const lab = () => { more.textContent = bar.classList.contains('fold') ? '+' + hid + ' more' : 'less'; };
        more.onclick = () => { bar.classList.toggle('fold'); lab(); };
        lab();
        if (!hid) bar.classList.remove('fold');
    });
}

let motionWas = null;
function reducedMotionOn() {
    if (typeof window.motionPref === 'boolean') return window.motionPref;
    try {
        let saved = localStorage.getItem('vmp_reduce_motion');
        if (saved === '1') return true;
        if (saved === '0') return false;
    } catch (e) {}
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

function syncMotion() {
    let on = reducedMotionOn();
    document.documentElement.classList.toggle('reduce-motion', on);
    document.querySelectorAll('marquee').forEach(m => {
        if (on) { if (m.stop) m.stop(); }
        else if (motionWas && m.start) m.start();
    });
    let btn = document.getElementById('motion-btn');
    if (btn) {
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.textContent = '[ 動きを減らす / REDUCE MOTION: ' + (on ? 'ON' : 'OFF') + ' ]';
    }
    if (motionWas !== null && motionWas !== on) {
        if (!on && document.getElementById('typed-banner')) initTypedBanner();
    }
    motionWas = on;
}

os.toggleReducedMotion = function() {
    let next = !reducedMotionOn();
    window.motionPref = next;
    try { localStorage.setItem('vmp_reduce_motion', next ? '1' : '0'); } catch (e) {}
    syncMotion();
};

os.toggleSetupModal = function() {
    let existing = document.getElementById('win-setup-modal');
    if (existing) { existing.classList.remove('is-min'); if (typeof os.focusWin === 'function') os.focusWin(existing); else existing.style.zIndex = ++this.zTier; return; }

    let setupData = (typeof database !== 'undefined' && database.setup) ? database.setup : {
        daw: ['error'],
        plugins: ['error'],
        vocals: ['error']
    };

    let modal = document.createElement('div');
    modal.id = 'win-setup-modal';
    modal.className = 'bedazzled-border window-spawn';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'setup-modal-title');
    modal.style.cssText = `
        position: absolute; width: 780px; max-width: calc(100vw - 20px);
        z-index: ${++this.zTier}; top: 70px; left: max(10px, calc(50vw - 390px));
    `;

    // so plugin names with weird symbols dont break it
    const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const split = line => { let i = String(line).indexOf(' - '); return i < 0 ? [String(line), []] : [line.slice(0, i), line.slice(i + 3).split(/,\s*(?![^()]*\))/)]; };
    // dot matrix printer
    let n = 0;
    const row = (name, what, num) => `<div class="pr-v" style="--i: ${Math.min(n++, 70)}"><b>${name}</b><span>${what}</span><em>${num}</em></div>`;
    const line = (t, cls) => `<div class="pr-line ${cls || ''}" style="--i: ${Math.min(n++, 70)}">${t}</div>`;
    let count = (setupData.plugins || []).reduce((k, l) => k + split(l)[1].length, 0);
    let d = new Date(), stamp = d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0') + ' ' + d.toTimeString().slice(0, 5);
    let top = line('<b>PRODUCTION_SETUP.TXT</b><small>制作環境</small>', 'big') + line('printed ' + stamp + ' · page 1 of 1', 'dim');
    let daw = line('DAW', 'h') + (setupData.daw || []).map(x => { let [v, p] = split(x); return row(esc(v), esc(p.join(', ')) + ' <mark>メイン</mark>', ''); }).join('');
    let plugs = line('プラグイン・音源 <small>' + count + ' plugins // ' + (setupData.plugins || []).length + ' vendors</small>', 'h') + (setupData.plugins || []).map(l => { let [v, p] = split(l); return row(esc(v), p.map(esc).join(' · '), p.length); }).join('');
    let groups = [], g = null;
    (setupData.vocals || []).forEach(v => { if (/┈/.test(v)) { groups.push({ deco: String(v).trim() }); g = null; return; } if (typeof v === 'string' && v.startsWith(' ')) { if (!g) groups.push(g = { head: '', items: [] }); g.items.push(v.trim()); } else groups.push(g = { head: v, items: [] }); });
    let vox = line('歌声合成', 'h') + groups.map(x => x.deco ? line(esc(x.deco), 'deco') : row(esc(x.head), x.items.map(esc).join(' · '), x.items.length || '')).join('');
    let end = line('- - - - - - - - - -  end of file  - - - - - - - - - -', 'dim c');
    modal.innerHTML = `
        <div class="window-header readable-ui">
            <span id="setup-modal-title">// PRODUCTION_SETUP.TXT 【制作環境】</span>
            <span class="pr-leds" aria-hidden="true"><i class="pwr"></i>POWER<i class="busy"></i>ONLINE</span>
            <div class="win-btns"><button class="kill-btn" aria-label="Close Window" title="閉じる">[X]</button></div>
        </div>
        <div class="window-body readable-ui su-body pr-platen" style="color: var(--text-main); max-height: calc(100vh - 210px); overflow-y: auto; box-sizing: border-box;">
            <div class="pr-paper">${top}${daw}${plugs}${vox}${end}</div>
        </div>
    `;
    let killBtn = modal.querySelector('.kill-btn');
    killBtn.onclick = () => { 
        this.clickAudio(); 
        modal.classList.add('glitching-out');
        setTimeout(() => modal.remove(), 350);
    };
    modal.onmousedown = () => { if (typeof os.focusWin === 'function') os.focusWin(modal); else modal.style.zIndex = ++this.zTier; };
    document.getElementById('desktop').appendChild(modal);
    if (os.sfx) os.sfx('print');
    if (typeof os.focusWin === 'function') os.focusWin(modal);
    if (typeof os.winBeam === 'function') requestAnimationFrame(() => os.winBeam(modal));
    modal.querySelector('.kill-btn').focus();
};

// handles blog/music since they're all just "list of stuff from db.js" 
function populateData(type, containerId, filterTag = 'ALL') {
    let container = document.getElementById(containerId);
    if (!container || typeof database === 'undefined') return;
    container.innerHTML = '';
    let items = database[type] || [];
    if (filterTag !== 'ALL' && type === 'blog') {
        items = items.filter(item => postTags(item).includes(filterTag));
    }
    if (type === 'blog' && os.blogQ) { let q = os.blogQ.toLowerCase(); items = items.filter(it => (String(it.title || '') + ' ' + blogText(it.content || it.desc) + ' ' + postTags(it).join(' ')).toLowerCase().includes(q)); }
    if (type === 'blog') blogCount(items.length, filterTag);
    // tap a tag on a post = filter by it
    if (type === 'blog' && !container._tagTap) { container._tagTap = 1; container.addEventListener('click', e => { let t = e.target.closest('.meta-pill.tag[data-tag]'); if (t) os.filterBlog(t.dataset.tag);
            let l = e.target.closest('.post-link'); if (!l) return;
            let u = location.href.split('#')[0] + '#post-' + l.dataset.id, done = () => { l.textContent = T('blogCopied', 'copied'); setTimeout(() => { l.textContent = T('blogLink', 'link'); }, 1400); };
            try { navigator.clipboard.writeText(u).then(done, () => { history.replaceState(null, '', '#post-' + l.dataset.id); done(); }); } catch (er) { history.replaceState(null, '', '#post-' + l.dataset.id); done(); }
        }); container.addEventListener('keydown', e => { let t = e.target.closest('.meta-pill.tag[data-tag]'); if (t && e.key === 'Enter') os.filterBlog(t.dataset.tag); }); }
    if (type === 'blog') items = items.slice().sort((x, y) => String(y.date).localeCompare(String(x.date)) || (y.id || 0) - (x.id || 0));
    if (items.length === 0) {
        if (type === 'blog' && (os.blogQ || filterTag !== 'ALL')) { container.innerHTML = '<div class="blog-none window-text" role="status"></div>'; container.firstChild.textContent = T('blogNone', 'nothing here'); return; }
        container.innerHTML = `<div class="readable-ui window-text" style="color: var(--neon-secondary);" role="alert">[ データが見つかりません / ENTER DATA HERE ]</div>`;
        return;
    }
    // loads 10 at a time. future proofing for when I have 500 blog posts (I wont)
    if (container._io) container._io.disconnect();
    let pageSize = 10;
    let shown = 0;
    let more = null;
    function renderChunk() {
        items.slice(shown, shown + pageSize).forEach(item => {
            let div = document.createElement('div');
            div.className = 'post-card post-' + type;
            let fresh = typeof os.isNew === 'function' && os.isNew(type, item) ? '<span class="new-badge">NEW</span>' : '';
            if (fresh) div.classList.add('is-new');
            if (type === 'music') {
                div.setAttribute('tabindex', '0');
                div.setAttribute('role', 'button');
                div.style.cursor = 'inherit';
                div.classList.add('track-row');
                // no cover art? steal the youtube thumbnail
                let art = item.coverImg || (item.videoId ? `https://i.ytimg.com/vi/${encodeURIComponent(item.videoId)}/hqdefault.jpg` : '');
                div.dataset.i = (database.music || []).indexOf(item);
                div.innerHTML = `
                    <span class="track-no" aria-hidden="true">${String(+div.dataset.i + 1).padStart(2, '0')}</span>
                    <div class="track-art"><span class="track-disc" aria-hidden="true"></span>${art ? `<img src="${art}" alt="${item.coverAlt || ''}" class="track-cover">` : '<div class="track-cover track-nocover" aria-hidden="true">♪</div>'}</div>
                    <div class="track-info">
                        <div class="card-title">${item.title || 'ENTRY'}<span class="track-artist"> ${item.artist || ''}</span>${fresh}</div>
                        <div class="post-meta"><span class="meta-pill">⏱ ${item.duration && item.duration !== '?' ? item.duration : '--:--'}</span>${item.date ? '<span class="meta-pill">' + item.date + '</span>' : ''}</div>
                        ${item.desc ? `<div class="window-text track-desc">${item.desc}</div>` : ''}
                    </div>
                    <span class="track-play" aria-hidden="true">▶</span>`;
                div.onclick = () => {
                    os.clickAudio();
                    os.playTrack(item);
                    document.querySelectorAll('.post-music.playing').forEach(x => x.classList.remove('playing'));
                    div.classList.add('playing');
                };
                div.onkeydown = (e) => { if(e.key === 'Enter') div.click(); };
            } else if (type === 'blog') {
                let d = String(item.date || '????-??-??'), pt = postTags(item);
                let tg = pt.length ? pt.map(t => `<span class="meta-pill tag" data-tag="${t.replace(/"/g, '&quot;')}" role="button" tabindex="0">#${t}</span>`).join('') : '<span class="meta-pill tag">#日常</span>';
                if (item.id != null) div.id = 'post-' + item.id;
                let rd = T('blogRead', '{n} min').replace(/\{n\}/g, blogMins(item.content || item.desc)), lk = item.id != null ? `<button type="button" class="post-link" data-id="${item.id}">${T('blogLink', 'link')}</button>` : '';
                div.innerHTML = `<div class="post-meta"><span class="meta-pill date"><b>${d.slice(8, 10)}.${d.slice(5, 7)}</b><small>${d.slice(0, 4)}</small></span><span class="post-tags">${tg}</span><small class="post-read">${rd}</small>${lk}</div><div class="card-title">${item.title || item.name || 'ENTRY'}${fresh}</div><div class="window-text">${item.desc || item.content || ''}</div>`;
            } else {
                div.innerHTML = `<div class="card-title">${item.title || item.name || 'ENTRY'}</div><div class="window-text">${item.desc || item.content || ''}</div>`;
            }
            container.appendChild(div);
        });
        container.querySelectorAll('img:not([loading])').forEach(img => { img.loading = 'lazy'; });
        if (type === 'blog') blogFold(container);
        shown += pageSize;
        if (more) more.remove();
        if (shown < items.length) {
            more = document.createElement('button');
            more.className = 'readable-ui action-btn load-more';
            more.textContent = `[ もっと見る / LOAD MORE (${items.length - shown}) ]`;
            more.onclick = () => { os.clickAudio(); renderChunk(); };
            container.appendChild(more);
            if (window.IntersectionObserver) {
                container._io = new IntersectionObserver(entries => {
                    if (entries[0].isIntersecting) { container._io.disconnect(); renderChunk(); }
                }, { root: container.closest('.window-body') });
                container._io.observe(more);
            }
        }
    }
    renderChunk();
}

function initTicker() {
    let tickerEl = document.getElementById('hex-stream');
    if (!tickerEl || typeof database === 'undefined' || !database.ticker) return;
    if (!database.ticker.length) { tickerEl.hidden = true; return; }
    let tickIdx = 0;
    setInterval(() => {
        tickerEl.textContent = database.ticker[tickIdx];
        tickIdx = (tickIdx + 1) % database.ticker.length;
        tickerEl.style.color = Math.random() > 0.8 ? '#fff' : 'inherit';
    }, 3500);
}

const bannerQuotes = [T('bannerLine', '// VAMPII.OS v4.444 booted. probably fine. ✧ ヴァンピィ')];
let qIdx = 0, cIdx = 0, isDel = false, timer = null;
function initTypedBanner() {
    let target = document.getElementById('typed-banner');
    if (!target) return;
    clearTimeout(timer);
    function type() {
        let fullText = bannerQuotes[qIdx];
        if (document.documentElement.classList.contains('reduce-motion')) { target.textContent = fullText; return; }
        if (isDel) { target.textContent = fullText.substring(0, cIdx - 1); cIdx--; }
        else { target.textContent = fullText.substring(0, cIdx + 1); cIdx++; }
        let speed = isDel ? 15 : 40;
        if (!isDel && cIdx === fullText.length) { speed = 3000; isDel = true; }
        else if (isDel && cIdx === 0) { isDel = false; qIdx = (qIdx + 1) % bannerQuotes.length; speed = 200; }
        timer = setTimeout(type, speed);
    }
    type();
}

function initBlinkieMarquee() {
    let el = document.getElementById('blinkie-text');
    if (!el) return;
    // the browser moves it now, not me every frame
    let run = null;
    function go() {
        if (run) run.cancel();
        if (document.documentElement.classList.contains('reduce-motion')) { el.style.transform = 'translateX(16px)'; return; }
        el.style.transform = '';
        let w = el.offsetWidth, from = window.innerWidth;
        run = el.animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${-w}px)` }], { duration: (from + w) / 0.6 * 16.67, iterations: Infinity });
    }
    let t = 0;
    const later = () => { clearTimeout(t); t = setTimeout(go, 200); };
    if (window.ResizeObserver) new ResizeObserver(later).observe(el);
    window.addEventListener('resize', later);
    let calmWas = document.documentElement.classList.contains('reduce-motion');
    new MutationObserver(() => { let c = document.documentElement.classList.contains('reduce-motion'); if (c !== calmWas) { calmWas = c; go(); } }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    go();
}

document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    let menu = document.getElementById('custom-context-menu');
    if (!menu) return;
    menu.style.display = 'block';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    const clamp = () => {
        let w = menu.offsetWidth, h = menu.offsetHeight;
        menu.style.left = Math.max(4, Math.min(e.clientX, window.innerWidth - w - 6)) + 'px';
        menu.style.top = Math.max(4, Math.min(e.clientY, window.innerHeight - h - 6)) + 'px';
    };
    clamp();
    requestAnimationFrame(clamp);
    setTimeout(clamp, 60);
});

document.addEventListener('click', () => {
    let menu = document.getElementById('custom-context-menu');
    if (menu) menu.style.display = 'none';
});

const trailGlyphs = ['0x', '//', 'ERR', '†', '‡', '░', '▒', '█', 'Δ', 'SYS', '::', 'x'];
let lastX = 0, lastY = 0;
// it was asking the browser for the colours on every single mouse move. cached now, cleared when the theme changes
let sparks = [], sparkRaf = 0, sparkCols = null;
new MutationObserver(() => { sparkCols = null; }).observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });
function sparkStep() {
    sparkRaf = sparks.length ? requestAnimationFrame(sparkStep) : 0;
    sparks = sparks.filter(k => {
        k.vy += 0.36; k.vx *= 0.92; k.x += k.vx; k.y += k.vy; k.o -= 0.04; k.s *= 0.88;
        if (Math.random() < 0.25) k.x += (Math.random() - 0.5) * 2.5;
        if (Math.random() < 0.10) k.el.textContent = trailGlyphs[Math.floor(Math.random() * trailGlyphs.length)];
        if (k.o <= 0 || k.s <= 0.03) { k.el.remove(); return false; }
        k.el.style.opacity = k.o;
        k.el.style.transform = `translate3d(${k.x.toFixed(1)}px, ${k.y.toFixed(1)}px, 0) scale(${k.s.toFixed(3)})`;
        return true;
    });
}

document.addEventListener('mousemove', (e) => {
    if (document.documentElement.classList.contains('reduce-motion')) return;
    if (document.documentElement.classList.contains('low-spec')) return;
    if (os.customTrail) return;
    const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
    if (dist < 8) return; 
    lastX = e.clientX;
    lastY = e.clientY;
    if (sparks.length >= 22) return;

    const spark = document.createElement('div');
    spark.className = 'cyber-spark';
    spark.setAttribute('aria-hidden', 'true');
    spark.textContent = trailGlyphs[Math.floor(Math.random() * trailGlyphs.length)];

    if (!sparkCols) {
        const styles = getComputedStyle(document.documentElement);
        sparkCols = [styles.getPropertyValue('--neon-primary').trim() || '#ff0099', styles.getPropertyValue('--neon-secondary').trim() || '#ff66b3'];
    }
    const color = sparkCols[Math.floor(Math.random() * sparkCols.length)];
    let k = { el: spark, x: e.clientX, y: e.clientY, vx: (Math.random() - 0.5) * 1.5, vy: Math.random() * 0.4 + 0.1, o: 0.95, s: Math.random() * 0.3 + 0.65 };

    spark.style.cssText = `
        position: fixed !important;
        left: 0px !important;
        top: 0px !important;
        margin: 0 !important;
        padding: 0 !important;
        color: ${color} !important;
        font-family: 'Courier New', monospace !important;
        font-weight: bold !important;
        font-size: ${Math.floor(Math.random() * 3 + 8)}px !important;
        pointer-events: none !important;
        user-select: none !important;
        z-index: 99999 !important;
        text-shadow: 0 0 4px ${color}, 0 0 8px ${color} !important;
        animation: none !important;
        transition: none !important;
        opacity: ${k.o} !important;
        transform: translate3d(${k.x}px, ${k.y}px, 0) scale(${k.s}) !important;
        will-change: transform, opacity;
    `;

    document.body.appendChild(spark);
    sparks.push(k);
    if (!sparkRaf) sparkRaf = requestAnimationFrame(sparkStep);
});

// little easter egg, because I am too dumb for big easter egg.
let keyBuffer = "";
window.addEventListener('keypress', (e) => {
    keyBuffer += e.key.toLowerCase();
    if (keyBuffer.length > 10) keyBuffer = keyBuffer.slice(-10);
    if (keyBuffer.includes("kawaii") || keyBuffer.includes("vamp")) {
        keyBuffer = "";
        os.clickAudio();
        document.body.style.filter = "hue-rotate(180deg) contrast(150%)";
        setTimeout(() => { document.body.style.filter = "none"; }, 800);
    }
});

function updateClock() {
    let el = document.getElementById('sys-clock');
    if (!el) return;
    let now = new Date(), p = n => String(n).padStart(2, '0');
    el.textContent = `[ ${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())} ]`;
}
setInterval(updateClock, 1000); updateClock();

const boot = document.getElementById('boot-flicker');
if (boot) boot.addEventListener('animationend', () => boot.remove());

function initUptime() {
    let el = document.getElementById('sys-uptime');
    if (!el) return;
    let p = n => String(n).padStart(2, '0');
    function tick() {
        let s = Math.floor(performance.now() / 1000);
        el.textContent = `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`;
    }
    tick();
    setInterval(tick, 1000);
}

// the cpu number is kinda real?? it goes up when the page is lagging. net is just you clicking stuff lmao
function initCpuTracker() {
    let cpuLoadText = document.getElementById('cpu-load');
    let cpuG = document.getElementById('cpu-graph');
    if (!cpuLoadText) return;
    let cpuH = new Array(40).fill(10), load = 10, frames = [], last = performance.now();
    (function watch(t) { frames.push(t - last); last = t; if (frames.length > 90) frames.shift(); requestAnimationFrame(watch); })(last);
    os.frameMs = () => frames.length > 10 ? frames.reduce((a, b) => a + b, 0) / frames.length : 0;
    const col = () => getComputedStyle(document.documentElement).getPropertyValue('--neon-secondary').trim() || '#ff66b3';
    function draw(c, data, max, colour) {
        let r = window.devicePixelRatio || 1, w = c.clientWidth || 90, h = c.clientHeight || 12;
        if (c.width !== Math.round(w * r)) { c.width = Math.round(w * r); c.height = Math.round(h * r); }
        let x = c.getContext('2d'); x.setTransform(r, 0, 0, r, 0, 0); x.clearRect(0, 0, w, h);
        let step = w / (data.length - 1), y = v => h - 1 - Math.min(1, v / max) * (h - 2);
        x.beginPath(); data.forEach((v, i) => i ? x.lineTo(i * step, y(v)) : x.moveTo(0, y(v)));
        let fade = x.createLinearGradient(0, 0, w, 0); fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, colour);
        x.strokeStyle = fade; x.lineWidth = 1.2; x.stroke();
        x.lineTo(w, h); x.lineTo(0, h); x.closePath();
        x.globalAlpha = 0.22; x.fillStyle = fade; x.fill(); x.globalAlpha = 1;
    }
    setInterval(() => {
        if (!document.hidden && frames.length > 10) { let avg = frames.reduce((a, b) => a + b, 0) / frames.length; let raw = Math.max(3, Math.min(96, 5 + (avg / 16.7 - 1) * 35 + Math.random() * 3)); load += (raw - load) * 0.35; }
        cpuH.push(load); cpuH.shift();
        cpuLoadText.textContent = Math.round(load) + '%';
        if (cpuG && cpuG.offsetParent) draw(cpuG, cpuH, 50, col());
    }, 500);
}



syncMotion();
