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
    'Orders : Pedido no llegó', 'Orders : Cambio de dirección', 'Orders : Pago no reflejado', 'Orders : Cancelación de orden', 'Orders : Producto agotado'
  ];
  const op = (v, t, r, h) => ({ v, t, r: [].concat(r || []), h: h || 0 });
  const SIM_CASOS_DEFAULT = [
    { id: 'ord-retraso', celula: 'ORDERS', activo: true, llegada: 0, humor: 2, asunto: 'Pedido con más de 1 hora de retraso',
      cliente: { nombre: 'Andreína Pérez', telefono: '+584142215870', notas: 'Usuario: 208114 Andreína Pérez' },
      orden: { id: 'ZP-48213', comercio: 'Sushi Express (Las Mercedes)', estado: 'Preparación iniciada', minutos: 72, repartidor: 'Sin asignar', items: ['Combo Tokio x1', 'Té frío x1'], total: '$18,40', pago: 'Pago Móvil' },
      motivo: 'Orders : Retraso en la entrega',
      pasos: [
        { cliente: ['Buenas, mi pedido tiene más de una hora y nada', 'Ya pagué y en la app sigue igual'],
          opciones: [
            op('buena', '¡Hola, Andreína! Gracias por escribirnos. Lamento la espera con tu pedido #ZP-48213; ya lo estoy revisando en este momento.', 'Ok, gracias. Es que tengo hambre y ya pagué 😩', 1),
            op('regular', 'Buenas tardes. Indíqueme su número de orden, por favor.', 'Es el ZP-48213, sale ahí mismo en la app. Llevo más de una hora esperando', -1),
            op('mala', 'hola q paso', ['¿En serio? Llevo una hora esperando y me escriben así.', 'Quiero hablar con un supervisor.'], -2)
          ], otro: ['Ok… ¿y entonces qué pasa con mi pedido?'] },
        { cliente: [],
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
          ], otro: ['Ok, quedo atenta.'] }
      ] },
    { id: 'ord-incompleto', celula: 'ORDERS', activo: true, llegada: 15, humor: 3, asunto: 'Falta un producto en mi pedido',
      cliente: { nombre: 'Carlos Rivas', telefono: '+584241187733', notas: 'Usuario: 195530 Carlos Rivas' },
      orden: { id: 'ZP-48197', comercio: 'Forum SuperMayorista (La Urbina)', estado: 'Completada', minutos: 48, repartidor: 'Jhonny M. (ID 84)', items: ['Harina PAN 1 kg x2', 'Arroz 1 kg x1', 'Refresco 2 L x1 · $2,50'], total: '$9,80', pago: 'Tarjeta (Stripe)' },
      motivo: 'Orders : Pedido incompleto',
      pasos: [
        { cliente: ['Hola, me llegó el pedido pero falta el refresco de 2 litros'],
          opciones: [
            op('buena', 'Hola, Carlos. Lamento que falte un producto en tu orden. Regálame 2 minutos mientras me comunico con el comercio para verificar la comanda de tu pedido.', 'Dale, espero', 1),
            op('regular', 'Hola. Envíeme una foto de la bolsa para validar.', '¿Una foto de qué? Si lo que falta no está en la bolsa 🙄', -1),
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
      orden: { id: 'ZP-48240', comercio: 'Arepera La Quinta (Chacao)', estado: 'Creada - No pagada', minutos: 21, repartidor: 'Sin asignar', items: ['Arepa reina pepiada x2', 'Jugo de parchita x1'], total: '$11,00', pago: 'Pago Móvil (sin asociar)' },
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
      orden: { id: 'ZP-48255', comercio: 'Sopas Doña Carmen (El Rosal)', estado: 'Completada', minutos: 39, repartidor: 'Luis A. (ID 112)', items: ['Sopa de res grande x1 · $8,00', 'Casabe x1'], total: '$10,50', pago: 'Binance' },
      motivo: 'Orders : Pedido en mal estado',
      pasos: [
        { cliente: ['Me llegó la sopa toda regada en la bolsa', 'No se puede ni comer'],
          opciones: [
            op('buena', 'Hola, José. Lamento mucho lo ocurrido con tu pedido. Para darte una solución inmediata, ¿me compartes una foto de cómo recibiste el producto?', ['📷 Foto', 'Mira, el envase venía volteado dentro del bolso, la tapa estaba bien cerrada'], 1),
            op('regular', 'Hola, ¿qué pasó exactamente?', 'Ya te dije, llegó regada. ¿No leíste?', -1),
            op('mala', 'Eso pasa a veces con las sopas, la próxima vez pida otra cosa.', 'Increíble. Quiero mi reembolso ya.', -2)
          ], otro: ['📷 Foto'] },
        { cliente: [],
          opciones: [
            op('buena', 'Gracias por la foto. Se ve que el envase venía bien sellado pero se volteó en el traslado. Te procesé el reembolso total de la sopa ($8,00) y te dejo un cupón de 10% OFF para tu próxima compra.', 'Bueno, al menos me lo devuelven. Gracias', 2),
            op('regular', 'Voy a reclamarle al restaurante para que le devuelva el dinero.', 'Ok… pero el restaurante no tiene la culpa, fue el motorizado', 0),
            op('mala', 'Por la foto no se puede validar nada, no aplica reembolso.', '¿¡Cómo que no!? Se ve clarito.', -2)
          ], otro: ['Ok, ¿y entonces?'] }
      ] },
    { id: 'ord-direccion', celula: 'ORDERS', activo: true, llegada: 95, humor: 3, asunto: 'Necesito cambiar la dirección',
      cliente: { nombre: 'Daniela Suárez', telefono: '+584143378120', notas: 'Usuario: 214522 Daniela Suárez' },
      orden: { id: 'ZP-48266', comercio: 'Burger Lab (Altamira)', estado: 'En camino', minutos: 26, repartidor: 'Pedro C. (ID 97)', items: ['Doble smash x1', 'Papas medianas x1'], total: '$12,30', pago: 'PayPal' },
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
    { id: 'ord-no-llego', celula: 'ORDERS', activo: true, llegada: 125, humor: 1, asunto: 'Dice entregado y no me llegó',
      cliente: { nombre: 'Luisa Fernández', telefono: '+584125561047', notas: 'Usuario: 176201 Luisa Fernández' },
      orden: { id: 'ZP-48377', comercio: 'Pollos El Gran Chef (Chacaíto)', estado: 'Completada', minutos: 55, repartidor: 'Ramón T. (ID 61) · no contesta', items: ['Pollo entero x1', 'Yuca frita x1'], total: '$14,50', pago: 'Tarjeta (Stripe)' },
      motivo: 'Orders : Pedido no llegó',
      pasos: [
        { cliente: ['La app dice que mi pedido fue ENTREGADO y yo no he recibido NADA', 'Esto es una estafa'],
          opciones: [
            op('buena', 'Hola, Luisa. Entiendo tu molestia. Ya mismo reviso qué pasó con tu pedido #ZP-48377 y me comunico con el repartidor.', 'Por favor, porque ya pagué y nada', 1),
            op('regular', 'Verifique bien, a veces lo dejan en recepción.', 'Ya bajé a recepción, no hay nada.', -1),
            op('mala', 'En el sistema sale entregado, así que sí le llegó.', '¿Me estás llamando mentirosa?', -2)
          ], otro: ['Ajá, ¿y qué van a hacer?'] },
        { cliente: [],
          opciones: [
            op('buena', 'Intenté comunicarme dos veces con el repartidor y no responde. Para no hacerte esperar más, ya procesé el reembolso total de tu orden ($14,50) a tu método de pago original. Nosotros nos encargamos internamente con el repartidor.', 'Ok, gracias por resolver rápido', 2),
            op('regular', 'Le doy ZupperCredits por el monto para su próxima compra.', 'Yo no quiero créditos, quiero mi dinero.', -1),
            op('mala', 'Espere un rato más, el repartidor debe estar por llegar.', '¡Dice ENTREGADO! ¿Cómo que por llegar?', -2)
          ], otro: ['¿Y mi dinero?'] }
      ] }
  ];

  /* Panel de órdenes (Back-Office). El reloj del panel va acelerado (velocidad: minutos
     simulados por minuto real). Cada orden tiene:
       eventos  [{ min, estado, repartidor }]  → cómo avanza sola (min = minuto simulado)
       respuestas { accion: { texto, estado, repartidor } } → qué pasa cuando el aspirante actúa
       reglas  [{ accion, desde, hasta, v, nota, esperada }] → cómo se califica cada acción
               (la primera regla que coincide con la acción y el minuto manda; si ninguna
               coincide, la acción cuenta como 'mala'). esperada: true → suma al puntaje máximo
               y si no la hace queda como «sin gestión». */
  const SIM_ACCIONES = {
    'contactar-comercio': 'Contactar al comercio', 'contactar-repartidor': 'Contactar al repartidor', 'publicar-shoppers': 'Publicar en grupo de Shoppers',
    'reasignar': 'Asignar / reasignar repartidor', 'devolver-comercio': 'Devolver al comercio', 'cancelar': 'Cancelar orden'
  };
  const SIM_ESTADOS = ['Creada - No pagada', 'Pagada - No iniciada', 'Preparación iniciada', 'Preparada', 'Asignada', 'En comercio', 'Despachada', 'En camino', 'En destino', 'Completada', 'Cancelada'];
  const ev = (min, estado, repartidor) => Object.assign({ min, estado }, repartidor ? { repartidor } : {});
  const rg = (accion, desde, hasta, v, nota, esperada) => ({ accion, desde, hasta: hasta == null ? 9999 : hasta, v, nota, esperada: !!esperada });
  const SIM_ORDENES_DEFAULT = [
    { id: 'ZP-48301', comercio: 'Rincón del Paladar', cliente: 'Gabriel Ortiz', zona: 'Los Ruices', total: '$15,20', items: ['Pabellón x1', 'Tequeños x6'],
      eventos: [ev(-1, 'Pagada - No iniciada')],
      respuestas: { 'contactar-comercio': { texto: '📞 Llamada sin respuesta. Mensaje enviado al comercio: sin leer.' }, 'cancelar': { texto: 'Orden cancelada. Reembolso total al cliente.', estado: 'Cancelada' } },
      reglas: [rg('contactar-comercio', 0, 9, 'buena', 'Contactó al comercio por la orden no iniciada.', true), rg('contactar-comercio', 9, null, 'regular', 'Contactó tarde: pasaron más de 10 min sin iniciar.'),
        rg('cancelar', 9, null, 'buena', 'Canceló a los 10 min de pagada, sin respuesta del comercio.', true), rg('cancelar', 0, 9, 'mala', 'Canceló sin esperar los 10 min de respuesta del comercio.')] },
    { id: 'ZP-48322', comercio: 'Monte Bakery', cliente: 'Valentina Rojas', zona: 'Chacao', total: '$9,60', items: ['Croissant de jamón x2', 'Café latte x1'],
      eventos: [ev(0, 'Pagada - No iniciada'), ev(2, 'Pagada - No iniciada', 'Jesús P. (ID 74)'), ev(6, 'En comercio', 'Jesús P. (ID 74)')],
      noIniciadaConRepartidor: true,
      respuestas: { 'contactar-comercio': { texto: 'Monte Bakery: «¡Sí, ya estaba lista! Se nos olvidó marcarla 🙈». La orden pasa a Despachada.', estado: 'Despachada' }, 'cancelar': { texto: 'Orden cancelada. El repartidor queda liberado.', estado: 'Cancelada' } },
      reglas: [rg('contactar-comercio', 5, null, 'buena', 'El repartidor estaba en el comercio con la orden sin iniciar: contactó al comercio.', true), rg('contactar-comercio', 0, 5, 'regular', 'Contactó antes de tiempo (todavía estaba dentro de lo normal).'),
        rg('cancelar', 0, null, 'mala', 'Canceló una orden que estaba lista: había que contactar al comercio.'), rg('contactar-repartidor', 0, null, 'regular', 'El repartidor ya estaba en el local: el pendiente era del comercio.')] },
    { id: 'ZP-48335', comercio: 'Forum SuperMayorista', cliente: 'Héctor Blanco', zona: 'La Urbina', total: '$42,75', items: ['Mercado: 18 productos'],
      eventos: [ev(3, 'Pagada - No iniciada')],
      respuestas: { 'publicar-shoppers': { texto: 'Grupo de Shoppers: «La tomo yo» — Yorman (Shopper). La orden pasa a Preparación iniciada.', estado: 'Preparación iniciada' }, 'contactar-comercio': { texto: 'Forum: «Las órdenes las toman los Shoppers, publíquenla en el grupo».' } },
      reglas: [rg('publicar-shoppers', 3, 15, 'buena', 'Publicó la orden nueva de Forum en el grupo de Shoppers.', true), rg('publicar-shoppers', 15, null, 'regular', 'Publicó tarde en el grupo de Shoppers.'),
        rg('contactar-comercio', 0, null, 'regular', 'En Forum las órdenes las toman los Shoppers.'), rg('cancelar', 0, null, 'mala', 'Canceló una orden de Forum que solo faltaba publicar.')] },
    { id: 'ZP-48340', comercio: 'Pizzería Da Marco', cliente: 'Sofía Méndez', zona: 'El Cafetal', total: '$13,90', items: ['Pizza margarita mediana x1'],
      eventos: [ev(-6, 'Pagada - No iniciada'), ev(-4, 'Preparación iniciada'), ev(4, 'Preparada')],
      respuestas: { 'reasignar': { texto: 'Asignada a Kevin R. (ID 133). Llega al local en 4 min.', estado: 'Asignada', repartidor: 'Kevin R. (ID 133)' }, 'contactar-comercio': { texto: 'Pizzería Da Marco: «Ya está lista, solo falta el motorizado».' } },
      reglas: [rg('reasignar', 11, null, 'buena', 'Asignó repartidor a mano tras más de 8 min preparada sin repartidor.', true), rg('reasignar', 0, 11, 'regular', 'Asignó a mano antes de los 8 min (la asignación automática aún podía funcionar).'),
        rg('contactar-comercio', 0, null, 'regular', 'El comercio no era el problema: faltaba repartidor.'), rg('cancelar', 0, null, 'mala', 'Canceló una orden lista: había que asignar repartidor.')] },
    { id: 'ZP-48351', comercio: 'La Casa del Pan', cliente: 'Ricardo Lugo', zona: 'Altamira', total: '$7,30', items: ['Pan campesino x1', 'Golfeados x4'],
      eventos: [ev(0, 'Pagada - No iniciada'), ev(2, 'Preparación iniciada'), ev(5, 'Asignada', 'María V. (ID 58)'), ev(9, 'Despachada', 'María V. (ID 58)'), ev(10, 'En camino', 'María V. (ID 58)'), ev(22, 'Completada', 'María V. (ID 58)')],
      respuestas: {},
      reglas: [rg('cancelar', 0, null, 'mala', 'Canceló una orden que iba en tiempo.')] },
    { id: 'ZP-48362', comercio: 'Sushi Express (Las Mercedes)', cliente: 'Paola Castillo', zona: 'Las Mercedes', total: '$21,00', items: ['Roll acevichado x2'],
      eventos: [ev(-25, 'Pagada - No iniciada'), ev(-23, 'Preparación iniciada'), ev(-12, 'Asignada', 'Ramón T. (ID 61)'), ev(-5, 'En camino', 'Ramón T. (ID 61)'), ev(6, 'En destino', 'Ramón T. (ID 61)')],
      respuestas: { 'contactar-repartidor': { texto: 'Repartidor: «Estoy en la dirección, el cliente no contesta. Ya lo llamé 3 veces».' }, 'devolver-comercio': { texto: 'Se le indicó al repartidor devolver el pedido al comercio. Comercio notificado.', estado: 'Cancelada' } },
      reglas: [rg('contactar-repartidor', 6, null, 'buena', 'Confirmó con el repartidor en destino.'), rg('devolver-comercio', 21, null, 'buena', 'Indicó devolver al comercio tras 15 min en destino sin respuesta del cliente.', true),
        rg('devolver-comercio', 0, 21, 'mala', 'Mandó a devolver antes de los 15 min de espera en destino.'), rg('cancelar', 0, null, 'mala', 'No se cancela: el pedido se devuelve al comercio.')] },
    /* Órdenes de los tickets: aparecen en el panel para que el aspirante las busque (no se califican) */
    { id: 'ZP-48213', comercio: 'Sushi Express (Las Mercedes)', cliente: 'Andreína Pérez', zona: 'Bello Monte', total: '$18,40', items: ['Combo Tokio x1', 'Té frío x1'], eventos: [ev(-72, 'Pagada - No iniciada'), ev(-60, 'Preparación iniciada')],
      respuestas: { 'contactar-comercio': { texto: 'Sushi Express: «Disculpen, estamos full. Sale en 10 minutos».' } }, reglas: [] },
    { id: 'ZP-48197', comercio: 'Forum SuperMayorista', cliente: 'Carlos Rivas', zona: 'La Urbina', total: '$9,80', items: ['Harina PAN 1 kg x2', 'Arroz 1 kg x1', 'Refresco 2 L x1 · $2,50'], eventos: [ev(-48, 'Completada', 'Jhonny M. (ID 84)')],
      respuestas: { 'contactar-comercio': { texto: 'Forum: «Revisamos la comanda: el refresco no se incluyó».' } }, reglas: [] },
    { id: 'ZP-48240', comercio: 'Arepera La Quinta', cliente: 'Mariana Gómez', zona: 'Chacao', total: '$11,00', items: ['Arepa reina pepiada x2', 'Jugo de parchita x1'], eventos: [ev(-21, 'Creada - No pagada')], respuestas: {}, reglas: [] },
    { id: 'ZP-48255', comercio: 'Sopas Doña Carmen', cliente: 'José Hernández', zona: 'El Rosal', total: '$10,50', items: ['Sopa de res grande x1 · $8,00', 'Casabe x1'], eventos: [ev(-39, 'Completada', 'Luis A. (ID 112)')], respuestas: {}, reglas: [] },
    { id: 'ZP-48266', comercio: 'Burger Lab', cliente: 'Daniela Suárez', zona: 'Altamira → Los Palos Grandes', total: '$12,30', items: ['Doble smash x1', 'Papas medianas x1'], eventos: [ev(-26, 'En camino', 'Pedro C. (ID 97)')], respuestas: {}, reglas: [] },
    { id: 'ZP-48377', comercio: 'Pollos El Gran Chef', cliente: 'Luisa Fernández', zona: 'Chacaíto', total: '$14,50', items: ['Pollo entero x1', 'Yuca frita x1'], eventos: [ev(-55, 'Completada', 'Ramón T. (ID 61)')],
      respuestas: { 'contactar-repartidor': { texto: '📞 Dos llamadas al repartidor sin respuesta.' } }, reglas: [] }
  ];
  const SIMULADOR_DEFAULT = { activo: true, intentos: 1, minutos: 20, velocidad: 10, motivos: SIM_MOTIVOS_DEFAULT, casos: SIM_CASOS_DEFAULT, ordenes: SIM_ORDENES_DEFAULT };

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
    return cfg;
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
       { extra, sesiones: [{ id, inicio, fin, estado: 'en-curso'|'terminada', velocidad, minutos,
           casos: [{ id, llegada, humor, paso, pasos, chat, respuestas, motivo, motivoOk, cerrado, primera }],
           acciones: [{ orden, accion, min, f, v, nota, texto, estado, repartidor }], resumen }] } */
  function configSim(cfg) {
    const s = Object.assign({}, SIMULADOR_DEFAULT, cfg.simulador || {});
    s.motivos = (s.motivos && s.motivos.length) ? s.motivos : SIM_MOTIVOS_DEFAULT;
    s.casos = s.casos || []; s.ordenes = s.ordenes || [];
    return s;
  }
  const humorTxt = h => SIM_HUMOR[Math.max(0, Math.min(4, h))];
  const segDesde = iso => (Date.now() - Date.parse(iso)) / 1000;
  const minutoSim = ses => Math.round(segDesde(ses.inicio) / 60 * (ses.velocidad || 10) * 10) / 10;
  const vencida = ses => ses.estado === 'en-curso' && segDesde(ses.inicio) > (ses.minutos || 20) * 60 + 5;

  // Estado de una orden en el minuto simulado `min`, con lo que cambiaron las acciones del aspirante
  function estadoOrden(o, min, acciones) {
    let estado = 'Pagada - No iniciada', repartidor = '', desde = -999;
    const pasos = (o.eventos || []).map(e => ({ min: e.min, estado: e.estado, repartidor: e.repartidor }))
      .concat((acciones || []).filter(a => a.orden === o.id && (a.estado || a.repartidor)).map(a => ({ min: a.min, estado: a.estado, repartidor: a.repartidor, forzado: true })))
      .sort((a, b) => a.min - b.min);
    let fijo = false;   // tras una acción que cierra la orden, los eventos automáticos ya no la mueven
    for (const p of pasos) {
      if (p.min > min) break;
      if (fijo && !p.forzado) continue;
      if (p.estado && p.estado !== estado) { estado = p.estado; desde = p.min; }
      if (p.repartidor) repartidor = p.repartidor;
      if (p.forzado && ['Cancelada', 'Despachada', 'Completada'].includes(p.estado)) fijo = true;
    }
    return { estado, repartidor, desde };
  }

  function puntosSim(ses, s) {
    let tp = 0, tmax = 0, pendientes = 0, resueltos = 0, prim = [];
    for (const c of ses.casos) {
      tmax += (c.pasos || 0) * 2 + 2;
      for (const r of c.respuestas) { if (r.v === 'pendiente') pendientes++; else tp += SIM_PUNTOS[r.v] || 0; }
      if (c.motivoOk) tp += 2;
      if (c.cerrado) resueltos++;
      if (c.primera != null) prim.push(c.primera);
    }
    let op = 0, omax = 0; const sinGestion = [];
    const vistos = new Set();
    for (const o of s.ordenes) {
      for (const r of (o.reglas || []).filter(x => x.esperada)) {
        omax += 2;
        if (!ses.acciones.some(a => a.orden === o.id && a.accion === r.accion && a.v === 'buena')) sinGestion.push(o.id + ' · ' + (SIM_ACCIONES[r.accion] || r.accion) + ': ' + r.nota);
      }
    }
    for (const a of ses.acciones) {
      const k = a.orden + '|' + a.accion;
      if (vistos.has(k) || a.v == null) continue; vistos.add(k);
      op += SIM_PUNTOS[a.v] || 0;
    }
    op = Math.min(op, omax);
    const max = tmax + omax, pts = tp + op;
    return { nota: max ? Math.round(pts / max * 100) : 0, pts, max, pendientes, tickets: { pts: tp, max: tmax, resueltos, total: ses.casos.length },
      ordenes: { pts: op, max: omax, acciones: ses.acciones.length, malas: ses.acciones.filter(a => a.v === 'mala').length, sinGestion },
      primeraPromedio: prim.length ? Math.round(prim.reduce((x, y) => x + y, 0) / prim.length) : null };
  }

  function terminarSim(ses, s) {
    if (ses.estado !== 'terminada') { ses.estado = 'terminada'; ses.fin = ahora(); }
    ses.resumen = puntosSim(ses, s);
  }

  // Lo que ve el aspirante: textos, estados y tiempos. Nunca qué es correcto ni las reglas.
  function vistaSim(ses, s) {
    const defCaso = id => s.casos.find(c => c.id === id);
    return {
      id: ses.id, inicio: ses.inicio, ahora: ahora(), estado: ses.estado, velocidad: ses.velocidad, minutos: ses.minutos, motivos: s.motivos, acciones: SIM_ACCIONES,
      tickets: ses.casos.map(c => {
        const d = defCaso(c.id) || { pasos: [], cliente: {} };
        const paso = d.pasos[c.paso];
        return { id: c.id, numero: c.numero, llegada: c.llegada, asunto: d.asunto || '', canal: 'WhatsApp', cliente: d.cliente || {}, humor: humorTxt(c.humor), nivel: c.humor,
          chat: c.chat, cerrado: !!c.cerrado, motivo: c.motivo || '', listo: !paso,
          opciones: (!c.cerrado && paso) ? barajar(paso.opciones.map((o, i) => ({ i, t: o.t }))) : [] };
      }),
      ordenes: s.ordenes.map(o => ({ id: o.id, comercio: o.comercio, cliente: o.cliente, zona: o.zona || '', total: o.total || '', items: o.items || [],
        eventos: (o.eventos || []).map(e => ({ min: e.min, estado: e.estado, repartidor: e.repartidor || '' })) })),
      hechas: ses.acciones.map(a => ({ orden: a.orden, accion: a.accion, min: a.min, texto: a.texto, estado: a.estado || '', repartidor: a.repartidor || '' }))
    };
  }

  async function sesionSim(store, user, body) {
    const cfg = await cargarConfig(store);
    const s = configSim(cfg);
    const asp = await requerirAspirante(store, user);
    const sim = asp.simulador || { sesiones: [] };
    const ses = sim.sesiones.find(x => x.id === body.sesion);
    if (!ses) throw err(404, 'Simulación no encontrada.');
    if (vencida(ses)) { terminarSim(ses, s); asp.simulador = sim; await store.put('aspirantes', asp); throw err(409, 'Se acabó el tiempo de la simulación.'); }
    if (ses.estado !== 'en-curso') throw err(409, 'Esta simulación ya terminó.');
    return { cfg, s, asp, sim, ses };
  }

  const aspiranteSim = {
    async simEstado({ store, user }) {
      const cfg = await cargarConfig(store);
      const s = configSim(cfg);
      const asp = await requerirAspirante(store, user);
      const sim = asp.simulador || { sesiones: [] };
      const curso = sim.sesiones.find(x => x.estado === 'en-curso' && !vencida(x));
      const usadas = sim.sesiones.length - (curso ? 1 : 0);
      const permitidos = (Number(s.intentos) || 1) + (sim.extra || 0);
      const casos = s.casos.filter(c => c.activo !== false);
      return { activo: s.activo !== false && casos.length > 0, enCurso: !!curso, usadas, permitidos, minutos: s.minutos, tickets: casos.length, ordenes: s.ordenes.length,
        ultimas: sim.sesiones.filter(x => x.estado === 'terminada').slice(-3).reverse().map(x => ({ fecha: x.fin, resueltos: x.resumen ? x.resumen.tickets.resueltos : 0, total: x.casos.length,
          primeraPromedio: x.resumen ? x.resumen.primeraPromedio : null })) };
    },
    async simIniciar({ store, user }) {
      const cfg = await cargarConfig(store);
      const s = configSim(cfg);
      const asp = await requerirAspirante(store, user);
      const sim = asp.simulador || { sesiones: [] };
      for (const x of sim.sesiones) if (vencida(x)) terminarSim(x, s);
      let ses = sim.sesiones.find(x => x.estado === 'en-curso');
      if (!ses) {
        if (s.activo === false) throw err(403, 'El simulador no está disponible por ahora.');
        const permitidos = (Number(s.intentos) || 1) + (sim.extra || 0);
        if (sim.sesiones.length >= permitidos) throw err(403, 'Ya usaste tus intentos del simulador. Si necesitas otro, escríbele al equipo.');
        const activos = s.casos.filter(c => c.activo !== false);
        const deCelula = activos.filter(c => !c.celula || c.celula === asp.celula);
        const casos = (deCelula.length ? deCelula : activos).sort((a, b) => (a.llegada || 0) - (b.llegada || 0));
        if (!casos.length) throw err(403, 'Todavía no hay casos cargados en el simulador.');
        let numero = 2988100 + Math.floor(Math.random() * 800);
        ses = { id: nuevoId('sim'), inicio: ahora(), fin: null, estado: 'en-curso', velocidad: Number(s.velocidad) || 10, minutos: Number(s.minutos) || 20,
          casos: casos.map(c => ({ id: c.id, numero: numero += 1 + Math.floor(Math.random() * 9), llegada: Number(c.llegada) || 0, humor: c.humor == null ? 3 : c.humor, paso: 0, pasos: c.pasos.length,
            chat: c.pasos[0].cliente.map(t => ({ de: 'cliente', t })), respuestas: [], motivo: '', motivoOk: false, cerrado: false, primera: null })),
          acciones: [], resumen: null };
        sim.sesiones.push(ses);
        sim.sesiones = sim.sesiones.slice(-6);
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
      if (c.cerrado) throw err(409, 'Este ticket ya está resuelto.');
      const llegado = segDesde(ses.inicio) - c.llegada;
      if (llegado < -2) throw err(409, 'Este ticket todavía no ha llegado.');
      const paso = d.pasos[c.paso];
      if (!paso) throw err(409, 'El cliente ya no está esperando respuesta. Elige el motivo de contacto y resuelve el ticket.');
      let t, v, r, h = 0, i = null;
      const otro = limpiar(body.otro, 1000);
      if (otro) { t = otro; v = 'pendiente'; r = paso.otro && paso.otro.length ? paso.otro : ['Ok']; }
      else {
        i = Number(body.opcion);
        const o = paso.opciones[i];
        if (!o) throw err(400, 'Elige una respuesta.');
        t = o.t; v = o.v; r = o.r; h = Number(o.h) || 0;
      }
      if (c.primera == null) c.primera = Math.max(0, Math.round(llegado));
      c.respuestas.push({ paso: c.paso, i, t, v, otro: !!otro, f: ahora(), seg: Math.max(0, Math.round(llegado)) });
      c.chat.push({ de: 'agente', t });
      c.humor = Math.max(0, Math.min(4, c.humor + h));
      c.paso += 1;
      const sig = d.pasos[c.paso];
      const nuevos = r.concat(sig ? sig.cliente : []).map(x => ({ de: 'cliente', t: x }));
      c.chat.push(...nuevos);
      asp.simulador = sim;
      await store.put('aspirantes', asp);
      return { mensajes: nuevos, humor: humorTxt(c.humor), nivel: c.humor, listo: !sig, opciones: sig ? barajar(sig.opciones.map((o, k) => ({ i: k, t: o.t }))) : [] };
    },
    async simResolver({ store, user, body }) {
      const { s, asp, sim, ses } = await sesionSim(store, user, body);
      const c = ses.casos.find(x => x.id === body.ticket);
      const d = s.casos.find(x => x.id === body.ticket);
      if (!c || !d) throw err(404, 'Ticket no encontrado.');
      const motivo = limpiar(body.motivo, 120);
      if (!motivo || !s.motivos.includes(motivo)) throw err(400, 'Elige el motivo de contacto antes de resolver el ticket.');
      if (!c.respuestas.length) throw err(400, 'Responde al cliente antes de resolver el ticket.');
      c.motivo = motivo; c.motivoOk = motivo === d.motivo; c.cerrado = true; c.cerradoF = ahora();
      const pendientes = ses.casos.filter(x => !x.cerrado).length;
      asp.simulador = sim;
      await store.put('aspirantes', asp);
      return { ok: true, pendientes };
    },
    async simAccion({ store, user, body }) {
      const { s, asp, sim, ses } = await sesionSim(store, user, body);
      const o = s.ordenes.find(x => x.id === body.orden);
      if (!o) throw err(404, 'Orden no encontrada.');
      const accion = String(body.que || '');   // «accion» ya lo usa el despachador
      if (!SIM_ACCIONES[accion]) throw err(400, 'Acción desconocida.');
      const min = minutoSim(ses);
      const actual = estadoOrden(o, min, ses.acciones);
      if (['Cancelada', 'Completada'].includes(actual.estado)) throw err(409, 'La orden ya está ' + actual.estado.toLowerCase() + '.');
      const repetida = ses.acciones.some(a => a.orden === o.id && a.accion === accion);
      const regla = (o.reglas || []).find(x => x.accion === accion && min >= x.desde && min < x.hasta);
      const efecto = (o.respuestas || {})[accion] || {};
      const texto = efecto.texto || ({ 'contactar-comercio': 'Mensaje enviado al comercio.', 'contactar-repartidor': 'Mensaje enviado al repartidor.', 'publicar-shoppers': 'Publicado en el grupo de Shoppers.',
        'reasignar': 'Solicitud de reasignación enviada.', 'devolver-comercio': 'Se indicó devolver el pedido al comercio.', 'cancelar': 'Orden cancelada.' })[accion];
      const a = { orden: o.id, accion, min, f: ahora(), texto, estado: efecto.estado || (accion === 'cancelar' ? 'Cancelada' : ''), repartidor: efecto.repartidor || '',
        v: repetida ? null : (regla ? regla.v : ((o.reglas || []).length ? 'mala' : null)), nota: regla ? regla.nota : (repetida ? 'Acción repetida' : 'Acción sin sustento en el estatus de la orden') };
      ses.acciones.push(a);
      asp.simulador = sim;
      await store.put('aspirantes', asp);
      return { hecha: { orden: a.orden, accion, min, texto, estado: a.estado, repartidor: a.repartidor } };
    },
    async simTerminar({ store, user, body }) {
      const cfg = await cargarConfig(store);
      const s = configSim(cfg);
      const asp = await requerirAspirante(store, user);
      const sim = asp.simulador || { sesiones: [] };
      const ses = sim.sesiones.find(x => x.id === body.sesion);
      if (!ses) throw err(404, 'Simulación no encontrada.');
      terminarSim(ses, s);
      asp.simulador = sim;
      await store.put('aspirantes', asp);
      const r = ses.resumen;    // el aspirante no ve su nota: la revisa el equipo
      return { resueltos: r.tickets.resueltos, total: r.tickets.total, primeraPromedio: r.primeraPromedio, acciones: r.ordenes.acciones };
    }
  };

  const adminSim = {
    async simResultados({ store }) {
      const cfg = await cargarConfig(store);
      const s = configSim(cfg);
      const asps = (await store.find('aspirantes', {})).filter(a => a.simulador && a.simulador.sesiones && a.simulador.sesiones.length);
      const filas = [];
      for (const a of asps) {
        for (const x of a.simulador.sesiones) {
          if (vencida(x)) terminarSim(x, s);
          const r = x.resumen || puntosSim(x, s);
          filas.push({ id: a._id, nombre: a.nombre, celula: a.celula, sesion: x.id, inicio: x.inicio, fin: x.fin, estado: x.estado, nota: r.nota, pendientes: r.pendientes,
            resueltos: r.tickets.resueltos, total: r.tickets.total, primeraPromedio: r.primeraPromedio, malas: r.ordenes.malas, sinGestion: r.ordenes.sinGestion.length,
            intentos: a.simulador.sesiones.length, permitidos: (Number(s.intentos) || 1) + (a.simulador.extra || 0) });
        }
      }
      filas.sort((x, y) => String(y.inicio).localeCompare(String(x.inicio)));
      return { filas, config: { activo: s.activo !== false, intentos: s.intentos, minutos: s.minutos, velocidad: s.velocidad, tickets: s.casos.length, ordenes: s.ordenes.length } };
    },
    async simDetalle({ store, body }) {
      const cfg = await cargarConfig(store);
      const s = configSim(cfg);
      const a = await store.get('aspirantes', body.id);
      const x = a && a.simulador && a.simulador.sesiones.find(y => y.id === body.sesion);
      if (!x) throw err(404, 'Simulación no encontrada.');
      if (vencida(x)) terminarSim(x, s);
      return { aspirante: { id: a._id, nombre: a.nombre, celula: a.celula }, sesion: { id: x.id, inicio: x.inicio, fin: x.fin, estado: x.estado, velocidad: x.velocidad, resumen: x.resumen || puntosSim(x, s) },
        tickets: x.casos.map(c => {
          const d = s.casos.find(y => y.id === c.id) || { pasos: [], cliente: {} };
          return { id: c.id, numero: c.numero, asunto: d.asunto || c.id, cliente: (d.cliente || {}).nombre || '', motivoCorrecto: d.motivo || '', motivo: c.motivo, motivoOk: c.motivoOk, cerrado: c.cerrado,
            primera: c.primera, humor: humorTxt(c.humor), chat: c.chat,
            respuestas: c.respuestas.map((r, k) => ({ k, paso: r.paso, t: r.t, v: r.v, otro: r.otro, seg: r.seg,
              opciones: ((d.pasos[r.paso] || {}).opciones || []).map(o => ({ t: o.t, v: o.v })) })) };
        }),
        ordenes: s.ordenes.filter(o => (o.reglas || []).length || x.acciones.some(y => y.orden === o.id)).map(o => ({ id: o.id, comercio: o.comercio,
          acciones: x.acciones.filter(y => y.orden === o.id).map(y => ({ accion: SIM_ACCIONES[y.accion] || y.accion, min: y.min, v: y.v, nota: y.nota })),
          esperadas: (o.reglas || []).filter(r => r.esperada).map(r => ({ accion: SIM_ACCIONES[r.accion] || r.accion, nota: r.nota, hecha: x.acciones.some(y => y.orden === o.id && y.accion === r.accion && y.v === 'buena') })) })) };
    },
    async simCalificar({ store, body }) {
      const cfg = await cargarConfig(store);
      const s = configSim(cfg);
      if (!SIM_PUNTOS.hasOwnProperty(body.v)) throw err(400, 'Elige buena, regular o mala.');
      const a = await store.get('aspirantes', body.id);
      const x = a && a.simulador && a.simulador.sesiones.find(y => y.id === body.sesion);
      const c = x && x.casos.find(y => y.id === body.ticket);
      const r = c && c.respuestas[Number(body.k)];
      if (!r || !r.otro) throw err(404, 'Respuesta no encontrada.');
      r.v = body.v; r.revisada = ahora();
      if (x.estado === 'terminada') x.resumen = puntosSim(x, s);
      await store.put('aspirantes', a);
      return { resumen: x.resumen || puntosSim(x, s) };
    },
    async simReiniciar({ store, body }) {
      const a = await store.get('aspirantes', body.id);
      if (!a) throw err(404, 'Aspirante no encontrado.');
      const cfg = await cargarConfig(store);
      const sim = a.simulador || { sesiones: [] };
      sim.sesiones.forEach(x => { if (x.estado === 'en-curso') terminarSim(x, configSim(cfg)); });
      sim.extra = (sim.extra || 0) + 1;
      a.simulador = sim;
      await store.put('aspirantes', a);
      return { ok: true };
    },
    async simConfig({ store }) {
      const cfg = await cargarConfig(store);
      const s = configSim(cfg);
      return { simulador: { formato: SIM_FORMATO, activo: s.activo !== false, intentos: s.intentos, minutos: s.minutos, velocidad: s.velocidad, motivos: s.motivos, casos: s.casos, ordenes: s.ordenes },
        acciones: SIM_ACCIONES, estados: SIM_ESTADOS };
    },
    async simGuardarConfig({ store, body }) {
      const cfg = await cargarConfig(store);
      const s = configSim(cfg);
      const n = (v, min, max, def) => { const x = Math.round(Number(v)); return x >= min && x <= max ? x : def; };
      const nuevo = { activo: body.activo !== false, intentos: n(body.intentos, 1, 10, s.intentos), minutos: n(body.minutos, 5, 90, s.minutos), velocidad: n(body.velocidad, 1, 30, s.velocidad),
        motivos: s.motivos, casos: s.casos, ordenes: s.ordenes };
      if (body.archivo) {   // archivo .json exportado desde el panel y editado
        const f = body.archivo;
        if (f.formato !== SIM_FORMATO) throw err(400, 'El archivo no es del simulador de Ridery Academy.');
        const motivos = (f.motivos || []).map(m => limpiar(m, 120)).filter(Boolean);
        if (!motivos.length) throw err(400, 'El archivo no trae motivos de contacto.');
        const casos = (f.casos || []).map((c, k) => {
          const pasos = (c.pasos || []).map(p => ({ cliente: [].concat(p.cliente || []).map(t => limpiar(t, 1000)).filter(Boolean),
            opciones: (p.opciones || []).map(o => ({ t: limpiar(o.t, 1000), v: SIM_PUNTOS.hasOwnProperty(o.v) ? o.v : 'mala', r: [].concat(o.r || []).map(t => limpiar(t, 1000)).filter(Boolean), h: n(o.h, -4, 4, 0) })).filter(o => o.t),
            otro: [].concat(p.otro || []).map(t => limpiar(t, 1000)).filter(Boolean) }));
          if (!c.id || !pasos.length || pasos.some(p => p.opciones.length < 2)) throw err(400, 'Caso ' + (k + 1) + ': necesita id y cada paso al menos 2 opciones.');
          if (!pasos[0].cliente.length) throw err(400, 'Caso ' + c.id + ': el primer paso necesita el mensaje del cliente.');
          if (!motivos.includes(c.motivo)) throw err(400, 'Caso ' + c.id + ': su motivo no está en la lista de motivos.');
          return { id: limpiar(c.id, 60), celula: limpiar(c.celula, 40), activo: c.activo !== false, llegada: n(c.llegada, 0, 3600, 0), humor: n(c.humor, 0, 4, 3), asunto: limpiar(c.asunto, 140),
            cliente: { nombre: limpiar((c.cliente || {}).nombre, 80), telefono: limpiar((c.cliente || {}).telefono, 30), notas: limpiar((c.cliente || {}).notas, 300) }, motivo: c.motivo, pasos };
        });
        const ordenes = (f.ordenes || []).map((o, k) => {
          if (!o.id || !o.comercio) throw err(400, 'Orden ' + (k + 1) + ': necesita id y comercio.');
          const reglas = (o.reglas || []).map(r => ({ accion: r.accion, desde: Number(r.desde) || 0, hasta: r.hasta == null ? 9999 : Number(r.hasta), v: SIM_PUNTOS.hasOwnProperty(r.v) ? r.v : 'mala', nota: limpiar(r.nota, 300), esperada: !!r.esperada }));
          if (reglas.some(r => !SIM_ACCIONES[r.accion])) throw err(400, 'Orden ' + o.id + ': tiene una acción desconocida.');
          const respuestas = {};
          Object.entries(o.respuestas || {}).forEach(([k2, r]) => { if (SIM_ACCIONES[k2]) respuestas[k2] = { texto: limpiar(r.texto, 500), estado: SIM_ESTADOS.includes(r.estado) ? r.estado : '', repartidor: limpiar(r.repartidor, 80) }; });
          return { id: limpiar(o.id, 30), comercio: limpiar(o.comercio, 80), cliente: limpiar(o.cliente, 80), zona: limpiar(o.zona, 80), total: limpiar(o.total, 20), items: (o.items || []).map(t => limpiar(t, 120)),
            eventos: (o.eventos || []).filter(e => SIM_ESTADOS.includes(e.estado)).map(e => ({ min: Number(e.min) || 0, estado: e.estado, repartidor: limpiar(e.repartidor, 80) })), respuestas, reglas };
        });
        if (!casos.length) throw err(400, 'El archivo no trae casos.');
        Object.assign(nuevo, { motivos, casos, ordenes });
      }
      cfg.simulador = nuevo;
      await store.put('config', cfg);
      return { ok: true, tickets: nuevo.casos.length, ordenes: nuevo.ordenes.length };
    }
  };

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

  Object.assign(aspirante, aspiranteSim);

  /* ---------- Acciones del administrador ---------- */
  function fila(asp, modulos, cfg) {
    const p = progresoAspirante(asp, modulos, cfg.reglas);
    return { _id: asp._id, nombre: asp.nombre, cedula: asp.cedula, email: asp.email, telefono: asp.telefono, ciudad: asp.ciudad || '', cohorte: asp.cohorte,
      edad: asp.edad || null, nota: asp.test && asp.test.evaluacion ? asp.test.evaluacion.nota : null,
      alertas: asp.test ? (asp.test.alertas || []).length : 0, autoDescartado: !!asp.motivoDescarte,
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

  const H = { COMUN, CELULAS_DEFAULT, REGLAS_DEFAULT, TIPOS, FORMATO_ARCHIVO, elegidas, seccionesVisibles, cumpleCondicion, ordenarPreguntas, evaluarPostulacion, err, nuevoId, cargarConfig, calcularCelula, construirRuta, calificar, loginAspirante, loginAdmin, iniciarSesion, vistaAspirante, estadoDe, PERFILES, ejecutar, SIM_ACCIONES, SIM_ESTADOS, SIM_FORMATO, estadoOrden };
  if (typeof module !== 'undefined' && module.exports) module.exports = H; else root.ElxHandlers = H;
})(typeof window !== 'undefined' ? window : globalThis);
