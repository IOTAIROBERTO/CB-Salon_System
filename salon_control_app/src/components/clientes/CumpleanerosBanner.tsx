import { useState } from 'react';
import { Gift } from 'lucide-react';
import { Cliente } from '../../types/clientes';
import { formatDateBirthday } from '../../utils/clientesUtils';

interface CumpleanerosBannerProps {
  cumpleaneros: Cliente[];
}

export default function CumpleanerosBanner({ cumpleaneros }: CumpleanerosBannerProps) {
  const [showAll, setShowAll] = useState(false);

  if (cumpleaneros.length === 0) return null;

  const mesActual = new Date().toLocaleDateString('es-ES', { month: 'long' });

  return (
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Gift size={20} className="text-pink-600" />
          <h3 className="text-lg font-semibold text-pink-800">
            Cumpleaneros de {mesActual}
          </h3>
        </div>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-pink-600 hover:text-pink-800 text-sm font-medium"
        >
          {showAll ? 'Ocultar' : 'Ver todos'}
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {cumpleaneros.slice(0, showAll ? undefined : 3).map(cliente => (
          <div
            key={cliente.id}
            className="bg-white border border-pink-200 rounded-lg px-3 py-2 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-pink-600">🎂</span>
              <span className="font-medium text-gray-900">{cliente.nombre}</span>
              <span className="text-sm text-gray-600">- {formatDateBirthday(cliente.cumple)}</span>
            </div>
          </div>
        ))}
        {!showAll && cumpleaneros.length > 3 && (
          <div className="bg-pink-100 border border-pink-200 rounded-lg px-3 py-2">
            <span className="text-pink-700 text-sm">
              +{cumpleaneros.length - 3} mas
            </span>
          </div>
        )}
      </div>
      
      <p className="text-xs text-pink-600 mt-2">
        No olvides enviar felicitaciones y promociones especiales!
      </p>
    </div>
  );
}