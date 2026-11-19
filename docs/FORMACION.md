# Mi formación: paso a paso y celebraciones

Lo ve el aspirante en **Mi formación**. Todo está en `js/app.js` (pantallas) y `css/styles.css` (al final, sección «Mi formación · paso a paso»).

## Tu camino

- **Cada módulo es un paso numerado** (Paso 1, Paso 2…), en el orden del panel. Al final siempre aparece **«Practica y demuestra»** (Boost y Assessment).
- **«Para todos»** reemplaza a «Tronco común» en lo que ve el aspirante. En el panel sigue llamándose Tronco común. Los módulos de la célula dicen «Tu célula: Payments» (o la que sea).
- **Barra lateral:** los pasos van unidos por una línea; el que toca va en azul marino con brillo, los listos en verde y los bloqueados en gris.
- **Inicio:**
  - Arriba, **«Tu siguiente paso»**: un solo botón (late para llamar la atención) y qué hacer en 3 puntos (ver el video, marcar la lección, aprobar el examen).
  - Debajo, las tarjetas de cada paso con su barra de avance y la etiqueta Te toca, Listo o Bloqueado.
  - Una nota explica qué es «Para todos».
- **Recorrido de bienvenida:** la primera vez salen 3 globitos («Tu camino», «Tu siguiente paso», «Practica cuando quieras»). Se guarda en el navegador que ya lo vio (`elx_tour_formacion_v1`).

## Lección

- Arriba, la barra del paso: Lección 1 → Lección 2 → Examen.
- Debajo del video, 3 cajitas con lo que tiene que hacer: mirar el video (o leer), marcar como completada y presentar el examen (o seguir con la próxima lección).
- Al llegar al % mínimo del video: «¡Listo! Ya puedes marcarla» y el botón empieza a latir.
- Al marcarla: **«¡Lección completada!»** abajo a la derecha, con lo que sigue y un contador de 3 segundos; pasa sola a lo siguiente, salvo que presione «Quedarme aquí».

## Examen

- **Aprobado:** ventana con medalla, confeti y «¡Felicidades, [nombre]!», con la descripción del módulo, la nota, las respuestas correctas y el % del camino. Abajo, **«Desbloqueaste: Paso N»** con el botón «Ir ahora».
- **Hito:** al aprobar el último paso «Para todos» (y empezar la célula) o al terminar toda la ruta, sale una pantalla completa con el camino pintado y el botón para seguir (o ver el certificado).
- **No aprobado:** «¡Casi! Te faltó poco» (si quedó a 20 puntos o menos de la nota mínima) o «Todavía no lo logras». Muestra cuántos intentos quedan y las preguntas que falló para repasar, sin la respuesta correcta.

## Animaciones

Entradas de las tarjetas, barras que se llenan, números que suben, botón que late, check, medalla, confeti y candado que se abre. Todas duran menos de 1 segundo (salvo el confeti) y se apagan si la computadora tiene «reducir movimiento».
