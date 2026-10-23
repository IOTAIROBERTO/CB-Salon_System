import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Lock } from 'lucide-react';
import { db } from '../db/db';
import { useCatalogo } from '../hooks/useCatalogo';
import { useServicioModal } from '../hooks/useServicioModal';
import AddServiceButton from '../components/catalogo/AddServiceButton';
import ServiciosTable from '../components/catalogo/ServiciosTable';
import ServicioModal from '../components/catalogo/ServicioModal';
import CotizadorTraslado from '../components/catalogo/CotizadorTraslado';
import { abrirNuevaLista, listasDe } from '../db/catalogo';
import { formatoPrecio } from '../utils/precios';

export default function CatalogoPreciosPage() {
  const { servicios, addServicio, updateServicio, deleteServicio } = useCatalogo();
  const settings = useLiveQuery(() => db.configuracion.get('settings'));
  const listas = listasDe(settings);
  const [pestana, setPestana] = useState<string | null>(null); // null = lista activa
  const historica = listas.historicas.find(h => h.anio === pestana);
  const activos = servicios.filter(s => !(s as any).archivado);
  const siguiente = String(Number(listas.activa) + 1);

  const {
    isModalOpen,
    editingServicio,
    formData,
    openCreateModal,
    openEditModal,
    closeModal,
    updateFormData
  } = useServicioModal();

  const abrirSiguiente = async () => {
    if (!confirm(
      `La lista ${listas.activa} quedará guardada como histórica, de solo consulta, y se abrirá la lista ${siguiente} con los mismos precios para que los ajustes. ¿Continuar?`
    )) return;
    try {
      await abrirNuevaLista(siguiente);
      setPestana(null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const pestanaClase = (activa: boolean) =>
    `px-4 py-2 rounded-t-lg border-b-2 text-sm font-medium whitespace-nowrap ${activa ? 'border-purple-600 text-purple-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-800'}`;

  return (
    <div className="w-full max-w-none space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-bold text-gray-900">Catálogo y listas de precios</h1>
          <p className="text-gray-600 mt-1">
            La lista {listas.activa} es la que se cobra y se edita aquí; las de años anteriores quedan de consulta.
          </p>
        </div>
        {!historica && <AddServiceButton onAdd={openCreateModal} />}
      </div>

      <div className="flex items-end gap-1 border-b overflow-x-auto">
        <button className={pestanaClase(!historica)} onClick={() => setPestana(null)}>
          Lista {listas.activa} · activa
        </button>
        {listas.historicas.map(h => (
          <button key={h.anio} className={pestanaClase(pestana === h.anio)} onClick={() => setPestana(h.anio)}>
            <Lock size={12} className="inline mr-1 -mt-0.5" />{h.anio}
          </button>
        ))}
        <button onClick={abrirSiguiente} className="ml-auto mb-1 text-xs text-purple-700 border border-purple-200 rounded-lg px-3 py-1.5 hover:bg-purple-50 whitespace-nowrap">
          Abrir lista {siguiente}
        </button>
      </div>

      {historica ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 bg-gray-50 text-sm text-gray-600 flex items-start gap-2">
            <Lock size={16} className="mt-0.5 shrink-0" />
            <span>
              Lista {historica.anio}, solo de consulta.{historica.nota ? ` ${historica.nota}` : ''}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-3 font-semibold text-gray-900">Servicio</th>
                <th className="p-3 font-semibold text-gray-900">Categoría</th>
                <th className="p-3 font-semibold text-gray-900">Precio</th>
                <th className="p-3 font-semibold text-gray-900">Anticipo</th>
              </tr>
            </thead>
            <tbody>
              {historica.renglones.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="p-3">{r.nombre}</td>
                  <td className="p-3 text-gray-500">{r.categoria || ''}</td>
                  <td className="p-3">{formatoPrecio(r.precio)}</td>
                  <td className="p-3 text-gray-600">{formatoPrecio(r.anticipo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          {/* Servicios fuera de Hermosillo: zonas editables y cotizador */}
          <CotizadorTraslado servicios={activos} />

          <ServiciosTable servicios={activos} onEdit={openEditModal} onDelete={deleteServicio} />
        </>
      )}

      <ServicioModal
        isOpen={isModalOpen}
        editingServicio={editingServicio}
        formData={formData}
        updateFormData={updateFormData}
        onSave={addServicio}
        onUpdate={updateServicio}
        onClose={closeModal}
      />
    </div>
  );
}
