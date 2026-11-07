// Cancelar una cita desde el salón: el único camino, con la política de 48 h. Con 48 h o más el anticipo pasa a saldo a
// favor (solo la Dueña escribe saldo); con menos se pierde, salvo que la Dueña decida dejarlo como saldo.
import { db } from '../../db/db';
import { consecuenciaCancelar, reversaCobro } from '../../utils/estadoCita';
import { formatCurrency } from '../../utils/financialUtils';
import { avisar, confirmar } from '../Confirmar';

type CitaACancelar = { id: string; clienteId: string; fecha: string; hora?: string; anticipoConfirmado?: boolean; montoAnticipo?: number };

async function guardarCancelacion(cita: CitaACancelar, destino: 'saldo' | 'perdido' | null, pagado: number) {
  const ahora = new Date().toISOString();
  await db.transaction('rw', db.citas, db.movimientosSaldo, db.pedidos, async () => {
    const actual = await db.citas.get(cita.id);
    if (!actual || actual.estado === 'cancelada' || actual.estado === 'completada' || actual.estado === 'no_llego') return;
    await db.citas.update(cita.id, { estado: 'cancelada', canceladaPor: 'salon', canceladaEn: ahora, cambioPedido: undefined, propuestaVence: undefined,
      ...(destino === 'saldo' ? { anticipoASaldo: pagado } : destino === 'perdido' ? { anticipoPerdido: pagado } : {}) });
    // Id fijo por cita, igual que al cancelar en «Mi cita»: dos cancelaciones no duplican el abono
    if (destino === 'saldo') await db.movimientosSaldo.put({ id: `sal_cancelada_${cita.id}`, clienteId: cita.clienteId, fecha: ahora, monto: pagado,
      concepto: `Anticipo de la cita del ${cita.fecha} (la canceló el salón)`, citaId: cita.id });
    const porPagar = await db.pedidos.where('citaId').equals(cita.id).filter(p => p.estado === 'por_pagar').toArray();
    await Promise.all(porPagar.map(p => db.pedidos.update(p.id, { estado: 'cancelado', motivo: 'Se canceló su cita' })));
  });
}

/** Solo la Dueña (escribe saldo): deshace un cobro equivocado. La cita vuelve a «en curso» para cobrarse otra vez, con
 *  su saldo y sus regalos devueltos; en las notas queda constancia de lo anulado. */
export async function pedirAnularCobro(cita: { id: string; clienteId: string; precioFinal?: number; metodoPago?: string; montoAnticipo?: number; notas?: string }, nombre: string) {
  const [movimientos, clienta] = await Promise.all([db.movimientosSaldo.where('clienteId').equals(cita.clienteId).toArray(), db.clientes.get(cita.clienteId)]);
  const r = reversaCobro(cita.id, movimientos, clienta?.canjes || []);
  const devuelve = [r.devolver > 0 ? `${formatCurrency(r.devolver)} a su saldo a favor` : '', r.movimientosABorrar.length || (clienta?.canjes || []).length !== r.canjes.length ? 'sus regalos del Club' : ''].filter(Boolean).join(' y ');
  if (!(await confirmar(`¿Anular el cobro de ${formatCurrency(cita.precioFinal || 0)} de ${nombre}? La cita vuelve a «en curso» para cobrarla de nuevo.${devuelve ? ` Regresan ${devuelve}.` : ''}${r.devolver < 0 ? ` Se retiran ${formatCurrency(-r.devolver)} de su saldo a favor.` : ''} Lo que haya pagado en efectivo, tarjeta o transferencia lo devuelves tú.`, { si: 'Anular cobro', peligro: true }))) return false;
  const ahora = new Date();
  try {
    await db.transaction('rw', db.citas, db.clientes, db.movimientosSaldo, async () => {
      const actual = await db.citas.get(cita.id);
      if (actual?.estado !== 'completada') return;
      const constancia = `Cobro anulado el ${ahora.toLocaleDateString('es-MX')}: ${formatCurrency(actual.precioFinal || 0)}${actual.metodoPago ? ` (${actual.metodoPago})` : ''}.`;
      await db.citas.update(cita.id, {
        estado: 'iniciada', notas: [actual.notas, constancia].filter(Boolean).join('\n'), anticipoConfirmado: !!actual.montoAnticipo,
        precioFinal: undefined, metodoPago: undefined, propina: undefined, descuentoAplicado: undefined, subtotalOriginal: undefined, montoDescuento: undefined,
        subtotalConDescuento: undefined, montoRedondeo: undefined, pagadoConSaldo: undefined, anticipoASaldo: undefined, saldoPendiente: undefined, fechaCompletada: undefined, serviciosAdicionales: undefined
      });
      if (r.devolver) await db.movimientosSaldo.add({ id: `sal_anulado_${cita.id}_${ahora.getTime()}`, clienteId: cita.clienteId, fecha: ahora.toISOString(), monto: r.devolver, concepto: r.devolver > 0 ? 'Cobro anulado: regresa su saldo' : 'Cobro anulado: se retira el anticipo de más', citaId: cita.id });
      if (r.movimientosABorrar.length) await db.movimientosSaldo.bulkDelete(r.movimientosABorrar);
      if (clienta && r.canjes.length !== (clienta.canjes || []).length) await db.clientes.update(cita.clienteId, { canjes: r.canjes });
    });
    return true;
  } catch (e) { await avisar(`No se pudo anular el cobro y no cambió nada. ${(e as Error).message}`); return false; }
}

/** Pregunta lo que corresponda y cancela. Devuelve true si se canceló. */
export async function pedirCancelacion(cita: CitaACancelar, esDuena: boolean, nombre: string): Promise<boolean> {
  const { pagado, destino } = consecuenciaCancelar(cita);
  const monto = formatCurrency(pagado);
  let final = destino;
  if (destino === 'saldo' && !esDuena) {
    await avisar(`${nombre} ya pagó un anticipo de ${monto}, que pasa a su saldo a favor. Solo la Dueña puede hacerlo: pídele que cancele esta cita.`);
    return false;
  }
  const pregunta = !destino ? `¿Cancelar la cita de ${nombre}?`
    : destino === 'saldo' ? `¿Cancelar la cita de ${nombre}? Su anticipo de ${monto} pasa a su saldo a favor.`
    : `¿Cancelar la cita de ${nombre}? Faltan menos de 48 horas: el anticipo de ${monto} se queda como anticipo perdido.`;
  if (!(await confirmar(pregunta))) return false;
  if (destino === 'perdido' && esDuena &&
    await confirmar(`Por política el anticipo de ${monto} se pierde. ¿Prefieres dejárselo como saldo a favor?`, { si: 'Dejar como saldo', no: 'Se pierde' })) final = 'saldo';
  try { await guardarCancelacion(cita, final, pagado); return true; }
  catch (e) { await avisar(`No se pudo cancelar la cita y no cambió nada. ${(e as Error).message}`); return false; }
}
