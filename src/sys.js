// ====================================================================
//  Systèmes v4 : énergie et ressources, société (stabilité, démographie,
//  fiscalité, mobilisation, dette, régimes), commerce, spécialistes,
//  parachutages, satellites, score, sauvegarde sur disque
// ====================================================================
function applyDisc() { for (let i = 0; i < TL.length; i++) TL[i].res = TL[i].res0; if (S && S.disc) for (const i in S.disc) if (TL[i]) TL[i].res = S.disc[i]; for (const c of C) cityRes(c); }
function initEco() {
  recompute();
  for (let i = 0; i < C.length; i++) { const cs = S.city[i]; cs.pw0 = cityDemand(cs) * .97; cs.fd0 = cs.pop * .3 * 1.04; }
  for (const n of S.nat) { let np = 0, D = 0; for (const ci of n.cities) { np += S.city[ci].pnu; D += S.city[ci].pw0; } if (np && D) { const f = Math.max(0, (D - 31 * np) / D); for (const ci of n.cities) S.city[ci].pw0 *= f; } }
  const use = new Float64Array(S.nat.length); for (const a of S.armies) for (let j = 0; j < NU; j++) use[a.o] += a.u[j] * UN[j].f;
  const un = new Float64Array(S.nat.length); for (const a of S.armies) un[a.o] += adiv(a);
  for (const n of S.nat) { n.goods0 = n.pop * .02 * 1.03 - n.goodsP; n.goods = n.pop * .02 * 40; n.ammo0 = un[n.id] * .004 - Math.min(n.ammoInc, un[n.id] * .003); n.ammo = 10 + un[n.id] * .3; n.fuel0 = use[n.id] * .17; n.fuel = use[n.id] * 45 + 5; n.food = n.pop * .3 * 40; n.fUse = use[n.id] * .15; }
}
const stockCap = (n, k) => k === 'food' ? Math.max(50, n.pop * .3 * 150) : 1e9;
function stabTarget(cs, cd, n, garr) {
  const id = IDEO[n.ideo], tx = TAX[n.tax].s * (n.ideo === 'auto' && TAX[n.tax].s < 0 ? .5 : 1);
  let t = 70 + 5 * cs.admin + 2 * cs.hosp + 4 * Math.min(3, civN(cs, 'adm')) + 3 * n.tech.civ + (id.s || 0) + tx + MOB[n.mob].s;
  if (!isCore(cs, cd)) t -= cultOf(cd.t) === cultOf(cs.o) ? 10 : relOf(cd.t) === relOf(cs.o) ? 18 : 25;
  if (n.short) t -= 6; if ((cs.bd || 0) > 30) t -= 10;
  t -= Math.min(15, (n.warLen || 0) / 40);
  if (n.eR < .8) t -= 8; if (n.starve) t -= 15; if (garr) t += 10; if ((n.bankrupt || 0) > S.day) t -= 20;
  return clamp(t, 5, 100);
}
function ecoTick() {
  const garr = new Uint8Array(C.length), fu = new Float64Array(S.nat.length);
  for (const a of S.armies) {
    const cs = S.city[a.at];
    if (!a.sea && a.tl < 0 && cs.o === a.o && aland(a) >= 1) garr[a.at] = 1;
    const no = nOwner(aNode(a)); if (!a.path.length && (no === a.o || isAlly(a.o, no))) a.dig = Math.min(10, (a.dig || 0) + (a.ord === 2 ? 2 : 1));
    if (a.mor == null) a.mor = 80; if (!(a.hit != null && S.day - a.hit < 2)) a.mor = Math.min(100, a.mor + 2 + (a.gen && a.gen.tr === 'cha' ? 1.5 : 0) - (S.nat[a.o].starve ? 3 : 0));
    if (a.gen) a.gen.lv = Math.max(a.gen.lv, 1 + Math.min(3, Math.floor((a.xp || 0) / 30)));
    if (a.sea && cs.mn && a.tl < 0 && atWar(a.o, cs.mn.o) && a.u[UI.frig] >= 1 && !a.path.length) { cs.mn.q -= 1; if (cs.mn.q <= 0) cs.mn = null; }
    const act = a.path.length || (a.hit != null && S.day - a.hit < 3) ? 1 : .15; for (let j = 0; j < NU; j++) if (a.u[j]) fu[a.o] += a.u[j] * UN[j].f * act;
  }
  for (const n of S.nat) {
    if (!n.alive || !active(n.id)) continue;
    const pl = n.id === S.player; n.fUse = fu[n.id];
    n.fuel += n.fuelInc - n.fUse; n.food = Math.min(stockCap(n, 'food'), n.food + n.foodInc); n.comp += n.compInc; n.ura = Math.max(0, n.ura + n.uraInc - n.uraUse); n.ammo = Math.min(Math.max(n.ammo, 400 + n.men * .05), Math.max(0, n.ammo + n.ammoInc)); n.goods = clamp(n.goods + n.goodsInc, 0, Math.max(40, n.goodsD * 150)); n.short = n.goods <= 0 && n.goodsInc < 0;
    if (pl && S.cheat.res) { n.fuel = Math.max(n.fuel, 500); n.food = Math.max(n.food, 500); n.comp = Math.max(n.comp, 200); n.ura = Math.max(n.ura, 100); n.ammo = Math.max(n.ammo, 300); n.goods = Math.max(n.goods, 100); n.short = false; }
    if (n.fuel <= 0) { n.fuel = 0; if (!n.dry) { n.dry = true; if (pl) addLog('⛽ <b>Panne sèche</b> : vos forces manquent de carburant (puissance −30 %, marches ralenties). Raffinez ou achetez au marché.', 1); } } else if (n.dry && n.fuel > n.fUse * 2) n.dry = false;
    if (n.food <= 0) { n.food = 0; if (!n.starve) { n.starve = true; if (pl) addLog('🌾 <b>Pénurie alimentaire</b> : la population souffre, la stabilité chute.', 1); } } else if (n.starve && n.food > n.foodD) n.starve = false;
    if (n.money <= -49) {
      if ((n.debt || 0) < n.debtMax) { borrow(n); if (pl) addLog('🏦 Trésor à sec : <b>emprunt forcé</b> contracté.', 1); }
      else if ((n.bankrupt || 0) < S.day) {
        n.bankrupt = S.day + 120; n.debt *= .5; n.money = 0; for (const ci of n.cities) S.city[ci].stab = Math.max(5, S.city[ci].stab - 20);
        for (const a of S.armies) if (a.o === n.id) for (let j = 0; j < NU; j++) a.u[j] *= .85; needRecalc = true;
        if (pl || n.cities.length > 6) addLog(`🏦 ${chip(n.id)}<b>${nm(n.id)}</b> fait <b>faillite</b> : désertions, troubles, dette restructurée.`, pl ? 1 : 0, n.cap);
      }
    }
  }
  const flips = [], prosp = S.day % 90 === 0;
  for (let i = 0; i < C.length; i++) {
    const cs = S.city[i], n = S.nat[cs.o]; if (!n.alive || !active(cs.o)) continue; const cd = C[i];
    if (cs.mn && atWar(cs.mn.o, cs.o)) cs.blk = S.day;
    cs.bd = S.day - cs.blk < 2 ? (cs.bd || 0) + 1 : 0;
    if (!isCore(cs, cd)) { cs.as = (cs.as || 0) + 1 + Math.min(3, civN(cs, 'adm')); if (cs.as >= 720) { cs.core = cs.o; cs.as = 0; needRecalc = true; if (cs.o === S.player) addLog(`🏛 <b>${cd.name}</b> est assimilée : elle compte désormais comme territoire national.`, 3, i); } }
    const tg = stabTarget(cs, cd, n, garr[i]); cs.stab += clamp(tg - cs.stab, -.5, .5);
    {
      const g = .008 / 365 * DPS * (n.scn ? n.scn.grow : 1) * Math.max(0, 1 + climCC() * cd.clim.grow) * (1 + .15 * cs.hosp + .1 * Math.min(3, civN(cs, 'med')) + .15 * n.tech.med) * (n.starve ? -3 : 1) * (cs.stab / 70);
      cs.pop *= 1 + g; if (cd.fl !== 2) { const r = rankOf(cs.pop); if (r > cs.rk) { cs.rk = r; if (cs.o === S.player) addLog(`🏙 <b>${cd.name}</b> devient ${RANK[r].toLowerCase()}.`, 2, i); } }
      if (cs.stab < 25 && Math.random() < .012 && (cs.riot || -9) < S.day && !(S.cheat.calm && cs.o === S.player)) {
        cs.riot = S.day + 30; cs.pop *= .98; const bk = BK.filter(b => cs[b] > 0); if (bk.length) cs[pick(bk)]--; needRecalc = true;
        const orig = cd.t, back = orig !== cs.o && S.nat[orig].alive && active(orig) && !garr[i];
        if (back) flips.push([i, orig]);
        if (cs.o === S.player || (back && orig === S.player)) addLog(`🔥 <b>Émeutes à ${cd.name}</b> (stabilité ${cs.stab | 0}) : ${back ? 'la ville se soulève et rejoint ' + nm(orig) : 'revenus effondrés pendant 30 jours'}.`, back && orig === S.player ? 2 : 1, i);
      }
    }
    if (prosp && civN(cs, 'geo') > 0 && Math.random() < 1 - Math.pow(.65, Math.min(2, civN(cs, 'geo')))) {
      const free = cd.tiles.filter(ti => !TL[ti].res); if (free.length) { const ti = pick(free), tl = TL[ti], r = pick(tl.rel >= 2 ? ['minerai', 'minerai', 'uranium', 'rare', 'charbon'] : tl.bio === 'desert' || tl.bio === 'steppe' ? ['petrole', 'gaz', 'uranium', 'rare'] : tl.bio === 'toundra' || tl.bio === 'taiga' ? ['gaz', 'petrole', 'minerai', 'charbon', 'rare'] : ['charbon', 'minerai', 'rare', 'gaz']); S.disc[ti] = r; tl.res = r; cityRes(cd); needRecalc = layerDirty = true; if (cs.o === S.player) addLog(`⛰ Vos géologues découvrent un gisement : <b>${TRES[r][0]}</b> près de ${cd.name}.`, 2, i); }
    }
  }
  for (const [i, orig] of flips) if (S.city[i].o !== orig && S.nat[orig].alive) { const by = S.city[i].o; if (!atWar(orig, by)) continue; capture(i, orig); const m = mkArmy(orig, i); m.u[UI.inf] = 3; S.armies.push(m); }
}
// ---------- commerce, dette ------------------------------------------------
const mBuy = k => RSC[k].price * 1.15, mSell = k => RSC[k].price * .85;
function marketBuy(n, k, q) { if (n.sanc && !(S.cheat.love && n.id === S.player)) return 0; q = Math.min(q, Math.floor(n.money / mBuy(k))); if (q <= 0) return 0; n.money -= q * mBuy(k); n[k] += q; return q; }
function marketSell(n, k, q) { if (n.sanc && !(S.cheat.love && n.id === S.player)) return 0; q = Math.min(q, Math.floor(n[k])); if (q <= 0) return 0; n.money += q * mSell(k); n[k] -= q; return q; }
const loanAmt = n => Math.max(50, Math.round(60 * n.inc));
function borrow(n) { const a = loanAmt(n); if ((n.debt || 0) + a > n.debtMax * 1.001 + a) return 0; n.debt = (n.debt || 0) + a; n.money += a; needRecalc = true; return a; }
function repay(n) { const d = n.debt || 0, a = Math.min(d, d <= loanAmt(n) * 1.5 ? d : loanAmt(n), Math.max(0, n.money)); if (a <= 0) return 0; n.debt -= a; n.money -= a; if (n.debt < .5) n.debt = 0; needRecalc = true; return a; }
// ---------- spécialistes civils et scientifiques -----------------------------
function civMax(ci, k) { const cs = S.city[ci]; return k === 'cher' ? 2 * (cs.lab + cs.univ) : CVI[k].max; }
function canCiv(ci, k) { const c = CVI[k], cs = S.city[ci]; if (c.need && !c.need.split('|').some(b => cs[b] > 0)) return c.need.split('|').map(b => BLD[b].n).join(' ou ') + ' requis'; if (civN(cs, k) >= civMax(ci, k)) return 'plafond atteint'; return ''; }
function recruitCiv(n, ci, k) { const c = CVI[k], cs = S.city[ci]; if (cs.o !== n.id || canCiv(ci, k)) return 0; const d = disc(n); if (n.money < c.c * d || n.mp < c.men) return 0; n.money -= c.c * d; n.mp -= c.men; cs.civ[k] = civN(cs, k) + 1; needRecalc = true; return 1; }
function dismissCiv(n, ci, k) { const cs = S.city[ci]; if (cs.o !== n.id || !civN(cs, k)) return 0; cs.civ[k]--; n.mp += CVI[k].men; needRecalc = true; return 1; }
// ---------- parachutages, satellites ---------------------------------------
function airdrop(a, tgt) {
  const q = a.u[UI.para], cs0 = S.city[a.at], cs = S.city[tgt]; if (!(q >= .5)) return 'Aucun parachutiste dans cette armée';
  if (cs0.o !== a.o || cs0.airb < 1) return 'Les parachutistes doivent partir d’une de vos bases aériennes';
  const d = cdist(a.at, tgt); if (d > UN[UI.para].drop) return 'Hors de portée (' + Math.round(d) + ' km / ' + UN[UI.para].drop + ' km)';
  if (!passable(a.o, tgt)) return 'Zone interdite : il faut être en guerre ou allié';
  const w = wxOf(a.at), w2 = wxOf(tgt); if ((w && w.m.air === 0) || (w2 && w2.m.air === 0)) return 'Aviation clouée au sol par la météo';
  let AA = 6 * cs.dca, loss = 0; if (atWar(a.o, cs.o)) { for (const x of S.armies) if (x.at === tgt && atWar(a.o, x.o)) for (let j = 0; j < NU; j++) AA += x.u[j] * UN[j].aa; loss = Math.min(.5, .06 + AA / (AA + 40) * .4); }
  if (S.cheat.god && a.o === S.player) loss = 0;
  const b = mkArmy(a.o, tgt); b.u[UI.para] = q * (1 - loss); b.xp = a.xp || 0; a.u[UI.para] = 0; S.armies.push(b); needRecalc = true;
  FX.push({ k: 'drop', a: a.at, b: tgt, t0: performance.now(), dur: 2600, col: T[a.o].color });
  if (a.o === S.player || cs.o === S.player) addLog(`🪂 ${chip(a.o)}<b>${nm(a.o)}</b> largue ${Math.round(q)} unités de parachutistes sur <b>${C[tgt].name}</b> (${(loss * 100 | 0)} % de pertes au largage).`, a.o === S.player ? 2 : 1, tgt);
  if (a === selArmy && adiv(a) < .3) selArmy = b;
  return '';
}
function canSat(n, ci) { return S.city[ci].spc < 1 ? 'Centre spatial requis' : univOf(n) < 2 ? 'Universités requises (niveau total 2)' : (n.tl || 1) < 1.5 ? 'Niveau technologique 1,5 requis' : (n.satQ || []).length >= 1 + Math.floor(S.city[ci].spc / 2) ? 'Lancements en cours (' + n.satQ.length + ')' : ''; }
const satDays = (n, ci) => Math.round(240 / (1 + .1 * Math.min(10, univOf(n))) / (1 + .1 * ((S.city[ci].spc || 1) - 1)));
function buySat(n, ci) { if (canSat(n, ci) || spendable(n) < 80 * disc(n) || n.comp < 3) return 0; payM(n, 80 * disc(n)); n.comp -= 3; (n.satQ = n.satQ || []).push(S.day + satDays(n, ci)); return 1; }
// ---------- régime -----------------------------------------------------------
function setIdeo(n, k) { if (!IDEO[k] || n.ideo === k) return 'Régime inchangé'; if ((n.ideoCd || 0) > S.day && !(S.cheat.love && n.id === S.player)) return 'Transition en cours : encore ' + jd(n.ideoCd - S.day) + ' j'; n.ideo = k; n.ideoCd = S.day + 180; if (!(S.cheat.love && n.id === S.player)) for (const ci of n.cities) S.city[ci].stab = Math.max(5, S.city[ci].stab - 25); needRecalc = layerDirty = true; addLog(`${chip(n.id)}<b>${nm(n.id)}</b> change de régime : <b>${IDEO[k].n}</b>.`, 3, n.cap); return ''; }
function upRank(n, ci) { const cs = S.city[ci]; if (cs.o !== n.id || cs.rk >= 4 || C[ci].fl === 2) return 0; const c = rankCost(n, cs); if (n.money < c || n.mat < c / 4) return 0; n.money -= c; n.mat -= c / 4; cs.rk++; cs.pop *= 1.06; needRecalc = layerDirty = true; return 1; }
const rankCost = (n, cs) => 50 * (cs.rk + 1) * disc(n);
// ---------- score, historique ------------------------------------------------
function score(n) { let t = 0; for (const k in n.tech) t += n.tech[k]; return Math.round(n.pop * 2 + n.cities.length * 5 + n.str * .5 + n.inc * 10 + t * 15 + (n.tl || 1) * 40 + (n.xl || 1) * 20 - (n.debt || 0) * .05 + areaGain(n) / 20000); }
const areaGain = n => n.area0 != null ? n.area - n.area0 : 0;
function histSnap() { const n = P(); if (!n.alive) return; S.hist.push([S.day, +(n.pop / worldPop * 100).toFixed(2), n.cities.length, Math.round(n.str), score(n)]); if (S.hist.length > 240) S.hist = S.hist.filter((_, i) => i % 2 === 0); }
// ---------- IA économique ------------------------------------------------------
function aiEco(n, wars) {
  const mob = wars.length ? (wars.some(w => S.nat[w].str > n.str * .8) ? 2 : 1) : 0; if (mob !== n.mob) { n.mob = mob; needRecalc = true; }
  const use = Math.max(.3, n.fUse || 0);
  if (n.fuel < use * 12 && n.money > 20) marketBuy(n, 'fuel', Math.ceil(use * 25));
  if (n.foodInc < 0 && n.food < n.foodD * 8 && n.money > 30) marketBuy(n, 'food', Math.ceil(-n.foodInc * 30));
  if (n.comp < 2 && n.money > 40) marketBuy(n, 'comp', 3);
  if (n.short && n.money > 40) marketBuy(n, 'goods', Math.ceil(-n.goodsInc * 30) + 5);
  if (n.ammo < 2 && n.money > 60) marketBuy(n, 'ammo', 10);
  if (n.uraUse > 0 && n.ura < 1 && n.money > 60) marketBuy(n, 'ura', 2);
  if (n.money < 5 && wars.length && (n.debt || 0) < n.debtMax * .8) borrow(n); else if (n.debt > 0 && n.money > 150 + 30 * n.inc) repay(n);
  if (Math.random() < .12 && n.money > 60) { const ci = pick(n.cities); recruitCiv(n, ci, C[ci].t !== n.id ? 'adm' : pick(['cher', 'cher', 'ing', 'med', 'geo', 'agro', 'adm'])); }
}
function aiBuildPick(n) {
  if (n.eR < 1.03 && Math.random() < .8) { const k = n.ura > 8 && n.money > 300 ? 'pnu' : pick(['pth', 'pth', 'pre', 'phy']); n.eR += BLD[k].pw / Math.max(1, n.pwD); return k; }
  if (n.foodInc < 0 && Math.random() < .6) return 'farm';
  if (n.fuelInc < (n.fUse || 0) && n.fuel < (n.fUse || 0) * 60 && Math.random() < .25) return 'raf';
  if (n.stab < 55 && Math.random() < .4) return 'admin';
  if (n.ammoInc < .2 && Object.keys(n.war).length && Math.random() < .4) return 'ars';
  if (n.goodsInc < 0 && Math.random() < .5) return 'fac';
  return pick(['fac', 'fac', 'fac', 'mine', 'lab', 'fort', 'port', 'airb', 'rail', 'dca', 'silo', 'cyber', 'bank', 'univ', 'hosp', 'semi', 'farm', 'admin']);
}
// ---------- sauvegarde sur disque (dossier choisi par le joueur) -----------------
let saveDir = null, lastAuto = 0, saveInfo = '';
const fsOk = () => typeof window.showDirectoryPicker === 'function';
function idb() { return new Promise((ok, ko) => { const r = indexedDB.open('hegemonie', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); }); }
async function idbSet(k, v) { try { const d = await idb(); await new Promise((ok, ko) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = ok; t.onerror = () => ko(t.error); }); } catch (e) { } }
async function idbGet(k) { try { const d = await idb(); return await new Promise((ok, ko) => { const r = d.transaction('kv').objectStore('kv').get(k); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); }); } catch (e) { return null; } }
function dirLabel() { const e = $('dirlbl'); if (e) e.innerHTML = saveDir ? `Dossier de sauvegarde : <b>${esc(saveDir.name)}</b>${saveInfo ? ' · ' + saveInfo : ''}` : fsOk() ? 'Aucun dossier choisi : sauvegardes dans le navigateur seulement.' : 'Ce navigateur ne sait pas écrire dans un dossier (utilisez Chrome ou Edge) : sauvegardes dans le navigateur.'; }
async function pickSaveDir() {
  if (!fsOk()) { toast('Écriture sur disque indisponible dans ce navigateur : utilisez Chrome ou Edge'); return false; }
  try { const h = await window.showDirectoryPicker({ id: 'hegemonie', mode: 'readwrite' }); saveDir = h; await idbSet('dir', h); toast('Sauvegardes automatiques dans « ' + h.name + ' »'); if (S) writeSave('auto'); dirLabel(); return true; }
  catch (e) { if (e && e.name !== 'AbortError') toast('Accès au dossier refusé dans cette page : enregistrez hegemonie.html sur votre disque et ouvrez-le directement'); return false; }
}
async function restoreDir(askPerm) {
  if (!fsOk()) return false; const h = await idbGet('dir'); if (!h || !h.queryPermission) return false;
  try { let p = await h.queryPermission({ mode: 'readwrite' }); if (p !== 'granted' && askPerm) p = await h.requestPermission({ mode: 'readwrite' }); if (p === 'granted') { saveDir = h; dirLabel(); return true; } const e = $('dirlbl'); if (e && !saveDir) e.innerHTML = `Dossier mémorisé : <b>${esc(h.name)}</b> — cliquez « 📁 Dossier » pour réautoriser l’écriture.`; } catch (e) { }
  return false;
}
const safeName = s => s.normalize('NFD').replace(/[^\w-]+/g, '_').replace(/_+/g, '_');
async function writeSave(kind) {
  if (!saveDir || !S) return false;
  try {
    const names = kind === 'auto' ? ['hegemonie_auto.json', `hegemonie_auto_${safeName(nm(S.player))}_${Math.floor(calY())}.json`] : [`hegemonie_${safeName(nm(S.player))}_jour${S.day}.json`], js = JSON.stringify(S);
    for (const name of names) { const fh = await saveDir.getFileHandle(name, { create: true }), w = await fh.createWritable(); await w.write(js); await w.close(); }
    saveInfo = 'dernière écriture ' + new Date().toLocaleTimeString('fr-FR'); return true;
  } catch (e) { saveInfo = 'écriture refusée'; return false; }
}
function autoSave() { try { localStorage.setItem(SAVEK, JSON.stringify(S)); } catch (e) { } if (saveDir && performance.now() - lastAuto > 15000) { lastAuto = performance.now(); writeSave('auto'); } }
async function listDirSaves() { const out = []; for await (const [name, h] of saveDir.entries()) if (h.kind === 'file' && /^hegemonie.*\.json$/i.test(name)) { const f = await h.getFile(); out.push({ name, h, t: f.lastModified, size: f.size }); } return out.sort((a, b) => b.t - a.t); }
async function loadFromDir() {
  if (!saveDir && !(await restoreDir(true)) && !(await pickSaveDir())) return;
  let l; try { l = await listDirSaves(); } catch (e) { return toast('Lecture du dossier impossible'); }
  if (!l.length) return toast('Aucune sauvegarde Hégémonie dans « ' + saveDir.name + ' »');
  window._dirSaves = l;
  modal(`<h2>Sauvegardes — ${esc(saveDir.name)}</h2><table><tr><th>Fichier</th><th>Modifié</th><th>Taille</th></tr>${l.map((f, i) => `<tr class="clk" data-a="loadDirFile" data-v="${i}"><td>${esc(f.name)}</td><td>${new Date(f.t).toLocaleString('fr-FR')}</td><td>${(f.size / 1024 | 0)} Ko</td></tr>`).join('')}</table>` + closeBtn);
}
