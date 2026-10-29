// Datos públicos del salón (respuestas de octubre 2026).
// Son los valores por defecto: lo guardado en Configuración tiene prioridad.
// «Borquez» va sin acento: así se escribe el apellido y así está en el logo.
export const DATOS_SALON = {
  nombre: 'Cristina Borquez Beauty Salon',
  nombreCorto: 'Cristina Borquez',
  telefono: '662 161 4688',
  whatsapp: '526621614688',
  direccion: 'Plaza Galilea, Av. Saturnino Campoy 869, entre República de Colombia y República de Panamá, Col. Álvaro Obregón, 83170 Hermosillo, Son.',
  comoLlegar: 'Planta alta: sube por la escalera izquierda, sigue derecho por el pasillo y pasando dos locales está el salón, junto al sushi. No hay elevador. Estacionamiento amplio con guardia.',
  horario: 'Lunes a sábado de 10:00 a 19:00. Servicios solo con cita; los domingos se abre únicamente para citas.',
  email: 'cristinaeborquez@gmail.com',
  instagram: '@cristinaborquez.beauty',
  facebook: 'Cristina Borquez Beauty Salon'
};

// Políticas para clientas (respuestas de octubre 2026). Las usan el
// consentimiento, la nota de reserva y la página pública.
export const POLITICAS = {
  anticipo: 'El anticipo aparta tu lugar y se descuenta del total el día de tu cita.',
  cambios: 'Puedes cambiar o cancelar tu cita sin perder el anticipo avisando con al menos 48 horas. Con menos de 48 horas, o si no te presentas, el anticipo se pierde: ese espacio se apartó para ti y ya no se puede ofrecer a otra clienta.',
  garantia: 'Tienes 7 días naturales para avisarnos si algo del resultado necesita ajuste o tiene algún desperfecto; el ajuste no tiene costo. No incluye un servicio nuevo o distinto al que se hizo.',
  pedidos: 'Los productos pagados se guardan 10 días para que pases por ellos. Después vuelven a la venta y el pago queda como saldo a favor.'
};

/** Políticas de reserva en la app de clientas (proceso estándar del 28 de octubre de 2026): la solicitud aparta el
 *  horario, Cristina valora con las fotos y respuestas, acuerda precio y anticipo, y entonces confirma. */
export const POLITICAS_RESERVA = [
  'Tu solicitud aparta el horario mientras Cristina la revisa. Te confirmamos por WhatsApp.',
  'Los precios son «desde»: con tus fotos y respuestas Cristina te dice el precio de tu servicio antes de la cita.',
  'Si tu servicio lleva anticipo, al confirmar te pasamos los datos para enviarlo por transferencia o depósito, o acordamos pagarlo en el salón. En la app no se cobra nada.',
  'Tu cita la ves, la cambias o la cancelas tú misma desde tu enlace «Mi cita». Con al menos 48 horas conservas tu anticipo (si cancelas, queda como saldo a favor); con menos, o si no llegas, se pierde.',
  'Citas para el mismo día: solo por WhatsApp, según la agenda de Cristina.'
];
