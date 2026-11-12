// ====================================================================
//  Unités stratégiques : projection du contingent embarqué, rechargement,
//  emploi par les IA
// ====================================================================
const stratK = a => a.u[UI.vsx] >= .5 ? 'vsx' : a.u[UI.csg] >= .5 ? 'csg' : a.u[UI.nbomb] >= .5 ? 'nbomb' : null;
const STRATN = { csg: 'groupe aéronaval', nbomb: 'bombardier d’invasion', vsx: 'vaisseau spatial' };
function projRange(a) { const k = stratK(a); return k === 'vsx' ? 40000 : k ? 15000 : 0; }
// unités débarquables (les chasseurs du groupe aéronaval restent à bord)
function landCargo(a) { const o = {}; if (a.cg) for (const k in a.cg) if (UN[UI[k]].cl === 0 && a.cg[k] >= .5) o[k] = a.cg[k]; return o; }
function canProject(a, tgt) {
  const k = stratK(a); if (!k) return 'Cette formation n’a pas d’unité stratégique';
  const lc = landCargo(a); if (!Object.keys(lc).length) return 'Contingent déjà débarqué : rechargez-le dans une de vos villes';
  const d = cdist(a.at, tgt); if (d > projRange(a)) return 'Hors de portée (' + Math.round(d) + ' km / ' + projRange(a) + ' km)';
  if (k === 'csg' && !C[tgt].co) return 'Le groupe aéronaval ne débarque que sur une ville côtière';
  if (!passable(a.o, tgt)) return 'Destination interdite : il faut être en guerre ou allié';
  if (k === 'nbomb') { const w = wxOf(tgt); if (w && w.m.air === 0) return 'Largage impossible : météo'; }
  return '';
}
function project(a, tgt) {
  const e = canProject(a, tgt); if (e) return e; const k = stratK(a), cs = S.city[tgt], lc = landCargo(a);
  let loss = 0; if (k !== 'vsx' && atWar(a.o, cs.o)) { let AA = 6 * cs.dca; for (const x of S.armies) if (x.at === tgt && atWar(a.o, x.o)) for (let j = 0; j < NU; j++) AA += x.u[j] * UN[j].aa; loss = Math.min(.5, .06 + AA / (AA + 40) * .4) * (k === 'csg' ? .3 : .2); }
  if (S.cheat.god && a.o === S.player) loss = 0;
  const b = mkArmy(a.o, tgt); let tot = 0; for (const kk in lc) { b.u[UI[kk]] = lc[kk] * (1 - loss); tot += lc[kk]; delete a.cg[kk]; }
  b.xp = a.xp || 0; b.mor = 100; S.armies.push(b); needRecalc = true;
  FX.push({ k: 'drop', a: a.at, b: tgt, t0: performance.now(), dur: k === 'vsx' ? 1800 : 2600, col: T[a.o].color });
  if (a.o === S.player || cs.o === S.player || T[cs.o].meta.g > 2000) addLog(`${k === 'vsx' ? '🛸' : k === 'csg' ? '⚓' : '🪂'} ${chip(a.o)}<b>${nm(a.o)}</b> ${k === 'vsx' ? 'dépose depuis l’orbite' : k === 'csg' ? 'débarque' : 'largue'} ${fmt(tot)} unités sur <b>${C[tgt].name}</b>${loss ? ' (' + (loss * 100 | 0) + ' % de pertes)' : ''}.`, a.o === S.player ? 2 : 1, tgt);
  if (a === selArmy && a.o === S.player) { selArmy = b; sel = tgt; }
  return '';
}
// rechargement : reprend d’abord les unités de vos armées présentes, puis achète le reste
function reloadCost(a) { const n = S.nat[a.o], cap = cargoCap(a), d = udisc(n), miss = {}; let c = 0, m = 0, mp = 0, e = 0, free = {};
  for (const x of S.armies) if (x !== a && x.o === a.o && aNode(x) === aNode(a) && !x.sea && !stratK(x)) for (const k in cap) free[k] = (free[k] || 0) + x.u[UI[k]];
  for (const k in cap) { const need = Math.max(0, cap[k] - (a.cg && a.cg[k] || 0)), take = Math.min(need, free[k] || 0), buy = need - take, u = UN[UI[k]]; if (need < .5) continue; miss[k] = { need, take, buy }; c += buy * u.c * d; m += buy * u.m * d; mp += buy * u.men; e += buy * (u.e || 0); }
  return { miss, c, m, mp, e }; }
function canReload(a) { const cs = S.city[a.at]; if (a.tl >= 0 || cs.o !== a.o) return 'Le rechargement se fait dans une de vos villes'; const r = reloadCost(a); if (!Object.keys(r.miss).length) return 'Contingent complet'; const n = S.nat[a.o]; if (n.money < r.c || n.mat < r.m || n.mp < r.mp || n.comp < r.e) return 'Il faut ' + fmt(r.c) + ' 💰, ' + fmt(r.m) + ' ⛏, ' + fmt(r.mp * 1000) + ' 👥' + (r.e ? ', ' + fmt(r.e) + ' 🔩' : ''); return ''; }
function reload(a) {
  const e = canReload(a); if (e) return e; const n = S.nat[a.o], r = reloadCost(a); a.cg = a.cg || {};
  for (const k in r.miss) { let take = r.miss[k].take; const j = UI[k]; for (const x of S.armies) { if (take <= 0) break; if (x === a || x.o !== a.o || aNode(x) !== aNode(a) || x.sea || stratK(x)) continue; const t = Math.min(take, x.u[j]); x.u[j] -= t; take -= t; } a.cg[k] = (a.cg[k] || 0) + r.miss[k].need; }
  n.money -= r.c; n.mat -= r.m; n.mp -= r.mp; n.comp -= r.e; S.armies = S.armies.filter(x => x === a || adiv(x) >= .3); needRecalc = true; return '';
}
// ---------- IA ------------------------------------------------------------
function aiStrat(n, wars) {
  const id = n.id, d = udisc(n);
  if (n.money > 9000 && Math.random() < .02) { const ci = n.cities.find(c => !canRecruit(c, UI.csg)); if (ci != null && n.mp > 10) recruit(n, ci, UI.csg, 1); }
  if (n.money > 3000 && Math.random() < .02) { const ci = n.cities.find(c => !canRecruit(c, UI.nbomb)); if (ci != null) recruit(n, ci, UI.nbomb, 1); }
  for (const a of S.armies) {
    if (a.o !== id || !stratK(a) || a.path.length) continue;
    if (!Object.keys(landCargo(a)).length) { if (!canReload(a)) reload(a); else if (S.city[a.at].o !== id && Math.random() < .1) goHome(a); continue; }
    if (!wars.length || Math.random() > .08) continue;
    const tg = []; for (const w of wars) for (const ci of S.nat[w].cities) if (!canProject(a, ci)) tg.push(ci);
    if (tg.length) { tg.sort((x, y) => S.city[y].gdp - S.city[x].gdp); project(a, tg[Math.min(tg.length - 1, Math.floor(Math.random() * 3))]); }
  }
}
