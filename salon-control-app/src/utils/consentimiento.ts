// Consentimiento informado imprimible, prellenado con la cita.
// Mismo contenido que el formato oficial (CB_CONTROL/02_Legal_y_Clientas).
import { DATOS_SALON, POLITICAS } from '../data/datosSalon';
import { formatCurrency } from './financialUtils';
import { parseFechaLocal } from './dateValidation';

interface DatosConsentimiento {
  clienteNombre?: string;
  telefono?: string;
  cumple?: string;      // YYYY-MM-DD
  servicio?: string;
  precio?: number;
  anticipo?: number;
  fecha?: string;       // YYYY-MM-DD de la cita
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fechaLarga = (iso?: string) =>
  iso ? parseFechaLocal(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

const CHECKS = [
  'Coloración, decoloración o mechas en los últimos 6 meses',
  'Alaciado, keratina, permanente u otro proceso químico',
  'Henna, tintes caseros o de farmacia',
  'Alergia conocida a tintes, decolorantes, amoniaco, PPD o látex',
  'Embarazo o lactancia',
  'Heridas, dermatitis, psoriasis o sensibilidad en el cuero cabelludo',
  'Tratamiento médico o medicamento que afecte piel o cabello',
  'Prueba de sensibilidad realizada (fecha: ____________ )'
];
const CONDICIONES: [string, string][] = [
  ['Anticipo', `${POLITICAS.anticipo} ${POLITICAS.cambios}`],
  ['Precio final', 'Si durante el servicio se necesita más producto o tiempo del previsto (por largo, densidad o colores anteriores), se te informa el ajuste y se continúa solo con tu aceptación.'],
  ['Garantía', `${POLITICAS.garantia} Tampoco cubre peinado ni secado, ni daños por no seguir los cuidados indicados.`],
  ['Información de salud', 'Declaro que la información que di es verdadera y completa. Entiendo que ocultar alergias o condiciones de salud puede provocar reacciones que la estilista no puede prever.']
];
const AUTORIZACIONES = [
  'Consiento expresamente que mis datos de salud de este formato se usen solo para prestarme el servicio de forma segura (Aviso de privacidad disponible en el salón y por WhatsApp).',
  '¿Podemos tomarte fotos del antes y el después de tu servicio? ☐ Sí ☐ No',
  '¿Podemos publicar tus fotos del antes y el después en las redes sociales del salón? ☐ Sí, con mi rostro ☐ Sí, sin mi rostro ☐ No',
  'Acepto recibir recordatorios de cita, felicitación de cumpleaños y promociones por WhatsApp o correo. Puedo pedir que se detengan en cualquier momento.'
];

const campo = (etiqueta: string, valor = '') =>
  `<div class="c">${etiqueta}<span>${esc(valor)}</span></div>`;

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
<div class="checks">${CHECKS.map(c => `<div class="ck"><i></i>${esc(c)}</div>`).join('')}</div>
<h3>Diagnóstico de la estilista</h3><div class="intro">Estado del cabello y del cuero cabelludo, historial de color y estructura.</div><div class="linea"></div><div class="linea"></div>
<h3>Resultado esperado</h3><div class="intro">El resultado puede variar según el estado inicial del cabello, los procesos anteriores y la respuesta a los productos. Algunos cambios necesitan más de una sesión.</div><div class="linea"></div><div class="linea"></div>
<h3>Productos y técnica</h3><div class="linea"></div><div class="linea"></div>
<h3>Cuidados en casa</h3><div class="intro">Seguir los cuidados indicados es parte del resultado y de la garantía.</div><div class="linea"></div>
<h3>Condiciones del servicio</h3><div class="cond">${CONDICIONES.map(([a, b]) => `<b>${a}</b><div>${esc(b)}</div>`).join('')}</div>
<h3>Autorizaciones</h3>${AUTORIZACIONES.map(a => `<div class="aut"><i></i><div>${esc(a)}</div></div>`).join('')}
<div class="firmas"><div>Nombre y firma de la clienta</div><div>Madre, padre o tutor<br>(si la clienta es menor de edad)</div><div>${esc(DATOS_SALON.nombreCorto)}<br>Estilista responsable</div></div>
<div class="pie">${esc(DATOS_SALON.nombre)} · ${esc(DATOS_SALON.direccion)} · WhatsApp ${esc(DATOS_SALON.telefono)}</div>
</body></html>`;

/** Abre el consentimiento en una ventana nueva y lanza la impresión */
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
