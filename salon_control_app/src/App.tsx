import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import CitasPage from "./pages/CitasPage";
import VentasPage from "./pages/VentasPage";
import InventarioPage from "./pages/InventarioPage";
import ClientesPage from "./pages/ClientesPage";
import PreciosPage from "./pages/PreciosPage";
import ReportesPage from "./pages/ReportesPage";
import { useInitializeData } from "./hooks/useInitializeData";

export default function App() {
  useInitializeData();

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        {/* Barra de navegación */}
        <nav className="bg-purple-600 text-white p-4 flex justify-around shadow-lg">
          <Link className="hover:bg-purple-800 px-3 py-1 rounded-lg" to="/citas">Citas</Link>
          <Link className="hover:bg-purple-800 px-3 py-1 rounded-lg" to="/ventas">Ventas</Link>
          <Link className="hover:bg-purple-800 px-3 py-1 rounded-lg" to="/inventario">Inventario</Link>
          <Link className="hover:bg-purple-800 px-3 py-1 rounded-lg" to="/clientes">Clientes</Link>
          <Link className="hover:bg-purple-800 px-3 py-1 rounded-lg" to="/precios">Servicios</Link>
          <Link className="hover:bg-purple-800 px-3 py-1 rounded-lg" to="/reportes">Reportes</Link>
        </nav>

        {/* Área donde se cargan las páginas */}
        <main className="flex-1 p-6 bg-gray-50">
          <Routes>
            <Route path="/" element={<Navigate to="/citas" replace />} />
            <Route path="/citas" element={<CitasPage />} />
            <Route path="/ventas" element={<VentasPage />} />
            <Route path="/inventario" element={<InventarioPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/precios" element={<PreciosPage />} />
            <Route path="/reportes" element={<ReportesPage />} />
            <Route path="*" element={<div>Página no encontrada</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
