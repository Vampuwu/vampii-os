// where paint + the flipbook keep stuff. its all on your machine, i cant see any of it dw
window.os = window.os || {};

(function () {
    const DB = 'vmp_files';
    let dbp = null;
    function open() {
        if (dbp) return dbp;
        dbp = new Promise((res, rej) => {
            try {
                let q = indexedDB.open(DB, 1);
                q.onupgradeneeded = () => { let d = q.result; ['things', 'bin'].forEach(n => { if (!d.objectStoreNames.contains(n)) d.createObjectStore(n, { keyPath: 'id' }); }); };
                q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error);
            } catch (e) { rej(e); }
        });
        dbp.catch(() => { dbp = null; });
        return dbp;
    }
    const run = (st, mode, fn) => open().then(d => new Promise((res, rej) => {
        let t = d.transaction(st, mode), r = fn(t.objectStore(st)), out;
        if (r) r.onsuccess = () => { out = r.result; };
        t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    }));
    const nid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const ping = rec => { try { document.dispatchEvent(new CustomEvent('vmp-files', { detail: rec || {} })); } catch (e) {} };

    function thumb(src, max) {
        max = max || 160;
        let w = src.width || 1, h = src.height || 1, k = Math.min(1, max / Math.max(w, h));
        let c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
        let x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, c.width, c.height);
        try { return c.toDataURL('image/webp', 0.8); } catch (e) { return c.toDataURL(); }
    }

    os.files = {
        put(rec) {
            rec = Object.assign({ id: nid(), at: Date.now() }, rec);
            rec.size = rec.blob ? rec.blob.size : (rec.size || 0);
            return run('things', 'readwrite', s => s.put(rec)).then(() => { ping(rec); return rec.id; });
        },
        all: () => run('things', 'readonly', s => s.getAll()).then(a => a || []).catch(() => []),
        get: id => run('things', 'readonly', s => s.get(id)),
        drop: id => run('things', 'readwrite', s => s.delete(id)).then(() => ping()),
        rename(id, name) { return os.files.get(id).then(r => { if (!r) return; r.name = name; return run('things', 'readwrite', s => s.put(r)).then(() => ping(r)); }); },
        // the bin takes anything, files/ sorts out putting it back
        bin: {
            put: rec => run('bin', 'readwrite', s => s.put(Object.assign({ id: nid(), at: Date.now() }, rec))).then(() => ping()),
            all: () => run('bin', 'readonly', s => s.getAll()).then(a => a || []).catch(() => []),
            drop: id => run('bin', 'readwrite', s => s.delete(id)).then(() => ping()),
            empty: () => run('bin', 'readwrite', s => s.clear()).then(() => ping())
        },
        thumb, ping,
        told(what) {
            if (typeof os.notify !== 'function') return;
            os.notify(what + ' → files/', () => { if (os.summon) os.summon('files'); }, 3600);
        }
    };

    // icon does a hop when something lands in it
    document.addEventListener('vmp-files', e => {
        if (!e.detail || !e.detail.id) return;
        let ic = document.querySelector('.icon-wrap[data-app="files"] .icon-emoji'); if (!ic) return;
        ic.classList.remove('fx-hop'); void ic.offsetWidth; ic.classList.add('fx-hop');
    });
})();
