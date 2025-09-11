import { useEffect, useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Calendar, MessageCircle, Search, Phone, Mail, X, User } from 'lucide-react';

interface Cliente {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  cumple: string;
  comentarios: string;
  posibleBaja: boolean;
}

export default function VentasPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    cumple: '',
    comentarios: '',
    posibleBaja: false
  });

  // Cargar datos iniciales
  useEffect(() => {
    const storedClientes = JSON.parse(localStorage.getItem('clientes') || '[]');
    setClientes(storedClientes);
  }, []);

  const filteredClientes = useMemo(() => {
    return clientes.filter(cliente =>
      cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cliente.email && cliente.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cliente.telefono && cliente.telefono.includes(searchTerm))
    );
  }, [clientes, searchTerm]);

  const openNewClienteModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditClienteModal = (cliente: Cliente) => {
    setFormData({
      nombre: cliente.nombre,
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      cumple: cliente.cumple,
      comentarios: cliente.comentarios,
      posibleBaja: cliente.posibleBaja
    });
    setEditingCliente(cliente);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      cumple: '',
      comentarios: '',
      posibleBaja: false
    });
    setEditingCliente(null);
  };

  const isFormValid = () => formData.nombre.trim() !== '';

  const saveCliente = () => {
    if (!isFormValid()) {
      alert('Por favor ingresa el nombre del cliente.');
      return;
    }

    let updatedClientes;

    if (editingCliente) {
      const updatedCliente = { ...editingCliente, ...formData };
      updatedClientes = clientes.map(c =>
        c.id === editingCliente.id ? updatedCliente : c
      );
    } else {
      const newCliente: Cliente = {
        id: `cliente_${Date.now()}`,
        ...formData
      };
      updatedClientes = [...clientes, newCliente];
    }

    setClientes(updatedClientes);
    localStorage.setItem('clientes', JSON.stringify(updatedClientes));
    closeModal();
  };

  const deleteCliente = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
      const updatedClientes = clientes.filter(c => c.id !== id);
      setClientes(updatedClientes);
      localStorage.setItem('clientes', JSON.stringify(updatedClientes));
    }
  };

  return (
    <div className="w-full max-w-none">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Ventas</h1>
        <button
          onClick={openNewClienteModal}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar cliente por nombre, correo o teléfono..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cumpleaños</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClientes.map(cliente => (
              <tr key={cliente.id}>
                <td className="px-6 py-4 whitespace-nowrap">{cliente.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap">{cliente.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{cliente.telefono}</td>
                <td className="px-6 py-4 whitespace-nowrap">{cliente.cumple}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditClienteModal(cliente)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteCliente(cliente.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nombre"
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <input
                  type="tel"
                  placeholder="Teléfono"
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
                <input
                  type="date"
                  placeholder="Cumpleaños"
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.cumple}
                  onChange={(e) => setFormData({ ...formData, cumple: e.target.value })}
                />
                <textarea
                  placeholder="Comentarios"
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.comentarios}
                  onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveCliente}
                  disabled={!isFormValid()}
                  className={`px-4 py-2 rounded-lg ${
                    isFormValid()
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {editingCliente ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
