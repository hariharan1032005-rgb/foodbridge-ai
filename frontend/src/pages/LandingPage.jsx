import { Link } from 'react-router-dom'
import {
  Leaf, Zap, Globe, Users, Truck, BarChart3,
  ArrowRight, CheckCircle2, Star, TreePine, Utensils, Shield
} from 'lucide-react'

const STATS = [
  { value: '10K+', label: 'Meals Saved', icon: Utensils, color: '#10b981' },
  { value: '500+', label: 'Donations', icon: Leaf, color: '#059669' },
  { value: '50+', label: 'NGOs Served', icon: Users, color: '#6366f1' },
  { value: '95%', label: 'Match Success', icon: CheckCircle2, color: '#f59e0b' },
]

const FEATURES = [
  {
    icon: Zap,
    color: '#10b981',
    title: 'AI Food Analysis',
    desc: 'Gemini-powered freshness scoring and shelf-life prediction ensures only quality food reaches beneficiaries.',
  },
  {
    icon: Users,
    color: '#6366f1',
    title: 'Smart NGO Matching',
    desc: 'Multi-factor AI matching considers proximity, capacity, food preferences, and real-time demand for perfect pairing.',
  },
  {
    icon: BarChart3,
    color: '#f59e0b',
    title: 'Demand Forecasting',
    desc: 'ML-driven predictions help NGOs plan ahead and reduce food shortages with confidence scores.',
  },
  {
    icon: Truck,
    color: '#3b82f6',
    title: 'Route Optimization',
    desc: 'OpenStreetMap-integrated route planning minimizes delivery time and maximizes volunteer efficiency.',
  },
  {
    icon: Globe,
    color: '#ec4899',
    title: 'Impact Analytics',
    desc: 'Real-time dashboards track CO₂ saved, meals served, and community impact with rich visualizations.',
  },
  {
    icon: Shield,
    color: '#8b5cf6',
    title: 'Secure & Scalable',
    desc: 'JWT auth, role-based access, async FastAPI backend, and PostgreSQL ensure enterprise-grade reliability.',
  },
]

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Director, Asha NGO',
    text: 'FoodBridge AI transformed how we receive donations. The AI matching is incredibly accurate — we never receive food we cannot use.',
    rating: 5,
  },
  {
    name: 'Rajesh Kumar',
    role: 'Restaurant Owner & Donor',
    text: 'Posting a donation takes 30 seconds. The AI analysis tells me exactly how fresh my food is. Amazing platform!',
    rating: 5,
  },
  {
    name: 'Ananya Patel',
    role: 'Volunteer Coordinator',
    text: 'Route optimization has cut our delivery time by 40%. We serve twice as many NGOs with the same team.',
    rating: 5,
  },
]

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--bg-dark)', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Leaf size={20} color="white" />
          </div>
          <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem' }}
            className="gradient-text">FoodBridge AI</span>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/login" style={{
            color: '#9ca3af', textDecoration: 'none', fontSize: 14,
            fontWeight: 500, transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.target.style.color = '#f9fafb'}
            onMouseLeave={e => e.target.style.color = '#9ca3af'}
          >Sign In</Link>
          <Link to="/register">
            <button className="btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
              Get Started
            </button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section style={{ paddingTop: '8rem', paddingBottom: '6rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* bg orbs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute', top: '10%', left: '20%',
            width: 600, height: 600, borderRadius: '50%', opacity: 0.07,
            background: 'radial-gradient(circle, #10b981, transparent)', filter: 'blur(80px)',
          }} />
          <div style={{
            position: 'absolute', bottom: '10%', right: '15%',
            width: 500, height: 500, borderRadius: '50%', opacity: 0.07,
            background: 'radial-gradient(circle, #6366f1, transparent)', filter: 'blur(80px)',
          }} />
          <div style={{
            position: 'absolute', top: '40%', right: '30%',
            width: 300, height: 300, borderRadius: '50%', opacity: 0.05,
            background: 'radial-gradient(circle, #f59e0b, transparent)', filter: 'blur(60px)',
          }} />
        </div>

        <div className="animate-fade-in" style={{ maxWidth: 800, margin: '0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 1 }}>
          {/* Pill badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 999,
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            marginBottom: '2rem',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} className="animate-pulse-glow" />
            <span style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>
              Powered by Google Gemini & LangGraph
            </span>
          </div>

          <h1 style={{
            fontFamily: 'Outfit', fontWeight: 800,
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            lineHeight: 1.1, marginBottom: '1.5rem',
          }}>
            <span className="gradient-text">AI-Powered</span>
            <br />
            Food Waste Redistribution
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: '#9ca3af',
            lineHeight: 1.7, maxWidth: 600, margin: '0 auto 2.5rem',
          }}>
            Connect food donors with NGOs using an 8-agent AI system that analyzes freshness,
            predicts demand, optimizes routes, and maximizes social impact — in real time.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register">
              <button className="btn-primary" style={{
                padding: '0.875rem 2rem', fontSize: '1rem',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                Start Donating <ArrowRight size={18} />
              </button>
            </Link>
            <Link to="/login">
              <button className="btn-secondary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
                NGO / Volunteer Login
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ──────────────────────────────────────────────── */}
      <section style={{ padding: '3rem 2rem', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem',
        }}>
          {STATS.map(({ value, label, icon: Icon, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `${color}18`, margin: '0 auto 0.75rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={22} color={color} />
              </div>
              <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '2.25rem', color }}>
                {value}
              </div>
              <div style={{ color: '#9ca3af', fontSize: 14, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section style={{ padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: 12 }}>
              8-Agent <span className="gradient-text">AI Architecture</span>
            </h2>
            <p style={{ color: '#9ca3af', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
              Each agent specializes in one task, working together to automate the entire food redistribution pipeline.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}>
            {FEATURES.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="glass card-hover" style={{ padding: '1.75rem' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: `${color}18`, marginBottom: '1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={22} color={color} />
                </div>
                <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 8, color: '#f9fafb' }}>{title}</h3>
                <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────── */}
      <section style={{ padding: '4rem 2rem', background: 'rgba(17,24,39,0.5)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginBottom: '3rem' }}>
            How It <span className="gradient-text">Works</span>
          </h2>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem', position: 'relative',
          }}>
            {[
              { step: '01', title: 'Post Donation', desc: 'Donors post food with details. AI instantly analyzes freshness and urgency.', color: '#10b981' },
              { step: '02', title: 'AI Matching', desc: 'Smart matching engine finds the best NGO based on 7+ factors.', color: '#6366f1' },
              { step: '03', title: 'Route Planning', desc: 'Volunteer gets optimized pickup route via OpenStreetMap integration.', color: '#f59e0b' },
              { step: '04', title: 'Impact Tracked', desc: 'Delivery confirmed, meals counted, CO₂ saved — all auto-logged.', color: '#3b82f6' },
            ].map(({ step, title, desc, color }) => (
              <div key={step} style={{ position: 'relative' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: `${color}20`, border: `2px solid ${color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem',
                  fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', color,
                }}>
                  {step}
                </div>
                <h3 style={{ fontWeight: 600, marginBottom: 8 }}>{title}</h3>
                <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────── */}
      <section style={{ padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', textAlign: 'center', marginBottom: '3rem' }}>
            Trusted by <span className="gradient-text">Communities</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {TESTIMONIALS.map(({ name, role, text, rating }) => (
              <div key={name} className="glass-dark card-hover" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: '1rem' }}>
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <p style={{ color: '#d1fae5', lineHeight: 1.7, fontSize: 14, marginBottom: '1.25rem' }}>
                  "{text}"
                </p>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>{role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section style={{ padding: '5rem 2rem', textAlign: 'center' }}>
        <div className="glass" style={{
          maxWidth: 700, margin: '0 auto', padding: '4rem 2rem',
          border: '1px solid rgba(16,185,129,0.2)',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(99,102,241,0.08))',
        }}>
          <TreePine size={48} color="#10b981" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '1rem' }}>
            Ready to Reduce Food Waste?
          </h2>
          <p style={{ color: '#9ca3af', marginBottom: '2rem', lineHeight: 1.7 }}>
            Join FoodBridge AI and become part of a community that has saved thousands of meals
            from going to waste and fed thousands of people.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register">
              <button className="btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                Join as Donor <ArrowRight size={18} />
              </button>
            </Link>
            <Link to="/register">
              <button className="btn-secondary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
                Register as NGO
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '2rem',
        textAlign: 'center',
        color: '#6b7280',
        fontSize: 13,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <Leaf size={16} color="#10b981" />
          <span style={{ fontFamily: 'Outfit', fontWeight: 600, color: '#10b981' }}>FoodBridge AI</span>
        </div>
        <p>© 2025 FoodBridge AI. Reducing food waste with artificial intelligence.</p>
      </footer>
    </div>
  )
}
