import { X } from 'lucide-react';
import { formatCurrency } from "../../utils/financialUtils";
import { type VentaFormData, type Cliente, type Item, type Venta } from '../../types/ventas';
import { validateVentaForm, calculateVentaTotal, generateVentaId } from '../../utils/ventasUtils';
import ProductSelector from './ProductSelector';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { estadoCirculo, parametrosDe, descuentoProducto, NOMBRE_CIRCULO, NOMBRE_NIVEL, type Nivel } from '../../utils/lealtad';
import { CATEGORIA_ANTOJOS, descuentoAntojo } from '../../data/menuAntojos';

interface VentaModalProps {
  isOpen: boolean;
  ventaData: VentaFormData;
  clientes: Cliente[];
  inventario: Item[];
  updateFormData: (field: keyof VentaFormData, value: any) => void;
  updateItemQuantity: (itemId: string, cantidad: number) => void;
  onSave: (venta: Venta) => Promise<void>;
  onClose: () => void;
}

export default function VentaModal({
  isOpen,
  ventaData,
  clientes,
  inventario,
  updateFormData,
  updateItemQuantity,
  onSave,
  onClose
}: VentaModalProps) {
  // Hooks antes del return condicional (regla de hooks de React)
  const empleados = useLiveQuery(() => db.empleados.toArray())?.filter(e => e.activo) || [];
  // Nivel del Club de la clienta: decide el descuento de cada producto (cabello y antojos tienen su propia escala)
  const nivelClub = useLiveQuery(async (): Promise<Nivel | null> => {
    if (!ventaData.clienteId) return null;
    const [cliente, citas, ventas, todas, servicios, settings, saldo] = await Promise.all([db.clientes.get(ventaData.clienteId), db.citas.toArray(),
      db.ventas.toArray(), db.clientes.toArray(), db.servicios.toArray(), db.configuracion.get('settings'),
      db.movimientosSaldo.where('clienteId').equals(ventaData.clienteId).toArray()]);
    if (!cliente) return null;
    const p = parametrosDe(settings as any);
    const e = estadoCirculo(cliente, citas, ventas, todas, servicios, p, undefined, saldo);
    return e.activa ? e.nivel : null;
  }, [ventaData.clienteId]) ?? null;
  const pctItem = (itemId: string) => {
    const prod = inventario.find(i => i.id === itemId) as (Item & { categoria?: string }) | undefined;
    if (!nivelClub || !prod) return 0;
    return prod.categoria === CATEGORIA_ANTOJOS ? descuentoAntojo(nivelClub, prod.nombre) : descuentoProducto(nivelClub);
  };
  const totalConClub = () => Math.round(ventaData.items.reduce((t, it) => {
    const prod = inventario.find(i => i.id === it.itemId);
    return t + (prod ? prod.precio * it.cantidad * (1 - pctItem(it.itemId) / 100) : 0);
  }, 0));

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateVentaForm(ventaData);
    if (validationError) {
      alert(validationError);
      return;
    }

    const total = totalConClub();
    const ahorro = calculateVentaTotal(ventaData.items, inventario) - total;

    const nuevaVenta: Venta = {
      id: generateVentaId(),
      clienteId: ventaData.clienteId,
      empleadoId: ventaData.empleadoId,
      items: ventaData.items,
      total,
      fecha: new Date().toISOString(),
      notas: [ventaData.notas, ahorro > 0 && nivelClub ? `Descuento ${NOMBRE_CIRCULO} (${NOMBRE_NIVEL[nivelClub]}): $${ahorro}` : ''].filter(Boolean).join(' · ')
    };

    try {
      await onSave(nuevaVenta);
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo guardar la venta');
    }
  };

  const subtotal = calculateVentaTotal(ventaData.items, inventario);
  const total = totalConClub();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Registrar Nueva Venta</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Seleccionar cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente *
                  </label>
                  <select
                    value={ventaData.clienteId}
                    onChange={(e) => updateFormData('clienteId', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empleado (Comisión)
                  </label>
                  <select
                    value={ventaData.empleadoId || ''}
                    onChange={(e) => updateFormData('empleadoId', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Sin asignar</option>
                    {empleados.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nombre} ({emp.porcentajeComision}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Seleccionar productos */}
              <ProductSelector
                inventario={inventario}
                selectedItems={ventaData.items}
                onQuantityChange={updateItemQuantity}
              />

              {/* Resumen de total */}
              {ventaData.items.length > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  {subtotal > total && nivelClub && (
                    <div className="flex justify-between items-center text-sm text-green-700 mb-1">
                      <span>Descuento {NOMBRE_CIRCULO} ({NOMBRE_NIVEL[nivelClub]})</span>
                      <span>−{formatCurrency(subtotal - total)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Total:</span>
                    <span className="font-bold text-lg text-purple-600">
                      {formatCurrency(total)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {ventaData.items.filter(item => item.cantidad > 0).length} productos seleccionados
                  </div>
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas adicionales
                </label>
                <textarea
                  placeholder="Información adicional sobre la venta..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={3}
                  value={ventaData.notas}
                  onChange={(e) => updateFormData('notas', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Guardar Venta
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}