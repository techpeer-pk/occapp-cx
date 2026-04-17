import { LayoutDashboard, PlusCircle, List } from 'lucide-react'
import AppLayout from './AppLayout'

const navItems = [
  { to: '/bdo',              icon: LayoutDashboard, label: 'Dashboard',      end: true },
  { to: '/bdo/new',          icon: PlusCircle,      label: 'New Entry'            },
  { to: '/bdo/transactions', icon: List,            label: 'My Transactions'      },
]

export default function BDOLayout() {
  return (
    <AppLayout
      navItems={navItems}
      panelLabel="BDO Panel"
      brandInitial="B"
      profileTo="/bdo/profile"
      subLabel={p => p?.kioskName ?? 'BDO'}
    />
  )
}
