// Firma del consentimiento en la app de clientas: un enlace personal por clienta (y cita), sin que tenga que entrar
// al Club. El id del consentimiento pendiente (firma_ + 32 hex al azar) es el enlace: nadie lo adivina y vence en 7 días.
// La API de la app (app-clientas/api/salon.ts) lo lee, muestra el formato y guarda lo que firmó en el mismo registro.
import { db, type Consentimiento } from './db';
import { imprimirConsentimiento } from '../utils/consentimiento';

// ponytail: dirección de Cloudflare Pages; cambiar a https://app.cristinaborquez.com cuando esté el dominio
export const URL_APP = 'https://cristinaborquez-app.pages.dev';
const DIAS_ENLACE = 7;

export const enlaceFirma = (id: string) => `${URL_APP}/#/firmar/${id}`;
export const vigente = (c: Consentimiento) => c.estado === 'pendiente' && (c.vence || '') > new Date().toISOString();

/** Enlace para firmar: reutiliza el pendiente vigente de esa clienta y cita, o crea uno */
export async function pedirFirma(clienteId: string, citaId?: string) {
  const previo = (await db.consentimientos.where('clienteId').equals(clienteId).toArray()).find(c => vigente(c) && c.citaId === citaId);
  if (previo) return enlaceFirma(previo.id);
  const id = `firma_${Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('')}`;
  await db.consentimientos.add({
    id, clienteId, citaId, fecha: new Date().toISOString(), estado: 'pendiente',
    vence: new Date(Date.now() + DIAS_ENLACE * 86400000).toISOString(), fotos: false, redes: 'no'
  });
  return enlaceFirma(id);
}

export const mensajeFirma = (nombre: string, enlace: string) =>
  `Hola ${nombre.split(' ')[0]}, antes de tu cita en Cristina Borquez Beauty Salon por favor lee y firma tu consentimiento aquí (toma 2 minutos): ${enlace}`;

/** Copia del consentimiento firmado en la app: el formato con lo que marcó y su firma, listo para imprimir o guardar en PDF */
export async function verFirmado(c: Consentimiento) {
  const [cliente, cita] = await Promise.all([db.clientes.get(c.clienteId), c.citaId ? db.citas.get(c.citaId) : undefined]);
  const servicio = cita ? await db.servicios.get(cita.servicioId) : undefined;
  imprimirConsentimiento({
    clienteNombre: c.nombreFirma || cliente?.nombre, telefono: cliente?.telefono, cumple: cliente?.cumple,
    servicio: servicio?.nombre, precio: cita?.precioFinal ?? servicio?.precioSugerido, fecha: cita?.fecha || (c.firmadoEn || c.fecha).slice(0, 10),
    respuestas: {
      salud: c.salud || [], fotos: c.fotos, redes: c.redes, marketing: !!c.marketing, nombreFirma: c.nombreFirma || '',
      tutor: c.tutor, firma: c.firma || '', firmadoEn: c.firmadoEn || c.fecha, huella: c.evidencia?.huella
    }
  });
}
