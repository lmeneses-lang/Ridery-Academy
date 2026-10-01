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
  const KEY = 'elx_demo_db_v2';

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
    if (!(await store.get('aspirantes', 'asp-12345678'))) {
      await store.put('aspirantes', { _id: 'asp-12345678', cedula: '12345678', usuario: 'demo', hash: await cripto.hash('demo1234'), nombre: 'Aspirante Demo', email: 'demo@ridery.app', telefono: '', estado: 'aprobado',
        creado: new Date().toISOString(), aprobadoFecha: new Date().toISOString(), ultimoAcceso: null, cohorte: 'CX-2026-10', celula: 'PAYMENTS', progreso: {}, examenes: {},
        test: { fecha: new Date().toISOString(), respuestas: {}, puntajes: { PAYMENTS: 7, 'MATCH AND PRICING': 3 }, ranking: [['PAYMENTS', 7], ['MATCH AND PRICING', 3]], estado: 'asignado', motivo: '', celulaSugerida: 'PAYMENTS' } });
    }
  }

  function sesion(token) {
    if (!token || !token.startsWith('demo.')) return null;
    try { return JSON.parse(decodeURIComponent(escape(atob(token.slice(5))))); } catch (e) { return null; }
  }
  const firmar = p => 'demo.' + btoa(unescape(encodeURIComponent(JSON.stringify(p))));
  // En la demo las claves se guardan con un hash simple (solo vive en tu navegador)
  const cripto = {
    async hash(c) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('demo:' + c)); return 'demo$' + [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); },
    async verificar(c, g) { return (await cripto.hash(c)) === g; }
  };
  const pausa = () => new Promise(r => setTimeout(r, 120));

  async function llamar(fn, body, token) {
    await pausa();
    try { if (localStorage.getItem(KEY) !== null) db = null; } catch (e) { /* sin almacenamiento: se queda en memoria */ } // relee: el panel y el aspirante comparten datos entre pestañas
    await sembrarDemo();
    try {
      if (fn === 'auth') {
        if (body.accion === 'login') {
          // Demo: la cuenta principal es admin / admin1234
          const r = await H.iniciarSesion(store, body, cripto, (u, c) => u === 'admin' && c === 'admin1234');
          return r.tipo === 'admin' ? { tipo: 'admin', token: firmar(r.sesion), usuario: r.sesion.usuario }
            : { tipo: 'aspirante', token: firmar(r.sesion), aspirante: H.vistaAspirante(r.aspirante) };
        }
        if (body.accion === 'aspirante') {
          const asp = await H.loginAspirante(store, body, cripto);
          return { token: firmar({ rol: 'aspirante', id: asp._id }), aspirante: H.vistaAspirante(asp) };
        }
        if (body.accion === 'admin') {
          if (!body.usuario || !body.clave) throw H.err(401, 'Usuario o clave incorrectos.');
          // Si el usuario existe en "Usuarios", se valida su clave y rol; si no, entra como cuenta principal (solo en la demo)
          if (await store.get('usuarios', String(body.usuario).trim().toLowerCase())) {
            const u = await H.loginAdmin(store, body, cripto);
            return { token: firmar(u), usuario: u.usuario };
          }
          return { token: firmar({ rol: 'admin', usuario: body.usuario }), usuario: body.usuario };
        }
        return copia(await H.ejecutar('publico', body.accion, { store, body }));
      }
      const user = sesion(token);
      if (!user || user.rol !== fn) throw H.err(401, 'Tu sesión expiró. Vuelve a entrar.');
      return copia(await H.ejecutar(fn, body.accion, { store, user, body, cripto }));
    } catch (e) {
      if (e.status === 401 && fn !== 'auth') window.Elx.API.salir(fn === 'admin' ? 'admin' : 'asp');
      throw e;
    }
  }

  window.ElxDemo = { llamar, reiniciar() { db = {}; try { localStorage.removeItem(KEY); } catch (e) {} } };
})();
