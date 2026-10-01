// POST /api/auth  { accion: 'aspirante' | 'admin' | acciones públicas de Postúlate (test, verificarCedula, postular) }
const H = require('../js/handlers.js');
const store = require('../lib/store');
const { firmar, iguales, responder, manejarError } = require('../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return responder(res, 405, { error: 'Método no permitido' });
  try {
    const body = req.body || {};
    if (body.accion === 'aspirante') {
      const asp = await H.loginAspirante(store, body);
      return responder(res, 200, { token: firmar({ rol: 'aspirante', id: asp._id }, 30), aspirante: H.vistaAspirante(asp) });
    }
    if (body.accion === 'admin') {
      const okUser = iguales(body.usuario || '', process.env.ADMIN_USER || '');
      const okPass = iguales(body.clave || '', process.env.ADMIN_PASS || '');
      if (!process.env.ADMIN_USER || !process.env.ADMIN_PASS || !okUser || !okPass) {
        return responder(res, 401, { error: 'Usuario o clave incorrectos.' });
      }
      return responder(res, 200, { token: firmar({ rol: 'admin', usuario: body.usuario }, 1), usuario: body.usuario });
    }
    const data = await H.ejecutar('publico', body.accion, { store, body });
    responder(res, 200, data);
  } catch (e) { manejarError(res, e); }
};
