// EJEMPLO (español) — aplica nombres oficiales de hechizo y términos del SRD oficial a los catálogos (con simulacro).
// node …/apply-official-es.cjs [--apply]  (necesita spellalign-final.json en OUT_DIR)
// Variables: SRD_OFFICIAL_RAW (texto del PDF oficial sin -layout), OLD_REPO_DATA (opcional, JSON de Open5e v2),
// OUT_DIR (donde escribe resultados; por defecto la carpeta actual). Adaptar mapas de escuelas/clases al idioma.
const path = require('path');
const OUT_DIR = process.env.OUT_DIR || process.cwd();
const I18N_DIR = path.resolve(__dirname, '../../data');
const OFFICIAL_RAW = process.env.SRD_OFFICIAL_RAW;
const OLD_DATA = process.env.OLD_REPO_DATA;
if (!OFFICIAL_RAW) throw new Error('definí SRD_OFFICIAL_RAW (texto del SRD oficial extraído con pdftotext sin -layout)');
// Alinea el español con el SRD 5.2.1 oficial en español (la regla: el oficial manda).
//   node apply-official.cjs            -> simulacro (cuenta y muestra ejemplos)
//   node apply-official.cjs --apply    -> escribe los cambios
const fs = require('fs');
const APPLY = process.argv.includes('--apply');
const I = I18N_DIR;
const GLOS = path.resolve(__dirname, '../langs/es/glossary-spells.json');
const cats = ['origin', 'spells', 'classes', 'items', 'magicitems', 'monsters'];
const data = {};
for (const c of cats) data[c] = JSON.parse(fs.readFileSync(`${I}/es/${c}.json`, 'utf8'));

const fold = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const up1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const low1 = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const keepCase = (matched, repl) => (matched.charAt(0) === matched.charAt(0).toUpperCase() && matched.charAt(0) !== matched.charAt(0).toLowerCase() ? up1(repl) : low1(repl));
const B = '(?<![\\p{L}\\d])', E = '(?![\\p{L}\\d])';

const stats = {}; const samples = {};
const note = (rule, before, after) => {
  stats[rule] = (stats[rule] || 0) + 1;
  (samples[rule] ??= []);
  if (samples[rule].length < 4) samples[rule].push(`${before} ⇒ ${after}`);
};

// ---------- A. Términos sueltos ----------
const SIMPLE = [
  ['Recuperación (restauración)', new RegExp(`${B}Restauraci[oó]n (infernal|diab[oó]lica|demon[ií]aca|celestial|exaltada|elemental)${E}`, 'giu'), (m, a) => keepCase(m, `recuperación ${a}`)],
  ['Tumulario (aparecido)', new RegExp(`${B}aparecid(o|os)${E}`, 'giu'), (m, a) => keepCase(m, `tumulari${a}`)],
  ['Ghast (necrófago mayor)', new RegExp(`${B}necr[oó]fago(s?) mayor(es)?${E}`, 'giu'), (m, s) => keepCase(m, `ghast${s ? 's' : ''}`)],
  ['Gul (necrófago)', new RegExp(`${B}necr[oó]fago(s?)${E}`, 'giu'), (m, s) => keepCase(m, `gul${s ? 's' : ''}`)],
  ['infrecuente (poco común)', new RegExp(`${B}poco com[uú]n(es)?${E}`, 'giu'), (m, p) => keepCase(m, p ? 'infrecuentes' : 'infrecuente')],
  ['Golpe de tormenta (rayo de tormenta)', new RegExp(`${B}rayo de tormenta${E}`, 'giu'), (m) => keepCase(m, 'golpe de tormenta')],
  ['Acierto: (Impacto:)', /Impacto:/g, () => 'Acierto:'],
];
// impactar -> acertar (formas verbales; "impacto" sustantivo no se toca)
const VERB = { impacta: 'acierta', impactas: 'aciertas', impactan: 'aciertan', impactar: 'acertar', impacte: 'acierte', impactes: 'aciertes', impacten: 'acierten', 'impactó': 'acertó', impactado: 'acertado', impactada: 'acertada', impactados: 'acertados', impactadas: 'acertadas' };
SIMPLE.push(['acertar (impactar)', new RegExp(`${B}(${Object.keys(VERB).join('|')})${E}`, 'giu'), (m) => keepCase(m, VERB[m.toLowerCase()])]);

// ---------- B. Nombres de hechizo ----------
const fin = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'spellalign-final.json'), 'utf8'));
const diff = fin.filter((p) => fold(p.ours) !== fold(p.official));
const MAP = new Map(diff.map((p) => [fold(p.ours), p.official]));
const multi = diff.filter((p) => p.ours.trim().split(/\s+/).length > 1).sort((a, z) => z.ours.length - a.ours.length);
const single = diff.filter((p) => p.ours.trim().split(/\s+/).length === 1);
const alt = (arr) => (arr.length ? arr.join('|') : '(?!)'); // sin nombres por cambiar: una alternativa vacía coincidiría con todo
const reMulti = new RegExp(`${B}(${alt(multi.map((p) => esc(p.ours)))})${E}`, 'giu');
const singleNames = alt(single.map((p) => esc(p.ours)));
const reCtxA = new RegExp(`(conjuros? (?:de |del )?\\*?)(${singleNames})${E}`, 'giu');
const reItalic = new RegExp(`(\\*)(${singleNames})(\\*)`, 'giu');
const reList = /((?:A voluntad|\d\/día(?: cada uno)?|Truco|Trucos|Nivel \d+(?: \(\d+ espacios?\))?)[^:\n]{0,40}:\*{0,2}\s*)([^.\n;]+)/gi;
const lookup = (name) => MAP.get(fold(name));
const rep = (m) => keepCase(m, lookup(m));

function transform(text, cat, key) {
  let t = text;
  for (const [rule, re, fn] of SIMPLE) t = t.replace(re, (...a) => { const r = fn(a[0], a[1], a[2]); if (r !== a[0]) note(rule, a[0], r); return r; });
  if (!(cat === 'spells' && key.endsWith('.name'))) {
    t = t.replace(reMulti, (m) => { const r = rep(m); note('hechizo (varias palabras)', m, r); return r; });
    t = t.replace(reCtxA, (_, pre, nm) => { const r = rep(nm); note('hechizo (tras «conjuro»)', nm, r); return pre + r; });
    t = t.replace(reItalic, (_, a, nm, c) => { const r = rep(nm); note('hechizo (en cursiva)', nm, r); return a + r + c; });
    t = t.replace(reList, (_, label, items) => label + items.split(/(,\s+|\s+y\s+)/).map((it) => {
      const core = it.replace(/^\*|\*$/g, '');
      const hit = lookup(core);
      if (!hit || /,|\sy\s/.test(it)) return it;
      const r = keepCase(core, hit); note('hechizo (en lista de lanzamiento)', core, r);
      return it.replace(core, r);
    }).join(''));
  }
  return t;
}

let changedTexts = 0;
for (const c of cats) for (const k of Object.keys(data[c])) {
  let v = data[c][k];
  if (c === 'spells' && k.endsWith('.name')) {
    const hit = lookup(v);
    if (hit) { note('hechizo (.name)', v, hit); v = hit; }
  } else v = transform(v, c, k);
  if (v !== data[c][k]) { changedTexts++; data[c][k] = v; }
}
console.log({ textosCambiados: changedTexts });
for (const [r, n] of Object.entries(stats)) console.log(`${r.padEnd(40)} ${String(n).padStart(4)}   ej: ${samples[r].join('  |  ')}`);

if (APPLY) {
  for (const c of cats) fs.writeFileSync(`${I}/es/${c}.json`, JSON.stringify(data[c], null, 2) + '\n');
  // glosario de nombres de hechizo (clave: inglés en minúscula)
  const g = JSON.parse(fs.readFileSync(GLOS, 'utf8'));
  let gc = 0;
  for (const p of diff) { const key = p.en.toLowerCase(); if (key in g) { g[key] = p.official; gc++; } }
  fs.writeFileSync(GLOS, JSON.stringify(g, null, 1) + '\n');
  console.log('glosario actualizado:', gc);
}
