import React, { useState, useEffect, useCallback } from 'react';
import { tasksAPI, usersAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';
import LoadingSpinner from '../components/LoadingSpinner';

const statusCols = ['pending', 'in-progress', 'completed'];
const priorityColors = { high: 'text-red-400 border-red-800', medium: 'text-yellow-400 border-yellow-800', low: 'text-green-400 border-green-800' };

const Tasks = () => {
  const { user } = useUser();
  const { addToast } = useToast();
  const isManager = user?.role === 'manager';
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const [tRes, sRes] = await Promise.all([tasksAPI.getMyTasks(params), tasksAPI.getTaskStats()]);
      setTasks(tRes.data.tasks || []);
      setStats(sRes.data.stats);
    } catch { addToast('Failed to load tasks', 'error'); }
    finally { setLoading(false); }
  }, [statusFilter, addToast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (isManager) usersAPI.getEmployees().then(r => setEmployees(r.data.employees || [])).catch(() => {});
  }, [isManager]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await tasksAPI.createTask({ ...form, assignedTo: form.assignedTo || undefined });
      addToast('Task created!', 'success');
      setShowCreate(false);
      setForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' });
      load();
    } catch (err) { addToast(err.response?.data?.message || 'Failed', 'error'); }
    finally { setFormLoading(false); }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await tasksAPI.updateTaskStatus(taskId, { status });
      addToast('Status updated!', 'success');
      load();
    } catch { addToast('Update failed', 'error'); }
  };

  const handleDelete = async (taskId, title) => {
    if (!window.confirm(`Delete task "${title}"?`)) return;
    try { await tasksAPI.deleteTask(taskId); addToast('Task deleted', 'success'); load(); }
    catch (err) { addToast(err.response?.data?.message || 'Delete failed', 'error'); }
  };

  const tasksByStatus = (status) => tasks.filter(t => t.status === status);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Tasks</h1>
          <p className="text-slate-400 text-sm mt-1">{tasks.length} tasks total</p>
        </div>
        {isManager && <button onClick={() => setShowCreate(true)} className="btn-primary">+ New Task</button>}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-white' },
            { label: 'Pending', value: stats.pending, color: 'text-yellow-400' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-blue-400' },
            { label: 'Completed', value: stats.completed, color: 'text-green-400' },
            { label: 'Overdue', value: stats.overdue, color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="card text-center py-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'pending', 'in-progress', 'completed'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
              ${statusFilter === s ? 'bg-primary-600 border-primary-500 text-white' : 'border-surface-border text-slate-400 hover:border-slate-500'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Kanban Board */}
      {loading ? <LoadingSpinner size="md" /> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statusCols.map(col => (
            <div key={col} className="card p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white capitalize">{col.replace('-', ' ')}</h3>
                <span className="text-xs bg-surface text-slate-400 px-2 py-0.5 rounded-full border border-surface-border">{tasksByStatus(col).length}</span>
              </div>
              <div className="p-3 space-y-3 min-h-[200px]">
                {tasksByStatus(col).length === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-4">No tasks</p>
                ) : tasksByStatus(col).map(t => (
                  <div key={t._id} className={`bg-surface border rounded-xl p-3 space-y-2 border-l-4 ${priorityColors[t.priority]}`}>
                    <p className="text-sm font-semibold text-white">{t.title}</p>
                    {t.description && <p className="text-xs text-slate-500 line-clamp-2">{t.description}</p>}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                      <span className={`text-xs font-medium ${priorityColors[t.priority].split(' ')[0]}`}>{t.priority}</span>
                    </div>
                    {t.assignedTo && <p className="text-xs text-slate-500">👤 {t.assignedTo.name}</p>}
                    <div className="flex gap-2 pt-1">
                      {statusCols.filter(s => s !== col).map(s => (
                        <button key={s} onClick={() => handleStatusChange(t._id, s)}
                          className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                          → {s.replace('-', ' ')}
                        </button>
                      ))}
                      {isManager && (
                        <button onClick={() => handleDelete(t._id, t.title)} className="text-xs text-red-400 hover:text-red-300 ml-auto">Delete</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreate && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal">
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Create Task</h2>
              <div>
                <label className="label">Title *</label>
                <input className="input" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="Task title" required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={2} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="Details..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Priority</label>
                  <select className="input" value={form.priority} onChange={e => setForm(p => ({...p, priority: e.target.value}))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="label">Due Date *</label>
                  <input className="input" type="date" value={form.dueDate} onChange={e => setForm(p => ({...p, dueDate: e.target.value}))} required />
                </div>
              </div>
              {employees.length > 0 && (
                <div>
                  <label className="label">Assign To</label>
                  <select className="input" value={form.assignedTo} onChange={e => setForm(p => ({...p, assignedTo: e.target.value}))}>
                    <option value="">Select employee...</option>
                    {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-3">
                <button type="submit" disabled={formLoading} className="btn-primary flex-1">{formLoading ? 'Creating...' : 'Create Task'}</button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
