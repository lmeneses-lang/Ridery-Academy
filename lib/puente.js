/* ============================================================
   lib/puente.js · Entrada desde AdminCX (solo servidor)
   ------------------------------------------------------------
   AdminCX abre el panel de la Academia (y le pide datos) sin que
   el Admin tenga que iniciar sesión otra vez.

   Cómo: AdminCX firma un "pase" de 60 segundos con PUENTE_SECRET
   (la MISMA variable en los dos proyectos de Vercel). La Academia
   lo cambia una sola vez por una sesión normal del panel
   (POST /api/auth { accion: 'puente', token }).

   - Sin PUENTE_SECRET en Vercel, el puente está apagado.
   - El pase dura 60 s y sirve UNA vez (se anota su id en "limites").
   - Emisor 'admincx', destinatario 'ridery-academy': un token de
     sesión de AdminCX o de la Academia no sirve como pase.
   ============================================================ */
const jwt = require('jsonwebtoken');

const EMISOR = 'admincx';
const DESTINO = 'ridery-academy';
const VIDA_MAX_S = 120;

function activo() { return !!process.env.PUENTE_SECRET && process.env.PUENTE_SECRET.length >= 32; }

// Devuelve { usuario, nombre, jti } o lanza un error 401.
function leerPase(token) {
  const e401 = (m) => { const e = new Error(m); e.status = 401; return e; };
  if (!activo()) throw e401('La entrada desde AdminCX no está activada (falta PUENTE_SECRET).');
  if (typeof token !== 'string' || !token || token.length > 2000) throw e401('Pase no válido.');
  let d;
  try { d = jwt.verify(token, process.env.PUENTE_SECRET, { algorithms: ['HS256'], issuer: EMISOR, audience: DESTINO, maxAge: VIDA_MAX_S + 's' }); }
  catch (e) { throw e401('El pase de AdminCX venció o no es válido. Vuelve a abrir E-learning desde AdminCX.'); }
  const usuario = String(d.sub || '').trim().toLowerCase().slice(0, 120);
  if (!usuario || !d.jti) throw e401('Pase no válido.');
  return { usuario, nombre: String(d.nombre || '').slice(0, 80), jti: String(d.jti).slice(0, 80) };
}

module.exports = { leerPase, activo, EMISOR, DESTINO };
