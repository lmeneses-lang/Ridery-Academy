/* ============================================================
   Ridery Academy · Simulador de tickets (Assessment)
   Bandeja tipo Zendesk + Panel de órdenes tipo Panel Zupper.
   Los tickets llegan en ráfaga con sonido; el aspirante responde
   con respuestas sugeridas u «Otro» (texto libre que revisa Calidad),
   tipifica el motivo de contacto y resuelve. En el Panel de órdenes
   decide cuándo contactar al comercio, reasignar o cancelar.
   Lo que es correcto vive solo en el servidor (js/handlers.js).
   Uso: ElxSimulador.abrir({ call, alSalir })
   ============================================================ */
(function () {
  'use strict';
  const { esc, toast, confirmar } = window.Elx;

  /* ---------- Íconos propios (trazo, como los de Zendesk) ---------- */
  const P = {
    home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>', inbox: '<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5 5h14l2 8v6H3v-6z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
    org: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', send: '<path d="m22 2-7 20-4-9-9-4z"/>', book: '<path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
    grid: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    chev: '<path d="m6 9 6 6 6-6"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    wa: '<path d="M20 12a8 8 0 0 1-11.8 7L4 20l1.1-4A8 8 0 1 1 20 12z"/><path d="M9 9.5c.3 2 2.5 4.2 4.5 4.5l1-1.2 1.8.9c-.3 1-1.3 1.6-2.3 1.4-2.8-.5-5.6-3.3-6-6-.2-1 .4-2 1.4-2.3l.9 1.8z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', store: '<path d="M4 9 5.5 4h13L20 9"/><path d="M4 9h16v2a3 3 0 0 1-5.3 2 3 3 0 0 1-5.4 0A3 3 0 0 1 4 11z"/><path d="M5 13v7h14v-7"/>',
    bike: '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17h6l3-7h3M12 17 9 10H7"/>', smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>', history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 8v4l3 2"/>', dots: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
    flag: '<path d="M5 21V4h11l-2 4 2 4H5"/>', list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    emoji: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>', clip: '<path d="m21 11-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>', link: '<path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1"/><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/>'
  };
  const ic = (n, c) => '<svg class="zi ' + (c || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || '') + '</svg>';

  /* ---------- Sonidos ----------
     sonidos/nuevo-ticket.wav y sonidos/mensaje.wav. Para usar el sonido real de Zendesk,
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

  /* ---------- Estado ---------- */
  const Z = { ses: null, call: null, alSalir: null, delta: 0, tab: 'home', abiertos: [], borrador: {}, seleccion: {}, motivo: {}, llegados: new Set(), escribiendo: {}, nudge: {},
    filtro: 'activas', q: '', orden: null, log: {}, timers: [], root: null, silencio: false, enviando: false, titulo: document.title, flash: null };
  const ahora = () => Date.now() + Z.delta;
  const segSesion = () => (ahora() - Date.parse(Z.ses.inicio)) / 1000;
  const minPanel = () => segSesion() / 60 * (Z.ses.velocidad || 10);
  const horaPanel = min => { const t = 10 * 60 + Math.floor(min); const h = Math.floor(((t % 1440) + 1440) % 1440 / 60), m = ((t % 60) + 60) % 60; return h + ':' + String(m).padStart(2, '0'); };
  const mmss = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const ticket = id => Z.ses.tickets.find(t => t.id === id);
  const orden = id => Z.ses.ordenes.find(o => o.id === id);
  const visibles = () => Z.ses.tickets.filter(t => Z.llegados.has(t.id));

  function estadoOrden(o, min) {
    let estado = 'Pagada - No iniciada', repartidor = '', desde = -999, fijo = false;
    const pasos = o.eventos.map(e => Object.assign({}, e)).concat(Z.ses.hechas.filter(a => a.orden === o.id && (a.estado || a.repartidor)).map(a => ({ min: a.min, estado: a.estado, repartidor: a.repartidor, forzado: true })))
      .sort((a, b) => a.min - b.min);
    const inicio = pasos.length ? pasos[0].min : 0;
    for (const p of pasos) {
      if (p.min > min) break;
      if (fijo && !p.forzado) continue;
      if (p.estado && p.estado !== estado) { estado = p.estado; desde = p.min; }
      if (p.repartidor) repartidor = p.repartidor;
      if (p.forzado && ['Cancelada', 'Despachada', 'Completada'].includes(p.estado)) fijo = true;
    }
    if (desde === -999) desde = inicio;
    return { estado, repartidor, desde, inicio, historial: pasos.filter(p => p.min <= min) };
  }
  const ESTADO_CLASE = { 'Creada - No pagada': 'gris', 'Pagada - No iniciada': 'rojo', 'Preparación iniciada': 'amarillo', 'Preparada': 'azul', 'Asignada': 'azul', 'En comercio': 'azul',
    'Despachada': 'verde', 'En camino': 'verde', 'En destino': 'morado', 'Completada': 'gris', 'Cancelada': 'gris' };
  const EN_COCINA = ['Pagada - No iniciada', 'Preparación iniciada', 'Preparada', 'Asignada', 'En comercio'];
  const semaforo = (est, min) => {
    if (!EN_COCINA.includes(est.estado)) return '';
    const total = min - est.inicio;
    return total > 20 ? 'rojo' : total > 10 ? 'amarillo' : 'verde';
  };

  /* ---------- Abrir / cerrar ---------- */
  async function abrir(opts) {
    Z.call = opts.call; Z.alSalir = opts.alSalir;
    const r = await Z.call('simIniciar');
    Z.ses = r.sesion; Z.delta = Date.parse(Z.ses.ahora) - Date.now();
    Z.tab = 'home'; Z.abiertos = []; Z.borrador = {}; Z.seleccion = {}; Z.motivo = {}; Z.escribiendo = {}; Z.nudge = {}; Z.log = {}; Z.orden = null;
    Z.llegados = new Set(Z.ses.tickets.filter(t => t.llegada <= segSesion()).map(t => t.id));
    Z.ses.tickets.forEach(t => { if (t.motivo) Z.motivo[t.id] = t.motivo; });
    Z.abiertos = Z.ses.tickets.filter(t => Z.llegados.has(t.id) && !t.cerrado).map(t => t.id);
    if (Z.abiertos.length) Z.tab = Z.abiertos[0];
    Z.root = document.createElement('div'); Z.root.className = 'zd'; Z.root.setAttribute('role', 'application'); Z.root.setAttribute('aria-label', 'Simulador de tickets');
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

  /* ---------- Reloj: llegada de tickets, clientes impacientes, refresco del panel ---------- */
  function tic() {
    if (!Z.ses || !Z.root) return;
    const s = segSesion();
    Z.ses.tickets.forEach(t => {
      if (!Z.llegados.has(t.id) && t.llegada <= s) {
        Z.llegados.add(t.id);
        if (!Z.abiertos.includes(t.id)) Z.abiertos.push(t.id);
        sonar('ticket'); avisarTitulo(); toast('Nuevo ticket de ' + t.cliente.nombre + ' por WhatsApp');
        pintarTabs(); if (Z.tab === 'home') pintarCuerpo();
      }
      // Cliente impaciente: si pasa 1 minuto sin primera respuesta, insiste (solo visual)
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
    else if (Z.ses.tickets.some(t => t.id === Z.tab)) actualizarEspera();
    if (Z.tab === 'home') actualizarEspera();
  }
  function avisarTitulo() {
    clearInterval(Z.flash); let on = false, n = 0;
    Z.flash = setInterval(() => { document.title = (on = !on) ? '(1) Nuevo ticket' : Z.titulo; if (++n > 9 || !document.hidden) { clearInterval(Z.flash); document.title = Z.titulo; } }, 900);
  }

  /* ---------- Pintado general ---------- */
  function pintar() {
    Z.root.innerHTML =
      '<div class="zd-alerta" role="note">' + ic('info') + '<span><b>Simulación de Ridery Academy:</b> los tickets y órdenes son de práctica. Atiende como si fueran reales.</span>' +
      '<span class="zd-reloj">' + ic('clock') + 'Tiempo restante <b data-reloj>' + mmss(Z.ses.minutos * 60 - segSesion()) + '</b></span>' +
      '<button class="zd-link" data-salir title="El tiempo sigue corriendo">Salir</button><button class="zd-link" data-sonido>' + (Z.silencio ? 'Activar sonido' : 'Silenciar') + '</button><button class="zd-btn zd-btn-sm" data-terminar>Terminar simulación</button></div>' +
      '<header class="zd-top"><span class="zd-logo" aria-hidden="true">RA</span><button class="zd-workspace">Soporte ' + ic('chev') + '</button><nav class="zd-tabs" id="zd-tabs" aria-label="Pestañas"></nav>' +
      '<div class="zd-top-ic">' + ic('search') + '<span class="zd-sep"></span>' + ic('bell') + '<span class="zd-sep"></span>' + ic('grid') + '<span class="zd-avatar">' + ic('user') + '</span></div></header>' +
      '<div class="zd-wrap"><nav class="zd-rail" aria-label="Navegación"><button data-ir="home" title="Inicio">' + ic('home') + '</button><button data-ir="home" title="Vistas">' + ic('inbox') + '</button>' +
      '<button title="Clientes" disabled>' + ic('users') + '</button><button title="Organizaciones" disabled>' + ic('org') + '</button><button data-ir="panel" title="Panel de órdenes">' + ic('store') + '</button>' +
      '<button title="Reportes" disabled>' + ic('chart') + '</button><span class="zd-rail-sep"></span><button title="Base de conocimientos" disabled>' + ic('book') + '</button></nav>' +
      '<main class="zd-main" id="zd-main"></main></div>';
    Z.root.querySelector('[data-terminar]').addEventListener('click', () => terminar(false));
    Z.root.querySelector('[data-salir]').addEventListener('click', async () => {
      if (!await confirmar({ titulo: '¿Salir del simulador?', texto: 'El tiempo sigue corriendo. Puedes volver a entrar desde Assessment para continuar donde quedaste.', ok: 'Salir', cancelar: 'Seguir' })) return;
      const cb = Z.alSalir; cerrar(); Z.ses = null; if (cb) cb();
    });
    Z.root.querySelector('[data-sonido]').addEventListener('click', e => { Z.silencio = !Z.silencio; e.target.textContent = Z.silencio ? 'Activar sonido' : 'Silenciar'; });
    Z.root.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => ir(b.dataset.ir)));
    pintarTabs(); pintarCuerpo();
  }
  function ir(tab) { Z.tab = tab; if (tab !== 'panel') Z.orden = null; pintarTabs(); pintarCuerpo(); }
  function pendienteDe(t) { return !t.cerrado && t.chat.length && t.chat[t.chat.length - 1].de === 'cliente'; }
  function pintarTabs() {
    const nav = Z.root.querySelector('#zd-tabs');
    const tab = (id, html, act, cerrable, alerta) => '<div class="zd-tab' + (act ? ' act' : '') + (alerta ? ' alerta' : '') + '" data-tab="' + esc(id) + '" role="tab" tabindex="0" aria-selected="' + act + '">' + html +
      (cerrable ? '<button class="zd-tab-x" data-cerrar="' + esc(id) + '" aria-label="Cerrar pestaña">' + ic('x') + '</button>' : '') + '</div>';
    nav.innerHTML = tab('home', ic('home') + '<span class="zd-tab-t"><b>Inicio</b><small>' + visibles().filter(t => !t.cerrado).length + ' sin resolver</small></span>', Z.tab === 'home') +
      tab('panel', ic('store') + '<span class="zd-tab-t"><b>PANEL DE ÓRDENES</b><small>Hora ' + horaPanel(minPanel()) + '</small></span>', Z.tab === 'panel') +
      Z.abiertos.map(id => { const t = ticket(id); return tab(id, '<span class="zd-tab-ic">' + ic('wa') + '</span><span class="zd-tab-t"><b>' + esc(t.cliente.nombre) + '</b><small>' + esc((t.chat.filter(m => m.de === 'cliente').slice(-1)[0] || {}).t || t.asunto) + '</small></span>', Z.tab === id, true, Z.tab !== id && pendienteDe(t)); }).join('') +
      '<button class="zd-tab-mas" aria-label="Nueva pestaña" disabled>' + ic('plus') + '</button>';
    nav.querySelectorAll('[data-tab]').forEach(b => {
      b.addEventListener('click', e => { if (!e.target.closest('[data-cerrar]')) ir(b.dataset.tab); });
      b.addEventListener('keydown', e => { if (e.key === 'Enter') ir(b.dataset.tab); });
    });
    nav.querySelectorAll('[data-cerrar]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); cerrarTab(b.dataset.cerrar); }));
  }
  function cerrarTab(id) {
    Z.abiertos = Z.abiertos.filter(x => x !== id);
    if (Z.tab === id) Z.tab = Z.abiertos[0] || 'home';
    pintarTabs(); pintarCuerpo();
  }
  function pintarCuerpo() {
    const main = Z.root.querySelector('#zd-main');
    Z.root.querySelectorAll('.zd-rail [data-ir]').forEach(b => b.classList.toggle('act', b.dataset.ir === Z.tab || (b.dataset.ir === 'home' && Z.tab === 'home')));
    if (Z.tab === 'home') return vistaInicio(main);
    if (Z.tab === 'panel') return vistaPanel(main);
    vistaTicket(main, ticket(Z.tab));
  }

  /* ---------- Inicio: vista de tickets ---------- */
  function vistaInicio(main) {
    const ts = visibles();
    main.innerHTML = '<div class="zd-vista"><div class="zd-vista-side"><h2>Vistas</h2><button class="act">Tus tickets sin resolver <b>' + ts.filter(t => !t.cerrado).length + '</b></button>' +
      '<button disabled>Tickets resueltos <b>' + ts.filter(t => t.cerrado).length + '</b></button><button data-ir2="panel">Panel de órdenes ' + ic('store') + '</button></div>' +
      '<div class="zd-vista-main"><h1>Tus tickets sin resolver</h1><p class="zd-muted">' + (ts.length ? 'Los tickets nuevos se abren solos en una pestaña. Atiéndelos en el orden que creas mejor.' : 'Todavía no ha llegado ningún ticket. Mientras tanto, revisa el Panel de órdenes.') + '</p>' +
      '<table class="zd-tabla"><thead><tr><th></th><th>Asunto</th><th>Solicitante</th><th>Canal</th><th>Espera</th><th>Estado</th></tr></thead><tbody>' +
      (ts.length ? ts.map(t => '<tr data-abrir="' + esc(t.id) + '" tabindex="0"><td><span class="zd-dot ' + (t.cerrado ? 'gris' : pendienteDe(t) ? 'rojo' : 'verde') + '"></span></td><td><b>' + esc(t.asunto) + '</b><small>#' + t.numero + '</small></td><td>' + esc(t.cliente.nombre) + '</td><td>WhatsApp</td>' +
        '<td data-espera="' + esc(t.id) + '"></td><td>' + (t.cerrado ? '<span class="zd-estado resuelto">Resuelto</span>' : '<span class="zd-estado abierto">Abierto</span>') + '</td></tr>').join('')
        : '<tr><td colspan="6" class="zd-vacio">Sin tickets por ahora</td></tr>') + '</tbody></table></div></div>';
    main.querySelectorAll('[data-abrir]').forEach(r => {
      const abrirT = () => { const id = r.dataset.abrir; if (!Z.abiertos.includes(id)) Z.abiertos.push(id); ir(id); };
      r.addEventListener('click', abrirT); r.addEventListener('keydown', e => { if (e.key === 'Enter') abrirT(); });
    });
    const p = main.querySelector('[data-ir2]'); if (p) p.addEventListener('click', () => ir('panel'));
    actualizarEspera();
  }
  function esperaDe(t) {
    if (t.cerrado || !pendienteDe(t)) return null;
    // desde el último mensaje del agente (o desde la llegada)
    const ultimo = Z.esperaDesde && Z.esperaDesde[t.id];
    return segSesion() - (ultimo != null ? ultimo : t.llegada);
  }
  function actualizarEspera() {
    Z.root.querySelectorAll('[data-espera]').forEach(el => {
      const t = ticket(el.dataset.espera), s = esperaDe(t);
      el.textContent = s == null ? '—' : mmss(s);
      el.classList.toggle('tarde', s != null && s > 60);
    });
  }

  /* ---------- Ticket ---------- */
  function burbuja(m, t) {
    if (m.de === 'sistema') return '<div class="zd-sis">' + esc(m.t) + '</div>';
    const cli = m.de === 'cliente';
    return '<div class="zd-msg ' + (cli ? 'cli' : 'ag') + '">' + (cli ? '' : '<span class="zd-msg-av">' + ic('user') + '</span>') +
      '<div class="zd-msg-c">' + (cli ? '' : '<div class="zd-msg-h"><b>Tú</b> ' + ic('wa') + ' <span>· WhatsApp</span></div>') +
      '<div class="zd-msg-b">' + (m.t === '📷 Foto' ? '<span class="zd-foto">📷 IMG_20261106.jpg<small>JPEG</small></span>' : esc(m.t).replace(/\n/g, '<br>')) + '</div></div></div>';
  }
  function vistaTicket(main, t) {
    if (!t) return ir('home');
    const tags = ['whatsapp', 'orders', 'sentiment__' + (t.nivel >= 3 ? 'neutral' : 'negative'), 'language_es'];
    main.innerHTML = '<div class="zd-ticket">' +
      '<div class="zd-sub"><span class="zd-crumb">Organización (crear)</span><span class="zd-crumb">' + esc(t.cliente.nombre) + '</span><span class="zd-crumb act"><span class="zd-estado ' + (t.cerrado ? 'resuelto">Resuelto' : 'abierto">Abierto') + '</span> Ticket #' + t.numero + '</span></div>' +
      '<div class="zd-cols">' +
      // Campos del ticket
      '<aside class="zd-campos"><div class="zd-aviso">' + ic('info') + '<span>Ticket ' + (t.cerrado ? 'resuelto' : 'actualizado') + '</span></div>' +
      '<div class="zd-campo"><label>Etiquetas</label><div class="zd-tags">' + tags.map(x => '<span>' + esc(x) + '</span>').join('') + '</div></div>' +
      '<div class="zd-campo"><label for="zd-motivo">Motivo de Contacto | Orders</label><select id="zd-motivo"' + (t.cerrado ? ' disabled' : '') + '><option value="">-</option>' +
        Z.ses.motivos.map(m => '<option' + ((Z.motivo[t.id] || '') === m ? ' selected' : '') + '>' + esc(m) + '</option>').join('') + '</select></div>' +
      '<div class="zd-campo"><label>Calificación</label><input disabled></div>' +
      '<div class="zd-campo"><label>Grupo de canales</label><select disabled><option>Digital</option></select></div>' +
      '<div class="zd-campo"><label>Prioridad</label><select disabled><option>Normal</option></select></div></aside>' +
      // Conversación
      '<section class="zd-conv"><div class="zd-conv-h"><div><h2>Conversación con ' + esc(t.cliente.nombre.split(' ')[0]) + '</h2>' +
        '<div class="zd-meta"><span class="zd-espera" data-espera="' + esc(t.id) + '"></span><span>A través de<br>WhatsApp</span><span class="zd-activa">' + (t.cerrado ? '● Cerrada' : '● Activa') + '</span>' +
        '<span>Tema <a>' + esc(t.asunto) + '</a></span><span class="zd-humor h' + t.nivel + '">' + ic('smile') + esc(t.humor) + '</span></div></div>' +
        '<div class="zd-conv-ic">' + ic('list') + ic('filter') + ic('history') + ic('dots') + '</div></div>' +
      '<div class="zd-chat" id="zd-chat" aria-live="polite">' + t.chat.map(m => burbuja(m, t)).join('') + (Z.escribiendo[t.id] ? '<div class="zd-typing"><span></span><span></span><span></span> ' + esc(t.cliente.nombre.split(' ')[0]) + ' está escribiendo</div>' : '') + '</div>' +
      compositor(t) + '</section>' +
      // Contexto del cliente
      '<aside class="zd-ctx"><div class="zd-ctx-h"><span class="zd-avatar g">' + ic('user') + '</span><b>' + esc(t.cliente.nombre) + '</b></div>' +
        '<dl><dt>Teléfono</dt><dd><a>' + esc(t.cliente.telefono) + '</a></dd><dt>WhatsApp</dt><dd>' + esc(String(t.cliente.telefono).replace('+', '')) + '</dd>' +
        '<dt>Hora local</dt><dd>' + new Date(ahora()).toLocaleString('es-VE', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) + ' GMT-4</dd><dt>Notas</dt><dd><div class="zd-notas">' + esc(t.cliente.notas || '') + '</div></dd></dl>' +
        '<div class="zd-ctx-b"><h3>Historial de interacción</h3><div class="zd-hist act"><span class="zd-sq"></span><div><b>Conversación con ' + esc(t.cliente.nombre.split(' ')[0]) + '</b><small>Ahora · Estado ' + (t.cerrado ? 'Resuelto' : 'Abierto') + '</small></div></div>' +
        '<div class="zd-hist"><span class="zd-sq g"></span><div><b>Conversación con ' + esc(t.cliente.nombre.split(' ')[0]) + '</b><small>21 oct. · Estado Resuelto</small></div></div></div>' +
        '<div class="zd-ctx-b"><h3>¿Es por una orden?</h3><p class="zd-muted">Búscala en el Panel de órdenes por número o por nombre del cliente.</p><button class="zd-btn zd-btn-sec zd-btn-sm" data-ir3>' + ic('store') + 'Abrir Panel de órdenes</button></div></aside>' +
      '</div>' +
      '<footer class="zd-pie"><div class="zd-macro">' + ic('bolt') + '<select disabled><option>Aplicar macro</option></select></div><div class="grow"></div>' +
        '<button class="zd-link" data-cerrar-tab>Cerrar pestaña ' + ic('chev') + '</button>' +
        '<button class="zd-btn" data-resolver' + (t.cerrado ? ' disabled' : '') + '>' + (t.cerrado ? 'Resuelto' : 'Enviar como <b>Resuelto</b>') + '</button></footer></div>';
    const chat = main.querySelector('#zd-chat'); chat.scrollTop = chat.scrollHeight;
    main.querySelector('#zd-motivo').addEventListener('change', e => { Z.motivo[t.id] = e.target.value; });
    main.querySelector('[data-cerrar-tab]').addEventListener('click', () => cerrarTab(t.id));
    main.querySelector('[data-ir3]').addEventListener('click', () => ir('panel'));
    main.querySelector('[data-resolver]').addEventListener('click', () => resolver(t));
    enlazarCompositor(main, t);
    actualizarEspera();
  }
  function compositor(t) {
    if (t.cerrado) return '<div class="zd-comp zd-comp-fin">Ticket resuelto · Motivo: <b>' + esc(t.motivo || Z.motivo[t.id] || '—') + '</b></div>';
    if (Z.escribiendo[t.id]) return '<div class="zd-comp zd-comp-fin">Esperando la respuesta del cliente…</div>';
    if (t.listo) return '<div class="zd-comp zd-comp-fin">' + ic('info') + ' El cliente no tiene más preguntas. Elige el <b>Motivo de contacto</b> y envía el ticket como <b>Resuelto</b>.</div>';
    const sel = Z.seleccion[t.id];
    return '<div class="zd-comp"><div class="zd-comp-h">' + ic('wa') + ' WhatsApp ' + ic('chev') + '<span class="grow"></span><span class="zd-muted">Respuestas sugeridas</span></div>' +
      '<div class="zd-sug" role="listbox" aria-label="Respuestas sugeridas">' + t.opciones.map(o => '<button role="option" aria-selected="' + (sel === o.i) + '" class="' + (sel === o.i ? 'act' : '') + '" data-op="' + o.i + '">' + esc(o.t) + '</button>').join('') +
      '<button role="option" aria-selected="' + (sel === 'otro') + '" class="otro' + (sel === 'otro' ? ' act' : '') + '" data-op="otro">✎ Otro: escribir mi propia respuesta</button></div>' +
      '<textarea id="zd-txt" rows="3" placeholder="Elige una respuesta sugerida o escribe la tuya con «Otro»" ' + (sel === 'otro' ? '' : 'readonly') + ' maxlength="1000">' + esc(sel === 'otro' ? (Z.borrador[t.id] || '') : sel != null ? (t.opciones.find(o => o.i === sel) || {}).t || '' : '') + '</textarea>' +
      '<div class="zd-comp-f">' + ic('emoji') + ic('clip') + ic('link') + ic('mic') + '<span class="grow"></span><button class="zd-link fuerte" data-enviar' + (sel == null ? ' disabled' : '') + '>Enviar</button></div></div>';
  }
  function enlazarCompositor(main, t) {
    main.querySelectorAll('[data-op]').forEach(b => b.addEventListener('click', () => {
      Z.seleccion[t.id] = b.dataset.op === 'otro' ? 'otro' : Number(b.dataset.op);
      const comp = main.querySelector('.zd-comp'); comp.outerHTML = compositor(t); enlazarCompositor(main, t);
      const ta = main.querySelector('#zd-txt'); if (Z.seleccion[t.id] === 'otro') ta.focus();
    }));
    const ta = main.querySelector('#zd-txt');
    if (ta) {
      ta.addEventListener('input', () => { Z.borrador[t.id] = ta.value; const b = main.querySelector('[data-enviar]'); if (b) b.disabled = Z.seleccion[t.id] === 'otro' && !ta.value.trim(); });
      ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(t); } });
      if (Z.seleccion[t.id] === 'otro') { const b = main.querySelector('[data-enviar]'); if (b) b.disabled = !ta.value.trim(); }
    }
    const env = main.querySelector('[data-enviar]'); if (env) env.addEventListener('click', () => enviar(t));
  }
  async function enviar(t) {
    const sel = Z.seleccion[t.id];
    if (sel == null || Z.enviando) return;
    const otro = sel === 'otro' ? (Z.borrador[t.id] || '').trim() : '';
    if (sel === 'otro' && !otro) return toast('Escribe tu respuesta.', 'bad');
    Z.enviando = true;
    try {
      const r = await Z.call('simResponder', Object.assign({ sesion: Z.ses.id, ticket: t.id }, sel === 'otro' ? { otro } : { opcion: sel }));
      t.chat.push({ de: 'agente', t: sel === 'otro' ? otro : t.opciones.find(o => o.i === sel).t });
      Z.esperaDesde = Z.esperaDesde || {}; Z.esperaDesde[t.id] = null;
      delete Z.seleccion[t.id]; delete Z.borrador[t.id];
      t.opciones = []; Z.escribiendo[t.id] = true;
      if (Z.tab === t.id) pintarCuerpo();
      // El cliente "escribe" y luego llegan sus mensajes uno por uno
      let espera = 900;
      r.mensajes.forEach((m, k) => {
        espera += 1000 + Math.min(2600, m.t.length * 35);
        setTimeout(() => {
          if (!Z.ses) return;
          t.chat.push(m); sonar('mensaje');
          if (k === r.mensajes.length - 1) {
            Z.escribiendo[t.id] = false; t.opciones = r.opciones; t.listo = r.listo; t.humor = r.humor; t.nivel = r.nivel;
            Z.esperaDesde[t.id] = segSesion();
          }
          if (Z.tab === t.id) pintarCuerpo(); else pintarTabs();
        }, espera);
      });
      if (!r.mensajes.length) { Z.escribiendo[t.id] = false; t.opciones = r.opciones; t.listo = r.listo; if (Z.tab === t.id) pintarCuerpo(); }
      pintarTabs();
    } catch (e) { manejar(e); }
    Z.enviando = false;
  }
  async function resolver(t) {
    const motivo = Z.motivo[t.id];
    if (!motivo) { toast('Elige el Motivo de contacto antes de resolver.', 'bad'); const s = Z.root.querySelector('#zd-motivo'); if (s) s.focus(); return; }
    if (!t.listo && !await confirmar({ titulo: '¿Resolver sin terminar la conversación?', texto: 'El cliente todavía espera tu respuesta. Si lo resuelves ahora, el ticket se cierra así.', ok: 'Resolver igual' })) return;
    try {
      const r = await Z.call('simResolver', { sesion: Z.ses.id, ticket: t.id, motivo });
      t.cerrado = true; t.motivo = motivo;
      toast('Ticket #' + t.numero + ' resuelto');
      cerrarTab(t.id);
      if (!r.pendientes && Z.ses.tickets.every(x => Z.llegados.has(x.id))) {
        if (await confirmar({ titulo: '¡Resolviste todos los tickets!', texto: 'Puedes seguir revisando el Panel de órdenes o terminar la simulación ahora.', ok: 'Terminar simulación', cancelar: 'Seguir en el panel' })) terminar(true);
      }
    } catch (e) { manejar(e); }
  }

  /* ---------- Panel de órdenes ---------- */
  const FILTROS = [['activas', 'Activas'], ['no-iniciada', 'No iniciadas'], ['preparacion', 'En preparación'], ['ruta', 'Asignadas / en camino'], ['cerradas', 'Cerradas'], ['todas', 'Todas']];
  const enFiltro = (f, e) => f === 'todas' ? true : f === 'cerradas' ? ['Completada', 'Cancelada'].includes(e) : f === 'no-iniciada' ? e === 'Pagada - No iniciada' || e === 'Creada - No pagada'
    : f === 'preparacion' ? ['Preparación iniciada', 'Preparada'].includes(e) : f === 'ruta' ? ['Asignada', 'En comercio', 'Despachada', 'En camino', 'En destino'].includes(e) : !['Completada', 'Cancelada'].includes(e);
  function vistaPanel(main) {
    main.innerHTML = '<div class="zp"><div class="zp-h"><div><h1>' + ic('store') + ' Panel de órdenes</h1><p class="zd-muted">Reloj del panel acelerado ×' + Z.ses.velocidad + ' · cada minuto real son ' + Z.ses.velocidad + ' minutos del panel.</p></div>' +
      '<div class="zp-hora">' + ic('clock') + '<span>Hora del panel</span><b data-hora>' + horaPanel(minPanel()) + '</b></div></div>' +
      '<div class="zp-filtros"><div class="zp-seg">' + FILTROS.map(f => '<button data-f="' + f[0] + '" class="' + (Z.filtro === f[0] ? 'act' : '') + '">' + f[1] + '</button>').join('') + '</div>' +
      '<label class="zp-buscar">' + ic('search') + '<input id="zp-q" placeholder="Buscar por orden, cliente o comercio" value="' + esc(Z.q) + '"></label></div>' +
      '<div class="zp-leyenda"><span><i class="verde"></i>0–10 min</span><span><i class="amarillo"></i>11–20 min</span><span><i class="rojo"></i>+20 min sin salir del comercio</span></div>' +
      '<div class="zp-cuerpo"><div class="zp-tabla-w"><table class="zd-tabla zp-tabla"><thead><tr><th></th><th>Orden</th><th>Comercio</th><th>Cliente</th><th>Estatus</th><th>En este estatus</th><th>Repartidor</th><th>Total</th></tr></thead><tbody id="zp-body"></tbody></table></div>' +
      '<aside class="zp-det" id="zp-det"' + (Z.orden ? '' : ' hidden') + '></aside></div></div>';
    main.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => { Z.filtro = b.dataset.f; main.querySelectorAll('[data-f]').forEach(x => x.classList.toggle('act', x === b)); actualizarPanel(true); }));
    main.querySelector('#zp-q').addEventListener('input', e => { Z.q = e.target.value; actualizarPanel(true); });
    actualizarPanel(true);
  }
  function actualizarPanel(forzar) {
    const main = Z.root.querySelector('#zd-main'); if (!main || !main.querySelector('#zp-body')) return;
    const min = minPanel();
    const h = main.querySelector('[data-hora]'); if (h) h.textContent = horaPanel(min);
    const tabP = Z.root.querySelector('[data-tab="panel"] small'); if (tabP) tabP.textContent = 'Hora ' + horaPanel(min);
    const q = Z.q.trim().toLowerCase();
    const filas = Z.ses.ordenes.map(o => ({ o, e: estadoOrden(o, min) }))
      .filter(x => x.o.eventos.length && x.o.eventos[0].min <= min)
      .filter(x => enFiltro(Z.filtro, x.e.estado))
      .filter(x => !q || (x.o.id + ' ' + x.o.cliente + ' ' + x.o.comercio).toLowerCase().includes(q))
      .sort((a, b) => a.e.inicio - b.e.inicio);
    const html = filas.length ? filas.map(({ o, e }) => '<tr data-o="' + esc(o.id) + '" class="' + (Z.orden === o.id ? 'act' : '') + '" tabindex="0"><td><span class="zd-dot ' + (semaforo(e, min) || 'gris') + '"></span></td><td class="num"><b>' + esc(o.id) + '</b></td><td>' + esc(o.comercio) + '</td><td>' + esc(o.cliente) + '</td>' +
      '<td><span class="zp-est ' + (ESTADO_CLASE[e.estado] || '') + '">' + esc(e.estado) + '</span></td><td class="num">' + Math.max(0, Math.floor(min - e.desde)) + ' min</td><td>' + (e.repartidor ? esc(e.repartidor) : '<span class="zd-muted">Sin asignar</span>') + '</td><td class="num">' + esc(o.total) + '</td></tr>').join('')
      : '<tr><td colspan="8" class="zd-vacio">No hay órdenes con este filtro</td></tr>';
    const body = main.querySelector('#zp-body');
    if (forzar || body.dataset.h !== html) {
      body.innerHTML = html; body.dataset.h = html;
      body.querySelectorAll('[data-o]').forEach(r => {
        const sel = () => { Z.orden = r.dataset.o; Z.log[Z.orden] = Z.log[Z.orden] || []; actualizarPanel(true); };
        r.addEventListener('click', sel); r.addEventListener('keydown', e => { if (e.key === 'Enter') sel(); });
      });
    }
    pintarDetalle(min, forzar);
  }
  function pintarDetalle(min, forzar) {
    const det = Z.root.querySelector('#zp-det'); if (!det) return;
    if (!Z.orden) { det.hidden = true; return; }
    const o = orden(Z.orden), e = estadoOrden(o, min);
    const cerrada = ['Completada', 'Cancelada'].includes(e.estado);
    const acciones = Object.entries(Z.ses.acciones).filter(([k]) => k !== 'publicar-shoppers' || /forum/i.test(o.comercio));
    const html = '<div class="row-between"><h2>' + esc(o.id) + '</h2><button class="zd-tab-x" data-cerrar-det aria-label="Cerrar detalle">' + ic('x') + '</button></div>' +
      '<span class="zp-est ' + (ESTADO_CLASE[e.estado] || '') + '">' + esc(e.estado) + '</span>' +
      '<dl class="zp-dl"><dt>' + ic('store') + 'Comercio</dt><dd>' + esc(o.comercio) + '</dd><dt>' + ic('user') + 'Cliente</dt><dd>' + esc(o.cliente) + (o.zona ? ' · ' + esc(o.zona) : '') + '</dd>' +
      '<dt>' + ic('bike') + 'Repartidor</dt><dd>' + esc(e.repartidor || 'Sin asignar') + '</dd><dt>' + ic('list') + 'Productos</dt><dd>' + o.items.map(esc).join('<br>') + '</dd><dt>Total</dt><dd><b>' + esc(o.total) + '</b></dd></dl>' +
      '<h3>Línea de tiempo</h3><ol class="zp-linea">' + e.historial.map(p => '<li><b>' + horaPanel(p.min) + '</b> ' + esc(p.estado || '') + (p.repartidor && !p.estado ? 'Repartidor: ' + esc(p.repartidor) : '') + (p.forzado ? ' <small>(tu acción)</small>' : '') + '</li>').join('') + '</ol>' +
      '<h3>Acciones</h3><div class="zp-acc">' + acciones.map(([k, n]) => '<button class="zd-btn zd-btn-sec zd-btn-sm' + (k === 'cancelar' ? ' peligro' : '') + '" data-acc="' + k + '"' + (cerrada ? ' disabled' : '') + '>' + esc(n) + '</button>').join('') + '</div>' +
      (cerrada ? '<p class="zd-muted">La orden está ' + esc(e.estado.toLowerCase()) + '.</p>' : '') +
      '<div class="zp-log">' + Z.ses.hechas.filter(a => a.orden === o.id).map(a => '<div><b>' + horaPanel(a.min) + ' · ' + esc(Z.ses.acciones[a.accion] || a.accion) + '</b><span>' + esc(a.texto) + '</span></div>').join('') + '</div>';
    if (!forzar && det.dataset.h === html) return;
    det.innerHTML = html; det.dataset.h = html; det.hidden = false;
    det.querySelector('[data-cerrar-det]').addEventListener('click', () => { Z.orden = null; actualizarPanel(true); });
    det.querySelectorAll('[data-acc]').forEach(b => b.addEventListener('click', () => accion(o, b.dataset.acc)));
  }
  async function accion(o, acc) {
    if (acc === 'cancelar' && !await confirmar({ titulo: '¿Cancelar la orden ' + o.id + '?', texto: 'Se le hace el reembolso al cliente. No se puede deshacer.', ok: 'Cancelar orden', cancelar: 'Volver', peligro: true })) return;
    try {
      const r = await Z.call('simAccion', { sesion: Z.ses.id, orden: o.id, que: acc });
      Z.ses.hechas.push(r.hecha);
      toast(r.hecha.texto);
      actualizarPanel(true);
    } catch (e) { manejar(e); }
  }

  /* ---------- Final ---------- */
  async function terminar(auto) {
    if (!Z.ses || Z.terminando) return;
    if (!auto && !await confirmar({ titulo: '¿Terminar la simulación?', texto: 'Se envía lo que hiciste al equipo. Los tickets sin resolver quedan como no atendidos.', ok: 'Terminar', peligro: true })) return;
    Z.terminando = true;
    let r = null;
    try { r = await Z.call('simTerminar', { sesion: Z.ses.id }); } catch (e) { toast(e.message, 'bad'); }
    Z.timers.forEach(clearInterval); Z.timers = [];
    Z.root.classList.add('zd-terminada');
    const main = Z.root.querySelector('#zd-main');
    main.innerHTML = '<div class="zd-fin"><div class="zd-fin-c"><span class="zd-fin-ic">✓</span><h1>' + (auto ? 'Se acabó el tiempo' : 'Simulación terminada') + '</h1><p>Gracias. El equipo de Calidad revisa tus respuestas y tus decisiones en el panel; tu resultado te lo comparten ellos.</p>' +
      (r ? '<div class="zd-fin-g"><div><b>' + r.resueltos + '/' + r.total + '</b><span>tickets resueltos</span></div><div><b>' + (r.primeraPromedio != null ? mmss(r.primeraPromedio) : '—') + '</b><span>primera respuesta promedio</span></div><div><b>' + r.acciones + '</b><span>acciones en el panel</span></div></div>' : '') +
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
