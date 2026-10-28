import { useEffect } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { CalendarPlus, Coffee, Crown, Home } from 'lucide-react'
import Inicio from './pages/Inicio'
import Agendar from './pages/Agendar'
import Productos from './pages/Productos'
import MiClub from './pages/MiClub'
import Firmar from './pages/Firmar'

const PESTANAS = [
  { a: '/', texto: 'Inicio', Icono: Home },
  { a: '/agendar', texto: 'Agendar', Icono: CalendarPlus },
  { a: '/productos', texto: 'Antojos', Icono: Coffee },
  { a: '/club', texto: 'Mi Club', Icono: Crown }
]

export default function App() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])   // cada pestaña abre desde arriba (con llaves: scrollTo ya devuelve una promesa)
  return (
    <div className="mx-auto min-h-screen max-w-md bg-marca-marfil pb-24 shadow-[0_0_60px_rgba(17,17,17,0.06)]">
      <div key={pathname} className="aparece">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/agendar" element={<Agendar />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/club" element={<MiClub />} />
          <Route path="/firmar/:id" element={<Firmar />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-marca-linea/60 bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-md">
          {PESTANAS.map(({ a, texto, Icono }) => (
            <NavLink key={a} to={a} end={a === '/'}
              className={({ isActive }) => `relative flex flex-1 flex-col items-center gap-1 pb-2.5 pt-3 text-[9.5px] uppercase tracking-[0.18em] transition-colors ${isActive ? 'text-marca-negro' : 'text-marca-gris/80'}`}>
              {({ isActive }) => (
                <>
                  <span className={`absolute top-0 h-px w-8 bg-marca-dorado transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                  <Icono size={20} strokeWidth={isActive ? 1.6 : 1.3} className={isActive ? 'text-marca-dorado-prof' : ''} />
                  {texto}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
