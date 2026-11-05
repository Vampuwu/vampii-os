window.os = window.os || {};

(function () {
    const $ = id => document.getElementById(id);
    const list = () => (typeof database !== 'undefined' && database.music) || [];
    const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
    const esc = t => String(t == null ? '' : t);
    let cur = null, idx = -1, st = 'stop', time = 0, dur = 0, stamp = 0, muted = false, raf = 0, ytBound = false;

    function thumb(t) { return t ? (t.coverImg || (t.videoId ? 'https://i.ytimg.com/vi/' + encodeURIComponent(t.videoId) + '/hqdefault.jpg' : '')) : ''; }

    // the scrolly bit up top
    function details(t) {
        let d = t.duration && t.duration !== '?' ? t.duration : (dur ? fmt(dur) : '');
        let bits = ['▶ NOW PLAYING', esc(t.title || '???') + (t.artist ? ' - ' + t.artist : '')];
        if (d) bits.push('⏱ ' + d);
        if (t.date) bits.push(t.date);
        if (t.desc) bits.push(String(t.desc).replace(/<[^>]*>/g, ''));
        bits.push(t.videoId ? 'via YouTube' : 'local file');
        let n = list().length;
        if (n > 1) bits.push('TRACK ' + (idx + 1) + ' / ' + n);
        return '// ' + bits.join(' // ') + ' //';
    }

    function paint() {
        document.dispatchEvent(new CustomEvent('vmp-deck'));
        let deck = $('np-deck');
        if (!deck) return;
        let labels = { play: T('musicPlaying', '▶ ON AIR'), pause: T('musicPaused', '❚❚ PAUSED'), stop: T('musicStopped', '■ STOPPED'), load: T('musicLoading', '… LOADING'), end: T('musicEnd', '■ END') };
        $('np-state').textContent = labels[st] || labels.stop;
        deck.dataset.st = st;
        let win = $('win-music');
        if (win) win.classList.toggle('np-live', st === 'play');
        let p = deck.querySelector('.np-play');
        p.textContent = st === 'play' ? '❚❚' : '▶';
        p.setAttribute('aria-label', st === 'play' ? 'pause' : 'play');
        deck.querySelector('.np-mute').classList.toggle('off', muted);
        deck.querySelector('.np-mute').textContent = muted ? 'MUTE' : 'VOL';
        tick();
    }
    function tick() {
        let bar = $('np-bar');
        if (!bar) return;
        let t = time + (st === 'play' && stamp ? (performance.now() - stamp) / 1000 : 0);
        if (dur) t = Math.min(t, dur);
        let k = dur ? t / dur : 0;
        bar.style.setProperty('--k', (k * 100).toFixed(2) + '%');
        bar.setAttribute('aria-valuenow', Math.round(k * 100));
        $('np-cur').textContent = fmt(t);
        $('np-dur').textContent = dur ? fmt(dur) : (cur && cur.duration && cur.duration !== '?' ? cur.duration : '0:00');
    }
    function loop() {
        cancelAnimationFrame(raf);
        const go = () => { if (!$('np-deck')) { raf = 0; return; } tick(); raf = requestAnimationFrame(go); };
        raf = requestAnimationFrame(go);
    }

    function fill(t) {
        let deck = $('np-deck');
        if (!deck) return;
        let img = $('np-thumb'), art = thumb(t);
        if (art) { img.src = art; img.hidden = false; } else { img.hidden = true; img.removeAttribute('src'); }
        deck.style.setProperty('--np-art', art ? 'url("' + art.replace(/"/g, '%22') + '")' : 'none');
        $('np-title').textContent = t ? (t.title || '???') : '- - -';
        $('np-artist').textContent = t ? (t.artist || '') : T('musicPick', 'pick a track');
        let chips = $('np-chips');
        chips.textContent = '';
        if (t) {
            [t.duration && t.duration !== '?' ? '⏱ ' + t.duration : '', t.date || '', t.videoId ? 'YOUTUBE' : (t.audioSrc ? 'LOCAL' : ''), list().length > 1 ? (idx + 1) + ' / ' + list().length : ''].filter(Boolean).forEach(c => {
                let s = document.createElement('span'); s.textContent = c; chips.appendChild(s);
            });
        }
        let yt = $('np-yt');
        if (t && t.videoId) { yt.href = 'https://www.youtube.com/watch?v=' + encodeURIComponent(t.videoId); yt.hidden = false; } else yt.hidden = true;
        document.querySelectorAll('#music-container .post-music').forEach(r => {
            r.classList.toggle('playing', +r.dataset.i === idx);
            let pill = r.querySelector('.meta-pill');
            if (+r.dataset.i === idx && dur && t && (!t.duration || t.duration === '?') && pill) pill.textContent = '⏱ ' + fmt(dur);
        });
        let np = $('now-playing-text');
        if (np && t) np.textContent = details(t);
    }

    // talking to the youtube player. it has a secret message thing you can use without loading their whole api
    function send(func, args) {
        let f = $('yt-player');
        if (f && f.contentWindow && f.src) f.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args: args || [] }), '*');
    }
    function listen() {
        let f = $('yt-player');
        if (!f || !f.contentWindow) return;
        f.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*');
        send('addEventListener', ['onStateChange']);
    }
    function bindYt() {
        let f = $('yt-player');
        if (!f || f._np) return;
        f._np = true;
        f.addEventListener('load', () => { if (f.src) { listen(); setTimeout(listen, 600); setTimeout(listen, 1500); } });
    }
    if (!ytBound) {
        ytBound = true;
        window.addEventListener('message', e => {
            if (!/youtube(-nocookie)?\.com$/.test(String(e.origin).replace(/^https?:\/\//, '').replace(/^www\./, ''))) return;
            // console.log('yt says', d);
            let d; try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (x) { return; }
            if (!d || !cur || !cur.videoId) return;
            let info = d.info;
            if (d.event === 'onStateChange') info = { playerState: d.info };
            if (!info || typeof info !== 'object') return;
            let was = st, durWas = dur;
            if (typeof info.duration === 'number' && info.duration > 0) dur = info.duration;
            if (typeof info.currentTime === 'number') { time = info.currentTime; stamp = performance.now(); }
            if (typeof info.muted === 'boolean') muted = info.muted;
            if (typeof info.playerState === 'number') {
                st = { '-1': 'load', 0: 'end', 1: 'play', 2: 'pause', 3: 'load', 5: 'stop' }[info.playerState] || st;
                if (st !== 'play') { stamp = 0; }
                else if (!stamp) stamp = performance.now();
                if (info.playerState === 0 && was !== 'end') auto();
            }
            if (!durWas && dur && (!cur.duration || cur.duration === '?')) { let np = $('now-playing-text'); if (np) np.textContent = details(cur); fill(cur); }
            if (was !== st || typeof info.muted === 'boolean') paint(); else tick();
        });
    }

    function local() { return $('local-audio-player'); }
    function bindLocal() {
        let a = local();
        if (!a || a._np) return;
        a._np = true;
        a.addEventListener('timeupdate', () => { if (!cur || cur.videoId) return; time = a.currentTime; stamp = a.paused ? 0 : performance.now(); tick(); });
        a.addEventListener('loadedmetadata', () => { if (!cur || cur.videoId) return; dur = a.duration || 0; fill(cur); paint(); });
        a.addEventListener('play', () => { if (cur && !cur.videoId) { st = 'play'; stamp = performance.now(); paint(); } });
        a.addEventListener('pause', () => { if (cur && !cur.videoId && !a.ended) { st = 'pause'; stamp = 0; paint(); } });
        a.addEventListener('ended', () => { if (cur && !cur.videoId) { st = 'end'; paint(); auto(); } });
        a.addEventListener('volumechange', () => { if (cur && !cur.videoId) { muted = a.muted; paint(); } });
    }

    // plays the next one when a song ends
    function auto() { if (list().length > 1) setTimeout(() => go(idx + 1), 700); }
    function go(i) {
        let L = list();
        if (!L.length) return;
        i = ((i % L.length) + L.length) % L.length;
        if (typeof os.clickAudio === 'function') os.clickAudio();
        os.playTrack(L[i]);
    }

    function toggle() {
        if (!cur) return;
        let a = local();
        if (st === 'end') return go(idx);
        if (cur.videoId) { send(st === 'play' ? 'pauseVideo' : 'playVideo'); st = st === 'play' ? 'pause' : 'play'; if (st === 'play') stamp = performance.now(); else { time += stamp ? (performance.now() - stamp) / 1000 : 0; stamp = 0; } paint(); }
        else if (a) { if (a.paused) a.play().catch(() => {}); else a.pause(); }
    }
    // for the tray. never a second player
    os.deckCtl = {
        get: () => ({ st, cur, idx, open: !!$('win-music') }),
        toggle, next: () => go(idx + 1), prev: () => go((idx < 0 ? 0 : idx) - 1)
    };

    os.deck = function (t) {
        cur = t; idx = list().indexOf(t); time = 0; dur = 0; stamp = 0; st = 'load';
        bindYt(); bindLocal();
        fill(t); paint(); loop();
        // if youtube never answers just assume its playing. it does that sometimes
        if (t.videoId) setTimeout(() => { if (cur === t && st === 'load') { st = 'play'; stamp = performance.now(); paint(); } }, 4000);
    };

    function wire() {
        let deck = $('np-deck');
        if (!deck || deck._np) return;
        deck._np = true;
        bindYt(); bindLocal();
        deck.addEventListener('click', e => {
            let b = e.target.closest('[data-np]');
            if (!b) return;
            let k = b.dataset.np, a = local();
            if (k === 'prev') return go((idx < 0 ? 0 : idx) - 1);
            if (k === 'next') return go(idx + 1);
            if (!cur) { if (k === 'play') go(0); return; }
            if (typeof os.clickAudio === 'function') os.clickAudio();
            if (k === 'play') toggle();
            if (k === 'mute') {
                muted = !muted;
                if (cur.videoId) send(muted ? 'mute' : 'unMute'); else if (a) a.muted = muted;
                paint();
            }
        });
        let bar = $('np-bar');
        const seek = k => {
            if (!cur || !dur) return;
            let s = Math.max(0, Math.min(1, k)) * dur;
            if (cur.videoId) send('seekTo', [s, true]); else if (local()) local().currentTime = s;
            time = s; stamp = st === 'play' ? performance.now() : 0; tick();
        };
        bar.addEventListener('pointerdown', e => {
            let r = bar.getBoundingClientRect();
            const at = ev => seek((ev.clientX - r.left) / r.width);
            at(e);
            const mv = ev => at(ev), up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); };
            document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
        });
        bar.addEventListener('keydown', e => {
            if (!dur) return;
            let t = time + (stamp ? (performance.now() - stamp) / 1000 : 0);
            if (e.key === 'ArrowRight') { seek((t + 5) / dur); e.preventDefault(); }
            if (e.key === 'ArrowLeft') { seek((t - 5) / dur); e.preventDefault(); }
        });
        if (cur && $('win-music')) { fill(cur); paint(); loop(); }
        else {
            let first = list()[0], img = $('np-thumb'), art = thumb(first);
            if (art) { img.src = art; img.hidden = false; deck.style.setProperty('--np-art', 'url("' + art.replace(/"/g, '%22') + '")'); }
            paint();
        }
    }

    document.addEventListener('error', e => {
        let img = e.target;
        if (!img || img.tagName !== 'IMG') return;
        if (img.id === 'np-thumb') { img.hidden = true; let d = $('np-deck'); if (d) d.style.setProperty('--np-art', 'none'); return; }
        if (img.classList.contains('track-cover')) {
            let box = document.createElement('div');
            box.className = 'track-cover track-nocover'; box.setAttribute('aria-hidden', 'true'); box.textContent = '♪';
            img.replaceWith(box);
        }
    }, true);

    const baseSummon = os.summon;
    os.summon = function (id) {
        let had = !!$('win-music'), r = baseSummon.apply(os, arguments);
        if (id === 'music') { if (!had) { cur = null; idx = -1; st = 'stop'; time = dur = stamp = 0; } wire(); }
        return r;
    };
})();
