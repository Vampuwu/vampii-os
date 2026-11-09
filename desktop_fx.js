window.os = window.os || {};

(function () {
    const root = document.documentElement;
    const calm = () => root.classList.contains('reduce-motion') || root.classList.contains('low-spec');
    const on = () => !os.prefs || os.prefs.shaderbg !== false;

    const HEAD = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 res, mouse, par; uniform float time;
uniform vec3 cP, cS, cBg, cMid; uniform vec4 moonL;
varying vec2 uv;
float h1(float n){ return fract(sin(n * 127.1) * 43758.5453); }
float h2(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
vec2 h22(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y); }
const mat2 RT = mat2(0.8, 0.6, -0.6, 0.8);
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = RT * p * 2.02; a *= 0.5; } return v; }
float fbm3(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 3; i++) { v += a * noise(p); p = RT * p * 2.02; a *= 0.5; } return v; }
float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
// yellow was blinding lol
vec3 tame(vec3 c){ return c * clamp(0.42 / max(luma(c), 0.05), 0.4, 1.0); }
vec3 starL(vec2 q, float sc, float amt, float big){
  vec2 g = q * sc, id = floor(g), f = fract(g) - 0.5;
  vec2 r = h22(id);
  if (r.x < 1.0 - amt) return vec3(0.0);
  vec2 dv = f - (h22(id + 17.0) - 0.5) * 0.3;
  float d = length(dv), px = sc / res.y;
  float rad = min(max(0.03 + 0.05 * r.y * big, 1.1 * px), 0.28);
  // the glow has to be gone before the edge of its square or you see the square lol
  float win = smoothstep(0.35, 0.1, d);
  float tw = 0.55 + 0.45 * noise(vec2(time * (1.2 + r.y * 2.6), r.x * 91.0));
  float c = smoothstep(rad, 0.0, d) + (exp(-d / (rad * 2.5)) * 0.18 * big + exp(-d / (rad * 7.0)) * 0.05 * big * step(0.75, r.y)) * win;
  if (big > 0.5 && r.y > 0.8) c += (exp(-abs(dv.y) / (px * 1.1)) * exp(-abs(dv.x) * 9.0) + exp(-abs(dv.x) / (px * 1.1)) * exp(-abs(dv.y) * 9.0)) * 0.5 * win;
  float tk = h1(id.x * 3.1 + id.y * 1.7);
  vec3 tint = tk < 0.45 ? vec3(0.76, 0.85, 1.0) : tk < 0.8 ? vec3(1.0, 0.97, 0.92) : tk < 0.94 ? vec3(1.0, 0.84, 0.6) : vec3(1.0, 0.62, 0.48);
  if (r.x > 1.0 - amt * 0.12) tint = mix(vec3(1.0), cS, 0.6);
  tint *= vec3(1.0 + 0.15 * (tw - 0.75), 1.0, 1.0 - 0.15 * (tw - 0.75));
  return tint * c * tw;
}
// stars. one layer looked so flat
vec3 stars(vec2 q, float sc, float amt){
  return starL(q + 9.1, sc * 2.2, amt * 0.7, 0.0) * 0.25 + starL(q, sc, amt * 0.6, 0.4) * 0.75 + starL(q + 3.7, sc * 0.42, amt * 0.5, 1.0);
}
// the milky way. took me forever
vec3 dust(vec2 q){
  float ax = q.y - 0.72 + q.x * 0.22;
  vec2 w = q + 0.12 * vec2(fbm3(q * 3.0 + 1.3), fbm3(q * 3.0 + 8.1));
  float b = exp(-pow(ax * 3.0, 2.0));
  float c = fbm3(w * vec2(2.2, 4.0) + 5.0) * 1.1;
  float rift = smoothstep(0.48, 0.7, fbm3(w * vec2(3.0, 9.0) - 2.0)) * exp(-pow(ax * 7.0, 2.0));
  float knots = pow(fbm3(w * 14.0 + 3.0), 4.0) * 3.0;
  vec2 sp = floor(q * 900.0);
  float speck = step(0.988, h2(sp)) * h2(sp + 3.0);
  vec3 tint = tame(cS) * 0.55 + tame(cP) * 0.35 + vec3(0.18, 0.18, 0.22);
  return tint * b * (smoothstep(0.32, 0.85, c) * 0.14 + knots * 0.05) * (1.0 - rift * 0.85) + vec3(0.85, 0.9, 1.0) * b * (c * 0.02 + speck * 0.3);
}
vec3 ext(float k){ return mix(vec3(1.0, 0.6, 0.42), vec3(1.0), smoothstep(0.04, 0.45, k)) * smoothstep(0.0, 0.3, k); }
vec3 sat(vec2 q, float asp, float seed){
  float cyc = time / 70.0 + seed, sd = floor(cyc), t = fract(cyc);
  if (t > 0.6) return vec3(0.0);
  vec2 a = vec2(h1(sd + seed) * asp, 1.02), b = vec2(h1(sd * 1.7 + 3.1 + seed) * asp, 0.5);
  vec2 pp = mix(a, b, t / 0.6);
  float fl = 1.0 + 5.0 * exp(-pow((t - 0.3) * 30.0, 2.0)) * step(0.75, h1(sd * 7.0 + seed));
  return vec3(0.88, 0.93, 1.0) * smoothstep(1.3 / res.y, 0.0, length(q - pp)) * 0.5 * fl;
}
float twk(float cell, float seed, float keep, float rate, float sharp){
  vec2 g = gl_FragCoord.xy / cell, id = floor(g);
  float r = h2(id + seed), on = step(keep, h2(id + seed + 3.1));
  float tw = pow(max(sin(time * rate * (0.6 + r) + r * 40.0), 0.0), sharp);
  return on * tw * smoothstep(0.55, 0.1, length(fract(g) - 0.5));
}
vec3 shoot(vec2 q, float asp, float k, float seed){
  float cyc = time / 11.0 + seed, sd = floor(cyc), t = fract(cyc);
  vec2 a = vec2((0.15 + h1(sd + seed) * 0.7) * asp, 0.95), dir = normalize(vec2(-0.6 - h1(sd + 1.0) * 0.6, -0.35));
  // used to just switch off mid flight lol
  float u = t / 0.32, hu = min(u, 0.78);
  vec2 w = q - (a + dir * hu * 0.32 * 1.6);
  float L = 0.2 * smoothstep(0.0, 0.35, hu), along = clamp(dot(w, -dir), 0.0, max(L, 1e-4)), dd = length(w + dir * along);
  float head = smoothstep(0.0, 0.1, u) * (1.0 - smoothstep(0.55, 0.78, u)) + 0.8 * exp(-pow((u - 0.66) / 0.05, 2.0));
  float tail = (1.0 - along / max(L, 1e-4)) * smoothstep(0.0, 0.1, u) * (1.0 - smoothstep(0.7, 1.0, u));
  float wdt = (1.2 + 0.8 * (1.0 - along / max(L, 1e-4))) / res.y;
  float b = smoothstep(wdt, 0.0, dd) * max(head * (1.0 - along / max(L, 1e-4)), tail * 0.7) + exp(-length(w) * res.y * 0.22) * 0.35 * head;
  return mix(cS, vec3(1.0), 0.6) * b * step(u, 1.0) * step(0.45, h1(sd + 7.0 + seed)) * smoothstep(0.1, 0.35, k);
}
vec3 waves(vec2 w, float t, float fp, float amp){
  vec2 g = vec2(0.0);
  for (int i = 0; i < 6; i++) {
    float fi = float(i), an = fi * 2.399 + 0.5;
    vec2 D = normalize(vec2(cos(an) * 0.55, 1.0));
    float k = 1.6 * pow(1.75, fi);
    float att = smoothstep(1.4, 0.2, k * fp);
    float ph = dot(D, w) * k + t * sqrt(k) * 1.3 + fi * 1.7;
    g += D * cos(ph) * 0.045 * pow(0.82, fi) * att;
  }
  g += (vec2(noise(w * 9.0 + t * 0.7), noise(w * 9.0 + 4.0 - t * 0.6)) - 0.5) * 0.04 * smoothstep(1.2, 0.2, 9.0 * fp);
  return normalize(vec3(-g.x * amp, 1.0, -g.y * amp));
}
float fres(vec3 v, vec3 n){ return 0.02 + 0.98 * pow(1.0 - max(dot(-v, n), 0.0), 5.0); }
`;

    const SCENES = {
        city: `
float env(float X){ return 0.14 + 0.86 * exp(-pow((X - 0.16) / 0.36, 2.0)) + 0.36 * exp(-pow((X + 0.62) / 0.17, 2.0)); }
// one row of buildings. a = id, across the face, height, roll. b = face width, spire tip, setback, unused
// not real writing, just looks like it from far away
float sigil(vec2 q, float id){
  vec2 c = clamp(q, 0.0, 1.0);
  float edge = smoothstep(0.0, 0.18, c.x) * smoothstep(1.0, 0.82, c.x) * smoothstep(0.0, 0.14, c.y) * smoothstep(1.0, 0.86, c.y);
  float n = noise(q * vec2(2.6, 3.2) + id * 7.31) * 0.65 + noise(q * vec2(5.0, 6.0) + id * 3.7) * 0.35;
  return smoothstep(0.34, 0.62, n) * edge;
}
float tower(float X, float yy, float cw, float sd, float hm, float px, out vec4 a, out vec4 b){
  float x = X / cw + sd * 17.0, id = floor(x), fx = fract(x);
  float r1 = h1(id * 1.31 + sd), r2 = h1(id * 2.17 + sd * 3.0), r3 = h1(id * 0.73 + sd * 7.0);
  float l = 0.02 + r2 * 0.2, rt = 0.98 - fract(r2 * 7.3) * 0.2;
  float h = hm * env((id + 0.5 - sd * 17.0) * cw) * (0.14 + 0.86 * pow(r1, 2.6)) * step(0.16, r3);
  float sb = step(0.6, fract(r1 * 13.7)) * step(h * (0.64 + 0.22 * r3), yy);
  float ins = (rt - l) * 0.24 * sb, lo = l + ins, hi = rt - ins, aa = px / cw;
  float c = smoothstep(lo - aa, lo + aa, fx) * smoothstep(hi + aa, hi - aa, fx) * smoothstep(h + px, h - px, yy) * step(-0.04, yy);
  float mid = (lo + hi) * 0.5, sh = h * 0.2 * step(0.93, r1) * step(0.06, h);
  float sp = smoothstep(aa * 1.4, 0.0, abs(fx - mid) - aa * 0.25) * step(h - px, yy) * smoothstep(h + sh + px, h + sh - px, yy);
  // junk on the roof. aircon, a tank, whatever
  float jx = lo + (hi - lo) * (0.15 + 0.6 * fract(r2 * 31.0)), jw = (hi - lo) * (0.12 + 0.18 * fract(r3 * 17.0)), jh = px * (2.0 + 3.0 * fract(r1 * 23.0));
  sp = max(sp, step(0.4, fract(r3 * 11.0)) * step(sh, 0.0) * step(abs(fx - jx), jw) * step(h - px, yy) * smoothstep(h + jh + px * 0.5, h + jh - px * 0.5, yy));
  a = vec4(id + sd * 131.0, (fx - lo) / max(hi - lo, 0.001), h, r1);
  b = vec4((hi - lo) * cw, h + sh, sb, 0.0);
  return max(c, sp);
}
// k = how close (0 far, 1 middle, 2 front)
vec3 face(vec4 a, vec4 b, float yy, float X, float k, float px, vec3 haze, vec3 sunG, float sx, float sy){
  float id = a.x, u = a.y, h = a.z;
  vec3 c = mix(cBg * 0.3, vec3(0.016, 0.018, 0.026), 0.65);
  c += haze * 0.18 * exp(-yy * 26.0);
  // so theyre not cardboard
  float cn = 0.3 + 0.3 * h1(id * 5.7);
  c += haze * (X < sx ? 0.07 : 0.035) * step(u, cn) * step(0.04, b.x);
  if (k > 0.5 && yy < h && u > 0.0 && u < 1.0) {
    float fh = k > 1.5 ? 0.0056 : 0.0043;
    float nc = max(2.0, floor(b.x / (fh * 0.95)));
    vec2 wn = vec2(u * nc, yy / fh), wi = floor(wn), wf = fract(wn);
    float pane = smoothstep(0.18, 0.3, wf.x) * smoothstep(0.82, 0.7, wf.x) * smoothstep(0.22, 0.34, wf.y) * smoothstep(0.78, 0.66, wf.y);
    pane = mix(0.3, pane, smoothstep(2.2, 4.5, fh / px));
    float lf = 0.05 + 0.6 * pow(h1(id * 9.1), 1.8);
    float lit = step(1.0 - lf, h2(wi + id * 3.7));
    lit *= step(0.1, fract(time * 0.008 + h2(wi * 2.3 + id)));
    float tone = h2(wi * 1.7 + id);
    vec3 wc = tone < 0.55 ? vec3(1.0, 0.74, 0.46) : tone < 0.93 ? vec3(0.7, 0.84, 1.0) : tame(cS) * 1.4;
    // someone watching tv with the lights off
    if (h2(wi * 3.1 + id * 7.0) > 0.996) { wc = vec3(0.5, 0.68, 1.0); lit = 0.55 + 0.45 * noise(vec2(time * 1.6, id + wi.y)); }
    if (k < 1.5 && h1(id * 4.4) > 0.9 && abs(wi.x - floor(nc * 0.5)) < 0.5) { float up = fract(time * 0.03 + h1(id)); wc = vec3(1.0, 0.84, 0.58); lit = step(wi.y / max(h / fh, 1.0), up) * step(up, 0.85); }
    c += wc * lit * pane * (k > 1.5 ? 0.6 : 0.45);
  }
  float side = X < sx ? 1.0 - u : u;
  float rim = exp(-side * b.x / (px * 1.4)) + exp(-max(h - yy, 0.0) / (px * 1.3)) * step(yy, h);
  float sg = exp(-length(vec2(X - sx, yy - sy)) * 3.2);
  c += sunG * rim * sg * (0.9 - k * 0.2);
  if (k > 0.5 && k < 1.5 && h1(id * 3.7) > 0.5 && b.x > px * 9.0) {
    float sp = px * 1.2, lx = u * b.x / sp - 1.5, top = h - px * (3.0 + floor(h1(id * 4.4) * 8.0)), bot = top - px * (18.0 + floor(h1(id * 6.2) * 40.0));
    bot = max(bot, h * 0.25);
    vec3 sc = h1(id * 5.1) > 0.5 ? cP : cS;
    float fk = h1(id * 8.3) > 0.75 ? step(0.015, fract(time * 0.09 + h1(id))) : 1.0;
    if (lx >= -1.0 && lx < 5.0 && yy < top + px && yy > bot - px) {
      c = cBg * 0.3 + vec3(0.02) + sc * 0.06;
      if (lx >= 0.0 && lx < 4.0 && yy < top && yy > bot) {
        float gy = (top - yy) / sp, cell = floor(gy / 5.5), in5 = mod(gy, 5.5) / 4.5;
        float lit = 0.55 + 0.45 * h1(cell * 3.3 + id);
        lit *= h1(cell * 7.7 + id * 2.0) < 0.07 ? 0.15 : 1.0;
        float g = sigil(vec2(lx / 4.0, in5), cell + id * 11.0) * step(in5, 1.0);
        c = mix(c, mix(tame(sc), vec3(1.0), 0.35) * 2.0 * fk * lit, g) + tame(sc) * 0.35 * fk;
      }
    } else c += tame(sc) * 0.4 * fk * exp(-max(lx - 5.0, -1.0 - lx) * 0.3) * step(bot - px * 2.0, yy) * step(yy, top + px * 2.0);
  }
  if (k > 0.5 && h1(id * 4.9) > 0.55) {
    float sh = px * (4.0 + floor(h1(id * 6.6) * 10.0)), ux = u * b.x / px;
    if (yy > sh && yy < sh + px * 3.5 && ux > 1.0 && ux < b.x / px - 1.0) {
      vec3 sc = h1(id * 7.7) > 0.5 ? cS : cP;
      float g = sigil(vec2(fract(ux / 5.0), (yy - sh) / (px * 3.5)), floor(ux / 5.0) + id * 5.0);
      c = mix(cBg * 0.3 + tame(sc) * 0.3, mix(tame(sc), vec3(1.0), 0.3) * 1.8, g) * (0.85 + 0.15 * step(0.015, fract(time * 0.08 + h1(id * 2.0))));
    }
  }
  if (h1(id * 6.1) > 0.86 && k > 0.5) c += mix(cP, cS, step(0.5, h1(id * 2.9))) * smoothstep(px * 1.6, 0.0, abs(yy - h + px)) * step(0.0, u) * step(u, 1.0) * 0.9;
  // the city is still loading in lol
  if (step(0.997, h1(id * 2.2 + floor(time * 0.2))) > 0.0 && k > 0.5) {
    float e = max(max(smoothstep(px * 1.5, 0.0, u * b.x), smoothstep(px * 1.5, 0.0, (1.0 - u) * b.x)), smoothstep(px * 1.5, 0.0, abs(yy - h)));
    c = mix(c * 0.3, tame(cS) * 1.3, e * 0.9) + tame(cP) * 0.06 * step(0.5, fract(yy / (px * 3.0)));
  }
  // red lights on the spires so the planes dont hit them
  float tip = smoothstep(px * 2.2, 0.0, length(vec2(0.0, yy - b.y)) - px * 0.4) * step(h + px, b.y);
  c += vec3(1.0, 0.16, 0.2) * tip * (0.35 + 0.8 * smoothstep(-0.2, 0.9, sin(time * 1.1 + id * 3.7)));
  return c;
}
vec3 city(vec2 p, float X, float hz, float asp, float px, vec3 col, vec3 haze, vec3 sunG, float sx, float sy){
  float y0 = p.y - hz;
  if (y0 > 0.42 || y0 < -0.03) return col;
  float Xf = X + par.x * 0.004, Xm = X + par.x * 0.009, ym = y0 + 0.002, Xn = X + par.x * 0.016, yn = y0 + 0.008;
  vec4 a1, b1, a2, b2, a3, b3, a4, b4, a5, b5, a6, b6;
  float m6 = tower(Xn, yn, 0.022, 6.0, 0.06, px, a6, b6);
  float m5 = tower(Xn, yn, 0.034, 5.0, 0.085, px, a5, b5);
  float o5 = m6, o4 = max(o5, m5);
  float m4 = o4 < 0.999 ? tower(Xm, ym, 0.021, 4.0, 0.15, px, a4, b4) : 0.0;
  float o3 = max(o4, m4);
  float m3 = o3 < 0.999 ? tower(Xm, ym, 0.036, 3.0, 0.27, px, a3, b3) : 0.0;
  float o2 = max(o3, m3);
  float m2 = o2 < 0.999 ? tower(Xf, y0, 0.026, 2.0, 0.3, px, a2, b2) : 0.0;
  float o1 = max(o2, m2);
  float m1 = o1 < 0.999 ? tower(Xf, y0, 0.016, 1.0, 0.24, px, a1, b1) : 0.0;
  // back row is basically fog
  if (m1 > 0.0) col = mix(col, mix(face(a1, b1, y0, Xf, 0.0, px, haze, sunG, sx, sy), haze * 0.95, 0.66), m1);
  if (m2 > 0.0) col = mix(col, mix(face(a2, b2, y0, Xf, 0.0, px, haze, sunG, sx, sy), haze * 0.9, 0.58), m2);
  col = mix(col, haze, exp(-max(y0, 0.0) * 30.0) * 0.4);
  if (y0 > 0.02 && y0 < 0.26) {
    float sm = fbm3(vec2(Xf * 3.0 + time * 0.012, y0 * 18.0)) * exp(-pow((y0 - 0.1) * 10.0, 2.0));
    col = mix(col, haze * 1.35 + tame(cP) * 0.08, smoothstep(0.36, 0.7, sm) * 0.6);
  }
  for (int l = 0; l < 3; l++) {
    float fl = float(l), ly = 0.045 + fl * 0.045 + 0.004 * sin(time * 0.3 + fl), dir = mod(fl, 2.0) * 2.0 - 1.0;
    if (abs(y0 - ly) < px * 3.0) {
      float cx = (Xm - dir * time * (0.035 - fl * 0.008)) / 0.11, cid = floor(cx), cf = (dir > 0.0 ? 1.0 - fract(cx) : fract(cx)) * 0.11;
      float has = step(0.5, h1(cid * 3.3 + fl * 17.0)), d = abs(y0 - ly);
      float head = smoothstep(px * 2.2, 0.0, length(vec2(cf, d))), trail = step(cf, 0.03) * (1.0 - cf / 0.03) * smoothstep(px * 1.4, 0.0, d);
      vec3 cc = h1(cid * 9.1 + fl) > 0.88 ? mix(vec3(1.0, 0.12, 0.2), vec3(0.25, 0.45, 1.0), step(0.5, fract(time * 1.2))) : (dir > 0.0 ? vec3(1.0, 0.95, 0.85) : vec3(1.0, 0.25, 0.3));
      col += cc * has * (head * 2.2 + trail * 0.8) * (1.0 - fl * 0.2);
    }
  }
  if (m3 > 0.0) col = mix(col, mix(face(a3, b3, ym, Xm, 1.0, px, haze, sunG, sx, sy), haze, 0.26), m3);
  if (m4 > 0.0 && o4 < 0.999) col = mix(col, mix(face(a4, b4, ym, Xm, 1.0, px, haze, sunG, sx, sy), haze, 0.22), m4);
  float tk = 0.0105, deck = smoothstep(px * 1.2, 0.0, abs(ym - tk));
  col = mix(col, cBg * 0.25, deck * 0.85);
  float tx = (Xm - (fract(time * 0.009) * 2.0 - 1.0) * (0.6 * asp + 0.3)) / 0.16;
  if (tx > 0.0 && tx < 1.0 && ym > tk && ym < tk + 0.0055) {
    float car = fract(tx * 7.0), wy = (ym - tk) / 0.0055;
    vec3 tc = cBg * 0.25 + vec3(1.0, 0.85, 0.6) * step(0.1, car) * step(car, 0.9) * step(0.35, wy) * step(wy, 0.75) * step(0.35, fract(car * 8.0)) * 0.7;
    tc += vec3(1.0, 0.95, 0.85) * step(0.985, tx) * 1.6;
    col = mix(col, tc, step(0.03, car) * step(car, 0.97));
  }
  col = mix(col, haze, exp(-max(ym, 0.0) * 55.0) * 0.32);
  if (m5 > 0.0 && o5 < 0.999) col = mix(col, mix(face(a5, b5, yn, Xn, 2.0, px, haze, sunG, sx, sy), haze, 0.08), m5);
  if (m6 > 0.0) col = mix(col, mix(face(a6, b6, yn, Xn, 2.0, px, haze, sunG, sx, sy), haze, 0.06), m6);
  // one car out this late
  float rd = smoothstep(px * 1.2, 0.0, abs(yn - 0.0012));
  col = mix(col, cBg * 0.2, rd * 0.9);
  float cx = (fract(time * 0.021) * 2.4 - 1.2) * (0.5 * asp + 0.2), dc = Xn - cx;
  col += vec3(1.0, 0.95, 0.85) * smoothstep(px * 2.0, 0.0, length(vec2(dc - 0.002, yn - 0.0022))) * 1.4 + vec3(1.0, 0.15, 0.2) * smoothstep(px * 1.6, 0.0, length(vec2(dc + 0.004, yn - 0.0022))) * 0.9;
  return col;
}
vec3 sunDisc(vec3 col, float X, float yy, float px, float sx, float sy, float R){
  float v0 = clamp((yy - sy + R) / (2.0 * R), 0.0, 1.0);
  X += sin(yy * 260.0 + time * 1.7) * px * 1.6 * pow(1.0 - v0, 3.0);
  vec2 sc = vec2(X - sx, yy - sy); float r = length(sc);
  float disc = smoothstep(R + px, R - px, r);
  if (disc > 0.0) {
    float v = v0;
    // dont scroll these, it flickers
    float f = fract(yy / 0.0105);
    float duty = mix(0.3, 1.05, smoothstep(0.08, 0.78, v)) + 0.09 * sin(v * 14.0 - time * 0.55) * (1.0 - v);
    float on = smoothstep(duty + px / 0.0105, duty - px / 0.0105, f);
    vec3 sc1 = mix(cP * 1.05, mix(cS, vec3(1.0, 0.9, 0.7), 0.25), smoothstep(0.0, 1.0, v));
    sc1 = mix(sc1, tame(sc1) * 1.25, 0.35);
    sc1 *= 1.0 + 0.35 * exp(-pow((v - (1.15 - fract(time / 14.0) * 1.3)) * 9.0, 2.0));
    col = mix(col, sc1, disc * on);
  }
  return col;
}
vec3 scene(vec2 p, float asp){
  float hz = 0.36 + par.y * 0.012, px = 1.0 / res.y;
  float X = (p.x - 0.5) * asp, yy = p.y - hz;
  float sx = 0.3 + par.x * 0.003, sy = 0.075, R = 0.19;
  vec3 hot = mix(tame(cP), vec3(1.0, 0.6, 0.42), 0.3);
  vec3 haze = mix(cMid * 1.6 + tame(cP) * 0.15, vec3(0.09, 0.085, 0.11), 0.38);
  vec3 sunG = mix(tame(cS), vec3(1.0, 0.85, 0.7), 0.3) * 1.2;
  vec3 col;
  if (yy > 0.0) {
    float k = clamp(yy / (1.0 - hz), 0.0, 1.0);
    col = mix(haze, cMid * 1.1 + cBg * 0.25, smoothstep(0.0, 0.22, k));
    col = mix(col, cBg * 0.5, smoothstep(0.2, 0.95, k));
    // city glow kills most of the stars low down
    vec2 sq = vec2(p.x * asp, p.y) + par * 0.003;
    if (k > 0.12) col += (starL(sq, 130.0, 0.045, 0.4) * 0.7 + starL(sq + 3.7, 52.0, 0.035, 1.0)) * smoothstep(0.12, 0.5, k);
    col += sat(vec2(p.x * asp, p.y), asp, 0.0) + shoot(vec2(p.x * asp, p.y), asp, k, 0.0);
    col = sunDisc(col, X, yy, px, sx, sy, R);
    float r = length(vec2(X - sx, yy - sy));
    col += tame(cP) * 0.28 * exp(-r * 5.5) + tame(cS) * 0.07 * exp(-r * 1.8);
    col += hot * 0.12 * exp(-yy * 11.0);
    float cb = yy - 0.17;
    if (abs(cb) < 0.09) {
      float st = smoothstep(0.5, 0.8, fbm3(vec2(X * 1.1 + time * 0.004 + par.x * 0.004, yy * 32.0))) * exp(-cb * cb * 260.0);
      col = mix(col, mix(cMid * 1.2 + cBg * 0.3, hot * 0.8, exp(-r * 3.0) * 0.85 + 0.08), st * 0.85);
    }
    for (int i = 0; i < 2; i++) {
      float fi = float(i), an = 1.5708 + sin(time * (0.08 + fi * 0.03) + fi * 2.4) * 0.42;
      vec2 o = vec2(0.06 + fi * 0.2 + par.x * 0.009, 0.05), dir = vec2(cos(an), sin(an)), w = vec2(X, yy) - o;
      float al = dot(w, dir), sd = abs(dot(w, vec2(-dir.y, dir.x)));
      col += (tame(cS) * 0.08 + vec3(0.05)) * step(0.0, al) * exp(-sd / (0.002 + max(al, 0.0) * 0.045)) * exp(-max(al, 0.0) * 2.4);
    }
    for (int f = 0; f < 2; f++) {
      float ff = float(f), sp = 0.007 + ff * 0.004, t = fract(time * sp + ff * 0.5), ln = floor(time * sp + ff * 0.5);
      float fx2 = h1(ln + ff * 3.0) > 0.5 ? t : 1.0 - t;
      vec2 dd = vec2(p.x, p.y) - vec2(fx2 * 1.3 - 0.15, hz + 0.16 + h1(ln * 1.7 + ff) * 0.3);
      dd.x *= asp;
      col += vec3(1.0, 0.25, 0.3) * smoothstep(px * 1.6, 0.0, length(dd)) * (0.35 + 0.9 * step(0.8, fract(time * 0.5 + ff * 0.37)));
      col += vec3(1.0) * smoothstep(px * 1.4, 0.0, length(dd - vec2(0.004, 0.0))) * 0.5 * step(0.5, fract(time * 1.3 + ff));
    }
    col = city(p, X, hz, asp, px, col, haze, sunG, sx, sy);
    col += tame(cP) * 0.16 * exp(-max(r - R * 0.85, 0.0) * 14.0) * smoothstep(R * 1.2, R * 0.4, r) + tame(cP) * 0.05 * exp(-r * 4.0);
  } else {
    float d = -yy, z = 0.1 / max(d, 0.0006), gs = 7.0;
    float Xg = X + par.x * 0.03;
    vec2 g = vec2(Xg * z * gs, z * gs * 0.5);
    vec2 gf = abs(fract(g) - 0.5);
    float wx = 1.3 * z * gs * px, wy = 1.3 * (0.1 * gs * 0.5 / (d * d)) * px;
    float lx = smoothstep(0.5 - wx, 0.5, gf.x) * smoothstep(0.6, 0.15, wx) + 0.18 * smoothstep(0.15, 0.6, wx);
    float ly = smoothstep(0.5 - wy, 0.5, gf.y) * smoothstep(0.6, 0.15, wy) + 0.18 * smoothstep(0.15, 0.6, wy);
    float line = max(lx, ly);
    float wet = smoothstep(0.42, 0.66, noise(g * 0.09 + 3.0)) * smoothstep(0.6, 0.2, wx);
    // cheaper than drawing it all twice
    float rx = X + (sin(d * 260.0 + time * 1.1) * 0.0011 + (noise(vec2(X * 40.0, d * 300.0 - time * 0.6)) - 0.5) * 0.004) * (1.0 - wet * 0.7);
    float ry = d * 0.95;
    vec3 rc = mix(haze, cMid * 1.1 + cBg * 0.25, smoothstep(0.0, 0.14, ry));
    rc = mix(rc, sunDisc(rc, rx, ry, px * 3.0, sx, sy, R) * (0.75 + 0.25 * sin(d * 700.0 + time * 0.8)), exp(-d * 9.0));
    float r = length(vec2(rx - sx, ry - sy));
    rc += tame(cP) * 0.28 * exp(-r * 5.5) + hot * 0.12 * exp(-ry * 11.0);
    vec4 a, b;
    float mb = max(tower(rx + par.x * 0.009, ry + 0.002, 0.036, 3.0, 0.27, px * 5.0, a, b), tower(rx + par.x * 0.009, ry + 0.002, 0.021, 4.0, 0.15, px * 5.0, a, b));
    float mf = tower(rx + par.x * 0.004, ry, 0.026, 2.0, 0.3, px * 6.0, a, b);
    rc = mix(rc, mix(cBg * 0.3, haze, 0.6), mf * 0.8);
    rc = mix(rc, cBg * 0.3 + haze * 0.2, mb);
    float sk = tower(rx + par.x * 0.009, 0.004, 0.036, 3.0, 0.27, px * 3.0, a, b);
    float lf = 0.05 + 0.6 * pow(h1(a.x * 9.1), 1.8);
    float strk = sk * lf * smoothstep(0.0, a.z, 0.3) * (0.5 + 0.5 * h1(floor(X / (px * 1.5)))) * exp(-d * 14.0);
    rc += vec3(1.0, 0.8, 0.6) * strk * 0.5;
    float sg = step(0.5, h1(a.x * 3.7)) * step(a.y, 0.35) * sk;
    rc += tame(h1(a.x * 5.1) > 0.5 ? cP : cS) * sg * 1.0 * (0.5 + 0.5 * h1(floor(X / (px * 1.5)) + 3.0)) * exp(-d * 9.0);
    rc *= 0.55 + 0.45 * h1(floor(X / (px * (1.0 + d * 30.0))) + floor(d * 160.0) * 7.0) * smoothstep(0.0, 0.06, d) + 0.45 * (1.0 - smoothstep(0.0, 0.06, d));
    float F = mix(0.1, 0.62, wet) * (0.25 + 0.75 * exp(-d * 6.5));
    col = cBg * 0.32 + cMid * 0.25 * exp(-d * 3.0);
    col = mix(col, rc, F);
    float glow = 0.0;
    if (mouse.y < hz - 0.004) {
      float zm = 0.1 / (hz - mouse.y);
      vec2 gm = vec2(((mouse.x - 0.5) * asp + par.x * 0.03) * zm * gs, zm * gs * 0.5);
      glow = exp(-length((g - gm) * vec2(1.0, 1.4)) * 0.7);
    }
    float near = 0.35 + 0.65 * exp(-z * 0.06);
    col += tame(cP) * line * near * (0.55 + glow * 2.8) * (1.0 - wet * 0.4) * (0.55 + 0.45 * smoothstep(0.0, 0.2, d));
    col += tame(cS) * glow * 0.22 + cP * glow * glow * 0.08;
    col += hot * 0.16 * exp(-abs(X - sx) * 5.0) * exp(-d * 7.0) * (1.0 + wet);
  }
  col += hot * 0.14 * exp(-abs(yy) * 70.0);
  return col;
}`,

        tide: `
float craters(vec2 p, vec2 L){
  vec2 i = floor(p), f = fract(p); float s = 0.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 o = vec2(float(x), float(y)), r = h22(i + o);
    if (r.y < 0.6) continue;
    vec2 c = f - (o + 0.25 + r * 0.5);
    float rad = 0.12 + 0.3 * r.x * r.x, dd = length(c) / rad;
    vec2 dir = c / max(length(c), 0.0001);
    float side = dot(dir, L);
    s += smoothstep(1.0, 0.55, dd) * (-side) * 0.5 * smoothstep(0.0, 0.5, dd);
    s += smoothstep(0.8, 1.0, dd) * smoothstep(1.3, 1.0, dd) * side * 0.35;
    s -= smoothstep(0.6, 0.0, dd) * 0.08;
  }
  return s;
}
// the moon is an actual ball now not a flat circle
vec4 moon(vec2 dq, float R, vec3 M){
  vec2 u = dq / R; float rr = dot(u, u);
  float edge = smoothstep(1.0, 1.0 - 2.5 / (R * res.y), sqrt(rr));
  if (edge <= 0.0) return vec4(0.0);
  vec3 n = vec3(u, sqrt(max(1.0 - rr, 0.0)));
  vec3 L = normalize(moonL.xyz);
  vec2 lxy = length(L.xy) > 0.001 ? normalize(L.xy) : vec2(0.0, 1.0);
  float lam = max(dot(n, L), 0.0);
  vec2 sp = n.xy / (0.6 + n.z * 0.4);
  float mar = smoothstep(0.46, 0.66, fbm(sp * 1.6 + vec2(3.1, 7.4)));
  float alb = 0.98 - 0.3 * mar + 0.06 * (fbm3(sp * 10.0) - 0.5);
  float cr = (craters(sp * 3.2, lxy) + craters(sp * 7.0 + 11.0, lxy) * 0.2) * 0.35;
  float sh = clamp(pow(lam, 0.8) * (1.0 + cr * smoothstep(0.0, 0.3, lam)), 0.0, 1.3);
  vec3 c = M * alb * sh * (0.78 + 0.22 * n.z) + vec3(0.035, 0.045, 0.07) * (1.0 - smoothstep(0.0, 0.15, lam)) * alb;
  return vec4(c, edge);
}
vec3 tsky(vec2 p, float asp, float hz, vec2 mp, vec3 M, vec3 low, vec3 top, float full){
  vec2 q = vec2((p.x - 0.5) * asp, p.y);
  float k = clamp((p.y - hz) / (1.0 - hz), 0.0, 1.0), md = length(q - mp);
  vec3 col = mix(low, top, pow(k, 0.55));
  col += tame(cS) * 0.05 * smoothstep(0.5, 0.0, k);
  col += M * (0.2 * exp(-md * 5.5) + 0.05 * exp(-md * 1.4)) + vec3(1.0, 0.85, 0.7) * 0.12 * moonL.w * exp(-max(md - 0.072, 0.0) * 30.0);
  if (full > 0.5) {
    col += (stars(q + vec2(time * 0.0015, 0.0), 150.0, 0.07) + dust(q + vec2(0.3, 0.0))) * ext(k) * smoothstep(0.08, 0.3, md);
    col += shoot(vec2(p.x * asp, p.y), asp, k, 3.0);
    col += sat(vec2(p.x * asp, p.y), asp, 2.0);
  } else {
    col += starL(q + vec2(time * 0.0015, 0.0) + 3.7, 63.0, 0.035, 1.0) * ext(k) * 0.45 * smoothstep(0.08, 0.3, md);
  }
  // in the water the moon is only as bright as the phase, or a new moon still lights the sea
  vec4 mo = moon(q - mp, 0.072, full > 0.5 ? M / moonL.w : M);
  vec3 mc = mix(mo.rgb, mo.rgb * (0.6 + low * 2.0), 0.35);
  mc = mix(mc, low * 1.4 + M * 0.12, 0.12 + 0.1 * smoothstep(0.03, 0.07, md));
  col = mix(col, max(mc, col * 0.9 + low * 0.08), mo.a);
  col += M * (0.1 * exp(-max(md - 0.072, 0.0) * 55.0) + 0.02 * exp(-pow((md - 0.3) / 0.025, 2.0)));
  float cy = p.y - (hz + 0.28);
  float cl = smoothstep(0.5, 0.85, fbm3(vec2(q.x * 1.3 + time * 0.008, cy * 4.0 + 2.0))) * exp(-cy * cy * 28.0);
  vec3 cc = mix(cBg * 1.1 + low * 0.25, M * 0.55, 0.55 * exp(-md * 3.0));
  cc += M * cl * (1.0 - cl) * 2.2 * exp(-md * 3.5);
  col = mix(col, cc, cl * 0.6);
  // no hills in the reflection or you get black squiggles everywhere
  if (full < 0.5) return col;
  float hill = hz + 0.045 * fbm3(vec2(q.x * 2.2 + 3.0 + par.x * 0.05, 1.0)) + 0.012 * noise(vec2(q.x * 12.0, 2.0));
  float hill2 = hz + 0.024 * fbm3(vec2(q.x * 4.0 - 7.0 + par.x * 0.1, 5.0));
  float aa = 1.5 / res.y;
  col = mix(col, cBg * 0.8 + low * 0.3, smoothstep(hill + aa, hill - aa, p.y) * 0.85);
  col = mix(col, cBg * 0.5 + low * 0.1, smoothstep(hill2 + aa, hill2 - aa, p.y));
  // a ship. takes forever
  float cyc = 286.0, tc = mod(time + 170.0, cyc), slow = 18.7 * smoothstep(115.0, 155.0, tc);
  float shu = (tc - slow) / (cyc - 18.7), brake = step(117.0, tc) * step(tc, 141.0);
  float shx = (shu * 1.3 - 0.15 - 0.5) * asp, shy = hz + 0.0035;
  vec2 shd = vec2(q.x - shx, p.y - shy);
  col = mix(col, cBg * 0.4, step(abs(shd.x), 0.008) * step(abs(shd.y + 0.001), 0.0022));
  col += vec3(1.0, 0.92, 0.75) * exp(-length(shd - vec2(0.002, 0.003)) * res.y * 0.5) * 1.2 + vec3(1.0, 0.2, 0.25) * exp(-length(shd - vec2(-0.006, 0.0015)) * res.y * 0.7) * (0.12 + 0.88 * brake);
  float lx = (0.83 - par.x * 0.004) * asp, lt = hill2 + 0.016, dxl = q.x - (lx - 0.5 * asp);
  float tower = step(abs(dxl), 1.2 / res.y + (lt - p.y) * 0.05) * step(hill2 - 0.004, p.y) * step(p.y, lt);
  col = mix(col, cBg * 0.4, tower);
  float swp = cos(time * 0.7), fl = pow(max(swp, 0.0), 30.0);
  float dyl = p.y - lt - 0.002;
  col += vec3(1.0, 0.9, 0.7) * (0.35 + 1.6 * fl) * exp(-length(vec2(dxl, dyl)) * res.y * 0.35);
  col += vec3(1.0, 0.88, 0.7) * 0.25 * exp(-abs(dyl) * res.y * 0.25) * exp(-abs(dxl - sin(time * 0.7) * 0.3) * 9.0) * (0.15 + abs(sin(time * 0.7))) * step(0.0, swp) * smoothstep(0.0, 0.02, p.y - hz);
  return col;
}
vec3 scene(vec2 p, float asp){
  float hz = 0.36 + par.y * 0.01;
  vec2 q = vec2((p.x - 0.5) * asp, p.y);
  vec2 mp = vec2((0.24 - par.x * 0.015) * asp, hz + 0.34);
  vec3 M = mix(vec3(1.0, 0.97, 0.93), cS, 0.18) * moonL.w;
  vec3 low = cMid * 1.4 + tame(cP) * 0.22 + tame(cS) * 0.05, top = cBg * 0.7;
  if (p.y > hz) return tsky(p, asp, hz, mp, M, low, top, 1.0);
  float d = hz - p.y, H = 0.08, z = H / max(d, 0.0006);
  vec3 v = normalize(vec3(q.x, -d, 1.0));
  vec2 wp = vec2(q.x * z, z) * 5.0 + vec2(0.0, time * 0.05);
  float fp = z * z / (H * res.y) * 5.0;
  vec3 n = waves(wp, time * 0.9, fp, 0.6);
  vec2 rw = wp * 6.0 + vec2(time * 0.35, -time * 0.25);
  n = normalize(n + vec3(noise(rw) - 0.5, 0.0, noise(rw + 7.3) - 0.5) * 0.09 * smoothstep(2.0, 0.3, fp * 6.0));
  vec3 r = reflect(v, n); r.y = abs(r.y); r.z = max(r.z, 0.08);
  vec2 rp = vec2(0.5 + (r.x / r.z) / asp, hz + r.y / r.z);
  vec3 sk = tsky(rp, asp, hz, mp, M, low, top, 0.0);
  sk = mix(sk, mix(low, top, 0.3) * 1.05 + M * 0.03, 0.22 * smoothstep(0.0, 0.25, d));
  float F = fres(v, n);
  vec3 deep = cBg * 0.45 + tame(cP) * 0.015 + tame(cS) * 0.01;
  vec3 col = mix(deep, sk, clamp(F * 1.15 + 0.08, 0.0, 1.0));
  vec3 mv = normalize(vec3(mp.x, mp.y - hz, 1.0));
  float sd = max(dot(r, mv), 0.0);
  col += M * (pow(sd, 2400.0) * 8.0 * moonL.w + pow(sd, 380.0) * 0.45) * smoothstep(0.0, 0.004, d);
  float tip = smoothstep(0.03, 0.2, r.y / r.z), ax = exp(-abs(r.x / r.z - mp.x) * 14.0);
  col += M * ax * tip * 0.9 * exp(-d * 2.2) * smoothstep(0.0, 0.006, d);
  if (d < 0.05) {
    float hm = 0.045 * fbm3(vec2(q.x * 2.2 + 3.0 + par.x * 0.05, 1.0)) + 0.012 * noise(vec2(q.x * 12.0, 2.0));
    float wob = (n.x + n.z) * 0.02;
    col = mix(col, cBg * 0.65 + low * 0.25, smoothstep(hm * 0.9 + 0.002, hm * 0.9 - 0.002, d + wob) * 0.7 * smoothstep(0.05, 0.02, d));
  }
  col = mix(col, low * 1.1, exp(-d * 90.0) * 0.55);
  // plankton :)
  float bio = pow(noise(wp * 1.3 + vec2(time * 0.25, -time * 0.18)) * 0.9, 3.0) * smoothstep(0.08, 0.3, d);
  float spk = twk(3.0, 0.0, 0.86, 2.2, 6.0);
  vec3 bc2 = mix(tame(cS), vec3(0.3, 1.0, 0.85), 0.45);
  col += bc2 * (bio * 0.35 + spk * bio * 3.0);
  float gl = twk(3.0, 11.0, 0.965, 3.0, 10.0);
  col += M * gl * ax * tip * 1.4 * exp(-d * 4.0);
  float mist = noise(vec2(q.x * 3.0 + time * 0.025, d * 45.0 - time * 0.03)) * exp(-d * 22.0);
  col = mix(col, low * 1.3 + M * 0.04, smoothstep(0.35, 0.8, mist) * 0.4);
  return col;
}`,

        aurora: `
vec3 aur(vec2 s, float hz, vec3 A, vec3 B){
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 6; i++) {
    float fi = float(i), dep = fi / 5.0;
    // this curtain cant reach down here, dont bother
    if (s.y < hz + 0.24 + dep * 0.15 - 0.12 - dep * 0.07) continue;
    float x = s.x * (0.55 + dep * 0.9) + fi * 1.37 + par.x * 0.006 * fi;
    float warp = fbm3(vec2(x * 0.7, time * 0.03 + fi * 2.1)) * 1.7;
    float b0 = fbm3(vec2(x * 1.5 + warp, time * 0.036 + fi));
    float base = hz + 0.24 + dep * 0.15 + 0.09 * (b0 - 0.5) + 0.022 * sin(x * 13.0 + warp * 4.0 + time * 0.25) + 0.008 * sin(x * 37.0 + warp * 7.0 - time * 0.5);
    float fold = 1.0 + 0.9 * smoothstep(0.55, 1.0, abs(cos(x * 9.0 + warp * 3.0 + time * 0.22)));
    float u = s.y - base, hgt = 0.16 - dep * 0.05;
    if (u < -0.04) continue;
    float body = smoothstep(-0.009 - dep * 0.07, 0.0, u) * exp(-max(u, 0.0) / hgt);
    float rim = exp(-abs(u) / (0.006 + dep * 0.02)) * 0.28 * (1.0 - dep * 0.8);
    float rx = (x + warp * 0.35);
    float rays = noise(vec2(rx * 42.0 + time * 0.08, u * 2.0 + time * 0.38 + fi * 7.0));
    rays = 0.18 + 1.25 * rays * rays + 0.4 * noise(vec2(rx * 130.0 - time * 0.15, u * 2.5 + fi));
    float vis = smoothstep(0.34, 0.66, fbm3(vec2(x * 0.33 - time * 0.024, fi * 3.1))) * (0.8 + 0.2 * sin(time * 0.5 + x * 2.0 + fi));
    float rp = fract(x * 0.12 - time * 0.03 + fi * 0.21) - 0.5;
    vis *= 1.0 + 0.6 * exp(-rp * rp * 160.0);
    float hh = clamp(u / (hgt * 1.8), 0.0, 1.0);
    vec3 c = mix(A * 1.3, B, smoothstep(0.08, 0.55, hh));
    c = mix(c, B * 0.55 + A * 0.25, smoothstep(0.55, 1.0, hh) * 0.7);
    c = mix(c, vec3(1.0, 0.92, 0.97), rim * 0.4);
    acc += c * (body * rays + rim * rays) * fold * vis * (1.0 - dep * 0.62);
  }
  return acc * 0.42;
}
vec3 scene(vec2 p, float asp){
  float hz = 0.28 + par.y * 0.01;
  vec2 q = vec2((p.x - 0.5) * asp + par.x * 0.02, p.y);
  vec3 A = tame(cP), B = tame(cS);
  float lake = step(p.y, hz), d = max(hz - p.y, 0.0);
  vec2 s = q;
  vec3 v = vec3(0.0, 0.0, 1.0), n = vec3(0.0, 1.0, 0.0);
  if (lake > 0.5) {
    float H = 0.05, z = H / max(d, 0.0006);
    v = normalize(vec3(q.x, -d, 1.0));
    n = waves(vec2(q.x * z, z) * 9.0, time * 0.5, z * z / (H * res.y) * 9.0, 0.075);
    vec3 r = reflect(v, n); r.y = abs(r.y); r.z = max(r.z, 0.08);
    s = vec2(r.x / r.z, hz + r.y / r.z * 1.9);
  }
  float k = clamp((s.y - hz) / (1.0 - hz), 0.0, 1.0);
  vec3 col = mix(cMid * 1.25 + B * 0.04, cBg * 0.55, pow(k, 0.5));
  float rid = 0.0, amp = 0.5, fr = 1.2;
  for (int j = 0; j < 4; j++) { rid += amp * (1.0 - abs(noise(vec2(s.x * fr + 4.0, 1.0 + float(j))) * 2.0 - 1.0)); fr *= 2.1; amp *= 0.45; }
  float rid2 = 0.0; amp = 0.5; fr = 2.0;
  for (int j = 0; j < 3; j++) { rid2 += amp * (1.0 - abs(noise(vec2(s.x * fr - 9.0, 7.0 + float(j))) * 2.0 - 1.0)); fr *= 2.2; amp *= 0.45; }
  // mountains!!
  float r1 = hz + 0.02 + 0.2 * pow(rid / 0.87, 2.0), r2 = hz + 0.006 + 0.075 * pow(rid2 / 0.72, 1.7);
  float aa = 1.5 / res.y;
  float m1 = smoothstep(r1 + aa, r1 - aa, s.y), m2 = smoothstep(r2 + aa, r2 - aa, s.y);
  // stars behind a mountain are a waste of time
  if (max(m1, m2) < 0.999) col += (stars(s + par * 0.003, 150.0, 0.09) + dust(s) * 0.8) * ext(k) * (1.0 - lake * 0.45);
  if (lake < 0.5) { col += shoot(vec2(p.x * asp, p.y), asp, k, 6.0); col += sat(vec2(p.x * asp, p.y), asp, 4.0); }
  vec3 au = aur(s, hz, A, B);
  col += au * 1.35;
  col += (A * 0.07 + B * 0.03) * exp(-max(s.y - hz, 0.0) * 9.0);
  vec3 glow = au * 0.5 + (A * 0.6 + B * 0.4) * 0.05;
  float below = max(r1 - s.y, 0.0);
  vec3 far = mix(cBg * 0.55 + cMid * 0.55 + glow * 0.06, cBg * 0.4 + cMid * 0.22, smoothstep(0.0, 0.1, below));
  far += glow * (0.22 * exp(-below * 30.0) + 0.7 * exp(-below * 260.0));
  float snow = smoothstep(0.55, 0.9, rid / 0.87) * exp(-below * 34.0);
  if (snow > 0.01 && m1 > 0.0) snow *= smoothstep(0.42, 0.62, fbm3(vec2(s.x * 38.0 + s.y * 20.0, s.y * 26.0))); else snow = 0.0;
  far = mix(far, vec3(0.32, 0.34, 0.4) * 0.3 + glow * 0.45, snow * 0.6);
  col = mix(col, far, m1);
  float below2 = max(r2 - s.y, 0.0);
  vec3 near = cBg * 0.22 + glow * 0.04;
  near += glow * 0.45 * exp(-below2 * 500.0);
  col = mix(col, near, m2);
  col = mix(col, cMid * 0.9 + glow * 0.15, exp(-max(s.y - hz, 0.0) * 70.0) * 0.35 * (0.7 + 0.3 * fbm3(vec2(s.x * 4.0 + time * 0.02, 3.0))));
  if (lake > 0.5) {
    float F = fres(v, n);
    col = mix(cBg * 0.3 + cMid * 0.08, col, clamp(0.5 + F * 1.6, 0.0, 0.95));
    col = mix(col, cBg * 0.3, smoothstep(0.0, 0.28, d) * 0.18);
    col += A * 0.05 * exp(-d * 120.0);
  }
  return col;
}`
    };

    const POST = `
void main(){
  vec2 p = uv; float asp = res.x / res.y;
  vec3 col = scene(p, asp);
  vec2 v = uv - 0.5; col *= 1.0 - dot(v, v) * 0.85;
  vec3 over = max(col - 0.8, 0.0);
  col = col - over + 0.2 * (1.0 - exp(-over * 5.0));
  // noise so it doesnt band
  col += (h2(gl_FragCoord.xy + fract(time * 7.0) * 113.0) - 0.5) * (3.0 / 255.0);
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}`;

    // Bloom + grain + the colour grade. config.sys turns it off
    const FXS = {
        bright: `uniform sampler2D tex; uniform vec2 px; varying vec2 uv;
void main(){
  vec3 c = (texture2D(tex, uv + px * vec2(-1.0, -1.0)).rgb + texture2D(tex, uv + px * vec2(1.0, -1.0)).rgb + texture2D(tex, uv + px * vec2(-1.0, 1.0)).rgb + texture2D(tex, uv + px * vec2(1.0, 1.0)).rgb) * 0.25;
  float l = max(c.r, max(c.g, c.b));
  // capped or the sun eats the whole screen
  gl_FragColor = vec4(min(c, vec3(0.8)) * smoothstep(0.16, 0.7, l), 1.0);
}`,
        blur: `uniform sampler2D tex; uniform vec2 dir; varying vec2 uv;
void main(){
  vec3 c = texture2D(tex, uv).rgb * 0.227;
  c += (texture2D(tex, uv + dir * 1.385).rgb + texture2D(tex, uv - dir * 1.385).rgb) * 0.316;
  c += (texture2D(tex, uv + dir * 3.231).rgb + texture2D(tex, uv - dir * 3.231).rgb) * 0.07;
  gl_FragColor = vec4(c, 1.0);
}`,
        comp: `uniform sampler2D tex, bloom; uniform vec3 cP, cS, cBg, cMid; uniform float time, kb, kg, kn, hz; uniform vec2 px; varying vec2 uv;
float h2(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
vec3 hue(vec3 c){ return c / max(max(c.r, max(c.g, c.b)), 0.001); }
void main(){
  vec3 c = texture2D(tex, uv).rgb;
  // dark stuff in front of the sun stays dark. only its edges catch the glow
  float lc = luma(c), own = smoothstep(0.04, 0.45, lc), nb = 0.0;
  if (kb > 0.0) {
    nb = max(max(luma(texture2D(tex, uv + vec2(px.x * 2.5, 0.0)).rgb), luma(texture2D(tex, uv - vec2(px.x * 2.5, 0.0)).rgb)),
             max(luma(texture2D(tex, uv + vec2(0.0, px.y * 2.5)).rgb), luma(texture2D(tex, uv - vec2(0.0, px.y * 2.5)).rgb)));
  }
  float rim = smoothstep(0.08, 0.4, nb - lc);
  c += texture2D(bloom, uv).rgb * 0.45 * kb * max(max(own, rim), 0.06);
  // the glow shows up in the water too, stretched + wobbly
  float dn = hz - uv.y;
  if (dn > 0.0) c += texture2D(bloom, vec2(uv.x + sin(uv.y * 240.0 + time * 1.7) * 0.003, hz + dn * 0.7)).rgb * 0.5 * kb * exp(-dn * 4.0);
  vec3 over = max(c - 0.85, 0.0); c = c - over + 0.15 * (1.0 - exp(-over * 5.0));
  float l = luma(c);
  // shadows lean to the main colour, highlights to the second one
  vec3 g = c * mix(vec3(1.0), hue(cP), 0.28 * (1.0 - smoothstep(0.0, 0.4, l)));
  g *= mix(vec3(1.0), mix(hue(cS), vec3(1.0), 0.4), 0.3 * smoothstep(0.35, 1.0, l));
  g += cBg * 0.5 * (1.0 - l);
  g = clamp(g, 0.0, 1.0); g = mix(g, g * g * (3.0 - 2.0 * g), 0.3);
  g = mix(vec3(luma(g)), g, 1.12);
  c = mix(c, g, kg);
  float n = h2(gl_FragCoord.xy + fract(time * 13.0) * vec2(97.0, 41.0)) - 0.5;
  c += n * (0.012 + 0.045 * kn * (0.35 + 0.65 * smoothstep(0.02, 0.35, l)));
  gl_FragColor = vec4(max(c, 0.0), 1.0);
}`
    };

    const KINDS = {
        city: { jp: 'ネオン街', en: 'NEON CITY', hz: 0.36, hp: 0.012 },
        tide: { jp: '夜の海', en: 'NIGHT TIDE', hz: 0.36, hp: 0.01, px: 0.72 },
        aurora: { jp: 'オーロラ', en: 'AURORA', hz: 0.28, hp: 0.01 }
    };
    const kind = () => (os.prefs && KINDS[os.prefs.wall]) ? os.prefs.wall : 'city';

    function rgb(name, fb) {
        let s = getComputedStyle(root).getPropertyValue(name).trim() || fb, c = document.createElement('canvas').getContext('2d');
        c.fillStyle = s; let h = c.fillStyle;
        if (h[0] !== '#') { let m = /(\d+),\s*(\d+),\s*(\d+)/.exec(h) || [0, 255, 0, 153]; return [m[1] / 255, m[2] / 255, m[3] / 255]; }
        let n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
    }
    function engine(cv, keep) {
        let gl = null;
        try { gl = cv.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: !!keep, powerPreference: 'low-power' }); } catch (e) {}
        if (!gl) return null;
        const sh = (type, src) => { let o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
        let vs = sh(gl.VERTEX_SHADER, 'attribute vec2 a; varying vec2 uv; void main(){ uv = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }');
        if (!vs) return null;
        let buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        let progs = {}, cur = null, U = null, cols = null, timer = null;
        if (!keep) { let x = gl.getExtension('EXT_disjoint_timer_query'); if (x) timer = { ext: x, q: [], busy: 0 }; }
        const timed = !!timer;
        let pend = {}, quiet = gl.getExtension('KHR_parallel_shader_compile');
        function prep(k) {
            if (progs[k]) return true;
            if (!pend[k]) {
                let fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, HEAD + SCENES[k] + POST); gl.compileShader(fs);
                let pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
                pend[k] = pr;
                if (quiet) return false;
            } else if (quiet && !gl.getProgramParameter(pend[k], quiet.COMPLETION_STATUS_KHR)) return false;
            let pr = pend[k]; delete pend[k];
            if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { progs[k] = null; return false; }
            let u = {};
            ['res', 'time', 'mouse', 'par', 'cP', 'cS', 'cBg', 'cMid', 'moonL'].forEach(n => u[n] = gl.getUniformLocation(pr, n));
            progs[k] = { pr, u, a: gl.getAttribLocation(pr, 'a') };
            return true;
        }
        function use(k) {
            if (!progs[k]) { prep(k); if (pend[k]) { quiet = null; prep(k); quiet = gl.getExtension('KHR_parallel_shader_compile'); } }
            if (!progs[k]) return false;
            let P = progs[k];
            gl.useProgram(P.pr); gl.enableVertexAttribArray(P.a); gl.vertexAttribPointer(P.a, 2, gl.FLOAT, false, 0, 0);
            cur = k; U = P.u;
            if (cols) setCols(cols);
            return true;
        }
        function setCols(c) {
            cols = c;
            if (!U) return;
            gl.useProgram(progs[cur].pr);
            gl.uniform3fv(U.cP, c[0]); gl.uniform3fv(U.cS, c[1]); gl.uniform3fv(U.cBg, c[2]); gl.uniform3fv(U.cMid, c[3]);
        }
        function moonV() {
            let m = os.moon && os.moon();
            if (!m) return [0.62, 0.22, 0.75, 1];
            let a = m.angle * Math.PI / 180, si = Math.sin(a);
            // Full moon lights the whole sea, a sliver barely glows
            return [m.dx * si, m.dy * si, Math.cos(a), 0.025 + 0.975 * Math.pow(m.lit, 1.5)];
        }
        let fx = null;
        function fxInit() {
            if (fx !== null) return fx;
            fx = false;
            const mk = src => { let f = sh(gl.FRAGMENT_SHADER, HEAD.split('uniform')[0] + src); if (!f) return null; let p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, f); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
                let u = {}; ['tex', 'bloom', 'px', 'dir', 'time', 'kb', 'kg', 'kn', 'hz', 'cP', 'cS', 'cBg', 'cMid'].forEach(n => u[n] = gl.getUniformLocation(p, n)); return { pr: p, u, a: gl.getAttribLocation(p, 'a') }; };
            let P = { bright: mk(FXS.bright), blur: mk(FXS.blur), comp: mk(FXS.comp) };
            if (P.bright && P.blur && P.comp) fx = { P, t: [], w: 0, h: 0 };
            return fx;
        }
        function rt(w, h) {
            let t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR)); [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
            let f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
            return { t, f, w, h };
        }
        function fxSize(w, h) {
            if (fx.w === w && fx.h === h) return;
            fx.t.forEach(r => { gl.deleteTexture(r.t); gl.deleteFramebuffer(r.f); });
            let qw = Math.max(2, Math.round(w / 4)), qh = Math.max(2, Math.round(h / 4));
            fx.t = [rt(w, h), rt(qw, qh), rt(qw, qh)]; fx.w = w; fx.h = h;
        }
        function pass(P, out, src, src2) {
            gl.useProgram(P.pr); gl.enableVertexAttribArray(P.a); gl.vertexAttribPointer(P.a, 2, gl.FLOAT, false, 0, 0);
            gl.bindFramebuffer(gl.FRAMEBUFFER, out ? out.f : null); gl.viewport(0, 0, out ? out.w : cv.width, out ? out.h : cv.height);
            gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src.t); gl.uniform1i(P.u.tex, 0);
            if (src2) { gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, src2.t); gl.uniform1i(P.u.bloom, 1); gl.activeTexture(gl.TEXTURE0); }
        }
        function post(t) {
            let [A, B, C] = fx.t, P = fx.P, f = E.fx;
            if (f.bloom) {
                pass(P.bright, B, A); gl.uniform2f(P.bright.u.px, 1 / A.w, 1 / A.h); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
                [1, 2.2].forEach(k => {
                    pass(P.blur, C, B); gl.uniform2f(P.blur.u.dir, k / B.w, 0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
                    pass(P.blur, B, C); gl.uniform2f(P.blur.u.dir, 0, k / B.h); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
                });
            }
            pass(P.comp, null, A, B); let u = P.comp.u;
            gl.uniform1f(u.time, t); gl.uniform1f(u.kb, f.bloom ? 1 : 0); gl.uniform1f(u.kg, f.grade ? 1 : 0); gl.uniform1f(u.kn, f.grain ? 1 : 0); gl.uniform1f(u.hz, E.hz || 0); gl.uniform2f(u.px, 1 / A.w, 1 / A.h);
            if (cols) { gl.uniform3fv(u.cP, cols[0]); gl.uniform3fv(u.cS, cols[1]); gl.uniform3fv(u.cBg, cols[2]); gl.uniform3fv(u.cMid, cols[3]); }
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        const E = {
            gl, timed, fx: {}, mouse: [0.5, 0.9], par: [0, 0], q: 0.8,
            get kind() { return cur; },
            use, prep,
            colours() { setCols([rgb('--neon-primary', '#ff0099'), rgb('--neon-secondary', '#ff66b3'), rgb('--bg-base', '#12000a'), rgb('--bg-gradient-center', '#260015')]); },
            size(w, h) {
                // It used to draw 4 million pixels on a big screen and my laptop sounded like it was about to take off, so now it picks its own res off how long the gpu actually takes
                if (!w) {
                    let k = Math.min(1.5, window.devicePixelRatio || 1), cap = 1.15e6 * E.q * ((KINDS[cur] && KINDS[cur].px) || 1), px = innerWidth * innerHeight * k * k;
                    k *= Math.min(1, Math.sqrt(cap / px));
                    w = Math.round(innerWidth * k); h = Math.round(innerHeight * k);
                }
                w = Math.max(2, w); h = Math.max(2, h);
                if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
            },
            draw(t, w, h) {
                if (!U) return;
                E.size(w, h);
                let F = (E.fx.bloom || E.fx.grade || E.fx.grain) && fxInit();
                if (F) { fxSize(cv.width, cv.height); gl.bindFramebuffer(gl.FRAMEBUFFER, F.t[0].f); }
                let S = progs[cur]; gl.useProgram(S.pr); gl.enableVertexAttribArray(S.a); gl.vertexAttribPointer(S.a, 2, gl.FLOAT, false, 0, 0);
                gl.viewport(0, 0, cv.width, cv.height);
                gl.uniform2f(U.res, cv.width, cv.height); gl.uniform1f(U.time, t);
                gl.uniform2f(U.mouse, E.mouse[0], E.mouse[1]); gl.uniform2f(U.par, E.par[0], E.par[1]);
                if (U.moonL) { let m = moonV(); gl.uniform4f(U.moonL, m[0], m[1], m[2], m[3]); }
                let tq = timer && !timer.busy ? timer.ext.createQueryEXT() : null;
                if (tq) { timer.busy = 1; timer.ext.beginQueryEXT(timer.ext.TIME_ELAPSED_EXT, tq); }
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
                if (F) { let K = KINDS[cur]; E.hz = K ? K.hz + E.par[1] * K.hp : 0; post(t); }
                if (tq) { timer.ext.endQueryEXT(timer.ext.TIME_ELAPSED_EXT); timer.q.push(tq); }
            },
            gpu() {
                if (!timer || !timer.q.length) return null;
                let x = timer.ext, q = timer.q[0];
                if (!x.getQueryObjectEXT(q, x.QUERY_RESULT_AVAILABLE_EXT)) return null;
                timer.q.shift(); timer.busy = 0;
                let ns = x.getQueryObjectEXT(q, x.QUERY_RESULT_EXT); x.deleteQueryEXT(q);
                return gl.getParameter(x.GPU_DISJOINT_EXT) ? null : ns / 1e6;
            },
            lose() { let x = gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); }
        };
        E.colours();
        return E;
    }

    let cv = null, W = null, raf = 0, last = 0, t0 = performance.now(), gaps = [], ms = [], warned = false, slowFor = 0, lastGpu = null;
    // 0.6x
    // const SLOW = 1;
    const SLOW = 0.6;
    const lite = () => root.classList.contains('low-spec');
    const still = () => root.classList.contains('reduce-motion');
    let want = [0.5, 0.9], wantPar = [0, 0];
    function setup() {
        cv = document.createElement('canvas'); cv.id = 'desk-fx'; cv.setAttribute('aria-hidden', 'true');
        W = engine(cv);
        if (!W || !W.use(kind())) { W = null; return false; }
        document.body.insertBefore(cv, document.body.firstChild);
        let st = document.createElement('style');
        st.textContent = `
            #desk-fx { position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: -4; pointer-events: none; display: block; transition: opacity 0.45s, filter 0.45s; }
            #desk-fx.swap { opacity: 0; filter: blur(8px) brightness(1.6); }
            html.shader-bg .cyber-bg, html.shader-bg .perspective-grid { display: none; }
        `;
        document.head.appendChild(st);
        return true;
    }
    // Nothing to see = nothing to draw
    const covered = () => document.hidden || !!document.getElementById('sys-saver') || root.classList.contains('pt-busy')
        || (!root.classList.contains('glass-on') && !!document.querySelector('#desktop > .is-max:not(.is-min)'));
    let drawn = 0, fast = false, goodFor = 0;
    function loop(now) {
        raf = requestAnimationFrame(loop);
        if (!on() || covered()) { last = now; return; }
        let dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;
        let e = 1 - Math.pow(0.0005, dt), ep = 1 - Math.pow(0.3, dt);
        W.mouse[0] += (want[0] - W.mouse[0]) * e; W.mouse[1] += (want[1] - W.mouse[1]) * e;
        W.par[0] += (wantPar[0] - W.par[0]) * ep; W.par[1] += (wantPar[1] - W.par[1]) * ep;
        if (still()) { W.draw(14); cancelAnimationFrame(raf); raf = 0; return; }
        if (now - drawn < (lite() ? 48 : fast && !lite() ? 12 : 28)) return;
        if (drawn) { gaps.push(now - drawn); if (gaps.length > 30) gaps.shift(); }
        drawn = now;
        let g = W.gpu(); if (g != null) { ms.push(g); lastGpu = g; if (ms.length > 20) ms.shift(); }
        W.draw((now - t0) / 1000 * SLOW);
        tune();
    }
    function tune() {
        let top = lite() ? 0.42 : 1, q = W.q, slow = false;
        if (ms.length >= 20) {
            let m = ms.reduce((a, b) => a + b, 0) / ms.length; ms = [];
            if (m > 7 && q > 0.3) q *= 0.82; else if (m < 3.2 && q < top) q *= 1.06;
            slow = m > 12;
            if (m > 6) fast = false; else if (m < 3.5 && q >= top * 0.99) fast = true;
        } else if (gaps.length >= 30 && !W.timed) {
            let avg = gaps.reduce((a, b) => a + b, 0) / gaps.length, aim = lite() ? 50 : fast ? 17 : 34; gaps = [];
            if (fast && avg > 21) { fast = false; goodFor = 0; }
            else if (avg > aim * 1.35 && q > 0.3) q *= 0.85; else if (avg < aim * 1.08 && q < top) q *= 1.04;
            if (!fast && !lite() && q >= top * 0.99 && avg < aim * 1.08) { if (++goodFor >= 2) fast = true; } else if (!fast) goodFor = 0;
            slow = avg > aim * 1.8;
        } else return;
        W.q = Math.max(0.3, Math.min(top, q));
        // Still crawling. tell them about low spec once
        slowFor = slow && W.q <= 0.31 ? slowFor + 1 : 0;
        if (slowFor >= 3 && !warned && !lite()) { warned = true; if (os.notify) os.notify(say('liteHint', 'ur pc is having a hard time lol. config.sys → 軽量モード // LOW SPEC helps'), null, 9000); }
    }
    const say = (k, d) => window.T ? window.T(k, d) : d;
    function apply() {
        if (!W) return;
        root.classList.toggle('shader-bg', on());
        cv.style.display = on() ? '' : 'none';
        W.colours();
        // Low spec keeps the grain + grade but skips the glow, thats the costly bit
        W.fx = os.prefs && os.prefs.filmfx === false ? {} : { bloom: !lite(), grain: 1, grade: 1 };
        if (lite() && !W.wasLite) { W.qWas = W.q; W.q = Math.min(W.q, 0.42); }
        else if (!lite() && W.wasLite) { W.q = Math.max(W.q, W.qWas || 0.8); gaps = []; ms = []; }
        W.wasLite = lite();
        if (W.kind !== kind()) swap(kind());
        if (on() && !raf) { last = 0; raf = requestAnimationFrame(loop); }
    }
    function swap(k) {
        if (!W || !KINDS[k]) return;
        if (!W.prep(k)) { requestAnimationFrame(() => swap(k)); return; }
        cv.classList.add('swap');
        setTimeout(() => {
            if (W.use(k)) { gaps = []; ms = []; }
            if (!raf && on()) { last = 0; raf = requestAnimationFrame(loop); }
            else if (still()) W.draw(14);
            requestAnimationFrame(() => cv.classList.remove('swap'));
        }, 300);
    }
    function start() {
        if (!setup()) return;
        apply();
        new MutationObserver(() => { W.colours(); if (!raf && on()) { last = 0; raf = requestAnimationFrame(loop); } }).observe(root, { attributes: true, attributeFilter: ['style'] });
        new MutationObserver(() => { if (!raf && on()) { last = 0; raf = requestAnimationFrame(loop); } }).observe(root, { attributes: true, attributeFilter: ['class'] });
        window.addEventListener('resize', () => { if (W && on() && !raf) raf = requestAnimationFrame(loop); else if (W && still()) W.draw(14); });
        window.addEventListener('pointermove', e => {
            want = [e.clientX / innerWidth, 1 - e.clientY / innerHeight];
            wantPar = [(e.clientX / innerWidth - 0.5) * 0.66, (0.5 - e.clientY / innerHeight) * 0.66];
        }, { passive: true });
        document.addEventListener('pointerleave', () => { want = [0.5, 0.95]; });
        if (!(os.mobileish && os.mobileish())) setTimeout(() => (window.requestIdleCallback || setTimeout)(() => Object.keys(KINDS).reduce((p, k) => p.then(() => thumb(k, 240, 150)), Promise.resolve()), { timeout: 20000 }), 12000);
    }

    let thumbs = null, thumbCache = null;
    const TKEY = 'vmp_thumbs';
    function thumbKey(k) { let cs = getComputedStyle(root); return k + '|' + SCENES[k].length + '|' + cs.getPropertyValue('--neon-primary').trim() + cs.getPropertyValue('--neon-secondary').trim(); }
    function thumb(k, w, h) {
        if (!thumbCache) { try { thumbCache = JSON.parse(localStorage.getItem(TKEY) || '{}'); } catch (e) { thumbCache = {}; } }
        let key = thumbKey(k);
        if (thumbCache[key]) return Promise.resolve(thumbCache[key]);
        if (!thumbs) { let c = document.createElement('canvas'); thumbs = engine(c, true); if (thumbs) thumbs.cv = c; }
        if (!thumbs) return Promise.resolve('');
        return new Promise(done => {
            const go = () => {
                if (root.classList.contains('pt-busy')) { setTimeout(go, 1500); return; }
                if (!thumbs.prep(k)) { requestAnimationFrame(go); return; }
                if (!thumbs.use(k)) { done(''); return; }
                thumbs.colours(); thumbs.mouse = [0.5, 0.25]; thumbs.par = [0, 0];
                thumbs.draw(23, w || 240, h || 150);
                let url = ''; try { url = thumbs.cv.toDataURL('image/jpeg', 0.82); } catch (e) {}
                if (url) {
                    thumbCache[key] = url;
                    // Only keep the newest few so it doesnt fill up storage
                    let ks = Object.keys(thumbCache); while (ks.length > 18) delete thumbCache[ks.shift()];
                    try { localStorage.setItem(TKEY, JSON.stringify(thumbCache)); } catch (e) {}
                }
                done(url);
            };
            go();
        });
    }

    os.deskFx = {
        apply, thumb, kinds: KINDS,
        // Same sums as the shaders or the rain lands in the sky
        horizon: () => { if (!on() || !W) return 0.42; let K = KINDS[W.kind]; return K.hz + W.par[1] * K.hp; },
        get kind() { return W ? W.kind : null; },
        stats: () => (W && on() ? { w: cv.width, h: cv.height, q: W.q, gpu: lastGpu, lite: lite(), fps: lite() ? 20 : fast ? 60 : 30 } : null),
        get on() { return !!W && on(); },
        // os.deskFx.look({ bloom: 1, grade: 1, grain: 1 })
        look(f) { if (!W) return; W.fx = f || {}; if (still()) W.draw(14); else if (!raf && on()) { last = 0; raf = requestAnimationFrame(loop); } }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
