import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Clock, History, LogOut, Menu } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

const nav = [
  { to: '/recovery',          icon: LayoutDashboard, label: 'Dashboard',   end: true },
  { to: '/recovery/pending',  icon: Clock,           label: 'Pending Pickups'    },
  { to: '/recovery/history',  icon: History,         label: 'Collection History' },
]

export default function RecoveryLayout() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await logout(); toast.success('Logged out'); navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex flex-col
        transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0
      `}>
        <div className="p-4 border-b border-gray-700 flex items-center gap-3">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center font-bold text-sm">R</div>
          <div>
            <p className="font-semibold text-sm">ARY Cash Portal</p>
            <p className="text-xs text-gray-400">Recovery Panel</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive ? 'bg-brand text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
              <Icon size={18} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-700">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold">
              {profile?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.name}</p>
              <p className="text-xs text-gray-400">Recovery Officer</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 lg:hidden">
          <button onClick={() => setOpen(true)} className="p-1 rounded-lg hover:bg-gray-100"><Menu size={20} /></button>
          <span className="font-semibold text-gray-800">Recovery Panel</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6"><Outlet /></main>
      </div>
    </div>
  )
}
