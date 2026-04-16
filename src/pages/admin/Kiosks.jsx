import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react'

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

export default function Kiosks() {
  const [kiosks,    setKiosks]    = useState([])
  const [merchants, setMerchants] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(null)
  const [saving,    setSaving]    = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'kiosks'),    snap => {
      setKiosks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    const u2 = onSnapshot(collection(db, 'merchants'), snap => {
      setMerchants(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => { u1(); u2() }
  }, [])

  const openAdd = () => {
    reset({ kioskCode: '', locationDetail: '', merchantId: '' })
    setModal('add')
  }

  const openEdit = (k) => {
    setValue('kioskCode',      k.kioskCode)
    setValue('locationDetail', k.locationDetail ?? '')
    setValue('merchantId',     k.merchantId)
    setModal({ edit: k.id })
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const merchant = merchants.find(m => m.id === data.merchantId)
      const payload  = {
        kioskCode:      data.kioskCode.trim().toUpperCase(),
        locationDetail: data.locationDetail?.trim() ?? '',
        merchantId:     data.merchantId,
        merchantName:   merchant?.name ?? '',
        active:         true,
      }
      if (modal === 'add') {
        payload.createdAt = serverTimestamp()
        await addDoc(collection(db, 'kiosks'), payload)
        toast.success('Kiosk added')
      } else {
        await updateDoc(doc(db, 'kiosks', modal.edit), payload)
        toast.success('Kiosk updated')
      }
      setModal(null)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (k) => {
    if (!window.confirm(`Delete kiosk "${k.kioskCode}"?`)) return
    await deleteDoc(doc(db, 'kiosks', k.id))
    toast.success('Deleted')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kiosks</h1>
          <p className="text-sm text-gray-500 mt-1">Cash collection points at merchant locations</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Kiosk
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : kiosks.length === 0 ? (
        <div className="card text-center py-16">
          <MapPin className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="text-gray-500">No kiosks yet.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Kiosk Code','Merchant','Location','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {kiosks.map(k => (
                <tr key={k.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-gray-800">{k.kioskCode}</td>
                  <td className="px-4 py-3 text-gray-600">{k.merchantName || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{k.locationDetail || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={k.active ? 'badge-green' : 'badge-gray'}>
                      {k.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEdit(k)} className="text-blue-600 hover:text-blue-800"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(k)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Add Kiosk' : 'Edit Kiosk'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Kiosk Code *</label>
              <input className="input" placeholder="e.g. KHI-001"
                {...register('kioskCode', { required: 'Code required' })} />
              {errors.kioskCode && <p className="text-red-500 text-xs mt-1">{errors.kioskCode.message}</p>}
            </div>
            <div>
              <label className="label">Merchant *</label>
              <select className="input" {...register('merchantId', { required: 'Select merchant' })}>
                <option value="">— Select Merchant —</option>
                {merchants.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              {errors.merchantId && <p className="text-red-500 text-xs mt-1">{errors.merchantId.message}</p>}
            </div>
            <div>
              <label className="label">Location Detail</label>
              <input className="input" placeholder="Floor / Section / Address detail"
                {...register('locationDetail')} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving…' : modal === 'add' ? 'Add Kiosk' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
