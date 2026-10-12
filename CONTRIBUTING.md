# Cómo contribuir

> La guía completa —las reglas, el formato de cada catálogo y el paso a paso— está en la
> sección **[Contribuir del README](README.md#contribuir)**. Este archivo es un resumen.

¡Gracias! Hay tres formas de ayudar, de menor a mayor esfuerzo.

## 1. Reportar un error de traducción (2 minutos)

Abrí un *issue* con la plantilla «Error de traducción». Necesitamos la **clave**
(`goblin-warrior.actions.0.desc`), el idioma y cómo debería decir. Las claves están en
`data/<idioma>/<catálogo>.json`.

## 2. Corregir un texto

1. Editá la clave en `data/<idioma>/<catálogo>.json`. **No cambies las claves.**
2. Si el texto cambia de sentido, **mirá el SRD oficial** de tu idioma (existe en español,
   francés, alemán e italiano): para términos y nombres manda el oficial.
3. Corré `npm run check` (valida números, dados, estructura y glosario) y `npm test`.
4. Abrí un *pull request*. La verificación automática corre sola.

Requisitos: Node 20 o más. No hay nada que instalar.

## 3. Sumar un idioma nuevo

Seguí el [manual](docs/MANUAL.md). En resumen:

```bash
node tools/cli.mjs new-language pt "Português"
```

completás la guía y el glosario del idioma, y traducís por lotes (con IA o a mano). El validador
rechaza todo texto con errores de números, dados o estructura. Podés abrir el *pull request* con un
idioma **incompleto**: se publica con su porcentaje de cobertura (`data/languages.json`).

## 3 bis. Sumar un nombre alternativo (alias)

Si los jugadores buscan un hechizo con **otro nombre de traducción** que el nuestro («Guardia contra la muerte» en
vez de «Guarda contra la muerte»), se agrega a `data/<idioma>/aliases.json`, no se cambia el nombre oficial:

```json
{ "spells.death-ward": "Guardia contra la muerte" }
```

- La clave es `spells.<id>` (el mismo id que `data/en/spells.json`). Varios nombres van separados por ` | `.
- **Es un alias solo si es el mismo hechizo.** Si cambia el nivel, el efecto o el nombre en inglés, es otro hechizo y no
  va acá. Ejemplo: «Fragmento mental» es el truco *Mind Sliver*, no «Clavo mental» (*Mind Spike*).
- Nombre oficial y alias se cotejan con el SRD oficial; si el alias solo difiere en acentos o mayúsculas no hace falta
  (los buscadores ya los ignoran).
- `npm run check` valida el archivo.

## Qué acepta este repositorio (y qué no)

Un pull request solo puede traer **traducciones**: archivos `data/<idioma>/<catálogo>.json` (menos
el inglés, que es la fuente) y los de un idioma nuevo (`tools/langs/<idioma>/`). Una verificación
automática (`tools/guard.mjs`, job `guard`) rechaza todo lo demás: flujos de trabajo,
herramientas, `package.json`, borrados, enlaces simbólicos, archivos ejecutables. Y rechaza el
contenido que no sea texto plano: HTML, scripts, enlaces que el inglés no tenga, plantillas
(`${…}`), caracteres de control o invisibles, claves nuevas y marcadores `{…}` distintos de los
del inglés. Si tu cambio es legítimo y no pasa, abrí un *issue* en lugar de insistir.

Las aplicaciones que usan estos textos (por ejemplo, un VTT) los incluyen como **texto plano** y los
vuelven a validar al instalarlos.

## Reglas

- **Solo contenido del SRD** (CC-BY-4.0). Nada de los manuales comerciales.
- Los textos hechos con IA se declaran: el estado de cada idioma está en `data/VERSION.json`.
- Al contribuir aceptás que tus textos se publiquen bajo CC-BY-4.0 y tu código bajo MIT.
