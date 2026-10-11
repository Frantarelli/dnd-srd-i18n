// La barrera de seguridad de las contribuciones: un pull request a este repo solo puede traer
// TRADUCCIONES, nada que se ejecute y nada que se inyecte en la aplicación que las usa.
//
//   node tools/guard.mjs --base <ref> --head <ref> [--maintainer]
//
// Corre en CI (`.github/workflows/guard.yml`, evento `pull_request_target`): el código de ESTE
// archivo es el de la rama principal, nunca el del pull request, y el contenido del pull request
// se LEE con `git show` (nunca se descarga a disco ni se ejecuta). Por eso un pull request no
// puede aflojar la barrera cambiándola.
//
// Qué exige:
//   1. Rutas: solo `data/<idioma>/<catálogo>.json` (idioma distinto de `en`, que es la fuente) y
//      los archivos de un idioma (`tools/langs/<idioma>/…`). Todo lo demás (flujos de trabajo,
//      herramientas, package.json, licencias, documentación) es del mantenedor.
//   2. Tipo de cambio: agregar o modificar. Nada de borrar, renombrar, enlaces simbólicos,
//      submódulos ni archivos ejecutables.
//   3. Contenido de cada JSON de datos: un objeto plano `clave → texto`, con claves que ya
//      existen en el inglés, textos sin HTML, scripts, enlaces, plantillas ni caracteres de
//      control o de dirección de texto invisibles, de un largo razonable y con los mismos
//      `{marcadores}` que el inglés.
//
// El mantenedor (`--maintainer`) salta la regla de rutas, pero su contenido de datos se valida
// igual: un error es un error venga de quien venga.
//
// Sin dependencias: Node puro.

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const CATALOGS = [
  'origin',
  'spells',
  'classes',
  'items',
  'magicitems',
  'monsters',
  'glossary',
  'ui',
  'prose',
];

const LANG = '[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?';
const DATA_FILE = new RegExp(`^data/(${LANG})/(${CATALOGS.join('|')})\\.json$`);
const SOURCE_FILE = new RegExp(`^data/(${LANG})/_source\\.json$`);
const LANG_FILE = new RegExp(`^tools/langs/(${LANG})/(?:guia\\.md|glossary\\.json|glossary-spells\\.json)$`);

const MAX_FILES = 200;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TEXT = 12000;

/** Caracteres que cambian lo que se ve sin cambiar lo que se lee (ataques de «código invisible»). */
const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁠-⁤⁦-⁩﻿]/u;
const HTML = /<\/?[a-zA-Z!][^>]*>?/;
const SCHEME = /\b(?:javascript|vbscript|data|file):/i;
const URL = /(?:https?:\/\/|\bwww\.)\S+/i;
const MD_LINK = /!?\[[^\]]*\]\([^)]*\)/;
const TEMPLATE = /\$\{|\{\{|<%|\{%/;
const PLACEHOLDER = /\{[A-Za-z_][A-Za-z0-9_]*\}/g;

const git = (cwd, ...args) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

/** Las rutas que cambió el pull request, con su tipo y su modo (sin detectar renombres). */
export function changes(cwd, base, head) {
  const out = git(cwd, 'diff', '--raw', '--no-renames', '-z', `${base}...${head}`);
  const parts = out.split('\0').filter(Boolean);
  const list = [];
  // Formato -z: «:modo1 modo2 sha1 sha2 estado» y, aparte, la ruta.
  for (let i = 0; i + 1 < parts.length; i += 2) {
    const meta = (parts[i] ?? '').replace(/^:/, '').split(' ');
    list.push({ oldMode: meta[0], mode: meta[1], status: (meta[4] ?? '')[0], path: parts[i + 1] ?? '' });
  }
  return list;
}

/** ¿Es esta ruta una de las que un colaborador puede tocar? Devuelve el motivo si no. */
export function pathProblem(c, maintainer) {
  if (c.mode === '120000' || c.oldMode === '120000') return 'enlace simbólico';
  if (c.mode === '160000' || c.oldMode === '160000') return 'submódulo';
  if (c.mode !== '000000' && c.mode !== '100644') return `modo de archivo ${c.mode} (solo se admiten archivos normales)`;
  if (maintainer) return null;
  if (c.status === 'D') return 'borrar archivos es del mantenedor';
  if (c.status !== 'A' && c.status !== 'M') return `tipo de cambio «${c.status}» no admitido`;
  const m = DATA_FILE.exec(c.path);
  if (m) return m[1] === 'en' ? 'el inglés es la fuente: lo cambia el mantenedor' : null;
  if (SOURCE_FILE.test(c.path) && !c.path.startsWith('data/en/')) return null;
  if (LANG_FILE.test(c.path)) return null;
  return 'solo se aceptan traducciones (data/<idioma>/…) y los archivos de un idioma (tools/langs/<idioma>/…)';
}

/** Problemas del contenido de un catálogo traducido, contra su inglés. */
export function contentProblems(file, text, english) {
  const problems = [];
  let map;
  try {
    map = JSON.parse(text);
  } catch (e) {
    return [`${file}: no es JSON válido (${e.message})`];
  }
  if (map === null || typeof map !== 'object' || Array.isArray(map))
    return [`${file}: tiene que ser un objeto plano «clave → texto»`];
  for (const [key, value] of Object.entries(map)) {
    const at = `${file} «${key}»`;
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,150}$/.test(key)) {
      problems.push(`${at}: clave con caracteres no permitidos`);
      continue;
    }
    if (english && !(key in english)) problems.push(`${at}: la clave no existe en el inglés`);
    if (typeof value !== 'string') {
      problems.push(`${at}: el valor tiene que ser texto`);
      continue;
    }
    const en = english?.[key] ?? '';
    // Lo que el inglés ya trae (una URL de atribución, un enlace) no es una inyección nueva.
    const inEnglish = (re) => re.test(en);
    if (value.length > MAX_TEXT) problems.push(`${at}: texto de más de ${MAX_TEXT} caracteres`);
    else if (english && value.length > 4 * en.length + 400)
      problems.push(`${at}: el texto es desproporcionado respecto del inglés`);
    if (INVISIBLE.test(value)) problems.push(`${at}: caracteres de control o invisibles`);
    if (HTML.test(value) && !inEnglish(HTML)) problems.push(`${at}: contiene HTML`);
    if (SCHEME.test(value) && !inEnglish(SCHEME)) problems.push(`${at}: contiene un esquema ejecutable (javascript:, data:…)`);
    if (URL.test(value) && !inEnglish(URL)) problems.push(`${at}: contiene un enlace que el inglés no tiene`);
    if (MD_LINK.test(value) && !inEnglish(MD_LINK)) problems.push(`${at}: contiene un enlace o imagen de Markdown que el inglés no tiene`);
    if (TEMPLATE.test(value) && !inEnglish(TEMPLATE)) problems.push(`${at}: contiene una plantilla (\${…}, {{…}})`);
    if (english) {
      const want = [...en.matchAll(PLACEHOLDER)].map((m) => m[0]).sort().join(',');
      const got = [...value.matchAll(PLACEHOLDER)].map((m) => m[0]).sort().join(',');
      if (want !== got) problems.push(`${at}: los marcadores {…} no coinciden con el inglés (${want || 'ninguno'} ≠ ${got || 'ninguno'})`);
    }
  }
  return problems;
}

/**
 * Las reglas de enlazado (`data/<idioma>/prose.json`): para cada término del glosario, las FORMAS
 * literales con que aparece en un texto largo («paralizado | paralizada…»). No son expresiones
 * regulares: la aplicación escapa cada forma, así que no hay código ajeno ni nada que colgar.
 *
 *   <término>.forms    obligatoria: formas separadas por « | » (hasta 40, de 1 a 60 caracteres)
 *   <término>.case     opcional: «exact» si distingue mayúsculas de minúsculas
 *   <término>.before   opcional: la palabra o frase que tiene que ir justo antes
 *   <término>.after    opcional: la palabra o frase que tiene que ir justo después
 */
const FORM = /^[\p{L}\p{N}][\p{L}\p{N} '’.-]{0,59}$/u;
export function proseProblems(file, text, termIds) {
  let map;
  try {
    map = JSON.parse(text);
  } catch {
    return [`${file}: no es JSON válido`];
  }
  const out = [];
  const seen = new Set();
  for (const [key, value] of Object.entries(map)) {
    const m = /^(.+).(forms|case|before|after)$/.exec(key);
    if (!m) {
      out.push(`${file} «${key}»: la clave tiene que ser <término>.forms, .case, .before o .after`);
      continue;
    }
    const [, id, kind] = m;
    if (termIds && !termIds.has(id)) out.push(`${file} «${key}»: «${id}» no es un término del glosario`);
    if (typeof value !== 'string') continue; // lo marca contentProblems
    seen.add(id);
    if (kind === 'case') {
      if (value !== 'exact') out.push(`${file} «${key}»: el único valor admitido es «exact»`);
      continue;
    }
    const items = value.split(' | ').map((x) => x.trim());
    const max = kind === 'forms' ? 40 : 10;
    if (items.length === 0 || items.length > max) out.push(`${file} «${key}»: entre 1 y ${max} formas`);
    for (const it of items)
      if (!FORM.test(it)) out.push(`${file} «${key}»: forma no válida «${it.slice(0, 30)}» (solo letras, números, espacios, apóstrofe, punto y guion; hasta 60 caracteres)`);
  }
  for (const id of seen)
    if (typeof map[`${id}.forms`] !== 'string') out.push(`${file}: «${id}» tiene reglas pero no ${id}.forms`);
  return out;
}

/** El glosario de un idioma trae expresiones regulares (su perfil): se revisan antes de correrlas. */
export function regexProblems(file, text) {
  let g;
  try {
    g = JSON.parse(text);
  } catch {
    return file.endsWith('.json') ? [`${file}: no es JSON válido`] : [];
  }
  const out = [];
  const lists = [g?.profile?.forbidden, g?.profile?.styleWarnings].filter(Array.isArray);
  for (const list of lists)
    for (const r of list) {
      const p = String(r?.pattern ?? '');
      // Cuantificadores anidados: la forma clásica de colgar un motor de expresiones regulares.
      if (p.length > 800 || /\((?:[^()]*[+*][^()]*)\)[+*{]/.test(p))
        out.push(`${file}: expresión regular sospechosa o demasiado larga («${p.slice(0, 40)}…»)`);
      try {
        new RegExp(p, r?.flags ?? 'u');
      } catch {
        out.push(`${file}: expresión regular inválida («${p.slice(0, 40)}»)`);
      }
    }
  return out;
}

/** Los ids de término del glosario (del inglés), para saber a qué términos puede apuntar una regla. */
function glossaryIds(cwd, head, base) {
  const text = readBlob(cwd, head, 'data/en/glossary.json') ?? readBlob(cwd, base, 'data/en/glossary.json');
  if (!text) return null;
  try {
    return new Set(Object.keys(JSON.parse(text)).filter((k) => k.endsWith('.name')).map((k) => k.slice(0, -5)));
  } catch {
    return null;
  }
}

const readBlob = (cwd, ref, path) => {
  try {
    return git(cwd, 'show', `${ref}:${path}`);
  } catch {
    return null;
  }
};

/** Revisa un pull request entero. Devuelve la lista de problemas (vacía = pasa). */
export function review({ cwd = '.', base, head, maintainer = false }) {
  const list = changes(cwd, base, head);
  const problems = [];
  if (list.length === 0) return ['el pull request no cambia ningún archivo'];
  if (list.length > MAX_FILES) return [`demasiados archivos (${list.length} > ${MAX_FILES})`];
  for (const c of list) {
    const why = pathProblem(c, maintainer);
    if (why) {
      problems.push(`${c.path}: ${why}`);
      continue;
    }
    if (c.status === 'D') continue;
    const blob = readBlob(cwd, head, c.path);
    if (blob === null) {
      problems.push(`${c.path}: no se pudo leer`);
      continue;
    }
    if (Buffer.byteLength(blob) > MAX_FILE_BYTES) {
      problems.push(`${c.path}: pesa más de ${MAX_FILE_BYTES / 1024 / 1024} MB`);
      continue;
    }
    const data = DATA_FILE.exec(c.path);
    if (data) {
      if (data[2] === 'prose') problems.push(...proseProblems(c.path, blob, glossaryIds(cwd, head, base)));
      const enText = readBlob(cwd, head, `data/en/${data[2]}.json`) ?? readBlob(cwd, base, `data/en/${data[2]}.json`);
      let english = null;
      try {
        english = enText ? JSON.parse(enText) : null;
      } catch {
        english = null;
      }
      // El inglés lo valida el mantenedor; si no existe, no hay contra qué comparar las claves.
      problems.push(...contentProblems(c.path, blob, data[1] === 'en' || data[2] === 'prose' ? null : english));
    } else if (LANG_FILE.test(c.path) && c.path.endsWith('.json')) problems.push(...regexProblems(c.path, blob));
    else if (LANG_FILE.test(c.path)) {
      if (INVISIBLE.test(blob)) problems.push(`${c.path}: caracteres de control o invisibles`);
    }
  }
  return problems;
}

/** Revisa TODOS los datos de traducción del árbol de trabajo (para `npm run check` y la CI). */
export function reviewTree(root = '.') {
  const fs = process.getBuiltinModule ? process.getBuiltinModule('node:fs') : null;
  return fs ? reviewTreeWith(fs, root) : [];
}

function reviewTreeWith(fs, root) {
  const out = [];
  const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null);
  const ids = (() => {
    const t = read(`${root}/data/en/glossary.json`);
    return t ? new Set(Object.keys(JSON.parse(t)).filter((k) => k.endsWith('.name')).map((k) => k.slice(0, -5))) : null;
  })();
  for (const dir of fs.readdirSync(`${root}/data`, { withFileTypes: true })) {
    if (!dir.isDirectory() || dir.name === 'en') continue;
    for (const c of CATALOGS) {
      const file = `data/${dir.name}/${c}.json`;
      const text = read(`${root}/${file}`);
      if (text === null) continue;
      const enText = read(`${root}/data/en/${c}.json`);
      out.push(...contentProblems(file, text, c === 'prose' || !enText ? null : JSON.parse(enText)));
      if (c === 'prose') out.push(...proseProblems(file, text, ids));
    }
  }
  return out;
}

// ── Línea de comandos ──
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const flag = (n) => {
    const i = args.indexOf(`--${n}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  if (args.includes('--all')) {
    const problems = reviewTree();
    if (problems.length === 0) console.log('guard: todos los datos pasan la barrera.');
    else {
      console.error(`guard: ${problems.length} problema(s):`);
      for (const p of problems.slice(0, 60)) console.error(`  ✗ ${p}`);
      process.exit(1);
    }
    process.exit(0);
  }
  const base = flag('base');
  const head = flag('head');
  if (!base || !head) {
    console.error('uso: node tools/guard.mjs --base <ref> --head <ref> [--maintainer]');
    process.exit(2);
  }
  const problems = review({ base, head, maintainer: args.includes('--maintainer') });
  if (problems.length === 0) {
    console.log('guard: el pull request solo trae traducciones válidas.');
  } else {
    console.error(`guard: ${problems.length} problema(s):`);
    for (const p of problems.slice(0, 60)) console.error(`  ✗ ${p}`);
    if (problems.length > 60) console.error(`  … y ${problems.length - 60} más`);
    process.exit(1);
  }
}
