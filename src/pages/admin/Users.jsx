import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp
} from 'firebase/firestore'
import {
  createUserWithEmailAndPassword,
  getAuth
} from 'firebase/auth'
import { db } from '../../firebase/config'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Users as UsersIcon } from 'lucide-react'

const ROLES = [
  { value: 'admin',    label: 'Admin' },
  { value: 'bdo',      label: 'BDO (Business Dev Officer)' },
  { value: 'recovery', label: 'Recovery Officer' },
  { value: 'accounts', label: 'Accounts' },
]

const ROLE_BADGE = {
  admin:    'badge-blue',
  bdo:      'badge-green',
  recovery: 'badge-yellow',
  accounts: 'badge-gray',
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export default function Users() {
  const [users,   setUsers]   = useState([])
  const [kiosks,  setKiosks]  = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null)
  const [saving,  setSaving]  = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm()
  const watchRole = watch('role')

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'users'), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    const u2 = onSnapshot(collection(db, 'kiosks'), snap => {
      setKiosks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => { u1(); u2() }
  }, [])

  const openAdd = () => {
    reset({ name: '', email: '', password: '', role: '', kioskId: '' })
    setModal('add')
  }

  const openEdit = (u) => {
    setValue('name',     u.name)
    setValue('email',    u.email)
    setValue('role',     u.role)
    setValue('kioskId',  u.kioskId ?? '')
    setValue('kioskName',u.kioskName ?? '')
    setModal({ edit: u.id })
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const kiosk   = kiosks.find(k => k.id === data.kioskId)
      const payload = {
        name:       data.name.trim(),
        email:      data.email.trim().toLowerCase(),
        role:       data.role,
        kioskId:    data.kioskId   ?? '',
        kioskName:  kiosk?.kioskCode ?? '',
        active:     true,
      }

      if (modal === 'add') {
        // Create Firebase Auth user
        const secondaryAuth = getAuth()
        const cred = await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password)
        payload.uid       = cred.user.uid
        payload.createdAt = serverTimestamp()
        await addDoc(collection(db, 'users'), { ...payload, uid: cred.user.uid })
        // Also set by uid as doc id for quick lookup
        await updateDoc(doc(db, 'users', cred.user.uid), payload).catch(() =>
          addDoc(collection(db, 'users'), payload)
        )
        toast.success('User created')
      } else {
        await updateDoc(doc(db, 'users', modal.edit), payload)
        toast.success('User updated')
      }
      setModal(null)
    } catch (e) {
      toast.error(e.message ?? 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (u) => {
    if (!window.confirm(`Deactivate "${u.name}"?`)) return
    await updateDoc(doc(db, 'users', u.id), { active: false })
    toast.success('User deactivated')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all portal users and their roles</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add User
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : users.length === 0 ? (
        <div className="card text-center py-16">
          <UsersIcon className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="text-gray-500">No users yet.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Name','Email','Role','Kiosk','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={ROLE_BADGE[u.role] ?? 'badge-gray'}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{u.kioskName || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={u.active ? 'badge-green' : 'badge-red'}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEdit(u)} className="text-blue-600 hover:text-blue-800"><Pencil size={15} /></button>
                      {u.active && (
                        <button onClick={() => handleDelete(u)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Add User' : 'Edit User'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" placeholder="Full name" {...register('name', { required: 'Name required' })} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Email *</label>
              <input className="input" type="email" placeholder="user@example.com"
                {...register('email', { required: 'Email required' })}
                disabled={modal !== 'add'} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            {modal === 'add' && (
              <div>
                <label className="label">Password *</label>
                <input className="input" type="password" placeholder="Min 6 characters"
                  {...register('password', { required: 'Password required', minLength: { value: 6, message: 'Min 6 chars' } })} />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>
            )}
            <div>
              <label className="label">Role *</label>
              <select className="input" {...register('role', { required: 'Role required' })}>
                <option value="">— Select Role —</option>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
            </div>
            {watchRole === 'bdo' && (
              <div>
                <label className="label">Assign Kiosk</label>
                <select className="input" {...register('kioskId')}>
                  <option value="">— Select Kiosk —</option>
                  {kiosks.map(k => <option key={k.id} value={k.id}>{k.kioskCode} — {k.merchantName}</option>)}
                </select>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving…' : modal === 'add' ? 'Create User' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
