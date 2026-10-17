// La corrida de noche de los resúmenes: la PC arma las tandas, escribe el inglés y lo traduce, sin
// gastar tokens. Reanudable: cada paso deja su archivo al terminar y lo que ya está se saltea, así que se
// puede cortar y volver a lanzar.
//
//   node tools/summary-night.mjs --catalog spells --batches 3 [--count 40] [--model gemma3:12b]
//        [--langs es] [--keys-file prioridad.txt] [--no-legendary] [--out work/summaries]
//
// Por cada tanda deja, en la carpeta de salida:
//   <catálogo>-sum-NNN.src.json   los textos oficiales en inglés (clave .summary → texto)
//   <catálogo>-sum-NNN.en.json    los resúmenes ingleses que pasaron los chequeos
//   <catálogo>-sum-NNN.es.json    los mismos en español (uno por idioma de --langs)
//   *.fuera.json                  lo que no pasó en 3 intentos (lo escribe el verificador, a mano)
// Nada de esto se publica solo: sigue la verificación (prompts/verificador-resumenes.md) y summary-merge.
//
// La PC no se puede suspender durante la noche (docs/MANUAL.md § 3.1).

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] ?? def) : def;
};
const has = (name) => args.includes(`--${name}`);

const catalog = opt('catalog', null);
if (!catalog) throw new Error('uso: summary-night.mjs --catalog <catálogo> [--batches N] [--count 40] [--model] [--langs es]');
const out = path.resolve(opt('out', path.join(ROOT, 'work', 'summaries')));
const batches = Number(opt('batches', '1'));
const count = opt('count', '40');
const model = opt('model', 'gemma3:12b');
const langs = opt('langs', 'es').split(',').filter(Boolean);
fs.mkdirSync(out, { recursive: true });

// Antes de nada, que Ollama esté prendido y tenga el modelo: si no, se corta acá con un mensaje claro y no
// a mitad de la primera tanda (después de reiniciar la PC, Ollama puede no haber arrancado).
const OLLAMA = (process.env.OLLAMA_URL ?? 'http://localhost:11434/api/chat').replace(/\/api\/chat$/, '');
try {
  const res = await fetch(`${OLLAMA}/api/tags`);
  const { models = [] } = await res.json();
  if (!models.some((m) => m.name === model || m.model === model)) {
    console.error(`Ollama no tiene el modelo «${model}». Bajalo con: ollama pull ${model}`);
    process.exit(1);
  }
} catch {
  console.error(`Ollama no responde en ${OLLAMA}. Abrí la aplicación de Ollama (o corré «ollama serve») y volvé a lanzar.`);
  process.exit(1);
}

const node =(script, scriptArgs) =>
  execFileSync(process.execPath, [path.join(HERE, script), ...scriptArgs], { cwd: ROOT, stdio: 'inherit' });

const srcFiles = () =>
  fs
    .readdirSync(out)
    .filter((f) => f.startsWith(`${catalog}-sum-`) && f.endsWith('.src.json'))
    .sort()
    .map((f) => path.join(out, f));

// 1. Tandas nuevas, hasta llegar a --batches sin terminar (lo que ya está en una tanda no se repite).
const unfinished = () => srcFiles().filter((f) => langs.some((l) => !fs.existsSync(f.replace('.src.json', `.${l}.json`))));
const missing = batches - unfinished().length;
if (missing > 0) {
  const existing = srcFiles();
  const start = String(existing.length + 1);
  const batchArgs = ['summary-batch', catalog, '--count', count, '--batches', String(missing), '--start', start, '--out', out];
  if (existing.length) batchArgs.push('--exclude', existing.join(','));
  if (opt('keys-file')) batchArgs.push('--keys-file', opt('keys-file'));
  if (has('no-legendary')) batchArgs.push('--no-legendary');
  node('cli.mjs', batchArgs);
}

// 2. Por cada tanda: el inglés desde el texto oficial; después, cada idioma desde el inglés.
const t0 = Date.now();
for (const src of unfinished()) {
  const en = src.replace('.src.json', '.en.json');
  if (!fs.existsSync(en)) {
    console.log(`\n== ${path.basename(src)} → inglés (${model})`);
    node('local-summarize.mjs', ['--catalog', catalog, '--in', src, '--out', en, '--model', model]);
  }
  for (const l of langs) {
    const tr = src.replace('.src.json', `.${l}.json`);
    if (fs.existsSync(tr)) continue;
    console.log(`\n== ${path.basename(en)} → ${l} (${model})`);
    node('local-summarize.mjs', ['--catalog', catalog, '--lang', l, '--in', en, '--out', tr, '--model', model]);
  }
}
console.log(`\nListo en ${Math.round((Date.now() - t0) / 60000)} min. Tandas en ${out}. Sigue: verificar y summary-merge.`);
