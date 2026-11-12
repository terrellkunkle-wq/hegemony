// =====================================================================
// v6 — interface : outils de carte (graticule, règle multipoints, coordonnées), climat, coalition, infobulles
// =====================================================================
var HZC = ['', '#cfe8ff', '#7fb3a6', '#9fb7d6', '#e8c27a', '#d98c4a', '#f2d48a', '#2e8b57', '#3c7d3c', '#4f9a5e', '#e0a85a'];
var MT = { grid: false, ruler: false, cur: false, pts: [], closed: true };
(() => { const st = document.createElement('style'); st.textContent = `.clk{cursor:pointer}#ruler{position:fixed;right:12px;top:52px;z-index:30;background:#10161ee8;border:1px solid #2c3a4a;border-radius:8px;padding:8px 12px;font-size:12.5px;max-width:380px;min-width:280px;box-shadow:0 4px 18px #0008}#ruler .seg{max-height:120px;overflow:auto;color:#9fb0c0;margin:4px 0}#ruler button{margin-right:4px}#llbox{position:fixed;left:310px;bottom:34px;z-index:30;background:#10161ed0;border:1px solid #2c3a4a;border-radius:6px;padding:3px 8px;font:12px ui-monospace,monospace;color:#cfe3f5;pointer-events:none}`; document.head.appendChild(st);
  for (const id of ['ruler', 'llbox']) { const d = document.createElement('div'); d.id = id; d.className = 'hid'; document.body.appendChild(d); } })();

// ---------- géodésie ----------
function gcDist(a, b) { const p1 = a[1] * D2R, p2 = b[1] * D2R, dl = (b[0] - a[0]) * D2R, h = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2; return 2 * 6371.0088 * Math.asin(Math.min(1, Math.sqrt(h))); }
// aire d’un polygone sphérique (somme des angles, via la formule de l’excès appliquée par triangles sur un pôle)
function sphArea(pts) {
  if (pts.length < 3) return 0; let s = 0; const n = pts.length;
  for (let i = 0; i < n; i++) { const [l1, f1] = pts[i], [l2, f2] = pts[(i + 1) % n]; let dl = (l2 - l1) * D2R; dl = ((dl + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; s += dl * (2 + Math.sin(f1 * D2R) + Math.sin(f2 * D2R)); }
  let a = Math.abs(s * 6371.0088 * 6371.0088 / 2); const tot = 4 * Math.PI * 6371.0088 ** 2; if (a > tot / 2) a = tot - a; return a;
}
const llTxt = (lon, lat) => `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}  ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'O'}`;
const kmTxt = d => d >= 100 ? fmt(Math.round(d)) + ' km' : d.toFixed(1) + ' km';

// ---------- dessin : graticule et règle ----------
function gcLine(a, b, n) { const A = v3(a[0], a[1]), B = v3(b[0], b[1]), out = []; for (let i = 0; i <= n; i++) out.push(slerp(A, B, i / n)); return out; }
function drawMapTools(ts) {
  const c = octx;
  if (MT.grid) {
    c.save(); c.lineWidth = 1; c.font = '11px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const clat = clamp(cam.lat / D2R, -70, 70), clon = cam.lon / D2R, step = cam.h < .25 ? 5 : cam.h < .7 ? 10 : 15;
    for (let la = -90 + step; la < 90; la += step) {
      const sp = la === 0 || Math.abs(Math.abs(la) - 23.44) < .01 || Math.abs(Math.abs(la) - 66.56) < .01; c.strokeStyle = la === 0 ? 'rgba(255,214,90,.75)' : 'rgba(200,225,255,.35)';
      const pts = []; for (let lo = -180; lo <= 180; lo += 3) pts.push(v3(lo, la)); polyline(c, pts);
      const p = projLL(clon, la); if (p) { c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(p[0] - 17, p[1] - 7, 34, 14); c.fillStyle = '#dbe9f7'; c.fillText(Math.abs(la) + '°' + (la > 0 ? 'N' : la < 0 ? 'S' : ''), p[0], p[1]); }
    }
    for (const [la, nmT] of [[23.44, 'Tropique du Cancer'], [-23.44, 'Tropique du Capricorne'], [66.56, 'Cercle arctique'], [-66.56, 'Cercle antarctique']]) { c.strokeStyle = 'rgba(255,170,90,.45)'; c.setLineDash([5, 5]); const pts = []; for (let lo = -180; lo <= 180; lo += 3) pts.push(v3(lo, la)); polyline(c, pts); c.setLineDash([]); }
    for (let lo = -180; lo < 180; lo += step) {
      c.strokeStyle = lo === 0 ? 'rgba(255,214,90,.75)' : 'rgba(200,225,255,.35)'; const pts = []; for (let la = -88; la <= 88; la += 2) pts.push(v3(lo, la)); polyline(c, pts);
      const p = projLL(lo, clat); if (p) { const t = lo === 0 ? '0°' : lo === -180 ? '180°' : Math.abs(lo) + '°' + (lo > 0 ? 'E' : 'O'); c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(p[0] - 17, p[1] - 7, 34, 14); c.fillStyle = '#dbe9f7'; c.fillText(t, p[0], p[1]); }
    }
    c.restore();
  }
  if (MT.ruler && MT.pts.length) {
    const P = MT.pts; c.save(); c.strokeStyle = '#ffd24a'; c.lineWidth = 2.2; c.font = 'bold 11px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const segs = []; for (let i = 0; i + 1 < P.length; i++) segs.push([P[i], P[i + 1]]); if (MT.closed && P.length >= 3) segs.push([P[P.length - 1], P[0]]);
    if (MT.closed && P.length >= 3) { const poly = []; for (const [a, b] of segs) poly.push(...gcLine(a, b, 24)); c.fillStyle = 'rgba(255,210,74,.13)'; c.beginPath(); let pen = false; for (const v of poly) { const p = proj3(v); if (!p) continue; pen ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); pen = true; } c.closePath(); c.fill(); }
    segs.forEach(([a, b], k) => { c.setLineDash(k === P.length - 1 ? [6, 4] : []); polyline(c, gcLine(a, b, 48)); c.setLineDash([]); const m = slerp(v3(a[0], a[1]), v3(b[0], b[1]), .5), p = proj3(m); if (p) { const t = kmTxt(gcDist(a, b)); c.fillStyle = 'rgba(0,0,0,.65)'; const w = c.measureText(t).width + 8; c.fillRect(p[0] - w / 2, p[1] - 8, w, 16); c.fillStyle = '#ffe28a'; c.fillText(t, p[0], p[1]); } });
    P.forEach((q, i) => { const p = projLL(q[0], q[1]); if (!p) return; c.fillStyle = i === 0 ? '#ff6b5e' : '#ffd24a'; c.strokeStyle = '#000'; c.lineWidth = 1.2; c.beginPath(); c.arc(p[0], p[1], 5, 0, 6.3); c.fill(); c.stroke(); c.fillStyle = '#000'; c.font = 'bold 8px system-ui'; c.fillText(i + 1, p[0], p[1] + .5); c.font = 'bold 11px system-ui'; });
    c.restore();
  }
}
{ const _dO = drawOverlay; drawOverlay = function (ts) { _dO(ts); drawMapTools(ts); }; }

function renderRuler() {
  const e = $('ruler'); if (!MT.ruler) { e.classList.add('hid'); return; } e.classList.remove('hid'); const P = MT.pts;
  let tot = 0; const rows = []; for (let i = 0; i + 1 < P.length; i++) { const d = gcDist(P[i], P[i + 1]); tot += d; rows.push(`${i + 1} → ${i + 2} : <b>${kmTxt(d)}</b>`); }
  let per = tot; if (MT.closed && P.length >= 3) { const d = gcDist(P[P.length - 1], P[0]); per += d; rows.push(`${P.length} → 1 : <b>${kmTxt(d)}</b> <span class="dim">(fermeture)</span>`); }
  const ar = MT.closed && P.length >= 3 ? sphArea(P) : 0;
  e.innerHTML = `<b>📏 Règle</b> <span class="dim">— ${P.length}/30 points · clic gauche : ajouter · clic droit : retirer le dernier</span>
  <div class="seg">${P.length ? P.map((q, i) => `${i + 1}. ${llTxt(q[0], q[1])}`).join('<br>') : 'Cliquez sur le globe pour poser le premier point.'}</div>
  ${rows.length ? `<div class="seg">${rows.join('<br>')}</div>` : ''}
  <div>Longueur du tracé : <b>${kmTxt(tot)}</b>${MT.closed && P.length >= 3 ? ` · périmètre : <b>${kmTxt(per)}</b> · superficie : <b>${fmt(Math.round(ar))} km²</b>` : ''}</div>
  <div style="margin-top:6px"><button data-a="rUndo">Retirer le dernier</button><button data-a="rClear">Effacer</button><button data-a="rClosed" class="${MT.closed ? 'on' : ''}" title="Fermer le polygone pour mesurer une superficie">Polygone fermé</button><button data-a="tgRuler">Fermer la règle</button></div>`;
}
Object.assign(A, {
  tgGrid() { MT.grid = !MT.grid; renderMM(); }, tgCur() { MT.cur = !MT.cur; if (!MT.cur) $('llbox').classList.add('hid'); renderMM(); },
  tgRuler() { MT.ruler = !MT.ruler; renderRuler(); renderMM(); }, rUndo() { MT.pts.pop(); renderRuler(); }, rClear() { MT.pts = []; renderRuler(); }, rClosed() { MT.closed = !MT.closed; renderRuler(); },
  openClim() { modal(climHtml() + closeBtn); }, openCoal() { modal(coalHtml() + closeBtn); }
});
// la règle intercepte les clics sur le globe (phase de capture, avant la sélection)
ov.addEventListener('pointerup', e => {
  if (!MT.ruler || !drag || drag.moved || drag.box) return; const b = drag.b; if (b !== 0 && b !== 2) return;
  const r = ov.getBoundingClientRect(), ll = s2ll(e.clientX - r.left, e.clientY - r.top);
  if (b === 0) { if (!ll) return; if (MT.pts.length >= 30) toast('La règle accepte 30 points au maximum'); else MT.pts.push([ll[0], ll[1]]); } else MT.pts.pop();
  e.stopImmediatePropagation(); ptrs.delete(e.pointerId); drag = null; renderRuler();
}, { capture: true });
ov.addEventListener('pointermove', e => { if (!MT.cur) return; const r = ov.getBoundingClientRect(), ll = s2ll(e.clientX - r.left, e.clientY - r.top), b = $('llbox'); if (!ll) { b.classList.add('hid'); return; } b.classList.remove('hid'); b.style.left = ($('side').classList.contains('hid') ? 8 : 310) + 'px'; const t = tileAt(ll[0], ll[1]); b.textContent = llTxt(ll[0], ll[1]) + (t && TL[t - 1] ? ` · alt. ${TL[t - 1].elev} m` : ''); });
ov.addEventListener('pointerleave', () => $('llbox').classList.add('hid'));
window.addEventListener('keydown', e => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || (S && S.phase !== 'earth')) return; if (e.key === 'l' || e.key === 'L') A.tgGrid(); else if (e.key === 'r' || e.key === 'R') A.tgRuler(); });

// ---------- infobulles ----------
{ const _t = tipTile; tipTile = function (t) { const tl = TL[t - 1]; let h = _t(t); const x = [];
    if (tl.hz) x.push(`<span style="color:${HZC[tl.hz]}">⚠ Zone hostile : ${HZN[tl.hz]}</span> <span class="dim">(usure des envahisseurs ×1,5 à ×1,8)</span>`);
    if (tl.isl) x.push(`🏝 Île : défense ×${tl.hard.toFixed(2)}`); else if (tl.hard > 1.01) x.push(`⛰ Relief : défense ×${tl.hard.toFixed(2)}`);
    x.push(`<span class="dim">${llTxt(tl.lon, tl.lat)}</span>`); return h + x.map(s => `<div>${s}</div>`).join(''); }; }
{ const _t = tipCity; tipCity = function (ci) { const cd = C[ci], cs = S && S.city[ci]; let h = _t(ci); const x = [];
    if (cd.fl === 4) x.push(`<span class="or">🏕 Ville refuge de ${nm(cd.t)} (${HZN[cd.hz]}) : capitale de repli si la capitale est menacée</span>`);
    else if (cd.hz) x.push(`<span style="color:${HZC[cd.hz]}">⚠ ${HZN[cd.hz]}</span>`);
    if (cd.hard > 1.01) x.push(`${cd.isl ? '🏝 Île' : '⛰ Relief'} : défense ×${cd.hard.toFixed(2)}`);
    if (lockOf(ci) != null) x.push(`<span class="or">🔒 Verrou stratégique de ${nm(lockOf(ci))}${cs && cs.lockOn != null ? (cs.lockCrush ? ' — cède devant un envahisseur écrasant' : ' — envahi : usure ×' + LOCKF + ', résistance active') : ''}</span>`);
    if (cs && cs.ann != null && S.day - cs.ann < 180 / DPS && cs.o !== cd.t) x.push(`<span class="red">Annexion récente (${jd(180 / DPS - (S.day - cs.ann))} j de surextension)</span>`);
    if (cs && (cs.refu || 0) > S.day) x.push(`<span class="or">🚶 Exode : productivité −15 %</span>`);
    if (cd.clim && cd.clim.l.length) x.push(`<span class="dim">Climat : ${cd.clim.l.map(i => CLIM[i].ic).join(' ')}</span>`);
    return h + x.map(s => `<div>${s}</div>`).join(''); }; }

// ---------- fenêtres : climat, coalition ----------
function climHtml() {
  const cc = S ? climCC() : 0, yr = Math.floor(calY()), cnt = CLIM.map(() => 0), pl = S ? S.player : -1, mine = CLIM.map(() => 0);
  for (const c of C) if (c.clim) for (const i of c.clim.l) { cnt[i]++; if (S && S.city[c.i].o === pl) mine[i]++; }
  const fx = e => Object.entries(e.f).map(([k, v]) => `${{ inc: 'revenus', food: 'vivres', mat: 'matériaux', pw: v > 0 ? 'demande d’énergie' : 'production d’énergie', grow: 'croissance démographique' }[k]} ${v > 0 ? '+' : '−'}${Math.round(Math.abs(v) * cc * 100)} %`).join(', ');
  return `<h2>Changement climatique <span class="dim" style="font-size:13px">— ${yr} · +${climDT().toFixed(1)} °C · intensité ${Math.round(cc * 100)} %</span></h2>
  <div class="tip">Les 20 effets montent progressivement jusqu’en 2100 (intensité 100 %), puis restent stables. Valeurs ci-dessous à l’intensité actuelle ; mode de carte « Climat » pour la carte des impacts.</div>
  <table><tr><th>Effet</th><th>Villes touchées</th><th>Dont les vôtres</th><th>Conséquences actuelles</th></tr>${CLIM.map((e, i) => `<tr><td>${e.ic} <b>${e.n}</b></td><td>${cnt[i]}</td><td>${mine[i] || '—'}</td><td class="dim">${fx(e)}${e.ev ? ' · catastrophes (destructions)' : ''}${e.mig ? ' · départs vers les villes tempérées' : ''}${e.k === 'ban' ? ' · mers polaires libres plus longtemps (limite des glaces 62° → 72°)' : ''}${e.att ? ' · usure des armées' : ''}</td></tr>`).join('')}</table>`;
}
function coalHtml() {
  const c = S.coal; if (!c) return '<h2>Coalition</h2><p>Aucune coalition anti-hégémonie en cours.</p>';
  return `<h2>⚖ Coalition contre ${chip(c.L)}${nm(c.L)}</h2><p>${nm(c.L)} contrôle <b>${(hegShare(c.L) * 100).toFixed(1)} %</b> de la population mondiale. Niveau ${c.lv} : ${c.lv >= 2 ? 'sept puissances liguées, programmes de groupes aéronavals nucléaires et de bombardiers stratégiques' : 'les deux puissances suivantes alliées'}.</p>
  <table><tr><th>Membre</th><th>Population</th><th>Force</th><th>En guerre</th></tr>${c.m.filter(m => S.nat[m].alive).map(m => `<tr class="clk" data-a="goto" data-v="${S.nat[m].cap}"><td>${chip(m)}${nm(m)}</td><td>${(S.nat[m].pop / worldPop * 100).toFixed(1)} %</td><td>${fmt(S.nat[m].str)}</td><td>${inWar(m, c.L) ? '<span class="red">oui</span>' : 'non'}</td></tr>`).join('')}</table>`;
}

// ---------- encyclopédie ----------
function encV6() {
  const hz = {}; for (const c of C) if (c.fl === 4) (hz[c.t] = hz[c.t] || []).push(c.name);
  return `<h3>Coalitions anti-hégémonie</h3><p>Dès qu’une puissance contrôle <b>38 %</b> de la population mondiale (vassaux compris), les deux puissances suivantes s’allient contre elle : elles rompent leurs liens avec elle, s’arment et lui déclarent la guerre dès que leurs forces réunies approchent les siennes. À <b>45 %</b>, les cinq puissances suivantes rejoignent la coalition, qui entre aussitôt en guerre et lance des programmes de <b>groupes aéronavals nucléaires</b> et de <b>bombardiers stratégiques</b> (recherche nucléaire prioritaire, ports et bases aériennes portés au niveau 5, financement croisé). Si vous êtes l’une de ces puissances, il vous est proposé de rejoindre la coalition. Elle se dissout si la part du meneur retombe sous 33 %.</p>
  <h3>Surextension des conquêtes</h3><p>Pendant les <b>6 mois</b> qui suivent son annexion, une ville peut subir six crises : <b>insurrection</b> (partisans ou pertes de garnison), <b>sécession</b> (retour à son pays d’origine), <b>sabotage</b> (deux infrastructures détruites), <b>pénurie alimentaire</b> (−25 % des réserves nationales), <b>faillite locale</b> (recettes effondrées 60 jours) et <b>désertion des habitants</b> (8 à 15 % de la population fuit vers les villes des puissances voisines ; la ville abandonnée perd 15 % de productivité pendant 120 jours, au profit des villes d’accueil). Chaque risque vaut 0 % jusqu’à 20 % de la population mondiale et monte progressivement jusqu’à <b>25 %</b> sur la période de 6 mois à 50 %.</p>
  <h3>Troubles du ravitaillement</h3><p>À partir de <b>42,5 %</b> de la population mondiale, ou de <b>25 millions de km²</b>, vos armées hors du territoire national subissent chaque jour un risque de rupture (1,5 % de pertes, moral −2). Ce risque croît jusqu’à <b>30 %</b>, atteint à 50 % de la population mondiale ou à 40 millions de km².</p>
  <h3>Zones hostiles et villes refuges</h3><p>Dans le Grand Nord (nord du Canada, Groenland, Alaska, nord de la Scandinavie), la Sibérie à l’est de l’Oural, la Patagonie, le désert du Namib, l’Outback australien, le Sahara, les forêts d’Amazonie, du Congo et d’Indonésie et les déserts d’Arabie, d’Iran, d’Irak et de Syrie, l’usure des troupes ennemies ou d’occupation est aggravée de <b>50 à 80 %</b>. Chaque nation y possède 2 à 5 <b>villes refuges</b> (🏕) : si sa capitale est assiégée ou menacée par une armée ennemie à moins de 260 km, le gouvernement s’y replie, une partie de la population le suit, et la chute de l’ancienne capitale n’entraîne plus la capitulation. Il regagne sa capitale après 60 jours sans menace.</p>
  <p class="dim">${Object.keys(hz).map(t => `<b>${nm(+t)}</b> : ${hz[t].join(', ')}`).join(' · ')}</p>
  <h3>Îles et montagnes</h3><p>Les îles (masses terrestres de moins de 900 000 km²) sont <b>2 à 3,25 fois</b> plus dures à envahir, les zones montagneuses <b>1,75 à 2,25 fois</b> (semi-montagneuses : la racine de ce facteur) ; le coefficient de chaque province est tiré une fois pour toutes et figure dans son infobulle. Mode de carte « Zones hostiles ».</p>
  <h3>Brise-glace</h3><p>En hiver, les eaux polaires (au-delà de 62°, hors Atlantique Nord libre de glace jusqu’à 72°) gèlent : aucune flotte ni convoi n’y passe sans <b>brise-glace militaire</b>, réservé au Canada, aux États-Unis et à la Russie. Escortée, la flotte entière y avance quatre fois plus lentement. Le recul de la banquise repousse progressivement la limite des glaces jusqu’à 72°.</p>
  <h3>Changement climatique</h3><p>Vingt effets régionaux (désertification du Sahel, sécheresse méditerranéenne, montée des eaux, recul de la banquise, dégel du permafrost, verdissement boréal, canicules, cyclones, mousson perturbée, dépérissement amazonien, fonte des glaciers, effondrement des pêcheries, migration des ceintures agricoles, climatisation, maladies tropicales, migrations climatiques, mégafeux, recul de l’enneigement, tempêtes de sable, submersions) croissent jusqu’en <b>2100</b>, puis restent stables. Détail : bouton 🌡 de la barre du haut ; carte : mode « Climat ».</p>
  <h3>Outils de carte</h3><p><b>Lat/long</b> (touche L) : méridiens et parallèles, tropiques et cercles polaires. <b>Règle</b> (touche R) : jusqu’à 30 points, distances par segment, longueur totale, périmètre et superficie (polygone fermé, géodésie sphérique). <b>Coordonnées</b> : latitude, longitude et altitude sous le curseur.</p>
  <h3>Score</h3><p>Le classement affiche la superficie contrôlée et la superficie gagnée depuis le début de la partie ; chaque million de km² gagné rapporte 50 points.</p>`;
}
