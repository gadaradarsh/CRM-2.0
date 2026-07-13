import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';

const Register = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee' });
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }
    setLoading(true);
    try {
      await authAPI.register(form);
      addToast('Account created! Please log in.', 'success');
      navigate('/login');
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-4 glow">
            <span className="text-white font-bold text-2xl">C</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 mt-2 text-sm">Join your CRM workspace</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input id="reg-name" name="name" className="input" value={form.name} onChange={handleChange} placeholder="Jane Smith" required />
            </div>
            <div>
              <label className="label">Email address</label>
              <input id="reg-email" name="email" type="email" className="input" value={form.email} onChange={handleChange} placeholder="jane@company.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input id="reg-password" name="password" type="password" className="input" value={form.password} onChange={handleChange} placeholder="At least 6 characters" required />
            </div>
            <div>
              <label className="label">Role</label>
              <div className="grid grid-cols-2 gap-3">
                {['employee', 'manager'].map(r => (
                  <button key={r} type="button" onClick={() => setForm(p => ({ ...p, role: r }))}
                    className={`py-3 rounded-xl border text-sm font-medium transition-all duration-200
                      ${form.role === r ? 'bg-primary-600/20 border-primary-500 text-primary-300' : 'bg-surface border-surface-border text-slate-400 hover:border-slate-500'}`}>
                    {r === 'manager' ? '👑 Manager' : '💼 Employee'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {form.role === 'manager' ? 'Managers have full access to all clients, reports, and employee management.' : 'Employees can manage their assigned clients and tasks.'}
              </p>
            </div>

            <button id="register-btn" type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
