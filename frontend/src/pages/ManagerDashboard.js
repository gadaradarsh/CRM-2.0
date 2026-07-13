import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI, activitiesAPI } from '../utils/api';
import { useUser } from '../context/UserContext';
import LoadingSpinner from '../components/LoadingSpinner';

const STATUS_CONFIG = {
  new:       { color: '#2563eb', bg: '#eff6ff', bar: 'linear-gradient(90deg, #3b82f6, #60a5fa)' },
  contacted: { color: '#d97706', bg: '#fffbeb', bar: 'linear-gradient(90deg, #f59e0b, #fbbf24)' },
  qualified: { color: '#7c3aed', bg: '#f5f3ff', bar: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' },
  won:       { color: '#059669', bg: '#ecfdf5', bar: 'linear-gradient(90deg, #10b981, #34d399)' },
  lost:      { color: '#e11d48', bg: '#fff1f2', bar: 'linear-gradient(90deg, #f43f5e, #fb7185)' },
};

const ACTIVITY_ICONS = {
  call: { icon: '📞', bg: '#eff6ff', color: '#2563eb' },
  email: { icon: '📧', bg: '#f0fdf4', color: '#16a34a' },
  meeting: { icon: '🤝', bg: '#f5f3ff', color: '#7c3aed' },
  note: { icon: '📝', bg: '#fffbeb', color: '#d97706' },
  'follow-up': { icon: '🔔', bg: '#fff1f2', color: '#e11d48' },
  demo: { icon: '💻', bg: '#ecfeff', color: '#0891b2' },
  proposal: { icon: '📋', bg: '#fdf4ff', color: '#a21caf' },
  other: { icon: '💬', bg: '#f8fafc', color: '#64748b' },
};

const STAT_CARDS = [
  {
    key: 'clients',
    label: 'Total Clients',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    iconBg: '#ede9ff', iconColor: '#6c63ff',
    accent: 'linear-gradient(135deg, #6c63ff 0%, #8b5cf6 100%)',
    accentShadow: 'rgba(108,99,255,0.3)',
  },
  {
    key: 'revenue',
    label: 'Total Revenue',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconBg: '#ecfdf5', iconColor: '#059669',
    accent: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    accentShadow: 'rgba(16,185,129,0.3)',
  },
  {
    key: 'tasks',
    label: 'Total Tasks',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    iconBg: '#eff6ff', iconColor: '#2563eb',
    accent: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    accentShadow: 'rgba(59,130,246,0.3)',
  },
  {
    key: 'winrate',
    label: 'Win Rate',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    iconBg: '#fffbeb', iconColor: '#d97706',
    accent: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    accentShadow: 'rgba(245,158,11,0.3)',
  },
];

const ManagerDashboard = () => {
  const { user } = useUser();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sRes, aRes] = await Promise.all([
          reportsAPI.getSummary(),
          activitiesAPI.getAllActivities({ limit: 8 }),
        ]);
        setStats(sRes.data.data);
        setActivities(aRes.data.data || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <LoadingSpinner />;

  const statusMap = Object.fromEntries((stats?.clientsByStatus || []).map(s => [s._id, s.count]));
  const total = stats?.totalClients || 1;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const statValues = [
    { value: stats?.totalClients ?? 0, sub: `${stats?.wonClients ?? 0} won` },
    { value: `₹${((stats?.totalRevenue || 0) / 1000).toFixed(1)}K`, sub: 'total expenses' },
    { value: stats?.totalTasks ?? 0, sub: `${stats?.completedTasks ?? 0} completed` },
    { value: stats?.totalClients ? `${Math.round(((stats.wonClients || 0) / stats.totalClients) * 100)}%` : '0%', sub: 'conversion' },
  ];

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#1e1b4b' }}>
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
            Here's what's happening in your CRM today.
          </p>
        </div>
        <Link to="/clients" className="btn-primary text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Client
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STAT_CARDS.map((card, i) => (
          <div key={card.key} className="stat-card" style={{ animationDelay: `${i * 60}ms` }}>
            {/* Top bar accent */}
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
              style={{ background: card.accent }} />
            <div className="flex items-start justify-between mt-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>
                  {card.label}
                </p>
                <p className="text-3xl font-black tracking-tight" style={{ color: '#1e1b4b' }}>
                  {statValues[i].value}
                </p>
                <p className="text-xs mt-1 font-medium" style={{ color: '#94a3b8' }}>
                  {statValues[i].sub}
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: card.iconBg, color: card.iconColor }}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline + Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

        {/* Pipeline */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Sales Pipeline</h2>
            <Link to="/clients" className="text-xs font-semibold" style={{ color: '#6c63ff' }}>
              View all →
            </Link>
          </div>
          <div className="space-y-4">
            {['new', 'contacted', 'qualified', 'won', 'lost'].map(s => {
              const count = statusMap[s] || 0;
              const pct = Math.round((count / total) * 100);
              const cfg = STATUS_CONFIG[s];
              return (
                <div key={s}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: cfg.color }} />
                      <span className="text-sm font-semibold capitalize" style={{ color: '#1e1b4b' }}>{s}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: '#1e1b4b' }}>{count}</span>
                      <span className="text-xs" style={{ color: '#94a3b8' }}>{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f0efff' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: cfg.bar }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Recent Activities</h2>
          </div>
          {activities.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>No activities yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {activities.slice(0, 6).map(a => {
                const cfg = ACTIVITY_ICONS[a.type] || ACTIVITY_ICONS.other;
                return (
                  <div key={a._id} className="flex items-center gap-3 p-2.5 rounded-xl transition-colors"
                    onMouseEnter={e => e.currentTarget.style.background = '#faf9ff'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                      style={{ background: cfg.bg }}>
                      {cfg.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: '#1e1b4b' }}>{a.title}</p>
                      <p className="text-xs" style={{ color: '#94a3b8' }}>
                        {a.clientId?.name} · {new Date(a.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-lg font-medium flex-shrink-0 capitalize"
                      style={{ background: cfg.bg, color: cfg.color }}>
                      {a.type}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: '/employees', icon: '👤', label: 'Employees', color: '#ede9ff', text: '#6c63ff' },
          { to: '/reports',   icon: '📊', label: 'Reports',   color: '#ecfdf5', text: '#059669' },
          { to: '/invoices',  icon: '🧾', label: 'Invoices',  color: '#eff6ff', text: '#2563eb' },
          { to: '/tasks',     icon: '✅', label: 'Tasks',     color: '#fffbeb', text: '#d97706' },
        ].map(item => (
          <Link key={item.to} to={item.to}
            className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-surface-border group transition-all duration-200"
            style={{ boxShadow: '0 2px 12px rgba(108,99,255,0.06)' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(108,99,255,0.14)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(108,99,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            <span className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: item.color }}>
              {item.icon}
            </span>
            <span className="text-sm font-semibold" style={{ color: '#1e1b4b' }}>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ManagerDashboard;
