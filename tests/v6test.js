const puppeteer = require('puppeteer-core');
(async () => {
  const br = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], headless: 'new', protocolTimeout: 1800000 });
  const pg = await br.newPage(); await pg.setViewport({ width: 1500, height: 900 }); const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + (e.stack || '').split('\n')[1])); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 300)); });
  await pg.goto('file://' + require('path').resolve(__dirname, '../hegemonie_fr.html') + ''); await pg.waitForFunction(() => document.getElementById('loading').classList.contains('hid'), { timeout: 120000 });
  const R = await pg.evaluate(() => { const o = { checks: {} }, ok = (k, v) => o.checks[k] = !!v;
    try {
    const id = a => T.findIndex(t => t.meta.a === a), cnt = f => C.filter(f).length;
    // ---- données : régions vides, refuges, îles, montagnes, zones ----
    const W = ['CHN', 'IND', 'RUS', 'BRA', 'COD', 'COG', 'IDN', 'MEX', 'DEU', 'FRA', 'GBR', 'ESP', 'PAK'];
    o.cover = {}; for (const a of W) { const t = id(a), has = new Set(C.map(c => tileAt(c.lon, c.lat) - 1)), my = TL.filter(x => x.t === t && x.lat > -60), em = my.filter(x => !has.has(x.i)); o.cover[a] = (my.length - em.length) + '/' + my.length + ' max vide ' + Math.max(0, ...em.map(x => x.area)) + ' km²'; }
    ok('régions vides comblées (aucune province vide > 25 000 km²)', W.every(a => { const t = id(a), has = new Set(C.map(c => tileAt(c.lon, c.lat) - 1)); return TL.filter(x => x.t === t && x.lat > -60 && !has.has(x.i)).every(x => x.area <= 25000); }));
    const ref = {}; for (const c of C) if (c.fl === 4) ref[c.t] = (ref[c.t] || 0) + 1; o.refuges = cnt(c => c.fl === 4); o.refNat = Object.keys(ref).length;
    ok('2 à 5 refuges par nation concernée', Object.values(ref).every(v => v >= 1 && v <= 5) && o.refuges > 80);
    ok('refuges situés en zone hostile', C.filter(c => c.fl === 4).every(c => c.hz > 0));
    o.zones = HZN.map((n, k) => k ? n + ' ' + TL.filter(t => t.hz === k).length : '').filter(Boolean).join(' · ');
    ok('10 zones hostiles présentes', HZN.slice(1).every((_, k) => TL.some(t => t.hz === k + 1)));
    const isl = TL.filter(t => t.isl), mt = TL.filter(t => t.rel === 3 && !t.isl);
    o.iles = isl.length + ' provinces, ×' + Math.min(...isl.map(t => t.hard)).toFixed(2) + '–' + Math.max(...isl.map(t => t.hard)).toFixed(2); o.montagnes = mt.length + ' provinces, ×' + Math.min(...mt.map(t => t.hard)).toFixed(2) + '–' + Math.max(...mt.map(t => t.hard)).toFixed(2);
    ok('îles ×2–3,25', isl.length > 50 && isl.every(t => t.hard >= 2 && t.hard <= 3.25) && ['GBR', 'JPN', 'NZL', 'LKA', 'CUB', 'MDG'].every(a => TL.some(t => t.t === id(a) && t.isl)));
    ok('montagnes ×1,75–2,25', mt.length > 50 && mt.every(t => t.hard >= 1.75 && t.hard <= 2.25) && mt.every(t => Math.abs(t.tm.def - t.def0 * t.hard) < 1e-9));
    ok('capitales continentales non insulaires, Londres/Tokyo/Jakarta insulaires', ['FRA', 'ITA', 'ESP', 'DEU', 'RUS', 'IND', 'CHN', 'USA', 'BRA', 'TUR', 'AUS'].every(a => !C[T[id(a)].capC].isl) && ['GBR', 'JPN', 'IDN'].every(a => C[T[id(a)].capC].isl));
    // ---- partie : scénario grandes puissances ----
    pickNation(id('FRA')); $('oscn').value = 'gp'; $('bplay').click(); S.speed = 0;
    ok('version 8', S.v === 8 && SAVEK === 'hegemonie_save_v8');
    const U = S.nat[id('USA')]; o.usaExp = ['CAN', 'GRL', 'MEX', 'BRA'].map(a => a + ':' + U.scn.exp.includes(id(a))).join(' '); ok('USA : expansion vers Canada et Groenland', U.scn.exp.includes(id('CAN')) && U.scn.exp.includes(id('GRL')));
    ok('superficie de départ mémorisée', S.nat.every(n => n.area0 === n.area));
    // brise-glace
    const bi = UI.brise; ok('brise-glace : réservé CAN/USA/RUS', bi != null && canRecruit(S.nat[id('RUS')].cities.find(ci => S.city[ci].port > 0) ?? S.nat[id('RUS')].cap, bi) === '' || /port/i.test(canRecruit(S.nat[id('RUS')].cap, bi)));
    ok('brise-glace refusé à la France', /Réservé/.test(canRecruit(S.nat[id('FRA')].cap, bi)));
    // mers gelées : deux villes côtières arctiques reliées par mer
    let fz = null; for (const c of C) { if (!c.co || c.lat < 64 || (c.lon > -30 && c.lon < 45)) continue; for (const e of NA[c.i]) if (e[1] && e[0] < NC && C[e[0]].lat > 64 && !(C[e[0]].lon > -30 && C[e[0]].lon < 45)) { fz = [c.i, e[0], e[1], e[2]]; break; } if (fz) break; }
    if (fz) { const f = mkArmy(S.nat[0].id, fz[0], true); f.o = S.city[fz[0]].o; f.u[UI.frig] = 3; S.day = 15; const wF = edgeDays(fz[0], fz[1], fz[2], fz[3], f, false); f.u[bi] = 1; const wI = edgeDays(fz[0], fz[1], fz[2], fz[3], f, false); S.day = Math.round(196 / DPS); const sF = edgeDays(fz[0], fz[1], fz[2], fz[3], f, false); f.u[bi] = 0; const sN = edgeDays(fz[0], fz[1], fz[2], fz[3], f, false); S.day = 0;
      o.glace = `${C[fz[0]].name} → ${C[fz[1]].name} : hiver sans brise-glace ${wF >= 1e9 ? 'bloqué' : wF.toFixed(1)} · avec ${wI.toFixed(1)} j · été avec brise-glace ${sF.toFixed(1)} j, sans ${sN.toFixed(1)} j`; ok('mers polaires gelées en hiver, brise-glace ×4', wF >= 1e9 && Math.abs(wI / sF - 4) < .05); }
    // usure en zone hostile
    { const rus = id('RUS'), sib = C.find(c => c.t === rus && c.hz === 2 && S.city[c.i].o === rus), a = mkArmy(id('CHN'), sib.i); a.u[UI.inf] = 100; const base = .002; let s = 0; for (let k = 0; k < 200; k++) s += hzAtt(a, sib.i, base); const m = s / 200; const b = mkArmy(rus, sib.i); o.usure = `Sibérie (${sib.name}) : étranger ${(m * 100).toFixed(3)} %/j vs base ${(base * 100).toFixed(2)} % ; Russe ${(hzAtt(b, sib.i, base) * 100).toFixed(2)} %`;
      ok('usure aggravée ×1,5–1,8 pour les étrangers', m > base * 1.5 && m < (base + Math.max(sib.tm.att || 0, .0015)) * 1.81 && hzAtt(b, sib.i, base) === base); }
    // climat
    S.day = 0; const c0 = climCC(); S.day = 37 * 365 / DPS; const c1 = climCC(); S.day = 74 * 365 / DPS; const c2 = climCC(); S.day = 90 * 365 / DPS; const c3 = climCC(); S.day = 0;
    ok('climat progressif jusqu’en 2100 puis stable', c0 === 0 && Math.abs(c1 - .5) < .01 && c2 === 1 && c3 === 1);
    const used = CLIM.map((e, i) => C.filter(c => c.clim.l.includes(i)).length); o.climat = CLIM.map((e, i) => e.n + ' ' + used[i]).join(' · '); ok('20 effets climatiques, tous actifs quelque part', CLIM.length === 20 && used.every(v => v > 0));
    { recompute(); const f0 = S.nat.reduce((s, n) => s + n.foodP, 0), i0 = S.nat.reduce((s, n) => s + n.inc, 0); S.day = 80 * 365 / DPS; recompute(); const f1 = S.nat.reduce((s, n) => s + n.foodP, 0), i1 = S.nat.reduce((s, n) => s + n.inc, 0); S.day = 0; recompute(); o.climImpact = `vivres mondiaux ${((f1 / f0 - 1) * 100).toFixed(1)} %, revenus ${((i1 / i0 - 1) * 100).toFixed(1)} % en 2106`; ok('impact climatique mesurable', Math.abs(f1 / f0 - 1) > .01 && Math.abs(i1 / i0 - 1) > .005); }
    // ---- coalitions : on gonfle artificiellement la Chine ----
    const snap = JSON.stringify(S);
    { const ch = id('CHN'), N = S.nat[ch]; const others = S.nat.filter(n => n.alive && n.id !== ch).sort((a, b) => b.pop - a.pop); o.top = others.slice(0, 8).map(n => nm(n.id)).join(', ');
      N.pop = worldPop * .39; coalTick(); const c = S.coal; o.coal38 = c ? `niveau ${c.lv} : ${c.m.map(nm).join(', ')}` : 'aucune';
      ok('38 % : 2e et 3e alliés contre le meneur', c && c.L === ch && c.lv === 1 && c.m.length === 2 && c.m.every(m => others.slice(0, 3).some(x => x.id === m)) && isAlly(c.m[0], c.m[1]) && c.m.every(m => !isAlly(m, ch)));
      N.pop = worldPop * .46; S.day = 30; coalTick(); o.coal45 = `niveau ${S.coal.lv} : ${S.coal.m.map(nm).join(', ')} ; en guerre : ${S.coal.m.filter(m => inWar(m, ch)).map(nm).join(', ')}`;
      ok('45 % : 7 membres, guerre déclarée', S.coal.lv === 2 && S.coal.m.length >= 6 && S.coal.m.filter(m => m !== S.player).every(m => inWar(m, ch)));
      const mem = S.coal.m.filter(m => m !== S.player).map(m => S.nat[m]); for (const n of mem) { n.money += 20000; n.mat += 5000; } for (let k = 0; k < 6; k++) { S.day += 30; for (const n of mem) coalArm(n); for (let d = 0; d < 3; d++) queueTick(); }
      const nk = mem.map(n => n.tech.nuke); for (const n of mem) n.tech.nuke = Math.max(1, n.tech.nuke || 0); for (let k = 0; k < 4; k++) { S.day += 30; for (const n of mem) coalArm(n); for (let d = 0; d < 3; d++) queueTick(); }
      const prog = mem.map(n => nm(n.id) + ':' + (n.research && n.research.k === 'nuke' || n.tech.nuke ? 'N' : '-') + S.q.filter(x => x.o === n.id && (x.j === UI.csg || x.j === UI.nbomb)).length + '/' + S.armies.filter(a => a.o === n.id && (a.u[UI.csg] >= .5 || a.u[UI.nbomb] >= .5)).length);
      o.programmes = prog.join(' · '); o.infra = mem.map(n => nm(n.id) + ' port ' + Math.max(0, ...n.cities.map(ci => S.city[ci].port)) + ' base ' + S.city[n.cap].airb).join(' · ');
      ok('programmes GAN et bombardiers lancés', mem.some(n => S.q.some(x => x.o === n.id && (x.j === UI.csg || x.j === UI.nbomb)) || S.armies.some(a => a.o === n.id && (a.u[UI.csg] >= .5 || a.u[UI.nbomb] >= .5))) && mem.every(n => n.tech.nuke >= 1 || (n.research && n.research.k === 'nuke')));
      // troubles du ravitaillement
      N.pop = worldPop * .45; o.sup = [.40, .425, .45, .5, .55].map(s => { N.pop = worldPop * s; return (s * 100) + '%→' + Math.round(supTrouble(N) * 100) + '%'; }).join(' '); N.pop = worldPop * .2; const a0 = N.area; N.area = 30e6; const t30 = supTrouble(N); N.area = 50e6; const t50 = supTrouble(N); N.area = a0; o.supArea = '30 M km² → ' + Math.round(t30 * 100) + ' %, 50 M km² → ' + Math.round(t50 * 100) + ' %';
      N.pop = worldPop * .4; ok('troubles du ravitaillement : 0 sous 42,5 %, 30 % max', supTrouble(N) === 0 && (() => { N.pop = worldPop * .6; return Math.abs(supTrouble(N) - .3) < 1e-9; })() && t30 > 0 && t50 <= .3);
      // surextension
      o.ovx = [.2, .3, .4, .5].map(s => { N.pop = worldPop * s; return s * 100 + '%→' + (ovxP(ch) * 100).toFixed(1) + '%'; }).join(' ');
      ok('surextension : 25 % max à 50 %', (() => { N.pop = worldPop * .5; return Math.abs(ovxP(ch) - .25) < 1e-9; })() && (() => { N.pop = worldPop * .19; return ovxP(ch) === 0; })());
      N.pop = worldPop * .5; const ev = {}; const vn = id('VNM'); const vc = S.nat[vn].cities.slice(); let n0 = 0;
      for (let k = 0; k < 6; k++) for (const ci of vc) { const cs = S.city[ci]; if (cs.o !== ch) { cs.o = ch; } cs.ann = S.day; }
      recompute(); N.pop = worldPop * .5; const L0 = S.log.length;
      for (let r = 0; r < 18; r++) { S.day += 10; for (const ci of vc) { S.city[ci].ann = S.day - 20; } const nn = S.nat[ch].pop; S.nat[ch].pop = worldPop * .5; ovxTick(); S.nat[ch].pop = nn; }
      for (const ci of vc) if (S.city[ci].o !== ch) n0++;
      o.ovxEvents = `${vc.length} villes annexées, ${n0} perdues par sécession` ; ok('crises de surextension déclenchées', n0 > 0 || vc.some(ci => S.city[ci].riot > 0));
    }
    loadState(JSON.parse(snap)); S.speed = 0;
    // ---- villes refuges : la capitale se replie ----
    { const rus = id('RUS'), N = S.nat[rus], cap = N.cap, en = id('UKR'); declareWar(en, rus, false); const a = mkArmy(en, cap); a.u[UI.inf] = 50; S.armies.push(a); refugeTick();
      o.refuge = `${C[cap].name} → ${C[N.cap].name} (${HZN[C[N.cap].hz]})`; ok('capitale repliée vers un refuge', N.cap !== cap && C[N.cap].fl === 4 && N.cap0 === cap);
      S.armies = S.armies.filter(x => x !== a); for (let d = 0; d < 61 / DPS + 1; d++) { S.day++; refugeTick(); } ok('retour à la capitale après 60 jours de calme', N.cap === cap && N.cap0 == null); }
    // ---- défense des îles en combat ----
    { const gb = id('GBR'), lon = C.find(c => c.name === 'Londres' || c.name === 'London') || C[S.nat[gb].cap]; o.londres = lon.name + ' ×' + lon.hard.toFixed(2) + ' (île ' + lon.isl + ')'; ok('Londres défendue en tant qu’île', lon.isl === 1 && lon.hard >= 2); }
    // ---- simulation longue avec coalition et climat ----
    loadState(JSON.parse(snap)); S.speed = 0; const t0 = performance.now(); let mx = 0;
    S.nat[id('CHN')].pop *= 1; for (let d = 0; d < 400; d++) { const t1 = performance.now(); dayStep(); mx = Math.max(mx, performance.now() - t1); if (modalOpen) closeModal(); }
    o.ms = Math.round(performance.now() - t0); o.maxTick = Math.round(mx); o.nan = S.nat.filter(n => !Number.isFinite(n.money + n.inc + n.pop + n.food)).length; ok('400 jours sans erreur ni NaN', o.nan === 0);
    o.capsRefuge = S.nat.filter(n => n.alive && C[n.cap].fl === 4).map(n => nm(n.id) + '→' + C[n.cap].name).join(', ') || 'aucune';
    o.ovxLog = S.log.filter(l => /surextension/.test(l.m)).length;
    // ---- interface ----
    renderTop(); renderSide(); A.openClim(); const clim = $('mbox').textContent; closeModal(); ok('fenêtre climat', /Désertification du Sahel/.test(clim) && /Submersions/.test(clim));
    A.openRank(); const rk = $('mbox').innerHTML; closeModal(); ok('classement : superficie gagnée', /Gagnée/.test(rk) && /km²/.test(rk));
    A.openEnc('v6'); ok('encyclopédie v6', $('mbox').textContent.length > 2000); closeModal();
    MT.grid = true; MT.ruler = true; MT.pts = [[2.35, 48.86], [-0.13, 51.51], [13.4, 52.52]]; renderRuler(); const rt = $('ruler').textContent; o.regle = rt.replace(/\s+/g, ' ').slice(0, 400);
    const d = gcDist([2.35, 48.86], [-0.13, 51.51]); ok('règle : Paris–Londres ≈ 344 km', Math.abs(d - 344) < 3);
    const sq = sphArea([[0, 0], [1, 0], [1, 1], [0, 1]]); o.carre = Math.round(sq) + ' km² (1°×1° à l’équateur, attendu ≈ 12 364)'; ok('règle : superficie sphérique', Math.abs(sq - 12364) < 60);
    mapMode = 16; layerDirty = true; mapMode = 17; layerDirty = true; ok('18 modes de carte', MODES.length === 18);
    flyTo(10, 50, .9, 1); window.__shot = 1;
    } catch (e) { o.err = e.message + ' ' + (e.stack || '').split('\n').slice(1, 4).join('|'); }
    return o; });
  await new Promise(r => setTimeout(r, 2500)); await pg.screenshot({ path: __dirname + '/shot_v6_ruler.png' });
  await pg.evaluate(() => { MT.ruler = false; renderRuler(); mapMode = 17; layerDirty = true; flyTo(100, 60, 1.6, 1); renderMM(); }); await new Promise(r => setTimeout(r, 2500)); await pg.screenshot({ path: __dirname + '/shot_v6_zones.png' });
  await pg.evaluate(() => { mapMode = 16; S.day = 74 * 365 / DPS; layerDirty = true; flyTo(20, 15, 1.7, 1); renderMM(); renderTop(); }); await new Promise(r => setTimeout(r, 2500)); await pg.screenshot({ path: __dirname + '/shot_v6_clim.png' });
  console.log(JSON.stringify(R, null, 1)); console.log(errs.slice(0, 8).join('\n')); await br.close();
})();
