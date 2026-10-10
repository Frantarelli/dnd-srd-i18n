# Cambios

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Las versiones
siguen [SemVer](https://semver.org/lang/es/): un cambio de **claves** o de **formato** es mayor;
un idioma nuevo, menor; una corrección de texto, parche.

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
