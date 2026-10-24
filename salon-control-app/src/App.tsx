import { HashRouter as Router, Routes, Route, Link, NavLink, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { loadEmailJS } from "./utils/emailJSLoader";
import {
  BarChart3, BookOpen, CalendarCheck, CalendarDays, Crown, FileText, Image, LogOut, Megaphone, Menu, Package,
  Receipt, Scissors, Settings, Users, Wallet, X, type LucideIcon
} from "lucide-react";
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
import Bandeja from "./components/avisos/Bandeja";

// Páginas solo para la dueña (la empleada no las ve en el menú ni por URL)
const SOLO_DUENA = new Set(["/reportes", "/configuracion"]);

type Enlace = { to: string; label: string; Icono: LucideIcon };

// Menú agrupado como se trabaja en el salón
const SECCIONES: { titulo: string; enlaces: Enlace[] }[] = [
  { titulo: "Agenda", enlaces: [
    { to: "/citas", label: "Citas", Icono: CalendarCheck },
    { to: "/calendario", label: "Calendario", Icono: CalendarDays },
  ] },
  { titulo: "Ventas", enlaces: [
    { to: "/ventas", label: "Ventas", Icono: Receipt },
    { to: "/inventario", label: "Inventario", Icono: Package },
    { to: "/catalogo", label: "Catálogo", Icono: BookOpen },
  ] },
  { titulo: "Clientas", enlaces: [
    { to: "/clientes", label: "Clientes", Icono: Users },
    { to: "/circulo", label: "Club", Icono: Crown },
    { to: "/campanas", label: "Campañas", Icono: Megaphone },
  ] },
  { titulo: "Salón", enlaces: [
    { to: "/empleados", label: "Equipo", Icono: Scissors },
    { to: "/gastos", label: "Gastos", Icono: Wallet },
    { to: "/documentos", label: "Documentos", Icono: FileText },
    { to: "/galeria", label: "Galería", Icono: Image },
    { to: "/reportes", label: "Reportes", Icono: BarChart3 },
    { to: "/configuracion", label: "Configuración", Icono: Settings },
  ] },
];

export default function App() {
  const { estado, reintentar } = useInitializeData();
  return (
    <>
      <LoginSalon />
      {estado === "listo" ? (
        <AppSalon />
      ) : estado === "cargando" ? (
        <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-marca-negro text-marca-champan">
          <img src="./marca/CB_monograma_dorado.svg" alt="" className="h-14 w-auto animate-pulse" />
          <span className="text-[11px] uppercase tracking-[0.3em]">Cargando salón</span>
        </div>
      ) : (
        <PantallaSinSalon estado={estado} reintentar={reintentar} />
      )}
    </>
  );
}

function AppSalon() {
  useMarketingAutomations();
  useAutoBackup();

  // Inicialización y Carga de EmailJS
  useEffect(() => {
    loadEmailJS();
    googleCalendarService.initialize();
  }, []);

  return (
    <SettingsProvider>
      <Router>
        <Marco />
      </Router>
    </SettingsProvider>
  );
}

function Marco() {
  const rol = useRolSalon();
  const usuario = useObservable(db.cloud.currentUser);
  const { pathname } = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  useEffect(() => setMenuAbierto(false), [pathname]);

  const secciones = SECCIONES
    .map(s => ({ ...s, enlaces: s.enlaces.filter(e => rol === "duena" || !SOLO_DUENA.has(e.to)) }))
    .filter(s => s.enlaces.length);
  const actual = secciones.flatMap(s => s.enlaces).find(e => pathname.startsWith(e.to));
  const salir = () => db.cloud.logout().then(() => location.reload());

  const menu = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between pb-8 pl-6 pr-3 pt-7">
        <Link to="/citas" className="flex items-center gap-3" title="Cristina Borquez Beauty Salon">
          <img src="./marca/CB_monograma_dorado.svg" alt="" className="h-10 w-auto" />
          <span className="font-display text-2xl leading-none text-white">CB <em className="text-marca-dorado">Control</em></span>
        </Link>
        <span className="hidden lg:block"><Bandeja /></span>
      </div>
      <nav className="flex-1 space-y-7 overflow-y-auto px-3 pb-6">
        {secciones.map(s => (
          <div key={s.titulo}>
            <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.28em] text-white/35">{s.titulo}</p>
            {s.enlaces.map(({ to, label, Icono }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => `group relative flex items-center gap-3 rounded-md px-3 py-2 text-[13.5px] tracking-wide transition-colors ${isActive ? "bg-white/[0.06] text-marca-dorado" : "text-white/70 hover:bg-white/[0.04] hover:text-white"}`}>
                {({ isActive }) => (
                  <>
                    <span className={`absolute left-0 top-1/2 h-5 w-px -translate-y-1/2 bg-marca-dorado transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`} />
                    <Icono size={17} strokeWidth={1.4} className={isActive ? "" : "text-white/45 group-hover:text-white/80"} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      {usuario?.isLoggedIn && (
        <div className="border-t border-white/10 px-6 py-4">
          <p className="truncate text-xs text-white/50" title={usuario.email}>{usuario.email}</p>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.24em] text-marca-dorado">{rol ? NOMBRE_ROL[rol] : ""}</span>
            <button onClick={salir} className="flex items-center gap-1.5 text-xs text-white/60 hover:text-marca-dorado">
              <LogOut size={14} strokeWidth={1.5} /> Salir
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Barra lateral fija en pantallas grandes */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-marca-dorado/15 bg-marca-negro lg:block">{menu}</aside>

      {/* Barra superior y cajón en celular y tableta */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-marca-dorado/20 bg-marca-negro/95 px-4 text-white backdrop-blur lg:hidden">
        <Link to="/citas" className="flex items-center gap-2.5">
          <img src="./marca/CB_monograma_dorado.svg" alt="" className="h-8 w-auto" />
          <span className="text-[11px] uppercase tracking-[0.26em] text-marca-champan">{actual?.label ?? "CB Control"}</span>
        </Link>
        <div className="flex items-center gap-1">
          <Bandeja />
          <button onClick={() => setMenuAbierto(true)} className="rounded-md p-2 hover:bg-white/10" aria-label="Abrir menú">
            <Menu size={22} strokeWidth={1.5} />
          </button>
        </div>
      </header>
      <div className={`fixed inset-0 z-50 lg:hidden ${menuAbierto ? "" : "pointer-events-none"}`}>
        <div onClick={() => setMenuAbierto(false)} className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${menuAbierto ? "opacity-100" : "opacity-0"}`} />
        <aside className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-marca-negro shadow-2xl transition-transform duration-300 ease-out ${menuAbierto ? "translate-x-0" : "-translate-x-full"}`}>
          <button onClick={() => setMenuAbierto(false)} className="absolute right-3 top-6 rounded-md p-2 text-white/70 hover:bg-white/10" aria-label="Cerrar menú">
            <X size={20} strokeWidth={1.5} />
          </button>
          {menu}
        </aside>
      </div>

      {/* Contenido */}
      <main className="w-full lg:pl-64">
        <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
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
                  <div className="flex h-64 flex-col items-center justify-center text-center">
                    <h1>Página no encontrada</h1>
                    <p className="mb-6 mt-2 text-gray-500">La página que buscas no existe.</p>
                    <Link to="/citas" className="rounded-md bg-marca-negro px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-white hover:bg-gray-800">
                      Volver a citas
                    </Link>
                  </div>
                }
              />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
}
