/* ============================================================
   lib/store.js · Conexión a MongoDB (solo servidor)
   ------------------------------------------------------------
   Qué hace: abre UNA conexión a MongoDB y la reutiliza entre
   llamadas. Expone 4 operaciones simples (get, find, put, del)
   que usa la lógica de js/handlers.js, más "sumar" para los
   contadores de seguridad (lib/seguridad.js).

   Seguridad: todo id y todo filtro se valida aquí. Si alguien
   manda un objeto como { "$ne": null } en lugar de un texto,
   se rechaza (eso se llama "inyección NoSQL").
   ============================================================ */
const { MongoClient } = require('mongodb');

let clientPromise = null;
let indices = null;

function db() {
  if (!process.env.MONGODB_URI) throw new Error('Falta la variable MONGODB_URI en Vercel.');
  if (!clientPromise) {
    clientPromise = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 }).connect()
      .catch(e => { clientPromise = null; throw e; }); // si falla, el siguiente intento vuelve a conectar
  }
  return clientPromise.then(c => {
    const d = c.db(process.env.MONGODB_DB || 'elearning_cx');
    if (!indices) {   // una vez por arranque
      indices = Promise.all([
        d.collection('mensajes').createIndex({ aspirante: 1, fecha: 1 }),          // chat
        d.collection('aspirantes').createIndex({ usuario: 1 }),                    // login
        d.collection('limites').createIndex({ expira: 1 }, { expireAfterSeconds: 0 }),            // contadores anti fuerza bruta: se borran solos
        d.collection('auditoria').createIndex({ expira: 1 }, { expireAfterSeconds: 0 })           // bitácora: se borra sola a los 180 días
      ]).catch(e => { console.error('No se pudieron crear índices', e); });
    }
    return d;
  });
}

/* ---------- Validación contra inyección NoSQL ---------- */
function malo(msg) { const e = new Error(msg); e.status = 400; return e; }

function idSeguro(id) {
  if (typeof id === 'number') return String(id);
  if (typeof id !== 'string' || !id || id.length > 200) throw malo('Identificador no válido.');
  return id;
}
function filtroSeguro(filtro) {
  const f = filtro || {};
  for (const [k, v] of Object.entries(f)) {
    if (k.startsWith('$')) throw malo('Filtro no válido.');
    if (v !== null && typeof v === 'object') throw malo('Filtro no válido.');   // solo textos, números o booleanos
  }
  return f;
}

const store = {
  async get(col, id) { const _id = idSeguro(id); return (await db()).collection(col).findOne({ _id }); },
  async find(col, filtro) { const f = filtroSeguro(filtro); return (await db()).collection(col).find(f).toArray(); },
  async put(col, doc) {
    const _id = idSeguro(doc && doc._id);
    await (await db()).collection(col).replaceOne({ _id }, doc, { upsert: true });
    return doc;
  },
  async del(col, id) { const _id = idSeguro(id); await (await db()).collection(col).deleteOne({ _id }); },

  // Suma 1 a un contador de forma atómica. El contador se borra solo al pasar "minutos".
  async sumar(col, id, minutos) {
    const _id = idSeguro(id);
    const r = await (await db()).collection(col).findOneAndUpdate(
      { _id },
      { $inc: { n: 1 }, $setOnInsert: { expira: new Date(Date.now() + minutos * 60000) } },
      { upsert: true, returnDocument: 'after' }
    );
    return r && r.value !== undefined ? r.value : r;   // compatible con versiones 5 y 6 del driver
  }
};

module.exports = store;
