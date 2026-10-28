// src/components/citas/CobroModal.tsx
import { X, Plus, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { type Cita, type Servicio } from "../../types/citas";
import ResumenCobro from "./ResumenCobro";
import {
  calculateChargeBreakdown,
  calculateCommission,
  formatCurrency
} from "../../utils/financialUtils";
import { db } from "../../db/db";
import { useLiveQuery } from "dexie-react-hooks";
import { registrarCanjes, canjearPuntos } from "../../db/circulo";
import { useRolSalon } from "../../db/salon";
import { usarSaldo } from "../../db/saldo";
import { saldoDe, saldoUsable } from "../../utils/saldo";
import {
  NOMBRE_NIVEL, NOMBRE_CIRCULO, estadoCirculo, parametrosDe, beneficiosDisponibles, datosBeneficio, descuentoServicio, porcentajeReferida, textoSaldoPuntos, montoCanje, costoPuntos, AVISO_GASTO,
  type ClaveBeneficio
} from "../../utils/lealtad";

interface CobroModalProps {
  cita: Cita;
  servicios: Servicio[];
  onClose: () => void;
  onCompletar: (citaId: string, precioFinal: number, metodoPago: string, notas: string, serviciosAdicionales?: any[]) => void;
}

interface ServicioAdicional {
  servicioId: string;
  nombre: string;
  precio: number;
  beneficio?: ClaveBeneficio; // cortesía del Círculo CB
}

export default function CobroModal({ cita, servicios, onClose, onCompletar }: CobroModalProps) {
  // Estado para el servicio seleccionado (inicialmente el servicio original de la cita)
  const [servicioSeleccionadoId, setServicioSeleccionadoId] = useState(cita.servicioId);
  const [serviciosAdicionales, setServiciosAdicionales] = useState<ServicioAdicional[]>([]);

  // Estados para descuentos y propina
  const [porcentajeSeleccionado, setPorcentajeSeleccionado] = useState(0);
  const [descuentoClub, setDescuentoClub] = useState<'referida' | 'nivel' | null>(null); // descuento del Club aplicado en este cobro
  const [propina, setPropina] = useState(0);

  const [anticipoRecibido, setAnticipoRecibido] = useState(cita.montoAnticipo || 0);
  const [conSaldo, setConSaldo] = useState(0); // saldo a favor que se usa en este cobro
  const [metodoPago, setMetodoPago] = useState("");
  const [notas, setNotas] = useState("");
  const [descripcionTrabajo, setDescripcionTrabajo] = useState(cita.descripcionTrabajo || "");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showServiciosDropdown, setShowServiciosDropdown] = useState(false);

  // Obtener el servicio actualmente seleccionado
  const servicioActual = servicios.find((s) => s.id === servicioSeleccionadoId);

  // Cálculos base
  const subtotalServicios = (servicioActual?.precioSugerido || 0) +
    serviciosAdicionales.reduce((sum, s) => sum + s.precio, 0);

  // Cálculos base usando la nueva utilidad financiera
  // Saldo a favor (tarjetas de regalo, pedidos no recogidos): se descuenta como un anticipo
  const movimientosSaldo = useLiveQuery(() => db.movimientosSaldo.where('clienteId').equals(cita.clienteId).toArray(), [cita.clienteId]) || [];
  const saldoDisponible = saldoDe(movimientosSaldo, cita.clienteId);
  const sinSaldo = calculateChargeBreakdown(subtotalServicios, porcentajeSeleccionado, 0, anticipoRecibido);
  const maxSaldo = saldoUsable(saldoDisponible, Math.max(0, sinSaldo.subtotalConDescuento - anticipoRecibido));
  // Usar saldo escribe movimientosSaldo, que solo la Dueña puede escribir en Dexie Cloud: si lo hiciera la empleada,
  // la cita quedaría pagada con saldo y el servidor rechazaría el cargo (la clienta conservaría el dinero)
  const esDuena = useRolSalon() === 'duena';
  const saldoAplicado = esDuena ? Math.min(conSaldo, maxSaldo) : 0;
  const calculoFinal = calculateChargeBreakdown(
    subtotalServicios,
    porcentajeSeleccionado,
    propina,
    anticipoRecibido + saldoAplicado
  );

  // Obtener empleados para el desglose de comisiones
  const empleadosArray = useLiveQuery(() => db.empleados.toArray()) || [];
  const empleadosAsignados = empleadosArray.filter(e => cita.empleadoIds?.includes(e.id));

  // Círculo CB: nivel de la clienta y cortesías que puede recibir en este cobro
  const clientesTodos = useLiveQuery(() => db.clientes.toArray()) || [];
  const citasTodas = useLiveQuery(() => db.citas.toArray()) || [];
  const ventasTodas = useLiveQuery(() => db.ventas.toArray()) || [];
  const clienta = clientesTodos.find(c => c.id === cita.clienteId);
  const settingsCirculo = useLiveQuery(() => db.configuracion.get('settings'));
  const pClub = parametrosDe(settingsCirculo as any);
  const estadoClub = clienta ? estadoCirculo(clienta, citasTodas, ventasTodas, clientesTodos, servicios as any, pClub, undefined, movimientosSaldo) : null;
  const nivel = estadoClub?.nivel ?? 'marfil';
  const puntosClub = estadoClub?.activa ? estadoClub.puntos : 0;
  // Usar los puntos aquí mismo: se cambian por saldo a favor (solo la Dueña) y el saldo entra a este cobro
  const usarPuntos = async () => {
    if (!clienta || !confirm(`¿Cambiar ${puntosClub.toLocaleString('es-MX')} puntos por $${montoCanje(puntosClub, pClub)} de saldo y usarlo en este cobro?`)) return;
    const monto = await canjearPuntos(clienta.id, puntosClub, pClub);
    setConSaldo(c => c + monto);
  };
  const aplicados: ClaveBeneficio[] = [...serviciosAdicionales.filter(s => s.beneficio).map(s => s.beneficio!), ...(descuentoClub === 'referida' ? ['referida' as const] : [])];
  const pctNivel = clienta ? descuentoServicio(nivel, servicioSeleccionadoId) : 0; // 15% en maquillaje desde Ámbar, peinado en Ónix
  const sinAplicar = (lista: ClaveBeneficio[]) => {
    const restantes = [...aplicados];
    return lista.filter(k => { const i = restantes.indexOf(k); if (i >= 0) { restantes.splice(i, 1); return false; } return true; });
  };
  const beneficiosCobro = clienta
    ? sinAplicar(beneficiosDisponibles(clienta, nivel, clientesTodos, citasTodas, servicios as any, new Date(), pClub,
        puntosClub - aplicados.reduce((t, k) => t + costoPuntos(k), 0)))   // los regalos ya aplicados gastan puntos
        .filter(k => k !== 'referida' || !descuentoClub)   // un solo descuento del Club por cobro
        // Los regalos de nivel gastan puntos (movimientosSaldo): solo la Dueña puede escribirlos; si no, quedaría usado sin descontar
        .filter(k => esDuena || !costoPuntos(k))
    : [];

  const aplicarBeneficio = (clave: ClaveBeneficio) => {
    if (clave === 'referida') {   // 20% con tope en pesos, expresado como porcentaje del cobro
      setPorcentajeSeleccionado(porcentajeReferida(subtotalServicios, pClub));
      setDescuentoClub('referida');
      return;
    }
    const datos = datosBeneficio(clave, nivel);
    const servicio = servicios.find(s => s.id === datos.servicioId);
    setServiciosAdicionales([...serviciosAdicionales, {
      servicioId: datos.servicioId,
      nombre: `${servicio?.nombre || datos.titulo} · cortesía ${NOMBRE_CIRCULO}`,
      precio: 0,
      beneficio: clave
    }]);
  };

  // Calcular desglose de comisiones
  const comisionInfo = calculateCommission(
    calculoFinal.subtotalConDescuento, // La comisión se calcula sobre el precio con descuento
    empleadosAsignados.length,
    servicioActual?.comision,
    empleadosAsignados[0]?.porcentajeComision
  );

  const agregarServicio = (servicio: Servicio) => {
    const nuevoServicio: ServicioAdicional = {
      servicioId: servicio.id,
      nombre: servicio.nombre,
      precio: servicio.precioSugerido
    };
    setServiciosAdicionales([...serviciosAdicionales, nuevoServicio]);
    setShowServiciosDropdown(false);
  };

  const eliminarServicio = (index: number) => {
    setServiciosAdicionales(serviciosAdicionales.filter((_, i) => i !== index));
  };

  const cambiarServicioPrincipal = (servicioId: string) => {
    setServicioSeleccionadoId(servicioId);
  };

  const handleCompletar = () => {
    setShowConfirmation(true);
  };

  const confirmarCompletado = () => {
    // El precio final incluye todo: saldo + redondeo + propina
    const precioFinalCompleto = calculoFinal.subtotalConDescuento + calculoFinal.montoRedondeo + calculoFinal.propina;

    // Incluir toda la información del servicio modificado y cálculos
    const datosCompletos: any = {
      servicioSeleccionado: servicioSeleccionadoId,
      serviciosAdicionales: serviciosAdicionales,
      descuento: calculoFinal.descuentoPorcentaje,
      tipoDescuento: 'porcentaje',
      subtotalServicios: calculoFinal.subtotalServicios,
      montoDescuento: calculoFinal.montoDescuento,
      montoRedondeo: calculoFinal.montoRedondeo,
      propina: calculoFinal.propina,
      anticipoRecibido: anticipoRecibido,
      porcentajeOriginal: porcentajeSeleccionado,
      subtotalConDescuento: calculoFinal.subtotalConDescuento,
      descripcionTrabajo,
      pagadoConSaldo: saldoAplicado
    };

    // Convertir a array si es lo que espera onCompletar (aunque parece que espera un objeto según el nombre de la prop en CobroModalProps)
    // Pero la firma dice serviciosAdicionales?: any[]
    onCompletar(cita.id, precioFinalCompleto, metodoPago, notas, [datosCompletos]);
    registrarCanjes(cita.clienteId, aplicados, cita.id);
    usarSaldo(cita.clienteId, saldoAplicado, cita.id);
    onClose();
  };

  const cancelarCompletado = () => {
    setShowConfirmation(false);
  };

  if (showConfirmation) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle size={24} className="text-orange-500" />
            <h2 className="text-lg font-semibold">Confirmar Finalización</h2>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-gray-700">¿Está seguro que desea finalizar esta cita?</p>
            <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
              <p><strong>Servicio principal:</strong> {servicioActual?.nombre}</p>
              {serviciosAdicionales.length > 0 && (
                <div>
                  <strong>Servicios adicionales:</strong>
                  <ul className="ml-4 list-disc">
                    {serviciosAdicionales.map((s, i) => (
                      <li key={i}>{s.nombre} - {formatCurrency(s.precio)}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p><strong>Subtotal servicios:</strong> {formatCurrency(calculoFinal.subtotalServicios)}</p>
              {calculoFinal.montoDescuento > 0 && (
                <p><strong>Descuento ({calculoFinal.descuentoPorcentaje}%):</strong> -{formatCurrency(calculoFinal.montoDescuento)}</p>
              )}
              <p><strong>Subtotal:</strong> {formatCurrency(calculoFinal.subtotalConDescuento)}</p>
              <p><strong>Anticipo recibido:</strong> -{formatCurrency(anticipoRecibido)}</p>
              {saldoAplicado > 0 && <p><strong>Saldo a favor:</strong> -{formatCurrency(saldoAplicado)}</p>}
              {calculoFinal.montoRedondeo > 0 && (
                <p><strong>Redondeo:</strong> +{formatCurrency(calculoFinal.montoRedondeo)}</p>
              )}
              {calculoFinal.propina > 0 && (
                <p><strong>Propina:</strong> +{formatCurrency(calculoFinal.propina)}</p>
              )}
              <p><strong>Saldo pendiente:</strong> {formatCurrency(calculoFinal.totalFinal)}</p>
              <p><strong>Método de pago:</strong> {metodoPago}</p>
            </div>
            <p className="text-sm text-orange-600">
              Una vez finalizada, la cita se marcará como completada y se contabilizará en los reportes.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={cancelarCompletado}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarCompletado}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Confirmar y Finalizar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Finalizar y Cobrar</h2>
          <button onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna izquierda: Servicios y configuraciones */}
          <div className="space-y-4">
            {/* Círculo CB */}
            {clienta && (beneficiosCobro.length > 0 || aplicados.length > 0 || pctNivel > 0 || puntosClub > 0) && (
              <div className="rounded-lg bg-marca-negro text-white p-4">
                <div className="text-[11px] tracking-[0.24em] uppercase text-marca-dorado">{NOMBRE_CIRCULO} · {NOMBRE_NIVEL[nivel]}</div>
                {puntosClub > 0 && (
                  <div className="mt-2 text-sm text-gray-200">
                    {textoSaldoPuntos(puntosClub, pClub)}
                    {esDuena && puntosClub >= pClub.canjeMinimo && (
                      <button type="button" onClick={usarPuntos}
                        className="mt-2 block text-xs px-3 py-1 rounded-md border border-marca-dorado text-marca-dorado hover:bg-white/10">Usar los puntos en este cobro</button>
                    )}
                  </div>
                )}
                {beneficiosCobro.map((k, i) => (
                  <div key={k + i} className="flex items-center justify-between gap-2 mt-2 text-sm">
                    <span>{k === 'referida' ? `${datosBeneficio(k, nivel).titulo}: ${pClub.referidaDescuento}% (tope $${pClub.referidaTope})` : datosBeneficio(k, nivel).titulo}</span>
                    <button type="button" onClick={() => aplicarBeneficio(k)}
                      className="shrink-0 text-xs px-3 py-1 rounded-md bg-marca-dorado text-marca-negro font-medium hover:opacity-90">Aplicar</button>
                  </div>
                ))}
                {beneficiosCobro.some(k => costoPuntos(k)) && <div className="text-[11px] text-gray-400 mt-2">{AVISO_GASTO}.</div>}
                {aplicados.length > 0 && (
                  <div className="text-xs text-gray-300 mt-2">Aplicado: {aplicados.map(k => datosBeneficio(k, nivel).titulo).join(', ')}. Se registra al finalizar.</div>
                )}
                {pctNivel > 0 && !descuentoClub && (
                  <div className="flex items-center justify-between gap-2 mt-2 text-sm">
                    <span>{pctNivel}% del Club en este servicio ({NOMBRE_NIVEL[nivel]})</span>
                    <button type="button" onClick={() => { setPorcentajeSeleccionado(pctNivel); setDescuentoClub('nivel'); }}
                      className="shrink-0 text-xs px-3 py-1 rounded-md bg-marca-dorado text-marca-negro font-medium hover:opacity-90">Aplicar</button>
                  </div>
                )}
                {descuentoClub && <div className="text-xs text-gray-300 mt-2">Descuento del Club aplicado: {porcentajeSeleccionado}%.</div>}
              </div>
            )}
            {/* Servicios */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Servicios
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowServiciosDropdown(!showServiciosDropdown)}
                    className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    <Plus size={14} />
                    Añadir
                  </button>

                  {showServiciosDropdown && (
                    <div className="absolute right-0 mt-1 w-64 bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {servicios
                        .filter(s => s.id !== servicioSeleccionadoId && !s.archivado && s.categoria !== 'otros')
                        .map(servicio => (
                          <button
                            key={servicio.id}
                            onClick={() => agregarServicio(servicio)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm border-b last:border-b-0"
                          >
                            <div className="font-medium">{servicio.nombre}</div>
                            <div className="text-gray-500">{formatCurrency(servicio.precioSugerido)}</div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Servicio principal - Editable */}
              <div className="bg-gray-50 p-3 rounded-lg mb-2">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <select
                      value={servicioSeleccionadoId}
                      onChange={(e) => cambiarServicioPrincipal(e.target.value)}
                      className="w-full border rounded px-2 py-1 text-sm bg-white"
                    >
                      {servicios.filter(s => (!s.archivado && s.categoria !== 'otros') || s.id === servicioSeleccionadoId).map(servicio => (
                        <option key={servicio.id} value={servicio.id}>
                          {servicio.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-green-600 font-semibold ml-3">
                    {formatCurrency(servicioActual?.precioSugerido || 0)}
                  </span>
                </div>
              </div>

              {/* Servicios adicionales */}
              {serviciosAdicionales.map((servicio, index) => (
                <div key={index} className="bg-blue-50 p-3 rounded-lg mb-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{servicio.nombre}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 font-semibold">
                        {formatCurrency(servicio.precio)}
                      </span>
                      <button
                        onClick={() => eliminarServicio(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Anticipo recibido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anticipo recibido
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={anticipoRecibido}
                  onChange={(e) => setAnticipoRecibido(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>

            {/* Saldo a favor de la clienta */}
            {saldoDisponible > 0 && !esDuena && (
              <p className="bg-green-50 border border-green-200 rounded p-3 text-sm text-gray-700">Tiene {formatCurrency(saldoDisponible)} de saldo a favor: para usarlo en este cobro, que lo cobre la Dueña.</p>
            )}
            {saldoDisponible > 0 && esDuena && (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usar saldo a favor (disponible {formatCurrency(saldoDisponible)})
                </label>
                {/* ponytail: la regla del saldo del Club se avisa, no se bloquea; separar saldos si se abusa */}
                {movimientosSaldo.some(m => m.origen === 'club') && (
                  <p className="text-xs text-gray-500 mb-1">El saldo que viene del {NOMBRE_CIRCULO} es para productos, color, maquillaje o corte.</p>
                )}
                <div className="flex gap-2">
                  <input type="number" min="0" max={maxSaldo} value={saldoAplicado || ''} onChange={(e) => setConSaldo(Math.max(0, Number(e.target.value) || 0))}
                    className="flex-1 border rounded px-3 py-2" placeholder="$0" />
                  <button type="button" onClick={() => setConSaldo(maxSaldo)} className="px-3 py-2 rounded border text-sm">Usar {formatCurrency(maxSaldo)}</button>
                </div>
              </div>
            )}

            {/* Método de pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Método de pago *
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Seleccionar método de pago</option>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
                <option value="mixto">Mixto</option>
                <option value="saldo">Saldo a favor</option>
              </select>
            </div>

            {/* Qué se hizo y por qué se cobró así */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción del trabajo
              </label>
              <textarea
                value={descripcionTrabajo}
                onChange={(e) => setDescripcionTrabajo(e.target.value)}
                placeholder="Qué se trabajó y por qué se cobró así. Ej.: retoque de raíz 4 cm + matiz completo; se cobró extra por largo."
                className="w-full border rounded px-3 py-2 h-20 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Notas adicionales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas adicionales
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones del servicio..."
                className="w-full border rounded px-3 py-2 h-20 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <ResumenCobro
              subtotalServicios={subtotalServicios}
              porcentajeSeleccionado={porcentajeSeleccionado}
              propina={propina}
              anticipo={anticipoRecibido}
              calculoFinal={calculoFinal}
              onPorcentajeChange={setPorcentajeSeleccionado}
              onPropinaChange={setPropina}
            />

            {/* Desglose de Ganancias Empleados */}
            <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
              <h3 className="text-sm font-bold text-purple-900 mb-3 flex items-center justify-between">
                <span>Ganancias Empleados</span>
                <span className="text-xs font-normal text-purple-600">Comisión: {comisionInfo.percentageUsed}%</span>
              </h3>
              <div className="space-y-2">
                {empleadosAsignados.length > 0 ? (
                  empleadosAsignados.map(emp => (
                    <div key={emp.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{emp.nombre}</span>
                      <span className="font-bold text-purple-700">{formatCurrency(comisionInfo.perEmployeeCommission)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-orange-600 italic">No hay empleados asignados para comisión</div>
                )}
                <div className="pt-2 border-t border-purple-200 flex justify-between items-center font-bold text-purple-900">
                  <span>Total Comisiones</span>
                  <span>{formatCurrency(comisionInfo.totalCommission)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleCompletar}
            disabled={!metodoPago}
            className={`px-4 py-2 rounded ${metodoPago
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
          >
            Completar Cita
          </button>
        </div>
      </div>
    </div>
  );
}