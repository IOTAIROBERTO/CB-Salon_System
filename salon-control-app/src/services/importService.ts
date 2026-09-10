// src/services/importService.ts
//
// Carga en el punto de venta los datos que vivían en el Excel del salón.
// Todo entra con `bulkPut` y con id fijo, así que volver a importar corrige
// lo que haga falta sin duplicar nada.
import { db } from '../db/db';
import catalogo from '../data/servicios_dataset.json';
import historico from '../data/historico.json';

export interface ResultadoImport {
    [tabla: string]: number;
}

const servicioDesdeJson = (s: any, lista: '2026' | '2027') => ({
    id: s.id,
    nombre: s.nombre,
    categoria: s.categoria,
    duracion: s.duracion,
    descripcion: s.descripcion || undefined,
    precioSugerido: lista === '2027' ? s.precio2027 : s.precioActualizado,
    anticipoSugerido: lista === '2027' ? s.anticipo2027 : s.anticipo,
    // Las dos listas viajan con el servicio para poder cambiar de una a otra
    // sin volver a importar.
    precio2026: s.precioActualizado,
    anticipo2026: s.anticipo,
    precio2027: s.precio2027,
    anticipo2027: s.anticipo2027
});

/** Qué lista de precios está activa hoy. */
export const listaActiva = async (): Promise<'2026' | '2027'> => {
    const settings: any = await db.configuracion.get('settings');
    return settings?.listaPrecios === '2027' ? '2027' : '2026';
};

const guardarLista = async (lista: '2026' | '2027') => {
    const settings = await db.configuracion.get('settings');
    await db.configuracion.put({ ...(settings as any), id: 'settings', listaPrecios: lista });
};

/** Carga o actualiza los servicios del catálogo con la lista indicada. */
export const importarCatalogo = async (lista: '2026' | '2027' = '2026'): Promise<number> => {
    const servicios = (catalogo as any[]).map(s => servicioDesdeJson(s, lista));
    await db.servicios.bulkPut(servicios as any);
    await guardarLista(lista);
    return servicios.length;
};

/**
 * Cambia el precio de los servicios a la otra lista sin tocar los que hayas
 * creado a mano ni los que hayas editado fuera del catálogo del Excel.
 */
export const cambiarLista = async (lista: '2026' | '2027'): Promise<number> => {
    const enCatalogo = await db.servicios.toArray();
    const cambiados = enCatalogo
        .filter((s: any) => s.precio2027 !== undefined && s.precio2026 !== undefined)
        .map((s: any) => ({
            ...s,
            precioSugerido: lista === '2027' ? s.precio2027 : s.precio2026,
            anticipoSugerido: lista === '2027' ? s.anticipo2027 : s.anticipo2026
        }));

    if (cambiados.length > 0) await db.servicios.bulkPut(cambiados);
    await guardarLista(lista);
    return cambiados.length;
};

/**
 * Carga el histórico de 2024 a 2026: 965 servicios cobrados, las ventas de
 * producto de 2025, el inventario y los gastos. Las citas entran como
 * completadas para que Reportes muestre los tres años.
 */
export const importarHistorico = async (): Promise<ResultadoImport> => {
    const h = historico as any;

    await db.clientes.put(h.clienteHistorico);
    await db.citas.bulkPut(h.citas);
    await db.ventas.bulkPut(h.ventas);
    await db.inventario.bulkPut(h.inventario);

    // `gastos` usa clave autoincremental: se les fija un id alto y propio para
    // que reimportar no los duplique.
    await db.gastos.bulkPut(
        h.gastos.map((g: any, i: number) => ({ ...g, id: 9000 + i }))
    );

    return {
        'servicios cobrados': h.citas.length,
        'ventas de producto': h.ventas.length,
        'productos de inventario': h.inventario.length,
        'gastos': h.gastos.length
    };
};

/** Cuántos registros del histórico ya están cargados. */
export const historicoCargado = async (): Promise<number> => {
    const h = historico as any;
    const ids = h.citas.slice(0, 50).map((c: any) => c.id);
    const encontradas = await db.citas.bulkGet(ids);
    return encontradas.filter(Boolean).length;
};

export const totalHistorico = (historico as any).citas.length as number;
