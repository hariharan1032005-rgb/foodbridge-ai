import { useState } from 'react'
import { donationApi } from '../api'
import toast from 'react-hot-toast'
import { Utensils, Upload, Loader2, Leaf, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const CATEGORIES = [
  { value: 'cooked_meal', label: '🍲 Cooked Meal' },
  { value: 'raw_vegetables', label: '🥦 Raw Vegetables' },
  { value: 'fruits', label: '🍎 Fruits' },
  { value: 'bakery', label: '🍞 Bakery' },
  { value: 'dairy', label: '🥛 Dairy' },
  { value: 'grains', label: '🌾 Grains' },
  { value: 'beverages', label: '🥤 Beverages' },
  { value: 'snacks', label: '🍿 Snacks' },
  { value: 'other', label: '📦 Other' },
]

export default function PostDonationPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [createdDonation, setCreatedDonation] = useState(null)
  const [imageFile, setImageFile] = useState(null)

  const [form, setForm] = useState({
    food_name: '', food_category: 'cooked_meal', is_veg: true,
    quantity_kg: '', quantity_servings: '',
    pickup_address: '', pickup_latitude: null, pickup_longitude: null,
    expires_at: '', description: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        quantity_kg: parseFloat(form.quantity_kg),
        quantity_servings: form.quantity_servings ? parseInt(form.quantity_servings) : null,
        expires_at: new Date(form.expires_at).toISOString(),
      }
      const res = await donationApi.createDonation(payload)
      setCreatedDonation(res.data)

      // Upload image if provided
      if (imageFile && res.data.id) {
        const fd = new FormData()
        fd.append('file', imageFile)
        await donationApi.uploadImage(res.data.id, fd)
      }

      setStep(3)
      toast.success('🎉 Donation posted! AI agents are analyzing it...')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to post donation')
    } finally {
      setLoading(false)
    }
  }

  if (step === 3 && createdDonation) {
    const ai = createdDonation.ai_analysis || {}
    const analysis = ai.food_analysis?.analysis || {}
    const shelf = ai.shelf_life?.prediction || {}

    const priorityClass = {
      critical: 'priority-critical', urgent: 'priority-urgent', normal: 'priority-normal'
    }[shelf.pickup_priority] || 'priority-normal'

    return (
      <div className="p-6 max-w-2xl mx-auto animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center animate-pulse-glow"
            style={{ background: 'rgba(16,185,129,0.2)' }}>
            <CheckCircle2 size={40} style={{ color: '#10b981' }} />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Donation Posted!</h1>
          <p style={{ color: '#9ca3af' }}>AI agents have analyzed your food donation</p>
        </div>

        <div className="space-y-4">
          {/* Quality Score */}
          <div className="glass-dark p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Leaf size={18} style={{ color: '#10b981' }} /> AI Food Analysis
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold" style={{ color: '#10b981' }}>
                  {analysis.freshness_score?.toFixed(0) || createdDonation.freshness_score?.toFixed(0) || '--'}
                </div>
                <div className="text-xs mt-1" style={{ color: '#9ca3af' }}>Freshness Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: '#6366f1' }}>
                  {analysis.quality_score?.toFixed(0) || createdDonation.quality_score?.toFixed(0) || '--'}
                </div>
                <div className="text-xs mt-1" style={{ color: '#9ca3af' }}>Quality Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
                  {(createdDonation.shelf_life_hours || 24).toFixed(0)}h
                </div>
                <div className="text-xs mt-1" style={{ color: '#9ca3af' }}>Shelf Life</div>
              </div>
            </div>
          </div>

          {/* Pickup Priority */}
          <div className="glass-dark p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={18} style={{ color: '#f59e0b' }} />
                <span className="font-semibold">Pickup Priority</span>
              </div>
              <span className={`badge ${priorityClass}`}>
                {(createdDonation.pickup_priority || 'normal').toUpperCase()}
              </span>
            </div>
            {shelf.recommendation && (
              <p className="text-sm mt-3" style={{ color: '#9ca3af' }}>{shelf.recommendation}</p>
            )}
          </div>

          {/* AI Summary */}
          {analysis.ai_summary && (
            <div className="glass p-5" style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
              <p className="text-sm" style={{ color: '#d1fae5' }}>
                🤖 <strong>AI Analysis:</strong> {analysis.ai_summary}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => navigate('/donations')} className="btn-secondary flex-1">
              View All Donations
            </button>
            <button onClick={() => { setStep(1); setCreatedDonation(null); setForm({ food_name:'',food_category:'cooked_meal',is_veg:true,quantity_kg:'',quantity_servings:'',pickup_address:'',expires_at:'',description:'' }) }}
              className="btn-primary flex-1">
              Post Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'Outfit' }}>Post Food Donation</h1>
        <p style={{ color: '#9ca3af' }}>AI will analyze, predict shelf life, and find the best NGO match</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-dark p-6 space-y-5">
        {/* Food Name & Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>Food Name *</label>
            <input className="input-field" placeholder="e.g. Biryani, Bread" required
              value={form.food_name} onChange={e => setForm({...form, food_name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>Category *</label>
            <select className="input-field" value={form.food_category}
              onChange={e => setForm({...form, food_category: e.target.value})} required>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {/* Veg toggle */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Food Type:</span>
          <div className="flex gap-3">
            {[{ v: true, l: '🟢 Vegetarian' }, { v: false, l: '🔴 Non-Vegetarian' }].map(({ v, l }) => (
              <button key={String(v)} type="button"
                onClick={() => setForm({...form, is_veg: v})}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all border"
                style={{
                  background: form.is_veg === v ? (v ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)') : 'rgba(255,255,255,0.03)',
                  borderColor: form.is_veg === v ? (v ? '#10b981' : '#ef4444') : 'rgba(255,255,255,0.08)',
                  color: form.is_veg === v ? (v ? '#10b981' : '#ef4444') : '#9ca3af',
                }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>Quantity (kg) *</label>
            <input type="number" step="0.1" min="0.1" className="input-field" placeholder="e.g. 10.5" required
              value={form.quantity_kg} onChange={e => setForm({...form, quantity_kg: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>Servings (approx)</label>
            <input type="number" className="input-field" placeholder="e.g. 50"
              value={form.quantity_servings} onChange={e => setForm({...form, quantity_servings: e.target.value})} />
          </div>
        </div>

        {/* Pickup Address */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>Pickup Address *</label>
          <textarea className="input-field" rows={2} placeholder="Full pickup address..." required
            value={form.pickup_address} onChange={e => setForm({...form, pickup_address: e.target.value})} />
        </div>

        {/* Expiry */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>Expiry Date & Time *</label>
          <input type="datetime-local" className="input-field" required
            min={new Date().toISOString().slice(0, 16)}
            value={form.expires_at} onChange={e => setForm({...form, expires_at: e.target.value})} />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>Description</label>
          <textarea className="input-field" rows={2} placeholder="Any special instructions, allergens, etc."
            value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>Food Image</label>
          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-green-500"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <Upload size={24} style={{ color: '#9ca3af' }} />
            <span className="text-sm mt-2" style={{ color: '#9ca3af' }}>
              {imageFile ? imageFile.name : 'Click to upload food image (optional)'}
            </span>
            <input type="file" accept="image/*" className="hidden"
              onChange={e => setImageFile(e.target.files[0])} />
          </label>
        </div>

        {/* AI notice */}
        <div className="flex items-start gap-2 p-3 rounded-xl text-sm" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <AlertCircle size={16} style={{ color: '#818cf8', flexShrink: 0, marginTop: '2px' }} />
          <p style={{ color: '#c7d2fe' }}>
            <strong>AI Pipeline:</strong> Upon submission, 8 AI agents will analyze your food, predict shelf life, find the best NGO match, and optimize the pickup route automatically.
          </p>
        </div>

        <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2" disabled={loading}>
          {loading ? <Loader2 size={18} className="spinner" /> : <Utensils size={18} />}
          {loading ? 'AI Agents Processing...' : 'Post Donation & Run AI Pipeline'}
        </button>
      </form>
    </div>
  )
}
