import { useLiveQuery } from 'dexie-react-hooks';
import { Printer, Wallet } from 'lucide-react';
import { db, type Empleado } from '../../db/db';
import { pagoPeriodo, RECARGOS_DE_LEY, type PagoPeriodo } from '../../utils/pagos';
import { formatCurrency } from '../../utils/financialUtils';
import { DATOS_SALON } from '../../data/datosSalon';
import { nombreCategoria } from '../../utils/precios';
import { parseFechaLocal } from '../../utils/dateValidation';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fecha = (iso: string) => parseFechaLocal(iso).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });

/** Recibo de pago imprimible: la colaboradora firma de recibido */
const imprimirRecibo = (emp: Empleado, p: PagoPeriodo, desde: string, hasta: string) => {
  const w = window.open('', '_blank');
  if (!w) { alert('El navegador bloqueó la ventana. Permite ventanas emergentes para imprimir el recibo.'); return; }
  const filas = p.dias.map(d => `<tr><td>${esc(fecha(d.fecha))}</td><td>${d.horas} h</td><td>${esc(d.nota || '')}</td><td class="n">${formatCurrency(d.importe)}</td></tr>`).join('');
  const bonos = p.bonos.map(b => `<tr><td colspan="3">Bono ${esc(nombreCategoria(b.categoria))} · ${b.citas} citas</td><td class="n">${formatCurrency(b.monto)}</td></tr>`).join('');
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Recibo · ${esc(emp.nombre)}</title>
<style>body{font-family:Jost,Arial,sans-serif;font-size:11pt;color:#111;margin:18mm}h1{font-family:'Cormorant Garamond',Georgia,serif;font-weight:400;font-size:22pt;margin:0 0 2mm}
.s{color:#6B665F;font-size:9.5pt;margin-bottom:6mm}table{width:100%;border-collapse:collapse}td,th{padding:2mm;border-bottom:1px solid #D9D0C1;text-align:left}.n{text-align:right}
tfoot td{font-weight:600;border-top:2px solid #C29B57}.f{display:grid;grid-template-columns:1fr 1fr;gap:20mm;margin-top:25mm;text-align:center;font-size:9pt}.f div{border-top:1px solid #111;padding-top:2mm}</style></head><body>
<h1>Recibo de pago</h1><div class="s">${esc(DATOS_SALON.nombre)} · del ${esc(fecha(desde))} al ${esc(fecha(hasta))} · ${p.horas} horas a ${formatCurrency(emp.pagoPorHora || 0)} la hora</div>
<p>Recibí de ${esc(DATOS_SALON.nombreCorto)} la cantidad indicada por las horas de apoyo y los bonos de este periodo.</p>
<table><thead><tr><th>Día</th><th>Horas</th><th>Nota</th><th class="n">Importe</th></tr></thead><tbody>${filas}${bonos}</tbody>
<tfoot><tr><td colspan="3">Total</td><td class="n">${formatCurrency(p.total)}</td></tr></tfoot></table>
<div class="f"><div>${esc(emp.nombre)}<br>Recibí de conformidad</div><div>${esc(DATOS_SALON.nombreCorto)}<br>Entrega</div></div>
<script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
};

interface PagosEquipoProps {
  empleados: Empleado[];
  desde: string;
  hasta: string;
}

/** Pago por horas de apoyo y bonos de cada colaboradora en el periodo */
export default function PagosEquipo({ empleados, desde, hasta }: PagosEquipoProps) {
  const apoyos = useLiveQuery(() => db.empleadoEvents.where('tipo').equals('apoyo').toArray()) || [];
  const citas = useLiveQuery(() => db.citas.where('fecha').between(desde, hasta, true, true).toArray(), [desde, hasta]) || [];
  const servicios = useLiveQuery(() => db.servicios.toArray()) || [];
  const conTarifa = empleados.filter(e => e.activo && e.pagoPorHora);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2"><Wallet className="text-purple-600" /> Pago por horas</h2>
      <p className="text-xs text-gray-500 mb-4">Días de apoyo con horas (Calendario / Días) más los bonos por cita apoyada. {RECARGOS_DE_LEY ? 'Domingo +25 %, día festivo de ley pago triple.' : 'Misma tarifa cualquier día (se les llama por convocatoria); domingos y festivos de ley quedan marcados.'}</p>
      {conTarifa.length === 0 && <p className="text-sm text-gray-500">Captura el pago por hora en la ficha de cada colaboradora.</p>}
      <div className="space-y-3">
        {conTarifa.map(emp => {
          const p = pagoPeriodo(emp, apoyos, citas, servicios, desde, hasta);
          return (
            <div key={emp.id} className="p-3 border rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-800">{emp.nombre}</span>
                <span className="text-purple-700 font-bold">{formatCurrency(p.total)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                <span>{p.horas} h · {formatCurrency(p.pagoHoras)}{p.totalBonos ? ` + bonos ${formatCurrency(p.totalBonos)}` : ''}</span>
                <button onClick={() => imprimirRecibo(emp, p, desde, hasta)} disabled={!p.total}
                  className="flex items-center gap-1 text-purple-700 hover:underline disabled:opacity-40"><Printer size={12} /> Recibo</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
