import { LayoutDashboard, Store, MapPin, Users, Tag, FileBarChart, Banknote } from 'lucide-react'
import AppLayout from './AppLayout'

const navItems = [
  { to: '/admin',               icon: LayoutDashboard, label: 'Dashboard',   end: true },
  { to: '/admin/merchants',     icon: Store,           label: 'Merchants'         },
  { to: '/admin/kiosks',        icon: MapPin,          label: 'Kiosks'            },
  { to: '/admin/users',         icon: Users,           label: 'Users'             },
  { to: '/admin/topup-types',   icon: Tag,             label: 'Top-up Types'  },
  { to: '/admin/payment-modes', icon: Banknote,        label: 'Payment Modes' },
  { to: '/admin/reports',       icon: FileBarChart,    label: 'Reports'       },
]

export default function AdminLayout() {
  return (
    <AppLayout
      navItems={navItems}
      panelLabel="Admin Panel"
      brandInitial="A"
      profileTo="/admin/profile"
      subLabel={p => p?.role ?? 'admin'}
    />
  )
}
