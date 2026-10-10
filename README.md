# dnd-srd-i18n

El **SRD 5.2.1 de D&D (reglas 2024)** traducido a varios idiomas, como **archivos planos listos
para usar en cualquier proyecto**, más las herramientas para sumar y verificar idiomas con ayuda
de IA.

| Idioma | Estado |
|---|---|
| Español (`es`) | ✅ 100 % — 8157 textos (origen, hechizos, clases, objetos, objetos mágicos, criaturas) |
| Otros | Ver [`docs/MANUAL.md`](docs/MANUAL.md) para sumar uno |

> **Estado honesto:** el español fue traducido con ayuda de IA y **revisado por IA contra el SRD
> oficial en español**. Todavía no lo revisó una persona. Está abierto a correcciones.
> Detalle de cada entrada en [`data/CHECKLIST.es.md`](data/CHECKLIST.es.md).

## Usar los datos

No hace falta instalar nada: son JSON planos, `clave → texto`.

```
data/en/spells.json   { "acid-arrow.name": "Acid Arrow", "acid-arrow.desc": "…" }
data/es/spells.json   { "acid-arrow.name": "Flecha ácida", … }
```

- Catálogos: `origin` (especies, dotes, trasfondos), `spells`, `classes`, `items`, `magicitems`,
  `monsters`.
- **Las claves son estables y no se renombran** (`goblin-warrior.name`, `fireball.desc`).
- Solo está la **prosa y los nombres**. Lo estructurado (nivel, escuela, dados, costos) vive en
  los datos del SRD (por ejemplo, [Open5e](https://open5e.com)) y se une por la clave.
- Si falta una clave en un idioma, el consumidor debería caer al inglés (`data/en`).
- Funciona 100 % **offline**: los archivos se empaquetan al compilar tu aplicación.

### Desde un proyecto con npm

```json
"dependencies": { "dnd-srd-i18n": "github:Frantarelli/dnd-srd-i18n#v0.1.0" }
```

Los archivos quedan en `node_modules/dnd-srd-i18n/data/`. **Fijá siempre la versión** (la
etiqueta): así tu aplicación cambia de traducción cuando vos decidas.

## Recibir actualizaciones y nuevos idiomas

- **Idiomas disponibles:** [`data/languages.json`](data/languages.json) lista cada idioma con su
  cobertura. Una aplicación puede leerlo para ofrecer los idiomas que existan, sin tocar código:
  cuando se suma un idioma al repositorio, aparece ahí solo.
- **Con npm:** cambiá la etiqueta de versión en tu `package.json` (por ejemplo `#v0.2.0`) y corré
  `npm install`. Cada versión nueva se anuncia en [Releases](../../releases) y en el
  [`CHANGELOG`](CHANGELOG.md).
- **Con git:** `git pull`, o `git submodule update --remote` si lo usás como submódulo.
- **Sin nada de eso:** bajá el ZIP de la última [release](../../releases).
- Las versiones siguen SemVer: un idioma nuevo sube la versión **menor** (`0.2.0`), una
  corrección de texto la de **parche**, y un cambio de claves o de formato la **mayor**. Mientras
  fijes la etiqueta, nada cambia por sorpresa.

## Versiones

`data/VERSION.json` dice con qué versión del SRD y de los datos se armó cada lanzamiento. Los
cambios están en [`CHANGELOG.md`](CHANGELOG.md).

## Herramientas

Requieren Node 20 o más y no tienen dependencias.

```bash
npm run check      # valida todas las traducciones (números, dados, estructura, glosario…)
npm run status     # reescribe data/ESTADO.md y los checklists
npm run snapshot   # guarda la huella del inglés con el que se tradujo cada texto
npm run stale      # lista las traducciones que quedaron viejas si el inglés cambió
npm test           # pruebas de las herramientas
node tools/cli.mjs new-language pt "Português"   # arma un idioma nuevo
```

El proceso completo —cómo preparar un idioma, traducir con un modelo local o con Claude, qué
controla el validador, cómo revisar y cuánto cuesta— está en
**[`docs/MANUAL.md`](docs/MANUAL.md)**.

## Contribuir

Guía completa en [`CONTRIBUTING.md`](CONTRIBUTING.md).

- ¿Un error de traducción? Abrí un *issue* con la clave (`goblin-warrior.actions.0.desc`) y la
  corrección.
- ¿Querés sumar un idioma? Seguí el manual. El validador rechaza todo texto con errores de
  números, dados o estructura.
- Solo contenido del **SRD**. Nada de los manuales comerciales.

## Licencias

- **Textos** (`data/`): CC-BY-4.0, con la atribución a Wizards of the Coast de
  [`ATTRIBUTION.md`](ATTRIBUTION.md). Ver [`LICENSE-DATA.md`](LICENSE-DATA.md).
- **Código** (`tools/`): MIT. Ver [`LICENSE`](LICENSE).

Este trabajo es una adaptación y **no** está avalado por Wizards of the Coast.
