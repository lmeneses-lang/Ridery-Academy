/* ============================================================
   lib/auth.js · Sesiones (JWT), claves y respuestas HTTP (solo servidor)
   ------------------------------------------------------------
   - firmar / leerUsuario: crean y validan el "pase" (token JWT)
     que el navegador manda en cada llamada.
   - cripto: guarda las claves cifradas con scrypt (nunca en texto).
   - responder / manejarError: respuestas JSON uniformes y sin
     filtrar detalles internos al navegador.
   ============================================================ */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const EMISOR = 'ridery-academy';          // evita que sirva un token de otra app (p. ej. AdminCX)
const DURACION = { aspirante: '7d', admin: '12h' };

let avisado = false;
const SECRET = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('Falta la variable JWT_SECRET en Vercel.');
  if (s.length < 32 && !avisado) { avisado = true; console.warn('[seguridad] JWT_SECRET es corto: usa al menos 32 caracteres aleatorios.'); }
  return s;
};

// Crea el token. "payload" lleva rol, id/usuario y "v" (versión de la clave: si cambia la clave, el token muere).
function firmar(payload) {
  const { iat, exp, iss, ...datos } = payload;     // por si se re-firma un token existente
  return jwt.sign(datos, SECRET(), { algorithm: 'HS256', issuer: EMISOR, expiresIn: DURACION[datos.rol] || '12h' });
}

// Lee y valida el token del encabezado Authorization. Devuelve null si falta, expiró o fue alterado.
function leerUsuario(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token || token.length > 4000) return null;
  try { return jwt.verify(token, SECRET(), { algorithms: ['HS256'], issuer: EMISOR }); } catch (e) { return null; }
}

// Comparación en tiempo constante (no revela por tiempo cuántos caracteres coinciden)
function iguales(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

// Versión de la cuenta principal: cambia si cambias ADMIN_USER o ADMIN_PASS en Vercel → se cierran sus sesiones abiertas
function versionPrincipal() {
  return crypto.createHash('sha256').update((process.env.ADMIN_USER || '') + '\n' + (process.env.ADMIN_PASS || '') + '\n' + SECRET()).digest('hex').slice(0, 16);
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

// Claves: scrypt con sal aleatoria → "scrypt$sal$hash"
const cripto = {
  hash(clave) {
    return new Promise((res, rej) => {
      const sal = crypto.randomBytes(16).toString('hex');
      crypto.scrypt(String(clave), sal, 64, (e, k) => e ? rej(e) : res('scrypt$' + sal + '$' + k.toString('hex')));
    });
  },
  verificar(clave, guardado) {
    return new Promise(res => {
      const [tipo, sal, hash] = String(guardado || '').split('$');
      if (tipo !== 'scrypt' || !sal || !hash) return res(false);
      crypto.scrypt(String(clave), sal, 64, (e, k) => res(!e && k.length === Buffer.from(hash, 'hex').length && crypto.timingSafeEqual(k, Buffer.from(hash, 'hex'))));
    });
  }
};

module.exports = { firmar, leerUsuario, iguales, versionPrincipal, responder, manejarError, cripto };
