// Formatos imprimibles del salón, servidos desde public/formatos.
// Para agregar uno: copia el PDF a public/formatos y añade una línea aquí.
// Los originales viven en Drive: CB_CONTROL/04_Formatos y 02_Legal_y_Clientas.
export type GrupoFormato = 'Clientas y legal' | 'Operación' | 'Equipo' | 'Precios';

export interface Formato {
  archivo: string;
  titulo: string;
  descripcion: string;
  grupo: GrupoFormato;
}

export const FORMATOS: Formato[] = [
  { archivo: 'consentimiento-informado.pdf', titulo: 'Consentimiento informado', descripcion: 'Se firma en cada servicio químico; incluye los permisos de fotos. Desde cada cita se imprime prellenado y la foto del firmado se guarda en la ficha de la clienta.', grupo: 'Clientas y legal' },
  { archivo: 'autorizacion-de-imagen.pdf', titulo: 'Autorización de uso de imagen', descripcion: 'Para modelos, sesiones de fotos y clientas que salen en redes.', grupo: 'Clientas y legal' },
  { archivo: 'aviso-de-privacidad.pdf', titulo: 'Aviso de privacidad', descripcion: 'Simplificado para tener a la vista e integral para entregar.', grupo: 'Clientas y legal' },
  { archivo: 'tarjeta-de-cuidados.pdf', titulo: 'Tarjeta de cuidados en casa', descripcion: 'Se entrega con cada servicio de color (A6).', grupo: 'Clientas y legal' },
  { archivo: 'ficha-clienta.pdf', titulo: 'Ficha de clienta', descripcion: 'Respaldo en papel de datos, salud e historial.', grupo: 'Clientas y legal' },
  { archivo: 'entrada-proveedores.pdf', titulo: 'Entrada de mercancía', descripcion: 'Registro de cada entrega de proveedor: costo, lote y precio de venta.', grupo: 'Operación' },
  { archivo: 'corte-caja.pdf', titulo: 'Corte de caja diario', descripcion: 'Cuadra efectivo, transferencias y tarjeta contra el sistema.', grupo: 'Operación' },
  { archivo: 'nota-de-venta.pdf', titulo: 'Nota de venta', descripcion: 'Media carta, con anticipo y saldo. No es comprobante fiscal.', grupo: 'Operación' },
  { archivo: 'checklist-apertura-cierre.pdf', titulo: 'Apertura y cierre', descripcion: 'Lista semanal para abrir y cerrar el salón.', grupo: 'Operación' },
  { archivo: 'tiempos-por-servicio.pdf', titulo: 'Tiempos por servicio', descripcion: 'Cristina anota el tiempo real por largo de cabello; luego se ajusta en Catálogo para que la agenda ofrezca horarios correctos.', grupo: 'Operación' },
  { archivo: 'acuerdo-por-horas.pdf', titulo: 'Acuerdo de colaboración por horas', descripcion: 'Pago por hora, bonos y cláusula de confidencialidad. Revisar con contador o abogado antes de usar.', grupo: 'Equipo' },
  { archivo: 'registro-de-horas.pdf', titulo: 'Registro de horas', descripcion: 'Una hoja por semana con entrada, salida y citas apoyadas; respalda el pago.', grupo: 'Equipo' },
  { archivo: 'recibo-de-pago.pdf', titulo: 'Recibo de pago', descripcion: 'En blanco. Desde Empleados también se imprime ya calculado.', grupo: 'Equipo' },
  { archivo: 'notas-curso-rayada.pdf', titulo: 'Notas de capacitación (rayada)', descripcion: 'Hoja de notas para la capacitación semanal y los cursos de Cristina.', grupo: 'Equipo' },
  { archivo: 'notas-curso-puntos.pdf', titulo: 'Notas de capacitación (puntos)', descripcion: 'Cuadrícula de puntos para esquemas y secciones.', grupo: 'Equipo' },
  { archivo: 'ficha-tecnica-color.pdf', titulo: 'Ficha técnica de color', descripcion: 'Diagnóstico, secciones y fórmulas para práctica o servicio.', grupo: 'Equipo' },
  { archivo: 'lista-de-precios-2027.pdf', titulo: 'Lista de precios vigente', descripcion: 'Precios 2027 con las políticas del salón, para exhibir (PROFECO).', grupo: 'Precios' }
];

export const urlFormato = (archivo: string) => new URL(`./formatos/${archivo}`, document.baseURI).href;
