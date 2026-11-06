# Simulador de tickets (Assessment)

Lo encuentra el aspirante en **Assessment → Simulador de tickets**. Calidad y Reclutamiento lo revisan en el panel, en **Simulador**.

## Niveles

Cada nivel se desbloquea al terminar el anterior. Hay 1 intento por nivel (configurable), y Reclutamiento puede dar uno más.

| Nivel | Cómo llegan los tickets | Panel Zupper | Estatus del ticket |
|---|---|---|---|
| **Básico** (3 tickets, 15 min) | Uno a la vez: el siguiente llega cuando resuelve el anterior | No | Solo «Resuelto» |
| **Intermedio** (6 tickets, 20 min) | Máximo 2 abiertos a la vez | Sí | Abierto · PENDIENTE · Aún no recibimos respuesta · Resuelto |
| **Realidad** (9 tickets, 25 min) | Por tiempo, en ráfaga, aunque no haya terminado los anteriores | Sí | Igual que Intermedio |

## Qué vive el aspirante

- **Bandeja tipo Zendesk.**
  - **Inicio:** «Su trabajo › Tickets», con el estatus de cada ticket, cuánto lleva esperando el cliente y estadísticas.
  - **Vistas:** Nuevos | Sin Asignar, Activos | En Gestión, Pendiente | Respuesta Cliente, Pendiente | Área Interna y Resueltos.
  - **Pestañas:** una por ticket. Llegan con sonido y con aviso «!» cuando el cliente escribe.
  - **Tema:** claro u oscuro.
- **Responder.** El aspirante elige una sugerencia o escribe directamente en el chat. Si edita una sugerencia, cuenta como respuesta propia. Las respuestas propias las revisa Calidad, con una revisión automática de ortografía: minúscula inicial, falta de punto final, «¿/¡», abreviaturas como «q» o «k», tildes comunes, letras repetidas y mayúsculas.
- **Cliente que reacciona.**
  - Su humor cambia según cada respuesta.
  - Si pasa 1 minuto sin respuesta, insiste.
  - Puede mandar fotos, que se abren con un clic.
  - A veces deja de responder: en ese caso el estatus correcto es «Aún no recibimos respuesta».
- **Casos que no son de Orders,** como el pago de un conductor o el cobro de un viaje. Lo correcto es transferir el caso y dejarlo en **Abierto**. Responderlos como si fueran de Orders penaliza.
- **Panel Zupper**, igual al real:
  - Columnas: Orden #, Solicitada, Comercio, estatus de Comercio, Entrega y Pago, Método de pago, Total, Usuario y Atendida por (con «Sin enviar al pool» y «Asignar repartidor»).
  - Filtros por columna y menú ⋮ de acciones: contactar al comercio o al repartidor, asignar, publicar en el grupo de Shoppers, devolver al comercio y cancelar.
  - El reloj va acelerado (×10).
- **Al terminar** ve:
  - Cuántos clientes lo calificaron **Bien** o **Mal** y cuáles fueron, según cómo quedó cada cliente.
  - Tickets atendidos, tiempo de primera respuesta y acciones en el panel.
  - No ve su nota.

## Cómo se califica (todo en el servidor)

| Qué | Puntos |
|---|---|
| Respuesta sugerida | buena 2 · regular 1 · mala 0 |
| Respuesta escrita | no cuenta hasta que Calidad la califica |
| Motivo de contacto correcto | 2 por ticket |
| Estatus correcto (Intermedio y Realidad) | 2 por ticket |
| Acción esperada en el panel, hecha a tiempo | 2 |

**Calificación del cliente** (Bien/Mal): si el cliente terminó Neutral o Positivo es «Bien»; si terminó Negativo o peor, «Mal».

**Reglas del panel** (material de ORDERS de AdminCX y reuniones del 6 de noviembre):

- **No iniciada:** contactar al comercio. Si a los **10 min de pagada** no responde, se cancela.
- **No iniciada con el repartidor ya en el comercio:** contactar al comercio. Casi siempre la orden está lista y olvidaron marcarla.
- **Preparada con más de 8 min sin repartidor:** asignar a mano.
- **Forum SuperMayorista:** publicar la orden en el grupo de Shoppers.
- **En destino y el cliente no responde:** a los 15 min, devolver la orden al comercio.
- **Orden en tiempo:** cancelarla cuenta como «mala».

## Dónde se guarda

- **Resultados:** dentro del aspirante (`asp.simulador`). No hay colecciones nuevas en MongoDB.
- **Casos, órdenes y niveles:** en `config.general.simulador`. Mientras nadie guarde una configuración, se usan los de ejemplo de `js/handlers.js`.

## Editar casos

Ve a **Panel → Simulador → Configurar → Exportar casos (.json)**. Edita el archivo y súbelo con **Importar archivo**.

- **Ticket:**
  - `pasos`: cada uno con `cliente` (sus mensajes; `[foto] descripción` muestra una foto) y `opciones`.
  - `opciones`: cada una con `t` (texto), `v` (`buena`/`regular`/`mala`), `r` (respuesta del cliente; vacía si deja de responder) y `h` (cambio de humor).
  - `otro`: lo que contesta el cliente cuando el aspirante escribe su propia respuesta.
  - `motivo` y `estados` (los estatus correctos).
- **Orden:**
  - `eventos`: minuto del panel, `c` (estatus del comercio), `e` (estatus de la entrega), `rep` y `rol`.
  - `respuestas`: qué pasa con cada acción.
  - `reglas`: `accion`, `desde`, `hasta`, `v`, `nota` y `esperada`.
- **Nivel:** `casos`, `minutos`, `maxAbiertos` (0 = llegan por tiempo), `intervalo`, `panel` y `estados`.
- **Pendiente:** reemplazar los casos de ejemplo por los tickets reales del fin de semana (María Guerrero).

## Sonidos

Están en `sonidos/nuevo-ticket.wav` y `sonidos/mensaje.wav`, y son sintéticos. Para usar el sonido real de Zendesk, grábalo y súbelo con el mismo nombre.

## Archivos

- **Nuevos:** `js/simulador.js`, `css/simulador.css`, `sonidos/`, `docs/SIMULADOR.md`.
- **Modificados:** `js/handlers.js`, `js/app.js`, `js/admin.js`, `css/styles.css`, `index.html`.
