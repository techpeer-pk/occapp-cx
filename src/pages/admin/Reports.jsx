import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { format, startOfDay, endOfDay, subDays } from 'date-fns'
import { FileBarChart, Download } from 'lucide-react'

const RANGES = [
  { label: 'Today',      days: 0 },
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
]

export default function AdminReports() {
  const [range,     setRange]     = useState(0)
  const [loading,   setLoading]   = useState(false)
  const [rows,      setRows]      = useState([])
  const [summary,   setSummary]   = useState({ total: 0, collected: 0, deposited: 0, pending: 0 })

  const load = async (days) => {
    setLoading(true)
    const end   = endOfDay(new Date())
    const start = startOfDay(days === 0 ? new Date() : subDays(new Date(), days))
    const ts    = Timestamp.fromDate(start)
    const te    = Timestamp.fromDate(end)

    const [txSnap, colSnap, depSnap] = await Promise.all([
      getDocs(query(collection(db, 'transactions'), where('createdAt', '>=', ts), where('createdAt', '<=', te))),
      getDocs(query(collection(db, 'collections'),  where('createdAt', '>=', ts), where('createdAt', '<=', te))),
      getDocs(query(collection(db, 'deposits'),     where('createdAt', '>=', ts), where('createdAt', '<=', te))),
    ])

    const txTotal  = txSnap.docs.reduce((s, d) =>  s + (d.data().amount ?? 0), 0)
    const colTotal = colSnap.docs.reduce((s, d) => s + (d.data().amount ?? 0), 0)
    const depTotal = depSnap.docs.reduce((s, d) => s + (d.data().amount ?? 0), 0)

    setSummary({ total: txTotal, collected: colTotal, deposited: depTotal, pending: txTotal - colTotal })

    const txRows = txSnap.docs.map(d => ({
      type: 'TX', ...d.data(),
      date: d.data().createdAt?.toDate?.() ?? new Date(),
    }))
    setRows(txRows.sort((a, b) => b.date - a.date))
    setLoading(false)
  }

  useEffect(() => { load(range) }, [range])

  const fmt = (n) => `Rs. ${Number(n).toLocaleString('en-PK')}`

  const exportCSV = () => {
    const headers = 'Date,BDO,Kiosk,Merchant,Top-up Type,Amount,Status'
    const lines   = rows.map(r =>
      [format(r.date, 'yyyy-MM-dd HH:mm'), r.bdoName, r.kioskCode, r.merchantName, r.topupTypeName, r.amount, r.status].join(',')
    )
    const blob = new Blob([[headers, ...lines].join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url
    a.download = `report_${format(new Date(), 'yyyyMMdd')}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Collection & reconciliation reports</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Range selector */}
      <div className="flex gap-2 mb-6">
        {RANGES.map((r, i) => (
          <button key={i} onClick={() => setRange(r.days)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${range === r.days ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Entered',   value: summary.total,     color: 'text-gray-800' },
          { label: 'Collected',       value: summary.collected, color: 'text-green-600' },
          { label: 'Deposited',       value: summary.deposited, color: 'text-blue-600'  },
          { label: 'Pending',         value: summary.pending,   color: 'text-yellow-600'},
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{fmt(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="card text-center py-16">
          <FileBarChart className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="text-gray-500">No transactions in this period.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Date','BDO','Kiosk','Merchant','Type','Amount','Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{format(r.date, 'dd MMM, HH:mm')}</td>
                    <td className="px-4 py-3 text-gray-800">{r.bdoName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{r.kioskCode}</td>
                    <td className="px-4 py-3 text-gray-600">{r.merchantName}</td>
                    <td className="px-4 py-3">
                      <span className="badge-blue">{r.topupTypeName}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{fmt(r.amount)}</td>
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
