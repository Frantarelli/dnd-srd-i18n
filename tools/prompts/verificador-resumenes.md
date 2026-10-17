# Instrucciones para el VERIFICADOR de resúmenes

Verificas los **resúmenes de tarjeta** (`<clave>.summary`) que escribió un modelo local. Un script ya
comprobó lo mecánico (números y términos de reglas contenidos en el texto oficial, largo, un renglón; en
otros idiomas, además, contra el resumen inglés con el validador de siempre): todo lo que te llega tiene
**0 errores**. Tu trabajo es lo que ningún script ve: **el sentido**. No hay un resumen oficial con qué
comparar: la referencia es **el texto oficial completo, en cada idioma**.

## Pasos

1. Lee `tools/prompts/resumidor.md` (las reglas que debe cumplir cada resumen), los ejemplos de
   `tools/summary-examples.json` y, para los idiomas, la guía y el glosario (`tools/langs/<idioma>/`).
2. Arma la tabla de cada tanda (oficial y resumen lado a lado, en todos los idiomas):
   `node tools/cli.mjs summary-review <catálogo> --src <tanda>.src.json --files <tanda>.en.json,<tanda>.es.json --json --out <tanda>.review.json`
3. Revisa **todas** las entradas, sin muestreo (el borrador local de las traducciones necesitó corrección
   en el 50–65 % de los textos: `docs/MANUAL.md` § 6). Por cada una, en cada idioma:
   1. **¿Inventa?** Algo que el texto no dice, aunque no tenga números: un objetivo de más, «a voluntad»,
      una duración.
   2. **¿Omite lo que decide la mesa?** El tipo de salvación, la condición, el disparador de una
      reacción, «la mitad si tiene éxito», quién elige.
   3. **¿Cambia una regla?** *bonus* ≠ ventaja, «a 9 m o menos» ≠ «en un radio de 9 m», «hasta» ≠ «al
      menos», quién hace la tirada.
   4. **¿Los idiomas dicen lo mismo?** Y con los nombres oficiales (condiciones con mayúscula, tipos de
      daño y de criatura en minúscula, tuteo en español).
   5. **Forma**: entra en tres renglones y se entiende de un vistazo en la mesa.
4. Corrige **en el lugar** los `.en.json` / `.<idioma>.json` con **un solo script por tanda**; solo errores
   reales (cada cambio innecesario es un riesgo). Lo que no se pueda resumir bien, `?`.
5. Escribe a mano, con el texto oficial delante, lo que quedó en los `*.fuera.json`.
6. Chequea hasta 0 errores, en cada idioma:
   `node tools/cli.mjs summary-check <catálogo> --lang <idioma> --file <archivo> --warn`
7. Responde SOLO con: (a) por tanda e idioma, cuántos corregiste de cuántos (la tasa de corrección); (b)
   hasta 10 líneas «clave: antes → después — motivo»; (c) las dudas sin resolver, para el mantenedor.

## Después (el mantenedor)

Lee la tabla (`summary-review … --out revisar.md`), decide las dudas y publica:
`node tools/cli.mjs summary-merge <catálogo> <tanda>.en.json` y luego
`node tools/cli.mjs summary-merge <catálogo> <tanda>.es.json --lang es`.
