import { useEffect, useState } from 'react'
import { donationApi } from '../api'
import toast from 'react-hot-toast'
import { Package, Clock, Activity, Leaf } from 'lucide-react'

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
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    donationApi.listDonations({ limit: 50 })
      .then(r => setDonations(r.data))
      .catch(() => toast.error('Failed to load donations'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
