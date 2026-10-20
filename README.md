# Ridery Academy

Plataforma de formación para **aspirantes a agentes de CX** de Ridery. La persona se postula, hace un test que la asigna a una célula, y si la aprueban recibe un usuario para tomar sus módulos (videos, lecciones y exámenes) hasta obtener su certificado.

- **Web:** https://ridery-academy.vercel.app
- **Aspirantes:** `/` · **Panel del equipo:** `/admin.html`
- **Probar sin base de datos:** agrega `?demo=1` a la URL

Es un proyecto aparte de AdminCX, con el mismo stack y los mismos colores.

---

## ¿Por dónde empiezo?

| Si eres… | Lee |
|---|---|
| Nuevo en el proyecto o vas a usar el panel | [docs/GUIA-DE-USO.md](docs/GUIA-DE-USO.md) |
| Vas a cambiar código por primera vez | [docs/COMO-HACER-CAMBIOS.md](docs/COMO-HACER-CAMBIOS.md) |
| Quieres entender cómo está construido | [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) |
| Vas a revisar o tocar algo de seguridad | [docs/SEGURIDAD.md](docs/SEGURIDAD.md) |
| Vas a publicar o configurar Vercel | [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md) |

---

## Mapa del proyecto

```
ridery-academy/
│
├── index.html            Página del aspirante (Postúlate · Inicia sesión · Formación)
├── admin.html            Panel del equipo (Admin, Reclutador, Calidad)
│
├── css/
│   └── styles.css        Todos los estilos. Colores y tipografías arriba de todo.
│
├── js/                   Código que corre en el NAVEGADOR
│   ├── common.js         Herramientas compartidas: llamar a la API, iconos, avisos
│   ├── app.js            Pantallas del aspirante
│   ├── admin.js          Pantallas del panel
│   ├── demo.js           Modo demo (?demo=1): simula el servidor en el navegador
│   └── handlers.js       ⭐ Reglas del negocio. Lo usan el SERVIDOR y el modo demo
│
├── api/                  Funciones del SERVIDOR (Vercel). Una por puerta de entrada
│   ├── auth.js           Pública: login y Postúlate          → POST /api/auth
│   ├── aspirante.js      Con sesión de aspirante             → POST /api/aspirante
│   └── admin.js          Con sesión del equipo               → POST /api/admin
│
├── lib/                  Ayudantes del SERVIDOR (no son funciones de Vercel)
│   ├── auth.js           Sesiones (JWT) y claves cifradas
│   ├── store.js          Conexión a MongoDB + bloqueo de inyección
│   └── seguridad.js      Límites anti fuerza bruta y bitácora
│
├── img/                  Logo, favicon e íconos del celular
├── docs/                 Documentación (no se publica en la web)
│
├── package.json          Librerías del servidor (mongodb, jsonwebtoken)
├── vercel.json           Configuración de Vercel y encabezados de seguridad
└── .vercelignore         Qué NO se publica (docs, README)
```

**Regla de oro:** si un archivo está en `js/` o `css/`, cualquiera puede verlo desde el navegador. Por eso **nunca** va ahí una clave o un secreto. Los secretos viven solo en las variables de Vercel.

---

## Cómo viaja una acción (en 30 segundos)

```
Navegador (js/app.js o js/admin.js)
   │  POST /api/<puerta>  { accion: "aprobar", ... }  + token
   ▼
api/<puerta>.js   →  ¿token válido? ¿rol correcto? ¿no se pasó de intentos?
   ▼
js/handlers.js    →  ¿este perfil puede hacer "aprobar"? → ejecuta la regla
   ▼
lib/store.js      →  MongoDB
```

Para agregar algo nuevo casi siempre tocas **dos** archivos: la acción en `js/handlers.js` y la pantalla en `js/app.js` o `js/admin.js`. El paso a paso está en [COMO-HACER-CAMBIOS.md](docs/COMO-HACER-CAMBIOS.md).

---

## Stack

Vanilla JS (sin frameworks ni build) · Vercel Functions (3 de 12 del plan Hobby) · MongoDB Atlas (cluster M0 propio) · JWT + scrypt.
