// src/hooks/useCitas.ts - Versión migrada a Dexie con Google Calendar Sync
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { Cita, Cliente } from "../types/citas";
import { googleCalendarService } from "../services/googleCalendar";

export default function useCitas() {
  const [modalState, setModalState] = useState<{ type: string; data?: Cita | null }>({
    type: "",
    data: null,
  });

  // --- Lógica de Real-time con Dexie ---
  const citas = useLiveQuery(() => db.citas.toArray()) || [];
  const clientes = useLiveQuery(() => db.clientes.toArray().then(arr => arr.filter(c => c.activo !== false) as unknown as Cliente[])) || [];
  const servicios = useLiveQuery(() => db.servicios.toArray()) || [];

  // --- Helpers ---
  const syncCitaToGoogle = async (citaId: string) => {
    try {
      if (!googleCalendarService.getSignInStatus()) return;

      const cita = await db.citas.get(citaId);
      if (!cita) return;

      const cliente = await db.clientes.get(cita.clienteId);
      const servicio = await db.servicios.get(cita.servicioId);
      if (!cliente || !servicio) return;

      let calendarId = 'primary';
      if (cita.empleadoIds && cita.empleadoIds.length > 0) {
        const emp = await db.empleados.get(cita.empleadoIds[0]);
        if (emp?.googleCalendarId) {
          calendarId = emp.googleCalendarId;
        }
      }

      const event = googleCalendarService.citaToCalendarEvent(cita, cliente, servicio);

      if (cita.googleEventId) {
        await googleCalendarService.updateEvent(cita.googleEventId, event, calendarId);
      } else {
        const eventId = await googleCalendarService.createEvent(event, calendarId);
        if (eventId) {
          await db.citas.update(citaId, { googleEventId: eventId });
        }
      }
    } catch (e) {
      console.error('Failed to sync with Google Calendar:', e);
    }
  };

  // --- CRUD ---
  const saveCita = async (formData: any) => {
    if (formData.id) {
      await db.citas.update(formData.id, formData);
      await syncCitaToGoogle(formData.id);
    } else {
      const id = `cita_${Date.now()}`;
      const newCita: any = {
        id,
        ...formData,
        estado: "pendiente",
      };
      await db.citas.add(newCita);
      await syncCitaToGoogle(id);
    }
  };

  const deleteCita = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
      return false;
    }
    const cita = await db.citas.get(id);
    if (cita?.googleEventId && googleCalendarService.getSignInStatus()) {
      let calendarId = 'primary';
      if (cita.empleadoIds && cita.empleadoIds.length > 0) {
        const emp = await db.empleados.get(cita.empleadoIds[0]);
        if (emp?.googleCalendarId) calendarId = emp.googleCalendarId;
      }
      await googleCalendarService.deleteEvent(cita.googleEventId, calendarId);
    }
    await db.citas.delete(id);
    return true;
  };

  const changeEstadoCita = async (id: string, newEstado: Cita["estado"]) => {
    await db.citas.update(id, { estado: newEstado });
    await syncCitaToGoogle(id);
  };

  const updateAnticipo = async (id: string, anticipoConfirmado: boolean, monto?: number) => {
    await db.citas.update(id, {
      anticipoConfirmado,
      montoAnticipo: monto || 0
    });
    await syncCitaToGoogle(id);
  };

  const completarCita = async (citaId: string, precioFinal: number, metodoPago: string, notas: string, datosCompletos?: any) => {
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
      subtotalOriginal: info?.subtotalServicios ?? precioFinal,
      montoDescuento: info?.montoDescuento || 0,
      // `??` y no `||`: con 100% de descuento el subtotal es 0 y `||` lo
      // reemplazaba por precioFinal, inflando la base de comisión.
      subtotalConDescuento: info?.subtotalConDescuento ?? precioFinal,
      montoRedondeo: info?.montoRedondeo || 0,
      propina: info?.propina || 0,
      saldoPendiente: 0,
      fechaCompletada: new Date().toISOString(),
    });

    await syncCitaToGoogle(citaId);

    // No se registra una venta espejo: la cita completada ya es el registro
    // del ingreso. Duplicarla contaba dos veces el ingreso en Reportes y la
    // comisión del empleado en Empleados.
  };

  const reagendarCita = async (citaId: string, nuevaFecha: string, nuevaHora: string) => {
    await db.citas.update(citaId, { fecha: nuevaFecha, hora: nuevaHora });
    await syncCitaToGoogle(citaId);
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