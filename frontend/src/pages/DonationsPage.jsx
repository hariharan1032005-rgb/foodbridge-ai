import { useQuery } from '@tanstack/react-query'
import { donationApi } from '../api'
import { Package } from 'lucide-react'

const STATUS_BADGE = {
  pending: 'badge badge-yellow',
  matched: 'badge badge-blue',
  assigned: 'badge badge-blue',
  picked_up: 'badge badge-purple',
  delivered: 'badge badge-green',
  expired: 'badge badge-red',
  cancelled: 'badge badge-red',
}

export default function DonationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['donations', { limit: 50 }],
    queryFn: () => donationApi.listDonations({ limit: 50 }),
    refetchInterval: 20000,
    staleTime: 10000,
  })

  const [trackingMatchId, setTrackingMatchId] = useState(null)
  const [trackerSocket, setTrackerSocket] = useState(null)
  const [trackerData, setTrackerData] = useState(null)

  const donations = data?.data || []

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent spinner"
        style={{ borderColor: '#10b981', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'Outfit' }}>Donations</h1>
          <p style={{ color: '#9ca3af' }}>{donations.length} total donations</p>
        </div>
      </div>

      {donations.length === 0 ? (
        <div className="glass-dark p-16 text-center">
          <Package size={48} className="mx-auto mb-4 opacity-30" />
          <h3 className="font-semibold mb-2">No Donations Yet</h3>
          <p style={{ color: '#9ca3af' }}>Post your first food donation to get started</p>
        </div>
      ) : (
        <div className="glass-dark overflow-hidden rounded-2xl">
          <table className="data-table">
            <thead>
              <tr>
                <th>Food Item</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Freshness</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Posted</th>
              </tr>
            </thead>
            <tbody>
              {donations.map(d => (
                <tr key={d.id}>
                  <td>
                    <div className="font-medium">{d.food_name}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                      {d.is_veg ? '🟢 Veg' : '🔴 Non-Veg'}
                    </div>
                  </td>
                  <td>
                    <span className="text-sm capitalize" style={{ color: '#9ca3af' }}>
                      {d.food_category?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div className="font-medium">{d.quantity_kg} kg</div>
                    {d.quantity_servings && (
                      <div className="text-xs" style={{ color: '#9ca3af' }}>{d.quantity_servings} servings</div>
                    )}
                  </td>
                  <td>
                    {d.match_details?.ngo_name ? (
                      <div className="text-xs" style={{ color: '#9ca3af' }}>
                        <div>NGO: {d.match_details.ngo_name}</div>
                        <div>Volunteer accepted: {d.match_details.volunteer_accepted ? 'Yes' : 'No'}</div>
                        <div>NGO accepted: {d.match_details.ngo_accepted ? 'Yes' : 'No'}</div>
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: '#9ca3af' }}>Waiting for match</span>
                    )}
                  </td>
                  <td>
                    {d.freshness_score ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                          <div className="h-full rounded-full" style={{ width: `${d.freshness_score}%`, background: d.freshness_score > 70 ? '#10b981' : d.freshness_score > 40 ? '#f59e0b' : '#ef4444' }} />
                        </div>
                        <span className="text-xs font-semibold">{d.freshness_score.toFixed(0)}</span>
                      </div>
                    ) : <span style={{ color: '#6b7280' }}>Analyzing...</span>}
                  </td>
                  <td>
                    {d.pickup_priority ? (
                      <span className={`badge px-2 py-0.5 text-xs priority-${d.pickup_priority}`}>
                        {d.pickup_priority.toUpperCase()}
                      </span>
                    ) : '--'}
                  </td>
                  <td>
                    <span className={STATUS_BADGE[d.status] || 'badge badge-yellow'}>
                      {d.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="text-xs" style={{ color: '#9ca3af' }}>
                    {new Date(d.created_at).toLocaleDateString()}
                    {d.match_details?.match_id && (
                      <div className="mt-2">
                        {trackingMatchId === d.match_details.match_id ? (
                          <button onClick={() => {
                            // stop
                            if (trackerSocket) trackerSocket.close()
                            setTrackerSocket(null)
                            setTrackingMatchId(null)
                            setTrackerData(null)
                          }} className="btn-secondary text-xs px-2 py-1">Stop Tracking</button>
                        ) : (
                          <button onClick={() => {
                            // start websocket
                            const matchId = d.match_details.match_id
                            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
                            const token = localStorage.getItem('foodbridge_token')
                            const ws = new WebSocket(`${protocol}://${window.location.host}/api/v1/ws/tracking/${matchId}?token=${encodeURIComponent(token)}`)
                            ws.onopen = () => setTrackingMatchId(matchId)
                            ws.onmessage = (ev) => {
                              try {
                                const msg = JSON.parse(ev.data)
                                if (msg.type === 'location') setTrackerData(msg.payload)
                              } catch (e) {}
                            }
                            ws.onclose = () => {
                              setTrackingMatchId(null)
                              setTrackerSocket(null)
                            }
                            setTrackerSocket(ws)
                          }} className="btn-primary text-xs px-2 py-1">Track Volunteer</button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {trackingMatchId && trackerData && (
        <div className="fixed bottom-6 right-6 glass-dark p-4 rounded-xl">
          <div className="font-semibold">Live Volunteer Location</div>
          <div className="text-sm" style={{ color: '#9ca3af' }}>
            <div>Lat: {trackerData.latitude}</div>
            <div>Lon: {trackerData.longitude}</div>
            {trackerData.speed && <div>Speed: {trackerData.speed}</div>}
            <div className="text-xs mt-2">Updated: {new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      )}
    </div>
  )
}
