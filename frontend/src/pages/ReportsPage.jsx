import { useEffect, useState } from 'react'
import { reportsApi } from '../api'
import { BarChart3, Download, FileText, Leaf, Users, Package } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchReport = async () => {
    setLoading(true)
    try {
      const r = await reportsApi.getAnalyticsReport()
      setReport(r.data)
    } catch { toast.error('Failed to generate report') }
    finally { setLoading(false) }
  }

  const downloadCSV = async () => {
    try {
      const res = await reportsApi.getDonationReport('csv')
      const blob = new Blob([res.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'donation_report.csv'; a.click()
      toast.success('CSV downloaded!')
    } catch { toast.error('Download failed') }
  }

  useEffect(() => { fetchReport() }, [])

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'Outfit' }}>Reports & Analytics</h1>
          <p style={{ color: '#9ca3af' }}>AI-generated platform reports</p>
        </div>
        <div className="flex gap-3">
          <button onClick={downloadCSV} className="btn-secondary flex items-center gap-2">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={fetchReport} className="btn-primary flex items-center gap-2">
            <BarChart3 size={16} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent spinner"
            style={{ borderColor: '#10b981', borderTopColor: 'transparent' }} />
        </div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Package, label: 'Total Donations', value: report.summary?.total_donations, color: '#10b981' },
              { icon: Users, label: 'Active NGOs', value: report.summary?.total_ngos, color: '#6366f1' },
              { icon: Leaf, label: 'Food Redistributed', value: `${report.summary?.total_kg_donated} kg`, color: '#f59e0b' },
              { icon: BarChart3, label: 'Meals Saved', value: report.summary?.meals_saved, color: '#3b82f6' },
            ].map(c => (
              <div key={c.label} className="stat-card">
                <div className="flex items-center gap-2 mb-2">
                  <c.icon size={18} style={{ color: c.color }} />
                  <span className="text-xs" style={{ color: '#9ca3af' }}>{c.label}</span>
                </div>
                <div className="text-xl font-bold" style={{ color: c.color }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Impact Highlights */}
          {report.platform_highlights && (
            <div className="glass-dark p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Leaf size={18} style={{ color: '#10b981' }} /> Platform Highlights
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {report.platform_highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#10b981' }} />
                    <span className="text-sm">{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Impact Metrics */}
          {report.impact_metrics && (
            <div className="glass-dark p-6">
              <h3 className="font-semibold mb-4">Environmental Impact</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: 'CO₂ Saved', value: `${report.impact_metrics.carbon_footprint_saved_kg} kg`, desc: 'Carbon footprint prevented' },
                  { label: 'Trees Equivalent', value: report.impact_metrics.equivalent_trees_planted, desc: 'Trees planted equivalent' },
                  { label: 'Calories Provided', value: report.impact_metrics.calories_provided?.toLocaleString(), desc: 'kcal distributed' },
                ].map(m => (
                  <div key={m.label} className="text-center p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="text-xl font-bold gradient-text">{m.value}</div>
                    <div className="text-sm font-medium mt-1">{m.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{m.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
