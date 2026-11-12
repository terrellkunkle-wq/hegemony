// choix des villes v6 : régions vides de 13 pays, villes refuges des zones hostiles
const fs = require('fs'), zlib = require('zlib');
const all = require('all-the-cities');
const g = JSON.parse(fs.readFileSync('../../data/gamedata_v54.json'));
const ids = new Uint16Array(zlib.gunzipSync(fs.readFileSync('../../data/tiles_v54.bin.gz')).buffer.slice(0));
const W = 4096, H = 2048, meta = g.meta, tiles = g.tiles, cities = g.cities;
const R = Math.PI / 180, dist = (a, b, c, d) => { const p1 = b * R, p2 = d * R, dl = (c - a) * R; return 6371 * Math.acos(Math.max(-1, Math.min(1, Math.sin(p1) * Math.sin(p2) + Math.cos(p1) * Math.cos(p2) * Math.cos(dl)))); };
const tileAt = (lon, lat) => ids[Math.min(H - 1, Math.floor((90 - lat) / 180 * H)) * W + (Math.floor((lon + 180) / 360 * W) % W)] - 1;
const iso = {}; meta.forEach((m, i) => { if (m.a) iso[m.a] = i; });
const BK = ['plaine', 'steppe', 'savane', 'desert', 'foret', 'taiga', 'jungle', 'toundra'];
// ---- zones hostiles (même définition que dans le jeu : src/defs6.js) ----
function zoneOf(a, lon, lat, bio) {
  if (a === 'CAN' && lat > 58) return 1; if (a === 'GRL') return 1; if (a === 'USA' && lon < -130 && lat > 54) return 1; if ((a === 'NOR' || a === 'SWE' || a === 'FIN') && lat > 65) return 1;
  if (a === 'RUS' && lon > 60) return 2;
  if ((a === 'ARG' || a === 'CHL') && lat < -40) return 3;
  if (a === 'NAM' && (bio === 'desert' || lon < 17.5)) return 4; if (a === 'ZAF' && lat > -30 && lon < 20) return 4;
  if (a === 'AUS' && lat > -32 && lat < -18 && lon > 118 && lon < 146 && bio !== 'jungle' && bio !== 'foret') return 5;
  if (bio === 'desert' && lat > 15 && lat < 33 && lon > -18 && lon < 35 && ['DZA', 'LBY', 'EGY', 'MLI', 'NER', 'TCD', 'MRT', 'SDN', 'ESH', 'TUN', 'MAR'].includes(a)) return 6;
  if (bio === 'jungle' && lat > -15 && lat < 6 && lon > -80 && lon < -45 && ['BRA', 'PER', 'COL', 'VEN', 'BOL', 'ECU', 'GUY', 'SUR'].includes(a)) return 7;
  if (bio === 'jungle' && ['COD', 'COG', 'CMR', 'GAB', 'CAF', 'GNQ'].includes(a)) return 8;
  if (bio === 'jungle' && a === 'IDN') return 9;
  if (['SAU', 'YEM', 'OMN', 'ARE', 'QAT', 'KWT', 'IRN', 'IRQ', 'SYR'].includes(a) && (bio === 'desert' || bio === 'steppe')) return 10;
  return 0;
}
const tz = tiles.map(t => zoneOf(meta[t[0]].a, t[2], t[3], BK[t[5]]));
// candidats réels : localités de la base, rattachées à une province du bon pays
const byC = {}; for (const c of all) { const [lon, lat] = c.loc.coordinates, t = tileAt(lon, lat); if (t < 0 || !tiles[t]) continue; const a = meta[tiles[t][0]].a2; if (a !== c.country) continue; (byC[tiles[t][0]] = byC[tiles[t][0]] || []).push({ n: c.name, lon, lat, p: c.population, t }); }
const placed = cities.map(c => [c[2], c[3], c[1]]), out = [], used = new Set(cities.map(c => c[0]));
const nearAny = (lon, lat, km) => placed.some(q => dist(lon, lat, q[0], q[1]) < km);
function add(ti, c, flag) { c.n = c.n.replace(/^Isle of /, '').replace(/ (County Borough|District|Municipality|City)$/, ''); if (used.has(c.n)) return; out.push([c.n, meta[ti].a, +c.lon.toFixed(3), +c.lat.toFixed(3), Math.max(5, Math.round(c.p / 1000)), flag]); placed.push([c.lon, c.lat, ti]); used.add(c.n); }
// 1. régions vides : chaque province sans ville reçoit sa plus grande localité réelle (2 si la province est vaste)
const EMPTY = ['CHN','IND','RUS','BRA','COD','COG','IDN','MEX','DEU','FRA','GBR','ESP','PAK'];
const log = {}; const hasC = new Set(cities.map(c => tileAt(c[2], c[3])));
for (const a of EMPTY) {
  const ti = iso[a]; log[a] = [0, 0];
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i][0] !== ti || hasC.has(i)) continue; log[a][1]++;
    const cand = (byC[ti] || []).filter(c => c.t === i && !used.has(c.n)).sort((x, y) => y.p - x.p);
    let k = 0; const want = tiles[i][4] > 150000 ? 2 : 1;
    for (const c of cand) { if (k >= want) break; if (nearAny(c.lon, c.lat, k ? 200 : 45)) continue; add(ti, c, 0); k++; }
    if (k) { log[a][0]++; hasC.add(i); }
  }
}
// 2. refuges : 2 à 5 par nation selon l’étendue de sa zone hostile
const ZN = ['', 'Arctique', 'Sibérie', 'Patagonie', 'Namib', 'Outback', 'Sahara', 'Amazonie', 'Congo', 'Bornéo-Sumatra', 'Arabie-Iran'];
const zArea = {}; tiles.forEach((t, i) => { if (tz[i]) zArea[t[0]] = (zArea[t[0]] || 0) + t[4]; });
const ref = [];
for (const ti in zArea) {
  const A = zArea[ti]; if (A < 80000) continue; const want = A > 3e6 ? 5 : A > 1e6 ? 4 : A > 3e5 ? 3 : 2; let k = 0;
  const cand = (byC[ti] || []).filter(c => tz[c.t] && !used.has(c.n)).sort((x, y) => y.p - x.p);
  for (const c of cand) { if (k >= want) break; if (nearAny(c.lon, c.lat, 220)) continue; add(+ti, c, 4); k++; }
  // zones sans localité recensée : repli sur des localités plus proches des villes existantes
  if (k < 2) for (const c of cand) { if (k >= 2) break; if (used.has(c.n) || nearAny(c.lon, c.lat, 60)) continue; add(+ti, c, 4); k++; }
  ref.push(meta[ti].n + ' ' + k + '/' + want + ' (' + Math.round(A / 1000) + ' k km²)');
}
fs.writeFileSync('extra6.json', JSON.stringify(out));
console.log('villes de régions vides', out.filter(x => x[5] === 0).length, '| refuges', out.filter(x => x[5] === 4).length);
console.log(Object.entries(log).map(([a,v])=>a+' '+v[0]+'/'+v[1]).join(' · ')); console.log(ref.join(' · '));
// provinces vastes sans localité recensée : bourgs réels placés au centre de la province
const HAND = { 245: 'Golomianny', 248: 'Tcheliouskine', 260: 'Sopotchnaïa Karga', 341: 'Rousskaïa Gavan', 343: 'Seïakha', 346: 'Kotelny', 356: 'Sabetta', 357: 'Gyda', 456: 'Severny', 488: 'Belouchia Gouba', 1092: 'Djankoï',
  2274: 'Surucucu', 2301: 'Oiapoque', 2341: 'Japurá', 2410: 'Ipixuna', 2597: 'Assis Brasil', 2331: 'Bomongo', 2468: 'Mushie', 2478: 'Kole', 2546: 'Panzi', 2565: 'Kapanga', 2345: 'Mbomo', 2379: 'Pokola', 2282: 'Sinnamary', 2297: 'Maripasoula', 2300: 'Saül' };
for (const k in HAND) { const t = tiles[k]; if (hasC.has(+k) || used.has(HAND[k])) continue; add(t[0], { n: HAND[k], lon: t[2], lat: t[3], p: k == 1092 ? 38000 : 5000 }, 0); hasC.add(+k); }
fs.writeFileSync('extra6.json', JSON.stringify(out)); console.log('total', out.length);
