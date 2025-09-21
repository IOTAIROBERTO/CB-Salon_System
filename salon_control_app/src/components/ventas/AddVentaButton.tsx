// src/components/ventas/AddVentaButton.tsx
import { Plus } from 'lucide-react';

interface AddVentaButtonProps {
  onAdd: () => void;
}

export default function AddVentaButton({ onAdd }: AddVentaButtonProps) {
  return (
    <button
      onClick={onAdd}
      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
    >
      <Plus size={20} />
      Nueva Venta
    </button>
  );
}