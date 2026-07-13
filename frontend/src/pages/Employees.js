import React, { useState, useEffect } from 'react';
import { usersAPI, clientsAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Employees = () => {
  const { addToast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    usersAPI.getEmployees()
      .then(r => setEmployees(r.data.employees || []))
      .catch(() => addToast('Failed to load employees', 'error'))
      .finally(() => setLoading(false));
  }, [addToast]);

  const viewEmployee = async (emp) => {
    setSelected(emp);
    try {
      const res = await clientsAPI.getClients({ assignedTo: emp._id });
      setClients(res.data.clients || []);
    } catch { setClients([]); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Employees</h1>
          <p className="text-slate-400 text-sm mt-1">{employees.length} active employees</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-slate-500">
            <p className="text-4xl mb-3">👤</p>
            <p>No employees registered yet</p>
          </div>
        ) : employees.map(emp => (
          <button key={emp._id} onClick={() => viewEmployee(emp)}
            className={`card text-left hover:border-primary-600 transition-all group ${selected?._id === emp._id ? 'border-primary-500' : ''}`}>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-full bg-primary-800 flex items-center justify-center text-primary-300 font-bold text-lg">
                {emp.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-white group-hover:text-primary-300 transition-colors">{emp.name}</p>
                <p className="text-sm text-slate-400">{emp.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge bg-primary-900/50 text-primary-300 border border-primary-700/50">Employee</span>
              <span className="text-xs text-slate-500 ml-auto">Click to view clients →</span>
            </div>
          </button>
        ))}
      </div>

      {/* Selected employee's clients */}
      {selected && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">{selected.name}'s Clients ({clients.length})</h2>
            <button onClick={() => { setSelected(null); setClients([]); }} className="text-slate-400 hover:text-white text-lg">✕</button>
          </div>
          {clients.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">No clients assigned to this employee.</p>
          ) : (
            <div className="divide-y divide-surface-border">
              {clients.map(c => (
                <div key={c._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.company} · {c.email}</p>
                  </div>
                  <span className={`badge badge-${c.status}`}>{c.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Employees;
