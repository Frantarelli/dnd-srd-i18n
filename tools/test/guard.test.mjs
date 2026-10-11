// La barrera de seguridad (tools/guard.mjs): cada ataque que queremos frenar, y lo que tiene
// que dejar pasar. Se arma un repositorio de git temporal con una base y se prueba cada pull
// request como una rama que sale de ella.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { contentProblems, proseProblems, regexProblems, review } from '../guard.mjs';

const EN = { 'a.name': 'Acid Arrow', 'a.desc': 'Deals {n} damage. See the rules.', 'b.name': 'Bless' };

function repo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-'));
  const git = (...a) => execFileSync('git', a, { cwd: dir, stdio: 'pipe' });
  git.dir = dir;
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 't@t');
  git('config', 'user.name', 't');
  const write = (rel, content) => {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), content);
  };
  write('data/en/spells.json', JSON.stringify(EN));
  write('data/es/spells.json', JSON.stringify({ 'a.name': 'Flecha ácida' }));
  write('tools/cli.mjs', '// herramienta\n');
  write('package.json', '{}\n');
  git('add', '-A');
  git('commit', '-q', '-m', 'base');
  /** Un pull request: una rama que aplica `edit` y se compara con main. */
  const pr = (edit, maintainer = false, raw = false) => {
    git('checkout', '-q', '-B', 'pr', 'main');
    edit({ write, rm: (rel) => fs.rmSync(path.join(dir, rel)), git, hash: (t) => git('hash-object', '-w', '--stdin', '--', t) });
    if (!raw) git('add', '-A');
    git('commit', '-q', '-m', 'pr');
    const r = review({ cwd: dir, base: 'main', head: 'pr', maintainer });
    git('reset', '-q', '--hard');
    git('checkout', '-q', 'main');
    return r;
  };
  return { pr, dir };
}

const es = (obj) => JSON.stringify({ 'a.name': 'Flecha ácida', ...obj });

test('deja pasar una traducción normal', () => {
  const { pr } = repo();
  assert.deepEqual(pr(({ write }) => write('data/es/spells.json', es({ 'a.desc': 'Causa {n} de daño. Mira las reglas.', 'b.name': 'Bendición' }))), []);
});

test('deja pasar un idioma nuevo con su guía y su glosario', () => {
  const { pr } = repo();
  assert.deepEqual(
    pr(({ write }) => {
      write('data/pt/spells.json', JSON.stringify({ 'a.name': 'Flecha ácida' }));
      write('tools/langs/pt/guia.md', '# Guia\n');
      write('tools/langs/pt/glossary.json', JSON.stringify({ profile: { forbidden: [{ pattern: '\\bvoce\\b', flags: 'iu', message: 'x' }] } }));
    }),
    [],
  );
});

test('frena cualquier archivo que no sea una traducción', () => {
  const { pr } = repo();
  for (const rel of ['package.json', 'tools/cli.mjs', '.github/workflows/guard.yml', 'README.md', 'tools/guard.mjs', 'LICENSE', 'docs/MANUAL.md']) {
    const r = pr(({ write }) => write(rel, 'cambio\n'));
    assert.ok(r.some((p) => p.startsWith(rel)), `${rel} debería frenarse: ${r.join(' | ')}`);
  }
});

test('frena el inglés (es la fuente) y las claves nuevas', () => {
  const { pr } = repo();
  assert.ok(pr(({ write }) => write('data/en/spells.json', JSON.stringify({ ...EN, 'c.name': 'Nueva' }))).length > 0);
  assert.ok(pr(({ write }) => write('data/es/spells.json', es({ 'zzz.name': 'Clave inventada' }))).some((p) => p.includes('no existe en el inglés')));
});

test('frena borrar, enlaces simbólicos y archivos ejecutables', () => {
  const { pr } = repo();
  assert.ok(pr(({ rm }) => rm('data/es/spells.json')).some((p) => p.includes('borrar')));
  // Un enlace simbólico de verdad (blob con modo 120000) y un archivo ejecutable (100755): se
  // arman directo en el índice, porque `git add` los normalizaría según el sistema.
  assert.ok(
    pr(({ git }) => {
      const sha = execFileSync('git', ['hash-object', '-w', '--stdin'], { cwd: git.dir, input: '/etc/passwd' }).toString().trim();
      git('update-index', '--add', '--cacheinfo', `120000,${sha},data/es/spells.json`);
    }, false, true).some((p) => p.includes('enlace simbólico')),
  );
  assert.ok(
    pr(({ write, git }) => {
      write('data/es/items.json', '{}');
      git('add', 'data/es/items.json');
      git('update-index', '--chmod=+x', 'data/es/items.json');
    }, false, true).some((p) => p.includes('modo de archivo')),
  );
});

test('frena el contenido inyectado', () => {
  const bad = {
    html: '<script>alert(1)</script>',
    img: 'texto <img src=x onerror=alert(1)>',
    js: 'abre javascript:alert(1)',
    url: 'visita https://malo.example/x',
    md: 'un [enlace](https://malo.example)',
    tpl: 'valor ${process.env.X}',
    bidi: 'texto ‮oculto',
    zero: 'tex​to',
    isolate: 'texto ⁦oculto',
    joiner: 'a⁠b',
    ctrl: 'a\u0001b',
  };
  for (const [name, text] of Object.entries(bad)) {
    const p = contentProblems('f', JSON.stringify({ 'a.name': text }), EN);
    assert.ok(p.length > 0, `${name} debería frenarse`);
  }
});

test('lo que el inglés ya trae no es una inyección', () => {
  const en = { 'a.name': 'See https://example.org and <b>bold</b>' };
  assert.deepEqual(contentProblems('f', JSON.stringify({ 'a.name': 'Mira https://example.org y <b>negrita</b>' }), en), []);
});

test('exige los mismos marcadores {…} que el inglés y un largo razonable', () => {
  assert.ok(contentProblems('f', JSON.stringify({ 'a.desc': 'Sin marcador.' }), EN).some((p) => p.includes('marcadores')));
  assert.ok(contentProblems('f', JSON.stringify({ 'b.name': 'x'.repeat(5000) }), EN).some((p) => p.includes('desproporcionado')));
  assert.ok(contentProblems('f', '[1,2]', EN)[0].includes('objeto plano'));
  assert.ok(contentProblems('f', '{no json', EN)[0].includes('no es JSON'));
});

test('el mantenedor puede tocar herramientas, pero su contenido se valida igual', () => {
  const { pr } = repo();
  assert.deepEqual(pr(({ write }) => write('tools/cli.mjs', '// nueva\n'), true), []);
  assert.ok(pr(({ write }) => write('data/es/spells.json', es({ 'a.desc': '<script>x</script> {n}' })), true).length > 0);
});

test('revisa las expresiones regulares del perfil de un idioma antes de correrlas', () => {
  const evil = JSON.stringify({ profile: { forbidden: [{ pattern: '(a+)+$', flags: 'u', message: 'x' }] } });
  assert.ok(regexProblems('g', evil).length > 0);
  assert.ok(regexProblems('g', JSON.stringify({ profile: { forbidden: [{ pattern: '(', flags: 'u', message: 'x' }] } })).length > 0);
  assert.deepEqual(regexProblems('g', JSON.stringify({ profile: { forbidden: [{ pattern: '\\bvos\\b', flags: 'iu', message: 'x' }] } })), []);
});

test('las reglas de enlazado son formas literales: frena regex, términos inventados y excesos', () => {
  const ids = new Set(['condition.prone', 'damage.fire']);
  const ok = JSON.stringify({ 'condition.prone.forms': 'derribado | derribada', 'damage.fire.forms': 'fuego', 'damage.fire.before': 'daño de | daño', 'damage.fire.case': 'exact' });
  assert.deepEqual(proseProblems('p', ok, ids), []);
  // Una expresión regular no es una forma literal.
  assert.ok(proseProblems('p', JSON.stringify({ 'condition.prone.forms': '(a+)+$' }), ids).length > 0);
  assert.ok(proseProblems('p', JSON.stringify({ 'condition.prone.forms': 'derrib.*' }), ids).length > 0);
  assert.ok(proseProblems('p', JSON.stringify({ 'condition.prone.forms': '<b>x</b>' }), ids).length > 0);
  // Un término que no existe, una clave de otra forma, un «case» raro, y reglas sin formas.
  assert.ok(proseProblems('p', JSON.stringify({ 'condition.nada.forms': 'x' }), ids).some((p) => p.includes('no es un término')));
  assert.ok(proseProblems('p', JSON.stringify({ 'condition.prone.regex': 'x' }), ids).length > 0);
  assert.ok(proseProblems('p', JSON.stringify({ 'condition.prone.forms': 'x', 'condition.prone.case': 'si' }), ids).length > 0);
  assert.ok(proseProblems('p', JSON.stringify({ 'damage.fire.before': 'daño' }), ids).some((p) => p.includes('pero no')));
  const many = Array.from({ length: 41 }, (_, i) => `forma${i}`).join(' | ');
  assert.ok(proseProblems('p', JSON.stringify({ 'condition.prone.forms': many }), ids).length > 0);
  assert.ok(proseProblems('p', JSON.stringify({ 'condition.prone.forms': 'a'.repeat(61) }), ids).length > 0);
});

test('deja pasar lo que otros idiomas necesitan: ZWNJ, ZWJ y marcas de dirección', () => {
  // Persa (ZWNJ), hindi (ZWJ) y árabe/hebreo (marcas LRM/RLM): son texto legítimo.
  const ok = { 'a.name': 'می‌خواهم', 'b.name': 'क्‍ष', 'a.desc': 'ערך ‏שלום‎' };
  assert.deepEqual(contentProblems('f', JSON.stringify(ok), { 'a.name': 'x', 'b.name': 'y', 'a.desc': 'z' }), []);
});
