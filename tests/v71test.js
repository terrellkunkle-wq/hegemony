const puppeteer = require('puppeteer-core');
(async () => {
  const br = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], headless: 'new', protocolTimeout: 1800000 });
  const pg = await br.newPage(); const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + (e.stack || '').split('\n')[1]));
  await pg.goto('file://' + require('path').resolve(__dirname, '../hegemonie_fr.html') + ''); await pg.waitForFunction(() => document.getElementById('loading').classList.contains('hid'), { timeout: 120000 });
  const R = await pg.evaluate(() => { const o = { checks: {} }, ok = (k, v) => o.checks[k] = !!v; try {
    const id = a => T.findIndex(t => t.meta.a === a), N = a => S.nat[id(a)];
    pickNation(id('FRA')); $('oscn').value = 'gp'; window._scnD && window._scnD(); $('bplay').click(); S.speed = 0;
    const L = Object.keys(S.locks).map(Number); o.verrous = ['RUS', 'USA', 'JPN', 'IDN', 'CHN', 'IND'].map(a => a + ' : ' + L.filter(ci => S.locks[ci] === id(a)).map(ci => C[ci].name).join(', ')).join(' · ');
    ok('18 verrous (3 villes les plus peuplées × 6 nations)', L.length === 18 && ['RUS', 'USA', 'JPN', 'IDN', 'CHN', 'IND'].every(a => { const top = N(a).cities.slice().sort((x, y) => S.city[y].pop - S.city[x].pop).slice(0, 3); return top.every(ci => S.locks[ci] === id(a)); }));
    // invasion de Tokyo par la Chine
    const snap = JSON.stringify(S);
    const jp = id('JPN'), ch = id('CHN'), tk = L.find(ci => S.locks[ci] === jp); declareWar(ch, jp, false);
    const a = mkArmy(ch, tk); a.u[UI.inf] = 100; a.u[UI.tank] = 20; S.armies.push(a); recompute();
    const u0 = adiv(a), m0 = N('CHN').money; lockTick(); const res = S.armies.find(x => x.o === jp && x.at === tk && x.lockR);
    o.tokyo = `${C[tk].name} : formation chinoise ${u0.toFixed(1)} → ${adiv(a).toFixed(2)} unités ; trésor chinois −${(m0 - N('CHN').money).toFixed(2)} ; résistance japonaise ${res ? res.u[UI.inf] : 0} fantassins`;
    ok('verrou envahi : usure ×2,5, coûts, résistance', adiv(a) < u0 * .992 && N('CHN').money < m0 && res && res.u[UI.inf] >= 2 && S.city[tk].lockOn != null);
    for (let k = 1; k <= 5; k++) { S.day++; lockTick(); } ok('nouvelle levée de résistance après 5 tours', res.u[UI.inf] > 2 + 2 * Math.sqrt(S.city[tk].pop) + 1);
    const big = mkArmy(ch, tk); big.u[UI.tank] = 3000; S.armies.push(big); const u1 = adiv(a); S.day++; lockTick(); ok('avantage écrasant : le verrou cède', S.city[tk].lockCrush === 1 && adiv(a) === u1); S.armies = S.armies.filter(x => x !== big);
    S.armies = S.armies.filter(x => x !== a); S.day++; lockTick(); ok('libération', S.city[tk].lockOn == null);
    loadState(JSON.parse(snap)); S.speed = 0;
    // durée calendaire d'une campagne : États-Unis contre Mexique
    const us = id('USA'), mx = id('MEX'), mc0 = N('MEX').cities.length; declareWar(us, mx, false); let tHalf = -1, tCap = -1, t0 = S.day;
    for (let k = 0; k < 400 && (tHalf < 0 || tCap < 0); k++) { tick(); if (modalOpen) closeModal(); const held = T[mx].cities.filter(ci => S.city[ci].o !== mx).length; if (tHalf < 0 && held >= mc0 / 2) tHalf = S.day; if (tCap < 0 && S.city[T[mx].capC].o !== mx) tCap = S.day; }
    o.mexique = `guerre déclarée le ${dateStr(t0)} ; moitié des villes prises : ${tHalf < 0 ? 'non atteinte' : dateStr(tHalf) + ' (' + Math.round((tHalf - t0) * DPS / 30.4) + ' mois)'} ; capitale : ${tCap < 0 ? 'tenue' : dateStr(tCap) + ' (' + Math.round((tCap - t0) * DPS / 30.4) + ' mois)'}`;
    o.nan = S.nat.filter(n => !Number.isFinite(n.money + n.tl + n.str)).length;
    } catch (e) { o.err = e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join('|'); } return o; });
  console.log(JSON.stringify(R, null, 1)); console.log(errs.slice(0, 5).join('\n')); await br.close(); })();
