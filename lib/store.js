// Adaptador MongoDB para la lógica compartida (js/handlers.js)
const { MongoClient } = require('mongodb');

let clientPromise = null;
function db() {
  if (!process.env.MONGODB_URI) throw new Error('Falta la variable MONGODB_URI en Vercel.');
  if (!clientPromise) {
    clientPromise = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 }).connect()
      .catch(e => { clientPromise = null; throw e; }); // si falla, el siguiente intento vuelve a conectar
  }
  return clientPromise.then(c => c.db(process.env.MONGODB_DB || 'elearning_cx'));
}

const store = {
  async get(col, id) { return (await db()).collection(col).findOne({ _id: id }); },
  async find(col, filtro) { return (await db()).collection(col).find(filtro || {}).toArray(); },
  async put(col, doc) { await (await db()).collection(col).replaceOne({ _id: doc._id }, doc, { upsert: true }); return doc; },
  async del(col, id) { await (await db()).collection(col).deleteOne({ _id: id }); }
};

module.exports = store;
