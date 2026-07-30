import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Utensils, Building2, Truck, BarChart3,
  Bell, Upload, LogOut, Leaf, Menu, X, CheckCircle2
} from 'lucide-react'

const navByRole = {
  admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/donations', icon: Utensils, label: 'Donations' },
    { to: '/post-donation', icon: Upload, label: 'Post Donation' },
    { to: '/reports', icon: BarChart3, label: 'Reports' },
  ],
  donor: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/donor-profile', icon: CheckCircle2, label: 'Donor Profile' },
    { to: '/donations', icon: Utensils, label: 'My Donations' },
    { to: '/post-donation', icon: Upload, label: 'Post Donation' },
  ],
  ngo: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/ngo-portal', icon: Building2, label: 'NGO Portal' },
    { to: '/reports', icon: BarChart3, label: 'Reports' },
  ],
  volunteer: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/pickups', icon: Truck, label: 'My Pickups' },
  ],
}

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const links = navByRole[user?.role] || navByRole.donor

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleColors = {
    admin: '#8b5cf6', donor: '#10b981', ngo: '#f59e0b', volunteer: '#3b82f6'
  }
  const roleColor = roleColors[user?.role] || '#10b981'

  return (
    <>
      <div className="sidebar flex flex-col" style={{ width: collapsed ? '72px' : '260px', transition: 'width 0.3s' }}>
        {/* Logo */}
        <div className="p-5 flex items-center gap-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Leaf size={20} className="text-white" />
          </div>
          {!collapsed && (
            <div>
              <div className="font-bold text-sm gradient-text" style={{ fontFamily: 'Outfit' }}>FoodBridge AI</div>
              <div className="text-xs" style={{ color: '#6b7280' }}>v1.0.0</div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto p-1 rounded-lg hover:opacity-70 transition-opacity"
            style={{ color: '#6b7280' }}>
            {collapsed ? <Menu size={16} /> : <X size={16} />}
          </button>
        </div>

        {/* User Badge */}
        {!collapsed && (
          <div className="mx-4 mt-4 p-3 rounded-xl" style={{ background: `${roleColor}15`, border: `1px solid ${roleColor}30` }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: roleColor }}>
                {user?.full_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-semibold">{user?.full_name}</div>
                <div className="text-xs capitalize" style={{ color: roleColor }}>{user?.role}</div>
              </div>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white'
                    : 'opacity-60 hover:opacity-100'
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? `${roleColor}20` : 'transparent',
                color: isActive ? roleColor : 'var(--text-primary)',
                borderLeft: isActive ? `3px solid ${roleColor}` : '3px solid transparent',
              })}>
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-4 space-y-1 border-t" style={{ borderColor: 'var(--border)' }}>
          <NavLink to="/notifications"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm opacity-60 hover:opacity-100 transition-opacity">
            <Bell size={18} />
            {!collapsed && 'Notifications'}
          </NavLink>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full text-left transition-all hover:bg-red-500/10 text-red-400 opacity-70 hover:opacity-100">
            <LogOut size={18} />
            {!collapsed && 'Logout'}
          </button>
        </div>
      </div>
    </>
  )
}
