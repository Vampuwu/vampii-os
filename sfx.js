
// all the ui sounds. no audio files, its all made on the spot
window.os = window.os || {};

(function () {
    let bus = null, lastX = 0.5;
    const on = () => (!os.prefs || os.prefs.sound !== false) && !document.documentElement.classList.contains('reduce-motion');
    const r = (a, b) => a + Math.random() * (b - a);
    function ctx() {
        let c = window.audioCtx || (window.audioCtx = new (window.AudioContext || window.webkitAudioContext)());
        if (c.state === 'suspended') c.resume();
        if (!bus || bus.c !== c) build(c);
        return c;
    }
    function build(c) {
        let inp = c.createGain(), sat = c.createWaveShaper(), comp = c.createDynamicsCompressor(), out = c.createGain();
        let n = 1024, curve = new Float32Array(n);
        for (let i = 0; i < n; i++) { let x = i / (n - 1) * 2 - 1; curve[i] = Math.tanh(x * 1.6) / Math.tanh(1.6); }
        sat.curve = curve; sat.oversample = '2x';
        comp.threshold.value = -20; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = 0.003; comp.release.value = 0.16;
        out.gain.value = 0.95;
        inp.connect(sat); sat.connect(comp); comp.connect(out); out.connect(c.destination);
        let room = c.createConvolver(), roomIn = c.createGain(), roomOut = c.createGain();
        room.buffer = impulse(c, 1.5, 3.4); roomOut.gain.value = 0.5;
        roomIn.connect(room); room.connect(roomOut); roomOut.connect(comp);
        let dl = c.createDelay(1), fb = c.createGain(), lp = c.createBiquadFilter(), echoIn = c.createGain(), echoOut = c.createGain();
        dl.delayTime.value = 0.18; fb.gain.value = 0.34; lp.type = 'lowpass'; lp.frequency.value = 2400; echoOut.gain.value = 0.55;
        echoIn.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(echoOut); echoOut.connect(comp);
        bus = { c, inp, room: roomIn, echo: echoIn };
    }
    // fake reverb lol
    function impulse(c, len, decay) {
        let L = Math.floor(c.sampleRate * len), b = c.createBuffer(2, L, c.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            let d = b.getChannelData(ch), lp = 0;
            for (let i = 0; i < L; i++) { let t = i / L, k = 0.15 + 0.8 * (1 - t); lp += ((Math.random() * 2 - 1) - lp) * k; d[i] = lp * Math.pow(1 - t, decay); }
        }
        return b;
    }
    function send(node, o) {
        let c = bus.c, last = node;
        let pan = o.pan != null ? o.pan : (lastX * 2 - 1) * 0.45;
        if (c.createStereoPanner && pan) { let p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); node.connect(p); last = p; }
        last.connect(bus.inp);
        if (o.verb) { let s = c.createGain(); s.gain.value = o.verb; last.connect(s); s.connect(bus.room); }
        if (o.echo) { let s = c.createGain(); s.gain.value = o.echo; last.connect(s); s.connect(bus.echo); }
    }
    function shape(p, t, v, a, len, sus, rel) {
        p.setValueAtTime(0.0001, Math.max(0, bus.c.currentTime)); p.setValueAtTime(0.0001, t); p.exponentialRampToValueAtTime(Math.max(0.0002, v), t + a);
        if (sus) { p.exponentialRampToValueAtTime(Math.max(0.0002, v * sus), t + Math.max(a + 0.001, len)); p.exponentialRampToValueAtTime(0.0001, t + len + (rel || 0.03)); }
        else p.exponentialRampToValueAtTime(0.0001, t + Math.max(a + 0.002, len));
    }
    // wobble so it doesnt sound like a robot
    const wob = f => f * r(0.985, 1.015);

    function osc(f, len, o) {
        o = o || {};
        let c = ctx(), t = c.currentTime + (o.at || 0), g = c.createGain(), head = g, n = o.uni || 1, end = t + len + (o.rel || 0.03) + 0.05;
        if (o.cut) {
            let fl = c.createBiquadFilter(); fl.type = o.ft || 'lowpass'; fl.Q.value = o.q || 0.7;
            fl.frequency.setValueAtTime(o.cut, c.currentTime); fl.frequency.setValueAtTime(o.cut, t); if (o.cutTo) fl.frequency.exponentialRampToValueAtTime(o.cutTo, t + (o.cutT || len));
            fl.connect(g); head = fl;
        }
        if (o.fix !== true) f = wob(f);
        for (let i = 0; i < n; i++) {
            let s = c.createOscillator(); s.type = o.type || 'triangle';
            s.frequency.setValueAtTime(f, t); if (o.to) s.frequency.exponentialRampToValueAtTime(o.to, t + (o.toT || len));
            if (n > 1) s.detune.value = (i / (n - 1) - 0.5) * 2 * (o.det || 12);
            s.connect(head); s.start(t); s.stop(end);
        }
        shape(g.gain, t, (o.vol || 0.03) / Math.sqrt(n), o.a || 0.004, len, o.sus, o.rel);
        send(g, o);
    }
    function fm(f, len, o) {
        o = o || {};
        let c = ctx(), t = c.currentTime + (o.at || 0), car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), g = c.createGain(), ra = o.ratio || 2, end = t + len + (o.rel || 0.03) + 0.05;
        f = o.fix ? f : wob(f);
        car.frequency.setValueAtTime(f, t); mod.frequency.setValueAtTime(f * ra, t);
        if (o.to) { car.frequency.exponentialRampToValueAtTime(o.to, t + len); mod.frequency.exponentialRampToValueAtTime(o.to * ra, t + len); }
        mg.gain.setValueAtTime(f * ra * (o.idx || 2), t); mg.gain.exponentialRampToValueAtTime(Math.max(0.5, f * ra * (o.idxTo != null ? o.idxTo : 0.15)), t + len);
        mod.connect(mg); mg.connect(car.frequency); car.connect(g);
        shape(g.gain, t, o.vol || 0.02, o.a || 0.002, len, o.sus, o.rel);
        send(g, o);
        car.start(t); mod.start(t); car.stop(end); mod.stop(end);
    }
    let noiseBuf = null;
    function noise(len, o) {
        o = o || {};
        let c = ctx(), t = c.currentTime + (o.at || 0);
        if (!noiseBuf) { noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate); let d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
        let src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
        src.buffer = noiseBuf; src.loop = true; src.playbackRate.value = r(0.9, 1.1);
        f.type = o.ft || o.filter || 'bandpass'; f.Q.value = o.q || 1.2;
        f.frequency.setValueAtTime(o.from || 800, c.currentTime); f.frequency.setValueAtTime(o.from || 800, t); if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + len);
        shape(g.gain, t, o.vol || 0.03, o.a || o.attack || 0.006, len, o.sus, o.rel);
        src.connect(f); f.connect(g); send(g, o);
        src.start(t, Math.random() * 0.5); src.stop(t + len + (o.rel || 0.03) + 0.05);
    }
    const clack = (o, at) => { noise(0.012, Object.assign({ ft: 'highpass', from: 4200, vol: 0.045, a: 0.0008, at: at || 0 }, o)); osc(r(150, 190), 0.03, Object.assign({ type: 'sine', to: 90, vol: 0.03, at: at || 0 }, o)); };
    const PENTA = [1046.5, 1174.7, 1318.5, 1568, 1760, 2093, 2349.3];
    const pick = a => a[Math.floor(Math.random() * a.length)];

    const SOUNDS = {
        // the everywhere click
        click: o => { noise(0.01, Object.assign({ ft: 'highpass', from: 4500, vol: 0.04, a: 0.0008 }, o)); fm(1500, 0.035, Object.assign({ ratio: 3.5, idx: 1.1, vol: 0.011 }, o)); },
        tick: o => { noise(0.007, Object.assign({ ft: 'highpass', from: 5200, vol: 0.03, a: 0.0006 }, o)); osc(2200, 0.012, Object.assign({ type: 'square', vol: 0.005, cut: 5000 }, o)); },
        hover: o => fm(r(2500, 2800), 0.04, Object.assign({ ratio: 2, idx: 0.5, vol: 0.0035, a: 0.004 }, o)),
        pop: o => { fm(510, 0.1, Object.assign({ to: 980, ratio: 1, idx: 1.5, idxTo: 0.1, vol: 0.028 }, o)); noise(0.02, Object.assign({ from: 1800, q: 2, vol: 0.008 }, o)); },
        menu: o => { clack(o); fm(660, 0.08, Object.assign({ to: 990, ratio: 1, idx: 1.2, vol: 0.02, at: 0.01 }, o)); },
        open: o => {
            osc(72, 0.2, Object.assign({ type: 'sine', to: 42, vol: 0.05, a: 0.002 }, o));
            noise(0.32, Object.assign({ from: 600, to: 5200, q: 0.9, vol: 0.02, a: 0.07, verb: 0.15 }, o));
            osc(640, 0.17, Object.assign({ type: 'triangle', to: 1280, vol: 0.016, at: 0.05, cut: 1800, cutTo: 6500, verb: 0.2 }, o));
            osc(7600, 0.28, Object.assign({ type: 'sine', vol: 0.0022, a: 0.04, at: 0.02, fix: true }, o));
        },
        close: o => {
            osc(1400, 0.16, Object.assign({ type: 'sawtooth', to: 120, vol: 0.011, cut: 4000, cutTo: 300 }, o));
            noise(0.18, Object.assign({ from: 3000, to: 400, vol: 0.012, a: 0.002 }, o));
            osc(55, 0.12, Object.assign({ type: 'sine', vol: 0.026, at: 0.11 }, o));
        },
        min: o => { noise(0.15, Object.assign({ from: 2400, to: 500, q: 1.4, vol: 0.019 }, o)); fm(760, 0.11, Object.assign({ to: 360, ratio: 1.5, idx: 1, vol: 0.024 }, o)); },
        max: o => { noise(0.15, Object.assign({ from: 500, to: 2400, q: 1.4, vol: 0.019 }, o)); fm(360, 0.11, Object.assign({ to: 760, ratio: 1.5, idx: 1, vol: 0.024 }, o)); },
        on: o => { clack(o); fm(880, 0.08, Object.assign({ ratio: 2, idx: 1, vol: 0.018 }, o)); fm(1320, 0.12, Object.assign({ ratio: 2, idx: 1, vol: 0.018, at: 0.055, echo: 0.15 }, o)); },
        off: o => { clack(o); fm(1320, 0.07, Object.assign({ ratio: 2, idx: 1, vol: 0.018 }, o)); fm(660, 0.1, Object.assign({ ratio: 2, idx: 1, vol: 0.018, at: 0.055 }, o)); },
        line: o => { osc(r(2300, 2900), 0.012, Object.assign({ type: 'square', vol: 0.005, cut: 3500 }, o)); noise(0.01, Object.assign({ ft: 'highpass', from: 6000, vol: 0.01 }, o)); },
        // the pc speaker. square + dead straight on purpose
        beep: o => osc(1000, 0.14, Object.assign({ type: 'square', vol: 0.01, cut: 4200, a: 0.002, sus: 0.9, rel: 0.01, fix: true }, o)),
        cut: o => { noise(0.08, Object.assign({ ft: 'highpass', from: 2500, vol: 0.045, a: 0.001 }, o)); osc(110, 0.2, Object.assign({ type: 'sine', to: 40, vol: 0.065 }, o)); },
        swell: o => [220, 277.2, 329.6, 440].forEach((f, i) => osc(f, 1.1, Object.assign({ type: 'sawtooth', uni: 3, det: 14, cut: 280, cutTo: 3200, cutT: 0.9, a: 0.45, vol: 0.011, sus: 0.7, rel: 0.6, verb: 0.55, at: i * 0.02 }, o))),
        letter: o => fm(pick(PENTA), 0.2, Object.assign({ ratio: 3.01, idx: 2, idxTo: 0.05, vol: 0.009, echo: 0.22, verb: 0.12 }, o)),
        ding: o => { fm(1046.5, 0.13, Object.assign({ ratio: 3.5, idx: 1.8, vol: 0.028, fix: true }, o)); fm(2093, 1.2, Object.assign({ ratio: 3.5, idx: 1.6, idxTo: 0.02, vol: 0.028, at: 0.09, echo: 0.28, verb: 0.35, fix: true }, o)); },
        start: o => [523.3, 659.3, 784, 1046.5].forEach((f, i) => fm(f, 0.24, Object.assign({ ratio: 2, idx: 1.4, idxTo: 0.1, vol: 0.018, at: i * 0.07, echo: 0.2, verb: 0.2, fix: true }, o))),
        doors: o => {
            noise(0.5, Object.assign({ from: 300, to: 4800, q: 0.7, vol: 0.024, a: 0.1, verb: 0.2 }, o));
            osc(160, 0.45, Object.assign({ type: 'sawtooth', to: 520, vol: 0.011, cut: 600, cutTo: 2400 }, o));
            clack(o, 0.46);
        },
        back: o => { fm(990, 0.07, Object.assign({ to: 660, ratio: 2, idx: 1, vol: 0.018 }, o)); fm(660, 0.09, Object.assign({ to: 440, ratio: 2, idx: 1, vol: 0.016, at: 0.06 }, o)); },
        err: o => { osc(220, 0.12, Object.assign({ type: 'square', vol: 0.011, cut: 1200, sus: 0.8, fix: true }, o)); osc(185, 0.18, Object.assign({ type: 'square', vol: 0.011, cut: 1000, sus: 0.8, at: 0.13, fix: true }, o)); },
        pager: o => { [0, 0.11].forEach(at => osc(2900, 0.06, Object.assign({ type: 'square', vol: 0.009, cut: 5000, sus: 0.9, rel: 0.01, at, fix: true }, o))); [0.24, 0.29, 0.34].forEach(at => osc(3400, 0.03, Object.assign({ type: 'square', vol: 0.007, cut: 5000, sus: 0.9, rel: 0.01, at, fix: true }, o))); },
        page: o => { noise(0.11, Object.assign({ from: 700, to: 2600, q: 0.8, vol: 0.026, a: 0.012 }, o)); noise(0.08, Object.assign({ ft: 'highpass', from: 3500, vol: 0.012, at: 0.07 }, o)); },
        shutter: o => { noise(0.02, Object.assign({ ft: 'highpass', from: 3000, vol: 0.04, a: 0.001 }, o)); osc(1500, 0.02, Object.assign({ type: 'square', vol: 0.006 }, o)); noise(0.03, Object.assign({ ft: 'highpass', from: 2500, vol: 0.028, at: 0.06 }, o)); },
        print: o => {
            let at = 0;
            for (let k = 0; k < 22; k++) { noise(0.024, Object.assign({ from: r(2400, 3600), q: 4, vol: 0.018, at }, o)); osc(r(180, 220), 0.02, Object.assign({ type: 'square', vol: 0.006, cut: 900, at }, o)); at += k % 7 === 6 ? 0.11 : 0.06; }
            noise(0.28, Object.assign({ from: 700, to: 2000, q: 1.5, vol: 0.014, at, a: 0.05 }, o)); osc(90, 0.28, Object.assign({ type: 'sawtooth', vol: 0.006, cut: 500, at, sus: 0.8 }, o)); clack(o, at + 0.28);
        },
        erase: o => {
            osc(160, 0.42, Object.assign({ type: 'sawtooth', to: 820, cut: 600, cutTo: 2200, vol: 0.011, a: 0.02 }, o));
            noise(0.42, Object.assign({ from: 700, to: 2800, q: 2, vol: 0.012, a: 0.03 }, o));
            clack(o, 0.43);
            osc(1000, 0.16, Object.assign({ type: 'square', vol: 0.009, cut: 4200, sus: 0.9, rel: 0.01, at: 0.52, fix: true }, o));
        },
        dock: o => fm(1240, 0.07, Object.assign({ to: 1560, ratio: 2, idx: 1, vol: 0.013 }, o)),
        drop: o => { osc(150, 0.09, Object.assign({ type: 'sine', to: 70, vol: 0.035 }, o)); noise(0.015, Object.assign({ ft: 'highpass', from: 3000, vol: 0.02 }, o)); },
        theme: o => { [0, 0.045, 0.09, 0.135].forEach((at, i) => fm(PENTA[i + Math.floor(Math.random() * 3)], 0.16, Object.assign({ ratio: 3.01, idx: 1.6, idxTo: 0.05, vol: 0.012, at, echo: 0.18 }, o))); noise(0.3, Object.assign({ ft: 'highpass', from: 6000, vol: 0.006, a: 0.05 }, o)); },
        // THE CORNER. it deserves a fanfare
        corner: o => { [784, 988, 1175, 1568].forEach((f, i) => fm(f, 0.18, Object.assign({ ratio: 2, idx: 1.6, vol: 0.022, at: i * 0.08, echo: 0.25, fix: true }, o))); [784, 988, 1175, 1568].forEach(f => fm(f, 1.4, Object.assign({ ratio: 3.5, idx: 1.2, idxTo: 0.02, vol: 0.014, at: 0.34, echo: 0.3, verb: 0.45, fix: true }, o))); },
        powerBtn: o => {
            noise(0.012, Object.assign({ ft: 'highpass', from: 1800, vol: 0.045, a: 0.0008 }, o));
            osc(72, 0.22, Object.assign({ type: 'sine', to: 36, vol: 0.09 }, o));
            osc(98, 0.12, Object.assign({ type: 'sawtooth', to: 60, cut: 700, cutTo: 160, vol: 0.03 }, o));
            clack(o, 0.07);
            osc(50, 0.4, Object.assign({ type: 'sawtooth', uni: 2, det: 6, cut: 340, vol: 0.022, a: 0.03, at: 0.08, fix: true }, o));
        },
        crtOn: o => {
            osc(55, 0.6, Object.assign({ type: 'sine', to: 30, vol: 0.1, a: 0.002 }, o));
            // the degauss boinnng
            fm(98, 1.2, Object.assign({ ratio: 0.085, idx: 3, idxTo: 0.05, vol: 0.04, a: 0.01, verb: 0.25 }, o));
            osc(55, 1.3, Object.assign({ type: 'sawtooth', uni: 3, det: 16, cut: 160, cutTo: 900, cutT: 0.5, vol: 0.02, a: 0.12, sus: 0.5, rel: 0.6, fix: true }, o));
            noise(0.7, Object.assign({ from: 300, to: 1800, q: 0.8, vol: 0.02, a: 0.08, verb: 0.3 }, o));
        },
        spinup: o => {
            osc(30, 2.3, Object.assign({ type: 'sawtooth', to: 118, toT: 1.9, vol: 0.022, cut: 180, cutTo: 900, a: 0.4, sus: 0.6, rel: 0.8 }, o));
            osc(160, 2.3, Object.assign({ type: 'sine', to: 470, toT: 1.9, vol: 0.004, a: 0.7, sus: 0.6, rel: 0.7 }, o));
            noise(2.2, Object.assign({ from: 180, to: 900, q: 2.5, vol: 0.012, a: 0.6, sus: 0.6, rel: 0.6 }, o));
        },
        bootLine: o => { noise(0.016, Object.assign({ from: r(900, 1400), q: 3, vol: 0.034, a: 0.001 }, o)); osc(r(170, 230), 0.024, Object.assign({ type: 'square', vol: 0.012, cut: 900 }, o)); },
        seek: o => { let at = 0; for (let k = 0; k < 2 + Math.floor(Math.random() * 3); k++) { noise(0.012, Object.assign({ from: r(650, 1100), q: 4, vol: 0.024, a: 0.001, at }, o)); osc(r(90, 130), 0.014, Object.assign({ type: 'square', vol: 0.006, cut: 600, at }, o)); at += r(0.02, 0.06); } },
        riser: o => {
            noise(0.85, Object.assign({ ft: 'lowpass', from: 200, to: 2600, q: 2, vol: 0.04, a: 0.78 }, o));
            osc(41, 0.85, Object.assign({ type: 'sawtooth', uni: 3, det: 24, to: 82, cut: 160, cutTo: 1600, vol: 0.03, a: 0.78 }, o));
        },
        // very blade runner
        impact: o => {
            osc(48, 1.6, Object.assign({ type: 'sine', to: 24, vol: 0.13, a: 0.002 }, o));
            noise(0.5, Object.assign({ ft: 'lowpass', from: 2200, to: 120, q: 0.7, vol: 0.08, a: 0.001 }, o));
            noise(0.04, Object.assign({ ft: 'highpass', from: 1600, vol: 0.035, a: 0.0005 }, o));
            fm(73.4, 2.0, Object.assign({ ratio: 1.41, idx: 3.5, idxTo: 0.04, vol: 0.026, verb: 0.7, fix: true }, o));
            [73.4, 110, 146.8, 174.6].forEach((f, i) => osc(f, 2.6, Object.assign({ type: 'sawtooth', uni: 3, det: 14, cut: 300, cutTo: 1500, cutT: 0.25, vol: 0.013, a: 0.06, sus: 0.6, rel: 1.4, verb: 0.6, echo: 0.12, fix: true, at: i * 0.006 }, o)));
        },
        charge: o => {
            osc(41.2, 1.3, Object.assign({ type: 'sawtooth', uni: 2, det: 10, to: 55, cut: 120, cutTo: 1300, vol: 0.026, a: 0.1, sus: 0.9, rel: 0.1, fix: true }, o));
            fm(82.4, 1.3, Object.assign({ ratio: 1.41, idx: 0.6, idxTo: 2.2, vol: 0.008, a: 0.4, sus: 0.8, rel: 0.1, fix: true }, o));
            for (let k = 1; k <= 10; k++) osc(110, 0.04, Object.assign({ type: 'square', cut: 500 + k * 40, vol: 0.008, at: k * 0.12, fix: true }, o));
        },
        whoosh: o => {
            noise(0.8, Object.assign({ from: 220, to: 2400, q: 0.7, vol: 0.035, a: 0.14, verb: 0.35 }, o));
            osc(82, 0.6, Object.assign({ type: 'sine', to: 41, vol: 0.06, at: 0.1 }, o));
            [146.8, 220, 293.7].forEach((f, i) => fm(f, 1.6, Object.assign({ ratio: 1.41, idx: 0.9, idxTo: 0.03, vol: 0.011, at: 0.12 + i * 0.04, verb: 0.55, echo: 0.2, fix: true }, o)));
        },
        ggFall: o => { for (let k = 0; k < 13; k++) osc(1500 * Math.pow(0.9, k), 0.035, Object.assign({ type: 'square', vol: 0.006, cut: 3000, at: k * 0.123, fix: true }, o)); osc(1300, 1.6, Object.assign({ type: 'sine', to: 330, vol: 0.008, a: 0.08, sus: 0.8, rel: 0.05, fix: true }, o)); },
        ggLand: o => { osc(140, 0.12, Object.assign({ type: 'sine', to: 70, vol: 0.04 }, o)); noise(0.02, Object.assign({ from: 1800, q: 1.5, vol: 0.018, a: 0.001 }, o)); },
        relay: o => { clack(o); osc(50, 0.7, Object.assign({ type: 'sine', vol: 0.015, a: 0.06, sus: 0.5, rel: 0.4, at: 0.02, fix: true }, o)); osc(100, 0.7, Object.assign({ type: 'sawtooth', vol: 0.004, cut: 300, a: 0.06, sus: 0.5, rel: 0.4, at: 0.02, fix: true }, o)); clack(o, 0.18); },
        calcOn: o => { clack(o); osc(3200, 0.05, Object.assign({ type: 'square', vol: 0.006, cut: 6000, at: 0.03, fix: true }, o)); osc(3200, 0.05, Object.assign({ type: 'square', vol: 0.006, cut: 6000, at: 0.1, fix: true }, o)); },
        stereoOn: o => { clack(o); osc(48, 0.5, Object.assign({ type: 'sine', vol: 0.02, a: 0.04, sus: 0.4, rel: 0.3, at: 0.02, fix: true }, o)); [392, 587.3, 784].forEach((f, i) => fm(f, 0.3, Object.assign({ ratio: 1, idx: 0.8, vol: 0.012, at: 0.1 + i * 0.05, verb: 0.2 }, o))); },
        bookOpen: o => { osc(120, 0.1, Object.assign({ type: 'sine', to: 70, vol: 0.035 }, o)); noise(0.16, Object.assign({ from: 600, to: 2200, q: 0.8, vol: 0.016, a: 0.02, at: 0.04 }, o)); },
        tray: o => { noise(0.008, Object.assign({ ft: 'highpass', from: 3800, vol: 0.03, a: 0.0006 }, o)); osc(r(240, 270), 0.05, Object.assign({ type: 'sine', to: 150, vol: 0.03 }, o)); },
        dockIn: o => { fm(880, 0.06, Object.assign({ to: 440, ratio: 2, idx: 0.8, vol: 0.014 }, o)); osc(130, 0.08, Object.assign({ type: 'sine', to: 80, vol: 0.03, at: 0.03 }, o)); },
        dockOut: o => { osc(90, 0.06, Object.assign({ type: 'sine', to: 140, vol: 0.026 }, o)); fm(520, 0.07, Object.assign({ to: 1040, ratio: 2, idx: 0.8, vol: 0.013, at: 0.02 }, o)); },
        saverOn: o => { osc(1800, 0.3, Object.assign({ type: 'sine', to: 300, vol: 0.006, a: 0.01 }, o)); noise(0.35, Object.assign({ from: 2400, to: 300, q: 0.8, vol: 0.012, a: 0.02 }, o)); osc(60, 0.3, Object.assign({ type: 'sine', vol: 0.02, a: 0.04, at: 0.05 }, o)); },
        saverOff: o => { clack(o); noise(0.14, Object.assign({ from: 500, to: 3200, q: 0.9, vol: 0.014, a: 0.01, at: 0.02 }, o)); fm(660, 0.1, Object.assign({ to: 880, ratio: 2, idx: 0.7, vol: 0.012, at: 0.05 }, o)); },
        // 404. sad windows chord
        oops: o => { [[311.1, 0], [233.1, 0.09]].forEach(([f, at]) => fm(f, 0.42, Object.assign({ ratio: 2, idx: 1.1, idxTo: 0.1, vol: 0.022, at, verb: 0.3, fix: true }, o))); osc(78, 0.3, Object.assign({ type: 'sine', vol: 0.04, at: 0.02 }, o)); },
        ggOff: o => { clack(o); osc(1200, 0.18, Object.assign({ type: 'sine', to: 200, vol: 0.012 }, o)); },
        ggOn: o => { clack(o); osc(300, 0.2, Object.assign({ type: 'sine', to: 1400, vol: 0.01, at: 0.03 }, o)); noise(0.12, Object.assign({ from: 800, to: 3000, q: 0.9, vol: 0.008, at: 0.04 }, o)); },
        noteNew: o => { noise(0.07, Object.assign({ from: 1400, to: 3600, q: 0.9, vol: 0.02, a: 0.006 }, o)); fm(1760, 0.05, Object.assign({ ratio: 2, idx: 0.6, vol: 0.01, at: 0.05 }, o)); },
        noteSave: o => { [0, 0.045, 0.09].forEach(at => noise(0.012, Object.assign({ ft: 'highpass', from: 2600, vol: 0.026, a: 0.0006, at }, o))); osc(110, 0.16, Object.assign({ type: 'sawtooth', vol: 0.008, cut: 380, a: 0.01, at: 0.02, fix: true }, o)); fm(990, 0.08, Object.assign({ ratio: 2, idx: 0.6, vol: 0.011, at: 0.15 }, o)); },
        noteDel: o => { noise(0.2, Object.assign({ ft: 'lowpass', from: 3200, to: 260, q: 1.2, vol: 0.03, a: 0.004 }, o)); osc(150, 0.14, Object.assign({ type: 'sine', to: 55, vol: 0.04, at: 0.04 }, o)); },
        drawer: o => { noise(0.18, Object.assign({ ft: 'bandpass', from: 500, to: 1400, q: 1.4, vol: 0.03, a: 0.02 }, o)); osc(90, 0.08, Object.assign({ type: 'sine', vol: 0.05, at: 0.17 }, o)); noise(0.03, Object.assign({ ft: 'highpass', from: 3000, vol: 0.02, at: 0.17 }, o)); },
        binIn: o => { [0, 0.04, 0.09, 0.13].forEach((at, i) => noise(0.05, Object.assign({ ft: 'bandpass', from: 2200 + i * 500, to: 1500, q: 1.1, vol: 0.026, a: 0.002, at }, o))); osc(120, 0.09, Object.assign({ type: 'sine', to: 70, vol: 0.04, at: 0.2 }, o)); },
        binOut: o => { [0, 0.05, 0.1].forEach((at, i) => noise(0.05, Object.assign({ ft: 'bandpass', from: 1500 + i * 700, to: 2600, q: 1.1, vol: 0.022, a: 0.002, at }, o))); fm(1320, 0.07, Object.assign({ ratio: 2, idx: 0.5, vol: 0.01, at: 0.16 }, o)); },
        binEmpty: o => { noise(0.5, Object.assign({ ft: 'lowpass', from: 4200, to: 300, q: 0.8, vol: 0.04, a: 0.01 }, o)); [0.12, 0.2, 0.31].forEach(at => osc(70 + at * 40, 0.12, Object.assign({ type: 'sine', to: 45, vol: 0.05, at }, o))); },
        // telly sounds. the whine is real, old tvs did that
        tvOn: o => { noise(0.05, Object.assign({ ft: 'lowpass', from: 300, vol: 0.05, a: 0.002 }, o)); osc(15600, 0.5, Object.assign({ type: 'sine', vol: 0.0035, a: 0.05, at: 0.04, fix: true }, o)); noise(0.18, Object.assign({ ft: 'highpass', from: 5000, vol: 0.008, at: 0.05 }, o)); },
        chan: o => { noise(0.12, Object.assign({ ft: 'bandpass', from: 2500, to: 1800, q: 0.5, vol: 0.03, a: 0.003 }, o)); osc(60, 0.05, Object.assign({ type: 'square', vol: 0.012, cut: 300, at: 0.1 }, o)); },
        degauss: o => { osc(55, 0.9, Object.assign({ type: 'sawtooth', to: 48, vol: 0.05, cut: 240, a: 0.004 }, o)); osc(110, 0.6, Object.assign({ type: 'sine', to: 90, vol: 0.03 }, o)); noise(0.06, Object.assign({ ft: 'lowpass', from: 400, vol: 0.06, a: 0.001 }, o)); },
        // timer going off. pipipipi
        pipi: o => { for (let i = 0; i < 4; i++) osc(4000, 0.07, Object.assign({ type: 'square', vol: 0.016, a: 0.002, cut: 6000, at: i * 0.12 }, o)); },
        paperOpen: o => { noise(0.22, Object.assign({ from: 900, to: 3000, q: 0.7, vol: 0.026, a: 0.03 }, o)); noise(0.1, Object.assign({ from: 2400, to: 1200, q: 0.8, vol: 0.016, at: 0.15 }, o)); },
        // copier. ker-chunk
        copyRun: o => {
            clack(o); osc(48, 1.5, Object.assign({ type: 'sawtooth', vol: 0.018, cut: 260, a: 0.08, sus: 0.85, rel: 0.2 }, o));
            noise(1.3, Object.assign({ from: 500, to: 1400, q: 1.6, vol: 0.016, a: 0.1, at: 0.08, sus: 0.8 }, o));
            osc(1900, 1.2, Object.assign({ type: 'sine', vol: 0.0025, a: 0.2, at: 0.1, fix: true }, o));
            noise(0.32, Object.assign({ from: 1200, to: 3800, q: 0.6, vol: 0.03, a: 0.04, at: 1.45 }, o)); clack(o, 1.8);
        },
        copyLid: o => { noise(0.05, Object.assign({ ft: 'lowpass', from: 700, vol: 0.06, a: 0.002 }, o)); osc(110, 0.08, Object.assign({ type: 'sine', to: 60, vol: 0.05 }, o)); },
        copyJam: o => { for (let k = 0; k < 7; k++) noise(0.05, Object.assign({ from: r(600, 2400), q: 2, vol: 0.03, at: k * 0.045 + r(0, 0.02) }, o)); [0.42, 0.62, 0.82].forEach(at => osc(880, 0.09, Object.assign({ type: 'square', vol: 0.012, cut: 2400, at }, o))); },
        copyBeep: o => osc(2600, 0.05, Object.assign({ type: 'square', vol: 0.008, cut: 5000 }, o)),
        copyUnplug: o => { clack(o); noise(0.04, Object.assign({ ft: 'highpass', from: 3000, vol: 0.03 }, o)); osc(820, 0.6, Object.assign({ type: 'sine', to: 40, vol: 0.01, a: 0.01, at: 0.05, fix: true }, o)); },
        // rubber duck. air through the little reed in its bum
        squeak: o => { let len = r(0.14, 0.3), f = r(950, 1250); osc(f, len, Object.assign({ type: 'sawtooth', to: f * r(1.3, 1.6), toT: len * 0.6, cut: 2800, q: 5, vol: 0.022, a: 0.012, rel: 0.05 }, o)); noise(len, Object.assign({ from: 1600, to: 2600, q: 2, vol: 0.008, a: 0.01 }, o)); }
    };
    const OPEN = { files: 'drawer', 'gallery.exe': 'paperOpen', 'noisebox.exe': 'relay', 'calc.exe': 'calcOn', 'timer.exe': 'crtOn', 'copier.exe': 'copyLid', 'duck.exe': 'squeak', music: 'stereoOn', 'books.exe': 'bookOpen', 'paint.exe': 'paperOpen', 'notes.txt': 'paperOpen', settings: null, 'games.exe': null };
    const panOf = el => { try { let b = el.getBoundingClientRect(); return ((b.left + b.width / 2) / innerWidth * 2 - 1) * 0.6; } catch (e) { return 0; } };
    os.sfx = function (name, o) {
        o = o || {};
        // force = the timer. it rings even with ui sounds off, thats the whole point of it
        if ((!on() && !o.force) || !SOUNDS[name]) return;
        if (o.el) { o = Object.assign({}, o, { pan: panOf(o.el) }); delete o.el; }
        try { SOUNDS[name](o); } catch (e) {}
    };
    os.sfx.tone = (f, len, o) => { if (on()) try { osc(f, len, Object.assign({ type: 'square' }, o)); } catch (e) {} };
    os.sfx.noise = (len, o) => { if (on()) try { noise(len, o); } catch (e) {} };
    os.clickAudio = () => os.sfx('click');
    // sounds come from wherever you clicked
    document.addEventListener('pointerdown', e => { lastX = e.clientX / Math.max(1, innerWidth); }, { capture: true, passive: true });

    document.addEventListener('click', e => {
        let b = e.target.closest && e.target.closest('#desktop .kill-btn, #desktop .min-btn, #desktop .max-btn');
        if (!b) return;
        let w = b.closest('.bedazzled-border');
        os.sfx(b.classList.contains('kill-btn') ? 'close' : b.classList.contains('min-btn') ? 'min' : b.closest('.is-max') ? 'min' : 'max', { el: w || b });
    }, true);
    if (typeof os.summon === 'function') {
        const base = os.summon.bind(os);
        os.summon = function (id) {
            let had = document.getElementById('win-' + id), wasMin = had && had.classList.contains('is-min');
            let r = base.apply(os, arguments), w = document.getElementById('win-' + id);
            if (!had && w) { let k = id in OPEN ? OPEN[id] : 'open'; if (k) setTimeout(() => os.sfx(k, { el: w }), 10); }
            else if (wasMin && performance.now() - (os.sfx.quietAt || 0) > 80) os.sfx('max', { el: w });
            return r;
        };
    }
})();
