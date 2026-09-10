import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Database, Download, FolderOpen, HardDriveDownload, RotateCcw, ShieldCheck, Tag } from 'lucide-react';
import {
    cambiarLista,
    historicoCargado,
    importarCatalogo,
    importarHistorico,
    listaActiva,
    totalHistorico
} from '../../services/importService';
import {
    descargarRespaldo,
    elegirCarpeta,
    estadoCarpeta,
    leerRespaldo,
    olvidarCarpeta,
    respaldadoHoy,
    respaldarEnCarpeta,
    restaurarRespaldo,
    soportaCarpetaLocal,
    Respaldo
} from '../../services/backupService';

export default function RespaldosTab() {
    const [carpeta, setCarpeta] = useState<string>('');
    const [permiso, setPermiso] = useState<string>('sin-carpeta');
    const [ultimo, setUltimo] = useState<string | undefined>();
    const [mensaje, setMensaje] = useState('');
    const [ocupado, setOcupado] = useState(false);
    const [porRestaurar, setPorRestaurar] = useState<{ archivo: File; datos: Respaldo } | null>(null);
    const inputArchivo = useRef<HTMLInputElement>(null);
    const [lista, setLista] = useState<'2026' | '2027'>('2026');
    const [historico, setHistorico] = useState(0);

    const refrescar = async () => {
        const estado = await estadoCarpeta();
        setCarpeta(estado.carpeta?.name || '');
        setPermiso(estado.permiso);
        setUltimo(estado.ultimo);
        setLista(await listaActiva());
        setHistorico(await historicoCargado());
    };

    useEffect(() => { refrescar(); }, []);

    const avisar = (texto: string) => {
        setMensaje(texto);
        setTimeout(() => setMensaje(''), 5000);
    };

    const conError = async (accion: () => Promise<void>) => {
        setOcupado(true);
        try {
            await accion();
        } catch (e: any) {
            if (e?.name !== 'AbortError') avisar(`Error: ${e?.message || e}`);
        } finally {
            setOcupado(false);
        }
    };

    const handleElegirCarpeta = () => conError(async () => {
        await elegirCarpeta();
        await refrescar();
        const nombre = await respaldarEnCarpeta();
        await refrescar();
        avisar(nombre ? `Carpeta configurada. Primer respaldo: ${nombre}` : 'Carpeta configurada');
    });

    const handleRespaldarAhora = () => conError(async () => {
        const nombre = await respaldarEnCarpeta();
        await refrescar();
        avisar(nombre ? `Respaldo guardado: ${nombre}` : 'No hay carpeta con permiso vigente');
    });

    const handleDescargar = () => conError(async () => {
        avisar(`Descargado: ${await descargarRespaldo()}`);
    });

    const handleArchivoElegido = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;

        conError(async () => {
            setPorRestaurar({ archivo, datos: await leerRespaldo(archivo) });
        });
        e.target.value = '';
    };

    const confirmarRestauracion = () => conError(async () => {
        if (!porRestaurar) return;
        await restaurarRespaldo(porRestaurar.datos);
        setPorRestaurar(null);
        avisar('Respaldo restaurado. Recargando...');
        setTimeout(() => window.location.reload(), 1500);
    });

    const alDia = respaldadoHoy(ultimo);

    return (
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
            <div>
                <h3 className="font-semibold text-lg">Respaldo de datos</h3>
                <p className="text-sm text-gray-600 mt-1">
                    Toda la información vive dentro de este navegador. Si se limpian los datos
                    del sitio o falla el equipo, se pierde sin copia. Elige una carpeta y la app
                    guarda un respaldo diario sola; si esa carpeta es de Drive, OneDrive o
                    Dropbox, la copia además sale de esta computadora.
                </p>
            </div>

            {mensaje && (
                <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg text-sm">{mensaje}</div>
            )}

            {/* Datos del Excel */}
            <div className="border border-gray-200 rounded-lg p-5 space-y-4">
                <div className="flex items-center gap-2">
                    <Database size={18} className="text-purple-600" />
                    <h4 className="font-medium">Datos del salón</h4>
                </div>
                <p className="text-sm text-gray-600">
                    Carga en el punto de venta lo que vivía en el Excel. Se puede volver a
                    cargar cuantas veces quieras: actualiza en vez de duplicar.
                </p>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => conError(async () => {
                            const n = await importarCatalogo(lista);
                            await refrescar();
                            avisar(`Catálogo cargado: ${n} servicios con la lista ${lista}`);
                        })}
                        disabled={ocupado}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 disabled:opacity-50"
                    >
                        <Tag size={18} /> Cargar catálogo de servicios
                    </button>

                    <button
                        onClick={() => conError(async () => {
                            const r = await importarHistorico();
                            await refrescar();
                            avisar(Object.entries(r).map(([k, v]) => `${v} ${k}`).join(' · '));
                        })}
                        disabled={ocupado}
                        className="border-2 border-purple-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-50 disabled:opacity-50"
                    >
                        <Database size={18} />
                        {historico > 0 ? 'Recargar histórico 2024-2026' : 'Cargar histórico 2024-2026'}
                    </button>
                </div>

                {historico > 0 && (
                    <p className="text-xs text-green-700">
                        Histórico ya cargado: {totalHistorico.toLocaleString('es-MX')} servicios
                        cobrados entre 2024 y 2026 aparecen en Reportes.
                    </p>
                )}

                {/* Lista de precios */}
                <div className="pt-4 border-t space-y-2">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                            <p className="text-sm font-medium">
                                Lista de precios activa: <span className="text-purple-700">{lista}</span>
                            </p>
                            <p className="text-xs text-gray-500">
                                {lista === '2026'
                                    ? 'Los precios que cobras hoy. La lista de enero 2027 ya está cargada, sin activar.'
                                    : 'Los precios de enero 2027, un 8% arriba de los de 2026.'}
                            </p>
                        </div>
                        <button
                            onClick={() => conError(async () => {
                                const destino = lista === '2026' ? '2027' : '2026';
                                if (!confirm(
                                    destino === '2027'
                                        ? 'Se aplicarán los precios de enero 2027 a todo el catálogo. ¿Continuar?'
                                        : 'Se regresará el catálogo a los precios de 2026. ¿Continuar?'
                                )) return;
                                const n = await cambiarLista(destino);
                                await refrescar();
                                avisar(`${n} servicios ahora usan la lista ${destino}`);
                            })}
                            disabled={ocupado}
                            className="border-2 border-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
                        >
                            {lista === '2026' ? 'Aplicar lista de enero 2027' : 'Volver a la lista 2026'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Estado */}
            <div className={`p-4 rounded-lg border ${alDia ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                <div className="flex items-center gap-2 font-medium">
                    {alDia ? <ShieldCheck size={18} className="text-green-600" /> : <AlertTriangle size={18} className="text-orange-600" />}
                    {ultimo
                        ? `Último respaldo: ${new Date(ultimo).toLocaleString('es-MX')}`
                        : 'Todavía no se ha hecho ningún respaldo'}
                </div>
                {carpeta && (
                    <p className="text-sm text-gray-600 mt-1">
                        Carpeta: <strong>{carpeta}</strong>
                        {permiso !== 'granted' && ' — permiso caducado, vuelve a elegirla para reactivar el respaldo automático'}
                    </p>
                )}
            </div>

            {/* Carpeta automática */}
            {soportaCarpetaLocal() ? (
                <div className="space-y-3">
                    <h4 className="font-medium">Respaldo automático diario</h4>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={handleElegirCarpeta}
                            disabled={ocupado}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 disabled:opacity-50"
                        >
                            <FolderOpen size={18} /> {carpeta ? 'Cambiar carpeta' : 'Elegir carpeta'}
                        </button>

                        {carpeta && (
                            <>
                                <button
                                    onClick={handleRespaldarAhora}
                                    disabled={ocupado}
                                    className="border-2 border-purple-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-50 disabled:opacity-50"
                                >
                                    <HardDriveDownload size={18} /> Respaldar ahora
                                </button>
                                <button
                                    onClick={() => conError(async () => { await olvidarCarpeta(); await refrescar(); avisar('Carpeta desvinculada'); })}
                                    disabled={ocupado}
                                    className="text-gray-500 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm disabled:opacity-50"
                                >
                                    Desvincular
                                </button>
                            </>
                        )}
                    </div>
                    <p className="text-xs text-gray-500">
                        Se conservan las últimas 30 copias; las más viejas se borran solas.
                    </p>
                </div>
            ) : (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800">
                    Este navegador no permite escribir en una carpeta. Usa Chrome o Edge para el
                    respaldo automático, o descarga el respaldo a mano de forma periódica.
                </div>
            )}

            {/* Manual */}
            <div className="pt-6 border-t space-y-3">
                <h4 className="font-medium">Copia manual</h4>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handleDescargar}
                        disabled={ocupado}
                        className="border-2 border-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50"
                    >
                        <Download size={18} /> Descargar respaldo
                    </button>
                    <button
                        onClick={() => inputArchivo.current?.click()}
                        disabled={ocupado}
                        className="border-2 border-red-200 text-red-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-50 disabled:opacity-50"
                    >
                        <RotateCcw size={18} /> Restaurar desde archivo
                    </button>
                    <input
                        ref={inputArchivo}
                        type="file"
                        accept="application/json,.json"
                        className="hidden"
                        onChange={handleArchivoElegido}
                    />
                </div>
            </div>

            {/* Confirmación de restauración */}
            {porRestaurar && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle size={24} className="text-red-500" />
                            <h2 className="text-lg font-semibold">Restaurar respaldo</h2>
                        </div>

                        <p className="text-gray-700 text-sm">
                            Se reemplazarán <strong>todos</strong> los datos actuales (clientes,
                            citas, ventas, inventario, documentos) por los del respaldo. Esto no
                            se puede deshacer.
                        </p>

                        <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                            <p><strong>Archivo:</strong> {porRestaurar.archivo.name}</p>
                            <p><strong>Fecha del respaldo:</strong> {new Date(porRestaurar.datos.fecha).toLocaleString('es-MX')}</p>
                        </div>

                        <p className="text-xs text-orange-600">
                            Si los datos de ahora te sirven, descarga primero un respaldo actual.
                        </p>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setPorRestaurar(null)}
                                className="px-4 py-2 border rounded hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarRestauracion}
                                disabled={ocupado}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                            >
                                Sí, reemplazar todo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
