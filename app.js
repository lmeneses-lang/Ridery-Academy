/* ============================================================
   Formación CX · aplicación del aspirante
   Inicio: Postúlate (datos + test → célula sugerida, fin) o
   Inicia sesión (aspirante aprobado o equipo del panel) → ruta (tronco común + célula)
   → lecciones (video, texto, imágenes) → examen → certificado
   ============================================================ */
(function () {
  'use strict';
  const { API, esc, prosa, icon, youtubeId, tipoImagen, toast, confirmar, lightbox, fecha, iniciales } = window.Elx;
  const app = document.getElementById('app');
  const call = (accion, data) => API.llamar('asp', 'aspirante', accion, data);
  const S = { asp: null, reglas: null, celulas: [], ruta: null, vista: null, abiertos: {}, post: null, examen: null, seccion: 'formacion', noLeidos: 0, boostActivo: true };
  let limpiezas = [];
  const limpiar = () => { limpiezas.forEach(f => { try { f(); } catch (e) {} }); limpiezas = []; };

  /* ---------- Arranque ---------- */
  async function iniciar() {
    if (!API.token('asp')) return verInicio();
    cargando();
    try { await refrescar(); verCurso({ tipo: 'inicio' }); } catch (e) { manejar(e); }
  }
  async function refrescar() {
    const r = await call('estado');
    S.asp = r.aspirante; S.reglas = r.reglas; S.celulas = r.celulas; S.ruta = r.ruta;
    S.noLeidos = r.noLeidos || 0; S.boostActivo = r.boostActivo !== false;
  }
  function manejar(e) {
    if (e.status === 401) { API.salir('asp'); S.asp = null; S.ruta = null; return verIngreso('Tu sesión expiró. Vuelve a entrar con tu usuario y contraseña.'); }
    toast(e.message || 'Algo falló. Intenta de nuevo.', 'bad');
  }
  function cargando() { limpiar(); app.innerHTML = topbar({}) + '<div class="loading"><div class="spinner" aria-label="Cargando"></div></div>'; enlazarTop(); }
  const celulaDe = id => S.celulas.find(c => c.id === id);

  /* ---------- Barra superior ---------- */
  function topbar({ curso }) {
    const p = S.ruta ? S.ruta.progreso : 0;
    return '<header class="topbar">' +
      (curso ? '<button class="icon-btn drawer-toggle" data-act="drawer" aria-label="Abrir contenido del curso">' + icon('menu') + '</button>' : '') +
      '<a class="brand" href="#" data-act="inicio"><img class="brand-mark" src="img/logo-192.png" alt="Ridery" width="32" height="32"><span>Ridery Academy <small>· Formación CX</small></span></a>' +
      (S.asp ? navAsp() : '') +
      '<div class="grow"></div>' +
      (curso ? '<div class="top-progress" title="Progreso del curso"><div class="bar"><span style="width:' + p + '%"></span></div><span class="small num"><b>' + p + '%</b><span class="hide-sm"> completado</span></span></div>' : '') +
      (S.asp ? '<div style="position:relative"><button class="user-chip" data-act="menu" aria-haspopup="true" aria-expanded="false"><span class="avatar avatar-top">' + icon('user') + '</span><span class="hide-sm small">' + esc(S.asp.nombre.split(' ')[0]) + '</span>' + icon('chev') + '</button>' +
        '<div class="menu" id="user-menu" hidden><div style="padding:8px 10px"><b>' + esc(S.asp.nombre) + '</b><div class="small muted">@' + esc(S.asp.usuario) + ' · C.I. ' + esc(S.asp.cedula) + '</div></div><hr class="divider">' +
        '<button data-act="salir">' + icon('out') + 'Salir</button></div></div>' : '') +
      '</header>';
  }
  /* Navegación del aspirante: Mi formación · Boost · Assessment (en el celular va abajo, como una app) */
  function navAsp() {
    const items = [['formacion', 'Mi formación', 'book'], ['boost', 'Boost', 'bolt'], ['assessment', 'Assessment', 'chat']];
    return '<nav class="asp-nav" aria-label="Secciones">' + items.map(([k, n, ic]) =>
      '<button type="button" data-sec="' + k + '" class="' + (S.seccion === k ? 'active' : '') + '"' + (S.seccion === k ? ' aria-current="page"' : '') + '>' + icon(ic) + '<span>' + n + '</span>' +
      (k === 'assessment' ? '<span class="badge" data-badge' + (S.noLeidos ? '' : ' hidden') + '>' + S.noLeidos + '</span>' : '') + '</button>').join('') + '</nav>';
  }
  function irSeccion(k) {
    if (k === 'boost') return verBoost();
    if (k === 'assessment') return verAssessment();
    verCurso({ tipo: 'inicio' }); window.scrollTo(0, 0);
  }
  function pintarBadge() {
    document.querySelectorAll('[data-badge]').forEach(b => { b.textContent = S.noLeidos; b.hidden = !S.noLeidos; });
  }
  // Revisa mensajes nuevos del equipo cada 20 s cuando no estás en el chat
  setInterval(async () => {
    if (!S.asp || S.seccion === 'assessment' || document.hidden) return;
    try { const r = await call('chatNoLeidos'); if (r.noLeidos !== S.noLeidos) { const nuevo = r.noLeidos > S.noLeidos; S.noLeidos = r.noLeidos; pintarBadge(); if (nuevo) toast('Tienes un mensaje nuevo del equipo en Assessment'); } } catch (e) {}
  }, 20000);

  function enlazarTop() {
    app.querySelectorAll('[data-sec]').forEach(b => b.addEventListener('click', () => irSeccion(b.dataset.sec)));
    app.querySelectorAll('[data-act="inicio"]').forEach(a => a.addEventListener('click', async e => {
      e.preventDefault();
      if (S.asp) return irSeccion('formacion');
      if (S.post && S.post.paso && !S.post.enviado && !await confirmar({ titulo: '¿Salir de la postulación?', texto: 'Tus respuestas quedan guardadas en este dispositivo para continuar después.', ok: 'Salir', cancelar: 'Seguir' })) return;
      verInicio();
    }));
    const m = app.querySelector('[data-act="menu"]');
    if (m) {
      const menu = app.querySelector('#user-menu');
      m.addEventListener('click', e => { e.stopPropagation(); menu.hidden = !menu.hidden; m.setAttribute('aria-expanded', String(!menu.hidden)); });

    }
    const s = app.querySelector('[data-act="salir"]');
    if (s) s.addEventListener('click', () => { API.salir('asp'); S.asp = null; S.ruta = null; verInicio(); });
  }

  document.addEventListener('click', e => {
    if (e.target.closest('.menu')) return;
    const menu = document.getElementById('user-menu'); if (menu) menu.hidden = true;
  });

  /* ---------- Inicio: Postúlate / Inicia sesión ---------- */
  function ladoMarca(titulo, texto, items) {
    return '<section class="login-side"><div class="stack-sm"><span class="eyebrow">Ridery Academy</span><h1>' + titulo + '</h1><span class="accent-rule"></span></div>' +
      '<p>' + texto + '</p><ul class="steps">' + items.map(it => '<li><span class="n">' + icon(it[0]) + '</span><div><b>' + it[1] + '</b><span>' + it[2] + '</span></div></li>').join('') + '</ul></section>';
  }
  function verInicio() {
    limpiar(); S.asp = null; S.ruta = null;
    const lado = ladoMarca('Tu camino como agente de <em>CX</em> empieza aquí', 'Elige cómo quieres entrar.', [
      ['plus', 'Postúlate', 'Cuéntanos de ti y responde un test corto. Te diremos en qué célula encajas mejor.'],
      ['book', 'Inicia sesión', 'Si ya te seleccionaron, entra con el usuario y la contraseña que te envió tu reclutador.']]);
    app.innerHTML = topbar({}) + '<main class="center-wrap"><div class="login">' + lado +
      '<div class="login-form"><div class="stack-sm"><h2>¿Cómo quieres entrar?</h2><p class="muted small">Elige una opción para continuar.</p></div><div class="choices">' +
      '<button class="choice" data-ir="postulate"><span class="ic">' + icon('plus') + '</span><span><b>Postúlate</b><span>Es tu primera vez. Completa tus datos y el test de perfil.</span></span>' + icon('right') + '</button>' +
      '<button class="choice alt" data-ir="aspirante"><span class="ic">' + icon('book') + '</span><span><b>Inicia sesión</b><span>Ya tienes usuario y contraseña. Entra a tu formación o al panel.</span></span>' + icon('right') + '</button>' +
      '</div></div></div></main>';
    enlazarTop();
    app.querySelector('[data-ir="postulate"]').addEventListener('click', () => verPostulacion());
    app.querySelector('[data-ir="aspirante"]').addEventListener('click', () => verIngreso());
    app.querySelector('.choice').focus();
  }

  /* ---------- Inicia sesión (aspirante o equipo) ---------- */
  function verIngreso(msg) {
    limpiar();
    const lado = ladoMarca('Bienvenido a Ridery Academy', 'Entra con el usuario y la contraseña que te dieron. Te llevamos a tu formación o al panel del equipo, según tu cuenta.', [
      ['book', 'Tronco común', 'Lo que todo agente de CX de Ridery necesita saber.'],
      ['tag', 'Tu célula', 'Videos, material y casos de la célula donde vas a trabajar.'],
      ['award', 'Exámenes', 'Un examen corto al final de cada módulo.']]);
    app.innerHTML = topbar({}) + '<main class="center-wrap"><div class="login">' + lado +
      '<form class="login-form" id="f-login" novalidate><button type="button" class="back-link" data-volver>' + icon('left') + 'Volver</button>' +
      '<div class="stack-sm"><h2>Inicia sesión</h2><p class="muted small">Si eres aspirante, continúas donde lo dejaste.</p></div>' +
      '<div class="form-error" role="alert"' + (msg ? '' : ' hidden') + '>' + esc(msg || '') + '</div>' +
      '<div class="field"><label for="lg-usuario">Usuario</label><input class="input" id="lg-usuario" autocomplete="username" autocapitalize="none" spellcheck="false" required></div>' +
      '<div class="field"><label for="lg-clave">Contraseña</label><div class="pass-wrap"><input class="input" id="lg-clave" type="password" autocomplete="current-password" required>' +
      '<button type="button" class="pass-eye" id="lg-ver" aria-label="Mostrar contraseña">Ver</button></div>' +
      '<span class="hint">Te los envía tu reclutador cuando te selecciona.' + (window.ElxDemo ? ' Demo: aspirante <b>demo</b> / <b>demo1234</b> · panel <b>admin</b> / <b>admin1234</b>.' : '') + '</span></div>' +
      '<button class="btn btn-primary btn-block" type="submit">Entrar' + icon('right') + '</button>' +
      '<p class="small muted">¿Todavía no te postulas? <a href="#" data-post>Postúlate aquí</a></p></form></div></main>';
    enlazarTop();
    const f = app.querySelector('#f-login');
    f.querySelector('[data-volver]').addEventListener('click', verInicio);
    f.querySelector('[data-post]').addEventListener('click', e => { e.preventDefault(); verPostulacion(); });
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const errBox = f.querySelector('.form-error');
      const usr = f.querySelector('#lg-usuario').value.trim(), clave = f.querySelector('#lg-clave').value;
      if (!usr || !clave) { errBox.hidden = false; errBox.textContent = 'Escribe tu usuario y tu contraseña.'; return; }
      const btn = f.querySelector('button[type="submit"]'); const txt = btn.innerHTML; btn.disabled = true; btn.textContent = 'Entrando…';
      try {
        const r = await API.llamar('asp', 'auth', 'login', { usuario: usr, clave });
        if (r.tipo === 'admin') {
          API.guardarToken('admin', r.token); Elx.Store.set('elx_admin_user', r.usuario);
          btn.textContent = 'Abriendo el panel…';
          location.href = 'admin.html' + (window.ElxDemo && !window.ELX_DEMO ? '?demo=1' : '');
          return;
        }
        API.guardarToken('asp', r.token);
        await iniciar();
      } catch (er) { errBox.hidden = false; errBox.textContent = er.message; btn.disabled = false; btn.innerHTML = txt; }
    });
    const ver = f.querySelector('#lg-ver'), inp = f.querySelector('#lg-clave');
    ver.addEventListener('click', () => { const v = inp.type === 'password'; inp.type = v ? 'text' : 'password'; ver.textContent = v ? 'Ocultar' : 'Ver'; ver.setAttribute('aria-label', v ? 'Ocultar contraseña' : 'Mostrar contraseña'); });
    f.querySelector('#lg-usuario').focus();
  }

  /* ---------- Postúlate: datos → test → revisión → resultado (fin) ---------- */
  const POST_KEY = 'elx_postulacion';
  const guardarPost = () => Elx.Store.set(POST_KEY, JSON.stringify({ datos: S.post.datos, resp: S.post.resp }));
  function cabeceraPaso(n, etiqueta, pct) {
    return '<div class="stepper-head"><div class="row-between"><span class="eyebrow">Postulación · Paso ' + n + ' de 3</span><span class="small muted num">' + etiqueta + '</span></div>' +
      '<div class="bar"><span style="width:' + pct + '%"></span></div></div>';
  }
  function verPostulacion() {
    limpiar();
    if (!S.post) {
      let guardado = {};
      try { guardado = JSON.parse(Elx.Store.get(POST_KEY) || '{}'); } catch (e) {}
      S.post = { datos: guardado.datos || {}, resp: guardado.resp || {}, preguntas: null, idx: 0, paso: 1 };
    }
    S.post.paso = 1;
    const d = S.post.datos;
    app.innerHTML = topbar({}) + '<main class="center-wrap"><form class="panel" id="f-post" novalidate>' + cabeceraPaso(1, 'Tus datos', 8) +
      '<div class="stack-sm"><h1>Cuéntanos de ti</h1><p class="muted">Con estos datos te contactamos si eres seleccionado.</p></div>' +
      '<div class="form-error" role="alert" hidden></div>' +
      '<div class="card stack"><div class="field"><label for="p-nombre">Nombre y apellido</label><input class="input" id="p-nombre" autocomplete="name" value="' + esc(d.nombre || '') + '" required></div>' +
      '<div class="two"><div class="field"><label for="p-cedula">Cédula</label><input class="input" id="p-cedula" inputmode="numeric" autocomplete="off" placeholder="Solo números" value="' + esc(d.cedula || '') + '" required></div>' +
      '<div class="field"><label for="p-ciudad">Ciudad</label><input class="input" id="p-ciudad" autocomplete="address-level2" placeholder="Ej. Caracas" value="' + esc(d.ciudad || '') + '"></div></div>' +
      '<div class="two"><div class="field"><label for="p-email">Correo</label><input class="input" id="p-email" type="email" autocomplete="email" value="' + esc(d.email || '') + '" required></div>' +
      '<div class="field"><label for="p-tel">Teléfono (WhatsApp)</label><input class="input" id="p-tel" type="tel" autocomplete="tel" placeholder="0414 000 0000" value="' + esc(d.telefono || '') + '" required></div></div></div>' +
      '<div class="nav-row"><button type="button" class="btn btn-secondary" id="p-back">' + icon('left') + 'Volver</button><button class="btn btn-primary" type="submit">Continuar al test' + icon('right') + '</button></div></form></main>';
    enlazarTop();
    const f = app.querySelector('#f-post');
    f.querySelector('#p-back').addEventListener('click', verInicio);
    f.querySelectorAll('input').forEach(i => i.addEventListener('input', () => {
      S.post.datos = { nombre: f.querySelector('#p-nombre').value.trim(), cedula: f.querySelector('#p-cedula').value.trim(), ciudad: f.querySelector('#p-ciudad').value.trim(),
        email: f.querySelector('#p-email').value.trim(), telefono: f.querySelector('#p-tel').value.trim() };
      guardarPost();
    }));
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const errBox = f.querySelector('.form-error');
      const v = id => f.querySelector('#' + id).value.trim();
      S.post.datos = { nombre: v('p-nombre'), cedula: v('p-cedula'), ciudad: v('p-ciudad'), email: v('p-email'), telefono: v('p-tel') };
      guardarPost();
      const falta = v('p-nombre').length < 3 ? 'Escribe tu nombre y apellido.' : !v('p-cedula') ? 'Escribe tu cédula.'
        : !/^\S+@\S+\.\S+$/.test(v('p-email')) ? 'Escribe un correo válido, por ejemplo nombre@gmail.com.' : v('p-tel').replace(/\D/g, '').length < 10 ? 'Escribe tu teléfono con código de área (11 dígitos).' : '';
      if (falta) { errBox.hidden = false; errBox.textContent = falta; window.scrollTo(0, 0); return; }
      const btn = f.querySelector('button[type="submit"]'); btn.disabled = true;
      try {
        await API.llamar('asp', 'auth', 'verificarCedula', { cedula: v('p-cedula') });
        if (!S.post.preguntas) S.post.preguntas = (await API.llamar('asp', 'auth', 'test', {})).preguntas;
        const primeraSin = S.post.preguntas.findIndex(p => S.post.resp[p._id] == null);
        if (primeraSin === -1) verRevisionTest(); else { S.post.idx = primeraSin; verPregunta(); }
      } catch (er) { errBox.hidden = false; errBox.textContent = er.message; btn.disabled = false; window.scrollTo(0, 0); }
    });
    f.querySelector('#p-nombre').focus();
  }
  function verPregunta() {
    limpiar();
    const t = S.post, p = t.preguntas[t.idx], n = t.preguntas.length, sel = t.resp[p._id];
    t.paso = 2;
    app.innerHTML = topbar({}) + '<main class="center-wrap"><div class="panel">' + cabeceraPaso(2, 'Pregunta ' + (t.idx + 1) + ' de ' + n, Math.round(15 + t.idx * 75 / n)) +
      (t.idx === 0 ? '<p class="muted">Responde con lo que harías en tu día a día. No hay respuestas buenas ni malas.</p>' : '') +
      '<h2 id="q-t">' + esc(p.texto) + '</h2>' +
      '<div class="options" role="radiogroup" aria-labelledby="q-t">' + p.opciones.map((o, i) =>
        '<button type="button" class="option' + (sel === i ? ' selected' : '') + '" role="radio" aria-checked="' + (sel === i) + '" data-i="' + i + '"><span class="key">' + String.fromCharCode(65 + i) + '</span><span>' + esc(o) + '</span></button>').join('') + '</div>' +
      '<p class="small muted hide-sm">Atajo: presiona A, B, C o D para elegir y Enter para seguir.</p>' +
      '<div class="nav-row"><button class="btn btn-secondary" id="q-prev">' + icon('left') + 'Atrás</button>' +
      '<button class="btn btn-primary" id="q-next"' + (sel == null ? ' disabled' : '') + '>' + (t.idx === n - 1 ? 'Revisar respuestas' : 'Siguiente') + icon('right') + '</button></div></div></main>';
    enlazarTop();
    const elegir = i => {
      if (i < 0 || i >= p.opciones.length) return;
      t.resp[p._id] = i; guardarPost();
      app.querySelectorAll('.option').forEach(b => { const on = Number(b.dataset.i) === i; b.classList.toggle('selected', on); b.setAttribute('aria-checked', String(on)); });
      app.querySelector('#q-next').disabled = false;
    };
    const siguiente = () => { if (t.resp[p._id] == null) return; if (t.idx === n - 1) verRevisionTest(); else { t.idx++; verPregunta(); } };
    app.querySelectorAll('.option').forEach(b => b.addEventListener('click', () => elegir(Number(b.dataset.i))));
    app.querySelector('#q-prev').addEventListener('click', () => { if (t.idx === 0) verPostulacion(); else { t.idx--; verPregunta(); } });
    app.querySelector('#q-next').addEventListener('click', siguiente);
    const tecla = e => {
      if (e.target.closest('input, textarea')) return;
      const k = e.key.toUpperCase();
      if (/^[A-H]$/.test(k)) elegir(k.charCodeAt(0) - 65);
      else if (/^[1-8]$/.test(k)) elegir(Number(k) - 1);
      else if (e.key === 'Enter' && !e.target.closest('button')) siguiente();
    };
    document.addEventListener('keydown', tecla);
    limpiezas.push(() => document.removeEventListener('keydown', tecla));
  }
  function verRevisionTest() {
    limpiar();
    const t = S.post, d = t.datos;
    t.paso = 3;
    app.innerHTML = topbar({}) + '<main class="center-wrap"><div class="panel">' + cabeceraPaso(3, 'Revisión', 95) +
      '<div class="stack-sm"><h1>Revisa y envía</h1><p class="muted">Puedes cambiar lo que quieras. Después de enviar ya no se puede modificar.</p></div>' +
      '<div class="card card-tight review"><div class="review-item"><span class="n">' + icon('users') + '</span><div class="grow stack-sm"><span class="small muted">Tus datos</span><b>' + esc(d.nombre) + ' · C.I. ' + esc(d.cedula) + '</b><span class="small">' + esc(d.email) + ' · ' + esc(d.telefono) + (d.ciudad ? ' · ' + esc(d.ciudad) : '') + '</span></div>' +
      '<button class="btn btn-ghost btn-sm" id="r-datos">Cambiar</button></div>' + t.preguntas.map((p, i) =>
        '<div class="review-item"><span class="n num">' + (i + 1) + '</span><div class="grow stack-sm"><span class="small muted">' + esc(p.texto) + '</span><b>' + esc(p.opciones[t.resp[p._id]] || 'Sin responder') + '</b></div>' +
        '<button class="btn btn-ghost btn-sm" data-ir="' + i + '">Cambiar</button></div>').join('') + '</div>' +
      '<div class="nav-row"><button class="btn btn-secondary" id="r-back">' + icon('left') + 'Atrás</button><button class="btn btn-primary" id="r-send">Enviar postulación</button></div></div></main>';
    enlazarTop();
    app.querySelector('#r-datos').addEventListener('click', verPostulacion);
    app.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => { t.idx = Number(b.dataset.ir); verPregunta(); }));
    app.querySelector('#r-back').addEventListener('click', () => { t.idx = t.preguntas.length - 1; verPregunta(); });
    app.querySelector('#r-send').addEventListener('click', async () => {
      const ok = await confirmar({ titulo: '¿Enviar tu postulación?', texto: 'Con tus respuestas vemos en qué célula encajas. No podrás cambiarlas después.', ok: 'Enviar' });
      if (!ok) return;
      const btn = app.querySelector('#r-send'); btn.disabled = true; btn.textContent = 'Enviando…';
      try {
        const r = await API.llamar('asp', 'auth', 'postular', { datos: t.datos, respuestas: t.resp });
        Elx.Store.del(POST_KEY); S.post = null;
        verFinPostulacion(r);
      } catch (e) { btn.disabled = false; btn.textContent = 'Enviar postulación'; manejar(e); }
    });
  }
  function verFinPostulacion(r) {
    limpiar();
    const asignado = r.estado === 'asignado' && r.celula;
    app.innerHTML = topbar({}) + '<main class="center-wrap"><div class="panel"><div class="card stack">' +
      '<span class="pill pill-ok" style="align-self:flex-start">' + icon('check') + 'Postulación enviada</span>' +
      (asignado
        ? '<div class="result-hero"><h1>¡Gracias, ' + esc(r.nombre.split(' ')[0]) + '! Tu perfil encaja en</h1><span class="cell-badge">' + icon('tag') + esc(r.celula.nombre) + '</span><p class="muted">' + esc(r.celula.descripcion || '') + '</p></div>'
        : '<div class="result-hero"><h1>¡Gracias, ' + esc(r.nombre.split(' ')[0]) + '!</h1><p class="muted">Tus respuestas encajan con más de una célula. El equipo de reclutamiento revisará tu perfil para ubicarte donde mejor te vaya.</p></div>') +
      '<hr class="divider"><div class="stack-sm"><h3>Qué sigue</h3><ul class="steps" style="color:var(--fg)">' +
      '<li><span class="n">' + icon('users') + '</span><div><b>Revisamos tu postulación</b><span class="muted">El equipo de reclutamiento evalúa tu perfil.</span></div></li>' +
      '<li><span class="n">' + icon('tag') + '</span><div><b>Te contactamos</b><span class="muted">Si eres seleccionado, te enviamos tu usuario y contraseña por correo o WhatsApp.</span></div></li>' +
      '<li><span class="n">' + icon('book') + '</span><div><b>Empiezas tu formación</b><span class="muted">Entras por «Inicia sesión» con tu usuario y contraseña.</span></div></li></ul></div>' +
      '<div class="row"><button class="btn btn-secondary" id="fin-ok">Volver al inicio</button></div></div></div></main>';
    enlazarTop();
    app.querySelector('#fin-ok').addEventListener('click', verInicio);
  }

  /* ---------- Curso: estructura ---------- */
  function itemsPlanos() {
    const out = [];
    S.ruta.modulos.forEach(m => {
      m.lecciones.forEach(l => out.push({ tipo: 'leccion', id: l.id, modId: m._id }));
      if (m.examen.preguntas) out.push({ tipo: 'examen', modId: m._id });
    });
    if (S.ruta.completo) out.push({ tipo: 'certificado' });
    return out;
  }
  const mismaVista = (a, b) => a && b && a.tipo === b.tipo && (a.id || a.modId || '') === (b.id || b.modId || '');
  function vecino(v, delta) {
    const lista = itemsPlanos();
    const i = lista.findIndex(x => x.tipo === v.tipo && (v.tipo === 'leccion' ? x.id === v.id : x.modId === v.modId));
    const n = lista[i + delta];
    if (!n) return null;
    const m = n.modId && S.ruta.modulos.find(x => x._id === n.modId);
    if (m && m.estado === 'bloqueado') return null;
    return n;
  }
  function siguientePendiente() {
    for (const m of S.ruta.modulos) {
      if (m.estado === 'bloqueado') return null;
      if (m.estado === 'aprobado') continue;
      if (m.estado === 'agotado') return { tipo: 'agotado', m };
      const l = m.lecciones.find(x => !x.completada);
      if (l) return { tipo: 'leccion', id: l.id, modId: m._id, m, l };
      if (m.examen.preguntas) return { tipo: 'examen', modId: m._id, m };
    }
    return null;
  }
  function moduloDe(v) {
    if (v.modId) return S.ruta.modulos.find(m => m._id === v.modId);
    if (v.id) return S.ruta.modulos.find(m => m.lecciones.some(l => l.id === v.id));
    return null;
  }

  function sidebar(v) {
    const r = S.ruta, cel = celulaDe(S.asp.celula);
    const activo = moduloDe(v);
    const sig = siguientePendiente();
    const abrir = activo ? activo._id : (sig && sig.m ? sig.m._id : (r.modulos[0] && r.modulos[0]._id));
    let html = '<aside class="sidebar" id="sidebar" aria-label="Contenido del curso"><div class="sidebar-head"><div class="row-between"><span class="eyebrow">Tu ruta</span>' +
      '<button class="icon-btn drawer-toggle" data-act="drawer" aria-label="Cerrar">' + icon('x') + '</button></div>' +
      '<h3>' + (cel ? 'Célula ' + esc(cel.nombre) : 'Tronco común') + '</h3>' +
      (!cel ? '<span class="pill pill-warn" style="align-self:flex-start">Célula en revisión</span>' : '') +
      '<div class="bar' + (r.completo ? ' ok' : '') + '"><span style="width:' + r.progreso + '%"></span></div><span class="small muted num">' + r.progreso + '% completado</span></div>';
    let n = 0;
    let grupo = null;
    r.modulos.forEach(m => {
      if (m.celula !== grupo) {
        grupo = m.celula;
        html += '<div class="eyebrow" style="padding:16px 20px 4px">' + (m.celula === 'COMUN' ? 'Tronco común' : esc((celulaDe(m.celula) || {}).nombre || m.celula)) + '</div>';
      }
      n++;
      const abierto = S.abiertos[m._id] != null ? S.abiertos[m._id] : m._id === abrir;
      const bloq = m.estado === 'bloqueado';
      const hechas = m.lecciones.filter(l => l.completada).length;
      const meta = bloq ? 'Bloqueado' : m.estado === 'aprobado' ? 'Aprobado' : m.estado === 'agotado' ? 'Sin intentos' : hechas + ' de ' + m.lecciones.length + ' lecciones';
      html += '<div class="mod' + (abierto ? ' open' : '') + '" data-mod="' + esc(m._id) + '"><button class="mod-head" aria-expanded="' + abierto + '">' +
        dot(m.estado === 'aprobado' ? 'done' : bloq ? 'lock' : m.estado === 'agotado' ? 'fail' : '', n) +
        '<span class="grow"><span class="mod-title" style="display:block">' + esc(m.titulo) + '</span><span class="mod-meta">' + meta + '</span></span>' + icon('chev', 'chev') + '</button><div class="mod-items">';
      m.lecciones.forEach(l => {
        const act = v.tipo === 'leccion' && v.id === l.id;
        html += '<button class="item' + (act ? ' active' : '') + '" data-ir="leccion" data-id="' + esc(l.id) + '"' + (bloq ? ' disabled' : '') + (act ? ' aria-current="page"' : '') + '>' +
          dot(l.completada ? 'done' : bloq ? 'lock' : '') + '<span class="grow">' + esc(l.titulo) + '</span>' + (l.youtube ? '<span class="muted">' + icon('play') + '</span>' : '') + '</button>';
      });
      if (m.examen.preguntas) {
        const act = v.tipo === 'examen' && v.modId === m._id;
        html += '<button class="item' + (act ? ' active' : '') + '" data-ir="examen" data-mod="' + esc(m._id) + '"' + (bloq ? ' disabled' : '') + '>' +
          dot(m.examen.aprobado ? 'done' : m.estado === 'agotado' ? 'fail' : (bloq || !m.examen.habilitado) ? 'lock' : '') +
          '<span class="grow">Examen del módulo</span><span class="small muted num">' + (m.examen.mejor != null ? m.examen.mejor + '%' : m.examen.preguntas + ' preg.') + '</span></button>';
      }
      html += '</div></div>';
    });
    if (S.asp.celula && !r.tieneCelula) html += '<div class="small muted" style="padding:16px 20px">Tu célula todavía no tiene módulos cargados.</div>';
    if (r.completo) html += '<div class="mod"><button class="item' + (v.tipo === 'certificado' ? ' active' : '') + '" data-ir="certificado" style="padding:14px 20px">' + dot('done') + '<b class="grow">Certificado</b>' + icon('award') + '</button></div>';
    return html + '</aside>';
  }
  function dot(tipo, n) {
    const ic = tipo === 'done' ? icon('check') : tipo === 'lock' ? icon('lock') : tipo === 'fail' ? icon('x') : (n ? '<span class="small num" style="font-weight:700">' + n + '</span>' : '');
    return '<span class="status-dot ' + tipo + '">' + ic + '</span>';
  }

  function verCurso(v) {
    limpiar();
    S.vista = v; S.seccion = 'formacion';
    app.innerHTML = topbar({ curso: true }) + '<div class="course">' + sidebar(v) + '<main class="content" id="main"><div class="content-inner" id="inner"></div></main></div>';
    enlazarTop();
    const sb = app.querySelector('#sidebar');
    let bd = null;
    const cerrarDrawer = () => { sb.classList.remove('show'); if (bd) { bd.remove(); bd = null; } };
    app.querySelectorAll('[data-act="drawer"]').forEach(b => b.addEventListener('click', () => {
      if (sb.classList.contains('show')) return cerrarDrawer();
      sb.classList.add('show'); bd = document.createElement('div'); bd.className = 'backdrop'; bd.addEventListener('click', cerrarDrawer); document.body.appendChild(bd);
    }));
    limpiezas.push(() => { if (bd) bd.remove(); });
    sb.querySelectorAll('.mod-head').forEach(h => h.addEventListener('click', () => {
      const mod = h.parentElement; const on = !mod.classList.contains('open');
      mod.classList.toggle('open', on); h.setAttribute('aria-expanded', String(on)); S.abiertos[mod.dataset.mod] = on;
    }));
    sb.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => {
      const t = b.dataset.ir;
      ir(t === 'leccion' ? { tipo: t, id: b.dataset.id } : t === 'examen' ? { tipo: t, modId: b.dataset.mod } : { tipo: t });
    }));
    const inner = app.querySelector('#inner');
    if (v.tipo === 'leccion') vistaLeccion(inner, v);
    else if (v.tipo === 'examen') vistaExamenIntro(inner, v);
    else if (v.tipo === 'certificado') vistaCertificado(inner);
    else vistaInicio(inner);
    const act = sb.querySelector('.item.active'); if (act && act.scrollIntoView) act.scrollIntoView({ block: 'nearest' });
  }
  function ir(v) { verCurso(v); window.scrollTo(0, 0); const m = app.querySelector('#main h1'); if (m) { m.setAttribute('tabindex', '-1'); m.focus({ preventScroll: true }); } }

  /* ---------- Inicio del curso ---------- */
  function vistaInicio(el) {
    const r = S.ruta, cel = celulaDe(S.asp.celula), sig = siguientePendiente();
    const aprob = r.modulos.filter(m => m.estado === 'aprobado').length;
    const notas = r.modulos.filter(m => m.examen.mejor != null).map(m => m.examen.mejor);
    const prom = notas.length ? Math.round(notas.reduce((a, b) => a + b, 0) / notas.length) + '%' : '—';
    let cont = '';
    if (r.completo) cont = '<div class="continue"><div class="stack-sm"><span class="eyebrow">Formación completada</span><h2>Aprobaste todos los módulos</h2></div><button class="btn" data-go="certificado">Ver certificado' + icon('award') + '</button></div>';
    else if (sig && sig.tipo === 'leccion') cont = '<div class="continue"><div class="stack-sm"><span class="eyebrow">' + (r.progreso ? 'Continúa donde lo dejaste' : 'Empieza aquí') + '</span><h2>' + esc(sig.l.titulo) + '</h2><span class="small" style="opacity:.85">' + esc(sig.m.titulo) + '</span></div><button class="btn" data-go="sig">' + (r.progreso ? 'Continuar' : 'Empezar') + icon('right') + '</button></div>';
    else if (sig && sig.tipo === 'examen') cont = '<div class="continue"><div class="stack-sm"><span class="eyebrow">Siguiente paso</span><h2>Examen: ' + esc(sig.m.titulo) + '</h2><span class="small" style="opacity:.85">' + sig.m.examen.preguntas + ' preguntas · nota mínima ' + S.reglas.notaMinima + '%</span></div><button class="btn" data-go="sig">Ir al examen' + icon('right') + '</button></div>';
    else if (sig && sig.tipo === 'agotado') cont = '<div class="notice">Usaste todos los intentos del examen de <b>' + esc(sig.m.titulo) + '</b>. Tu supervisor puede habilitarte un nuevo intento.</div>';
    else if (!S.asp.celula) cont = '<div class="notice info">Terminaste el tronco común. Tu formación de célula se habilita cuando un supervisor te asigne una.</div>';
    else if (!r.tieneCelula) cont = '<div class="notice info">Terminaste el tronco común. La formación de ' + esc(cel ? cel.nombre : 'tu célula') + ' todavía no tiene módulos cargados; te avisaremos cuando esté lista.</div>';

    let n = 0;
    el.innerHTML = '<div class="stack-sm"><span class="eyebrow">Inicio</span><h1>Hola, ' + esc(S.asp.nombre.split(' ')[0]) + '</h1><p class="muted">' + (cel ? 'Célula ' + esc(cel.nombre) : 'Célula en revisión') + '</p></div>' +
      (!S.asp.celula ? '<div class="notice">Tu perfil está en revisión. Mientras tanto puedes avanzar con el tronco común.</div>' : '') + cont +
      '<div class="stats"><div class="stat"><span class="small muted">Progreso</span><b>' + r.progreso + '%</b></div><div class="stat"><span class="small muted">Módulos aprobados</span><b>' + aprob + ' / ' + r.modulos.length + '</b></div><div class="stat"><span class="small muted">Promedio de exámenes</span><b>' + prom + '</b></div></div>' +
      '<div class="stack-sm"><h2>Módulos</h2><div class="mod-list">' + r.modulos.map(m => {
        n++;
        const est = { aprobado: ['pill-ok', 'Aprobado'], disponible: ['pill-brand', m.lecciones.some(l => l.completada) || m.examen.intentos ? 'En curso' : 'Disponible'], bloqueado: ['', 'Bloqueado'], agotado: ['pill-bad', 'Sin intentos'] }[m.estado];
        return '<div class="mod-card"><span class="idx num">' + String(n).padStart(2, '0') + '</span><div class="stack-sm" style="gap:2px;min-width:0"><b>' + esc(m.titulo) + '</b><span class="small muted">' +
          (m.celula === 'COMUN' ? 'Tronco común' : esc((celulaDe(m.celula) || {}).nombre || m.celula)) + ' · ' + m.lecciones.length + ' lecciones' + (m.examen.preguntas ? ' · examen' : '') + '</span></div>' +
          '<span class="pill ' + est[0] + '">' + (m.estado === 'bloqueado' ? icon('lock') : '') + est[1] + '</span></div>';
      }).join('') + '</div>' + (r.modulos.length > 1 ? '<p class="small muted">Los módulos se desbloquean en orden: aprueba el examen de uno para pasar al siguiente.</p>' : '') + '</div>';
    el.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.go === 'certificado') return ir({ tipo: 'certificado' });
      const s = siguientePendiente(); if (s) ir(s.tipo === 'leccion' ? { tipo: 'leccion', id: s.id } : { tipo: 'examen', modId: s.modId });
    }));
  }

  /* ---------- Lección ---------- */
  function vistaLeccion(el, v) {
    const m = moduloDe(v);
    if (!m || m.estado === 'bloqueado') { el.innerHTML = '<div class="empty">' + icon('lock') + '<p>Esta lección se desbloquea cuando apruebes el módulo anterior.</p></div>'; return; }
    const idx = m.lecciones.findIndex(l => l.id === v.id), l = m.lecciones[idx];
    const vid = youtubeId(l.youtube);
    const thr = S.reglas.porcentajeVideo;
    const prev = vecino(v, -1), next = vecino(v, 1);
    el.innerHTML = '<nav class="crumbs" aria-label="Ubicación"><span>' + esc(m.titulo) + '</span><span>›</span><span>Lección ' + (idx + 1) + ' de ' + m.lecciones.length + '</span></nav>' +
      '<h1>' + esc(l.titulo) + '</h1>' +
      (vid ? '<div class="stack-sm"><div class="video" id="video"></div><div class="watch" id="watch"></div></div>' : '') +
      (l.contenido ? '<div class="prose">' + prosa(l.contenido) + '</div>' : '') +
      (l.imagenes.length ? '<div class="stack-sm"><h3>Material de apoyo</h3><div class="gallery">' + l.imagenes.map((u, i) => {
        const t = tipoImagen(u);
        if (t === 'lightshot-pagina') return '<figure><a class="link-card" href="' + esc(u) + '" target="_blank" rel="noopener">' + icon('ext') + '<span>Abrir captura ' + (i + 1) + ' en Lightshot</span></a></figure>';
        if (t !== 'directa') return '';
        return '<figure><button class="thumb" data-src="' + esc(u) + '" aria-label="Ampliar imagen ' + (i + 1) + '"><img src="' + esc(u) + '" alt="Imagen ' + (i + 1) + ' de la lección" loading="lazy"></button><figcaption>Imagen ' + (i + 1) + ' · toca para ampliar</figcaption></figure>';
      }).join('') + '</div></div>' : '') +
      '<div class="lesson-foot"><button class="btn btn-secondary" id="l-prev"' + (prev ? '' : ' disabled') + '>' + icon('left') + 'Anterior</button>' +
      '<button class="btn btn-primary" id="l-next"></button></div>';
    el.querySelectorAll('.thumb').forEach(b => b.addEventListener('click', () => lightbox(b.dataset.src)));
    el.querySelector('#l-prev').addEventListener('click', () => prev && ir(prev));

    const btn = el.querySelector('#l-next');
    let pct = l.pct || 0;
    const pintarBoton = () => {
      if (l.completada) { btn.disabled = !next; btn.innerHTML = next ? 'Siguiente' + icon('right') : 'Lección completada'; }
      else { const falta = vid && pct < thr; btn.disabled = falta; btn.innerHTML = icon('check') + 'Marcar como completada'; btn.title = falta ? 'Mira al menos el ' + thr + '% del video' : ''; }
    };
    const pintarWatch = () => {
      const w = el.querySelector('#watch'); if (!w) return;
      const ok = pct >= thr;
      w.innerHTML = '<div class="bar' + (ok ? ' ok' : '') + '"><span style="width:' + pct + '%"></span></div><span class="num ' + (ok ? '' : 'muted') + '" style="' + (ok ? 'color:var(--ok);font-weight:600' : '') + '">' +
        (ok ? 'Video visto ✓' : 'Visto ' + pct + '% · necesitas ' + thr + '% para continuar') + '</span>';
    };
    pintarBoton(); pintarWatch();

    let ultimoEnvio = pct;
    const reportar = async (forzar) => {
      if (!forzar && pct - ultimoEnvio < 10 && !(pct >= thr && ultimoEnvio < thr)) return;
      ultimoEnvio = pct;
      try { const r = await call('progreso', { leccionId: l.id, pct }); S.ruta = r.ruta; } catch (e) { /* se reintenta en el próximo reporte */ }
    };
    const avanzar = nuevo => { if (nuevo <= pct) return; pct = Math.min(100, nuevo); pintarWatch(); pintarBoton(); reportar(false); };

    btn.addEventListener('click', async () => {
      if (l.completada) { if (next) ir(next); return; }
      btn.disabled = true;
      try {
        const r = await call('progreso', { leccionId: l.id, pct, completar: true });
        S.ruta = r.ruta;
        toast('Lección completada');
        const n = vecino(v, 1);
        n ? ir(n) : verCurso({ tipo: 'inicio' });
      } catch (e) { btn.disabled = false; manejar(e); }
    });

    if (vid) montarVideo(el.querySelector('#video'), vid, l.id, avanzar, () => reportar(true));
  }

  /* Reproductor: cuenta solo los segundos realmente reproducidos (adelantar no suma) */
  let ytPromesa = null;
  function cargarYT() {
    if (ytPromesa) return ytPromesa;
    ytPromesa = new Promise((res, rej) => {
      if (window.YT && window.YT.Player) return res();
      const previo = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (previo) previo(); res(); };
      const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.onerror = rej; document.head.appendChild(s);
    });
    return ytPromesa;
  }
  function montarVideo(cont, vid, lecId, avanzar, alSalir) {
    const key = 'elx_w_' + lecId;
    let vistos = new Set();
    try { vistos = new Set(JSON.parse(Elx.Store.get(key) || '[]')); } catch (e) {}
    const guardar = () => Elx.Store.set(key, JSON.stringify([...vistos]));
    limpiezas.push(alSalir);

    if (window.ElxDemo) {
      // En la demo no se puede incrustar YouTube: se simula la reproducción
      const dur = 60; let t = 0, timer = null;
      cont.innerHTML = '<div class="video-sim"><button class="play" aria-label="Reproducir">' + icon('play') + '</button><b>Vista previa del reproductor</b>' +
        '<span class="small" style="opacity:.8;max-width:42ch">En la versión publicada aquí se ve el video de YouTube. En la demo, presiona reproducir para simularlo.</span>' +
        '<a class="small" style="color:#fff" href="https://www.youtube.com/watch?v=' + vid + '" target="_blank" rel="noopener">Abrir el video en YouTube</a></div>';
      const play = cont.querySelector('.play');
      play.addEventListener('click', () => {
        if (timer) { clearInterval(timer); timer = null; play.innerHTML = icon('play'); return; }
        play.innerHTML = '<svg class="i" viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>';
        timer = setInterval(() => {
          vistos.add(t); t = (t + 1) % dur; guardar();
          avanzar(Math.round(vistos.size * 100 / dur));
          if (vistos.size >= dur) { clearInterval(timer); timer = null; play.innerHTML = icon('check'); }
        }, 80);
      });
      limpiezas.push(() => clearInterval(timer));
      return;
    }

    cont.innerHTML = '<div id="yt-' + lecId + '"></div>';
    let player = null, poll = null, vivo = true;
    limpiezas.push(() => { vivo = false; clearInterval(poll); try { player && player.destroy(); } catch (e) {} });
    cargarYT().then(() => {
      if (!vivo) return;
      player = new YT.Player('yt-' + lecId, {
        videoId: vid, playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => {
            poll = setInterval(() => {
              if (!player || typeof player.getPlayerState !== 'function') return;
              if (player.getPlayerState() !== YT.PlayerState.PLAYING) return;
              const d = Math.floor(player.getDuration() || 0); if (!d) return;
              vistos.add(Math.floor(player.getCurrentTime())); guardar();
              avanzar(Math.round(Math.min(vistos.size, d) * 100 / d));
            }, 1000);
          },
          onStateChange: e => { if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) alSalir(); }
        }
      });
    }).catch(() => {
      cont.innerHTML = '<div class="video-sim"><b>No se pudo cargar el video</b><a style="color:#fff" href="https://www.youtube.com/watch?v=' + vid + '" target="_blank" rel="noopener">Abrirlo en YouTube</a></div>';
    });
  }

  /* ---------- Examen ---------- */
  function vistaExamenIntro(el, v) {
    const m = moduloDe(v);
    if (!m || m.estado === 'bloqueado') { el.innerHTML = '<div class="empty">' + icon('lock') + '<p>Este examen se desbloquea cuando apruebes el módulo anterior.</p></div>'; return; }
    const e = m.examen, faltan = m.lecciones.filter(l => !l.completada);
    let cuerpo;
    if (e.aprobado) cuerpo = '<div class="feedback ok">' + icon('check') + '<span class="body">Aprobaste este examen con <b>' + e.mejor + '%</b>.</span></div><div class="row">' + (vecino(v, 1) ? '<button class="btn btn-primary" id="x-next">Siguiente' + icon('right') + '</button>' : '') + '</div>';
    else if (m.estado === 'agotado') cuerpo = '<div class="feedback bad">' + icon('alert') + '<span class="body">Usaste tus ' + S.reglas.intentosMax + ' intentos. Tu mejor nota fue <b>' + (e.mejor || 0) + '%</b>. Tu supervisor puede habilitarte un nuevo intento.</span></div>';
    else if (faltan.length) cuerpo = '<div class="notice">Completa ' + (faltan.length === 1 ? 'la lección pendiente' : 'las ' + faltan.length + ' lecciones pendientes') + ' para habilitar el examen.</div><div class="row"><button class="btn btn-primary" id="x-pend">Ir a «' + esc(faltan[0].titulo) + '»' + icon('right') + '</button></div>';
    else cuerpo = '<div class="row"><button class="btn btn-primary" id="x-start">' + (e.intentos ? 'Intentar de nuevo' : 'Comenzar examen') + icon('right') + '</button></div>';
    el.innerHTML = '<nav class="crumbs"><span>' + esc(m.titulo) + '</span><span>›</span><span>Examen</span></nav><h1>Examen del módulo</h1>' +
      '<div class="stats"><div class="stat"><span class="small muted">Preguntas</span><b>' + e.preguntas + '</b></div><div class="stat"><span class="small muted">Nota mínima</span><b>' + S.reglas.notaMinima + '%</b></div><div class="stat"><span class="small muted">Intentos restantes</span><b>' + e.restantes + ' de ' + S.reglas.intentosMax + '</b></div></div>' +
      (e.intentos && !e.aprobado ? '<p class="muted">Tu mejor nota hasta ahora: <b class="num">' + (e.mejor || 0) + '%</b></p>' : '') +
      '<p class="muted">Todas las preguntas son de selección simple. Las preguntas y opciones cambian de orden en cada intento. Antes de enviar podrás revisar tus respuestas.</p>' + cuerpo;
    const b1 = el.querySelector('#x-start'); if (b1) b1.addEventListener('click', () => empezarExamen(el, m));
    const b2 = el.querySelector('#x-pend'); if (b2) b2.addEventListener('click', () => ir({ tipo: 'leccion', id: faltan[0].id }));
    const b3 = el.querySelector('#x-next'); if (b3) b3.addEventListener('click', () => ir(vecino(v, 1)));
  }
  async function empezarExamen(el, m) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    let ex;
    try { ex = await call('examen', { moduloId: m._id }); } catch (e) { manejar(e); return verCurso(S.vista); }
    const resp = {};
    el.innerHTML = '<nav class="crumbs"><span>' + esc(m.titulo) + '</span><span>›</span><span>Examen</span></nav><h1>Examen del módulo</h1>' +
      '<p class="muted">Nota mínima ' + ex.notaMinima + '% · intento ' + (S.reglas.intentosMax - ex.restantes + 1) + ' de ' + S.reglas.intentosMax + '</p>' +
      ex.preguntas.map((p, i) => '<fieldset class="exam-q" data-q="' + esc(p.id) + '" style="margin:0"><h3><span class="n num">' + (i + 1) + '.</span><span>' + esc(p.texto) + '</span></h3><div class="options" role="radiogroup">' +
        p.opciones.map((o, j) => '<button type="button" class="option" role="radio" aria-checked="false" data-i="' + o.i + '"><span class="key">' + String.fromCharCode(65 + j) + '</span><span>' + esc(o.texto) + '</span></button>').join('') + '</div></fieldset>').join('') +
      '<div class="sticky-submit"><span class="small num" id="x-count">0 de ' + ex.preguntas.length + ' respondidas</span><div class="row"><button class="btn btn-ghost" id="x-cancel">Salir sin enviar</button><button class="btn btn-primary" id="x-send">Enviar examen</button></div></div>';
    const contar = () => { el.querySelector('#x-count').textContent = Object.keys(resp).length + ' de ' + ex.preguntas.length + ' respondidas'; };
    el.querySelectorAll('.exam-q').forEach(fs => fs.querySelectorAll('.option').forEach(b => b.addEventListener('click', () => {
      resp[fs.dataset.q] = Number(b.dataset.i);
      fs.classList.remove('missing');
      fs.querySelectorAll('.option').forEach(x => { const on = x === b; x.classList.toggle('selected', on); x.setAttribute('aria-checked', String(on)); });
      contar();
    })));
    el.querySelector('#x-cancel').addEventListener('click', async () => {
      if (!Object.keys(resp).length || await confirmar({ titulo: '¿Salir sin enviar?', texto: 'Perderás las respuestas marcadas. No se descuenta ningún intento.', ok: 'Salir', cancelar: 'Seguir respondiendo' })) verCurso(S.vista);
    });
    el.querySelector('#x-send').addEventListener('click', async () => {
      const faltan = ex.preguntas.filter(p => resp[p.id] == null);
      if (faltan.length) {
        faltan.forEach(p => el.querySelector('[data-q="' + CSS.escape(p.id) + '"]').classList.add('missing'));
        el.querySelector('[data-q="' + CSS.escape(faltan[0].id) + '"]').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return toast('Te faltan ' + faltan.length + (faltan.length === 1 ? ' pregunta' : ' preguntas') + ' por responder.', 'bad');
      }
      const ok = await confirmar({ titulo: '¿Enviar examen?', texto: 'Se usará 1 de tus ' + ex.restantes + ' intentos restantes.', ok: 'Enviar' });
      if (!ok) return;
      const b = el.querySelector('#x-send'); b.disabled = true; b.textContent = 'Enviando…';
      try {
        const r = await call('enviarExamen', { moduloId: m._id, respuestas: resp });
        S.ruta = r.ruta;
        if (r.ruta.completo && !S.asp.completadoFecha) S.asp.completadoFecha = new Date().toISOString();
        verCurso(S.vista);
        vistaResultadoExamen(app.querySelector('#inner'), m, r);
        window.scrollTo(0, 0);
      } catch (e) { b.disabled = false; b.textContent = 'Enviar examen'; manejar(e); }
    });
  }
  function anillo(nota, ok) {
    const r = 52, c = 2 * Math.PI * r, off = c * (1 - nota / 100);
    return '<svg class="score-ring" viewBox="0 0 120 120" role="img" aria-label="Nota ' + nota + '%"><circle cx="60" cy="60" r="' + r + '" fill="none" stroke="var(--surface-2)" stroke-width="10"/>' +
      '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="' + (ok ? 'var(--ok)' : 'var(--bad)') + '" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 60 60)"/>' +
      '<text x="60" y="73" text-anchor="middle" font-family="Bebas Neue, Urbanist, sans-serif" font-size="38" font-weight="400" fill="var(--fg)">' + nota + '%</text></svg>';
  }
  function vistaResultadoExamen(el, m, r) {
    const siguiente = vecino({ tipo: 'examen', modId: m._id }, 1);
    el.innerHTML = '<nav class="crumbs"><span>' + esc(m.titulo) + '</span><span>›</span><span>Resultado</span></nav>' +
      '<div class="card score">' + anillo(r.nota, r.aprobado) + '<div class="stack-sm grow"><h1>' + (r.aprobado ? '¡Aprobaste!' : 'No alcanzaste la nota mínima') + '</h1>' +
      '<p class="muted">' + r.correctas + ' de ' + r.total + ' correctas · nota mínima ' + r.notaMinima + '%' + (!r.aprobado ? ' · te ' + (r.restantes === 1 ? 'queda 1 intento' : 'quedan ' + r.restantes + ' intentos') : '') + '</p>' +
      '<div class="row">' + (r.aprobado
        ? (r.ruta.completo ? '<button class="btn btn-primary" data-go="cert">Ver certificado' + icon('award') + '</button>' : siguiente ? '<button class="btn btn-primary" data-go="next">Continuar' + icon('right') + '</button>' : '<button class="btn btn-primary" data-go="home">Ir al inicio</button>')
        : (r.restantes ? '<button class="btn btn-secondary" data-go="repaso">Repasar lecciones</button><button class="btn btn-primary" data-go="retry">Intentar de nuevo</button>' : '<button class="btn btn-secondary" data-go="home">Ir al inicio</button>')) + '</div></div></div>' +
      (!r.aprobado && r.restantes === 0 ? '<div class="notice">Usaste todos tus intentos. Tu supervisor puede habilitarte uno nuevo.</div>' : '') +
      '<h2>Tus respuestas</h2>' + r.detalle.map((d, i) =>
        '<div class="exam-q"><h3><span class="n num">' + (i + 1) + '.</span><span>' + esc(d.texto) + '</span></h3>' +
        '<div class="feedback ' + (d.ok ? 'ok' : 'bad') + '">' + icon(d.ok ? 'check' : 'x') + '<div class="body stack-sm" style="gap:4px"><span>Tu respuesta: <b>' + esc(d.elegida) + '</b></span>' +
        (!d.ok && d.correcta ? '<span>Respuesta correcta: <b>' + esc(d.correcta) + '</b></span>' : '') +
        (d.explicacion ? '<span class="muted">' + esc(d.explicacion) + '</span>' : '') + '</div></div></div>').join('') +
      (!r.aprobado && r.restantes ? '<p class="small muted">Las respuestas correctas se muestran cuando apruebas o al terminar tus intentos.</p>' : '');
    el.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => {
      const g = b.dataset.go;
      if (g === 'next') ir(siguiente);
      else if (g === 'cert') ir({ tipo: 'certificado' });
      else if (g === 'home') ir({ tipo: 'inicio' });
      else if (g === 'repaso') ir({ tipo: 'leccion', id: m.lecciones[0].id });
      else if (g === 'retry') { const mm = moduloDe({ modId: m._id }); empezarExamen(app.querySelector('#inner'), mm); }
    }));
  }

  /* ---------- Certificado ---------- */
  function vistaCertificado(el) {
    if (!S.ruta.completo) { el.innerHTML = '<div class="empty">' + icon('award') + '<p>El certificado aparece cuando apruebes todos los módulos.</p></div>'; return; }
    const cel = celulaDe(S.asp.celula);
    const notas = S.ruta.modulos.filter(m => m.examen.mejor != null).map(m => m.examen.mejor);
    const prom = notas.length ? Math.round(notas.reduce((a, b) => a + b, 0) / notas.length) : null;
    el.innerHTML = '<div class="cert"><div class="row-between"><span class="brand"><img class="brand-mark" src="img/logo-192.png" alt="Ridery" width="32" height="32"><span>Ridery Academy</span></span><span class="pill pill-ok">' + icon('check') + 'Completado</span></div>' +
      '<span class="eyebrow">Certificado de formación</span><div class="stack-sm"><span class="muted">Se certifica que</span><span class="name">' + esc(S.asp.nombre) + '</span>' +
      '<span class="muted">completó y aprobó la formación para agentes de CX de la célula <b style="color:var(--fg)">' + esc(cel ? cel.nombre : '') + '</b>.</span></div>' +
      '<hr class="divider"><div class="cert-grid"><div><span class="small muted">Cédula</span><b class="num">' + esc(S.asp.cedula) + '</b></div>' +
      '<div><span class="small muted">Módulos aprobados</span><b class="num">' + S.ruta.modulos.length + '</b></div><div><span class="small muted">Promedio</span><b class="num">' + (prom != null ? prom + '%' : '—') + '</b></div>' +
      '<div><span class="small muted">Fecha</span><b>' + fecha(S.asp.completadoFecha || new Date().toISOString()) + '</b></div></div></div>' +
      '<p class="muted">Tu resultado ya está disponible para tu supervisor. Te contactarán con los siguientes pasos para tu ingreso.</p>' +
      (!window.ElxDemo ? '<div class="row no-print"><button class="btn btn-secondary" id="c-print">' + icon('download') + 'Guardar como PDF</button></div>' : '');
    const p = el.querySelector('#c-print'); if (p) p.addEventListener('click', () => window.print());
  }

  /* ================= Boost ================= */
  function pagina(contenido) {
    app.innerHTML = topbar({}) + '<main class="page"><div class="page-inner" id="inner">' + contenido + '</div></main>';
    enlazarTop();
    return app.querySelector('#inner');
  }
  async function verBoost() {
    limpiar(); S.seccion = 'boost';
    const el = pagina('<div class="loading"><div class="spinner"></div></div>');
    let d;
    try { d = await call('boost'); } catch (e) { return manejar(e); }
    S.boost = d;
    const m = d.mecanografia, r = m.resultados || {};
    el.innerHTML = '<div class="stack-sm"><span class="eyebrow">Boost</span><h1>Entrena tus habilidades</h1><p class="muted" style="max-width:62ch">Actividades cortas para mejorar lo que más usa un agente de CX en su día a día. Practica cuando quieras: no afecta tu ruta de formación, pero tu equipo ve tu mejor resultado.</p></div>' +
      (m.activa ? '<div class="boost-grid"><article class="boost-card"><div class="row-between"><span class="boost-ic">' + icon('keyboard') + '</span>' +
        (r.mejor != null ? (r.mejor >= m.meta ? '<span class="pill pill-ok">' + icon('check') + 'Meta alcanzada</span>' : '<span class="pill pill-warn">Meta: ' + m.meta + ' PPM</span>') : '<span class="pill">Sin intentos</span>') + '</div>' +
        '<div class="stack-sm" style="gap:4px"><h2>Mecanografía</h2><p class="muted small">Escribe respuestas reales de atención al cliente contra el reloj. Mide tu velocidad (palabras por minuto) y tu precisión.</p></div>' +
        '<div class="boost-stats"><div><span class="small muted">Mejor</span><b class="num">' + (r.mejor != null ? r.mejor : '—') + '</b><span class="small muted">PPM</span></div><div><span class="small muted">Meta</span><b class="num">' + m.meta + '</b><span class="small muted">PPM</span></div><div><span class="small muted">Intentos</span><b class="num">' + (r.intentos || 0) + '</b></div></div>' +
        '<button class="btn btn-primary" id="b-meca">' + icon('timer') + 'Practicar</button></article></div>'
        : '<div class="card empty">' + icon('bolt') + '<p>Todavía no hay actividades activas. Vuelve pronto.</p></div>');
    const b = el.querySelector('#b-meca'); if (b) b.addEventListener('click', () => verMecanografia());
  }

  function textoPractica(textos, segundos) {
    const largo = Math.max(400, segundos * 11);
    const pool = textos.slice().sort(() => Math.random() - .5);
    let t = '', i = 0;
    while (t.length < largo) { t += (t ? ' ' : '') + pool[i % pool.length]; i++; }
    return t;
  }
  function verMecanografia(durElegida) {
    limpiar(); S.seccion = 'boost';
    const m = S.boost.mecanografia, r = m.resultados || {};
    let dur = durElegida || m.duraciones[Math.min(1, m.duraciones.length - 1)];
    const etiquetaDur = d => d < 60 ? d + ' s' : (d / 60) + ' min';
    const el = pagina('');
    const pintarInicio = () => {
      el.innerHTML = '<nav class="crumbs"><a href="#" data-volver>Boost</a><span>›</span><span>Mecanografía</span></nav>' +
        '<div class="stack-sm"><h1>Mecanografía</h1><p class="muted" style="max-width:62ch">Copia el texto lo más rápido y exacto que puedas. El reloj arranca con tu primera tecla. Los errores se marcan en rojo y puedes corregirlos con la tecla de borrar.</p></div>' +
        '<div class="card stack"><div class="stack-sm"><span class="label">Duración</span><div class="seg" role="radiogroup">' + m.duraciones.map(d => '<button type="button" role="radio" aria-checked="' + (d === dur) + '" data-dur="' + d + '" class="' + (d === dur ? 'active' : '') + '">' + etiquetaDur(d) + '</button>').join('') + '</div></div>' +
        '<div class="boost-stats"><div><span class="small muted">Tu mejor marca</span><b class="num">' + (r.mejor != null ? r.mejor : '—') + '</b><span class="small muted">PPM</span></div><div><span class="small muted">Meta del equipo</span><b class="num">' + m.meta + '</b><span class="small muted">PPM</span></div><div><span class="small muted">Precisión esperada</span><b class="num">' + m.precisionMin + '%</b></div></div>' +
        '<div class="row"><button class="btn btn-primary" id="m-go">' + icon('keyboard') + 'Empezar</button></div></div>' +
        historialHTML(r);
      el.querySelector('[data-volver]').addEventListener('click', e => { e.preventDefault(); verBoost(); });
      el.querySelectorAll('[data-dur]').forEach(b => b.addEventListener('click', () => { dur = Number(b.dataset.dur); pintarInicio(); }));
      el.querySelector('#m-go').addEventListener('click', jugar);
    };
    const jugar = () => {
      const texto = textoPractica(m.textos, dur);
      el.innerHTML = '<nav class="crumbs"><a href="#" data-volver>Boost</a><span>›</span><span>Mecanografía · ' + etiquetaDur(dur) + '</span></nav>' +
        '<div class="type-head"><div class="type-timer num" id="t-reloj" aria-live="off">' + fmt(dur) + '</div><div class="type-live"><div><span class="small muted">PPM</span><b class="num" id="t-ppm">0</b></div><div><span class="small muted">Precisión</span><b class="num" id="t-prec">100%</b></div><div><span class="small muted">Errores</span><b class="num" id="t-err">0</b></div></div></div>' +
        '<div class="type-box" id="t-box" tabindex="-1"><div class="type-text" id="t-text">' + [...texto].map(c => '<span>' + esc(c) + '</span>').join('') + '</div>' +
        '<p class="type-hint" id="t-hint">Haz clic aquí y empieza a escribir</p>' +
        '<textarea id="t-in" class="type-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Escribe el texto"></textarea></div>' +
        '<div class="row"><button class="btn btn-secondary" id="t-reset">' + icon('refresh') + 'Reiniciar</button><button class="btn btn-ghost" id="t-salir">Terminar ahora</button></div>';
      el.querySelector('[data-volver]').addEventListener('click', e => { e.preventDefault(); verBoost(); });
      const inp = el.querySelector('#t-in'), box = el.querySelector('#t-box'), spans = el.querySelectorAll('#t-text span'), hint = el.querySelector('#t-hint');
      const reloj = el.querySelector('#t-reloj'), oPpm = el.querySelector('#t-ppm'), oPrec = el.querySelector('#t-prec'), oErr = el.querySelector('#t-err');
      let inicio = null, timer = null, terminado = false, previo = 0, teclas = 0, fallos = 0;
      const enfocar = () => { inp.focus({ preventScroll: true }); hint.hidden = true; };
      box.addEventListener('click', enfocar);
      ['paste', 'drop'].forEach(ev => inp.addEventListener(ev, e => { e.preventDefault(); toast('Aquí no se puede pegar texto: escríbelo.'); }));
      const estado = () => {
        const v = inp.value; let ok = 0;
        for (let i = 0; i < v.length; i++) if (v[i] === texto[i]) ok++;
        const seg = inicio ? Math.max(1, (Date.now() - inicio) / 1000) : 1;
        return { ok, escritos: v.length, errores: v.length - ok, ppm: inicio ? Math.round((ok / 5) / (seg / 60)) : 0, precision: teclas ? Math.max(0, Math.round((teclas - fallos) * 100 / teclas)) : 100, seg };
      };
      const pintarVivo = () => { const e = estado(); oPpm.textContent = e.ppm; oPrec.textContent = e.precision + '%'; oErr.textContent = e.errores; };
      const terminar = async () => {
        if (terminado) return; terminado = true; clearInterval(timer); inp.disabled = true;
        const e = estado();
        if (!inicio || e.escritos < 5) { toast('No alcanzaste a escribir. Intenta de nuevo.'); return pintarInicio(); }
        const usados = Math.min(dur, Math.round(e.seg));
        let resp = null;
        try { resp = await call('boostGuardar', { actividad: 'mecanografia', ppm: e.ppm, precision: e.precision, duracion: usados, errores: e.errores, caracteres: e.escritos }); S.boost.mecanografia.resultados = resp.resultados; } catch (x) { manejar(x); }
        resultado(e, usados, resp && resp.record);
      };
      inp.addEventListener('input', () => {
        if (terminado) return;
        if (!inicio) {
          inicio = Date.now();
          timer = setInterval(() => { const q = dur - Math.floor((Date.now() - inicio) / 1000); reloj.textContent = fmt(Math.max(0, q)); reloj.classList.toggle('low', q <= 10); pintarVivo(); if (q <= 0) terminar(); }, 250);
        }
        const v = inp.value;
        if (v.length > previo) { for (let i = previo; i < v.length; i++) { teclas++; if (v[i] !== texto[i]) fallos++; } }
        const desde = Math.min(previo, v.length), hasta = Math.max(previo, v.length) + 1;
        for (let i = Math.max(0, desde - 1); i < Math.min(spans.length, hasta + 1); i++) {
          spans[i].className = i < v.length ? (v[i] === texto[i] ? 'ok' : 'bad') : (i === v.length ? 'cur' : '');
        }
        previo = v.length;
        const cur = spans[v.length]; if (cur) { const top = cur.offsetTop - box.querySelector('#t-text').offsetTop; box.scrollTop = Math.max(0, top - 40); }
        pintarVivo();
        if (v.length >= texto.length) terminar();
      });
      spans[0] && (spans[0].className = 'cur');
      el.querySelector('#t-reset').addEventListener('click', () => { clearInterval(timer); jugar(); });
      el.querySelector('#t-salir').addEventListener('click', () => inicio ? terminar() : pintarInicio());
      limpiezas.push(() => clearInterval(timer));
      enfocar();
    };
    const resultado = (e, usados, record) => {
      const r2 = S.boost.mecanografia.resultados || {};
      const okMeta = e.ppm >= m.meta, okPrec = e.precision >= m.precisionMin;
      el.innerHTML = '<nav class="crumbs"><a href="#" data-volver>Boost</a><span>›</span><span>Resultado</span></nav>' +
        '<div class="card stack"><div class="row-between"><span class="eyebrow">Mecanografía · ' + etiquetaDur(dur) + '</span>' + (record ? '<span class="pill pill-ok">' + icon('award') + '¡Nuevo récord!</span>' : '') + '</div>' +
        '<div class="type-result"><div><b class="num">' + e.ppm + '</b><span>palabras por minuto</span></div><div><b class="num">' + e.precision + '%</b><span>precisión</span></div><div><b class="num">' + e.errores + '</b><span>errores sin corregir</span></div></div>' +
        '<div class="feedback ' + (okMeta && okPrec ? 'ok' : 'bad') + '">' + icon(okMeta && okPrec ? 'check' : 'alert') + '<span class="body">' +
        (okMeta && okPrec ? 'Cumpliste la meta del equipo: ' + m.meta + ' PPM con al menos ' + m.precisionMin + '% de precisión.' :
          !okMeta ? 'Te faltan ' + (m.meta - e.ppm) + ' PPM para la meta de ' + m.meta + '. Practica unos minutos al día y verás el avance.' :
          'Buena velocidad. Cuida la precisión: la meta es ' + m.precisionMin + '% y lograste ' + e.precision + '%.') + '</span></div>' +
        '<div class="row"><button class="btn btn-primary" id="r-otra">' + icon('refresh') + 'Intentar de nuevo</button><button class="btn btn-secondary" id="r-boost">Volver a Boost</button></div></div>' + historialHTML(r2);
      el.querySelector('[data-volver]').addEventListener('click', ev => { ev.preventDefault(); verBoost(); });
      el.querySelector('#r-otra').addEventListener('click', () => verMecanografia(dur));
      el.querySelector('#r-boost').addEventListener('click', verBoost);
    };
    pintarInicio();
  }
  const fmt = sg => Math.floor(sg / 60) + ':' + String(sg % 60).padStart(2, '0');
  function historialHTML(r) {
    const h = (r && r.historial) || [];
    if (!h.length) return '';
    return '<div class="stack-sm"><h3>Tus últimos intentos</h3><div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Duración</th><th>PPM</th><th>Precisión</th><th>Errores</th></tr></thead><tbody>' +
      h.slice(0, 8).map(x => '<tr><td class="small">' + Elx.fechaHora(x.fecha) + '</td><td class="num">' + fmt(x.duracion) + '</td><td class="num"><b>' + x.ppm + '</b></td><td class="num">' + x.precision + '%</td><td class="num">' + x.errores + '</td></tr>').join('') + '</tbody></table></div></div>';
  }

  /* ================= Assessment (chat con el equipo) ================= */
  function burbuja(m, propio) {
    return '<div class="msg ' + (propio ? 'me' : 'them') + '" data-id="' + esc(m._id) + '">' + (!propio ? '<span class="msg-autor">' + esc(m.autor || 'Equipo') + '</span>' : '') +
      '<div class="msg-txt">' + esc(m.texto).replace(/\n/g, '<br>') + '</div><span class="msg-hora">' + new Date(m.fecha).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) + '</span></div>';
  }
  function separadorDia(fecha) { return '<div class="msg-dia"><span>' + Elx.fecha(fecha) + '</span></div>'; }
  // Monta un chat con consulta periódica. opts: { lista, form, traer(desde), enviar(texto), propio(m), vacio }
  function montarChat(opts) {
    const vistos = new Set(); let ultimo = null, ultimoDia = null, vivo = true, t = null;
    const agregar = ms => {
      if (!ms.length) return;
      const abajo = opts.lista.scrollHeight - opts.lista.scrollTop - opts.lista.clientHeight < 80;
      const vacio = opts.lista.querySelector('.chat-vacio'); if (vacio) vacio.remove();
      let html = '';
      ms.forEach(m => {
        if (vistos.has(m._id)) return; vistos.add(m._id);
        const dia = String(m.fecha).slice(0, 10); if (dia !== ultimoDia) { html += separadorDia(m.fecha); ultimoDia = dia; }
        html += burbuja(m, opts.propio(m));
        if (!ultimo || String(m.fecha) > ultimo) ultimo = m.fecha;
      });
      if (html) { opts.lista.insertAdjacentHTML('beforeend', html); if (abajo || opts.forzarAbajo) opts.lista.scrollTop = opts.lista.scrollHeight; opts.forzarAbajo = false; }
    };
    const ciclo = async () => {
      if (!vivo) return;
      if (!document.hidden) { try { agregar((await opts.traer(ultimo)).mensajes); } catch (e) { if (e.status === 401) { vivo = false; return manejar(e); } } }
      t = setTimeout(ciclo, document.hidden ? 8000 : 2000);
    };
    opts.lista.innerHTML = '<div class="chat-vacio">' + icon('chat') + '<p>' + opts.vacio + '</p></div>';
    opts.forzarAbajo = true;
    ciclo();
    const ta = opts.form.querySelector('textarea'), btn = opts.form.querySelector('button');
    const ajustar = () => { ta.style.height = 'auto'; ta.style.height = Math.min(140, ta.scrollHeight) + 'px'; };
    ta.addEventListener('input', ajustar);
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); opts.form.requestSubmit(); } });
    opts.form.addEventListener('submit', async e => {
      e.preventDefault();
      const texto = ta.value.trim(); if (!texto) return;
      btn.disabled = true;
      try { const r = await opts.enviar(texto); ta.value = ''; ajustar(); opts.forzarAbajo = true; agregar([r.mensaje]); } catch (x) { manejar(x); }
      btn.disabled = false; ta.focus();
    });
    return () => { vivo = false; clearTimeout(t); };
  }
  function verAssessment() {
    limpiar(); S.seccion = 'assessment'; S.noLeidos = 0;
    const el = pagina('<div class="stack-sm"><span class="eyebrow">Assessment</span><h1>Habla con el equipo</h1><p class="muted" style="max-width:62ch">Escríbele al equipo de Ridery: dudas sobre la formación, seguimiento de tu proceso o tus evaluaciones. Te responden aquí mismo.</p></div>' +
      '<section class="chat card" aria-label="Chat con el equipo"><div class="chat-list" id="c-list" aria-live="polite"></div>' +
      '<form class="chat-form" id="c-form"><textarea class="textarea" rows="1" placeholder="Escribe un mensaje…" aria-label="Mensaje" maxlength="2000"></textarea><button class="btn btn-primary" type="submit" aria-label="Enviar">' + icon('send') + '<span class="hide-sm">Enviar</span></button></form>' +
      '<p class="small muted chat-nota">Enter para enviar · Shift + Enter para nueva línea</p></section>');
    pintarBadge();
    const parar = montarChat({ lista: el.querySelector('#c-list'), form: el.querySelector('#c-form'), vacio: 'Aún no hay mensajes. Escribe tu primera pregunta y el equipo te responderá aquí.',
      traer: desde => call('chat', { desde }), enviar: texto => call('chatEnviar', { texto }), propio: m => m.de === 'aspirante' });
    limpiezas.push(parar);
    el.querySelector('#c-form textarea').focus();
  }

  Elx.barraDemo('admin.html' + (window.ElxDemo && !window.ELX_DEMO ? '?demo=1' : ''), 'Abrir panel admin');
  iniciar();
})();
