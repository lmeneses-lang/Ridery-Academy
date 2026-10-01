/* ============================================================
   Formación CX · MODO DEMO
   Simula el backend dentro del navegador (sin MongoDB ni Vercel).
   Se activa con ?demo=1 en la URL o si window.ELX_DEMO = true.
   En producción no hace nada.
   ============================================================ */
(function () {
  'use strict';
  const activo = window.ELX_DEMO === true || /[?&]demo=1\b/.test(location.search);
  if (!activo) return;
  const H = window.ElxHandlers;
  const KEY = 'elx_demo_db_v1';

  let db = null;
  function cargar() {
    if (db) return db;
    try { db = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { db = null; }
    if (!db) db = {};
    return db;
  }
  function guardar() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* sin almacenamiento: queda en memoria */ } }
  const copia = o => o == null ? o : JSON.parse(JSON.stringify(o));

  const store = {
    async get(col, id) { const c = cargar()[col] || {}; return copia(c[id] || null); },
    async find(col, filtro) {
      const c = cargar()[col] || {};
      return Object.values(c).filter(d => Object.entries(filtro || {}).every(([k, v]) => d[k] === v)).map(copia);
    },
    async put(col, doc) { cargar(); db[col] = db[col] || {}; db[col][doc._id] = copia(doc); guardar(); return doc; },
    async del(col, id) { cargar(); if (db[col]) delete db[col][id]; guardar(); }
  };

  // Imágenes de ejemplo (SVG en línea) para que la demo muestre la galería
  function imgEjemplo(titulo, color) {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#eef1f7"/>' +
      '<rect x="40" y="40" width="720" height="70" rx="10" fill="' + color + '"/><rect x="40" y="140" width="460" height="24" rx="6" fill="#c9d0de"/>' +
      '<rect x="40" y="184" width="380" height="24" rx="6" fill="#c9d0de"/><rect x="40" y="250" width="720" height="300" rx="10" fill="#fff" stroke="#d9dee8"/>' +
      '<text x="70" y="86" font-family="sans-serif" font-size="30" font-weight="700" fill="#fff">' + titulo + '</text>' +
      '<text x="70" y="410" font-family="sans-serif" font-size="26" fill="#5a6378">Captura de ejemplo</text></svg>';
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  }
  async function sembrarDemo() {
    await H.cargarConfig(store);
    const m = await store.get('modulos', 'm-comun-1');
    if (m && !m._demo) {
      m._demo = true;
      m.lecciones[1].imagenes = [imgEjemplo('Células de CX', '#2F49D1'), imgEjemplo('Panel de Zendesk', '#11734A')];
      await store.put('modulos', m);
    }
  }

  function sesion(token) {
    if (!token || !token.startsWith('demo.')) return null;
    try { return JSON.parse(atob(token.slice(5))); } catch (e) { return null; }
  }
  const firmar = p => 'demo.' + btoa(JSON.stringify(p));
  const pausa = () => new Promise(r => setTimeout(r, 120));

  async function llamar(fn, body, token) {
    await pausa();
    await sembrarDemo();
    try {
      if (fn === 'auth') {
        if (body.accion === 'aspirante') {
          const asp = await H.loginAspirante(store, body);
          return { token: firmar({ rol: 'aspirante', id: asp._id }), aspirante: H.vistaAspirante(asp) };
        }
        if (body.accion === 'admin') {
          if (!body.usuario || !body.clave) throw H.err(401, 'Usuario o clave incorrectos.');
          return { token: firmar({ rol: 'admin', usuario: body.usuario }), usuario: body.usuario };
        }
        throw H.err(400, 'Acción desconocida');
      }
      const user = sesion(token);
      if (!user || user.rol !== fn) throw H.err(401, 'Tu sesión expiró. Vuelve a entrar.');
      return copia(await H.ejecutar(fn, body.accion, { store, user, body }));
    } catch (e) {
      if (e.status === 401 && fn !== 'auth') window.Elx.API.salir(fn === 'admin' ? 'admin' : 'asp');
      throw e;
    }
  }

  window.ElxDemo = { llamar, reiniciar() { db = {}; try { localStorage.removeItem(KEY); } catch (e) {} } };
})();
