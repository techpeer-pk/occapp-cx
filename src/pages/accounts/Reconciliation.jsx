import { useEffect, useState } from 'react'
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { format, startOfDay, endOfDay, subDays } from 'date-fns'
import { GitMerge, CheckCircle, AlertCircle } from 'lucide-react'

export default function Reconciliation() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [days,    setDays]    = useState(0)

  const load = async (d) => {
    setLoading(true)
    const end   = Timestamp.fromDate(endOfDay(new Date()))
    const start = Timestamp.fromDate(startOfDay(d === 0 ? new Date() : subDays(new Date(), d)))

    const [txSnap, colSnap, depSnap] = await Promise.all([
      getDocs(query(collection(db, 'transactions'), where('createdAt', '>=', start), where('createdAt', '<=', end))),
      getDocs(query(collection(db, 'collections'),  where('createdAt', '>=', start), where('createdAt', '<=', end))),
      getDocs(query(collection(db, 'deposits'),     where('createdAt', '>=', start), where('createdAt', '<=', end))),
    ])

    const txTotal    = txSnap.docs.reduce((s, d) =>  s + (d.data().amount ?? 0), 0)
    const colTotal   = colSnap.docs.reduce((s, d) => s + (d.data().amount ?? 0), 0)
    const depTotal   = depSnap.docs.reduce((s, d) => s + (d.data().amount ?? 0), 0)
    const txPending  = txSnap.docs.filter(d => d.data().status === 'pending').reduce((s, d) => s + (d.data().amount ?? 0), 0)

    // BDO breakdown
    const bdoMap = {}
    txSnap.docs.forEach(doc => {
      const d = doc.data()
      const k = d.bdoUid
      if (!bdoMap[k]) bdoMap[k] = { name: d.bdoName, kiosk: d.kioskCode, entered: 0, collected: 0 }
      bdoMap[k].entered   += d.amount ?? 0
      if (d.status !== 'pending') bdoMap[k].collected += d.amount ?? 0
    })

    setData({ txTotal, colTotal, depTotal, txPending, txCount: txSnap.size, colCount: colSnap.size, depCount: depSnap.size, bdoMap })
    setLoading(false)
  }

  useEffect(() => { load(days) }, [days])

  const fmt = (n) => `Rs. ${Number(n).toLocaleString('en-PK')}`

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reconciliation</h1>
        <p className="text-sm text-gray-500 mt-1">Cash flow reconciliation across all stages</p>
      </div>

      <div className="flex gap-2 mb-6">
        {[{ l: 'Today', d: 0 }, { l: 'Last 7 Days', d: 7 }, { l: 'Last 30 Days', d: 30 }].map(r => (
          <button key={r.d} onClick={() => setDays(r.d)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${days === r.d ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {r.l}
          </button>
        ))}
      </div>

      {loading || !data ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : (
        <div className="space-y-6">
          {/* Pipeline */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-5">Cash Pipeline</h2>
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              {[
                { label: 'BDO Entries',        value: data.txTotal,   count: `${data.txCount} tx`,   color: 'border-blue-400 bg-blue-50'   },
                { label: 'Recovery Collected', value: data.colTotal,  count: `${data.colCount} pickups`, color: 'border-yellow-400 bg-yellow-50' },
                { label: 'Bank Deposited',     value: data.depTotal,  count: `${data.depCount} deposits`, color: 'border-green-400 bg-green-50' },
                { label: 'Still Pending',      value: data.txPending, count: 'not collected', color: 'border-red-300 bg-red-50' },
              ].map((s, i) => (
                <div key={i} className={`flex-1 border-l-4 rounded-lg p-4 ${s.color}`}>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.label}</p>
                  <p className="text-xl font-bold text-gray-800 mt-1">{fmt(s.value)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.count}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Gap analysis */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4">Gap Analysis</h2>
            <div className="space-y-3">
              {[
                {
                  label: 'BDO Entered vs Recovery Collected',
                  diff:  data.txTotal - data.txPending - data.colTotal,
                  ok:    Math.abs(data.txTotal - data.txPending - data.colTotal) < 1,
                },
                {
                  label: 'Recovery Collected vs Bank Deposited',
                  diff:  data.colTotal - data.depTotal,
                  ok:    data.colTotal === data.depTotal,
                },
              ].map((g, i) => (
                <div key={i} className={`flex items-center justify-between p-4 rounded-lg ${g.ok ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-3">
                    {g.ok
                      ? <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                      : <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
                    }
                    <span className="text-sm font-medium text-gray-700">{g.label}</span>
                  </div>
                  <span className={`font-semibold ${g.ok ? 'text-green-600' : 'text-red-600'}`}>
                    {g.ok ? 'Balanced' : `Gap: ${fmt(Math.abs(g.diff))}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* BDO Breakdown */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4">BDO-wise Breakdown</h2>
            {Object.values(data.bdoMap).length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No data for this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['BDO','Kiosk','Entered','Collected','Pending'].map(h => (
                        <th key={h} className="text-left pb-3 pr-4 text-xs font-medium text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {Object.values(data.bdoMap).map((b, i) => {
                      const pending = b.entered - b.collected
                      return (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="py-2.5 pr-4 font-medium text-gray-800">{b.name}</td>
                          <td className="py-2.5 pr-4 font-mono text-xs text-gray-600">{b.kiosk}</td>
                          <td className="py-2.5 pr-4 text-gray-800">{fmt(b.entered)}</td>
                          <td className="py-2.5 pr-4 text-green-700">{fmt(b.collected)}</td>
                          <td className="py-2.5">
                            <span className={pending > 0 ? 'badge-yellow' : 'badge-green'}>
                              {fmt(pending)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
