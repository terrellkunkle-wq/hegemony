const puppeteer = require('puppeteer-core');
(async () => {
  const br = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], headless: 'new', protocolTimeout: 900000 });
  const pg = await br.newPage(); const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + (e.stack || '').split('\n')[1])); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 300)); });
  await pg.goto('file://' + require('path').resolve(__dirname, '../hegemonie_fr.html') + ''); await pg.waitForFunction(() => document.getElementById('loading').classList.contains('hid'), { timeout: 120000 });
  const R = await pg.evaluate(() => { const o = { checks: {} }, ok = (k, v) => o.checks[k] = !!v;
    try {
    const id = a => T.findIndex(t => t.meta.a === a);
    // référence : monde actuel
    pickNation(id('FRA')); $('oscn').value = 'std'; $('bplay').click(); S.speed = 0; const base = {}; for (const a of ['USA', 'CHN', 'RUS']) { let s = 0; for (const x of S.armies) if (x.o === id(a)) s += adiv(x); base[a] = s; } const inc0 = S.nat[id('USA')].inc, mat0 = S.nat[id('CHN')].matInc;
    // scénario + spectateur
    pickNation(id('FRA')); $('oscn').value = 'gp'; window._scnD(); o.desc = $('oscnd').textContent.slice(0, 200); $('oauto').checked = true; $('bplay').click(); S.speed = 0;
    const U = S.nat[id('USA')], Cn = S.nat[id('CHN')], R_ = S.nat[id('RUS')];
    ok('infamie de départ', R_.infamy === -150 && Cn.infamy === -200 && U.infamy === -250);
    const arm = a => { let s = 0; for (const x of S.armies) if (x.o === id(a)) s += adiv(x); return s; };
    o.army = { USA: [base.USA, arm('USA')], CHN: [base.CHN, arm('CHN')] }; ok('forces de départ +20 % / +25 % (après calibrage)', Math.abs(arm('USA') / base.USA - 1.2) < .03 && Math.abs(arm('CHN') / base.CHN - 1.25) < .03);
    ok('bonus financier et industriel', U.inc > inc0 * 1.15 && Cn.matInc > mat0 * 1.2); ok('croissance +20 %', S.nat[id('PAK')].scn.grow === 1.2 && S.nat[id('IDN')].scn.grow === 1.2 && S.nat[id('NGA')].scn.grow === 1.2 && !S.nat[id('FRA')].scn);
    o.exp = { RUS: R_.scn.exp.map(nm).slice(0, 50).join(', '), CHN: Cn.scn.exp.map(nm).join(', '), USA: U.scn.exp.map(nm).slice(0, 40).join(', ') };
    ok('mode spectateur actif', S.auto === true);
    const P0 = { money: P().money, armies: S.armies.filter(a => a.o === S.player).length }; const wars = {};
    const t0 = performance.now(); let mx = 0, modal = 0;
    for (let d = 0; d < 700; d++) { const t1 = performance.now(); dayStep(); mx = Math.max(mx, performance.now() - t1); if (modalOpen) { modal++; closeModal(); }
      for (const a of ['RUS', 'CHN', 'USA']) { const n = S.nat[id(a)]; if (!n.alive) continue; for (const w in n.war) if (n.war[w] != null && n.wk[w] !== 'def') (wars[a] = wars[a] || new Set()).add(+w); } }
    o.ms = Math.round(performance.now() - t0); o.maxTick = Math.round(mx); o.modals = modal;
    const inAxis = (a) => { const s = wars[a] ? [...wars[a]] : []; const n = S.nat[id(a)]; return { total: s.length, axe: s.filter(w => n.scn.exp.includes(w)).length, list: s.map(nm).join(', ') }; };
    o.wars = { RUS: inAxis('RUS'), CHN: inAxis('CHN'), USA: inAxis('USA') };
    ok('expansion dans l’axe', ['RUS', 'CHN', 'USA'].every(a => { const w = o.wars[a]; return w.total === 0 || w.axe / w.total >= .5; }) && ['RUS', 'CHN', 'USA'].some(a => o.wars[a].axe > 0));
    o.infEnd = { RUS: R_.infamy.toFixed(0), CHN: Cn.infamy.toFixed(0), USA: U.infamy.toFixed(0) };
    o.cities = { RUS: [T[id('RUS')].cities.length, R_.cities.length], CHN: [T[id('CHN')].cities.length, Cn.cities.length], USA: [T[id('USA')].cities.length, U.cities.length] };
    const pl = P(); o.player = { alive: pl.alive, villes: pl.cities.length, guerres: Object.keys(pl.war).map(nm), armées: S.armies.filter(a => a.o === S.player).length, recherche: Object.values(pl.tech).reduce((s, v) => s + v, 0), file: S.q.filter(x => x.o === S.player).length, constructions: pl.cities.reduce((s, ci) => s + BK.reduce((t, k) => t + S.city[ci][k], 0), 0) };
    ok('la nation du joueur est gérée par l’IA', o.player.recherche > 0 && (o.player.constructions > 0 || o.player.file > 0) && modal === 0);
    o.autoLog = S.log.filter(l => /Pilote automatique/.test(l.m)).slice(0, 5).map(l => l.m.replace(/<[^>]+>/g, ''));
    toggleAuto(false); ok('reprise des commandes', !S.auto); for (let d = 0; d < 20; d++) dayStep(); toggleAuto(true);
    A.openNation(); o.nation = $('mbox').textContent.match(/Scénario[^.]*\./) ? 'ok' : 'absent'; closeModal(); renderTop(); renderSide();
    const pop = id2 => S.nat[id2].pop; o.popGrowth = { PAK: (pop(id('PAK')) / T[id('PAK')].meta.p).toFixed(3), FRA: (pop(id('FRA')) / T[id('FRA')].meta.p).toFixed(3) };
    o.v6 = { coal: S.coal ? nm(S.coal.L) + ' niv. ' + S.coal.lv + ' : ' + S.coal.m.map(nm).join(', ') : 'aucune', parts: S.nat.filter(n => n.alive).sort((a, b) => b.pop - a.pop).slice(0, 4).map(n => nm(n.id) + ' ' + (hegShare(n.id) * 100).toFixed(1) + '% ' + Math.round(n.area / 1e6 * 10) / 10 + 'Mkm² sup ' + Math.round((n.supT || 0) * 100) + '%').join(' · '), ovx: S.log.filter(l => /surextension/.test(l.m)).length, refuges: S.nat.filter(n => n.alive && C[n.cap].fl === 4).map(n => nm(n.id) + '→' + C[n.cap].name).join(', '), gain: S.nat.filter(n => n.alive).sort((a, b) => areaGain(b) - areaGain(a)).slice(0, 4).map(n => nm(n.id) + ' +' + Math.round(areaGain(n) / 1000) + 'k km²').join(', '), coalLog: S.log.filter(l => /coalition/i.test(l.m)).slice(0, 4).map(l => l.m.replace(/<[^>]+>/g, '')) };
    o.ult = Object.entries(S.ult || {}).map(([k, u]) => k.split(">").map(x => nm(+x)).join(" > ") + " : " + u.st + (u.n ? " (" + u.n + " frappe(s))" : "")); o.dead = S.nat.filter(n => !n.alive).length; o.nan = S.nat.filter(n => !Number.isFinite(n.money + n.inc + n.infamy)).length;
    } catch (e) { o.err = e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join('|'); }
    return o; });
  console.log(JSON.stringify(R, null, 1)); console.log(errs.slice(0, 6).join('\n')); await br.close();
})();
