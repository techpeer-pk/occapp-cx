import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { CheckCircle } from 'lucide-react'

export default function Signup() {
  const { signup }  = useAuth()
  const [loading,   setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await signup({ name: data.name, email: data.email, password: data.password })
      setSubmitted(true)
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered.')
      } else {
        toast.error(err.message ?? 'Registration failed. Try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-2xl p-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="text-green-500" size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Registration Submitted</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Your account has been created and is <span className="font-medium text-yellow-600">pending activation</span>.
              Please contact your administrator to activate your account before signing in.
            </p>
            <Link to="/login"
              className="inline-block mt-6 btn-primary px-8 py-2.5">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand rounded-2xl mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h1 className="text-2xl font-bold text-white">ARY Cash Portal</h1>
          <p className="text-gray-400 text-sm mt-1">BDO Account Registration</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Create your account</h2>
          <p className="text-xs text-gray-400 mb-6">
            Your account will be reviewed and activated by an administrator.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                className="input"
                placeholder="Your full name"
                {...register('name', { required: 'Full name is required' })}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

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
              <input
                type="password"
                className="input"
                placeholder="Min 6 characters"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Minimum 6 characters' }
                })}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input
                type="password"
                className="input"
                placeholder="Re-enter password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: val => val === password || 'Passwords do not match'
                })}
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            {/* Role notice */}
            <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <span className="text-yellow-500 text-xs mt-0.5">&#9888;</span>
              <p className="text-xs text-yellow-700">
                All new registrations are assigned the <strong>BDO</strong> role and require administrator approval before access is granted.
              </p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Registering...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          ARY Financial Services © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
