import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const { login } = useUser();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      login(res.data.user);
      addToast(`Welcome back, ${res.data.user.name}! 👋`, 'success');
      navigate('/dashboard');
    } catch (err) {
      addToast(err.response?.data?.message || 'Invalid credentials. Please try again.', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#f5f4ff' }}>

      {/* Left — decorative */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative overflow-hidden flex-col items-center justify-center"
        style={{ background: 'linear-gradient(145deg, #6c63ff 0%, #5a4fff 40%, #4d3fe8 100%)' }}>

        {/* Floating shapes */}
        <div className="absolute top-16 right-16 w-32 h-32 rounded-3xl rotate-12 opacity-20"
          style={{ background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' }} />
        <div className="absolute bottom-24 left-12 w-20 h-20 rounded-2xl -rotate-6 opacity-20"
          style={{ background: 'rgba(255,255,255,0.4)' }} />
        <div className="absolute top-1/3 left-8 w-3 h-3 rounded-full bg-white opacity-40 animate-float" />
        <div className="absolute bottom-1/3 right-12 w-2 h-2 rounded-full bg-white opacity-30 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-8 w-4 h-4 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.6)', animationDelay: '1s' }} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }} />

        {/* Content */}
        <div className="relative z-10 px-12 text-center">
          <div className="w-20 h-20 rounded-3xl bg-white mx-auto mb-8 flex items-center justify-center font-black text-3xl"
            style={{ color: '#5a4fff', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            C
          </div>
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">CRM Manager</h1>
          <p className="text-white/70 text-base leading-relaxed mb-12 max-w-xs mx-auto">
            Your all-in-one workspace for clients, teams, and revenue.
          </p>

          <div className="space-y-3 text-left max-w-xs mx-auto">
            {[
              { icon: '🚀', label: 'Role-based access control' },
              { icon: '📊', label: 'Real-time analytics & reports' },
              { icon: '💼', label: 'Client pipeline management' },
              { icon: '🧾', label: 'Invoice & expense tracking' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-white/80">
                <span className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-base flex-shrink-0">
                  {f.icon}
                </span>
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-lg"
              style={{ background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)', boxShadow: '0 4px 14px rgba(108,99,255,0.4)' }}>
              C
            </div>
            <span className="font-extrabold text-xl" style={{ color: '#1e1b4b' }}>CRM Manager</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black tracking-tight" style={{ color: '#1e1b4b' }}>Welcome back</h2>
            <p className="mt-2 text-sm" style={{ color: '#64748b' }}>Sign in to continue to your workspace.</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl p-8"
            style={{ boxShadow: '0 4px 32px rgba(108,99,255,0.1), 0 1px 4px rgba(0,0,0,0.04)', border: '1px solid #ede9ff' }}>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#c7c4ff' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input id="email" name="email" type="email" className="input pl-10"
                    value={form.email} onChange={handleChange}
                    placeholder="you@company.com" required autoComplete="email" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#c7c4ff' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input id="password" name="password" type={showPass ? 'text' : 'password'}
                    className="input pl-10 pr-10"
                    value={form.password} onChange={handleChange}
                    placeholder="••••••••" required autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#c7c4ff' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#6c63ff'}
                    onMouseLeave={e => e.currentTarget.style.color = '#c7c4ff'}>
                    {showPass
                      ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    }
                  </button>
                </div>
              </div>

              <button id="login-btn" type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-1">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign in
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: '#ede9ff' }} />
              <span className="text-xs font-medium" style={{ color: '#c7c4ff' }}>or</span>
              <div className="flex-1 h-px" style={{ background: '#ede9ff' }} />
            </div>

            {/* Google */}
            <button id="google-login-btn" onClick={() => (window.location.href = '/api/auth/google')}
              className="btn-secondary w-full py-3">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <p className="text-center text-sm mt-6" style={{ color: '#94a3b8' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold transition-colors"
              style={{ color: '#6c63ff' }}
              onMouseEnter={e => e.target.style.color = '#4d3fe8'}
              onMouseLeave={e => e.target.style.color = '#6c63ff'}>
              Create one free →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
