import { useEffect } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { CalendarPlus, Crown, Home, ShoppingBag } from 'lucide-react'
import Inicio from './pages/Inicio'
import Agendar from './pages/Agendar'
import Productos from './pages/Productos'
import MiClub from './pages/MiClub'

const PESTANAS = [
  { a: '/', texto: 'Inicio', Icono: Home },
  { a: '/agendar', texto: 'Agendar', Icono: CalendarPlus },
  { a: '/productos', texto: 'Productos', Icono: ShoppingBag },
  { a: '/club', texto: 'Mi Club', Icono: Crown }
]

export default function App() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])   // cada pestaña abre desde arriba (con llaves: scrollTo ya devuelve una promesa)
  return (
    <div className="mx-auto min-h-screen max-w-md pb-20">
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/agendar" element={<Agendar />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/club" element={<MiClub />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-marca-linea bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-md">
          {PESTANAS.map(({ a, texto, Icono }) => (
            <NavLink key={a} to={a} end={a === '/'}
              className={({ isActive }) => `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${isActive ? 'text-marca-dorado-prof' : 'text-marca-gris'}`}>
              <Icono size={22} strokeWidth={1.6} />
              {texto}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
