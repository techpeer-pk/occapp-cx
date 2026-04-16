import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { format } from 'date-fns'
import { Banknote, Clock, CheckCircle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AccountsDashboard() {
  const [pendingCols, setPendingCols] = useState([])   // collected but not deposited
  const [deposits,    setDeposits]    = useState([])

  useEffect(() => {
    const u1 = onSnapshot(
      query(collection(db, 'collections'), where('status', '==', 'collected')),
      snap => setPendingCols(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    const u2 = onSnapshot(collection(db, 'deposits'), snap => {
      setDeposits(snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
        .slice(0, 5)
      )
    })
    return () => { u1(); u2() }
  }, [])

  const pendingAmt  = pendingCols.reduce((s, c) => s + (c.amount ?? 0), 0)
  const depositedAmt = deposits.reduce((s, d) => s + (d.amount ?? 0), 0)
  const fmt = (n) => `Rs. ${Number(n).toLocaleString('en-PK')}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Accounts Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">{format(new Date(), 'd MMMM yyyy')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center"><Clock size={22} /></div>
          <div>
            <p className="text-sm text-gray-500">Awaiting Deposit</p>
            <p className="text-2xl font-bold text-gray-900">{fmt(pendingAmt)}</p>
            <p className="text-xs text-gray-400">{pendingCols.length} collections</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 col-span-2">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center"><CheckCircle size={22} /></div>
          <div>
            <p className="text-sm text-gray-500">Recent Deposits (shown below)</p>
            <p className="text-2xl font-bold text-gray-900">{fmt(depositedAmt)}</p>
          </div>
        </div>
      </div>

      {/* Pending collections */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Cash Awaiting Bank Deposit</h2>
          <Link to="/accounts/deposits" className="text-brand text-sm font-medium flex items-center gap-1 hover:underline">
            Manage Deposits <ArrowRight size={14} />
          </Link>
        </div>
        {pendingCols.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No pending cash. All deposited!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Recovery Officer','Kiosk','Merchant','Amount','Collected At'].map(h => (
                    <th key={h} className="text-left pb-3 text-xs font-medium text-gray-500 uppercase tracking-wide pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pendingCols.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-2.5 pr-4 text-gray-800">{c.recoveryName}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-gray-600">{c.kioskCode}</td>
                    <td className="py-2.5 pr-4 text-gray-600">{c.merchantName}</td>
                    <td className="py-2.5 pr-4 font-semibold text-gray-800">{fmt(c.amount)}</td>
                    <td className="py-2.5 text-gray-500 text-xs">
                      {c.createdAt?.toDate ? format(c.createdAt.toDate(), 'dd MMM, HH:mm') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent deposits */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Recent Bank Deposits</h2>
        {deposits.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No deposits recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {deposits.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                  <p className="font-medium text-gray-800">{d.bankName} — {d.slipNumber}</p>
                  <p className="text-xs text-gray-500">
                    {d.createdAt?.toDate ? format(d.createdAt.toDate(), 'dd MMM yyyy') : '—'} · By: {d.accountsName}
                  </p>
                </div>
                <span className="font-semibold text-green-600">{fmt(d.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
