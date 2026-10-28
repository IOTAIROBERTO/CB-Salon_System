import Dexie, { type Table } from 'dexie';
import dexieCloud from 'dexie-cloud-addon';

// URL pública de la base (dexie-cloud.json). La clave secreta vive en dexie-cloud.key, fuera de git.
export const DEXIE_CLOUD_URL = 'https://zt3tyd7cy.dexie.cloud';
import { type CampaignType } from '../types/email';
import type { Canje } from '../utils/lealtad';
import type { ConfigAgenda } from '../utils/agenda';
import type { Zona } from '../utils/zonas';
import type { ListasPrecios } from '../utils/precios';
import type { ParametrosCirculo } from '../utils/lealtad';

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
    pagoPorHora?: number; // Pago por hora de apoyo (utils/pagos)
    bonos?: Record<string, number>; // Bono por cita apoyada, por categoría de servicio
}

export interface EmpleadoEvent {
    id?: string;
    empleadoId: string;
    tipo: 'vacaciones' | 'dia_inhabit' | 'horario_especial' | 'apoyo';
    fechaInicio: string;
    fechaFin: string;
    descripcion?: string;
    googleEventId?: string;
    horas?: number; // Horas trabajadas en un día de apoyo (para el pago)
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
    datosPago?: string; // Datos para el anticipo (Mercado Pago, BBVA…): solo en la base, nunca en el repositorio
    emailConfig?: {
        serviceId: string;
        templateId: string;
        publicKey: string;
    };
    // Respaldo automático: carpeta elegida por el usuario (el handle se guarda
    // tal cual, IndexedDB lo clona) y fecha ISO del último respaldo escrito.
    respaldoCarpeta?: FileSystemDirectoryHandle;
    respaldoUltimo?: string;
    // ponytail: campo viejo (lista 2026/2027); lo reemplaza listasPrecios.
    listaPrecios?: '2026' | '2027';
    listasPrecios?: ListasPrecios; // Año activo y listas históricas bloqueadas (utils/precios)
    zonas?: Zona[]; // Ciudades fuera de Hermosillo (utils/zonas)
    circulo?: Partial<ParametrosCirculo>; // Ajustes del Círculo CB (utils/lealtad)
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
    origen?: 'app' | 'bot' | 'salon'; // dónde se registró (app y bot: sola, por la API)
    clubDesde?: string; // ISO: cuándo se unió al Club desde la app o el bot
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
    ubicacion?: string; // 'salon' o id de zona (utils/zonas); claves viejas: tucson, phoenix…
    pagadoConSaldo?: number; // Parte del cobro pagada con saldo a favor (ya contó como ingreso al venderse la tarjeta)
    atiendeId?: string; // Quién la atiende en la agenda ('cristina' o id de empleado)
    origen?: 'app' | 'bot'; // agendada por la clienta (llega «pendiente» hasta que el salón la confirma)
    avisoConfirmacion?: string; // ISO: cuándo se le mandó la confirmación por WhatsApp (Worker cb-avisos)
    recordatorio?: string; // ISO: cuándo se le mandó el recordatorio del día anterior
    creada?: string; // ISO: cuándo llegó desde la app
    recordatorioSalon?: string; // ISO: último aviso al salón de que sigue sin confirmar (Worker cb-avisos)
    // Valoración (proceso estándar): cómo trae el cabello, lo que acordó Cristina y cómo se paga el anticipo
    valoracion?: { largo?: string; color?: string; quimicos?: boolean; busca?: string };
    precioAcordado?: number; // precio que Cristina confirmó después de valorar (el de catálogo es «desde»)
    formaAnticipo?: 'transferencia' | 'deposito' | 'salon' | 'incluido' | 'sin';
    googleAdoptar?: string; // id del evento que se apuntó a mano en Google: el Worker lo adopta en vez de crear otra copia
}

/** Fotos del cabello que manda la clienta con su solicitud (JPEG reducido, data URL) */
export interface FotoCita {
    id: string;
    citaId: string;
    clienteId: string;
    fecha: string; // ISO
    orden: number;
    imagen: string;
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
    concepto?: string; // venta que no es de producto (por ejemplo, tarjeta de regalo)
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
    descripcion?: string; // notas internas del salón (nunca se muestran a clientas)
    descripcionApp?: string; // lo que ve la clienta en «Más info» de la app
    comision?: number;
    categoria?: string;
    archivado?: boolean; // Fuera del catálogo (uñas, «otros»); se conserva por las citas viejas
    // ponytail: precios por lista del esquema anterior; la lista activa es precioSugerido.
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

/** Consentimiento firmado: la foto del formato en papel o la aceptación en la app */
/** Tarjeta de regalo impresa: se vende con folio y la clienta la activa como saldo a favor */
/** Aviso para el salón: lo que hacen las clientas solas (citas, registros al Club, pedidos), en tiempo real */
export interface Aviso {
    id: string;
    fecha: string; // ISO
    tipo: 'cita' | 'club' | 'pedido' | 'sistema';
    titulo: string;
    detalle?: string;
    refId?: string; // id de la cita, clienta o pedido
    clienteId?: string;
    leido?: boolean;
}

export interface TarjetaRegalo {
    id: string;
    folio: string; // en mayúsculas, sin espacios
    monto: number;
    fechaVenta: string; // ISO
    compradora?: string;
    metodoPago?: string;
    ventaId?: string;
    activadaPor?: string; // clienteId
    fechaActivacion?: string; // ISO
}

/** Saldo a favor de la clienta: abonos (+) por tarjeta de regalo o pedido no recogido; cargos (−) al usarlo */
export interface MovimientoSaldo {
    id: string;
    clienteId: string;
    fecha: string; // ISO
    monto: number;
    concepto: string;
    folio?: string;
    citaId?: string;
    origen?: 'club'; // saldo que salió de canjear puntos: para productos, color, maquillaje o corte
    puntos?: number; // puntos canjeados (origen 'club'): de aquí se descuentan, no de la clienta
}

/** Consentimiento: en papel (foto del formato firmado) o firmado en la app de clientas con un enlace personal.
 *  Sin `estado` = registrado en papel. Uno 'pendiente' no da ningún permiso: su id (firma_…) es el enlace. */
export interface Consentimiento {
    id: string;
    clienteId: string;
    citaId?: string;
    fecha: string; // ISO: cuándo se firmó (o se pidió, si está pendiente)
    imagen?: string; // JPG reducido (data URL) del formato firmado
    fotos: boolean; // ¿Se le pueden tomar fotos de antes y después?
    redes: 'con_rostro' | 'sin_rostro' | 'no'; // ¿Se pueden publicar en redes?
    notas?: string;
    estado?: 'pendiente' | 'firmado';
    vence?: string; // ISO, para el enlace pendiente
    // Firmado en la app (utils/consentimiento: RespuestasConsentimiento)
    salud?: number[];
    marketing?: boolean;
    nombreFirma?: string;
    tutor?: string;
    firma?: string; // PNG (data URL)
    firmadoEn?: string;
    evidencia?: { ip?: string; agente?: string; version: string; huella: string };
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
    consentimientos!: Table<Consentimiento>;
    tarjetasRegalo!: Table<TarjetaRegalo>;
    movimientosSaldo!: Table<MovimientoSaldo>;
    avisos!: Table<Aviso>;
    fotos!: Table<FotoCita>;

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
        this.version(3).stores({
            consentimientos: 'id, clienteId, fecha'
        });
        this.version(4).stores({
            tarjetasRegalo: 'id, folio, fechaVenta',
            movimientosSaldo: 'id, clienteId, fecha'
        });
        this.version(5).stores({
            avisos: 'id, fecha, tipo, leido'
        });

        this.version(6).stores({
            fotos: 'id, citaId, clienteId'
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
    'proveedores', 'compras', 'consentimientos', 'tarjetasRegalo', 'movimientosSaldo', 'avisos', 'fotos'
]);

let realmSalonId: string | undefined;
/** Fija el realm compartido donde se guardan los registros nuevos (ver db/salon.ts) */
export const usarRealmSalon = (realmId: string) => { realmSalonId = realmId; };

export const db = new SalonDatabase();
