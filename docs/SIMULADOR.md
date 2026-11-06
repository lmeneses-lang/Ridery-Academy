# Simulador de tickets (Assessment)

Lo encuentra el aspirante en **Assessment → Simulador de tickets**. Calidad y Reclutamiento lo revisan en el panel, en **Simulador**.

## Qué vive el aspirante

- **Bandeja tipo Zendesk.** Los tickets de WhatsApp llegan en ráfaga, con sonido y en una pestaña propia. El aspirante contesta con respuestas sugeridas o con **«Otro»** (texto libre). Después elige el **Motivo de contacto** y envía el ticket como **Resuelto**.
- **Cliente que reacciona.** Cada respuesta cambia el humor del cliente (Positivo → Crítico). Si pasa 1 minuto sin una primera respuesta, el cliente insiste.
- **Panel de órdenes** (estilo Panel Zupper). Las órdenes de los comercios avanzan solas con un reloj acelerado (×10 por defecto). El aspirante decide cuándo contactar al comercio, contactar al repartidor, reasignar, publicar en el grupo de Shoppers, devolver al comercio o cancelar.
- **Los tickets no traen los datos de la orden.** El aspirante tiene que buscarla en el panel por número o por cliente.
- **Al terminar** ve solo cuántos tickets resolvió, su tiempo de primera respuesta y cuántas acciones hizo. No ve su nota.

## Cómo se califica (todo en el servidor)

| Qué | Puntos |
|---|---|
| Respuesta sugerida | buena 2 · regular 1 · mala 0 |
| «Otro» | no cuenta hasta que Calidad la califica en el panel |
| Motivo de contacto correcto | 2 por ticket |
| Acción esperada en el panel, hecha a tiempo | 2 |

Las acciones del panel se evalúan contra las **reglas** de cada orden: qué acción, desde qué minuto y hasta cuál. Las que siguen vienen del material de ORDERS de AdminCX y de la reunión del 6 de noviembre:

- **No iniciada:** contactar al comercio. Si a los **10 min de pagada** no responde, se cancela. Cancelar antes es «mala».
- **No iniciada con el repartidor ya en el comercio:** contactar al comercio. Casi siempre la orden está lista y olvidaron marcarla.
- **Preparada con más de 8 min sin repartidor:** asignar a mano.
- **Forum SuperMayorista:** publicar la orden en el grupo de Shoppers.
- **En destino y el cliente no responde:** a los 15 min, indicarle al repartidor que la devuelva al comercio.
- **Orden en tiempo** (La Casa del Pan): cualquier intervención innecesaria cuenta como «mala».

## Dónde se guarda

- **Resultados:** dentro del aspirante (`asp.simulador`), igual que Boost. No hay colecciones nuevas en MongoDB.
- **Casos y órdenes:** en `config.general.simulador`. Mientras nadie guarde una configuración, se usan los casos de ejemplo de `js/handlers.js` (`SIM_CASOS_DEFAULT` y `SIM_ORDENES_DEFAULT`).

## Editar casos

Ve a **Panel → Simulador → Configurar → Exportar casos (.json)**. Edita el archivo y vuelve a subirlo con **Importar archivo**, y después **Guardar**.

- Cada ticket tiene `pasos`, y cada paso tiene:
  - `cliente`: los mensajes del cliente.
  - `opciones`: cada una con `t` (texto), `v` (`buena`/`regular`/`mala`), `r` (lo que responde el cliente) y `h` (el cambio de humor).
  - `otro`: lo que responde el cliente cuando el aspirante escribe su propia respuesta.
- Cada orden tiene:
  - `eventos`: el minuto del panel y el estatus.
  - `respuestas`: qué pasa con cada acción.
  - `reglas`: `accion`, `desde`, `hasta`, `v`, `nota` y `esperada`.
- **Siguiente paso sugerido:** reemplazar los casos de ejemplo por los tickets reales del fin de semana (María Guerrero).

## Sonidos

Están en `sonidos/nuevo-ticket.wav` y `sonidos/mensaje.wav`, y son sintéticos y parecidos a los de Zendesk. Para usar el sonido real, grábalo y súbelo con el mismo nombre. Si un archivo no carga, el navegador genera un tono de respaldo.

## Archivos

- **Nuevos:** `js/simulador.js`, `css/simulador.css`, `sonidos/`, `docs/SIMULADOR.md`.
- **Modificados:**
  - `js/handlers.js`: casos, motor y acciones `sim*`, más los permisos de Reclutador y Calidad.
  - `js/app.js`: la tarjeta del simulador en Assessment.
  - `js/admin.js`: la pestaña Simulador.
  - `css/styles.css`: estilos de la tarjeta y de la revisión.
  - `index.html`: carga el css y el js del simulador.
