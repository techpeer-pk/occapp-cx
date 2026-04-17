import { useEffect, useState } from 'react'
import {
  collection, query, where, onSnapshot,
  addDoc, writeBatch, doc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { CheckCircle, Clock, Banknote } from 'lucide-react'
import Loader from '../../components/Loader'

export default function PendingPickups() {
  const { user, profile } = useAuth()
  const [pending,      setPending]      = useState([])
  const [paymentModes, setPaymentModes] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [selected,     setSelected]     = useState(new Set())
  const [saving,       setSaving]       = useState(false)
  const [showModal,    setShowModal]    = useState(false)
  const [selectedMode, setSelectedMode] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'transactions'), where('status', '==', 'pending'))
    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0))
      setPending(docs)
      setLoading(false)
    })
    return unsub
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'paymentModes'), where('active', '==', true))
    const unsub = onSnapshot(q, snap => {
      setPaymentModes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  // Group by kiosk
  const grouped = pending.reduce((acc, t) => {
    const k = t.kioskId || 'unknown'
    if (!acc[k]) acc[k] = { kioskCode: t.kioskCode, merchantName: t.merchantName, bdoName: t.bdoName, bdoUid: t.bdoUid, kioskId: t.kioskId, txs: [] }
    acc[k].txs.push(t)
    return acc
  }, {})

  const toggleAll = (txs) => {
    const ids = txs.map(t => t.id)
    const allSelected = ids.every(id => selected.has(id))
    setSelected(prev => {
      const next = new Set(prev)
      if (allSelected) ids.forEach(id => next.delete(id))
      else             ids.forEach(id => next.add(id))
      return next
    })
  }

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const openCollectModal = () => {
    if (selected.size === 0) return toast.error('Select at least one transaction')
    setSelectedMode('')
    setShowModal(true)
  }

  const collectSelected = async () => {
    if (!selectedMode) return toast.error('Select a payment mode')
    setShowModal(false)
    setSaving(true)
    try {
      const toCollect = pending.filter(t => selected.has(t.id))
      const totalAmt  = toCollect.reduce((s, t) => s + (t.amount ?? 0), 0)

      // Group by kiosk for collection records
      const kioskGroups = toCollect.reduce((acc, t) => {
        const k = t.kioskId || 'unknown'
        if (!acc[k]) acc[k] = { ...grouped[k], txIds: [], amount: 0 }
        acc[k].txIds.push(t.id)
        acc[k].amount += t.amount ?? 0
        return acc
      }, {})

      const batch = writeBatch(db)

      // Update transaction statuses
      toCollect.forEach(t => {
        batch.update(doc(db, 'transactions', t.id), {
          status:           'collected',
          collectedAt:      serverTimestamp(),
          recoveryUid:      user.uid,
          recoveryOfficer:  profile.name,
          paymentMode:      selectedMode,
        })
      })

      await batch.commit()

      // Create collection records per kiosk
      for (const group of Object.values(kioskGroups)) {
        await addDoc(collection(db, 'collections'), {
          recoveryUid:     user.uid,
          recoveryName:    profile.name,
          kioskId:         group.kioskId,
          kioskCode:       group.kioskCode,
          merchantName:    group.merchantName,
          bdoName:         group.bdoName,
          bdoUid:          group.bdoUid,
          txIds:           group.txIds,
          amount:          group.amount,
          paymentMode:     selectedMode,
          status:          'collected',
          createdAt:       serverTimestamp(),
        })
      }

      toast.success(`Collected Rs. ${totalAmt.toLocaleString()} from ${selected.size} entries`)
      setSelected(new Set())
    } catch (e) {
      toast.error('Error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const fmt    = (n) => `Rs. ${Number(n).toLocaleString('en-PK')}`
  const selAmt = pending.filter(t => selected.has(t.id)).reduce((s, t) => s + (t.amount ?? 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Pickups</h1>
          <p className="text-sm text-gray-500 mt-1">{pending.length} transactions pending</p>
        </div>
        {selected.size > 0 && (
          <button onClick={openCollectModal} disabled={saving}
            className="btn-primary flex items-center gap-2">
            <CheckCircle size={16} />
            {saving ? 'Processing…' : `Collect ${selected.size} (${fmt(selAmt)})`}
          </button>
        )}
      </div>

      {loading ? (
        <Loader />
      ) : pending.length === 0 ? (
        <div className="card text-center py-16">
          <CheckCircle className="mx-auto mb-3 text-green-400" size={40} />
          <p className="text-gray-500 font-medium">All clear! No pending collections.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.values(grouped).map(group => {
            const groupTotal    = group.txs.reduce((s, t) => s + (t.amount ?? 0), 0)
            const allSelected   = group.txs.every(t => selected.has(t.id))
            return (
              <div key={group.kioskId} className="card p-0 overflow-hidden">
                {/* Kiosk header */}
                <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 accent-brand cursor-pointer"
                      checked={allSelected}
                      onChange={() => toggleAll(group.txs)} />
                    <div>
                      <span className="font-semibold text-gray-800">{group.kioskCode}</span>
                      <span className="text-gray-500 text-sm ml-2">— {group.merchantName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">{fmt(groupTotal)}</p>
                    <p className="text-xs text-gray-500">{group.txs.length} entries · BDO: {group.bdoName}</p>
                  </div>
                </div>

                {/* Transactions */}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="w-10 px-4 py-2"></th>
                      {['Date','Type','Amount','Customer','Wallet #'].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {group.txs.map(t => (
                      <tr key={t.id} className={`hover:bg-gray-50 ${selected.has(t.id) ? 'bg-brand/5' : ''}`}>
                        <td className="px-4 py-2">
                          <input type="checkbox" className="w-4 h-4 accent-brand cursor-pointer"
                            checked={selected.has(t.id)}
                            onChange={() => toggle(t.id)} />
                        </td>
                        <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">
                          {t.createdAt?.toDate ? format(t.createdAt.toDate(), 'dd MMM, HH:mm') : '—'}
                        </td>
                        <td className="px-3 py-2"><span className="badge-blue">{t.topupTypeCode}</span></td>
                        <td className="px-3 py-2 font-medium text-gray-800">{fmt(t.amount)}</td>
                        <td className="px-3 py-2 text-gray-600">{t.customerName || '—'}</td>
                        <td className="px-3 py-2 font-mono text-xs text-gray-500">{t.walletNumber || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      )}
      {/* Payment Mode Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2">
                <Banknote size={18} className="text-brand" />
                <h3 className="font-semibold text-gray-800">Select Payment Mode</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-gray-500">
                Collecting <span className="font-semibold text-gray-700">{selected.size} entries</span> worth <span className="font-semibold text-gray-700">{fmt(selAmt)}</span>. How will this cash move?
              </p>
              {paymentModes.length === 0 ? (
                <p className="text-sm text-red-500">No payment modes available. Ask admin to add some.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {paymentModes.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMode(m.name)}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        selectedMode === m.name
                          ? 'border-brand bg-brand/5 text-brand'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <p className="font-semibold text-sm">{m.name}</p>
                      {m.description && <p className="text-xs text-gray-400 mt-0.5">{m.description}</p>}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={collectSelected}
                  disabled={!selectedMode || paymentModes.length === 0}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} /> Confirm Collect
                </button>
                <button onClick={() => setShowModal(false)} className="btn-secondary px-5">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
