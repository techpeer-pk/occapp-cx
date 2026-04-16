import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import { History, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

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

export default function RecoveryHistory() {
  const { user }  = useAuth()
  const [cols,    setCols]    = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    const q = query(collection(db, 'collections'), where('recoveryUid', '==', user.uid))
    const unsub = onSnapshot(q, snap => {
      setCols(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        date: d.data().createdAt?.toDate?.() ?? new Date(0),
      })))
      setLoading(false)
    })
    return unsub
  }, [user])

  const onSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const displayed = cols
    .filter(c => {
      if (!search) return true
      const q = search.toLowerCase()
      return [c.id, c.kioskCode, c.merchantName, c.bdoName, c.paymentMode, c.status]
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

  const fmt   = (n) => `Rs. ${Number(n).toLocaleString('en-PK')}`
  const total = cols.reduce((s, c) => s + (c.amount ?? 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collection History</h1>
          <p className="text-sm text-gray-500 mt-1">
            {displayed.length} of {cols.length} pickups · Total: <span className="font-semibold text-gray-700">{fmt(total)}</span>
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search kiosk, merchant, BDO…"
          className="input pl-8 py-1.5 text-sm w-full"
        />
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : displayed.length === 0 ? (
        <div className="card text-center py-16">
          <History className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="text-gray-500">{search ? 'No results found.' : 'No collections yet.'}</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">#ID</th>
                  <SortTh label="Date"     k="date"        sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <SortTh label="Kiosk"    k="kioskCode"   sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <SortTh label="Merchant" k="merchantName" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <SortTh label="BDO"      k="bdoName"     sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <SortTh label="Amount"   k="amount"      sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">Entries</th>
                  <SortTh label="Mode"     k="paymentMode" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <SortTh label="Status"   k="status"      sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        #{c.id.slice(0, 7)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {c.date ? format(c.date, 'dd MMM yyyy, HH:mm') : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-gray-800">{c.kioskCode}</td>
                    <td className="px-4 py-3 text-gray-600">{c.merchantName || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.bdoName}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{fmt(c.amount)}</td>
                    <td className="px-4 py-3 text-gray-600 text-center">{c.txIds?.length ?? 0}</td>
                    <td className="px-4 py-3">
                      {c.paymentMode
                        ? <span className="badge-blue">{c.paymentMode}</span>
                        : <span className="text-gray-400">—</span>}
                    </td>
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
