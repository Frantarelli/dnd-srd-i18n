# Usar estos textos en tu aplicación

Para quien **desarrolla una aplicación** (un VTT, una hoja de personaje, un bot…) y quiere los textos
del SRD traducidos. Para aportar traducciones, ver la sección «Contribuir» del
[README](../README.md#contribuir). El formato exacto está en [`FORMATO.md`](FORMATO.md).

## 1. Traerlos

**Con npm** (fijá la versión, nunca una rama):

```json
"dependencies": { "dnd-srd-i18n": "github:Frantarelli/dnd-srd-i18n#v0.3.0" }
```

`package-lock.json` queda atado al **commit** exacto de esa etiqueta. Los archivos quedan en
`node_modules/dnd-srd-i18n/data/`. Sin npm: la ZIP de cada [release](https://github.com/Frantarelli/dnd-srd-i18n/releases)
o un submódulo de git (`git submodule update --remote` para actualizar).

## 2. Validarlos al instalar (recomendado)

El repo ya revisa cada *pull request*, pero **tu aplicación no debería confiar en eso**: volvé a
validar lo que entra. El paquete trae su propia barrera, sin dependencias:

```js
import { contentProblems, proseProblems } from 'dnd-srd-i18n/tools/guard.mjs';
// por cada data/<idioma>/<catálogo>.json:  contentProblems(archivo, texto, inglesDelMismoCatalogo)
// para prose.json:                         proseProblems(archivo, texto, idsDeTerminosDelGlosario)
```

Si devuelven problemas, **cortá la instalación**: un script de `postinstall` que valida cada JSON del
paquete y copia a tu carpeta de trabajo solo lo que pasa (y sale con error si algo no pasa) alcanza.

## 3. Leerlos

```js
const en = await import('.../data/en/spells.json');
const es = await import('.../data/es/spells.json');
const text = (key, lang) => (lang === 'en' ? en : es)[key] ?? en[key] ?? key; // cae al inglés
```

- **Idiomas disponibles:** leé `data/languages.json` (o listá las carpetas de `data/`). Un idioma
  nuevo aparece solo al subir la versión; no hace falta tocar código.
- **Mostralos como texto**, nunca como HTML.
- Los textos pueden traer `**negrita**`, `*cursiva*`, listas con `- ` y tablas con `|`: un
  intérprete mínimo de Markdown alcanza.

## 4. El glosario y el enlazado con los textos largos

- **Glosario**: armá cada término con sus claves `<id>.name`, `.summary` y `.rules.<n>` (hasta que no
  haya más). La categoría sale del prefijo del id (tabla en `FORMATO.md`).
- **Enlazado**: para subrayar términos dentro de un texto largo, compilá `prose.json` a reglas.
  **Escapá cada forma**; nunca construyas una regex con texto del catálogo sin escapar:

```js
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const forms = map['condition.paralyzed.forms'].split(' | ').map((f) => escape(f.trim()));
const re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${forms.join('|')})(?![\\p{L}\\p{N}])`, 'giu');
```

  Con `.before` / `.after` agregá un lookbehind/lookahead de la frase (también escapada) más un
  espacio. Enlazá solo la **primera** aparición de cada término en un texto. Un idioma sin
  `prose.json` simplemente no enlaza nada. La regla de oro: las formas del catálogo
  son datos, nunca código.

- **Buscador**: si tenés uno, indexá también `aliases.json` (`spells.<id>` → nombres separados por ` | `) apuntando al
  mismo hechizo que `<id>.name`; mostrá siempre el nombre oficial. Normalizá acentos y mayúsculas al comparar.

## 5. Mantenerse al día

- Cada versión se anuncia en [Releases](https://github.com/Frantarelli/dnd-srd-i18n/releases) y en el
  [`CHANGELOG`](../CHANGELOG.md).
- Subí la etiqueta cuando quieras. Un flujo semanal que mire la última *release*, suba la etiqueta en
  `package.json`, instale (con la validación de arriba), corra tus pruebas y abra un *pull request* para que
  lo revises te ahorra el trabajo manual sin quitarte el control.
- Mientras fijes la etiqueta, **nada cambia por sorpresa**.

## 6. Obligaciones de licencia

Los textos son **CC-BY-4.0**. El uso es libre; **la única condición es la atribución**. Tu aplicación tiene
que mostrar, en algún lado visible (créditos, pie, página de licencias), la línea de
[`ATTRIBUTION.md`](../ATTRIBUTION.md): el SRD 5.2.1 de Wizards of the Coast **y** las traducciones de
Frantarelli y colaboradores, con el enlace al repo. No sugieras que Wizards la avala. El código de `tools/` es MIT.

## 7. Cuando tu aplicación necesita términos nuevos

Pedilo con un *issue*: un término nuevo del glosario es un cambio menor y lo agrega el mantenedor
(en inglés), para que después lo traduzca cada idioma. **No agregues términos solo en tu copia local**:
se perderían en la próxima actualización y no llegarían a los demás idiomas.
