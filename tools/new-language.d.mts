import type { Profile } from './validate-lib.mjs';

export function defaultProfile(): Profile;
export function isValidLanguageCode(code: string): boolean;
/** Crea glosario, guía y carpeta de datos de un idioma nuevo. Devuelve las rutas creadas. */
export function scaffoldLanguage(opts: {
  code: string;
  name?: string;
  langsDir: string;
  i18nDir: string;
}): string[];
