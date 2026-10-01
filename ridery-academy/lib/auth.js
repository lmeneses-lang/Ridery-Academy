// JWT y utilidades HTTP para las funciones de /api
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const SECRET = () => {
  if (!process.env.JWT_SECRET) throw new Error('Falta la variable JWT_SECRET en Vercel.');
  return process.env.JWT_SECRET;
};

function firmar(payload, dias) { return jwt.sign(payload, SECRET(), { expiresIn: (dias || 7) + 'd' }); }

function leerUsuario(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return null;
  try { return jwt.verify(token, SECRET()); } catch (e) { return null; }
}

function iguales(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function responder(res, status, data) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).end(JSON.stringify(data));
}

function manejarError(res, e) {
  const status = e.status || 500;
  if (status < 500) return responder(res, status, { error: e.message });
  console.error(e);
  const msg = String(e && e.message || '');
  let detalle = 'Error del servidor. Intenta de nuevo en unos minutos.';
  if (/^Falta la variable/.test(msg)) detalle = msg;                                   // variable de entorno sin configurar
  else if (/Mongo|ECONN|ENOTFOUND|querySrv|timed out|Server selection|authentication/i.test(msg + ' ' + (e.name || ''))) {
    detalle = 'No se pudo conectar a la base de datos. Revisa MONGODB_URI y el acceso de red en MongoDB Atlas.';
  }
  responder(res, 500, { error: detalle });
}

// Claves de las cuentas del panel: scrypt con sal aleatoria → "scrypt$sal$hash"
const cripto = {
  hash(clave) {
    return new Promise((res, rej) => {
      const sal = crypto.randomBytes(16).toString('hex');
      crypto.scrypt(clave, sal, 64, (e, k) => e ? rej(e) : res('scrypt$' + sal + '$' + k.toString('hex')));
    });
  },
  verificar(clave, guardado) {
    return new Promise(res => {
      const [tipo, sal, hash] = String(guardado || '').split('$');
      if (tipo !== 'scrypt' || !sal || !hash) return res(false);
      crypto.scrypt(clave, sal, 64, (e, k) => res(!e && k.length === Buffer.from(hash, 'hex').length && crypto.timingSafeEqual(k, Buffer.from(hash, 'hex'))));
    });
  }
};

module.exports = { firmar, leerUsuario, iguales, responder, manejarError, cripto };
