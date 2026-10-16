# Piloto de los resúmenes de tarjeta (16/10/2026)

La primera tanda de resúmenes (`<clave>.summary`), hecha con el circuito de `docs/MANUAL.md` § 13: borrador
en la PC con Ollama, verificación con IA (Claude) contra el texto oficial y, ahora, la lectura del
mantenedor. **Nada de esto está publicado todavía**: los archivos de `tanda/` se suman con `summary-merge`
cuando Franco los apruebe.

## Qué se probó

40 entradas de los cuatro catálogos, elegidas para que haya de todo y ninguna repita un ejemplo hecho a mano:

| Catálogo | Entradas | Cuáles |
|---|---:|---|
| `spells` | 15 | 5 trucos, 5 de nivel 1 y 5 de nivel 2 (repartidos por el alfabeto) |
| `monsters` | 15 | 10 acciones y 5 reacciones o acciones adicionales de criaturas de VD ≤ 5 |
| `classes` | 5 | Acción astuta, Inspiración bárdica, Forma salvaje, Hechicería innata, Enfoque del monje |
| `origin` | 5 | Conocimiento de la piedra, Linaje gigante, Forma grande, Vuelo dracónico, Resistencia implacable |

Las mismas 40 con los dos modelos instalados, en inglés (desde el texto oficial) y en español (traduciendo el
resumen inglés y chequeándolo contra el texto oficial en español). PC: RTX 3070 Laptop de 8 GB.

## Resultados

| | Gemma 3 12B | Qwen 2.5 7B |
|---|---:|---:|
| Tiempo, 40 entradas en inglés + español | **21 min** | 12 min |
| Inglés: pasaron los chequeos | 28 + 4 «?» | 33 |
| Inglés: quedaron afuera (3 intentos) | 8 (7 por largo) | 7 (todos por largo) |
| Español: pasaron | 27 + 4 «?» | 31 |
| **Entradas con errores graves que pasaron los chequeos** | 4 | 7 |

Errores graves = los que cambian lo que pasa en la mesa:

- **Gemma**: el elemental de aire sin «la mitad si tiene éxito»; la dríade que se teletransporta «a 18 m del
  segundo árbol» (es a 1,5 m de un árbol que está a 18 m); el pulpo sin «bajo el agua»; Linaje gigante
  cortado con un «?» al final.
- **Qwen**: *Salpicadura ácida* con «o la mitad si tiene éxito» (el hechizo no da la mitad: inventado);
  *Elementalismo* en español empezando por «Eliges una criatura»; «Dash, Disengage o Hide», «0 HP» y «1 hr»
  sin traducir; «árbolo» dos veces; *Hechicería innata* en español telegráfico («ventaja ataque conjuro»).

**Recomendación: Gemma 3 12B.** Tarda casi el doble, pero inventa menos y su español es mucho mejor (Qwen
deja inglés y comete errores de idioma que no se ven sin leer). A este ritmo, los ~776 resúmenes del plan
son **unas 7 horas: una noche**.

## La verificación

Se verificaron **las 40, sin muestreo**, en los dos idiomas, contra el texto oficial. Sobre la salida de Gemma:

| | Inglés | Español |
|---|---:|---:|
| Publicados por el modelo | 32 (28 + 4 «?») | 31 (27 + 4 «?») |
| Corregidos | 6 (19 %) | 11 (35 %) |
| Escritos a mano (quedaron afuera, o un «?» que sí se podía resumir) | 9 | 10 |

El español necesitó más corrección que el inglés: casi siempre era un detalle mal pasado (*Comprensión
idiomática* juntaba «hablados y escritos al tocar»; *Flecha ácida* decía «en el fallo» por «si fallas»), no
un número. Coincide con lo medido en las traducciones (`MANUAL.md` § 6): **el borrador local se revisa
entero.**

Resultado final de la tanda (`tanda/`): **36 resúmenes + 4 «?»** en cada idioma, con 0 errores en
`summary-check` y en el validador de siempre (probado con `summary-merge` sobre una copia de los datos:
`validate all` en 0 y el español sigue al 100 % en `ESTADO.md`). Los 4 «?»: *Escritura ilusoria*, *Boca
mágica*, *Truco de la cuerda* (nada que tirar en combate, con muchos detalles) y *Linaje gigante* (seis
beneficios distintos: lo resuelve mejor una tarjeta por beneficio que un resumen).

## Lo que cambió en las herramientas por el piloto

Lo que se le escapó al chequeo y se vio al verificar pasó a ser chequeo (`summary-lib.mjs`):

1. **Un «?» suelto** dentro de un resumen (Gemma lo dejó al final de uno a medias).
2. **«etc.», «e.g.», «…»**: un resumen no deja la lista abierta.
3. **Palabras sin traducir**: una palabra con mayúscula o una abreviatura del resumen inglés («Dash», «HP»,
   «hr») que el texto oficial del idioma no tiene.
4. **«half» / «mitad»** en un resumen cuyo texto no lo dice: el error típico de inventar la salvación a medias.
5. El reintento por **largo** (7 de cada 8 rechazos) ahora le dice al modelo cuántos caracteres sobran y que
   saque el detalle menos importante, en vez de reescribir.

Con estos chequeos se rechazan ahora 4 de las 7 entradas graves de Qwen (el «half» inventado y las tres con
palabras sin traducir) y 1 de las 4 de Gemma (el «?» suelto). Lo que queda (una omisión, un sentido cambiado)
solo lo ve quien lee el texto oficial.

## Costo de la verificación

La verificación de las 40 entradas en los dos idiomas (leer la tabla, corregir y escribir lo que faltaba)
llevó del orden de 60.000–80.000 tokens. Es una estimación, no una medición exacta. A ese ritmo, las ~20
tandas del plan serían **~1,2–1,6 M de tokens**: algo más que lo estimado (0,6–1,2 M), porque en el piloto
hubo que escribir a mano el 25 % de las entradas. Si el reintento nuevo por largo baja lo que queda afuera,
baja también el costo. Conviene medirlo en la primera noche.

## Para Franco

1. Leer `revisar-spells.md`, `revisar-monsters.md`, `revisar-classes.md` y `revisar-origin.md` (oficial y
   resumen, en los dos idiomas) y marcar lo que no cierre.
2. Decidir los 4 «?».
3. Si está bien: `summary-merge` de las 8 tandas (ver `MANUAL.md` § 13) y versión nueva.
4. Primera noche: `node tools/summary-night.mjs --catalog spells --batches 8 --model gemma3:12b --keys-file
   <prioridad>` (los hechizos de nivel 0–3 primero: la lista sale de Brandsen, que conoce los niveles).
