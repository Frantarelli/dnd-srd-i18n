# Seguridad

Este repositorio contiene **texto plano** (traducciones del SRD) y herramientas sin dependencias.
Lo que protege a las aplicaciones que lo usan:

- Todo *pull request* pasa por la barrera `tools/guard.mjs` (job `guard`, con el código de la rama
  principal): solo traducciones, sin HTML, scripts, enlaces ajenos, plantillas ni caracteres
  invisibles de dirección. Detalle en el [README](README.md#contribuir).
- `main` exige que pasen `validate` y `guard`, y la aprobación del mantenedor.
- Las etiquetas de versión (`v*`) están protegidas contra borrado y reescritura: una versión
  publicada no cambia nunca. Fijá siempre la etiqueta.
- Las acciones de GitHub están fijadas por commit y se actualizan con Dependabot.

## Cómo reportar un problema

- **Contenido sospechoso ya publicado** (un texto con un enlace, un script, algo que no parece una
  traducción) o **una forma de saltarse la barrera**: abrí un
  [aviso privado de seguridad](../../security/advisories/new) (pestaña *Security* → *Report a
  vulnerability*). No lo publiques en un *issue*.
- Un error de traducción común no es un tema de seguridad: usá la plantilla de *issue*.

Respondemos lo antes posible. Si sos desarrollador de una aplicación, leé
[`docs/INTEGRACION.md`](docs/INTEGRACION.md): volvé a validar lo que instalás y mostralo siempre como
texto, nunca como HTML.
