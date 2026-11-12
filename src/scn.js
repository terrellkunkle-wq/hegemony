// ====================================================================
//  Scénarios de départ et mode spectateur
// ====================================================================
// cible d’expansion : fonction (nation candidate) → vrai si la nation est dans l’axe d’expansion
const capLL = id => C[T[id].capC] || { lon: 0, lat: 0 };
const SCN = {
  std: { n: 'Monde actuel', d: 'Toutes les nations partent à égalité de règles.', mods: {} },
  gp: { n: 'Grandes puissances', d: 'Russie, Chine et États-Unis expansionnistes ; démographie africaine, pakistanaise et indonésienne dynamique.', mods: {
    RUS: { exp: o => T[o].meta.r === 'Eu' || (capLL(o).lon < 60 && capLL(o).lat > 35 && T[o].meta.r === 'As'), expN: 'vers l’ouest (Europe, Caucase)', inf: -150, aggr: 1.6 },
    CHN: { exp: o => T[o].meta.r === 'As' && capLL(o).lat < 30 && capLL(o).lon > 60 && capLL(o).lon < 126, expN: 'vers le sud et l’Inde', inf: -200, aggr: 1.5, army: 1.25, mat: 1.25, cost: .9 },
    USA: { exp: o => (T[o].meta.r === 'Am' && capLL(o).lat < 33 && T[o].meta.a !== 'USA') || T[o].meta.a === 'CAN' || T[o].meta.a === 'GRL', expN: 'vers l’Amérique latine, le Canada et le Groenland', inf: -250, aggr: 1.5, army: 1.2, inc: 1.2, nav: 1.2, air: 1.2 },
    PAK: { grow: 1.2 }, IDN: { grow: 1.2 }, '@Af': { grow: 1.2 }
  } }
};
const scnOf = id => S && S.nat[id] && S.nat[id].scn || null;
function scnFor(t) { const m = SCN[S.opts.scn || 'std'].mods; return m[t.meta.a] || m['@' + t.meta.r] || null; }
function applyScenario(key) {
  S.opts.scn = key && SCN[key] ? key : 'std'; if (S.opts.scn === 'std') return;
  for (const n of S.nat) {
    const s = scnFor(T[n.id]); if (!s) continue;
    n.scn = { inc: s.inc || 1, mat: s.mat || 1, cost: s.cost || 1, nav: s.nav || 1, air: s.air || 1, grow: s.grow || 1, army: s.army || 1, expN: s.expN || '' };
    if (s.inf) n.infamy = s.inf; if (s.aggr) n.aggr = Math.max(n.aggr, s.aggr);
    if (s.exp) { n.scn.exp = []; for (const m of S.nat) if (m.id !== n.id && s.exp(m.id)) n.scn.exp.push(m.id); }
    if (s.army && s.army !== 1) for (const a of S.armies) if (a.o === n.id) for (let j = 0; j < NU; j++) a.u[j] *= s.army;
  }
}
// pondération du choix de cible : priorité nette aux nations de l’axe d’expansion
function scnTargetW(n, o) { const s = n.scn; if (!s || !s.exp) return 1; return s.exp.includes(o) ? 2.2 : .45; }
const scnUnitM = (o, u) => { const s = scnOf(o); return s ? (u.cl === 2 ? s.nav : u.cl === 1 ? s.air : 1) : 1; };
function scnDesc(n) { const s = n.scn; if (!s) return ''; const l = []; if (s.inc !== 1) l.push('revenus ' + pct(s.inc)); if (s.mat !== 1) l.push('matériaux ' + pct(s.mat)); if (s.cost !== 1) l.push('coûts ' + pct(s.cost)); if (s.nav !== 1) l.push('marine ' + pct(s.nav)); if (s.air !== 1) l.push('aviation ' + pct(s.air)); if (s.grow !== 1) l.push('croissance démographique ' + pct(s.grow)); if (s.army !== 1) l.push('forces de départ ' + pct(s.army)); if (s.expN) l.push('expansion ' + s.expN); return l.join(', '); }
// ---------- mode spectateur -------------------------------------------------
// l’IA joue aussi la nation du joueur ; les questions qui lui sont posées sont tranchées d’office
function autoAnswer(q) {
  const t = q.title || '', b = q.btns; let i = 0;
  if (/Ultimatum/.test(t)) i = Math.max(0, b.findIndex(x => /Refuser/.test(x.t)));
  else if (/Hégémonie/.test(t)) i = 0;
  try { b[i].f(); } catch (e) { }
  addLog(`🤖 Pilote automatique — « ${t} » : ${b[i].t.replace(/<[^>]+>/g, '')}.`, 3);
}
function toggleAuto(on) { S.auto = on == null ? !S.auto : !!on; if (S.auto) { targ = null; while (askQ.length) autoAnswer(askQ.shift()); if (askCur) { const q = askCur; closeModal(); autoAnswer(q); } } toast(S.auto ? 'Mode spectateur : l’IA joue ' + nm(S.player) : 'Vous reprenez les commandes de ' + nm(S.player)); renderTop(); }

// ---------- IA expansionniste ------------------------------------------------
// voisins terrestres : villes reliées par la terre ou provinces contiguës
function landNeighbours(id) { const o = new Set(); for (const ci of S.nat[id].cities) { for (const e of C[ci].ed) if (!e[1]) o.add(S.city[e[0]].o); for (const ti of C[ci].tiles) if (S.tow[ti] === id) for (const t2 of TL[ti].adj) o.add(S.tow[t2]); } o.delete(id); return o; }
function aiExpand(n) {
  const id = n.id, s = n.scn; if (!s || !s.exp || n.lord != null || S.day < (n.expNext || 0)) return;
  const diff = S.opts.diff, wars = Object.keys(n.war).map(Number).filter(w => S.nat[w].alive); let es = 0; for (const w of wars) es += S.nat[w].str;
  n.expNext = S.day + RI(40, 120) / diff;
  if (wars.length >= 2 || es > .45 * n.str || Object.keys(n.just).length) return;
  const nb = landNeighbours(id); let best = -1, bv = 0;
  for (const o of s.exp) {
    const O = S.nat[o]; if (!O.alive || !active(o) || !nb.has(o) || inWar(id, o) || isAlly(id, o) || (n.truce[o] || 0) > S.day) continue;
    if (o === S.player && !S.auto && S.day < 300 / diff) continue;
    const ratio = n.str / coalition(o, id); if (ratio < 1.1) continue;
    const v = Math.min(4, ratio) * (1 + Math.sqrt(O.pop) / 4) * (1 + O.cities.length / 8); if (v > bv) { bv = v; best = o; }
  }
  if (best < 0) return; const jk = bestJust(id, best); n.jk[best] = jk; n.just[best] = S.day + JUST[jk].d;
  if (best === S.player || T[id].meta.g > 1500) addLog(`📣 ${chip(id)}<b>${nm(id)}</b> masse des troupes à la frontière de ${chip(best)}<b>${nm(best)}</b> (${JUST[jk].n.toLowerCase()}).`, best === S.player ? 1 : 3, S.nat[best].cap);
}
