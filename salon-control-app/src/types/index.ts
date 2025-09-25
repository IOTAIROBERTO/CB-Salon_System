// src/types/index.ts
export type { ConfiguracionEmpresa } from './config';
export { CONFIGURACION_DEFAULT, TEMAS_DISPONIBLES } from './config';

// Re-exportar otros tipos existentes
export type { Cliente, ClienteFormData, ClientesStats, ViewMode } from './clientes';
export type { Servicio, ServicioFormData } from './catalogo';
export type { Producto, ProductoFormData, StockMovimiento, InventarioStats, ModalType } from './inventario';
export type { Cita, Cliente as CitaCliente, Servicio as CitaServicio, ModalState } from './citas';
export type { 
  Cita as ReporteCita, 
  Venta as ReporteVenta, 
  Cliente as ReporteCliente, 
  ServicioCatalogo, 
  ReportData, 
  ReportStats, 
  ReportPeriod, 
  FiltroHistorial 
} from './reportes';
export type { 
  Cliente as VentaCliente, 
  Item, 
  VentaItem, 
  Venta, 
  VentaFormData, 
  VentasStats 
} from './ventas';

// src/hooks/index.ts
// Hooks de configuración
export { useConfiguracion } from './useConfiguracion';
export { useModalConfiguracion } from './useModalConfiguracion';
export type { ModalConfiguracionType } from './useModalConfiguracion';

// Re-exportar otros hooks existentes
export { useCatalogo } from './useCatalogo';
export { useClienteModal } from './useClienteModal';
export { useClientes } from './useClientes';
export { useHistorialCitas } from './useHistorialCitas';
export { useInitializeData } from './useInitializeData';
export { useInventario } from './useInventario';
export { useProductoModal } from './useProductoModal';
export { useReportData } from './useReportData';
export { useServicioModal } from './useServicioModal';
export { useVentaModal } from './useVentaModal';
export { useVentas } from './useVentas';
export { useVentasSearch } from './useVentasSearch';
export { useViewMode } from './useViewMode';
export { default as useCitas } from './useCitas';

// src/utils/index.ts
// Utilidades de configuración y colores
export { getColorClasses, useThemeColors } from './colorUtils';

// Re-exportar otras utilidades existentes
export * from './catalogoUtils';
export * from './clientesUtils';
export * from './discountUtils';
export * from './exportUtils';
export * from './inventarioUtils';
export * from './reportUtils';
export * from './ventasUtils';

// src/components/index.ts
// Componentes de configuración
export { default as ConfiguracionEmpresaModal } from './configuracion/ConfiguracionEmpresaModal';

// Re-exportar componentes de catálogo
export { default as AddServiceButton } from './catalogo/AddServiceButton';
export { default as ServicioModal } from './catalogo/ServicioModal';
export { default as ServicioRow } from './catalogo/ServicioRow';
export { default as ServiciosTable } from './catalogo/ServiciosTable';

// Re-exportar componentes de citas
export { default as CitaCard } from './citas/CitaCard';
export { default as CitaModal } from './citas/CitaModal';
export { default as CitasStats } from './citas/CitasStats';
export { default as CobroModal } from './citas/CobroModal';
export { default as ReagendarModal } from './citas/ReagendarModal';
export { default as ResumenCobro } from './citas/ResumenCobro';

// Re-exportar componentes de clientes
export { default as AddClienteButton } from './clientes/AddClienteButton';
export { default as ClienteModal } from './clientes/ClienteModal';
export { default as ClientesCards } from './clientes/ClientesCards';
export { default as ClientesControls } from './clientes/ClientesControls';
export { default as ClientesStats } from './clientes/ClientesStats';
export { default as ClientesTable } from './clientes/ClientesTable';
export { default as CumpleanerosBanner } from './clientes/CumpleanerosBanner';
export { default as EmptyState } from './clientes/EmptyState';

// Re-exportar componentes de inventario
export { default as AddProductoButton } from './inventario/AddProductoButton';
export { default as EmptyInventario } from './inventario/EmptyInventario';
export { default as InventarioStats } from './inventario/InventarioStats';
export { default as ProductoModal } from './inventario/ProductoModal';
export { default as ProductosTable } from './inventario/ProductosTable';
export { default as StockBajoAlert } from './inventario/StockBajoAlert';
export { default as StockModal } from './inventario/StockModal';

// Re-exportar componentes de reportes
export { default as CitaDetalleModal } from './reportes/CitaDetalleModal';
export { default as CitaHistorialCard } from './reportes/CitaHistorialCard';
export { default as ExportButton } from './reportes/ExportButton';
export { default as HistorialCitas } from './reportes/HistorialCitas';
export { default as ReportChart } from './reportes/ReportChart';
export { default as ReportStats } from './reportes/ReportStats';

// Re-exportar componentes de ventas
export { default as AddVentaButton } from './ventas/AddVentaButton';
export { default as ProductSelector } from './ventas/ProductSelector';
export { default as VentaCard } from './ventas/VentaCard';
export { default as VentaModal } from './ventas/VentaModal';
export { default as VentasList } from './ventas/VentasList';
export { default as VentasSearch } from './ventas/VentasSearch';

// src/components/configuracion/index.ts
export { default as ConfiguracionEmpresaModal } from './ConfiguracionEmpresaModal';

// Para futuras implementaciones (comentadas por ahora):
// export { default as ConfiguracionColoresModal } from './ConfiguracionColoresModal';
// export { default as ConfiguracionLogoModal } from './ConfiguracionLogoModal';
// export { default as ConfiguracionEmailModal } from './ConfiguracionEmailModal';

// src/pages/index.ts
// Páginas principales
export { default as CatalogoPreciosPage } from './CatalogoPreciosPage';
export { default as CitasPage } from './CitasPage';
export { default as ClientesPage } from './ClientesPage';
export { default as ConfiguracionPage } from './ConfiguracionPage';
export { default as InventarioPage } from './InventarioPage';
export { default as ReportesPage } from './ReportesPage';
export { default as VentasPage } from './VentasPage';

// src/services/index.ts
// Servicios (aunque no se usen actualmente, están listos para futuro)
// export { emailService } from './emailService';
// export { googleCalendarService } from './googleCalendar';
// export { whatsappService } from './whatsappService';