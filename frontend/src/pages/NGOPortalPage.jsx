import { useEffect, useState } from 'react'
import { ngoApi } from '../api'
import toast from 'react-hot-toast'
import { Building2, TrendingUp, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

export default function NGOPortalPage() {
  const [profile, setProfile] = useState(null)
  const [matches, setMatches] = useState([])
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(null)

  useEffect(() => {
    Promise.all([
      ngoApi.getNgoProfile().catch(() => null),
      ngoApi.getMatches().catch(() => ({ data: [] })),
    ]).then(([p, m]) => {
      if (p) setProfile(p.data)
      setMatches(m.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const fetchPrediction = async () => {
    try {
      const r = await ngoApi.getDemandPrediction()
      setPrediction(r.data)
    } catch {
      toast.error('Could not load prediction')
    }
  }

  const handleAccept = async (matchId) => {
    setAccepting(matchId)
    try {
      await ngoApi.acceptMatch(matchId)
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, ngo_accepted: true, status: 'assigned' } : m))
      toast.success('Donation accepted!')
    } catch {
      toast.error('Failed to accept')
    } finally {
      setAccepting(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent spinner"
        style={{ borderColor: '#f59e0b', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>
          <span className="gradient-text">NGO Portal</span>
        </h1>
        <p style={{ color: '#9ca3af' }}>Manage donations and view AI predictions</p>
      </div>

      {/* Profile Card */}
      {profile && (
        <div className="glass-dark p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.2)' }}>
              <Building2 size={28} style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <h2 className="font-bold text-lg">{profile.organization_name}</h2>
              <p className="text-sm capitalize" style={{ color: '#9ca3af' }}>{profile.ngo_type} • {profile.city}, {profile.state}</p>
              <div className="flex gap-3 mt-1">
                <span className="badge badge-yellow">Capacity: {profile.capacity}</span>
                {profile.is_verified && <span className="badge badge-green">✓ Verified</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Donation Matches */}
      <div className="glass-dark overflow-hidden">
        <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-semibold">Incoming Donation Matches</h3>
        </div>
        {matches.length === 0 ? (
          <div className="p-10 text-center" style={{ color: '#9ca3af' }}>No matches yet</div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {matches.map(m => (
              <div key={m.id} className="p-5 flex items-center justify-between">
                <div>
                  <div className="font-medium">Match #{m.id}</div>
                  <div className="text-sm mt-1" style={{ color: '#9ca3af' }}>
                    Score: <strong style={{ color: '#10b981' }}>{m.matching_score?.toFixed(0)}/100</strong>
                    {' '} • Distance: {m.distance_km?.toFixed(1)} km
                    {' '} • ETA: {m.estimated_delivery_time} min
                  </div>
                  {m.ai_explanation && (
                    <p className="text-xs mt-2 max-w-md" style={{ color: '#d1fae5' }}>
                      🤖 {m.ai_explanation}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-4">
                  {m.ngo_accepted ? (
                    <span className="badge badge-green flex items-center gap-1">
                      <CheckCircle size={12} /> Accepted
                    </span>
                  ) : (
                    <button onClick={() => handleAccept(m.id)} className="btn-primary"
                      disabled={accepting === m.id}>
                      {accepting === m.id ? <Loader2 size={14} className="spinner" /> : 'Accept'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Demand Prediction */}
      <div className="glass-dark p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <TrendingUp size={18} style={{ color: '#6366f1' }} /> AI Demand Prediction
          </h3>
          <button onClick={fetchPrediction} className="btn-secondary text-sm px-4 py-2">
            Generate Forecast
          </button>
        </div>

        {prediction ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
                <div className="text-xl font-bold" style={{ color: '#10b981' }}>
                  {prediction.ai_insights?.monthly_demand_servings?.toLocaleString()}
                </div>
                <div className="text-xs mt-1" style={{ color: '#9ca3af' }}>Predicted Monthly Servings</div>
              </div>
              <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(99,102,241,0.1)' }}>
                <div className="text-xl font-bold" style={{ color: '#6366f1' }}>
                  {prediction.ai_insights?.monthly_demand_kg?.toFixed(0)} kg
                </div>
                <div className="text-xs mt-1" style={{ color: '#9ca3af' }}>Predicted Monthly Food</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={prediction.weekly_forecast || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day_name" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="predicted_servings" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Servings" />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-sm mt-3 p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', color: '#c7d2fe' }}>
              🤖 {prediction.ai_insights?.summary}
            </p>
          </>
        ) : (
          <div className="text-center py-8" style={{ color: '#9ca3af' }}>
            Click "Generate Forecast" to see AI-powered demand predictions
          </div>
        )}
      </div>
    </div>
  )
}
