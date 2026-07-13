import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { authAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';

const Icon = ({ d, d2 }) => (
  <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    {d2 && <path strokeLinecap="round" strokeLinejoin="round" d={d2} />}
  </svg>
);

const navLinks = [
  { to: '/dashboard', label: 'Dashboard',
    icon: <Icon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    roles: ['manager', 'employee'] },
  { to: '/clients', label: 'Clients',
    icon: <Icon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
    roles: ['manager', 'employee'] },
  { to: '/tasks', label: 'Tasks',
    icon: <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
    roles: ['manager', 'employee'] },
  { to: '/expenses', label: 'Expenses',
    icon: <Icon d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    roles: ['manager', 'employee'] },
  { to: '/invoices', label: 'Invoices',
    icon: <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    roles: ['manager', 'employee'] },
  { to: '/employees', label: 'Employees',
    icon: <Icon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
    roles: ['manager'], badge: 'MGR' },
  { to: '/reports', label: 'Reports',
    icon: <Icon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    roles: ['manager'], badge: 'MGR' },
];

const Layout = ({ children }) => {
  const { user, logout: ctxLogout } = useUser();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch { }
    ctxLogout();
    addToast('Signed out successfully', 'success');
    navigate('/login');
  };

  const links = navLinks.filter(l => l.roles.includes(user?.role));
  const currentPage = links.find(l => location.pathname.startsWith(l.to))?.label || 'Dashboard';

  const SidebarContent = () => (
    <aside className="flex flex-col h-full w-64 flex-shrink-0 bg-white"
      style={{ borderRight: '1px solid #e8e6ff', boxShadow: '2px 0 20px rgba(108,99,255,0.06)' }}>

      {/* Logo */}
      <div className="px-5 py-5 flex-shrink-0" style={{ borderBottom: '1px solid #f0efff' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-base flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6c63ff 0%, #8b5cf6 100%)', boxShadow: '0 4px 14px rgba(108,99,255,0.4)' }}>
            C
          </div>
          <div>
            <p className="font-extrabold text-sm tracking-tight leading-none" style={{ color: '#1e1b4b' }}>CRM Manager</p>
            <p className="text-[10px] mt-0.5 font-medium tracking-widest uppercase" style={{ color: '#a5b4c8' }}>Workspace</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-3 text-[10px] font-bold tracking-widest uppercase" style={{ color: '#c7c4ff' }}>Menu</p>
        {links.map(l => (
          <NavLink key={l.to} to={l.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="flex-shrink-0">{l.icon}</span>
            <span className="flex-1">{l.label}</span>
            {l.badge && (
              <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md"
                style={{ background: '#ede9ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
                {l.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 flex-shrink-0" style={{ borderTop: '1px solid #f0efff', paddingTop: '12px' }}>
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl mb-1"
          style={{ background: '#faf9ff', border: '1px solid #ede9ff' }}>
          <div className="avatar w-8 h-8 text-sm">{user?.name?.charAt(0).toUpperCase()}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate" style={{ color: '#1e1b4b' }}>{user?.name}</p>
            <p className="text-xs font-medium capitalize" style={{ color: '#6c63ff' }}>{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 mt-1"
          style={{ color: '#94a3b8' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.color = '#e11d48'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f5f4ff' }}>

      {/* Desktop sidebar */}
      <div className="hidden md:flex"><SidebarContent /></div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(108,99,255,0.12)', backdropFilter: 'blur(4px)' }} />
          <div className="relative z-10 animate-slide-right" onClick={e => e.stopPropagation()}>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-3 flex-shrink-0 bg-white"
          style={{ borderBottom: '1px solid #ede9ff', boxShadow: '0 1px 12px rgba(108,99,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden btn-icon">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h2 className="text-sm font-bold" style={{ color: '#1e1b4b' }}>{currentPage}</h2>
              <p className="text-xs hidden sm:block" style={{ color: '#a5b4c8' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold capitalize"
              style={{
                background: user?.role === 'manager' ? '#ede9ff' : '#ecfdf5',
                color:      user?.role === 'manager' ? '#6c63ff' : '#059669',
                border:     `1.5px solid ${user?.role === 'manager' ? '#ddd6fe' : '#a7f3d0'}`,
              }}>
              <span className="w-1.5 h-1.5 rounded-full"
                style={{ background: user?.role === 'manager' ? '#6c63ff' : '#10b981' }} />
              {user?.role}
            </span>
            <div className="avatar w-8 h-8 text-xs cursor-pointer">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-grid" style={{ padding: '28px', animation: 'fadeInUp 0.4s ease-out' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
