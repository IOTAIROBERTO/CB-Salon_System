// Tarjeta del Círculo CB para imprimir (tamaño credencial CR80, 85.6 × 54 mm):
// frente con la marca y el nombre, reverso con el QR del código de la clienta.
// El mismo código se lee con un lector de QR o de barras en Clientes y en Círculo CB.
import qrcode from 'qrcode-generator';
import { NOMBRE_CIRCULO } from './lealtad';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** SVG del QR (módulos negros sobre blanco) */
export const qrSvg = (texto: string) => {
  const q = qrcode(0, 'M');
  q.addData(texto);
  q.make();
  const n = q.getModuleCount();
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${n + 4} ${n + 4}" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${d}" fill="#111"/></svg>`;
};

export const imprimirTarjeta = (nombre: string, codigo: string) => {
  const w = window.open('', '_blank');
  if (!w) { alert('El navegador bloqueó la ventana. Permite ventanas emergentes para imprimir la tarjeta.'); return; }
  const base = new URL('./marca/', document.baseURI).href;
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Tarjeta ${NOMBRE_CIRCULO} · ${esc(nombre)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=Jost:wght@300;400&display=block">
<style>@page{size:85.6mm 54mm;margin:0}*{box-sizing:border-box;margin:0}body{-webkit-print-color-adjust:exact;print-color-adjust:exact;font-family:Jost,Arial,sans-serif}
.t{width:85.6mm;height:54mm;position:relative;overflow:hidden;page-break-after:always}
.f{background:#111;color:#fff;padding:6mm}.f .m{position:absolute;right:-8mm;bottom:-10mm;height:46mm;opacity:.12}
.f .l{height:9mm}.f .e{font-size:5.5pt;letter-spacing:.32em;text-transform:uppercase;color:#C29B57;margin-top:7mm}
.f .n{font-family:'Cormorant Garamond',Georgia,serif;font-size:15pt;margin-top:1.5mm}
.r{background:#F6F1E9;color:#111;display:flex;align-items:center;gap:5mm;padding:6mm}.r .q{width:34mm;height:34mm;flex:none}
.r .c{font-size:11pt;letter-spacing:.12em;font-weight:400}.r p{font-size:6.5pt;color:#6B665F;margin-top:2mm;line-height:1.4}</style></head><body>
<div class="t f"><img class="m" src="${base}CB_monograma_dorado.svg" alt=""><img class="l" src="${base}CB_horizontal_blanco.svg" alt="Cristina Borquez Beauty Salon">
<div class="e">${NOMBRE_CIRCULO}</div><div class="n">${esc(nombre)}</div></div>
<div class="t r"><div class="q">${qrSvg(codigo)}</div><div><div class="c">${esc(codigo)}</div><p>Muéstrala en cada visita para sumar puntos y recibir tus beneficios.<br>WhatsApp 662 161 4688</p></div></div>
<script>window.onload=()=>document.fonts.ready.then(()=>window.print())</script></body></html>`);
  w.document.close();
};
