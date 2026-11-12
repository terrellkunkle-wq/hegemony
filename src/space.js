// ====================================================================
//  HÉGÉMONIE — phase spatiale
// ====================================================================
let SP = null, battle = null;
const spUI = { mode: 'system', sys: 0, body: null, fleet: null, slot: null };
const scv = $('scv'), sx = scv.getContext('2d'); let sw = 0, sh = 0, spHits = [], spL = null;
const texCache = {}, bgStars = Array.from({ length: 420 }, () => [Math.random(), Math.random(), Math.random()]);
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function h2(x, y, s) { let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
function vn(x, y, s) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), a = h2(xi, yi, s), b = h2(xi + 1, yi, s), c = h2(xi, yi + 1, s), d = h2(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, y, s, o) { let a = .5, f = 1, r = 0; for (let i = 0; i < o; i++) { r += a * vn(x * f, y * f, s + i * 17); a *= .5; f *= 2; } return r / (1 - Math.pow(.5, o)); }
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// ---------- définitions ---------------------------------------------
const RES = { cr: ['Crédits', '💠'], metal: ['Métal', '⛓'], he3: ['Hélium-3', '⚛'], ice: ['Glace', '❄'], rare: ['Terres rares', '💎'], sci: ['Science', '🔬'] };
const DEPC = { metal: '#aab4c0', he3: '#4fe0e6', ice: '#cfeaff', rare: '#c77dff' };
const KIND = { lune: 'Lune rocheuse', tellurique: 'Planète tellurique', désert: 'Monde désertique', lave: 'Monde volcanique', voilée: 'Monde à atmosphère dense', gazeuse: 'Géante gazeuse', glace: 'Monde glacé', océan: 'Monde océanique', jungle: 'Monde-jungle', astéroïde: 'Planétoïde' };
const NSLOT = { lune: 8, tellurique: 10, désert: 10, lave: 8, voilée: 8, gazeuse: 4, glace: 6, océan: 12, jungle: 12, astéroïde: 5 };
const DEPS = { lune: ['he3', 'he3', 'metal', 'metal', 'ice'], tellurique: ['metal', 'metal', 'metal', 'rare', 'rare', 'ice'], désert: ['metal', 'metal', 'rare', 'rare', 'ice'], lave: ['metal', 'metal', 'metal', 'rare', 'rare', 'rare'], voilée: ['metal', 'metal', 'rare'], gazeuse: ['he3', 'he3', 'he3', 'he3'], glace: ['ice', 'ice', 'ice', 'rare'], océan: ['metal', 'metal', 'rare', 'ice', 'ice'], jungle: ['metal', 'metal', 'rare', 'rare', 'ice'], astéroïde: ['metal', 'metal', 'metal', 'rare', 'rare'] };
const SB = {
  mine: { n: 'Mine', c: { cr: 80, metal: 20 }, d: 'Extrait le gisement de la parcelle' },
  hab: { n: 'Habitat', c: { cr: 120, metal: 60 }, d: '+6 crédits/j par niveau' },
  lab: { n: 'Laboratoire', c: { cr: 150, metal: 50 }, d: '+1,5 science/j par niveau' },
  raf: { n: 'Raffinerie', c: { cr: 180, metal: 80 }, d: '+50 % de rendement des mines du monde', uniq: 1 },
  yard: { n: 'Chantier spatial', c: { cr: 300, metal: 200 }, d: 'Construit des vaisseaux', uniq: 1 },
  bar: { n: 'Caserne', c: { cr: 120, metal: 60 }, d: 'Forme des troupes au sol', uniq: 1 },
  def: { n: 'Batterie orbitale', c: { cr: 200, metal: 120 }, d: 'Défend l’orbite et la surface' }
};
const SH = {
  scout: { n: 'Éclaireur', c: { cr: 60, metal: 30 }, hp: 20, atk: 3, spd: 2 },
  colon: { n: 'Vaisseau colonial', c: { cr: 250, metal: 150 }, hp: 40, atk: 0, spd: 1 },
  trans: { n: 'Transport de troupes', c: { cr: 150, metal: 100 }, hp: 50, atk: 1, spd: 1, cap: 4 },
  corv: { n: 'Corvette', c: { cr: 120, metal: 80 }, hp: 60, atk: 12, spd: 1.6 },
  freg: { n: 'Frégate', c: { cr: 260, metal: 180, he3: 20 }, hp: 140, atk: 28, spd: 1.3 },
  crois: { n: 'Croiseur', c: { cr: 550, metal: 400, he3: 60 }, hp: 350, atk: 65, spd: 1.1 },
  cuir: { n: 'Cuirassé', c: { cr: 1200, metal: 900, he3: 150, rare: 60 }, hp: 900, atk: 160, spd: .9 },
  porte: { n: 'Porte-nefs', c: { cr: 1600, metal: 1100, he3: 200, rare: 120 }, hp: 700, atk: 220, spd: .9 }
};
const GU = { marine: { n: 'Infanterie orbitale', c: { cr: 50, metal: 10 }, p: 5 }, mecha: { n: 'Marcheur de combat', c: { cr: 140, metal: 80 }, p: 16 }, grav: { n: 'Char antigrav', c: { cr: 220, metal: 150, rare: 10 }, p: 30 } };
const STECH = {
  ion: { n: 'Propulsion ionique', d: 'Ouvre Mercure, Vénus et Mars · trajets plus rapides', max: 1, c: 150, req: () => SP.bodies.some(b => b.owner === 'P' && b.id !== SP.earth) || 'une première colonie (la Lune)' },
  fusion: { n: 'Propulsion à fusion', d: 'Ouvre la ceinture et les planètes externes', max: 1, c: 600, req: () => SP.tech.ion > 0 || 'la propulsion ionique' },
  warp: { n: 'Moteur de distorsion', d: 'Ouvre les voies interstellaires, puis +40 % de vitesse par niveau', max: 3, c: 1500, req: () => SP.tech.fusion > 0 || 'la propulsion à fusion' },
  laser: { n: 'Armement à énergie', d: '+15 % de dégâts par niveau', max: 5, c: 300 },
  shield: { n: 'Boucliers', d: '+15 % de résistance par niveau', max: 5, c: 300 },
  mining: { n: 'Extraction avancée', d: '+25 % de rendement des mines par niveau', max: 5, c: 250 },
  terra: { n: 'Terraformation', d: '+50 % de revenus des habitats par niveau', max: 3, c: 500 }
};
const stCost = (k, lv) => STECH[k].c * Math.pow(lv + 1, 1.5);
const STARN = ['Alpha Centauri', 'Sirius', 'Procyon', 'Epsilon Eridani', 'Tau Ceti', 'Véga', 'Altaïr', 'Barnard', 'Wolf 359', 'Lalande 21185', 'Ross 128', '61 Cygni', 'Fomalhaut', 'Arcturus', 'Capella', 'Pollux', 'Deneb', 'Rigel', 'Bételgeuse', 'Antarès', 'Aldébaran', 'Régulus', 'Spica', 'Canopus', 'Achernar', 'Mizar', 'Polaris', 'Castor', 'Algol', 'Mira', 'Kepler-442', 'TRAPPIST-1', 'Gliese 581', 'Gliese 667', 'HD 40307', 'Kapteyn', 'Luyten', 'Teegarden', 'Groombridge 34', 'Lacaille 9352', 'Struve 2398', 'YZ Ceti', 'Van Maanen', 'Tabit', 'Zaniah', 'Alnitak', 'Mintaka', 'Sadr', 'Shaula', 'Naos'];
const STARS = { O: '#9db4ff', B: '#aabfff', A: '#e4e8ff', F: '#fff4e8', G: '#ffe9a8', K: '#ffc47a', M: '#ff8a5c' };
const MORPH = ['insectoïdes à carapace chitineuse', 'céphalopodes amphibies', 'cristallins à base de silicates', 'aviens aux plumes iridescentes', 'reptiliens à sang froid', 'fongoïdes reliés en réseau mycélien', 'êtres gazeux à membrane ionique', 'arboricoles à six membres', 'machines autoréplicantes', 'colonies symbiotiques', 'cnidaires flottants', 'lithovores fouisseurs'];
const GOV = ['Hégémonie', 'Conclave', 'République', 'Essaim', 'Théocratie', 'Ligue marchande', 'Technocratie', 'Empire', 'Collectif', 'Directoire', 'Matriarcat', 'Synode'];
const ETHOS = [['belliqueux', .95, 'La guerre y est un rite de passage ; aucun traité ne survit longtemps à une occasion de conquête.'], ['marchand', .2, 'Tout s’y négocie, y compris la paix. Leurs caravanes stellaires relient des mondes que tout oppose.'], ['isolationniste', .35, 'Ils ne demandent qu’une chose à la galaxie : qu’elle reste à distance.'], ['mystique', .5, 'Leurs prêtres-navigateurs lisent l’avenir dans le rayonnement des pulsars.'], ['xénophile', .1, 'Chaque espèce nouvelle est pour eux un poème à traduire.'], ['expansionniste', .8, 'Un monde inhabité est à leurs yeux un monde gaspillé.'], ['érudit', .25, 'Leurs archives remontent à avant l’allumage de leur propre soleil.'], ['honorable', .55, 'Ils tiennent parole jusqu’à la mort — et attendent la même chose des autres.'], ['prédateur', .9, 'Ils classent les espèces en deux catégories : proies et rivaux.'], ['contemplatif', .15, 'Ils peuvent débattre un siècle avant de déplacer une flotte.'], ['opportuniste', .65, 'Alliés des forts, créanciers des faibles.'], ['fanatique', .85, 'Leur dogme promet les étoiles aux seuls fidèles.']];
const CULT = ['Leur art majeur est la sculpture de champs magnétiques.', 'Ils communiquent par motifs lumineux et jugent la parole vulgaire.', 'Leurs cités sont taillées à l’intérieur d’astéroïdes creux.', 'Chaque individu porte le nom de l’étoile sous laquelle il est né.', 'Ils vénèrent le vide comme une divinité silencieuse.', 'Leur calendrier se compte en orbites de comètes.', 'La musique y tient lieu de droit : les procès sont chantés.', 'Ils élèvent des créatures stellaires géantes comme montures.', 'Leur mémoire est collective et se transmet par contact.', 'Ils ne construisent rien qui ne puisse durer dix mille ans.', 'Leurs vaisseaux sont cultivés plutôt qu’assemblés.', 'Ils considèrent les mathématiques comme une langue sacrée.'];
const SYL = ['ka', 'zor', 'vel', 'thu', 'ny', 'xa', 'qir', 'el', 'om', 'ush', 'dra', 'ix', 'ae', 'gho', 'ru', 'sai', 'mek', 'ylo', 'phe', 'tan', 'ob', 'ri', 'vuu', 'ze'];

// ---------- génération ----------------------------------------------
const bd = id => SP.bodies[id];
const ocol = o => o === 'P' ? '#ffd24a' : o == null ? '#778' : SP.races[o].color;
const oname = o => o === 'P' ? 'Humanité' : o == null ? '—' : SP.races[o].name;
function genSlots(kind, rnd) { const n = NSLOT[kind], d = DEPS[kind].slice(), s = []; for (let i = 0; i < n; i++) s.push({ dep: null, b: null, lv: 0 }); for (const x of d) { for (let k = 0; k < 6; k++) { const i = rnd() * n | 0; if (!s[i].dep) { s[i].dep = x; break; } } } return s; }
function addBody(sys, o, rnd) { const b = Object.assign({ id: SP.bodies.length, sys, parent: null, tier: 0, owner: null, tr: {}, gar: 0, ph: rnd() * 6.283, seed: rnd() * 1e9 | 0, desc: '' }, o); b.per = b.parent == null ? 80 * Math.pow(b.orb, 1.5) : 14 * b.orb + 8; b.slots = genSlots(b.kind, rnd); SP.bodies.push(b); SP.systems[sys].b.push(b.id); return b; }
function initSpace() {
  const seed = Math.random() * 1e9 | 0, rnd = mulberry(seed), sp = P().tech.space;
  SP = S.space = { seed, day: 0, res: { cr: 600 + 300 * sp, metal: 250, he3: 0, ice: 0, rare: 0, sci: 100 * sp }, tech: { ion: 0, fusion: 0, warp: 0, laser: 0, shield: 0, mining: 0, terra: 0 }, research: null, systems: [], bodies: [], fleets: [], races: [], lanes: [], fid: 1, log: [], cheat: {}, won: false, earth: 2 };
  SP.systems.push({ id: 0, name: 'Sol', x: 120, y: 330, st: 'G', b: [], ln: [], seen: true, cap: 2 });
  const m = (name, kind, orb, size, c1, c2, tier, desc, parent, ring) => addBody(0, { name, kind, orb, size, c1, c2, tier, desc, parent: parent == null ? null : parent, ring: !!ring }, rnd);
  m('Mercure', 'lune', 1, 5, [150, 140, 130], [0, 0, 0], 1, 'Un monde criblé de cratères, brûlé côté jour, glacé côté nuit. Riche en métaux lourds.');
  m('Vénus', 'voilée', 2, 8, [214, 180, 110], [245, 225, 170], 1, 'Sous les nuages d’acide, une fournaise. Les colonies y flottent à cinquante kilomètres d’altitude.');
  const e = m('Terre', 'océan', 3, 9, [30, 90, 170], [60, 130, 70], 0, 'Le berceau, désormais unifié. Tout part d’ici.'); SP.earth = e.id;
  m('Lune', 'lune', 1, 4, [175, 175, 180], [0, 0, 0], 0, 'Régolithe gorgé d’hélium-3, glace dans les cratères polaires : la première marche.', e.id);
  m('Mars', 'désert', 4, 7, [190, 90, 50], [120, 60, 40], 1, 'Canyons, calottes de glace et poussière rouge. Le premier vrai second foyer.');
  m('Cérès', 'astéroïde', 5, 4, [130, 125, 120], [0, 0, 0], 2, 'La porte de la ceinture d’astéroïdes et de ses filons.');
  const j = m('Jupiter', 'gazeuse', 6, 16, [200, 160, 120], [235, 215, 185], 2, 'Un océan d’hydrogène et d’hélium. Les plateformes d’écopage y récoltent le carburant des étoiles.');
  m('Europe', 'glace', 1, 4, [200, 215, 230], [150, 130, 110], 2, 'Une banquise planétaire au-dessus d’un océan noir.', j.id);
  m('Ganymède', 'lune', 2, 5, [150, 140, 125], [0, 0, 0], 2, 'La plus grande lune du système, un monde à part entière.', j.id);
  const s = m('Saturne', 'gazeuse', 7, 14, [215, 190, 140], [240, 225, 185], 2, 'Ses anneaux sont une carrière de glace à ciel ouvert.', null, true);
  m('Titan', 'voilée', 1, 5, [200, 140, 60], [230, 180, 90], 2, 'Lacs de méthane sous un ciel orange.', s.id);
  m('Uranus', 'gazeuse', 8, 11, [150, 215, 225], [175, 230, 235], 2, 'Une géante de glace couchée sur son orbite.');
  const n = m('Neptune', 'gazeuse', 9, 11, [60, 100, 220], [90, 140, 240], 2, 'Vents supersoniques et bleu profond.');
  m('Triton', 'glace', 1, 4, [215, 205, 200], [170, 180, 200], 2, 'Geysers d’azote sur une lune capturée.', n.id);
  m('Pluton', 'glace', 10, 4, [205, 180, 150], [240, 235, 225], 2, 'Le dernier phare avant la nuit interstellaire.');
  e.owner = 'P'; e.tr = { marine: 10, mecha: 2 };
  const pre = [['yard', 1], ['bar', 1], ['lab', 1], ['hab', 2]]; let pi = 0;
  for (const sl of e.slots) { if (sl.dep === 'metal') { sl.b = 'mine'; sl.lv = 1; } else if (!sl.dep && pi < pre.length) { sl.b = pre[pi][0]; sl.lv = pre[pi][1]; pi++; } }
  for (const sl of e.slots) if (!sl.b && pi < pre.length) { sl.b = pre[pi][0]; sl.lv = pre[pi][1]; sl.dep = null; pi++; }
  // galaxie
  const names = STARN.slice(), ST = Object.keys(STARS);
  for (let k = 0, tries = 0; k < 50 && tries < 20000; tries++) {
    const x = 60 + rnd() * 900, y = 40 + rnd() * 560; if (SP.systems.some(o => Math.hypot(o.x - x, o.y - y) < 74)) continue;
    const id = SP.systems.length; SP.systems.push({ id, name: names[k] || 'HX-' + (100 + k), x, y, st: ST[Math.min(6, 2 + (rnd() * rnd() * 7 | 0)) % 7 | 0] || 'M', b: [], ln: [], seen: false, cap: null }); k++;
    const np = 2 + (rnd() * 5 | 0); let first = null;
    for (let o = 1; o <= np; o++) {
      const f = o / np, kind = f < .35 ? pick3(rnd, ['lave', 'désert', 'lune', 'voilée']) : f < .7 ? pick3(rnd, ['océan', 'jungle', 'tellurique', 'désert', 'tellurique']) : pick3(rnd, ['gazeuse', 'gazeuse', 'glace']);
      const pal = PAL[kind][rnd() * PAL[kind].length | 0];
      const b = addBody(id, { name: SP.systems[id].name + ' ' + ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][o - 1], kind, orb: o, size: kind === 'gazeuse' ? 11 + rnd() * 5 | 0 : 5 + rnd() * 4 | 0, c1: pal[0], c2: pal[1], tier: 3, ring: kind === 'gazeuse' && rnd() < .35 }, rnd);
      if (!first && kind !== 'gazeuse') first = b; if (kind === 'océan' || kind === 'jungle') first = first && (first.kind === 'océan' || first.kind === 'jungle') ? first : b;
      if (rnd() < .3) { const pm = PAL.lune[rnd() * PAL.lune.length | 0]; addBody(id, { name: b.name + 'a', kind: rnd() < .6 ? 'lune' : 'glace', orb: 1, size: 3 + (rnd() * 2 | 0), c1: pm[0], c2: pm[1] || [150, 160, 180], tier: 3, parent: b.id }, rnd); }
    }
    SP.systems[id].cap = (first || bd(SP.systems[id].b[0])).id;
  }
  const N = SP.systems.length, par = SP.systems.map((_, i) => i), find = a => par[a] === a ? a : par[a] = find(par[a]);
  const lane = (a, b) => { if (a === b || SP.systems[a].ln.includes(b)) return; SP.systems[a].ln.push(b); SP.systems[b].ln.push(a); SP.lanes.push([a, b]); par[find(a)] = find(b); };
  for (const a of SP.systems) { const c = SP.systems.filter(o => o !== a).map(o => [Math.hypot(o.x - a.x, o.y - a.y), o.id]).sort((p, q) => p[0] - q[0]); lane(a.id, c[0][1]); lane(a.id, c[1][1]); if (c[2][0] < 135) lane(a.id, c[2][1]); }
  for (;;) { let bdst = 1e9, ba = -1, bb = -1; for (const a of SP.systems) for (const b of SP.systems) if (find(a.id) !== find(b.id)) { const d = Math.hypot(a.x - b.x, a.y - b.y); if (d < bdst) { bdst = d; ba = a.id; bb = b.id; } } if (ba < 0) break; lane(ba, bb); }
  // civilisations
  const homes = []; const cand = SP.systems.filter(s => s.id && Math.hypot(s.x - 120, s.y - 330) > 230);
  for (let r = 0; r < 12 && cand.length; r++) {
    let best = null, bv = -1; for (const c of cand) { if (homes.includes(c)) continue; let d = Math.hypot(c.x - 120, c.y - 330) * .5; for (const h of homes) d = Math.min(d, Math.hypot(c.x - h.x, c.y - h.y)); if (d > bv) { bv = d; best = c; } } if (!best) break; homes.push(best);
    const et = ETHOS[r], nmr = cap1(SYL[rnd() * 24 | 0] + SYL[rnd() * 24 | 0] + (rnd() < .5 ? SYL[rnd() * 24 | 0] : ''));
    const far = Math.hypot(best.x - 120, best.y - 330) / 900;
    SP.races.push({ id: r, name: GOV[(r * 5 + (seed % 12)) % 12] + ' ' + nmr, people: nmr + (rnd() < .5 ? 'i' : 'ar'), color: `hsl(${(r * 30 + seed % 30) % 360},75%,60%)`, seed: rnd() * 1e9 | 0, morph: MORPH[(r * 7 + seed) % 12], ethos: et[0], aggr: et[1], desc: et[2] + ' ' + CULT[(r * 5 + seed % 7) % 12], home: best.id, att: Math.round(20 - et[1] * 50), status: 'inconnu', met: false, alive: true, res: 300, pow: .6 + far * 1.4, tl: Math.min(4, Math.round(far * 4)), warDay: 0 });
  }
  for (const rc of SP.races) {
    const h = SP.systems[rc.home], own = [h].concat(SP.systems.filter(s => s.id && s !== h && !homes.includes(s) && s.race == null && Math.hypot(s.x - 120, s.y - 330) > 200).map(s => [Math.hypot(s.x - h.x, s.y - h.y), s]).sort((a, b) => a[0] - b[0]).slice(0, 1 + (rnd() * 2 | 0)).filter(a => a[0] < 190).map(a => a[1]));
    for (const s of own) { s.race = rc.id; for (const id of s.b) { const b = bd(id); b.owner = rc.id; b.gar = Math.round((id === s.cap ? (s === h ? 260 : 120) : 30) * rc.pow); for (const sl of b.slots) if (rnd() < .5) { sl.b = sl.dep ? 'mine' : pick3(rnd, ['hab', 'hab', 'lab', 'def']); sl.lv = 1 + (rnd() * 2 | 0); } } const k = s === h ? 1 : .35; SP.fleets.push({ id: SP.fid++, o: rc.id, at: s.cap, sh: { corv: Math.round(6 * k * rc.pow), freg: Math.round(3 * k * rc.pow), crois: Math.round(1.5 * k * rc.pow), cuir: s === h && rc.pow > 1.2 ? 1 : 0 }, tr: {}, mv: null }); }
  }
  SP.fleets.push({ id: SP.fid++, o: 'P', at: e.id, sh: { scout: 1, colon: 1, corv: 2 }, tr: {}, mv: null });
  spLog('Le programme spatial unifié est lancé. Première étape : fonder une base sur la <b>Lune</b>.', 3);
  spLog('Sélectionnez la flotte en orbite terrestre, puis clic droit sur la Lune.', 0);
}
const PAL = { lave: [[[60, 40, 40], [140, 60, 30]], [[40, 35, 45], [110, 50, 60]]], désert: [[[200, 150, 90], [150, 100, 60]], [[190, 110, 70], [120, 70, 50]], [[210, 190, 140], [160, 130, 90]]], lune: [[[160, 160, 165]], [[140, 130, 120]], [[170, 150, 140]]], voilée: [[[200, 170, 110], [240, 220, 170]], [[150, 190, 160], [210, 230, 200]]], océan: [[[30, 90, 170], [60, 130, 70]], [[20, 110, 150], [120, 140, 70]], [[40, 70, 160], [150, 90, 110]]], jungle: [[[20, 80, 110], [40, 120, 50]], [[30, 60, 100], [90, 130, 40]]], tellurique: [[[150, 130, 110], [100, 90, 80]], [[130, 140, 120], [90, 100, 90]]], gazeuse: [[[200, 160, 120], [235, 215, 185]], [[120, 170, 220], [200, 220, 240]], [[190, 120, 160], [240, 200, 220]], [[150, 200, 150], [220, 235, 190]]], glace: [[[200, 215, 230], [150, 170, 200]], [[220, 225, 235], [170, 200, 210]]] };
function pick3(rnd, a) { return a[rnd() * a.length | 0]; }
const cap1 = s => s[0].toUpperCase() + s.slice(1);

// ---------- économie & règles ---------------------------------------
const can = c => Object.keys(c).every(k => SP.res[k] >= c[k]);
const pay = c => { if (!can(c)) return false; for (const k in c) SP.res[k] -= c[k]; return true; };
const mul = (c, m) => { const o = {}; for (const k in c) o[k] = c[k] * m; return o; };
const cstr = c => Object.keys(c).map(k => fmt(c[k]) + ' ' + RES[k][1]).join(' ');
const has = (b, k) => b.slots.some(s => s.b === k);
const lvl = (b, k) => b.slots.reduce((a, s) => a + (s.b === k ? s.lv : 0), 0);
function spProd() {
  const r = { cr: 0, metal: 0, he3: 0, ice: 0, rare: 0, sci: 0 };
  for (const b of SP.bodies) {
    if (b.owner !== 'P') continue; if (b.id === SP.earth) { r.cr += 40; r.metal += 4; r.sci += 2; }
    const rf = has(b, 'raf') ? 1.5 : 1;
    for (const s of b.slots) { if (s.b === 'mine' && s.dep) r[s.dep] += 1.5 * s.lv * (1 + .25 * SP.tech.mining) * rf; else if (s.b === 'hab') r.cr += 6 * s.lv * (1 + .5 * SP.tech.terra); else if (s.b === 'lab') r.sci += 1.5 * s.lv; }
  }
  for (const rc of SP.races) if (rc.alive && rc.status === 'commerce') r.cr += 15; else if (rc.alive && rc.status === 'alliance') r.cr += 25;
  return r;
}
function reachable(b) { if (b.sys !== 0) return SP.tech.warp > 0; return b.tier === 0 || (b.tier === 1 && SP.tech.ion > 0) || (b.tier === 2 && SP.tech.fusion > 0); }
const hostileSp = (a, b) => a !== b && a != null && b != null && ((a === 'P' && SP.races[b].status === 'guerre') || (b === 'P' && SP.races[a].status === 'guerre'));
const fcount = f => Object.values(f.sh).reduce((a, v) => a + v, 0);
const fpow = f => Object.keys(f.sh).reduce((a, k) => a + f.sh[k] * (SH[k].atk * 2 + SH[k].hp / 5), 0);
const fspd = f => { let s = 9; for (const k in f.sh) if (f.sh[k] > 0) s = Math.min(s, SH[k].spd); return s === 9 ? 1 : s; };
const tpow = tr => Object.keys(tr).reduce((a, k) => a + tr[k] * GU[k].p, 0);
const tcount = tr => Object.values(tr).reduce((a, v) => a + v, 0);
const eorb = b => b.parent != null ? bd(b.parent).orb + .25 : b.orb;
function sysPath(a, b) { const pr = { [a]: -1 }, q = [a]; while (q.length) { const u = q.shift(); if (u === b) break; for (const v of SP.systems[u].ln) if (!(v in pr)) { pr[v] = u; q.push(v); } } if (!(b in pr)) return null; const p = []; for (let v = b; v !== -1; v = pr[v]) p.push(v); return p.reverse(); }
function travel(f, to) {
  const A0 = bd(f.at), B0 = bd(to), sp = fspd(f); let Tt, path = null;
  if (A0.sys === B0.sys) Tt = Math.max(3, 12 * Math.abs(eorb(A0) - eorb(B0)) + (A0.parent != null || B0.parent != null ? 2 : 0)) / (sp * (f.o === 'P' ? 1 + .5 * SP.tech.ion + .5 * SP.tech.fusion : 1.6));
  else { path = sysPath(A0.sys, B0.sys); if (!path) return null; let d = 0; for (let i = 1; i < path.length; i++) d += Math.hypot(SP.systems[path[i]].x - SP.systems[path[i - 1]].x, SP.systems[path[i]].y - SP.systems[path[i - 1]].y); Tt = 6 + d / (6 * sp * (f.o === 'P' ? 1 + .4 * (SP.tech.warp - 1) : 1.3)); }
  if (f.o === 'P' && SP.cheat.fast) Tt = .5;
  return { T: Tt, path };
}
function moveFleet(f, to) {
  if (f.mv) return toast('Flotte déjà en transit'); if (f.at === to) return;
  const b = bd(to); if (f.o === 'P' && !reachable(b)) return toast(b.sys ? 'Le moteur de distorsion est requis pour quitter Sol' : 'Technologie de propulsion insuffisante pour atteindre ' + b.name);
  const t = travel(f, to); if (!t) return; f.mv = { from: f.at, to, t: 0, T: t.T, path: t.path }; return true;
}
function spLog(m, k) { SP.log.unshift({ d: SP.day, m, k: k || 0 }); if (SP.log.length > 50) SP.log.pop(); $('slog').innerHTML = SP.log.slice(0, 7).map(l => `<div class="k${l.k}"><span class="dim">J+${l.d}</span> ${l.m}</div>`).join(''); }
function meet(rc) {
  if (rc.met) return; rc.met = true; rc.status = 'neutre';
  ask('Premier contact', `<div style="display:flex;gap:14px"><canvas data-race="${rc.id}" width="150" height="170"></canvas><div><h2 style="color:${rc.color}">${rc.name}</h2><p>Peuple <b>${rc.people}</b> — ${rc.morph}. Tempérament <b>${rc.ethos}</b>.</p><p>${rc.desc}</p></div></div>`, [{ t: 'Établir le contact', f: () => { } }]);
  spLog(`Premier contact : <b style="color:${rc.color}">${rc.name}</b>`, 3);
}
function arrive(f) {
  const b = bd(f.at), sys = SP.systems[b.sys];
  if (f.o === 'P') { sys.seen = true; for (const id of sys.b) { const o = bd(id).owner; if (o != null && o !== 'P') meet(SP.races[o]); } }
  else if (b.owner === 'P') meet(SP.races[f.o]);
  const foes = SP.fleets.filter(g => g !== f && g.at === f.at && !g.mv && hostileSp(f.o, g.o) && fcount(g) > 0);
  const bh = hostileSp(f.o, b.owner);
  if (foes.length || (bh && lvl(b, 'def') > 0)) startBattle(f, foes, b);
  else if (bh) invade(f, b);
}
function captureBody(b, by) {
  const old = b.owner, sys = SP.systems[b.sys]; const list = sys.cap === b.id && old != null ? sys.b.map(bd).filter(x => x.owner === old) : [b];
  for (const x of list) { x.owner = by; x.tr = {}; x.gar = by === 'P' ? 0 : 60; }
  if (by === 'P') spLog(`🏴 <b>${b.name}</b> est conquis${list.length > 1 ? ` — tout le système ${sys.name} passe sous contrôle humain` : ''}.`, 2);
  else { spLog(`⚠ <b>${b.name}</b> tombe aux mains de ${oname(by)}.`, 1); if (b.id === SP.earth) ask('La Terre est tombée', `Les flottes de <b>${oname(by)}</b> occupent le berceau de l’humanité.`, [{ t: 'Poursuivre la lutte en exil', f: () => { } }, { t: 'Nouvelle partie', f: () => location.reload() }]); }
  if (old != null && old !== 'P') { const rc = SP.races[old]; if (!SP.bodies.some(x => x.owner === old)) { rc.alive = false; SP.fleets = SP.fleets.filter(g => g.o !== old); spLog(`☠ ${rc.name} n’existe plus.`, 3); } spWinCheck(); }
}
function spWinCheck() { if (SP.won) return; if (SP.races.every(r => !r.alive || r.status === 'alliance')) { SP.won = true; ask('Hégémonie galactique', 'Cinquante soleils, une seule bannière. De la Lune aux confins de la spirale, plus aucune puissance ne conteste l’humanité.<br><br>La partie peut continuer librement.', [{ t: 'Continuer', f: () => { } }]); } }
function bodyGar(b) { return b.owner === 'P' ? tpow(b.tr) + 30 * lvl(b, 'def') + (b.id === SP.earth ? 400 : 15) : b.gar * (1 + .15 * lvl(b, 'def')); }
function invade(f, b) {
  if (!hostileSp(f.o, b.owner)) return;
  if (f.o === 'P') {
    const tp = tpow(f.tr) * (1 + .1 * SP.tech.laser), g = bodyGar(b); if (tp <= 0) return spLog(`Orbite de <b>${b.name}</b> sécurisée, mais aucune troupe à débarquer (garnison ${fmt(g)}).`, 0);
    if (SP.cheat.god || tp * R(.8, 1.2) > g * R(.8, 1.2)) { const l = SP.cheat.god ? 0 : Math.min(.9, g / tp * .6); for (const k in f.tr) f.tr[k] = Math.round(f.tr[k] * (1 - l)); spLog(`Débarquement réussi sur <b>${b.name}</b> (pertes ${(l * 100 | 0)} %).`, 2); captureBody(b, 'P'); }
    else { f.tr = {}; b.gar = Math.max(10, b.gar - tp * .5); spLog(`Débarquement repoussé sur <b>${b.name}</b>. Garnison restante : ${fmt(b.gar)}.`, 1); }
  } else {
    const rc = SP.races[f.o], tp = fcount(f) * 15 * rc.pow, g = bodyGar(b);
    if (!SP.cheat.god && tp * R(.8, 1.2) > g * R(.8, 1.2)) captureBody(b, f.o); else { spLog(`L’assaut au sol de ${rc.name} sur <b>${b.name}</b> est repoussé.`, 2); for (const k in b.tr) b.tr[k] = Math.round(b.tr[k] * .7); }
  }
}

// ---------- batailles -----------------------------------------------
function mkSide(fleets, body, owner) {
  const st = {}, la = owner === 'P' ? SP.tech.laser : SP.races[owner].tl, shd = owner === 'P' ? SP.tech.shield : SP.races[owner].tl;
  for (const f of fleets) for (const k in f.sh) { if (f.sh[k] <= 0) continue; const s = st[k] || (st[k] = { k, n: 0, n0: 0, per: SH[k].hp * (1 + .15 * shd), atk: SH[k].atk * (1 + .15 * la), hp: 0, fx: 0 }); s.n += f.sh[k]; }
  if (body && body.owner === owner) { const l = lvl(body, 'def') + (owner !== 'P' && body.gar > 100 ? 1 : 0); if (l) st.def = { k: 'def', n: l * 2, per: 220, atk: 45 * (1 + .15 * la), hp: 0, fx: 0 }; }
  const a = Object.values(st); for (const s of a) { s.n0 = s.n; s.hp = s.n * s.per; } return { owner, fleets, st: a, inv: owner === 'P' && SP.cheat.god };
}
function bRound(bt) {
  const shots = [];
  for (const [me, en] of [[bt.A, bt.D], [bt.D, bt.A]]) { const al = en.st.filter(s => s.n > 0); if (!al.length) continue; for (const s of me.st) { if (s.n <= 0 || !s.atk) continue; const t = pick(al); shots.push([s, t, s.n * s.atk * R(.6, 1.2), en.inv]); } }
  for (const [s, t, d, inv] of shots) { if (inv) continue; t.hp = Math.max(0, t.hp - d); const n = Math.ceil(t.hp / t.per - 1e-9); if (n < t.n) t.fx = 1; t.n = n; }
  bt.rounds++; bt.shots = shots; bt.shotT = 1;
  const a = bt.A.st.some(s => s.n > 0 && s.k !== 'def'), d = bt.D.st.some(s => s.n > 0);
  if (!a || !d || bt.rounds >= 40) { bt.done = true; bt.win = a && !d ? 'A' : 'D'; }
}
function bApply(side) { for (const s of side.st) { if (s.k === 'def') continue; let left = s.n; for (const f of side.fleets) { const c = f.sh[s.k] || 0; const k = Math.min(c, left); f.sh[s.k] = k; left -= k; } } }
function startBattle(f, foes, b) {
  const att = SP.fleets.filter(g => g.at === f.at && !g.mv && g.o === f.o), dOwner = foes.length ? foes[0].o : b.owner;
  const bt = { A: mkSide(att, b, f.o), D: mkSide(foes, b, dOwner), body: b, rounds: 0, shots: [], shotT: 0, done: false, t: 0, f };
  const player = f.o === 'P' || dOwner === 'P';
  if (!bt.D.st.length) { bt.done = true; bt.win = 'A'; endBattle(bt); return; }
  if (!player) { while (!bt.done) bRound(bt); endBattle(bt); return; }
  battle = bt;
}
function endBattle(bt) {
  battle = null; bApply(bt.A); bApply(bt.D);
  SP.fleets = SP.fleets.filter(g => fcount(g) > 0 || g.o === 'P' && tcount(g.tr) > 0 && false);
  if (spUI.fleet != null && !SP.fleets.some(g => g.id === spUI.fleet)) spUI.fleet = null;
  const pA = bt.A.owner === 'P', pD = bt.D.owner === 'P';
  if (pA || pD) {
    const won = (bt.win === 'A') === pA;
    const rep = s => s.st.map(x => `${x.k === 'def' ? 'Batteries orbitales' : SH[x.k].n} : ${x.n}/${x.n0}`).join('<br>');
    spLog(`Bataille de <b>${bt.body.name}</b> : ${won ? 'victoire' : 'défaite'} contre ${oname(pA ? bt.D.owner : bt.A.owner)}.`, won ? 2 : 1);
    ask(won ? 'Victoire spatiale' : 'Défaite spatiale', `<b>Bataille de ${bt.body.name}</b> — ${bt.rounds} salves<br><br><table><tr><th style="color:${ocol(bt.A.owner)}">${oname(bt.A.owner)} (attaque)</th><th style="color:${ocol(bt.D.owner)}">${oname(bt.D.owner)} (défense)</th></tr><tr><td>${rep(bt.A)}</td><td>${rep(bt.D)}</td></tr></table>`, [{ t: 'Continuer', f: () => { if (bt.win === 'A' && SP.fleets.includes(bt.f)) invade(bt.f, bt.body); spSide(); } }]);
  } else if (bt.win === 'A' && SP.fleets.includes(bt.f)) invade(bt.f, bt.body);
}

// ---------- IA des civilisations ------------------------------------
function raceAI(rc) {
  const mine = SP.bodies.filter(b => b.owner === rc.id); if (!mine.length) return;
  rc.res += 22 * mine.length * rc.pow;
  let hs = SP.systems[rc.home]; if (bd(hs.cap).owner !== rc.id) { hs = SP.systems[mine[0].sys]; rc.home = hs.id; }
  const capB = bd(hs.cap).owner === rc.id ? hs.cap : mine[0].id;
  let hf = SP.fleets.find(f => f.o === rc.id && f.at === capB && !f.mv); if (!hf) { hf = { id: SP.fid++, o: rc.id, at: capB, sh: {}, tr: {}, mv: null }; SP.fleets.push(hf); }
  for (let i = 0; i < 4; i++) { const k = rc.res > 2600 && rc.tl >= 3 ? 'cuir' : rc.res > 1200 ? 'crois' : rc.res > 600 ? 'freg' : rc.res > 250 ? 'corv' : null; if (!k) break; rc.res -= SH[k].c.cr * 2; hf.sh[k] = (hf.sh[k] || 0) + 1; }
  if (Math.random() < .07) { const c = []; for (const s of SP.systems) if (s.id && (s.race === rc.id || SP.systems[rc.home].ln.includes(s.id))) for (const id of s.b) if (bd(id).owner == null) c.push(bd(id)); if (c.length) { const b = pick(c); b.owner = rc.id; b.gar = 40 * rc.pow; if (SP.systems[b.sys].race == null) SP.systems[b.sys].race = rc.id; } }
  if (!rc.met) return;
  if (rc.status === 'neutre') { rc.att += rc.aggr > .6 ? -1.5 : .4; if (rc.att < -40 && rc.aggr > .5) { rc.status = 'guerre'; rc.warDay = SP.day; spLog(`⚔ <b style="color:${rc.color}">${rc.name}</b> nous déclare la guerre !`, 1); } }
  else if (rc.status === 'commerce') rc.att = Math.min(100, rc.att + .5);
  if (rc.status === 'guerre' && fpow(hf) > 900 * rc.pow) {
    const tg = SP.bodies.filter(b => b.owner === 'P').map(b => [Math.hypot(SP.systems[b.sys].x - hs.x, SP.systems[b.sys].y - hs.y) + (b.id === SP.earth ? 150 : 0), b]).sort((a, b) => a[0] - b[0])[0];
    if (tg) { moveFleet(hf, tg[1].id); spLog(`Nos capteurs détectent une flotte ${rc.people} en route vers <b>${tg[1].name}</b>.`, 1); }
  }
  for (const f of SP.fleets) if (f.o === rc.id && !f.mv && f !== hf && bd(f.at).owner === 'P' && rc.status === 'guerre') arrive(f);
}

// ---------- tick -----------------------------------------------------
let spRate = null, spSideT = 0, spHover = false;
function spTick() {
  SP.day++; const r = spRate = spProd();
  for (const k in r) if (k !== 'sci') SP.res[k] += r[k];
  if (SP.research) { SP.research.p += r.sci; const k = SP.research.k; if (SP.research.p >= stCost(k, SP.tech[k])) { SP.tech[k]++; SP.research = null; spLog(`Recherche terminée : <b>${STECH[k].n}</b>${STECH[k].max > 1 ? ' niveau ' + SP.tech[k] : ''}`, 3); if (k === 'warp' && SP.tech.warp === 1) spLog('Les voies interstellaires sont ouvertes : 50 systèmes vous attendent. Ouvrez la vue <b>Galaxie</b>.', 3); } } else SP.res.sci += r.sci;
  for (const f of SP.fleets.slice()) { if (!f.mv) continue; f.mv.t++; if (f.mv.t >= f.mv.T) { f.at = f.mv.to; f.mv = null; arrive(f); if (battle) break; } }
  for (const rc of SP.races) if (rc.alive && (SP.day + rc.id * 2) % 20 === 0) raceAI(rc);
  if (SP.day % 400 === 0) save(true);
  spTop(); if (!spHover && SP.day - spSideT >= 3) spSide();
}

// ---------- textures -------------------------------------------------
function tex(b, size) {
  const key = b.id + '_' + size; if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'), im = x.createImageData(size, size), d = im.data, r = size / 2 - 1, s = b.seed, rnd = mulberry(s), k0 = b.kind, cr = [];
  if (k0 === 'lune' || k0 === 'astéroïde' || k0 === 'tellurique' || k0 === 'désert') for (let i = 0; i < (k0 === 'lune' || k0 === 'astéroïde' ? 40 : 10); i++) cr.push([rnd() * 3 - 1.5, rnd() * 2.6 - 1.3, .03 + rnd() * rnd() * .2]);
  const c1 = b.c1, c2 = b.c2 || c1;
  for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
    const nx = (px - size / 2) / r, ny = (py - size / 2) / r; let rr = 1;
    if (k0 === 'astéroïde') { const an = Math.atan2(ny, nx); rr = .7 + .3 * fbm(Math.cos(an) * 1.3 + 3, Math.sin(an) * 1.3 + 3, s, 3); }
    const d2 = (nx * nx + ny * ny) / (rr * rr); if (d2 > 1) continue;
    const nz = Math.sqrt(1 - d2), lon = Math.atan2(nx / rr, nz), lat = Math.asin(clamp(ny / rr, -1, 1)); let col, em = 0, kk = 1;
    for (const q of cr) { const dd = Math.hypot(lon - q[0], lat - q[1]); if (dd < q[2]) kk *= .72 + .25 * dd / q[2]; else if (dd < q[2] * 1.25) kk *= 1.18; }
    if (k0 === 'lune' || k0 === 'astéroïde') { const v = fbm(lon * 2.5 + 9, lat * 2.5, s, 5), m = fbm(lon * 1.2, lat * 1.2, s + 7, 3); let k = .5 + .75 * v; if (m < .45) k *= .68; col = [c1[0] * k, c1[1] * k, c1[2] * k]; }
    else if (k0 === 'tellurique' || k0 === 'désert') { const v = fbm(lon * 2, lat * 2, s, 5), w = fbm(lon * 5, lat * 5, s + 3, 3); col = mix(c1, c2, clamp((v - .3) * 2.2, 0, 1)); if (Math.abs(w - .5) < .018) kk *= .6; if (Math.abs(lat) > 1.22 + (v - .5) * .4) col = [235, 238, 245]; }
    else if (k0 === 'lave') { const v = fbm(lon * 3, lat * 3, s, 5); col = mix(c1, c2, v); if (Math.abs(v - .5) < .03) { col = [255, 150, 40]; em = .8; } }
    else if (k0 === 'voilée') { const v = fbm(lon * 1.5 + fbm(lon * 2, lat * 2, s, 3) * 2, lat * 4, s + 3, 4); col = mix(c1, c2, v); }
    else if (k0 === 'gazeuse') { const t = lat * 9 + fbm(lon * 1.5, lat * 3, s, 4) * 3.2, v = .5 + .5 * Math.sin(t), f = fbm(lon * 6, lat * 12, s + 5, 3); col = mix(c1, c2, clamp(v + (f - .5) * .5, 0, 1)); const sx0 = (lon - .4) / .3, sy0 = (lat - .32) / .13; if (s % 3 === 0 && sx0 * sx0 + sy0 * sy0 < 1) col = mix(col, [205, 95, 65], .75); }
    else if (k0 === 'glace') { const v = fbm(lon * 3, lat * 3, s, 5), w = fbm(lon * 6, lat * 6, s + 5, 3); col = mix(c1, c2, v); if (Math.abs(w - .5) < .02) kk *= .62; }
    else { const v = fbm(lon * 2 + 1, lat * 2, s, 5), land = v > (k0 === 'jungle' ? .44 : .54); col = land ? mix(c2, [150, 130, 90], clamp((v - .62) * 5, 0, 1)) : mix([8, 24, 80], c1, clamp(v * 1.7, 0, 1)); if (Math.abs(lat) > 1.25 + (v - .5) * .3) col = [240, 244, 250]; const cl = fbm(lon * 3 + 5, lat * 3.5 + 5, s + 11, 4); if (cl > .56) col = mix(col, [255, 255, 255], clamp((cl - .56) * 6, 0, .9)); }
    const L = clamp(-.5 * nx - .35 * ny + .8 * nz, 0, 1); let sh0 = (.05 + .95 * Math.pow(L, .85)) * kk; sh0 = sh0 * (1 - em) + em;
    let rC = col[0] * sh0, gC = col[1] * sh0, bC = col[2] * sh0;
    if (k0 === 'océan' || k0 === 'jungle' || k0 === 'voilée' || k0 === 'gazeuse') { const rim = Math.pow(1 - nz, 3) * L * 90; rC += rim * .5; gC += rim * .7; bC += rim; }
    const i = (py * size + px) * 4; d[i] = rC; d[i + 1] = gC; d[i + 2] = bC; d[i + 3] = clamp((1 - Math.sqrt(d2)) * r * rr * 1.2, 0, 1) * 255;
  }
  x.putImageData(im, 0, 0); return texCache[key] = c;
}
function drawRing(c, x, y, r, front) { c.save(); c.translate(x, y); c.rotate(-.35); c.scale(1, .3); c.lineWidth = r * .22; c.strokeStyle = 'rgba(220,200,160,.5)'; c.beginPath(); c.arc(0, 0, r * 1.75, front ? 0 : Math.PI, front ? Math.PI : 2 * Math.PI); c.stroke(); c.lineWidth = r * .1; c.strokeStyle = 'rgba(180,165,140,.45)'; c.beginPath(); c.arc(0, 0, r * 2.05, front ? 0 : Math.PI, front ? Math.PI : 2 * Math.PI); c.stroke(); c.restore(); }
function drawBody(c, b, x, y, r, big) { if (b.ring) drawRing(c, x, y, r, false); const t = tex(b, big ? 320 : 64); c.drawImage(t, x - r, y - r, r * 2, r * 2); if (b.ring) drawRing(c, x, y, r, true); }
const SHAPE = {
  scout: [[9, 0], [-5, 3], [-3, 0], [-5, -3]], colon: [[10, 0], [6, 4], [-8, 5], [-10, 2], [-10, -2], [-8, -5], [6, -4]], trans: [[9, 2], [9, -2], [5, -5], [-9, -5], [-9, 5], [5, 5]],
  corv: [[12, 0], [-2, 4], [-8, 6], [-6, 0], [-8, -6], [-2, -4]], freg: [[15, 0], [4, 3], [0, 7], [-10, 6], [-8, 0], [-10, -6], [0, -7], [4, -3]],
  crois: [[20, 0], [10, 4], [-2, 5], [-6, 9], [-14, 8], [-12, 0], [-14, -8], [-6, -9], [-2, -5], [10, -4]], cuir: [[24, 2], [24, -2], [14, -7], [-4, -8], [-10, -12], [-20, -11], [-18, 0], [-20, 11], [-10, 12], [-4, 8], [14, 7]],
  porte: [[26, 4], [26, -4], [-8, -7], [-14, -13], [-24, -13], [-22, 0], [-24, 13], [-14, 13], [-8, 7]], def: [[6, 0], [0, 6], [-6, 0], [0, -6]]
};
function drawShip(c, k, x, y, sc, dir, col) {
  const p = SHAPE[k]; c.save(); c.translate(x, y); c.scale(sc * dir, sc);
  c.fillStyle = 'rgba(120,200,255,.8)'; if (k !== 'def') { c.beginPath(); c.ellipse(p[p.length >> 1][0] - 2, 0, 4 + Math.random() * 2, 1.6, 0, 0, 6.3); c.fill(); }
  c.beginPath(); p.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.fillStyle = '#9aa7b6'; c.fill(); c.strokeStyle = '#1a222c'; c.lineWidth = .8; c.stroke();
  c.fillStyle = col; c.fillRect(p[0][0] * .1 - 3, -1.2, Math.abs(p[0][0]) * .6, 2.4);
  if (k === 'def') { c.fillStyle = '#39f'; c.fillRect(-14, -2, 7, 4); c.fillRect(7, -2, 7, 4); }
  if (k === 'colon') { c.strokeStyle = col; c.lineWidth = 1.2; c.beginPath(); c.ellipse(-1, 0, 2.5, 7.5, 0, 0, 6.3); c.stroke(); }
  c.restore();
}
function portrait(cvs, rc) {
  const c = cvs.getContext('2d'), w = cvs.width, h = cvs.height, rnd = mulberry(rc.seed), hue = rnd() * 360 | 0, g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, `hsl(${(hue + 180) % 360},40%,12%)`); g.addColorStop(1, '#05070c'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h * .46, hw = w * (.2 + rnd() * .14), hh = h * (.2 + rnd() * .14), skin = `hsl(${hue},${35 + rnd() * 40}%,${35 + rnd() * 20}%)`, dark = `hsl(${hue},40%,18%)`;
  c.fillStyle = dark; c.beginPath(); c.moveTo(cx - hw * 1.5, h); c.quadraticCurveTo(cx, cy + hh * .6, cx + hw * 1.5, h); c.fill();
  const ap = rnd() * 4 | 0, na = 2 + (rnd() * 4 | 0); c.strokeStyle = skin; c.lineWidth = 3; c.lineCap = 'round';
  for (let i = 0; i < na; i++) { const t = (i / (na - 1) - .5) * 2; c.beginPath(); if (ap === 0) { c.moveTo(cx + t * hw * .6, cy - hh * .8); c.quadraticCurveTo(cx + t * hw * 1.4, cy - hh * 1.6, cx + t * hw * 1.8, cy - hh * (1.5 + rnd() * .5)); c.stroke(); } else if (ap === 1) { c.moveTo(cx + t * hw * .7, cy + hh * .7); c.bezierCurveTo(cx + t * hw, cy + hh * 1.5, cx + t * hw * 1.6, cy + hh * 1.4, cx + t * hw * 1.3, cy + hh * 2.1); c.stroke(); } else if (ap === 2) { c.fillStyle = skin; c.moveTo(cx + t * hw * .8, cy - hh * .7); c.lineTo(cx + t * hw * .9 - 5, cy - hh * (1.5 + rnd() * .4)); c.lineTo(cx + t * hw * .8 + 9, cy - hh * .8); c.fill(); } }
  c.fillStyle = skin; c.beginPath(); if (rnd() < .5) c.ellipse(cx, cy, hw, hh, 0, 0, 6.3); else { c.moveTo(cx, cy - hh * 1.1); c.quadraticCurveTo(cx + hw * 1.3, cy - hh * .6, cx + hw * .7, cy + hh * .5); c.quadraticCurveTo(cx, cy + hh * 1.4, cx - hw * .7, cy + hh * .5); c.quadraticCurveTo(cx - hw * 1.3, cy - hh * .6, cx, cy - hh * 1.1); } c.fill();
  const sg0 = c.createRadialGradient(cx - hw * .4, cy - hh * .5, 2, cx, cy, hw * 1.4); sg0.addColorStop(0, 'rgba(255,255,255,.22)'); sg0.addColorStop(1, 'rgba(0,0,0,.35)'); c.fillStyle = sg0; c.fill();
  const ne = 1 + (rnd() * 5 | 0), ec = `hsl(${(hue + 120 + rnd() * 120) % 360},90%,65%)`, er = hw * (ne > 3 ? .11 : .17);
  for (let i = 0; i < ne; i++) { const t = ne === 1 ? 0 : (i / (ne - 1) - .5) * 2, ex = cx + t * hw * .6, ey = cy - hh * .15 - Math.abs(t) * hh * -.12 - (ne > 2 ? (1 - Math.abs(t)) * hh * .25 : 0); c.fillStyle = '#000'; c.beginPath(); c.ellipse(ex, ey, er * 1.3, er, 0, 0, 6.3); c.fill(); c.fillStyle = ec; c.shadowColor = ec; c.shadowBlur = 8; c.beginPath(); c.arc(ex, ey, er * .55, 0, 6.3); c.fill(); c.shadowBlur = 0; }
  c.strokeStyle = dark; c.lineWidth = 2; c.beginPath(); if (rnd() < .5) { c.moveTo(cx - hw * .3, cy + hh * .5); c.quadraticCurveTo(cx, cy + hh * (.5 + rnd() * .2), cx + hw * .3, cy + hh * .5); } else { c.moveTo(cx - hw * .15, cy + hh * .4); c.lineTo(cx - hw * .3, cy + hh * .75); c.moveTo(cx + hw * .15, cy + hh * .4); c.lineTo(cx + hw * .3, cy + hh * .75); } c.stroke();
  c.strokeStyle = rc.color; c.lineWidth = 2; c.strokeRect(1, 1, w - 2, h - 2);
}
function paintPortraits() { document.querySelectorAll('canvas[data-race]').forEach(c => { if (!c._p) { c._p = 1; portrait(c, SP.races[+c.dataset.race]); } }); }

// ---------- rendu ----------------------------------------------------
function spResize() { sw = scv.clientWidth; sh = scv.clientHeight; scv.width = Math.round(sw * dpr); scv.height = Math.round(sh * dpr); }
function layout(sid) { const top = SP.systems[sid].b.map(bd).filter(b => b.parent == null), mo = Math.max(...top.map(b => b.orb)), ax = 300 + (sw - 300) / 2, ay = 38 + (sh - 38) / 2, Rm = Math.min((sw - 300) / 2 - 50, ((sh - 38) / 2 - 30) / .55); return { ax, ay, step: (Rm - 40) / mo, sid }; }
function bpos(b, L, dayf) { if (b.parent != null) { const pb = bd(b.parent), p = bpos(pb, L, dayf), a = b.ph + dayf * 6.283 / b.per, r = pb.size + 9 + b.orb * 9; return [p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r * .6]; } const a = b.ph + dayf * 6.283 / b.per, r = 40 + b.orb * L.step; return [L.ax + Math.cos(a) * r, L.ay + Math.sin(a) * r * .55]; }
function stars(c) { c.fillStyle = '#02030a'; c.fillRect(0, 0, sw, sh); for (const s of bgStars) { c.fillStyle = `rgba(255,255,255,${.25 + s[2] * .6})`; c.fillRect(s[0] * sw, s[1] * sh, s[2] > .9 ? 2 : 1, s[2] > .9 ? 2 : 1); } }
function spDraw(ts) {
  const c = sx; c.setTransform(dpr, 0, 0, dpr, 0, 0); stars(c); spHits = [];
  const dayf = SP.day + (S.speed && !modalOpen && !battle ? Math.min(1, acc) : 0);
  if (battle) return drawBattle(c, ts);
  if (spUI.mode === 'galaxy') drawGalaxy(c, dayf); else if (spUI.mode === 'body' && spUI.body != null) drawBodyView(c, ts, dayf); else drawSystem(c, dayf, ts);
}
function fleetIcon(c, f, x, y) { const col = ocol(f.o), selx = f.id === spUI.fleet; c.fillStyle = col; c.strokeStyle = selx ? '#fff' : '#000'; c.lineWidth = selx ? 2 : 1; c.beginPath(); c.moveTo(x + 7, y); c.lineTo(x - 5, y - 5); c.lineTo(x - 2, y); c.lineTo(x - 5, y + 5); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.font = '10px system-ui'; c.textAlign = 'left'; c.fillText(fcount(f), x + 9, y + 3); spHits.push({ t: 'f', id: f.id, x, y, r: 10 }); }
function drawSystem(c, dayf) {
  const sys = SP.systems[spUI.sys], L = spL = layout(sys.id), col = STARS[sys.st];
  let g = c.createRadialGradient(L.ax, L.ay, 2, L.ax, L.ay, 70); g.addColorStop(0, '#fff'); g.addColorStop(.15, col); g.addColorStop(.4, col + '55'); g.addColorStop(1, 'transparent'); c.fillStyle = g; c.beginPath(); c.arc(L.ax, L.ay, 70, 0, 6.3); c.fill();
  c.strokeStyle = 'rgba(140,170,210,.14)'; c.lineWidth = 1;
  const bodies = sys.b.map(bd); for (const b of bodies) if (b.parent == null) { c.beginPath(); c.ellipse(L.ax, L.ay, 40 + b.orb * L.step, (40 + b.orb * L.step) * .55, 0, 0, 6.3); c.stroke(); }
  if (sys.id === 0) { c.fillStyle = 'rgba(170,160,150,.5)'; const r = 40 + 5 * L.step; for (let i = 0; i < 160; i++) { const a = i * 2.399 + dayf * .002, rr = r + Math.sin(i * 12.9) * L.step * .28; c.fillRect(L.ax + Math.cos(a) * rr, L.ay + Math.sin(a) * rr * .55, 1.2, 1.2); } }
  const pos = {}; for (const b of bodies) pos[b.id] = bpos(b, L, dayf);
  const at = {};
  c.textAlign = 'center';
  for (const b of bodies.slice().sort((a, b2) => pos[a.id][1] - pos[b2.id][1])) {
    const [x, y] = pos[b.id];
    if (b.owner != null) { c.strokeStyle = ocol(b.owner); c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, b.size + 4, 0, 6.3); c.stroke(); }
    if (b.id === spUI.body) { c.strokeStyle = '#fff'; c.setLineDash([3, 3]); c.beginPath(); c.arc(x, y, b.size + 8, 0, 6.3); c.stroke(); c.setLineDash([]); }
    drawBody(c, b, x, y, b.size, false);
    c.font = '11px system-ui'; c.fillStyle = reachable(b) || b.owner === 'P' ? '#cfd8e3' : '#5d6876'; c.fillText(b.name, x, y + b.size + 14);
    spHits.push({ t: 'b', id: b.id, x, y, r: b.size + 6 });
  }
  for (const f of SP.fleets) {
    if (f.mv) { const a = pos[f.mv.from], b = pos[f.mv.to]; if (a && b && !f.mv.path) { const k = Math.min(1, (f.mv.t + (dayf - SP.day)) / f.mv.T), x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k; c.strokeStyle = ocol(f.o) + '66'; c.setLineDash([2, 4]); c.beginPath(); c.moveTo(x, y); c.lineTo(b[0], b[1]); c.stroke(); c.setLineDash([]); fleetIcon(c, f, x, y); } else if (a && f.mv.path && f.mv.t < 3) fleetIcon(c, f, a[0], a[1] - 20 - f.mv.t * 8); continue; }
    const p = pos[f.at]; if (!p) continue; const k = at[f.at] = (at[f.at] || 0) + 1; fleetIcon(c, f, p[0] + bd(f.at).size + 12, p[1] - 16 - (k - 1) * 13);
  }
  c.textAlign = 'left'; c.font = '600 20px system-ui'; c.fillStyle = '#e8eef5'; c.fillText(sys.id ? 'Système ' + sys.name : 'Système solaire', 316, 68); c.font = '12px system-ui'; c.fillStyle = '#8191a2'; c.fillText(`Étoile de type ${sys.st} · ${sys.b.length} corps` + (sys.race != null && SP.races[sys.race].met ? ' · ' + SP.races[sys.race].name : ''), 316, 86);
}
function drawGalaxy(c) {
  const ox = 300, oy = 38, kx = (sw - 300) / 1000, ky = (sh - 38) / 640, k = Math.min(kx, ky), gx = s => ox + ((sw - 300) - 1000 * k) / 2 + s.x * k, gy = s => oy + ((sh - 38) - 640 * k) / 2 + s.y * k;
  const g = c.createRadialGradient(gx({ x: 520 }), gy({ y: 320 }), 10, gx({ x: 520 }), gy({ y: 320 }), 520 * k); g.addColorStop(0, 'rgba(120,90,200,.16)'); g.addColorStop(.6, 'rgba(40,70,160,.07)'); g.addColorStop(1, 'transparent'); c.fillStyle = g; c.fillRect(0, 0, sw, sh);
  c.strokeStyle = 'rgba(130,160,210,.22)'; c.lineWidth = 1; c.beginPath(); for (const [a, b] of SP.lanes) { c.moveTo(gx(SP.systems[a]), gy(SP.systems[a])); c.lineTo(gx(SP.systems[b]), gy(SP.systems[b])); } c.stroke();
  c.textAlign = 'center';
  for (const s of SP.systems) {
    const x = gx(s), y = gy(s), col = STARS[s.st]; const rg = c.createRadialGradient(x, y, 1, x, y, 14); rg.addColorStop(0, '#fff'); rg.addColorStop(.3, col); rg.addColorStop(1, 'transparent'); c.fillStyle = rg; c.beginPath(); c.arc(x, y, 14, 0, 6.3); c.fill();
    const own = bd(s.cap).owner; const show = own === 'P' || (own != null && SP.races[own].met);
    if (show) { c.strokeStyle = ocol(own); c.lineWidth = 2; c.beginPath(); c.arc(x, y, 11, 0, 6.3); c.stroke(); }
    else if (s.b.some(id => bd(id).owner === 'P')) { c.strokeStyle = '#ffd24a88'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, 11, 0, 6.3); c.stroke(); }
    if (s.id === spUI.sys) { c.strokeStyle = '#fff'; c.setLineDash([3, 3]); c.lineWidth = 1; c.beginPath(); c.arc(x, y, 16, 0, 6.3); c.stroke(); c.setLineDash([]); }
    c.font = '11px system-ui'; c.fillStyle = s.seen ? '#dde5ee' : '#7b8796'; c.fillText(s.name, x, y + 26);
    spHits.push({ t: 's', id: s.id, x, y, r: 16 });
  }
  const cnt = {};
  for (const f of SP.fleets) {
    if (f.o !== 'P' && !SP.races[f.o].met) continue;
    let x, y;
    if (f.mv && f.mv.path) { const p = f.mv.path, fr = Math.min(.999, f.mv.t / f.mv.T) * (p.length - 1), i = fr | 0, a = SP.systems[p[i]], b = SP.systems[p[i + 1]], u = fr - i; x = gx(a) + (gx(b) - gx(a)) * u; y = gy(a) + (gy(b) - gy(a)) * u; }
    else { const s = SP.systems[bd(f.at).sys]; if (f.o !== 'P' && !s.seen && !SP.cheat.reveal) continue; const n = cnt[s.id] = (cnt[s.id] || 0) + 1; x = gx(s) + 18; y = gy(s) - 14 + (n - 1) * 12; }
    fleetIcon(c, f, x, y);
  }
  c.textAlign = 'left'; c.font = '600 20px system-ui'; c.fillStyle = '#e8eef5'; c.fillText('Carte galactique', 316, 68); c.font = '12px system-ui'; c.fillStyle = '#8191a2'; c.fillText(SP.tech.warp ? 'Clic : sélectionner un système · double-clic : y entrer · clic droit : envoyer la flotte' : 'Le moteur de distorsion est nécessaire pour quitter Sol', 316, 86);
}
function drawBuilding(c, k, lv, x, y, ts, col) {
  c.save(); c.translate(x, y); c.lineWidth = 1; c.strokeStyle = '#0b0f14';
  const box = (a, b, w, h, f) => { c.fillStyle = f; c.fillRect(a, b, w, h); c.strokeRect(a + .5, b + .5, w - 1, h - 1); };
  if (k === 'mine') { box(-16, -10, 14, 10, '#6b7684'); c.strokeStyle = '#c9d1da'; c.lineWidth = 2; c.beginPath(); c.moveTo(6, 0); c.lineTo(10, -26); c.lineTo(14, 0); c.moveTo(7, -10); c.lineTo(13, -10); c.moveTo(8, -18); c.lineTo(12, -18); c.stroke(); const d = (ts / 150 + x) % 8; c.strokeStyle = col; c.beginPath(); c.moveTo(10, -24 + d); c.lineTo(10, -2); c.stroke(); c.fillStyle = col; c.fillRect(-24, -4, 6, 4); c.fillRect(-21, -7, 5, 3); }
  else if (k === 'hab') { c.fillStyle = 'rgba(140,210,255,.35)'; c.beginPath(); c.arc(0, 0, 17, Math.PI, 0); c.fill(); c.strokeStyle = '#bfe6ff'; c.stroke(); box(-6, -9, 5, 9, '#dfe6ee'); box(1, -13, 6, 13, '#c7d0da'); c.fillStyle = '#4c6'; c.fillRect(-13, -3, 5, 3); }
  else if (k === 'lab') { box(-14, -10, 28, 10, '#d5dbe3'); c.fillStyle = '#9fd'; c.beginPath(); c.arc(-4, -10, 7, Math.PI, 0); c.fill(); c.strokeStyle = '#e8eef5'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(9, -10); c.lineTo(9, -24); c.stroke(); c.fillStyle = (ts / 500 | 0) % 2 ? '#f44' : '#822'; c.beginPath(); c.arc(9, -25, 2, 0, 6.3); c.fill(); }
  else if (k === 'raf') { box(-16, -14, 9, 14, '#8a94a1'); box(-5, -18, 9, 18, '#a2acb8'); box(6, -11, 10, 11, '#7a8592'); c.fillStyle = `rgba(255,${150 + Math.sin(ts / 200) * 60 | 0},60,.9)`; c.beginPath(); c.arc(-.5, -21 - Math.sin(ts / 120) * 2, 3, 0, 6.3); c.fill(); }
  else if (k === 'yard') { box(-18, -6, 36, 6, '#59636f'); c.strokeStyle = '#d2dae3'; c.lineWidth = 2; c.beginPath(); c.moveTo(-14, -6); c.lineTo(-14, -26); c.lineTo(14, -26); c.lineTo(14, -6); c.stroke(); drawShip(c, 'corv', 0, -14, .9, 1, col); }
  else if (k === 'bar') { c.fillStyle = '#5d6a55'; c.beginPath(); c.moveTo(-17, 0); c.lineTo(-13, -11); c.lineTo(13, -11); c.lineTo(17, 0); c.fill(); c.stroke(); c.fillStyle = '#111'; c.fillRect(-4, -6, 8, 6); c.strokeStyle = col; c.lineWidth = 1.5; c.beginPath(); c.moveTo(11, -11); c.lineTo(11, -24); c.stroke(); c.fillStyle = col; c.fillRect(11, -24, 8, 5); }
  else if (k === 'def') { box(-9, -7, 18, 7, '#4f5964'); c.save(); c.translate(0, -8); c.rotate(-.7 + Math.sin(ts / 900 + x) * .35); c.fillStyle = '#c2cad3'; c.fillRect(0, -2, 20, 4); c.restore(); c.fillStyle = '#7d8793'; c.beginPath(); c.arc(0, -8, 6, 0, 6.3); c.fill(); c.stroke(); }
  c.fillStyle = '#fff'; c.font = '9px system-ui'; c.textAlign = 'center'; for (let i = 0; i < lv; i++) c.fillRect(-lv * 3 + i * 6 + 1, 5, 4, 2);
  c.restore();
}
function drawBodyView(c, ts, dayf) {
  const b = bd(spUI.body), ax = 300 + (sw - 300) / 2, R0 = Math.min(170, (sh - 300) / 2), ay = 60 + R0 + 20, col = ocol(b.owner);
  const here = SP.fleets.filter(f => f.at === b.id && !f.mv), orb = [];
  let i = 0; for (const f of here) for (const k in f.sh) for (let n = 0; n < Math.min(f.sh[k], 5); n++) { const a = ts / 4000 + i * .55; orb.push({ k, a, f, r: R0 * 1.45 + (i % 3) * 14 }); i++; }
  if (has(b, 'yard')) orb.push({ k: 'yard', a: ts / 9000, r: R0 * 1.25 }); for (let n = 0; n < Math.min(4, lvl(b, 'def')); n++) orb.push({ k: 'def', a: ts / 6000 + n * 1.6 + 2, r: R0 * 1.18, f: { o: b.owner } });
  const dr = o => { const x = ax + Math.cos(o.a) * o.r, y = ay + Math.sin(o.a) * o.r * .28; if (o.k === 'yard') { c.strokeStyle = '#aeb9c6'; c.lineWidth = 3; c.beginPath(); c.ellipse(x, y, 16, 6, 0, 0, 6.3); c.stroke(); c.fillStyle = '#dfe6ee'; c.fillRect(x - 3, y - 3, 6, 6); } else drawShip(c, o.k, x, y, 1.1, Math.sin(o.a) > 0 ? -1 : 1, ocol(o.f.o)); };
  orb.filter(o => Math.sin(o.a) < 0).forEach(dr);
  const gl = c.createRadialGradient(ax, ay, R0 * .9, ax, ay, R0 * 1.25); gl.addColorStop(0, `rgba(${b.c1[0]},${b.c1[1]},${b.c1[2]},.25)`); gl.addColorStop(1, 'transparent'); c.fillStyle = gl; c.beginPath(); c.arc(ax, ay, R0 * 1.25, 0, 6.3); c.fill();
  drawBody(c, b, ax, ay, R0, true);
  orb.filter(o => Math.sin(o.a) >= 0).forEach(dr);
  c.textAlign = 'left'; c.font = '600 22px system-ui'; c.fillStyle = '#e8eef5'; c.fillText(b.name, 316, 70); c.font = '12px system-ui'; c.fillStyle = '#8191a2'; c.fillText(KIND[b.kind] + ' · ' + SP.systems[b.sys].name + (b.owner != null ? ' · ' + oname(b.owner) : ' · non colonisé'), 316, 88);
  // surface
  const n = b.slots.length, tw = Math.min(96, (sw - 300 - 40) / n), x0 = ax - n * tw / 2, gy0 = sh - 78, dk = mix(b.c1, [0, 0, 0], .55), lt = mix(b.c1, [0, 0, 0], .25);
  const sg1 = c.createLinearGradient(0, gy0 - 30, 0, sh); sg1.addColorStop(0, `rgb(${lt.map(v => v | 0)})`); sg1.addColorStop(1, `rgb(${dk.map(v => v | 0)})`);
  c.fillStyle = sg1; c.beginPath(); c.moveTo(300, gy0 - 14); for (let x = 300; x <= sw; x += 16) c.lineTo(x, gy0 - 16 - fbm(x * .012, b.seed % 97, b.seed, 3) * 26); c.lineTo(sw, sh); c.lineTo(300, sh); c.fill();
  if (b.kind !== 'gazeuse') { c.fillStyle = 'rgba(0,0,0,.18)'; for (let k = 0; k < 26; k++) { const x = 300 + h2(k, 3, b.seed) * (sw - 300), y = gy0 + 8 + h2(k, 9, b.seed) * 60; c.beginPath(); c.ellipse(x, y, 5 + h2(k, 1, b.seed) * 14, 2 + h2(k, 2, b.seed) * 4, 0, 0, 6.3); c.fill(); } } else { c.fillStyle = 'rgba(255,255,255,.1)'; for (let k = 0; k < 9; k++) { c.beginPath(); c.ellipse(300 + ((h2(k, 3, b.seed) + ts / 90000 * (1 + k % 3)) % 1) * (sw - 300), gy0 + 4 + k * 8, 90 + h2(k, 1, b.seed) * 120, 5, 0, 0, 6.3); c.fill(); } c.textAlign = 'left'; c.font = '11px system-ui'; c.fillStyle = '#e8eef5'; c.fillText('Plateformes d’écopage en haute atmosphère', 316, gy0 - 34); }
  b.slots.forEach((s, k) => {
    const x = x0 + k * tw + tw / 2, y = gy0 + 18;
    c.fillStyle = k === spUI.slot ? 'rgba(227,179,65,.3)' : 'rgba(0,0,0,.28)'; c.strokeStyle = k === spUI.slot ? '#e3b341' : 'rgba(255,255,255,.18)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - tw / 2 + 8, y - 4); c.lineTo(x + tw / 2 - 2, y - 4); c.lineTo(x + tw / 2 - 8, y + 16); c.lineTo(x - tw / 2 + 2, y + 16); c.closePath(); c.fill(); c.stroke();
    if (s.dep) { c.fillStyle = DEPC[s.dep]; for (let q = 0; q < 3; q++) { const px = x - tw / 2 + 14 + q * 6, py = y + 12; c.beginPath(); c.moveTo(px, py); c.lineTo(px + 3, py - 7 - q * 2); c.lineTo(px + 6, py); c.fill(); } c.font = '9px system-ui'; c.textAlign = 'center'; c.fillStyle = '#dfe6ee'; c.fillText(RES[s.dep][0], x, y + 30); }
    if (s.b) drawBuilding(c, s.b, s.lv, x + 4, y + 2, ts, col);
    spHits.push({ t: 'slot', id: k, x, y: y - 6, r: tw / 2 });
  });
  if (b.owner === 'P') for (let k = 0; k < 3; k++) { const u = (ts / (6000 + k * 1700) + k * .37) % 1, x = x0 + (k % 2 ? 1 - u : u) * n * tw, y = gy0 + 44 + k * 7; c.fillStyle = '#e8eef5'; c.fillRect(x - 6, y - 5, 12, 5); c.fillStyle = '#39f'; c.fillRect(x - 2, y - 8, 5, 3); c.fillStyle = '#222'; c.beginPath(); c.arc(x - 4, y, 2.2, 0, 6.3); c.arc(x + 4, y, 2.2, 0, 6.3); c.fill(); }
  const tc = tcount(b.tr || {}); if (b.owner === 'P' && tc) for (let k = 0; k < Math.min(14, tc); k++) { const x = 320 + k * 11, y = gy0 + 62; c.fillStyle = col; c.fillRect(x, y - 7, 3, 7); c.beginPath(); c.arc(x + 1.5, y - 9, 2, 0, 6.3); c.fill(); }
}
function drawBattle(c, ts) {
  const bt = battle; bt.t += 16; if (!bt.last) bt.last = ts; if (!bt.done && ts - bt.last > 480) { bt.last = ts; bRound(bt); if (bt.done) bt.endAt = ts + 900; }
  if (bt.done && ts > (bt.endAt || 0)) { endBattle(bt); return; }
  const ax = 300 + (sw - 300) / 2; drawBody(c, bt.body, ax, sh * .5, Math.min(120, sh * .2), true);
  c.fillStyle = 'rgba(2,3,10,.55)'; c.fillRect(300, 38, sw - 300, sh - 38);
  c.textAlign = 'center'; c.font = '600 20px system-ui'; c.fillStyle = '#fff'; c.fillText('Bataille de ' + bt.body.name, ax, 76); c.font = '12px system-ui'; c.fillStyle = '#8191a2'; c.fillText(`Salve ${bt.rounds} · cliquez pour passer`, ax, 94);
  const posOf = new Map();
  [[bt.A, 1], [bt.D, -1]].forEach(([side, dir]) => {
    const bx = dir === 1 ? 300 + (sw - 300) * .2 : 300 + (sw - 300) * .8, n = side.st.length, gap = Math.min(78, (sh - 170) / Math.max(1, n));
    c.textAlign = 'center'; c.font = '600 13px system-ui'; c.fillStyle = ocol(side.owner); c.fillText(oname(side.owner), bx, 122);
    side.st.forEach((s, i) => {
      const y = 160 + i * gap + Math.sin(ts / 700 + i) * 3; posOf.set(s, [bx, y]);
      const show = Math.min(6, s.n), sc = s.k === 'cuir' || s.k === 'porte' ? 1.1 : 1.3;
      for (let q = 0; q < show; q++) drawShip(c, s.k, bx - dir * (q % 3) * 34 + dir * 20, y + ((q / 3 | 0) - .5) * 20, sc, dir, ocol(side.owner));
      c.fillStyle = '#1b2430'; c.fillRect(bx - 50, y + 26, 100, 4); c.fillStyle = s.n ? '#57ab5a' : '#555'; c.fillRect(bx - 50, y + 26, 100 * s.hp / (s.n0 * s.per), 4);
      c.font = '11px system-ui'; c.fillStyle = s.n ? '#dde5ee' : '#666'; c.fillText(`${s.k === 'def' ? 'Batteries' : SH[s.k].n} ×${s.n}`, bx, y + 43);
      if (s.fx > 0) { c.fillStyle = `rgba(255,${160 + Math.random() * 80 | 0},60,${s.fx})`; c.beginPath(); c.arc(bx + R(-30, 30), y + R(-12, 12), 6 + (1 - s.fx) * 22, 0, 6.3); c.fill(); s.fx -= .04; }
    });
  });
  if (bt.shotT > 0) { for (const [s, t] of bt.shots) { const a = posOf.get(s), b = posOf.get(t); if (!a || !b) continue; const mine = bt.A.st.includes(s); c.strokeStyle = mine ? `rgba(110,220,255,${bt.shotT})` : `rgba(255,110,90,${bt.shotT})`; c.lineWidth = s.k === 'cuir' || s.k === 'porte' ? 3 : 1.5; c.beginPath(); c.moveTo(a[0] + (mine ? 40 : -40), a[1]); c.lineTo(b[0] + R(-20, 20), b[1] + R(-10, 10)); c.stroke(); } bt.shotT -= .05; }
}

// ---------- interface ------------------------------------------------
function spTop() {
  const r = spRate || (spRate = spProd());
  $('stop').innerHTML = `<b style="color:#ffd24a">☀ Humanité</b><span class="r">J+${SP.day}</span>` + ['cr', 'metal', 'he3', 'ice', 'rare'].map(k => `<span class="r" title="${RES[k][0]}">${RES[k][1]} <b>${fmt(SP.res[k])}</b> <span class="grn">${r[k] ? sg(r[k]) : ''}</span></span>`).join('') +
    `<span class="r" title="Science">🔬 <b>${SP.research ? STECH[SP.research.k].n + ' ' + (SP.research.p / stCost(SP.research.k, SP.tech[SP.research.k]) * 100 | 0) + ' %' : fmt(SP.res.sci) + ' (libre)'}</b></span><span class="sp"></span><button data-a="cheat" style="border-color:#7a3550">Triche</button>` +
    [0, 1, 2, 3, 4, 5].map(i => `<button data-a="speed" data-v="${i}" class="${S.speed === i ? 'on' : ''}">${['❚❚', '▶', '▶▶', '×8', '×20', '×45'][i]}</button>`).join('') +
    `<button data-a="spSol" class="${spUI.mode !== 'galaxy' && spUI.sys === 0 ? 'on' : ''}">Sol</button><button data-a="spGal" class="${spUI.mode === 'galaxy' ? 'on' : ''}">Galaxie</button><button data-a="spTech">Recherche</button><button data-a="spDip">Civilisations</button><button data-a="spFleets">Flottes</button><button data-a="spEarth" title="Retour à la carte terrestre">🌍</button><button data-a="save" title="Sauvegarder">💾</button>`;
}
function fleetRow(f) { return `<div class="slot ${f.id === spUI.fleet ? 'on' : ''}" data-a="spSelFleet" data-v="${f.id}"><span style="color:${ocol(f.o)}">▶ ${oname(f.o)}</span><span>${fcount(f)} vaisseaux${tcount(f.tr) ? ' · ' + tcount(f.tr) + ' troupes' : ''}${f.mv ? ' · en transit' : ''}</span></div>`; }
function spSide() {
  spSideT = SP.day; let h = ''; const f = SP.fleets.find(x => x.id === spUI.fleet);
  if (f) {
    const cap = (f.sh.trans || 0) * SH.trans.cap, here = f.mv ? null : bd(f.at);
    h += `<h3>Flotte sélectionnée</h3>${fleetRow(f)}` + Object.keys(f.sh).filter(k => f.sh[k] > 0).map(k => `<div class="row"><span>${SH[k].n}</span><b>${f.sh[k]}</b></div>`).join('') + Object.keys(f.tr).filter(k => f.tr[k] > 0).map(k => `<div class="row"><span>↳ ${GU[k].n}</span><b>${f.tr[k]}</b></div>`).join('') +
      `<div class="row"><span>Puissance</span><b>${fmt(fpow(f))}</b></div><div class="row"><span>Soute à troupes</span><b>${tcount(f.tr)}/${cap}</b></div><div class="row"><span>Position</span><b>${f.mv ? `en route vers ${bd(f.mv.to).name} (${Math.ceil(f.mv.T - f.mv.t)} j)` : here.name}</b></div>`;
    if (f.o === 'P' && here) {
      h += `<div class="btns">`;
      if (here.owner == null && f.sh.colon > 0) h += `<button data-a="spColonize" class="on">Fonder une colonie</button>`;
      if (here.owner === 'P' && tcount(here.tr) && cap > tcount(f.tr)) h += `<button data-a="spLoad">Embarquer les troupes</button>`;
      if (here.owner === 'P' && tcount(f.tr)) h += `<button data-a="spUnload">Débarquer</button>`;
      if (hostileSp('P', here.owner)) h += `<button data-a="spInvade" class="w">Assaut orbital / au sol</button>`;
      h += `<button data-a="spSplit">Diviser</button><button data-a="spMerge">Fusionner ici</button></div>`;
    }
    h += `<div class="tip">Clic droit sur un astre (ou un système dans la vue Galaxie) pour y envoyer la flotte.</div>`;
  }
  if (spUI.mode === 'galaxy') {
    const s = SP.systems[spUI.sys], own = bd(s.cap).owner, rc = own != null && own !== 'P' ? SP.races[own] : null;
    h += `<h3>Système</h3><h2>${s.name}</h2><div class="dim">Étoile de type ${s.st} · ${s.b.length} corps · ${s.ln.length} voies</div>`;
    if (rc && rc.met) h += `<div class="row"><span>Contrôle</span><b style="color:${rc.color}">${rc.name}</b></div>`;
    h += `<div class="btns"><button data-a="spEnter" class="on">Entrer dans le système</button></div>`;
    if (s.seen || SP.cheat.reveal) h += s.b.map(id => { const b = bd(id); return `<div class="slot" data-a="spBody" data-v="${id}"><span>${b.parent != null ? '↳ ' : ''}${b.name}</span><span style="color:${ocol(b.owner)}">${KIND[b.kind].split(' ')[0]} ${b.owner != null ? '●' : ''}</span></div>`; }).join(''); else h += `<div class="tip">Système inexploré : envoyez-y une flotte.</div>`;
  } else if (spUI.body != null) {
    const b = bd(spUI.body);
    h += `<h3>${KIND[b.kind]}</h3><h2>${b.name}</h2><div class="dim">${b.desc || 'Un monde de ' + SP.systems[b.sys].name + '.'}</div><div class="row"><span>Contrôle</span><b style="color:${ocol(b.owner)}">${b.owner == null ? 'Non colonisé' : oname(b.owner)}</b></div>
    <div class="btns"><button data-a="${spUI.mode === 'body' ? 'spSysView' : 'spBodyView'}">${spUI.mode === 'body' ? '← Vue du système' : 'Vue rapprochée'}</button>${f && f.o === 'P' && !f.mv && f.at !== b.id ? `<button data-a="spSend" class="on">Envoyer la flotte ici${(() => { const t = travel(f, b.id); return t ? ' (' + Math.ceil(t.T) + ' j)' : ''; })()}</button>` : ''}</div>`;
    if (!reachable(b) && b.owner !== 'P') h += `<div class="tip red">Hors de portée : ${b.sys ? 'moteur de distorsion' : b.tier === 1 ? 'propulsion ionique' : 'propulsion à fusion'} requis.</div>`;
    if (b.owner === 'P') {
      h += `<h3>Surface — ${b.slots.length} parcelles</h3>`;
      b.slots.forEach((s, k) => { h += `<div class="slot ${k === spUI.slot ? 'on' : ''}" data-a="spSlot" data-v="${k}"><span>${k + 1} · ${s.dep ? `<span style="color:${DEPC[s.dep]}">${RES[s.dep][0]}</span>` : 'terrain nu'}</span><span>${s.b ? SB[s.b].n + ' niv. ' + s.lv : '—'}</span></div>`; });
      if (spUI.slot != null && b.slots[spUI.slot]) {
        const s = b.slots[spUI.slot];
        if (s.b) h += s.lv < 3 ? `<div class="btns"><button data-a="spUp" ${can(mul(SB[s.b].c, s.lv + 1)) ? '' : 'disabled'}>Améliorer ${SB[s.b].n} → niv. ${s.lv + 1} <span class="cost">${cstr(mul(SB[s.b].c, s.lv + 1))}</span></button><button data-a="spDemol" class="w">Raser</button></div>` : `<div class="btns"><span class="dim">Niveau maximal</span><button data-a="spDemol" class="w">Raser</button></div>`;
        else h += `<div class="btns">` + Object.keys(SB).filter(k => (k !== 'mine' || s.dep) && !(SB[k].uniq && has(b, k))).map(k => `<button data-a="spBuild" data-v="${k}" title="${SB[k].d}" ${can(SB[k].c) ? '' : 'disabled'}>${SB[k].n} <span class="cost">${cstr(SB[k].c)}</span></button>`).join('') + `</div>`;
      } else h += `<div class="tip">Sélectionnez une parcelle pour y construire.</div>`;
      if (has(b, 'yard')) { h += `<h3>Chantier spatial</h3>`; for (const k in SH) h += `<div class="row" title="Coque ${SH[k].hp} · Attaque ${SH[k].atk} · Vitesse ${SH[k].spd}"><span>${SH[k].n}<br><span class="cost">${cstr(SH[k].c)}</span></span><span><button data-a="spShip" data-v="${k}" data-n="1" ${can(SH[k].c) ? '' : 'disabled'}>+1</button> <button data-a="spShip" data-v="${k}" data-n="5" ${can(mul(SH[k].c, 5)) ? '' : 'disabled'}>+5</button></span></div>`; }
      if (has(b, 'bar')) { h += `<h3>Caserne</h3>`; for (const k in GU) h += `<div class="row" title="Puissance ${GU[k].p}"><span>${GU[k].n} <b style="color:var(--tx)">${b.tr[k] || 0}</b><br><span class="cost">${cstr(GU[k].c)}</span></span><span><button data-a="spTroop" data-v="${k}" data-n="1" ${can(GU[k].c) ? '' : 'disabled'}>+1</button> <button data-a="spTroop" data-v="${k}" data-n="5" ${can(mul(GU[k].c, 5)) ? '' : 'disabled'}>+5</button></span></div>`; }
      h += `<div class="row"><span>Défense au sol</span><b>${fmt(bodyGar(b))}</b></div>`;
    } else if (b.owner != null) { const rc = SP.races[b.owner]; h += `<div class="row"><span>Garnison</span><b>${fmt(bodyGar(b))}</b></div><div class="row"><span>Batteries orbitales</span><b>${lvl(b, 'def')}</b></div><div class="row"><span>Relations</span><b>${rc.status}</b></div>${SP.systems[b.sys].cap === b.id ? '<div class="tip">Monde-capitale : sa chute livre tout le système.</div>' : ''}`; }
    else h += `<div class="tip">Amenez un <b>vaisseau colonial</b> en orbite pour fonder une colonie. Gisements : ${b.slots.filter(s => s.dep).map(s => RES[s.dep][0]).join(', ') || 'aucun'}.</div>`;
    const here = SP.fleets.filter(x => x.at === b.id && !x.mv); if (here.length) h += `<h3>En orbite</h3>` + here.map(fleetRow).join('');
  } else if (!f) h += `<h3>Commandement</h3><div class="tip">Cliquez sur un astre pour le gérer, sur une flotte (triangle) pour la commander. Double-clic sur un astre : vue rapprochée.<br><br><b>Étapes :</b> Lune → propulsion ionique (Mars, Vénus, Mercure) → fusion (ceinture, géantes) → moteur de distorsion (50 systèmes, autres civilisations).</div><h3>Colonies</h3>` + SP.bodies.filter(b => b.owner === 'P').map(b => `<div class="slot" data-a="spBody" data-v="${b.id}"><span>${b.name}</span><span class="dim">${SP.systems[b.sys].name}</span></div>`).join('');
  $('sside').innerHTML = h; paintPortraits();
}
Object.assign(A, {
  spSol() { spUI.mode = 'system'; spUI.sys = 0; spUI.body = null; },
  spGal() { spUI.mode = 'galaxy'; },
  spEarth() { S.phase = 'earth'; $('space').classList.add('hid'); $('earth').classList.remove('hid'); $('top').classList.remove('hid'); $('side').classList.remove('hid'); layerDirty = true; renderTop(); refreshSide(true); renderCheat(); },
  spEnter() { spUI.mode = 'system'; spUI.body = null; },
  spBody(v) { const b = bd(+v); spUI.sys = b.sys; spUI.body = b.id; spUI.slot = null; if (spUI.mode === 'galaxy') spUI.mode = 'system'; },
  spBodyView() { spUI.mode = 'body'; }, spSysView() { spUI.mode = 'system'; },
  spSelFleet(v) { spUI.fleet = +v; const f = SP.fleets.find(x => x.id === +v); if (f && !f.mv && spUI.mode !== 'galaxy') { spUI.sys = bd(f.at).sys; } },
  spSend() { const f = SP.fleets.find(x => x.id === spUI.fleet); if (f && moveFleet(f, spUI.body)) toast('Flotte en route'); },
  spSlot(v) { spUI.slot = +v; },
  spBuild(v) { const b = bd(spUI.body), s = b.slots[spUI.slot]; if (pay(SB[v].c)) { s.b = v; s.lv = 1; } },
  spUp() { const s = bd(spUI.body).slots[spUI.slot]; if (pay(mul(SB[s.b].c, s.lv + 1))) s.lv++; },
  spDemol() { const s = bd(spUI.body).slots[spUI.slot]; s.b = null; s.lv = 0; },
  spShip(v, e) { const n = +e.dataset.n, b = bd(spUI.body); if (!pay(mul(SH[v].c, n))) return toast('Ressources insuffisantes'); let f = SP.fleets.find(x => x.o === 'P' && x.at === b.id && !x.mv); if (!f) { f = { id: SP.fid++, o: 'P', at: b.id, sh: {}, tr: {}, mv: null }; SP.fleets.push(f); } f.sh[v] = (f.sh[v] || 0) + n; if (spUI.fleet == null) spUI.fleet = f.id; },
  spTroop(v, e) { const n = +e.dataset.n, b = bd(spUI.body); if (!pay(mul(GU[v].c, n))) return toast('Ressources insuffisantes'); b.tr[v] = (b.tr[v] || 0) + n; },
  spColonize() { const f = SP.fleets.find(x => x.id === spUI.fleet), b = bd(f.at); if (b.owner != null || !f.sh.colon) return; f.sh.colon--; b.owner = 'P'; b.tr = {}; const s = b.slots.find(x => !x.dep) || b.slots[0]; s.b = 'hab'; s.lv = 1; if (!fcount(f)) { SP.fleets = SP.fleets.filter(x => x !== f); spUI.fleet = null; } spUI.body = b.id; spLog(`🏳 Colonie fondée sur <b>${b.name}</b>.`, 2); if (b.name === 'Lune') spLog('Un petit pas… La Lune est à nous. Construisez des mines d’hélium-3 et lancez la recherche.', 3); },
  spLoad() { const f = SP.fleets.find(x => x.id === spUI.fleet), b = bd(f.at); let room = (f.sh.trans || 0) * SH.trans.cap - tcount(f.tr); for (const k of ['grav', 'mecha', 'marine']) { const n = Math.min(room, b.tr[k] || 0); if (n > 0) { b.tr[k] -= n; f.tr[k] = (f.tr[k] || 0) + n; room -= n; } } },
  spUnload() { const f = SP.fleets.find(x => x.id === spUI.fleet), b = bd(f.at); for (const k in f.tr) { b.tr[k] = (b.tr[k] || 0) + f.tr[k]; } f.tr = {}; },
  spInvade() { const f = SP.fleets.find(x => x.id === spUI.fleet); arrive(f); },
  spSplit() { const f = SP.fleets.find(x => x.id === spUI.fleet); if (!f || f.mv || fcount(f) < 2) return; const g = { id: SP.fid++, o: 'P', at: f.at, sh: {}, tr: {}, mv: null }; for (const k in f.sh) { const n = Math.floor(f.sh[k] / 2); g.sh[k] = n; f.sh[k] -= n; } if (fcount(g)) SP.fleets.push(g); },
  spMerge() { const f = SP.fleets.find(x => x.id === spUI.fleet); if (!f || f.mv) return; for (const g of SP.fleets) if (g !== f && g.o === 'P' && g.at === f.at && !g.mv) { for (const k in g.sh) { f.sh[k] = (f.sh[k] || 0) + g.sh[k]; g.sh[k] = 0; } for (const k in g.tr) { f.tr[k] = (f.tr[k] || 0) + g.tr[k]; } g.tr = {}; } SP.fleets = SP.fleets.filter(g => fcount(g) > 0 || g === f); },
  spResearch(v) { SP.research = { k: v, p: Math.min(SP.res.sci, stCost(v, SP.tech[v])) }; SP.res.sci -= SP.research.p; A.spTech(); },
  spTech() { const r = spProd(); modal(`<h2>Recherche spatiale <span class="dim" style="font-size:13px">— ${sg(r.sci)} science/j</span></h2><table>${Object.keys(STECH).map(k => { const t = STECH[k], lv = SP.tech[k], rq = t.req ? t.req() : true, cur = SP.research && SP.research.k === k; return `<tr><td><b>${t.n}</b><br><span class="dim">${t.d}</span></td><td>${lv}/${t.max}</td><td>${lv >= t.max ? '<span class="dim">acquis</span>' : cur ? `<span class="or">en cours ${(SP.research.p / stCost(k, lv) * 100 | 0)} %</span>` : rq !== true ? `<span class="dim">Requiert ${rq}</span>` : `<button data-a="spResearch" data-v="${k}">Rechercher (${fmt(stCost(k, lv))})</button>`}</td></tr>`; }).join('')}</table><div class="btns" style="margin-top:10px"><button data-a="closeModal">Fermer</button></div>`); },
  spDip() { const l = SP.races.filter(r => r.met); modal(`<h2>Civilisations connues <span class="dim" style="font-size:13px">— ${l.length} / ${SP.races.length}</span></h2>` + (l.map(rc => `<div style="display:flex;gap:12px;border-top:1px solid #1b2733;padding:10px 0;opacity:${rc.alive ? 1 : .45}"><canvas data-race="${rc.id}" width="100" height="114"></canvas><div style="flex:1"><b style="color:${rc.color};font-size:15px">${rc.name}</b> <span class="dim">— peuple ${rc.people}, ${rc.morph}</span><br>${rc.desc}<br><span class="dim">Tempérament ${rc.ethos} · ${SP.bodies.filter(b => b.owner === rc.id).length} mondes · flotte ${fmt(SP.fleets.filter(f => f.o === rc.id).reduce((a, f) => a + fpow(f), 0))}</span><br>Statut : <b class="${rc.status === 'guerre' ? 'red' : rc.status === 'alliance' ? 'grn' : ''}">${rc.alive ? rc.status : 'anéantie'}</b> · attitude <b>${rc.att | 0}</b>${rc.alive ? `<div class="btns">${rc.status === 'guerre' ? `<button data-a="xPeace" data-v="${rc.id}" class="g">Proposer la paix</button>` : `<button data-a="xWar" data-v="${rc.id}" class="w">Déclarer la guerre</button>${rc.status === 'neutre' ? `<button data-a="xTrade" data-v="${rc.id}">Accord commercial</button>` : ''}${rc.status !== 'alliance' ? `<button data-a="xAlly" data-v="${rc.id}" class="g">Alliance</button>` : ''}`}<button data-a="xGift" data-v="${rc.id}" ${SP.res.cr < 200 ? 'disabled' : ''}>Offrir 200 💠</button></div>` : ''}</div></div>`).join('') || '<p class="dim">Aucun contact pour l’instant. Les autres civilisations vivent au-delà de Sol : il faut le moteur de distorsion.</p>') + `<div class="btns" style="margin-top:10px"><button data-a="closeModal">Fermer</button></div>`); paintPortraits(); },
  xWar(v) { const rc = SP.races[+v]; rc.status = 'guerre'; rc.att -= 40; rc.warDay = SP.day; spLog(`⚔ Nous déclarons la guerre à <b style="color:${rc.color}">${rc.name}</b>.`, 1); A.spDip(); },
  xPeace(v) { const rc = SP.races[+v], mp = SP.fleets.filter(f => f.o === 'P').reduce((a, f) => a + fpow(f), 0), rp = SP.fleets.filter(f => f.o === rc.id).reduce((a, f) => a + fpow(f), 0); if (SP.cheat.love || (SP.day - rc.warDay > 60 && rp < mp * 1.2)) { rc.status = 'neutre'; rc.att = Math.max(rc.att, -20); spLog(`Paix conclue avec ${rc.name}.`, 2); } else toast(rc.name + ' refuse la paix'); A.spDip(); },
  xTrade(v) { const rc = SP.races[+v]; if (SP.cheat.love || rc.att >= 10) { rc.status = 'commerce'; spLog(`Accord commercial avec ${rc.name} (+15 💠/j).`, 2); } else toast('Attitude insuffisante (≥ 10 requise)'); A.spDip(); },
  xAlly(v) { const rc = SP.races[+v]; if (SP.cheat.love || rc.att >= 60) { rc.status = 'alliance'; spLog(`Alliance scellée avec ${rc.name}.`, 2); spWinCheck(); } else toast('Attitude insuffisante (≥ 60 requise)'); if (!modalOpen || !askCur) A.spDip(); },
  xGift(v) { const rc = SP.races[+v]; SP.res.cr -= 200; rc.att = Math.min(100, rc.att + (rc.ethos === 'marchand' ? 16 : 9)); A.spDip(); },
  spFleets() { modal(`<h2>Flottes humaines</h2>` + SP.fleets.filter(f => f.o === 'P').map(f => `<div class="slot" data-a="spPickFleet" data-v="${f.id}"><span>${f.mv ? '→ ' + bd(f.mv.to).name : bd(f.at).name} <span class="dim">(${SP.systems[bd(f.mv ? f.mv.to : f.at).sys].name})</span></span><span>${Object.keys(f.sh).filter(k => f.sh[k]).map(k => f.sh[k] + ' ' + SH[k].n.toLowerCase()).join(', ')}</span></div>`).join('') + `<div class="btns" style="margin-top:10px"><button data-a="closeModal">Fermer</button></div>`); },
  spPickFleet(v) { closeModal(); const f = SP.fleets.find(x => x.id === +v); spUI.fleet = f.id; if (!f.mv) { spUI.sys = bd(f.at).sys; spUI.body = f.at; spUI.mode = 'system'; } }
});
function showSpace() { $('earth').classList.add('hid'); $('space').classList.remove('hid'); spResize(); spRate = spProd(); spTop(); spSide(); spLog; $('slog').innerHTML = SP.log.slice(0, 7).map(l => `<div class="k${l.k}"><span class="dim">J+${l.d}</span> ${l.m}</div>`).join(''); if (typeof renderCheat === 'function') renderCheat(); }
function enterSpace() { if (!S.space) { initSpace(); } SP = S.space; S.phase = 'space'; S.speed = Math.min(S.speed || 1, 2); showSpace(); }
$('sside').addEventListener('mouseenter', () => spHover = true); $('sside').addEventListener('mouseleave', () => spHover = false);
function spHit(e) { const r = scv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top; let best = null; for (const h of spHits) { const d = Math.hypot(h.x - mx, h.y - my); if (d <= h.r && (!best || (h.t === 'f' && best.t !== 'f') || (h.t === best.t && d < best.d))) best = Object.assign({ d }, h); } return best; }
scv.addEventListener('mousedown', e => {
  if (battle) { while (!battle.done) bRound(battle); battle.endAt = 0; return; }
  if (!SP || modalOpen) return; const h = spHit(e), f = SP.fleets.find(x => x.id === spUI.fleet);
  if (e.button === 2) { if (f && f.o === 'P' && h) { const to = h.t === 'b' ? h.id : h.t === 's' ? SP.systems[h.id].cap : null; if (to != null && moveFleet(f, to)) toast('Flotte en route vers ' + bd(to).name); } }
  else if (!h) { spUI.fleet = null; if (spUI.mode !== 'body') spUI.body = null; spUI.slot = null; }
  else if (h.t === 'f') { spUI.fleet = h.id; }
  else if (h.t === 'b') { spUI.body = h.id; spUI.slot = null; }
  else if (h.t === 's') { spUI.sys = h.id; spUI.body = null; }
  else if (h.t === 'slot') spUI.slot = h.id;
  spSide(); spTop();
});
scv.addEventListener('dblclick', e => { if (battle || !SP) return; const h = spHit(e); if (!h) return; if (h.t === 'b') { spUI.body = h.id; spUI.mode = 'body'; } else if (h.t === 's') { spUI.sys = h.id; spUI.mode = 'system'; spUI.body = null; } spSide(); spTop(); });
scv.addEventListener('contextmenu', e => e.preventDefault());
