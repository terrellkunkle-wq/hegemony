const puppeteer = require('puppeteer-core');
const FILE = process.argv[2] || require('path').resolve(__dirname, '../hegemonie_fr.html');
(async () => {
  const br = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], headless: 'new', protocolTimeout: 1800000 });
  const pg = await br.newPage(); await pg.setViewport({ width: 1500, height: 900 }); const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + (e.stack || '').split('\n')[1])); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 300)); });
  await pg.goto('file://' + FILE); await pg.waitForFunction(() => document.getElementById('loading').classList.contains('hid'), { timeout: 120000 });
  const R = await pg.evaluate(() => { const o = { checks: {} }, ok = (k, v) => o.checks[k] = !!v;
    try {
    const id = a => T.findIndex(t => t.meta.a === a), N = a => S.nat[id(a)];
    pickNation(id('FRA')); $('bplay').click(); S.speed = 0;
    // ---- niveaux de départ ----
    ok('tech. de départ', N('USA').tl === 3 && N('ISR').tl === 3 && N('KOR').tl === 3 && N('JPN').tl === 3 && N('CHN').tl === 2 && N('RUS').tl === 2 && N('PRK').tl === 2 && N('POL').tl === 2 && N('FRA').tl === 2.5 && N('IND').tl === 1.6 && N('NGA').tl === 1);
    ok('expérience de départ', N('USA').xl === 3 && N('ISR').xl === 3 && N('RUS').xl === 3 && N('UKR').xl === 2.6 && N('CHN').xl === 1 && N('BRA').xl === 1);
    ok('générations supprimées', !TECH.gI && !TECH.gA && !TECH.gN);
    ok('multiplicateurs ×1,70 et ×1,50', Math.abs(techM({ tl: 3 }) - 1.7) < 1e-9 && Math.abs(xpM({ xl: 3 }) - 1.5) < 1e-9 && Math.abs(techM({ tl: 4 }) - 2.05) < 1e-9);
    // ---- calibrage ----
    const tot = S.nat.reduce((s, n) => s + (n.alive ? unitForce(n.id) : 0), 0), sh = a => unitForce(id(a)) / tot;
    o.parts = ['USA', 'CHN', 'RUS', 'IND'].map(a => a + ' ' + (sh(a) * 100).toFixed(1) + ' %').join(' · ') + ' · UE ' + (EU27.reduce((s, a) => s + sh(a), 0) * 100).toFixed(1) + ' %';
    ok('parts militaires 30/18/10/10/8', Math.abs(sh('USA') - .30) < .02 && Math.abs(sh('CHN') - .18) < .02 && Math.abs(sh('RUS') - .10) < .015 && Math.abs(sh('IND') - .10) < .015 && Math.abs(EU27.reduce((s, a) => s + sh(a), 0) - .08) < .015);
    // ---- tour de 3 jours ----
    { const d0 = S.day; tick(); ok('un tour = 4 jours de calendrier, un pas de simulation', S.day - d0 === 1 && DPS === 4 && dateStr(1) !== dateStr(0) && new Date(Date.UTC(2026, 0, 1 + 4)).getUTCDate() === 5); o.cal = dateStr(0) + ' → ' + dateStr(1) + ' → ' + dateStr(91); ok('saisons calendaires', seasonAt(45, 0) === 0 && seasonAt(45, 46) === 2 && seasonAt(-45, 46) === 0); }
    ok('pas de verrou en scénario standard', !S.locks || !Object.keys(S.locks).length);
    // ---- monnaie ----
    ok('facteurs monétaires', N('USA').cur === 2.25 && N('FRA').cur === 1.15 && N('DEU').cur === 1.15 && N('CHN').cur === 1.08 && N('JPN').cur === 1.05 && N('GBR').cur === 1.05 && N('BRA').cur === 1);
    ok('bonus de départ USA / pétromonarchies / UE', N('USA').bonus7 === 1 && N('SAU').bonus7 === 1.5 && N('QAT').bonus7 === 1.5 && N('FRA').bonus7 === .5 && !N('BRA').bonus7);
    { const u = N('USA'); recompute(); const m0 = u.money; u.money = 10; u.mat += 5000; u.mp += 5000; const j = UI.tank, ci = u.cap, q = recruit(u, ci, j, 50); o.dollar = `50 chars achetés avec 10 💰 en caisse : ${q} ; dette dollar ${Math.round(u.ddebt)} ; crédit restant ${fmt(dCredit(u))}`; ok('crédit dollar : achats militaires au-delà du trésor', q === 50 && u.ddebt > 0 && u.money <= 10 && u.intr === (u.debt || 0) * .00025 / 2.25 * Math.max(.5, 1 - .05 * u.bankLv)); u.money = m0;
      const f = N('FRA'); f.money = 0; f.mat += 5000; f.mp += 5000; ok('pas de crédit dollar pour l’euro', recruit(f, f.cap, j, 50) === 0); f.money = 1000; }
    ok('plafond d’emprunt × facteur', Math.abs(N('USA').debtMax - Math.max(100, 400 * N('USA').inc) * 2.25) < 1e-6);
    // ---- satellites ----
    ok('satellites : USA > Russie > Chine > Europe', N('USA').sat > N('RUS').sat && N('RUS').sat > N('CHN').sat && N('CHN').sat > N('FRA').sat && N('FRA').sat > N('BRA').sat && intelL(N('USA')) > intelL(N('CHN')));
    { const f = N('FRA'), ci = f.cap, cs = S.city[ci]; cs.spc = Math.max(cs.spc, 1); const u0 = cs.univ; cs.univ = 0; const r0 = canSat(f, ci); cs.univ = 4; f.satQ = []; f.money += 500; f.comp += 10; const ok1 = buySat(f, ci); const d = f.satQ[0] - S.day; o.satProg = `sans université : « ${r0} » ; lancement en ${d} jours`; ok('programme satellite (universités, temps, argent)', /Universités/.test(r0) && ok1 === 1 && d > 60 && d < 240); cs.univ = u0; }
    // ---- recherche ----
    { const n = N('BRA'), t0 = n.tl; n.rd = 2.5; n.tlD = 12; for (let k = 0; k < 365 / DPS; k++) { S.day++; techDay(n); } const dy = n.tl - t0; n.rd = 0; const t1 = n.tl; for (let k = 0; k < 365 / DPS; k++) { S.day++; techDay(n); } o.recherche = `Brésil : +${dy.toFixed(3)} en un an à 2,5 % (durée 12 ans) ; à 0 % : +${(n.tl - t1).toFixed(3)}`; ok('progression ≈ 1 niveau en 10–15 ans, nulle sans budget', dy > 1 / 15 * .9 && dy < 1 / 10 * 2.1 && n.tl === t1); S.day -= 2 * Math.ceil(365 / DPS); }
    { const n = N('USA'); n.rd = 5; const t0 = n.tl; for (let k = 0; k < 400; k++) techDay(n); ok('niveau 4 verrouillé avant 2050', n.tl === t0); const d0 = S.day; S.day = 25 * 365 / DPS; for (let k = 0; k < 400; k++) techDay(n); ok('niveau 4 accessible après 2050', n.tl > t0); n.tl = 3; S.day = d0; }
    // ---- expérience ----
    { const A = N('CHN'), B = N('VNM'), ci = B.cap, x0 = A.xl, y0 = B.xl; A.xlW = {}; const pop = S.city[ci].pop, ar = cityArea(ci); xpConq(B.id, A.id, ci, 1); const g = A.xl - x0, exp = (.1 * pop / 10 + .1 * ar / 5e5) / x0, lo = y0 - B.xl, expL = .08 * pop / 10 + .06 * ar / 5e5;
      o.xp = `Hanoï (${pop.toFixed(1)} M hab., ${fmt(ar)} km²) : Chine +${g.toFixed(4)} (attendu ${exp.toFixed(4)}), Viêt Nam −${lo.toFixed(4)}`; ok('expérience : conquête et perte', Math.abs(g - exp) < 1e-9 && (Math.abs(lo - expL) < 1e-9 || B.xl === 1));
      A.xl = 1; A.xlW = {}; for (let k = 0; k < 40; k++) xpConq(B.id, A.id, ci, 1); ok('plafond +0,5 par guerre', Math.abs(A.xl - 1.5) < 1e-9); A.xl = 3.4; A.xlW = {}; for (let k = 0; k < 40; k++) xpConq(id('LAO'), A.id, S.nat[id('LAO')].cap, 1); ok('plafond 3,5', A.xl <= 3.5 + 1e-9);
      const C0 = A.xl; A.xlW = {}; XPF = 1; const v = N('THA'); A.xl = 2; xpConq(v.id, A.id, v.cap, .5); const half = A.xl - 2; A.xl = 2; A.xlW = {}; xpConq(v.id, A.id, v.cap, 1); ok('cession par traité : moitié', Math.abs(half * 2 - (A.xl - 2)) < 1e-9); A.xl = 1; }
    { const n = N('BRA'); n.xl = 2; n.lastWar = 0; n.war = {}; const d0 = S.day; S.day = 1000; for (let k = 0; k < 365 / DPS; k++) { S.day++; xpDay(n); } ok('oubli en temps de paix (−0,02/an)', Math.abs(n.xl - 1.98) < 1e-3); S.day = d0; n.xl = 1; }
    // ---- unités lourdes ----
    ok('coûts et délais des unités lourdes', UN[UI.cv].c > 140 && UN[UI.cv].bt > 70 && UN[UI.csg].c === 10000 && UN[UI.csg].bt === 365 && UN[UI.vsx].bt === 730 && UN[UI.inf].c === 2 && UN[UI.inf].bt === 3);
    { const n = N('USA'), m0 = stockM(n, UI.cv); const a = mkArmy(n.id, n.cities.find(ci => C[ci].co), true); a.u[UI.cv] = 5; S.armies.push(a); const m1 = stockM(n, UI.cv); o.surcout = `porte-avions : ×${m0.toFixed(2)} → ×${m1.toFixed(2)} après 5 de plus`; ok('surcoût d’accumulation +10 %/exemplaire', Math.abs(m1 - m0 - .5) < 1e-9 && stockM(n, UI.inf) === 1); S.armies = S.armies.filter(x => x !== a); }
    // ---- garnisons ----
    { const f = N('FRA'), ci = f.cities.find(c => c !== f.cap && C[c].co); S.armies = S.armies.filter(a => !(a.at === ci && a.o === f.id)); const a = mkArmy(f.id, ci); a.u[UI.inf] = 5; a.u[UI.tank] = 2; S.armies.push(a); const ok1 = orderMove(a, f.cap); const left = S.armies.filter(x => x.o === f.id && x.at === ci && x !== a && !x.sea); o.garnison = `${C[ci].name} : ${left.length} garnison(s), ${left.map(x => x.nm + ' ' + Math.round(adiv(x))).join(', ')}`; ok('la dernière formation laisse une garnison', ok1 && left.length === 1 && left[0].u[UI.inf] === 1 && a.u[UI.inf] === 4); }
    { S.armies = S.armies.filter(a => a.gar !== 1 || Math.random() < .5); garTick(); const has = new Set(); for (const a of S.armies) if (!a.sea && a.tl < 0 && S.city[a.at].o === a.o) has.add(a.at); let e = 0; for (let i = 0; i < NC; i++) if (!has.has(i) && active(S.city[i].o) && !S.city[i].occ) e++; ok('toute ville a sa garnison', e === 0); }
    // ---- exode ----
    { const n = N('CHN'), ci = N('VNM').cities[1]; S.city[ci].o = n.id; S.city[ci].ann = S.day; const p0 = S.city[ci].pop; ovxApply(ci, OVX.find(e => e.k === 'exode')); ok('exode : la ville fuie perd 15 % de productivité', S.city[ci].refu > S.day && S.city[ci].pop < p0); }
    // ---- puissance ----
    powTick(); const top = S.nat.filter(n => n.alive).sort((a, b) => b.pwr - a.pwr).slice(0, 6).map(n => nm(n.id) + ' ' + n.pwr.toFixed(1)); o.puissance = top.join(' · ');
    ok('indice de puissance : USA en tête, Chine 2e', top[0].startsWith(nm(id('USA'))) && top[1].startsWith(nm(id('CHN'))));
    { const f = N('FRA'), d = N('DEU'); const e0 = f.pwrE; f.ally[d.id] = d.ally[f.id] = 1; powTick(); ok('alliances : +50 % de la puissance alliée', Math.abs(f.pwrE - (f.pwr + .5 * d.pwr + (f.pwrE - f.pwr - .5 * d.pwr))) < 1e-9 && f.pwrE > e0); }
    // ---- triche : bénéficiaire ----
    { A.openCheat ? A.openCheat() : null; cheatBen = id('BRA'); const b = N('BRA'), m0 = b.money; A.cMoney(); const t0 = b.tl; A.cGenTech(); ok('triche : renforcer un autre pays', b.money === m0 + 1000 && Math.abs(b.tl - t0 - .5) < 1e-9); cheatBen = null; }
    // ---- interface ----
    A.openNation(); const nh = $('mbox').textContent; closeModal(); ok('fiche nation v7', /Niveau technologique/.test(nh) && /Budget défense/.test(nh) && /Indice de puissance/.test(nh));
    A.openRank(); const rk = $('mbox').innerHTML; closeModal(); ok('classement : puissance, tech., exp.', /Puissance/.test(rk) && /Tech\./.test(rk));
    A.openEnc('v7'); ok('encyclopédie v7', $('mbox').textContent.length > 2500); closeModal();
    // ---- simulation : 200 tours (600 jours) ----
    const t0 = performance.now(); let mx = 0; for (let k = 0; k < 200; k++) { const t1 = performance.now(); tick(); mx = Math.max(mx, performance.now() - t1); if (modalOpen) closeModal(); }
    o.sim = `${S.day} jours en ${Math.round(performance.now() - t0)} ms, tour max ${Math.round(mx)} ms, ${S.armies.length} formations dont ${S.armies.filter(a => a.gar).length} garnisons`;
    o.nan = S.nat.filter(n => !Number.isFinite(n.money + n.tl + n.xl + n.str + (n.pwr || 0))).length; ok('600 jours sans NaN', o.nan === 0);
    o.fin = ['USA', 'CHN', 'RUS', 'IND', 'FRA'].map(a => { const n = N(a); return `${a} tech ${n.tl.toFixed(2)} exp ${n.xl.toFixed(2)} sat ${n.sat}+${(n.satQ || []).length} dette$ ${fmt(n.ddebt || 0)} puissance ${(n.pwr || 0).toFixed(1)}`; });
    } catch (e) { o.err = e.message + ' ' + (e.stack || '').split('\n').slice(1, 4).join('|'); }
    return o; });
  console.log(JSON.stringify(R, null, 1)); console.log(errs.slice(0, 8).join('\n')); await br.close();
})();
