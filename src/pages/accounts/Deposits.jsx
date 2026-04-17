import { useEffect, useState } from 'react'
import {
  collection, query, where, onSnapshot,
  addDoc, writeBatch, doc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Landmark, Plus, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import Loader from '../../components/Loader'

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

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export default function Deposits() {
  const { user, profile }   = useAuth()
  const [pendingCols, setPendingCols] = useState([])
  const [deposits,    setDeposits]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [selected,    setSelected]    = useState(new Set())
  const [modal,       setModal]       = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [search,      setSearch]      = useState('')
  const [sortKey,     setSortKey]     = useState('date')
  const [sortDir,     setSortDir]     = useState('desc')

  const { register, handleSubmit, formState: { errors } } = useForm()

  useEffect(() => {
    const u1 = onSnapshot(
      query(collection(db, 'collections'), where('status', '==', 'collected')),
      snap => setPendingCols(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    const u2 = onSnapshot(collection(db, 'deposits'), snap => {
      setDeposits(snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
      )
      setLoading(false)
    })
    return () => { u1(); u2() }
  }, [])

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })

  const selCols   = pendingCols.filter(c => selected.has(c.id))
  const selAmount = selCols.reduce((s, c) => s + (c.amount ?? 0), 0)

  const onSubmit = async (data) => {
    if (selCols.length === 0) return toast.error('Select collections to deposit')
    setSaving(true)
    try {
      const colIds    = selCols.map(c => c.id)
      const txIds     = selCols.flatMap(c => c.txIds ?? [])

      await addDoc(collection(db, 'deposits'), {
        accountsUid:  user.uid,
        accountsName: profile.name,
        collectionIds: colIds,
        txIds,
        amount:       selAmount,
        bankName:     data.bankName.trim(),
        slipNumber:   data.slipNumber.trim(),
        remarks:      data.remarks?.trim() ?? '',
        createdAt:    serverTimestamp(),
      })

      // Update collections and transactions status to 'deposited'
      const batch = writeBatch(db)
      colIds.forEach(id => batch.update(doc(db, 'collections', id), { status: 'deposited', depositedAt: serverTimestamp() }))
      txIds.forEach(id  => batch.update(doc(db, 'transactions', id), { status: 'deposited',  depositedAt: serverTimestamp() }))
      await batch.commit()

      toast.success(`Rs. ${selAmount.toLocaleString()} deposited!`)
      setSelected(new Set()); setModal(false)
    } catch (e) {
      toast.error('Error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const fmt = (n) => `Rs. ${Number(n).toLocaleString('en-PK')}`

  const onSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const displayedDeposits = deposits
    .filter(d => {
      if (!search) return true
      const q = search.toLowerCase()
      return [d.id, d.bankName, d.slipNumber, d.accountsName, d.remarks]
        .some(v => v && String(v).toLowerCase().includes(q))
    })
    .sort((a, b) => {
      let va, vb
      if      (sortKey === 'date')   { va = a.createdAt?.seconds ?? 0; vb = b.createdAt?.seconds ?? 0 }
      else if (sortKey === 'amount') { va = a.amount ?? 0;              vb = b.amount ?? 0             }
      else                           { va = String(a[sortKey] ?? '');   vb = String(b[sortKey] ?? '')  }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ?  1 : -1
      return 0
    })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Deposits</h1>
          <p className="text-sm text-gray-500 mt-1">Mark collected cash as bank deposited</p>
        </div>
        {selected.size > 0 && (
          <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Record Deposit ({fmt(selAmount)})
          </button>
        )}
      </div>

      {/* Pending collections to deposit */}
      {pendingCols.length > 0 && (
        <div className="card mb-6">
          <h2 className="font-semibold text-gray-800 mb-3">Collections Awaiting Deposit</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="w-10 pb-3"></th>
                  {['Recovery Officer','Kiosk','Merchant','Amount','Collected At'].map(h => (
                    <th key={h} className="text-left pb-3 pr-4 text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pendingCols.map(c => (
                  <tr key={c.id} className={`hover:bg-gray-50 ${selected.has(c.id) ? 'bg-brand/5' : ''}`}>
                    <td className="pb-0 pt-2.5">
                      <input type="checkbox" className="w-4 h-4 accent-brand cursor-pointer"
                        checked={selected.has(c.id)} onChange={() => toggle(c.id)} />
                    </td>
                    <td className="py-2.5 pr-4 text-gray-800">{c.recoveryName}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-gray-600">{c.kioskCode}</td>
                    <td className="py-2.5 pr-4 text-gray-600">{c.merchantName}</td>
                    <td className="py-2.5 pr-4 font-semibold text-gray-800">{fmt(c.amount)}</td>
                    <td className="py-2.5 text-xs text-gray-500">
                      {c.createdAt?.toDate ? format(c.createdAt.toDate(), 'dd MMM, HH:mm') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deposit history */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <h2 className="font-semibold text-gray-800">Deposit History</h2>
          {deposits.length > 0 && (
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search bank, slip…"
                className="input pl-8 py-1.5 text-sm w-52"
              />
            </div>
          )}
        </div>
        {loading ? <Loader inline rows={4} />
          : deposits.length === 0 ? (
            <div className="text-center py-16">
              <Landmark className="mx-auto mb-3 text-gray-300" size={40} />
              <p className="text-gray-500">No deposits recorded yet.</p>
            </div>
          ) : displayedDeposits.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No results match "{search}"</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">#ID</th>
                    <SortTh label="Date"        k="date"         sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                    <SortTh label="Bank"        k="bankName"     sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                    <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">Slip #</th>
                    <SortTh label="Amount"      k="amount"       sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                    <SortTh label="Recorded By" k="accountsName" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                    <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayedDeposits.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          #{d.id.slice(0, 7)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {d.createdAt?.toDate ? format(d.createdAt.toDate(), 'dd MMM yyyy, HH:mm') : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-800">{d.bankName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{d.slipNumber}</td>
                      <td className="px-4 py-3 font-semibold text-green-700">{fmt(d.amount)}</td>
                      <td className="px-4 py-3 text-gray-600">{d.accountsName}</td>
                      <td className="px-4 py-3 text-gray-500">{d.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {modal && (
        <Modal title="Record Bank Deposit" onClose={() => setModal(false)}>
          <p className="text-sm text-gray-600 mb-4">
            Depositing <span className="font-semibold text-gray-800">{fmt(selAmount)}</span> from {selCols.length} collection(s)
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Bank Name *</label>
              <input className="input" placeholder="e.g. HBL, MCB, UBL"
                {...register('bankName', { required: 'Bank name required' })} />
              {errors.bankName && <p className="text-red-500 text-xs mt-1">{errors.bankName.message}</p>}
            </div>
            <div>
              <label className="label">Slip / Reference Number *</label>
              <input className="input" placeholder="Deposit slip number"
                {...register('slipNumber', { required: 'Slip number required' })} />
              {errors.slipNumber && <p className="text-red-500 text-xs mt-1">{errors.slipNumber.message}</p>}
            </div>
            <div>
              <label className="label">Remarks</label>
              <input className="input" placeholder="Optional" {...register('remarks')} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving…' : 'Confirm Deposit'}
              </button>
              <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
