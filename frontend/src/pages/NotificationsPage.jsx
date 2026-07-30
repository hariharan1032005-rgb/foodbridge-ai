import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api'
import { Bell, CheckCheck, Package, Truck, Building2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const TYPE_META = {
  donation: { icon: Package, color: '#10b981', label: 'Donation' },
  match: { icon: Building2, color: '#6366f1', label: 'Match' },
  pickup: { icon: Truck, color: '#3b82f6', label: 'Pickup' },
  delivery: { icon: CheckCheck, color: '#f59e0b', label: 'Delivery' },
  default: { icon: Bell, color: '#9ca3af', label: 'System' },
}

function timeAgo(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => dashboardApi.getNotifications(),
    refetchInterval: 15000,
    staleTime: 12000,
  })

  const notifications = data?.data || []

  const markRead = async (id) => {
    try {
      await dashboardApi.markRead(id)
      refetch()
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="p-6 animate-fade-in" style={{ maxWidth: 800 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'Outfit' }}>
            Notifications
          </h1>
          <p style={{ color: '#9ca3af', fontSize: 14 }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={async () => {
              await Promise.all(notifications.filter(n => !n.is_read).map(n => markRead(n.id)))
              toast.success('All marked as read')
            }}
            className="btn-secondary flex items-center gap-2"
            style={{ fontSize: 13 }}
          >
            <CheckCheck size={16} />
            Mark All Read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={32} className="spinner" style={{ color: '#10b981' }} />
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-dark p-12 text-center">
          <Bell size={48} style={{ color: '#374151', margin: '0 auto 1rem' }} />
          <h3 className="font-semibold mb-2">No notifications yet</h3>
          <p style={{ color: '#9ca3af', fontSize: 14 }}>
            You'll see updates about donations, matches, and deliveries here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => {
            const meta = TYPE_META[n.notification_type] || TYPE_META.default
            const Icon = meta.icon
            return (
              <div
                key={n.id}
                className="glass-dark card-hover"
                style={{
                  padding: '1rem 1.25rem',
                  display: 'flex', alignItems: 'flex-start', gap: '1rem',
                  opacity: n.is_read ? 0.6 : 1,
                  borderLeft: n.is_read ? '3px solid transparent' : `3px solid ${meta.color}`,
                  cursor: n.is_read ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => !n.is_read && markRead(n.id)}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: `${meta.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} color={meta.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-sm">{n.title}</div>
                      <div style={{ color: '#9ca3af', fontSize: 13, marginTop: 2, lineHeight: 1.5 }}>
                        {n.message}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, fontSize: 12, color: '#6b7280' }}>
                      {timeAgo(n.created_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="badge" style={{
                      background: `${meta.color}15`, color: meta.color,
                      fontSize: 11, padding: '2px 8px',
                    }}>{meta.label}</span>
                    {!n.is_read && (
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: meta.color, display: 'inline-block',
                      }} />
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
