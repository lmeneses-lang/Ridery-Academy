/* ============================================================
   Ridery Academy · Lógica compartida
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

  /* ---------- Formulario de Postúlate ----------
     Secciones (una página cada una) y preguntas. Tipos de pregunta:
       unica     · elige una opción          multiple · marca varias
       corta     · texto de una línea        larga    · texto largo (prueba escrita)
     Cada opción puede tener:
       puntos   { CÉLULA: n } → suma para sugerir la célula
       correcta true         → la pregunta cuenta para la nota de casos
       filtro   'alerta' (marca en rojo) | 'descarta' (descarta automáticamente)
       exclusiva true        → en "multiple", al marcarla se desmarcan las demás */
  const TIPOS = { unica: 'Una opción', multiple: 'Varias opciones', corta: 'Respuesta corta', larga: 'Respuesta larga' };
  // Sección a la que pasan las preguntas antiguas que no tenían sección
  const SECCION_ANTIGUA = { id: 'afinidad', titulo: 'Tu estilo de trabajo', descripcion: 'Con esto vemos en qué célula encajas mejor. No hay respuestas buenas ni malas.' };
  // Las preguntas NO viven en el código: se crean en el panel (Formulario) o se importan desde un archivo .json.
  const FORMATO_ARCHIVO = 'ridery-academy-formulario';

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

  /* ---------- Evaluación de la capacitación (la llena Admin desde AdminCX) ----------
     Solo selección: nada de texto libre, para que sea rápida y comparable.
     tipo 'unica' (una opción) o 'multiple' (varias). Se pueden reemplazar
     desde AdminCX (guardarCapacitacionPreguntas) y quedan en config.capacitacion. */
  const EVAL_CAP_DEFAULT = [
    { id: 'atencion', texto: '¿Prestó atención?', tipo: 'unica', opciones: ['Sí', 'Más o menos', 'No'] },
    { id: 'participacion', texto: '¿Participó en la sesión?', tipo: 'unica', opciones: ['Sí, bastante', 'Poco', 'No participó'] },
    { id: 'comprension', texto: '¿Entendió los procesos que se vieron?', tipo: 'unica', opciones: ['Sí', 'En parte', 'No'] },
    { id: 'dificultad', texto: '¿En qué se le dificultó?', tipo: 'multiple', opciones: ['Nada', 'Zendesk y herramientas', 'Redacción', 'Velocidad al escribir', 'Políticas y procesos', 'Conexión o equipo'], exclusiva: 0 },
    { id: 'puntualidad', texto: '¿Llegó a tiempo?', tipo: 'unica', opciones: ['A tiempo', 'Tarde', 'No se conectó'] },
    { id: 'camara', texto: '¿Estuvo con la cámara encendida?', tipo: 'unica', opciones: ['Sí', 'A ratos', 'No'] },
    { id: 'recomendacion', texto: '¿Sigue en el proceso?', tipo: 'unica', opciones: ['Sí', 'Sí, con seguimiento', 'No'] }
  ];

  /* ---------- Boost: actividades para mejorar cuellos de botella ---------- */
  // Actividades de Boost además de Mecanografía (el contenido está en js/boost-contenido.js)
  const BOOST_ACTIVIDADES = {
    ruta: { nombre: '¿Dónde lo busco?', categoria: 'Memoria y navegación', descripcion: 'Te damos un caso y eliges la herramienta y la ruta exacta para resolverlo.' },
    pares: { nombre: 'Pares de memoria', categoria: 'Memoria y navegación', descripcion: 'Voltea tarjetas y une cada término con su significado.' },
    flash: { nombre: 'Flash de procesos', categoria: 'Memoria y navegación', descripcion: 'Mira un protocolo por 20 segundos y ordénalo de memoria.' },
    redaccion: { nombre: 'Redacción', categoria: 'Escritura', descripcion: 'Reescribe mensajes mal escritos para que suenen claros y profesionales.' },
    minuto: { nombre: 'Respuesta en 1 minuto', categoria: 'Escritura', descripcion: 'Contesta un caso contra reloj con saludo, solución y cierre.' },
    esto: { nombre: '¿Esto o esto?', categoria: 'Empatía y criterio', descripcion: 'Elige la mejor respuesta para cada cliente y descubre por qué.' },
    frases: { nombre: 'Frases prohibidas', categoria: 'Empatía y criterio', descripcion: 'Marca las frases que un agente de Ridery nunca debe decir.' },
    triage: { nombre: 'Triage de prioridades', categoria: 'Empatía y criterio', descripcion: 'Llegan varios casos a la vez: ordénalos por prioridad.' },
    tono: { nombre: 'Tono del cliente', categoria: 'Empatía y criterio', descripcion: 'Lee el mensaje y reconoce cómo se siente el cliente.' }
  };
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
  /* ---------- Simulador de tickets (Assessment) ----------
     Simula la bandeja de Zendesk con casos reales de la célula. Los tickets llegan
     en ráfaga; en cada turno la persona elige una respuesta sugerida o escribe la
     suya («Otro», que queda pendiente de revisión por Calidad).
     Cada opción: t (texto) · v ('buena' | 'regular' | 'mala') · r (respuesta del
     cliente) · h (cambio de humor del cliente). Lo que es correcto NUNCA sale del
     servidor: el aspirante solo ve los textos.
     Los casos de ejemplo salen del material de apoyo de ORDERS en AdminCX
     (Zupper by Ridery). Se reemplazan desde el panel: Simulador → Casos (archivo .json). */
  const SIM_FORMATO = 'ridery-academy-simulador';
  const SIM_PUNTOS = { buena: 2, regular: 1, mala: 0 };
  const SIM_HUMOR = ['Crítico', 'Muy negativo', 'Negativo', 'Neutral', 'Positivo'];
  const SIM_MOTIVOS_DEFAULT = [
    'Orders : Retraso en la entrega', 'Orders : Pedido incompleto', 'Orders : Pedido incorrecto', 'Orders : Pedido en mal estado',
    'Orders : Pedido no llegó', 'Orders : Cambio de dirección', 'Orders : Pago no reflejado', 'Orders : Cancelación de orden', 'Orders : Producto agotado',
    'Otro : Fuera de alcance (transferir)'
  ];
  // op(v, t, r, h, salto): salto = 'idPaso' (la conversación sigue por esa rama) o 'fin' (el cliente se va)
  const op = (v, t, r, h, salto) => Object.assign({ v, t, r: [].concat(r || []), h: h || 0 }, salto === 'fin' ? { fin: true } : salto ? { ir: salto } : {});
  const SIM_CASOS_DEFAULT = [
    { id: 'ord-retraso', celula: 'ORDERS', activo: true, llegada: 0, humor: 2, asunto: 'Pedido con más de 1 hora de retraso', consulta: { herramienta: 'zupper', id: '0BE-0000371' },
      cliente: { nombre: 'Andreína Pérez', telefono: '+584142215870', notas: 'Usuario: 208114 Andreína Pérez' },
      motivo: 'Orders : Retraso en la entrega',
      pasos: [
        { cliente: ['Buenas, mi pedido tiene más de una hora y nada', 'Ya pagué y en la app sigue igual'],
          opciones: [
            op('buena', '¡Hola, Andreína! Gracias por escribirnos y lamento la espera. ¿Me compartes el número de tu orden para revisarla ya mismo?', 'Sí, es la 0BE-0000371. Tengo hambre y ya pagué 😩', 1),
            op('regular', 'Buenas tardes. Indíqueme su número de orden, por favor.', 'Es el 0BE-0000371, sale ahí mismo en la app. Llevo más de una hora esperando', -1),
            op('mala', 'hola q paso', ['¿En serio? Llevo una hora esperando y me escriben así.', 'Quiero hablar con un supervisor.'], -2, 'supervisor')
          ], otro: ['Es la orden 0BE-0000371. ¿Qué pasa con mi pedido?'] },
        { id: 'revision', verificar: true, cliente: [],
          opciones: [
            op('buena', 'Ya verifiqué: tu pedido sigue en preparación en Sushi Express. Me comuniqué con el local para darle prioridad. ¿Prefieres esperar a que salga o que cancelemos la orden con reembolso total?', 'Si me dicen cuánto falta espero, si no cancélenla', 1),
            op('regular', 'Voy a cancelar la orden y le hago el reembolso.', '¿Y por qué la cancelas sin preguntarme? Yo lo que quería era mi comida', -1),
            op('mala', 'Es que hay mucho tráfico y no tenemos suficientes repartidores, debe tener paciencia.', 'Ni siquiera ha salido del local, ¿cuál tráfico? 😡', -2),
            op('mala', 'Su pedido ya está en camino, ya casi le llega.', 'En la app dice que está en preparación… ¿me están mintiendo?', -2)
          ], otro: ['Ajá, ¿y cuánto falta?'] },
        { cliente: [],
          opciones: [
            op('buena', 'El local me confirma que sale en 10 minutos y ya tiene repartidor asignado. Además te dejamos un cupón de compensación por la espera. Te aviso apenas el repartidor lo retire.', 'Perfecto, gracias por la ayuda 🙏', 2),
            op('regular', 'Ok, le aviso cuando salga.', 'Bueno…', 0),
            op('mala', 'Ya no podemos hacer nada más, el responsable es el comercio.', 'Pésimo servicio. No vuelvo a pedir.', -2)
          ], otro: ['Ok, quedo atenta.'] },
        // Rama: si el saludo fue malo, el cliente pide un supervisor
        { id: 'supervisor', rama: true, cliente: [],
          opciones: [
            op('buena', 'Entiendo tu molestia, Andreína, y te pido disculpas. Soy yo quien te va a ayudar ahora mismo: ¿me compartes el número de tu orden?', 'Ok… es la 0BE-0000371', 1, 'revision'),
            op('regular', 'Ya le paso su caso a un supervisor.', 'Ok, espero… pero rápido. Es la orden 0BE-0000371', 0, 'revision'),
            op('mala', 'No hay supervisores disponibles.', 'Entonces no me sirven para nada. Chao.', -2, 'fin')
          ], otro: ['Es la orden 0BE-0000371'] }
      ] },
    { id: 'ord-incompleto', celula: 'ORDERS', activo: true, llegada: 15, humor: 3, asunto: 'Falta un producto en mi pedido',
      cliente: { nombre: 'Carlos Rivas', telefono: '+584241187733', notas: 'Usuario: 195530 Carlos Rivas' },
      motivo: 'Orders : Pedido incompleto',
      pasos: [
        { cliente: ['Hola, me llegó el pedido pero falta el refresco de 2 litros'],
          opciones: [
            op('buena', 'Hola, Carlos. Lamento que falte un producto en tu orden. Regálame 2 minutos mientras me comunico con el comercio para verificar la comanda de tu pedido.', 'Dale, espero', 1),
            op('regular', 'Hola. Envíeme una foto de la bolsa para validar.', ['[foto] Bolsa del pedido con harina y arroz, sin el refresco', '¿Una foto de qué? Si lo que falta no está en la bolsa 🙄'], -1),
            op('mala', 'Seguro el repartidor se lo tomó jaja', '¿Es en serio? Quiero mi refresco o mi dinero.', -2)
          ], otro: ['Ok'] },
        { cliente: [],
          opciones: [
            op('buena', 'El comercio confirmó que el refresco no se incluyó. Ya te reintegré $2,50 (el valor exacto del producto) como ZupperCredits en tu cuenta para tu próxima compra.', 'Ah ok, ¿y eso dónde lo veo?', 1),
            op('mala', 'Le vamos a reenviar el refresco ahora mismo con otro repartidor.', 'Ok, ¿en cuánto llega?', 1),
            op('mala', 'Le reembolso el total de la orden por las molestias.', '¡Epa, gracias!', 2)
          ], otro: ['¿Y entonces cómo queda eso?'] },
        { cliente: [],
          opciones: [
            op('buena', 'Lo ves en la app, en tu perfil › ZupperCredits, y se aplica solo en tu próximo pedido. ¿Te puedo ayudar con algo más?', 'No, eso es todo. Gracias', 1),
            op('regular', 'En la app.', 'Ok', 0),
            op('mala', 'No sé, revise usted en la app.', 'Qué mala atención, de verdad.', -2)
          ], otro: ['Listo, gracias.'] }
      ] },
    { id: 'ord-pago', celula: 'ORDERS', activo: true, llegada: 40, humor: 3, asunto: 'Pagué y la orden sigue sin pagar',
      cliente: { nombre: 'Mariana Gómez', telefono: '+584129904412', notas: 'Usuario: 211907 Mariana Gómez' },
      motivo: 'Orders : Pago no reflejado',
      pasos: [
        { cliente: ['Buenas tardes', 'Hice el pago móvil hace 20 minutos y la orden sigue diciendo que no está pagada'],
          opciones: [
            op('buena', 'Hola, Mariana. Con gusto lo reviso. ¿Me compartes los últimos 6 dígitos de la referencia del pago móvil?', 'Sí, 482913', 1),
            op('regular', 'Hola. Espere a que se refleje, a veces tarda.', 'Ya van 20 minutos, y el local cierra pronto…', -1),
            op('mala', 'Mándeme una foto de su cédula y el capture del banco.', '¿Mi cédula para qué? Solo quiero que se pague mi pedido.', -1)
          ], otro: ['La referencia es 482913'] },
        { cliente: [],
          opciones: [
            op('buena', 'Gracias. Ubiqué tu pago con la referencia 482913 y ya lo apliqué a tu orden: ahora aparece como pagada y el comercio la va a empezar a preparar.', '¡Listo, ya me salió! Gracias 🙌', 2),
            op('regular', 'Le paso el caso al equipo de pagos, le responden en 24 a 48 horas.', '¿48 horas? Era mi almuerzo de hoy', -1),
            op('mala', 'Le recomiendo crear una orden nueva y volver a pagar.', '¿Pagar dos veces? No, gracias.', -2)
          ], otro: ['Ok, ¿ya quedó?'] }
      ] },
    { id: 'ord-mal-estado', celula: 'ORDERS', activo: true, llegada: 70, humor: 2, asunto: 'Mi pedido llegó regado',
      cliente: { nombre: 'José Hernández', telefono: '+584160032291', notas: 'Usuario: 187644 José Hernández' },
      motivo: 'Orders : Pedido en mal estado',
      pasos: [
        { cliente: ['Me llegó la sopa toda regada en la bolsa', 'No se puede ni comer'],
          opciones: [
            op('buena', 'Hola, José. Lamento mucho lo ocurrido con tu pedido. Para darte una solución inmediata, ¿me compartes una foto de cómo recibiste el producto?', ['[foto] Envase de sopa volteado dentro del bolso térmico; la tapa sigue cerrada', 'Mira, el envase venía volteado dentro del bolso, la tapa estaba bien cerrada'], 1),
            op('regular', 'Hola, ¿qué pasó exactamente?', 'Ya te dije, llegó regada. ¿No leíste?', -1),
            op('mala', 'Eso pasa a veces con las sopas, la próxima vez pida otra cosa.', 'Increíble. Quiero mi reembolso ya.', -2)
          ], otro: ['[foto] Envase de sopa volteado dentro del bolso térmico; la tapa sigue cerrada'] },
        { cliente: [],
          opciones: [
            op('buena', 'Gracias por la foto. Se ve que el envase venía bien sellado pero se volteó en el traslado. Te procesé el reembolso total de la sopa ($8,00) y te dejo un cupón de 10% OFF para tu próxima compra.', 'Bueno, al menos me lo devuelven. Gracias', 2),
            op('regular', 'Voy a reclamarle al restaurante para que le devuelva el dinero.', 'Ok… pero el restaurante no tiene la culpa, fue el motorizado', 0),
            op('mala', 'Por la foto no se puede validar nada, no aplica reembolso.', '¿¡Cómo que no!? Se ve clarito.', -2)
          ], otro: ['Ok, ¿y entonces?'] }
      ] },
    { id: 'ord-direccion', celula: 'ORDERS', activo: true, llegada: 95, humor: 3, asunto: 'Necesito cambiar la dirección',
      cliente: { nombre: 'Daniela Suárez', telefono: '+584143378120', notas: 'Usuario: 214522 Daniela Suárez' },
      motivo: 'Orders : Cambio de dirección',
      pasos: [
        { cliente: ['Hola!! Me equivoqué de dirección', 'Es en Los Palos Grandes, no en Altamira'],
          opciones: [
            op('buena', 'Hola, Daniela. Claro, te ayudo. ¿Me confirmas la dirección exacta con un punto de referencia?', 'Av. Andrés Bello, edificio Miramar, al lado de la panadería', 1),
            op('regular', 'Ok, ya la cambio.', '¿No necesitas la dirección completa?', 0),
            op('mala', 'No se puede cambiar la dirección una vez hecha la orden.', '¿Y entonces qué hago? ¿Pierdo mi comida?', -2)
          ], otro: ['Es en la Av. Andrés Bello, edificio Miramar'] },
        { cliente: [],
          opciones: [
            op('buena', 'Listo. Como el repartidor ya va en camino, el cambio suma 1,8 km más y eso tiene un recargo de $1,20. ¿Estás de acuerdo para actualizar la dirección?', 'Sí, dale, no hay problema', 1),
            op('regular', 'Ya le dije al repartidor que vaya a la nueva dirección.', '¡Gracias!', 1),
            op('mala', 'Le cancelo la orden y la vuelve a pedir con la dirección correcta.', '¿Cancelar? Pero si ya pagué y ya viene en camino.', -2)
          ], otro: ['Ok'] },
        { cliente: [],
          opciones: [
            op('buena', 'Perfecto, ya actualicé la dirección y el repartidor va hacia Los Palos Grandes. Llegada estimada: 12 minutos.', 'Excelente 👍', 1),
            op('regular', 'Listo.', 'ok', 0),
            op('regular', 'Ya, cualquier cosa me escribe otra vez.', 'Ok…', -1)
          ], otro: ['Gracias'] }
      ] },
    { id: 'ord-no-llego', celula: 'ORDERS', activo: true, consulta: { herramienta: 'zupper', id: '1D5-0000455' }, llegada: 125, humor: 1, asunto: 'Dice entregado y no me llegó',
      cliente: { nombre: 'Luisa Fernández', telefono: '+584125561047', notas: 'Usuario: 176201 Luisa Fernández' },
      motivo: 'Orders : Pedido no llegó',
      pasos: [
        { cliente: ['La app dice que mi pedido fue ENTREGADO y yo no he recibido NADA', 'Esto es una estafa'],
          opciones: [
            op('buena', 'Hola, Luisa. Entiendo tu molestia. Ya mismo reviso qué pasó con tu pedido #1D5-0000455 y me comunico con el repartidor.', 'Por favor, porque ya pagué y nada', 1),
            op('regular', 'Verifique bien, a veces lo dejan en recepción.', 'Ya bajé a recepción, no hay nada.', -1),
            op('mala', 'En el sistema sale entregado, así que sí le llegó.', '¿Me estás llamando mentirosa?', -2, 'aclarar')
          ], otro: ['Ajá, ¿y qué van a hacer?'] },
        { id: 'repartidor', verificar: true, cliente: [],
          opciones: [
            op('buena', 'Intenté comunicarme dos veces con el repartidor y no responde. Para no hacerte esperar más, ya procesé el reembolso total de tu orden ($14,50) a tu método de pago original. Nosotros nos encargamos internamente con el repartidor.', 'Ok, gracias por resolver rápido', 2),
            op('regular', 'Le doy ZupperCredits por el monto para su próxima compra.', 'Yo no quiero créditos, quiero mi dinero.', -1),
            op('mala', 'Espere un rato más, el repartidor debe estar por llegar.', '¡Dice ENTREGADO! ¿Cómo que por llegar?', -2)
          ], otro: ['¿Y mi dinero?'] },
        { id: 'aclarar', rama: true, cliente: [],
          opciones: [
            op('buena', 'Disculpa, Luisa, no quise decir eso. Ya me comunico con el repartidor para saber qué pasó con tu pedido.', 'Ok, por favor', 1, 'repartidor'),
            op('mala', 'El sistema no se equivoca, señora.', 'Voy a poner una queja. Chao.', -2, 'fin')
          ], otro: ['Ok…'] }
      ] },
    { id: 'ord-sin-respuesta', celula: 'ORDERS', activo: true, llegada: 150, humor: 3, asunto: 'Pago no se refleja', estados: ['sin-respuesta'],
      cliente: { nombre: 'Roberto Salas', telefono: '+584147730918', notas: 'Usuario: 219340 Roberto Salas' },
      motivo: 'Orders : Pago no reflejado',
      pasos: [
        { cliente: ['Hola, hice un pago y no aparece'],
          opciones: [
            op('buena', 'Hola, Roberto. Con gusto lo reviso. ¿Me compartes el número de tu orden y los últimos 6 dígitos de la referencia del pago?', [], 0),
            op('regular', 'Hola. ¿Qué pago?', [], -1),
            op('mala', 'Los pagos tardan, espere.', [], -1)
          ], otro: [] }
      ] },
    { id: 'fx-conductor-pago', celula: 'ORDERS', activo: true, llegada: 55, humor: 2, asunto: 'Conductor: no me llegó el pago semanal', estados: ['abierto'], fueraDeAlcance: true,
      cliente: { nombre: 'Pedro Villegas', telefono: '+584246651203', notas: 'Conductor: 98231 Pedro Villegas' },
      motivo: 'Otro : Fuera de alcance (transferir)',
      pasos: [
        { cliente: ['Buenas, soy conductor de Ridery', 'No me ha llegado el pago de la semana, ¿qué pasó?'],
          opciones: [
            op('buena', 'Hola, Pedro. Gracias por escribirnos. Este canal atiende pedidos de Zupper; ya transfiero tu caso al equipo de Pagos a conductores para que te ayuden con tu pago semanal.', 'Ok, gracias. Quedo atento', 1),
            op('mala', 'Los pagos a conductores se hacen los viernes, debe esperar.', 'Hoy es viernes y no me ha llegado nada…', -1),
            op('mala', 'Envíeme su cédula y su número de cuenta para revisarlo.', '¿Mi número de cuenta por aquí? Ok… es la 0102…', -1)
          ], otro: ['Ok'] }
      ] },
    { id: 'fx-viaje-cobro', celula: 'ORDERS', activo: true, llegada: 105, humor: 2, asunto: 'Me cobraron un viaje de más', estados: ['abierto'], fueraDeAlcance: true,
      cliente: { nombre: 'Gabriela Pinto', telefono: '+584129908871', notas: 'Usuario: 160447 Gabriela Pinto' },
      motivo: 'Otro : Fuera de alcance (transferir)',
      pasos: [
        { cliente: ['Hola, ayer tomé un viaje de Chacao a Bello Monte y me cobraron casi el doble de lo que decía la app'],
          opciones: [
            op('buena', 'Hola, Gabriela. Lamento el inconveniente. Este canal es de pedidos Zupper, así que ya transfiero tu caso al equipo de Viajes para que revisen el cobro de tu viaje.', 'Bueno, gracias', 1),
            op('mala', 'Ya te reembolso la diferencia en ZupperCredits.', '¿ZupperCredits? Yo no pedí comida, fue un viaje', -1),
            op('regular', 'Eso pasa por la tarifa dinámica, es normal.', 'Pero la app me mostró otro precio al pedirlo…', -1)
          ], otro: ['Ok'] }
      ] }
  ];


  /* Estatus del ticket (como el botón «Enviar como…» de Zendesk). Abierto deja el ticket en tu bandeja;
     los demás lo sacan. Cada caso dice en «estados» cuál(es) son correctos (por defecto: resuelto). */
  const SIM_ESTADOS_TICKET = { abierto: 'Abierto', pendiente: 'PENDIENTE', 'sin-respuesta': 'Aún no recibimos respuesta', resuelto: 'Resuelto' };

  /* Niveles: el aspirante empieza en Básico y desbloquea el siguiente al terminar el anterior.
     maxAbiertos > 0 → los tickets llegan de forma progresiva (nunca más de N abiertos a la vez);
     maxAbiertos = 0 → llegan por tiempo («llegada» de cada caso), como en un pico real. */
  const SIM_NIVELES_DEFAULT = [
    { id: 'basico', ruta: 'ORDERS', nombre: 'Básico', descripcion: 'Un ticket a la vez para que te adaptes a Zendesk. Sin panel de órdenes.', minutos: 15, maxAbiertos: 1, intervalo: 8, abandono: 240, panel: false, estados: false,
      casos: ['ord-incompleto', 'ord-pago', 'ord-direccion'] },
    { id: 'intermedio', ruta: 'ORDERS', nombre: 'Intermedio', descripcion: 'Hasta 2 tickets a la vez, Panel de órdenes y estatus del ticket. Aparece un caso que no es de Orders.', minutos: 20, maxAbiertos: 2, intervalo: 10, abandono: 180, panel: true, estados: true,
      casos: ['ord-incompleto', 'ord-retraso', 'ord-pago', 'fx-conductor-pago', 'ord-mal-estado', 'ord-sin-respuesta'] },
    { id: 'avanzado', ruta: 'ORDERS', nombre: 'Realidad', descripcion: 'Como un pico real: los tickets llegan por tiempo aunque no hayas terminado los anteriores, y el panel no se detiene.', minutos: 25, maxAbiertos: 0, intervalo: 0, abandono: 120, panel: true, estados: true,
      casos: ['ord-retraso', 'ord-incompleto', 'ord-pago', 'fx-conductor-pago', 'ord-mal-estado', 'ord-direccion', 'fx-viaje-cobro', 'ord-no-llego', 'ord-sin-respuesta'] }
,
    { id: 'viajes-basico', ruta: 'VIAJES', adminModulos: ['trips'], nombre: 'Básico', descripcion: 'Un ticket a la vez. Aprende a buscar viajes en el Admin: Waiting, Running y Completed Requests, detalle y mensajes.', minutos: 15, maxAbiertos: 1, intervalo: 8, abandono: 240, herramientas: ['admin'], estados: false,
      casos: ['via-no-lo-veo', 'via-objeto', 'via-cobro'] },
    { id: 'viajes-intermedio', ruta: 'VIAJES', adminModulos: ['trips'], nombre: 'Intermedio', descripcion: 'Hasta 2 tickets a la vez y estatus del ticket. Incluye un viaje viejo que solo aparece en «Trip History» y un caso que no es de viajes.', minutos: 20, maxAbiertos: 2, intervalo: 10, abandono: 180, herramientas: ['admin'], estados: true,
      casos: ['via-cobro', 'via-no-lo-veo', 'via-deuda', 'fx-pedido-zupper', 'via-objeto'] },
    { id: 'viajes-avanzado', ruta: 'VIAJES', adminModulos: ['trips'], nombre: 'Realidad', descripcion: 'Como un pico real: los tickets llegan por tiempo aunque no hayas terminado los anteriores.', minutos: 20, maxAbiertos: 0, intervalo: 0, abandono: 120, herramientas: ['admin'], estados: true,
      casos: ['via-cobro', 'via-no-lo-veo', 'via-deuda', 'fx-pedido-zupper', 'via-objeto'] }
  ];
  const SIM_RUTAS = { ORDERS: 'Orders · Zendesk + Panel Zupper', VIAJES: 'Viajes · Zendesk + Admin' };
  const herramientasDe = n => n.herramientas || (n.panel ? ['zupper'] : []);

  /* Panel de órdenes (igual al Panel Zupper). El reloj va acelerado (velocidad = minutos del panel por minuto real).
     Cada orden:
       eventos   [{ min, c, e, rep, rol }] → c = estatus del comercio, e = estatus de la entrega, rep/rol = quién la atiende
       respuestas { accion: { texto, c, e, rep, rol } } → qué pasa cuando el aspirante actúa
       reglas    [{ accion, desde, hasta, v, nota, esperada }] → cómo se califica (minutos del panel; la primera que
                 coincide manda; si ninguna coincide la acción cuenta como «mala»; esperada → suma al máximo). */
  const SIM_ACCIONES = {
    'contactar-comercio': 'Contactar al comercio', 'contactar-repartidor': 'Contactar al repartidor', 'publicar-shoppers': 'Publicar en grupo de Shoppers',
    'reasignar': 'Asignar repartidor', 'devolver-comercio': 'Devolver al comercio', 'cancelar': 'Cancelar orden'
  };
  const SIM_EST_COMERCIO = ['No iniciada', 'Preparación iniciada', 'Preparada', 'Cancelada'];
  const SIM_EST_ENTREGA = ['Aceptada', 'Iniciada', 'Preparación iniciada', 'Preparada', 'En comercio', 'En camino', 'En destino', 'Completada', 'Cancelada'];
  const ev = (min, c, e, rep, rol) => Object.assign({ min, c, e }, rep ? { rep, rol: rol || 'Repartidor' } : {});
  const rg = (accion, desde, hasta, v, nota, esperada) => ({ accion, desde, hasta: hasta == null ? 9999 : hasta, v, nota, esperada: !!esperada });
  const SIM_ORDENES_DEFAULT = [
    { id: '2A4-0000418', comercio: 'Rincón del Paladar (Caracas)', cliente: 'Ortiz, Gabriel', total: '15.20', metodo: 'movil', pago: 'Pagada', items: ['Pabellón x1', 'Tequeños x6'],
      eventos: [ev(-1, 'No iniciada', 'Aceptada')],
      respuestas: { 'contactar-comercio': { texto: '📞 Llamada sin respuesta. Mensaje enviado al comercio: sin leer.' }, 'cancelar': { texto: 'Orden cancelada. Reembolso total al cliente.', c: 'Cancelada', e: 'Cancelada' } },
      reglas: [rg('contactar-comercio', 0, 9, 'buena', 'Contactó al comercio por la orden no iniciada.', true), rg('contactar-comercio', 9, null, 'regular', 'Contactó tarde: pasaron más de 10 min de pagada sin iniciar.'),
        rg('cancelar', 9, null, 'buena', 'Canceló a los 10 min de pagada, sin respuesta del comercio.', true), rg('cancelar', 0, 9, 'mala', 'Canceló sin esperar los 10 min de respuesta del comercio.')] },
    { id: '3B7-0000206', comercio: 'Monte Bakery (Caracas)', cliente: 'Rojas, Valentina', total: '9.60', metodo: 'movil', pago: 'Pagada', items: ['Croissant de jamón x2', 'Café latte x1'],
      eventos: [ev(0, 'No iniciada', 'Aceptada'), ev(2, 'No iniciada', 'Iniciada', 'Jesús Alberto Pérez'), ev(6, 'No iniciada', 'En comercio', 'Jesús Alberto Pérez')],
      respuestas: { 'contactar-comercio': { texto: 'Monte Bakery: «¡Sí, ya estaba lista! Se nos olvidó marcarla 🙈». La orden sale con el repartidor.', c: 'Preparada', e: 'En camino' }, 'cancelar': { texto: 'Orden cancelada. El repartidor queda liberado.', c: 'Cancelada', e: 'Cancelada' } },
      reglas: [rg('contactar-comercio', 5, null, 'buena', 'El repartidor estaba en el comercio con la orden sin iniciar: contactó al comercio.', true), rg('contactar-comercio', 0, 5, 'regular', 'Contactó antes de tiempo (todavía estaba dentro de lo normal).'),
        rg('cancelar', 0, null, 'mala', 'Canceló una orden que estaba lista: había que contactar al comercio.'), rg('contactar-repartidor', 0, null, 'regular', 'El repartidor ya estaba en el local: el pendiente era del comercio.')] },
    { id: '27E-0000627', comercio: 'Forum SuperMayorista - La California (Caracas)', cliente: 'Blanco, Héctor', total: '42.75', metodo: 'mixto', pago: 'Pagada', items: ['Mercado: 18 productos'],
      eventos: [ev(3, 'No iniciada', 'Aceptada')],
      respuestas: { 'publicar-shoppers': { texto: 'Grupo de Shoppers: «La tomo yo» — Yorman Díaz. La orden pasa a Preparación iniciada.', c: 'Preparación iniciada', e: 'Preparación iniciada', rep: 'Yorman José Díaz', rol: 'Shopper' }, 'contactar-comercio': { texto: 'Forum: «Las órdenes las toman los Shoppers, publíquenla en el grupo».' } },
      reglas: [rg('publicar-shoppers', 3, 15, 'buena', 'Publicó la orden nueva de Forum en el grupo de Shoppers.', true), rg('publicar-shoppers', 15, null, 'regular', 'Publicó tarde en el grupo de Shoppers.'),
        rg('contactar-comercio', 0, null, 'regular', 'En Forum las órdenes las toman los Shoppers.'), rg('cancelar', 0, null, 'mala', 'Canceló una orden de Forum que solo faltaba publicar.')] },
    { id: '3D1-0000119', comercio: 'Pizzería Da Marco (Caracas)', cliente: 'Méndez, Sofía', total: '13.90', metodo: 'banco', pago: 'Pagada', items: ['Pizza margarita mediana x1'],
      eventos: [ev(-6, 'No iniciada', 'Aceptada'), ev(-4, 'Preparación iniciada', 'Iniciada'), ev(4, 'Preparada', 'Preparada')],
      respuestas: { 'reasignar': { texto: 'Asignada a Kevin Ramírez. Llega al local en 4 min.', e: 'Iniciada', rep: 'Kevin Antonio Ramírez' }, 'contactar-comercio': { texto: 'Pizzería Da Marco: «Ya está lista, solo falta el motorizado».' } },
      reglas: [rg('reasignar', 11, null, 'buena', 'Asignó repartidor a mano tras más de 8 min preparada sin repartidor.', true), rg('reasignar', 0, 11, 'regular', 'Asignó a mano antes de los 8 min (la asignación automática aún podía funcionar).'),
        rg('contactar-comercio', 0, null, 'regular', 'El comercio no era el problema: faltaba repartidor.'), rg('cancelar', 0, null, 'mala', 'Canceló una orden lista: había que asignar repartidor.')] },
    { id: '1E9-0000550', comercio: 'La Casa del Pan (Caracas)', cliente: 'Lugo, Ricardo', total: '7.30', metodo: 'movil', pago: 'Pagada', items: ['Pan campesino x1', 'Golfeados x4'],
      eventos: [ev(0, 'No iniciada', 'Aceptada'), ev(2, 'Preparación iniciada', 'Iniciada'), ev(5, 'Preparación iniciada', 'Iniciada', 'María Victoria Suárez'), ev(9, 'Preparada', 'En comercio', 'María Victoria Suárez'), ev(10, 'Preparada', 'En camino', 'María Victoria Suárez'), ev(22, 'Preparada', 'Completada', 'María Victoria Suárez')],
      respuestas: {},
      reglas: [rg('cancelar', 0, null, 'mala', 'Canceló una orden que iba en tiempo.')] },
    { id: '0BE-0000378', comercio: 'Sushi Express - Las Mercedes (Caracas)', cliente: 'Castillo, Paola', total: '21.00', metodo: 'tarjeta', pago: 'Pagada', items: ['Roll acevichado x2'],
      eventos: [ev(-25, 'No iniciada', 'Aceptada'), ev(-23, 'Preparación iniciada', 'Iniciada'), ev(-12, 'Preparación iniciada', 'Iniciada', 'Ramón Antonio Torres'), ev(-5, 'Preparada', 'En camino', 'Ramón Antonio Torres'), ev(6, 'Preparada', 'En destino', 'Ramón Antonio Torres')],
      respuestas: { 'contactar-repartidor': { texto: 'Repartidor: «Estoy en la dirección, el cliente no contesta. Ya lo llamé 3 veces».' }, 'devolver-comercio': { texto: 'Se le indicó al repartidor devolver el pedido al comercio. Comercio notificado.', c: 'Cancelada', e: 'Cancelada' } },
      reglas: [rg('contactar-repartidor', 6, null, 'buena', 'Confirmó con el repartidor en destino.'), rg('devolver-comercio', 21, null, 'buena', 'Indicó devolver al comercio tras 15 min en destino sin respuesta del cliente.', true),
        rg('devolver-comercio', 0, 21, 'mala', 'Mandó a devolver antes de los 15 min de espera en destino.'), rg('cancelar', 0, null, 'mala', 'No se cancela: el pedido se devuelve al comercio.')] },
    /* Órdenes de los tickets: el aspirante las busca en el panel (no se califican) */
    { id: '0BE-0000371', comercio: 'Sushi Express - Las Mercedes (Caracas)', cliente: 'Pérez, Andreína', total: '18.40', metodo: 'movil', pago: 'Pagada', items: ['Combo Tokio x1', 'Té frío x1'],
      eventos: [ev(-72, 'No iniciada', 'Aceptada'), ev(-60, 'Preparación iniciada', 'Iniciada')],
      respuestas: { 'contactar-comercio': { texto: 'Sushi Express: «Disculpen, estamos full. Sale en 10 minutos».' } }, reglas: [] },
    { id: '1F1-0004331', comercio: 'Forum SuperMayorista - CC Parque Humboldt (Caracas)', cliente: 'Rivas, Carlos', total: '9.80', metodo: 'tarjeta', pago: 'Pagada', items: ['Harina PAN 1 kg x2', 'Arroz 1 kg x1', 'Refresco 2 L x1 · $2.50'],
      eventos: [ev(-48, 'Preparada', 'Completada', 'Jhonny Moreno')], respuestas: { 'contactar-comercio': { texto: 'Forum: «Revisamos la comanda: el refresco no se incluyó».' } }, reglas: [] },
    { id: '1C8-0000541', comercio: 'Arepera La Quinta - Chacao (Caracas)', cliente: 'Gómez, Mariana', total: '11.00', metodo: 'movil', pago: 'No pagada', items: ['Arepa reina pepiada x2', 'Jugo de parchita x1'],
      eventos: [ev(-21, 'No iniciada', 'Aceptada')], respuestas: {}, reglas: [] },
    { id: '219-0000152', comercio: 'Sopas Doña Carmen (Caracas)', cliente: 'Hernández, José', total: '10.50', metodo: 'binance', pago: 'Pagada', items: ['Sopa de res grande x1 · $8.00', 'Casabe x1'],
      eventos: [ev(-39, 'Preparada', 'Completada', 'Luis Alberto Mora')], respuestas: {}, reglas: [] },
    { id: '282-0001037', comercio: 'Burger Lab (Caracas)', cliente: 'Suárez, Daniela', total: '12.30', metodo: 'paypal', pago: 'Pagada', items: ['Doble smash x1', 'Papas medianas x1'],
      eventos: [ev(-26, 'Preparada', 'En camino', 'Pedro Castillo')], respuestas: {}, reglas: [] },
    { id: '1D5-0000455', comercio: 'Pollos El Gran Chef (Caracas)', cliente: 'Fernández, Luisa', total: '14.50', metodo: 'tarjeta', pago: 'Pagada', items: ['Pollo entero x1', 'Yuca frita x1'],
      eventos: [ev(-55, 'Preparada', 'Completada', 'Ramón Antonio Torres')], respuestas: { 'contactar-repartidor': { texto: '📞 Dos llamadas al repartidor sin respuesta.' } }, reglas: [] },
    { id: '1C8-0000547', comercio: 'Frutal mix - Chacaito (Caracas)', cliente: 'Arias, Ingrid', total: '9.00', metodo: 'banco', pago: 'Pagada', items: ['Merengada x2'],
      eventos: [ev(-8, 'No iniciada', 'Aceptada'), ev(-6, 'Preparación iniciada', 'Iniciada', 'Fabricio Brito'), ev(7, 'Preparada', 'En comercio', 'Fabricio Brito'), ev(9, 'Preparada', 'En camino', 'Fabricio Brito'), ev(24, 'Preparada', 'Completada', 'Fabricio Brito')], respuestas: {},
      reglas: [rg('cancelar', 0, null, 'mala', 'Canceló una orden que iba en tiempo.')] }
  ];
  /* ---------- Simulador: ruta VIAJES (Admin de Ridery) ----------
     Tickets de usuarios y conductores que se resuelven buscando el viaje en el Admin
     (admin.ridery.app): Waiting / Running / Completed Requests, All Trips con «Trip History»,
     detalle del viaje (View Map) y mensajes entre usuario y conductor.
     consulta: { herramienta, id } → el aspirante debió abrir ese viaje/orden antes de responder
     el paso marcado con verificar: true (suma 2 puntos si lo hizo). */
  SIM_MOTIVOS_DEFAULT.push('Trips : Cobro incorrecto', 'Trips : Conductor no llega', 'Trips : Deuda pendiente', 'Trips : Objeto perdido', 'Otro : Fuera de alcance (transferir a Orders)');
  SIM_CASOS_DEFAULT.push(
    { id: 'via-cobro', celula: 'TRIPS', activo: true, llegada: 0, humor: 2, asunto: 'Me cobraron de más un viaje', consulta: { herramienta: 'admin', id: '86165782' },
      cliente: { nombre: 'Aracelis Pinates', telefono: '+584121187340', notas: 'Usuario: 3560878 Aracelis Pinates' },
      motivo: 'Trips : Cobro incorrecto',
      pasos: [
        { cliente: ['Buenas, hoy tomé un viaje en Valencia y me cobraron 7,38', 'La app me había dicho mucho menos 😡'],
          opciones: [
            op('buena', 'Hola, Aracelis. Lamento el inconveniente; ya lo reviso. ¿Me confirmas la hora aproximada y desde dónde hacia dónde fue el viaje?', 'Fue como a las 10:30, desde Netcom Plus (Paseo Las Industrias) hasta Flor Amarillo', 1),
            op('regular', 'Buenas. Pásame el ID del viaje.', '¿Y eso dónde lo veo? Fue hoy 10:30, de Netcom Plus a Flor Amarillo', -1),
            op('mala', 'Las tarifas son así, no se puede hacer nada.', 'O sea, ¿ni siquiera lo van a revisar? Fue hoy 10:30, de Netcom Plus a Flor Amarillo', -2)
          ], otro: ['Fue hoy como a las 10:30, de Netcom Plus a Flor Amarillo'] },
        { verificar: true, cliente: [],
          opciones: [
            op('buena', 'Gracias. Revisé tu viaje #86165782 en Económico: tuvo un multiplicador de demanda (surge) de 1,4 y el recorrido real fue de 7,9 km, por eso el total quedó en $7,38. El cobro está correcto según el viaje que hiciste.', 'Ah ok, no sabía lo de la demanda. Gracias por explicarme', 2),
            op('mala', 'Ya te reembolso la diferencia a tu wallet.', '¡Gracias!', 1),
            op('regular', 'Paso tu caso al equipo de pagos para que lo revisen.', '¿Y cuánto tardan? Solo quiero saber por qué me cobraron eso', -1)
          ], otro: ['Ok, ¿entonces está bien cobrado?'] }
      ] },
    { id: 'via-no-lo-veo', celula: 'TRIPS', activo: true, llegada: 20, humor: 2, asunto: 'El conductor dice que llegó y no lo veo', consulta: { herramienta: 'admin', id: '86166402' },
      cliente: { nombre: 'Manuel Mendoza', telefono: '+584144410982', notas: 'Usuario: 777873 Manuel Juan Mendoza Castellano' },
      motivo: 'Trips : Conductor no llega',
      pasos: [
        { cliente: ['Hola, el conductor me escribió que ya está aquí pero no lo veo por ningún lado', 'Estoy en la Isabélica, Valencia'],
          opciones: [
            op('buena', 'Hola, Manuel. Te ayudo ya mismo a ubicarlo; dame un momento mientras reviso tu viaje en curso.', 'Ok, apúrate porque voy tarde', 1),
            op('regular', 'Cancela el viaje y pide otro.', '¿Y si me cobran la cancelación?', -1),
            op('mala', 'Llama tú al conductor, nosotros no podemos hacer nada.', 'Para eso les escribo… qué mal servicio', -2)
          ], otro: ['Ok, espero'] },
        { verificar: true, cliente: [],
          opciones: [
            op('buena', 'Revisé tu viaje en curso: tu conductor, Ángel Alberto Morales, te escribió que está frente al Automercado Catania La Isabélica, en la Avenida 73. Si te acercas ahí lo vas a ver; él ya está esperándote.', '¡Ah, ya lo vi! Gracias 🙏', 2),
            op('mala', 'Tu conductor está en camino, llega en 10 minutos.', 'Pero él me dijo que ya llegó… ¿quién tiene razón?', -2),
            op('regular', 'Escríbele por el chat de la app para que te diga dónde está.', 'Ya le escribí y no entiendo dónde es', -1)
          ], otro: ['¿Y dónde está?'] }
      ] },
    { id: 'via-deuda', celula: 'TRIPS', activo: true, llegada: 45, humor: 3, asunto: 'Tengo una deuda de un viaje cancelado', consulta: { herramienta: 'admin', id: '254552' },
      cliente: { nombre: 'Silmar Ramones', telefono: '+584247705512', notas: 'Usuario: 99644 Silmar Ramones' },
      motivo: 'Trips : Deuda pendiente',
      pasos: [
        { cliente: ['Hola, la app no me deja pedir viajes porque dice que tengo una deuda', 'Es de un viaje del 2021 que me cancelaron, el 254552'],
          opciones: [
            op('buena', 'Hola, Silmar. Gracias por el número del viaje; déjame revisarlo en el historial para ver qué pasó.', 'Dale, gracias', 1),
            op('regular', 'Eso es muy viejo, no aparece en el sistema.', '¿Cómo que no aparece si me lo están cobrando?', -2),
            op('mala', 'Tienes que pagar la deuda para seguir usando la app.', '¿Pagar un viaje que me cancelaron? No.', -2)
          ], otro: ['Ok'] },
        { verificar: true, cliente: [],
          opciones: [
            op('buena', 'Ubiqué el viaje #254552 del 22 de junio de 2021: aparece cancelado, con pago en efectivo pendiente por $3,90. Como el viaje no se realizó, ya lo paso al equipo de pagos para que anulen esa deuda y te aviso por aquí cuando esté listo.', 'Perfecto, gracias por revisarlo', 2),
            op('mala', 'Ya te borré la deuda, puedes pedir viajes.', '¡Gracias! … espera, todavía me sale', -1),
            op('regular', 'Envíanos un correo a soporte con tu caso.', '¿Otra vez explicar todo por correo?', -1)
          ], otro: ['¿Y entonces?'] }
      ] },
    { id: 'via-objeto', celula: 'TRIPS', activo: true, llegada: 75, humor: 2, asunto: 'Dejé mi teléfono en el carro', consulta: { herramienta: 'admin', id: '86165566' },
      cliente: { nombre: 'Benjamín Aguilar', telefono: '+584125541276', notas: 'Usuario: 270084 Benjamín Aguilar Pérez Rafael' },
      motivo: 'Trips : Objeto perdido',
      pasos: [
        { cliente: ['Por favor ayúdenme, dejé mi teléfono en la moto del viaje de hoy', 'Les escribo desde el de mi hermana'],
          opciones: [
            op('buena', 'Hola, Benjamín. Tranquilo, te vamos a ayudar. Voy a ubicar tu viaje de hoy para contactar al conductor.', 'Gracias, fue como a las 10:30 en Valencia', 1),
            op('mala', 'Nosotros no nos hacemos responsables por objetos olvidados.', '¿Ni siquiera me van a ayudar a contactarlo?', -2),
            op('regular', 'Llama a tu teléfono a ver si alguien contesta.', 'Ya llamé y nadie contesta…', -1)
          ], otro: ['Fue hoy como a las 10:30 en Valencia'] },
        { verificar: true, cliente: [],
          opciones: [
            op('buena', 'Ubiqué tu viaje #86165566 con el conductor Isaac Josué Núñez (Moto Baratica). Ya le escribí para coordinar la devolución de tu teléfono; te aviso por aquí en cuanto responda.', 'Muchas gracias de verdad', 2),
            op('mala', 'Te paso el número personal del conductor para que lo llames.', 'Ok… gracias', 0),
            op('regular', 'Cuando el conductor lo encuentre, seguro lo reporta.', '¿Y si no lo reporta?', -1)
          ], otro: ['¿Y entonces?'] }
      ] },
    { id: 'fx-pedido-zupper', celula: 'TRIPS', activo: true, llegada: 100, humor: 2, asunto: 'Mi pedido de comida no ha llegado', estados: ['abierto'], fueraDeAlcance: true,
      cliente: { nombre: 'Oriana Castillo', telefono: '+584143329014', notas: 'Usuario: 512210 Oriana Castillo' },
      motivo: 'Otro : Fuera de alcance (transferir a Orders)',
      pasos: [
        { cliente: ['Hola, pedí comida por Zupper hace una hora y no ha llegado nada'],
          opciones: [
            op('buena', 'Hola, Oriana. Lamento la espera. Este canal atiende viajes, así que ya transfiero tu caso al equipo de Orders de Zupper para que revisen tu pedido de inmediato.', 'Ok, gracias', 1),
            op('mala', 'Seguro el conductor ya va en camino, espera un poco.', '¿Qué conductor? Es un pedido de comida…', -2),
            op('mala', 'Te reembolso el viaje.', 'No fue un viaje, fue un pedido 🙄', -2)
          ], otro: ['Ok'] }
      ] }
  );

  /* Viajes del Admin. min = minuto del panel (reloj acelerado) en que se pidió; fecha = viaje viejo (solo en «Trip History»).
     eventos: [{ min, st }] → Waiting, Accepted, Arrived, Started, Completed, Cancelled. */
  const vj = (o) => Object.assign({ thirdParty: '', whoIsPaying: '', promo: 'No', tip: 0, creadoPor: 'User', fijo: true, revision: 'No', mensajes: [], reglas: [] }, o);
  const SIM_VIAJES_DEFAULT = [
    vj({ id: '86165782', userId: '3560878', user: 'Aracelis Pinates', email: 'aracelis.pinates@gmail.com', tel: '+58 4121187340', providerId: '3186', provider: 'Raymond Jose Salas Acosta',
      servicio: 'Económico', tarifa: 'Económico / 0.35 per KM / 0.16 per minute.', ciudad: 'Valencia, Carabobo', pickup: 'Netcom Plus Oficina Paseo Las Industrias', destino: 'Flor Amarillo',
      providerAddr: '5278+53G, Valencia 2003, Carabobo, Venezuela', min: -12, estimado: 4.10, monto: 7.38, km: 7.89, realTime: 11.41, surge: 1.4, pago: 'Pay By Coporate', pagoEstado: 'Paid', creadoPor: 'Driver',
      eventos: [{ min: -12, st: 'Accepted' }, { min: -11, st: 'Started' }, { min: -1, st: 'Completed' }] }),
    vj({ id: '86166402', userId: '777873', user: 'Manuel Juan Mendoza Castellano', email: 'manuelmendoza@gmail.com', tel: '+58 4144410982', providerId: '430563', provider: 'Ángel Alberto Morales Flores',
      servicio: 'Moto', tarifa: 'Moto / 0.21 per KM / 0.17 per minute.', ciudad: 'Valencia, Carabobo', pickup: 'Avenida 73, Valencia 2003, Carabobo', destino: 'Complejo De Piscinas La Isabelica',
      providerAddr: '528Q+37R, Av. Henry Ford, Valencia 2003, Carabobo', min: -9, estimado: 1.43, monto: 1.43, km: 1.02, realTime: 1.96, surge: 1, pago: 'Pay By Wallet', pagoEstado: 'Pending',
      eventos: [{ min: -9, st: 'Waiting' }, { min: -8, st: 'Accepted' }, { min: -1, st: 'Arrived' }],
      mensajes: [{ de: 'provider', min: -7, t: 'Hola, voy en camino' }, { de: 'user', min: -5, t: 'Ok, aquí te espero' }, { de: 'provider', min: -1, t: 'Estoy frente a catania' }],
      reglas: [{ accion: 'cancelar-viaje', desde: 0, hasta: 9999, v: 'mala', nota: 'Canceló el viaje: el conductor ya estaba en el punto de recogida.' }] }),
    vj({ id: '254552', userId: '99644', user: 'Silmar Ramones', email: 'silmar.ramones@hotmail.com', tel: '+58 4247705512', providerId: '2894', provider: 'Aaron Arias', servicio: 'Estándar',
      tarifa: 'Estándar / 0.30 per KM / 0.12 per minute.', ciudad: 'Maracaibo, Zulia', pickup: 'C.C. Lago Mall, Maracaibo', destino: 'Av. 5 de Julio, Maracaibo', providerAddr: 'Av. 5 de Julio, Maracaibo',
      fecha: '2021-06-22T12:38:00', estimado: 3.90, monto: 3.90, km: 0, realTime: 0, surge: 1, pago: 'Pay By Cash', pagoEstado: 'Pending', eventos: [{ min: 0, st: 'Cancelled' }] }),
    vj({ id: '86165566', userId: '270084', user: 'Benjamin Aguilar Perez Rafael', email: 'benjaminaguilar@gmail.com', tel: '+58 4125541276', providerId: '254216', provider: 'Isaac Josué Núñez Gil',
      servicio: 'Moto Baratica', tarifa: 'Moto Baratica / 0.18 per KM / 0.10 per minute.', ciudad: 'Valencia, Carabobo', pickup: 'Av. Bolívar Norte, Valencia', destino: 'C.C. Sambil Valencia',
      providerAddr: 'Av. Bolívar Norte, Valencia', min: -16, estimado: 1.00, monto: 1.00, km: 0.94, realTime: 7.2, surge: 1, pago: 'Pay By Wallet', pagoEstado: 'Paid',
      eventos: [{ min: -16, st: 'Accepted' }, { min: -15, st: 'Started' }, { min: -8, st: 'Completed' }],
      mensajes: [{ de: 'user', min: -16, t: 'Estoy en la entrada principal' }, { de: 'provider', min: -16, t: 'Ok, ya llego' }] })
  ];
  // Viajes de relleno para que las listas se vean como un día normal (siempre los mismos)
  (function rellenarViajes() {
    const users = [['2193049', 'sebastian gamarra'], ['2190400', 'Nazaret Viccely Gonzalez Sanchez'], ['779747', 'Reynaldo Alexander Ledezma Sanchez'], ['3119154', 'Dinorah Alejandra Valero Romano'],
      ['729481', 'Issam Khatib'], ['622731', 'David Victor Leon Lira'], ['2781272', 'Esneydi Rsteile'], ['662255', 'Daniel Lopez'], ['3508623', 'Jesus Manuel Tortolero Ramirez'],
      ['1401336', 'Lina Rosa Maldonado Roa'], ['2437016', 'Yonaibeth Mejia'], ['663329', 'Mireangel Coromoto Acosta Avola'], ['1086245', 'Ricardo Daniel Hubber Guzman'], ['220425', 'Ivonne Josefina Duran Pacheco'],
      ['1502910', 'Coromoto Solsiret Hernandez Palma'], ['1059438', 'Alejandra García'], ['1865030', 'Arelis Carolina Gomez Mindiola'], ['344957', 'Pedro Olmos'], ['2529410', 'Audrey Rondón'], ['3071883', 'Hazael Avril Maturet Puertas']];
    const provs = [['62893', 'Ricardo José Márquez Vicuña'], ['274540', 'Alexander Sánchez'], ['5628', 'Juan de Dios Rodriguez Garces'], ['46255', 'Victor Hugo Diaz Baque'], ['64366', 'Jonathan Eduardo Durán Fernández'],
      ['347409', 'jose Hernández'], ['313603', 'Jeferson Jesús Medina romero'], ['439118', 'Luis Jose Caicedo Duran'], ['447478', 'Dubalier Jose Cedeño Pericana'], ['228495', 'Jesús Fernando Becerra Torres']];
    const lugares = [['Valencia, Carabobo', 'Universidad Alejandro De Humboldt', 'Bonaventure Home, Naguanagua'], ['Maracay, Aragua', 'La Nisperera - Torre A Y Torre B', 'Centro Comercial Global, Cc Global'],
      ['Caracas, Capital District', 'Residencias Unión', 'Edificio. La Llovizna'], ['Caracas, Capital District', 'Caurimare Tepuy', 'Cordero Restaurante'], ['Maturín, Monagas', 'Inspección Vehículos Policía Municipal', 'Clínica Santa Sofía, Calle 6'],
      ['Mérida, Mérida', 'Domisalud C.A', 'Facultad De Humanidades Y Educación'], ['Maracaibo, Zulia', 'Calle 69A & Avenida 13', 'Costashrimp'], ['Puerto La Cruz, Anzoátegui', 'Av. Municipal', 'C.C. Plaza Mayor'],
      ['Barquisimeto, Lara', 'Av. Lara, Barquisimeto', 'C.C. Sambil Barquisimeto']];
    const servicios = [['Moto Baratica', 0.18], ['Económico', 0.35], ['Moto', 0.21], ['Baratica', 0.25], ['Ridery Premium', 0.6], ['Carro', 0.4], ['Moto a mi precio', 0.2]];
    const pagos = ['Pay By Pago Móvil Auto', 'Pay By Wallet', 'Pay By Debito Inmediato', 'Pay By Pago Móvil Auto', 'Pay By Promo $0.91', 'Pay By Paga al subir', 'Pay by Prepaid Cash Bs', 'Pay By Pago Móvil Auto'];
    const flujo = [[], ['Accepted'], ['Accepted', 'Started'], ['Accepted', 'Started', 'Completed'], ['Accepted', 'Started', 'Completed'], ['Cancelled'], ['Accepted', 'Started', 'Completed']];
    for (let k = 0; k < 26; k++) {
      const u = users[k % users.length], p = provs[(k * 3) % provs.length], l = lugares[(k * 5) % lugares.length], sv = servicios[(k * 7) % servicios.length], f = flujo[k % flujo.length];
      const min = -40 + k * 2.5, km = Math.round(((k * 37) % 90) / 10 * 100) / 100 + 0.6, monto = Math.round((1 + km * sv[1] * 3) * 100) / 100;
      const eventos = [{ min, st: 'Waiting' }].concat(f.map((st, i) => ({ min: min + 2 + i * 6, st })));
      SIM_VIAJES_DEFAULT.push(vj({ id: String(86164760 + k * 23), userId: u[0], user: u[1], email: u[1].split(' ')[0].toLowerCase() + (k * 7 % 90) + '@gmail.com', tel: '+58 41' + (24000000 + k * 371733).toString().slice(0, 8),
        providerId: f.length && f[0] !== 'Cancelled' ? p[0] : '', provider: f.length && f[0] !== 'Cancelled' ? p[1] : '', servicio: sv[0], tarifa: sv[0] + ' / ' + sv[1] + ' per KM / 0.12 per minute.', ciudad: l[0], pickup: l[1], destino: l[2],
        providerAddr: l[1], min, estimado: monto, monto, km, realTime: Math.round(km * 4 * 10) / 10, surge: k % 4 === 0 ? 1.2 : 1, pago: pagos[k % pagos.length], pagoEstado: f.includes('Completed') ? 'Paid' : 'Pending',
        promo: pagos[k % pagos.length].includes('Promo') ? 'Yes' : 'No', creadoPor: k % 6 === 0 ? 'Driver' : 'User', eventos,
        reglas: [{ accion: 'cancelar-viaje', desde: 0, hasta: 9999, v: 'mala', nota: 'Canceló un viaje sin que nadie lo pidiera.' }] }));
    }
  })();

  /* ---------- Simulador: ruta CÉLULAS (Admin completo) ----------
     Tickets de las otras células (Supply, Payments, Match & Pricing, CX, Fraud, Trips) que se
     resuelven con los demás módulos del Admin: Service Providers, Users, Reviews, Trip Payment…
     El ID de usuario y el ID de conductor son distintos: buscar uno en el módulo del otro no lo
     encuentra (o encuentra a otra persona). consulta.id lleva prefijo: «u:» usuario, «p:» conductor.
     adminEsperada: { accion, objetivo, nota } → acción en el Admin que suma 2 puntos si se hace bien.
     Todos los nombres, teléfonos e IDs son inventados. */
  SIM_MOTIVOS_DEFAULT.push('Payments : Wallet / referidos', 'Fraud : Autenticación', 'Trips : Viaje no realizado', 'Supply : Conductor suspendido', 'Match & Pricing : Strikes',
    'Payments : Pago no recibido', 'CX : Bad review', 'Payments : Efectivo no pagado');
  SIM_CASOS_DEFAULT.push(
    { id: 'cel-referidos', celula: 'PAYMENTS', activo: true, llegada: 0, humor: 2, asunto: 'Me quitaron los KM de mis referidos', consulta: { herramienta: 'admin', id: 'u:302915' },
      adminEsperada: { accion: 'agregar-wallet', objetivo: 'u:302915', nota: 'Abonar 5 KM en Add Wallet con el tipo «Vencimiento de referidos».' },
      cliente: { nombre: 'Daniela Quintero', telefono: '+584141203367', notas: 'Usuario: ID 302915' },
      motivo: 'Payments : Wallet / referidos',
      pasos: [
        { cliente: ['Hola, tenía 5 km en mi wallet por los referidos y hoy amanecieron en cero', 'Mi ID de usuario es 302915'],
          opciones: [
            op('buena', 'Hola, Daniela. Gracias por el ID; ya reviso los movimientos de tu wallet.', 'Dale, gracias', 1),
            op('regular', 'Los referidos se vencen, eso es normal.', '¿Y entonces los pierdo así nada más?', -1),
            op('mala', 'Seguro los usaste en un viaje y no te acuerdas.', 'No he pedido ni un viaje esta semana…', -2)
          ], otro: ['Ok, espero'] },
        { verificar: true, cliente: [],
          opciones: [
            op('buena', 'Listo, Daniela. En tu Wallet History aparece un descuento de 5 KM por vencimiento de referidos, porque tus referidos no usaron la app en los últimos meses. Ya te los aboné de nuevo; los ves en tu wallet al actualizar la app.', '¡Ya me aparecen! Mil gracias', 2),
            op('regular', 'Tus referidos se vencieron. Cuando invites a alguien nuevo vuelves a sumar.', 'Pero esos km ya me los habían dado…', -1),
            op('mala', 'No veo ningún movimiento en tu cuenta.', '¿Cómo que no? Yo los tenía', -2)
          ], otro: ['¿Me los van a devolver?'] }
      ] },
    { id: 'cel-autenticacion', celula: 'FRAUD', activo: true, llegada: 25, humor: 2, asunto: 'No me aprueban la autenticación', consulta: { herramienta: 'admin', id: 'u:1873402' },
      cliente: { nombre: 'Kelvin Rojas', telefono: '+584247781902', notas: 'Usuario: ID 1873402' },
      motivo: 'Fraud : Autenticación',
      pasos: [
        { cliente: ['Buenas, ya subí mi cédula 3 veces y no me aprueban', 'Mi ID es 1873402'],
          opciones: [
            op('buena', 'Hola, Kelvin. Gracias por el ID; voy a revisar el documento que cargaste para decirte qué pasó.', 'Ok, gracias', 1),
            op('regular', 'Vuelve a intentarlo más tarde.', 'Ya lo intenté 3 veces…', -1),
            op('mala', 'Ya te aprobé la autenticación.', '¿En serio? Ok', 0)
          ], otro: ['Ok'] },
        { verificar: true, cliente: [],
          opciones: [
            op('buena', 'Revisé la foto de tu cédula: el flash hace un reflejo que tapa el número y tu nombre, por eso no se puede validar. Tómale una foto nueva con luz natural, sin flash y bien enfocada, y vuelve a cargarla desde la app.', 'Ahhh, ok. Ya la tomo de nuevo, gracias', 2),
            op('mala', 'Tu cédula parece alterada, no podemos aprobarla.', '¿Alterada? Es mi cédula original 😡', -3),
            op('regular', 'La foto no es válida, súbela otra vez.', '¿Pero qué tiene de malo?', -1)
          ], otro: ['¿Qué tengo que hacer?'] }
      ] },
    { id: 'cel-no-realizado', celula: 'TRIPS', activo: true, llegada: 50, humor: 1, asunto: 'Me cobraron un viaje que no se hizo', consulta: { herramienta: 'admin', id: '86162544' },
      adminEsperada: { accion: 'cancelar-viaje', objetivo: '86162544', nota: 'Cancelar el viaje #86162544 con el motivo «Viaje no realizado».' },
      cliente: { nombre: 'Gabriela Salcedo', telefono: '+584126650148', notas: 'Usuario: ID 1950733' },
      motivo: 'Trips : Viaje no realizado',
      pasos: [
        { cliente: ['El conductor nunca llegó y me descontaron el viaje de la wallet', 'Él lo inició y lo terminó sin buscarme, ¡qué abuso!'],
          opciones: [
            op('buena', 'Hola, Gabriela. Lamento mucho lo que pasó. Voy a revisar ese viaje de inmediato para ayudarte.', 'Por favor, porque me dejaron botada', 1),
            op('regular', 'Envíame captura del cobro.', 'Ya les dije lo que pasó…', -1),
            op('mala', 'Si el viaje aparece completado es porque se hizo.', 'No se hizo, ¿me estás diciendo mentirosa?', -2)
          ], otro: ['Ok'] },
        { verificar: true, cliente: [],
          opciones: [
            op('buena', 'Revisé tu viaje #86162544: aparece completado, pero con 0 km recorridos, así que no se realizó. Ya lo cancelé como «viaje no realizado» y el monto de $3,20 vuelve a tu wallet. Disculpa el mal rato.', 'Gracias por resolverlo rápido', 2),
            op('regular', 'Voy a reportar al conductor.', '¿Y mi dinero?', -1),
            op('mala', 'El viaje está completado, no se puede hacer nada.', 'Esto es un robo. Voy a borrar la app', -2)
          ], otro: ['¿Me devuelven el dinero?'] }
      ] },
    { id: 'cel-suspendido', celula: 'SUPPLY', activo: true, llegada: 80, humor: 1, asunto: 'Conductor: me suspendieron la cuenta', consulta: { herramienta: 'admin', id: 'p:448203' },
      cliente: { nombre: 'Wilmer Peraza', telefono: '+584125507712', notas: 'Conductor: ID 448203' },
      motivo: 'Supply : Conductor suspendido',
      pasos: [
        { cliente: ['Buenas, soy conductor, mi ID es 448203', 'Me suspendieron y no sé por qué, necesito trabajar'],
          opciones: [
            op('buena', 'Hola, Wilmer. Entiendo la preocupación; déjame revisar tu perfil para decirte qué pasó.', 'Gracias, estoy parado desde hace rato', 1),
            op('regular', 'Ve a la oficina para que te expliquen.', '¿Hasta la oficina? Dime por lo menos qué pasó', -1),
            op('mala', 'Si te suspendieron por algo será.', 'Qué falta de respeto…', -2)
          ], otro: ['Ok'] },
        { verificar: true, cliente: [],
          opciones: [
            op('buena', 'Revisé tu perfil: la suspensión viene de un viaje que iniciaste y finalizaste sin realizarlo; el usuario lo reportó y el recorrido marca 0 km. Lo siento, pero no podemos levantarla: está prohibido finalizar viajes que no se hicieron. Si te pasa de nuevo, escríbenos y nosotros lo cancelamos por ti. La suspensión es temporal.', 'Ok… no sabía, la próxima les escribo', 2),
            op('mala', 'Ya te quité la suspensión, puedes trabajar.', '¡Gracias! … sigue saliendo suspendido', -1),
            op('regular', 'No veo nada raro en tu cuenta, debe ser un error.', '¿Entonces por qué estoy suspendido?', -1)
          ], otro: ['¿Y cuándo me la quitan?'] }
      ] },
    { id: 'cel-strikes', celula: 'MATCH AND PRICING', activo: true, llegada: 110, humor: 1, asunto: 'Conductor: suspendido por cancelaciones', consulta: { herramienta: 'admin', id: 'p:391577' },
      cliente: { nombre: 'Jhonny Barrios', telefono: '+584166603481', notas: 'Conductor: ID 391577' },
      motivo: 'Match & Pricing : Strikes',
      pasos: [
        { cliente: ['Me suspendieron por cancelaciones y yo solo cancelé dos', 'ID 391577'],
          opciones: [
            op('buena', 'Hola, Jhonny. Entiendo lo que te pasó; voy a revisar tus cancelaciones de hoy.', 'Revisa, que yo cancelé dos nada más', 1),
            op('regular', 'Las suspensiones las pone el sistema, no se pueden quitar.', '¿Ni siquiera lo vas a revisar?', -1),
            op('mala', 'Para qué cancelas, entonces.', 'Me cancelaron a mí el usuario, no seas así', -2)
          ], otro: ['Ok'] },
        { verificar: true, cliente: [],
          opciones: [
            op('buena', 'Entiendo lo que te pasó. Hoy se registraron 3 cancelaciones seguidas en tu cuenta (viajes 86161204, 86161250 y 86161297) y por eso el sistema te suspendió automáticamente, para proteger tus métricas. Para la próxima, si ya llevas 2 cancelaciones, escríbenos antes y te ayudamos a cancelar el viaje.', 'Ah, verdad, la tercera fue sin querer. Ok, gracias', 2),
            op('mala', 'Ya pedí que te desbloqueen.', '¿En cuánto tiempo?', -1),
            op('regular', 'Tienes 3 cancelaciones. Espera que se te quite.', 'Pues bueno…', -1)
          ], otro: ['¿Y entonces?'] }
      ] },
    { id: 'cel-pago-rebotado', celula: 'PAYMENTS', activo: true, llegada: 140, humor: 2, asunto: 'Conductor: no me llegó el pago de la semana', consulta: { herramienta: 'admin', id: 'p:215664' },
      adminEsperada: { accion: 'rechazar-cuenta', objetivo: 'p:215664', nota: 'Rechazar la cuenta bancaria en Datos Bancarios Providers para que la cargue de nuevo.' },
      cliente: { nombre: 'Rosmery Linares', telefono: '+584241197023', notas: 'Conductora: ID 215664' },
      motivo: 'Payments : Pago no recibido',
      pasos: [
        { cliente: ['Hola, este corte no me llegó el pago y siempre me llegaba normal', 'Mi ID de conductora es 215664'],
          opciones: [
            op('buena', 'Hola, Rosmery. Gracias por el ID; voy a revisar tu liquidación de este corte.', 'Ok, quedo atenta', 1),
            op('regular', 'Los pagos se hacen los martes, espera.', 'Hoy es jueves y no ha llegado nada', -1),
            op('mala', 'Seguro tu banco está caído.', 'Mi banco funciona perfecto', -2)
          ], otro: ['Ok'] },
        { verificar: true, cliente: [],
          opciones: [
            op('buena', 'Revisé tu liquidación: tu banco rechazó la transferencia de este corte y el sistema te sacó del pago. Ya rechacé tu cuenta en el sistema para que la cargues de nuevo: en la app, ve a Cuentas bancarias → Agregar cuenta bancaria. Tu saldo queda para el próximo corte.', 'Ok, ya la cargo de nuevo. Gracias', 2),
            op('regular', 'Tu pago fue rechazado, comunícate con tu banco.', '¿Y qué le digo al banco?', -1),
            op('mala', 'Ya te hice la transferencia manual.', '¡Gracias! … no me ha llegado nada', -2)
          ], otro: ['¿Y entonces qué hago?'] }
      ] },
    { id: 'cel-bad-review', celula: 'CX', activo: true, llegada: 170, humor: 1, asunto: 'El conductor fue grosero', consulta: { herramienta: 'admin', id: '86163011' },
      adminEsperada: { accion: 'contactado', objetivo: '86163011', nota: 'Marcar la reseña del viaje #86163011 como «Contacted» en Reviews.' },
      cliente: { nombre: 'Mariana Ferrer', telefono: '+584143360921', notas: 'Usuario: ID 2604418' },
      motivo: 'CX : Bad review',
      pasos: [
        { cliente: ['Quiero quejarme del conductor del viaje de esta mañana', 'Fue grosero conmigo y el carro estaba sucísimo'],
          opciones: [
            op('buena', 'Hola, Mariana. Lamento mucho la experiencia; ninguna persona debería pasar por eso. Voy a revisar el viaje para registrar tu reporte.', 'Gracias, de verdad fue muy desagradable', 1),
            op('regular', 'Califícalo con una estrella en la app.', 'Ya lo hice, por eso les escribo', -1),
            op('mala', 'Debe haber tenido un mal día.', 'Eso no es excusa…', -2)
          ], otro: ['Ok'] },
        { verificar: true, cliente: [],
          opciones: [
            op('buena', 'Ubiqué tu viaje #86163011 con el conductor Leonardo Ávila y la calificación que dejaste. Ya registré tu reporte para que el equipo haga seguimiento con él. Gracias por avisarnos: nos ayuda a mejorar el servicio.', 'Gracias por la atención', 2),
            op('mala', 'Ya bloqueé al conductor.', 'Ok… gracias', 0),
            op('regular', 'Te reembolso el viaje.', 'No quería el dinero, quería que lo supieran', -1)
          ], otro: ['¿Y qué van a hacer?'] }
      ] },
    { id: 'cel-efectivo', celula: 'PAYMENTS', activo: true, llegada: 200, humor: 2, asunto: 'Conductor: el usuario no me pagó', consulta: { herramienta: 'admin', id: '86163870' },
      adminEsperada: { accion: 'reporte-usuario', objetivo: 'u:1144290', nota: "Dejar el reporte del usuario en User's Records." },
      cliente: { nombre: 'Eduardo Nava', telefono: '+584126601375', notas: 'Conductor: ID 330981' },
      motivo: 'Payments : Efectivo no pagado',
      pasos: [
        { cliente: ['El usuario del viaje 86163870 se bajó y no me dio el efectivo', 'Quiero que me paguen ese viaje'],
          opciones: [
            op('buena', 'Hola, Eduardo. Lamento lo que pasó; déjame revisar el viaje.', 'Ok', 1),
            op('mala', 'Ya te abono el viaje a tu wallet.', '¡Gracias!', 1),
            op('regular', 'Eso pasa, la próxima ten cuidado.', 'Pero yo perdí mi dinero…', -1)
          ], otro: ['Ok'] },
        { verificar: true, cliente: [],
          opciones: [
            op('buena', 'Revisé el viaje #86163870: se pagó en efectivo y quedó validado. Ya dejé el reporte del usuario en el sistema. Lamentablemente no podemos reponerte el monto: antes de iniciar o finalizar un viaje en efectivo tienes que tener el dinero en tus manos.', 'Ok, entiendo. La próxima cobro antes', 2),
            op('mala', 'Te hago un ajuste en tu liquidación por ese monto.', 'Perfecto, gracias', 1),
            op('regular', 'No podemos hacer nada, es entre tú y el usuario.', '¿Ni un reporte?', -2)
          ], otro: ['¿Me lo van a pagar?'] }
      ] }
  );
  SIM_NIVELES_DEFAULT.push(
    { id: 'celulas-basico', ruta: 'CELULAS', nombre: 'Básico', descripcion: 'Un ticket a la vez. Busca usuarios en Users y viajes en Trips; usa Add Wallet, View Document y Cancel Trip con su motivo.', minutos: 15, maxAbiertos: 1, intervalo: 8, abandono: 240, herramientas: ['admin'], estados: false,
      casos: ['cel-referidos', 'cel-autenticacion', 'cel-no-realizado'] },
    { id: 'celulas-intermedio', ruta: 'CELULAS', nombre: 'Intermedio', descripcion: 'Hasta 2 tickets a la vez. Conductores: Service Providers, Driver\'s Records, Cancelled Trips por Provider Id, Datos Bancarios y liquidaciones. Ojo con el ID de usuario y el de conductor.', minutos: 20, maxAbiertos: 2, intervalo: 10, abandono: 180, herramientas: ['admin'], estados: true,
      casos: ['cel-suspendido', 'cel-strikes', 'cel-pago-rebotado', 'cel-bad-review', 'cel-referidos'] },
    { id: 'celulas-avanzado', ruta: 'CELULAS', nombre: 'Realidad', descripcion: 'Todas las células a la vez, como un turno real: los tickets llegan por tiempo.', minutos: 25, maxAbiertos: 0, intervalo: 0, abandono: 120, herramientas: ['admin'], estados: true,
      casos: ['cel-referidos', 'cel-autenticacion', 'cel-no-realizado', 'cel-suspendido', 'cel-strikes', 'cel-pago-rebotado', 'cel-bad-review', 'cel-efectivo'] }
  );
  SIM_RUTAS.CELULAS = 'Células · Zendesk + Admin completo';
  /* Grupos de herramientas: Zupper y Ridery son empresas distintas y sus rutas no dependen una de otra.
     Dentro de cada grupo, las etapas suman herramientas a medida que avanza la ruta. */
  const SIM_GRUPOS = [
    { id: 'ZUPPER', nombre: 'Herramientas Zupper', descripcion: 'Pedidos de Zupper: Zendesk y Panel Zupper.', rutas: ['ORDERS'] },
    { id: 'RIDERY', nombre: 'Herramientas Ridery', descripcion: 'Viajes, usuarios y conductores de Ridery: Zendesk y el Admin. Cada etapa suma herramientas.', rutas: ['VIAJES', 'CELULAS'] }
  ];
  const SIM_ETAPAS = {
    ORDERS: { titulo: 'Orders', herramientas: ['Zendesk', 'Panel Zupper'] },
    VIAJES: { titulo: 'Etapa 1 · Viajes', herramientas: ['Zendesk', 'Admin: Trips'] },
    CELULAS: { titulo: 'Etapa 2 · Células', herramientas: ['Zendesk', 'Admin: Trips', 'Users', 'Service Providers', 'Reviews', 'Trip Payment', 'Store y más'] }
  };
  const grupoDeRuta = ruta => (SIM_GRUPOS.find(g => g.rutas.includes(ruta)) || { id: 'OTRAS' }).id;
  const CANCELACIONES_ADMIN = ['Viaje no realizado', 'Prueba', 'No requiere el servicio', 'Modificación de reserva', 'Mover al Completed', 'Validación de cash (SOPORTE)', 'Conductor escribió para solicitar cancelar el viaje (Accepted)',
    'Conductor escribió para solicitar cancelar el viaje (Coming)', 'Conductor escribió para solicitar cancelar el viaje (Arrived)', 'Conductor se quedó accidentado', 'Viaje duplicado', 'Error en viaje', 'Destino no completado'];
  const TIPOS_WALLET = ['Vencimiento de referidos', 'Reembolso de viaje', 'Compensación por mala experiencia', 'Ajuste de saldo', 'Promoción', 'Error de cobro'];
  // Viajes de los casos de células (min = minuto del panel; negativo = antes de empezar)
  SIM_VIAJES_DEFAULT.push(
    vj({ id: '86162544', userId: '1950733', user: 'Gabriela Salcedo Mora', email: 'gabysalcedo@gmail.com', tel: '+58 4126650148', providerId: '412870', provider: 'Ramón Antonio Vielma',
      servicio: 'Económico', tarifa: 'Económico / 0.35 per KM / 0.16 per minute.', ciudad: 'Barquisimeto, Lara', pickup: 'Av. Los Leones, Barquisimeto', destino: 'C.C. Las Trinitarias',
      providerAddr: 'Av. Lara, Barquisimeto', min: -70, estimado: 3.20, monto: 3.20, km: 0.00, realTime: 1.1, surge: 1, pago: 'Pay By Wallet', pagoEstado: 'Paid',
      eventos: [{ min: -70, st: 'Accepted' }, { min: -64, st: 'Started' }, { min: -63, st: 'Completed' }],
      reglas: [{ accion: 'cancelar-viaje', desde: -9999, hasta: 9999, v: 'buena', motivo: 'Viaje no realizado', nota: 'Canceló como «Viaje no realizado» un viaje con 0 km.' }] }),
    vj({ id: '86160133', userId: '2210846', user: 'Andreína Colmenares', email: 'andreinacolm@gmail.com', tel: '+58 4241886032', providerId: '448203', provider: 'Wilmer José Peraza Linárez',
      servicio: 'Moto', tarifa: 'Moto / 0.21 per KM / 0.17 per minute.', ciudad: 'Valencia, Carabobo', pickup: 'Urb. Prebo, Valencia', destino: 'Av. Cedeño, Valencia',
      providerAddr: 'Urb. Prebo, Valencia', min: -420, estimado: 1.60, monto: 1.60, km: 0.00, realTime: 0.8, surge: 1, pago: 'Pay By Pago Móvil Auto', pagoEstado: 'Paid',
      cancelDesc: { motivo: 'Viaje no realizado', ticket: '2986541', admin: 'Soporte · Valentina R.', nota: 'Usuario indica que el conductor nunca llegó; recorrido de 0 km.', captura: 'prnt.sc/rA7xk2' },
      eventos: [{ min: -420, st: 'Accepted' }, { min: -415, st: 'Started' }, { min: -414, st: 'Completed' }, { min: -380, st: 'Cancelled' }] }),
    vj({ id: '86161204', userId: '3317702', user: 'Luis Ernesto Pinto', email: 'luispinto@gmail.com', tel: '+58 4141908844', providerId: '391577', provider: 'Jhonny Alexander Barrios',
      servicio: 'Moto Baratica', tarifa: 'Moto Baratica / 0.18 per KM / 0.10 per minute.', ciudad: 'Maracay, Aragua', pickup: 'Av. Bolívar, Maracay', destino: 'Base Aragua', min: -160, estimado: 1.10, monto: 1.10, km: 0, realTime: 0, surge: 1,
      pago: 'Pay By Wallet', pagoEstado: 'Pending', cancelDesc: { motivo: 'Cancelado por el conductor', ticket: '', admin: '', nota: '' }, eventos: [{ min: -160, st: 'Accepted' }, { min: -156, st: 'Cancelled' }] }),
    vj({ id: '86161250', userId: '1288130', user: 'Yusmary Pacheco', email: 'yusmaryp@gmail.com', tel: '+58 4243310076', providerId: '391577', provider: 'Jhonny Alexander Barrios',
      servicio: 'Moto Baratica', tarifa: 'Moto Baratica / 0.18 per KM / 0.10 per minute.', ciudad: 'Maracay, Aragua', pickup: 'Las Delicias, Maracay', destino: 'C.C. Parque Aragua', min: -140, estimado: 1.25, monto: 1.25, km: 0, realTime: 0, surge: 1,
      pago: 'Pay By Pago Móvil Auto', pagoEstado: 'Pending', cancelDesc: { motivo: 'Cancelado por el conductor', ticket: '', admin: '', nota: '' }, eventos: [{ min: -140, st: 'Accepted' }, { min: -137, st: 'Cancelled' }] }),
    vj({ id: '86161297', userId: '904417', user: 'Carlos Duque', email: 'cduque@hotmail.com', tel: '+58 4125519034', providerId: '391577', provider: 'Jhonny Alexander Barrios',
      servicio: 'Moto Baratica', tarifa: 'Moto Baratica / 0.18 per KM / 0.10 per minute.', ciudad: 'Maracay, Aragua', pickup: 'San Jacinto, Maracay', destino: 'Hospital Central de Maracay', min: -118, estimado: 0.95, monto: 0.95, km: 0, realTime: 0, surge: 1,
      pago: 'Pay By Wallet', pagoEstado: 'Pending', cancelDesc: { motivo: 'Cancelado por el conductor', ticket: '', admin: '', nota: '' }, eventos: [{ min: -118, st: 'Accepted' }, { min: -117, st: 'Cancelled' }] }),
    vj({ id: '86163011', userId: '2604418', user: 'Mariana Ferrer Díaz', email: 'marianaferrer@gmail.com', tel: '+58 4143360921', providerId: '455120', provider: 'Leonardo José Ávila',
      servicio: 'Carro', tarifa: 'Carro / 0.40 per KM / 0.16 per minute.', ciudad: 'Caracas, Capital District', pickup: 'Los Palos Grandes, Caracas', destino: 'Torre Británica, Altamira', providerAddr: 'Chacao, Caracas',
      min: -95, estimado: 4.80, monto: 4.80, km: 5.4, realTime: 18.2, surge: 1, pago: 'Pay By Debito Inmediato', pagoEstado: 'Paid', eventos: [{ min: -95, st: 'Accepted' }, { min: -88, st: 'Started' }, { min: -70, st: 'Completed' }] }),
    vj({ id: '86163870', userId: '1144290', user: 'Héctor Lugo', email: 'hectorlugo@gmail.com', tel: '+58 4247001189', providerId: '330981', provider: 'Eduardo Rafael Nava',
      servicio: 'Económico', tarifa: 'Económico / 0.35 per KM / 0.16 per minute.', ciudad: 'Maracaibo, Zulia', pickup: 'Av. Delicias, Maracaibo', destino: 'C.C. Lago Mall', providerAddr: 'Av. Delicias, Maracaibo',
      min: -55, estimado: 3.60, monto: 3.60, km: 6.1, realTime: 14.5, surge: 1, pago: 'Pay By Cash', pagoEstado: 'Paid', eventos: [{ min: -55, st: 'Accepted' }, { min: -50, st: 'Started' }, { min: -36, st: 'Completed' }] })
  );

  /* Datos del Admin completo: usuarios, conductores, reseñas, cuentas, liquidaciones, store…
     reglas: qué acción espera el caso; nunca se envían al navegador. */
  const SIM_ADMIN_DEFAULT = (function () {
    const hoy = 'HOY';   // el navegador lo cambia por la fecha de la simulación
    const u = (id, nombre, o) => Object.assign({ id, nombre, tel: '', email: '', cedula: 'N/A', req: 0, comp: 0, canc: 0, disputas: 0, sos: 0, ciudad: '', wallet: 0, corporate: '—', app: 'android - 6.4.0', ota: '6.4.0',
      registro: '2025-03-14T09:12:00', creadoPor: 'User App', estado: 'Active', documento: 'ok', walletHist: [], records: [], referidos: [] }, o);
    const p = (id, nombre, o) => Object.assign({ id, nombre, tel: '', email: '', req: 0, comp: 0, canc: 0, acc: 0, rating: 4.8, disputas: 0, sos: 0, ciudad: '', ciudadReg: '', servicios: 'Moto', wallet: 0, app: 'android - 6.2.0',
      registro: '2024-08-02T10:00:00', aprobado: '2024-08-05T15:20:00', categoria: 'Impulso', estado: 'Approved', motivoEstado: 'N/A', online: false, ubic: '', vehiculos: [], records: [], cuentas: [], cashBlock: [], liq: null }, o);
    const usuarios = [
      u('302915', 'Daniela Quintero', { tel: '+584141203367', email: 'daniquintero@gmail.com', cedula: 'V-26114830', req: 41, comp: 37, canc: 4, ciudad: 'Caracas', wallet: 0, registro: '2023-02-19T18:40:00',
        walletHist: [{ id: '9150221', tipo: 'Referral', pagoTipo: 'Referral bonus', fecha: '2026-05-02T10:14:00', ciudad: 'Caracas', moneda: 'KM', monto: 5, addcut: 'Add', wallet: 5, desde: 'Referral: Pedro Salas' },
          { id: '9178840', tipo: 'Vencimiento de referidos', pagoTipo: 'System', fecha: hoy, ciudad: 'Caracas', moneda: 'KM', monto: 5, addcut: 'Cut', wallet: 0, desde: 'System' }],
        referidos: [{ nombre: 'Pedro Salas', fecha: '2026-05-02', estado: 'Vencido' }] }),
      u('1873402', 'Kelvin Rojas', { tel: '+584247781902', email: 'kelvinrojas99@gmail.com', cedula: 'N/A', req: 3, comp: 2, canc: 1, ciudad: 'San Cristóbal', documento: 'flash', registro: '2026-11-10T21:03:00' }),
      u('1950733', 'Gabriela Salcedo Mora', { tel: '+584126650148', email: 'gabysalcedo@gmail.com', cedula: 'V-24771906', req: 88, comp: 80, canc: 8, ciudad: 'Barquisimeto', wallet: 1.4,
        walletHist: [{ id: '9177001', tipo: 'Trip', pagoTipo: 'Pay By Wallet', fecha: hoy, ciudad: 'Barquisimeto', moneda: 'USD', monto: 3.2, addcut: 'Cut', wallet: 1.4, desde: 'Trip #86162544' }] }),
      u('2604418', 'Mariana Ferrer Díaz', { tel: '+584143360921', email: 'marianaferrer@gmail.com', cedula: 'V-20339187', req: 156, comp: 149, canc: 7, ciudad: 'Caracas', corporate: '—' }),
      u('1144290', 'Héctor Lugo', { tel: '+584247001189', email: 'hectorlugo@gmail.com', cedula: 'V-17902554', req: 23, comp: 21, canc: 2, disputas: 2, ciudad: 'Maracaibo' }),
      // Trampa: mismo número que el conductor 448203 pero es otra persona (usuaria)
      u('448203', 'Carla Victoria Méndez', { tel: '+584121130547', email: 'carlavmendez@gmail.com', cedula: 'V-19226015', req: 12, comp: 12, ciudad: 'Mérida', registro: '2021-09-30T08:15:00' }),
      u('391577', 'Rafael Contreras', { tel: '+584149900215', email: 'rcontreras@gmail.com', cedula: 'N/A', req: 2, comp: 1, canc: 1, ciudad: 'Puerto Ordaz', registro: '2021-07-11T12:00:00' })
    ];
    const conductores = [
      p('448203', 'Wilmer José Peraza Linárez', { tel: '+584125507712', email: 'wilmerperaza@gmail.com', req: 2210, comp: 2098, canc: 64, acc: 2162, rating: 4.86, ciudad: 'Valencia', ciudadReg: 'Valencia', servicios: 'Moto,Envíos Moto', wallet: 12.4,
        estado: 'Suspended', motivoEstado: 'Strike generado por cancelación del administrador', online: false, ubic: 'Urb. Prebo, Valencia',
        vehiculos: [{ marca: 'Bera', placa: 'AF4K21P', modelo: 'SBR 150', color: 'Rojo', anio: 2022, tipo: 'Moto' }],
        records: [{ id: '5318840', admin: 'System updated', fecha: hoy, motivo: 'Strike generado por cancelación del administrador · Viaje 86160133', tipo: 'Suspended' },
          { id: '5207712', admin: 'Soporte · Analista ATC', fecha: '2026-09-03T11:20:00', motivo: 'Vehículo AF4K21P aprobado', tipo: 'Approved' }] }),
      p('391577', 'Jhonny Alexander Barrios', { tel: '+584166603481', email: 'jhonnybarrios@gmail.com', req: 980, comp: 902, canc: 71, acc: 950, rating: 4.71, ciudad: 'Maracay', ciudadReg: 'Maracay', servicios: 'Moto,Moto Baratica', wallet: 3.1,
        estado: 'Suspended', motivoEstado: 'Límite de cancelaciones', ubic: 'Av. Bolívar, Maracay',
        vehiculos: [{ marca: 'Empire', placa: 'AB2M77K', modelo: 'Horse 150', color: 'Negro', anio: 2021, tipo: 'Moto' }],
        records: [{ id: '5318902', admin: 'System updated', fecha: hoy, motivo: 'Strike generado por cancelación · 3 cancelaciones seguidas', tipo: 'Suspended' }] }),
      p('215664', 'Rosmery Linares', { tel: '+584241197023', email: 'rosmerylinares@gmail.com', req: 3120, comp: 3011, canc: 52, acc: 3080, rating: 4.93, ciudad: 'Caracas', ciudadReg: 'Caracas', servicios: 'Económico,Carro', wallet: 86.35, online: true, ubic: 'Chacao, Caracas',
        vehiculos: [{ marca: 'Chevrolet', placa: 'AB123CD', modelo: 'Aveo', color: 'Gris', anio: 2013, tipo: 'Carro' }],
        cuentas: [{ id: '2', nombre: 'Transferencia Bancaria', banco: 'Banesco', titular: 'Rosmery Linares', numero: '01340412********8821', cedula: 'V-18339201', estado: 'Approved' },
          { id: '1', nombre: 'Pago Movil', banco: 'Banesco', titular: 'Rosmery Linares', numero: '04241197023', cedula: 'V-18339201', estado: 'Approved' }],
        liq: { removido: 'Yes', estadoBanco: 'Rechazado por el banco' } }),
      p('455120', 'Leonardo José Ávila', { tel: '+584142280611', email: 'leoavila@gmail.com', req: 1402, comp: 1350, canc: 30, acc: 1388, rating: 4.42, ciudad: 'Caracas', ciudadReg: 'Caracas', servicios: 'Carro,Económico', wallet: 22.1, online: true, ubic: 'Altamira, Caracas',
        vehiculos: [{ marca: 'Toyota', placa: 'AC556MN', modelo: 'Yaris', color: 'Blanco', anio: 2010, tipo: 'Carro' }] }),
      p('330981', 'Eduardo Rafael Nava', { tel: '+584126601375', email: 'eduardonava@gmail.com', req: 640, comp: 612, canc: 20, acc: 630, rating: 4.88, ciudad: 'Maracaibo', ciudadReg: 'Maracaibo', servicios: 'Económico', wallet: -3.6, online: true, ubic: 'Av. Delicias, Maracaibo',
        vehiculos: [{ marca: 'Ford', placa: 'AA901XY', modelo: 'Fiesta', color: 'Azul', anio: 2008, tipo: 'Carro' }] }),
      p('412870', 'Ramón Antonio Vielma', { tel: '+584145503318', email: 'ramonvielma@gmail.com', req: 510, comp: 470, canc: 35, acc: 498, rating: 4.51, ciudad: 'Barquisimeto', ciudadReg: 'Barquisimeto', servicios: 'Económico', wallet: 9.8, online: true, ubic: 'Av. Lara, Barquisimeto',
        vehiculos: [{ marca: 'Renault', placa: 'AD330PL', modelo: 'Logan', color: 'Plata', anio: 2012, tipo: 'Carro' }] }),
      // Trampa: mismo número que la usuaria 302915 pero es otra persona (conductor)
      p('302915', 'Yorman Daniel Quiñones', { tel: '+584268830142', email: 'yormanq@gmail.com', req: 77, comp: 70, canc: 7, acc: 75, rating: 4.7, ciudad: 'Caracas', ciudadReg: 'Caracas', servicios: 'Moto', wallet: 0.5, ubic: 'Petare, Caracas',
        vehiculos: [{ marca: 'Suzuki', placa: 'AE77Q1M', modelo: 'GN 125', color: 'Negro', anio: 2019, tipo: 'Moto' }] }),
      p('1873402', 'Nelson Paredes', { tel: '+584163345870', email: 'nparedes@gmail.com', estado: 'Unapproved', motivoEstado: 'Documentos pendientes', ciudad: 'Mérida', ciudadReg: 'Mérida', registro: '2026-11-12T10:00:00', aprobado: '' })
    ];
    // Relleno para que las listas se vean llenas (nombres inventados)
    const nombresU = ['Andrea Liscano', 'José Gregorio Uzcátegui', 'Paola Rivero', 'Miguel Ángel Tovar', 'Rosángela Peña', 'Kevin Marcano', 'Luisana Villegas', 'Fernando Chirinos', 'Yelitza Bracho', 'Orlando Mujica', 'Verónica Alfonzo', 'Simón Arteaga'];
    const ciudades = ['Caracas', 'Valencia', 'Maracay', 'Maracaibo', 'Barquisimeto', 'Mérida', 'Puerto La Cruz', 'San Cristóbal', 'Maturín', 'Puerto Ordaz'];
    nombresU.forEach((n, k) => usuarios.push(u(String(3628720 + k * 3), n, { tel: '+58412' + (5501200 + k * 7311), email: n.split(' ')[0].toLowerCase() + (k + 11) + '@gmail.com', cedula: k % 3 ? 'N/A' : 'V-' + (27000000 + k * 31337),
      ciudad: k % 4 ? '' : ciudades[k % ciudades.length], app: k % 3 ? 'android - 6.4.3' : 'ios - 6.5.0', ota: k % 4 === 1 ? 'N/A' : '6.4.3', registro: hoy })));
    const nombresP = ['Darwin Castellanos', 'Johana Carolina Rojas', 'Rubén Velásquez', 'Jimmy Díaz', 'Ángel Alexander Álvarez', 'Edward López', 'Juan Carlos Guzmán', 'Willy Machado', 'Henry Rafael Blanco', 'Daniel Eduardo Pacheco', 'Gregory Castillo', 'Enmanuel Ortega'];
    nombresP.forEach((n, k) => conductores.push(p(String(448210 + k * 3), n, { tel: '+58424' + (1200300 + k * 5113), email: n.split(' ')[0].toLowerCase() + '.' + (k + 3) + '@gmail.com', req: (k * 37) % 60, comp: (k * 29) % 40, canc: k % 4, acc: (k * 31) % 50,
      ciudad: ciudades[(k * 3) % ciudades.length], ciudadReg: ciudades[(k * 3) % ciudades.length], servicios: k % 2 ? 'Moto,Envíos Moto,Moto Baratica' : 'Económico,Carro', wallet: Math.round(((k * 13) % 40) * 10) / 100, online: k % 3 !== 0,
      ubic: ciudades[(k * 3) % ciudades.length], estado: k === 4 ? 'Blocked' : k === 7 ? 'Cash Blocked' : k === 9 ? 'Unapproved' : 'Approved', motivoEstado: k === 4 ? 'Suplantación de identidad' : k === 7 ? 'Deuda en efectivo' : 'N/A',
      registro: hoy, aprobado: k === 9 ? '' : hoy, vehiculos: [{ marca: k % 2 ? 'Tvs' : 'Chevrolet', placa: 'A' + String.fromCharCode(65 + k) + (200 + k) + 'V' + k, modelo: k % 2 ? 'Stryker 125' : 'Spark', color: k % 2 ? 'Negro' : 'Blanco', anio: 2015 + (k % 10), tipo: k % 2 ? 'Moto' : 'Carro' }],
      cuentas: [{ id: '1', nombre: 'Pago Movil', banco: 'Mercantil', titular: n, numero: '0424' + (1200300 + k * 5113), cedula: 'V-' + (19000000 + k * 77123), estado: 'Approved' }] })));
    // Los conductores de los viajes de relleno también existen en Service Providers
    const reviews = [
      { viaje: '86163011', fecha: hoy, userId: '2604418', user: 'Mariana Ferrer Díaz', tercero: '-', userTel: '+58 4143360921', userRate: 1, userComment: 'Muy grosero y el carro estaba sucio', providerId: '455120', provider: 'Leonardo José Ávila', providerTel: '+58 4142280611', providerRate: 5, providerComment: '', contactado: false, estado: 'Bad Review' },
      { viaje: '86162544', fecha: hoy, userId: '1950733', user: 'Gabriela Salcedo Mora', tercero: '-', userTel: '+58 4126650148', userRate: 1, userComment: 'Nunca llegó', providerId: '412870', provider: 'Ramón Antonio Vielma', providerTel: '+58 4145503318', providerRate: 0, providerComment: '', contactado: false, estado: 'Bad Review' },
      { viaje: '86163870', fecha: hoy, userId: '1144290', user: 'Héctor Lugo', tercero: '-', userTel: '+58 4247001189', userRate: 5, userComment: 'Rated by the system', providerId: '330981', provider: 'Eduardo Rafael Nava', providerTel: '+58 4126601375', providerRate: 1, providerComment: 'No me pagó el efectivo', contactado: false, estado: 'Bad Review' }
    ];
    const liquidaciones = ['Corte 10/11/2026 - 16/11/2026', 'Corte 03/11/2026 - 09/11/2026', 'Corte 27/10/2026 - 02/11/2026'];
    const almacenes = [['BARQUISIMETO', 543], ['MÉRIDA', 383], ['SAN CRISTÓBAL', 728], ['PTO LA CRUZ', 435], ['MARACAIBO', 1334], ['VALENCIA', 182], ['PTO ORDAZ', 1217], ['CARACAS', 637]];
    const stock = ['SUDADERA VERDE MANGA LARGA CON CAPUCHA', 'SUDADERA VERDE MANGA LARGA BOX - NUEVO', 'CASCO INTEGRAL RIDERY', 'CHAQUETA IMPERMEABLE RIDERY', 'BOLSO DE ENVÍOS 45L'];
    const servicios = [['Moto', 0.21, 0.17, 0.80], ['Moto Baratica', 0.18, 0.10, 0.60], ['Económico', 0.35, 0.16, 1.20], ['Baratica', 0.25, 0.12, 0.90], ['Carro', 0.40, 0.16, 1.40], ['Ridery Premium', 0.60, 0.20, 2.50], ['Camioneta', 0.55, 0.18, 2.00], ['Envíos Moto', 0.22, 0.10, 1.00]];
    const promos = [['BIENVENIDO', '20%', 'Primer viaje', 'Active', '2026-12-31'], ['RIDERYMOTO', '$0.50', 'Moto y Moto Baratica', 'Active', '2026-11-30'], ['NAVIDAD26', '15%', 'Todas las flotas', 'Inactive', '2026-12-24'], ['CORPORATIVO', '10%', 'Cuentas corporativas', 'Active', '2027-01-31']];
    return { usuarios, conductores, reviews, liquidaciones, almacenes, stock, servicios, promos, cancelaciones: CANCELACIONES_ADMIN, tiposWallet: TIPOS_WALLET,
      reglas: [
        { accion: 'agregar-wallet', objetivo: 'u:302915', v: 'buena', tipo: 'Vencimiento de referidos', monto: 5, nota: 'Abonó los KM vencidos con el tipo correcto.' },
        { accion: 'rechazar-cuenta', objetivo: 'p:215664', v: 'buena', nota: 'Rechazó la cuenta para que la conductora la cargue de nuevo.' },
        { accion: 'contactado', objetivo: '86163011', v: 'buena', nota: 'Marcó la reseña como contactada.' },
        { accion: 'contactado', objetivo: '86163870', v: 'buena', nota: 'Marcó la reseña como contactada.' },
        { accion: 'contactado', objetivo: '86162544', v: 'buena', nota: 'Marcó la reseña como contactada.' },
        { accion: 'reporte-usuario', objetivo: 'u:1144290', v: 'buena', nota: 'Dejó el reporte del usuario que no pagó el efectivo.' }
      ] };
  })();
  // Acciones del Admin completo y cómo se califican si no hay una regla que las espere
  const SIM_ACCIONES_ADMIN = {
    'agregar-wallet': ['Add Wallet', 'mala', 'Abonó saldo a una wallet sin que el caso lo pidiera.'],
    'rechazar-cuenta': ['Reject (cuenta bancaria)', 'mala', 'Rechazó una cuenta bancaria sin motivo.'],
    'contactado': ['Contacted (reseña)', null, ''],
    'declinar-usuario': ['Decline (usuario)', 'mala', 'Declinó (sancionó) a un usuario sin motivo.'],
    'eliminar-usuario': ['Delete User', 'mala', 'Eliminó una cuenta: esta herramienta nunca se usa en soporte.'],
    'eliminar-conductor': ['Delete Provider', 'mala', 'Eliminó un conductor: esta herramienta nunca se usa en soporte.'],
    'cambiar-clave': ['Change Password', 'mala', 'Cambió la clave de un usuario sin que lo pidiera.'],
    'reporte-usuario': ["User's Records (reporte)", null, '']
  };

  const SIMULADOR_DEFAULT = { activo: true, ordenNiveles: true, intentos: 0, aprobacion: 80, velocidad: 10, niveles: SIM_NIVELES_DEFAULT, motivos: SIM_MOTIVOS_DEFAULT, casos: SIM_CASOS_DEFAULT, ordenes: SIM_ORDENES_DEFAULT, viajes: SIM_VIAJES_DEFAULT, admin: SIM_ADMIN_DEFAULT };

  /* Revisión básica de ortografía para las respuestas escritas («Otro»): la ve Calidad al calificar. */
  const SIN_TILDE = { tambien: 'también', ademas: 'además', despues: 'después', informacion: 'información', direccion: 'dirección', numero: 'número', gestion: 'gestión', solucion: 'solución',
    dias: 'días', podria: 'podría', envio: 'envío', rapido: 'rápido', aqui: 'aquí', ahi: 'ahí', asi: 'así', facil: 'fácil', ultimo: 'último', telefono: 'teléfono', metodo: 'método',
    minimo: 'mínimo', maximo: 'máximo', unico: 'único', cancelacion: 'cancelación', verificacion: 'verificación', atencion: 'atención', compensacion: 'compensación', disculpas: null,
    transaccion: 'transacción', estare: 'estaré', revisare: 'revisaré', podras: 'podrás', tendras: 'tendrás', recibiras: 'recibirás', llegara: 'llegará', comunicare: 'comunicaré',
    porfavor: 'por favor', aver: 'a ver', haber: null, enseguida: null, inconvenientes: null, tecnico: 'técnico', automatico: 'automático', rapidamente: 'rápidamente', mas: 'más' };
  const ABREVIATURAS = ['q', 'k', 'xq', 'pq', 'tb', 'tmb', 'x', 'd', 'bn', 'ntp', 'tqm', 'msj', 'xfa', 'porfa', 'ok', 'okey', 'oki', 'dale', 'chamo', 'pana', 'vale'];
  function revisarOrtografia(texto) {
    const t = String(texto || '').trim(), notas = [];
    if (!t) return notas;
    if (/^[a-záéíóúñ]/.test(t)) notas.push('Empieza en minúscula.');
    if (!/[.!?…)]$/.test(t)) notas.push('No cierra con punto.');
    if (/\?/.test(t) && !/¿/.test(t)) notas.push('Falta el signo de apertura «¿».');
    if (/!/.test(t) && !/¡/.test(t)) notas.push('Falta el signo de apertura «¡».');
    const palabras = t.toLowerCase().match(/[a-záéíóúüñ]+/g) || [];
    const abre = [...new Set(palabras.filter(p => ABREVIATURAS.includes(p)))];
    if (abre.length) notas.push('Abreviaturas o muletillas: ' + abre.join(', ') + '.');
    const tildes = [...new Set(palabras.filter(p => SIN_TILDE[p]))];
    if (tildes.length) notas.push('Posibles tildes o palabras mal escritas: ' + tildes.map(p => p + ' → ' + SIN_TILDE[p]).join(', ') + '.');
    if (/([a-z])\1{2,}/i.test(t)) notas.push('Letras repetidas (ej. «holaaa»).');
    if (t.length > 12 && t === t.toUpperCase() && /[A-Z]/.test(t)) notas.push('Escrito todo en mayúsculas.');
    if (/\s{2,}/.test(t)) notas.push('Espacios dobles.');
    return notas;
  }

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
      cfg.secciones = []; cfg.formulario = 2;   // formulario vacío: se arma en el panel o se importa
      for (const m of MODULOS_EJEMPLO) await store.put('modulos', m);
      await store.put('cohortes', { _id: 'CX-2026-10', nombre: 'Cohorte de ejemplo · octubre 2026', activa: true, creado: ahora() });
    }
    if (!cfg.formulario) {                       // migración: el test de antes pasa a la sección "Tu estilo de trabajo"
      const viejas = (await store.find('preguntas', {})).filter(p => !p.seccion);
      for (const p of viejas) { p.seccion = SECCION_ANTIGUA.id; p.tipo = 'unica'; await store.put('preguntas', p); }
      cfg.secciones = cfg.secciones || (viejas.length ? [SECCION_ANTIGUA] : []); cfg.formulario = 2;
      await store.put('config', cfg);
    }
    cfg.secciones = cfg.secciones || [];
    cfg.reglas = Object.assign({}, REGLAS_DEFAULT, cfg.reglas || {});
    cfg.boost = cfg.boost || {};
    cfg.boost.mecanografia = Object.assign({}, BOOST_DEFAULT.mecanografia, cfg.boost.mecanografia || {});
    cfg.boost.extra = Object.assign(Object.fromEntries(Object.keys(BOOST_ACTIVIDADES).map(k => [k, true])), cfg.boost.extra || {});
    return cfg;
  }

  // Preguntas de la evaluación de capacitación: las guardadas o las de fábrica.
  function preguntasCapacitacion(cfg) {
    const g = cfg && cfg.capacitacion && Array.isArray(cfg.capacitacion.preguntas) && cfg.capacitacion.preguntas.length ? cfg.capacitacion.preguntas : EVAL_CAP_DEFAULT;
    return g.map(p => Object.assign({}, p, { opciones: (p.opciones || []).slice() }));
  }
  function normalizarPreguntasCap(lista) {
    if (!Array.isArray(lista) || !lista.length) throw err(400, 'Agrega al menos una pregunta.');
    if (lista.length > 20) throw err(400, 'Máximo 20 preguntas.');
    const ids = {};
    return lista.map((p, i) => {
      const texto = limpiar(p && p.texto, 160);
      if (texto.length < 3) throw err(400, 'La pregunta ' + (i + 1) + ' no tiene texto.');
      const opciones = (Array.isArray(p.opciones) ? p.opciones : []).map(o => limpiar(o, 60)).filter(Boolean);
      if (opciones.length < 2 || opciones.length > 8) throw err(400, '«' + texto + '» necesita entre 2 y 8 opciones.');
      let id = limpiar(p.id, 40).toLowerCase().replace(/[^a-z0-9-]/g, '') || ('p' + (i + 1));
      while (ids[id]) id += 'x';
      ids[id] = true;
      const tipo = p.tipo === 'multiple' ? 'multiple' : 'unica';
      const x = { id, texto, tipo, opciones };
      if (tipo === 'multiple' && Number.isInteger(p.exclusiva) && opciones[p.exclusiva]) x.exclusiva = p.exclusiva;
      return x;
    });
  }
  // Valida las respuestas de una evaluación contra las preguntas. Todas obligatorias.
  function respuestasCapacitacion(preguntas, entrada) {
    const e = entrada && typeof entrada === 'object' ? entrada : {};
    const out = {};
    for (const p of preguntas) {
      const v = e[p.id];
      if (p.tipo === 'multiple') {
        let sel = [...new Set((Array.isArray(v) ? v : []).map(Number))].filter(i => Number.isInteger(i) && p.opciones[i] != null).sort((a, b) => a - b);
        if (Number.isInteger(p.exclusiva) && sel.includes(p.exclusiva) && sel.length > 1) sel = sel.filter(i => i !== p.exclusiva);
        if (!sel.length) throw err(400, 'Falta responder: ' + p.texto);
        out[p.id] = { opciones: sel, texto: sel.map(i => p.opciones[i]).join(' · ') };
      } else {
        const i = v === '' || v == null ? NaN : Number(v);
        if (!Number.isInteger(i) || p.opciones[i] == null) throw err(400, 'Falta responder: ' + p.texto);
        out[p.id] = { opcion: i, texto: p.opciones[i] };
      }
    }
    return out;
  }

  // Valida y limpia una pregunta (desde el panel o desde un archivo importado). Lanza error si algo no cuadra.
  function normalizarPregunta(p, secciones) {
      const texto = limpiar(p.texto, 600);
      const tipo = TIPOS[p.tipo] ? p.tipo : 'unica';
      const seccion = secciones.some(s => s.id === p.seccion) ? p.seccion : null;
      if (!seccion) throw err(400, 'Elige la sección de la pregunta.');
      const conOpciones = tipo === 'unica' || tipo === 'multiple';
      const opciones = !conOpciones ? [] : (p.opciones || []).map(o => {
        const x = { texto: limpiar(o.texto, 300), puntos: Object.fromEntries(Object.entries(o.puntos || {}).filter(([, v]) => Number(v)).map(([k, v]) => [limpiar(k, 40), Number(v)])) };
        if (tipo === 'unica' && o.correcta) x.correcta = true;
        if (o.filtro === 'alerta' || o.filtro === 'descarta') x.filtro = o.filtro;
        if (tipo === 'multiple' && o.exclusiva) x.exclusiva = true;
        return x;
      }).filter(o => o.texto);
      if (!texto) throw err(400, 'Escribe el texto de la pregunta.');
      if (conOpciones && opciones.length < 2) throw err(400, 'Agrega al menos dos opciones.');
      if (opciones.filter(o => o.correcta).length > 1) throw err(400, 'Marca solo una respuesta correcta.');
      const doc = { _id: p._id ? limpiar(p._id, 60) : nuevoId('p'), seccion, tipo, texto, ayuda: limpiar(p.ayuda, 300), opciones, activa: p.activa !== false, obligatoria: p.obligatoria !== false, orden: Number(p.orden) || 0 };
      if (tipo === 'multiple' && p.permiteOtro) doc.permiteOtro = true;
      if (tipo === 'larga' && p.sinPegar) doc.sinPegar = true;
      return doc;
  }

  /* ---------- Rutas: secciones que se muestran según los puntos ----------
     Una sección puede tener condicion = { celulas: ['SUPPLY', ...], top: 3 }:
     solo se muestra si alguna de esas células está entre las "top" con más puntos,
     contando SOLO las preguntas de perfil (con puntos, sin respuesta correcta) de las secciones visibles que vienen antes.
     Así se arma el embudo: preguntas generales → área → casos de la célula. */
  function normalizarCondicion(c) {
    if (!c || !Array.isArray(c.celulas)) return null;
    const celulas = [...new Set(c.celulas.map(x => limpiar(x, 40)).filter(Boolean))].slice(0, 12);
    if (!celulas.length) return null;
    return { celulas, top: Math.max(1, Math.min(10, Math.round(Number(c.top) || 2))) };
  }
  function cumpleCondicion(cond, puntajes) {
    if (!cond) return true;
    const ranking = Object.entries(puntajes).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    if (!ranking.length) return false;
    const corte = (ranking[Math.min(cond.top, ranking.length) - 1] || [])[1];   // empates con el último puesto también entran
    return ranking.some(([c, v]) => v >= corte && cond.celulas.includes(c));
  }
  function sumarPuntos(puntajes, p, respuesta) {
    for (const idx of elegidas(respuesta)) {
      const o = p.opciones && p.opciones[idx];
      if (o) for (const [cel, v] of Object.entries(o.puntos || {})) puntajes[cel] = (puntajes[cel] || 0) + Number(v || 0);
    }
  }
  const esDeRuta = p => (p.tipo === 'unica' || p.tipo === 'multiple' || !p.tipo) && (p.opciones || []).some(o => Object.keys(o.puntos || {}).length) && !(p.opciones || []).some(o => o.correcta);
  // Devuelve los ids de las secciones que le tocan a esta persona según lo que ha respondido
  function seccionesVisibles(secciones, preguntas, respuestas) {
    const puntajes = {}, visibles = [];
    let pendiente = false;   // si falta responder algo antes, las secciones con ruta todavía no se deciden
    // Secciones con ruta seguidas y con el mismo "top" forman un bloque (ej. las 3 áreas, o los casos de cada célula):
    // se deciden juntas con los puntos que había ANTES del bloque, para que una no le quite el lugar a la otra.
    let bloque = null;
    for (const sec of secciones) {
      const suyas = preguntas.filter(p => p.seccion === sec.id);
      if (!suyas.length) continue;
      if (sec.condicion) {
        if (!bloque || bloque.top !== sec.condicion.top) bloque = { top: sec.condicion.top, puntajes: Object.assign({}, puntajes), pendiente };
        if (bloque.pendiente || !cumpleCondicion(sec.condicion, bloque.puntajes)) continue;
      } else bloque = null;
      visibles.push(sec.id);
      // Solo mueven la ruta las preguntas de perfil (con puntos y sin respuesta correcta).
      // Los casos evaluados suman a la célula final, pero no cambian qué secciones aparecen.
      suyas.filter(esDeRuta).forEach(p => {
        const v = respuestas[p._id];
        if (p.obligatoria !== false && (v == null || v === '' || (typeof v === 'object' && !elegidas(v).length && !v.otro))) pendiente = true;
        sumarPuntos(puntajes, p, v);
      });
    }
    return visibles;
  }

  /* ---------- Test de perfil ---------- */
  // Índices elegidos: una respuesta "unica" es un número; una "multiple" es { sel: [..], otro: '' }
  const elegidas = v => v == null || v === '' ? [] : Array.isArray(v) ? v : (typeof v === 'object' ? (v.sel || []) : [v]);
  const ordenSeccion = (secciones, id) => { const i = secciones.findIndex(s => s.id === id); return i === -1 ? 999 : i; };
  function ordenarPreguntas(preguntas, secciones) {
    return preguntas.slice().sort((a, b) => (ordenSeccion(secciones, a.seccion) - ordenSeccion(secciones, b.seccion)) || ((a.orden || 0) - (b.orden || 0)));
  }

  // Revisa y califica las respuestas de Postúlate. Lanza error si falta algo obligatorio.
  function evaluarPostulacion(preguntas, secciones, entrada, reglas) {
    const limpias = {}, respuestas = {}, alertas = [], descartes = [], faltan = [];
    let correctas = 0, evaluadas = 0;
    for (const p of preguntas) {
      const v = entrada[p._id], tipo = p.tipo || 'unica', ops = p.opciones || [];
      let r;
      if (tipo === 'unica') {
        const i = v === '' || v == null ? null : Number(v);
        r = Number.isInteger(i) && ops[i] ? i : null;
      } else if (tipo === 'multiple') {
        const sel = [...new Set(elegidas(v).map(Number))].filter(i => Number.isInteger(i) && ops[i]);
        const otro = p.permiteOtro && v && typeof v === 'object' ? limpiar(v.otro, 200) : '';
        r = (sel.length || otro) ? { sel, otro } : null;
      } else {
        const t = limpiar(v, tipo === 'larga' ? 4000 : 300);
        r = t || null;
      }
      if (r == null) { if (p.obligatoria !== false) faltan.push(p); continue; }
      limpias[p._id] = r;
      const idxs = tipo === 'unica' || tipo === 'multiple' ? elegidas(r) : [], opsElegidas = idxs.map(i => ops[i]);
      const evaluable = tipo === 'unica' && ops.some(o => o.correcta);
      const acierto = evaluable ? !!ops[r].correcta : null;
      if (evaluable) { evaluadas++; if (acierto) correctas++; }
      opsElegidas.forEach(o => {
        if (o.filtro === 'descarta') descartes.push(o.texto);
        else if (o.filtro === 'alerta') alertas.push(o.texto);
      });
      respuestas[p._id] = { pregunta: p.texto, seccion: p.seccion, tipo,
        opcion: tipo === 'unica' ? r : undefined, opciones: tipo === 'multiple' ? idxs : undefined,
        texto: tipo === 'unica' || tipo === 'multiple' ? opsElegidas.map(o => o.texto).concat(r.otro ? ['Otro: ' + r.otro] : []).join(' · ') : r,
        acierto, correcta: evaluable && !acierto ? (ops.find(o => o.correcta) || {}).texto : undefined };
    }
    if (faltan.length) {
      const sec = secciones.find(s => s.id === faltan[0].seccion);
      throw err(400, (faltan.length === 1 ? 'Falta 1 pregunta' : 'Faltan ' + faltan.length + ' preguntas') + ' por responder' + (sec ? ' (empieza por «' + sec.titulo + '»)' : '') + '.');
    }
    const cel = calcularCelula(preguntas, limpias, reglas);
    return Object.assign(cel, { respuestas, alertas, descartes,
      evaluacion: { correctas, total: evaluadas, nota: evaluadas ? Math.round(correctas * 100 / evaluadas) : null } });
  }

  function calcularCelula(preguntas, respuestas, reglas) {
    const puntajes = {};
    for (const p of preguntas) {
      for (const idx of elegidas(respuestas[p._id])) {
        const opcion = p.opciones && p.opciones[idx];
        if (!opcion) continue;
        for (const [cel, v] of Object.entries(opcion.puntos || {})) puntajes[cel] = (puntajes[cel] || 0) + Number(v || 0);
      }
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
      if (String(clave).length < 8) throw err(400, 'La contraseña debe tener al menos 8 caracteres.');
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
    if ((asp.claveFecha || null) !== (user.v || null)) throw err(401, 'Tu contraseña cambió. Vuelve a entrar con la nueva.');
    return asp;
  }

  /* ---------- Acciones públicas (Postúlate) ---------- */
  const publico = {
    async test({ store }) {
      await cargarConfig(store);
      const cfg = await cargarConfig(store);
      const preguntas = ordenarPreguntas((await store.find('preguntas', {})).filter(p => p.activa !== false), cfg.secciones);
      const usadas = new Set(preguntas.map(p => p.seccion));
      // Nunca se envían puntos, respuestas correctas ni filtros: solo lo que la persona necesita para responder
      return {
        secciones: cfg.secciones.filter(s => usadas.has(s.id)).map(s => ({ id: s.id, titulo: s.titulo, descripcion: s.descripcion || '', condicional: !!s.condicion })),
        preguntas: preguntas.filter(p => cfg.secciones.some(s => s.id === p.seccion)).map(p => ({ _id: p._id, seccion: p.seccion, tipo: p.tipo || 'unica', texto: p.texto, ayuda: p.ayuda || '',
          obligatoria: p.obligatoria !== false, permiteOtro: !!p.permiteOtro, sinPegar: !!p.sinPegar,
          opciones: (p.opciones || []).map(o => o.texto), exclusivas: (p.opciones || []).map((o, i) => o.exclusiva ? i : -1).filter(i => i >= 0) }))
      };
    },
    // Qué secciones le tocan según lo respondido hasta ahora (los puntos nunca salen del servidor)
    async ruta({ store, body }) {
      const cfg = await cargarConfig(store);
      const preguntas = (await store.find('preguntas', {})).filter(p => p.activa !== false);
      return { visibles: seccionesVisibles(cfg.secciones, preguntas, (body.respuestas && typeof body.respuestas === 'object') ? body.respuestas : {}) };
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
      const edad = Math.round(Number(d.edad));
      if (nombre.length < 3) throw err(400, 'Escribe tu nombre y apellido.');
      if (!cedula) throw err(400, 'Escribe tu cédula.');
      if (!(edad >= 16 && edad <= 80)) throw err(400, 'Escribe tu edad en números.');
      const id = 'asp-' + cedula;
      if (await store.get('aspirantes', id)) throw err(409, 'Ya existe una postulación con esta cédula.');
      const preguntas = ordenarPreguntas((await store.find('preguntas', {})).filter(p => p.activa !== false && cfg.secciones.some(s => s.id === p.seccion)), cfg.secciones);
      const entrada = (body.respuestas && typeof body.respuestas === 'object') ? body.respuestas : {};
      const visibles = seccionesVisibles(cfg.secciones, preguntas, entrada);   // las secciones que no le tocaron no se exigen ni se cuentan
      const r = evaluarPostulacion(preguntas.filter(p => visibles.includes(p.seccion)), cfg.secciones, entrada, cfg.reglas);
      r.recorrido = visibles;
      const asp = { _id: id, cedula, nombre, edad, email: limpiar(d.email, 120), telefono: limpiar(d.telefono, 30), ciudad: limpiar(d.ciudad, 60),
        estado: r.descartes.length ? 'descartado' : 'postulado', creado: ahora(), ultimoAcceso: ahora(), cohorte: null, celula: r.celula, progreso: {}, examenes: {},
        test: { version: 2, fecha: ahora(), respuestas: r.respuestas, puntajes: r.puntajes, ranking: r.ranking, estado: r.estado, motivo: r.motivo, celulaSugerida: r.celula,
          evaluacion: r.evaluacion, alertas: r.alertas, descartes: r.descartes, recorrido: r.recorrido } };
      if (r.descartes.length) asp.motivoDescarte = 'Descarte automático: ' + r.descartes.join(' · ');
      await store.put('aspirantes', asp);
      return { ok: true, nombre };     // la persona no ve su nota ni su célula: eso lo revisa el equipo
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

  /* ---------- Simulador: motor ----------
     Todo se guarda dentro del aspirante (asp.simulador), igual que Boost:
       { extra: { nivel: n }, sesiones: [{ id, nivel, inicio, fin, estado: 'en-curso'|'terminada', velocidad, minutos, panel, conEstados,
           casos: [{ id, numero, llegada, humor, paso, pasos, chat, respuestas, motivo, motivoOk, estadoTicket, estadoOk, cerrado, primera }],
           acciones: [{ orden, accion, min, f, v, nota, texto, c, e, rep, rol }], resumen }] } */
  function configSim(cfg) {
    const s = Object.assign({}, SIMULADOR_DEFAULT, cfg.simulador || {});
    s.motivos = (s.motivos && s.motivos.length) ? s.motivos : SIM_MOTIVOS_DEFAULT;
    s.casos = s.casos || []; s.ordenes = s.ordenes || [];
    s.niveles = (s.niveles && s.niveles.length) ? s.niveles : SIM_NIVELES_DEFAULT;
    s.viajes = (s.viajes && s.viajes.length) ? s.viajes : SIM_VIAJES_DEFAULT;
    // Configuraciones guardadas antes de las rutas VIAJES y CÉLULAS: se agregan sus niveles, casos y viajes de ejemplo
    s.niveles = s.niveles.map(n => Object.assign({ ruta: 'ORDERS' }, n));
    for (const ruta of ['VIAJES', 'CELULAS']) {
      if (s.niveles.some(n => n.ruta === ruta)) continue;
      const nuevos = SIM_NIVELES_DEFAULT.filter(n => n.ruta === ruta);
      s.niveles = s.niveles.concat(nuevos);
      const ids = new Set([].concat(...nuevos.map(n => n.casos)));
      SIM_CASOS_DEFAULT.filter(c => ids.has(c.id) && !s.casos.some(x => x.id === c.id)).forEach(c => s.casos.push(c));
      SIM_MOTIVOS_DEFAULT.filter(m => !s.motivos.includes(m)).forEach(m => s.motivos.push(m));
      SIM_VIAJES_DEFAULT.filter(v => !s.viajes.some(x => x.id === v.id)).forEach(v => s.viajes.push(v));
    }
    s.admin = Object.assign({}, SIM_ADMIN_DEFAULT, s.admin || {});
    s.niveles = s.niveles.map(n => n.ruta === 'VIAJES' && !n.adminModulos ? Object.assign({ adminModulos: ['trips'] }, n) : n);
    // Configuraciones guardadas antes de los intentos ilimitados: se pasan a ilimitados (0) con nota de aprobación 80 %
    if (!cfg.simulador || cfg.simulador.aprobacion == null) { s.intentos = 0; s.aprobacion = 80; }
    s.aprobacion = Number(s.aprobacion) || 80;
    return s;
  }
  const humorTxt = h => SIM_HUMOR[Math.max(0, Math.min(4, h))];
  const segDesde = iso => (Date.now() - Date.parse(iso)) / 1000;
  const segSes = ses => segDesde(ses.inicio);
  const minutoSim = ses => Math.round(segSes(ses) / 60 * (ses.velocidad || 10) * 10) / 10;
  const vencida = ses => ses.estado === 'en-curso' && segSes(ses) > (ses.minutos || 20) * 60 + 5;
  const llego = (ses, c) => c.llegada != null && c.llegada <= segSes(ses) + 2;
  // Tiempo que tarda el cliente en «escribir» sus mensajes (el navegador usa la misma cuenta)
  const tipeo = ms => ms.length ? 0.9 + ms.reduce((t, m) => t + 1 + Math.min(2.6, String(m).length * 0.035), 0) : 0;
  // Pasos de la línea principal (sin ramas): base del puntaje máximo
  const pasosBase = d => d.pasos.filter(p => !p.rama).length;
  // Siguiente paso según la opción elegida: salto a una rama, fin, o el que sigue (las ramas no se recorren solas)
  function siguientePaso(d, actual, o) {
    if (o && o.fin) return -1;
    if (o && o.ir) { const k = d.pasos.findIndex(p => p.id === o.ir); return k; }
    const k = actual + 1, sig = d.pasos[k];
    if (!sig || (sig.rama && !d.pasos[actual].rama)) return -1;
    return k;
  }
  // Abandono: si el cliente espera respuesta más de «abandono» segundos, se va y el ticket se cierra
  function revisarAbandono(ses) {
    if (!ses.abandono || ses.estado !== 'en-curso') return false;
    const ahoraS = segSes(ses); let hubo = false;
    for (const c of ses.casos) {
      if (c.cerrado || c.llegada == null || c.esperaCliente === false) continue;
      const desde = c.ultimoCliente != null ? c.ultimoCliente : c.llegada;
      if (ahoraS - desde > ses.abandono) {
        c.cerrado = true; c.abandonado = true; c.estadoTicket = 'abandonado'; c.humor = Math.min(c.humor, 1); c.cerradoF = ahora();
        c.chat.push({ de: 'sistema', t: 'El cliente abandonó la conversación por falta de respuesta.' });
        hubo = true;
      }
    }
    if (hubo) liberarTickets(ses);
    return hubo;
  }

  // Llegada progresiva: nunca más de maxAbiertos tickets abiertos a la vez
  function liberarTickets(ses) {
    if (!ses.maxAbiertos) return;
    const t = segSes(ses);
    const abiertos = ses.casos.filter(c => c.llegada != null && !c.cerrado && !c.aparcado).length;   // un ticket enviado como Abierto libera el cupo
    let libres = ses.maxAbiertos - abiertos, k = 0;
    for (const c of ses.casos) {
      if (libres <= 0) break;
      if (c.llegada == null) { c.llegada = Math.round(t + (ses.intervalo || 8) * (1 + k)); c.ultimoCliente = c.llegada; k++; libres--; }
    }
  }

  // Estado de una orden en el minuto `min` del panel, con lo que cambiaron las acciones del aspirante
  function estadoOrden(o, min, acciones) {
    const r = { c: 'No iniciada', e: 'Aceptada', rep: '', rol: '' };
    const pasos = (o.eventos || []).map(x => Object.assign({}, x))
      .concat((acciones || []).filter(a => a.orden === o.id && (a.c || a.e || a.rep)).map(a => ({ min: a.min, c: a.c, e: a.e, rep: a.rep, rol: a.rol, forzado: true })))
      .sort((a, b) => a.min - b.min);
    let fijo = false;
    for (const p of pasos) {
      if (p.min > min) break;
      if (fijo && !p.forzado) continue;
      if (p.c) r.c = p.c; if (p.e) r.e = p.e;
      if (p.rep) { r.rep = p.rep; r.rol = p.rol || 'Repartidor'; }
      if (p.forzado && (p.c === 'Cancelada' || ['Cancelada', 'En camino', 'Completada'].includes(p.e))) fijo = true;
    }
    return r;
  }
  // Estatus de un viaje del Admin en el minuto `min` (o el que fijó el aspirante al cancelarlo)
  function estadoViaje(v, min, acciones) {
    const canc = (acciones || []).find(a => a.herramienta === 'admin' && a.orden === v.id && a.st);
    if (canc && canc.min <= min) return canc.st;
    let st = '';
    for (const e of (v.eventos || [])) if (e.min <= min) st = e.st;
    return st;
  }
  const ordenCerrada = st => st.c === 'Cancelada' || ['Cancelada', 'Completada'].includes(st.e);

  // Calificación del cliente (como la encuesta de satisfacción de Zendesk): sale del humor final del cliente
  const csatDe = c => c.abandonado ? 'Mal' : !c.respuestas.length ? 'Sin atender' : c.humor >= 3 ? 'Bien' : 'Mal';
  function puntosSim(ses, s) {
    let tp = 0, tmax = 0, pendientes = 0, resueltos = 0, ortografia = 0; const prim = [];
    for (const c of ses.casos) {
      tmax += Math.max(c.pasos || 0, c.respuestas.length) * 2 + 2 + (ses.conEstados ? 2 : 0);
      for (const r of c.respuestas) {
        if (r.v === 'pendiente') pendientes++; else tp += SIM_PUNTOS[r.v] || 0;
        if (r.ortografia && r.ortografia.length) ortografia++;
      }
      if (c.motivoOk) tp += 2;
      if (ses.conEstados && c.estadoOk) tp += 2;
      if (c.consulta) { tmax += 2; if (c.verifico) tp += 2; }
      if (c.cerrado) resueltos++;
      if (c.primera != null) prim.push(c.primera);
    }
    let op = 0, omax = 0; const sinGestion = [];
    if (ses.panel) {
      for (const o of s.ordenes) for (const r of (o.reglas || []).filter(x => x.esperada)) {
        omax += 2;
        if (!ses.acciones.some(a => a.orden === o.id && a.accion === r.accion && a.v === 'buena')) sinGestion.push(o.id + ' · ' + (SIM_ACCIONES[r.accion] || r.accion) + ': ' + r.nota);
      }
      const vistos = new Set();
      for (const a of ses.acciones) {
        if (a.herramienta === 'admin') continue;
        const k = a.orden + '|' + a.accion;
        if (vistos.has(k) || a.v == null) continue; vistos.add(k);
        op += SIM_PUNTOS[a.v] || 0;
      }
      op = Math.min(op, omax);
    }
    if ((ses.herramientas || []).includes('admin')) {
      const ACC = { 'cancelar-viaje': 'Cancel Trip' };
      for (const c of ses.casos) {
        const d = s.casos.find(x => x.id === c.id), e = d && d.adminEsperada;
        if (!e) continue;
        omax += 2;
        const hecha = ses.acciones.find(a => a.herramienta === 'admin' && a.accion === e.accion && a.orden === e.objetivo && (a.v === 'buena' || a.v === 'regular'));
        if (hecha) op += SIM_PUNTOS[hecha.v]; else sinGestion.push('Admin · ' + (ACC[e.accion] || (SIM_ACCIONES_ADMIN[e.accion] || [e.accion])[0]) + ': ' + e.nota);
      }
    }
    const max = tmax + omax, pts = tp + op;
    const csat = { bien: ses.casos.filter(c => csatDe(c) === 'Bien').length, mal: ses.casos.filter(c => csatDe(c) === 'Mal').length, sinAtender: ses.casos.filter(c => csatDe(c) === 'Sin atender').length };
    const conConsulta = ses.casos.filter(c => c.consulta && c.verifico != null);
    const verificacion = { hechas: conConsulta.filter(c => c.verifico).length, total: ses.casos.filter(c => c.consulta).length };
    return { nota: max ? Math.round(pts / max * 100) : 0, pts, max, pendientes, ortografia, csat, verificacion, tickets: { pts: tp, max: tmax, resueltos, total: ses.casos.length },
      ordenes: { pts: op, max: omax, acciones: ses.acciones.length, malas: ses.acciones.filter(a => a.v === 'mala').length, sinGestion },
      primeraPromedio: prim.length ? Math.round(prim.reduce((x, y) => x + y, 0) / prim.length) : null };
  }
  function terminarSim(ses, s) {
    revisarAbandono(ses);
    if (ses.estado !== 'terminada') { ses.estado = 'terminada'; ses.fin = ahora(); }
    ses.resumen = puntosSim(ses, s);
  }

  // Lo que ve el aspirante: textos, estados y tiempos. Nunca qué es correcto ni las reglas.
  function vistaSim(ses, s) {
    const def = id => s.casos.find(c => c.id === id) || { pasos: [], cliente: {} };
    const nivel = s.niveles.find(n => n.id === ses.nivel) || {};
    return {
      id: ses.id, nivel: ses.nivel, nivelNombre: nivel.nombre || ses.nivel, intento: ses.intento || null, ilimitado: !(Number(s.intentos) > 0), adminModulos: nivel.adminModulos || null, inicio: ses.inicio, ahora: ahora(), estado: ses.estado, velocidad: ses.velocidad, minutos: ses.minutos,
      panel: !!ses.panel, herramientas: ses.herramientas || (ses.panel ? ['zupper'] : []), conEstados: !!ses.conEstados, abandono: ses.abandono || 0, estadosTicket: SIM_ESTADOS_TICKET, motivos: s.motivos, acciones: SIM_ACCIONES,
      tickets: ses.casos.map(c => {
        const d = def(c.id), paso = d.pasos[c.paso];
        return { id: c.id, numero: c.numero, llegada: c.llegada, asunto: d.asunto || '', canal: 'WhatsApp', cliente: d.cliente || {}, humor: humorTxt(c.humor), nivel: c.humor,
          chat: c.chat, cerrado: !!c.cerrado, abandonado: !!c.abandonado, motivo: c.motivo || '', estadoTicket: c.estadoTicket || 'nuevo', listo: !paso,
          ultimoCliente: c.ultimoCliente != null ? c.ultimoCliente : c.llegada, esperaCliente: c.esperaCliente !== false && !!paso,
          opciones: (!c.cerrado && paso) ? barajar(paso.opciones.map((o, i) => ({ i, t: o.t }))) : [] };
      }),
      ordenes: ses.panel ? s.ordenes.map(o => ({ id: o.id, comercio: o.comercio, cliente: o.cliente, total: o.total || '', metodo: o.metodo || 'movil', pago: o.pago || 'Pagada', items: o.items || [],
        eventos: (o.eventos || []).map(e => ({ min: e.min, c: e.c || '', e: e.e || '', rep: e.rep || '', rol: e.rep ? (e.rol || 'Repartidor') : '' })) })) : [],
      viajes: (ses.herramientas || []).includes('admin') ? s.viajes.map(v => { const x = Object.assign({}, v); delete x.reglas; return x; }) : [],
      admin: (ses.herramientas || []).includes('admin') ? (() => { const x = Object.assign({}, s.admin); delete x.reglas; return x; })() : null,
      hechas: ses.acciones.map(a => ({ herramienta: a.herramienta || 'zupper', orden: a.orden, accion: a.accion, min: a.min, texto: a.texto, c: a.c || '', e: a.e || '', rep: a.rep || '', rol: a.rol || '', st: a.st || '', dato: a.dato || null }))
    };
  }
  // Cambios de llegada para que el navegador los conozca (llegada progresiva)
  const llegadas = ses => Object.fromEntries(ses.casos.map(c => [c.id, c.llegada]));

  async function sesionSim(store, user, body) {
    const cfg = await cargarConfig(store);
    const s = configSim(cfg);
    const asp = await requerirAspirante(store, user);
    const sim = asp.simulador || { sesiones: [] };
    const ses = sim.sesiones.find(x => x.id === body.sesion);
    if (!ses) throw err(404, 'Simulación no encontrada.');
    if (vencida(ses)) { terminarSim(ses, s); asp.simulador = sim; await store.put('aspirantes', asp); throw err(409, 'Se acabó el tiempo de la simulación.'); }
    if (ses.estado !== 'en-curso') throw err(409, 'Esta simulación ya terminó.');
    if (revisarAbandono(ses)) { asp.simulador = sim; await store.put('aspirantes', asp); }
    return { cfg, s, asp, sim, ses };
  }
  // Niveles con su estado para este aspirante: bloqueado / disponible / agotado
  // Intentos por nivel: contador propio (las sesiones viejas se recortan); para datos de antes, cuenta las sesiones
  const intentosDe = (sim, nivel) => (sim.contador && sim.contador[nivel] != null) ? sim.contador[nivel] : sim.sesiones.filter(x => (x.nivel || 'avanzado') === nivel).length;
  function nivelesDe(s, sim) {
    const listo = {};
    return s.niveles.map(n => {
      const ruta = n.ruta || 'ORDERS', anteriorListo = listo[ruta] !== false;
      const ses = sim.sesiones.filter(x => (x.nivel || 'avanzado') === n.id);
      const terminadas = ses.filter(x => x.estado === 'terminada' || vencida(x));
      const curso = ses.find(x => x.estado === 'en-curso' && !vencida(x));
      const ilimitado = !(Number(s.intentos) > 0);
      const permitidos = ilimitado ? null : Number(s.intentos) + ((sim.extra && sim.extra[n.id]) || 0);
      const hechos = intentosDe(sim, n.id);                       // intentos empezados (incluye el que está en curso)
      const usadas = hechos - (curso ? 1 : 0);
      const aprobadoEn = (sim.aprobados || {})[n.id] || null;
      const hs = herramientasDe(n);
      const r = { id: n.id, ruta, rutaNombre: SIM_RUTAS[ruta] || ruta, nombre: n.nombre, descripcion: n.descripcion, minutos: n.minutos, tickets: (n.casos || []).length, panel: hs.includes('zupper'), admin: hs.includes('admin'),
        bloqueado: s.ordenNiveles !== false && !anteriorListo, enCurso: !!curso, usadas, permitidos, ilimitado, quedan: ilimitado ? 1 : Math.max(0, permitidos - usadas), terminado: terminadas.length > 0,
        intento: curso ? hechos : usadas + 1, aprobado: !!aprobadoEn, aprobadoEn,
        grupo: n.grupo || grupoDeRuta(ruta), etapa: (SIM_ETAPAS[ruta] || {}).titulo || SIM_RUTAS[ruta] || ruta, herramientasEtapa: (SIM_ETAPAS[ruta] || {}).herramientas || [] };
      listo[ruta] = r.terminado;
      return r;
    });
  }

  const aspiranteSim = {
    async simEstado({ store, user }) {
      const cfg = await cargarConfig(store);
      const s = configSim(cfg);
      const asp = await requerirAspirante(store, user);
      const sim = asp.simulador || { sesiones: [] };
      return { activo: s.activo !== false && s.casos.length > 0, niveles: nivelesDe(s, sim), grupos: SIM_GRUPOS.map(g => ({ id: g.id, nombre: g.nombre, descripcion: g.descripcion })),
        ultimas: sim.sesiones.filter(x => x.estado === 'terminada').slice(-3).reverse().map(x => ({ nivel: (s.niveles.find(n => n.id === x.nivel) || {}).nombre || '', fecha: x.fin,
          resueltos: x.resumen ? x.resumen.tickets.resueltos : 0, total: x.casos.length, primeraPromedio: x.resumen ? x.resumen.primeraPromedio : null })) };
    },
    async simIniciar({ store, user, body }) {
      const cfg = await cargarConfig(store);
      const s = configSim(cfg);
      const asp = await requerirAspirante(store, user);
      const sim = asp.simulador || { sesiones: [] };
      for (const x of sim.sesiones) if (vencida(x)) terminarSim(x, s);
      let ses = sim.sesiones.find(x => x.estado === 'en-curso');
      if (!ses) {
        if (s.activo === false) throw err(403, 'El simulador no está disponible por ahora.');
        const nv = nivelesDe(s, sim).find(n => n.id === body.nivel);
        const n = s.niveles.find(x => x.id === body.nivel);
        if (!nv || !n) throw err(400, 'Elige un nivel.');
        if (nv.bloqueado) throw err(403, 'Primero termina el nivel anterior.');   // solo si «Niveles en orden» está encendido
        if (!nv.ilimitado && !nv.quedan) throw err(403, 'Ya usaste tus intentos de este nivel. Si necesitas otro, escríbele al equipo.');
        const casos = (n.casos || []).map(id => s.casos.find(c => c.id === id && c.activo !== false)).filter(Boolean);
        if (!casos.length) throw err(403, 'Este nivel todavía no tiene casos.');
        const progresivo = Number(n.maxAbiertos) > 0;
        if (!progresivo) casos.sort((a, b) => (a.llegada || 0) - (b.llegada || 0));
        let numero = 2988100 + Math.floor(Math.random() * 800);
        ses = { id: nuevoId('sim'), nivel: n.id, inicio: ahora(), fin: null, estado: 'en-curso', velocidad: Number(s.velocidad) || 10, minutos: Number(n.minutos) || 20,
          herramientas: herramientasDe(n), panel: herramientasDe(n).includes('zupper'), vistas: [], conEstados: !!n.estados, abandono: Number(n.abandono) || 0, maxAbiertos: progresivo ? Number(n.maxAbiertos) : 0, intervalo: Number(n.intervalo) || 8,
          casos: casos.map((c, k) => ({ id: c.id, numero: numero += 1 + Math.floor(Math.random() * 9), llegada: progresivo ? (k < n.maxAbiertos ? k * (Number(n.intervalo) || 8) : null) : (Number(c.llegada) || 0), ultimoCliente: null,
            humor: c.humor == null ? 3 : c.humor, paso: 0, pasos: pasosBase(c), chat: c.pasos[0].cliente.map(t => ({ de: 'cliente', t })), respuestas: [],
            motivo: '', motivoOk: false, estadoTicket: 'nuevo', estadoOk: false, cerrado: false, primera: null,
            consulta: !!(c.consulta && herramientasDe(n).includes(c.consulta.herramienta)), verifico: null })),
          acciones: [], resumen: null };
        sim.contador = sim.contador || {};
        sim.contador[n.id] = intentosDe(sim, n.id) + 1;
        ses.intento = sim.contador[n.id];
        sim.sesiones.push(ses);
        sim.sesiones = sim.sesiones.slice(-30);
      }
      asp.simulador = sim;
      await store.put('aspirantes', asp);
      return { sesion: vistaSim(ses, s) };
    },
    async simResponder({ store, user, body }) {
      const { s, asp, sim, ses } = await sesionSim(store, user, body);
      const c = ses.casos.find(x => x.id === body.ticket);
      const d = s.casos.find(x => x.id === body.ticket);
      if (!c || !d) throw err(404, 'Ticket no encontrado.');
      if (c.abandonado) throw err(409, 'El cliente abandonó la conversación por falta de respuesta.');
      if (c.cerrado) throw err(409, 'Este ticket ya no está en tu bandeja.');
      if (!llego(ses, c)) throw err(409, 'Este ticket todavía no ha llegado.');
      const paso = d.pasos[c.paso];
      if (!paso) throw err(409, 'El cliente ya no está esperando respuesta. Elige el motivo de contacto y cambia el estatus del ticket.');
      const llegado = segSes(ses) - c.llegada;
      let t, v, r, h = 0, i = null, notas = null, o = null;
      const otro = limpiar(body.otro, 1000);
      if (otro) { t = otro; v = 'pendiente'; r = paso.otro || []; notas = revisarOrtografia(otro); }
      else {
        i = Number(body.opcion);
        o = paso.opciones[i];
        if (!o) throw err(400, 'Elige o escribe una respuesta.');
        t = o.t; v = o.v; r = o.r || []; h = Number(o.h) || 0;
      }
      if (c.primera == null) c.primera = Math.max(0, Math.round(llegado));
      // ¿Buscó la orden/viaje antes de dar la respuesta que lo requería?
      if (paso.verificar && c.consulta && c.verifico == null) c.verifico = (ses.vistas || []).some(x => x.h === d.consulta.herramienta && x.id === d.consulta.id);
      c.respuestas.push(Object.assign({ paso: c.paso, i, t, v, otro: !!otro, f: ahora(), seg: Math.max(0, Math.round(llegado)) }, notas ? { ortografia: notas } : {}));
      c.chat.push({ de: 'agente', t });
      if (c.estadoTicket === 'nuevo') c.estadoTicket = 'abierto';
      c.aparcado = false;
      c.humor = Math.max(0, Math.min(4, c.humor + h));
      const k = siguientePaso(d, c.paso, o);
      c.paso = k < 0 ? d.pasos.length : k;
      const sig = d.pasos[c.paso];
      const nuevos = r.concat(sig ? sig.cliente : []).map(x => ({ de: 'cliente', t: x }));
      c.chat.push(...nuevos);
      c.ultimoCliente = Math.round(segSes(ses) + tipeo(nuevos.map(m => m.t)));
      c.esperaCliente = !!sig && nuevos.length > 0;   // si el cliente no contesta, no corre el abandono
      if (o && o.fin) c.chat.push({ de: 'sistema', t: 'El cliente cerró la conversación.' });
      asp.simulador = sim;
      await store.put('aspirantes', asp);
      return { mensajes: nuevos, fin: !!(o && o.fin), ultimoCliente: c.ultimoCliente, esperaCliente: c.esperaCliente, humor: humorTxt(c.humor), nivel: c.humor, listo: !sig, opciones: sig ? barajar(sig.opciones.map((o, k) => ({ i: k, t: o.t }))) : [] };
    },
    // «Enviar como…»: guarda motivo y estatus. Abierto deja el ticket en la bandeja; los demás lo sacan.
    async simResolver({ store, user, body }) {
      const { s, asp, sim, ses } = await sesionSim(store, user, body);
      const c = ses.casos.find(x => x.id === body.ticket);
      const d = s.casos.find(x => x.id === body.ticket);
      if (!c || !d) throw err(404, 'Ticket no encontrado.');
      if (c.cerrado) throw err(409, 'Este ticket ya no está en tu bandeja.');
      const estado = ses.conEstados ? String(body.estado || '') : 'resuelto';
      if (!SIM_ESTADOS_TICKET[estado]) throw err(400, 'Elige el estatus del ticket.');
      const motivo = limpiar(body.motivo, 120);
      if (!motivo || !s.motivos.includes(motivo)) throw err(400, 'Elige el motivo de contacto antes de enviar el ticket.');
      if (!c.respuestas.length) throw err(400, 'Responde al cliente antes de cambiar el estatus.');
      c.motivo = motivo; c.motivoOk = motivo === d.motivo;
      c.estadoTicket = estado; c.estadoOk = (d.estados && d.estados.length ? d.estados : ['resuelto']).includes(estado);
      if (estado !== 'abierto') { c.cerrado = true; c.cerradoF = ahora(); } else c.aparcado = true;
      liberarTickets(ses);
      asp.simulador = sim;
      await store.put('aspirantes', asp);
      return { ok: true, cerrado: c.cerrado, pendientes: ses.casos.filter(x => !x.cerrado).length, llegadas: llegadas(ses) };
    },
    // Registra lo que el aspirante consultó (detalle, mensajes o búsqueda) en el Admin o en el Panel Zupper
    async simVer({ store, user, body }) {
      const { asp, sim, ses } = await sesionSim(store, user, body);
      const h = body.herramienta === 'admin' ? 'admin' : 'zupper';
      const ids = [].concat(body.ids || []).map(x => limpiar(x, 30)).filter(Boolean).slice(0, 40);
      ses.vistas = ses.vistas || [];
      const seg = Math.round(segSes(ses));
      ids.forEach(id => { if (!ses.vistas.some(x => x.h === h && x.id === id)) ses.vistas.push({ h, id, vista: limpiar(body.vista, 20), seg }); });
      ses.vistas = ses.vistas.slice(-300);
      asp.simulador = sim;
      await store.put('aspirantes', asp);
      return { ok: true };
    },
    async simAccionViaje({ store, user, body }) {
      const { s, asp, sim, ses } = await sesionSim(store, user, body);
      if (!(ses.herramientas || []).includes('admin')) throw err(403, 'Este nivel no tiene Admin.');
      const v = s.viajes.find(x => x.id === body.viaje);
      if (!v) throw err(404, 'Viaje no encontrado.');
      if (body.que !== 'cancelar-viaje') throw err(400, 'Acción desconocida.');
      const min = minutoSim(ses);
      const st = estadoViaje(v, min, ses.acciones);
      if (!['Waiting', 'Accepted', 'Arrived', 'Started', 'Completed'].includes(st)) throw err(409, 'Este viaje ya está cancelado.');
      const motivo = limpiar(body.motivo, 80), desc = limpiar(body.descripcion, 300);
      if (!motivo) throw err(400, 'Elige el motivo de cancelación (Cancelation Reason).');
      const regla = (v.reglas || []).find(x => x.accion === 'cancelar-viaje' && min >= x.desde && min < x.hasta);
      let cal = regla ? regla.v : 'mala', nota = regla ? regla.nota : 'Canceló un viaje sin motivo.';
      if (regla && regla.motivo && regla.motivo !== motivo && cal === 'buena') { cal = 'regular'; nota = 'Canceló el viaje correcto, pero con el motivo «' + motivo + '»; era «' + regla.motivo + '».'; }
      const a = { herramienta: 'admin', orden: v.id, accion: 'cancelar-viaje', min, f: ahora(), texto: 'Viaje #' + v.id + ' cancelado desde el Admin · ' + motivo + '.', st: 'Cancelled',
        v: cal, nota, dato: { motivo, descripcion: desc } };
      ses.acciones.push(a);
      asp.simulador = sim;
      await store.put('aspirantes', asp);
      return { hecha: { herramienta: 'admin', orden: v.id, accion: a.accion, min, texto: a.texto, st: 'Cancelled', dato: a.dato } };
    },
    // Acciones de los demás módulos del Admin (Users, Service Providers, Reviews…)
    async simAccionAdmin({ store, user, body }) {
      const { s, asp, sim, ses } = await sesionSim(store, user, body);
      if (!(ses.herramientas || []).includes('admin')) throw err(403, 'Este nivel no tiene Admin.');
      const que = String(body.que || ''), def = SIM_ACCIONES_ADMIN[que];
      if (!def) throw err(400, 'Acción desconocida.');
      const objetivo = limpiar(body.objetivo, 30);
      const ad = s.admin || SIM_ADMIN_DEFAULT;
      const existe = objetivo.startsWith('u:') ? ad.usuarios.some(x => 'u:' + x.id === objetivo) : objetivo.startsWith('p:') ? ad.conductores.some(x => 'p:' + x.id === objetivo) : (ad.reviews || []).some(x => x.viaje === objetivo);
      if (!existe) throw err(404, 'No encontramos ese registro.');
      const min = minutoSim(ses);
      const dato = {};
      if (que === 'agregar-wallet') {
        dato.monto = Math.round(Number(body.monto) * 100) / 100; dato.tipo = limpiar(body.tipo, 60); dato.addcut = body.addcut === 'Cut' ? 'Cut' : 'Add'; dato.moneda = body.moneda === 'USD' ? 'USD' : 'KM';
        if (!(dato.monto > 0) || dato.monto > 500) throw err(400, 'Escribe un monto válido.');
        if (!dato.tipo) throw err(400, 'Elige el tipo de abono.');
      }
      if (['rechazar-cuenta', 'declinar-usuario', 'reporte-usuario'].includes(que)) { dato.motivo = limpiar(body.motivo, 300); if (!dato.motivo) throw err(400, 'Escribe el motivo.'); }
      if (que === 'rechazar-cuenta') dato.cuenta = limpiar(body.cuenta, 10);
      const repetida = ses.acciones.some(a => a.herramienta === 'admin' && a.accion === que && a.orden === objetivo);
      const regla = (ad.reglas || []).find(r => r.accion === que && r.objetivo === objetivo);
      let v = regla ? regla.v : def[1], nota = regla ? regla.nota : def[2];
      if (regla && que === 'agregar-wallet') {
        const fallas = [];
        if (regla.tipo && regla.tipo !== dato.tipo) fallas.push('tipo «' + dato.tipo + '» (era «' + regla.tipo + '»)');
        if (regla.monto && Number(regla.monto) !== dato.monto) fallas.push('monto ' + dato.monto + ' (era ' + regla.monto + ')');
        if (dato.addcut !== 'Add') fallas.push('descontó en vez de abonar');
        if (fallas.length) { v = dato.addcut !== 'Add' ? 'mala' : 'regular'; nota = 'Abonó a la cuenta correcta, pero con ' + fallas.join(' y ') + '.'; }
      }
      if (repetida && v === 'buena') { v = null; nota = 'Acción repetida.'; }
      const textos = { 'agregar-wallet': (dato.addcut === 'Cut' ? 'Descuento' : 'Abono') + ' de ' + dato.monto + ' ' + dato.moneda + ' (' + dato.tipo + ') en la wallet del usuario ' + objetivo.slice(2) + '.',
        'rechazar-cuenta': 'Cuenta bancaria del conductor ' + objetivo.slice(2) + ' rechazada.', 'contactado': 'Reseña del viaje #' + objetivo + ' marcada como contactada.',
        'declinar-usuario': 'Usuario ' + objetivo.slice(2) + ' declinado.', 'eliminar-usuario': 'Usuario ' + objetivo.slice(2) + ' eliminado.', 'eliminar-conductor': 'Conductor ' + objetivo.slice(2) + ' eliminado.',
        'cambiar-clave': 'Clave del usuario ' + objetivo.slice(2) + ' cambiada.', 'reporte-usuario': "Reporte cargado en User's Records del usuario " + objetivo.slice(2) + '.' };
      const a = { herramienta: 'admin', orden: objetivo, accion: que, min, f: ahora(), texto: textos[que], v, nota, dato };
      ses.acciones.push(a);
      asp.simulador = sim;
      await store.put('aspirantes', asp);
      return { hecha: { herramienta: 'admin', orden: objetivo, accion: que, min, texto: a.texto, st: '', dato } };
    },
    async simAccion({ store, user, body }) {
      const { s, asp, sim, ses } = await sesionSim(store, user, body);
      if (!ses.panel) throw err(403, 'Este nivel no tiene Panel de órdenes.');
      const o = s.ordenes.find(x => x.id === body.orden);
      if (!o) throw err(404, 'Orden no encontrada.');
      const accion = String(body.que || '');   // «accion» ya lo usa el despachador
      if (!SIM_ACCIONES[accion]) throw err(400, 'Acción desconocida.');
      const min = minutoSim(ses);
      if (ordenCerrada(estadoOrden(o, min, ses.acciones))) throw err(409, 'La orden ya está cerrada.');
      const repetida = ses.acciones.some(a => a.orden === o.id && a.accion === accion);
      const regla = (o.reglas || []).find(x => x.accion === accion && min >= x.desde && min < x.hasta);
      const ef = (o.respuestas || {})[accion] || {};
      const texto = ef.texto || ({ 'contactar-comercio': 'Mensaje enviado al comercio.', 'contactar-repartidor': 'Mensaje enviado al repartidor.', 'publicar-shoppers': 'Publicado en el grupo de Shoppers.',
        'reasignar': 'Solicitud de asignación enviada.', 'devolver-comercio': 'Se indicó devolver el pedido al comercio.', 'cancelar': 'Orden cancelada.' })[accion];
      const a = { orden: o.id, accion, min, f: ahora(), texto, c: ef.c || (accion === 'cancelar' ? 'Cancelada' : ''), e: ef.e || (accion === 'cancelar' ? 'Cancelada' : ''), rep: ef.rep || '', rol: ef.rep ? (ef.rol || 'Repartidor') : '',
        v: repetida ? null : (regla ? regla.v : ((o.reglas || []).length ? 'mala' : null)), nota: regla ? regla.nota : (repetida ? 'Acción repetida' : 'Acción sin sustento en el estatus de la orden') };
      ses.acciones.push(a);
      asp.simulador = sim;
      await store.put('aspirantes', asp);
      return { hecha: { orden: a.orden, accion, min, texto, c: a.c, e: a.e, rep: a.rep, rol: a.rol } };
    },
    // El navegador consulta cada tanto: abandonos y tickets nuevos (llegada progresiva)
    async simSync({ store, user, body }) {
      const { asp, sim, ses } = await sesionSim(store, user, body);
      liberarTickets(ses);
      asp.simulador = sim;
      await store.put('aspirantes', asp);
      return { llegadas: llegadas(ses), abandonados: ses.casos.filter(c => c.abandonado).map(c => c.id) };
    },
    async simTerminar({ store, user, body }) {
      const cfg = await cargarConfig(store);
      const s = configSim(cfg);
      const asp = await requerirAspirante(store, user);
      const sim = asp.simulador || { sesiones: [] };
      const ses = sim.sesiones.find(x => x.id === body.sesion);
      if (!ses) throw err(404, 'Simulación no encontrada.');
      terminarSim(ses, s);
      // ¿Lo hizo bien? (nota ≥ aprobación). Se guarda en qué intento lo logró por primera vez.
      const intento = ses.intento || intentosDe(sim, ses.nivel);
      const bien = ses.resumen.nota >= s.aprobacion && !ses.resumen.pendientes;
      sim.aprobados = sim.aprobados || {};
      if (bien && !sim.aprobados[ses.nivel]) sim.aprobados[ses.nivel] = intento;
      asp.simulador = sim;
      await store.put('aspirantes', asp);
      const r = ses.resumen;    // el aspirante no ve su nota: solo si lo hizo bien y en qué intento
      const siguiente = s.niveles[s.niveles.findIndex(n => n.id === ses.nivel) + 1];
      const nv = nivelesDe(s, sim).find(n => n.id === ses.nivel) || {};
      return { resueltos: r.tickets.resueltos, total: r.tickets.total, primeraPromedio: r.primeraPromedio, acciones: r.ordenes.acciones, siguiente: siguiente ? siguiente.nombre : null, csat: r.csat,
        intento, bien, pendienteCalidad: !!r.pendientes, aprobadoEn: sim.aprobados[ses.nivel] || null, puedeRepetir: !!(nv.ilimitado || nv.quedan),
        calificaciones: ses.casos.map(c => { const d = s.casos.find(x => x.id === c.id) || {}; return { numero: c.numero, cliente: (d.cliente || {}).nombre || '', asunto: d.asunto || '', calificacion: csatDe(c), humor: humorTxt(c.humor), abandonado: !!c.abandonado }; }) };
    }
  };

  const adminSim = {
    async simResultados({ store }) {
      const cfg = await cargarConfig(store);
      const s = configSim(cfg);
      const asps = (await store.find('aspirantes', {})).filter(a => a.simulador && a.simulador.sesiones && a.simulador.sesiones.length);
      const filas = [];
      for (const a of asps) for (const x of a.simulador.sesiones) {
        if (vencida(x)) terminarSim(x, s);
        const r = x.resumen || puntosSim(x, s);
        filas.push({ id: a._id, nombre: a.nombre, celula: a.celula, sesion: x.id, nivel: ((n => n ? ({ VIAJES: 'Viajes · ', CELULAS: 'Células · ' }[n.ruta] || 'Orders · ') + n.nombre : 'Realidad')(s.niveles.find(n => n.id === x.nivel))), intento: x.intento || null,
          aprobadoEn: ((a.simulador.aprobados || {})[x.nivel]) || null, inicio: x.inicio, fin: x.fin, estado: x.estado,
          nota: r.nota, pendientes: r.pendientes, ortografia: r.ortografia || 0, resueltos: r.tickets.resueltos, total: r.tickets.total, primeraPromedio: r.primeraPromedio,
          panel: !!x.panel, csat: r.csat || null, malas: r.ordenes.malas, sinGestion: r.ordenes.sinGestion.length });
      }
      filas.sort((x, y) => String(y.inicio).localeCompare(String(x.inicio)));
      return { filas, config: { activo: s.activo !== false, ordenNiveles: s.ordenNiveles !== false, intentos: s.intentos, aprobacion: s.aprobacion, velocidad: s.velocidad, tickets: s.casos.length, ordenes: s.ordenes.length,
        niveles: s.niveles.map(n => ({ nombre: n.nombre, minutos: n.minutos, tickets: (n.casos || []).length })) } };
    },
    async simDetalle({ store, body }) {
      const cfg = await cargarConfig(store);
      const s = configSim(cfg);
      const a = await store.get('aspirantes', body.id);
      const x = a && a.simulador && a.simulador.sesiones.find(y => y.id === body.sesion);
      if (!x) throw err(404, 'Simulación no encontrada.');
      if (vencida(x)) terminarSim(x, s);
      return { aspirante: { id: a._id, nombre: a.nombre, celula: a.celula },
        sesion: { id: x.id, nivelId: x.nivel || 'avanzado', nivel: (s.niveles.find(n => n.id === x.nivel) || {}).nombre || 'Realidad', inicio: x.inicio, fin: x.fin, estado: x.estado, velocidad: x.velocidad, panel: !!x.panel, conEstados: !!x.conEstados, resumen: x.resumen || puntosSim(x, s) },
        tickets: x.casos.map(c => {
          const d = s.casos.find(y => y.id === c.id) || { pasos: [], cliente: {} };
          return { id: c.id, numero: c.numero, asunto: d.asunto || c.id, cliente: (d.cliente || {}).nombre || '', fueraDeAlcance: !!d.fueraDeAlcance, llego: c.llegada != null && c.llegada <= ((Date.parse(x.fin || ahora()) - Date.parse(x.inicio)) / 1000),
            motivoCorrecto: d.motivo || '', motivo: c.motivo, motivoOk: c.motivoOk, calificacion: csatDe(c), estadoTicket: c.abandonado ? 'Abandonado por el cliente' : (SIM_ESTADOS_TICKET[c.estadoTicket] || 'Nuevo'), abandonado: !!c.abandonado, estadoOk: c.estadoOk,
            estadosCorrectos: (d.estados && d.estados.length ? d.estados : ['resuelto']).map(e => SIM_ESTADOS_TICKET[e]), consulta: c.consulta ? { id: d.consulta.id, herramienta: d.consulta.herramienta === 'admin' ? 'Admin' : 'Panel Zupper', verifico: c.verifico } : null, cerrado: c.cerrado, primera: c.primera, humor: humorTxt(c.humor), chat: c.chat,
            respuestas: c.respuestas.map((r, k) => ({ k, paso: r.paso, t: r.t, v: r.v, otro: r.otro, seg: r.seg, ortografia: r.ortografia || [],
              opciones: ((d.pasos[r.paso] || {}).opciones || []).map(o => ({ t: o.t, v: o.v })) })) };
        }),
        viajesAcciones: x.acciones.filter(a => a.herramienta === 'admin').map(a => ({ viaje: a.orden, min: a.min, v: a.v, nota: a.nota, texto: a.texto || '' })),
        ordenes: !x.panel ? [] : s.ordenes.filter(o => (o.reglas || []).length || x.acciones.some(y => y.orden === o.id)).map(o => ({ id: o.id, comercio: o.comercio,
          acciones: x.acciones.filter(y => y.orden === o.id).map(y => ({ accion: SIM_ACCIONES[y.accion] || y.accion, min: y.min, v: y.v, nota: y.nota })),
          esperadas: (o.reglas || []).filter(r => r.esperada).map(r => ({ accion: SIM_ACCIONES[r.accion] || r.accion, nota: r.nota, hecha: x.acciones.some(y => y.orden === o.id && y.accion === r.accion && y.v === 'buena') })) })) };
    },
    async simCalificar({ store, body }) {
      const cfg = await cargarConfig(store);
      const s = configSim(cfg);
      if (!Object.prototype.hasOwnProperty.call(SIM_PUNTOS, body.v)) throw err(400, 'Elige buena, regular o mala.');
      const a = await store.get('aspirantes', body.id);
      const x = a && a.simulador && a.simulador.sesiones.find(y => y.id === body.sesion);
      const c = x && x.casos.find(y => y.id === body.ticket);
      const r = c && c.respuestas[Number(body.k)];
      if (!r || !r.otro) throw err(404, 'Respuesta no encontrada.');
      r.v = body.v; r.revisada = ahora();
      if (x.estado === 'terminada') {
        x.resumen = puntosSim(x, s);
        // Al revisar las escritas, si ya alcanza la nota, cuenta como «lo hizo bien» en ese intento
        const sim = a.simulador; sim.aprobados = sim.aprobados || {};
        const prev = sim.aprobados[x.nivel], it = x.intento || null;
        if (it && !x.resumen.pendientes && x.resumen.nota >= s.aprobacion && (!prev || it < prev)) sim.aprobados[x.nivel] = it;
      }
      await store.put('aspirantes', a);
      return { resumen: x.resumen || puntosSim(x, s) };
    },
    async simReiniciar({ store, body }) {
      const a = await store.get('aspirantes', body.id);
      if (!a) throw err(404, 'Aspirante no encontrado.');
      const cfg = await cargarConfig(store);
      const s = configSim(cfg);
      const sim = a.simulador || { sesiones: [] };
      const nivel = s.niveles.find(n => n.id === body.nivel) ? body.nivel : (sim.sesiones.slice(-1)[0] || {}).nivel || s.niveles[0].id;
      sim.sesiones.forEach(x => { if (x.estado === 'en-curso') terminarSim(x, s); });
      if (typeof sim.extra !== 'object' || !sim.extra) sim.extra = {};
      sim.extra[nivel] = (sim.extra[nivel] || 0) + 1;
      a.simulador = sim;
      await store.put('aspirantes', a);
      return { ok: true };
    },
    async simConfig({ store }) {
      const cfg = await cargarConfig(store);
      const s = configSim(cfg);
      return { simulador: { formato: SIM_FORMATO, activo: s.activo !== false, ordenNiveles: s.ordenNiveles !== false, intentos: s.intentos, aprobacion: s.aprobacion, velocidad: s.velocidad, niveles: s.niveles, motivos: s.motivos, casos: s.casos, ordenes: s.ordenes, viajes: s.viajes },
        acciones: SIM_ACCIONES, estadosTicket: SIM_ESTADOS_TICKET, estComercio: SIM_EST_COMERCIO, estEntrega: SIM_EST_ENTREGA };
    },
    async simGuardarConfig({ store, body }) {
      const cfg = await cargarConfig(store);
      const s = configSim(cfg);
      const n = (v, min, max, def) => { const x = Math.round(Number(v)); return x >= min && x <= max ? x : def; };
      const nuevo = { activo: body.activo !== false, ordenNiveles: body.ordenNiveles !== false, intentos: n(body.intentos, 0, 50, s.intentos), aprobacion: n(body.aprobacion, 1, 100, s.aprobacion), velocidad: n(body.velocidad, 1, 30, s.velocidad),
        niveles: s.niveles, motivos: s.motivos, casos: s.casos, ordenes: s.ordenes, viajes: s.viajes };
      if (body.archivo) {   // archivo .json exportado desde el panel y editado
        const f = body.archivo;
        if (f.formato !== SIM_FORMATO) throw err(400, 'El archivo no es del simulador de Ridery Academy.');
        const motivos = (f.motivos || []).map(m => limpiar(m, 120)).filter(Boolean);
        if (!motivos.length) throw err(400, 'El archivo no trae motivos de contacto.');
        const lim = a => [].concat(a || []).map(t => limpiar(t, 1000)).filter(Boolean);
        const casos = (f.casos || []).map((c, k) => {
          const pasos = (c.pasos || []).map(p => ({ cliente: lim(p.cliente),
            opciones: (p.opciones || []).map(o => ({ t: limpiar(o.t, 1000), v: SIM_PUNTOS.hasOwnProperty(o.v) ? o.v : 'mala', r: lim(o.r), h: n(o.h, -4, 4, 0) })).filter(o => o.t), otro: lim(p.otro) }));
          if (!c.id || !pasos.length || pasos.some(p => p.opciones.length < 2)) throw err(400, 'Caso ' + (k + 1) + ': necesita id y cada paso al menos 2 opciones.');
          if (!pasos[0].cliente.length) throw err(400, 'Caso ' + c.id + ': el primer paso necesita el mensaje del cliente.');
          if (!motivos.includes(c.motivo)) throw err(400, 'Caso ' + c.id + ': su motivo no está en la lista de motivos.');
          const estados = [].concat(c.estados || ['resuelto']).filter(e => SIM_ESTADOS_TICKET[e]);
          return { id: limpiar(c.id, 60), celula: limpiar(c.celula, 40), activo: c.activo !== false, llegada: n(c.llegada, 0, 3600, 0), humor: n(c.humor, 0, 4, 3), asunto: limpiar(c.asunto, 140),
            estados: estados.length ? estados : ['resuelto'], fueraDeAlcance: !!c.fueraDeAlcance,
            cliente: { nombre: limpiar((c.cliente || {}).nombre, 80), telefono: limpiar((c.cliente || {}).telefono, 30), notas: limpiar((c.cliente || {}).notas, 300) }, motivo: c.motivo, pasos };
        });
        if (!casos.length) throw err(400, 'El archivo no trae casos.');
        const ids = new Set(casos.map(c => c.id));
        const niveles = (f.niveles || []).map((x, k) => {
          const cs = (x.casos || []).filter(id => ids.has(id));
          if (!x.id || !cs.length) throw err(400, 'Nivel ' + (k + 1) + ': necesita id y al menos un caso que exista.');
          return { id: limpiar(x.id, 30), nombre: limpiar(x.nombre, 40) || x.id, descripcion: limpiar(x.descripcion, 300), minutos: n(x.minutos, 3, 120, 20), maxAbiertos: n(x.maxAbiertos, 0, 20, 0),
            intervalo: n(x.intervalo, 0, 300, 8), abandono: n(x.abandono, 0, 3600, 180), ruta: ['VIAJES', 'CELULAS'].includes(x.ruta) ? x.ruta : 'ORDERS', adminModulos: Array.isArray(x.adminModulos) ? x.adminModulos.map(m => limpiar(m, 20)).filter(Boolean).slice(0, 20) : undefined,
            herramientas: [].concat(x.herramientas || (x.panel ? ['zupper'] : [])).filter(h => h === 'zupper' || h === 'admin'), estados: !!x.estados, casos: cs };
        });
        if (!niveles.length) throw err(400, 'El archivo no trae niveles.');
        const ordenes = (f.ordenes || []).map((o, k) => {
          if (!o.id || !o.comercio) throw err(400, 'Orden ' + (k + 1) + ': necesita id y comercio.');
          const reglas = (o.reglas || []).map(r => ({ accion: r.accion, desde: Number(r.desde) || 0, hasta: r.hasta == null ? 9999 : Number(r.hasta), v: SIM_PUNTOS.hasOwnProperty(r.v) ? r.v : 'mala', nota: limpiar(r.nota, 300), esperada: !!r.esperada }));
          if (reglas.some(r => !SIM_ACCIONES[r.accion])) throw err(400, 'Orden ' + o.id + ': tiene una acción desconocida.');
          const est = x => ({ c: SIM_EST_COMERCIO.includes(x.c) ? x.c : '', e: SIM_EST_ENTREGA.includes(x.e) ? x.e : '', rep: limpiar(x.rep, 80), rol: x.rol === 'Shopper' ? 'Shopper' : 'Repartidor' });
          const respuestas = {};
          Object.entries(o.respuestas || {}).forEach(([k2, r]) => { if (SIM_ACCIONES[k2]) respuestas[k2] = Object.assign({ texto: limpiar(r.texto, 500) }, est(r)); });
          return { id: limpiar(o.id, 30), comercio: limpiar(o.comercio, 120), cliente: limpiar(o.cliente, 80), total: limpiar(o.total, 20), metodo: limpiar(o.metodo, 20) || 'movil', pago: o.pago === 'No pagada' ? 'No pagada' : 'Pagada',
            items: (o.items || []).map(t => limpiar(t, 120)), eventos: (o.eventos || []).map(e => Object.assign({ min: Number(e.min) || 0 }, est(e))), respuestas, reglas };
        });
        const viajes = Array.isArray(f.viajes) && f.viajes.length ? JSON.parse(JSON.stringify(f.viajes)).filter(v => v && v.id).slice(0, 300) : s.viajes;
        Object.assign(nuevo, { motivos, casos, ordenes, niveles, viajes });
      }
      cfg.simulador = nuevo;
      await store.put('config', cfg);
      return { ok: true, tickets: nuevo.casos.length, ordenes: nuevo.ordenes.length, niveles: nuevo.niveles.length };
    }
  };

  const aspirante = {
    async boost({ store, user }) {
      const cfg = await cargarConfig(store);
      const asp = await requerirAspirante(store, user);
      const m = cfg.boost.mecanografia;
      return { mecanografia: { activa: m.activa, meta: m.meta, precisionMin: m.precisionMin, duraciones: m.duraciones, textos: m.textos,
        resultados: (asp.boost && asp.boost.mecanografia) || { mejor: null, intentos: 0, historial: [] } },
        actividades: Object.entries(BOOST_ACTIVIDADES).filter(([k]) => cfg.boost.extra[k] !== false).map(([k, a]) => Object.assign({ id: k, resultados: (asp.boost && asp.boost[k]) || { mejor: null, intentos: 0, historial: [] } }, a)) };
    },
    // Resultado de una actividad de Boost (memoria, escritura, empatía): puntaje 0-100
    async boostActividad({ store, user, body }) {
      const cfg = await cargarConfig(store);
      const asp = await requerirAspirante(store, user);
      const id = String(body.actividad || '');
      if (!BOOST_ACTIVIDADES[id] || cfg.boost.extra[id] === false) throw err(400, 'Actividad desconocida.');
      const n = (v, max) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
      const r = { fecha: ahora(), puntaje: n(body.puntaje, 100), aciertos: n(body.aciertos, 500), total: n(body.total, 500), segundos: n(body.segundos, 3600) };
      asp.boost = asp.boost || {};
      const b = asp.boost[id] || { mejor: null, intentos: 0, historial: [] };
      b.intentos += 1;
      const record = b.mejor == null || r.puntaje > b.mejor;
      if (record) { b.mejor = r.puntaje; b.mejorFecha = r.fecha; }
      b.historial = [r].concat(b.historial || []).slice(0, 10);
      asp.boost[id] = b;
      await store.put('aspirantes', asp);
      return { resultados: b, record };
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
      return { aspirante: vistaAspirante(asp), reglas: cfg.reglas, celulas: cfg.celulas, ruta, noLeidos: (conv && conv.noLeidosAsp) || 0, boostActivo: cfg.boost.mecanografia.activa || Object.values(cfg.boost.extra).some(Boolean) };
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

  Object.assign(aspirante, aspiranteSim);

  /* ---------- Acciones del administrador ---------- */
  function fila(asp, modulos, cfg) {
    const p = progresoAspirante(asp, modulos, cfg.reglas);
    return { _id: asp._id, nombre: asp.nombre, cedula: asp.cedula, email: asp.email, telefono: asp.telefono, ciudad: asp.ciudad || '', cohorte: asp.cohorte,
      edad: asp.edad || null, nota: asp.test && asp.test.evaluacion ? asp.test.evaluacion.nota : null,
      alertas: asp.test ? (asp.test.alertas || []).length : 0, autoDescartado: !!asp.motivoDescarte,
      usuario: asp.usuario || '', tieneClave: !!asp.hash, celula: asp.celula, celulaSugerida: asp.test ? asp.test.celulaSugerida : null, estado: estadoDe(asp), estadoTest: asp.test ? asp.test.estado : 'pendiente',
      creado: asp.creado, aprobadoFecha: asp.aprobadoFecha || null, ultimoAcceso: asp.ultimoAcceso,
      progreso: p.progreso, completo: p.completo, promedio: p.promedio, ppm: asp.boost && asp.boost.mecanografia ? asp.boost.mecanografia.mejor : null,
      evaluaciones: (asp.capacitacion || []).length, ultimaEvaluacion: (asp.capacitacion || []).length ? asp.capacitacion[asp.capacitacion.length - 1] : null };
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
      const asp = { _id: id, cedula, nombre, edad: Math.round(Number(d.edad)) || null, email: limpiar(d.email, 120), telefono: limpiar(d.telefono, 30), ciudad: limpiar(d.ciudad, 60),
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
      if (body.estado === 'postulado') { asp.aprobadoFecha = null; delete asp.motivoDescarte; if (!asp.progreso || !Object.keys(asp.progreso).length) asp.celula = asp.test ? asp.test.celulaSugerida : asp.celula; }
      await store.put('aspirantes', asp);
      return { ok: true };
    },
    async eliminarAspirante({ store, body }) { await store.del('aspirantes', body.id); return { ok: true }; },

    async preguntas({ store }) {
      const cfg = await cargarConfig(store);
      return { preguntas: ordenarPreguntas(await store.find('preguntas', {}), cfg.secciones), secciones: cfg.secciones };
    },
    async guardarSecciones({ store, body }) {
      const cfg = await cargarConfig(store);
      const vistas = new Set();
      const secciones = (Array.isArray(body.secciones) ? body.secciones : []).map(x => {
        const id = limpiar(x.id, 40).toLowerCase().replace(/[^a-z0-9-]/g, '-') || nuevoId('s');
        const titulo = limpiar(x.titulo, 80);
        if (!titulo) throw err(400, 'Cada sección necesita un título.');
        if (vistas.has(id)) throw err(400, 'Hay dos secciones con el mismo código.');
        vistas.add(id);
        const condicion = normalizarCondicion(x.condicion);
        return Object.assign({ id, titulo, descripcion: limpiar(x.descripcion, 400) }, condicion ? { condicion } : {});
      });
      const preguntas = await store.find('preguntas', {});
      const quitada = cfg.secciones.find(s => !vistas.has(s.id) && preguntas.some(p => p.seccion === s.id));
      if (quitada) throw err(400, 'La sección «' + quitada.titulo + '» todavía tiene preguntas. Muévelas o elimínalas primero.');
      cfg.secciones = secciones;
      await store.put('config', cfg);
      return { secciones };
    },
    async guardarPregunta({ store, body }) {
      const cfg = await cargarConfig(store);
      const doc = normalizarPregunta(body.pregunta || {}, cfg.secciones);
      const previa = (body.pregunta || {})._id ? await store.get('preguntas', doc._id) : null;
      if (!previa || previa.seccion !== doc.seccion) doc.orden = (await store.find('preguntas', { seccion: doc.seccion })).filter(x => x._id !== doc._id).length + 1;
      await store.put('preguntas', doc);
      return { pregunta: doc };
    },
    // Descarga todo el formulario (secciones + preguntas con respuestas, puntos y filtros) como archivo
    async exportarFormulario({ store }) {
      const cfg = await cargarConfig(store);
      const preguntas = ordenarPreguntas(await store.find('preguntas', {}), cfg.secciones).map(({ _id, orden, ...p }) => Object.assign({ id: _id }, p));
      return { archivo: { formato: FORMATO_ARCHIVO, version: 1, exportado: ahora(), secciones: cfg.secciones, preguntas } };
    },
    // Carga un archivo de formulario.
    //   modo "agregar":    suma secciones y preguntas nuevas; si un id ya existe, lo actualiza. No borra nada.
    //   modo "reemplazar": borra todas las preguntas y deja solo lo que trae el archivo.
    async importarFormulario({ store, body }) {
      const cfg = await cargarConfig(store);
      const a = body.archivo || {};
      if (a.formato !== FORMATO_ARCHIVO) throw err(400, 'Este archivo no es un formulario de Ridery Academy.');
      const modo = body.modo === 'reemplazar' ? 'reemplazar' : 'agregar';
      const secsArchivo = (Array.isArray(a.secciones) ? a.secciones : []).slice(0, 40)
        .map(x => { const condicion = normalizarCondicion(x.condicion); return Object.assign({ id: limpiar(x.id, 40).toLowerCase().replace(/[^a-z0-9-]/g, '-'), titulo: limpiar(x.titulo, 80), descripcion: limpiar(x.descripcion, 400) }, condicion ? { condicion } : {}); })
        .filter(x => x.id && x.titulo);
      const enArchivo = new Set(secsArchivo.map(x => x.id));
      const secciones = modo === 'reemplazar' ? secsArchivo : secsArchivo.concat(cfg.secciones.filter(x => !enArchivo.has(x.id)));
      const lista = (Array.isArray(a.preguntas) ? a.preguntas : []).slice(0, 300);
      const docs = lista.map((p, i) => {
        try { return normalizarPregunta(Object.assign({}, p, { _id: p.id || p._id }), secciones); }
        catch (e) { throw err(400, 'Pregunta ' + (i + 1) + ' del archivo: ' + e.message); }
      });
      const actuales = modo === 'reemplazar' ? [] : await store.find('preguntas', {});
      if (modo === 'reemplazar') for (const p of await store.find('preguntas', {})) await store.del('preguntas', p._id);
      const siguiente = {};
      for (const d of docs) {
        const previa = actuales.find(x => x._id === d._id);
        if (previa && previa.seccion === d.seccion) d.orden = previa.orden;
        else {
          if (siguiente[d.seccion] == null) siguiente[d.seccion] = actuales.filter(x => x.seccion === d.seccion && !docs.some(y => y._id === x._id)).length;
          d.orden = ++siguiente[d.seccion];
        }
        await store.put('preguntas', d);
      }
      cfg.secciones = secciones;
      await store.put('config', cfg);
      return { modo, secciones: secsArchivo.length, preguntas: docs.length };
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

    /* ----- Evaluación de la capacitación (AdminCX › Personal › Aspirantes) ----- */
    async capacitacionPreguntas({ store }) {
      const cfg = await cargarConfig(store);
      return { preguntas: preguntasCapacitacion(cfg), deFabrica: !(cfg.capacitacion && cfg.capacitacion.preguntas && cfg.capacitacion.preguntas.length) };
    },
    async guardarCapacitacionPreguntas({ store, body }) {
      const cfg = await store.get('config', 'general') || await cargarConfig(store);
      const preguntas = body.deFabrica ? null : normalizarPreguntasCap(body.preguntas);
      cfg.capacitacion = preguntas ? { preguntas, actualizado: ahora() } : {};
      await store.put('config', cfg);
      return { ok: true, preguntas: preguntas || EVAL_CAP_DEFAULT };
    },
    // Una evaluación por día y por evaluador: si vuelve a guardar el mismo día, la reemplaza.
    async evaluarCapacitacion({ store, body, user }) {
      const cfg = await cargarConfig(store);
      const asp = await store.get('aspirantes', body.id);
      if (!asp) throw err(404, 'Aspirante no encontrado.');
      const dia = /^\d{4}-\d{2}-\d{2}$/.test(String(body.dia || '')) ? String(body.dia) : ahora().slice(0, 10);
      const preguntas = preguntasCapacitacion(cfg);
      const respuestas = respuestasCapacitacion(preguntas, body.respuestas);
      const por = limpiar(user.nombre || user.usuario, 80);
      const lista = (asp.capacitacion || []).filter(e => !(e.dia === dia && e.por === por));
      const ev = { id: nuevoId('ev'), dia, fecha: ahora(), por, respuestas,
        preguntas: preguntas.map(p => ({ id: p.id, texto: p.texto })) };   // copia: si luego cambian las preguntas, la evaluación se sigue leyendo
      lista.push(ev);
      lista.sort((a, b) => String(a.dia).localeCompare(String(b.dia)) || String(a.fecha).localeCompare(String(b.fecha)));
      asp.capacitacion = lista.slice(-60);
      await store.put('aspirantes', asp);
      return { ok: true, evaluacion: ev, capacitacion: asp.capacitacion };
    },
    async eliminarEvaluacion({ store, body }) {
      const asp = await store.get('aspirantes', body.id);
      if (!asp) throw err(404, 'Aspirante no encontrado.');
      asp.capacitacion = (asp.capacitacion || []).filter(e => e.id !== body.evaluacion);
      await store.put('aspirantes', asp);
      return { ok: true, capacitacion: asp.capacitacion };
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
        doc.claveFecha = ahora();                 // cierra las sesiones abiertas con la clave anterior
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
      return { boost: cfg.boost, actividades: BOOST_ACTIVIDADES };
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
      if (body.extra && typeof body.extra === 'object') Object.keys(BOOST_ACTIVIDADES).forEach(k => { cfg.boost.extra[k] = body.extra[k] !== false; });
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
      u.hash = await cripto.hash(String(body.nueva)); u.actualizado = ahora(); u.claveFecha = ahora();
      await store.put('usuarios', u);
      return { ok: true, v: u.claveFecha };      // el servidor entrega un token nuevo con esta versión
    },

    /* ----- Bitácora de seguridad (solo Admin) ----- */
    async auditoria({ store }) {
      const ev = await store.find('auditoria', {});
      return { eventos: ev.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha))).slice(0, 300)
        .map(e => ({ fecha: e.fecha, tipo: e.tipo, accion: e.accion || '', usuario: e.usuario || '', perfil: e.perfil || '', objetivo: e.objetivo || '', detalle: e.detalle || '', ip: e.ip || '' })) };
    }
  };

  Object.assign(admin, adminSim);

  /* ---------- Roles del panel ---------- */
  const PERFILES = {
    admin: { nombre: 'Admin', acciones: '*' },
    reclutador: { nombre: 'Reclutador', acciones: ['resumen', 'aspirantes', 'aspirante', 'preguntas', 'aprobar', 'cambiarEstado', 'guardarAcceso', 'reiniciarIntentos', 'crearAspirante', 'guardarCohorte', 'metricas', 'cambiarMiClave', 'chats', 'chatHilo', 'chatResponder', 'chatEliminar', 'simResultados', 'simDetalle', 'simCalificar', 'simReiniciar'] },
    calidad: { nombre: 'Calidad', acciones: ['resumen', 'aspirantes', 'aspirante', 'preguntas', 'metricas', 'cambiarMiClave', 'chats', 'chatHilo', 'chatResponder', 'simResultados', 'simDetalle', 'simCalificar'] }
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
    return { tipo: 'aspirante', sesion: { rol: 'aspirante', id: asp._id, v: asp.claveFecha || null }, aspirante: asp };
  }

  // Login de cuentas creadas en el panel (la cuenta principal se valida aparte, con ADMIN_USER / ADMIN_PASS)
  async function loginAdmin(store, body, cripto) {
    const id = limpiarUsuario(body.usuario);
    const u = id && await store.get('usuarios', id);
    if (!u || u.activo === false || !(await cripto.verificar(String(body.clave || ''), u.hash))) throw err(401, 'Usuario o contraseña incorrectos.');
    u.ultimoAcceso = ahora();
    await store.put('usuarios', u);
    return { rol: 'admin', usuario: u._id, nombre: u.nombre, perfil: u.perfil, cuenta: u._id, v: u.claveFecha || null };
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
        if ((u.claveFecha || null) !== (user.v || null)) throw err(401, 'Tu clave cambió. Vuelve a entrar con la nueva.');
        ctx.user = Object.assign({}, user, { perfil: u.perfil, nombre: u.nombre });
      } else {
        ctx.user = Object.assign({}, user, { perfil: 'admin', principal: true });
      }
      const p = PERFILES[ctx.user.perfil];
      if (!p || (p.acciones !== '*' && !p.acciones.includes(accion))) throw err(403, 'Tu rol (' + (p ? p.nombre : ctx.user.perfil) + ') no tiene permiso para esto.');
    }
    return tabla[accion](ctx);
  }

  const H = { EVAL_CAP_DEFAULT, preguntasCapacitacion, normalizarPreguntasCap, respuestasCapacitacion, COMUN, CELULAS_DEFAULT, REGLAS_DEFAULT, TIPOS, FORMATO_ARCHIVO, elegidas, seccionesVisibles, cumpleCondicion, ordenarPreguntas, evaluarPostulacion, err, nuevoId, cargarConfig, calcularCelula, construirRuta, calificar, loginAspirante, loginAdmin, iniciarSesion, vistaAspirante, estadoDe, PERFILES, ejecutar, BOOST_ACTIVIDADES, SIM_ACCIONES, SIM_FORMATO, revisarOrtografia };
  if (typeof module !== 'undefined' && module.exports) module.exports = H; else root.ElxHandlers = H;
})(typeof window !== 'undefined' ? window : globalThis);
