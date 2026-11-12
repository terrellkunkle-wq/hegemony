// ====================================================================
//  Systèmes v5 : ravitaillement, moral, ordres, généraux, mines navales,
//  bâtiments de province, factions, justifications, traités, vassaux,
//  libération, coups d’État, nations formables, migrations, relecture
// ====================================================================
let _iso = null; const isoId = a => { if (!_iso) { _iso = {}; T.forEach(t => { if (t.meta.a) _iso[t.meta.a] = t.i; }); } return _iso[a] != null ? _iso[a] : -1; };

// ---------- combat : moral, munitions, posture, général, fleuve -----------
function sideMods(x, n, river) {
  let mo = 0, w = 0, off = 0, de = 0, oos = 0, gen = null;
  for (const a of x.as) { const d = adiv(a); w += d; mo += (a.mor == null ? 80 : a.mor) * d; if (a.ord === 1) off += d; else if (a.ord === 2) de += d; if ((a.oos || 0) > graceOf(a)) oos += d; if (a.gen && (!gen || a.gen.lv > gen.lv)) gen = a.gen; }
  w = w || 1; const mor = mo / w, fo = off / w, fd = de / w, gb = gen ? 1 + .25 * (gen.lv - 1) : 0;
  x.mor = mor; x.gen = gen;
  x.tk *= (.6 + .4 * mor / 100) / .92 * (n.ammo <= 0 ? .6 : 1) * (1 + .1 * fo - .15 * fd) * (1 - .25 * oos / w) * (gen && gen.tr === 'off' ? 1 + .1 * gb : 1) * (river && !x.dfd ? .85 : 1);
  x.dMod = (1 - .08 * fo + .15 * fd) * (gen && gen.tr === 'def' ? 1 + .12 * gb : 1);
  x.sie = gen && gen.tr === 'sie' ? 1 + .3 * gb : 1;
}
function retreat(a) {
  const from = aNode(a), r = dij(a, from); let best = -1, bd = 1e9;
  for (let ci = 0; ci < NC; ci++) { if (ci === from || r.D[ci] >= bd) continue; const o = S.city[ci].o; if ((o === a.o || isAlly(a.o, o)) && !enemyLandAt(a.o, ci)) { bd = r.D[ci]; best = ci; } }
  if (best < 0) return false; const p = pathTo(r, from, best); if (!p) return false; a.path = p; a.prog = 0; setEdge(a); a.rt = S.day; return true;
}
function routCheck() {
  for (const a of S.armies) {
    if (a.hit !== S.day || a.sea || (a.rt || -99) > S.day - 6 || aland(a) < .3) continue;
    const thr = a.ord === 3 ? 45 : a.gen && a.gen.tr === 'cha' ? -1 : 15; if ((a.mor == null ? 80 : a.mor) >= thr) continue;
    if (S.cheat.god && a.o === S.player && a.ord !== 3) continue;
    if (retreat(a) && a.o === S.player) addLog(`🏳 ${esc(a.nm || 'Une armée')} ${a.ord === 3 ? 'se replie en bon ordre' : 'est en <b>déroute</b>'} (moral ${a.mor | 0}) vers <b>${nName(a.path[a.path.length - 1])}</b>.`, 1, a.at);
  }
}
// ---------- mines navales -------------------------------------------------
function mineHit(a, ci) {
  const cs = S.city[ci], m = cs.mn; if (!m || m.q <= 0 || !atWar(a.o, m.o)) return;
  const sweep = a.sea ? Math.min(1, a.u[UI.frig] / 3) : 0, l = .04 * Math.min(5, m.q) * (1 - .6 * sweep);
  for (let j = 0; j < NU; j++) a.u[j] *= 1 - l; a.hit = S.day; m.q -= 1 + (sweep >= 1 ? 2 : 0); if (FX.length < 40) FX.push({ k: 'boom', a: ci, b: ci, t0: performance.now(), dur: 1200, col: '#fff' }); if (m.q <= 0) cs.mn = null;
  if (a.o === S.player || m.o === S.player) addLog(`💥 Champ de mines devant <b>${C[ci].name}</b> : ${chip(a.o)}${nm(a.o)} perd ${(l * 100).toFixed(0)} % de ${a.sea ? 'sa flotte' : 'son convoi'}.`, a.o === S.player ? 1 : 2, ci);
}
function layMines(a) {
  const n = S.nat[a.o], cs = S.city[a.at]; if (!a.sea) return 'Seule une flotte peut mouiller des mines'; if (a.u[UI.frig] + a.u[UI.dest] + a.u[UI.sub] < 1) return 'Il faut au moins une frégate, un destroyer ou un sous-marin';
  if ((a.mcd || 0) > S.day) return 'Soutes à mines vides : encore ' + jd(a.mcd - S.day) + ' j'; if (n.money < 5) return 'Il faut 5 💰';
  if (cs.mn && cs.mn.o !== a.o && !isAlly(a.o, cs.mn.o)) { cs.mn.q -= 2; if (cs.mn.q <= 0) cs.mn = null; a.mcd = S.day + 5; return ''; }   // déminage
  n.money -= 5; cs.mn = { o: a.o, q: Math.min(10, (cs.mn ? cs.mn.q : 0) + 3) }; a.mcd = S.day + 10; return '';
}
// ---------- ravitaillement -------------------------------------------------
const SUP = {};
const graceOf = a => 5 + (a.u[UI.para] + a.u[UI.mar] + a.u[UI.fs] > adiv(a) / 2 ? 7 : 0) + (a.gen && a.gen.tr === 'log' ? 5 : 0);
function supplyMap(id) {
  const N = NC + TL.length, s = new Uint8Array(N), q = [], okO = {}, ok = o => okO[o] != null ? okO[o] : (okO[o] = o === id || isAlly(id, o) ? 1 : 0), n = S.nat[id];
  const src = x => { if (!s[x]) { s[x] = 1; q.push(x); } };
  src(n.cap); for (let ci = 0; ci < NC; ci++) { const cs = S.city[ci]; if (C[ci].co && ok(cs.o) && S.day - cs.blk >= 6) src(ci); }
  for (const k in S.tb) if (S.tb[k].tdep && S.tow[k] === id) src(NC + +k);
  while (q.length) { const u = q.pop(); for (const e of NA[u]) { if (e[1] || s[e[0]]) continue; if (ok(nOwner(e[0]))) { s[e[0]] = 1; q.push(e[0]); } } }
  return s;
}
function supplyTick() {
  for (const n of S.nat) { if (n.alive && active(n.id) && (n.id === S.player || Object.keys(n.war).length)) SUP[n.id] = supplyMap(n.id); else delete SUP[n.id]; }
  for (const a of S.armies) {
    const s = SUP[a.o]; if (a.sea || !s || aland(a) < .3) { a.oos = 0; continue; }
    const n = aNode(a); let ok = s[n]; if (!ok) for (const e of NA[n]) if (!e[1] && s[e[0]]) { ok = 1; break; }
    if (!ok && a.tl < 0 && C[a.at].co && navalAt(a.at, o => atWar(a.o, o)) <= navalAt(a.at, o => o === a.o || isAlly(a.o, o))) ok = 1;   // tête de pont ravitaillée par mer
    if (ok) { a.oos = 0; continue; }
    a.oos = (a.oos || 0) + 1; const g = graceOf(a); if (a.oos <= g || (S.cheat.god && a.o === S.player)) continue;
    for (let j = 0; j < NU; j++) a.u[j] *= .96; a.mor = Math.max(0, (a.mor == null ? 80 : a.mor) - 4);
    if (a.o === S.player && a.oos === g + 1) addLog(`📦 ${esc(a.nm || 'Une armée')} est <b>coupée de son ravitaillement</b> près de ${C[a.at].name} : 4 % de pertes par jour, puissance −25 %.`, 1, a.at);
  }
}
// ---------- bâtiments de province -----------------------------------------
const tbLv = (ti, k) => S.tb[ti] && S.tb[ti][k] || 0;
function canBuildTile(ti, k) { const b = TB[k], tl = TL[ti]; if (b.ok) { const r = b.ok(tl); if (r !== true) return r; } if (tbLv(ti, k) >= (k === 'tdep' ? 1 : 3)) return 'max'; return ''; }
const tbCost = (n, ti, k) => TB[k].c * (tbLv(ti, k) + 1) * disc(n);
function buildTile(n, ti, k) { if (S.tow[ti] !== n.id || canBuildTile(ti, k)) return false; const c = tbCost(n, ti, k); if (n.money < c || n.mat < c / 5) return false; n.money -= c; n.mat -= c / 5; (S.tb[ti] || (S.tb[ti] = {}))[k] = tbLv(ti, k) + 1; needRecalc = true; return true; }
// ---------- généraux -------------------------------------------------------
function hireGeneral(n, a) {
  if (a.gen) return 'Cette formation a déjà un général'; if (a.o !== n.id) return 'Formation étrangère'; if (n.money < 25) return 'Il faut 25 💰';
  n.money -= 25; a.gen = { n: 'Gén. ' + pick(GENNM[cultOf(n.id)].split(' ')), tr: pick(Object.keys(TRAIT)), lv: 1 }; return '';
}
// ---------- factions -------------------------------------------------------
const facOf = id => { const f = S.nat[id].fac; return f ? S.fac.find(x => x.id === f) || null : null; };
const facMembers = f => S.nat.filter(n => n.alive && n.fac === f.id).map(n => n.id);
function foundFaction(id, name) { const n = S.nat[id]; if (n.fac) return null; const f = { id: S.facId++, n: name || 'Pacte de ' + C[n.cap].name, col: FACCOL[S.facId % FACCOL.length], lead: id }; S.fac.push(f); n.fac = f.id; layerDirty = true; return f; }
function canJoinFaction(id, f) { const n = S.nat[id]; if (n.fac) return 'Vous appartenez déjà à une faction'; if (n.lord != null) return 'Un vassal suit son suzerain'; if (facMembers(f).some(m => inWar(id, m))) return 'En guerre contre un de ses membres'; if (n.infamy >= 40) return 'Infamie trop élevée (40 ou plus)'; if (getRel(id, f.lead) < 30) return 'Relations avec ' + nm(f.lead) + ' insuffisantes (30 requises)'; return ''; }
function joinFaction(id, f) { const n = S.nat[id]; n.fac = f.id; for (const m of facMembers(f)) { delete n.just[m]; delete S.nat[m].just[id]; } layerDirty = true; if (id === S.player || f.lead === S.player || T[id].meta.g > 1500) addLog(`${chip(id)}<b>${nm(id)}</b> rejoint la faction <b style="color:${f.col}">${esc(f.n)}</b>.`, 3, n.cap); }
function leaveFaction(id, silent) { const n = S.nat[id], f = facOf(id); n.fac = 0; if (!f) return; const m = facMembers(f); if (m.length < 1) S.fac = S.fac.filter(x => x !== f); else if (f.lead === id) f.lead = m.sort((a, b) => S.nat[b].str - S.nat[a].str)[0]; layerDirty = true; if (!silent && (id === S.player || m.includes(S.player))) addLog(`${chip(id)}<b>${nm(id)}</b> quitte la faction <b>${esc(f.n)}</b>.`, 3); }
function presetFactions() { for (const [name, col, list] of FAC0) { const ids = list.split(' ').map(isoId).filter(i => i >= 0); if (ids.length < 2) continue; const f = { id: S.facId++, n: name, col, lead: ids.slice().sort((a, b) => T[b].meta.g - T[a].meta.g)[0] }; S.fac.push(f); for (const i of ids) S.nat[i].fac = f.id; } }
// ---------- justifications -------------------------------------------------
function justOpts(a, b) {
  const o = ['conq'], A = S.nat[a], B = S.nat[b];
  if (B.cities.some(ci => C[ci].t === a) || (B.tilesX > 0 && S.tow.some((w, ti) => w === b && TL[ti].t === a))) o.push('rev');
  if (B.cities.some(ci => C[ci].t !== b && C[ci].t !== a)) o.push('lib');
  if (Object.keys(B.war).some(c => +c !== a && S.nat[c].alive && (isAlly(a, +c) || getRel(a, +c) >= 25))) o.push('prot');
  if (A.ideo !== B.ideo) o.push('ideo'); if (B.infamy > 30) o.push('cont');
  return o;
}
const bestJust = (a, b) => justOpts(a, b).sort((x, y) => JUST[x].d - JUST[y].d)[0];
function startJust(a, b, k) { const A = S.nat[a]; if (!justOpts(a, b).includes(k)) return 'Motif indisponible'; if ((A.truce[b] || 0) > S.day) return 'Trêve en vigueur'; if (isAlly(a, b)) return 'Nation alliée'; A.jk[b] = k; A.just[b] = S.day + JUST[k].d; return ''; }
// ---------- traités de paix ------------------------------------------------
function warScore(a, b) {
  const wr = S.wr[rkey(a, b)] || { g: {} }, A = S.nat[a], B = S.nat[b];
  const ga = (wr.g[a] || []).filter(ci => S.city[ci].o === a).length, gb = (wr.g[b] || []).filter(ci => S.city[ci].o === b).length; let ta = 0, tb = 0;
  if (A.tilesX || B.tilesX) for (let ti = 0; ti < TL.length; ti++) { const o = S.tow[ti], co = S.city[TL[ti].c].o; if (o === a && co === b) ta++; else if (o === b && co === a) tb++; }
  let s = 10 * (ga - gb) + Math.min(15, .6 * ta) - Math.min(15, .6 * tb) + 80 * ((A.str + 1) / (A.str + B.str + 2) - .5);
  if (B.cities.length <= B.maxC * .5) s += 15; if (A.cities.length <= A.maxC * .5) s -= 15;
  return clamp(Math.round(s), -100, 100);
}
function occTiles(a, b) { let n = 0; for (let ti = 0; ti < TL.length; ti++) if (S.tow[ti] === a && S.city[TL[ti].c].o === b) n++; return n; }
function peaceCost(a, b, t) { if (t.white) return -10; let c = 8; if (t.keep) c += Math.min(15, .5 * occTiles(a, b)); c += 12 * (t.cities ? t.cities.length : 0); if (t.repar) c += 10; if (t.regime) c += 12; if (t.vassal) c += 45; return Math.round(c); }
function cede(ci, to) {
  const cs = S.city[ci], from = cs.o; if (from === to) return; xpConq(from, to, ci, .5); cs.o = to; cs.occ = null; cs.civ = {}; cs.as = 0; cs.stab = isCore(cs, C[ci]) ? 60 : 40;
  for (const ti of C[ci].tiles) { const o = S.tow[ti]; if (o === from || (o !== to && !inWar(o, to) && !(S.kept && S.kept[ti] === o))) takeTile(ti, to); }
  for (const a of S.armies) if (a.o === from && a.at === ci && !isAlly(from, to)) goHome(a);
  S.q = S.q.filter(x => x.ci !== ci); cityRes(C[ci]); const fn = S.nat[from]; if (fn.cap === ci) { const l = []; for (let i = 0; i < NC; i++) if (S.city[i].o === from) l.push(i); if (l.length) fn.cap = l.sort((x, y) => S.city[y].gdp - S.city[x].gdp)[0]; }
  needRecalc = layerDirty = true;
}
function peaceApply(a, b, t) {
  const A = S.nat[a], B = S.nat[b], wr = S.wr[rkey(a, b)] || { g: {} }, out = [];
  if (t.white) { for (const ci of wr.g[a] || []) if (S.city[ci].o === a) cede(ci, b); for (const ci of wr.g[b] || []) if (S.city[ci].o === b) cede(ci, a); out.push('retour aux frontières d’avant-guerre'); }
  else {
    for (const ci of t.cities || []) if (S.city[ci].o === b && B.cap !== ci) { cede(ci, a); out.push('cession de ' + C[ci].name); }
    if (t.keep) out.push('provinces occupées conservées');
    if (t.repar) { const m = Math.max(0, B.money * .2); B.money -= m; A.money += m; B.trib[a] = S.day + 365; out.push('réparations (' + fmt(m) + ' 💰 et 10 % des recettes pendant un an)'); }
    if (t.regime && B.ideo !== A.ideo) { B.ideo = A.ideo; for (const ci of B.cities) S.city[ci].stab = Math.max(5, S.city[ci].stab - 10); out.push('changement de régime'); }
    if (t.vassal) { for (const m of Object.keys(B.war).map(Number)) if (m !== a) makePeace(b, m); if (B.fac) leaveFaction(b); B.lord = a; B.vs = S.day; B.ally = {}; for (const m of S.nat) delete m.ally[b]; out.push('vassalisation'); }
  }
  if (!t.white && t.keep) { S.kept = S.kept || {}; for (let ti = 0; ti < TL.length; ti++) { const o = S.tow[ti], co = S.city[TL[ti].c].o; if ((o === a && co === b)) S.kept[ti] = a; } }
  makePeace(a, b, !t.white && !!t.keep); recompute();
  if (out.length && (a === S.player || b === S.player || T[a].meta.g > 1500 || T[b].meta.g > 1500)) addLog(`📜 Traité entre ${chip(a)}<b>${nm(a)}</b> et ${chip(b)}<b>${nm(b)}</b> : ${out.join(', ')}.`, 3, B.cap);
}
function ceasefire(a, b, days) { const A = S.nat[a], B = S.nat[b]; A.cf[b] = B.cf[a] = S.day + (days || 60); for (const c of [A, B]) for (const ci of c.cities) S.city[ci].occ = null; layerDirty = true; addLog(`🕊 Cessez-le-feu de ${days || 60} jours entre ${chip(a)}<b>${nm(a)}</b> et ${chip(b)}<b>${nm(b)}</b>.`, 3, B.cap); }
// ---------- vassaux, libération ---------------------------------------------
function annexVassal(l, v) { const V = S.nat[v]; if (V.lord !== l) return 'Ce n’est pas votre vassal'; if (S.day - (V.vs || 0) < 365 / DPS) return 'Intégration possible après un an de vassalité (encore ' + jd(365 / DPS - S.day + (V.vs || 0)) + ' j)'; if (getRel(l, v) < 20) return 'Relations insuffisantes (20 requises)'; for (const ci of V.cities.slice()) cede(ci, l); S.nat[l].infamy += 3; eliminate(v, l); recompute(); return ''; }
function freeVassal(l, v) { const V = S.nat[v]; if (V.lord !== l) return; V.lord = null; addRel(l, v, 30); if (S.nat[l].infamy > 0) S.nat[l].infamy = Math.max(0, S.nat[l].infamy - 3); layerDirty = needRecalc = true; addLog(`${chip(v)}<b>${nm(v)}</b> recouvre sa pleine souveraineté.`, 3, V.cap); }
function liberate(by, x, asVassal) {
  const X = S.nat[x], B = S.nat[by]; if (x === by) return 'C’est votre propre nation'; if (X.alive && inWar(by, x)) return 'Faites d’abord la paix avec ' + nm(x);
  const l = B.cities.filter(ci => C[ci].t === x); if (!l.length) return 'Vous ne tenez aucune ville de ' + nm(x);
  if (l.includes(B.cap)) return 'Impossible : votre capitale en fait partie';
  if (!X.alive) { X.alive = true; X.war = {}; X.ally = {}; X.cf = {}; X.truce = {}; X.just = {}; X.pact = {}; X.trib = {}; X.wk = {}; X.fac = 0; X.money = 25; X.infamy = 0; X.fn = null; X.cities = []; X.debt = 0; X.mob = 0; X.ideo = asVassal ? B.ideo : X.ideo; }
  for (const ci of l) cede(ci, x);
  for (let ti = 0; ti < TL.length; ti++) if (S.tow[ti] === by && TL[ti].t === x && S.city[TL[ti].c].o === x) takeTile(ti, x);
  X.cap = l.includes(T[x].capC) ? T[x].capC : S.city[X.cap] && S.city[X.cap].o === x ? X.cap : l.slice().sort((p, q) => S.city[q].gdp - S.city[p].gdp)[0]; X.maxC = Math.max(l.length, 1); X.nextWar = S.day + 900;
  if (!S.armies.some(a => a.o === x)) { const a = mkArmy(x, X.cap); a.u[UI.inf] = 3 + Math.round(Math.sqrt(T[x].meta.p)); S.armies.push(a); }
  X.lord = asVassal ? by : null; X.vs = S.day; if (!asVassal) { X.ally[by] = 1; B.ally[x] = 1; }
  if (B.infamy > 0) B.infamy = Math.max(0, B.infamy - 6); addRel(by, x, 80); recompute(); layerDirty = true;
  addLog(`🕊 ${chip(by)}<b>${nm(by)}</b> libère ${chip(x)}<b>${nm(x)}</b> (${l.length} ville${l.length > 1 ? 's' : ''})${asVassal ? ', qui devient son vassal' : ''}.`, 3, X.cap); return '';
}
// ---------- coups d’État -----------------------------------------------------
function coupChance(a, b) { const A = S.nat[a], B = S.nat[b]; return clamp(.15 + (60 - (B.stab || 70)) / 100 + .05 * Math.min(4, A.cy.crecon || 0) - .3 * cyberDefense(b), .03, .8); }
function coup(a, b) {
  const A = S.nat[a], B = S.nat[b]; if (!(A.cy.crecon > 0)) return 'Il faut une unité de renseignement cyber'; if ((A.coupCd[b] || 0) > S.day) return 'Réseau grillé : encore ' + jd(A.coupCd[b] - S.day) + ' j'; if (A.money < 60) return 'Il faut 60 💰'; if (A.ideo === B.ideo) return 'Même régime que le vôtre';
  A.money -= 60; A.coupCd[b] = S.day + 180; const ok = Math.random() < coupChance(a, b) || (S.cheat.god && a === S.player);
  if (ok) { B.ideo = A.ideo; for (const ci of B.cities) S.city[ci].stab = Math.max(5, S.city[ci].stab - 15); addRel(a, b, 50); B.nextWar = S.day + 400; delete B.just[a]; needRecalc = layerDirty = true; addLog(`🎭 <b>Coup d’État</b> à ${chip(b)}<b>${nm(b)}</b> : le nouveau pouvoir adopte le régime « ${IDEO[A.ideo].n} »${a === S.player ? ' — votre opération a réussi' : ''}.`, a === S.player ? 2 : 3, B.cap); }
  else { A.infamy += 4; addRel(a, b, -40); addLog(`🎭 Tentative de coup d’État déjouée à ${chip(b)}<b>${nm(b)}</b> ; ${chip(a)}<b>${nm(a)}</b> est mis en cause.`, a === S.player || b === S.player ? 1 : 3, B.cap); }
  return '';
}
// ---------- nations formables --------------------------------------------------
function formState(n, f) { const ids = f.need.map(isoId).filter(i => i >= 0); let k = 0; for (const i of ids) { const o = S.city[T[i].capC].o; if (o === n.id || S.nat[o].lord === n.id) k++; } return { ids, k, ok: ids.length >= 2 && k === ids.length, done: (n.forms || []).includes(f.n) }; }
function formNation(n, f) {
  const st = formState(n, f); if (st.done) return 'Déjà proclamée'; if (!st.ok) return 'Il vous manque ' + (st.ids.length - st.k) + ' capitale(s)';
  n.fn = f.n; (n.forms || (n.forms = [])).push(f.n); for (const i of st.ids) if (!n.cores.includes(i)) n.cores.push(i);
  for (const ci of n.cities) S.city[ci].stab = Math.min(100, S.city[ci].stab + 10); if (n.infamy > 0) n.infamy = Math.max(0, n.infamy - 10); needRecalc = layerDirty = true;
  addLog(`🏛 ${chip(n.id)}<b>${T[n.id].name}</b> proclame <b>${f.n}</b> : ses territoires deviennent nationaux, stabilité +10, infamie −10.`, 3, n.cap); return '';
}
// ---------- cycle quotidien ---------------------------------------------------
function dipTick() {
  const pl = S.player, Pn = S.nat[pl];
  for (const o in Pn.cf) if (Pn.cf[o] === S.day && Pn.war[o] != null) addLog(`⚔ Le cessez-le-feu avec ${chip(o)}<b>${nm(o)}</b> a expiré : les hostilités reprennent.`, 1, S.nat[o].cap);
  for (const o in Pn.just) if (Pn.just[o] === S.day) addLog(`📣 Justification prête contre ${chip(o)}<b>${nm(o)}</b> (${JUST[Pn.jk[o] || 'conq'].n.toLowerCase()}).`, 3, S.nat[o].cap);
  for (const n of S.nat) {
    if (!n.alive || !active(n.id)) continue;
    if (n.stab < 35 && Math.random() < .004 && !(S.cheat.calm && n.id === pl)) { n.ideo = n.ideo === 'mil' ? 'auto' : 'mil'; n.ideoCd = S.day + 180; for (const ci of n.cities) S.city[ci].stab = Math.min(100, S.city[ci].stab + 14); needRecalc = layerDirty = true; if (n.id === pl || n.cities.length > 5 || S.active) addLog(`🎭 <b>Putsch</b> à ${chip(n.id)}<b>${nm(n.id)}</b> : ${IDEO[n.ideo].n.toLowerCase()} proclamé${n.id === pl ? ' — votre gouvernement est renversé, mais vous restez aux commandes' : ''}.`, n.id === pl ? 1 : 3, n.cap); }
    if (n.lord != null && S.nat[n.lord].alive && S.nat[n.lord].str < .4 * n.str && Math.random() < .002) { const l = n.lord; n.lord = null; addRel(l, n.id, -40); addLog(`${chip(n.id)}<b>${nm(n.id)}</b> rompt ses liens de vassalité avec ${chip(l)}<b>${nm(l)}</b>.`, l === pl ? 1 : 3, n.cap); layerDirty = true; }
  }
  if (S.day % 15 === 0) settleTiles();
  if (S.day % 30 === 0) migrate();
}
// migrations : les habitants fuient les villes en crise vers les villes stables, du pays ou des voisins
function migrate() {
  for (const n of S.nat) {
    if (!n.alive || !active(n.id) || !n.cities || n.cities.length < 1) continue; let out = 0, src = -1;
    const safe = n.cities.filter(ci => S.city[ci].stab >= 50 && !S.city[ci].occ).sort((a, b) => S.city[b].stab - S.city[a].stab)[0];
    for (const ci of n.cities) { const cs = S.city[ci]; if (cs.occ || (cs.riot || -9) > S.day || cs.stab < 35 || n.starve) { const m = cs.pop * .015; cs.pop -= m; out += m; src = ci; } }
    if (out <= 0) continue; let ab = -1, bs = 55;
    for (const [v] of C[src].ed) { const cs = S.city[v]; if (cs.o !== n.id && active(cs.o) && !inWar(n.id, cs.o) && cs.stab > bs) { bs = cs.stab; ab = v; } }
    if (safe != null) S.city[safe].pop += out * (ab >= 0 ? .5 : 1); if (ab >= 0) S.city[ab].pop += out * .5;
    needRecalc = true; if ((n.id === S.player || (ab >= 0 && S.city[ab].o === S.player)) && out > .02) addLog(`🚶 ${fmt(out * 1e6)} habitants quittent ${C[src].name}${ab >= 0 ? ' ; une partie se réfugie à ' + C[ab].name + ' (' + nm(S.city[ab].o) + ')' : ''}.`, 0, src);
  }
}
// ---------- IA : conduite de la guerre et diplomatie ----------------------------
function aiWar(n, mine) {
  let top = null; for (const a of mine) { if (a.sea) { if (hostile(n.id, a.at) && C[a.at].co && Math.random() < .3) layMines(a); continue; } a.ord = nOwner(aNode(a)) === n.id ? 2 : 1; if (!a.gen && aland(a) >= 5 && (!top || apow(a) > apow(top))) top = a; }
  if (top && n.money > 90 && Math.random() < .2) hireGeneral(n, top);
  if (n.ammo < 3 && n.money > 30) marketBuy(n, 'ammo', 15);
}
function aiPeace(n, m) {
  const id = n.id, M = S.nat[m], long = S.day - n.war[m], sc = warScore(id, m);
  if (m === S.player) {
    if (long > 90 && sc < -25 && Math.random() < .15 && !n.askedPeace) { n.askedPeace = 1; const rep = sc < -50; ask('Offre de paix', `${chip(id)}<b>${nm(id)}</b> demande la paix${rep ? ' et offre des réparations' : ''}. Vous conservez les villes et les provinces conquises.`, [{ t: 'Accepter', f: () => peaceApply(m, id, { keep: 1, repar: rep }) }, { t: 'Négocier', f: () => { sel = n.cap; A.openPeace(); } }, { t: 'Refuser', f: () => { } }]); }
    else if (long > 120 && sc > 45 && Math.random() < .1 && !n.askedPeace) { n.askedPeace = 1; ask('Ultimatum', `${chip(id)}<b>${nm(id)}</b>, en position de force, propose la paix : il garde ses conquêtes et exige des réparations (20 % de votre trésor, 10 % de vos recettes pendant un an).`, [{ t: 'Accepter', f: () => peaceApply(id, m, { keep: 1, repar: 1 }) }, { t: 'Refuser', f: () => { } }]); }
  } else if (long > 240 && S.day - n.lastGain > 150 && S.day - M.lastGain > 150) makePeace(id, m);
  else if (long > 150 && sc > 55 && Math.random() < .06) peaceApply(id, m, { keep: 1, repar: 1, vassal: M.cities.length <= 4 && M.lord == null && Math.random() < .5 });
}
function aiDip(n) {
  const id = n.id;
  if (!n.fac && !S.active) {
    const al = Object.keys(n.ally).map(Number).filter(c => S.nat[c].alive);
    if (al.length >= 2 && S.fac.length < 14 && T[id].meta.g > 60 && Math.random() < .03) { const f = foundFaction(id); for (const c of al) if (!S.nat[c].fac && c !== S.player && S.nat[c].lord == null) joinFaction(c, f); }
    else if (Math.random() < .02) { const e = pick(C[pick(n.cities)].ed), o = S.city[e[0]].o, f = o !== id && S.nat[o].alive ? facOf(o) : null; if (f && facMembers(f).length < 12 && !canJoinFaction(id, f) && S.nat[f.lead].ideo === n.ideo) joinFaction(id, f); }
  }
  if (n.fac && !S.active) { const f = facOf(id); if (!f) n.fac = 0; else if (facMembers(f).length < 2 && Math.random() < .3) leaveFaction(id, true); }
  if (n.money > 200 && n.aggr > .7 && n.cy.crecon > 0 && Math.random() < .01) { const e = pick(C[pick(n.cities)].ed), o = S.city[e[0]].o; if (o !== id && active(o) && S.nat[o].alive && !isAlly(id, o) && S.nat[o].ideo !== n.ideo && !(o === S.player && S.day < 200)) coup(id, o); }
  if (n.money > 90 && Math.random() < .08 && T[id].tiles.length) { const ti = pick(T[id].tiles), tl = TL[ti]; if (S.tow[ti] === id) buildTile(n, ti, tl.res === 'petrole' || tl.res === 'gaz' ? 'tpuits' : tl.res === 'minerai' || tl.res === 'charbon' || tl.res === 'uranium' ? 'tmine' : tl.res === 'cereales' ? 'tfarm' : pick(['tfarm', 'tfac', 'tmine'])); }
}
// ---------- relecture de l’évolution des frontières -----------------------------
function startReplay() {
  if (!S.chg.length) return toast('Aucun changement de frontière à rejouer pour l’instant');
  REPLAY = { tow: TL.map(t => C[t.c].t), i: 0, day: 0, sp: Math.max(.5, S.day / 900), mm: mapMode, speed: S.speed, hold: 0 }; S.speed = 0; mapMode = 1; if (modalOpen) closeModal(); sel = selArmy = null; selTile = -1; layerDirty = true;
  $('replay').classList.remove('hid'); renderMM();
}
function stepReplay() {
  const R = REPLAY; if (!R) return; if (R.day < S.day) { R.day = Math.min(S.day, R.day + R.sp); while (R.i < S.chg.length && S.chg[R.i] <= R.day) { R.tow[S.chg[R.i + 1]] = S.chg[R.i + 2]; R.i += 3; layerDirty = true; } } else if (++R.hold > 150) return stopReplay();
  let mine = 0; for (let i = 0; i < R.tow.length; i++) if (R.tow[i] === S.player) mine++;
  $('replay').innerHTML = `⏪ Relecture — <b>${dateStr(Math.floor(R.day))}</b> · ${chip(S.player)}${nm(S.player)} : ${mine} provinces <button data-a="stopReplay">Arrêter</button>`;
}
function stopReplay() { const R = REPLAY; if (!R) return; REPLAY = null; mapMode = R.mm; S.speed = R.speed; layerDirty = true; $('replay').classList.add('hid'); renderMM(); renderTop(); }
// ---------- notifications ----------------------------------------------------------
let autoZoom = false, lastZoom = 0;
function pushNotif(msg, city) {
  const box = $('notif'); if (!box || /^(✈|💻|🛡|🌪|🚀)/.test(msg)) return; const d = document.createElement('div'); d.className = 'ntf'; d.innerHTML = `<span>${msg}</span>${city != null ? `<button data-a="goto" data-v="${city}">Voir</button>` : ''}<button data-a="ntfX">×</button>`;
  box.prepend(d); while (box.children.length > 4) box.lastChild.remove(); setTimeout(() => d.remove(), 14000);
  if (autoZoom && city != null && performance.now() - lastZoom > 4000 && !modalOpen && !REPLAY) { lastZoom = performance.now(); const t = C[city]; flyTo(t.lon, t.lat, Math.min(cam.h, .25), 900); }
}
