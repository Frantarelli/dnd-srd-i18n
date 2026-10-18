// Pruebas de los resúmenes cortos (`<clave>.summary`). Sin dependencias: `npm test` (node --test).
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  checkSummary,
  pending,
  sourceKeyOf,
  summaryKeyOf,
  termsOf,
} from '../summary-lib.mjs';
import { checkEntry } from '../validate-lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const readJson = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const esGlossary = { ...readJson('tools/langs/es/glossary.json'), spells: readJson('tools/langs/es/glossary-spells.json') };
const ctx = {
  en: { lang: 'en', glossary: null, terms: termsOf(readJson('data/en/prose.json')) },
  es: { lang: 'es', glossary: esGlossary, terms: termsOf(readJson('data/es/prose.json')) },
};
const FIREBALL_EN = readJson('data/en/spells.json')['fireball.desc'];
const FIREBALL_ES = readJson('data/es/spells.json')['fireball.desc'];

test('la clave del resumen y la de su texto', () => {
  assert.equal(summaryKeyOf('fireball.desc'), 'fireball.summary');
  assert.equal(summaryKeyOf('species.dwarf.trait.stonecunning.text'), 'species.dwarf.trait.stonecunning.summary');
  assert.equal(summaryKeyOf('fireball.name'), null);
  assert.equal(sourceKeyOf('aboleth.actions.2.summary', { 'aboleth.actions.2.desc': 'x' }), 'aboleth.actions.2.desc');
  assert.equal(sourceKeyOf('nada.summary', {}), null);
});

test('pending: solo los textos largos sin resumen', () => {
  const long = 'x'.repeat(200);
  const en = { 'a.desc': long, 'a.summary': 'ya', 'b.desc': 'corto', 'c.desc': long, 'c.name': long };
  assert.deepEqual(pending(en).map((p) => p.summaryKey), ['c.summary']);
});

test('un resumen fiel pasa, en los dos idiomas', () => {
  const en = 'Each creature in a 20-foot-radius Sphere makes a Dexterity saving throw: 8d6 Fire damage, or half on a success.';
  const es = 'Cada criatura en una esfera de 6 m de radio hace una salvación de Destreza: 8d6 de daño de fuego, o la mitad si tiene éxito.';
  assert.deepEqual(checkSummary(en, FIREBALL_EN, ctx.en).errors, []);
  assert.deepEqual(checkSummary(es, FIREBALL_ES, ctx.es).errors, []);
});

test('un número que el texto no tiene es un error (también en metros)', () => {
  const r = checkSummary('Each creature in a 30-foot Sphere takes 8d6 Fire damage.', FIREBALL_EN, ctx.en);
  assert.ok(r.errors.some((e) => e.includes('números') && e.includes('9')), r.errors.join('; '));
  const s = checkSummary('Cada criatura en una esfera de 6 m sufre 10d6 de daño de fuego.', FIREBALL_ES, ctx.es);
  assert.ok(s.errors.some((e) => e.includes('10d6')), s.errors.join('; '));
});

test('un término de reglas que el texto no nombra es un error', () => {
  const r = checkSummary('Each creature in the Sphere has the Prone condition.', FIREBALL_EN, ctx.en);
  assert.ok(r.errors.some((e) => e.includes('condition.prone')), r.errors.join('; '));
  const s = checkSummary('Cada criatura en la esfera queda Derribada.', FIREBALL_ES, ctx.es);
  assert.ok(s.errors.some((e) => e.includes('condition.prone')), s.errors.join('; '));
});

test('forma: largo, un renglón, sin tablas ni negrita', () => {
  const errs = (s) => checkSummary(s, FIREBALL_EN, ctx.en).errors.join('; ');
  assert.match(errs('x'.repeat(131)), /largo/);
  assert.match(errs('one\ntwo'), /salto de línea/);
  assert.match(errs('a | b'), /tabla/);
  assert.match(errs('**Fire** damage'), /negrita/);
  assert.match(errs(' Fire damage'), /espacios/);
  // Hasta 150 en otro idioma: 140 caracteres en español no son error.
  assert.doesNotMatch(checkSummary('a'.repeat(140), FIREBALL_ES, ctx.es).errors.join('; '), /largo/);
});

test('lo que se vio en el piloto: «?» suelto, «etc.», «half» inventado, palabras sin traducir', () => {
  const errs = (s, l = 'en', english) =>
    checkSummary(s, l === 'en' ? FIREBALL_EN : FIREBALL_ES, ctx[l], english).errors.join('; ');
  assert.match(errs('Choose one benefit: ?'), /suelto/);
  assert.match(errs('Breeze, dust, embers, etc.'), /etc/);
  const acid = readJson('data/en/spells.json')['acid-splash.desc'];
  assert.match(checkSummary('1d6 Acid damage, or half on a success.', acid, ctx.en).errors.join('; '), /half/);
  const en = 'On your turn, take Dash, Disengage, or Hide as a Bonus Action.';
  const cunning = readJson('data/es/classes.json')['rogue.feature.cunning-action.desc'];
  assert.match(
    checkSummary('En tu turno, Dash, Disengage o Hide como acción adicional.', cunning, ctx.es, en).errors.join('; '),
    /sin traducir .*: Dash, Disengage, Hide/,
  );
  // «Con.» está dentro de «Constitución»: no es una palabra sin traducir.
  const breath = readJson('data/es/origin.json')['species.dragonborn.trait.breath-weapon.text'];
  assert.doesNotMatch(
    checkSummary('Salvación de Destreza (CD 8 + Con.): 1d10.', breath, ctx.es, 'Dexterity save (DC 8 + Con.): 1d10.').errors.join('; '),
    /sin traducir/,
  );
});

test('«?» = no se resume: no es error', () => {
  assert.deepEqual(checkSummary('?', FIREBALL_EN, ctx.en), { errors: [], warnings: [] });
});

test('los ejemplos hechos a mano pasan todos los chequeos, en los dos idiomas', () => {
  const { examples } = readJson('tools/summary-examples.json');
  assert.ok(examples.length >= 15, `hay ${examples.length} ejemplos`);
  const catalogs = new Set(examples.map((e) => e.catalog));
  for (const c of ['spells', 'monsters', 'classes', 'origin']) assert.ok(catalogs.has(c), `falta un ejemplo de ${c}`);
  for (const e of examples) {
    for (const l of ['en', 'es']) {
      const map = readJson(`data/${l}/${e.catalog}.json`);
      const src = sourceKeyOf(e.key, map);
      assert.ok(src, `${e.key}: no hay texto en ${l}`);
      assert.deepEqual(checkSummary(e[l], map[src], ctx[l]).errors, [], `${e.key} (${l})`);
    }
    assert.deepEqual(checkEntry(e.key, e.en, e.es, esGlossary).errors, [], `${e.key} (es contra en)`);
  }
});

test('summary-merge publica, marca «?» y deja la huella; summary-check la vigila', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'srd-sum-'));
  try {
    fs.cpSync(path.join(ROOT, 'tools'), path.join(root, 'tools'), { recursive: true });
    fs.cpSync(path.join(ROOT, 'data'), path.join(root, 'data'), { recursive: true });
    const cli = (...a) => execFileSync('node', [path.join(root, 'tools/cli.mjs'), ...a], { encoding: 'utf8', cwd: root });
    const en = path.join(root, 'lote.en.json');
    const es = path.join(root, 'lote.es.json');
    fs.writeFileSync(en, JSON.stringify({
      'fireball.summary': 'Each creature in a 20-foot-radius Sphere makes a Dexterity saving throw: 8d6 Fire damage, or half on a success.',
      'wish.summary': '?',
    }));
    fs.writeFileSync(es, JSON.stringify({
      'fireball.summary': 'Cada criatura en una esfera de 6 m de radio hace una salvación de Destreza: 8d6 de daño de fuego, o la mitad si tiene éxito.',
    }));
    cli('summary-merge', 'spells', en, '--lang', 'en');
    cli('summary-merge', 'spells', es, '--lang', 'es');
    const spells = JSON.parse(fs.readFileSync(path.join(root, 'data/en/spells.json'), 'utf8'));
    const keys = Object.keys(spells);
    assert.equal(keys[keys.indexOf('fireball.desc') + 1], 'fireball.summary', 'va justo después de su texto');
    assert.ok(!('wish.summary' in spells), 'un «?» no se publica');
    const src = JSON.parse(fs.readFileSync(path.join(root, 'data/en/_summary-source.json'), 'utf8'));
    assert.equal(src.spells['wish.summary'].skip, true);
    assert.match(cli('summary-check'), /0 errores/);
    // La siguiente tanda ya no ofrece ni lo publicado ni lo marcado con «?».
    const out = path.join(root, 'tandas');
    cli('summary-batch', 'spells', '--count', '500', '--out', out);
    // (Cuando ya no queda ningún hechizo pendiente, no se escribe ninguna tanda: también vale.)
    const file = path.join(out, 'spells-sum-001.src.json');
    const next = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
    assert.ok(!('fireball.summary' in next) && !('wish.summary' in next));
    // Si el texto oficial cambia, el resumen queda vencido.
    spells['fireball.desc'] += ' (errata)';
    fs.writeFileSync(path.join(root, 'data/en/spells.json'), JSON.stringify(spells));
    assert.throws(
      () => cli('summary-check', '--lang', 'en'),
      (e) => /vencido/.test(String(e.stdout)),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
