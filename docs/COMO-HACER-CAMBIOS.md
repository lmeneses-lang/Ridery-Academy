# Cómo hacer cambios

Guía práctica para editar el proyecto **solo con GitHub web y Vercel**, sin instalar nada.

## Antes de tocar nada

1. Prueba lo que quieres cambiar en el **modo demo**: `https://ridery-academy.vercel.app/?demo=1` o `/admin.html?demo=1`.
2. Ubica el archivo con la tabla de abajo.
3. Abre el archivo en GitHub, pulsa el lápiz ✏️ y edita.

## ¿Qué archivo toco?

| Quiero cambiar… | Archivo |
|---|---|
| Colores, tipografía, espacios | `css/styles.css` (variables al inicio) |
| Un texto o una pantalla del aspirante | `js/app.js` |
| Un texto o una pantalla del panel | `js/admin.js` |
| Una regla: nota mínima por defecto, cómo se califica, qué ve cada perfil | `js/handlers.js` |
| Las células o preguntas de ejemplo | `js/handlers.js` (arriba de todo). Las reales se editan desde el panel. |
| Los límites de intentos | `lib/seguridad.js` → `REGLAS` |
| Duración de las sesiones | `lib/auth.js` → `DURACION` |
| Encabezados de seguridad o sitios permitidos (CSP) | `vercel.json` |
| Logo o íconos | `img/` (mismos nombres de archivo) |

## Agregar una función nueva (ejemplo)

Supongamos que quieres que el panel pueda "archivar" una cohorte.

**1. La regla, en `js/handlers.js`**, dentro de `const admin = { ... }`:

```js
async archivarCohorte({ store, body }) {
  const c = await store.get('cohortes', body.id);
  if (!c) throw err(404, 'Cohorte no encontrada.');
  c.activa = false;
  await store.put('cohortes', c);
  return { ok: true };
},
```

- `throw err(código, 'mensaje')` muestra el mensaje en pantalla. Usa 400 (dato mal), 403 (sin permiso), 404 (no existe).
- No hace falta tocar `api/`: la puerta `/api/admin` ya despacha cualquier acción de `admin`.

**2. El permiso.** Ya funciona para Admin. Si el Reclutador también debe poder usarla, agrega `'archivarCohorte'` a su lista en `PERFILES`.

**3. El botón, en `js/admin.js`:**

```js
await call('archivarCohorte', { id: cohorte._id });
```

**4. Prueba** en `admin.html?demo=1`. El modo demo usa el mismo `handlers.js`, así que si funciona ahí, la lógica es correcta.

## Convenciones

- **Idioma:** todo en español (nombres de funciones, mensajes y comentarios). Así lo lee cualquiera del equipo.
- **Mensajes de error:** frases completas que digan qué hacer: «Escribe tu cédula», no «cédula inválida».
- **Mostrar datos:** siempre `esc(valor)`. Sin excepciones. Ver [SEGURIDAD.md](SEGURIDAD.md).
- **Un archivo, una responsabilidad:** no metas lógica de negocio en `app.js`/`admin.js`. Si decide algo, va en `handlers.js`.
- **No agregues funciones a `api/`** salvo que sea otra "puerta" con un tipo de acceso distinto. Quedan 9 libres en Hobby.
- **Nombres de archivo:** sin espacios ni `(1)`. Si GitHub te crea `archivo (1).js` al subir, bórralo.

## Subir archivos sin romper nada

- Al usar **Add file → Upload files**, arrastra la carpeta respetando las subcarpetas (`js/`, `css/`…). Si sueltas `admin.js` en la raíz, no reemplaza a `js/admin.js`: crea un archivo nuevo que nadie usa.
- Escribe un mensaje de commit que diga qué cambió: «Panel: botón para archivar cohortes», no «Add files via upload».
- Después del commit, Vercel publica solo en ~1 minuto. Revisa en **Vercel → Deployments** que quede en verde.

## Si algo se rompe

1. **Vercel → Deployments**, elige el último despliegue que funcionaba → **…** → **Promote to Production**. Vuelves atrás en segundos.
2. Para ver el error: **Vercel → Logs** (errores del servidor) o la consola del navegador con F12 (errores de pantalla).
3. Una pantalla en blanco suele ser un error de sintaxis en un `.js`: una coma o un paréntesis de más o de menos cerca de lo que editaste.
