# Estado de las traducciones

Generado por `node tools/cli.mjs status`. Validar todo: `npm run check`.
El detalle de cada entrada está en `CHECKLIST.<idioma>.md`.

✅ completo y validado · 🟡 en curso · ⬜ sin empezar · ❌ tiene errores

| Catálogo | Textos | Caracteres | ES |
|---|---:|---:|:---:|
| origin | 177 | 16192 | ✅ 100 % (177/177) |
| spells | 987 | 239359 | ✅ 100 % (987/987) |
| classes | 534 | 130918 | ✅ 100 % (534/534) |
| items | 1920 | 408434 | ✅ 100 % (1920/1920) |
| magicitems | 1533 | 379300 | ✅ 100 % (1533/1533) |
| monsters | 3006 | 226409 | ✅ 100 % (3006/3006) |

Errores = lo que la validación rechaza (números que faltan, estructura rota, registro,
unidades sin convertir, términos obligatorios). Para sumar un idioma:
`node tools/cli.mjs new-language <código> "<Nombre>"` y seguir `README.md`.

## ES: validación

| Catálogo | Errores | Avisos |
|---|---:|---:|
| origin | 0 | 0 |
| spells | 0 | 7 |
| classes | 0 | 2 |
| items | 0 | 24 |
| magicitems | 0 | 15 |
| monsters | 0 | 72 |
