// ====================================================================
//  Doctrine nucléaire : une puissance dotée dont la capitale est menacée
//  adresse un ultimatum au belligérant ; s’il le rejette et que la menace
//  persiste à l’échéance, elle frappe — jamais une autre puissance dotée.
// ====================================================================
const hasBomb = id => S.nat[id] && S.nat[id].alive && (S.nat[id].ms.nuke || 0) > 0;
const NUC_DL = 7, NUC_GAP = 12, NUC_MAX = 3;
// forces terrestres ennemies dans la capitale, dans les villes voisines ou dans ses provinces
function capThreat(id) {
  const n = S.nat[id], cap = n.cap; if (cap == null || S.city[cap].o !== id) return null;
  const near = new Set([cap]); for (const e of C[cap].ed) if (!e[1]) near.add(e[0]);
  const cs = S.city[cap], by = {};
  for (const a of S.armies) { if (a.sea || !atWar(id, a.o) || aland(a) < 1) continue; const ci = nCity(aNode(a)); if (!near.has(ci) && !(a.tl >= 0 && C[cap].tiles.includes(a.tl))) continue; by[a.o] = (by[a.o] || 0) + apow(a); }
  if (cs.occ && atWar(id, cs.occ.by)) by[cs.occ.by] = (by[cs.occ.by] || 0) + 1;
  const ks = Object.keys(by).map(Number); if (!ks.length) return null;
  ks.sort((x, y) => by[y] - by[x]); return { foe: ks[0], pow: by[ks[0]], siege: !!cs.occ };
}
// le belligérant cède s’il n’est pas en position de force
function foeAccepts(b, a) { const B = S.nat[b], A = S.nat[a]; const sc = warScore(b, a); if (typeof powTick === 'function') powTick(); return !((B.str > 1.4 * A.str || (B.pwrE || 0) > 1.3 * (A.pwrE || 1e9)) && sc > 15) && !(hasBomb(b)); }
function nucTarget(a, b) {
  const A = S.nat[a], cap = A.cap, near = []; for (const x of S.armies) if (x.o === b && !x.sea && aland(x) >= 1 && S.city[x.at].o === b) near.push(x.at);
  const own = S.nat[b].cities; const cand = near.length ? near : own.slice().sort((x, y) => cdist(cap, x) - cdist(cap, y)).slice(0, 3);
  for (const ci of cand) if (launchSites(a, 'nuke').some(s => cdist(s, ci) <= MI.nuke.por)) return ci;
  return S.nat[b].cap;
}
function nucTick() {
  if (!S.opts.doctrine) return;
  S.ult = S.ult || {};
  for (const n of S.nat) {
    if (!n.alive || !active(n.id) || !hasBomb(n.id)) continue;
    const id = n.id, th = capThreat(id), key = id + ':' + (th ? th.foe : '');
    if (!th) continue;
    const b = th.foe, B = S.nat[b], k = id + '>' + b, u = S.ult[k];
    if (hasBomb(b)) { if (!u) { S.ult[k] = { st: 'mad', d: S.day }; addLog(`☢ ${chip(id)}<b>${nm(id)}</b>, capitale menacée, renonce à l’arme nucléaire face à ${chip(b)}<b>${nm(b)}</b>, puissance dotée : dissuasion mutuelle.`, id === S.player || b === S.player ? 1 : 3, n.cap); } continue; }
    if (id === S.player && !S.auto) continue;               // le joueur décide lui-même
    if (!u || (u.st === 'acc' && S.day - u.d > 60) || u.st === 'mad') { issueUlt(id, b); continue; }
    if (u.st === 'ref' && S.day >= u.dl && u.n < NUC_MAX && S.day - (u.last || -99) >= NUC_GAP) {
      const tgt = nucTarget(id, b), e = launchMissile(id, 'nuke', tgt);
      if (!e) { u.n++; u.last = S.day; addLog(`☢ <b>Frappe nucléaire</b> : ${chip(id)}<b>${nm(id)}</b> met son ultimatum à exécution contre ${chip(b)}<b>${nm(b)}</b> (${C[tgt].name}).`, 1, tgt); }
      else if (!u.fail) { u.fail = 1; addLog(`☢ ${chip(id)}<b>${nm(id)}</b> ne peut exécuter son ultimatum : ${e.toLowerCase()}.`, 3, n.cap); }
    }
  }
}
function issueUlt(a, b) {
  const A = S.nat[a], u = S.ult[a + '>' + b] = { st: 'wait', d: S.day, dl: S.day + NUC_DL, n: 0 };
  const txt = `${chip(a)}<b>${nm(a)}</b>, puissance nucléaire, voit sa capitale menacée et adresse un ultimatum à ${chip(b)}<b>${nm(b)}</b> : paix immédiate et retrait sous ${jd(NUC_DL)} jours, faute de quoi elle emploiera l’arme nucléaire.`;
  const accept = () => { u.st = 'acc'; u.d = S.day; makePeace(a, b); recompute(); addLog(`🕊 ${chip(b)}<b>${nm(b)}</b> cède à l’ultimatum nucléaire de ${chip(a)}<b>${nm(a)}</b> : cessez-le-feu définitif, chacun garde ses villes.`, a === S.player || b === S.player ? 2 : 3, A.cap); };
  const refuse = () => { u.st = 'ref'; addLog(`☢ ${chip(b)}<b>${nm(b)}</b> rejette l’ultimatum nucléaire de ${chip(a)}<b>${nm(a)}</b>. Échéance : ${dateStr(u.dl)}.`, 1, A.cap); };
  if (b === S.player && !S.auto) ask('☢ Ultimatum nucléaire', txt + `<br><br>Rapport de forces : vous ${fmt(S.nat[b].str)} contre ${fmt(A.str)} ; score de guerre ${sg(warScore(b, a))}. ${nm(a)} dispose de ${A.ms.nuke} ogive${A.ms.nuke > 1 ? 's' : ''}. Accepter signifie la paix immédiate : chacun garde les villes prises, les provinces occupées sont rendues, puis un an de trêve.`, [{ t: 'Accepter : paix immédiate', f: accept, cls: 'g' }, { t: 'Rejeter l’ultimatum', f: refuse, cls: 'w' }]);
  else { addLog('☢ ' + txt, a === S.player || isAlly(S.player, b) || isAlly(S.player, a) ? 1 : 3, A.cap); if (foeAccepts(b, a)) accept(); else refuse(); }
}
