/** Lo que cambia de un idioma a otro: cómo se escriben los números, qué unidades vigilar, etc. */
export interface Profile {
  numbers: { decimal: string; group: string[] };
  /** Fuente de una expresión regular con las palabras de unidades imperiales (pies, millas…). */
  imperialWords: string;
  /** Abreviatura de moneda del inglés → la del idioma (vacía = sin controlar). */
  currency: Record<string, string>;
  /** Errores de registro o forma propios del idioma. `{match}` se reemplaza por lo encontrado. */
  forbidden: { pattern: string; flags?: string; message: string }[];
  /** Avisos de estilo propios del idioma. */
  styleWarnings: { pattern: string; flags?: string; message: string }[];
  nameCase: 'sentence' | 'none';
  englishThousandsIsError: boolean;
  leakIgnore: string[];
}

export interface Glossary {
  language?: string;
  name?: string;
  profile?: Partial<Profile>;
  rules?: {
    label?: string;
    en: string;
    flags?: string;
    /** Formas aceptadas en la traducción (expresiones regulares). Vacío = todavía sin definir. */
    target?: string[];
    /** Nombre viejo de `target`, aceptado por compatibilidad. */
    es?: string[];
    severity?: 'error' | 'warn';
  }[];
  /** Nombre del hechizo en inglés (minúscula) → nombre en el idioma. */
  spells?: Record<string, string>;
}

export const NEUTRAL_PROFILE: Profile;
export function profileOf(glossary: Glossary | undefined): Profile;
export function metricizeEn(text: string): string;
export function numbersOf(text: string, kind: string, profile?: Profile): string[];
export function checkEntry(
  key: string,
  en: string,
  tr: string,
  glossary: Glossary,
): { errors: string[]; warnings: string[] };
export function validateMap(
  enMap: Record<string, string>,
  trMap: Record<string, string>,
  glossary: Glossary,
  opts?: { requireAll?: boolean },
): {
  errors: { key: string; msg: string }[];
  warnings: { key: string; msg: string }[];
  checked: number;
};
