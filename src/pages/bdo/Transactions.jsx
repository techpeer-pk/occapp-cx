import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import { List, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

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

export default function BDOTransactions() {
  const { user } = useAuth()
  const [txs,     setTxs]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')
  const [search,  setSearch]  = useState('')
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'transactions'), where('bdoUid', '==', user.uid))
    const unsub = onSnapshot(q, snap => {
      setTxs(snap.docs.map(d => ({
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

  const displayed = txs
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => {
      if (!search) return true
      const q = search.toLowerCase()
      return [t.id, t.topupTypeName, t.topupTypeCode, t.walletNumber, t.customerName, t.status]
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

  const fmt = (n) => `Rs. ${Number(n).toLocaleString('en-PK')}`

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">{displayed.length} of {txs.length} records</p>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-2">
          {['all','pending','collected','deposited'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize
                ${filter === f ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search ID, customer, wallet…"
            className="input pl-8 py-1.5 text-sm w-60"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : displayed.length === 0 ? (
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
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">#ID</th>
                  <SortTh label="Date"   k="date"   sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">Type</th>
                  <SortTh label="Amount" k="amount" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">Wallet #</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">Customer</th>
                  <SortTh label="Status" k="status" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        #{r.id.slice(0, 7)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                      {r.date ? format(r.date, 'dd MMM yyyy, HH:mm') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge-blue">{r.topupTypeName} ({r.topupTypeCode})</span>
                    </td>
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
