import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import { Banknote, Clock, CheckCircle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function RecoveryDashboard() {
  const { user, profile } = useAuth()
  const [pending,   setPending]   = useState([])
  const [collected, setCollected] = useState([])

  useEffect(() => {
    // Pending: all transactions not yet collected (any BDO)
    const q1 = query(collection(db, 'transactions'), where('status', '==', 'pending'))
    const u1 = onSnapshot(q1, snap => {
      setPending(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    // Collections done by this officer
    const q2 = query(collection(db, 'collections'), where('recoveryUid', '==', user.uid))
    const u2 = onSnapshot(q2, snap => {
      setCollected(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    return () => { u1(); u2() }
  }, [user])

  const pendingAmt   = pending.reduce((s, d) => s + (d.amount ?? 0), 0)
  const collectedAmt = collected.reduce((s, d) => s + (d.amount ?? 0), 0)

  // Group pending by kiosk
  const byKiosk = pending.reduce((acc, t) => {
    const k = t.kioskCode || 'Unknown'
    if (!acc[k]) acc[k] = { kioskCode: k, merchantName: t.merchantName, bdoName: t.bdoName, count: 0, amount: 0 }
    acc[k].count  += 1
    acc[k].amount += t.amount ?? 0
    return acc
  }, {})

  const fmt = (n) => `Rs. ${Number(n).toLocaleString('en-PK')}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hi, {profile?.name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-gray-500 mt-1">Recovery Officer — {format(new Date(), 'd MMM yyyy')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center"><Clock size={22} /></div>
          <div>
            <p className="text-sm text-gray-500">Pending Collection</p>
            <p className="text-2xl font-bold text-gray-900">{fmt(pendingAmt)}</p>
            <p className="text-xs text-gray-400">{pending.length} transactions</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center"><CheckCircle size={22} /></div>
          <div>
            <p className="text-sm text-gray-500">My Collections</p>
            <p className="text-2xl font-bold text-gray-900">{fmt(collectedAmt)}</p>
            <p className="text-xs text-gray-400">{collected.length} pickups</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Banknote size={22} /></div>
          <div>
            <p className="text-sm text-gray-500">Pending Kiosks</p>
            <p className="text-2xl font-bold text-gray-900">{Object.keys(byKiosk).length}</p>
            <p className="text-xs text-gray-400">Locations to visit</p>
          </div>
        </div>
      </div>

      {/* Kiosk breakdown */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Pending by Kiosk</h2>
          <Link to="/recovery/pending" className="text-brand text-sm font-medium flex items-center gap-1 hover:underline">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        {Object.values(byKiosk).length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">All caught up! No pending collections.</p>
        ) : (
          <div className="space-y-3">
            {Object.values(byKiosk).map(k => (
              <div key={k.kioskCode} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                  <p className="font-medium text-gray-800">{k.kioskCode}</p>
                  <p className="text-xs text-gray-500">{k.merchantName} · BDO: {k.bdoName}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">{fmt(k.amount)}</p>
                  <p className="text-xs text-gray-500">{k.count} entries</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
