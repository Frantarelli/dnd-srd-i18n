// Validador determinístico de traducciones. Sin dependencias: Node puro.
//
// Es la red de seguridad de la traducción automática: ninguna traducción entra a
// los archivos de idioma sin pasar por acá, y `npm run i18n:check` lo vuelve a
// correr sobre todo lo que hay. Mira lo que una traducción NO puede perder o
// inventar sin que nadie lo note: números, dados, CD, estructura markdown,
// unidades, monedas, terminología y registro.
//
// Es agnóstico del idioma: lo que cambia de una lengua a otra (cómo se escriben los
// decimales, qué unidades imperiales hay que vigilar, las abreviaturas de moneda, los
// errores de registro) sale del PERFIL que cada idioma trae dentro de su glosario
// (`langs/<idioma>/glossary.json` → `profile`). Un idioma nuevo no toca este archivo.
//
// Formato de datos: un JSON plano por idioma y catálogo, clave → texto.
//   i18n/en/spells.json   { "acid-arrow.name": "Acid Arrow", "acid-arrow.desc": "…" }
//   i18n/es/spells.json   { "acid-arrow.name": "Flecha ácida", … }
// Sumar un idioma (ru, pt…) es sumar una carpeta con el mismo formato.

const FT_TO_M = 0.3;
const MI_TO_KM = 1.5;
const LB_TO_KG = 0.5;
const IN_TO_CM = 2.5;

/** 4,5 · 9 · 1,5 — redondeado a un decimal, con punto (la comparación es interna). */
const dot = (n) => String(Math.round(n * 10) / 10);

/**
 * Perfil neutro: lo que vale si un glosario no trae `profile`. Cada idioma lo completa.
 * @typedef {{
 *   numbers: { decimal: string, group: string[] },
 *   imperialWords: string,
 *   currency: Record<string, string>,
 *   forbidden: { pattern: string, flags?: string, message: string }[],
 *   styleWarnings: { pattern: string, flags?: string, message: string }[],
 *   nameCase: 'sentence' | 'none',
 *   englishThousandsIsError: boolean,
 *   leakIgnore: string[],
 * }} Profile
 */
export const NEUTRAL_PROFILE = {
  numbers: { decimal: ',', group: ['.', ' ', ' ', ' '] },
  imperialWords: 'feet|foot|ft\\.?|miles?|pounds?|lbs?\\.?|inch(?:es)?',
  currency: {},
  forbidden: [],
  styleWarnings: [],
  nameCase: 'none',
  englishThousandsIsError: true,
  leakIgnore: [],
};

/** El perfil efectivo de un glosario (lo que falte, del neutro). */
export function profileOf(glossary) {
  const p = glossary?.profile ?? {};
  return {
    ...NEUTRAL_PROFILE,
    ...p,
    numbers: { ...NEUTRAL_PROFILE.numbers, ...(p.numbers ?? {}) },
  };
}

/**
 * Pasa las unidades imperiales del inglés a las métricas que la traducción debe traer,
 * para poder comparar números. 30 feet → 9, 15-foot → 4.5, 1 mile → 1.5, 10 pounds → 5.
 */
export function metricizeEn(text) {
  // Los dados se protegen: en "2d12 miles" el 12 es parte del dado, no una cantidad de millas.
  const dice = [];
  const protectedText = text.replace(/\d+d\d+/gi, (m) => {
    dice.push(m);
    return `@@${dice.length - 1}@@`;
  });
  return convertUnits(protectedText).replace(/@@(\d+)@@/g, (_, i) => dice[Number(i)] ?? '');
}

function convertUnits(text) {
  return (
    text
      // Los galones se conservan y la conversión va entre paréntesis ("10 galones (38 litros)"): el
      // inglés espera las dos cifras. 1 galón estadounidense = 3,785 litros.
      .replace(/(\d+)(?:-| )gallons?(?![a-z])/gi, (_, n) => `${n} ${Math.round(Number(n) * 3.785)}`)
      .replace(/foothigh/gi, 'foot high')
      .replace(/footby/gi, 'foot by')
      .replace(/footsquare/gi, 'foot square')
      .replace(/footlong/gi, 'foot long') // errata del SRD en inglés (feather-token-*: "50-footlong boat")
      .replace(/\b1 0\.5 pints\b/gi, '1.5 pints') // errata del SRD en inglés (bottle-glass)
      .replace(/(\d+)(?:-| )?cubic (?:feet|foot)(?![a-z])/gi, (_, n) =>
        String(Math.round(Number(n) * 28.3)),
      )
      .replace(/(\d[\d,]*)(?:-| )?(?:square feet|square foot|sq\.? ?ft\.?)(?![a-z])/gi, (_, n) =>
        String(Math.round(Number(n.replace(/,/g, '')) * 9) / 100),
      )
      .replace(/(\d+)\/(\d+)(?:-| )?inch(?:es)?(?![a-z])/gi, (_, a, b) =>
        String(Math.round((Number(a) / Number(b)) * IN_TO_CM * 100) / 100),
      )
      // Alcance con dos cifras ("80/320 ft"): las dos pasan a metros ("24/96"), no solo la última.
      .replace(
        /(\d+)\/(\d+)(?:-| )?(?:feet|foot|ft\.?)(?![a-z])/gi,
        (_, a, b) => `${dot(Number(a) * FT_TO_M)}/${dot(Number(b) * FT_TO_M)}`,
      )
      // "30+ feet" ("se movió 30 pies o más"): el signo + corta la unidad del número.
      .replace(
        /(\d+)\+(?:-| )?(?:feet|foot|ft\.?)(?![a-z])/gi,
        (_, n) => `${dot(Number(n) * FT_TO_M)}+`,
      )
      .replace(
        /(\d+) (to|or) (\d+)(?:-| )?(?:feet|foot|ft\.?)(?![a-z])/gi,
        (_, a, w, b) => `${dot(Number(a) * FT_TO_M)} ${w} ${dot(Number(b) * FT_TO_M)}`,
      )
      .replace(
        /(\d+)([–-])(\d+)(?:-| )?(?:feet|foot|ft\.?)(?![a-z])/gi,
        (_, a, sep, b) => `${dot(Number(a) * FT_TO_M)}${sep}${dot(Number(b) * FT_TO_M)}`,
      )
      .replace(/(\d+)(?:-| )?cubic inch(?:es)?(?![a-z])/gi, (_, n) =>
        String(Math.round(Number(n) * 16.4)),
      )
      .replace(/(\d[\d,]*(?:\.\d+)?)(?:-| )?inch(?:es)?(?![a-z])/gi, (_, n) =>
        dot(Number(n.replace(/,/g, '')) * IN_TO_CM),
      )
      .replace(/(\d[\d,]*(?:\.\d+)?)(?:-| )?(?:feet|foot|ft\.?)(?![a-z])/gi, (_, n) =>
        dot(Number(n.replace(/,/g, '')) * FT_TO_M),
      )
      .replace(/(\d[\d,]*(?:\.\d+)?)(?:-| )?miles?\b/gi, (_, n) =>
        dot(Number(n.replace(/,/g, '')) * MI_TO_KM),
      )
      .replace(/(\d[\d,]*(?:\.\d+)?)(?:-| )?(?:pounds?|lbs?\.?)(?![a-z])/gi, (_, n) =>
        dot(Number(n.replace(/,/g, '')) * LB_TO_KG),
      )
  );
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Normaliza separadores de miles y decimales para comparar números entre idiomas. */
function normalizeNumbers(text, kind, profile) {
  if (kind === 'en') return text.replace(/(\d),(\d{3})(?!\d)/g, '$1$2');
  const { decimal, group } = profile.numbers;
  const groups = group.filter((g) => g !== decimal).map(escapeRe);
  let s = text;
  if (groups.length)
    s = s.replace(new RegExp(`(\\d)(?:${groups.join('|')})(\\d{3})(?!\\d)`, 'g'), '$1$2');
  if (decimal !== '.') s = s.replace(new RegExp(`(\\d)${escapeRe(decimal)}(\\d)`, 'g'), '$1.$2');
  return s;
}

/**
 * Los tokens numéricos (dados incluidos) de un texto, ya normalizados.
 * `kind`: 'en' para el original; cualquier otro valor ('es', 'tr'…) para una traducción.
 */
export function numbersOf(text, kind, profile = NEUTRAL_PROFILE) {
  const base = kind === 'en' ? metricizeEn(text) : text;
  const s = normalizeNumbers(base, kind, profile);
  return (s.match(/\d+d\d+|\d+(?:\.\d+)?/gi) ?? []).map((t) => t.toLowerCase());
}

function countBy(arr) {
  const m = new Map();
  for (const x of arr) m.set(x, (m.get(x) ?? 0) + 1);
  return m;
}

const STOP_EN = new Set(
  (
    'the and you your with that which until when each creature damage target spell within must ' +
    'can cannot have are is it its their this these those from into than then also another ' +
    'any all one two'
  ).split(' '),
);

/** Estructura markdown que una traducción debe conservar tal cual. */
function structure(text) {
  const lines = text.split('\n');
  return {
    lines: lines.length,
    tableCells: lines.filter((l) => l.startsWith('|')).map((l) => (l.match(/\|/g) ?? []).length),
    bullets: lines.filter((l) => /^\s*[-*] /.test(l)).length,
    asterisks: (text.match(/\*/g) ?? []).length,
  };
}

/** Las reglas del glosario que aplican, con su destino (o `es` en los glosarios viejos). */
const targetsOf = (rule) => rule.target ?? rule.es ?? [];

/**
 * Chequea un texto traducido contra su original.
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function checkEntry(key, en, tr, glossary) {
  const errors = [];
  const warnings = [];
  const profile = profileOf(glossary);
  const isName = key.endsWith('.name');

  if (typeof tr !== 'string' || tr.trim() === '') {
    return { errors: ['vacío'], warnings };
  }
  if (en.trim() !== '' && tr.trim() === en.trim() && !isName && en.length > 25) {
    errors.push('idéntico al inglés (sin traducir)');
  }

  // 1. Números, dados, CD: ninguno del original puede perderse.
  const enNums = countBy(numbersOf(en, 'en', profile));
  const trNums = countBy(numbersOf(tr, 'tr', profile));
  const missing = [];
  // Menos de 1 m se escribe en centímetros: 1 pie = 0,3 m = 30 cm, 0,5 pie = 15 cm.
  const asCm = (n) => String(Math.round(Number(n) * 100));
  // Una conversión con decimales se acepta redondeada ("0,625" ↔ "0,6", "1,25" ↔ "1,3"):
  // el SRD no tiene esa precisión, y exigirla empujaba a los traductores a escribir "0,63 cm".
  const isPlain = (t) => /^\d+(?:\.\d+)?$/.test(t);
  const near = (n, map) =>
    n.includes('.') &&
    isPlain(n) &&
    [...map.keys()].some((k) => isPlain(k) && Math.abs(Number(k) - Number(n)) <= 0.06);
  for (const [n, c] of enNums) {
    if ((trNums.get(n) ?? 0) >= c) continue;
    if (/^0\.\d+$/.test(n) && (trNums.get(asCm(n)) ?? 0) >= c) continue;
    if (near(n, trNums)) continue;
    missing.push(n);
  }
  if (missing.length) errors.push(`números/dados que faltan o cambiaron: ${missing.join(', ')}`);
  const extra = [];
  for (const [n, c] of trNums) {
    if ((enNums.get(n) ?? 0) >= c) continue;
    if (/^\d{2}$/.test(n) && (enNums.get((Number(n) / 100).toString()) ?? 0) >= c) continue;
    if (near(n, enNums)) continue;
    extra.push(n);
  }
  if (extra.length) warnings.push(`números extra en la traducción: ${extra.join(', ')}`);

  // 2. Unidades: nada imperial; monedas en las abreviaturas del idioma.
  const imperial = new RegExp(
    `(?<![\\p{L}\\d])\\d+(?:[.,]\\d+)?\\s*(?:${profile.imperialWords})(?![\\p{L}])`,
    'iu',
  );
  if (imperial.test(tr)) errors.push('unidad imperial sin convertir (pies/millas/libras/pulgadas)');
  if (/(?<![\p{L}])(?:feet|foot|miles?|pounds?)(?![\p{L}])/iu.test(tr))
    errors.push('unidad en inglés (feet/miles/pounds)');
  if (
    profile.englishThousandsIsError &&
    profile.numbers.decimal === ',' &&
    /(?<![\d,.])\d{1,3},\d{3}(?!\d)/.test(tr)
  )
    errors.push(
      'separador de miles a la inglesa («1,000» se lee 1 con coma decimal): escribe 1000',
    );
  const targetCodes = new Set(Object.values(profile.currency).filter(Boolean));
  const coin = (code) => new RegExp(`\\d\\s*${escapeRe(code)}(?![\\p{L}])`, 'iu');
  for (const [enCode, trCode] of Object.entries(profile.currency)) {
    if (!trCode) continue;
    if (coin(enCode).test(en) && !coin(trCode).test(tr))
      errors.push(`moneda: «${enCode.toUpperCase()}» debe escribirse «${trCode}»`);
    if (!targetCodes.has(enCode) && coin(enCode).test(tr))
      errors.push(`moneda en inglés («${enCode}»): usa «${trCode}»`);
  }

  // 3. Estructura: saltos de línea, tablas, viñetas, énfasis.
  if (en.trim() !== '') {
    const a = structure(en);
    const b = structure(tr);
    if (a.lines !== b.lines)
      errors.push(`saltos de línea: ${a.lines} en inglés, ${b.lines} en la traducción`);
    if (JSON.stringify(a.tableCells) !== JSON.stringify(b.tableCells))
      errors.push(`tabla distinta (celdas por fila: ${a.tableCells} vs ${b.tableCells})`);
    if (a.bullets !== b.bullets) errors.push(`viñetas: ${a.bullets} vs ${b.bullets}`);
    if (a.asterisks !== b.asterisks) errors.push(`énfasis (*): ${a.asterisks} vs ${b.asterisks}`);
  }

  // 4. Fuga de inglés.
  const ignore = new Set(profile.leakIgnore);
  const words = tr.toLowerCase().match(/[\p{L}']+/gu) ?? [];
  const leaks = [...new Set(words.filter((w) => STOP_EN.has(w) && !ignore.has(w)))];
  if (leaks.length >= 3)
    errors.push(`parece sin traducir (palabras en inglés: ${leaks.join(', ')})`);
  else if (leaks.length) warnings.push(`palabras en inglés: ${leaks.join(', ')}`);

  // 5. Registro y forma propios del idioma (errores) y avisos de estilo.
  for (const f of profile.forbidden) {
    const m = tr.match(new RegExp(f.pattern, f.flags ?? 'iu'));
    if (m) errors.push(f.message.replace('{match}', m[0]));
  }
  for (const w of profile.styleWarnings) {
    const m = tr.match(new RegExp(w.pattern, w.flags ?? 'u'));
    if (m) warnings.push(w.message.replace('{match}', m[1] ?? m[0]));
  }

  // 6. Largo.
  if (en.length >= 60) {
    const r = tr.length / en.length;
    if (r < 0.6 || r > 1.9)
      warnings.push(`largo sospechoso (la traducción mide ${Math.round(r * 100)}% del inglés)`);
  }

  // 7. Terminología del glosario. Una regla sin destino todavía (idioma recién creado) se salta.
  for (const rule of glossary.rules ?? []) {
    const targets = targetsOf(rule);
    if (!targets.length) continue;
    if (!new RegExp(rule.en, rule.flags ?? '').test(en)) continue;
    if (!targets.some((p) => new RegExp(p, 'iu').test(tr))) {
      const msg = `glosario: «${rule.label ?? rule.en}» debe traducirse como ${targets.join(' | ')}`;
      (rule.severity === 'error' ? errors : warnings).push(msg);
    }
  }

  // 8. Nombres de hechizo en cursiva: salen del glosario del idioma.
  for (const m of en.matchAll(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g)) {
    const name = (m[1] ?? '').replace(/[.,;:]$/, '');
    const known = glossary.spells?.[name.toLowerCase()];
    if (known && !tr.toLowerCase().includes(`*${known.toLowerCase()}`))
      errors.push(`hechizo «${name}» debe llamarse «${known}» (glosario)`);
  }

  // 9. Nombres: mayúscula solo en la primera palabra (si el idioma lo pide).
  if (isName && profile.nameCase === 'sentence') {
    const rest = tr
      .split(/\s+/)
      .slice(1)
      .filter((w) => /^\p{Lu}\p{Ll}/u.test(w));
    if (rest.length) warnings.push(`nombre con mayúsculas de más: ${rest.join(' ')}`);
  }

  return { errors, warnings };
}

/**
 * Valida un mapa clave→texto contra el original.
 * @param {Record<string,string>} enMap
 * @param {Record<string,string>} trMap
 * @param {{ requireAll?: boolean }} opts requireAll: toda clave del inglés debe estar.
 */
export function validateMap(enMap, trMap, glossary, opts = {}) {
  const errors = [];
  const warnings = [];
  for (const key of Object.keys(trMap)) {
    if (!(key in enMap)) errors.push({ key, msg: 'clave que no existe en el inglés' });
  }
  if (opts.requireAll) {
    for (const key of Object.keys(enMap))
      if (!(key in trMap)) errors.push({ key, msg: 'falta la traducción' });
  }
  for (const [key, tr] of Object.entries(trMap)) {
    const en = enMap[key];
    if (en === undefined) continue;
    const r = checkEntry(key, en, tr, glossary);
    for (const msg of r.errors) errors.push({ key, msg });
    for (const msg of r.warnings) warnings.push({ key, msg });
  }
  return { errors, warnings, checked: Object.keys(trMap).length };
}
