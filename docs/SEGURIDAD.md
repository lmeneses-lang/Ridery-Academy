# Seguridad

Qué protege a Ridery Academy, dónde está en el código y qué revisar cuando cambias algo.

## Resumen

| Riesgo | Protección | Dónde |
|---|---|---|
| Ver o cambiar datos sin permiso | Token JWT en cada llamada + perfiles revisados en el servidor | `api/*.js`, `PERFILES` en `js/handlers.js` |
| Adivinar claves (fuerza bruta) | 5 intentos fallidos por usuario y 30 por IP cada 15 min | `lib/seguridad.js` |
| Llenar la base con postulaciones falsas | 5 postulaciones por IP por hora | `lib/seguridad.js` |
| Robo de claves de la base | Claves cifradas con scrypt y sal aleatoria; nunca se pueden volver a ver | `lib/auth.js` |
| Sesión robada o vieja | Tokens cortos (7 d / 12 h) que mueren si cambia la clave | `lib/auth.js`, `js/handlers.js` |
| Token de otra app (p. ej. AdminCX) | El token lleva emisor `ridery-academy` y algoritmo fijo HS256 | `lib/auth.js` |
| Inyección NoSQL (`{"$ne": null}`) | Todo id y filtro debe ser texto o número | `lib/store.js` |
| Código malicioso en nombres o mensajes (XSS) | `esc()` en todo dato + CSP que bloquea scripts externos o en línea | `js/common.js`, `vercel.json` |
| Meter la página en un iframe (clickjacking) | `X-Frame-Options: DENY` y `frame-ancestors 'none'` | `vercel.json` |
| Trampa en exámenes | Corrección en el servidor; las respuestas correctas nunca viajan antes de calificar | `enviarExamen` en `js/handlers.js` |
| No saber quién hizo qué | Bitácora de accesos, claves erradas, bloqueos y cambios | `lib/seguridad.js` → Panel → Usuarios |

## Comparado con AdminCX

Ridery Academy parte de la misma base que AdminCX (roles validados en el servidor con JWT) y le suma:

- claves cifradas con scrypt;
- revalidar la cuenta en cada llamada;
- cerrar sesiones al cambiar la clave;
- freno a la fuerza bruta y al spam en formularios públicos;
- bloqueo de inyección NoSQL;
- encabezados de seguridad (CSP, HSTS, anti iframe);
- bitácora de actividad.

Varias de estas piezas (`lib/seguridad.js`, la validación de `lib/store.js`, los encabezados de `vercel.json`) se pueden copiar a AdminCX casi sin cambios.

## Sesiones, paso a paso

1. **Login** (`api/auth.js`): revisa los límites, valida la clave y firma un token con `{ rol, id o usuario, perfil, v }`.
2. **Cada llamada** (`api/aspirante.js` o `api/admin.js`): verifica firma, emisor, algoritmo y vencimiento.
3. **Luego** (`js/handlers.js`):
   - Aspirante: debe seguir `aprobado` y su `claveFecha` debe coincidir con `v`.
   - Cuenta del panel: debe existir, estar activa y su `claveFecha` debe coincidir con `v`. El perfil se lee de la base, no del token.
   - Cuenta principal (`ADMIN_USER`/`ADMIN_PASS`): `v` es una huella de esas variables. Si las cambias en Vercel, todas sus sesiones se cierran.

**Para sacar a alguien ya:**

- Del panel: desactívalo en **Usuarios**.
- A un aspirante: pásalo a **Descartado** o ponle una contraseña nueva.
- A todo el mundo: cambia `JWT_SECRET` en Vercel y vuelve a desplegar.

## Límites anti abuso

Se ajustan en `REGLAS` de `lib/seguridad.js`:

| Regla | Tope | Ventana |
|---|---|---|
| `loginUsuario` (claves erradas por usuario) | 5 | 15 min |
| `loginIp` (claves erradas por conexión) | 30 | 15 min |
| `postular` | 5 | 60 min |
| `verificarCedula` | 20 | 15 min |
| `test` | 60 | 15 min |

Un login correcto borra el contador de ese usuario. Al llegar al tope, se anota un **bloqueo** en la bitácora.

Si alguien queda bloqueado y necesita entrar ya, ponle una clave nueva y espera los 15 minutos, o borra su documento en la colección `limites` de MongoDB Atlas.

## Variables de Vercel

| Variable | Recomendación |
|---|---|
| `JWT_SECRET` | 32 caracteres aleatorios o más. **Distinta** a la de AdminCX. Si es corta, aparece un aviso en los logs de Vercel. |
| `ADMIN_PASS` | 12 caracteres o más. Úsala solo de respaldo; para el día a día, crea cuentas en **Usuarios**. |
| `MONGODB_URI` | Usuario de Atlas con permiso solo sobre la base `elearning_cx`. |

Nunca pongas estos valores en el código, en un issue ni en capturas de pantalla.

## Checklist antes de publicar un cambio

- [ ] ¿Muestras un dato del usuario en pantalla? Pásalo por `esc()`.
- [ ] ¿Creaste una acción nueva en `handlers.js`? Decide qué perfiles la pueden usar en `PERFILES`. Por defecto solo Admin.
- [ ] ¿La acción solo lee datos? Agrégala a `SOLO_LECTURA` en `api/admin.js` para que no llene la bitácora.
- [ ] ¿La acción es pública (`api/auth.js`)? Agrégala a `PUBLICAS` y dale una regla en `REGLAS`.
- [ ] ¿Devuelves un aspirante o un usuario? No incluyas `hash`.
- [ ] ¿Cargas algo de un sitio nuevo (script, iframe, fuente)? Agrégalo a la CSP en `vercel.json` o el navegador lo bloqueará.
- [ ] ¿Usaste `onclick="..."` en un HTML? Cámbialo por `addEventListener`; la CSP lo bloquea.

## Qué falta (siguientes pasos posibles)

- **Token en cookie `HttpOnly`** en lugar de `localStorage`. Con la CSP actual el riesgo es bajo, pero la cookie lo elimina del todo.
- **Doble factor** para cuentas Admin.
- **Desactivar el modo demo en producción** (quitar `<script src="js/demo.js">` de los HTML). Hoy es inofensivo: solo usa datos del navegador.
