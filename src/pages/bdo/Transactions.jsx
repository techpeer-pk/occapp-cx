import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import { List } from 'lucide-react'

export default function BDOTransactions() {
  const { user } = useAuth()
  const [txs,     setTxs]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'transactions'), where('bdoUid', '==', user.uid))
    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
      setTxs(docs)
      setLoading(false)
    })
    return unsub
  }, [user])

  const filtered = filter === 'all' ? txs : txs.filter(t => t.status === filter)
  const fmt      = (n) => `Rs. ${Number(n).toLocaleString('en-PK')}`

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">{txs.length} total records</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {['all','pending','collected','deposited'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize
              ${filter === f ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <List className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="text-gray-500">No transactions found.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Date','Type','Amount','Wallet #','Customer','Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                      {r.createdAt?.toDate ? format(r.createdAt.toDate(), 'dd MMM yyyy, HH:mm') : '—'}
                    </td>
                    <td className="px-4 py-3"><span className="badge-blue">{r.topupTypeName} ({r.topupTypeCode})</span></td>
                    <td className="px-4 py-3 font-medium text-gray-800">{fmt(r.amount)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{r.walletNumber || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{r.customerName || '—'}</td>
                    <td className="px-4 py-3">
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
        </div>
      )}
    </div>
  )
}
