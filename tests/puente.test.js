// Entrada desde AdminCX (lib/puente.js) y evaluación de la capacitación.
// Corre las funciones reales de api/ con una base en memoria.  →  npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const jwt = require('jsonwebtoken');

// ── Base en memoria en lugar de MongoDB ──
const datos = {};
const col = (c) => (datos[c] = datos[c] || new Map());
const copia = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
const memoria = {
  async get(c, id) { return copia(col(c).get(String(id))) || null; },
  async find(c, f) { return [...col(c).values()].filter((d) => Object.entries(f || {}).every(([k, v]) => d[k] === v)).map(copia); },
  async put(c, d) { col(c).set(String(d._id), copia(d)); return d; },
  async del(c, id) { col(c).delete(String(id)); },
  async sumar(c, id) { const d = col(c).get(id) || { _id: id, n: 0, expira: new Date(Date.now() + 600000) }; d.n++; col(c).set(id, d); return copia(d); },
};
require.cache[require.resolve('../lib/store')] = { id: 'store', filename: 'store', loaded: true, exports: memoria };

process.env.JWT_SECRET = 'x'.repeat(40);
const SECRETO = 'p'.repeat(64);
const auth = require('../api/auth.js');
const admin = require('../api/admin.js');

function llamar(fn, body, token) {
  return new Promise((ok) => {
    const res = { h: {}, setHeader(k, v) { this.h[k] = v; }, status(c) { this.c = c; return this; }, end(s) { ok({ status: this.c, body: JSON.parse(s) }); } };
    fn({ method: 'POST', body, headers: Object.assign({ 'x-real-ip': '1.2.3.4' }, token ? { authorization: 'Bearer ' + token } : {}) }, res);
  });
}
const pase = (extra, secreto) => jwt.sign({ nombre: 'Luis' }, secreto || SECRETO, Object.assign({ algorithm: 'HS256', issuer: 'admincx', audience: 'ridery-academy', subject: 'luis@ridery.app', expiresIn: 60, jwtid: Math.random().toString(36) }, extra || {}));

test('sin PUENTE_SECRET el puente está apagado', async () => {
  delete process.env.PUENTE_SECRET;
  const r = await llamar(auth, { accion: 'puente', token: pase() });
  assert.equal(r.status, 401);
  assert.match(r.body.error, /PUENTE_SECRET/);
});

test('pase válido → sesión de Admin; el mismo pase no sirve dos veces', async () => {
  process.env.PUENTE_SECRET = SECRETO;
  const p = pase();
  const r = await llamar(auth, { accion: 'puente', token: p });
  assert.equal(r.status, 200);
  assert.equal(r.body.usuario, 'admincx:luis@ridery.app');
  const otra = await llamar(auth, { accion: 'puente', token: p });
  assert.equal(otra.status, 401);
  const res = await llamar(admin, { accion: 'resumen' }, r.body.token);
  assert.equal(res.status, 200);
  assert.equal(res.body.yo.perfil, 'admin');
  assert.equal(res.body.yo.usuario, 'admincx:luis@ridery.app');
  const bit = [...col('auditoria').values()].find((e) => e.tipo === 'login' && e.detalle === 'Desde AdminCX');
  assert.ok(bit);
});

test('pases falsos: otra clave, vencido, otro destinatario, token de sesión', async () => {
  process.env.PUENTE_SECRET = SECRETO;
  for (const t of [pase({}, 'z'.repeat(64)), pase({ expiresIn: -5 }), pase({ audience: 'otra-app' }), pase({ issuer: 'ridery-academy' })]) {
    const r = await llamar(auth, { accion: 'puente', token: t });
    assert.equal(r.status, 401);
  }
});

test('evaluación de la capacitación: valida, reemplaza el mismo día y se puede borrar', async () => {
  process.env.PUENTE_SECRET = SECRETO;
  const tk = (await llamar(auth, { accion: 'puente', token: pase() })).body.token;
  await memoria.put('aspirantes', { _id: 'asp-1', cedula: '1', nombre: 'Ana Rivas', estado: 'aprobado', progreso: {}, examenes: {}, creado: '2026-11-01T00:00:00Z' });
  const P = (await llamar(admin, { accion: 'capacitacionPreguntas' }, tk)).body;
  assert.equal(P.preguntas.length, 7);
  assert.equal(P.deFabrica, true);

  const falta = await llamar(admin, { accion: 'evaluarCapacitacion', id: 'asp-1', respuestas: { atencion: 0 } }, tk);
  assert.equal(falta.status, 400);
  assert.match(falta.body.error, /Falta responder/);

  const todas = { atencion: 1, participacion: 0, comprension: 0, dificultad: [0, 2], puntualidad: 0, camara: 0, recomendacion: 1 };
  let r = await llamar(admin, { accion: 'evaluarCapacitacion', id: 'asp-1', dia: '2026-11-10', respuestas: todas }, tk);
  assert.equal(r.status, 200);
  assert.equal(r.body.evaluacion.respuestas.atencion.texto, 'Más o menos');
  assert.deepEqual(r.body.evaluacion.respuestas.dificultad.opciones, [2]);    // "Nada" se quita si marca otra
  r = await llamar(admin, { accion: 'evaluarCapacitacion', id: 'asp-1', dia: '2026-11-10', respuestas: Object.assign({}, todas, { atencion: 0 }) }, tk);
  assert.equal(r.body.capacitacion.length, 1);                                 // mismo día y evaluador: reemplaza
  r = await llamar(admin, { accion: 'evaluarCapacitacion', id: 'asp-1', dia: '2026-11-11', respuestas: todas }, tk);
  assert.equal(r.body.capacitacion.length, 2);

  const lista = (await llamar(admin, { accion: 'aspirantes' }, tk)).body.aspirantes;
  assert.equal(lista[0].evaluaciones, 2);
  assert.equal(lista[0].ultimaEvaluacion.dia, '2026-11-11');

  const b = await llamar(admin, { accion: 'eliminarEvaluacion', id: 'asp-1', evaluacion: r.body.evaluacion.id }, tk);
  assert.equal(b.body.capacitacion.length, 1);
});

test('preguntas propias: se validan y se puede volver a las de fábrica', async () => {
  process.env.PUENTE_SECRET = SECRETO;
  const tk = (await llamar(auth, { accion: 'puente', token: pase() })).body.token;
  const mal = await llamar(admin, { accion: 'guardarCapacitacionPreguntas', preguntas: [{ texto: '¿Atendió?', opciones: ['Sí'] }] }, tk);
  assert.equal(mal.status, 400);
  const ok = await llamar(admin, { accion: 'guardarCapacitacionPreguntas', preguntas: [{ texto: '¿Atendió?', opciones: ['Sí', 'No'] }] }, tk);
  assert.equal(ok.status, 200);
  assert.equal((await llamar(admin, { accion: 'capacitacionPreguntas' }, tk)).body.preguntas.length, 1);
  await llamar(admin, { accion: 'guardarCapacitacionPreguntas', deFabrica: true }, tk);
  assert.equal((await llamar(admin, { accion: 'capacitacionPreguntas' }, tk)).body.preguntas.length, 7);
});

test('si se borra PUENTE_SECRET, las sesiones abiertas desde AdminCX se cortan', async () => {
  process.env.PUENTE_SECRET = SECRETO;
  const tk = (await llamar(auth, { accion: 'puente', token: pase() })).body.token;
  delete process.env.PUENTE_SECRET;
  const r = await llamar(admin, { accion: 'resumen' }, tk);
  assert.equal(r.status, 401);
});
