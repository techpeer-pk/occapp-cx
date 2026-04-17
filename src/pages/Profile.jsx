import { useState } from 'react'
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { User, Lock, Mail, Shield, MapPin, Store, Eye, EyeOff } from 'lucide-react'

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const [editingName,  setEditingName]  = useState(false)
  const [editingPass,  setEditingPass]  = useState(false)
  const [savingName,   setSavingName]   = useState(false)
  const [savingPass,   setSavingPass]   = useState(false)
  const [showCurrent,  setShowCurrent]  = useState(false)
  const [showNew,      setShowNew]      = useState(false)

  const nameForm = useForm({ defaultValues: { name: profile?.name ?? '' } })
  const passForm = useForm()

  const rolLabel = {
    admin:    'Administrator',
    bdo:      'Business Development Officer (BDO)',
    recovery: 'Recovery Officer',
    accounts: 'Accounts Officer',
  }

  // ── Update Name ─────────────────────────────────────────────────────────────
  const saveName = async ({ name }) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setSavingName(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), { name: trimmed })
      await refreshProfile()
      toast.success('Name updated')
      setEditingName(false)
    } catch (e) {
      toast.error('Error: ' + e.message)
    } finally {
      setSavingName(false)
    }
  }

  // ── Change Password ──────────────────────────────────────────────────────────
  const savePassword = async ({ currentPassword, newPassword, confirmPassword }) => {
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match')
    if (newPassword.length < 6)         return toast.error('Min 6 characters required')
    setSavingPass(true)
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)
      toast.success('Password changed successfully')
      passForm.reset()
      setEditingPass(false)
    } catch (e) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        toast.error('Current password is incorrect')
      } else {
        toast.error('Error: ' + e.message)
      }
    } finally {
      setSavingPass(false)
    }
  }

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={15} className="text-gray-500" />
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-800 font-medium mt-0.5">{value || '—'}</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account details</p>
      </div>

      {/* Avatar + Role card */}
      <div className="card flex items-center gap-4 mb-5">
        <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
          {profile?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">{profile?.name}</p>
          <p className="text-sm text-gray-500">{rolLabel[profile?.role] ?? profile?.role}</p>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
            profile?.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
          }`}>
            {profile?.active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Account Info */}
      <div className="card mb-5">
        <h2 className="font-semibold text-gray-800 mb-2">Account Information</h2>
        <InfoRow icon={Mail}   label="Email Address" value={user?.email} />
        <InfoRow icon={Shield} label="Role"          value={rolLabel[profile?.role] ?? profile?.role} />
        {profile?.role === 'bdo' && (
          <>
            <InfoRow icon={MapPin} label="Assigned Kiosk" value={profile?.kioskName}    />
            <InfoRow icon={Store}  label="Merchant"       value={profile?.merchantName} />
          </>
        )}
      </div>

      {/* Update Name */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-500" />
            <h2 className="font-semibold text-gray-800">Display Name</h2>
          </div>
          {!editingName && profile?.role === 'admin' && (
            <button onClick={() => { setEditingName(true); nameForm.setValue('name', profile?.name ?? '') }}
              className="text-sm text-brand font-medium hover:underline">
              Edit
            </button>
          )}
        </div>

        {editingName && profile?.role === 'admin' ? (
          <form onSubmit={nameForm.handleSubmit(saveName)} className="space-y-3">
            <input
              className="input"
              placeholder="Full name"
              {...nameForm.register('name', { required: 'Name is required' })}
            />
            {nameForm.formState.errors.name && (
              <p className="text-red-500 text-xs">{nameForm.formState.errors.name.message}</p>
            )}
            <div className="flex gap-2">
              <button type="submit" disabled={savingName} className="btn-primary">
                {savingName ? 'Saving…' : 'Save Name'}
              </button>
              <button type="button" onClick={() => setEditingName(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className="text-gray-700">{profile?.name}</p>
        )}
      </div>

      {/* Change Password */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-gray-500" />
            <h2 className="font-semibold text-gray-800">Change Password</h2>
          </div>
          {!editingPass && (
            <button onClick={() => setEditingPass(true)}
              className="text-sm text-brand font-medium hover:underline">
              Change
            </button>
          )}
        </div>

        {editingPass ? (
          <form onSubmit={passForm.handleSubmit(savePassword)} className="space-y-3">
            <div>
              <label className="label">Current Password *</label>
              <div className="relative">
                <input type={showCurrent ? 'text' : 'password'} className="input pr-10"
                  {...passForm.register('currentPassword', { required: 'Required' })} />
                <button type="button" onClick={() => setShowCurrent(v => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {passForm.formState.errors.currentPassword && (
                <p className="text-red-500 text-xs mt-1">{passForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div>
              <label className="label">New Password *</label>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} className="input pr-10" placeholder="Min 6 characters"
                  {...passForm.register('newPassword', { required: 'Required', minLength: { value: 6, message: 'Min 6 characters' } })} />
                <button type="button" onClick={() => setShowNew(v => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {passForm.formState.errors.newPassword && (
                <p className="text-red-500 text-xs mt-1">{passForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div>
              <label className="label">Confirm New Password *</label>
              <input type="password" className="input"
                {...passForm.register('confirmPassword', { required: 'Required' })} />
              {passForm.formState.errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{passForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={savingPass} className="btn-primary">
                {savingPass ? 'Saving…' : 'Update Password'}
              </button>
              <button type="button" onClick={() => { setEditingPass(false); passForm.reset() }} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-gray-500">••••••••</p>
        )}
      </div>
    </div>
  )
}
