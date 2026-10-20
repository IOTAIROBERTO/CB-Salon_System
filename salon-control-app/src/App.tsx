import { HashRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { loadEmailJS } from "./utils/emailJSLoader";
import { Menu, X } from "lucide-react";
import CitasPage from "./pages/CitasPage";
import VentasPage from "./pages/VentasPage";
import InventarioPage from "./pages/InventarioPage";
import ClientesPage from "./pages/ClientesPage";
import CatalogoPreciosPage from "./pages/CatalogoPreciosPage";
import ReportesPage from "./pages/ReportesPage";
import EmailCampaignsPage from "./pages/EmailCampaignsPage";
import DocumentosPage from "./pages/DocumentosPage";
import GastosPage from "./pages/GastosPage";
import ConfiguracionPage from "./pages/ConfiguracionPage";
import EmpleadosPage from "./pages/EmpleadosPage";
import CalendarioPage from "./pages/CalendarioPage";
import CirculoPage from "./pages/CirculoPage";
import GaleriaPage from "./pages/GaleriaPage";
import { useInitializeData } from "./hooks/useInitializeData";
import { useMarketingAutomations } from "./hooks/useMarketingAutomations";
import { useAutoBackup } from "./hooks/useAutoBackup";
import { googleCalendarService } from "./services/googleCalendar";

import { SettingsProvider } from "./contexts/SettingsContext";
import { useObservable } from "dexie-react-hooks";
import { db } from "./db/db";
import { useRolSalon, NOMBRE_ROL } from "./db/salon";
import { LoginSalon, PantallaSinSalon } from "./components/auth/AccesoSalon";

// Páginas solo para la dueña (la empleada no las ve en el menú ni por URL)
const SOLO_DUENA = new Set(["/reportes", "/configuracion"]);

export default function App() {
  const { estado, reintentar } = useInitializeData();
  return (
    <>
      <LoginSalon />
      {estado === "listo" ? (
        <AppSalon />
      ) : estado === "cargando" ? (
        <div className="min-h-screen flex items-center justify-center text-gray-500">Cargando salón…</div>
      ) : (
        <PantallaSinSalon estado={estado} reintentar={reintentar} />
      )}
    </>
  );
}

function AppSalon() {
  const rol = useRolSalon();
  useMarketingAutomations();
  useAutoBackup();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const usuario = useObservable(db.cloud.currentUser);

  // Inicialización y Carga de EmailJS
  useEffect(() => {
    loadEmailJS();
    googleCalendarService.initialize();
  }, []);

  const navLinks = [
    { to: "/citas", label: "Citas" },
    { to: "/calendario", label: "Calendario" },
    { to: "/ventas", label: "Ventas" },
    { to: "/inventario", label: "Inventario" },
    { to: "/clientes", label: "Clientes" },
    { to: "/circulo", label: "Círculo CB" },
    { to: "/catalogo", label: "Catálogo" },
    { to: "/campanas", label: "Campañas" },
    { to: "/empleados", label: "Empleados" },
    { to: "/gastos", label: "Gastos" },
    { to: "/documentos", label: "Documentos" },
    { to: "/galeria", label: "Galería" },
    { to: "/reportes", label: "Reportes" },
    { to: "/configuracion", label: "Configuración" }
  ].filter(link => rol === "duena" || !SOLO_DUENA.has(link.to));

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <SettingsProvider>
      <Router>
        <div className="min-h-screen w-full flex flex-col bg-gray-50">
          {/* Barra de navegacion */}
          <nav className="bg-marca-negro text-white shadow-lg relative z-50 border-b border-marca-dorado/40">
            <div className="max-w-full px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {/* Logo/Titulo y Widget */}
                <div className="flex items-center gap-4">
                  <Link to="/citas" className="flex-shrink-0 flex items-center gap-3" title="Cristina Borquez Beauty Salon">
                    <img src="./marca/CB_monograma_dorado.svg" alt="" className="h-9 w-auto" />
                    <span className="font-display text-xl sm:text-2xl leading-none tracking-wide xl:hidden 2xl:inline">
                      CB <em className="text-marca-dorado">Control</em>
                    </span>
                  </Link>
                </div>

                {/* Navegacion Desktop */}
                <div className="hidden xl:block">
                  <div className="ml-4 flex items-baseline space-x-1">
                    {navLinks.map((link) => (
                      <Link
                        key={link.to}
                        className="hover:bg-white/10 hover:text-marca-dorado px-2 py-2 rounded-md text-xs xl:text-sm font-medium transition-colors duration-200 whitespace-nowrap"
                        to={link.to}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Sesión de Dexie Cloud */}
                {usuario?.isLoggedIn && (
                  <button
                    onClick={() => db.cloud.logout().then(() => location.reload())}
                    title={`Sesión: ${usuario.email}${rol ? ` (${NOMBRE_ROL[rol]})` : ""}`}
                    className="hidden xl:block ml-2 hover:bg-white/10 hover:text-marca-dorado px-2 py-2 rounded-md text-xs xl:text-sm font-medium"
                  >
                    Salir
                  </button>
                )}

                {/* Boton hamburguesa movil */}
                <div className="xl:hidden">
                  <button
                    onClick={toggleMobileMenu}
                    className="inline-flex items-center justify-center p-2 rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors duration-200"
                  >
                    <span className="sr-only">Abrir menu principal</span>
                    {isMobileMenuOpen ? (
                      <X className="block h-6 w-6" />
                    ) : (
                      <Menu className="block h-6 w-6" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Menu movil */}
            <div className={`xl:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen
              ? 'max-h-[80vh] overflow-y-auto opacity-100 visible'
              : 'max-h-0 opacity-0 invisible overflow-hidden'
              }`}>
              <div className="px-2 pt-2 pb-3 space-y-1 bg-[#1A1A1A]">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    className="block hover:bg-white/10 hover:text-marca-dorado px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                    to={link.to}
                    onClick={closeMobileMenu}
                  >
                    {link.label}
                  </Link>
                ))}
                {usuario?.isLoggedIn && (
                  <button
                    onClick={() => db.cloud.logout().then(() => location.reload())}
                    className="block w-full text-left hover:bg-white/10 hover:text-marca-dorado px-3 py-2 rounded-md text-base font-medium"
                  >
                    Salir ({usuario.email})
                  </button>
                )}
              </div>
            </div>
          </nav>

          {/* Area principal de contenido */}
          <main className="flex-1 w-full max-w-full">
            <div className="h-full px-4 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-7xl">
                <Routes>
                  <Route path="/" element={<Navigate to="/citas" replace />} />
                  <Route path="/citas" element={<CitasPage />} />
                  <Route path="/calendario" element={<CalendarioPage />} />
                  <Route path="/ventas" element={<VentasPage />} />
                  <Route path="/inventario" element={<InventarioPage />} />
                  <Route path="/clientes" element={<ClientesPage />} />
                  <Route path="/circulo" element={<CirculoPage />} />
                  <Route path="/catalogo" element={<CatalogoPreciosPage />} />
                  <Route path="/campanas" element={<EmailCampaignsPage />} />
                  <Route path="/empleados" element={<EmpleadosPage />} />
                  <Route path="/gastos" element={<GastosPage />} />
                  <Route path="/documentos" element={<DocumentosPage />} />
                  <Route path="/galeria" element={<GaleriaPage />} />
                  {rol === "duena" && <Route path="/reportes" element={<ReportesPage />} />}
                  {rol === "duena" && <Route path="/configuracion" element={<ConfiguracionPage />} />}

                  {/* Redirecciones para compatibilidad con URLs antiguas */}
                  <Route path="/servicios" element={<Navigate to="/citas" replace />} />

                  <Route
                    path="*"
                    element={
                      <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Pagina no encontrada
                          </h2>
                          <p className="text-gray-600 mb-4">
                            La pagina que buscas no existe.
                          </p>
                          <Link
                            to="/citas"
                            className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200"
                          >
                            Volver al inicio
                          </Link>
                        </div>
                      </div>
                    }
                  />
                </Routes>
              </div>
            </div>
          </main>

          {/* Overlay para cerrar menu movil */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 xl:hidden"
              onClick={closeMobileMenu}
            ></div>
          )}

          {/* Indicador de pagina activa en movil */}
          <div className="xl:hidden bg-black text-marca-dorado text-center py-1 text-xs tracking-[0.2em] uppercase">
            {navLinks.find(link => window.location.hash === `#${link.to}`)?.label || 'CB Control'}
          </div>
        </div>
      </Router>
    </SettingsProvider>
  );
}