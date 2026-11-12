// ====================================================================
//  Moteur : économie, diplomatie, mouvements, combats, missiles, cyber, IA
// ====================================================================
const SPEEDS = [0, 1, 3, 8, 20, 45];
let S = null, modalOpen = false, needRecalc = true, layerDirty = true, sel = null, selArmy = null, selSet = [], selTile = -1, REPLAY = null, pickId = null, cityWx = null;
const FX = [];  // animations (missiles, frappes, explosions) — non sauvegardées
const P = () => S.nat[S.player];
const nm = id => S && S.nat[id] && S.nat[id].fn || T[id].name;
const chip = id => `<i class="chip" style="background:${T[id].color}"></i>`;
const inWar = (a, b) => S.nat[a].war[b] != null;                                    // état de guerre, cessez-le-feu compris
const atWar = (a, b) => S.nat[a].war[b] != null && !((S.nat[a].cf[b] || 0) > S.day);  // hostilités ouvertes
const isAlly = (a, b) => { const A = S.nat[a], B = S.nat[b]; return !!A.ally[b] || (A.fac > 0 && A.fac === B.fac) || A.lord === b || B.lord === a || (A.lord != null && A.lord === B.lord); };
function allies(id) { const n = S.nat[id], o = new Set(Object.keys(n.ally).map(Number)); if (n.fac) for (const m of S.nat) if (m.fac === n.fac && m.id !== id) o.add(m.id); if (n.lord != null) o.add(n.lord); for (const m of S.nat) if (m.lord === id || (n.lord != null && m.lord === n.lord && m.id !== id)) o.add(m.id); return [...o].filter(x => S.nat[x].alive); }
const nOwner = n => n < NC ? S.city[n].o : S.tow[n - NC];
const isCore = (cs, cd) => cd.t === cs.o || cs.core === cs.o || S.nat[cs.o].cores.includes(cd.t);
const active = id => !S.active || S.active.includes(id);
const rkey = (a, b) => a < b ? a + '_' + b : b + '_' + a;
function getRel(a, b) { if (a === b) return 100; const h = ((Math.min(a, b) * 7919 + Math.max(a, b) * 104729) % 31) - 15; return clamp(h + (T[a].meta.r === T[b].meta.r ? 10 : 0) + (S.nat[a] && S.nat[b] && S.nat[a].ideo === S.nat[b].ideo ? 8 : -4) + (S.rel[rkey(a, b)] || 0), -100, 100); }
function addRel(a, b, v) { const k = rkey(a, b); S.rel[k] = clamp((S.rel[k] || 0) + v, -150, 150); }
const apow = a => { let s = 0; for (let j = 0; j < NU; j++) s += a.u[j] * UN[j].att; if (a.cg) for (const k in a.cg) s += a.cg[k] * UN[UI[k]].att; return s; };
// ---------- unités stratégiques : contingent embarqué, invulnérabilité ----------
const SUPK = ['csg', 'vsx'];
const lm = j => 1 - (UN[j].arm || 0);                               // part des pertes réellement subie
function addCargo(a, j, q) { const cg = UN[j].cargo; if (!cg) return; a.cg = a.cg || {}; for (const k in cg) a.cg[k] = (a.cg[k] || 0) + cg[k] * q; }
function cargoCap(a) { const o = {}; for (let j = 0; j < NU; j++) { const cg = UN[j].cargo; if (cg && a.u[j] >= .5) for (const k in cg) o[k] = (o[k] || 0) + cg[k] * Math.round(a.u[j]); } return o; }
const cargoN = a => { let s = 0; if (a.cg) for (const k in a.cg) s += a.cg[k]; return s; };
function superFix(a) { a.sup = a.sup || {}; for (const k of SUPK) { const j = UI[k], v = a.u[j], s = a.sup[k] || 0; if (v > s + .5) a.sup[k] = Math.round(v); else if (v < s) a.u[j] = s; } }
function supSet(a) { a.sup = {}; for (const k of SUPK) a.sup[k] = Math.round(a.u[UI[k]]); a.u[UI.csg] = a.sup.csg; a.u[UI.vsx] = a.sup.vsx; }
function sinkCsg(x, n, why) { const j = UI.csg, have = Math.round(x.u[j]); n = Math.min(n, have); if (n <= 0) return 0; if (x.cg) for (const k in x.cg) x.cg[k] *= (have - n) / have; x.u[j] = have - n; supSet(x); x.hyp = 0; x.hypT = 0; addLog(`💥 ${chip(x.o)}<b>${nm(x.o)}</b> perd ${n > 1 ? n + ' groupes aéronavals nucléaires' : 'un groupe aéronaval nucléaire'} devant <b>${C[x.at].name}</b> (${why}).`, x.o === S.player ? 1 : 2, x.at); needRecalc = true; return n; }
const adiv = a => { let s = 0; for (let j = 0; j < NU; j++) s += a.u[j]; return s; };
const aland = a => { let s = 0; for (let j = 0; j < NU; j++) if (UN[j].cl === 0) s += a.u[j]; return s; };
const aair = a => { let s = 0; for (let j = 0; j < NU; j++) if (UN[j].cl === 1) s += a.u[j]; return s; };
const aship = a => { let s = 0; for (let j = 0; j < NU; j++) if (UN[j].cl === 2) s += a.u[j] * UN[j].att; return s; };
const mkArmy = (o, at, sea) => ({ id: S.aid++, o, at, u: new Array(NU).fill(0), path: [], prog: 0, edge: 1, ek: 0, sea: !!sea, scd: 0, xp: 0, dig: 0, tl: -1, mor: 80, ord: 0, oos: 0, nm: armyName(o, sea) });
function armyName(o, sea) { const n = S.nat[o]; if (!n) return ''; const k = sea ? 'nF' : 'nA'; n[k] = (n[k] || 0) + 1; if (LANGEN) { const q = n[k], s = q % 100 > 10 && q % 100 < 14 ? 'th' : ['th', 'st', 'nd', 'rd'][q % 10] || 'th'; return q + s + (sea ? ' Fleet' : ' Army'); } return (n[k] === 1 ? '1re ' : n[k] + 'e ') + (sea ? 'flotte' : 'armée'); }
const civN = (cs, k) => cs.civ && cs.civ[k] || 0;
const hasIntel = (n, o) => (n.intel[o] || 0) > S.day || n.sat > 0;
const dateStr = d => new Date(Date.UTC(2026, 0, 1 + d * DPS)).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const wxOf = ci => cityWx && cityWx[ci] >= 0 && S.wx[cityWx[ci]] ? WX[S.wx[cityWx[ci]].k] : null;
const fxOn = (n, k) => (n.fx[k] || 0) > S.day;
const cdist = (a, b) => dist(C[a], C[b]);

// ---------- nouvelle partie ------------------------------------------
function newGame(pid, opts) {
  S = { v: 8, coal: null, kept: {}, disc: {}, hist: [], tow: TL.map(t => C[t.c].t), tb: {}, fac: [], facId: 1, q: [], chg: [], wr: {}, day: 0, speed: 1, player: pid, opts, active: null, nat: [], city: [], armies: [], aid: 1, rel: {}, cd: {}, log: [], wx: [], won: false, phase: 'earth', cheat: {}, space: null };
  applyDisc();
  C.forEach(c => { const o = { o: c.t, pop: 0, gdp: 0, occ: null, blk: -9, stab: 70, rk: 0, rk0: 0, civ: {}, riot: -9 }; for (const k of BK) o[k] = 0; S.city.push(o); });
  T.forEach((t, i) => {
    const m = t.meta, g = m.g, sq = Math.sqrt(g), cap = t.capC;
    for (const ci of t.cities) { const cs = S.city[ci]; cs.pop = m.p * C[ci].w; cs.gdp = g * C[ci].w; cs.inc0 = .05 * Math.pow(g, .7) * C[ci].w; cs.mat0 = (.12 + Math.pow(Math.max(1, t.area), .25) * .02) * (C[ci].area / Math.max(1, t.area) * .7 + .3 / t.cities.length); cs.sci0 = sq * .03 * C[ci].w; cs.pop0 = cs.pop; cs.rk = cs.rk0 = rankOf(cs.pop); cs.fd0 = cs.pop * .3; if (C[ci].fl === 1) cs.port = 1; if (C[ci].fl === 2) { cs.lab = 1; cs.airb = 1; } }
    const cc = S.city[cap]; cc.fac = g > 1500 ? 2 : g > 300 ? 1 : 0; cc.lab = g > 2000 ? 2 : g > 500 ? 1 : 0; cc.mine = t.area > 2e6 ? 1 : 0; cc.airb = g > 200 ? 1 : 0; cc.rail = g > 1000 ? 1 : 0; cc.dca = g > 400 ? 1 : 0; cc.silo = g > 1500 ? 1 : 0; cc.cyber = g > 800 ? 1 : 0;
    const port = t.cities.filter(ci => C[ci].co).sort((a, b) => C[b].pk - C[a].pk)[0]; if (port != null && g > 120) S.city[port].port = 1;
    const n = { id: i, alive: true, cap, money: 15 + Math.pow(g, .7) * 3, mp: Math.pow(m.p, .8) * 10, mat: 20 + Math.sqrt(t.area) / 50, sci: 0, tech: {}, research: null, fuel: 0, food: 0, comp: 4 + sq / 8, comp0: sq * .002, ura: NUKES[m.a] ? 20 : NPP.includes(m.a) ? 15 : 0, debt: 0, tax: 1, mob: 0, ideo: ideoOf(m.a), ideoCd: 0, sat: g > 8000 ? 1 : 0, fuel0: 0, ammo: 0, goods: 0, cf: {}, jk: {}, wk: {}, lord: null, fac: 0, trib: {}, cores: [], coupCd: {}, war: {}, ally: {}, pact: {}, truce: {}, just: {}, infamy: 0, aggr: Math.random(), nextWar: RI(250, 1500), lastGain: 0, maxC: t.cities.length, ms: {}, cy: {}, cyCd: {}, fx: {}, intel: {} };
    MIS.forEach(x => n.ms[x.k] = 0); CYB.forEach(x => n.cy[x.k] = 0); for (const k in TECH) n.tech[k] = 0; if (NPP.includes(m.a)) cc.pnu = 1; if (g > 5000) cc.spc = 1;
    const tl = g > 3000 ? 2 : g > 800 ? 1 : 0; n.tech.atk = n.tech.def = n.tech.eco = tl;
    if (NUKES[m.a]) { n.tech.nuke = 1; n.ms.nuke = NUKES[m.a]; }
    if (g > 300) { n.ms.gmlrs = Math.round(sq / 3); n.ms.srbm = Math.round(sq / 10); n.ms.crui = Math.round(sq / 12); n.ms.sam = Math.round(sq / 6); n.ms.ashm = Math.round(sq / 15); }
    if (g > 3000) { n.ms.mrbm = 2; n.ms.hyper = g > 10000 ? 2 : 0; n.ms.icbm = g > 10000 ? 2 : 0; n.ms.arm = 4; }
    if (g > 800) { n.cy.crecon = 1; n.cy.cdef = Math.round(sq / 30); n.cy.csabo = g > 2000 ? 1 : 0; n.cy.cew = g > 2000 ? 1 : 0; }
    S.nat.push(n);
    const inf = Math.round(2 + Math.sqrt(m.p) * 1.2), others = t.cities.filter(ci => ci !== cap).sort((a, b) => C[b].pk - C[a].pk).slice(0, 4), gi = others.length ? Math.round(inf * .4 / others.length) : 0;
    const a = mkArmy(i, cap); const U = (k, v) => a.u[UI[k]] = Math.max(0, Math.round(v));
    U('inf', inf - gi * others.length); U('meca', sq / 14); U('tank', sq / 12); U('art', sq / 16); U('fs', sq / 40); U('heli', sq / 30); U('drec', sq / 25); U('male', g > 600 ? sq / 30 : 0); U('dkam', sq / 20);
    if (cc.airb) { U('fight', sq / 22); U('multi', sq / 26); U('bomb', g > 5000 ? sq / 40 : 0); U('awacs', g > 2000 ? 1 : 0); U('ucav', g > 4000 ? sq / 50 : 0); }
    if (C[cap].rel >= 2 || C[cap].ter === 'toundra') U('mtn', 3 + sq / 20); S.armies.push(a);
    for (const ci of others) if (gi > 0) { const b = mkArmy(i, ci); b.u[UI.inf] = gi; if (C[ci].rel >= 2) b.u[UI.mtn] = Math.ceil(gi / 3); S.armies.push(b); }
    if (port != null && g > 400) { const f = mkArmy(i, port, true); f.u[UI.frig] = Math.round(sq / 16); f.u[UI.dest] = Math.round(sq / 22); f.u[UI.sub] = Math.round(sq / 28); f.u[UI.cv] = g > 15000 ? 3 : g > 2500 ? 1 : 0; f.u[UI.lhd] = g > 2000 ? 1 : 0; if (adiv(f)) S.armies.push(f); const m2 = mkArmy(i, port); m2.u[UI.mar] = Math.round(sq / 15); if (adiv(m2)) S.armies.push(m2); }
  });
  if (opts.test) setupTest(pid); else if (opts.fac) presetFactions();
  if (!opts.test) applyScenario(opts.scn); S.auto = !!opts.auto; S.opts.doctrine = opts.doctrine !== false; S.ult = {};
  initEco(); recompute(); v7Init(); for (const n of S.nat) n.area0 = n.area; layerDirty = true;
}
// partie test : 4 nations actives, le reste du monde est figé et infranchissable
function setupTest(pid) {
  const near = new Map();
  for (const ci of T[pid].cities) for (const [v, , d] of C[ci].ed) { const o = C[v].t; if (o !== pid && d <= 1500 && C[ci].fl !== 2 && C[v].fl !== 2) near.set(o, (near.get(o) || 0) + 1); }
  let cand = [...near.keys()].filter(o => T[o].cities.length >= 3).sort((a, b) => T[b].meta.g - T[a].meta.g);
  if (cand.length < 3) cand = cand.concat(T.filter(t => t.i !== pid && !cand.includes(t.i) && t.cities.length >= 3).sort((a, b) => dist(a, T[pid]) - dist(b, T[pid])).map(t => t.i));
  S.active = [pid].concat(cand.slice(0, 3));
  for (const id of S.active) S.nat[id].nextWar = RI(40, 160);
}

function cityDemand(cs) { let b = 0; for (const k of BK) if (!BLD[k].pw) b += cs[k]; return 1.5 * Math.pow(cs.pop, .6) + .7 * cs.fac + .5 * b; }
function cityPower(cs, cd, n) { return (cs.pw0 || 0) + BLD.pth.pw * cs.pth * (cd.coal ? 1.5 : 1) + (n.ura > 0 ? BLD.pnu.pw * cs.pnu * (1 + .1 * Math.min(3, civN(cs, 'nuc'))) : 0) + BLD.phy.pw * cs.phy + BLD.pre.pw * cs.pre * (cd.ter === 'desert' || cd.ter === 'steppe' || cd.co ? 1.5 : 1); }
function cityFood(cs, cd, w) { return ((cs.fd0 || 0) + cs.farm * (cd.cer ? 2 : 1) * (cd.ter === 'desert' || cd.ter === 'toundra' ? .5 : 1) + .8 * cs.fish + .5 * cd.cer) * (1 + .25 * Math.min(2, civN(cs, 'agro'))) * (w && w.inc && !civN(cs, 'met') ? w.inc : 1) * ((cs.bd || 0) > 30 ? .5 : S.day - cs.blk < 6 ? .7 : 1); }
function recompute() {
  needRecalc = false;
  for (const n of S.nat) { n.cities = []; n.inc = 0; n.matInc = 0; n.sciInc = .3; n.pop = 0; n.str = 0; n.up = 0; n.area = 0; n.mpMul = 1; n.pwS = 0; n.pwD = 0; n.fuelInc = n.fuel0 || 0; n.foodP = 0; n.compInc = n.comp0 || 0; n.uraInc = 0; n.uraUse = 0; n.stS = 0; n.dipl = 0; n.bankLv = 0; n.men = 0; n.civs = 0; n.astro = 0; n.nucs = 0; n.ammoInc = n.ammo0 || 0; n.goodsP = 0; n.tilesX = 0; n.vas = 0; }
  for (let i = 0; i < C.length; i++) {
    const cs = S.city[i], n = S.nat[cs.o], cd = C[i], core = isCore(cs, cd) ? 1 : .6, w = wxOf(i), riot = ((cs.riot || -9) > S.day ? .3 : 1) * ((cs.refu || 0) > S.day ? .85 : 1), cl = cd.clim, cc = climCC();
    const stabM = clamp(.4 + .6 * cs.stab / 70, .3, 1.15), popM = Math.sqrt(cs.pop / (cs.pop0 || cs.pop || 1)), rkM = 1 + .1 * (cs.rk - (cs.rk0 || 0));
    n.cities.push(i); n.inc += (cs.inc0 * popM * rkM * (1 + .2 * cs.fac + .1 * cs.port + .1 * cs.bank) * (w && w.inc && !civN(cs, 'met') ? w.inc : 1) * (S.day - cs.blk < 6 ? .5 : 1) + cd.rInc * .4) * core * stabM * riot * (1 + cc * cl.inc);
    n.matInc += (cs.mat0 + .5 * cs.mine * (1 + cd.minerai) + cd.rMat * .5 + .15 * Math.min(2, civN(cs, 'geo'))) * riot * (1 + cc * cl.mat); n.sciInc += cs.sci0 * core + .8 * cs.lab + .5 * cs.univ + cd.rSci * .5 + .4 * civN(cs, 'cher'); n.pop += cs.pop; n.area += cd.area; n.mpMul += cd.rMp * .05;
    n.pwS += cityPower(cs, cd, n) * (cl.pw < 0 ? 1 + cc * cl.pw : 1); n.pwD += cityDemand(cs) * (cl.pw > 0 ? 1 + cc * cl.pw : 1); n.fuelInc += .5 * cs.raf * (cd.oil ? 2 : 1); n.foodP += cityFood(cs, cd, w) * Math.max(.2, 1 + cc * cl.food); n.compInc += .25 * cs.semi * (cd.rare ? 2 : 1); n.uraInc += .03 * cs.umine * (cd.urn ? 4 : 1); n.uraUse += .03 * cs.pnu; n.ammoInc += .15 * cs.fac + cs.ars; n.goodsP += .5 * cs.fac; n.matInc -= .05 * (cs.fac + 2 * cs.ars);
    n.stS += cs.stab * cs.pop; n.bankLv += cs.bank; n.dipl += civN(cs, 'dip'); n.astro += civN(cs, 'astro'); n.nucs += civN(cs, 'nuc');
    for (const k in cs.civ) { n.up += cs.civ[k] * CVI[k].up; n.civs += cs.civ[k]; }
  }
  for (let ti = 0; ti < TL.length; ti++) { const o = S.tow[ti], tl = TL[ti]; if (o === S.city[tl.c].o) continue; const n = S.nat[o], r = tl.res; n.area += tl.area; n.tilesX++; if (r === 'petrole') n.inc += .24; else if (r === 'gaz') n.inc += .16; else if (r === 'minerai') n.matInc += .3; else if (r === 'bois') n.matInc += .15; else if (r === 'rare') n.sciInc += .3; else if (r === 'charbon') n.matInc += .1; }
  for (const k in S.tb) { const b = S.tb[k], tl = TL[k], n = S.nat[S.tow[k]]; if (b.tfarm) n.foodP += .6 * b.tfarm * (tl.res === 'cereales' ? 2 : 1); if (b.tmine) { n.matInc += .4 * b.tmine * (tl.res === 'minerai' || tl.res === 'charbon' ? 2 : 1); if (tl.res === 'uranium') n.uraInc += .02 * b.tmine; } if (b.tpuits) n.fuelInc += .5 * b.tpuits; if (b.tfac) { n.goodsP += .3 * b.tfac; n.inc += .15 * b.tfac; } }
  for (const a of S.armies) { const n = S.nat[a.o]; n.str += apow(a) * (n.tl ? milM(a.o) : 1); for (let j = 0; j < NU; j++) { n.up += a.u[j] * UN[j].up; n.men += a.u[j] * UN[j].men; } }
  for (const n of S.nat) { if (n.alive && n.tl) n.str += misForce(n); if (n.upRelief) n.up *= 1 - n.upRelief; }
  for (const n of S.nat) {
    const id = IDEO[n.ideo] || IDEO.demo, mb = MOB[n.mob || 0];
    if (fxOn(n, 'sabo')) { n.inc *= .7; n.matInc *= .7; }
    n.eR = n.pwD ? n.pwS * (1 + .1 * n.tech.nrj) / n.pwD : 1; if (S.cheat.nrj && n.id === S.player) n.eR = 2;
    const eM = n.eR >= 1 ? Math.min(1.1, 1 + (n.eR - 1) * .2) : Math.max(.6, .6 + .4 * n.eR);
    n.sanc = n.infamy > 40;
    n.inc *= (1 + .08 * n.tech.eco) * (id.inc || 1) * (n.scn ? n.scn.inc : 1) * TAX[n.tax == null ? 1 : n.tax].m * mb.inc * eM * (n.sanc ? .9 : 1) * (n.short ? .95 : 1); n.goodsD = n.pop * .02; n.goodsInc = (n.goods0 || 0) + n.goodsP - n.goodsD; n.matInc *= (id.mat || 1) * eM * (n.scn ? n.scn.mat : 1); n.sciInc *= (id.sci || 1) * eM;
    n.foodD = n.pop * .3 + n.men * .002; n.foodInc = n.foodP * (1 + .1 * n.tech.agri) - n.foodD; n.compInc *= 1 + .15 * n.tech.elec;
    n.mpCap = Math.pow(n.pop, .8) * 30 * mb.mp * (id.mp || 1); n.mpInc = Math.pow(n.pop, .8) * .05 * Math.min(1.5, n.mpMul) * mb.mp * (id.mp || 1); n.str *= (1 + .1 * n.tech.atk) * (id.atk || 1); if (n.cities.length > n.maxC) n.maxC = n.cities.length;
    n.up += Object.keys(n.cy).reduce((s, k) => s + n.cy[k] * .02, 0) + (n.sat || 0) * .05; if (S.cheat.free && n.id === S.player) n.up = 0;
    n.intr = (n.debt || 0) * .00025 / (n.cur || 1) * Math.max(.5, 1 - .05 * n.bankLv); n.stab = n.pop ? n.stS / n.pop : 70; n.debtMax = Math.max(100, 400 * n.inc) * (n.cur || 1);
    n.warLen = 0; for (const m in n.war) n.warLen = Math.max(n.warLen, S.day - n.war[m]);
  }
  // tributs : vassaux (15 % des recettes) et réparations de guerre (10 %)
  for (const n of S.nat) { if (!n.alive) continue; if (n.lord != null && S.nat[n.lord].alive) { const t = .15 * n.inc; n.inc -= t; S.nat[n.lord].inc += t; S.nat[n.lord].vas++; } for (const to in n.trib) { if (n.trib[to] <= S.day || !S.nat[to].alive) { delete n.trib[to]; continue; } const t = .1 * n.inc; n.inc -= t; S.nat[to].inc += t; } }
}
function addLog(msg, kind, city) { S.log.unshift({ d: S.day, m: msg, k: kind || 0, t: city }); if (S.log.length > 80) S.log.pop(); if (typeof renderLog === 'function') renderLog(); if (kind === 1 && S.day > 0 && typeof pushNotif === 'function') pushNotif(msg, city); }

// ---------- météo -----------------------------------------------------
function wxCandidates(c, day) {
  const al = Math.abs(c.lat), s = seasonAt(c.lat, day), t = c.ter, doy = (day * DPS) % 365, o = [];
  const add = (k, w) => { if (w > 0) o.push([k, w]); };
  if (al >= 35 && al <= 66 && (s === 0 || s === 3)) add('tempete', c.co ? 5 : 3);
  if (al >= 8 && al <= 32 && c.co && (s === 2 || s === 3 || (s === 4 && doy > 150 && doy < 330))) add('cyclone', 2.5);
  if ((al > 42 && s === 0) || (al > 60 && (s === 1 || s === 3)) || (c.rel >= 2 && al > 25 && s === 0)) add('neige', 4);
  if (al >= 20 && al <= 52 && s === 2) add('canicule', 3);
  if (t === 'desert') add('sable', s === 1 || s === 2 ? 5 : 3);
  if ((c.lat > 5 && c.lat < 30 && c.lon > 65 && c.lon < 125 && doy > 150 && doy < 275) || (c.lat > 4 && c.lat < 15 && c.lon > -18 && c.lon < 15 && doy > 165 && doy < 265)) add('mousson', 6);
  if (al >= 38 && al <= 62 && (s === 0 || s === 3) && (t === 'plaine' || t === 'foret' || t === 'taiga')) add('brouillard', 3);
  if ((al > 35 && s === 1 && t === 'plaine') || (al < 25 && (t === 'plaine' || t === 'jungle' || t === 'savane') && (s === 2 || s === 4))) add('inondation', .7);
  if (al > 48 && s === 0) add('froid', 5);
  if ((al < 45 && s === 2) || s === 4) add('orage', 1);
  if (al >= 10 && al <= 42 && s === 2 && (t === 'plaine' || t === 'desert' || t === 'steppe' || t === 'savane')) add('secheresse', 2);
  if ((t === 'foret' || t === 'taiga') && s === 2 && al >= 28 && al <= 64) add('feu', 4);
  if ((t === 'plaine' || t === 'steppe') && al >= 28 && al <= 50 && (s === 1 || s === 2)) add('tornade', c.lon > -105 && c.lon < -85 ? 3 : .7);
  return o;
}
function spawnWx(k, c, days) {
  const e = { k, lon: c.lon + R(-1.5, 1.5), lat: c.lat + R(-1, 1), r: k === 'tornade' ? 260 : k === 'cyclone' ? 520 : k === 'mousson' ? 900 : RI(350, 750), end: S.day + Math.max(1, Math.round((days || (k === 'tornade' ? RI(2, 3) : k === 'secheresse' ? RI(20, 40) : k === 'mousson' ? RI(15, 30) : RI(4, 13))) / DPS)) };
  S.wx.push(e); return e;
}
function wxTick() {
  for (const e of S.wx) if (WX[e.k].drift) { e.lon -= .9; e.lat += e.lat >= 0 ? .45 : -.45; }
  S.wx = S.wx.filter(e => e.end > S.day && Math.abs(e.lat) < (WX[e.k].drift ? 45 : 99));
  for (let tries = 0; tries < 2; tries++) if (S.wx.length < 18 && Math.random() < .5) {
    const c = pick(C), cand = wxCandidates(c, S.day); if (!cand.length) continue;
    let tot = 0; for (const x of cand) tot += x[1]; let r = Math.random() * tot, k = cand[0][0]; for (const x of cand) { r -= x[1]; if (r <= 0) { k = x[0]; break; } }
    if (S.wx.some(e => e.k === k && dist(e, c) < 1200)) continue;
    const e = spawnWx(k, c);
    const hit = C.filter(x => Math.abs(x.lat - e.lat) < 12 && dist(e, x) < e.r), mine = hit.filter(x => S.city[x.i].o === S.player || S.armies.some(a => a.o === S.player && a.at === x.i));
    if (WX[k].dmg && hit.length) { const v = pick(hit), cs = S.city[v.i], bk = BK.filter(b => cs[b] > 0); if (bk.length && Math.random() < .5) { const b = pick(bk); cs[b]--; if (cs.o === S.player) addLog(`🌪 Une tornade ravage <b>${v.name}</b> : ${BLD[b].n.toLowerCase()} endommagé.`, 1, v.i); } }
    if (mine.length) addLog(`${WX[k].ic} <b>${WX[k].n}</b> sur ${mine.slice(0, 3).map(x => x.name).join(', ')}${mine.length > 3 ? '…' : ''} (${jd(e.end - S.day)} j)`, 0, mine[0].i);
  }
  cityWx.fill(-1);
  S.wx.forEach((e, wi) => { for (const c of C) if (cityWx[c.i] < 0 && Math.abs(c.lat - e.lat) < 12 && dist(e, c) < e.r) cityWx[c.i] = wi; });
  for (const a of S.armies) {
    if (S.cheat.god && a.o === S.player) continue;
    const w = wxOf(a.at), cs = S.city[a.at], no_ = nOwner(aNode(a)), home = no_ === a.o || isAlly(a.o, no_), ter = a.tl >= 0 && S.tb[a.tl] && S.tb[a.tl].tdep ? { att: 0 } : nTer(aNode(a));
    const n_ = S.nat[a.o]; let la = ((w && w.att || 0) * (home && civN(cs, 'met') ? .5 : 1) + (!home && ter.att || 0)) * (home ? 1 - .3 * Math.min(3, civN(cs, 'med')) : 1) * (1 - .08 * n_.tech.med); const sa = w && w.seaAtt || 0;
    if (!a.sea) la = hzAtt(a, aNode(a), la);
    if (la || sa) for (let j = 0; j < NU; j++) if (a.u[j]) a.u[j] *= 1 - (UN[j].cl === 2 ? sa : (UN[j].k === 'mtn' && w && (w === WX.neige || w === WX.froid) ? 0 : la));
  }
}

// ---------- diplomatie -----------------------------------------------
function declareWar(a, b, justified) {
  if (a === b || atWar(a, b) || !active(a) || !active(b)) return;
  if (S.cheat.pax && a !== S.player) return;
  const A = S.nat[a], B = S.nat[b];
  if (isAlly(a, b) && !A.ally[b]) return;   // même faction ou lien de vassalité : il faut d’abord rompre
  const jk = justified ? A.jk[b] || 'conq' : null;
  A.war[b] = B.war[a] = S.day; delete A.ally[b]; delete B.ally[a]; delete A.pact[b]; delete B.pact[a]; delete A.just[b]; delete A.jk[b]; delete A.cf[b]; delete B.cf[a];
  A.wk[b] = jk || 'surp'; B.wk[a] = 'def'; S.wr[rkey(a, b)] = { d: S.day, g: {} };
  A.infamy += justified ? JUST[jk].inf : 8 * (IDEO[A.ideo].inf || 1); addRel(a, b, -60);
  if (a === S.player || b === S.player || T[a].meta.g > 400 || T[b].meta.g > 400 || S.active) addLog(`${chip(a)}<b>${nm(a)}</b> déclare la guerre à ${chip(b)}<b>${nm(b)}</b>${justified ? ' <span class="dim">(' + JUST[jk].n.toLowerCase() + ')</span>' : ''}`, 1, B.cap);
  for (const c of allies(b)) {
    if (!S.nat[c].alive || c === a || inWar(c, a) || !active(c) || isAlly(c, a)) continue;
    if (S.nat[c].lord === b || B.lord === c) { joinWar(c, a); continue; }
    if (c === S.player) ask('Appel aux armes', `Votre allié ${chip(b)}<b>${nm(b)}</b> est attaqué par ${chip(a)}<b>${nm(a)}</b>. Honorez-vous l’alliance ?`, [{ t: 'Entrer en guerre', f: () => joinWar(c, a) }, { t: 'Rompre l’alliance', f: () => { delete P().ally[b]; delete B.ally[c]; if (P().fac && P().fac === B.fac) leaveFaction(c); addRel(b, c, -40); } }]);
    else if (Math.random() < .75) joinWar(c, a);
  }
  for (const c of allies(a)) if (S.nat[c].alive && active(c) && c !== b && !inWar(c, b) && !isAlly(c, b) && (S.nat[c].lord === a || (c !== S.player && Math.random() < (A.ally[c] ? .35 : .1)))) joinWar(c, b);
  layerDirty = true;
}
function joinWar(c, a) { if (inWar(c, a) || c === a) return; const X = S.nat[c], A = S.nat[a]; X.war[a] = A.war[c] = S.day; X.wk[a] = A.wk[c] = 'def'; S.wr[rkey(a, c)] = { d: S.day, g: {} }; delete X.ally[a]; delete A.ally[c]; delete X.pact[a]; delete A.pact[c]; addRel(a, c, -50); if (c === S.player || a === S.player) addLog(`${chip(c)}<b>${nm(c)}</b> entre en guerre contre ${chip(a)}<b>${nm(a)}</b>`, 1, X.cap); layerDirty = true; }
function goHome(ar) { const n = S.nat[ar.o]; let to = n.cap; if (ar.sea) { const p = n.cities.filter(ci => C[ci].co); if (!p.length) return; to = p.sort((x, y) => S.city[y].port - S.city[x].port)[0]; } ar.at = to; ar.tl = -1; ar.path = []; ar.prog = 0; }
function makePeace(a, b, keepTiles) {
  const A = S.nat[a], B = S.nat[b]; delete A.war[b]; delete B.war[a]; delete A.cf[b]; delete B.cf[a]; delete A.wk[b]; delete B.wk[a]; delete S.wr[rkey(a, b)]; A.truce[b] = B.truce[a] = S.day + 365; addRel(a, b, 20); A.askedPeace = B.askedPeace = 0;
  if (!keepTiles) for (let ti = 0; ti < TL.length; ti++) { const o = S.tow[ti], co = S.city[TL[ti].c].o; if ((o === a && co === b) || (o === b && co === a)) takeTile(ti, co); }
  settleTiles();
  for (const ar of S.armies) { const no = nOwner(aNode(ar)); if ((ar.o === a && no === b) || (ar.o === b && no === a)) goHome(ar); }
  if (a === S.player || b === S.player) addLog(`Paix signée entre ${chip(a)}<b>${nm(a)}</b> et ${chip(b)}<b>${nm(b)}</b>`, 2);
  layerDirty = true;
}
function eliminate(id, by) {
  const n = S.nat[id]; if (!n.alive) return; n.alive = false;
  S.armies = S.armies.filter(a => a.o !== id);
  for (const m of S.nat) { delete m.war[id]; delete m.ally[id]; delete m.pact[id]; delete m.just[id]; delete m.cf[id]; delete m.trib[id]; if (m.lord === id) m.lord = null; }
  n.war = {}; n.ally = {}; n.cf = {}; n.trib = {}; n.lord = null; if (n.fac) leaveFaction(id, true);
  for (let ti = 0; ti < TL.length; ti++) if (S.tow[ti] === id) takeTile(ti, S.city[TL[ti].c].o === id ? by : S.city[TL[ti].c].o);
  S.q = S.q.filter(x => x.o !== id); if (selArmy && !S.armies.includes(selArmy)) selArmy = null;
  addLog(`${chip(id)}<b>${nm(id)}</b> est annexé par ${chip(by)}<b>${nm(by)}</b>`, by === S.player ? 2 : 3, T[id].capC);
  if (id === S.player) ask('Défaite', 'Votre nation a été rayée de la carte.', [{ t: 'Observer le monde', f: () => { } }, { t: 'Nouvelle partie', f: () => location.reload() }]);
}
function capture(ci, by) {
  const cs = S.city[ci], prev = cs.o, pn = S.nat[prev], bn = S.nat[by]; xpConq(prev, by, ci, 1);
  cs.o = by; cs.ann = S.day; cs.occ = null; cs.fort = Math.max(0, cs.fort - 1); bn.lastGain = S.day; cs.stab = isCore(cs, C[ci]) ? 55 : 30; cs.civ = {}; cs.as = 0; cs.mn = null;
  const wk = bn.wk[prev], freeI = (wk === 'rev' || wk === 'lib') && C[ci].t !== prev;
  if (C[ci].t !== by && !freeI) bn.infamy += C[ci].cap ? 2 : .5;
  const wr = S.wr[rkey(by, prev)]; if (wr) (wr.g[by] || (wr.g[by] = [])).push(ci);
  for (const ti of C[ci].tiles) if (S.tow[ti] === prev) takeTile(ti, by);
  for (const ti of C[ci].tiles) { const o = S.tow[ti]; if (o !== by && !inWar(o, by) && !(S.kept && S.kept[ti] === o)) takeTile(ti, by); }
  S.q = S.q.filter(x => x.ci !== ci); cityRes(C[ci]);
  needRecalc = layerDirty = true;
  if (prev === S.player || by === S.player) addLog(`${chip(by)}<b>${nm(by)}</b> s’empare de <b>${C[ci].name}</b> (${C[ci].tiles.length} province${C[ci].tiles.length > 1 ? 's' : ''})`, by === S.player ? 2 : 1, ci);
  const left = []; for (let i = 0; i < C.length; i++) if (S.city[i].o === prev) left.push(i);
  if (!left.length) return eliminate(prev, by);
  if (pn.cap === ci) {
    if (left.length <= pn.maxC * .4) { for (const i of left) { S.city[i].o = by; S.city[i].occ = null; S.city[i].stab = 35; S.city[i].civ = {}; S.city[i].as = 0; } addLog(`${chip(prev)}<b>${nm(prev)}</b> capitule après la chute de sa capitale.`, 3, ci); return eliminate(prev, by); }
    pn.cap = left.sort((a, b) => S.city[b].gdp - S.city[a].gdp)[0];
  }
}

// ---------- déplacements (de province en province) -----------------------
// une province ne reste occupée qu’en temps de guerre contre le détenteur de sa ville, sauf cession par traité (S.kept)
function settleTiles() { for (let ti = 0; ti < TL.length; ti++) { const o = S.tow[ti], co = S.city[TL[ti].c].o; if (o !== co && !inWar(o, co) && !(S.kept && S.kept[ti] === o)) takeTile(ti, co); } }
function takeTile(ti, by) { const prev = S.tow[ti]; if (prev === by) return; if (S.kept) delete S.kept[ti]; S.tow[ti] = by; if (S.chg.length < 90000) S.chg.push(S.day, ti, by); cityRes(C[TL[ti].c]); needRecalc = layerDirty = true; }
const passO = (nid, o) => o === nid || (active(o) && (isAlly(nid, o) || inWar(nid, o)));
// une province reste franchissable pour qui peut entrer dans une des villes qu’elle abrite
const passable = (nid, n) => { if (passO(nid, nOwner(n))) return true; if (n >= NC) for (const ci of TL[n - NC].cs) if (passO(nid, S.city[ci].o)) return true; return false; };
const hostile = (nid, n) => atWar(nid, nOwner(n));
const seaTransit = (n) => n < NC && C[n].co;   // eaux d’un port : franchissables par mer quel que soit le détenteur
const winterMv = ci => { const c = C[ci]; return Math.abs(c.lat) > 48 && seasonAt(c.lat, S.day) === 0 && (c.ter === 'plaine' || c.ter === 'foret' || c.ter === 'taiga' || c.ter === 'steppe') ? 1.25 : 1; };
function armyMode(a) { if (a.u[UI.vsx] >= .5) return ['orb', UN[UI.vsx].vit]; let land = 1e9, air = 1e9, sea = 1e9; for (let j = 0; j < NU; j++) if (a.u[j] > .01) { const u = UN[j]; if (u.cl === 0) land = Math.min(land, u.vit); else if (u.cl === 1) air = Math.min(air, u.vit); else sea = Math.min(sea, u.vit); } if (a.sea) return ['sea', sea < 1e9 ? sea : 600]; if (land < 1e9) return ['land', land]; if (air < 1e9) return ['air', air]; return ['land', 30]; }
// zones de contrôle : nœuds tenus ou bordés par une armée terrestre
let ZOC = [];
function buildZoc() { ZOC = new Array(NC + TL.length); for (const a of S.armies) { if (a.sea || aland(a) < 1) continue; const n = aNode(a), mark = x => { const z = ZOC[x] || (ZOC[x] = []); if (!z.includes(a.o)) z.push(a.o); }; mark(n); for (const e of NA[n]) if (!e[1]) mark(e[0]); } }
const inZoc = (nid, n) => { const z = ZOC[n]; if (!z) return false; for (const o of z) if (o !== nid && atWar(nid, o)) return true; return false; };
const enemyLandAt = (nid, n) => S.armies.some(x => aNode(x) === n && !x.sea && atWar(nid, x.o) && aland(x) >= .3);
function edgeDays(u, v, kind, d, a, live) {
  const n = S.nat[a.o], [mode, sp] = a.mode || armyMode(a), lg = (1 + .12 * n.tech.log) * (a.gen && a.gen.tr === 'log' ? 1.15 : 1), cu = nCity(u), cv = nCity(v), w1 = live ? wxOf(cu) : null, w2 = live ? wxOf(cv) : null;
  if (kind && mode !== 'air' && mode !== 'orb' && frozen6(u, v)) { if (!hasIce(a)) return live ? 90 : 1e9; if (mode === 'sea') return clamp(4 * d / sp * Math.max(w1 && w1.sea || 1, w2 && w2.sea || 1), .2, 160); }   // mers gelées
  if (mode === 'sea') return clamp(d / sp * Math.max(w1 && w1.sea || 1, w2 && w2.sea || 1), .2, 40);
  if (mode === 'orb') return clamp(d / sp, .02, 1);
  if (mode === 'air') { const grounded = (w1 && w1.m.air === 0) || (w2 && w2.m.air === 0); return grounded ? 30 : clamp(d / sp, .05, 10); }
  if (kind) return clamp((1 + d / 500 * Math.max(w1 && w1.sea || 1, w2 && w2.sea || 1)) / lg, 1, 50);
  let m = (nTer(u).mv + nTer(v).mv) / 2; if (live) m *= Math.max(w1 && w1.mv || 1, w2 && w2.mv || 1) * Math.max(winterMv(cu), winterMv(cv));
  const cs = S.city[cu], rl = cs.o === a.o || isAlly(a.o, cs.o) ? cs.rail : 0;
  let t = (.12 + d / sp * m) / lg / (1 + .25 * rl) * (n.dry ? 1.5 : 1);
  if (v >= NC && TL[v - NC].riv && !(u >= NC && TL[u - NC].riv)) t += .5;                 // franchissement d’un fleuve
  if (live && inZoc(a.o, u) && inZoc(a.o, v) && !enemyLandAt(a.o, v)) t *= 2;              // glisser le long d’une zone de contrôle
  return clamp(t, .12, 60);
}
// Dijkstra avec tas binaire, sur le graphe villes + provinces
function dij(a, from) {
  const N = NC + TL.length, D = new Float64Array(N).fill(1e9), Pr = new Int32Array(N).fill(-1), nid = a.o, hk = [], hv = []; a.mode = armyMode(a); const mode = a.mode[0];
  const push = (k, v) => { hk.push(k); hv.push(v); let i = hk.length - 1; while (i) { const p = (i - 1) >> 1; if (hk[p] <= hk[i]) break; [hk[p], hk[i]] = [hk[i], hk[p]]; [hv[p], hv[i]] = [hv[i], hv[p]]; i = p; } };
  const pop = () => { const k = hk[0], v = hv[0], lk = hk.pop(), lv = hv.pop(); if (hk.length) { hk[0] = lk; hv[0] = lv; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < hk.length && hk[l] < hk[m]) m = l; if (r < hk.length && hk[r] < hk[m]) m = r; if (m === i) break; [hk[m], hk[i]] = [hk[i], hk[m]]; [hv[m], hv[i]] = [hv[i], hv[m]]; i = m; } } return [k, v]; };
  D[from] = 0; push(0, from);
  while (hk.length) {
    const [b, u] = pop(); if (b > D[u]) continue;
    const pen = u !== from && mode !== 'air' && mode !== 'orb' && hostile(nid, u) ? (u < NC ? 25 : 1.2) : 0;
    const uIn = u === from || passable(nid, u);
    for (const [v, kind, d] of NA[u]) { if (mode === 'sea' && (!kind || !C[v].co)) continue; if (kind === 2 && mode !== 'sea') continue; if (!uIn && !kind) continue; if (!passable(nid, v) && !(kind && mode === 'sea' && seaTransit(v))) continue; const c = b + edgeDays(u, v, kind, d, a, false) + pen; if (c < D[v]) { D[v] = c; Pr[v] = u; push(c, v); } }
  }
  a.mode = null; return { D, Pr };
}
function pathTo(r, from, to) { if (to === from || r.Pr[to] < 0) return null; const p = []; for (let v = to; v !== from; v = r.Pr[v]) p.push(v); return p.reverse(); }
function orderMove(a, to) { const from = aNode(a); if (from === to) { a.path = []; a.prog = 0; return true; } if (!passable(a.o, to)) return false; if (armyMode(a)[0] === 'orb') { a.path = [to]; a.prog = 0; setEdge(a); return true; } /* trajectoire orbitale directe */ const p = pathTo(dij(a, from), from, to); if (!p) return false; a.path = p; a.prog = 0; setEdge(a); return true; }
function setEdge(a) { if (!a.path.length) return; if (armyMode(a)[0] === 'orb') { a.ek = 0; a.edge = clamp(dist(nLL(aNode(a)), nLL(a.path[0])) / UN[UI.vsx].vit, .05, 2); return; } const u = aNode(a), nx = a.path[0], tr = !passable(a.o, nx); let e = null, best = 1e9; for (const x of NA[u]) { if (x[0] !== nx || (a.sea && !x[1]) || (tr && !x[1]) || (x[1] === 2 && !a.sea && (a.mode || armyMode(a))[0] !== 'sea')) continue; const t = edgeDays(u, x[0], x[1], x[2], a, true); if (t < best) { best = t; e = x; } } a.ek = e ? e[1] : 0; a.edge = e ? best : 5; if (a.o === S.player && S.cheat.fast) a.edge = .1; }
function setNode(a, n) { if (n < NC) { a.at = n; a.tl = -1; } else { a.tl = n - NC; a.at = TL[a.tl].c; } }
function navalAt(ci, pred) { let s = 0; for (const a of S.armies) if (a.at === ci && a.tl < 0 && pred(a.o)) s += aship(a); return s; }
function moveArmies() {
  buildZoc();
  for (const a of S.armies) {
    let budget = 1; if (a.tl == null) a.tl = -1;
    while (a.path.length && budget > 1e-6) {
      const nx = a.path[0], cur = aNode(a), md = armyMode(a)[0];
      const transit = !passable(a.o, nx) && a.ek && md === 'sea' && seaTransit(nx) && a.path.length > 1;
      if ((!passable(a.o, nx) && !transit) || (hostile(a.o, cur) && hostile(a.o, nx) && !a.sea && md !== 'air' && md !== 'orb')) { if (!hostile(a.o, cur) || !passable(a.o, nx)) { a.path = []; a.prog = 0; } break; }
      const need = (1 - a.prog) * a.edge; if (budget < need) { a.prog += budget / a.edge; budget = 0; break; }
      budget -= need; const from = cur; setNode(a, nx); a.path.shift(); a.prog = 0; a.dig = 0; a.mvd = S.day;
      if (a.ek && nx < NC && from < NC && !(S.cheat.god && a.o === S.player)) {
        if (!a.sea && md === 'land') {
          const E = navalAt(from, o => atWar(a.o, o)) + navalAt(nx, o => atWar(a.o, o)), F = navalAt(from, o => o === a.o || isAlly(a.o, o)) + navalAt(nx, o => o === a.o || isAlly(a.o, o));
          if (E > F) {
            const tot = adiv(a) || 1, ms = a.u[UI.mar] / tot, esc = S.armies.some(f => f.sea && f.o === a.o && (f.at === from || f.at === nx) && f.u[UI.lhd] > 0) ? .5 : 1, l = Math.min(.6, .1 + (E - F) / (E + F + 10) * .5) * (1 - .5 * ms) * esc;
            for (let j = 0; j < NU; j++) a.u[j] *= 1 - l; a.hit = S.day; if (a.o === S.player) addLog(`⚓ Convoi intercepté vers <b>${C[nx].name}</b> : ${(l * 100 | 0)} % de pertes.`, 1, nx);
          }
        }
        if (md !== 'air' && md !== 'orb') mineHit(a, nx);
      }
      if (nx >= NC && md === 'land' && aland(a) >= 1 && hostile(a.o, nx)) { if (!enemyLandAt(a.o, nx)) takeTile(nx - NC, a.o); setEdge(a); break; }   // entrer en province ennemie termine la journée
      setEdge(a); if (hostile(a.o, nx)) break; if (md === 'land' && inZoc(a.o, nx)) break;
    }
  }
}

// ---------- combats -----------------------------------------------------
function sideStats(x, as, ter, wx, ewOn) {
  for (const a of as) if (a.cg && a.cg.fight) { const u = UN[UI.fight], v = a.cg.fight, gm = milM(a.o); x.air += v * u.att * gm * umod(wx && wx.m, u) * (ewOn ? .6 : 1); x.aa += v * u.aa; }
  for (const a of as) for (let j = 0; j < NU; j++) {
    const v = a.u[j]; if (v < .001) continue; const u = UN[j], gm = milM(a.o) * vetM(a) * scnUnitM(a.o, u); let pw = v * u.att * gm * umod(ter.m, u) * umod(wx && wx.m, u);
    if (u.cl === 1 && ewOn) pw *= .6;
    if (u.cl === 0) { x.land += pw; x.lc += v; if (u.g === 'blinde') x.blHp += v * u.pv * gm; } else if (u.cl === 1) { if (u.stealth) x.stl += pw; else x.air += pw; x.airN += v; if (u.vsBlinde) x.heli += pw * (u.vsBlinde - 1); } else { x.sea += pw; x.navHp += v * u.pv * gm; if (u.vsNaval) x.sub += pw * (u.vsNaval - 1); }
    x.hp += v * u.pv * gm * lm(j); x.aa += v * u.aa; if (u.siege) x.siege += v * (u.siege - 1); if (u.k === 'awacs') x.awacs += v; if (u.k === 'drec') x.drec += v; if (u.sat) x.swarm += v; if (u.k === 'fs') x.fs += v;
  }
}
function battles() {
  const by = {};
  for (const a of S.armies) { const n_ = aNode(a); (by[n_] || (by[n_] = [])).push(a); }
  for (const k in by) {
    const node = +k, fld = node >= NC, ti = node - NC, ci = fld ? TL[ti].c : node, cs = fld ? { o: S.tow[ti], fort: S.tb[ti] && S.tb[ti].tfort || 0, dca: 0, airb: 0, pop: 0, occ: null, blk: 0 } : S.city[ci], own = cs.o, cd = fld ? TL[ti] : C[ci], ter = cd.tm, wx = wxOf(ci), g = {};
    for (const a of by[k]) (g[a.o] || (g[a.o] = { o: a.o, as: [], land: 0, air: 0, stl: 0, sea: 0, hp: 0, aa: 0, lc: 0, blHp: 0, navHp: 0, heli: 0, sub: 0, siege: 0, awacs: 0, drec: 0, swarm: 0, fs: 0, airN: 0, loss: 0, aloss: 0 })).as.push(a);
    const gs = Object.values(g); if (gs.length < 2 && !(gs.length === 1 && atWar(gs[0].o, own))) { if (cs.occ) cs.occ = null; continue; }
    for (const x of gs) { const n = S.nat[x.o]; sideStats(x, x.as, ter, wx, fxOn(n, 'ew')); x.dfd = x.o === own || isAlly(x.o, own); if (x.o === own) { x.aa += 6 * cs.dca; x.air *= 1 + .15 * cs.airb; } const bo = (1 + .25 * Math.min(1, x.awacs)) * (1 + .15 * Math.min(1, x.drec / 3)); x.air *= bo; x.stl *= bo; let xs = 0, ds = 0, ws = 0; for (const a of x.as) { const d_ = adiv(a); xs += (a.xp || 0) * d_; ds += (a.dig || 0) * d_; ws += d_; } x.xp = ws ? xs / ws : 0; x.dig = ws ? ds / ws : 0; x.tk = (1 + .1 * n.tech.atk) * (1 + .15 * Math.min(1, x.drec / 3)) * (1 + .003 * x.xp) * (n.dry ? .7 : 1) * (IDEO[n.ideo].atk || 1); sideMods(x, n, fld && cd.riv); }
    let fight = false;
    if (gs.length > 1) {
      for (const x of gs) {
        let sg2 = 0; for (const y of gs) if (y !== x && atWar(x.o, y.o)) sg2 += y.siege;
        const fortEff = Math.max(0, cs.fort - sg2 / 8);
        x.dm = (1 + .1 * S.nat[x.o].tech.def) * (x.dfd ? (wx && wx.noDef ? 1 : ter.def) * (1.1 + .25 * fortEff) * (1 + .03 * Math.min(10, x.dig)) : 1) * x.dMod;
      }
      for (const x of gs) {
        let d = 0, aaHit = 0;
        for (const y of gs) {
          if (y === x || !atWar(x.o, y.o)) continue;
          const AA = x.aa * (1 - Math.min(.5, .05 * y.swarm)), ai = 1 + intelB(S.nat[y.o], x.o);
          const airEff = (y.air > 0 ? y.air * y.air / (y.air + AA) : 0) + (y.stl > 0 ? y.stl * y.stl / (y.stl + AA * .5) : 0);
          const bl = x.hp ? x.blHp / x.hp : 0, nv = x.hp ? x.navHp / x.hp : 0;
          d += (y.land + airEff + y.heli * bl + y.sea * (cd.co ? .4 + .6 * nv : nv) + y.sub * nv) * y.tk * ai;
          aaHit += y.aa;
        }
        if (d && x.hp > 0) { x.loss = Math.min(1, d * .05 * R(.7, 1.3) / x.dm / x.hp); x.aloss = x.airN ? Math.min(.25, aaHit / (aaHit + x.air + x.stl + 5) * .08) : 0; fight = true; }
      }
      for (const x of gs) if ((x.loss || x.aloss) && !(S.cheat.god && x.o === S.player)) for (const a of x.as) { for (let j = 0; j < NU; j++) { if (!a.u[j]) continue; a.u[j] *= 1 - Math.min(1, x.loss + (UN[j].cl === 1 ? x.aloss : 0)) * lm(j); if (UN[j].once && fight) a.u[j] = 0; } a.hit = S.day; a.xp = Math.min(100, (a.xp || 0) + 1.5); a.mor = clamp((a.mor == null ? 80 : a.mor) - x.loss * 130 - 1, 0, 100); }
      if (fight) xpBattle(gs);
      if (fight) for (const x of gs) { const n = S.nat[x.o]; if (!(S.cheat.res && x.o === S.player)) n.ammo = Math.max(0, n.ammo - .02 * (x.lc + x.airN + x.navHp / 6)); }
    }
    let bes = -1, bp = 0, defd = false, fsB = 1;
    for (const x of gs) { const alive = (x.land + x.air + x.sea) * (1 - x.loss) > .2; if (!alive) continue; if (x.o === own) { if (x.lc > .3 || x.air + x.sea > 1) defd = true; } else if (atWar(x.o, own)) { if (x.sea > 0) cs.blk = S.day; if (x.lc * (1 - x.loss) > .3 && x.land + x.air > bp) { bp = x.land + x.air; bes = x.o; fsB = x.fs > 0 ? 1.25 : 1; } } else if (isAlly(x.o, own) && gs.some(y => atWar(x.o, y.o))) defd = true; }
    if (bes >= 0 && !defd) {
      if (!cs.occ || cs.occ.by !== bes) cs.occ = { by: bes, prog: 0 };
      if (fld) takeTile(ti, bes); else {
      cs.occ.prog += (bes === S.player && S.cheat.fast ? 1 : fsB * (g[bes].sie || 1) * (wx && wx.siege || 1) / (2 + 3 * cs.fort + Math.sqrt(cs.pop) * .5));
      if (cs.occ.prog >= 1) capture(ci, bes); }
    } else if (cs.occ) cs.occ = null;
  }
  for (let i = 0; i < C.length; i++) if (S.city[i].occ && !by[i]) S.city[i].occ = null;
  routCheck();
  const n0 = S.armies.length; S.armies = S.armies.filter(a => adiv(a) >= .3); if (selSet.length) selSet = selSet.filter(a => S.armies.includes(a));
  if (S.armies.length !== n0 && selArmy && !S.armies.includes(selArmy)) selArmy = null;
}

// ---------- frappes aériennes à distance --------------------------------
function strikeUnits(a, tgt) { const d = cdist(a.at, tgt), out = []; for (let j = 0; j < NU; j++) if (a.u[j] >= .5 && (UN[j].cl === 1 || UN[j].k === 'csg') && UN[j].att > 0 && UN[j].por >= d) out.push(j); return out; }
function enemyStacks(nid, ci) { return S.armies.filter(x => x.at === ci && atWar(nid, x.o)); }
function airStrike(a, tgt, silent) {
  const nid = a.o, n = S.nat[nid], cs = S.city[tgt], to = cs.o;
  if (!atWar(nid, to) && !enemyStacks(nid, tgt).length) return 'La cible n’est pas ennemie';
  if ((a.scd || 0) > S.day) return 'Escadrille en cours de réarmement';
  const js = strikeUnits(a, tgt); if (!js.length) return 'Aucun appareil n’a la portée nécessaire (' + Math.round(cdist(a.at, tgt)) + ' km)';
  const w = wxOf(tgt), ewOn = fxOn(n, 'ew'); let att = 0, stl = 0, siege = 0, airN = 0;
  for (const j of js) { const u = UN[j], v = a.u[j]; let p = v * u.att * (u.orb ? 1 : umod(w && w.m, u)) * (ewOn ? .6 : 1); if (u.stealth || u.orb) stl += p; else att += p; if (u.siege) siege += v * (u.siege - 1); airN += v; }
  if (a.u[UI.csg] >= .5 && a.cg && a.cg.fight) { const u = UN[UI.fight]; att += a.cg.fight * u.att * umod(w && w.m, u) * (ewOn ? .6 : 1); airN += a.cg.fight; }
  const orbN = a.u[UI.vsx] >= .5, nbN = Math.round(a.u[UI.nbomb] || 0);
  const T_ = S.nat[to]; let AA = 6 * cs.dca; for (const x of S.armies) if (x.at === tgt && (x.o === to || isAlly(x.o, to))) for (let j = 0; j < NU; j++) AA += x.u[j] * UN[j].aa;
  let intc = 0; if (T_.ms.sam > 0 && T_.alive) { T_.ms.sam--; AA += 10; intc = 1; }
  const eff = (att > 0 ? att * att / (att + AA) : 0) + (stl > 0 ? stl * stl / (stl + AA * .5) : 0);
  const st = enemyStacks(nid, tgt); let hp = 0; for (const x of st) for (let j = 0; j < NU; j++) hp += x.u[j] * UN[j].pv;
  const dm = C[tgt].tm.def * (1 + .25 * cs.fort), loss = hp ? Math.min(.6, eff * .06 / dm / hp * 10) : 0;
  for (const x of st) if (!(S.cheat.god && x.o === S.player)) { for (let j = 0; j < NU; j++) x.u[j] *= 1 - loss * lm(j); x.hit = S.day; }
  let bd = ''; if (siege * 6 + eff > 25 && Math.random() < .7) { const b = ['fort', 'dca', 'airb', 'fac', 'silo'].find(k => cs[k] > 0); if (b) { cs[b]--; bd = ` · ${BLD[b].n.toLowerCase()} −1`; needRecalc = true; } }
  if (nbN || orbN) { const k = Math.min(6, 2 * nbN + (orbN ? 3 : 0)); let nb = 0; for (let i = 0; i < k; i++) { const ks = BK.filter(b => cs[b] > 0); if (!ks.length) break; cs[pick(ks)]--; nb++; } cs.pop *= 1 - Math.min(.1, .015 * nbN + (orbN ? .03 : 0)); cs.stab = Math.max(0, cs.stab - 6 - nbN); n.infamy += .5 + .2 * nbN; needRecalc = true; if (nb) bd += ` · bombardement ${orbN ? 'orbital' : 'massif'} : ${nb} infrastructure${nb > 1 ? 's' : ''} détruite${nb > 1 ? 's' : ''}, population touchée`; }
  const al = Math.min(.5, AA / (AA + att + stl + 5) * .3);
  if (!(S.cheat.god && nid === S.player)) for (const j of js) { a.u[j] *= 1 - (UN[j].stealth ? al * .5 : al) * lm(j); if (UN[j].once) a.u[j] = 0; }
  for (const x of S.armies) if (x.u[UI.csg] || x.u[UI.vsx]) superFix(x);
  a.scd = S.day + 2; FX.push({ k: 'strike', a: a.at, b: tgt, t0: performance.now(), dur: 1500, col: T[nid].color });
  if (!silent || nid === S.player || to === S.player) addLog(`✈ Frappe aérienne de ${chip(nid)}<b>${nm(nid)}</b> sur <b>${C[tgt].name}</b> : ${(loss * 100 | 0)} % de pertes ennemies, ${(al * 100 | 0)} % d’appareils perdus${intc ? ' (intercepteurs engagés)' : ''}${bd}.`, nid === S.player ? 2 : 1, tgt);
  return '';
}

// ---------- missiles --------------------------------------------------
function canLaunchFrom(nid, ci, k) { const m = MI[k], cs = S.city[ci]; if (cs.o !== nid) return false; if (!m.req) return true; return m.req.split('|').some(r => cs[r] > 0); }
function launchSites(nid, k) { return S.nat[nid].cities.filter(ci => canLaunchFrom(nid, ci, k)); }
function missileRangeOk(nid, k, tgt) { return launchSites(nid, k).some(ci => cdist(ci, tgt) <= MI[k].por); }
function launchMissile(nid, k, tgt, from) {
  const n = S.nat[nid], m = MI[k], cs = S.city[tgt], to = cs.o, T_ = S.nat[to];
  if (k === 'sam') return 'Missile défensif : il intercepte automatiquement';
  if (!(n.ms[k] > 0)) return 'Stock épuisé';
  if (!atWar(nid, to)) return 'Vous n’êtes pas en guerre contre ' + nm(to);
  if (from == null) { const s = launchSites(nid, k).filter(ci => cdist(ci, tgt) <= m.por).sort((a, b) => cdist(a, tgt) - cdist(b, tgt)); if (!s.length) return 'Cible hors de portée (' + m.por + ' km) ou aucune base de lancement'; from = s[0]; }
  n.ms[k]--; n.infamy += k === 'nuke' ? 15 : .3;
  let ip = m.it * Math.min(.9, .12 * cs.dca + (T_.ms.sam > 0 ? .45 : 0) + .15 * intelL(T_) + .03 * T_.tech.elec) * (fxOn(T_, 'ew') ? .5 : 1); if (T_.ms.sam > 0 && m.it > 0) T_.ms.sam--;
  const hit = Math.random() >= ip || (S.cheat.god && nid === S.player);
  FX.push({ k: 'missile', a: from, b: tgt, t0: performance.now(), dur: 1400 + Math.min(2600, cdist(from, tgt) / 4), col: k === 'nuke' ? '#ffef9a' : '#ff6a3d', hit, nuke: k === 'nuke' });
  const who = `${chip(nid)}<b>${nm(nid)}</b>`;
  const seen_ = k === 'nuke' || nid === S.player || to === S.player || isAlly(S.player, nid) || isAlly(S.player, to) || !!S.active;
  if (!hit) { if (seen_) addLog(`🛡 ${m.n} de ${who} intercepté au-dessus de <b>${C[tgt].name}</b>.`, nid === S.player ? 1 : 2, tgt); return ''; }
  const st = S.armies.filter(x => x.at === tgt && x.o !== nid && (x.o === to || isAlly(x.o, to)));
  let hp = 0, nhp = 0; for (const x of st) for (let j = 0; j < NU; j++) { hp += x.u[j] * UN[j].pv; if (UN[j].cl === 2) nhp += x.u[j] * UN[j].pv; }
  const hurt = (f, only) => { for (const x of st) { if (S.cheat.god && x.o === S.player) continue; for (let j = 0; j < NU; j++) if (!only || UN[j].cl === only) x.u[j] *= 1 - f * lm(j); x.hit = S.day; } };
  for (const x of st) { if (!(x.u[UI.csg] >= .5) || (S.cheat.god && x.o === S.player)) continue; if (k === 'nuke') sinkCsg(x, 99, 'frappe nucléaire'); else if (k === 'hyper') { x.hyp = (x.hyp || 0) + 1; if (!x.hypT) x.hypT = RI(25, 35); if (x.hyp >= x.hypT) sinkCsg(x, 1, x.hyp + ' missiles hypersoniques au but'); else if (x.o === S.player || nid === S.player) addLog(`🛳 Groupe aéronaval touché à ${C[tgt].name} : ${x.hyp} missile${x.hyp > 1 ? 's' : ''} hypersonique${x.hyp > 1 ? 's' : ''} encaissé${x.hyp > 1 ? 's' : ''}${nid === S.player ? '' : ' sur ' + x.hypT}.`, x.o === S.player ? 1 : 2, tgt); } }
  const bldHit = n2 => { let s = ''; for (let i = 0; i < n2; i++) { const b = ['fort', 'dca', 'silo', 'airb', 'port', 'fac', 'cyber', 'lab', 'rail', 'mine'].find(x => cs[x] > 0); if (b) { cs[b]--; s += (s ? ', ' : '') + BLD[b].n.toLowerCase(); } } needRecalc = true; return s; };
  let res = '';
  if (m.tgt === 'u') { const f = hp ? Math.min(.8, m.pw / (m.pw + hp * .6)) : 0; hurt(f); res = `${(f * 100 | 0)} % de pertes`; }
  else if (m.tgt === 'ub') { const f = hp ? Math.min(.7, m.pw / (m.pw + hp * .6)) * .8 : 0; hurt(f); const b = bldHit(m.pw >= 20 ? 2 : 1); res = `${(f * 100 | 0)} % de pertes${b ? ', ' + b + ' touché(e)s' : ''}`; }
  else if (m.tgt === 'bu') { const b = bldHit(m.pw >= 20 ? 2 : 1); const f = hp ? Math.min(.3, m.pw / (m.pw + hp)) * .5 : 0; hurt(f); res = (b ? b + ' détruit(e)s' : 'aucune infrastructure') + `, ${(f * 100 | 0)} % de pertes`; }
  else if (m.tgt === 'n') { const f = nhp ? Math.min(.85, 3 * m.pw / (3 * m.pw + nhp * .6)) : 0; hurt(f, 2); res = nhp ? `${(f * 100 | 0)} % de la flotte coulée` : 'aucun navire présent'; }
  else if (m.tgt === 'r') { const l = Math.min(2, cs.dca); cs.dca -= l; res = `défense sol-air −${l}`; }
  else if (m.tgt === 'nuc') { cs.pop *= .6; for (const b of BK) cs[b] = Math.max(0, cs[b] - 2); hurt(.8); for (const o of S.nat) if (o.alive && o.id !== nid) addRel(nid, o.id, -8); res = 'ville dévastée'; needRecalc = true; if (nid === S.player || to === S.player) flash = 1; }
  if (seen_) addLog(`🚀 ${m.n} de ${who} sur <b>${C[tgt].name}</b> : ${res}.`, nid === S.player ? 2 : 1, tgt);
  for (const x of st) superFix(x); addRel(nid, to, -5); return '';
}

// ---------- cyberguerre ----------------------------------------------
function cyberDefense(nid) { const n = S.nat[nid]; let lv = 0; for (const ci of n.cities) lv = Math.max(lv, S.city[ci].cyber); return Math.min(.9, 1 - Math.pow(.75, n.cy.cdef || 0) + .1 * lv); }
function cyberAttack(nid, k, to) {
  const n = S.nat[nid], c = CI[k], T_ = S.nat[to]; if (k === 'cdef') return 'Unité défensive';
  if (!(n.cy[k] > 0)) return 'Aucune unité ' + c.n.toLowerCase(); if ((n.cyCd[k] || 0) > S.day) return 'Unité en récupération (' + jd(n.cyCd[k] - S.day) + ' j)'; if (!active(to)) return 'Nation hors jeu';
  n.cyCd[k] = S.day + 12; n.infamy += 2; addRel(nid, to, atWar(nid, to) ? -5 : -25);
  const p = clamp(.55 + .05 * Math.min(6, n.cy[k]) - cyberDefense(to), .05, .95), ok = Math.random() < p || (S.cheat.god && nid === S.player);
  const who = `${chip(nid)}<b>${nm(nid)}</b>`, tgt = `${chip(to)}<b>${nm(to)}</b>`, seen_ = nid === S.player || to === S.player || !!S.active;
  if (FX.length < 40 && S.nat[to].alive) FX.push({ k: 'cyber', a: n.cap, b: S.nat[to].cap, t0: performance.now(), dur: 1600, col: '#5dff9a', hit: ok });
  if (!ok) { if (seen_) addLog(`💻 Cyberattaque de ${who} contre ${tgt} repérée et bloquée.`, nid === S.player ? 1 : 2); if (!atWar(nid, to) && to !== S.player && S.nat[to].aggr > .6 && Math.random() < .3) declareWar(to, nid, true); return ''; }
  if (k === 'crecon') n.intel[to] = S.day + c.dur; else if (k === 'csabo') { T_.fx.sabo = S.day + c.dur; needRecalc = true; } else if (k === 'cew') T_.fx.ew = S.day + c.dur;
  if (seen_) addLog(`💻 ${c.n} de ${who} réussit contre ${tgt} : ${c.d.toLowerCase()}`, nid === S.player ? 2 : 1); return '';
}

// ---------- achats ----------------------------------------------------
const disc = n => (1 - .06 * n.tech.ind) * (n.scn ? n.scn.cost : 1);
const udisc = n => disc(n) * (IDEO[n.ideo].cost || 1);
function canRecruit(ci, j) { const u = UN[j], cs = S.city[ci], n = S.nat[cs.o]; if (u.only && !u.only.includes(T[n.id].meta.a)) return 'Réservé au Canada, aux États-Unis et à la Russie'; if (u.req && cs[u.req] < (u.reqLv || 1)) return BLD[u.req].n + (u.reqLv ? ' niv. ' + u.reqLv : '') + ' requis'; if (u.tech && (n.tech[u.tech] || 0) < (u.techLv || 1)) return TECH[u.tech].n + (u.techLv ? ' niv. ' + u.techLv : '') + ' requis'; return ''; }
function recruit(n, ci, j, q, now) {
  if (canRecruit(ci, j)) return 0;
  const u = UN[j], d = udisc(n) * stockM(n, j); q = Math.min(q, Math.floor(spendable(n) / (u.c * d)), Math.floor(n.mat / (u.m * d)), u.men ? Math.floor(n.mp / u.men) : 1e9, u.e ? Math.floor(n.comp / u.e + 1e-9) : 1e9); if (q <= 0) return 0;
  payM(n, q * u.c * d); n.mat -= q * u.m * d; n.mp -= q * u.men; n.comp -= q * u.e;
  if (now || (S.cheat.fast && n.id === S.player)) addUnits(n.id, ci, j, q);
  else { const t = u.bt * (1 + .06 * (q - 1)) / (1 + .15 * S.city[ci].ars) * disc(n); S.q.push({ o: n.id, ci, j, q, t, T: t }); }
  return q;
}
function addUnits(o, ci, j, q) {
  const sea = UN[j].cl === 2, sk = UN[j].cat === 'Strat' && !sea ? UN[j].k : null; let a = S.armies.find(x => x.o === o && x.at === ci && x.tl < 0 && !x.path.length && x.sea === sea && (sk ? stratK(x) === sk && (sk !== 'vsx' || x.u[UI.vsx] >= .5) : !(x.u[UI.vsx] >= .5) && !(x.u[UI.nbomb] >= .5 && !aland(x))));
  if (!a) { a = mkArmy(o, ci, sea); S.armies.push(a); }
  const old = adiv(a); a.xp = (a.xp || 0) * old / (old + q); a.u[j] += q; addCargo(a, j, q); if (UN[j].sup) superFix(a); needRecalc = true;
}
function queueTick() {
  if (!S.q.length) return; const done = [];
  for (const x of S.q) { const cs = S.city[x.ci]; if (cs.o !== x.o) { x.t = -9; x.lost = 1; continue; } x.t -= (cs.riot || -9) > S.day ? .4 : 1; if (x.t <= 0) done.push(x); }
  for (const x of done) if (!x.lost) { addUnits(x.o, x.ci, x.j, x.q); if (x.o === S.player) addLog(`🏭 ${x.q} × ${UN[x.j].n.toLowerCase()} prêt${x.q > 1 && !LANGEN ? 's' : ''} à <b>${C[x.ci].name}</b>.`, 3, x.ci); }
  S.q = S.q.filter(x => x.t > 0);
}
function cancelQueue(i) { const x = S.q[i]; if (!x || x.o !== S.player) return; const u = UN[x.j], n = P(), d = udisc(n); n.money += .8 * x.q * u.c * d; n.mat += .8 * x.q * u.m * d; n.mp += x.q * u.men; n.comp += x.q * u.e; S.q.splice(i, 1); }
function canBuildMissile(n, ci, k) { const m = MI[k], cs = S.city[ci]; if (m.tech && !n.tech[m.tech]) return 'Programme nucléaire requis'; if (m.req && !m.req.split('|').some(r => cs[r] > 0)) return m.req.split('|').map(r => BLD[r].n).join(' ou ') + ' requis'; return ''; }
function buyMissile(n, ci, k, q) { const m = MI[k], d = disc(n); if (canBuildMissile(n, ci, k)) return 0; q = Math.min(q, Math.floor(n.money / (m.c * d)), Math.floor(n.mat / (m.m * d)), Math.floor(n.comp / m.e + 1e-9), k === 'nuke' ? Math.floor(n.ura / 5) : 1e9); if (q <= 0) return 0; n.money -= q * m.c * d; n.mat -= q * m.m * d; n.comp -= q * m.e; if (k === 'nuke') n.ura -= 5 * q; n.ms[k] += q; return q; }
function buyCyber(n, ci, k, q) { const c = CI[k], d = disc(n); if (S.city[ci].cyber < 1) return 0; q = Math.min(q, Math.floor(n.money / (c.c * d)), Math.floor(n.mat / (c.m * d)), Math.floor(n.comp / c.e + 1e-9)); if (q <= 0) return 0; n.money -= q * c.c * d; n.mat -= q * c.m * d; n.comp -= q * c.e; n.cy[k] += q; needRecalc = true; return q; }
const maxLv = cs => Math.min(5, 3 + cs.rk);
function bcost(n, k, lv, cs) { return BLD[k].c * (lv + 1) * disc(n) * (cs ? 1 - .12 * Math.min(3, civN(cs, 'ing')) : 1); }
function canBuild(ci, k) { const cs = S.city[ci], b = BLD[k], cd = C[ci]; if (b.coast && !cd.co) return 'ville côtière requise'; if (b.rel && cd.rel < b.rel) return 'relief insuffisant'; if (cs[k] >= maxLv(cs)) return cs[k] >= 5 ? 'max' : 'rang de ville insuffisant'; return ''; }
function build(n, ci, k) { const cs = S.city[ci]; if (canBuild(ci, k)) return false; const c = bcost(n, k, cs[k], cs); if (n.money < c || n.mat < c / 5) return false; n.money -= c; n.mat -= c / 5; cs[k]++; needRecalc = true; return true; }

// ---------- IA --------------------------------------------------------
function coalition(id, vs) { let s = S.nat[id].str + Math.sqrt(S.nat[id].pop) * 4 + 4; for (const c of allies(id)) if (c !== vs) s += S.nat[c].str * .5; return s; }
function aiTurn(n) {
  if (!n.cities || !n.cities.length) return;
  const id = n.id, wars = Object.keys(n.war).map(Number), mtn = C[n.cap].rel >= 2 || C[n.cap].ter === 'toundra';
  if (n.lord != null && !S.nat[n.lord].alive) n.lord = null;
  if (!n.research) { const ks = Object.keys(TECH).filter(k => n.tech[k] < TECH[k].max && (k !== 'nuke' && k !== 'space' || n.inc > 25)); if (ks.length) n.research = { k: pick(ks), p: 0 }; }
  aiEco(n, wars); aiStrat(n, Object.keys(n.war).map(Number).filter(w => atWar(id, w)));
  const ports = n.cities.filter(ci => S.city[ci].port > 0), bases = n.cities.filter(ci => S.city[ci].airb > 0), silos = n.cities.filter(ci => S.city[ci].silo > 0), cyc = n.cities.filter(ci => S.city[ci].cyber > 0);
  const land = ['inf', 'inf', 'inf', 'meca', 'tank', 'tank', 'art', 'fs', 'heli', 'drec', 'dkam', 'dkam', 'male', 'mar', 'swarm'].concat(mtn ? ['mtn', 'mtn', 'mtn'] : ['mtn']);
  for (let i = 0; i < 6 && n.money > (wars.length ? 4 : 25); i++) {
    if (wars.length || Math.random() < .45) {
      const r = Math.random(); let ok = 0;
      if (r < .1 && ports.length && n.money > 60) ok = recruit(n, pick(ports), UI[pick(['frig', 'frig', 'dest', 'sub', n.money > 400 ? 'cv' : 'lhd'])], 1);
      else if (r < .26 && bases.length && n.money > 50) ok = recruit(n, pick(bases), UI[pick(['fight', 'fight', 'multi', 'multi', 'bomb', 'awacs', 'ucav'])], wars.length ? 2 : 1);
      else if (r < .34 && wars.length) { const k = silos.length ? pick(['srbm', 'crui', 'gmlrs', 'sam', 'ashm', 'mrbm']) : 'gmlrs'; ok = buyMissile(n, silos.length ? pick(silos) : n.cap, k, 2); }
      else if (r < .38 && cyc.length) ok = buyCyber(n, cyc[0], pick(['crecon', 'csabo', 'cew', 'cdef']), 1);
      else if (n.money > 30) ok = recruit(n, n.cap, UI[pick(land)], wars.length ? 3 : 1);
      if (!ok && !recruit(n, n.cap, 0, wars.length ? 3 : 1)) break;
    } else { const k = aiBuildPick(n), ci = ['fort', 'dca', 'airb', 'silo', 'cyber'].includes(k) ? n.cap : pick(n.cities); if (!build(n, ci, k) && !build(n, pick(n.cities), 'fac')) break; }
  }
  const mine = S.armies.filter(a => a.o === id), here = {};
  for (const a of mine) { if (a.path.length) continue; const key = aNode(a) + (a.sea ? 's' : 'l') + (a.u[UI.vsx] >= .5 ? 'v' : ''), o = here[key]; if (o) { for (let j = 0; j < NU; j++) { o.u[j] += a.u[j]; a.u[j] = 0; } if (a.cg) { o.cg = o.cg || {}; for (const k in a.cg) o.cg[k] = (o.cg[k] || 0) + a.cg[k]; a.cg = null; } supSet(o); supSet(a); if (a.gen && !o.gen) o.gen = a.gen; } else here[key] = a; }
  const wars0 = wars.filter(w => atWar(id, w));
  if (n.scn && n.scn.exp && n.lord == null) { aiExpand(n); for (const m in n.just) if (S.day >= n.just[m] && n.scn.exp.includes(+m)) { const M = S.nat[m]; if (M.alive && !isAlly(id, +m) && !(n.truce[m] > S.day) && n.str / coalition(+m, id) > 1) declareWar(id, +m, true); else delete n.just[m]; } }
  if (wars0.length) {
    aiWar(n, mine);
    const enemyAt = {}; for (const a of S.armies) if (atWar(id, a.o)) enemyAt[a.at] = (enemyAt[a.at] || 0) + apow(a) * (1 + .1 * S.nat[a.o].tech.atk);
    // frappes aériennes, missiles, cyber
    for (const a of mine) if (aair(a) >= 1 && (a.scd || 0) <= S.day) { let best = -1, bv = 0; for (const t in enemyAt) { const d = cdist(a.at, +t); if (strikeUnits(a, +t).length && enemyAt[t] > bv && d < 2500) { bv = enemyAt[t]; best = +t; } } if (best >= 0 && Math.random() < .6) airStrike(a, best, true); }
    if (Math.random() < .5) { const ks = MIS.filter(m => m.k !== 'sam' && n.ms[m.k] > 0 && (m.k !== 'nuke' || (!S.opts.doctrine && n.str < .35 * S.nat[wars0[0]].str && Math.random() < .05))); if (ks.length) { const m = pick(ks), tg = Object.keys(enemyAt).map(Number).concat(wars0.map(w => S.nat[w].cap)).filter(t => S.city[t] && atWar(id, S.city[t].o) && missileRangeOk(id, m.k, t)); if (tg.length) launchMissile(id, m.k, pick(tg)); } }
    if (Math.random() < .3) { const ks = ['crecon', 'csabo', 'cew'].filter(k => n.cy[k] > 0 && (n.cyCd[k] || 0) <= S.day); if (ks.length) cyberAttack(id, pick(ks), pick(wars0)); }
    let moved = 0;
    for (const a of mine) {
      if (a.path.length || adiv(a) < .3 || moved > 5) continue;
      const cur = nOwner(aNode(a)); if (!a.sea && atWar(id, cur) && !(enemyAt[a.at] > apow(a) * 1.5)) continue;
      if (a.sea && atWar(id, cur) && Math.random() < .8) continue;
      const r = dij(a, aNode(a)), pw = apow(a) * (1 + .1 * n.tech.atk); let best = -1, bs = 1e9;
      for (let t = 0; t < C.length; t++) {
        if (r.D[t] > 1e8 || t === aNode(a)) continue; const o = S.city[t].o; let sc;
        if (o === id) { if (!enemyAt[t]) continue; sc = r.D[t] * .5 + (enemyAt[t] > pw * 1.4 ? 80 : 0); }
        else if (atWar(id, o)) { const e = (enemyAt[t] || 0) * (a.sea ? 1 : C[t].tm.def * (1.1 + .25 * S.city[t].fort)); if (e > pw * 1.1) continue; sc = r.D[t] + e / pw * 12 - (t === S.nat[o].cap ? 8 : 0) + Math.random() * 4; }
        else continue;
        if (sc < bs) { bs = sc; best = t; }
      }
      if (best >= 0) { const p = pathTo(r, aNode(a), best); if (p) { a.path = p; a.prog = 0; setEdge(a); moved++; } }
      else if (cur !== id && !atWar(id, cur)) goHome(a);
    }
    for (const m of wars0) aiPeace(n, m);
  } else {
    for (const a of mine) if (!a.path.length && (nOwner(aNode(a)) !== id || a.tl >= 0) && adiv(a) >= .3) orderMove(a, a.sea ? a.at : n.cap) || goHome(a);
    if (n.lord != null) return;   // un vassal ne mène pas sa propre politique étrangère
    aiDip(n);
    const diff = S.opts.diff;
    for (const m in n.just) if (S.day >= n.just[m]) { const M = S.nat[m]; if (M.alive && !isAlly(id, +m) && !(n.truce[m] > S.day) && n.str / coalition(+m, id) > (S.active ? .9 : n.scn && n.scn.exp && n.scn.exp.includes(+m) ? 1 : 1.25)) declareWar(id, +m, true); else delete n.just[m]; }
    if (S.day > n.nextWar) {
      n.nextWar = S.day + (S.active ? RI(60, 200) : RI(300, 1100)) / diff;
      if (n.aggr * diff > (S.active ? .2 : .5)) {
        const seen = {}; let best = -1, br = 0;
        for (const ci of n.cities) for (const [v] of C[ci].ed) { const o = S.city[v].o; if (o === id || seen[o] || !active(o)) continue; seen[o] = 1; if (isAlly(id, o) || n.pact[o] || (n.truce[o] || 0) > S.day) continue; if (o === S.player && S.day < (S.active ? 120 : 400) / diff) continue; const O = S.nat[o]; const r = (n.str / coalition(o, id) + Math.min(.5, Math.max(0, O.infamy) / 80) - getRel(id, o) / 200) * scnTargetW(n, o); if (r > br) { br = r; best = o; } }
        if (best >= 0 && br > (S.active ? 1.2 : 3.4) - n.aggr * diff - (n.scn && n.scn.exp && n.scn.exp.includes(best) ? 1.2 : 0)) { const jk = bestJust(id, best); n.jk[best] = jk; n.just[best] = S.day + JUST[jk].d; }
      }
    }
    if (Math.random() < .04) { const ci = pick(n.cities), e = pick(C[ci].ed), o = S.city[e[0]].o; if (o !== id && o !== S.player && active(o) && !isAlly(id, o) && getRel(id, o) > 12 && Object.keys(n.ally).length < 3 && !inWar(id, o) && S.nat[o].lord == null) { n.ally[o] = 1; S.nat[o].ally[id] = 1; } }
  }
}

// ---------- tick ------------------------------------------------------
let flash = 0;
// v7.1 : un tour = un pas de simulation = DPS (4) jours de calendrier : tout prend 4 fois plus de temps dans le calendrier
const STEP = 1;
function tick() {
  dayStep();
  layerDirty = true;
  if (typeof onTick === 'function') onTick();
}
function dayStep() {
  S.day++;
  if (needRecalc || S.day % 5 === 0) recompute();
  for (const n of S.nat) {
    if (!n.alive || !active(n.id)) continue;
    n.money = Math.max(-50, n.money + n.inc - n.up - (n.intr || 0)); n.mat += n.matInc; n.mp = Math.min(Math.max(n.mp, n.mpCap), n.mp + (n.starve ? 0 : n.mpInc)); if (n.infamy > 0) n.infamy = Math.max(0, n.infamy - .02 * (1 + .2 * Math.min(5, n.dipl || 0)));
    if (n.research) { n.research.p += n.sciInc * (n.research.k === 'space' ? 1 + .25 * Math.min(4, n.astro || 0) : n.research.k === 'nuke' ? 1 + .25 * Math.min(4, n.nucs || 0) : 1); const c = techCost(n.research.k, n.tech[n.research.k]); if (n.research.p >= c) { n.tech[n.research.k]++; if (n.id === S.player) addLog(`Recherche terminée : <b>${TECH[n.research.k].n}</b> niveau ${n.tech[n.research.k]}`, 3); n.research = null; } }
    else n.sci += n.sciInc;
  }
  ecoTick(); wxTick(); queueTick(); moveArmies(); battles(); supplyTick(); dipTick(); nucTick(); v6Tick(); v7Day();
  for (const a of S.armies) if (a.u[UI.csg] || a.u[UI.vsx] || (a.sup && (a.sup.csg || a.sup.vsx))) superFix(a);
  for (const n of S.nat) if (n.alive && (n.id !== S.player || S.auto) && active(n.id) && (S.day + n.id) % 8 === 0) aiTurn(n);
  if (S.day % 10 === 0) checkVictory();
  if (S.day % 30 === 0) { histSnap(); autoSave(); }
}
function checkVictory() {
  if (S.won || !P().alive) return;
  let pp = P().pop; for (const n of S.nat) if (n.alive && n.lord === S.player) pp += n.pop; const sh = pp / worldPop, others = S.nat.some(n => n.alive && n.id !== S.player && n.lord !== S.player && active(n.id));
  if (!others || (!S.active && S.opts.win < 1 && sh >= S.opts.win)) victory();
}
function victory() {
  S.won = true;
  ask('Hégémonie mondiale', `Sous la bannière de ${chip(S.player)}<b>${nm(S.player)}</b>, l’humanité n’a plus qu’une seule voix. La Terre est à vous — et le ciel n’est plus une limite.<br><br>Que souhaitez-vous faire ?`,
    [{ t: 'Continuer sur Terre', f: () => { } }, { t: '🚀 Lancer l’exploration spatiale', f: () => enterSpace(), cls: 'on' }]);
}
const SAVEK = 'hegemonie_save_v8' + (LANGEN ? '_en' : '');
function save(silent) { let ok = false; try { localStorage.setItem(SAVEK, JSON.stringify(S)); ok = true; } catch (e) { } if (!silent) { if (saveDir) writeSave('manuelle').then(r => toast(r ? 'Partie sauvegardée dans le dossier « ' + saveDir.name + ' »' : ok ? 'Partie sauvegardée dans le navigateur (écriture du dossier refusée)' : 'Sauvegarde impossible — utilisez « Exporter »')); else toast(ok ? 'Partie sauvegardée dans le navigateur — choisissez un dossier (📁) pour l’écrire sur disque' : 'Sauvegarde locale indisponible ici — utilisez 📁 ou « Exporter »'); } }
