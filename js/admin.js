/* ============================================================
   Ridery Academy · panel de administración
   ============================================================ */
(function () {
  'use strict';
  const { API, esc, icon, youtubeId, tipoImagen, toast, confirmar, fecha, fechaHora, iniciales } = window.Elx;
  const H = window.ElxHandlers;
  const app = document.getElementById('app');
  const call = (accion, data) => API.llamar('admin', 'admin', accion, data);
  const A = { usuario: null, celulas: [], reglas: {}, cohortes: [], tab: 'aspirantes', filtros: { q: '', cohorte: '', celula: '', estado: 'postulado' }, celContenido: H.COMUN, aspirantes: [] };
  const TABS = [
    ['aspirantes', 'Postulaciones', 'users'], ['assessment', 'Assessment', 'chat'], ['test', 'Formulario', 'list'], ['contenido', 'Contenido', 'book'],
    ['boost', 'Boost', 'bolt'], ['metricas', 'Métricas', 'chart'], ['usuarios', 'Usuarios', 'lock'], ['ajustes', 'Ajustes', 'gear']
  ];
  // Qué ve cada rol en el menú (el servidor también valida cada acción)
  const TABS_ROL = { admin: TABS.map(t => t[0]), reclutador: ['aspirantes', 'assessment', 'metricas'], calidad: ['aspirantes', 'assessment', 'metricas'] };
  const ROL_NOMBRE = { admin: 'Admin', reclutador: 'Reclutador', calidad: 'Calidad' };
  const ROL_TEXTO = { admin: 'Todo el panel: contenido, test, ajustes y usuarios.', reclutador: 'Postulaciones: aprobar, descartar, agregar aspirantes y darles acceso. Chat de Assessment y métricas.', calidad: 'Ver postulaciones, aspirantes y métricas, y responder en Assessment. No puede editar.' };
  const puede = (...roles) => roles.includes(A.yo && A.yo.perfil);
  const nombreCel = id => id === H.COMUN ? 'Tronco común' : ((A.celulas.find(c => c.id === id) || {}).nombre || id || '—');
  const opcionesCel = (sel, extra) => (extra || '') + A.celulas.map(c => '<option value="' + esc(c.id) + '"' + (c.id === sel ? ' selected' : '') + '>' + esc(c.nombre) + '</option>').join('');
  let main = null;
  let dirty = false;

  function manejar(e) {
    if (e.status === 401) { API.salir('admin'); return verLogin('Tu sesión expiró. Vuelve a entrar.'); }
    toast(e.message || 'Algo falló.', 'bad');
  }

  /* ---------- Acceso ---------- */
  function verLogin(msg) {
    app.innerHTML = '<header class="topbar"><span class="brand"><img class="brand-mark" src="img/logo-192.png" alt="Ridery" width="32" height="32"><span>Ridery Academy <small>· Panel</small></span></span></header>' +
      '<main class="center-wrap"><form class="card stack" id="f" style="width:100%;max-width:400px" novalidate><div class="stack-sm"><h1>Inicia sesión</h1><p class="muted small">Panel del equipo de Ridery Academy.</p></div>' +
      '<div class="form-error" role="alert"' + (msg ? '' : ' hidden') + '>' + esc(msg || '') + '</div>' +
      '<div class="field"><label for="a-u">Usuario</label><input class="input" id="a-u" autocomplete="username"></div>' +
      '<div class="field"><label for="a-p">Clave</label><input class="input" id="a-p" type="password" autocomplete="current-password"></div>' +
      (window.ElxDemo ? '<p class="small muted">Demo: usuario <b>admin</b> y clave <b>admin1234</b>.</p>' : '') +
      '<button class="btn btn-primary btn-block" type="submit">Entrar</button></form></main>';
    const f = app.querySelector('#f');
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const er = f.querySelector('.form-error'), b = f.querySelector('button');
      b.disabled = true;
      try {
        const r = await API.llamar('admin', 'auth', 'login', { usuario: f.querySelector('#a-u').value.trim(), clave: f.querySelector('#a-p').value });
        if (r.tipo === 'aspirante') {   // un aspirante entró por aquí: lo llevamos a su formación
          API.guardarToken('asp', r.token);
          location.href = 'index.html' + (window.ElxDemo && !window.ELX_DEMO ? '?demo=1' : '');
          return;
        }
        API.guardarToken('admin', r.token); Elx.Store.set('elx_admin_user', r.usuario);
        iniciar();
      } catch (x) { er.hidden = false; er.textContent = x.message; b.disabled = false; }
    });
    f.querySelector('#a-u').focus();
  }

  async function iniciar() {
    if (!API.token('admin')) return verLogin();
    A.usuario = Elx.Store.get('elx_admin_user') || 'admin';
    app.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    try {
      const r = await call('resumen');
      A.celulas = r.celulas; A.reglas = r.reglas; A.cohortes = r.cohortes; A.yo = r.yo;
      A.usuario = r.yo.nombre || r.yo.usuario;
      if (!TABS_ROL[A.yo.perfil].includes(A.tab)) A.tab = TABS_ROL[A.yo.perfil][0];
      shell(); abrir(A.tab);
      call('chats').then(x => pintarBadge(x.noLeidos), () => {});
    } catch (e) { manejar(e); }
  }

  function shell() {
    app.innerHTML = '<header class="topbar"><span class="brand"><img class="brand-mark" src="img/logo-192.png" alt="Ridery" width="32" height="32"><span>Ridery Academy <small>· Panel</small></span></span><div class="grow"></div>' +
      '<div style="position:relative"><button class="user-chip" id="um" aria-haspopup="true"><span class="avatar avatar-top">' + icon('user') + '</span><span class="hide-sm small">' + esc(A.usuario) + '</span>' + icon('chev') + '</button>' +
      '<div class="menu" id="user-menu" hidden><div style="padding:8px 10px"><b>' + esc(A.usuario) + '</b><div class="small muted">' + esc(ROL_NOMBRE[A.yo.perfil]) + (A.yo.principal ? ' · cuenta principal' : ' · @' + esc(A.yo.usuario)) + '</div></div><hr class="divider">' +
      (A.yo.principal ? '' : '<button id="mi-clave">' + icon('lock') + 'Cambiar mi clave</button>') + '<button id="salir">' + icon('out') + 'Salir</button></div></div></header>' +
      '<div class="admin"><nav class="admin-nav" aria-label="Secciones">' + TABS.filter(t => TABS_ROL[A.yo.perfil].includes(t[0])).map(t => '<button data-tab="' + t[0] + '">' + icon(t[2]) + t[1] + (t[0] === 'assessment' ? '<span class="badge" data-badge hidden>0</span>' : '') + '</button>').join('') + '</nav><main class="admin-main" id="main"></main></div>';
    main = app.querySelector('#main');
    const menu = app.querySelector('#user-menu');
    app.querySelector('#um').addEventListener('click', e => { e.stopPropagation(); menu.hidden = !menu.hidden; });
    document.addEventListener('click', e => { if (!e.target.closest('.menu')) menu.hidden = true; });
    app.querySelector('#salir').addEventListener('click', () => { API.salir('admin'); location.href = 'index.html' + (window.ElxDemo && !window.ELX_DEMO ? '?demo=1' : ''); });
    const mc = app.querySelector('#mi-clave'); if (mc) mc.addEventListener('click', cambiarMiClave);
    app.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', async () => {
      if (dirty && !await confirmar({ titulo: '¿Salir sin guardar?', texto: 'Tienes cambios sin guardar en este módulo.', ok: 'Salir sin guardar', peligro: true })) return;
      dirty = false; abrir(b.dataset.tab);
    }));
  }
  function abrir(tab, extra) {
    if (A.parar) { A.parar(); A.parar = null; }
    A.tab = tab;
    app.querySelectorAll('[data-tab]').forEach(b => { b.classList.toggle('active', b.dataset.tab === tab); b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false'); });
    main.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    ({ aspirantes: tabAspirantes, assessment: tabAssessment, test: tabTest, contenido: tabContenido, boost: tabBoost, metricas: tabMetricas, usuarios: tabUsuarios, ajustes: tabAjustes })[tab](extra);
  }
  function pintarBadge(n) {
    A.noLeidos = n;
    document.querySelectorAll('[data-badge]').forEach(b => { b.textContent = n; b.hidden = !n; });
  }
  // Revisa chats nuevos cada 15 s mientras no estés en Assessment
  setInterval(async () => {
    if (!A.yo || A.tab === 'assessment' || document.hidden || !API.token('admin')) return;
    try { const r = await call('chats'); if (r.noLeidos > (A.noLeidos || 0)) toast('Nuevo mensaje en Assessment'); pintarBadge(r.noLeidos); } catch (e) {}
  }, 15000);
  const encabezado = (titulo, sub, acciones) => '<div class="row-between"><div class="stack-sm" style="gap:4px"><h1>' + titulo + '</h1>' + (sub ? '<p class="muted">' + sub + '</p>' : '') + '</div><div class="row">' + (acciones || '') + '</div></div>';

  /* ============ Postulaciones y aspirantes ============ */
  const ESTADOS = [['postulado', 'Por revisar'], ['aprobado', 'Aspirantes'], ['descartado', 'Descartados']];
  function pillEstado(a) {
    if (a.estado === 'aprobado') return '<span class="pill pill-ok">Aspirante</span>';
    if (a.estado === 'descartado') return '<span class="pill">' + (a.autoDescartado ? 'Descartado · filtro' : 'Descartado') + '</span>';
    return a.celulaSugerida ? '<span class="pill pill-brand">Por revisar</span>' : '<span class="pill pill-warn">Por revisar · sin célula</span>';
  }
  const notaPill = n => n == null ? '<span class="muted">—</span>' : '<span class="pill ' + (n >= A.reglas.notaMinima ? 'pill-ok' : n >= 50 ? 'pill-warn' : 'pill-bad') + '">' + n + '%</span>';
  async function tabAspirantes() {
    try { A.aspirantes = (await call('aspirantes')).aspirantes; } catch (e) { return manejar(e); }
    if (A.tab !== 'aspirantes') return;   // el usuario ya cambió de sección
    const f = A.filtros;
    if (!f.estado || !ESTADOS.some(x => x[0] === f.estado)) f.estado = 'postulado';
    const cuenta = e => A.aspirantes.filter(a => a.estado === e).length;
    main.innerHTML = encabezado('Postulaciones', 'Quien se postula aparece en «Por revisar». Al aprobarlo pasa a «Aspirantes» y puede entrar a la formación.', '<button class="btn btn-secondary" id="csv">' + icon('download') + 'Exportar CSV</button>' + (puede('admin', 'reclutador') ? '<button class="btn btn-primary" id="nuevo-asp">' + icon('plus') + 'Agregar aspirante</button>' : '')) +
      '<div class="seg" role="tablist">' + ESTADOS.map(([k, n]) => '<button role="tab" data-est="' + k + '" class="' + (f.estado === k ? 'active' : '') + '" aria-selected="' + (f.estado === k) + '">' + n + ' <span class="num" style="opacity:.6">' + cuenta(k) + '</span></button>').join('') + '</div>' +
      '<div class="filters"><input class="input" id="f-q" placeholder="Buscar por nombre o cédula" value="' + esc(f.q) + '">' +
      '<select class="select" id="f-cel"><option value="">Todas las células</option><option value="__sin"' + (f.celula === '__sin' ? ' selected' : '') + '>Sin célula</option>' + opcionesCel(f.celula) + '</select>' +
      '</div>' +
      '<div id="tabla"></div>';
    const pintar = () => {
      const q = f.q.toLowerCase();
      const lista = A.aspirantes.filter(a => a.estado === f.estado &&
        (!q || a.nombre.toLowerCase().includes(q) || a.cedula.toLowerCase().includes(q)) &&
        (!f.celula || (f.celula === '__sin' ? !a.celula : a.celula === f.celula)) &&
        true);
      A.filtrados = lista;
      const t = main.querySelector('#tabla');
      if (!lista.length) {
        const vacio = { postulado: A.aspirantes.length ? 'No hay postulaciones por revisar con estos filtros.' : 'Todavía no hay postulaciones. Comparte el enlace de la página para que la gente se postule.', aprobado: 'Todavía no apruebas aspirantes. Revisa las postulaciones y aprueba a quien quieras formar.', descartado: 'No hay postulaciones descartadas.' }[f.estado];
        t.innerHTML = '<div class="card empty">' + icon('users') + '<p>' + vacio + '</p></div>'; return;
      }
      const esAsp = f.estado === 'aprobado';
      t.innerHTML = '<p class="small muted num">' + lista.length + ' resultado' + (lista.length === 1 ? '' : 's') + '</p><div class="table-wrap"><table><thead><tr><th>Persona</th><th>Contacto</th><th>' + (esAsp ? 'Célula' : 'Célula sugerida') + '</th>' +
        (esAsp ? '<th>Usuario</th><th>Progreso</th><th>Promedio</th><th>Último acceso</th>' : '<th>Casos</th><th>Estado</th><th>Fecha</th>') + '</tr></thead><tbody>' +
        lista.map(a => '<tr class="click" data-id="' + esc(a._id) + '" tabindex="0"><td><b>' + esc(a.nombre) + '</b><div class="small muted num">C.I. ' + esc(a.cedula) + (a.ciudad ? ' · ' + esc(a.ciudad) : '') + '</div></td>' +
          '<td class="small">' + esc(a.telefono || '—') + '<div class="muted">' + esc(a.email || '') + '</div></td><td>' + esc(a.celula ? nombreCel(a.celula) : '—') + '</td>' +
          (esAsp
            ? '<td class="num">' + (a.usuario && a.tieneClave ? '@' + esc(a.usuario) : '<span class="pill pill-warn">Sin acceso</span>') + '</td><td><div class="row" style="gap:8px;flex-wrap:nowrap"><div class="bar' + (a.completo ? ' ok' : '') + '"><span style="width:' + a.progreso + '%"></span></div><span class="small num">' + a.progreso + '%</span></div></td>' +
              '<td class="num">' + (a.promedio != null ? a.promedio + '%' : '—') + '</td><td class="small muted">' + (a.ultimoAcceso ? fechaHora(a.ultimoAcceso) : 'Sin entrar') + '</td>'
            : '<td class="num">' + notaPill(a.nota) + '</td><td><div class="row" style="gap:6px">' + pillEstado(a) + (a.alertas ? '<span class="pill pill-bad">' + icon('alert') + a.alertas + '</span>' : '') + '</div></td><td class="small muted">' + fechaHora(a.creado) + '</td>') + '</tr>').join('') + '</tbody></table></div>';
      t.querySelectorAll('tr.click').forEach(tr => {
        tr.addEventListener('click', () => detalleAspirante(tr.dataset.id));
        tr.addEventListener('keydown', e => { if (e.key === 'Enter') detalleAspirante(tr.dataset.id); });
      });
    };
    main.querySelectorAll('[data-est]').forEach(b => b.addEventListener('click', () => { f.estado = b.dataset.est; tabAspirantes(); }));
    main.querySelector('#f-q').addEventListener('input', e => { f.q = e.target.value; pintar(); });
    main.querySelector('#f-cel').addEventListener('change', e => { f.celula = e.target.value; pintar(); });
    main.querySelector('#csv').addEventListener('click', () => exportarCSV(A.filtrados || []));
    const na = main.querySelector('#nuevo-asp'); if (na) na.addEventListener('click', modalNuevoAspirante);
    pintar();
  }

  // Campos de acceso del aspirante (usuario + contraseña con botón Generar)
  function camposAcceso(pref, usuario, nueva) {
    return '<div class="two"><div class="field"><label for="' + pref + '-usr">Usuario</label><input class="input" id="' + pref + '-usr" value="' + esc(usuario || '') + '" autocomplete="off" autocapitalize="none" spellcheck="false"><span class="hint">Sin espacios. Por defecto, su cédula.</span></div>' +
      '<div class="field"><label for="' + pref + '-pass">' + (nueva ? 'Contraseña' : 'Nueva contraseña (opcional)') + '</label><div class="row" style="flex-wrap:nowrap"><input class="input" id="' + pref + '-pass" autocomplete="new-password" placeholder="' + (nueva ? 'Mínimo 8 caracteres' : 'Déjala vacía para no cambiarla') + '">' +
      '<button type="button" class="btn btn-secondary" data-gen="' + pref + '">Generar</button></div></div></div>';
  }
  function enlazarGenerar(raiz) {
    raiz.querySelectorAll('[data-gen]').forEach(b => b.addEventListener('click', () => { const i = raiz.querySelector('#' + b.dataset.gen + '-pass'); i.value = claveAleatoria().slice(0, 8); i.select(); }));
  }
  // Muestra el acceso una sola vez y permite copiar el mensaje para WhatsApp
  async function mostrarAcceso(nombre, usuario, clave, celula) {
    const url = location.origin + location.pathname.replace(/admin\.html$/, '');
    const msg = 'Hola ' + nombre.split(' ')[0] + ', fuiste seleccionado para la formación de agentes CX de Ridery' + (celula ? ' (célula ' + nombreCel(celula) + ')' : '') + '.\n' +
      'Entra en ' + url + ' → «Inicia sesión»\nUsuario: ' + usuario + '\nContraseña: ' + clave;
    const ok = await confirmar({ titulo: 'Acceso de ' + nombre.split(' ')[0], texto: 'Usuario <b>' + esc(usuario) + '</b> · contraseña <b class="num">' + esc(clave) + '</b><br>Envíaselo ahora: la contraseña no se puede volver a ver.', ok: 'Copiar mensaje', cancelar: 'Cerrar' });
    if (ok) navigator.clipboard.writeText(msg).then(() => toast('Mensaje copiado. Pégalo en WhatsApp.'), () => toast('No se pudo copiar. Anótalo a mano.', 'bad'));
  }

  function modalNuevoAspirante() {
    const w = document.createElement('div'); w.className = 'modal-wrap';
    w.innerHTML = '<form class="modal" role="dialog" aria-modal="true" aria-labelledby="na-t" novalidate><div class="row-between"><h2 id="na-t">Agregar aspirante</h2><button type="button" class="icon-btn" data-x aria-label="Cerrar">' + icon('x') + '</button></div>' +
      '<p class="small muted">Queda aprobado de una vez, sin pasar por el test. Úsalo para referidos o reingresos.</p><div class="form-error" role="alert" hidden></div>' +
      '<div class="field"><label for="na-nombre">Nombre y apellido</label><input class="input" id="na-nombre" required></div>' +
      '<div class="two"><div class="field"><label for="na-cedula">Cédula</label><input class="input" id="na-cedula" inputmode="numeric" required></div><div class="field"><label for="na-ciudad">Ciudad</label><input class="input" id="na-ciudad"></div></div>' +
      '<div class="two"><div class="field"><label for="na-email">Correo</label><input class="input" id="na-email" type="email"></div><div class="field"><label for="na-tel">Teléfono</label><input class="input" id="na-tel" type="tel"></div></div>' +
      '<div class="field"><label for="na-cel">Célula</label><select class="select" id="na-cel"><option value="">Elige una célula</option>' + opcionesCel('') + '</select></div>' +
      camposAcceso('na', '', true) +
      '<div class="field"><label for="na-nota">Nota interna (opcional)</label><input class="input" id="na-nota" placeholder="Ej. referido por supervisor de Payments"></div>' +
      '<div class="modal-actions"><button type="button" class="btn btn-secondary" data-x>Cancelar</button><button class="btn btn-primary" type="submit">' + icon('check') + 'Agregar aspirante</button></div></form>';
    const cerrar = () => w.remove();
    w.addEventListener('click', e => { if (e.target === w || e.target.closest('[data-x]')) cerrar(); });
    document.body.appendChild(w);
    const f = w.querySelector('form'), v = id => f.querySelector('#' + id).value.trim();
    enlazarGenerar(f);
    f.querySelector('#na-cedula').addEventListener('input', e => { const u = f.querySelector('#na-usr'); if (!u.dataset.tocado) u.value = e.target.value.replace(/\D/g, ''); });
    f.querySelector('#na-usr').addEventListener('input', e => { e.target.dataset.tocado = '1'; });
    f.querySelector('#na-nombre').focus();
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const er = f.querySelector('.form-error'), b = f.querySelector('[type="submit"]');
      b.disabled = true;
      try {
        const clave = v('na-pass');
        const r = await call('crearAspirante', { aspirante: { nombre: v('na-nombre'), cedula: v('na-cedula'), ciudad: v('na-ciudad'), email: v('na-email'), telefono: v('na-tel'), celula: v('na-cel'), usuario: v('na-usr'), clave, nota: v('na-nota') } });
        cerrar(); A.filtros.estado = 'aprobado'; tabAspirantes();
        mostrarAcceso(v('na-nombre'), r.usuario, clave, v('na-cel'));
      } catch (x) { er.hidden = false; er.textContent = x.message; b.disabled = false; }
    });
  }

  function cambiarMiClave() {
    const w = document.createElement('div'); w.className = 'modal-wrap';
    w.innerHTML = '<form class="modal" role="dialog" aria-modal="true" novalidate><h2>Cambiar mi clave</h2><div class="form-error" role="alert" hidden></div>' +
      '<div class="field"><label for="mc-a">Clave actual</label><input class="input" id="mc-a" type="password" autocomplete="current-password"></div>' +
      '<div class="field"><label for="mc-n">Clave nueva</label><input class="input" id="mc-n" type="password" autocomplete="new-password"><span class="hint">Mínimo 8 caracteres.</span></div>' +
      '<div class="modal-actions"><button type="button" class="btn btn-secondary" data-x>Cancelar</button><button class="btn btn-primary" type="submit">Guardar</button></div></form>';
    w.addEventListener('click', e => { if (e.target === w || e.target.closest('[data-x]')) w.remove(); });
    document.body.appendChild(w);
    const f = w.querySelector('form'); f.querySelector('#mc-a').focus();
    f.addEventListener('submit', async e => {
      e.preventDefault();
      try { const r = await call('cambiarMiClave', { actual: f.querySelector('#mc-a').value, nueva: f.querySelector('#mc-n').value }); if (r.token) API.guardarToken('admin', r.token); w.remove(); toast('Clave actualizada. Se cerró tu sesión en otros dispositivos.'); }
      catch (x) { const er = f.querySelector('.form-error'); er.hidden = false; er.textContent = x.message; }
    });
  }
  function exportarCSV(lista) {
    const cols = ['Nombre', 'Cédula', 'Edad', 'Nota casos %', 'Alertas', 'Correo', 'Teléfono', 'Ciudad', 'Estado', 'Célula', 'Célula sugerida', 'Usuario', 'Progreso %', 'Promedio %', 'Mecanografía PPM', 'Completó', 'Postulación', 'Aprobado', 'Último acceso'];
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const est = { postulado: 'Por revisar', aprobado: 'Aspirante', descartado: 'Descartado' };
    const filas = lista.map(a => [a.nombre, a.cedula, a.edad, a.nota, a.alertas, a.email, a.telefono, a.ciudad, est[a.estado], a.celula ? nombreCel(a.celula) : '', a.celulaSugerida ? nombreCel(a.celulaSugerida) : '', a.usuario, a.progreso, a.promedio, a.ppm, a.completo ? 'Sí' : 'No', a.creado, a.aprobadoFecha, a.ultimoAcceso].map(q).join(';'));
    const blob = new Blob(['﻿' + [cols.map(q).join(';')].concat(filas).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const el = document.createElement('a'); el.href = URL.createObjectURL(blob); el.download = 'postulaciones-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(el); el.click(); el.remove();
    toast('CSV exportado (' + lista.length + ')');
  }

  // Resultado de Postúlate en la ficha: nota de casos, alertas, célula sugerida y respuestas por sección
  function bloqueEvaluacion(a) {
    const t = a.test;
    if (!t) return '<div class="stack-sm"><h3>Evaluación</h3><p class="small muted">' + (a.origen === 'manual' ? 'Agregado a mano: no hizo la evaluación.' : 'Sin evaluación.') + '</p></div>';
    const ev = t.evaluacion, max = Math.max(1, ...Object.values(t.puntajes || {}));
    const secs = A.secciones || [];
    const grupos = {};
    Object.values(t.respuestas || {}).forEach(x => { const k = x.seccion || '_'; (grupos[k] = grupos[k] || []).push(x); });
    const tituloSec = k => k === '_' ? 'Test de perfil' : ((secs.find(s => s.id === k) || {}).titulo || k);
    const orden = Object.keys(grupos).sort((x, y) => secs.findIndex(s => s.id === x) - secs.findIndex(s => s.id === y));
    const item = (x, i) => {
      const largo = x.tipo === 'larga' || x.tipo === 'corta';
      const marca = x.acierto === true ? '<span class="pill pill-ok">' + icon('check') + 'Correcta</span>' : x.acierto === false ? '<span class="pill pill-bad">' + icon('x') + 'Incorrecta</span>' : '';
      return '<div class="review-item"><span class="n num">' + (i + 1) + '</span><div class="grow stack-sm" style="gap:4px"><span class="small muted">' + esc(x.pregunta) + '</span>' +
        (largo ? '<div class="texto-libre">' + esc(x.texto) + '</div>' : '<b>' + esc(x.texto) + '</b>') +
        (x.acierto === false && x.correcta ? '<span class="small muted">Correcta: ' + esc(x.correcta) + '</span>' : '') + '</div>' + marca + '</div>';
    };
    return '<div class="stack"><div class="row-between"><h3>Evaluación</h3><span class="small muted">' + fechaHora(t.fecha) + '</span></div>' +
      (a.motivoDescarte ? '<div class="notice" style="border-color:var(--bad)">' + icon('alert') + ' ' + esc(a.motivoDescarte) + '. Si fue un error, usa «Volver a Por revisar».</div>' : '') +
      '<div class="cert-grid small">' +
      '<div><span class="muted">Nota de casos</span><b class="num">' + (ev && ev.total ? ev.correctas + ' de ' + ev.total + ' · ' + ev.nota + '%' : '—') + '</b></div>' +
      '<div><span class="muted">Célula sugerida</span><b>' + esc(t.celulaSugerida ? nombreCel(t.celulaSugerida) : 'Ninguna') + '</b></div>' +
      '<div><span class="muted">Alertas</span><b>' + ((t.alertas || []).length ? t.alertas.map(x => '<span class="pill pill-bad">' + esc(x) + '</span>').join(' ') : 'Ninguna') + '</b></div></div>' +
      (t.motivo ? '<p class="small muted">Célula: ' + esc(t.motivo) + '</p>' : '') +
      ((t.ranking || []).length ? '<div class="stack-sm">' + t.ranking.map(([c, v]) => '<div class="hbar"><span>' + esc(nombreCel(c)) + '</span><div class="bar"><span style="width:' + Math.round(v * 100 / max) + '%"></span></div><span class="num small">' + v + '</span></div>').join('') + '</div>' : '') +
      orden.map(k => '<details' + (grupos[k].some(x => x.tipo === 'larga') ? ' open' : '') + '><summary class="small" style="cursor:pointer;font-weight:700">' + esc(tituloSec(k)) + ' (' + grupos[k].length + ')' +
        (grupos[k].some(x => x.acierto != null) ? ' · ' + grupos[k].filter(x => x.acierto).length + '/' + grupos[k].filter(x => x.acierto != null).length + ' correctas' : '') + '</summary><div class="review">' + grupos[k].map(item).join('') + '</div></details>').join('') +
      '</div>';
  }
  async function detalleAspirante(id) {
    if (!A.secciones) { try { A.secciones = (await call('preguntas')).secciones; } catch (e) { A.secciones = []; } }
    let d;
    try { d = await call('aspirante', { id }); } catch (e) { return manejar(e); }
    const a = d.aspirante, t = a.test, r = d.resumen;
    const max = t ? Math.max(1, ...Object.values(t.puntajes || {})) : 1;
    let acciones;
    if (!puede('admin', 'reclutador')) acciones = '';
    else if (r.estado === 'postulado') acciones = '<div class="card card-tight stack-sm" style="background:var(--brand-soft);border-color:transparent"><h3>Aprobar como aspirante</h3><p class="small muted">Elige su célula y créale un usuario y contraseña. Con eso entra por «Inicia sesión».</p>' +
      '<div class="field"><label for="d-cel">Célula</label><select class="select" id="d-cel" style="width:auto"><option value="">Elige una célula</option>' + opcionesCel(a.celula) + '</select></div>' +
      camposAcceso('d', a.usuario || a.cedula, !a.hash && !r.tieneClave) +
      '<div class="row"><button class="btn btn-primary" id="d-aprobar">' + icon('check') + 'Aprobar</button><button class="btn btn-danger" id="d-desc">Descartar</button></div></div>';
    else if (r.estado === 'descartado') acciones = '<div class="notice">Esta postulación fue descartada.</div><div class="row"><button class="btn btn-secondary" id="d-rev">Volver a «Por revisar»</button></div>';
    else acciones = '<div class="card card-tight stack-sm"><div class="row-between"><h3>Célula y acceso</h3>' + (r.tieneClave ? '<span class="small muted">Entra como <b>@' + esc(r.usuario) + '</b></span>' : '<span class="pill pill-warn">Sin contraseña: no puede entrar</span>') + '</div>' +
      '<div class="field"><label for="d-cel">Célula</label><select class="select" id="d-cel" style="width:auto">' + opcionesCel(a.celula) + '</select></div>' +
      camposAcceso('d', a.usuario || a.cedula, !r.tieneClave) +
      '<div class="row"><button class="btn btn-primary btn-sm" id="d-save">Guardar cambios</button><button class="btn btn-ghost btn-sm" id="d-rev">Quitar acceso (volver a «Por revisar»)</button></div>' +
      '<p class="small muted">Si olvidó su contraseña, genera una nueva y guárdala: te mostramos el mensaje para enviársela.</p></div>';
    const w = document.createElement('div'); w.className = 'modal-wrap';
    w.innerHTML = '<div class="modal wide" role="dialog" aria-modal="true" aria-labelledby="dt"><div class="row-between"><div class="row"><span class="avatar">' + esc(iniciales(a.nombre)) + '</span><div><h2 id="dt">' + esc(a.nombre) + '</h2><span class="small muted num">C.I. ' + esc(a.cedula) + '</span></div>' + pillEstado(r) + '</div><button class="icon-btn" data-x aria-label="Cerrar">' + icon('x') + '</button></div>' +
      '<div class="cert-grid small"><div><span class="muted">Correo</span><b>' + esc(a.email || '—') + '</b></div><div><span class="muted">Teléfono</span><b>' + esc(a.telefono || '—') + '</b></div>' + (a.edad ? '<div><span class="muted">Edad</span><b class="num">' + esc(a.edad) + ' años</b></div>' : '') + '<div><span class="muted">Ciudad</span><b>' + esc(a.ciudad || '—') + '</b></div><div><span class="muted">Postulación</span><b>' + fecha(a.creado) + '</b></div>' +
      (r.estado === 'aprobado' ? '<div><span class="muted">Progreso</span><b class="num">' + r.progreso + '%' + (r.completo ? ' · completó' : '') + '</b></div>' : '') + '</div>' +
      acciones +
      '<hr class="divider">' + bloqueEvaluacion(a) +
      (r.estado === 'aprobado' ? '<hr class="divider"><div class="stack-sm"><h3>Módulos</h3>' + (d.ruta.modulos.length ? '<div class="table-wrap"><table><thead><tr><th>Módulo</th><th>Estado</th><th>Intentos</th><th>Mejor nota</th><th></th></tr></thead><tbody>' +
        d.ruta.modulos.map(m => '<tr><td><b>' + esc(m.titulo) + '</b><div class="small muted">' + esc(nombreCel(m.celula)) + '</div></td><td>' + ({ aprobado: '<span class="pill pill-ok">Aprobado</span>', disponible: '<span class="pill pill-brand">En curso</span>', bloqueado: '<span class="pill">Bloqueado</span>', agotado: '<span class="pill pill-bad">Sin intentos</span>' }[m.estado]) + '</td>' +
          '<td class="num">' + m.examen.intentos + ' / ' + A.reglas.intentosMax + '</td><td class="num">' + (m.examen.mejor != null ? m.examen.mejor + '%' : '—') + '</td>' +
          '<td>' + (m.examen.intentos && !m.examen.aprobado && puede('admin', 'reclutador') ? '<button class="btn btn-secondary btn-sm" data-reset="' + esc(m._id) + '">Reiniciar intentos</button>' : '') + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="small muted">Sin módulos en su ruta.</p>') + '</div>' : '') +
      (r.estado === 'aprobado' ? '<hr class="divider"><div class="stack-sm"><div class="row-between"><h3>Boost · Mecanografía</h3><button class="btn btn-secondary btn-sm" id="d-chat">' + icon('chat') + 'Abrir chat</button></div>' +
        (a.boost && a.boost.mecanografia && a.boost.mecanografia.intentos
          ? (() => { const b = a.boost.mecanografia, u = b.historial[0] || {}; return '<div class="cert-grid small"><div><span class="muted">Mejor marca</span><b class="num">' + b.mejor + ' PPM</b></div><div><span class="muted">Último intento</span><b class="num">' + u.ppm + ' PPM · ' + u.precision + '%</b></div><div><span class="muted">Intentos</span><b class="num">' + b.intentos + '</b></div><div><span class="muted">Última práctica</span><b>' + fecha(u.fecha) + '</b></div></div>'; })()
          : '<p class="small muted">Todavía no ha practicado.</p>') + '</div>' : '') +
      (a.origen === 'manual' ? '<p class="small muted">Agregado a mano desde el panel' + (a.nota ? ': ' + esc(a.nota) : '') + '</p>' : '') +
      '<div class="modal-actions" style="justify-content:space-between">' + (puede('admin') ? '<button class="btn btn-danger btn-sm" id="d-del">' + icon('trash') + 'Eliminar registro</button>' : '<span></span>') + '<button class="btn btn-secondary" data-x>Cerrar</button></div></div>';
    const cerrar = () => { w.remove(); document.removeEventListener('keydown', k); };
    const k = e => { if (e.key === 'Escape' && !document.querySelector('.modal-wrap + .modal-wrap')) cerrar(); };
    document.addEventListener('keydown', k);
    w.addEventListener('click', e => { if (e.target === w || e.target.closest('[data-x]')) cerrar(); });
    document.body.appendChild(w);
    const recargar = async () => { cerrar(); await tabAspirantes(); await detalleAspirante(id); };
    const $ = sel => w.querySelector(sel);
    enlazarGenerar(w);
    if ($('#d-aprobar')) $('#d-aprobar').addEventListener('click', async () => {
      const celula = $('#d-cel').value, usuario = $('#d-usr').value.trim(), clave = $('#d-pass').value;
      if (!celula) return toast('Elige la célula antes de aprobar.', 'bad');
      try {
        const x = await call('aprobar', { id, celula, usuario, clave });
        A.filtros.estado = 'aprobado'; await recargar();
        if (clave) mostrarAcceso(a.nombre, x.usuario, clave, celula); else toast(a.nombre.split(' ')[0] + ' ya es aspirante (usa su contraseña anterior).');
      } catch (e) { manejar(e); }
    });
    if ($('#d-chat')) $('#d-chat').addEventListener('click', () => { cerrar(); abrir('assessment', id); });
    if ($('#d-desc')) $('#d-desc').addEventListener('click', async () => {
      if (!await confirmar({ titulo: '¿Descartar a ' + a.nombre + '?', texto: 'No podrá entrar a la formación. Puedes devolverlo a «Por revisar» después.', ok: 'Descartar', peligro: true })) return;
      try { await call('cambiarEstado', { id, estado: 'descartado' }); toast('Postulación descartada'); cerrar(); tabAspirantes(); } catch (e) { manejar(e); }
    });
    if ($('#d-rev')) $('#d-rev').addEventListener('click', async () => {
      if (r.estado === 'aprobado' && !await confirmar({ titulo: '¿Quitarle el acceso?', texto: 'Ya no podrá entrar a la formación. Su progreso se conserva por si lo vuelves a aprobar.', ok: 'Quitar acceso', peligro: true })) return;
      try { await call('cambiarEstado', { id, estado: 'postulado' }); toast('Volvió a «Por revisar»'); A.filtros.estado = 'postulado'; recargar(); } catch (e) { manejar(e); }
    });
    if ($('#d-save')) $('#d-save').addEventListener('click', async () => {
      const celula = $('#d-cel').value, usuario = $('#d-usr').value.trim(), clave = $('#d-pass').value;
      try {
        const x = await call('guardarAcceso', { id, celula, usuario, clave });
        await recargar();
        if (clave) mostrarAcceso(a.nombre, x.usuario, clave, celula); else toast('Cambios guardados');
      } catch (e) { manejar(e); }
    });
    w.querySelectorAll('[data-reset]').forEach(b => b.addEventListener('click', async () => {
      try { await call('reiniciarIntentos', { id, moduloId: b.dataset.reset }); toast('Intentos reiniciados'); recargar(); } catch (e) { manejar(e); }
    }));
    if ($('#d-del')) $('#d-del').addEventListener('click', async () => {
      if (!await confirmar({ titulo: '¿Eliminar a ' + a.nombre + '?', texto: 'Se borra su postulación, test y progreso. Podrá postularse de nuevo con la misma cédula.', ok: 'Eliminar', peligro: true })) return;
      try { await call('eliminarAspirante', { id }); cerrar(); toast('Registro eliminado'); tabAspirantes(); } catch (e) { manejar(e); }
    });
  }

  /* ============ Formulario de postulación ============
     Secciones (una página cada una para el aspirante) con sus preguntas.
     Cada opción puede: sumar puntos a células, ser la correcta (cuenta en la nota de casos)
     o tener un filtro (marcar alerta / descartar automáticamente). */
  const FILTRO_NOMBRE = { '': 'Sin filtro', alerta: 'Marcar alerta', descarta: 'Descartar automáticamente' };
  async function tabTest() {
    let r;
    try { r = await call('preguntas'); } catch (e) { return manejar(e); }
    if (A.tab !== 'test') return;   // el usuario ya cambió de sección
    A.preguntas = r.preguntas; A.secciones = r.secciones;
    const activas = r.preguntas.filter(p => p.activa !== false).length;
    main.innerHTML = encabezado('Formulario de postulación', activas + ' preguntas activas en ' + r.secciones.length + ' secciones. Cada sección es una página para el aspirante.',
      '<button class="btn btn-secondary" id="imp">Importar</button><button class="btn btn-secondary" id="exp">' + icon('download') + 'Exportar</button>' +
      '<button class="btn btn-secondary" id="sim">Probar célula</button><button class="btn btn-primary" id="nsec">' + icon('plus') + 'Nueva sección</button>') +
      '<div class="info-grid small">' +
      '<div class="card card-tight stack-sm"><span class="pill pill-brand">Célula</span><span class="muted">Las opciones con puntos suman a una célula. Gana la que llegue a <b>' + A.reglas.minPuntos + '</b> y le saque <b>' + A.reglas.margenEmpate + '</b> a la segunda (Ajustes).</span></div>' +
      '<div class="card card-tight stack-sm"><span class="pill pill-ok">Nota de casos</span><span class="muted">Las preguntas con una respuesta <b>correcta</b> marcada cuentan para la nota que ves en cada postulación.</span></div>' +
      '<div class="card card-tight stack-sm"><span class="pill pill-bad">Filtros</span><span class="muted">Una opción puede <b>marcar alerta</b> o <b>descartar automáticamente</b>. El aspirante nunca lo ve.</span></div></div>' +
      '<div class="stack" id="secs"></div>';
    const cont = main.querySelector('#secs');
    r.secciones.forEach((sec, si) => cont.appendChild(bloqueSeccion(sec, si)));
    if (!r.secciones.length) cont.innerHTML = '<div class="card empty">' + icon('list') + '<p>El formulario está vacío. Usa <b>Importar</b> para cargar un archivo de preguntas, o crea la primera sección.</p></div>';
    main.querySelector('#imp').addEventListener('click', modalImportar);
    main.querySelector('#exp').addEventListener('click', async () => {
      try {
        const { archivo } = await call('exportarFormulario');
        const blob = new Blob([JSON.stringify(archivo, null, 1)], { type: 'application/json' });
        const el = document.createElement('a'); el.href = URL.createObjectURL(blob); el.download = 'formulario-ridery-academy-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(el); el.click(); el.remove(); setTimeout(() => URL.revokeObjectURL(el.href), 2000);
        toast('Formulario exportado');
      } catch (e) { manejar(e); }
    });
    main.querySelector('#nsec').addEventListener('click', () => modalSeccion(null));
    main.querySelector('#sim').addEventListener('click', () => simulador(A.preguntas.filter(p => p.activa !== false && (p.opciones || []).some(o => Object.keys(o.puntos || {}).length))));
  }
  function bloqueSeccion(sec, si) {
    const card = document.createElement('div'); card.className = 'card stack';
    const preguntas = A.preguntas.filter(p => p.seccion === sec.id);
    card.innerHTML = '<div class="row-between"><div class="stack-sm" style="gap:2px"><span class="eyebrow">Página ' + (si + 2) + '</span><h2>' + esc(sec.titulo) + '</h2>' + (sec.descripcion ? '<span class="small muted">' + esc(sec.descripcion) + '</span>' : '') + '</div>' +
      '<div class="row"><button class="icon-btn" data-smv="-1" aria-label="Subir sección"' + (si === 0 ? ' disabled' : '') + '>' + icon('up') + '</button><button class="icon-btn" data-smv="1" aria-label="Bajar sección"' + (si === A.secciones.length - 1 ? ' disabled' : '') + '>' + icon('down') + '</button>' +
      '<button class="btn btn-secondary btn-sm" data-sed>' + icon('edit') + 'Editar</button></div></div><div class="stack-sm" data-lista></div>' +
      '<div><button class="btn btn-ghost btn-sm" data-nq>' + icon('plus') + 'Nueva pregunta en esta sección</button></div>';
    const lista = card.querySelector('[data-lista]');
    if (!preguntas.length) lista.innerHTML = '<p class="small muted">Sin preguntas. Esta sección no se le muestra al aspirante hasta que tenga al menos una activa.</p>';
    preguntas.forEach((p, i) => lista.appendChild(bloquePregunta(p, i, preguntas)));
    card.querySelector('[data-sed]').addEventListener('click', () => modalSeccion(sec));
    card.querySelectorAll('[data-smv]').forEach(b => b.addEventListener('click', async () => {
      const lst = A.secciones.slice(), j = si + Number(b.dataset.smv); [lst[si], lst[j]] = [lst[j], lst[si]];
      try { await call('guardarSecciones', { secciones: lst }); tabTest(); } catch (e) { manejar(e); }
    }));
    card.querySelector('[data-nq]').addEventListener('click', () => {
      const p = { seccion: sec.id, tipo: 'unica', texto: '', ayuda: '', activa: true, obligatoria: true, opciones: [{ texto: '', puntos: {} }, { texto: '', puntos: {} }] };
      const vacio = lista.querySelector('p.muted'); if (vacio) vacio.remove();
      const blk = bloquePregunta(p, preguntas.length, preguntas.concat(p), true);
      lista.appendChild(blk); blk.querySelector('textarea').focus();
    });
    return card;
  }
  // Importar un archivo .json de formulario (el mismo formato que descarga «Exportar»)
  function modalImportar() {
    let archivo = null;
    const w = document.createElement('div'); w.className = 'modal-wrap';
    w.innerHTML = '<form class="modal" role="dialog" aria-modal="true" novalidate><h2>Importar preguntas</h2>' +
      '<p class="small muted">Carga un archivo <b>.json</b> de formulario de Ridery Academy (el mismo que descarga «Exportar»). Las preguntas quedan guardadas en la base de datos.</p>' +
      '<div class="form-error" role="alert" hidden></div>' +
      '<div class="field"><label for="im-f">Archivo</label><input class="input" id="im-f" type="file" accept=".json,application/json"></div>' +
      '<div id="im-res" class="small" hidden></div>' +
      '<div class="stack-sm"><label class="switch"><input type="radio" name="im-m" value="agregar" checked><span><b>Agregar</b> · suma lo del archivo y actualiza lo que ya exista. No borra nada.</span></label>' +
      '<label class="switch"><input type="radio" name="im-m" value="reemplazar"><span><b>Reemplazar todo</b> · borra todas las preguntas actuales y deja solo las del archivo.</span></label></div>' +
      '<div class="modal-actions"><button type="button" class="btn btn-secondary" data-x>Cancelar</button><button class="btn btn-primary" type="submit" disabled>Importar</button></div></form>';
    w.addEventListener('click', e => { if (e.target === w || e.target.closest('[data-x]')) w.remove(); });
    document.body.appendChild(w);
    const f = w.querySelector('form'), er = f.querySelector('.form-error'), res = f.querySelector('#im-res'), ok = f.querySelector('[type="submit"]');
    f.querySelector('#im-f').addEventListener('change', e => {
      const file = e.target.files[0]; archivo = null; ok.disabled = true; er.hidden = true; res.hidden = true;
      if (!file) return;
      if (file.size > 3 * 1024 * 1024) { er.hidden = false; er.textContent = 'El archivo pesa más de 3 MB.'; return; }
      const lector = new FileReader();
      lector.onload = () => {
        try { archivo = JSON.parse(lector.result); } catch (x) { er.hidden = false; er.textContent = 'El archivo no es un JSON válido.'; return; }
        if (!archivo || archivo.formato !== H.FORMATO_ARCHIVO) { archivo = null; er.hidden = false; er.textContent = 'Este archivo no es un formulario de Ridery Academy.'; return; }
        const ps = archivo.preguntas || [], ss = archivo.secciones || [];
        res.hidden = false;
        res.innerHTML = '<div class="notice info">' + ss.length + ' secciones · ' + ps.length + ' preguntas · ' + ps.filter(p => (p.opciones || []).some(o => o.correcta)).length + ' con respuesta correcta</div>' +
          '<div class="chips">' + ss.map(x => '<span class="chip">' + esc(x.titulo) + ' · ' + ps.filter(p => p.seccion === x.id).length + '</span>').join('') + '</div>';
        ok.disabled = false;
      };
      lector.readAsText(file);
    });
    f.addEventListener('submit', async e => {
      e.preventDefault();
      if (!archivo) return;
      const modo = f.querySelector('[name="im-m"]:checked').value;
      if (modo === 'reemplazar' && !await confirmar({ titulo: '¿Reemplazar todo el formulario?', texto: 'Se borran todas las preguntas actuales. Las postulaciones ya enviadas conservan sus respuestas.', ok: 'Reemplazar', peligro: true })) return;
      ok.disabled = true; ok.textContent = 'Importando…';
      try {
        const r = await call('importarFormulario', { archivo, modo });
        w.remove(); toast('Listo: ' + r.preguntas + ' preguntas en ' + r.secciones + ' secciones'); tabTest();
      } catch (x) { er.hidden = false; er.textContent = x.message; ok.disabled = false; ok.textContent = 'Importar'; }
    });
  }
  function modalSeccion(sec) {
    const nueva = !sec; sec = sec || { id: '', titulo: '', descripcion: '' };
    const w = document.createElement('div'); w.className = 'modal-wrap';
    w.innerHTML = '<form class="modal" role="dialog" aria-modal="true" novalidate><h2>' + (nueva ? 'Nueva sección' : 'Editar sección') + '</h2><div class="form-error" role="alert" hidden></div>' +
      '<div class="field"><label for="sc-t">Título</label><input class="input" id="sc-t" value="' + esc(sec.titulo) + '" placeholder="Ej. Conocimientos de pagos"></div>' +
      '<div class="field"><label for="sc-d">Descripción para el aspirante</label><textarea class="textarea" id="sc-d" style="min-height:80px">' + esc(sec.descripcion) + '</textarea></div>' +
      '<div class="modal-actions" style="justify-content:space-between">' + (nueva ? '<span></span>' : '<button type="button" class="btn btn-danger btn-sm" id="sc-del">' + icon('trash') + 'Eliminar sección</button>') +
      '<div class="row"><button type="button" class="btn btn-secondary" data-x>Cancelar</button><button class="btn btn-primary" type="submit">Guardar</button></div></div></form>';
    w.addEventListener('click', e => { if (e.target === w || e.target.closest('[data-x]')) w.remove(); });
    document.body.appendChild(w);
    const f = w.querySelector('form'), er = f.querySelector('.form-error');
    f.querySelector('#sc-t').focus();
    const guardar = async lista => {
      try { await call('guardarSecciones', { secciones: lista }); w.remove(); toast('Sección guardada'); tabTest(); }
      catch (x) { er.hidden = false; er.textContent = x.message; }
    };
    f.addEventListener('submit', e => {
      e.preventDefault();
      const datos = { titulo: f.querySelector('#sc-t').value, descripcion: f.querySelector('#sc-d').value };
      const id = nueva ? datos.titulo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) + '-' + Date.now().toString(36).slice(-3) : sec.id;
      guardar(nueva ? A.secciones.concat(Object.assign({ id }, datos)) : A.secciones.map(x => x.id === sec.id ? Object.assign({}, x, datos) : x));
    });
    const del = f.querySelector('#sc-del');
    if (del) del.addEventListener('click', async () => {
      if (!await confirmar({ titulo: '¿Eliminar «' + sec.titulo + '»?', texto: 'Solo se puede si ya no tiene preguntas.', ok: 'Eliminar', peligro: true })) return;
      guardar(A.secciones.filter(x => x.id !== sec.id));
    });
  }
  function bloquePregunta(p, i, hermanas, abierto) {
    const d = document.createElement('details'); d.className = 'editor-block'; if (abierto) d.open = true;
    const estado = JSON.parse(JSON.stringify(p));
    estado.tipo = estado.tipo || 'unica'; estado.opciones = estado.opciones || [];
    const total = hermanas.length;
    const conOpciones = () => estado.tipo === 'unica' || estado.tipo === 'multiple';
    const etiquetas = () => {
      const ops = estado.opciones || [], out = ['<span class="pill">' + esc(H.TIPOS[estado.tipo]) + '</span>'];
      if (ops.some(o => o.correcta)) out.push('<span class="pill pill-ok">Evaluada</span>');
      if (ops.some(o => Object.keys(o.puntos || {}).length)) out.push('<span class="pill pill-brand">Célula</span>');
      if (ops.some(o => o.filtro)) out.push('<span class="pill pill-bad">Filtro</span>');
      if (estado.activa === false) out.push('<span class="pill">Inactiva</span>');
      return out.join('');
    };
    const resumen = () => '<summary><span class="status-dot"><span class="small num" style="font-weight:700">' + (i + 1) + '</span></span><span class="grow">' + esc(estado.texto || 'Pregunta nueva') + '</span>' + etiquetas() +
      (p._id ? '<button class="icon-btn" data-mv="-1" aria-label="Subir"' + (i === 0 ? ' disabled' : '') + '>' + icon('up') + '</button><button class="icon-btn" data-mv="1" aria-label="Bajar"' + (i >= total - 1 ? ' disabled' : '') + '>' + icon('down') + '</button>' : '') + '</summary>';
    const filaOpcion = (o, j) => {
      const unica = estado.tipo === 'unica', multi = estado.tipo === 'multiple';
      return '<div class="opt-row" data-o="' + j + '"><span class="key">' + String.fromCharCode(65 + j) + '</span><div class="stack-sm"><input class="input" data-ot value="' + esc(o.texto) + '" placeholder="Texto de la opción">' +
        '<div class="row" style="gap:14px">' +
        (unica ? '<label class="switch small"><input type="radio" name="ok-' + esc(estado._id || 'nueva') + '-' + i + '" data-ok' + (o.correcta ? ' checked' : '') + '>Respuesta correcta</label>' : '') +
        (multi ? '<label class="switch small"><input type="checkbox" data-ex' + (o.exclusiva ? ' checked' : '') + '>Desmarca las demás</label>' : '') +
        '<label class="small row" style="gap:6px">Filtro <select class="select" data-fi style="width:auto;min-height:34px;padding:4px 8px">' + Object.entries(FILTRO_NOMBRE).map(([k, n]) => '<option value="' + k + '"' + ((o.filtro || '') === k ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label></div>' +
        '<div class="chips">' + Object.entries(o.puntos || {}).map(([c, v]) => '<span class="chip">' + esc(nombreCel(c)) + ' +' + v + '<button data-rm="' + esc(c) + '" aria-label="Quitar">' + icon('x') + '</button></span>').join('') + '</div>' +
        '<div class="add-points"><select class="select" data-pc>' + opcionesCel('') + '</select><input class="input num" type="number" min="1" max="10" value="2" data-pv aria-label="Puntos"><button class="btn btn-secondary btn-sm" data-add>' + icon('plus') + 'Sumar puntos a célula</button></div></div>' +
        '<button class="icon-btn" data-del-o aria-label="Quitar opción"' + (estado.opciones.length <= 2 ? ' disabled' : '') + '>' + icon('trash') + '</button></div>';
    };
    const pintar = () => {
      d.innerHTML = resumen() + '<div class="editor-body">' +
        '<div class="two"><div class="field"><label>Tipo</label><select class="select" data-f="tipo">' + Object.entries(H.TIPOS).map(([k, n]) => '<option value="' + k + '"' + (estado.tipo === k ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></div>' +
        '<div class="field"><label>Sección</label><select class="select" data-f="seccion">' + A.secciones.map(x => '<option value="' + esc(x.id) + '"' + (estado.seccion === x.id ? ' selected' : '') + '>' + esc(x.titulo) + '</option>').join('') + '</select></div></div>' +
        '<div class="field"><label>Pregunta</label><textarea class="textarea" style="min-height:70px" data-f="texto">' + esc(estado.texto) + '</textarea></div>' +
        '<div class="field"><label>Texto de ayuda (opcional)</label><input class="input" data-f="ayuda" value="' + esc(estado.ayuda || '') + '" placeholder="Ej. Marca todas las que apliquen."></div>' +
        (conOpciones() ? '<div class="stack-sm"><span class="label">Opciones</span>' + estado.opciones.map(filaOpcion).join('') +
          '<div class="row"><button class="btn btn-ghost btn-sm" data-add-o>' + icon('plus') + 'Agregar opción</button>' +
          (estado.tipo === 'unica' && estado.opciones.some(o => o.correcta) ? '<button class="btn btn-ghost btn-sm" data-sin-ok>Quitar respuesta correcta</button>' : '') + '</div></div>' : '') +
        '<div class="row" style="gap:18px">' +
        '<label class="switch"><input type="checkbox" data-f="obligatoria"' + (estado.obligatoria !== false ? ' checked' : '') + '>Obligatoria</label>' +
        (estado.tipo === 'multiple' ? '<label class="switch"><input type="checkbox" data-f="permiteOtro"' + (estado.permiteOtro ? ' checked' : '') + '>Permitir «Otra» con texto</label>' : '') +
        (estado.tipo === 'larga' ? '<label class="switch"><input type="checkbox" data-f="sinPegar"' + (estado.sinPegar ? ' checked' : '') + '>No permitir pegar texto</label>' : '') +
        '<label class="switch"><input type="checkbox" data-f="activa"' + (estado.activa !== false ? ' checked' : '') + '>Activa</label></div>' +
        '<div class="row" style="justify-content:flex-end">' + (p._id ? '<button class="btn btn-danger btn-sm" data-borrar>' + icon('trash') + 'Eliminar</button>' : '') + '<button class="btn btn-primary btn-sm" data-guardar>Guardar pregunta</button></div></div>';
      const $ = sel => d.querySelector(sel);
      $('[data-f="texto"]').addEventListener('input', e => { estado.texto = e.target.value; });
      $('[data-f="ayuda"]').addEventListener('input', e => { estado.ayuda = e.target.value; });
      $('[data-f="seccion"]').addEventListener('change', e => { estado.seccion = e.target.value; });
      $('[data-f="tipo"]').addEventListener('change', e => {
        estado.tipo = e.target.value;
        if (conOpciones() && estado.opciones.length < 2) estado.opciones = [{ texto: '', puntos: {} }, { texto: '', puntos: {} }];
        pintar();
      });
      ['obligatoria', 'activa', 'permiteOtro', 'sinPegar'].forEach(k => { const el = $('[data-f="' + k + '"]'); if (el) el.addEventListener('change', () => { estado[k] = el.checked; }); });
      d.querySelectorAll('.opt-row').forEach(row => {
        const o = estado.opciones[Number(row.dataset.o)];
        row.querySelector('[data-ot]').addEventListener('input', e => { o.texto = e.target.value; });
        const okR = row.querySelector('[data-ok]'); if (okR) okR.addEventListener('change', () => { estado.opciones.forEach(x => { delete x.correcta; }); o.correcta = true; pintar(); });
        const ex = row.querySelector('[data-ex]'); if (ex) ex.addEventListener('change', () => { o.exclusiva = ex.checked; });
        row.querySelector('[data-fi]').addEventListener('change', e => { if (e.target.value) o.filtro = e.target.value; else delete o.filtro; pintar(); });
        row.querySelector('[data-add]').addEventListener('click', () => { const c = row.querySelector('[data-pc]').value, v = Number(row.querySelector('[data-pv]').value) || 0; if (!v) return; o.puntos = o.puntos || {}; o.puntos[c] = v; pintar(); });
        row.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', () => { delete o.puntos[b.dataset.rm]; pintar(); }));
        row.querySelector('[data-del-o]').addEventListener('click', () => { estado.opciones.splice(Number(row.dataset.o), 1); pintar(); });
      });
      const addO = $('[data-add-o]'); if (addO) addO.addEventListener('click', () => { estado.opciones.push({ texto: '', puntos: {} }); pintar(); });
      const sinOk = $('[data-sin-ok]'); if (sinOk) sinOk.addEventListener('click', () => { estado.opciones.forEach(x => { delete x.correcta; }); pintar(); });
      $('[data-guardar]').addEventListener('click', async () => {
        try { await call('guardarPregunta', { pregunta: estado }); toast('Pregunta guardada'); tabTest(); } catch (e) { manejar(e); }
      });
      const bo = $('[data-borrar]');
      if (bo) bo.addEventListener('click', async () => {
        if (!await confirmar({ titulo: '¿Eliminar esta pregunta?', texto: 'Las postulaciones ya enviadas conservan sus respuestas.', ok: 'Eliminar', peligro: true })) return;
        try { await call('eliminarPregunta', { id: p._id }); toast('Pregunta eliminada'); tabTest(); } catch (e) { manejar(e); }
      });
      d.querySelectorAll('[data-mv]').forEach(b => b.addEventListener('click', async e => {
        e.preventDefault(); e.stopPropagation();
        const ids = hermanas.filter(x => x._id).map(x => x._id), j = i + Number(b.dataset.mv);
        [ids[i], ids[j]] = [ids[j], ids[i]];
        try { await call('ordenarPreguntas', { ids }); tabTest(); } catch (er) { manejar(er); }
      }));
    };
    pintar();
    return d;
  }
  // Simula solo la parte que sugiere la célula (preguntas con puntos)
  function simulador(preguntas) {
    const resp = {};
    const w = document.createElement('div'); w.className = 'modal-wrap';
    const pintar = () => {
      const r = H.calcularCelula(preguntas, resp, A.reglas);
      const max = Math.max(1, ...r.ranking.map(x => x[1]));
      w.innerHTML = '<div class="modal wide" role="dialog" aria-modal="true"><div class="row-between"><h2>Probar célula</h2><button class="icon-btn" data-x aria-label="Cerrar">' + icon('x') + '</button></div>' +
        '<p class="small muted">Responde las preguntas que suman puntos y mira qué célula le tocaría a un aspirante. No se guarda nada.</p>' +
        (preguntas.length ? '' : '<div class="notice">Ninguna pregunta activa suma puntos a una célula todavía.</div>') +
        preguntas.map((p, i) => '<div class="stack-sm"><b>' + (i + 1) + '. ' + esc(p.texto) + '</b>' + (p.tipo === 'multiple'
          ? '<div class="row">' + p.opciones.map((o, j) => '<label class="switch small"><input type="checkbox" data-m="' + esc(p._id) + '" value="' + j + '"' + ((resp[p._id] || []).includes(j) ? ' checked' : '') + '>' + esc(o.texto) + '</label>').join('') + '</div>'
          : '<select class="select" data-q="' + esc(p._id) + '"><option value="">Elige una opción</option>' + p.opciones.map((o, j) => '<option value="' + j + '"' + (resp[p._id] === j ? ' selected' : '') + '>' + String.fromCharCode(65 + j) + '. ' + esc(o.texto) + '</option>').join('') + '</select>') + '</div>').join('') +
        '<hr class="divider"><div class="stack-sm"><h3>Resultado</h3>' + (r.ranking.length ? r.ranking.map(([c, v]) => '<div class="hbar"><span>' + esc(nombreCel(c)) + '</span><div class="bar"><span style="width:' + Math.round(v * 100 / max) + '%"></span></div><span class="num small">' + v + '</span></div>').join('') : '<p class="small muted">Elige opciones para ver los puntos.</p>') +
        (r.ranking.length ? (r.celula ? '<div class="feedback ok">' + icon('check') + '<span class="body">Se sugeriría <b>' + esc(nombreCel(r.celula)) + '</b>.</span></div>' : '<div class="notice">Quedaría en revisión: ' + esc(r.motivo) + '.</div>') : '') + '</div></div>';
      const y = () => w.querySelector('.modal').scrollTop;
      w.querySelectorAll('[data-q]').forEach(s => s.addEventListener('change', () => { const t = y(); if (s.value === '') delete resp[s.dataset.q]; else resp[s.dataset.q] = Number(s.value); pintar(); w.querySelector('.modal').scrollTop = t; }));
      w.querySelectorAll('[data-m]').forEach(c => c.addEventListener('change', () => { const t = y(); resp[c.dataset.m] = [...w.querySelectorAll('[data-m="' + CSS.escape(c.dataset.m) + '"]:checked')].map(x => Number(x.value)); pintar(); w.querySelector('.modal').scrollTop = t; }));
    };
    w.addEventListener('click', e => { if (e.target === w || e.target.closest('[data-x]')) w.remove(); });
    pintar(); document.body.appendChild(w);
  }

  /* ============ Contenido ============ */
  async function tabContenido() {
    let todos;
    try { todos = (await call('modulos', {})).modulos; } catch (e) { return manejar(e); }
    if (A.tab !== 'contenido') return;   // el usuario ya cambió de sección
    const cel = A.celContenido;
    const mods = todos.filter(m => m.celula === cel);
    const cuenta = id => todos.filter(m => m.celula === id).length;
    main.innerHTML = encabezado('Contenido', 'Cada aspirante ve el tronco común y luego solo los módulos de su célula.', '<button class="btn btn-primary" id="nuevo">' + icon('plus') + 'Nuevo módulo</button>') +
      '<div class="seg" role="tablist">' + [[H.COMUN, 'Tronco común']].concat(A.celulas.map(c => [c.id, c.nombre])).map(([id, n]) =>
        '<button role="tab" data-cel="' + esc(id) + '" class="' + (id === cel ? 'active' : '') + '" aria-selected="' + (id === cel) + '">' + esc(n) + ' <span class="num" style="opacity:.6">' + cuenta(id) + '</span></button>').join('') + '</div>' +
      '<div class="mod-list" id="mods">' + (mods.length ? mods.map((m, i) =>
        '<div class="mod-card"><span class="idx num">' + String(i + 1).padStart(2, '0') + '</span><div class="stack-sm" style="gap:2px;min-width:0"><b>' + esc(m.titulo) + '</b><span class="small muted">' + m.lecciones.length + ' lecciones · ' + m.lecciones.filter(l => l.youtube).length + ' videos · ' + ((m.examen && m.examen.preguntas.length) || 0) + ' preguntas de examen</span></div>' +
        '<div class="row" style="gap:6px"><button class="icon-btn" data-mv="-1" data-i="' + i + '" aria-label="Subir"' + (i === 0 ? ' disabled' : '') + '>' + icon('up') + '</button><button class="icon-btn" data-mv="1" data-i="' + i + '" aria-label="Bajar"' + (i === mods.length - 1 ? ' disabled' : '') + '>' + icon('down') + '</button>' +
        '<button class="btn btn-secondary btn-sm" data-edit="' + esc(m._id) + '">' + icon('edit') + 'Editar</button></div></div>').join('')
        : '<div class="card empty">' + icon('book') + '<p>' + esc(nombreCel(cel)) + ' todavía no tiene módulos.</p><button class="btn btn-primary btn-sm" id="nuevo2">' + icon('plus') + 'Crear el primero</button></div>') + '</div>' +
      (mods.length > 1 ? '<p class="small muted">Los aspirantes los ven en este orden y se desbloquean uno por uno.</p>' : '');
    main.querySelectorAll('[data-cel]').forEach(b => b.addEventListener('click', () => { A.celContenido = b.dataset.cel; tabContenido(); }));
    const nuevo = () => editorModulo({ celula: cel, titulo: '', descripcion: '', lecciones: [{ titulo: '', youtube: '', contenido: '', imagenes: [] }], examen: { preguntas: [] } });
    main.querySelector('#nuevo').addEventListener('click', nuevo);
    const n2 = main.querySelector('#nuevo2'); if (n2) n2.addEventListener('click', nuevo);
    main.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => editorModulo(mods.find(m => m._id === b.dataset.edit))));
    main.querySelectorAll('[data-mv]').forEach(b => b.addEventListener('click', async () => {
      const ids = mods.map(m => m._id), i = Number(b.dataset.i), j = i + Number(b.dataset.mv);
      [ids[i], ids[j]] = [ids[j], ids[i]];
      try { await call('ordenarModulos', { ids }); tabContenido(); } catch (e) { manejar(e); }
    }));
  }

  function editorModulo(original) {
    const m = JSON.parse(JSON.stringify(original));
    m.examen = m.examen || { preguntas: [] };
    dirty = false;
    const abiertos = { l: new Set(m._id ? [] : [0]), e: new Set() };
    const marcar = () => { dirty = true; };
    const mover = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; };

    const pintar = () => {
      main.innerHTML = '<div><button class="btn btn-ghost btn-sm" id="volver">' + icon('left') + 'Módulos de ' + esc(nombreCel(m.celula)) + '</button></div>' +
        encabezado(m._id ? 'Editar módulo' : 'Nuevo módulo', esc(nombreCel(m.celula))) +
        '<div class="card stack"><div class="field"><label for="m-t">Título del módulo</label><input class="input" id="m-t" value="' + esc(m.titulo) + '" placeholder="Ej. Pagos y reembolsos"></div>' +
        '<div class="field"><label for="m-d">Descripción corta</label><input class="input" id="m-d" value="' + esc(m.descripcion) + '" placeholder="Qué aprende el aspirante en este módulo"></div></div>' +
        '<div class="row-between"><h2>Lecciones</h2><button class="btn btn-secondary btn-sm" id="add-l">' + icon('plus') + 'Agregar lección</button></div>' +
        '<div class="stack" id="lecs">' + (m.lecciones.length ? '' : '<p class="muted small">Sin lecciones.</p>') + '</div>' +
        '<div class="row-between"><div class="stack-sm" style="gap:2px"><h2>Examen</h2><span class="small muted">Selección simple · nota mínima ' + A.reglas.notaMinima + '% · ' + A.reglas.intentosMax + ' intentos</span></div><button class="btn btn-secondary btn-sm" id="add-e">' + icon('plus') + 'Agregar pregunta</button></div>' +
        '<div class="stack" id="exs">' + (m.examen.preguntas.length ? '' : '<p class="muted small">Sin examen: el módulo se aprueba al completar todas las lecciones.</p>') + '</div>' +
        '<div class="sticky-submit"><div>' + (m._id ? '<button class="btn btn-danger" id="del-m">' + icon('trash') + 'Eliminar módulo</button>' : '') + '</div><div class="row"><button class="btn btn-secondary" id="cancel">Cancelar</button><button class="btn btn-primary" id="save">Guardar módulo</button></div></div>';

      main.querySelector('#m-t').addEventListener('input', e => { m.titulo = e.target.value; marcar(); });
      main.querySelector('#m-d').addEventListener('input', e => { m.descripcion = e.target.value; marcar(); });
      const lecs = main.querySelector('#lecs');
      m.lecciones.forEach((l, i) => lecs.appendChild(bloqueLeccion(l, i)));
      const exs = main.querySelector('#exs');
      m.examen.preguntas.forEach((p, i) => exs.appendChild(bloqueExamen(p, i)));

      main.querySelector('#add-l').addEventListener('click', () => { m.lecciones.push({ titulo: '', youtube: '', contenido: '', imagenes: [] }); abiertos.l.add(m.lecciones.length - 1); marcar(); pintar(); });
      main.querySelector('#add-e').addEventListener('click', () => { m.examen.preguntas.push({ texto: '', opciones: ['', '', '', ''], correcta: 0, explicacion: '' }); abiertos.e.add(m.examen.preguntas.length - 1); marcar(); pintar(); });
      const salir = async () => { if (dirty && !await confirmar({ titulo: '¿Salir sin guardar?', texto: 'Perderás los cambios de este módulo.', ok: 'Salir sin guardar', peligro: true })) return; dirty = false; tabContenido(); };
      main.querySelector('#volver').addEventListener('click', salir);
      main.querySelector('#cancel').addEventListener('click', salir);
      main.querySelector('#save').addEventListener('click', async () => {
        const peso = JSON.stringify(m).length;
        if (peso > 4000000) return toast('El módulo pesa ' + (peso / 1e6).toFixed(1) + ' MB con las imágenes subidas. El máximo es 4 MB: usa enlaces de Lightshot para algunas o divide el módulo.', 'bad');
        const b = main.querySelector('#save'); b.disabled = true;
        try {
          const r = await call('guardarModulo', { modulo: m });
          Object.assign(m, r.modulo); dirty = false; toast('Módulo guardado'); pintar();
        } catch (e) { manejar(e); b.disabled = false; }
      });
      const dm = main.querySelector('#del-m');
      if (dm) dm.addEventListener('click', async () => {
        if (!await confirmar({ titulo: '¿Eliminar «' + (m.titulo || 'módulo') + '»?', texto: 'Se borran sus lecciones y su examen. El progreso de los aspirantes en este módulo deja de contar.', ok: 'Eliminar', peligro: true })) return;
        try { await call('eliminarModulo', { id: m._id }); dirty = false; toast('Módulo eliminado'); tabContenido(); } catch (e) { manejar(e); }
      });
    };

    function bloqueLeccion(l, i) {
      const d = document.createElement('details'); d.className = 'editor-block'; d.open = abiertos.l.has(i);
      d.addEventListener('toggle', () => { d.open ? abiertos.l.add(i) : abiertos.l.delete(i); });
      const vid = youtubeId(l.youtube);
      d.innerHTML = '<summary><span class="status-dot"><span class="small num" style="font-weight:700">' + (i + 1) + '</span></span><span class="grow">' + esc(l.titulo || 'Lección sin título') + '</span>' +
        (vid ? '<span class="pill">' + icon('play') + 'Video</span>' : '') + (l.imagenes.length ? '<span class="pill">' + icon('img') + l.imagenes.length + '</span>' : '') +
        '<button class="icon-btn" data-mv="-1" aria-label="Subir"' + (i === 0 ? ' disabled' : '') + '>' + icon('up') + '</button><button class="icon-btn" data-mv="1" aria-label="Bajar"' + (i === m.lecciones.length - 1 ? ' disabled' : '') + '>' + icon('down') + '</button></summary>' +
        '<div class="editor-body"><div class="field"><label>Título</label><input class="input" data-f="titulo" value="' + esc(l.titulo) + '"></div>' +
        '<div class="field"><label>Enlace de YouTube</label><input class="input" data-f="youtube" value="' + esc(l.youtube) + '" placeholder="https://www.youtube.com/watch?v=…">' +
        '<span class="hint" data-yt>' + ytHint(l.youtube) + '</span></div>' +
        '<div class="field"><label>Texto de la lección</label><textarea class="textarea" data-f="contenido">' + esc(l.contenido) + '</textarea><span class="hint">Deja una línea en blanco para separar párrafos. Empieza una línea con «- » para hacer una lista.</span></div>' +
        '<div class="field"><span class="label">Imágenes</span><div class="img-list">' + l.imagenes.map((u, j) => {
          const t = tipoImagen(u);
          return '<div class="img-row"><span class="prev">' + (t === 'directa' ? '<img src="' + esc(u) + '" alt="">' : icon('ext')) + '</span><div class="stack-sm" style="gap:2px;min-width:0"><span class="url">' + esc(u.startsWith('data:') ? 'Imagen cargada (' + Math.round(u.length / 1365) + ' KB)' : u) + '</span>' +
            (t === 'lightshot-pagina' ? '<span class="small" style="color:var(--warn)">Enlace de página: se mostrará como botón, no como imagen.</span>' : '') + '</div>' +
            '<div class="row" style="gap:4px;flex-wrap:nowrap"><button class="icon-btn" data-im="-1" data-j="' + j + '" aria-label="Subir"' + (j === 0 ? ' disabled' : '') + '>' + icon('up') + '</button><button class="icon-btn" data-im="1" data-j="' + j + '" aria-label="Bajar"' + (j === l.imagenes.length - 1 ? ' disabled' : '') + '>' + icon('down') + '</button><button class="icon-btn" data-ir="' + j + '" aria-label="Quitar">' + icon('trash') + '</button></div></div>';
        }).join('') + '</div>' +
        '<div class="row" style="flex-wrap:nowrap"><input class="input" data-new-img placeholder="Pega el enlace de la imagen (Lightshot, Imgur…)"><button class="btn btn-secondary" data-add-img>Agregar</button></div>' +
        '<div class="row"><label class="btn btn-ghost btn-sm" style="cursor:pointer">' + icon('img') + 'Subir desde mi equipo<input type="file" accept="image/*" multiple data-file hidden></label><span class="hint">Se comprime automáticamente (máx. 1280 px).</span></div>' +
        '<span class="hint">Con Lightshot: abre tu enlace prnt.sc, haz clic derecho sobre la imagen → «Copiar dirección de la imagen» y pega ese enlace (empieza con https://image.prntscr.com/…). Así se ve dentro de la lección.</span></div>' +
        '<div class="row" style="justify-content:flex-end"><button class="btn btn-danger btn-sm" data-del-l>' + icon('trash') + 'Quitar lección</button></div></div>';
      d.querySelectorAll('[data-f]').forEach(inp => inp.addEventListener('input', () => {
        l[inp.dataset.f] = inp.value; marcar();
        if (inp.dataset.f === 'youtube') d.querySelector('[data-yt]').innerHTML = ytHint(inp.value);
        if (inp.dataset.f === 'titulo') d.querySelector('summary .grow').textContent = inp.value || 'Lección sin título';
      }));
      d.querySelectorAll('[data-mv]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); mover(m.lecciones, i, Number(b.dataset.mv)); abiertos.l.clear(); marcar(); pintar(); }));
      d.querySelectorAll('[data-im]').forEach(b => b.addEventListener('click', () => { mover(l.imagenes, Number(b.dataset.j), Number(b.dataset.im)); marcar(); pintar(); }));
      d.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => { l.imagenes.splice(Number(b.dataset.ir), 1); marcar(); pintar(); }));
      const agregar = () => {
        const inp = d.querySelector('[data-new-img]'), u = inp.value.trim();
        if (!u) return;
        const t = tipoImagen(u);
        if (t === 'invalida') return toast('Ese enlace no es válido. Debe empezar con https://', 'bad');
        l.imagenes.push(u); marcar(); pintar();
        if (t === 'lightshot-pagina') toast('Agregado como enlace. Para verla dentro de la lección usa la dirección directa de la imagen.');
      };
      d.querySelector('[data-add-img]').addEventListener('click', agregar);
      d.querySelector('[data-file]').addEventListener('change', async e => {
        const files = [...e.target.files];
        for (const f of files) { try { l.imagenes.push(await comprimir(f)); } catch (x) { toast('No se pudo leer ' + f.name, 'bad'); } }
        if (files.length) { marcar(); pintar(); }
      });
      d.querySelector('[data-new-img]').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); agregar(); } });
      d.querySelector('[data-del-l]').addEventListener('click', async () => {
        if (!await confirmar({ titulo: '¿Quitar esta lección?', texto: 'Se aplica cuando guardes el módulo.', ok: 'Quitar', peligro: true })) return;
        m.lecciones.splice(i, 1); abiertos.l.clear(); marcar(); pintar();
      });
      return d;
    }
    function comprimir(file) {
      return new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onerror = rej;
        fr.onload = () => {
          const img = new Image();
          img.onerror = rej;
          img.onload = () => {
            const k = Math.min(1, 1280 / Math.max(img.width, img.height));
            const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
            const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
            res(c.toDataURL('image/jpeg', 0.82));
          };
          img.src = fr.result;
        };
        fr.readAsDataURL(file);
      });
    }
    function ytHint(u) {
      if (!u) return 'Opcional. Puede ser un video no listado.';
      const id = youtubeId(u);
      return id ? '<span style="color:var(--ok)">✓ Video detectado (' + esc(id) + '). El aspirante debe ver el ' + A.reglas.porcentajeVideo + '% para continuar.</span>' : '<span style="color:var(--bad)">No reconozco ese enlace. Copia la URL del video desde YouTube.</span>';
    }
    function bloqueExamen(p, i) {
      const d = document.createElement('details'); d.className = 'editor-block'; d.open = abiertos.e.has(i);
      d.addEventListener('toggle', () => { d.open ? abiertos.e.add(i) : abiertos.e.delete(i); });
      d.innerHTML = '<summary><span class="status-dot"><span class="small num" style="font-weight:700">' + (i + 1) + '</span></span><span class="grow">' + esc(p.texto || 'Pregunta nueva') + '</span>' +
        '<button class="icon-btn" data-mv="-1" aria-label="Subir"' + (i === 0 ? ' disabled' : '') + '>' + icon('up') + '</button><button class="icon-btn" data-mv="1" aria-label="Bajar"' + (i === m.examen.preguntas.length - 1 ? ' disabled' : '') + '>' + icon('down') + '</button></summary>' +
        '<div class="editor-body"><div class="field"><label>Pregunta</label><textarea class="textarea" style="min-height:64px" data-f="texto">' + esc(p.texto) + '</textarea></div>' +
        '<div class="stack-sm"><span class="label">Opciones · marca la correcta</span>' + p.opciones.map((o, j) =>
          '<div class="row" style="flex-wrap:nowrap"><label class="switch" title="Respuesta correcta"><input type="radio" name="ok-' + i + '" data-ok="' + j + '"' + (Number(p.correcta) === j ? ' checked' : '') + '><span class="key" style="font-weight:700">' + String.fromCharCode(65 + j) + '</span></label>' +
          '<input class="input" data-op="' + j + '" value="' + esc(o) + '" placeholder="Opción ' + String.fromCharCode(65 + j) + '"><button class="icon-btn" data-del-op="' + j + '" aria-label="Quitar opción"' + (p.opciones.length <= 2 ? ' disabled' : '') + '>' + icon('trash') + '</button></div>').join('') +
        '<div><button class="btn btn-ghost btn-sm" data-add-op>' + icon('plus') + 'Agregar opción</button></div></div>' +
        '<div class="field"><label>Explicación</label><input class="input" data-f="explicacion" value="' + esc(p.explicacion) + '" placeholder="Por qué esa es la respuesta correcta"><span class="hint">Se muestra al aprobar o al terminar los intentos.</span></div>' +
        '<div class="row" style="justify-content:flex-end"><button class="btn btn-danger btn-sm" data-del-p>' + icon('trash') + 'Quitar pregunta</button></div></div>';
      d.querySelectorAll('[data-f]').forEach(inp => inp.addEventListener('input', () => { p[inp.dataset.f] = inp.value; marcar(); if (inp.dataset.f === 'texto') d.querySelector('summary .grow').textContent = inp.value || 'Pregunta nueva'; }));
      d.querySelectorAll('[data-op]').forEach(inp => inp.addEventListener('input', () => { p.opciones[Number(inp.dataset.op)] = inp.value; marcar(); }));
      d.querySelectorAll('[data-ok]').forEach(r => r.addEventListener('change', () => { p.correcta = Number(r.dataset.ok); marcar(); }));
      d.querySelectorAll('[data-del-op]').forEach(b => b.addEventListener('click', () => {
        const j = Number(b.dataset.delOp); p.opciones.splice(j, 1);
        if (p.correcta === j) p.correcta = 0; else if (p.correcta > j) p.correcta--;
        marcar(); pintar();
      }));
      d.querySelector('[data-add-op]').addEventListener('click', () => { p.opciones.push(''); marcar(); pintar(); });
      d.querySelectorAll('[data-mv]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); mover(m.examen.preguntas, i, Number(b.dataset.mv)); abiertos.e.clear(); marcar(); pintar(); }));
      d.querySelector('[data-del-p]').addEventListener('click', () => { m.examen.preguntas.splice(i, 1); abiertos.e.clear(); marcar(); pintar(); });
      return d;
    }
    pintar();
    window.scrollTo(0, 0);
  }

  /* ============ Métricas ============ */
  async function tabMetricas() {
    let r;
    try { r = await call('metricas'); } catch (e) { return manejar(e); }
    if (A.tab !== 'metricas') return;   // el usuario ya cambió de sección
    const filas = Object.entries(r.porCelula).map(([k, v]) => [k === 'REVISION' ? 'Sin célula sugerida' : nombreCel(k), v]).sort((a, b) => b[1] - a[1]);
    const max = Math.max(1, ...filas.map(f => f[1]));
    main.innerHTML = encabezado('Métricas') +
      '<div class="kpis"><div class="stat"><span class="small muted">Postulaciones</span><b>' + r.total + '</b></div><div class="stat"><span class="small muted">Por revisar</span><b style="color:' + (r.porRevisar ? 'var(--warn)' : 'inherit') + '">' + r.porRevisar + '</b></div>' +
      '<div class="stat"><span class="small muted">Aspirantes aprobados</span><b>' + r.aprobados + '</b></div><div class="stat"><span class="small muted">Completaron la formación</span><b style="color:var(--ok)">' + r.completados + '</b></div></div>' +
      '<div class="card stack"><h2>Postulaciones por célula</h2><p class="small muted">Célula sugerida por el test o asignada al aprobar.</p>' + (filas.length ? filas.map(([n, v]) => '<div class="hbar"><span>' + esc(n) + '</span><div class="bar"><span style="width:' + Math.round(v * 100 / max) + '%"></span></div><span class="num small">' + v + '</span></div>').join('') : '<p class="muted small">Sin datos todavía.</p>') + '</div>' +
      '<div class="stack-sm"><h2>Exámenes por módulo</h2>' + (r.porModulo.length ? '<div class="table-wrap"><table><thead><tr><th>Módulo</th><th>Célula</th><th>Personas</th><th>Aprobaron</th><th>Intentos</th><th>Nota promedio</th></tr></thead><tbody>' +
        r.porModulo.map(m => '<tr><td><b>' + esc(m.titulo) + '</b></td><td>' + esc(nombreCel(m.celula)) + '</td><td class="num">' + m.personas + '</td><td class="num">' + m.aprobaron + ' <span class="muted small">(' + Math.round(m.aprobaron * 100 / Math.max(1, m.personas)) + '%)</span></td><td class="num">' + m.intentos + '</td><td class="num">' + (m.promedio != null ? m.promedio + '%' : '—') + '</td></tr>').join('') + '</tbody></table></div>' : '<div class="card empty"><p>Aún nadie presentó exámenes.</p></div>') + '</div>' +
      '<div class="stack-sm"><h2>Preguntas que más se fallan</h2><p class="small muted">Si una pregunta tiene una tasa de error muy alta, revisa si la lección la explica bien o si la pregunta es confusa.</p>' + (r.masFalladas.length ? '<div class="table-wrap"><table><thead><tr><th>Pregunta</th><th>Módulo</th><th>Respuestas</th><th>% de error</th></tr></thead><tbody>' +
        r.masFalladas.map(f => '<tr><td>' + esc(f.texto) + '</td><td class="small">' + esc(f.moduloTitulo) + '</td><td class="num">' + f.total + '</td><td><span class="pill ' + (f.tasa >= 50 ? 'pill-bad' : f.tasa >= 25 ? 'pill-warn' : '') + ' num">' + f.tasa + '%</span></td></tr>').join('') + '</tbody></table></div>' : '<div class="card empty"><p>Sin errores registrados todavía.</p></div>') + '</div>';
  }

  /* ============ Assessment (chat con aspirantes) ============ */
  async function tabAssessment(abrirId) {
    let lista = [], actual = abrirId || A.chatActual || null, q = '', pararHilo = null, vivo = true, t = null;
    main.innerHTML = encabezado('Assessment', 'Conversa con los aspirantes en tiempo real: dudas, seguimiento y evaluaciones.') +
      '<section class="card inbox" id="inbox"><aside class="inbox-side"><input class="input" id="ib-q" placeholder="Buscar aspirante" aria-label="Buscar aspirante"><div class="inbox-list" id="ib-list"></div></aside>' +
      '<div class="inbox-main" id="ib-main"><div class="inbox-vacio">' + icon('chat') + '<p>Elige un aspirante de la lista para ver o empezar la conversación.</p></div></div></section>';
    const box = main.querySelector('#inbox'), ul = main.querySelector('#ib-list'), panel = main.querySelector('#ib-main');
    const hace = iso => { if (!iso) return ''; const d = new Date(iso), h = new Date(); return d.toDateString() === h.toDateString() ? d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' }); };
    const pintarLista = () => {
      const f = lista.filter(c => !q || c.nombre.toLowerCase().includes(q) || (c.usuario || '').includes(q));
      const borrar = puede('admin', 'reclutador');
      ul.innerHTML = f.length ? f.map(c => '<div class="inbox-item' + (c.id === actual ? ' active' : '') + '" data-id="' + esc(c.id) + '" role="button" tabindex="0"><span class="avatar">' + esc(iniciales(c.nombre)) + '</span>' +
        '<span style="min-width:0"><b>' + esc(c.nombre) + '</b><span class="prev">' + (c.ultimoTexto ? (c.ultimoDe === 'equipo' ? 'Tú: ' : '') + esc(c.ultimoTexto) : esc(nombreCel(c.celula)) + ' · sin mensajes') + '</span></span>' +
        '<span class="meta">' + (borrar && c.ultimo ? '<button class="inbox-x" data-del="' + esc(c.id) + '" aria-label="Eliminar el chat con ' + esc(c.nombre) + '" title="Eliminar chat">' + icon('x') + '</button>' : '') +
        hace(c.ultimo) + (c.noLeidos ? '<span class="badge">' + c.noLeidos + '</span>' : '') + '</span></div>').join('')
        : '<p class="small muted" style="padding:16px">' + (lista.length ? 'Nadie coincide con la búsqueda.' : 'Todavía no hay aspirantes aprobados.') + '</p>';
      ul.querySelectorAll('.inbox-item').forEach(b => {
        b.addEventListener('click', e => { if (!e.target.closest('[data-del]')) abrirHilo(b.dataset.id); });
        b.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === b) { e.preventDefault(); abrirHilo(b.dataset.id); } });
      });
      ul.querySelectorAll('[data-del]').forEach(x => x.addEventListener('click', async e => {
        e.stopPropagation();
        const c = lista.find(y => y.id === x.dataset.del);
        if (!await confirmar({ titulo: '¿Eliminar el chat con ' + c.nombre + '?', texto: 'Se borran todos los mensajes de esta conversación, también para el aspirante. No se puede deshacer.', ok: 'Eliminar chat', peligro: true })) return;
        try {
          await call('chatEliminar', { id: c.id });
          toast('Chat eliminado');
          if (actual === c.id) { if (pararHilo) pararHilo(); pararHilo = null; actual = null; A.chatActual = null; box.classList.remove('viendo'); panel.innerHTML = '<div class="inbox-vacio">' + icon('chat') + '<p>Elige un aspirante de la lista para ver o empezar la conversación.</p></div>'; }
          await cargarLista();
        } catch (er) { manejar(er); }
      }));
    };
    const cargarLista = async () => {
      try { const r = await call('chats'); lista = r.chats; pintarBadge(r.noLeidos); pintarLista(); } catch (e) { if (e.status === 401) { vivo = false; manejar(e); } }
    };
    const abrirHilo = id => {
      if (pararHilo) pararHilo();
      actual = id; A.chatActual = id;
      const c = lista.find(x => x.id === id) || { nombre: 'Aspirante', celula: '' };
      c.noLeidos = 0; pintarLista(); pintarBadge(lista.reduce((t, x) => t + (x.noLeidos || 0), 0));
      box.classList.add('viendo');
      panel.innerHTML = '<div class="inbox-head"><button class="icon-btn" id="ib-back" aria-label="Volver a la lista">' + icon('left') + '</button><span class="avatar">' + esc(iniciales(c.nombre)) + '</span>' +
        '<div class="grow" style="min-width:0"><b>' + esc(c.nombre) + '</b><div class="small muted">' + esc(nombreCel(c.celula)) + (c.usuario ? ' · @' + esc(c.usuario) : '') + '</div></div><button class="btn btn-ghost btn-sm" id="ib-ficha">Ver ficha</button></div>' +
        '<div class="chat-list" id="ib-msgs" aria-live="polite"></div>' +
        '<form class="chat-form" id="ib-form"><textarea class="textarea" rows="1" placeholder="Escribe a ' + esc(c.nombre.split(' ')[0]) + '…" aria-label="Mensaje" maxlength="2000"></textarea><button class="btn btn-primary" type="submit" aria-label="Enviar">' + icon('send') + '<span class="hide-sm">Enviar</span></button></form>';
      panel.querySelector('#ib-back').addEventListener('click', () => { box.classList.remove('viendo'); });
      panel.querySelector('#ib-ficha').addEventListener('click', () => detalleAspirante(id));
      pararHilo = montarChatAdmin(panel.querySelector('#ib-msgs'), panel.querySelector('#ib-form'), id);
      panel.querySelector('textarea').focus();
    };
    main.querySelector('#ib-q').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); pintarLista(); });
    A.parar = () => { vivo = false; clearTimeout(t); if (pararHilo) pararHilo(); };
    await cargarLista();
    if (A.tab !== 'assessment' || !vivo) return;
    if (actual && lista.some(c => c.id === actual)) abrirHilo(actual);
    const ciclo = async () => { if (!vivo) return; if (!document.hidden) await cargarLista(); t = setTimeout(ciclo, 6000); };
    t = setTimeout(ciclo, 6000);
    A.parar = () => { vivo = false; clearTimeout(t); if (pararHilo) pararHilo(); };
  }
  function montarChatAdmin(lista, form, id) {
    const vistos = new Set(); let ultimo = null, ultimoDia = null, vivo = true, t = null, abajo1 = true;
    const burbuja = m => '<div class="msg ' + (m.de === 'equipo' ? 'me' : 'them') + '">' + '<span class="msg-autor"' + (m.de === 'equipo' ? ' style="color:inherit;opacity:.75"' : '') + '>' + esc(m.autor || '') + '</span>' +
      '<div class="msg-txt">' + esc(m.texto).replace(/\n/g, '<br>') + '</div><span class="msg-hora">' + new Date(m.fecha).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) + '</span></div>';
    const agregar = ms => {
      const vacio = lista.querySelector('.chat-vacio');
      const nuevos = ms.filter(m => !vistos.has(m._id));
      if (!nuevos.length) { if (vacio === null && !vistos.size) lista.innerHTML = '<div class="chat-vacio">' + icon('chat') + '<p>No hay mensajes todavía. Escribe el primero.</p></div>'; return; }
      if (vacio) vacio.remove();
      const pegado = abajo1 || lista.scrollHeight - lista.scrollTop - lista.clientHeight < 80;
      let html = '';
      nuevos.forEach(m => { vistos.add(m._id); const dia = String(m.fecha).slice(0, 10); if (dia !== ultimoDia) { html += '<div class="msg-dia"><span>' + fecha(m.fecha) + '</span></div>'; ultimoDia = dia; } html += burbuja(m); if (!ultimo || String(m.fecha) > ultimo) ultimo = m.fecha; });
      lista.insertAdjacentHTML('beforeend', html);
      if (pegado) lista.scrollTop = lista.scrollHeight; abajo1 = false;
    };
    const ciclo = async () => {
      if (!vivo) return;
      if (!document.hidden) { try { agregar((await call('chatHilo', { id, desde: ultimo })).mensajes); } catch (e) { if (e.status === 401) { vivo = false; return manejar(e); } } }
      t = setTimeout(ciclo, document.hidden ? 8000 : 2000);
    };
    ciclo();
    const ta = form.querySelector('textarea'), btn = form.querySelector('button');
    const ajustar = () => { ta.style.height = 'auto'; ta.style.height = Math.min(140, ta.scrollHeight) + 'px'; };
    ta.addEventListener('input', ajustar);
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const texto = ta.value.trim(); if (!texto) return;
      btn.disabled = true;
      try { const r = await call('chatResponder', { id, texto }); ta.value = ''; ajustar(); abajo1 = true; agregar([r.mensaje]); } catch (x) { manejar(x); }
      btn.disabled = false; ta.focus();
    });
    return () => { vivo = false; clearTimeout(t); };
  }

  /* ============ Boost (configuración) ============ */
  async function tabBoost() {
    let b;
    try { b = (await call('boostConfig')).boost; } catch (e) { return manejar(e); }
    if (A.tab !== 'boost') return;   // el usuario ya cambió de sección
    const m = b.mecanografia;
    const DUR = [[30, '30 s'], [60, '1 min'], [120, '2 min'], [180, '3 min'], [300, '5 min']];
    main.innerHTML = encabezado('Boost', 'Actividades que el aspirante puede practicar en cualquier momento para mejorar sus cuellos de botella.') +
      '<div class="card stack"><div class="row-between"><div class="row"><span class="boost-ic">' + icon('keyboard') + '</span><div><h2>Mecanografía</h2><span class="small muted">Copiar textos de atención al cliente contra el reloj.</span></div></div>' +
      '<label class="switch"><input type="checkbox" id="bo-act"' + (m.activa ? ' checked' : '') + '>Activa</label></div>' +
      '<div class="two"><div class="field"><label for="bo-meta">Meta de velocidad</label><div class="row" style="flex-wrap:nowrap"><input class="input num" type="number" id="bo-meta" value="' + m.meta + '" style="max-width:110px"><span class="muted">palabras por minuto</span></div><span class="hint">Referencia común para agentes de chat: 35 a 45 PPM.</span></div>' +
      '<div class="field"><label for="bo-prec">Precisión esperada</label><div class="row" style="flex-wrap:nowrap"><input class="input num" type="number" id="bo-prec" value="' + m.precisionMin + '" style="max-width:110px"><span class="muted">%</span></div></div></div>' +
      '<div class="field"><span class="label">Duraciones disponibles</span><div class="row">' + DUR.map(([d, n]) => '<label class="switch"><input type="checkbox" data-dur="' + d + '"' + (m.duraciones.includes(d) ? ' checked' : '') + '>' + n + '</label>').join('') + '</div></div>' +
      '<div class="field"><label for="bo-txt">Textos de práctica</label><textarea class="textarea" id="bo-txt" style="min-height:260px">' + esc(m.textos.join('\n\n')) + '</textarea>' +
      '<span class="hint">Separa cada texto con una línea en blanco. Se mezclan al azar en cada intento. Usa frases reales de atención (sin datos de clientes).</span></div>' +
      '<div class="row"><button class="btn btn-primary" id="bo-save">Guardar</button><span class="small muted" id="bo-count"></span></div></div>' +
      '<div class="notice info">Los resultados de cada aspirante (mejor marca, último intento e intentos) aparecen en su ficha, en Postulaciones → Aspirantes.</div>';
    const txt = main.querySelector('#bo-txt'), cnt = main.querySelector('#bo-count');
    const textos = () => txt.value.split(/\n\s*\n/).map(t => t.trim()).filter(Boolean);
    const contar = () => { cnt.textContent = textos().length + ' textos'; };
    txt.addEventListener('input', contar); contar();
    main.querySelector('#bo-save').addEventListener('click', async () => {
      try {
        await call('guardarBoost', { mecanografia: { activa: main.querySelector('#bo-act').checked, meta: main.querySelector('#bo-meta').value, precisionMin: main.querySelector('#bo-prec').value,
          duraciones: [...main.querySelectorAll('[data-dur]:checked')].map(x => Number(x.dataset.dur)), textos: textos() } });
        toast('Boost guardado');
      } catch (e) { manejar(e); }
    });
  }

  /* ============ Usuarios del panel ============ */
  async function tabUsuarios() {
    let us;
    try { us = (await call('usuarios')).usuarios; } catch (e) { return manejar(e); }
    if (A.tab !== 'usuarios') return;   // el usuario ya cambió de sección
    const pill = p => '<span class="pill ' + (p === 'admin' ? 'pill-brand' : p === 'reclutador' ? 'pill-ok' : '') + '">' + esc(ROL_NOMBRE[p] || p) + '</span>';
    main.innerHTML = encabezado('Usuarios', 'Cuentas para entrar a este panel. Cada persona entra con su usuario y su clave.', '<button class="btn btn-primary" id="nu">' + icon('plus') + 'Nuevo usuario</button>') +
      '<div class="cert-grid">' + Object.keys(ROL_NOMBRE).map(k => '<div class="card card-tight stack-sm">' + pill(k) + '<span class="small muted">' + ROL_TEXTO[k] + '</span></div>').join('') + '</div>' +
      '<div class="notice info">La cuenta principal (usuario y clave de Vercel) siempre funciona como Admin, aunque no aparezca en esta lista. Úsala si alguien pierde el acceso.</div>' +
      (us.length ? '<div class="table-wrap"><table><thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Estado</th><th>Último acceso</th><th></th></tr></thead><tbody>' +
        us.map(u => '<tr><td class="num"><b>@' + esc(u.usuario) + '</b></td><td>' + esc(u.nombre) + '</td><td>' + pill(u.perfil) + '</td><td>' + (u.activo ? '<span class="pill pill-ok">Activo</span>' : '<span class="pill">Desactivado</span>') + '</td>' +
          '<td class="small muted">' + (u.ultimoAcceso ? fechaHora(u.ultimoAcceso) : 'Nunca') + '</td><td><button class="btn btn-secondary btn-sm" data-ed="' + esc(u.usuario) + '">' + icon('edit') + 'Editar</button></td></tr>').join('') + '</tbody></table></div>'
        : '<div class="card empty">' + icon('users') + '<p>Todavía no hay usuarios. Crea uno para cada persona que vaya a usar el panel.</p></div>');
    main.querySelector('#nu').addEventListener('click', () => modalUsuario(null));
    main.querySelectorAll('[data-ed]').forEach(b => b.addEventListener('click', () => modalUsuario(us.find(u => u.usuario === b.dataset.ed))));
    pintarActividad();
  }

  /* ---------- Actividad reciente (bitácora de seguridad) ---------- */
  const ACCION_NOMBRE = {
    aprobar: 'Aprobó postulación', cambiarEstado: 'Cambió estado', crearAspirante: 'Agregó aspirante', guardarAcceso: 'Cambió acceso de aspirante',
    reiniciarIntentos: 'Reinició intentos', eliminarAspirante: 'Eliminó aspirante', guardarPregunta: 'Editó pregunta del test', ordenarPreguntas: 'Reordenó el test',
    eliminarPregunta: 'Eliminó pregunta del test', guardarModulo: 'Editó módulo', ordenarModulos: 'Reordenó módulos', eliminarModulo: 'Eliminó módulo',
    guardarCohorte: 'Editó cohorte', guardarConfig: 'Cambió ajustes', guardarUsuario: 'Creó o editó usuario', eliminarUsuario: 'Eliminó usuario',
    guardarBoost: 'Cambió Boost', chatEliminar: 'Eliminó chat', cambiarMiClave: 'Cambió su clave'
  };
  function textoEvento(e) {
    if (e.tipo === 'login') return '<span class="pill pill-ok">Entró al panel</span>';
    if (e.tipo === 'login-fallido') return '<span class="pill">Clave errada</span>';
    if (e.tipo === 'bloqueo') return '<span class="pill pill-bad">Bloqueado 15 min</span>';
    return esc(ACCION_NOMBRE[e.accion] || e.accion);
  }
  async function pintarActividad() {
    const zona = document.createElement('div'); zona.className = 'card stack'; zona.id = 'actividad';
    zona.innerHTML = '<div class="row-between"><h2>Actividad reciente</h2><span class="small muted">Quién entró y qué cambió en el panel. Se guarda 180 días.</span></div><div class="loading"><div class="spinner"></div></div>';
    main.appendChild(zona);
    let ev;
    try { ev = (await call('auditoria')).eventos; } catch (e) { zona.querySelector('.loading').outerHTML = '<p class="small muted">' + esc(e.message) + '</p>'; return; }
    if (A.tab !== 'usuarios') return;
    zona.querySelector('.loading').outerHTML = ev.length
      ? '<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Quién</th><th>Qué</th><th>Sobre</th><th>IP</th></tr></thead><tbody>' +
        ev.map(e => '<tr><td class="small muted">' + fechaHora(e.fecha) + '</td><td class="num">' + (e.usuario ? '@' + esc(e.usuario) : '—') + '</td><td>' + textoEvento(e) + '</td>' +
          '<td class="small">' + esc(e.objetivo || e.detalle) + '</td><td class="small muted num">' + esc(e.ip) + '</td></tr>').join('') + '</tbody></table></div>'
      : '<p class="small muted">Todavía no hay actividad registrada.</p>';
  }
  function claveAleatoria() {
    const c = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const a = new Uint32Array(12); crypto.getRandomValues(a);
    return [...a].map(n => c[n % c.length]).join('');
  }
  function modalUsuario(u) {
    const nuevo = !u; u = u || { usuario: '', nombre: '', perfil: 'reclutador', activo: true };
    const w = document.createElement('div'); w.className = 'modal-wrap';
    w.innerHTML = '<form class="modal" role="dialog" aria-modal="true" novalidate><div class="row-between"><h2>' + (nuevo ? 'Nuevo usuario' : 'Editar @' + esc(u.usuario)) + '</h2><button type="button" class="icon-btn" data-x aria-label="Cerrar">' + icon('x') + '</button></div>' +
      '<div class="form-error" role="alert" hidden></div>' +
      '<div class="two"><div class="field"><label for="u-u">Usuario</label><input class="input" id="u-u" value="' + esc(u.usuario) + '"' + (nuevo ? '' : ' disabled') + ' placeholder="ej. maria.lopez" autocomplete="off"></div>' +
      '<div class="field"><label for="u-n">Nombre</label><input class="input" id="u-n" value="' + esc(u.nombre) + '" placeholder="María López"></div></div>' +
      '<div class="field"><label for="u-r">Rol</label><select class="select" id="u-r">' + Object.keys(ROL_NOMBRE).map(k => '<option value="' + k + '"' + (u.perfil === k ? ' selected' : '') + '>' + ROL_NOMBRE[k] + ' — ' + ROL_TEXTO[k] + '</option>').join('') + '</select></div>' +
      '<div class="field"><label for="u-c">' + (nuevo ? 'Clave' : 'Nueva clave (déjalo vacío para no cambiarla)') + '</label><div class="row" style="flex-wrap:nowrap"><input class="input" id="u-c" autocomplete="new-password" placeholder="Mínimo 8 caracteres"><button type="button" class="btn btn-secondary" id="u-gen">Generar</button></div>' +
      '<span class="hint">Cópiala y envíasela a la persona. Después no se puede ver de nuevo.</span></div>' +
      (nuevo ? '' : '<label class="switch"><input type="checkbox" id="u-a"' + (u.activo ? ' checked' : '') + '>Cuenta activa (si la desactivas, se cierra su sesión)</label>') +
      '<div class="modal-actions" style="justify-content:space-between">' + (nuevo ? '<span></span>' : '<button type="button" class="btn btn-danger btn-sm" id="u-del">' + icon('trash') + 'Eliminar</button>') +
      '<div class="row"><button type="button" class="btn btn-secondary" data-x>Cancelar</button><button class="btn btn-primary" type="submit">' + (nuevo ? 'Crear usuario' : 'Guardar') + '</button></div></div></form>';
    w.addEventListener('click', e => { if (e.target === w || e.target.closest('[data-x]')) w.remove(); });
    document.body.appendChild(w);
    const f = w.querySelector('form'), $ = s2 => f.querySelector(s2);
    $('#u-gen').addEventListener('click', () => { $('#u-c').value = claveAleatoria(); $('#u-c').select(); });
    (nuevo ? $('#u-u') : $('#u-n')).focus();
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const clave = $('#u-c').value;
      try {
        await call('guardarUsuario', { usuario: { nuevo, usuario: nuevo ? $('#u-u').value : u.usuario, nombre: $('#u-n').value, perfil: $('#u-r').value, clave, activo: nuevo ? true : $('#u-a').checked } });
        w.remove();
        if (clave) {
          const usr = (nuevo ? $('#u-u').value : u.usuario).trim().toLowerCase();
          const msg = 'Tu acceso al panel de Ridery Academy: ' + location.origin + location.pathname + ' · usuario: ' + usr + ' · clave: ' + clave;
          const ok = await confirmar({ titulo: nuevo ? 'Usuario creado' : 'Clave actualizada', texto: 'Usuario <b>' + esc(usr) + '</b> · clave <b class="num">' + esc(clave) + '</b><br>Envíasela a la persona. Después no se puede volver a ver.', ok: 'Copiar mensaje', cancelar: 'Cerrar' });
          if (ok) navigator.clipboard.writeText(msg).then(() => toast('Mensaje copiado'), () => toast('No se pudo copiar. Anótala a mano.', 'bad'));
        } else toast('Cambios guardados');
        tabUsuarios();
      } catch (x) { const er = $('.form-error'); er.hidden = false; er.textContent = x.message; }
    });
    const del = $('#u-del');
    if (del) del.addEventListener('click', async () => {
      if (!await confirmar({ titulo: '¿Eliminar a @' + u.usuario + '?', texto: 'Ya no podrá entrar al panel.', ok: 'Eliminar', peligro: true })) return;
      try { await call('eliminarUsuario', { id: u.usuario }); w.remove(); toast('Usuario eliminado'); tabUsuarios(); } catch (x) { manejar(x); }
    });
  }

  /* ============ Ajustes ============ */
  function tabAjustes() {
    const r = Object.assign({}, A.reglas);
    const cels = JSON.parse(JSON.stringify(A.celulas));
    const campo = (k, label, hint, suf) => '<div class="field"><label for="r-' + k + '">' + label + '</label><div class="row" style="flex-wrap:nowrap"><input class="input num" type="number" id="r-' + k + '" data-r="' + k + '" value="' + r[k] + '" style="max-width:110px">' + (suf ? '<span class="muted">' + suf + '</span>' : '') + '</div><span class="hint">' + hint + '</span></div>';
    const pintar = () => {
      main.innerHTML = encabezado('Ajustes') +
        '<div class="card stack"><h2>Asignación por test</h2><div class="two">' +
        campo('minPuntos', 'Puntaje mínimo', 'La célula ganadora necesita al menos estos puntos. Si no, el aspirante queda en revisión.', 'puntos') +
        campo('margenEmpate', 'Diferencia mínima con la segunda', 'Si la 1.ª y la 2.ª célula quedan más cerca que esto, se considera empate y va a revisión.', 'puntos') + '</div>' +
        '<h2>Formación y exámenes</h2><div class="two">' +
        campo('notaMinima', 'Nota mínima para aprobar', 'Porcentaje de respuestas correctas.', '%') +
        campo('intentosMax', 'Intentos por examen', 'Al agotarlos, puedes reiniciarlos desde el detalle del aspirante.', 'intentos') +
        campo('porcentajeVideo', 'Porcentaje de video obligatorio', 'Adelantar el video no cuenta: solo suma lo que se reproduce.', '%') + '</div>' +
        '<div class="row"><button class="btn btn-primary" id="save-r">Guardar reglas</button></div></div>' +
        '<div class="card stack"><div class="row-between"><h2>Células</h2><span class="small muted">El código no se puede cambiar: es el que usan los puntos del test.</span></div>' +
        '<div class="table-wrap"><table><thead><tr><th>Código</th><th>Nombre visible</th><th>Descripción para el aspirante</th></tr></thead><tbody>' +
        cels.map((c, i) => '<tr><td class="num small"><b>' + esc(c.id) + '</b></td><td><input class="input" data-c="' + i + '" data-k="nombre" value="' + esc(c.nombre) + '"></td><td><input class="input" data-c="' + i + '" data-k="descripcion" value="' + esc(c.descripcion) + '"></td></tr>').join('') +
        '</tbody></table></div><form class="row" id="f-cel" style="align-items:flex-end"><div class="field"><label for="nc-id">Nueva célula · código</label><input class="input" id="nc-id" placeholder="Ej. B2B" style="text-transform:uppercase"></div>' +
        '<div class="field grow"><label for="nc-n">Nombre</label><input class="input" id="nc-n"></div><button class="btn btn-secondary" type="submit">' + icon('plus') + 'Agregar</button></form>' +
        '<div class="row"><button class="btn btn-primary" id="save-c">Guardar células</button></div></div>';
      main.querySelectorAll('[data-r]').forEach(i => i.addEventListener('input', () => { r[i.dataset.r] = i.value; }));
      main.querySelectorAll('[data-c]').forEach(i => i.addEventListener('input', () => { cels[Number(i.dataset.c)][i.dataset.k] = i.value; }));
      main.querySelector('#save-r').addEventListener('click', async () => {
        try { const x = await call('guardarConfig', { reglas: r }); A.reglas = x.reglas; toast('Reglas guardadas'); } catch (e) { manejar(e); }
      });
      main.querySelector('#save-c').addEventListener('click', async () => {
        try { const x = await call('guardarConfig', { celulas: cels }); A.celulas = x.celulas; toast('Células guardadas'); } catch (e) { manejar(e); }
      });
      main.querySelector('#f-cel').addEventListener('submit', e => {
        e.preventDefault();
        const id = main.querySelector('#nc-id').value.trim().toUpperCase();
        if (!id) return toast('Escribe el código de la célula.', 'bad');
        if (cels.some(c => c.id === id) || id === H.COMUN) return toast('Ya existe una célula con ese código.', 'bad');
        cels.push({ id, nombre: main.querySelector('#nc-n').value.trim() || id, descripcion: '' }); pintar();
        toast('Agregada. Presiona «Guardar células» para confirmar.');
      });
    };
    pintar();
  }

  window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  Elx.barraDemo('index.html' + (window.ElxDemo && !window.ELX_DEMO ? '?demo=1' : ''), 'Ver como aspirante');
  iniciar();
})();
