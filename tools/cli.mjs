// CLI del sistema de traducción por lotes. Agnóstico del idioma: cada comando acepta
// `--lang <código>` (por defecto `es`) y los idiomas se descubren de las carpetas.
//
//   batch <catálogo> [--chars 14000] [--count 1] [--start 1] [--exclude a.json,b.json] [--out DIR]
//       Escribe los próximos lotes SIN traducir (claves que faltan en el idioma), agrupando
//       todas las claves de una misma entrada. Idempotente: sin mergear nada, devuelve
//       siempre los mismos lotes. `--exclude` salta lotes que están en curso.
//   validate <catálogo|all> [--file lote.json] [--warn]
//       Chequea lo traducido contra el inglés. Sale con 1 si hay errores. `all` revisa todos
//       los catálogos de TODOS los idiomas (o de uno con `--lang`).
//   merge <catálogo> <lote.json>
//       Valida el lote y, si no tiene errores, lo suma al archivo del idioma.
//   status
//       Reescribe ESTADO.md (matriz catálogo × idioma) y CHECKLIST.<idioma>.md.
//   fix-names [catálogo|all]
//       Lleva cada cita de un nombre propio del juego a las mayúsculas de su `.name`.
//   glossary-sync
//       Los nombres de hechizo aprobados entran al glosario del idioma.
//   new-language <código> [nombre]
//       Crea la estructura de un idioma nuevo (perfil, glosario por completar, guía, carpeta).

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scaffoldLanguage } from './new-language.mjs';
import { validateMap } from './validate-lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const I18N = path.resolve(HERE, '../data');
const LANGS = path.join(HERE, 'langs');
const CATALOGS = ['origin', 'spells', 'classes', 'items', 'magicitems', 'monsters'];

const args = process.argv.slice(2);
const cmd = args[0];
const flag = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const has = (name) => args.includes(`--${name}`);
const lang = flag('lang', 'es');

const readJson = (f, def) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : def);
const enFile = (c) => path.join(I18N, 'en', `${c}.json`);
const trFile = (l, c) => path.join(I18N, l, `${c}.json`);
const langFile = (c) => trFile(lang, c);
const spellsGlossaryFile = (l) => path.join(LANGS, l, 'glossary-spells.json');

/** El glosario de un idioma: perfil, estilo, términos, reglas y nombres de hechizo. */
function loadGlossary(l) {
  const g = readJson(path.join(LANGS, l, 'glossary.json'), null);
  if (!g) throw new Error(`el idioma «${l}» no tiene glosario: langs/${l}/glossary.json`);
  g.spells = readJson(spellsGlossaryFile(l), {});
  return g;
}

/** Idiomas con carpeta de datos (todos menos el inglés, que es la fuente). */
function targetLanguages() {
  return fs
    .readdirSync(I18N, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== 'en')
    .map((d) => d.name)
    .sort();
}

/** "acid-arrow.desc" → "acid-arrow"; "species.elf.trait.x.name" → "species.elf". */
function entityOf(catalog, key) {
  const parts = key.split('.');
  return catalog === 'origin' ? parts.slice(0, 2).join('.') : (parts[0] ?? key);
}

function save(file, map) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(map, null, 2)}\n`);
}

function printReport(label, r, showWarnings) {
  for (const e of r.errors) console.log(`  ERROR  ${e.key}: ${e.msg}`);
  if (showWarnings) for (const w of r.warnings) console.log(`  aviso  ${w.key}: ${w.msg}`);
  console.log(
    `${label}: ${r.checked} textos, ${r.errors.length} errores, ${r.warnings.length} avisos`,
  );
}

function cmdBatch() {
  const catalog = args[1];
  if (!CATALOGS.includes(catalog)) throw new Error(`catálogo desconocido: ${catalog}`);
  const max = Number(flag('chars', '14000'));
  const count = Number(flag('count', '1'));
  const start = Number(flag('start', '1'));
  const out = flag('out', path.join(os.tmpdir(), 'brandsen-i18n'));
  const en = readJson(enFile(catalog), {});
  const done = readJson(langFile(catalog), {});
  // Lotes que ya están con un traductor o un revisor y todavía no se mergearon:
  // sus claves no se vuelven a ofrecer (si no, dos agentes traducen lo mismo).
  for (const f of flag('exclude', '').split(',').filter(Boolean))
    for (const k of Object.keys(readJson(f, {}))) done[k] = '';

  // Pendientes agrupados por entrada, en el orden del archivo.
  const groups = new Map();
  for (const [k, v] of Object.entries(en)) {
    if (k in done) continue;
    const e = entityOf(catalog, k);
    if (!groups.has(e)) groups.set(e, {});
    groups.get(e)[k] = v;
  }

  fs.mkdirSync(out, { recursive: true });
  const written = [];
  let cur = {};
  let size = 0;
  const flush = () => {
    if (!Object.keys(cur).length) return;
    const n = String(start + written.length).padStart(3, '0');
    const file = path.join(out, `${catalog}-${lang}-${n}.en.json`);
    save(file, cur);
    written.push({ file, keys: Object.keys(cur).length, chars: size });
    cur = {};
    size = 0;
  };
  for (const entry of groups.values()) {
    const chars = Object.values(entry).reduce((n, s) => n + s.length, 0);
    if (size > 0 && size + chars > max) flush();
    if (written.length >= count) break;
    Object.assign(cur, entry);
    size += chars;
  }
  if (written.length < count) flush();
  for (const w of written) console.log(`${w.file}\t${w.keys} textos\t${w.chars} caracteres`);
  console.log(`pendientes: ${groups.size} entradas de ${catalog} (${lang})`);
}

function cmdValidate() {
  const target = args[1];
  const warn = has('warn');
  const file = flag('file');
  if (file) {
    const r = validateMap(readJson(enFile(target), {}), readJson(file, {}), loadGlossary(lang));
    printReport(path.basename(file), r, warn);
    process.exit(r.errors.length ? 1 : 0);
  }
  // `all` sin --lang revisa todos los idiomas; con --lang, solo ese.
  const langs = target === 'all' && !flag('lang') ? targetLanguages() : [lang];
  let bad = 0;
  for (const l of langs) {
    const glossary = loadGlossary(l);
    for (const c of target === 'all' ? CATALOGS : [target]) {
      const tr = readJson(trFile(l, c), {});
      if (!Object.keys(tr).length) continue;
      const r = validateMap(readJson(enFile(c), {}), tr, glossary);
      printReport(`[${l}] ${c}`, r, warn);
      bad += r.errors.length;
    }
  }
  process.exit(bad ? 1 : 0);
}

/**
 * Cada nombre de hechizo traducido y aprobado entra al glosario: los lotes siguientes
 * (y los de clases, objetos y criaturas que lo citan) lo usan tal cual, así el mismo
 * hechizo no se llama de dos maneras.
 */
function syncSpellGlossary(en, tr) {
  const file = spellsGlossaryFile(lang);
  const g = readJson(file, {});
  let added = 0;
  for (const [k, name] of Object.entries(tr)) {
    if (!k.endsWith('.name') || !(k in en)) continue;
    const key = String(en[k]).toLowerCase();
    if (!(key in g)) {
      g[key] = name;
      added++;
    }
  }
  if (added) {
    fs.writeFileSync(file, `${JSON.stringify(g, null, 1)}\n`);
    console.log(`glosario de hechizos (${lang}): +${added} nombres`);
  }
}

/**
 * Un nombre propio del juego (subclase, rasgo, hechizo) se cita en otros textos con
 * las mismas mayúsculas que su `.name`. Esto lleva cada cita de varias palabras a la
 * forma canónica, respetando la primera letra de lo escrito: "Senda del Berserker"
 * pasa a "Senda del berserker" y "mano de bigby" a "mano de Bigby". Idempotente.
 */
function cmdFixNames() {
  const target = args[1] ?? 'all';
  const langs = flag('lang') ? [lang] : targetLanguages();
  let total = 0;
  for (const l of langs) {
    const spellNames = Object.values(loadGlossary(l).spells ?? {});
    for (const c of target === 'all' ? CATALOGS : [target]) {
      const tr = readJson(trFile(l, c), {});
      if (!Object.keys(tr).length) continue;
      const names = new Set(spellNames);
      for (const [k, v] of Object.entries(tr)) if (k.endsWith('.name')) names.add(v);
      const list = [...names]
        .filter((n) => n.split(/\s+/).length >= 2 && n.length >= 8)
        .sort((a, b) => b.length - a.length)
        .map((n) => ({ n, re: new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'giu') }));
      let changed = 0;
      for (const [k, v] of Object.entries(tr)) {
        let s = v;
        for (const { n, re } of list) s = s.replace(re, (m) => (m[0] ?? '') + n.slice(1));
        if (s !== v) {
          tr[k] = s;
          changed++;
        }
      }
      if (changed) save(trFile(l, c), tr);
      console.log(`[${l}] ${c}: ${changed} textos con nombres normalizados`);
      total += changed;
    }
  }
  return total;
}

function cmdMerge() {
  const catalog = args[1];
  const file = args[2];
  const glossary = loadGlossary(lang);
  const en = readJson(enFile(catalog), {});
  const batch = readJson(file, null);
  if (!batch) throw new Error(`no se pudo leer el lote: ${file}`);
  const r = validateMap(en, batch, glossary);
  if (r.errors.length) {
    printReport(`RECHAZADO ${path.basename(file)}`, r, true);
    process.exit(1);
  }
  const done = readJson(langFile(catalog), {});
  const merged = { ...done, ...batch };
  // Mismo orden que el inglés: los diffs de revisión quedan limpios.
  const ordered = {};
  for (const k of Object.keys(en)) if (k in merged) ordered[k] = merged[k];
  save(langFile(catalog), ordered);
  if (catalog === 'spells') syncSpellGlossary(en, ordered);
  console.log(
    `[${lang}] ${catalog}: +${Object.keys(batch).length} textos (${r.warnings.length} avisos). Total ${Object.keys(ordered).length}/${Object.keys(en).length}`,
  );
}

function languageStats(l, glossary) {
  const rows = [];
  for (const c of CATALOGS) {
    const en = readJson(enFile(c), {});
    const tr = readJson(trFile(l, c), {});
    const entities = new Map();
    for (const k of Object.keys(en)) {
      const e = entityOf(c, k);
      const cur = entities.get(e) ?? { total: 0, done: 0 };
      cur.total++;
      if (k in tr) cur.done++;
      entities.set(e, cur);
    }
    const r = validateMap(en, tr, glossary);
    rows.push({
      c,
      en,
      tr,
      entities,
      total: Object.keys(en).length,
      done: Object.keys(tr).length,
      chars: Object.values(en).reduce((n, x) => n + x.length, 0),
      errors: r.errors.length,
      warnings: r.warnings.length,
    });
  }
  return rows;
}

const mark = (r) =>
  r.done === 0 ? '⬜' : r.done === r.total && r.errors === 0 ? '✅' : r.errors > 0 ? '❌' : '🟡';
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)} %` : '—');

function cmdStatus() {
  const langs = targetLanguages();
  const stats = Object.fromEntries(langs.map((l) => [l, languageStats(l, loadGlossary(l))]));

  // ESTADO.md: la matriz catálogo × idioma. Un check solo si está completo Y sin errores.
  const md = [
    '# Estado de las traducciones',
    '',
    'Generado por `node tools/cli.mjs status`. Validar todo: `npm run check`.',
    'El detalle de cada entrada está en `CHECKLIST.<idioma>.md`.',
    '',
    '✅ completo y validado · 🟡 en curso · ⬜ sin empezar · ❌ tiene errores',
    '',
    `| Catálogo | Textos | Caracteres | ${langs.map((l) => l.toUpperCase()).join(' | ')} |`,
    `|---|---:|---:|${langs.map(() => ':---:').join('|')}|`,
    ...CATALOGS.map((c, i) => {
      const first = stats[langs[0] ?? '']?.[i];
      const cells = langs.map((l) => {
        const r = stats[l]?.[i];
        return r ? `${mark(r)} ${pct(r.done, r.total)} (${r.done}/${r.total})` : '—';
      });
      return `| ${c} | ${first?.total ?? 0} | ${first?.chars ?? 0} | ${cells.join(' | ')} |`;
    }),
    '',
    'Errores = lo que la validación rechaza (números que faltan, estructura rota, registro,',
    'unidades sin convertir, términos obligatorios). Para sumar un idioma:',
    '`node tools/cli.mjs new-language <código> "<Nombre>"` y seguir `README.md`.',
    '',
    ...langs.flatMap((l) => [
      `## ${l.toUpperCase()}: validación`,
      '',
      '| Catálogo | Errores | Avisos |',
      '|---|---:|---:|',
      ...(stats[l] ?? []).map((r) => `| ${r.c} | ${r.errors} | ${r.warnings} |`),
      '',
    ]),
  ].join('\n');
  fs.writeFileSync(path.join(I18N, 'ESTADO.md'), md);

  // CHECKLIST.<idioma>.md: una casilla por entrada, marcada cuando está entera traducida.
  for (const l of langs) {
    const out = [
      `# Checklist de traducción (${l})`,
      '',
      'Una casilla por entrada; se marca cuando están traducidos TODOS sus textos.',
      'Generado: no se edita a mano.',
      '',
    ];
    for (const r of stats[l] ?? []) {
      const done = [...r.entities.values()].filter((e) => e.done === e.total).length;
      out.push(`## ${mark(r)} ${r.c} — ${done}/${r.entities.size} entradas`, '');
      for (const [e, v] of r.entities) {
        const nameKey = `${e}.name`;
        const label = r.en[nameKey] ? ` — ${r.en[nameKey]}` : '';
        const t = r.tr[nameKey];
        const trans = t && t !== r.en[nameKey] ? ` → ${t}` : '';
        out.push(`- [${v.done === v.total ? 'x' : ' '}] \`${e}\`${label}${trans}`);
      }
      out.push('');
    }
    fs.writeFileSync(path.join(I18N, `CHECKLIST.${l}.md`), out.join('\n'));
  }
  console.log(md);
}

function cmdNewLanguage() {
  const code = args[1];
  if (!code) throw new Error('uso: new-language <código> [nombre]');
  const created = scaffoldLanguage({ code, name: args[2], langsDir: LANGS, i18nDir: I18N });
  for (const f of created) console.log(`creado  ${path.relative(path.resolve(HERE, '..'), f)}`);
  console.log(
    [
      '',
      `Idioma «${code}» creado. Siguientes pasos:`,
      `  1. Completar tools/langs/${code}/glossary.json (perfil, términos y reglas) y guia.md.`,
      `  2. node tools/cli.mjs batch spells --lang ${code} --out <carpeta>   (lotes a traducir)`,
      `  3. Traducir, validar (validate --lang ${code} --file …), revisar y mergear (merge --lang ${code}).`,
      '  4. node tools/cli.mjs status   (el idioma ya aparece en la matriz y en su checklist).',
    ].join('\n'),
  );
}


// ── Huella del inglés: detectar traducciones que quedaron viejas ────────────
// Cuando el SRD en inglés cambia, hay que saber qué traducciones hay que rehacer.
// `snapshot` guarda, junto a cada idioma, la huella del texto en inglés con el que se tradujo;
// `stale` compara esas huellas con el inglés actual.
const hash = (text) => crypto.createHash('sha1').update(text).digest('hex').slice(0, 10);
const sourceFile = (l) => path.join(I18N, l, '_source.json');

function cmdSnapshot() {
  const langs = has('lang') ? [lang] : targetLanguages();
  for (const l of langs) {
    const out = {};
    for (const c of CATALOGS) {
      const en = readJson(enFile(c), {});
      const tr = readJson(trFile(l, c), {});
      out[c] = Object.fromEntries(Object.keys(tr).filter((k) => k in en).map((k) => [k, hash(en[k])]));
    }
    fs.writeFileSync(sourceFile(l), `${JSON.stringify(out, null, 1)}\n`);
    const n = Object.values(out).reduce((a, m) => a + Object.keys(m).length, 0);
    console.log(`[${l}] huella del inglés guardada para ${n} textos`);
  }
}

function cmdStale() {
  let bad = 0;
  for (const l of has('lang') ? [lang] : targetLanguages()) {
    const snap = readJson(sourceFile(l), null);
    if (!snap) {
      console.log(`[${l}] sin huella: correr «snapshot» primero`);
      continue;
    }
    for (const c of CATALOGS) {
      const en = readJson(enFile(c), {});
      const tr = readJson(trFile(l, c), {});
      const old = snap[c] ?? {};
      const changed = Object.keys(old).filter((k) => k in en && hash(en[k]) !== old[k]);
      const removed = Object.keys(old).filter((k) => !(k in en));
      const added = Object.keys(en).filter((k) => !(k in tr));
      bad += changed.length + removed.length;
      if (changed.length || removed.length || (added.length && Object.keys(tr).length))
        console.log(`[${l}] ${c}: ${changed.length} viejas (el inglés cambió), ${removed.length} sin inglés, ${added.length} sin traducir`);
    }
  }
  if (bad === 0) console.log('Todas las traducciones corresponden al inglés actual.');
  process.exitCode = bad ? 1 : 0;
}

const commands = {
  snapshot: cmdSnapshot,
  stale: cmdStale,
  batch: cmdBatch,
  validate: cmdValidate,
  merge: cmdMerge,
  status: cmdStatus,
  'fix-names': cmdFixNames,
  'new-language': cmdNewLanguage,
  'glossary-sync': () =>
    syncSpellGlossary(readJson(enFile('spells'), {}), readJson(langFile('spells'), {})),
};
if (!commands[cmd]) {
  console.error(`uso: cli.mjs <${Object.keys(commands).join('|')}> …`);
  process.exit(2);
}
commands[cmd]();
