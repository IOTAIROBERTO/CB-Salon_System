import { Item, VentaItem } from '../../types/ventas';
import { formatCurrency } from '../../utils/financialUtils';

interface ProductSelectorProps {
  inventario: Item[];
  selectedItems: VentaItem[];
  onQuantityChange: (itemId: string, cantidad: number) => void;
}

export default function ProductSelector({ inventario, selectedItems, onQuantityChange }: ProductSelectorProps) {
  const getItemQuantity = (itemId: string): number => {
    const item = selectedItems.find(i => i.itemId === itemId);
    return item ? item.cantidad : 0;
  };

  if (!inventario || inventario.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm">No hay productos disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="font-medium text-gray-700">Productos</p>
      <div className="max-h-60 overflow-y-auto space-y-2">
        {inventario.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-center border rounded-lg px-3 py-2 hover:bg-gray-50"
          >
            <div className="flex-1">
              <p className="font-medium text-gray-900">{item.nombre}</p>
              <p className="text-xs text-gray-500">
                {formatCurrency(item.precio)} - Stock: {item.stock}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max={item.stock}
                value={getItemQuantity(item.id)}
                placeholder="0"
                className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                onChange={(e) => {
                  const cantidad = parseInt(e.target.value, 10) || 0;
                  onQuantityChange(item.id, cantidad);
                }}
              />
              <span className="text-xs text-gray-400">uds</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}