
window.os = window.os || {};

(function () {
    const done = {}, busy = {};
    function load(f) {
        if (done[f]) return Promise.resolve();
        if (busy[f]) return busy[f];
        return (busy[f] = new Promise((res, rej) => {
            const add = () => {
                let s = document.createElement('script');
                s.src = f;
                s.onload = () => { done[f] = 1; res(); };
                s.onerror = () => { delete busy[f]; rej(new Error('could not load ' + f)); };
                document.head.appendChild(s);
            };
            if (location.protocol === 'file:' || typeof fetch !== 'function') { add(); return; }
            fetch(f, { cache: 'no-cache' }).then(add, add);
        }));
    }
    os.need = files => [].concat(files).reduce((p, f) => p.then(() => load(f)), Promise.resolve());
    os.loaded = f => !!done[f];
    // chuck a script so it loads fresh next time
    os.unneed = files => [].concat(files).forEach(f => {
        delete done[f]; delete busy[f];
        document.querySelectorAll('script[src="' + f + '"]').forEach(s => s.remove());
    });
    os.lazy = {
        'paint.exe': ['paint_app.js', 'paint_xform.js', 'paint_pro.js', 'paint_more.js'],
        'calc.exe': ['calc_app.js'],
        files: ['files_app.js'],
        'gallery.exe': ['gallery_tv.js', 'gallery_app.js'],
        'timer.exe': ['timer_app.js'],
        'copier.exe': ['copier_app.js'],
        'duck.exe': ['duck_app.js'],
        'games.exe': ['games_app.js'],
        'noisebox.exe': ['noisebox_fx.js', 'noisebox_sound.js', 'noisebox_audio.js', 'noisebox_vis.js', 'noisebox_lang.js', 'noisebox_lang_book.js', 'noisebox_app.js', 'noisebox_edit.js', 'noisebox_browse.js', 'noisebox_route.js', 'noisebox_roll.js', 'noisebox_rack.js', 'noisebox_meters.js', 'noisebox_shell.js']
    };
    if (typeof os.summon === 'function') {
        const base = os.summon.bind(os);
        os.summon = function (id) {
            let files = os.lazy[id];
            if (files && !files.every(f => done[f]) && !document.getElementById(id) && !document.getElementById('win-' + id)) {
                os.need(files).then(() => os.summon(id)).catch(e => { if (typeof os.notify === 'function') os.notify('⚠ ' + e.message, null, 6000); });
                return;
            }
            return base(id);
        };
    }
    function stubs() {
        let cm = document.getElementById('custom-context-menu');
        if (cm && !document.getElementById('ctx-paint')) {
            let it = document.createElement('div'); it.id = 'ctx-paint'; it.className = 'context-item'; it.setAttribute('role', 'menuitem'); it.setAttribute('tabindex', '0');
            it.textContent = '[ ペイントを開く ]';
            it.onclick = () => { os.summon('paint.exe'); if (os.clickAudio) os.clickAudio(); };
            it.onkeydown = e => { if (e.key === 'Enter') it.click(); };
            cm.insertBefore(it, cm.firstChild);
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', stubs); else stubs();
})();
