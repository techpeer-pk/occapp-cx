import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import AdminLayout    from './layouts/AdminLayout'
import BDOLayout      from './layouts/BDOLayout'
import RecoveryLayout from './layouts/RecoveryLayout'
import AccountsLayout from './layouts/AccountsLayout'

// Auth pages — loaded immediately, always needed
import Login  from './pages/Login'
import Signup from './pages/Signup'

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const Merchants      = lazy(() => import('./pages/admin/Merchants'))
const Kiosks         = lazy(() => import('./pages/admin/Kiosks'))
const Users          = lazy(() => import('./pages/admin/Users'))
const TopupTypes     = lazy(() => import('./pages/admin/TopupTypes'))
const PaymentModes   = lazy(() => import('./pages/admin/PaymentModes'))
const AdminReports   = lazy(() => import('./pages/admin/Reports'))

// BDO pages
const BDODashboard    = lazy(() => import('./pages/bdo/Dashboard'))
const NewTransaction  = lazy(() => import('./pages/bdo/NewTransaction'))
const BDOTransactions = lazy(() => import('./pages/bdo/Transactions'))

// Recovery pages
const RecoveryDashboard = lazy(() => import('./pages/recovery/Dashboard'))
const PendingPickups    = lazy(() => import('./pages/recovery/PendingPickups'))
const RecoveryHistory   = lazy(() => import('./pages/recovery/History'))

// Accounts pages
const AccountsDashboard = lazy(() => import('./pages/accounts/Dashboard'))
const Deposits          = lazy(() => import('./pages/accounts/Deposits'))
const Reconciliation    = lazy(() => import('./pages/accounts/Reconciliation'))

// Shared
const Profile = lazy(() => import('./pages/Profile'))

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center py-20 text-gray-400 text-sm">
      Loading...
    </div>
  )
}

function RoleRouter() {
  const { profile } = useAuth()
  if (!profile) return <Navigate to="/login" replace />
  const roleMap = { admin: '/admin', bdo: '/bdo', recovery: '/recovery', accounts: '/accounts' }
  return <Navigate to={roleMap[profile.role] ?? '/login'} replace />
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(profile?.role))
    return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/"       element={<RoleRouter />} />

        {/* Admin */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index                element={<AdminDashboard />} />
          <Route path="merchants"     element={<Merchants />} />
          <Route path="kiosks"        element={<Kiosks />} />
          <Route path="users"         element={<Users />} />
          <Route path="topup-types"   element={<TopupTypes />} />
          <Route path="payment-modes" element={<PaymentModes />} />
          <Route path="reports"       element={<AdminReports />} />
          <Route path="profile"       element={<Profile />} />
        </Route>

        {/* BDO */}
        <Route path="/bdo" element={
          <ProtectedRoute allowedRoles={['bdo']}>
            <BDOLayout />
          </ProtectedRoute>
        }>
          <Route index               element={<BDODashboard />} />
          <Route path="new"          element={<NewTransaction />} />
          <Route path="transactions" element={<BDOTransactions />} />
          <Route path="profile"      element={<Profile />} />
        </Route>

        {/* Recovery */}
        <Route path="/recovery" element={
          <ProtectedRoute allowedRoles={['recovery']}>
            <RecoveryLayout />
          </ProtectedRoute>
        }>
          <Route index          element={<RecoveryDashboard />} />
          <Route path="pending" element={<PendingPickups />} />
          <Route path="history" element={<RecoveryHistory />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Accounts */}
        <Route path="/accounts" element={
          <ProtectedRoute allowedRoles={['accounts']}>
            <AccountsLayout />
          </ProtectedRoute>
        }>
          <Route index                 element={<AccountsDashboard />} />
          <Route path="deposits"       element={<Deposits />} />
          <Route path="reconciliation" element={<Reconciliation />} />
          <Route path="profile"        element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
