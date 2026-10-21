// Nota de reserva para mandar por WhatsApp al agendar: datos de la cita,
// anticipo (pagado o pendiente), política de cambios y cómo llegar.
import { DATOS_SALON, POLITICAS } from '../data/datosSalon';
import { formatCurrency } from './financialUtils';
import { parseFechaLocal } from './dateValidation';

interface DatosReserva {
  nombre: string;
  servicio: string;
  fecha: string; // YYYY-MM-DD
  hora: string;  // HH:MM
  precio?: number;
  anticipo?: number;
  anticipoPagado?: boolean;
  lugar?: string; // fuera del salón
}

export const notaReserva = (d: DatosReserva) => {
  const dia = parseFechaLocal(d.fecha).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  return [
    `¡Hola, ${d.nombre.split(' ')[0]}! Esta es tu reserva en ${DATOS_SALON.nombre} 🤍`,
    '',
    `📅 ${dia.charAt(0).toUpperCase() + dia.slice(1)} a las ${d.hora}`,
    `✂️ ${d.servicio}`,
    d.precio ? `💲 Desde ${formatCurrency(d.precio)}: es el precio mínimo; el final se confirma en tu valoración` : '',
    d.anticipo ? `✅ Anticipo: ${formatCurrency(d.anticipo)} ${d.anticipoPagado ? '(recibido, se descuenta del total)' : '(pendiente: tu lugar queda apartado al recibirlo)'}` : '',
    d.lugar ? `📍 Servicio en ${d.lugar}, en la dirección que acordamos contigo.` : `📍 ${DATOS_SALON.direccion}\n${DATOS_SALON.comoLlegar}`,
    '',
    POLITICAS.cambios,
    '',
    `— ${DATOS_SALON.nombreCorto}`
  ].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n');
};
