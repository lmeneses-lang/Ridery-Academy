/* ============================================================
   api/admin.js · Panel  →  POST /api/admin  { accion, ... }
   ------------------------------------------------------------
   Pide token de equipo (rol "admin" en el token). Qué puede hacer
   cada perfil (Admin / Reclutador / Calidad) lo decide PERFILES
   en js/handlers.js, y se revisa en CADA llamada.
   Toda acción que cambia datos queda anotada en la bitácora.
   ============================================================ */
const H = require('../js/handlers.js');
const store = require('../lib/store');
const { leerUsuario, versionPrincipal, firmar, responder, manejarError, cripto } = require('../lib/auth');
const seg = require('../lib/seguridad');

// Acciones que solo leen: no se anotan en la bitácora
const SOLO_LECTURA = new Set(['resumen', 'aspirantes', 'aspirante', 'preguntas', 'modulos', 'metricas', 'usuarios', 'boostConfig', 'chats', 'chatHilo', 'chatResponder', 'auditoria']);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return responder(res, 405, { error: 'Método no permitido' });
  const user = leerUsuario(req);
  if (!user || user.rol !== 'admin') return responder(res, 401, { error: 'Tu sesión expiró. Vuelve a entrar.' });
  // Cuenta principal: si cambiaste ADMIN_USER / ADMIN_PASS en Vercel, las sesiones viejas dejan de servir
  if (!user.cuenta && user.v !== versionPrincipal()) return responder(res, 401, { error: 'Tu sesión expiró. Vuelve a entrar.' });
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const ctx = { store, user, body, cripto };
    const data = await H.ejecutar('admin', body.accion, ctx);

    if (body.accion === 'cambiarMiClave' && data && data.v) {     // clave nueva → token nuevo (los demás dispositivos se cierran)
      data.token = firmar(Object.assign({}, user, { v: data.v }));
      delete data.v;
    }
    if (!SOLO_LECTURA.has(body.accion)) {
      await seg.anotar({ tipo: 'accion', accion: body.accion, usuario: ctx.user.usuario, perfil: ctx.user.perfil, objetivo: objetivo(body), ip: seg.ipDe(req) });
    }
    responder(res, 200, data);
  } catch (e) { manejarError(res, e); }
};

// Sobre qué se hizo la acción (para la bitácora)
function objetivo(b) {
  const o = b.id || (b.usuario && b.usuario.usuario) || (b.modulo && (b.modulo.titulo || b.modulo._id)) ||
    (b.pregunta && (b.pregunta.texto || b.pregunta._id)) || (b.aspirante && (b.aspirante.nombre || b.aspirante.cedula)) ||
    (b.cohorte && b.cohorte._id) || b.moduloId || '';
  return String(o).slice(0, 120);
}
