// Resumidor local (Ollama): el borrador de los resúmenes cortos (`<clave>.summary`) lo hace la PC, gratis,
// y cada resultado pasa por los mismos chequeos que todo lo demás (`summary-lib.mjs`).
//
//   Inglés, desde el texto oficial (el lote sale de `cli.mjs summary-batch`):
//     node tools/local-summarize.mjs --catalog spells --in spells-sum-001.src.json --out spells-sum-001.en.json
//   Otro idioma, traduciendo el resumen inglés y chequeándolo contra el texto oficial de ESE idioma:
//     node tools/local-summarize.mjs --catalog spells --lang es --in spells-sum-001.en.json --out spells-sum-001.es.json
//   Prueba contra los ejemplos hechos a mano (cada uno queda fuera de los ejemplos que ve el modelo):
//     node tools/local-summarize.mjs --test [--lang es] [--model qwen2.5:7b-instruct]
//
// Una entrada por llamada. Si el chequeo rechaza el resultado, se reintenta pasándole los errores al
// modelo, hasta MAX_TRIES veces. Lo que no pasa queda FUERA del archivo de salida, en `<salida>.fuera.json`
// con sus errores: nunca se entrega un resumen con errores. Un modelo chico puede escribir algo que pasa los
// chequeos y omite lo importante: la salida es un BORRADOR que verifica una persona o una IA
// (`prompts/verificador-resumenes.md`).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chat } from './ollama.mjs';
import { checkSummary, limitsOf, SKIP, sourceKeyOf, termsOf } from './summary-lib.mjs';
import { checkEntry } from './validate-lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(HERE, '../data');
const MAX_TRIES = 3;
const SHOTS = 8;

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] ?? def) : def;
};
const has = (name) => args.includes(`--${name}`);
const lang = opt('lang', 'en');
const model = opt('model', 'gemma3:12b');
const readJson = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d);
const catalogOf = (c, l) => readJson(path.join(DATA, l, `${c}.json`), {});

const EXAMPLES = readJson(path.join(HERE, 'summary-examples.json'), { examples: [] }).examples;
const terms = { en: termsOf(readJson(path.join(DATA, 'en', 'prose.json'), {})) };
terms[lang] ??= termsOf(readJson(path.join(DATA, lang, 'prose.json'), {}));

let gloss = null;
let guide = '';
if (lang !== 'en') {
  gloss = readJson(path.join(HERE, 'langs', lang, 'glossary.json'), null);
  if (!gloss) throw new Error(`no hay glosario para «${lang}»`);
  gloss.spells = readJson(path.join(HERE, 'langs', lang, 'glossary-spells.json'), {});
  guide = fs.readFileSync(path.join(HERE, 'langs', lang, 'guia.md'), 'utf8');
}
const LANG_NAME = gloss?.name ?? lang;

const lim = limitsOf(lang);

const SYSTEM_EN = `You write the card summary of a Dungeons & Dragons 5e rule text (SRD 5.2.1, 2024 rules) for a Dungeon Master's combat screen. The card shows three short lines; the full text is one hover away.
Absolute rules:
- Use ONLY what the text says. Never add a rule, target, number, condition or damage type that is not in the text, even if you know the game.
- One line, at most ${lim.max} characters (aim for ${lim.target}). No line breaks, tables, bullets or bold. Keep the rule terms as the text writes them (Dexterity saving throw, Prone, Fire damage, Bonus Action).
- Order: what it does → who or what area → which roll (attack, or which saving throw) → main effect (damage, condition, healing). Keep "half on a success" when the text has it.
- Monster attacks: keep the attack bonus, reach or range and the damage dice; drop the average ("5 (1d6 + 2)" → "1d6 + 2").
- Leave out flavor, and details that rarely matter at the table, when they do not fit.
- If it cannot be summarized without losing a rule that decides the outcome, answer only: ${SKIP}
Answer with the summary only, no quotes and no label.`;

const SYSTEM_TR = `Traduces al idioma «${LANG_NAME}» el RESUMEN de un texto de reglas de Dungeons & Dragons 5e (SRD 5.2.1, reglas 2024) para la tarjeta de una pantalla de combate. Te paso el resumen en inglés y el texto oficial completo en ${LANG_NAME}: usa los términos, nombres y unidades del texto oficial.
Reglas absolutas:
- Dice lo mismo que el resumen en inglés: nada más, nada menos. Conserva todos sus números y dados (las distancias, en las unidades del texto oficial).
- Un solo renglón, como mucho ${lim.max} caracteres (apunta a ${lim.target}). Sin saltos de línea, tablas, viñetas ni negrita.
- Ninguna palabra de reglas que el texto oficial no tenga.
Responde solo con el resumen traducido, sin comillas ni etiquetas.

GUÍA DEL IDIOMA:
${guide}`;

/** Lo que el modelo agrega por su cuenta: comillas, «Summary:», espacios. */
function clean(text) {
  let s = text.trim();
  s = s.replace(/^(?:summary|resumen|résumé|resumo)\s*:\s*/i, '');
  s = s.replace(/^["'«“`]+|["'»”`]+$/g, '').trim();
  return s;
}

/** Los ejemplos para el prompt: primero los del mismo catálogo, nunca el que se está probando. */
function shotsFor(catalog, key) {
  const pool = EXAMPLES.filter((e) => e.key !== key && e.en && (lang === 'en' || e[lang]));
  return [...pool.filter((e) => e.catalog === catalog), ...pool.filter((e) => e.catalog !== catalog)].slice(0, SHOTS);
}

function messagesFor(catalog, key, input) {
  const msgs = [{ role: 'system', content: lang === 'en' ? SYSTEM_EN : SYSTEM_TR }];
  for (const e of shotsFor(catalog, key)) {
    const enMap = catalogOf(e.catalog, 'en');
    const srcEn = enMap[sourceKeyOf(e.key, enMap) ?? ''] ?? '';
    if (lang === 'en') {
      msgs.push({ role: 'user', content: `TEXT:\n${srcEn}` }, { role: 'assistant', content: e.en });
    } else {
      const trMap = catalogOf(e.catalog, lang);
      const srcTr = trMap[sourceKeyOf(e.key, trMap) ?? ''] ?? '';
      msgs.push(
        { role: 'user', content: `RESUMEN EN INGLÉS:\n${e.en}\n\nTEXTO OFICIAL:\n${srcTr}` },
        { role: 'assistant', content: e[lang] },
      );
    }
  }
  msgs.push({
    role: 'user',
    content:
      lang === 'en'
        ? `TEXT:\n${input.source}`
        : `RESUMEN EN INGLÉS:\n${input.en}\n\nTEXTO OFICIAL:\n${input.source}`,
  });
  return msgs;
}

/** Los errores de un resultado: contra su texto oficial y, en otro idioma, contra el resumen inglés. */
function problems(key, text, input) {
  const r = checkSummary(text, input.source, { lang, glossary: gloss, terms: terms[lang] }, input.en);
  const errors = [...r.errors];
  if (lang !== 'en') {
    if (text.trim() === SKIP) errors.push('el resumen inglés existe: traducilo, no devuelvas «?»');
    else errors.push(...checkEntry(key, input.en, text, gloss).errors);
  }
  return { errors, warnings: r.warnings };
}

/** Un resumen; devuelve { text, tries, errors, warnings, last } (text=null si no pasó). */
async function summarize(catalog, key, input) {
  const messages = messagesFor(catalog, key, input);
  let last = '';
  let errors = [];
  for (let tries = 1; tries <= MAX_TRIES; tries++) {
    last = clean(await chat(model, messages));
    const p = problems(key, last, input);
    errors = p.errors;
    if (errors.length === 0) return { text: last, tries, errors, warnings: p.warnings };
    // En el piloto, 4 de cada 5 rechazos fueron solo por largo: el modelo tiende a agregar «y además».
    // Se le pide sacar, no reescribir, con el número de caracteres que sobran.
    const onlyLength = errors.every((e) => e.startsWith('largo'));
    const over = [...last].length - lim.target;
    const hint = onlyLength
      ? lang === 'en'
        ? `It is ${over} characters too long. Drop the least important detail (flavor, a duration, a second effect) and keep the roll and the main effect.`
        : `Sobran ${over} caracteres. Saca el detalle menos importante (el adorno, una duración, un segundo efecto) y conserva la tirada y el efecto principal.`
      : '';
    messages.push(
      { role: 'assistant', content: last },
      {
        role: 'user',
        content:
          lang === 'en'
            ? `Your summary has these problems. Fix them and answer with the summary only:\n- ${errors.join('\n- ')}${hint ? `\n${hint}` : ''}`
            : `Tu resumen tiene estos errores. Corrígelos y responde solo con el resumen:\n- ${errors.join('\n- ')}${hint ? `\n${hint}` : ''}`,
      },
    );
  }
  return { text: null, tries: MAX_TRIES, errors, warnings: [], last };
}

/** Lo que necesita cada entrada: el texto oficial del idioma y, si no es inglés, el resumen inglés. */
function inputOf(catalog, key, value) {
  if (lang === 'en') return { source: value };
  const trMap = catalogOf(catalog, lang);
  return { en: value, source: trMap[sourceKeyOf(key, trMap) ?? ''] ?? '' };
}

async function runBatch(catalog, entries) {
  const out = {};
  const failed = {};
  const stats = { ok: 0, firstTry: 0, skipped: 0, failed: 0 };
  const t0 = Date.now();
  let i = 0;
  const total = entries.length;
  for (const [key, input, cat] of entries) {
    i++;
    // Lo que en inglés se decidió no resumir («?») tampoco se resume en otro idioma.
    if (lang !== 'en' && input.en?.trim() === SKIP) {
      out[key] = SKIP;
      stats.skipped++;
      continue;
    }
    const r = await summarize(cat ?? catalog, key, input);
    if (r.text === null) {
      stats.failed++;
      failed[key] = { errors: r.errors, last: r.last };
    } else {
      if (r.text.trim() === SKIP) stats.skipped++;
      else stats.ok++;
      if (r.tries === 1) stats.firstTry++;
      out[key] = r.text;
    }
    process.stderr.write(`\r${i}/${total} `);
  }
  process.stderr.write('\n');
  return { out, failed, stats, seconds: Math.round((Date.now() - t0) / 1000) };
}

if (has('test')) {
  // Prueba: rehace los ejemplos hechos a mano (cada uno sin verse a sí mismo) y los deja lado a lado.
  const pick = EXAMPLES.filter((e) => e.en && (lang === 'en' || e[lang]));
  const entries = pick.map((e) => {
    const map = catalogOf(e.catalog, lang);
    const source = map[sourceKeyOf(e.key, map) ?? ''] ?? '';
    return [e.key, lang === 'en' ? { source } : { en: e.en, source }, e.catalog];
  });
  const r = await runBatch(null, entries);
  const result = {
    model,
    lang,
    stats: r.stats,
    seconds: r.seconds,
    pairs: pick.map((e) => ({ key: e.key, reference: e[lang], local: r.out[e.key] ?? null, failed: r.failed[e.key] ?? null })),
  };
  const file = opt('result', path.join(process.env.TEMP ?? '.', `local-summarize-test-${lang}.json`));
  fs.writeFileSync(file, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({ model, lang, ...r.stats, segundos: r.seconds, resultado: file }));
} else {
  const catalog = opt('catalog', null);
  const input = opt('in', null);
  const output = opt('out', null);
  if (!catalog || !input || !output)
    throw new Error('uso: --catalog <catálogo> --in <lote> --out <salida> [--lang] [--model]  (o --test)');
  const batch = readJson(input, {});
  const entries = Object.entries(batch).map(([k, v]) => [k, inputOf(catalog, k, v)]);
  const r = await runBatch(catalog, entries);
  fs.writeFileSync(output, `${JSON.stringify(r.out, null, 2)}\n`);
  const outFailed = output.replace(/\.json$/, '.fuera.json');
  if (r.stats.failed) fs.writeFileSync(outFailed, `${JSON.stringify(r.failed, null, 2)}\n`);
  else if (fs.existsSync(outFailed)) fs.rmSync(outFailed);
  console.log(JSON.stringify({ model, lang, catalog, ...r.stats, segundos: r.seconds }));
  if (r.stats.failed) console.log(`Sin pasar los chequeos (NO incluidas, ver ${path.basename(outFailed)}): ${Object.keys(r.failed).join(', ')}`);
}
