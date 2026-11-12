// ====================================================================
//  Outil de triche (F2)
// ====================================================================
function toggleCheat() { $('cheat').classList.toggle('hid'); renderCheat(); }
function renderCheat() {
  const el = $('cheat'); if (el.classList.contains('hid')) return;
  if (!S) { el.innerHTML = '<h3>Triche</h3><div class="tip">Lancez d’abord une partie.</div>'; return; }
  const tg = (a, on, t) => `<button data-a="${a}" class="${on ? 'on' : ''}">${on ? '✔ ' : ''}${t}</button>`;
  if (S.phase === 'earth') {
    const c = S.cheat, tn = sel != null ? esc(C[sel].name) : '—', on = sel != null ? nm(S.city[sel].o) : '—';
    const an = selArmy ? esc(selArmy.nm || 'armée') + ' (' + nm(selArmy.o) + ')' : '—';
    el.innerHTML = `<h3>Console de triche — Terre</h3><div class="btns">Pays bénéficiaire : <select onchange="cheatBen = this.value === '' ? null : +this.value"><option value="">Vous (${nm(S.player)})</option>${S.nat.filter(n => n.alive && n.id !== S.player).sort((a, b) => nm(a.id).localeCompare(nm(b.id))).map(n => `<option value="${n.id}" ${cheatBen === n.id ? 'selected' : ''}>${nm(n.id)}</option>`).join('')}</select> <span class="dim small">trésor, ressources, science, unités, armées, niveaux</span></div><div class="tip">Cibles : ville <b>${tn}</b> · nation <b>${on}</b> · formation <b>${an}</b> (cliquez sur le globe pour changer)</div>
    <h3>Trésor et ressources</h3><div class="btns"><button data-a="cMoney">+1000 💰 +500 ⛏ +5 M 👥</button><button data-a="cMoney10">+10 000 💰</button><button data-a="cRes">+500 ⛽ 🌾 · +100 🔩 · +50 ☢</button><button data-a="cDebt">Effacer la dette</button>${tg('cResInf', c.res, 'Stocks inépuisables')}${tg('cNrj', c.nrj, 'Énergie illimitée')}${tg('cFree', c.free, 'Entretien gratuit')}</div>
    <h3>Science et espace</h3><div class="btns"><button data-a="cTech">Toutes les technologies</button><button data-a="cSci">+2000 🔬</button><button data-a="cSat">3 satellites</button><button data-a="cSatP">+25 satellites</button><button data-a="cGenTech">Niveau technologique +0,5</button><button data-a="cXl">Expérience +0,5</button><button data-a="cIntel">Renseignement total</button></div>
    <h3>Ville ciblée</h3><div class="btns"><button data-a="cInfra">Toutes les infrastructures niv. 5</button><button data-a="cRank">Métropole</button><button data-a="cPop">Population ×1,5</button><button data-a="cCiv">Tous les spécialistes</button><button data-a="cStab1">Stabilité 100</button><button data-a="cRevolt" class="w">Émeutes (stabilité 5)</button></div>
    <div class="btns">Gisement : ${Object.keys(TRES).map(k => `<button data-a="cDisc" data-v="${k}" title="Ajouter ${TRES[k][0]} à une province de la ville">${TRES[k][0]}</button>`).join('')}</div>
    <h3>Société</h3><div class="btns"><button data-a="cStab">Stabilité 100 dans toutes mes villes</button>${tg('cCalm', c.calm, 'Jamais d’émeutes chez moi')}<button data-a="cInf">Infamie à zéro</button></div>
    <h3>Militaire</h3><div class="btns"><button data-a="cArmy">Armée interarmes sur la cible</button><button data-a="cFleet">Flotte sur la cible (côtière)</button><button data-a="cPara">20 parachutistes sur la cible</button><button data-a="cMis">+10 de chaque missile</button><button data-a="cCyb">+5 de chaque unité cyber</button></div>
    <div class="btns"><select id="cuK">${UN.map((u, j) => `<option value="${j}">${u.n}</option>`).join('')}</select><button data-a="cUnit" data-n="10">+10 à la formation</button><button data-a="cUnit" data-n="50">+50</button><button data-a="cUnit" data-n="500">+500</button></div>
    <div class="btns"><button data-a="cXp">Expérience 100 et retranchement (formation)</button><button data-a="cXpAll">Idem, toutes mes formations</button><button data-a="cTele">Téléporter la formation sur la ville</button><button data-a="cHeal">Doubler la formation</button></div>
    <div class="btns">${tg('cGod', c.god, 'Forces invincibles')}${tg('cFast', c.fast, 'Marches et sièges instantanés')}<button data-a="cKill" class="w">Détruire les forces de la nation ciblée</button><button data-a="cRuin" class="w">Ruiner la nation ciblée</button></div>
    <h3>Conquête et diplomatie</h3><div class="btns"><button data-a="cAnnexT">Annexer la ville ciblée</button><button data-a="cAnnexN">Annexer toute la nation ciblée</button><button data-a="cSwitch">Jouer la nation ciblée</button>${tg('cLove', c.love, 'Tout m’est accordé (offres, marché, régime)')}${tg('cPax', c.pax, 'IA pacifiques (aucune déclaration)')}<button data-a="cPeace">Paix générale avec moi</button><button data-a="cWarT" class="w">Guerre immédiate contre la nation ciblée</button></div>
    <h3>Forces stratégiques</h3><div class="btns"><button data-a="cStrat" data-v="csg">+1 groupe aéronaval</button><button data-a="cStrat" data-v="nbomb">+5 bombardiers d’invasion</button><button data-a="cStrat" data-v="vsx">+1 vaisseau spatial</button><button data-a="cCargo">Recharger gratuitement le contingent (formation)</button></div>
    <h3>Version 5</h3><div class="btns"><button data-a="cAmmo">+300 🎯 +200 🧺</button><button data-a="cGen">Général niv. 4 (formation)</button><button data-a="cMoral">Moral 100 partout</button><button data-a="cTiles">Prendre les provinces de la ville ciblée</button><button data-a="cTb">Aménager la province ciblée au maximum</button><button data-a="cQueue">Terminer la production</button></div>
    <div class="btns"><button data-a="cVassal">Vassaliser la nation ciblée</button><button data-a="cCoup">Coup d’État réussi (nation ciblée)</button><button data-a="cCore">Assimiler la ville ciblée</button><button data-a="cCf">Cessez-le-feu avec tous</button><button data-a="cScore" title="La prochaine négociation sera acceptée">Traité imposé (bascule « Tout m’est accordé »)</button></div>
    <h3>Météo</h3><div class="btns"><button data-a="cWxClear">Dissiper toute la météo</button>${Object.keys(WX).map(k => `<button data-a="cWx" data-v="${k}" title="${WX[k].n} sur la ville ciblée">${WX[k].ic}</button>`).join('')}</div>
    <h3>Temps et partie</h3><div class="btns"><button data-a="cSkip" data-v="30">Avancer de 30 jours</button><button data-a="cSkip" data-v="365">Avancer d’un an</button><button data-a="cWin" class="on">Victoire immédiate → choix spatial</button></div>`;
  } else {
    const c = SP.cheat, b = spUI.body != null ? bd(spUI.body).name : 'Terre';
    el.innerHTML = `<h3>Triche — Espace</h3><div class="tip">Cible : <b>${b}</b></div>
    <h3>Ressources</h3><div class="btns"><button data-a="xRes">+5000 de tout, +2000 🔬</button><button data-a="xTech">Toutes les technologies</button></div>
    <h3>Flottes</h3><div class="btns"><button data-a="xFleet">Armada + troupes sur la cible</button><button data-a="xKill">Détruire les flottes ennemies du système</button>${tg('xGod', c.god, 'Flottes et troupes invincibles')}${tg('xFast', c.fast, 'Trajets instantanés')}</div>
    <h3>Mondes</h3><div class="btns"><button data-a="xColon">Prendre possession de la cible</button><button data-a="xBuildAll">Tout construire niv. 3 sur la cible</button></div>
    <h3>Galaxie</h3><div class="btns"><button data-a="xReveal">Révéler la galaxie et les civilisations</button>${tg('xLove', c.love, 'Les civilisations acceptent tout')}<button data-a="xWin">Soumettre toutes les civilisations</button></div>`;
  }
}
var cheatBen = null;
const CHB = () => S.nat[cheatBen != null && S.nat[cheatBen] && S.nat[cheatBen].alive ? cheatBen : S.player], CHBid = () => CHB().id;
Object.assign(A, {
  cMoney() { const n = CHB(); n.money += 1000; n.mat += 500; n.mp += 5000; n.mpCap = Math.max(n.mpCap, n.mp); n.sci += 500; },
  cTech() { const n = CHB(); for (const k in TECH) n.tech[k] = TECH[k].max; n.research = null; needRecalc = true; },
  cMis() { const n = CHB(); for (const m of MIS) n.ms[m.k] += 10; n.tech.nuke = 1; },
  cCyb() { const n = CHB(); for (const c of CYB) n.cy[c.k] += 5; },
  cInf() { CHB().infamy = 0; },
  cIntel() { for (const n of S.nat) CHB().intel[n.id] = S.day + 365; toast('Renseignement total pendant un an'); },
  cArmy() { const t = sel != null && passable(CHBid(), sel) ? sel : CHB().cap; const a = mkArmy(CHBid(), t); const set = { para: 6, inf: 40, meca: 15, tank: 20, art: 10, mtn: 6, mar: 6, fs: 5, fight: 8, multi: 6, bomb: 3, heli: 6, awacs: 1, drec: 4, dkam: 10, male: 6, ucav: 3, swarm: 6 }; for (const k in set) a.u[UI[k]] = set[k]; S.armies.push(a); selArmy = a; needRecalc = true; },
  cFleet() { const t = sel != null && passable(CHBid(), sel) && C[sel].co ? sel : CHB().cities.find(ci => C[ci].co); if (t == null) return toast('Aucune ville côtière disponible'); const a = mkArmy(CHBid(), t, true); a.u[UI.frig] = 10; a.u[UI.dest] = 8; a.u[UI.sub] = 6; a.u[UI.cv] = 2; a.u[UI.lhd] = 2; S.armies.push(a); selArmy = a; needRecalc = true; },
  cInfra() { if (sel == null || S.city[sel].o !== CHBid()) return toast('Sélectionnez une de vos villes'); S.city[sel].rk = Math.max(S.city[sel].rk, 2); for (const k of BK) if (!BLD[k].coast || C[sel].co) S.city[sel][k] = 5; needRecalc = true; },
  cStrat(v) { $('cuK').value = UI[v]; A.cUnit('', { dataset: { n: v === 'nbomb' ? 5 : 1 } }); },
  cCargo() { const a = selArmy; if (!a || a.o !== CHBid() || !stratK(a)) return toast('Sélectionnez une formation stratégique'); a.cg = Object.assign(a.cg || {}, cargoCap(a)); },
  cAmmo() { CHB().ammo += 300; CHB().goods += 200; CHB().short = false; },
  cGen() { const a = selArmy; if (!a || a.o !== CHBid()) return toast('Sélectionnez une de vos formations'); a.gen = a.gen || { n: 'Gén. ' + pick(GENNM[cultOf(CHBid())].split(' ')), tr: pick(Object.keys(TRAIT)), lv: 1 }; a.gen.lv = 4; },
  cMoral() { for (const a of S.armies) if (a.o === CHBid()) { a.mor = 100; a.oos = 0; } },
  cTiles() { if (sel == null) return toast('Sélectionnez une ville'); S.kept = S.kept || {}; for (const ti of C[sel].tiles) { takeTile(ti, S.player); if (S.city[sel].o !== S.player) S.kept[ti] = S.player; } recompute(); },
  cTb() { if (selTile < 0 || S.tow[selTile] !== S.player) return toast('Sélectionnez une de vos provinces'); const b = S.tb[selTile] || (S.tb[selTile] = {}); for (const k in TB) if (!TB[k].ok || TB[k].ok(TL[selTile]) === true) b[k] = k === 'tdep' ? 1 : 3; needRecalc = true; },
  cGenTech() { const n = CHB(); n.tl = Math.min(4, (n.tl || 1) + .5); needRecalc = true; toast(nm(n.id) + ' : niveau technologique ' + n.tl.toFixed(2)); },
  cXl() { const n = CHB(); n.xl = Math.min(XPMAX, (n.xl || 1) + .5); toast(nm(n.id) + ' : expérience ' + n.xl.toFixed(2)); },
  cSatP() { const n = CHB(); n.sat = (n.sat || 0) + 25; needRecalc = true; },
  cQueue() { for (const x of S.q) if (x.o === CHBid()) x.t = 0; queueTick(); },
  cVassal() { if (sel == null) return toast('Sélectionnez une ville'); const o = S.city[sel].o; if (o === S.player) return; if (inWar(S.player, o)) peaceApply(S.player, o, { vassal: 1 }); else { const O = S.nat[o]; if (O.fac) leaveFaction(o); O.lord = S.player; O.vs = S.day - 400; layerDirty = needRecalc = true; } },
  cCoup() { if (sel == null) return toast('Sélectionnez une ville'); const o = S.city[sel].o; if (o === S.player) return; S.nat[o].ideo = P().ideo; addRel(S.player, o, 50); layerDirty = needRecalc = true; },
  cCore() { if (sel == null || S.city[sel].o !== S.player) return toast('Sélectionnez une de vos villes'); S.city[sel].core = S.player; needRecalc = true; },
  cCf() { for (const o of Object.keys(P().war).map(Number)) ceasefire(S.player, o, 60); },
  cScore() { S.cheat.love = !S.cheat.love; toast(S.cheat.love ? 'Tout vous est accordé' : 'Négociations normales'); },
  cMoney10() { CHB().money += 10000; }, cSci() { CHB().sci += 2000; if (CHB().research) CHB().research.p += 2000; },
  cRes() { const n = CHB(); n.fuel += 500; n.food += 500; n.comp += 100; n.ura += 50; n.dry = n.starve = false; },
  cDebt() { CHB().debt = 0; CHB().bankrupt = 0; needRecalc = true; },
  cResInf() { S.cheat.res = !S.cheat.res; }, cNrj() { S.cheat.nrj = !S.cheat.nrj; needRecalc = true; }, cFree() { S.cheat.free = !S.cheat.free; needRecalc = true; }, cCalm() { S.cheat.calm = !S.cheat.calm; }, cPax() { S.cheat.pax = !S.cheat.pax; },
  cSat() { CHB().sat = Math.max(CHB().sat || 0, 3); },
  cRank() { if (sel == null || S.city[sel].o !== CHBid()) return toast('Sélectionnez une de vos villes'); S.city[sel].rk = 4; needRecalc = true; },
  cPop() { if (sel == null) return toast('Sélectionnez une ville'); S.city[sel].pop *= 1.5; needRecalc = true; },
  cCiv() { if (sel == null || S.city[sel].o !== CHBid()) return toast('Sélectionnez une de vos villes'); for (const c of CIV) S.city[sel].civ[c.k] = Math.max(civN(S.city[sel], c.k), c.max || Math.max(2, civMax(sel, c.k))); needRecalc = true; },
  cStab1() { if (sel == null) return toast('Sélectionnez une ville'); S.city[sel].stab = 100; S.city[sel].riot = -9; needRecalc = true; },
  cRevolt() { if (sel == null) return toast('Sélectionnez une ville'); S.city[sel].stab = 5; needRecalc = true; },
  cStab() { for (const ci of CHB().cities) { S.city[ci].stab = 100; S.city[ci].riot = -9; } needRecalc = true; },
  cDisc(v) { if (sel == null) return toast('Sélectionnez une ville'); const cd = C[sel], own = cd.tiles.filter(t => S.tow[t] === S.city[sel].o), ti = own.find(t => !TL[t].res) ?? own[0] ?? cd.tiles[0]; if (ti == null) return toast('Cette ville n’a aucune province rattachée'); S.disc[ti] = v; TL[ti].res = v; cityRes(cd); needRecalc = layerDirty = true; toast(TRES[v][0] + ' : province n° ' + (ti + 1)); },
  cPara() { const t = sel != null && passable(CHBid(), sel) ? sel : CHB().cap; const a = mkArmy(CHBid(), t); a.u[UI.para] = 20; S.armies.push(a); selArmy = a; needRecalc = true; },
  cUnit(v, e) { const j = +$('cuK').value, q = +e.dataset.n, u = UN[j];
    if (u.cat === 'Strat') { const at = selArmy && selArmy.o === S.player ? selArmy.at : sel != null && S.city[sel].o === S.player ? sel : P().cap; let t = at; if (u.k === 'csg' && !C[t].co) t = P().cities.find(ci => C[ci].co); if (t == null) return toast('Il faut une ville côtière'); addUnits(S.player, t, j, Math.min(q, u.k === 'vsx' ? 10 : 50)); selArmy = S.armies.find(x => x.o === S.player && x.at === t && x.u[j] >= .5) || selArmy; toast(u.n + ' : ' + Math.min(q, u.k === 'vsx' ? 10 : 50) + ' à ' + C[t].name); return; }
    const a = selArmy && selArmy.o === S.player ? selArmy : null; if (!a) return toast('Sélectionnez une de vos formations'); if ((UN[j].cl === 2) !== a.sea) return toast(a.sea ? 'Une flotte n’accueille que des navires' : 'Les navires vont dans une flotte'); a.u[j] += +e.dataset.n; needRecalc = true; },
  cXp() { if (!selArmy) return toast('Sélectionnez une formation'); selArmy.xp = 100; selArmy.dig = 10; },
  cXpAll() { for (const a of S.armies) if (a.o === CHBid()) { a.xp = 100; a.dig = 10; } },
  cTele() { if (!selArmy || sel == null) return toast('Sélectionnez une formation puis une ville'); if (selArmy.sea && !C[sel].co) return toast('Une flotte ne va que dans une ville côtière'); selArmy.at = sel; selArmy.tl = -1; selArmy.path = []; selArmy.prog = 0; },
  cHeal() { if (!selArmy) return toast('Sélectionnez une formation'); for (let j = 0; j < NU; j++) selArmy.u[j] *= 2; needRecalc = true; },
  cRuin() { if (sel == null) return toast('Sélectionnez une ville'); const o = S.city[sel].o; if (o === S.player) return; const n = S.nat[o]; n.money = -40; n.fuel = 0; n.food = 0; n.comp = 0; n.mat = 0; for (const ci of n.cities) S.city[ci].stab = 10; needRecalc = true; },
  cWarT() { if (sel == null) return toast('Sélectionnez une ville'); const o = S.city[sel].o; if (o === S.player) return; delete P().truce[o]; declareWar(S.player, o, true); },
  cSkip(v) { const s0 = S.speed; for (let i = 0; i < Math.ceil(+v / DPS) && !modalOpen; i++) tick(); S.speed = s0; },
  cWxClear() { S.wx = []; cityWx.fill(-1); },
  cWx(v) { if (sel == null) return toast('Sélectionnez une ville'); spawnWx(v, C[sel], 10); },
  cKill() { if (sel == null) return toast('Sélectionnez une ville'); const o = S.city[sel].o; if (o === S.player) return; S.armies = S.armies.filter(a => a.o !== o); selArmy = null; needRecalc = true; },
  cGod() { S.cheat.god = !S.cheat.god; }, cFast() { S.cheat.fast = !S.cheat.fast; }, cLove() { S.cheat.love = !S.cheat.love; },
  cAnnexT() { if (sel == null) return toast('Sélectionnez une ville'); if (S.city[sel].o !== S.player) capture(sel, S.player); recompute(); },
  cAnnexN() { if (sel == null) return toast('Sélectionnez une ville'); const o = S.city[sel].o; if (o === S.player) return; for (let i = 0; i < C.length; i++) if (S.city[i].o === o && S.nat[o].alive) capture(i, S.player); recompute(); checkVictory(); },
  cSwitch() { if (sel == null) return toast('Sélectionnez une ville'); S.player = S.city[sel].o; if (S.active && !S.active.includes(S.player)) S.active.push(S.player); selArmy = null; recompute(); addLog(`Vous dirigez désormais ${chip(S.player)}<b>${nm(S.player)}</b>.`, 3); },
  cPeace() { for (const m of Object.keys(P().war)) makePeace(S.player, +m); },
  cWin() { if (S.won) return enterSpace(); victory(); },
  xRes() { for (const k in SP.res) SP.res[k] += k === 'sci' ? 2000 : 5000; },
  xTech() { for (const k in STECH) SP.tech[k] = STECH[k].max; SP.research = null; spLog('Toutes les technologies sont acquises.', 3); },
  xFleet() { const at = spUI.body != null ? spUI.body : SP.earth; const f = { id: SP.fid++, o: 'P', at, sh: { corv: 10, freg: 6, crois: 4, cuir: 2, porte: 1, trans: 8, colon: 2 }, tr: { marine: 10, mecha: 12, grav: 10 }, mv: null }; SP.fleets.push(f); spUI.fleet = f.id; SP.systems[bd(at).sys].seen = true; },
  xKill() { const s = spUI.sys; SP.fleets = SP.fleets.filter(f => f.o === 'P' || f.mv || bd(f.at).sys !== s); },
  xGod() { SP.cheat.god = !SP.cheat.god; }, xFast() { SP.cheat.fast = !SP.cheat.fast; }, xLove() { SP.cheat.love = !SP.cheat.love; },
  xColon() { if (spUI.body == null) return toast('Sélectionnez un astre'); const b = bd(spUI.body); if (b.owner === 'P') return; if (b.owner != null) captureBody(b, 'P'); else { b.owner = 'P'; b.tr = {}; spLog(`🏳 <b>${b.name}</b> rejoint l’humanité.`, 2); } SP.systems[b.sys].seen = true; },
  xBuildAll() { if (spUI.body == null) return toast('Sélectionnez un astre'); const b = bd(spUI.body); if (b.owner !== 'P') return toast('Ce monde ne vous appartient pas'); const q = ['yard', 'bar', 'raf', 'lab', 'hab', 'def', 'hab', 'lab', 'def', 'hab']; let i = 0; for (const s of b.slots) { if (s.dep) s.b = 'mine'; else if (!s.b) { let k = q[i++ % q.length]; while (SB[k].uniq && has(b, k)) k = q[i++ % q.length]; s.b = k; } s.lv = 3; } },
  xReveal() { SP.cheat.reveal = true; for (const s of SP.systems) s.seen = true; for (const r of SP.races) if (!r.met) { r.met = true; r.status = 'neutre'; } },
  xWin() { for (const r of SP.races) { if (!r.alive) continue; for (const b of SP.bodies) if (b.owner === r.id) { b.owner = 'P'; b.tr = {}; } r.alive = false; r.met = true; } SP.fleets = SP.fleets.filter(f => f.o === 'P'); for (const s of SP.systems) s.seen = true; spWinCheck(); }
});
document.addEventListener('click', () => setTimeout(renderCheat, 0));
