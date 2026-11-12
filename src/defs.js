const DPS = 4;   // v7.1 : jours de calendrier par pas de simulation — tout prend 4 fois plus de temps dans le calendrier
const jd = d => Math.round(d * DPS);   // durée affichée en jours de calendrier
const calY = () => 2026 + (typeof S !== 'undefined' && S ? S.day : 0) * DPS / 365;
const LANGEN = typeof document !== 'undefined' && document.documentElement.lang === 'en';
'use strict';
// ====================================================================
//  HÉGÉMONIE — définitions : ordre de bataille, infrastructures, terrains, météo
// ====================================================================
const $ = id => document.getElementById(id);
const R = (a, b) => a + Math.random() * (b - a);
const RI = (a, b) => Math.floor(R(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = n => { n = +n || 0; const a = Math.abs(n); return a >= 1e6 ? (n / 1e6).toFixed(1) + ' M' : a >= 1e4 ? (n / 1e3).toFixed(0) + ' k' : a >= 100 ? n.toFixed(0) : a >= 10 ? n.toFixed(1) : n.toFixed(2); };
const sg = n => (n >= 0 ? '+' : '') + fmt(n);
const pct = m => (m >= 1 ? '+' : '−') + Math.abs(Math.round((m - 1) * 100)) + ' %';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// ---- unités de manœuvre (armées et flottes) -------------------------
// cl : 0 terre, 1 air, 2 mer · g : groupe pour les modificateurs · att, pv, aa (défense antiaérienne), vit (km/j), por (portée km)
// c : coût (Md$), m : matériaux, men : effectif (milliers), up : entretien (Md$/j), req : infrastructure requise
const UN = [
  // — 7 unités terrestres
  { k: 'inf', cat: 'Terre', n: 'Infanterie de ligne', ab: 'INF', cl: 0, g: 'inf', att: 1, pv: 1.2, aa: .1, vit: 30, por: 2, c: 2, m: .5, men: 10, up: .01, d: 'Tient le terrain, bonne en défense urbaine.' },
  { k: 'meca', cat: 'Terre', n: 'Infanterie mécanisée (VCI)', ab: 'MEC', cl: 0, g: 'blinde', att: 2, pv: 2, aa: .3, vit: 70, por: 4, c: 5, m: 2, men: 8, up: .02, d: 'Rapide et protégée ; accompagne les chars.' },
  { k: 'tank', cat: 'Terre', n: 'Char de combat principal', ab: 'CHR', cl: 0, g: 'blinde', att: 3.6, pv: 3, aa: 0, vit: 60, por: 4, c: 9, m: 3.5, men: 4, up: .035, d: 'Puissance de choc ; redoutable en plaine et en steppe, inutile en montagne.' },
  { k: 'art', cat: 'Terre', n: 'Artillerie autopropulsée', ab: 'ART', cl: 0, g: 'art', att: 3, pv: 1.2, aa: 0, vit: 45, por: 40, c: 6, m: 2.5, men: 3, up: .025, siege: 1.6, d: 'Feu indirect à 40 km ; +60 % contre les fortifications.' },
  { k: 'mtn', cat: 'Terre', n: 'Chasseurs alpins', ab: 'ALP', cl: 0, g: 'inf', att: 1.3, pv: 1.4, aa: .1, vit: 35, por: 2, c: 4, m: 1, men: 8, up: .015, d: 'Spécialistes de la montagne, de la neige et du froid.' },
  { k: 'mar', cat: 'Terre', n: 'Fusiliers marins', ab: 'FUS', cl: 0, g: 'inf', att: 1.5, pv: 1.4, aa: .1, vit: 35, por: 2, c: 5, m: 1, men: 8, up: .02, land: .5, d: 'Pertes de débarquement divisées par deux ; à l’aise en jungle et zone inondée.' },
  { k: 'fs', cat: 'Terre', n: 'Forces spéciales', ab: 'FSP', cl: 0, g: 'inf', att: 3, pv: 1.6, aa: .2, vit: 50, por: 5, c: 10, m: 1, men: 2, up: .04, d: 'Élite : forêt, jungle, brouillard ; sièges accélérés de 25 %.' },
  // — 5 unités navales (port requis)
  { k: 'frig', cat: 'Marine', n: 'Frégate', ab: 'FRG', cl: 2, g: 'naval', att: 3, pv: 4, aa: 3, vit: 700, por: 150, c: 14, m: 6, men: 2, up: .04, req: 'port', d: 'Escorte polyvalente, défense antiaérienne de zone.' },
  { k: 'dest', cat: 'Marine', n: 'Destroyer lance-missiles', ab: 'DES', cl: 2, g: 'naval', att: 5, pv: 6, aa: 5, vit: 750, por: 300, c: 22, m: 9, men: 3, up: .06, req: 'port', d: 'Frappe côtière à 300 km et bouclier antiaérien.' },
  { k: 'sub', cat: 'Marine', n: 'Sous-marin d’attaque', ab: 'SMA', cl: 2, g: 'naval', att: 6, pv: 4, aa: 0, vit: 600, por: 50, c: 25, m: 10, men: 1, up: .05, req: 'port', vsNaval: 2, d: 'Double dégâts contre les navires ; chasseur de convois.' },
  { k: 'cv', cat: 'Marine', n: 'Porte-avions', ab: 'PAV', cl: 2, g: 'naval', att: 12, pv: 16, aa: 4, vit: 650, por: 1000, c: 70, m: 30, men: 5, up: .2, req: 'port', d: 'Groupe aérien embarqué : projette sa puissance à 1 000 km.' },
  { k: 'lhd', cat: 'Marine', n: 'Porte-hélicoptères d’assaut', ab: 'PHA', cl: 2, g: 'naval', att: 4, pv: 9, aa: 2, vit: 600, por: 300, c: 35, m: 14, men: 4, up: .1, req: 'port', convoy: .5, d: 'Protège les traversées : pertes des convois −50 %.' },
  // — 5 unités aériennes
  { k: 'fight', cat: 'Air', n: 'Chasseur de supériorité aérienne', ab: 'CHS', cl: 1, g: 'air', att: 3, pv: 2, aa: 6, vit: 2400, por: 1300, c: 14, m: 5, men: 1, up: .04, req: 'airb', d: 'Domine le ciel : neutralise l’aviation adverse.' },
  { k: 'multi', cat: 'Air', n: 'Chasseur-bombardier multirôle', ab: 'MUL', cl: 1, g: 'air', att: 4, pv: 2, aa: 3, vit: 2200, por: 1100, c: 16, m: 6, men: 1, up: .045, req: 'airb', d: 'Appui au sol et combat aérien.' },
  { k: 'bomb', cat: 'Air', n: 'Bombardier stratégique', ab: 'BOM', cl: 1, g: 'air', att: 6, pv: 3, aa: 0, vit: 1600, por: 6000, c: 30, m: 12, men: 1, up: .08, req: 'airb', siege: 2, d: 'Rayon de 6 000 km ; écrase fortifications et infrastructures.' },
  { k: 'heli', cat: 'Air', n: 'Hélicoptère d’attaque', ab: 'HEL', cl: 1, g: 'heli', att: 3, pv: 1.5, aa: .5, vit: 280, por: 450, c: 8, m: 3, men: 1, up: .025, vsBlinde: 1.5, d: '+50 % contre les blindés ; ne requiert pas de base aérienne.' },
  { k: 'awacs', cat: 'Air', n: 'Avion de détection (AWACS)', ab: 'AWC', cl: 1, g: 'air', att: 0, pv: 2, aa: 1, vit: 800, por: 800, c: 20, m: 6, men: 1, up: .05, req: 'airb', d: '+25 % de puissance aérienne et de précision pour toute la force.' },
  // — 5 drones
  { k: 'drec', cat: 'Drones', n: 'Drone de reconnaissance', ab: 'DRR', cl: 1, g: 'drone', att: .2, pv: .4, aa: 0, vit: 200, por: 250, c: 1.5, m: .5, men: 0, up: .005, d: '+15 % de précision pour toute la force.' },
  { k: 'dkam', cat: 'Drones', n: 'Munition rôdeuse (drone kamikaze)', ab: 'KAM', cl: 1, g: 'drone', att: 2.5, pv: .2, aa: 0, vit: 180, por: 120, c: 1, m: .4, men: 0, up: .002, once: 1, d: 'Usage unique : détruite en frappant.' },
  { k: 'male', cat: 'Drones', n: 'Drone armé MALE', ab: 'MAL', cl: 1, g: 'drone', att: 1.8, pv: .8, aa: 0, vit: 350, por: 1800, c: 6, m: 2, men: 0, up: .015, d: 'Longue endurance, frappe à 1 800 km.' },
  { k: 'ucav', cat: 'Drones', n: 'Drone de combat furtif', ab: 'UCV', cl: 1, g: 'drone', att: 4, pv: 1.5, aa: .5, vit: 900, por: 2500, c: 18, m: 6, men: 0, up: .04, stealth: .5, d: 'Furtif : ignore la moitié de la défense antiaérienne.' },
  { k: 'swarm', cat: 'Drones', n: 'Essaim de mini-drones', ab: 'ESS', cl: 1, g: 'drone', att: 2, pv: .6, aa: 0, vit: 120, por: 40, c: 3, m: 1, men: 0, up: .008, sat: .05, d: 'Sature les défenses : −5 % d’efficacité antiaérienne adverse par essaim (max −50 %).' },
  { k: 'para', cat: 'Terre', n: 'Parachutistes', ab: 'PAR', cl: 0, g: 'inf', att: 1.6, pv: 1.2, aa: .1, vit: 35, por: 2, c: 6, m: 1, men: 6, up: .02, req: 'airb', drop: 1200, d: 'Largage à 1 200 km depuis une base aérienne, derrière les lignes ennemies.' },
  // — 3 unités stratégiques (hors catégorie)
  { k: 'csg', cat: 'Strat', n: 'Groupe aéronaval nucléaire', ab: 'GAN', cl: 2, g: 'naval', att: 60, pv: 400, aa: 30, vit: 900, por: 15000, c: 5000, m: 0, men: 6, up: 1.5, req: 'port', reqLv: 5, tech: 'nuke', bt: 90, arm: 1, sup: 1, cargo: { tank: 100, fight: 100, fs: 150, para: 150, meca: 150 }, d: 'Porte-avions nucléaire, son escorte et un corps expéditionnaire embarqué (100 chars, 100 chasseurs, 150 forces spéciales, 150 parachutistes, 150 mécanisés). Frappe à 15 000 km avec ses chasseurs, projette son contingent sur toute ville côtière à 15 000 km. Invulnérable : seule une ogive nucléaire le coule, ou 25 à 35 missiles hypersoniques au but.' },
  { k: 'nbomb', cat: 'Strat', n: 'Bombardier d’invasion à propulsion nucléaire', ab: 'BIN', cl: 1, g: 'air', att: 60, pv: 30, aa: 20, vit: 4000, por: 15000, c: 1500, m: 150, men: .5, up: .4, req: 'airb', reqLv: 5, tech: 'nuke', bt: 60, arm: .9, siege: 6, stealth: 1, cargo: { para: 50 }, d: 'Autonomie illimitée, rayon de 15 000 km. Bombardement massif des villes (2 infrastructures détruites par appareil, population et stabilité touchées) et largage de 50 parachutistes embarqués partout dans son rayon. Contre-mesures et escorte air-air : 90 % de pertes en moins, défense sol-air adverse divisée par deux.' },
  { k: 'vsx', cat: 'Strat', n: 'Vaisseau spatial d’exploration et d’invasion', ab: 'VSX', cl: 1, g: 'space', att: 300, pv: 1000, aa: 100, vit: 20000, por: 40000, c: 20000, m: 2000, men: 2, up: 4, req: 'spc', reqLv: 5, tech: 'space', techLv: 3, bt: 180, arm: 1, sup: 1, orb: 1, cargo: { inf: 6000, meca: 4000, tank: 3000, fs: 2000 }, d: 'Fin de partie. Croise en orbite, hors d’atteinte de toute arme planétaire. Transporte 15 000 unités terrestres (6 000 fantassins, 4 000 mécanisés, 3 000 chars, 2 000 forces spéciales) qu’il dépose sans pertes sur n’importe quelle ville du globe ; bombardement orbital partout.' },
  { k: 'brise', cat: 'Marine', n: 'Brise-glace militaire', ab: 'BRG', cl: 2, g: 'naval', att: 2, pv: 9, aa: 2, vit: 420, por: 0, c: 30, m: 14, men: 2, up: .06, req: 'port', only: ['CAN', 'USA', 'RUS'], d: 'Ouvre la route aux flottes dans les eaux polaires gelées en hiver (au-delà de 62°) ; la flotte entière y navigue alors quatre fois plus lentement. Réservé au Canada, aux États-Unis et à la Russie.' }
];
// carburant consommé par jour (plein régime) et composants électroniques à l’achat
const UF = { brise: .06, meca: .02, tank: .03, art: .015, frig: .05, dest: .07, sub: .05, cv: .25, lhd: .12, fight: .04, multi: .04, bomb: .08, heli: .02, awacs: .05, male: .01, ucav: .02 };
const UE = { frig: .3, dest: .4, sub: .4, cv: 1, lhd: .4, fight: .3, multi: .3, bomb: .5, awacs: .6, drec: .1, dkam: .05, male: .2, ucav: .5, swarm: .15 };
UN.forEach(u => { u.f = UF[u.k] || 0; u.e = UE[u.k] || 0; });
const NU = UN.length, UI = {}; UN.forEach((u, j) => UI[u.k] = j);
// ---- 10 missiles (stocks nationaux) ---------------------------------
// por : portée (km), pw : puissance, it : vulnérabilité à l’interception (0 = impossible à intercepter), req : infrastructure de tir
const MIS = [
  { k: 'gmlrs', n: 'Roquette guidée (GMLRS)', por: 80, pw: 4, it: 1, c: 1, m: .5, req: '', tgt: 'u', d: 'Tir d’appui contre les troupes, depuis n’importe quelle ville.' },
  { k: 'srbm', n: 'Missile balistique tactique', por: 500, pw: 12, it: .7, c: 4, m: 2, req: 'silo', tgt: 'ub', d: 'Troupes et infrastructures à 500 km.' },
  { k: 'crui', n: 'Missile de croisière', por: 1600, pw: 10, it: .8, c: 5, m: 2, req: 'silo', tgt: 'bu', d: 'Frappe de précision sur les infrastructures.' },
  { k: 'ashm', n: 'Missile antinavire', por: 300, pw: 14, it: .6, c: 4, m: 2, req: 'port|silo', tgt: 'n', d: 'Triple dégâts contre les navires.' },
  { k: 'arm', n: 'Missile antiradiation', por: 150, pw: 6, it: .5, c: 3, m: 1, req: 'airb|silo', tgt: 'r', d: 'Détruit deux niveaux de défense sol-air.' },
  { k: 'mrbm', n: 'Missile balistique à moyenne portée', por: 3000, pw: 25, it: .5, c: 12, m: 6, req: 'silo', tgt: 'ub', d: 'Frappe lourde à 3 000 km.' },
  { k: 'hyper', n: 'Missile hypersonique', por: 2000, pw: 22, it: .1, c: 20, m: 8, req: 'silo', tgt: 'ub', d: 'Quasi impossible à intercepter.' },
  { k: 'icbm', n: 'Missile intercontinental conventionnel', por: 13000, pw: 35, it: .4, c: 40, m: 15, req: 'silo', tgt: 'ub', d: 'Portée mondiale.' },
  { k: 'sam', n: 'Missile intercepteur longue portée', por: 400, pw: 0, it: 0, c: 3, m: 1, req: 'dca', tgt: 'def', d: 'Défensif : intercepte missiles et aéronefs ennemis visant vos villes.' },
  { k: 'nuke', n: 'Ogive nucléaire', por: 13000, pw: 200, it: .3, c: 150, m: 30, req: 'silo', tgt: 'nuc', tech: 'nuke', d: 'Population −40 %, infrastructures −2, forces −80 %, infamie +15.' }
];
const ME = { gmlrs: .05, srbm: .2, crui: .2, ashm: .2, arm: .2, mrbm: .4, hyper: .6, icbm: .8, sam: .2, nuke: 1 };
const MI = {}; MIS.forEach(m => { MI[m.k] = m; m.e = ME[m.k] || 0; });
// ---- 4 unités cyber ---------------------------------------------------
const CYB = [
  { k: 'crecon', n: 'Cellule de renseignement cyber', c: 6, m: 1, dur: 30, d: 'Révèle les forces de la cible et donne +10 % d’attaque contre elle (30 j).' },
  { k: 'csabo', n: 'Unité de sabotage industriel', c: 8, m: 1, dur: 20, d: 'Revenus et matériaux de la cible −30 % (20 j).' },
  { k: 'cew', n: 'Unité de guerre électronique', c: 10, m: 2, dur: 15, d: 'Aviation et drones de la cible −40 %, interceptions −50 % (15 j).' },
  { k: 'cdef', n: 'Équipe de cyberdéfense (CERT)', c: 5, m: 1, dur: 0, d: 'Passive : chaque équipe bloque 25 % des attaques (plafond 90 %).' }
];
const CI = {}; CYB.forEach(c => { CI[c.k] = c; c.e = .5; });
// ---- 24 infrastructures (niveaux 1 à 5) ------------------------------
// cat : eco, nrj (énergie), res (ressources), soc (société), mil · pw : production électrique par niveau · rel : relief minimal
const BLD = {
  fac: { n: 'Usines', c: 30, cat: 'eco', d: '+20 % de revenus de la ville par niveau' },
  mine: { n: 'Mines', c: 20, cat: 'eco', d: '+0,5 matériau/j par niveau (×2 sur minerai)' },
  lab: { n: 'Laboratoires', c: 40, cat: 'eco', d: '+0,8 science/j par niveau ; 2 chercheurs par niveau' },
  rail: { n: 'Réseau ferré', c: 30, cat: 'eco', d: '+25 % de vitesse au départ de la ville par niveau' },
  bank: { n: 'Place financière', c: 60, cat: 'eco', d: '+10 % de revenus de la ville par niveau ; intérêts de la dette −5 % par niveau' },
  pth: { n: 'Centrale thermique', c: 30, cat: 'nrj', pw: 10, d: '+10 ⚡ par niveau (+50 % si charbon ou gaz dans les provinces de la ville)' },
  pnu: { n: 'Centrale nucléaire', c: 90, cat: 'nrj', pw: 32, d: '+32 ⚡ par niveau ; consomme 0,03 ☢/j par niveau ; à l’arrêt sans uranium' },
  phy: { n: 'Barrage hydroélectrique', c: 55, cat: 'nrj', pw: 16, rel: 1, d: '+16 ⚡ par niveau, sans combustible ; exige un relief de collines au minimum' },
  pre: { n: 'Parc éolien et solaire', c: 25, cat: 'nrj', pw: 6, d: '+6 ⚡ par niveau (+50 % en désert, en steppe ou sur la côte)' },
  raf: { n: 'Raffinerie', c: 40, cat: 'res', d: '+0,5 ⛽/j par niveau (×2 si pétrole dans les provinces de la ville)' },
  farm: { n: 'Exploitations agricoles', c: 15, cat: 'res', d: '+1 🌾/j par niveau (×2 sur céréales ; ÷2 en désert et toundra)' },
  fish: { n: 'Port de pêche', c: 18, cat: 'res', coast: 1, d: '+0,8 🌾/j par niveau' },
  semi: { n: 'Usine de semi-conducteurs', c: 70, cat: 'res', d: '+0,25 🔩/j par niveau (×2 si terres rares dans les provinces de la ville)' },
  umine: { n: 'Mine d’uranium et enrichissement', c: 50, cat: 'res', d: '+0,03 ☢/j par niveau (×4 sur un gisement d’uranium)' },
  hosp: { n: 'Hôpital', c: 25, cat: 'soc', d: 'Croissance démographique +15 %, stabilité +2 par niveau' },
  univ: { n: 'Université', c: 35, cat: 'soc', d: '+0,5 science/j par niveau ; 2 chercheurs par niveau' },
  admin: { n: 'Préfecture', c: 30, cat: 'soc', d: 'Stabilité +5 par niveau' },
  fort: { n: 'Fortifications', c: 25, cat: 'mil', d: '+25 % de défense par niveau, sièges plus longs' },
  port: { n: 'Port militaire', c: 45, cat: 'mil', coast: 1, d: 'Construit les navires et missiles antinavires, +10 % de revenus' },
  airb: { n: 'Base aérienne', c: 40, cat: 'mil', d: 'Construit l’aviation et les parachutistes, +15 % de puissance aérienne en défense' },
  silo: { n: 'Base de missiles', c: 60, cat: 'mil', d: 'Produit et tire les missiles balistiques et de croisière' },
  dca: { n: 'Défense sol-air intégrée', c: 35, cat: 'mil', d: 'Défense antiaérienne 6 par niveau, interception +10 % par niveau' },
  cyber: { n: 'Centre de cyberguerre', c: 50, cat: 'mil', d: 'Forme les unités cyber, +10 % de cyberdéfense par niveau' },
  spc: { n: 'Centre spatial', c: 120, cat: 'mil', d: 'Lance les satellites de reconnaissance ; accueille les ingénieurs aérospatiaux' }
};
const BCAT = { eco: 'Économie', nrj: 'Énergie', res: 'Ressources', soc: 'Société', mil: 'Défense' };
const BK = Object.keys(BLD);
// ---- terrains (biome × relief, d’après l’imagerie et l’altitude réelles) ----
const BIOME = {
  plaine: { n: 'Prairies et cultures', col: '#9cc160', mv: 1, def: 1, m: { blinde: 1.15 } },
  steppe: { n: 'Steppe', col: '#cfc27a', mv: 1, def: .95, m: { blinde: 1.2, drone: 1.1 } },
  savane: { n: 'Savane', col: '#d9ae55', mv: 1.1, def: .95, att: .001, m: { blinde: 1.1 } },
  desert: { n: 'Désert', col: '#f2dca2', mv: 1.3, def: .9, att: .002, m: { blinde: 1.2, inf: .8, drone: 1.2, air: 1.1 } },
  foret: { n: 'Forêt tempérée', col: '#3f8f3c', mv: 1.3, def: 1.2, m: { blinde: .7, art: .8, air: .8, drone: .8, inf: 1.1, fs: 1.2 } },
  taiga: { n: 'Taïga', col: '#2c6a58', mv: 1.45, def: 1.2, att: .002, m: { blinde: .7, art: .8, air: .85, drone: .8, mtn: 1.2, fs: 1.15 } },
  jungle: { n: 'Jungle', col: '#156b2c', mv: 1.7, def: 1.3, att: .002, m: { blinde: .5, art: .7, air: .7, drone: .7, mar: 1.3, fs: 1.3 } },
  toundra: { n: 'Toundra et glace', col: '#d4e0ea', mv: 1.6, def: 1.2, att: .003, m: { blinde: .7, inf: .8, mtn: 1.5, air: .9, drone: .8 } }
};
const BKEYS = ['plaine', 'steppe', 'savane', 'desert', 'foret', 'taiga', 'jungle', 'toundra'];
const RELIEF = [
  { n: 'Plat', col: '#00000000', mv: 1, def: 1, m: {} },
  { n: 'Collines', col: '#3fbf4a', mv: 1.2, def: 1.15, m: { blinde: .85, mtn: 1.1 } },
  { n: 'Semi-montagneux', col: '#f2d43a', mv: 1.5, def: 1.3, m: { blinde: .65, art: .9, mtn: 1.4 } },
  { n: 'Montagneux', col: '#e8423a', mv: 2, def: 1.5, att: .002, m: { blinde: .4, art: .8, mtn: 1.8, inf: .9 } }
];
const TRES = { petrole: ['Pétrole', '#1b1b1b', 'revenus +0,6/j ; raffineries ×2'], gaz: ['Gaz', '#7fd3ff', 'revenus +0,4/j ; centrales thermiques +50 %'], minerai: ['Minerais', '#c0623a', 'matériaux +0,6/j ; mines ×2'], bois: ['Bois', '#2f8f3a', 'matériaux +0,3/j'], cereales: ['Céréales', '#f0d040', 'main-d’œuvre +5 % ; vivres +0,5/j ; fermes ×2'], rare: ['Terres rares', '#c77dff', 'science +0,6/j ; semi-conducteurs ×2'], charbon: ['Charbon', '#6b5b4b', 'matériaux +0,2/j ; centrales thermiques +50 %'], uranium: ['Uranium', '#b6ff3a', 'mines d’uranium ×4'] };
// ---- ressources nationales (stocks et flux) ---------------------------
const RSC = {
  money: { n: 'Trésor', ic: '💰', u: 'Md$', d: 'Recettes des villes moins l’entretien des forces, des spécialistes et les intérêts de la dette.' },
  mp: { n: 'Main-d’œuvre', ic: '👥', u: 'hommes', d: 'Réservoir mobilisable ; se régénère selon la population, les céréales et le niveau de mobilisation.' },
  mat: { n: 'Matériaux', ic: '⛏', u: '', price: 1, d: 'Acier, béton, alliages : nécessaires à toute construction et à tout équipement. Mines, minerais, bois, charbon.' },
  sci: { n: 'Science', ic: '🔬', u: 'points', d: 'Alimente la recherche. Laboratoires, universités, chercheurs, terres rares.' },
  nrj: { n: 'Énergie', ic: '⚡', u: '', d: 'Flux, non stocké : production des centrales contre demande des villes et des infrastructures. En déficit, revenus, matériaux et science chutent (jusqu’à −40 %).' },
  fuel: { n: 'Carburant', ic: '⛽', u: '', price: 1.2, d: 'Consommé chaque jour par les blindés, navires et aéronefs, bien davantage en mouvement ou au combat. À sec : puissance −30 %, marches ralenties de moitié.' },
  food: { n: 'Vivres', ic: '🌾', u: '', price: .6, d: 'Nourrit population et troupes. À sec : la population décline, la stabilité chute, la main-d’œuvre ne se régénère plus.' },
  comp: { n: 'Composants', ic: '🔩', u: '', price: 6, d: 'Électronique de pointe exigée par l’aviation, les drones, les navires, les missiles, les unités cyber et les satellites.' },
  ura: { n: 'Uranium', ic: '☢', u: '', price: 12, d: 'Combustible des centrales nucléaires ; 5 unités par ogive.' }
};
const MKT = ['mat', 'fuel', 'food', 'comp', 'ura'];
// ---- 10 unités civiles et scientifiques (spécialistes affectés à une ville) ----
// max : plafond par ville · need : infrastructure requise
const CIV = [
  { k: 'ing', cat: 'Civil', n: 'Génie civil', ic: '🏗', c: 8, men: 2, up: .01, max: 3, d: 'Coût des constructions de la ville −12 % par équipe.' },
  { k: 'med', cat: 'Civil', n: 'Équipe médicale', ic: '⚕', c: 6, men: 1, up: .01, max: 3, d: 'Croissance démographique +10 % ; attrition des armées stationnées −30 % par équipe.' },
  { k: 'adm', cat: 'Civil', n: 'Administrateurs', ic: '🏛', c: 7, men: 1, up: .012, max: 3, d: 'Stabilité de la ville +4 par équipe : indispensables en territoire occupé.' },
  { k: 'dip', cat: 'Civil', n: 'Diplomates', ic: '🕊', c: 10, men: .5, up: .015, max: 2, d: 'Chaque mission : +4 à chaque amélioration de relations et infamie résorbée 20 % plus vite (5 missions comptées au plus).' },
  { k: 'cher', cat: 'Science', n: 'Chercheurs', ic: '🔬', c: 9, men: .5, up: .015, max: 0, need: 'lab|univ', d: '+0,4 science/j par équipe ; 2 équipes par niveau de laboratoire ou d’université.' },
  { k: 'geo', cat: 'Science', n: 'Géologues prospecteurs', ic: '⛰', c: 8, men: .5, up: .012, max: 2, d: '+0,15 matériau/j ; tous les 90 jours, 35 % de chances de découvrir un gisement dans une province de la ville.' },
  { k: 'agro', cat: 'Science', n: 'Agronomes', ic: '🌱', c: 6, men: .5, up: .01, max: 2, d: 'Production de vivres de la ville +25 % par équipe.' },
  { k: 'met', cat: 'Science', n: 'Météorologues', ic: '🌦', c: 6, men: .3, up: .01, max: 1, d: 'Prévisions : les revenus de la ville ne souffrent plus de la météo et l’attrition météo des armées stationnées est divisée par deux.' },
  { k: 'nuc', cat: 'Science', n: 'Physiciens nucléaires', ic: '⚛', c: 14, men: .3, up: .02, max: 3, need: 'pnu|lab', d: 'Centrales nucléaires de la ville +10 % ; recherche du programme nucléaire +25 % par équipe.' },
  { k: 'astro', cat: 'Science', n: 'Ingénieurs aérospatiaux', ic: '🛰', c: 14, men: .3, up: .02, max: 4, need: 'spc', d: 'Recherche du programme spatial +25 % par équipe.' }
];
const CVI = {}; CIV.forEach(c => CVI[c.k] = c);
// ---- société : rangs de ville, fiscalité, mobilisation, régimes ---------
const RANK = ['Village', 'Bourg', 'Ville', 'Grande ville', 'Métropole'], RANKCOL = ['#7d8a96', '#5aa9c9', '#57ab5a', '#e3b341', '#e5534b'];
const rankOf = pop => pop < .3 ? 0 : pop < 1 ? 1 : pop < 3 ? 2 : pop < 8 ? 3 : 4;
const TAX = [{ n: 'Faible', m: .8, s: 8 }, { n: 'Normale', m: 1, s: 0 }, { n: 'Élevée', m: 1.2, s: -10 }, { n: 'Écrasante', m: 1.4, s: -22 }];
const MOB = [{ n: 'Temps de paix', mp: 1, inc: 1, s: 0 }, { n: 'Mobilisation partielle', mp: 1.6, inc: .9, s: -5 }, { n: 'Mobilisation générale', mp: 2.5, inc: .75, s: -12 }];
const IDEO = {
  demo: { n: 'Démocratie libérale', col: '#539bf5', d: 'Science +10 %, stabilité +5 ; guerre surprise : infamie +50 %', sci: 1.1, s: 5, inf: 1.5 },
  auto: { n: 'Régime autoritaire', col: '#8e6bd0', d: 'Main-d’œuvre +20 %, effet des impôts sur la stabilité divisé par deux', mp: 1.2 },
  comm: { n: 'État communiste', col: '#e5534b', d: 'Matériaux +20 %, revenus −8 %', mat: 1.2, inc: .92 },
  mon: { n: 'Monarchie', col: '#e3b341', d: 'Stabilité +8, revenus +5 %', s: 8, inc: 1.05 },
  mil: { n: 'Junte militaire', col: '#6f8f4e', d: 'Puissance offensive +5 %, coût des unités −8 %, science −15 %, stabilité −5', atk: 1.05, cost: .92, sci: .85, s: -5 }
};
const IDEO0 = { comm: 'CHN CUB VNM LAO PRK', mon: 'SAU ARE QAT OMN KWT BHR BRN SWZ JOR MAR', mil: 'MMR MLI BFA NER SDN TCD GIN GAB', auto: 'RUS BLR IRN SYR AZE TKM TJK KAZ UZB EGY DZA VEN NIC ERI RWA' };
const ideoOf = a => { for (const k in IDEO0) if (a && IDEO0[k].split(' ').includes(a)) return k; return 'demo'; };
function mergeTer(b, r) { const m = Object.assign({}, b.m); for (const k in r.m) m[k] = (m[k] != null ? m[k] : 1) * r.m[k]; for (const k in m) m[k] = Math.round(m[k] * 100) / 100; return { n: r.mv === 1 ? b.n : b.n + ', ' + r.n.toLowerCase(), mv: Math.round(b.mv * r.mv * 100) / 100, def: Math.round(b.def * r.def * 100) / 100, att: (b.att || 0) + (r.att || 0), m }; }
// modificateur pour une unité : clé propre, puis groupe (l’hélicoptère suit « air »)
function umod(m, u) { if (!m) return 1; if (m[u.k] != null) return m[u.k]; if (m[u.g] != null) return m[u.g]; if (u.g === 'heli' && m.air != null) return m.air; return 1; }
// ---- 13 conditions météo -------------------------------------------
const WX = {
  tempete: { n: 'Tempête', ic: '🌬', col: '130,150,185', mv: 1.4, sea: 2, seaAtt: .004, m: { air: .3, drone: .2 } },
  cyclone: { n: 'Cyclone', ic: '🌀', col: '80,105,170', mv: 3, sea: 4, att: .015, seaAtt: .03, inc: .6, drift: 1, m: { air: 0, drone: 0, art: .6 } },
  neige: { n: 'Chutes de neige', ic: '❄', col: '235,242,255', mv: 1.8, att: .004, m: { blinde: .7, air: .6, drone: .5, mtn: 1.3 } },
  canicule: { n: 'Canicule', ic: '🌡', col: '255,140,60', mv: 1.15, att: .003, m: { inf: .8, mtn: .8, mar: .85, blinde: .9 } },
  sable: { n: 'Tempête de sable', ic: '🏜', col: '215,175,105', mv: 1.6, m: { air: .3, drone: .3, art: .5 } },
  mousson: { n: 'Mousson', ic: '🌧', col: '60,120,160', mv: 1.9, siege: .6, m: { blinde: .6, art: .7, air: .6, drone: .6 } },
  brouillard: { n: 'Brouillard', ic: '🌫', col: '195,200,205', mv: 1.1, sea: 1.4, m: { air: .5, drone: .5, art: .6, fs: 1.4 } },
  inondation: { n: 'Inondations', ic: '🌊', col: '55,110,200', mv: 2.2, att: .004, siege: .5, inc: .75, m: { blinde: .6, art: .7, mar: 1.3 } },
  froid: { n: 'Vague de froid', ic: '🥶', col: '170,215,255', mv: 1.3, att: .01, m: { blinde: .8, inf: .85, drone: .7, mtn: 1.2 } },
  orage: { n: 'Orages violents', ic: '⛈', col: '95,95,140', mv: 1.15, sea: 1.5, m: { air: .5, drone: .3 } },
  secheresse: { n: 'Sécheresse', ic: '☀', col: '205,165,60', inc: .7, att: .002, m: {} },
  feu: { n: 'Feux de forêt', ic: '🔥', col: '255,90,30', mv: 1.5, att: .012, noDef: 1, m: { air: .7, drone: .6 } },
  tornade: { n: 'Tornades', ic: '🌪', col: '120,120,120', mv: 1.5, att: .02, dmg: 1, m: { air: .2, drone: .1 } }
};
const GNAME = { inf: 'infanterie', blinde: 'blindés', art: 'artillerie', air: 'aviation', heli: 'hélicoptères', drone: 'drones', naval: 'marine' };
function modStr(o) { const a = []; if (o.mv && o.mv !== 1) a.push('déplacement ×' + o.mv); if (o.sea) a.push('navigation ×' + o.sea); if (o.def && o.def !== 1) a.push('défense ' + pct(o.def)); if (o.att) a.push('attrition ' + (o.att * 100).toFixed(1) + ' %/j'); if (o.seaAtt) a.push('avaries navales ' + (o.seaAtt * 100).toFixed(1) + ' %/j'); if (o.inc) a.push('revenus ' + pct(o.inc)); if (o.siege) a.push('sièges ' + pct(o.siege)); if (o.noDef) a.push('bonus défensif du terrain annulé'); for (const k in o.m) a.push((GNAME[k] || (UI[k] != null ? UN[UI[k]].n.toLowerCase() : k)) + ' ' + (o.m[k] === 0 ? 'cloués au sol' : pct(o.m[k]))); return a.join(' · '); }
const SEAS = ['Hiver', 'Printemps', 'Été', 'Automne', 'Climat tropical'];
function seasonAt(lat, day) { if (Math.abs(lat) < 12) return 4; const q = Math.floor((((day * DPS) % 365) + 31) / 91.25) % 4; return lat >= 0 ? q : (q + 2) % 4; }
const TECH = {
  atk: { n: 'Armement', d: '+10 % de puissance offensive par niveau', max: 8 },
  def: { n: 'Doctrine défensive', d: '+10 % de résistance par niveau', max: 8 },
  eco: { n: 'Économie', d: '+8 % de revenus par niveau', max: 8 },
  ind: { n: 'Industrie', d: '−6 % sur le coût des unités et bâtiments', max: 6 },
  log: { n: 'Logistique', d: '+12 % de vitesse de déplacement', max: 6 },
  nrj: { n: 'Réseaux électriques', d: '+10 % de production d’énergie par niveau', max: 5 },
  agri: { n: 'Agronomie', d: '+10 % de vivres par niveau', max: 5 },
  med: { n: 'Médecine', d: 'Croissance démographique +15 % et attrition −8 % par niveau', max: 5 },
  civ: { n: 'Administration', d: 'Stabilité +3 par niveau dans toutes les villes', max: 5 },
  elec: { n: 'Électronique', d: '+15 % de composants et +3 % d’interception par niveau', max: 5 },
  nuke: { n: 'Programme nucléaire', d: 'Permet de produire des ogives nucléaires', max: 1, base: 500 },
  space: { n: 'Programme spatial', d: 'Ressources de départ pour la conquête spatiale', max: 3, base: 300 }
};
const techCost = (k, lv) => (TECH[k].base || 80) * Math.pow(lv + 1, 1.4);
const NPP = ['USA', 'FRA', 'CHN', 'RUS', 'KOR', 'CAN', 'UKR', 'JPN', 'GBR', 'IND', 'ESP', 'SWE'];
const NUKES = { USA: 5, RUS: 5, CHN: 4, FRA: 3, GBR: 2, IND: 2, PAK: 2, PRK: 1, ISR: 1 };
