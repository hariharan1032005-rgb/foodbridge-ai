import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Leaf, Loader2 } from 'lucide-react'

const ROLES = [
  { value: 'donor', label: '🍽️ Donor', desc: 'Restaurant, Hotel, Individual' },
  { value: 'ngo', label: '🤝 NGO', desc: 'Orphanage, Shelter, Old-age Home' },
  { value: 'volunteer', label: '🚗 Volunteer', desc: 'Pickup & Delivery Partner' },
]

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '', role: 'donor' })
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, verifyOtp, login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!otpSent) {
        await register(form)
        setOtpSent(true)
        toast.success('Verification code sent to your email.')
      } else {
        await verifyOtp(form.email, otp)
        const user = await login(form.email, form.password)
        toast.success(`Welcome to FoodBridge AI, ${user.full_name}!`)
        navigate('/dashboard')
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1f1a 50%, #0a0f1e 100%)' }}>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)', filter: 'blur(60px)' }} />
      </div>

      <div className="w-full max-w-lg px-4 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Leaf size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text" style={{ fontFamily: 'Outfit' }}>Join FoodBridge AI</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Help end food waste. Save lives.</p>
        </div>

        <div className="glass-dark p-8">
          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3" style={{ color: '#9ca3af' }}>I am a...</label>
            <div className="grid grid-cols-3 gap-3">
              {ROLES.map(role => (
                <button key={role.value} type="button"
                  onClick={() => setForm({...form, role: role.value})}
                  className="p-3 rounded-xl text-center transition-all border"
                  style={{
                    background: form.role === role.value ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                    borderColor: form.role === role.value ? '#10b981' : 'rgba(255,255,255,0.08)',
                  }}>
                  <div className="text-lg">{role.label.split(' ')[0]}</div>
                  <div className="text-xs font-semibold mt-1">{role.label.split(' ')[1]}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{role.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>Full Name</label>
                <input className="input-field" placeholder="John Doe"
                  value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>Phone</label>
                <input className="input-field" placeholder="+91 9876543210"
                  value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>Email</label>
              <input type="email" className="input-field" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>

            {!otpSent ? (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>Password</label>
                <input type="password" className="input-field" placeholder="Min 6 characters"
                  value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  minLength={6} required />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>Verification Code</label>
                <input className="input-field" placeholder="Enter 6-digit OTP"
                  value={otp} onChange={e => setOtp(e.target.value)} required />
              </div>
            )}

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              disabled={loading}>
              {loading ? <Loader2 size={18} className="spinner" /> : null}
              {loading ? (otpSent ? 'Verifying...' : 'Creating Account...') : (otpSent ? 'Verify OTP' : 'Create Account')}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#6b7280' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold" style={{ color: '#10b981' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
