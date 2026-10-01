/* ============================================================
   Formación CX · panel de administración
   ============================================================ */
(function () {
  'use strict';
  const { API, esc, icon, youtubeId, tipoImagen, toast, confirmar, fecha, fechaHora, iniciales } = window.Elx;
  const H = window.ElxHandlers;
  const app = document.getElementById('app');
  const call = (accion, data) => API.llamar('admin', 'admin', accion, data);
  const A = { usuario: null, celulas: [], reglas: {}, cohortes: [], tab: 'aspirantes', filtros: { q: '', cohorte: '', celula: '', estado: 'postulado' }, celContenido: H.COMUN, aspirantes: [] };
  const TABS = [
    ['aspirantes', 'Postulaciones', 'users'], ['test', 'Test de perfil', 'list'], ['contenido', 'Contenido', 'book'],
    ['metricas', 'Métricas', 'chart'], ['usuarios', 'Usuarios', 'lock'], ['ajustes', 'Ajustes', 'gear']
  ];
  // Qué ve cada rol en el menú (el servidor también valida cada acción)
  const TABS_ROL = { admin: TABS.map(t => t[0]), reclutador: ['aspirantes', 'metricas'], calidad: ['aspirantes', 'metricas'] };
  const ROL_NOMBRE = { admin: 'Admin', reclutador: 'Reclutador', calidad: 'Calidad' };
  const ROL_TEXTO = { admin: 'Todo el panel: contenido, test, ajustes y usuarios.', reclutador: 'Postulaciones: aprobar, descartar, agregar aspirantes y darles acceso. Métricas.', calidad: 'Ver postulaciones, aspirantes y métricas. No puede editar.' };
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
    } catch (e) { manejar(e); }
  }

  function shell() {
    app.innerHTML = '<header class="topbar"><span class="brand"><img class="brand-mark" src="img/logo-192.png" alt="Ridery" width="32" height="32"><span>Ridery Academy <small>· Panel</small></span></span><div class="grow"></div>' +
      '<div style="position:relative"><button class="user-chip" id="um" aria-haspopup="true"><span class="avatar avatar-top">' + icon('user') + '</span><span class="hide-sm small">' + esc(A.usuario) + '</span>' + icon('chev') + '</button>' +
      '<div class="menu" id="user-menu" hidden><div style="padding:8px 10px"><b>' + esc(A.usuario) + '</b><div class="small muted">' + esc(ROL_NOMBRE[A.yo.perfil]) + (A.yo.principal ? ' · cuenta principal' : ' · @' + esc(A.yo.usuario)) + '</div></div><hr class="divider">' +
      (A.yo.principal ? '' : '<button id="mi-clave">' + icon('lock') + 'Cambiar mi clave</button>') + '<button id="salir">' + icon('out') + 'Salir</button></div></div></header>' +
      '<div class="admin"><nav class="admin-nav" aria-label="Secciones">' + TABS.filter(t => TABS_ROL[A.yo.perfil].includes(t[0])).map(t => '<button data-tab="' + t[0] + '">' + icon(t[2]) + t[1] + '</button>').join('') + '</nav><main class="admin-main" id="main"></main></div>';
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
  function abrir(tab) {
    A.tab = tab;
    app.querySelectorAll('[data-tab]').forEach(b => { b.classList.toggle('active', b.dataset.tab === tab); b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false'); });
    main.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    ({ aspirantes: tabAspirantes, test: tabTest, contenido: tabContenido, metricas: tabMetricas, usuarios: tabUsuarios, ajustes: tabAjustes })[tab]();
  }
  const encabezado = (titulo, sub, acciones) => '<div class="row-between"><div class="stack-sm" style="gap:4px"><h1>' + titulo + '</h1>' + (sub ? '<p class="muted">' + sub + '</p>' : '') + '</div><div class="row">' + (acciones || '') + '</div></div>';

  /* ============ Postulaciones y aspirantes ============ */
  const ESTADOS = [['postulado', 'Por revisar'], ['aprobado', 'Aspirantes'], ['descartado', 'Descartados']];
  function pillEstado(a) {
    if (a.estado === 'aprobado') return '<span class="pill pill-ok">Aspirante</span>';
    if (a.estado === 'descartado') return '<span class="pill">Descartado</span>';
    return a.celulaSugerida ? '<span class="pill pill-brand">Por revisar</span>' : '<span class="pill pill-warn">Por revisar · sin célula</span>';
  }
  async function tabAspirantes() {
    try { A.aspirantes = (await call('aspirantes')).aspirantes; } catch (e) { return manejar(e); }
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
        (esAsp ? '<th>Usuario</th><th>Progreso</th><th>Promedio</th><th>Último acceso</th>' : '<th>Estado</th><th>Fecha</th>') + '</tr></thead><tbody>' +
        lista.map(a => '<tr class="click" data-id="' + esc(a._id) + '" tabindex="0"><td><b>' + esc(a.nombre) + '</b><div class="small muted num">C.I. ' + esc(a.cedula) + (a.ciudad ? ' · ' + esc(a.ciudad) : '') + '</div></td>' +
          '<td class="small">' + esc(a.telefono || '—') + '<div class="muted">' + esc(a.email || '') + '</div></td><td>' + esc(a.celula ? nombreCel(a.celula) : '—') + '</td>' +
          (esAsp
            ? '<td class="num">' + (a.usuario && a.tieneClave ? '@' + esc(a.usuario) : '<span class="pill pill-warn">Sin acceso</span>') + '</td><td><div class="row" style="gap:8px;flex-wrap:nowrap"><div class="bar' + (a.completo ? ' ok' : '') + '"><span style="width:' + a.progreso + '%"></span></div><span class="small num">' + a.progreso + '%</span></div></td>' +
              '<td class="num">' + (a.promedio != null ? a.promedio + '%' : '—') + '</td><td class="small muted">' + (a.ultimoAcceso ? fechaHora(a.ultimoAcceso) : 'Sin entrar') + '</td>'
            : '<td>' + pillEstado(a) + '</td><td class="small muted">' + fechaHora(a.creado) + '</td>') + '</tr>').join('') + '</tbody></table></div>';
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
      '<div class="field"><label for="' + pref + '-pass">' + (nueva ? 'Contraseña' : 'Nueva contraseña (opcional)') + '</label><div class="row" style="flex-wrap:nowrap"><input class="input" id="' + pref + '-pass" autocomplete="new-password" placeholder="' + (nueva ? 'Mínimo 6 caracteres' : 'Déjala vacía para no cambiarla') + '">' +
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
      try { await call('cambiarMiClave', { actual: f.querySelector('#mc-a').value, nueva: f.querySelector('#mc-n').value }); w.remove(); toast('Clave actualizada'); }
      catch (x) { const er = f.querySelector('.form-error'); er.hidden = false; er.textContent = x.message; }
    });
  }
  function exportarCSV(lista) {
    const cols = ['Nombre', 'Cédula', 'Correo', 'Teléfono', 'Ciudad', 'Estado', 'Célula', 'Célula sugerida', 'Usuario', 'Progreso %', 'Promedio %', 'Completó', 'Postulación', 'Aprobado', 'Último acceso'];
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const est = { postulado: 'Por revisar', aprobado: 'Aspirante', descartado: 'Descartado' };
    const filas = lista.map(a => [a.nombre, a.cedula, a.email, a.telefono, a.ciudad, est[a.estado], a.celula ? nombreCel(a.celula) : '', a.celulaSugerida ? nombreCel(a.celulaSugerida) : '', a.usuario, a.progreso, a.promedio, a.completo ? 'Sí' : 'No', a.creado, a.aprobadoFecha, a.ultimoAcceso].map(q).join(';'));
    const blob = new Blob(['﻿' + [cols.map(q).join(';')].concat(filas).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const el = document.createElement('a'); el.href = URL.createObjectURL(blob); el.download = 'postulaciones-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(el); el.click(); el.remove();
    toast('CSV exportado (' + lista.length + ')');
  }

  async function detalleAspirante(id) {
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
      '<div class="cert-grid small"><div><span class="muted">Correo</span><b>' + esc(a.email || '—') + '</b></div><div><span class="muted">Teléfono</span><b>' + esc(a.telefono || '—') + '</b></div><div><span class="muted">Ciudad</span><b>' + esc(a.ciudad || '—') + '</b></div><div><span class="muted">Postulación</span><b>' + fecha(a.creado) + '</b></div>' +
      (r.estado === 'aprobado' ? '<div><span class="muted">Progreso</span><b class="num">' + r.progreso + '%' + (r.completo ? ' · completó' : '') + '</b></div>' : '') + '</div>' +
      acciones +
      '<hr class="divider"><div class="stack-sm"><div class="row-between"><h3>Test de perfil</h3><span class="small muted">Sugerida: <b>' + esc(t && t.celulaSugerida ? nombreCel(t.celulaSugerida) : 'ninguna') + '</b></span></div>' +
      (t ? (t.motivo ? '<p class="small muted">' + esc(t.motivo) + '</p>' : '') +
        '<div class="stack-sm">' + (t.ranking || []).map(([c, v]) => '<div class="hbar"><span>' + esc(nombreCel(c)) + '</span><div class="bar"><span style="width:' + Math.round(v * 100 / max) + '%"></span></div><span class="num small">' + v + '</span></div>').join('') + '</div>' +
        (Object.keys(t.respuestas || {}).length ? '<details><summary class="small" style="cursor:pointer;font-weight:700">Ver respuestas (' + Object.keys(t.respuestas).length + ')</summary><div class="review">' +
          Object.values(t.respuestas).map((x, i) => '<div class="review-item"><span class="n num">' + (i + 1) + '</span><div class="stack-sm" style="gap:2px"><span class="small muted">' + esc(x.pregunta) + '</span><b>' + esc(x.texto) + '</b></div></div>').join('') + '</div></details>' : '')
        : '<p class="small muted">Sin test.</p>') + '</div>' +
      (r.estado === 'aprobado' ? '<hr class="divider"><div class="stack-sm"><h3>Módulos</h3>' + (d.ruta.modulos.length ? '<div class="table-wrap"><table><thead><tr><th>Módulo</th><th>Estado</th><th>Intentos</th><th>Mejor nota</th><th></th></tr></thead><tbody>' +
        d.ruta.modulos.map(m => '<tr><td><b>' + esc(m.titulo) + '</b><div class="small muted">' + esc(nombreCel(m.celula)) + '</div></td><td>' + ({ aprobado: '<span class="pill pill-ok">Aprobado</span>', disponible: '<span class="pill pill-brand">En curso</span>', bloqueado: '<span class="pill">Bloqueado</span>', agotado: '<span class="pill pill-bad">Sin intentos</span>' }[m.estado]) + '</td>' +
          '<td class="num">' + m.examen.intentos + ' / ' + A.reglas.intentosMax + '</td><td class="num">' + (m.examen.mejor != null ? m.examen.mejor + '%' : '—') + '</td>' +
          '<td>' + (m.examen.intentos && !m.examen.aprobado && puede('admin', 'reclutador') ? '<button class="btn btn-secondary btn-sm" data-reset="' + esc(m._id) + '">Reiniciar intentos</button>' : '') + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="small muted">Sin módulos en su ruta.</p>') + '</div>' : '') +
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

  /* ============ Test de perfil ============ */
  async function tabTest() {
    let preguntas;
    try { preguntas = (await call('preguntas')).preguntas; } catch (e) { return manejar(e); }
    A.preguntas = preguntas;
    const r = A.reglas;
    main.innerHTML = encabezado('Test de perfil', preguntas.filter(p => p.activa !== false).length + ' preguntas activas', '<button class="btn btn-secondary" id="sim">Probar el test</button><button class="btn btn-primary" id="nueva">' + icon('plus') + 'Nueva pregunta</button>') +
      '<div class="notice info">Cada opción suma puntos a una o más células. Gana la célula con más puntos si llega a <b>' + r.minPuntos + '</b> y le saca al menos <b>' + r.margenEmpate + '</b> a la segunda. Si no, el aspirante queda <b>en revisión</b> y lo asignas a mano. Puedes cambiar estos valores en Ajustes.</div>' +
      '<div class="stack" id="lista"></div>';
    const lista = main.querySelector('#lista');
    if (!preguntas.length) lista.innerHTML = '<div class="card empty">' + icon('list') + '<p>Todavía no hay preguntas. Crea la primera.</p></div>';
    preguntas.forEach((p, i) => lista.appendChild(bloquePregunta(p, i, preguntas.length)));
    main.querySelector('#nueva').addEventListener('click', () => {
      const p = { texto: '', activa: true, opciones: [{ texto: '', puntos: {} }, { texto: '', puntos: {} }] };
      const b = bloquePregunta(p, preguntas.length, preguntas.length + 1, true);
      const vacio = lista.querySelector('.empty'); if (vacio) vacio.parentElement.remove();
      lista.appendChild(b); b.querySelector('textarea').focus();
    });
    main.querySelector('#sim').addEventListener('click', () => simulador(preguntas.filter(p => p.activa !== false)));
  }
  function bloquePregunta(p, i, total, abierto) {
    const d = document.createElement('details'); d.className = 'editor-block'; if (abierto) d.open = true;
    const estado = JSON.parse(JSON.stringify(p));
    const resumen = () => '<summary><span class="status-dot"><span class="small num" style="font-weight:700">' + (i + 1) + '</span></span><span class="grow">' + esc(estado.texto || 'Pregunta nueva') + '</span>' +
      (estado.activa === false ? '<span class="pill">Inactiva</span>' : '') +
      (p._id ? '<button class="icon-btn" data-mv="-1" aria-label="Subir"' + (i === 0 ? ' disabled' : '') + '>' + icon('up') + '</button><button class="icon-btn" data-mv="1" aria-label="Bajar"' + (i >= total - 1 ? ' disabled' : '') + '>' + icon('down') + '</button>' : '') + '</summary>';
    const pintar = () => {
      d.innerHTML = resumen() + '<div class="editor-body">' +
        '<div class="field"><label>Pregunta</label><textarea class="textarea" style="min-height:70px" data-f="texto">' + esc(estado.texto) + '</textarea></div>' +
        '<div class="stack-sm"><span class="label">Opciones y puntos</span>' + estado.opciones.map((o, j) =>
          '<div class="opt-row" data-o="' + j + '"><span class="key">' + String.fromCharCode(65 + j) + '</span><div class="stack-sm"><input class="input" data-ot value="' + esc(o.texto) + '" placeholder="Texto de la opción">' +
          '<div class="chips">' + Object.entries(o.puntos || {}).map(([c, v]) => '<span class="chip">' + esc(nombreCel(c)) + ' +' + v + '<button data-rm="' + esc(c) + '" aria-label="Quitar">' + icon('x') + '</button></span>').join('') +
          (Object.keys(o.puntos || {}).length ? '' : '<span class="small muted">Esta opción no suma puntos a ninguna célula.</span>') + '</div>' +
          '<div class="add-points"><select class="select" data-pc>' + opcionesCel('') + '</select><input class="input num" type="number" min="1" max="10" value="2" data-pv aria-label="Puntos"><button class="btn btn-secondary btn-sm" data-add>' + icon('plus') + 'Sumar puntos</button></div></div>' +
          '<button class="icon-btn" data-del-o aria-label="Quitar opción"' + (estado.opciones.length <= 2 ? ' disabled' : '') + '>' + icon('trash') + '</button></div>').join('') +
        '<div><button class="btn btn-ghost btn-sm" data-add-o>' + icon('plus') + 'Agregar opción</button></div></div>' +
        '<div class="row-between"><label class="switch"><input type="checkbox" data-f="activa"' + (estado.activa !== false ? ' checked' : '') + '>Pregunta activa</label>' +
        '<div class="row">' + (p._id ? '<button class="btn btn-danger btn-sm" data-borrar>' + icon('trash') + 'Eliminar</button>' : '') + '<button class="btn btn-primary btn-sm" data-guardar>Guardar pregunta</button></div></div></div>';
      d.querySelector('[data-f="texto"]').addEventListener('input', e => { estado.texto = e.target.value; });
      d.querySelector('[data-f="activa"]').addEventListener('change', e => { estado.activa = e.target.checked; });
      d.querySelectorAll('.opt-row').forEach(row => {
        const o = estado.opciones[Number(row.dataset.o)];
        row.querySelector('[data-ot]').addEventListener('input', e => { o.texto = e.target.value; });
        row.querySelector('[data-add]').addEventListener('click', () => { const c = row.querySelector('[data-pc]').value, v = Number(row.querySelector('[data-pv]').value) || 0; if (!v) return; o.puntos = o.puntos || {}; o.puntos[c] = v; pintar(); });
        row.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', () => { delete o.puntos[b.dataset.rm]; pintar(); }));
        row.querySelector('[data-del-o]').addEventListener('click', () => { estado.opciones.splice(Number(row.dataset.o), 1); pintar(); });
      });
      d.querySelector('[data-add-o]').addEventListener('click', () => { estado.opciones.push({ texto: '', puntos: {} }); pintar(); });
      d.querySelector('[data-guardar]').addEventListener('click', async () => {
        try { await call('guardarPregunta', { pregunta: estado }); toast('Pregunta guardada'); tabTest(); } catch (e) { manejar(e); }
      });
      const bo = d.querySelector('[data-borrar]');
      if (bo) bo.addEventListener('click', async () => {
        if (!await confirmar({ titulo: '¿Eliminar esta pregunta?', texto: 'Los aspirantes que ya hicieron el test conservan sus resultados.', ok: 'Eliminar', peligro: true })) return;
        try { await call('eliminarPregunta', { id: p._id }); toast('Pregunta eliminada'); tabTest(); } catch (e) { manejar(e); }
      });
      d.querySelectorAll('[data-mv]').forEach(b => b.addEventListener('click', async e => {
        e.preventDefault(); e.stopPropagation();
        const ids = A.preguntas.map(x => x._id), j = i + Number(b.dataset.mv);
        [ids[i], ids[j]] = [ids[j], ids[i]];
        try { await call('ordenarPreguntas', { ids }); tabTest(); } catch (er) { manejar(er); }
      }));
    };
    pintar();
    return d;
  }
  function simulador(preguntas) {
    const resp = {};
    const w = document.createElement('div'); w.className = 'modal-wrap';
    const pintar = () => {
      const r = H.calcularCelula(preguntas, resp, A.reglas);
      const completas = preguntas.every(p => resp[p._id] != null);
      const max = Math.max(1, ...r.ranking.map(x => x[1]));
      w.innerHTML = '<div class="modal wide" role="dialog" aria-modal="true"><div class="row-between"><h2>Probar el test</h2><button class="icon-btn" data-x aria-label="Cerrar">' + icon('x') + '</button></div>' +
        '<p class="small muted">Responde como lo haría un aspirante y mira qué célula le tocaría. No se guarda nada.</p>' +
        preguntas.map((p, i) => '<div class="stack-sm"><b>' + (i + 1) + '. ' + esc(p.texto) + '</b><select class="select" data-q="' + esc(p._id) + '"><option value="">Elige una opción</option>' +
          p.opciones.map((o, j) => '<option value="' + j + '"' + (resp[p._id] === j ? ' selected' : '') + '>' + String.fromCharCode(65 + j) + '. ' + esc(o.texto) + '</option>').join('') + '</select></div>').join('') +
        '<hr class="divider"><div class="stack-sm"><h3>Resultado</h3>' + (r.ranking.length ? r.ranking.map(([c, v]) => '<div class="hbar"><span>' + esc(nombreCel(c)) + '</span><div class="bar"><span style="width:' + Math.round(v * 100 / max) + '%"></span></div><span class="num small">' + v + '</span></div>').join('') : '<p class="small muted">Elige opciones para ver los puntos.</p>') +
        (completas ? (r.celula ? '<div class="feedback ok">' + icon('check') + '<span class="body">Se asignaría a <b>' + esc(nombreCel(r.celula)) + '</b>.</span></div>' : '<div class="notice">Quedaría en revisión: ' + esc(r.motivo) + '.</div>') : '') + '</div></div>';
      w.querySelectorAll('[data-q]').forEach(s => s.addEventListener('change', () => { if (s.value === '') delete resp[s.dataset.q]; else resp[s.dataset.q] = Number(s.value); const y = w.querySelector('.modal').scrollTop; pintar(); w.querySelector('.modal').scrollTop = y; }));
    };
    w.addEventListener('click', e => { if (e.target === w || e.target.closest('[data-x]')) w.remove(); });
    pintar(); document.body.appendChild(w);
  }

  /* ============ Contenido ============ */
  async function tabContenido() {
    let todos;
    try { todos = (await call('modulos', {})).modulos; } catch (e) { return manejar(e); }
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

  /* ============ Usuarios del panel ============ */
  async function tabUsuarios() {
    let us;
    try { us = (await call('usuarios')).usuarios; } catch (e) { return manejar(e); }
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
