
(function () {
    const TL = s => window.NBL ? NBL.t(s) : s;
    const X = window.NBX;
    const RS = { drawer: 0, view: {} }; try { RS.view = JSON.parse(localStorage.getItem('vmp_nb_view') || '{}') || {}; } catch (e) {}
    let FOLD = {}; try { FOLD = JSON.parse(localStorage.getItem('vmp_nb_fold') || '{}') || {}; } catch (e) {}
    const saveFold = () => { try { localStorage.setItem('vmp_nb_fold', JSON.stringify(FOLD)); } catch (e) {} };
    const kj = s => { let b = X.el('b', '', s); b.dataset.nolang = 1; return b; };
    const SZ = new WeakMap(), RO = window.ResizeObserver ? new ResizeObserver(es => es.forEach(e => SZ.set(e.target, [e.contentRect.width, e.contentRect.height]))) : null;
    const csz = cv => { let z = SZ.get(cv); if (z) return z; if (!RO) return [cv.clientWidth, cv.clientHeight]; if (z === undefined) { SZ.set(cv, null); RO.observe(cv); } return null; };
    X.csz = csz;
    function styles() {
        if (document.getElementById('nb-rack-style')) return;
        let st = document.createElement('style'); st.id = 'nb-rack-style';
        st.textContent = `
        .nb-plate { position: relative; border-radius: 6px; padding: 10px 12px 10px; margin-bottom: 8px; border: 1px solid rgba(0,0,0,0.6); box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 3px 10px rgba(0,0,0,0.5); color: #eee; }
        .nb-plate::before, .nb-plate::after { content: ''; position: absolute; top: 6px; width: 7px; height: 7px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #9a95a0, #2a262e 70%); }
        .nb-plate::before { left: 6px; } .nb-plate::after { right: 6px; }
        .nb-ph { display: flex; align-items: baseline; gap: 8px; margin: 0 0 6px 10px; }
        .nb-ph b { font-size: 26px; line-height: 1; font-family: serif; text-shadow: 0 2px 0 rgba(0,0,0,0.5); }
        .nb-ph span { font-weight: bold; letter-spacing: 3px; font-size: 12px; }
        .nb-ph small { opacity: 0.6; font-size: 10px; }
        .nb-pbody { display: flex; gap: 10px; align-items: flex-start; flex-wrap: wrap; }
        .nb-scr.nb-vowel { width: 214px; height: 184px; flex: 0 0 auto; background: #070205; }
        @media (max-width: 760px) { .nb-pbody > .nb-scr.nb-vowel { flex: 1 1 100%; width: auto; max-width: 100%; height: 210px; } }
        .nb-scr.nb-seq { display: block; width: 100%; max-width: 520px; height: 76px; cursor: crosshair; margin-top: 6px; flex: 1 1 100%; }
        .nb-smprow { flex-wrap: wrap; gap: 4px; margin-top: 4px; }
        .nb-scr.nb-idraw { width: 360px; height: 120px; flex: 0 0 auto; max-width: 100%; }
        .nb-puprows { display: flex; flex-direction: column; gap: 2px; margin-top: 4px; } .nb-puprow { gap: 4px; align-items: center; } .nb-pupk { font: bold 10px 'Courier New', monospace; opacity: 0.8; width: 26px; } .nb-puprow .nb-btn { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .nb-irrow { gap: 4px; align-items: center; flex-wrap: wrap; margin-top: 4px; } .nb-irname { font: bold 10px 'Courier New', monospace; opacity: 0.85; margin-right: 4px; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .nb-mawrow { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; flex: 1 1 100%; margin: 2px 0 6px; } .nb-mawname { font: bold 10px 'Courier New', monospace; color: inherit; opacity: 0.85; margin-right: 6px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .nb-scr.nb-smap { width: 224px; height: 430px; flex: 0 0 auto; background: #050806; position: sticky; top: 4px; }
        .nb-groups.nb-mason { display: block; column-width: 236px; column-gap: 8px; }
        .nb-mason > .nb-grp { break-inside: avoid; margin: 0 0 8px; display: block; width: 100%; box-sizing: border-box; }
        .nb-mason > .nb-grp-wide { column-span: all; }
        @media (max-width: 760px) { .nb-pbody > .nb-scr.nb-smap { flex: 1 1 100%; width: auto; max-width: 100%; height: 420px; position: static; } .nb-pbody > .nb-groups { flex: 1 1 100%; } .nb-groups { grid-template-columns: minmax(0, 1fr); } .nb-groups.nb-mason { column-width: auto; column-count: 1; } }
        .nb-scr { background: #050806; border: 2px solid rgba(0,0,0,0.7); border-radius: 4px; box-shadow: inset 0 0 12px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.1); display: block; }
        .face-coffin { background: repeating-linear-gradient(90deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 9px), linear-gradient(#3a2416, #1e120b); }
        .face-bone { background: linear-gradient(#e6dccb, #b9ad97); color: #2a1d18; } .face-bone .nb-k span { opacity: 0.85; }
        .face-flesh { background: radial-gradient(ellipse at 30% 0%, #7a3a44, #3b1219 70%); }
        .face-sump { background: repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0 1px, transparent 1px 6px), linear-gradient(#26302a, #0e1411); }
        .face-mist { background: radial-gradient(circle at 70% 20%, rgba(200,190,255,0.25), transparent 60%), linear-gradient(#2a2638, #13111c); }
        .face-grit { background: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px) 0 0 / 5px 5px, linear-gradient(#2c2c30, #141416); }
        .face-throat { background: radial-gradient(ellipse at 50% 120%, #5a1020, #1a0508 70%); }
        .face-rust { background: radial-gradient(circle at 20% 30%, rgba(200,90,30,0.4), transparent 40%), radial-gradient(circle at 80% 70%, rgba(150,60,20,0.35), transparent 45%), linear-gradient(#4a2c1c, #22140c); }
        .face-steel { background: repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 3px), linear-gradient(#5d6066, #2e3034); }
        .face-enamel { background: linear-gradient(#f2efe8, #cfcac0); color: #3a0d10; } .face-enamel .nb-ph b { color: #b3121d; }
        .face-rubber { background: radial-gradient(ellipse at 30% 0%, rgba(255,255,255,0.18), transparent 50%), linear-gradient(#18161a, #070607); }
        .face-char { background: radial-gradient(circle at 50% 110%, rgba(255,110,30,0.55), transparent 55%), linear-gradient(#2a1a12, #0a0605); }
        .face-tape { background: linear-gradient(#d8ccae, #a8987a); color: #2b1d12; }
        .face-stone { background: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 2px) 0 0 / 7px 7px, linear-gradient(#2b3340, #10141b); }
        .face-velvet { background: radial-gradient(ellipse at 40% 10%, rgba(255,255,255,0.12), transparent 50%), linear-gradient(#4a1c4f, #1e0921); }
        .face-chrome { background: linear-gradient(160deg, #e8edf2 0%, #7b828a 35%, #f4f7fa 55%, #5c636b 80%, #c9ced4 100%); color: #111; }
        .face-iron { background: repeating-linear-gradient(90deg, #111 0 6px, #2b2b2e 6px 9px, #111 9px 22px), #111; }
        .face-matte { background: linear-gradient(#1b1b1d, #0d0d0e); }
        .face-glass { background: linear-gradient(135deg, rgba(255,60,90,0.35), rgba(80,60,255,0.3) 40%, rgba(255,200,60,0.3) 70%, rgba(60,255,180,0.25)), linear-gradient(#140f1a, #070509); }
        .face-chrome .nb-k span, .face-tape .nb-k span, .face-enamel .nb-k span { opacity: 0.9; }
        .nb-rack { display: flex; flex-wrap: wrap; gap: 10px 8px; padding: 9px 2px 6px; align-items: flex-start; }
        .nb-fxc { flex: none; width: 272px; margin: 0; }
        .nb-fxs:empty { display: none; }
        .face-steel .nb-kn, .face-chrome .nb-kn { background: radial-gradient(circle at 38% 30%, #f4f4f6, #9a9ca2 45%, #3c3e44 75%); }
        .face-steel .nb-kn i, .face-chrome .nb-kn i { background: #111; box-shadow: none; }
        .face-enamel .nb-kn, .face-bone .nb-kn, .face-tape .nb-kn { background: radial-gradient(circle at 38% 30%, #fffdf6, #d8d0bf 50%, #8a8070 85%); }
        .face-enamel .nb-kn i, .face-bone .nb-kn i, .face-tape .nb-kn i { background: #9a121c; box-shadow: none; }
        .face-char .nb-kn { background: radial-gradient(circle at 38% 30%, #ff9a50, #8a2c08 55%, #2a0c04 85%); }
        .face-glass .nb-kn { background: radial-gradient(circle at 38% 30%, #ffffff, #b6a6ff 35%, #3a1f6a 80%); }
        .face-velvet .nb-kn { background: radial-gradient(circle at 38% 30%, #ffd8ff, #a03ab0 45%, #300838 85%); }
        .face-rust .nb-kn { background: radial-gradient(circle at 38% 30%, #f0c08a, #8a4a20 50%, #2a1206 85%); }
        .face-iron .nb-kn, .face-matte .nb-kn, .face-rubber .nb-kn { background: radial-gradient(circle at 38% 30%, #5a5a60, #1a1a1d 55%, #050505); }
        .face-coffin .nb-kn { background: radial-gradient(circle at 38% 30%, #e8d2a8, #7a5a34 50%, #2a1a0c 85%); }
        .nb-fxc.off { filter: grayscale(0.8) brightness(0.6); }
        .nb-fxh { display: flex; align-items: center; gap: 6px; margin: 0 4px 4px 10px; }
        .nb-fxc.nb-new { animation: nbnew 0.8s ease-out; } @keyframes nbnew { from { box-shadow: 0 0 0 2px var(--a), 0 0 24px var(--a); } }
        .nb-fxb { display: flex; flex-wrap: wrap; gap: 4px; margin: 0 4px 7px 10px; }
        .nb-fxb .nb-btn { padding: 1px 7px; font-size: 10px; }
        .nb-fxh b { font-family: serif; font-size: 20px; } .nb-fxh span { font-weight: bold; letter-spacing: 2px; font-size: 11px; flex: 1; min-width: 0; overflow-wrap: anywhere; line-height: 1.2; }
.nb-ks .nb-k.idle { opacity: 0.32; filter: grayscale(0.85); transition: opacity 0.2s; }
        .nb-fxh b { white-space: nowrap; }
        .nb-led { width: 11px; height: 11px; border-radius: 50%; background: #300; border: 1px solid #000; cursor: inherit; flex: none; }
        .nb-led.on { background: radial-gradient(circle at 35% 35%, #fff, var(--a) 60%); box-shadow: 0 0 8px var(--a); }
        .nb-fxs { font-size: 9px; opacity: 0.65; margin: -2px 0 6px 10px; line-height: 1.25; }
        .nb-fxsr { display: flex; gap: 4px; align-items: stretch; }
        .nb-fxm { width: 8px; flex: none; display: flex; gap: 1px; padding: 2px 1px; border-radius: 3px; background: #050505; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08); }
        .nb-fxm i { flex: 1; align-self: flex-end; height: calc(var(--li, 0) * 100%); border-radius: 1px; background: linear-gradient(to top, var(--a), var(--b) 80%, #fff); opacity: 0.85; transition: height 0.05s linear; }
        .nb-fxm i + i { height: calc(var(--lo, 0) * 100%); }
        .nb-fxm.hot i + i { background: linear-gradient(to top, var(--a), #ff2a4a); box-shadow: 0 0 6px #ff2a4a; }
        .nb-fxc { transition: transform 0.15s, box-shadow 0.15s; } .nb-fxc:hover { transform: translateY(-1px); box-shadow: 0 10px 22px -10px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06); }
        .nb-fxc .nb-scr { border-radius: 5px; box-shadow: inset 0 0 14px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.09), 0 6px 14px -8px rgba(0,0,0,0.9); }
        .nb-fxc .nb-fxh b { text-shadow: 0 0 10px color-mix(in srgb, var(--a) 55%, transparent); }
        .nb-led.on { animation: nbled 2.4s ease-in-out infinite; } @keyframes nbled { 50% { box-shadow: 0 0 3px var(--a); } }
        @media (prefers-reduced-motion: reduce) { .nb-led.on { animation: none; } .nb-fxc, .nb-fxm i { transition: none; } }
        .nb-gate { display: grid; grid-template-columns: repeat(16, 1fr); gap: 2px; margin: 4px 0 6px; }
        .nb-gate i { height: 30px; background: #1a1a1a; border: 1px solid #000; cursor: ns-resize; touch-action: none; }
        .nb-gate i.on { background: linear-gradient(to top, var(--a) 0, var(--b) calc(var(--lv, 1) * 100%), #1a1a1a calc(var(--lv, 1) * 100%)); box-shadow: 0 0 5px var(--glow); }
        .nb-gate i.out { opacity: 0.22; }
        .nb-gate i.now { outline: 1px solid #fff; }
        .nb-groups { display: grid; grid-template-columns: repeat(auto-fill, minmax(214px, 1fr)); gap: 8px; flex: 1; min-width: 0; }
        .nb-grp { background: rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.07); border-radius: 5px; padding: 6px 6px 4px; }
        .nb-grph { font-size: 9px; letter-spacing: 2px; opacity: 0.75; margin: 0 0 4px 2px; font-weight: bold; display: flex; align-items: center; gap: 6px; }
        .nb-grph > span { cursor: inherit; flex: 1; }
        .nb-grph > span::before { content: '▾ '; opacity: 0.6; } .nb-grp.fold .nb-grph > span::before { content: '▸ '; }
        .nb-grp.fold > :not(.nb-grph) { display: none; } .nb-grp.fold { padding-bottom: 2px; }
        .nb-sw2 { width: 26px; height: 13px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.25); background: #111; position: relative; cursor: inherit; flex: none; padding: 0; }
        .nb-sw2::after { content: ''; position: absolute; top: 1px; left: 1px; width: 9px; height: 9px; border-radius: 50%; background: #555; transition: left 0.12s; }
        .nb-sw2.on { border-color: var(--a); box-shadow: 0 0 6px var(--glow); } .nb-sw2.on::after { left: 14px; background: var(--a); }
        .nb-grp.off > :not(.nb-grph) { opacity: 0.35; filter: grayscale(0.8); }
        .nb-gdots { background: none; border: 0; color: inherit; opacity: 0.6; cursor: inherit; font: inherit; padding: 0 2px; } .nb-gdots:hover { opacity: 1; }
        .nb-views { display: flex; flex-wrap: wrap; gap: 3px; margin: 0 0 6px; }
        .nb-prebar { display: inline-flex; align-items: center; gap: 3px; } .nb-prebar .nb-prename { font-size: 10px; min-width: 120px; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 2px 6px; background: rgba(0,0,0,0.35); border: 1px solid var(--line); border-radius: 3px; }
        .nb-grp .nb-scr { margin-bottom: 4px; width: 100% !important; height: auto !important; } .nb-grp .nb-scr.nb-vs { height: 64px !important; }
        .nb-grp-wide { grid-column: 1 / -1; }
        .nb-grp-mx .nb-ks { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 4px 12px; }
        .nb-tewrap { grid-column: 1 / -1; } .nb-tedit .nb-row { margin: 4px 0; } .nb-tecv { width: 100% !important; height: 170px !important; cursor: crosshair; }
        .nb-mxrow { display: flex; align-items: center; gap: 6px; padding: 3px 6px; background: rgba(255,255,255,0.03); border-radius: 4px; } .nb-mxrow > b { font-size: 10px; opacity: 0.5; width: 10px; }
        label.nb-pick { display: inline-flex; flex-direction: column; gap: 2px; font-size: 8px; letter-spacing: 1px; opacity: 0.95; margin: 0 4px 4px 0; } label.nb-pick select { max-width: 130px; }
        .nb-grp .nb-ks { gap: 2px 4px; }
        .nb-grp select.nb-sel { max-width: 100%; margin: 2px 0 4px; }
        .face-serpent { background: radial-gradient(ellipse at 15% 0%, rgba(120,255,200,0.12), transparent 40%), repeating-linear-gradient(135deg, rgba(255,255,255,0.025) 0 2px, transparent 2px 9px), linear-gradient(#17201d, #070b0a); }
        .face-serpent .nb-ph b { color: #8fffd0; text-shadow: 0 0 10px rgba(80,255,180,0.5); }
        .face-serpent .nb-kn { background: radial-gradient(circle at 38% 30%, #e8fff6, #4aa88a 40%, #0a2a20 85%); }
        .face-serpent { --scl: rgba(93,255,176,0.035); background: radial-gradient(ellipse at 12% -10%, rgba(93,255,176,0.16), transparent 42%), radial-gradient(ellipse at 100% 110%, rgba(255,77,109,0.08), transparent 45%), radial-gradient(circle at 50% 100%, transparent 7px, var(--scl) 8px, transparent 9.5px) 0 0 / 18px 10px, radial-gradient(circle at 50% 100%, transparent 7px, var(--scl) 8px, transparent 9.5px) 9px 5px / 18px 10px, linear-gradient(#141c19, #050807 70%); box-shadow: inset 0 1px 0 rgba(160,255,210,0.12), inset 0 0 0 1px rgba(93,255,176,0.08), 0 14px 40px rgba(0,0,0,0.55); }
        .face-serpent .nb-ph b { font-size: 22px; color: #a8ffdc; text-shadow: 0 0 6px rgba(93,255,176,0.9), 0 0 22px rgba(93,255,176,0.45); animation: nbsg 4.5s ease-in-out infinite; }
        .face-serpent .nb-ph span { letter-spacing: 5px; background: linear-gradient(90deg, #eafff5, #5dffb0 60%, #1f8a5e); -webkit-background-clip: text; background-clip: text; color: transparent; }
        @keyframes nbsg { 50% { text-shadow: 0 0 4px rgba(93,255,176,0.6), 0 0 12px rgba(93,255,176,0.25); } }
        .face-serpent .nb-views { gap: 3px; padding-bottom: 6px; border-bottom: 1px solid rgba(93,255,176,0.12); margin-bottom: 8px; }
        .face-serpent .nb-views button { border-radius: 3px 3px 0 0; border-color: transparent; background: transparent; letter-spacing: 2px; opacity: 0.6; }
        .face-serpent .nb-views button:hover { opacity: 0.95; } .face-serpent .nb-views button.on { opacity: 1; color: #a8ffdc; background: linear-gradient(rgba(93,255,176,0.02), rgba(93,255,176,0.14)); box-shadow: inset 0 -2px 0 #5dffb0, 0 6px 12px -8px #5dffb0; }
        .face-serpent .nb-grp[data-fam] { --a: var(--fc); --b: var(--fc); border-color: color-mix(in srgb, var(--fc) 20%, transparent); border-radius: 7px; background: linear-gradient(180deg, color-mix(in srgb, var(--fc) 8%, rgba(4,6,6,0.6)), rgba(2,3,3,0.55) 60%); box-shadow: inset 0 1px 0 color-mix(in srgb, var(--fc) 28%, transparent), 0 8px 20px -10px rgba(0,0,0,0.8); }
        .face-serpent .nb-grp[data-fam].off { filter: saturate(0.35) brightness(0.8); }
        .face-serpent .nb-grp[data-fam] .nb-grph { color: var(--fc); opacity: 1; text-shadow: 0 0 8px color-mix(in srgb, var(--fc) 55%, transparent); }
        .face-serpent .nb-grp[data-fam] .nb-scr { border: 1px solid color-mix(in srgb, var(--fc) 22%, transparent); border-radius: 4px; box-shadow: inset 0 0 18px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,0,0,0.6); }
        .face-serpent .nb-grp[data-fam] .nb-kn { background: radial-gradient(circle at 36% 28%, #ffffff, color-mix(in srgb, var(--fc) 75%, #000) 38%, color-mix(in srgb, var(--fc) 18%, #000) 72%, #030404); box-shadow: 0 2px 4px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.3), 0 0 8px -2px color-mix(in srgb, var(--fc) 60%, transparent); }
        .face-serpent .nb-grp[data-fam] .nb-kw { background: conic-gradient(from 225deg, var(--fc) calc(var(--v) * 270deg), rgba(127,127,127,0.16) 0 270deg, transparent 0); }
        .face-serpent .nb-grp[data-fam] .nb-k b { color: var(--fc); }
        .face-serpent .nb-grp[data-fam] .nb-sw2.on { border-color: var(--fc); background: color-mix(in srgb, var(--fc) 30%, #000); } .face-serpent .nb-grp[data-fam] .nb-sw2.on::after { background: var(--fc); box-shadow: 0 0 6px var(--fc); }
        .face-serpent .nb-grp[data-fam] select { border-color: color-mix(in srgb, var(--fc) 25%, rgba(255,255,255,0.12)); }
        .face-serpent .nb-kw { position: relative; } .face-serpent .nb-k { --kr: 20px; } .face-serpent .nb-k.sm { --kr: 17px; }
        .nb-mr { position: absolute; inset: -4px; border-radius: 50%; pointer-events: none; background: conic-gradient(from 225deg, transparent calc(clamp(0, var(--v) + var(--mn), 1) * 270deg), var(--mc) 0 calc(clamp(0, var(--v) + var(--mp), 1) * 270deg), transparent 0); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3.5px), #000 calc(100% - 3px)); mask: radial-gradient(farthest-side, transparent calc(100% - 3.5px), #000 calc(100% - 3px)); filter: drop-shadow(0 0 3px var(--mc)); animation: nbmr 2.6s ease-in-out infinite; }
        @keyframes nbmr { 50% { opacity: 0.55; } }
        .nb-mdot { position: absolute; left: 50%; top: 50%; width: 6px; height: 6px; margin: -3px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 1.5px var(--mc), 0 0 5px 1px var(--mc); transform: rotate(calc((clamp(0, var(--v) + var(--m1), 1) * 270 - 135) * 1deg)) translateY(calc(-1 * var(--kr))); cursor: ns-resize; z-index: 2; touch-action: none; }
        .nb-mdot::before { content: ''; position: absolute; inset: -6px; border-radius: 50%; }
        .nb-k.nb-mxoff .nb-mr { opacity: 0.3; animation: none; }
        .face-serpent .nb-grp-mx .nb-ks { grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); } .face-serpent .nb-mxrow.nb-mxhide { display: none; } .nb-mxmore { justify-self: start; font: 9px 'Courier New', monospace; letter-spacing: 1px; background: transparent; color: var(--fc, #ff6db8); border: 1px dashed color-mix(in srgb, var(--fc, #ff6db8) 40%, transparent); border-radius: 4px; padding: 3px 9px; opacity: 0.8; } .face-serpent .nb-mxrow { min-width: 0; gap: 4px; } .face-serpent .nb-mxrow label.nb-pick select { max-width: 104px; } .face-serpent .nb-mxrow.nb-mxempty { opacity: 0.42; } .face-serpent .nb-mxrow.nb-mxempty:hover { opacity: 0.9; }
        .nb-modding .nb-k[data-mod] .nb-kw { box-shadow: 0 0 0 1px rgba(255,255,255,0.35), 0 0 12px rgba(255,255,255,0.18); }
        .nb-modding .nb-k:not([data-mod]) { opacity: 0.35; }
        .nb-k.nb-tgt .nb-kw { box-shadow: 0 0 0 2px #fff, 0 0 18px #fff; transform: scale(1.14); }
        .nb-mvghost { position: fixed; z-index: 100000; pointer-events: none; transform: translate(-50%, -150%); padding: 3px 9px; border-radius: 10px; font: bold 9px 'Courier New', monospace; letter-spacing: 1px; background: #0b0710; color: var(--mc); border: 1px solid var(--mc); box-shadow: 0 0 16px var(--mc); }
        .nb-views .nb-roomb { margin-left: auto; }
        .nb-movers { display: flex; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: thin; gap: 4px; align-items: center; margin: 0 0 8px; padding: 5px 8px; border-radius: 7px; position: sticky; top: 0; z-index: 5; background: linear-gradient(90deg, rgba(6,10,9,0.97), rgba(6,10,9,0.92)); border: 1px solid rgba(255,255,255,0.06); }
        .nb-movl { flex: 0 0 auto; white-space: nowrap; font-size: 9px; letter-spacing: 2px; color: #d8cfff; margin-right: 6px; font-weight: bold; text-shadow: 0 0 8px rgba(185,140,255,0.6); }
        .nb-mvc { flex: 0 0 auto; white-space: nowrap; font: 9px 'Courier New', monospace; letter-spacing: 1px; padding: 2px 8px 2px 6px; border-radius: 9px; border: 1px solid color-mix(in srgb, var(--mc) 40%, transparent); background: color-mix(in srgb, var(--mc) 8%, #08080a); color: var(--mc); cursor: grab; touch-action: none; user-select: none; }
        .nb-mvc::before { content: ''; display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: var(--mc); margin-right: 5px; vertical-align: 1px; box-shadow: 0 0 5px var(--mc); }
        .nb-mvc.used { background: color-mix(in srgb, var(--mc) 22%, #08080a); } .nb-mvc:hover { box-shadow: 0 0 10px color-mix(in srgb, var(--mc) 45%, transparent); } .nb-mvc:active { cursor: grabbing; }
        @media (prefers-reduced-motion: reduce) { .nb-mr, .face-serpent .nb-ph b { animation: none; } }
        @media (max-width: 760px) { .nb-movers { position: static; } }
        .face-grave { background: radial-gradient(ellipse at 50% 120%, rgba(120,0,10,0.35), transparent 60%), repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0 1px, transparent 1px 4px), linear-gradient(#1a1414, #060404); }
        .face-grave .nb-ph b, .face-grave .nb-fxh b { color: #c8102e; text-shadow: 0 0 8px rgba(200,0,20,0.6); }
        .face-grave .nb-kn { background: radial-gradient(circle at 38% 30%, #d8cfc0, #6a5a50 45%, #1a1010 85%); } .face-grave .nb-kn i { background: #8a0010; box-shadow: none; }
        .face-paper { background: radial-gradient(circle at 20% 30%, rgba(220,80,60,0.18), transparent 35%), radial-gradient(circle at 80% 70%, rgba(60,100,220,0.18), transparent 40%), linear-gradient(#efe7d8, #d8ccb6); color: #2a2018; }
        .face-paper .nb-kn { background: radial-gradient(circle at 38% 30%, #fff, #c8bca6 50%, #6a5e4a 85%); } .face-paper .nb-kn i { background: #b02a20; box-shadow: none; }
        .nb-scuff { position: absolute; inset: 0; border-radius: inherit; pointer-events: none; opacity: 0.5; mix-blend-mode: overlay;
            background: linear-gradient(103deg, transparent 47%, rgba(255,255,255,0.18) 47.3%, transparent 47.8%) 0 0 / 240px 90px, linear-gradient(77deg, transparent 60%, rgba(255,255,255,0.12) 60.2%, transparent 60.6%) 0 0 / 180px 120px, radial-gradient(circle at 30% 70%, rgba(0,0,0,0.25), transparent 12%) 0 0 / 300px 160px; }
            clip-path: polygon(2% 8%, 98% 0, 100% 92%, 1% 100%, 0 55%); }
        .nb-kn.worn { box-shadow: inset 0 0 0 2px rgba(255,255,255,0.18), inset 3px 2px 6px rgba(255,255,255,0.25); filter: saturate(0.7) brightness(1.08); }
        .face-latex { background: radial-gradient(ellipse at 30% 0%, rgba(255,255,255,0.32), transparent 35%), radial-gradient(ellipse at 80% 100%, rgba(255,40,90,0.18), transparent 50%), linear-gradient(#141014, #030203); }
        .face-latex .nb-kn { background: radial-gradient(circle at 36% 28%, #ffffff, #5a5a62 22%, #0a0a0c 70%); }
        .face-satin { background: repeating-linear-gradient(115deg, rgba(255,255,255,0.05) 0 14px, rgba(0,0,0,0.12) 14px 30px), radial-gradient(ellipse at 40% 0%, #a01830, #3a040c 75%); }
        .face-satin .nb-kn { background: radial-gradient(circle at 38% 30%, #ffd0d8, #b01a34 45%, #3a0610 85%); }
        .face-rope { background: repeating-linear-gradient(45deg, rgba(0,0,0,0.18) 0 3px, transparent 3px 7px), repeating-linear-gradient(-45deg, rgba(255,230,180,0.06) 0 2px, transparent 2px 6px), linear-gradient(#7a5a36, #3a2a16); }
        .face-rope .nb-kn { background: radial-gradient(circle at 38% 30%, #f0d8a8, #9a7444 50%, #3a2610 85%); }
        .face-blush { background: radial-gradient(circle at 70% 30%, rgba(255,120,150,0.45), transparent 55%), linear-gradient(#5a1424, #20060c); }
        .face-blush .nb-kn { background: radial-gradient(circle at 38% 30%, #ffe0e6, #e05a7a 45%, #4a0c1a 85%); }
        .face-jar { background: linear-gradient(90deg, rgba(255,255,255,0.08), transparent 18%, transparent 80%, rgba(255,255,255,0.12)), radial-gradient(ellipse at 50% 120%, rgba(245,242,232,0.35), transparent 55%), linear-gradient(#2a3036, #11161a); }
        .face-jar::after, .face-milk::after { content: ''; position: absolute; left: 22px; top: 0; width: 7px; height: 26px; border-radius: 0 0 6px 6px; background: linear-gradient(#f6f3ea, #e8e3d6); box-shadow: 40px 0 0 -1px #f2efe6, 160px 0 0 0 #f2efe6; opacity: 0.85; pointer-events: none; }
        .face-jar .nb-kn { background: radial-gradient(circle at 38% 30%, #ffffff, #b8c4cc 40%, #3a4650 85%); }
        .face-milk { background: radial-gradient(ellipse at 30% 10%, #ffffff, #e8e2d2 60%, #c8c0ac); color: #2a241c; }
        .face-milk .nb-kn { background: radial-gradient(circle at 38% 30%, #ffffff, #d8d0bc 50%, #7a7262 85%); } .face-milk .nb-kn i { background: #2a241c; box-shadow: none; }
        .face-jar, .face-milk { position: relative; }
        .face-fault { background: repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0 1px, transparent 1px 3px), linear-gradient(90deg, rgba(255,0,60,0.12), transparent 30%, transparent 70%, rgba(0,200,255,0.12)), linear-gradient(#1a1420, #07050a); }
        .face-fault .nb-ph b, .face-fault .nb-fxh b { text-shadow: -2px 0 rgba(255,0,60,0.8), 2px 0 rgba(0,200,255,0.8); }
        .face-fault .nb-kn { background: radial-gradient(circle at 38% 30%, #ffffff, #ff3b6b 30%, #3a0a20 80%); }
        .face-hazard { background: repeating-linear-gradient(-45deg, #e8c020 0 10px, #111 10px 20px) top / 100% 7px no-repeat, linear-gradient(#2a2818, #0f0e08); }
        .face-hazard .nb-kn { background: radial-gradient(circle at 38% 30%, #fff6a0, #b8901a 50%, #2a2004 85%); }
        .nb-fault { display: grid; grid-template-columns: repeat(16, 1fr); gap: 2px; margin: 4px 0 4px; }
        .nb-fault i { height: 22px; background: #1a1a1a; border: 1px solid #000; cursor: inherit; font: bold 7px Courier New; font-style: normal; color: #000; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .nb-fault i.off { opacity: 0.25; }
        .nb-fault i.now { outline: 1px solid #fff; outline-offset: 0; filter: brightness(1.4); }
        .nb-brush { display: flex; gap: 2px; margin: 0 0 4px; flex-wrap: wrap; }
        .nb-brush i { font: bold 8px Courier New; font-style: normal; padding: 2px 3px; border: 1px solid #000; color: #000; cursor: inherit; opacity: 0.55; }
        .nb-brush i.on { opacity: 1; outline: 1px solid #fff; }
        .nb-pick { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 6px; }
        .nb-pick .nb-plate { cursor: inherit; padding: 8px 10px; margin: 0; }
        .nb-pick .nb-plate.lk { opacity: 0.45; }
        .nb-drawers { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 8px; }
        .nb-cofrack { position: relative; display: grid; grid-template-columns: 1fr 1fr; gap: 3px 14px; padding: 6px 22px; border-radius: 3px;
            background: linear-gradient(90deg, #2c2a30 0 14px, transparent 14px calc(100% - 14px), #2c2a30 calc(100% - 14px)), radial-gradient(circle at 7px 50%, #0a090c 2.5px, transparent 3px) 0 0 / 14px 13px repeat-y, radial-gradient(circle at calc(100% - 7px) 50%, #0a090c 2.5px, transparent 3px) 0 0 / 100% 13px repeat-y, #0d0b0e;
            box-shadow: inset 0 0 0 1px rgba(0,0,0,0.8), inset 0 2px 10px rgba(0,0,0,0.9); }
        .nb-unit { display: flex; align-items: center; gap: 5px; padding: 2px 16px 2px 15px; position: relative; min-height: 40px; min-width: 0; border-radius: 2px; cursor: inherit;
            background: linear-gradient(180deg, #3d2a1c, #24170e 55%, #1a110a); border: 1px solid #0a0604; box-shadow: inset 0 1px 0 rgba(255,220,180,0.12), 0 1px 0 rgba(0,0,0,0.6); }
        .nb-unit:nth-child(4n+1), .nb-unit:nth-child(4n+2) { background: linear-gradient(180deg, #37261a, #20150d 55%, #170f09); }
        .nb-unit.on { box-shadow: inset 0 0 0 1px var(--a), 0 0 12px var(--glow); }
        .nb-unit.muted { filter: saturate(0.3) brightness(0.65); }
        .nb-scrw { position: absolute; left: 4px; top: 50%; width: 7px; height: 7px; margin-top: -4px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #b8b0a4, #3a342c 70%); }
        .nb-scrw::after { content: ''; position: absolute; left: 1px; right: 1px; top: 3px; height: 1px; background: #1a1612; transform: rotate(35deg); }
        .nb-scrw.r { left: auto; right: 4px; }
        .nb-led2 { width: 8px; height: 8px; border-radius: 50%; flex: none; background: #3a0d12; box-shadow: inset 0 1px 1px rgba(0,0,0,0.8); transition: background 0.12s, box-shadow 0.12s; }
        .nb-led2.hot { background: #ff3a4a; box-shadow: 0 0 8px #ff3a4a, inset 0 -1px 1px rgba(0,0,0,0.4); transition: none; }
        .nb-uno { font: bold 11px 'Courier New', monospace; color: #e8d2a8; background: #0c0805; padding: 2px 4px; border-radius: 2px; box-shadow: inset 0 1px 2px #000; flex: none; }
        .nb-unit .nb-unm { width: 62px; flex: none; font-weight: bold; letter-spacing: 1px; }
        .nb-unit .nb-sel { max-width: 92px; min-width: 0; font-size: 10px; }
        .nb-unit .nb-k.sm { transform: scale(0.86); margin: -4px -2px !important; }
        .nb-unit .nb-ks { gap: 2px; margin-left: auto; flex-wrap: nowrap; flex: none; }
        .nb-unit .nb-ks .nb-k { margin: 0; }
        .nb-ugap { width: 0; }
        .nb-outs { flex-basis: 100%; border-top: 1px dashed rgba(255,255,255,0.12); padding-top: 4px; margin-top: 2px; align-items: center; }
        .nb-outl { font: bold 9px 'Courier New', monospace; letter-spacing: 2px; opacity: 0.6; writing-mode: vertical-rl; transform: rotate(180deg); margin-right: 4px; }
        .nb-kind { align-self: center; }
        .nb-keys { display: flex; flex-wrap: wrap; gap: 3px; align-items: center; margin: 4px 0 6px; } .nb-keys .nb-lab { margin-right: 4px; }
        .nb-drwlab { font: bold 10px 'Courier New', monospace; letter-spacing: 1px; opacity: 0.7; margin: 2px 0 4px 6px; }
        @media (max-width: 1100px) { .nb-cofrack { grid-template-columns: 1fr; } }
        .nb-drw { border: 1px solid rgba(0,0,0,0.6); border-radius: 4px; padding: 5px; background: linear-gradient(#2a1a10, #140c07); box-shadow: inset 0 1px 0 rgba(255,255,255,0.08); cursor: inherit; }
        .nb-drw.on { outline: 2px solid var(--a); box-shadow: 0 0 10px var(--glow); }
        .nb-drw .nb-in { width: 100%; box-sizing: border-box; margin-bottom: 3px; font-weight: bold; }
        .nb-drw .nb-sel { width: 100%; margin-bottom: 3px; }
        .nb-drw .nb-ks { justify-content: space-between; }
        @media (max-width: 760px) { .nb-drawers { grid-template-columns: repeat(2, 1fr); } }
        /* every plugin + instrument gets this on top. keep it boring, the faces are the fun bit */
        .nb-plate { border-radius: 6px; border-color: rgba(0,0,0,0.75); box-shadow: inset 0 1px 0 rgba(255,255,255,0.16), inset 0 0 0 1px rgba(255,255,255,0.035), inset 0 -14px 26px -18px rgba(0,0,0,0.85), 0 14px 28px -16px rgba(0,0,0,0.95), 0 0 0 1px rgba(0,0,0,0.45); }
        .nb-scuff::after { content: ''; position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(168deg, rgba(255,255,255,0.22), transparent 30%), linear-gradient(0deg, rgba(0,0,0,0.25), transparent 25%); }
        .nb-fxc { transition: transform 0.18s, box-shadow 0.18s; }
        .nb-fxc:hover { transform: translateY(-2px); box-shadow: inset 0 1px 0 rgba(255,255,255,0.18), inset 0 0 0 1px rgba(255,255,255,0.05), 0 20px 30px -14px rgba(0,0,0,0.95), 0 0 0 1px rgba(0,0,0,0.5); }
        .nb-fxh span { font-size: 12px; letter-spacing: 3px; }
        .nb-fxb { padding-bottom: 7px; border-bottom: 1px solid color-mix(in srgb, currentColor 13%, transparent); margin-bottom: 7px; }
        .nb-fxb .nb-btn { min-width: 24px; height: 20px; padding: 0 6px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; background: rgba(0,0,0,0.38); border-color: rgba(255,255,255,0.12); color: #f2e8ef; box-shadow: inset 0 1px 0 rgba(255,255,255,0.08); }
        .nb-fxb .nb-btn:hover { background: color-mix(in srgb, var(--a) 30%, rgba(0,0,0,0.4)); border-color: var(--a); }
        .nb-fxs { margin: 0 0 8px 10px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; cursor: inherit; transition: opacity 0.15s; }
        .nb-fxs:hover { opacity: 0.9; } .nb-fxs.open { display: block; }
        .nb-plate .nb-scr { border-radius: 3px; border: 1px solid rgba(0,0,0,0.85); box-shadow: inset 0 0 18px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.08); }
        .nb-fxsr { position: relative; }
        .nb-fxsr::before { content: ''; position: absolute; left: 0; top: 0; width: 238px; bottom: 0; border-radius: 3px; pointer-events: none; z-index: 1; opacity: 0.75;
            background: repeating-linear-gradient(180deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 3px), linear-gradient(170deg, rgba(255,255,255,0.07), transparent 40%); }
                .nb-plate .nb-k span { letter-spacing: 1.4px; }
        .nb-inst .nb-ph { padding: 0 0 9px; margin-bottom: 10px; border-bottom: 1px solid color-mix(in srgb, currentColor 13%, transparent); }
        .nb-inst .nb-ph b { text-shadow: 0 2px 0 rgba(0,0,0,0.45); }
        .nb-inst .nb-ph span { letter-spacing: 4px; font-size: 13px; } .nb-inst .nb-ph small { opacity: 0.55; letter-spacing: 0.5px; }
        .nb-groups { align-items: start; }
        .nb-plate .nb-grp { border-radius: 4px; padding: 8px 8px 6px; background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.28)); border-color: rgba(255,255,255,0.09); box-shadow: inset 0 1px 0 rgba(255,255,255,0.07), 0 8px 16px -12px rgba(0,0,0,0.9); }
        .nb-plate .nb-grph { letter-spacing: 2.5px; padding-bottom: 4px; margin-bottom: 6px; border-bottom: 1px dashed color-mix(in srgb, currentColor 14%, transparent); }
        /* drip. its meant to look like slime. it looks like slime */
        .nb-fxc.fx-drip { background: radial-gradient(ellipse at 28% -10%, rgba(255,255,255,0.26), transparent 42%), radial-gradient(ellipse at 50% 125%, rgba(250,246,236,0.3), transparent 50%), linear-gradient(180deg, #2b2e34, #14161a 60%, #0c0d10); }
        .nb-fxc.fx-drip::after { left: 0; right: auto; top: 0; width: 100%; height: 60px; border-radius: 12px 12px 0 0; box-shadow: none; opacity: 1; z-index: 3; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.55)); background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='272' height='60'><defs><linearGradient id='g' x1='0' x2='1'><stop offset='0' stop-color='%23dcd6ca'/><stop offset='.4' stop-color='%23fffdf8'/><stop offset='1' stop-color='%23d2cbbd'/></linearGradient></defs><path fill='url(%23g)' d='M0 0H272V7C262 8 258 6 255 9V22a5 5 0 0 1-10 0V10C238 9 228 10 220 8V38a6.5 6.5 0 0 1-13 0V10C196 11 186 8 172 9V18a4.5 4.5 0 0 1-9 0V10C150 11 136 8 125 10V27a5.5 5.5 0 0 1-11 0V10C100 11 60 7 22 10V32a6 6 0 0 1-12 0V9C6 9 3 8 0 9Z'/><path fill='none' stroke='%23fff' stroke-width='1.6' stroke-linecap='round' opacity='.9' d='M12.5 12V31M209.5 12V37M116.5 12V26M165.5 11V17M247.5 11V21'/><g fill='%23fff' opacity='.85'><circle cx='14' cy='33' r='1.6'/><circle cx='211' cy='40' r='1.8'/><circle cx='118' cy='28' r='1.4'/><circle cx='249' cy='23' r='1.3'/></g></svg>") no-repeat left top, linear-gradient(90deg, #dcd6ca, #fffdf8 40%, #d2cbbd) left top / 100% 8px no-repeat; }
        .nb-fxc.fx-drip .nb-fxh { position: relative; z-index: 4; margin-top: 4px; } .nb-fxc.fx-drip .nb-fxh b { color: #fffdf6; text-shadow: 0 0 10px rgba(255,255,255,0.5), 0 1px 0 rgba(0,0,0,0.6); }
        .nb-fxc.fx-drip .nb-kn { background: radial-gradient(circle at 34% 26%, #ffffff, #f4f0e7 28%, #bdb6a8 68%, #4f4a42); box-shadow: 0 2px 4px rgba(0,0,0,0.7), inset 0 -2px 3px rgba(0,0,0,0.25); }
        .nb-fxc.fx-drip .nb-kn i { background: #1a1a1e; box-shadow: none; }
        @media (prefers-reduced-motion: reduce) { .nb-fxc:hover { transform: none; } }

        .nb-plate { box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), 0 0 0 1px color-mix(in srgb, var(--neon-primary, #ff0099) 40%, #000), 0 16px 26px -14px #000, 0 0 22px -8px var(--neon-glow, rgba(255,0,153,0.5)); }
        .nb-fxc:hover { box-shadow: inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 1px var(--neon-primary, #ff0099), 0 20px 30px -14px #000, 0 0 26px -6px var(--neon-glow, rgba(255,0,153,0.5)); }
        .nb-plate .nb-ph b, .nb-plate .nb-fxh b { text-shadow: 0 0 10px var(--neon-glow, rgba(255,0,153,0.6)), 0 2px 0 rgba(0,0,0,0.5); }
        .nb-plate .nb-kw { padding: 3px; background: conic-gradient(from 225deg, var(--neon-primary, var(--a)) calc(var(--v) * 270deg), rgba(0,0,0,0.35) 0 270deg, transparent 0); filter: drop-shadow(0 0 3px color-mix(in srgb, var(--neon-primary, #ff0099) 45%, transparent)); }
        .nb-plate .nb-k.lockd .nb-kw { background: conic-gradient(from 225deg, #ffe36d calc(var(--v) * 270deg), rgba(0,0,0,0.35) 0 270deg, transparent 0); }
        .nb-plate .nb-kn, .nb-plate .nb-kn.worn, .nb-plate .nb-grp[data-fam] .nb-kn, .nb-fxc.fx-drip .nb-kn { background: repeating-conic-gradient(from 0deg, #26222b 0 6deg, #19161d 6deg 12deg); box-shadow: 0 2px 4px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -2px 3px rgba(0,0,0,0.6); filter: none; }
        .nb-plate .nb-kn::after { content: ''; position: absolute; inset: 22%; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #36313c, #141217); box-shadow: inset 0 1px 0 rgba(255,255,255,0.1); }
        .nb-plate .nb-kn i, .nb-fxc.fx-drip .nb-kn i { z-index: 1; background: #fff; box-shadow: 0 0 4px var(--neon-primary, #ff0099), 0 0 1px #fff; }
        .nb-plate .nb-k span { font-family: 'DotGothic16', monospace; font-size: 10px; letter-spacing: 0.5px; }
        .nb-plate .nb-k b { color: var(--neon-secondary, #fff); font-family: 'DotGothic16', monospace; }
        .nb-plate .nb-grph { font-family: 'DotGothic16', monospace; font-weight: normal; letter-spacing: 1.5px; }
        .nb-plate .nb-scr { border-radius: 6px; border: 1px solid #000; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 0 22px rgba(0,0,0,0.95), 0 0 0 2px #0a080c, 0 0 0 3px rgba(255,255,255,0.06), 0 0 14px -4px var(--neon-glow, rgba(255,0,153,0.5)); }
        .nb-plate .nb-btn { background: linear-gradient(180deg, #221e27, #141118); color: #e8e0ee; border: 1px solid #000; box-shadow: inset 0 1px 0 rgba(255,255,255,0.1); text-shadow: none; }
        .nb-plate .nb-btn:hover { border-color: var(--neon-primary, #ff0099); color: #fff; box-shadow: 0 0 8px var(--neon-glow, rgba(255,0,153,0.5)), inset 0 1px 0 rgba(255,255,255,0.12); }
        .nb-plate .nb-led.on { background: radial-gradient(circle at 35% 35%, #fff, var(--neon-primary, #ff0099) 60%); box-shadow: 0 0 8px var(--neon-primary, #ff0099); }
        .nb-fxc .nb-fxs { position: absolute; z-index: 6; left: 10px; right: 10px; top: 34px; display: none; margin: 0; padding: 7px 9px; -webkit-line-clamp: unset; border-radius: 4px; color: #ece4f2; background: rgba(10,8,13,0.96); border: 1px solid var(--neon-primary, #ff0099); box-shadow: 0 10px 20px rgba(0,0,0,0.7), 0 0 12px -4px var(--neon-glow, rgba(255,0,153,0.5)); pointer-events: none; }
        .nb-fxc .nb-fxh:hover ~ .nb-fxs { display: block; }
        .nb-fxc .nb-fxh { cursor: help; }
        .nb-inst > .nb-ph { position: relative; cursor: help; }
        .nb-inst > .nb-ph small:not(.lk) { position: absolute; z-index: 6; left: 0; top: calc(100% + 4px); width: min(640px, 92%); display: none; padding: 7px 9px; border-radius: 4px; font-size: 11px; line-height: 1.5; opacity: 1; color: #ece4f2; background: rgba(10,8,13,0.96); border: 1px solid var(--neon-primary, #ff0099); box-shadow: 0 10px 20px rgba(0,0,0,0.7), 0 0 12px -4px var(--neon-glow, rgba(255,0,153,0.5)); pointer-events: none; }
        .nb-inst > .nb-ph:hover small:not(.lk) { display: block; }
        .nb-fxc .nb-fxsr { margin-bottom: 12px; }
        .nb-plate .nb-grp .nb-scr, .nb-plate .nb-mawrow + .nb-scr, .nb-plate .nb-scr + .nb-ks { margin-bottom: 10px; }
        `;
        document.head.appendChild(st);
    }
    const stepsCache = new Map();
    function stepsOf(fmt) {
        if (!fmt) return 0; if (stepsCache.has(fmt)) return stepsCache.get(fmt);
        let seen = new Set(); for (let i = 0; i <= 200; i++) seen.add(fmt(i / 200));
        let n = seen.size <= 12 ? seen.size : 0; stepsCache.set(fmt, n); return n;
    }
    function addLane(tr, path) {
        if (!tr.auto.some(a => a.path === path)) { X.mark(); tr.auto.push({ path, pts: [] }); }
        if (tr.isMaster) X.pr.master.aopen = 1; else tr.aopen = 1;
        X.touch(); X.showAll(); X.flash('lane added under ' + tr.name + '. click on it to draw');
    }
    function autoMenu(e, tr, path) {
        e.preventDefault();
        X.menu(e.clientX, e.clientY, [['draw a lane for this on the timeline', () => {
            if (!tr.auto.some(a => a.path === path)) { X.mark(); tr.auto.push({ path, pts: [] }); }
            if (tr.isMaster) X.pr.master.aopen = 1; else tr.aopen = 1;
            X.touch(); X.showAll(); X.flash('lane added under ' + tr.name + '. click on it to draw');
        }]]);
    }

    const MINE_KEY = 'vmp_nb_mine';
    function mineAll() { try { let o = JSON.parse(localStorage.getItem(MINE_KEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
    function mineOf(id) { let a = mineAll()[id], v = NB.V[id]; if (!Array.isArray(a)) return []; if (v && v.fix) a.forEach(m => { if (m && m[1]) v.fix(m[1]); }); return a; }
    function mineSave(id, list) { let all = mineAll(); if (list.length) all[id] = list; else delete all[id]; try { localStorage.setItem(MINE_KEY, JSON.stringify(all)); return true; } catch (e) { X.flash('couldnt keep it, the browser is out of room'); return false; } }
    const bare = snd => { let o = JSON.parse(JSON.stringify(snd)); delete o._pre; delete o._mine; return o; };
    X.mine = mineOf;
    // save your presets to a file so you dont lose them if your browser gets wiped
    X.exportMine = () => {
        let all = mineAll(), n = Object.keys(all).reduce((t, k) => t + all[k].length, 0);
        if (!n) { X.flash('nothing kept yet. ✚ KEEP a sound first'); return; }
        let blob = new Blob([JSON.stringify({ kind: 'noisebox presets', v: 1, at: new Date().toISOString(), presets: all }, null, 1)], { type: 'application/json' });
        let a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'noisebox_presets_' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
        X.flash('⇩ ' + n + ' preset' + (n > 1 ? 's' : '') + ' out to a file');
    };
    X.importMine = () => {
        let inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
        inp.onchange = () => { let f = inp.files && inp.files[0]; if (!f) return; let rd = new FileReader();
            rd.onload = () => { let d; try { d = JSON.parse(rd.result); } catch (e) { X.flash('that file isnt presets (it wont read)'); return; }
                let src = d && d.presets && typeof d.presets === 'object' ? d.presets : null; if (!src) { X.flash('that file isnt noisebox presets'); return; }
                let all = mineAll(), got = 0;
                Object.keys(src).forEach(id => { if (!NB.V[id] || !Array.isArray(src[id])) return; let list = (all[id] || []).slice();
                    src[id].forEach(m => { if (!Array.isArray(m) || typeof m[0] !== 'string' || !m[1] || typeof m[1] !== 'object') return; let name = m[0].slice(0, 32); list = list.filter(q => q[0] !== name); list.push([name, m[1]]); got++; });
                    if (list.length) all[id] = list; });
                try { localStorage.setItem(MINE_KEY, JSON.stringify(all)); } catch (e) { X.flash('couldnt keep them, the browser is out of room'); return; }
                X.flash(got ? '⇧ ' + got + ' preset' + (got > 1 ? 's' : '') + ' in' : 'nothing in that file fits an instrument here'); X.showDock(); if (X.browse) X.browse(); };
            rd.readAsText(f); };
        inp.click();
    };
    X.presetFx = (tr, snd) => {
        let list = snd && snd._fx; if (snd) delete snd._fx;
        let had = tr.fx.some(P => P.pre); tr.fx = tr.fx.filter(P => !P.pre); if (!Array.isArray(list) || !list.length) return had;
        let miss = 0; list.forEach(q => { let d = NBFX.BY[q.type]; if (!d) return; if (d.part && !X.has(d.part)) { miss++; return; } if (tr.fx.length >= X.lim().fx) return; let P = NB.newFx(q.type); Object.assign(P.p, JSON.parse(JSON.stringify(q.p || {}))); P.pre = 1; tr.fx.push(P); });
        if (miss) X.flash('it came with ' + miss + ' plugin' + (miss > 1 ? 's' : '') + ' you dont have yet, so it plays without'); return true;
    };
    X.loadMine = (tr, i) => { let v = NB.V[tr.inst], m = mineOf(tr.inst)[i]; if (!m) return; X.mark(); Object.assign(tr.snd, v.def, JSON.parse(JSON.stringify(m[1]))); X.presetFx(tr, tr.snd); delete tr.snd._pre; tr.snd._mine = m[0]; X.touch(); X.showDock(); X.hear(tr.uid, 60); };
    function keepMine(tr, v, snd, x, y) {
        let cur = snd._pre != null && v.presets && v.presets[snd._pre] ? v.presets[snd._pre][0].split(' // ').pop() : '';
        X.inline(x, y, 200, snd._mine || (cur ? cur + ' (MINE)' : 'MY ' + v.en), name => {
            name = String(name || '').trim().slice(0, 32); if (!name) return;
            let list = mineOf(v.id).filter(m => m[0] !== name), keep = bare(snd); if (tr.fx && tr.fx.length) keep._fx = tr.fx.map(P => ({ type: P.type, p: JSON.parse(JSON.stringify(P.p)) })); list.push([name, keep]);
            if (mineSave(v.id, list)) { delete snd._pre; snd._mine = name; X.touch(); X.showDock(); X.flash('kept as ★ ' + name + ' (PRESETS ▾ + the browser)'); if (X.browse) X.browse(); }
        });
    }
    X.soundTab = function (box) {
        styles();
        let el = X.el, btn = X.btn, tr = X.selTr();
        if (!tr) { pickInst(box); return; }
        if (tr.isMaster && !X.pr.tracks.length) { pickInst(box); return; }
        if (NB.isBus(tr) && X.route) { X.route.panel(box, tr); return; }
        if (tr.isMaster) { box.appendChild(el('div', 'nb-hint', 'the master has no instrument. its plugins live in RACK, its fader in MIXER')); box.appendChild(btn('架 open the master rack', 'sm', () => X.setTab('rack'))); pickInst(box); return; }
        let v = NB.V[tr.inst];
        let top = el('div', 'nb-row'); top.style.marginBottom = '7px';
        let nm = el('input', 'nb-in'); nm.value = tr.name; nm.maxLength = 24; nm.onchange = () => { X.mark(); tr.name = nm.value || tr.name; X.touch(); };
        top.appendChild(nm);
        let cb = btn('■', 'sm', e => X.menu(e.clientX, e.clientY, [{ swatch: c => { X.mark(); tr.col = c; X.touch(); X.showDock(); } }]), 'colour'); cb.style.color = tr.col; top.appendChild(cb);
        const notes = v.kind !== 'audio';
        if (notes) top.appendChild(el('span', 'nb-lab', 'SWING')); if (notes) top.appendChild(X.selBox([[-1, 'same as the song']].concat([0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map(s => [s, Math.round(s * 66) + '%'])), tr.swing, x => { X.mark(); tr.swing = +x; X.touch(); }));
        if (notes) top.appendChild(el('span', 'nb-lab', 'FEEL')); if (notes) top.appendChild(X.feelBox([['', 'same as the song']], tr.groove || '', x => { X.mark(); tr.groove = x; X.touch(); }));
        if (notes) { let hk = X.knob('HUMAN', () => tr.human || 0, x => { tr.human = x; }, { cls: 'sm', def: 0.15, fmt: v => v < 0.01 ? 'robot' : '±' + Math.round(v * 16) + 'ms', start: X.mark, done: X.touch }); hk.title = 'how much it wanders off the grid and how uneven it hits, a bit different every time round'; top.appendChild(hk); }
        top.appendChild(btn('KICK', 'sm' + (tr.mix.key ? ' on' : ''), () => { X.mark(); tr.mix.key = tr.mix.key ? 0 : 1; X.touch(); X.showDock(); }, 'this track is a kick: anything with DUCK up gets out of its way'));
        if (!tr.mix.key) top.appendChild(X.knob('DUCK', () => tr.mix.duck, x => { tr.mix.duck = x; }, { cls: 'sm', def: 0, start: X.mark, done: X.touch }));
        top.appendChild(btn('＋ another track', 'sm', e => X.menu(e.clientX, e.clientY, NB.VOICES.filter(w => X.has(w.part)).map(w => [w.jp + ' ' + w.en, () => X.addTrack(w.id)]))));
        box.appendChild(top);
        if (!X.has(v.part)) { box.appendChild(el('div', 'nb-hint nb-lockd', v.jp + ' ' + v.en + ' came in with this song, but it isnt yours. it sits there quiet')); return; }
        if (tr.inst === 'coffin') { coffin(box, tr); return; }
        if (v.kind === 'audio' && window.NBA) NBA.soundPanel(box, tr);
        let locks = (X.lockNotes || []).filter(n => tr.clips.some(c => c.notes.indexOf(n) !== -1));
        plate(box, tr, v, tr.snd, locks, 'snd.');
    };
    function namesOf(fmt) { let out = []; for (let i = 0; i < 128; i++) { let t = fmt((i + 0.5) / 128); if (out[out.length - 1] !== t) out.push(t); } return out; }
    function tableOf(snd, key) { let k = key.slice(1).toLowerCase(); return snd[key] != null ? Math.round(snd[key]) : snd['t' + k] != null ? Math.min(15, Math.floor(snd['t' + k] * 16)) : ({ A: 0, B: 1, C: 2 })[key.slice(1)]; }
    const TPTS = 64;
    const STAMP = {
        SINE: i => 0.5 + 0.5 * Math.sin(i / TPTS * 6.2832), SAW: i => 1 - i / (TPTS - 1), SQUARE: i => i < TPTS / 2 ? 0.95 : 0.05, TRIANGLE: i => i < TPTS / 2 ? i / (TPTS / 2) : 2 - i / (TPTS / 2),
        PULSE: i => i < TPTS / 5 ? 0.95 : 0.05, 'HALF SINE': i => i < TPTS / 2 ? 0.5 + 0.5 * Math.sin(i / TPTS * 2 * 6.2832 / 2) : 0.5, NOISE: () => Math.random(), 'BENT SAW': i => 1 - Math.pow(i / (TPTS - 1), 2.5)
    };
    const TOOL = {
        SMOOTH: a => a.map((v, i) => (a[(i + TPTS - 1) % TPTS] + v * 2 + a[(i + 1) % TPTS]) / 4),
        NORMALISE: a => { let lo = Math.min.apply(0, a), hi = Math.max.apply(0, a), r = hi - lo || 1; return a.map(v => (v - lo) / r); },
        INVERT: a => a.map(v => 1 - v), REVERSE: a => a.slice().reverse(), MIRROR: a => a.map((v, i) => i < TPTS / 2 ? v : 1 - a[i - TPTS / 2]),
        FOLD: a => a.map(v => { let x = (v * 2 - 1) * 1.8; while (Math.abs(x) > 1) x = Math.sign(x) * 2 - x; return x * 0.5 + 0.5; }), CRUSH: a => a.map(v => Math.round(v * 6) / 6), '◀': a => a.slice(2).concat(a.slice(0, 2)), '▶': a => a.slice(-2).concat(a.slice(0, -2))
    };
    const harmOf = a => { let H = []; for (let h = 1; h <= 24; h++) { let re = 0, im = 0; for (let i = 0; i < TPTS; i++) { let x = a[i] * 2 - 1, w = 6.2832 * h * i / TPTS; re += x * Math.cos(w); im += x * Math.sin(w); } H.push([Math.hypot(re, im) * 2 / TPTS, Math.atan2(im, re)]); } return H; };
    const fromHarm = H => { let a = new Array(TPTS).fill(0); H.forEach(([m, ph], k) => { for (let i = 0; i < TPTS; i++) a[i] += m * Math.cos(6.2832 * (k + 1) * i / TPTS - ph); }); let pk = Math.max(1e-6, Math.max.apply(0, a.map(Math.abs))); return a.map(v => Math.round((v / pk * 0.5 + 0.5) * 1000) / 1000); };
    const resample = (src, n) => Array.from({ length: n }, (z, i) => { let p = i / n * src.length, k = Math.floor(p), f = p - k; return src[k % src.length] + (src[(k + 1) % src.length] - src[k % src.length]) * f; });
    const TE = { k: 0, harm: false };
    function tableEditor(box, snd, K) {
        let el = X.el, btn = X.btn;
        if (!Array.isArray(snd.wdk) || !snd.wdk.length) { snd.wdk = Array.isArray(snd.wd1) ? [resample(snd.wd1, TPTS)].concat(Array.isArray(snd.wd2) ? [resample(snd.wd2, TPTS)] : []) : [Array.from({ length: TPTS }, (z, i) => STAMP.SINE(i))]; snd.wdk = snd.wdk.map(a => a.map(v => Math.round(v * 1000) / 1000)); }
        if (snd.wdk.some(a => a.length !== TPTS)) snd.wdk = snd.wdk.map(a => a.length === TPTS ? a : resample(a, TPTS).map(v => Math.round(v * 1000) / 1000));
        TE.k = Math.min(TE.k, snd.wdk.length - 1);
        let w = el('div', 'nb-tedit'), top = el('div', 'nb-row');
        top.appendChild(el('span', 'nb-lab', 'THE TABLE · ' + snd.wdk.length + ' SHAPE' + (snd.wdk.length > 1 ? 'S' : '') + ' · POS walks through them'));
        snd.wdk.forEach((a, i) => top.appendChild(btn(String(i + 1), 'sm' + (i === TE.k ? ' on' : ''), () => { TE.k = i; X.showDock(); }, 'shape ' + (i + 1))));
        const done = () => { snd.wdk = snd.wdk.map(a => a.map(v => Math.round(Math.max(0, Math.min(1, v)) * 1000) / 1000)); X.touch(); X.showDock(); };
        if (snd.wdk.length < 8) top.appendChild(btn('＋ SHAPE', 'sm', () => { X.mark(); snd.wdk.splice(TE.k + 1, 0, snd.wdk[TE.k].slice()); TE.k++; done(); }, 'a copy of this one after it, then change it'));
        if (snd.wdk.length > 1) top.appendChild(btn('－', 'sm', () => { X.mark(); snd.wdk.splice(TE.k, 1); TE.k = Math.max(0, TE.k - 1); done(); }, 'take this shape out'));
        if (snd.wdk.length >= 2 && snd.wdk.length < 8) top.appendChild(btn('FILL BETWEEN', 'sm', () => { X.mark(); let a = snd.wdk[0], b = snd.wdk[snd.wdk.length - 1]; snd.wdk = Array.from({ length: 8 }, (z, k) => a.map((v, i) => v + (b[i] - v) * k / 7)); done(); }, 'eight shapes, sliding from the first to the last'));
        top.appendChild(btn(TE.harm ? '◉ HARMONICS' : '○ HARMONICS', 'sm' + (TE.harm ? ' on' : ''), () => { TE.harm = !TE.harm; X.showDock(); }, 'draw it as overtones instead: each bar is how loud that harmonic is'));
        w.appendChild(top);
        let cv = el('canvas', 'nb-scr nb-tecv'); cv.width = 640; cv.height = 170; w.appendChild(cv);
        const paint = () => {
            let dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth || 640, H = 170; if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
            let x = cv.getContext('2d'), A = getComputedStyle(cv).getPropertyValue('--a').trim() || '#8fffd0', a = snd.wdk[TE.k]; x.setTransform(dpr, 0, 0, dpr, 0, 0);
            x.fillStyle = '#040605'; x.fillRect(0, 0, W, H); x.strokeStyle = 'rgba(140,255,200,0.07)'; for (let i = 1; i < 8; i++) { x.beginPath(); x.moveTo(i * W / 8, 0); x.lineTo(i * W / 8, H); x.stroke(); } x.beginPath(); x.moveTo(0, H / 2); x.lineTo(W, H / 2); x.stroke();
            if (TE.harm) { let Hm = harmOf(a); Hm.forEach(([m], k) => { let bw = W / 24, bh = Math.min(1, m) * (H - 20); x.fillStyle = A; x.globalAlpha = 0.35 + Math.min(0.65, m); x.fillRect(k * bw + 2, H - 10 - bh, bw - 4, bh); x.globalAlpha = 1; x.fillStyle = 'rgba(200,255,220,0.4)'; x.font = '9px Courier New'; x.fillText(String(k + 1), k * bw + 4, H - 1); }); return; }
            [TE.k - 1, TE.k + 1].forEach(j => { let b = snd.wdk[j]; if (!b) return; x.strokeStyle = 'rgba(200,255,220,0.18)'; x.lineWidth = 1; x.beginPath(); b.forEach((v, i) => { let X0 = i / (TPTS - 1) * W, Y = H - 8 - v * (H - 16); if (i) x.lineTo(X0, Y); else x.moveTo(X0, Y); }); x.stroke(); });
            x.strokeStyle = A; x.lineWidth = 2.2; x.shadowColor = A; x.shadowBlur = 8; x.beginPath(); a.forEach((v, i) => { let X0 = i / (TPTS - 1) * W, Y = H - 8 - v * (H - 16); if (i) x.lineTo(X0, Y); else x.moveTo(X0, Y); }); x.stroke(); x.shadowBlur = 0;
            x.fillStyle = A; a.forEach((v, i) => { x.fillRect(i / (TPTS - 1) * W - 1.5, H - 8 - v * (H - 16) - 1.5, 3, 3); });
            x.fillStyle = 'rgba(200,255,220,0.5)'; x.font = '10px Courier New'; x.fillText(TL('SHAPE ' + (TE.k + 1) + ' · draw on it (shift = a straight line)'), 6, 13);
        };
        let last = null, anchor = null, snap = null;
        const at = e => { let r = cv.getBoundingClientRect(); return [Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), Math.max(0, Math.min(1, 1 - ((e.clientY - r.top) / r.height * 170 - 8) / 154))]; };
        const stroke = (e, first) => { let [u, v] = at(e), a = snd.wdk[TE.k];
            if (TE.harm) { let Hm = harmOf(a), k = Math.min(23, Math.floor(u * 24)); Hm[k][0] = v; let b = fromHarm(Hm); for (let i = 0; i < TPTS; i++) a[i] = b[i]; paint(); return; }
            let i = Math.round(u * (TPTS - 1));
            if (e.shiftKey && anchor) { let [ai, av] = anchor; for (let j = 0; j < TPTS; j++) a[j] = snap[j]; let lo = Math.min(ai, i), hi = Math.max(ai, i); for (let j = lo; j <= hi; j++) a[j] = hi === lo ? v : av + (v - av) * (j - ai) / (i - ai); }
            else { if (last != null && last !== i) { let s = Math.sign(i - last), lv = a[last]; for (let j = last + s; j !== i; j += s) a[j] = lv + (v - lv) * (j - last) / (i - last); } a[i] = v; }
            if (first) anchor = [i, v]; last = i; paint(); };
        cv.addEventListener('mousedown', e => { e.preventDefault(); X.mark(); last = null; snap = snd.wdk[TE.k].slice(); stroke(e, true); const mv = ev => stroke(ev), up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); anchor = null; done(); }; document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up); });
        let tools = el('div', 'nb-row'); tools.appendChild(el('span', 'nb-lab', 'STAMP'));
        Object.keys(STAMP).forEach(nm => tools.appendChild(btn(nm, 'sm', () => { X.mark(); snd.wdk[TE.k] = Array.from({ length: TPTS }, (z, i) => STAMP[nm](i)); done(); })));
        let tools2 = el('div', 'nb-row'); tools2.appendChild(el('span', 'nb-lab', 'DO'));
        Object.keys(TOOL).forEach(nm => tools2.appendChild(btn(nm, 'sm', () => { X.mark(); snd.wdk[TE.k] = TOOL[nm](snd.wdk[TE.k]); done(); })));
        tools2.appendChild(btn('BACK TO THE OLD WAY', 'sm', () => { X.mark(); delete snd.wdk; X.touch(); X.showDock(); }, 'forget the shapes list, use the start + end drawing again'));
        w.appendChild(tools); w.appendChild(tools2); box.appendChild(w); requestAnimationFrame(paint);
    }
    function drawLfo(cv, snd, n) {
        const K = 'lw' + n, Q = 'lq' + n, SH = n === 1 ? 'ls' : 'l' + n + 's';
        const geo = e => { let r = cv.getBoundingClientRect(), w = r.width, h = r.height, px = e.clientX - r.left, py = (e.clientY - r.top) * 64 / h; return { w, px, py, u: Math.max(0, Math.min(0.999, (px - 6) / (w - 12))), v: Math.max(0, Math.min(1, 1 - (py - 14) / 44)) }; };
        const PX = (u, w) => 6 + u * (w - 12), PY = v => 14 + (1 - v) * 44;
        const seg = (c, p) => { const m = c.length; let i = m - 1; for (let j = 0; j < m; j++) if (c[j][0] > p) { i = j - 1; break; } let a, b, x0, x1; if (i < 0) { a = c[m - 1]; b = c[0]; x0 = a[0] - 1; x1 = b[0]; } else if (i === m - 1) { a = c[m - 1]; b = c[0]; x0 = a[0]; x1 = b[0] + 1; } else { a = c[i]; b = c[i + 1]; x0 = a[0]; x1 = b[0]; } let uu = x1 - x0 > 1e-6 ? Math.max(0, Math.min(1, (p - x0) / (x1 - x0))) : 1, k = (a[2] || 0) * 8; if (Math.abs(k) > 1e-3) uu = (Math.exp(k * uu) - 1) / (Math.exp(k) - 1); return a[1] + (b[1] - a[1]) * uu; };
        const pts = () => { if (!Array.isArray(snd[Q]) || snd[Q].length < 2) { let lw = Array.isArray(snd[K]) && snd[K].length ? snd[K] : null; snd[Q] = lw ? lw.filter((z, i) => i % 2 === 0).map((v, i, a) => [Math.round(i / a.length * 1000) / 1000, v, 0]) : [[0, 0.5, 0.5], [0.25, 1, -0.5], [0.5, 0.5, 0.5], [0.75, 0, -0.5]]; } snd[Q].sort((a, b) => a[0] - b[0]); return snd[Q]; };
        cv.style.cursor = 'crosshair'; cv.title = 'drawn: click = a point, drag = move, right click = remove, the rings = curve. shift + drag = freehand';
        cv.addEventListener('contextmenu', e => { e.preventDefault(); let c = snd[Q]; if (!Array.isArray(c) || c.length <= 2) return; let g = geo(e), i = c.findIndex(p => Math.hypot(PX(p[0], g.w) - g.px, PY(p[1]) - g.py) < 8); if (i < 0) return; X.mark(); c.splice(i, 1); X.touch(); });
        cv.addEventListener('mousedown', e => { if (e.button === 2) return; e.preventDefault(); X.mark(); snd[SH] = 5.5 / 8;
            if (e.shiftKey) { delete snd[Q]; if (!Array.isArray(snd[K]) || snd[K].length !== 16) snd[K] = Array.from({ length: 16 }, (z, i) => Math.round((0.5 + 0.5 * Math.sin(i / 16 * 6.2832)) * 100) / 100);
                let last = null; const put = ev => { let g = geo(ev), i = Math.floor(g.u * 16) % 16, a = snd[K]; if (last != null && last !== i) { let s = Math.sign(i - last); for (let j = last + s; j !== i; j += s) a[j] = Math.round(g.v * 100) / 100; } a[i] = Math.round(g.v * 100) / 100; last = i; };
                put(e); const mv = ev => put(ev), up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); X.touch(); X.showDock(); }; document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up); return; }
            let c = pts(), g = geo(e), hit = c.findIndex(p => Math.hypot(PX(p[0], g.w) - g.px, PY(p[1]) - g.py) < 8), mode = 'pt';
            if (hit < 0) { hit = c.findIndex((p, i) => { let q = c[(i + 1) % c.length], xm = ((p[0] + (i === c.length - 1 ? q[0] + 1 : q[0])) / 2) % 1; return Math.hypot(PX(xm, g.w) - g.px, PY(seg(c, xm)) - g.py) < 7; }); if (hit >= 0) mode = 'cv'; }
            if (hit < 0) { c.push([Math.round(g.u * 1000) / 1000, Math.round(g.v * 100) / 100, 0]); c.sort((a, b) => a[0] - b[0]); hit = c.findIndex(p => p[0] === Math.round(g.u * 1000) / 1000); }
            let P = c[hit], y0 = g.py, c0 = P[2] || 0;
            const mv = ev => { let q = geo(ev); if (mode === 'pt') { let i = c.indexOf(P), lo = i > 0 ? c[i - 1][0] + 0.005 : 0, hi = i < c.length - 1 ? c[i + 1][0] - 0.005 : 0.999; P[0] = Math.round(Math.max(lo, Math.min(hi, q.u)) * 1000) / 1000; P[1] = Math.round(q.v * 100) / 100; }
                else { let up = P[1] <= c[(c.indexOf(P) + 1) % c.length][1]; P[2] = Math.round(Math.max(-1, Math.min(1, c0 + (y0 - q.py) / 30 * (up ? -1 : 1))) * 100) / 100; } };
            const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); X.touch(); X.showDock(); }; document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up); });
    }
    const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteOfHz = f => { let m = Math.round(69 + 12 * Math.log2(f / 440)); return NOTE_NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1); };
    function yin(d, sr, at, len) {
        let W = Math.min(len, 2048), lo = Math.floor(sr / 1500), hi = Math.min(Math.floor(sr / 40), Math.floor(W / 2)), dd = new Float64Array(hi + 2), run = 0, best = -1;
        if (at + W + hi >= d.length) return [0, 1];
        for (let tau = 1; tau <= hi + 1; tau++) { let s2 = 0; for (let i = 0; i < W - hi; i++) { let q = d[at + i] - d[at + i + tau]; s2 += q * q; } run += s2; dd[tau] = run > 0 ? s2 * tau / run : 1; }
        for (let tau = lo; tau <= hi; tau++) if (dd[tau] < 0.15) { while (tau + 1 <= hi && dd[tau + 1] < dd[tau]) tau++; best = tau; break; }
        if (best < 0) { let m = 1e9; for (let tau = lo; tau <= hi; tau++) if (dd[tau] < m) { m = dd[tau]; best = tau; } }
        let a = dd[best - 1], b = dd[best], c = dd[best + 1], sh = (a - 2 * b + c) ? 0.5 * (a - c) / (a - 2 * b + c) : 0;
        return [sr / (best + Math.max(-0.5, Math.min(0.5, sh))), dd[best]];
    }
    const monoOf = e => { if (!e.ch[1]) return e.ch[0]; let d = new Float32Array(e.n); for (let i = 0; i < e.n; i++) d[i] = (e.ch[0][i] + e.ch[1][i]) * 0.5; return d; };
    function findRoot(e, st, en) {
        let d = monoOf(e), a = Math.floor((st || 0) * e.n), b = Math.floor((en == null ? 1 : en) * e.n), fs = [];
        for (let at = a; at < b - 4096; at += Math.max(1024, Math.floor((b - a) / 40))) { let rm = 0; for (let i = 0; i < 1024; i++) rm += d[at + i] * d[at + i]; if (rm / 1024 < 1e-5) continue; let [f, q] = yin(d, e.sr, at, 2048); if (f > 0 && q < 0.2) fs.push(f); }
        if (!fs.length) return 0;
        fs.sort((x, y) => x - y); return fs[Math.floor(fs.length / 2)];
    }
    function tapeTable(e, st, en, root) {
        let d = monoOf(e), a = Math.floor((st || 0) * e.n), b = Math.floor((en == null ? 1 : en) * e.n), fr = [], H0 = 0;
        for (let f = 0; f < 16; f++) {
            let c = Math.floor(a + (b - a) * (f + 0.5) / 16), [f0, q] = yin(d, e.sr, Math.max(0, c - 1024), 2048); if (!(f0 > 0) || q > 0.35) f0 = root;
            let L = Math.max(1024, Math.round(e.sr / f0 * 4)), s0 = Math.max(0, Math.min(e.n - L - 1, c - (L >> 1))), H = Math.min(256, Math.floor(e.sr / 2 / f0) - 1), am = [], ph = [], ws = 0;
            for (let i = 0; i < L; i++) ws += 0.5 - 0.5 * Math.cos(2 * Math.PI * i / L);
            for (let k = 1; k <= H; k++) { let w0 = 2 * Math.PI * k * f0 / e.sr, re = 0, im = 0; for (let i = 0; i < L; i++) { let x = d[s0 + i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / L)); re += x * Math.cos(w0 * i); im -= x * Math.sin(w0 * i); } am.push(2 * Math.hypot(re, im) / ws); ph.push(Math.atan2(im, re)); }
            let p1 = ph[0] + Math.PI / 2; ph = ph.map((p, k) => { let q2 = p - (k + 1) * p1; q2 = q2 - 2 * Math.PI * Math.floor((q2 + Math.PI) / (2 * Math.PI)); return Math.round(q2 * 1000) / 1000; });
            let top = Math.max(1e-9, ...am); fr.push([am.map(v => Math.round(v / top * 10000) / 10000), ph]); H0 = Math.max(H0, H);
        }
        return { k: e.id + ':' + Math.round((st || 0) * 1000) + ':' + Math.round((en == null ? 1 : en) * 1000) + ':' + Date.now().toString(36), f: fr };
    }
    X.tapeTable = tapeTable; X.findRoot = findRoot; X.wtFile = e => wtFile(e);
    function wtFile(e) {
        let d = monoOf(e), N = 2048, n = Math.floor(e.n / N); if (n < 1) return null; let fr = [];
        for (let f = 0; f < 16; f++) { let c = n === 1 ? 0 : Math.round(f / 15 * (n - 1)), o = c * N, am = [], ph = [];
            for (let k = 1; k <= 256; k++) { let re = 0, im = 0, w0 = 2 * Math.PI * k / N; for (let i = 0; i < N; i++) { re += d[o + i] * Math.cos(w0 * i); im -= d[o + i] * Math.sin(w0 * i); } am.push(2 * Math.hypot(re, im) / N); ph.push(Math.round(Math.atan2(im, re) * 1000) / 1000); }
            let top = Math.max(1e-9, ...am); fr.push([am.map(v => Math.round(v / top * 10000) / 10000), ph]); }
        return { k: e.id + ':wt:' + Date.now().toString(36), f: fr, cycles: n };
    }
    const SDST = { pa: 0, pb: 1, pc: 2, xa: 3, xb: 4, xc: 5, fc: 6, fr: 7, fc2: 8, fma: 11, la: 12, lb: 13, lc3: 14, vol: 16, da: 17, db: 17, dc: 17, noise: 18, sub: 19, fr2: 20, nfc: 21, dam: 22, lr: 23, l2r: 24, wd: 25, l3r: 26, l4r: 27,
        sxa: 28, sxb: 29, sxc: 30, gza: 31, gzb: 31, gzc: 31, gda: 32, gdb: 32, gdc: 32, gsa: 33, gsb: 33, gsc: 33, hiv: 34, hta: 35, htb: 35, htc: 35, thv: 36, thz: 37, thg: 38 };
    const MOVERS = [[1, 'ENV 2', 'env'], [2, 'ENV 3', 'env'], [13, 'ENV 4', 'env'], [3, 'LFO 1', 'lfo'], [4, 'LFO 2', 'lfo'], [14, 'LFO 3', 'lfo'], [15, 'LFO 4', 'lfo'], [5, 'VELOCITY', 'hand'], [6, 'NOTE', 'hand'], [16, 'PRESS', 'hand'], [17, 'SLIDE', 'hand'], [18, 'WHEEL', 'hand'], [7, 'RANDOM', 'dice'], [9, 'MACRO 1', 'mac'], [10, 'MACRO 2', 'mac'], [11, 'MACRO 3', 'mac'], [12, 'MACRO 4', 'mac']];
    const MVN = si => (MOVERS.find(m => m[0] === si) || [si, si === 8 ? 'ENV 1' : 'a mover'])[1];
    const MCOL = { env: '#ffd36d', lfo: '#b98cff', hand: '#6dd3ff', dice: '#f4f0ff', mac: '#ff6db8' }, famOf = si => (MOVERS.find(m => m[0] === si) || [0, '', 'dice'])[2];
    let MXALL = false;
    function serpMods(p, gs, tr, v, snd) {
        let el = X.el, nS = 19, nD = 39, cl = (a, lo, hi) => Math.max(lo, Math.min(hi, a));
        const slots = () => { let out = []; for (let k = 1; k <= 16; k++) { let si = Math.min(nS - 1, Math.floor((snd['m' + k + 's'] || 0) * nS)), di = Math.min(nD - 1, Math.floor((snd['m' + k + 'd'] || 0) * nD)), a = ((snd['m' + k + 'a'] == null ? 0.5 : snd['m' + k + 'a']) - 0.5) * 2; if (si && Math.abs(a) > 0.005) out.push({ k, si, di, a }); } return out; };
        const mOn = () => (snd.onM == null ? 0.75 : snd.onM) >= 0.5;
        const ring = kn => {
            let key = kn.dataset.key, di = SDST[key]; kn.querySelectorAll('.nb-mr, .nb-mdot').forEach(q => q.remove()); kn.classList.remove('nb-moved'); if (di == null) return; kn.dataset.mod = 1;
            let S = slots().filter(q => q.di === di); if (!S.length) return;
            let mp = S.reduce((t, q) => t + Math.max(0, q.a), 0), mn = S.reduce((t, q) => t + Math.min(0, q.a), 0), c = MCOL[famOf(S[0].si)], w = kn.querySelector('.nb-kw');
            let r = el('i', 'nb-mr'), h = el('i', 'nb-mdot'); kn.classList.add('nb-moved'); kn.classList.toggle('nb-mxoff', !mOn());
            kn.style.setProperty('--mp', mp.toFixed(3)); kn.style.setProperty('--mn', mn.toFixed(3)); kn.style.setProperty('--m1', S[0].a.toFixed(3)); kn.style.setProperty('--mc', c);
            w.appendChild(r); w.appendChild(h);
            let say = S.map(q => MVN(q.si) + ' ' + (q.a > 0 ? '+' : '') + Math.round(q.a * 100) + '%').join(', ');
            h.title = 'moved by ' + say + (mOn() ? '' : ' (the matrix is switched off)') + ' // drag this dot up + down for how far ' + MVN(S[0].si) + ' moves it, right click to take it off';
            let y0 = 0, a0 = 0, k = S[0].k;
            h.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); X.mark(); y0 = e.clientY; a0 = snd['m' + k + 'a'] == null ? 0.5 : snd['m' + k + 'a']; h.setPointerCapture(e.pointerId); kn.classList.add('turn');
                const mv = e2 => { let a = cl(a0 + (y0 - e2.clientY) / (e2.shiftKey ? 900 : 220), 0, 1); snd['m' + k + 'a'] = a; let q = (a - 0.5) * 2, rest = S.slice(1); kn.style.setProperty('--m1', q.toFixed(3)); kn.style.setProperty('--mp', (Math.max(0, q) + rest.reduce((t, z) => t + Math.max(0, z.a), 0)).toFixed(3)); kn.style.setProperty('--mn', (Math.min(0, q) + rest.reduce((t, z) => t + Math.min(0, z.a), 0)).toFixed(3)); kn.querySelector('.nb-kv').textContent = (q > 0 ? '+' : '') + Math.round(q * 100) + '%'; X.apply(); };
                const up = () => { h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up); kn.classList.remove('turn'); X.touch(); X.showDock(); };
                h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up); });
            h.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); X.menu(e.clientX, e.clientY, [{ head: 'MOVED BY' }].concat(S.map(q => ['✕ take ' + MVN(q.si) + ' off', () => { X.mark(); snd['m' + q.k + 'a'] = 0.5; snd['m' + q.k + 's'] = 0; X.touch(); X.showDock(); }]))); });
        };
        gs.querySelectorAll('.nb-k[data-key]').forEach(ring);
        let seen = 0, hid = 0; gs.querySelectorAll('.nb-mxrow').forEach(r => { let n = +((r.querySelector('b') || {}).textContent || 0); if (n && !slots().some(q => q.k === n)) { r.classList.add('nb-mxempty'); if (seen++ && !MXALL) { r.classList.add('nb-mxhide'); hid++; } } });
        let mxk = gs.querySelector('.nb-grp-mx > .nb-ks'); if (mxk && (hid || MXALL)) { let b = el('button', 'nb-mxmore', MXALL ? '− just the ones in use' : '+ ' + hid + ' more empty slots'); b.type = 'button'; b.onclick = () => { MXALL = !MXALL; X.showDock(); }; mxk.appendChild(b); }
        let bar = el('div', 'nb-movers'); bar.appendChild(el('span', 'nb-movl', '動 MOVERS'));
        MOVERS.forEach(([si, nm, fam]) => {
            let c = el('button', 'nb-mvc', nm); c.type = 'button'; c.style.setProperty('--mc', MCOL[fam]); c.title = nm + ' // drag it onto a knob to have it move that knob (the knobs that can be moved light up)';
            if (slots().some(q => q.si === si)) c.classList.add('used');
            c.addEventListener('pointerdown', e => { if (e.button) return; e.preventDefault(); c.setPointerCapture(e.pointerId); let gh = null, x0 = e.clientX, y0 = e.clientY, over = null;
                const mv = e2 => { if (!gh && Math.hypot(e2.clientX - x0, e2.clientY - y0) > 4) { gh = el('div', 'nb-mvghost', nm); gh.style.setProperty('--mc', MCOL[fam]); document.body.appendChild(gh); p.classList.add('nb-modding'); }
                    if (!gh) return; gh.style.left = e2.clientX + 'px'; gh.style.top = e2.clientY + 'px'; let t = document.elementFromPoint(e2.clientX, e2.clientY), kn = t && t.closest && t.closest('.nb-k[data-mod]'); if (kn && !p.contains(kn)) kn = null; if (over !== kn) { if (over) over.classList.remove('nb-tgt'); over = kn; if (kn) kn.classList.add('nb-tgt'); } };
                const up = () => { c.removeEventListener('pointermove', mv); c.removeEventListener('pointerup', up); c.removeEventListener('pointercancel', up); if (gh) gh.remove(); p.classList.remove('nb-modding'); if (over) over.classList.remove('nb-tgt');
                    if (!gh) { X.flash('drag ' + nm + ' onto a knob'); return; } if (!over) return; let key = over.dataset.key, di = SDST[key], S = slots();
                    if (S.some(q => q.si === si && q.di === di)) { X.flash(nm + ' already moves that one. drag the dot on its ring for how far'); return; }
                    let free = 0; for (let k = 1; k <= 16 && !free; k++) { let si2 = Math.min(nS - 1, Math.floor((snd['m' + k + 's'] || 0) * nS)), a = snd['m' + k + 'a'] == null ? 0.5 : snd['m' + k + 'a']; if (!si2 || Math.abs(a - 0.5) < 0.003) free = k; }
                    if (!free) { X.flash('all sixteen matrix slots are taken. take one off first'); return; }
                    X.mark(); snd['m' + free + 's'] = (si + 0.5) / nS; snd['m' + free + 'd'] = (di + 0.5) / nD; snd['m' + free + 'a'] = 0.75; snd['m' + free + 'c'] = 0.5; snd['m' + free + 'x'] = 0; snd.onM = 0.75;
                    if ((si === 3 || si === 4 || si === 14 || si === 15) && (snd[{ 3: 'onL1', 4: 'onL2', 14: 'onL3', 15: 'onL4' }[si]] == null ? 0.75 : snd[{ 3: 'onL1', 4: 'onL2', 14: 'onL3', 15: 'onL4' }[si]]) < 0.5) snd[{ 3: 'onL1', 4: 'onL2', 14: 'onL3', 15: 'onL4' }[si]] = 0.75;
                    X.touch(); X.showDock(); X.flash(nm + ' → ' + over.querySelector('span').textContent + ' (slot ' + free + '). drag the dot on its ring for how far'); };
                c.addEventListener('pointermove', mv); c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up); });
            bar.appendChild(c); });
        return bar;
    }
    const SFAM = [[/^OSC |^FM$|^THE SOUNDS|^SUB$|^NOISE$/, '#5dffb0'], [/喉/, '#ff4d6d'], [/^FILTER/, '#ff9f43'], [/^DIST/, '#ff5a3c'], [/^ENV/, '#ffd36d'], [/^LFO/, '#b98cff'], [/^MATRIX|^MACROS/, '#ff6db8'], [/群/, '#d9c4ff'], [/律|^VOICE|出口/, '#e8dcc8']];
    function serpFam(gs) { gs.querySelectorAll(':scope > .nb-grp').forEach(g => { let t = g.querySelector('.nb-grph > span'), nm = t ? t.textContent : '', f = SFAM.find(q => q[0].test(nm)); if (!f) return; g.style.setProperty('--fc', f[1]); g.dataset.fam = 1; g.querySelectorAll('canvas').forEach(cv => { cv._acc = f[1]; }); }); }
    function mawPanel(body, cv, tr, snd) {
        let g = X.el('div', 'nb-mawrow');
        const take = ent => { if (!ent || ent.state !== 'ok') { X.flash('couldnt read that sound'); return; } X.mark(); let root = findRoot(ent, 0, 1); snd.smp = { id: ent.id, name: ent.name, root: root || 261.63 }; X.touch(); X.showDock(); X.flash('MAW ate ' + (ent.name || 'it') + (root ? ', its note is ' + noteOfHz(root) : ', no clear note (it plays from middle C)')); };
        const files = async fl => { fl = [...(fl || [])]; if (!fl.length || !window.NBA) return; try { take(await NBA.add(fl[0], fl[0].name)); } catch (er) { X.flash('couldnt read that sound'); } };
        g.appendChild(X.el('span', 'nb-mawname', snd.smp ? '喰 ' + (snd.smp.name || 'its sound') + ' · ' + noteOfHz(snd.smp.root || 261.63) : '喰 no sound loaded yet'));
        g.appendChild(X.btn('LOAD', 'sm', () => { let fi = document.createElement('input'); fi.type = 'file'; fi.accept = 'audio/*,.wav,.mp3,.ogg,.flac,.m4a,.aif,.aiff'; fi.onchange = () => files(fi.files); fi.click(); }, 'a sound off your computer'));
        g.appendChild(X.btn('FROM THE BOX', 'sm', async ev => { if (!window.NBA) return; let L = (await NBA.list()).slice(0, 30); if (!L.length) { X.flash('no sounds in the box yet. drop one on the timeline or LOAD one'); return; } X.menu(ev.clientX, ev.clientY, L.map(r => [r.name + (r.dur ? '  ' + r.dur.toFixed(1) + 's' : ''), async () => take(await NBA.load(r.id))])); }, 'one of the sounds already in the box (your clips, takes, bounces)'));
        g.appendChild(X.btn('FIND ITS NOTE', 'sm', async () => { if (!snd.smp) return; let ent = await NBA.load(snd.smp.id); if (!ent || ent.state !== 'ok') return; let r = findRoot(ent, snd.st || 0, snd.en == null ? 1 : snd.en); if (!r) { X.flash('no clear note in that bit'); return; } X.mark(); snd.smp.root = r; X.touch(); X.showDock(); X.flash('its note: ' + noteOfHz(r)); }, 'work out what note the sound is, so KEYS plays it in tune'));
        g.appendChild(X.btn('✕', 'sm', () => { if (!snd.smp) return; X.mark(); delete snd.smp; X.touch(); X.showDock(); }, 'let go of the sound (it stays in the box)'));
        body.appendChild(g);
        // it needs a sound first, everyone trips on this (me included)
        if (!snd.smp) { let hn = X.el('div', 'nb-hungry'); hn.appendChild(X.el('b', '', '喰 MAW plays a sound you give it. ')); hn.appendChild(X.el('span', '', 'it has no sound of its own, so the keys + presets do nothing until you load one: LOAD, FROM THE BOX, or drop a sound file on the screen above. the presets then shape that sound')); body.appendChild(hn); }
        cv.style.cursor = 'ew-resize'; cv.title = 'drag across = the bit it uses (START to END) · double click = all of it · drop a sound file here';
        cv.addEventListener('dragover', e => { e.preventDefault(); });
        cv.addEventListener('drop', e => { e.preventDefault(); files(e.dataTransfer && e.dataTransfer.files); });
        cv.addEventListener('dblclick', () => { X.mark(); snd.st = 0; snd.en = 1; X.touch(); X.showDock(); });
        cv.addEventListener('mousedown', e => { if (!snd.smp) return; e.preventDefault(); let r = cv.getBoundingClientRect(), u = ev => Math.max(0, Math.min(1, (ev.clientX - r.left - 6) / (r.width - 12))), a = u(e); X.mark();
            const mv = ev => { let b = u(ev); snd.st = Math.min(a, b); snd.en = Math.max(Math.min(a, b) + 0.01, Math.max(a, b)); }, up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); X.touch(); X.showDock(); };
            document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up); });
    }
    function smpPanel(g, cv, tr, snd) {
        const ZS = () => (snd._zs = snd._zs || { t: 'all', i: 0 }), list = t => { snd.zones = snd.zones || {}; if (!snd.zones.all && snd.smp && snd.smp.id) { snd.zones.all = [snd.smp]; delete snd.smp; } return (snd.zones[t] = snd.zones[t] || []); };
        const cur = () => { let z = ZS(), L = list(z.t); return L[Math.min(L.length - 1, z.i)]; };
        const osc = () => ZS().t === 'all' ? 'a' : ZS().t;
        const add = async ents => {
            let ok = ents.filter(e => e && e.state === 'ok'); if (!ok.length) { X.flash('couldnt read that sound'); return; }
            X.mark(); let L = list(ZS().t), msg = [];
            ok.forEach(ent => { let root = findRoot(ent, 0, 1); L.push({ id: ent.id, name: ent.name, root: root || 261.63, st: 0, en: 1, vel: 1 }); msg.push((ent.name || 'it') + ' at ' + (root ? noteOfHz(root) : 'no clear note (middle C)')); });
            ZS().i = L.length - 1; let k = osc(); if (Math.floor((snd['ok' + k] || 0) * 7) < 2 || Math.floor((snd['ok' + k] || 0) * 7) > 3) snd['ok' + k] = 3.5 / 7;
            X.touch(); X.showDock(); X.flash(msg.join(' · ') + (L.length > 1 ? '. ' + L.length + ' sounds now, spread across the keys' : ''));
        };
        const files = async fl => { fl = [...(fl || [])]; if (!fl.length || !window.NBA) return; X.flash('reading ' + fl.length + ' sound' + (fl.length > 1 ? 's' : '') + '…'); let got = []; for (const f of fl) { try { got.push(await NBA.add(f, f.name)); } catch (er) {} } add(got); };
        let row0 = X.el('div', 'nb-row nb-smprow');
        [['all', 'ALL THREE'], ['a', 'A'], ['b', 'B'], ['c', 'C']].forEach(([t, nm]) => { let n = ((snd.zones && snd.zones[t]) || (t === 'all' && snd.smp ? [snd.smp] : [])).length;
            row0.appendChild(X.btn(nm + (n ? ' · ' + n : ''), 'sm' + (ZS().t === t ? ' on' : ''), () => { ZS().t = t; ZS().i = 0; X.showDock(); }, t === 'all' ? 'the sounds every oscillator uses unless it has its own' : 'OSC ' + nm + '\'s own sounds (none = it uses ALL THREE\'s)')); });
        g.appendChild(row0);
        let L0 = (snd.zones && snd.zones[ZS().t]) || (ZS().t === 'all' && snd.smp ? [snd.smp] : []);
        if (L0.length > 1) { let rz = X.el('div', 'nb-row nb-smprow'); L0.forEach((z, i) => rz.appendChild(X.btn((i + 1) + ' ' + noteOfHz(z.root || 261.63) + ((z.vel == null || z.vel >= 1) ? '' : z.vel < 0.5 ? ' soft' : ' med'), 'sm' + (i === ZS().i ? ' on' : ''), () => { ZS().i = i; X.showDock(); }, (z.name || 'sound') + ': its own note is ' + noteOfHz(z.root || 261.63))));
            g.appendChild(rz); }
        let row = X.el('div', 'nb-row nb-smprow');
        row.appendChild(X.btn('LOAD', 'sm', () => { let fi = document.createElement('input'); fi.type = 'file'; fi.multiple = true; fi.accept = 'audio/*,.wav,.mp3,.ogg,.flac,.m4a,.aif,.aiff'; fi.onchange = () => files(fi.files); fi.click(); }, 'sounds off your computer, one or several (several = across the keys). they stay in this browser, nothing is sent anywhere'));
        row.appendChild(X.btn('FROM THE BOX', 'sm', async ev => { if (!window.NBA) return; let L = (await NBA.list()).slice(0, 30); if (!L.length) { X.flash('no sounds in the box yet. drop one on the timeline or LOAD one'); return; } X.menu(ev.clientX, ev.clientY, L.map(r => [r.name + (r.dur ? '  ' + r.dur.toFixed(1) + 's' : ''), async () => add([await NBA.load(r.id)])])); }, 'one of the sounds already in the box (your clips, takes, bounces)'));
        row.appendChild(X.btn('FIND ITS NOTE', 'sm', async () => { let z = cur(); if (!z) return; let ent = await NBA.load(z.id); if (!ent || ent.state !== 'ok') return; let r = findRoot(ent, z.st, z.en); if (!r) { X.flash('no clear note in that bit'); return; } X.mark(); z.root = r; X.touch(); X.showDock(); X.flash('its at ' + noteOfHz(r) + ' (' + Math.round(r) + 'hz)'); }, 'listen again for the note, in just the bit being used'));
        row.appendChild(X.btn('HOW HARD', 'sm', () => { let z = cur(); if (!z) return; X.mark(); let v = z.vel == null ? 1 : z.vel; z.vel = v >= 1 ? 0.7 : v >= 0.6 ? 0.35 : 1; X.touch(); X.showDock(); X.flash('this one is for ' + (z.vel >= 1 ? 'hard' : z.vel >= 0.6 ? 'medium' : 'soft') + ' hits now'); }, 'which hits this sound is for: hard, medium or soft. give the same note a soft sound + a hard sound and how hard you play picks between them'));
        row.appendChild(X.btn('MAKE A TABLE', 'sm', async () => { let z = cur(); if (!z) { X.flash('give it a sound first'); return; } let ent = await NBA.load(z.id); if (!ent || ent.state !== 'ok') return; X.flash('taking it apart…');
            setTimeout(() => { let K = osc().toUpperCase(); X.mark(); snd['wau' + K] = tapeTable(ent, z.st, z.en, z.root || 261.63); snd['t' + K] = NBFX.WT.TAPED; snd['ok' + osc()] = 0.5 / 7; snd['p' + osc()] = 0; X.touch(); X.showDock(); X.flash('made: OSC ' + K + ' reads it as the table TAPED now. POS walks through it start to end'); }, 30); }, 'turn the bit being used into a wavetable for this oscillator (ALL THREE = A): sixteen moments of it as frames POS morphs through'));
        row.appendChild(X.btn('LOAD A WAVETABLE', 'sm', () => { let fi = document.createElement('input'); fi.type = 'file'; fi.accept = '.wav,audio/wav'; fi.onchange = async () => { let f = fi.files && fi.files[0]; if (!f) return; let ent; try { ent = await NBA.add(f, f.name); } catch (er) { X.flash('couldnt read that file'); return; }
            let wt = wtFile(ent); if (!wt) { X.flash('thats shorter than one 2048 sample cycle, so its not a wavetable file. LOAD it as a sound instead'); return; } let K = osc().toUpperCase(); X.mark(); snd['wau' + K] = wt; snd['t' + K] = NBFX.WT.TAPED; snd['ok' + osc()] = 0.5 / 7; X.touch(); X.showDock(); X.flash('OSC ' + K + ' reads ' + f.name + ' now (' + wt.cycles + ' cycles in it, sixteen kept). POS walks through it'); }; fi.click(); }, 'a wavetable file (.wav, single cycles of 2048 samples end to end: the kind Serum, Vital + most others save + share) onto this oscillator'));
        row.appendChild(X.btn('✕', 'sm', () => { let L = list(ZS().t); if (!L.length) return; X.mark(); L.splice(Math.min(L.length - 1, ZS().i), 1); ZS().i = 0; X.touch(); X.showDock(); }, 'stop using the picked sound (it stays in the box)'));
        g.appendChild(row);
        cv.style.cursor = 'ew-resize'; cv.title = 'drag across = the bit it uses · double click = all of it · drop sound files here (several = across the keys)';
        cv.addEventListener('dragover', e => { e.preventDefault(); });
        cv.addEventListener('drop', e => { e.preventDefault(); files(e.dataTransfer && e.dataTransfer.files); });
        cv.addEventListener('dblclick', () => { let z = cur(); if (!z) return; X.mark(); z.st = 0; z.en = 1; X.touch(); X.showDock(); });
        cv.addEventListener('mousedown', e => { let z = cur(); if (!z) return; e.preventDefault(); let r = cv.getBoundingClientRect(), u = ev => Math.max(0, Math.min(1, (ev.clientX - r.left - 6 * r.width / cv.width) / (r.width * (1 - 12 / cv.width)))), a = u(e); X.mark();
            const mv = ev => { let b = u(ev); z.st = Math.min(a, b); z.en = Math.max(Math.min(a, b) + 0.01, Math.max(a, b)); }, up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); X.touch(); X.showDock(); };
            document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up); });
    }
    const SQ0 = () => Array.from({ length: 16 }, () => ({ o: 1, n: 0, v: 0.8, t: 0 }));
    function seqGrid(tr, snd) {
        let cv = X.el('canvas', 'nb-scr nb-seq'); cv.width = 420; cv.height = 76; cv.dataset.cxseq = tr.uid; cv.title = 'STEPS: top = on / rest (right click = tie into the next) · middle = up or down · bottom = how hard';
        const at = e => { let r = cv.getBoundingClientRect(), u = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height * 76; return [Math.max(0, Math.min(15, Math.floor(u * 16))), y]; };
        cv.addEventListener('contextmenu', e => e.preventDefault());
        cv.addEventListener('mousedown', e => { e.preventDefault(); X.mark(); if (!Array.isArray(snd.cxSq) || snd.cxSq.length !== 16) snd.cxSq = SQ0(); snd.cxSqOn = 0.75;
            let [i, y] = at(e), zone = y < 16 ? 0 : y > 62 ? 2 : 1, last = -1, tie = e.button === 2 || e.shiftKey, setOn = !snd.cxSq[i].o;
            const put = ev => { let [j, yy] = at(ev); if (zone === 0) { if (j === last) return; last = j; if (tie) snd.cxSq[j].t = snd.cxSq[j].t ? 0 : 1; else snd.cxSq[j].o = setOn ? 1 : 0; }
                else if (zone === 1) snd.cxSq[j].n = Math.max(-12, Math.min(12, Math.round((39 - yy) / 23 * 12)));
                else snd.cxSq[j].v = Math.round(Math.max(0.05, Math.min(1, (76 - yy) / 14)) * 100) / 100; };
            put(e); const mv = ev => put(ev), up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); X.touch(); }; document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up); });
        return cv;
    }
    function seqDraw(cv, D) {
        let tr = X.pr.tracks.find(t => t.uid === cv.dataset.cxseq); if (!tr) return; let s = tr.snd, q = s.cxSq && s.cxSq.length === 16 ? s.cxSq : SQ0(), on = (s.cxSqOn || 0) >= 0.5, N = 1 + Math.round((s.cxSqN == null ? 1 : s.cxSqN) * 15);
        let z = csz(cv); if (!z) return; let dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.max(160, Math.round(z[0] || 420)), h = 76; if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
        let x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.fillStyle = '#050a08'; x.fillRect(0, 0, w, h);
        let A = D.A || '#8fffd0', cw = w / 16, st = [1, 0.5, 1 / 3, 0.25, 1 / 6, 0.125][Math.min(5, Math.floor((s.cxRate == null ? 0.5 : s.cxRate) * 6))], cur = D.playing && on ? Math.floor((D.pos || 0) / st) % N : -1;
        x.strokeStyle = 'rgba(140,255,200,0.15)'; x.beginPath(); x.moveTo(0, 39); x.lineTo(w, 39); x.stroke();
        for (let i = 0; i < 16; i++) { let p = q[i], X0 = i * cw + 1.5, live = i < N, a = !on || !live ? 0.25 : 1;
            x.globalAlpha = a; x.fillStyle = i === cur ? '#fff' : p.o ? A : 'rgba(140,255,200,0.15)'; x.fillRect(X0, 3, cw - 3, 10);
            if (p.t && p.o) { x.fillRect(X0 + cw - 4, 6, 4, 4); }
            if (p.o) { let hh = (p.n || 0) / 12 * 23; x.fillStyle = A; x.globalAlpha = a * 0.75; x.fillRect(X0 + 2, Math.min(39, 39 - hh), cw - 7, Math.max(1.5, Math.abs(hh))); x.globalAlpha = a;
                if (p.n) { x.fillStyle = '#cfe'; x.font = '8px Courier New'; x.textAlign = 'center'; x.fillText((p.n > 0 ? '+' : '') + p.n, X0 + cw / 2 - 1, p.n > 0 ? 50 : 30); x.textAlign = 'left'; }
                x.fillStyle = 'rgba(140,255,200,0.5)'; x.fillRect(X0 + 1, 74 - (p.v == null ? 0.8 : p.v) * 12, cw - 5, (p.v == null ? 0.8 : p.v) * 12); } }
        x.globalAlpha = 1; x.fillStyle = on ? A : '#667'; x.font = '9px Courier New'; x.fillText(on ? 'STEPS · ' + N : 'STEPS off · draw to switch on', 4, h - 16 > 0 ? 24 : 24);
    }
    function drawTable(cv, snd, K) {
        let act = false, which = 'wd1';
        const pt = e => { let r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
        const put = e => { let [u, y] = pt(e), arr = snd[which]; let i = Math.max(0, Math.min(31, Math.floor((u - 0.04) / 0.72 * 32))), v = Math.max(0, Math.min(1, 1 - (y - 0.15) / 0.75)); arr[i] = v; if (arr._last != null) { let a = arr._last, b = i; for (let k = Math.min(a, b); k <= Math.max(a, b); k++) arr[k] = arr[a] + (v - arr[a]) * (b === a ? 1 : (k - a) / (b - a)); } arr._last = i; };
        cv.addEventListener('mousedown', e => {
            if (tableOf(snd, 't' + K) !== 24) return; e.preventDefault(); X.mark(); act = true; which = e.shiftKey ? 'wd2' : 'wd1';
            if (!Array.isArray(snd[which])) snd[which] = Array.from({ length: 32 }, (z, i) => 0.5 + 0.5 * Math.sin(i / 32 * 6.2832));
            put(e);
            const mv = ev => put(ev), up = () => { act = false; delete snd[which]._last; snd[which] = snd[which].map(v => Math.round(v * 1000) / 1000); document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); X.touch(); };
            document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
        });
        cv.addEventListener('mousemove', () => { cv.style.cursor = tableOf(snd, 't' + K) === 24 ? 'crosshair' : ''; });
    }
    const KEEP = /^(vol|oct|voice|cx(Tune|Fine|Out|Aoct|Chord|Arp|Rate|Gate|Vel|Drv|Tone))$/;
    function roll(v, k, q, cur) {
        if ((v.tables || []).indexOf(k) >= 0) { let own = NBFX.WT.NAMES.map((z, i) => i).filter(i => NB.tableOwned(i) && i !== 24 && i !== NBFX.WT.TAPED); return own[Math.floor(Math.random() * own.length)]; }
        if (KEEP.test(k)) return cur != null ? cur : q[2];
        if (Object.values(v.heads || {}).indexOf(k) >= 0) return Math.random() < 0.85 ? 0.75 : 0.25;
        let r = Math.random();
        if (/^(a\d|att|attack)$/.test(k)) return r * 0.3;
        if (/^(s\d|sus)$/.test(k)) return 0.35 + r * 0.65;
        if (/^(r\d|rel)$/.test(k)) return 0.05 + r * 0.5;
        if (/^(fc\d?|cut)$/.test(k)) return 0.35 + r * 0.65;
        return r;
    }
    async function audible(tr, v, snd) {
        try {
            let pr = NB.blankProject(); pr.bpm = 120; let t = NB.newTrack(pr, tr.inst); t.snd = JSON.parse(JSON.stringify(snd)); t.human = 0;
            let c = NB.newClip(0, 2); c.notes.push({ t: 0, d: 1, m: v.kind === 'drum' ? 60 : tr.inst === 'sump' || tr.inst === 'squirm' ? 45 : 60, v: 0.85 }); t.clips.push(c); pr.tracks.push(t);
            let o = await NB.bounce(pr, { what: 'song', tail: 0.6, rate: 22050 }), a = o.buf.getChannelData(0), e = 0, pk = 0;
            for (let i = 0; i < a.length; i++) { let q = a[i]; if (!isFinite(q)) return false; e += q * q; if (Math.abs(q) > pk) pk = Math.abs(q); }
            return Math.sqrt(e / a.length) > 0.004 && pk < 4;
        } catch (e) { return true; }
    }
    async function smartShake(tr, v, snd, keys, check) {
        let base = Object.assign({}, snd), cand = base;
        for (let n = 0; n < 8; n++) {
            cand = Object.assign({}, base); keys.forEach(k => { let q = v.p.find(x => x[0] === k); if (q) cand[k] = roll(v, k, q, base[k]); });
            if (!check || await audible(tr, v, cand)) return cand;
        }
        return cand;
    }
    function plate(box, tr, v, snd, locks, autoPre, drawerIdx) {
        let el = X.el, btn = X.btn, lk = locks && locks.length;
        let p = el('div', 'nb-plate nb-inst in-' + v.id + ' face-' + v.face), h = el('div', 'nb-ph');
        h.appendChild(kj(v.jp)); h.appendChild(el('span', '', v.en)); h.appendChild(el('small', lk ? 'lk' : '', lk ? '🔒 locking ' + locks.length + ' note' + (locks.length > 1 ? 's' : '') + ' only. yellow = locked' : v.sub));
        p.appendChild(h);
        let body = el('div', 'nb-pbody'), scr = el('canvas', 'nb-scr'); scr.width = 180; scr.height = 70; scr.style.width = '180px'; scr.style.height = '70px'; scr.dataset.scope = tr.uid;
        if (v.id === 'serpent') { scr.className = 'nb-scr nb-smap'; scr.removeAttribute('style'); delete scr.dataset.scope; scr.dataset.smap = tr.uid; scr.title = 'the sound right now: the three oscillators, the sub + the noise, through the filters, the distortion + the volume envelope, out. lit = on, dark = off, + what it sounds like underneath'; }
        if (v.draw) { scr.className = 'nb-scr nb-idraw'; scr.removeAttribute('style'); delete scr.dataset.scope; scr.dataset.idraw = tr.uid; if (drawerIdx != null) scr.dataset.drw = drawerIdx; scr.width = 360; scr.height = 120; }
        if (v.id === 'uta') { scr.className = 'nb-scr nb-vowel'; scr.removeAttribute('style'); delete scr.dataset.scope; scr.dataset.vowel = tr.uid; scr.title = 'the vowel map: where each vowel sits for this voice (the first two resonances, F1 down the side, F2 across), + a light for where it is now'; }
        body.appendChild(scr);
        if (v.id === 'maw' && !lk) mawPanel(body, scr, tr, snd);
        let ks = el('div', 'nb-ks');
        const mk = (key, label, def, fmt) => {
            let k = X.knob(label, () => lk ? (locks[0].L && locks[0].L[key] != null ? locks[0].L[key] : snd[key]) : snd[key], x => { if (lk) locks.forEach(n => { n.L = n.L || {}; n.L[key] = x; }); else snd[key] = x; },
                { fmt, def, tip: v.tips && v.tips[key], steps: stepsOf(fmt), mark: () => lk && locks[0].L && locks[0].L[key] != null, start: X.mark, done: X.touch, turn: () => { if (lk && X.rollDraw) X.rollDraw(); } });
            if (autoPre && !lk) X.autoable(k, tr, autoPre + key, label, () => snd[key]);
            k.dataset.key = key;
            return k;
        };
        if (v.groups) {
            let gs = el('div', 'nb-groups' + (v.big ? ' nb-mason' : '')), P = {}; v.p.forEach(q => { P[q[0]] = q; });
            let view = v.views ? (RS.view[v.id] || v.view0 || 'ALL') : 'ALL', vlist = v.views && (v.views.find(w => w[0] === view) || v.views[0])[1];
            if (v.views && !lk) { let vb = el('div', 'nb-views'); v.views.forEach(([nm]) => vb.appendChild(btn(nm, 'sm' + (nm === view ? ' on' : ''), () => { RS.view[v.id] = nm; try { localStorage.setItem('vmp_nb_view', JSON.stringify(RS.view)); } catch (e) {} X.showDock(); })));
                if (X.bigDock) { let big = !!(X.look && X.look.dockBig); vb.appendChild(btn(big ? '⤡ SMALL' : '⤢ GIVE IT ROOM', 'sm nb-roomb' + (big ? ' on' : ''), () => X.bigDock(!big), big ? 'the panel back to its own size' : 'the panel takes nearly the whole box (the timeline shrinks to a strip). for the big instruments')); }
                p.appendChild(vb); }
            const setKeys = (keys, fn) => { X.mark(); keys.forEach(k => { if (P[k]) snd[k] = fn(k, P[k]); }); X.touch(); X.showDock(); };
            v.groups.forEach(([name, scrName, keys, wide]) => {
                if (vlist && vlist.indexOf(name) < 0) return;
                let fk = v.id + '/' + name, hk = v.heads && v.heads[name], isOn = !hk || (snd[hk] == null ? P[hk][2] : snd[hk]) >= 0.5;
                let g = el('div', 'nb-grp' + (wide ? ' nb-grp-wide nb-grp-mx' : '') + (FOLD[fk] ? ' fold' : '') + (isOn ? '' : ' off')), gh = el('div', 'nb-grph'), gt = el('span', '', name);
                gt.title = 'click to fold this section away'; gt.onclick = () => { FOLD[fk] = FOLD[fk] ? 0 : 1; saveFold(); g.classList.toggle('fold', !!FOLD[fk]); };
                if (hk) { let sw = el('button', 'nb-sw2' + (isOn ? ' on' : '')); sw.type = 'button'; sw.title = isOn ? 'on. click to switch this section off' : 'off. click to switch it on'; sw.onclick = () => { X.mark(); snd[hk] = isOn ? 0.25 : 0.75; X.touch(); X.showDock(); }; sw.addEventListener('contextmenu', e => autoMenu(e, tr, autoPre + hk)); gh.appendChild(sw); }
                gh.appendChild(gt);
                if (!lk) { let dm = el('button', 'nb-gdots', '⋯'); dm.type = 'button'; dm.title = 'this section'; dm.onclick = e => {
                    let items = [['back to how it came', () => setKeys(keys, (k, q) => q[2])], ['shake just this', async () => { let got = await smartShake(tr, v, snd, keys, drawerIdx == null); setKeys(keys, k => got[k]); }]];
                    v.groups.filter(o => o[0] !== name && /^OSC /.test(o[0]) && /^OSC /.test(name)).forEach(o => items.push(['copy onto ' + o[0], () => { X.mark(); keys.forEach((k, i) => { let t = o[2][i]; if (t && snd[k] != null) snd[t] = snd[k]; }); if (v.heads && v.heads[o[0]] && hk) snd[v.heads[o[0]]] = snd[hk]; X.touch(); X.showDock(); }]));
                    X.menu(e.clientX, e.clientY, items); }; gh.appendChild(dm); }
                g.appendChild(gh);
                if (scrName === 'cxseq') { if (!lk) g.appendChild(seqGrid(tr, snd)); } else if (scrName) { let cv = el('canvas', 'nb-scr nb-vs'); cv.width = wide ? 420 : 200; cv.height = 64; cv.dataset.vs = scrName; cv.dataset.tr = tr.uid; g.appendChild(cv); if (/^wt/.test(scrName)) drawTable(cv, snd, scrName.slice(2)); if (v.id === 'serpent' && /^lfo[234]?$/.test(scrName) && !lk) drawLfo(cv, snd, scrName === 'lfo' ? 1 : +scrName.slice(3)); if (v.id === 'serpent' && scrName === 'smp' && !lk) smpPanel(g, cv, tr, snd); }
                let gk = el('div', 'nb-ks');
                keys.forEach(key => {
                    let q = P[key]; if (!q || (v.hide && v.hide(key, snd))) return;
                    if ((v.tables || []).indexOf(key) >= 0) {
                        let opts = NBFX.WT.NAMES.map((nm, i) => [i, nm[0] + ' ' + nm[1]]).filter(o => NB.tableOwned(o[0])), cur = tableOf(snd, key);
                        let sb = X.selBox(opts.map(o => [o[0], o[1]]), NB.tableOwned(cur) ? cur : 0, x => { X.mark(); snd[key] = +x; X.touch(); X.showDock(); }); sb.title = 'which wavetable'; gk.appendChild(sb);
                    } else if ((v.selects || []).indexOf(key) >= 0) {
                        let nm = namesOf(q[3]), n = nm.length, cur = Math.min(n - 1, Math.floor((snd[key] == null ? q[2] : snd[key]) * n));
                        let w = el('label', 'nb-pick'); w.appendChild(el('span', '', q[1])); if (v.tips && v.tips[key]) w.title = q[1] + ' // ' + v.tips[key];
                        w.appendChild(X.selBox(nm.map((t, i) => [i, t]), cur, x => { X.mark(); snd[key] = (+x + 0.5) / n; X.touch(); X.showDock(); }));
                        X.autoable(w, tr, autoPre + key, q[1], () => snd[key]); gk.appendChild(w);
                    } else gk.appendChild(mk(q[0], q[1], q[2], q[3]));
                });
                if (wide) { let cells = [...gk.querySelectorAll(':scope > *')], per = v.mxRow || 3; gk.innerHTML = ''; for (let i = 0; i < cells.length; i += per) { let row = el('div', 'nb-mxrow'); row.appendChild(el('b', '', String(i / per + 1))); cells.slice(i, i + per).forEach(k => row.appendChild(k)); gk.appendChild(row); } }
                g.appendChild(gk); gs.appendChild(g);
                let oK = /^OSC ([ABC])$/.exec(name);
                if (oK && !lk && tableOf(snd, 't' + oK[1]) === 24) {
                    let eb = el('button', 'nb-gdots' + (TE.open === oK[1] ? ' on' : ''), '✎'); eb.type = 'button'; eb.title = 'THE TABLE: draw your own wavetable, up to eight shapes'; eb.onclick = () => { TE.open = TE.open === oK[1] ? null : oK[1]; X.showDock(); }; gh.insertBefore(eb, gh.lastChild);
                    if (TE.open === oK[1]) { let holder = el('div', 'nb-grp nb-grp-wide nb-tewrap'); tableEditor(holder, snd, oK[1]); gs.appendChild(holder); }
                }
            });
            if (v.id === 'serpent') { serpFam(gs); if (!lk) p.appendChild(serpMods(p, gs, tr, v, snd)); }
            body.appendChild(gs); p.appendChild(body);
        } else {
            let out = el('div', 'nb-ks nb-outs'); out.appendChild(el('span', 'nb-outl', '出口 OUT'));
            v.p.forEach(([key, label, def, fmt]) => {
                if (key === 'model') { let nm = namesOf(fmt), n = nm.length, cur = Math.min(n - 1, Math.floor((snd.model == null ? def : snd.model) * n)), w = el('label', 'nb-pick nb-kind'); w.appendChild(el('span', '', label)); w.appendChild(X.selBox(nm.map((t, i) => [i, t]), cur, x => { X.mark(); snd.model = (+x + 0.5) / n; X.touch(); X.showDock(); if (drawerIdx != null) X.hear(tr.uid, NB.KITROOT + drawerIdx); })); if (autoPre) w.addEventListener('contextmenu', e => autoMenu(e, tr, autoPre + key)); ks.insertBefore(w, ks.firstChild); return; }
                (/^cx/.test(key) ? out : ks).appendChild(mk(key, label, def, fmt));
            });
            body.appendChild(ks); if (out.querySelectorAll(':scope > *').length > 1) { body.appendChild(out); if (!lk && v.p.some(q => q[0] === 'cxSqOn')) body.appendChild(seqGrid(tr, snd)); } p.appendChild(body);
        }
        let r = el('div', 'nb-row'); r.style.marginTop = '6px';
        r.appendChild(btn('▶ HEAR IT', 'sm', () => { if (!X.eng()) return; let m = drawerIdx != null ? NB.KITROOT + drawerIdx : (locks && locks[0] ? locks[0].m : (v.kind === 'drum' ? 60 : tr.inst === 'sump' || tr.inst === 'squirm' ? 45 : 64)); X.live().audition(tr.uid, m, Object.assign({ d: 1 }, lk ? locks[0] : {})); }));
        if (v.presets && !lk) {
            const load = i => { let n = v.presets.length; i = ((i % n) + n) % n; X.mark(); Object.assign(snd, v.def, JSON.parse(JSON.stringify(v.presets[i][1]))); X.presetFx(tr, snd); snd._pre = i; X.touch(); X.showDock(); X.hear(tr.uid, 60); if (v.id === 'maw' && !snd.smp) X.flash('MAW needs a sound: LOAD / FROM THE BOX, then the preset shapes it'); if (v.id === 'tick') setTimeout(() => X.hear(tr.uid, 60, { o: 1, d: 1 }), 280); };
            let pb = el('span', 'nb-prebar'), cur = snd._pre != null && v.presets[snd._pre] ? snd._pre : -1;
            pb.appendChild(btn('◀', 'sm', () => load(cur < 0 ? v.presets.length - 1 : cur - 1), 'the one before'));
            let nm = el('span', 'nb-prename', snd._mine ? '★ ' + snd._mine : cur >= 0 ? v.presets[cur][0] : '(your own)'); nm.title = 'which preset this started from'; pb.appendChild(nm);
            pb.appendChild(btn('▶', 'sm', () => load(cur + 1), 'the next one'));
            pb.appendChild(btn('PRESETS ▾', 'sm', e => { let mine = mineOf(v.id), items = [];
                if (mine.length) { items.push({ head: '★ YOURS' }); mine.forEach((m, i) => items.push(['★ ' + m[0], () => X.loadMine(tr, i)])); items.push({ head: 'BUILT IN' }); }
                v.presets.forEach(([n2], i) => items.push([n2, () => load(i)]));
                items.push('-'); items.push(['✚ keep this sound as one of yours…', () => keepMine(tr, v, snd, e.clientX, e.clientY)]);
                items.push(['⇩ export all yours to a file', () => X.exportMine()]); items.push(['⇧ import presets from a file…', () => X.importMine()]);
                if (mine.length) items.push(['✕ forget one of yours…', () => X.menu(e.clientX, e.clientY, mine.map((m, i) => ['✕ ' + m[0], () => { let l = mineOf(v.id); l.splice(i, 1); mineSave(v.id, l); if (snd._mine === m[0]) delete snd._mine; X.showDock(); if (X.browse) X.browse(); X.flash('forgot ★ ' + m[0]); }]))]);
                X.menu(e.clientX, e.clientY, items); }, 'starting points, + the ones youve kept. every one is just knobs'));
            pb.appendChild(btn('✚ KEEP', 'sm', e => { let rr = e.currentTarget.getBoundingClientRect(); keepMine(tr, v, snd, rr.left, rr.bottom + 4); }, 'keep this sound as one of your own presets (it goes in PRESETS ▾ + the browser)'));
            r.appendChild(pb);
        }
        r.appendChild(btn('🎲 SHAKE', 'sm', async () => { X.mark(); X.flash('shaking…'); let got = await smartShake(tr, v, snd, v.p.map(q => q[0]), !lk && drawerIdx == null); v.p.forEach(q => { let x = got[q[0]]; if (lk) locks.forEach(n => { n.L = n.L || {}; n.L[q[0]] = x; }); else snd[q[0]] = x; }); delete snd._pre; X.touch(); X.showDock(); X.flash('shaken. undo gets the old one back'); }, 'every knob somewhere random, but it checks it still makes a sound first. undo gets it back'));
        r.appendChild(btn(v.presets ? 'INIT' : 'FLAT', 'sm', () => { X.mark(); if (lk) locks.forEach(n => { delete n.L; }); else { Object.assign(snd, v.def); delete snd._pre; } X.touch(); X.showDock(); }, 'every knob back to where it starts: a plain sound to build from'));
        if (lk) r.appendChild(btn('done locking', 'sm on', () => { X.lockNotes = null; X.showDock(); }));
        p.appendChild(r); box.appendChild(p);
        human(p, v.id, v);
    }
    function coffin(box, tr) {
        let el = X.el, btn = X.btn, drs = tr.snd.drawers, voices = ['stomp', 'anvil', 'slap', 'tick', 'chime', 'steel', 'zap', 'lash', 'bones'].filter(w => X.has(NB.V[w].part));
        let p = el('div', 'nb-plate face-coffin nb-cof'), h = el('div', 'nb-ph');
        h.appendChild(kj('棺')); h.appendChild(el('span', '', 'COFFIN · THE DRUM RACK')); h.appendChild(el('small', '', drs.length + ' drawers, any drum in each, one row each in the roll. A–K play 1–8, Q–I play 9–16. right click a drawer for copy / paste / clear'));
        p.appendChild(h);
        let rack = el('div', 'nb-cofrack');
        const kindOf = d => { let q = NB.V[d.voice].p.find(z => z[0] === 'model'); return q || null; };
        drs.forEach((d, i) => {
            let u = el('div', 'nb-unit' + (RS.drawer === i ? ' on' : '') + (d.mute ? ' muted' : ''));
            u.onclick = e => { if (/INPUT|SELECT|BUTTON/.test(e.target.tagName) || e.target.closest('.nb-k')) return; RS.drawer = i; X.hear(tr.uid, NB.KITROOT + i); X.showDock(); };
            u.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); X.menu(e.clientX, e.clientY, [
                ['▶ hear it', () => X.hear(tr.uid, NB.KITROOT + i)],
                ['copy this drawer', () => { RS.clip = JSON.parse(JSON.stringify(d)); X.flash('drawer ' + (i + 1) + ' copied'); }],
                ['paste over it', () => { if (!RS.clip) return; X.mark(); drs[i] = JSON.parse(JSON.stringify(RS.clip)); X.touch(); X.showDock(); }],
                ['empty it (a plain STOMP)', () => { X.mark(); drs[i] = { voice: 'stomp', name: 'EMPTY', snd: Object.assign({}, NB.V.stomp.def), vol: 0.8, pan: 0.5, tune: 0.5, o: 0 }; X.touch(); X.showDock(); }]]); };
            u.appendChild(el('i', 'nb-scrw')); let led = el('i', 'nb-led2'); led.dataset.led = i; u.appendChild(led);
            u.appendChild(el('b', 'nb-uno', String(i + 1).padStart(2, '0')));
            let nm = el('input', 'nb-in nb-unm'); nm.value = d.name; nm.maxLength = 8; nm.onchange = () => { X.mark(); d.name = nm.value.toUpperCase() || d.name; X.touch(); }; u.appendChild(nm);
            let vs = X.selBox((voices.indexOf(d.voice) < 0 ? voices.concat([d.voice]) : voices).map(w => [w, NB.V[w].jp + ' ' + NB.V[w].en]), d.voice, x => { X.mark(); d.voice = x; d.snd = Object.assign({}, NB.V[x].def); X.touch(); RS.drawer = i; X.showDock(); }); vs.title = 'which drum lives in this drawer'; u.appendChild(vs);
            let kq = kindOf(d);
            if (kq) { let nmz = namesOf(kq[3]), n = nmz.length, cur = Math.min(n - 1, Math.floor((d.snd.model || 0) * n)); let ks2 = X.selBox(nmz.map((t, j) => [j, t]), cur, x => { X.mark(); d.snd.model = (+x + 0.5) / n; X.touch(); X.hear(tr.uid, NB.KITROOT + i); X.showDock(); }); ks2.title = 'what kind of ' + NB.V[d.voice].en.toLowerCase(); u.appendChild(ks2); }
            else u.appendChild(el('span', 'nb-ugap'));
            let ks = el('div', 'nb-ks');
            ks.appendChild(X.knob('TUNE', () => d.tune, x => { d.tune = x; }, { cls: 'sm', def: 0.5, fmt: x => { let s2 = Math.round((x - 0.5) * 24); return (s2 > 0 ? '+' : '') + s2; }, start: X.mark, done: X.touch }));
            ks.appendChild(X.knob('VOL', () => d.vol, x => { d.vol = x; }, { cls: 'sm', def: 0.8, start: X.mark, turn: X.apply, done: X.touch }));
            ks.appendChild(X.knob('PAN', () => d.pan, x => { d.pan = x; }, { cls: 'sm', def: 0.5, start: X.mark, turn: X.apply, done: X.touch }));
            ks.appendChild(X.knob('VARY', () => d.vary == null ? 0.15 : d.vary, x => { d.vary = x; }, { cls: 'sm', def: 0.15, tip: 'every hit a hair different (tune, how hard, each knob), the way a sampled kit takes turns between recordings', start: X.mark, done: X.touch }));
            u.appendChild(ks);
            u.appendChild(btn('M', 'sm' + (d.mute ? ' on' : ''), () => { X.mark(); d.mute = d.mute ? 0 : 1; X.touch(); X.apply(); X.showDock(); }, 'mute this drawer'));
            let cg = X.selBox([[0, '✂ –'], [1, '✂ A'], [2, '✂ B'], [3, '✂ C'], [4, '✂ D']], d.cg || 0, x => { X.mark(); d.cg = +x; X.touch(); }); cg.title = 'drawers in the same choke group cut each other off (an open hat + a shut one)'; u.appendChild(cg);
            if (d.voice === 'tick') u.appendChild(btn('○', 'sm' + (d.o ? ' on' : ''), () => { X.mark(); d.o = d.o ? 0 : 1; X.touch(); X.showDock(); }, 'OPEN: this drawer always rings open'));
            u.appendChild(el('i', 'nb-scrw r'));
            rack.appendChild(u);
        });
        p.appendChild(rack); box.appendChild(p); human(p, 'coffin', NB.V.coffin);
        let d = drs[RS.drawer] || drs[0];
        let lab = el('div', 'nb-drwlab', '▼ drawer ' + String((RS.drawer || 0) + 1).padStart(2, '0') + ' · ' + d.name + ' · its whole faceplate'); box.appendChild(lab);
        plate(box, tr, NB.V[d.voice], d.snd, null, null, RS.drawer);
    }
    function pickInst(box) {
        let el = X.el, g = el('div', 'nb-pick');
        box.appendChild(el('div', 'nb-hint', 'pick an instrument to make a track with it'));
        NB.VOICES.forEach(v => {
            if (!X.has(v.part)) return;
            let c = el('div', 'nb-plate face-' + v.face), h = el('div', 'nb-ph');
            h.appendChild(kj(v.jp)); h.appendChild(el('span', '', v.en)); c.appendChild(h); c.appendChild(el('div', 'nb-fxs', v.sub.split(/[.:]/)[0].length > 40 ? '' : TL(v.sub).split(/[.。:：]/)[0]));
            c.onclick = () => { let t = X.addTrack(v.id); if (t) X.showDock(); };
            g.appendChild(c);
        });
        box.appendChild(g);
    }

    X.rackTab = function (box) {
        styles();
        let el = X.el, btn = X.btn, tr = X.selTr();
        if (!tr) { box.appendChild(el('div', 'nb-hint', 'add a track first')); return; }
        X.eng();
        let top = el('div', 'nb-row'); top.style.marginBottom = '7px';
        top.appendChild(el('span', 'nb-lab', '架 RACK › ' + (tr.isMaster ? '主 MASTER (everything goes through this last)' : tr.name)));
        top.appendChild(btn('＋ PLUGIN', 'sm', e => {
            if (tr.fx.length >= X.lim().fx) { X.flash(X.lim().fx + ' plugins a track' + (X.has('nb_tape') ? '' : ' without the long tape')); return; }
            let items = []; NBFX.LIST.forEach(d => { if (!X.has(d.part)) return; if (['back', 'fault', 'bind', 'drip', 'possess', 'bleed'].indexOf(d.id) >= 0 && items.length && items[items.length - 1] !== '-') items.push('-'); items.push([d.jp + ' ' + d.en + (!d.sub || d.sub.split(/[.:]/)[0].length > 40 ? '' : ' · ' + TL(d.sub).split(/[.。:：]/)[0]), () => { X.mark(); tr.fx.push(NB.newFx(d.id)); X.touch(); X.showDock(); X.lastFx(); }]); }); X.menu(e.clientX, e.clientY, items);
        }));
        top.appendChild(btn(tr.isMaster ? 'pick a track' : '主 the master rack', 'sm', () => { X.pick(tr.isMaster ? (X.pr.tracks[0] ? X.pr.tracks[0].uid : 'master') : 'master'); }));
        box.appendChild(top);
        if (!tr.fx.length) {
            box.appendChild(el('div', 'nb-hint', 'nothing in the rack yet. ＋ PLUGIN puts one in. the sound goes through them left to right' + (tr.isMaster ? ', then out' : ', then the mixer')));
            // same cards as the instruments get, so plugins dont feel like a boring list
            let g = el('div', 'nb-pick nb-pickfx');
            NBFX.LIST.forEach(d => {
                if (!X.has(d.part)) return;
                let c = el('div', 'nb-plate face-' + d.face + ' fx-' + d.id), h = el('div', 'nb-ph');
                h.appendChild(kj(d.jp)); h.appendChild(el('span', '', d.en)); c.appendChild(h); c.appendChild(el('div', 'nb-fxs', d.sub.split(/[.:]/)[0].length > 40 ? '' : TL(d.sub).split(/[.。:：]/)[0]));
                c.onclick = () => { if (tr.fx.length >= X.lim().fx) return; X.mark(); tr.fx.push(NB.newFx(d.id)); X.touch(); X.showDock(); X.lastFx(); };
                g.appendChild(c);
            });
            box.appendChild(g);
            return;
        }
        let row = el('div', 'nb-rack');
        tr.fx.forEach((P, i) => row.appendChild(card(tr, P, i)));
        box.appendChild(row);
        box.appendChild(el('div', 'nb-hint', 'the light = on/off · ◀ ▶ = order · right click a knob = draw a lane for it on the timeline'));
    };

    // scroll down to the one you just put in, otherwise it lands off screen and you think nothing happened
    X.lastFx = () => setTimeout(() => { let all = document.querySelectorAll('.nb-rack .nb-fxc'), c = all[all.length - 1]; if (!c) return; c.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); c.classList.add('nb-new'); setTimeout(() => c.classList.remove('nb-new'), 900); }, 40);

    const hh = (s, k) => { let h = 2166136261; s = s + ':' + k; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; };
    function human(c, id, d) {
        let r = hh(id, 'tilt'); c.style.transform = 'rotate(' + ((r - 0.5) * 0.7).toFixed(2) + 'deg)';
        let sc = document.createElement('div'); sc.className = 'nb-scuff'; sc.style.backgroundPosition = Math.round(hh(id, 'sx') * 200) + 'px ' + Math.round(hh(id, 'sy') * 80) + 'px'; c.appendChild(sc);
        setTimeout(() => c.querySelectorAll('.nb-kn').forEach((k, i) => { if (hh(id, 'w' + i) < 0.3) k.classList.add('worn'); }), 0);
    }
    function paintOn(cv, P, d) {
        const at = e => { let r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
        cv.style.cursor = 'crosshair';
        cv.addEventListener('mousedown', e => {
            e.preventDefault(); X.mark(); let [u, v] = at(e), last = d.paint(P.p, u, v, null); X.apply();
            const mv = ev => { let [u2, v2] = at(ev); last = d.paint(P.p, u2, v2, last); X.apply(); }, up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); X.touch(); };
            document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
        });
    }
    function laneTools(c, P, d) {
        let row = X.el('div', 'nb-row'); row.style.margin = '0 0 6px'; row.style.flexWrap = 'wrap';
        const lane = () => d.lanes[Math.min(d.lanes.length - 1, Math.floor((P.p.edit || 0) * d.lanes.length))];
        Object.keys(NBFX.SHAPES).forEach(nm => row.appendChild(X.btn(nm, 'sm', () => { X.mark(); P.p[lane()] = NBFX.SHAPES[nm](); X.touch(); X.apply(); }, 'put this shape on the lane youre drawing on')));
        row.appendChild(X.btn('◀', 'sm', () => { X.mark(); let a = P.p[lane()]; if (a) a.push(a.shift()); X.touch(); X.apply(); }, 'slide it earlier'));
        row.appendChild(X.btn('▶', 'sm', () => { X.mark(); let a = P.p[lane()]; if (a) a.unshift(a.pop()); X.touch(); X.apply(); }, 'slide it later'));
        row.appendChild(X.btn('FLIP', 'sm', () => { X.mark(); let a = P.p[lane()]; if (a) P.p[lane()] = a.map(v => Math.round((1 - v) * 100) / 100); X.touch(); X.apply(); }, 'upside down'));
        c.appendChild(row);
    }
    function irRow(c, P) {
        let row = X.el('div', 'nb-row nb-irrow'), nm = X.el('span', 'nb-irname', P.p.ir ? '室 ' + (P.p.ir.name || 'your room') : '室 no room of yours yet');
        const take = ent => { if (!ent || ent.state !== 'ok') { X.flash('couldnt read that sound'); return; } X.mark(); P.p.ir = { id: ent.id, name: ent.name }; P.p.own = 0.75; X.touch(); X.showDock(); X.flash((ent.name || 'that') + ' is the room now (' + ent.dur.toFixed(1) + 's)'); };
        row.appendChild(nm);
        row.appendChild(X.btn('LOAD', 'sm', () => { let fi = document.createElement('input'); fi.type = 'file'; fi.accept = 'audio/*,.wav,.mp3,.ogg,.flac,.m4a,.aif,.aiff'; fi.onchange = async () => { let f = fi.files && fi.files[0]; if (!f || !window.NBA) return; try { take(await NBA.add(f, f.name)); } catch (er) { X.flash('couldnt read that sound'); } }; fi.click(); }, 'a recording of a room (or anything) off your computer: a clap in a stairwell, a spring, a bin lid'));
        row.appendChild(X.btn('FROM THE BOX', 'sm', async ev => { if (!window.NBA) return; let L = (await NBA.list()).slice(0, 30); if (!L.length) { X.flash('no sounds in the box yet'); return; } X.menu(ev.clientX, ev.clientY, L.map(r => [r.name + (r.dur ? '  ' + r.dur.toFixed(1) + 's' : ''), async () => take(await NBA.load(r.id))])); }, 'one of the sounds already in the box as the room'));
        if (P.p.ir) row.appendChild(X.btn('✕', 'sm', () => { X.mark(); delete P.p.ir; P.p.own = 0; X.touch(); X.showDock(); }, 'back to the rooms it makes itself'));
        c.appendChild(row);
    }
    const PUPMIX = [['vol', 'VOLUME'], ['pan', 'PAN'], ['room', 'ROOM SEND'], ['echo', 'ECHO SEND'], ['lc', 'LOW CUT'], ['hc', 'HIGH CUT']];
    function pupName(tr, path) { if (!path) return null; let s2 = path.split('.'); if (s2[0] === 'mix') { let m = PUPMIX.find(q => q[0] === s2[1]); return m ? 'the strip · ' + m[1] : null; }
        let Q = tr.fx.find(x => x.uid === s2[1]), d2 = Q && NBFX.BY[Q.type], q = d2 && d2.p.find(z => z[0] === s2[2]); return q ? d2.en + ' · ' + q[1] : null; }
    function pupRows(c, tr, P) {
        let g = X.el('div', 'nb-puprows');
        [1, 2, 3, 4].forEach(k => { let row = X.el('div', 'nb-row nb-puprow'), path = P.p['t' + k], nm = pupName(tr, path);
            row.appendChild(X.el('span', 'nb-pupk', k + ' →'));
            row.appendChild(X.btn(nm || (path ? '(its gone)' : '＋ what it moves'), 'sm' + (nm ? ' on' : ''), ev => {
                let items = [];
                tr.fx.forEach(Q => { if (Q === P || Q.type === 'puppet') return; let d2 = NBFX.BY[Q.type]; if (!d2) return; items.push({ head: d2.jp + ' ' + d2.en }); d2.p.forEach(q => items.push([q[1], () => { X.mark(); P.p['t' + k] = 'fx.' + Q.uid + '.' + q[0]; if (Math.abs((P.p['a' + k] == null ? 0.5 : P.p['a' + k]) - 0.5) < 0.01) P.p['a' + k] = 0.75; X.touch(); X.showDock(); }])); });
                items.push({ head: 'THE STRIP' }); (tr.isMaster ? PUPMIX.slice(0, 1) : PUPMIX).forEach(([key, lab]) => items.push([lab, () => { X.mark(); P.p['t' + k] = 'mix.' + key; if (Math.abs((P.p['a' + k] == null ? 0.5 : P.p['a' + k]) - 0.5) < 0.01) P.p['a' + k] = 0.75; X.touch(); X.showDock(); }]));
                X.menu(ev.clientX, ev.clientY, items); }, 'pick what number ' + k + ' moves: any knob on another plugin on this track, or the strip'));
            if (path) row.appendChild(X.btn('✕', 'sm', () => { X.mark(); delete P.p['t' + k]; X.touch(); X.showDock(); }, 'stop moving it'));
            g.appendChild(row); });
        c.appendChild(g);
    }
    function card(tr, P, i) {
        let el = X.el, btn = X.btn, d = NBFX.BY[P.type], lk = !X.has(d.part), c = el('div', 'nb-plate nb-fxc fx-' + d.id + ' face-' + d.face + (P.on && !lk ? '' : ' off'));
        let h = el('div', 'nb-fxh'), led = el('i', 'nb-led' + (P.on ? ' on' : ''));
        led.onclick = () => { X.mark(); P.on = P.on ? 0 : 1; X.touch(); X.showDock(); }; led.title = 'on / off';
        h.appendChild(led); h.appendChild(kj(d.jp));
        let nm = el('span', '', d.en); h.appendChild(nm);
        let bar = el('div', 'nb-fxb');
        bar.appendChild(btn('◀', '', () => { if (!i) return; X.mark(); tr.fx.splice(i - 1, 0, tr.fx.splice(i, 1)[0]); X.touch(); X.showDock(); }, 'earlier in the chain'));
        bar.appendChild(btn('▶', '', () => { if (i >= tr.fx.length - 1) return; X.mark(); tr.fx.splice(i + 1, 0, tr.fx.splice(i, 1)[0]); X.touch(); X.showDock(); }, 'later in the chain'));
        bar.appendChild(btn('🎲', '', () => { X.mark(); d.p.forEach(q => { P.p[q[0]] = Math.random(); }); if (d.id === 'cage') P.p.pat = P.p.pat.map(() => Math.random() < 0.6 ? 1 : 0); if (d.steps) P.p.seq = faultDice(); X.touch(); X.showDock(); }, 'shake every knob on this one (undo gets it back)'));
        bar.appendChild(btn('A', '', e => X.menu(e.clientX, e.clientY, d.p.map(q => [(tr.auto.some(a => a.path === 'fx.' + P.uid + '.' + q[0]) ? '✓ ' : '') + q[1], () => addLane(tr, 'fx.' + P.uid + '.' + q[0])])), 'automate one of these knobs: it gets its own lane under the track on the timeline'));
        bar.appendChild(btn('⌀', '', () => { X.mark(); Object.assign(P.p, d.def, d.extra ? d.extra() : {}); X.touch(); X.showDock(); }, 'every knob back where it started'));
        bar.appendChild(btn('✕', '', () => { X.mark(); tr.fx.splice(i, 1); tr.auto = tr.auto.filter(a => a.path.indexOf('fx.' + P.uid + '.') !== 0); X.touch(); X.showDock(); X.dirty(); }, 'take it out'));
        c.appendChild(h); c.appendChild(bar);
        // hover the name to read it
        c.appendChild(el('div', 'nb-fxs', lk ? 'came in with this song, but it isnt yours. it sits in the rack doing nothing' : d.sub));
        {
            let s = el('canvas', 'nb-scr'); s.width = 236; s.height = 84; s.style.width = '236px'; s.style.height = '84px'; s.dataset.fx = P.uid;
            let sr = el('div', 'nb-fxsr'), mt = el('div', 'nb-fxm'); mt.dataset.fxm = P.uid; mt.title = 'in + out: how loud it goes in (left) + comes out (right)'; mt.appendChild(el('i')); mt.appendChild(el('i')); sr.appendChild(s); sr.appendChild(mt); c.appendChild(sr);
            if (d.nodes) scalpelDrag(s, tr, P, d);
            if (d.paint) paintOn(s, P, d);
            if (d.lanes) laneTools(c, P, d);
            if (d.steps) faultGrid(c, P, d);
            if (d.ir) irRow(c, P);
            if (d.pup) pupRows(c, tr, P);
        }
        if (d.gate) {
            let g = el('div', 'nb-gate'); g.dataset.gate = P.uid;
            P.p.pat = P.p.pat || new Array(16).fill(1);
            const N = () => NBFX.CAGE.steps[Math.min(NBFX.CAGE.steps.length - 1, Math.floor((P.p.steps || 0) * NBFX.CAGE.steps.length))];
            const paint = () => g.querySelectorAll('i').forEach((s2, k) => { let v = +P.p.pat[k] || 0; s2.classList.toggle('on', v > 0); s2.style.setProperty('--lv', Math.max(0.08, v).toFixed(2)); s2.classList.toggle('out', k >= N()); });
            let drag = null;
            const lvAt = (s2, e) => { let r = s2.getBoundingClientRect(); return Math.max(0, Math.min(1, Math.round((1 - (e.clientY - r.top) / r.height) * 20) / 20)); };
            P.p.pat.forEach((on, k) => { let s2 = el('i', on ? 'on' : ''); s2.title = 'click = on / off · drag up + down = how far it opens';
                s2.onpointerdown = e => { e.preventDefault(); X.mark(); drag = { k, y: e.clientY, moved: false, lv: null }; try { s2.setPointerCapture(e.pointerId); } catch (er) {} };
                s2.onpointermove = e => { if (!drag) return; if (!drag.moved && Math.abs(e.clientY - drag.y) < 3) return; drag.moved = true;
                    let tgt = document.elementFromPoint(e.clientX, e.clientY), kk = tgt && tgt.parentNode === g ? [...g.querySelectorAll('i')].indexOf(tgt) : drag.k; if (kk < 0) kk = drag.k;
                    let lv = lvAt(g.querySelectorAll('i')[drag.k], e); if (kk !== drag.k && drag.lv != null) lv = drag.lv; drag.lv = lv; P.p.pat[kk] = lv; paint(); };
                s2.onpointerup = () => { if (!drag) return; if (!drag.moved) P.p.pat[drag.k] = (+P.p.pat[drag.k] || 0) > 0 ? 0 : 1; drag = null; paint(); X.touch(); };
                s2.onpointercancel = () => { if (!drag) return; drag = null; paint(); X.touch(); };
                g.appendChild(s2); });
            paint(); g._paint = paint; c.appendChild(g);
            let tools = el('div', 'nb-row'); tools.style.margin = '0 0 6px';
            const T = (txt, fn, tip) => tools.appendChild(btn(txt, 'sm', () => { X.mark(); fn(P.p.pat); paint(); X.touch(); }, tip));
            T('RANDOM', pt => { for (let k = 0; k < 16; k++) pt[k] = Math.random() < 0.6 ? 1 : 0; pt[0] = 1; }, 'a new chop, at random');
            T('◀', pt => pt.push(pt.shift()), 'slide the pattern left'); T('▶', pt => pt.unshift(pt.pop()), 'slide it right');
            T('FLIP', pt => { for (let k = 0; k < 16; k++) pt[k] = (+pt[k] || 0) > 0 ? 0 : 1; }, 'lit ↔ dark');
            T('ALL', pt => { for (let k = 0; k < 16; k++) pt[k] = 1; });
            T('OFFBEATS', pt => { for (let k = 0; k < 16; k++) pt[k] = k % 4 === 2 || k % 4 === 3 ? 1 : 0; }, 'the classic pad chop between the kicks');
            T('ACCENTS', pt => { for (let k = 0; k < 16; k++) if ((+pt[k] || 0) > 0) pt[k] = k % 4 === 0 ? 1 : k % 2 === 0 ? 0.7 : 0.45; }, 'the lit steps: the beat full, the rest lower, so it rolls instead of chops');
            T('LEVELS', pt => { for (let k = 0; k < 16; k++) if ((+pt[k] || 0) > 0) pt[k] = Math.round((0.35 + Math.random() * 0.65) * 20) / 20; }, 'every lit step a new height, at random');
            c.appendChild(tools);
        }
        if (d.side) {
            P.p.keys = Array.isArray(P.p.keys) ? P.p.keys : [];
            let row = el('div', 'nb-keys'); row.appendChild(el('span', 'nb-lab', 'LISTENS TO'));
            X.pr.tracks.filter(t => t.uid !== tr.uid).forEach(t => { let on = P.p.keys.indexOf(t.uid) >= 0, b2 = btn((on ? '☑ ' : '☐ ') + t.name, 'sm' + (on ? ' on' : ''), () => { X.mark(); let i2 = P.p.keys.indexOf(t.uid); if (i2 >= 0) P.p.keys.splice(i2, 1); else P.p.keys.push(t.uid); X.touch(); X.apply(); X.showDock(); }); b2.style.borderColor = t.col; row.appendChild(b2); });
            if (X.pr.tracks.length < 2 || (tr.isMaster && !X.pr.tracks.length)) row.appendChild(el('span', 'nb-hint', 'no other tracks yet'));
            c.appendChild(row);
        }
        let ks = el('div', 'nb-ks');
        const idle = () => { let r = d.idle ? d.idle(P.p, X.pr) || {} : {}; [...ks.children].forEach(k => { let why = r[k.dataset.pk]; k.classList.toggle('idle', !!why); if (k.dataset.t0 == null) k.dataset.t0 = k.title || ''; k.title = why ? 'does nothing right now: ' + why + (k.dataset.t0 ? ' · ' + k.dataset.t0 : '') : k.dataset.t0; }); };
        d.p.forEach(([key, label, def, fmt]) => {
            let k = X.knob(label, () => P.p[key], x => { P.p[key] = x; }, { fmt, def, steps: stepsOf(fmt), start: X.mark, turn: () => { X.apply(); idle(); }, done: X.touch });
            k.dataset.pk = key;
            X.autoable(k, tr, 'fx.' + P.uid + '.' + key, d.en + ' ' + label, () => P.p[key]);
            ks.appendChild(k);
        });
        idle();
        c.appendChild(ks);
        human(c, d.id, d);
        return c;
    }
    let brush = 1;
    function faultDice() { let q = new Array(16).fill(0); for (let k = 0; k < 16; k++) if (Math.random() < (k % 4 === 3 ? 0.55 : k >= 12 ? 0.5 : 0.18)) q[k] = 1 + Math.floor(Math.random() * 9); return q; }
    function faultGrid(c, P, d) {
        let el = X.el, btn = X.btn, F = d.steps;
        P.p.seq = Array.isArray(P.p.seq) ? P.p.seq : new Array(16).fill(0);
        let pal = el('div', 'nb-brush');
        F.forEach((f, k) => { if (!k) return; let b = el('i', k === brush ? 'on' : '', f[0]); b.style.background = f[2]; b.title = f[1]; b.onclick = () => { brush = k; pal.querySelectorAll('i').forEach((q, j) => q.classList.toggle('on', j + 1 === brush)); }; pal.appendChild(b); });
        let g = el('div', 'nb-fault'); g.dataset.fault = P.uid;
        const paint = () => { let ln = [4, 8, 12, 16][Math.min(3, Math.floor(P.p.len * 4))]; g.querySelectorAll('i').forEach((s, k) => { let q = Math.round(P.p.seq[k] || 0); s.textContent = q ? F[q][0] : ''; s.style.background = q ? F[q][2] : (k % 4 ? '#1a1a1a' : '#262626'); s.classList.toggle('off', k >= ln); s.title = (k + 1) + ': ' + F[q][1]; }); };
        for (let k = 0; k < 16; k++) { let s = el('i'); s.onclick = () => { X.mark(); P.p.seq[k] = Math.round(P.p.seq[k] || 0) === brush ? 0 : brush; paint(); X.touch(); }; g.appendChild(s); }
        paint(); c.appendChild(pal); c.appendChild(g);
        let tools = el('div', 'nb-row'); tools.style.margin = '0 0 6px';
        const T = (txt, fn, tip) => tools.appendChild(btn(txt, 'sm', () => { X.mark(); fn(P.p.seq); paint(); X.touch(); }, tip));
        T('RANDOM', q => { let r = faultDice(); for (let k = 0; k < 16; k++) q[k] = r[k]; }, 'a new mess, at random');
        T('ENDS', q => { for (let k = 0; k < 16; k++) q[k] = k >= 12 ? [1, 1, 2, 3][k - 12] : 0; }, 'clean till the last beat, then it falls apart');
        T('◀', q => q.push(q.shift()), 'slide left'); T('▶', q => q.unshift(q.pop()), 'slide right');
        T('CLEAR', q => { for (let k = 0; k < 16; k++) q[k] = 0; });
        c.appendChild(tools);
    }
    // eq dots. drag them, scroll for width
    function scalpelDrag(cv, tr, P, d) {
        const pos = (e) => { let r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; };
        const fOf = (n, v) => n.fr[0] * Math.pow(n.fr[1] / n.fr[0], v);
        const where = (n) => { let w = cv.width, h = cv.height, X0 = Math.log(fOf(n, P.p[n.f]) / 20) / Math.log(1000) * w, Y = n.g ? h / 2 - ((-15 + P.p[n.g] * 30) / 18) * (h / 2) : h / 2; return [X0, Y]; };
        const near = (q) => { let best = null, bd = 14; d.nodes.forEach(n => { let [X0, Y] = where(n), dd = Math.hypot(X0 - q.x, Y - q.y); if (dd < bd) { bd = dd; best = n; } }); return best; };
        let act = null;
        cv.addEventListener('mousedown', e => {
            let q = pos(e), n = near(q); if (!n) return; e.preventDefault(); X.mark(); act = n; cv._hot = n.f;
            const mv = ev => { let p = pos(ev), w = cv.width, h = cv.height, f = 20 * Math.pow(1000, X.clamp(p.x / w, 0, 1)); P.p[n.f] = X.clamp(Math.log(f / n.fr[0]) / Math.log(n.fr[1] / n.fr[0]), 0, 1); if (n.g) P.p[n.g] = X.clamp(((h / 2 - p.y) / (h / 2) * 18 + 15) / 30, 0, 1); X.apply(); };
            const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); act = null; cv._hot = null; X.touch(); X.showDock(); };
            document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
        });
        X.wheelable(cv); cv.addEventListener('wheel', e => { let n = near(pos(e)); if (!n || !n.q || !X.wheelMine(cv, e)) return; e.preventDefault(); P.p[n.q] = X.clamp(P.p[n.q] - Math.sign(e.deltaY) * 0.05, 0, 1); X.apply(); X.save(); }, { passive: false });
        cv.addEventListener('mousemove', e => { if (act) return; cv.style.cursor = near(pos(e)) ? 'grab' : ''; cv._hot = (near(pos(e)) || {}).f; });
        cv.addEventListener('mouseleave', () => { if (!act) cv._hot = null; });
    }
    function serpMap(cv, L, D) {
        let tr = X.pr.tracks.find(t => t.uid === cv.dataset.smap), v = tr && NB.V[tr.inst]; if (!tr || !v) return;
        let z = csz(cv); if (!z) return; let dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.max(160, Math.round(z[0] || 224)), h = Math.max(200, Math.round(z[1] || 330));
        if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
        let x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
        let P = cv._P || (cv._P = Object.fromEntries(v.p.map(q => [q[0], q]))), s = tr.snd, val = k => s[k] == null ? (P[k] ? P[k][2] : 0) : s[k], on = k => val(k) >= 0.5, pick = (k, n) => Math.min(n - 1, Math.floor(val(k) * n)), nm = k => { let q = P[k]; return q && q[3] ? q[3](val(k)) : ''; };
        let g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#08100c'); g.addColorStop(1, '#030504'); x.fillStyle = g; x.fillRect(0, 0, w, h);
        x.fillStyle = 'rgba(255,255,255,0.025)'; for (let i = 8; i < w; i += 12) for (let j = 8; j < h; j += 12) x.fillRect(i, j, 1, 1);
        let ch = L && L.R && L.R.ch[tr.uid], lvl = 0; if (ch && ch.an && D.playing) { ch.an.getFloatTimeDomainData(ch.buf); let ss = 0; for (let i = 0; i < ch.buf.length; i++) ss += ch.buf[i] * ch.buf[i]; lvl = Math.min(1, Math.sqrt(ss / ch.buf.length) * 4); }
        cv._lv = (cv._lv || 0) + (lvl - (cv._lv || 0)) * 0.3; lvl = cv._lv;
        const pad = 8, bw3 = (w - pad * 2 - 12) / 3, bh = 38, top = 20, A = D.A, B = D.B;
        const box = (X0, Y, W, H, title, sub, lit, amt) => {
            x.save(); x.beginPath(); x.roundRect ? x.roundRect(X0, Y, W, H, 4) : x.rect(X0, Y, W, H);
            x.fillStyle = lit ? 'rgba(20,40,30,0.85)' : 'rgba(255,255,255,0.025)'; x.fill();
            if (lit) { x.shadowColor = A; x.shadowBlur = 4 + lvl * 14 * (amt == null ? 1 : amt); x.strokeStyle = A; x.lineWidth = 1.3; } else { x.setLineDash([3, 3]); x.strokeStyle = 'rgba(255,255,255,0.18)'; x.lineWidth = 1; }
            x.stroke(); x.restore();
            x.font = 'bold 9px Courier New'; x.fillStyle = lit ? '#e8fff2' : 'rgba(255,255,255,0.3)'; x.textAlign = 'center'; x.fillText(title, X0 + W / 2, Y + 13);
            x.font = '9px Courier New'; x.fillStyle = lit ? B : 'rgba(255,255,255,0.2)'; let t = String(sub || ''); while (t.length > 3 && x.measureText(t).width > W - 6) t = t.slice(0, -2) + '…'; x.fillText(t, X0 + W / 2, Y + 26);
            if (amt != null && lit) { x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(X0 + 5, Y + H - 6, W - 10, 2); x.fillStyle = A; x.fillRect(X0 + 5, Y + H - 6, (W - 10) * Math.min(1, amt), 2); }
            x.textAlign = 'left'; };
        const todo = [], put = (...q) => todo.push(q);
        const wire = (x0, y0, x1, y1, lit, dash2) => { x.save(); x.strokeStyle = lit ? A : 'rgba(255,255,255,0.12)'; x.globalAlpha = lit ? 0.75 : 1; x.lineWidth = 1.2; if (dash2) x.setLineDash([2, 3]); x.beginPath(); x.moveTo(x0, y0); let my = (y0 + y1) / 2; x.bezierCurveTo(x0, my, x1, my, x1, y1); x.stroke(); x.restore(); };
        x.font = 'bold 8px Courier New'; x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillText('SIGNAL', pad, 10);
        let tn = k => { let i = s[k] != null ? Math.round(s[k]) : { tA: 0, tB: 1, tC: 2 }[k]; let n = window.NBFX && NBFX.WT && NBFX.WT.NAMES[i]; return n ? n[1] : ''; };
        let kt = (k, t) => { let kd = pick('ok' + k.toLowerCase(), 7); return kd === 0 ? tn(t) : kd === 1 ? 'SPEC ' + nm('sm' + k.toLowerCase()) : ['GRAIN', 'SAMPLE', 'STRING', 'MODAL', 'PULSE'][kd - 2]; };
        let O = [['A', 'onA', 'la', 'tA', 'ua'], ['B', 'onB', 'lb', 'tB', 'ub'], ['C', 'onC', 'lc3', 'tC', 'uc']].map(([k, o, lv, t, u], i) => ({ k, X0: pad + i * (bw3 + 6), on: on(o) && (val(lv) > 0.001), sw: on(o), lv: val(lv), t: kt(k, t), uni: 1 + Math.round(val(u) * 15) }));
        let y1 = top, y2 = y1 + bh + 20, yT = y2 + bh + 16, y3 = yT + bh + 16, y4 = y3 + bh + 14, y5 = y4 + bh + 14, thOn = on('onT');
        let fm = pick('fmm', 10), fmA = val('fma'), fmPair = { 1: [1, 0], 2: [1, 0], 3: [2, 0], 4: [2, 1], 5: [1, 0] }[fm];
        O.forEach((o, i) => { let mod = fmPair && fmPair[0] === i && O[i].sw; put(o.X0, y1, bw3, bh, 'OSC ' + o.k, o.sw ? (o.uni > 1 ? o.t + ' ×' + o.uni : o.t) : 'off', o.on || mod, o.on ? o.lv : null); });
        let half = (w - pad * 2 - 6) / 2, subOn = on('onS') && val('sub') > 0.001, nzOn = on('onN') && val('noise') > 0.001, subAround = pick('srt', 2) === 1, nzAround = pick('nrt', 2) === 1;
        put(pad, y2, half, bh, 'SUB', on('onS') ? nm('subw') + ' ' + nm('subo') : 'off', subOn, subOn ? val('sub') : null);
        put(pad + half + 6, y2, half, bh, 'NOISE', on('onN') ? nm('nty') : 'off', nzOn, nzOn ? val('noise') : null);
        put(pad, yT, w - pad * 2, bh, '喉 THE THROAT', thOn ? nm('thv') + ' · ' + nm('thz') + (val('thg') + val('thh') > 0.15 ? ' · growl' : '') + (val('thb') > 0.05 ? ' · breath' : '') : 'off', thOn, thOn ? val('thm') : null);
        let f1 = on('onF'), f2 = pick('f2on', 3), fw = f2 === 2 ? half : w - pad * 2;
        put(pad, y3, fw, bh, 'FILTER 1', f1 ? nm('ft') + ' ' + nm('fc') + (val('fr') > 0.5 ? ' RES' : '') : 'off', f1);
        if (f2 === 2) put(pad + half + 6, y3, half, bh, 'FILTER 2', nm('ft2') + ' ' + nm('fc2'), true);
        let dOn = on('onD') && pick('dty', 10) > 0, dPre = pick('dpo', 2) === 1;
        if (f2 === 1) { put(pad, y4, half, bh, 'FILTER 2', nm('ft2') + ' ' + nm('fc2'), true); put(pad + half + 6, y4, half, bh, 'DIST', dOn ? nm('dty') + (dPre ? ' first' : '') : 'off', dOn, dOn ? val('dam') : null); }
        else put(pad, y4, w - pad * 2, bh, 'DIST', dOn ? nm('dty') + ' ' + Math.round(val('dam') * 100) + '%' + (dPre ? ' · first' : '') : 'off', dOn, dOn ? val('dam') : null);
        put(pad, y5, w - pad * 2, bh, 'ENV 1 → OUT', nm('a1') + ' / ' + nm('r1') + '  ·  ' + nm('vm'), true, lvl);
        let fx0 = pad + fw / 2, mx0 = w / 2; O.forEach(o => wire(o.X0 + bw3 / 2, y1 + bh, mx0, yT, o.on));
        if (!subAround) wire(pad + half / 2, y2 + bh, mx0, yT, subOn); if (!nzAround) wire(pad + half * 1.5 + 6, y2 + bh, mx0, yT, nzOn); wire(mx0, yT + bh, fx0, y3, true);
        if (subAround || nzAround) { let ex = w - 3; x.save(); x.strokeStyle = A; x.globalAlpha = 0.6; x.setLineDash([2, 3]); x.beginPath(); if (subAround) { x.moveTo(pad + half / 2, y2 + bh); x.lineTo(pad + half / 2, y2 + bh + 6); x.lineTo(ex, y2 + bh + 6); } if (nzAround) { x.moveTo(pad + half * 1.5 + 6, y2 + bh); x.lineTo(pad + half * 1.5 + 6, y2 + bh + 6); x.lineTo(ex, y2 + bh + 6); } x.moveTo(ex, y2 + bh + 6); x.lineTo(ex, y5 + bh / 2); x.lineTo(w - pad, y5 + bh / 2); x.stroke(); x.restore(); }
        wire(w / 2, y3 + bh, w / 2, y4, true); wire(w / 2, y4 + bh, w / 2, y5, true);
        todo.forEach(q => box(...q));
        if (fmPair && O[fmPair[0]].sw && fmA > 0.005) { let a = O[fmPair[0]], b = O[fmPair[1]], ax = a.X0 + bw3 / 2, bx = b.X0 + bw3 / 2, yy = y1 - 1; x.save(); x.strokeStyle = B; x.lineWidth = 1.4; x.beginPath(); x.moveTo(ax, yy); x.quadraticCurveTo((ax + bx) / 2, yy - 13, bx + (ax > bx ? 6 : -6), yy); x.stroke();
            x.fillStyle = B; x.beginPath(); let tx = bx + (ax > bx ? 6 : -6); x.moveTo(tx, yy); x.lineTo(tx + (ax > bx ? 5 : -5), yy - 5); x.lineTo(tx + (ax > bx ? 7 : -7), yy + 1); x.fill(); x.font = 'bold 8px Courier New'; x.textAlign = 'center'; x.fillText(fm === 2 ? 'RING' : fm === 5 ? 'PHASE' : 'FM ' + Math.round(fmA * 100) + '%', (ax + bx) / 2, yy - 9); x.textAlign = 'left'; x.restore(); }
        if (fm >= 6 && O[0].sw && fmA > 0.005) { x.save(); x.fillStyle = B; x.font = 'bold 8px Courier New'; x.textAlign = 'center'; x.fillText(['', '', '', '', '', '', 'FM ← SUB', 'FM ← NOISE', 'FM ← FILTER', 'FM ↻ ITSELF'][fm] + ' ' + Math.round(fmA * 100) + '%', O[0].X0 + bw3 / 2 + 8, y1 - 5); x.restore(); }
        let sy = y5 + bh + 8, sh2 = h - sy - 6, sx0 = pad, sw2 = w - pad * 2; x.fillStyle = 'rgba(0,0,0,0.45)'; x.fillRect(sx0, sy, sw2, sh2); x.strokeStyle = 'rgba(255,255,255,0.06)'; x.strokeRect(sx0 + 0.5, sy + 0.5, sw2 - 1, sh2 - 1);
        [100, 1000, 10000].forEach(f => { let X0 = sx0 + Math.log(f / 30) / Math.log(18000 / 30) * sw2; x.fillStyle = 'rgba(255,255,255,0.07)'; x.fillRect(X0, sy, 1, sh2); x.font = '7px Courier New'; x.fillStyle = 'rgba(255,255,255,0.3)'; x.fillText(f >= 1000 ? f / 1000 + 'k' : String(f), X0 + 2, sy + sh2 - 3); });
        if (ch && ch.an && D.playing && lvl > 0.003) {
            let an = ch.an, n = an.frequencyBinCount, fb = cv._fb && cv._fb.length === n ? cv._fb : (cv._fb = new Float32Array(n)), sr = L.ctx.sampleRate; an.getFloatFrequencyData(fb);
            let sm = cv._sm || (cv._sm = new Float32Array(Math.ceil(sw2)).fill(-120));
            x.beginPath(); x.moveTo(sx0, sy + sh2);
            for (let i = 0; i < sm.length; i++) { let f = 30 * Math.pow(18000 / 30, i / sm.length), b = Math.min(n - 1, Math.round(f / (sr / 2) * n)), vdb = fb[b] + 4.5 * Math.log2(f / 1000); sm[i] = Math.max(vdb, sm[i] - 1.5); let yy = sy + sh2 - Math.max(0, Math.min(1, (sm[i] + 90) / 70)) * (sh2 - 4); x.lineTo(sx0 + i, yy); }
            x.lineTo(sx0 + sw2, sy + sh2); x.closePath(); let gg = x.createLinearGradient(0, sy, 0, sy + sh2); gg.addColorStop(0, A); gg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gg; x.globalAlpha = 0.55; x.fill(); x.globalAlpha = 1; x.strokeStyle = A; x.lineWidth = 1; x.stroke();
        } else { x.font = '8px Courier New'; x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillText('play it to see what it sounds like', sx0 + 6, sy + 14); if (cv._sm) cv._sm.fill(-120); }
    }
    const KANA = [['i', 'い', 'i'], ['e', 'え', 'e'], ['a', 'あ', 'a'], ['o', 'お', 'o'], ['u', 'う', 'ɯ']];
    function vowelChart(cv, L, D) {
        let tr = X.pr.tracks.find(t => t.uid === cv.dataset.vowel); if (!tr || !NB.vox) return;
        let z = csz(cv); if (!z) return; let dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.max(120, Math.round(z[0] || 214)), h = Math.max(100, Math.round(z[1] || 184));
        if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
        let x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
        let g = x.createRadialGradient(w * 0.5, h * 1.1, 10, w * 0.5, h * 0.6, w * 0.9); g.addColorStop(0, '#2a0812'); g.addColorStop(1, '#060104'); x.fillStyle = g; x.fillRect(0, 0, w, h);
        const l = 30, r = 14, t = 20, b = 20, lo2 = Math.log(3300), hi2 = Math.log(550), lo1 = Math.log(200), hi1 = Math.log(1150);
        const PX = f2 => l + (lo2 - Math.log(Math.max(400, f2))) / (lo2 - hi2) * (w - l - r), PY = f1 => t + (Math.log(Math.max(150, f1)) - lo1) / (hi1 - lo1) * (h - t - b);
        x.font = '8px Courier New'; x.fillStyle = 'rgba(255,255,255,0.08)';
        [300, 500, 800].forEach(f => { let Y = Math.round(PY(f)) + 0.5; x.fillRect(l, Y, w - l - r, 1); x.fillStyle = 'rgba(255,255,255,0.28)'; x.fillText(String(f), 1, Y + 3); x.fillStyle = 'rgba(255,255,255,0.08)'; });
        [1000, 2000].forEach(f => { let X0 = Math.round(PX(f)) + 0.5; x.fillRect(X0, t, 1, h - t - b); x.fillStyle = 'rgba(255,255,255,0.28)'; x.fillText(f / 1000 + 'k', X0 - 6, h - 6); x.fillStyle = 'rgba(255,255,255,0.08)'; });
        x.fillStyle = 'rgba(255,255,255,0.4)'; x.fillText('F1 ↓ open', 2, 10); x.textAlign = 'right'; x.fillText('front ← F2 → back', w - 4, 10); x.textAlign = 'left';
        let fem = tr.snd.voice == null ? 0.85 : tr.snd.voice, P = KANA.map(([v]) => { let q = NB.vox(v, 1 - fem); return [PX(q[1][0]), PY(q[0][0])]; });
        x.beginPath(); P.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fillStyle = D.A; x.globalAlpha = 0.08; x.fill(); x.globalAlpha = 0.45; x.strokeStyle = D.A; x.lineWidth = 1; x.setLineDash([3, 3]); x.stroke(); x.setLineDash([]); x.globalAlpha = 1;
        let cx = P.reduce((a, p) => a + p[0], 0) / P.length, cy = P.reduce((a, p) => a + p[1], 0) / P.length;
        KANA.forEach(([v, k, ipa], i) => { let [X0, Y] = P[i], dx = X0 - cx, dy = Y - cy, dl = Math.hypot(dx, dy) || 1, lx = Math.max(10, Math.min(w - 10, X0 + dx / dl * 14)), ly = Math.max(t + 6, Math.min(h - b - 2, Y + dy / dl * 12));
            x.fillStyle = D.B; x.beginPath(); x.arc(X0, Y, 2.2, 0, 7); x.fill(); x.textAlign = 'center'; x.font = 'bold 12px serif'; x.fillStyle = 'rgba(255,255,255,0.88)'; x.fillText(k, lx, ly + 4); x.font = '8px serif'; x.fillStyle = 'rgba(255,255,255,0.45)'; x.fillText('[' + ipa + ']', lx, ly + 13); x.textAlign = 'left'; });
        let ch = L && L.R && L.R.ch[tr.uid], M = ch && ch.mono && ch.mono.uta, best = null, bav = 0.02;
        if (M && M.lanes) M.lanes.forEach(Ln => { let W = Ln.ws && Ln.ws[0]; if (!W) return; let av = W.w.parameters.get('av').value; if (av > bav) { bav = av; best = W.w; } });
        let tl = cv._tl || (cv._tl = []);
        if (best && D.playing) { let pr = n => best.parameters.get(n).value; tl.push([pr('F1'), pr('F2'), bav, pr('scr')]); } else tl.push(null);
        if (tl.length > 70) tl.shift();
        x.lineWidth = 1.6; for (let i = 1; i < tl.length; i++) { let a = tl[i - 1], c = tl[i]; if (!a || !c) continue; x.strokeStyle = c[3] > 0.05 ? '#ff3a4a' : D.A; x.globalAlpha = i / tl.length * 0.7; x.beginPath(); x.moveTo(PX(a[1]), PY(a[0])); x.lineTo(PX(c[1]), PY(c[0])); x.stroke(); }
        x.globalAlpha = 1; let hd = tl[tl.length - 1];
        if (hd) { let X0 = PX(hd[1]), Y = PY(hd[0]), rr = 3 + Math.min(1.3, hd[2]) * 3.5, hot = hd[3] > 0.05; x.shadowColor = hot ? '#ff3a4a' : D.B; x.shadowBlur = 12 + hd[3] * 14; x.fillStyle = hot ? '#ff6a72' : '#fff'; x.beginPath(); x.arc(X0, Y, rr, 0, 7); x.fill(); x.shadowBlur = 0;
            x.font = '9px Courier New'; x.fillStyle = 'rgba(255,255,255,0.7)'; x.textAlign = 'right'; x.fillText('F1 ' + Math.round(hd[0]) + '  F2 ' + Math.round(hd[1]), w - 4, h - 6); x.textAlign = 'left'; }
    }
    // Stops redrawing when nothing's changing
    let actAt = 0, fN = 0; ['pointerdown', 'pointermove', 'wheel', 'keydown', 'input', 'change'].forEach(ev => document.addEventListener(ev, () => { actAt = performance.now(); }, { passive: true, capture: true }));
    X.rackFrame = function () {
        let V = X.V(), L = X.live(); if (!V) return;
        let dock = V.q('[data-dock]'); if (!dock) return;
        const still = !X.playing() && performance.now() - actAt > 1500 && (++fN % 6) !== 0, fresh = cv => { if (!still || !cv._drawn) { cv._drawn = 1; return true; } return false; };
        let A = (X.tv && X.tv('--a')) || '#ff2a6d', B = (X.tv && X.tv('--b')) || '#ff8ac8';
        let D = { A, B, pos: X.playing() && L ? (L.pos() || 0) : (V.cursor || 0), playing: X.playing(), now: performance.now() / 1000, bpm: X.pr.bpm, root: X.pr.root }; D.bpm = NB.tempoAt(X.pr, D.pos);
        let tr0 = X.selTr();
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        let vs = tr0 ? [...dock.querySelectorAll('canvas[data-vs]')] : [], ids = [...dock.querySelectorAll('canvas[data-idraw]')];
        if (tr0) vs.forEach(cv => { let v = NB.V[tr0.inst], z = csz(cv); if (z && v && v.screen && fresh(cv)) { let cw = Math.max(60, Math.round(z[0] || 200)), ch = 64; if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); } let x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); let a0 = D.A; try { D.A = cv._acc || a0; v.screen(cv.dataset.vs, x, cw, ch, tr0.snd, D); } catch (e) {} D.A = a0; x.setTransform(1, 0, 0, 1, 0, 0); } });
        dock.querySelectorAll('canvas[data-vowel]').forEach(cv => { if (csz(cv) && fresh(cv)) vowelChart(cv, L, D); });
        dock.querySelectorAll('canvas[data-smap]').forEach(cv => { if (csz(cv) && fresh(cv)) serpMap(cv, L, D); });
        ids.forEach(cv => { let tr = X.pr.tracks.find(t2 => t2.uid === cv.dataset.idraw), dd = tr && cv.dataset.drw != null && tr.snd.drawers ? tr.snd.drawers[+cv.dataset.drw] : null, v = dd ? NB.V[dd.voice] : tr && NB.V[tr.inst], z = csz(cv); if (!v || !v.draw || !z || !fresh(cv)) return; let w = Math.round(z[0] || 360), h = Math.round(z[1] || 120); if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); } let x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); try { v.draw(x, w, h, dd ? dd.snd : tr.snd, dd ? Object.assign({}, D, { semi: (dd.tune - 0.5) * 24, o: dd.o }) : D); } catch (e) {} });
        dock.querySelectorAll('canvas[data-cxseq]').forEach(cv => { if (csz(cv) && fresh(cv)) seqDraw(cv, D); });
        if (!L) return;
        dock.querySelectorAll('canvas[data-scope]').forEach(cv => {
            let c = L.R.ch[cv.dataset.scope], x = cv.getContext('2d'), w = cv.width, h = cv.height;
            x.fillStyle = 'rgba(4,6,5,0.45)'; x.fillRect(0, 0, w, h);
            x.strokeStyle = 'rgba(120,255,180,0.07)'; for (let i = 1; i < 6; i++) { x.beginPath(); x.moveTo(i * w / 6, 0); x.lineTo(i * w / 6, h); x.stroke(); }
            if (!c || !c.an) return;
            c.an.getFloatTimeDomainData(c.buf);
            x.strokeStyle = '#9dffc8'; x.lineWidth = 1.4; x.beginPath();
            for (let i = 0; i < c.buf.length; i++) { let X0 = i / (c.buf.length - 1) * w, y = h / 2 - c.buf[i] * h * 0.45; if (i) x.lineTo(X0, y); else x.moveTo(X0, y); }
            x.stroke(); x.shadowBlur = 0;
        });
        let tr = X.selTr(); if (!tr) return;
        if (tr.inst === 'coffin') { let ch = L.R.ch[tr.uid], now = L.ctx.currentTime; dock.querySelectorAll('[data-led]').forEach(e => { let t0 = ch && ch.hits ? ch.hits[+e.dataset.led] : null; e.classList.toggle('hot', t0 != null && now >= t0 && now - t0 < 0.11); }); }
        dock.querySelectorAll('canvas[data-fx]').forEach(cv => {
            let P = tr.fx.find(q => q.uid === cv.dataset.fx); if (!P) return;
            let I = L.R.inst.get(P.uid), x = cv.getContext('2d');
            if (!I && NB.fxOK(P)) { L.R.sync(); L.R.apply(); I = L.R.inst.get(P.uid); }
            if (!I) { x.fillStyle = '#050505'; x.fillRect(0, 0, cv.width, cv.height); x.fillStyle = '#666'; x.font = '10px Courier New'; x.fillText(TL(P.on ? 'locked away' : 'switched off'), 8, 16); return; }
            if (I.draw) { D.hot = cv._hot; try { I.draw(x, cv.width, cv.height, D); } catch (e) {} }
            let mt = cv.parentNode && cv.parentNode.querySelector('.nb-fxm'); if (mt && I.in && I.out && L.ctx) {
                if (!I._mi) { try { I._mi = L.ctx.createAnalyser(); I._mo = L.ctx.createAnalyser(); I._mi.fftSize = I._mo.fftSize = 256; I.in.connect(I._mi); I.out.connect(I._mo); I._mb = new Float32Array(256); } catch (e) { I._mi = null; } }
                if (I._mi) { const pk = an => { an.getFloatTimeDomainData(I._mb); let m = 0; for (let i = 0; i < 256; i += 2) m = Math.max(m, Math.abs(I._mb[i])); return m; }, lv = v => Math.max(0, Math.min(1, (20 * Math.log10(v + 1e-6) + 48) / 48));
                    let a = pk(I._mi), b2 = pk(I._mo); I._la = Math.max(lv(a), (I._la || 0) - 0.04); I._lb = Math.max(lv(b2), (I._lb || 0) - 0.04); mt.style.setProperty('--li', I._la.toFixed(3)); mt.style.setProperty('--lo', I._lb.toFixed(3)); mt.classList.toggle('hot', b2 > 0.89); } }
        });
        dock.querySelectorAll('[data-fault]').forEach(g => {
            let P = tr.fx.find(q => q.uid === g.dataset.fault), I = P && L.R.inst.get(P.uid); if (!I || !I.now) return;
            let [s] = X.playing() ? I.now(D.pos) : [-1];
            g.querySelectorAll('i').forEach((q, i) => q.classList.toggle('now', i === s));
        });
        dock.querySelectorAll('[data-gate]').forEach(g => {
            let P = tr.fx.find(q => q.uid === g.dataset.gate); if (!P) return;
            let st = [0.125, 0.25, 0.5, 1][Math.min(3, Math.floor(P.p.rate * 4))], N = NBFX.CAGE.steps[Math.min(NBFX.CAGE.steps.length - 1, Math.floor((P.p.steps || 0) * NBFX.CAGE.steps.length))], k = X.playing() ? Math.floor(D.pos / st) % N : -1;
            g.querySelectorAll('i').forEach((s, i) => s.classList.toggle('out', i >= N));
            g.querySelectorAll('i').forEach((s, i) => s.classList.toggle('now', i === k));
        });
    };
})();
