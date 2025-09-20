import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Mail } from "lucide-react";
import CitasPage from "./pages/CitasPage";
import VentasPage from "./pages/VentasPage";
import InventarioPage from "./pages/InventarioPage";
import ClientesPage from "./pages/ClientesPage";
import CatalogoPreciosPage from "./pages/CatalogoPreciosPage";
import ReportesPage from "./pages/ReportesPage";
import EmailCampaignsPage from "./pages/EmailCampaignsPage";
import { useInitializeData } from "./hooks/useInitializeData";
import { useEmailAutomation } from "./hooks/useEmailAutomation";

export default function App() {
  useInitializeData();
  useEmailAutomation(); // Hook para automatización de emails
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: "/citas", label: "Citas y Servicios" },
    { to: "/ventas", label: "Ventas de Productos" },
    { to: "/inventario", label: "Inventario" },
    { to: "/clientes", label: "Clientes" },
    { to: "/catalogo", label: "Catalogo de Servicios" },
    { to: "/email", label: "Email Marketing", icon: Mail },
    { to: "/reportes", label: "Reportes" }
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <Router>
      <div className="min-h-screen w-full flex flex-col bg-gray-50">
        {/* Barra de navegacion */}
        <nav className="bg-purple-600 text-white shadow-lg relative z-50">
          <div className="max-w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo/Titulo */}
              <div className="flex-shrink-0">
                <h1 className="text-lg sm:text-xl font-bold">Beauty Salon Total Control</h1>
              </div>

              {/* Navegacion Desktop */}
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      className="hover:bg-purple-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 whitespace-nowrap flex items-center gap-2"
                      to={link.to}
                    >
                      {link.icon && <link.icon size={16} />}
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Boton hamburguesa movil */}
              <div className="md:hidden">
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
          <div className={`md:hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen 
              ? 'max-h-96 opacity-100 visible' 
              : 'max-h-0 opacity-0 invisible overflow-hidden'
          }`}>
            <div className="px-2 pt-2 pb-3 space-y-1 bg-purple-700">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  className="block hover:bg-purple-800 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 flex items-center gap-2"
                  to={link.to}
                  onClick={closeMobileMenu}
                >
                  {link.icon && <link.icon size={16} />}
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
                <Route path="/ventas" element={<VentasPage />} />
                <Route path="/inventario" element={<InventarioPage />} />
                <Route path="/clientes" element={<ClientesPage />} />
                <Route path="/catalogo" element={<CatalogoPreciosPage />} />
                <Route path="/email" element={<EmailCampaignsPage />} />
                <Route path="/reportes" element={<ReportesPage />} />
                
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
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={closeMobileMenu}
          ></div>
        )}

        {/* Indicador de pagina activa en movil */}
        <div className="md:hidden bg-purple-800 text-white text-center py-1 text-xs">
          {navLinks.find(link => window.location.pathname === link.to)?.label || 'Beauty Salon Total Control'}
        </div>
      </div>
    </Router>
  );
}