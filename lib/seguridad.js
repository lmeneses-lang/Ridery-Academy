/* ============================================================
   lib/seguridad.js · Frenos anti abuso y bitácora (solo servidor)
   ------------------------------------------------------------
   1) LÍMITES: cuenta intentos por IP y por usuario en MongoDB
      (colección "limites", se borra sola). Si alguien prueba
      muchas claves o manda postulaciones en masa, se le frena.
   2) BITÁCORA: anota quién hizo qué en el panel (colección
      "auditoria", se borra sola a los 180 días). Se ve en
      Panel → Usuarios → Actividad reciente.
   Para cambiar los topes, edita REGLAS aquí abajo.
   ============================================================ */
const store = require('./store');

const REGLAS = {
  //  clave            máx. intentos   en minutos   mensaje si se pasa
  loginUsuario:    { max: 5,  min: 15, msg: 'Demasiados intentos con este usuario. Espera 15 minutos o pide una clave nueva.' },
  loginIp:         { max: 30, min: 15, msg: 'Demasiados intentos desde esta conexión. Espera 15 minutos.' },
  postular:        { max: 5,  min: 60, msg: 'Ya se enviaron varias postulaciones desde esta conexión. Intenta en una hora.' },
  verificarCedula: { max: 20, min: 15, msg: 'Demasiadas consultas. Espera unos minutos.' },
  test:            { max: 60, min: 15, msg: 'Demasiadas consultas. Espera unos minutos.' },
  ruta:            { max: 300, min: 15, msg: 'Demasiadas consultas. Espera unos minutos.' }
};
const DIAS_BITACORA = 180;

function ipDe(req) {
  const h = req.headers || {};
  const ip = h['x-real-ip'] || String(h['x-forwarded-for'] || '').split(',')[0] || (req.socket && req.socket.remoteAddress) || 'desconocida';
  return String(ip).trim().slice(0, 64);
}

function demasiados(msg) { const e = new Error(msg); e.status = 429; return e; }
const idLimite = (regla, quien) => regla + ':' + String(quien).toLowerCase().slice(0, 80);

// Lanza error 429 si ya se pasó del tope (no suma)
async function revisar(regla, quien) {
  const r = REGLAS[regla];
  const doc = await store.get('limites', idLimite(regla, quien));
  if (doc && doc.expira > new Date() && doc.n >= r.max) throw demasiados(r.msg);
}
// Suma un intento
async function sumar(regla, quien) {
  const r = REGLAS[regla], id = idLimite(regla, quien);
  const doc = await store.get('limites', id);
  if (doc && !(doc.expira > new Date())) await store.del('limites', id);   // ventana vencida: empieza de cero
  return store.sumar('limites', id, r.min);
}
// Revisa y suma en un paso (para acciones públicas)
async function frenar(regla, quien) { await revisar(regla, quien); await sumar(regla, quien); }
// Borra el contador (p. ej. al entrar con éxito)
async function limpiar(regla, quien) { await store.del('limites', idLimite(regla, quien)); }

// Anota un evento en la bitácora. Nunca hace fallar la acción principal.
async function anotar(evento) {
  try {
    const fecha = new Date();
    await store.put('auditoria', Object.assign({
      _id: 'aud-' + fecha.getTime().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
      fecha: fecha.toISOString(),
      expira: new Date(fecha.getTime() + DIAS_BITACORA * 86400000)
    }, evento));
  } catch (e) { console.error('No se pudo escribir la bitácora', e); }
}

module.exports = { REGLAS, ipDe, revisar, sumar, frenar, limpiar, anotar };
