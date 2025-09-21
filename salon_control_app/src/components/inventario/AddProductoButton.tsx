// src/components/inventario/AddProductoButton.tsx
import { Plus } from 'lucide-react';

interface AddProductoButtonProps {
  onAdd: () => void;
}

export default function AddProductoButton({ onAdd }: AddProductoButtonProps) {
  return (
    <button 
      onClick={onAdd}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 justify-center"
    >
      <Plus size={20} />
      <span>Agregar Producto</span>
    </button>
  );
}