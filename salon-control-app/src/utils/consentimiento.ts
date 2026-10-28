// Consentimiento informado: imprimible prellenado con la cita, o firmado en la app de clientas.
// Mismo contenido que el formato oficial (CB_CONTROL/02_Legal_y_Clientas). Sin base de datos ni navegador al cargar:
// la app y la API de clientas importan de aquí los mismos textos.
import { DATOS_SALON, POLITICAS } from '../data/datosSalon';
import { formatCurrency } from './financialUtils';
import { parseFechaLocal } from './dateValidation';

/** Cambiarla cuando cambie el texto: queda en la constancia de cada firma digital */
export const VERSION_CONSENTIMIENTO = '2026-10';

/** Lo que la clienta respondió al firmar en la app */
export interface RespuestasConsentimiento {
  salud: number[];     // índices de CHECKS_CLIENTA que marcó
  fotos: boolean;
  redes: 'con_rostro' | 'sin_rostro' | 'no';
  marketing: boolean;
  nombreFirma: string;
  tutor?: string;      // si la clienta es menor de edad
  firma: string;       // PNG (data URL) de la firma
  firmadoEn: string;   // ISO
  huella?: string;     // SHA-256 de textos + respuestas (constancia)
}

interface DatosConsentimiento {
  clienteNombre?: string;
  telefono?: string;
  cumple?: string;      // YYYY-MM-DD
  servicio?: string;
  precio?: number;
  anticipo?: number;
  fecha?: string;       // YYYY-MM-DD de la cita
  respuestas?: RespuestasConsentimiento;   // firmado en la app: se muestra lo que marcó y su firma
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fechaLarga = (iso?: string) =>
  iso ? parseFechaLocal(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

export const CHECKS = [
  'Coloración, decoloración o mechas en los últimos 6 meses',
  'Alaciado, keratina, permanente u otro proceso químico',
  'Henna, tintes caseros o de farmacia',
  'Alergia conocida a tintes, decolorantes, amoniaco, PPD o látex',
  'Embarazo o lactancia',
  'Heridas, dermatitis, psoriasis o sensibilidad en el cuero cabelludo',
  'Tratamiento médico o medicamento que afecte piel o cabello',
  'Prueba de sensibilidad realizada (fecha: ____________ )'
];
/** Lo que marca la clienta (la prueba de sensibilidad la anota la estilista) */
export const CHECKS_CLIENTA = CHECKS.slice(0, -1);
export const CONDICIONES: [string, string][] = [
  ['Anticipo', `${POLITICAS.anticipo} ${POLITICAS.cambios}`],
  ['Precio final', 'Si durante el servicio se necesita más producto o tiempo del previsto (por largo, densidad o colores anteriores), se te informa el ajuste y se continúa solo con tu aceptación.'],
  ['Garantía', `${POLITICAS.garantia} Tampoco cubre peinado ni secado, ni daños por no seguir los cuidados indicados.`],
  ['Información de salud', 'Declaro que la información que di es verdadera y completa. Entiendo que ocultar alergias o condiciones de salud puede provocar reacciones que la estilista no puede prever.']
];
/** Autorizaciones: la pregunta y, para el papel, las casillas (en la app son opciones) */
export const AUTORIZACION_DATOS = 'Consiento expresamente que mis datos de salud de este formato se usen solo para prestarme el servicio de forma segura (Aviso de privacidad disponible en el salón y por WhatsApp).';
export const PREGUNTA_FOTOS = '¿Podemos tomarte fotos del antes y el después de tu servicio?';
export const PREGUNTA_REDES = '¿Podemos publicar tus fotos del antes y el después en las redes sociales del salón?';
export const OPCIONES_REDES: Record<RespuestasConsentimiento['redes'], string> = { con_rostro: 'Sí, con mi rostro', sin_rostro: 'Sí, sin mi rostro', no: 'No' };
export const AUTORIZACION_MARKETING = 'Acepto recibir recordatorios de cita, felicitación de cumpleaños y promociones por WhatsApp o correo. Puedo pedir que se detengan en cualquier momento.';
const AUTORIZACIONES = [
  AUTORIZACION_DATOS,
  `${PREGUNTA_FOTOS} ☐ Sí ☐ No`,
  `${PREGUNTA_REDES} ☐ Sí, con mi rostro ☐ Sí, sin mi rostro ☐ No`,
  AUTORIZACION_MARKETING
];

/** Texto exacto que firma la clienta en la app (su huella queda en la constancia) */
export const textoFirmado = () => JSON.stringify({
  version: VERSION_CONSENTIMIENTO, salud: CHECKS_CLIENTA, condiciones: CONDICIONES,
  autorizaciones: [AUTORIZACION_DATOS, PREGUNTA_FOTOS, PREGUNTA_REDES, OPCIONES_REDES, AUTORIZACION_MARKETING]
});

const campo = (etiqueta: string, valor = '') =>
  `<div class="c">${etiqueta}<span>${esc(valor)}</span></div>`;
const casilla = (marcada: boolean) => `<i${marcada ? ' class="x"' : ''}></i>`;

/** Autorizaciones: en blanco para el papel, o con lo que respondió en la app */
const autorizaciones = (r?: RespuestasConsentimiento) => r
  ? [[true, AUTORIZACION_DATOS], [r.fotos, `${PREGUNTA_FOTOS} ${r.fotos ? 'Sí' : 'No'}`],
     [r.redes !== 'no', `${PREGUNTA_REDES} ${OPCIONES_REDES[r.redes]}`], [r.marketing, AUTORIZACION_MARKETING]] as [boolean, string][]
  : AUTORIZACIONES.map(a => [false, a] as [boolean, string]);

const firmaClienta = (r?: RespuestasConsentimiento) => r && r.firma.startsWith('data:image/png;base64,')
  ? `<img src="${r.firma}" alt="Firma">${esc(r.tutor ? '' : r.nombreFirma)}<br>` : '';

export const htmlConsentimiento = (d: DatosConsentimiento, logoUrl: string) => `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Consentimiento · ${esc(d.clienteNombre || 'clienta')}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400&family=Jost:wght@300;400;500&display=block">
<style>
@page{size:A4;margin:11mm 16mm 9mm}*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Jost,Arial,sans-serif;font-weight:300;font-size:9pt;line-height:1.4;color:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.cab{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1px solid #C29B57;padding-bottom:3mm;margin-bottom:3.5mm}
.cab img{width:50mm}.cab h1{font-family:'Cormorant Garamond',Georgia,serif;font-weight:400;font-size:20pt;line-height:1;text-align:right}
.cab .f{font-size:8pt;text-align:right;margin-top:2mm}
h3{font-weight:500;font-size:7.5pt;letter-spacing:.22em;text-transform:uppercase;color:#8A6A2F;margin:3.2mm 0 1.4mm}
.campos{display:grid;grid-template-columns:1fr 1fr;gap:1.6mm 8mm}
.c{display:flex;gap:2mm;align-items:flex-end;font-size:8pt;color:#6B665F;white-space:nowrap}
.c span{flex:1;border-bottom:1px solid #111;min-height:4.5mm;color:#111;font-size:9pt;padding-left:1mm}
.checks{display:grid;grid-template-columns:1fr 1fr;gap:1mm 8mm}
.ck,.aut{display:flex;gap:2mm;font-size:8.2pt}.ck i,.aut i{flex:none;width:3.2mm;height:3.2mm;border:1px solid #111;margin-top:.6mm}
.ck i.x,.aut i.x{background:#111}.firmas img{display:block;height:15mm;margin:-15mm auto 0;max-width:100%}
.aut{margin-bottom:1.2mm}
.linea{border-bottom:1px solid #D9D0C1;height:4.9mm}.intro{font-size:8pt;color:#6B665F;margin-bottom:1.2mm}
.cond{display:grid;grid-template-columns:24mm 1fr;gap:1.2mm 4mm;font-size:8.2pt}.cond b{font-weight:500}
.firmas{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8mm;margin-top:6mm;font-size:7.6pt;text-align:center;color:#6B665F}
.firmas div{border-top:1px solid #111;padding-top:1.5mm}.pie{margin-top:2.5mm;font-size:7pt;color:#6B665F;text-align:center}
</style></head><body>
<div class="cab"><img src="${logoUrl}" alt="${esc(DATOS_SALON.nombre)}"><div><h1>Consentimiento informado<br>de servicio</h1><div class="f">Fecha ${esc(fechaLarga(d.fecha)) || '____________'} &nbsp; Folio ________</div></div></div>
<h3>Datos de la clienta</h3><div class="campos">
${campo('Nombre completo', d.clienteNombre)}${campo('Teléfono / WhatsApp', d.telefono)}
${campo('Fecha de nacimiento', fechaLarga(d.cumple))}${campo('Servicio a realizar', d.servicio)}
${campo('Precio cotizado', d.precio ? formatCurrency(d.precio) : '')}${campo('Anticipo recibido', d.anticipo ? formatCurrency(d.anticipo) : '')}</div>
<h3>Historial y salud</h3><div class="intro">Marca lo que aplique. Esta información es confidencial y sirve para cuidar tu cabello y tu salud.</div>
<div class="checks">${CHECKS.map((c, i) => `<div class="ck">${casilla(!!d.respuestas?.salud.includes(i))}${esc(c)}</div>`).join('')}</div>
<h3>Diagnóstico de la estilista</h3><div class="intro">Estado del cabello y del cuero cabelludo, historial de color y estructura.</div><div class="linea"></div><div class="linea"></div>
<h3>Resultado esperado</h3><div class="intro">El resultado puede variar según el estado inicial del cabello, los procesos anteriores y la respuesta a los productos. Algunos cambios necesitan más de una sesión.</div><div class="linea"></div><div class="linea"></div>
<h3>Productos y técnica</h3><div class="linea"></div><div class="linea"></div>
<h3>Cuidados en casa</h3><div class="intro">Seguir los cuidados indicados es parte del resultado y de la garantía.</div><div class="linea"></div>
<h3>Condiciones del servicio</h3><div class="cond">${CONDICIONES.map(([a, b]) => `<b>${a}</b><div>${esc(b)}</div>`).join('')}</div>
<h3>Autorizaciones</h3>${autorizaciones(d.respuestas).map(([x, a]) => `<div class="aut">${casilla(x)}<div>${esc(a)}</div></div>`).join('')}
<div class="firmas"${d.respuestas ? ' style="margin-top:18mm"' : ''}><div>${d.respuestas?.tutor ? '' : firmaClienta(d.respuestas)}Nombre y firma de la clienta</div><div>${d.respuestas?.tutor ? `${firmaClienta(d.respuestas)}${esc(d.respuestas.tutor)}<br>` : ''}Madre, padre o tutor<br>(si la clienta es menor de edad)</div><div>${esc(DATOS_SALON.nombreCorto)}<br>Estilista responsable</div></div>
${d.respuestas ? `<div class="pie">Firmado en la app de clientas el ${esc(new Date(d.respuestas.firmadoEn).toLocaleString('es-MX', { timeZone: 'America/Hermosillo' }))} · versión ${VERSION_CONSENTIMIENTO}${d.respuestas.huella ? ` · huella ${esc(d.respuestas.huella.slice(0, 16))}` : ''}</div>` : ''}
<div class="pie">${esc(DATOS_SALON.nombre)} · ${esc(DATOS_SALON.direccion)} · WhatsApp ${esc(DATOS_SALON.telefono)}</div>
</body></html>`;

/** Abre el consentimiento en una ventana nueva y lanza la impresión (el firmado en la app sirve de copia) */
export const imprimirConsentimiento = (d: DatosConsentimiento) => {
  const ventana = window.open('', '_blank');
  if (!ventana) {
    alert('El navegador bloqueó la ventana. Permite ventanas emergentes para imprimir el consentimiento.');
    return;
  }
  const logo = new URL('./marca/CB_principal_negro.svg', document.baseURI).href;
  ventana.document.write(htmlConsentimiento(d, logo));
  ventana.document.close();
  // Esperar fuentes y logo antes de imprimir
  ventana.onload = () => {
    const listo = (ventana.document as any).fonts?.ready ?? Promise.resolve();
    listo.then(() => ventana.print());
  };
};
