// Builds the game into a single self-contained HTML file (data, NASA textures, code).
// node build.js     → hegemonie_fr.html (French)
// node build.js en  → index.html (English; run `node i18n/build_en.js` first)
const fs = require('fs'), path = require('path');
process.chdir(__dirname);
const G = 'data/', X = 'data/tex/';
const EN = process.argv[2] === 'en', SRC = EN ? 'i18n/out/' : 'src/';
const gd = JSON.parse(fs.readFileSync(G + 'gamedata.json', 'utf8'));
if (EN) { const nm = JSON.parse(fs.readFileSync('i18n/names_en.json', 'utf8')); gd.meta.forEach((m, i) => m.n = nm.meta[i]); gd.cities.forEach((c, i) => c[0] = nm.cities[i]); }
const data = 'const GAMEDATA=' + JSON.stringify({ meta: gd.meta.map(m => ({ n: m.n, a: m.a, r: m.r, p: m.p, g: m.g })), cities: gd.cities, tiles: gd.tiles, edges: gd.edges, tadj: gd.tadj, riv: gd.riv, rivers: gd.rivers, sea2: gd.sea2 }) + ';';
const asset = (id, file) => `<script type="text/plain" id="${id}">${fs.readFileSync(file).toString('base64')}</script>`;
const assets = [asset('A_tiles', G + 'tiles.bin.gz'), asset('A_day', X + 'day.jpg'), asset('A_elev', X + 'elev.jpg'), asset('A_water', X + 'water.jpg'), asset('A_night', X + 'night.jpg'), asset('A_clouds', X + 'clouds.jpg')].join('\n');
let html = fs.readFileSync(SRC + 'index.html', 'utf8');
const js = ['defs', 'defs5', 'world', 'engine', 'sys', 'v5', 'strat', 'scn', 'nuc', 'v6', 'v7', 'globe', 'gfx', 'ui', 'enc', 'v6ui', 'v7ui', 'space', 'cheat'].map(f => '\n/* @@module ' + f + ' */\n' + fs.readFileSync(SRC + f + '.js', 'utf8')).join('\n');
html = html.replace('/*__ASSETS__*/', () => assets).replace('/*__DATA__*/', () => data).replace('/*__JS__*/', () => js);
fs.writeFileSync(EN ? 'index.html' : 'hegemonie_fr.html', html);
console.log('ok', gd.meta.length, 'nations', gd.cities.length, 'villes', gd.tiles.length, 'provinces', (html.length / 1048576).toFixed(2) + ' Mo');
