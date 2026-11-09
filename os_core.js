// the very real yes yes OS. windows popping up, dragging them round, themes

window.os = window.os || { zTier: 100 };
os.isPhone = () => window.innerWidth < 768 || (window.innerHeight < 500 && window.matchMedia('(pointer: coarse)').matches);
// phones + ipads. an ipad with a mouse is fine tho
os.mobileish = () => { try { return os.isPhone() || (matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches); } catch (e) { return os.isPhone(); } };
// everything's free, always
os.hasUnlock = () => true;

os.prefs = (function () {
    let d = { sound: true, glow: 'mid', glass: false, scan: false, saver: true, notices: true, shaderbg: true, filmfx: true, burnin: true, wall: 'city', lite: false };
    try { return Object.assign(d, JSON.parse(localStorage.getItem('vmp_prefs') || '{}')); } catch (e) { return d; }
})();
os.savePrefs = function() {
    try { localStorage.setItem('vmp_prefs', JSON.stringify(os.prefs)); } catch (e) {}
};

os.clickAudio = function() {
    if (os.prefs.sound === false) return;
    let sp = { type: 'sine', from: 880, to: 220, dur: 0.04, vol: 0.04 };
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!window.audioCtx) window.audioCtx = new AudioContext();
        let ctx = window.audioCtx;
        if (ctx.state === 'suspended') ctx.resume();

        let osc = ctx.createOscillator();
        let gain = ctx.createGain();
        osc.type = sp.type;
        osc.frequency.setValueAtTime(sp.from, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(sp.to, ctx.currentTime + sp.dur);

        gain.gain.setValueAtTime(sp.vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + sp.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + sp.dur);
    } catch (e) {}
};


os.themes = {
    pink:   ['#ff0099', '#ff66b3', 'rgba(255, 0, 153, 0.55)', '#ffe6f2', '#12000a', '#260015'],
    blue:   ['#00f0ff', '#ff007f', 'rgba(0, 240, 255, 0.45)', '#d1f8ff', '#020608', '#051418'],
    purple: ['#bd00ff', '#00f0ff', 'rgba(189, 0, 255, 0.45)', '#f2d1ff', '#060208', '#140518'],
    red:    ['#ff003c', '#ffea00', 'rgba(255, 0, 60, 0.45)', '#ffd1dc', '#080202', '#180505'],
    yellow: ['#fff200', '#ff2bd6', 'rgba(255, 242, 0, 0.45)', '#fffbd6', '#080700', '#181503']
};
// custom theme. too dark gets lightened or you cant read anything
os.buildCustom = function(a, b) {
    const ok = h => /^#[0-9a-f]{6}$/i.test(h || '');
    const hx = h => { let n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
    const to = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
    const mix = (c, d, k) => c.map((v, i) => v * k + d[i] * (1 - k));
    const lum = c => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
    const lift = c => { for (let n = 0; lum(c) < 0.18 && n < 12; n++) c = mix(c, [255, 255, 255], 0.88); return c; };
    let p = lift(hx(ok(a) ? a : '#ff0099')), s = lift(hx(ok(b) ? b : '#00f0ff'));
    return [to(p), to(s), 'rgba(' + p.map(Math.round).join(', ') + ', 0.45)', to(mix(p, [255, 255, 255], 0.12)), to(mix(p, [5, 3, 7], 0.06)), to(mix(p, [10, 5, 14], 0.15))];
};
os.themes.custom = os.buildCustom((os.prefs.custom || {}).a, (os.prefs.custom || {}).b);
os.setCustom = function(a, b) {
    os.prefs.custom = { a, b }; os.savePrefs();
    os.themes.custom = os.buildCustom(a, b);
    os.setTheme('custom');
};
os.paintTheme = function(themeName) {
    const root = document.documentElement;
    let t = os.themes[themeName] || os.themes.pink;
    ['--neon-primary', '--neon-secondary', '--neon-glow', '--text-main', '--bg-base', '--bg-gradient-center'].forEach((k, i) => root.style.setProperty(k, t[i]));

    // cursor needs to match the theme too or it looks off
    let cursorColor = root.style.getPropertyValue('--neon-primary').trim() || '#ff0099';
    let encColor = encodeURIComponent(cursorColor);
    let svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="22" stroke="${encColor}" stroke-width="2"/><line x1="2" y1="12" x2="22" y2="12" stroke="${encColor}" stroke-width="2"/></svg>`;
    os.setCursor(`url('${svg}') 12 12, crosshair`);
    os.applyGlow(true);
};

os.setCursor = function(css) {
    document.documentElement.style.cursor = css;
    if (document.body) document.body.style.cursor = css;
};

// it remembers your colour now, getting pink on every reload drove me insane
const builtInThemes = ['pink', 'blue', 'purple', 'red', 'yellow', 'custom'];
os.setTheme = function(themeName) {
    this.paintTheme(themeName);
    if (builtInThemes.includes(themeName)) {
        try { localStorage.setItem('vmp_theme', themeName); } catch (e) {}
    }
};
function savedTheme() {
    try {
        let t = localStorage.getItem('vmp_theme');
        if (builtInThemes.includes(t)) return t;
    } catch (e) {}
    return 'pink';
}

const glowAmount = { low: 0.45, mid: 1, high: 1.7 };
os.applyGlow = function(fresh) {
    const root = document.documentElement;
    if (fresh || !root.dataset.glowRaw) root.dataset.glowRaw = root.style.getPropertyValue('--neon-glow').trim();
    let m = /rgba?\(([^)]+)\)/.exec(root.dataset.glowRaw || '');
    if (!m) return;
    let parts = m[1].split(',').map(x => x.trim());
    let a = parts.length > 3 ? parseFloat(parts[3]) : 1;
    a = Math.max(0.05, Math.min(1, a * (glowAmount[os.prefs.glow] || 1)));
    root.style.setProperty('--neon-glow', `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${a.toFixed(2)})`);
};

os.focusWin = function(win) {
    if (!win) return;
    win.style.zIndex = ++this.zTier;
    document.querySelectorAll('#desktop > div[id^="win-"]').forEach(w => w.classList.toggle('is-active', w === win));
};
os.focusTop = function() {
    let top = null;
    document.querySelectorAll('#desktop > div[id^="win-"]:not(.is-min)').forEach(w => {
        if (!top || Number(w.style.zIndex) > Number(top.style.zIndex)) top = w;
    });
    if (top) this.focusWin(top);
};

os.summon = function(id) {
    let win = document.getElementById('win-' + id);
    if (win) { win.classList.remove('is-min'); this.focusWin(win); return; }
    let template = document.getElementById(id);
    if (!template) return;

    win = document.createElement('div');
    win.id = 'win-' + id;
    win.className = 'bedazzled-border window-spawn';
    
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-labelledby', `win-title-${id}`);

    let isMobile = os.isPhone();
    // never wider than the screen
    let winWidth = isMobile ? window.innerWidth - 20 : Math.min(id === 'music' ? 900 : id === 'paint.exe' ? 1180 : 760, window.innerWidth - 20);
    let step = (document.querySelectorAll('#desktop > div[id^="win-"]').length % 6) * 26;
    let leftVal = isMobile ? '10px' : Math.max(10, Math.min(window.innerWidth / 2 - winWidth / 2 + step, window.innerWidth - winWidth - 10)) + 'px';
    // try not to open windows on top of the icons
    if (!isMobile) { let ics = [...document.querySelectorAll('.desktop-icons .icon-wrap')].filter(i => i.offsetParent !== null), edge = ics.length ? Math.max(...ics.map(i => i.getBoundingClientRect().right)) + 12 : 0; if (edge && parseFloat(leftVal) < edge) { let room = window.innerWidth - edge - 10; if (room >= winWidth) leftVal = edge + 'px'; else if (room >= 560) { winWidth = room; leftVal = edge + 'px'; } } }
    let topVal = isMobile ? '65px' : `${75 + step}px`;

    win.style.cssText = `
        position: absolute; width: 100%; max-width: ${winWidth}px;
        z-index: ${++this.zTier}; top: ${topVal}; left: ${leftVal};
    `;

    let titleMap = {
        'info': 'info.exe 【情報】',
        'blog': 'blog.log 【日記】',
        'music': 'music.sys 【音楽】',
        'settings': 'config.sys 【設定】',
        'calc.exe': 'calc.exe 【電卓】',
        'paint.exe': 'paint 【お絵かき】',
        'games.exe': 'games.exe 【ゲーム】'
    };

    win.innerHTML = `
        <div class="window-header readable-ui" style="background: rgba(16, 6, 14, 0.98); padding: 12px 18px; color: #ffffff; font-size: 15px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; cursor: inherit; border-bottom: 1px solid var(--neon-primary);">
            <span id="win-title-${id}" style="text-shadow: 0 0 6px var(--neon-primary); letter-spacing: 1px;">${id === 'paint.exe' ? '' : '// '}${titleMap[id] || id}</span>
            <div class="win-btns">
                <button class="win-btn min-btn" aria-label="Minimise Window" title="最小化">[_]</button>
                <button class="win-btn max-btn" aria-label="Maximise Window" title="最大化">[□]</button>
                <button class="kill-btn" aria-label="Close Window" style="background: none; cursor: inherit; color: #fff; font-weight: bold; text-shadow: 0 0 5px var(--neon-primary); padding: 2px 8px; font-size: 16px; border: 1px solid transparent; transition: 0.2s;">[X]</button>
            </div>
        </div>
        <div class="window-body" style="padding: 28px; color: var(--text-main); max-height: calc(100vh - 210px); overflow-y: auto; background: rgba(8, 2, 6, 0.96); box-sizing: border-box;"></div>
    `;

    win.querySelector('.window-body').appendChild(template.content.cloneNode(true));
    
    let killBtn = win.querySelector('.kill-btn');
    killBtn.onmouseover = () => { killBtn.style.color = 'var(--neon-primary)'; killBtn.style.borderColor = 'var(--neon-primary)'; };
    killBtn.onmouseout = () => { killBtn.style.color = '#fff'; killBtn.style.borderColor = 'transparent'; };
    
    killBtn.onclick = () => { 
        if (id === 'music') {
            let ytContainer = document.getElementById('yt-container');
            let ytPlayer = document.getElementById('yt-player');
            if (ytContainer) ytContainer.style.display = 'none';
            if (ytPlayer) ytPlayer.src = '';
            // local audio kept playing after close
            let la = document.getElementById('local-audio-player'); if (la) { la.pause(); la.removeAttribute('src'); }
            window.isMusicPlaying = false;
        }
        if (id === 'paint.exe' && typeof os.paintReset === 'function') os.paintReset();
        if (id === 'calc.exe' && typeof os.calcReset === 'function') os.calcReset();
        win.classList.add('glitching-out');
        setTimeout(() => { win.remove(); os.focusTop(); }, 350);
    };

    win.querySelector('.min-btn').onclick = () => {
        win.classList.add('to-dock');
        setTimeout(() => { win.classList.remove('to-dock'); win.classList.add('is-min'); os.focusTop(); if (os.sfx) os.sfx('dockIn', { el: win }); }, 190);
    };
    let maxIt = () => {
        win.classList.toggle('is-max');
        // paint forgets its size sometimes, this makes it check again
        if (id === 'paint.exe' && typeof os.resizePaint === 'function') setTimeout(os.resizePaint, 60);
    };
    win.querySelector('.max-btn').onclick = maxIt;
    win.querySelector('.window-header').ondblclick = (e) => { if (!e.target.closest('button')) maxIt(); };

    win.onmousedown = () => { os.focusWin(win); };
    document.getElementById('desktop').appendChild(win);
    os.focusWin(win);
    typeof syncMotion === 'function' && syncMotion();

    if (id === 'info') typeof initTypedBanner === 'function' && initTypedBanner();
    if (id === 'blog') typeof initBlogFilters === 'function' && initBlogFilters();
    if (id === 'blog') typeof populateData === 'function' && populateData('blog', 'blog-container');
    if (id === 'music') typeof populateData === 'function' && populateData('music', 'music-container');

    win.querySelector('.window-body').setAttribute('tabindex', '-1');
    win.querySelector('.window-body').focus();

};

// mouse + touch drag, handled together, should work, I tried to do it myself but it went to fucking shit.
function setupDrag(e) {
    let clientX, clientY;
    
    if (e.type === 'touchstart') {
        if (e.touches.length !== 1) return;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    let target = e.target;
    let isHeader = target.closest(".window-header");
    if (!isHeader) return;
    // the drag was eating the tap so ipad couldnt hit max
    if (target.closest("button")) return;

    let dragElement = target.closest("div[id^='win-']");
    if (!dragElement) return;
    e.preventDefault();

    let rect = dragElement.getBoundingClientRect();
    let dragStartTime = Date.now(); // was going to use this for a "snap back if released too fast" thing, never finished it
    let po = dragElement.offsetParent ? dragElement.offsetParent.getBoundingClientRect() : { left: 0, top: 0 };
    let shiftX = clientX - rect.left + po.left;
    let shiftY = clientY - rect.top + po.top;

    let lastX = clientX, vx = 0, zone = null, ghost = null, freed = false;
    const canSnap = !os.isPhone();
    function snapRect(z) {
        let top = 46, bot = window.innerHeight - 62, w = window.innerWidth;
        if (z === 'max') return [0, top, w, bot - top];
        return [z === 'l' ? 0 : w / 2, top, w / 2, bot - top];
    }
    function moveAt(cx, cy) {
        if (!freed && (dragElement.classList.contains('is-max') || dragElement.classList.contains('snap-l') || dragElement.classList.contains('snap-r'))) {
            if (Math.abs(cx - clientX) < 6 && Math.abs(cy - clientY) < 6) return;
            let k = shiftX / Math.max(1, dragElement.offsetWidth);
            dragElement.classList.remove('is-max', 'snap-l', 'snap-r');
            shiftX = Math.round(dragElement.offsetWidth * k) + po.left; shiftY = 18 + po.top;
            if (dragElement.id === 'win-paint.exe' && typeof os.resizePaint === 'function') setTimeout(os.resizePaint, 60);
        }
        freed = true;
        vx = vx * 0.6 + (cx - lastX) * 0.4; lastX = cx;
        if (canSnap) {
            let z = cy < 18 ? 'max' : cx < 12 ? 'l' : cx > window.innerWidth - 12 ? 'r' : null;
            if (z !== zone) {
                zone = z;
                if (!ghost) { ghost = document.createElement('div'); ghost.className = 'snap-ghost'; document.body.appendChild(ghost); }
                if (z) { let r = snapRect(z); ghost.style.cssText = 'left:' + r[0] + 'px;top:' + r[1] + 'px;width:' + r[2] + 'px;height:' + r[3] + 'px;z-index:' + ((+dragElement.style.zIndex || 100) - 1); ghost.classList.add('on'); }
                else ghost.classList.remove('on');
            }
        }
        dragElement.classList.add('is-dragging');
        dragElement.style.setProperty('--vx', Math.max(-12, Math.min(12, vx)).toFixed(2));
        // you cant lose a window off the edge anymore. RIP to the ones I lost
        let nx = Math.max(80 - dragElement.offsetWidth, Math.min(window.innerWidth - 80, cx - shiftX));
        let ny = Math.max(0, Math.min(window.innerHeight - 60, cy - shiftY));
        dragElement.style.left = nx + 'px';
        dragElement.style.top = ny + 'px';
    }
    
    function onMouseMove(e) {
        let cx, cy;
        if (e.type === 'touchmove') {
            cx = e.touches[0].clientX;
            cy = e.touches[0].clientY;
        } else {
            cx = e.clientX;
            cy = e.clientY;
        }
        moveAt(cx, cy);
    }

    function stopMove() {
        // flung it hard. it does the old telly degauss wobble when it lands
        if (!zone && Math.abs(vx) > 8 && freed && !document.documentElement.classList.contains('reduce-motion')) {
            let w = dragElement; w.classList.remove('dgs'); void w.offsetWidth; w.classList.add('dgs'); setTimeout(() => w.classList.remove('dgs'), 800);
            if (typeof os.sfx === 'function') os.sfx('degauss', { el: w });
        }
        dragElement.classList.remove('is-dragging'); dragElement.style.removeProperty('--vx');
        if (ghost) { let g = ghost; g.classList.remove('on'); setTimeout(() => g.remove(), 250); }
        if (zone) {
            dragElement.classList.add(zone === 'max' ? 'is-max' : 'snap-' + zone);
            if (dragElement.id === 'win-paint.exe' && typeof os.resizePaint === 'function') setTimeout(os.resizePaint, 60);
            if (typeof os.clickAudio === 'function') os.clickAudio();
        }
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', stopMove);
        document.removeEventListener('touchmove', onMouseMove);
        document.removeEventListener('touchend', stopMove);
    }
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', stopMove);
    document.addEventListener('touchmove', onMouseMove, { passive: false });
    document.addEventListener('touchend', stopMove);
}
document.addEventListener("mousedown", (e) => setupDrag(e));
document.addEventListener("touchstart", (e) => setupDrag(e), { passive: false });

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (e.target && e.target.closest && e.target.closest('input, textarea, select')) return;
    let win = document.querySelector('#desktop > div[id^="win-"].is-active:not(.is-min)');
    let x = win && win.querySelector('.kill-btn');
    if (x) x.click();
});

// big fat warning. the little strip was way too polite
const WARN_SIGN = [
    '.......x.......',
    '......xxx......',
    '......xxx......',
    '.....xxkxx.....',
    '.....xxkxx.....',
    '....xxxkxxx....',
    '....xxxkxxx....',
    '...xxxxkxxxx...',
    '...xxxxxxxxx...',
    '..xxxxxkxxxxx..',
    '.xxxxxxxxxxxxx.',
    'xxxxxxxxxxxxxxx'
];
function phoneWarn() {
    let say = (k, d) => (typeof T === 'function' ? T(k, d) : d);
    let w = document.createElement('div');
    w.id = 'phone-warn';
    w.className = 'readable-ui';
    w.setAttribute('role', 'alertdialog');
    w.setAttribute('aria-modal', 'true');
    w.setAttribute('aria-labelledby', 'pw-t');
    let px = '';
    WARN_SIGN.forEach((row, y) => row.split('').forEach((c, x) => { if (c !== '.') px += '<rect x="' + x + '" y="' + y + '" width="1" height="1" class="' + (c === 'k' ? 'k' : (x > 7 ? 's' : 'f')) + '"/>'; }));
    w.innerHTML = '<div class="pw-win"><div class="pw-bar"><b></b><button type="button" class="pw-x" aria-label="close">✕</button></div><i class="pw-haz" aria-hidden="true"></i>'
        + '<div class="pw-body"><svg class="pw-sign" viewBox="0 0 15 12" shape-rendering="crispEdges" aria-hidden="true">' + px + '</svg>'
        + '<h1 id="pw-t"></h1><h2></h2><p class="pw-jp"></p><p class="pw-en"></p><small></small><div class="pw-btns"><button type="button" class="pw-ok"></button></div></div></div>';
    w.querySelector('.pw-bar b').textContent = say('phoneBar', '// warning.exe 【警告】');
    let h = w.querySelector('h1');
    h.textContent = say('phoneHead', 'スマホ非対応');
    w.querySelector('h2').textContent = say('phoneSub', 'ほぼ動きません // MOST OF IT DOESNT WORK');
    let jp = w.querySelector('.pw-jp');
    say('phoneBody', 'このサイトはパソコン用だよ。スマホだと、ほとんどまともに動かない。ごめんね。PCかノートでまた来てね。（iPadならまだマシかも。でもたぶんバグる）').split(/(?<=[、。！？])/).forEach(bit => {
        let s = document.createElement('span'); s.textContent = bit; jp.appendChild(s);
    });
    w.querySelector('.pw-en').textContent = say('phoneNag', 'this site is made for a computer. on a phone most of it just doesnt work lol. come back on a pc or a laptop (or maybe an ipad, its a bit better there but itll still be buggy probs)');
    w.querySelector('small').textContent = say('phoneNagJp', 'スマホかよ… まあいいけど。画面ちっちゃ (￢_￢;)');
    let ok = w.querySelector('.pw-ok');
    ok.textContent = say('phoneNagOk', '[ 仕方ないな / fine ]');
    const bye = () => { if (typeof os.clickAudio === 'function') os.clickAudio(); w.classList.add('bye'); setTimeout(() => w.remove(), 260); };
    ok.onclick = bye;
    w.querySelector('.pw-x').onclick = bye;
    document.body.appendChild(w);
    setTimeout(() => { h.classList.add('jit'); try { ok.focus({ preventScroll: true }); } catch (e) {} }, 320);
}

window.onload = () => {
    if (os.mobileish()) {
        // used to be an alert() but that was evil even for me
        let seenPhone = false;
        try { seenPhone = sessionStorage.getItem('vmp_phone') === '1'; sessionStorage.setItem('vmp_phone', '1'); } catch (e) {}
        // ipads work now, so the big scary one is phones only. tablets just get a little note
        if (!seenPhone) { if (os.isPhone()) phoneWarn(); else setTimeout(() => { if (typeof os.notify === 'function') os.notify((typeof T === 'function' ? T : (k, d) => d)('tabletNote', 'iPadでもだいたい動くよ。でもやっぱりPCがいちばん // works on an ipad mostly. a computer is still best'), null, 7000); }, 2500); }
    }
    
    os.setTheme(savedTheme()); 
    os.summon('info'); 
    typeof initBlinkieMarquee === 'function' && initBlinkieMarquee();
    typeof initTicker === 'function' && initTicker();
    typeof initCpuTracker === 'function' && initCpuTracker();
    typeof initUptime === 'function' && initUptime();
};
