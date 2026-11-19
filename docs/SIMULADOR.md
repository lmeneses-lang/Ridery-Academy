# Simulador de tickets (Assessment)

Lo encuentra el aspirante en **Assessment → Simulador de tickets**. Calidad y Reclutamiento lo revisan en el panel, en **Simulador**.

## Rutas

Hay tres rutas de práctica, cada una con sus 3 niveles (Básico → Intermedio → Realidad):

- **Orders:** Zendesk + **Panel Zupper**. Los tickets son de pedidos.
- **Viajes:** Zendesk + **Admin de Ridery** (réplica de admin.ridery.app). Los tickets son de viajes: cobro de más, conductor que «ya llegó», deuda de un viaje de 2021, objeto perdido y un caso de Zupper que hay que transferir.
- **Células:** Zendesk + **Admin completo**. Tickets de las demás células, armados con las guías de Material de apoyo de AdminCX:

| Caso | Célula | Dónde se resuelve | Acción esperada en el Admin |
|---|---|---|---|
| Me quitaron los KM de referidos (usuario 302915) | Payments | Users → Wallet History | Add Wallet: 5 KM, tipo «Vencimiento de referidos» |
| No me aprueban la autenticación (usuario 1873402) | Fraud | Users → View Document (foto con flash) | — |
| Me cobraron un viaje que no se hizo (viaje 86162544) | Trips | Completed Requests → View Map (0 km) | Cancel Trip con motivo «Viaje no realizado» |
| Conductor suspendido (conductor 448203) | Supply | Service Providers → Driver's Records, Cancelled Trips → See Cancel Description | — |
| Suspendido por cancelaciones (conductor 391577) | Match & Pricing | Cancelled Trips filtrando por Provider Id: 3 seguidas | — |
| No me llegó el pago (conductora 215664) | Payments | Trip Payment → Payment Inquiries (Removed from liquidación: Yes) | Reject de la cuenta en Datos Bancarios Providers |
| El conductor fue grosero (viaje 86163011) | CX | Reviews → Bad Reviews Users | Contacted |
| El usuario no me pagó el efectivo (viaje 86163870) | Payments | Completed Requests (Pay By Cash, validado) | User's Records: reporte del usuario 1144290 |

**ID de usuario y de conductor:** son números distintos. Users solo busca usuarios y Service Providers solo busca conductores; buscar con el ID en el módulo equivocado no encuentra a la persona. Hay dos trampas a propósito: el **302915** es una usuaria en Users y otro conductor en Service Providers, y el **448203** es un conductor y otra usuaria. Si el aspirante revisa a la persona equivocada, no cuenta como «revisó antes de responder».

**Navegador de práctica:** arriba hay pestañas tipo Chrome, una por herramienta: **Zendesk**, **RIDERY** (Admin) y **Panel Zupper**, cada una con su URL. Como en la vida real, para buscar un viaje el aspirante se cambia de pestaña. Si llega un ticket mientras está en otra herramienta, la pestaña de Zendesk muestra un punto rojo y suena el aviso.

**Admin de práctica:**

- **Todos los módulos del menú:** Trips, Shipments, Reviews (All, Bad Reviews Users/Drivers, Contacted), Map View, Service Providers (All, Online, Approved, Unapproved, Blocked, Cash Blocked, Suspended, Deleted, Provider's Incidents, Datos Bancarios, Payment Agreement, Auto Suspension History), Users (Users, Blocked, Deleted, User's Incidents), Emprende con Ridery, Service Types, Store (Warehouse con stock por ciudad, Inventory, Accessories y reportes), Fraud, Trip Payment (Payment Inquiries con liquidación, Cash Disputes), Report, Settings (Promo Codes) y Administrative.
- **Action de conductores:** Edit Detail, Vehicle, Banking Detail, History, Driver's Records, Driver's cash blocked history, Referral history, View Document y Delete Provider. **Action de usuarios:** Edit Detail, History, User's Records, Referral history, Wallet History, Delete User, View Document, Decline, Add Wallet, Incident's History y Change Password.
- **Acciones que se califican:** Add Wallet (monto, moneda, Add/Cut y tipo), Reject de cuenta bancaria, Contacted en Reviews, reporte en User's Records y Cancel Trip con «Cancelation Reason» (la misma lista del Admin). Si el caso espera la acción y se hace bien, suma 2; con otro tipo o motivo, 1. Delete User/Provider, Decline y Change Password sin motivo cuentan como «mala».
- **Módulos de Trips:** Dashboard, All Trips, Waiting, Running y Completed Requests, Scheduled Requests, Cancelled Trips, Sos Trips y Special trips. Cada uno tiene las mismas columnas y filtros del real: SORT, SEARCH por Id/User Name/User Id/Provider Name/Phone, Date Filter, Trip Type y Apply.
- **All Trips** sale vacío hasta presionar **Apply**. Los viajes viejos solo aparecen con **Trip History** y una fecha de inicio anterior; por ejemplo, el viaje 254552 de 2021 sale con «2020-01-01».
- **Menú Action:** View Map (detalle con Trip Requested / Trip Completed, mapas, KM, tiempo, surge y total), Chat History o Messages, See Cancel Description (motivo, ticket y captura), Copy Route Url for Google Maps y Cancel Trip (también en viajes completados, como en el real).
- Los viajes avanzan solos: Waiting → Accepted → Started → Completed.
- **Revisar antes de responder:** algunos casos piden consultar un viaje o una orden. Si el aspirante abrió ese viaje u orden (detalle, mensajes o búsqueda) antes de dar la respuesta clave, suma 2 puntos. Calidad ve en cada ticket si lo revisó o no. Cancelar un viaje sin motivo cuenta como «mala».

## Niveles

Con **«Niveles en orden»** encendido (en Configurar), cada nivel se desbloquea al terminar el anterior. Apagado, el aspirante elige el nivel que quiera desde el principio.

**Intentos por nivel** son las veces que cada aspirante puede hacer cada nivel; por defecto es 1. Reclutamiento puede darle uno extra a una persona con «Darle otro intento».

| Nivel | Cómo llegan los tickets | Abandono del cliente | Panel Zupper | Estatus del ticket |
|---|---|---|---|---|
| **Básico** (3 tickets, 15 min) | Uno a la vez: el siguiente llega cuando resuelve el anterior | 4 min sin respuesta | No | Solo «Resuelto» |
| **Intermedio** (6 tickets, 20 min) | Máximo 2 abiertos a la vez | 3 min | Sí | Abierto · PENDIENTE · Aún no recibimos respuesta · Resuelto |
| **Realidad** (9 tickets, 25 min) | Por tiempo, en ráfaga, aunque no haya terminado los anteriores | 2 min | Sí | Igual que Intermedio |

## Qué vive el aspirante

- **Bandeja tipo Zendesk.**
  - **Inicio:** «Su trabajo › Tickets», con el estatus de cada ticket, cuánto lleva esperando el cliente y estadísticas.
  - **Vistas:** Nuevos | Sin Asignar, Activos | En Gestión, Pendiente | Respuesta Cliente, Pendiente | Área Interna, Resueltos y Abandonados. No tienen la columna de índice de satisfacción, porque en el Zendesk real no la usan.
  - **Pestañas:** una por ticket. Llegan con sonido y con aviso «!» cuando el cliente escribe.
  - **Tema:** claro u oscuro.
- **Responder.** El aspirante elige una sugerencia o escribe directamente en el chat. Si edita una sugerencia, cuenta como respuesta propia. Las respuestas propias las revisa Calidad, con una revisión automática de ortografía: minúscula inicial, falta de punto final, «¿/¡», abreviaturas como «q» o «k», tildes comunes, letras repetidas y mayúsculas.
- **Cliente que reacciona.**
  - Su humor cambia según cada respuesta, y **cada respuesta lo lleva por un camino distinto**. Por ejemplo, si el saludo es malo, pide un supervisor, y si el agente no lo maneja bien, se va.
  - **Abandono:** si el cliente espera respuesta más del tiempo del nivel, se va. El ticket queda «Abandonado», ya no se le puede escribir y cuenta como calificación «Mal». En los últimos 45 segundos aparece un aviso en rojo con la cuenta regresiva.
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

**Calificación del cliente** (Bien/Mal): si el cliente terminó Neutral o Positivo es «Bien»; si terminó Negativo o peor, o abandonó, «Mal».

**Reglas del panel** (material de ORDERS de AdminCX y reuniones del 6 de noviembre):

- **No iniciada:** contactar al comercio. Si a los **10 min de pagada** no responde, se cancela.
- **No iniciada con el repartidor ya en el comercio:** contactar al comercio. Casi siempre la orden está lista y olvidaron marcarla.
- **Preparada con más de 8 min sin repartidor:** asignar a mano.
- **Forum SuperMayorista:** publicar la orden en el grupo de Shoppers.
- **En destino y el cliente no responde:** a los 15 min, devolver la orden al comercio.
- **Orden en tiempo:** cancelarla cuenta como «mala».

## Dónde se guarda

- **Resultados:** dentro del aspirante (`asp.simulador`). No hay colecciones nuevas en MongoDB.
- **Casos, órdenes, niveles y datos del Admin** (usuarios, conductores, reseñas, liquidaciones): en `config.general.simulador`. Mientras nadie guarde una configuración, se usan los de ejemplo de `js/handlers.js`.

## Editar casos

Ve a **Panel → Simulador → Configurar → Exportar casos (.json)**. Edita el archivo y súbelo con **Importar archivo**.

- **Ticket:**
  - `pasos`: cada uno con `cliente` (sus mensajes; `[foto] descripción` muestra una foto) y `opciones`. Un paso puede tener `id`; si además lleva `rama: true`, solo se llega a él por un salto.
  - `opciones`: cada una con `t` (texto), `v` (`buena`/`regular`/`mala`), `r` (respuesta del cliente; vacía si deja de responder), `h` (cambio de humor), `ir` (el `id` del paso al que salta) y `fin` (el cliente se va).
  - `otro`: lo que contesta el cliente cuando el aspirante escribe su propia respuesta.
  - `motivo` y `estados` (los estatus correctos).
- **Orden:**
  - `eventos`: minuto del panel, `c` (estatus del comercio), `e` (estatus de la entrega), `rep` y `rol`.
  - `respuestas`: qué pasa con cada acción.
  - `reglas`: `accion`, `desde`, `hasta`, `v`, `nota` y `esperada`.
- **Nivel:** `casos`, `minutos`, `maxAbiertos` (0 = llegan por tiempo), `intervalo`, `abandono` (segundos; 0 = apagado), `panel` y `estados`.
- **Pendiente:** reemplazar los casos de ejemplo por los tickets reales del fin de semana (María Guerrero).

## Sonidos

Están en `sonidos/nuevo-ticket.wav` y `sonidos/mensaje.wav`, y son sintéticos. Para usar el sonido real de Zendesk, grábalo y súbelo con el mismo nombre.

## Archivos

- **Nuevos:** `js/simulador.js`, `css/simulador.css`, `sonidos/`, `docs/SIMULADOR.md`.
- **Modificados:** `js/handlers.js`, `js/app.js`, `js/admin.js`, `css/styles.css`, `index.html`.
