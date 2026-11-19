/* ============================================================
   Ridery Academy · Simulador: Admin de Ridery (admin.ridery.app)
   Réplica de práctica del panel administrativo de viajes: Trips →
   Dashboard, All Trips (con «Trip History»), Waiting / Running /
   Completed / Scheduled Requests, Cancelled Trips, Sos Trips; detalle
   del viaje (View Map) y mensajes entre usuario y conductor.
   Lo usa js/simulador.js como una pestaña más de la bandeja.
   ============================================================ */
(function () {
  'use strict';
  const { esc, toast, confirmar } = window.Elx;
  const A = { modulo: 'waiting', vista: null, viaje: null, menu: null, page: 1, campo: {}, q: {}, desde: '', hasta: '', tipoAll: 'Trip', aplicado: {}, filtros: {} };
  let C = null;   // contexto que entrega el simulador

  /* ---------- Íconos estilo Font Awesome del Admin ---------- */
  const I = {
    chart: '<path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/>', plane: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>', cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    gauge: '<path d="M12 14l4-4"/><path d="M3 18a9 9 0 1 1 18 0z"/>', star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>', pin: '<path d="M12 22s7-7.5 7-12a7 7 0 0 0-14 0c0 4.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>', hand: '<path d="M2 12h4l3-3 4 4-3 3M22 12h-4l-4-4"/>',
    car: '<path d="M5 13l1.5-5h11L19 13M4 13h16v5H4zM7 18v2M17 18v2"/>', store: '<path d="M4 9 5.5 4h13L20 9M4 9h16v11H4z"/>', dollar: '<path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    cog: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>', sort: '<path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', chev: '<path d="m6 9 6 6 6-6"/>', up: '<path d="m18 15-6-6-6 6"/>', menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', power: '<path d="M12 2v10M18.4 6.6a9 9 0 1 1-12.8 0"/>',
    msg: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>', export: '<path d="M12 3v12M7 8l5-5 5 5M5 21h14"/>', refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>', left: '<path d="m15 18-6-6 6-6"/>'
  };
  const ic = (n, c) => '<svg class="ai ' + (c || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (I[n] || '') + '</svg>';

  const MODULOS = [['dashboard', 'Dashboard', 'gauge'], ['all', 'All Trips', 'plane'], ['waiting', 'Waiting Requests', 'plane'], ['running', 'Running Requests', 'plane'], ['completed', 'Completed Requests', 'cal'],
    ['scheduled', 'Scheduled Requests', 'cal'], ['cancelled', 'Cancelled Trips', 'cal'], ['sos', 'Sos Trips', 'cal'], ['special', 'Special trips (2)', 'plane']];
  const TITULO = { dashboard: 'Dashboard', all: 'All Trips', waiting: 'Waiting Requests', running: 'Running Requests', completed: 'Completed Requests', scheduled: 'Scheduled Requests', cancelled: 'Cancelled Trips', sos: 'Sos Trips', special: 'Special Trips' };
  const OTROS = [['Shipments', 'chart'], ['Reviews', 'star'], ['Map View', 'pin'], ['Service Providers', 'users'], ['Users', 'users'], ['Emprende con Ridery', 'hand'], ['Service Types', 'car'], ['Store', 'store'], ['Fraud', 'dollar'], ['Trip Payment', 'dollar'], ['Report', 'dollar'], ['Settings', 'cog'], ['Administrative', 'chart']];
  const CAMPOS = { waiting: ['Id', 'User Name', 'User Id', 'Phone'], running: ['User Name', 'Id', 'User Id', 'Provider Name'], completed: ['User Name', 'Id', 'User Id', 'Provider Name'], cancelled: ['User Name', 'Id', 'User Id', 'Provider Name'],
    scheduled: ['User Name', 'Id'], all: ['Id', 'User Id', 'User Name', 'Provider Name', 'Phone'], sos: ['Id', 'User Name'], special: ['Id'] };

  /* ---------- Datos ---------- */
  const minAhora = () => C.minPanel();
  function estado(v, min) {
    const canc = C.ses.hechas.find(a => a.herramienta === 'admin' && a.orden === v.id && a.st);
    if (canc && canc.min <= min) return canc.st;
    let st = ''; for (const e of v.eventos || []) if (e.min <= min) st = e.st;
    return st;
  }
  const existe = (v, min) => v.fecha || (v.eventos || []).some(e => e.min <= min);
  const fechaDe = v => v.fecha ? new Date(v.fecha) : C.fecha(v.min);
  const minDe = (v, st) => { const e = (v.eventos || []).find(x => x.st === st); return e ? e.min : null; };
  function fmt(d) {
    if (!d) return 'N/A';
    const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
    let h = d.getHours(); const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12;
    return d.getDate() + ' ' + m + " '" + String(d.getFullYear()).slice(2) + '<br>' + h + ':' + String(d.getMinutes()).padStart(2, '0') + ' ' + ap;
  }
  const money = n => Number(n || 0).toFixed(2);
  const ESTADO_PILL = { Waiting: 'cel', Accepted: 'cel', Arrived: 'cel', Started: 'cel', Completed: 'ver', Cancelled: 'roj' };
  const pill = (t, c) => '<span class="ap ' + (c || 'gri') + '">' + esc(t) + '</span>';
  function pago(p) {
    const c = /Pago Móvil/i.test(p) ? 'cel' : /Wallet/i.test(p) ? 'nav' : /Debito/i.test(p) ? 'lim' : /Coporate|Corporate/i.test(p) ? 'gra' : /Promo/i.test(p) ? 'roj' : /Paga al subir/i.test(p) ? 'ver2' : 'gri';
    return '<span class="ap ' + c + '">' + esc(p) + '</span>';
  }
  function enModulo(v, st, mod) {
    if (mod === 'waiting') return st === 'Waiting';
    if (mod === 'running') return ['Accepted', 'Arrived', 'Started'].includes(st);
    if (mod === 'completed') return st === 'Completed';
    if (mod === 'cancelled') return st === 'Cancelled' && !v.fecha;
    return false;
  }
  function coincide(v, campo, q) {
    q = String(q || '').trim().toLowerCase(); if (!q) return true;
    const val = { 'Id': v.id, 'User Id': v.userId, 'User Name': v.user, 'Provider Name': v.provider, 'Phone': v.tel }[campo] || '';
    return campo === 'Id' || campo === 'User Id' ? String(val).toLowerCase() === q || String(val).toLowerCase().includes(q) : String(val).toLowerCase().includes(q);
  }
  function filas(mod) {
    const min = minAhora(), ap = A.aplicado[mod] || {};
    if (mod === 'all') {
      if (!ap.ok) return [];
      return C.ses.viajes.filter(v => existe(v, min)).filter(v => ap.tipo === 'Trip History' ? (!ap.desde || fechaDe(v) >= new Date(ap.desde)) : !v.fecha)
        .filter(v => coincide(v, ap.campo, ap.q)).sort((a, b) => Number(a.id) - Number(b.id));
    }
    return C.ses.viajes.filter(v => !v.fecha && existe(v, min)).filter(v => enModulo(v, estado(v, min), mod))
      .filter(v => coincide(v, ap.campo || CAMPOS[mod][0], ap.q)).filter(v => !ap.tipo || ap.tipo === 'All' || v.servicio === ap.tipo)
      .sort((a, b) => Number(b.id) - Number(a.id));
  }

  /* ---------- Columnas por módulo ---------- */
  const userCell = v => '<a class="al">ID : ' + esc(v.userId) + '</a><br><b>Name :</b> ' + esc(v.user) + '<br><b>Email :</b> ' + esc(v.email) + '<br><b>Phone :</b> ' + esc(v.tel);
  const act = v => '<div class="aa"><button class="ab-act" data-menu="' + esc(v.id) + '">Action ' + ic('chev') + '</button>' + (A.menu === v.id ? menuAcciones(v) : '') + '</div>';
  function menuAcciones(v) {
    const st = estado(v, minAhora());
    return '<div class="amenu">' + '<button data-ver="' + esc(v.id) + '">View Map</button>' + (v.mensajes && v.mensajes.length ? '<button data-msg="' + esc(v.id) + '">Messages</button>' : '') +
      '<button data-ruta="' + esc(v.id) + '">Copy Route Url for Google Maps</button>' + (['Waiting', 'Accepted', 'Arrived', 'Started'].includes(st) ? '<button class="peligro" data-cancel="' + esc(v.id) + '">Cancel Trip</button>' : '') + '<button data-cerrar>Cancel</button></div>';
  }
  const COLS = {
    waiting: [['ID', v => esc(v.id)], ['USER', userCell], ['THIRD PARTY', v => esc(v.thirdParty)], ['WHO IS PAYING', v => esc(v.whoIsPaying)], ['NUMBER OF REQUESTS', () => '<a class="al">1</a>'], ['SCHEDULED', () => '-'],
      ['SERVICE TYPE', v => esc(v.servicio)], ['CITY', v => esc(v.ciudad)], ['PICKUP ADDRESS', v => esc(v.pickup)], ['DESTINATION ADDRESS', v => esc(v.destino)], ['DATE AND TIME', v => fmt(fechaDe(v))],
      ['STATUS', v => pill('Waiting', 'cel')], ['PROMO CODE', v => esc(v.promo)], ['EST. AMOUNT', v => money(v.estimado)], ['PAYMENT', v => pago(v.pago)], ['PANEL', () => '---'], ['ACTION', act]],
    running: [['ID', v => esc(v.id)], ['USER ID', v => '<a class="al">' + esc(v.userId) + '</a>'], ['USER', v => esc(v.user)], ['THIRD PARTY', v => esc(v.thirdParty)], ['WHO IS PAYING', v => esc(v.whoIsPaying)],
      ['PROVIDER ID', v => '<a class="al">' + esc(v.providerId) + '</a>'], ['PROVIDER', v => esc(v.provider)], ['SCHEDULED', () => '-'], ['SERVICE TYPE', v => esc(v.servicio)], ['CITY', v => esc(v.ciudad)],
      ['DATE AND TIME', v => fmt(fechaDe(v))], ['COMPLETE DATE', () => 'N/A'], ['CREATED BY', v => esc(v.creadoPor)], ['STATUS', v => { const s = estado(v, minAhora()); return pill(s, ESTADO_PILL[s]); }], ['PROMO CODE', v => esc(v.promo)],
      ['EST. AMOUNT', v => money(v.estimado)], ['IS FIXED', () => pill('Fixed', 'gri')], ['AMOUNT', v => money(v.estimado)], ['TIP', () => 'N/A'], ['PAYMENT', v => pago(v.pago)], ['ACTION', act]],
    completed: [['ID', v => esc(v.id)], ['USER ID', v => '<a class="al">' + esc(v.userId) + '</a>'], ['USER', v => esc(v.user)], ['THIRD PARTY', v => esc(v.thirdParty)], ['WHO IS PAYING', v => esc(v.whoIsPaying)],
      ['PROVIDER ID', v => '<a class="al">' + esc(v.providerId) + '</a>'], ['PROVIDER', v => esc(v.provider)], ['SCHEDULED', () => '-'], ['SERVICE TYPE', v => esc(v.servicio)], ['CITY', v => esc(v.ciudad)],
      ['DATE AND TIME', v => fmt(fechaDe(v))], ['COMPLETE DATE', v => fmt(C.fecha(minDe(v, 'Completed')))], ['PAYMENT DATE', v => fmt(C.fecha(minDe(v, 'Completed')))], ['CREATED BY', v => esc(v.creadoPor)],
      ['STATUS', () => pill('Completed', 'ver')], ['PROMO CODE', v => esc(v.promo)], ['AMOUNT', v => money(v.monto)], ['TIP', v => money(v.tip)], ['KM', v => esc(v.km)], ['PAYMENT', v => pago(v.pago)],
      ['PAYMENT STATUS', v => pill(v.pagoEstado, v.pagoEstado === 'Paid' ? 'ver' : 'nar')], ['PANEL', () => '---'], ['ACTION', act]],
    all: [['ID', v => esc(v.id)], ['USER ID', v => '<a class="al">' + esc(v.userId) + '</a>'], ['USER', v => esc(v.user)], ['THIRD PARTY', v => esc(v.thirdParty)], ['PROVIDER ID', v => '<a class="al">' + esc(v.providerId) + '</a>'],
      ['PROVIDER', v => esc(v.provider)], ['SCHEDULED', () => '-'], ['DATE AND TIME', v => fmt(fechaDe(v))], ['AMOUNT', v => money(v.monto)], ['SERVICE TYPE', v => esc(v.servicio)], ['PAYMENT', v => pago(v.pago)],
      ['PAYMENT STATUS', v => pill(v.pagoEstado, v.pagoEstado === 'Paid' ? 'ver' : 'nar')], ['STATUS', v => { const s = estado(v, minAhora()); return pill(s, ESTADO_PILL[s]); }], ['IN UNDER REVIEW', v => pill(v.revision, 'ver2')], ['ACTION', act]]
  };
  COLS.cancelled = COLS.completed.filter(c => !['COMPLETE DATE', 'PAYMENT DATE', 'KM'].includes(c[0])).map(c => c[0] === 'STATUS' ? ['STATUS', () => pill('Cancelled', 'roj')] : c);
  COLS.scheduled = COLS.running; COLS.sos = COLS.running.slice(0, 7).concat([['ACTION', act]]); COLS.special = COLS.running.slice(0, 7);

  /* ---------- Pintado ---------- */
  function pintar(main, ctx) {
    C = ctx;
    const sidebar = '<aside class="adm-side"><div class="adm-logo"><span>Ridery</span></div><nav>' +
      '<div class="adm-grupo abierto"><button class="adm-g">' + ic('chart') + 'Trips<i class="adm-dot"></i>' + ic(A.vista ? 'chev' : 'up', 'adm-ch') + '</button>' +
      (A.vista ? '' : '<div class="adm-sub">' + MODULOS.map(m => '<button data-mod="' + m[0] + '" class="' + (A.modulo === m[0] ? 'act' : '') + '">' + ic(m[2]) + m[1] + '</button>').join('') + '</div>') + '</div>' +
      OTROS.map(o => '<div class="adm-grupo"><button class="adm-g" disabled>' + ic(o[1]) + o[0] + ic('chev', 'adm-ch') + '</button></div>').join('') + '</nav></aside>';
    main.innerHTML = '<div class="adm">' + sidebar + '<div class="adm-main"><header class="adm-top"><button class="adm-ham" aria-label="Menú">' + ic('menu') + '</button><span class="adm-tit">' + esc(A.vista ? '' : TITULO[A.modulo]) + '</span>' +
      '<select class="adm-lang" aria-label="Idioma"><option>English</option><option>Español</option></select><span class="adm-hora">' + C.horaPanel(minAhora()) + '</span>' + ic('power') + '</header><div class="adm-cont" id="adm-cont"></div></div></div>';
    main.querySelectorAll('[data-mod]').forEach(b => b.addEventListener('click', () => { A.modulo = b.dataset.mod; A.vista = null; A.menu = null; A.page = 1; C.repintar(); }));
    const cont = main.querySelector('#adm-cont');
    if (A.vista === 'detalle') return detalle(cont, C.ses.viajes.find(v => v.id === A.viaje));
    if (A.vista === 'mensajes') return mensajes(cont, C.ses.viajes.find(v => v.id === A.viaje));
    if (A.modulo === 'dashboard') return dashboard(cont);
    lista(cont);
  }
  function filtrosHTML(mod) {
    const ap = A.aplicado[mod] || {}, campo = A.campo[mod] || ap.campo || CAMPOS[mod][0];
    const sel = (l, v, attr) => '<select ' + attr + '>' + l.map(x => '<option' + (x === v ? ' selected' : '') + '>' + esc(x) + '</option>').join('') + '</select>';
    const extra = mod === 'all' ? '<div class="af-row2">' + sel(['Trip', 'Trip History'], A.tipoAll, 'data-tipoall') + '<button class="ab-apply" data-apply>Apply</button><button class="ab-export" disabled>' + ic('export') + ' Export</button></div>'
      : '<div class="af-row2"><div class="af-pag"><button class="act">1</button><button>2</button><button>Next</button><span>Go to</span><input value="1" aria-label="Página"></div>' +
        sel(['Trip Type', 'Moto Baratica', 'Económico', 'Moto', 'Baratica', 'Ridery Premium', 'Carro', 'Moto a mi precio'], A.filtros[mod] || 'Trip Type', 'data-tipo') +
        (mod === 'waiting' ? sel(['Driver Status'], 'Driver Status', 'disabled') : sel(['Payment Status'], 'Payment Status', 'disabled')) + sel(['Payment Type'], 'Payment Type', 'disabled') +
        (mod !== 'waiting' ? sel(['Driver Status'], 'Driver Status', 'disabled') : '') + '<button class="ab-apply" data-apply>Apply</button></div>';
    return '<div class="af"><div class="af-row"><div class="af-col"><span class="af-l">SORT</span><div class="af-pair"><span class="af-sel">' + ic('sort') + sel([mod === 'waiting' ? 'Created Date' : 'Id', 'Id', 'Created Date'], '', 'disabled') + '</span>' +
      '<span class="af-sel">' + ic('sort') + sel([mod === 'all' ? 'Ascending' : 'Descending'], '', 'disabled') + '</span></div></div>' +
      '<div class="af-col"><span class="af-l">SEARCH</span><div class="af-pair"><span class="af-sel">' + ic('sort') + sel(CAMPOS[mod], campo, 'data-campo') + '</span><span class="af-q">' + ic('search') + '<input data-q placeholder="Search..." value="' + esc(A.q[mod] || '') + '"></span></div></div>' +
      '<div class="af-col"><span class="af-l">Date Filter</span><div class="af-pair"><input data-desde placeholder="Start Date" value="' + esc(mod === 'all' ? A.desde : '') + '"' + (mod === 'all' ? '' : ' disabled') + ' title="Formato AAAA-MM-DD"><span class="af-dash">-</span><input placeholder="End Date" disabled></div></div></div>' + extra + '</div>';
  }
  function lista(cont) {
    const mod = A.modulo, cols = COLS[mod], todas = filas(mod), porPag = 12, pags = Math.max(1, Math.ceil(todas.length / porPag));
    if (A.page > pags) A.page = 1;
    const vis = todas.slice((A.page - 1) * porPag, A.page * porPag);
    cont.innerHTML = filtrosHTML(mod) + '<div class="at-w"><table class="at"><thead><tr>' + cols.map(c => '<th>' + c[0] + '</th>').join('') + '</tr></thead><tbody>' +
      (vis.length ? vis.map(v => '<tr>' + cols.map(c => '<td>' + c[1](v) + '</td>').join('') + '</tr>').join('') : '') + '</tbody></table>' +
      (!vis.length ? '<div class="at-vacio">' + (mod === 'all' && !(A.aplicado.all || {}).ok ? '' : 'No data available') + '</div>' : '') +
      (pags > 1 ? '<div class="at-pags">' + Array.from({ length: pags }, (_, k) => '<button data-pag="' + (k + 1) + '" class="' + (A.page === k + 1 ? 'act' : '') + '">' + (k + 1) + '</button>').join('') + '</div>' : '') + '</div>';
    const $ = s => cont.querySelector(s);
    $('[data-q]').addEventListener('input', e => { A.q[mod] = e.target.value; });
    $('[data-q]').addEventListener('keydown', e => { if (e.key === 'Enter') aplicar(); });
    $('[data-campo]').addEventListener('change', e => { A.campo[mod] = e.target.value; });
    const ds = $('[data-desde]'); if (ds && mod === 'all') ds.addEventListener('input', e => { A.desde = e.target.value; });
    const ta = $('[data-tipoall]'); if (ta) ta.addEventListener('change', e => { A.tipoAll = e.target.value; });
    const tp = $('[data-tipo]'); if (tp) tp.addEventListener('change', e => { A.filtros[mod] = e.target.value; });
    $('[data-apply]').addEventListener('click', aplicar);
    cont.querySelectorAll('[data-pag]').forEach(b => b.addEventListener('click', () => { A.page = Number(b.dataset.pag); lista(cont); }));
    enlazarAcciones(cont, () => lista(cont));
    function aplicar() {
      A.aplicado[mod] = { ok: true, campo: A.campo[mod] || CAMPOS[mod][0], q: A.q[mod] || '', tipo: mod === 'all' ? A.tipoAll : (A.filtros[mod] && A.filtros[mod] !== 'Trip Type' ? A.filtros[mod] : ''), desde: mod === 'all' ? A.desde : '' };
      A.page = 1; lista(cont);
      const res = filas(mod);
      if (A.aplicado[mod].q && res.length) C.registrar(res.slice(0, 40).map(v => v.id), 'busqueda');
    }
  }
  function enlazarAcciones(cont, repintar) {
    cont.querySelectorAll('[data-menu]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); A.menu = A.menu === b.dataset.menu ? null : b.dataset.menu; repintar(); }));
    cont.querySelectorAll('[data-cerrar]').forEach(b => b.addEventListener('click', () => { A.menu = null; repintar(); }));
    cont.querySelectorAll('[data-ver]').forEach(b => b.addEventListener('click', () => abrirVista('detalle', b.dataset.ver)));
    cont.querySelectorAll('[data-msg]').forEach(b => b.addEventListener('click', () => abrirVista('mensajes', b.dataset.msg)));
    cont.querySelectorAll('[data-ruta]').forEach(b => b.addEventListener('click', () => { A.menu = null; toast('Ruta copiada para Google Maps'); repintar(); }));
    cont.querySelectorAll('[data-cancel]').forEach(b => b.addEventListener('click', async () => {
      A.menu = null;
      if (!await confirmar({ titulo: '¿Cancelar el viaje #' + b.dataset.cancel + '?', texto: 'El viaje se cancela para el usuario y el conductor. No se puede deshacer.', ok: 'Cancelar viaje', cancelar: 'Volver', peligro: true })) return repintar();
      try { const r = await C.call('simAccionViaje', { sesion: C.ses.id, viaje: b.dataset.cancel, que: 'cancelar-viaje' }); C.ses.hechas.push(r.hecha); toast(r.hecha.texto); } catch (e) { C.manejar(e); }
      repintar();
    }));
  }
  function abrirVista(vista, id) {
    A.vista = vista; A.viaje = id; A.menu = null;
    C.registrar([id], vista);
    C.repintar();
  }
  function dashboard(cont) {
    const min = minAhora(), vs = C.ses.viajes.filter(v => !v.fecha && existe(v, min)), cuenta = mod => vs.filter(v => enModulo(v, estado(v, min), mod)).length;
    cont.innerHTML = '<div class="adm-dash">' + [['Waiting Requests', cuenta('waiting'), 'cel', 'waiting'], ['Running Requests', cuenta('running'), 'nav', 'running'], ['Completed Requests', cuenta('completed'), 'ver', 'completed'], ['Cancelled Trips', cuenta('cancelled'), 'roj', 'cancelled']]
      .map(x => '<button class="adm-card ' + x[2] + '" data-ir="' + x[3] + '"><b>' + x[1] + '</b><span>' + x[0] + '</span></button>').join('') + '</div>';
    cont.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => { A.modulo = b.dataset.ir; C.repintar(); }));
  }

  /* ---------- Detalle del viaje (View Map) ---------- */
  function mapa(v, completado) {
    const seed = Number(String(v.id).slice(-4)) || 7, r = k => ((seed * (k + 3) * 9301 + 49297) % 233280) / 233280;
    const W = 580, H = 300, P = { x: 330 + r(1) * 120, y: 30 + r(2) * 40 }, U = { x: 470 + r(3) * 60, y: 220 + r(4) * 50 }, D = { x: 70 + r(5) * 100, y: 40 + r(6) * 60 };
    let calles = '';
    for (let k = 0; k < 7; k++) calles += '<line x1="' + (k * 95 - 40) + '" y1="0" x2="' + (k * 95 + 60) + '" y2="' + H + '" stroke="#fff" stroke-width="' + (k % 3 ? 7 : 12) + '"/>';
    for (let k = 0; k < 5; k++) calles += '<line x1="0" y1="' + (k * 75 + 20) + '" x2="' + W + '" y2="' + (k * 75 - 20) + '" stroke="#fff" stroke-width="' + (k % 2 ? 6 : 10) + '"/>';
    const lugares = [v.pickup, v.destino, 'Farmacia', 'Automercado', 'Escuela', 'Tienda'].map((t, k) => '<text x="' + (40 + r(k + 10) * 480) + '" y="' + (40 + r(k + 20) * 230) + '" font-size="10" fill="#5f6368">' + esc(String(t).slice(0, 26)) + '</text>').join('');
    const ruta = completado ? '<polyline points="' + [U, { x: U.x - 40, y: U.y - 60 }, { x: (U.x + D.x) / 2, y: U.y - 110 }, { x: D.x + 60, y: D.y + 40 }, D].map(p => p.x + ',' + p.y).join(' ') + '" fill="none" stroke="#c2185b" stroke-width="2.5"/>'
      : '<polyline points="' + [P, U, D].map(p => p.x + ',' + p.y).join(' ') + '" fill="none" stroke="#e8558f" stroke-width="2"/>';
    const marca = (p, color, letra) => '<g transform="translate(' + p.x + ',' + p.y + ')"><path d="M0 0c-8-10-11-14-11-19a11 11 0 0 1 22 0c0 5-3 9-11 19z" fill="' + color + '" stroke="#fff" stroke-width="1.5"/><text x="0" y="-15" font-size="10" fill="#fff" text-anchor="middle" font-weight="700">' + letra + '</text></g>';
    return '<svg class="adm-map" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Mapa del viaje"><rect width="' + W + '" height="' + H + '" fill="#e9ecef"/><rect x="' + (20 + r(7) * 200) + '" y="' + (150 + r(8) * 80) + '" width="120" height="70" fill="#c8e6c9"/>' + calles + lugares + ruta +
      (completado ? '' : marca(P, '#2e7d7a', '⌖')) + marca(U, '#2e7d32', '●') + marca(D, '#c62828', '⚑') + '<text x="8" y="' + (H - 8) + '" font-size="10" fill="#777">Mapa de práctica · Ridery Academy</text></svg>';
  }
  function detalle(cont, v) {
    if (!v) { A.vista = null; return lista(cont); }
    const st = estado(v, minAhora()), comp = st === 'Completed';
    cont.innerHTML = '<button class="adm-volver" data-volver>' + ic('left') + ' Volver a ' + esc(TITULO[A.modulo]) + '</button>' +
      '<div class="ad-g"><div class="ad-card"><h2>Trip Requested</h2><ul><li><b>Real Pickup Address:</b> ' + esc(v.pickup) + ', ' + esc(v.ciudad) + ', Venezuela</li><li><b>Real City Pickup Address:</b> ' + esc(v.ciudad) + '</li>' +
        '<li><b>Real Destination Address:</b> ' + esc(v.destino) + '</li><li><b>Accepted Provider Address:</b> ' + esc(v.providerAddr || '—') + '</li></ul></div>' +
      '<div class="ad-card"><h2>Trip Completed</h2><ul><li><b>Pickup Address:</b> ' + esc(v.pickup) + ', ' + esc(v.ciudad) + '</li><li><b>City Pickup Address:</b> ' + esc(v.ciudad) + '</li><li><b>Destination Address:</b> ' + esc(v.destino) + '</li></ul></div>' +
      '<div class="ad-card">' + mapa(v, false) + '<div class="ad-ley"><span><i class="m1"></i>Provider Location</span><span><i class="m2"></i>Real Pickup Location</span><span><i class="m3"></i>Real Destination Location</span></div>' +
        '<table class="ad-t"><tr><th>REAL KM</th><th>REAL TIME</th><th>SURGE</th><th>PROMO CODE</th><th>TOTAL VALUE OF THE TRIP ACCORDING THE REQUESTED TRIP</th></tr><tr><td>' + esc(v.km) + '</td><td>' + esc(v.realTime) + '</td><td>' + esc(v.surge) + '</td><td>N/A</td><td><button class="ab-recalc" disabled>' + ic('refresh') + ' Recalculate</button></td></tr></table></div>' +
      '<div class="ad-card">' + mapa(v, true) + '<div class="ad-ley"><span><i class="m1"></i>Provider Location</span><span><i class="m2"></i>Pickup Location</span><span><i class="m3"></i>Destination Location</span><span><i class="m4"></i>SOS Created Location</span></div>' +
        '<table class="ad-t"><tr><th>KM TRAVELED</th><th>REAL TIME</th><th>SURGE</th><th>PROMOCODE</th><th>TOTAL</th></tr><tr><td>' + (comp ? esc(v.km) : '0.00') + '</td><td>' + (comp ? esc(v.realTime) : '0.00') + '</td><td>' + esc(v.surge) + '</td><td>N/A</td><td>' + money(comp ? v.monto : 0) + '</td></tr></table></div></div>' +
      '<div class="at-w"><table class="at"><thead><tr><th>TRIP ID</th><th>SERVICE TYPE / PRICE</th><th>USER NAME</th><th>PROVIDER NAME</th><th>DATE TIME</th><th>STATUS</th><th>PAYMENT MODE</th><th>PAYMENT STATUS</th><th>PROMO CODE</th><th>TYPE</th><th>PROMO CODE VALUE</th></tr></thead>' +
        '<tbody><tr><td>' + esc(v.id) + '</td><td>' + esc(v.tarifa || v.servicio) + '</td><td>' + esc(v.user) + '</td><td>' + esc(v.provider || '—') + '</td><td>' + fmt(fechaDe(v)) + '</td><td>' + pill(st, ESTADO_PILL[st]) + '</td><td>' + pago(v.pago) + '</td>' +
        '<td>' + pill(v.pagoEstado, v.pagoEstado === 'Paid' ? 'ver' : 'nar') + '</td><td>---</td><td>---</td><td>---</td></tr></tbody></table></div>' +
      (v.mensajes && v.mensajes.length ? '<button class="ab-apply" data-msg="' + esc(v.id) + '">' + ic('msg') + ' Messages</button>' : '');
    cont.querySelector('[data-volver]').addEventListener('click', () => { A.vista = null; C.repintar(); });
    const m = cont.querySelector('[data-msg]'); if (m) m.addEventListener('click', () => abrirVista('mensajes', v.id));
  }
  function mensajes(cont, v) {
    if (!v) { A.vista = null; return lista(cont); }
    const min = minAhora(), ms = (v.mensajes || []).filter(m => m.min <= min);
    cont.innerHTML = '<button class="adm-volver" data-volver>' + ic('left') + ' Volver a ' + esc(TITULO[A.modulo]) + '</button><div class="am"><h1>' + ic('msg') + ' Messages</h1>' +
      (ms.length ? ms.map(m => '<div class="am-m ' + (m.de === 'provider' ? 'p' : 'u') + '"><div class="am-h"><b>' + esc(m.de === 'provider' ? v.provider : v.user) + '</b><span>' + C.fecha(m.min).toLocaleString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + '</span></div>' + esc(m.t) + '</div>').join('')
        : '<p class="am-vacio">No hay mensajes en este viaje.</p>') + '</div>';
    cont.querySelector('[data-volver]').addEventListener('click', () => { A.vista = null; C.repintar(); });
  }
  document.addEventListener('click', e => { if (A.menu && C && !e.target.closest('.aa')) { A.menu = null; C.repintar(); } });

  const RUTAS = { dashboard: 'dashboard', all: 'all_requests', waiting: 'waiting_requests', running: 'running_requests', completed: 'requests', scheduled: 'scheduled_requests', cancelled: 'cancelled_trips', sos: 'sos_requests', special: 'special_trips' };
  const ruta = () => A.vista === 'detalle' ? 'request_detail/' + A.viaje : A.vista === 'mensajes' ? 'trip_messages/' + A.viaje : RUTAS[A.modulo];
  window.ElxSimAdmin = { pintar, ruta, reiniciar() { Object.assign(A, { modulo: 'waiting', vista: null, viaje: null, menu: null, page: 1, campo: {}, q: {}, desde: '', tipoAll: 'Trip', aplicado: {}, filtros: {} }); } };
})();
