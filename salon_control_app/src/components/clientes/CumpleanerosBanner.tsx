// src/components/clientes/CumpleanerosBanner.tsx
import { useState } from 'react';
import { Gift, Calendar } from 'lucide-react';
import { Cliente } from '../../types/clientes';
import { formatBirthdayWithAge, calcularEdad, esCumpleanosHoy } from '../../utils/clientesUtils';

interface CumpleanerosBannerProps {
  cumpleaneros: Cliente[];
}

export default function CumpleanerosBanner({ cumpleaneros }: CumpleanerosBannerProps) {
  const [showAll, setShowAll] = useState(false);

  if (cumpleaneros.length === 0) return null;

  const mesActual = new Date().toLocaleDateString('es-ES', { month: 'long' });
  const cumpleanosHoy = cumpleaneros.filter(cliente => esCumpleanosHoy(cliente.cumple));

  return (
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gift size={20} className="text-pink-600" />
          <h3 className="text-lg font-semibold text-pink-800">
            Cumpleañeros de {mesActual}
          </h3>
          <span className="bg-pink-200 text-pink-800 px-2 py-1 rounded-full text-sm font-medium">
            {cumpleaneros.length}
          </span>
        </div>
        {cumpleaneros.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-pink-600 hover:text-pink-800 text-sm font-medium"
          >
            {showAll ? 'Ocultar' : 'Ver todos'}
          </button>
        )}
      </div>

      {/* Cumpleañeros de hoy (destacados) */}
      {cumpleanosHoy.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-pink-700" />
            <h4 className="font-medium text-pink-700">¡Cumpleaños hoy!</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {cumpleanosHoy.map(cliente => (
              <div
                key={cliente.id}
                className="bg-pink-200 border-2 border-pink-400 rounded-lg px-3 py-2 shadow-sm animate-pulse"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎂</span>
                  <div>
                    <span className="font-semibold text-pink-900">{cliente.nombre}</span>
                    <div className="text-sm text-pink-700">
                      {calcularEdad(cliente.cumple)} años
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Todos los cumpleañeros del mes */}
      <div>
        <h4 className="font-medium text-pink-700 mb-2">Este mes:</h4>
        <div className="flex flex-wrap gap-2">
          {cumpleaneros
            .filter(cliente => !esCumpleanosHoy(cliente.cumple)) // Excluir los que ya se mostraron arriba
            .slice(0, showAll ? undefined : 6)
            .map(cliente => (
              <div
                key={cliente.id}
                className="bg-white border border-pink-200 rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2">
                  <span className="text-pink-600">🎈</span>
                  <div>
                    <div className="font-medium text-gray-900">{cliente.nombre}</div>
                    <div className="text-xs text-pink-600">
                      {formatBirthdayWithAge(cliente.cumple)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          
          {!showAll && cumpleaneros.filter(c => !esCumpleanosHoy(c.cumple)).length > 6 && (
            <div className="bg-pink-100 border border-pink-200 rounded-lg px-3 py-2 flex items-center">
              <span className="text-pink-700 text-sm">
                +{cumpleaneros.filter(c => !esCumpleanosHoy(c.cumple)).length - 6} más
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-pink-200">
        <p className="text-xs text-pink-600 flex items-center gap-1">
          <Gift size={12} />
          ¡No olvides enviar felicitaciones y promociones especiales!
        </p>
      </div>
    </div>
  );
}