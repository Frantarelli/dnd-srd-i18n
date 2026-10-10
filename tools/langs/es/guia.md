# Guía de traducción — español (es)

Reglas propias del español. Las reglas que valen para **todos** los idiomas (conservar números,
dados y estructura; no inventar; formato de los lotes) están en `prompts/traductor.md`.
El glosario de términos fijos y lo que el validador exige está en `glossary.json` de esta carpeta;
los nombres oficiales de hechizo, en `glossary-spells.json`.

## Reglas críticas (el validador rechaza lo que las rompe)

1. **Tuteo** para "you" (puedes, tienes, elige, ganas). Prohibido el voseo (podés, tenés) y
   prohibido el vosotros (tenéis, podéis, vuestro): para varias criaturas o personas usa la
   tercera del plural ("tú y tus aliados tienen") o el singular genérico.
2. **Unidades métricas**: pies × 0,3 con coma decimal (5 = 1,5 m; 10 = 3 m; 15 = 4,5 m; 20 = 6 m;
   30 = 9 m; 60 = 18 m; 90 = 27 m; 120 = 36 m; 150 = 45 m; 300 = 90 m); 1 milla = 1,5 km;
   1 libra = 0,5 kg; 1 pulgada = 2,5 cm; 1 pulgada cúbica = 16 cm³; 1 pie = 30 cm (lo que mide
   menos de 1 m se escribe en centímetros). Nunca "pies", "millas", "libras" ni "pulgadas".
   Los galones se dejan en galones y la conversión va entre paréntesis: "10 galones (38 litros)" (1 galón = 3,8 litros, redondeado).
3. **Monedas**: GP = po, SP = pp, CP = pc, EP = pe, PP = pm. **Miles sin separador** ("1000 po"),
   nunca "1,000" (en español eso se lee 1).
4. **Nombres** (`.name` y rasgos): mayúscula solo en la primera palabra; los nombres propios de
   personas se mantienen ("Mano de Bigby"). Los nombres de hechizo dentro del texto se escriben
   igual que su `.name`, también en minúscula salvo la primera palabra.
5. **Términos genéricos de reglas en minúscula** (ventaja, desventaja, descanso largo, acción
   adicional, bonificador de competencia, espacio de conjuro, tirada de salvación, tirada de
   ataque, visión en la oscuridad). **Las 15 condiciones con mayúscula** (Envenenado, Hechizado,
   Asustado, Agarrado, Incapacitado, Derribado, Apresado, Invisible, Paralizado, Aturdido,
   Inconsciente, Cegado, Ensordecido, Petrificado, Agotamiento). Tipos de daño en minúscula dentro
   de la frase ("daño de fuego"), aunque el inglés los capitalice. Criaturas y tamaños en minúscula
   en el texto corrido ("un necrófago", "criatura grande").
6. **DM** para game master (nunca "DJ"). Shadowfell, Feywild y mithral se dejan sin traducir.

## Según el catálogo

- **spells** — Escuelas en minúscula (evocación, abjuración, conjuración, adivinación,
  encantamiento, ilusión, nigromancia, transmutación); formas de área (cono, cubo, cilindro,
  emanación, línea, esfera); "spell attack" = "tirada de ataque de conjuro". `.material` es un
  componente: sustantivos corrientes en minúscula. La cursiva marca subtítulos
  ("*Audible Alarm.*") y nombres de hechizo: se conserva.
- **classes** — Clases: Bárbaro, Bardo, Clérigo, Druida, Guerrero, Monje, Paladín, Explorador,
  Pícaro, Hechicero, Brujo, Mago (minúscula en texto corrido). Los nombres de subclase y de rasgo
  se traducen de forma coherente en todo el lote. Las tablas de rasgos por nivel conservan su
  estructura.
- **items / magicitems** — Los objetos mágicos traen tablas y listas: conserva la estructura.
- **monsters** — Formato de ataque del SRD 2024: "Melee Attack Roll: +4, reach 5 ft. Hit: …" →
  "Tirada de ataque cuerpo a cuerpo: +4, alcance 1,5 m. Impacto: …"; "Failure:" = "Fallo:";
  "Success:" = "Éxito:"; "Dexterity Saving Throw: DC 13" = "Salvación de Destreza: CD 13".

## Criterios ya fijados en lotes anteriores (úsalos tal cual)

- Pies cuadrados = metros cuadrados (× 0,09: 2500 pies² = 225 m², escrito "metros cuadrados").
  Rangos: "5 to 20 feet" = "de 1,5 a 6 m". Pies cúbicos = litros (× 28,3): 1 pie³ = "28 litros",
  12 pies³ = "340 litros". Una conversión con decimales puede ir redondeada ("1/4 de pulgada" = "0,6 cm").
- "Speed" = "velocidad" en minúscula dentro de la frase. "Dim Light" = "luz tenue".
  "Passive Perception" = "Percepción pasiva". "Challenge Rating" = "valor de desafío"
  ("VD máx." en encabezados de tabla). "Initiative count" = "valor de iniciativa".
  "stat block" = "bloque de estadísticas". "Attunement" = "sintonización".
- Acciones básicas: "Attack action" = "acción de Atacar", "Magic action" = "acción de Magia",
  "Study action" = "acción de Estudiar"; "Dash/Disengage/Hide/Utilize" =
  Correr/Retirarse/Esconderse/Utilizar. "Bonus Action" = "acción adicional"; "an additional action"
  (Haste) = "acción extra" para no confundirla.
- Nombres de planos con mayúscula: Plano Astral, Plano Etéreo, Feywild, Shadowfell.
- "Boon" = "don" ("Don épico"). "Ice Knife" = "Cuchillo de hielo". "Hunter's Mark" = "Marca del
  cazador". "Summon Dragon" = "Invocar dragón". "Starry Wisp" = "Fuego fatuo estelar".
- Nombres de hechizo: los de `glossary-spells.json` tal cual (se actualiza con cada lote aprobado).
  Dentro de un texto van en minúscula (sin cursivas si el original no las trae).
- Tipos de criatura y de bestias en minúscula en texto corrido (celestial, feérico, infernal,
  muerto viviente); nombres de criatura como valor de campo o en negrita conservan la mayúscula
  inicial.
- "Heavily Obscured" = "muy oscurecida". "Ghast" = "necrófago mayor". "Wight" = "aparecido".
- "to dismiss" = "despedir" (no "descartar"). "worn or carried" = "lleve puesto ni porte".
- Cuando el original dice "creature" sobre un alma, un espíritu, etc., la concordancia sigue al
  sustantivo español ("el alma está Incapacitada").
- "Ability Score Improvement" = "Mejora de característica" (así lo escribe el SRD oficial en español). "Senda del berserker" con minúscula (regla de nombres).
