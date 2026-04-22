import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  ClipboardList,
  BrainCircuit,
  GraduationCap,
  LogOut,
  ScanFace,
  HelpCircle,
  FileText,
  X,
  Menu,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { to: '/classrooms', label: 'Grupos', Icon: BookOpen },
  { to: '/attendance', label: 'Asistencia', Icon: ClipboardList },
  { to: '/fatigue', label: 'Análisis de Fatiga', Icon: BrainCircuit },
]

const infoLinks = [
  { to: '/how-it-works', label: 'Cómo funciona', Icon: HelpCircle },
  { to: '/terms', label: 'Términos y condiciones', Icon: FileText },
]

// Desktop nav item — original design
function NavItem({ to, label, Icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`
      }
    >
      <Icon size={17} />
      {label}
    </NavLink>
  )
}

// Mobile nav item — paleta desktop + estructura moderna
function MobileNavItem({ to, label, Icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-0.5'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all duration-200 ${
            isActive
              ? 'bg-blue-500 text-white'
              : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white'
          }`}>
            <Icon size={16} />
          </span>
          <span className="flex-1 leading-none">{label}</span>
        </>
      )}
    </NavLink>
  )
}

function SectionLabel({ children }) {
  return (
    <p className="text-slate-600 text-[10px] uppercase tracking-widest px-2 mb-1.5 mt-1 font-semibold">
      {children}
    </p>
  )
}

// Desktop sidebar — original design unchanged
function DesktopSidebarContent({ user, onLogout }) {
  return (
    <>
      <div className="px-4 h-14 border-b border-slate-700/60 flex items-center shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
            <ScanFace size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight leading-none">Presentia</h1>
            <p className="text-slate-400 text-xs mt-0.5">Asistencia inteligente</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navLinks.map(({ to, label, Icon }) => (
          <NavItem key={to} to={to} label={label} Icon={Icon} />
        ))}
        <div className="mt-5 pt-4 border-t border-slate-700/60">
          <p className="text-slate-500 text-xs uppercase tracking-wider px-3 mb-2">Información</p>
          {infoLinks.map(({ to, label, Icon }) => (
            <NavItem key={to} to={to} label={label} Icon={Icon} />
          ))}
        </div>
        {user?.role === 'admin' && (
          <div className="mt-5 pt-4 border-t border-slate-700/60">
            <p className="text-slate-500 text-xs uppercase tracking-wider px-3 mb-2">Administración</p>
            <NavItem to="/admin/maestros" label="Maestros" Icon={GraduationCap} />
          </div>
        )}
      </nav>

      <div className="px-3 pb-4 border-t border-slate-700/60 pt-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate leading-tight">{user?.name || user?.username}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </>
  )
}

// Mobile sidebar — modern redesign
function MobileSidebarContent({ user, onClose, onLogout }) {
  return (
    <>
      <div className="px-4 h-14 border-b border-white/[0.07] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
            <ScanFace size={17} className="text-white" />
          </div>
          <h1 className="text-base font-bold tracking-tight leading-none text-white">Presentia</h1>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-500 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
        >
          <X size={17} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <SectionLabel>Principal</SectionLabel>
        {navLinks.map(({ to, label, Icon }) => (
          <MobileNavItem key={to} to={to} label={label} Icon={Icon} onClick={onClose} />
        ))}
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <SectionLabel>Información</SectionLabel>
          {infoLinks.map(({ to, label, Icon }) => (
            <MobileNavItem key={to} to={to} label={label} Icon={Icon} onClick={onClose} />
          ))}
        </div>
        {user?.role === 'admin' && (
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <SectionLabel>Administración</SectionLabel>
            <MobileNavItem to="/admin/maestros" label="Maestros" Icon={GraduationCap} onClick={onClose} />
          </div>
        )}
      </nav>

      <div className="px-3 pb-4 border-t border-white/[0.07] pt-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl mb-1 bg-white/[0.03]">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow shadow-blue-500/20">
            {user?.name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate leading-tight text-slate-100">{user?.name || user?.username}</p>
            <p className="text-[11px] text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-2 py-2 text-sm text-slate-500 hover:text-slate-100 hover:bg-white/[0.06] rounded-xl transition-all duration-200"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04]">
            <LogOut size={15} />
          </span>
          Cerrar sesión
        </button>
      </div>
    </>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col shrink-0">
        <DesktopSidebarContent user={user} onLogout={handleLogout} />
      </aside>

      {/* Mobile topbar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 flex items-center justify-between px-4 z-30 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
            <ScanFace size={18} className="text-white" />
          </div>
          <span className="text-white text-base font-bold tracking-tight">Presentia</span>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`md:hidden fixed inset-0 z-50 bg-slate-900 text-white flex flex-col transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <MobileSidebarContent
          user={user}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto md:pt-0 pt-14">
        <Outlet />
      </main>
    </div>
  )
}
