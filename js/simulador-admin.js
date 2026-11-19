/* ============================================================
   Ridery Academy · Simulador: Admin de Ridery (admin.ridery.app)
   Réplica de práctica del panel administrativo completo:
   Trips, Shipments, Reviews, Map View, Service Providers, Users,
   Emprende con Ridery, Service Types, Store, Fraud, Trip Payment,
   Report, Settings y Administrative.
   El ID de usuario y el ID de conductor son números distintos: Users
   busca usuarios y Service Providers busca conductores. Buscar con el
   ID equivocado no encuentra a la persona (o encuentra a otra).
   Todos los datos son inventados. Lo usa js/simulador.js.
   ============================================================ */
(function () {
  'use strict';
  const { esc, toast, confirmar } = window.Elx;
  const ESTADO0 = () => ({ modulo: 'waiting', grupo: 'trips', vista: null, obj: null, menu: null, page: {}, campo: {}, q: {}, sel: {}, desde: '', tipoAll: 'Trip', aplicado: {}, filtros: {}, almacen: null });
  let A = ESTADO0();
  let C = null;   // contexto que entrega el simulador
  let MENU = [];  // acciones del menú abierto

  /* ---------- Íconos estilo Font Awesome del Admin ---------- */
  const I = {
    chart: '<path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/>', plane: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>', cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    gauge: '<path d="M12 14l4-4"/><path d="M3 18a9 9 0 1 1 18 0z"/>', star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>', pin: '<path d="M12 22s7-7.5 7-12a7 7 0 0 0-14 0c0 4.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>', hand: '<path d="M2 12h4l3-3 4 4-3 3M22 12h-4l-4-4"/>',
    car: '<path d="M5 13l1.5-5h11L19 13M4 13h16v5H4zM7 18v2M17 18v2"/>', store: '<path d="M4 9 5.5 4h13L20 9M4 9h16v11H4z"/>', dollar: '<path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    cog: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>', sort: '<path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', chev: '<path d="m6 9 6 6 6-6"/>', up: '<path d="m18 15-6-6-6 6"/>', menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', power: '<path d="M12 2v10M18.4 6.6a9 9 0 1 1-12.8 0"/>',
    msg: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>', export: '<path d="M12 3v12M7 8l5-5 5 5M5 21h14"/>', refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>', left: '<path d="m15 18-6-6 6-6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', thumb: '<path d="M7 11v9H4v-9zM7 11l4-8a2 2 0 0 1 3 2l-1 5h6a2 2 0 0 1 2 2l-2 7a2 2 0 0 1-2 1H7"/>', ban: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
    check: '<path d="m5 12 5 5 9-10"/>', file: '<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/>', box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>'
  };
  const ic = (n, c) => '<svg class="ai ' + (c || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (I[n] || '') + '</svg>';

  /* ---------- Menú lateral (igual al Admin real) ---------- */
  const TRIPS = [['dashboard', 'Dashboard', 'gauge'], ['all', 'All Trips', 'plane'], ['waiting', 'Waiting Requests', 'plane'], ['running', 'Running Requests', 'plane'], ['completed', 'Completed Requests', 'cal'],
    ['scheduled', 'Scheduled Requests', 'cal'], ['cancelled', 'Cancelled Trips', 'cal'], ['sos', 'Sos Trips', 'cal'], ['special', 'Special trips (2)', 'plane']];
  const GRUPOS = [
    ['trips', 'Trips', 'chart', TRIPS],
    ['ship', 'Shipments', 'chart', [['ship-waiting', 'Waiting Shipments', 'box'], ['ship-running', 'Running Shipments', 'box'], ['ship-completed', 'Completed Shipments', 'cal'], ['ship-cancelled', 'Cancelled Shipments', 'cal']]],
    ['rev', 'Reviews', 'star', [['rev-all', 'All Reviews', 'thumb'], ['rev-users', 'Bad Reviews Users', 'msg'], ['rev-drivers', 'Bad Reviews Drivers', 'msg'], ['rev-contacted', 'Contacted Reviews', 'msg']]],
    ['map', 'Map View', 'pin', [['map-providers', 'Providers Map', 'pin']]],
    ['prov', 'Service Providers', 'users', [['prov-all', 'All Service Providers', 'users'], ['prov-online', 'Online Providers', 'user'], ['prov-approved', 'Approved Providers', 'check'], ['prov-unapproved', 'Unapproved Providers', 'user'],
      ['prov-blocked', 'Blocked Drivers', 'ban'], ['prov-cashblocked', 'Cash Blocked Drivers', 'ban'], ['prov-suspended', 'Suspended Drivers', 'ban'], ['prov-deleted', 'Deleted Drivers', 'x'], ['prov-incidents', "Provider's Incidents", 'file'],
      ['prov-bank', 'Datos Bancarios Providers', 'dollar'], ['prov-agreement', 'Payment Agreement', 'hand'], ['prov-autosusp', 'Auto Suspension History', 'file']]],
    ['users', 'Users', 'users', [['users', 'Users', 'user'], ['users-blocked', 'Blocked Users', 'ban'], ['users-deleted', 'Deleted Users', 'x'], ['users-incidents', "User's Incidents", 'file']]],
    ['emp', 'Emprende con Ridery', 'hand', [['emp-aspirantes', 'Aspirantes', 'user'], ['emp-flotas', 'Flotas', 'car']]],
    ['stype', 'Service Types', 'car', [['stype-list', 'Service Types', 'car']]],
    ['store', 'Store', 'store', [['store-inventory', 'Inventory', 'box'], ['store-accessories', 'Accessories', 'box'], ['store-warehouse', 'Warehouse', 'store'], ['store-funders', 'Funders', 'dollar'], ['store-sales', 'Sales Report', 'file'],
      ['store-gift', 'Gift Report', 'file'], ['store-charge', 'Charge Report', 'file'], ['store-payment', 'Payment Report', 'file'], ['store-initial', 'Initial Report', 'file'], ['store-financing', 'Financing Report', 'file'],
      ['store-download', 'Download Report', 'file'], ['store-advance', 'Money Advance History', 'file'], ['store-advcharge', 'Money Advance Charge Report', 'file']]],
    ['fraud', 'Fraud', 'dollar', [['fraud-trips', 'Fraud Trips', 'ban'], ['fraud-pur', 'PUR Trips', 'ban']]],
    ['tpay', 'Trip Payment', 'dollar', [['tpay-inquiries', 'Payment Inquiries', 'dollar'], ['tpay-disputes', 'Cash Disputes', 'dollar']]],
    ['report', 'Report', 'dollar', [['rep-trips', 'Trips Report', 'file'], ['rep-providers', 'Providers Report', 'file'], ['rep-users', 'Users Report', 'file']]],
    ['settings', 'Settings', 'cog', [['set-promo', 'Promo Codes', 'cog']]],
    ['admin', 'Administrative', 'chart', [['adm-liq', 'Liquidaciones', 'dollar']]]
  ];
  const NOMBRE = {}; GRUPOS.forEach(g => g[3].forEach(m => { NOMBRE[m[0]] = m[1].replace(/ \(\d+\)$/, ''); }));
  const grupoDe = mod => (GRUPOS.find(g => g[3].some(m => m[0] === mod)) || GRUPOS[0])[0];
  const esTrip = mod => TRIPS.some(t => t[0] === mod);
  const CAMPOS = { waiting: ['Id', 'User Name', 'User Id', 'Phone'], running: ['User Name', 'Id', 'User Id', 'Provider Name', 'Provider Id'], completed: ['User Name', 'Id', 'User Id', 'Provider Name', 'Provider Id'],
    cancelled: ['User Name', 'Id', 'User Id', 'Provider Name', 'Provider Id'], scheduled: ['User Name', 'Id'], all: ['Id', 'User Id', 'User Name', 'Provider Name', 'Provider Id', 'Phone'], sos: ['Id', 'User Name'], special: ['Id'] };

  /* ---------- Datos ---------- */
  const AD = () => C.ses.admin || { usuarios: [], conductores: [], reviews: [], liquidaciones: [], almacenes: [], stock: [], servicios: [], promos: [], cancelaciones: [], tiposWallet: [] };
  const minAhora = () => C.minPanel();
  const hechas = (accion, obj) => C.ses.hechas.filter(a => a.herramienta === 'admin' && a.accion === accion && (obj == null || a.orden === obj));
  function estado(v, min) {
    const canc = C.ses.hechas.find(a => a.herramienta === 'admin' && a.orden === v.id && a.st);
    if (canc && canc.min <= min) return canc.st;
    let st = ''; for (const e of v.eventos || []) if (e.min <= min) st = e.st;
    return st;
  }
  const existe = (v, min) => v.fecha || (v.eventos || []).some(e => e.min <= min);
  const fechaDe = v => v.fecha ? new Date(v.fecha) : C.fecha(v.min);
  const minDe = (v, st) => { const e = (v.eventos || []).find(x => x.st === st); return e ? e.min : null; };
  const fecha = x => !x ? null : x === 'HOY' ? C.fecha(-25) : x instanceof Date ? x : new Date(x);
  function fmt(d) {
    d = fecha(d); if (!d || isNaN(d)) return 'N/A';
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
  // Estado de usuarios y conductores según lo que hizo el aspirante
  function estadoUsuario(u) { return hechas('eliminar-usuario', 'u:' + u.id).length ? 'Deleted' : hechas('declinar-usuario', 'u:' + u.id).length ? 'Blocked' : u.estado; }
  const estadoConductor = p => hechas('eliminar-conductor', 'p:' + p.id).length ? 'Deleted' : p.estado;
  function walletUsuario(u) { return hechas('agregar-wallet', 'u:' + u.id).reduce((t, a) => t + (a.dato.addcut === 'Cut' ? -1 : 1) * a.dato.monto, Number(u.wallet) || 0); }
  const cuentaEstado = (p, c) => hechas('rechazar-cuenta', 'p:' + p.id).some(a => a.dato && a.dato.cuenta === c.id) ? 'Rejected' : c.estado;
  const contactada = r => r.contactado || hechas('contactado', r.viaje).length > 0;
  const PROV_PILL = { Approved: 'ver', Suspended: 'nar', Blocked: 'roj', 'Cash Blocked': 'roj', Unapproved: 'gri', Deleted: 'gri' };
  // Conductores de los viajes de relleno: también existen en Service Providers
  function conductores() {
    const ad = AD(), lista = ad.conductores.slice(), ids = new Set(lista.map(p => p.id));
    C.ses.viajes.forEach((v, k) => { if (v.providerId && !ids.has(v.providerId)) { ids.add(v.providerId); lista.push({ id: v.providerId, nombre: v.provider, tel: '+58 424' + String(1000000 + k * 7919).slice(0, 7), email: String(v.provider).split(' ')[0].toLowerCase() + '.' + v.providerId.slice(-3) + '@gmail.com',
      req: 300 + k * 7, comp: 280 + k * 6, canc: k % 9, acc: 290 + k * 7, rating: 4.6, disputas: 0, sos: 0, ciudad: String(v.ciudad).split(',')[0], ciudadReg: String(v.ciudad).split(',')[0], servicios: v.servicio, wallet: (k * 1.37) % 20, app: 'android - 6.2.0',
      registro: '2024-01-10T09:00:00', aprobado: '2024-01-12T09:00:00', categoria: 'Impulso', estado: 'Approved', motivoEstado: 'N/A', online: true, ubic: v.providerAddr || v.pickup, vehiculos: [], records: [], cuentas: [], cashBlock: [] }); } });
    return lista;
  }
  function usuarios() {
    const ad = AD(), lista = ad.usuarios.slice(), ids = new Set(lista.map(u => u.id));
    C.ses.viajes.forEach((v, k) => { if (v.userId && !ids.has(v.userId)) { ids.add(v.userId); lista.push({ id: v.userId, nombre: v.user, tel: v.tel, email: v.email, cedula: k % 3 ? 'N/A' : 'V-' + (15000000 + k * 104729), req: 10 + k * 3, comp: 8 + k * 3, canc: k % 4,
      disputas: 0, sos: 0, ciudad: String(v.ciudad).split(',')[0], wallet: 0, corporate: '—', app: 'android - 6.4.0', ota: '6.4.0', registro: '2024-05-20T10:00:00', creadoPor: 'User App', estado: 'Active', documento: 'ok', walletHist: [], records: [], referidos: [] }); } });
    return lista;
  }
  const buscarU = id => usuarios().find(u => u.id === id);
  const buscarP = id => conductores().find(p => p.id === id);

  function enModulo(v, st, mod) {
    if (mod === 'waiting') return st === 'Waiting';
    if (mod === 'running') return ['Accepted', 'Arrived', 'Started'].includes(st);
    if (mod === 'completed') return st === 'Completed';
    if (mod === 'cancelled') return st === 'Cancelled' && !v.fecha;
    return false;
  }
  function coincide(v, campo, q) {
    q = String(q || '').trim().toLowerCase(); if (!q) return true;
    const val = { 'Id': v.id, 'User Id': v.userId, 'User Name': v.user, 'Provider Name': v.provider, 'Provider Id': v.providerId, 'Phone': v.tel }[campo] || '';
    return /Id$/.test(campo) ? String(val).toLowerCase() === q : String(val).toLowerCase().includes(q);
  }
  function filasTrips(mod) {
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

  /* ---------- Columnas de Trips ---------- */
  const userCell = v => '<a class="al" data-u="' + esc(v.userId) + '">ID : ' + esc(v.userId) + '</a><br><b>Name :</b> ' + esc(v.user) + '<br><b>Email :</b> ' + esc(v.email) + '<br><b>Phone :</b> ' + esc(v.tel);
  const uLink = id => id ? '<a class="al" data-u="' + esc(id) + '">' + esc(id) + '</a>' : '';
  const pLink = id => id ? '<a class="al" data-p="' + esc(id) + '">' + esc(id) + '</a>' : '';
  const act = v => '<div class="aa"><button class="ab-act" data-menu="t:' + esc(v.id) + '">Action ' + ic('chev') + '</button>' + (A.menu === 't:' + v.id ? menuViaje(v) : '') + '</div>';
  function menuViaje(v) {
    const st = estado(v, minAhora()), it = [['View Map', () => abrir('detalle', v.id)]];
    if (st === 'Running' || ['Accepted', 'Arrived', 'Started'].includes(st)) it.push(['Chat History', () => abrir('mensajes', v.id)]);
    else if (v.mensajes && v.mensajes.length) it.push(['Messages', () => abrir('mensajes', v.id)]);
    if (st === 'Cancelled') it.push(['See Cancel Description', () => verCancelacion(v)]);
    it.push(['Copy Route Url for Google Maps', () => { A.menu = null; toast('Ruta copiada para Google Maps'); C.repintar(); }]);
    if (['Waiting', 'Accepted', 'Arrived', 'Started', 'Completed'].includes(st)) it.push(['Cancel Trip', () => cancelarViaje(v), 'peligro']);
    return menuHTML(it);
  }
  function menuHTML(items) {
    MENU = items.map(x => x[1]);
    return '<div class="amenu">' + items.map((x, i) => '<button data-mi="' + i + '"' + (x[2] ? ' class="' + x[2] + '"' : '') + '>' + esc(x[0]) + '</button>').join('') + '</div>';
  }
  const COLS = {
    waiting: [['ID', v => esc(v.id)], ['USER', userCell], ['THIRD PARTY', v => esc(v.thirdParty)], ['WHO IS PAYING', v => esc(v.whoIsPaying)], ['NUMBER OF REQUESTS', () => '<a class="al">1</a>'], ['SCHEDULED', () => '-'],
      ['SERVICE TYPE', v => esc(v.servicio)], ['CITY', v => esc(v.ciudad)], ['PICKUP ADDRESS', v => esc(v.pickup)], ['DESTINATION ADDRESS', v => esc(v.destino)], ['DATE AND TIME', v => fmt(fechaDe(v))],
      ['STATUS', v => pill('Waiting', 'cel')], ['PROMO CODE', v => esc(v.promo)], ['EST. AMOUNT', v => money(v.estimado)], ['PAYMENT', v => pago(v.pago)], ['PANEL', () => '---'], ['ACTION', act]],
    running: [['ID', v => esc(v.id)], ['USER ID', v => uLink(v.userId)], ['USER', v => esc(v.user)], ['THIRD PARTY', v => esc(v.thirdParty)], ['WHO IS PAYING', v => esc(v.whoIsPaying)],
      ['PROVIDER ID', v => pLink(v.providerId)], ['PROVIDER', v => esc(v.provider)], ['SCHEDULED', () => '-'], ['SERVICE TYPE', v => esc(v.servicio)], ['CITY', v => esc(v.ciudad)],
      ['DATE AND TIME', v => fmt(fechaDe(v))], ['COMPLETE DATE', () => 'N/A'], ['CREATED BY', v => esc(v.creadoPor)], ['STATUS', v => { const s = estado(v, minAhora()); return pill(s, ESTADO_PILL[s]); }], ['PROMO CODE', v => esc(v.promo)],
      ['EST. AMOUNT', v => money(v.estimado)], ['IS FIXED', () => pill('Fixed', 'gri')], ['AMOUNT', v => money(v.estimado)], ['TIP', () => 'N/A'], ['PAYMENT', v => pago(v.pago)], ['PAYMENT STATUS', v => pill(v.pagoEstado, v.pagoEstado === 'Paid' ? 'ver' : 'nar')], ['PANEL', () => '---'], ['ACTION', act]],
    completed: [['ID', v => esc(v.id)], ['USER ID', v => uLink(v.userId)], ['USER', v => esc(v.user)], ['THIRD PARTY', v => esc(v.thirdParty)], ['WHO IS PAYING', v => esc(v.whoIsPaying)],
      ['PROVIDER ID', v => pLink(v.providerId)], ['PROVIDER', v => esc(v.provider)], ['SCHEDULED', () => '-'], ['SERVICE TYPE', v => esc(v.servicio)], ['CITY', v => esc(v.ciudad)],
      ['DATE AND TIME', v => fmt(fechaDe(v))], ['COMPLETE DATE', v => fmt(C.fecha(minDe(v, 'Completed')))], ['PAYMENT DATE', v => fmt(C.fecha(minDe(v, 'Completed')))], ['CREATED BY', v => esc(v.creadoPor)],
      ['STATUS', () => pill('Completed', 'ver')], ['PROMO CODE', v => esc(v.promo)], ['AMOUNT', v => money(v.monto)], ['TIP', v => money(v.tip)], ['KM', v => money(v.km)], ['PAYMENT', v => pago(v.pago)],
      ['PAYMENT STATUS', v => pill(v.pagoEstado, v.pagoEstado === 'Paid' ? 'ver' : 'nar')], ['PANEL', () => '---'], ['ACTION', act]],
    all: [['ID', v => esc(v.id)], ['USER ID', v => uLink(v.userId)], ['USER', v => esc(v.user)], ['THIRD PARTY', v => esc(v.thirdParty)], ['PROVIDER ID', v => pLink(v.providerId)],
      ['PROVIDER', v => esc(v.provider)], ['SCHEDULED', () => '-'], ['DATE AND TIME', v => fmt(fechaDe(v))], ['AMOUNT', v => money(v.monto)], ['SERVICE TYPE', v => esc(v.servicio)], ['PAYMENT', v => pago(v.pago)],
      ['PAYMENT STATUS', v => pill(v.pagoEstado, v.pagoEstado === 'Paid' ? 'ver' : 'nar')], ['STATUS', v => { const s = estado(v, minAhora()); return pill(s, ESTADO_PILL[s]); }], ['IN UNDER REVIEW', v => pill(v.revision, 'ver2')], ['ACTION', act]]
  };
  COLS.cancelled = COLS.completed.filter(c => !['COMPLETE DATE', 'PAYMENT DATE', 'KM'].includes(c[0])).map(c => c[0] === 'STATUS' ? ['STATUS', () => pill('Cancelled', 'roj')] : c);
  COLS.cancelled.splice(COLS.cancelled.length - 1, 0, ['CANCEL REASON', v => { const h = C.ses.hechas.find(a => a.orden === v.id && a.st === 'Cancelled'); return esc(h && h.dato ? h.dato.motivo : v.cancelDesc ? v.cancelDesc.motivo : 'Cancelled by user'); }]);
  COLS.scheduled = COLS.running; COLS.sos = COLS.running.slice(0, 7).concat([['ACTION', act]]); COLS.special = COLS.running.slice(0, 7);

  /* ---------- Pintado general ---------- */
  function pintar(main, ctx) {
    C = ctx;
    const sidebar = '<aside class="adm-side"><div class="adm-logo"><span>Ridery</span></div><nav>' + GRUPOS.map(g => {
      const abierto = A.grupo === g[0];
      return '<div class="adm-grupo' + (abierto ? ' abierto' : '') + '"><button class="adm-g" data-grupo="' + g[0] + '">' + ic(g[2]) + g[1] + (g[0] === 'trips' ? '<i class="adm-dot"></i>' : '') + ic(abierto ? 'up' : 'chev', 'adm-ch') + '</button>' +
        (abierto ? '<div class="adm-sub">' + g[3].map(m => '<button data-mod="' + m[0] + '" class="' + (A.modulo === m[0] && !A.vista ? 'act' : '') + '">' + ic(m[2]) + esc(m[1]) + '</button>').join('') + '</div>' : '') + '</div>';
    }).join('') + '</nav></aside>';
    const titulo = A.vista ? (TITULO_VISTA[A.vista] || '') : NOMBRE[A.modulo] || '';
    main.innerHTML = '<div class="adm">' + sidebar + '<div class="adm-main"><header class="adm-top"><button class="adm-ham" aria-label="Menú">' + ic('menu') + '</button><span class="adm-tit">' + esc(titulo) + '</span>' +
      '<select class="adm-lang" aria-label="Idioma"><option>English</option><option>Español</option></select><span class="adm-hora">' + C.horaPanel(minAhora()) + '</span>' + ic('power') + '</header><div class="adm-cont" id="adm-cont"></div></div></div>';
    main.querySelectorAll('[data-grupo]').forEach(b => b.addEventListener('click', () => { A.grupo = A.grupo === b.dataset.grupo ? null : b.dataset.grupo; C.repintar(); }));
    main.querySelectorAll('[data-mod]').forEach(b => b.addEventListener('click', () => { A.modulo = b.dataset.mod; A.vista = null; A.menu = null; A.almacen = null; C.repintar(); }));
    const cont = main.querySelector('#adm-cont');
    if (A.vista) return (VISTAS[A.vista] || (() => { A.vista = null; C.repintar(); }))(cont);
    if (A.modulo === 'dashboard') return dashboard(cont);
    if (esTrip(A.modulo)) return listaTrips(cont);
    (MODULOS[A.modulo] || vacio)(cont);
  }
  function abrir(vista, id, sinRegistro) {
    A.vista = vista; A.obj = id; A.menu = null;
    if (!sinRegistro) {
      const reg = vista.startsWith('u-') ? 'u:' + id : vista.startsWith('p-') ? 'p:' + id : id;
      C.registrar([reg], vista);
    }
    C.repintar();
  }
  function volverHTML() { return '<button class="adm-volver" data-volver>' + ic('left') + ' Volver a ' + esc(NOMBRE[A.modulo] || 'la lista') + '</button>'; }
  function enlazarVolver(cont) { const b = cont.querySelector('[data-volver]'); if (b) b.addEventListener('click', () => { A.vista = null; A.obj = null; C.repintar(); }); }
  // Enlaces a usuario o conductor desde cualquier tabla (ID azul)
  function enlazarComunes(cont, repintar) {
    cont.querySelectorAll('[data-menu]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); A.menu = A.menu === b.dataset.menu ? null : b.dataset.menu; repintar(); }));
    cont.querySelectorAll('[data-mi]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); const f = MENU[Number(b.dataset.mi)]; A.menu = null; if (f) f(); }));
    cont.querySelectorAll('[data-u]').forEach(a => a.addEventListener('click', () => abrir('u-edit', a.dataset.u)));
    cont.querySelectorAll('[data-p]').forEach(a => a.addEventListener('click', () => abrir('p-edit', a.dataset.p)));
  }

  /* ---------- Filtros y tabla genérica ---------- */
  const selHTML = (l, v, attr) => '<select ' + attr + '>' + l.map(x => { const val = Array.isArray(x) ? x[0] : x, t = Array.isArray(x) ? x[1] : x; return '<option value="' + esc(val) + '"' + (val === v ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select>';
  function pagHTML(key, total) {
    const pags = Math.max(1, Math.ceil(total / 12)), p = Math.min(A.page[key] || 1, pags);
    return '<div class="af-pag"><button data-pg="' + Math.max(1, p - 1) + '">Pre</button>' + Array.from({ length: Math.min(pags, 5) }, (_, k) => '<button data-pg="' + (k + 1) + '" class="' + (p === k + 1 ? 'act' : '') + '">' + (k + 1) + '</button>').join('') +
      '<button data-pg="' + Math.min(pags, p + 1) + '">Next</button><span>Go to</span><input value="' + p + '" aria-label="Página" data-goto></div>';
  }
  /* def: { campos, cols, filas(ap), vacio (sin datos hasta Apply), fecha, exportar, extra: [{ k, opciones }], reg(row) → id a registrar, menu(row) → items, clave(row) } */
  function tabla(cont, key, def) {
    const ap = A.aplicado[key] || { ok: !def.vacio, campo: def.campos ? def.campos[0] : '', q: '', sel: {} };
    const campo = A.campo[key] || ap.campo || (def.campos || [''])[0];
    const todas = ap.ok ? def.filas(ap) : [];
    const pags = Math.max(1, Math.ceil(todas.length / 12)); let p = A.page[key] || 1; if (p > pags) p = 1;
    const vis = todas.slice((p - 1) * 12, p * 12);
    const cols = def.cols.concat(def.menu ? [['ACTION', r => { const id = key + ':' + def.clave(r); return '<div class="aa"><button class="ab-act" data-menu="' + esc(id) + '">Action ' + ic('chev') + '</button>' + (A.menu === id ? menuHTML(def.menu(r)) : '') + '</div>'; }]] : []);
    const extra = (def.extra || []).map(x => '<span class="af-sel">' + selHTML(x.opciones, (A.sel[key] || {})[x.k] || x.opciones[0], 'data-sel="' + x.k + '"') + '</span>').join('');
    cont.innerHTML = (def.antes || '') + '<div class="af"><div class="af-row">' +
      (def.sinOrden ? '' : '<div class="af-col"><span class="af-l">SORT</span><div class="af-pair"><span class="af-sel">' + ic('sort') + selHTML([def.orden || 'Id'], '', 'disabled') + '</span><span class="af-sel">' + ic('sort') + selHTML(['Descending', 'Ascending'], '', 'disabled') + '</span></div></div>') +
      (def.campos ? '<div class="af-col"><span class="af-l">SEARCH</span><div class="af-pair"><span class="af-sel">' + ic('sort') + selHTML(def.campos, campo, 'data-campo') + '</span><span class="af-q">' + ic('search') + '<input data-q placeholder="Search..." value="' + esc(A.q[key] || '') + '"></span></div></div>' : '') +
      (def.fecha === false ? '' : '<div class="af-col"><span class="af-l">Date Filter</span><div class="af-pair"><input placeholder="Start Date" disabled><span class="af-dash">-</span><input placeholder="End Date" disabled></div></div>') +
      '</div><div class="af-row2">' + (def.paginar === false ? '' : pagHTML(key, todas.length)) + extra + '<button class="ab-apply" data-apply>Apply</button>' + (def.exportar ? '<button class="ab-export" disabled>' + ic('export') + ' Export</button>' : '') + '</div></div>' +
      '<div class="at-w"><table class="at"><thead><tr>' + cols.map(c => '<th>' + c[0] + '</th>').join('') + '</tr></thead><tbody>' +
      vis.map(r => '<tr>' + cols.map(c => '<td>' + c[1](r) + '</td>').join('') + '</tr>').join('') + '</tbody></table>' +
      (!vis.length ? '<div class="at-vacio">' + (ap.ok ? 'No data available' : '') + '</div>' : '') + '</div>' + (def.despues || '');
    const $ = s => cont.querySelector(s);
    const q = $('[data-q]'); if (q) { q.addEventListener('input', e => { A.q[key] = e.target.value; }); q.addEventListener('keydown', e => { if (e.key === 'Enter') aplicar(); }); }
    const cs = $('[data-campo]'); if (cs) cs.addEventListener('change', e => { A.campo[key] = e.target.value; });
    cont.querySelectorAll('[data-sel]').forEach(s => s.addEventListener('change', e => { A.sel[key] = Object.assign({}, A.sel[key], { [s.dataset.sel]: e.target.value }); }));
    $('[data-apply]').addEventListener('click', aplicar);
    cont.querySelectorAll('[data-pg]').forEach(b => b.addEventListener('click', () => { A.page[key] = Number(b.dataset.pg); tabla(cont, key, def); }));
    const gt = $('[data-goto]'); if (gt) gt.addEventListener('keydown', e => { if (e.key === 'Enter') { A.page[key] = Number(e.target.value) || 1; tabla(cont, key, def); } });
    enlazarComunes(cont, () => tabla(cont, key, def));
    if (def.enlazar) def.enlazar(cont, () => tabla(cont, key, def));
    function aplicar() {
      const sel = Object.assign({}, ...(def.extra || []).map(x => ({ [x.k]: (A.sel[key] || {})[x.k] || x.opciones[0] })));
      A.aplicado[key] = { ok: true, campo: A.campo[key] || (def.campos || [''])[0], q: (A.q[key] || '').trim(), sel };
      if (def.valida) { const m = def.valida(A.aplicado[key]); if (m) { A.aplicado[key].ok = false; toast(m, 'bad'); } }
      A.page[key] = 1; A.menu = null; tabla(cont, key, def);
      const res = A.aplicado[key].ok ? def.filas(A.aplicado[key]) : [];
      if (A.aplicado[key].q && res.length && def.reg) C.registrar(res.slice(0, 40).map(def.reg), 'busqueda');
    }
  }
  // Coincidencia: los campos de ID buscan el número exacto; los demás, por texto
  function busca(mapa) {
    return (r, ap) => {
      const q = String(ap.q || '').trim().toLowerCase(); if (!q) return true;
      const f = mapa[ap.campo]; if (!f) return true;
      const val = String(f(r) == null ? '' : f(r)).toLowerCase();
      return /(^|\s)(id|cédula de identidad|plate no)$/i.test(ap.campo) ? val === q || val.replace(/\D/g, '') === q.replace(/\D/g, '') && q.replace(/\D/g, '').length > 3 : val.includes(q);
    };
  }

  /* ---------- Trips ---------- */
  function filtrosTrips(mod) {
    const ap = A.aplicado[mod] || {}, campo = A.campo[mod] || ap.campo || CAMPOS[mod][0];
    const extra = mod === 'all' ? '<div class="af-row2">' + selHTML(['Trip', 'Trip History'], A.tipoAll, 'data-tipoall') + '<button class="ab-apply" data-apply>Apply</button><button class="ab-export" disabled>' + ic('export') + ' Export</button></div>'
      : '<div class="af-row2"><div class="af-pag"><button class="act">1</button><button>2</button><button>Next</button><span>Go to</span><input value="1" aria-label="Página"></div>' +
        selHTML(['Trip Type', 'Moto Baratica', 'Económico', 'Moto', 'Baratica', 'Ridery Premium', 'Carro', 'Moto a mi precio'], A.filtros[mod] || 'Trip Type', 'data-tipo') +
        (mod === 'waiting' ? selHTML(['Driver Status'], 'Driver Status', 'disabled') : selHTML(['Payment Status'], 'Payment Status', 'disabled')) + selHTML(['Payment Type'], 'Payment Type', 'disabled') +
        (mod !== 'waiting' ? selHTML(['Driver Status'], 'Driver Status', 'disabled') : '') + '<button class="ab-apply" data-apply>Apply</button></div>';
    return '<div class="af"><div class="af-row"><div class="af-col"><span class="af-l">SORT</span><div class="af-pair"><span class="af-sel">' + ic('sort') + selHTML([mod === 'waiting' ? 'Created Date' : 'Id', 'Id', 'Created Date'], '', 'disabled') + '</span>' +
      '<span class="af-sel">' + ic('sort') + selHTML([mod === 'all' ? 'Ascending' : 'Descending'], '', 'disabled') + '</span></div></div>' +
      '<div class="af-col"><span class="af-l">SEARCH</span><div class="af-pair"><span class="af-sel">' + ic('sort') + selHTML(CAMPOS[mod], campo, 'data-campo') + '</span><span class="af-q">' + ic('search') + '<input data-q placeholder="Search..." value="' + esc(A.q[mod] || '') + '"></span></div></div>' +
      '<div class="af-col"><span class="af-l">Date Filter</span><div class="af-pair"><input data-desde placeholder="Start Date" value="' + esc(mod === 'all' ? A.desde : '') + '"' + (mod === 'all' ? '' : ' disabled') + ' title="Formato AAAA-MM-DD"><span class="af-dash">-</span><input placeholder="End Date" disabled></div></div></div>' + extra + '</div>';
  }
  function listaTrips(cont) {
    const mod = A.modulo, cols = COLS[mod], todas = filasTrips(mod), porPag = 12, pags = Math.max(1, Math.ceil(todas.length / porPag));
    let p = A.page[mod] || 1; if (p > pags) p = 1;
    const vis = todas.slice((p - 1) * porPag, p * porPag);
    cont.innerHTML = filtrosTrips(mod) + '<div class="at-w"><table class="at"><thead><tr>' + cols.map(c => '<th>' + c[0] + '</th>').join('') + '</tr></thead><tbody>' +
      vis.map(v => '<tr>' + cols.map(c => '<td>' + c[1](v) + '</td>').join('') + '</tr>').join('') + '</tbody></table>' +
      (!vis.length ? '<div class="at-vacio">' + (mod === 'all' && !(A.aplicado.all || {}).ok ? '' : 'No data available') + '</div>' : '') +
      (pags > 1 ? '<div class="at-pags">' + Array.from({ length: pags }, (_, k) => '<button data-pag="' + (k + 1) + '" class="' + (p === k + 1 ? 'act' : '') + '">' + (k + 1) + '</button>').join('') + '</div>' : '') + '</div>';
    const $ = s => cont.querySelector(s);
    $('[data-q]').addEventListener('input', e => { A.q[mod] = e.target.value; });
    $('[data-q]').addEventListener('keydown', e => { if (e.key === 'Enter') aplicar(); });
    $('[data-campo]').addEventListener('change', e => { A.campo[mod] = e.target.value; });
    const ds = $('[data-desde]'); if (ds && mod === 'all') ds.addEventListener('input', e => { A.desde = e.target.value; });
    const ta = $('[data-tipoall]'); if (ta) ta.addEventListener('change', e => { A.tipoAll = e.target.value; });
    const tp = $('[data-tipo]'); if (tp) tp.addEventListener('change', e => { A.filtros[mod] = e.target.value; });
    $('[data-apply]').addEventListener('click', aplicar);
    cont.querySelectorAll('[data-pag]').forEach(b => b.addEventListener('click', () => { A.page[mod] = Number(b.dataset.pag); listaTrips(cont); }));
    enlazarComunes(cont, () => listaTrips(cont));
    function aplicar() {
      A.aplicado[mod] = { ok: true, campo: A.campo[mod] || CAMPOS[mod][0], q: A.q[mod] || '', tipo: mod === 'all' ? A.tipoAll : (A.filtros[mod] && A.filtros[mod] !== 'Trip Type' ? A.filtros[mod] : ''), desde: mod === 'all' ? A.desde : '' };
      A.page[mod] = 1; A.menu = null; listaTrips(cont);
      const res = filasTrips(mod);
      if (A.aplicado[mod].q && res.length) C.registrar(res.slice(0, 40).map(v => v.id), 'busqueda');
    }
  }
  function dashboard(cont) {
    const min = minAhora(), vs = C.ses.viajes.filter(v => !v.fecha && existe(v, min)), cuenta = mod => vs.filter(v => enModulo(v, estado(v, min), mod)).length;
    const online = conductores().filter(p => p.online && estadoConductor(p) === 'Approved').length;
    cont.innerHTML = '<div class="adm-dash">' + [['Waiting Requests', cuenta('waiting'), 'cel', 'waiting'], ['Running Requests', cuenta('running'), 'nav', 'running'], ['Completed Requests', cuenta('completed'), 'ver', 'completed'], ['Cancelled Trips', cuenta('cancelled'), 'roj', 'cancelled'],
      ['Online Providers', online, 'nar', 'prov-online'], ['Bad Reviews', AD().reviews.filter(r => !contactada(r)).length, 'gra', 'rev-users']]
      .map(x => '<button class="adm-card ' + x[2] + '" data-ir="' + x[3] + '"><b>' + x[1] + '</b><span>' + x[0] + '</span></button>').join('') + '</div>';
    cont.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => { A.modulo = b.dataset.ir; A.grupo = grupoDe(A.modulo); C.repintar(); }));
  }
  // Cancel Trip: igual al real, pide «Cancelation Reason» y una descripción
  function cancelarViaje(v) {
    modal('Cancel Description', '<label class="amod-l">Cancelation Reason</label><select data-m="motivo"><option value="">Select reason</option>' + (AD().cancelaciones || []).map(m => '<option>' + esc(m) + '</option>').join('') + '</select>' +
      '<label class="amod-l">Description</label><textarea data-m="descripcion" rows="3" placeholder="Please enter the cancel description"></textarea><p class="amod-n">Viaje #' + esc(v.id) + ' · ' + esc(v.user) + '</p>',
    [['Go Back', null], ['Cancel Trip', async (val) => {
      if (!val.motivo) { toast('Elige el Cancelation Reason.', 'bad'); return false; }
      try { const r = await C.call('simAccionViaje', { sesion: C.ses.id, viaje: v.id, que: 'cancelar-viaje', motivo: val.motivo, descripcion: val.descripcion }); C.ses.hechas.push(r.hecha); toast('Trip Cancelled Successfully'); } catch (e) { C.manejar(e); }
      C.registrar([v.id], 'cancelar');
    }, 'peligro']]);
  }
  function verCancelacion(v) {
    const h = C.ses.hechas.find(a => a.orden === v.id && a.st === 'Cancelled'), d = h && h.dato ? { motivo: h.dato.motivo, nota: h.dato.descripcion, admin: 'Tú', ticket: '' } : (v.cancelDesc || { motivo: 'Cancelled by user' });
    C.registrar([v.id], 'cancelacion');
    modal('Cancel Description', '<table class="ad-t amod-t"><tr><th>REASON</th><td>' + esc(d.motivo || '—') + '</td></tr><tr><th>DESCRIPTION</th><td>' + esc(d.nota || '—') + '</td></tr><tr><th>TICKET</th><td>' + esc(d.ticket ? '#' + d.ticket : '—') + '</td></tr>' +
      '<tr><th>ADMIN</th><td>' + esc(d.admin || '—') + '</td></tr><tr><th>LIGHTSHOT</th><td>' + (d.captura ? '<a class="al">' + esc(d.captura) + '</a>' : '—') + '</td></tr></table>', [['Close', null]]);
  }

  /* ---------- Modal ---------- */
  function modal(titulo, cuerpo, botones) {
    const root = document.querySelector('.adm'); if (!root) return;
    const w = document.createElement('div'); w.className = 'adm-modal';
    w.innerHTML = '<div class="amod" role="dialog" aria-modal="true" aria-label="' + esc(titulo) + '"><div class="amod-h"><span>' + esc(titulo) + '</span><button data-cx aria-label="Cerrar">×</button></div><div class="amod-b">' + cuerpo + '</div>' +
      '<div class="amod-f">' + botones.map((b, i) => '<button data-bt="' + i + '" class="' + (b[1] ? (b[2] === 'peligro' ? 'ab-export' : 'ab-apply') : 'amod-sec') + '">' + esc(b[0]) + '</button>').join('') + '</div></div>';
    root.appendChild(w);
    const cerrar = () => { w.remove(); C.repintar(); };
    w.querySelector('[data-cx]').addEventListener('click', cerrar);
    w.querySelectorAll('[data-bt]').forEach(b => b.addEventListener('click', async () => {
      const f = botones[Number(b.dataset.bt)][1];
      if (!f) return cerrar();
      const val = {}; w.querySelectorAll('[data-m]').forEach(x => { val[x.dataset.m] = x.value.trim(); });
      b.disabled = true; const r = await f(val); b.disabled = false;
      if (r !== false) cerrar();
    }));
    const f = w.querySelector('select, input, textarea'); if (f) f.focus();
  }
  async function accion(que, objetivo, extra) {
    try { const r = await C.call('simAccionAdmin', Object.assign({ sesion: C.ses.id, que, objetivo }, extra || {})); C.ses.hechas.push(r.hecha); toast(r.hecha.texto); return true; } catch (e) { C.manejar(e); return false; }
  }

  /* ---------- Service Providers ---------- */
  const CAMPOS_P = ['Id', 'Name', 'Email', 'City', 'Service Type', 'Phone', 'Plate No', 'Cédula de identidad', 'Category'];
  const buscaP = busca({ 'Id': p => p.id, 'Name': p => p.nombre, 'Email': p => p.email, 'City': p => p.ciudad, 'Service Type': p => p.servicios, 'Phone': p => p.tel, 'Plate No': p => (p.vehiculos || []).map(v => v.placa).join(' '),
    'Cédula de identidad': p => (p.cuentas || [])[0] ? p.cuentas[0].cedula : '', 'Category': p => p.categoria });
  function menuConductor(p) {
    return [["Edit Detail", () => abrir('p-edit', p.id)], ['Vehicle', () => abrir('p-vehicle', p.id)], ['Banking Detail', () => abrir('p-bank', p.id)], ['History', () => abrir('p-history', p.id)],
      ["Driver's Records", () => abrir('p-records', p.id)], ["Driver's cash blocked history", () => abrir('p-cash', p.id)], ['Referral history', () => abrir('p-referral', p.id)], ['View Document', () => abrir('p-docs', p.id)],
      ['Delete Provider', async () => { if (await confirmar({ titulo: '¿Eliminar al conductor ' + p.id + '?', texto: 'Se borra la cuenta del conductor. No se puede deshacer.', ok: 'Eliminar', cancelar: 'Volver', peligro: true })) await accion('eliminar-conductor', 'p:' + p.id); C.repintar(); }, 'peligro']];
  }
  const servCell = s => esc(String(s || '').split(',').join(', '));
  const perfilCell = p => '<span class="ap-perfil ' + (estadoConductor(p) === 'Approved' ? 'on' : 'off') + '">' + ic('user') + '</span>';
  const COLS_P = [['ID', p => pLink(p.id)], ['NAME', p => esc(p.nombre)], ['EMAIL', p => esc(p.email)], ['PHONE', p => esc(p.tel)], ['REQUEST', p => p.req], ['COMPLETED', p => p.comp], ['CANCELLED', p => p.canc], ['ACCEPTED', p => p.acc],
    ['RATING', p => Number(p.rating).toFixed(2)], ['DISPUTES', p => p.disputas], ['SOS', p => p.sos], ['CITY', p => esc(p.ciudad)], ['PROFILE', perfilCell], ['SERVICE TYPE', p => servCell(p.servicios)], ['WALLET', p => money(p.wallet)],
    ['APP VERSION', p => esc(p.app)], ['REGISTERED DATE', p => fmt(p.registro)], ['CATEGORY', p => esc(p.categoria)]];
  function provLista(filtro, extraCols) {
    return cont => tabla(cont, A.modulo, { campos: CAMPOS_P, exportar: false, cols: COLS_P.concat(extraCols || []), clave: p => p.id, menu: menuConductor, reg: p => 'p:' + p.id,
      filas: ap => conductores().filter(p => filtro(p)).filter(p => buscaP(p, ap)).sort((a, b) => Number(b.id) - Number(a.id)) });
  }
  const MODULOS = {
    'prov-all': cont => tabla(cont, 'prov-all', { campos: CAMPOS_P, cols: [['ID', p => pLink(p.id)], ['NAME', p => esc(p.nombre)], ['PHONE', p => esc(p.tel)], ['EMAIL', p => esc(p.email)], ['REGISTRATION CITY', p => esc(p.ciudadReg)],
      ['CURRENT CITY', p => esc(p.ciudad)], ['STATUS', p => { const s = estadoConductor(p); return pill(s, PROV_PILL[s]); }], ['STATUS REASON', p => esc(p.motivoEstado || 'N/A')]], clave: p => p.id, menu: menuConductor, reg: p => 'p:' + p.id,
      filas: ap => conductores().filter(p => buscaP(p, ap)).sort((a, b) => Number(b.id) - Number(a.id)) }),
    'prov-online': provLista(p => p.online && estadoConductor(p) === 'Approved'),
    'prov-approved': provLista(p => estadoConductor(p) === 'Approved', [['APPROVAL DATE', p => fmt(p.aprobado)]]),
    'prov-unapproved': provLista(p => estadoConductor(p) === 'Unapproved'),
    'prov-blocked': provLista(p => estadoConductor(p) === 'Blocked', [['REASON', p => esc(p.motivoEstado)]]),
    'prov-cashblocked': provLista(p => estadoConductor(p) === 'Cash Blocked', [['REASON', p => esc(p.motivoEstado)]]),
    'prov-suspended': provLista(p => estadoConductor(p) === 'Suspended', [['REASON', p => esc(p.motivoEstado)]]),
    'prov-deleted': provLista(p => estadoConductor(p) === 'Deleted'),
    'prov-incidents': cont => tabla(cont, 'prov-incidents', { campos: ['Provider Id'], cols: [['ID', () => ''], ['PROVIDER ID', () => ''], ['PROVIDER NAME', () => ''], ['INCIDENT', () => ''], ['AMOUNT', () => ''], ['DATE', () => ''], ['CREATED BY', () => '']], filas: () => [] }),
    'prov-bank': cont => tabla(cont, 'prov-bank', { campos: ['Provider ID', 'Provider Name', 'Account ID'], exportar: true, orden: 'Provider ID',
      cols: [['PROVIDER ID', r => pLink(r.p.id)], ['PROVIDER NAME', r => esc(r.p.nombre)], ['PROVIDER EMAIL', r => esc(r.p.email)], ['ACCOUNT ID', r => esc(r.c.id)], ['ACCOUNT NAME', r => esc(r.c.nombre)],
        ['STATUS', r => { const s = cuentaEstado(r.p, r.c); return pill(s, s === 'Approved' ? 'ver' : 'roj'); }]],
      clave: r => r.p.id + '-' + r.c.id, reg: r => 'p:' + r.p.id,
      menu: r => [['Reject', () => rechazarCuenta(r.p, r.c)], ['View details', () => verCuenta(r.p, r.c)], ['View account history', () => abrir('p-acchist', r.p.id)]],
      filas: ap => [].concat(...conductores().map(p => (p.cuentas || []).map(c => ({ p, c })))).filter(r => busca({ 'Provider ID': x => x.p.id, 'Provider Name': x => x.p.nombre, 'Account ID': x => x.c.id })(r, ap)) }),
    'prov-agreement': cont => tabla(cont, 'prov-agreement', { campos: ['Provider Id'], cols: [['ID', () => ''], ['PROVIDER ID', () => ''], ['NAME', () => ''], ['TOTAL DEBT', () => ''], ['FEES', () => ''], ['STATUS', () => '']], filas: () => [] }),
    'prov-autosusp': cont => tabla(cont, 'prov-autosusp', { campos: ['Provider Id'], cols: [['ID', r => esc(r.r.id)], ['PROVIDER ID', r => pLink(r.p.id)], ['PROVIDER NAME', r => esc(r.p.nombre)], ['DATE TIME', r => fmt(r.r.fecha)], ['REASON', r => esc(r.r.motivo)], ['TYPE', r => pill(r.r.tipo, 'nar')]],
      reg: r => 'p:' + r.p.id, filas: ap => [].concat(...conductores().map(p => (p.records || []).filter(x => x.tipo === 'Suspended').map(r => ({ p, r })))).filter(x => busca({ 'Provider Id': y => y.p.id })(x, ap)) }),

    /* ---------- Users ---------- */
    'users': usersLista(u => estadoUsuario(u) === 'Active'),
    'users-blocked': usersLista(u => estadoUsuario(u) === 'Blocked'),
    'users-deleted': usersLista(u => estadoUsuario(u) === 'Deleted'),
    'users-incidents': cont => tabla(cont, 'users-incidents', { campos: ['User Id'], cols: [['ID', () => ''], ['USER ID', () => ''], ['USER NAME', () => ''], ['INCIDENT', () => ''], ['AMOUNT', () => ''], ['DATE', () => '']], filas: () => [] }),

    /* ---------- Reviews ---------- */
    'rev-all': revLista(() => true), 'rev-users': revLista(r => r.userRate > 0 && r.userRate <= 2 && !contactada(r)), 'rev-drivers': revLista(r => r.providerRate > 0 && r.providerRate <= 2 && !contactada(r)), 'rev-contacted': revLista(r => contactada(r)),

    /* ---------- Map View ---------- */
    'map-providers': mapaConductores,

    /* ---------- Shipments (mismas columnas que Trips; hoy no hay envíos en la práctica) ---------- */
    'ship-waiting': envios, 'ship-running': envios, 'ship-completed': envios, 'ship-cancelled': envios,

    /* ---------- Emprende con Ridery ---------- */
    'emp-aspirantes': cont => tabla(cont, 'emp-aspirantes', { campos: ['Id', 'Name', 'Phone'], cols: [['ID', r => r[0]], ['NAME', r => esc(r[1])], ['PHONE', r => esc(r[2])], ['CITY', r => esc(r[3])], ['SERVICE TYPE', r => esc(r[4])], ['STEP', r => pill(r[5], r[5] === 'Aprobado' ? 'ver' : 'nar')], ['REGISTERED DATE', () => fmt('HOY')]],
      filas: ap => ASPIRANTES.filter(r => busca({ 'Id': x => x[0], 'Name': x => x[1], 'Phone': x => x[2] })(r, ap)) }),
    'emp-flotas': cont => tabla(cont, 'emp-flotas', { campos: ['Name'], cols: [['ID', (r, i) => r[0]], ['FLOTA', r => esc(r[1])], ['CITY', r => esc(r[2])], ['DRIVERS', r => r[3]], ['STATUS', () => pill('Active', 'ver')]], filas: () => FLOTAS }),

    /* ---------- Service Types ---------- */
    'stype-list': cont => tabla(cont, 'stype-list', { campos: ['Name'], fecha: false, cols: [['SERVICE TYPE', r => esc(r[0])], ['PRICE PER KM', r => money(r[1])], ['PRICE PER MINUTE', r => money(r[2])], ['BASE PRICE', r => money(r[3])], ['CITY', () => 'Todas'], ['STATUS', () => pill('Active', 'ver')]],
      filas: ap => (AD().servicios || []).filter(r => busca({ 'Name': x => x[0] })(r, ap)) }),

    /* ---------- Store ---------- */
    'store-warehouse': almacen,
    'store-inventory': cont => tabla(cont, 'store-inventory', { campos: ['Accessory'], exportar: true, cols: [['INTERNAL REFERENCE', r => esc(r.ref)], ['ACCESSORY', r => esc(r.nombre)], ['TOTAL', r => r.total], ['TYPE', () => 'Accessory']], filas: ap => inventario().filter(r => busca({ 'Accessory': x => x.nombre })(r, ap)) }),
    'store-accessories': cont => tabla(cont, 'store-accessories', { campos: ['Accessory'], cols: [['ID', r => esc(r.ref)], ['ACCESSORY', r => esc(r.nombre)], ['PRICE', r => money(r.precio)], ['STATUS', () => pill('Active', 'ver')]], filas: ap => inventario().filter(r => busca({ 'Accessory': x => x.nombre })(r, ap)) }),
    'store-funders': reporte(['ID', 'FUNDER', 'AMOUNT', 'DATE']), 'store-sales': reporte(['ID', 'PROVIDER ID', 'ACCESSORY', 'AMOUNT', 'DATE']), 'store-gift': reporte(['ID', 'PROVIDER ID', 'ACCESSORY', 'DATE']),
    'store-charge': reporte(['ID', 'PROVIDER ID', 'FEE', 'AMOUNT', 'STATUS']), 'store-payment': reporte(['ID', 'PROVIDER ID', 'AMOUNT', 'DATE']), 'store-initial': reporte(['ID', 'PROVIDER ID', 'INITIAL', 'DATE']),
    'store-financing': reporte(['ID', 'PROVIDER ID', 'TOTAL', 'FEES', 'PENDING']), 'store-download': reporte(['ID', 'REPORT', 'DATE']), 'store-advance': reporte(['ID', 'PROVIDER ID', 'AMOUNT', 'DATE', 'STATUS']), 'store-advcharge': reporte(['ID', 'PROVIDER ID', 'FEE', 'AMOUNT']),

    /* ---------- Fraud ---------- */
    'fraud-trips': cont => tabla(cont, 'fraud-trips', { campos: ['Id', 'Provider Id', 'User Id'], cols: [['ID', () => ''], ['USER ID', () => ''], ['PROVIDER ID', () => ''], ['AMOUNT', () => ''], ['STATUS', () => ''], ['DATE', () => '']], filas: () => [] }),
    'fraud-pur': cont => tabla(cont, 'fraud-pur', { campos: ['Id', 'Provider Id', 'User Id'], cols: [['ID', () => ''], ['USER ID', () => ''], ['PROVIDER ID', () => ''], ['AMOUNT', () => ''], ['STATUS', () => ''], ['DATE', () => '']], filas: () => [] }),

    /* ---------- Trip Payment / Administrative ---------- */
    'tpay-inquiries': liquidacion, 'adm-liq': liquidacion,
    'tpay-disputes': cont => tabla(cont, 'tpay-disputes', { campos: ['Id', 'Provider Id', 'User Id'], cols: [['TRIP ID', () => ''], ['USER', () => ''], ['PROVIDER', () => ''], ['USER AMOUNT', () => ''], ['PROVIDER AMOUNT', () => ''], ['CURRENCY', () => ''], ['EXCHANGE RATE', () => '']], filas: () => [] }),

    /* ---------- Report ---------- */
    'rep-trips': reporte(['REPORT', 'FROM', 'TO', 'STATUS']), 'rep-providers': reporte(['REPORT', 'FROM', 'TO', 'STATUS']), 'rep-users': reporte(['REPORT', 'FROM', 'TO', 'STATUS']),

    /* ---------- Settings ---------- */
    'set-promo': cont => tabla(cont, 'set-promo', { campos: ['Promo Code'], cols: [['PROMO CODE', r => esc(r[0])], ['DISCOUNT', r => esc(r[1])], ['CONDITIONS', r => esc(r[2])], ['STATUS', r => pill(r[3], r[3] === 'Active' ? 'ver' : 'gri')], ['EXPIRY DATE', r => esc(r[4])]],
      filas: ap => (AD().promos || []).filter(r => busca({ 'Promo Code': x => x[0] })(r, ap)) })
  };
  const vacio = cont => { cont.innerHTML = '<div class="at-vacio">No data available</div>'; };
  function reporte(cols) { return cont => tabla(cont, A.modulo, { campos: ['Provider Id'], exportar: true, cols: cols.map(c => [c, () => '']), filas: () => [] }); }
  function envios(cont) { tabla(cont, A.modulo, { campos: ['Id', 'User Id', 'Provider Id'], cols: COLS.running.filter(c => c[0] !== 'ACTION').map(c => [c[0], () => '']), filas: () => [] }); }
  const ASPIRANTES = [['80211', 'Yeferson Medina', '+58 4141102233', 'Valencia', 'Moto', 'Documentos'], ['80214', 'Karla Sánchez', '+58 4127783310', 'Caracas', 'Económico', 'Inspección'], ['80220', 'Luis Pérez', '+58 4245500918', 'Maracay', 'Moto', 'Aprobado'],
    ['80226', 'Génesis Ortiz', '+58 4163321009', 'Barquisimeto', 'Carro', 'Documentos'], ['80231', 'Antonio Rangel', '+58 4249907711', 'Maracaibo', 'Moto Baratica', 'Póliza']];
  const FLOTAS = [['12', 'Flota Centro Valencia', 'Valencia', 48], ['15', 'Moto Express Lara', 'Barquisimeto', 31], ['21', 'Ruedas del Zulia', 'Maracaibo', 27]];
  const inventario = () => (AD().stock || []).flatMap((n, k) => ['S', 'M', 'L', 'XL'].map((t, j) => ({ ref: 'R-' + (8020 + k * 4 + j) + '-' + t, nombre: n + ' ( ' + t + ' )', total: (k * 13 + j * 7) % 40, precio: 12 + k * 4 })));

  /* ---------- Users ---------- */
  const CAMPOS_U = ['Id', 'Name', 'Email', 'Phone', 'Cédula', 'City'];
  const buscaU = busca({ 'Id': u => u.id, 'Name': u => u.nombre, 'Email': u => u.email, 'Phone': u => u.tel, 'Cédula': u => u.cedula, 'City': u => u.ciudad });
  function menuUsuario(u) {
    return [['Edit Detail', () => abrir('u-edit', u.id)], ['History', () => abrir('u-history', u.id)], ["User's Records", () => abrir('u-records', u.id)], ['Referral history', () => abrir('u-referral', u.id)],
      ['Wallet History', () => abrir('u-wallet', u.id)], ['Delete User', async () => { if (await confirmar({ titulo: '¿Eliminar al usuario ' + u.id + '?', texto: 'Se borra la cuenta del usuario. No se puede deshacer.', ok: 'Eliminar', cancelar: 'Volver', peligro: true })) await accion('eliminar-usuario', 'u:' + u.id); C.repintar(); }, 'peligro'],
      ['View Document', () => abrir('u-doc', u.id)], ['Decline', () => declinar(u), 'peligro'], ['Add Wallet', () => agregarWallet(u)], ["Incident's History", () => abrir('u-incidents', u.id)],
      ['Change Password', async () => { if (await confirmar({ titulo: '¿Cambiar la clave del usuario ' + u.id + '?', texto: 'El usuario tendrá que entrar con una clave nueva.', ok: 'Cambiar', cancelar: 'Volver' })) await accion('cambiar-clave', 'u:' + u.id); C.repintar(); }]];
  }
  function usersLista(filtro) {
    return cont => tabla(cont, A.modulo, { campos: CAMPOS_U, cols: [['ID', u => uLink(u.id)], ['NAME', u => esc(u.nombre)], ['PHONE', u => esc(u.tel)], ['EMAIL', u => esc(u.email)], ['CÉDULA', u => esc(u.cedula)], ['REQUEST', u => u.req], ['COMPLETED', u => u.comp],
      ['CANCELLED', u => u.canc], ['DISPUTES', u => u.disputas], ['SOS', u => u.sos], ['CITY', u => esc(u.ciudad)], ['WALLET', u => money(walletUsuario(u))], ['CORPORATE', u => esc(u.corporate)], ['APP VERSION', u => esc(u.app)], ['OTA VERSION', u => esc(u.ota)],
      ['REGISTERED DATE', u => fmt(u.registro)], ['CREATED BY', u => esc(u.creadoPor)]], clave: u => u.id, menu: menuUsuario, reg: u => 'u:' + u.id,
      filas: ap => usuarios().filter(filtro).filter(u => buscaU(u, ap)).sort((a, b) => Number(b.id) - Number(a.id)) });
  }
  function agregarWallet(u) {
    C.registrar(['u:' + u.id], 'add-wallet');
    modal('Add Wallet', '<p class="amod-n">Usuario <b>' + esc(u.id) + '</b> · ' + esc(u.nombre) + ' · Wallet actual: ' + money(walletUsuario(u)) + '</p>' +
      '<label class="amod-l">Amount</label><input data-m="monto" type="number" min="0" step="0.01" placeholder="0.00">' +
      '<label class="amod-l">Currency</label><select data-m="moneda"><option value="KM">KM</option><option value="USD">USD</option></select>' +
      '<label class="amod-l">Add / Cut</label><select data-m="addcut"><option>Add</option><option>Cut</option></select>' +
      '<label class="amod-l">Type</label><select data-m="tipo"><option value="">Select type</option>' + (AD().tiposWallet || []).map(t => '<option>' + esc(t) + '</option>').join('') + '</select>' +
      '<label class="amod-l">Comment</label><textarea data-m="comentario" rows="2"></textarea>',
    [['Cancel', null], ['Submit', async val => {
      if (!(Number(val.monto) > 0)) { toast('Escribe el monto.', 'bad'); return false; }
      if (!val.tipo) { toast('Elige el tipo.', 'bad'); return false; }
      await accion('agregar-wallet', 'u:' + u.id, { monto: Number(val.monto), moneda: val.moneda, addcut: val.addcut, tipo: val.tipo });
    }]]);
  }
  function declinar(u) {
    modal('Decline User', '<p class="amod-n">Usuario <b>' + esc(u.id) + '</b> · ' + esc(u.nombre) + '</p><label class="amod-l">Reason</label><textarea data-m="motivo" rows="3" placeholder="Please enter the reason"></textarea>',
      [['Cancel', null], ['Decline', async val => { if (!val.motivo) { toast('Escribe el motivo.', 'bad'); return false; } await accion('declinar-usuario', 'u:' + u.id, { motivo: val.motivo }); }, 'peligro']]);
  }
  function rechazarCuenta(p, c) {
    C.registrar(['p:' + p.id], 'cuenta');
    if (cuentaEstado(p, c) === 'Rejected') return toast('Esta cuenta ya está rechazada.', 'bad');
    modal('Reject Account', '<p class="amod-n">' + esc(p.nombre) + ' · ' + esc(c.nombre) + ' (Account ID ' + esc(c.id) + ')</p><label class="amod-l">Reason</label><textarea data-m="motivo" rows="3" placeholder="Please enter the reject reason"></textarea>',
      [['Cancel', null], ['Reject', async val => { if (!val.motivo) { toast('Escribe el motivo del rechazo.', 'bad'); return false; } await accion('rechazar-cuenta', 'p:' + p.id, { motivo: val.motivo, cuenta: c.id }); }, 'peligro']]);
  }
  function verCuenta(p, c) {
    C.registrar(['p:' + p.id], 'cuenta');
    modal('Payment account details', '<div class="amod-g"><label class="amod-l">Name (Nombre)<input value="' + esc(c.titular) + '" readonly></label><label class="amod-l">Account number (Número de cuenta)<input value="' + esc(c.numero) + '" readonly></label>' +
      '<label class="amod-l">Identification number (Cédula)<input value="' + esc(c.cedula) + '" readonly></label><label class="amod-l">Bank<input value="' + esc(c.banco || '') + '" readonly></label></div>', [['Close', null]]);
  }

  /* ---------- Reviews ---------- */
  function filler() {
    const min = minAhora();
    return C.ses.viajes.filter(v => !v.fecha && estado(v, min) === 'Completed' && !AD().reviews.some(r => r.viaje === v.id)).map((v, k) => ({ viaje: v.id, fecha: fechaDe(v), userId: v.userId, user: v.user, tercero: '-', userTel: v.tel, userRate: 5 - (k % 5 === 3 ? 1 : 0),
      userComment: k % 3 ? '' : 'Rated by the system', providerId: v.providerId, provider: v.provider, providerTel: '+58 4140000' + String(v.providerId).slice(-3), providerRate: 5, providerComment: '', contactado: false, estado: 'Good Review' }));
  }
  function revLista(filtro) {
    return cont => tabla(cont, A.modulo, { campos: ['Provider ID', 'Trip Id', 'User Id'], orden: 'Id', exportar: true, extra: [{ k: 'tipo', opciones: ['All', 'Good Review', 'Bad Review'] }],
      cols: [['TRIP ID', r => esc(r.viaje)], ['DATE', r => fmt(r.fecha)], ['USER NAME', r => esc(r.user)], ['THIRD PARTY', r => esc(r.tercero)], ['USER ID', r => uLink(r.userId)], ['USER PHONE', r => esc(r.userTel)], ['USER RATE', r => r.userRate],
        ['USER COMMENT', r => esc(r.userComment)], ['PROVIDER NAME', r => esc(r.provider)], ['PROVIDER ID', r => pLink(r.providerId)], ['PROVIDER PHONE', r => esc(r.providerTel)], ['PROVIDER RATE', r => r.providerRate || ''],
        ['PROVIDER COMMENT', r => esc(r.providerComment)], ['CONTACTED', r => contactada(r) ? pill('Yes', 'ver') : ''], ['STATUS', r => pill(r.estado, r.estado === 'Bad Review' ? 'nar' : 'ver')]],
      clave: r => r.viaje, reg: r => r.viaje,
      menu: r => [['View Trip', () => abrir('detalle', r.viaje)], ['Contacted', async () => { if (contactada(r)) toast('Esta reseña ya está contactada.'); else await accion('contactado', r.viaje); C.registrar([r.viaje], 'review'); C.repintar(); }]],
      filas: ap => AD().reviews.concat(filler()).filter(filtro).filter(r => !ap.sel || !ap.sel.tipo || ap.sel.tipo === 'All' || r.estado === ap.sel.tipo)
        .filter(r => busca({ 'Provider ID': x => x.providerId, 'Trip Id': x => x.viaje, 'User Id': x => x.userId })(r, ap)).sort((a, b) => Number(b.viaje) - Number(a.viaje)) });
  }

  /* ---------- Map View ---------- */
  function mapaConductores(cont) {
    const key = 'map-providers', ap = A.aplicado[key] || {};
    const todos = conductores().filter(p => p.online || p.id === ap.q);
    const buscado = ap.q ? conductores().find(p => p.id === ap.q) : null;
    const W = 700, H = 360, pos = p => { const n = Number(p.id) || 1; return { x: 30 + (n * 7919) % (W - 60), y: 30 + (n * 104729) % (H - 60) }; };
    let calles = ''; for (let k = 0; k < 9; k++) calles += '<line x1="' + (k * 90 - 30) + '" y1="0" x2="' + (k * 90 + 50) + '" y2="' + H + '" stroke="#fff" stroke-width="' + (k % 3 ? 6 : 11) + '"/>';
    for (let k = 0; k < 6; k++) calles += '<line x1="0" y1="' + (k * 70 + 15) + '" x2="' + W + '" y2="' + (k * 70 - 15) + '" stroke="#fff" stroke-width="' + (k % 2 ? 5 : 9) + '"/>';
    const pins = todos.map(p => { const q = pos(p), sel = buscado && p.id === buscado.id; return '<g transform="translate(' + q.x + ',' + q.y + ')"><circle r="' + (sel ? 9 : 5) + '" fill="' + (sel ? '#c62828' : p.servicios.includes('Moto') ? '#F5A623' : '#2e7d32') + '" stroke="#fff" stroke-width="2"/></g>'; }).join('');
    cont.innerHTML = '<div class="af"><div class="af-row"><div class="af-col"><span class="af-l">SEARCH</span><div class="af-pair"><span class="af-sel">' + ic('sort') + selHTML(['Provider Id'], '', 'disabled') + '</span><span class="af-q">' + ic('search') + '<input data-q placeholder="Provider Id" value="' + esc(A.q[key] || '') + '"></span></div></div>' +
      '<div class="af-col"><span class="af-l">Service Type</span><div class="af-pair"><span class="af-sel">' + selHTML(['All'], '', 'disabled') + '</span></div></div></div><div class="af-row2"><button class="ab-apply" data-apply>Apply</button></div></div>' +
      '<div class="ad-card"><svg class="adm-map" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Mapa de conductores"><rect width="' + W + '" height="' + H + '" fill="#e9ecef"/>' + calles + pins + '<text x="8" y="' + (H - 8) + '" font-size="10" fill="#777">Mapa de práctica · Ridery Academy</text></svg>' +
      '<div class="ad-ley"><span><i style="background:#F5A623"></i>Moto</span><span><i style="background:#2e7d32"></i>Carro</span><span><i style="background:#c62828"></i>Conductor buscado</span></div>' +
      (ap.q ? (buscado ? '<table class="ad-t"><tr><th>PROVIDER ID</th><th>NAME</th><th>STATUS</th><th>LAST LOCATION</th><th>LAST UPDATE</th><th>SERVICE TYPE</th></tr><tr><td>' + esc(buscado.id) + '</td><td>' + esc(buscado.nombre) + '</td><td>' +
        (buscado.online ? pill('Online', 'ver') : pill('Offline', 'gri')) + '</td><td>' + esc(buscado.ubic || '—') + '</td><td>' + (buscado.online ? 'Hace 1 min' : 'Hace 3 h') + '</td><td>' + servCell(buscado.servicios) + '</td></tr></table>' : '<div class="at-vacio">No data available</div>') : '') + '</div>';
    cont.querySelector('[data-q]').addEventListener('input', e => { A.q[key] = e.target.value; });
    const ir = () => { A.aplicado[key] = { ok: true, q: (A.q[key] || '').trim() }; if (conductores().some(p => p.id === A.aplicado[key].q)) C.registrar(['p:' + A.aplicado[key].q], 'mapa'); mapaConductores(cont); };
    cont.querySelector('[data-q]').addEventListener('keydown', e => { if (e.key === 'Enter') ir(); });
    cont.querySelector('[data-apply]').addEventListener('click', ir);
  }

  /* ---------- Store: Warehouse ---------- */
  function almacen(cont) {
    if (A.almacen) {
      return tabla(cont, 'store-stock', { antes: '<h2 class="adm-h2"><button class="adm-link" data-back>' + ic('left') + '</button> Available Stock: ' + esc(A.almacen) + '</h2>', campos: ['Accessory'], orden: 'Accessory', exportar: true,
        cols: [['INTERNAL REFERENCE', r => '<a class="al">' + esc(r.ref) + '</a>'], ['ACCESSORY', r => '<a class="al">' + esc(r.nombre) + '</a>'], ['VARIANT', () => pill('Talla', 'ver')], ['QUANTITY', r => '<a class="al">' + r.total + ' Units</a>'], ['TYPE', () => 'Accessory']],
        filas: ap => inventario().filter(r => busca({ 'Accessory': x => x.nombre })(r, ap)), enlazar: c => c.querySelector('[data-back]').addEventListener('click', () => { A.almacen = null; C.repintar(); }) });
    }
    cont.innerHTML = '<div class="adm-alm">' + (AD().almacenes || []).map(a => '<div class="adm-almc"><b>' + esc(a[0]) + '</b><span>' + a[1] + ' Available</span><button class="ab-apply" data-alm="' + esc(a[0]) + '">Stock</button></div>').join('') + '</div>';
    cont.querySelectorAll('[data-alm]').forEach(b => b.addEventListener('click', () => { A.almacen = b.dataset.alm; C.repintar(); }));
  }

  /* ---------- Liquidaciones (Payment Inquiries) ---------- */
  function liquidacion(cont) {
    const ad = AD(), key = A.modulo;
    const COL = ['COMPLETED TRIPS', 'PROFIT OF THE TRIPS', 'CASH RECEIVED', 'PAGO A CONDUCTOR RECIBIDO', 'PROMO PAYMENT', 'ADDITIONS ADMIN (+)', 'DEBT PAYMENT - PAGO MOVIL (+)', 'STORE ADDITIONS (+)', 'LABELED PAYMENT (+)', 'PAYMENTS INCIDENTS (+)',
      'TIPS (+)', 'BONO DE CATEGORÍA (+)', 'BONO POR PICKUP (+)', 'RECOMPENSA POR DESAFÍO (+)', 'DEDUCTIONS ADMIN (-)', 'CHARGEBACKS (-)', 'STORE DEDUCTIONS (-)', 'PAYMENT AGREEMENTS (-)', 'FRAUDS TRIPS (-)', 'TOTAL ADDITIONS', 'TOTAL DEDUCTIONS', 'BALANCE'];
    const fila = (p, liq) => {
      const n = Number(p.id) + liq.length * 13, r = k => Math.round(((n * (k + 3) * 9301 + 49297) % 233280) / 233280 * 100) / 100;
      const viajes = Math.round(20 + r(1) * 80), profit = Math.round(viajes * (1.1 + r(2)) * 100) / 100, cash = Math.round(profit * r(3) * 0.5 * 100) / 100, tips = Math.round(r(4) * 6 * 100) / 100, bono = viajes > 70 ? 10 : 0;
      const store = p.servicios && p.servicios.includes('Moto') ? 4 : 0, add = Math.round((profit + tips + bono) * 100) / 100, ded = Math.round((cash + store) * 100) / 100;
      return { p, liq, vals: [viajes, profit, cash, 0, 0, 0, 0, 0, 0, 0, tips, bono, 0, 0, 0, 0, store, 0, 0, add, ded, Math.round((add - ded) * 100) / 100] };
    };
    tabla(cont, key, { campos: ['Provider ID'], orden: 'Provider ID', vacio: true, sinOrden: true, fecha: false, paginar: false, extra: [{ k: 'liq', opciones: [['', 'Select Liquidation']].concat((ad.liquidaciones || []).map(l => [l, l])) }],
      valida: ap => !ap.sel.liq ? 'Elige la liquidación (Select Liquidation).' : !ap.q ? 'Escribe el ID del conductor.' : '',
      cols: [['PROVIDER ID', r => pLink(r.p.id)], ['NAME', r => esc(r.p.nombre)], ['PHONE', r => esc(r.p.tel)], ['EMAIL', r => esc(r.p.email)]].concat(COL.map((h, i) => [h, r => money(r.vals[i]).replace(/\.00$/, i === 0 ? '' : '.00')]))
        .concat([['PAYMENT STATUS', r => { const b = r.p.liq && r.liq === ad.liquidaciones[0] && r.p.liq.estadoBanco; return b ? pill(b, 'roj') : pill('Pagado', 'ver'); }],
          ['REMOVED FROM LIQUIDACIÓN', r => r.p.liq && r.liq === ad.liquidaciones[0] && r.p.liq.removido === 'Yes' ? pill('Yes', 'roj') : 'No']]),
      reg: r => 'p:' + r.p.id,
      filas: ap => conductores().filter(p => p.id === ap.q && estadoConductor(p) !== 'Unapproved').map(p => fila(p, ap.sel.liq)) });
  }

  /* ---------- Vistas de conductor ---------- */
  const TITULO_VISTA = { detalle: '', mensajes: '', 'p-edit': 'Edit Profile', 'p-vehicle': 'Vehicle List', 'p-bank': 'Providers Account List', 'p-acchist': 'Provider Payment Account History', 'p-history': 'Provider History', 'p-records': "Driver's Records",
    'p-cash': "Driver's Cash Blocked History", 'p-referral': 'Referral History', 'p-docs': 'Provider Documents', 'u-edit': 'Edit Profile', 'u-history': 'User History', 'u-records': "User's Records", 'u-referral': 'Referral History', 'u-wallet': 'User Wallet History',
    'u-doc': 'View Document', 'u-incidents': "Incident's History" };
  const ficha = (pares) => '<div class="ap-ficha">' + pares.map(x => '<label class="amod-l">' + esc(x[0]) + '<input value="' + esc(x[1] == null ? '' : x[1]) + '" readonly></label>').join('') + '</div>';
  const tablaSimple = (cols, filas, vac) => '<div class="at-w"><table class="at"><thead><tr>' + cols.map(c => '<th>' + c + '</th>').join('') + '</tr></thead><tbody>' + filas.map(f => '<tr>' + f.map(x => '<td>' + x + '</td>').join('') + '</tr>').join('') + '</tbody></table>' +
    (!filas.length ? '<div class="at-vacio">' + (vac || 'No data available') + '</div>' : '') + '</div>';
  function conP(f) { return cont => { const p = buscarP(A.obj); if (!p) { cont.innerHTML = volverHTML() + '<div class="at-vacio">Provider not found</div>'; return enlazarVolver(cont); } cont.innerHTML = volverHTML() + f(p); enlazarVolver(cont); enlazarComunes(cont, C.repintar); }; }
  function conU(f) { return cont => { const u = buscarU(A.obj); if (!u) { cont.innerHTML = volverHTML() + '<div class="at-vacio">User not found</div>'; return enlazarVolver(cont); } cont.innerHTML = volverHTML() + f(u); enlazarVolver(cont); enlazarComunes(cont, C.repintar); if (f.despues) f.despues(cont, u); }; }
  const historialTrips = filtro => C.ses.viajes.filter(v => existe(v, minAhora()) && filtro(v)).sort((a, b) => Number(b.id) - Number(a.id))
    .map(v => { const s = estado(v, minAhora()); return [esc(v.id), fmt(fechaDe(v)), uLink(v.userId), esc(v.user), pLink(v.providerId), esc(v.provider), esc(v.servicio), money(v.monto), pago(v.pago), pill(s, ESTADO_PILL[s]), '<button class="ab-act" data-vt="' + esc(v.id) + '">View Map</button>']; });
  const COLS_HIST = ['ID', 'DATE', 'USER ID', 'USER', 'PROVIDER ID', 'PROVIDER', 'SERVICE TYPE', 'AMOUNT', 'PAYMENT', 'STATUS', 'ACTION'];
  const docSVG = (nombre, cedula, flash) => '<svg class="ap-doc" viewBox="0 0 340 214" font-family="Arial, sans-serif" role="img" aria-label="Foto de la cédula"><defs><radialGradient id="fl"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".55" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>' +
    '<rect width="340" height="214" rx="12" fill="#cfe3f3"/><rect x="0" y="0" width="340" height="34" rx="12" fill="#f2c94c"/><text x="14" y="22" font-size="10.5" font-weight="700" fill="#333">REPÚBLICA BOLIVARIANA DE VENEZUELA</text>' +
    '<rect x="16" y="50" width="86" height="108" fill="#9fb4c7"/><circle cx="59" cy="88" r="20" fill="#7b8fa3"/><path d="M27 156a32 26 0 0 1 64 0z" fill="#7b8fa3"/>' +
    '<text x="118" y="66" font-size="11" fill="#555">V</text><text x="132" y="68" font-size="20" font-weight="700" fill="#222">' + esc(cedula) + '</text><text x="118" y="96" font-size="10" fill="#555">APELLIDOS Y NOMBRES</text><text x="118" y="112" font-size="13" fill="#222">' + esc(nombre.toUpperCase()) + '</text>' +
    '<text x="118" y="138" font-size="9" fill="#555">F. NACIMIENTO 14/03/1996 · EXPEDICIÓN 2019</text><rect x="16" y="172" width="308" height="24" fill="#b8d0e4"/>' + (flash ? '<ellipse cx="190" cy="95" rx="120" ry="70" fill="url(#fl)"/>' : '') + '</svg>';
  const VISTAS = {
    detalle: cont => detalle(cont, C.ses.viajes.find(v => v.id === A.obj)),
    mensajes: cont => mensajes(cont, C.ses.viajes.find(v => v.id === A.obj)),
    'p-edit': conP(p => '<div class="ad-card"><h2>Edit Profile · Provider ID ' + esc(p.id) + '</h2><div class="ap-perfil-g"><span class="ap-foto">' + ic('user') + '</span>' + ficha([['First Name', p.nombre.split(' ').slice(0, 2).join(' ')], ['Last Name', p.nombre.split(' ').slice(2).join(' ')],
      ['Email', p.email], ['Phone', p.tel], ['Address', p.ubic], ['City', p.ciudad], ['Status', estadoConductor(p)], ['Status Reason', p.motivoEstado], ['Service Type', p.servicios], ['Wallet', money(p.wallet)], ['Category', p.categoria], ['App Version', p.app]]) + '</div><button class="ab-apply" disabled>Update</button></div>'),
    'p-vehicle': conP(p => '<h2 class="adm-h2">Vehicle List · ' + esc(p.nombre) + ' (' + esc(p.id) + ')</h2>' + tablaSimple(['BRAND', 'PLATE NO', 'MODEL', 'COLOR', 'YEAR', 'TYPE', 'STATUS'], (p.vehiculos || []).map(v => [esc(v.marca), esc(v.placa), esc(v.modelo), esc(v.color), v.anio, esc(v.tipo), pill('Approved', 'ver')]))),
    'p-bank': conP(p => '<h2 class="adm-h2">Providers Account List: ' + esc(p.nombre) + '</h2>' + tablaSimple(['PROVIDER ID', 'PROVIDER NAME', 'PROVIDER EMAIL', 'ACCOUNT ID', 'ACCOUNT NAME', 'STATUS', 'ACTION'],
      (p.cuentas || []).map(c => [esc(p.id), esc(p.nombre), esc(p.email), esc(c.id), esc(c.nombre), pill(cuentaEstado(p, c), cuentaEstado(p, c) === 'Approved' ? 'ver' : 'roj'), '<button class="ab-act" data-rej="' + esc(c.id) + '">Reject</button> <button class="ab-act" data-det="' + esc(c.id) + '">View details</button>']))),
    'p-acchist': conP(p => '<h2 class="adm-h2">Provider Payment Account History · ' + esc(p.id) + '</h2>' + tablaSimple(['PROVIDER ID', 'PROVIDER NAME', 'ACCOUNT ID', 'NAME', 'CREATED AT', 'TYPE', 'BY ADMIN', 'REASON'],
      (p.cuentas || []).map(c => [esc(p.id), esc(p.nombre), esc(c.id), esc(c.nombre), fmt('2025-01-10T10:00:00'), pill('Created', 'ver'), 'N/A', '']).concat(hechas('rechazar-cuenta', 'p:' + p.id).map(a => [esc(p.id), esc(p.nombre), esc(a.dato.cuenta), '', fmt(C.fecha(a.min)), pill('Rejected', 'roj'), 'Tú', esc(a.dato.motivo)])))),
    'p-history': conP(p => '<h2 class="adm-h2">Trips · Provider ' + esc(p.id) + ' · ' + esc(p.nombre) + '</h2>' + tablaSimple(COLS_HIST, historialTrips(v => v.providerId === p.id))),
    'p-records': conP(p => '<h2 class="adm-h2">' + "Driver's Records · " + esc(p.nombre) + ' (' + esc(p.id) + ')</h2>' + tablaSimple(['ID', 'ADMIN', 'DATE TIME', 'REASON', 'TYPE'], (p.records || []).map(r => [esc(r.id), esc(r.admin), fmt(r.fecha), esc(r.motivo), pill(r.tipo, r.tipo === 'Approved' ? 'ver' : 'nar')]))),
    'p-cash': conP(p => '<h2 class="adm-h2">' + "Driver's cash blocked history · " + esc(p.id) + '</h2>' + tablaSimple(['ID', 'DATE', 'DEBT', 'LIMIT', 'STATUS'], (p.cashBlock || []).map(x => [esc(x.id), fmt(x.fecha), money(x.deuda), money(x.limite), esc(x.estado)]))),
    'p-referral': conP(p => '<h2 class="adm-h2">Referral history · ' + esc(p.id) + '</h2>' + tablaSimple(['ID', 'NAME', 'DATE', 'STATUS'], [])),
    'p-docs': conP(p => '<h2 class="adm-h2">Documents · ' + esc(p.nombre) + ' (' + esc(p.id) + ')</h2>' + tablaSimple(['DOCUMENT', 'EXPIRATION DATE', 'STATUS'], [['Cédula de identidad', '12/2031', pill('Vigente', 'ver')], ['Licencia de conducir', '05/2027', pill('Vigente', 'ver')],
      ['Certificado médico', '05/2027', pill('Vigente', 'ver')], ['Carnet de circulación', '—', pill('Vigente', 'ver')], ['Póliza RCV', '01/2027', pill(estadoConductor(p) === 'Unapproved' ? 'Pendiente' : 'Vigente', estadoConductor(p) === 'Unapproved' ? 'nar' : 'ver')]])),
    'u-edit': conU(u => '<div class="ad-card"><h2>Edit Profile · User ID ' + esc(u.id) + '</h2><div class="ap-perfil-g"><span class="ap-foto">' + ic('user') + '</span>' + ficha([['First Name', u.nombre.split(' ')[0]], ['Last Name', u.nombre.split(' ').slice(1).join(' ')], ['Email', u.email], ['Phone', u.tel],
      ['Cédula', u.cedula], ['City', u.ciudad], ['Wallet', money(walletUsuario(u))], ['Status', estadoUsuario(u)], ['Created By', u.creadoPor], ['App Version', u.app]]) + '</div><button class="ab-apply" disabled>Update</button></div>'),
    'u-history': conU(u => '<h2 class="adm-h2">Trips · User ' + esc(u.id) + ' · ' + esc(u.nombre) + '</h2>' + tablaSimple(COLS_HIST, historialTrips(v => v.userId === u.id))),
    'u-records': conU(Object.assign(u => '<h2 class="adm-h2">' + "User's Records · " + esc(u.nombre) + ' (' + esc(u.id) + ')</h2><button class="ab-apply" data-rep>+ Add record</button>' +
      tablaSimple(['ID', 'ADMIN', 'DATE TIME', 'DESCRIPTION', 'TYPE'], (u.records || []).map(r => [esc(r.id), esc(r.admin), fmt(r.fecha), esc(r.motivo), pill(r.tipo, 'nar')]).concat(hechas('reporte-usuario', 'u:' + u.id).map((a, k) => ['N-' + (k + 1), 'Tú', fmt(C.fecha(a.min)), esc(a.dato.motivo), pill('Report', 'nar')]))),
    { despues: (cont, u) => cont.querySelector('[data-rep]').addEventListener('click', () => modal("Add User's Record", '<p class="amod-n">Usuario <b>' + esc(u.id) + '</b> · ' + esc(u.nombre) + '</p><label class="amod-l">Description</label><textarea data-m="motivo" rows="3" placeholder="¿Qué pasó? Ej.: viaje #, qué reportó el conductor"></textarea>',
      [['Cancel', null], ['Save', async val => { if (!val.motivo) { toast('Escribe la descripción.', 'bad'); return false; } await accion('reporte-usuario', 'u:' + u.id, { motivo: val.motivo }); }]])) })),
    'u-referral': conU(u => '<h2 class="adm-h2">Referral history · ' + esc(u.id) + '</h2>' + tablaSimple(['NAME', 'DATE', 'STATUS'], (u.referidos || []).map(r => [esc(r.nombre), esc(r.fecha), pill(r.estado, r.estado === 'Vencido' ? 'roj' : 'ver')]))),
    'u-wallet': conU(u => '<h2 class="adm-h2">User Wallet History · ' + esc(u.nombre) + ' (' + esc(u.id) + ')</h2>' + tablaSimple(['ID', 'TYPE', 'PAYMENT TYPE', 'DATE', 'CITY', 'USER ID', 'EMAIL', 'CURRENCY', 'WALLET AMOUNT', 'ADD/CUT', 'WALLET', 'FROM WHERE?'],
      (u.walletHist || []).map(w => [esc(w.id), esc(w.tipo), esc(w.pagoTipo), fmt(w.fecha), esc(w.ciudad), esc(u.id), esc(u.email), esc(w.moneda), money(w.monto), pill(w.addcut, w.addcut === 'Add' ? 'ver' : 'roj'), money(w.wallet), esc(w.desde)])
        .concat(hechas('agregar-wallet', 'u:' + u.id).map((a, k) => ['A-' + (k + 1), esc(a.dato.tipo), 'Admin', fmt(C.fecha(a.min)), esc(u.ciudad), esc(u.id), esc(u.email), esc(a.dato.moneda), money(a.dato.monto), pill(a.dato.addcut, a.dato.addcut === 'Add' ? 'ver' : 'roj'), money(walletUsuario(u)), 'Admin']))) +
      '<button class="ab-apply" data-aw>Add Wallet</button>'),
    'u-doc': conU(u => '<div class="ad-card"><h2>Documento de identidad · ' + esc(u.nombre) + ' (' + esc(u.id) + ')</h2>' + (u.cedula === 'N/A' && u.documento !== 'flash' ? '<div class="at-vacio">El usuario no ha cargado su cédula.</div>'
      : docSVG(u.nombre, u.cedula !== 'N/A' ? u.cedula.replace(/^V-/, '') : '2' + String(u.id).slice(0, 7), u.documento === 'flash')) + '<p class="amod-n">Estado de autenticación: <b>' + (u.cedula === 'N/A' ? 'No autenticado' : 'Autenticado') + '</b></p></div>'),
    'u-incidents': conU(u => '<h2 class="adm-h2">' + "Incident's History · " + esc(u.id) + '</h2>' + tablaSimple(['ID', 'TRIP ID', 'INCIDENT', 'AMOUNT', 'DATE'], []))
  };
  // Botones internos de algunas vistas
  document.addEventListener('click', e => {
    if (!C) return;
    const t = e.target.closest('[data-vt],[data-rej],[data-det],[data-aw]');
    if (t && t.closest('.adm')) {
      if (t.dataset.vt) return abrir('detalle', t.dataset.vt);
      const p = buscarP(A.obj), u = buscarU(A.obj);
      if (t.dataset.rej && p) return rechazarCuenta(p, p.cuentas.find(c => c.id === t.dataset.rej));
      if (t.dataset.det && p) return verCuenta(p, p.cuentas.find(c => c.id === t.dataset.det));
      if (t.hasAttribute('data-aw') && u) return agregarWallet(u);
    }
    if (A.menu && !e.target.closest('.aa') && !e.target.closest('.adm-modal')) { A.menu = null; C.repintar(); }
  });

  /* ---------- Detalle del viaje (View Map) ---------- */
  function mapa(v, completado) {
    const seed = Number(String(v.id).slice(-4)) || 7, r = k => ((seed * (k + 3) * 9301 + 49297) % 233280) / 233280;
    const W = 580, H = 300, P = { x: 330 + r(1) * 120, y: 30 + r(2) * 40 }, U = { x: 470 + r(3) * 60, y: 220 + r(4) * 50 }, D = { x: 70 + r(5) * 100, y: 40 + r(6) * 60 };
    let calles = '';
    for (let k = 0; k < 7; k++) calles += '<line x1="' + (k * 95 - 40) + '" y1="0" x2="' + (k * 95 + 60) + '" y2="' + H + '" stroke="#fff" stroke-width="' + (k % 3 ? 7 : 12) + '"/>';
    for (let k = 0; k < 5; k++) calles += '<line x1="0" y1="' + (k * 75 + 20) + '" x2="' + W + '" y2="' + (k * 75 - 20) + '" stroke="#fff" stroke-width="' + (k % 2 ? 6 : 10) + '"/>';
    const lugares = [v.pickup, v.destino, 'Farmacia', 'Automercado', 'Escuela', 'Tienda'].map((t, k) => '<text x="' + (40 + r(k + 10) * 480) + '" y="' + (40 + r(k + 20) * 230) + '" font-size="10" fill="#5f6368">' + esc(String(t).slice(0, 26)) + '</text>').join('');
    const sinRecorrido = Number(v.km) === 0;
    const ruta = completado ? (sinRecorrido ? '' : '<polyline points="' + [U, { x: U.x - 40, y: U.y - 60 }, { x: (U.x + D.x) / 2, y: U.y - 110 }, { x: D.x + 60, y: D.y + 40 }, D].map(p => p.x + ',' + p.y).join(' ') + '" fill="none" stroke="#c2185b" stroke-width="2.5"/>')
      : '<polyline points="' + [P, U, D].map(p => p.x + ',' + p.y).join(' ') + '" fill="none" stroke="#e8558f" stroke-width="2"/>';
    const marca = (p, color, letra) => '<g transform="translate(' + p.x + ',' + p.y + ')"><path d="M0 0c-8-10-11-14-11-19a11 11 0 0 1 22 0c0 5-3 9-11 19z" fill="' + color + '" stroke="#fff" stroke-width="1.5"/><text x="0" y="-15" font-size="10" fill="#fff" text-anchor="middle" font-weight="700">' + letra + '</text></g>';
    return '<svg class="adm-map" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Mapa del viaje"><rect width="' + W + '" height="' + H + '" fill="#e9ecef"/><rect x="' + (20 + r(7) * 200) + '" y="' + (150 + r(8) * 80) + '" width="120" height="70" fill="#c8e6c9"/>' + calles + lugares + ruta +
      (completado ? '' : marca(P, '#2e7d7a', '⌖')) + marca(U, '#2e7d32', '●') + (completado && sinRecorrido ? '' : marca(D, '#c62828', '⚑')) + '<text x="8" y="' + (H - 8) + '" font-size="10" fill="#777">Mapa de práctica · Ridery Academy</text></svg>';
  }
  function detalle(cont, v) {
    if (!v) { A.vista = null; return C.repintar(); }
    const st = estado(v, minAhora()), comp = st === 'Completed' || (st === 'Cancelled' && (v.eventos || []).some(e => e.st === 'Completed'));
    cont.innerHTML = volverHTML() +
      '<div class="ad-g"><div class="ad-card"><h2>Trip Requested</h2><ul><li><b>Real Pickup Address:</b> ' + esc(v.pickup) + ', ' + esc(v.ciudad) + ', Venezuela</li><li><b>Real City Pickup Address:</b> ' + esc(v.ciudad) + '</li>' +
        '<li><b>Real Destination Address:</b> ' + esc(v.destino) + '</li><li><b>Accepted Provider Address:</b> ' + esc(v.providerAddr || '—') + '</li></ul></div>' +
      '<div class="ad-card"><h2>Trip Completed</h2><ul><li><b>Pickup Address:</b> ' + esc(v.pickup) + ', ' + esc(v.ciudad) + '</li><li><b>City Pickup Address:</b> ' + esc(v.ciudad) + '</li><li><b>Destination Address:</b> ' + esc(v.destino) + '</li></ul></div>' +
      '<div class="ad-card">' + mapa(v, false) + '<div class="ad-ley"><span><i class="m1"></i>Provider Location</span><span><i class="m2"></i>Real Pickup Location</span><span><i class="m3"></i>Real Destination Location</span></div>' +
        '<table class="ad-t"><tr><th>REAL KM</th><th>REAL TIME</th><th>SURGE</th><th>PROMO CODE</th><th>TOTAL VALUE OF THE TRIP ACCORDING THE REQUESTED TRIP</th></tr><tr><td>' + money(v.km) + '</td><td>' + esc(v.realTime) + '</td><td>' + esc(v.surge) + '</td><td>N/A</td><td><button class="ab-recalc" disabled>' + ic('refresh') + ' Recalculate</button></td></tr></table></div>' +
      '<div class="ad-card">' + mapa(v, true) + '<div class="ad-ley"><span><i class="m1"></i>Provider Location</span><span><i class="m2"></i>Pickup Location</span><span><i class="m3"></i>Destination Location</span><span><i class="m4"></i>SOS Created Location</span></div>' +
        '<table class="ad-t"><tr><th>KM TRAVELED</th><th>REAL TIME</th><th>SURGE</th><th>PROMOCODE</th><th>TOTAL</th></tr><tr><td>' + (comp ? money(v.km) : '0.00') + '</td><td>' + (comp ? esc(v.realTime) : '0.00') + '</td><td>' + esc(v.surge) + '</td><td>N/A</td><td>' + money(comp ? v.monto : 0) + '</td></tr></table></div></div>' +
      '<div class="at-w"><table class="at"><thead><tr><th>TRIP ID</th><th>SERVICE TYPE / PRICE</th><th>USER ID</th><th>USER NAME</th><th>PROVIDER ID</th><th>PROVIDER NAME</th><th>DATE TIME</th><th>STATUS</th><th>PAYMENT MODE</th><th>PAYMENT STATUS</th><th>PROMO CODE</th></tr></thead>' +
        '<tbody><tr><td>' + esc(v.id) + '</td><td>' + esc(v.tarifa || v.servicio) + '</td><td>' + uLink(v.userId) + '</td><td>' + esc(v.user) + '</td><td>' + pLink(v.providerId) + '</td><td>' + esc(v.provider || '—') + '</td><td>' + fmt(fechaDe(v)) + '</td><td>' + pill(st, ESTADO_PILL[st]) + '</td><td>' + pago(v.pago) + '</td>' +
        '<td>' + pill(v.pagoEstado, v.pagoEstado === 'Paid' ? 'ver' : 'nar') + '</td><td>---</td></tr></tbody></table></div>' +
      (v.mensajes && v.mensajes.length ? '<button class="ab-apply" data-msg>' + ic('msg') + ' Messages</button>' : '');
    enlazarVolver(cont); enlazarComunes(cont, C.repintar);
    const m = cont.querySelector('[data-msg]'); if (m) m.addEventListener('click', () => abrir('mensajes', v.id));
  }
  function mensajes(cont, v) {
    if (!v) { A.vista = null; return C.repintar(); }
    const min = minAhora(), ms = (v.mensajes || []).filter(m => m.min <= min);
    cont.innerHTML = volverHTML() + '<div class="am"><h1>' + ic('msg') + ' Messages</h1>' +
      (ms.length ? ms.map(m => '<div class="am-m ' + (m.de === 'provider' ? 'p' : 'u') + '"><div class="am-h"><b>' + esc(m.de === 'provider' ? v.provider : v.user) + '</b><span>' + C.fecha(m.min).toLocaleString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + '</span></div>' + esc(m.t) + '</div>').join('')
        : '<p class="am-vacio">No hay mensajes en este viaje.</p>') + '</div>';
    enlazarVolver(cont);
  }

  /* ---------- URL de la pestaña ---------- */
  const RUTAS = { dashboard: 'dashboard', all: 'all_requests', waiting: 'waiting_requests', running: 'running_requests', completed: 'requests', scheduled: 'scheduled_requests', cancelled: 'cancelled_trips', sos: 'sos_requests', special: 'special_trips',
    'prov-all': 'all_providers', 'prov-online': 'online_providers', 'prov-approved': 'approved_providers', 'prov-unapproved': 'unapproved_providers', 'prov-blocked': 'blocked_providers', 'prov-cashblocked': 'cash_blocked_providers',
    'prov-suspended': 'suspended_providers', 'prov-deleted': 'deleted_providers', 'prov-incidents': 'providers_incidents', 'prov-bank': 'providers_account_list', 'prov-agreement': 'payment_agreement', 'prov-autosusp': 'auto_suspension_history',
    users: 'users', 'users-blocked': 'blocked_users', 'users-deleted': 'deleted_users', 'users-incidents': 'users_incidents', 'rev-all': 'reviews', 'rev-users': 'bad_reviews_users', 'rev-drivers': 'bad_reviews_providers', 'rev-contacted': 'contacted_reviews',
    'map-providers': 'map_view', 'emp-aspirantes': 'emprende_aspirantes', 'emp-flotas': 'emprende_flotas', 'stype-list': 'service_types', 'store-warehouse': 'warehouse', 'store-inventory': 'inventory', 'store-accessories': 'accessories',
    'fraud-trips': 'fraud_trips', 'fraud-pur': 'pur_trips', 'tpay-inquiries': 'payment_inquiries', 'tpay-disputes': 'cash_disputes', 'adm-liq': 'payment_inquiries', 'set-promo': 'promo_codes' };
  const RUTAS_V = { detalle: 'trip_map?id=', mensajes: 'chat_history?id=', 'p-edit': 'profile_detail_edit?id=', 'p-vehicle': 'provider_vehicle_list?id=', 'p-bank': 'providers_account_list?provider_id=', 'p-acchist': 'provider_payment_account_history?id=',
    'p-history': 'provider_history?id=', 'p-records': 'provider_approval_history?id=', 'p-cash': 'provider_cash_blocked_history?id=', 'p-referral': 'provider_referral_history?id=', 'p-docs': 'provider_documents?id=', 'u-edit': 'user_detail_edit?id=',
    'u-history': 'user_history?id=', 'u-records': 'user_records?id=', 'u-referral': 'user_referral_history?id=', 'u-wallet': 'user_wallet_history?id=', 'u-doc': 'user_document?id=', 'u-incidents': 'user_incidents?id=' };
  const ruta = () => A.vista ? (RUTAS_V[A.vista] || '') + A.obj : A.modulo === 'store-warehouse' && A.almacen ? 'warehouse_show_stock' : (RUTAS[A.modulo] || A.modulo.replace(/-/g, '_'));
  // El simulador repinta cada 10 s solo las listas de viajes (cambian con el reloj)
  const vivo = () => !A.vista && (esTrip(A.modulo) || A.modulo === 'dashboard') && !document.querySelector('.adm-modal');
  window.ElxSimAdmin = { pintar, ruta, vivo, reiniciar() { A = ESTADO0(); } };
})();
