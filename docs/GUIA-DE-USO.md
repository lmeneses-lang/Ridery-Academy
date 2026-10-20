# Guía de uso · Ridery Academy

Qué hace la plataforma, pantalla por pantalla. Para el código, mira [ARQUITECTURA.md](ARQUITECTURA.md).

## Cómo funciona

La página abre con dos opciones.

**Postúlate** (público, sin registro previo). Es la evaluación de ingreso, de unos 20 minutos:

1. **Tus datos:** nombre, cédula, edad, correo, teléfono (WhatsApp) y ciudad.
2. **Una página por sección**, en este orden por defecto: Experiencia, Casos de atención, Comunicación y criterio, Proactividad y herramientas, Condiciones operativas, Tu estilo de trabajo y Prueba escrita.
3. **Revisión:** ve todas sus respuestas y puede cambiar cualquier sección antes de enviar.
4. **Gracias:** solo ve que su postulación fue recibida. **No ve su nota ni su célula.**

Las secciones y preguntas viven en la base de datos (no en el código) y se editan en el panel, en **Formulario**. Con **Importar** cargas un archivo `.json` de preguntas (modo *Agregar* suma y actualiza; *Reemplazar todo* deja solo las del archivo) y con **Exportar** descargas el formulario completo para respaldarlo o reutilizarlo.

**Ojo:** el archivo exportado incluye las respuestas correctas. Guárdalo en un lugar privado y **nunca lo subas al repositorio**, porque todo lo que está en el repo se publica en la web. Hay cuatro tipos de pregunta: una opción, varias opciones, respuesta corta y respuesta larga. Cada opción puede:

- **Sumar puntos a una célula.** Con eso se sugiere la célula, igual que antes.
- **Ser la respuesta correcta.** Esa pregunta cuenta para la **nota de casos**.
- **Tener un filtro:** *Marcar alerta* (sale en rojo en la postulación) o *Descartar automáticamente* (la postulación cae directo en Descartados). Por defecto, «Conexión inestable o intermitente» descarta.
- **Desmarcar las demás** (en varias opciones), para respuestas como «Ninguna de las anteriores».

En las preguntas de respuesta larga puedes bloquear el pegado de texto, para que la prueba escrita la escriba la persona.

En **Postulaciones** ves la nota de casos y las alertas de cada persona. Al abrirla ves sus respuestas por sección: cuáles acertó, cuál era la correcta y su prueba escrita completa.

**En el panel** abres la postulación, revisas los puntajes y la apruebas eligiendo su **célula** y creándole un **usuario** (por defecto, su cédula) y una **contraseña** (botón Generar), o la descartas. Al aprobar te aparece el mensaje con su acceso para copiarlo y enviarlo por WhatsApp. La contraseña se guarda cifrada y no se puede volver a ver: si la olvida, le generas una nueva desde su ficha.

**Inicia sesión** es un solo acceso para todos: si el usuario es del equipo, entra directo al panel; si es un aspirante aprobado, entra a su formación. Un nombre de usuario no puede repetirse entre aspirantes y cuentas del panel. Los aspirantes ven:

1. El **tronco común** y después **solo los módulos de su célula**. Los módulos se desbloquean en orden.
2. **Lecciones** con video de YouTube, texto e imágenes. Hay que ver el 90% del video y adelantarlo no cuenta.
3. Un **examen** de selección simple al final de cada módulo:
   - las preguntas y opciones cambian de orden en cada intento;
   - hay una nota mínima y un número limitado de intentos;
   - la corrección se hace en el servidor.
4. Un **certificado** al aprobar todo.

## Usuarios del panel

- **Cuenta principal:** es la de `ADMIN_USER` y `ADMIN_PASS` en Vercel. Siempre es Admin y sirve de respaldo si alguien pierde el acceso.
- **Más cuentas:** en **Panel → Usuarios → Nuevo usuario** creas una cuenta para cada persona, con su propio usuario, clave y rol:

| Rol | Puede |
|---|---|
| Admin | Todo: contenido, test, ajustes y usuarios |
| Reclutador | Postulaciones (aprobar, descartar, agregar aspirantes y darles acceso), Assessment y métricas |
| Calidad | Ver postulaciones, aspirantes y métricas, y responder en Assessment |

Las claves se guardan cifradas (scrypt) y no se pueden volver a ver: si alguien la olvida, le pones una nueva. Si desactivas o eliminas una cuenta, esa persona pierde el acceso en su siguiente acción.

## Agregar aspirantes a mano

En **Postulaciones → Agregar aspirante** registras a alguien sin que haga el test (referidos o reingresos). Queda aprobado con la célula, el usuario y la contraseña que le asignes, y entra por "Inicia sesión".

## Boost

Es un área que el aspirante tiene siempre disponible (pestaña **Boost**) para entrenar sus cuellos de botella. Las actividades no afectan su ruta de formación.

**Mecanografía.** El aspirante copia textos reales de atención al cliente contra el reloj:

- Elige la duración (por defecto 1, 2 o 3 minutos).
- El reloj arranca con la primera tecla. No se puede pegar texto.
- Ve en vivo sus palabras por minuto (PPM), su precisión y sus errores.
- Al terminar ve su resultado comparado con la meta, si fue récord y su historial.

En el panel, **Boost** (solo Admin) te deja:

- activar o desactivar la actividad;
- fijar la meta de PPM y la precisión esperada;
- elegir las duraciones;
- editar los textos de práctica.

El resultado de cada aspirante (mejor marca, último intento, intentos) aparece en su ficha y en el CSV.

## Assessment (chat)

Es un chat entre el aspirante (pestaña **Assessment**) y el equipo (panel → **Assessment**).

- **Panel:** una bandeja con todos los aspirantes aprobados, buscador, contador de no leídos y aviso cuando llega un mensaje nuevo.
- **Quién responde:** Admin, Reclutador y Calidad.
- **Eliminar un chat:** la **X** en cada conversación (Admin y Reclutador) borra todo el historial, también para el aspirante.
- **Aspirante:** ve un contador en la pestaña y un aviso si le escriben mientras está en otra sección.
- **Velocidad:** los mensajes llegan en unos 2 segundos. Con el chat abierto, la página revisa si hay mensajes nuevos cada 2 s, y pausa la revisión si la pestaña está en segundo plano. Funciona en Vercel Hobby sin servicios extra.
- **Si se necesita instantáneo con muchos usuarios a la vez:** se puede conectar un servicio de tiempo real como Ably o Pusher (tienen plan gratuito) sin cambiar la interfaz.

## Imágenes con Lightshot

- **Enlace `prnt.sc/...`:** es una página, no una imagen. Se muestra como un botón "Abrir captura".
- **Para que la imagen se vea dentro de la lección:** abre el enlace, haz clic derecho sobre la imagen → *Copiar dirección de la imagen* y pega ese enlace. Empieza con `https://image.prntscr.com/...`.
- **También puedes subir imágenes desde tu equipo.** Se comprimen solas y se guardan en MongoDB. El máximo es unos 4 MB por módulo.

## Modo demo

Abre `index.html?demo=1` o `admin.html?demo=1` para probar todo sin base de datos. Los datos quedan solo en tu navegador.

En la demo existe un aspirante ya aprobado (usuario `demo`, contraseña `demo1234`). La cuenta del panel en la demo es `admin` / `admin1234` para ver la formación directamente.

Si no lo quieres en producción, borra la línea `<script src="js/demo.js">` de los dos HTML.

## Marca

- **Logo:** `img/logo-512.png`, con versiones para la pestaña del navegador (`favicon.ico`, `favicon-64.png`) y para el ícono en el celular (`apple-touch-icon.png`).

Sigue el manual de Ridery:

- **Colores principales:** verde `#38CEA6` y azul marino `#0F111E`.
- **Detalles:** fucsia `#D71D5C` y azul rey `#272883`.
- **Tipografía:** Urbanist en textos y Bebas Neue en cifras.

Todo está en variables al inicio de `css/styles.css`.

## Próximas ideas

- Una simulación de ticket real, que revisa Calidad.
- Avisar al supervisor cuando un aspirante termina o se queda sin intentos.
- Un rol "Calidad" con acceso de solo lectura al panel.

