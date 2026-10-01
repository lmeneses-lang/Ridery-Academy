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
  if (status >= 500) console.error(e);
  responder(res, status, { error: status >= 500 ? 'Error del servidor. Intenta de nuevo en unos minutos.' : e.message });
}

module.exports = { firmar, leerUsuario, iguales, responder, manejarError };
