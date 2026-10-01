// POST /api/aspirante  { accion, ... }  · requiere token con rol "aspirante"
const H = require('../js/handlers.js');
const store = require('../lib/store');
const { leerUsuario, responder, manejarError } = require('../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return responder(res, 405, { error: 'Método no permitido' });
  const user = leerUsuario(req);
  if (!user || user.rol !== 'aspirante') return responder(res, 401, { error: 'Tu sesión expiró. Vuelve a entrar.' });
  try {
    const body = req.body || {};
    const data = await H.ejecutar('aspirante', body.accion, { store, user, body });
    responder(res, 200, data);
  } catch (e) { manejarError(res, e); }
};
