# Cambios

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Las versiones
siguen [SemVer](https://semver.org/lang/es/): un cambio de **claves** o de **formato** es mayor;
un idioma nuevo, menor; una corrección de texto, parche.

## [0.7.1] — 2026-10-12

### Corregido
- **Alcances y movimientos de las criaturas** sin la cifra imperial suelta: «alcance 80/320 (24/96 m)» → «alcance 24/96 m»,
  «se movió 20 (6 m) o más» → «se movió 6 m o más» (69 textos). La guía dice «nunca pies» y el SRD oficial pone solo metros.
- **Glosario**: terminología oficial («tirada de ataque», «prueba de característica», «golpe crítico», «golpe
  desarmado», «bonificador de competencia») y una frase mal conjugada ("las tiradas de ataque contra ti…", decía «contra tú»).

### Cambiado
- El validador entiende los alcances de dos cifras («80/320 ft») y los «N+ feet», que daban «números extra» falsos.
  Avisos: 139 → 49. Los que quedan se revisaron uno por uno: conversiones correctas que el validador no sabe leer
  («media libra» = 250 g, pintas, onzas, °F, «un pie» = 30 cm) y nombres propios (Valhalla, Ioun, Bafomet).

## [0.7.0] — 2026-10-12

### Agregado
- **Golpe desarmado** en el glosario (`action.unarmed-strike`): el ataque básico con el cuerpo, 1 más el modificador
  de Fuerza.

## [0.6.0] — 2026-10-12

### Agregado
- **Descripción de cada opción de nivel 1 de clase** (`.desc` junto a cada `.name`): Orden divina ×2, Orden primigenia ×2 e
  invocaciones sobrenaturales ×5. Inglés del SRD 5.2.1; español del SRD oficial.
- **Glosario de creación de personaje**: Dado de golpe de la clase (`rule.class-hit-die`), Matriz estándar
  (`rule.standard-array`) y Compra de puntos (`rule.point-buy`).

## [0.5.1] — 2026-10-11

### Aviso
- **No usar `v0.5.0`**: la etiqueta se creó por error sobre el mismo commit que `v0.4.0` (no tiene el contenido de abajo)
  y las etiquetas son inmutables. Todo lo que se describe en 0.5.0 está en **0.5.1**.

## [0.5.0] — 2026-10-11

### Agregado
- **Opciones de creación de personaje**: las elecciones de especie (ascendencia dracónica ×10, linaje élfico ×3,
  linaje gnómico ×2, linaje gigante ×6, legado infernal ×3), los idiomas estándar (×10), los nueve alineamientos
  más «sin alineamiento», y las opciones de nivel 1 de clase (Orden divina ×2, Orden primigenia ×2, invocaciones
  sobrenaturales sin requisito ×5). Español tomado del SRD oficial.

## [0.4.0] — 2026-10-11

### Agregado
- **Canalizadores arcanos y libro de conjuros** (`arcane-focus-crystal`, `-orb`, `-rod`, `-staff`, `-wand`,
  `spellbook`): el equipo inicial de Brujo, Hechicero y Mago los nombra y no estaban. Textos del SRD 5.2.1 en
  inglés y español (el de español, del SRD oficial).

### Cambiado
- **Nombres de equipo sin el precio incrustado** (`Alchemist's Supplies (50 GP)` → `Alchemist's Supplies`,
  19 nombres): el precio es un dato del ítem, no parte del nombre; así el nombre se puede mostrar solo.
- Corregidos `Holy Symbol, Amulet)` y `Holy Symbol, Emblem)` (paréntesis suelto) y, en español, «varita de tejo»
  (el SRD oficial dice «varita», no «vara») y el formato de «Símbolo sagrado, relicario».

## [0.3.4] — 2026-10-11

### Cambiado
- **La atribución a las traducciones es obligatoria y está explícita.** `ATTRIBUTION.md` trae la línea lista para
  copiar (español e inglés) que nombra a Wizards of the Coast y a «Frantarelli y colaboradores»; `LICENSE-DATA.md`
  la exige; el README (y `README.en.md`) la muestran arriba de todo. El uso sigue siendo libre: la atribución es la
  única condición.

## [0.3.3] — 2026-10-11

### Cambiado
- Documentación y ejemplos sin referencias a aplicaciones concretas: el repositorio es neutral para cualquier
  consumidor.

## [0.3.2] — 2026-10-11

### Cambiado
- Se saca `ui` de los catálogos admitidos por la barrera: este repo es solo contenido y vocabulario de
  reglas del SRD, neutral para cualquier aplicación (Foundry VTT, otros VTT, bots). Los textos de
  interfaz de cada aplicación se traducen en su propio repositorio. `docs/FORMATO.md` lo aclara.

## [0.3.1] — 2026-10-11

### Agregado
- Documentación para integrar (`docs/INTEGRACION.md`) y referencia del formato y sus garantías
  (`docs/FORMATO.md`); README en inglés (`README.en.md`); `SECURITY.md`; plantilla de *pull request* y de
  *issues* (idioma nuevo, regla de enlazado); edición desde el navegador explicada.
- Dependabot para las acciones de GitHub; las acciones están fijadas por commit.

### Cambiado
- La barrera deja pasar U+200C/U+200D (no-unión/unión de ancho cero) y U+200E/U+200F (marcas de
  dirección): el persa, el hindi, el árabe y el hebreo no se pueden escribir bien sin ellos. Sigue
  rechazando el espacio de ancho cero, los controles de dirección que reordenan el texto
  («Trojan Source») y los joiners de palabra.

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
- Primera versión. El español se tradujo y revisó antes de publicarse como repositorio.
