import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI, tasksAPI } from '../utils/api';
import { useUser } from '../context/UserContext';
import LoadingSpinner from '../components/LoadingSpinner';

const EmployeeDashboard = () => {
  const { user } = useUser();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, tRes] = await Promise.all([
          reportsAPI.getEmployeeQuickStats(),
          tasksAPI.getMyTasks({ status: 'pending', limit: 5 })
        ]);
        setStats(sRes.data.data);
        setTasks(tRes.data.tasks || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  const priorityColor = { high: 'text-red-400', medium: 'text-yellow-400', low: 'text-green-400' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title text-2xl">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-slate-400 text-sm mt-1">Your personal workspace overview.</p>
        </div>
        <Link to="/clients" className="btn-primary text-sm">+ New Client</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Assigned Clients', value: stats?.assignedClients, icon: '👥' },
          { label: 'My Tasks', value: stats?.myTasks, icon: '✅', sub: `${stats?.pendingTasks || 0} pending` },
          { label: 'Total Expenses', value: `₹${((stats?.totalExpenses || 0)).toLocaleString()}`, icon: '💰' },
          { label: 'Pending Tasks', value: stats?.pendingTasks, icon: '⏳' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex justify-between">
              <div>
                <p className="text-slate-400 text-sm">{s.label}</p>
                <p className="text-3xl font-bold text-white mt-1">{s.value ?? '—'}</p>
                {s.sub && <p className="text-xs text-slate-500 mt-1">{s.sub}</p>}
              </div>
              <span className="text-2xl">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Clients */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">My Recent Clients</h2>
            <Link to="/clients" className="text-xs text-primary-400 hover:text-primary-300">View all →</Link>
          </div>
          {stats?.recentClients?.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-3xl mb-2">👥</p>
              <p className="text-sm">No clients assigned yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(stats?.recentClients || []).map(c => (
                <Link key={c._id} to={`/clients/${c._id}`}
                  className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-surface-hover transition-colors">
                  <div>
                    <p className="text-sm font-medium text-white">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.company}</p>
                  </div>
                  <span className={`badge badge-${c.status}`}>{c.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pending Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Pending Tasks</h2>
            <Link to="/tasks" className="text-xs text-primary-400 hover:text-primary-300">View all →</Link>
          </div>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-3xl mb-2">🎉</p>
              <p className="text-sm">All caught up! No pending tasks.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(t => (
                <div key={t._id} className="flex items-start gap-3 py-2 border-b border-surface-border last:border-0">
                  <div className="mt-1">
                    <div className={`w-2 h-2 rounded-full ${t.priority === 'high' ? 'bg-red-400' : t.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium">{t.title}</p>
                    <p className="text-xs text-slate-500">Due: {new Date(t.dueDate).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-semibold ${priorityColor[t.priority]}`}>{t.priority}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { to: '/expenses', icon: '💰', label: 'Log Expense' },
          { to: '/invoices', icon: '🧾', label: 'View Invoices' },
          { to: '/tasks', icon: '✅', label: 'My Tasks' },
        ].map(item => (
          <Link key={item.to} to={item.to}
            className="card flex items-center gap-3 hover:border-primary-700 transition-colors cursor-pointer group">
            <span className="text-2xl">{item.icon}</span>
            <span className="text-sm font-medium text-slate-300 group-hover:text-white">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
