import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Leaf, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.full_name}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1f1a 50%, #0a0f1e 100%)' }}>
      
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #10b981, transparent)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)', filter: 'blur(60px)' }} />
      </div>

      <div className="w-full max-w-md px-4 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Leaf size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text" style={{ fontFamily: 'Outfit' }}>FoodBridge AI</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Multi-Agent Food Waste Redistribution</p>
        </div>

        {/* Card */}
        <div className="glass-dark p-8">
          <h2 className="text-xl font-semibold mb-6">Welcome back</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#6b7280' }}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
              disabled={loading}>
              {loading ? <Loader2 size={18} className="spinner" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: '#10b981' }}>Demo Credentials</p>
            <div className="space-y-1">
              {[
                { role: 'Admin', email: 'admin@foodbridge.ai', pw: 'admin123' },
                { role: 'Donor', email: 'donor@foodbridge.ai', pw: 'donor123' },
                { role: 'NGO', email: 'ngo@foodbridge.ai', pw: 'ngo123' },
              ].map(cred => (
                <button key={cred.role} onClick={() => setForm({ email: cred.email, password: cred.pw })}
                  className="flex items-center gap-2 text-xs w-full text-left hover:opacity-80 transition-opacity">
                  <span className="badge badge-green">{cred.role}</span>
                  <span style={{ color: '#9ca3af' }}>{cred.email}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm mt-6" style={{ color: '#6b7280' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold" style={{ color: '#10b981' }}>Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
