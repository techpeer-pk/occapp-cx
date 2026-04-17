import { LayoutDashboard, Landmark, GitMerge } from 'lucide-react'
import AppLayout from './AppLayout'

const navItems = [
  { to: '/accounts',                icon: LayoutDashboard, label: 'Dashboard',    end: true },
  { to: '/accounts/deposits',       icon: Landmark,        label: 'Bank Deposits'      },
  { to: '/accounts/reconciliation', icon: GitMerge,        label: 'Reconciliation'     },
]

export default function AccountsLayout() {
  return (
    <AppLayout
      navItems={navItems}
      panelLabel="Accounts Panel"
      brandInitial="Ac"
      profileTo="/accounts/profile"
      subLabel={() => 'Accounts'}
    />
  )
}
