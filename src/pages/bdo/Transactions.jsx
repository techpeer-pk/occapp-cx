import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import { List, Search, ArrowUpDown, ArrowUp, ArrowDown, Plus, PlusCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Loader from '../../components/Loader'

function formatWallet(raw) {
  const digits = raw.replace(/\D/g, '')
  if (!digits.startsWith('92')) return '92'
  return digits.slice(0, 12)
}

function QuickAddModal({ onClose, user, profile }) {
  const [topupTypes, setTopupTypes] = useState([])
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: { walletNumber: '92' }
  })

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'topupTypes'), where('active', '==', true)),
      snap => setTopupTypes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return unsub
  }, [])

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const topupType = topupTypes.find(t => t.id === data.topupTypeId)
      await addDoc(collection(db, 'transactions'), {
        bdoUid:        user.uid,
        bdoName:       profile.name,
        kioskId:       profile.kioskId      ?? '',
        kioskCode:     profile.kioskName    ?? '',
        merchantName:  profile.merchantName ?? '',
        topupTypeId:   data.topupTypeId,
        topupTypeName: topupType?.name ?? '',
        topupTypeCode: topupType?.code ?? '',
        amount:        Number(data.amount),
        customerName:  data.customerName?.trim() ?? '',
        walletNumber:  data.walletNumber?.trim() ?? '',
        remarks:       data.remarks?.trim() ?? '',
        status:        'pending',
        createdAt:     serverTimestamp(),
      })
      toast.success('Transaction recorded!')
      reset({ walletNumber: '92' })
      onClose()
    } catch (e) {
      toast.error('Failed: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
          <div>
            <h3 className="font-semibold text-gray-800">New Cash Entry</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {profile?.kioskName || 'Your Kiosk'}{profile?.merchantName ? ` · ${profile.merchantName}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <div className="p-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Top-up Type *</label>
              <select className="input" {...register('topupTypeId', { required: 'Select type' })}>
                <option value="">— Select Type —</option>
                {topupTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                ))}
              </select>
              {errors.topupTypeId && <p className="text-red-500 text-xs mt-1">{errors.topupTypeId.message}</p>}
            </div>

            <div>
              <label className="label">Amount (PKR) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">Rs.</span>
                <input type="number" min="1" step="1" className="input pl-10" placeholder="0"
                  {...register('amount', { required: 'Amount required', min: { value: 1, message: 'Must be > 0' } })} />
              </div>
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Customer Name *</label>
                <input className="input" placeholder="Full name"
                  {...register('customerName', { required: 'Required' })} />
                {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>}
              </div>
              <div>
                <label className="label">ARY Wallet # *</label>
                <input className="input font-mono tracking-wide" placeholder="92xxxxxxxxxx" maxLength={12}
                  {...register('walletNumber', {
                    required: 'Required',
                    validate: v => /^92\d{10}$/.test(v) || '12 digits starting with 92',
                  })}
                  onChange={e => setValue('walletNumber', formatWallet(e.target.value), { shouldValidate: true })}
                />
                {errors.walletNumber
                  ? <p className="text-red-500 text-xs mt-1">{errors.walletNumber.message}</p>
                  : <p className="text-gray-400 text-xs mt-1">92xxxxxxxxxx</p>}
              </div>
            </div>

            <div>
              <label className="label">Remarks</label>
              <input className="input" placeholder="Optional" {...register('remarks')} />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <PlusCircle size={16} />{saving ? 'Saving…' : 'Record Transaction'}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

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
  const { user, profile } = useAuth()
  const [txs,     setTxs]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')
  const [search,  setSearch]  = useState('')
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [modal,   setModal]   = useState(false)

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
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Entry
        </button>
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
        <Loader />
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

      {modal && (
        <QuickAddModal
          onClose={() => setModal(false)}
          user={user}
          profile={profile}
        />
      )}
    </div>
  )
}
