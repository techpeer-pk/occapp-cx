import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Store } from 'lucide-react'
import Loader from '../../components/Loader'

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export default function Merchants() {
  const [merchants, setMerchants] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(null)
  const [saving,    setSaving]    = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'merchants'), snap => {
      setMerchants(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const openAdd = () => {
    reset({ name: '', contactPerson: '', phone: '', address: '', city: '' })
    setModal('add')
  }

  const openEdit = (m) => {
    setValue('name',          m.name)
    setValue('contactPerson', m.contactPerson ?? '')
    setValue('phone',         m.phone ?? '')
    setValue('address',       m.address ?? '')
    setValue('city',          m.city ?? '')
    setModal({ edit: m.id })
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const payload = {
        name:          data.name.trim(),
        contactPerson: data.contactPerson?.trim() ?? '',
        phone:         data.phone?.trim() ?? '',
        address:       data.address?.trim() ?? '',
        city:          data.city?.trim() ?? '',
        active:        true,
      }
      if (modal === 'add') {
        payload.createdAt = serverTimestamp()
        await addDoc(collection(db, 'merchants'), payload)
        toast.success('Merchant added')
      } else {
        await updateDoc(doc(db, 'merchants', modal.edit), payload)
        toast.success('Merchant updated')
      }
      setModal(null)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (m) => {
    if (!window.confirm(`Delete "${m.name}"?`)) return
    await deleteDoc(doc(db, 'merchants', m.id))
    toast.success('Deleted')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Merchants</h1>
          <p className="text-sm text-gray-500 mt-1">Business alliances with kiosks</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Merchant
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : merchants.length === 0 ? (
        <div className="card text-center py-16">
          <Store className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="text-gray-500">No merchants yet.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Merchant Name','Contact Person','Phone','City','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {merchants.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                  <td className="px-4 py-3 text-gray-600">{m.contactPerson || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{m.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{m.city || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={m.active ? 'badge-green' : 'badge-gray'}>
                      {m.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEdit(m)} className="text-blue-600 hover:text-blue-800">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(m)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Add Merchant' : 'Edit Merchant'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Merchant Name *</label>
                <input className="input" placeholder="e.g. Al-Habib General Store"
                  {...register('name', { required: 'Name required' })} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">Contact Person</label>
                <input className="input" placeholder="Name" {...register('contactPerson')} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" placeholder="03xx-xxxxxxx" {...register('phone')} />
              </div>
              <div className="col-span-2">
                <label className="label">Address</label>
                <input className="input" placeholder="Street address" {...register('address')} />
              </div>
              <div>
                <label className="label">City</label>
                <input className="input" placeholder="City" {...register('city')} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving…' : modal === 'add' ? 'Add Merchant' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
