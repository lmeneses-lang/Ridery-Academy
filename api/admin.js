// POST /api/admin  { accion, ... }  · requiere token con rol "admin"
const H = require('../js/handlers.js');
const store = require('../lib/store');
const { leerUsuario, responder, manejarError } = require('../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return responder(res, 405, { error: 'Método no permitido' });
  const user = leerUsuario(req);
  if (!user || user.rol !== 'admin') return responder(res, 401, { error: 'Tu sesión expiró. Vuelve a entrar.' });
  try {
    const body = req.body || {};
    const data = await H.ejecutar('admin', body.accion, { store, user, body });
    responder(res, 200, data);
  } catch (e) { manejarError(res, e); }
};
