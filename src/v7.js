// =====================================================================
// v7 : niveaux technologique et d’expérience nationaux, recherche financée, force militaire et indice de puissance,
//      monnaie et crédit dollar, satellites, calibrage des forces initiales, coût des unités lourdes, garnisons
// =====================================================================
const EU27 = ['AUT', 'BEL', 'BGR', 'HRV', 'CYP', 'CZE', 'DNK', 'EST', 'FIN', 'FRA', 'DEU', 'GRC', 'HUN', 'IRL', 'ITA', 'LVA', 'LTU', 'LUX', 'MLT', 'NLD', 'POL', 'PRT', 'ROU', 'SVK', 'SVN', 'ESP', 'SWE'];
const EUROPE7 = EU27.concat(['GBR', 'NOR', 'CHE', 'ISL']);
const EUROZ = ['AUT', 'BEL', 'HRV', 'CYP', 'EST', 'FIN', 'FRA', 'DEU', 'GRC', 'IRL', 'ITA', 'LVA', 'LTU', 'LUX', 'MLT', 'NLD', 'PRT', 'SVK', 'SVN', 'ESP', 'MNE', 'XKX', 'AND', 'MCO', 'SMR', 'VAT'];
const PETRO = ['SAU', 'ARE', 'QAT', 'KWT', 'OMN', 'BHR'];
const TL0 = { USA: 3, ISR: 3, KOR: 3, JPN: 3, TWN: 2.8, CHN: 2, RUS: 2, PRK: 2, FRA: 2.5, GBR: 2.5, DEU: 2.4, SWE: 2.3, CAN: 2.4, AUS: 2.4, TUR: 1.6, IND: 1.6, IRN: 1.5, PAK: 1.4 };
const XL0 = { USA: 3, ISR: 3, RUS: 3, UKR: 2.6, FRA: 1.6, GBR: 1.6, TUR: 1.4, IRN: 1.4, PAK: 1.4, IND: 1.4 };
// satellites militaires et d’observation au départ : les États-Unis dominent, puis la Russie, la Chine et l’Europe
const SAT0 = { USA: 160, RUS: 75, CHN: 60, FRA: 14, GBR: 10, DEU: 9, ITA: 7, ESP: 5, NLD: 2, SWE: 2, POL: 1, BEL: 1, FIN: 1, JPN: 8, ISR: 6, IND: 6, KOR: 4, CAN: 3, AUS: 2, TUR: 2, IRN: 1, PAK: 1, BRA: 1, ARE: 2, SAU: 2, PRK: 1, EGY: 1 };
// force militaire initiale (part du total mondial)
const MILSH = { USA: .30, CHN: .18, RUS: .10, IND: .10, '@EU': .08 };
const curOf = a => a === 'USA' ? 2.25 : EUROZ.includes(a) ? 1.15 : a === 'CHN' ? 1.08 : (a === 'JPN' || a === 'GBR' || a === 'CHE') ? 1.05 : 1;
const curName = a => a === 'USA' ? 'dollar' : EUROZ.includes(a) ? 'euro' : a === 'CHN' ? 'renminbi' : a === 'JPN' ? 'yen' : a === 'GBR' ? 'livre sterling' : a === 'CHE' ? 'franc suisse' : 'monnaie nationale';
const isoOf = id => T[id].meta.a;

// ---------- multiplicateurs de combat ----------
const techM = n => 1 + .35 * ((n.tl || 1) - 1), xpM = n => 1 + .25 * ((n.xl || 1) - 1);
const milM = o => { const n = S.nat[o]; return techM(n) * xpM(n); };
const vetM = a => 1 + .2 * Math.min(1, (a.xp || 0) / 100);
const intelL = n => Math.min(1.2, Math.log10(1 + (n.sat || 0)) / Math.log10(151));
const intelB = (n, o) => hasIntel(n, o) ? .05 + .15 * Math.min(1, intelL(n)) : 0;
// les générations d’équipement sont remplacées par le niveau technologique national
for (const k of ['gI', 'gB', 'gA', 'gN', 'gD']) delete TECH[k];

// ---------- coût et délai des unités lourdes ----------
for (const u of UN) {
  if (u.cat === 'Strat') { u.c *= 2; u.m *= 2; u.bt = { csg: 365, nbomb: 240, vsx: 730 }[u.k] || 365; u.heavy = 1; continue; }
  if (u.k === 'brise') { u.bt = 60; continue; }
  if (u.att > 3.5) { const k = Math.log2(u.att / 3); u.c = Math.round(u.c * (1 + .6 * k)); u.m = Math.round(u.m * (1 + .6 * k) * 10) / 10; u.bt = Math.round(u.bt * (1 + .5 * k)); if (u.att >= 5) u.heavy = 1; }
}
// surcoût d’accumulation : +10 % par exemplaire déjà possédé ou en production
function ownedU(id, j) { let s = 0; for (const a of S.armies) if (a.o === id) s += a.u[j] + (a.sup && a.sup[UN[j].k] ? 0 : 0) + (a.cg && a.cg[UN[j].k] || 0); for (const x of S.q) if (x.o === id && x.j === j) s += x.q; return s; }
const stockM = (n, j) => UN[j].heavy ? 1 + .1 * ownedU(n.id, j) : 1;

// ---------- monnaie, PIB et crédit dollar ----------
const gdpM = n => Math.max(0, n.inc) * 365 / .3;   // PIB exprimé en monnaie de jeu (recettes ≈ 30 % du PIB)
const dCredit = n => n.cur > 2 ? Math.max(0, gdpM(n) - (n.ddebt || 0)) : 0;
const spendable = n => n.money + dCredit(n);
function payM(n, c) { if (n.money >= c || !(n.cur > 2)) { n.money -= c; return; } const r = c - Math.max(0, n.money); n.money = Math.min(n.money, 0); n.ddebt = (n.ddebt || 0) + r; }

// ---------- initialisation de partie ----------
function v7Init() {
  for (const n of S.nat) {
    const a = isoOf(n.id); n.tl = TL0[a] || (EUROPE7.includes(a) ? 2 : 1); n.xl = XL0[a] || 1; n.tlD = R(10, 15); n.xlW = {}; n.lastWar = 0;
    n.rd = n.id === S.player ? 2.5 : 2 + Math.min(2, (n.aggr || 1) - .5) + (n.tl >= 2.5 ? .5 : 0); n.rd = clamp(Math.round(n.rd * 10) / 10, 1.5, 4);
    n.cur = curOf(a); n.ddebt = 0; n.sat = SAT0[a] || 0; n.satQ = [];
  }
  garTick();   // garnisons d’abord : elles comptent dans le calibrage
  if (!S.active) calibrateMil();
  initLocks();
  recompute();
  for (const n of S.nat) { const a = isoOf(n.id), b = a === 'USA' ? 1 : PETRO.includes(a) ? 1.5 : EU27.includes(a) ? .5 : 0; if (b) { n.money += Math.max(0, n.inc) * 365 * b; n.bonus7 = b; } }
  powTick();
}
function unitForce(id) { let s = 0; for (const a of S.armies) if (a.o === id) s += apow(a); return s * milM(id); }
function calibrateMil() {
  const F = S.nat.map(n => n.alive ? unitForce(n.id) : 0), tot = F.reduce((x, y) => x + y, 0); if (!tot) return;
  const grp = id => { const a = isoOf(id); return MILSH[a] != null ? a : EU27.includes(a) ? '@EU' : '@rest'; }, cur = {};
  S.nat.forEach((n, i) => { const g = grp(n.id); cur[g] = (cur[g] || 0) + F[i] / tot; });
  const rest = 1 - Object.values(MILSH).reduce((x, y) => x + y, 0), fac = {};
  for (const g in cur) fac[g] = (g === '@rest' ? rest : MILSH[g]) / cur[g];
  for (const a of S.armies) { const f = fac[grp(a.o)]; if (!f || f === 1) continue; for (let j = 0; j < NU; j++) if (a.u[j] && UN[j].cat !== 'Strat') a.u[j] *= f; }
  // la mobilisation suit : effectifs mobilisables et entretien ajustés pour ne pas ruiner les nations renforcées
  for (const n of S.nat) { const f = fac[grp(n.id)]; if (f > 1) { n.mpCap = (n.mpCap || 0) * Math.sqrt(f); n.upRelief = 1 - 1 / Math.sqrt(f); } }
  // scénario « Grandes puissances » : le bonus de forces de départ s’applique après le calibrage
  for (const a of S.armies) { const s = S.nat[a.o].scn; if (s && s.army && s.army !== 1) for (let j = 0; j < NU; j++) if (a.u[j] && UN[j].cat !== 'Strat') a.u[j] *= s.army; }
  S.milCal = Object.fromEntries(Object.entries(fac).map(([g, f]) => [g, Math.round(f * 100) / 100]));
}

// ---------- force militaire et indice de puissance ----------
function misForce(n) { let s = 0; for (const m of MIS) if (m.k !== 'nuke' && m.k !== 'sam') s += (n.ms[m.k] || 0) * 1.5; return s; }
function powTick() {
  const al = S.nat.filter(n => n.alive), mx = k => Math.max(1e-9, ...al.map(k));
  for (const n of al) { let g = 0; for (const ci of n.cities) g += S.city[ci].gdp || 0; n.gdp = g; }
  const mS = mx(n => n.str), mG = mx(n => n.gdp * n.cur), mP = mx(n => n.pop), mA = mx(n => n.area), f = (v, w) => Math.pow(Math.max(.001, v), w);
  for (const n of al) n.pwr = 100 * f(n.str / mS, .40) * f(n.gdp * n.cur / mG, .25) * f((n.tl || 1) / 4, .10) * f(n.pop / mP, .10) * f(n.area / mA, .05) * f(intelL(n) / 1.2, .05) * f((n.stab || 50) / 100, .05);
  for (const n of al) { let e = n.pwr; for (const m of al) { if (m.id === n.id) continue; const w = n.fac && n.fac === m.fac ? .8 : n.ally[m.id] ? .5 : n.pact[m.id] ? .3 : 0; e += w * m.pwr; } n.pwrE = e; }
}

// ---------- recherche technologique : 10 à 15 ans par niveau, financée par un budget en % du PIB ----------
function labsOf(n) { let s = 0; for (const ci of n.cities) { const cs = S.city[ci]; s += (cs.lab || 0) + .5 * (cs.univ || 0); } return s; }
function techDay(n) {
  const cost = Math.max(0, n.inc) * n.rd * .05 * (S.cheat.free && n.id === S.player ? 0 : 1); let fund = 1;
  if (cost > 0) { if (spendable(n) >= cost) payM(n, cost); else { fund = Math.max(0, spendable(n)) / cost; payM(n, Math.max(0, spendable(n))); } }
  if ((n.tl || 1) >= 4) return; const yr = calY(); if (n.tl >= 3 && yr < 2050) return;
  if (S.day % 30 === n.id % 30 || n.labs == null) n.labs = labsOf(n);
  let sp = Math.min(2, (n.rd / 2.5) * fund * (1 + .1 * Math.min(10, n.labs / 4)));
  const fl = Math.floor(n.tl + 1e-9); if (S.tlMax > fl + 1 - 1e-9) sp /= .7;   // rattrapage : le niveau existe déjà ailleurs
  const t0 = n.tl; n.tl = Math.min(4, n.tl + sp * DPS / (n.tlD * 365));
  if (Math.floor(n.tl + 1e-9) > Math.floor(t0 + 1e-9)) { n.tlD = R(10, 15); if (n.id === S.player) addLog(`🔬 <b>Niveau technologique ${Math.floor(n.tl)}</b> atteint : vos unités gagnent en puissance (×${techM(n).toFixed(2)}).`, 2); else if (T[n.id].meta.g > 800) addLog(`🔬 ${chip(n.id)}<b>${nm(n.id)}</b> atteint le niveau technologique ${Math.floor(n.tl)}.`, 0, n.cap); }
}
// ---------- expérience militaire nationale ----------
const XPMAX = 3.5; let XPF = 1;
function cityArea(ci) { let a = 0; for (const t of C[ci].tiles) a += TL[t].area; return a; }
function xpConq(from, to, ci, f) {
  if (from === to || from == null || to == null) return; f *= XPF; const cs = S.city[ci], pop = cs.pop, ar = cityArea(ci), A = S.nat[to], B = S.nat[from];
  if (A && A.alive) { A.xlW = A.xlW || {}; const g0 = f * (.1 * pop / 10 + .1 * ar / 5e5) / (A.xl || 1), room = Math.max(0, .5 - (A.xlW[from] || 0)), g = Math.min(g0, room); A.xlW[from] = (A.xlW[from] || 0) + g; A.xl = Math.min(XPMAX, (A.xl || 1) + g); }
  if (B) B.xl = Math.max(1, (B.xl || 1) - f * (.08 * pop / 10 + .06 * ar / 5e5));
}
function xpBattle(gs) {
  for (const x of gs) {
    const n = S.nat[x.o]; if (!n || (n.xlB || -1) === S.day) continue; let E = 0, el = 0, k = 0; for (const y of gs) if (y !== x && atWar(x.o, y.o)) { E += y.land + y.air + y.sea; el += y.loss || 0; k++; }
    const me = x.land + x.air + x.sea; if (!k || me <= 0 || E <= me || (x.loss || 0) >= el / k) continue;
    n.xl = Math.min(XPMAX, (n.xl || 1) + .02 * Math.min(1, E / me - 1) / (n.xl || 1)); n.xlB = S.day;
  }
}
function xpDay(n) {
  if (Object.keys(n.war).length) { n.lastWar = S.day; return; }
  for (const k in n.xlW) if (!inWar(n.id, +k)) delete n.xlW[k];
  if (S.day - (n.lastWar || 0) > 3650 / DPS && n.xl > 1) n.xl = Math.max(1, n.xl - .02 * DPS / 365);
}
// ---------- satellites : programme soumis au temps, aux universités et à l’argent ----------
const univOf = n => { let s = 0; for (const ci of n.cities) s += S.city[ci].univ || 0; return s; };
function satTick(n) { if (!n.satQ || !n.satQ.length) return; const done = n.satQ.filter(d => d <= S.day).length; if (!done) return; n.satQ = n.satQ.filter(d => d > S.day); n.sat = (n.sat || 0) + done; needRecalc = true; if (n.id === S.player) addLog(`🛰 Satellite de reconnaissance mis en orbite : constellation de <b>${n.sat}</b> satellites (renseignement ${Math.round(intelL(n) / 1.2 * 100)} %).`, 2); }
// ---------- garnisons : jamais de ville sans troupes ----------
function garSplit(a) {
  if (a.sea || a.tl >= 0 || a.u[UI.vsx] >= .5) return; const ci = a.at, cs = S.city[ci]; if (!cs || cs.o !== a.o) return;
  for (const x of S.armies) if (x !== a && x.o === a.o && x.at === ci && x.tl < 0 && !x.sea && !x.path.length && aland(x) >= 1) return;
  const land = UN.map((u, j) => j).filter(j => UN[j].cl === 0 && !UN[j].sup && a.u[j] >= 1); if (!land.length) return;
  let tot = 0; for (const j of land) tot += a.u[j]; if (tot < 2) return;
  const j = land.includes(UI.inf) && a.u[UI.inf] >= 1 ? UI.inf : land.sort((x, y) => UN[x].att - UN[y].att)[0];
  const g = mkArmy(a.o, ci); g.u[j] = 1; a.u[j] -= 1; g.nm = 'Garnison de ' + C[ci].name; g.gar = 1; S.armies.push(g); needRecalc = true;
}
{ const _oM = orderMove; orderMove = function (a, to) { const at = a.at, tl = a.tl, r = _oM(a, to); if (r && a.path.length && tl < 0) { const p = a.path; a.at = at; garSplit(a); a.path = p; } return r; }; }
function garTick() {
  const has = new Set(), foe = new Set();
  for (const a of S.armies) { if (a.tl >= 0 || a.sea) continue; if (S.city[a.at].o === a.o && aland(a) >= .5) has.add(a.at); else if (atWar(a.o, S.city[a.at].o)) foe.add(a.at); }
  for (let ci = 0; ci < NC; ci++) {
    if (has.has(ci) || foe.has(ci)) continue; const cs = S.city[ci], n = S.nat[cs.o]; if (!n || !n.alive || !active(n.id) || cs.occ) continue;
    const c = UN[UI.inf].c * udisc(n); if (spendable(n) >= c) payM(n, c);
    const g = mkArmy(n.id, ci); g.u[UI.inf] = 1; g.nm = 'Garnison de ' + C[ci].name; g.gar = 1; S.armies.push(g);
  }
  needRecalc = true;
}
// ---------- IA : satellites et crédit dollar ----------
function ai7(n) {
  if (n.id === S.player && !S.auto) return;
  if (n.cur > 2 && Object.keys(n.war).length && n.money < 300 && dCredit(n) > 1000) { const d = Math.min(dCredit(n) * .03, 3000); n.money += d; n.ddebt = (n.ddebt || 0) + d; }
  if (n.money > 400 && (n.tl || 1) >= 1.5 && Math.random() < .3) { const sp = n.cities.find(ci => S.city[ci].spc >= 1); if (sp != null) buySat(n, sp); }
}
// ---------- tick v7 (quotidien) ----------
function v7Day() {
  if (S.day % 30 === 1) { S.tlMax = Math.max(...S.nat.filter(n => n.alive).map(n => n.tl || 1)); }
  for (const n of S.nat) { if (!n.alive || !active(n.id)) continue; if (n.tl == null) continue; techDay(n); xpDay(n); satTick(n); if (S.day % 30 === n.id % 30) ai7(n); }
  lockTick();
  if (S.day % 10 === 3) { garTick(); powTick(); }
}

// =====================================================================
// v7.1 — verrous stratégiques (scénario « Grandes puissances ») : les 3 villes les plus peuplées de la Russie,
// des États-Unis, du Japon, de l’Indonésie, de la Chine et de l’Inde deviennent des terres d’attrition pour l’envahisseur
// =====================================================================
const LOCKN = ['RUS', 'USA', 'JPN', 'IDN', 'CHN', 'IND'];
const LOCKF = 2.5;            // usure, entretien et consommation de l’envahisseur ×2,5
const LOCKCRUSH = 4;          // écrasement : forces d’invasion sur place ≥ 4 × (défenseurs + résistance potentielle)
const LOCKP = 5;              // une levée de résistance tous les 5 tours (20 jours)
function initLocks() {
  S.locks = {}; if (S.opts.scn !== 'gp') return;
  for (const a of LOCKN) { const id = T.findIndex(t => t.meta.a === a); if (id < 0) continue; for (const ci of S.nat[id].cities.slice().sort((x, y) => S.city[y].pop - S.city[x].pop).slice(0, 3)) S.locks[ci] = id; }
}
const lockOf = ci => S && S.locks && S.locks[ci] != null ? S.locks[ci] : null;
function lockTick() {
  if (!S.locks) return;
  for (const k in S.locks) {
    const ci = +k, o = S.locks[ci], O = S.nat[o], cs = S.city[ci]; if (!O.alive || !active(o)) continue;
    const nodes = new Set([ci]); for (const t of C[ci].tiles) nodes.add(NC + t);
    const inv = S.armies.filter(a => !a.sea && a.o !== o && atWar(a.o, o) && nodes.has(aNode(a)) && aland(a) >= .5);
    const held = cs.o !== o && atWar(cs.o, o);
    if (!inv.length && !held) { if (cs.lockOn != null) { if (o === S.player || inWar(o, S.player)) addLog(`🔓 <b>${C[ci].name}</b> est libérée : le verrou stratégique de ${nm(o)} n’est plus menacé.`, 2, ci); cs.lockOn = null; } continue; }
    const occ = held ? cs.o : inv[0].o, I = S.nat[occ];
    // avantage massif : les forces d’invasion sur place écrasent défenseurs et résistance potentielle (4 fois plus fortes)
    let invP = 0, defP = 10 * Math.sqrt(Math.max(.1, cs.pop)) * milM(o); for (const a of inv) invP += apow(a) * milM(a.o);
    for (const a of S.armies) if (a.o === o && !a.sea && nodes.has(aNode(a))) defP += apow(a) * milM(o);
    cs.lockCrush = invP >= LOCKCRUSH * defP ? 1 : 0; if (cs.lockCrush) continue;
    if (cs.lockOn == null) { cs.lockOn = S.day; if (o === S.player || occ === S.player || T[occ].meta.g > 2000) addLog(`🔒 <b>${C[ci].name}</b>, verrou stratégique de ${chip(o)}${nm(o)}, est envahie par ${chip(occ)}${nm(occ)} : usure, coûts et consommation de l’envahisseur ×${LOCKF}, levées de résistance jusqu’à la libération.`, o === S.player || occ === S.player ? 1 : 0, ci); }
    // usure, finances et ressources de l’envahisseur
    for (const a of inv) {
      if (S.cheat.god && a.o === S.player) continue; const n = S.nat[a.o]; let up = 0, fu = 0, men = 0;
      for (let j = 0; j < NU; j++) { if (!a.u[j] || UN[j].sup) continue; up += a.u[j] * UN[j].up; fu += a.u[j] * (UN[j].f || 0); men += a.u[j]; a.u[j] *= 1 - .004 * LOCKF; }
      n.money -= up * (LOCKF - 1); n.fuel = Math.max(0, (n.fuel || 0) - fu * .15 * (LOCKF - 1)); n.ammo = Math.max(0, (n.ammo || 0) - men * .004 * (LOCKF - 1)); n.food = Math.max(0, (n.food || 0) - men * .01 * (LOCKF - 1));
      a.mor = Math.max(0, (a.mor == null ? 80 : a.mor) - .5 * LOCKF);
    }
    // résistance : infanterie de défense jusqu’à la libération
    if ((S.day - cs.lockOn) % LOCKP === 0) {
      const q = Math.round(2 + 2 * Math.sqrt(Math.max(.1, cs.pop))); let g = S.armies.find(a => a.o === o && a.at === ci && a.tl < 0 && !a.sea && a.lockR);
      if (!g) { g = mkArmy(o, ci); g.nm = (LANGEN ? 'Resistance of ' : 'Résistance de ') + C[ci].name; g.lockR = 1; S.armies.push(g); }
      g.u[UI.inf] += q; needRecalc = true;
    }
  }
}
