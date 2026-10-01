# Formación CX · Ridery

Una plataforma de e-learning para aspirantes a agentes de CX. Funciona aparte de AdminCX, con el mismo stack: Vanilla JS, funciones de Vercel, MongoDB y JWT.

- `/` → página del aspirante
- `/admin.html` → panel de administración

## Cómo funciona

La página abre con dos opciones.

**Postúlate** (público, sin código). Sirve como filtro:

1. La persona deja sus datos: nombre, cédula, ciudad, correo y teléfono.
2. Responde el test de perfil de selección simple. Cada opción suma puntos a una o varias células.
3. Al enviar, ve en qué célula encaja y termina ahí. Si hay empate o nadie llega al mínimo, se le dice que su perfil será revisado.
4. La postulación queda en el panel, en **Postulaciones → Por revisar**.

**En el panel** abres la postulación, revisas los puntajes y la apruebas eligiendo **célula** y **cohorte**, o la descartas. El código de la cohorte es su **código de acceso**. El botón "Copiar mensaje con su acceso" te arma el texto para enviárselo por WhatsApp.

**Soy aspirante** (solo personas aprobadas). Entran con su cédula y su código de acceso, y ven:

1. El **tronco común** y después **solo los módulos de su célula**. Los módulos se desbloquean en orden.
2. **Lecciones** con video de YouTube, texto e imágenes. Hay que ver el 90% del video y adelantarlo no cuenta.
3. Un **examen** de selección simple al final de cada módulo:
   - las preguntas y opciones cambian de orden en cada intento;
   - hay una nota mínima y un número limitado de intentos;
   - la corrección se hace en el servidor.
4. Un **certificado** al aprobar todo.

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
6. Las postulaciones se ven en `/admin.html` → **Postulaciones**.

## Marca

Sigue el manual de Ridery:

- **Colores principales:** verde `#38CEA6` y azul marino `#0F111E`.
- **Detalles:** fucsia `#D71D5C` y azul rey `#272883`.
- **Tipografía:** Urbanist en textos y Bebas Neue en cifras.

Todo está en variables al inicio de `css/styles.css`.

## Usuarios del panel

- **Cuenta principal:** es la de `ADMIN_USER` y `ADMIN_PASS` en Vercel. Siempre es Admin y sirve de respaldo si alguien pierde el acceso.
- **Más cuentas:** en **Panel → Usuarios → Nuevo usuario** creas una cuenta para cada persona, con su propio usuario, clave y rol:

| Rol | Puede |
|---|---|
| Admin | Todo: contenido, test, ajustes y usuarios |
| Reclutador | Postulaciones (aprobar, descartar, agregar aspirantes), cohortes y métricas |
| Calidad | Ver postulaciones, aspirantes y métricas, sin editar |

Las claves se guardan cifradas (scrypt) y no se pueden volver a ver: si alguien la olvida, le pones una nueva. Si desactivas o eliminas una cuenta, esa persona pierde el acceso en su siguiente acción.

## Agregar aspirantes a mano

En **Postulaciones → Agregar aspirante** registras a alguien sin que haga el test (referidos o reingresos). Queda aprobado con la célula y cohorte que elijas, y entra por "Soy aspirante" con su cédula y el código de la cohorte.

## Imágenes con Lightshot

- **Enlace `prnt.sc/...`:** es una página, no una imagen. Se muestra como un botón "Abrir captura".
- **Para que la imagen se vea dentro de la lección:** abre el enlace, haz clic derecho sobre la imagen → *Copiar dirección de la imagen* y pega ese enlace. Empieza con `https://image.prntscr.com/...`.
- **También puedes subir imágenes desde tu equipo.** Se comprimen solas y se guardan en MongoDB. El máximo es unos 4 MB por módulo.

## Modo demo

Abre `index.html?demo=1` o `admin.html?demo=1` para probar todo sin base de datos. Los datos quedan solo en tu navegador.

En la demo existe un aspirante ya aprobado (cédula `12345678`, código `CX-2026-10`) para ver la formación directamente.

Si no lo quieres en producción, borra la línea `<script src="js/demo.js">` de los dos HTML.

## Próximas ideas

- Una simulación de ticket real, que revisa Calidad.
- Avisar al supervisor cuando un aspirante termina o se queda sin intentos.
- Un rol "Calidad" con acceso de solo lectura al panel.
