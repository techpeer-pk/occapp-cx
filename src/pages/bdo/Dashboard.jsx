import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import { Banknote, Clock, CheckCircle, PlusCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function BDODashboard() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState({ pending: 0, collected: 0, todayCount: 0, todayAmount: 0 })
  const [recent, setRecent] = useState([])

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'transactions'), where('bdoUid', '==', user.uid))
    const unsub = onSnapshot(q, snap => {
      const docs  = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      const today = new Date().toDateString()

      const pending   = docs.filter(d => d.status === 'pending').reduce((s, d) => s + (d.amount ?? 0), 0)
      const collected = docs.filter(d => d.status !== 'pending').reduce((s, d) => s + (d.amount ?? 0), 0)
      const todayDocs = docs.filter(d => d.createdAt?.toDate?.().toDateString() === today)
      const todayAmt  = todayDocs.reduce((s, d) => s + (d.amount ?? 0), 0)

      setStats({ pending, collected, todayCount: todayDocs.length, todayAmount: todayAmt })
      setRecent(docs.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)).slice(0, 8))
    })
    return unsub
  }, [user])

  const fmt = (n) => `Rs. ${Number(n).toLocaleString('en-PK')}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hi, {profile?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-gray-500 mt-1">
            {profile?.kioskName
              ? `Kiosk: ${profile.kioskName}${profile.merchantName ? ` · ${profile.merchantName}` : ''}`
              : 'BDO Dashboard'} — {format(new Date(), 'd MMM yyyy')}
          </p>
        </div>
        <Link to="/bdo/new" className="btn-primary flex items-center gap-2">
          <PlusCircle size={16} /> New Entry
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: PlusCircle,   color: 'bg-blue-50 text-blue-600',   label: "Today's Entries",   value: stats.todayCount,  isCurrency: false },
          { icon: Banknote,     color: 'bg-brand/10 text-brand',     label: "Today's Amount",    value: stats.todayAmount, isCurrency: true  },
          { icon: Clock,        color: 'bg-yellow-50 text-yellow-600',label: 'Pending Recovery',  value: stats.pending,     isCurrency: true  },
          { icon: CheckCircle,  color: 'bg-green-50 text-green-600', label: 'Total Collected',   value: stats.collected,   isCurrency: true  },
        ].map(({ icon: Icon, color, label, value, isCurrency }) => (
          <div key={label} className="card flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-lg font-bold text-gray-900">
                {isCurrency ? fmt(value) : value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent transactions */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Recent Transactions</h2>
        {recent.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No transactions yet. <Link to="/bdo/new" className="text-brand underline">Add one now.</Link></p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Date','Type','Amount','Customer','Status'].map(h => (
                    <th key={h} className="text-left pb-3 font-medium text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="py-2.5 pr-4 text-gray-500 whitespace-nowrap text-xs">
                      {r.createdAt?.toDate ? format(r.createdAt.toDate(), 'dd MMM, HH:mm') : '—'}
                    </td>
                    <td className="py-2.5 pr-4"><span className="badge-blue">{r.topupTypeName}</span></td>
                    <td className="py-2.5 pr-4 font-medium text-gray-800">{fmt(r.amount)}</td>
                    <td className="py-2.5 pr-4 text-gray-600">{r.customerName || '—'}</td>
                    <td className="py-2.5">
                      <span className={{
                        pending:   'badge-yellow',
                        collected: 'badge-blue',
                        deposited: 'badge-green',
                      }[r.status] ?? 'badge-gray'}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
