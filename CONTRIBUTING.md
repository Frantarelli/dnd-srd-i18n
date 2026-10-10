# Cómo contribuir

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

## Reglas

- **Solo contenido del SRD** (CC-BY-4.0). Nada de los manuales comerciales.
- Los textos hechos con IA se declaran: el estado de cada idioma está en `data/VERSION.json`.
- Al contribuir aceptás que tus textos se publiquen bajo CC-BY-4.0 y tu código bajo MIT.
