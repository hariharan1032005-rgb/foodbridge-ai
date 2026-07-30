import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { volunteerApi } from '../api'
import toast from 'react-hot-toast'
import { Truck, CheckCircle, Package, ToggleLeft, ToggleRight } from 'lucide-react'

const STATUS_COLORS = {
  matched: '#6366f1', assigned: '#3b82f6', picked_up: '#f59e0b',
  delivered: '#10b981', cancelled: '#ef4444'
}

export default function PickupsPage() {
  const [accepting, setAccepting] = useState(null)

  const { data: profileResponse, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['volunteer', 'profile'],
    queryFn: () => volunteerApi.getProfile(),
    refetchInterval: 20000,
    staleTime: 10000,
  })

  const { data: assignmentsResponse, isLoading: assignmentsLoading, refetch: refetchAssignments } = useQuery({
    queryKey: ['volunteer', 'assignments'],
    queryFn: () => volunteerApi.getAssignments(),
    refetchInterval: 20000,
    staleTime: 10000,
  })

  const loading = profileLoading || assignmentsLoading
  const profile = profileResponse?.data
  const assignments = assignmentsResponse?.data || []
  const currentAvailability = profile?.is_available ?? false

  const toggleAvailability = async () => {
    try {
      await volunteerApi.toggleAvailability(!currentAvailability)
      await refetchProfile()
      toast.success(`You are now ${!currentAvailability ? 'available' : 'unavailable'}`)
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleAccept = async (matchId) => {
    setAccepting(matchId)
    try {
      await volunteerApi.acceptAssignment(matchId)
      await refetchAssignments()
      toast.success('Assignment accepted!')
    } catch {
      toast.error('Failed to accept')
    } finally {
      setAccepting(null)
    }
  }

  const handlePickup = async (matchId) => {
    setAccepting(matchId)
    try {
      await volunteerApi.confirmPickup(matchId)
      await refetchAssignments()
      toast.success('Pickup confirmed!')
    } catch {
      toast.error('Failed')
    } finally {
      setAccepting(null)
    }
  }

  const handleDeliver = async (matchId) => {
    setAccepting(matchId)
    try {
      await volunteerApi.confirmDelivery(matchId)
      await refetchAssignments()
      toast.success('🎉 Delivery confirmed! Great job!')
    } catch {
      toast.error('Failed')
    } finally {
      setAccepting(null)
    }
  }

  // Live share state: { [matchId]: { ws, watchId } }
  const [liveShares, setLiveShares] = useState({})

  const startLiveShare = (matchId) => {
    if (!profile?.id) {
      toast.error('Volunteer id not available')
      return
    }
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation not available in this browser')
      return
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const token = localStorage.getItem('foodbridge_token')
    const wsUrl = `${wsProtocol}://${window.location.host}/api/v1/ws/volunteer/${profile.id}?token=${encodeURIComponent(token)}`
    const ws = new WebSocket(wsUrl)

    const onPosition = (pos) => {
      const payload = {
        match_id: matchId,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        speed: pos.coords.speed ?? null,
        heading: pos.coords.heading ?? null,
        timestamp: new Date().toISOString(),
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload))
      }
    }

    ws.addEventListener('open', () => {
      toast.success('Live share socket opened')
    })
    ws.addEventListener('close', () => {
      toast('Live share socket closed')
    })
    ws.addEventListener('error', () => {
      toast.error('WebSocket error')
    })

    const watchId = navigator.geolocation.watchPosition(onPosition, (err) => {
      toast.error('Geolocation error: ' + err.message)
    }, { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 })

    setLiveShares(prev => ({ ...prev, [matchId]: { ws, watchId } }))
  }

  const stopLiveShare = (matchId) => {
    const entry = liveShares[matchId]
    if (!entry) return
    try {
      if (entry.watchId != null) navigator.geolocation.clearWatch(entry.watchId)
    } catch {}
    try { entry.ws && entry.ws.close() } catch {}
    setLiveShares(prev => {
      const copy = { ...prev }
      delete copy[matchId]
      return copy
    })
    toast('Stopped live sharing')
  }

  useEffect(() => {
    return () => {
      // cleanup on unmount
      Object.keys(liveShares).forEach(k => {
        try { liveShares[k].watchId != null && navigator.geolocation.clearWatch(liveShares[k].watchId) } catch {}
        try { liveShares[k].ws && liveShares[k].ws.close() } catch {}
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
            background: currentAvailability ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.1)',
            borderColor: currentAvailability ? '#10b981' : '#ef4444',
            color: currentAvailability ? '#10b981' : '#ef4444',
          }}>
          {currentAvailability ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          {currentAvailability ? 'Available' : 'Unavailable'}
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
            {(profile.address || profile.city || profile.latitude || profile.longitude) && (
              <div className="text-sm mt-2" style={{ color: '#9ca3af' }}>
                {profile.address && <div>📍 {profile.address}</div>}
                {(profile.city || profile.latitude || profile.longitude) && (
                  <div>
                    {profile.city ? `${profile.city}` : ''}
                    {profile.latitude && profile.longitude ? ` • (${profile.latitude.toFixed(4)}, ${profile.longitude.toFixed(4)})` : ''}
                  </div>
                )}
              </div>
            )}
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
                      {a.distance_km && <div>📍 Route Distance: {a.distance_km.toFixed(1)} km</div>}
                      {a.donor_distance_km && <div>🧍 Distance to pickup: {a.donor_distance_km.toFixed(1)} km</div>}
                      {a.ngo_distance_km && <div>🏠 Distance to NGO: {a.ngo_distance_km.toFixed(1)} km</div>}
                      {a.estimated_delivery_time && <div>⏱️ ETA: {a.estimated_delivery_time} minutes</div>}
                    </div>
                    {a.ai_explanation && (
                      <p className="text-xs mt-2 p-2 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', color: '#6ee7b7' }}>
                        🤖 {a.ai_explanation}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    {a.status === 'matched' && a.ngo_accepted && !a.volunteer_accepted && (
                      <button onClick={() => handleAccept(a.id)} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                        <CheckCircle size={14} /> Accept Assignment
                      </button>
                    )}
                    {a.status === 'matched' && !a.ngo_accepted && (
                      <span className="text-xs" style={{ color: '#9ca3af' }}>Waiting for NGO acceptance</span>
                    )}
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
