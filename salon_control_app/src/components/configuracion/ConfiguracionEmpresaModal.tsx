// src/components/configuracion/ConfiguracionEmpresaModal.tsx
import { X, Save } from 'lucide-react';
import { useState } from 'react';
import { ConfiguracionEmpresa } from '../../types/config';

interface ConfiguracionEmpresaModalProps {
  isOpen: boolean;
  configuracion: ConfiguracionEmpresa;
  onSave: (nombre: string) => void;
  onClose: () => void;
}

export default function ConfiguracionEmpresaModal({ 
  isOpen, 
  configuracion, 
  onSave, 
  onClose 
}: ConfiguracionEmpresaModalProps) {
  const [nombre, setNombre] = useState(configuracion.nombre);
  const [configurado, setConfigurado] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nombre.trim()) {
      onSave(nombre.trim());
      setConfigurado(true);
    }
  };

  const handleClose = () => {
    setConfigurado(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Configuración de Empresa
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Empresa *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ej: Salón de Belleza Mi Estilo"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Este nombre aparecerá en el título de la aplicación y en todas las comunicaciones
              </p>
            </div>

            {configurado && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 font-medium">
                  ✓ Configuración guardada correctamente
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              {configurado ? 'Cerrar' : 'Cancelar'}
            </button>
            {!configurado && (
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2"
              >
                <Save size={16} />
                Configurar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}