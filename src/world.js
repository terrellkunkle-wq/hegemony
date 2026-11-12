// ====================================================================
//  Monde : nations, villes (5 à 20), provinces issues du découpage RoN
// ====================================================================
const W = 4096, H = 2048, LW = 128;  // raster des provinces, largeur des tables de couleur
const T = [], C = [], TL = []; let TILE = null, ELEV = null, worldPop = 0;
const IMG = {};
// graphe de déplacement : nœuds 0..NC-1 = villes, NC+i = province i (« en campagne »)
let NC = 0, NA = [], RIVERS = [];
const nCity = n => n < NC ? n : TL[n - NC].c;
const nV = n => n < NC ? C[n].v : TL[n - NC].v;
const nLL = n => n < NC ? C[n] : TL[n - NC];
const nTer = n => n < NC ? C[n].tm : TL[n - NC].tm;
const nName = n => n < NC ? C[n].name : 'province n° ' + (n - NC + 1) + ' (' + C[TL[n - NC].c].name + ')';
const aNode = a => a.tl >= 0 ? NC + a.tl : a.at;
function b64bytes(id) { const s = atob($(id).textContent.trim()), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
async function gunzip(u8) {
  if (typeof DecompressionStream === 'undefined') throw new Error('Navigateur trop ancien : DecompressionStream indisponible');
  const st = new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip')); return new Uint8Array(await new Response(st).arrayBuffer());
}
function loadImg(id) { return new Promise((ok, ko) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ko(new Error('image ' + id)); im.src = 'data:image/jpeg;base64,' + $(id).textContent.trim(); }); }
const v3 = (lon, lat) => { const a = lon * Math.PI / 180, b = lat * Math.PI / 180, c = Math.cos(b); return [c * Math.sin(a), Math.sin(b), c * Math.cos(a)]; };
function dist(a, b) { const r = Math.PI / 180, dl = (b.lat - a.lat) * r, dn = (b.lon - a.lon) * r, h = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dn / 2) ** 2; return 12742 * Math.asin(Math.sqrt(Math.min(1, h))); }
const tileAt = (lon, lat) => { let x = Math.floor((lon + 180) / 360 * W); x = ((x % W) + W) % W; const y = clamp(Math.floor((90 - lat) / 180 * H), 0, H - 1); return TILE[y * W + x]; };
// agrégats de ressources d’une ville d’après ses provinces (recalculés après une découverte géologique)
function cityRes(c) {
  c.rInc = 0; c.rMat = 0; c.rSci = 0; c.rMp = 0; c.minerai = 0; c.area = 0; c.oil = 0; c.coal = 0; c.rare = 0; c.urn = 0; c.cer = 0;
  const own = typeof S !== 'undefined' && S && S.tow && S.city[c.i] ? S.city[c.i].o : -1;
  for (const ti of c.tiles) { if (own >= 0 && S.tow[ti] !== own) continue; const r = TL[ti].res; c.area += TL[ti].area; if (r === 'petrole') { c.rInc += .6; c.oil = 1; } else if (r === 'gaz') { c.rInc += .4; c.coal = 1; } else if (r === 'minerai') { c.rMat += .6; c.minerai = 1; } else if (r === 'bois') c.rMat += .3; else if (r === 'rare') { c.rSci += .6; c.rare = 1; } else if (r === 'cereales') { c.rMp += .05; c.cer++; } else if (r === 'charbon') { c.rMat += .2; c.coal = 1; } else if (r === 'uranium') c.urn = 1; }
}
async function loadWorld(progress) {
  const D = GAMEDATA;
  progress('Décompression des provinces…');
  const raw = await gunzip(b64bytes('A_tiles')); TILE = new Uint16Array(raw.buffer, raw.byteOffset, raw.byteLength / 2);
  D.meta.forEach((m, i) => { T.push({ i, meta: m, name: m.n, cities: [], tiles: [], capC: -1, area: 0, lon: 0, lat: 0, color: `hsl(${(i * 137.508) % 360 | 0},${50 + (i % 3) * 10}%,${44 + (i % 4) * 5}%)` }); worldPop += m.p; });
  D.cities.forEach((c, i) => { const o = { i, name: c[0], t: c[1], lon: c[2], lat: c[3], pk: c[4], cap: !!c[5], co: !!c[6], cell: c[7] - 1, fl: c[8] || 0, ed: [], tiles: [] }; o.v = v3(o.lon, o.lat); C.push(o); T[o.t].cities.push(i); if (o.cap) T[o.t].capC = i; });
  D.tiles.forEach((t, i) => { const o = { i, t: t[0], c: t[1], lon: t[2], lat: t[3], area: t[4], bio: BKEYS[t[5]], rel: t[6], elev: t[7], res: t[8], res0: t[8], co: !!t[9], riv: 0, adj: [], cs: [] }; o.v = v3(o.lon, o.lat); o.tm = mergeTer(BIOME[o.bio], RELIEF[o.rel]); TL.push(o); T[o.t].tiles.push(i); C[o.c].tiles.push(i); T[o.t].area += o.area; });
  for (const e of D.edges) { C[e[0]].ed.push([e[1], e[2], e[3]]); C[e[1]].ed.push([e[0], e[2], e[3]]); }
  for (const i of D.riv || []) if (TL[i]) TL[i].riv = 1;
  RIVERS = (D.rivers || []).map(l => { const o = []; for (let i = 0; i < l.length; i += 2) o.push(v3(l[i], l[i + 1])); o.lon = l[0]; o.lat = l[1]; return o; });
  NC = C.length; NA = Array.from({ length: NC + TL.length }, () => []);
  const uf = new Int32Array(NC + TL.length).map((_, i) => i), find = x => { while (uf[x] !== x) x = uf[x] = uf[uf[x]]; return x; };
  const link = (a, b, k, d) => { NA[a].push([b, k, d]); NA[b].push([a, k, d]); if (!k) uf[find(a)] = find(b); };
  for (const [a, b] of D.tadj) { const x = TL[a - 1], y = TL[b - 1]; if (!x || !y) continue; x.adj.push(b - 1); y.adj.push(a - 1); link(NC + a - 1, NC + b - 1, 0, Math.max(8, Math.round(dist(x, y)))); }
  for (const c of C) if (TL[c.cell]) TL[c.cell].cs.push(c.i);
  for (const c of C) if (TL[c.cell]) link(c.i, NC + c.cell, 0, Math.round(5 + Math.min(40, .25 * dist(c, TL[c.cell]))));   // la ville est dans sa province : accès court
  for (const e of D.edges) if (e[2]) link(e[0], e[1], e[2], e[3]);
  for (const e of D.sea2 || []) link(e[0], e[1], 2, e[2]);   // 2 = route côtière, réservée aux flottes   // routes côtières calculées sur l’eau réelle
  { // villes côtières restées sans route maritime (bases polaires, îles) : reliées aux trois ports les plus proches
    const hub = C.filter(c => c.co && NA[c.i].some(e => e[1]));
    for (const c of C) { if (!c.co || NA[c.i].some(e => e[1])) continue; hub.map(h => [h, dist(c, h)]).sort((x, y) => x[1] - y[1]).slice(0, 3).forEach(([h, d]) => link(c.i, h.i, 1, Math.round(d * 1.25))); } }
  { // mers fermées et archipels coupés du reste : rattachés au réseau principal par leur port le plus proche
    const co = C.filter(c => c.co), comp = new Int32Array(NC).fill(-1); let k = 0; const sz = [];
    for (const c of co) { if (comp[c.i] >= 0) continue; const q = [c.i]; comp[c.i] = k; let n = 0; while (q.length) { const u = q.pop(); n++; for (const e of NA[u]) if (e[1] && e[0] < NC && comp[e[0]] < 0) { comp[e[0]] = k; q.push(e[0]); } } sz.push(n); k++; }
    const main = sz.indexOf(Math.max(...sz)), mainC = co.filter(c => comp[c.i] === main);
    for (let q = 0; q < k; q++) { if (q === main) continue; let best = null; for (const c of co) if (comp[c.i] === q) for (const m of mainC) { const d = dist(c, m); if (!best || d < best[2]) best = [c.i, m.i, d]; } if (best) link(best[0], best[1], 2, Math.round(best[2] * 1.3)); } }
  for (const e of D.edges) if (!e[2] && find(e[0]) !== find(e[1])) link(e[0], e[1], 0, e[3]);  // liaisons terrestres que le maillage ne couvre pas
  for (const t of T) {
    if (t.capC < 0) t.capC = t.cities[0];
    let x = 0, y = 0, z = 0; for (const ti of t.tiles) { const v = v3(TL[ti].lon, TL[ti].lat), a = TL[ti].area; x += v[0] * a; y += v[1] * a; z += v[2] * a; }
    if (t.tiles.length) { t.lon = Math.atan2(x, z) * 180 / Math.PI; t.lat = Math.atan2(y, Math.hypot(x, z)) * 180 / Math.PI; } else { t.lon = C[t.capC].lon; t.lat = C[t.capC].lat; }
    // villes d’origine : part de la population nationale ; villes ajoutées (fl > 0) : population réelle
    let ws = 0, xs = 0; for (const ci of t.cities) { const c = C[ci]; if (c.fl) { c.w = (c.fl === 2 ? .001 : c.pk / 1000) / Math.max(.01, t.meta.p); xs += c.w; } else { c.w = Math.pow(c.pk, .6) * (c.cap ? 1.4 : 1); ws += c.w; } } for (const ci of t.cities) if (!C[ci].fl) C[ci].w *= Math.max(.5, 1 - xs) / ws;
  }
  for (const c of C) {
    const tt = TL[c.cell] || TL[c.tiles[0]]; c.ter = tt ? tt.bio : 'plaine'; c.rel = tt ? tt.rel : 0; c.tm = mergeTer(BIOME[c.ter], RELIEF[c.rel]);
    cityRes(c);
  }
  initV6World();
  progress('Chargement de l’imagerie satellite…');
  for (const k of ['day', 'elev', 'water', 'night', 'clouds']) IMG[k] = await loadImg('A_' + k);
  { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(IMG.elev, 0, 0, W, H); const d = x.getImageData(0, 0, W, H).data; ELEV = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) ELEV[i] = d[i * 4]; }
}
