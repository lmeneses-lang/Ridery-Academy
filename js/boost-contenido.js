/* ============================================================
   Ridery Academy · Boost: contenido de las actividades
   Son ejercicios de práctica (no cuentan para la evaluación), por eso
   las respuestas viven aquí. Para cambiar o agregar ejercicios, edita
   este archivo: cada actividad es una lista de objetos sencillos.
   ============================================================ */
window.ElxBoostContenido = {
  /* 1 · ¿Dónde lo busco? — caso → herramienta y ruta exacta */
  ruta: [
    { p: 'Un usuario dice que tiene una deuda de un viaje de 2021.', ops: ['Admin › All Trips › Trip History (con fecha de inicio vieja)', 'Admin › Waiting Requests', 'Panel Zupper › Órdenes', 'Zendesk › Vistas › Resueltos'], ok: 0, por: 'Los viajes viejos solo aparecen en All Trips con «Trip History» y una fecha de inicio anterior.' },
    { p: 'Un conductor dice que llegó al punto pero el usuario no lo ve. El viaje está en curso.', ops: ['Admin › Completed Requests', 'Admin › Running Requests › Action › Messages', 'Admin › Cancelled Trips', 'Panel Zupper'], ok: 1, por: 'Los viajes en curso están en Running Requests; en Messages ves lo que se escribieron.' },
    { p: 'Un cliente de Zupper dice que su pedido lleva más de una hora y no ha llegado.', ops: ['Admin › All Trips', 'Panel Zupper: buscar la orden y ver estatus de Comercio y Entrega', 'Zendesk › Macros', 'Admin › Sos Trips'], ok: 1, por: 'Los pedidos se revisan en el Panel Zupper: el estatus del comercio y de la entrega te dicen dónde está el problema.' },
    { p: 'Un usuario reclama que le cobraron de más por un viaje de hoy.', ops: ['Admin › Completed Requests › Action › View Map (KM, tiempo, surge y total)', 'Admin › Waiting Requests', 'Panel Zupper › Total', 'Zendesk › Historial de interacción'], ok: 0, por: 'En el detalle del viaje (View Map) ves los KM reales, el tiempo, el surge y el total cobrado.' },
    { p: 'Una orden de Forum SuperMayorista está «No iniciada».', ops: ['Llamar al comercio', 'Publicarla en el grupo de Shoppers', 'Cancelarla de inmediato', 'Esperar a que se inicie sola'], ok: 1, por: 'En Forum las órdenes las toman los Shoppers desde su grupo de WhatsApp.' },
    { p: 'Necesitas saber si el usuario que te escribe ya tuvo otros tickets.', ops: ['Zendesk › Historial de interacción (panel derecho)', 'Admin › Users', 'Panel Zupper › Usuario', 'Zendesk › Etiquetas'], ok: 0, por: 'El historial de interacción del panel derecho de Zendesk muestra sus conversaciones anteriores.' },
    { p: 'Un usuario pide un viaje y nadie lo acepta desde hace rato.', ops: ['Admin › Waiting Requests', 'Admin › Completed Requests', 'Admin › Scheduled Requests', 'Panel Zupper'], ok: 0, por: 'Los viajes que todavía buscan conductor están en Waiting Requests.' },
    { p: 'Un usuario olvidó su teléfono en el carro de un viaje que ya terminó.', ops: ['Admin › Completed Requests: ubicar el viaje y el conductor', 'Admin › Running Requests', 'Panel Zupper', 'Zendesk › Vistas › Nuevos'], ok: 0, por: 'El viaje terminado está en Completed Requests; ahí ves quién fue el conductor para contactarlo.' }
  ],
  /* 2 · Pares de memoria — término ↔ significado */
  pares: [
    ['No iniciada', 'El comercio aceptó pero no empezó a preparar'], ['Sin enviar al pool', 'La orden no se ha ofrecido a repartidores'], ['Trip History', 'Muestra viajes viejos en All Trips'],
    ['Surge', 'Multiplicador de tarifa por alta demanda'], ['PENDIENTE', 'Esperando a otra área para resolver'], ['Aún no recibimos respuesta', 'El cliente dejó de escribir'],
    ['ZupperCredits', 'Saldo para usar dentro de Zupper'], ['Running Requests', 'Viajes aceptados o en curso'], ['Waiting Requests', 'Viajes buscando conductor'], ['Shopper', 'Hace la compra física en Forum']
  ],
  /* 3 · Flash de procesos — se muestran los pasos en orden y luego hay que reordenarlos */
  flash: [
    { titulo: 'Orden No iniciada', pasos: ['Revisar el estatus de la orden en el Panel Zupper', 'Contactar al comercio por llamada o mensaje', 'Esperar respuesta hasta 10 min desde que se pagó', 'Si no responde, cancelar la orden', 'Avisar al cliente y dejar nota en la orden'] },
    { titulo: 'Pedido incompleto', pasos: ['Saludar y mostrar empatía', 'Contactar al comercio para verificar la comanda', 'Confirmar el producto faltante y su costo', 'Editar orden y restar el monto exacto', 'Informar al cliente que recibió ZupperCredits'] },
    { titulo: 'Atención de un ticket', pasos: ['Leer el ticket y el historial del cliente', 'Saludar por su nombre', 'Buscar la orden o el viaje en la herramienta', 'Dar la solución con datos concretos', 'Elegir motivo de contacto y estatus correcto'] },
    { titulo: 'Objeto perdido en un viaje', pasos: ['Calmar al usuario y tomar los datos', 'Ubicar el viaje en Completed Requests', 'Identificar al conductor', 'Contactar al conductor para coordinar la devolución', 'Mantener informado al usuario'] }
  ],
  /* 5 · Redacción — reescribir un mensaje mal escrito */
  redaccion: [
    { mal: 'hola q paso, ya reviso tu pedido', idea: 'Saluda, muestra que ya estás revisando el pedido.', claves: [['hola', 'buen'], ['revis', 'verific']] },
    { mal: 'eso no es culpa de nosotros es el comercio', idea: 'Explica sin echar culpas y ofrece una solución.', claves: [['comercio'], ['solución', 'ayud', 'resolver', 'coordin']] },
    { mal: 'espere ahi q ya le aviso', idea: 'Pide un momento con amabilidad y di qué vas a hacer.', claves: [['momento', 'minuto'], ['revis', 'verific', 'consult', 'contact']] },
    { mal: 'NO SE PUEDE CAMBIAR LA DIRECCION', idea: 'Explica la opción disponible para el cambio de dirección.', claves: [['dirección'], ['recargo', 'costo', 'opción', 'podemos']] },
    { mal: 'ok ya le reembolsamos', idea: 'Confirma el reembolso con monto y método.', claves: [['reembols', 'reintegr'], ['$', 'monto', 'zuppercredits', 'método']] }
  ],
  /* 6 · Respuesta en 1 minuto — saludo + acción + cierre, contra reloj */
  minuto: [
    { caso: 'Andreína escribe: «Mi pedido lleva una hora y nada». La orden está en Preparación iniciada en Sushi Express.', accion: ['comercio', 'prioridad', 'esperar', 'cancelar', 'revis'] },
    { caso: 'Carlos escribe: «Me faltó el refresco de 2 litros». El comercio confirmó que no lo incluyó ($2,50).', accion: ['zuppercredits', 'reintegr', 'reembols', '2,50', '2.50'] },
    { caso: 'Manuel escribe: «El conductor dice que llegó y no lo veo». El conductor escribió que está frente a Catania.', accion: ['catania', 'frente', 'acércate', 'ubic'] },
    { caso: 'Silmar escribe: «Tengo una deuda de un viaje que me cancelaron en 2021».', accion: ['revis', 'pagos', 'anul', 'cancelado'] }
  ],
  /* 7 · ¿Esto o esto? — elegir la mejor respuesta */
  esto: [
    { caso: 'Cliente: «Llevo una hora esperando mi comida, esto es un desastre».', a: 'Entiendo tu molestia y lamento la espera. Ya estoy revisando tu pedido con el comercio.', b: 'Es que hay mucho tráfico y pocos repartidores, tenga paciencia.', ok: 'a', por: 'Primero se valida la emoción y se muestra acción; las excusas enojan más.' },
    { caso: 'Cliente: «¿Me pueden decir dónde está mi pedido?»', a: 'Ya está en camino.', b: 'Revisé tu pedido: el repartidor Pedro lo retiró a las 10:40 y llega en unos 12 minutos.', ok: 'b', por: 'Las respuestas con datos concretos generan confianza; «ya está en camino» sin verificar puede ser falso.' },
    { caso: 'Conductor: «Tuve un accidente con un pasajero a bordo».', a: '¿Están todos bien? ¿Alguien necesita atención médica? Te ayudo ya mismo.', b: 'Envíame el ID del viaje para revisar.', ok: 'a', por: 'Ante un accidente, lo primero es la integridad de las personas.' },
    { caso: 'Cliente: «Quiero hablar con un supervisor».', a: 'No hay supervisores disponibles.', b: 'Entiendo, quiero ayudarte de inmediato. Cuéntame qué pasó y si hace falta lo escalo con mi supervisor.', ok: 'b', por: 'Se toma el control del caso sin negarle la escalación.' },
    { caso: 'Cliente: «Me cobraron de más».', a: 'Ya te reembolso la diferencia.', b: 'Déjame revisar el viaje: así veo los kilómetros, el tiempo y el surge que se aplicaron.', ok: 'b', por: 'Antes de reembolsar se verifica; muchas veces el cobro tiene explicación (surge, recorrido).' },
    { caso: 'Cliente: «Gracias, eso era todo».', a: '¡Con gusto! Que disfrutes tu pedido. Si necesitas algo más, aquí estamos.', b: 'ok', ok: 'a', por: 'El cierre también cuenta para la experiencia del cliente.' }
  ],
  /* 8 · Frases prohibidas — marcar las que no se deben decir */
  frases: [
    { t: 'Entiendo tu molestia.', mala: false }, { t: 'Eso no es mi culpa.', mala: true }, { t: 'Ya lo estoy revisando.', mala: false }, { t: 'No se puede hacer nada.', mala: true },
    { t: 'Espere.', mala: true }, { t: 'Gracias por tu paciencia.', mala: false }, { t: 'Eso le pasa a todo el mundo.', mala: true }, { t: 'Te mantengo informado por aquí.', mala: false },
    { t: 'Usted se equivocó al pedir.', mala: true }, { t: 'Lamento el inconveniente.', mala: false }, { t: 'Llame a otro número.', mala: true }, { t: '¿Hay algo más en lo que te pueda ayudar?', mala: false },
    { t: 'El sistema no se equivoca.', mala: true }, { t: 'Déjame verificarlo con el comercio.', mala: false }
  ],
  /* 9 · Triage — ordenar por prioridad (el orden de la lista es el correcto) */
  triage: [
    { titulo: 'Turno de la tarde', casos: ['Conductor reporta accidente con pasajero herido', 'Usuario activó SOS durante un viaje', 'Usuario no encuentra al conductor que ya llegó', 'Pedido con más de 1 hora de retraso', 'Usuario pregunta cómo usar un cupón'] },
    { titulo: 'Pico del mediodía', casos: ['Repartidor sufrió un accidente en la vía', 'Orden No iniciada con el repartidor esperando en el comercio', 'Cliente dice que su pedido llegó en mal estado', 'Cliente reporta un faltante de ayer', 'Usuario pregunta el horario de Forum'] }
  ],
  /* 10 · Tono del cliente */
  tono: [
    { t: 'LLEVO UNA HORA ESPERANDO, ESTO ES UNA ESTAFA', ok: 'Molesto' }, { t: 'Disculpa, no entiendo dónde veo mis ZupperCredits', ok: 'Confundido' },
    { t: 'Por favor rápido, el conductor se va y tengo que llegar al hospital', ok: 'Urgido' }, { t: 'Hola, quería saber si hacen envíos a Los Teques', ok: 'Tranquilo' },
    { t: '¿Por qué me cobraron dos veces? No es la primera vez que pasa', ok: 'Molesto' }, { t: 'Me salió un mensaje raro al pagar y no sé si se pagó o no', ok: 'Confundido' },
    { t: 'El repartidor está afuera y no tengo el dinero completo, ¿qué hago ya?', ok: 'Urgido' }, { t: 'Gracias por la ayuda de ayer, todo llegó bien', ok: 'Tranquilo' }
  ]
};
