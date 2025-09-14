import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit } from "lucide-react";

interface Cliente {
  id: string;
  nombre: string;
  activo: boolean;
}

interface Item {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
}

interface Venta {
  id: string;
  clienteId: string;
  items: { itemId: string; cantidad: number }[];
  total: number;
  fecha: string;
  notas?: string;
}

export default function VentasPage() {
  // Estados
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [inventario, setInventario] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [ventaData, setVentaData] = useState({
    clienteId: "",
    items: [] as { itemId: string; cantidad: number }[],
    notas: "",
  });

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cargar datos de localStorage de forma segura
  useEffect(() => {
    try {
      const ventasData = JSON.parse(localStorage.getItem("ventas") || "[]");
      const clientesData = JSON.parse(localStorage.getItem("clientes") || "[]");
      const inventarioData = JSON.parse(localStorage.getItem("inventario") || "[]");

      setVentas(Array.isArray(ventasData) ? ventasData : []);
      setClientes(
        Array.isArray(clientesData)
          ? clientesData.filter((c: Cliente) => c.activo)
          : []
      );
      setInventario(Array.isArray(inventarioData) ? inventarioData : []);
    } catch (error) {
      console.error("Error cargando datos desde localStorage:", error);
      setVentas([]);
      setClientes([]);
      setInventario([]);
    }
  }, []);

  // Guardar cambios en ventas
  const saveVenta = (nuevaVenta: Venta) => {
    const updatedVentas = [...ventas, nuevaVenta];
    setVentas(updatedVentas);
    localStorage.setItem("ventas", JSON.stringify(updatedVentas));
  };

  // Crear nueva venta
  const handleNuevaVenta = () => {
    if (!ventaData.clienteId || ventaData.items.length === 0) {
      alert("Debes seleccionar un cliente y al menos un producto.");
      return;
    }

    const total = ventaData.items.reduce((acc, item) => {
      const producto = inventario.find((i) => i.id === item.itemId);
      return acc + (producto ? producto.precio * item.cantidad : 0);
    }, 0);

    const nuevaVenta: Venta = {
      id: `venta_${Date.now()}`,
      clienteId: ventaData.clienteId,
      items: ventaData.items,
      total,
      fecha: new Date().toISOString(),
      notas: ventaData.notas,
    };

    saveVenta(nuevaVenta);

    // Limpiar formulario
    setVentaData({ clienteId: "", items: [], notas: "" });
    setIsModalOpen(false);
  };

  // Eliminar venta
  const deleteVenta = (id: string) => {
    const updatedVentas = ventas.filter((v) => v.id !== id);
    setVentas(updatedVentas);
    localStorage.setItem("ventas", JSON.stringify(updatedVentas));
  };

  // Filtrar ventas por búsqueda
  const filteredVentas = ventas.filter((venta) => {
    const cliente = clientes.find((c) => c.id === venta.clienteId);
    return (
      !searchTerm ||
      (cliente?.nombre?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Gestión de Ventas</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Nueva Venta
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <input
          type="text"
          placeholder="Buscar por cliente..."
          className="w-full border px-3 py-2 rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Lista de ventas */}
      <div className="space-y-4">
        {filteredVentas.length > 0 ? (
          filteredVentas.map((venta) => {
            const cliente = clientes.find((c) => c.id === venta.clienteId);
            return (
              <div
                key={venta.id}
                className="bg-white rounded-lg shadow border p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{cliente?.nombre || "Cliente desconocido"}</p>
                  <p className="text-sm text-gray-500">
                    Total: ${typeof venta.total === "number" ? venta.total.toFixed(2) : "0.00"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(venta.fecha).toLocaleDateString("es-ES")}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => deleteVenta(venta.id)}
                    className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-600">
            No hay ventas registradas
          </p>
        )}
      </div>

      {/* Modal Nueva Venta */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Registrar Nueva Venta</h2>
              <button onClick={() => setIsModalOpen(false)}>✖</button>
            </div>

            <div className="space-y-4">
              {/* Seleccionar cliente */}
              <select
                value={ventaData.clienteId}
                onChange={(e) =>
                  setVentaData({ ...ventaData, clienteId: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Seleccionar cliente</option>
                {Array.isArray(clientes) &&
                  clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </option>
                  ))}
              </select>

              {/* Seleccionar productos */}
              <div className="space-y-2">
                <p className="font-medium">Productos</p>
                {Array.isArray(inventario) && inventario.length > 0 ? (
                  inventario.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center border rounded px-3 py-2"
                    >
                      <div>
                        <p>{item.nombre}</p>
                        <p className="text-xs text-gray-500">
                          ${item.precio} - Stock: {item.stock}
                        </p>
                      </div>
                      <input
                        type="number"
                        min="0"
                        placeholder="Cantidad"
                        className="w-20 border rounded px-2 py-1 text-sm"
                        onChange={(e) => {
                          const cantidad = parseInt(e.target.value, 10) || 0;
                          setVentaData((prev) => {
                            const existingItem = prev.items.find(
                              (i) => i.itemId === item.id
                            );
                            let updatedItems;
                            if (existingItem) {
                              updatedItems = prev.items.map((i) =>
                                i.itemId === item.id
                                  ? { ...i, cantidad }
                                  : i
                              );
                            } else {
                              updatedItems = [
                                ...prev.items,
                                { itemId: item.id, cantidad },
                              ];
                            }
                            return { ...prev, items: updatedItems };
                          });
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">
                    No hay productos disponibles
                  </p>
                )}
              </div>

              {/* Notas */}
              <textarea
                placeholder="Notas adicionales..."
                className="w-full border rounded px-3 py-2"
                value={ventaData.notas}
                onChange={(e) =>
                  setVentaData({ ...ventaData, notas: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleNuevaVenta}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
