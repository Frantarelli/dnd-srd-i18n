import fs from 'node:fs';

const edit = (file, pairs) => {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) {
    if (!s.includes(a)) throw new Error(`${file}: ${a.slice(0, 60)}`);
    s = s.replace(a, b);
  }
  fs.writeFileSync(file, s);
};

edit('tools/prompts/traductor.md', [['llamada Brandsen. Tu entrega', 'de mesa. Tu entrega']]);
edit('tools/langs/es/glossary.json', [
  ['la interfaz de Brandsen usa voseo, el contenido del juego no.', 'la interfaz de una aplicación puede usar voseo; el contenido del juego no.'],
]);
edit('tools/cli.mjs', [["path.join(os.tmpdir(), 'brandsen-i18n')", "path.join(os.tmpdir(), 'dnd-srd-i18n')"]]);
edit('CHANGELOG.md', [
  ['- Primera versión. Origen del historial: proyecto Brandsen\n  (<https://github.com/Frantarelli/brandsen>), rama `feat/es-oficial`.', '- Primera versión. El español se tradujo y revisó antes de publicarse como repositorio.'],
]);
edit('CONTRIBUTING.md', [['(como Brandsen) los incluyen', '(por ejemplo, un VTT) los incluyen']]);
edit('README.md', [
  ['(como [Brandsen](https://github.com/Frantarelli/brandsen))\n   reciben un *pull request* automático', '(por ejemplo, con un flujo que revisa las versiones nuevas)\n   reciben un *pull request* automático'],
]);
edit('docs/INTEGRACION.md', [
  [
    'Si devuelven problemas, **cortá la instalación**. Brandsen lo hace en\n[`scripts/sync-i18n.mjs`](https://github.com/Frantarelli/brandsen/blob/main/scripts/sync-i18n.mjs)\n(copia los JSON a `src/` solo si pasan).',
    'Si devuelven problemas, **cortá la instalación**: un script de `postinstall` que valida cada JSON del\npaquete y copia a tu carpeta de trabajo solo lo que pasa (y sale con error si algo no pasa) alcanza.',
  ],
  ['un intérprete mínimo de Markdown alcanza (Brandsen: `src/ui/prose/markdown.ts`).', 'un intérprete mínimo de Markdown alcanza.'],
  ['Implementación completa: Brandsen,\n  `src/ui/prose/proseTerms.ts` y `link.ts`.', 'La regla de oro: las formas del catálogo\n  son datos, nunca código.'],
  [
    'Subí la etiqueta cuando quieras (por ejemplo, un flujo semanal que abra un *pull request* con la\n  versión nueva, valide y corra tus pruebas; Brandsen tiene uno en `.github/workflows/i18n-update.yml`).',
    'Subí la etiqueta cuando quieras. Un flujo semanal que mire la última *release*, suba la etiqueta en\n  `package.json`, instale (con la validación de arriba), corra tus pruebas y abra un *pull request* para que\n  lo revises te ahorra el trabajo manual sin quitarte el control.',
  ],
]);
