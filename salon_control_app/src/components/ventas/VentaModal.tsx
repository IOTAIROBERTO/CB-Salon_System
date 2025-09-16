import { X } from 'lucide-react';
import { VentaFormData, Cliente, Item, Venta } from '../../types/ventas';
import { validateVentaForm, calculateVentaTotal, generateVentaId } from '../../utils/ventasUtils';
import ProductSelector from './ProductSelector';

interface VentaModalProps {
  isOpen: boolean;
  ventaData: VentaFormData;
  clientes: Cliente[];
  inventario: Item[];
  updateFormData: (field: keyof VentaFormData, value: any) => void;
  updateItemQuantity: (itemId: string, cantidad: number) => void;
  onSave: (venta: Venta) => void;
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
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateVentaForm(ventaData);
    if (validationError) {
      alert(validationError);
      return;
    }

    const total = calculateVentaTotal(ventaData.items, inventario);
    
    const nuevaVenta: Venta = {
      id: generateVentaId(),
      clienteId: ventaData.clienteId,
      items: ventaData.items,
      total,
      fecha: new Date().toISOString(),
      notas: ventaData.notas
    };

    onSave(nuevaVenta);
    onClose();
  };

  const total = calculateVentaTotal(ventaData.items, inventario);

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

              {/* Seleccionar productos */}
              <ProductSelector
                inventario={inventario}
                selectedItems={ventaData.items}
                onQuantityChange={updateItemQuantity}
              />

              {/* Resumen de total */}
              {ventaData.items.length > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Total:</span>
                    <span className="text-lg font-bold text-green-600">
                      ${total.toFixed(2)}
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