// extraction des chaînes françaises (littéraux et morceaux de gabarits) de tous les modules
const fs = require('fs'), acorn = require('acorn'), walk = require('acorn-walk');
const MODS = ['defs', 'defs5', 'world', 'engine', 'sys', 'v5', 'strat', 'scn', 'nuc', 'v6', 'v7', 'globe', 'gfx', 'ui', 'enc', 'v6ui', 'v7ui', 'space', 'cheat'];
const isKey = s => /^[a-z0-9_$.#:\-]*$/.test(s) && !/\s/.test(s);   // identifiants internes : jamais traduits
const looksText = s => /[A-Za-zÀ-ÿ]{2,}/.test(s) && !isKey(s.trim()) && !/^(#[0-9a-f]{3,8}|rgba?\(|hsla?\(|[0-9.\s]+(px|%|em)?)$/i.test(s.trim());
const out = new Map();
for (const m of MODS) {
  const src = fs.readFileSync(`${__dirname}/../src/${m}.js`, 'utf8'); let ast;
  try { ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script', allowReturnOutsideFunction: true }); } catch (e) { console.error(m, e.message); continue; }
  walk.full(ast, n => {
    let v = null;
    if (n.type === 'Literal' && typeof n.value === 'string') v = n.value;
    else if (n.type === 'TemplateElement') v = n.value.cooked;
    if (v == null || !looksText(v)) return;
    // ignorer le code CSS et les sélecteurs
    if (/^[\s\S]*\{[^}]*:[^}]*\}[\s\S]*$/.test(v) && /;/.test(v) && !/[àâéèêëîïôûùç]/i.test(v)) return;
    const k = v; if (!out.has(k)) out.set(k, { m, n: 0 }); out.get(k).n++;
  });
}
const arr = [...out.keys()];
fs.writeFileSync(__dirname + '/strings.json', JSON.stringify(arr, null, 0));
console.log('chaînes uniques', arr.length, 'caractères', arr.reduce((s, x) => s + x.length, 0));
