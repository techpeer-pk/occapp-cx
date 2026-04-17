import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import Loader from '../../components/Loader'

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export default function TopupTypes() {
  const [types,   setTypes]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null)   // null | 'add' | {edit: docId, data}
  const [saving,  setSaving]  = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'topupTypes'), snap => {
      setTypes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const openAdd = () => { reset({ name: '', code: '', description: '' }); setModal('add') }

  const openEdit = (t) => {
    setValue('name',        t.name)
    setValue('code',        t.code)
    setValue('description', t.description ?? '')
    setModal({ edit: t.id })
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const payload = {
        name:        data.name.trim(),
        code:        data.code.trim().toUpperCase(),
        description: data.description?.trim() ?? '',
        active:      true,
      }
      if (modal === 'add') {
        payload.createdAt = serverTimestamp()
        await addDoc(collection(db, 'topupTypes'), payload)
        toast.success('Top-up type added')
      } else {
        await updateDoc(doc(db, 'topupTypes', modal.edit), payload)
        toast.success('Top-up type updated')
      }
      setModal(null)
    } catch (e) {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (t) => {
    await updateDoc(doc(db, 'topupTypes', t.id), { active: !t.active })
    toast.success(`${t.name} ${t.active ? 'disabled' : 'enabled'}`)
  }

  const handleDelete = async (t) => {
    if (!window.confirm(`Delete "${t.name}"? This cannot be undone.`)) return
    await deleteDoc(doc(db, 'topupTypes', t.id))
    toast.success('Deleted')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Top-up Types</h1>
          <p className="text-sm text-gray-500 mt-1">Manage wallet top-up service types (SC, BookGold, etc.)</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Type
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : types.length === 0 ? (
        <div className="card text-center py-16">
          <Tag className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="text-gray-500">No top-up types yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map(t => (
            <div key={t.id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block bg-brand/10 text-brand text-xs font-bold px-2 py-0.5 rounded mb-1">
                    {t.code}
                  </span>
                  <p className="font-semibold text-gray-800">{t.name}</p>
                  {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
                </div>
                <span className={t.active ? 'badge-green' : 'badge-gray'}>
                  {t.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button onClick={() => openEdit(t)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={() => toggleActive(t)}
                  className="flex items-center gap-1 text-xs text-yellow-600 hover:text-yellow-800 font-medium">
                  {t.active ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => handleDelete(t)}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium ml-auto">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Add Top-up Type' : 'Edit Top-up Type'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Type Name *</label>
              <input className="input" placeholder="e.g. BookGold" {...register('name', { required: 'Name required' })} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Code * <span className="text-gray-400 font-normal">(short identifier)</span></label>
              <input className="input" placeholder="e.g. BG" {...register('code', { required: 'Code required' })} />
              {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
            </div>
            <div>
              <label className="label">Description <span className="text-gray-400 font-normal">(optional)</span></label>
              <input className="input" placeholder="Brief description" {...register('description')} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving…' : modal === 'add' ? 'Add Type' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
