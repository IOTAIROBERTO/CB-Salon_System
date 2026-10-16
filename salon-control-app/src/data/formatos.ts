// Formatos imprimibles del salón, servidos desde public/formatos.
// Para agregar uno: copia el PDF a public/formatos y añade una línea aquí.
// Los originales viven en Drive: CB_CONTROL/04_Formatos y 02_Legal_y_Clientas.
export type GrupoFormato = 'Clientas y legal' | 'Operación' | 'Cursos' | 'Precios';

export interface Formato {
  archivo: string;
  titulo: string;
  descripcion: string;
  grupo: GrupoFormato;
}

export const FORMATOS: Formato[] = [
  { archivo: 'consentimiento-informado.pdf', titulo: 'Consentimiento informado', descripcion: 'Se firma en cada servicio químico. Desde cada cita también se imprime prellenado.', grupo: 'Clientas y legal' },
  { archivo: 'aviso-de-privacidad.pdf', titulo: 'Aviso de privacidad', descripcion: 'Simplificado para tener a la vista e integral para entregar.', grupo: 'Clientas y legal' },
  { archivo: 'tarjeta-de-cuidados.pdf', titulo: 'Tarjeta de cuidados en casa', descripcion: 'Se entrega con cada servicio de color (A6).', grupo: 'Clientas y legal' },
  { archivo: 'ficha-clienta.pdf', titulo: 'Ficha de clienta', descripcion: 'Respaldo en papel de datos, salud e historial.', grupo: 'Clientas y legal' },
  { archivo: 'entrada-proveedores.pdf', titulo: 'Entrada de mercancía', descripcion: 'Registro de cada entrega de proveedor: costo, lote y precio de venta.', grupo: 'Operación' },
  { archivo: 'corte-caja.pdf', titulo: 'Corte de caja diario', descripcion: 'Cuadra efectivo, transferencias y tarjeta contra el sistema.', grupo: 'Operación' },
  { archivo: 'nota-de-venta.pdf', titulo: 'Nota de venta', descripcion: 'Media carta, con anticipo y saldo. No es comprobante fiscal.', grupo: 'Operación' },
  { archivo: 'checklist-apertura-cierre.pdf', titulo: 'Apertura y cierre', descripcion: 'Lista semanal para abrir y cerrar el salón.', grupo: 'Operación' },
  { archivo: 'notas-curso-rayada.pdf', titulo: 'Notas de curso (rayada)', descripcion: 'Hoja de notas con la marca para cursos y capacitaciones.', grupo: 'Cursos' },
  { archivo: 'notas-curso-puntos.pdf', titulo: 'Notas de curso (puntos)', descripcion: 'Cuadrícula de puntos para esquemas y secciones.', grupo: 'Cursos' },
  { archivo: 'ficha-tecnica-color.pdf', titulo: 'Ficha técnica de color', descripcion: 'Diagnóstico, secciones y fórmulas para práctica o servicio.', grupo: 'Cursos' },
  { archivo: 'lista-de-precios-2026.pdf', titulo: 'Lista de precios 2026', descripcion: 'Para exhibir en el salón hasta el 31 de diciembre de 2026.', grupo: 'Precios' },
  { archivo: 'lista-de-precios-2027.pdf', titulo: 'Lista de precios 2027', descripcion: 'Para exhibir desde el 2 de enero de 2027.', grupo: 'Precios' }
];

export const urlFormato = (archivo: string) => new URL(`./formatos/${archivo}`, document.baseURI).href;
