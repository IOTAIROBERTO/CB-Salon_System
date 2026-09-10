// src/services/backupService.ts
//
// Respaldo local de toda la aplicación. La base vive en IndexedDB, que el
// navegador puede desalojar (limpiar datos, modo incógnito, presión de disco)
// y que existe solo en esta máquina. Sin una copia fuera del navegador, un
// borrado del sitio se lleva clientes, citas, ventas y documentos.
import { exportDB, importInto } from 'dexie-export-import';
import { db } from '../db/db';

const PREFIJO = 'respaldo-salon-';
const COPIAS_A_CONSERVAR = 30;

export interface Respaldo {
    app: 'salon-control-app';
    version: 1;
    fecha: string;
    dexie: any;          // export nativo de Dexie (incluye Blobs de Documentos)
    localStorage: Record<string, string>;
}

export const soportaCarpetaLocal = (): boolean => 'showDirectoryPicker' in window;

const nombreArchivo = (fecha = new Date()): string =>
    `${PREFIJO}${fecha.toISOString().split('T')[0]}.json`;

/**
 * Pide al navegador no desalojar la base. Sin esto, IndexedDB es "best effort"
 * y puede borrarse sin aviso cuando falta espacio.
 */
export const pedirAlmacenamientoPersistente = async (): Promise<boolean> => {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
};

/** Snapshot completo: todas las tablas de Dexie + todo localStorage. */
export const crearRespaldo = async (): Promise<Respaldo> => {
    const blob = await exportDB(db);

    // localStorage va incluido porque todavía guarda cosas que no están en
    // Dexie (movimientos de stock, configuración de email heredada).
    const local: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
        const clave = localStorage.key(i);
        if (clave) local[clave] = localStorage.getItem(clave) ?? '';
    }

    return {
        app: 'salon-control-app',
        version: 1,
        fecha: new Date().toISOString(),
        dexie: JSON.parse(await blob.text()),
        localStorage: local
    };
};

/** Descarga manual: el respaldo va a la carpeta de descargas. */
export const descargarRespaldo = async (): Promise<string> => {
    const respaldo = await crearRespaldo();
    const url = URL.createObjectURL(
        new Blob([JSON.stringify(respaldo)], { type: 'application/json' })
    );

    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo();
    a.click();
    URL.revokeObjectURL(url);

    return a.download;
};

/**
 * Elige la carpeta destino. Requiere un gesto del usuario, así que solo puede
 * llamarse desde un onClick. Si eliges una carpeta sincronizada (Drive,
 * OneDrive, Dropbox) el respaldo sale de la máquina sin costo extra.
 */
export const elegirCarpeta = async (): Promise<FileSystemDirectoryHandle> => {
    const carpeta = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
    const settings = await db.configuracion.get('settings');
    await db.configuracion.put({ ...(settings as any), id: 'settings', respaldoCarpeta: carpeta });
    return carpeta;
};

export const olvidarCarpeta = async (): Promise<void> => {
    const settings = await db.configuracion.get('settings');
    if (!settings) return;
    await db.configuracion.put({ ...(settings as any), respaldoCarpeta: undefined });
};

type EstadoPermiso = 'granted' | 'prompt' | 'denied' | 'sin-carpeta';

export const estadoCarpeta = async (): Promise<{
    carpeta?: FileSystemDirectoryHandle;
    permiso: EstadoPermiso;
    ultimo?: string;
}> => {
    const settings: any = await db.configuracion.get('settings');
    const carpeta: FileSystemDirectoryHandle | undefined = settings?.respaldoCarpeta;

    if (!carpeta) return { permiso: 'sin-carpeta', ultimo: settings?.respaldoUltimo };

    const permiso = await (carpeta as any).queryPermission({ mode: 'readwrite' });
    return { carpeta, permiso, ultimo: settings?.respaldoUltimo };
};

/**
 * Escribe el respaldo del día en la carpeta elegida y conserva las últimas
 * COPIAS_A_CONSERVAR. Devuelve el nombre del archivo, o null si no había
 * carpeta o el permiso ya no está vigente.
 */
export const respaldarEnCarpeta = async (): Promise<string | null> => {
    const { carpeta, permiso } = await estadoCarpeta();
    if (!carpeta || permiso !== 'granted') return null;

    const respaldo = await crearRespaldo();
    const nombre = nombreArchivo();

    const archivo = await carpeta.getFileHandle(nombre, { create: true });
    const escritor = await archivo.createWritable();
    await escritor.write(JSON.stringify(respaldo));
    await escritor.close();

    await rotarCopias(carpeta);

    const settings = await db.configuracion.get('settings');
    await db.configuracion.put({
        ...(settings as any),
        id: 'settings',
        respaldoUltimo: respaldo.fecha
    });

    return nombre;
};

/** Borra las copias más viejas. Solo toca archivos con nuestro prefijo. */
const rotarCopias = async (carpeta: FileSystemDirectoryHandle): Promise<void> => {
    const nombres: string[] = [];
    for await (const [nombre, handle] of (carpeta as any).entries()) {
        if (handle.kind === 'file' && nombre.startsWith(PREFIJO) && nombre.endsWith('.json')) {
            nombres.push(nombre);
        }
    }

    // El nombre lleva la fecha en ISO, así que el orden alfabético es cronológico.
    nombres.sort();
    for (const viejo of nombres.slice(0, Math.max(0, nombres.length - COPIAS_A_CONSERVAR))) {
        await carpeta.removeEntry(viejo);
    }
};

/** ¿Ya se respaldó hoy? */
export const respaldadoHoy = (ultimo?: string): boolean =>
    !!ultimo && ultimo.split('T')[0] === new Date().toISOString().split('T')[0];

/**
 * Respaldo diario automático. No hace nada si no hay carpeta, si el permiso
 * caducó o si ya se respaldó hoy.
 */
export const respaldoAutomatico = async (): Promise<string | null> => {
    const { permiso, ultimo } = await estadoCarpeta();
    if (permiso !== 'granted' || respaldadoHoy(ultimo)) return null;
    return await respaldarEnCarpeta();
};

export const leerRespaldo = async (archivo: File): Promise<Respaldo> => {
    const datos = JSON.parse(await archivo.text());

    if (datos?.app !== 'salon-control-app' || !datos.dexie) {
        throw new Error('El archivo no es un respaldo de Salon Total Control');
    }

    return datos as Respaldo;
};

/**
 * DESTRUCTIVO: reemplaza el contenido actual por el del respaldo. Quien llama
 * es responsable de confirmarlo con el usuario antes.
 */
export const restaurarRespaldo = async (respaldo: Respaldo): Promise<void> => {
    await importInto(db, new Blob([JSON.stringify(respaldo.dexie)]), {
        clearTablesBeforeImport: true,
        overwriteValues: true,
        acceptVersionDiff: true,
        acceptMissingTables: true,
        acceptNameDiff: false
    });

    // La carpeta de respaldo es de esta instalación, no del archivo: se
    // conserva la actual para no perder el destino al restaurar.
    const { carpeta } = await estadoCarpeta();
    if (carpeta) {
        const settings = await db.configuracion.get('settings');
        await db.configuracion.put({ ...(settings as any), id: 'settings', respaldoCarpeta: carpeta });
    }

    if (respaldo.localStorage) {
        for (const [clave, valor] of Object.entries(respaldo.localStorage)) {
            localStorage.setItem(clave, valor);
        }
    }
};
