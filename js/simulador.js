/* ============================================================
   Ridery Academy · Simulador de tickets (Assessment)
   Bandeja tipo Zendesk + Panel de órdenes tipo Panel Zupper, por niveles
   (Básico → Intermedio → Realidad). Los tickets llegan con sonido; el
   aspirante elige una respuesta sugerida o escribe la suya (la revisa
   Calidad, con ortografía), tipifica el motivo y envía el ticket con su
   estatus. En el Panel decide cuándo contactar al comercio, asignar,
   devolver o cancelar. Lo correcto vive solo en el servidor.
   Uso: ElxSimulador.abrir({ call, nivel, alSalir })
   ============================================================ */
(function () {
  'use strict';
  const { esc, toast, confirmar, lightbox } = window.Elx;

  /* ---------- Íconos (trazo, como los de Zendesk) ---------- */
  const P = {
    home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>', inbox: '<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5 5h14l2 8v6H3v-6z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
    org: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', book: '<path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
    grid: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    chev: '<path d="m6 9 6 6 6-6"/>', up: '<path d="m18 15-6-6-6 6"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    wa: '<path d="M20 12a8 8 0 0 1-11.8 7L4 20l1.1-4A8 8 0 1 1 20 12z"/><path d="M9 9.5c.3 2 2.5 4.2 4.5 4.5l1-1.2 1.8.9c-.3 1-1.3 1.6-2.3 1.4-2.8-.5-5.6-3.3-6-6-.2-1 .4-2 1.4-2.3l.9 1.8z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', store: '<path d="M4 9 5.5 4h13L20 9"/><path d="M4 9h16v2a3 3 0 0 1-5.3 2 3 3 0 0 1-5.4 0A3 3 0 0 1 4 11z"/><path d="M5 13v7h14v-7"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>', filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 8v4l3 2"/>', dots: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    clip: '<path d="m21 11-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7"/>', mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    link: '<path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1"/><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/>', refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>', play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/>', pause: '<path d="M9 6v12M15 6v12"/>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>', bank: '<path d="M3 10h18L12 4zM5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>', card: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h3"/>',
    android: '<path d="M7 9h10v8a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1zM7 8a5 5 0 0 1 10 0zM5 10v5M19 10v5M10 18v3M14 18v3"/>', tagz: '<path d="M3 12V4h8l9 9-8 8z"/><circle cx="7.5" cy="8.5" r="1"/>',
    img: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'
  };
  const ic = (n, c) => '<svg class="zi ' + (c || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || '') + '</svg>';

  /* ---------- Sonidos ----------
     sonidos/nuevo-ticket.wav y sonidos/mensaje.wav. Para el sonido real de Zendesk,
     grábalo y reemplaza esos archivos con el mismo nombre. Si no cargan, se sintetiza uno parecido. */
  let ctx = null;
  function tono(notas) {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      notas.forEach(([f, t, d]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
        const t0 = ctx.currentTime + t;
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
        o.start(t0); o.stop(t0 + d + 0.05);
      });
    } catch (e) { /* sin audio */ }
  }
  const audios = {};
  function sonar(cual) {
    if (Z.silencio) return;
    const respaldo = cual === 'ticket' ? [[880, 0, 0.35], [1318.5, 0.16, 0.6]] : [[1046.5, 0, 0.18]];
    try {
      const a = audios[cual] || (audios[cual] = new Audio(cual === 'ticket' ? 'sonidos/nuevo-ticket.wav' : 'sonidos/mensaje.wav'));
      a.currentTime = 0;
      const p = a.play(); if (p && p.catch) p.catch(() => tono(respaldo));
    } catch (e) { tono(respaldo); }
  }

  /* ---------- Fotos que manda el cliente ("[foto] descripción") ---------- */
  function fotoSVG(desc) {
    const lineas = String(desc).match(/.{1,38}(\s|$)/g) || [desc];
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><rect width="640" height="480" fill="#6b5a48"/>' +
      '<rect x="0" y="330" width="640" height="150" fill="#57493a"/><path d="M170 120h300l30 260H140z" fill="#c9a97c"/><path d="M170 120h300l-10 40H180z" fill="#b8956a"/>' +
      '<ellipse cx="330" cy="300" rx="120" ry="30" fill="#8a6b3a" opacity=".55"/><rect x="250" y="200" width="150" height="80" rx="12" fill="#f3efe6" transform="rotate(-18 325 240)"/>' +
      '<rect x="0" y="400" width="640" height="80" fill="rgba(0,0,0,.55)"/>' + lineas.slice(0, 2).map((l, i) => '<text x="24" y="' + (432 + i * 30) + '" font-family="sans-serif" font-size="22" fill="#fff">' + esc(l.trim()) + '</text>').join('') + '</svg>';
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  }

  /* ---------- Estado ---------- */
  const Z = { ses: null, call: null, alSalir: null, delta: 0, tab: 'home', abiertos: [], borrador: {}, seleccion: {}, motivo: {}, estadoSel: {}, llegados: new Set(), escribiendo: {}, nudge: {},
    vista: 'nuevos', filtros: { orden: '', usuario: '', comercio: '', c: '', e: '', pago: '' }, orden: null, menu: null, timers: [], root: null, silencio: false, enviando: false,
    titulo: document.title, flash: null, esperaDesde: {}, oscuro: false };
  const ahora = () => Date.now() + Z.delta;
  const segSesion = () => (ahora() - Date.parse(Z.ses.inicio)) / 1000;
  const minPanel = () => segSesion() / 60 * (Z.ses.velocidad || 10);
  const fechaPanel = min => new Date(Date.parse(Z.ses.inicio) + min * 60000);
  const horaPanel = min => fechaPanel(min).toLocaleTimeString('es-VE', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s*a\.?\s*m\.?/i, ' am').replace(/\s*p\.?\s*m\.?/i, ' pm');
  const fechaLarga = min => { const d = fechaPanel(min); return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ de /g, ' ') + ' ' + horaPanel(min); };
  const mmss = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const hace = s => s < 60 ? 'hace menos de un minuto' : 'hace ' + Math.floor(s / 60) + (Math.floor(s / 60) === 1 ? ' minuto' : ' minutos');
  const ticket = id => Z.ses.tickets.find(t => t.id === id);
  const orden = id => Z.ses.ordenes.find(o => o.id === id);
  const visibles = () => Z.ses.tickets.filter(t => Z.llegados.has(t.id));
  const ESTADO_COLOR = { nuevo: 'naranja', abierto: 'rojo', pendiente: 'azul', 'sin-respuesta': 'azul', resuelto: 'gris' };
  const estadoTxt = t => t.estadoTicket === 'nuevo' ? 'Nuevo' : (Z.ses.estadosTicket[t.estadoTicket] || 'Abierto');

  function estadoOrden(o, min) {
    const r = { c: 'No iniciada', e: 'Aceptada', rep: '', rol: '' };
    const pasos = o.eventos.map(e => Object.assign({}, e)).concat(Z.ses.hechas.filter(a => a.orden === o.id && (a.c || a.e || a.rep)).map(a => ({ min: a.min, c: a.c, e: a.e, rep: a.rep, rol: a.rol, forzado: true, accion: a.accion })))
      .sort((a, b) => a.min - b.min);
    let fijo = false; const hist = [];
    for (const p of pasos) {
      if (p.min > min) break;
      if (fijo && !p.forzado) continue;
      const antes = r.c + '|' + r.e + '|' + r.rep;
      if (p.c) r.c = p.c; if (p.e) r.e = p.e;
      if (p.rep) { r.rep = p.rep; r.rol = p.rol || 'Repartidor'; }
      if (p.forzado && (p.c === 'Cancelada' || ['Cancelada', 'En camino', 'Completada'].includes(p.e))) fijo = true;
      if (antes !== r.c + '|' + r.e + '|' + r.rep || !hist.length) hist.push({ min: p.min, c: r.c, e: r.e, rep: r.rep, forzado: p.forzado });
    }
    r.cerrada = r.c === 'Cancelada' || ['Cancelada', 'Completada'].includes(r.e);
    r.inicio = pasos.length ? pasos[0].min : 0; r.historial = hist;
    return r;
  }

  /* ---------- Abrir / cerrar ---------- */
  async function abrir(opts) {
    Z.call = opts.call; Z.alSalir = opts.alSalir;
    const r = await Z.call('simIniciar', { nivel: opts.nivel });
    Z.ses = r.sesion; Z.delta = Date.parse(Z.ses.ahora) - Date.now();
    Object.assign(Z, { tab: 'home', abiertos: [], borrador: {}, seleccion: {}, motivo: {}, estadoSel: {}, escribiendo: {}, nudge: {}, orden: null, menu: null, esperaDesde: {}, terminando: false, vista: 'nuevos' });
    try { Z.oscuro = localStorage.getItem('elx_zd_oscuro') === '1'; } catch (e) {}
    Z.llegados = new Set(Z.ses.tickets.filter(t => t.llegada != null && t.llegada <= segSesion()).map(t => t.id));
    Z.ses.tickets.forEach(t => { if (t.motivo) Z.motivo[t.id] = t.motivo; });
    Z.abiertos = Z.ses.tickets.filter(t => Z.llegados.has(t.id) && !t.cerrado).map(t => t.id);
    if (Z.abiertos.length) Z.tab = Z.abiertos[0];
    Z.root = document.createElement('div'); Z.root.className = 'zd' + (Z.oscuro ? ' oscuro' : ''); Z.root.setAttribute('role', 'application'); Z.root.setAttribute('aria-label', 'Simulador de tickets');
    document.body.appendChild(Z.root); document.body.classList.add('zd-abierto');
    pintar();
    Z.timers.push(setInterval(tic, 1000));
    if (Z.llegados.size) sonar('ticket');
  }
  function cerrar() {
    Z.timers.forEach(clearInterval); Z.timers = [];
    clearInterval(Z.flash); document.title = Z.titulo;
    if (Z.root) Z.root.remove(); Z.root = null; document.body.classList.remove('zd-abierto');
  }

  /* ---------- Reloj ---------- */
  function tic() {
    if (!Z.ses || !Z.root || Z.terminando) return;
    const s = segSesion();
    Z.ses.tickets.forEach(t => {
      if (!Z.llegados.has(t.id) && t.llegada != null && t.llegada <= s) {
        Z.llegados.add(t.id);
        if (!Z.abiertos.includes(t.id)) Z.abiertos.push(t.id);
        sonar('ticket'); avisarTitulo(); toast('Nuevo ticket de ' + t.cliente.nombre + ' por WhatsApp');
        pintarTabs(); if (Z.tab === 'home' || Z.tab === 'vistas') pintarCuerpo();
      }
      const espera = s - t.llegada;
      if (Z.llegados.has(t.id) && !t.cerrado && !t.chat.some(m => m.de === 'agente') && espera > 60 && !Z.nudge[t.id]) {
        Z.nudge[t.id] = true;
        t.chat.push({ de: 'cliente', t: '¿Hola? ¿Hay alguien ahí? 😒', local: true });
        sonar('mensaje');
        if (Z.tab === t.id) pintarCuerpo(); else pintarTabs();
      }
    });
    const rest = Z.ses.minutos * 60 - s;
    const rel = Z.root.querySelector('[data-reloj]');
    if (rel) { rel.textContent = mmss(rest); rel.parentElement.classList.toggle('poco', rest < 120); }
    if (rest <= 0) return terminar(true);
    if (Z.tab === 'panel') actualizarPanel();
    else actualizarEspera();
  }
  function avisarTitulo() {
    clearInterval(Z.flash); let on = false, n = 0;
    Z.flash = setInterval(() => { document.title = (on = !on) ? '(1) Nuevo ticket' : Z.titulo; if (++n > 9 || !document.hidden) { clearInterval(Z.flash); document.title = Z.titulo; } }, 900);
  }

  /* ---------- Pintado general ---------- */
  function pintar() {
    Z.root.innerHTML =
      '<div class="zd-alerta" role="note">' + ic('info') + '<span><b>Ridery Academy · Nivel ' + esc(Z.ses.nivelNombre) + ':</b> los tickets y órdenes son de práctica. Atiende como si fueran reales.</span>' +
      '<span class="zd-reloj">' + ic('clock') + 'Tiempo restante <b data-reloj>' + mmss(Z.ses.minutos * 60 - segSesion()) + '</b></span>' +
      '<button class="zd-link" data-salir title="El tiempo sigue corriendo">Salir</button><button class="zd-link" data-sonido>' + (Z.silencio ? 'Activar sonido' : 'Silenciar') + '</button>' +
      '<button class="zd-btn zd-btn-sm" data-terminar>Terminar simulación</button></div>' +
      '<header class="zd-top"><span class="zd-logo" aria-hidden="true">RA</span><button class="zd-workspace">Soporte ' + ic('chev') + '</button><nav class="zd-tabs" id="zd-tabs" aria-label="Pestañas"></nav>' +
      '<div class="zd-top-ic">' + ic('search') + '<span class="zd-sep"></span>' + ic('bell') + '<span class="zd-sep"></span>' + ic('grid') +
      '<button class="zd-icbtn" data-tema title="Tema oscuro o claro" aria-label="Cambiar tema">' + ic('moon') + '</button><span class="zd-avatar">' + ic('user') + '</span></div></header>' +
      '<div class="zd-wrap"><nav class="zd-rail" aria-label="Navegación"><button data-ir="home" title="Inicio">' + ic('home') + '</button><button data-ir="vistas" title="Vistas">' + ic('inbox') + '</button>' +
      '<button title="Clientes" disabled>' + ic('users') + '</button><button title="Organizaciones" disabled>' + ic('org') + '</button>' +
      (Z.ses.panel ? '<button data-ir="panel" title="Panel Zupper">' + ic('store') + '</button>' : '') +
      '<button title="Reportes" disabled>' + ic('chart') + '</button><span class="zd-rail-sep"></span><button title="Base de conocimientos" disabled>' + ic('book') + '</button></nav>' +
      '<main class="zd-main" id="zd-main"></main></div>';
    Z.root.querySelector('[data-terminar]').addEventListener('click', () => terminar(false));
    Z.root.querySelector('[data-salir]').addEventListener('click', async () => {
      if (!await confirmar({ titulo: '¿Salir del simulador?', texto: 'El tiempo sigue corriendo. Puedes volver a entrar desde Assessment para continuar donde quedaste.', ok: 'Salir', cancelar: 'Seguir' })) return;
      const cb = Z.alSalir; cerrar(); Z.ses = null; if (cb) cb();
    });
    Z.root.querySelector('[data-sonido]').addEventListener('click', e => { Z.silencio = !Z.silencio; e.target.textContent = Z.silencio ? 'Activar sonido' : 'Silenciar'; });
    Z.root.querySelector('[data-tema]').addEventListener('click', () => { Z.oscuro = !Z.oscuro; Z.root.classList.toggle('oscuro', Z.oscuro); try { localStorage.setItem('elx_zd_oscuro', Z.oscuro ? '1' : '0'); } catch (e) {} });
    Z.root.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => ir(b.dataset.ir)));
    pintarTabs(); pintarCuerpo();
  }
  function ir(tab) { Z.tab = tab; Z.menu = null; pintarTabs(); pintarCuerpo(); }
  const pendienteDe = t => !t.cerrado && t.chat.length && t.chat[t.chat.length - 1].de === 'cliente';
  function pintarTabs() {
    const nav = Z.root.querySelector('#zd-tabs');
    const tab = (id, html, act, cerrable, alerta) => '<div class="zd-tab' + (act ? ' act' : '') + '" data-tab="' + esc(id) + '" role="tab" tabindex="0" aria-selected="' + act + '">' + html +
      (alerta ? '<span class="zd-tab-alerta" aria-label="Mensaje sin responder">!</span>' : '') +
      (cerrable ? '<button class="zd-tab-x" data-cerrar="' + esc(id) + '" aria-label="Cerrar pestaña">' + ic('x') + '</button>' : '') + '</div>';
    nav.innerHTML = (Z.ses.panel ? tab('panel', ic('store') + '<span class="zd-tab-t"><b>PANEL ZUPPER</b><small>Órdenes · ' + horaPanel(minPanel()) + '</small></span>', Z.tab === 'panel') : '') +
      Z.abiertos.map(id => { const t = ticket(id); return tab(id, '<span class="zd-tab-ic">' + ic('wa') + '</span><span class="zd-tab-t"><b>' + esc(t.cliente.nombre.split(' ')[0]) + '</b><small>' + esc((t.chat.filter(m => m.de === 'cliente').slice(-1)[0] || {}).t || t.asunto).replace(/^\[foto\].*/, '📷 Foto') + '</small></span>', Z.tab === id, true, Z.tab !== id && pendienteDe(t)); }).join('') +
      '<button class="zd-tab-mas" aria-label="Nueva pestaña" disabled>' + ic('plus') + '</button>';
    nav.querySelectorAll('[data-tab]').forEach(b => {
      b.addEventListener('click', e => { if (!e.target.closest('[data-cerrar]')) ir(b.dataset.tab); });
      b.addEventListener('keydown', e => { if (e.key === 'Enter') ir(b.dataset.tab); });
    });
    nav.querySelectorAll('[data-cerrar]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); cerrarTab(b.dataset.cerrar); }));
  }
  function cerrarTab(id) {
    Z.abiertos = Z.abiertos.filter(x => x !== id);
    if (Z.tab === id) Z.tab = 'home';
    pintarTabs(); pintarCuerpo();
  }
  function abrirTicket(id) { if (!Z.abiertos.includes(id)) Z.abiertos.push(id); ir(id); }
  function pintarCuerpo() {
    const main = Z.root.querySelector('#zd-main');
    Z.root.querySelectorAll('.zd-rail [data-ir]').forEach(b => b.classList.toggle('act', b.dataset.ir === Z.tab));
    if (Z.tab === 'home') return vistaInicio(main);
    if (Z.tab === 'vistas') return vistaVistas(main);
    if (Z.tab === 'panel') return vistaPanel(main);
    const t = ticket(Z.tab); if (!t) return ir('home');
    vistaTicket(main, t);
  }

  /* ---------- Inicio: «Su trabajo › Tickets» ---------- */
  function vistaInicio(main) {
    const ts = visibles().slice().sort((a, b) => b.llegada - a.llegada);
    const s = segSesion();
    const resueltos = ts.filter(t => t.estadoTicket === 'resuelto').length;
    main.innerHTML = '<div class="zd-inicio"><aside class="zd-in-side"><h2>Inicio</h2><span class="zd-in-gr">Su trabajo</span><button class="act">' + ic('list') + 'Tickets</button>' +
      '<span class="zd-in-gr">Trabajo compartido</span><button disabled>' + ic('users') + 'Recibieron copias CC</button><button disabled>' + ic('smile') + 'Siguiendo</button>' +
      '<span class="zd-in-gr">Trabajo completado</span><button disabled>' + ic('history') + 'Últimos 30 días</button></aside>' +
      '<section class="zd-in-main"><div class="zd-in-h"><span>' + ts.length + ' tickets</span><span class="zd-muted">Estado ' + ic('filter') + '</span><span class="zd-muted">Canal ' + ic('filter') + '</span><span class="zd-muted">Última actualización ⇕</span></div>' +
      (ts.length ? ts.map(t => {
        const ult = (t.chat.slice(-1)[0] || {}).t || '';
        const espera = s - (Z.esperaDesde[t.id] != null ? Z.esperaDesde[t.id] : t.llegada);
        return '<div class="zd-card" data-abrir="' + esc(t.id) + '" tabindex="0" role="button"><span class="zd-card-av">' + ic('wa') + '</span><div class="zd-card-c">' +
          '<div class="zd-card-t"><b>' + esc(t.cliente.nombre) + ' | Conversación con ' + esc(t.cliente.nombre) + '</b>' + (!t.cerrado && pendienteDe(t) ? '<span class="zd-badge ' + (espera > 60 ? 'rojo' : 'verde') + '" data-espera="' + esc(t.id) + '"></span>' : '') + '</div>' +
          '<div class="zd-card-l"><span class="zd-sq ' + ESTADO_COLOR[t.estadoTicket] + '"></span><span class="zd-muted">' + esc(estadoTxt(t)) + '</span> ' + esc(ult.replace(/^\[foto\].*/, '📷 Foto')).slice(0, 140) + '</div>' +
          '<small class="zd-muted">' + hace(s - t.llegada) + ' | #' + t.numero + '</small></div></div>';
      }).join('') : '<div class="zd-vacio">Todavía no te ha llegado ningún ticket.' + (Z.ses.panel ? ' Mientras tanto, revisa el Panel Zupper.' : '') + '</div>') + '</section>' +
      '<aside class="zd-in-stats"><div class="zd-stat"><b>Estadísticas de tickets</b><small>Esta sesión</small><div class="zd-stat-g"><span><em>' + ts.filter(t => !t.cerrado).length + '</em>Abiertos</span><span><em>' + ts.filter(t => t.cerrado && t.estadoTicket !== 'resuelto').length + '</em>Pendientes</span><span><em>' + resueltos + '</em>Resuelto</span></div></div>' +
      '<div class="zd-stat"><b>Tickets abiertos</b><div class="zd-stat-g"><span><em>' + ts.filter(t => !t.cerrado).length + '</em>Sus grupos</span></div></div>' +
      '<div class="zd-stat"><b>Actualizaciones</b>' + ts.slice(0, 3).map(t => '<a data-abrir="' + esc(t.id) + '">Zendesk hizo un comentario sobre Conversación con ' + esc(t.cliente.nombre.split(' ')[0]) + '</a><small>' + hace(s - t.llegada) + '</small>').join('') + '</div></aside></div>';
    main.querySelectorAll('[data-abrir]').forEach(r => {
      r.addEventListener('click', () => abrirTicket(r.dataset.abrir)); r.addEventListener('keydown', e => { if (e.key === 'Enter') abrirTicket(r.dataset.abrir); });
    });
    actualizarEspera();
  }

  /* ---------- Vistas (Nuevos | Sin Asignar, Activos | En Gestión…) ---------- */
  const VISTAS = [['nuevos', 'Nuevos | Sin Asignar', t => t.estadoTicket === 'nuevo'], ['activos', 'Activos | En Gestión', t => t.estadoTicket === 'abierto'],
    ['resp-cliente', 'Pendiente | Respuesta Cliente', t => t.estadoTicket === 'sin-respuesta'], ['area-interna', 'Pendiente | Área Interna', t => t.estadoTicket === 'pendiente'],
    ['resueltos', 'Resueltos', t => t.estadoTicket === 'resuelto']];
  function vistaVistas(main) {
    const ts = visibles(), v = VISTAS.find(x => x[0] === Z.vista) || VISTAS[0], lista = ts.filter(v[2]), s = segSesion();
    main.innerHTML = '<div class="zd-vista"><div class="zd-vista-side"><div class="row-between"><h2>Vistas</h2>' + ic('refresh') + '</div><span class="zd-in-gr">CX | ORDERS</span>' +
      VISTAS.map(x => '<button data-v="' + x[0] + '" class="' + (x[0] === v[0] ? 'act' : '') + '"><span>' + esc(x[1]) + '</span><b>' + ts.filter(x[2]).length + '</b></button>').join('') + '</div>' +
      '<div class="zd-vista-main"><h1>' + esc(v[1]) + '</h1><p class="zd-muted small">' + lista.length + ' tickets · Última actualización: hace 1 s</p>' +
      '<table class="zd-tabla"><thead><tr><th>Estado del ticket</th><th>Índice de satisfacción</th><th>Asunto</th><th>Solicitante</th><th>Solicitado</th><th>Agente asignado</th><th>Grupo</th></tr></thead><tbody>' +
      (lista.length ? lista.map(t => '<tr data-abrir="' + esc(t.id) + '" tabindex="0"><td><span class="zd-estado ' + ESTADO_COLOR[t.estadoTicket] + '">' + esc(estadoTxt(t)) + '</span></td><td>No ofrecida</td>' +
        '<td>Conversación con ' + esc(t.cliente.nombre) + '</td><td>' + esc(t.cliente.nombre) + '</td><td>' + hace(s - t.llegada) + '</td><td>' + (t.estadoTicket === 'nuevo' ? '-' : 'Tú') + '</td><td>CX - ORDERS</td></tr>').join('')
        : '<tr><td colspan="7" class="zd-vacio">No hay tickets en esta vista</td></tr>') + '</tbody></table></div></div>';
    main.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => { Z.vista = b.dataset.v; vistaVistas(main); }));
    main.querySelectorAll('[data-abrir]').forEach(r => { r.addEventListener('click', () => abrirTicket(r.dataset.abrir)); r.addEventListener('keydown', e => { if (e.key === 'Enter') abrirTicket(r.dataset.abrir); }); });
  }
  function actualizarEspera() {
    Z.root.querySelectorAll('[data-espera]').forEach(el => {
      const t = ticket(el.dataset.espera);
      if (!t || t.cerrado || !pendienteDe(t)) { el.textContent = ''; return; }
      const s = segSesion() - (Z.esperaDesde[t.id] != null ? Z.esperaDesde[t.id] : t.llegada);
      el.textContent = s < 60 ? Math.round(s) + 's' : Math.floor(s / 60) + 'm';
      el.classList.toggle('tarde', s > 60); el.classList.toggle('rojo', s > 60); el.classList.toggle('verde', s <= 60);
    });
  }

  /* ---------- Ticket ---------- */
  function burbuja(m, t) {
    const cli = m.de === 'cliente';
    let cuerpo = esc(m.t).replace(/\n/g, '<br>');
    if (/^\[foto\]/.test(m.t)) { const d = m.t.replace(/^\[foto\]\s*/, ''); cuerpo = '<button class="zd-foto" data-foto="' + esc(d) + '"><img src="' + fotoSVG(d) + '" alt="Foto enviada por el cliente: ' + esc(d) + '"><span>IMG_' + t.numero + '.jpg<small>JPEG · clic para ver</small></span></button>'; }
    return '<div class="zd-msg ' + (cli ? 'cli' : 'ag') + '">' + (cli ? '' : '<span class="zd-msg-av">' + ic('user') + '</span>') +
      '<div class="zd-msg-c">' + (cli ? '' : '<div class="zd-msg-h"><b>Tú</b> ' + ic('wa') + ' <span>· WhatsApp</span></div>') + '<div class="zd-msg-b">' + cuerpo + '</div></div></div>';
  }
  function vistaTicket(main, t) {
    const nombre = t.cliente.nombre.split(' ')[0];
    const tags = ['whatsapp', 'orders', 'sentiment__' + (t.nivel >= 3 ? 'neutral' : 'negative'), 'sentiment_confidence__high', 'language_es'];
    if (!Z.estadoSel[t.id]) Z.estadoSel[t.id] = Z.ses.conEstados ? (t.estadoTicket === 'nuevo' ? 'abierto' : t.estadoTicket) : 'resuelto';
    main.innerHTML = '<div class="zd-ticket">' +
      '<div class="zd-sub"><span class="zd-crumb">Organización (crear)</span><span class="zd-crumb">' + esc(nombre) + '</span><span class="zd-crumb act"><span class="zd-estado ' + ESTADO_COLOR[t.estadoTicket] + '">' + esc(estadoTxt(t)) + '</span> Ticket #' + t.numero + '</span></div>' +
      '<div class="zd-cols">' +
      '<aside class="zd-campos"><div class="zd-aviso">' + ic('info') + '<span>Ticket actualizado</span></div>' +
      '<div class="zd-campo"><label>Etiquetas</label><div class="zd-tags">' + tags.map(x => '<span>' + esc(x) + ' ×</span>').join('') + '</div></div>' +
      '<div class="zd-campo"><label for="zd-motivo">Motivo de Contacto | Orders</label><select id="zd-motivo"' + (t.cerrado ? ' disabled' : '') + '><option value="">-</option>' +
        Z.ses.motivos.map(m => '<option' + ((Z.motivo[t.id] || '') === m ? ' selected' : '') + '>' + esc(m) + '</option>').join('') + '</select></div>' +
      '<div class="zd-campo"><label>Calificación</label><input disabled></div>' +
      '<label class="zd-check"><input type="checkbox" disabled> Cerrar el Ticket</label>' +
      '<div class="zd-campo"><label>Grupo de canales</label><select disabled><option>Digital</option></select></div></aside>' +
      '<section class="zd-conv"><div class="zd-conv-h"><div><h2>Conversación con ' + esc(nombre) + '</h2>' +
        '<div class="zd-meta"><span class="zd-espera" data-espera="' + esc(t.id) + '"></span><span>A través de<br>WhatsApp</span><span class="zd-activa">' + (t.cerrado ? '● Cerrada' : '● Activa') + '</span>' +
        '<span>Tema <a>' + esc(t.asunto) + '</a></span><span class="zd-humor h' + t.nivel + '">' + ic('smile') + esc(t.humor) + '</span></div>' +
        '<a class="zd-resumen">' + ic('list') + ' Ver resumen del ticket</a></div>' +
        '<div class="zd-conv-ic">' + ic('list') + ic('filter') + ic('history') + ic('dots') + '</div></div>' +
      '<div class="zd-chat" id="zd-chat" aria-live="polite">' + t.chat.map(m => burbuja(m, t)).join('') + (Z.escribiendo[t.id] ? '<div class="zd-typing"><span></span><span></span><span></span> ' + esc(nombre) + ' está escribiendo</div>' : '') + '</div>' +
      compositor(t) + '</section>' +
      '<aside class="zd-ctx"><div class="zd-ctx-h"><span class="zd-avatar g">' + ic('user') + '</span><b>' + esc(nombre) + '</b></div>' +
        '<dl><dt>Teléfono</dt><dd><a>' + esc(t.cliente.telefono) + '</a></dd><dt>WhatsApp</dt><dd>' + esc(String(t.cliente.telefono).replace('+', '')) + '</dd>' +
        '<dt>Hora local</dt><dd>' + new Date(ahora()).toLocaleString('es-VE', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) + ' GMT-4</dd><dt>Notas</dt><dd><div class="zd-notas">' + esc(t.cliente.notas || '') + '</div></dd></dl>' +
        '<div class="zd-ctx-b"><h3>Historial de interacción</h3><div class="zd-hist act"><span class="zd-sq ' + ESTADO_COLOR[t.estadoTicket] + '"></span><div><b>Conversación con ' + esc(nombre) + '</b><small>Ahora · Estado ' + esc(estadoTxt(t)) + '</small></div></div>' +
        '<div class="zd-hist"><span class="zd-sq gris"></span><div><b>Conversación con ' + esc(nombre) + '</b><small>21 oct. 18:38 · Estado Resuelto</small></div></div></div>' +
        (Z.ses.panel ? '<div class="zd-ctx-b"><h3>¿Es por una orden?</h3><p class="zd-muted">Búscala en el Panel Zupper por número de orden o por el nombre del cliente.</p><button class="zd-btn zd-btn-sec zd-btn-sm" data-ir3>' + ic('store') + 'Abrir Panel Zupper</button></div>' : '') + '</aside>' +
      '</div>' +
      '<footer class="zd-pie"><div class="zd-macro">' + ic('bolt') + '<select disabled><option>Aplicar macro</option></select></div><div class="grow"></div>' +
        '<button class="zd-link" data-cerrar-tab>Cerrar pestaña ' + ic('chev') + '</button>' + botonEnviar(t) + '</footer></div>';
    const chat = main.querySelector('#zd-chat'); chat.scrollTop = chat.scrollHeight;
    chat.querySelectorAll('[data-foto]').forEach(b => b.addEventListener('click', () => lightbox(fotoSVG(b.dataset.foto))));
    main.querySelector('#zd-motivo').addEventListener('change', e => { Z.motivo[t.id] = e.target.value; });
    main.querySelector('[data-cerrar-tab]').addEventListener('click', () => cerrarTab(t.id));
    const p3 = main.querySelector('[data-ir3]'); if (p3) p3.addEventListener('click', () => ir('panel'));
    enlazarEnviar(main, t);
    enlazarCompositor(main, t);
    actualizarEspera();
  }
  function botonEnviar(t) {
    if (t.cerrado) return '<button class="zd-btn" disabled>' + esc(estadoTxt(t)) + '</button>';
    if (!Z.ses.conEstados) return '<button class="zd-btn" data-enviar-estado>Enviar como <b>Resuelto</b></button>';
    const e = Z.estadoSel[t.id];
    return '<div class="zd-split"><button class="zd-btn" data-enviar-estado>Enviar como <b>' + esc(Z.ses.estadosTicket[e]) + '</b></button><button class="zd-btn zd-split-ch" data-menu-estado aria-haspopup="true" aria-label="Elegir estatus">' + ic('up') + '</button>' +
      '<div class="zd-menu-est" hidden>' + Object.entries(Z.ses.estadosTicket).map(([k, n]) => '<button data-est="' + k + '" class="' + (k === e ? 'act' : '') + '"><span class="zd-sq ' + ESTADO_COLOR[k] + '"></span>' + esc(n) + '</button>').join('') + '</div></div>';
  }
  function enlazarEnviar(main, t) {
    const b = main.querySelector('[data-enviar-estado]'); if (b) b.addEventListener('click', () => enviarEstado(t));
    const ch = main.querySelector('[data-menu-estado]'), menu = main.querySelector('.zd-menu-est');
    if (ch) {
      ch.addEventListener('click', e => { e.stopPropagation(); menu.hidden = !menu.hidden; });
      menu.querySelectorAll('[data-est]').forEach(x => x.addEventListener('click', () => { Z.estadoSel[t.id] = x.dataset.est; const pie = main.querySelector('.zd-split'); pie.outerHTML = botonEnviar(t); enlazarEnviar(main, t); }));
      Z.root.addEventListener('click', function cerrarMenu(e) { if (!e.target.closest('.zd-split')) { menu.hidden = true; Z.root && Z.root.removeEventListener('click', cerrarMenu); } });
    }
  }
  function compositor(t) {
    if (t.cerrado) return '<div class="zd-comp zd-comp-fin">Ticket enviado como <b>' + esc(estadoTxt(t)) + '</b> · Motivo: <b>' + esc(t.motivo || Z.motivo[t.id] || '—') + '</b></div>';
    if (Z.escribiendo[t.id]) return '<div class="zd-comp zd-comp-fin">Esperando la respuesta del cliente…</div>';
    if (t.listo) return '<div class="zd-comp zd-comp-fin">' + ic('info') + ' El cliente no ha vuelto a escribir. Elige el <b>Motivo de contacto</b> y envía el ticket con el estatus que corresponda.</div>';
    const sel = Z.seleccion[t.id], texto = Z.borrador[t.id] != null ? Z.borrador[t.id] : '';
    return '<div class="zd-comp"><div class="zd-comp-h">' + ic('wa') + ' WhatsApp ' + ic('chev') + '<span class="grow"></span><span class="zd-muted">Sugerencias · o escribe tu propia respuesta</span></div>' +
      '<div class="zd-sug" role="listbox" aria-label="Respuestas sugeridas">' + t.opciones.map(o => '<button role="option" aria-selected="' + (sel === o.i) + '" class="' + (sel === o.i ? 'act' : '') + '" data-op="' + o.i + '">' + esc(o.t) + '</button>').join('') + '</div>' +
      '<textarea id="zd-txt" rows="3" placeholder="Escribe tu respuesta o elige una sugerencia" maxlength="1000" spellcheck="false">' + esc(texto) + '</textarea>' +
      '<div class="zd-comp-f">' + ic('smile') + ic('clip') + ic('link') + ic('mic') + '<span class="grow"></span><span class="zd-muted small" data-modo>' + (sel != null ? 'Respuesta sugerida' : texto.trim() ? 'Tu respuesta' : '') + '</span><button class="zd-link fuerte" data-enviar' + (texto.trim() ? '' : ' disabled') + '>Enviar</button></div></div>';
  }
  function enlazarCompositor(main, t) {
    const ta = main.querySelector('#zd-txt'); if (!ta) return;
    const btn = main.querySelector('[data-enviar]'), modo = main.querySelector('[data-modo]');
    const refrescar = () => {
      const op = t.opciones.find(o => o.i === Z.seleccion[t.id]);
      if (op && ta.value !== op.t) Z.seleccion[t.id] = null;     // si edita la sugerencia, pasa a ser su propia respuesta
      main.querySelectorAll('[data-op]').forEach(b => { const a = Number(b.dataset.op) === Z.seleccion[t.id]; b.classList.toggle('act', a); b.setAttribute('aria-selected', a); });
      btn.disabled = !ta.value.trim();
      modo.textContent = Z.seleccion[t.id] != null ? 'Respuesta sugerida' : ta.value.trim() ? 'Tu respuesta' : '';
    };
    main.querySelectorAll('[data-op]').forEach(b => b.addEventListener('click', () => {
      Z.seleccion[t.id] = Number(b.dataset.op); ta.value = t.opciones.find(o => o.i === Z.seleccion[t.id]).t; Z.borrador[t.id] = ta.value; refrescar(); ta.focus();
    }));
    ta.addEventListener('input', () => { Z.borrador[t.id] = ta.value; refrescar(); });
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(t); } });
    btn.addEventListener('click', () => enviar(t));
  }
  async function enviar(t) {
    const texto = (Z.borrador[t.id] || '').trim();
    if (!texto || Z.enviando) return;
    const op = t.opciones.find(o => o.i === Z.seleccion[t.id] && o.t === texto);
    Z.enviando = true;
    try {
      const r = await Z.call('simResponder', Object.assign({ sesion: Z.ses.id, ticket: t.id }, op ? { opcion: op.i } : { otro: texto }));
      t.chat.push({ de: 'agente', t: texto });
      if (t.estadoTicket === 'nuevo') { t.estadoTicket = 'abierto'; if (Z.ses.conEstados) Z.estadoSel[t.id] = 'abierto'; }
      Z.esperaDesde[t.id] = null;
      delete Z.seleccion[t.id]; delete Z.borrador[t.id];
      t.opciones = []; Z.escribiendo[t.id] = !!r.mensajes.length;
      const fin = () => { Z.escribiendo[t.id] = false; t.opciones = r.opciones; t.listo = r.listo; t.humor = r.humor; t.nivel = r.nivel; Z.esperaDesde[t.id] = segSesion(); };
      if (!r.mensajes.length) fin();
      if (Z.tab === t.id) pintarCuerpo();
      let espera = 900;
      r.mensajes.forEach((m, k) => {
        espera += 1000 + Math.min(2600, m.t.length * 35);
        setTimeout(() => {
          if (!Z.ses || Z.terminando) return;
          t.chat.push(m); sonar('mensaje');
          if (k === r.mensajes.length - 1) fin();
          if (Z.tab === t.id) pintarCuerpo(); else pintarTabs();
        }, espera);
      });
      pintarTabs();
    } catch (e) { manejar(e); }
    Z.enviando = false;
  }
  async function enviarEstado(t) {
    const motivo = Z.motivo[t.id], estado = Z.estadoSel[t.id] || 'resuelto';
    if (!motivo) { toast('Elige el Motivo de contacto antes de enviar el ticket.', 'bad'); const s = Z.root.querySelector('#zd-motivo'); if (s) s.focus(); return; }
    if (!t.chat.some(m => m.de === 'agente')) return toast('Responde al cliente antes de cambiar el estatus.', 'bad');
    if (estado === 'resuelto' && !t.listo && !await confirmar({ titulo: '¿Resolver sin terminar la conversación?', texto: 'El cliente todavía espera tu respuesta. Si lo resuelves ahora, el ticket se cierra así.', ok: 'Resolver igual' })) return;
    try {
      const r = await Z.call('simResolver', { sesion: Z.ses.id, ticket: t.id, motivo, estado });
      t.motivo = motivo; t.estadoTicket = estado; t.cerrado = r.cerrado;
      Object.entries(r.llegadas || {}).forEach(([id, ll]) => { const x = ticket(id); if (x) x.llegada = ll; });
      toast('Ticket #' + t.numero + ' enviado como ' + Z.ses.estadosTicket[estado]);
      if (t.cerrado) cerrarTab(t.id); else { pintarTabs(); pintarCuerpo(); }
      if (!r.pendientes) {
        if (await confirmar({ titulo: '¡No te quedan tickets!', texto: 'Puedes seguir revisando ' + (Z.ses.panel ? 'el Panel Zupper' : 'tus vistas') + ' o terminar la simulación ahora.', ok: 'Terminar simulación', cancelar: 'Seguir' })) terminar(true);
      }
    } catch (e) { manejar(e); }
  }

  /* ---------- Panel Zupper ---------- */
  const PILL = { 'No iniciada': 'v', 'Preparación iniciada': 'v', 'Preparada': 'v', 'Aceptada': 'v', 'Iniciada': 'g', 'En comercio': 't', 'En camino': 't', 'En destino': 't', 'Completada': 'v', 'Cancelada': 'r', 'Pagada': 'v', 'No pagada': 'r' };
  const pill = x => '<span class="zp-pill ' + (PILL[x] || 'g') + '">' + esc(x) + '</span>';
  const METODO = { movil: ['phone', 'movil', 'Pago móvil'], banco: ['bank', 'banco', 'Transferencia'], tarjeta: ['card', 'tarjeta', 'Tarjeta internacional'], binance: ['card', 'binance', 'Binance'], paypal: ['card', 'paypal', 'PayPal'] };
  const metodo = m => m === 'mixto' ? '<span class="zp-mixto">Mixto</span>' : (x => '<span class="zp-met ' + x[1] + '" title="' + x[2] + '">' + ic(x[0]) + '</span>')(METODO[m] || METODO.movil);
  function vistaPanel(main) {
    const opts = (l, v) => '<option value="">Todos</option>' + l.map(x => '<option' + (v === x ? ' selected' : '') + '>' + esc(x) + '</option>').join('');
    const f = Z.filtros;
    main.innerHTML = '<div class="zp"><div class="zp-h"><div class="zp-tit"><b>Órdenes</b><span>Panel Zupper · reloj acelerado ×' + Z.ses.velocidad + '</span></div><div class="zp-hora">' + ic('clock') + '<span data-hora>' + horaPanel(minPanel()) + '</span></div></div>' +
      '<div class="zp-cuerpo"><div class="zp-tabla-w"><table class="zp-tabla"><thead><tr><th>Orden #</th><th class="zp-ord">Solicitada ↓</th><th>Comercio</th><th>Programada</th><th>Comercio</th><th>Entrega</th><th>Pago</th><th>Método de pago</th><th>Total</th><th>Usuario</th><th>Atendida por</th><th>Acciones</th></tr>' +
      '<tr class="zp-filtros"><th><input data-f="orden" placeholder="Filtrar..." value="' + esc(f.orden) + '"></th><th></th><th><input data-f="comercio" placeholder="Filtrar..." value="' + esc(f.comercio) + '"></th><th></th>' +
      '<th><select data-f="c">' + opts(['No iniciada', 'Preparación iniciada', 'Preparada', 'Cancelada'], f.c) + '</select></th><th><select data-f="e">' + opts(['Aceptada', 'Iniciada', 'Preparación iniciada', 'Preparada', 'En comercio', 'En camino', 'En destino', 'Completada', 'Cancelada'], f.e) + '</select></th>' +
      '<th><select data-f="pago">' + opts(['Pagada', 'No pagada'], f.pago) + '</select></th><th></th><th><input placeholder="Filtra" disabled></th><th><input data-f="usuario" placeholder="Filtrar..." value="' + esc(f.usuario) + '"></th><th class="zp-buscar">' + ic('search') + ' Buscar</th><th></th></tr></thead><tbody id="zp-body"></tbody></table></div>' +
      '<aside class="zp-det" id="zp-det" hidden></aside></div></div>';
    main.querySelectorAll('[data-f]').forEach(x => x.addEventListener(x.tagName === 'SELECT' ? 'change' : 'input', () => { Z.filtros[x.dataset.f] = x.value; actualizarPanel(true); }));
    actualizarPanel(true);
  }
  function actualizarPanel(forzar) {
    const main = Z.root.querySelector('#zd-main'); if (!main || !main.querySelector('#zp-body')) return;
    const min = minPanel();
    const h = main.querySelector('[data-hora]'); if (h) h.textContent = horaPanel(min);
    const f = Z.filtros, has = (a, b) => !b || String(a).toLowerCase().includes(b.trim().toLowerCase());
    const filas = Z.ses.ordenes.filter(o => o.eventos.length && o.eventos[0].min <= min).map(o => ({ o, st: estadoOrden(o, min) }))
      .filter(({ o, st }) => has(o.id, f.orden) && has(o.comercio, f.comercio) && has(o.cliente, f.usuario) && (!f.c || st.c === f.c) && (!f.e || st.e === f.e) && (!f.pago || o.pago === f.pago))
      .sort((a, b) => b.st.inicio - a.st.inicio);
    const atendida = (o, st) => st.rep ? '<span class="zp-rep">' + esc(st.rep) + '</span><span class="zp-rol">' + (st.rol === 'Shopper' ? 'Shopper' : 'Repartidor - Zupper by Ridery') + '</span><span class="zp-rol">1 orden</span>'
      : st.cerrada ? '<span class="zd-muted">—</span>' : (st.c === 'Preparada' || st.e === 'Preparada') ? '<button class="zp-asignar" data-acc-dir="reasignar" data-o="' + esc(o.id) + '">Asignar repartidor</button>' : '<span class="zp-pool">Sin enviar al pool</span>';
    const html = filas.length ? filas.map(({ o, st }) => '<tr class="' + (Z.orden === o.id ? 'act' : '') + '"><td><button class="zp-id" data-ver="' + esc(o.id) + '">' + ic('android', 'zp-and') + esc(o.id) + '</button></td><td class="zp-nw">' + fechaLarga(st.inicio) + '</td>' +
      '<td>' + esc(o.comercio) + '</td><td>Inmediato</td><td>' + pill(st.c) + '</td><td>' + pill(st.e) + '</td><td>' + pill(o.pago) + '</td><td>' + metodo(o.metodo) + '</td>' +
      '<td class="zp-nw">$ ' + esc(o.total) + ' ' + ic('tagz', 'zp-tag') + '</td><td>' + esc(o.cliente) + '</td><td class="zp-at">' + atendida(o, st) + '</td>' +
      '<td class="zp-accs"><button class="zp-dots" data-menu="' + esc(o.id) + '" aria-label="Acciones de la orden ' + esc(o.id) + '">' + ic('dots') + '</button>' +
      (Z.menu === o.id ? '<div class="zp-menu">' + '<button data-ver="' + esc(o.id) + '">Ver detalle</button>' + Object.entries(Z.ses.acciones).filter(([k]) => k !== 'publicar-shoppers' || /forum/i.test(o.comercio))
        .map(([k, n]) => '<button data-acc="' + k + '" data-o="' + esc(o.id) + '"' + (st.cerrada ? ' disabled' : '') + (k === 'cancelar' ? ' class="peligro"' : '') + '>' + esc(n) + '</button>').join('') + '</div>' : '') + '</td></tr>').join('')
      : '<tr><td colspan="12" class="zd-vacio">No hay órdenes con estos filtros</td></tr>';
    const body = main.querySelector('#zp-body');
    if (forzar || body.dataset.h !== html) {
      body.innerHTML = html; body.dataset.h = html;
      body.querySelectorAll('[data-ver]').forEach(b => b.addEventListener('click', () => { Z.orden = b.dataset.ver; Z.menu = null; actualizarPanel(true); }));
      body.querySelectorAll('[data-menu]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); Z.menu = Z.menu === b.dataset.menu ? null : b.dataset.menu; actualizarPanel(true); }));
      body.querySelectorAll('[data-acc]').forEach(b => b.addEventListener('click', () => { Z.menu = null; accion(orden(b.dataset.o), b.dataset.acc); }));
      body.querySelectorAll('[data-acc-dir]').forEach(b => b.addEventListener('click', () => accion(orden(b.dataset.o), b.dataset.accDir)));
    }
    pintarDetalle(min, forzar);
  }
  function pintarDetalle(min, forzar) {
    const det = Z.root.querySelector('#zp-det'); if (!det) return;
    if (!Z.orden) { det.hidden = true; det.dataset.h = ''; return; }
    const o = orden(Z.orden), st = estadoOrden(o, min);
    const html = '<div class="row-between"><h2>Orden ' + esc(o.id) + '</h2><button class="zd-tab-x" data-cerrar-det aria-label="Cerrar detalle">' + ic('x') + '</button></div>' +
      '<div class="zp-det-p">' + pill(st.c) + pill(st.e) + pill(o.pago) + '</div>' +
      '<dl class="zp-dl"><dt>Comercio</dt><dd>' + esc(o.comercio) + '</dd><dt>Usuario</dt><dd>' + esc(o.cliente) + '</dd><dt>Atendida por</dt><dd>' + esc(st.rep || 'Sin asignar') + (st.rep ? ' · ' + esc(st.rol) : '') + '</dd>' +
      '<dt>Productos</dt><dd>' + o.items.map(esc).join('<br>') + '</dd><dt>Total</dt><dd><b>$ ' + esc(o.total) + '</b></dd></dl>' +
      '<h3>Historial</h3><ol class="zp-linea">' + st.historial.map(p => '<li><b>' + horaPanel(p.min) + '</b> Comercio: ' + esc(p.c) + ' · Entrega: ' + esc(p.e) + (p.rep ? ' · ' + esc(p.rep) : '') + (p.forzado ? ' <small>(tu acción)</small>' : '') + '</li>').join('') + '</ol>' +
      '<div class="zp-log">' + Z.ses.hechas.filter(a => a.orden === o.id).map(a => '<div><b>' + horaPanel(a.min) + ' · ' + esc(Z.ses.acciones[a.accion] || a.accion) + '</b><span>' + esc(a.texto) + '</span></div>').join('') + '</div>' +
      '<p class="zd-muted small">Usa el menú ⋮ de la orden para actuar.</p>';
    if (!forzar && det.dataset.h === html) return;
    det.innerHTML = html; det.dataset.h = html; det.hidden = false;
    det.querySelector('[data-cerrar-det]').addEventListener('click', () => { Z.orden = null; actualizarPanel(true); });
  }
  async function accion(o, acc) {
    if (acc === 'cancelar' && !await confirmar({ titulo: '¿Cancelar la orden ' + o.id + '?', texto: 'Se le hace el reembolso al cliente. No se puede deshacer.', ok: 'Cancelar orden', cancelar: 'Volver', peligro: true })) return;
    try {
      const r = await Z.call('simAccion', { sesion: Z.ses.id, orden: o.id, que: acc });
      Z.ses.hechas.push(r.hecha); Z.orden = o.id;
      toast(r.hecha.texto);
      actualizarPanel(true);
    } catch (e) { manejar(e); }
  }
  document.addEventListener('click', e => { if (Z.menu && Z.root && !e.target.closest('.zp-accs')) { Z.menu = null; actualizarPanel(true); } });

  /* ---------- Final ---------- */
  async function terminar(auto) {
    if (!Z.ses || Z.terminando) return;
    if (!auto && !await confirmar({ titulo: '¿Terminar la simulación?', texto: 'Se envía lo que hiciste al equipo. Los tickets que no atendiste quedan como no atendidos.', ok: 'Terminar', peligro: true })) return;
    Z.terminando = true;
    let r = null;
    try { r = await Z.call('simTerminar', { sesion: Z.ses.id }); } catch (e) { toast(e.message, 'bad'); }
    Z.timers.forEach(clearInterval); Z.timers = [];
    Z.root.classList.add('zd-terminada');
    const main = Z.root.querySelector('#zd-main');
    main.innerHTML = '<div class="zd-fin"><div class="zd-fin-c"><span class="zd-fin-ic">✓</span><h1>' + (auto ? 'Se acabó el tiempo' : 'Nivel ' + esc(Z.ses.nivelNombre) + ' terminado') + '</h1><p>Gracias. El equipo de Calidad revisa tus respuestas' + (Z.ses.panel ? ' y tus decisiones en el panel' : '') + '; tu resultado te lo comparten ellos.</p>' +
      (r ? '<div class="zd-fin-g"><div><b>' + r.resueltos + '/' + r.total + '</b><span>tickets atendidos</span></div><div><b>' + (r.primeraPromedio != null ? mmss(r.primeraPromedio) : '—') + '</b><span>primera respuesta promedio</span></div><div><b>' + r.acciones + '</b><span>acciones en el panel</span></div></div>' +
        (r.csat ? '<div class="zd-csat"><h2>Calificación de tus clientes</h2><div class="zd-csat-g"><span class="bien"><b>' + r.csat.bien + '</b>Bien</span><span class="mal"><b>' + r.csat.mal + '</b>Mal</span>' +
          (r.csat.sinAtender ? '<span><b>' + r.csat.sinAtender + '</b>Sin atender</span>' : '') + '</div>' +
          '<ul class="zd-csat-l">' + r.calificaciones.map(c => '<li><span class="zd-csat-p ' + (c.calificacion === 'Bien' ? 'bien' : c.calificacion === 'Mal' ? 'mal' : '') + '">' + esc(c.calificacion) + '</span><span><b>#' + c.numero + ' · ' + esc(c.cliente) + '</b><small>' + esc(c.asunto) + ' · el cliente quedó ' + esc(c.humor.toLowerCase()) + '</small></span></li>').join('') + '</ul>' +
          '<p class="zd-muted small">Así calificaría el cliente tu atención según cómo le respondiste. Tus respuestas escritas las revisa Calidad aparte.</p></div>' : '') +
        (r.siguiente ? '<p class="zd-muted">Ya puedes entrar al nivel <b>' + esc(r.siguiente) + '</b> desde Assessment.</p>' : '') : '') +
      '<button class="zd-btn" data-volver>Volver a Ridery Academy</button></div></div>';
    main.querySelector('[data-volver]').addEventListener('click', () => { const cb = Z.alSalir; Z.ses = null; Z.terminando = false; cerrar(); if (cb) cb(); });
  }
  function manejar(e) {
    if (e.status === 409 && /tiempo/.test(e.message)) return terminar(true);
    if (e.status === 401) { cerrar(); if (Z.alSalir) Z.alSalir(e); return; }
    toast(e.message || 'Algo falló. Intenta de nuevo.', 'bad');
  }

  window.ElxSimulador = { abrir, cerrar };
})();
