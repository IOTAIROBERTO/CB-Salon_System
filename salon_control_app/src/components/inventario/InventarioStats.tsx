import { Package, TrendingDown } from 'lucide-react';
import { InventarioStats as IInventarioStats } from '../../types/inventario';

interface InventarioStatsProps {
  stats: IInventarioStats;
}

export default function InventarioStats({ stats }: InventarioStatsProps) {
  const {
    totalProductos,
    productosStockBajo,
    valorTotalInventario,
    categorias
  } = stats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Productos</p>
            <p className="text-2xl font-bold text-gray-900">{totalProductos}</p>
          </div>
          <Package size={24} className="text-blue-600" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Stock Bajo</p>
            <p className="text-2xl font-bold text-orange-600">{productosStockBajo}</p>
          </div>
          <TrendingDown size={24} className="text-orange-600" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Valor Total</p>
            <p className="text-2xl font-bold text-green-600">
              ${valorTotalInventario.toLocaleString()}
            </p>
          </div>
          <span className="text-2xl">💰</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Categorías</p>
            <p className="text-2xl font-bold text-purple-600">{categorias}</p>
          </div>
          <span className="text-2xl">📦</span>
        </div>
      </div>
    </div>
  );
}