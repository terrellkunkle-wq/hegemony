const puppeteer = require('puppeteer-core');
(async () => {
  const br = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], headless: 'new', protocolTimeout: 1800000 });
  const pg = await br.newPage(); await pg.setViewport({ width: 1500, height: 900 }); const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + (e.stack || '').split('\n')[1])); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 300)); });
  await pg.goto('file://' + require('path').resolve(__dirname, '../index.html') + ''); await pg.waitForFunction(() => document.getElementById('loading').classList.contains('hid'), { timeout: 120000 });
  await pg.screenshot({ path: __dirname + '/shot_en_start.png' });
  const R = await pg.evaluate(() => { const o = { fr: {} }; try {
    const FRW = /\b(les|des|du|une|est|avec|pour|dans|sur|vos|votre|aucun|ville|villes|armée|jours|niveau|puissance|guerre|paix|unités)\b|[éèêàùç]/i;
    const scan = (k) => { const t = (document.getElementById('mbox') || document.body).innerText; const hits = t.split(/\n/).filter(l => FRW.test(l) && !/Côte|Curaçao|São|Réunion|Québec|Nouméa|Åland|Brasília|Córdoba|Bogotá|México|Lomé|Malé/.test(l)); o.fr[k] = hits.slice(0, 4); };
    scan('accueil');
    const id = a => T.findIndex(t => t.meta.a === a); pickNation(id('GBR')); $('bplay').click(); S.speed = 0; o.nm = [nm(id('DEU')), nm(id('CIV')), C[S.nat[id('GBR')].cap].name, C[S.nat[id('RUS')].cap].name];
    renderTop(); renderSide(); o.top = $('top').innerText.slice(0, 300);
    for (const k of ['openNation', 'openArmies', 'openMarket', 'openDip', 'openTech', 'openRank', 'openWx', 'openClim', 'openCoal']) { try { A[k](); scan(k); closeModal(); } catch (e) { o.fr[k] = 'ERR ' + e.message; } }
    for (const t of ENC_TABS.map(x => x[0])) { A.openEnc(t); scan('enc_' + t); closeModal(); }
    sel = S.nat[id('GBR')].cap; renderSide(); o.side = $('side').innerText.slice(0, 400); scan('side');
    for (let k = 0; k < 120; k++) { tick(); if (modalOpen) { scan('modal' + k); closeModal(); } }
    o.log = S.log.slice(0, 8).map(l => l.m.replace(/<[^>]+>/g, ''));
    o.nan = S.nat.filter(n => !Number.isFinite(n.money + n.tl + n.str)).length; o.day = S.day; o.date = dateStr(S.day);
    } catch (e) { o.err = e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join('|'); } return o; });
  await pg.evaluate(() => { sel = null; renderSide(); }); await new Promise(r => setTimeout(r, 1500)); await pg.screenshot({ path: __dirname + '/shot_en_game.png' });
  console.log(JSON.stringify(R, null, 1)); console.log(errs.slice(0, 8).join('\n')); await br.close();
})();
