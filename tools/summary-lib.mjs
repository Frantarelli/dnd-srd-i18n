// Los resúmenes cortos (`<clave>.summary`): qué texto resume cada uno y qué no puede tener. Sin
// dependencias: Node puro.
//
// Un resumen vive en el MISMO catálogo que el texto que resume, con el último tramo de la clave
// cambiado por `summary`:
//   spells     fireball.desc                          → fireball.summary
//   monsters   aboleth.actions.2.desc                 → aboleth.actions.2.summary
//   classes    barbarian.feature.rage.desc            → barbarian.feature.rage.summary
//   origin     species.dwarf.trait.stonecunning.text  → species.dwarf.trait.stonecunning.summary
//
// No hay un resumen oficial del SRD contra el cual comparar: la referencia es siempre el texto
// oficial completo, EN EL MISMO IDIOMA. Lo que este archivo puede ver sin entender el texto:
//   1. que el resumen tenga un texto padre;
//   2. que no traiga ningún número, dado o CD que el texto no tenga (un resumen omite, nunca agrega);
//   3. que no nombre ningún término de reglas (condición, tipo de daño, característica…) que el
//      texto no nombre: las formas salen del catálogo `prose` de cada idioma;
//   4. la forma: un renglón, sin tablas ni viñetas, dentro del largo.
// Lo que no puede ver (si omite lo importante, si cambia el sentido) lo revisa una persona o una IA
// con `prompts/verificador-resumenes.md`.

import { numbersOf, profileOf } from './validate-lib.mjs';

/** Sufijos de los textos que se pueden resumir, en orden de preferencia. */
export const SOURCE_SUFFIXES = ['desc', 'text'];

/** Hasta este largo (en inglés) el texto entero entra en 3 renglones de la tarjeta: no hace falta resumen. */
export const NEEDS_SUMMARY_OVER = 120;

/** Largo del resumen: el objetivo (aviso) y el tope (error). El inglés es más compacto. */
export const LIMITS = {
  en: { target: 115, max: 130 },
  other: { target: 135, max: 150 },
};

export const limitsOf = (lang) => (lang === 'en' ? LIMITS.en : LIMITS.other);

/** El marcador de «no se puede resumir sin perder una regla»: la tarjeta cae al texto completo. */
export const SKIP = '?';

/** ¿Es una clave de resumen? */
export const isSummaryKey = (key) => key.endsWith('.summary');

/** `fireball.summary` → `fireball.desc` (o `.text`), si existe en el mapa. */
export function sourceKeyOf(summaryKey, map) {
  const base = summaryKey.slice(0, -'.summary'.length);
  for (const s of SOURCE_SUFFIXES) if (`${base}.${s}` in map) return `${base}.${s}`;
  return null;
}

/** `fireball.desc` → `fireball.summary`; null si la clave no es un texto resumible. */
export function summaryKeyOf(sourceKey) {
  const m = /^(.*)\.(desc|text)$/.exec(sourceKey);
  return m ? `${m[1]}.summary` : null;
}

/**
 * Los textos de un catálogo inglés que necesitan resumen: resumibles, largos y sin resumen todavía.
 * @param {Record<string,string>} en
 * @param {(key: string) => boolean} [filter] para elegir qué partes (p. ej. sin legendarias)
 * @returns {{ summaryKey: string, sourceKey: string, text: string }[]}
 */
export function pending(en, filter = () => true) {
  const out = [];
  for (const [k, v] of Object.entries(en)) {
    const sk = summaryKeyOf(k);
    if (!sk || sk in en || !filter(k)) continue;
    if (v.length <= NEEDS_SUMMARY_OVER) continue;
    out.push({ summaryKey: sk, sourceKey: k, text: v });
  }
  return out;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Los términos de reglas de un idioma, desde su catálogo `prose`: `{ id, re }` por término, con
 * todas sus formas («Prone», «saving throw | saving throws»). `.case: exact` respeta mayúsculas.
 */
export function termsOf(prose) {
  const out = [];
  for (const [k, v] of Object.entries(prose ?? {})) {
    if (!k.endsWith('.forms')) continue;
    const id = k.slice(0, -'.forms'.length);
    const forms = String(v)
      .split('|')
      .map((f) => f.trim())
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);
    if (!forms.length) continue;
    const flags = prose[`${id}.case`] === 'exact' ? 'u' : 'iu';
    out.push({
      id,
      re: new RegExp(`(?<![\\p{L}])(?:${forms.map(escapeRe).join('|')})(?![\\p{L}])`, flags),
    });
  }
  return out;
}

/** Los ids de los términos de reglas que nombra un texto. */
export function termsIn(text, terms) {
  return new Set(terms.filter((t) => t.re.test(text)).map((t) => t.id));
}

/**
 * Chequea un resumen contra el texto que resume, en el mismo idioma.
 * @param {string} summary
 * @param {string} source el texto oficial completo
 * @param {{ lang: string, glossary?: object, terms?: {id: string, re: RegExp}[] }} ctx
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function checkSummary(summary, source, ctx) {
  const errors = [];
  const warnings = [];
  const { lang } = ctx;
  if (typeof summary !== 'string' || summary.trim() === '') return { errors: ['vacío'], warnings };
  if (summary.trim() === SKIP) return { errors, warnings };
  if (typeof source !== 'string' || source.trim() === '')
    return { errors: ['no hay texto completo que resumir'], warnings };

  // 4. Forma.
  const lim = limitsOf(lang);
  const len = [...summary].length;
  if (len > lim.max) errors.push(`largo: ${len} caracteres (el tope es ${lim.max})`);
  else if (len > lim.target) warnings.push(`largo: ${len} caracteres (el objetivo es ${lim.target})`);
  if (len >= [...source].length) errors.push('el resumen no es más corto que el texto completo');
  if (/\n/.test(summary)) errors.push('salto de línea: un resumen es un solo renglón');
  if (/\|/.test(summary)) errors.push('tabla: un resumen no lleva tablas');
  if (/^\s*[-*] /.test(summary)) errors.push('viñeta: un resumen no lleva viñetas');
  if (/\*\*|__/.test(summary)) errors.push('negrita: un resumen no la lleva (la cursiva *…* solo para nombres de hechizo)');
  if (summary !== summary.trim()) errors.push('espacios al principio o al final');
  if (/[{}<>]/.test(summary)) errors.push('caracteres no permitidos ({ } < >)');

  // 2. Ningún número nuevo: los del resumen son un subconjunto de los del texto (mismo idioma).
  const kind = lang === 'en' ? 'en' : 'tr';
  const profile = profileOf(ctx.glossary);
  const have = new Set(numbersOf(source, kind, profile));
  const extra = [...new Set(numbersOf(summary, kind, profile))].filter((n) => !have.has(n));
  if (extra.length) errors.push(`números que el texto no tiene: ${extra.join(', ')}`);

  // 3. Ningún término de reglas nuevo.
  if (ctx.terms?.length) {
    const inSource = termsIn(source, ctx.terms);
    const added = [...termsIn(summary, ctx.terms)].filter((id) => !inSource.has(id));
    if (added.length) errors.push(`términos de reglas que el texto no nombra: ${added.join(', ')}`);
  }

  return { errors, warnings };
}

/**
 * Chequea todos los resúmenes de un mapa (un catálogo entero o un lote) contra los textos del idioma.
 * @param {Record<string,string>} summaries claves `.summary`
 * @param {Record<string,string>} texts el catálogo del idioma (de ahí salen los textos completos)
 */
export function checkSummaries(summaries, texts, ctx) {
  const errors = [];
  const warnings = [];
  let checked = 0;
  for (const [key, value] of Object.entries(summaries)) {
    if (!isSummaryKey(key)) continue;
    checked++;
    const src = sourceKeyOf(key, texts);
    if (!src) {
      errors.push({ key, msg: 'no hay texto padre (.desc / .text) para este resumen' });
      continue;
    }
    const r = checkSummary(value, texts[src], ctx);
    for (const msg of r.errors) errors.push({ key, msg });
    for (const msg of r.warnings) warnings.push({ key, msg });
  }
  return { errors, warnings, checked };
}
