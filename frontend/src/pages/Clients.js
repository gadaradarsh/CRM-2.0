import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { clientsAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';
import ClientForm from '../components/ClientForm';
import LoadingSpinner from '../components/LoadingSpinner';

const statusColors = { new: 'badge-new', contacted: 'badge-contacted', qualified: 'badge-qualified', won: 'badge-won', lost: 'badge-lost' };

const Clients = () => {
  const { addToast } = useToast();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await clientsAPI.getClients(params);
      setClients(res.data.clients || []);
    } catch { addToast('Failed to load clients', 'error'); }
    finally { setLoading(false); }
  }, [statusFilter, addToast]);

  useEffect(() => { load(); }, [load]);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (data) => {
    setFormLoading(true);
    try {
      await clientsAPI.createClient(data);
      addToast('Client added successfully!', 'success');
      setShowForm(false);
      load();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add client', 'error');
    } finally { setFormLoading(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await clientsAPI.deleteClient(id);
      addToast('Client deleted', 'success');
      load();
    } catch (err) { addToast(err.response?.data?.message || 'Delete failed', 'error'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Clients</h1>
          <p className="text-slate-400 text-sm mt-1">{clients.length} total clients</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Add Client</button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input className="input flex-1" placeholder="Search by name, company, email..." value={search}
          onChange={e => setSearch(e.target.value)} />
        <select className="input sm:w-48" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {['new', 'contacted', 'qualified', 'won', 'lost'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? <LoadingSpinner size="md" /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Assigned To</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Value</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500">
                  <p className="text-3xl mb-2">👥</p>
                  <p>{search ? 'No clients match your search' : 'No clients yet — add your first one!'}</p>
                </td></tr>
              ) : filtered.map(c => (
                <tr key={c._id} className="table-row">
                  <td className="px-4 py-3">
                    <Link to={`/clients/${c._id}`} className="group">
                      <p className="text-sm font-semibold text-white group-hover:text-primary-400 transition-colors">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.email}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300 hidden md:table-cell">{c.company}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${statusColors[c.status] || 'badge-new'}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400 hidden lg:table-cell">
                    {c.assignedTo?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300 hidden lg:table-cell">
                    {c.estimatedValue > 0 ? `₹${c.estimatedValue.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link to={`/clients/${c._id}`} className="text-xs text-primary-400 hover:text-primary-300 font-medium">View</Link>
                      <button onClick={() => handleDelete(c._id, c.name)} className="text-xs text-red-400 hover:text-red-300 font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Client Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <ClientForm onSubmit={handleCreate} onClose={() => setShowForm(false)} loading={formLoading} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
