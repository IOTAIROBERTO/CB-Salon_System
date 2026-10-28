// Listas de precios por año. La lista activa son los precios del Catálogo
// (precioSugerido y anticipoSugerido de cada servicio) y se edita ahí mismo.
// Las de años anteriores quedan guardadas como foto fija, de solo lectura,
// para consulta. Al empezar un año nuevo, «Abrir lista 2028» guarda la lista
// activa como histórica y deja los mismos precios listos para ajustar.

export interface RenglonLista {
  nombre: string;
  categoria?: string;
  precio: number | string; // texto en listas viejas: «2,000 a 2,500», «Valoración»
  anticipo: number | string;
}

export interface ListaHistorica {
  anio: string;
  cerrada?: string; // ISO: cuándo dejó de ser la activa
  nota?: string;
  renglones: RenglonLista[];
}

export interface ListasPrecios {
  activa: string;              // «2027»
  historicas: ListaHistorica[]; // de la más reciente a la más vieja
}

interface ServicioP { nombre: string; categoria?: string; precioSugerido: number; anticipoSugerido: number; archivado?: boolean }

export const CATEGORIAS: Record<string, string> = {
  corte: 'Corte', tratamiento: 'Tratamiento', color: 'Color', peinado: 'Peinado', maquillaje: 'Maquillaje'
};
export const nombreCategoria = (c?: string) => (c && (CATEGORIAS[c] ?? c.charAt(0).toUpperCase() + c.slice(1))) || '';

/** Foto fija de la lista activa (sin servicios archivados) */
export const fotoLista = (servicios: ServicioP[], anio: string, cerrada = new Date().toISOString()): ListaHistorica => ({
  anio,
  cerrada,
  renglones: servicios
    .filter(s => !s.archivado)
    .map(s => ({ nombre: s.nombre, categoria: nombreCategoria(s.categoria), precio: s.precioSugerido, anticipo: s.anticipoSugerido }))
});

/** Abre la lista del año siguiente: la activa pasa a histórica */
export const abrirLista = (listas: ListasPrecios, servicios: ServicioP[], nuevoAnio: string): ListasPrecios => {
  if (!/^\d{4}$/.test(nuevoAnio) || Number(nuevoAnio) <= Number(listas.activa)) throw new Error('El año nuevo debe ser posterior a la lista activa');
  return {
    activa: nuevoAnio,
    historicas: [fotoLista(servicios, listas.activa), ...listas.historicas.filter(h => h.anio !== listas.activa)]
  };
};

export const formatoPrecio = (v: number | string) =>
  typeof v === 'number' ? (v ? `$${v.toLocaleString('es-MX')}` : '—') : v;
