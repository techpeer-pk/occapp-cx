import { LayoutDashboard, Clock, History } from 'lucide-react'
import AppLayout from './AppLayout'

const navItems = [
  { to: '/recovery',         icon: LayoutDashboard, label: 'Dashboard',        end: true },
  { to: '/recovery/pending', icon: Clock,           label: 'Pending Pickups'        },
  { to: '/recovery/history', icon: History,         label: 'Collection History'     },
]

export default function RecoveryLayout() {
  return (
    <AppLayout
      navItems={navItems}
      panelLabel="Recovery Panel"
      brandInitial="R"
      profileTo="/recovery/profile"
      subLabel={() => 'Recovery Officer'}
    />
  )
}
