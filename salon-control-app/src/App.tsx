import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
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
import { useInitializeData } from "./hooks/useInitializeData";
import { useMarketingAutomations } from "./hooks/useMarketingAutomations";
import { useAutoBackup } from "./hooks/useAutoBackup";
import { googleCalendarService } from "./services/googleCalendar";

import { SettingsProvider } from "./contexts/SettingsContext";

export default function App() {
  useInitializeData();
  useMarketingAutomations();
  useAutoBackup();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Inicialización y Carga de EmailJS
  useEffect(() => {
    loadEmailJS();
    googleCalendarService.initialize();
  }, []);

  const navLinks = [
    { to: "/citas", label: "Citas y Servicios" },
    { to: "/calendario", label: "Calendario" },
    { to: "/ventas", label: "Ventas de Productos" },
    { to: "/inventario", label: "Inventario" },
    { to: "/clientes", label: "Clientes" },
    { to: "/catalogo", label: "Catalogo de Servicios" },
    { to: "/campanas", label: "Campañas" },
    { to: "/empleados", label: "Empleados" },
    { to: "/gastos", label: "Gastos" },
    { to: "/documentos", label: "Documentos" },
    { to: "/reportes", label: "Reportes" },
    { to: "/configuracion", label: "Configuración" }
  ];

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
          <nav className="bg-purple-600 text-white shadow-lg relative z-50">
            <div className="max-w-full px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {/* Logo/Titulo y Widget */}
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <h1 className="text-lg sm:text-xl font-bold">Salon Total Control</h1>
                  </div>
                </div>

                {/* Navegacion Desktop */}
                <div className="hidden lg:block">
                  <div className="ml-4 flex items-baseline space-x-1 xl:space-x-2">
                    {navLinks.map((link) => (
                      <Link
                        key={link.to}
                        className="hover:bg-purple-700 px-2 py-2 rounded-md text-xs xl:text-sm font-medium transition-colors duration-200 whitespace-nowrap"
                        to={link.to}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Boton hamburguesa movil */}
                <div className="lg:hidden">
                  <button
                    onClick={toggleMobileMenu}
                    className="inline-flex items-center justify-center p-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors duration-200"
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
            <div className={`lg:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen
              ? 'max-h-96 opacity-100 visible'
              : 'max-h-0 opacity-0 invisible overflow-hidden'
              }`}>
              <div className="px-2 pt-2 pb-3 space-y-1 bg-purple-700">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    className="block hover:bg-purple-800 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                    to={link.to}
                    onClick={closeMobileMenu}
                  >
                    {link.label}
                  </Link>
                ))}
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
                  <Route path="/catalogo" element={<CatalogoPreciosPage />} />
                  <Route path="/campanas" element={<EmailCampaignsPage />} />
                  <Route path="/empleados" element={<EmpleadosPage />} />
                  <Route path="/gastos" element={<GastosPage />} />
                  <Route path="/documentos" element={<DocumentosPage />} />
                  <Route path="/reportes" element={<ReportesPage />} />
                  <Route path="/configuracion" element={<ConfiguracionPage />} />

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
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={closeMobileMenu}
            ></div>
          )}

          {/* Indicador de pagina activa en movil */}
          <div className="lg:hidden bg-purple-800 text-white text-center py-1 text-xs">
            {navLinks.find(link => window.location.pathname === link.to)?.label || 'Salon Total Control'}
          </div>
        </div>
      </Router>
    </SettingsProvider>
  );
}