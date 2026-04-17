import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2, KeyRound, X } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [loading,      setLoading]      = useState(false)
  const [showPass,     setShowPass]     = useState(false)
  const [resetModal,   setResetModal]   = useState(false)
  const [resetEmail,   setResetEmail]   = useState('')
  const [resetSending, setResetSending] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const sendReset = async (e) => {
    e.preventDefault()
    const email = resetEmail.trim()
    if (!email) return toast.error('Enter your email address')
    setResetSending(true)
    try {
      await sendPasswordResetEmail(auth, email)
      toast.success('Password reset email sent — check your inbox')
      setResetModal(false)
      setResetEmail('')
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        toast.error('No account found with that email')
      } else {
        toast.error('Error: ' + err.message)
      }
    } finally {
      setResetSending(false)
    }
  }

  const onSubmit = async ({ email, password }) => {
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      if (err.message === 'INACTIVE') {
        toast.error('Your account is inactive. Contact your administrator.')
      } else {
        toast.error('Invalid email or password')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand rounded-2xl mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h1 className="text-2xl font-bold text-white">ARY Cash Portal</h1>
          <p className="text-gray-400 text-sm mt-1">Cash Collection Management System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                })}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              <div className="text-right mt-1">
                <button type="button" onClick={() => setResetModal(true)}
                  className="text-xs text-brand hover:underline">
                  Forgot password?
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            New BDO?{' '}
            <Link to="/signup" className="text-brand font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          ARY Financial Services © {new Date().getFullYear()}
        </p>
      </div>

      {/* Forgot Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center">
                  <KeyRound size={15} className="text-brand" />
                </div>
                <h3 className="font-semibold text-gray-800">Reset Password</h3>
              </div>
              <button onClick={() => { setResetModal(false); setResetEmail('') }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Enter your email and we'll send you a link to reset your password.
            </p>
            <form onSubmit={sendReset} className="space-y-4">
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button type="submit" disabled={resetSending}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {resetSending && <Loader2 size={14} className="animate-spin" />}
                  {resetSending ? 'Sending…' : 'Send Reset Link'}
                </button>
                <button type="button" onClick={() => { setResetModal(false); setResetEmail('') }}
                  className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
