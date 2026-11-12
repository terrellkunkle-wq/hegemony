// ====================================================================
//  Globe 3D (WebGL2, lancer de rayons) : échelle réelle, de l’orbite au sol
// ====================================================================
const D2R = Math.PI / 180, FOV = 45 * D2R, HMIN = .0006, HMAX = 5;
const cam = { lon: 12 * D2R, lat: 28 * D2R, h: 2.3 };
let camAnim = null, CB = null, cw = 0, ch = 0, dpr = 1, mapMode = 0, showClouds = true, dayNight = false, showMesh = true, hoverTile = 0, targ = null;
const glc = $('glc'), ov = $('map'), octx = ov.getContext('2d');
let gl = null, GP = null, GLU = {}, GT = {}, lutA = null, ownA = null, LH = 1;
const MODES = [['Physique', 'Imagerie satellite, nations en léger aplat'], ['Politique', 'Nations en aplats francs'], ['Relief', 'Plat, collines, semi-montagneux, montagneux'], ['Biomes', 'Couvert végétal et climat'], ['Ressources', 'Pétrole, gaz, minerais, bois, céréales, terres rares'], ['Diplomatique', 'Vous, alliés, ennemis, pactes'], ['Provinces', 'Maillage des provinces (tiles)'], ['Rangs', 'Rang des villes : village, bourg, ville, grande ville, métropole'], ['Stabilité', 'Stabilité des villes : rouge sous 25 (émeutes)'], ['Régimes', 'Régime politique des nations'], ['Factions', 'Blocs d’alliances ; vassaux hachurés à la couleur du suzerain'], ['Tensions', 'Guerres, cessez-le-feu, justifications en cours, trêves et pactes'], ['Cultures', 'Aire culturelle d’origine de chaque province'], ['Religions', 'Religion majoritaire d’origine (approximative)'], ['Ravitaillement', 'Vos provinces ravitaillées (vert) ou coupées (rouge)'], ['Nucléaire', 'Puissances disposant de la bombe'], ['Climat', 'Impact régional du changement climatique (rouge : pertes, vert : gains), croissant jusqu’en 2100'], ['Zones hostiles', 'Zones hostiles (usure aggravée des envahisseurs), îles et montagnes difficiles à envahir']];

function tiltFor(h) { const a = clamp(Math.log(h / .05) / Math.log(HMIN / .05), 0, 1); return Math.pow(a, 1.15) * 79 * D2R; }
function mapBox() { const l = $('side').classList.contains('hid') ? 0 : 300, r = $('start').classList.contains('hid') ? 0 : 340; return [l, cw - r]; }
const groundU = (lon, lat) => { if (!ELEV) return 0; let x = Math.floor((lon / D2R + 180) / 360 * W); x = ((x % W) + W) % W; const y = clamp(Math.floor((90 - lat / D2R) / 180 * H), 0, H - 1), em = Math.max(0, ELEV[y * W + x] / 255 - .094) * 7900; return (em + 1350 * clamp((em - 250) / 2150, 0, 1)) / 6371000; };
function camBasis() {
  const lo = cam.lon, la = cam.lat, cl = Math.cos(la), sl = Math.sin(la), co = Math.cos(lo), so = Math.sin(lo);
  const Tp = [cl * so, sl, cl * co], E = [co, 0, -so], Nn = [-sl * so, cl, -sl * co], t = tiltFor(cam.h), ct = Math.cos(t), st = Math.sin(t);
  const B = [ct * Tp[0] - st * Nn[0], ct * Tp[1] - st * Nn[1], ct * Tp[2] - st * Nn[2]];
  const g0 = cam.h < .02 ? groundU(lo, la) : 0, Cm = [Tp[0] * (1 + g0) + cam.h * B[0], Tp[1] * (1 + g0) + cam.h * B[1], Tp[2] * (1 + g0) + cam.h * B[2]];
  if (cam.h < .02) { const r = Math.hypot(Cm[0], Cm[1], Cm[2]), gc = groundU(Math.atan2(Cm[0], Cm[2]), Math.asin(Cm[1] / r)) + .00012; if (r < 1 + gc) { const k = (1 + gc) / r; Cm[0] *= k; Cm[1] *= k; Cm[2] *= k; } }
  const U = [B[1] * E[2] - B[2] * E[1], B[2] * E[0] - B[0] * E[2], B[0] * E[1] - B[1] * E[0]];
  const [l, r] = mapBox();
  CB = { C: Cm, R: E, U, B, f: (ch / 2) / Math.tan(FOV / 2), cx: (l + r) / 2, cy: ch / 2, c2: Cm[0] * Cm[0] + Cm[1] * Cm[1] + Cm[2] * Cm[2] - 1, alt: Math.hypot(Cm[0], Cm[1], Cm[2]) - 1 };
}
// point 3D (rayon quelconque ≥ 1) → écran [x, y, px par unité de rayon] ou null
function proj3(v) {
  const C = CB.C, dx = v[0] - C[0], dy = v[1] - C[1], dz = v[2] - C[2], z = -(dx * CB.B[0] + dy * CB.B[1] + dz * CB.B[2]); if (z <= 1e-7) return null;
  const L = Math.hypot(dx, dy, dz), ux = dx / L, uy = dy / L, uz = dz / L, b = C[0] * ux + C[1] * uy + C[2] * uz, disc = b * b - CB.c2;
  if (disc > 0) { const t = -b - Math.sqrt(disc); if (t > 0 && t < L - 1e-6) return null; }
  return [CB.cx + CB.f * (dx * CB.R[0] + dy * CB.R[1] + dz * CB.R[2]) / z, CB.cy - CB.f * (dx * CB.U[0] + dy * CB.U[1] + dz * CB.U[2]) / z, CB.f / z];
}
const projLL = (lon, lat, r) => { const v = v3(lon, lat); if (r) { v[0] *= r; v[1] *= r; v[2] *= r; } return proj3(v); };
function s2ll(mx, my) {
  const qx = (mx - CB.cx) / CB.f, qy = (my - CB.cy) / CB.f; let d = [CB.R[0] * qx - CB.U[0] * qy - CB.B[0], CB.R[1] * qx - CB.U[1] * qy - CB.B[1], CB.R[2] * qx - CB.U[2] * qy - CB.B[2]]; const L = Math.hypot(d[0], d[1], d[2]); d = d.map(x => x / L);
  const C = CB.C, b = C[0] * d[0] + C[1] * d[1] + C[2] * d[2], disc = b * b - CB.c2; if (disc < 0) return null; const t = -b - Math.sqrt(disc);
  const P = [C[0] + t * d[0], C[1] + t * d[1], C[2] + t * d[2]]; return [Math.atan2(P[0], P[2]) / D2R, Math.asin(clamp(P[1], -1, 1)) / D2R];
}
function flyTo(lon, lat, h, ms) { let dl = lon * D2R - cam.lon; dl = ((dl + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; camAnim = { lo0: cam.lon, la0: cam.lat, h0: cam.h, dlo: dl, la1: clamp(lat, -85, 85) * D2R, h1: h == null ? cam.h : clamp(h, HMIN, HMAX), t0: performance.now(), ms: ms || 900 }; }
function stepCam(ts) { if (!camAnim) return; const k = clamp((ts - camAnim.t0) / camAnim.ms, 0, 1), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; cam.lon = camAnim.lo0 + camAnim.dlo * e; cam.lat = camAnim.la0 + (camAnim.la1 - camAnim.la0) * e; cam.h = Math.exp(Math.log(camAnim.h0) + (Math.log(camAnim.h1) - Math.log(camAnim.h0)) * e); if (k >= 1) camAnim = null; }
const altKm = () => CB ? CB.alt * 6371 : cam.h * 6371;

const GVS = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
const GFS = `#version 300 es
precision highp float; precision highp int; precision highp usampler2D;
uniform sampler2D uDay, uElev, uWater, uNight, uCloud, uLut, uOwn; uniform usampler2D uTile;
uniform vec2 res, cen; uniform float dpr, f, time, c2, alt, tileA, clouds, dayNight, hoverT, mesh, uMode0, seas;
uniform vec3 cam, Rv, Uv, Bv, sun; out vec4 o;
const float PI = 3.14159265;
float h1(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n3(vec3 x){ vec3 i = floor(x), u = fract(x); u = u * u * (3. - 2. * u);
  return mix(mix(mix(h1(i), h1(i + vec3(1,0,0)), u.x), mix(h1(i + vec3(0,1,0)), h1(i + vec3(1,1,0)), u.x), u.y), mix(mix(h1(i + vec3(0,0,1)), h1(i + vec3(1,0,1)), u.x), mix(h1(i + vec3(0,1,1)), h1(i + vec3(1,1,1)), u.x), u.y), u.z); }
vec2 uvOf(vec3 n){ return vec2(atan(n.x, n.z) / (2. * PI) + .5, .5 - asin(clamp(n.y, -1., 1.)) / PI); }
uint tid(vec2 uv){ ivec2 q = ivec2(int(fract(uv.x) * 4096.) & 4095, clamp(int(uv.y * 2048.), 0, 2047)); return texelFetch(uTile, q, 0).r; }
ivec2 lc(uint id){ return ivec2(int(id % 128u), int(id / 128u)); }
// partition bilinéaire : frontières lissées (plus d’escaliers), métriques de distance à la frontière
void part(vec2 uv, out uint idc, out float mo, out float mt, out bool coastO){
  vec2 p = vec2(fract(uv.x) * 4096., uv.y * 2048.) - .5, fl = floor(p), fr = p - fl; ivec2 i0 = ivec2(fl);
  uint id[4]; vec2 ow[4]; float w[4]; w[0] = (1. - fr.x) * (1. - fr.y); w[1] = fr.x * (1. - fr.y); w[2] = (1. - fr.x) * fr.y; w[3] = fr.x * fr.y;
  for (int k = 0; k < 4; k++) { ivec2 q = i0 + ivec2(k & 1, k >> 1); q.x = (q.x + 4096) & 4095; q.y = clamp(q.y, 0, 2047); id[k] = texelFetch(uTile, q, 0).r; ow[k] = id[k] == 0u ? vec2(-1.) : texelFetch(uOwn, lc(id[k]), 0).rg; }
  float so[4], st[4]; for (int a = 0; a < 4; a++) { so[a] = 0.; st[a] = 0.; for (int b = 0; b < 4; b++) { if (ow[b] == ow[a]) so[a] += w[b]; if (id[b] == id[a]) st[a] += w[b]; } }
  int wo = 0; for (int a = 1; a < 4; a++) if (so[a] > so[wo] + 1e-6) wo = a;
  float sec = 0.; bool secOcean = false; for (int a = 0; a < 4; a++) if (ow[a] != ow[wo] && so[a] > sec) { sec = so[a]; secOcean = id[a] == 0u; }
  mo = so[wo] - sec; coastO = id[wo] == 0u || secOcean;
  int wt = wo; for (int a = 0; a < 4; a++) if (ow[a] == ow[wo] && st[a] > st[wt] + 1e-6) wt = a;
  float s2 = 0.; for (int a = 0; a < 4; a++) if (id[a] != id[wt] && st[a] > s2) s2 = st[a];
  mt = st[wt] - s2; idc = id[wt];
}
float rmf(vec3 p){ float sum = 0., amp = 1., w = 1.; for (int i = 0; i < 4; i++) { float n = 1. - abs(2. * n3(p) - 1.); n *= n * w; w = clamp(n * 1.9, 0., 1.); sum += n * amp; p = p * 2.13 + vec3(1.7, 9.2, 3.3); amp *= .5; } return sum; }
float rmf2(vec3 p){ float n = 1. - abs(2. * n3(p) - 1.); n *= n; float s = n; float w = clamp(n * 1.9, 0., 1.); p = p * 2.13 + vec3(1.7, 9.2, 3.3); float m = 1. - abs(2. * n3(p) - 1.); s += m * m * w * .5; return s + .25 * w; }
float hgtC(vec3 n){ vec2 u = uvOf(n); float em = max(0., textureLod(uElev, u, 0.).r - .094) * 7900.; float mtn = smoothstep(250., 2400., em); return (em + rmf2(n * 1800.) * 1150. * mtn + 70. * smoothstep(80., 600., em)) / 6371000.; }
float hgtF(vec3 n){ vec2 u = uvOf(n); float em = max(0., textureLod(uElev, u, 0.).r - .094) * 7900.;
  float mtn = smoothstep(250., 2400., em), hill = smoothstep(80., 600., em);
  return (em + rmf(n * 1800.) * 1150. * mtn + n3(n * 9000.) * 120. * hill * (1. - mtn) + n3(n * 26000.) * 20.) / 6371000.; }
vec3 space(vec3 d){
  vec3 c = vec3(.004, .006, .014); vec3 q = d * 420.; float s = h1(floor(q)); if (s > .9975) c += vec3(.75, .8, 1.) * pow((s - .9975) / .0025, 3.) * 1.6;
  float band = exp(-pow(dot(d, normalize(vec3(.35, .82, -.45))) * 3.2, 2.)); c += vec3(.09, .085, .13) * band * (.4 + .6 * n3(d * 6.)) * (.5 + .5 * n3(d * 23.));
  return c; }
void main(){
  vec2 px = vec2(gl_FragCoord.x, res.y - gl_FragCoord.y) / dpr, q = (px - cen) / f;
  vec3 d = normalize(Rv * q.x - Uv * q.y - Bv);
  float b = dot(cam, d), disc = b * b - c2; bool sph = disc >= 0. && -b - sqrt(max(disc, 0.)) > 0.;
  vec3 up = normalize(cam), L = dayNight > .5 ? sun : normalize(Bv * .75 + Uv * .5 - Rv * .35);
  float lowA = 1. - smoothstep(.002, .02, alt);
  vec3 skyH = vec3(.62, .76, .92), skyZ = vec3(.16, .34, .7);
  float t = 0.; bool hit = false, march = alt < .012;
  if (march) { const float HM = .00145; float c3 = c2 + 1. - (1. + HM) * (1. + HM), ds = b * b - c3;
    if (ds > 0.) { float te = max(0., -b - sqrt(ds)), tx = min(sph ? -b - sqrt(disc) : -b + sqrt(ds), te + .032), tp = te;
      float tt = te;
      for (int i = 0; i < 90; i++) { vec3 p = cam + tt * d; float r = length(p), ha = r - 1. - hgtC(p / r);
        if (ha < 0.) { float a = tp, bb = tt; for (int k = 0; k < 7; k++) { float m = (a + bb) * .5; vec3 q = cam + m * d; float rq = length(q); if (rq < 1. + hgtF(q / rq)) bb = m; else a = m; } t = bb; hit = true; break; }
        tp = tt; tt += max(ha * .75, tt * .002 + 2e-6); if (tt > tx) break; }
      if (!hit && sph) { t = -b - sqrt(disc); hit = true; } } }
  else if (sph) { t = -b - sqrt(disc); hit = true; }
  if (!hit) {
    vec3 c = space(d); float hm = b < 0. ? sqrt(max(c2 + 1. - b * b, 0.)) - 1. : alt;
    c += vec3(.28, .52, 1.) * exp(-max(hm, 0.) * 55.) * .9 * (1. - lowA);
    vec3 sky = mix(skyH, skyZ, clamp(dot(d, up) * 3.5 + .1, 0., 1.)); c = mix(c, sky, lowA * clamp(1. - alt * 40., 0., 1.));
    o = vec4(c, 1.); return; }
  vec3 P = cam + t * d, N = normalize(P), V = -d;
  vec2 uv = uvOf(N), uv2 = vec2(fract(uv.x + .5) - .5, uv.y), dx = dFdx(uv), dy = dFdy(uv), dx2 = dFdx(uv2), dy2 = dFdy(uv2);
  if (abs(dx2.x) < abs(dx.x)) dx = dx2; if (abs(dy2.x) < abs(dy.x)) dy = dy2;
  vec3 col = textureGrad(uDay, uv, dx, dy).rgb; col = pow(col, vec3(1.12)) * 1.12;
  float wm = textureGrad(uWater, uv, dx, dy).r;
  float lon = atan(N.x, N.z), lat = asin(N.y); vec3 E = vec3(cos(lon), 0., -sin(lon)), Nn = vec3(-sin(lat) * sin(lon), cos(lat), -sin(lat) * cos(lon));
  // relief : carte d’altitude réelle + détail procédural en approche
  float e0 = texture(uElev, uv).r, ex = texture(uElev, uv + vec2(1. / 4096., 0.)).r - texture(uElev, uv - vec2(1. / 4096., 0.)).r, ey = texture(uElev, uv - vec2(0., 1. / 2048.)).r - texture(uElev, uv + vec2(0., 1. / 2048.)).r;
  vec3 Ns = normalize(N - (E * ex / max(cos(lat), .2) + Nn * ey) * 2.6 * (1. - wm));
  if (march) { float eps = max(t / f * 1.5, 1.5e-6); float hx = hgtF(normalize(N + E * eps)) - hgtF(normalize(N - E * eps)), hy = hgtF(normalize(N + Nn * eps)) - hgtF(normalize(N - Nn * eps)); vec3 Nt = normalize(N - (E * hx + Nn * hy) / (2. * eps)); Ns = normalize(mix(Ns, Nt, smoothstep(.012, .006, alt))); }
  float fp = t / f, lod = clamp(log2(.0015 / fp), 0., 12.), land = 1. - wm, em = max(0., e0 - .094) * 7900., latd = abs(lat) * 57.3;
  { // manteau neigeux saisonnier : la limite descend en hiver et remonte en été, dans chaque hémisphère
    float wN = .5 + .5 * cos(6.2832 * (seas - .04)), wH = lat > 0. ? wN : 1. - wN;
    float sl = mix(76., 43., wH) - em / 170. + (n3(P * 55.) - .5) * 7.;
    float ssn = smoothstep(sl - 3., sl + 3., latd) * land * (1. - smoothstep(.72, .9, dot(col, vec3(.333))));
    col = mix(col, vec3(.9, .93, .97), ssn * .7);
  }
  if (lod > 0. && land > .02) {
    float dn = 0., rg = 0., amp = .5, fr = 700., gx = 0., gy = 0.;
    for (int i = 0; i < 12; i++) { float w = clamp(lod - float(i), 0., 1.); if (w <= 0.) break; vec3 pp = P * fr; float nv = n3(pp); dn += (nv - .5) * amp * w; float r = 1. - abs(2. * n3(pp * 1.07 + 11.3) - 1.); rg += r * r * amp * w; gx += (n3(pp + vec3(17.1, 3.3, 9.2)) - .5) * amp * w; gy += (n3(pp + vec3(5.7, 21.9, 1.4)) - .5) * amp * w; fr *= 2.03; amp *= .56; }
    float fade = clamp(lod * .35, 0., 1.), mtn = smoothstep(900., 2300., em + rg * 900. - dn * 300.) * fade;
    float treel = mix(2300., 600., smoothstep(30., 66., latd)), forestM = (1. - smoothstep(treel - 300., treel + 200., em + dn * 400.)) * smoothstep(400., 1100., em) * fade;
    float clump = smoothstep(.35, .7, n3(P * 9000.) * .6 + n3(P * 31000.) * .4);
    col = mix(col, mix(vec3(.12, .2, .1), vec3(.2, .27, .14), clump) * (.85 + .3 * dn), forestM * .55 * smoothstep(.0, .1, col.g - col.b));
    float strata = n3(vec3(P.y * 40000., P.x * 900., P.z * 900.)) * .5 + n3(P * 15000.) * .5;
    vec3 rock = mix(vec3(.3, .28, .25), vec3(.58, .53, .47), clamp(strata * .9 + rg * .6 + dn * .5, 0., 1.));
    col = mix(col * (1. + dn * .8), rock, mtn * .7);
    if (march) { float rv = rmf(N * 1800.); col *= mix(1., .55 + .5 * clamp(rv, 0., 1.1), smoothstep(250., 1800., em)); }
    float snowl = mix(4900., 1500., smoothstep(25., 66., latd)), snow = smoothstep(snowl - 250., snowl + 250., em + (rg - .35) * 1400. + dn * 500.) * fade;
    col = mix(col, vec3(.93, .95, .99) * (.88 + .12 * strata), snow);
    float flatA = (1. - smoothstep(200., 900., em)) * (1. - mtn) * smoothstep(5.5, 8., lod) * land;
    if (flatA > 0.) { vec2 lp = vec2(lon * cos(lat), lat) * 6371.; vec2 cell = floor(lp / 8.); float ang = h1(vec3(cell, 7.)) * 3.14; mat2 rot = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)); vec2 g = rot * lp / mix(.35, .9, h1(vec3(cell, 2.))); vec2 gi = floor(g), gf = fract(g);
      float fh = h1(vec3(gi, 3.)), green = smoothstep(-.02, .06, col.g - col.r); vec3 fc = mix(mix(vec3(.36, .42, .2), vec3(.52, .47, .3), fh), vec3(.62, .55, .36), step(.8, fh)) * (.8 + .4 * h1(vec3(gi, 9.)));
      col = mix(col, mix(col, fc, .55), flatA * mix(.6, 1., green)); float edge = min(min(gf.x, 1. - gf.x), min(gf.y, 1. - gf.y)); col *= 1. - .35 * flatA * (1. - smoothstep(.0, .06, edge)); }
    Ns = normalize(Ns + (E * gx + Nn * gy) * (.3 + 1.6 * mtn + .2 * snow) * land * min(1., lod * .3));
  }
  // eau : vagues animées et reflets du soleil
  vec3 Nw = N; float wa = smoothstep(.004, .0002, fp); if (wm > .3 && wa > 0.) { float fr = clamp(.25 / fp, 700., 80000.); vec3 pp = P * fr + vec3(time * .3, 0., time * .2); Nw = normalize(N + (E * (n3(pp) - .5) + Nn * (n3(pp + 7.3) - .5)) * .07 * wa); }
  vec3 Nf = normalize(mix(Ns, Nw, wm));
  // couches de jeu : nations, provinces, modes de carte (partition lissée)
  uint id; float mo, mt; bool coastO; part(uv, id, mo, mt, coastO);
  vec4 lu = texelFetch(uLut, lc(id), 0), ow = texelFetch(uOwn, lc(id), 0);
  float hov = (float(id) == hoverT && id > 0u) ? 1. : 0.;
  float tf = smoothstep(.0012, .02, alt); col = mix(col, lu.rgb, lu.a * (uMode0 > .5 ? tf : mix(.45, 1., tf))); if (ow.b > .5) col = mix(col, vec3(1., .85, .3), .22); col += hov * .1;
  float dif = max(dot(Nf, L), 0.), day = dayNight > .5 ? smoothstep(-.12, .22, dot(N, L)) : 1.;
  vec3 lit = col * (.22 + .9 * dif) * mix(.08, 1., day);
  if (dayNight > .5) lit += texture(uNight, uv).rgb * vec3(1., .85, .6) * (1. - day) * 1.5 * (1. - wm);
  float spec = pow(max(dot(reflect(-L, Nf), V), 0.), mix(40., 160., wa)) * wm * day; lit += vec3(1., .95, .85) * spec * mix(.22, .6, wa);
  float fre = pow(1. - max(dot(N, V), 0.), 5.); lit = mix(lit, skyH * day, fre * .35 * wm);
  // nuages (s’effacent à basse altitude)
  float cv = clouds * smoothstep(.004, .05, alt);
  if (cv > 0.) { float cl = texture(uCloud, uv + vec2(time * .00025, 0.)).r; cl = smoothstep(.15, .85, cl); lit = mix(lit, vec3(1.) * (.25 + .85 * max(dot(N, L), 0.)) * mix(.06, 1., day), cl * .62 * cv); }
  // frontières : nations (épaisses), provinces (fines), largeur constante à l’écran
  float fwo = max(fwidth(mo), 1e-4), fwt = max(fwidth(mt), 1e-4), texpp = length(dx * vec2(4096., 2048.));
  float graze = smoothstep(.06, .3, dot(N, V));
  if (id > 0u || !coastO) {
    float meshA = tileA * mesh * clamp(2.6 - texpp * .8, 0., 1.) * graze;
    float tl = 1. - smoothstep(.5 * fwt, 1.3 * fwt, mt); lit = mix(lit, vec3(1.), tl * meshA);
    if (!coastO) { float cl = 1. - smoothstep(.7 * fwo, 1.7 * fwo, mo), gl2 = 1. - smoothstep(1.7 * fwo, 4.5 * fwo, mo); lit = mix(lit, lu.a > .5 ? lit * 1.3 : lit * .55 + vec3(.45), gl2 * .3); lit = mix(lit, vec3(.03, .04, .06), cl * .85 * graze); }
  }
  { vec2 e1 = dx * 1.3, e2 = dy * 1.3; uint a1 = tid(uv + e1), a2 = tid(uv - e1), a3 = tid(uv + e2), a4 = tid(uv - e2);
    if (ow.b > .5 && (texelFetch(uOwn, lc(a1), 0).b < .5 || texelFetch(uOwn, lc(a2), 0).b < .5 || texelFetch(uOwn, lc(a3), 0).b < .5 || texelFetch(uOwn, lc(a4), 0).b < .5)) lit = mix(lit, vec3(1., .82, .25), .9); }
  // atmosphère : liseré en orbite, brume au ras du sol
  float rim = pow(1. - max(dot(N, V), 0.), 3.); lit = mix(lit, vec3(.38, .62, 1.) * mix(.15, 1., day), rim * .5 * (1. - lowA));
  float hz = (1. - exp(-t * 46.)) * lowA; lit = mix(lit, skyH * mix(.1, 1., day), clamp(hz, 0., .85));
  o = vec4(lit, 1.);
}`;
function globeInit() {
  gl = glc.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: false });
  if (!gl) throw new Error('WebGL2 indisponible : le globe 3D nécessite un navigateur récent (Chrome, Edge, Firefox, Safari 15+).');
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  GP = gl.createProgram(); gl.attachShader(GP, sh(gl.VERTEX_SHADER, GVS)); gl.attachShader(GP, sh(gl.FRAGMENT_SHADER, GFS)); gl.linkProgram(GP); if (!gl.getProgramParameter(GP, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(GP));
  gl.useProgram(GP); const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(GP, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  for (const k of ['uDay', 'uElev', 'uWater', 'uNight', 'uCloud', 'uLut', 'uOwn', 'uTile', 'res', 'cen', 'dpr', 'f', 'time', 'c2', 'alt', 'tileA', 'clouds', 'dayNight', 'hoverT', 'mesh', 'uMode0', 'seas', 'cam', 'Rv', 'Uv', 'Bv', 'sun']) GLU[k] = gl.getUniformLocation(GP, k);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  const ani = gl.getExtension('EXT_texture_filter_anisotropic');
  const img = (unit, name, im, fmt, ifmt) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, fmt, gl.UNSIGNED_BYTE, im); gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); if (ani) gl.texParameterf(gl.TEXTURE_2D, ani.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(ani.MAX_TEXTURE_MAX_ANISOTROPY_EXT))); gl.uniform1i(GLU[name], unit); GT[name] = t; };
  img(0, 'uDay', IMG.day, gl.RGB, gl.RGB8); img(1, 'uElev', IMG.elev, gl.RED, gl.R8); img(2, 'uWater', IMG.water, gl.RED, gl.R8); img(3, 'uNight', IMG.night, gl.RGB, gl.RGB8); img(4, 'uCloud', IMG.clouds, gl.RED, gl.R8);
  const raw = (unit, name, ifmt, fmt, type, w, h, data) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1); gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, type, data); for (const p of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, p, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.uniform1i(GLU[name], unit); GT[name] = t; };
  raw(5, 'uTile', gl.R16UI, gl.RED_INTEGER, gl.UNSIGNED_SHORT, W, H, TILE);
  LH = Math.ceil((TL.length + 1) / LW); lutA = new Uint8Array(LW * LH * 4); ownA = new Uint8Array(LW * LH * 4);
  raw(6, 'uLut', gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, LW, LH, lutA); raw(7, 'uOwn', gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, LW, LH, ownA);
  updateLayer();
}
const hexRGB = {}; function rgbOf(c) { if (hexRGB[c]) return hexRGB[c]; const x = document.createElement('canvas').getContext('2d'); x.fillStyle = c; x.fillRect(0, 0, 1, 1); return hexRGB[c] = Array.from(x.getImageData(0, 0, 1, 1).data).slice(0, 3); }
function diploCol(o) { const pl = S.player, n = P(); if (!active(o)) return '#3c434c'; return o === pl ? '#3d8bfd' : atWar(pl, o) ? '#e5534b' : isAlly(pl, o) ? '#57ab5a' : n.pact[o] || (n.truce[o] || 0) > S.day ? '#e3b341' : '#8a96a3'; }
function tensionCol(o) { const pl = S.player, n = P(), O = S.nat[o]; if (o === pl) return '#3d8bfd'; if (!active(o)) return '#3c434c'; if (inWar(pl, o)) return atWar(pl, o) ? '#e5534b' : '#f2a7b5'; if (n.just[o] != null) return S.day >= n.just[o] ? '#a8322b' : '#e3893a'; if (O.just[pl] != null && hasIntel(n, o)) return '#c77dff'; if ((n.truce[o] || 0) > S.day) return '#5aa9c9'; if (n.pact[o]) return '#e3b341'; if (isAlly(pl, o)) return '#57ab5a'; return '#5d6770'; }
const tOwner = i => REPLAY ? REPLAY.tow[i] : S ? S.tow[i] : TL[i].t;
function tileFill(i) {
  const tl = TL[i], o = tOwner(i), off = S && !active(o);
  switch (mapMode) {
    case 1: return off ? ['#2b3037', .8] : [T[o].color, .74];
    case 2: return tl.rel ? [RELIEF[tl.rel].col, .62] : ['#000', 0];
    case 3: return [BIOME[tl.bio].col, .66];
    case 4: return tl.res ? [TRES[tl.res][1], .78] : ['#20262d', .45];
    case 5: return S ? [diploCol(o), .64] : [T[o].color, .3];
    case 6: return off ? ['#2b3037', .7] : [T[o].color, .48];
    case 7: return [RANKCOL[S ? S.city[tl.c].rk : 2], .62];
    case 8: { if (!S || off) return ['#2b3037', .6]; const v = S.city[tl.c].stab; return [v < 25 ? '#e5534b' : v < 45 ? '#e3893a' : v < 60 ? '#e3b341' : v < 80 ? '#9cc160' : '#57ab5a', .64]; }
    case 10: { if (!S || off) return ['#2b3037', .6]; const f = facOf(o), l = S.nat[o].lord; return f ? [f.col, .68] : l != null ? [T[l].color, .4] : ['#30363d', .5]; }
    case 11: return S ? [tensionCol(o), .66] : ['#30363d', .4];
    case 12: return [CULTG[cultOf(tl.t)][1], .64];
    case 13: return [REL[relOf(tl.t)][1], .64];
    case 14: { if (!S) return ['#30363d', .4]; const pl = S.player, s = SUP[pl]; return o === pl || isAlly(pl, o) ? [s && s[NC + i] ? '#57ab5a' : '#e5534b', .62] : ['#30363d', .45]; }
    case 15: { if (off) return ['#2b3037', .7]; const N = S ? S.nat[o] : null; const has = N ? (N.ms.nuke || 0) > 0 : !!NUKES[T[o].meta.a]; return has ? ['#ffd24a', .7] : N && N.tech.nuke ? ['#e3893a', .6] : ['#3c434c', .55]; }
    case 16: { const v = climScore(C[tl.c]) * (S ? Math.max(.25, climCC()) : 1); return v < -.3 ? ['#9e1f1a', .78] : v < -.18 ? ['#d8453b', .72] : v < -.08 ? ['#ee8a4f', .66] : v < -.02 ? ['#f2c36b', .55] : v > .12 ? ['#2f8f46', .72] : v > .02 ? ['#7fc76a', .6] : ['#3c434c', .4]; }
    case 17: return tl.hz ? [HZC[tl.hz], .72] : tl.isl ? ['#6fa8dc', .45 + (tl.hard - 2) * .2] : tl.hard > 1.2 ? ['#b08968', .3 + (tl.hard - 1.3) * .5] : ['#2b3037', .35];
    case 9: return off ? ['#2b3037', .7] : [IDEO[S ? S.nat[o].ideo : ideoOf(T[o].meta.a)].col, .64];
    default: return off ? ['#30353c', .55] : [T[o].color, .3];
  }
}
function updateLayer() {
  if (!gl) return; layerDirty = false;
  ownA[0] = ownA[1] = 255; ownA[2] = 0; ownA[3] = 255; lutA[3] = 0;
  const selC = sel != null ? sel : -1;
  for (let i = 0; i < TL.length; i++) {
    const id = i + 1, tl = TL[i], o = tOwner(i), [c, a] = tileFill(i), rgb = rgbOf(c), p = id * 4;
    lutA[p] = rgb[0]; lutA[p + 1] = rgb[1]; lutA[p + 2] = rgb[2]; lutA[p + 3] = a * 255;
    ownA[p] = o & 255; ownA[p + 1] = o >> 8; ownA[p + 2] = (S ? (selTile >= 0 ? i === selTile : tl.c === selC) : o === pickId) ? 255 : 0; ownA[p + 3] = 255;
  }
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.activeTexture(gl.TEXTURE6); gl.bindTexture(gl.TEXTURE_2D, GT.uLut); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, LW, LH, gl.RGBA, gl.UNSIGNED_BYTE, lutA);
  gl.activeTexture(gl.TEXTURE7); gl.bindTexture(gl.TEXTURE_2D, GT.uOwn); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, LW, LH, gl.RGBA, gl.UNSIGNED_BYTE, ownA);
}
function sunDir() { const d = S ? (S.day * DPS) % 365 : 172, dec = -23.44 * Math.cos(2 * Math.PI * (d + 10) / 365), now = new Date(), utc = now.getUTCHours() + now.getUTCMinutes() / 60, lon = (12 - utc) * 15; return v3(lon, dec); }
let gScale = 1, ftAvg = 16;
function setGL() { const gd = Math.min(dpr, 1.5) * gScale; const w = Math.round(cw * gd), h = Math.round(ch * gd); if (glc.width !== w || glc.height !== h) { glc.width = w; glc.height = h; } glc._d = gd; }
function resize() { dpr = Math.min(window.devicePixelRatio || 1, 2); cw = ov.clientWidth; ch = ov.clientHeight; ov.width = Math.round(cw * dpr); ov.height = Math.round(ch * dpr); setGL(); if (typeof spResize === 'function') spResize(); }
// adapte la résolution du globe à la puissance de la machine
function governor(dt) { ftAvg = ftAvg * .92 + dt * .08; const lo = CB && CB.alt < .012 ? .45 : .6; if (ftAvg > 30 && gScale > lo) { gScale = Math.max(lo, gScale * .85); setGL(); ftAvg = 20; } else if (ftAvg < 15 && gScale < 1) { gScale = Math.min(1, gScale * 1.1); setGL(); ftAvg = 18; } }
function drawGlobe(ts) {
  camBasis(); if (layerDirty) updateLayer();
  const s = sunDir(), C_ = CB.C;
  gl.viewport(0, 0, glc.width, glc.height); gl.useProgram(GP);
  gl.uniform2f(GLU.res, glc.width, glc.height); gl.uniform2f(GLU.cen, CB.cx, CB.cy); gl.uniform1f(GLU.dpr, glc._d); gl.uniform1f(GLU.f, CB.f); gl.uniform1f(GLU.time, ts / 1000); gl.uniform1f(GLU.c2, CB.c2); gl.uniform1f(GLU.alt, CB.alt);
  gl.uniform1f(GLU.tileA, [.16, .26, .35, .35, .32, .24, .85][mapMode] || .3); gl.uniform1f(GLU.seas, S ? (((REPLAY ? REPLAY.day : S.day) * DPS) % 365) / 365 : .55); gl.uniform1f(GLU.clouds, showClouds ? 1 : 0); gl.uniform1f(GLU.dayNight, dayNight ? 1 : 0); gl.uniform1f(GLU.hoverT, hoverTile); gl.uniform1f(GLU.mesh, showMesh || mapMode === 6 ? 1 : 0); gl.uniform1f(GLU.uMode0, mapMode === 0 ? 1 : 0);
  gl.uniform3f(GLU.cam, C_[0], C_[1], C_[2]); gl.uniform3f(GLU.Rv, ...CB.R); gl.uniform3f(GLU.Uv, ...CB.U); gl.uniform3f(GLU.Bv, ...CB.B); gl.uniform3f(GLU.sun, s[0], s[1], s[2]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// ---------- nœuds cliquables (aucun texte sur le globe) ----------------
let nodes = [];
function slerp(a, b, t) { const d = clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1), w = Math.acos(d); if (w < 1e-6) return a.slice(); const s = Math.sin(w), k1 = Math.sin((1 - t) * w) / s, k2 = Math.sin(t * w) / s; return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2]; }
function armyV(a) { const v = nV(aNode(a)); if (a.path.length && a.prog > 0) return slerp(v, nV(a.path[0]), a.prog); return v; }
function arrowHead(c, pts) { let b = null, a = null; for (let i = pts.length - 1; i >= 0 && !a; i--) { const p = proj3(pts[i]); if (!p) { if (!b) return; continue; } if (!b) b = p; else if (Math.hypot(p[0] - b[0], p[1] - b[1]) > 3) a = p; } if (!a || !b) return; const an = Math.atan2(b[1] - a[1], b[0] - a[0]); c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(b[0] - 9 * Math.cos(an - .45), b[1] - 9 * Math.sin(an - .45)); c.lineTo(b[0] - 9 * Math.cos(an + .45), b[1] - 9 * Math.sin(an + .45)); c.closePath(); c.fill(); }
function pathPts(a, max) { const pts = []; let a0 = armyV(a); for (const t of a.path.slice(0, max || 60)) { const b = nV(t); for (let k = 0; k <= 4; k++) pts.push(slerp(a0, b, k / 4)); a0 = b; } return pts; }
function geoCircle(c, r) { const out = [], k = r / 6371, E = [Math.cos(c.lon * D2R), 0, -Math.sin(c.lon * D2R)], la = c.lat * D2R, lo = c.lon * D2R, Nn = [-Math.sin(la) * Math.sin(lo), Math.cos(la), -Math.sin(la) * Math.cos(lo)]; for (let i = 0; i <= 96; i++) { const a = i / 96 * 2 * Math.PI, ca = Math.cos(k), sa = Math.sin(k); out.push([c.v[0] * ca + (E[0] * Math.cos(a) + Nn[0] * Math.sin(a)) * sa, c.v[1] * ca + (Nn[1] * Math.sin(a)) * sa, c.v[2] * ca + (E[2] * Math.cos(a) + Nn[2] * Math.sin(a)) * sa]); } return out; }
function polyline(c, pts) { let pen = false; c.beginPath(); for (const v of pts) { const p = proj3(v); if (!p) { pen = false; continue; } pen ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); pen = true; } c.stroke(); }
function unitIcon(c, a, x, y, sz) {
  const col = T[a.o].color, pl = S.player, isSel = a === selArmy || selSet.includes(a); c.fillStyle = col; c.strokeStyle = isSel ? '#ffd24a' : a.o === pl ? '#fff' : atWar(pl, a.o) ? '#ff4d43' : '#0b0f14'; c.lineWidth = isSel ? 2.4 : 1.3;
  const w = sz * 1.6, h = sz;
  if (a.sea) { c.beginPath(); c.moveTo(x - w / 2, y - h * .1); c.lineTo(x + w / 2, y - h * .1); c.lineTo(x + w * .32, y + h / 2); c.lineTo(x - w * .32, y + h / 2); c.closePath(); c.fill(); c.stroke(); c.fillRect(x - 2, y - h * .55, 4, h * .45); }
  else if (!aland(a) && aair(a)) { c.beginPath(); c.moveTo(x, y - h * .6); c.lineTo(x + w / 2, y + h * .4); c.lineTo(x, y + h * .1); c.lineTo(x - w / 2, y + h * .4); c.closePath(); c.fill(); c.stroke(); }
  else { c.fillRect(x - w / 2, y - h / 2, w, h); c.strokeRect(x - w / 2, y - h / 2, w, h); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1; c.beginPath(); const tk = a.u[UI.tank] + a.u[UI.meca], inf = a.u[UI.inf] + a.u[UI.mtn] + a.u[UI.mar] + a.u[UI.fs]; if (inf >= tk) { c.moveTo(x - w / 2, y - h / 2); c.lineTo(x + w / 2, y + h / 2); c.moveTo(x + w / 2, y - h / 2); c.lineTo(x - w / 2, y + h / 2); } if (tk > 0) { c.moveTo(x + w * .3, y); c.ellipse(x, y, w * .3, h * .28, 0, 0, 6.3); } c.stroke(); if (aair(a) >= 1) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x + w / 2 + 2, y - h / 2); c.lineTo(x + w / 2 + 7, y - h / 2 - 3); c.lineTo(x + w / 2 + 7, y - h / 2 + 3); c.fill(); } }
  if (a.gen) { c.fillStyle = '#ffd24a'; c.beginPath(); c.arc(x - w / 2, y - h / 2, 2.6, 0, 6.3); c.fill(); }
  if (a.o === pl && (a.oos || 0) > 0) { c.fillStyle = '#e5534b'; c.fillRect(x - w / 2, y + h / 2 + 1.5, w, 2); }
  if (a.hit && S.day - a.hit < 2) { c.fillStyle = '#ff6a3d'; c.beginPath(); c.arc(x + w / 2, y - h / 2, 3.5, 0, 6.3); c.fill(); }
}
function drawOverlay(ts) {
  const c = octx; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, cw, ch); nodes = [];
  const far = cam.h > 1.1, pl = S ? S.player : -1, near = gNear(); gFrame();
  if (REPLAY) return;
  if (cam.h < 1.3 && mapMode !== 1) { c.strokeStyle = 'rgba(96,170,235,.6)'; c.lineWidth = cam.h < .3 ? 1.8 : 1.1; for (const l of RIVERS) polyline(c, l); }
  // météo
  if (S) for (let wi = 0; wi < S.wx.length; wi++) {
    const e = S.wx[wi], p = projLL(e.lon, e.lat); if (!p) continue; const w = WX[e.k], r = e.r / 6371 * p[2];
    if (p[0] < -r || p[0] > cw + r || p[1] < -r || p[1] > ch + r) continue;
    const g = c.createRadialGradient(p[0], p[1], r * .1, p[0], p[1], r); g.addColorStop(0, `rgba(${w.col},.34)`); g.addColorStop(.75, `rgba(${w.col},.16)`); g.addColorStop(1, `rgba(${w.col},0)`); c.fillStyle = g; c.beginPath(); c.arc(p[0], p[1], r, 0, 6.3); c.fill();
    if (e.k === 'cyclone' || e.k === 'tornade' || e.k === 'tempete') { const an = ts / (e.k === 'tempete' ? 1800 : 500); c.strokeStyle = `rgba(${w.col},.7)`; c.lineWidth = 1.4; for (let k = 0; k < 3; k++) { c.beginPath(); for (let n = 0; n < 24; n++) { const a = an + k * 2.09 + n * .17, rr = r * (.06 + n * .032); c.lineTo(p[0] + Math.cos(a) * rr, p[1] + Math.sin(a) * rr); } c.stroke(); } }
    const fs = clamp(r * .35, 12, 24); c.font = `${fs}px system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(w.ic, p[0], p[1]);
    nodes.push({ k: 'wx', i: wi, x: p[0], y: p[1], r: fs * .7 });
  }
  // portée de tir (missile ou frappe)
  if (targ) { c.setLineDash([6, 5]); c.lineWidth = 1.6; c.strokeStyle = targ.kind === 'missile' ? 'rgba(255,110,70,.9)' : 'rgba(110,200,255,.9)'; for (const s of targ.sites) { polyline(c, geoCircle(C[s], targ.range)); } c.setLineDash([]); }
  // villes
  for (const cd of C) {
    if (far && !cd.cap) continue; const p = proj3(cd.v); if (!p || p[0] < -20 || p[0] > cw + 20 || p[1] < -20 || p[1] > ch + 20) continue;
    const o = S ? S.city[cd.i].o : cd.t, off = S && !active(o), r = clamp(1.6 + Math.sqrt(cd.pk) / 18, 2, 6.5) * clamp(.6 + Math.log(1 / Math.max(cam.h, .01)) * .12, .7, 1.35);
    if (near) { c.globalAlpha = off ? .55 : 1; const hw = gfxCity(c, cd, S ? S.city[cd.i] : null, p[0], p[1], ts, o, pl); c.globalAlpha = 1; nodes.push({ k: 'city', i: cd.i, x: p[0], y: p[1] - 4, r: Math.max(10, hw * .8) }); continue; }
    c.globalAlpha = off ? .45 : 1; c.fillStyle = T[o].color; c.strokeStyle = S && o === pl ? '#fff' : S && atWar(pl, o) ? '#ff4d43' : '#0b0f14'; c.lineWidth = 1.3;
    c.beginPath(); if (cd.cap) c.rect(p[0] - r, p[1] - r, r * 2, r * 2); else c.arc(p[0], p[1], r, 0, 6.3); c.fill(); c.stroke(); if (cd.cap) { c.fillStyle = '#fff'; c.fillRect(p[0] - 1.2, p[1] - 1.2, 2.4, 2.4); }
    c.globalAlpha = 1; nodes.push({ k: 'city', i: cd.i, x: p[0], y: p[1], r: r + 4 });
  }
  if (sel != null) { const p = proj3(C[sel].v); if (p) { c.strokeStyle = '#ffd24a'; c.lineWidth = 2.2; c.beginPath(); c.arc(p[0], p[1], 10 + Math.sin(ts / 250) * 2, 0, 6.3); c.stroke(); } }
  if (!S) return;
  for (let i = 0; i < C.length; i++) { const cs = S.city[i]; if (!cs.occ) continue; const p = proj3(C[i].v); if (!p) continue; c.strokeStyle = '#000a'; c.lineWidth = 5; c.beginPath(); c.arc(p[0], p[1], 14, 0, 6.3); c.stroke(); c.strokeStyle = T[cs.occ.by].color; c.lineWidth = 3; c.beginPath(); c.arc(p[0], p[1], 14, -1.57, -1.57 + 6.283 * cs.occ.prog); c.stroke(); }
  // flèches d’offensive : itinéraires de vos formations, prochaine étape des ennemis en guerre
  for (const a of S.armies) {
    if (!a.path.length) continue; const mine = a.o === pl, isSel = a === selArmy || selSet.includes(a); if (!mine && !(atWar(pl, a.o) && cam.h < .6)) continue; if (mine && !isSel && cam.h > 1.6) continue;
    const pts = pathPts(a, mine ? 60 : 1); c.strokeStyle = c.fillStyle = isSel ? '#ffd24a' : mine ? 'rgba(255,255,255,.75)' : 'rgba(255,90,80,.8)'; c.lineWidth = isSel ? 2.4 : 1.5; c.setLineDash(isSel ? [] : [5, 4]); polyline(c, pts); c.setLineDash([]); arrowHead(c, pts);
  }
  if (selTile >= 0) { const p = proj3(TL[selTile].v); if (p) { c.strokeStyle = '#ffd24a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(p[0] - 6, p[1]); c.lineTo(p[0] + 6, p[1]); c.moveTo(p[0], p[1] - 6); c.lineTo(p[0], p[1] + 6); c.stroke(); } }
  if (cam.h < .5) for (const k in S.tb) { const p = proj3(TL[k].v); if (!p || p[0] < 0 || p[0] > cw || p[1] < 0 || p[1] > ch) continue; if (near) { gfxTB(c, S.tb[k], p[0], p[1], ts); nodes.push({ k: 'tb', i: +k, x: p[0], y: p[1] - 3, r: 9 }); continue; } c.fillStyle = S.tb[k].tfort ? '#c0c6cc' : S.tb[k].tdep ? '#e3b341' : '#8fbf6a'; c.strokeStyle = '#0b0f14'; c.lineWidth = 1; c.beginPath(); c.moveTo(p[0], p[1] - 4); c.lineTo(p[0] + 4, p[1]); c.lineTo(p[0], p[1] + 4); c.lineTo(p[0] - 4, p[1]); c.closePath(); c.fill(); c.stroke(); nodes.push({ k: 'tb', i: +k, x: p[0], y: p[1], r: 6 }); }
  for (let i = 0; i < NC; i++) { const m = S.city[i].mn; if (!m) continue; const p = proj3(C[i].v); if (!p) continue; c.fillStyle = T[m.o].color; c.strokeStyle = '#000'; c.lineWidth = 1; for (let k = 0; k < Math.min(3, m.q); k++) { c.beginPath(); c.arc(p[0] + 11 + k * 6, p[1] + 8, 2.4, 0, 6.3); c.fill(); c.stroke(); } }
  const stack = {};
  if (near) {
    // vue rapprochée : silhouettes rangées sous la ville (amis à gauche, ennemis à droite), combats animés
    const z = gz(), byN = new Map();
    for (const a of S.armies) {
      const p = proj3(armyV(a)); if (!p || p[0] < -60 || p[0] > cw + 60 || p[1] < -60 || p[1] > ch + 60) continue;
      const mv = a.path.length && a.prog > 0, key = mv ? 'm' + a.id : aNode(a); let g = byN.get(key); if (!g) byN.set(key, g = { l: [], p, mv, node: aNode(a) }); g.l.push(a);
    }
    for (const g of byN.values()) {
      const first = g.l[0].o, foe = a => a.o !== first && atWar(a.o, first); g.l.sort((a, b) => foe(a) - foe(b));
      const inCity = g.node < NC && !g.mv, wds = g.l.map(a => Math.max(1, armyFigs(a).length) * 17 * z * 1.05 + 5), fight = g.l.some(a => a.hit != null && S.day - a.hit <= 1) && g.l.some(foe);
      const perRow = 4, sides = [[], []]; let i = 0;
      while (i < g.l.length) {
        const row = g.l.slice(i, i + perRow), rw = wds.slice(i, i + perRow), tot = rw.reduce((s, v) => s + v + 5, -5) + (fight ? 14 * z : 0); let x = g.p[0] - tot / 2; const y = g.p[1] + (inCity ? 21 * z : 6 * z) + Math.floor(i / perRow) * 21 * z;
        row.forEach((a, k) => { if (fight && k > 0 && foe(a) && !foe(row[k - 1])) x += 14 * z; const cx = x + rw[k] / 2; let dir = 1; if (g.mv) { const q = proj3(nV(a.path[0])); if (q && q[0] < g.p[0] - 1) dir = -1; } else if (fight) dir = foe(a) ? -1 : 1;
          const r = gfxUnit(c, a, cx, y, ts, dir); nodes.push({ k: 'army', a, x: cx, y: y - r.ht / 2, r: Math.max(r.hw, r.ht * .7) }); if (fight) for (const gn of r.guns) sides[foe(a) ? 1 : 0].push(gn); x += rw[k] + 5; });
        i += perRow;
      }
      if (fight) gfxBattle(c, sides, g.p[0], g.p[1] + (inCity ? 12 * z : 0), ts, g.node);
      else if (inCity && S.city[g.node].occ && atWar(first, S.city[g.node].o)) { const guns = []; g.l.forEach((a, k) => guns.push([g.p[0] + (k - (g.l.length - 1) / 2) * 20 * z, g.p[1] + 12 * z, a.u[UI.art] > 0 ? 'art' : 'x'])); gfxBattle(c, [guns, [[g.p[0], g.p[1] - 6 * z, 'x']]], g.p[0], g.p[1], ts, g.node); }
    }
  } else
  for (const a of S.armies) {
    const rel = a.o === pl || atWar(pl, a.o) || a === selArmy; if (!rel && cam.h > .35) continue;
    const p = proj3(armyV(a)); if (!p || p[0] < -30 || p[0] > cw + 30 || p[1] < -30 || p[1] > ch + 30) continue;
    let y = p[1] - (a.tl >= 0 ? 4 : 16); if (!a.path.length || a.prog === 0) { const nn = aNode(a), k = stack[nn] = (stack[nn] || 0) + 1; y -= (k - 1) * 14; }
    const sz = clamp(6 + Math.sqrt(apow(a)) * .9, 7, 16); unitIcon(c, a, p[0], y, sz); nodes.push({ k: 'army', a, x: p[0], y, r: sz + 3 });
  }
  // animations : missiles, frappes, explosions
  const now = performance.now();
  for (let i = FX.length - 1; i >= 0; i--) {
    const f = FX[i], k = (now - f.t0) / f.dur; if (near) { if (k > gfxFX(c, f, k, now)) FX.splice(i, 1); continue; } if (k > 1.6) { FX.splice(i, 1); continue; }
    const A = C[f.a].v, B = C[f.b].v, d = Math.acos(clamp(A[0] * B[0] + A[1] * B[1] + A[2] * B[2], -1, 1)), hgt = f.k === 'missile' ? Math.min(.15, d * .25) : d * .05;
    if (k <= 1) { const pts = []; for (let s = 0; s <= 40 * k; s++) { const t = s / 40, v = slerp(A, B, t), r = 1 + hgt * Math.sin(Math.PI * t); pts.push([v[0] * r, v[1] * r, v[2] * r]); } c.strokeStyle = f.col; c.lineWidth = f.k === 'missile' ? 2 : 1.4; polyline(c, pts); const head = pts[pts.length - 1], hp = head && proj3(head); if (hp) { c.fillStyle = '#fff'; c.beginPath(); c.arc(hp[0], hp[1], 2.5, 0, 6.3); c.fill(); } }
    else if (f.hit !== false) { const p = proj3(B); if (p) { const e = (k - 1) / .6, r = (f.nuke ? 60 : 18) * e + 4; c.fillStyle = `rgba(255,${f.nuke ? 240 : 150},80,${1 - e})`; c.beginPath(); c.arc(p[0], p[1], r, 0, 6.3); c.fill(); } }
  }
}
function nodeAt(mx, my) { let b = null, bd = 1e9; for (const n of nodes) { const d = Math.hypot(n.x - mx, n.y - my); if (d < n.r && d < bd + (n.k === 'army' ? 6 : 0)) { if (!b || n.k === 'army' || d < bd) { b = n; bd = d; } } } return b; }
function tileUnder(mx, my) { const ll = s2ll(mx, my); if (!ll) return 0; return tileAt(ll[0], ll[1]); }
