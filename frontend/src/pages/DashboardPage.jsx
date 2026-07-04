import { useEffect, useState } from 'react'
import { dashboardApi } from '../api'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  Utensils, Leaf, Users, Truck, Package, CheckCircle2,
  TrendingUp, Zap, Globe, TreePine
} from 'lucide-react'
import toast from 'react-hot-toast'

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#ec4899']

function StatCard({ icon: Icon, label, value, color, suffix = '' }) {
  return (
    <div className="stat-card card-hover">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}20` }}>
          <Icon size={20} style={{ color }} />
        </div>
        <span className="text-sm" style={{ color: '#9ca3af' }}>{label}</span>
      </div>
      <div className="impact-number" style={{ fontSize: '1.75rem', background: `linear-gradient(135deg, ${color}, ${color}99)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([dashboardApi.getStats(), dashboardApi.getAnalytics()])
      .then(([s, a]) => {
        setStats(s.data)
        setAnalytics(a.data)
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full border-4 border-t-transparent spinner mx-auto mb-4"
          style={{ borderColor: '#10b981', borderTopColor: 'transparent' }} />
        <p style={{ color: '#9ca3af' }}>Loading AI Analytics...</p>
      </div>
    </div>
  )

  const overview = stats?.overview || {}
  const impact = stats?.impact || {}
  const trends = analytics?.trends || {}
  const aiInsights = analytics?.ai_insights || {}

  const pieData = (trends.category_breakdown || []).map((c, i) => ({
    name: c.category?.replace('_', ' '), value: c.count,
  }))

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'Outfit' }}>
          Platform Dashboard
        </h1>
        <p style={{ color: '#9ca3af' }}>Real-time insights powered by AI agents</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Package} label="Total Donations" value={overview.total_donations} color="#10b981" />
        <StatCard icon={Users} label="Active NGOs" value={overview.active_ngos} color="#6366f1" />
        <StatCard icon={Truck} label="Volunteers" value={overview.active_volunteers} color="#3b82f6" />
        <StatCard icon={Utensils} label="Meals Saved" value={impact.meals_saved} color="#f59e0b" />
        <StatCard icon={CheckCircle2} label="Deliveries" value={overview.successful_deliveries} color="#10b981" />
        <StatCard icon={Package} label="Pending Pickups" value={overview.pending_pickups} color="#ec4899" />
      </div>

      {/* Impact Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Leaf, label: 'Food Saved', value: impact.total_kg_redistributed, suffix: ' kg', color: '#10b981' },
          { icon: Users, label: 'People Fed', value: impact.people_fed, color: '#6366f1' },
          { icon: Globe, label: 'CO₂ Saved', value: impact.carbon_footprint_saved_kg, suffix: ' kg', color: '#3b82f6' },
          { icon: TreePine, label: 'Trees Equivalent', value: impact.equivalent_trees_planted, color: '#059669' },
        ].map(i => (
          <div key={i.label} className="glass p-4 card-hover text-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ background: `${i.color}20` }}>
              <i.icon size={20} style={{ color: i.color }} />
            </div>
            <div className="text-xl font-bold" style={{ color: i.color }}>
              {(i.value || 0).toLocaleString()}{i.suffix || ''}
            </div>
            <div className="text-xs mt-1" style={{ color: '#9ca3af' }}>{i.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="glass-dark p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={18} style={{ color: '#10b981' }} />
            Monthly Donation Trend
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trends.monthly_donations || []}>
              <defs>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                labelStyle={{ color: '#f9fafb' }}
              />
              <Area type="monotone" dataKey="kg" stroke="#10b981" fill="url(#greenGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="glass-dark p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Utensils size={18} style={{ color: '#f59e0b' }} />
            Food Category Breakdown
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48" style={{ color: '#9ca3af' }}>
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* NGO Performance */}
      {analytics?.ngo_performance?.length > 0 && (
        <div className="glass-dark p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Zap size={18} style={{ color: '#6366f1' }} />
            NGO Performance
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.ngo_performance.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="ngo_name" stroke="#6b7280" tick={{ fontSize: 10 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              <Bar dataKey="acceptance_rate" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* AI Insights */}
      {aiInsights.key_insight && (
        <div className="glass p-6" style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Zap size={20} style={{ color: '#10b981' }} />
            <h3 className="font-semibold gradient-text">AI Insights</h3>
          </div>
          <p className="text-sm mb-4" style={{ color: '#d1fae5' }}>{aiInsights.key_insight}</p>
          {aiInsights.success_message && (
            <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7' }}>
              🎉 {aiInsights.success_message}
            </div>
          )}
          {aiInsights.recommendations && (
            <div className="mt-3 space-y-2">
              {aiInsights.improvement_areas?.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-sm" style={{ color: '#9ca3af' }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />
                  {a}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
