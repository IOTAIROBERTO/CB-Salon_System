// src/hooks/useCitas.ts - Versión migrada a Dexie
import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { Cita, Cliente, Servicio } from "../types/citas";

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
  const saveCita = async (formData: any) => {
    if (formData.id) {
      // Modo edición: actualizar cita existente
      await db.citas.update(formData.id, formData);
    } else {
      // Modo creación: nueva cita
      const newCita: Cita = {
        id: `cita_${Date.now()}`,
        ...formData,
        estado: "pendiente",
      };
      await db.citas.add(newCita);
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
    // Si datosCompletos es un array (como se envía desde CobroModal), tomamos el primer elemento
    const info = Array.isArray(datosCompletos) ? datosCompletos[0] : datosCompletos;

    await db.citas.update(citaId, {
      servicioId: info?.servicioSeleccionado || undefined,
      estado: "completada",
      precioFinal,
      metodoPago,
      notas: notas || undefined,
      montoAnticipo: info?.anticipoRecibido || undefined,
      anticipoConfirmado: true,
      serviciosAdicionales: info?.serviciosAdicionales || [],

      descuentoAplicado: info?.descuento || 0,
      subtotalOriginal: info?.subtotalServicios || precioFinal,
      montoDescuento: info?.montoDescuento || 0,
      subtotalConDescuento: info?.subtotalConDescuento || precioFinal,
      montoRedondeo: info?.montoRedondeo || 0,
      propina: info?.propina || 0,

      saldoPendiente: 0,
      fechaCompletada: new Date().toISOString(),
    });

    // Registrar también como venta para el historial de ingresos
    const cita = await db.citas.get(citaId);
    if (cita) {
      await db.ventas.add({
        id: `vnt_cita_${citaId}`,
        fecha: new Date().toISOString(),
        clienteId: cita.clienteId,
        servicioId: cita.servicioId,
        total: precioFinal,
        metodoPago: metodoPago,
        empleadoId: cita.empleadoIds?.[0] // Tomamos el primer empleado para la comisión de venta de producto si aplica, pero aquí es servicio
      });
    }
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