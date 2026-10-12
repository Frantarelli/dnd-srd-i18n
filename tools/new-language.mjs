// Crea la estructura para sumar un idioma de contenido (pt, fr, ru, de…).
//
//   node tools/cli.mjs new-language pt "Português"
//
// Deja listo, sin tocar código de la app:
//   tools/langs/<código>/glossary.json   perfil + términos del inglés por completar
//   tools/langs/<código>/glossary-spells.json   (vacío: se llena solo con cada lote aprobado)
//   tools/langs/<código>/guia.md          guía de estilo por completar
//   data/<código>/<catálogo>.json   vacíos, para que el idioma ya figure en ESTADO.md
//
// Después: completar el glosario y la guía (puede hacerlo una conversación con el SRD oficial
// de ese idioma a mano) y traducir por lotes con `--lang <código>`. El validador, los lotes, el
// checklist y el cargador de la app ya funcionan con el idioma nuevo.

import fs from 'node:fs';
import path from 'node:path';

const CATALOGS = ['origin', 'spells', 'classes', 'items', 'magicitems', 'monsters', 'glossary'];

/** Perfil por defecto de un idioma nuevo: lo mínimo para validar números y unidades. */
export function defaultProfile() {
  return {
    // Separador decimal y separadores de miles que el idioma usa al escribir números.
    numbers: { decimal: ',', group: ['.', ' ', ' ', ' '] },
    // Unidades imperiales (en la lengua de destino y en inglés) que NO deben quedar tras
    // traducir. Completar con las palabras de pies, millas, libras y pulgadas.
    imperialWords: 'feet|foot|ft\\.?|miles?|pounds?|lbs?\\.?|inch(?:es)?',
    // Abreviaturas de moneda: la clave es la del inglés, el valor la del idioma.
    currency: { gp: '', sp: '', cp: '', ep: '', pp: '' },
    // Errores de registro o de forma propios del idioma: [{ pattern, flags, message }].
    forbidden: [],
    // Avisos de estilo propios del idioma: [{ pattern, flags, message }].
    styleWarnings: [],
    // 'sentence' = mayúscula solo en la primera palabra de un nombre; 'none' = no se controla.
    nameCase: 'none',
    // ¿«1,000» a la inglesa es un error? Sí si el idioma usa coma decimal.
    englishThousandsIsError: true,
  };
}

/** Código válido: dos o tres letras, con región opcional (pt, pt-BR, zh-Hans). */
export function isValidLanguageCode(code) {
  return /^[a-z]{2,3}(?:-[A-Za-z]{2,4})?$/.test(code) && code !== 'en';
}

/**
 * @param {{ code: string, name?: string, langsDir: string, i18nDir: string }} o
 * @returns {string[]} los archivos creados
 */
export function scaffoldLanguage({ code, name, langsDir, i18nDir }) {
  if (!isValidLanguageCode(code)) throw new Error(`código de idioma inválido: ${code}`);
  const dir = path.join(langsDir, code);
  if (fs.existsSync(dir)) throw new Error(`el idioma ya existe: ${dir}`);

  const model = JSON.parse(fs.readFileSync(path.join(langsDir, 'es', 'glossary.json'), 'utf8'));
  const created = [];
  const write = (file, text) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
    created.push(file);
  };

  // Mismos términos y reglas que el modelo, con el destino vacío: el validador salta las reglas
  // cuyo destino está vacío, así que el idioma recién creado valida hasta que se completen.
  const glossary = {
    language: code,
    name: name ?? code,
    profile: defaultProfile(),
    style: [
      `COMPLETAR: reglas de estilo de ${name ?? code} (registro, tratamiento, mayúsculas, convenciones de unidades y monedas).`,
    ],
    terms: Object.fromEntries(Object.keys(model.terms).map((k) => [k, ''])),
    rules: model.rules.map((r) => ({ ...r, es: undefined, target: [] })),
  };
  write(path.join(dir, 'glossary.json'), `${JSON.stringify(glossary, null, 2)}\n`);
  write(path.join(dir, 'glossary-spells.json'), '{}\n');
  write(
    path.join(dir, 'guia.md'),
    [
      `# Guía de traducción — ${name ?? code} (${code})`,
      '',
      'Reglas propias de este idioma. Las que valen para todos (conservar números, dados y estructura;',
      'no inventar; formato de los lotes) están en `prompts/traductor.md`. El modelo a seguir es',
      '`langs/es/guia.md`.',
      '',
      '## Para completar antes de traducir',
      '',
      '- [ ] Registro y tratamiento de la segunda persona.',
      '- [ ] Convención de unidades (¿métrico? ¿cómo se escriben los decimales y los miles?).',
      '- [ ] Abreviaturas de moneda y de PG / CA / CD (o sus equivalentes).',
      '- [ ] Mayúsculas de nombres, condiciones, tipos de daño y términos de reglas.',
      '- [ ] Los términos de `glossary.json` (`terms`), uno por uno, y el destino de cada regla (`rules`).',
      '- [ ] Perfil del validador en `glossary.json` (`profile`): números, unidades, monedas, registro.',
      '',
    ].join('\n'),
  );
  for (const c of [...CATALOGS, 'prose', 'aliases']) write(path.join(i18nDir, code, `${c}.json`), '{}\n');
  return created;
}
