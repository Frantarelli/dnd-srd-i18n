# Formato de los datos

La referencia exacta de lo que hay en `data/` y de lo que **no va a cambiar sin avisar**. Si
mantenés una aplicación que usa estos textos, empezá por acá y seguí con
[`INTEGRACION.md`](INTEGRACION.md).

## Estructura

```
data/
  languages.json            idiomas disponibles y su cobertura (lo genera `npm run status`)
  VERSION.json              versión de los datos, del SRD y estado de revisión de cada idioma
  ESTADO.md                 matriz catálogo × idioma (generada)
  CHECKLIST.<idioma>.md     una casilla por entrada (generada)
  en/<catálogo>.json        el inglés: la FUENTE
  <idioma>/<catálogo>.json  la traducción
  <idioma>/_source.json     huella del inglés con el que se tradujo cada texto (herramientas; no usar)
tools/langs/<idioma>/       guía de estilo y glosario de traducción de cada idioma (para traductores)
```

## Catálogos

Este repositorio contiene **solo contenido y vocabulario de reglas del SRD**, neutral para cualquier
aplicación. Los textos de la interfaz de cada aplicación (menús, botones) **no** van acá: son de esa
aplicación y se traducen en su propio repositorio.

Todos son **JSON plano**: un objeto `{ "clave": "texto" }`. Nada anidado, nada que no sea texto.

| Catálogo | Contiene | Claves |
|---|---|---|
| `origin` | especies, dotes, trasfondos | `<id>.name`, `<id>.desc`… |
| `spells` | hechizos | `<id>.name`, `.desc`, `.higher_level`, `.material` |
| `classes` | clases y subclases | `<id>.name`, `.desc`, y los rasgos |
| `items` | equipo común | `<id>.name`, `.desc` |
| `magicitems` | objetos mágicos | `<id>.name`, `.desc` |
| `monsters` | criaturas | `<id>.name`, `.desc`, `.actions.<n>.name`, `.actions.<n>.desc`… |
| `glossary` | explicaciones de reglas (ver abajo) | `<término>.name`, `.summary`, `.rules.<n>` |
| `prose` | reglas de enlazado (ver abajo) | `<término>.forms`, `.case`, `.before`, `.after` |
| `aliases` | otros nombres con que se conoce algo (ver abajo) | `spells.<id>` |

**Solo está la prosa y los nombres.** Lo estructurado (nivel, escuela, dados, costos, CA) vive en los
datos del SRD (por ejemplo [Open5e](https://open5e.com)) y se une por la clave (`<id>`).

### El glosario (`glossary`)

Una entrada por término. El **id** del término es el prefijo de sus claves; `.rules.<n>` empieza en 0
y no tiene huecos. El prefijo del id dice **de qué categoría es**:

| Prefijo | Categoría | Ejemplo |
|---|---|---|
| `condition.` | condición | `condition.prone` |
| `action.` | acción | `action.dash` |
| `rule.` | regla | `rule.advantage` |
| `ability.` | característica | `ability.str` |
| `skill.` | habilidad | `skill.stealth` |
| `sense.` | sentido | `sense.darkvision` |
| `damage.` | tipo de daño | `damage.fire` |
| `ctype.` | tipo de criatura | `ctype.undead` |
| `spell.` | vocabulario de hechizos | `spell.slot` |
| `item.`, `weapon.`, `mastery.`, `armor.` | ítems, propiedades y maestrías de armas, armaduras | `item.attunement`, `weapon.versatile` |

Un término nuevo se agrega **acá**, con su `.name`, su `.summary` y al menos una `.rules.0`, en el inglés
(lo hace el mantenedor) y después en cada idioma.

### Las reglas de enlazado (`prose`)

Cómo aparece cada término del glosario dentro de un texto largo, por idioma. Son **formas literales,
nunca expresiones regulares**:

| Clave | Obligatoria | Qué es |
|---|---|---|
| `<término>.forms` | sí | formas separadas por ` | ` (1 a 40; 1 a 60 caracteres; letras, números, espacios, `'`, `’`, `.`, `-`) |
| `<término>.case` | no | `"exact"` si distingue mayúsculas de minúsculas |
| `<término>.before` | no | frase que debe ir justo antes (con un espacio entre medio) |
| `<término>.after` | no | frase que debe ir justo después |

El `<término>` tiene que existir en el glosario. En `prose` cada idioma puede usar las claves que
necesite (no tienen que ser las mismas que en el inglés).

### Los nombres alternativos (`aliases`)

Un mismo hechizo se traduce de más de una manera («Guarda contra la muerte» / «Guardia contra la muerte»).
Este catálogo guarda las otras formas **para que un buscador las encuentre**; el nombre que se muestra sigue
siendo `<id>.name` de `spells`. Solo existe por idioma (no tiene versión en `en`).

| Clave | Valor |
|---|---|
| `spells.<id>` | nombres alternativos separados por ` | ` (1 a 10; hasta 80 caracteres; letras, números, espacios y `. : , / - '`) |

El `<id>` tiene que existir en `data/en/spells.json`. Son texto literal: se comparan, nunca se ejecutan.
Un idioma sin `aliases.json` simplemente no tiene alternativas.

## `data/languages.json`

```jsonc
{
  "schema": 1,
  "source": "en",
  "languages": {
    "es": {
      "name": "Español",
      "translated": 8773, "total": 8773, "coverage": 1, "complete": true,
      "catalogs": { "spells": { "translated": 987, "total": 987 } /* … */ }
    }
  }
}
```

Una aplicación puede leerlo para ofrecer los idiomas que existan y mostrar cuánto está traducido.
`schema` solo sube si cambia la forma del archivo.

## Garantías y versiones (SemVer)

- **Las claves son estables y no se renombran.** Si una clave tiene que desaparecer, es un cambio
  mayor.
- **Una versión publicada (`vX.Y.Z`) no cambia nunca.** La etiqueta está protegida contra borrado y
  reescritura. Fijá siempre la etiqueta (y, mejor, el commit).
- **Mayor** (`1.0.0`): se renombran o quitan claves, o cambia el formato de un catálogo.
  **Menor** (`0.4.0`): un idioma nuevo, un catálogo nuevo o términos nuevos.
  **Parche** (`0.3.1`): correcciones de texto.
- Si a un idioma le falta una clave, la aplicación **cae al inglés**.
- Los textos son **texto plano**: una aplicación debe mostrarlos como texto (`textContent`), nunca
  como HTML. La barrera del repo ya rechaza HTML, enlaces y scripts, pero la aplicación no debería
  confiar solo en eso.
