
(function () {
    const KEY = 'vmp_nb_lang';
    let mode = 'both'; try { mode = localStorage.getItem(KEY) || 'both'; } catch (e) {}
    if (['both', 'en', 'jp'].indexOf(mode) < 0) mode = 'both';
    const cjk = /[぀-ヿ㐀-鿿ｦ-ﾟ]/;
    const JP = Object.create(null), EN = Object.create(null), KEEP = new Set(), miss = new Set();
    const low = s => s.toLowerCase();
    // translation stuff. numbers get swapped back in after
    const RULES = [];
    function look(s) {
        if (s in JP) return JP[s]; let l = low(s); if (l in JP) return JP[l];
        let nums = s.match(/\d+(\.\d+)?/g); if (nums) { let k = s.replace(/\d+(\.\d+)?/g, '#'); if (k in JP) { let i = 0; return JP[k].replace(/#/g, () => nums[i++] || ''); } }
        for (const [re, f] of RULES) { let m = s.match(re); if (m) { let r = f(m, look); if (r != null) return r; } }
        let F = firstOf(); if (s in F) return F[s]; if (l in F) return F[l];
        return null;
    }
    let FIRST = null;
    function firstOf() {
        if (FIRST) return FIRST; FIRST = Object.create(null);
        for (const k in JP) { let i = k.indexOf('. '); if (i < 4) continue; let e = k.slice(0, i), j = String(JP[k]).split('。')[0]; if (j !== JP[k] && !(e in FIRST)) FIRST[e] = j; }
        return FIRST;
    }
    const UNITS = /^[\s\d.,:+\-±×÷%/∞()]*(hz|khz|k|ms|s|db|st|c|bpm|lu|lufs|x|oct|kb|mb)?[\s\d.,:+\-±×÷%/∞()]*$/i;

    function bit(s) {
        if (!s.trim()) return s;
        let a = s.match(/^\s*/)[0], z = s.match(/\s*$/)[0], t = s.trim();
        if (KEEP.has(t) && (mode === 'jp' || !cjk.test(t))) return s;
        if (mode === 'jp') {
            let j = look(t); if (j != null) return a + j + z;
            if (KEEP.has(t.replace(/^[❄☀]\s*/, '').replace(/\s*[›▸▾⇩]$/, ''))) return s;
            if (!/[a-z]{2}/i.test(t) || UNITS.test(t)) return s;
            let m = t.match(/^([^a-zA-Z]*[぀-ヿ㐀-鿿][^a-zA-Z]*?)\s+([A-Za-z0-9][^぀-ヿ㐀-鿿]*)$/);
            if (m) { let j2 = look(m[2]); return a + (j2 != null ? j2 : m[1]) + z; }
            if (cjk.test(t)) return s;
            miss.add(t); return s;
        }
        if (!cjk.test(t)) return s;
        if (t in EN) return a + EN[t] + z;
        let m = t.match(/^([^a-zA-Z\u3040-\u30ff\u3400-\u9fff]*)[^a-zA-Z]*?[\u3040-\u30ff\u3400-\u9fff][^a-zA-Z]*?\s+([A-Za-z0-9].*)$/);
        if (m && !cjk.test(m[2])) return a + m[1] + m[2] + z;
        let s2 = t.replace(/[\u3040-\u30ff\u3400-\u9fff]+\s+(?=[A-Z0-9])/g, '');
        if (s2 !== t && !cjk.test(s2)) return a + s2 + z;
        miss.add(t); return s;
    }
    function half(s) {
        let i = s.indexOf(' // '); if (i < 0) return bit(s);
        let L = s.slice(0, i), R = s.slice(i + 4);
        let jpLeft = cjk.test(L) && !cjk.test(R), jpRight = cjk.test(R) && !cjk.test(L);
        if (!jpLeft && !jpRight) return bit(L) + ' // ' + bit(R);
        let J = jpLeft ? L : R, E = jpLeft ? R : L;
        if (mode === 'jp') return J;
        let k = J.search(cjk), pre = k > 0 ? J.slice(0, k) : '';
        if (pre.trim() && E.indexOf(pre.trim()) !== 0) return pre + E.trimStart();
        return (J.match(/^\s*/)[0]) + E;
    }
    function tr(s) {
        if (mode === 'both' || s == null) return s;
        s = String(s); if (!s.trim()) return s;
        let w = mode === 'jp' ? look(s.trim()) : EN[s.trim()]; if (w != null) return s.match(/^\s*/)[0] + w + s.match(/\s*$/)[0];
        let parts = s.split(' · ');
        if (mode === 'en') parts = parts.filter((q, i, a) => { if (!(cjk.test(q) && !/[a-z]/i.test(q) && q.trim().length <= 3 && a[i + 1])) return true; let n = a[i + 1]; if (cjk.test(n)) { let was = new Set(miss); n = half(n); miss.forEach(x => { if (!was.has(x)) miss.delete(x); }); } return !(!cjk.test(n) && /[a-z]/i.test(n)); });
        return parts.map(half).join(' · ');
    }

    const ORIG = new WeakMap(), OUT = new WeakMap(), ATTR = ['title', 'placeholder'];
    function node(n) {
        if (n.nodeType === 3) {
            let p = n.parentNode; if (!p || p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE' || p.nodeName === 'TEXTAREA' || (p.closest && p.closest('[data-nolang]'))) return;
            let cur = n.nodeValue; if (OUT.get(n) === cur) return;
            ORIG.set(n, cur); let o = tr(cur); OUT.set(n, o); if (o !== cur) n.nodeValue = o;
        } else if (n.nodeType === 1) {
            if (n.closest && n.closest('[data-nolang]')) return;
            ATTR.forEach(a => { if (!n.hasAttribute(a)) return; let cur = n.getAttribute(a), k = 'l' + a; if (n.dataset[k + 'o'] === cur) return; n.dataset[k] = cur; let o = tr(cur); n.dataset[k + 'o'] = o; if (o !== cur) n.setAttribute(a, o); });
            if (n.nodeName === 'INPUT' && (n.type === 'button' || n.type === 'submit')) { let v = n.value, o = tr(v); if (o !== v) n.value = o; }
            for (let c = n.firstChild; c; c = c.nextSibling) node(c);
        }
    }
    function undoNode(n) {
        if (n.nodeType === 3) { if (ORIG.has(n) && OUT.get(n) === n.nodeValue) n.nodeValue = ORIG.get(n); OUT.delete(n); ORIG.delete(n); }
        else if (n.nodeType === 1) { ATTR.forEach(a => { let k = 'l' + a; if (n.dataset[k] != null) { if (n.getAttribute(a) === n.dataset[k + 'o']) n.setAttribute(a, n.dataset[k]); delete n.dataset[k]; delete n.dataset[k + 'o']; } }); for (let c = n.firstChild; c; c = c.nextSibling) undoNode(c); }
    }
    const roots = new Map();
    function watch(root) {
        if (!root || roots.has(root)) return;
        let mo = new MutationObserver(list => { if (mode === 'both') return; list.forEach(m => { if (m.type === 'characterData') node(m.target); else if (m.type === 'attributes') node(m.target); else m.addedNodes.forEach(node); }); });
        mo.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTR });
        roots.set(root, mo); if (mode !== 'both') node(root);
    }
    function set(m) {
        if (['both', 'en', 'jp'].indexOf(m) < 0) return;
        roots.forEach((mo, r) => undoNode(r));
        mode = m; try { localStorage.setItem(KEY, m); } catch (e) {}
        mark();
        roots.forEach((mo, r) => { if (!r.isConnected) { mo.disconnect(); roots.delete(r); return; } if (mode !== 'both') node(r); });
    }
    function mark() { try { document.documentElement.dataset.nbl = mode; } catch (e) {} }
    mark();
    const rule = (re, f) => RULES.push([re, f]);
    const add = (book, rev) => { FIRST = null; Object.keys(book).forEach(k => { JP[k] = book[k]; }); if (rev) Object.keys(rev).forEach(k => { EN[k] = rev[k]; }); };
    window.NBL = { mode: () => mode, set, t: tr, watch, add, rule, once: n => { if (mode !== 'both') node(n); }, keep: list => list.forEach(x => KEEP.add(x)), miss, JP, EN,
        next: () => ({ both: 'en', en: 'jp', jp: 'both' })[mode], label: () => ({ both: '語 JP+EN', en: '語 EN', jp: '語 日本語' })[mode] };
})();
