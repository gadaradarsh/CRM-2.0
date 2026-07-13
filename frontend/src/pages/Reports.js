import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Reports = () => {
  const { addToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [sRes, pRes, rRes] = await Promise.all([
          reportsAPI.getSummary(),
          reportsAPI.getEmployeePerformance(),
          reportsAPI.getRevenueReport(period)
        ]);
        setSummary(sRes.data.data);
        setPerformance(pRes.data.data || []);
        setRevenue(rRes.data.data || []);
      } catch { addToast('Failed to load reports', 'error'); }
      finally { setLoading(false); }
    };
    load();
  }, [period, addToast]);

  if (loading) return <LoadingSpinner />;

  const maxRevenue = Math.max(...revenue.map(r => r.total), 1);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Reports & Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Global performance overview</p>
        </div>
      </div>

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Clients', value: summary.totalClients, icon: '👥', sub: `${summary.wonClients} won` },
            { label: 'Total Revenue', value: `₹${((summary.totalRevenue || 0) / 1000).toFixed(1)}K`, icon: '💰' },
            { label: 'Total Tasks', value: summary.totalTasks, icon: '✅', sub: `${summary.completedTasks} completed` },
            { label: 'Win Rate', value: summary.totalClients ? `${Math.round((summary.wonClients / summary.totalClients) * 100)}%` : '0%', icon: '🏆' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="flex justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{s.label}</p>
                  <p className="text-3xl font-bold text-white mt-1">{s.value}</p>
                  {s.sub && <p className="text-xs text-slate-500 mt-1">{s.sub}</p>}
                </div>
                <span className="text-2xl">{s.icon}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Revenue Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">Revenue Trend</h2>
          <div className="flex gap-2">
            {['monthly', 'yearly'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all
                  ${period === p ? 'bg-primary-600 border-primary-500 text-white' : 'border-surface-border text-slate-400'}`}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {revenue.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-3xl mb-2">📈</p>
            <p>No revenue data yet</p>
          </div>
        ) : (
          <div className="flex items-end gap-2 h-40">
            {revenue.map((r, i) => {
              const pct = (r.total / maxRevenue) * 100;
              const label = period === 'monthly' ? months[(r._id.month - 1)] : `${r._id.year}`;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full">
                    <div className="absolute bottom-0 w-full bg-primary-600/30 rounded-t-lg group-hover:bg-primary-500/40 transition-all"
                      style={{ height: `${Math.max(pct, 4)}%`, minHeight: '4px' }} />
                  </div>
                  <div className="bg-primary-600 w-full rounded-t-lg transition-all group-hover:bg-primary-500"
                    style={{ height: `${Math.max(pct, 4)}%` }} />
                  <p className="text-xs text-slate-500 truncate w-full text-center">{label}</p>
                  <p className="text-xs text-primary-400 font-medium">₹{(r.total / 1000).toFixed(1)}K</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Employee Performance */}
      <div className="card">
        <h2 className="section-title mb-4">Employee Performance</h2>
        {performance.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p className="text-3xl mb-2">👤</p>
            <p>No employees yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-surface-border">
                <th className="text-left px-3 py-2 text-xs text-slate-400 font-semibold uppercase">Employee</th>
                <th className="text-center px-3 py-2 text-xs text-slate-400 font-semibold uppercase">Clients</th>
                <th className="text-center px-3 py-2 text-xs text-slate-400 font-semibold uppercase">Won</th>
                <th className="text-center px-3 py-2 text-xs text-slate-400 font-semibold uppercase">Tasks</th>
                <th className="text-center px-3 py-2 text-xs text-slate-400 font-semibold uppercase">Completion</th>
                <th className="text-center px-3 py-2 text-xs text-slate-400 font-semibold uppercase">Revenue</th>
              </tr></thead>
              <tbody>
                {performance.map(p => (
                  <tr key={p.employee._id} className="table-row">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center text-xs font-bold text-primary-300">
                          {p.employee.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{p.employee.name}</p>
                          <p className="text-xs text-slate-500">{p.employee.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-sm text-white">{p.clients}</td>
                    <td className="px-3 py-3 text-center text-sm text-green-400 font-semibold">{p.wonClients}</td>
                    <td className="px-3 py-3 text-center text-sm text-white">{p.tasks}</td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-1.5 w-20 bg-surface rounded-full overflow-hidden">
                          <div className="h-full bg-primary-500 rounded-full" style={{ width: `${p.taskCompletionRate}%` }} />
                        </div>
                        <span className="text-xs text-primary-400">{p.taskCompletionRate}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-sm font-semibold text-white">₹{p.totalExpenses.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
