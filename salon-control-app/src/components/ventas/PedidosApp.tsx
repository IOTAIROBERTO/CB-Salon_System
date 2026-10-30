import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { MessageCircle, ShoppingBag } from 'lucide-react';
import { db, type Pedido } from '../../db/db';
import { cancelarPedido, entregarPedido, marcarPagado } from '../../db/pedidos';
import { NOMBRE_ESTADO_PEDIDO } from '../../utils/pedidos';
import { formatCurrency } from '../../utils/financialUtils';
import { enlaceWhatsApp } from '../../utils/lealtad';

// Pedidos de la app de clientas («Mi carrito»): por pagar con su plazo, pagados por entregar y lo último que cerró.
// Lo apartado aquí no se puede vender en la tienda (Ventas e Inventario ya lo descuentan).
const FORMAS: [NonNullable<Pedido['formaPago']>, string][] = [['transferencia', 'Transferencia'], ['deposito', 'Depósito / OXXO'], ['efectivo', 'Efectivo'], ['tarjeta', 'Tarjeta']];

const falta = (iso?: string) => {
  if (!iso) return 'el plazo corre cuando acepte su cita valorada';
  const min = Math.round((Date.parse(iso) - Date.now()) / 60000);
  if (min <= 0) return 'venció (se cancela en unos minutos)';
  const fecha = new Date(iso).toLocaleString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return `paga antes del ${fecha} (${min >= 1440 ? `${Math.floor(min / 1440)} d ${Math.floor((min % 1440) / 60)} h` : min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`})`;
};

export default function PedidosApp() {
  const pedidos = useLiveQuery(() => db.pedidos.toArray()) || [];
  const clientes = useLiveQuery(() => db.clientes.toArray()) || [];
  const [pagando, setPagando] = useState<string | null>(null);   // pedido al que se le elige la forma de pago
  const hace7 = new Date(Date.now() - 7 * 86400000).toISOString();
  const porPagar = pedidos.filter(p => p.estado === 'por_pagar').sort((a, b) => (a.venceEn || '9').localeCompare(b.venceEn || '9'));
  const porEntregar = pedidos.filter(p => p.estado === 'pagado' && p.items.length).sort((a, b) => (a.recogerHasta || '').localeCompare(b.recogerHasta || ''));
  const cerrados = pedidos.filter(p => !['por_pagar', 'pagado'].includes(p.estado) && (p.entregadoEn || p.pagadoEn || p.creado) > hace7);
  if (!porPagar.length && !porEntregar.length && !cerrados.length) return null;

  const nombre = (p: Pedido) => clientes.find(c => c.id === p.clienteId)?.nombre || 'Clienta';
  const whatsapp = (p: Pedido, texto: string) => enlaceWhatsApp(clientes.find(c => c.id === p.clienteId)?.telefono, texto);
  const resumen = (p: Pedido) => [...p.items.map(i => `${i.cantidad} × ${i.nombre}`), p.anticipo ? `anticipo de su cita ${formatCurrency(p.anticipo)}` : ''].filter(Boolean).join(' · ');
  const intentar = (f: () => Promise<unknown>) => () => f().catch(e => alert(e instanceof Error ? e.message : 'No se pudo guardar'));
  const tarjeta = 'rounded-lg border bg-white p-4';

  return (
    <section className="mb-6 space-y-4">
      <h2 className="flex items-center gap-2 text-xl text-gray-900"><ShoppingBag size={18} /> Pedidos de la app</h2>

      {porPagar.map(p => (
        <div key={p.id} className={tarjeta}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-medium text-gray-900">{nombre(p)}</p>
            <p className="font-display text-2xl text-gray-900">{formatCurrency(p.total)}</p>
          </div>
          <p className="text-sm text-gray-600">{resumen(p)}</p>
          <p className="mt-1 text-xs text-amber-700">Por pagar: {falta(p.venceEn)}</p>
          {pagando === p.id ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="w-full text-xs text-gray-500">¿Cómo pagó?</span>
              {FORMAS.map(([forma, texto]) => (
                <button key={forma} onClick={intentar(async () => { await marcarPagado(p, forma); setPagando(null); })}
                  className="rounded-md bg-marca-negro px-3 text-sm text-white hover:bg-gray-800">{texto}</button>
              ))}
              <button onClick={() => setPagando(null)} className="px-3 text-sm text-gray-500 hover:underline">Volver</button>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => setPagando(p.id)} className="rounded-md bg-marca-negro px-3 text-sm text-white hover:bg-gray-800">Llegó el pago</button>
              {whatsapp(p, `¡Hola, ${nombre(p).split(' ')[0]}! Te recordamos tu pedido en Cristina Borquez: ${resumen(p)}. Total ${formatCurrency(p.total)}.`) &&
                <a href={whatsapp(p, `¡Hola, ${nombre(p).split(' ')[0]}! Te recordamos tu pedido en Cristina Borquez: ${resumen(p)}. Total ${formatCurrency(p.total)}.`)!} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-md border px-3 text-sm text-gray-700 hover:bg-gray-50" aria-label="WhatsApp"><MessageCircle size={14} /> WhatsApp</a>}
              <button onClick={intentar(async () => { if (confirm(`¿Cancelar el pedido de ${nombre(p)}? Lo apartado se libera.`)) await cancelarPedido(p); })}
                className="px-3 text-sm text-gray-500 hover:underline">Cancelar</button>
            </div>
          )}
        </div>
      ))}

      {porEntregar.map(p => (
        <div key={p.id} className={tarjeta}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-medium text-gray-900">{nombre(p)}</p>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">Pagado · {FORMAS.find(([f]) => f === p.formaPago)?.[1] || p.formaPago}</span>
          </div>
          <p className="text-sm text-gray-600">{p.items.map(i => `${i.cantidad} × ${i.nombre}`).join(' · ')}</p>
          <p className="mt-1 text-xs text-gray-500">Apartado para ella: recoge {p.citaId ? 'en su cita o ' : ''}a más tardar el {p.recogerHasta ? new Date(p.recogerHasta).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }) : '—'}.</p>
          <button onClick={intentar(async () => { if (confirm(`¿Entregaste el pedido a ${nombre(p)}? Se registra la venta y baja el stock.`)) await entregarPedido(p); })}
            className="mt-3 rounded-md bg-green-600 px-3 text-sm text-white hover:bg-green-700">Entregado</button>
        </div>
      ))}

      {cerrados.length > 0 && (
        <details className="text-sm text-gray-600">
          <summary className="cursor-pointer">Últimos 7 días ({cerrados.length})</summary>
          <ul className="mt-2 space-y-1">
            {cerrados.map(p => <li key={p.id}>{nombre(p)} · {formatCurrency(p.total)} · {NOMBRE_ESTADO_PEDIDO[p.estado]}{p.motivo ? ` (${p.motivo})` : ''}</li>)}
          </ul>
        </details>
      )}
    </section>
  );
}
