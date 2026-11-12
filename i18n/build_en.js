// Génère les sources anglaises (i18n/out/*.js, index.html) et les noms anglais des pays et des villes
const fs = require('fs'), acorn = require('acorn'), walk = require('acorn-walk'), cp = require('child_process');
const MODS = ['defs', 'defs5', 'world', 'engine', 'sys', 'v5', 'strat', 'scn', 'nuc', 'v6', 'v7', 'globe', 'gfx', 'ui', 'enc', 'v6ui', 'v7ui', 'space', 'cheat'];
const S = JSON.parse(fs.readFileSync(__dirname + '/strings_v7.json', 'utf8'));
// dictionnaire : t1..t9.py (index → anglais)
const dict = new Map();
for (const f of fs.readdirSync(__dirname).filter(f => /^t\d+\.py$/.test(f)).sort()) {
  const j = JSON.parse(cp.execSync(`python3 -c "import json,sys; exec(open('${__dirname}/${f}').read()); print(json.dumps(T))"`).toString());
  for (const k in j) dict.set(S[+k], j[k]);
}
// mots isolés en minuscules et abréviations du jour (j → d), absents de l’extraction principale
const LEX = { hommes: 'men', infanterie: 'infantry', artillerie: 'artillery', flotte: 'fleet', passif: 'passive', neutre: 'neutral', commerce: 'trade', revenus: 'income', vivres: 'food', victoire: 'victory', aucun: 'none', inconnu: 'unknown', belliqueux: 'warlike', marchand: 'mercantile', isolationniste: 'isolationist', mystique: 'mystical', expansionniste: 'expansionist', honorable: 'honourable', contemplatif: 'contemplative', opportuniste: 'opportunistic', fanatique: 'fanatical',
  ' %/j': '%/d', ' j)': ' d)', ' j': ' d', ' j, +': ' d, +', ' (+15 💠/j).': ' (+15 💠/d).', ' j</td><td>+': ' d</td><td>+', ' j</td><td>': ' d</td><td>', ' j</td></tr>': ' d</td></tr>', ' j</button>': ' d</button>', ' j</div>': ' d</div>', ' j</div><div>': ' d</div><div>', ' j</td><td class="dim">': ' d</td><td class="dim">', ' km/j (': ' km/d (', ' de ': ' from ', ' sur ': ' on ', ' à <b>': ' in <b>', '</b> à ': '</b> in ', ' à ': ' in ', ' ou ': ' or ' };
for (const k in LEX) if (!dict.has(k)) dict.set(k, LEX[k]);
// chaînes ajoutées après la v7 : dictionnaire direct français → anglais
const TX = JSON.parse(fs.readFileSync(__dirname + '/tx.json', 'utf8')); for (const k in TX) dict.set(k, TX[k]);
fs.mkdirSync(__dirname + '/out', { recursive: true });
let miss = [], done = 0, prot = 0;
const ids = new Set();
for (const m of MODS) { const ast = acorn.parse(fs.readFileSync(`${__dirname}/../src/${m}.js`, 'utf8'), { ecmaVersion: 'latest', sourceType: 'script' }); walk.full(ast, n => { if (n.type === 'Identifier') ids.add(n.name); if (n.type === 'Property' && !n.computed && n.key.type === 'Identifier') ids.add(n.key.name); }); }
const escT = s => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
for (const m of MODS) {
  const src = fs.readFileSync(`${__dirname}/../src/${m}.js`, 'utf8'), ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script' });
  const reps = [];
  walk.full(ast, n => {
    if (n.type === 'Literal' && typeof n.value === 'string' && n.value !== 'use strict') {
      const en = dict.get(n.value); if (en == null) return; if (ids.has(n.value)) { prot++; return; }
      reps.push([n.start, n.end, JSON.stringify(en)]);
    } else if (n.type === 'TemplateElement') {
      const en = dict.get(n.value.cooked); if (en == null) return; reps.push([n.start, n.end, escT(en)]);
    }
  });
  // propriétés écrites comme clés littérales ('Terre': …) : déjà couvertes par les littéraux
  reps.sort((a, b) => b[0] - a[0]); let out = src; for (const [a, b, t] of reps) out = out.slice(0, a) + t + out.slice(b); done += reps.length;
  try { acorn.parse(out, { ecmaVersion: 'latest', sourceType: 'script' }); } catch (e) { console.error('ERREUR de syntaxe après traduction', m, e.message); process.exit(1); }
  fs.writeFileSync(`${__dirname}/out/${m}.js`, out);
}
// page HTML
const H = JSON.parse(cp.execSync(`python3 -c "import json; exec(open('${__dirname}/th.py').read()); print(json.dumps(H))"`).toString()), HS = JSON.parse(fs.readFileSync(__dirname + '/html_strings.json', 'utf8'));
let html = fs.readFileSync(__dirname + '/../src/index.html', 'utf8');
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
for (const k in H) { const fr = HS[+k]; html = html.replace(new RegExp('>(\\s*)' + esc(fr) + '(\\s*)<', 'g'), (_, a, b) => '>' + a + H[k] + b + '<').replace(new RegExp('(title|placeholder|aria-label)="' + esc(fr) + '"', 'g'), (_, a) => a + '="' + H[k].replace(/"/g, '&quot;') + '"'); }
html = html.replace('<html lang="fr">', '<html lang="en">');
fs.writeFileSync(__dirname + '/out/index.html', html);
console.log('remplacements', done, 'protégés (identifiants)', prot, 'entrées', dict.size);
