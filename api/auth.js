/* ============================================================
   api/auth.js · Puerta pública  →  POST /api/auth  { accion, ... }
   ------------------------------------------------------------
   No pide token. Atiende:
   - login: "Inicia sesión" único (equipo del panel o aspirante)
   - test, ruta, verificarCedula, postular: el flujo "Postúlate"
   Todo pasa por los frenos de lib/seguridad.js.
   ============================================================ */
const H = require('../js/handlers.js');
const store = require('../lib/store');
const { firmar, iguales, versionPrincipal, responder, manejarError, cripto } = require('../lib/auth');
const seg = require('../lib/seguridad');

const PUBLICAS = ['test', 'ruta', 'verificarCedula', 'postular'];

module.exports = async (req, res) => {
  if (req.method !== 'POST') return responder(res, 405, { error: 'Método no permitido' });
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const ip = seg.ipDe(req);

    if (body.accion === 'login') return await login(req, res, body, ip);

    if (!PUBLICAS.includes(body.accion)) return responder(res, 400, { error: 'Acción desconocida.' });
    await seg.frenar(body.accion, ip);
    const data = await H.ejecutar('publico', body.accion, { store, body });
    responder(res, 200, data);
  } catch (e) { manejarError(res, e); }
};

async function login(req, res, body, ip) {
  const usuario = String(body.usuario || '').trim().toLowerCase().slice(0, 40);
  await seg.revisar('loginIp', ip);
  if (usuario) await seg.revisar('loginUsuario', usuario);

  const esPrincipal = (u, c) => !!(process.env.ADMIN_USER && process.env.ADMIN_PASS && iguales(u, process.env.ADMIN_USER) && iguales(c, process.env.ADMIN_PASS));
  let r;
  try {
    r = await H.iniciarSesion(store, body, cripto, esPrincipal);
  } catch (e) {
    if (e.status === 401) {                               // clave o usuario equivocados: cuenta el intento
      await seg.sumar('loginIp', ip);
      const c = usuario ? await seg.sumar('loginUsuario', usuario) : null;
      await seg.anotar({ tipo: 'login-fallido', usuario, ip });
      if (c && c.n === seg.REGLAS.loginUsuario.max) await seg.anotar({ tipo: 'bloqueo', usuario, ip, detalle: 'Usuario bloqueado ' + seg.REGLAS.loginUsuario.min + ' min por claves erradas' });
    }
    throw e;
  }
  if (usuario) await seg.limpiar('loginUsuario', usuario);

  if (r.tipo === 'admin') {
    const sesion = r.sesion.cuenta ? r.sesion : Object.assign({}, r.sesion, { v: versionPrincipal() });
    await seg.anotar({ tipo: 'login', usuario: sesion.usuario, perfil: sesion.perfil || 'admin', ip });
    return responder(res, 200, { tipo: 'admin', token: firmar(sesion), usuario: sesion.usuario });
  }
  return responder(res, 200, { tipo: 'aspirante', token: firmar(r.sesion), aspirante: H.vistaAspirante(r.aspirante) });
}
