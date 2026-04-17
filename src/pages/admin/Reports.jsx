import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { format, startOfDay, endOfDay, subDays } from 'date-fns'
import { FileBarChart, Download, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import Loader from '../../components/Loader'

const RANGES = [
  { label: 'Today',        days: 0  },
  { label: 'Last 7 Days',  days: 7  },
  { label: 'Last 30 Days', days: 30 },
]

function SortTh({ label, k, sortKey, sortDir, onSort }) {
  const active = sortKey === k
  return (
    <th onClick={() => onSort(k)}
      className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:bg-gray-100">
      <span className="flex items-center gap-1">
        {label}
        {active
          ? (sortDir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)
          : <ArrowUpDown size={11} className="opacity-30" />}
      </span>
    </th>
  )
}

export default function AdminReports() {
  const [range,   setRange]   = useState(0)
  const [loading, setLoading] = useState(false)
  const [rows,    setRows]    = useState([])
  const [summary, setSummary] = useState({ total: 0, pending: 0, collected: 0, deposited: 0 })
  const [search,  setSearch]  = useState('')
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('desc')

  const load = async (days) => {
    setLoading(true)
    const end   = endOfDay(new Date())
    const start = startOfDay(days === 0 ? new Date() : subDays(new Date(), days))

    const txSnap = await getDocs(
      query(
        collection(db, 'transactions'),
        where('createdAt', '>=', Timestamp.fromDate(start)),
        where('createdAt', '<=', Timestamp.fromDate(end)),
      )
    )

    const txRows = txSnap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      date:          d.data().createdAt?.toDate?.()   ?? new Date(0),
      collectedDate: d.data().collectedAt?.toDate?.() ?? null,
    }))

    const sum = (status) => txRows
      .filter(r => r.status === status)
      .reduce((s, r) => s + (r.amount ?? 0), 0)

    setSummary({
      total:     txRows.reduce((s, r) => s + (r.amount ?? 0), 0),
      pending:   sum('pending'),
      collected: sum('collected'),
      deposited: sum('deposited'),
    })
    setRows(txRows)
    setLoading(false)
  }

  useEffect(() => { load(range) }, [range])

  const onSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const displayed = rows
    .filter(r => {
      if (!search) return true
      const q = search.toLowerCase()
      return [r.id, r.bdoName, r.kioskCode, r.merchantName, r.topupTypeName,
              r.topupTypeCode, r.customerName, r.walletNumber, r.paymentMode,
              r.recoveryOfficer, r.status]
        .some(v => v && String(v).toLowerCase().includes(q))
    })
    .sort((a, b) => {
      let va, vb
      if      (sortKey === 'date')   { va = a.date?.getTime() ?? 0; vb = b.date?.getTime() ?? 0 }
      else if (sortKey === 'amount') { va = a.amount ?? 0;           vb = b.amount ?? 0          }
      else                           { va = String(a[sortKey] ?? ''); vb = String(b[sortKey] ?? '') }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ?  1 : -1
      return 0
    })

  const fmt  = (n) => `Rs. ${Number(n).toLocaleString('en-PK')}`
  const dash = (v) => v || '—'

  const exportCSV = () => {
    const esc = (v) => {
      const s = String(v ?? '')
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
    }
    const headers = '#ID,Date,BDO,Kiosk,Merchant,Type,Code,Amount,Customer,Wallet #,Payment Mode,Recovery Officer,Collected At,Remarks,Status'
    const lines   = displayed.map(r => [
      r.id,
      format(r.date, 'yyyy-MM-dd HH:mm'),
      esc(r.bdoName),
      esc(r.kioskCode),
      esc(r.merchantName),
      esc(r.topupTypeName),
      esc(r.topupTypeCode),
      r.amount,
      esc(r.customerName),
      r.walletNumber ?? '',
      esc(r.paymentMode),
      esc(r.recoveryOfficer),
      r.collectedDate ? format(r.collectedDate, 'yyyy-MM-dd HH:mm') : '',
      esc(r.remarks),
      r.status,
    ].join(','))
    const blob = new Blob([[headers, ...lines].join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `report_${format(new Date(), 'yyyyMMdd')}.csv`
    a.click()
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

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Entered', value: summary.total,     color: 'text-gray-800'   },
          { label: 'Pending',       value: summary.pending,   color: 'text-yellow-600' },
          { label: 'Collected',     value: summary.collected, color: 'text-blue-600'   },
          { label: 'Deposited',     value: summary.deposited, color: 'text-green-600'  },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{fmt(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      {!loading && rows.length > 0 && (
        <div className="relative mb-4 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search BDO, kiosk, customer, wallet…"
            className="input pl-8 py-1.5 text-sm w-full"
          />
          {search && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              {displayed.length} result{displayed.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <Loader rows={5} />
      ) : rows.length === 0 ? (
        <div className="card text-center py-16">
          <FileBarChart className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="text-gray-500">No transactions in this period.</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No results match "<span className="font-medium">{search}</span>"</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">#ID</th>
                  <SortTh label="Date"             k="date"            sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <SortTh label="BDO"              k="bdoName"         sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <SortTh label="Kiosk"            k="kioskCode"       sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <SortTh label="Merchant"         k="merchantName"    sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">Type</th>
                  <SortTh label="Amount"           k="amount"          sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <SortTh label="Customer"         k="customerName"    sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">Wallet #</th>
                  <SortTh label="Payment Mode"     k="paymentMode"     sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <SortTh label="Recovery Officer" k="recoveryOfficer" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">Collected At</th>
                  <SortTh label="Status"           k="status"          sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        #{r.id.slice(0, 7)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {format(r.date, 'dd MMM, HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-gray-800 whitespace-nowrap">{dash(r.bdoName)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{dash(r.kioskCode)}</td>
                    <td className="px-4 py-3 text-gray-600">{dash(r.merchantName)}</td>
                    <td className="px-4 py-3">
                      <span className="badge-blue">{r.topupTypeName}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{fmt(r.amount)}</td>
                    <td className="px-4 py-3 text-gray-600">{dash(r.customerName)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{dash(r.walletNumber)}</td>
                    <td className="px-4 py-3">
                      {r.paymentMode
                        ? <span className="badge-blue">{r.paymentMode}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{dash(r.recoveryOfficer)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {r.collectedDate ? format(r.collectedDate, 'dd MMM, HH:mm') : '—'}
                    </td>
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
