/* ============================================================
   Formación CX · Lógica compartida
   La usan las funciones de /api (Node, MongoDB) y el modo demo
   del navegador. No contiene secretos.
   "store" es un adaptador con: get(col,id) · find(col,filtro)
   · put(col,doc) · del(col,id)
   ============================================================ */
(function (root) {
  'use strict';

  /* ---------- Valores iniciales (editables desde el panel) ---------- */
  const CELULAS_DEFAULT = [
    { id: 'CX', nombre: 'CX', descripcion: 'Atención general a usuarios y conductores.' },
    { id: 'SUPPLY', nombre: 'Supply', descripcion: 'Registro, documentos y acompañamiento de conductores.' },
    { id: 'ECR', nombre: 'ECR', descripcion: 'Descripción pendiente: edítala en Ajustes.' },
    { id: 'MATCH AND PRICING', nombre: 'Match and Pricing', descripcion: 'Asignación de viajes, zonas y tarifas.' },
    { id: 'FRAUD', nombre: 'Fraud', descripcion: 'Seguridad, investigación de cuentas y prevención de fraude.' },
    { id: 'GROWTH', nombre: 'Growth', descripcion: 'Promociones, campañas y crecimiento.' },
    { id: 'TRIPS', nombre: 'Trips', descripcion: 'Incidencias durante y después de los viajes.' },
    { id: 'PAYMENTS', nombre: 'Payments', descripcion: 'Pagos de conductores, cobros a usuarios y reembolsos.' },
    { id: 'ORDERS', nombre: 'Orders', descripcion: 'Pedidos y entregas.' },
    { id: 'TRANSVERSAL', nombre: 'Transversal', descripcion: 'Apoyo a varias células y mejora de procesos.' }
  ];
  const COMUN = 'COMUN';

  const REGLAS_DEFAULT = {
    minPuntos: 4,        // puntaje mínimo de la célula ganadora
    margenEmpate: 1,     // diferencia mínima entre 1.ª y 2.ª célula
    notaMinima: 80,      // % para aprobar un examen
    intentosMax: 3,      // intentos por examen
    porcentajeVideo: 90  // % del video que debe verse
  };

  const op = (texto, puntos) => ({ texto, puntos });
  const PREGUNTAS_EJEMPLO = [
    { _id: 'p1', orden: 1, activa: true, texto: 'Un usuario escribe que le cobraron dos veces el mismo viaje. ¿Qué haces primero?', opciones: [
      op('Reviso el historial de pagos y la transacción duplicada', { PAYMENTS: 2 }),
      op('Le pido los detalles del viaje y reviso la ruta', { TRIPS: 2 }),
      op('Verifico si la cuenta tiene movimientos fuera de lo normal', { FRAUD: 2 }),
      op('Le explico cómo se calculó la tarifa', { 'MATCH AND PRICING': 2 })
    ] },
    { _id: 'p2', orden: 2, activa: true, texto: '¿Qué tipo de tarea disfrutas más?', opciones: [
      op('Cuadrar montos y trabajar con números', { PAYMENTS: 2, 'MATCH AND PRICING': 1 }),
      op('Investigar casos y encontrar patrones raros', { FRAUD: 2 }),
      op('Conversar con personas molestas y calmarlas', { CX: 2, TRIPS: 1 }),
      op('Guiar a alguien paso a paso en un trámite', { SUPPLY: 2, CX: 1 })
    ] },
    { _id: 'p3', orden: 3, activa: true, texto: 'El manual no tiene una respuesta clara para un caso. ¿Qué haces?', opciones: [
      op('Busco datos y comparo con casos parecidos', { FRAUD: 1, PAYMENTS: 1 }),
      op('Escalo rápido para que el cliente no espere', { CX: 2 }),
      op('Propongo que se agregue al manual', { TRANSVERSAL: 2, GROWTH: 1 }),
      op('Reviso las reglas y tarifas que aplican', { 'MATCH AND PRICING': 2 })
    ] },
    { _id: 'p4', orden: 4, activa: true, texto: '¿Con qué herramienta te sientes más cómodo?', opciones: [
      op('Hojas de cálculo (Excel o Google Sheets)', { 'MATCH AND PRICING': 2, PAYMENTS: 1, TRANSVERSAL: 1 }),
      op('Chats y redes sociales', { CX: 2, GROWTH: 1 }),
      op('Mapas y seguimiento GPS', { TRIPS: 2, 'MATCH AND PRICING': 1 }),
      op('Formularios y revisión de documentos', { SUPPLY: 2, FRAUD: 1 })
    ] },
    { _id: 'p5', orden: 5, activa: true, texto: 'Un conductor dice que la app no le asigna viajes en su zona. ¿Qué revisas primero?', opciones: [
      op('Si tiene documentos vencidos en su cuenta', { SUPPLY: 2 }),
      op('Cómo están la demanda y la tarifa en esa zona', { 'MATCH AND PRICING': 2 }),
      op('Si hay reportes recientes sobre su cuenta', { FRAUD: 2 }),
      op('Le explico paso a paso cómo ponerse disponible', { CX: 2 })
    ] }
  ];

  const VIDEO_EJEMPLO = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';
  const q = (id, texto, opciones, correcta, explicacion) => ({ id, texto, opciones, correcta, explicacion });
  const MODULOS_EJEMPLO = [
    { _id: 'm-comun-1', celula: COMUN, orden: 1, titulo: 'Bienvenida a Ridery',
      descripcion: 'Qué hace Ridery y cómo se organiza el equipo de CX.',
      lecciones: [
        { id: 'l-c1-1', titulo: 'Qué es Ridery', youtube: VIDEO_EJEMPLO, imagenes: [],
          contenido: 'Contenido de ejemplo. Reemplázalo desde el panel admin.\n\nRidery conecta a usuarios que necesitan moverse con conductores en su ciudad. Como agente de CX vas a ayudar a ambos lados de la plataforma.\n\n- Usuarios: piden viajes y pagan.\n- Conductores: aceptan viajes y reciben sus pagos.' },
        { id: 'l-c1-2', titulo: 'Cómo se organiza CX: las células', youtube: '', imagenes: [],
          contenido: 'El equipo de CX se divide en células. Cada célula atiende un tipo de caso: pagos, fraude, viajes, conductores y más.\n\nTu test de perfil te asignó a la célula donde tus habilidades encajan mejor. Primero completas este tronco común y luego la formación de tu célula.' }
      ],
      examen: { preguntas: [
        q('e1', '¿A quiénes atiende el equipo de CX?', ['Solo a usuarios', 'Solo a conductores', 'A usuarios y conductores', 'Solo a empresas aliadas'], 2, 'CX atiende a los dos lados de la plataforma: usuarios y conductores.'),
        q('e2', '¿Qué es una célula?', ['Un turno de trabajo', 'Un equipo que atiende un tipo de caso', 'Una herramienta de chat', 'Un reporte semanal'], 1, 'Cada célula se especializa en un tipo de caso.'),
        q('e3', '¿Qué completas antes de la formación de tu célula?', ['El tronco común', 'Una entrevista final', 'Nada, empiezas directo', 'Un examen de Excel'], 0, 'Todos los aspirantes hacen primero el tronco común.')
      ] } },
    { _id: 'm-comun-2', celula: COMUN, orden: 2, titulo: 'Calidad de atención',
      descripcion: 'Tono, estructura de respuesta y las métricas que miden tu trabajo.',
      lecciones: [
        { id: 'l-c2-1', titulo: 'Cómo le escribimos a un cliente', youtube: VIDEO_EJEMPLO, imagenes: [],
          contenido: 'Una buena respuesta tiene tres partes:\n\n- Saludo con el nombre de la persona.\n- Solución o siguiente paso claro.\n- Cierre que confirma si necesita algo más.\n\nEvita respuestas copiadas sin adaptar al caso.' },
        { id: 'l-c2-2', titulo: 'Métricas: CSAT, TTR y FTR', youtube: '', imagenes: [],
          contenido: 'CSAT: satisfacción del cliente con la atención recibida.\n\nTTR: tiempo total hasta resolver el caso.\n\nFTR: porcentaje de casos resueltos en el primer contacto, sin que el cliente tenga que volver a escribir.' }
      ],
      examen: { preguntas: [
        q('e1', '¿Qué mide el FTR?', ['La satisfacción del cliente', 'Los casos resueltos en el primer contacto', 'El tiempo de conexión del agente', 'El número de tickets por día'], 1, 'FTR es la resolución en el primer contacto.'),
        q('e2', '¿Qué parte NO debe faltar en una respuesta?', ['Un emoji', 'Un siguiente paso claro', 'Un enlace a redes sociales', 'Una disculpa larga'], 1, 'El cliente siempre debe saber qué pasa después.'),
        q('e3', '¿Qué mide el TTR?', ['Tiempo total hasta resolver', 'Tiempo de respuesta del cliente', 'Tickets reabiertos', 'Calidad de la redacción'], 0, 'TTR es el tiempo hasta la resolución.')
      ] } },
    { _id: 'm-pay-1', celula: 'PAYMENTS', orden: 1, titulo: 'Pagos y reembolsos',
      descripcion: 'Cómo revisar un cobro y cuándo procede un reembolso.',
      lecciones: [
        { id: 'l-p1-1', titulo: 'Revisar un cobro', youtube: VIDEO_EJEMPLO, imagenes: [],
          contenido: 'Contenido de ejemplo. Antes de responder un reclamo de cobro, revisa el viaje, el método de pago y si existe una transacción duplicada.' },
        { id: 'l-p1-2', titulo: 'Cuándo procede un reembolso', youtube: '', imagenes: [],
          contenido: 'Contenido de ejemplo. Carga aquí la política real de reembolsos de la célula.' }
      ],
      examen: { preguntas: [
        q('e1', '¿Qué revisas antes de responder un reclamo de cobro?', ['Solo el monto', 'El viaje, el método de pago y si hay duplicados', 'Las redes sociales del usuario', 'Nada, se reembolsa siempre'], 1, 'Hay que revisar el caso completo antes de responder.'),
        q('e2', 'Si encuentras un cobro duplicado confirmado, ¿qué haces?', ['Ignorarlo', 'Seguir la política de reembolso de la célula', 'Pedirle que pague de nuevo', 'Cerrar el ticket'], 1, 'Siempre se sigue la política vigente.')
      ] } },
    { _id: 'm-fraud-1', celula: 'FRAUD', orden: 1, titulo: 'Señales de fraude',
      descripcion: 'Patrones que indican que una cuenta necesita revisión.',
      lecciones: [
        { id: 'l-f1-1', titulo: 'Patrones comunes', youtube: VIDEO_EJEMPLO, imagenes: [],
          contenido: 'Contenido de ejemplo. Carga aquí los patrones reales que revisa la célula.' }
      ],
      examen: { preguntas: [
        q('e1', 'Ante una sospecha de fraude, lo correcto es:', ['Acusar al usuario en el chat', 'Documentar y escalar según el procedimiento', 'Bloquear la cuenta sin revisar', 'No hacer nada'], 1, 'Se documenta y se sigue el procedimiento.'),
        q('e2', '¿Qué es una señal de alerta?', ['Muchas cuentas con el mismo dispositivo', 'Un usuario que viaja de lunes a viernes', 'Pagar en efectivo', 'Calificar con 5 estrellas'], 0, 'Varias cuentas en un mismo dispositivo es un patrón típico.')
      ] } }
  ];

  /* ---------- Boost: actividades para mejorar cuellos de botella ---------- */
  const BOOST_DEFAULT = {
    mecanografia: {
      activa: true,
      meta: 40,                 // palabras por minuto objetivo
      precisionMin: 95,         // % de precisión esperado
      duraciones: [60, 120, 180],
      textos: [
        'Hola, gracias por escribirnos. Lamento el inconveniente con tu viaje de hoy. Ya revisé tu cuenta y encontré el cobro que mencionas. Te explico los pasos para resolverlo en pocos minutos.',
        'Entiendo tu molestia y quiero ayudarte. Para continuar, por favor confírmame la fecha del viaje, el punto de origen y el método de pago que usaste. Con esa información reviso el caso de inmediato.',
        'Buenas tardes, te saluda el equipo de atención de Ridery. Tu reembolso ya fue procesado y verás el monto reflejado en tu método de pago en un plazo de tres a cinco días hábiles.',
        'Gracias por tu paciencia. Revisé la ruta del viaje y el conductor tomó un desvío por un cierre de vía. Por eso la tarifa final fue mayor a la estimada. Aplicamos un ajuste a tu favor.',
        'Para proteger tu cuenta, nunca compartas tu código de verificación con nadie. Si recibiste una llamada pidiéndolo, cambia tu contraseña y avísanos para revisar la actividad reciente.',
        'Hola, conductor. Tus documentos fueron aprobados y ya puedes conectarte para recibir viajes. Recuerda mantener tu licencia y el seguro del vehículo vigentes para evitar suspensiones.'
      ]
    }
  };

  /* ---------- Utilidades ---------- */
  function err(status, mensaje) { const e = new Error(mensaje); e.status = status; return e; }
  function nuevoId(prefijo) { return (prefijo || 'id') + '-' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4); }
  function limpiar(s, max) { return String(s == null ? '' : s).trim().slice(0, max || 500); }
  function barajar(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function ahora() { return new Date().toISOString(); }

  async function cargarConfig(store) {
    let cfg = await store.get('config', 'general');
    if (!cfg) {
      cfg = { _id: 'general', celulas: CELULAS_DEFAULT, reglas: REGLAS_DEFAULT };
      await store.put('config', cfg);
      for (const p of PREGUNTAS_EJEMPLO) await store.put('preguntas', p);
      for (const m of MODULOS_EJEMPLO) await store.put('modulos', m);
      await store.put('cohortes', { _id: 'CX-2026-10', nombre: 'Cohorte de ejemplo · octubre 2026', activa: true, creado: ahora() });
    }
    cfg.reglas = Object.assign({}, REGLAS_DEFAULT, cfg.reglas || {});
    cfg.boost = cfg.boost || {};
    cfg.boost.mecanografia = Object.assign({}, BOOST_DEFAULT.mecanografia, cfg.boost.mecanografia || {});
    return cfg;
  }

  /* ---------- Test de perfil ---------- */
  function calcularCelula(preguntas, respuestas, reglas) {
    const puntajes = {};
    for (const p of preguntas) {
      const idx = respuestas[p._id];
      const opcion = p.opciones && p.opciones[idx];
      if (!opcion) continue;
      for (const [cel, v] of Object.entries(opcion.puntos || {})) puntajes[cel] = (puntajes[cel] || 0) + Number(v || 0);
    }
    const ranking = Object.entries(puntajes).sort((a, b) => b[1] - a[1]);
    const [primera, segunda] = ranking;
    let celula = null, estado = 'revision', motivo = '';
    if (!primera || primera[1] < reglas.minPuntos) motivo = 'Puntaje por debajo del mínimo';
    else if (segunda && primera[1] - segunda[1] < reglas.margenEmpate) motivo = 'Empate entre ' + primera[0] + ' y ' + segunda[0];
    else { celula = primera[0]; estado = 'asignado'; }
    return { puntajes, ranking, celula, estado, motivo };
  }

  /* ---------- Ruta de formación ---------- */
  function ordenarModulos(modulos) {
    return modulos.slice().sort((a, b) => ((a.celula === COMUN ? 0 : 1) - (b.celula === COMUN ? 0 : 1)) || ((a.orden || 0) - (b.orden || 0)));
  }

  function construirRuta(modulos, asp, reglas) {
    const prog = asp.progreso || {};
    const exs = asp.examenes || {};
    const lista = ordenarModulos(modulos.filter(m => m.celula === COMUN || (asp.celula && m.celula === asp.celula)));
    let anterioresOk = true, total = 0, hechos = 0;
    const salida = lista.map(m => {
      const lecciones = (m.lecciones || []).map(l => ({
        id: l.id, titulo: l.titulo, youtube: l.youtube || '', contenido: l.contenido || '', imagenes: l.imagenes || [],
        pct: (prog[l.id] && prog[l.id].pct) || 0, completada: !!(prog[l.id] && prog[l.id].completada)
      }));
      const ex = exs[m._id] || { intentos: 0, mejor: null, aprobado: false };
      const nPreg = ((m.examen && m.examen.preguntas) || []).length;
      const leccionesOk = lecciones.every(l => l.completada);
      const aprobado = nPreg ? !!ex.aprobado : leccionesOk;
      let estado;
      if (!anterioresOk) estado = 'bloqueado';
      else if (aprobado) estado = 'aprobado';
      else if (nPreg && ex.intentos >= reglas.intentosMax) estado = 'agotado';
      else estado = 'disponible';
      anterioresOk = anterioresOk && aprobado;
      total += lecciones.length + (nPreg ? 1 : 0);
      hechos += lecciones.filter(l => l.completada).length + (nPreg && ex.aprobado ? 1 : 0);
      return {
        _id: m._id, celula: m.celula, titulo: m.titulo, descripcion: m.descripcion || '', estado, lecciones,
        examen: { preguntas: nPreg, intentos: ex.intentos || 0, mejor: ex.mejor, aprobado: !!ex.aprobado,
          restantes: Math.max(0, reglas.intentosMax - (ex.intentos || 0)),
          habilitado: estado === 'disponible' && leccionesOk && nPreg > 0 }
      };
    });
    const tieneCelula = !!asp.celula && salida.some(m => m.celula === asp.celula);
    const completo = tieneCelula && salida.every(m => m.estado === 'aprobado');
    return { modulos: salida, progreso: total ? Math.round(hechos * 100 / total) : 0, completo, tieneCelula };
  }

  function calificar(examen, respuestas) {
    const preguntas = (examen && examen.preguntas) || [];
    const detalle = preguntas.map(p => ({ id: p.id, elegida: respuestas[p.id], ok: Number(respuestas[p.id]) === Number(p.correcta) }));
    const correctas = detalle.filter(d => d.ok).length;
    return { correctas, total: preguntas.length, nota: preguntas.length ? Math.round(correctas * 100 / preguntas.length) : 0, detalle };
  }

  function progresoAspirante(asp, modulos, reglas) {
    const r = construirRuta(modulos, asp, reglas);
    const notas = Object.values(asp.examenes || {}).filter(e => e.mejor != null).map(e => e.mejor);
    return { progreso: r.progreso, completo: r.completo, promedio: notas.length ? Math.round(notas.reduce((a, b) => a + b, 0) / notas.length) : null };
  }

  /* ---------- Acceso ----------
     Postúlate: formulario público (datos + test) que sugiere una célula y termina ahí.
     Inicia sesión: un solo acceso. Según el usuario entra al panel (equipo) o a la formación (aspirante aprobado). */
  const estadoDe = a => a.estado || 'postulado';
  const limpiarCedula = c => limpiar(c, 20).replace(/\D/g, ''); // V-20.111.222 y 20111222 son la misma cédula

  const limpiarUsuarioAsp = u => limpiar(u, 30).toLowerCase().replace(/\s+/g, '');
  const USUARIO_OK = /^[a-z0-9._-]{3,30}$/;

  async function loginAspirante(store, body, cripto) {
    await cargarConfig(store);
    const usuario = limpiarUsuarioAsp(body.usuario);
    const clave = String(body.clave || '');
    if (!usuario || !clave) throw err(400, 'Escribe tu usuario y tu contraseña.');
    const asp = (await store.find('aspirantes', { usuario }))[0];
    if (!asp || !asp.hash || !(await cripto.verificar(clave, asp.hash))) throw err(401, 'Usuario o contraseña incorrectos. Si no los tienes, escríbele a tu reclutador.');
    const est = estadoDe(asp);
    if (est === 'descartado') throw err(403, 'Tu postulación no continuó en este proceso. Gracias por tu interés en Ridery.');
    if (est !== 'aprobado') throw err(403, 'Tu acceso está pausado. Escríbele a tu reclutador.');
    asp.ultimoAcceso = ahora();
    await store.put('aspirantes', asp);
    return asp;
  }

  // Asigna usuario y contraseña a un aspirante (al aprobarlo, al agregarlo a mano o al cambiarlos)
  async function asignarAcceso(store, asp, usuarioPedido, clave, cripto) {
    const usuario = limpiarUsuarioAsp(usuarioPedido || asp.usuario || asp.cedula);
    if (!USUARIO_OK.test(usuario)) throw err(400, 'El usuario debe tener de 3 a 30 caracteres: letras, números, punto, guion o guion bajo, sin espacios.');
    const otro = (await store.find('aspirantes', { usuario })).find(x => x._id !== asp._id);
    if (otro) throw err(409, 'El usuario «' + usuario + '» ya lo tiene ' + otro.nombre + '. Elige otro.');
    if (await store.get('usuarios', usuario)) throw err(409, 'El usuario «' + usuario + '» ya es una cuenta del panel. Elige otro.');
    asp.usuario = usuario;
    if (clave) {
      if (String(clave).length < 6) throw err(400, 'La contraseña debe tener al menos 6 caracteres.');
      asp.hash = await cripto.hash(String(clave));
      asp.claveFecha = ahora();
    } else if (!asp.hash) throw err(400, 'Escribe o genera una contraseña para el aspirante.');
  }

  function vistaAspirante(asp) {
    return { _id: asp._id, nombre: asp.nombre, cedula: asp.cedula, usuario: asp.usuario || '', celula: asp.celula,
      estado: estadoDe(asp), completadoFecha: asp.completadoFecha || null };
  }

  async function requerirAspirante(store, user) {
    const asp = user && await store.get('aspirantes', user.id);
    if (!asp || estadoDe(asp) !== 'aprobado') throw err(401, 'Tu sesión expiró. Vuelve a entrar.');
    return asp;
  }

  /* ---------- Acciones públicas (Postúlate) ---------- */
  const publico = {
    async test({ store }) {
      await cargarConfig(store);
      const preguntas = (await store.find('preguntas', {})).filter(p => p.activa !== false).sort((a, b) => (a.orden || 0) - (b.orden || 0));
      return { preguntas: preguntas.map(p => ({ _id: p._id, texto: p.texto, opciones: p.opciones.map(o => o.texto) })) };
    },
    async verificarCedula({ store, body }) {
      const cedula = limpiarCedula(body.cedula);
      if (!cedula) throw err(400, 'Escribe tu cédula.');
      if (await store.get('aspirantes', 'asp-' + cedula)) throw err(409, 'Ya existe una postulación con esta cédula. Si ya te seleccionaron, entra por «Inicia sesión».');
      return { ok: true };
    },
    async postular({ store, body }) {
      const cfg = await cargarConfig(store);
      const d = body.datos || {};
      const cedula = limpiarCedula(d.cedula);
      const nombre = limpiar(d.nombre, 80);
      if (nombre.length < 3) throw err(400, 'Escribe tu nombre y apellido.');
      if (!cedula) throw err(400, 'Escribe tu cédula.');
      const id = 'asp-' + cedula;
      if (await store.get('aspirantes', id)) throw err(409, 'Ya existe una postulación con esta cédula.');
      const preguntas = (await store.find('preguntas', {})).filter(p => p.activa !== false);
      const respuestas = body.respuestas || {};
      const faltan = preguntas.filter(p => respuestas[p._id] == null || !p.opciones[respuestas[p._id]]);
      if (faltan.length) throw err(400, 'Faltan ' + faltan.length + ' preguntas por responder.');
      const r = calcularCelula(preguntas, respuestas, cfg.reglas);
      const resp = {};
      preguntas.forEach(p => { resp[p._id] = { pregunta: p.texto, opcion: Number(respuestas[p._id]), texto: p.opciones[respuestas[p._id]].texto }; });
      const asp = { _id: id, cedula, nombre, email: limpiar(d.email, 120), telefono: limpiar(d.telefono, 30), ciudad: limpiar(d.ciudad, 60),
        estado: 'postulado', creado: ahora(), ultimoAcceso: ahora(), cohorte: null, celula: r.celula, progreso: {}, examenes: {},
        test: { fecha: ahora(), respuestas: resp, puntajes: r.puntajes, ranking: r.ranking, estado: r.estado, motivo: r.motivo, celulaSugerida: r.celula } };
      await store.put('aspirantes', asp);
      const cel = cfg.celulas.find(c => c.id === r.celula);
      return { estado: r.estado, celula: cel || null, nombre };
    }
  };

  /* ---------- Acciones del aspirante ---------- */
  /* ---------- Chat de Assessment ----------
     mensajes: { _id, aspirante, de: 'aspirante'|'equipo', autor, texto, fecha, leido }
     conversaciones: { _id: aspiranteId, nombre, celula, ultimo, ultimoTexto, ultimoDe, noLeidosEquipo, noLeidosAsp } */
  async function hilo(store, aspId, desde) {
    const ms = (await store.find('mensajes', { aspirante: aspId })).sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)) || String(a._id).localeCompare(String(b._id)));
    return desde ? ms.filter(m => String(m.fecha) >= String(desde)) : ms.slice(-200);
  }
  async function enviarMensaje(store, asp, de, autor, texto) {
    const t = limpiar(texto, 2000);
    if (!t) throw err(400, 'Escribe un mensaje.');
    const msg = { _id: nuevoId('msg'), aspirante: asp._id, de, autor: limpiar(autor, 80), texto: t, fecha: ahora(), leido: false };
    await store.put('mensajes', msg);
    const c = (await store.get('conversaciones', asp._id)) || { _id: asp._id, noLeidosEquipo: 0, noLeidosAsp: 0 };
    Object.assign(c, { nombre: asp.nombre, celula: asp.celula, ultimo: msg.fecha, ultimoTexto: t.slice(0, 140), ultimoDe: de });
    if (de === 'aspirante') c.noLeidosEquipo = (c.noLeidosEquipo || 0) + 1; else c.noLeidosAsp = (c.noLeidosAsp || 0) + 1;
    await store.put('conversaciones', c);
    return msg;
  }
  async function marcarLeidos(store, aspId, deQuien) {
    const c = await store.get('conversaciones', aspId);
    const campo = deQuien === 'aspirante' ? 'noLeidosEquipo' : 'noLeidosAsp';
    if (!c || !c[campo]) return;                 // nada pendiente: no escribe en cada consulta
    const ms = (await store.find('mensajes', { aspirante: aspId })).filter(m => m.de === deQuien && !m.leido);
    for (const m of ms) { m.leido = true; await store.put('mensajes', m); }
    c[campo] = 0; await store.put('conversaciones', c);
  }
  const vistaMsg = m => ({ _id: m._id, de: m.de, autor: m.autor, texto: m.texto, fecha: m.fecha, leido: !!m.leido });

  const aspirante = {
    async boost({ store, user }) {
      const cfg = await cargarConfig(store);
      const asp = await requerirAspirante(store, user);
      const m = cfg.boost.mecanografia;
      return { mecanografia: { activa: m.activa, meta: m.meta, precisionMin: m.precisionMin, duraciones: m.duraciones, textos: m.textos,
        resultados: (asp.boost && asp.boost.mecanografia) || { mejor: null, intentos: 0, historial: [] } } };
    },
    async boostGuardar({ store, user, body }) {
      await cargarConfig(store);
      const asp = await requerirAspirante(store, user);
      if (body.actividad !== 'mecanografia') throw err(400, 'Actividad desconocida.');
      const n = (v, max) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
      const r = { fecha: ahora(), ppm: n(body.ppm, 250), precision: n(body.precision, 100), duracion: n(body.duracion, 600), errores: n(body.errores, 5000), caracteres: n(body.caracteres, 20000) };
      asp.boost = asp.boost || {};
      const b = asp.boost.mecanografia || { mejor: null, intentos: 0, historial: [] };
      b.intentos += 1;
      const record = b.mejor == null || r.ppm > b.mejor;
      if (record) { b.mejor = r.ppm; b.mejorFecha = r.fecha; }
      b.historial = [r].concat(b.historial || []).slice(0, 20);
      asp.boost.mecanografia = b;
      await store.put('aspirantes', asp);
      return { resultados: b, record };
    },
    async chat({ store, user, body }) {
      const asp = await requerirAspirante(store, user);
      await marcarLeidos(store, asp._id, 'equipo');
      return { mensajes: (await hilo(store, asp._id, body.desde)).map(vistaMsg), ahora: ahora() };
    },
    async chatEnviar({ store, user, body }) {
      const asp = await requerirAspirante(store, user);
      return { mensaje: vistaMsg(await enviarMensaje(store, asp, 'aspirante', asp.nombre, body.texto)) };
    },
    async chatNoLeidos({ store, user }) {
      const asp = await requerirAspirante(store, user);
      const c = await store.get('conversaciones', asp._id);
      return { noLeidos: (c && c.noLeidosAsp) || 0 };
    },
    async estado({ store, user }) {
      const cfg = await cargarConfig(store);
      const asp = await requerirAspirante(store, user);
      const modulos = await store.find('modulos', {});
      const ruta = construirRuta(modulos, asp, cfg.reglas);
      const conv = await store.get('conversaciones', asp._id);
      return { aspirante: vistaAspirante(asp), reglas: cfg.reglas, celulas: cfg.celulas, ruta, noLeidos: (conv && conv.noLeidosAsp) || 0, boostActivo: cfg.boost.mecanografia.activa };
    },
    async progreso({ store, user, body }) {
      const cfg = await cargarConfig(store);
      const asp = await requerirAspirante(store, user);
      const modulos = await store.find('modulos', {});
      const ruta = construirRuta(modulos, asp, cfg.reglas);
      const mod = ruta.modulos.find(m => m.lecciones.some(l => l.id === body.leccionId));
      if (!mod) throw err(404, 'Lección no encontrada.');
      if (mod.estado === 'bloqueado') throw err(403, 'Primero aprueba el módulo anterior.');
      const lec = mod.lecciones.find(l => l.id === body.leccionId);
      asp.progreso = asp.progreso || {};
      const p = asp.progreso[lec.id] || { pct: 0, completada: false };
      p.pct = Math.max(p.pct || 0, Math.min(100, Math.round(Number(body.pct) || 0)));
      if (body.completar) {
        if (lec.youtube && p.pct < cfg.reglas.porcentajeVideo) throw err(400, 'Mira al menos el ' + cfg.reglas.porcentajeVideo + '% del video para continuar.');
        p.completada = true; p.fecha = ahora();
      }
      asp.progreso[lec.id] = p;
      await store.put('aspirantes', asp);
      return { pct: p.pct, completada: p.completada, ruta: construirRuta(modulos, asp, cfg.reglas) };
    },
    async examen({ store, user, body }) {
      const cfg = await cargarConfig(store);
      const asp = await requerirAspirante(store, user);
      const modulos = await store.find('modulos', {});
      const ruta = construirRuta(modulos, asp, cfg.reglas);
      const m = ruta.modulos.find(x => x._id === body.moduloId);
      if (!m) throw err(404, 'Módulo no encontrado.');
      if (!m.examen.habilitado) throw err(403, m.estado === 'agotado' ? 'Ya usaste todos tus intentos.' : 'Completa todas las lecciones antes del examen.');
      const original = modulos.find(x => x._id === m._id);
      const preguntas = barajar(original.examen.preguntas).map(p => ({
        id: p.id, texto: p.texto, opciones: barajar(p.opciones.map((t, i) => ({ i, texto: t })))
      }));
      return { modulo: { _id: m._id, titulo: m.titulo }, preguntas, notaMinima: cfg.reglas.notaMinima, restantes: m.examen.restantes };
    },
    async enviarExamen({ store, user, body }) {
      const cfg = await cargarConfig(store);
      const asp = await requerirAspirante(store, user);
      const modulos = await store.find('modulos', {});
      const ruta = construirRuta(modulos, asp, cfg.reglas);
      const m = ruta.modulos.find(x => x._id === body.moduloId);
      if (!m || !m.examen.habilitado) throw err(403, 'Este examen no está disponible.');
      const original = modulos.find(x => x._id === m._id);
      const respuestas = body.respuestas || {};
      const sinResponder = original.examen.preguntas.filter(p => respuestas[p.id] == null).length;
      if (sinResponder) throw err(400, 'Te faltan ' + sinResponder + ' preguntas por responder.');
      const r = calificar(original.examen, respuestas);
      const aprobado = r.nota >= cfg.reglas.notaMinima;
      asp.examenes = asp.examenes || {};
      const ex = asp.examenes[m._id] || { intentos: 0, mejor: null, aprobado: false };
      ex.intentos += 1; ex.ultima = r.nota; ex.mejor = Math.max(ex.mejor == null ? 0 : ex.mejor, r.nota);
      ex.aprobado = ex.aprobado || aprobado; ex.fecha = ahora();
      asp.examenes[m._id] = ex;
      await store.put('intentos', { _id: nuevoId('int'), aspirante: asp._id, celula: asp.celula, modulo: m._id, fecha: ahora(), nota: r.nota, aprobado, detalle: r.detalle.map(d => ({ id: d.id, ok: d.ok })) });
      const rutaNueva = construirRuta(modulos, asp, cfg.reglas);
      if (rutaNueva.completo && !asp.completadoFecha) asp.completadoFecha = ahora();
      await store.put('aspirantes', asp);
      const restantes = Math.max(0, cfg.reglas.intentosMax - ex.intentos);
      const mostrarExplicacion = aprobado || restantes === 0;
      const detalle = original.examen.preguntas.map(p => {
        const d = r.detalle.find(x => x.id === p.id);
        return { id: p.id, texto: p.texto, ok: d.ok, elegida: p.opciones[d.elegida] || '',
          correcta: mostrarExplicacion ? p.opciones[p.correcta] : null, explicacion: mostrarExplicacion ? (p.explicacion || '') : null };
      });
      return { nota: r.nota, correctas: r.correctas, total: r.total, aprobado, restantes, notaMinima: cfg.reglas.notaMinima, detalle, ruta: rutaNueva };
    }
  };

  /* ---------- Acciones del administrador ---------- */
  function fila(asp, modulos, cfg) {
    const p = progresoAspirante(asp, modulos, cfg.reglas);
    return { _id: asp._id, nombre: asp.nombre, cedula: asp.cedula, email: asp.email, telefono: asp.telefono, ciudad: asp.ciudad || '', cohorte: asp.cohorte,
      usuario: asp.usuario || '', tieneClave: !!asp.hash, celula: asp.celula, celulaSugerida: asp.test ? asp.test.celulaSugerida : null, estado: estadoDe(asp), estadoTest: asp.test ? asp.test.estado : 'pendiente',
      creado: asp.creado, aprobadoFecha: asp.aprobadoFecha || null, ultimoAcceso: asp.ultimoAcceso,
      progreso: p.progreso, completo: p.completo, promedio: p.promedio, ppm: asp.boost && asp.boost.mecanografia ? asp.boost.mecanografia.mejor : null };
  }

  const admin = {
    async resumen({ store, user }) {
      const cfg = await cargarConfig(store);
      const [asps, modulos, cohortes] = await Promise.all([store.find('aspirantes', {}), store.find('modulos', {}), store.find('cohortes', {})]);
      return { celulas: cfg.celulas, reglas: cfg.reglas, cohortes, totalAspirantes: asps.length, modulos: modulos.length,
        yo: { usuario: user.usuario, nombre: user.nombre || user.usuario, perfil: user.perfil, principal: !!user.principal } };
    },
    async crearAspirante({ store, body, cripto }) {
      const cfg = await cargarConfig(store);
      const d = body.aspirante || {};
      const cedula = limpiarCedula(d.cedula), nombre = limpiar(d.nombre, 80);
      if (nombre.length < 3) throw err(400, 'Escribe nombre y apellido.');
      if (!cedula) throw err(400, 'Escribe la cédula.');
      const id = 'asp-' + cedula;
      if (await store.get('aspirantes', id)) throw err(409, 'Ya existe un registro con esa cédula. Búscalo en Postulaciones.');
      if (!d.celula || !cfg.celulas.some(c => c.id === d.celula)) throw err(400, 'Elige la célula.');
      const asp = { _id: id, cedula, nombre, email: limpiar(d.email, 120), telefono: limpiar(d.telefono, 30), ciudad: limpiar(d.ciudad, 60),
        estado: 'aprobado', creado: ahora(), aprobadoFecha: ahora(), ultimoAcceso: null, celula: d.celula,
        progreso: {}, examenes: {}, test: null, origen: 'manual', nota: limpiar(d.nota, 300) };
      await asignarAcceso(store, asp, d.usuario, d.clave, cripto);
      await store.put('aspirantes', asp);
      return { ok: true, usuario: asp.usuario };
    },
    async aspirantes({ store }) {
      const cfg = await cargarConfig(store);
      const [asps, modulos] = await Promise.all([store.find('aspirantes', {}), store.find('modulos', {})]);
      return { aspirantes: asps.map(a => fila(a, modulos, cfg)).sort((a, b) => String(b.ultimoAcceso || b.creado).localeCompare(String(a.ultimoAcceso || a.creado))) };
    },
    async aspirante({ store, body }) {
      const cfg = await cargarConfig(store);
      const asp = await store.get('aspirantes', body.id);
      if (!asp) throw err(404, 'Aspirante no encontrado.');
      const modulos = await store.find('modulos', {});
      const { hash, ...publico } = asp;
      return { aspirante: publico, resumen: fila(asp, modulos, cfg), ruta: construirRuta(modulos, asp, cfg.reglas) };
    },
    async guardarAcceso({ store, body, cripto }) {
      const cfg = await cargarConfig(store);
      const asp = await store.get('aspirantes', body.id);
      if (!asp) throw err(404, 'Aspirante no encontrado.');
      if (!body.celula || !cfg.celulas.some(c => c.id === body.celula)) throw err(400, 'Elige una célula.');
      await asignarAcceso(store, asp, body.usuario, body.clave, cripto);
      asp.celula = body.celula;
      await store.put('aspirantes', asp);
      return { ok: true, usuario: asp.usuario };
    },
    async reiniciarIntentos({ store, body }) {
      const asp = await store.get('aspirantes', body.id);
      if (!asp) throw err(404, 'Aspirante no encontrado.');
      if (asp.examenes && asp.examenes[body.moduloId]) { asp.examenes[body.moduloId].intentos = 0; }
      await store.put('aspirantes', asp);
      return { ok: true };
    },
    async aprobar({ store, body, cripto }) {
      const cfg = await cargarConfig(store);
      const asp = await store.get('aspirantes', body.id);
      if (!asp) throw err(404, 'Postulación no encontrada.');
      if (!body.celula || !cfg.celulas.some(c => c.id === body.celula)) throw err(400, 'Elige la célula del aspirante.');
      await asignarAcceso(store, asp, body.usuario, body.clave, cripto);
      Object.assign(asp, { estado: 'aprobado', celula: body.celula, aprobadoFecha: ahora() });
      await store.put('aspirantes', asp);
      return { ok: true, usuario: asp.usuario };
    },
    async cambiarEstado({ store, body }) {
      const asp = await store.get('aspirantes', body.id);
      if (!asp) throw err(404, 'Postulación no encontrada.');
      if (!['postulado', 'descartado'].includes(body.estado)) throw err(400, 'Estado no válido.');
      asp.estado = body.estado;
      if (body.estado === 'postulado') { asp.aprobadoFecha = null; if (!asp.progreso || !Object.keys(asp.progreso).length) asp.celula = asp.test ? asp.test.celulaSugerida : asp.celula; }
      await store.put('aspirantes', asp);
      return { ok: true };
    },
    async eliminarAspirante({ store, body }) { await store.del('aspirantes', body.id); return { ok: true }; },

    async preguntas({ store }) {
      await cargarConfig(store);
      return { preguntas: (await store.find('preguntas', {})).sort((a, b) => (a.orden || 0) - (b.orden || 0)) };
    },
    async guardarPregunta({ store, body }) {
      const p = body.pregunta || {};
      const texto = limpiar(p.texto, 400);
      const opciones = (p.opciones || []).map(o => ({ texto: limpiar(o.texto, 300), puntos: Object.fromEntries(Object.entries(o.puntos || {}).filter(([, v]) => Number(v)).map(([k, v]) => [k, Number(v)])) })).filter(o => o.texto);
      if (!texto) throw err(400, 'Escribe el texto de la pregunta.');
      if (opciones.length < 2) throw err(400, 'Agrega al menos dos opciones.');
      const doc = { _id: p._id || nuevoId('p'), texto, opciones, activa: p.activa !== false, orden: Number(p.orden) || 0 };
      if (!p._id) doc.orden = (await store.find('preguntas', {})).length + 1;
      await store.put('preguntas', doc);
      return { pregunta: doc };
    },
    async ordenarPreguntas({ store, body }) {
      const ids = body.ids || [];
      for (let i = 0; i < ids.length; i++) { const p = await store.get('preguntas', ids[i]); if (p) { p.orden = i + 1; await store.put('preguntas', p); } }
      return { ok: true };
    },
    async eliminarPregunta({ store, body }) { await store.del('preguntas', body.id); return { ok: true }; },

    async modulos({ store, body }) {
      await cargarConfig(store);
      const todos = await store.find('modulos', {});
      return { modulos: ordenarModulos(body.celula ? todos.filter(m => m.celula === body.celula) : todos) };
    },
    async guardarModulo({ store, body }) {
      const m = body.modulo || {};
      const titulo = limpiar(m.titulo, 120);
      if (!titulo) throw err(400, 'Escribe el título del módulo.');
      if (!m.celula) throw err(400, 'Elige la célula del módulo.');
      const lecciones = (m.lecciones || []).map(l => ({ id: l.id || nuevoId('l'), titulo: limpiar(l.titulo, 160) || 'Lección sin título', youtube: limpiar(l.youtube, 300),
        contenido: limpiar(l.contenido, 20000), imagenes: (l.imagenes || []).map(u => limpiar(u, 2000000)).filter(Boolean) }));
      const preguntas = ((m.examen && m.examen.preguntas) || []).map(p => ({ id: p.id || nuevoId('e'), texto: limpiar(p.texto, 400),
        opciones: (p.opciones || []).map(o => limpiar(o, 300)), correcta: Number(p.correcta) || 0, explicacion: limpiar(p.explicacion, 600) }));
      for (const [i, p] of preguntas.entries()) {
        if (!p.texto) throw err(400, 'La pregunta ' + (i + 1) + ' del examen no tiene texto.');
        if (p.opciones.filter(Boolean).length < 2) throw err(400, 'La pregunta ' + (i + 1) + ' necesita al menos dos opciones.');
        if (!p.opciones[p.correcta]) throw err(400, 'Marca la respuesta correcta de la pregunta ' + (i + 1) + '.');
      }
      let orden = Number(m.orden) || 0;
      if (!m._id) orden = (await store.find('modulos', {})).filter(x => x.celula === m.celula).length + 1;
      const doc = { _id: m._id || nuevoId('m'), celula: m.celula, orden, titulo, descripcion: limpiar(m.descripcion, 400), lecciones, examen: { preguntas } };
      await store.put('modulos', doc);
      return { modulo: doc };
    },
    async ordenarModulos({ store, body }) {
      const ids = body.ids || [];
      for (let i = 0; i < ids.length; i++) { const m = await store.get('modulos', ids[i]); if (m) { m.orden = i + 1; await store.put('modulos', m); } }
      return { ok: true };
    },
    async eliminarModulo({ store, body }) { await store.del('modulos', body.id); return { ok: true }; },

    async guardarCohorte({ store, body }) {
      const c = body.cohorte || {};
      const id = limpiar(c._id, 40).toUpperCase().replace(/\s+/g, '-');
      if (!/^[A-Z0-9-]{3,40}$/.test(id)) throw err(400, 'El código solo puede tener letras, números y guiones (mínimo 3).');
      const previo = await store.get('cohortes', id);
      const doc = Object.assign({ creado: ahora() }, previo || {}, { _id: id, nombre: limpiar(c.nombre, 120) || id, activa: c.activa !== false });
      await store.put('cohortes', doc);
      return { cohorte: doc };
    },
    async guardarConfig({ store, body }) {
      const cfg = await cargarConfig(store);
      if (body.reglas) {
        const r = body.reglas, n = (v, min, max) => Math.min(max, Math.max(min, Math.round(Number(v) || 0)));
        cfg.reglas = { minPuntos: n(r.minPuntos, 0, 100), margenEmpate: n(r.margenEmpate, 0, 100), notaMinima: n(r.notaMinima, 1, 100), intentosMax: n(r.intentosMax, 1, 20), porcentajeVideo: n(r.porcentajeVideo, 0, 100) };
      }
      if (body.celulas) {
        cfg.celulas = body.celulas.map(c => ({ id: limpiar(c.id, 40).toUpperCase(), nombre: limpiar(c.nombre, 60) || limpiar(c.id, 40), descripcion: limpiar(c.descripcion, 300) })).filter(c => c.id && c.id !== COMUN);
      }
      await store.put('config', cfg);
      return { celulas: cfg.celulas, reglas: cfg.reglas };
    },
    async metricas({ store }) {
      const cfg = await cargarConfig(store);
      const [asps, modulos, intentos] = await Promise.all([store.find('aspirantes', {}), store.find('modulos', {}), store.find('intentos', {})]);
      const porCelula = {};
      const aprobados = asps.filter(a => estadoDe(a) === 'aprobado');
      asps.forEach(a => { const k = a.celula || 'REVISION'; porCelula[k] = (porCelula[k] || 0) + 1; });
      const completados = aprobados.filter(a => progresoAspirante(a, modulos, cfg.reglas).completo).length;
      const porModulo = ordenarModulos(modulos).map(m => {
        const its = intentos.filter(i => i.modulo === m._id);
        const personas = new Set(its.map(i => i.aspirante));
        const aprobaron = new Set(its.filter(i => i.aprobado).map(i => i.aspirante));
        return { _id: m._id, titulo: m.titulo, celula: m.celula, intentos: its.length, personas: personas.size, aprobaron: aprobaron.size,
          promedio: its.length ? Math.round(its.reduce((s, i) => s + i.nota, 0) / its.length) : null };
      }).filter(m => m.intentos > 0);
      const fallos = {};
      intentos.forEach(i => (i.detalle || []).forEach(d => {
        const k = i.modulo + '|' + d.id; fallos[k] = fallos[k] || { modulo: i.modulo, id: d.id, total: 0, fallos: 0 };
        fallos[k].total++; if (!d.ok) fallos[k].fallos++;
      }));
      const masFalladas = Object.values(fallos).filter(f => f.fallos > 0).map(f => {
        const m = modulos.find(x => x._id === f.modulo); const p = m && m.examen.preguntas.find(x => x.id === f.id);
        return Object.assign(f, { tasa: Math.round(f.fallos * 100 / f.total), texto: p ? p.texto : '(pregunta eliminada)', moduloTitulo: m ? m.titulo : '' });
      }).sort((a, b) => b.tasa - a.tasa || b.fallos - a.fallos).slice(0, 10);
      return { total: asps.length, porRevisar: asps.filter(a => estadoDe(a) === 'postulado').length, sinCelula: asps.filter(a => estadoDe(a) === 'postulado' && !a.celula).length,
        aprobados: aprobados.length, descartados: asps.filter(a => estadoDe(a) === 'descartado').length, completados, porCelula, porModulo, masFalladas, celulas: cfg.celulas };
    },

    /* ----- Equipo del panel ----- */
    async usuarios({ store }) {
      const us = await store.find('usuarios', {});
      return { usuarios: us.map(vistaUsuario).sort((a, b) => a.usuario.localeCompare(b.usuario)) };
    },
    async guardarUsuario({ store, body, user, cripto }) {
      const u = body.usuario || {};
      const id = limpiarUsuario(u.usuario);
      if (!/^[a-z0-9._-]{3,30}$/.test(id)) throw err(400, 'El usuario debe tener de 3 a 30 caracteres: letras, números, punto, guion o guion bajo.');
      if (!PERFILES[u.perfil]) throw err(400, 'Elige un rol.');
      const previo = await store.get('usuarios', id);
      if (u.nuevo && previo) throw err(409, 'Ya existe un usuario con ese nombre.');
      if (u.nuevo && (await store.find('aspirantes', { usuario: id })).length) throw err(409, 'Ese nombre de usuario ya lo tiene un aspirante. Elige otro.');
      if (!u.nuevo && !previo) throw err(404, 'Usuario no encontrado.');
      if (user.cuenta === id && (u.perfil !== 'admin' || u.activo === false)) throw err(400, 'No puedes quitarte tu propio rol de admin ni desactivarte.');
      const doc = Object.assign({ creado: ahora(), creadoPor: user.usuario }, previo || {}, {
        _id: id, nombre: limpiar(u.nombre, 80) || id, perfil: u.perfil, activo: u.activo !== false, actualizado: ahora() });
      if (u.clave) {
        if (String(u.clave).length < 8) throw err(400, 'La clave debe tener al menos 8 caracteres.');
        doc.hash = await cripto.hash(String(u.clave));
      } else if (!previo) throw err(400, 'Escribe una clave para el usuario nuevo.');
      await store.put('usuarios', doc);
      return { usuario: vistaUsuario(doc) };
    },
    async eliminarUsuario({ store, body, user }) {
      const id = limpiarUsuario(body.id);
      if (user.cuenta === id) throw err(400, 'No puedes eliminar tu propio usuario.');
      await store.del('usuarios', id);
      return { ok: true };
    },
    /* ----- Boost ----- */
    async boostConfig({ store }) {
      const cfg = await cargarConfig(store);
      return { boost: cfg.boost };
    },
    async guardarBoost({ store, body }) {
      const cfg = await cargarConfig(store);
      const m = body.mecanografia || {};
      const textos = (m.textos || []).map(t => limpiar(t, 1500).replace(/\s+/g, ' ')).filter(t => t.length >= 40);
      if (!textos.length) throw err(400, 'Agrega al menos un texto de práctica (mínimo 40 caracteres).');
      const dur = (m.duraciones || []).map(Number).filter(d => [30, 60, 120, 180, 300].includes(d));
      if (!dur.length) throw err(400, 'Elige al menos una duración.');
      cfg.boost.mecanografia = { activa: m.activa !== false, meta: Math.max(5, Math.min(150, Math.round(Number(m.meta) || 40))),
        precisionMin: Math.max(50, Math.min(100, Math.round(Number(m.precisionMin) || 95))), duraciones: dur.sort((a, b) => a - b), textos };
      await store.put('config', cfg);
      return { boost: cfg.boost };
    },

    /* ----- Assessment (chat) ----- */
    async chats({ store }) {
      const [convs, asps] = await Promise.all([store.find('conversaciones', {}), store.find('aspirantes', {})]);
      const porId = Object.fromEntries(convs.map(c => [c._id, c]));
      const lista = asps.filter(a => estadoDe(a) === 'aprobado' || porId[a._id]).map(a => {
        const c = porId[a._id] || {};
        return { id: a._id, nombre: a.nombre, celula: a.celula, usuario: a.usuario || '', estado: estadoDe(a), ultimo: c.ultimo || null, ultimoTexto: c.ultimoTexto || '', ultimoDe: c.ultimoDe || null, noLeidos: c.noLeidosEquipo || 0 };
      }).sort((x, y) => String(y.ultimo || '').localeCompare(String(x.ultimo || '')) || x.nombre.localeCompare(y.nombre));
      return { chats: lista, noLeidos: lista.reduce((t, c) => t + c.noLeidos, 0) };
    },
    async chatHilo({ store, body }) {
      const asp = await store.get('aspirantes', body.id);
      if (!asp) throw err(404, 'Aspirante no encontrado.');
      await marcarLeidos(store, asp._id, 'aspirante');
      return { mensajes: (await hilo(store, asp._id, body.desde)).map(vistaMsg), ahora: ahora() };
    },
    async chatEliminar({ store, body }) {
      const id = String(body.id || '');
      const ms = await store.find('mensajes', { aspirante: id });
      for (const m of ms) await store.del('mensajes', m._id);
      await store.del('conversaciones', id);
      return { ok: true, eliminados: ms.length };
    },
    async chatResponder({ store, body, user }) {
      const asp = await store.get('aspirantes', body.id);
      if (!asp) throw err(404, 'Aspirante no encontrado.');
      return { mensaje: vistaMsg(await enviarMensaje(store, asp, 'equipo', user.nombre || user.usuario, body.texto)) };
    },

    async cambiarMiClave({ store, body, user, cripto }) {
      if (user.principal) throw err(400, 'La clave de la cuenta principal se cambia en Vercel (variable ADMIN_PASS).');
      const u = await store.get('usuarios', user.cuenta);
      if (!u || !(await cripto.verificar(String(body.actual || ''), u.hash))) throw err(400, 'Tu clave actual no es correcta.');
      if (String(body.nueva || '').length < 8) throw err(400, 'La clave nueva debe tener al menos 8 caracteres.');
      u.hash = await cripto.hash(String(body.nueva)); u.actualizado = ahora();
      await store.put('usuarios', u);
      return { ok: true };
    }
  };

  /* ---------- Roles del panel ---------- */
  const PERFILES = {
    admin: { nombre: 'Admin', acciones: '*' },
    reclutador: { nombre: 'Reclutador', acciones: ['resumen', 'aspirantes', 'aspirante', 'aprobar', 'cambiarEstado', 'guardarAcceso', 'reiniciarIntentos', 'crearAspirante', 'guardarCohorte', 'metricas', 'cambiarMiClave', 'chats', 'chatHilo', 'chatResponder', 'chatEliminar'] },
    calidad: { nombre: 'Calidad', acciones: ['resumen', 'aspirantes', 'aspirante', 'metricas', 'cambiarMiClave', 'chats', 'chatHilo', 'chatResponder'] }
  };
  const limpiarUsuario = u => limpiar(u, 30).toLowerCase();
  function vistaUsuario(u) { return { usuario: u._id, nombre: u.nombre, perfil: u.perfil, activo: u.activo !== false, creado: u.creado, ultimoAcceso: u.ultimoAcceso || null }; }

  // Inicio de sesión único: equipo del panel o aspirante, según quién sea el usuario.
  // esPrincipal(usuario, clave) valida la cuenta principal (variables de Vercel).
  async function iniciarSesion(store, body, cripto, esPrincipal) {
    const usuario = limpiarUsuario(body.usuario), clave = String(body.clave || '');
    if (!usuario || !clave) throw err(400, 'Escribe tu usuario y tu contraseña.');
    if (esPrincipal(String(body.usuario || '').trim(), clave)) return { tipo: 'admin', sesion: { rol: 'admin', usuario: String(body.usuario).trim() } };
    if (await store.get('usuarios', usuario)) return { tipo: 'admin', sesion: await loginAdmin(store, body, cripto) };
    const asp = await loginAspirante(store, body, cripto);
    return { tipo: 'aspirante', sesion: { rol: 'aspirante', id: asp._id }, aspirante: asp };
  }

  // Login de cuentas creadas en el panel (la cuenta principal se valida aparte, con ADMIN_USER / ADMIN_PASS)
  async function loginAdmin(store, body, cripto) {
    const id = limpiarUsuario(body.usuario);
    const u = id && await store.get('usuarios', id);
    if (!u || u.activo === false || !(await cripto.verificar(String(body.clave || ''), u.hash))) throw err(401, 'Usuario o contraseña incorrectos.');
    u.ultimoAcceso = ahora();
    await store.put('usuarios', u);
    return { rol: 'admin', usuario: u._id, nombre: u.nombre, perfil: u.perfil, cuenta: u._id };
  }

  /* ---------- Despachador ---------- */
  async function ejecutar(grupo, accion, ctx) {
    const tabla = grupo === 'admin' ? admin : grupo === 'publico' ? publico : aspirante;
    if (!Object.prototype.hasOwnProperty.call(tabla, accion)) throw err(400, 'Acción desconocida: ' + accion);
    if (grupo === 'admin') {
      const user = ctx.user || {};
      if (user.cuenta) {                       // cuenta del panel: se revalida en cada llamada (rol actual, activa)
        const u = await ctx.store.get('usuarios', user.cuenta);
        if (!u || u.activo === false) throw err(401, 'Tu acceso al panel fue desactivado.');
        ctx.user = Object.assign({}, user, { perfil: u.perfil, nombre: u.nombre });
      } else {
        ctx.user = Object.assign({}, user, { perfil: 'admin', principal: true });
      }
      const p = PERFILES[ctx.user.perfil];
      if (!p || (p.acciones !== '*' && !p.acciones.includes(accion))) throw err(403, 'Tu rol (' + (p ? p.nombre : ctx.user.perfil) + ') no tiene permiso para esto.');
    }
    return tabla[accion](ctx);
  }

  const H = { COMUN, CELULAS_DEFAULT, REGLAS_DEFAULT, err, nuevoId, cargarConfig, calcularCelula, construirRuta, calificar, loginAspirante, loginAdmin, iniciarSesion, vistaAspirante, estadoDe, PERFILES, ejecutar };
  if (typeof module !== 'undefined' && module.exports) module.exports = H; else root.ElxHandlers = H;
})(typeof window !== 'undefined' ? window : globalThis);
