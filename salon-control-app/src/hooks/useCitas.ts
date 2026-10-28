// src/hooks/useCitas.ts - Citas en Dexie. Google Calendar se actualiza solo desde el servidor
// (Worker cb-avisos copia las citas cada minuto), no desde aquí.
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { type Cita, type Cliente } from "../types/citas";

export default function useCitas() {
  const [modalState, setModalState] = useState<{ type: string; data?: Cita | null }>({
    type: "",
    data: null,
  });

  // --- Lógica de Real-time con Dexie ---
  const citas = useLiveQuery(() => db.citas.toArray()) || [];
  const clientes = useLiveQuery(() => db.clientes.toArray().then(arr => arr.filter(c => c.activo !== false) as unknown as Cliente[])) || [];
  const servicios = useLiveQuery(() => db.servicios.toArray()) || [];

  // --- CRUD ---
  /** Guarda la cita y devuelve su id */
  const saveCita = async (formData: any): Promise<string> => {
    if (formData.id) {
      await db.citas.update(formData.id, formData);
      return formData.id;
    } else {
      const id = `cita_${Date.now()}`;
      const newCita: any = {
        id,
        ...formData,
        estado: formData.estado || "pendiente",   // las que vienen de Google ya estaban acordadas: confirmadas
      };
      await db.citas.add(newCita);
      return id;
    }
  };

  const deleteCita = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
      return false;
    }
    await db.citas.delete(id);
    return true;
  };

  const changeEstadoCita = async (id: string, newEstado: Cita["estado"]) => {
    await db.citas.update(id, { estado: newEstado });
  };

  const updateAnticipo = async (id: string, anticipoConfirmado: boolean, monto?: number) => {
    await db.citas.update(id, {
      anticipoConfirmado,
      montoAnticipo: monto || 0
    });
  };

  const completarCita = async (citaId: string, precioFinal: number, metodoPago: string, notas: string, datosCompletos?: any) => {
    const info = Array.isArray(datosCompletos) ? datosCompletos[0] : datosCompletos;
    // Conserva las notas de la cita y agrega las del cobro (antes se sobrescribían)
    const notasPrevias = (await db.citas.get(citaId))?.notas;
    const notasFinales = [notasPrevias, notas].filter(Boolean).join('\n');

    await db.citas.update(citaId, {
      servicioId: info?.servicioSeleccionado || undefined,
      estado: "completada",
      precioFinal,
      metodoPago,
      notas: notasFinales || undefined,
      montoAnticipo: info?.anticipoRecibido || undefined,
      anticipoConfirmado: true,
      serviciosAdicionales: info?.serviciosAdicionales || [],
      descuentoAplicado: info?.descuento || 0,
      subtotalOriginal: info?.subtotalServicios ?? precioFinal,
      montoDescuento: info?.montoDescuento || 0,
      // `??` y no `||`: con 100% de descuento el subtotal es 0 y `||` lo
      // reemplazaba por precioFinal, inflando la base de comisión.
      subtotalConDescuento: info?.subtotalConDescuento ?? precioFinal,
      montoRedondeo: info?.montoRedondeo || 0,
      propina: info?.propina || 0,
      pagadoConSaldo: info?.pagadoConSaldo || undefined,
      saldoPendiente: 0,
      fechaCompletada: new Date().toISOString(),
      ...(info?.descripcionTrabajo !== undefined && { descripcionTrabajo: info.descripcionTrabajo.trim() || undefined }),
    });

    // No se registra una venta espejo: la cita completada ya es el registro
    // del ingreso. Duplicarla contaba dos veces el ingreso en Reportes y la
    // comisión del empleado en Empleados.
  };

  const reagendarCita = async (citaId: string, nuevaFecha: string, nuevaHora: string) => {
    await db.citas.update(citaId, { fecha: nuevaFecha, hora: nuevaHora });
  };

  const openModal = (type: string, data: Cita | null = null) =>
    setModalState({ type, data });

  const closeModal = () => setModalState({ type: "", data: null });

  return {
    citas,
    clientes,
    servicios,
    saveCita,
    completarCita,
    reagendarCita,
    deleteCita,
    changeEstadoCita,
    updateAnticipo,
    openModal,
    closeModal,
    modalState,
  };
}