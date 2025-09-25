import { Package } from 'lucide-react';

interface EmptyInventarioProps {
  onAddProducto: () => void;
}

export default function EmptyInventario({ onAddProducto }: EmptyInventarioProps) {
  return (
    <div className="text-center py-12">
      <div className="text-gray-400 mb-4">
        <Package size={48} className="mx-auto" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No hay productos en el inventario
      </h3>
      <p className="text-gray-600 mb-4">
        Comienza agregando tu primer producto.
      </p>
      <button 
        onClick={onAddProducto}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
      >
        Agregar Primer Producto
      </button>
    </div>
  );
}