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
    'Orders : Pedido no llegó', 'Orders : Cambio de dirección', 'Orders : Pago no reflejado', 'Orders : Cancelación de orden', 'Orders : Producto agotado',
    'Otro : Fuera de alcance (transferir)'
  ];
  const op = (v, t, r, h) => ({ v, t, r: [].concat(r || []), h: h || 0 });
  const SIM_CASOS_DEFAULT = [
    { id: 'ord-retraso', celula: 'ORDERS', activo: true, llegada: 0, humor: 2, asunto: 'Pedido con más de 1 hora de retraso',
      cliente: { nombre: 'Andreína Pérez', telefono: '+584142215870', notas: 'Usuario: 208114 Andreína Pérez' },
      motivo: 'Orders : Retraso en la entrega',
      pasos: [
        { cliente: ['Buenas, mi pedido tiene más de una hora y nada', 'Ya pagué y en la app sigue igual'],
          opciones: [
            op('buena', '¡Hola, Andreína! Gracias por escribirnos. Lamento la espera con tu pedido #0BE-0000371; ya lo estoy revisando en este momento.', 'Ok, gracias. Es que tengo hambre y ya pagué 😩', 1),
            op('regular', 'Buenas tardes. Indíqueme su número de orden, por favor.', 'Es el 0BE-0000371, sale ahí mismo en la app. Llevo más de una hora esperando', -1),
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
    { id: 'ord-no-llego', celula: 'ORDERS', activo: true, llegada: 125, humor: 1, asunto: 'Dice entregado y no me llegó',
      cliente: { nombre: 'Luisa Fernández', telefono: '+584125561047', notas: 'Usuario: 176201 Luisa Fernández' },
      motivo: 'Orders : Pedido no llegó',
      pasos: [
        { cliente: ['La app dice que mi pedido fue ENTREGADO y yo no he recibido NADA', 'Esto es una estafa'],
          opciones: [
            op('buena', 'Hola, Luisa. Entiendo tu molestia. Ya mismo reviso qué pasó con tu pedido #1D5-0000455 y me comunico con el repartidor.', 'Por favor, porque ya pagué y nada', 1),
            op('regular', 'Verifique bien, a veces lo dejan en recepción.', 'Ya bajé a recepción, no hay nada.', -1),
            op('mala', 'En el sistema sale entregado, así que sí le llegó.', '¿Me estás llamando mentirosa?', -2)
          ], otro: ['Ajá, ¿y qué van a hacer?'] },
        { cliente: [],
          opciones: [
            op('buena', 'Intenté comunicarme dos veces con el repartidor y no responde. Para no hacerte esperar más, ya procesé el reembolso total de tu orden ($14,50) a tu método de pago original. Nosotros nos encargamos internamente con el repartidor.', 'Ok, gracias por resolver rápido', 2),
            op('regular', 'Le doy ZupperCredits por el monto para su próxima compra.', 'Yo no quiero créditos, quiero mi dinero.', -1),
            op('mala', 'Espere un rato más, el repartidor debe estar por llegar.', '¡Dice ENTREGADO! ¿Cómo que por llegar?', -2)
          ], otro: ['¿Y mi dinero?'] }
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
    { id: 'basico', nombre: 'Básico', descripcion: 'Un ticket a la vez para que te adaptes a Zendesk. Sin panel de órdenes.', minutos: 15, maxAbiertos: 1, intervalo: 8, panel: false, estados: false,
      casos: ['ord-incompleto', 'ord-pago', 'ord-direccion'] },
    { id: 'intermedio', nombre: 'Intermedio', descripcion: 'Hasta 2 tickets a la vez, Panel de órdenes y estatus del ticket. Aparece un caso que no es de Orders.', minutos: 20, maxAbiertos: 2, intervalo: 10, panel: true, estados: true,
      casos: ['ord-incompleto', 'ord-retraso', 'ord-pago', 'fx-conductor-pago', 'ord-mal-estado', 'ord-sin-respuesta'] },
    { id: 'avanzado', nombre: 'Realidad', descripcion: 'Como un pico real: los tickets llegan por tiempo aunque no hayas terminado los anteriores, y el panel no se detiene.', minutos: 25, maxAbiertos: 0, intervalo: 0, panel: true, estados: true,
      casos: ['ord-retraso', 'ord-incompleto', 'ord-pago', 'fx-conductor-pago', 'ord-mal-estado', 'ord-direccion', 'fx-viaje-cobro', 'ord-no-llego', 'ord-sin-respuesta'] }
  ];

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
  const SIMULADOR_DEFAULT = { activo: true, intentos: 1, velocidad: 10, niveles: SIM_NIVELES_DEFAULT, motivos: SIM_MOTIVOS_DEFAULT, casos: SIM_CASOS_DEFAULT, ordenes: SIM_ORDENES_DEFAULT };

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
       { extra: { nivel: n }, sesiones: [{ id, nivel, inicio, fin, estado: 'en-curso'|'terminada', velocidad, minutos, panel, conEstados,
           casos: [{ id, numero, llegada, humor, paso, pasos, chat, respuestas, motivo, motivoOk, estadoTicket, estadoOk, cerrado, primera }],
           acciones: [{ orden, accion, min, f, v, nota, texto, c, e, rep, rol }], resumen }] } */
  function configSim(cfg) {
    const s = Object.assign({}, SIMULADOR_DEFAULT, cfg.simulador || {});
    s.motivos = (s.motivos && s.motivos.length) ? s.motivos : SIM_MOTIVOS_DEFAULT;
    s.casos = s.casos || []; s.ordenes = s.ordenes || [];
    s.niveles = (s.niveles && s.niveles.length) ? s.niveles : SIM_NIVELES_DEFAULT;
    return s;
  }
  const humorTxt = h => SIM_HUMOR[Math.max(0, Math.min(4, h))];
  const segDesde = iso => (Date.now() - Date.parse(iso)) / 1000;
  const segSes = ses => segDesde(ses.inicio);
  const minutoSim = ses => Math.round(segSes(ses) / 60 * (ses.velocidad || 10) * 10) / 10;
  const vencida = ses => ses.estado === 'en-curso' && segSes(ses) > (ses.minutos || 20) * 60 + 5;
  const llego = (ses, c) => c.llegada != null && c.llegada <= segSes(ses) + 2;

  // Llegada progresiva: nunca más de maxAbiertos tickets abiertos a la vez
  function liberarTickets(ses) {
    if (!ses.maxAbiertos) return;
    const t = segSes(ses);
    const abiertos = ses.casos.filter(c => c.llegada != null && !c.cerrado && !c.aparcado).length;   // un ticket enviado como Abierto libera el cupo
    let libres = ses.maxAbiertos - abiertos, k = 0;
    for (const c of ses.casos) {
      if (libres <= 0) break;
      if (c.llegada == null) { c.llegada = Math.round(t + (ses.intervalo || 8) * (1 + k)); k++; libres--; }
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
  const ordenCerrada = st => st.c === 'Cancelada' || ['Cancelada', 'Completada'].includes(st.e);

  // Calificación del cliente (como la encuesta de satisfacción de Zendesk): sale del humor final del cliente
  const csatDe = c => !c.respuestas.length ? 'Sin atender' : c.humor >= 3 ? 'Bien' : 'Mal';
  function puntosSim(ses, s) {
    let tp = 0, tmax = 0, pendientes = 0, resueltos = 0, ortografia = 0; const prim = [];
    for (const c of ses.casos) {
      tmax += (c.pasos || 0) * 2 + 2 + (ses.conEstados ? 2 : 0);
      for (const r of c.respuestas) {
        if (r.v === 'pendiente') pendientes++; else tp += SIM_PUNTOS[r.v] || 0;
        if (r.ortografia && r.ortografia.length) ortografia++;
      }
      if (c.motivoOk) tp += 2;
      if (ses.conEstados && c.estadoOk) tp += 2;
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
        const k = a.orden + '|' + a.accion;
        if (vistos.has(k) || a.v == null) continue; vistos.add(k);
        op += SIM_PUNTOS[a.v] || 0;
      }
      op = Math.min(op, omax);
    }
    const max = tmax + omax, pts = tp + op;
    const csat = { bien: ses.casos.filter(c => csatDe(c) === 'Bien').length, mal: ses.casos.filter(c => csatDe(c) === 'Mal').length, sinAtender: ses.casos.filter(c => csatDe(c) === 'Sin atender').length };
    return { nota: max ? Math.round(pts / max * 100) : 0, pts, max, pendientes, ortografia, csat, tickets: { pts: tp, max: tmax, resueltos, total: ses.casos.length },
      ordenes: { pts: op, max: omax, acciones: ses.acciones.length, malas: ses.acciones.filter(a => a.v === 'mala').length, sinGestion },
      primeraPromedio: prim.length ? Math.round(prim.reduce((x, y) => x + y, 0) / prim.length) : null };
  }
  function terminarSim(ses, s) {
    if (ses.estado !== 'terminada') { ses.estado = 'terminada'; ses.fin = ahora(); }
    ses.resumen = puntosSim(ses, s);
  }

  // Lo que ve el aspirante: textos, estados y tiempos. Nunca qué es correcto ni las reglas.
  function vistaSim(ses, s) {
    const def = id => s.casos.find(c => c.id === id) || { pasos: [], cliente: {} };
    const nivel = s.niveles.find(n => n.id === ses.nivel) || {};
    return {
      id: ses.id, nivel: ses.nivel, nivelNombre: nivel.nombre || ses.nivel, inicio: ses.inicio, ahora: ahora(), estado: ses.estado, velocidad: ses.velocidad, minutos: ses.minutos,
      panel: !!ses.panel, conEstados: !!ses.conEstados, estadosTicket: SIM_ESTADOS_TICKET, motivos: s.motivos, acciones: SIM_ACCIONES,
      tickets: ses.casos.map(c => {
        const d = def(c.id), paso = d.pasos[c.paso];
        return { id: c.id, numero: c.numero, llegada: c.llegada, asunto: d.asunto || '', canal: 'WhatsApp', cliente: d.cliente || {}, humor: humorTxt(c.humor), nivel: c.humor,
          chat: c.chat, cerrado: !!c.cerrado, motivo: c.motivo || '', estadoTicket: c.estadoTicket || 'nuevo', listo: !paso,
          opciones: (!c.cerrado && paso) ? barajar(paso.opciones.map((o, i) => ({ i, t: o.t }))) : [] };
      }),
      ordenes: ses.panel ? s.ordenes.map(o => ({ id: o.id, comercio: o.comercio, cliente: o.cliente, total: o.total || '', metodo: o.metodo || 'movil', pago: o.pago || 'Pagada', items: o.items || [],
        eventos: (o.eventos || []).map(e => ({ min: e.min, c: e.c || '', e: e.e || '', rep: e.rep || '', rol: e.rep ? (e.rol || 'Repartidor') : '' })) })) : [],
      hechas: ses.acciones.map(a => ({ orden: a.orden, accion: a.accion, min: a.min, texto: a.texto, c: a.c || '', e: a.e || '', rep: a.rep || '', rol: a.rol || '' }))
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
    return { cfg, s, asp, sim, ses };
  }
  // Niveles con su estado para este aspirante: bloqueado / disponible / agotado
  function nivelesDe(s, sim) {
    let anteriorListo = true;
    return s.niveles.map(n => {
      const ses = sim.sesiones.filter(x => (x.nivel || 'avanzado') === n.id);
      const terminadas = ses.filter(x => x.estado === 'terminada' || vencida(x));
      const curso = ses.find(x => x.estado === 'en-curso' && !vencida(x));
      const permitidos = (Number(s.intentos) || 1) + ((sim.extra && sim.extra[n.id]) || 0);
      const usadas = ses.length - (curso ? 1 : 0);
      const r = { id: n.id, nombre: n.nombre, descripcion: n.descripcion, minutos: n.minutos, tickets: (n.casos || []).length, panel: !!n.panel,
        bloqueado: !anteriorListo, enCurso: !!curso, usadas, permitidos, quedan: Math.max(0, permitidos - usadas), terminado: terminadas.length > 0 };
      anteriorListo = r.terminado;
      return r;
    });
  }

  const aspiranteSim = {
    async simEstado({ store, user }) {
      const cfg = await cargarConfig(store);
      const s = configSim(cfg);
      const asp = await requerirAspirante(store, user);
      const sim = asp.simulador || { sesiones: [] };
      return { activo: s.activo !== false && s.casos.length > 0, niveles: nivelesDe(s, sim),
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
        if (nv.bloqueado) throw err(403, 'Primero termina el nivel anterior.');
        if (!nv.quedan) throw err(403, 'Ya usaste tus intentos de este nivel. Si necesitas otro, escríbele al equipo.');
        const casos = (n.casos || []).map(id => s.casos.find(c => c.id === id && c.activo !== false)).filter(Boolean);
        if (!casos.length) throw err(403, 'Este nivel todavía no tiene casos.');
        const progresivo = Number(n.maxAbiertos) > 0;
        if (!progresivo) casos.sort((a, b) => (a.llegada || 0) - (b.llegada || 0));
        let numero = 2988100 + Math.floor(Math.random() * 800);
        ses = { id: nuevoId('sim'), nivel: n.id, inicio: ahora(), fin: null, estado: 'en-curso', velocidad: Number(s.velocidad) || 10, minutos: Number(n.minutos) || 20,
          panel: !!n.panel, conEstados: !!n.estados, maxAbiertos: progresivo ? Number(n.maxAbiertos) : 0, intervalo: Number(n.intervalo) || 8,
          casos: casos.map((c, k) => ({ id: c.id, numero: numero += 1 + Math.floor(Math.random() * 9), llegada: progresivo ? (k < n.maxAbiertos ? k * (Number(n.intervalo) || 8) : null) : (Number(c.llegada) || 0),
            humor: c.humor == null ? 3 : c.humor, paso: 0, pasos: c.pasos.length, chat: c.pasos[0].cliente.map(t => ({ de: 'cliente', t })), respuestas: [],
            motivo: '', motivoOk: false, estadoTicket: 'nuevo', estadoOk: false, cerrado: false, primera: null })),
          acciones: [], resumen: null };
        sim.sesiones.push(ses);
        sim.sesiones = sim.sesiones.slice(-10);
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
      if (c.cerrado) throw err(409, 'Este ticket ya no está en tu bandeja.');
      if (!llego(ses, c)) throw err(409, 'Este ticket todavía no ha llegado.');
      const paso = d.pasos[c.paso];
      if (!paso) throw err(409, 'El cliente ya no está esperando respuesta. Elige el motivo de contacto y cambia el estatus del ticket.');
      const llegado = segSes(ses) - c.llegada;
      let t, v, r, h = 0, i = null, notas = null;
      const otro = limpiar(body.otro, 1000);
      if (otro) { t = otro; v = 'pendiente'; r = paso.otro || []; notas = revisarOrtografia(otro); }
      else {
        i = Number(body.opcion);
        const o = paso.opciones[i];
        if (!o) throw err(400, 'Elige o escribe una respuesta.');
        t = o.t; v = o.v; r = o.r || []; h = Number(o.h) || 0;
      }
      if (c.primera == null) c.primera = Math.max(0, Math.round(llegado));
      c.respuestas.push(Object.assign({ paso: c.paso, i, t, v, otro: !!otro, f: ahora(), seg: Math.max(0, Math.round(llegado)) }, notas ? { ortografia: notas } : {}));
      c.chat.push({ de: 'agente', t });
      if (c.estadoTicket === 'nuevo') c.estadoTicket = 'abierto';
      c.aparcado = false;
      c.humor = Math.max(0, Math.min(4, c.humor + h));
      c.paso += 1;
      const sig = d.pasos[c.paso];
      const nuevos = r.concat(sig ? sig.cliente : []).map(x => ({ de: 'cliente', t: x }));
      c.chat.push(...nuevos);
      asp.simulador = sim;
      await store.put('aspirantes', asp);
      return { mensajes: nuevos, humor: humorTxt(c.humor), nivel: c.humor, listo: !sig, opciones: sig ? barajar(sig.opciones.map((o, k) => ({ i: k, t: o.t }))) : [] };
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
      const siguiente = s.niveles[s.niveles.findIndex(n => n.id === ses.nivel) + 1];
      return { resueltos: r.tickets.resueltos, total: r.tickets.total, primeraPromedio: r.primeraPromedio, acciones: r.ordenes.acciones, siguiente: siguiente ? siguiente.nombre : null, csat: r.csat,
        calificaciones: ses.casos.map(c => { const d = s.casos.find(x => x.id === c.id) || {}; return { numero: c.numero, cliente: (d.cliente || {}).nombre || '', asunto: d.asunto || '', calificacion: csatDe(c), humor: humorTxt(c.humor) }; }) };
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
        filas.push({ id: a._id, nombre: a.nombre, celula: a.celula, sesion: x.id, nivel: (s.niveles.find(n => n.id === x.nivel) || {}).nombre || 'Realidad', inicio: x.inicio, fin: x.fin, estado: x.estado,
          nota: r.nota, pendientes: r.pendientes, ortografia: r.ortografia || 0, resueltos: r.tickets.resueltos, total: r.tickets.total, primeraPromedio: r.primeraPromedio,
          panel: !!x.panel, csat: r.csat || null, malas: r.ordenes.malas, sinGestion: r.ordenes.sinGestion.length });
      }
      filas.sort((x, y) => String(y.inicio).localeCompare(String(x.inicio)));
      return { filas, config: { activo: s.activo !== false, intentos: s.intentos, velocidad: s.velocidad, tickets: s.casos.length, ordenes: s.ordenes.length,
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
            motivoCorrecto: d.motivo || '', motivo: c.motivo, motivoOk: c.motivoOk, calificacion: csatDe(c), estadoTicket: SIM_ESTADOS_TICKET[c.estadoTicket] || 'Nuevo', estadoOk: c.estadoOk,
            estadosCorrectos: (d.estados && d.estados.length ? d.estados : ['resuelto']).map(e => SIM_ESTADOS_TICKET[e]), cerrado: c.cerrado, primera: c.primera, humor: humorTxt(c.humor), chat: c.chat,
            respuestas: c.respuestas.map((r, k) => ({ k, paso: r.paso, t: r.t, v: r.v, otro: r.otro, seg: r.seg, ortografia: r.ortografia || [],
              opciones: ((d.pasos[r.paso] || {}).opciones || []).map(o => ({ t: o.t, v: o.v })) })) };
        }),
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
      if (x.estado === 'terminada') x.resumen = puntosSim(x, s);
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
      return { simulador: { formato: SIM_FORMATO, activo: s.activo !== false, intentos: s.intentos, velocidad: s.velocidad, niveles: s.niveles, motivos: s.motivos, casos: s.casos, ordenes: s.ordenes },
        acciones: SIM_ACCIONES, estadosTicket: SIM_ESTADOS_TICKET, estComercio: SIM_EST_COMERCIO, estEntrega: SIM_EST_ENTREGA };
    },
    async simGuardarConfig({ store, body }) {
      const cfg = await cargarConfig(store);
      const s = configSim(cfg);
      const n = (v, min, max, def) => { const x = Math.round(Number(v)); return x >= min && x <= max ? x : def; };
      const nuevo = { activo: body.activo !== false, intentos: n(body.intentos, 1, 10, s.intentos), velocidad: n(body.velocidad, 1, 30, s.velocidad),
        niveles: s.niveles, motivos: s.motivos, casos: s.casos, ordenes: s.ordenes };
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
            intervalo: n(x.intervalo, 0, 300, 8), panel: !!x.panel, estados: !!x.estados, casos: cs };
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
        Object.assign(nuevo, { motivos, casos, ordenes, niveles });
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

  const H = { COMUN, CELULAS_DEFAULT, REGLAS_DEFAULT, TIPOS, FORMATO_ARCHIVO, elegidas, seccionesVisibles, cumpleCondicion, ordenarPreguntas, evaluarPostulacion, err, nuevoId, cargarConfig, calcularCelula, construirRuta, calificar, loginAspirante, loginAdmin, iniciarSesion, vistaAspirante, estadoDe, PERFILES, ejecutar, SIM_ACCIONES, SIM_FORMATO, revisarOrtografia };
  if (typeof module !== 'undefined' && module.exports) module.exports = H; else root.ElxHandlers = H;
})(typeof window !== 'undefined' ? window : globalThis);
