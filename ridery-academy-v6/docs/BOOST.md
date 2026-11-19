# Boost

En **Boost** el aspirante encuentra actividades cortas que puede practicar cuando quiera. No afectan su ruta de formación, pero el equipo ve su mejor resultado en la ficha del aspirante (Postulaciones → Aspirantes).

| Categoría | Actividad | Qué hace |
|---|---|---|
| Memoria y navegación | **¿Dónde lo busco?** | Se plantea un caso y el aspirante elige la herramienta y la ruta exacta (Admin, Panel Zupper o Zendesk). |
| | **Pares de memoria** | Voltear tarjetas para unir cada término con su significado: estatus, Trip History, surge, ZupperCredits, etc. |
| | **Flash de procesos** | Se muestra un protocolo por 20 segundos y después hay que ordenarlo de memoria. |
| Escritura | **Mecanografía** | Ya existía: mide palabras por minuto y precisión. |
| | **Redacción** | Reescribir un mensaje mal escrito. Se califica con la revisión de ortografía del simulador y con si se tocó la idea principal. |
| | **Respuesta en 1 minuto** | Contestar un caso contra reloj. Se revisa que tenga saludo, solución concreta y cierre, y la ortografía. |
| Empatía y criterio | **¿Esto o esto?** | Elegir la mejor de dos respuestas, con la explicación de por qué. |
| | **Frases prohibidas** | Marcar las frases que no se deben decir a un cliente. |
| | **Triage de prioridades** | Ordenar 5 casos simultáneos del más urgente al menos urgente (accidentes y SOS primero). |
| | **Tono del cliente** | Reconocer si el cliente está molesto, confundido, urgido o tranquilo. |

- **Activar o desactivar actividades:** Panel → Boost → «Otras actividades» → Guardar.
- **Editar el contenido:** está en `js/boost-contenido.js`, con listas sencillas: preguntas, pares, protocolos, mensajes, frases, casos y tonos. Como es práctica, las respuestas viven en ese archivo.
- **Resultados:** se guardan dentro del aspirante (`asp.boost.<actividad>`) con mejor marca, intentos y los últimos 10 intentos.
- **Archivos:**
  - Nuevos: `js/boost.js` y `js/boost-contenido.js`.
  - Modificados: `js/handlers.js` (acción `boostActividad` y lista `BOOST_ACTIVIDADES`), `js/app.js`, `js/admin.js`, `css/styles.css` e `index.html`.
