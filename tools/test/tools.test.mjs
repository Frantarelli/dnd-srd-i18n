// Pruebas de las herramientas. Sin dependencias: `npm test` (node --test).
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { scaffoldLanguage } from '../new-language.mjs';
import { checkEntry, numbersOf, profileOf } from '../validate-lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');

// Perfiles de ejemplo: el validador no sabe de ningún idioma, todo sale del perfil.
const ru = {
  profile: {
    numbers: { decimal: ',', group: [' ', ' ', ' '] },
    imperialWords: 'фут(?:а|ов)?|мил[ьяи]|фунт(?:а|ов)?|дюйм(?:а|ов)?',
    currency: { gp: 'зм', sp: 'см', cp: 'мм', ep: 'эм', pp: 'пм' },
    forbidden: [],
    styleWarnings: [],
    nameCase: 'none',
    englishThousandsIsError: true,
  },
  rules: [],
};
const pt = {
  profile: {
    numbers: { decimal: ',', group: ['.', ' '] },
    imperialWords: 'p[ée]s?|milhas?|libras?|polegadas?',
    currency: { gp: 'PO', sp: 'PP', cp: 'PC', ep: 'PE', pp: 'PL' },
    forbidden: [{ pattern: '\\bvocês\\b', message: 'tratamiento: use «você» («{match}»)' }],
    styleWarnings: [],
    nameCase: 'sentence',
    englishThousandsIsError: true,
  },
  rules: [],
};

test('números según el perfil del idioma', () => {
  assert.deepEqual(numbersOf('1 000 золотых, 4,5 м', 'ru', profileOf(ru)), ['1000', '4.5']);
  assert.deepEqual(numbersOf('1.000 PO e 4,5 m', 'pt', profileOf(pt)), ['1000', '4.5']);
});

test('conversión de unidades y monedas del idioma (ruso)', () => {
  const ok = checkEntry('x.desc', 'Creatures within 30 feet take 2d6 damage and you gain 5 GP.', 'Существа в пределах 9 м получают 2d6 урона, а вы получаете 5 зм.', ru);
  assert.deepEqual(ok.errors, []);
  assert.match(checkEntry('x.desc', 'Within 30 feet.', 'В пределах 30 футов.', ru).errors.join(), /unidad imperial/);
  assert.match(checkEntry('x.desc', 'It costs 5 GP.', 'Стоит 5 GP.', ru).errors.join(), /moneda/);
});

test('portugués: miles con punto y registro prohibido', () => {
  assert.deepEqual(checkEntry('x.desc', 'It costs 1,000 GP within 30 feet.', 'Custa 1.000 PO a 9 m.', pt).errors, []);
  assert.match(checkEntry('x.desc', 'It costs 1,000 GP.', 'Custa 1,000 PO.', pt).errors.join(), /miles/);
  assert.match(checkEntry('x.desc', 'You and your allies.', 'Vocês e seus aliados.', pt).errors.join(), /você/);
});

test('erratas del SRD en inglés no obligan a falsear la traducción', () => {
  const es = { profile: { numbers: { decimal: ',', group: [] }, imperialWords: 'pies?|millas?', currency: {}, forbidden: [], styleWarnings: [], nameCase: 'none', englishThousandsIsError: false }, rules: [] };
  // "10-footsquare" es una errata del inglés: se lee como 10 pies = 3 m
  assert.deepEqual(checkEntry('x.desc', 'a level, 10-footsquare area', 'una zona plana de 3 m de lado', es).errors, []);
});

test('new-language arma carpetas y plantillas, y no pisa un idioma existente', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'srd-lang-'));
  try {
    const langsDir = path.join(root, 'langs');
    const i18nDir = path.join(root, 'data');
    fs.mkdirSync(i18nDir, { recursive: true });
    fs.cpSync(path.join(ROOT, 'tools/langs/es'), path.join(langsDir, 'es'), { recursive: true });
    const made = scaffoldLanguage({ code: 'pt', name: 'Português', langsDir, i18nDir });
    assert.ok(made.length >= 9);
    for (const c of ['origin', 'spells', 'classes', 'items', 'magicitems', 'monsters'])
      assert.ok(fs.existsSync(path.join(i18nDir, 'pt', `${c}.json`)));
    assert.throws(() => scaffoldLanguage({ code: 'pt', langsDir, i18nDir }), /ya existe/);
    assert.throws(() => scaffoldLanguage({ code: 'EN', langsDir, i18nDir }));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('los datos del repo validan sin errores', () => {
  const out = execFileSync('node', [path.join(ROOT, 'tools/cli.mjs'), 'validate', 'all'], { encoding: 'utf8' });
  assert.match(out, /\[es\] monsters: \d+ textos, 0 errores/);
  assert.doesNotMatch(out, /[1-9]\d* errores/);
});

test('stale: las traducciones corresponden al inglés actual', () => {
  const out = execFileSync('node', [path.join(ROOT, 'tools/cli.mjs'), 'stale'], { encoding: 'utf8' });
  assert.match(out, /corresponden al inglés actual/);
});

test('el validador convierte los alcances «A/B ft» y «N+ feet»', () => {
  assert.deepEqual(numbersOf('range 80/320 ft.', 'en'), ['24', '96']);
  assert.deepEqual(numbersOf('moved 20+ feet straight toward it', 'en'), ['6']);
  assert.deepEqual(numbersOf('moved 30+ feet', 'en'), ['9']);
  // Una cifra suelta sigue igual que antes, y los dados no se tocan.
  assert.deepEqual(numbersOf('reach 5 ft.', 'en'), ['1.5']);
  assert.deepEqual(numbersOf('8 (1d8 + 4) damage within 30 feet', 'en'), ['8', '1d8', '4', '9']);
});
