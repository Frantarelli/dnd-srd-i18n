# dnd-srd-i18n

El **SRD 5.2.1 de D&D (reglas 2024)** traducido a varios idiomas, como **archivos planos listos
para usar en cualquier proyecto**, más las herramientas para sumar y verificar idiomas con ayuda
de IA.

| Idioma | Estado |
|---|---|
| Español (`es`) | ✅ 100 % — 8773 textos (origen, hechizos, clases, objetos, objetos mágicos, criaturas, glosario) |
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
  `monsters`, `glossary` (las explicaciones de las reglas: una entrada por término, claves
  `<término>.name`, `.summary` y `.rules.<n>`).
- **Las claves son estables y no se renombran** (`goblin-warrior.name`, `fireball.desc`).
- Solo está la **prosa y los nombres**. Lo estructurado (nivel, escuela, dados, costos) vive en
  los datos del SRD (por ejemplo, [Open5e](https://open5e.com)) y se une por la clave.
- Si falta una clave en un idioma, el consumidor debería caer al inglés (`data/en`).
- Funciona 100 % **offline**: los archivos se empaquetan al compilar tu aplicación.

### Desde un proyecto con npm

```json
"dependencies": { "dnd-srd-i18n": "github:Frantarelli/dnd-srd-i18n#v0.1.1" }
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

> **Esta sección tiene todo lo necesario para aportar.** No hace falta leer nada más para corregir
> un texto. Para sumar un idioma completo, además, el [manual](docs/MANUAL.md).

### Las reglas, en una mirada

Un *pull request* a este repositorio **solo puede traer traducciones**. Una verificación
automática (`guard`) lo comprueba y bloquea el merge si no se cumple. Nadie —ni siquiera con
buenas intenciones— puede cambiar acá código, flujos de trabajo ni configuración.

| ✅ Se acepta | ❌ Se rechaza |
|---|---|
| Editar `data/<idioma>/<catálogo>.json` (cualquier idioma menos `en`) | Cambiar `data/en/` (el inglés es la fuente: lo cambia el mantenedor) |
| Sumar un idioma nuevo: `data/<idioma>/` y `tools/langs/<idioma>/` | Cualquier otro archivo: `tools/*.mjs`, `.github/`, `package.json`, licencias, documentación |
| Corregir una regla de enlazado (`prose.json`) | Borrar o renombrar archivos; enlaces simbólicos; archivos ejecutables |
| Texto plano, con las mismas claves que el inglés | HTML, scripts, enlaces o imágenes que el inglés no tenga, plantillas (`${…}`, `{{…}}`), caracteres de control o invisibles |
| Los mismos marcadores `{n}` que el inglés | Claves nuevas que el inglés no tenga; marcadores distintos |
| Contenido del **SRD 5.2.1** (CC-BY-4.0) | Contenido de los manuales comerciales o de cualquier otra fuente |

Si tu cambio es legítimo y la verificación lo rechaza, abrí un *issue* en lugar de insistir: puede
ser un falso positivo y se arregla en el repo, no en tu *pull request*.

### Corregir un texto (5 minutos)

1. **Hacé un fork** del repositorio y cloná tu copia.
2. **Buscá la clave.** Los textos están en `data/<idioma>/<catálogo>.json`, un JSON plano
   `clave → texto`. Por ejemplo, la descripción de Bola de fuego en español es
   `data/es/spells.json` → `"fireball.desc"`. El inglés de esa misma clave está en
   `data/en/spells.json`.
3. **Editá solo el texto.** No cambies las claves. No agregues ni borres claves.
4. **Mirá el SRD oficial en tu idioma** si el cambio toca un nombre o un término: existe en
   español, francés, alemán e italiano, y para nombres y términos **manda el oficial**.
5. **Corré los controles** (necesitás Node 20 o más; no hay nada que instalar):
   ```bash
   npm run check    # números, dados, estructura, glosario, y la barrera de seguridad
   npm test         # pruebas de las herramientas
   ```
   Un texto con un error no entra: el validador compara cada número, dado y CD contra el inglés.
   Si algo falla, el mensaje dice la clave y el motivo.
6. **Abrí el *pull request*.** La verificación corre sola. Describí qué cambiaste y por qué (y si
   usaste IA para traducir, decilo: ver «Honestidad» abajo).

Para un error puntual sin querer editar archivos, abrí un *issue* con la plantilla «Error de
traducción»: la **clave**, el idioma y cómo debería decir.

### Qué catálogos hay y cómo se llaman las claves

| Catálogo | Qué contiene | Claves |
|---|---|---|
| `origin` | especies, dotes, trasfondos | `<id>.name`, `<id>.desc`… |
| `spells` | hechizos | `<id>.name`, `.desc`, `.higher_level`, `.material` |
| `classes` | clases y subclases | `<id>.name`, `.desc`, `<id>.features.<n>…` |
| `items` | equipo común: armas, armaduras, herramientas | `<id>.name`, `.desc` |
| `magicitems` | objetos mágicos | `<id>.name`, `.desc` |
| `monsters` | criaturas | `<id>.name`, `.desc`, `.actions.<n>.name`, `.actions.<n>.desc`… |
| `glossary` | las explicaciones de las reglas que usan las aplicaciones | `<término>.name`, `.summary`, `.rules.<n>` |
| `prose` | **reglas de enlazado**: cómo aparece cada término en un texto largo | `<término>.forms`, `.case`, `.before`, `.after` |

Las claves son **estables y no se renombran**. Si a un idioma le falta una clave, la aplicación cae
al inglés: se puede publicar un idioma incompleto.

### Las reglas de enlazado (`prose.json`)

Las aplicaciones subrayan, dentro de un texto largo, las palabras de reglas («Paralizado», «acción
adicional», «daño de fuego») y al tocarlas muestran la explicación del glosario. Para saber **qué
palabra del texto corresponde a qué término**, cada idioma trae su propia lista de *formas*. No son
expresiones regulares: son **palabras y frases literales**, y la aplicación se encarga del resto.

```jsonc
// data/es/prose.json
{
  "condition.paralyzed.forms": "paralizado | paralizada | paralizados | paralizadas",
  "rule.bonus-action.forms":   "acción adicional | acciones adicionales",
  "damage.fire.forms":         "fuego",
  "damage.fire.before":        "daño de | daño por | daño",   // solo cuenta si va justo después de esto
  "rule.dc.forms":             "CD",
  "rule.dc.case":              "exact"                         // distingue mayúsculas de minúsculas
}
```

- `<término>.forms` (obligatoria): las formas separadas por ` | `. Incluí plurales, género y
  conjugaciones que aparezcan en los textos. Hasta 40 formas, de 1 a 60 caracteres, solo letras,
  números, espacios, apóstrofe, punto y guion.
- `<término>.case` (opcional): `"exact"` si las mayúsculas importan (por ejemplo «CD» o los tipos
  de criatura, para no confundir «Gigante» con «gigante»).
- `<término>.before` / `.after` (opcionales): una palabra o frase que debe ir **justo antes** o
  **justo después** (con un espacio entre medio). Sirve para que «fuego» cuente como el tipo de
  daño solo en «daño de fuego», y no en «Elemental de fuego».
- El `<término>` tiene que ser un id del glosario (los de `data/en/glossary.json`, sin el
  `.name`).
- Un idioma sin `prose.json` funciona igual: simplemente no subraya palabras.
- Cuando en un texto el mismo término aparece varias veces, se enlaza solo la primera.

### Sumar un idioma nuevo

```bash
node tools/cli.mjs new-language de "Deutsch"
```

crea `data/de/` con los catálogos vacíos, `tools/langs/de/guia.md` (decisiones de estilo),
`tools/langs/de/glossary.json` (los términos de tu idioma y el **perfil** del validador: cómo se
escriben los decimales, qué unidades imperiales hay que convertir, qué registro está prohibido) y un
`prose.json` vacío. Después:

1. Completá la guía y el glosario del idioma **antes** de traducir (ahorra mucho trabajo).
2. Traducí por lotes, con IA o a mano; el validador rechaza todo lo que tenga errores. El proceso
   completo, con prompts, controles y costos medidos, está en el [manual](docs/MANUAL.md).
3. Podés abrir el *pull request* con un idioma **incompleto**: se publica con su porcentaje de
   cobertura en `data/languages.json` (lo genera el mantenedor con `npm run status`).
4. Cuando se publica la versión, las aplicaciones que usan este repo **descubren el idioma solas**.

### Estilo y fidelidad

- **El SRD oficial manda.** Si existe en tu idioma, los nombres y términos salen de ahí.
- **Fidelidad antes que gracia:** ningún número, dado, CD, unidad o condición puede cambiar.
- **Español:** tuteo (no voseo ni «vosotros»), unidades métricas (5 pies → 1,5 m), «tirada de
  salvación», «acción adicional», «espacio de conjuro».
- **Un texto que pasa el validador no está necesariamente bien**: el validador no detecta un
  «bonus» traducido como «ventaja» ni un nombre inventado. Por eso se revisa todo, no una muestra.

### Honestidad

Los textos hechos con IA se declaran. El estado de cada idioma está en
[`data/VERSION.json`](data/VERSION.json) y el de cada entrada, en
[`data/CHECKLIST.<idioma>.md`](data/CHECKLIST.es.md). Una revisión humana es lo más valioso que
se puede aportar.

### Cómo llegan tus cambios a las aplicaciones

1. El mantenedor revisa y mergea tu *pull request* (todo pasa por él).
2. Publica una versión (`v0.3.1`…) y se genera la *release* con un ZIP.
3. Las aplicaciones que fijan la versión (como [Brandsen](https://github.com/Frantarelli/brandsen))
   reciben un *pull request* automático con la versión nueva, y **vuelven a validar todo** antes de
   usarla.

### Licencia al contribuir

Al contribuir aceptás que tus textos se publiquen bajo **CC-BY-4.0** y tu código (si lo hubiera,
solo el mantenedor lo cambia) bajo MIT. Solo contenido del **SRD**, nada de los manuales
comerciales.

## Licencias

- **Textos** (`data/`): CC-BY-4.0, con la atribución a Wizards of the Coast de
  [`ATTRIBUTION.md`](ATTRIBUTION.md). Ver [`LICENSE-DATA.md`](LICENSE-DATA.md).
- **Código** (`tools/`): MIT. Ver [`LICENSE`](LICENSE).

Este trabajo es una adaptación y **no** está avalado por Wizards of the Coast.
