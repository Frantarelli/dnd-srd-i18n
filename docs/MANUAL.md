# Manual de traducción del SRD 5.2.1

Cómo traducir el contenido del SRD (reglas 2024) a **cualquier idioma** con ayuda de IA, sin
perder fidelidad de reglas y gastando lo menos posible. Sale de traducir el SRD completo al
español (8157 textos: origen, hechizos, clases, objetos, objetos mágicos y criaturas) y de
medir cada paso. Todo lo que dice acá se probó; lo que no, está marcado como tal.

> Este manual es **independiente del proveedor de IA**: los prompts y los controles sirven con
> Claude, con un modelo local (Ollama, llama.cpp) o con cualquier otro. Lo único que no se
> negocia son los controles automáticos y la revisión (secciones 5 y 6).

## 0. Reglas que no se negocian

1. **El SRD oficial en ese idioma manda.** Si existe una versión oficial (hoy: español, francés,
   alemán e italiano), de ahí salen los nombres. Ningún corpus propio ni ninguna IA la pisa.
2. **Un texto con errores nunca entra.** Lo que no pasa el validador se queda afuera y se
   resuelve a mano. No se "arregla" un número para que el validador calle.
3. **Que pase el validador no significa que esté bien.** Detecta números, estructura e inglés
   suelto; no detecta un "bonus" traducido como "ventaja" ni un nombre inventado. Para eso está
   la revisión.
4. **Se revisa todo, no una muestra.** El borrador de un modelo chico trae errores en más de la
   mitad de los textos (sección 6). Un muestreo deja pasar errores de reglas.
5. **Nada de contenido que no sea del SRD** (CC-BY-4.0). La atribución a Wizards of the Coast
   va en el repo y en cualquier producto que lo use, con el texto que indica el propio SRD.
6. **Se marca el estado de cada texto** (borrador de IA / revisado por IA / revisado por una
   persona). Es honesto y le dice a la comunidad dónde ayudar.

> **Las reglas para contribuir** (qué acepta el repositorio, el formato de cada catálogo y de las
> reglas de enlazado `prose.json`) están en la sección «Contribuir» del [README](../README.md#contribuir).

## 1. Mapa de archivos

```
data/
  en/<catálogo>.json        el inglés (fuente, verbatim del SRD vía Open5e v2)
  <idioma>/<catálogo>.json  la traducción: JSON plano  clave → texto
  ESTADO.md                 matriz catálogo × idioma (generada)
  CHECKLIST.<idioma>.md     una casilla por entrada (generada)
  <idioma>/_source.json     huella del inglés con el que se tradujo cada texto (para detectar lo viejo)
  VERSION.json              versión de los datos y del SRD
tools/
  cli.mjs                   batch · validate · merge · status · snapshot · stale · fix-names · glossary-sync · new-language
  validate-lib.mjs          el validador (agnóstico: todo lo propio de un idioma sale de su perfil)
  local-translate.mjs       borrador con un modelo local (Ollama), validado por el mismo validador
  new-language.mjs          arma las carpetas y plantillas de un idioma nuevo
  prompts/traductor.md      instrucciones para la IA traductora (genéricas)
  prompts/revisor.md        instrucciones para la IA revisora (genéricas)
  langs/<idioma>/           guia.md · glossary.json (perfil + términos + reglas) · glossary-spells.json
  reference/                scripts de ejemplo (español) para alinear contra el SRD oficial
  test/                     pruebas de las herramientas (node --test, sin dependencias)
```

Catálogos: `origin` (especies, dotes, trasfondos), `spells`, `classes`, `items`, `magicitems`,
`monsters`. Las claves son estables (`goblin-warrior.name`, `fireball.desc`): **nunca** se
renombran, porque son lo que usan los demás proyectos para leer la traducción.

## 2. Antes de traducir una sola línea: preparar el idioma

Es la parte que más ahorra. En español se hizo al revés (se decidió sobre la marcha) y hubo que
rehacer lotes.

1. **Crear el idioma:** `node tools/cli.mjs new-language pt "Português"`
   (crea carpetas, `glossary.json` con los términos vacíos, `guia.md` y los catálogos vacíos).
2. **Conseguir la fuente oficial** de ese idioma, si existe, y extraer su texto
   (`pdftotext -enc UTF-8 archivo.pdf salida.txt`, **sin** `-layout`: con `-layout` mezcla las
   dos columnas y rompe las fichas). Si no existe (hoy: portugués), buscar un glosario serio
   (p. ej. el de la UFRGS para portugués de Brasil) y asumir que la lista de nombres es más
   débil: hay que reservar más revisión.
3. **Completar la guía (`guia.md`) ANTES de lanzar lotes.** Decisiones mínimas:
   - Tratamiento (tú/vos/usted; ellos: tu/você/Sie…). Prohibir los registros equivocados en
     el perfil para que el validador los rechace.
   - Unidades: el SRD está en pies/libras; se convierte a métrico (pies × 0,3 → m; millas × 1,5
     → km; libras × 0,5 → kg; pulgadas × 2,5 → cm). Los galones se dejan con la conversión
     entre paréntesis ("10 galones (38 litros)"). La conversión a la unidad original se puede
     mostrar al pasar el cursor (la aplicación que consuma los datos puede calcularlo al mostrar el texto).
   - Números: separador decimal y de miles (en español los miles van sin separador).
   - Monedas (GP/SP/CP/EP/PP → las del idioma).
   - Mayúsculas: nombres con mayúscula solo en la primera palabra; términos de reglas en
     minúscula; condiciones con mayúscula.
   - Género y número de los términos recurrentes.
4. **Completar el perfil del idioma** en `langs/<idioma>/glossary.json`: separadores,
   palabras de unidades imperiales a vigilar, monedas, patrones prohibidos, reglas de términos.
5. **Armar la lista de nombres oficial** (la "termbase"):
   - Hechizos: alinear cada hechizo con su ficha en el SRD oficial por **nivel + escuela +
     clases + similitud de texto**, con asignación uno a uno. Resultado en español: 339 de 339
     emparejados, y **140 (41 %) tenían un nombre distinto del que había salido de traducir**.
     Scripts de ejemplo en `reference/`.
   - Criaturas, objetos, rasgos: nombres del índice del SRD oficial.
   - Esta lista se le pasa a la IA como **términos fijos** en el prompt de cada texto.

## 3. El circuito de traducción

Un **lote** son ~14.000 caracteres de entradas completas. El circuito de cada lote:

```
batch → traducir (IA) → validate → revisar (IA o persona) → merge → status
```

```bash
node tools/cli.mjs batch spells --lang pt --count 4 --out lotes/   # próximos lotes sin traducir
# → una IA escribe lote-NNN.pt.json (mismas claves, mismo orden)
node tools/cli.mjs validate spells --lang pt --file lote-001.pt.json --warn
# → revisión (sección 6)
node tools/cli.mjs merge spells lote-001.pt.json --lang pt       # rechaza si hay errores
node tools/cli.mjs status                                         # ESTADO.md y checklist
```

`merge` **nunca** suma un lote con errores. `npm run check` revalida todo.

### 3.1 Con un modelo local (gratis)

`node tools/local-translate.mjs --in lote.en.json --out lote.pt.json --lang pt --model gemma3:12b`

- Una entrada por llamada; si el validador la rechaza, se reintenta pasándole los errores (hasta
  3 veces). Lo que no pasa se deja **fuera** del archivo y se informa.
- Lee la respuesta en *streaming*: con textos largos, la respuesta completa tarda más que el
  tiempo de espera por defecto (5 min) y sin esto se cortaba antes de empezar.
- **Medido** (RTX 3070 de 8 GB): Gemma 3 de 12B ≈ 10–20 minutos por lote de 14.000 caracteres;
  Qwen 2.5 de 7B es el doble de rápido pero tradujo "bonus" como "ventaja" (otra regla). Los dos
  pasan el validador en ~96 % de los textos; la diferencia está en lo que el validador no ve.
- Es un **borrador**: en criaturas, entre el 55 y el 65 % de los textos necesitaron corrección.
- Dejarlo corriendo de noche: la PC no debe suspenderse (Windows tiene suspensión "moderna" que
  ignora los trucos de software; hay que desactivar la suspensión con corriente) y el cargador
  tiene que estar firme. El proceso es reanudable: cada lote queda guardado al terminar y
  `run-night` salta los hechos.

### 3.2 Con Claude u otra IA por API/CLI

Se usan `prompts/traductor.md` y `prompts/revisor.md` tal cual. Cada agente recibe: el idioma, la
ruta de la guía y el glosario, el lote, y la orden de validar con `--file` hasta 0 errores.

## 4. Qué controla el validador (`validate-lib.mjs`)

**Errores (rechazan):** números, dados, CD y bonos que faltan o cambian; unidades imperiales sin
convertir; monedas en inglés; estructura markdown distinta (saltos de línea, tablas, viñetas,
cursivas); texto idéntico al inglés; fuga de inglés; registros prohibidos del idioma; términos
obligatorios del glosario; nombres de hechizo en cursiva que no coinciden con el glosario.

**Avisos (se miran con criterio):** mayúsculas de más, largo sospechoso, números de más (casi
siempre una conversión legítima: "30 pies" → "9 m" agrega un 9).

**Erratas del SRD en inglés** que el validador conoce para no obligar a falsear: `footby`,
`footsquare`, `footlong`, `foothigh`, "1 0.5 pints". Si aparece una nueva, se agrega al
validador en vez de torcer la traducción.

Lo que el validador **no** ve: sentido invertido, nombres inventados, género/concordancia,
terminología inconsistente. Eso es trabajo de la revisión y de los scripts de consistencia.

## 5. Scripts baratos antes de gastar tokens

Se corren antes de la revisión con IA. No cuestan casi nada y arreglan mucho:

1. **Consistencia contra lo ya revisado:** si el mismo nombre en inglés ya tiene traducción
   revisada en otro catálogo, el borrador debe coincidir. En español arregló 401 nombres.
2. **Contra el SRD oficial:** un nombre de acción o rasgo que no aparece en el texto oficial y
   cuyo candidato sí aparece, se corrige. Arregló 42 más.
3. **Heurísticas de patrones de error típicos** (sección 7): "bonus → ventaja", "la arma", inglés
   suelto, voseo, residuos del dato fuente (`|XPHB|`).
4. **Nombres idénticos al inglés:** lista corta para mirar a mano (muchos son legítimos).

**Cuidado con los corpus propios:** el corpus viejo de criaturas decía "Multiataque"; el SRD
oficial dice "Ataque múltiple" (184 veces) y Gemma lo había traducido bien. Regla: un corpus
propio solo **sugiere**; el oficial decide.

## 6. La revisión

**Se revisa todo.** En español el error medido del borrador local fue: objetos ~50 %, objetos
mágicos ~50 %, criaturas 55–65 % (en 17 lotes). Con esa tasa no hay muestreo que valga.

Método que ahorró más tokens:

1. **Revisar en grupos de varios lotes por agente** (4–5 lotes), no un agente por lote. Cada
   agente lee el contexto una sola vez.
2. Cada agente: imprime original y traducción **lado a lado** con un script, aplica **todas** las
   correcciones de un lote con **un solo script** y valida al final.
3. Se le entregan **las reglas ya aprendidas** (sección 7) y **lo ya fusionado** como referencia
   de consistencia. Con eso el segundo grupo corrigió menos que el primero.
4. **Orden de autoridad** para términos: SRD oficial → lo ya fusionado → glosario → corpus
   propio (solo nombres, nunca estilo).
5. Las claves rechazadas por el validador se hacen **a mano** aparte (en español fueron ~150, el
   2 %): son textos largos con tablas y reglas encadenadas. Se traducen con el oficial como base.
6. Cada revisor devuelve: tasa de error por lote, los 5 cambios más importantes y **dudas sin
   resolver**. Las dudas se juntan y se deciden una sola vez al final (sección 9).

## 7. Reglas aprendidas (errores que se repiten)

- **Los nombres son el error principal**, no las frases. Dar la lista oficial al modelo desde el
  principio es lo que más recorta la revisión.
- **"bonus" ≠ "ventaja".** En D&D son reglas distintas. Hay que vigilarlo en cada idioma.
- **Nombres de criaturas literales o a medias:** "Rend" sin traducir, un unicornio "monocerdo",
  el *wraith* traducido igual que el *specter*. Contrastar siempre con el oficial.
- **Hechizos en inglés o con mayúscula** dentro del texto corrido; condiciones con mayúscula
  (Envenenado, Derribado…) pero tipos de criatura y de daño en minúscula.
- **Distancias:** "within X feet" = "a X m o menos", no "en un radio de". "20+ feet" no es 20.
- **Residuos del dato fuente:** `|XPHB|`, `[Área de Efecto]`, errores de pegado (un objeto con el
  párrafo de otro). Se traduce lo que dice el inglés, pero se anota para corregir la fuente.
- **Entradas casi idénticas** (las 27 variantes de "Holy Avenger"): traducir una y copiar.
- **El mismo término en todos los lotes:** un nombre que cambia entre lotes es peor que uno
  imperfecto. Mantener una lista de decisiones (sección 9).

## 8. Costos medidos (para planear)

| Qué | Medido |
|---|---|
| Borrador local, 1 lote de 14.000 caracteres | 10–20 min de PC (Gemma 12B, GPU de 8 GB), $0 |
| Revisión con IA, grupo de 4–5 lotes de objetos | 190.000–330.000 tokens |
| Revisión con IA, grupo de 4–5 lotes de criaturas | 330.000–420.000 tokens |
| Textos largos rechazados, a mano (≈150 textos) | ~450.000 tokens |
| Referencia de cuota | 1 punto de la ventana de 5 horas ≈ 26.000–35.000 tokens |

Con esto, terminar un idioma entero de criaturas + objetos + mágicos rondó **1,5–2 M de tokens**
de revisión repartidos en varias ventanas. Con la lista de nombres oficial desde el principio, el
objetivo es bajarlo; **no está medido todavía** en un segundo idioma.

## 9. Decisiones por idioma (plantilla)

Antes de cerrar un idioma, resolver **una sola vez** y registrar en `guia.md`:

- Términos donde el SRD oficial difiere de lo que ya hay fusionado (nombres de hechizo,
  recuperaciones de criaturas, rarezas: en español "infrecuente").
- Etiquetas de ataque ("Acierto:" en el oficial) y verbos ("acertar").
- Nombres de criaturas que el oficial deja sin traducir (en español: *Ghast*, *Gul*).
- Frases con conversiones forzadas por el validador ("20 (6 m) o más"): decidir si se acepta o
  se ajusta el validador.

**Registro de decisiones del español (aplicado el 2026-10-09, 688 textos):** 140 nombres de
hechizo alineados con el oficial; *Recuperación* infernal/diabólica/…; *Tumulario* (wight);
*Ghast* y *Gul*; "infrecuente"; "Golpe de tormenta"; "acertar" en lugar de "impactar"; dragón de
"oropel".

## 10. Problemas de infraestructura ya resueltos

| Problema | Solución |
|---|---|
| Un texto largo cortaba la conexión con el modelo local (5 min) | Respuesta en *streaming* |
| La PC se durmió o se cortó la luz a mitad de la noche | Lotes reanudables + suspensión desactivada con corriente |
| El PDF con `-layout` mezcla columnas | `pdftotext` **sin** `-layout` (fichas limpias) |
| Letras con tilde rompían los patrones de fichas | Clases de caracteres con tildes (`[a-zñáéíóú]`) |
| Reemplazar nombres de hechizo de una sola palabra rompe palabras comunes | Reemplazar solo con contexto: tras "conjuro", en cursiva, en listas de lanzamiento, en celdas de tabla |
| Heredocs y `node -e` pierden barras invertidas | Escribir scripts con un editor/archivo, no desde la línea de comandos |

## 11. Publicar un idioma

1. `npm run check` en 0 errores y `ESTADO.md` al 100 %.
2. Atribución a Wizards of the Coast y licencia CC-BY-4.0 junto a los datos.
3. Estado honesto: "borrador de IA revisado por IA, abierto a correcciones" hasta que lo revise
   una persona. Idiomas incompletos se publican con su porcentaje de cobertura.
4. Número de versión de los datos y registro de cambios, para que quien lo use offline sepa con
   qué versión armó su aplicación.

## 12. Mantener los datos al día

- `npm run snapshot` guarda la huella del inglés de cada texto traducido; hay que correrlo al
  cerrar un lote.
- Si el SRD en inglés cambia (nueva versión), `npm run stale` lista qué traducciones hay que
  rehacer: las que cambiaron, las que se quedaron sin inglés y las que faltan. La verificación
  automática de GitHub lo corre en cada cambio.
- Cada lanzamiento lleva un número de versión (`data/VERSION.json`, `CHANGELOG.md` y etiqueta de
  Git). Quien consume los datos fija la etiqueta y decide cuándo actualizar.
