// Traductor local (Ollama): borrador gratis que pasa por el mismo validador que todo lo demás.
//
//   node tools/local-translate.mjs --in lote.en.json --out lote.es.json [--lang es] [--model qwen2.5:7b-instruct]
//   node tools/local-translate.mjs --test items --count 25      # prueba contra lo ya traducido y revisado
//
// Una entrada por llamada (la estructura de cada texto se valida por separado). Si el validador
// rechaza el resultado, se reintenta pasándole los errores al modelo, hasta MAX_TRIES veces. Lo que
// no pasa se deja FUERA del archivo de salida y se informa: nunca se entrega un texto con errores.
// Un modelo chico puede dar texto que valida y suena raro: la salida es un BORRADOR para revisar.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkEntry } from './validate-lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const I18N = path.resolve(HERE, '../data');
const MAX_TRIES = 3;
const URL = process.env.OLLAMA_URL ?? 'http://localhost:11434/api/chat';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] ?? def) : def;
};
const lang = opt('lang', 'es');
const model = opt('model', 'qwen2.5:7b-instruct');
const readJson = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d);

const gloss = readJson(path.join(HERE, 'langs', lang, 'glossary.json'), null);
if (!gloss) throw new Error(`no hay glosario para «${lang}»`);
gloss.spells = readJson(path.join(HERE, 'langs', lang, 'glossary-spells.json'), {});
const guide = fs.readFileSync(path.join(HERE, 'langs', lang, 'guia.md'), 'utf8');
const LANG_NAME = gloss.name ?? lang;

function terms() {
  const t = gloss.terms ?? {};
  return Object.entries(t)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k} = ${v}`)
    .join('\n');
}

const SYSTEM = `Eres traductor técnico de reglas de Dungeons & Dragons 5.5 (SRD 5.2, 2024) del inglés al idioma «${LANG_NAME}». Devuelves SOLO la traducción, sin comillas ni explicaciones.
Reglas absolutas: conserva todos los números, dados (2d6), CD y bonos; conserva exactamente la estructura (saltos de línea, tablas con | , viñetas "- ", asteriscos de cursiva y negrita); no inventes ni omites nada; si algo no se puede traducir con seguridad, déjalo en inglés entre corchetes [así].

GUÍA DEL IDIOMA:
${guide}

TÉRMINOS FIJOS:
${terms()}`;

// Se lee en streaming: con un texto largo la respuesta completa tarda más que el tiempo de espera
// por defecto de fetch (5 min) y se cortaba antes de empezar; en streaming los datos llegan de a poco.
const NL = String.fromCharCode(10);

async function chat(messages) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      options: { temperature: 0.1, num_ctx: 8192 },
    }),
  });
  if (!res.ok) throw new Error(`Ollama respondió ${res.status}: ${await res.text()}`);
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });
    let nl = buffer.indexOf(NL);
    while (nl >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (line) text += JSON.parse(line).message?.content ?? '';
      nl = buffer.indexOf(NL);
    }
  }
  return text.trim();
}

/** Traduce una entrada; devuelve { text, tries, errors } (text=null si no pasó el validador). */
async function translate(key, en) {
  const kind = key.split('.').pop();
  const messages = [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: `Traduce este texto (campo «${kind}»):\n\n${en}` },
  ];
  let last = '';
  let errors = [];
  for (let tries = 1; tries <= MAX_TRIES; tries++) {
    last = await chat(messages);
    errors = checkEntry(key, en, last, gloss).errors;
    if (errors.length === 0) return { text: last, tries, errors };
    messages.push(
      { role: 'assistant', content: last },
      {
        role: 'user',
        content: `Tu traducción tiene estos errores, corrígela y devuelve SOLO la traducción completa:\n- ${errors.join('\n- ')}`,
      },
    );
  }
  return { text: null, tries: MAX_TRIES, errors, last };
}

async function runBatch(enMap) {
  const out = {};
  const failed = {};
  const t0 = Date.now();
  let i = 0;
  const stats = { ok: 0, firstTry: 0, failed: 0 };
  for (const [key, en] of Object.entries(enMap)) {
    i++;
    const r = await translate(key, en);
    if (r.text === null) {
      stats.failed++;
      failed[key] = { errors: r.errors, last: r.last };
    } else {
      stats.ok++;
      if (r.tries === 1) stats.firstTry++;
      out[key] = r.text;
    }
    process.stderr.write(`\r${i}/${Object.keys(enMap).length} `);
  }
  process.stderr.write('\n');
  return { out, failed, stats, seconds: Math.round((Date.now() - t0) / 1000) };
}

const testCatalog = opt('test', null);
if (testCatalog) {
  // Prueba: toma entradas ya traducidas y revisadas, las vuelve a traducir y compara.
  const en = readJson(path.join(I18N, 'en', `${testCatalog}.json`), {});
  const done = readJson(path.join(I18N, lang, `${testCatalog}.json`), {});
  const count = Number(opt('count', '25'));
  const keys = Object.keys(done).filter((k) => k in en);
  // Mezcla de cortos y largos, determinística.
  const sorted = keys.sort((a, b) => en[a].length - en[b].length);
  const step = Math.max(1, Math.floor(sorted.length / count));
  const pick = sorted.filter((_, i) => i % step === 0).slice(0, count);
  const sample = Object.fromEntries(pick.map((k) => [k, en[k]]));
  const r = await runBatch(sample);
  const same = pick.filter((k) => r.out[k] === done[k]).length;
  console.log(
    JSON.stringify({ model, ...r.stats, identicasALaRevisada: same, segundos: r.seconds }),
  );
  fs.writeFileSync(
    opt('result', path.join(process.env.TEMP ?? '.', 'local-test-result.json')),
    JSON.stringify(
      {
        model,
        stats: r.stats,
        pairs: pick.map((k) => ({
          key: k,
          en: en[k],
          reviewed: done[k],
          local: r.out[k] ?? null,
          failed: r.failed[k] ?? null,
        })),
      },
      null,
      2,
    ),
  );
} else {
  const input = opt('in', null);
  const output = opt('out', null);
  if (!input || !output)
    throw new Error('uso: --in lote.en.json --out lote.es.json  (o --test <catálogo>)');
  const r = await runBatch(readJson(input, {}));
  fs.writeFileSync(output, `${JSON.stringify(r.out, null, 2)}\n`);
  console.log(JSON.stringify({ model, ...r.stats, segundos: r.seconds }));
  if (r.stats.failed)
    console.log(
      `Sin pasar el validador (NO incluidas en la salida): ${Object.keys(r.failed).join(', ')}`,
    );
}
