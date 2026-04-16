import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { format, startOfDay, endOfDay } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  Banknote, Store, MapPin, Users, TrendingUp, Clock, CheckCircle
} from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red:    'bg-red-50 text-red-600',
    brand:  'bg-red-50 text-brand',
  }
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    todayTx: 0, todayAmount: 0,
    pendingCollection: 0,
    totalMerchants: 0, totalKiosks: 0, totalUsers: 0,
    deposited: 0,
  })
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    const today = new Date()
    const start = Timestamp.fromDate(startOfDay(today))
    const end   = Timestamp.fromDate(endOfDay(today))

    // Today's transactions
    const q1 = query(collection(db, 'transactions'),
      where('createdAt', '>=', start), where('createdAt', '<=', end))
    const u1 = onSnapshot(q1, snap => {
      const docs = snap.docs.map(d => d.data())
      setStats(s => ({
        ...s,
        todayTx:     docs.length,
        todayAmount: docs.reduce((sum, d) => sum + (d.amount ?? 0), 0),
      }))
    })

    // Pending collections (transactions not yet collected)
    const q2 = query(collection(db, 'transactions'), where('status', '==', 'pending'))
    const u2 = onSnapshot(q2, snap => {
      const docs = snap.docs.map(d => d.data())
      setStats(s => ({
        ...s,
        pendingCollection: docs.reduce((sum, d) => sum + (d.amount ?? 0), 0),
      }))
    })

    // Merchants, Kiosks, Users
    const u3 = onSnapshot(collection(db, 'merchants'), s =>
      setStats(st => ({ ...st, totalMerchants: s.size })))
    const u4 = onSnapshot(collection(db, 'kiosks'), s =>
      setStats(st => ({ ...st, totalKiosks: s.size })))
    const u5 = onSnapshot(collection(db, 'users'), s =>
      setStats(st => ({ ...st, totalUsers: s.size })))

    // Deposited amount (all time)
    const u6 = onSnapshot(collection(db, 'deposits'), snap => {
      const docs = snap.docs.map(d => d.data())
      setStats(s => ({
        ...s,
        deposited: docs.reduce((sum, d) => sum + (d.amount ?? 0), 0),
      }))
    })

    return () => { u1(); u2(); u3(); u4(); u5(); u6() }
  }, [])

  // Last 7 days chart
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'transactions'), snap => {
      const map = {}
      for (let i = 6; i >= 0; i--) {
        const d   = new Date(); d.setDate(d.getDate() - i)
        const key = format(d, 'MMM d')
        map[key]  = 0
      }
      snap.docs.forEach(doc => {
        const d    = doc.data()
        const date = d.createdAt?.toDate?.()
        if (!date) return
        const key  = format(date, 'MMM d')
        if (key in map) map[key] += d.amount ?? 0
      })
      setChartData(Object.entries(map).map(([date, amount]) => ({ date, amount })))
    })
    return unsub
  }, [])

  const fmt = (n) => `Rs. ${n.toLocaleString('en-PK')}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview — {format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp}   color="brand"  label="Today's Collection" value={fmt(stats.todayAmount)} sub={`${stats.todayTx} transactions`} />
        <StatCard icon={Clock}        color="yellow" label="Pending Recovery"   value={fmt(stats.pendingCollection)} sub="Not yet collected" />
        <StatCard icon={CheckCircle}  color="green"  label="Total Deposited"    value={fmt(stats.deposited)} sub="All-time bank deposits" />
        <StatCard icon={Banknote}     color="blue"   label="Total Merchants"    value={stats.totalMerchants} sub={`${stats.totalKiosks} kiosks`} />
      </div>

      {/* Chart */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Collection — Last 7 Days</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => [`Rs. ${v.toLocaleString()}`, 'Amount']} />
            <Bar dataKey="amount" fill="#c8102e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Store} color="blue"  label="Total Merchants" value={stats.totalMerchants} />
        <StatCard icon={MapPin} color="green" label="Total Kiosks"   value={stats.totalKiosks} />
        <StatCard icon={Users} color="yellow" label="Total Users"    value={stats.totalUsers} />
      </div>
    </div>
  )
}
