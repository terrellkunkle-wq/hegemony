// =====================================================================
// v6 : zones hostiles et villes refuges, îles et montagnes, coalitions anti-hégémonie,
//      surextension, troubles du ravitaillement, brise-glace, changement climatique
// =====================================================================
const HZN = ['', 'Grand Nord', 'Sibérie', 'Patagonie', 'Désert du Namib', 'Outback australien', 'Sahara', 'Forêt amazonienne', 'Forêt équatoriale du Congo', 'Forêt indonésienne', 'Déserts d’Arabie, d’Iran, d’Irak et de Syrie'];
function zoneOf6(a, lon, lat, bio) {
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
const hsh6 = (i, s) => { const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); };
// îles (masses terrestres de moins de 900 000 km²) : 2 à 3,25 fois plus dures à envahir ; montagnes : 1,75 à 2,25
function initV6World() {
  const comp = new Int32Array(TL.length).fill(-1), area = []; let k = 0;
  for (let i = 0; i < TL.length; i++) { if (comp[i] >= 0) continue; const q = [i]; comp[i] = k; let a = 0; while (q.length) { const u = q.pop(); a += TL[u].area; for (const v of TL[u].adj) if (comp[v] < 0) { comp[v] = k; q.push(v); } } area.push(a); k++; }
  for (const tl of TL) {
    tl.hz = zoneOf6(T[tl.t].meta.a, tl.lon, tl.lat, tl.bio); tl.isl = area[comp[tl.i]] < 9e5 && tl.lat > -60 ? 1 : 0;
    const iF = tl.isl ? 2 + 1.25 * hsh6(tl.i, 1) : 1, mF = tl.rel === 3 ? 1.75 + .5 * hsh6(tl.i, 2) : tl.rel === 2 ? Math.sqrt(1.75 + .5 * hsh6(tl.i, 2)) : 1;
    tl.hard = Math.round(Math.max(iF, mF) * 100) / 100; tl.def0 = tl.tm.def; tl.tm = Object.assign({}, tl.tm, { def: tl.tm.def * tl.hard });
  }
  for (const c of C) { const g = TILE ? TL[tileAt(c.lon, c.lat) - 1] : null, tl = TL[c.cell] || TL[c.tiles[0]]; c.hz = g && g.hz ? g.hz : tl ? tl.hz : 0; c.isl = tl ? tl.isl : 0; c.hard = tl ? tl.hard : 1; c.def0 = c.tm.def; c.tm = Object.assign({}, c.tm, { def: c.tm.def * c.hard }); }
  for (const c of C) c.clim = climOf(c);
}
const hardTxt = h => h > 1.01 ? ` · défense ×${h.toFixed(2)}` : '';

// ---------- zones hostiles : usure aggravée des troupes étrangères (×1,5 à ×1,8) ----------
function hzAtt(a, node, base) {
  const z = node < NC ? C[node].hz : TL[node - NC].hz; if (!z) return base;
  const orig = node < NC ? C[node].t : TL[node - NC].t; if (a.o === orig || (S.nat[orig].alive && isAlly(a.o, orig))) return base;
  const ter = nTer(node); return (base + Math.max(ter.att || 0, .0015)) * R(1.5, 1.8);
}
// ---------- villes refuges : la capitale s’y replie quand l’originale est menacée ----------
function capThreat6(id, ci) {
  const cs = S.city[ci]; if (cs.o !== id) return true; if (cs.occ && atWar(id, cs.occ.by)) return true;
  for (const a of S.armies) if (!a.sea && atWar(id, a.o) && aland(a) >= 1 && cdist(a.at, ci) < 260) return true;
  return false;
}
function refuges(id) { const out = []; for (const ci of S.nat[id].cities) if (C[ci].fl === 4 && C[ci].t === id) out.push(ci); return out; }
function refugeTick() {
  for (const n of S.nat) {
    if (!n.alive || !active(n.id) || !n.cities.length) continue; const id = n.id;
    if (!Object.keys(n.war).length && n.cap0 == null) continue;
    const thr = capThreat6(id, n.cap);
    if (thr && C[n.cap].fl !== 4) {
      const rf = refuges(id).filter(ci => !capThreat6(id, ci)).sort((x, y) => S.city[y].pop - S.city[x].pop); if (!rf.length) continue;
      const old = n.cap; if (n.cap0 == null) n.cap0 = old; n.cap = rf[0]; n.calm = 0; needRecalc = true;
      // exode : la population fuit vers les refuges
      let moved = 0; for (const ci of n.cities) { if (C[ci].fl === 4 || cdist(ci, old) > 900) continue; const cs = S.city[ci], q = cs.pop * (ci === old ? .12 : .04); cs.pop -= q; moved += q; }
      for (const ci of rf) S.city[ci].pop += moved / rf.length;
      if (id === S.player || T[id].meta.g > 300) addLog(`🏕 ${chip(id)}<b>${nm(id)}</b> replie sa capitale de ${C[old].name} vers la ville refuge de <b>${C[n.cap].name}</b> (${HZN[C[n.cap].hz]}) : ${fmt(moved * 1e6)} habitants fuient avec le gouvernement.`, id === S.player ? 1 : 0, n.cap);
    } else if (thr && C[n.cap].fl === 4 && S.day % 10 === 0) {
      // menace persistante : l’exode continue vers les refuges
      const rf = refuges(id); if (rf.length) { let m = 0; for (const ci of n.cities) { if (C[ci].fl === 4 || cdist(ci, n.cap0 != null ? n.cap0 : n.cap) > 900) continue; const q = S.city[ci].pop * .01; S.city[ci].pop -= q; m += q; } for (const ci of rf) S.city[ci].pop += m / rf.length; }
    } else if (n.cap0 != null) {
      if (S.city[n.cap0].o !== id) { if (S.day % 30 === 0 && Math.random() < .2) n.cap0 = null; continue; }
      if (capThreat6(id, n.cap0)) { n.calm = 0; continue; }
      n.calm = (n.calm || 0) + 1;
      if (n.calm >= 60 / DPS) { n.cap = n.cap0; n.cap0 = null; needRecalc = true; if (id === S.player) addLog(`🏛 Le gouvernement regagne <b>${C[n.cap].name}</b> : la menace est écartée.`, 2, n.cap); }
    }
  }
}

// ---------- part de la population mondiale (vassaux compris) ----------
function hegShare(id) { let p = S.nat[id].pop; for (const m of S.nat) if (m.alive && m.lord === id) p += m.pop; return p / worldPop; }

// ---------- coalitions anti-hégémonie (38 % : 2e + 3e ; 45 % : les 5 suivants) ----------
function coalLeader() { let b = -1, bs = 0; for (const n of S.nat) if (n.alive && active(n.id) && n.lord == null) { const s = hegShare(n.id); if (s > bs) { bs = s; b = n.id; } } return [b, bs]; }
function coalCands(L) { return S.nat.filter(n => n.alive && active(n.id) && n.id !== L && n.lord !== L && n.lord == null).sort((a, b) => b.pop - a.pop).map(n => n.id); }
function coalAlly(a, b) { if (a === b || inWar(a, b)) return; const A = S.nat[a], B = S.nat[b]; A.ally[b] = B.ally[a] = 1; addRel(a, b, 25); }
function coalBreak(m, L) { const M = S.nat[m], N = S.nat[L]; delete M.ally[L]; delete N.ally[m]; delete M.pact[L]; delete N.pact[m]; if (M.fac && M.fac === N.fac) leaveFaction(m, true); addRel(m, L, -35); }
function coalJoin(m, L) {
  const c = S.coal; if (c.m.includes(m)) return; c.m.push(m); coalBreak(m, L);
  for (const o of c.m) if (o !== m) coalAlly(m, o);
  if (m === S.player || L === S.player || c.m.length <= 3) addLog(`🤝 ${chip(m)}<b>${nm(m)}</b> rejoint la <b>coalition contre ${nm(L)}</b>.`, L === S.player ? 1 : 0, S.nat[m].cap);
}
function coalTick() {
  const [L, sh] = coalLeader(); let c = S.coal;
  if (c && (c.L !== L || sh < .33 || !S.nat[c.L].alive)) { if (c.m.includes(S.player) || c.L === S.player) addLog(`🕊 La coalition contre ${nm(c.L)} se dissout : la menace d’hégémonie est écartée.`, 2); S.coal = c = null; }
  if (L < 0 || sh < .38) return;
  if (!c) { S.coal = c = { L, lv: 0, m: [], no: [], d: S.day }; }
  const want = sh >= .45 ? 2 : 1; if (want <= c.lv && S.day % 30 !== 0) return coalWar(c);
  const cand = coalCands(L), take = cand.slice(0, want === 2 ? 7 : 2);
  if (want > c.lv) { c.lv = want; addLog(`⚖ ${chip(L)}<b>${nm(L)}</b> contrôle ${(sh * 100).toFixed(1)} % de la population mondiale : ${want === 1 ? 'les deux puissances suivantes forment une coalition pour l’empêcher de l’emporter' : 'cinq nouvelles puissances rejoignent la coalition et lancent des programmes de groupes aéronavals nucléaires et de bombardiers stratégiques'}.`, L === S.player ? 1 : 3, S.nat[L].cap); }
  for (const m of take) {
    if (c.m.includes(m) || c.no.includes(m)) continue;
    if (m === S.player && !S.auto) { c.no.push(m); ask('Coalition anti-hégémonie', `${chip(L)}<b>${nm(L)}</b> contrôle ${(sh * 100).toFixed(1)} % de la population mondiale. Les grandes puissances se liguent pour l’empêcher de l’emporter. Rejoignez-vous la coalition ?`, [{ t: 'Rejoindre la coalition', f: () => { c.no = c.no.filter(x => x !== m); coalJoin(m, L); }, cls: 'on' }, { t: 'Rester à l’écart', f: () => { } }]); continue; }
    coalJoin(m, L);
  }
  coalWar(c);
}
function coalWar(c) {
  const L = c.L, N = S.nat[L]; let sum = 0; for (const m of c.m) if (S.nat[m].alive) sum += S.nat[m].str;
  const anyWar = c.m.some(m => inWar(m, L));
  for (const m of c.m) {
    const M = S.nat[m]; if (!M.alive || m === S.player || inWar(m, L) || !active(m)) continue;
    if (anyWar || c.lv >= 2 || sum > N.str * .9) { const i0 = M.infamy; declareWar(m, L, false); M.infamy = i0; }
  }
  if (c.lv >= 2) for (const m of c.m) if (m !== S.player || S.auto) coalArm(S.nat[m]);
}
// programmes stratégiques : recherche nucléaire, ports et bases niveau 5, groupes aéronavals et bombardiers
function coalArm(n) {
  if (!n.alive || !n.cities.length) return; const csg = UI.csg, nb = UI.nbomb;
  if ((n.tech.nuke || 0) < 1 && !(n.research && n.research.k === 'nuke')) n.research = { k: 'nuke', p: n.research ? n.research.p * .5 : 0 };
  n.coalF = (n.coalF || 0) + 1; n.money += 3;   // financement croisé des membres de la coalition
  const ports = n.cities.filter(ci => C[ci].co).sort((a, b) => (S.city[b].port + S.city[b].rk) - (S.city[a].port + S.city[a].rk)), cap = n.cap;
  const up = (ci, k) => { const cs = S.city[ci]; if (cs[k] >= 5) return; if (cs[k] >= maxLv(cs)) { if (n.money > rankCost(n, cs) * 1.3) upRank(n, ci); return; } if (n.money > bcost(n, k, cs[k], cs) * 1.3) build(n, ci, k); };
  if (ports.length) up(ports[0], 'port'); up(cap, 'airb');
  if (Math.random() < .5) { if (ports.length && !canRecruit(ports[0], csg) && n.money > UN[csg].c * disc(n) * 1.05) recruit(n, ports[0], csg, 1); }
  else if (!canRecruit(cap, nb) && n.money > UN[nb].c * disc(n) * 1.1) recruit(n, cap, nb, 1);
}

// ---------- surextension : villes annexées depuis moins de 6 mois ----------
const OVX = [
  { k: 'insur', n: 'Insurrection', ic: '🔥' }, { k: 'sec', n: 'Sécession', ic: '🏴' }, { k: 'sabo', n: 'Sabotage', ic: '💣' },
  { k: 'food', n: 'Pénurie alimentaire', ic: '🌾' }, { k: 'bank', n: 'Faillite locale', ic: '🏦' }, { k: 'exode', n: 'Désertion des habitants', ic: '🚶' }
];
const ovxP = id => .25 * clamp((hegShare(id) - .2) / .3, 0, 1);   // 0 à 20 %, 25 % à 50 % de la population mondiale
function ovxTick() {
  const p10 = {};
  for (let i = 0; i < NC; i++) {
    const cs = S.city[i]; if (cs.ann == null || S.day - cs.ann >= 180 / DPS || cs.o === C[i].t) continue;
    const o = cs.o, n = S.nat[o]; if (!n.alive || !active(o)) continue;
    if (p10[o] == null) { const p = ovxP(o); p10[o] = 1 - Math.pow(1 - p, 10 / (180 / DPS)); }
    if (!p10[o]) continue;
    const ev = OVX.slice().sort(() => Math.random() - .5).find(() => Math.random() < p10[o]); if (!ev) continue;
    ovxApply(i, ev);
  }
}
function ovxApply(ci, ev) {
  const cs = S.city[ci], cd = C[ci], o = cs.o, n = S.nat[o], orig = cd.t, O = S.nat[orig], pl = o === S.player || orig === S.player; let msg = '';
  switch (ev.k) {
    case 'insur': {
      cs.stab = Math.max(5, cs.stab - 20); cs.riot = S.day + 30;
      if (O.alive && active(orig) && atWar(orig, o)) { const m = mkArmy(orig, ci); m.u[UI.inf] = Math.max(2, Math.round(1 + Math.sqrt(cs.pop) * 3)); m.u[UI.fs] = 1; S.armies.push(m); msg = 'des partisans prennent les armes pour ' + nm(orig); }
      else { for (const a of S.armies) if (a.at === ci && a.o === o && !a.sea) for (let j = 0; j < NU; j++) a.u[j] *= .88; msg = 'la garnison subit des pertes, émeutes pendant 30 jours'; }
      break; }
    case 'sec': {
      if (O.alive && active(orig)) { XPF = .5; if (atWar(orig, o)) capture(ci, orig); else cede(ci, orig); XPF = 1; msg = 'la ville fait sécession et rejoint ' + nm(orig); }
      else { cs.stab = 5; cs.riot = S.day + 90; msg = 'la ville proclame son autonomie : plus aucune recette pendant 90 jours'; }
      break; }
    case 'sabo': { const bk = BK.filter(b => cs[b] > 0); for (let k = 0; k < 2 && bk.length; k++) { const b = bk.splice(RI(0, bk.length - 1), 1)[0]; cs[b]--; } cs.blk = S.day; msg = 'infrastructures détruites, échanges paralysés'; break; }
    case 'food': { n.food = Math.max(0, n.food * .75 - cs.pop * 3); cs.stab = Math.max(5, cs.stab - 10); cs.pop *= .98; msg = 'les réserves nationales de vivres reculent de 25 %'; break; }
    case 'bank': { cs.riot = S.day + 60; n.money -= Math.min(Math.max(0, n.money) * .06 + 5, 200); msg = 'banques fermées, recettes effondrées pendant 60 jours'; break; }
    case 'exode': {
      const q = cs.pop * R(.08, .15); cs.pop -= q; cs.refu = S.day + 120;
      const near = []; for (let j = 0; j < NC; j++) { const x = S.city[j]; if (x.o === o || !S.nat[x.o].alive || !active(x.o)) continue; const d = cdist(ci, j); if (d < 1500) near.push([j, d]); }
      near.sort((a, b) => a[1] - b[1]); const tg = near.slice(0, 3);
      for (const [j] of tg) { S.city[j].pop += q / tg.length; if (S.city[j].o === S.player && o !== S.player) addLog(`🚶 Des réfugiés fuyant ${cd.name} s’installent à <b>${C[j].name}</b> : main-d’œuvre supplémentaire.`, 2, j); }
      msg = fmt(q * 1e6) + ' habitants fuient' + (tg.length ? ' vers ' + tg.map(x => C[x[0]].name).join(', ') : '') + ' ; productivité de la ville −15 % pendant 120 jours'; break; }
  }
  needRecalc = true;
  if (pl) addLog(`${ev.ic} <b>${ev.n} à ${cd.name}</b> (annexion récente, surextension) : ${msg}.`, o === S.player ? 1 : 2, ci);
}

// ---------- troubles du ravitaillement (42,5 % de la population ou 25 millions de km²) ----------
function supTrouble(n) { const a = .3 * clamp((hegShare(n.id) - .425) / .075, 0, 1), b = n.area >= 25e6 ? .3 * clamp((n.area - 25e6) / 15e6, .05, 1) : 0; return Math.max(a, b); }
function supTroubleTick() {
  for (const n of S.nat) { if (!n.alive || !active(n.id)) continue; const t = supTrouble(n); if (t > 0 && !(n.supT > 0) && (n.id === S.player || T[n.id].meta.g > 1000)) addLog(`📦 ${chip(n.id)}<b>${nm(n.id)}</b> atteint ses limites logistiques : troubles du ravitaillement (${Math.round(t * 100)} %).`, n.id === S.player ? 1 : 0, n.cap); n.supT = t; }
}
function supTroubleDaily() {
  for (const a of S.armies) {
    const n = S.nat[a.o]; if (!(n.supT > 0) || (S.cheat.god && a.o === S.player)) continue; const no = nOwner(aNode(a));
    if (no === a.o && a.tl < 0 && C[a.at].t === a.o) continue;
    if (Math.random() < n.supT) { for (let j = 0; j < NU; j++) if (a.u[j] && !UN[j].sup) a.u[j] *= .985; a.mor = Math.max(0, (a.mor == null ? 80 : a.mor) - 2); }
  }
}

// ---------- brise-glace et mers gelées ----------
// en hiver, les eaux polaires (au-delà de 62°, sauf Atlantique Nord libre de glace) gèlent : seules les flottes escortées
// d’un brise-glace passent, quatre fois plus lentement ; le réchauffement repousse la limite vers 72°.
function frozen6(u, v) {
  if (u >= NC || v >= NC) return false; const a = C[u], b = C[v], lat = Math.abs(a.lat) > Math.abs(b.lat) ? a.lat : b.lat, al = Math.abs(lat);
  const thr = 62 + 10 * clamp((climCC() - .4) / .6, 0, 1); if (al < thr) return false;
  if (lat > 0 && al < 72 && a.lon > -30 && a.lon < 45 && b.lon > -30 && b.lon < 45) return false;
  return seasonAt(lat, S.day) === 0;
}
const hasIce = a => a.u[UI.brise] >= .5;

// ---------- changement climatique : 20 effets progressifs jusqu’en 2100, stables ensuite ----------
const climCC = () => clamp((calY() - 2026) / 74, 0, 1);
const climDT = () => 1.4 + 1.3 * climCC();   // réchauffement par rapport à l’ère préindustrielle (°C)
const CLIM = [
  { k: 'sahel', n: 'Désertification du Sahel', ic: '🏜', z: c => c.lat > 9 && c.lat < 20 && c.lon > -18 && c.lon < 42 && c.ter !== 'jungle', f: { food: -.35, inc: -.05, grow: -.2 } },
  { k: 'med', n: 'Sécheresse méditerranéenne', ic: '☀', z: c => c.lat > 30 && c.lat < 45 && c.lon > -10 && c.lon < 42, f: { food: -.2, inc: -.04 } },
  { k: 'mer', n: 'Montée des eaux', ic: '🌊', z: c => c.co && cElev(c) < 40, f: { inc: -.12, grow: -.1 }, ev: .06 },
  { k: 'ban', n: 'Recul de la banquise arctique', ic: '🧊', z: c => c.co && c.lat > 60, f: { inc: .12 } },
  { k: 'perma', n: 'Dégel du permafrost', ic: '🫠', z: c => c.lat > 58 && (c.ter === 'taiga' || c.ter === 'toundra'), f: { mat: -.2, inc: -.06 } },
  { k: 'bor', n: 'Verdissement boréal', ic: '🌱', z: c => c.lat > 50 && c.lat < 70 && (c.ter === 'taiga' || c.ter === 'toundra' || c.ter === 'steppe'), f: { food: .4 } },
  { k: 'cani', n: 'Canicules extrêmes', ic: '🥵', z: c => Math.abs(c.lat) < 35 && !c.co, f: { inc: -.08, pw: .12 } },
  { k: 'cyc', n: 'Cyclones renforcés', ic: '🌀', z: c => c.co && Math.abs(c.lat) > 8 && Math.abs(c.lat) < 32, f: { inc: -.04 }, ev: .08 },
  { k: 'mous', n: 'Mousson perturbée', ic: '🌧', z: c => c.lat > 5 && c.lat < 32 && c.lon > 65 && c.lon < 125, f: { food: -.2 } },
  { k: 'amaz', n: 'Dépérissement amazonien', ic: '🪵', z: c => c.ter === 'jungle' && c.lon > -80 && c.lon < -44, f: { food: -.15, mat: -.2 } },
  { k: 'glac', n: 'Fonte des glaciers', ic: '🏔', z: c => c.rel >= 2 && Math.abs(c.lat) > 22, f: { pw: -.1, food: -.1 } },
  { k: 'peche', n: 'Effondrement des pêcheries', ic: '🐟', z: c => c.co && Math.abs(c.lat) < 40, f: { food: -.1 } },
  { k: 'agri', n: 'Migration des ceintures agricoles', ic: '🌾', z: c => c.lat > 45 && c.lat < 62 && (c.ter === 'plaine' || c.ter === 'steppe'), f: { food: .2 } },
  { k: 'clim', n: 'Demande de climatisation', ic: '❄', z: c => Math.abs(c.lat) < 30, f: { pw: .18 } },
  { k: 'malad', n: 'Maladies tropicales', ic: '🦟', z: c => Math.abs(c.lat) < 23, f: { grow: -.25, inc: -.03 } },
  { k: 'migr', n: 'Migrations climatiques', ic: '🚶', z: c => (c.lat > 9 && c.lat < 20 && c.lon > -18 && c.lon < 42) || (c.lat > 5 && c.lat < 28 && c.lon > 65 && c.lon < 95), f: { grow: -.2 }, mig: 1 },
  { k: 'feux', n: 'Mégafeux de forêt', ic: '🔥', z: c => (c.ter === 'foret' || c.ter === 'taiga' || c.ter === 'savane') && Math.abs(c.lat) > 25, f: { mat: -.1 }, ev: .07 },
  { k: 'neige', n: 'Recul de l’enneigement', ic: '⛷', z: c => c.rel >= 2 && Math.abs(c.lat) > 35 && Math.abs(c.lat) < 55, f: { inc: -.05 } },
  { k: 'sable', n: 'Tempêtes de sable', ic: '🌪', z: c => c.ter === 'desert', f: { inc: -.05, food: -.05 }, att: .001 },
  { k: 'surge', n: 'Submersions et ondes de tempête', ic: '🌊', z: c => c.co && Math.abs(c.lat) > 30 && Math.abs(c.lat) < 62, f: { inc: -.04 }, ev: .05 }
];
function cElev(c) { const t = TL[c.cell] || TL[c.tiles[0]]; return t ? t.elev : 100; }
function climOf(c) { const o = { inc: 0, food: 0, mat: 0, pw: 0, grow: 0, l: [] }; CLIM.forEach((e, i) => { if (!e.z(c)) return; o.l.push(i); for (const k in e.f) o[k] += e.f[k]; }); return o; }
const climM = (c, k) => 1 + climCC() * (c.clim ? c.clim[k] : 0);
let TEMP6 = null;
function climTick() {
  const cc = climCC(); if (cc <= 0) return;
  for (const c of C) {
    const cl = c.clim; if (!cl || !cl.l.length) continue; const cs = S.city[c.i];
    for (const i of cl.l) {
      const e = CLIM[i];
      if (e.ev && Math.random() < e.ev * cc * .5) { const bk = BK.filter(b => cs[b] > 0); if (bk.length) cs[pick(bk)]--; cs.pop *= 1 - .01 * cc; if (cs.o === S.player) addLog(`${e.ic} <b>${e.n}</b> à ${c.name} : une infrastructure détruite, ${fmt(cs.pop * .01 * cc * 1e6)} sinistrés.`, 1, c.i); needRecalc = true; }
      if (e.mig && Math.random() < .5) { const q = cs.pop * .002 * cc, to = pick(TEMP6 || (TEMP6 = C.filter(x => x.lat > 40 && x.lat < 62 && x.pk > 300))); if (to) { cs.pop -= q; S.city[to.i].pop += q; } }
    }
  }
}
// intensité régionale du changement climatique (mode de carte)
function climScore(c) { const cl = c.clim; return cl ? cl.inc + cl.food * .6 + cl.mat * .4 + cl.grow * .3 - cl.pw * .3 : 0; }

// ---------- tick v6 ----------
function v6Tick() {
  refugeTick(); supTroubleDaily();
  if (S.day % 10 === 5) { coalTick(); ovxTick(); supTroubleTick(); }
  if (S.day % 15 === 7) climTick();
}
