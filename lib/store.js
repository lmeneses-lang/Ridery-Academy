// Adaptador MongoDB para la lógica compartida (js/handlers.js)
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
    if (!indices) {   // una vez por arranque: búsquedas frecuentes (chat y login por usuario)
      indices = Promise.all([
        d.collection('mensajes').createIndex({ aspirante: 1, fecha: 1 }),
        d.collection('aspirantes').createIndex({ usuario: 1 })
      ]).catch(e => { console.error('No se pudieron crear índices', e); });
    }
    return d;
  });
}

const store = {
  async get(col, id) { return (await db()).collection(col).findOne({ _id: id }); },
  async find(col, filtro) { return (await db()).collection(col).find(filtro || {}).toArray(); },
  async put(col, doc) { await (await db()).collection(col).replaceOne({ _id: doc._id }, doc, { upsert: true }); return doc; },
  async del(col, id) { await (await db()).collection(col).deleteOne({ _id: id }); }
};

module.exports = store;
