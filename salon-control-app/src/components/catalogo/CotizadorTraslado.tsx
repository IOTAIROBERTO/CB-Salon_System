import { useMemo, useState } from 'react';
import { MapPin, Copy } from 'lucide-react';
import type { Servicio } from '../../types/catalogo';
import { formatCurrency } from '../../utils/financialUtils';
import { DESTINOS, PARAMETROS_TRASLADO, calcularTraslado } from '../../utils/trasladoUtils';

interface CotizadorTrasladoProps {
  servicios: Servicio[];
}

const OTRO = '__otro';

/** Cotiza un servicio fuera de Hermosillo: precio del servicio + traslado */
export default function CotizadorTraslado({ servicios }: CotizadorTrasladoProps) {
  const [abierto, setAbierto] = useState(false);
  const [servicioIds, setServicioIds] = useState<string[]>([]);
  const [destino, setDestino] = useState(DESTINOS[0].nombre);
  const [kmOtro, setKmOtro] = useState(0);
  const [diasOtro, setDiasOtro] = useState(1);
  const [params, setParams] = useState(PARAMETROS_TRASLADO);

  const ordenados = useMemo(
    () => [...servicios].filter(s => s.precioSugerido > 0).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [servicios]
  );
  const elegidos = ordenados.filter(s => servicioIds.includes(s.id));
  const preset = DESTINOS.find(d => d.nombre === destino);
  const km = preset ? preset.km : kmOtro;
  const dias = preset ? preset.dias : diasOtro;
  const { gasolina, viaticos, traslado } = calcularTraslado(km, dias, params);
  const servicio = elegidos.reduce((t, s) => t + s.precioSugerido, 0);
  const total = servicio + traslado;
  const anticipo = Math.round((total * 0.3) / 50) * 50;
  const lugar = preset ? destino : 'fuera de Hermosillo';

  const texto = [
    `Cotización ${lugar}:`,
    ...elegidos.map(s => `• ${s.nombre}: ${formatCurrency(s.precioSugerido)}`),
    `• Traslado (gasolina y viáticos): ${formatCurrency(traslado)}`,
    `Total: ${formatCurrency(total)}`,
    `Anticipo para apartar la fecha (30%): ${formatCurrency(anticipo)}`
  ].join('\n');

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      alert('Cotización copiada. Pégala en WhatsApp.');
    } catch {
      alert(texto);
    }
  };

  const toggle = (id: string) =>
    setServicioIds(ids => (ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]));

  const campo = 'w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500';

  return (
    <div className="bg-white rounded-lg shadow border">
      <button
        onClick={() => setAbierto(!abierto)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className="flex items-center gap-2 font-semibold text-gray-900">
          <MapPin size={18} className="text-purple-600" />
          Cotizar fuera de Hermosillo
        </span>
        <span className="text-sm text-gray-500">{abierto ? 'Ocultar' : 'Servicio + traslado'}</span>
      </button>

      {abierto && (
        <div className="border-t p-4 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servicios</label>
              <div className="max-h-56 overflow-y-auto border rounded-lg divide-y">
                {ordenados.map(s => (
                  <label key={s.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                    <span className="flex items-center gap-2">
                      <input type="checkbox" checked={servicioIds.includes(s.id)} onChange={() => toggle(s.id)} />
                      {s.nombre}
                    </span>
                    <span className="text-gray-500">{formatCurrency(s.precioSugerido)}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
              <select value={destino} onChange={e => setDestino(e.target.value)} className={campo}>
                {DESTINOS.map(d => (
                  <option key={d.nombre} value={d.nombre}>{d.nombre} · {d.km} km · {d.dias} {d.dias === 1 ? 'día' : 'días'}</option>
                ))}
                <option value={OTRO}>Otro destino</option>
              </select>
            </div>
            {!preset && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Km ida y vuelta</label>
                  <input type="number" min="0" value={kmOtro || ''} onChange={e => setKmOtro(Number(e.target.value))} className={campo} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Días</label>
                  <input type="number" min="1" value={diasOtro} onChange={e => setDiasOtro(Number(e.target.value))} className={campo} />
                </div>
              </div>
            )}
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-600">Ajustar gasolina y viáticos</summary>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {([
                  ['kmPorLitro', 'Km por litro'],
                  ['precioGasolina', 'Gasolina por litro'],
                  ['comidaDia', 'Comida por persona/día'],
                  ['cafeDia', 'Café por persona/día'],
                  ['personas', 'Personas']
                ] as const).map(([k, etiqueta]) => (
                  <div key={k}>
                    <label className="block text-xs text-gray-600 mb-1">{etiqueta}</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={params[k]}
                      onChange={e => setParams({ ...params, [k]: Number(e.target.value) })}
                      className={campo}
                    />
                  </div>
                ))}
              </div>
            </details>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 text-sm space-y-2 self-start">
            {elegidos.map(s => (
              <div key={s.id} className="flex justify-between"><span>{s.nombre}</span><span>{formatCurrency(s.precioSugerido)}</span></div>
            ))}
            {elegidos.length === 0 && <p className="text-gray-500">Elige uno o más servicios.</p>}
            <div className="flex justify-between text-gray-600"><span>Gasolina ({km} km)</span><span>{formatCurrency(gasolina)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Viáticos ({dias} {dias === 1 ? 'día' : 'días'}, {params.personas} personas)</span><span>{formatCurrency(viaticos)}</span></div>
            <div className="flex justify-between font-medium border-t pt-2"><span>Traslado</span><span>{formatCurrency(traslado)}</span></div>
            <div className="flex justify-between text-lg font-semibold border-t pt-2"><span>Total</span><span>{formatCurrency(total)}</span></div>
            <div className="flex justify-between text-purple-700"><span>Anticipo 30%</span><span>{formatCurrency(anticipo)}</span></div>
            <p className="text-xs text-gray-500 pt-1">Sin hospedaje ni casetas; para Arizona no incluye visa ni seguro del carro.</p>
            <button
              onClick={copiar}
              disabled={elegidos.length === 0}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-purple-600 text-white rounded-lg py-2 hover:bg-purple-700 disabled:opacity-40"
            >
              <Copy size={16} /> Copiar para WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
