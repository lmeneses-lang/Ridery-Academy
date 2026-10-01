# Formación CX · Ridery

Una plataforma de e-learning para aspirantes a agentes de CX. Funciona aparte de AdminCX, con el mismo stack: Vanilla JS, funciones de Vercel, MongoDB y JWT.

- `/` → página del aspirante
- `/admin.html` → panel de administración

## Cómo funciona

1. **Entrar.** El aspirante entra con un **código de cohorte**, su cédula y su nombre. Si vuelve con la misma cédula y el mismo código, sigue donde lo dejó.
2. **Test de perfil.** Responde preguntas de selección simple. Cada opción suma puntos a una o varias células.
   - Si la célula con más puntos llega al mínimo y le saca la diferencia configurada a la segunda, queda **asignado** a esa célula.
   - Si no, queda **en revisión** y lo asignas a mano desde el panel.
3. **Ruta de formación.** Ve primero el **tronco común** y después **solo los módulos de su célula**. Los módulos se desbloquean en orden.
4. **Lecciones.** Cada lección tiene un video de YouTube, texto e imágenes. Solo se marca como completada cuando el aspirante ve el 90% del video. Adelantar el video no cuenta: solo suman los segundos que realmente se reproducen.
5. **Examen.** Al final de cada módulo hay un examen de selección simple:
   - las preguntas y las opciones cambian de orden en cada intento;
   - hay una nota mínima y un número limitado de intentos;
   - la corrección se hace en el servidor.
6. **Certificado.** Al aprobar todo, aparece la pantalla de certificado.

## Estructura

```
index.html        Página del aspirante
admin.html        Panel admin
css/styles.css    Estilos (la paleta está arriba de todo)
js/handlers.js    Lógica compartida: test, rutas, exámenes, panel
js/common.js      Utilidades del navegador (API, iconos, avisos)
js/app.js         App del aspirante
js/admin.js       App del panel
js/demo.js        Modo demo (solo se activa con ?demo=1)
api/auth.js       Login aspirante / admin
api/aspirante.js  Acciones del aspirante
api/admin.js      Acciones del panel
lib/store.js      Conexión a MongoDB
lib/auth.js       JWT y respuestas HTTP
```

Usa **3 funciones serverless**. El tope de Vercel Hobby es 12.

## Despliegue (solo con GitHub web y Vercel)

1. **GitHub:** crea un repositorio nuevo, por ejemplo `formacion-cx`. Usa **Add file → Upload files** y arrastra todo el contenido de esta carpeta, respetando las subcarpetas.
2. **Vercel:** ve a **Add New → Project**, importa el repo y despliega sin tocar nada. No necesita build.
3. **Vercel → Settings → Environment Variables.** Agrega estas variables:

| Variable | Valor |
|---|---|
| `MONGODB_URI` | La cadena de conexión de MongoDB Atlas. Puede ser el mismo cluster de AdminCX. |
| `MONGODB_DB` | `elearning_cx`. Es una base de datos separada para no mezclar datos. |
| `JWT_SECRET` | Un texto largo y aleatorio, distinto al de AdminCX. |
| `ADMIN_USER` | Tu usuario del panel. |
| `ADMIN_PASS` | Tu clave del panel. |

4. Vuelve a desplegar: **Deployments → … → Redeploy**.
5. La primera vez que alguien entra se crean solos estos datos de ejemplo, que puedes editar o borrar:
   - las 10 células;
   - 5 preguntas del test;
   - 4 módulos;
   - la cohorte `CX-2026-10`.

## Cambiar los colores por los de AdminCX

Abre `css/styles.css`. Al inicio están las variables de color (`--brand`, `--bg`, `--surface`, etc.):

- el primer bloque es el **modo claro**;
- los dos bloques siguientes son el **modo oscuro**.

Pega ahí los códigos de AdminCX.

## Imágenes con Lightshot

- **Enlace `prnt.sc/...`:** es una página, no una imagen. Se muestra como un botón "Abrir captura".
- **Para que la imagen se vea dentro de la lección:** abre el enlace, haz clic derecho sobre la imagen → *Copiar dirección de la imagen* y pega ese enlace. Empieza con `https://image.prntscr.com/...`.
- **También puedes subir imágenes desde tu equipo.** Se comprimen solas y se guardan en MongoDB. El máximo es unos 4 MB por módulo.

## Modo demo

Abre `index.html?demo=1` o `admin.html?demo=1` para probar todo sin base de datos. Los datos quedan solo en tu navegador.

Si no lo quieres en producción, borra la línea `<script src="js/demo.js">` de los dos HTML.

## Próximas ideas

- Una simulación de ticket real, que revisa Calidad.
- Avisar al supervisor cuando un aspirante termina o se queda sin intentos.
- Un rol "Calidad" con acceso de solo lectura al panel.
