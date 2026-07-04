import { useEffect, useState } from 'react'
import { volunteerApi } from '../api'
import toast from 'react-hot-toast'
import { Truck, CheckCircle, Package, Clock, ToggleLeft, ToggleRight } from 'lucide-react'

const STATUS_COLORS = {
  matched: '#6366f1', assigned: '#3b82f6', picked_up: '#f59e0b',
  delivered: '#10b981', cancelled: '#ef4444'
}

export default function PickupsPage() {
  const [profile, setProfile] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [available, setAvailable] = useState(true)

  useEffect(() => {
    Promise.all([
      volunteerApi.getProfile().catch(() => null),
      volunteerApi.getAssignments().catch(() => ({ data: [] })),
    ]).then(([p, a]) => {
      if (p) { setProfile(p.data); setAvailable(p.data.is_available); }
      setAssignments(a.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const toggleAvailability = async () => {
    try {
      await volunteerApi.toggleAvailability(!available)
      setAvailable(!available)
      toast.success(`You are now ${!available ? 'available' : 'unavailable'}`)
    } catch { toast.error('Failed to update') }
  }

  const handlePickup = async (matchId) => {
    try {
      await volunteerApi.confirmPickup(matchId)
      setAssignments(prev => prev.map(a => a.id === matchId ? { ...a, status: 'picked_up' } : a))
      toast.success('Pickup confirmed!')
    } catch { toast.error('Failed') }
  }

  const handleDeliver = async (matchId) => {
    try {
      await volunteerApi.confirmDelivery(matchId)
      setAssignments(prev => prev.map(a => a.id === matchId ? { ...a, status: 'delivered', delivered_at: new Date().toISOString() } : a))
      toast.success('🎉 Delivery confirmed! Great job!')
    } catch { toast.error('Failed') }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent spinner"
        style={{ borderColor: '#3b82f6', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'Outfit' }}>My Pickups</h1>
          <p style={{ color: '#9ca3af' }}>Manage your pickup assignments</p>
        </div>
        <button onClick={toggleAvailability}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all border"
          style={{
            background: available ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.1)',
            borderColor: available ? '#10b981' : '#ef4444',
            color: available ? '#10b981' : '#ef4444',
          }}>
          {available ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          {available ? 'Available' : 'Unavailable'}
        </button>
      </div>

      {/* Profile */}
      {profile && (
        <div className="glass-dark p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.2)' }}>
            <Truck size={24} style={{ color: '#3b82f6' }} />
          </div>
          <div>
            <div className="font-semibold">Vehicle: {profile.vehicle_type} • {profile.vehicle_number}</div>
            <div className="text-sm" style={{ color: '#9ca3af' }}>
              Total Pickups: {profile.total_pickups} • Rating: ⭐ {profile.rating}
            </div>
          </div>
        </div>
      )}

      {/* Assignments */}
      {assignments.length === 0 ? (
        <div className="glass-dark p-16 text-center">
          <Truck size={48} className="mx-auto mb-4 opacity-30" />
          <h3 className="font-semibold mb-2">No Assignments Yet</h3>
          <p style={{ color: '#9ca3af' }}>You'll be assigned pickups when a donation is matched near you</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map(a => {
            const color = STATUS_COLORS[a.status] || '#6b7280'
            return (
              <div key={a.id} className="glass-dark p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">Assignment #{a.id}</span>
                      <span className="badge" style={{ background: `${color}20`, color }}>
                        {a.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm space-y-1" style={{ color: '#9ca3af' }}>
                      <div>📦 Donation #{a.donation_id}</div>
                      {a.distance_km && <div>📍 Distance: {a.distance_km.toFixed(1)} km</div>}
                      {a.estimated_delivery_time && <div>⏱️ ETA: {a.estimated_delivery_time} minutes</div>}
                    </div>
                    {a.ai_explanation && (
                      <p className="text-xs mt-2 p-2 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', color: '#6ee7b7' }}>
                        🤖 {a.ai_explanation}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    {a.status === 'assigned' && (
                      <button onClick={() => handlePickup(a.id)} className="btn-secondary text-sm px-4 py-2 flex items-center gap-2">
                        <Package size={14} /> Confirm Pickup
                      </button>
                    )}
                    {a.status === 'picked_up' && (
                      <button onClick={() => handleDeliver(a.id)} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                        <CheckCircle size={14} /> Confirm Delivery
                      </button>
                    )}
                    {a.status === 'delivered' && (
                      <span className="badge badge-green flex items-center gap-1">
                        <CheckCircle size={12} /> Delivered
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
