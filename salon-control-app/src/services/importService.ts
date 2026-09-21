// src/services/importService.ts
//
// Carga en el punto de venta los datos que vivían en el Excel del salón.
//
// El catálogo sí viaja dentro de la app: son los precios, que de todos modos
// van en la lista pública. El histórico NO: son tres años de ventas y gastos,
// y cualquiera puede descargar el código de un sitio publicado. Por eso se
// importa desde un archivo que tú eliges, y ese archivo vive fuera del
// repositorio.
import { db } from '../db/db';
import catalogo from '../data/servicios_dataset.json';

export interface ResultadoImport {
    [tabla: string]: number;
}

/** Forma del archivo que genera el script de extracción del Excel. */
export interface ArchivoHistorico {
    version: number;
    generado: string;
    clienteHistorico: any;
    citas: any[];
    ventas: any[];
    inventario: any[];
    gastos: any[];
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

/** Abre y valida el archivo del histórico. */
export const leerArchivoHistorico = async (archivo: File): Promise<ArchivoHistorico> => {
    const datos = JSON.parse(await archivo.text());

    if (!Array.isArray(datos?.citas) || !datos?.clienteHistorico) {
        throw new Error('El archivo no es el histórico del salón');
    }

    return datos as ArchivoHistorico;
};

/**
 * Carga el histórico de 2024 a 2026: los servicios cobrados, las ventas de
 * producto, el inventario y los gastos. Las citas entran como completadas para
 * que Reportes muestre los tres años. Todo con id fijo: volver a importar
 * actualiza, no duplica.
 */
export const importarHistorico = async (h: ArchivoHistorico): Promise<ResultadoImport> => {
    await db.clientes.put(h.clienteHistorico);
    await db.citas.bulkPut(h.citas);
    await db.ventas.bulkPut(h.ventas || []);
    await db.inventario.bulkPut(h.inventario || []);

    // `gastos` usa clave autoincremental: se les fija un id alto y propio para
    // que reimportar no los duplique.
    await db.gastos.bulkPut(
        (h.gastos || []).map((g: any, i: number) => ({ ...g, id: 9000 + i }))
    );

    return {
        'servicios cobrados': h.citas.length,
        'ventas de producto': (h.ventas || []).length,
        'productos de inventario': (h.inventario || []).length,
        'gastos': (h.gastos || []).length
    };
};

/**
 * Cuántos servicios del histórico ya están cargados. Los ids del histórico
 * empiezan con `h` y el año, y el id es la clave primaria, así que la cuenta
 * no recorre la tabla entera.
 */
export const historicoCargado = async (): Promise<number> => {
    try {
        return await db.citas.where('id').startsWith('h20').count();
    } catch {
        return 0;
    }
};
