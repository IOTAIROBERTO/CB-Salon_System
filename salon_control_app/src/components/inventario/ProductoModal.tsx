import { X } from 'lucide-react';
import { Producto, ProductoFormData, ModalType } from '../../types/inventario';
import { validateProductoForm } from '../../utils/inventarioUtils';

interface ProductoModalProps {
  isOpen: boolean;
  modalType: ModalType;
  editingProducto: Producto | null;
  formData: ProductoFormData;
  updateFormData: (field: keyof ProductoFormData, value: string | number) => void;
  onSave: (productoData: Omit<Producto, 'id' | 'fechaUltimaCompra'>) => void;
  onUpdate: (productoId: string, updatedData: Partial<Producto>) => void;
  onClose: () => void;
}

export default function ProductoModal({ 
  isOpen, 
  modalType,
  editingProducto, 
  formData, 
  updateFormData,
  onSave,
  onUpdate,
  onClose 
}: ProductoModalProps) {
  if (!isOpen || (modalType !== 'create' && modalType !== 'edit')) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateProductoForm(formData);
    if (validationError) {
      alert(validationError);
      return;
    }

    const productoData = {
      nombre: formData.nombre.trim(),
      cantidad: formData.cantidad,
      precio: formData.precio,
      stockMinimo: formData.stockMinimo,
      categoria: formData.categoria.trim(),
      proveedor: formData.proveedor.trim()
    };

    if (editingProducto && modalType === 'edit') {
      // Actualizar producto existente (sin modificar stock desde aquí)
      const updatedData = {
        nombre: productoData.nombre,
        precio: productoData.precio,
        stockMinimo: productoData.stockMinimo,
        categoria: productoData.categoria,
        proveedor: productoData.proveedor
      };
      onUpdate(editingProducto.id, updatedData);
    } else {
      // Crear nuevo producto
      onSave(productoData);
    }
    
    alert((modalType === 'edit' ? 'Producto actualizado' : 'Producto agregado') + ' exitosamente!');
    onClose();
  };

  const isEditing = modalType === 'edit';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => updateFormData('nombre', e.target.value)}
                  placeholder="Ej: Shampoo, Tinte, Esmalte..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría *
                </label>
                <input
                  type="text"
                  value={formData.categoria}
                  onChange={(e) => updateFormData('categoria', e.target.value)}
                  placeholder="Ej: Cuidado capilar, Coloración, Manicure..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {modalType === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad Inicial
                  </label>
                  <input
                    type="number"
                    value={formData.cantidad}
                    onChange={(e) => updateFormData('cantidad', Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Para productos existentes, usa "Editar Stock" después
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Unitario *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.precio}
                    onChange={(e) => updateFormData('precio', Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Mínimo
                </label>
                <input
                  type="number"
                  value={formData.stockMinimo}
                  onChange={(e) => updateFormData('stockMinimo', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se mostrará alerta cuando el stock esté por debajo de este número
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor
                </label>
                <input
                  type="text"
                  value={formData.proveedor}
                  onChange={(e) => updateFormData('proveedor', e.target.value)}
                  placeholder="Nombre del proveedor (opcional)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                {isEditing ? 'Actualizar' : 'Agregar'} Producto
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}