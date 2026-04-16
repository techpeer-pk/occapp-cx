import { useState, useEffect } from 'react'
import { collection, addDoc, onSnapshot, serverTimestamp, query, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function formatWallet(raw) {
  const digits = raw.replace(/\D/g, '')
  if (!digits.startsWith('92')) return '92'
  return digits.slice(0, 12)
}

export default function NewTransaction() {
  const { user, profile } = useAuth()
  const navigate          = useNavigate()
  const [topupTypes, setTopupTypes] = useState([])
  const [saving,     setSaving]     = useState(false)

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
        kioskId:       profile.kioskId   ?? '',
        kioskCode:     profile.kioskName ?? '',
        merchantName:  profile.merchantName ?? '',
        topupTypeId:   data.topupTypeId,
        topupTypeName: topupType?.name ?? '',
        topupTypeCode: topupType?.code ?? '',
        amount:        Number(data.amount),
        customerName:  data.customerName?.trim() ?? '',
        walletNumber:  data.walletNumber?.trim() ?? '',
        remarks:       data.remarks?.trim() ?? '',
        status:        'pending',       // pending → collected → deposited
        createdAt:     serverTimestamp(),
      })
      toast.success('Transaction recorded!')
      reset()
      navigate('/bdo/transactions')
    } catch (e) {
      toast.error('Failed to save: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Cash Entry</h1>
        <p className="text-sm text-gray-500 mt-1">
          Record a customer wallet top-up — <span className="font-medium">{profile?.kioskName || 'Your Kiosk'}</span>
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Top-up Type */}
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

          {/* Amount */}
          <div>
            <label className="label">Amount (PKR) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">Rs.</span>
              <input type="number" min="1" step="1"
                className="input pl-10"
                placeholder="0"
                {...register('amount', {
                  required: 'Amount required',
                  min: { value: 1, message: 'Must be > 0' }
                })} />
            </div>
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
          </div>

          {/* Customer / Wallet */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Customer Name *</label>
              <input className="input" placeholder="Full name"
                {...register('customerName', { required: 'Customer name required' })} />
              {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>}
            </div>
            <div>
              <label className="label">ARY Wallet # *</label>
              <input
                className="input font-mono tracking-wide"
                placeholder="92xxxxxxxxxx"
                maxLength={12}
                {...register('walletNumber', {
                  required: 'Wallet number required',
                  validate: v => /^92\d{10}$/.test(v) || 'Must be 12 digits starting with 92',
                })}
                onChange={e => {
                  const formatted = formatWallet(e.target.value)
                  setValue('walletNumber', formatted, { shouldValidate: true })
                }}
              />
              {errors.walletNumber
                ? <p className="text-red-500 text-xs mt-1">{errors.walletNumber.message}</p>
                : <p className="text-gray-400 text-xs mt-1">Format: 92xxxxxxxxxx (12 digits)</p>
              }
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="label">Remarks</label>
            <textarea className="input resize-none" rows={2} placeholder="Optional notes"
              {...register('remarks')} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 flex-1 justify-center py-2.5">
              <PlusCircle size={18} />
              {saving ? 'Saving…' : 'Record Transaction'}
            </button>
            <button type="button" onClick={() => reset({ walletNumber: '92' })} className="btn-secondary px-6">
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
