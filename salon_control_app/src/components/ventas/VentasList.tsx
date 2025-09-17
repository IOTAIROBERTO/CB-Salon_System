// src/components/ventas/VentasList.tsx
import { ShoppingBag } from 'lucide-react';
import { Venta, Cliente, Item } from '../../types/ventas';
import VentaCard from './VentaCard';

interface VentasListProps {
  ventas: Venta[];
  clientes: Cliente[];
  inventario: Item[];
  onDelete: (id: string) => boolean;
}

export default function VentasList({ ventas, clientes, inventario, onDelete }: VentasListProps) {
  if (ventas.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <ShoppingBag size={48} className="mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay ventas registradas
        </h3>
        <p className="text-gray-600">
          Las ventas aparecerán aquí una vez que registres la primera
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ventas.map((venta) => (
        <VentaCard
          key={venta.id}
          venta={venta}
          clientes={clientes}
          inventario={inventario}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}