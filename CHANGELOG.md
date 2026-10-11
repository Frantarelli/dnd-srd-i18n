# Cambios

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Las versiones
siguen [SemVer](https://semver.org/lang/es/): un cambio de **claves** o de **formato** es mayor;
un idioma nuevo, menor; una corrección de texto, parche.

## [0.3.0] — 2026-10-11

### Agregado
- **Catálogo `prose`** (inglés y español): las **reglas de enlazado**, cómo aparece cada término del
  glosario en un texto largo. Son listas de **formas literales** (`<término>.forms`, `.case`,
  `.before`, `.after`), nunca expresiones regulares: la aplicación escapa cada forma, así que no
  hay código ajeno. Un idioma nuevo suma las suyas sin tocar la aplicación.
- La barrera valida `prose.json` (términos que existen, formas válidas, límites) y `npm run check`
  revisa también todo el árbol de datos con ella.
- README: sección «Contribuir» completa (reglas, paso a paso, formato de cada catálogo, reglas de
  enlazado, cómo sumar un idioma, estilo, licencia y cómo llegan los cambios a las aplicaciones).

## [0.2.0] — 2026-10-11

### Agregado
- **Catálogo `glossary`** (inglés y español, 170 términos, 616 textos): las explicaciones de las
  reglas que usan las aplicaciones (condiciones, acciones, reglas, características, habilidades,
  sentidos, tipos de daño y de criatura, hechizos, rarezas y tipos de ítem mágico, sintonía,
  cargas, propiedades y maestrías de armas, categorías de armadura). Claves
  `<término>.name`, `<término>.summary` y `<término>.rules.<n>`. Los ids y las categorías de
  los términos los define la aplicación; acá está solo el texto.
- **Barrera de seguridad** (`tools/guard.mjs`, job `guard`): un pull request solo puede traer
  traducciones; rechaza archivos ajenos a los datos, borrados, enlaces simbólicos y todo
  contenido que no sea texto plano (HTML, scripts, enlaces, plantillas, caracteres invisibles).
  Corre con el código de la rama principal, no con el del pull request.
- `.github/CODEOWNERS`: todo cambio pasa por el mantenedor.

### Cambiado
- El glosario en español pasa de voseo a tuteo y a unidades métricas, como el resto del repo.

## [0.1.1] — 2026-10-10

### Cambiado
- El paquete npm incluye `tools/`, para que quien consuma los datos pueda validarlos
  (`node node_modules/dnd-srd-i18n/tools/cli.mjs validate all`).

## [0.1.0] — 2026-10-10

### Agregado
- Español completo del SRD 5.2.1: 8157 textos (origen 177, hechizos 987, clases 534, objetos
  1920, objetos mágicos 1533, criaturas 3006).
- Español alineado con el SRD 5.2.1 oficial en español (nombres de hechizo, Recuperación
  infernal, Tumulario, Ghast y Gul, «infrecuente», «acertar»).
- Herramientas: validador por perfil de idioma, circuito de lotes, traductor con modelo local,
  `new-language`, `snapshot` y `stale`.
- Manual de traducción (`docs/MANUAL.md`).
- `data/languages.json`: índice de idiomas disponibles y su cobertura (generado por `status`).
- Publicación automática de cada versión (release con ZIP), guía de contribución y plantilla
  para reportar errores de traducción.

### Notas
- Primera versión. Origen del historial: proyecto Brandsen
  (<https://github.com/Frantarelli/brandsen>), rama `feat/es-oficial`.
