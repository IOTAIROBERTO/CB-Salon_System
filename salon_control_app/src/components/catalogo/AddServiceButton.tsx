// src/components/catalogo/AddServiceButton.tsx
import { Plus } from 'lucide-react';

interface AddServiceButtonProps {
  onAdd: () => void;
}

export default function AddServiceButton({ onAdd }: AddServiceButtonProps) {
  return (
    <button 
      onClick={onAdd}
      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2"
    >
      <Plus size={20} />
      <span>Agregar Servicio</span>
    </button>
  );
}