
(function () {
    const HEAD = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 uv;
uniform float t, trav, kick, bass, mid, high, asp; uniform vec3 cA, cB; uniform sampler2D fft;
uniform vec4 bA, bB, hit;
float bv(float i){ return i < 0.5 ? bA.x : i < 1.5 ? bA.y : i < 2.5 ? bA.z : i < 3.5 ? bA.w : i < 4.5 ? bB.x : i < 5.5 ? bB.y : bB.z; }
float bandAt(float x){ x = clamp(x, 0.0, 1.0) * 6.0; float i = floor(x), f = x - i; return mix(bv(i), bv(min(i + 1.0, 6.0)), f * f * (3.0 - 2.0 * f)); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float fq(float x){ return texture2D(fft, vec2(clamp(x, 0.0, 1.0), 0.5)).r; }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
float nz2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float fb2(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * nz2(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
float nz3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); vec2 o = vec2(37.0, 17.0); float n = dot(i.xy, vec2(1.0, 57.0)) + i.z * 113.0;
  return mix(mix(mix(fract(sin(n) * 43758.5), fract(sin(n + 1.0) * 43758.5), f.x), mix(fract(sin(n + 57.0) * 43758.5), fract(sin(n + 58.0) * 43758.5), f.x), f.y),
             mix(mix(fract(sin(n + 113.0) * 43758.5), fract(sin(n + 114.0) * 43758.5), f.x), mix(fract(sin(n + 170.0) * 43758.5), fract(sin(n + 171.0) * 43758.5), f.x), f.y), f.z); }
float sdb(vec3 p, vec3 b){ vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0); }
float rayLine(vec3 ro, vec3 rd, vec3 a, vec3 u, out float tr){ vec3 w = ro - a; float b = dot(rd, u), d = dot(rd, w), e = dot(u, w), den = max(1e-4, 1.0 - b * b); tr = (b * e - d) / den; float s = (e - b * d) / den; return length(w + rd * tr - u * s); }
vec3 post(vec3 o){ if (!(o.r == o.r && o.g == o.g && o.b == o.b)) o = vec3(0.0); o = min(o, vec3(64.0)); vec2 v = uv - 0.5; o *= 1.0 - dot(v, v) * 1.2; o += (hash(uv * 512.0 + t) - 0.5) * 0.02; return pow(max(o, 0.0), vec3(0.9)); }
`;
    const WET = HEAD + `
#define bass max(bA.x, bA.y)
#define mid ((bA.z + bA.w) * 0.5 + hit.y * 0.35)
#define high ((bB.y + bB.z) * 0.5 + hit.z * 0.45)
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float map(vec3 p){
  float d = 1e9;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    vec3 c = vec3(sin(t * (0.31 + fi * 0.07) + fi * 2.1), cos(t * (0.27 + fi * 0.05) + fi * 1.3) * 0.7, sin(t * (0.23 + fi * 0.09) + fi * 0.7)) * (0.9 + bass * 0.5);
    float r = 0.45 + 0.15 * sin(fi * 3.1 + t * 0.4) + fq(fi / 8.0) * 0.25 + kick * 0.08;
    d = smin(d, length(p - c) - r, 0.55);
  }
  float fl = 1.0 + kick * 0.35;
  vec3 c1 = vec3(sin(t * 0.53), sin(t * 0.37) * 0.6, cos(t * 0.53)) * 1.9 * fl, c2 = vec3(cos(t * 0.41 + 2.0), cos(t * 0.29) * 0.8, sin(t * 0.41 + 2.0)) * 2.05 * fl;
  d = smin(d, length(p - c1) - 0.11, 0.35);
  d = smin(d, length(p - c2) - 0.08, 0.3);
  d += sin(p.x * 9.0 + t * 2.0) * sin(p.y * 8.0 - t * 1.5) * sin(p.z * 7.0) * (0.01 + kick * 0.022);
  return d;
}
vec3 env(vec3 r){
  float b1 = smoothstep(0.22, 0.13, abs(r.x + 0.35)) * smoothstep(-0.05, 0.3, r.y) * (0.75 + 0.25 * smoothstep(0.1, 0.0, abs(r.x + 0.35)));
  float b2 = smoothstep(0.06, 0.025, abs(r.y + 0.45 + r.x * 0.2)) * smoothstep(-0.2, 0.3, r.x);
  float sp = pow(max(0.0, dot(r, normalize(vec3(-0.4, 0.6, -0.6)))), 60.0);
  float top = smoothstep(0.7, 0.98, r.y) * 0.12;
  vec3 o = vec3(1.0, 0.97, 0.96) * (b1 * 0.9 + b2 * 0.5 + sp * 1.3 + top) * (0.85 + mid * 0.3);
  o += cA * 0.05 * smoothstep(0.2, -0.6, r.y);
  return o;
}
void main(){
  vec2 q = (uv - 0.5) * vec2(asp, 1.0);
  float a = t * 0.15 + trav * 0.2;
  float rad = 4.2 - bass * 0.15 + sin(t * 0.23) * 0.12;
  vec3 ro = vec3(sin(a) * rad, 0.6 * sin(t * 0.13), cos(a) * rad), ta = vec3(0.0, -0.05, 0.0), fw = normalize(ta - ro), rt = normalize(cross(vec3(sin(t * 0.1) * 0.04, 1.0, 0.0), fw)), up = cross(fw, rt);
  vec3 rd = normalize(q.x * rt + q.y * up + 1.6 * fw);
  float bR = 3.1, bb = dot(ro, rd), bc = dot(ro, ro) - bR * bR, disc = bb * bb - bc;
  float d = disc > 0.0 ? max(0.0, -bb - sqrt(disc)) : 1e3, dmax = disc > 0.0 ? -bb + sqrt(disc) : 0.0;
  bool hitS = false; vec3 p;
  for (int i = 0; i < 76; i++) { if (d > dmax) break; p = ro + rd * d; float h = map(p); if (h < 0.002) { hitS = true; break; } d += h * 0.85; }
  float glow = exp(-length(q - vec2(0.0, 0.03)) * 2.2);
  vec3 o = mix(vec3(0.0), cA * 0.05, smoothstep(-0.6, 0.6, q.y)) + mix(cA, cB, 0.3) * glow * (0.05 + bass * 0.04);
  if (rd.y < 0.0) {
    float tf = (-1.9 - ro.y) / rd.y; vec3 fp = ro + rd * tf;
    float fd = length(fp.xz);
    float shade = 0.25 + 0.75 * smoothstep(0.5, 2.6, fd);
    vec3 fl = cA * 0.14 * exp(-fd * 0.4) * (1.0 + kick * 0.8) + vec3(1.0, 0.97, 0.96) * 0.07 * smoothstep(0.3, 0.0, abs(fp.x + fp.z * 0.2 + 2.5)) * exp(-fd * 0.25);
    float ffr = 0.2 + 0.8 * pow(1.0 - abs(rd.y), 5.0);
    o = mix(o, fl * shade * ffr + vec3(0.004, 0.003, 0.004), smoothstep(0.0, -0.04, rd.y) * exp(-tf * 0.04));
  }
  if (hitS) {
    vec2 e = vec2(0.002, 0.0);
    vec3 n = normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx)));
    float ao = 0.3 + 0.7 * clamp(0.5 * (map(p + n * 0.12) / 0.12 + map(p + n * 0.35) / 0.35), 0.0, 1.0);
    vec2 sp = vec2(atan(p.z, p.x) * 5.0, p.y * 1.4 + t * 0.35);
    float col = floor(sp.x * 2.0), lane = fract(sp.x * 2.0) - 0.5;
    float run = step(0.55, hash(vec2(col, 1.0))) * smoothstep(0.12, 0.02, abs(lane)) * smoothstep(0.0, 0.6, fract(sp.y + hash(vec2(col, 4.0))));
    n = normalize(n + (rt * lane * 0.5 - up * 0.05) * run);
    float mottle = vn(sp * vec2(3.0, 6.0));
    vec3 r = reflect(rd, n);
    float fr = pow(1.0 - max(0.0, dot(n, -rd)), 3.0);
    vec3 sharp = env(r), soft = env(normalize(r + n * 0.6));
    o = vec3(0.012, 0.008, 0.012) * ao + (sharp * (0.75 + 0.25 * fr) + soft * 0.12 * (0.7 + 0.3 * mottle)) * mix(0.3, 1.0, ao);
    o += vec3(1.0) * run * 0.02 * ao;
    float back = 0.5 + 0.5 * dot(n, normalize(-fw + vec3(0.0, 0.4, 0.0)));
    o += cA * fr * (1.0 + kick * 1.4) * (0.6 + 0.6 * back) * mix(0.5, 1.0, ao);
    o += cB * pow(fr, 6.0) * (0.3 + high * 2.0);
  }
  gl_FragColor = vec4(post(o), 1.0);
}`;
    // the pictures. this one's falling down a pipe forever
    const SUMP = HEAD + `
#define bass max(bA.x, bA.y)
#define mid ((bA.z + bA.w) * 0.5 + hit.y * 0.35)
#define high ((bB.y + bB.z) * 0.5 + hit.z * 0.45)
const float SA = 0.6981317, PI = 3.14159;
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
vec4 lampAt(vec3 p, float a){
  float s2 = floor((a + PI) / SA + 0.5), la = s2 * SA - PI, cell = floor(p.y / 3.0);
  vec3 lp = vec3(2.42 * cos(la), cell * 3.0 + 1.22, 2.42 * sin(la));
  return vec4(lp, step(0.45, hash(vec2(cell, s2))));
}
float lampBlink(vec3 lp){ float h = hash(lp.xz + lp.y); return 0.35 + 0.25 * sin(t * (1.5 + h) + h * 30.0) + kick * (0.6 + 0.6 * step(0.5, h)) + hit.z * 0.9 * step(0.5, hash(vec2(floor(t * 14.0), h))) + bB.z * 0.3; }
float slot(float r, float a){ return max(step(abs(r - 2.12), 0.24) * step(abs(fract(a * 6.0) - 0.5), 0.3), step(r, 1.8) * 0.1); }
float gR, gA; vec4 gL;
float map(vec3 p, out float mat){
  float r = length(p.xz), a = atan(p.z, p.x); gR = r; gA = a;
  float shaft = 2.6 - r;
  float ar = mod(a + SA * 0.5, SA) - SA * 0.5;
  vec2 pq = vec2(r * cos(ar), r * sin(ar));
  float fat = 0.05 * step(0.5, fract(floor((a + PI) / SA) * 0.37));
  float pc = length(pq - vec2(2.3, 0.0));
  float pipe = pc - 0.11 - fat;
  pipe = min(pipe, max(pc - 0.15 - fat, abs(mod(p.y + fat * 9.0, 2.0) - 1.0) - 0.05));
  float yy = mod(p.y, 3.0) - 1.5;
  float ring = max(abs(yy) - 0.04, abs(r - 2.15) - 0.35);
  float cut = max(max(abs(r - 2.12) - 0.24, (abs(fract(a * 6.0) - 0.5) - 0.3) * r / 6.0), abs(yy) - 0.1);
  float grate = max(ring, -cut);
  vec4 L = lampAt(p, a); gL = L;
  float lamp = length(p - L.xyz) - 0.065 + (1.0 - L.w) * 0.02;
  float d = min(min(shaft, pipe), min(grate, lamp));
  mat = d == shaft ? 1.0 : d == pipe ? 2.0 : d == grate ? 3.0 : 4.0;
  return d;
}
void main(){
  vec2 q = (uv - 0.5) * vec2(asp, 1.0);
  float yaw = t * 0.05 + bass * 0.1;
  vec3 ro = vec3(0.4 * sin(t * 0.2) + 0.08 * sin(t * 0.53), -trav * 2.4 - kick * 0.12, 0.4 * cos(t * 0.17) + 0.06 * cos(t * 0.41));
  vec3 rd = normalize(vec3(q.x, -0.75, q.y)); rd.xz *= rot(yaw); rd.yz *= rot(0.35 + 0.03 * sin(t * 0.23));
  vec3 deep = mix(vec3(1.0, 0.45, 0.2), cA, 0.4);
  float d = 0.0, mat = 0.0; bool hitS = false; vec3 p; float glow = 0.0, shafts = 0.0; vec3 lg = vec3(0.0);
  for (int i = 0; i < 72; i++) {
    p = ro + rd * d; float h = map(p, mat);
    if (h < 0.002) { hitS = true; break; }
    glow += exp(-h * 8.0) * 0.008;
    float r = gR, a = gA;
    float st = min(h * 0.9, 0.6);
    shafts += slot(r, a) * st * (0.6 + 0.4 * vn(vec2(a * 3.0, p.y * 0.7 + t * 0.4)));
    vec4 L = gL;
    lg += mix(cA, cB, hash(L.xz + 3.0)) * L.w * lampBlink(L.xyz) * st / (1.0 + dot(p - L.xyz, p - L.xyz) * 60.0);
    d += h * 0.9; if (d > 30.0) break;
  }
  vec3 o = vec3(0.0);
  if (hitS) {
    float m2; vec2 e = vec2(0.002, -0.002);
    vec3 n = normalize(e.xyy * map(p + e.xyy, m2) + e.yyx * map(p + e.yyx, m2) + e.yxy * map(p + e.yxy, m2) + e.xxx * map(p + e.xxx, m2));
    float r = length(p.xz), a = atan(p.z, p.x), cell = floor(p.y / 3.0);
    vec2 sp = vec2(a * 2.6, p.y);
    float g1 = vn(sp * 3.0), g2 = vn(sp * vec2(14.0, 2.0));
    if (mat == 1.0) { float bx = vn(sp * 9.0 + 7.0) - vn(sp * 9.0 + vec2(7.1, 7.0)), by = vn(sp * 9.0 + 7.0) - vn(sp * 9.0 + vec2(7.0, 7.1)); n = normalize(n + vec3(-sin(a), 0.0, cos(a)) * bx * 1.4 + vec3(0.0, by * 1.4, 0.0)); }
    float seam = mat == 1.0 ? smoothstep(0.03, 0.0, abs(fract(p.y * 0.666) - 0.5) - 0.47) + smoothstep(0.02, 0.0, abs(fract(a * 2.86 + 0.5) - 0.5) - 0.48) : 0.0;
    float wet = smoothstep(0.55, 0.85, vn(vec2(a * 22.0, p.y * 0.25))) * (mat == 1.0 ? 1.0 : 0.6);
    float drip = wet * smoothstep(0.92, 1.0, fract(p.y * 0.4 + t * 0.5 + hash(vec2(floor(a * 22.0), 1.0)) * 7.0));
    vec3 rust = vec3(0.16, 0.06, 0.03);
    vec3 base = mat == 1.0 ? vec3(0.05, 0.045, 0.05) * (0.7 + 0.3 * hash(floor(vec2(a * 8.0, p.y * 2.0)))) : mat == 2.0 ? vec3(0.09, 0.07, 0.07) : vec3(0.06);
    base = mix(base, rust, smoothstep(0.55, 0.9, g1) * 0.6) * (0.7 + 0.5 * g2) * (1.0 - seam * 0.6);
    float ao = 1.0;
    for (int k = 1; k < 5; k++) { float hk = float(k) * 0.07; ao -= (hk - map(p + n * hk, m2)) * (1.6 / float(k)); }
    ao = clamp(ao, 0.0, 1.0);
    vec3 ld = normalize(vec3(-p.x * 0.25, -1.0, -p.z * 0.25));
    float under = mix(0.25, 1.0, slot(r, a + 0.03 * sin(p.y)));
    float dif = max(0.0, dot(n, ld));
    vec3 hv = normalize(ld - rd);
    float rough = mat == 2.0 ? 30.0 : mix(8.0, 90.0, wet);
    float spec = pow(max(0.0, dot(n, hv)), rough) * (mat == 2.0 ? 0.7 : wet * 1.4);
    float swell = 0.15 + bass * 0.55 + kick * 0.25;
    o = base * (0.18 + 0.12 * ao) + base * deep * dif * under * 6.0 * swell * ao + deep * spec * swell * under;
    vec4 L = lampAt(p, a);
    vec3 lc = mix(cA, cB, hash(L.xz + 3.0)), lv = L.xyz - p; float ll = dot(lv, lv); lv *= inversesqrt(ll);
    float lb = L.w * lampBlink(L.xyz);
    float lspec = pow(max(0.0, dot(reflect(rd, n), lv)), rough * 0.8) * (mat == 2.0 ? 1.0 : wet * 1.5 + 0.1);
    o += lc * lb * (base * 9.0 * max(0.0, dot(n, lv)) * ao + lspec * 0.6) / (1.0 + ll * 2.2);
    if (mat == 4.0) o = mix(vec3(0.03), lc * 2.2 + 0.4, L.w * clamp(lampBlink(L.xyz), 0.0, 1.5));
    if (mat == 2.0) { float pi2 = floor((a + PI) / SA + 0.5), pb = bv(mod(pi2, 7.0));
      float run = smoothstep(0.6, 1.0, fract(p.y * 0.35 + t * (0.5 + pb * 1.5) + pi2 * 0.31)) + 0.25;
      o += mix(deep, mix(cA, cB, mod(pi2, 7.0) / 6.0), 0.6) * pb * pb * run * 2.2 * (0.5 + 0.5 * max(0.0, -dot(n, normalize(vec3(p.x, 0.0, p.z))))); }
    if (mat == 3.0) { float sb = bandAt(fract((a + PI) / (2.0 * PI))); o += mix(deep, cB, 0.3) * sb * sb * 1.6 * slot(r, a);
      float below = floor(ro.y / 3.0) - cell; o += vec3(1.0, 0.85, 0.7) * smoothstep(0.6, 0.0, abs(below - (1.0 - hit.x) * 6.0)) * hit.x * 1.2; }
    o += vec3(0.9, 0.85, 0.8) * drip * 0.25 * (0.4 + high);
    o *= exp(-d * 0.085);
  }
  float down = pow(max(0.0, -rd.y), 6.0);
  o += deep * glow * (0.4 + bass * 1.0);
  o += deep * shafts * 0.014 * (0.35 + bass * 0.8 + kick * 0.6);
  o += lg * 3.0;
  o += mix(cA, cB, 0.5) * down * (0.15 + bass * 0.4) + deep * pow(max(0.0, -rd.y), 40.0) * (0.15 + bass * 0.3 + kick * 0.4);
  vec3 v = vec3(0.0, -1.0, 0.0); v.yz *= rot(-0.35); v.xz *= rot(-yaw);
  vec2 c = q - v.xz * 0.75 / max(-v.y, 0.2);
  float cr = length(c), ca = atan(c.y, c.x);
  for (int k = 0; k < 2; k++) {
    float fk = float(k), lr = log(cr + 0.02) * 3.0 - trav * (2.4 + fk * 1.5) - t * 0.3;
    vec2 g = vec2(ca * (10.0 + fk * 8.0) / PI, lr), gi = floor(g), gf = fract(g) - 0.5;
    float on = step(0.86, hash(gi + fk * 13.0)), ox = (hash(gi + 5.0) - 0.5) * 0.6;
    float sk = smoothstep(0.08, 0.0, abs(gf.x - ox) * cr * 3.0) * smoothstep(0.5, 0.0, abs(gf.y)) * smoothstep(0.05, 0.5, cr);
    o += mix(deep, vec3(1.0, 0.9, 0.8), 0.5) * on * sk * (0.12 + high * 0.25) * (1.0 - fk * 0.4);
  }
  gl_FragColor = vec4(post(o), 1.0);
}`;
    const INSIDE = HEAD + `
#define bass max(bA.x, bA.y)
#define mid ((bA.z + bA.w) * 0.5 + hit.y * 0.35)
#define high ((bB.y + bB.z) * 0.5 + hit.z * 0.45)
float map(vec3 p, out float trap){
  p += 0.06 * sin(p.yzx * 3.0 + t * 0.4) * (0.5 + bA.y);
  float s = 1.0, k = 1.12 + bA.x * 0.08 + bA.y * 0.06 + kick * 0.04; trap = 1e9;
  for (int i = 0; i < 7; i++) {
    p = -1.0 + 2.0 * fract(0.5 * p + 0.5);
    float rr = dot(p, p); trap = min(trap, rr);
    float f = k / rr; p *= f; s *= f;
  }
  return 0.25 * (length(p.xy) - 0.12 - 0.05 * bA.w) / s;
}
void main(){
  vec2 q = (uv - 0.5) * vec2(asp, 1.0);
  vec3 ro = vec3(0.55 + 0.15 * sin(t * 0.09), 0.25 + 0.1 * cos(t * 0.07), trav * 0.3 + 0.015 * sin(t * 0.5));
  vec3 rd = normalize(vec3(q, 1.3 + 0.04 * sin(t * 0.31) - kick * 0.05)); rd.xy *= rot(t * 0.04 + 0.03 * sin(t * 0.13)); rd.xz *= rot(sin(t * 0.06) * 0.35);
  float d = 0.0, trap = 0.0, it = 0.0, gl = 0.0; bool hitS = false; vec3 p; vec3 vol = vec3(0.0);
  vec3 cM = mix(cA, cB, 0.5);
  for (int i = 0; i < 84; i++) {
    p = ro + rd * d; float h = map(p, trap);
    if (h < 0.0004 + d * 0.0012) { hitS = true; break; }
    float gk = exp(-h * 90.0) * 0.006;
    gl += gk;
    vol += mix(cB, cA, smoothstep(0.2, 1.2, trap)) * gk;
    d += h; it += 1.0; if (d > 6.0) break;
  }
  vec3 o = vec3(0.0);
  float fogc = 1.0 - exp(-d * 0.35);
  vec3 haze = cM * 0.018 * (0.5 + bass);
  if (hitS) {
    float tr2, e0 = 0.0004 + d * 0.0015; vec2 e = vec2(e0, -e0);
    vec3 n = normalize(e.xyy * map(p + e.xyy, tr2) + e.yyx * map(p + e.yyx, tr2) + e.yxy * map(p + e.yxy, tr2) + e.xxx * map(p + e.xxx, tr2));
    float ao = pow(1.0 - it / 84.0, 1.6);
    float oc = clamp(map(p + n * e0 * 6.0, tr2) / (e0 * 6.0), 0.0, 1.0) * clamp(map(p + n * e0 * 20.0, tr2) / (e0 * 20.0), 0.0, 1.0);
    ao *= 0.65 + 0.35 * oc;
    vec3 iri = 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + trap * 0.7 + t * 0.03 + dot(n, rd) * 0.3));
    vec3 c = mix(cA, cB, smoothstep(0.2, 1.2, trap));
    vec3 alb = mix(c, iri, 0.25);
    vec3 kl = normalize(vec3(-0.5, 0.7, -0.4));
    float key = max(0.0, dot(n, kl)), fill = max(0.0, dot(n, -kl)) * 0.35;
    float fr = pow(1.0 - abs(dot(n, rd)), 3.0);
    float sp = pow(max(0.0, dot(reflect(rd, n), kl)), 24.0) + 0.35 * pow(max(0.0, dot(reflect(rd, n), kl)), 4.0);
    float lv = 0.55 + mid * 0.4 + kick * 0.5;
    o = alb * (0.6 + key * 1.3 + fill) * ao * lv;
    o += mix(c, vec3(1.0), 0.25) * fr * ao * 0.45 * (0.6 + high * 0.6);
    o += vec3(1.0, 0.95, 0.97) * sp * ao * 0.6;
    float thin = smoothstep(0.35, 0.0, trap);
    o += cA * 1.2 * thin * (0.25 + kick * 0.6) * (0.5 + 0.5 * ao);
    o += vec3(1.0, 0.95, 0.97) * pow(ao, 6.0) * 0.25 * (0.5 + high);
    float gs = hash(floor(p.xy * 400.0) + floor(p.z * 400.0));
    o += vec3(1.0, 0.95, 0.9) * step(0.993 - high * 0.006, gs) * smoothstep(0.3, 0.9, key) * (0.5 + 0.5 * sin(t * 9.0 + gs * 60.0)) * high * ao * 1.5;
    float wave = exp(-pow((d - (1.0 - kick) * 2.2) * 6.0, 2.0)) * smoothstep(0.05, 0.4, kick);
    o += mix(cA, cB, 0.3) * wave * (0.6 + ao);
    o = mix(o, haze, fogc);
  } else o = haze;
  o += vol * (0.15 + high * 0.6 + kick * 0.5);
  o += mix(cB, cA, 0.5 + 0.5 * sin(t * 0.3)) * gl * 0.1;
  o = o / (1.0 + o) * 1.3;
  gl_FragColor = vec4(post(o), 1.0);
}`;
    const CITY = HEAD + `
#define bass max(bA.x, bA.y)
#define mid ((bA.z + bA.w) * 0.5 + hit.y * 0.35)
#define high ((bB.y + bB.z) * 0.5 + hit.z * 0.45)
float bx(vec3 p, vec3 b){ vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float tower(vec2 cell){ float h0 = hash(cell); return 0.4 + h0 * 1.5 + fq(fract(abs(cell.y) * 0.061 + h0 * 0.37) * 0.75) * 2.6; }
float roofY(vec3 p){ return 6.5 - 0.5 * pow(abs(sin(p.x * 0.7 + sin(p.z * 0.3) * 2.0) * sin(p.z * 0.45)), 3.0) - 0.15 * sin(p.x * 3.1 + p.z * 1.7); }
float map(vec3 p, out vec2 cell){
  cell = floor(p.xz / 1.6);
  vec2 lp = mod(p.xz, 1.6) - 0.8;
  float h = tower(cell), wx = 0.4 + 0.12 * hash(cell + 3.0);
  float d = bx(vec3(lp.x, p.y + 1.0 - h * 0.5, lp.y), vec3(wx, h * 0.5, 0.42));
  float h2 = hash(cell + 21.0);
  if (h2 > 0.5) d = min(d, bx(vec3(lp.x, p.y + 1.0 - h - 0.15, lp.y), vec3(wx * 0.6, 0.15, 0.25)));
  if (h2 < 0.3) d = min(d, length(vec2(lp.x, lp.y)) - 0.012 + max(0.0, abs(p.y + 1.0 - h - 0.35) - 0.35));
  if (abs(cell.x) < 0.5) d = 1e3;
  d = min(d, 0.8 - max(abs(lp.x), abs(lp.y)) + 0.27);
  return min(min(d, p.y + 1.0), roofY(p) - p.y);
}
vec3 skyc(vec3 rd, vec3 sunc){
  vec3 o = mix(vec3(0.0), cA * 0.06, smoothstep(-0.2, 0.6, rd.y));
  float s = max(0.0, dot(rd, normalize(vec3(0.0, 0.25, 1.0))));
  return o + sunc * (pow(s, 6.0) * (0.1 + bass * 0.08) + pow(s, 30.0) * 0.05);
}
vec3 roofc(vec3 p, vec3 sunc){
  float zl = fract(p.z * 0.25) * 4.0 - 2.0, li = floor(p.z * 0.25);
  float fl = 0.75 + 0.25 * step(0.12, hash(vec2(li, floor(t * 9.0)))) * (1.0 + kick * 0.3);
  float rock = vn(p.xz * 2.0) * 0.6 + vn(p.xz * 7.0) * 0.4;
  float lampL = exp(-length(vec2(p.x - 0.8, zl)) * 1.1) * fl;
  vec3 o = vec3(0.03, 0.025, 0.03) * (0.4 + rock * 0.8) * (0.3 + lampL * 3.0) + sunc * 0.035 * rock;
  for (int i = 0; i < 2; i++) {
    float px = i == 0 ? -0.35 : 1.95, pa = abs(p.x - px);
    float pipe = smoothstep(0.11, 0.08, pa) * step(0.04, fract(p.z * 0.7));
    o = mix(o, vec3(0.05, 0.045, 0.05) * (0.4 + 2.5 * lampL) * (1.0 - pa * 6.0) + vec3(1.0, 0.8, 0.55) * 0.08 * lampL * smoothstep(0.06, 0.0, abs(p.x - px + 0.03)), pipe);
  }
  float bulb = exp(-length(vec2(p.x - 0.8, zl)) * 9.0);
  o += vec3(1.0, 0.8, 0.5) * (lampL * 0.15 + bulb * 2.5) * fl;
  return o;
}
vec3 facade(vec3 p, vec3 n, vec2 cell, float h, vec3 sunc){
  vec2 w = abs(n.x) > 0.5 ? vec2(p.z, p.y) : vec2(p.x, p.y);
  float dens = 5.0 + floor(hash(cell + 5.0) * 4.0) * 2.0;
  vec2 wi = floor(w * vec2(dens, 9.0)), wf = fract(w * vec2(dens, 9.0));
  float on = step(0.58 - high * 0.25, hash(wi + cell * 17.0 + floor(t * 0.3 + hash(wi) * 6.0)));
  float win = step(0.22, wf.x) * step(wf.x, 0.88) * step(0.28, wf.y) * step(wf.y, 0.9) * step(p.y, h - 1.05);
  float kind = hash(wi * 1.7 + cell);
  vec3 tc = mix(cA, cB, hash(cell));
  vec3 wc = kind < 0.6 ? vec3(1.0, 0.72, 0.42) : kind < 0.85 ? vec3(0.55, 0.75, 1.0) : tc;
  wc = mix(wc, tc, 0.3);
  float blind = step(0.75, hash(wi + 3.0)) * step(0.5, fract(wf.y * 6.0));
  float inside = 0.6 + 0.4 * smoothstep(0.2, 0.5, abs(wf.x - 0.5 - 0.3 * sin(t * 0.5 + kind * 30.0)));
  float room = (0.55 + 0.6 * smoothstep(0.3, 0.9, wf.y)) * (0.7 + 0.3 * smoothstep(0.22, 0.4, min(wf.x - 0.22, 0.88 - wf.x) + 0.2));
  float tv = step(0.93, hash(wi + cell * 3.0 + 7.0));
  wc = mix(wc, vec3(0.45, 0.6, 1.0) * (0.6 + 0.6 * hash(vec2(floor(t * 8.0), kind))), tv);
  float ledge = smoothstep(0.05, 0.0, abs(fract(w.y * 9.0) - 0.1)) * 0.5, rib = step(0.9, fract(w.x * dens / 3.0));
  float dirt = vn(vec2(w.x * 24.0, w.y * 1.5 + hash(cell) * 9.0)) * (0.6 + 0.4 * smoothstep(0.1, 0.9, fract(w.y * 9.0)));
  float alb = (0.5 + 0.4 * max(0.0, n.y) + ledge) * (1.0 - rib * 0.3) * (0.65 + 0.5 * dirt);
  float street = step(0.5, abs(n.x)) * step(0.0, n.x * (0.8 - (cell.x * 1.6 + 0.8)));
  float ao = 0.35 + 0.65 * smoothstep(-1.0, 0.2, p.y);
  vec3 lit = vec3(0.022, 0.018, 0.026) + sunc * 0.035 * max(0.0, -n.z * 0.3 + n.y * 0.5 + 0.2) + mix(cA, cB, 0.5 + 0.5 * sin(p.z * 0.4)) * street * 0.07 * exp(-(p.y + 1.0) * 0.7) * (1.0 + bass * 0.6);
  vec3 o = lit * alb * ao;
  o += win * (1.0 - on) * (cA * 0.025 + sunc * 0.015) * (0.5 + 0.5 * hash(wi + 11.0));
  o += wc * on * win * (0.5 + mid * 0.5) * (1.0 - blind * 0.6) * inside * room;
  o += wc * on * (1.0 - win) * 0.035 * step(p.y, h - 1.05) * smoothstep(0.5, 0.0, abs(wf.y - 0.6));
  float ry = p.y - (h - 1.0);
  o += tc * (smoothstep(0.06, 0.0, abs(ry)) * (0.5 + kick * 1.4) + exp(ry * 6.0) * step(ry, 0.0) * 0.08 * (1.0 + kick));
  float scr = step(0.72, hash(cell + 51.0)) * step(0.5, abs(n.x));
  vec2 sq = vec2(fract(w.x / 1.6) - 0.5, p.y + 1.0 - h * 0.62);
  if (scr > 0.5 && abs(sq.x) < 0.3 && abs(sq.y) < 0.16) {
    float u = sq.x / 0.6 + 0.5, bars = floor(u * 14.0) / 14.0, lv = bandAt(bars), y01 = sq.y / 0.32 + 0.5;
    float on2 = step(y01, lv * 0.95 + 0.04) * step(0.12, fract(u * 14.0)) * step(0.15, fract(y01 * 12.0));
    vec3 bc = mix(cA, cB, bars);
    o = mix(o, bc * (0.05 + on2 * (1.2 + kick * 0.6)) + vec3(1.0) * on2 * step(lv * 0.95 + 0.04 - 0.08, y01) * 0.6, 0.95);
  }
  float sgn = step(0.45, hash(cell + 31.0));
  vec2 sp = vec2(w.x - (floor(w.x / 1.6) * 1.6 + 0.8 + (hash(cell + 33.0) - 0.5) * 0.4), p.y + 1.0 - h * 0.45);
  float bh = 0.35 + 0.2 * hash(cell + 35.0);
  float board = step(abs(sp.x), 0.07) * step(abs(sp.y), bh) * sgn * step(0.5, abs(n.x));
  float glyph = step(0.35, hash(floor(vec2(sp.x * 30.0, sp.y * 14.0)) + cell)) * step(0.15, fract(sp.y * 14.0));
  float fl = step(0.08 + hit.z * 0.25, hash(vec2(floor(t * 13.0), cell.y)));
  vec3 sc = mix(vec3(1.0, 0.2, 0.5), vec3(0.2, 0.9, 1.0), step(0.5, hash(cell + 37.0)));
  float spill = exp(-length(max(abs(sp) - vec2(0.07, bh), 0.0)) * 9.0) * sgn * step(0.5, abs(n.x));
  o += sc * spill * 0.12 * fl * (1.0 + kick * 0.5);
  o = mix(o, sc * (0.4 + glyph * 1.6) * fl * (0.9 + kick * 0.4), board);
  vec2 lp = mod(p.xz, 1.6) - 0.8;
  float wx = 0.4 + 0.12 * hash(cell + 3.0), side = cell.x < 0.0 ? 1.0 : -1.0;
  float bl = smoothstep(0.6, 0.66, fract(t * (0.4 + hash(cell + 41.0) * 0.3) + hash(cell + 43.0)));
  float rl = length(vec3(lp.x - side * wx, ry - 0.02, lp.y + 0.42));
  o += vec3(1.0, 0.1, 0.05) * (smoothstep(0.07, 0.02, rl) * 3.0 + exp(-rl * 8.0) * 0.5) * bl;
  return o;
}
void main(){
  vec2 q = (uv - 0.5) * vec2(asp, 1.0);
  vec3 ro = vec3(0.8 + sin(t * 0.11) * 0.22, 1.25 + sin(t * 0.07) * 0.45 + bA.y * 0.06 - kick * 0.03, trav * 1.05);
  vec3 rd = normalize(vec3(q.x, q.y - 0.16, 1.0)); rd.xz *= rot(sin(t * 0.045) * 0.3); rd.xy *= rot(sin(t * 0.05) * 0.05);
  vec3 sunc = mix(vec3(1.0, 0.85, 0.6), cB, 0.3);
  vec3 lampc = vec3(1.0, 0.78, 0.5);
  float d = hash(uv * 431.0 + fract(t)) * 0.12; vec2 cell; vec3 p; bool hitS = false; vec3 fog = vec3(0.0);
  for (int i = 0; i < 96; i++) {
    p = ro + rd * d; float h = map(p, cell);
    if (h < 0.002 * (1.0 + d * 0.5)) { hitS = true; break; }
    float st = min(h * 0.8, 0.5);
    float zl = fract(p.z * 0.25) * 4.0 - 2.0, below = 6.3 - p.y;
    float rc = 0.07 + below * 0.075, rr = length(vec2(p.x - 0.8, zl));
    float fl = 0.75 + 0.25 * step(0.12, hash(vec2(floor(p.z * 0.25), floor(t * 9.0))));
    float fd = exp(-d * 0.07);
    fog += lampc * smoothstep(rc, rc * 0.15, rr) * exp(-below * 0.2) * fl * st * fd * 2.0;
    fog += mix(cA, cB, 0.5 + 0.5 * sin(p.z * 0.4)) * exp(-(p.y + 1.0) * 3.0) * 0.05 * st * fd;
    d += st; if (d > 45.0) break;
  }
  fog *= 0.035 * (1.0 + bass * 0.5);
  vec3 o = skyc(rd, sunc);
  if (hitS) {
    vec2 e = vec2(0.003, 0.0); vec2 cc;
    vec3 n = normalize(vec3(map(p + e.xyy, cc) - map(p - e.xyy, cc), map(p + e.yxy, cc) - map(p - e.yxy, cc), map(p + e.yyx, cc) - map(p - e.yyx, cc)));
    float h = tower(cell);
    if (p.y < -0.99) {
      float pud = smoothstep(0.35, 0.65, hash(floor(p.xz * 2.0)) * 0.5 + 0.5 * sin(p.x * 1.3 + sin(p.z * 0.7) * 2.0) * 0.5 + 0.25);
      vec2 rc = floor(p.xz * 2.5), rf = fract(p.xz * 2.5) - 0.5;
      float rph = fract(t * 0.7 + hash(rc + 2.0)), rlen = length(rf);
      vec2 ring = rf / max(rlen, 0.001) * sin((rlen - rph * 0.5) * 60.0) * smoothstep(0.08, 0.0, abs(rlen - rph * 0.5)) * (1.0 - rph) * step(0.6, hash(rc + 9.0)) * pud * 0.12;
      float grit = vn(p.xz * 18.0);
      float smear = vn(p.xz * vec2(3.0, 34.0)) - 0.5;
      vec3 sn = normalize(vec3(sin(p.z * 9.0 + t) * 0.015 * (1.0 - pud) + ring.x + sin(p.z * 30.0 + t * 20.0) * kick * 0.006, 1.0, smear * 0.12 * (1.0 - pud) + ring.y));
      vec3 rr = reflect(rd, sn);
      float d2 = 0.02; vec2 c2; vec3 rp; bool rh = false;
      for (int k = 0; k < 38; k++) { rp = p + rr * d2; float hh = map(rp, c2); if (hh < 0.004) { rh = true; break; } d2 += min(hh * 0.9, 0.5); if (d2 > 16.0) break; }
      vec3 refl = skyc(rr, sunc) * 0.6;
      if (rh && rp.y > roofY(rp) - 0.03) refl = roofc(rp, sunc) * exp(-d2 * 0.08) * 0.5;
      else if (rh && rp.y > -0.99) { vec3 n2 = normalize(vec3(map(rp + e.xyy, cc) - map(rp - e.xyy, cc), map(rp + e.yxy, cc) - map(rp - e.yxy, cc), map(rp + e.yyx, cc) - map(rp - e.yyx, cc))); refl = facade(rp, n2, c2, tower(c2), sunc) * exp(-d2 * 0.1); }
      float fr = 0.3 + 0.7 * pow(1.0 - max(0.0, -rd.y), 5.0);
      float zl = fract(p.z * 0.25) * 4.0 - 2.0;
      vec3 base = vec3(0.006, 0.005, 0.008) * (0.6 + 0.8 * grit) + lampc * 0.012 * exp(-length(vec2(p.x - 0.8, zl)) * 0.9) * (1.0 - pud)
        + mix(cA, cB, 0.5 + 0.5 * sin(p.z * 0.4)) * 0.012 * smoothstep(0.3, 0.8, abs(p.x - 0.8));
      o = base + refl * (0.35 + pud * 0.75) * fr;
      o += vec3(0.5, 0.45, 0.3) * 0.05 * step(abs(p.x - 0.8), 0.02) * step(0.5, fract(p.z * 0.6)) * (0.5 + 0.5 * grit);
    } else if (p.y > roofY(p) - 0.02) {
      o = roofc(p, sunc);
    } else {
      o = facade(p, n, cell, h, sunc);
    }
    o = mix(o, cA * 0.04 + sunc * 0.025, 1.0 - exp(-d * 0.05));
  }
  o += fog;
  float dlim = hitS ? d : 45.0;
  for (int k = 0; k < 6; k++) {
    float fk = float(k), lx = 0.15 + fk * 0.27, ly = 0.4 + hash(vec2(fk, 2.0)) * 2.2, dir = mod(fk, 2.0) < 0.5 ? 1.0 : -1.0;
    float tr, dl = rayLine(ro, rd, vec3(lx, ly, 0.0), vec3(0.0, 0.0, 1.0), tr);
    if (tr > 0.0 && tr < dlim) { vec3 cp = ro + rd * tr; float sp = 1.2 + hash(vec2(fk, 5.0)) * 1.4, sl = 2.2 + hash(vec2(fk, 7.0)) * 2.0;
      float f = fract((cp.z - t * sp * dir * 1.6) / sl), car = step(0.72 - bB.w * 0.3, hash(vec2(fk, floor((cp.z - t * sp * dir * 1.6) / sl))));
      float lamp = smoothstep(0.045, 0.0, abs(f - 0.5) * sl) + smoothstep(0.4, 0.0, abs(f - 0.5) * sl) * 0.15;
      vec3 lc = dir > 0.0 ? vec3(1.0, 0.12, 0.08) : vec3(1.0, 0.92, 0.8);
      o += lc * lamp * car * exp(-dl * 110.0) * 2.2 * exp(-tr * 0.04) + lc * lamp * car * exp(-dl * 22.0) * 0.1 * exp(-tr * 0.04); }
  }
  for (int k = 0; k < 2; k++) { float fk = float(k), a = sin(t * 0.21 + fk * 2.7) * 0.5; vec3 u = normalize(vec3(sin(a) * (fk * 2.0 - 1.0) * 0.6, 1.0, cos(a) * 0.4 - 0.2));
    float tr, dl = rayLine(ro, rd, vec3(0.8 + (fk - 0.5) * 2.0, -1.0, ro.z + 18.0 + fk * 6.0), u, tr);
    o += mix(sunc, cB, 0.4) * exp(-dl * 6.0) * step(0.0, tr) * step(tr, dlim) * (0.025 + hit.x * 0.08 + hit.w * 0.04); }
  { vec2 rq = q * vec2(90.0, 3.0) + vec2(0.0, t * 6.0); vec2 ri = floor(rq); float rn = step(0.86 - bB.y * 0.1, hash(ri)) * smoothstep(0.2, 0.0, abs(fract(rq.x) - 0.5)) * smoothstep(0.0, 0.3, fract(rq.y + hash(ri + 3.0)));
    o += mix(sunc, cA, 0.3) * rn * 0.035; }
  o += mix(cA, sunc, 0.5) * 0.02 * smoothstep(0.3, -0.2, rd.y);
  gl_FragColor = vec4(post(o), 1.0);
}`;
    const SHEET = HEAD + `
#define bass max(bA.x, bA.y)
#define mid ((bA.z + bA.w) * 0.5 + hit.y * 0.35)
#define high ((bB.y + bB.z) * 0.5 + hit.z * 0.45)
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float bumps(vec2 p){
  float h = 0.0;
  for (int i = 0; i < 7; i++) { float fi = float(i), u = fi / 6.0; vec2 c = vec2(-4.2 + u * 8.4, sin(t * (0.13 + fi * 0.02) + fi * 1.9) * 2.4 + 0.6);
    float w = 0.9 - u * 0.45, b = bv(fi); h += exp(-dot(p - c, p - c) / (w * w)) * b * b * (0.85 - u * 0.25); }
  return h;
}
vec2 hitAt(float seed, float rate){ float k = floor(t * rate + seed); return vec2(hash(vec2(k, seed)) * 7.0 - 3.5, hash(vec2(seed, k)) * 4.0 - 1.0); }
float ht(vec2 p){
  vec2 kc = hitAt(1.0, 0.5); float rk = length(p - kc), ak = 1.0 - hit.x;
  float h = sin(rk * 4.0 - ak * 9.0) * exp(-rk * 0.5) * exp(-abs(rk - ak * 2.2) * 1.5) * hit.x * 0.35 + exp(-rk * rk * 1.2) * hit.x * 0.2;
  vec2 sc = hitAt(7.0, 0.7); float rs = length(p - sc), as2 = 1.0 - hit.y;
  h += sin(rs * 9.0 - as2 * 14.0) * exp(-abs(rs - as2 * 1.6) * 3.0) * hit.y * 0.12;
  h += (nz2(p * 5.0 + vec2(t * 2.0, -t * 1.3)) - 0.5) * 0.022 * (bB.y * 0.6 + hit.z * 0.7);
  h += sin(p.x * 1.3 + t * 0.6) * sin(p.y * 1.1 - t * 0.5) * (0.14 + bB.w * 0.06);
  return h + bumps(p);
}
vec3 env(vec3 r, float rough){
  float w = 1.0 + rough * 2.5, k = 1.0 / (1.0 + rough * 1.5);
  float big = smoothstep(0.12 * w, 0.09 * w - 0.03, abs(r.x + 0.3)) * (0.8 + 0.4 * smoothstep(0.08, 0.0, abs(r.x + 0.3))) * smoothstep(0.08, 0.45, r.y) * (0.75 + 0.25 * smoothstep(0.9, 0.3, r.y));
  float halo = smoothstep(0.3 * w, 0.0, abs(r.x + 0.3)) * smoothstep(0.05, 0.5, r.y) * 0.18;
  float thin = smoothstep(0.07 * w, 0.015 * w, abs(r.x - 0.55 - 0.12 * sin(t * 0.13))) * smoothstep(0.0, 0.4, r.y);
  float back = smoothstep(0.1 * w, 0.02 * w, abs(r.y - 0.12 + r.x * 0.1)) * smoothstep(-0.2, 0.4, -r.z) * 0.3;
  vec3 L = normalize(vec3(-0.3, 0.7, 0.5)); float rl = max(0.0, dot(r, L));
  float sp = pow(rl, 220.0 / (1.0 + rough * 8.0)) * 2.0 * k + pow(rl, 40.0) * 0.25;
  vec3 o = mix(cA, vec3(1.0), 0.35) * (big * 0.75 + halo) * (0.8 + mid * 0.4) * k;
  o += vec3(1.0, 0.97, 0.96) * (thin * 0.5 * k + sp * 1.3);
  o += mix(cB, vec3(0.8, 0.85, 1.0), 0.5) * back * k;
  o += cA * 0.012 * smoothstep(-0.1, 0.8, r.y);
  return o;
}
void main(){
  vec2 q = (uv - 0.5) * vec2(asp, 1.0);
  vec3 ro = vec3(sin(t * 0.07) * 1.5, 1.4 + sin(t * 0.31) * 0.05 + bass * 0.06, -5.0 + cos(t * 0.05)), ta = vec3(0.0, -0.05 * kick, 0.0);
  vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(sin(t * 0.11) * 0.03, 1.0, 0.0), fw)), up = cross(fw, rt), rd = normalize(q.x * rt + q.y * up + 1.5 * fw);
  float d = 0.0, dl = 0.0; vec3 p; bool hitS = false;
  for (int i = 0; i < 88; i++) {
    p = ro + rd * d; float h = p.y - ht(p.xz);
    if (h < 0.0) { hitS = true; break; }
    dl = d; d += max(h * 0.5, 0.004 + d * 0.006); if (d > 30.0) break;
  }
  if (hitS) { for (int j = 0; j < 6; j++) { float m = 0.5 * (d + dl); vec3 pm = ro + rd * m; if (pm.y - ht(pm.xz) < 0.0) d = m; else dl = m; } p = ro + rd * d; }
  vec3 fogc = cA * 0.022 + vec3(0.004, 0.003, 0.005);
  vec3 o = fogc * smoothstep(0.35, -0.05, rd.y) + cA * 0.01 * exp(-abs(rd.x + 0.3) * 6.0) * smoothstep(0.0, 0.3, rd.y);
  if (hitS) {
    vec2 e = vec2(0.01, 0.0);
    float h0 = ht(p.xz);
    vec3 n = normalize(vec3(ht(p.xz - e.xy) - ht(p.xz + e.xy), 2.0 * e.x, ht(p.xz - e.yx) - ht(p.xz + e.yx)));
    float avg = (ht(p.xz + vec2(0.5, 0.0)) + ht(p.xz - vec2(0.5, 0.0)) + ht(p.xz + vec2(0.0, 0.5)) + ht(p.xz - vec2(0.0, 0.5))) * 0.25;
    float ao = clamp(1.0 + (h0 - avg) * 2.2, 0.35, 1.15);
    float fade = exp(-d * 0.12);
    float rough = smoothstep(0.55, 0.85, vn(p.xz * 1.1 + 7.0)) * 0.6;
    vec2 gp = p.xz * 38.0;
    n = normalize(n + vec3(vn(gp) - 0.5, 0.0, vn(gp + 19.0) - 0.5) * 0.025 * fade * (0.3 + rough));
    vec2 bc = floor(p.xz * 4.0), bf = fract(p.xz * 4.0) - 0.5 - (vec2(hash(bc + 3.0), hash(bc + 5.0)) - 0.5) * 0.5;
    float bead = step(0.86, hash(bc)) * smoothstep(0.08, 0.06, length(bf)) * fade;
    n = normalize(n + vec3(bf.x, 0.0, bf.y) * bead * (2.5 + kick * 2.0));
    rough *= 1.0 - bead;
    vec3 r = reflect(rd, n);
    float fr = pow(1.0 - max(0.0, dot(n, -rd)), 4.0);
    o = vec3(0.006, 0.004, 0.007) + env(r, rough) * (0.55 + 0.45 * fr) * mix(1.0, ao, 0.6);
    o += cA * fr * fr * (0.35 + kick * 0.7) * ao;
    float b = bumps(p.xz), thin = smoothstep(0.2, 0.85, b);
    vec3 under = mix(cA, cB, 0.5 + 0.5 * sin(b * 3.0 + t * 0.4));
    o += under * thin * thin * (0.22 + high * 0.15 + kick * 0.12) * (0.6 + 0.4 * max(0.0, n.y));
    o += under * smoothstep(0.15, 0.6, b) * 0.025 * (1.0 + high);
    o += vec3(1.0, 0.97, 0.95) * bead * smoothstep(0.035, 0.0, length(bf - vec2(-0.025, 0.03))) * (1.1 + high * 0.8);
    o *= 0.94 + 0.06 * hash(floor(p.xz * 140.0)) * fade;
    o = mix(o, fogc, 1.0 - exp(-d * 0.07));
  }
  gl_FragColor = vec4(post(o), 1.0);
}`;
    const CHAINS = HEAD + `
#define bass max(bA.x, bA.y)
#define mid ((bA.z + bA.w) * 0.5 + hit.y * 0.35)
#define high ((bB.y + bB.z) * 0.5 + hit.z * 0.45)
float link(vec3 p, float le, float ra, float rb){ vec3 q = vec3(p.x, max(abs(p.y) - le, 0.0), p.z); return length(vec2(length(q.xy) - ra, q.z)) - rb; }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float chain(vec3 p, out float li){
  float P = 1.04;
  vec3 a = p; a.y = mod(a.y, P) - P * 0.5;
  vec3 b = p; b.y = mod(b.y + P * 0.5, P) - P * 0.5; b.xz = b.zx;
  float da = link(a, 0.2, 0.26, 0.065), db = link(b, 0.2, 0.26, 0.065);
  li = da < db ? floor(p.y / P) * 2.0 : floor((p.y + P * 0.5) / P) * 2.0 + 1.0;
  return min(da, db);
}
float map(vec3 p, out float id, out float li){
  p *= 0.62;
  vec2 cell = floor((p.xz + 1.5) / 3.0); id = hash(cell);
  vec3 q = p; q.xz = mod(p.xz + 1.5, 3.0) - 1.5;
  float sw = 0.18 * (1.0 + bass * 1.6);
  q.xz += vec2(sin(p.y * 0.3 + t * 0.7 + id * 6.0), cos(p.y * 0.27 + t * 0.6 + id * 4.0)) * sw;
  q.xz += vec2(sin(p.y * 1.1 - t * 1.9 + id * 9.0), 0.0) * 0.03 * (0.4 + bass);
  q.y += t * (0.25 + id * 0.5) * (id > 0.5 ? 1.0 : -1.0);
  q.y += kick * kick * 0.09 * (0.5 + hash(cell + 5.0)) * (id > 0.5 ? -1.0 : 1.0);
  q.x += sin(p.y * 7.0 + t * 60.0) * 0.012 * hit.y;
  float c = chain(q, li);
  if (id > 0.55) {
    float yy = mod(q.y + id * 3.0, 3.12) - 1.56, r = length(q.xz);
    float cuff = max(abs(r - 0.33) - 0.045, abs(yy) - 0.16) - 0.01;
    float ring = length(vec2(length(vec2(q.x - 0.37, yy + 0.02)) - 0.11, q.z)) - 0.022;
    if (cuff < c) { c = cuff; li = -1.0; } if (ring < c) { c = ring; li = -2.0; }
  }
  return c / 0.62;
}
float map(vec3 p){ float a, b; return map(p, a, b); }
void main(){
  vec2 q = (uv - 0.5) * vec2(asp, 1.0);
  vec3 ro = vec3(1.5 + sin(t * 0.1) * 0.5, sin(t * 0.07) * 1.5 + sin(t * 0.31) * 0.05, trav * 1.4);
  vec3 rd = normalize(vec3(q, 1.1 - bass * 0.04)); rd.yz *= rot(sin(t * 0.09) * 0.35); rd.xz *= rot(sin(t * 0.05) * 0.4); rd.xy *= rot(sin(t * 0.06) * 0.02);
  float d = 0.0, id = 0.0, li = 0.0, it = 0.0, shaft = 0.0; vec3 p; bool hitS = false;
  for (int i = 0; i < 92; i++) { p = ro + rd * d; float h = map(p, id, li); if (h < 0.0015 * (1.0 + d * 0.5)) { hitS = true; break; }
    vec2 sc = mod(p.xz + vec2(0.0, 1.5), 3.0) - 1.5;
    float smoke = 0.55 + 0.45 * vn(vec2(p.x * 1.3 + p.z * 0.7, p.y * 0.8 + t * 0.35));
    shaft += exp(-dot(sc, sc) * 3.0) * min(h * 0.6, 0.3) * smoke * (0.7 + 0.3 * sin(p.y * 2.0 + t)) * exp(-d * 0.07);
    d += h * 0.6; it += 1.0; if (d > 24.0) break; }
  vec3 tint = mix(cA, cB, 0.5);
  vec3 RED = mix(vec3(0.75, 0.02, 0.05), cA, 0.2);
  vec3 fogc = vec3(0.003, 0.0022, 0.0028) + RED * 0.006 * (1.0 + bA.y * 0.6) * smoothstep(0.3, -0.6, rd.y);
  vec3 o = fogc;
  if (hitS) {
    float m2, l2; vec2 e = vec2(0.0015 * (1.0 + d * 0.3), 0.0);
    vec3 n = normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx)));
    float lh = hash(vec2(li, id * 31.0));
    vec2 rp = vec2(p.y * 4.5 + p.x * 3.0, p.z * 4.5 - p.x * 2.0);
    float blot = vn(rp) * 0.6 + vn(rp * 3.1) * 0.4;
    float rust = smoothstep(0.55, 0.95, blot * (0.4 + lh * 0.9)) * (0.5 + 0.5 * exp(-d * 0.15)) * 0.25;
    vec3 pit = vec3(vn(rp * 6.0), vn(rp.yx * 6.0 + 3.0), vn(rp * 5.0 + 7.0)) - 0.5;
    float near = exp(-d * 0.22);
    n = normalize(n + pit * (0.015 + rust * 0.25) * near);
    float ao = clamp(map(p + n * 0.09) / 0.09, 0.0, 1.0) * 0.5 + 0.5 * clamp(map(p + n * 0.3) / 0.3, 0.0, 1.0);
    ao = ao * (0.35 + 0.65 * pow(1.0 - it / 92.0, 1.5));
    vec3 r = reflect(rd, n);
    float fre = pow(1.0 - max(0.0, dot(n, -rd)), 4.0);
    vec2 sc = mod(p.xz + vec2(0.0, 1.5), 3.0) - 1.5;
    float sh = exp(-dot(sc, sc) * 0.55);
    vec3 Ls = normalize(vec3(-sc.x, 1.6, -sc.y));
    vec3 Lk = normalize(vec3(0.3, 0.8, -0.3));
    vec3 lc = mix(vec3(0.9, 0.85, 1.0), cB, 0.4);
    float rough = mix(0.15, 0.85, rust);
    float strip = smoothstep(0.1 + rough * 0.3, 0.0, abs(r.y - 0.45)) + smoothstep(0.06 + rough * 0.3, 0.0, abs(r.x + 0.6)) * 0.6;
    vec3 env = mix(vec3(0.004), vec3(0.06, 0.055, 0.065), smoothstep(-0.2, 0.8, r.y)) + vec3(0.9, 0.88, 0.95) * strip * (0.9 + kick * 1.6) * (1.0 - rust * 0.7) + RED * smoothstep(0.3, 0.0, abs(r.y + 0.2)) * 0.4 * (0.4 + bA.y);
    vec3 iron = vec3(0.045, 0.043, 0.048), rustc = mix(vec3(0.22, 0.08, 0.03), cA * 0.25, 0.25) * (0.7 + 0.5 * vn(rp * 2.0));
    vec3 alb = mix(iron, rustc, rust);
    float dif = max(0.0, dot(n, Ls)) * sh, dif2 = max(0.0, dot(n, Lk)) * 0.25;
    vec3 metal = env * mix(vec3(1.0), alb * 3.0, rust) * (0.7 + 0.3 * fre);
    o = metal * ao + alb * lc * (dif * 3.0 * (0.8 + bA.y * 0.6 + kick * 0.8) + dif2) * ao;
    float sp = pow(max(0.0, dot(r, Ls)), mix(60.0, 8.0, rough)) * sh * 1.6 + pow(max(0.0, dot(r, Lk)), mix(40.0, 6.0, rough)) * 0.6;
    o += lc * sp * (1.0 - rust * 0.8) * (0.8 + bB.y * 1.2 + hit.z * 0.8) * ao;
    o += lc * step(0.97, hash(floor(rp * 9.0) + floor(t * 12.0))) * hit.z * (1.0 - rust) * fre * 1.5 * ao * near;
    if (li == -1.0) { float st = step(0.5, fract(atan(p.z, p.x) * 12.0)) * 0.3; o = vec3(0.012, 0.009, 0.01) * (0.6 + dif * 3.0) + vec3(0.25) * pow(max(0.0, dot(r, Ls)), 12.0) * sh * 0.4 + RED * fre * 0.05 + st * 0.004; }
    if (li == -2.0) o += vec3(1.0) * pow(max(0.0, dot(r, Ls)), 90.0) * sh * 2.0;
    o += RED * pow(fre, 2.5) * (0.12 + kick * 0.9 + bA.y * 0.35) * ao;
    o += vec3(0.9, 0.9, 1.0) * hit.y * step(0.5, fract(t * 30.0)) * max(0.0, dot(n, normalize(vec3(-1.0, 0.2, 0.0)))) * 0.25;
    float fog = 1.0 - exp(-d * 0.11);
    o = mix(o, fogc, fog);
  }
  vec3 shc = vec3(0.85, 0.85, 0.95);
  o += shc * shaft * (0.025 + bA.y * 0.03 + kick * 0.05);
  for (int k = 0; k < 2; k++) { float fk = float(k); vec2 g = (q + vec2(sin(t * 0.13 + fk * 2.0) * 0.06 + t * 0.008, -t * (0.012 + fk * 0.01))) * (60.0 + fk * 50.0); vec2 gi = floor(g);
    float m = step(0.982, hash(gi + fk * 3.0)) * smoothstep(0.25, 0.0, length(fract(g) - 0.5 + (vec2(hash(gi + 1.0), hash(gi + 2.0)) - 0.5) * 0.5));
    o += shc * m * min(shaft * 3.0, 1.0) * (0.08 + 0.2 * bB.z) * (1.0 - fk * 0.4); }
  for (int k = 0; k < 2; k++) { float fk = float(k); vec2 g = (q + vec2(sin(t * 0.2 + fk) * 0.1, t * (0.3 + fk * 0.15))) * (40.0 + fk * 30.0); vec2 gi = floor(g);
    vec2 f = fract(g) - 0.5 + vec2(hash(gi + 9.0) - 0.5, 0.0) * 0.6;
    float tail = smoothstep(0.12, 0.0, abs(f.x)) * smoothstep(0.45, 0.0, f.y) * step(0.0, f.y);
    float core = smoothstep(0.18, 0.0, length(f * vec2(1.0, 0.6)));
    o += mix(vec3(1.0, 0.65, 0.25), cA, 0.3) * step(0.992, hash(gi + fk * 7.0)) * (core + tail * 0.35) * (0.15 + kick * 1.4); }
  gl_FragColor = vec4(post(o), 1.0);
}`;
    const MIRROR = HEAD + `
float cl3(vec3 p){ return nz3(p) * 0.55 + nz3(p * 2.03 + 7.1) * 0.3 + nz3(p * 4.1 + 3.3) * 0.15; }
vec3 sky(vec3 rd, vec3 L){
  float h = rd.y, sun = max(dot(rd, L), 0.0);
  vec3 top = mix(vec3(0.11, 0.1, 0.3), cB * 0.3, 0.25), mid = mix(vec3(0.62, 0.4, 0.72), cA * 0.5 + 0.3, 0.2), low = vec3(1.0, 0.72, 0.7);
  vec3 o = mix(low, mid, smoothstep(-0.02, 0.12, h)); o = mix(o, top, smoothstep(0.1, 0.55, h));
  o += vec3(1.0, 0.94, 0.88) * (pow(sun, 8.0) * 0.22 + pow(sun, 40.0) * 0.45 + pow(sun, 900.0) * 1.2) * (0.85 + hit.w * 0.4 + kick * 0.2);
  o += vec3(0.9, 0.85, 1.0) * exp(-pow((acos(min(sun, 1.0)) - 0.2) * 40.0, 2.0)) * 0.06;
  return o;
}
void main(){
  vec2 q = (uv - 0.5) * vec2(asp, 1.0);
  float z = trav * 0.35 + t * 0.05;
  vec3 ro = vec3(sin(t * 0.05) * 0.6, 0.15 + sin(t * 0.07) * 0.08 + bA.y * 0.03, z);
  vec3 rd = normalize(vec3(q.x, q.y + 0.2, 1.25 - bA.x * 0.03)); rd.xy *= rot(sin(t * 0.04) * 0.06);
  vec3 L = normalize(vec3(0.32, 0.07, 1.0));
  vec3 o = sky(rd, L);
  if (rd.y > 0.0) { vec2 wp = rd.xz / (rd.y + 0.08) * 0.6 + vec2(t * 0.01, z * 0.05); float w = smoothstep(0.45, 0.9, fb2(wp * 1.4)) * smoothstep(0.0, 0.25, rd.y) * exp(-rd.y * 2.5);
    o = mix(o, mix(vec3(1.0, 0.85, 0.9), o * 1.6, 0.4), w * 0.45); }
  float T = 1.0; vec3 acc = vec3(0.0);
  if (rd.y < 0.06) {
    float y0 = -0.35, y1 = -1.3, ta = (y0 - ro.y) / min(rd.y, -0.001), tb = (y1 - ro.y) / min(rd.y, -0.001), stp = (tb - ta) / 26.0;
    float j = hash(uv * 311.0 + fract(t)) * stp;
    for (int i = 0; i < 26; i++) {
      vec3 p = ro + rd * (ta + j + stp * float(i));
      if (T < 0.04) break;
      float hgt = (p.y - y1) / (y0 - y1);
      float den = cl3(p * vec3(0.55, 0.9, 0.55) + vec3(t * 0.02, 0.0, 0.0)) - 0.38 - (1.0 - hgt) * 0.0 - hgt * hgt * 0.35;
      den = max(den, 0.0) * 2.2;
      if (den > 0.002) {
        float lit = clamp(cl3(p * vec3(0.55, 0.9, 0.55) + L * 0.35 + vec3(t * 0.02, 0.0, 0.0)) - 0.38, 0.0, 1.0);
        vec3 shadeC = mix(vec3(0.3, 0.25, 0.55), cB * 0.4 + 0.15, 0.25), litC = vec3(1.0, 0.86, 0.82);
        vec3 c = mix(litC, shadeC, clamp(lit * 2.6, 0.0, 1.0)) * (0.55 + hgt * 0.5);
        c += mix(vec3(1.0, 0.7, 0.8), cA * 0.6 + 0.4, 0.3) * (1.0 - hgt) * (bA.x * 0.35 + bA.y * 0.25 + kick * 0.25) * smoothstep(0.1, 0.5, den);
        float a = 1.0 - exp(-den * stp * 3.0);
        acc += T * a * c; T *= 1.0 - a;
      }
    }
    float far = smoothstep(0.0, 0.06, -rd.y);
    o = mix(o, o * T + acc, far * 0.97 + 0.03);
  }
  vec2 sp = vec2(L.x / L.z, (L.y - 0.05) / L.z) * 1.25, dq = q - sp;
  float ang = atan(dq.y, dq.x), rays = pow(fb2(vec2(ang * 5.0, t * 0.05)), 2.0) * exp(-length(dq) * 1.4);
  o += vec3(1.0, 0.95, 0.9) * rays * 0.22 * (0.7 + hit.w * 0.6 + bA.z * 0.4);
  for (int k = 0; k < 3; k++) {
    float fk = float(k), zc = 3.0 + fk * 2.6, tt = (zc - ro.z + floor(ro.z / 8.0) * 8.0);
    float b = k == 0 ? (bA.x + bA.y) * 0.5 : k == 1 ? (bA.z + bA.w) * 0.5 : (bB.x + bB.y + bB.z) / 3.0;
    vec2 vp = q * (1.0 + fk * 0.35) + vec2(t * (0.012 + fk * 0.006), 0.0);
    float base = -0.05 + fk * 0.1 + sin(vp.x * 1.6 + fk * 2.0 + t * 0.07) * 0.12 + sin(vp.x * 4.3 - t * 0.11) * 0.03 * (1.0 + b * 2.0);
    float dy = vp.y - base;
    float sheet = smoothstep(-0.02, 0.0, dy) * exp(-max(dy, 0.0) * (3.0 - b)) * smoothstep(0.55, 0.2, abs(vp.x + sin(t * 0.03 + fk) * 0.4));
    float folds = 0.55 + 0.45 * sin(vp.x * 22.0 + sin(vp.x * 5.0 + t * 0.2 + fk) * 3.0);
    vec3 film = 0.6 + 0.4 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + vp.x * 0.8 + dy * 2.0 + t * 0.02 + fk * 0.2));
    vec3 vc = mix(film, mix(cA, cB, 0.5 + 0.5 * sin(fk * 2.0)) * 0.5 + 0.5, 0.35);
    o += vc * sheet * folds * (0.05 + b * b * 0.3 + hit.w * 0.04) * (1.0 - fk * 0.2);
    o += vec3(1.0) * smoothstep(0.01, 0.0, abs(dy)) * smoothstep(0.55, 0.2, abs(vp.x + sin(t * 0.03 + fk) * 0.4)) * (0.04 + b * 0.25);
  }
  for (int k = 0; k < 3; k++) {
    float fk = float(k), sc = 2.2 + fk * 2.4;
    vec2 g = q * sc + vec2(sin(t * 0.07 + fk) * 0.3, -t * (0.04 + fk * 0.02)); vec2 gi = floor(g), gf = fract(g) - 0.5 - (vec2(hash(gi + fk), hash(gi + fk + 7.0)) - 0.5) * 0.5;
    float h = hash(gi + fk * 13.0); if (h < 0.55) continue;
    float r = 0.18 + 0.2 * hash(gi + 3.0), d = length(gf), disc = smoothstep(r, r * 0.86, d), rim = smoothstep(r * 0.7, r, d) * disc;
    vec3 bc = mix(vec3(1.0, 0.9, 0.95), 0.6 + 0.4 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + h * 3.0)), 0.5);
    o += bc * (disc * 0.05 + rim * 0.06) * (0.6 + bB.z * 1.2 + hit.z * 1.0 * step(0.75, h)) * (1.0 - fk * 0.25);
  }
  vec2 gg = q * 120.0 + vec2(t * 0.6, -t * 1.2); float gl = step(0.996, hash(floor(gg))) * smoothstep(0.4, 0.0, length(fract(gg) - 0.5));
  o += vec3(1.0, 0.97, 0.95) * gl * (0.3 + bB.z * 1.2);
  o = o * (0.92 + kick * 0.08 + hit.w * 0.06);
  o = o / (1.0 + o * 0.25);
  gl_FragColor = vec4(post(o), 1.0);
}`;
    const RUINS = HEAD + `
#define bass max(bA.x, bA.y)
#define mid ((bA.z + bA.w) * 0.5 + hit.y * 0.35)
#define high ((bB.y + bB.z) * 0.5 + hit.z * 0.45)
float box(vec3 p, vec3 b){ vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ return vn(p) * 0.55 + vn(p * 2.1 + 3.7) * 0.3 + vn(p * 4.3 + 9.1) * 0.15; }
float topH(vec2 cell){ float h0 = hash(cell); return 1.2 + h0 * 5.0 + fq(fract(h0 * 7.3)) * 0.8; }
float map(vec3 p, out vec2 cell, out float mat){
  cell = floor(p.xz / 3.0); vec2 l = mod(p.xz, 3.0) - 1.5; float h0 = hash(cell);
  float H = topH(cell), d = 1e3; mat = 0.0;
  if (abs(cell.x) > 0.5 && h0 > 0.15) {
    float y = p.y + 1.0, fl = floor(y / 0.9), ly = y - (fl + 0.5) * 0.9;
    float cut = y - H + 1.1 * hash(cell + 3.0) * (l.x + 1.2) + 0.12 * vn(l * 3.0 + cell * 7.0);
    float sl = box(vec3(l.x, ly + 0.3, l.y), vec3(0.98, 0.075, 0.98));
    vec2 hc = (vec2(hash(cell + fl), hash(cell - fl)) - 0.5) * 1.6; float hole = length(l - hc) - (0.2 + 0.35 * hash(cell + fl * 3.0)) + step(hash(cell + fl * 11.0), 0.7) * 2.0;
    sl = max(sl, -hole);
    sl = max(sl, ((fl + 0.5) * 0.9 - H + 1.1 * hash(cell + 3.0) * (l.x + 1.2) + 0.4 * vn(l * 2.5 + cell * 7.0 + fl)) * 0.5);
    vec2 cl = abs(l) - 0.9;
    float col = length(max(abs(cl) - 0.08, 0.0));
    col = max(col, ly - 0.45 + 0.6 * step(0.85, hash(cell + fl * 5.0 + floor(l * 0.6).x)));
    vec2 rg = abs(l) - 0.9; float rb = length(vec2(min(abs(rg.x), abs(rg.y)), max(abs(rg.x), abs(rg.y)) - 0.08) + vec2(sin(y * 7.0) * 0.015, 0.0)) - 0.012;
    rb = max(rb, max(-cut, cut - 0.35));
    float b = min(sl, max(col, cut)); b = max(b, -y);
    d = min(b, rb); mat = d == rb ? 2.0 : 1.0;
  }
  vec2 rl = mod(p.xz, 0.7) - 0.35; vec2 ri = floor(p.xz / 0.7);
  float rub = box(vec3(rl.x, p.y + 1.0, rl.y), vec3(0.08 + 0.1 * hash(ri), 0.04 + 0.08 * hash(ri + 1.0), 0.1)) - 0.01;
  if (hash(ri + 4.0) < 0.75 || abs(p.x - 1.5 - 3.0 * floor(p.x / 3.0)) < 0.4) rub = 1e3;
  if (rub < d) { d = rub; mat = 1.0; }
  float g = p.y + 1.0;
  if (g < d) { d = g; mat = 3.0; }
  return d;
}
float map(vec3 p){ vec2 c; float m; return map(p, c, m); }
const vec3 MDIR = vec3(-0.11686, 0.19477, 0.97386);
vec3 fireCol(){ return mix(vec3(1.0, 0.35, 0.1), cA, 0.2); }
vec3 flashDir(){ float a = (hash(vec2(floor(t * 4.0), 3.0)) - 0.5) * 1.6; return normalize(vec3(sin(a), 0.03, cos(a))); }
vec3 sky(vec3 rd, float flash){
  float h = max(rd.y, 0.0), az = atan(rd.x, rd.z);
  float hz = exp(-h * 7.0);
  vec3 o = mix(vec3(0.006, 0.005, 0.014), cB * 0.08 + vec3(0.04, 0.03, 0.045), hz);
  vec3 fireC = fireCol();
  float fl = 0.6 + 0.4 * vn(vec2(az * 12.0, t * 0.6));
  float hot = pow(vn(vec2(az * 34.0, t * 0.4)), 3.0) * 2.5;
  float hb = bandAt(clamp(az * 0.45 + 0.5, 0.0, 1.0));
  float fire = exp(-max(rd.y + 0.01, 0.0) * 28.0 / (0.55 + hb * 1.6)) * (fl + hot * exp(-h * 60.0)) * smoothstep(-0.05, 0.0, rd.y);
  o += fireC * fire * (0.2 + hb * 0.55);
  vec3 g = normalize(vec3(0.6, 0.55, 0.58)); float band = exp(-pow(dot(rd, g), 2.0) * 22.0);
  vec2 sp = vec2(atan(rd.z, rd.x), asin(clamp(rd.y, -1.0, 1.0))) * 160.0, id = floor(sp), f = fract(sp) - 0.5;
  float md = dot(rd, MDIR);
  float cl = smoothstep(0.45, 0.85, fbm(vec2(az * 4.0 + t * 0.01, h * 18.0 - t * 0.004))) * smoothstep(0.02, 0.12, h) * exp(-h * 3.0);
  float st = step(0.985 - band * 0.03, hash(id)) * smoothstep(0.35, 0.0, length(f)) * (0.6 + 0.4 * sin(t * 3.0 + hash(id + 1.0) * 40.0) * high) * smoothstep(0.02, 0.15, rd.y) * (1.0 - cl);
  float dust = vn(sp * 0.05) * band;
  o += vec3(0.9, 0.85, 1.0) * st * 1.4 + mix(cA, vec3(0.8, 0.75, 0.9), 0.6) * band * 0.12 * smoothstep(0.0, 0.2, rd.y) + vec3(0.5, 0.45, 0.6) * dust * 0.1;
  o += vec3(0.5, 0.48, 0.55) * cl * (0.03 + 0.25 * pow(max(md, 0.0), 30.0));
  o += vec3(0.7, 0.72, 0.85) * cl * hit.y * (0.25 + 0.5 * pow(max(dot(rd, normalize(vec3(sin(floor(t * 3.0) * 2.7), 0.2, 1.0))), 0.0), 6.0));
  for (int k = 0; k < 4; k++) { float fk = float(k), ak = (hash(vec2(fk, floor(t * 1.3))) - 0.5) * 1.8, ln = abs(az - ak - h * (0.3 + fk * 0.15));
    o += mix(vec3(1.0, 0.6, 0.2), cA, 0.3) * smoothstep(0.004, 0.0, ln) * step(fract(h * 30.0 - t * 14.0 + fk), 0.45) * smoothstep(0.3, 0.0, h) * (hit.z * 1.4 + bB.y * 0.3); }
  vec3 mx = normalize(cross(MDIR, vec3(0.0, 1.0, 0.0))), my = cross(mx, MDIR);
  vec2 ml = vec2(dot(rd, mx), dot(rd, my)) / 0.032;
  float disc = smoothstep(1.0, 0.93, length(ml));
  float mare = fbm(ml * 1.6 + 4.0);
  vec3 moon = vec3(0.95, 0.9, 0.82) * (0.62 + 0.38 * smoothstep(0.65, 0.35, mare)) * (1.0 - 0.3 * dot(ml, ml));
  o = mix(o, moon, disc * (1.0 - cl * 0.6));
  o += vec3(0.95, 0.9, 0.82) * (pow(max(md, 0.0), 300.0) * 0.35 + pow(max(md, 0.0), 12.0) * 0.06 + pow(max(md, 0.0), 2.0) * 0.012);
  float sx = az * 6.0 - h * 7.0;
  float plume = smoothstep(0.55, 0.85, vn(vec2(sx / (1.0 + h * 5.0), 2.3)));
  float billow = fbm(vec2(sx * 2.5, h * 14.0 - t * 0.12));
  float sm = plume * smoothstep(0.3, 0.75, billow) * smoothstep(0.0, 0.03, h) * exp(-h * 1.8);
  vec3 smc = vec3(0.016, 0.014, 0.017) + fireC * (0.03 + 0.12 * exp(-h * 10.0)) * fl + vec3(0.4, 0.38, 0.42) * pow(max(md, 0.0), 6.0) * 0.1 * billow;
  o = mix(o, smc, clamp(sm * 1.3, 0.0, 0.85));
  vec3 fd = flashDir(); float fa = max(dot(rd, fd), 0.0);
  o += mix(vec3(1.0, 0.75, 0.5), vec3(0.75, 0.8, 1.0), 0.5) * flash * (pow(fa, 400.0) * 1.2 + pow(fa, 16.0) * 0.4 * exp(-h * 5.0));
  return o;
}
float shadow(vec3 ro, vec3 rd){
  float r = 1.0, s = 0.05;
  for (int i = 0; i < 16; i++) { float h = map(ro + rd * s); r = min(r, 9.0 * h / s); s += clamp(h, 0.08, 0.8); if (r < 0.02 || s > 14.0) break; }
  return clamp(r, 0.0, 1.0);
}
void main(){
  vec2 q = (uv - 0.5) * vec2(asp, 1.0);
  vec3 ro = vec3(1.5 + sin(t * 0.13) * 0.4, -0.45 + sin(t * 0.09) * 0.12 + sin(t * 0.37) * 0.015 + bass * 0.04, trav * 2.0);
  vec3 rd = normalize(vec3(q.x, q.y + 0.14, 1.1)); rd.xz *= rot(sin(t * 0.07) * 0.3); rd.xy *= rot(sin(t * 0.05) * 0.04);
  float d = 0.0, mat = 0.0; vec2 cell; vec3 p; bool hitS = false; float it = 0.0;
  for (int i = 0; i < 96; i++) { p = ro + rd * d; float h = map(p, cell, mat); if (h < 0.0015 * (1.0 + d)) { hitS = true; break; } d += min(h * 0.72, 0.55); it += 1.0; if (d > 55.0) break; }
  vec3 fireC = fireCol();
  float flash = max(kick * kick, hit.y * 0.5);
  vec3 fd = flashDir(), mcol = vec3(0.95, 0.92, 1.0);
  float ffl = 0.75 + 0.25 * vn(vec2(t * 2.3, 1.0));
  vec3 skc = sky(rd, flash), o = skc;
  if (hitS) {
    vec2 e = vec2(0.003, 0.0);
    vec3 n = normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx)));
    float fog = 1.0 - exp(-d * 0.05);
    float ao = pow(1.0 - it / 96.0, 1.4) * (0.5 + 0.5 * clamp(map(p + n * 0.25) / 0.25, 0.0, 1.0));
    float near = exp(-d * 0.12);
    float sh = d < 30.0 ? shadow(p + n * 0.01, MDIR) : 1.0;
    if (mat == 3.0) {
      float pud = smoothstep(0.45, 0.6, vn(p.xz * 0.6));
      vec2 gc = floor(p.xz * 2.0), gf = fract(p.xz * 2.0) - 0.5; float ph = fract(t * 0.45 + hash(gc) * 7.0), rr = length(gf);
      float ring = sin((rr - ph * 0.45) * 70.0) * smoothstep(0.08, 0.0, abs(rr - ph * 0.45)) * (1.0 - ph) * step(0.6, hash(gc + 2.0));
      vec2 rn = gf / max(rr, 0.001) * ring * 0.06 * near;
      vec3 wn = normalize(vec3(sin(p.x * 9.0 + t * 2.0) * 0.01 * (0.3 + kick) + rn.x, 1.0, cos(p.z * 8.0 - t * 1.7) * 0.01 * (0.3 + kick) + rn.y));
      vec3 r = reflect(rd, wn);
      vec2 cc; float rmat; vec3 rp = p + r * 0.02; float rd2 = 0.0; bool rh = false;
      for (int k = 0; k < 30; k++) { float hh = map(rp + r * rd2, cc, rmat); if (hh < 0.005) { rh = true; break; } rd2 += min(hh * 0.9, 0.8); if (rd2 > 25.0) break; }
      vec3 refl = rh ? vec3(0.015, 0.014, 0.02) + fireC * 0.025 * ffl : sky(r, flash);
      float fre = 0.25 + 0.75 * pow(1.0 - max(0.0, -rd.y), 5.0);
      float grit = vn(p.xz * 4.0) * 0.5 + vn(p.xz * 17.0) * 0.5;
      vec3 grd = vec3(0.03, 0.028, 0.03) * (0.4 + 0.7 * grit) * (0.22 + max(0.0, dot(n, MDIR)) * 3.0 * sh);
      grd += fireC * 0.012 * ffl;
      float damp = smoothstep(0.3, 0.45, vn(p.xz * 0.6));
      vec3 gr = reflect(rd, normalize(n + vec3(grit - 0.5, 0.0, vn(p.xz * 9.0) - 0.5) * 0.06));
      grd += mcol * (pow(max(0.0, dot(gr, MDIR)), 14.0) * 0.35 + pow(max(0.0, dot(gr, MDIR)), 120.0) * 0.6) * (0.3 + 0.7 * damp) * sh;
      o = mix(grd * ao, refl * fre * 1.1, pud);
      o += mix(vec3(1.0, 0.8, 0.6), mcol, 0.5) * flash * 0.15 * (1.0 - pud);
    } else {
      vec2 tp = abs(n.y) > 0.5 ? p.xz : vec2(p.x + p.z, p.y);
      vec3 bump = vec3(vn(tp * 13.0), vn(tp * 13.0 + 5.3), vn(tp * 13.0 + 9.7)) - 0.5;
      n = normalize(n + bump * 0.35 * near);
      float moon = max(0.0, dot(n, MDIR)) * sh, stain = abs(n.y) > 0.5 ? vn(tp * 2.0) * 0.6 : vn(vec2(tp.x * 3.0, tp.y * 0.6));
      vec3 con = vec3(0.2, 0.19, 0.2) * (0.7 + 0.3 * vn(tp * 9.0)) * (1.0 - 0.4 * stain);
      con *= 0.85 + 0.3 * step(0.8, hash(floor(tp * 30.0))) * near;
      float y = p.y + 1.0, H = topH(cell);
      float burn = smoothstep(1.4, 0.0, H - y - 1.1 * hash(cell + 3.0) * (mod(p.x, 3.0) - 0.3) + 0.5 * vn(tp * 3.0));
      con *= 1.0 - burn * 0.75;
      if (mat == 2.0) con = vec3(0.12, 0.06, 0.04) * (0.7 + 0.6 * vn(tp * 20.0));
      float fireL = max(0.0, n.z * 0.8 - n.y * 0.2 + 0.2) * ffl;
      o = con * (0.16 + 0.06 * max(0.0, n.y + 0.5) + moon * 1.25 + 0.2 * max(0.0, n.y) - 0.12 * max(0.0, -n.y)) * ao;
      o += vec3(0.8, 0.8, 0.9) * pow(1.0 - max(0.0, dot(n, -rd)), 3.0) * max(0.0, dot(rd, MDIR)) * 0.14 * ao * (0.4 + 0.6 * sh);
      o += fireC * 0.035 * max(0.0, -n.y + 0.2) * ao + con * fireC * fireL * 0.35 * ao;
      o += mcol * pow(max(0.0, dot(reflect(rd, n), MDIR)), 16.0) * 0.06 * sh * (1.0 - burn);
      float emb = smoothstep(0.78, 0.95, vn(tp * 7.0 + vec2(0.0, t * 0.15))) * burn * near;
      o += mix(vec3(1.0, 0.3, 0.05), cA, 0.25) * emb * (0.2 + (bA.x + bA.y) * 0.9 + hit.x * 0.6 + 0.3 * sin(t * 3.0 + tp.x * 5.0));
      o += vec3(0.7, 0.75, 1.0) * flash * 0.35 * max(0.0, dot(n, fd) + 0.3) * ao;
      float fl = floor((p.y + 1.0) / 0.9), win = step(0.992, hash(cell * 3.1 + fl)) * step(abs(n.y), 0.2) * step(0.5, fract((p.x + p.z) * 1.5));
      float wb = bv(floor(hash(cell + 77.0) * 7.0)); o += mix(vec3(1.0, 0.7, 0.4), cA, 0.3) * win * (0.25 + wb * wb * 2.6 + hit.x * 0.4) * (1.3 + 0.1 * sin(t * 13.0) * sin(t * 7.3));
      o += mix(cA, cB, 0.5) * pow(1.0 - max(0.0, dot(n, -rd)), 4.0) * 0.08 * (1.0 + kick);
    }
    float md = max(dot(rd, MDIR), 0.0);
    vec3 fc = mix(vec3(0.03, 0.028, 0.04), fireC * 0.12, smoothstep(0.1, -0.05, rd.y + 0.02)) + cB * 0.01 + vec3(0.9, 0.85, 0.8) * pow(md, 10.0) * 0.1;
    fog = max(fog, (1.0 - exp(-d * 0.12)) * exp(-max(p.y + 1.0, 0.0) * 2.5) * 0.6);
    float bank = fbm(vec2(atan(rd.x, rd.z) * 9.0 + t * 0.03, rd.y * 24.0 - t * 0.02));
    fog = clamp(fog * (0.65 + 0.7 * bank), 0.0, 1.0);
    o = mix(o, fc * (0.8 + 0.4 * bank) + skc * 0.3, fog);
  }
  float gf = 0.75 + 0.25 * vn(vec2(q.x * 3.0 + t * 0.05, t * 0.1));
  o += mix(vec3(0.05, 0.045, 0.06), fireC * 0.15, 0.5) * exp(-abs(rd.y + 0.04) * 30.0) * 0.5 * gf;
  for (int k = 0; k < 3; k++) { float fk = float(k), sc = 30.0 + fk * 25.0; vec2 g = (q + vec2(t * 0.02 * (fk + 1.0) + sin(t * 0.3 + fk) * 0.05, t * (0.05 + fk * 0.02))) * sc; vec2 gi = floor(g);
    vec2 f = fract(g) - 0.5 + (hash(gi) - 0.5) * 0.4 + vec2(sin(t * 1.3 + hash(gi + 3.0) * 20.0) * 0.08, 0.0);
    o += vec3(0.75, 0.72, 0.7) * step(0.985, hash(gi + fk * 13.0)) * smoothstep(0.45 - fk * 0.1, 0.0, length(f)) * (0.3 - fk * 0.07) * (0.8 + 0.4 * max(0.0, dot(rd, MDIR))); }
  { vec2 g = (q + vec2(sin(t * 0.4 + q.y * 3.0) * 0.04 - t * 0.01, -t * 0.07)) * 45.0; vec2 gi = floor(g);
    float e = step(0.993 - kick * 0.004, hash(gi + 41.0)) * smoothstep(0.3, 0.0, length(fract(g) - 0.5)) * (0.5 + 0.5 * sin(t * 6.0 + hash(gi) * 30.0));
    o += mix(vec3(1.0, 0.45, 0.1), cA, 0.3) * e * (0.35 + kick * 0.6) * smoothstep(0.35, -0.2, q.y); }
  o += vec3(0.7, 0.75, 1.0) * flash * 0.05;
  gl_FragColor = vec4(post(o), 1.0);
}`;
    const COCOON = HEAD + `
#define bass max(bA.x, bA.y)
#define mid ((bA.z + bA.w) * 0.5 + hit.y * 0.35)
#define high ((bB.y + bB.z) * 0.5 + hit.z * 0.45)
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
void main(){
  vec2 q = (uv - 0.5) * vec2(asp, 1.0);
  vec3 ro = vec3(sin(t * 0.21) * 0.25, cos(t * 0.17) * 0.25, trav * 1.4), rd = normalize(vec3(q, 1.0 - bass * 0.06)); rd.xy *= rot(t * 0.06 + sin(t * 0.13) * 0.05);
  float Rw = 1.75 + bA.y * 0.25 - hit.x * 0.28;
  float A = dot(rd.xy, rd.xy), B = dot(ro.xy, rd.xy), C = dot(ro.xy, ro.xy) - Rw * Rw;
  float sw = min((-B + sqrt(max(B * B - A * C, 0.0))) / max(A, 1e-4), 40.0);
  float d = 0.0; vec3 col = vec3(0.0);
  for (int i = 0; i < 72; i++) {
    vec3 p = ro + rd * d; float best = 1e3, bk = 0.0, R = 1.2 + 0.12 * sin(p.z * 0.6 + t) + bA.y * 0.12 - hit.x * 0.2;
    for (int k = 0; k < 12; k++) {
      float fk = float(k), dir = mod(fk, 2.0) * 2.0 - 1.0, a = fk * 0.5236 + p.z * (0.45 + fk * 0.05) * dir + t * 0.05 * dir, b = bv(mod(fk, 7.0));
      vec2 c = vec2(cos(a), sin(a)) * (R + 0.08 * sin(fk * 3.0 + p.z) + b * 0.18 + sin(p.z * 9.0 - t * 25.0 + fk) * b * 0.035);
      float h = length(p.xy - c) - 0.016 - b * 0.03;
      if (h < best) { best = h; bk = fk; }
    }
    float puls = pow(0.5 + 0.5 * sin(p.z * 1.6 - t * (3.0 + bB.w * 4.0)), 8.0) * (0.3 + kick * 2.0), tb = bv(mod(bk, 7.0));
    float hb = max(best, 0.0);
    vec3 tc = mix(cA, cB, 0.5 + 0.5 * sin(p.z * 0.3 + t * 0.2 + bk * 0.7));
    col += tc * exp(-hb * 22.0) * 0.08 * exp(-d * 0.09) * (0.3 + puls + tb * tb * 2.4);
    float bead = pow(0.5 + 0.5 * sin(p.z * 7.0 + bk * 2.3 + sin(bk) * t * 0.3), 40.0);
    col += mix(vec3(1.0, 0.95, 0.98), tc, 0.25) * exp(-hb * 120.0) * 0.08 * exp(-d * 0.15) * (0.3 + bB.y * 0.6 + bead * (1.2 + hit.z * 5.0 + bB.z * 2.0 + puls));
    d += max(0.035, abs(best) * 0.6); if (d > min(22.0, sw)) break;
  }
  vec3 wp = ro + rd * sw; float th = atan(wp.y, wp.x), wz = wp.z;
  vec3 wn = -vec3(wp.xy / Rw, 0.0);
  float near = exp(-sw * 0.11);
  float warp = vn(vec2(wp.x * 1.3 + wz * 0.7, wp.y * 1.3 - wz * 0.45)) * 2.5;
  float f1 = pow(1.0 - abs(sin(th * 18.0 + wz * 2.6 + warp)), 5.0), f2 = pow(1.0 - abs(sin(th * 18.0 - wz * 3.1 + warp * 1.4 + 1.0)), 5.0);
  float f3 = pow(1.0 - abs(sin(th * 60.0 + wz * 8.0 + warp * 3.0)), 8.0) * near;
  float fib = mix(0.35, f1 + f2 * 0.8 + f3 * 0.6, smoothstep(0.02, 0.4, near));
  float thin = vn(vec2(wp.x * 1.8 + wz * 1.1, wp.y * 1.8 + wz * 0.35));
  float wpuls = pow(0.5 + 0.5 * sin(wz * 1.6 - t * (3.0 + bB.w * 4.0)), 8.0) * (0.3 + kick * 2.0);
  vec3 wc = mix(cA, cB, 0.5 + 0.5 * sin(wz * 0.3 + t * 0.2 + wp.x * 0.6));
  vec3 lp = vec3(0.0, 0.0, ro.z + 3.5 + sin(t * 0.3) * 0.5), lv = lp - wp; float ld = length(lv); lv /= ld;
  float lam = max(0.0, dot(wn, lv)) * 3.0 / (1.0 + ld * ld * 0.15);
  float sheen = pow(max(0.0, dot(reflect(rd, wn), lv)), 6.0) * fib;
  vec3 wall = wc * (0.03 + thin * thin * 0.22 * (0.3 + bA.x + bA.y)) * (0.5 + fib);
  wall += mix(wc, vec3(1.0), 0.4) * hit.y * smoothstep(0.55, 0.85, vn(vec2(th * 2.0 + floor(t * 4.0) * 3.3, wz * 0.5))) * 0.35;
  wall += mix(wc, vec3(1.0, 0.92, 0.85), 0.35) * (lam * (0.06 + fib * 0.1) + sheen * 0.12);
  wall *= 0.6 + wpuls * 1.1 + bA.w * 0.5;
  col += wall * 0.6 * exp(-sw * 0.13);
  col += mix(cB, cA, 0.5) * exp(-length(q) * 3.5) * (0.05 + bass * 0.12) + mix(mix(cB, cA, 0.5), vec3(1.0, 0.85, 0.7), 0.4) * exp(-length(q) * 2.0) * (0.02 + kick * 0.05);
  for (int k = 0; k < 2; k++) {
    float fk = float(k), sc = 30.0 + fk * 25.0;
    vec2 g = q * sc + vec2(t * (0.3 + fk * 0.2), sin(t * 0.25 + fk) * 2.0);
    vec2 gi = floor(g), gf = fract(g) - 0.5 - (vec2(hash(gi + 3.0 + fk), hash(gi + 6.0)) - 0.5) * 0.6;
    col += vec3(1.0, 0.96, 0.98) * step(0.95, hash(gi + fk * 11.0)) * smoothstep(0.14, 0.0, length(gf)) * (0.12 + high * 0.35);
  }
  gl_FragColor = vec4(post(col), 1.0);
}`;
    const TEETH = HEAD + `
#define bass max(bA.x, bA.y)
#define mid ((bA.z + bA.w) * 0.5 + hit.y * 0.35)
#define high ((bB.y + bB.z) * 0.5 + hit.z * 0.45)
float sw(float z){ return sin(z * 0.9 - t * 2.2) * 0.5 + 0.5; }
float h1(float n){ return fract(sin(n) * 43758.5453); }
float vn(vec3 x){
  x.z = mod(x.z, 64.0);
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); float n = i.x + i.y * 57.0 + i.z * 113.0;
  return mix(mix(mix(h1(n), h1(n + 1.0), f.x), mix(h1(n + 57.0), h1(n + 58.0), f.x), f.y), mix(mix(h1(n + 113.0), h1(n + 114.0), f.x), mix(h1(n + 170.0), h1(n + 171.0), f.x), f.y), f.z);
}
float camZ = 0.0;
float map(vec3 p, out float mat, out float tt){
  float z = mod(p.z, 1.1) - 0.55, ring = floor(p.z / 1.1);
  float gulp = pow(sw(p.z), 6.0) * (0.14 + bA.y * 0.2);
  float rel = ring - floor(camZ / 1.1), wave = (1.0 - hit.x) * 9.0, bite = exp(-pow(rel - wave, 2.0) * 0.7) * hit.x;
  float R = 1.6 - bite * 0.3 - gulp + bA.x * 0.06, N = 11.0 + floor(hash(vec2(ring, 7.0)) * 5.0), a = atan(p.y, p.x) + hash(vec2(ring, 1.0)) * 6.28, sa = 6.28318 / N;
  float ti = floor((a + 3.14159) / sa), ar = mod(a + sa * 0.5, sa) - sa * 0.5, r = length(p.xy);
  float hh = hash(vec2(ring, ti)), h2 = hash(vec2(ti, ring + 9.0));
  ar += (hh - 0.5) * sa * 0.35;
  vec2 lp = vec2(r * cos(ar), r * sin(ar));
  float L = (0.3 + 0.55 * hh * hh) * (h2 > 0.85 ? 0.45 : 1.0) + bite * 0.12;
  ar += sin(t * 70.0 + ti * 3.0 + ring) * 0.012 * hit.z;
  tt = clamp((R - lp.x) / L, 0.0, 1.0);
  float zz = z * 1.15 - tt * tt * 0.32 - (h2 - 0.5) * 0.12;
  bool snap = h2 > 0.85;
  float w = 0.1 + 0.05 * h2, rad = w * max(pow(1.0 - tt, 0.85), snap ? 0.55 : 0.0) * (1.0 + 0.22 * sin(tt * 3.14159));
  float tooth = (length(vec2(lp.y, zz * 1.25)) - rad) * 0.6;
  float tip = R - L - lp.x + (snap ? 0.025 * sin(lp.y * 70.0) * sin(zz * 55.0) : 0.0);
  tooth = max(tooth, max(tip, lp.x - R - 0.3));
  float gum = R + 0.08 - r + 0.05 * sin(a * N) * cos(z * 5.7) + 0.06 * smoothstep(0.45, 0.0, abs(z)) * cos(ar / sa * 6.28) + 0.03 * sin(a * 23.0 + p.z * 4.0);
  float d = smin(tooth, gum, 0.06);
  mat = tooth < gum - 0.01 ? 1.0 : 2.0;
  for (int k = 0; k < 2; k++) { float fk = float(k), sz = mod(p.z + fk * 0.55, 1.1) - 0.55, sr = floor((p.z + fk * 0.55) / 1.1), sa2 = hash(vec2(sr, fk + 3.0)) * 6.28;
    vec2 dir = vec2(cos(sa2), sin(sa2)); float u = dot(p.xy, dir); vec2 off = p.xy - dir * u;
    float sag = (1.0 - (u / R) * (u / R)) * 0.35 * (0.6 + hash(vec2(sr, 5.0))), wob = sin(u * 3.0 + t * (3.0 + bA.w * 6.0) + sr) * 0.02 * (0.3 + bA.w * 1.2 + hit.y);
    float bead = 1.0 + 0.6 * smoothstep(0.7, 1.0, sin(u * 9.0 - t * 1.3 + sr * 3.0));
    float st = length(vec2(length(off + vec2(0.0, sag + wob)), sz)) - mix(0.012, 0.035, abs(u) / R) * bead;
    st = max(st, abs(u) - R + 0.1);
    if (hash(vec2(sr, fk + 11.0)) > 0.45 && st < d) { d = st; mat = 3.0; } }
  return d;
}
void main(){
  vec2 q = (uv - 0.5) * vec2(asp, 1.0);
  float shake = (hash(vec2(floor(t * 12.0), 3.0)) - 0.5) * 0.006 * (0.3 + kick);
  vec3 ro = vec3(sin(t * 0.17) * 0.2 + shake, cos(t * 0.13) * 0.2 - bass * 0.03, trav * 1.6), rd = normalize(vec3(q, 1.15 + kick * 0.06)); rd.xy *= rot(t * 0.04 + sin(t * 0.2) * 0.1);
  float d = 0.0, mat = 0.0, it = 0.0, tt = 0.0; vec3 p; bool hitS = false;
  camZ = ro.z;
  for (int i = 0; i < 100; i++) { p = ro + rd * d; float h = map(p, mat, tt); if (h < 0.002 * (1.0 + d * 0.4)) { hitS = true; break; } d += h * 0.6; it += 1.0; if (d > 20.0) break; }
  float flick = 0.88 + 0.12 * step(0.12, hash(vec2(floor(t * 9.0), 1.0)));
  float breath = 0.35 + 0.65 * sw(trav * 1.6 + 8.0);
  vec3 deepC = mix(vec3(0.62, 0.03, 0.035), cA * 0.7, 0.28);
  vec3 deep = deepC * breath * (0.8 + kick * 1.0 + bA.x * 0.8 + bA.y * 0.3);
  float rq = length(q), ang = atan(q.y, q.x);
  float mist = vn(vec3(ang * 2.2 + 3.0, 1.0 / (rq + 0.15) * 1.5 - t * 1.2 - trav * 0.4, t * 0.15));
  vec3 haze = deep * (0.03 + 0.34 * exp(-rq * 3.2) + 0.3 * exp(-rq * 10.0)) * (0.7 + 0.6 * mist);
  vec3 o = haze;
  if (hitS) {
    float m2, t2;
    vec2 e = vec2(0.0025, -0.0025);
    vec3 n = normalize(e.xyy * map(p + e.xyy, m2, t2) + e.yyx * map(p + e.yyx, m2, t2) + e.yxy * map(p + e.yxy, m2, t2) + e.xxx * map(p + e.xxx, m2, t2));
    float ao1 = map(p + n * 0.05, m2, t2), ao2 = map(p + n * 0.16, m2, t2);
    float ao = clamp(1.0 - (0.05 - ao1) * 6.0 - (0.16 - ao2) * 2.6, 0.0, 1.0) * pow(1.0 - it / 160.0, 1.2);
    vec3 Lp = ro + vec3(0.25, 0.3, -0.2), l = normalize(Lp - p), V = -rd, hv = normalize(l + V), rf = reflect(rd, n);
    float fall = 1.0 / (1.0 + dot(Lp - p, Lp - p) * 0.22);
    vec3 Dp = vec3(0.0, 0.0, ro.z + 7.0), dl = normalize(Dp - p);
    float dfall = 1.0 / (1.0 + dot(Dp - p, Dp - p) * 0.035);
    float dif = max(0.0, dot(n, l)), ndv = max(0.0, dot(n, V)), fr = pow(1.0 - ndv, 4.0);
    float rim = max(0.0, dot(n, dl)) * dfall;
    float wet = smoothstep(0.35, 0.75, vn(p * vec3(5.0, 5.0, 3.0) + vec3(0.0, -t * 0.25, 0.0)));
    vec2 nc = vec2(atan(p.y, p.x) * 6.0, p.z * 7.0), ni = floor(nc), nf = fract(nc); nf = nf * nf * (3.0 - 2.0 * nf);
    float cell = mix(mix(hash(ni), hash(ni + vec2(1.0, 0.0)), nf.x), mix(hash(ni + vec2(0.0, 1.0)), hash(ni + vec2(1.0, 1.0)), nf.x), nf.y);
    if (mat == 1.0) {
      float grime = vn(p * 14.0);
      vec3 en = mix(vec3(0.93, 0.87, 0.7), vec3(0.6, 0.43, 0.18), smoothstep(0.65, 0.0, tt));
      en = mix(en, vec3(0.3, 0.17, 0.06), smoothstep(0.55, 0.85, grime) * smoothstep(0.75, 0.1, tt) * 0.7);
      en = mix(en, vec3(0.16, 0.09, 0.04), smoothstep(0.62, 0.8, cell) * smoothstep(0.8, 0.1, tt));
      float crack = smoothstep(0.015, 0.0, abs(cell - 0.5)) * 0.5;
      vec3 bn = normalize(n + (vec3(vn(p * 40.0), vn(p * 40.0 + 17.0), vn(p * 40.0 + 31.0)) - 0.5) * 0.35);
      float sp = pow(max(0.0, dot(bn, hv)), 60.0) * (0.6 + wet * 1.4), spw = pow(max(0.0, dot(bn, hv)), 12.0) * 0.12;
      float thin = smoothstep(0.35, 1.0, tt);
      vec3 sss = vec3(1.0, 0.55, 0.25) * thin * (pow(max(0.0, dot(rd, l)), 2.0) * 0.6 + 0.25) * fall + deepC * thin * rim * 1.4;
      o = en * (0.04 + dif * 1.1) * (1.0 - crack) * ao * fall + en * deepC * rim * 0.7 * ao + sss * en * 0.9;
      o += vec3(1.0, 0.96, 0.9) * (sp * 1.4 + spw) * fall * (1.0 - crack) + deepC * fr * 0.5 * rim * 3.0;
    } else if (mat == 2.0) {
      vec3 fl = mix(vec3(0.58, 0.06, 0.09), cA * 0.55, 0.22);
      float vein = smoothstep(0.035, 0.0, abs(sin(p.z * 6.0 + sin(p.x * 5.0) * 2.0 + sin(p.y * 7.0)))) * 0.65;
      vein += smoothstep(0.04, 0.0, abs(vn(p * vec3(3.0, 3.0, 8.0)) - 0.5)) * 0.35;
      fl = mix(fl, vec3(0.13, 0.0, 0.05), clamp(vein, 0.0, 0.8));
      fl = mix(fl, mix(vec3(0.2, 0.01, 0.06), cB * 0.25, 0.25), (1.0 - ao) * 0.6);
      float wrap = clamp((dot(n, l) + 0.45) / 1.45, 0.0, 1.0);
      vec3 scat = vec3(0.75, 0.06, 0.05) * smoothstep(0.0, 0.5, wrap) * (1.0 - dif) * 0.6;
      float wn = mix(70.0, 160.0, wet);
      vec3 bn = normalize(n + (vec3(vn(p * 22.0), vn(p * 22.0 + 7.0), vn(p * 22.0 + 13.0)) - 0.5) * 0.25);
      float sp = pow(max(0.0, dot(bn, hv)), wn) * (0.8 + wet * 2.6), spw = pow(max(0.0, dot(n, hv)), 14.0) * 0.18;
      o = (fl * wrap * 0.85 + scat + fl * 0.1 * (0.5 + bass)) * ao * fall + fl * rim * 0.8 * ao + fl * 0.15 * fr * (1.0 + kick);
      o += vec3(1.0, 0.86, 0.86) * sp * 1.6 * fall + vec3(1.0, 0.7, 0.7) * spw * fall * ao;
      o += deep * pow(max(0.0, dot(rf, dl)), 6.0) * wet * 0.8 * dfall * 4.0;
    } else {
      float sp = pow(max(0.0, dot(n, hv)), 90.0);
      o = vec3(0.85, 0.75, 0.75) * (0.12 + sp * (3.0 + high * 3.0) + fr * 0.9) * fall + deep * (0.3 + fr * 1.4) + deepC * rim * 0.8;
    }
    o *= flick;
    float fog = 1.0 - exp(-d * 0.14);
    o = mix(o, haze * 1.1 + deep * 0.04, fog);
  }
  vec2 dg = vec2(q.x * 26.0, q.y * 3.0 + t * 1.8); float dc = floor(dg.x), dr = hash(vec2(dc, 4.0));
  vec2 dfp = vec2(fract(dg.x) - 0.5, fract(dg.y + dr * 7.0) - 0.5);
  float drip = step(0.9, dr) * smoothstep(0.08, 0.0, length(dfp * vec2(1.0, 6.0))) * smoothstep(0.0, 0.25, rq);
  o += vec3(1.0, 0.85, 0.85) * drip * (0.25 + high * 0.6);
  gl_FragColor = vec4(post(o), 1.0);
}`;
    const WEB = HEAD + `
#define bass max(bA.x, bA.y)
#define mid ((bA.z + bA.w) * 0.5 + hit.y * 0.35)
#define high ((bB.y + bB.z) * 0.5 + hit.z * 0.45)
float vn2(vec2 x){ vec2 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
vec3 web(vec2 p, float k, float dz, vec2 ld, float blur){
  float sp = 13.0 + floor(hash(vec2(k, 1.0)) * 8.0), R = 1.1 + hash(vec2(k, 2.0)) * 0.9;
  mat2 m = rot(hash(vec2(k, 3.0)) * 6.28); p *= m; ld *= m;
  float r = length(p), a = atan(p.y, p.x), seg = 6.28318 / sp;
  float shv = sin(r * 9.0 - t * 14.0) * kick * 0.018 * exp(-r * 1.2);
  float sb = bandAt(abs(fract((a + 3.14159) / 6.28318 + 0.25) * 2.0 - 1.0));
  r += shv + sin(a * 2.0 + t * 0.6 + k) * 0.005 * r + sin(r * 16.0 - t * 22.0 + k) * 0.006 * sb * sb;
  float ai = floor(a / seg + 0.5), ad = a - ai * seg, w = (0.0018 + dz * 0.0011) * blur;
  float spoke = abs(sin(ad) * r);
  float moor = step(0.72, hash(vec2(ai, k + 20.0)));
  float pr = r * cos(ad) / cos(seg * 0.5) * (1.0 - 0.012 * (1.0 - cos(ad / seg * 6.28318)));
  float gap = 0.1 + hash(vec2(k, 4.0)) * 0.04, f = pr / gap - (a + 3.14159) / 6.28318, spi = abs(fract(f) - 0.5) * gap;
  float hub = smoothstep(0.18, 0.0, r) * 0.6;
  float inside = smoothstep(R, R - 0.15, r), core = step(0.16, r);
  vec2 rd2 = vec2(cos(a), sin(a));
  float aniS = 0.55 + 1.6 * pow(abs(dot(rd2, ld)), 8.0), aniK = 0.6 + 1.2 * pow(abs(rd2.x * ld.y - rd2.y * ld.x), 8.0);
  float fade = 1.0 / blur;
  float th = (exp(-spoke / w * 1.6) * 0.9 * aniK * mix(step(r, R + 0.4), smoothstep(R + 4.0, R, r), moor) * (0.35 + sb * sb * 2.4) + exp(-spi / w * 1.6) * core * inside * aniS * (0.5 + sb * 1.3)) * fade;
  th *= 1.0 + kick * 2.5 * exp(-abs(r - (1.0 - kick) * R * 1.3) * 7.0);
  float ring = floor(f), bead = fract(a * pr / (gap * 0.9) * 1.3 + hash(vec2(ring, k)) ), bs = hash(vec2(ring * 7.0 + floor(a * pr / (gap * 0.9) * 1.3), k));
  vec2 bp = vec2((bead - 0.5) * gap * 0.69, spi);
  float bsz = 0.004 + bs * 0.007 + dz * 0.0008;
  float drop = step(0.72 + (blur - 1.0) * 0.05, bs) * exp(-length(bp) / (bsz * sqrt(blur)) * 1.5) * core * inside * fade;
  float tw = 0.5 + 0.5 * sin(t * 6.0 + bs * 40.0 + k);
  drop *= (0.4 + 0.8 * tw * (0.3 + bB.z + hit.z)) * (0.4 + sb * 1.8);
  float spd = 0.0;
  if (hash(vec2(k, 13.0)) > 0.5) {
    vec2 sp2 = p * rot(hash(vec2(k, 14.0)) * 6.28);
    float s = 0.07 + hash(vec2(k, 15.0)) * 0.04;
    float body = length((sp2 - vec2(0.0, -s * 0.9)) * vec2(1.0, 0.75)) - s, head = length(sp2 - vec2(0.0, s * 0.55)) - s * 0.55;
    float bd = min(body, head);
    float lg = 1e3, sx = abs(sp2.x);
    for (int j = 0; j < 4; j++) { float fj = float(j), la = 0.35 + fj * 0.42 - 0.9 + kick * 0.15 * sin(fj * 2.0 + t * 20.0);
      vec2 knee = vec2(cos(la), sin(la)) * s * 2.6 + vec2(0.0, s * 0.8), foot = knee + vec2(s * 1.0, (fj - 1.5) * s * 1.2);
      vec2 pa = vec2(sx, sp2.y) - vec2(0.0, s * 0.2), ba = knee - vec2(0.0, s * 0.2); float hh = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); lg = min(lg, length(pa - ba * hh));
      pa = vec2(sx, sp2.y) - knee; ba = foot - knee; hh = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); lg = min(lg, length(pa - ba * hh)); }
    spd = max(smoothstep(w * 2.0, 0.0, bd), smoothstep(w * 2.5 + s * 0.06, 0.0, lg));
  }
  return vec3(th + hub * exp(-spi / w) * fade, drop, spd);
}
void main(){
  vec2 q = (uv - 0.5) * vec2(asp, 1.0);
  float cz = trav * 1.1;
  vec3 ro = vec3(sin(t * 0.13) * 0.35, cos(t * 0.11) * 0.25, cz), rd = normalize(vec3(q, 1.2)); rd.xy *= rot(sin(t * 0.07) * 0.15);
  vec2 lp = vec2(0.15, 0.12);
  vec3 moon = mix(mix(cA, cB, 0.5), vec3(0.55, 0.62, 0.8), 0.35);
  float lr = length(q - lp), la = atan(q.y - lp.y, q.x - lp.x);
  float shafts = vn2(vec2(la * 9.0, t * 0.08)) * vn2(vec2(la * 23.0 + 5.0, t * 0.05 + 3.0));
  shafts = smoothstep(0.15, 0.7, shafts) * exp(-lr * 0.9) * smoothstep(0.02, 0.3, lr);
  vec3 o = mix(vec3(0.004, 0.004, 0.008), moon * 0.07, exp(-lr * 2.5)) * (1.0 + bass * 0.6);
  o += moon * (0.12 * exp(-lr * 7.0) + shafts * 0.05) * (1.0 + bass * 0.5);
  float acc = 0.0, S = 2.6, T = 1.0; vec3 acol = vec3(0.0);
  for (int i = 0; i < 6; i++) {
    float k = floor(cz / S) + 1.0 + float(i), z = k * S + (hash(vec2(k, 9.0)) - 0.5) * 0.6, dz = z - ro.z;
    if (dz < 0.05) continue;
    vec3 P = ro + rd * (dz / rd.z);
    vec2 c = vec2((mod(k, 2.0) * 2.0 - 1.0) * (0.3 + hash(vec2(k, 5.0)) * 2.2), (hash(vec2(k, 6.0)) - 0.5) * 1.6);
    vec2 ld = normalize(vec2(lp.x * dz - c.x + ro.x, lp.y * dz - c.y + ro.y) + vec2(0.001));
    float blur = 1.0 + smoothstep(1.1, 0.3, dz) * 1.8;
    vec3 wv = web(P.xy - c, k, dz, ld, blur);
    float fog = exp(-dz * 0.28), near = smoothstep(0.35, 1.4, dz);
    vec3 col = mix(cA, cB, hash(vec2(k, 8.0))), silk = mix(vec3(0.85, 0.88, 0.95), col, 0.6);
    float tx = c.x + (c.x > 0.0 ? 1.0 : -1.0) * (2.0 + hash(vec2(k, 17.0)) * 1.4) + sin(P.y * 0.8 + k) * 0.12 + P.y * (hash(vec2(k, 19.0)) - 0.5) * 0.25;
    float tw = (0.07 + hash(vec2(k, 18.0)) * 0.09) * (1.0 + 0.25 * smoothstep(-0.3, -2.0, P.y));
    float bark = vn2(vec2(P.x * 26.0, P.y * 2.0 + k * 3.0));
    float tdx = (P.x - tx) / (tw * (1.0 + 0.1 * bark));
    float trunk = smoothstep(1.0, 0.8 - 0.15 * (1.0 - fog), abs(tdx)) * step(0.35, hash(vec2(k, 21.0)));
    float tlit = smoothstep(0.35, 0.9, tdx * sign(lp.x * dz - tx + ro.x)) * trunk;
    float mst = vn2(P.xy * 0.45 + vec2(t * 0.05 + k, t * 0.02)) * vn2(P.xy * 1.1 - vec2(t * 0.07, k));
    vec3 air = moon * mst * 0.05 * (0.6 + bass * 0.8) * fog * (0.4 + shafts * 2.0);
    vec3 bk = mix(vec3(0.006, 0.006, 0.012), moon * 0.05, 1.0 - fog);
    vec3 trc = bk * (0.5 + bark * 0.6) + moon * tlit * 0.3 * fog * (0.4 + bark) * (1.0 + shafts * 2.0);
    vec3 lyr = silk * wv.x * (0.45 + kick * 0.9 + hit.y * 0.5) + (vec3(1.0) * 1.2 + col * 1.0) * wv.y * (0.7 + kick * 0.6);
    float occ = max(trunk, wv.z * 0.92) * near;
    lyr = lyr * fog * (1.0 - acc) * (1.0 - occ) + air;
    lyr = mix(lyr, trc, trunk * near) + silk * 0.02 * fog * wv.z * near;
    acol += lyr * near * T;
    T *= 1.0 - occ;
    acc = min(0.9, acc + clamp(wv.x * 0.25 + wv.y, 0.0, 1.0) * fog * near * 0.5);
  }
  o = o * T + acol;
  vec2 g = uv * vec2(asp, 1.0) * 60.0 + vec2(t * 0.6, t * 1.1); float sp = step(0.985, hash(floor(g))) * smoothstep(0.35, 0.0, length(fract(g) - 0.5));
  vec2 g2 = uv * vec2(asp, 1.0) * 14.0 + vec2(t * 0.25, t * 0.4 + sin(t * 0.3)); float sp2 = step(0.975, hash(floor(g2) + 40.0)) * smoothstep(0.5, 0.0, length(fract(g2) - 0.5));
  o += mix(cB, vec3(1.0), 0.5) * (sp * (0.15 + high * 0.8) + sp2 * (0.04 + high * 0.15) * (0.5 + shafts * 4.0));
  gl_FragColor = vec4(post(o), 1.0);
}`;
    const WATCHERS = HEAD + `
#define bass max(bA.x, bA.y)
#define mid ((bA.z + bA.w) * 0.5 + hit.y * 0.35)
#define high ((bB.y + bB.z) * 0.5 + hit.z * 0.45)
const float TR = 1.55, CS = 0.62, BZ = 3.0;
vec3 cellOf(vec3 p){ float a = atan(p.y, p.x), ca = floor(a * TR / CS + 0.5), sh = mod(ca, 2.0) * 0.5, cz = floor(p.z / CS + 0.5 - sh) + sh; return vec3(ca, cz, a); }
vec3 camAt(vec3 cl){ float a = cl.x * CS / TR; return vec3(cos(a) * TR, sin(a) * TR, cl.y * CS); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float map(vec3 p, out float mat, out vec3 ec){
  float r = length(p.xy), a = atan(p.y, p.x);
  float seam = smoothstep(0.02, 0.0, abs(fract(p.z / 1.24) - 0.5) - 0.48) + smoothstep(0.015, 0.0, abs(fract(a * 6.0 / 6.28318) - 0.5) - 0.485);
  float wall = TR - r - seam * 0.015;
  vec3 cl = cellOf(p); ec = camAt(cl); vec3 n = vec3(-normalize(ec.xy), 0.0), q = p - ec;
  float ax = dot(q, n), lat = length(q - n * ax);
  float hous = max(lat - 0.12, abs(ax - 0.06) - 0.06), dome = length(q - n * 0.115) - 0.095;
  float d = min(wall, min(hous, dome));
  mat = d == wall ? 1.0 : d == hous ? 2.0 : 3.0;
  return d;
}
vec3 bulbAt(float k){ return vec3(0.0, TR - 0.16, k * BZ + BZ * 0.5); }
void main(){
  vec2 q = (uv - 0.5) * vec2(asp, 1.0);
  vec3 ro = vec3(sin(t * 0.21) * 0.3, cos(t * 0.17) * 0.25 - 0.05, trav * 1.3), rd = normalize(vec3(q, 1.25 + 0.04 * sin(t * 0.11))); rd.xy *= rot(sin(t * 0.05) * 0.4);
  float d = 0.0, mat = 0.0, it = 0.0; vec3 p, ec; bool hitS = false;
  for (int i = 0; i < 100; i++) { p = ro + rd * d; float h = map(p, mat, ec); if (h < 0.0015) { hitS = true; break; } d += h * 0.85; it += 1.0; if (d > 20.0) break; }
  vec3 o = vec3(0.0);
  float flick = (0.8 + 0.2 * step(0.08, hash(vec2(floor(t * 13.0), 2.0)))) * (1.0 - hit.y * 0.85 * step(0.3, hash(vec2(floor(t * 20.0), 5.0)))), scan = 0.0, zs = fract(t * 0.3) * 18.0;
  vec3 warm = vec3(1.0, 0.72, 0.42), cool = vec3(0.8, 0.9, 1.0);
  if (hitS) {
    float m2; vec3 e2; vec2 e = vec2(0.0015, 0.0);
    vec3 n = normalize(vec3(map(p + e.xyy, m2, e2) - map(p - e.xyy, m2, e2), map(p + e.yxy, m2, e2) - map(p - e.yxy, m2, e2), map(p + e.yyx, m2, e2) - map(p - e.yyx, m2, e2)));
    vec3 V = -rd; float ao = pow(1.0 - it / 100.0, 1.6), fall = 1.0 / (1.0 + d * d * 0.05);
    float a = atan(p.y, p.x); vec2 pu = vec2(a * TR, p.z);
    float bmp = vn(pu * 26.0), bmx = vn(pu * 26.0 + vec2(0.37, 0.0)), bmy = vn(pu * 26.0 + vec2(0.0, 0.37));
    vec3 tng = vec3(-sin(a), cos(a), 0.0);
    if (mat == 1.0) n = normalize(n + (tng * (bmx - bmp) + vec3(0.0, 0.0, 1.0) * (bmy - bmp)) * 0.35);
    vec3 sl = vec3(0.0, TR - 0.04, p.z) - p; float sd = length(sl); sl /= sd;
    vec3 lamp = cool * (0.28 + max(0.0, dot(n, sl)) * 1.3 / (1.0 + sd * sd * 0.5)) * flick;
    float bk = floor((p.z - BZ * 0.5) / BZ); vec3 bspec = vec3(0.0);
    for (int j = 0; j < 2; j++) { vec3 bl = bulbAt(bk + float(j)) - p; float bd = length(bl); bl /= bd;
      float att = 1.6 / (1.0 + bd * bd * 1.4);
      lamp += warm * att * (0.15 + max(0.0, dot(n, bl)));
      bspec += warm * att * pow(max(0.0, dot(reflect(rd, n), bl)), 30.0); }
    float scz = p.z - ro.z - zs;
    scan = exp(-pow(scz * 3.0, 2.0)) * kick * 1.5;
    float flr = smoothstep(-0.78, -0.9, p.y / TR);
    if (mat == 1.0) {
      vec2 pid = floor(vec2(p.z / 1.24, a * 6.0 / 6.28318)), pc = vec2(fract(p.z / 1.24) - 0.5, fract(a * 6.0 / 6.28318) - 0.5);
      float tone = 0.8 + 0.35 * hash(pid), stain = 0.7 + 0.3 * vn(pu * 2.0 + pid * 3.0), grit = 0.85 + 0.15 * bmp;
      float drip = smoothstep(0.35, 0.75, vn(vec2(pu.y * 9.0, pu.x * 0.7))) * smoothstep(0.5, -0.2, pc.y) * 0.4;
      vec3 conc = vec3(0.3, 0.305, 0.31) * tone * stain * grit * (1.0 - drip);
      if (hash(pid + 7.0) > 0.78) { float ch = step(0.5, fract((pc.x + pc.y) * 5.0)) * step(abs(pc.y), 0.08) * step(abs(pc.x), 0.4) * step(0.35, vn(pu * 18.0));
        conc = mix(conc, mix(vec3(0.75, 0.55, 0.12), cA, 0.25) * 0.8, ch * 0.7); }
      vec3 nn = vec3(-normalize(ec.xy), 0.0), ld = ec + nn * 0.12 + cross(nn, vec3(0.0, 0.0, 1.0)) * 0.09;
      float blink = step(0.5, fract(t * (0.5 + hash(ec.xz) * 0.8) + hash(ec.yz)));
      float shd = 1.0 - 0.6 * smoothstep(0.3, 0.12, length(p - ec)) * (0.5 + 0.5 * dot(normalize(p - ec), -sl));
      o = conc * lamp * ao * shd + vec3(1.0, 0.04, 0.03) * blink * 0.25 / (1.0 + pow(length(p - ld) * 14.0, 2.0)) + bspec * 0.15 * (1.0 - drip);
      vec3 rr = reflect(rd, vec3(0.0, 1.0, 0.0) * flr + n * (1.0 - flr) + vec3(bmx - bmp, 0.0, bmy - bmp) * 0.08);
      vec3 wet = bspec * 0.8 + cool * flick * pow(max(0.0, rr.y), 40.0) * 0.6 + vec3(1.0, 0.1, 0.08) * scan * 0.4;
      o = mix(o, o * 0.45 + wet, flr * (0.6 + 0.4 * vn(pu * 4.0)));
      o += cool * flick * smoothstep(0.9975, 0.9995, p.y / length(p.xy)) * 2.0;
    } else if (mat == 2.0) {
      float sp = pow(max(0.0, dot(reflect(rd, n), sl)), 24.0), rim = pow(1.0 - max(0.0, dot(n, V)), 3.0);
      o = vec3(0.22, 0.23, 0.25) * lamp * (0.4 + max(0.0, dot(n, V)) * 0.6) * ao + cool * sp * 0.5 * flick + bspec * 0.3 + mix(cB, cool, 0.4) * rim * 0.12;
      vec3 nn = vec3(-normalize(ec.xy), 0.0), ld = ec + nn * 0.12 + cross(nn, vec3(0.0, 0.0, 1.0)) * 0.09; float blink = step(0.5, fract(t * (0.5 + hash(ec.xz) * 0.8) + hash(ec.yz)));
      float led = length(p - ld); blink = max(blink * (0.5 + bB.y), hit.z * step(0.4, hash(ec.xz + floor(t * 16.0))));
      o += vec3(1.0, 0.05, 0.05) * (smoothstep(0.03, 0.0, led) * (0.4 + blink * 2.0 + kick) + blink * 0.15 / (1.0 + led * led * 900.0));
    } else {
      vec3 nn = vec3(-normalize(ec.xy), 0.0), look = normalize(ro - ec), c = ec + nn * 0.115, v = normalize(p - c);
      vec3 ax = normalize(mix(nn, look, 0.75)); float cs = dot(v, ax);
      vec3 tu = normalize(cross(ax, vec3(0.0, 0.0, 1.0) + nn * 0.001)), tv = cross(ax, tu); vec2 lp = vec2(dot(v, tu), dot(v, tv));
      float ang = atan(lp.y, lp.x), rr = length(lp), blades = 6.0, sector = cos(3.14159 / blades) / cos(mod(ang + t * 0.2, 6.28318 / blades) - 3.14159 / blades);
      float cb = bv(mod(floor(hash(ec.xz * 0.37 + ec.y) * 7.0), 7.0)), ap = 0.1 + cb * cb * 0.45 + kick * 0.08, open = step(rr * sector, ap) * step(0.0, cs);
      float bez = smoothstep(0.06, 0.0, abs(rr - 0.78)) * step(0.0, cs), edge = smoothstep(0.02, 0.0, abs(fract((ang + t * 0.2) / 6.28318 * blades) - 0.5) - 0.48) * step(ap, rr * sector) * step(rr, 0.75);
      float fl = 1.0 - max(0.0, dot(n, V));
      vec3 glass = vec3(0.015, 0.015, 0.02) + mix(cA, cB, 0.5 + 0.5 * lp.x) * (0.1 * smoothstep(0.8, 0.2, rr) + 0.25 * fl * fl);
      vec3 blade = vec3(0.05, 0.05, 0.055) * step(0.0, cs) + (vec3(0.35) + warm * 0.2) * edge * 0.45;
      float core = smoothstep(ap, 0.0, rr);
      o = mix(blade, vec3(0.0), open) + glass + vec3(0.5, 0.52, 0.55) * bez * lamp + vec3(1.0, 0.08, 0.06) * open * (core * (0.4 + cb * 1.6 + kick) + core * core * core * 1.5 * (0.4 + kick + cb));
      o += cool * pow(max(0.0, dot(reflect(rd, n), sl)), 60.0) * 1.2 * flick + bspec * (1.5 + high * 1.5) + cool * flick * 0.15 * fl;
    }
    o *= fall;
    o += vec3(1.0, 0.1, 0.1) * scan * 0.6 * fall * (0.6 + 0.4 * smoothstep(0.3, 0.0, abs(fract(p.z * 12.0) - 0.5) - 0.2));
  }
  float dh = min(d, 20.0);
  o = mix(o, vec3(0.025, 0.022, 0.02) * (1.0 + bass * 0.8), 1.0 - exp(-dh * 0.07));
  float b0 = floor((ro.z - BZ * 0.5) / BZ + 0.5);
  for (int j = 0; j < 4; j++) { vec3 c = bulbAt(b0 + float(j)) - ro; float s0 = dot(c, rd), h = max(length(c - rd * s0), 0.02);
    float gl = min((atan(dh - s0, h) - atan(-s0, h)) / h, 50.0);
    o += warm * gl * 0.012 * flick * (0.8 + bass * 0.6) / (1.0 + c.z * c.z * 0.02);
    float bs = smoothstep(0.05, 0.0, h) * step(s0, dh + 0.05) * step(0.0, s0); o += warm * bs * 2.5 * (0.8 + 0.2 * step(0.5, fract(atan(rd.x, rd.y) * 20.0 + float(j)))); }
  float ss = zs / max(rd.z, 0.01);
  if (ss < dh) { vec3 sp2 = ro + rd * ss; float rr2 = length(sp2.xy); o += vec3(1.0, 0.06, 0.05) * kick * (0.12 * exp(-pow((TR - rr2) * 6.0, 2.0)) + 0.04) * exp(-ss * 0.08); }
  for (int j = 0; j < 2; j++) { float fj = float(j), sc = 20.0 + fj * 14.0;
    vec2 g = (q + vec2(sin(t * 0.03 + fj) * 0.1, t * (0.01 + fj * 0.006))) * sc, gi = floor(g), gf = fract(g) - 0.5;
    vec2 off = (vec2(hash(gi + fj), hash(gi + 4.0 + fj)) - 0.5) * 0.7;
    o += warm * step(0.94, hash(gi + 11.0 + fj)) * smoothstep(0.08, 0.0, length(gf - off)) * (0.05 + 0.2 * high * hash(gi + floor(t * 5.0))); }
  gl_FragColor = vec4(post(o), 1.0);
}`;
    const TRIP = HEAD + `
#define bass max(bA.x, bA.y)
#define mid ((bA.z + bA.w) * 0.5 + hit.y * 0.35)
#define high ((bB.y + bB.z) * 0.5 + hit.z * 0.45)
uniform float o0, o1, o2, o3, o4, o5, o6, o7, o8, o9, o10, o11, o12, o13, o14, o15;
float WORLD, N, MELT, RB;
vec3 pal(float x, float k){
  if (k < 0.5) return mix(cA, cB, 0.5 + 0.5 * cos(6.28318 * x)) * (0.75 + 0.35 * cos(6.28318 * (x * 2.0 + 0.3)));
  if (k < 1.5) return 0.5 + 0.5 * cos(6.28318 * (x + vec3(0.0, 0.33, 0.67)));
  if (k < 2.5) return 0.5 + 0.5 * cos(6.28318 * (vec3(1.0, 1.0, 0.5) * x + vec3(0.8, 0.9, 0.3)));
  if (k < 3.5) { float f = fract(x) * 3.0; vec3 a = vec3(1.0, 0.1, 0.6), b = vec3(0.15, 0.35, 1.0), c = vec3(0.0, 1.0, 0.85);
    return f < 1.0 ? mix(a, b, smoothstep(0.0, 1.0, f)) : f < 2.0 ? mix(b, c, smoothstep(1.0, 2.0, f)) : mix(c, a, smoothstep(2.0, 3.0, f)); }
  float f = abs(fract(x * 0.5) * 2.0 - 1.0); return clamp(vec3(f * 3.0, f * 3.0 - 1.0, f * 3.0 - 2.0), 0.0, 1.0) + vec3(0.06, 0.0, 0.02);
}
float kifs(vec3 p, out float trap){
  p.z = mod(p.z, 5.0) - 2.5; float s = 1.0; trap = 1e3;
  for (int i = 0; i < 9; i++) { if (float(i) >= N) break;
    p = abs(p) - vec3(1.1, 0.75, 0.95) * (0.62 + 0.08 * RB);
    p.xy *= rot(0.55 + 0.1 * sin(t * 0.13)); p.xz *= rot(0.42 + 0.05 * cos(t * 0.1));
    p *= 1.32; s *= 1.32; trap = min(trap, dot(p, p)); }
  return (length(max(abs(p) - vec3(0.55, 0.35, 0.55), 0.0)) - 0.06) / s;
}
float gyro(vec3 p, out float trap){
  float g1 = abs(dot(sin(p * 1.1), cos(p.zxy * 1.1))) / 1.1 - 0.16;
  float g2 = abs(dot(sin(p * 3.3 + 1.0), cos(p.zxy * 3.3))) / 3.3;
  trap = g2 * 4.0 + 0.2 * sin(p.z * 0.3);
  return max(g1, -g2 + 0.04 * (N - 3.0) * 0.3) * 0.8 + (N - 3.0) * 0.004;
}
float apo(vec3 p, out float trap){
  p *= 0.45; float s = 1.0; trap = 1e3;
  for (int i = 0; i < 9; i++) { if (float(i) >= N) break;
    p = -1.0 + 2.0 * fract(0.5 * p + 0.5); float rr = dot(p, p); trap = min(trap, rr); float k = (1.12 + 0.06 * RB) / rr; p *= k; s *= k; }
  return 0.25 * abs(p.y) / s / 0.45;
}
float mbox(vec3 p, out float trap){
  p.z = mod(p.z, 6.0) - 3.0; vec3 c = p; float dr = 1.0, sc = -1.75 - 0.15 * sin(t * 0.07); trap = 1e3;
  for (int i = 0; i < 9; i++) { if (float(i) >= N) break;
    p = clamp(p, -1.0, 1.0) * 2.0 - p; float rr = dot(p, p);
    if (rr < 0.25) { p *= 4.0; dr *= 4.0; } else if (rr < 1.0) { p /= rr; dr /= rr; }
    p = p * sc + c; dr = dr * abs(sc) + 1.0; trap = min(trap, rr); }
  return length(p) / abs(dr);
}
float silk(vec3 p, out float trap){
  float d = 1e3, R = 1.15 + 0.1 * sin(p.z * 0.5 + t) + RB * 0.25; trap = 1e3;
  for (int k = 0; k < 10; k++) { if (float(k) >= N + 4.0) break; float fk = float(k), dir = mod(fk, 2.0) * 2.0 - 1.0, b = bv(mod(fk, 7.0));
    float a = fk * 0.6283 + p.z * (0.42 + fk * 0.04) * dir + t * 0.06 * dir;
    vec2 c = vec2(cos(a), sin(a)) * (R + 0.06 * sin(fk * 3.0 + p.z) + b * 0.15 + sin(p.z * 8.0 - t * 22.0 + fk) * b * 0.03);
    float h = length(p.xy - c) - 0.02 - b * 0.035; if (h < d) { d = h; trap = 0.3 + fk * 0.11 + b; } }
  return min(d, R + 0.5 - length(p.xy));
}
float crystal(vec3 p, out float trap){
  p.z = mod(p.z, 4.0) - 2.0; float s = 1.0; trap = 1e3;
  for (int i = 0; i < 9; i++) { if (float(i) >= N) break;
    p = abs(p); if (p.x < p.y) p.xy = p.yx; if (p.x < p.z) p.xz = p.zx; if (p.y < p.z) p.yz = p.zy;
    p.xy *= rot(0.12 + 0.05 * sin(t * 0.11)); p = p * 2.0 - vec3(1.0) * (1.0 + 0.12 * RB); s *= 2.0; trap = min(trap, dot(p, p)); }
  return (length(p) - 1.4) / s;
}
float map(vec3 p, out float trap){
  vec3 q = p;
  if (o6 > 0.5) p.x = abs(p.x);
  p += sin(p.yzx * 1.3 + t * 0.7) * MELT * 0.35 + sin(p.zxy * 2.9 - t * 0.5) * MELT * 0.12;
  float d;
  if (WORLD < 0.5) d = kifs(p, trap); else if (WORLD < 1.5) d = gyro(p, trap); else if (WORLD < 2.5) d = apo(p, trap); else if (WORLD < 3.5) d = mbox(p * 0.8, trap) / 0.8;
  else if (WORLD < 4.5) d = silk(p, trap); else d = crystal(p, trap);
  if (WORLD < 3.5 || WORLD > 4.5) d = max(d, 0.55 + 0.1 * sin(q.z * 0.4) - length(q.xy));
  return d / (1.0 + MELT * 0.6);
}
void main(){
  WORLD = floor(o0 + 0.5); N = 3.0 + floor(o1 * 5.0 + 0.5); MELT = o3;
  float spd = 0.2 + o4 * 2.2, glowK = o5, strobe = o7, pulse = 0.3 + o12 * 1.4;
  float rt = floor(o11 + 0.5);
  RB = rt < 0.5 ? (bA.y + bA.w + bB.y) / 3.0 : rt < 1.5 ? max(bA.x, bA.y) : rt < 2.5 ? (bA.z + bA.w) * 0.5 : rt < 3.5 ? (bB.y + bB.z) * 0.5 : hit.x * 0.6 + hit.y * 0.4;
  float kk = clamp(kick * pulse, 0.0, 1.5);
  vec2 q = (uv - 0.5) * vec2(asp, 1.0);
  float sy = floor(o14 + 0.5); if (sy > 0.5) { float nn = sy == 1.0 ? 3.0 : sy == 2.0 ? 4.0 : sy == 3.0 ? 6.0 : 8.0, sa = 6.28318 / nn, a = atan(q.y, q.x), r = length(q); a = abs(mod(a, sa) - sa * 0.5); q = vec2(cos(a), sin(a)) * r; }
  float z = trav * spd * 1.6;
  vec3 ro = vec3(sin(t * 0.11) * 0.12, cos(t * 0.09) * 0.12, z);
  vec3 rd = normalize(vec3(q, mix(0.55, 1.9, o9) - 0.3 * length(q) - 0.06 * RB));
  rd.xy *= rot(t * (0.05 + o8 * 0.7) + sin(t * 0.13) * 0.4); rd.xz *= rot(sin(t * 0.07) * 0.25); rd.yz *= rot(sin(t * 0.05) * 0.2);
  float d = 0.0, trap = 0.0, it = 0.0, glow = 0.0; vec3 p; bool hitS = false;
  for (int i = 0; i < 88; i++) { p = ro + rd * d; float h = map(p, trap); if (h < 0.0015 * (1.0 + d)) { hitS = true; break; } glow += exp(-h * 14.0) * 0.013; d += h * 0.85; it += 1.0; if (d > 28.0) break; }
  float k = floor(o2 + 0.5), hue = t * 0.02 + RB * 0.1 + o10;
  float flash = 1.0 + strobe * kk * kk * 2.5 * step(0.5, fract(t * 8.0));
  vec3 lc = vec3(sin(t * 0.3) * 0.15, cos(t * 0.23) * 0.15, z + 3.2 + 0.4 * sin(t * 0.17));
  vec3 lcol = pal(hue + 0.5, k) * (0.85 + kk * 0.9 + RB * 0.3) + 0.06;
  vec3 bg = pal(hue + q.y * 0.2, k) * 0.03 * (0.5 + 0.5 * mid);
  vec3 o = bg;
  if (hitS) {
    float t2; vec2 e = vec2(0.0015 * (1.0 + d), 0.0);
    vec3 n = normalize(vec3(map(p + e.xyy, t2) - map(p - e.xyy, t2), map(p + e.yxy, t2) - map(p - e.yxy, t2), map(p + e.yyx, t2) - map(p - e.yyx, t2)));
    float aoS = 1.0;
    for (int j = 1; j <= 3; j++) { float hj = 0.07 * float(j) * (1.0 + d * 0.04); aoS -= max(0.0, hj - map(p + n * hj, t2)) * 2.2 / float(j); }
    float ao = pow(1.0 - it / 88.0, 2.0) * (0.25 + 0.75 * clamp(aoS, 0.0, 1.0));
    vec3 L = normalize(vec3(0.4, 0.7, -0.5)), r = reflect(rd, n), Lo = lc - p; float ld = length(Lo); Lo /= ld;
    float latt = 2.5 / (1.0 + ld * ld * 0.8);
    float dif = max(0.0, dot(n, L)), back = max(0.0, dot(n, -rd)), key = max(0.0, dot(n, Lo)), fr = pow(1.0 - back, 3.0);
    float sp = pow(max(0.0, dot(r, L)), 30.0), spo = pow(max(0.0, dot(r, Lo)), 24.0 + 40.0 * fract(trap));
    vec3 col = pal(hue + log(1.0 + trap) * 0.6 + p.z * 0.04 + n.y * 0.12, k);
    float lamp = 1.0 / (1.0 + d * d * 0.05), cav = smoothstep(0.0, 0.6, ao);
    o = col * col * (0.015 + dif * 0.8 + back * lamp * 0.25) * ao + col * lcol * key * latt * 0.35 * ao + vec3(1.0) * sp * 0.5 * ao + lcol * spo * latt * 0.6 * ao;
    vec3 film = pal(hue + 0.35 + fr * 0.9 + dot(n, Lo) * 0.25, k);
    o += film * film * fr * 0.22 * (0.6 + bB.y) * ao * max(dif, key);
    o += pal(hue + 0.25, k) * smoothstep(0.03, 0.0, abs(fract(trap * 2.0 - t * 0.4) - 0.5) - 0.46) * (0.15 + kk * 0.9) * ao;
    vec3 gp = floor(p * 45.0); float gl = step(0.985, hash(gp.xy + gp.z * 7.13)) * smoothstep(0.2, 0.9, back);
    o += mix(col, vec3(1.0), 0.5) * gl * (bB.y + hit.z) * 1.6 * ao;
    o *= flash;
    vec3 fogc = bg + lcol * 0.05 * pow(max(0.0, dot(rd, normalize(lc - ro))), 6.0);
    o = mix(o, fogc, 1.0 - exp(-d * mix(0.025, 0.25, o13)));
  }
  float dm = hitS ? d : 28.0;
  vec3 c = lc - ro; float s0 = dot(c, rd), hh = max(length(c - rd * s0), 0.03);
  float sg = min((atan(dm - s0, hh) - atan(-s0, hh)) / hh, 40.0);
  o += lcol * sg * 0.007 * (0.6 + glowK * 0.5) * flash + lcol * smoothstep(0.09, 0.0, hh) * step(s0, dm) * 1.5;
  o += pal(hue + 0.6, k) * glow * glowK * (0.6 + RB * 0.8 + kk * 0.6) * flash;
  if (o15 > 0.5) o = max(vec3(0.0), vec3(0.9) - o * 0.9);
  gl_FragColor = vec4(post(o), 1.0);
}`;
    const POST = `precision mediump float;
varying vec2 uv;
uniform sampler2D scene, prev, b1, b2, fl; uniform float t, kick, trails, glitch, split, hue, kal, glow, grain, asp, flare, punch, scan, grade, flash; uniform vec2 res; uniform vec3 cA, cB;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec3 turn(vec3 c, float a){ const vec3 k = vec3(0.57735); float ca = cos(a); return c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca); }
float lum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
void main(){
  vec2 p = uv;
  if (scan > 0.01) { vec2 c = p - 0.5; p = 0.5 + c * (1.0 + dot(c, c) * scan * 0.18); }
  p = 0.5 + (p - 0.5) * (1.0 - punch * kick * 0.075); p += (vec2(hash(vec2(t, 1.3)), hash(vec2(t, 7.1))) - 0.5) * punch * kick * kick * 0.008;
  if (kal > 1.5) { vec2 c = (p - 0.5) * vec2(asp, 1.0); float r = length(c), a = atan(c.y, c.x), sg = 6.28318 / kal; a = mod(a + t * 0.05, sg); a = abs(a - sg * 0.5); c = r * vec2(cos(a), sin(a)); p = c / vec2(asp, 1.0) + 0.5; }
  float band = floor(p.y * 40.0), g = glitch * glitch * (0.1 + kick * 0.9);
  p.x += (hash(vec2(band, floor(t * 20.0))) - 0.5) * 0.05 * g * step(0.86, hash(vec2(band, floor(t * 12.0))));
  float blk = step(0.97, hash(vec2(floor(p.y * 6.0), floor(t * 6.0)))) * step(0.6, glitch) * step(0.6, kick);
  p.x += blk * (hash(vec2(floor(t * 6.0), 3.0)) - 0.5) * 0.12;
  vec2 dir = p - 0.5; float ca = split * (0.003 + kick * 0.008) + blk * 0.01;
  vec3 s = vec3(texture2D(scene, p + dir * ca).r, texture2D(scene, p).g, texture2D(scene, p - dir * ca).b);
  s += texture2D(b1, p).rgb * glow * 0.9 + texture2D(b2, p).rgb * glow * 1.5;
  vec3 tint = mix(cB, vec3(0.75, 0.85, 1.0), 0.45);
  s += texture2D(fl, vec2(p.x, p.y)).rgb * tint * flare * (0.9 + kick * 2.2) * 3.2;
  vec2 q = (uv - 0.5) * (0.988 - kick * 0.012); float a = 0.003 * trails; q = mat2(cos(a), -sin(a), sin(a), cos(a)) * q;
  vec3 pv = texture2D(prev, q + 0.5).rgb * trails * 0.94;
  vec3 o = max(s, pv);
  o = turn(o, hue * 6.28318);
  float L = lum(o);
  if (grade > 0.5 && grade < 1.5) o = mix(vec3(L), o, 0.45) * 1.15 + (o - 0.5) * 0.12;
  else if (grade > 1.5 && grade < 2.5) o = mix(o, mix(vec3(0.0, 0.35, 0.45) * L * 2.0, mix(cA, vec3(1.0, 0.4, 0.8), 0.5) * L * 1.6, smoothstep(0.1, 0.7, L)), 0.55);
  else if (grade > 2.5 && grade < 3.5) o = mix(o, vec3(0.25, 0.45, 1.0) * L * 1.3, 0.6) * smoothstep(0.0, 0.25, L + 0.05);
  else if (grade > 3.5 && grade < 4.5) o = mix(o, vec3(0.75, 0.9, 0.35) * L * 1.4 + vec3(0.02, 0.03, 0.0), 0.55);
  else if (grade > 4.5 && grade < 5.5) o = vec3(1.0, 0.12, 0.15) * pow(L, 0.85) * 1.6 + vec3(1.0) * pow(L, 4.0);
  else if (grade > 5.5) o = mix(vec3(L), vec3(0.85, 0.95, 1.0) * L, 0.6) * 1.2 + 0.03;
  o += flash * (0.35 + o * 0.6);
  o *= 1.15; o = clamp((o * (2.51 * o + 0.03)) / (o * (2.43 * o + 0.59) + 0.14), 0.0, 1.0);
  vec2 v = uv - 0.5; o *= 1.0 - dot(v, v) * 0.9;
  if (scan > 0.01) { o *= 1.0 - scan * 0.45 * (0.5 + 0.5 * cos(uv.y * res.y * 3.14159)); o *= 1.0 - scan * 0.12 * (0.5 + 0.5 * cos(uv.x * res.x * 2.0944)); }
  o += (hash(uv * 613.0 + fract(t * 7.0)) - 0.5) * grain * 0.12;
  gl_FragColor = vec4(o, 1.0);
}`;
    const BRIGHT = `precision mediump float; varying vec2 uv; uniform sampler2D src; uniform vec2 px; uniform float thr;
void main(){ vec3 c = (texture2D(src, uv + px * vec2(-0.5, -0.5)).rgb + texture2D(src, uv + px * vec2(0.5, -0.5)).rgb + texture2D(src, uv + px * vec2(-0.5, 0.5)).rgb + texture2D(src, uv + px * vec2(0.5, 0.5)).rgb) * 0.25;
  float l = max(c.r, max(c.g, c.b)), k = 0.25, sft = clamp(l - thr + k, 0.0, 2.0 * k); sft = sft * sft / (4.0 * k); gl_FragColor = vec4(c * max(sft, l - thr) / max(l, 0.0001), 1.0); }`;
    const BLUR = `precision mediump float; varying vec2 uv; uniform sampler2D src; uniform vec2 dir;
void main(){ vec3 c = texture2D(src, uv).rgb * 0.227; c += (texture2D(src, uv + dir * 1.384).rgb + texture2D(src, uv - dir * 1.384).rgb) * 0.316; c += (texture2D(src, uv + dir * 3.23).rgb + texture2D(src, uv - dir * 3.23).rgb) * 0.07; gl_FragColor = vec4(c, 1.0); }`;
    const BLIT = 'precision mediump float; varying vec2 uv; uniform sampler2D scene; void main(){ gl_FragColor = texture2D(scene, uv); }';
    // for the heavy stuff
    const HARDBITE = HEAD + `
const float PI = 3.14159;
float oct(vec2 q, float r){ q = abs(q); return max(max(q.x, q.y), (q.x + q.y) * 0.7071) - r; }
float map(vec3 p, out float m){
  float z = mod(p.z, 2.0) - 1.0;
  float o = oct(p.xy, 2.05);
  float gate = max(abs(o) - 0.22, abs(z) - 0.14);
  gate = max(gate, -max(abs(o + 0.2) - 0.03, abs(z) - 0.2));
  float wall = -oct(p.xy, 3.1), fl = p.y + 1.7;
  float d = min(wall, fl); m = fl < wall ? 3.0 : 2.0;
  if (gate < d) { d = gate; m = 1.0; }
  return d;
}
vec3 hot(){ return mix(vec3(1.0, 0.07, 0.1), cA, 0.3); }
float gateLight(float y, float cz){
  float u = clamp((y + 1.7) / 3.9, 0.0, 1.0), b = bandAt(u);
  float chase = smoothstep(0.75, 1.0, fract(cz * 0.125 - t * 1.6)) * hit.z;
  return b * b * 2.2 + chase * 1.5 + hit.x * 1.4;
}
void main(){
  vec2 q = (uv - 0.5) * vec2(asp, 1.0);
  vec3 ro = vec3(0.25 * sin(t * 0.23), -0.35 + 0.1 * sin(t * 0.31), trav * 2.4 + hit.x * 0.35);
  vec3 rd = normalize(vec3(q.x, q.y + 0.04, 1.15));
  rd.xy *= rot(0.05 * sin(t * 0.17) + hit.y * 0.05 * sin(t * 37.0));
  float d = 0.0, m = 0.0, haze = 0.0; bool hit2 = false; vec3 p;
  for (int i = 0; i < 80; i++) {
    p = ro + rd * d; float h = map(p, m);
    float cz = floor(p.z / 2.0), z = mod(p.z, 2.0) - 1.0, ed = abs(oct(p.xy, 1.83));
    haze += exp(-ed * 6.0 - abs(z) * 3.0) * gateLight(p.y, cz) * min(h, 0.4) * 0.12;
    if (h < 0.002) { hit2 = true; break; }
    d += h * 0.85; if (d > 46.0) break;
  }
  vec3 H = hot(), W = vec3(1.0, 0.92, 0.86), o = vec3(0.0);
  if (hit2) {
    float m2; vec2 e = vec2(0.002, 0.0);
    vec3 n = normalize(vec3(map(p + e.xyy, m2) - map(p - e.xyy, m2), map(p + e.yxy, m2) - map(p - e.yxy, m2), map(p + e.yyx, m2) - map(p - e.yyx, m2)));
    float cz = floor(p.z / 2.0), z = mod(p.z, 2.0) - 1.0, gl = gateLight(p.y, cz);
    if (m == 1.0) {
      float slot = smoothstep(0.05, 0.015, abs(oct(p.xy, 1.85))) * smoothstep(0.2, 0.12, abs(z));
      float cells = step(0.28, fract(atan(p.y, p.x) * 18.0 / PI));
      vec3 steel = vec3(0.03, 0.03, 0.035) * (0.4 + 0.6 * max(0.0, dot(n, normalize(vec3(0.2, 0.8, -0.5))))) + H * 0.04 * gl * (0.5 + 0.5 * n.z * n.z);
      o = steel + H * slot * cells * gl * 1.6 + W * slot * cells * hit.x * 1.4;
      o += mix(vec3(0.3), H, 0.5) * pow(max(0.0, dot(reflect(rd, n), vec3(0.0, 0.0, -1.0))), 40.0) * (0.08 + bB.y * 0.3);
    } else {
      float near = exp(-abs(z) * 1.6) * gl * 0.25 + exp(-(2.0 - abs(z)) * 1.6) * gateLight(p.y, cz + sign(z)) * 0.25;
      float panel = 0.6 + 0.4 * step(0.06, fract(p.z * 1.0)) * step(0.06, fract(p.y * 0.7 + 0.5));
      vec3 base = m == 3.0 ? vec3(0.03, 0.03, 0.035) : vec3(0.04, 0.035, 0.04) * panel;
      o = base * (0.3 + near * 2.2) + H * near * 0.12;
      if (m == 3.0) {
        vec3 r = reflect(rd, n); float rr = 0.0; vec3 rp = p + n * 0.01; float rm;
        for (int k = 0; k < 28; k++) { float hh = map(rp + r * rr, rm); if (hh < 0.004) break; rr += hh; if (rr > 12.0) break; }
        vec3 rpp = rp + r * rr; float rz = floor(rpp.z / 2.0), rzz = mod(rpp.z, 2.0) - 1.0;
        float rslot = smoothstep(0.08, 0.0, abs(oct(rpp.xy, 1.85))) * smoothstep(0.25, 0.1, abs(rzz));
        float grate = 0.55 + 0.45 * step(0.1, fract(p.x * 4.0)) * step(0.1, fract(p.z * 4.0));
        o += (H * gateLight(rpp.y, rz) + W * hit.x) * rslot * 0.55 * grate * exp(-rr * 0.12);
      }
    }
    o *= exp(-d * 0.055);
  }
  o += H * haze * 0.75 * (1.0 - hit.x * 0.35) + W * haze * hit.x * 0.2;
  vec3 src = vec3(0.0, 1.6, ro.z + 34.0);
  for (int k = 0; k < 6; k++) {
    float fk = float(k), sw = sin(t * (0.6 + bA.w * 0.8) + fk * 1.3) * (0.25 + bB.x * 0.4);
    vec3 u = normalize(vec3((fk - 2.5) * 0.11 + sw, -0.06 - 0.03 * fk + 0.05 * sin(t * 0.4 + fk), -1.0));
    float tr, dl = rayLine(ro, rd, src, u, tr);
    float on = 0.35 + bB.y * 0.9 + hit.z * 0.8 * step(0.5, fract(t * 21.0 + fk * 0.37));
    float beam = exp(-dl * 90.0) * 0.9 + exp(-dl * 14.0) * 0.12;
    o += mix(H, W, 0.3 + 0.3 * exp(-dl * 200.0)) * beam * step(0.0, tr) * on * exp(-tr * 0.02);
  }
  o += W * hit.x * hit.x * 0.08 + H * bA.x * 0.04;
  gl_FragColor = vec4(post(o), 1.0);
}`;
    const ACID = HEAD + `
float link(vec3 p, float flip){ p.xz = flip > 0.5 ? p.zx : p.xz; vec2 q = vec2(length(vec2(p.x, max(abs(p.y) - 0.05, 0.0))) - 0.06, p.z); return length(q) - 0.018; }
float map(vec3 p, out float m){
  float fl = p.y + 1.2, ce = 1.7 - p.y;
  vec2 c = mod(p.xz, 4.0) - 2.0;
  float col = sdb(vec3(c.x, p.y, c.y), vec3(0.32, 4.0, 0.32)) - 0.02;
  float pipe = length(vec2(abs(p.x) - 1.3, p.y - 1.5)) - 0.09;
  vec3 cp = vec3(abs(p.x) - 1.3, p.y, mod(p.z + 0.7, 1.4) - 0.7);
  cp.x += sin(t * 1.3 + floor((p.z + 0.7) / 1.4)) * 0.03 * (cp.y - 1.4) * (1.0 + hit.x * 2.0);
  float len = 0.9 + 0.5 * hash(vec2(floor((p.z + 0.7) / 1.4), sign(p.x)));
  float yy = clamp(cp.y, 1.4 - len, 1.4), seg = floor(yy / 0.16);
  float ch = link(vec3(cp.x, mod(cp.y, 0.16) - 0.08, cp.z), mod(seg, 2.0));
  ch = max(ch, max(cp.y - 1.45, 1.4 - len - cp.y));
  float d = min(fl, ce); m = fl < ce ? 0.0 : 1.0;
  if (col < d) { d = col; m = 2.0; } if (pipe < d) { d = pipe; m = 3.0; } if (ch < d) { d = ch; m = 4.0; }
  return d;
}
vec3 GR(){ return mix(vec3(0.25, 1.0, 0.12), cB, 0.15); }
vec3 RD(){ return mix(vec3(0.75, 0.0, 0.05), cA, 0.2); }
vec3 beams(vec3 ro, vec3 rd, float far){
  vec3 g = vec3(0.0); vec3 src = vec3(0.0, 1.3, ro.z + 16.0);
  float sq = bA.z * 0.5 + bA.w + bB.x * 0.6;
  for (int k = 0; k < 7; k++) {
    float fk = float(k), ang = (fk - 3.0) * 0.16 + sin(t * (0.5 + sq * 1.4) + fk * 0.9) * (0.15 + sq * 0.35);
    vec3 u = normalize(vec3(sin(ang), -0.12 - 0.05 * sin(t * 0.7 + fk * 2.0) - bA.y * 0.05, -cos(ang)));
    float tr, dl = rayLine(ro, rd, src, u, tr);
    float on = step(fk, 2.0 + sq * 5.0) * (0.5 + 0.5 * step(0.35, fract(t * 17.0 + fk * 0.61)) * hit.z + 0.5 * (1.0 - hit.z));
    g += GR() * (exp(-dl * 110.0) + exp(-dl * 18.0) * 0.1) * on * step(0.0, tr) * step(tr, far);
  }
  return g;
}
void main(){
  vec2 q = (uv - 0.5) * vec2(asp, 1.0);
  vec3 ro = vec3(0.35 * sin(t * 0.11), -0.15 + 0.05 * sin(t * 0.37), trav * 0.9);
  vec3 rd = normalize(vec3(q.x, q.y - 0.02, 1.05));
  rd.xz *= rot(0.12 * sin(t * 0.09));
  float d = 0.0, m = 0.0; bool hit2 = false; vec3 p;
  float rh = 0.0;
  for (int i = 0; i < 90; i++) { p = ro + rd * d; float h = map(p, m);
    vec2 cc = floor(p.xz / 4.0) * 4.0 + 2.0; float dl = length(p - vec3(cc.x - sign(cc.x) * 0.5, 1.0, cc.y)); rh += exp(-dl * 1.6) * min(h, 0.5);
    if (h < 0.002) { hit2 = true; break; } d += h * 0.85; if (d > 26.0) break; }
  vec3 G = GR(), R = RD(), o = vec3(0.0);
  float strobe = hit.x * step(0.45, fract(t * 15.0)), far = hit2 ? d : 40.0;
  if (hit2) {
    float m2; vec2 e = vec2(0.002, 0.0);
    vec3 n = normalize(vec3(map(p + e.xyy, m2) - map(p - e.xyy, m2), map(p + e.yxy, m2) - map(p - e.yxy, m2), map(p + e.yyx, m2) - map(p - e.yyx, m2)));
    vec2 cc = floor(p.xz / 4.0) * 4.0 + 2.0; vec3 Lc = vec3(cc.x - sign(cc.x) * 0.5, 1.0, cc.y) - p;
    float lr = max(0.0, dot(n, normalize(Lc))) / (1.0 + dot(Lc, Lc) * 0.4) * (0.6 + bA.y * 1.4);
    float lg = (0.15 + bA.w * 0.6) * (0.5 + 0.5 * n.y) * exp(-abs(p.x) * 0.3);
    vec3 base = m == 0.0 ? vec3(0.035) : m == 2.0 ? vec3(0.09, 0.085, 0.08) * (0.6 + 0.6 * fb2(p.zy * 5.0)) : m == 4.0 ? vec3(0.3) : vec3(0.06);
    o = base * (R * lr * 5.5 + G * lg * 1.4 + vec3(1.0) * strobe * 2.5) + vec3(0.006);
    if (m == 4.0) { vec3 r = reflect(rd, n); o += (R * 0.5 + G * 0.6) * pow(max(0.0, dot(r, normalize(vec3(0.2, 0.3, 1.0)))), 18.0) * (0.6 + bB.y); }
    if (m == 0.0) {
      vec2 fc = floor(p.xz * 2.5); float rp = 0.0;
      for (int k = 0; k < 4; k++) { vec2 o2 = vec2(float(k) * 0.37, float(k) * 0.71); vec2 cel = floor(p.xz * 2.5 + o2); float ph = fract(t * (0.8 + bB.x) + hash(cel) * 7.0);
        float rr = length(fract(p.xz * 2.5 + o2) - 0.5 - (vec2(hash(cel + 1.0), hash(cel + 2.0)) - 0.5) * 0.4); rp += sin((rr - ph * 0.5) * 60.0) * smoothstep(0.5, 0.0, ph) * smoothstep(0.02, 0.0, abs(rr - ph * 0.5) - 0.03); }
      vec3 rn = normalize(n + vec3(rp * 0.08, 0.0, rp * 0.05)), r = reflect(rd, rn);
      float fr = 0.2 + 0.8 * pow(1.0 - max(0.0, dot(rn, -rd)), 4.0);
      o = o * 0.5 + beams(p, r, 30.0) * fr * 0.8 + R * fr * 0.08 * (0.5 + bA.y) + vec3(1.0) * strobe * fr * 0.3;
    }
    o *= exp(-d * 0.07);
  }
  o += R * rh * 0.07 * (0.6 + bA.y * 1.2 + hit.x * 0.8);
  o += beams(ro, rd, far);
  o += R * smoothstep(0.1, -0.5, q.y) * 0.03 * (0.4 + bA.y) + G * 0.012 * (0.3 + bA.w);
  for (int k = 0; k < 3; k++) { float fk = float(k), sc = 70.0 + fk * 50.0, x = q.x * sc, cx = floor(x);
    float sp = 1.2 + hash(vec2(cx, fk)) * 1.5, y = fract(q.y * (0.6 + fk * 0.3) + t * sp + hash(vec2(cx, fk + 9.0)));
    float drop = smoothstep(0.08, 0.0, abs(fract(x) - 0.5)) * smoothstep(0.0, 0.08, y) * smoothstep(0.22, 0.08, y) * step(0.55 - hit.w * 0.4 - bB.x * 0.2, hash(vec2(cx, fk + 3.0)));
    o += (R * 0.5 + G * 0.15 * bA.w + vec3(1.0) * strobe * 0.3) * drop * (0.25 - fk * 0.06); }
  o += vec3(0.9, 1.0, 0.9) * strobe * 0.03;
  gl_FragColor = vec4(post(o), 1.0);
}`;
    const BUNKER = HEAD + `
#define bass max(bA.x, bA.y)
#define mid ((bA.z + bA.w) * 0.5 + hit.y * 0.35)
#define high ((bB.y + bB.z) * 0.5 + hit.z * 0.45)
const float S = 4.2, CY = 2.6;
float map(vec3 p, out float m){
  vec2 c = mod(p.xz, S) - S * 0.5;
  float col = sdb(vec3(c.x, p.y, c.y), vec3(0.28, 6.0, 0.28)) - 0.03;
  col = smin(col, sdb(vec3(c.x, p.y - CY + 0.25, c.y), vec3(0.5, 0.25, 0.5)), 0.25);
  float fl = p.y + 1.5, ce = CY - p.y;
  float bm = min(sdb(vec3(c.x, p.y - CY + 0.12, 0.0), vec3(0.18, 0.14, 1e3)), sdb(vec3(0.0, p.y - CY + 0.12, c.y), vec3(1e3, 0.14, 0.18)));
  float d = min(fl, ce); m = fl < ce ? 0.0 : 1.0;
  if (bm < d) { d = bm; m = 2.0; } if (col < d) { d = col; m = 2.0; }
  return d;
}
float panel(vec2 cell){
  float u = clamp((cell.x + 3.0) / 6.0, 0.0, 1.0), b = bandAt(u);
  float chase = smoothstep(0.85, 1.0, fract(cell.y * 0.1 - t * 1.2)) * hit.z;
  return 0.25 + b * b * 2.0 + chase * 1.2 + hit.x * 0.9;
}
vec2 cellOf(vec3 p){ return floor((p.xz + S * 0.5) / S); }
vec2 bayOf(vec3 p){ return mod(p.xz + S * 0.5, S) - S * 0.5; }
vec3 LC(){ return mix(vec3(0.85, 0.92, 1.0), cB, 0.4); }
void main(){
  vec2 q = (uv - 0.5) * vec2(asp, 1.0);
  vec3 ro = vec3(sin(t * 0.05) * 0.6, 0.1 - hit.x * 0.04, trav * 1.2);
  vec3 rd = normalize(vec3(q.x, q.y + 0.08, 1.0));
  rd.xz *= rot(0.18 * sin(t * 0.04)); rd.xy *= rot(0.015 * sin(t * 0.13));
  float d = 0.0, m = 0.0, shaft = 0.0; bool hit2 = false; vec3 p;
  for (int i = 0; i < 90; i++) {
    p = ro + rd * d; float h = map(p, m);
    vec2 bc = bayOf(p);
    float under = smoothstep(0.95, 0.6, max(abs(bc.x), abs(bc.y))) * smoothstep(-1.5, CY, p.y);
    shaft += under * panel(cellOf(p)) * min(h, 0.35) * (0.6 + 0.4 * nz3(p * 2.0 + vec3(0.0, -t * 0.3, 0.0)));
    if (h < 0.002) { hit2 = true; break; } d += h * 0.9; if (d > 50.0) break;
  }
  vec3 L = LC(), o = vec3(0.0);
  if (hit2) {
    float m2; vec2 e = vec2(0.002, 0.0);
    vec3 n = normalize(vec3(map(p + e.xyy, m2) - map(p - e.xyy, m2), map(p + e.yxy, m2) - map(p - e.yxy, m2), map(p + e.yyx, m2) - map(p - e.yyx, m2)));
    vec2 bc = bayOf(p), cell = cellOf(p);
    float pv = panel(cell);
    vec3 con = vec3(0.26, 0.255, 0.25) * (0.75 + 0.25 * fb2(p.xy * 3.0 + p.zz)) * (0.92 + 0.08 * step(0.5, fract(p.y * 3.0)));
    vec3 Lp = vec3(cell.x * S, CY - 0.1, cell.y * S) - p;
    float li = max(0.0, dot(n, normalize(Lp))) / (1.0 + dot(Lp, Lp) * 0.15) * pv;
    o = con * L * (li * 1.6 + 0.02);
    if (m == 1.0) { float pn = smoothstep(0.82, 0.76, max(abs(bc.x), abs(bc.y))); vec3 tint = mix(L, mix(cA, cB, clamp((cell.x + 3.0) / 6.0, 0.0, 1.0)), 0.35); o = mix(o, tint * pv * 1.3, pn); }
    if (m == 0.0) {
      vec3 r = reflect(rd, normalize(n + vec3(fb2(p.xz * 4.0) - 0.5, 0.0, fb2(p.xz * 4.0 + 7.0) - 0.5) * 0.04));
      float rr = 0.0, rm; vec3 rp = p + n * 0.01;
      for (int k = 0; k < 32; k++) { float hh = map(rp + r * rr, rm); if (hh < 0.004) break; rr += hh; if (rr > 18.0) break; }
      vec3 rq = rp + r * rr; vec2 rb = bayOf(rq);
      vec3 rc = rm == 1.0 ? L * panel(cellOf(rq)) * smoothstep(0.82, 0.76, max(abs(rb.x), abs(rb.y))) : vec3(0.02) * L;
      float wet = smoothstep(0.35, 0.55, fb2(p.xz * 0.6));
      o = o * (1.0 - wet * 0.6) + rc * (0.15 + wet * 0.6) * exp(-rr * 0.08);
    }
    o *= exp(-d * 0.04);
  }
  o += L * shaft * 0.11;
  o += L * hit.y * 0.06 * smoothstep(0.3, 0.0, length(q - vec2(0.0, 0.05)));
  for (int k = 0; k < 20; k++) { float fk = float(k); vec2 dp = vec2(hash(vec2(fk, 1.3)) * 2.0 - 1.0, fract(hash(vec2(fk, 5.1)) - t * 0.01 * (1.0 + hash(vec2(fk, 2.0)))) * 1.1 - 0.55);
    dp.x *= asp * 0.5; dp += vec2(sin(t * 0.3 + fk), cos(t * 0.23 + fk * 2.0)) * 0.01; o += L * smoothstep(0.003, 0.0, length(q - dp)) * (0.25 + bB.z * 0.8 + hit.z * 0.5); }
  gl_FragColor = vec4(post(o), 1.0);
}`;
    const MELT = HEAD + `
vec4 DR[5];
void drips(){ for (int i = 0; i < 5; i++) { float fi = float(i); DR[i] = vec4(sin(fi * 2.4 + 0.5) * 1.9, cos(fi * 1.7) * 1.4 + 0.6, fract(t * (0.11 + fi * 0.013) + fi * 0.37), 0.0); } }
float skin(vec3 p){ return 1.55 - p.y + 0.07 * sin(p.x * 1.6 + t * 0.5) * sin(p.z * 1.3 - t * 0.4) + 0.05 * bA.y * sin(length(p.xz) * 3.0 - t * 3.0) + 0.025 * bA.w * sin(p.x * 3.0 + p.z * 2.0 - t * 4.0); }
float pool(vec3 p){
  float rip = 0.0;
  for (int i = 0; i < 3; i++) { vec4 D = DR[i]; float age = fract(D.z - 0.85), r = length(p.xz - D.xy);
    rip += sin(r * 14.0 - age * 22.0) * exp(-r * 2.0) * exp(-age * 3.0) * 0.03; }
  float r0 = length(p.xz - vec2(0.0, 0.8)), a0 = 1.0 - hit.x; rip += sin(r0 * 16.0 - a0 * 26.0) * exp(-r0 * 1.6) * hit.x * 0.05;
  return p.y + 1.4 - rip - 0.015 * bA.x * sin(r0 * 6.0 - t * 4.0);
}
float drop1(vec3 p, vec3 c, float ph, float sz){
  float hang = smoothstep(0.0, 0.65, ph), fall = smoothstep(0.65, 1.0, ph);
  float yb = 1.5 - hang * (0.9 + bA.y * 0.5) - fall * fall * 3.1, r = sz * (0.16 + 0.1 * hang);
  float blob = length((p - vec3(c.x, yb, c.z)) * vec3(1.0, 0.85 + fall * 0.3, 1.0)) - r;
  float ny = clamp(p.y, yb, 1.6), nr = mix(r * 0.25, 0.15, smoothstep(yb, 1.6, p.y)) * (1.0 - fall);
  float neck = fall > 0.04 ? 1e3 : length(vec3(p.x - c.x, p.y - ny, p.z - c.z)) - nr;
  return min(blob, neck);
}
float map(vec3 p, out float m){
  float d = skin(p); m = 0.0;
  for (int i = 0; i < 5; i++) { vec4 D = DR[i]; float bd = length(p.xz - D.xy) - 0.5; d = smin(d, bd > 0.3 ? bd : drop1(p, vec3(D.x, 0.0, D.y), D.z, 1.0), 0.22); }
  { float bd = length(p.xz - vec2(0.0, 0.8)) - 0.6; d = smin(d, bd > 0.3 ? bd : drop1(p, vec3(0.0, 0.0, 0.8), 0.62 + (1.0 - hit.x) * 0.38, 1.3), 0.25); }
  float pl = p.y > -1.0 ? p.y + 1.35 : pool(p);
  if (pl < d) { d = pl; m = 1.0; }
  return d;
}
vec3 env(vec3 r){
  vec3 o = mix(vec3(0.012), vec3(0.05, 0.05, 0.055), smoothstep(-0.3, 0.5, r.y));
  o += vec3(1.0, 0.97, 0.93) * smoothstep(0.03, 0.0, max(abs(r.x - 0.35) - 0.25, abs(r.y - 0.55) - 0.12)) * 1.4;
  o += vec3(1.0, 0.97, 0.93) * smoothstep(0.03, 0.0, max(abs(r.x + 0.6) - 0.12, abs(r.y - 0.35) - 0.3)) * 0.8;
  o += vec3(0.9) * smoothstep(0.05, 0.0, max(abs(r.z + 0.7) - 0.3, abs(r.y - 0.2) - 0.15)) * 0.6;
  o += cA * smoothstep(0.02, 0.0, abs(r.x + 0.85)) * smoothstep(0.7, 0.0, abs(r.y)) * (0.3 + (bA.x + bA.y) * 1.6);
  o += cB * smoothstep(0.02, 0.0, abs(r.x - 0.9)) * smoothstep(0.7, 0.0, abs(r.y)) * (0.3 + (bB.y + bB.z) * 1.6);
  o += mix(cA, cB, 0.5) * smoothstep(0.03, 0.0, abs(r.y + 0.08)) * (0.08 + bA.w * 0.5 + hit.y * 0.6);
  return o;
}
vec3 nrm(vec3 p){ float m2; vec2 e = vec2(0.002, 0.0); return normalize(vec3(map(p + e.xyy, m2) - map(p - e.xyy, m2), map(p + e.yxy, m2) - map(p - e.yxy, m2), map(p + e.yyx, m2) - map(p - e.yyx, m2))); }
void main(){
  vec2 q = (uv - 0.5) * vec2(asp, 1.0);
  drips();
  float a = t * 0.07 + trav * 0.03;
  vec3 ro = vec3(sin(a) * 3.4, -0.35 + 0.15 * sin(t * 0.19), cos(a) * 3.4 + 0.6), ta = vec3(0.0, 0.55, 0.7);
  vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt), rd = normalize(q.x * rt + q.y * up + 1.4 * fw);
  float d = 0.0, m = 0.0; bool hit2 = false; vec3 p;
  for (int i = 0; i < 64; i++) { p = ro + rd * d; float h = map(p, m); if (h < 0.002 * (1.0 + d)) { hit2 = true; break; } d += h * 0.85; if (d > 14.0) break; }
  vec3 o = env(rd) * 0.04;
  if (hit2) {
    vec3 n = nrm(p), r = reflect(rd, n);
    float rr = 0.02, rm; bool rh = false; vec3 rp;
    for (int k = 0; k < 24; k++) { rp = p + r * rr; float hh = map(rp, rm); if (hh < 0.003) { rh = true; break; } rr += hh * 0.85; if (rr > 10.0) break; }
    vec3 ref = env(r);
    if (rh) { vec3 n2 = nrm(rp); ref = env(reflect(r, n2)) * 0.75; }
    float fr = 0.65 + 0.35 * pow(1.0 - max(0.0, dot(n, -rd)), 4.0);
    o = ref * fr * (m == 1.0 ? 0.45 : 1.0);
    o += vec3(1.0) * pow(max(0.0, dot(r, normalize(vec3(0.35, 0.55, -0.6)))), 120.0) * (1.5 + bB.y);
    o *= exp(-d * 0.03);
  }
  gl_FragColor = vec4(post(o), 1.0);
}`;
    const MODES = [
        { id: 'city', jp: '街', en: 'CITY', src: CITY, after: { glow: 0.25 } },
        { id: 'wet', jp: '濡れ', en: 'WET', src: WET },
        { id: 'sheet', jp: '膜', en: 'SHEET', src: SHEET },
        { id: 'chains', jp: '鎖', en: 'CHAINS', src: CHAINS, after: { glow: 0.06, punch: 0.3 } },
        { id: 'ruins', jp: '廃墟', en: 'RUINS', src: RUINS },
        { id: 'sump', jp: '澱', en: 'SUMP', src: SUMP, part: 'nb_vis_sump' },
        { id: 'inside', jp: '心象', en: 'INSIDE', src: INSIDE, part: 'nb_vis_inside' },
        { id: 'mirror', jp: '夢', en: 'DREAM', src: MIRROR, after: { glow: 0.3 }, part: 'nb_vis_mirror' },
        { id: 'cocoon', jp: '繭', en: 'COCOON', src: COCOON, part: 'nb_vis_cocoon' },
        { id: 'teeth', jp: '歯', en: 'TEETH', src: TEETH, part: 'nb_vis_teeth' },
        { id: 'web', jp: '巣', en: 'WEB', src: WEB },
        { id: 'watchers', jp: '眼', en: 'WATCHERS', src: WATCHERS, part: 'cr_watchers', creepy: true },
        { id: 'trip', jp: '幻', en: 'TRIP', src: TRIP, part: 'cs_mural', street: true, opts: [
            ['world', 'WORLD', 0, 'pick', [['万華鏡', 'KALEIDO'], ['洞窟', 'CAVES'], ['泡', 'FOAM'], ['箱', 'BOX'], ['繭', 'COCOON'], ['結晶', 'CRYSTAL']]],
            ['fold', 'FOLD', 0.5, 'knob'],
            ['pal', 'COLOURS', 0, 'pick', [['自分の', 'THE CAST\'S'], ['虹', 'RAINBOW'], ['酸', 'ACID'], ['ネオン', 'NEON'], ['熱', 'HEAT']]],
            ['melt', 'MELT', 0.25, 'knob'],
            ['speed', 'SPEED', 0.35, 'knob'],
            ['glow', 'GLOW', 0.5, 'knob'],
            ['mirror', 'MIRROR', 0, 'tog'],
            ['strobe', 'STROBE', 0, 'tog'],
            ['twist', 'TWIST', 0.0, 'knob'],
            ['lens', 'LENS', 0.35, 'knob'],
            ['hue', 'HUE', 0.0, 'knob'],
            ['react', 'REACT TO', 0, 'pick', [['全部', 'ALL OF IT'], ['低', 'THE LOWS'], ['中', 'THE MIDS'], ['高', 'THE HIGHS'], ['打', 'THE HITS']]],
            ['pulse', 'KICK PUSH', 0.5, 'knob'],
            ['fog', 'FOG', 0.25, 'knob'],
            ['sym', 'SYMMETRY', 0, 'pick', [['無', 'OFF'], ['三', '3 WAYS'], ['四', '4 WAYS'], ['六', '6 WAYS'], ['八', '8 WAYS']]],
            ['inv', 'NEGATIVE', 0, 'tog']] },
        { id: 'hardbite', jp: '硬', en: 'HARDBITE', src: HARDBITE, after: { glow: 0.35, flare: 0.2, punch: 0.35 } },
        { id: 'acid', jp: '酸', en: 'ACID', src: ACID, after: { glow: 0.3, flare: 0.15 } },
        { id: 'bunker', jp: '壕', en: 'BUNKER', src: BUNKER, after: { glow: 0.25 } },
        { id: 'melt', jp: '溶', en: 'MELT', src: MELT, after: { glow: 0.3, flare: 0.12 } },
        { id: 'scope', jp: '波', en: 'SCOPE' }
    ];
    function create(cg, c2) {
        let gl = null, progs = {}, buf = null, tex = null, pp = null, bl = null, br = null, bz = null, FB = {};
        try { gl = cg.getContext('webgl', { antialias: false, premultipliedAlpha: false, powerPreference: 'high-performance' }); } catch (e) {}
        const VS = 'attribute vec2 a; varying vec2 uv; void main(){ uv = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }';
        const par = gl ? gl.getExtension('KHR_parallel_shader_compile') : null;
        function finish(id, o) {
            try {
                if (!gl.getProgramParameter(o.p, gl.LINK_STATUS)) throw new Error(gl.getShaderInfoLog(o.fs) || 'link');
                let U = {}; o.names.forEach(n => U[n] = gl.getUniformLocation(o.p, n));
                return (progs[id] = { p: o.p, U, a: gl.getAttribLocation(o.p, 'a') });
            } catch (e) { console.warn('noisebox vis', id, e.message); return (progs[id] = null); }
        }
        function compile(id, src, names, wait) {
            let have = progs[id];
            if (have !== undefined && !(have && have.pend)) return have;
            if (have && have.pend) return (wait || gl.getProgramParameter(have.p, par.COMPLETION_STATUS_KHR)) ? finish(id, have) : undefined;
            try {
                const sh = (ty, s) => { let o = gl.createShader(ty); gl.shaderSource(o, s); gl.compileShader(o); return o; };
                let p = gl.createProgram(), vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, src);
                gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
                let o = { pend: 1, p, fs, names };
                if (par && !wait) { progs[id] = o; return undefined; }
                return finish(id, o);
            } catch (e) { console.warn('noisebox vis', id, e.message); return (progs[id] = null); }
        }
        const SCN = ['t', 'trav', 'kick', 'bass', 'mid', 'high', 'asp', 'cA', 'cB', 'fft', 'bA', 'bB', 'hit'], OPTS = ['o0', 'o1', 'o2', 'o3', 'o4', 'o5', 'o6', 'o7', 'o8', 'o9', 'o10', 'o11', 'o12', 'o13', 'o14', 'o15'];
        const prog = m => compile(m.id, m.src, OPTS.length ? SCN.concat(OPTS) : SCN);
        function target(name, w, h) {
            let f = FB[name];
            if (f && f.w === w && f.h === h) return f;
            if (f) { gl.deleteTexture(f.tex); gl.deleteFramebuffer(f.fb); }
            let tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR));
            [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
            let fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tx, 0);
            gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
            return (FB[name] = { tex: tx, fb, w, h });
        }
        function quad(P) { gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(P.a); gl.vertexAttribPointer(P.a, 2, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); }
        if (gl) {
            buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
            tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
            [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR));
            [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
        }
        let flip = 0;
        return {
            gl: !!gl,
            ok(i) { let m = MODES[i]; if (!m) return false; if (!m.src) return true; if (!gl) return false; let p = prog(m); return p !== null; },
            ready(i) { let m = MODES[i]; return !!(m && m.src && gl && prog(m)); },
            warm(list) { if (!par || !gl) return; list.forEach(i => { let m = MODES[i]; if (m && m.src) prog(m); }); },
            draw(i, s, bins, look) {
                let m = MODES[i]; if (!m || !m.src || !gl) return false;
                let P = prog(m); if (!P) return false;
                look = look || {};
                let w = cg.width, h = cg.height, fancy = ['trails', 'glitch', 'split', 'glow', 'grain', 'flare', 'punch', 'scan', 'grade'].some(k => (look[k] || 0) > 0.01) || (look.kal || 0) > 1.5 || Math.abs(look.hue || 0) > 0.001 || (s.flash || 0) > 0.01;
                let sc = fancy ? target('scene', w, h) : null;
                gl.bindFramebuffer(gl.FRAMEBUFFER, sc ? sc.fb : null); gl.viewport(0, 0, w, h); gl.useProgram(P.p);
                gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, bins.length, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, bins); gl.uniform1i(P.U.fft, 0);
                ['t', 'trav', 'kick', 'bass', 'mid', 'high'].forEach(k => gl.uniform1f(P.U[k], s[k]));
                gl.uniform1f(P.U.asp, w / h); gl.uniform3fv(P.U.cA, s.cA); gl.uniform3fv(P.U.cB, s.cB);
                let bA = s.bA || [s.bass, s.bass, s.mid, s.mid], bB = s.bB || [s.mid * 0.7 + s.high * 0.3, s.high, s.high * 0.8, (s.bass + s.mid + s.high) / 3], hit = s.hit || [s.kick, 0, 0, (s.bass + s.mid) / 2];
                gl.uniform4f(P.U.bA, bA[0], bA[1], bA[2], bA[3]); gl.uniform4f(P.U.bB, bB[0], bB[1], bB[2], bB[3]); gl.uniform4f(P.U.hit, s.kick, hit[1], hit[2], hit[3]);
                if (m.opts) { let mine = (look.po && look.po[m.id]) || {}; m.opts.forEach((o, k) => { if (P.U['o' + k]) gl.uniform1f(P.U['o' + k], mine[o[0]] != null ? +mine[o[0]] : o[2]); }); }
                quad(P);
                if (!fancy) return true;
                pp = pp || compile('_post', POST, ['scene', 'prev', 'b1', 'b2', 'fl', 't', 'kick', 'trails', 'glitch', 'split', 'hue', 'kal', 'glow', 'grain', 'asp', 'flare', 'punch', 'scan', 'grade', 'flash', 'res', 'cA', 'cB'], 1);
                bl = bl || compile('_blit', BLIT, ['scene'], 1);
                br = br || compile('_bright', BRIGHT, ['src', 'px', 'thr'], 1);
                bz = bz || compile('_blur', BLUR, ['src', 'dir'], 1);
                if (!pp || !bl) { gl.bindFramebuffer(gl.FRAMEBUFFER, null); return true; }
                const pass = (prg, dst, srcT, set) => { gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb); gl.viewport(0, 0, dst.w, dst.h); gl.useProgram(prg.p); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, srcT.tex); gl.uniform1i(prg.U.src, 0); set(prg.U); quad(prg); };
                let H1 = null, Q1 = null, F2 = null, wantB = (look.glow || 0) > 0.01, wantF = (look.flare || 0) > 0.01;
                if ((wantB || wantF) && br && bz) {
                    let hw = Math.max(2, w >> 1), hh = Math.max(2, h >> 1), qw = Math.max(2, w >> 2), qh = Math.max(2, h >> 2);
                    H1 = target('h1', hw, hh); let H2 = target('h2', hw, hh); Q1 = target('q1', qw, qh); let Q2 = target('q2', qw, qh);
                    pass(br, H1, sc, U => { gl.uniform2f(U.px, 1 / w, 1 / h); gl.uniform1f(U.thr, 0.5); });
                    pass(bz, H2, H1, U => gl.uniform2f(U.dir, 1 / hw, 0)); pass(bz, H1, H2, U => gl.uniform2f(U.dir, 0, 1 / hh));
                    pass(bl, Q1, H1, () => {}); gl.useProgram(bz.p);
                    pass(bz, Q2, Q1, U => gl.uniform2f(U.dir, 2 / qw, 0)); pass(bz, Q1, Q2, U => gl.uniform2f(U.dir, 0, 2 / qh));
                    if (wantF) { let F1 = target('f1', qw, hh); F2 = target('f2', qw, hh); pass(br, F1, sc, U => { gl.uniform2f(U.px, 1 / w, 1 / h); gl.uniform1f(U.thr, 0.6); }); pass(bz, F2, F1, U => gl.uniform2f(U.dir, 3 / qw, 0)); pass(bz, F1, F2, U => gl.uniform2f(U.dir, 9 / qw, 0)); pass(bz, F2, F1, U => gl.uniform2f(U.dir, 24 / qw, 0)); }
                }
                let blk = target('blk', 2, 2);
                let A = target('a', w, h), B = target('b', w, h), src = flip ? B : A, dst = flip ? A : B; flip = 1 - flip;
                gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb); gl.viewport(0, 0, w, h); gl.useProgram(pp.p);
                [[sc, 'scene'], [src, 'prev'], [H1 || blk, 'b1'], [Q1 || blk, 'b2'], [F2 || blk, 'fl']].forEach(([T, n], u) => { gl.activeTexture(gl.TEXTURE0 + u); gl.bindTexture(gl.TEXTURE_2D, T.tex); gl.uniform1i(pp.U[n], u); });
                const U = pp.U, f1 = (n, v) => gl.uniform1f(U[n], v || 0);
                f1('t', s.t); f1('kick', s.kick); ['trails', 'glitch', 'split', 'hue', 'kal', 'glow', 'grain', 'flare', 'punch', 'scan'].forEach(k => f1(k, look[k])); f1('grade', look.grade); f1('flash', s.flash); f1('asp', w / h);
                gl.uniform2f(U.res, w, h); gl.uniform3fv(U.cA, s.cA); gl.uniform3fv(U.cB, s.cB);
                quad(pp);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, w, h); gl.useProgram(bl.p);
                gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, dst.tex); gl.uniform1i(bl.U.scene, 0);
                quad(bl);
                gl.activeTexture(gl.TEXTURE0);
                return true;
            },
            scope(s, td, bins, col, quiet) {
                let x = c2.getContext('2d'), w = c2.width, h = c2.height, kk = s && s.kick || 0, bs = s && s.bass || 0;
                x.globalCompositeOperation = 'source-over';
                x.fillStyle = quiet ? '#000' : 'rgba(0,0,0,' + (0.22 - kk * 0.08) + ')'; x.fillRect(0, 0, w, h);
                x.strokeStyle = 'rgba(255,255,255,' + (0.04 + kk * 0.07) + ')'; x.lineWidth = 1;
                for (let i = 1; i < 8; i++) { x.beginPath(); x.moveTo(w * i / 8, 0); x.lineTo(w * i / 8, h); x.stroke(); }
                for (let i = 1; i < 6; i++) { x.beginPath(); x.moveTo(0, h * i / 6); x.lineTo(w, h * i / 6); x.stroke(); }
                x.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < 40; i++) x.fillRect(w * i / 40, h / 2 - 2, 1, 4);
                let n = 72, bw = w / n, pk = this._pk || (this._pk = new Float32Array(n)), L = bins.length;
                let gr = x.createLinearGradient(0, h, 0, h * 0.6); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
                for (let i = 0; i < n; i++) {
                    let a = Math.floor(Math.exp(Math.log(2) + (Math.log(L) - Math.log(2)) * i / n)), b = Math.max(a + 1, Math.floor(Math.exp(Math.log(2) + (Math.log(L) - Math.log(2)) * (i + 1) / n))), v = 0;
                    if (b - a <= 1) { let f = Math.exp(Math.log(2) + (Math.log(L) - Math.log(2)) * (i + 0.5) / n), k0 = Math.min(L - 2, Math.floor(f)); v = (bins[k0] + (bins[k0 + 1] - bins[k0]) * (f - k0)) / 255; }
                    else for (let k = a; k < b && k < L; k++) v = Math.max(v, bins[k] / 255);
                    v = Math.pow(Math.max(0, (v - 0.3) / 0.7), 1.4);
                    let bh = v * h * 0.34; pk[i] = Math.max(pk[i] - h * 0.006, bh);
                    x.globalAlpha = 0.55; x.fillStyle = gr; x.fillRect(i * bw + 1, h - bh, bw - 2, bh);
                    x.globalAlpha = 0.9; x.fillStyle = col; x.fillRect(i * bw + 1, h - pk[i] - 2, bw - 2, 2);
                }
                x.globalAlpha = 1;
                if (td) {
                    let z = 0; for (let i = 1; i < td.length / 2; i++) if (td[i - 1] < 0 && td[i] >= 0) { z = i; break; }
                    const path = () => { x.beginPath(); for (let i = 0; i < w; i += 1) { let v = td[z + Math.floor(i / w * (td.length / 2))] || 0; x[i ? 'lineTo' : 'moveTo'](i, h / 2 - v * h * (0.42 + bs * 0.06)); } };
                    x.globalCompositeOperation = 'lighter';
                    x.strokeStyle = col; x.globalAlpha = 0.18 + kk * 0.15; x.lineWidth = 7 + kk * 6; path(); x.stroke();
                    x.globalAlpha = 0.5; x.lineWidth = 2.6; path(); x.stroke();
                    x.globalAlpha = 0.85; x.strokeStyle = '#fff'; x.lineWidth = 0.9; path(); x.stroke();
                    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
                }
                // darker at the edges like an old screen
                let vg = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.12)');
                x.fillStyle = vg; x.fillRect(0, 0, w, h);
            },
            lose() { if (gl) { let e = gl.getExtension('WEBGL_lose_context'); if (e) e.loseContext(); } }
        };
    }
    window.NBV = { MODES, create };
})();
