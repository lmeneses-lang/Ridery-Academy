# Despliegue

Ridery Academy se publica en Vercel directo desde la rama `main` de GitHub. No hay paso de compilación.

## Variables de entorno

En **Vercel → Settings → Environment Variables**:

| Variable | Valor |
|---|---|
| `MONGODB_URI` | Cadena de conexión del cluster M0 propio de Ridery Academy en MongoDB Atlas |
| `MONGODB_DB` | `elearning_cx` |
| `JWT_SECRET` | Texto aleatorio de 32 caracteres o más, distinto al de AdminCX |
| `ADMIN_USER` | Usuario de la cuenta principal del panel |
| `ADMIN_PASS` | Clave de la cuenta principal (12 caracteres o más) |

Cada vez que cambies una variable: **Deployments → … → Redeploy**.

Para generar un `JWT_SECRET` sin instalar nada, abre la consola del navegador (F12) y pega:

```js
[...crypto.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2, '0')).join('')
```

## Montar el proyecto desde cero

1. **GitHub:** crea el repositorio y sube todo el contenido con **Add file → Upload files**, respetando las carpetas.
2. **Vercel:** **Add New → Project**, importa el repo y despliega sin cambiar nada.
3. Agrega las variables de arriba y vuelve a desplegar.
4. Entra a `/admin.html` con `ADMIN_USER` / `ADMIN_PASS`. La primera visita crea las células, preguntas y módulos de ejemplo.
5. En **Usuarios**, crea una cuenta para cada persona del equipo.

## Qué se publica

Vercel publica todos los archivos del repositorio **excepto** lo que lista `.vercelignore` (`docs/`, `README.md`). Las carpetas `api/` y `lib/` se convierten en funciones del servidor.

## MongoDB Atlas

- **Network Access:** Vercel no tiene IP fija, así que se usa `0.0.0.0/0`. Por eso la clave del usuario de base de datos debe ser larga y aleatoria.
- **Database Access:** el usuario de la cadena de conexión debe tener permiso solo de lectura y escritura sobre `elearning_cx`.
- Las colecciones `limites` y `auditoria` se limpian solas (índices TTL). No hace falta mantenimiento.
