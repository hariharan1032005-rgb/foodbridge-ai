import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { donationApi } from '../api'
import toast from 'react-hot-toast'
import { Loader2, CheckCircle2, Info } from 'lucide-react'

export default function DonorProfilePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    organization_name: '',
    organization_type: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
  })
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await donationApi.getDonorProfile()
        if (res?.data) {
          setHasProfile(true)
          setForm({
            organization_name: res.data.organization_name || '',
            organization_type: res.data.organization_type || '',
            address: res.data.address || '',
            city: res.data.city || '',
            state: res.data.state || '',
            pincode: res.data.pincode || '',
            latitude: res.data.latitude || '',
            longitude: res.data.longitude || '',
          })
        }
      } catch {
        setHasProfile(false)
      } finally {
        setProfileLoading(false)
      }
    }
    loadProfile()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      }
      await donationApi.createDonorProfile(payload)
      toast.success('Donor profile created. You can now post donations.')
      navigate('/post-donation')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create donor profile')
    } finally {
      setLoading(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 size={32} className="spinner" style={{ color: '#10b981' }} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'Outfit' }}>Donor Profile</h1>
        <p style={{ color: '#9ca3af' }}>Provide your pickup and organization details so your donations can be routed correctly.</p>
      </div>

      {hasProfile ? (
        <div className="glass-dark p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl" style={{ background: 'rgba(16,185,129,0.15)' }}>
              <CheckCircle2 size={24} style={{ color: '#10b981' }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Donor profile already created</h2>
              <p className="text-sm" style={{ color: '#9ca3af' }}>You can now post donations or update your profile below.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-dark p-6 mb-6 flex items-start gap-3">
          <div className="p-3 rounded-2xl" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <Info size={24} style={{ color: '#3b82f6' }} />
          </div>
          <div>
            <h2 className="font-semibold">Donor profile required</h2>
            <p className="text-sm" style={{ color: '#9ca3af' }}>
              You need to create your donor profile before posting food donations. This helps us match your donation with nearby NGOs and volunteers.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-dark p-6 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>Organization Name</label>
            <input className="input-field" placeholder="Restaurant or charity name"
              value={form.organization_name}
              onChange={e => setForm({ ...form, organization_name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>Organization Type</label>
            <input className="input-field" placeholder="e.g. Restaurant, Hotel, Home"
              value={form.organization_type}
              onChange={e => setForm({ ...form, organization_type: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>Address</label>
          <textarea className="input-field" rows={3} placeholder="Pickup address"
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>City</label>
            <input className="input-field" placeholder="City"
              value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>State</label>
            <input className="input-field" placeholder="State"
              value={form.state}
              onChange={e => setForm({ ...form, state: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>Pincode</label>
            <input className="input-field" placeholder="Pincode"
              value={form.pincode}
              onChange={e => setForm({ ...form, pincode: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>Latitude</label>
            <input type="number" step="0.000001" className="input-field" placeholder="Latitude"
              value={form.latitude}
              onChange={e => setForm({ ...form, latitude: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>Longitude</label>
            <input type="number" step="0.000001" className="input-field" placeholder="Longitude"
              value={form.longitude}
              onChange={e => setForm({ ...form, longitude: e.target.value })}
            />
          </div>
        </div>

        <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-3"
          disabled={loading}>
          {loading ? <Loader2 size={18} className="spinner" /> : <CheckCircle2 size={18} />}
          {hasProfile ? 'Update Profile' : 'Create Donor Profile'}
        </button>
      </form>
    </div>
  )
}
