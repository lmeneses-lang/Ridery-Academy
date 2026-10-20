/* ============================================================
   api/aspirante.js · Formación  →  POST /api/aspirante  { accion, ... }
   ------------------------------------------------------------
   Pide token de aspirante. Cada acción vuelve a revisar en la
   base de datos que el aspirante siga aprobado y que su clave
   no haya cambiado (ver requerirAspirante en js/handlers.js).
   ============================================================ */
const H = require('../js/handlers.js');
const store = require('../lib/store');
const { leerUsuario, responder, manejarError } = require('../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return responder(res, 405, { error: 'Método no permitido' });
  const user = leerUsuario(req);
  if (!user || user.rol !== 'aspirante') return responder(res, 401, { error: 'Tu sesión expiró. Vuelve a entrar.' });
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const data = await H.ejecutar('aspirante', body.accion, { store, user, body });
    responder(res, 200, data);
  } catch (e) { manejarError(res, e); }
};
