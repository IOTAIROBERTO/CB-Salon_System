import { X, AlertTriangle } from 'lucide-react';
import { Producto, StockMovimiento, ModalType } from '../../types/inventario';
import { validateStockForm, calculateNewStock, willBeStockBajo } from '../../utils/inventarioUtils';

interface StockModalProps {
  isOpen: boolean;
  modalType: ModalType;
  editingProducto: Producto | null;
  stockData: StockMovimiento;
  updateStockData: (field: keyof StockMovimiento, value: string | number) => void;
  onUpdateStock: (productoId: string, stockData: StockMovimiento) => void;
  onClose: () => void;
}

export default function StockModal({ 
  isOpen, 
  modalType,
  editingProducto, 
  stockData, 
  updateStockData,
  onUpdateStock,
  onClose 
}: StockModalProps) {
  if (!isOpen || modalType !== 'stock' || !editingProducto) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateStockForm(stockData);
    if (validationError) {
      alert(validationError);
      return;
    }

    if (stockData.operacion === 'resta' && stockData.cantidad > editingProducto.cantidad) {
      alert('No puedes reducir más stock del disponible');
      return;
    }

    const success = onUpdateStock(editingProducto.id, stockData);
    if (success) {
      alert(`Stock ${stockData.operacion === 'suma' ? 'aumentado' : 'reducido'} exitosamente`);
      onClose();
    }
  };

  const nuevaCantidad = calculateNewStock(editingProducto.cantidad, stockData);
  const alertaStockBajo = stockData.operacion === 'resta' && willBeStockBajo(editingProducto, stockData.cantidad);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Editar Stock
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Información del producto */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-medium text-gray-900">{editingProducto.nombre}</h3>
                <p className="text-sm text-gray-600">Stock actual: {editingProducto.cantidad} unidades</p>
                <p className="text-sm text-gray-600">Stock mínimo: {editingProducto.stockMinimo} unidades</p>
              </div>

              {/* Tipo de operación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Movimiento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateStockData('operacion', 'suma')}
                    className={`p-3 rounded-lg text-center transition-colors ${
                      stockData.operacion === 'suma'
                        ? 'bg-green-100 text-green-800 border-2 border-green-300'
                        : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    <div className="text-lg">➕</div>
                    <div className="text-sm">Entrada</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStockData('operacion', 'resta')}
                    className={`p-3 rounded-lg text-center transition-colors ${
                      stockData.operacion === 'resta'
                        ? 'bg-red-100 text-red-800 border-2 border-red-300'
                        : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    <div className="text-lg">➖</div>
                    <div className="text-sm">Salida</div>
                  </button>
                </div>
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad *
                </label>
                <input
                  type="number"
                  value={stockData.cantidad}
                  onChange={(e) => updateStockData('cantidad', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max={stockData.operacion === 'resta' ? editingProducto.cantidad : undefined}
                  required
                />
                {stockData.operacion === 'resta' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo disponible: {editingProducto.cantidad} unidades
                  </p>
                )}
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo *
                </label>
                <select
                  value={stockData.motivo}
                  onChange={(e) => updateStockData('motivo', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar motivo</option>
                  {stockData.operacion === 'suma' ? (
                    <>
                      <option value="Compra">Compra</option>
                      <option value="Devolución">Devolución</option>
                      <option value="Ajuste inventario">Ajuste de inventario</option>
                      <option value="Otro">Otro</option>
                    </>
                  ) : (
                    <>
                      <option value="Venta">Venta</option>
                      <option value="Uso interno">Uso interno</option>
                      <option value="Pérdida">Pérdida</option>
                      <option value="Vencimiento">Vencimiento</option>
                      <option value="Ajuste inventario">Ajuste de inventario</option>
                      <option value="Otro">Otro</option>
                    </>
                  )}
                </select>
              </div>

              {/* Previsualización del resultado */}
              {stockData.cantidad > 0 && (
                <div className={`p-3 rounded-lg ${
                  stockData.operacion === 'suma' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <p className="text-sm font-medium text-gray-900">Resultado del movimiento:</p>
                  <p className="text-lg font-bold">
                    {editingProducto.cantidad} 
                    <span className={stockData.operacion === 'suma' ? 'text-green-600' : 'text-red-600'}>
                      {' '}{stockData.operacion === 'suma' ? '+' : '-'}{stockData.cantidad}
                    </span>
                    {' '}= {nuevaCantidad} unidades
                  </p>
                  
                  {/* Alerta si queda por debajo del mínimo */}
                  {alertaStockBajo && (
                    <div className="mt-2 flex items-center gap-2 text-orange-600">
                      <AlertTriangle size={16} />
                      <span className="text-xs">El stock quedará por debajo del mínimo</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`flex-1 px-4 py-2 rounded-lg transition-colors duration-200 ${
                  stockData.operacion === 'suma' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } text-white`}
              >
                {stockData.operacion === 'suma' ? 'Agregar' : 'Reducir'} Stock
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}