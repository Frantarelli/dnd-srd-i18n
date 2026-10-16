# Instrucciones para el RESUMIDOR

Escribes el **resumen de tarjeta** (`<clave>.summary`) de un texto de reglas de D&D 5e (SRD 5.2.1,
reglas 2024) para la pantalla de combate de un DM. La tarjeta muestra **tres renglones cortos**; el texto
oficial completo está a un *hover* de distancia. Estas reglas valen igual para una persona, para Claude o
para el modelo local (`tools/local-summarize.mjs` las lleva en su prompt de sistema).

No hay un resumen oficial del SRD: la única fuente es **el texto oficial completo** del mismo idioma. Lo
que no dice el texto no existe.

## Pasos

1. Lee los ejemplos hechos a mano de `tools/summary-examples.json`: son la vara.
2. Lee la tanda (`<catálogo>-sum-NNN.src.json`: clave `.summary` → texto oficial en inglés).
3. Escribe `<catálogo>-sum-NNN.en.json`: mismas claves, mismo orden, el resumen como valor.
4. Chequea hasta cero errores:
   `node tools/cli.mjs summary-check <catálogo> --lang en --file <tu archivo> --warn`
5. Responde SOLO con: cantidad de resúmenes, cuántos `?`, errores y avisos del último chequeo, y una línea
   por cada duda.

## Reglas (el chequeo rechaza las tres primeras)

1. **Ningún número, dado, CD ni bono que el texto no tenga.** Un resumen omite; nunca agrega.
2. **Ningún término de reglas que el texto no nombre**: condición, tipo de daño, característica, tipo de
   criatura, «Bonus Action», «Hit Points»… (las formas salen del catálogo `prose`).
3. **Forma**: un renglón, sin saltos de línea, tablas, viñetas ni negrita. Inglés: hasta **130**
   caracteres (apunta a 115). Otros idiomas: hasta **150** (apunta a 135). Cursiva `*…*` solo para un
   nombre de hechizo, como en el texto oficial.
4. **Orden**: qué hace → a quién o qué área → qué tirada (ataque, o qué salvación) → el efecto principal
   (daño, condición, curación). «La mitad si tiene éxito» se conserva si el texto lo dice.
5. **Lo que decide la mesa va siempre**: el tipo de salvación y su CD, la condición, el disparador de una
   reacción, quién elige los objetivos, «una vez por turno». Lo que casi nunca importa en la mesa (el
   color, el sonido, los objetos que arden) se va primero.
6. **Ataques de criatura**: la tarjeta no muestra los números, así que el resumen conserva el bonificador
   de ataque, el alcance o la distancia y los dados; el promedio se saca («5 (1d6 + 2)» → «1d6 + 2»).
7. **Hechizos**: los botones de nivel ya dicen los dados por nivel (`Nivel 4 · 9d6 fuego`); si el
   resumen no entra, los dados de nivel superior se omiten.
8. **Términos con la forma del SRD**: *Dexterity saving throw*, *Prone*, *Fire damage*, *Bonus Action*.
   Abreviar está bien si no confunde («Dexterity save», «Con.»).
9. **`?`** si no se puede resumir sin perder una regla que decide el resultado (un hechizo con una tabla
   de efectos, una lista de opciones). La tarjeta cae al texto completo; mejor eso que un resumen falso.

## Lo que NO se hace

- Explicar, opinar o aclarar («útil contra…»).
- Completar con conocimiento del juego («dura 1 minuto» si el texto no lo dice ahí).
- Cambiar una regla por otra parecida: *bonus* ≠ *Advantage*, «within 30 feet» ≠ «30-foot radius».
