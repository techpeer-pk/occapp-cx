import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import { History } from 'lucide-react'

export default function RecoveryHistory() {
  const { user }  = useAuth()
  const [cols,    setCols]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'collections'), where('recoveryUid', '==', user.uid))
    const unsub = onSnapshot(q, snap => {
      setCols(snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
      )
      setLoading(false)
    })
    return unsub
  }, [user])

  const fmt = (n) => `Rs. ${Number(n).toLocaleString('en-PK')}`
  const total = cols.reduce((s, c) => s + (c.amount ?? 0), 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Collection History</h1>
        <p className="text-sm text-gray-500 mt-1">{cols.length} pickups · Total: <span className="font-semibold text-gray-700">{fmt(total)}</span></p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : cols.length === 0 ? (
        <div className="card text-center py-16">
          <History className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="text-gray-500">No collections yet.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Date','Kiosk','Merchant','BDO','Amount','Entries','Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cols.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {c.createdAt?.toDate ? format(c.createdAt.toDate(), 'dd MMM yyyy, HH:mm') : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-gray-800">{c.kioskCode}</td>
                    <td className="px-4 py-3 text-gray-600">{c.merchantName}</td>
                    <td className="px-4 py-3 text-gray-600">{c.bdoName}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{fmt(c.amount)}</td>
                    <td className="px-4 py-3 text-gray-600">{c.txIds?.length ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={c.status === 'deposited' ? 'badge-green' : 'badge-blue'}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
