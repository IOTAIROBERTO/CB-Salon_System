import { Plus } from 'lucide-react';

interface AddClienteButtonProps {
  onAdd: () => void;
}

export default function AddClienteButton({ onAdd }: AddClienteButtonProps) {
  return (
    <button 
      onClick={onAdd}
      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2 justify-center"
    >
      <Plus size={20} />
      <span>Nuevo Cliente</span>
    </button>
  );
}