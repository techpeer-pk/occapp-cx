import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Login from './pages/Login'
import AdminLayout   from './layouts/AdminLayout'
import BDOLayout     from './layouts/BDOLayout'
import RecoveryLayout from './layouts/RecoveryLayout'
import AccountsLayout from './layouts/AccountsLayout'

// Admin pages
import AdminDashboard  from './pages/admin/Dashboard'
import Merchants       from './pages/admin/Merchants'
import Kiosks          from './pages/admin/Kiosks'
import Users           from './pages/admin/Users'
import TopupTypes      from './pages/admin/TopupTypes'
import AdminReports    from './pages/admin/Reports'

// BDO pages
import BDODashboard      from './pages/bdo/Dashboard'
import NewTransaction    from './pages/bdo/NewTransaction'
import BDOTransactions   from './pages/bdo/Transactions'

// Recovery pages
import RecoveryDashboard from './pages/recovery/Dashboard'
import PendingPickups    from './pages/recovery/PendingPickups'
import RecoveryHistory   from './pages/recovery/History'

// Accounts pages
import AccountsDashboard from './pages/accounts/Dashboard'
import Deposits          from './pages/accounts/Deposits'
import Reconciliation    from './pages/accounts/Reconciliation'

function RoleRouter() {
  const { profile } = useAuth()

  if (!profile) return <Navigate to="/login" replace />

  const roleMap = {
    admin:    '/admin',
    bdo:      '/bdo',
    recovery: '/recovery',
    accounts: '/accounts',
  }

  return <Navigate to={roleMap[profile.role] ?? '/login'} replace />
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile } = useAuth()
  if (!user)    return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(profile?.role))
    return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/"      element={<RoleRouter />} />

      {/* ── Admin ── */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index          element={<AdminDashboard />} />
        <Route path="merchants"   element={<Merchants />} />
        <Route path="kiosks"      element={<Kiosks />} />
        <Route path="users"       element={<Users />} />
        <Route path="topup-types" element={<TopupTypes />} />
        <Route path="reports"     element={<AdminReports />} />
      </Route>

      {/* ── BDO ── */}
      <Route path="/bdo" element={
        <ProtectedRoute allowedRoles={['bdo']}>
          <BDOLayout />
        </ProtectedRoute>
      }>
        <Route index               element={<BDODashboard />} />
        <Route path="new"          element={<NewTransaction />} />
        <Route path="transactions" element={<BDOTransactions />} />
      </Route>

      {/* ── Recovery Officer ── */}
      <Route path="/recovery" element={
        <ProtectedRoute allowedRoles={['recovery']}>
          <RecoveryLayout />
        </ProtectedRoute>
      }>
        <Route index          element={<RecoveryDashboard />} />
        <Route path="pending" element={<PendingPickups />} />
        <Route path="history" element={<RecoveryHistory />} />
      </Route>

      {/* ── Accounts ── */}
      <Route path="/accounts" element={
        <ProtectedRoute allowedRoles={['accounts']}>
          <AccountsLayout />
        </ProtectedRoute>
      }>
        <Route index                element={<AccountsDashboard />} />
        <Route path="deposits"      element={<Deposits />} />
        <Route path="reconciliation" element={<Reconciliation />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
