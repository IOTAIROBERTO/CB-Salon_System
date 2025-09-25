import { ViewMode } from '../../types/clientes';

interface ClientesControlsProps {
  showInactivos: boolean;
  setShowInactivos: (show: boolean) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export default function ClientesControls({ 
  showInactivos, 
  setShowInactivos, 
  viewMode, 
  setViewMode 
}: ClientesControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* Toggle para mostrar inactivos */}
      <button
        onClick={() => setShowInactivos(!showInactivos)}
        className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
          showInactivos 
            ? 'bg-gray-600 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        {showInactivos ? 'Ocultar Inactivos' : 'Mostrar Inactivos'}
      </button>

      {/* Toggle de vista (solo visible en pantallas medianas) */}
      <div className="hidden md:block lg:hidden">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
              viewMode === 'table'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Tabla
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
              viewMode === 'cards'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Tarjetas
          </button>
        </div>
      </div>
    </div>
  );
}