// ====================================================================
//  Données v5 : générations d’équipement, munitions, biens, bâtiments de
//  province, justifications, cultures, religions, nations formables…
// ====================================================================
Object.assign(TECH, {
  gI: { n: 'Infanterie et artillerie — génération', d: '+12 % d’attaque et de PV par génération (infanterie, artillerie)', max: 3, base: 150 },
  gB: { n: 'Blindés — génération', d: '+12 % d’attaque et de PV par génération (chars, mécanisés)', max: 3, base: 150 },
  gA: { n: 'Aviation — génération', d: '+12 % d’attaque et de PV par génération (avions, hélicoptères)', max: 3, base: 170 },
  gN: { n: 'Marine — génération', d: '+12 % d’attaque et de PV par génération (navires)', max: 3, base: 170 },
  gD: { n: 'Drones — génération', d: '+12 % d’attaque et de PV par génération (drones)', max: 3, base: 130 }
});
const genKey = u => u.cl === 2 ? 'gN' : u.g === 'drone' ? 'gD' : u.cl === 1 ? 'gA' : u.g === 'blinde' ? 'gB' : 'gI';
const GENN = ['I', 'II', 'III', 'IV'];
// délais de production (jours)
const UBT = { inf: 3, meca: 5, tank: 7, art: 5, mtn: 4, mar: 4, fs: 8, para: 6, frig: 14, dest: 20, sub: 22, cv: 40, lhd: 28, fight: 10, multi: 10, bomb: 14, heli: 7, awacs: 12, drec: 2, dkam: 1, male: 4, ucav: 8, swarm: 2 };
UN.forEach(u => u.bt = UBT[u.k] || 4);
BLD.ars = { n: 'Arsenal', c: 35, cat: 'mil', d: '+1 🎯 munitions/j par niveau (consomme 0,1 ⛏) ; production d’unités de la ville 15 % plus rapide par niveau' };
BK.push('ars');
BLD.fac.d = '+20 % de revenus de la ville, +0,5 🧺 biens/j et +0,15 🎯 munitions/j par niveau (consomme 0,1 ⛏)';
RSC.ammo = { n: 'Munitions', ic: '🎯', u: '', price: 2, d: 'Consommées à chaque jour de combat (0,02 par unité engagée). À sec : puissance −40 %. Arsenaux et usines.' };
RSC.goods = { n: 'Biens', ic: '🧺', u: '', price: 1.5, d: 'Biens de consommation issus des usines et ateliers, réclamés par la population. Pénurie : stabilité −6, revenus −5 %.' };
MKT.push('ammo', 'goods');
// bâtiments de province (3 niveaux), au profit du détenteur de la province
const TB = {
  tfarm: { n: 'Ferme', c: 12, d: '+0,6 🌾/j par niveau (×2 sur céréales)', ok: t => t.bio !== 'toundra' && t.bio !== 'desert' || 'climat trop hostile' },
  tmine: { n: 'Mine', c: 18, d: '+0,4 ⛏/j par niveau (×2 sur minerais ou charbon ; +0,02 ☢ sur uranium)' },
  tpuits: { n: 'Puits et gazoduc', c: 22, d: '+0,5 ⛽/j par niveau', ok: t => t.res === 'petrole' || t.res === 'gaz' || 'gisement de pétrole ou de gaz requis' },
  tfac: { n: 'Atelier', c: 20, d: '+0,3 🧺 biens/j et +0,15 💰/j par niveau' },
  tfort: { n: 'Fortin', c: 15, d: '+25 % de défense par niveau pour qui tient la province' },
  tdep: { n: 'Dépôt logistique', c: 25, d: 'Source de ravitaillement locale ; annule l’attrition du terrain dans la province' }
};
const ORD = [{ n: 'Équilibrée', d: 'Aucun modificateur' }, { n: 'Offensive', d: 'Attaque +10 %, défense −8 %' }, { n: 'Défensive', d: 'Défense +15 %, attaque −15 %, retranchement deux fois plus rapide' }, { n: 'Prudente', d: 'Se replie d’elle-même vers la ville amie la plus proche quand le moral passe sous 45' }];
const TRAIT = { off: { n: 'Offensif', d: 'attaque +10 %' }, def: { n: 'Défenseur', d: 'défense +12 %' }, log: { n: 'Logisticien', d: 'vitesse +15 %, autonomie hors ravitaillement +5 j' }, sie: { n: 'Maître des sièges', d: 'sièges 30 % plus rapides' }, cha: { n: 'Charismatique', d: 'moral +1,5/j, jamais de déroute' } };
const JUST = {
  conq: { n: 'Conquête', d: 20, inf: 2, t: 'Aucun motif particulier.' },
  rev: { n: 'Revendication', d: 6, inf: 0, t: 'La cible tient des villes ou des provinces qui étaient à vous.' },
  lib: { n: 'Libération', d: 10, inf: 1, t: 'La cible occupe des villes d’une autre nation ; les reprendre ne coûte aucune infamie.' },
  prot: { n: 'Protection', d: 8, inf: 1, t: 'La cible est en guerre contre une nation amie (relations ≥ 25) ou alliée.' },
  ideo: { n: 'Croisade idéologique', d: 14, inf: 3, t: 'La cible a un autre régime que le vôtre.' },
  cont: { n: 'Endiguement', d: 5, inf: 0, t: 'La cible a plus de 30 d’infamie.' }
};
const CULTG = { lat: ['Latine', '#d98c4a'], ger: ['Germanique et nordique', '#8fa6b8'], ang: ['Anglo-saxonne', '#c95f6a'], sla: ['Slave', '#7a8fd6'], bal: ['Balte et finno-ougrienne', '#6fc2c9'], hel: ['Hellénique, balkanique et caucasienne', '#4f9bd9'], ara: ['Arabe', '#d9c14f'], tur: ['Turcique et mongole', '#c97fd0'], ira: ['Iranienne', '#9a6fd9'], ind: ['Indienne', '#e08a3c'], sin: ['Chinoise', '#d9534f'], nip: ['Japonaise et coréenne', '#f2a7b5'], sea: ['Asie du Sud-Est', '#57b98c'], afr: ['Afrique subsaharienne', '#8c6d3f'], lam: ['Latino-américaine', '#e3b341'], car: ['Caribéenne', '#3fbfae'], oce: ['Océanienne', '#5a8f5a'], heb: ['Hébraïque', '#9fd3ff'] };
const CULT0 = { lat: 'FRA ITA ESP PRT ROU MDA MCO AND SMR VAT MLT ATF SPM', ger: 'DEU AUT CHE LIE NLD BEL LUX DNK NOR SWE ISL FRO ALA GRL', ang: 'GBR IRL USA CAN AUS NZL JEY GGY IMN BMU FLK IOT SHN SGS NFK HMD', sla: 'RUS UKR BLR POL CZE SVK BGR SRB HRV SVN BIH MNE MKD', bal: 'EST LVA LTU FIN HUN', hel: 'GRC CYP ALB UNK ARM GEO', ara: 'MAR DZA TUN LBY EGY SDN MRT ESH SAU YEM OMN ARE QAT BHR KWT IRQ SYR JOR LBN PSE', tur: 'TUR AZE KAZ UZB TKM KGZ MNG', ira: 'IRN AFG TJK', ind: 'IND PAK BGD NPL LKA BTN MDV', sin: 'CHN TWN HKG MAC SGP', nip: 'JPN KOR PRK', sea: 'VNM THA LAO KHM MMR MYS IDN PHL BRN TLS', heb: 'ISR', car: 'JAM HTI TTO BRB BHS GRD LCA VCT KNA ATG DMA AIA CYM VGB VIR TCA MSR ABW CUW SXM MAF BLM GUY SUR BLZ' };
const CULTR = { Af: 'afr', As: 'sea', Am: 'lam', Eu: 'lat', Oc: 'oce', An: 'ang' };
const REL = { chr: ['Christianisme', '#6f9fe0'], isl: ['Islam', '#4fae6a'], hin: ['Hindouisme', '#e08a3c'], bud: ['Bouddhisme', '#e3c341'], eas: ['Traditions d’Asie orientale', '#d9534f'], jud: ['Judaïsme', '#9fd3ff'] };
const RELC = { ara: 'isl', tur: 'isl', ira: 'isl', ind: 'hin', sin: 'eas', nip: 'eas', sea: 'bud', heb: 'jud' };
const REL0 = { isl: 'PAK BGD MDV IDN MYS BRN ALB UNK BIH SEN MLI NER TCD SOM DJI GMB GIN SLE COM BFA', chr: 'PHL TLS', bud: 'LKA BTN MNG', eas: 'VNM' };
const _cul = {}, _rel = {};
for (const k in CULT0) for (const a of CULT0[k].split(' ')) _cul[a] = k;
for (const k in REL0) for (const a of REL0[k].split(' ')) _rel[a] = k;
const cultOf = t => _cul[T[t].meta.a] || CULTR[T[t].meta.r] || 'lat';
const relOf = t => _rel[T[t].meta.a] || RELC[cultOf(t)] || 'chr';
// nations formables : tenir la capitale d’origine de chaque pays cité
const FORM = [
  ['Union européenne', 'FRA DEU ITA ESP NLD BEL POL'], ['Union ibérique', 'ESP PRT'], ['Benelux', 'BEL NLD LUX'], ['Union de Kalmar', 'DNK NOR SWE'], ['Îles Britanniques unies', 'GBR IRL'],
  ['Tchécoslovaquie', 'CZE SVK'], ['Yougoslavie', 'SRB HRV BIH SVN MNE MKD'], ['Autriche-Hongrie', 'AUT HUN CZE SVK HRV SVN'], ['République des Deux Nations', 'POL LTU'], ['Union soviétique', 'RUS UKR BLR KAZ UZB'],
  ['Empire romain', 'ITA FRA ESP GRC TUR EGY TUN'], ['Empire ottoman', 'TUR SYR IRQ EGY GRC BGR'], ['Maghreb uni', 'MAR DZA TUN LBY MRT'], ['Union arabe', 'SAU EGY IRQ SYR JOR ARE'], ['Fédération d’Afrique de l’Est', 'KEN TZA UGA RWA BDI'],
  ['Grande Colombie', 'COL VEN ECU PAN'], ['Provinces-Unies d’Amérique centrale', 'GTM SLV HND NIC CRI'], ['Confédération péruvio-bolivienne', 'PER BOL'], ['États-Unis d’Amérique du Sud', 'BRA ARG CHL COL PER VEN'], ['Union nord-américaine', 'USA CAN MEX'],
  ['Union indienne', 'IND PAK BGD'], ['Corée unifiée', 'KOR PRK'], ['Union indochinoise', 'VNM LAO KHM'], ['Nusantara', 'IDN MYS BRN'], ['Australasie', 'AUS NZL']
].map(f => ({ n: f[0], need: f[1].split(' ') }));
const FAC0 = [['Alliance atlantique', '#4f8fe0', 'USA CAN GBR FRA DEU ITA ESP PRT NLD BEL LUX DNK NOR ISL POL CZE SVK HUN ROU BGR GRC TUR EST LVA LTU SVN HRV ALB MNE MKD FIN SWE'], ['Organisation du traité de sécurité collective', '#d0584f', 'RUS BLR KAZ KGZ TJK ARM'], ['Conseil de coopération du Golfe', '#57ab5a', 'SAU ARE QAT KWT BHR OMN']];
const FACCOL = ['#e08a3c', '#9a6fd9', '#3fbfae', '#e3b341', '#c95f6a', '#6fc2c9', '#8c6d3f', '#f2a7b5', '#5a8f5a', '#7a8fd6'];
const GENNM = {
  lat: 'Moreau Ferrand Castelli Navarro Almeida Duval Ricci Montero', ger: 'Brandt Lindqvist Vogel Hartmann De Vries Nyberg Keller Holm', ang: 'Whitmore Hale Thornton Mercer Calloway Finch Aldridge Rowe', sla: 'Voronov Kowalczyk Petrenko Novák Dragović Sokolov Marek Ilić',
  bal: 'Tamm Ozols Virtanen Kovács Jansons Nagy Laine Kask', hel: 'Stavros Kelmendi Sarkissian Beridze Pappas Hoxha Manos Dzhaparidze', ara: 'Al-Rashid Haddad Mansour Khalil Farouk Benali Nasser Idrissi', tur: 'Demir Aliyev Nurlan Yilmaz Karimov Bataar Aydin Orazov',
  ira: 'Rostami Karimi Daryush Ahmadzai Shirazi Rahimov Farhadi Navid', ind: 'Rathore Malik Chowdhury Thapa Perera Singh Nair Qureshi', sin: 'Liang Zhou Wen Tan Huang Lau Xu Cheng', nip: 'Tachibana Seo Kuroda Han Mori Baek Ishida Yoon',
  sea: 'Nguyen Santoso Chaiyasit Reyes Vong Aung Rahman Sok', afr: 'Okonkwo Diallo Mwangi Ndlovu Traoré Tesfaye Mensah Kabila', lam: 'Herrera Cardoso Quiroga Salazar Paredes Monteiro Zamora Ibáñez', car: 'Beauvoir Clarke Baptiste Persaud Lewin Toussaint Gordon Ramsaran',
  oce: 'Tupou Kanoho Vea Matagi Tamati Leota Kereama Faleolo', heb: 'Shalev Barak Peled Golan Amir Sharon Navon Oren'
};
