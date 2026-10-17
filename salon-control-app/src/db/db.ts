import Dexie, { Table } from 'dexie';
import dexieCloud from 'dexie-cloud-addon';

// URL pública de la base (dexie-cloud.json). La clave secreta vive en dexie-cloud.key, fuera de git.
export const DEXIE_CLOUD_URL = 'https://zt3tyd7cy.dexie.cloud';
import { CampaignType } from '../types/email';
import type { Canje } from '../utils/lealtad';
import type { Ubicacion } from '../data/datosSalon';
import type { ConfigAgenda } from '../utils/agenda';

// Interfaces for new tables
export interface Expense {
    id?: string;
    concepto: string; // "Renta", "Luz", etc.
    monto: number;
    fecha: string;
    categoria: 'fijo' | 'variable';
    pagado: boolean;
    notas?: string;
}

export interface Empleado {
    id: string;
    nombre: string;
    especialidad?: string;
    telefono?: string;
    email?: string;
    porcentajeComision: number; // 0-100
    activo: boolean;
    fechaContratacion: string;
    cumple?: string; // YYYY-MM-DD
    googleCalendarId?: string; // Specific calendar ID for this employee
    tomaCitas?: boolean; // Aparece en la agenda con horarios propios
    categoriasAgenda?: string[]; // Categorías de servicio que atiende (vacío = todas)
}

export interface EmpleadoEvent {
    id?: string;
    empleadoId: string;
    tipo: 'vacaciones' | 'dia_inhabit' | 'horario_especial' | 'apoyo';
    fechaInicio: string;
    fechaFin: string;
    descripcion?: string;
    googleEventId?: string;
}

export interface SalonDocument {
    id?: string;
    titulo: string;
    tipo: 'contrato' | 'imagen' | 'otro';
    fechaCreacion: string;
    contenido?: Blob; // For file storage
    texto?: string;   // For text notes
}

export interface AppSettings {
    id?: string; // singleton 'settings'
    nombreSalon: string;
    direccion: string;
    telefono: string;
    email: string;
    tipoCambioUSD: number; // For Currency Feature
    emailConfig?: {
        serviceId: string;
        templateId: string;
        publicKey: string;
    };
    googleCredentials?: {
        clientId: string;
        apiKey: string;
    };
    // Respaldo automático: carpeta elegida por el usuario (el handle se guarda
    // tal cual, IndexedDB lo clona) y fecha ISO del último respaldo escrito.
    respaldoCarpeta?: FileSystemDirectoryHandle;
    respaldoUltimo?: string;
    // Qué lista de precios está activa: la de 2026 o la de enero de 2027.
    listaPrecios?: '2026' | '2027';
    agenda?: ConfigAgenda; // Horario, margen, bloqueos (utils/agenda)
}

export interface Cliente {
    id: string;
    nombre: string;
    email?: string;
    telefono: string;
    cumple?: string; // YYYY-MM-DD
    comentarios?: string;
    posibleBaja?: boolean;
    activo?: boolean;
    fechaRegistro?: string;
    // Círculo CB (programa de lealtad)
    referidaPor?: string; // id de la clienta que la recomendó
    canjes?: Canje[];
}

export interface Cita {
    id: string;
    clienteId: string;
    servicioId: string;
    fecha: string;
    hora: string;
    estado: 'confirmada' | 'pendiente' | 'iniciada' | 'cancelada' | 'completada';
    notas?: string;
    montoAnticipo?: number;
    anticipoConfirmado?: boolean;
    precioFinal?: number;
    metodoPago?: string;
    serviciosAdicionales?: Array<{
        servicioId: string;
        nombre: string;
        precio: number;
    }>;
    empleadoIds?: string[];
    descuentoAplicado?: number;
    subtotalOriginal?: number;
    montoDescuento?: number;
    subtotalConDescuento?: number;
    montoRedondeo?: number;
    propina?: number;
    saldoPendiente?: number;
    fechaCompletada?: string;
    googleEventId?: string;
    descripcionTrabajo?: string; // qué se trabajó y por qué se cobró así
    ubicacion?: Ubicacion;
    atiendeId?: string; // Quién la atiende en la agenda ('cristina' o id de empleado)
}

export interface Venta {
    id: string;
    fecha: string;
    clienteId: string;
    servicioId?: string;
    productos?: { productoId: string; cantidad: number; precio: number }[];
    total: number;
    // Legacy fields support
    precioCobrado?: number;
    anticipoPagado?: number;
    saldoPendiente?: number;
    metodoPago: string;
    empleadoId?: string; // Employee who made the sale/service
}

export interface Servicio {
    id: string;
    nombre: string;
    precioSugerido: number;
    anticipoSugerido: number;
    duracion: number;
    tiempoProceso?: number; // Minutos de espera (tinte actuando): quien atiende queda libre
    tiempoCierre?: number; // Minutos activos al final (enjuague, secado, peinado)
    descripcion?: string;
    comision?: number;
    categoria?: string;
    // Precios de las dos listas, para cambiar de una a otra sin reimportar.
    precio2026?: number;
    anticipo2026?: number;
    precio2027?: number;
    anticipo2027?: number;
}

export interface Producto {
    id: string;
    nombre: string;
    cantidad: number;
    precio: number;
    costo?: number; // Costo al salón (para el margen de venta)
    proveedor?: string;
    categoria?: string;
    stockMinimo?: number;
    fechaUltimaCompra?: string;
    proveedorId?: string; // Proveedor dado de alta (proveedor queda como nombre)
}

export interface Proveedor {
    id: string;
    nombre: string;
    queVende?: string;
    contacto?: string; // Persona con quien se trata
    telefono?: string;
    email?: string;
    web?: string; // Sitio o Instagram
    diasCredito?: number;
    calificacion?: number; // 1 a 10
    notas?: string;
    activo: boolean;
    fechaAlta: string;
}

export interface CompraItem {
    productoId: string;
    nombre: string;
    cantidad: number;
    costoUnitario: number;
}

/** Compra a un proveedor: sube el stock y, si se pide, queda como gasto */
export interface Compra {
    id: string;
    proveedorId: string;
    fecha: string;
    folio?: string; // Factura o nota del proveedor
    items: CompraItem[];
    total: number;
    gastoId?: string;
    notas?: string;
}

// Marketing Interfaces
export interface EmailCampaign {
    id: string;
    nombre: string;
    tipo: CampaignType;
    estado: 'borrador' | 'programada' | 'enviada' | 'cancelada' | 'enviando';
    plantillaId: string;
    asunto: string;
    contenido: string;
    fechaCreacion: string;
    fechaEnvio?: string;
    destinatarios: any[];
    configuracion: any;
    estadisticas: any;
}

export interface EmailTemplate {
    id: string;
    nombre: string;
    tipo: CampaignType;
    asunto: string;
    contenidoHtml: string;
    contenidoTexto: string;
    variables: string[];
    fechaCreacion: string;
    activa: boolean;
    esPersonalizable: boolean;
}

export interface AutomationRule {
    id: string;
    nombre: string;
    activa: boolean;
    trigger: string;
    plantillaId: string;
    condiciones: any;
    filtroClientes: string;
}

export class SalonDatabase extends Dexie {
    clientes!: Table<Cliente>;
    citas!: Table<Cita>;
    ventas!: Table<Venta>;
    servicios!: Table<Servicio>;
    inventario!: Table<Producto>;
    proveedores!: Table<Proveedor>;
    compras!: Table<Compra>;

    // New Tables
    documentos!: Table<SalonDocument>;
    configuracion!: Table<AppSettings>;
    empleados!: Table<Empleado>;

    // Marketing Tables
    campanas!: Table<EmailCampaign>;
    plantillas!: Table<EmailTemplate>;
    automatizaciones!: Table<AutomationRule>;
    gastos!: Table<Expense>;
    empleadoEvents!: Table<EmpleadoEvent>;

    constructor() {
        // Base nueva sincronizada con Dexie Cloud. La base local anterior
        // ('BeautySalonDB') se conserva intacta y se copia una vez a la nube
        // (ver utils/migrarANube.ts).
        super('BeautySalonCloud', { addons: [dexieCloud] });

        // Dexie Cloud no admite claves autoincrementales (++id) en tablas
        // sincronizadas: '@id' genera ids de texto únicos.
        this.version(1).stores({
            clientes: 'id, nombre, email, telefono, activo, fechaRegistro',
            citas: 'id, clienteId, fecha, estado, empleadoId, googleEventId',
            ventas: 'id, fecha, clienteId, empleadoId',
            servicios: 'id, nombre, categoria',
            inventario: 'id, nombre, categoria, proveedor',
            gastos: '@id, fecha, categoria',
            documentos: '++id, titulo, tipo, fechaCreacion',
            configuracion: 'id', // Singleton
            empleados: 'id, nombre, activo, googleCalendarId',
            campanas: 'id, tipo, estado, fechaCreacion',
            plantillas: 'id, tipo, nombre',
            automatizaciones: 'id, trigger, activa',
            empleadoEvents: '@id, empleadoId, tipo, fechaInicio, googleEventId'
        });
        this.version(2).stores({
            proveedores: 'id, nombre, activo',
            compras: 'id, proveedorId, fecha'
        });

        this.cloud.configure({
            databaseUrl: DEXIE_CLOUD_URL,
            requireAuth: true, // Pide iniciar sesión por email antes de abrir la base
            customLoginGui: true, // Diálogo propio en español (components/auth/LoginSalon)
            // Documentos guarda archivos (Blob); se quedan solo en este dispositivo
            unsyncedTables: ['documentos']
        });

        // Todo registro nuevo sin realmId va al realm compartido del salón
        // (si no, Dexie Cloud lo dejaría en el realm privado de quien lo crea
        // y nadie más del equipo lo vería). Nivel 2: corre antes que el
        // middleware de Dexie Cloud (nivel 1) que pone el realm privado.
        this.use({
            stack: 'dbcore',
            name: 'realmSalon',
            level: 2,
            create: down => ({
                ...down,
                table: nombre => {
                    const tabla = down.table(nombre);
                    if (!TABLAS_DEL_SALON.has(nombre)) return tabla;
                    return {
                        ...tabla,
                        mutate: req => {
                            if (realmSalonId && (req.type === 'add' || req.type === 'put')) {
                                for (const obj of req.values) {
                                    if (!obj.realmId) obj.realmId = realmSalonId;
                                }
                            }
                            return tabla.mutate(req);
                        }
                    };
                }
            })
        });
    }
}

// Tablas sincronizadas con datos del negocio (no realms/members ni documentos).
const TABLAS_DEL_SALON = new Set([
    'clientes', 'citas', 'ventas', 'servicios', 'inventario', 'gastos', 'configuracion',
    'empleados', 'campanas', 'plantillas', 'automatizaciones', 'empleadoEvents',
    'proveedores', 'compras'
]);

let realmSalonId: string | undefined;
/** Fija el realm compartido donde se guardan los registros nuevos (ver db/salon.ts) */
export const usarRealmSalon = (realmId: string) => { realmSalonId = realmId; };

export const db = new SalonDatabase();
