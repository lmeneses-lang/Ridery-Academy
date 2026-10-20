# Arquitectura

Cómo está construido Ridery Academy y por qué. Va de lo general a lo detallado: lee hasta donde lo necesites.

## 1. La idea en una frase

Un sitio estático (HTML + JS + CSS) que habla con **3 funciones de servidor** en Vercel, y esas funciones guardan todo en **MongoDB**. No hay paso de compilación: lo que está en el repositorio es lo que se publica.

## 2. Las tres capas

| Capa | Dónde | Corre en | Puede ver secretos |
|---|---|---|---|
| Pantallas | `index.html`, `admin.html`, `js/app.js`, `js/admin.js`, `js/common.js`, `css/` | Navegador | No |
| Reglas del negocio | `js/handlers.js` | Servidor **y** navegador (modo demo) | No |
| Servidor | `api/*.js`, `lib/*.js` | Vercel | Sí (variables de entorno) |

`js/handlers.js` es la pieza central. Tiene todas las acciones (postular, aprobar, calificar un examen…) escritas una sola vez. El servidor las ejecuta contra MongoDB y el modo demo las ejecuta contra el `localStorage` del navegador. Así la demo se comporta igual que producción.

Como `handlers.js` también se descarga en el navegador, **no puede tener secretos**. Las respuestas correctas de los exámenes están en MongoDB, no en el código, y el servidor nunca las envía antes de calificar.

## 3. Puertas de entrada (`api/`)

Todas reciben `POST` con un JSON `{ accion: "...", ...datos }`.

| Puerta | Quién entra | Qué revisa antes de ejecutar |
|---|---|---|
| `/api/auth` | Cualquiera | Solo acepta `login`, `test`, `verificarCedula`, `postular`. Límites por IP y por usuario. |
| `/api/aspirante` | Aspirante con sesión | Token válido con rol `aspirante`. Luego `handlers.js` confirma que siga aprobado y que su clave no haya cambiado. |
| `/api/admin` | Equipo con sesión | Token válido con rol `admin`. Luego `handlers.js` revisa el **perfil** (Admin, Reclutador o Calidad) contra la tabla `PERFILES`. Toda acción que cambia datos se anota en la bitácora. |

¿Por qué solo 3? Vercel Hobby permite 12 funciones. Con una función por "puerta" y el campo `accion` adentro, se pueden agregar acciones sin gastar funciones.

## 4. Perfiles y permisos

Están en `js/handlers.js`, constante `PERFILES`:

- **admin:** todas las acciones (`'*'`).
- **reclutador** y **calidad:** una lista explícita de acciones permitidas.

El menú del panel (`TABS_ROL` en `js/admin.js`) solo esconde botones por comodidad. **La seguridad real es `PERFILES` en el servidor.** Si agregas una acción nueva, por defecto solo Admin puede usarla hasta que la agregues a la lista de otro perfil.

## 5. Datos (MongoDB)

Base: `elearning_cx` (variable `MONGODB_DB`). Colecciones:

| Colección | Qué guarda | `_id` |
|---|---|---|
| `config` | Células, reglas (nota mínima, intentos…), Boost | `general` |
| `preguntas` | Test de perfil | `p-…` |
| `modulos` | Módulos con lecciones y examen (incluye respuestas correctas) | `m-…` |
| `aspirantes` | Postulación, test, acceso (clave cifrada), progreso, exámenes | `asp-<cédula>` |
| `intentos` | Cada envío de examen (para métricas) | `int-…` |
| `mensajes`, `conversaciones` | Chat de Assessment | `msg-…` / id del aspirante |
| `usuarios` | Cuentas del panel (clave cifrada, perfil, activa) | nombre de usuario |
| `cohortes` | Grupos de ingreso | código |
| `limites` | Contadores anti abuso. **Se borran solos.** | `regla:quién` |
| `auditoria` | Bitácora de seguridad. **Se borra sola a los 180 días.** | `aud-…` |

La primera vez que alguien entra, `cargarConfig()` crea las células, 5 preguntas y 4 módulos de ejemplo.

`lib/store.js` solo expone `get`, `find`, `put`, `del` y `sumar`. Mantenerlo así de simple permite que el modo demo imite la base con pocas líneas.

## 6. Sesiones

1. El login devuelve un **token JWT** firmado con `JWT_SECRET`. El navegador lo guarda en `localStorage` y lo manda en el encabezado `Authorization`.
2. El token dura **7 días** (aspirante) o **12 horas** (equipo).
3. Lleva un campo `v` (versión de la clave). Si la clave cambia, el token viejo deja de servir en la siguiente acción.
4. Las cuentas del panel se revalidan en **cada** llamada: si la desactivas o le cambias el perfil, aplica de inmediato.

Detalle completo en [SEGURIDAD.md](SEGURIDAD.md).

## 7. Frontend

- Sin frameworks. Cada pantalla es una función que arma HTML como texto y lo pone con `innerHTML`.
- **Todo dato que viene del usuario pasa por `esc()`** (en `js/common.js`) antes de entrar al HTML. Es lo que evita que alguien meta código en su nombre o en un mensaje.
- No se usan atributos `onclick="..."`: los eventos se conectan con `addEventListener`. Eso permite una política de seguridad (CSP) estricta.
- Orden de carga en ambos HTML: `handlers.js` → `common.js` → `demo.js` → `app.js` o `admin.js`.

## 8. Decisiones y límites conocidos

| Decisión | Por qué | Límite |
|---|---|---|
| Sin build ni framework | Se edita desde GitHub web, sin entorno local | Archivos JS grandes (`admin.js` ~85 KB) |
| Chat por consulta cada 2 s | Funciona en Hobby sin servicios extra | Para tiempo real con muchos usuarios, usar Ably o Pusher |
| Imágenes subidas guardadas en MongoDB | Sin servicio de archivos aparte | ~4 MB por módulo; M0 tiene 512 MB en total |
| El % de video lo reporta el navegador | YouTube no confirma reproducciones al servidor | Alguien con conocimientos técnicos podría marcarlo; el examen sí se corrige en el servidor |
