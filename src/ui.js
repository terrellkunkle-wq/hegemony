// ====================================================================
//  Interface : panneaux, infobulles, ciblage, entrées, boucle principale
// ====================================================================
let toastT = 0; function toast(m) { const e = $('toast'); e.textContent = m; e.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => e.style.opacity = 0, 2400); }
function renderLog() { $('log').innerHTML = S.log.slice(0, 7).map(l => `<div class="k${l.k}" ${l.t != null ? `data-a="goto" data-v="${l.t}"` : ''}><span class="dim">${dateStr(l.d)}</span> ${l.m}</div>`).join(''); }
function modal(html) { $('mbox').innerHTML = html; $('modal').classList.remove('hid'); modalOpen = true; }
function closeModal() { $('modal').classList.add('hid'); modalOpen = false; askCur = null; if (askQ.length) showAsk(); }
const askQ = []; let askCur = null;
function ask(title, text, btns) { if (S && S.auto && S.phase === 'earth') return autoAnswer({ title, text, btns }); askQ.push({ title, text, btns }); if (!modalOpen) showAsk(); }
function showAsk() { const q = askQ.shift(); modal(`<h2>${q.title}</h2><p>${q.text}</p><div class="btns">${q.btns.map((b, i) => `<button data-a="askBtn" data-v="${i}" class="${b.cls || ''}">${b.t}</button>`).join('')}</div>`); askCur = q; }
const closeBtn = '<div class="btns" style="margin-top:10px"><button data-a="closeModal">Fermer</button></div>';

// ---------- barre du haut ----------------------------------------------
function renderTop() {
  if (!S || S.phase !== 'earth') return;
  const n = P(), net = n.inc - n.up - (n.intr || 0), sh = n.pop / worldPop * 100, se = SEAS[seasonAt(C[n.cap] ? C[n.cap].lat : 0, S.day)];
  $('top').innerHTML = `<b>${chip(n.id)}${nm(n.id)}</b>${S.active ? '<span class="tag">TEST</span>' : ''}${S.auto ? '<span class="tag" style="background:#5aa9c9">SPECTATEUR</span>' : ''}${facOf(n.id) ? `<span class="r" style="color:${facOf(n.id).col}" title="Votre faction">${esc(facOf(n.id).n)}</span>` : ''}<span class="r">${dateStr(S.day)} · ${se}</span>
  <span class="r" title="Trésor (Md$) et solde quotidien">💰 <b>${fmt(n.money)}</b> <span class="${net >= 0 ? 'grn' : 'red'}">${sg(net)}</span></span>
  <span class="r" title="Main-d’œuvre">👥 <b>${fmt(n.mp * 1000)}</b></span>
  <span class="r" title="Matériaux">⛏ <b>${fmt(n.mat)}</b> <span class="grn">${sg(n.matInc)}</span></span>
  <span class="r" title="Science">🔬 <b>${n.research ? TECH[n.research.k].n + ' ' + (n.research.p / techCost(n.research.k, n.tech[n.research.k]) * 100 | 0) + ' %' : fmt(n.sci)}</b></span>
  <span class="r" title="Infamie : au-delà de 30, le monde se ligue contre vous ; au-delà de 40, sanctions">☠ <b class="${n.infamy > 30 ? 'red' : ''}">${n.infamy.toFixed(0)}</b></span>
  <span class="r clk" data-a="openClim" title="Changement climatique : réchauffement planétaire (cliquez pour le détail des 20 effets)">🌡 <b>+${climDT().toFixed(1)} °C</b></span>${S.coal ? `<span class="r clk" data-a="openCoal" title="Coalition anti-hégémonie en cours" style="color:${S.coal.L === S.player ? '#ff6b5e' : '#ffd24a'}">⚖ <b>${S.coal.L === S.player ? 'Coalition contre vous' : 'Coalition'}</b></span>` : ''}${n.supT > 0 ? `<span class="r red" title="Troubles du ravitaillement : armées hors du territoire national, ${Math.round(n.supT * 100)} % de risque quotidien de pertes (1,5 %) et de moral">📦 <b>${Math.round(n.supT * 100)} %</b></span>` : ''}
  <span class="r" title="${S.active ? 'Villes contrôlées' : 'Part de la population mondiale'}">🌍 <b>${S.active ? n.cities.length + ' villes' : sh.toFixed(1) + ' %'}</b></span>
  <span class="sp"></span><button data-a="auto" class="${S.auto ? 'on' : ''}" title="Mode spectateur : l’IA joue votre nation (touche A)">${S.auto ? '🤖 Auto' : 'Auto'}</button><button data-a="cheat" class="cheatb" title="Console de triche (F2)">F2</button>
  ${[0, 1, 2, 3, 4, 5].map(i => `<button data-a="speed" data-v="${i}" class="${S.speed === i ? 'on' : ''}">${['❚❚', '▶', '▶▶', '×8', '×20', '×45'][i]}</button>`).join('')}
  <button data-a="openNation" title="Fiscalité, mobilisation, régime, dette">Nation</button><button data-a="openArmies" title="Liste de vos armées et flottes">Armées</button><button data-a="openMarket" title="Marché mondial">Commerce</button><button data-a="openDip">Diplomatie</button><button data-a="openTech">Recherche</button><button data-a="openRank">Scores</button><button data-a="openWx" title="Météo mondiale">☁</button><button data-a="openEnc" data-v="aide" title="Encyclopédie, lexique et aide de jeu (touche H)">📖 Aide</button>
  ${S.won ? '<button data-a="goSpace" class="on">🚀</button>' : ''}<button data-a="save" title="Sauvegarder">💾</button><button data-a="pickDir" title="Dossier des sauvegardes automatiques${saveDir ? ' : ' + esc(saveDir.name) : ''}" class="${saveDir ? 'g' : ''}">📁</button><button data-a="export" title="Exporter la partie">⇩</button>`;
  renderBot();
}
function renderBot() {
  const n = P(), ct = { t: 0, b: 0, n: 0, a: 0, d: 0 }; let men = 0;
  for (const a of S.armies) if (a.o === n.id) for (let j = 0; j < NU; j++) { const u = UN[j], v = a.u[j]; if (!v) continue; men += v * u.men; if (u.cl === 2) ct.n += v; else if (u.g === 'drone') ct.d += v; else if (u.cl === 1) ct.a += v; else if (u.g === 'blinde') ct.b += v; else ct.t += v; }
  const ms = Object.values(n.ms).reduce((s, v) => s + v, 0), er = n.eR || 1, st = (k, cls) => `<span class="r ${cls || ''}" title="${RSC[k].n} : ${RSC[k].d}">${RSC[k].ic} `;
  $('bot').innerHTML = `${st('nrj')}<b class="${er < .8 ? 'red' : er < 1 ? 'or' : 'grn'}">${Math.round(n.pwS * (1 + .1 * n.tech.nrj))}/${Math.round(n.pwD)}</b></span>
  ${st('fuel')}<b class="${n.dry ? 'red' : ''}">${fmt(n.fuel)}</b> <span class="${n.fuelInc - (n.fUse || 0) >= 0 ? 'grn' : 'red'}">${sg(n.fuelInc - (n.fUse || 0))}</span></span>
  ${st('food')}<b class="${n.starve ? 'red' : ''}">${fmt(n.food)}</b> <span class="${n.foodInc >= 0 ? 'grn' : 'red'}">${sg(n.foodInc)}</span></span>
  ${st('comp')}<b>${fmt(n.comp)}</b> <span class="grn">${sg(n.compInc)}</span></span>
  ${st('ammo')}<b class="${n.ammo <= 0 ? 'red' : ''}">${fmt(n.ammo)}</b> <span class="grn">${sg(n.ammoInc)}</span></span>
  ${st('goods')}<b class="${n.short ? 'red' : ''}">${fmt(n.goods)}</b> <span class="${n.goodsInc >= 0 ? 'grn' : 'red'}">${sg(n.goodsInc)}</span></span>
  ${st('ura')}<b>${fmt(n.ura)}</b> <span class="${n.uraInc - n.uraUse >= 0 ? 'grn' : 'red'}">${sg(n.uraInc - n.uraUse)}</span></span>
  <span class="r" title="Stabilité moyenne (pondérée par la population)">⚖ <b class="${n.stab < 40 ? 'red' : n.stab < 60 ? 'or' : ''}">${n.stab | 0}</b></span>
  ${n.debt ? `<span class="r" title="Dette publique et intérêts quotidiens">🏦 <b class="or">${fmt(n.debt)}</b> <span class="red">−${fmt(n.intr)}</span></span>` : ''}
  ${n.sanc ? '<span class="r red" title="Infamie supérieure à 40 : marché fermé, revenus −10 %">⛔ Sanctions</span>' : ''}
  <span class="sp"></span><span class="r" title="Effectifs sous les drapeaux">🪖 <b>${fmt(men * 1000)}</b></span><span class="r" title="Unités d’infanterie et d’artillerie">Troupes <b>${Math.round(ct.t)}</b></span><span class="r" title="Chars et mécanisés">Blindés <b>${Math.round(ct.b)}</b></span><span class="r">Navires <b>${Math.round(ct.n)}</b></span><span class="r">Avions <b>${Math.round(ct.a)}</b></span><span class="r">Drones <b>${Math.round(ct.d)}</b></span><span class="r">Missiles <b>${ms}</b></span><span class="r" title="Satellites de reconnaissance">🛰 <b>${n.sat || 0}</b></span>`;
}
function renderMM() {
  const lg = { 2: RELIEF.slice(1).map(r => [r.col, r.n]), 3: BKEYS.map(k => [BIOME[k].col, BIOME[k].n]), 4: Object.values(TRES).map(r => [r[1], r[0]]), 5: [['#3d8bfd', 'Vous'], ['#57ab5a', 'Alliés'], ['#e5534b', 'En guerre'], ['#e3b341', 'Pacte ou trêve'], ['#8a96a3', 'Neutres']], 15: [['#ffd24a', 'Puissance nucléaire (ogives en stock)'], ['#e3893a', 'Programme nucléaire, sans ogive'], ['#3c434c', 'Non nucléaire']], 7: RANK.map((r, i) => [RANKCOL[i], r]), 8: [['#e5534b', '< 25 : émeutes'], ['#e3893a', '25–45'], ['#e3b341', '45–60'], ['#9cc160', '60–80'], ['#57ab5a', '> 80']], 9: Object.values(IDEO).map(i => [i.col, i.n]), 10: S ? S.fac.map(f => [f.col, f.n]).concat([['#30363d', 'Sans faction']]) : null, 11: [['#e5534b', 'Guerre'], ['#f2a7b5', 'Cessez-le-feu'], ['#e3893a', 'Justification en cours'], ['#a8322b', 'Justification prête'], ['#c77dff', 'Se prépare contre vous'], ['#5aa9c9', 'Trêve'], ['#e3b341', 'Pacte'], ['#57ab5a', 'Allié']], 12: Object.values(CULTG).map(c => [c[1], c[0]]), 13: Object.values(REL).map(c => [c[1], c[0]]), 14: [['#57ab5a', 'Ravitaillée'], ['#e5534b', 'Coupée']] }[mapMode];
  $('mm').innerHTML = `<div class="mmh">Modes de carte <span class="dim" id="altro"></span></div><div class="mmg">${MODES.map((m, i) => `<button data-a="mm" data-v="${i}" class="${mapMode === i ? 'on' : ''}" title="${m[1]}">${m[0]}</button>`).join('')}</div>
  <div class="mmg" style="margin-top:3px"><button data-a="tgClouds" class="${showClouds ? 'on' : ''}" title="Couche nuageuse (touche C)">Nuages</button><button data-a="tgNight" class="${dayNight ? 'on' : ''}" title="Éclairage solaire réel et lumières des villes (touche N)">Jour/nuit</button><button data-a="tgMesh" class="${showMesh ? 'on' : ''}" title="Maillage des provinces">Maillage</button><button data-a="tgGfx" class="${gfxOn ? 'on' : ''}" title="Sous 800 km d’altitude : villes, unités et combats dessinés en détail (touche G, actif par défaut)">Détails</button><button data-a="tgZoom" class="${autoZoom ? 'on' : ''}" title="Centrer automatiquement le globe sur les alertes">Zoom auto</button></div><div class="mmg" style="margin-top:3px"><button data-a="tgGrid" class="${MT.grid ? 'on' : ''}" title="Méridiens et parallèles tous les 15° (touche L)">Lat/long</button><button data-a="tgRuler" class="${MT.ruler ? 'on' : ''}" title="Règle multipoints : clic gauche pour poser jusqu’à 30 points, clic droit pour retirer le dernier ; distances et superficie (touche R)">Règle</button><button data-a="tgCur" class="${MT.cur ? 'on' : ''}" title="Coordonnées du curseur">Coordonnées</button></div>` + (lg ? `<div class="lgd">${lg.map(l => `<span><i class="chip" style="background:${l[0]}"></i>${l[1]}</span>`).join('')}</div>` : '');
}

// ---------- infobulles --------------------------------------------------
function tipCity(ci) {
  const cd = C[ci], o = S ? S.city[ci].o : cd.t, w = S ? wxOf(ci) : null, cs = S && S.city[ci];
  let h = `<b>${cd.cap ? '★ ' : ''}${esc(cd.name)}</b><div>${chip(o)}${nm(o)}${(S ? hasBomb(o) : NUKES[T[o].meta.a]) ? ' <span class="or" title="Puissance nucléaire">☢</span>' : ''}${o !== cd.t ? ` <span class="dim">(occupe ${nm(cd.t)})</span>` : ''}</div><div class="dim">${fmt((cs ? cs.pop * 1e6 : cd.pk * 1000))} hab. · ${cd.tiles.length} province${cd.tiles.length > 1 ? 's' : ''}${cd.co ? ' · côtière' : ''}</div><div>${BIOME[cd.ter].n} · ${RELIEF[cd.rel].n}</div>${cs ? `<div class="dim">${cd.fl === 2 ? 'Base polaire' : RANK[cs.rk]} · stabilité ${cs.stab | 0}</div>` : ''}`;
  if (w) h += `<div class="or">${w.ic} ${w.n}</div>`;
  if (cs) { const b = BK.filter(k => cs[k]).map(k => BLD[k].n + ' ' + cs[k]); if (b.length) h += `<div class="dim">${b.join(' · ')}</div>`; if (cs.occ) h += `<div class="red">Siège par ${nm(cs.occ.by)} : ${(cs.occ.prog * 100 | 0)} %</div>`; if (cs.mn) h += `<div class="or">Mines navales : ${cs.mn.q} (${nm(cs.mn.o)})</div>`; const st = S.armies.filter(a => a.at === ci); if (st.length) h += `<div>${st.map(a => `${chip(a.o)}${Math.round(adiv(a))} unités`).join(' · ')}</div>`; if (targ) { const d = Math.min(...targ.sites.map(s => cdist(s, ci))); h += `<div class="${d <= targ.range ? 'grn' : 'red'}">Distance : ${Math.round(d)} km / portée ${targ.range} km</div>`; } }
  return h;
}
function compo(a) { let s = a.u.map((v, j) => Math.round(v) ? `${Math.round(v)} ${UN[j].n.toLowerCase()}` : '').filter(Boolean).join('<br>'); if (a.cg && cargoN(a) >= .5) s += '<br><span class="or">À bord : ' + Object.keys(a.cg).filter(k => a.cg[k] >= .5).map(k => fmt(a.cg[k]) + ' ' + UN[UI[k]].ab).join(' · ') + '</span>'; return s; }
function tipArmy(a) { const [md, sp] = armyMode(a); return `<b>${chip(a.o)}${a.nm ? a.nm[0].toUpperCase() + a.nm.slice(1) : a.sea ? 'Flotte' : md === 'air' ? 'Escadre aérienne' : 'Armée'} — ${nm(a.o)}</b><div class="dim">${nName(aNode(a))}${a.path.length ? ' → ' + nName(a.path[a.path.length - 1]) : ''} · ${sp} km/j</div><div>${compo(a)}</div><div class="dim">Puissance ${fmt(apow(a))} · expérience ${(a.xp || 0) | 0} · moral ${(a.mor == null ? 80 : a.mor) | 0}${a.dig ? ' · retranchée ' + a.dig + ' j' : ''}</div>${a.gen ? `<div class="or">${esc(a.gen.n)} — ${TRAIT[a.gen.tr].n} (niv. ${a.gen.lv})</div>` : ''}${a.o === S.player && a.oos > 0 ? `<div class="red">Hors ravitaillement depuis ${jd(a.oos)} j</div>` : ''}`; }
function tipWx(i) { const e = S.wx[i], w = WX[e.k]; return `<b>${w.ic} ${w.n}</b><div class="dim">Rayon ${e.r} km · encore ${jd(e.end - S.day)} j</div><div>${modStr(w)}</div>`; }
function tbStr(ti) { const b = S && S.tb[ti]; return b ? Object.keys(b).filter(k => b[k]).map(k => TB[k].n + ' ' + b[k]).join(' · ') : ''; }
function tipTile(t) { const tl = TL[t - 1], o = S ? S.tow[t - 1] : tl.t, co = S ? S.city[tl.c].o : o; return `<b>Province n° ${t}</b><div>${chip(o)}${nm(o)}${o !== co ? ' <span class="red">(occupée)</span>' : ''} · rattachée à ${esc(C[tl.c].name)}</div>${tl.riv ? '<div style="color:#7fbfff">Fleuve : franchissement +0,5 j, assaillant −15 %</div>' : ''}${tbStr(t - 1) ? `<div class="or">${tbStr(t - 1)}</div>` : ''}<div>${BIOME[tl.bio].n} · ${RELIEF[tl.rel].n} · ${fmt(tl.area)} km²</div>${tl.res ? `<div style="color:${TRES[tl.res][1] === '#1b1b1b' ? '#ccc' : TRES[tl.res][1]}">${TRES[tl.res][0]} (${TRES[tl.res][2]})</div>` : ''}<div class="dim">Altitude moyenne ${fmt(tl.elev)} m</div>`; }
function showTip(html, mx, my) { const e = $('tip'); if (!html) { e.classList.add('hid'); return; } e.innerHTML = html; e.classList.remove('hid'); const r = e.getBoundingClientRect(); e.style.left = Math.min(mx + 16, window.innerWidth - r.width - 8) + 'px'; e.style.top = Math.min(my + 14, window.innerHeight - r.height - 8) + 'px'; }

// ---------- panneau latéral ---------------------------------------------
let sideHover = false, sideT = -9;
function refreshSide(force) { if (!S || S.phase !== 'earth') return; if (!force && (sideHover || S.day - sideT < 4)) return; sideT = S.day; renderSide(); }
function armyRow(a) { return `<div class="slot ${a === selArmy || selSet.includes(a) ? 'on' : ''}" data-a="selArmy" data-v="${a.id}"><span>${chip(a.o)}${a.sea ? '⚓ ' : ''}${a.tl >= 0 ? '⛺ ' : ''}${nm(a.o)}</span><span style="text-align:right">${a.u.map((v, j) => Math.round(v) ? Math.round(v) + ' ' + UN[j].ab : '').filter(Boolean).join(' · ') || '—'}</span></div>`; }
const catOrder = ['Terre', 'Marine', 'Air', 'Drones', 'Strat'];
const CATN = { Terre: 'Forces terrestres', Marine: 'Marine', Air: 'Aviation', Drones: 'Drones', Strat: 'Forces stratégiques' };
function renderSide() {
  const el = $('side'), n = P(), pl = S.player; let h = '';
  if (targ) h += `<div class="targ">🎯 ${targ.kind === 'missile' ? 'Tir : ' + MI[targ.k].n : targ.kind === 'drop' ? 'Largage de parachutistes' : targ.kind === 'proj' ? 'Projection du contingent' : 'Frappe aérienne'} — portée ${targ.range} km. Cliquez la ville visée sur le globe. <button data-a="cancelTarg">Annuler</button></div>`;
  if (selSet.length) h += `<div class="targ">${selAll().length} formations sélectionnées — les ordres s’appliquent à toutes. <button data-a="clearSel">Désélectionner</button></div>`;
  if (selArmy) {
    const a = selArmy, [md, sp] = armyMode(a), mor = a.mor == null ? 80 : a.mor;
    h += `<h3>${a.nm ? esc(a.nm) : a.sea ? 'Flotte' : md === 'air' ? 'Escadre aérienne' : 'Armée'}</h3>${armyRow(a)}<div class="row" title="Gagnée au combat : +0,3 % de puissance par point"><span>Expérience</span><b>${(a.xp || 0) | 0} / 100 <span class="grn">${a.xp >= 1 ? '+' + (a.xp * .3).toFixed(0) + ' %' : ''}</span></b></div><div class="row" title="Une armée immobile en territoire ami se retranche : +3 % de défense par jour, 10 jours au plus"><span>Retranchement</span><b>${a.dig ? '+' + a.dig * 3 + ' % défense' : '—'}</b></div><div class="row"><span>Puissance</span><b>${fmt(apow(a) * (1 + .1 * S.nat[a.o].tech.atk))}</b></div><div class="row"><span>Vitesse</span><b>${sp} km/j (${md === 'sea' ? 'mer' : md === 'air' ? 'air' : 'terre'})</b></div>
    <div class="row" title="Baisse avec les pertes, remonte au repos. Sous 15 : déroute. Module la puissance de 60 à 100 %."><span>Moral</span><b class="${mor < 30 ? 'red' : mor < 55 ? 'or' : ''}">${mor | 0} / 100</b></div>${a.o === pl && !a.sea ? `<div class="row" title="Une armée doit rester reliée, par des provinces amies, à votre capitale, à une ville côtière amie non bloquée ou à un dépôt."><span>Ravitaillement</span><b class="${a.oos > graceOf(a) ? 'red' : a.oos > 0 ? 'or' : 'grn'}">${a.oos > 0 ? 'coupé depuis ' + a.oos + ' j (autonomie ' + graceOf(a) + ' j)' : 'assuré'}</b></div>` : ''}<div class="row"><span>Général</span><b>${a.gen ? esc(a.gen.n) + ' <span class="dim">' + TRAIT[a.gen.tr].n + ' niv. ' + a.gen.lv + ' : ' + TRAIT[a.gen.tr].d + '</span>' : '—'}</b></div><div class="row"><span>Position</span><b>${nName(aNode(a))}</b></div>${a.path.length ? `<div class="row"><span>Destination</span><b>${nName(a.path[a.path.length - 1])} <span class="dim">(${a.path.length} étape${a.path.length > 1 ? 's' : ''})</span></b></div>` : ''}<div class="compo">${compo(a)}</div>`;
    if (a.o === pl) { const ar = aair(a); h += `<div class="btns"><button data-a="split">Diviser</button><button data-a="merge">Fusionner ici</button><button data-a="stop">Halte</button><button data-a="disband" class="w">Dissoudre</button>${ar >= .5 ? `<button data-a="strike" class="on" ${(a.scd || 0) > S.day ? 'disabled' : ''}>✈ Frappe aérienne</button>` : ''}${a.u[UI.para] >= .5 ? `<button data-a="drop" class="on" title="Depuis une de vos bases aériennes, à 1 200 km au plus">🪂 Largage</button>` : ''}${stratK(a) && a.o === pl ? `<button data-a="proj" class="on" ${Object.keys(landCargo(a)).length ? '' : 'disabled'} title="${stratK(a) === 'csg' ? 'Débarque le corps expéditionnaire sur une ville côtière à 15 000 km au plus' : stratK(a) === 'vsx' ? 'Dépose les 15 000 unités embarquées sur n’importe quelle ville, sans pertes' : 'Largue les parachutistes embarqués à 15 000 km au plus'}">${stratK(a) === 'vsx' ? '🛸 Déploiement orbital' : stratK(a) === 'csg' ? '⚓ Projeter le contingent' : '🪂 Largage d’invasion'}</button><button data-a="reload" title="${canReload(a) || 'Reprend les unités de vos armées présentes ici puis achète le reste'}" ${canReload(a) ? 'disabled' : ''}>Recharger le contingent</button>` : ''}${!a.sea ? `<button data-a="retreat" title="Repli vers la ville amie la plus proche">🏳 Repli</button>` : `<button data-a="mines" ${(a.mcd || 0) > S.day ? 'disabled' : ''} title="Mouille 3 mines devant cette ville (5 💰) ou drague celles de l’ennemi">💥 Mines</button>`}${!a.gen && !a.sea ? `<button data-a="hireGen" ${n.money < 25 ? 'disabled' : ''} title="Un général apporte un bonus selon son trait et progresse avec l’expérience">Nommer un général (25 💰)</button>` : ''}</div>${!a.sea ? `<div class="btns">${ORD.map((o, i) => `<button data-a="ord" data-v="${i}" class="${(a.ord || 0) === i ? 'on' : ''}" title="${o.d}">${o.n}</button>`).join('')}</div>` : ''}<div class="tip">Clic droit sur une ville ou une province du globe pour s’y rendre. Maj+clic : ajouter à la sélection ; Maj+glisser : cadre de sélection ; Maj+6…0 : créer un groupe, 6…0 : le rappeler.</div>`; }
  }
  if (selTile >= 0) h += tileSide(selTile);
  if (sel != null) {
    const ci = sel, cd = C[ci], cs = S.city[ci], o = cs.o, O = S.nat[o], ter = cd.tm, w = wxOf(ci), we = w ? S.wx[cityWx[ci]] : null;
    h += `<h3>${cd.cap ? 'Capitale' : 'Ville'}${cd.co ? ' côtière' : ''}</h3><h2>${cd.cap ? '★ ' : ''}${esc(cd.name)}</h2><div class="dim">${chip(o)}${nm(cd.t)}${o !== cd.t ? ' — occupée par ' + nm(o) : ''}${!active(o) ? ' · hors partie' : ''}</div>
    <div class="row"><span>Population</span><b>${fmt(cs.pop * 1e6)}</b></div><div class="row"><span>PIB</span><b>${fmt(cs.gdp)} Md$</b></div><div class="row"><span>Provinces rattachées</span><b>${cd.tiles.length}${cd.tiles.some(ti => S.tow[ti] !== o) ? ' <span class="red">dont ' + cd.tiles.filter(ti => S.tow[ti] !== o).length + ' occupée(s)</span>' : ''}</b></div><div class="row"><span>Culture · religion</span><b>${CULTG[cultOf(cd.t)][0]} · ${REL[relOf(cd.t)][0]}</b></div>${!isCore(cs, cd) ? `<div class="row" title="Après 720 jours (plus vite avec des administrateurs), la ville devient territoire national"><span>Assimilation</span><b>${((cs.as || 0) / 7.2) | 0} %</b></div>` : ''}${cs.mn ? `<div class="row"><span class="or">Mines navales</span><b>${cs.mn.q} (${nm(cs.mn.o)})</b></div>` : ''}<div class="row" title="Le rang plafonne le niveau des infrastructures (3, 4 puis 5) et augmente les revenus"><span>Rang</span><b style="color:${RANKCOL[cs.rk]}">${cd.fl === 2 ? 'Base polaire' : RANK[cs.rk]}</b></div><div class="row" title="Sous 25 : émeutes. Les revenus suivent la stabilité."><span>Stabilité</span><b class="${cs.stab < 25 ? 'red' : cs.stab < 50 ? 'or' : ''}">${cs.stab | 0}${o === pl ? ' <span class="dim">→ ' + stabTarget(cs, cd, O, S.armies.some(a => a.at === ci && a.o === o && !a.sea && aland(a) >= 1)) + '</span>' : ''}${(cs.riot || -9) > S.day ? ' 🔥' : ''}</b></div>
    <div class="row"><span>Terrain</span><b>${BIOME[cd.ter].n} · ${RELIEF[cd.rel].n}</b></div><div class="tip">${modStr(ter) || 'Aucun modificateur'}</div>
    <div class="row"><span>Saison</span><b>${SEAS[seasonAt(cd.lat, S.day)]}${winterMv(ci) > 1 ? ' · sol enneigé' : ''}</b></div>
    ${w ? `<div class="row"><span>Météo</span><b class="or">${w.ic} ${w.n} (${jd(we.end - S.day)} j)</b></div><div class="tip">${modStr(w)}</div>` : '<div class="row"><span>Météo</span><b>Temps calme</b></div>'}
    ${cs.occ ? `<div class="row"><span class="red">Siège par ${nm(cs.occ.by)}</span><b>${(cs.occ.prog * 100 | 0)} %</b></div>` : ''}${S.day - cs.blk < 6 ? `<div class="row"><span class="red">Blocus naval</span><b>revenus −50 %${(cs.bd || 0) > 30 ? ' · prolongé (' + cs.bd + ' j) : vivres −50 %, stabilité −10' : ''}</b></div>` : ''}`;
    if (selArmy && selArmy.o === pl && aNode(selArmy) !== ci) h += `<div class="btns"><button data-a="moveHere" class="on">Envoyer ${selArmy.sea ? 'la flotte' : 'l’unité'} ici</button></div>`;
    if (o === pl) {
      const sec = (k, t, extra) => `<h3 class="sec" data-a="tgSec" data-v="${k}">${secOpen[k] ? '▾' : '▸'} ${t}${extra || ''}</h3>`, ud = udisc(n), d = disc(n);
      h += `<div class="row"><span>Énergie</span><b>${Math.round(cityPower(cs, cd, n))} ⚡ produits / ${Math.round(cityDemand(cs))} demandés</b></div>`;
      if (cd.t !== pl && S.nat[cd.t] && !inWar(pl, cd.t)) h += `<div class="btns"><button data-a="lib" data-v="0" class="g" title="Rend à ${nm(cd.t)} toutes ses villes que vous tenez ; infamie −6, relations +80, alliance">Libérer ${T[cd.t].name}</button><button data-a="lib" data-v="1" title="Idem, mais la nation devient votre vassal">… en vassal</button></div>`;
      const qs = S.q.map((x, i) => [x, i]).filter(x => x[0].ci === ci && x[0].o === pl);
      if (qs.length) h += `<h3>File de production <span class="dim">${qs.length}</span></h3>` + qs.map(([x, i]) => `<div class="row"><span>${x.q} × ${UN[x.j].n}<br><span class="cost">${jd(Math.ceil(x.t))} j restants · ${((1 - x.t / x.T) * 100) | 0} %</span></span><button data-a="cancelQ" data-v="${i}" title="Annuler : 80 % remboursés">×</button></div>`).join('');
      if (cs.rk < 4 && cd.fl !== 2) { const rc = rankCost(n, cs); h += `<div class="btns"><button data-a="upRank" ${n.money < rc || n.mat < rc / 4 ? 'disabled' : ''} title="Revenus +10 %, population +6 %, plafond des infrastructures relevé">Urbaniser → ${RANK[cs.rk + 1]} (${fmt(rc)} 💰)</button></div>`; }
      for (const cat in BCAT) {
        const ks = BK.filter(k => BLD[k].cat === cat); h += sec('b' + cat, 'Infrastructures — ' + BCAT[cat], ` <span class="dim">${ks.reduce((t, k) => t + cs[k], 0)}</span>`); if (!secOpen['b' + cat]) continue;
        for (const k of ks) { const why = canBuild(ci, k), c = bcost(n, k, cs[k], cs); if (why && why !== 'max' && why !== 'rang de ville insuffisant' && !cs[k]) { h += `<div class="row" title="${BLD[k].d}"><span>${BLD[k].n}</span><span class="dim small">${why}</span></div>`; continue; } h += `<div class="row" title="${BLD[k].d}"><span>${BLD[k].n} <b style="color:var(--tx)">${cs[k]}</b>/${maxLv(cs)}</span>${!why ? `<button data-a="build" data-v="${k}" ${n.money < c || n.mat < c / 5 ? 'disabled' : ''}>+ ${fmt(c)} 💰</button>` : `<span class="dim small">${why}</span>`}</div>`; }
      }
      h += sec('civ', 'Civils et scientifiques', ` <span class="dim">${Object.values(cs.civ).reduce((t, v) => t + v, 0)}</span>`);
      if (secOpen.civ) for (const c of CIV) { const why = canCiv(ci, c.k), nb = civN(cs, c.k); h += `<div class="row" title="${c.d}"><span>${c.ic} ${c.n} <b style="color:var(--tx)">${nb}</b>/${civMax(ci, c.k)}<br><span class="cost">${fmt(c.c * d)} 💰 · ${c.men * 1000} 👥 · ${c.cat}</span></span><span class="nb">${why ? `<span class="dim small">${why}</span>` : `<button data-a="civ" data-v="${c.k}" ${n.money < c.c * d || n.mp < c.men ? 'disabled' : ''}>+1</button>`}${nb ? `<button data-a="civOut" data-v="${c.k}" title="Renvoyer une équipe">−</button>` : ''}</span></div>`; }
      for (const cat of catOrder) {
        h += sec('u' + cat, CATN[cat]); if (!secOpen['u' + cat]) continue;
        UN.forEach((u, j) => { if (u.cat !== cat) return; const rq = canRecruit(ci, j), tm = umod(ter.m, u) * umod(w && w.m, u); h += `<div class="row" title="${u.d}\nAttaque ${u.att} · PV ${u.pv} · DCA ${u.aa} · ${u.vit} km/j · portée ${u.por} km · ${u.men} k hommes · carburant ${u.f}/j"><span>${u.n}${tm !== 1 && u.cl !== 2 ? ` <span class="${tm > 1 ? 'grn' : 'red'}" title="Efficacité ici">${pct(tm)}</span>` : ''}<br><span class="cost">${fmt(u.c * ud * stockM(n, j))} 💰 ${fmt(u.m * ud * stockM(n, j))} ⛏${u.e ? ' ' + u.e + ' 🔩' : ''} · ${jd(u.bt)} j${u.heavy ? ` · <span class="or" title="Unité lourde : +10 % de coût par exemplaire déjà possédé ou en production">×${stockM(n, j).toFixed(1)}</span>` : ''}</span></span>${rq ? `<span class="dim small">${rq}</span>` : (u.cat === 'Strat' ? `<span class="nb"><button data-a="recruit" data-v="${j}" data-n="1" ${spendable(n) < u.c * ud * stockM(n, j) ? 'disabled' : ''}>+1</button></span>` : `<span class="nb"><button data-a="recruit" data-v="${j}" data-n="1">+1</button><button data-a="recruit" data-v="${j}" data-n="5">+5</button><button data-a="recruit" data-v="${j}" data-n="25">+25</button></span>`)}</div>`; });
      }
      h += sec('mis', 'Missiles (stock national)');
      if (secOpen.mis) for (const m of MIS) { const rq = canBuildMissile(n, ci, m.k); h += `<div class="row" title="${m.d}"><span>${m.n} <b style="color:var(--tx)">${n.ms[m.k]}</b><br><span class="cost">${fmt(m.c * d)} 💰 ${m.e} 🔩${m.k === 'nuke' ? ' 5 ☢' : ''} · ${m.por} km${m.it ? ' · interceptable ' + Math.round(m.it * 100) + ' %' : ''}</span></span><span class="nb">${rq ? `<span class="dim small">${rq}</span>` : `<button data-a="buyMis" data-v="${m.k}" data-n="1">+1</button><button data-a="buyMis" data-v="${m.k}" data-n="5">+5</button>`}${m.k !== 'sam' && n.ms[m.k] > 0 ? `<button data-a="aimMis" data-v="${m.k}" class="w">Tirer</button>` : ''}</span></div>`; }
      h += sec('cyb', 'Cyberguerre et espace');
      if (secOpen.cyb) {
        if (cs.cyber < 1) h += '<div class="tip">Construisez un centre de cyberguerre dans cette ville pour former des unités cyber.</div>';
        for (const c of CYB) h += `<div class="row" title="${c.d}"><span>${c.n} <b style="color:var(--tx)">${n.cy[c.k]}</b><br><span class="cost">${fmt(c.c * d)} 💰 ${c.e} 🔩${c.dur ? ' · ' + jd(c.dur) + ' j' : ' · passif'}</span></span>${cs.cyber >= 1 ? `<span class="nb"><button data-a="buyCy" data-v="${c.k}">+1</button></span>` : ''}</div>`;
        const sw = canSat(n, ci); h += `<div class="row" title="Renseignement : jusqu’à +20 % d’attaque et +18 % d’interception selon la taille de la constellation. Lancement : ${jd(satDays(n, ci))} jours (universités et niveau du centre spatial l’accélèrent)"><span>🛰 Satellites <b style="color:var(--tx)">${n.sat || 0}</b>${(n.satQ || []).length ? ` <span class="dim">(+${n.satQ.length} en lancement)</span>` : ''} · renseignement ${Math.round(intelL(n) / 1.2 * 100)} %<br><span class="cost">${fmt(80 * d)} 💰 3 🔩</span></span>${sw ? `<span class="dim small">${sw}</span>` : `<span class="nb"><button data-a="buySat" ${n.money < 80 * d || n.comp < 3 ? 'disabled' : ''}>Lancer</button></span>`}</div>`;
      }
      h += `<div class="btns"><button data-a="rally">Rallier mes armées ici</button></div>`;
    } else if (O.alive && active(o)) {
      const wr = inWar(pl, o), cfOn = wr && !atWar(pl, o), al = isAlly(pl, o), rel = getRel(pl, o), j = n.just[o], intel = hasIntel(n, o), f = facOf(o), myF = facOf(pl), vas = O.lord === pl, lord = n.lord === o;
      h += `<h3>${nm(o)}</h3><div class="row"><span>Statut</span><b class="${wr ? 'red' : al ? 'grn' : ''}">${cfOn ? 'Cessez-le-feu (' + jd(n.cf[o] - S.day) + ' j)' : wr ? 'En guerre' : vas ? 'Votre vassal' : lord ? 'Votre suzerain' : al ? 'Allié' : n.pact[o] ? 'Pacte de non-agression' : (n.truce[o] || 0) > S.day ? 'Trêve (' + jd(n.truce[o] - S.day) + ' j)' : 'Paix'}</b></div>
      <div class="row"><span>Relations</span><b class="${rel < -20 ? 'red' : rel > 20 ? 'grn' : ''}">${rel | 0}</b></div><div class="row"><span>Force militaire</span><b>${fmt(O.str)} <span class="dim">(vous ${fmt(n.str)})</span></b></div><div class="row"><span>Tech. · expérience</span><b>${(O.tl || 1).toFixed(2)} · ${(O.xl || 1).toFixed(2)} <span class="dim">(vous ${(n.tl || 1).toFixed(2)} · ${(n.xl || 1).toFixed(2)})</span></b></div><div class="row"><span>Puissance · satellites</span><b>${(O.pwr || 0).toFixed(1)} · ${O.sat || 0} 🛰 <span class="dim">(vous ${(n.pwr || 0).toFixed(1)} · ${n.sat || 0})</span></b></div>
      <div class="row" title="Stock d’ogives nucléaires"><span>Arme nucléaire</span><b class="${hasBomb(o) ? 'red' : ''}">${hasBomb(o) ? '☢ oui — ' + O.ms.nuke + ' ogive' + (O.ms.nuke > 1 ? 's' : '') : O.tech.nuke ? 'non (programme nucléaire en cours)' : 'non'}</b></div>${S.opts.doctrine && S.ult && S.ult[o + '>' + pl] && S.ult[o + '>' + pl].st === 'ref' ? `<div class="row"><span class="red">Ultimatum rejeté</span><b class="red">frappe possible dès le ${dateStr(S.ult[o + '>' + pl].dl)}</b></div>` : ''}<div class="row"><span>Régime</span><b style="color:${IDEO[O.ideo].col}">${IDEO[O.ideo].n}</b></div><div class="row"><span>Faction</span><b ${f ? `style="color:${f.col}"` : ''}>${f ? esc(f.n) : '—'}</b></div>${O.lord != null && !vas ? `<div class="row"><span>Suzerain</span><b>${nm(O.lord)}</b></div>` : ''}<div class="row"><span>Villes · stabilité</span><b>${O.cities.length} · ${O.stab | 0}</b></div><div class="row"><span>Défenses ici</span><b>fort. ${cs.fort} · DCA ${cs.dca}</b></div>
      ${wr ? `<div class="row" title="Villes prises, provinces occupées et rapport de forces. Positif : vous dominez."><span>Score de guerre</span><b class="${warScore(pl, o) > 0 ? 'grn' : 'red'}">${sg(warScore(pl, o))}</b></div>` : ''}
      ${intel ? `<div class="row"><span>Renseignement</span><b class="grn">missiles ${Object.values(O.ms).reduce((s, v) => s + v, 0)} · cyber ${Object.values(O.cy).reduce((s, v) => s + v, 0)} · ⛽ ${fmt(O.fuel)} · 🎯 ${fmt(O.ammo)} · 💰 ${fmt(O.money)}</b></div>` : ''}
      <div class="row"><span>Alliés</span><b>${allies(o).slice(0, 8).map(c => nm(c)).join(', ') || '—'}${allies(o).length > 8 ? '…' : ''}</b></div><div class="btns">`;
      if (wr) { h += `<button data-a="openPeace" class="g">Négocier la paix</button>${cfOn ? '' : `<button data-a="cfire" title="Suspend les combats 60 jours sans mettre fin à la guerre">Cessez-le-feu (60 j)</button>`}`; if (!cfOn) for (const m of MIS) if (m.k !== 'sam' && n.ms[m.k] > 0) h += `<button data-a="fireAt" data-v="${m.k}" class="w" title="${m.d}">🚀 ${m.n.replace('Missile ', '')} (${n.ms[m.k]})</button>`; }
      else {
        const tr = (n.truce[o] || 0) > S.day;
        if (!al) { if (j == null) { if (!tr) for (const k of justOpts(pl, o)) h += `<button data-a="justify" data-v="${k}" title="${JUST[k].t}">Justifier : ${JUST[k].n} (${jd(JUST[k].d)} j, +${JUST[k].inf} ☠)</button>`; } else h += S.day >= j ? `<button data-a="war" data-v="1" class="w">Déclarer la guerre (${JUST[n.jk[o] || 'conq'].n.toLowerCase()})</button>` : `<button disabled>${JUST[n.jk[o] || 'conq'].n}… ${jd(j - S.day)} j</button>`; }
        if (!al && !(S.day >= j)) h += `<button data-a="war" data-v="0" class="w" ${tr ? 'disabled' : ''}>Guerre surprise (+8 ☠)</button>`;
        if (vas) h += `<button data-a="annexV" title="Après un an de vassalité et 20 de relations ; infamie +3">Intégrer le vassal</button><button data-a="freeV">Émanciper</button>`;
        else if (!lord) h += n.ally[o] ? `<button data-a="unally">Rompre l’alliance</button>` : al ? '' : `<button data-a="ally" class="g">Proposer une alliance</button>`;
        if (!n.pact[o] && !al) h += `<button data-a="pact">Pacte de non-agression</button>`;
        if (f && !n.fac) h += `<button data-a="facJoin" class="g" title="${canJoinFaction(pl, f) || 'Demander l’adhésion à ' + f.n}">Rejoindre ${esc(f.n)}</button>`;
        if (myF && myF.lead === pl && !O.fac && O.lord == null) h += `<button data-a="facInvite" class="g">Inviter dans ${esc(myF.n)}</button>`;
        if (!al && O.ideo !== n.ideo) h += `<button data-a="coup" ${n.money < 60 || !(n.cy.crecon > 0) || (n.coupCd[o] || 0) > S.day ? 'disabled' : ''} title="Installe votre régime chez la cible. 60 💰, une unité de renseignement cyber. Échec : infamie +4, relations −40.">🎭 Coup d’État (${Math.round(coupChance(pl, o) * 100)} %)</button>`;
        h += `<button data-a="improve" ${n.money < 10 ? 'disabled' : ''}>Améliorer les relations (10 💰)</button>`;
      }
      h += `</div><h3>Cyberattaques</h3><div class="btns">${CYB.filter(c => c.k !== 'cdef').map(c => `<button data-a="cyber" data-v="${c.k}" title="${c.d}" ${n.cy[c.k] > 0 && (n.cyCd[c.k] || 0) <= S.day ? '' : 'disabled'}>💻 ${c.n.replace('Unité de ', '').replace('Cellule de ', '')} (${n.cy[c.k]})</button>`).join('')}</div><div class="tip">Chance de succès selon vos unités et la cyberdéfense adverse (${Math.round(cyberDefense(o) * 100)} %). En temps de paix : relations −25.</div>`;
    }
    const here = S.armies.filter(a => a.at === ci); if (here.length) h += `<h3>Forces présentes <span class="dim">ville et provinces rattachées</span></h3>` + here.map(armyRow).join('');
    h += `<h3>Villes voisines</h3>` + cd.ed.map(e => `<div class="slot" data-a="goto" data-v="${e[0]}"><span>${e[1] ? '⚓' : '·'} ${esc(C[e[0]].name)} <span class="dim">(${nm(C[e[0]].t)})</span></span><span class="dim">${e[2]} km</span></div>`).join('');
  }
  if (!sel && !selArmy) h += `<h3>${nm(pl)}</h3><div class="row"><span>Villes</span><b>${n.cities.length}</b></div><div class="row"><span>Provinces</span><b>${S.tow.reduce((s, o) => s + (o === pl ? 1 : 0), 0)}</b></div><div class="row"><span>Faction</span><b>${facOf(pl) ? esc(facOf(pl).n) : '—'}</b></div><div class="row"><span>Vassaux</span><b>${S.nat.filter(x => x.alive && x.lord === pl).map(x => nm(x.id)).join(', ') || '—'}</b></div><div class="row"><span>Population</span><b>${fmt(n.pop * 1e6)}</b></div><div class="row"><span>Force militaire</span><b>${fmt(n.str)}</b></div>
  <div class="row"><span>Missiles</span><b>${MIS.filter(m => n.ms[m.k]).map(m => n.ms[m.k] + ' ' + m.k.toUpperCase()).join(' · ') || '—'}</b></div><div class="row"><span>Unités cyber</span><b>${CYB.filter(c => n.cy[c.k]).map(c => n.cy[c.k] + ' ' + c.n.split(' ').slice(-1)[0]).join(' · ') || '—'}</b></div>
  <div class="tip" style="margin-top:8px">Cliquez une ville (nœud) ou une province du globe. Clic sur une icône d’unité pour la sélectionner, puis clic droit sur une ville ou une province pour la déplacer. Survolez pour les infobulles.</div>
  <h3>Mes villes</h3>${n.cities.map(ci => `<div class="slot" data-a="goto" data-v="${ci}"><span>${C[ci].cap ? '★ ' : ''}${esc(C[ci].name)}</span><span class="dim">${C[ci].tm.n}${wxOf(ci) ? ' ' + wxOf(ci).ic : ''}</span></div>`).join('')}
  <h3>Guerres en cours</h3>${Object.keys(n.war).map(m => `<div class="slot" data-a="goto" data-v="${S.nat[m].cap}"><span>${chip(m)}${nm(m)}</span><span>${fmt(S.nat[m].str)}</span></div>`).join('') || '<div class="dim">Aucune</div>'}
  <h3>Alliés</h3>${allies(pl).map(m => `<div class="slot" data-a="goto" data-v="${S.nat[m].cap}"><span>${chip(m)}${nm(m)}</span><span>${fmt(S.nat[m].str)}</span></div>`).join('') || '<div class="dim">Aucun</div>'}`;
  el.innerHTML = h;
}

// ---------- encyclopédie et fenêtres ------------------------------------
function oobHtml() {
  const n = S ? P() : null; let h = `<h2>Ordre de bataille — caractéristiques intégrales</h2><div class="tip">Attaque et PV par unité ; DCA = capacité antiaérienne ; vitesse en km/jour ; portée en km ; coûts en Md$ et matériaux ; effectif en milliers d’hommes ; entretien en Md$/jour.</div>`;
  for (const cat of catOrder) {
    h += `<h3>${{ Terre: '7 unités terrestres', Marine: '5 unités navales', Air: '5 unités aériennes', Drones: '5 types de drones' }[cat]}</h3><table class="oob"><tr><th>Unité</th><th>Att.</th><th>PV</th><th>DCA</th><th>Vit.</th><th>Portée</th><th>Coût</th><th>Mat.</th><th>Effectif</th><th>Entr.</th><th>Requiert</th><th>Spécial</th>${n ? '<th>Vous</th>' : ''}</tr>`;
    UN.forEach((u, j) => { if (u.cat !== cat) return; let own = 0; if (n) for (const a of S.armies) if (a.o === n.id) own += a.u[j]; h += `<tr><td><b>${u.n}</b></td><td>${u.att}</td><td>${u.pv}</td><td>${u.aa}</td><td>${u.vit}</td><td>${u.por}</td><td>${u.c}</td><td>${u.m}</td><td>${u.men}</td><td>${u.up}</td><td>${u.req ? BLD[u.req].n : '—'}</td><td class="dim">${u.d}</td>${n ? `<td>${Math.round(own)}</td>` : ''}</tr>`; });
    h += '</table>';
  }
  h += `<h3>10 missiles</h3><table class="oob"><tr><th>Missile</th><th>Portée</th><th>Puissance</th><th>Interceptable</th><th>Coût</th><th>Mat.</th><th>Base de tir</th><th>Effet</th>${n ? '<th>Stock</th>' : ''}</tr>${MIS.map(m => `<tr><td><b>${m.n}</b></td><td>${m.por} km</td><td>${m.pw || '—'}</td><td>${m.it ? Math.round(m.it * 100) + ' %' : m.k === 'sam' ? '—' : 'non'}</td><td>${m.c}</td><td>${m.m}</td><td>${m.req ? m.req.split('|').map(r => BLD[r].n).join(' ou ') : 'toute ville'}</td><td class="dim">${m.d}</td>${n ? `<td>${n.ms[m.k]}</td>` : ''}</tr>`).join('')}</table>`;
  h += `<h3>4 unités cyber</h3><table class="oob"><tr><th>Unité</th><th>Coût</th><th>Mat.</th><th>Durée</th><th>Effet</th>${n ? '<th>Vous</th>' : ''}</tr>${CYB.map(c => `<tr><td><b>${c.n}</b></td><td>${c.c}</td><td>${c.m}</td><td>${c.dur ? c.dur + ' j' : 'passif'}</td><td class="dim">${c.d}</td>${n ? `<td>${n.cy[c.k]}</td>` : ''}</tr>`).join('')}</table><div class="tip">Unités cyber formées dans une ville dotée d’un centre de cyberguerre ; recharge de 12 jours par action.</div>`;
  h += `<h3>10 infrastructures (5 niveaux)</h3><table class="oob"><tr><th>Infrastructure</th><th>Coût niv. 1</th><th>Effet</th></tr>${BK.map(k => `<tr><td><b>${BLD[k].n}</b></td><td>${BLD[k].c} 💰 + ${BLD[k].c / 5} ⛏</td><td class="dim">${BLD[k].d}${BLD[k].coast ? ' (ville côtière)' : ''}</td></tr>`).join('')}</table><div class="tip">Le coût du niveau n vaut n × le coût du niveau 1, réduit par la technologie Industrie.</div>`;
  return h + closeBtn;
}
function guideHtml() {
  return `<h2>Provinces, villes et règles</h2>
  <p><b>Provinces.</b> Le globe est découpé en ${TL.length} provinces reprises de la carte de Rise of Nations que vous avez fournie, recalées sur les vraies frontières. Chaque province a un biome (d’après l’imagerie satellite), un relief (d’après l’altitude réelle) et parfois une ressource. Elle est rattachée à la ville la plus proche de son pays : prendre la ville, c’est prendre toutes ses provinces.</p>
  <p><b>Villes.</b> De 5 à 20 par nation selon sa population et sa superficie (moins pour les micro-États). Elles portent l’économie, les infrastructures et le recrutement. Une nation capitule quand sa capitale tombe et qu’il lui reste moins de 40 % de ses villes.</p>
  <p><b>Mouvement.</b> Les armées vont de ville en ville à travers les provinces voisines ; la vitesse dépend du type d’unité le plus lent, du relief, du biome, de la saison et de la météo. Les traversées maritimes exposent aux flottes ennemies. L’aviation seule vole par-dessus mers et terrains ; la marine n’emprunte que les liaisons maritimes.</p>
  <p><b>Combat.</b> Chaque ville est un champ de bataille : terre, air et mer se combinent ; la DCA (unités, défense sol-air, intercepteurs) réduit l’aviation ennemie ; fortifications, relief et biome protègent le défenseur ; artillerie et bombardiers ouvrent les fortifications.</p>
  <p><b>Portées.</b> Frappes aériennes et missiles touchent des villes éloignées, dans la limite de leur rayon d’action, affiché sur le globe pendant le ciblage.</p>` + closeBtn;
}
const selOwner = () => S.city[sel].o;
const selAll = () => { const l = selArmy ? [selArmy] : []; for (const a of selSet) if (!l.includes(a) && S.armies.includes(a)) l.push(a); return l; };
function orderAll(node) { let ok = 0, n = 0; for (const a of selAll()) { if (a.o !== S.player) continue; n++; const to = a.sea || armyMode(a)[0] === 'sea' ? (node < NC ? node : nCity(node)) : node; if (orderMove(a, to)) ok++; } if (n && !ok) toast(selAll().some(a => a.sea) ? (node < NC && !C[node].co ? 'Une flotte ne peut aller que dans une ville côtière' : !passable(S.player, node < NC ? node : nCity(node)) ? 'Port étranger : une flotte ne peut y faire escale qu’en guerre ou chez un allié' : 'Aucune route maritime jusque-là') : 'Destination inaccessible : il faut être en guerre ou allié'); return ok; }
function tileSide(ti) {
  const tl = TL[ti], o = S.tow[ti], co = S.city[tl.c].o, pl = S.player, n = P();
  let h = `<h3>Province n° ${ti + 1}</h3><div class="dim">${chip(o)}${nm(o)}${o !== co ? ' — occupée, ville de rattachement à ' + nm(co) : ''}</div><div class="row"><span>Rattachée à</span><b>${esc(C[tl.c].name)}</b></div><div class="row"><span>Terrain</span><b>${BIOME[tl.bio].n} · ${RELIEF[tl.rel].n}</b></div><div class="tip">${modStr(tl.tm) || 'Aucun modificateur'}${tl.riv ? ' · fleuve : franchissement +0,5 j, assaillant −15 %' : ''}</div>
  <div class="row"><span>Superficie · altitude</span><b>${fmt(tl.area)} km² · ${fmt(tl.elev)} m</b></div><div class="row"><span>Ressource</span><b>${tl.res ? TRES[tl.res][0] : '—'}</b></div><div class="row"><span>Culture · religion</span><b>${CULTG[cultOf(tl.t)][0]} · ${REL[relOf(tl.t)][0]}</b></div>
  ${SUP[pl] && (o === pl || isAlly(pl, o)) ? `<div class="row"><span>Ravitaillement</span><b class="${SUP[pl][NC + ti] ? 'grn' : 'red'}">${SUP[pl][NC + ti] ? 'relié' : 'coupé'}</b></div>` : ''}`;
  if (selArmy && selArmy.o === pl && !selArmy.sea && aNode(selArmy) !== NC + ti) h += `<div class="btns"><button data-a="moveTile" class="on">Envoyer l’unité dans cette province</button></div>`;
  if (o === pl) { h += `<h3>Aménagements</h3>`; for (const k in TB) { const why = canBuildTile(ti, k), c = tbCost(n, ti, k); h += `<div class="row" title="${TB[k].d}"><span>${TB[k].n} <b style="color:var(--tx)">${tbLv(ti, k)}</b>/${k === 'tdep' ? 1 : 3}</span>${why ? `<span class="dim small">${why}</span>` : `<button data-a="buildTile" data-v="${k}" ${n.money < c || n.mat < c / 5 ? 'disabled' : ''}>+ ${fmt(c)} 💰</button>`}</div>`; } }
  else if (tbStr(ti)) h += `<div class="tip">${tbStr(ti)}</div>`;
  const here = S.armies.filter(a => a.tl === ti); if (here.length) h += `<h3>Forces dans la province</h3>` + here.map(armyRow).join('');
  return h;
}
let PT = null;
function peaceHtml() {
  const o = PT.o, pl = S.player, O = S.nat[o], sc = warScore(pl, o), cost = peaceCost(pl, o, PT), long = S.day - P().war[o], occ = occTiles(pl, o);
  const mineC = new Set(P().cities), cand = O.cities.filter(ci => ci !== O.cap && (C[ci].ed.some(e => !e[1] && mineC.has(e[0])) || C[ci].tiles.some(ti => S.tow[ti] === pl))).slice(0, 10);
  const tg = (k, t, c, tip) => `<button data-a="ptTg" data-v="${k}" class="${PT[k] ? 'on' : ''}" title="${tip || ''}" ${PT.white && k !== 'white' ? 'disabled' : ''}>${t} <span class="dim">${c}</span></button>`;
  return `<h2>Négocier la paix avec ${chip(o)}${nm(o)}</h2><div class="row"><span>Score de guerre</span><b class="${sc > 0 ? 'grn' : 'red'}">${sg(sc)}</b></div><div class="row"><span>Coût de vos exigences</span><b class="${sc >= cost ? 'grn' : 'red'}">${cost}</b></div>
  <div class="tip">${nm(o)} accepte si le score de guerre atteint le coût des exigences${long < 30 ? ' — et après 30 jours de guerre au moins (' + long + ' j écoulés)' : ''}. Sans exigence, chacun garde les villes prises et les provinces occupées sont rendues.</div>
  <h3>Clauses</h3><div class="btns">${tg('white', 'Paix blanche', '−10', 'Retour aux frontières d’avant-guerre : toutes les villes prises sont rendues')}${tg('keep', 'Garder les ' + occ + ' provinces occupées', '+' + Math.round(Math.min(15, .5 * occ)))}${tg('repar', 'Réparations', '+10', '20 % de son trésor, puis 10 % de ses recettes pendant un an')}${tg('regime', 'Imposer votre régime', '+12')}${tg('vassal', 'Vassalisation', '+45', 'La nation devient votre vassal : tribut de 15 %, armées alliées')}</div>
  <h3>Villes exigées <span class="dim">+12 chacune</span></h3><div class="btns">${cand.map(ci => `<button data-a="ptCity" data-v="${ci}" class="${PT.cities.includes(ci) ? 'on' : ''}" ${PT.white ? 'disabled' : ''}>${esc(C[ci].name)}</button>`).join('') || '<span class="dim">Aucune ville frontalière ou partiellement occupée.</span>'}</div>
  <div class="btns" style="margin-top:12px"><button data-a="ptSend" class="g">Proposer le traité</button><button data-a="closeModal">Fermer</button></div>`;
}
function facHtml() {
  const pl = S.player, my = facOf(pl);
  return `<h2>Factions</h2>${S.fac.length ? `<table><tr><th>Faction</th><th>Chef</th><th>Membres</th><th>Force</th><th></th></tr>${S.fac.map(f => { const m = facMembers(f), why = canJoinFaction(pl, f); return `<tr><td><i class="chip" style="background:${f.col}"></i><b>${esc(f.n)}</b></td><td>${nm(f.lead)}</td><td class="dim">${m.slice(0, 14).map(x => nm(x)).join(', ')}${m.length > 14 ? '… (' + m.length + ')' : ''}</td><td>${fmt(m.reduce((s, x) => s + S.nat[x].str, 0))}</td><td>${my === f ? '<button data-a="facLeave" class="w">Quitter</button>' : my ? '' : `<button data-a="facJoinId" data-v="${f.id}" title="${why}" ${why ? 'disabled' : ''}>Rejoindre</button>`}</td></tr>`; }).join('')}</table>` : '<p class="dim">Aucune faction n’existe encore.</p>'}
  ${my ? `<div class="tip">Vous appartenez à <b>${esc(my.n)}</b>${my.lead === pl ? ' (vous la dirigez : invitez une nation depuis sa fiche)' : ''}. Les membres sont alliés entre eux et entrent en guerre ensemble ; impossible d’attaquer un membre sans quitter la faction.</div>` : `<h3>Fonder une faction <span class="dim">50 💰</span></h3><div class="btns"><input id="facName" maxlength="40" placeholder="Nom de la faction" style="flex:1;min-width:200px"><button data-a="facFound" class="g" ${P().money < 50 ? 'disabled' : ''}>Fonder</button></div>`}` + closeBtn;
}
function startTarget(kind, k, army) {
  const n = P(); let sites, range;
  if (kind === 'missile') { sites = launchSites(n.id, k); range = MI[k].por; if (!sites.length) return toast('Aucune ville ne peut tirer ce missile : ' + MI[k].req.split('|').map(r => BLD[r].n).join(' ou ') + ' requis'); }
  else if (kind === 'proj') { sites = [army.at]; range = projRange(army); }
  else if (kind === 'drop') { const cs0 = S.city[army.at]; if (cs0.o !== n.id || cs0.airb < 1) return toast('Les parachutistes doivent partir d’une de vos bases aériennes'); sites = [army.at]; range = UN[UI.para].drop; }
  else { sites = [army.at]; range = Math.max(0, ...UN.map((u, j) => army.u[j] >= .5 && u.cl === 1 && u.att > 0 ? u.por : 0)); }
  targ = { kind, k, army, sites, range }; toast('Choisissez la ville visée sur le globe (Échap pour annuler)'); renderSide();
}
function fireTarget(ci) { const t = targ; targ = null; const err = t.kind === 'missile' ? launchMissile(S.player, t.k, ci) : t.kind === 'drop' ? airdrop(t.army, ci) : t.kind === 'proj' ? project(t.army, ci) : airStrike(t.army, ci); if (err) toast(err); needRecalc = true; renderTop(); renderSide(); }
const A = {
  speed(v) { S.speed = +v; S.phase === 'earth' ? renderTop() : spTop(); },
  askBtn(v) { const b = askCur.btns[+v]; closeModal(); b.f(); if (S && S.phase === 'earth') { renderTop(); refreshSide(true); } },
  closeModal() { closeModal(); },
  mm(v) { mapMode = +v; layerDirty = true; renderMM(); },
  tgClouds() { showClouds = !showClouds; renderMM(); }, tgNight() { dayNight = !dayNight; renderMM(); }, tgMesh() { showMesh = !showMesh; renderMM(); },
  goto(v) { const t = C[+v]; flyTo(t.lon, t.lat, Math.min(cam.h, .12)); sel = +v; selArmy = null; selSet = []; selTile = -1; layerDirty = true; if (modalOpen && !askCur) closeModal(); refreshSide(true); },
  build(v) { if (!build(P(), sel, v)) toast(canBuild(sel, v) || 'Ressources insuffisantes'); },
  auto() { toggleAuto(); },
  tgSec(v) { secOpen[v] = !secOpen[v]; },
  civ(v) { if (!recruitCiv(P(), sel, v)) toast(canCiv(sel, v) || 'Ressources ou main-d’œuvre insuffisantes'); }, civOut(v) { dismissCiv(P(), sel, v); },
  upRank() { if (!upRank(P(), sel)) toast('Ressources insuffisantes'); }, buySat() { if (!buySat(P(), sel)) toast(canSat(P(), sel) || 'Il faut ' + fmt(80 * disc(P())) + ' 💰 et 3 🔩'); },
  drop() { startTarget('drop', null, selArmy); }, proj() { startTarget('proj', null, selArmy); }, reload() { const e = reload(selArmy); toast(e || 'Contingent rechargé'); },
  recruit(v, e) { if (!recruit(P(), sel, +v, +e.dataset.n)) toast(UN[+v].e > P().comp ? 'Composants électroniques insuffisants (🔩) : usine de semi-conducteurs ou marché' : 'Ressources, main-d’œuvre ou infrastructure insuffisantes'); },
  buyMis(v, e) { if (!buyMissile(P(), sel, v, +e.dataset.n)) toast(MI[v].e > P().comp ? 'Composants électroniques insuffisants (🔩)' : v === 'nuke' && P().ura < 5 ? 'Il faut 5 ☢ d’uranium par ogive' : 'Ressources insuffisantes ou base requise'); },
  buyCy(v) { if (!buyCyber(P(), sel, v, 1)) toast('Ressources insuffisantes'); },
  aimMis(v) { startTarget('missile', v); },
  fireAt(v) { const e = launchMissile(S.player, v, sel); if (e) toast(e); },
  strike() { startTarget('strike', null, selArmy); },
  cancelTarg() { targ = null; },
  cyber(v) { const e = cyberAttack(S.player, v, selOwner()); if (e) toast(e); },
  rally() { let k = 0; for (const a of S.armies) if (a.o === S.player && !a.sea && orderMove(a, sel)) k++; toast(k + ' armée(s) en route'); },
  selArmy(v) { selArmy = S.armies.find(a => a.id === +v) || null; selSet = []; },
  clearSel() { selSet = []; },
  moveHere() { orderAll(sel); }, moveTile() { orderAll(NC + selTile); },
  retreat() { let k = 0; for (const a of selAll()) if (a.o === S.player && !a.sea && retreat(a)) k++; toast(k ? k + ' formation(s) en repli' : 'Aucune ville amie accessible'); },
  ord(v) { for (const a of selAll()) if (a.o === S.player) a.ord = +v; },
  hireGen() { const e = hireGeneral(P(), selArmy); if (e) toast(e); },
  mines() { const e = layMines(selArmy); toast(e || 'Champ de mines mis à jour devant ' + C[selArmy.at].name); },
  buildTile(v) { if (!buildTile(P(), selTile, v)) toast(canBuildTile(selTile, v) || 'Ressources insuffisantes'); },
  cancelQ(v) { cancelQueue(+v); },
  lib(v) { const e = liberate(S.player, C[sel].t, v === '1'); if (e) toast(e); },
  annexV() { const e = annexVassal(S.player, selOwner()); if (e) toast(e); }, freeV() { freeVassal(S.player, selOwner()); },
  coup() { const e = coup(S.player, selOwner()); if (e) toast(e); },
  cfire() { const o = selOwner(), sc = warScore(S.player, o); if (S.cheat.love || sc >= -15 || S.day - P().war[o] > 60) ceasefire(S.player, o, 60); else toast(nm(o) + ' refuse le cessez-le-feu : il se sent en position de force'); },
  openPeace() { PT = { o: selOwner(), cities: [] }; modal(peaceHtml()); },
  ptTg(v) { PT[v] = !PT[v]; if (v === 'white' && PT.white) { PT.keep = PT.repar = PT.regime = PT.vassal = false; PT.cities = []; } modal(peaceHtml()); },
  ptCity(v) { const i = PT.cities.indexOf(+v); if (i >= 0) PT.cities.splice(i, 1); else PT.cities.push(+v); modal(peaceHtml()); },
  ptSend() { const o = PT.o, pl = S.player; if (!inWar(pl, o)) return closeModal(); const sc = warScore(pl, o), cost = peaceCost(pl, o, PT), long = S.day - P().war[o]; if (S.cheat.love || (sc >= cost && (long >= 30 || sc > 40))) { closeModal(); peaceApply(pl, o, PT); toast('Traité signé'); } else toast(nm(o) + ' refuse : ' + (sc < cost ? 'exigences trop lourdes (score ' + sc + ', coût ' + cost + ')' : 'la guerre est trop récente')); },
  openFac() { modal(facHtml()); },
  facFound() { const n = P(), nm_ = ($('facName').value || '').trim(); if (n.money < 50) return toast('Il faut 50 💰'); n.money -= 50; const f = foundFaction(S.player, nm_ || null); if (f) addLog(`Vous fondez la faction <b style="color:${f.col}">${esc(f.n)}</b>.`, 2); modal(facHtml()); },
  facJoinId(v) { const f = S.fac.find(x => x.id === +v); if (!f) return; const e = S.cheat.love ? '' : canJoinFaction(S.player, f); if (e) toast(e); else joinFaction(S.player, f); modal(facHtml()); },
  facJoin() { const f = facOf(selOwner()); if (!f) return; const e = S.cheat.love ? '' : canJoinFaction(S.player, f); if (e) toast(e); else joinFaction(S.player, f); },
  facLeave() { leaveFaction(S.player); for (const m of S.nat) if (m.alive && m.id !== S.player) addRel(S.player, m.id, 0); modal(facHtml()); },
  facInvite() { const o = selOwner(), f = facOf(S.player), O = S.nat[o]; if (!f) return; if (S.cheat.love || (getRel(S.player, o) >= 30 && !facMembers(f).some(m => inWar(o, m)) && O.infamy < 40)) joinFaction(o, f); else toast(nm(o) + ' décline (relations ≥ 30 requises, aucune guerre contre un membre)'); },
  form(v) { const e = formNation(P(), FORM[+v]); if (e) toast(e); recompute(); A.openNation(); },
  replay() { startReplay(); }, stopReplay() { stopReplay(); },
  ntfX(v, el) { el.parentNode.remove(); }, tgZoom() { autoZoom = !autoZoom; renderMM(); }, tgGfx() { gfxOn = !gfxOn; renderMM(); },
  split() { const a = selArmy; if (adiv(a) < 2) return; const b = mkArmy(a.o, a.at, a.sea); b.tl = a.tl; b.mor = a.mor; b.ord = a.ord; b.xp = a.xp || 0; b.dig = a.dig || 0; b.u = a.u.map(v => Math.floor(v / 2)); a.u = a.u.map((v, j) => v - b.u[j]); if (a.cg) { const ca = cargoCap(a), cb = cargoCap(b); b.cg = {}; for (const k in a.cg) { const tot = (ca[k] || 0) + (cb[k] || 0), f = tot ? (cb[k] || 0) / tot : 0; b.cg[k] = a.cg[k] * f; a.cg[k] -= b.cg[k]; } } supSet(a); supSet(b); S.armies.push(b); },
  merge() { const a = selArmy; for (const b of S.armies) if (b !== a && b.o === a.o && aNode(b) === aNode(a) && b.sea === a.sea && !b.path.length && (b.u[UI.vsx] >= .5) === (a.u[UI.vsx] >= .5)) { if (b.cg) { a.cg = a.cg || {}; for (const k in b.cg) a.cg[k] = (a.cg[k] || 0) + b.cg[k]; b.cg = null; } if (!a.gen && b.gen) a.gen = b.gen; const wa = adiv(a), wb = adiv(b); a.xp = wa + wb ? ((a.xp || 0) * wa + (b.xp || 0) * wb) / (wa + wb) : 0; a.dig = Math.min(a.dig || 0, b.dig || 0); for (let j = 0; j < NU; j++) { a.u[j] += b.u[j]; b.u[j] = 0; } supSet(b); } supSet(a); S.armies = S.armies.filter(x => adiv(x) > 0 || x === a); },
  stop() { for (const a of selAll()) if (a.o === S.player) { a.path = []; a.prog = 0; } },
  disband() { const a = selArmy; if (a.o !== S.player) return; P().mp += a.u[0] * 5; S.armies = S.armies.filter(x => x !== a); selArmy = null; selSet = []; needRecalc = true; },
  justify(v) { const e = startJust(S.player, selOwner(), v || 'conq'); toast(e || 'Justification en cours : ' + JUST[v || 'conq'].n.toLowerCase()); },
  war(v) { const o = selOwner(); if (isAlly(S.player, o) && !P().ally[o]) return toast('Impossible : même faction ou lien de vassalité'); declareWar(S.player, o, v === '1'); },
  peace() { A.openPeace(); },
  ally() { const o = selOwner(), O = S.nat[o], n = P(); if (S.cheat.love || (getRel(S.player, o) >= 35 && n.infamy < 40 && !allies(o).some(c => inWar(S.player, c)) && O.lord == null)) { n.ally[o] = 1; O.ally[S.player] = 1; delete n.just[o]; addLog(`Alliance conclue avec ${chip(o)}<b>${nm(o)}</b>`, 2); layerDirty = true; } else toast(nm(o) + ' décline (relations ≥ 35 requises, infamie < 40)'); },
  unally() { const o = selOwner(); delete P().ally[o]; delete S.nat[o].ally[S.player]; addRel(S.player, o, -30); layerDirty = true; },
  pact() { const o = selOwner(); if (S.cheat.love || getRel(S.player, o) >= 5) { P().pact[o] = 1; S.nat[o].pact[S.player] = 1; toast('Pacte signé'); } else toast(nm(o) + ' refuse (relations ≥ 5 requises)'); },
  improve() { const o = selOwner(), k = 'i' + o; if ((S.cd[k] || 0) > S.day) return toast('Nos diplomates y travaillent déjà (30 j)'); P().money -= 10; addRel(S.player, o, 12 + 4 * Math.min(5, P().dipl || 0)); S.cd[k] = S.day + 30; },
  research(v) { const n = P(); n.research = { k: v, p: Math.min(n.sci, techCost(v, n.tech[v])) }; n.sci -= n.research.p; A.openTech(); },
  openTech() { const n = P(); modal(`<h2>Recherche <span class="dim small">— ${sg(n.sciInc)} science/j, ${fmt(n.sci)} en réserve</span></h2><table>${Object.keys(TECH).map(k => { const t = TECH[k], lv = n.tech[k], cur = n.research && n.research.k === k; return `<tr><td><b>${t.n}</b><br><span class="dim">${t.d}</span></td><td>${lv}/${t.max}</td><td>${lv >= t.max ? '<span class="dim">max</span>' : cur ? `<span class="or">en cours ${(n.research.p / techCost(k, lv) * 100 | 0)} %</span>` : `<button data-a="research" data-v="${k}">Rechercher (${fmt(techCost(k, lv))})</button>`}</td></tr>`; }).join('')}</table>` + closeBtn); },
  openDip() { const pl = S.player, l = S.nat.filter(n => n.alive && n.id !== pl && active(n.id)).sort((a, b) => b.str - a.str); modal(`<h2>Diplomatie</h2><div class="btns"><button data-a="openFac">Factions (${S.fac.length})</button><button data-a="mm" data-v="11">Carte des tensions</button></div><table><tr><th>Nation</th><th>Force</th><th>Villes</th><th>Relations</th><th>Statut</th><th>Ses alliés</th></tr>${l.map(n => `<tr class="clk" data-a="goto" data-v="${n.cap}"><td>${chip(n.id)}${nm(n.id)}</td><td>${fmt(n.str)}</td><td>${n.cities.length}</td><td>${getRel(pl, n.id) | 0}</td><td>${inWar(pl, n.id) ? (atWar(pl, n.id) ? '<span class="red">Guerre</span>' : 'Cessez-le-feu') : n.lord === pl ? '<span class="grn">Vassal</span>' : isAlly(pl, n.id) ? '<span class="grn">Allié</span>' : P().pact[n.id] ? 'Pacte' : (P().truce[n.id] || 0) > S.day ? 'Trêve' : ''}${facOf(n.id) ? ` <span style="color:${facOf(n.id).col}">◆</span>` : ''}</td><td class="dim">${allies(n.id).slice(0, 6).map(c => nm(c)).join(', ')}</td></tr>`).join('')}</table>` + closeBtn); },
  openRank() { const l = S.nat.filter(n => n.alive && active(n.id)).sort((a, b) => score(b) - score(a)).slice(0, 40), hh = S.hist || []; modal(`<h2>Classement et score</h2><div class="btns"><button data-a="replay" class="on" title="Rejoue en accéléré l’évolution des frontières depuis le début de la partie">⏪ Relecture des frontières</button></div>${hh.length > 1 ? `<div class="tip">Votre parcours : ${hh.filter((_, i) => i % Math.ceil(hh.length / 8) === 0 || i === hh.length - 1).map(x => dateStr(x[0]).replace(/ \d{4}$/, m => m.slice(-3)) + ' — ' + x[2] + ' villes, score ' + fmt(x[4])).join(' · ')}</div>` : ''}<table><tr><th>#</th><th>Nation</th><th>Score</th><th>Régime</th><th>Population</th><th>Part</th><th>Revenu/j</th><th>Force</th><th title="Indice de puissance nationale (0–100), alliances comprises entre parenthèses">Puissance</th><th title="Niveau technologique">Tech.</th><th title="Expérience militaire">Exp.</th><th>Villes</th><th>Superficie</th><th>Gagnée</th><th>Guerres</th></tr>${l.map((n, i) => `<tr class="clk" style="${n.id === S.player ? 'background:#1c2a38' : ''}" data-a="goto" data-v="${n.cap}"><td>${i + 1}</td><td>${chip(n.id)}${nm(n.id)}${hasBomb(n.id) ? ' <span title="Puissance nucléaire : ' + n.ms.nuke + ' ogive(s)">☢</span>' : ''}</td><td><b>${fmt(score(n))}</b></td><td style="color:${IDEO[n.ideo].col}">${IDEO[n.ideo].n}</td><td>${fmt(n.pop * 1e6)}</td><td>${(n.pop / worldPop * 100).toFixed(1)} %</td><td>${fmt(n.inc)}</td><td>${fmt(n.str)}</td><td><b>${(n.pwr || 0).toFixed(1)}</b> <span class="dim">(${(n.pwrE || 0).toFixed(0)})</span></td><td>${(n.tl || 1).toFixed(2)}</td><td>${(n.xl || 1).toFixed(2)}</td><td>${n.cities.length}</td><td>${fmt(n.area)} km²</td><td class="${areaGain(n) >= 0 ? 'grn' : 'red'}">${areaGain(n) >= 0 ? '+' : '−'}${fmt(Math.abs(areaGain(n)))} km²</td><td class="dim">${Object.keys(n.war).map(c => nm(c)).join(', ')}</td></tr>`).join('')}</table>` + closeBtn); },
  openWx() { modal(`<h2>Météo mondiale <span class="dim small">— ${S.wx.length} phénomène(s) en cours</span></h2><table><tr><th>Phénomène</th><th>Région</th><th>Durée</th><th>Effets</th></tr>${S.wx.map(e => { const w = WX[e.k]; let b = null, bd = 1e9; for (const c of C) { const d = dist(e, c); if (d < bd) { bd = d; b = c; } } return `<tr class="clk" data-a="goto" data-v="${b.i}"><td>${w.ic} <b>${w.n}</b></td><td>${esc(b.name)} <span class="dim">(${nm(b.t)})</span></td><td>${jd(e.end - S.day)} j</td><td class="dim">${modStr(w)}</td></tr>`; }).join('')}</table><h3>Les 13 conditions</h3><table>${Object.values(WX).map(w => `<tr><td>${w.ic} <b>${w.n}</b></td><td class="dim">${modStr(w)}</td></tr>`).join('')}</table><h3>Biomes et relief</h3><table>${BKEYS.map(k => `<tr><td><i class="chip" style="background:${BIOME[k].col}"></i><b>${BIOME[k].n}</b></td><td class="dim">${modStr(BIOME[k]) || 'neutre'}</td></tr>`).join('')}${RELIEF.map(r => `<tr><td><i class="chip" style="background:${r.col}"></i><b>${r.n}</b></td><td class="dim">${modStr(r) || 'neutre'}</td></tr>`).join('')}</table><div class="tip">Biome et relief se cumulent.</div>` + closeBtn); },
  openOob() { modal(encHtml('unites')); }, openGuide() { modal(encHtml('aide')); }, openEnc(v) { modal(encHtml(v || 'aide')); },
  openNation() { modal(nationHtml()); }, openMarket() { modal(marketHtml()); }, openArmies() { modal(armiesHtml()); },
  setTax(v) { P().tax = +v; recompute(); A.openNation(); }, setMob(v) { P().mob = +v; recompute(); A.openNation(); }, setIdeo(v) { const e = setIdeo(P(), v); if (e) toast(e); recompute(); A.openNation(); },
  borrow() { if (!borrow(P())) toast('Plafond d’endettement atteint'); recompute(); A.openNation(); }, repay() { if (!repay(P())) toast('Rien à rembourser, ou trésor vide'); recompute(); A.openNation(); },
  mkBuy(v, e) { if (!marketBuy(P(), v, +e.dataset.n)) toast(P().sanc ? 'Sanctions internationales : marché fermé' : 'Trésor insuffisant'); A.openMarket(); }, mkSell(v, e) { if (!marketSell(P(), v, +e.dataset.n)) toast(P().sanc ? 'Sanctions internationales : marché fermé' : 'Stock insuffisant'); A.openMarket(); },
  pickArmy(v) { const a = S.armies.find(x => x.id === +v); if (a) { selArmy = a; selSet = []; sel = a.at; selTile = a.tl; closeModal(); const ll = nLL(aNode(a)); flyTo(ll.lon, ll.lat, Math.min(cam.h, .2)); layerDirty = true; refreshSide(true); } },
  pickDir() { pickSaveDir().then(() => { if (S) renderTop(); }); }, loadDir() { loadFromDir(); },
  loadDirFile(v) { const f = window._dirSaves && window._dirSaves[+v]; if (!f) return; f.h.getFile().then(x => x.text()).then(t => { closeModal(); loadState(JSON.parse(t)); toast('Partie chargée : ' + f.name); }).catch(() => toast('Fichier illisible')); },
  goSpace() { enterSpace(); },
  save() { save(); },
  export() { modal(`<h2>Exporter la partie</h2><textarea id="expo" style="width:100%;height:220px" readonly>${esc(JSON.stringify(S))}</textarea><div class="btns"><button data-a="copyExp" class="on">Copier</button><button data-a="closeModal">Fermer</button></div><div class="tip">Collez ce texte dans un fichier .json, puis rechargez-le depuis l’écran d’accueil (« Importer »).</div>`); },
  copyExp() { const t = $('expo'); t.select(); (navigator.clipboard ? navigator.clipboard.writeText(t.value) : Promise.reject()).then(() => toast('Copié'), () => { try { document.execCommand('copy'); toast('Copié'); } catch (e) { toast('Copie impossible : sélectionnez le texte'); } }); },
  cheat() { toggleCheat(); }
};
function loadState(o) { if (!o || o.v !== 8 || !o.city || o.city.length !== C.length) return toast('Sauvegarde incompatible avec cette version (les parties des versions précédentes ne se rechargent pas)'); S = o; sel = selArmy = null; targ = null; S.cheat = S.cheat || {}; S.wx = S.wx || []; S.disc = S.disc || {}; S.hist = S.hist || []; S.tb = S.tb || {}; S.q = S.q || []; S.chg = S.chg || []; S.wr = S.wr || {}; S.fac = S.fac || []; S.kept = S.kept || {}; for (const a of S.armies) while (a.u.length < NU) a.u.push(0); selSet = []; selTile = -1; REPLAY = null; for (const k in SUP) delete SUP[k]; applyDisc(); startUI(); if (S.phase === 'space') { SP = S.space; showSpace(); } }
function startUI() { $('start').classList.add('hid'); document.body.classList.remove('pre'); $('top').classList.remove('hid'); $('bot').classList.remove('hid'); $('side').classList.remove('hid'); recompute(); layerDirty = true; renderTop(); renderSide(); renderLog(); renderMM(); }
function onTick() { renderTop(); refreshSide(false); }
const secOpen = { beco: true, bnrj: true, uTerre: true };

document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return; const f = A[el.dataset.a]; if (!f) return;
  f(el.dataset.v, el);
  if (S && S.phase === 'earth' && !modalOpen) { renderTop(); refreshSide(true); layerDirty = true; }
  else if (S && S.phase === 'space' && typeof spSide === 'function' && !modalOpen) { spTop(); spSide(); }
});
$('side').addEventListener('mouseenter', () => sideHover = true); $('side').addEventListener('mouseleave', () => sideHover = false);

// ---------- souris, toucher, clavier ------------------------------------
let drag = null; const ptrs = new Map();
function cityFromPoint(mx, my) { const nd = nodeAt(mx, my); if (nd && nd.k === 'city') return nd.i; const t = tileUnder(mx, my); return t ? TL[t - 1].c : -1; }
function pan(dx, dy) { const k = cam.h / CB.f * .95; cam.lon -= dx * k / Math.max(.2, Math.cos(cam.lat)); cam.lat = clamp(cam.lat + dy * k, -1.48, 1.48); camAnim = null; }
function zoomAt(mx, my, k) { const ll = s2ll(mx, my); cam.h = clamp(cam.h * k, HMIN, HMAX); if (ll && k < 1) { let dl = ll[0] * D2R - cam.lon; dl = ((dl + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; cam.lon += dl * (1 - k) * .9; cam.lat = clamp(cam.lat + (ll[1] * D2R - cam.lat) * (1 - k) * .9, -1.48, 1.48); } camAnim = null; }
ov.addEventListener('pointerdown', e => { ov.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); if (ptrs.size === 1) drag = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, moved: false, b: e.button, box: e.shiftKey && e.button === 0 && !!S && S.phase === 'earth', sh: e.shiftKey }; else drag = null; });
ov.addEventListener('pointermove', e => {
  const r = ov.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
  if (ptrs.has(e.pointerId)) {
    const prev = ptrs.get(e.pointerId);
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], d0 = Math.hypot(a[0] - b[0], a[1] - b[1]); ptrs.set(e.pointerId, [e.clientX, e.clientY]); const [c, d] = [...ptrs.values()], d1 = Math.hypot(c[0] - d[0], c[1] - d[1]); if (d0 > 0 && d1 > 0) zoomAt((c[0] + d[0]) / 2 - r.left, (c[1] + d[1]) / 2 - r.top, d0 / d1); return; }
    ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (drag) { if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 4) drag.moved = true; if (drag.moved && drag.box) { const b = $('selbox'), x0 = Math.min(drag.x, e.clientX), y0 = Math.min(drag.y, e.clientY); b.classList.remove('hid'); b.style.left = x0 + 'px'; b.style.top = y0 + 'px'; b.style.width = Math.abs(e.clientX - drag.x) + 'px'; b.style.height = Math.abs(e.clientY - drag.y) + 'px'; } else if (drag.moved && drag.b === 0) pan(e.clientX - drag.lx, e.clientY - drag.ly); drag.lx = e.clientX; drag.ly = e.clientY; }
    showTip(null); return;
  }
  const nd = nodeAt(mx, my); let html = null; hoverTile = 0;
  if (nd) html = nd.k === 'city' ? tipCity(nd.i) : nd.k === 'army' ? tipArmy(nd.a) : nd.k === 'tb' ? tipTile(nd.i + 1) : tipWx(nd.i);
  else { const t = tileUnder(mx, my); if (t) { hoverTile = t; html = tipTile(t); } }
  showTip(html, e.clientX, e.clientY);
});
ov.addEventListener('pointerleave', () => { showTip(null); hoverTile = 0; });
function endPtr(e) {
  ptrs.delete(e.pointerId); if (!drag) return; const d = drag; drag = null; $('selbox').classList.add('hid');
  const r = ov.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
  if (d.moved && d.box) { const x0 = Math.min(d.x, e.clientX) - r.left, x1 = Math.max(d.x, e.clientX) - r.left, y0 = Math.min(d.y, e.clientY) - r.top, y1 = Math.max(d.y, e.clientY) - r.top, l = nodes.filter(n => n.k === 'army' && n.a.o === S.player && n.x >= x0 && n.x <= x1 && n.y >= y0 && n.y <= y1).map(n => n.a); if (l.length) { selArmy = l[0]; selSet = l.slice(1); sel = null; selTile = -1; toast(l.length + ' formation(s) sélectionnée(s)'); } layerDirty = true; refreshSide(true); return; }
  if (d.moved) return;
  if (!S) { const t = tileUnder(mx, my); if (t) pickNation(TL[t - 1].t); else { const nd = nodeAt(mx, my); if (nd && nd.k === 'city') pickNation(C[nd.i].t); } return; }
  if (S.phase !== 'earth') return;
  if (targ && d.b === 0) { const ci = cityFromPoint(mx, my); if (ci >= 0) fireTarget(ci); return; }
  if (d.b === 0) {
    const nd = nodeAt(mx, my);
    if (nd && nd.k === 'army') { if (d.sh && selArmy && nd.a.o === S.player && selArmy.o === S.player && nd.a !== selArmy) { const i = selSet.indexOf(nd.a); if (i >= 0) selSet.splice(i, 1); else selSet.push(nd.a); } else { selArmy = nd.a; selSet = []; sel = nd.a.at; selTile = nd.a.tl >= 0 ? nd.a.tl : -1; } }
    else if (nd && nd.k === 'city') { sel = nd.i; selTile = -1; }
    else { const t = nd && nd.k === 'tb' ? nd.i + 1 : tileUnder(mx, my); if (t) { sel = TL[t - 1].c; selTile = t - 1; } else { sel = null; selTile = -1; selArmy = null; selSet = []; } }
    layerDirty = true; refreshSide(true);
  } else if (d.b === 2 && selArmy && selArmy.o === S.player) { const nd = nodeAt(mx, my); let node = -1; if (nd && nd.k === 'city') node = nd.i; else if (nd && nd.k === 'army') node = aNode(nd.a); else { const t = tileUnder(mx, my); if (t) node = NC + t - 1; } if (node >= 0) orderAll(node); refreshSide(true); }
}
ov.addEventListener('pointerup', endPtr); ov.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); drag = null; });
ov.addEventListener('contextmenu', e => e.preventDefault());
ov.addEventListener('wheel', e => { e.preventDefault(); const r = ov.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? .82 : 1 / .82); }, { passive: false });
window.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'F2') { e.preventDefault(); toggleCheat(); }
  const earth = !S || S.phase === 'earth';
  if (earth) {
    const st = 60; if (e.key === 'ArrowLeft') pan(-st, 0); else if (e.key === 'ArrowRight') pan(st, 0); else if (e.key === 'ArrowUp') pan(0, -st); else if (e.key === 'ArrowDown') pan(0, st);
    else if (e.key === '+' || e.key === '=') zoomAt(cw / 2, ch / 2, .8); else if (e.key === '-') zoomAt(cw / 2, ch / 2, 1.25);
    else if ((e.key === 'h' || e.key === 'H') && S && S.phase === 'earth') { if (modalOpen && !askCur) closeModal(); else if (!modalOpen) A.openEnc('aide'); }
    else if (e.key === 'g' || e.key === 'G') A.tgGfx();
    else if ((e.key === 'a' || e.key === 'A') && S && S.phase === 'earth') toggleAuto();
    else if (e.key === 'm' || e.key === 'M') A.mm((mapMode + 1) % MODES.length); else if (e.key === 'c' || e.key === 'C') A.tgClouds(); else if (e.key === 'n' || e.key === 'N') A.tgNight();
  }
  if (!S) return;
  if (S.phase === 'earth' && /^Digit[67890]$/.test(e.code)) { const g = e.code.slice(5); S.grp = S.grp || {}; if (e.shiftKey) { S.grp[g] = selAll().filter(a => a.o === S.player).map(a => a.id); toast('Groupe ' + g + ' : ' + S.grp[g].length + ' formation(s)'); } else { const l = (S.grp[g] || []).map(id => S.armies.find(a => a.id === id)).filter(Boolean); if (l.length) { selArmy = l[0]; selSet = l.slice(1); sel = null; selTile = -1; const ll = nLL(aNode(l[0])); flyTo(ll.lon, ll.lat, Math.min(cam.h, .35)); layerDirty = true; refreshSide(true); } else toast('Groupe ' + g + ' vide (Maj+' + g + ' pour le créer)'); } return; }
  if (e.code === 'Space') { e.preventDefault(); S.speed = S.speed ? 0 : (S._ls || 1); A.speed(S.speed); } else if (e.key >= '1' && e.key <= '5') { S._ls = +e.key; A.speed(+e.key); }
  else if (e.key === 'Escape') { if (REPLAY) stopReplay(); else if (targ) { targ = null; renderSide(); } else if (modalOpen && !askCur) closeModal(); else { sel = selArmy = null; selSet = []; selTile = -1; layerDirty = true; if (S.phase === 'earth') refreshSide(true); } }
});
window.addEventListener('resize', resize);

// ---------- écran de départ ---------------------------------------------
function listNations() { const q = $('nsearch').value.toLowerCase(); $('nlist').innerHTML = T.slice().sort((a, b) => b.meta.g - a.meta.g).filter(t => t.name.toLowerCase().includes(q)).map(t => `<div data-n="${t.i}" class="${t.i === pickId ? 'on' : ''}"><span>${chip(t.i)}${t.name}</span><span class="dim">${t.cities.length} v. · ${fmt(t.meta.g)} Md$</span></div>`).join(''); }
function pickNation(i) {
  pickId = i; if (window._scnD) window._scnD(); const t = T[i], m = t.meta, b = {}, r = [0, 0, 0, 0]; for (const ti of t.tiles) { b[TL[ti].bio] = (b[TL[ti].bio] || 0) + TL[ti].area; r[TL[ti].rel] += TL[ti].area; }
  const bm = Object.keys(b).sort((x, y) => b[y] - b[x]).slice(0, 2).map(k => BIOME[k].n).join(', ');
  $('npick').innerHTML = `<h2 style="margin:0;font-size:17px">${chip(i)}${t.name}</h2><div class="row"><span>Population</span><b>${fmt(m.p * 1e6)}</b></div><div class="row"><span>PIB</span><b>${fmt(m.g)} Md$</b></div><div class="row"><span>Villes · provinces</span><b>${t.cities.length} · ${t.tiles.length}</b></div><div class="row"><span>Terrain dominant</span><b>${bm || '—'}</b></div><div class="row"><span>Difficulté</span><b>${m.g > 2000 ? 'Facile' : m.g > 300 ? 'Moyenne' : m.g > 30 ? 'Difficile' : 'Héroïque'}</b></div>`;
  $('bplay').disabled = false; layerDirty = true; listNations(); flyTo(t.lon, t.lat, Math.min(cam.h, clamp(Math.sqrt(t.area) / 2600, .25, 1.6)), 1100);
}
$('nsearch').addEventListener('input', listNations);
$('nlist').addEventListener('click', e => { const d = e.target.closest('[data-n]'); if (d) pickNation(+d.dataset.n); });
$('bplay').addEventListener('click', () => {
  newGame(pickId, { diff: +$('odiff').value, win: +$('owin').value, test: $('otest').checked, fac: $('ofac').checked, scn: $('oscn').value, auto: $('oauto').checked, doctrine: $('odoc').checked }); startUI(); sel = P().cap; const t = C[sel]; flyTo(t.lon, t.lat, S.active ? .5 : .25, 1200);
  addLog(`Vous prenez la tête de ${chip(pickId)}<b>${nm(pickId)}</b>. ${S.active ? 'Partie test : ' + S.active.slice(1).map(id => chip(id) + nm(id)).join(', ') + ' sont les seules autres nations actives.' : 'Objectif : l’hégémonie mondiale.'}`, 3); layerDirty = true; refreshSide(true);
});
$('bload').addEventListener('click', () => { try { const s = localStorage.getItem(SAVEK); if (!s) return toast('Aucune sauvegarde trouvée'); loadState(JSON.parse(s)); } catch (e) { toast('Sauvegarde indisponible'); } });
$('bimport').addEventListener('click', () => $('fimport').click());
$('bdir').addEventListener('click', () => pickSaveDir()); $('bloaddir').addEventListener('click', () => loadFromDir()); $('benc').addEventListener('click', () => modal(encHtml('aide')));
$('fimport').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { loadState(JSON.parse(r.result)); } catch (x) { toast('Fichier invalide'); } }; r.readAsText(f); });

// ---------- boucle --------------------------------------------------------
let lastTs = 0, acc = 0;
function frame(ts) {
  requestAnimationFrame(frame);
  try {
    const dt = Math.min(100, ts - lastTs); lastTs = ts;
    if (ov.clientWidth !== cw || ov.clientHeight !== ch) resize();
    if (REPLAY) stepReplay();
    if (S && !modalOpen && !battle && S.speed && !targ && !REPLAY) { acc += dt * SPEEDS[S.speed] / 1000; let n = 0; while (acc >= 1 && n < 8) { acc -= 1; n++; S.phase === 'earth' ? tick() : spTick(); } if (acc > 8) acc = 0; }
    if (S && S.phase === 'space') { if (scv.clientWidth !== sw || scv.clientHeight !== sh) spResize(); if (scv.width && scv.height) spDraw(ts); return; }
    if (!gl || !cw || !ch) return;
    if (!S && !drag && !camAnim && pickId == null) cam.lon += dt * .00003;
    stepCam(ts); if (!window.__noGov) governor(dt); drawGlobe(ts); drawOverlay(ts);
    if (flash > 0) { octx.fillStyle = `rgba(255,240,200,${flash})`; octx.fillRect(0, 0, cw, ch); flash -= .03; }
    const ar = $('altro'); if (ar && ts - (frame.at || 0) > 200) frame.at = ts, ar.textContent = '· altitude ' + (altKm() >= 100 ? fmt(altKm()) : altKm().toFixed(1)) + ' km';
  } catch (e) { if (!frame.err) { frame.err = 1; console.error(e); } }
}
async function boot() {
  const pr = m => $('loadmsg').textContent = m;
  try { await loadWorld(pr); pr('Initialisation du globe…'); resize(); cityWx = new Int16Array(C.length).fill(-1); globeInit(); }
  catch (e) { console.error(e); pr('Impossible de démarrer : ' + e.message); return; }
  const scnD = () => { const k = $('oscn').value, sc = SCN[k], t = pickId != null ? T[pickId] : null, m = t && (sc.mods[t.meta.a] || sc.mods['@' + t.meta.r]); $('oscnd').innerHTML = sc.d + (m ? ' <b>' + esc(t.name) + '</b> : ' + [m.inc && 'revenus ' + pct(m.inc), m.mat && 'matériaux ' + pct(m.mat), m.cost && 'coûts ' + pct(m.cost), m.nav && 'marine ' + pct(m.nav), m.air && 'aviation ' + pct(m.air), m.army && 'forces de départ ' + pct(m.army), m.grow && 'croissance démographique ' + pct(m.grow), m.inf && 'infamie ' + m.inf, m.expN && 'expansion ' + m.expN].filter(Boolean).join(', ') + '.' : ''); };
  $('oscn').addEventListener('change', scnD); window._scnD = scnD; scnD();
  $('loading').classList.add('hid'); listNations(); renderMM(); requestAnimationFrame(frame); dirLabel(); restoreDir(false);
}
